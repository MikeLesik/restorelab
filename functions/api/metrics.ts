/**
 * Monthly metrics (RL-460): GET /api/metrics?month=YYYY-MM (admin-guarded).
 *
 * One server-side aggregation pass over the month's orders + their full
 * event history. Returns the computed metrics AND the raw order rows (the
 * admin uses them for the CSV export). Attribution comes from the RL-301
 * snapshot stored on each order — no REF_LOG round-trip needed.
 *
 * Unit-economics constants live in src/lib/unitEconomics.ts (verdict doc).
 */

import { json, inert, notFound, adminOk, shapeOrder } from '../_lib/orders';
import type { OrdersEnv, D1Database } from '../_lib/orders';
import {
  STRIPE_FEE_PCT, RESERVE_PCT, DEFAULT_PAYOUT_PCT,
  KILL_CAC_EUR, KILL_REWORK_PCT, KILL_QUOTE_TO_BOOKED_PCT,
} from '../../src/lib/unitEconomics';

type Row = Record<string, unknown>;

const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const r2 = (n: number) => Math.round(n * 100) / 100;

async function eventsFor(db: D1Database, ids: string[]): Promise<Row[]> {
  const out: Row[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const res = await db
      .prepare(
        `SELECT order_id, ts, type, data FROM order_events
         WHERE order_id IN (${chunk.map(() => '?').join(',')}) ORDER BY id ASC`,
      )
      .bind(...chunk)
      .all();
    out.push(...(res.results || []));
  }
  return out;
}

