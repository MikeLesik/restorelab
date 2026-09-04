/**
 * Partner job endpoint (RL-430) — authorized by the job token itself
 * (sha256 vs orders.job_token_hash), no login. Active statuses only:
 * the token dies the moment the order leaves assigned/in_progress/qc.
 *
 * GET  /api/job/<token>            — sanitized job card data (client FIRST
 *                                    NAME only, no phone in v1) + the
 *                                    partner's payout for THIS job, accept
 *                                    state and the latest rework note.
 * POST /api/job/<token>            — { action: 'accept' }: records the
 *                                    partner's explicit acceptance (offer-
 *                                    accept mechanic; also the falso-autonomo
 *                                    "right to decline" evidence), or
 *                                    { action: 'done', notes? }:
 *                                    walks assigned→in_progress→qc (partner
 *                                    finished; every hop logged), stores
 *                                    partner notes in the event.
 */

import { json, inert, notFound, sha256hex, logEvent, addonsTotal, notifyOwner, orderLabel, STATUS_LABEL_ES } from '../../_lib/orders';
import type { OrdersEnv, OrderStatus } from '../../_lib/orders';
import { chargeOutstanding } from '../../_lib/stripe';
import type { StripeEnv } from '../../_lib/stripe';
import { ADDON_PARTNER_PCT } from '../../../src/lib/unitEconomics';

// 'booked' included so a job assigned but not yet flipped to 'assigned' still
// opens (the partner can work it straight from their cabinet).
const ACTIVE = ['booked', 'assigned', 'in_progress', 'qc'];
// The card stays READABLE through payment so the partner can collect on site
// and watch it flip to "paid" (the poll needs GET to survive awaiting_payment
// and the paid moment). Write actions (accept/done) stay gated on ACTIVE.
const ACTIVE_READ = ['booked', 'assigned', 'in_progress', 'qc', 'awaiting_payment', 'paid'];

async function findByToken(env: OrdersEnv, token: string) {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  const hash = await sha256hex(token);
  return env.ORDERS_DB!
    .prepare('SELECT * FROM orders WHERE job_token_hash = ?')
    .bind(hash)
    .first<Record<string, unknown>>();
}

export async function onRequestGet(context: {
  env: OrdersEnv;
  params: { token: string };
}): Promise<Response> {
  const { env, params } = context;
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');
  const order = await findByToken(env, params.token);
  if (!order || !ACTIVE_READ.includes(order.status as string)) return notFound();

  const photos: string[] = JSON.parse((order.photos as string) || '[]');

  // The partner must never work blind on their own money: payout for THIS
  // job from the % snapshotted at assignment (partners table as fallback
  // for orders assigned before the snapshot existed).
  let pct = Number(order.payout_pct) || 0;
  if (!pct && order.partner_id) {
    const p = await env.ORDERS_DB!
      .prepare('SELECT payout_pct FROM partners WHERE id = ?')
      .bind(order.partner_id)
      .first<{ payout_pct: number }>();
    pct = Number(p?.payout_pct) || 0;
  }
  const quote = Number(order.quote_eur) || 0;
  // Base % on the quote + the higher add-on % on the partner's own upsells.
  const base = pct && quote ? (quote * pct) / 100 : 0;
  const addonPay = (ADDON_PARTNER_PCT / 100) * addonsTotal(order);
  const payoutEur = base + addonPay > 0 ? Math.round((base + addonPay) * 100) / 100 : null;

  // Latest rework instruction — the counter alone tells the partner nothing.
  let reworkNote: string | null = null;
  if (Number(order.rework) > 0) {
    const ev = await env.ORDERS_DB!
      .prepare(`SELECT data FROM order_events WHERE order_id = ? AND type = 'status_changed' ORDER BY id DESC`)
      .bind(order.id)
      .all();
    for (const e of ev.results || []) {
      try {
        const d = JSON.parse((e.data as string) || '{}');
        if (d.status?.from === 'qc' && d.status?.to === 'in_progress') { reworkNote = d.note || null; break; }
      } catch { /* skip */ }
    }
  }

  return json({
    ok: true,
    job: {
      code: order.code,
      status: order.status,
      service_slug: order.service_slug,
      size: order.size,
      area_slug: order.area_slug,
      address: order.address,
      scheduled_at: order.scheduled_at,
      client_first_name: String(order.client_name || '').split(' ')[0] || null,
      notes: order.notes,
      addons: (() => { try { return JSON.parse((order.addons as string) || '[]'); } catch { return []; } })(),
      rework: order.rework,
      rework_note: reworkNote,
      accepted_at: order.accepted_at || null,
      payout_pct: pct || null,
      payout_eur: payoutEur,
      // Client-side amounts so the partner can charge on site.
      quote_eur: quote || null,
      addons_total: addonsTotal(order),
      total_eur: Math.round((quote + addonsTotal(order)) * 100) / 100,
      paid_eur: Number(order.paid_eur) || 0,
      outstanding_eur: Math.round(((quote + addonsTotal(order)) - (Number(order.paid_eur) || 0)) * 100) / 100,
      payment_link: order.payment_link || null,
      // Partner's own uploads so the card reflects progress after reload.
      photos_before: photos.filter((k) => k.includes('/before/')),
      photos_after: photos.filter((k) => k.includes('/after/')),
    },
  });
}

