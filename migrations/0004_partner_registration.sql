-- Partner self-registration (magic-link cabinet). Mike generates an invite
-- link (/socio/<token>); the partner fills the form and uploads docs; the
-- record sits in 'pending' until Mike activates it. Same token is the
-- persistent cabinet. ALTERs are not idempotent — /api/admin/migrate
-- tolerates "duplicate column"; mirror in functions/_lib/schema.ts.
ALTER TABLE partners ADD COLUMN token_hash TEXT;     -- sha256 of the magic-link token
ALTER TABLE partners ADD COLUMN status TEXT;         -- invited | pending | active | paused
ALTER TABLE partners ADD COLUMN registered_at TEXT;  -- when the form was submitted
ALTER TABLE partners ADD COLUMN docs TEXT;           -- JSON [{kind,key,name}] R2 uploads
ALTER TABLE partners ADD COLUMN profile TEXT;        -- JSON: availability, portfolio_url, alta_autonomo, years, products, agreement_accepted_at
