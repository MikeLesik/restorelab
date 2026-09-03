/**
 * Single order (RL-410) — admin only (x-admin-token, wrong → 404).
 *
 * GET  /api/orders/:id            — full order incl. its event timeline.
 * PATCH /api/orders/:id           — field updates + status transitions.
 *   Status changes are validated against the state machine; every PATCH
 *   writes an order_events row (append-only audit).
 */

import {
  json, inert, notFound, adminOk, shapeOrder, logEvent, TRANSITIONS,
} from '../../_lib/orders';
import type { OrdersEnv, OrderStatus } from '../../_lib/orders';
import { fireStatusHooks } from '../../_lib/wa';

/**
 * DELETE /api/orders/:id (admin) — test-data cleanup ONLY.
 * Refuses anything not in `cancelled`: real history is never deletable,
 * cancel first (that alone already removes the order from every metric).
 * Removes the row, its event trail and its R2 photos.
 */
export async function onRequestDelete(context: {
  request: Request;
  env: OrdersEnv;
  params: { id: string };
}): Promise<Response> {
  const { request, env, params } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');
  const db = env.ORDERS_DB;

  const row = await db
    .prepare('SELECT id, status, photos FROM orders WHERE id = ? OR code = ?')
    .bind(params.id, params.id)
    .first<Record<string, unknown>>();
  if (!row) return json({ ok: false, reason: 'not_found' }, 404);
  if (row.status !== 'cancelled') {
    return json({ ok: false, reason: 'only_cancelled_deletable', status: row.status }, 409);
  }

  let photosDeleted = 0;
  if (env.PHOTOS) {
    for (const key of JSON.parse((row.photos as string) || '[]')) {
      try {
        await (env.PHOTOS as any).delete(key);
        photosDeleted++;
      } catch { /* best-effort */ }
    }
  }
  await db.prepare('DELETE FROM order_events WHERE order_id = ?').bind(row.id).run();
  await db.prepare('DELETE FROM orders WHERE id = ?').bind(row.id).run();
  return json({ ok: true, deleted: row.id, photos_deleted: photosDeleted });
}

/** Columns the admin may set directly. Status is handled separately. */
const EDITABLE: Record<string, 'text' | 'number' | 'json'> = {
  client_name: 'text',
  phone: 'text',
  area_slug: 'text',
  address: 'text',
  service_slug: 'text',
  size: 'text',
  lang: 'text',
  channel: 'text',
  quote_eur: 'number',
  quote_breakdown: 'json',
  partner_id: 'text',
  scheduled_at: 'text',
  notes: 'text',
  payment_link: 'text',
  payment_pref: 'text',
  paid_eur: 'number',
  paid_at: 'text',
  qc_status: 'text',
  rework: 'number',
  review_sent_at: 'text',
  ref_code: 'text',
  attr: 'json',
};

export async function onRequestGet(context: {
  request: Request;
  env: OrdersEnv;
  params: { id: string };
}): Promise<Response> {
  const { request, env, params } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');

  const row = await env.ORDERS_DB
    .prepare('SELECT * FROM orders WHERE id = ? OR code = ?')
    .bind(params.id, params.id)
    .first();
  if (!row) return json({ ok: false, reason: 'not_found' }, 404);

  const events = await env.ORDERS_DB
    .prepare('SELECT ts, type, data FROM order_events WHERE order_id = ? ORDER BY id ASC')
    .bind(row.id)
    .all();

  return json({
    ok: true,
    order: shapeOrder(row as Record<string, unknown>),
    events: (events.results || []).map((e) => ({
      ...e,
      data: typeof e.data === 'string' ? JSON.parse(e.data as string) : e.data,
    })),
  });
}

