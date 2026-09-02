/**
 * WhatsApp Cloud API sender + status-transition hooks (RL-450).
 *
 * SECOND NUMBER ONLY — the personal +34 680 265 190 stays on the consumer
 * app forever (Cloud API registration would disconnect it; see
 * docs/setup-whatsapp-cloud.md). Inert until WA_CLOUD_TOKEN and
 * WA_CLOUD_PHONE_ID are set; before that every hook degrades silently to
 * the admin copy-buttons, which remain the primary path anyway.
 *
 * Every attempt is logged on the order: wa_sent / wa_send_failed (the admin
 * shows "manual send needed" on failures). Templates must be pre-approved
 * in Meta Business under the exact names used here.
 */

import { logEvent, randomHex128, sha256hex } from './orders';
import type { D1Database, OrdersEnv } from './orders';

export interface WaEnv extends OrdersEnv {
  WA_CLOUD_TOKEN?: string;
  WA_CLOUD_PHONE_ID?: string;
  /** Test hook: lets the acceptance suite point at a local mock. */
  WA_API_BASE?: string;
  PUBLIC_SITE_URL?: string;
}

const GRAPH_VERSION = 'v21.0';
const LANG_CODES: Record<string, string> = { es: 'es', en: 'en', ca: 'ca' };

export const waConfigured = (env: WaEnv): boolean =>
  !!(env.WA_CLOUD_TOKEN && env.WA_CLOUD_PHONE_ID);

/** Send an approved template. Returns ok + message id, or the error text. */
export async function sendTemplate(
  env: WaEnv,
  toPhone: string,
  template: string,
  lang: string,
  bodyParams: string[],
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const to = toPhone.replace(/\D/g, '');
  if (!to) return { ok: false, error: 'no_phone' };
  try {
    const res = await fetch(
      `${env.WA_API_BASE || 'https://graph.facebook.com'}/${GRAPH_VERSION}/${env.WA_CLOUD_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.WA_CLOUD_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: template,
            language: { code: LANG_CODES[lang] || 'es' },
            components: bodyParams.length
              ? [{ type: 'body', parameters: bodyParams.map((text) => ({ type: 'text', text })) }]
              : [],
          },
        }),
      },
    );
    const data: any = await res.json();
    if (!res.ok) return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
    return { ok: true, id: data?.messages?.[0]?.id };
  } catch (e) {
    return { ok: false, error: 'unreachable' };
  }
}

async function attempt(
  db: D1Database, env: WaEnv, orderId: string,
  to: string, template: string, lang: string, params: string[],
): Promise<void> {
  const res = await sendTemplate(env, to, template, lang, params);
  await logEvent(db, orderId, res.ok ? 'wa_sent' : 'wa_send_failed', {
    template, ...(res.ok ? { message_id: res.id } : { error: res.error, manual_send_needed: true }),
  });
}

/**
 * Status-transition hooks (called from the orders PATCH and the Stripe
 * webhook after a successful transition). No cron: the paid→review template
 * is DELIBERATELY deferred (needs a 4h delay — revisit when Workers cron is
 * worth it; until then the review ask stays manual).
 *
 *  - → assigned:          job_assigned to the PARTNER (auto-issues a fresh
 *                         job token so the link is live).
 *  - → awaiting_payment:  payment_link to the CLIENT (only when a link
 *                         exists on the order).
 */
export async function fireStatusHooks(
  db: D1Database,
  env: WaEnv,
  order: Record<string, unknown>,
  to: string,
): Promise<void> {
  if (!waConfigured(env)) return; // copy-buttons remain the path
  const site = env.PUBLIC_SITE_URL || 'https://restorelab.io';
  const lang = (order.lang as string) || 'es';

  if (to === 'assigned' && order.partner_id) {
    const partner = await db
      .prepare('SELECT name, phone FROM partners WHERE id = ?')
      .bind(order.partner_id)
      .first<{ name: string; phone: string | null }>();
    if (!partner?.phone) {
      await logEvent(db, order.id as string, 'wa_send_failed', {
        template: 'job_assigned', error: 'partner_without_phone', manual_send_needed: true,
      });
      return;
    }
    const token = randomHex128();
    await db
      .prepare('UPDATE orders SET job_token_hash = ? WHERE id = ?')
      .bind(await sha256hex(token), order.id)
      .run();
    await logEvent(db, order.id as string, 'job_token_issued', { via: 'wa_hook' });
    await attempt(db, env, order.id as string, partner.phone, 'job_assigned', 'es', [
      partner.name.split(' ')[0],
      String(order.code),
      String(order.service_slug || 'trabajo'),
      order.scheduled_at ? String(order.scheduled_at) : 'por confirmar',
      `${site}/p/${token}`,
    ]);
  }

  if (to === 'awaiting_payment' && order.payment_link && order.phone) {
    await attempt(db, env, order.id as string, String(order.phone), 'payment_link', lang, [
      String(order.code),
      String(order.payment_link),
    ]);
  }
}
