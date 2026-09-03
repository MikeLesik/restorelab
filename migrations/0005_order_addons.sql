-- On-site upsell add-ons the partner sells (RL-432): a JSON array of
-- {slug, name, price_eur}. They add to what the client pays and pay the
-- partner at the higher ADDON_PARTNER_PCT (80%). ALTER tolerates duplicate
-- column via /api/admin/migrate; mirror in functions/_lib/schema.ts.
ALTER TABLE orders ADD COLUMN addons TEXT;
