/**
 * Shared helpers for the Orders OS API (RL-410).
 *
 * Directory is underscore-prefixed, so Pages Functions never routes it.
 * Philosophy (same as capi.ts): every endpoint is inert-with-warning JSON
 * until its bindings exist, and safe to deploy first.
 */

// ── Minimal structural types (avoid a @cloudflare/workers-types dep) ─────────

export interface D1Result {
  results?: Record<string, unknown>[];
  meta?: Record<string, unknown>;
}
export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  run(): Promise<D1Result>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all(): Promise<D1Result>;
}
export interface D1Database {
  prepare(sql: string): D1Statement;
}
export interface R2Object {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
  size: number;
}
export interface R2Bucket {
  put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(key: string): Promise<R2Object | null>;
  delete(key: string): Promise<void>;
}

export interface OrdersEnv {
  ORDERS_DB?: D1Database;
  PHOTOS?: R2Bucket;
  ADMIN_TOKEN?: string;
  /** Push-notification URL for new public orders (ntfy.sh topic or any
   *  endpoint accepting a plain-text POST). Inert until set. */
  NOTIFY_WEBHOOK?: string;
}

/**
 * Owner push for events that must not sit unseen (a new public order backs
 * the "precio en ≤1h" promise). Plain-text POST; the Title/Priority/Tags
 * headers are ntfy.sh conventions, harmlessly ignored by generic endpoints.
 * Never throws — notification failure must not fail the order.
 */
export async function notifyOwner(env: OrdersEnv, title: string, text: string): Promise<void> {
  if (!env.NOTIFY_WEBHOOK) return;
  try {
    await fetch(env.NOTIFY_WEBHOOK, {
      method: 'POST',
      headers: { Title: title, Priority: 'high', Tags: 'car' },
      body: text,
    });
  } catch { /* best-effort */ }
}

// ── Responses ────────────────────────────────────────────────────────────────

export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const inert = (reason: string): Response => json({ ok: false, reason });

/** Wrong/missing admin token → 404 (endpoint existence stays invisible). */
export const notFound = (): Response => new Response('Not found', { status: 404 });

/** Constant-time-ish string comparison (token/signature checks). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const adminOk = (request: Request, env: OrdersEnv): boolean =>
  !!env.ADMIN_TOKEN && safeEqual(request.headers.get('x-admin-token') || '', env.ADMIN_TOKEN);

/** Public write endpoints are same-origin only (no CORS headers are ever
 *  emitted; this additionally rejects cross-site form posts). */
export const sameOrigin = (request: Request): boolean => {
  const origin = request.headers.get('Origin');
  if (!origin) return true; // curl / same-origin GET / older browsers
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
};

// ── IDs ──────────────────────────────────────────────────────────────────────

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Tiny ULID: 48-bit ms timestamp + 80-bit random, Crockford base32. */
export function ulid(): string {
  let ts = Date.now();
  const time = new Array(10);
  for (let i = 9; i >= 0; i--) {
    time[i] = CROCKFORD[ts % 32];
    ts = Math.floor(ts / 32);
  }
  const rnd = new Uint8Array(16);
  crypto.getRandomValues(rnd);
  let rand = '';
  for (let i = 0; i < 16; i++) rand += CROCKFORD[rnd[i] % 32];
  return time.join('') + rand;
}

/** Short human order code: RL-O- + 4 chars, no ambiguous glyphs (RL-301 style). */
export function orderCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rnd = new Uint8Array(4);
  crypto.getRandomValues(rnd);
  let code = '';
  for (let i = 0; i < 4; i++) code += alphabet[rnd[i] % alphabet.length];
  return `RL-O-${code}`;
}

/** 128-bit random hex (photo keys, tokens). */
export function randomHex128(): string {
  const rnd = new Uint8Array(16);
  crypto.getRandomValues(rnd);
  return [...rnd].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ── State machine ────────────────────────────────────────────────────────────
// Single source of truth shared with the /admin UI (src/lib/orderPipeline.ts).

export { STATUSES, TRANSITIONS, CHANNELS, LANGS, SIZES } from '../../src/lib/orderPipeline';
export type { OrderStatus } from '../../src/lib/orderPipeline';
export const PHOTO_KINDS = ['intake', 'before', 'after'] as const;
export const PHOTO_LIMITS: Record<string, number> = { intake: 6, before: 8, after: 8 };
export const PHOTO_MAX_BYTES = 6 * 1024 * 1024;
export const PHOTO_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

// Partner-registration uploads (RL-431): work photos, a kit video, and
// document scans (DNI/NIE, alta RETA, RC policy). Images + PDF + video.
export const DOC_KINDS = ['work', 'kit', 'dni', 'reta', 'rc'] as const;
export const DOC_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'image/heic': 'heic', 'image/heif': 'heif', 'application/pdf': 'pdf',
  'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
};
export const DOC_MAX_BYTES = 30 * 1024 * 1024;

// ── Order row (de)serialisation ──────────────────────────────────────────────

const JSON_COLUMNS = ['photos', 'quote_breakdown', 'attr', 'addons'] as const;

/** Sum of add-on prices on an order (raw row or shaped). */
export function addonsTotal(order: Record<string, unknown>): number {
  const raw = order.addons;
  const list = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return []; } })() : raw;
  if (!Array.isArray(list)) return 0;
  return Math.round(list.reduce((s: number, a: any) => s + (Number(a?.price_eur) || 0), 0) * 100) / 100;
}
const PRIVATE_COLUMNS = ['intake_token', 'job_token_hash'] as const;

/** Parse JSON columns and strip secrets before returning a row to a client. */
export function shapeOrder(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };
  for (const col of JSON_COLUMNS) {
    if (typeof out[col] === 'string') {
      try { out[col] = JSON.parse(out[col] as string); } catch { /* leave as-is */ }
    }
  }
  for (const col of PRIVATE_COLUMNS) delete out[col];
  return out;
}

export async function logEvent(
  db: D1Database, orderId: string, type: string, data?: Record<string, unknown>,
): Promise<void> {
  await db
    .prepare('INSERT INTO order_events (order_id, ts, type, data) VALUES (?, ?, ?, ?)')
    .bind(orderId, new Date().toISOString(), type, data ? JSON.stringify(data) : null)
    .run();
}
