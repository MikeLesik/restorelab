/**
 * Schema bootstrap (RL-410): POST /api/admin/migrate (x-admin-token).
 *
 * Applies the Orders OS schema (functions/_lib/schema.ts — mirror of
 * migrations/0001_init.sql, all statements idempotent). Exists so the schema
 * can be applied from the deployed site without local wrangler: bind
 * ORDERS_DB in the Cloudflare dashboard, then call this once. Safe to
 * re-run at any time.
 */

import { json, inert, notFound, adminOk } from '../../_lib/orders';
import type { OrdersEnv } from '../../_lib/orders';
import { SCHEMA_STATEMENTS } from '../../_lib/schema';

export async function onRequestPost(context: {
  request: Request;
  env: OrdersEnv;
}): Promise<Response> {
  const { request, env } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');

  const applied: string[] = [];
  for (const sql of SCHEMA_STATEMENTS) {
    await env.ORDERS_DB.prepare(sql).run();
    applied.push(sql.trim().split(/\s+/).slice(0, 6).join(' '));
  }
  return json({ ok: true, statements: applied.length, applied });
}
