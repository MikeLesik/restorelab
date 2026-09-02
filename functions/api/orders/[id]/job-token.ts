/**
 * Partner job token (RL-430): POST /api/orders/:id/job-token (admin).
 *
 * Generates a fresh 128-bit token, stores ONLY its sha256 on the order and
 * returns the plaintext once — it lives in the /p/<token> link the admin
 * sends to the partner over WhatsApp. Re-issuing invalidates the old link.
 * The token authorizes: GET /api/job/<token>, before/after photo uploads,
 * and "Trabajo terminado". It dies with the order (active statuses only).
 */

import { json, inert, notFound, adminOk, randomHex128, sha256hex, logEvent } from '../../../_lib/orders';
import type { OrdersEnv } from '../../../_lib/orders';

export async function onRequestPost(context: {
  request: Request;
  env: OrdersEnv;
  params: { id: string };
}): Promise<Response> {
  const { request, env, params } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');
  const db = env.ORDERS_DB;

  const order = await db
    .prepare('SELECT id, code, partner_id FROM orders WHERE id = ? OR code = ?')
    .bind(params.id, params.id)
    .first<Record<string, unknown>>();
  if (!order) return json({ ok: false, reason: 'not_found' }, 404);
  if (!order.partner_id) return json({ ok: false, reason: 'no_partner_assigned' }, 409);

  const token = randomHex128();
  await db
    .prepare('UPDATE orders SET job_token_hash = ? WHERE id = ?')
    .bind(await sha256hex(token), order.id)
    .run();
  await logEvent(db, order.id as string, 'job_token_issued', { reissue: true });

  return json({ ok: true, token, url: `/p/${token}` });
}
