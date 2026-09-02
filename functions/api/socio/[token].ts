/**
 * Partner cabinet + registration (RL-431) — authorized by the magic-link
 * token itself (sha256 vs partners.token_hash), no login. Same token for the
 * whole partner lifecycle: fill the form, then a persistent cabinet.
 *
 * GET  /api/socio/<token>  — the partner's own profile + status; once active,
 *                            their month payout summary and active jobs.
 * POST /api/socio/<token>  — submit/update the registration form. First
 *                            submission moves invited -> pending (awaiting
 *                            Mike's activation); active partners can edit.
 */

import { json, inert, notFound, sha256hex } from '../../_lib/orders';
import type { OrdersEnv } from '../../_lib/orders';
import { DEFAULT_PAYOUT_PCT } from '../../../src/lib/unitEconomics';

async function findPartner(env: OrdersEnv, token: string) {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  const hash = await sha256hex(token);
  return env.ORDERS_DB!
    .prepare('SELECT * FROM partners WHERE token_hash = ?')
    .bind(hash)
    .first<Record<string, unknown>>();
}

const jsonCol = (v: unknown, fallback: unknown) => {
  if (typeof v !== 'string') return v ?? fallback;
  try { return JSON.parse(v); } catch { return fallback; }
};

const str = (v: unknown, max: number): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;

export async function onRequestGet(context: {
  env: OrdersEnv;
  params: { token: string };
}): Promise<Response> {
  const { env, params } = context;
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');
  const p = await findPartner(env, params.token);
  if (!p) return notFound();

  const partner = {
    status: (p.status as string) || 'pending',
    name: p.name || '',
    phone: p.phone || '',
    email: p.email || '',
    nif: p.nif || '',
    zones: jsonCol(p.zones, []),
    skills: jsonCol(p.skills, []),
    rc_expiry: p.rc_expiry || '',
    payout_pct: Number(p.payout_pct) || DEFAULT_PAYOUT_PCT,
    profile: jsonCol(p.profile, {}),
    docs: jsonCol(p.docs, []),
    registered_at: p.registered_at || null,
  };

  // Active partners get their earnings + active jobs in the cabinet.
  let cabinet: Record<string, unknown> | undefined;
  if (partner.status === 'active') {
    const month = new Date().toISOString().slice(0, 7);
    const res = await env.ORDERS_DB
      .prepare(`SELECT * FROM orders WHERE partner_id = ? ORDER BY created_at DESC LIMIT 100`)
      .bind(p.id)
      .all();
    const orders = (res.results || []) as Record<string, unknown>[];
    const ACCEPTED = ['awaiting_payment', 'paid', 'done'];
    const ACTIVE = ['assigned', 'in_progress', 'qc'];
    const pctOf = (o: Record<string, unknown>) =>
      (Number(o.payout_pct) || Number(p.payout_pct) || DEFAULT_PAYOUT_PCT) / 100;
    const monthAccepted = orders.filter(
      (o) => ACCEPTED.includes(o.status as string) && String(o.created_at).slice(0, 7) === month,
    );
    const payoutMonth = Math.round(
      monthAccepted.reduce((s, o) => s + pctOf(o) * (Number(o.quote_eur) || 0), 0) * 100,
    ) / 100;
    const activeJobs = orders
      .filter((o) => ACTIVE.includes(o.status as string))
      .map((o) => ({
        code: o.code, status: o.status, service_slug: o.service_slug, size: o.size,
        area_slug: o.area_slug, address: o.address, scheduled_at: o.scheduled_at,
        client_first_name: String(o.client_name || '').split(' ')[0] || null,
        payout_eur: Math.round((Number(o.quote_eur) || 0) * pctOf(o) * 100) / 100,
      }));
    cabinet = { month, payout_month: payoutMonth, jobs_done_month: monthAccepted.length, active_jobs: activeJobs };
  }

  return json({ ok: true, partner, cabinet });
}

export async function onRequestPost(context: {
  request: Request;
  env: OrdersEnv;
  params: { token: string };
}): Promise<Response> {
  const { request, env, params } = context;
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');
  const db = env.ORDERS_DB;
  const p = await findPartner(env, params.token);
  if (!p) return notFound();

  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return json({ ok: false, reason: 'bad_json' }, 400); }

  const name = str(b.name, 100);
  if (!name) return json({ ok: false, reason: 'name_required' }, 400);
  const rc = b.rc_expiry === undefined ? undefined : str(b.rc_expiry, 10);
  if (rc && !/^\d{4}-\d{2}-\d{2}$/.test(rc)) return json({ ok: false, reason: 'bad_rc_expiry' }, 400);

  // Partial update: only touch columns/keys present in the body, so the
  // cabinet's availability-only save can't wipe the rest of the profile.
  const sets: string[] = ['name = ?'];
  const binds: unknown[] = [name];
  const col = (field: string, val: string | null | undefined) => {
    if (val === undefined) return; sets.push(`${field} = ?`); binds.push(val);
  };
  col('phone', b.phone === undefined ? undefined : str(b.phone, 20));
  col('email', b.email === undefined ? undefined : str(b.email, 100));
  col('nif', b.nif === undefined ? undefined : str(b.nif, 20));
  if (rc !== undefined) { sets.push('rc_expiry = ?'); binds.push(rc); }
  const arr = (v: unknown) => (Array.isArray(v) ? v.map((x) => String(x).slice(0, 50)).slice(0, 40) : null);
  if (b.zones !== undefined) { sets.push('zones = ?'); binds.push(JSON.stringify(arr(b.zones) || [])); }
  if (b.skills !== undefined) { sets.push('skills = ?'); binds.push(JSON.stringify(arr(b.skills) || [])); }

  // Merge the free-form profile bag (never a straight replace).
  const prev = jsonCol(p.profile, {}) as Record<string, unknown>;
  const profile = { ...prev };
  if (b.availability !== undefined) profile.availability = str(b.availability, 500) || '';
  if (b.portfolio_url !== undefined) profile.portfolio_url = str(b.portfolio_url, 300) || '';
  if (b.years !== undefined) profile.years = str(b.years, 20) || '';
  if (b.products !== undefined) profile.products = str(b.products, 500) || '';
  if (b.alta_autonomo !== undefined) profile.alta_autonomo = !!b.alta_autonomo;
  if (b.agreement && !profile.agreement_accepted_at) profile.agreement_accepted_at = new Date().toISOString();
  sets.push('profile = ?'); binds.push(JSON.stringify(profile));

  // A full submission (carries the agreement) with the account still invited
  // moves it to pending for Mike to review; active accounts stay active.
  const curStatus = (p.status as string) || 'invited';
  const newStatus = curStatus === 'active' ? 'active' : (b.agreement ? 'pending' : curStatus);
  sets.push('status = ?'); binds.push(newStatus);
  sets.push('registered_at = COALESCE(registered_at, ?)'); binds.push(new Date().toISOString());

  await db.prepare(`UPDATE partners SET ${sets.join(', ')} WHERE id = ?`).bind(...binds, p.id).run();
  return json({ ok: true, status: newStatus, first: curStatus === 'invited' });
}
