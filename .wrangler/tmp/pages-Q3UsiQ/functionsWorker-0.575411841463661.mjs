var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../src/lib/orderPipeline.ts
var STATUSES = [
  "new",
  "quoted",
  "booked",
  "assigned",
  "in_progress",
  "qc",
  "awaiting_payment",
  "paid",
  "done",
  "cancelled"
];
var TRANSITIONS = {
  new: ["quoted", "cancelled"],
  quoted: ["booked", "cancelled"],
  booked: ["assigned", "in_progress", "cancelled"],
  assigned: ["in_progress", "cancelled"],
  in_progress: ["qc", "cancelled"],
  qc: ["awaiting_payment", "in_progress"],
  awaiting_payment: ["paid", "cancelled"],
  paid: ["done"],
  done: [],
  cancelled: []
};
var CHANNELS = ["form", "whatsapp", "phone", "b2b"];
var LANGS = ["es", "en", "ca"];
var SIZES = ["compact", "sedan", "suv", "van", "sports"];

// _lib/orders.ts
async function notifyOwner(env, title, text) {
  if (!env.NOTIFY_WEBHOOK) return;
  try {
    await fetch(env.NOTIFY_WEBHOOK, {
      method: "POST",
      headers: { Title: title, Priority: "high", Tags: "car" },
      body: text
    });
  } catch {
  }
}
__name(notifyOwner, "notifyOwner");
var json = /* @__PURE__ */ __name((body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json" }
}), "json");
var inert = /* @__PURE__ */ __name((reason) => json({ ok: false, reason }), "inert");
var notFound = /* @__PURE__ */ __name(() => new Response("Not found", { status: 404 }), "notFound");
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
__name(safeEqual, "safeEqual");
var adminOk = /* @__PURE__ */ __name((request, env) => !!env.ADMIN_TOKEN && safeEqual(request.headers.get("x-admin-token") || "", env.ADMIN_TOKEN), "adminOk");
var sameOrigin = /* @__PURE__ */ __name((request) => {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}, "sameOrigin");
var CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function ulid() {
  let ts = Date.now();
  const time = new Array(10);
  for (let i = 9; i >= 0; i--) {
    time[i] = CROCKFORD[ts % 32];
    ts = Math.floor(ts / 32);
  }
  const rnd = new Uint8Array(16);
  crypto.getRandomValues(rnd);
  let rand = "";
  for (let i = 0; i < 16; i++) rand += CROCKFORD[rnd[i] % 32];
  return time.join("") + rand;
}
__name(ulid, "ulid");
function orderCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rnd = new Uint8Array(4);
  crypto.getRandomValues(rnd);
  let code = "";
  for (let i = 0; i < 4; i++) code += alphabet[rnd[i] % alphabet.length];
  return `RL-O-${code}`;
}
__name(orderCode, "orderCode");
function randomHex128() {
  const rnd = new Uint8Array(16);
  crypto.getRandomValues(rnd);
  return [...rnd].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(randomHex128, "randomHex128");
async function sha256hex(input) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256hex, "sha256hex");
var PHOTO_KINDS = ["intake", "before", "after"];
var PHOTO_LIMITS = { intake: 6, before: 8, after: 8 };
var PHOTO_MAX_BYTES = 6 * 1024 * 1024;
var PHOTO_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif"
};
var JSON_COLUMNS = ["photos", "quote_breakdown", "attr"];
var PRIVATE_COLUMNS = ["intake_token", "job_token_hash"];
function shapeOrder(row) {
  const out = { ...row };
  for (const col of JSON_COLUMNS) {
    if (typeof out[col] === "string") {
      try {
        out[col] = JSON.parse(out[col]);
      } catch {
      }
    }
  }
  for (const col of PRIVATE_COLUMNS) delete out[col];
  return out;
}
__name(shapeOrder, "shapeOrder");
async function logEvent(db, orderId, type, data) {
  await db.prepare("INSERT INTO order_events (order_id, ts, type, data) VALUES (?, ?, ?, ?)").bind(orderId, (/* @__PURE__ */ new Date()).toISOString(), type, data ? JSON.stringify(data) : null).run();
}
__name(logEvent, "logEvent");

// api/orders/[id]/job-token.ts
async function onRequestPost(context) {
  const { request, env, params } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert("orders_db_not_configured");
  const db = env.ORDERS_DB;
  const order = await db.prepare("SELECT id, code, partner_id FROM orders WHERE id = ? OR code = ?").bind(params.id, params.id).first();
  if (!order) return json({ ok: false, reason: "not_found" }, 404);
  if (!order.partner_id) return json({ ok: false, reason: "no_partner_assigned" }, 409);
  const token = randomHex128();
  await db.prepare("UPDATE orders SET job_token_hash = ? WHERE id = ?").bind(await sha256hex(token), order.id).run();
  await logEvent(db, order.id, "job_token_issued", { reissue: true });
  return json({ ok: true, token, url: `/p/${token}` });
}
__name(onRequestPost, "onRequestPost");

// api/orders/[id]/photos.ts
var ACTIVE_PARTNER_STATUSES = ["assigned", "in_progress", "qc"];
async function onRequestPost2(context) {
  const { request, env, params } = context;
  if (!env.ORDERS_DB) return inert("orders_db_not_configured");
  if (!env.PHOTOS) return inert("photos_bucket_not_configured");
  const db = env.ORDERS_DB;
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") || "";
  if (!PHOTO_KINDS.includes(kind)) return json({ ok: false, reason: "bad_kind" }, 400);
  const token = url.searchParams.get("token") || "";
  let row = await db.prepare("SELECT * FROM orders WHERE id = ? OR code = ?").bind(params.id, params.id).first();
  if (!row && token && /^[a-f0-9]{32}$/.test(token) && kind !== "intake") {
    row = await db.prepare("SELECT * FROM orders WHERE job_token_hash = ?").bind(await sha256hex(token)).first();
  }
  if (!row) return notFound();
  const orderId = row.id;
  const isAdmin = adminOk(request, env);
  if (!isAdmin) {
    if (kind === "intake") {
      if (!token || token !== row.intake_token) return notFound();
    } else {
      const hash = row.job_token_hash;
      if (!token || !hash || await sha256hex(token) !== hash) return notFound();
      if (!ACTIVE_PARTNER_STATUSES.includes(row.status)) return notFound();
    }
  }
  const contentType = (request.headers.get("Content-Type") || "").split(";")[0].trim();
  const ext = PHOTO_TYPES[contentType];
  if (!ext) return json({ ok: false, reason: "bad_type", accepted: Object.keys(PHOTO_TYPES) }, 415);
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength === 0) return json({ ok: false, reason: "empty_body" }, 400);
  if (bytes.byteLength > PHOTO_MAX_BYTES) return json({ ok: false, reason: "too_large", max_bytes: PHOTO_MAX_BYTES }, 413);
  const photos = JSON.parse(row.photos || "[]");
  const kindCount = photos.filter((k) => k.includes(`/${kind}/`)).length;
  if (kindCount >= PHOTO_LIMITS[kind]) {
    return json({ ok: false, reason: "kind_limit_reached", limit: PHOTO_LIMITS[kind] }, 409);
  }
  const key = `orders/${orderId}/${kind}/${randomHex128()}.${ext}`;
  await env.PHOTOS.put(key, bytes, { httpMetadata: { contentType } });
  photos.push(key);
  await db.prepare("UPDATE orders SET photos = ? WHERE id = ?").bind(JSON.stringify(photos), orderId).run();
  await logEvent(db, orderId, "photo_uploaded", { kind, key, bytes: bytes.byteLength });
  return json({ ok: true, key, count: photos.length });
}
__name(onRequestPost2, "onRequestPost");

