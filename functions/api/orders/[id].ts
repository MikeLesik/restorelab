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
