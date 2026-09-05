-- Order geolocation + structured address details (RL-461).
-- lat/lng captured from the CartoCiudad autocomplete (exact pin for the partner);
-- addr_extra is a small JSON bag { type, floor, door, cp, info } so the geocoded
-- street line stays clean while the partner still gets house/flat/floor/notes.
-- Mirrored in functions/_lib/schema.ts; /api/admin/migrate tolerates duplicates.
ALTER TABLE orders ADD COLUMN lat REAL;
ALTER TABLE orders ADD COLUMN lng REAL;
ALTER TABLE orders ADD COLUMN addr_extra TEXT;
