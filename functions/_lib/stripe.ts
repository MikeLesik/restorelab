/**
 * Shared Stripe Checkout helper (RL-440 / RL-433).
 *
 * Creates a Checkout session for the FULL outstanding amount
 * (quote + on-site add-ons − already paid), stores the link on the order,
 * advances the status to `awaiting_payment` when that hop is legal, and fires
 * the WA payment_link hook (client gets the link in their language). The
 * amount is ALWAYS computed server-side — the caller never names a price.
 *
 * Used by BOTH the partner-triggered link (`/api/job/<t>/pay-link`) and the
 * auto-charge on partner "done", so the "create link + advance + notify"
 * behaviour can never drift between them. Inert without STRIPE_SECRET_KEY.
 */
import { logEvent, addonsTotal, TRANSITIONS } from './orders';
import type { OrdersEnv, OrderStatus } from './orders';
import { fireStatusHooks } from './wa';

export interface StripeEnv extends OrdersEnv {
  STRIPE_SECRET_KEY?: string;
  /** Test hook: lets the acceptance suite point at a local mock. */
  STRIPE_API_BASE?: string;
  PUBLIC_SITE_URL?: string;
}

export interface ChargeResult {
  ok: boolean;
  url?: string;
  amount_eur?: number;
  status?: string;
  reason?: string;
  detail?: string;
}

/** HTTP status to return for a failed charge (409 for business rules, 502 for Stripe). */
export function chargeHttpStatus(reason?: string): number {
  return reason === 'no_quote' || reason === 'nothing_to_charge' ? 409
    : reason === 'stripe_not_configured' ? 503
    : 502;
}

export async function chargeOutstanding(
  env: StripeEnv,
  order: Record<string, unknown>,
  via: string,
): Promise<ChargeResult> {
  const db = env.ORDERS_DB!;
  if (!env.STRIPE_SECRET_KEY) return { ok: false, reason: 'stripe_not_configured' };

  const quote = Number(order.quote_eur) || 0;
  if (quote <= 0) return { ok: false, reason: 'no_quote' };
  const total = Math.round((quote + addonsTotal(order)) * 100) / 100;
  const outstanding = Math.round((total - (Number(order.paid_eur) || 0)) * 100) / 100;
  const cents = Math.round(outstanding * 100);
  if (cents <= 0) return { ok: false, reason: 'nothing_to_charge' };

  const site = env.PUBLIC_SITE_URL || 'https://restorelab.io';
  const lang = ['es', 'en', 'ca'].includes(order.lang as string) ? (order.lang as string) : 'es';

  const form = new URLSearchParams();
  form.set('mode', 'payment');
  form.set('payment_method_types[0]', 'card');
  form.set('payment_method_types[1]', 'bizum');
  form.set('line_items[0][price_data][currency]', 'eur');
  form.set('line_items[0][price_data][unit_amount]', String(cents));
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
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });
    session = await res.json();
    if (!res.ok || !session.url) {
      return { ok: false, reason: 'stripe_error', detail: (session as any)?.error?.message || `HTTP ${res.status}` };
    }
  } catch {
    return { ok: false, reason: 'stripe_unreachable' };
  }

  // Store the link; advance qc/booked/assigned → awaiting_payment only when
  // that hop is legal from the current status.
  const from = order.status as OrderStatus;
  const advance = TRANSITIONS[from]?.includes('awaiting_payment');
  await db
    .prepare(`UPDATE orders SET payment_link = ?${advance ? ", status = 'awaiting_payment'" : ''} WHERE id = ?`)
    .bind(session.url, order.id)
    .run();
  await logEvent(db, order.id as string, 'payment_link_created', {
    amount_eur: outstanding, session_id: session.id, via,
    ...(advance ? { status: { from, to: 'awaiting_payment' } } : {}),
  });

  // WA hook: the payment_link template needs a link AND awaiting_payment.
  if (advance || from === 'awaiting_payment') {
    const fresh = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(order.id).first();
    await fireStatusHooks(db, env, fresh as Record<string, unknown>, 'awaiting_payment');
  }

  return { ok: true, url: session.url as string, amount_eur: outstanding, status: advance ? 'awaiting_payment' : (from as string) };
}