// _lib/schema.ts
var SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN
      ('new','quoted','booked','assigned','in_progress','qc',
       'awaiting_payment','paid','done','cancelled')),
    channel TEXT NOT NULL DEFAULT 'form' CHECK (channel IN ('form','whatsapp','phone','b2b')),
    lang TEXT NOT NULL DEFAULT 'es',
    service_slug TEXT,
    size TEXT,
    client_name TEXT,
    phone TEXT,
    area_slug TEXT,
    address TEXT,
    photos TEXT NOT NULL DEFAULT '[]',
    quote_eur REAL,
    quote_breakdown TEXT,
    partner_id TEXT,
    payout_pct REAL,
    accepted_at TEXT,
    scheduled_at TEXT,
    ref_code TEXT,
    attr TEXT,
    payment_link TEXT,
    paid_eur REAL,
    paid_at TEXT,
    qc_status TEXT,
    rework INTEGER NOT NULL DEFAULT 0,
    review_sent_at TEXT,
    notes TEXT,
    intake_token TEXT,
    job_token_hash TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at)`,
  `CREATE TABLE IF NOT EXISTS partners (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    nif TEXT,
    phone TEXT,
    email TEXT,
    zones TEXT NOT NULL DEFAULT '[]',
    skills TEXT NOT NULL DEFAULT '[]',
    payout_pct REAL NOT NULL DEFAULT 70,
    active INTEGER NOT NULL DEFAULT 1,
    rc_expiry TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS order_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    ts TEXT NOT NULL,
    type TEXT NOT NULL,
    data TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_events_order ON order_events(order_id)`,
  `CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    reset_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`
];
var SCHEMA_ALTERS = [
  `ALTER TABLE orders ADD COLUMN payout_pct REAL`,
  `ALTER TABLE orders ADD COLUMN accepted_at TEXT`,
  `ALTER TABLE partners ADD COLUMN rc_expiry TEXT`
];

// api/admin/migrate.ts
async function onRequestPost3(context) {
  const { request, env } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert("orders_db_not_configured");
  const applied = [];
  for (const sql of SCHEMA_STATEMENTS) {
    await env.ORDERS_DB.prepare(sql).run();
    applied.push(sql.trim().split(/\s+/).slice(0, 6).join(" "));
  }
  for (const sql of SCHEMA_ALTERS) {
    try {
      await env.ORDERS_DB.prepare(sql).run();
      applied.push(sql.trim());
    } catch (e) {
      if (!/duplicate column/i.test(String(e))) throw e;
    }
  }
  return json({ ok: true, statements: applied.length, applied });
}
__name(onRequestPost3, "onRequestPost");

// _lib/wa.ts
var GRAPH_VERSION = "v21.0";
var LANG_CODES = { es: "es", en: "en", ca: "ca" };
var waConfigured = /* @__PURE__ */ __name((env) => !!(env.WA_CLOUD_TOKEN && env.WA_CLOUD_PHONE_ID), "waConfigured");
async function sendTemplate(env, toPhone, template, lang, bodyParams) {
  const to = toPhone.replace(/\D/g, "");
  if (!to) return { ok: false, error: "no_phone" };
  try {
    const res = await fetch(
      `${env.WA_API_BASE || "https://graph.facebook.com"}/${GRAPH_VERSION}/${env.WA_CLOUD_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.WA_CLOUD_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: template,
            language: { code: LANG_CODES[lang] || "es" },
            components: bodyParams.length ? [{ type: "body", parameters: bodyParams.map((text) => ({ type: "text", text })) }] : []
          }
        })
      }
    );
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
    return { ok: true, id: data?.messages?.[0]?.id };
  } catch (e) {
    return { ok: false, error: "unreachable" };
  }
}
__name(sendTemplate, "sendTemplate");
async function attempt(db, env, orderId, to, template, lang, params) {
  const res = await sendTemplate(env, to, template, lang, params);
  await logEvent(db, orderId, res.ok ? "wa_sent" : "wa_send_failed", {
    template,
    ...res.ok ? { message_id: res.id } : { error: res.error, manual_send_needed: true }
  });
}
__name(attempt, "attempt");
async function fireStatusHooks(db, env, order, to) {
  if (!waConfigured(env)) return;
  const site = env.PUBLIC_SITE_URL || "https://restorelab.io";
  const lang = order.lang || "es";
  if (to === "assigned" && order.partner_id) {
    const partner = await db.prepare("SELECT name, phone FROM partners WHERE id = ?").bind(order.partner_id).first();
    if (!partner?.phone) {
      await logEvent(db, order.id, "wa_send_failed", {
        template: "job_assigned",
        error: "partner_without_phone",
        manual_send_needed: true
      });
      return;
    }
    const token = randomHex128();
    await db.prepare("UPDATE orders SET job_token_hash = ? WHERE id = ?").bind(await sha256hex(token), order.id).run();
    await logEvent(db, order.id, "job_token_issued", { via: "wa_hook" });
    await attempt(db, env, order.id, partner.phone, "job_assigned", "es", [
      partner.name.split(" ")[0],
      String(order.code),
      String(order.service_slug || "trabajo"),
      order.scheduled_at ? String(order.scheduled_at) : "por confirmar",
      `${site}/p/${token}`
    ]);
  }
  if (to === "awaiting_payment" && order.payment_link && order.phone) {
    await attempt(db, env, order.id, String(order.phone), "payment_link", lang, [
      String(order.code),
      String(order.payment_link)
    ]);
  }
}
__name(fireStatusHooks, "fireStatusHooks");

