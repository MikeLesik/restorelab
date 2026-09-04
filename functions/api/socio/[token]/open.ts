/**
 * Open a job from the partner cabinet (RL-431): POST /api/socio/<ptoken>/open
 * body { code }. Authorized by the partner's magic-link token. Verifies the
 * order is one of THIS partner's working jobs, issues a fresh job token and
 * returns /p/<jobtoken> — the full existing work card (checklist, before/after
 * photos, accept, done). Lets the partner work a job straight from the cabinet
 * without waiting for Mike to send the link.
 */

import { json, inert, notFound, randomHex128, sha256hex, logEvent } from '../../../_lib/orders';
import type { OrdersEnv } from '../../../_lib/orders';

// awaiting_payment included so the partner can re-open the card from the
// cabinet to finish collecting on site (show the pay link, watch it go paid).
const WORKABLE = ['booked', 'assigned', 'in_progress', 'qc', 'awaiting_payment'];

export async function onRequestPost(context: {
  request: Request;
  env: OrdersEnv;
  params: { token: string };
}): Promise<Response> {
  const { request, env, params } = context;
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');
  const db = env.ORDERS_DB;

  if (!/^[a-f0-9]{32}$/.test(params.token)) return notFound();
  const partner = await db
    .prepare("SELECT id, status FROM partners WHERE token_hash = ?")
    .bind(await sha256hex(params.token))
    .first<Record<string, unknown>>();
  if (!partner || partner.status !== 'active') return notFound();

  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return json({ ok: false, reason: 'bad_json' }, 400); }
  const code = typeof b.code === 'string' ? b.code.trim() : '';

  const order = await db
    .prepare('SELECT id, status, partner_id FROM orders WHERE code = ?')
    .bind(code)
    .first<Record<string, unknown>>();
  if (!order || order.partner_id !== partner.id) return notFound();
  if (!WORKABLE.includes(order.status as string)) return json({ ok: false, reason: 'not_workable', status: order.status }, 409);

  const jobToken = randomHex128();
  await db.prepare('UPDATE orders SET job_token_hash = ? WHERE id = ?').bind(await sha256hex(jobToken), order.id).run();
  await logEvent(db, order.id as string, 'job_token_issued', { via: 'cabinet' });

  return json({ ok: true, url: `/p/${jobToken}` });
}
