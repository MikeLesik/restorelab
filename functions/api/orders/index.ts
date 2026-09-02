/**
 * Orders collection (RL-410).
 *
 * POST /api/orders — public intake (also used by the RL-411 form and RL-420
 *   admin manual entry). Validates, honeypot, per-IP rate limit (in-D1),
 *   stores the RL-301 attribution the client sends, status `new`. Returns
 *   { id, code, intake_token } — the token authorizes intake photo uploads.
 * GET /api/orders?status=&channel=&partner_id=&month=&limit= — admin only.
 *
 * Inert-with-warning JSON until the ORDERS_DB binding exists (capi.ts
 * philosophy). Same-origin only; no CORS headers are emitted.
 */

import {
  json, inert, notFound, adminOk, sameOrigin, ulid, orderCode, randomHex128,
  sha256hex, shapeOrder, logEvent, CHANNELS, LANGS, SIZES, STATUSES,
} from '../../_lib/orders';
import type { OrdersEnv } from '../../_lib/orders';

const RATE_LIMIT = 5;           // public orders per IP…
const RATE_WINDOW_S = 3600;     // …per hour

const str = (v: unknown, max: number): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;

export async function onRequestPost(context: {
  request: Request;
  env: OrdersEnv;
}): Promise<Response> {
  const { request, env } = context;
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');
  if (!sameOrigin(request)) return json({ ok: false, reason: 'cross_origin' }, 403);
  const db = env.ORDERS_DB;

  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return json({ ok: false, reason: 'bad_json' }, 400);
  }

  // Honeypot: a visible-to-bots-only field. Real clients always send it empty.
  if (str(b.website, 200)) return json({ ok: true, id: null });

  const isAdmin = adminOk(request, env);

  // Per-IP rate limit for the public path (admin manual entry is exempt).
  if (!isAdmin) {
    const ip = request.headers.get('CF-Connecting-IP') || 'local';
    const key = 'ip:' + (await sha256hex(ip)).slice(0, 32);
    const now = Math.floor(Date.now() / 1000);
    const row = await db
      .prepare('SELECT count, reset_at FROM rate_limits WHERE key = ?')
      .bind(key)
      .first<{ count: number; reset_at: number }>();
    const fresh = !row || row.reset_at < now;
    const count = fresh ? 0 : row!.count;
    if (count >= RATE_LIMIT) return json({ ok: false, reason: 'rate_limited' }, 429);
    await db
      .prepare(
        `INSERT INTO rate_limits (key, count, reset_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET count = ?, reset_at = ?`,
      )
      .bind(key, count + 1, fresh ? now + RATE_WINDOW_S : row!.reset_at,
            count + 1, fresh ? now + RATE_WINDOW_S : row!.reset_at)
      .run();
  }

  // ── Validation ──
  const phone = str(b.phone, 20);
  if (!phone || !/^[+\d][\d\s\-()]{6,19}$/.test(phone)) {
    return json({ ok: false, reason: 'bad_phone' }, 400);
  }
  const serviceSlug = str(b.service_slug, 50);
  if (serviceSlug && !/^[a-z0-9-]{2,50}$/.test(serviceSlug)) {
    return json({ ok: false, reason: 'bad_service' }, 400);
  }
  const lang = LANGS.includes(b.lang as any) ? (b.lang as string) : 'es';
  const size = SIZES.includes(b.size as any) ? (b.size as string) : null;
  const channel = isAdmin && CHANNELS.includes(b.channel as any) ? (b.channel as string) : 'form';
  const areaSlug = str(b.area_slug, 50);
  if (areaSlug && !/^[a-z0-9-]{2,50}$/.test(areaSlug)) {
    return json({ ok: false, reason: 'bad_area' }, 400);
  }
  const refCode = str(b.ref, 10);
  const attr = b.attr && typeof b.attr === 'object'
    ? JSON.stringify(b.attr).slice(0, 4096)
    : null;

  const id = ulid();
  const intakeToken = randomHex128();
  const createdAt = new Date().toISOString();

  // Unique short code — retry on the (rare) collision.
  let code = orderCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await db
        .prepare(
          `INSERT INTO orders (id, code, created_at, status, channel, lang,
             service_slug, size, client_name, phone, area_slug, address,
             ref_code, attr, notes, intake_token)
           VALUES (?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          id, code, createdAt, channel, lang,
          serviceSlug, size, str(b.client_name, 100), phone, areaSlug,
          str(b.address, 300), refCode && /^RL-[A-HJ-NP-Z2-9]{4}$/.test(refCode) ? refCode : null,
          attr, str(b.notes, 1000), intakeToken,
        )
        .run();
      break;
    } catch (e) {
      if (attempt === 4) return json({ ok: false, reason: 'code_collision' }, 500);
      code = orderCode();
    }
  }

  await logEvent(db, id, 'created', { channel, service: serviceSlug, via: isAdmin ? 'admin' : 'public' });

  return json({ ok: true, id, code, intake_token: intakeToken });
}

export async function onRequestGet(context: {
  request: Request;
  env: OrdersEnv;
}): Promise<Response> {
  const { request, env } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');

  const url = new URL(request.url);
  const conds: string[] = [];
  const binds: unknown[] = [];

  const status = url.searchParams.get('status');
  if (status) {
    if (!STATUSES.includes(status as any)) return json({ ok: false, reason: 'bad_status' }, 400);
    conds.push('status = ?');
    binds.push(status);
  }
  const channel = url.searchParams.get('channel');
  if (channel) {
    if (!CHANNELS.includes(channel as any)) return json({ ok: false, reason: 'bad_channel' }, 400);
    conds.push('channel = ?');
    binds.push(channel);
  }
  const partnerId = url.searchParams.get('partner_id');
  if (partnerId) {
    conds.push('partner_id = ?');
    binds.push(partnerId.slice(0, 40));
  }
  const month = url.searchParams.get('month'); // YYYY-MM
  if (month) {
    if (!/^\d{4}-\d{2}$/.test(month)) return json({ ok: false, reason: 'bad_month' }, 400);
    conds.push("substr(created_at, 1, 7) = ?");
    binds.push(month);
  }
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 1), 200);

  const where = conds.length ? ` WHERE ${conds.join(' AND ')}` : '';
  // status_ts = when the order entered its current status (age-in-status on
  // the admin pipeline cards); falls back to created_at for never-moved orders.
  const res = await env.ORDERS_DB
    .prepare(
      `SELECT orders.*, COALESCE((
         SELECT MAX(ts) FROM order_events
         WHERE order_id = orders.id AND type = 'status_changed'
       ), orders.created_at) AS status_ts
       FROM orders${where} ORDER BY created_at DESC LIMIT ${limit}`,
    )
    .bind(...binds)
    .all();

  return json({ ok: true, orders: (res.results || []).map(shapeOrder) });
}