// api/stripe/create-link.ts
var KINDS = ["full", "deposit", "rest"];
var DEPOSIT_PCT = 0.3;
async function onRequestPost4(context) {
  const { request, env } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert("orders_db_not_configured");
  if (!env.STRIPE_SECRET_KEY) return inert("stripe_not_configured");
  const db = env.ORDERS_DB;
  let b;
  try {
    b = await request.json();
  } catch {
    return json({ ok: false, reason: "bad_json" }, 400);
  }
  const kind = KINDS.includes(b.kind) ? b.kind : "full";
  const order = await db.prepare("SELECT * FROM orders WHERE id = ? OR code = ?").bind(String(b.order_id || ""), String(b.order_id || "")).first();
  if (!order) return json({ ok: false, reason: "not_found" }, 404);
  const quote = Number(order.quote_eur);
  if (!Number.isFinite(quote) || quote <= 0) return json({ ok: false, reason: "no_quote" }, 409);
  const paid = Number(order.paid_eur) || 0;
  let amountEur;
  if (kind === "deposit") amountEur = Math.round(quote * DEPOSIT_PCT * 100) / 100;
  else if (kind === "rest") amountEur = Math.round((quote - paid) * 100) / 100;
  else amountEur = quote;
  const amountCents = Math.round(amountEur * 100);
  if (amountCents <= 0) return json({ ok: false, reason: "nothing_to_charge" }, 409);
  const site = env.PUBLIC_SITE_URL || "https://restorelab.io";
  const lang = ["es", "en", "ca"].includes(order.lang) ? order.lang : "es";
  const label = kind === "deposit" ? "se\xF1al 30%" : kind === "rest" ? "resto" : "pago";
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("payment_method_types[0]", "card");
  form.set("payment_method_types[1]", "bizum");
  form.set("line_items[0][price_data][currency]", "eur");
  form.set("line_items[0][price_data][unit_amount]", String(amountCents));
  form.set("line_items[0][price_data][product_data][name]", `restoreLab ${order.code} \u2014 ${label}`);
  form.set("line_items[0][quantity]", "1");
  form.set("metadata[order_id]", String(order.id));
  form.set("metadata[kind]", kind);
  form.set("success_url", `${site}/${lang}?pago=ok`);
  form.set("cancel_url", `${site}/${lang}/contact`);
  let session;
  try {
    const res = await fetch(`${env.STRIPE_API_BASE || "https://api.stripe.com"}/v1/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: form.toString()
    });
    session = await res.json();
    if (!res.ok || !session.url) {
      return json({
        ok: false,
        reason: "stripe_error",
        detail: session?.error?.message || `HTTP ${res.status}`
      }, 502);
    }
  } catch (e) {
    return json({ ok: false, reason: "stripe_unreachable" }, 502);
  }
  const from = order.status;
  const advance = TRANSITIONS[from]?.includes("awaiting_payment");
  await db.prepare(`UPDATE orders SET payment_link = ?${advance ? ", status = 'awaiting_payment'" : ""} WHERE id = ?`).bind(session.url, order.id).run();
  await logEvent(db, order.id, "payment_link_created", {
    kind,
    amount_eur: amountEur,
    session_id: session.id,
    ...advance ? { status: { from, to: "awaiting_payment" } } : {}
  });
  if (advance || from === "awaiting_payment") {
    const fresh = await db.prepare("SELECT * FROM orders WHERE id = ?").bind(order.id).first();
    await fireStatusHooks(db, env, fresh, "awaiting_payment");
  }
  return json({ ok: true, url: session.url, amount_eur: amountEur, kind, advanced: !!advance });
}
__name(onRequestPost4, "onRequestPost");

// api/stripe/webhook.ts
var TOLERANCE_S = 300;
async function hmacHex(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hmacHex, "hmacHex");
async function alreadyProcessed(db, orderId, sessionId) {
  const row = await db.prepare(`SELECT id FROM order_events WHERE order_id = ? AND type = 'stripe_paid' AND instr(data, ?) > 0 LIMIT 1`).bind(orderId, sessionId).first();
  return !!row;
}
__name(alreadyProcessed, "alreadyProcessed");
async function onRequestPost5(context) {
  const { request, env } = context;
  if (!env.STRIPE_WEBHOOK_SECRET) return inert("stripe_webhook_not_configured");
  if (!env.ORDERS_DB) return inert("orders_db_not_configured");
  const db = env.ORDERS_DB;
  const payload = await request.text();
  const header = request.headers.get("Stripe-Signature") || "";
  const parts = Object.fromEntries(
    header.split(",").map((p) => p.split("=")).filter((p) => p.length === 2)
  );
  const v1s = header.split(",").filter((p) => p.trim().startsWith("v1=")).map((p) => p.trim().slice(3));
  const t = Number(parts.t);
  if (!t || v1s.length === 0) return json({ ok: false, reason: "bad_signature_header" }, 400);
  if (Math.abs(Date.now() / 1e3 - t) > TOLERANCE_S) return json({ ok: false, reason: "timestamp_out_of_tolerance" }, 400);
  const expected = await hmacHex(env.STRIPE_WEBHOOK_SECRET, `${parts.t}.${payload}`);
  if (!v1s.some((v) => safeEqual(v, expected))) return json({ ok: false, reason: "bad_signature" }, 400);
  let event;
  try {
    event = JSON.parse(payload);
  } catch {
    return json({ ok: false, reason: "bad_json" }, 400);
  }
  if (event.type !== "checkout.session.completed") return json({ ok: true, ignored: event.type });
  const session = event.data?.object || {};
  const orderId = session.metadata?.order_id;
  const sessionId = String(session.id || "");
  const amountEur = Math.round(Number(session.amount_total || 0)) / 100;
  if (!orderId || !sessionId || !(amountEur > 0)) return json({ ok: false, reason: "missing_fields" }, 400);
  const order = await db.prepare("SELECT * FROM orders WHERE id = ?").bind(orderId).first();
  if (!order) return json({ ok: false, reason: "order_not_found" }, 200);
  if (await alreadyProcessed(db, orderId, sessionId)) {
    return json({ ok: true, idempotent: true });
  }
  const newPaid = Math.round(((Number(order.paid_eur) || 0) + amountEur) * 100) / 100;
  const quote = Number(order.quote_eur) || 0;
  const covered = quote > 0 && newPaid >= quote - 0.01;
  const from = order.status;
  const advance = covered && TRANSITIONS[from]?.includes("paid");
  await db.prepare(`UPDATE orders SET paid_eur = ?, paid_at = ?${advance ? ", status = 'paid'" : ""} WHERE id = ?`).bind(newPaid, (/* @__PURE__ */ new Date()).toISOString(), orderId).run();
  await logEvent(db, orderId, "stripe_paid", {
    session_id: sessionId,
    amount_eur: amountEur,
    total_paid_eur: newPaid,
    covered,
    kind: session.metadata?.kind,
    ...advance ? { status: { from, to: "paid" } } : {}
  });
  return json({ ok: true, paid_eur: newPaid, covered, advanced: !!advance });
}
__name(onRequestPost5, "onRequestPost");

// api/wa/send.ts
var TEMPLATES = ["job_assigned", "payment_link", "review_request", "reminder_24h"];
async function onRequestPost6(context) {
  const { request, env } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert("orders_db_not_configured");
  if (!waConfigured(env)) return inert("wa_cloud_not_configured");
  let b;
  try {
    b = await request.json();
  } catch {
    return json({ ok: false, reason: "bad_json" }, 400);
  }
  const template = String(b.template || "");
  if (!TEMPLATES.includes(template)) return json({ ok: false, reason: "bad_template", templates: TEMPLATES }, 400);
  const to = String(b.to || "");
  const lang = ["es", "en", "ca"].includes(b.lang) ? b.lang : "es";
  const params = Array.isArray(b.params) ? b.params.map(String).slice(0, 10) : [];
  const res = await sendTemplate(env, to, template, lang, params);
  if (typeof b.order_id === "string" && b.order_id) {
    await logEvent(env.ORDERS_DB, b.order_id, res.ok ? "wa_sent" : "wa_send_failed", {
      template,
      via: "manual",
      ...res.ok ? { message_id: res.id } : { error: res.error, manual_send_needed: true }
    });
  }
  return json(res.ok ? { ok: true, id: res.id } : { ok: false, reason: "send_failed", detail: res.error }, res.ok ? 200 : 502);
}
__name(onRequestPost6, "onRequestPost");

// api/job/[token].ts
var ACTIVE = ["assigned", "in_progress", "qc"];
async function findByToken(env, token) {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  const hash = await sha256hex(token);
  return env.ORDERS_DB.prepare("SELECT * FROM orders WHERE job_token_hash = ?").bind(hash).first();
}
__name(findByToken, "findByToken");
async function onRequestGet(context) {
  const { env, params } = context;
  if (!env.ORDERS_DB) return inert("orders_db_not_configured");
  const order = await findByToken(env, params.token);
  if (!order || !ACTIVE.includes(order.status)) return notFound();
  const photos = JSON.parse(order.photos || "[]");
  let pct = Number(order.payout_pct) || 0;
  if (!pct && order.partner_id) {
    const p = await env.ORDERS_DB.prepare("SELECT payout_pct FROM partners WHERE id = ?").bind(order.partner_id).first();
    pct = Number(p?.payout_pct) || 0;
  }
  const quote = Number(order.quote_eur) || 0;
  const payoutEur = pct && quote ? Math.round(quote * pct) / 100 : null;
  let reworkNote = null;
  if (Number(order.rework) > 0) {
    const ev = await env.ORDERS_DB.prepare(`SELECT data FROM order_events WHERE order_id = ? AND type = 'status_changed' ORDER BY id DESC`).bind(order.id).all();
    for (const e of ev.results || []) {
      try {
        const d = JSON.parse(e.data || "{}");
        if (d.status?.from === "qc" && d.status?.to === "in_progress") {
          reworkNote = d.note || null;
          break;
        }
      } catch {
      }
    }
  }
  return json({
    ok: true,
    job: {
      code: order.code,
      status: order.status,
      service_slug: order.service_slug,
      size: order.size,
      area_slug: order.area_slug,
      address: order.address,
      scheduled_at: order.scheduled_at,
      client_first_name: String(order.client_name || "").split(" ")[0] || null,
      notes: order.notes,
      rework: order.rework,
      rework_note: reworkNote,
      accepted_at: order.accepted_at || null,
      payout_pct: pct || null,
      payout_eur: payoutEur,
      // Partner's own uploads so the card reflects progress after reload.
      photos_before: photos.filter((k) => k.includes("/before/")),
      photos_after: photos.filter((k) => k.includes("/after/"))
    }
  });
}
__name(onRequestGet, "onRequestGet");
async function onRequestPost7(context) {
  const { request, env, params } = context;
  if (!env.ORDERS_DB) return inert("orders_db_not_configured");
  const db = env.ORDERS_DB;
  const order = await findByToken(env, params.token);
  if (!order || !ACTIVE.includes(order.status)) return notFound();
  let b;
  try {
    b = await request.json();
  } catch {
    return json({ ok: false, reason: "bad_json" }, 400);
  }
  if (b.action === "accept") {
    if (!order.accepted_at) {
      const ts = (/* @__PURE__ */ new Date()).toISOString();
      await db.prepare("UPDATE orders SET accepted_at = ? WHERE id = ?").bind(ts, order.id).run();
      await logEvent(db, order.id, "partner_accepted", {});
    }
    return json({ ok: true, accepted_at: order.accepted_at || (/* @__PURE__ */ new Date()).toISOString() });
  }
  if (b.action !== "done") return json({ ok: false, reason: "bad_action" }, 400);
  const photos = JSON.parse(order.photos || "[]");
  const before = photos.filter((k) => k.includes("/before/")).length;
  const after = photos.filter((k) => k.includes("/after/")).length;
  if (before < 2 || after < 2) {
    return json({ ok: false, reason: "photos_required", before, after, min: 2 }, 409);
  }
  const notes = typeof b.notes === "string" ? b.notes.trim().slice(0, 1e3) : "";
  let status = order.status;
  const hops = status === "assigned" ? ["in_progress", "qc"] : status === "in_progress" ? ["qc"] : [];
  for (const to of hops) {
    await db.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(to, order.id).run();
    await logEvent(db, order.id, "status_changed", {
      status: { from: status, to },
      by: "partner",
      ...to === "qc" && notes ? { partner_notes: notes } : {}
    });
    status = to;
  }
  if (!hops.length && notes) {
    await logEvent(db, order.id, "partner_note", { partner_notes: notes });
  }
  return json({ ok: true, status });
}
__name(onRequestPost7, "onRequestPost");

// api/orders/[id].ts
async function onRequestDelete(context) {
  const { request, env, params } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert("orders_db_not_configured");
  const db = env.ORDERS_DB;
  const row = await db.prepare("SELECT id, status, photos FROM orders WHERE id = ? OR code = ?").bind(params.id, params.id).first();
  if (!row) return json({ ok: false, reason: "not_found" }, 404);
  if (row.status !== "cancelled") {
    return json({ ok: false, reason: "only_cancelled_deletable", status: row.status }, 409);
  }
  let photosDeleted = 0;
  if (env.PHOTOS) {
    for (const key of JSON.parse(row.photos || "[]")) {
      try {
        await env.PHOTOS.delete(key);
        photosDeleted++;
      } catch {
      }
    }
  }
  await db.prepare("DELETE FROM order_events WHERE order_id = ?").bind(row.id).run();
  await db.prepare("DELETE FROM orders WHERE id = ?").bind(row.id).run();
  return json({ ok: true, deleted: row.id, photos_deleted: photosDeleted });
}
__name(onRequestDelete, "onRequestDelete");
var EDITABLE = {
  client_name: "text",
  phone: "text",
  area_slug: "text",
  address: "text",
  service_slug: "text",
  size: "text",
  lang: "text",
  channel: "text",
  quote_eur: "number",
  quote_breakdown: "json",
  partner_id: "text",
  scheduled_at: "text",
  notes: "text",
  payment_link: "text",
  paid_eur: "number",
  paid_at: "text",
  qc_status: "text",
  rework: "number",
  review_sent_at: "text",
  ref_code: "text",
  attr: "json"
};
async function onRequestGet2(context) {
  const { request, env, params } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert("orders_db_not_configured");
  const row = await env.ORDERS_DB.prepare("SELECT * FROM orders WHERE id = ? OR code = ?").bind(params.id, params.id).first();
  if (!row) return json({ ok: false, reason: "not_found" }, 404);
  const events = await env.ORDERS_DB.prepare("SELECT ts, type, data FROM order_events WHERE order_id = ? ORDER BY id ASC").bind(row.id).all();
  return json({
    ok: true,
    order: shapeOrder(row),
    events: (events.results || []).map((e) => ({
      ...e,
      data: typeof e.data === "string" ? JSON.parse(e.data) : e.data
    }))
  });
}
__name(onRequestGet2, "onRequestGet");
async function onRequestPatch(context) {
  const { request, env, params } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert("orders_db_not_configured");
  const db = env.ORDERS_DB;
  let b;
  try {
    b = await request.json();
  } catch {
    return json({ ok: false, reason: "bad_json" }, 400);
  }
  const row = await db.prepare("SELECT * FROM orders WHERE id = ? OR code = ?").bind(params.id, params.id).first();
  if (!row) return json({ ok: false, reason: "not_found" }, 404);
  const orderId = row.id;
  const sets = [];
  const binds = [];
  const changed = {};
  if (b.status !== void 0) {
    const from = row.status;
    const to = b.status;
    if (!TRANSITIONS[from]) return json({ ok: false, reason: "bad_current_status" }, 500);
    if (!TRANSITIONS[from].includes(to)) {
      return json(
        { ok: false, reason: "illegal_transition", from, to, allowed: TRANSITIONS[from] },
        409
      );
    }
    sets.push("status = ?");
    binds.push(to);
    changed.status = { from, to };
    if (from === "qc" && to === "in_progress") {
      sets.push("rework = rework + 1");
      changed.rework = "incremented";
    }
  }
  for (const [field, kind] of Object.entries(EDITABLE)) {
    if (b[field] === void 0 || field === "rework") continue;
    let value = b[field];
    if (value === null) {
    } else if (kind === "number") {
      value = Number(value);
      if (!Number.isFinite(value)) return json({ ok: false, reason: `bad_${field}` }, 400);
    } else if (kind === "json") {
      if (typeof value !== "object") return json({ ok: false, reason: `bad_${field}` }, 400);
      value = JSON.stringify(value).slice(0, 8192);
    } else {
      if (typeof value !== "string") return json({ ok: false, reason: `bad_${field}` }, 400);
      value = value.slice(0, 1e3);
    }
    sets.push(`${field} = ?`);
    binds.push(value);
    if (field !== "status") changed[field] = value;
  }
  if (typeof b.partner_id === "string" && b.partner_id) {
    const partner = await db.prepare("SELECT payout_pct FROM partners WHERE id = ?").bind(b.partner_id).first();
    if (!partner) return json({ ok: false, reason: "partner_not_found" }, 400);
    sets.push("payout_pct = ?");
    binds.push(Number(partner.payout_pct) || 70);
    changed.payout_pct = Number(partner.payout_pct) || 70;
    if (b.partner_id !== row.partner_id) {
      sets.push("accepted_at = NULL");
      changed.accepted_at = "reset";
    }
  }
  if (typeof b.event_note === "string" && b.event_note.trim()) {
    changed.note = b.event_note.trim().slice(0, 300);
  }
  if (!sets.length) return json({ ok: false, reason: "nothing_to_update" }, 400);
  await db.prepare(`UPDATE orders SET ${sets.join(", ")} WHERE id = ?`).bind(...binds, orderId).run();
  await logEvent(db, orderId, changed.status ? "status_changed" : "updated", changed);
  const updated = await db.prepare("SELECT * FROM orders WHERE id = ?").bind(orderId).first();
  if (changed.status) {
    await fireStatusHooks(db, env, updated, changed.status.to);
  }
  return json({ ok: true, order: shapeOrder(updated) });
}
__name(onRequestPatch, "onRequestPatch");

// api/partners/[id].ts
async function onRequestPatch2(context) {
  const { request, env, params } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert("orders_db_not_configured");
  let b;
  try {
    b = await request.json();
  } catch {
    return json({ ok: false, reason: "bad_json" }, 400);
  }
  const sets = [];
  const binds = [];
  const text = /* @__PURE__ */ __name((field, max) => {
    if (b[field] === void 0) return;
    sets.push(`${field} = ?`);
    binds.push(b[field] === null ? null : String(b[field]).slice(0, max));
  }, "text");
  text("name", 100);
  text("company", 100);
  text("nif", 20);
  text("phone", 20);
  text("email", 100);
  if (b.rc_expiry !== void 0) {
    if (b.rc_expiry !== null && !/^\d{4}-\d{2}-\d{2}$/.test(String(b.rc_expiry))) {
      return json({ ok: false, reason: "bad_rc_expiry" }, 400);
    }
    sets.push("rc_expiry = ?");
    binds.push(b.rc_expiry);
  }
  for (const field of ["zones", "skills"]) {
    if (b[field] !== void 0) {
      if (!Array.isArray(b[field])) return json({ ok: false, reason: `bad_${field}` }, 400);
      sets.push(`${field} = ?`);
      binds.push(JSON.stringify(b[field].slice(0, 30)));
    }
  }
  if (b.payout_pct !== void 0) {
    const v = Number(b.payout_pct);
    if (!Number.isFinite(v) || v < 0 || v > 100) return json({ ok: false, reason: "bad_payout_pct" }, 400);
    sets.push("payout_pct = ?");
    binds.push(v);
  }
  if (b.active !== void 0) {
    sets.push("active = ?");
    binds.push(b.active ? 1 : 0);
  }
  if (!sets.length) return json({ ok: false, reason: "nothing_to_update" }, 400);
  const res = await env.ORDERS_DB.prepare(`UPDATE partners SET ${sets.join(", ")} WHERE id = ?`).bind(...binds, params.id).run();
  if (!res.meta?.changes) return json({ ok: false, reason: "not_found" }, 404);
  const row = await env.ORDERS_DB.prepare("SELECT * FROM partners WHERE id = ?").bind(params.id).first();
  return json({ ok: true, partner: {
    ...row,
    zones: JSON.parse(row.zones || "[]"),
    skills: JSON.parse(row.skills || "[]")
  } });
}
__name(onRequestPatch2, "onRequestPatch");

// api/photo/[[key]].ts
var KEY_RE = /^orders\/[0-9A-Z]+\/(intake|before|after)\/[a-f0-9]{32}\.(jpg|png|webp|heic|heif)$/;
async function onRequestGet3(context) {
  const { env, params } = context;
  if (!env.PHOTOS) return inert("photos_bucket_not_configured");
  const key = Array.isArray(params.key) ? params.key.join("/") : params.key;
  if (!KEY_RE.test(key)) return notFound();
  const obj = await env.PHOTOS.get(key);
  if (!obj) return notFound();
  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
__name(onRequestGet3, "onRequestGet");

// api/capi.ts
var GRAPH_VERSION2 = "v20.0";
async function onRequestPost8(context) {
  const { request, env } = context;
  const reply = /* @__PURE__ */ __name((ok, reason) => new Response(JSON.stringify(reason ? { ok, reason } : { ok }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  }), "reply");
  if (!env.META_PIXEL_ID || !env.META_CAPI_TOKEN) return reply(false, "capi_not_configured");
  let b;
  try {
    b = await request.json();
  } catch {
    return reply(false, "bad_json");
  }
  if (!b || !b.event_name || !b.event_id) return reply(false, "missing_fields");
  const fbclid = b.fbclid ? String(b.fbclid) : "";
  let fbc = b.fbc ? String(b.fbc) : "";
  if (!fbc && fbclid) fbc = `fb.1.${Math.floor(Date.now() / 1e3)}.${fbclid}`;
  const body = {
    data: [
      {
        event_name: String(b.event_name),
        event_time: Math.floor(Date.now() / 1e3),
        event_id: String(b.event_id),
        action_source: "website",
        event_source_url: b.url ? String(b.url) : void 0,
        user_data: {
          client_ip_address: request.headers.get("CF-Connecting-IP") || void 0,
          client_user_agent: (b.ua ? String(b.ua) : "") || request.headers.get("User-Agent") || void 0,
          fbp: b.fbp ? String(b.fbp) : void 0,
          fbc: fbc || void 0
        },
        custom_data: {
          currency: "EUR",
          content_category: b.category ? String(b.category) : void 0
        }
      }
    ]
  };
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION2}/${env.META_PIXEL_ID}/events?access_token=${env.META_CAPI_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }
    );
    return reply(res.ok);
  } catch {
    return reply(false, "fetch_failed");
  }
}
__name(onRequestPost8, "onRequestPost");

// ../src/lib/unitEconomics.ts
var STRIPE_FEE_PCT = 0.015;
var RESERVE_PCT = 0.04;
var DEFAULT_PAYOUT_PCT = 70;
var KILL_CAC_EUR = 90;
var KILL_REWORK_PCT = 8;
var KILL_QUOTE_TO_BOOKED_PCT = 20;

// api/metrics.ts
var median = /* @__PURE__ */ __name((xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}, "median");
var r2 = /* @__PURE__ */ __name((n) => Math.round(n * 100) / 100, "r2");
async function eventsFor(db, ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const res = await db.prepare(
      `SELECT order_id, ts, type, data FROM order_events
         WHERE order_id IN (${chunk.map(() => "?").join(",")}) ORDER BY id ASC`
    ).bind(...chunk).all();
    out.push(...res.results || []);
  }
  return out;
}
__name(eventsFor, "eventsFor");
async function onRequestGet4(context) {
  const { request, env } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert("orders_db_not_configured");
  const db = env.ORDERS_DB;
  const url = new URL(request.url);
  const month = url.searchParams.get("month") || (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(month)) return json({ ok: false, reason: "bad_month" }, 400);
  const ordersRes = await db.prepare(`SELECT * FROM orders WHERE substr(created_at, 1, 7) = ? ORDER BY created_at ASC`).bind(month).all();
  const allOrders = ordersRes.results || [];
  const orders = allOrders.filter((o) => o.status !== "cancelled");
  const ids = orders.map((o) => o.id);
  const events = ids.length ? await eventsFor(db, ids) : [];
  const partnersRes = await db.prepare("SELECT * FROM partners").all();
  const partners = partnersRes.results || [];
  const partnerById = Object.fromEntries(partners.map((p) => [p.id, p]));
  const reachedAt = {};
  for (const e of events) {
    if (e.type !== "status_changed" || typeof e.data !== "string") continue;
    let to;
    try {
      to = JSON.parse(e.data)?.status?.to;
    } catch {
      continue;
    }
    if (!to) continue;
    const m = reachedAt[e.order_id] ||= {};
    if (!m[to]) m[to] = e.ts;
  }
  const reached = /* @__PURE__ */ __name((o, s) => reachedAt[o.id]?.[s], "reached");
  const count = /* @__PURE__ */ __name((f) => orders.filter(f).length, "count");
  const created = orders.length;
  const quotedEver = count((o) => !!reached(o, "quoted") || !!o.quote_eur);
  const bookedEver = count((o) => !!reached(o, "booked"));
  const doneEver = count((o) => !!reached(o, "done") || o.status === "done");
  const byChannel = {};
  const byService = {};
  for (const o of orders) {
    byChannel[o.channel] = (byChannel[o.channel] || 0) + 1;
    const s = o.service_slug || "(sin servicio)";
    byService[s] = (byService[s] || 0) + 1;
  }
  const quoteToBookedPct = quotedEver > 0 ? r2(bookedEver / quotedEver * 100) : null;
  const quoteHours = orders.map((o) => {
    const q = reached(o, "quoted");
    return q ? (new Date(q).getTime() - new Date(o.created_at).getTime()) / 36e5 : null;
  }).filter((x) => x !== null && x >= 0);
  const timeToQuoteMedianH = median(quoteHours) !== null ? r2(median(quoteHours)) : null;
  const paidOrders = orders.filter((o) => Number(o.paid_eur) > 0);
  const paidTotal = r2(paidOrders.reduce((s, o) => s + Number(o.paid_eur), 0));
  const avgTicket = paidOrders.length ? r2(paidTotal / paidOrders.length) : null;
  const payoutPctOf = /* @__PURE__ */ __name((o) => {
    if (!o.partner_id) return 0;
    const partner = partnerById[o.partner_id];
    return Number(o.payout_pct) || Number(partner?.payout_pct) || DEFAULT_PAYOUT_PCT;
  }, "payoutPctOf");
  const contribution = paidOrders.map((o) => {
    const paid = Number(o.paid_eur);
    const payout = r2(payoutPctOf(o) / 100 * (Number(o.quote_eur) || paid));
    return r2(paid - payout - STRIPE_FEE_PCT * paid - RESERVE_PCT * paid);
  });
  const contributionTotal = r2(contribution.reduce((s, x) => s + x, 0));
  const contributionAvg = contribution.length ? r2(contributionTotal / contribution.length) : null;
  const ACCEPTED = ["awaiting_payment", "paid", "done"];
  const partnerStats = partners.map((p) => {
    const jobs = orders.filter((o) => o.partner_id === p.id);
    const accepted = jobs.filter((o) => ACCEPTED.includes(o.status));
    const reworks = jobs.filter((o) => Number(o.rework) > 0).length;
    const gmv = r2(accepted.reduce((s, o) => s + (Number(o.quote_eur) || 0), 0));
    const payoutEur = r2(accepted.reduce(
      (s, o) => s + payoutPctOf(o) / 100 * (Number(o.quote_eur) || 0),
      0
    ));
    const ipHours = jobs.map((o) => {
      const a = reached(o, "in_progress");
      const b = reached(o, "qc");
      return a && b ? (new Date(b).getTime() - new Date(a).getTime()) / 36e5 : null;
    }).filter((x) => x !== null && x >= 0);
    return {
      id: p.id,
      name: p.name,
      payout_pct: Number(p.payout_pct) || DEFAULT_PAYOUT_PCT,
      jobs: jobs.length,
      accepted: accepted.length,
      gmv_eur: gmv,
      payout_eur: payoutEur,
      rework_count: reworks,
      rework_pct: jobs.length ? r2(reworks / jobs.length * 100) : null,
      avg_in_progress_h: ipHours.length ? r2(ipHours.reduce((s, x) => s + x, 0) / ipHours.length) : null
    };
  }).filter((p) => p.jobs > 0);
  const sourceOf = /* @__PURE__ */ __name((o) => {
    try {
      const attr = typeof o.attr === "string" ? JSON.parse(o.attr) : o.attr;
      return attr?.first?.utm_source || "(direct)";
    } catch {
      return "(direct)";
    }
  }, "sourceOf");
  const bookedBySource = {};
  const createdBySource = {};
  for (const o of orders) {
    const s = sourceOf(o);
    createdBySource[s] = (createdBySource[s] || 0) + 1;
    if (reached(o, "booked")) bookedBySource[s] = (bookedBySource[s] || 0) + 1;
  }
  const spendRow = await db.prepare("SELECT value FROM settings WHERE key = ?").bind(`ad_spend:${month}`).first();
  const spend = spendRow ? JSON.parse(spendRow.value) || {} : {};
  const spendTotal = r2(Object.values(spend).reduce((s, x) => s + (Number(x) || 0), 0));
  const cacBlended = spendTotal > 0 && bookedEver > 0 ? r2(spendTotal / bookedEver) : null;
  const cacBySource = Object.fromEntries(
    Object.entries(spend).filter(([, v]) => Number(v) > 0).map(([src, v]) => [src, bookedBySource[src] ? r2(Number(v) / bookedBySource[src]) : null])
  );
  return json({
    ok: true,
    month,
    thresholds: {
      cac_eur: KILL_CAC_EUR,
      rework_pct: KILL_REWORK_PCT,
      quote_to_booked_pct: KILL_QUOTE_TO_BOOKED_PCT
    },
    funnel: {
      created,
      quoted: quotedEver,
      booked: bookedEver,
      done: doneEver,
      quote_to_booked_pct: quoteToBookedPct,
      by_channel: byChannel,
      by_service: byService
    },
    time_to_quote_median_h: timeToQuoteMedianH,
    revenue: {
      paid_total: paidTotal,
      paid_orders: paidOrders.length,
      avg_ticket: avgTicket,
      contribution_total: contributionTotal,
      contribution_avg: contributionAvg
    },
    partners: partnerStats,
    cac: {
      spend,
      spend_total: spendTotal,
      blended: cacBlended,
      by_source: cacBySource,
      booked_by_source: bookedBySource,
      created_by_source: createdBySource
    },
    orders: allOrders.map(shapeOrder)
  });
}
__name(onRequestGet4, "onRequestGet");

// api/orders/index.ts
var RATE_LIMIT = 5;
var RATE_WINDOW_S = 3600;
var str = /* @__PURE__ */ __name((v, max) => typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null, "str");
async function onRequestPost9(context) {
  const { request, env } = context;
  if (!env.ORDERS_DB) return inert("orders_db_not_configured");
  if (!sameOrigin(request)) return json({ ok: false, reason: "cross_origin" }, 403);
  const db = env.ORDERS_DB;
  let b;
  try {
    b = await request.json();
  } catch {
    return json({ ok: false, reason: "bad_json" }, 400);
  }
  if (str(b.website, 200)) return json({ ok: true, id: null });
  const isAdmin = adminOk(request, env);
  if (!isAdmin) {
    const ip = request.headers.get("CF-Connecting-IP") || "local";
    const key = "ip:" + (await sha256hex(ip)).slice(0, 32);
    const now = Math.floor(Date.now() / 1e3);
    const row = await db.prepare("SELECT count, reset_at FROM rate_limits WHERE key = ?").bind(key).first();
    const fresh = !row || row.reset_at < now;
    const count = fresh ? 0 : row.count;
    if (count >= RATE_LIMIT) return json({ ok: false, reason: "rate_limited" }, 429);
    await db.prepare(
      `INSERT INTO rate_limits (key, count, reset_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET count = ?, reset_at = ?`
    ).bind(
      key,
      count + 1,
      fresh ? now + RATE_WINDOW_S : row.reset_at,
      count + 1,
      fresh ? now + RATE_WINDOW_S : row.reset_at
    ).run();
  }
  const phone = str(b.phone, 20);
  if (!phone || !/^[+\d][\d\s\-()]{6,19}$/.test(phone)) {
    return json({ ok: false, reason: "bad_phone" }, 400);
  }
  const serviceSlug = str(b.service_slug, 50);
  if (serviceSlug && !/^[a-z0-9-]{2,50}$/.test(serviceSlug)) {
    return json({ ok: false, reason: "bad_service" }, 400);
  }
  const lang = LANGS.includes(b.lang) ? b.lang : "es";
  const size = SIZES.includes(b.size) ? b.size : null;
  const channel = isAdmin && CHANNELS.includes(b.channel) ? b.channel : "form";
  const areaSlug = str(b.area_slug, 50);
  if (areaSlug && !/^[a-z0-9-]{2,50}$/.test(areaSlug)) {
    return json({ ok: false, reason: "bad_area" }, 400);
  }
  const refCode = str(b.ref, 10);
  const attr = b.attr && typeof b.attr === "object" ? JSON.stringify(b.attr).slice(0, 4096) : null;
  const id = ulid();
  const intakeToken = randomHex128();
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  let code = orderCode();
  for (let attempt2 = 0; attempt2 < 5; attempt2++) {
    try {
      await db.prepare(
        `INSERT INTO orders (id, code, created_at, status, channel, lang,
             service_slug, size, client_name, phone, area_slug, address,
             ref_code, attr, notes, intake_token)
           VALUES (?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        code,
        createdAt,
        channel,
        lang,
        serviceSlug,
        size,
        str(b.client_name, 100),
        phone,
        areaSlug,
        str(b.address, 300),
        refCode && /^RL-[A-HJ-NP-Z2-9]{4}$/.test(refCode) ? refCode : null,
        attr,
        str(b.notes, 1e3),
        intakeToken
      ).run();
      break;
    } catch (e) {
      if (attempt2 === 4) return json({ ok: false, reason: "code_collision" }, 500);
      code = orderCode();
    }
  }
  await logEvent(db, id, "created", { channel, service: serviceSlug, via: isAdmin ? "admin" : "public" });
  if (!isAdmin) {
    context.waitUntil(notifyOwner(
      env,
      `Nuevo pedido ${code}`,
      [serviceSlug, size, areaSlug, phone].filter(Boolean).join(" \xB7 ") + " \u2014 responder en menos de 1h"
    ));
  }
  return json({ ok: true, id, code, intake_token: intakeToken });
}
__name(onRequestPost9, "onRequestPost");
async function onRequestGet5(context) {
  const { request, env } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert("orders_db_not_configured");
  const url = new URL(request.url);
  const conds = [];
  const binds = [];
  const status = url.searchParams.get("status");
  if (status) {
    if (!STATUSES.includes(status)) return json({ ok: false, reason: "bad_status" }, 400);
    conds.push("status = ?");
    binds.push(status);
  }
  const channel = url.searchParams.get("channel");
  if (channel) {
    if (!CHANNELS.includes(channel)) return json({ ok: false, reason: "bad_channel" }, 400);
    conds.push("channel = ?");
    binds.push(channel);
  }
  const partnerId = url.searchParams.get("partner_id");
  if (partnerId) {
    conds.push("partner_id = ?");
    binds.push(partnerId.slice(0, 40));
  }
  const month = url.searchParams.get("month");
  if (month) {
    if (!/^\d{4}-\d{2}$/.test(month)) return json({ ok: false, reason: "bad_month" }, 400);
    conds.push("substr(created_at, 1, 7) = ?");
    binds.push(month);
  }
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "100", 10) || 100, 1), 200);
  const where = conds.length ? ` WHERE ${conds.join(" AND ")}` : "";
  const res = await env.ORDERS_DB.prepare(
    `SELECT orders.*, COALESCE((
         SELECT MAX(ts) FROM order_events
         WHERE order_id = orders.id AND type = 'status_changed'
       ), orders.created_at) AS status_ts
       FROM orders${where} ORDER BY created_at DESC LIMIT ${limit}`
  ).bind(...binds).all();
  return json({ ok: true, orders: (res.results || []).map(shapeOrder) });
}
__name(onRequestGet5, "onRequestGet");

