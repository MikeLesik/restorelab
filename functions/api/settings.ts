/**
 * Admin settings KV-in-D1 (RL-460): monthly ad-spend inputs and future knobs.
 * Admin-guarded (x-admin-token, wrong → 404).
 *
 * GET /api/settings?key=ad_spend:2026-10   → { ok, value } (value = parsed JSON | null)
 * PUT /api/settings   body { key, value }  → stored as JSON
 */

import { json, inert, notFound, adminOk } from '../_lib/orders';
import type { OrdersEnv } from '../_lib/orders';

const KEY_RE = /^[a-z0-9_:-]{2,60}$/;

export async function onRequestGet(context: {
  request: Request;
  env: OrdersEnv;
}): Promise<Response> {
  const { request, env } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');
  const key = new URL(request.url).searchParams.get('key') || '';
  if (!KEY_RE.test(key)) return json({ ok: false, reason: 'bad_key' }, 400);
  const row = await env.ORDERS_DB
    .prepare('SELECT value FROM settings WHERE key = ?')
    .bind(key)
    .first<{ value: string }>();
  return json({ ok: true, key, value: row ? JSON.parse(row.value) : null });
}

export async function onRequestPut(context: {
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
  const key = typeof b.key === 'string' ? b.key : '';
  if (!KEY_RE.test(key)) return json({ ok: false, reason: 'bad_key' }, 400);
  const value = JSON.stringify(b.value ?? null).slice(0, 8192);
  await env.ORDERS_DB
    .prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?')
    .bind(key, value, value)
    .run();
  return json({ ok: true, key });
}
