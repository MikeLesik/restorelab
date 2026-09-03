/**
 * Partner-triggered client payment (RL-433): POST /api/job/<jobtoken>/pay-link
 * Authorized by the job token. Creates a Stripe Checkout link for the amount
 * the client still owes (quote + add-ons − already paid) so the partner can
 * charge on site (client scans/opens it and pays card or Bizum). The amount is
 * computed server-side — the partner can't set it. Inert without STRIPE_SECRET_KEY.
 */

import { json, inert, notFound, sha256hex, logEvent, addonsTotal } from '../../../_lib/orders';
import type { OrdersEnv } from '../../../_lib/orders';

interface StripeEnv extends OrdersEnv {
  STRIPE_SECRET_KEY?: string;
  STRIPE_API_BASE?: string;
  PUBLIC_SITE_URL?: string;
}

const WORKABLE = ['booked', 'assigned', 'in_progress', 'qc'];

export async function onRequestPost(context: {
  request: Request;
  env: StripeEnv;
  params: { token: string };
}): Promise<Response> {
  const { env, params } = context;
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');
  if (!env.STRIPE_SECRET_KEY) return inert('stripe_not_configured');
  const db = env.ORDERS_DB;

  if (!/^[a-f0-9]{32}$/.test(params.token)) return notFound();
  const order = await db
    .prepare('SELECT * FROM orders WHERE job_token_hash = ?')
    .bind(await sha256hex(params.token))
    .first<Record<string, unknown>>();
  if (!order || !WORKABLE.includes(order.status as string)) return notFound();

  const quote = Number(order.quote_eur) || 0;
  if (quote <= 0) return json({ ok: false, reason: 'no_quote' }, 409);
  const total = Math.round((quote + addonsTotal(order)) * 100) / 100;
  const outstanding = Math.round((total - (Number(order.paid_eur) || 0)) * 100) / 100;
  const amountCents = Math.round(outstanding * 100);
  if (amountCents <= 0) return json({ ok: false, reason: 'nothing_to_charge' }, 409);

  const site = env.PUBLIC_SITE_URL || 'https://restorelab.io';
  const lang = ['es', 'en', 'ca'].includes(order.lang as string) ? (order.lang as string) : 'es';

  const form = new URLSearchParams();
  form.set('mode', 'payment');
  form.set('payment_method_types[0]', 'card');
  form.set('payment_method_types[1]', 'bizum');
  form.set('line_items[0][price_data][currency]', 'eur');
  form.set('line_items[0][price_data][unit_amount]', String(amountCents));
  form.set('line_items[0][price_data][product_data][name]', `restoreLab ${order.code}`);
  form.set('line_items[0][quantity]', '1');
  form.set('metadata[order_id]', String(order.id));
  form.set('metadata[kind]', 'onsite');
  form.set('success_url', `${site}/${lang}/gracias?pedido=${order.code}`);
  form.set('cancel_url', `${site}/${lang}/gracias?pedido=${order.code}`);

  let session: Record<string, unknown>;
  try {
    const res = await fetch(`${env.STRIPE_API_BASE || 'https://api.stripe.com'}/v1/checkout/sessions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    session = await res.json();
    if (!res.ok || !session.url) {
      return json({ ok: false, reason: 'stripe_error', detail: (session as any)?.error?.message || `HTTP ${res.status}` }, 502);
    }
  } catch {
    return json({ ok: false, reason: 'stripe_unreachable' }, 502);
  }

  await db.prepare('UPDATE orders SET payment_link = ? WHERE id = ?').bind(session.url, order.id).run();
  await logEvent(db, order.id as string, 'payment_link_created', {
    amount_eur: outstanding, session_id: session.id, via: 'partner',
  });

  return json({ ok: true, url: session.url, amount_eur: outstanding });
}
