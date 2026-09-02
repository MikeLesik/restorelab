/**
 * Partner job endpoint (RL-430) — authorized by the job token itself
 * (sha256 vs orders.job_token_hash), no login. Active statuses only:
 * the token dies the moment the order leaves assigned/in_progress/qc.
 *
 * GET  /api/job/<token>            — sanitized job card data (client FIRST
 *                                    NAME only, no phone in v1).
 * POST /api/job/<token>            — { action: 'done', notes? }:
 *                                    walks assigned→in_progress→qc (partner
 *                                    finished; every hop logged), stores
 *                                    partner notes in the event.
 */

import { json, inert, notFound, sha256hex, logEvent } from '../../_lib/orders';
import type { OrdersEnv, OrderStatus } from '../../_lib/orders';

const ACTIVE = ['assigned', 'in_progress', 'qc'];

async function findByToken(env: OrdersEnv, token: string) {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  const hash = await sha256hex(token);
  return env.ORDERS_DB!
    .prepare('SELECT * FROM orders WHERE job_token_hash = ?')
    .bind(hash)
    .first<Record<string, unknown>>();
}

export async function onRequestGet(context: {
  env: OrdersEnv;
  params: { token: string };
}): Promise<Response> {
  const { env, params } = context;
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');
  const order = await findByToken(env, params.token);
  if (!order || !ACTIVE.includes(order.status as string)) return notFound();

  const photos: string[] = JSON.parse((order.photos as string) || '[]');
  return json({
    ok: true,
    job: {
      code: order.code,
      status: order.status,
      service_slug: order.service_slug,
      size: order.size,
      area_slug: order.area_slug,
      address: order.address,
      scheduled_at: order.scheduled_at,
      client_first_name: String(order.client_name || '').split(' ')[0] || null,
      notes: order.notes,
      rework: order.rework,
      // Partner's own uploads so the card reflects progress after reload.
      photos_before: photos.filter((k) => k.includes('/before/')),
      photos_after: photos.filter((k) => k.includes('/after/')),
    },
  });
}

export async function onRequestPost(context: {
  request: Request;
  env: OrdersEnv;
  params: { token: string };
}): Promise<Response> {
  const { request, env, params } = context;
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');
  const db = env.ORDERS_DB;
  const order = await findByToken(env, params.token);
  if (!order || !ACTIVE.includes(order.status as string)) return notFound();

  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return json({ ok: false, reason: 'bad_json' }, 400);
  }
  if (b.action !== 'done') return json({ ok: false, reason: 'bad_action' }, 400);

  const photos: string[] = JSON.parse((order.photos as string) || '[]');
  const before = photos.filter((k) => k.includes('/before/')).length;
  const after = photos.filter((k) => k.includes('/after/')).length;
  if (before < 2 || after < 2) {
    return json({ ok: false, reason: 'photos_required', before, after, min: 2 }, 409);
  }

  const notes = typeof b.notes === 'string' ? b.notes.trim().slice(0, 1000) : '';
  // Walk the legal chain to qc, logging every hop.
  let status = order.status as OrderStatus;
  const hops: OrderStatus[] = status === 'assigned' ? ['in_progress', 'qc'] : status === 'in_progress' ? ['qc'] : [];
  for (const to of hops) {
    await db.prepare('UPDATE orders SET status = ? WHERE id = ?').bind(to, order.id).run();
    await logEvent(db, order.id as string, 'status_changed', {
      status: { from: status, to }, by: 'partner',
      ...(to === 'qc' && notes ? { partner_notes: notes } : {}),
    });
    status = to;
  }
  if (!hops.length && notes) {
    await logEvent(db, order.id as string, 'partner_note', { partner_notes: notes });
  }
  return json({ ok: true, status });
}
