/**
 * Photo upload (RL-410): POST /api/orders/:id/photos?kind=intake|before|after
 *
 * Body = raw image bytes (jpeg/png/webp/heic, ≤ 6 MB). Stored in R2 under
 * orders/<id>/<kind>/<random128>.<ext> — unguessable keys, never listed.
 *
 * Authorization per kind:
 *  - intake:        ?token= must match the order's intake_token (returned by
 *                   the order-creation flow), or admin token.
 *  - before/after:  partner job token (?token=, sha256 vs job_token_hash,
 *                   order must be in an active status — RL-430), or admin.
 */

import {
  json, inert, notFound, adminOk, randomHex128, sha256hex, logEvent,
  PHOTO_KINDS, PHOTO_LIMITS, PHOTO_MAX_BYTES, PHOTO_TYPES,
} from '../../../_lib/orders';
import type { OrdersEnv } from '../../../_lib/orders';

// 'booked' included so a partner opening a still-booked job from the cabinet
// can upload before/after photos and reach 'done' — matches the ACTIVE set in
// job/[token].ts, addon.ts, pay-link.ts and the socio open flow.
const ACTIVE_PARTNER_STATUSES = ['booked', 'assigned', 'in_progress', 'qc'];

export async function onRequestPost(context: {
  request: Request;
  env: OrdersEnv;
  params: { id: string };
}): Promise<Response> {
  const { request, env, params } = context;
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');
  if (!env.PHOTOS) return inert('photos_bucket_not_configured');
  const db = env.ORDERS_DB;

  const url = new URL(request.url);
  const kind = url.searchParams.get('kind') || '';
  if (!PHOTO_KINDS.includes(kind as any)) return json({ ok: false, reason: 'bad_kind' }, 400);

  const token = url.searchParams.get('token') || '';
  let row = await db
    .prepare('SELECT * FROM orders WHERE id = ? OR code = ?')
    .bind(params.id, params.id)
    .first<Record<string, unknown>>();
  // The partner job card knows only its token, not the order id — resolve
  // before/after uploads through job_token_hash (path id is a placeholder).
  if (!row && token && /^[a-f0-9]{32}$/.test(token) && kind !== 'intake') {
    row = await db
      .prepare('SELECT * FROM orders WHERE job_token_hash = ?')
      .bind(await sha256hex(token))
      .first<Record<string, unknown>>();
  }
  if (!row) return notFound();
  const orderId = row.id as string;

  // ── Authorization ──
  const isAdmin = adminOk(request, env);
  if (!isAdmin) {
    if (kind === 'intake') {
      if (!token || token !== row.intake_token) return notFound();
    } else {
      const hash = row.job_token_hash as string | null;
      if (!token || !hash || (await sha256hex(token)) !== hash) return notFound();
      // A token on a closed order is DEAD — indistinguishable from invalid.
      if (!ACTIVE_PARTNER_STATUSES.includes(row.status as string)) return notFound();
    }
  }

  // ── Payload ──
  const contentType = (request.headers.get('Content-Type') || '').split(';')[0].trim();
  const ext = PHOTO_TYPES[contentType];
  if (!ext) return json({ ok: false, reason: 'bad_type', accepted: Object.keys(PHOTO_TYPES) }, 415);

  const bytes = await request.arrayBuffer();
  if (bytes.byteLength === 0) return json({ ok: false, reason: 'empty_body' }, 400);
  if (bytes.byteLength > PHOTO_MAX_BYTES) return json({ ok: false, reason: 'too_large', max_bytes: PHOTO_MAX_BYTES }, 413);

  const photos: string[] = JSON.parse((row.photos as string) || '[]');
  const kindCount = photos.filter((k) => k.includes(`/${kind}/`)).length;
  if (kindCount >= PHOTO_LIMITS[kind]) {
    return json({ ok: false, reason: 'kind_limit_reached', limit: PHOTO_LIMITS[kind] }, 409);
  }

  const key = `orders/${orderId}/${kind}/${randomHex128()}.${ext}`;
  await env.PHOTOS.put(key, bytes, { httpMetadata: { contentType } });

  photos.push(key);
  await db.prepare('UPDATE orders SET photos = ? WHERE id = ?').bind(JSON.stringify(photos), orderId).run();
  await logEvent(db, orderId, 'photo_uploaded', { kind, key, bytes: bytes.byteLength });

  return json({ ok: true, key, count: photos.length });
}
