/**
 * Partner registration invite (RL-431): POST /api/partners/invite (admin).
 *
 * No body  → creates an empty partner row in status 'invited' (active=0) and
 *            returns a fresh magic-link token. /socio/<token> is where the
 *            partner registers; the SAME token is their persistent cabinet.
 * { id }   → RE-ISSUES the magic link for an EXISTING partner (rotates
 *            token_hash) when they lose their link. The old link stops working;
 *            the raw token is never stored, so this is the only way to recover.
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
  const db = env.ORDERS_DB;

  let body: Record<string, unknown> = {};
  try { body = await request.json(); } catch { /* no body → new invite */ }

  const token = randomHex128();
  const hash = await sha256hex(token);

  // Re-issue for an existing partner: rotate their token (old link dies).
  if (typeof body.id === 'string' && body.id) {
    const p = await db.prepare('SELECT id FROM partners WHERE id = ?').bind(body.id).first();
    if (!p) return json({ ok: false, reason: 'not_found' }, 404);
    await db.prepare('UPDATE partners SET token_hash = ? WHERE id = ?').bind(hash, body.id).run();
    return json({ ok: true, id: body.id, token, url: `/socio/${token}`, reissued: true });
  }

  // New invite: empty 'invited' partner row.
  const id = ulid();
  await db
    .prepare(
      `INSERT INTO partners (id, name, zones, skills, payout_pct, active, status, token_hash, created_at)
       VALUES (?, '', '[]', '[]', 70, 0, 'invited', ?, ?)`,
    )
    .bind(id, hash, new Date().toISOString())
    .run();

  return json({ ok: true, id, token, url: `/socio/${token}` });
}