export async function onRequestPost(context: {
  request: Request;
  env: StripeEnv;
  params: { token: string };
  waitUntil(p: Promise<unknown>): void;
}): Promise<Response> {
  const { request, env, params } = context;
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');
  const db = env.ORDERS_DB;
  const order = await findByToken(env, params.token);
  if (!order || !ACTIVE.includes(order.status as string)) return notFound();

  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return json({ ok: false, reason: 'bad_json' }, 400);
  }
  if (b.action === 'accept') {
    if (!order.accepted_at) {
      const ts = new Date().toISOString();
      await db.prepare('UPDATE orders SET accepted_at = ? WHERE id = ?').bind(ts, order.id).run();
      await logEvent(db, order.id as string, 'partner_accepted', {});
      context.waitUntil(notifyOwner(env, `✅ Partner aceptó ${orderLabel(order)}`, ''));
    }
    return json({ ok: true, accepted_at: order.accepted_at || new Date().toISOString() });
  }
  // Partner proposes additional work found on site. Never a price and never
  // a direct deal with the client — it lands as a note for Mike, who calls
  // the client, re-quotes and adds it (design: the partner doesn't set prices).
  if (b.action === 'suggest_extra') {
    const text = typeof b.text === 'string' ? b.text.trim().slice(0, 800) : '';
    if (!text) return json({ ok: false, reason: 'empty' }, 400);
    await logEvent(db, order.id as string, 'partner_suggested_extra', { text, by: 'partner' });
    context.waitUntil(notifyOwner(env, `🔧 Extra propuesto ${orderLabel(order)}`, text));
    return json({ ok: true });
  }
  if (b.action !== 'done') return json({ ok: false, reason: 'bad_action' }, 400);

  const photos: string[] = JSON.parse((order.photos as string) || '[]');
  const before = photos.filter((k) => k.includes('/before/')).length;
  const after = photos.filter((k) => k.includes('/after/')).length;
  if (before < 2 || after < 2) {
    return json({ ok: false, reason: 'photos_required', before, after, min: 2 }, 409);
  }

  const notes = typeof b.notes === 'string' ? b.notes.trim().slice(0, 1000) : '';
  // Walk the legal chain to qc, logging every hop.
  let status = order.status as OrderStatus;
  const hops: OrderStatus[] = (status === 'booked' || status === 'assigned') ? ['in_progress', 'qc'] : status === 'in_progress' ? ['qc'] : [];
  for (const to of hops) {
    await db.prepare('UPDATE orders SET status = ? WHERE id = ?').bind(to, order.id).run();
    await logEvent(db, order.id as string, 'status_changed', {
      status: { from: status, to }, by: 'partner',
      ...(to === 'qc' && notes ? { partner_notes: notes } : {}),
    });
    status = to;
  }
  if (!hops.length && notes) {
    await logEvent(db, order.id as string, 'partner_note', { partner_notes: notes });
  }

  // Auto-advance to on-site payment so the partner collects BEFORE leaving:
  // once the work reaches QC, create the client's full payment link and move to
  // awaiting_payment (online only — cash orders stay in QC for Mike). Falls back
  // to QC silently if Stripe is inert or nothing is chargeable, so the partner
  // still gets the "sent to QC" screen. Mike's photo review becomes an audit.
  let payment: { url?: string; amount_eur?: number } | null = null;
  if (status === 'qc' && order.payment_pref !== 'cash') {
    const fresh = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(order.id).first<Record<string, unknown>>();
    const r = await chargeOutstanding(env, fresh as Record<string, unknown>, 'partner_done');
    if (r.ok) { status = (r.status as OrderStatus) || status; payment = { url: r.url, amount_eur: r.amount_eur }; }
  }
  context.waitUntil(notifyOwner(env, `🏁 Partner terminó ${orderLabel(order)}`,
    `→ ${STATUS_LABEL_ES[status] || status}${payment ? ` · a cobrar ${payment.amount_eur}€ en sitio` : ''}`));
  return json({ ok: true, status, payment });
}