// api/partners/index.ts
var parseJsonCols = /* @__PURE__ */ __name((row) => ({
  ...row,
  zones: typeof row.zones === "string" ? JSON.parse(row.zones) : row.zones,
  skills: typeof row.skills === "string" ? JSON.parse(row.skills) : row.skills
}), "parseJsonCols");
async function onRequestGet6(context) {
  const { request, env } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert("orders_db_not_configured");
  const res = await env.ORDERS_DB.prepare("SELECT * FROM partners ORDER BY active DESC, name ASC").all();
  return json({ ok: true, partners: (res.results || []).map(parseJsonCols) });
}
__name(onRequestGet6, "onRequestGet");
async function onRequestPost10(context) {
  const { request, env } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert("orders_db_not_configured");
  let b;
  try {
    b = await request.json();
  } catch {
    return json({ ok: false, reason: "bad_json" }, 400);
  }
  const name = typeof b.name === "string" && b.name.trim() ? b.name.trim().slice(0, 100) : null;
  if (!name) return json({ ok: false, reason: "bad_name" }, 400);
  const id = ulid();
  const payout = Number.isFinite(Number(b.payout_pct)) ? Number(b.payout_pct) : 70;
  await env.ORDERS_DB.prepare(
    `INSERT INTO partners (id, name, company, nif, phone, email, zones, skills, payout_pct, active, rc_expiry, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
  ).bind(
    id,
    name,
    typeof b.company === "string" ? b.company.slice(0, 100) : null,
    typeof b.nif === "string" ? b.nif.slice(0, 20) : null,
    typeof b.phone === "string" ? b.phone.slice(0, 20) : null,
    typeof b.email === "string" ? b.email.slice(0, 100) : null,
    JSON.stringify(Array.isArray(b.zones) ? b.zones.slice(0, 30) : []),
    JSON.stringify(Array.isArray(b.skills) ? b.skills.slice(0, 30) : []),
    payout,
    typeof b.rc_expiry === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.rc_expiry) ? b.rc_expiry : null,
    (/* @__PURE__ */ new Date()).toISOString()
  ).run();
  return json({ ok: true, id });
}
__name(onRequestPost10, "onRequestPost");

// api/ref.ts
var REF_PATTERN = /^RL-[A-HJ-NP-Z2-9]{4}$/;
var TTL_180_DAYS = 180 * 24 * 60 * 60;
var json2 = /* @__PURE__ */ __name((body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json" }
}), "json");
async function onRequestPost11(context) {
  const { request, env } = context;
  if (!env.REF_LOG) return json2({ ok: false, reason: "ref_log_not_configured" });
  let b;
  try {
    b = await request.json();
  } catch {
    return json2({ ok: false, reason: "bad_json" });
  }
  const ref = typeof b?.ref === "string" ? b.ref : "";
  if (!REF_PATTERN.test(ref)) return json2({ ok: false, reason: "bad_ref" });
  const ts = typeof b.ts === "string" && !Number.isNaN(Date.parse(b.ts)) ? b.ts : (/* @__PURE__ */ new Date()).toISOString();
  const entry = {
    ref,
    ts,
    event: typeof b.event === "string" ? b.event.slice(0, 64) : "",
    page: typeof b.page === "string" ? b.page.slice(0, 256) : "",
    attr: b.attr && typeof b.attr === "object" ? b.attr : {}
  };
  const value = JSON.stringify(entry).slice(0, 8192);
  try {
    await env.REF_LOG.put(`ref:${ref}:${ts}`, value, { expirationTtl: TTL_180_DAYS });
    return json2({ ok: true });
  } catch {
    return json2({ ok: false, reason: "kv_put_failed" });
  }
}
__name(onRequestPost11, "onRequestPost");
async function onRequestGet7(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code") || "";
  const token = url.searchParams.get("token") || "";
  if (!env.REF_ADMIN_TOKEN || token !== env.REF_ADMIN_TOKEN) {
    return new Response("Not found", { status: 404 });
  }
  if (!env.REF_LOG) return json2({ ok: false, reason: "ref_log_not_configured" });
  if (!REF_PATTERN.test(code)) return json2({ ok: false, reason: "bad_code" });
  try {
    const { keys } = await env.REF_LOG.list({ prefix: `ref:${code}:`, limit: 100 });
    const entries = (await Promise.all(keys.map((k) => env.REF_LOG.get(k.name)))).filter((v) => v !== null).map((v) => {
      try {
        return JSON.parse(v);
      } catch {
        return { raw: v };
      }
    });
    return json2({ ok: true, code, count: entries.length, entries });
  } catch {
    return json2({ ok: false, reason: "kv_list_failed" });
  }
}
__name(onRequestGet7, "onRequestGet");

// api/settings.ts
var KEY_RE2 = /^[a-z0-9_:-]{2,60}$/;
async function onRequestGet8(context) {
  const { request, env } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert("orders_db_not_configured");
  const key = new URL(request.url).searchParams.get("key") || "";
  if (!KEY_RE2.test(key)) return json({ ok: false, reason: "bad_key" }, 400);
  const row = await env.ORDERS_DB.prepare("SELECT value FROM settings WHERE key = ?").bind(key).first();
  return json({ ok: true, key, value: row ? JSON.parse(row.value) : null });
}
__name(onRequestGet8, "onRequestGet");
async function onRequestPut(context) {
  const { request, env } = context;
  if (!adminOk(request, env)) return notFound();
  if (!env.ORDERS_DB) return inert("orders_db_not_configured");
  let b;
  try {
    b = await request.json();
  } catch {
    return json({ ok: false, reason: "bad_json" }, 400);
  }
  const key = typeof b.key === "string" ? b.key : "";
  if (!KEY_RE2.test(key)) return json({ ok: false, reason: "bad_key" }, 400);
  const value = JSON.stringify(b.value ?? null).slice(0, 8192);
  await env.ORDERS_DB.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?").bind(key, value, value).run();
  return json({ ok: true, key });
}
__name(onRequestPut, "onRequestPut");

// index.ts
var VALID_LANGS = /* @__PURE__ */ new Set(["en", "es", "ca"]);
var ES_COUNTRIES = /* @__PURE__ */ new Set([
  "ES",
  "MX",
  "AR",
  "CO",
  "CL",
  "PE",
  "VE",
  "EC",
  "BO",
  "PY",
  "UY",
  "CR",
  "PA",
  "GT",
  "HN",
  "SV",
  "NI",
  "DO",
  "CU",
  "PR"
]);
function parseAcceptLanguage(header) {
  return header.split(",").map((part) => {
    const [lang, q] = part.trim().split(";q=");
    return { lang: lang.trim().toLowerCase(), q: q ? parseFloat(q) : 1 };
  }).sort((a, b) => b.q - a.q).map((item) => item.lang);
}
__name(parseAcceptLanguage, "parseAcceptLanguage");
function detectLang(request) {
  const country = (request.headers.get("CF-IPCountry") ?? "XX").toUpperCase();
  const acceptLang = request.headers.get("Accept-Language") ?? "";
  if (acceptLang) {
    const preferred = parseAcceptLanguage(acceptLang);
    for (const lang of preferred) {
      if (lang === "ca" || lang.startsWith("ca-")) return "ca";
      if (lang === "en" || lang.startsWith("en-")) return "en";
      if (lang === "es" || lang.startsWith("es-")) return "es";
    }
  }
  if (ES_COUNTRIES.has(country)) return "es";
  return "en";
}
__name(detectLang, "detectLang");
function getCookie(cookieHeader, name) {
  const match2 = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]+)`)
  );
  return match2 ? decodeURIComponent(match2[1]) : null;
}
__name(getCookie, "getCookie");
async function onRequestGet9({
  request
}) {
  const url = new URL(request.url);
  const cookieHeader = request.headers.get("cookie") ?? "";
  const preferred = getCookie(cookieHeader, "preferred_lang");
  if (preferred && VALID_LANGS.has(preferred)) {
    return Response.redirect(`${url.origin}/${preferred}`, 302);
  }
  const lang = detectLang(request);
  return Response.redirect(`${url.origin}/${lang}`, 302);
}
__name(onRequestGet9, "onRequestGet");

