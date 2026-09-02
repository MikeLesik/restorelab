-- Partner program hardening (Order Flow v2 blueprint, NOW items).
-- ALTERs are NOT idempotent in SQLite; /api/admin/migrate runs these
-- tolerating "duplicate column" errors. functions/_lib/schema.ts mirrors
-- them in SCHEMA_ALTERS (and the 0001 CREATEs carry the columns for fresh
-- installs) — keep all three in sync.

-- Snapshot of the partner's payout % taken at assignment: renegotiating a
-- partner's rate must never rewrite already-issued statements.
ALTER TABLE orders ADD COLUMN payout_pct REAL;

-- Partner's explicit acceptance of the job (offer-accept mechanic; also the
-- falso-autonomo "right to decline" evidence trail).
ALTER TABLE orders ADD COLUMN accepted_at TEXT;

-- Partner's RC insurance expiry — an expired policy blocks assignment.
ALTER TABLE partners ADD COLUMN rc_expiry TEXT;
