/**
 * Stripe webhook (RL-440): POST /api/stripe/webhook.
 *
 * Signature verification per Stripe's scheme, no SDK: header
 * `Stripe-Signature: t=<ts>,v1=<hmac>[,v1=…]`, where v1 =
 * HMAC-SHA256(endpoint_secret, `${t}.${rawBody}`) hex. 5-minute tolerance.
 *
 * On checkout.session.completed: accumulate paid_eur (deposit + rest),
 * stamp paid_at, move status → paid once the quote is fully covered and
 * the transition is legal. Idempotent by session id (checked against the
 * order's event log). Inert until STRIPE_WEBHOOK_SECRET is set.
 */

import { json, inert, logEvent, TRANSITIONS } from '../../_lib/orders';
import type { OrdersEnv, OrderStatus, D1Database } from '../../_lib/orders';

interface StripeEnv extends OrdersEnv {
  STRIPE_WEBHOOK_SECRET?: string;
}

const TOLERANCE_S = 300;

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time-ish hex comparison. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function alreadyProcessed(db: D1Database, orderId: string, sessionId: string): Promise<boolean> {
  const row = await db
    .prepare(`SELECT id FROM order_events WHERE order_id = ? AND type = 'stripe_paid' AND data LIKE ? LIMIT 1`)
    .bind(orderId, `%${sessionId}%`)
    .first();
  return !!row;
}

export async function onRequestPost(context: {
  request: Request;
  env: StripeEnv;
}): Promise<Response> {
  const { request, env } = context;
  if (!env.STRIPE_WEBHOOK_SECRET) return inert('stripe_webhook_not_configured');
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');
  const db = env.ORDERS_DB;

  const payload = await request.text();
  const header = request.headers.get('Stripe-Signature') || '';
  const parts = Object.fromEntries(
    header.split(',').map((p) => p.split('=') as [string, string]).filter((p) => p.length === 2)
  );
  // Multiple v1 entries are legal (secret rotation) — collect them all.
  const v1s = header
    .split(',')
    .filter((p) => p.trim().startsWith('v1='))
    .map((p) => p.trim().slice(3));
  const t = Number(parts.t);

  if (!t || v1s.length === 0) return json({ ok: false, reason: 'bad_signature_header' }, 400);
  if (Math.abs(Date.now() / 1000 - t) > TOLERANCE_S) return json({ ok: false, reason: 'timestamp_out_of_tolerance' }, 400);

  const expected = await hmacHex(env.STRIPE_WEBHOOK_SECRET, `${parts.t}.${payload}`);
  if (!v1s.some((v) => safeEqual(v, expected))) return json({ ok: false, reason: 'bad_signature' }, 400);

  let event: any;
  try {
    event = JSON.parse(payload);
  } catch {
    return json({ ok: false, reason: 'bad_json' }, 400);
  }

  if (event.type !== 'checkout.session.completed') return json({ ok: true, ignored: event.type });

  const session = event.data?.object || {};
  const orderId = session.metadata?.order_id;
  const sessionId = String(session.id || '');
  const amountEur = Math.round(Number(session.amount_total || 0)) / 100;
  if (!orderId || !sessionId || !(amountEur > 0)) return json({ ok: false, reason: 'missing_fields' }, 400);

  const order = await db
    .prepare('SELECT * FROM orders WHERE id = ?')
    .bind(orderId)
    .first<Record<string, unknown>>();
  if (!order) return json({ ok: false, reason: 'order_not_found' }, 200); // ack — nothing to retry into

  if (await alreadyProcessed(db, orderId, sessionId)) {
    return json({ ok: true, idempotent: true });
  }

  const newPaid = Math.round(((Number(order.paid_eur) || 0) + amountEur) * 100) / 100;
  const quote = Number(order.quote_eur) || 0;
  const covered = quote > 0 && newPaid >= quote - 0.01;
  const from = order.status as OrderStatus;
  const advance = covered && TRANSITIONS[from]?.includes('paid');

  await db
    .prepare(`UPDATE orders SET paid_eur = ?, paid_at = ?${advance ? ", status = 'paid'" : ''} WHERE id = ?`)
    .bind(newPaid, new Date().toISOString(), orderId)
    .run();
  await logEvent(db, orderId, 'stripe_paid', {
    session_id: sessionId, amount_eur: amountEur, total_paid_eur: newPaid, covered,
    kind: session.metadata?.kind,
    ...(advance ? { status: { from, to: 'paid' } } : {}),
  });

  return json({ ok: true, paid_eur: newPaid, covered, advanced: !!advance });
}
