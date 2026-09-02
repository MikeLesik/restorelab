-- restoreLab Orders OS — initial schema (RL-410).
-- Canonical schema. functions/_lib/schema.ts carries the same statements as a
-- TS string for the /api/admin/migrate convenience endpoint — keep in sync.
-- All statements are idempotent (IF NOT EXISTS) so re-running is safe.

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,                -- ULID
  code TEXT UNIQUE NOT NULL,          -- short human code RL-O-XXXX (unambiguous alphabet)
  created_at TEXT NOT NULL,           -- ISO timestamp
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
  photos TEXT NOT NULL DEFAULT '[]',  -- JSON array of R2 keys (kind encoded in the key path)
  quote_eur REAL,
  quote_breakdown TEXT,               -- JSON
  partner_id TEXT,
  payout_pct REAL,                    -- snapshot of the partner's % at assignment (0002)
  accepted_at TEXT,                   -- partner's job acceptance timestamp (0002)
  scheduled_at TEXT,
  ref_code TEXT,                      -- RL-XXXX visitor ref (RL-301)
  attr TEXT,                          -- JSON attribution snapshot
  payment_link TEXT,
  paid_eur REAL,
  paid_at TEXT,
  qc_status TEXT,
  rework INTEGER NOT NULL DEFAULT 0,
  review_sent_at TEXT,
  notes TEXT,
  intake_token TEXT,                  -- authorizes intake photo uploads right after creation
  job_token_hash TEXT                 -- partner job-card token, sha256 (RL-430)
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY,                -- ULID
  name TEXT NOT NULL,
  company TEXT,
  nif TEXT,
  phone TEXT,
  email TEXT,
  zones TEXT NOT NULL DEFAULT '[]',   -- JSON array of area slugs
  skills TEXT NOT NULL DEFAULT '[]',  -- JSON array of service slugs
  payout_pct REAL NOT NULL DEFAULT 70,
  active INTEGER NOT NULL DEFAULT 1,
  rc_expiry TEXT,                     -- RC insurance policy expiry (0002)
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  ts TEXT NOT NULL,
  type TEXT NOT NULL,
  data TEXT                           -- JSON
);

CREATE INDEX IF NOT EXISTS idx_events_order ON order_events(order_id);

-- Per-IP intake rate limiting (in-D1 counter; no raw IPs stored, only hashes).
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);

-- Admin settings (RL-460): monthly ad-spend inputs etc. Key-value JSON.
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
