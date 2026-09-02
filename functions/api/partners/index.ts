/**
 * Partners collection (RL-420 minimal; full CRUD lands with RL-430).
 * Admin-guarded (x-admin-token, wrong → 404).
 *
 * GET  /api/partners           — list (all; filter client-side)
 * POST /api/partners           — create { name, company?, nif?, phone?, email?,
 *                                zones?: string[], skills?: string[], payout_pct? }
 */

import { json, inert, notFound, adminOk, ulid } from '../../_lib/orders';
import type { OrdersEnv } from '../../_lib/orders';

const parseJsonCols = (row: Record<string, unknown>) => ({
  ...row,
  zones: typeof row.zones === 'string' ? JSON.parse(row.zones as string) : row.zones,
  skills: typeof row.skills === 'string' ? JSON.parse(row.skills as string) : row.skills,
});

export async function onRequestGet(context: {
  request: Request;
  env: OrdersEnv;
}): Promise<Response> {
  const { request, env } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');
  const res = await env.ORDERS_DB
    .prepare('SELECT * FROM partners ORDER BY active DESC, name ASC')
    .all();
  return json({ ok: true, partners: (res.results || []).map(parseJsonCols) });
}

export async function onRequestPost(context: {
  request: Request;
  env: OrdersEnv;
}): Promise<Response> {
  const { request, env } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');

  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return json({ ok: false, reason: 'bad_json' }, 400);
  }
  const name = typeof b.name === 'string' && b.name.trim() ? b.name.trim().slice(0, 100) : null;
  if (!name) return json({ ok: false, reason: 'bad_name' }, 400);

  const id = ulid();
  const payout = Number.isFinite(Number(b.payout_pct)) ? Number(b.payout_pct) : 70;
  await env.ORDERS_DB
    .prepare(
      `INSERT INTO partners (id, name, company, nif, phone, email, zones, skills, payout_pct, active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    )
    .bind(
      id, name,
      typeof b.company === 'string' ? b.company.slice(0, 100) : null,
      typeof b.nif === 'string' ? b.nif.slice(0, 20) : null,
      typeof b.phone === 'string' ? b.phone.slice(0, 20) : null,
      typeof b.email === 'string' ? b.email.slice(0, 100) : null,
      JSON.stringify(Array.isArray(b.zones) ? b.zones.slice(0, 30) : []),
      JSON.stringify(Array.isArray(b.skills) ? b.skills.slice(0, 30) : []),
      payout, new Date().toISOString(),
    )
    .run();
  return json({ ok: true, id });
}