// ../.wrangler/tmp/pages-Q3UsiQ/functionsRoutes-0.19464815756876397.mjs
var routes = [
  {
    routePath: "/api/orders/:id/job-token",
    mountPath: "/api/orders/:id",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/orders/:id/photos",
    mountPath: "/api/orders/:id",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/admin/migrate",
    mountPath: "/api/admin",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/stripe/create-link",
    mountPath: "/api/stripe",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/stripe/webhook",
    mountPath: "/api/stripe",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/wa/send",
    mountPath: "/api/wa",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/api/job/:token",
    mountPath: "/api/job",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/job/:token",
    mountPath: "/api/job",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost7]
  },
  {
    routePath: "/api/orders/:id",
    mountPath: "/api/orders",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete]
  },
  {
    routePath: "/api/orders/:id",
    mountPath: "/api/orders",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/orders/:id",
    mountPath: "/api/orders",
    method: "PATCH",
    middlewares: [],
    modules: [onRequestPatch]
  },
  {
    routePath: "/api/partners/:id",
    mountPath: "/api/partners",
    method: "PATCH",
    middlewares: [],
    modules: [onRequestPatch2]
  },
  {
    routePath: "/api/photo/:key*",
    mountPath: "/api/photo",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/capi",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost8]
  },
  {
    routePath: "/api/metrics",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/orders",
    mountPath: "/api/orders",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/orders",
    mountPath: "/api/orders",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost9]
  },
  {
    routePath: "/api/partners",
    mountPath: "/api/partners",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/api/partners",
    mountPath: "/api/partners",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost10]
  },
  {
    routePath: "/api/ref",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  },
  {
    routePath: "/api/ref",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost11]
  },
  {
    routePath: "/api/settings",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet8]
  },
  {
    routePath: "/api/settings",
    mountPath: "/api",
    method: "PUT",
    middlewares: [],
    modules: [onRequestPut]
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet9]
  }
];

// ../../../../.npm/_npx/32026684e21afda6/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str2) {
  var tokens = [];
  var i = 0;
  while (i < str2.length) {
    var char = str2[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str2[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str2[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str2[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str2[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str2.length) {
        var code = str2.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str2[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str2[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str2.length) {
        if (str2[j] === "\\") {
          pattern += str2[j++] + str2[j++];
          continue;
        }
        if (str2[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str2[j] === "(") {
          count++;
          if (str2[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str2[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str2[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str2, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str2);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str2, options) {
  var keys = [];
  var re = pathToRegexp(str2, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str2) {
  return str2.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-xU6Rdv/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-xU6Rdv/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.575411841463661.mjs.map
