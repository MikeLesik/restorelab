-- How the client intends to pay (Order Flow v2 feedback): 'online' (card/
-- Bizum link) or 'cash' (in person at the end). Guides the Pagos UI so the
-- cash case is explicit instead of both rails showing at once.
-- ALTER is not idempotent in SQLite; /api/admin/migrate tolerates the
-- "duplicate column" error. Mirror in functions/_lib/schema.ts.
ALTER TABLE orders ADD COLUMN payment_pref TEXT;
