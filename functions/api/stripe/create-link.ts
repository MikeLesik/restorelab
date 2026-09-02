/**
 * Stripe Checkout link (RL-440): POST /api/stripe/create-link (admin-guarded).
 *
 * Body: { order_id, kind: 'full' | 'deposit' | 'rest' }
 * The amount is ALWAYS computed server-side from the order's quote_eur
 * (deposit = 30%, rest = quote − paid so far) — the client never names a
 * price. Raw REST, no SDK. Card + Bizum.
 *
 * Inert until STRIPE_SECRET_KEY is set (capi.ts philosophy).
 * Stores the URL on the order; moves status → awaiting_payment only when
 * that transition is legal from the current status (a deposit link sent at
 * booking must not yank the order out of the working pipeline).
 */

import { json, inert, notFound, adminOk, logEvent, TRANSITIONS } from '../../_lib/orders';
import type { OrdersEnv, OrderStatus } from '../../_lib/orders';

interface StripeEnv extends OrdersEnv {
  STRIPE_SECRET_KEY?: string;
  /** Test hook: lets the acceptance suite point at a local mock. */
  STRIPE_API_BASE?: string;
  PUBLIC_SITE_URL?: string;
}

const KINDS = ['full', 'deposit', 'rest'] as const;
const DEPOSIT_PCT = 0.3;

export async function onRequestPost(context: {
  request: Request;
  env: StripeEnv;
}): Promise<Response> {
  const { request, env } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');
  if (!env.STRIPE_SECRET_KEY) return inert('stripe_not_configured');
  const db = env.ORDERS_DB;

  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return json({ ok: false, reason: 'bad_json' }, 400);
  }
  const kind = KINDS.includes(b.kind as any) ? (b.kind as string) : 'full';

  const order = await db
    .prepare('SELECT * FROM orders WHERE id = ? OR code = ?')
    .bind(String(b.order_id || ''), String(b.order_id || ''))
    .first<Record<string, unknown>>();
  if (!order) return json({ ok: false, reason: 'not_found' }, 404);

  const quote = Number(order.quote_eur);
  if (!Number.isFinite(quote) || quote <= 0) return json({ ok: false, reason: 'no_quote' }, 409);
  const paid = Number(order.paid_eur) || 0;

  let amountEur: number;
  if (kind === 'deposit') amountEur = Math.round(quote * DEPOSIT_PCT * 100) / 100;
  else if (kind === 'rest') amountEur = Math.round((quote - paid) * 100) / 100;
  else amountEur = quote;
  const amountCents = Math.round(amountEur * 100);
  if (amountCents <= 0) return json({ ok: false, reason: 'nothing_to_charge' }, 409);

  const site = env.PUBLIC_SITE_URL || 'https://restorelab.io';
  const lang = ['es', 'en', 'ca'].includes(order.lang as string) ? (order.lang as string) : 'es';
  const label = kind === 'deposit' ? 'señal 30%' : kind === 'rest' ? 'resto' : 'pago';

  const form = new URLSearchParams();
  form.set('mode', 'payment');
  form.set('payment_method_types[0]', 'card');
  form.set('payment_method_types[1]', 'bizum');
  form.set('line_items[0][price_data][currency]', 'eur');
  form.set('line_items[0][price_data][unit_amount]', String(amountCents));
  form.set('line_items[0][price_data][product_data][name]', `restoreLab ${order.code} — ${label}`);
  form.set('line_items[0][quantity]', '1');
  form.set('metadata[order_id]', String(order.id));
  form.set('metadata[kind]', kind);
  form.set('success_url', `${site}/${lang}?pago=ok`);
  form.set('cancel_url', `${site}/${lang}/contact`);

  let session: Record<string, unknown>;
  try {
    const res = await fetch(`${env.STRIPE_API_BASE || 'https://api.stripe.com'}/v1/checkout/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });
    session = await res.json();
    if (!res.ok || !session.url) {
      return json({
        ok: false,
        reason: 'stripe_error',
        detail: (session as any)?.error?.message || `HTTP ${res.status}`,
      }, 502);
    }
  } catch (e) {
    return json({ ok: false, reason: 'stripe_unreachable' }, 502);
  }

  // Store the link; advance to awaiting_payment only when legal from here.
  const from = order.status as OrderStatus;
  const advance = TRANSITIONS[from]?.includes('awaiting_payment');
  await db
    .prepare(`UPDATE orders SET payment_link = ?${advance ? ", status = 'awaiting_payment'" : ''} WHERE id = ?`)
    .bind(session.url, order.id)
    .run();
  await logEvent(db, order.id as string, 'payment_link_created', {
    kind, amount_eur: amountEur, session_id: session.id,
    ...(advance ? { status: { from, to: 'awaiting_payment' } } : {}),
  });

  return json({ ok: true, url: session.url, amount_eur: amountEur, kind, advanced: !!advance });
}
