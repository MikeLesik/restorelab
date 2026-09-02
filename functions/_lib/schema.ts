/**
 * Orders OS schema as executable statements — mirror of migrations/0001_init.sql
 * (the canonical file; keep both in sync). Used by /api/admin/migrate so the
 * schema can be applied from the deployed site without local wrangler:
 * bind ORDERS_DB in the dashboard, then POST /api/admin/migrate with the
 * admin token once. All statements are idempotent.
 */

export const SCHEMA_STATEMENTS: string[] = [
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
  )`,
];
