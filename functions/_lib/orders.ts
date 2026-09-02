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
}

export interface OrdersEnv {
  ORDERS_DB?: D1Database;
  PHOTOS?: R2Bucket;
  ADMIN_TOKEN?: string;
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

export const adminOk = (request: Request, env: OrdersEnv): boolean =>
  !!env.ADMIN_TOKEN && request.headers.get('x-admin-token') === env.ADMIN_TOKEN;

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

export const STATUSES = [
  'new', 'quoted', 'booked', 'assigned', 'in_progress', 'qc',
  'awaiting_payment', 'paid', 'done', 'cancelled',
] as const;
export type OrderStatus = (typeof STATUSES)[number];

/** Legal transitions. booked→in_progress covers jobs Mike does himself
 *  (no partner assignment); qc→in_progress is the rework path. */
export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ['quoted', 'cancelled'],
  quoted: ['booked', 'cancelled'],
  booked: ['assigned', 'in_progress', 'cancelled'],
  assigned: ['in_progress', 'cancelled'],
  in_progress: ['qc', 'cancelled'],
  qc: ['awaiting_payment', 'in_progress'],
  awaiting_payment: ['paid', 'cancelled'],
  paid: ['done'],
  done: [],
  cancelled: [],
};

export const CHANNELS = ['form', 'whatsapp', 'phone', 'b2b'] as const;
export const LANGS = ['es', 'en', 'ca'] as const;
export const SIZES = ['compact', 'sedan', 'suv', 'van', 'sports'] as const;
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

// ── Order row (de)serialisation ──────────────────────────────────────────────

const JSON_COLUMNS = ['photos', 'quote_breakdown', 'attr'] as const;
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
