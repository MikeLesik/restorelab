/**
 * Partner registration upload (RL-431): POST /api/socio/<token>/upload?kind=
 *   work | kit | dni | reta | rc
 * Raw bytes, authorized by the magic-link token (sha256 vs partners.token_hash).
 * Stored in R2 under partners/<id>/<kind>/<rand>.<ext> — unguessable, served
 * back to Mike only through /api/photo/<key>. The key is appended to
 * partners.docs. Images/PDF (≤6MB) and video for the kit (≤30MB).
 */

import {
  json, inert, notFound, randomHex128, sha256hex,
  DOC_KINDS, DOC_TYPES, DOC_MAX_BYTES,
} from '../../../_lib/orders';
import type { OrdersEnv } from '../../../_lib/orders';

const IMG_MAX = 6 * 1024 * 1024;

export async function onRequestPost(context: {
  request: Request;
  env: OrdersEnv;
  params: { token: string };
}): Promise<Response> {
  const { request, env, params } = context;
  if (!env.ORDERS_DB) return inert('orders_db_not_configured');
  if (!env.PHOTOS) return inert('photos_bucket_not_configured');
  const db = env.ORDERS_DB;

  if (!/^[a-f0-9]{32}$/.test(params.token)) return notFound();
  const hash = await sha256hex(params.token);
  const partner = await db
    .prepare('SELECT id, docs, status FROM partners WHERE token_hash = ?')
    .bind(hash)
    .first<Record<string, unknown>>();
  if (!partner) return notFound();

  const url = new URL(request.url);
  const kind = url.searchParams.get('kind') || '';
  if (!DOC_KINDS.includes(kind as any)) return json({ ok: false, reason: 'bad_kind' }, 400);

  const ct = (request.headers.get('Content-Type') || '').split(';')[0].trim();
  const ext = DOC_TYPES[ct];
  if (!ext) return json({ ok: false, reason: 'bad_type', ct }, 415);

  const body = await request.arrayBuffer();
  const isVideo = ct.startsWith('video/');
  const max = isVideo ? DOC_MAX_BYTES : IMG_MAX;
  if (body.byteLength === 0 || body.byteLength > max) return json({ ok: false, reason: 'bad_size', bytes: body.byteLength, max }, 413);

  const key = `partners/${partner.id}/${kind}/${randomHex128()}.${ext}`;
  await (env.PHOTOS as any).put(key, body, { httpMetadata: { contentType: ct } });

  const docs: any[] = (() => { try { return JSON.parse((partner.docs as string) || '[]'); } catch { return []; } })();
  docs.push({ kind, key, ct });
  await db.prepare('UPDATE partners SET docs = ? WHERE id = ?').bind(JSON.stringify(docs.slice(0, 40)), partner.id).run();

  return json({ ok: true, key, kind });
}
