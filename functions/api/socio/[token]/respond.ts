/**
 * Accept or decline an offered job from the partner cabinet (RL-431):
 * POST /api/socio/<ptoken>/respond  body { code, action: 'accept' | 'decline' }
 * Authorized by the partner's magic-link token. Only for jobs offered to THIS
 * active partner (booked/assigned). Accept logs the acceptance (offer-accept
 * mechanic / falso-autónomo evidence). Decline unassigns the partner and kills
 * the job token, reverting an 'assigned' order to 'booked' so Mike reassigns;
 * the decline is logged for the admin to see.
 */

import { json, inert, notFound, sha256hex, logEvent, notifyOwner } from '../../../_lib/orders';
import type { OrdersEnv } from '../../../_lib/orders';

const OFFERED = ['booked', 'assigned'];

export async function onRequestPost(context: {
  request: Request;
  env: OrdersEnv;
  params: { token: string };
  waitUntil(p: Promise<unknown>): void;
}): Promise<Response> {
  const { request, env, params } = context;
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');
  const db = env.ORDERS_DB;

  if (!/^[a-f0-9]{32}$/.test(params.token)) return notFound();
  const partner = await db
    .prepare('SELECT id, name, status FROM partners WHERE token_hash = ?')
    .bind(await sha256hex(params.token))
    .first<Record<string, unknown>>();
  if (!partner || partner.status !== 'active') return notFound();

  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return json({ ok: false, reason: 'bad_json' }, 400); }
  const code = typeof b.code === 'string' ? b.code.trim() : '';
  const action = b.action;

  const order = await db
    .prepare('SELECT id, status, partner_id, accepted_at FROM orders WHERE code = ?')
    .bind(code)
    .first<Record<string, unknown>>();
  if (!order || order.partner_id !== partner.id) return notFound();
  if (!OFFERED.includes(order.status as string)) return json({ ok: false, reason: 'not_offered', status: order.status }, 409);

  if (action === 'accept') {
    if (!order.accepted_at) {
      await db.prepare('UPDATE orders SET accepted_at = ? WHERE id = ?').bind(new Date().toISOString(), order.id).run();
      await logEvent(db, order.id as string, 'partner_accepted', { via: 'cabinet' });
      context.waitUntil(notifyOwner(env, `✅ ${String(partner.name).split(' ')[0]} aceptó ${code}`, ''));
    }
    return json({ ok: true, accepted: true });
  }

  if (action === 'decline') {
    const revert = (order.status as string) === 'assigned' ? "status = 'booked', " : '';
    await db
      .prepare(`UPDATE orders SET partner_id = NULL, accepted_at = NULL, job_token_hash = NULL, ${revert}id = id WHERE id = ?`)
      .bind(order.id)
      .run();
    await logEvent(db, order.id as string, 'partner_declined', { partner_id: partner.id, partner_name: partner.name });
    context.waitUntil(notifyOwner(env, `❌ ${partner.name} rechazó ${code}`, 'Reasignar a otro partner'));
    return json({ ok: true, declined: true });
  }

  return json({ ok: false, reason: 'bad_action' }, 400);
}