export async function onRequestGet(context: {
  request: Request;
  env: OrdersEnv;
}): Promise<Response> {
  const { request, env } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');
  const db = env.ORDERS_DB;

  const url = new URL(request.url);
  const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(month)) return json({ ok: false, reason: 'bad_month' }, 400);

  const ordersRes = await db
    .prepare(`SELECT * FROM orders WHERE substr(created_at, 1, 7) = ? ORDER BY created_at ASC`)
    .bind(month)
    .all();
  const orders = (ordersRes.results || []) as Row[];
  const ids = orders.map((o) => o.id as string);
  const events = ids.length ? await eventsFor(db, ids) : [];

  const partnersRes = await db.prepare('SELECT * FROM partners').all();
  const partners = (partnersRes.results || []) as Row[];
  const partnerById = Object.fromEntries(partners.map((p) => [p.id, p]));

  // First time each order reached a given status (from the audit trail).
  const reachedAt: Record<string, Record<string, string>> = {};
  for (const e of events) {
    if (e.type !== 'status_changed' || typeof e.data !== 'string') continue;
    let to: string | undefined;
    try { to = JSON.parse(e.data as string)?.status?.to; } catch { continue; }
    if (!to) continue;
    const m = (reachedAt[e.order_id as string] ||= {});
    if (!m[to]) m[to] = e.ts as string;
  }
  const reached = (o: Row, s: string) => reachedAt[o.id as string]?.[s];

  // ── Orders funnel ──
  const count = (f: (o: Row) => boolean) => orders.filter(f).length;
  const created = orders.length;
  const quotedEver = count((o) => !!reached(o, 'quoted') || !!o.quote_eur);
  const bookedEver = count((o) => !!reached(o, 'booked'));
  const doneEver = count((o) => !!reached(o, 'done') || o.status === 'done');
  const byChannel: Record<string, number> = {};
  const byService: Record<string, number> = {};
  for (const o of orders) {
    byChannel[o.channel as string] = (byChannel[o.channel as string] || 0) + 1;
    const s = (o.service_slug as string) || '(sin servicio)';
    byService[s] = (byService[s] || 0) + 1;
  }
  const quoteToBookedPct = quotedEver > 0 ? r2((bookedEver / quotedEver) * 100) : null;

  // ── Time to quote (median hours, created → first quoted) ──
  const quoteHours = orders
    .map((o) => {
      const q = reached(o, 'quoted');
      return q ? (new Date(q).getTime() - new Date(o.created_at as string).getTime()) / 3600000 : null;
    })
    .filter((x): x is number => x !== null && x >= 0);
  const timeToQuoteMedianH = median(quoteHours) !== null ? r2(median(quoteHours)!) : null;

  // ── Revenue + contribution ──
  const paidOrders = orders.filter((o) => Number(o.paid_eur) > 0);
  const paidTotal = r2(paidOrders.reduce((s, o) => s + Number(o.paid_eur), 0));
  const avgTicket = paidOrders.length ? r2(paidTotal / paidOrders.length) : null;
  const contribution = paidOrders.map((o) => {
    const paid = Number(o.paid_eur);
    const partner = o.partner_id ? partnerById[o.partner_id as string] : null;
    const payout = partner
      ? r2((Number(partner.payout_pct) || DEFAULT_PAYOUT_PCT) / 100 * (Number(o.quote_eur) || paid))
      : 0;
    return r2(paid - payout - STRIPE_FEE_PCT * paid - RESERVE_PCT * paid);
  });
  const contributionTotal = r2(contribution.reduce((s, x) => s + x, 0));
  const contributionAvg = contribution.length ? r2(contributionTotal / contribution.length) : null;

  // ── Partner quality ──
  const partnerStats = partners.map((p) => {
    const jobs = orders.filter((o) => o.partner_id === p.id);
    const reworks = jobs.filter((o) => Number(o.rework) > 0).length;
    const ipHours = jobs
      .map((o) => {
        const a = reached(o, 'in_progress');
        const b = reached(o, 'qc');
        return a && b ? (new Date(b).getTime() - new Date(a).getTime()) / 3600000 : null;
      })
      .filter((x): x is number => x !== null && x >= 0);
    return {
      id: p.id, name: p.name,
      jobs: jobs.length,
      rework_pct: jobs.length ? r2((reworks / jobs.length) * 100) : null,
      avg_in_progress_h: ipHours.length ? r2(ipHours.reduce((s, x) => s + x, 0) / ipHours.length) : null,
    };
  }).filter((p) => p.jobs > 0);

  // ── CAC (attribution snapshot on the order; spend from settings) ──
  const sourceOf = (o: Row): string => {
    try {
      const attr = typeof o.attr === 'string' ? JSON.parse(o.attr as string) : o.attr;
      return attr?.first?.utm_source || '(direct)';
    } catch { return '(direct)'; }
  };
  const bookedBySource: Record<string, number> = {};
  const createdBySource: Record<string, number> = {};
  for (const o of orders) {
    const s = sourceOf(o);
    createdBySource[s] = (createdBySource[s] || 0) + 1;
    if (reached(o, 'booked')) bookedBySource[s] = (bookedBySource[s] || 0) + 1;
  }
  const spendRow = await db
    .prepare('SELECT value FROM settings WHERE key = ?')
    .bind(`ad_spend:${month}`)
    .first<{ value: string }>();
  const spend: Record<string, number> = spendRow ? JSON.parse(spendRow.value) || {} : {};
  const spendTotal = r2(Object.values(spend).reduce((s, x) => s + (Number(x) || 0), 0));
  const cacBlended = spendTotal > 0 && bookedEver > 0 ? r2(spendTotal / bookedEver) : null;
  const cacBySource = Object.fromEntries(
    Object.entries(spend)
      .filter(([, v]) => Number(v) > 0)
      .map(([src, v]) => [src, bookedBySource[src] ? r2(Number(v) / bookedBySource[src]) : null]),
  );

  return json({
    ok: true,
    month,
    thresholds: {
      cac_eur: KILL_CAC_EUR,
      rework_pct: KILL_REWORK_PCT,
      quote_to_booked_pct: KILL_QUOTE_TO_BOOKED_PCT,
    },
    funnel: {
      created, quoted: quotedEver, booked: bookedEver, done: doneEver,
      quote_to_booked_pct: quoteToBookedPct,
      by_channel: byChannel, by_service: byService,
    },
    time_to_quote_median_h: timeToQuoteMedianH,
    revenue: {
      paid_total: paidTotal, paid_orders: paidOrders.length, avg_ticket: avgTicket,
      contribution_total: contributionTotal, contribution_avg: contributionAvg,
    },
    partners: partnerStats,
    cac: {
      spend, spend_total: spendTotal, blended: cacBlended,
      by_source: cacBySource, booked_by_source: bookedBySource, created_by_source: createdBySource,
    },
    orders: orders.map(shapeOrder),
  });
}
