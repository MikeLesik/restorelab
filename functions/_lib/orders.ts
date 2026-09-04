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
  /** Push-notification URL for OWNER events (ntfy.sh topic URL or any
   *  endpoint accepting a plain-text POST). Also the master gate: partner
   *  pushes fire only when this is set. Inert until set. */
  NOTIFY_WEBHOOK?: string;
  /** ntfy server base for PER-PARTNER topics (default https://ntfy.sh). */
  NTFY_BASE?: string;
}

/**
 * Owner push for events that must not sit unseen (a new public order backs
 * the "precio en ≤1h" promise). Plain-text POST; the Title/Priority/Tags
 * headers are ntfy.sh conventions, harmlessly ignored by generic endpoints.
 * Never throws — notification failure must not fail the order.
 */
// The ntfy Title is an HTTP header (ByteString / Latin-1). A raw emoji or
// Cyrillic char there makes the Workers fetch() throw, silently dropping the
// push. So the header stays a constant ASCII name and the full emoji/UTF-8
// line rides in the BODY (bodies are UTF-8-safe). Never throws.
async function ntfyPost(url: string, tags: string, title: string, text: string): Promise<void> {
  try {
    await fetch(url, {
      method: 'POST',
      headers: { Title: 'restoreLab', Priority: 'high', Tags: tags },
      body: text ? `${title}\n${text}` : title,
      signal: AbortSignal.timeout(4000),
    });
  } catch { /* best-effort — a failed push must never fail the request */ }
}

export async function notifyOwner(env: OrdersEnv, title: string, text: string): Promise<void> {
  if (!env.NOTIFY_WEBHOOK) return;
  await ntfyPost(env.NOTIFY_WEBHOOK, 'car', title, text);
}

/** Human label for owner pushes: "RL-O-1A2B · Laura". */
export function orderLabel(o: Record<string, unknown>): string {
  const name = String(o.client_name || '').split(' ')[0];
  return `${o.code || o.id}${name ? ' · ' + name : ''}`;
}

/** Spanish status labels for owner pushes (server-side; not the client i18n). */
export const STATUS_LABEL_ES: Record<string, string> = {
  new: 'Nuevo', quoted: 'Presupuestado', booked: 'Confirmado', assigned: 'Asignado',
  in_progress: 'En curso', qc: 'Control calidad', awaiting_payment: 'A cobrar',
  paid: 'Pagado', done: 'Cerrado', cancelled: 'Cancelado',
};

/** Per-partner ntfy topic — unguessable (derived from the partner id, which is
 *  never public). Shown to the partner in their cabinet so they can subscribe. */
export async function partnerTopic(partnerId: string): Promise<string> {
  return 'rl-p-' + (await sha256hex(partnerId)).slice(0, 20);
}

/** Push to a SINGLE partner's ntfy topic. Same gate as notifyOwner
 *  (NOTIFY_WEBHOOK configured = notifications on); base = NTFY_BASE || ntfy.sh.
 *  Never throws — a failed push must not fail the request. */
export async function notifyPartner(env: OrdersEnv, partnerId: string | null | undefined, title: string, text: string): Promise<void> {
  if (!env.NOTIFY_WEBHOOK || !partnerId) return;
  const base = (env.NTFY_BASE || 'https://ntfy.sh').replace(/\/+$/, '');
  await ntfyPost(`${base}/${await partnerTopic(partnerId)}`, 'wrench', title, text);
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

// ── Cloudflare Access (Zero Trust) email-OTP auth for the admin ───────────────
// The /admin page is gated by a Cloudflare Access self-hosted app; after the
// One-time PIN the CF_Authorization cookie rides along (domain-wide) to /api/*.
// These are PUBLIC identifiers (the team domain is the OTP login host, the AUD
// only names the app) — knowing them grants nothing without a signed JWT.
const ACCESS_TEAM_DOMAIN = 'dark-poetry-2789.cloudflareaccess.com';
const ACCESS_AUD = '614b16fa94c2245f6fa2c529433dda2be91cd24490cde80c3257bab31a691d28';
const ACCESS_EMAIL = 'lesikom@gmail.com';
const ACCESS_ISSUER = `https://${ACCESS_TEAM_DOMAIN}`;

let _jwksKeys: any[] | null = null;
let _jwksAt = 0;
async function accessJwks(): Promise<any[]> {
  if (_jwksKeys && Date.now() - _jwksAt < 3_600_000) return _jwksKeys;
  const res = await fetch(`${ACCESS_ISSUER}/cdn-cgi/access/certs`);
  const body = (await res.json()) as { keys?: any[] };
  const keys = body.keys || [];
  _jwksKeys = keys;
  _jwksAt = Date.now();
  return keys;
}
function b64urlBytes(s: string): ArrayBuffer {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}
function b64urlJson(s: string): any {
  return JSON.parse(new TextDecoder().decode(b64urlBytes(s)));
}

/** Verify a Cloudflare Access JWT (RS256) against the team's JWKS. Returns the
 *  payload on success, null on any failure — never throws. */
async function verifyAccessJwt(token: string): Promise<Record<string, any> | null> {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const header = b64urlJson(h);
    const payload = b64urlJson(p);
    if (payload.iss !== ACCESS_ISSUER) return null;
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(ACCESS_AUD)) return null;
    if (!payload.exp || payload.exp * 1000 < Date.now()) return null;
    const jwk = (await accessJwks()).find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey(
      'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'],
    );
    const ok = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5', key, b64urlBytes(s), new TextEncoder().encode(`${h}.${p}`),
    );
    return ok ? payload : null;
  } catch {
    return null;
  }
}

/** True if the request carries a valid Access session for the admin email. */
export async function accessOk(request: Request): Promise<boolean> {
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  const token = request.headers.get('Cf-Access-Jwt-Assertion') || (m ? m[1] : '');
  if (!token) return false;
  const payload = await verifyAccessJwt(token);
  return !!payload && String(payload.email || '').toLowerCase() === ACCESS_EMAIL;
}

/** Admin auth: a valid Access email-OTP session OR the x-admin-token fallback
 *  (kept so a missed Access verification can never lock the owner out). */
export async function adminAuthed(request: Request, env: OrdersEnv): Promise<boolean> {
  return adminOk(request, env) || (await accessOk(request));
}

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
