/**
 * Photo delivery (RL-410): GET /api/photo/orders/<id>/<kind>/<random>.<ext>
 *
 * Streams the object from R2. Keys embed 128 bits of randomness and there is
 * no listing endpoint, so a key is its own capability — same model as a
 * signed URL, without the expiry (photos live as long as the order).
 */

import { inert, notFound } from '../../_lib/orders';
import type { OrdersEnv } from '../../_lib/orders';

const KEY_RE = /^orders\/[0-9A-Z]+\/(intake|before|after)\/[a-f0-9]{32}\.(jpg|png|webp|heic|heif)$/;

export async function onRequestGet(context: {
  env: OrdersEnv;
  params: { key: string | string[] };
}): Promise<Response> {
  const { env, params } = context;
  if (!env.PHOTOS) return inert('photos_bucket_not_configured');

  const key = Array.isArray(params.key) ? params.key.join('/') : params.key;
  if (!KEY_RE.test(key)) return notFound();

  const obj = await env.PHOTOS.get(key);
  if (!obj) return notFound();

  return new Response(obj.body, {
    headers: {
      'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
