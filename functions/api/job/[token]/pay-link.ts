/**
 * Partner-triggered client payment (RL-433): POST /api/job/<jobtoken>/pay-link
 * Authorized by the job token. Creates a Stripe Checkout link for the amount
 * the client still owes (quote + add-ons − already paid) so the partner can
 * charge on site (client scans/opens it and pays card or Bizum). The amount is
 * computed server-side — the partner can't set it. Advancing to
 * awaiting_payment + the WA hook live in the shared helper, so re-generating a
 * link and the auto-charge on "done" behave identically. Inert without
 * STRIPE_SECRET_KEY.
 */

import { json, inert, notFound, sha256hex } from '../../../_lib/orders';
import { chargeOutstanding, chargeHttpStatus } from '../../../_lib/stripe';
import type { StripeEnv } from '../../../_lib/stripe';

// awaiting_payment included so the partner can re-issue the link while still
// on site collecting (e.g. the client's first attempt failed).
const WORKABLE = ['booked', 'assigned', 'in_progress', 'qc', 'awaiting_payment'];

export async function onRequestPost(context: {
  request: Request;
  env: StripeEnv;
  params: { token: string };
}): Promise<Response> {
  const { env, params } = context;
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');
  if (!env.STRIPE_SECRET_KEY) return inert('stripe_not_configured');

  if (!/^[a-f0-9]{32}$/.test(params.token)) return notFound();
  const order = await env.ORDERS_DB
    .prepare('SELECT * FROM orders WHERE job_token_hash = ?')
    .bind(await sha256hex(params.token))
    .first<Record<string, unknown>>();
  if (!order || !WORKABLE.includes(order.status as string)) return notFound();

  const r = await chargeOutstanding(env, order, 'partner');
  if (!r.ok) return json({ ok: false, reason: r.reason, detail: r.detail }, chargeHttpStatus(r.reason));
  return json({ ok: true, url: r.url, amount_eur: r.amount_eur, status: r.status });
}