export async function onRequestPatch(context: {
  request: Request;
  env: OrdersEnv;
  params: { id: string };
}): Promise<Response> {
  const { request, env, params } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');
  const db = env.ORDERS_DB;

  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return json({ ok: false, reason: 'bad_json' }, 400);
  }

  const row = await db
    .prepare('SELECT * FROM orders WHERE id = ? OR code = ?')
    .bind(params.id, params.id)
    .first<Record<string, unknown>>();
  if (!row) return json({ ok: false, reason: 'not_found' }, 404);
  const orderId = row.id as string;

  const sets: string[] = [];
  const binds: unknown[] = [];
  const changed: Record<string, unknown> = {};

  // ── Status transition (validated against the state machine) ──
  if (b.status !== undefined) {
    const from = row.status as OrderStatus;
    const to = b.status as OrderStatus;
    if (!TRANSITIONS[from]) return json({ ok: false, reason: 'bad_current_status' }, 500);
    if (!TRANSITIONS[from].includes(to)) {
      return json(
        { ok: false, reason: 'illegal_transition', from, to, allowed: TRANSITIONS[from] },
        409,
      );
    }
    sets.push('status = ?');
    binds.push(to);
    changed.status = { from, to };
    // The rework counter is part of the QC contract, not a client choice.
    if (from === 'qc' && to === 'in_progress') {
      sets.push('rework = rework + 1');
      changed.rework = 'incremented';
    }
  }

  // ── Plain field updates (whitelisted) ──
  for (const [field, kind] of Object.entries(EDITABLE)) {
    if (b[field] === undefined || field === 'rework') continue;
    let value: unknown = b[field];
    if (value === null) {
      // explicit null clears the column
    } else if (kind === 'number') {
      value = Number(value);
      if (!Number.isFinite(value as number)) return json({ ok: false, reason: `bad_${field}` }, 400);
    } else if (kind === 'json') {
      if (typeof value !== 'object') return json({ ok: false, reason: `bad_${field}` }, 400);
      value = JSON.stringify(value).slice(0, 8192);
    } else {
      if (typeof value !== 'string') return json({ ok: false, reason: `bad_${field}` }, 400);
      value = value.slice(0, 1000);
    }
    sets.push(`${field} = ?`);
    binds.push(value);
    if (field !== 'status') changed[field] = value;
  }

  // Assigning a partner snapshots their CURRENT payout % onto the order:
  // renegotiating a partner's rate later must never rewrite statements for
  // work already accepted at the old rate.
  if (typeof b.partner_id === 'string' && b.partner_id) {
    const partner = await db
      .prepare('SELECT payout_pct, rc_expiry FROM partners WHERE id = ?')
      .bind(b.partner_id)
      .first<{ payout_pct: number; rc_expiry: string | null }>();
    if (!partner) return json({ ok: false, reason: 'partner_not_found' }, 400);
    // Hard-gate assignment server-side (mirrors the admin UI): the job needs an
    // address + a scheduled time, and the partner's RC insurance must not be
    // expired — so a direct PATCH can't dispatch an uninsured/unscheduled job.
    const addr = changed.address !== undefined ? changed.address : row.address;
    const when = changed.scheduled_at !== undefined ? changed.scheduled_at : row.scheduled_at;
    if (!addr || !when) return json({ ok: false, reason: 'need_address_and_schedule' }, 409);
    if (partner.rc_expiry) {
      const exp = Date.parse(partner.rc_expiry);
      if (!Number.isNaN(exp) && exp < Date.now()) return json({ ok: false, reason: 'partner_rc_expired' }, 409);
    }
    sets.push('payout_pct = ?');
    binds.push(Number(partner.payout_pct) || 70);
    changed.payout_pct = Number(partner.payout_pct) || 70;
    // A (re)assignment is a fresh offer — acceptance starts over.
    if (b.partner_id !== row.partner_id) {
      sets.push('accepted_at = NULL');
      changed.accepted_at = 'reset';
    }
  }

  // Free-text annotation that lands ONLY in the audit event (e.g. the manual
  // "marcar pagado" method: efectivo / Bizum personal) — never a column.
  if (typeof b.event_note === 'string' && b.event_note.trim()) {
    changed.note = b.event_note.trim().slice(0, 300);
  }

  if (!sets.length) return json({ ok: false, reason: 'nothing_to_update' }, 400);

  await db.prepare(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`).bind(...binds, orderId).run();
  await logEvent(db, orderId, changed.status ? 'status_changed' : 'updated', changed);

  const updated = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first();

  // WhatsApp Cloud automation hooks (RL-450) — no-op until configured.
  if (changed.status) {
    await fireStatusHooks(db, env, updated as Record<string, unknown>, (changed.status as any).to);
  }

  return json({ ok: true, order: shapeOrder(updated as Record<string, unknown>) });
}
