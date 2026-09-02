/**
 * Single partner (RL-430) — admin only. PATCH /api/partners/:id
 * Editable: name, company, nif, phone, email, zones, skills, payout_pct,
 * active (0/1). Deactivation hides the partner from assign dropdowns but
 * keeps history intact.
 */

import { json, inert, notFound, adminOk } from '../../_lib/orders';
import type { OrdersEnv } from '../../_lib/orders';

export async function onRequestPatch(context: {
  request: Request;
  env: OrdersEnv;
  params: { id: string };
}): Promise<Response> {
  const { request, env, params } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');

  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return json({ ok: false, reason: 'bad_json' }, 400);
  }

  const sets: string[] = [];
  const binds: unknown[] = [];
  const text = (field: string, max: number) => {
    if (b[field] === undefined) return;
    sets.push(`${field} = ?`);
    binds.push(b[field] === null ? null : String(b[field]).slice(0, max));
  };
  text('name', 100); text('company', 100); text('nif', 20);
  text('phone', 20); text('email', 100);
  if (b.rc_expiry !== undefined) {
    if (b.rc_expiry !== null && !/^\d{4}-\d{2}-\d{2}$/.test(String(b.rc_expiry))) {
      return json({ ok: false, reason: 'bad_rc_expiry' }, 400);
    }
    sets.push('rc_expiry = ?');
    binds.push(b.rc_expiry);
  }
  for (const field of ['zones', 'skills']) {
    if (b[field] !== undefined) {
      if (!Array.isArray(b[field])) return json({ ok: false, reason: `bad_${field}` }, 400);
      sets.push(`${field} = ?`);
      binds.push(JSON.stringify((b[field] as unknown[]).slice(0, 30)));
    }
  }
  if (b.payout_pct !== undefined) {
    const v = Number(b.payout_pct);
    if (!Number.isFinite(v) || v < 0 || v > 100) return json({ ok: false, reason: 'bad_payout_pct' }, 400);
    sets.push('payout_pct = ?');
    binds.push(v);
  }
  if (b.active !== undefined) {
    sets.push('active = ?');
    binds.push(b.active ? 1 : 0);
  }
  if (!sets.length) return json({ ok: false, reason: 'nothing_to_update' }, 400);

  const res = await env.ORDERS_DB
    .prepare(`UPDATE partners SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...binds, params.id)
    .run();
  if (!(res.meta as any)?.changes) return json({ ok: false, reason: 'not_found' }, 404);
  const row = await env.ORDERS_DB.prepare('SELECT * FROM partners WHERE id = ?').bind(params.id).first();
  return json({ ok: true, partner: {
    ...row,
    zones: JSON.parse((row as any).zones || '[]'),
    skills: JSON.parse((row as any).skills || '[]'),
  } });
}
