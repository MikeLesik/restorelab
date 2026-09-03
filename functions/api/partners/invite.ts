/**
 * Partner registration invite (RL-431): POST /api/partners/invite (admin).
 *
 * Creates an empty partner row in status 'invited' (active=0, so it can't be
 * assigned yet) and returns a one-time magic-link token. The link
 * /socio/<token> is where the partner fills the form and uploads docs; the
 * SAME token is their persistent cabinet once Mike activates them.
 * Re-issuing is a fresh row — one link per invite.
 */

import { json, inert, notFound, adminAuthed, ulid, randomHex128, sha256hex } from '../../_lib/orders';
import type { OrdersEnv } from '../../_lib/orders';

export async function onRequestPost(context: {
  request: Request;
  env: OrdersEnv;
}): Promise<Response> {
  const { request, env } = context;
  if (!(await adminAuthed(request, env))) return notFound();
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');

  const id = ulid();
  const token = randomHex128();
  await env.ORDERS_DB
    .prepare(
      `INSERT INTO partners (id, name, zones, skills, payout_pct, active, status, token_hash, created_at)
       VALUES (?, '', '[]', '[]', 70, 0, 'invited', ?, ?)`,
    )
    .bind(id, await sha256hex(token), new Date().toISOString())
    .run();

  return json({ ok: true, id, token, url: `/socio/${token}` });
}
