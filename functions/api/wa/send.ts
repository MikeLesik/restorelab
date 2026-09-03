/**
 * Manual template send (RL-450): POST /api/wa/send (admin-guarded).
 * Body: { order_id, to, template, lang?, params?: string[] }
 *
 * Internal tool for the admin (e.g. reminder_24h, review_request until the
 * cron lands). Inert until WA_CLOUD_TOKEN / WA_CLOUD_PHONE_ID are set —
 * until then the admin copy-buttons are the path.
 */

import { json, inert, notFound, adminAuthed, logEvent } from '../../_lib/orders';
import { sendTemplate, waConfigured } from '../../_lib/wa';
import type { WaEnv } from '../../_lib/wa';

const TEMPLATES = ['job_assigned', 'payment_link', 'review_request', 'reminder_24h'];

export async function onRequestPost(context: {
  request: Request;
  env: WaEnv;
}): Promise<Response> {
  const { request, env } = context;
  if (!(await adminAuthed(request, env))) return notFound();
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');
  if (!waConfigured(env)) return inert('wa_cloud_not_configured');

  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return json({ ok: false, reason: 'bad_json' }, 400);
  }
  const template = String(b.template || '');
  if (!TEMPLATES.includes(template)) return json({ ok: false, reason: 'bad_template', templates: TEMPLATES }, 400);
  const to = String(b.to || '');
  const lang = ['es', 'en', 'ca'].includes(b.lang as string) ? (b.lang as string) : 'es';
  const params = Array.isArray(b.params) ? b.params.map(String).slice(0, 10) : [];

  const res = await sendTemplate(env, to, template, lang, params);
  if (typeof b.order_id === 'string' && b.order_id) {
    await logEvent(env.ORDERS_DB, b.order_id, res.ok ? 'wa_sent' : 'wa_send_failed', {
      template, via: 'manual', ...(res.ok ? { message_id: res.id } : { error: res.error, manual_send_needed: true }),
    });
  }
  return json(res.ok ? { ok: true, id: res.id } : { ok: false, reason: 'send_failed', detail: res.error }, res.ok ? 200 : 502);
}
