# Cloudflare Bindings Setup — Orders OS (RL-410)

Everything is inert until configured: the site deploys and runs fine with
zero bindings; each API endpoint returns `{ ok: false, reason: …_not_configured }`
until its binding exists. Configure in this order.

## 1. D1 database (orders pipeline)

```bash
npx wrangler d1 create restorelab-orders
```

Then in the Cloudflare dashboard: **Workers & Pages → restorelab (Pages) →
Settings → Functions → D1 database bindings → Add**:
variable name **`ORDERS_DB`** (exact), database `restorelab-orders`.
Add for **Production** (and Preview if desired).

## 2. R2 bucket (order photos)

Dashboard → **R2 → Create bucket** → name **`restorelab-photos`**
(location: automatic; no public access — photos are served only through
`/api/photo/<key>`).

Then Pages → Settings → Functions → **R2 bucket bindings → Add**:
variable name **`PHOTOS`**, bucket `restorelab-photos`.

## 3. Admin token

Pages → Settings → **Environment variables** → add **`ADMIN_TOKEN`**
(Production) = long random secret:

```bash
openssl rand -hex 32
```

This guards the orders list/detail/PATCH API and `/api/admin/migrate`.
A wrong or missing token returns 404 (endpoints stay invisible).

## 4. Apply the schema (pick ONE path)

**Path A — from the deployed site (no local tools):** after the bindings
above are live (redeploy once so they attach), run:

```bash
curl -X POST https://restorelab.io/api/admin/migrate \
  -H "x-admin-token: $ADMIN_TOKEN"
```

Idempotent — safe to re-run. Statements live in `functions/_lib/schema.ts`
(mirror of `migrations/0001_init.sql`).

**Path B — via wrangler:**

```bash
npx wrangler d1 execute restorelab-orders --remote --file=migrations/0001_init.sql
```

## 5. Local development

```bash
npm run build
npx wrangler pages dev dist --d1 ORDERS_DB --r2 PHOTOS \
  --binding ADMIN_TOKEN=devtoken --port 8788
```

`--d1`/`--r2` create local (miniflare) instances. Apply the schema to the
local D1 the same way: `curl -X POST http://localhost:8788/api/admin/migrate
-H "x-admin-token: devtoken"`.

## 6. Smoke test (works locally and in production)

```bash
BASE=http://localhost:8788 TOKEN=devtoken

# create an order (public intake path)
curl -s -X POST $BASE/api/orders -H 'Content-Type: application/json' \
  -d '{"phone":"+34600000000","service_slug":"headlight-restoration","lang":"es","client_name":"Test","website":""}'
# → { ok, id, code (RL-O-XXXX), intake_token }

# upload an intake photo (raw bytes; ≤6MB; jpeg/png/webp/heic)
curl -s -X POST "$BASE/api/orders/<ID>/photos?kind=intake&token=<INTAKE_TOKEN>" \
  -H 'Content-Type: image/png' --data-binary @photo.png

# admin: list / detail / transition
curl -s "$BASE/api/orders?status=new" -H "x-admin-token: $TOKEN"
curl -s "$BASE/api/orders/<ID>" -H "x-admin-token: $TOKEN"
curl -s -X PATCH "$BASE/api/orders/<ID>" -H "x-admin-token: $TOKEN" \
  -H 'Content-Type: application/json' -d '{"status":"quoted","quote_eur":349}'

# illegal jump is rejected (409 illegal_transition):
curl -s -X PATCH "$BASE/api/orders/<ID>" -H "x-admin-token: $TOKEN" \
  -H 'Content-Type: application/json' -d '{"status":"paid"}'

# fetch the photo back
curl -s -o out.png "$BASE/api/photo/<KEY>"
```

## State machine (enforced by PATCH)

```
new → quoted → booked → assigned → in_progress → qc → awaiting_payment → paid → done
        │         │         │           │          └→ in_progress (rework, counter++)
        └─────────┴─────────┴───────────┴→ cancelled   (booked → in_progress is
                                                        legal too: Mike does the
                                                        job himself, no partner)
awaiting_payment → cancelled
```

## Optional hardening

For `/admin` (RL-420) put Cloudflare Access in front of the path in addition
to the token: Zero Trust → Access → Applications → self-hosted →
`restorelab.io/admin*` (+ `/api/orders*`, `/api/admin/*`) with a one-person
email policy. Free tier covers this.
