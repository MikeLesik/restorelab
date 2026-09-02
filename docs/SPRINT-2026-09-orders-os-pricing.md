# restoreLab — PHASE 4: Orders OS (automation pipeline) + Transparent Pricing

> **How to run:** open Claude Code in the repo root and say:
> `Read docs/SPRINT-2026-09-orders-os-pricing.md and CLAUDE.md. Execute RL-401, verify, commit, stop and show me the result.`
> Then continue task by task in the order below. One commit per task: `RL-4XX: <summary>`.
> **Two tasks contain an APPROVAL CHECKPOINT (RL-401, RL-402) — stop and ask Mike before publishing price numbers.**

## What we are building (the whole conveyor)

```
client → site/ads → intake (photos) ─┐
client → WhatsApp (as today) ────────┴→ ORDER in pipeline (D1)
   → quote composed in admin from the SAME pricing data → sent via WhatsApp
   → booked → assigned to partner → partner opens tokenized job card (no login)
   → partner uploads before/after photos → Mike approves QC in admin
   → Stripe payment link (card + Bizum) → webhook marks paid
   → review request → dashboard shows revenue, CAC (ref-codes), partner quality
```

Product philosophy: **the conveyor is the product, not an app.** Everything lives in
this repo on Cloudflare (Pages Functions + D1 + R2) — versioned, ~€0/month at
current volume, no Make/HubSpot subscription. Every automated step MUST have a
manual fallback button (copy-to-clipboard → send yourself), so a missing binding
or a Meta outage never blocks an order. Follow the `capi.ts` philosophy already in
this repo: **every integration is inert until its env/binding is configured, and
safe to deploy first.**

## Hard constraints (in addition to CLAUDE.md and PHASE 3 rules)

1. WhatsApp-first funnel is sacred: the personal number +34 680 265 190 and all
   existing wa.me flows stay untouched. The intake form is a SECOND path, never a
   replacement. **NEVER migrate the main number to WhatsApp Cloud API** (that
   disconnects the phone app — see RL-450).
2. All user-facing strings ×3 langs (`en/es/ca.json`). Admin/partner pages may be
   ES-only (note this in CLAUDE.md).
3. Prices exist in exactly ONE place (pricing JSON) — pages, Estimator, quote
   composer, B2B tarifa, payment amounts all read from it (RL-401 enforces).
4. Admin & partner routes: `noindex`, excluded from sitemap, no internal links
   from public pages.
5. No new npm runtime deps without necessity. Stripe via raw REST `fetch` from
   Functions (no SDK needed for links/webhook verify). ULIDs: tiny inline impl.
6. `npm run build` green after every task. Astro remains `output: 'static'` —
   admin/partner pages are static shells + client JS calling `/api/*`.
7. Secrets only in Cloudflare Pages dashboard; `.env.example` documents each new
   var/binding in the style already used for REF_LOG / REF_ADMIN_TOKEN.

## Execution order & ship gates

| Order | Task | Gate |
|---|---|---|
| 1 | RL-401 pricing source of truth | now |
| 2 | RL-402 transparent pricing UI | after Mike approves numbers |
| 3 | RL-410 D1/R2 + orders API | now |
| 4 | RL-411 public intake form | now |
| 5 | RL-420 admin pipeline + quote composer | now — this alone replaces a CRM |
| 6 | RL-440 Stripe payments | now — Stripe account with Bizum is ALREADY active |
| 7 | RL-430 partner job cards | when the FIRST partner is signed |
| 8 | RL-460 metrics dashboard | after RL-440 |
| 9 | RL-450 WhatsApp Cloud automation | only at ≥30 orders/mo or active partner |

---

## ☐ RL-401 — Pricing: single source of truth + guardrails

**Current state:** `pricing.categories[]` packages carry display strings
(`"349€"`, `"79€ / par"`, `"desde 89€"`, `"Presupuesto personalizado"`);
`pricing.ui` already has `size_categories`, `sensitive_paint_surcharge`,
`min_visit`. Estimator joins by slug and throws on a missing slug (keep that).
`areaProfiles.ts` carries per-area `travelFee`.

**Build:**

1. Add structured fields to every package in ALL THREE JSONs (keep display
   strings for backward compat until RL-402 rewires):
   - `price_eur: number | null` (null = quote-only, e.g. acrylic-restoration)
   - `price_unit: 'job' | 'pair'`
   - `from: boolean`
   - `size_pricing?: { compact: number; sedan: number; suv: number; van: number }`
     for size-dependent packages (car category + full-glass-set + pre-sale/express).
     Numbers must be **identical across langs** (only text localized).
2. **Proposed size matrix — APPROVAL CHECKPOINT.** Derive per-size numbers from
   the current base prices using multipliers `compact ×0.9 / sedan ×1.0 /
   SUV ×1.15 / van ×1.3` (rounded to nearest €10, psychological endings allowed),
   write the full proposed matrix into `docs/pricing-strategy.md` (see below),
   **stop and show Mike the table for approval before writing it into the JSONs.**
3. `docs/pricing-strategy.md` (new) — the pricing rationale doc:
   - Competitor table (Barcelona, researched Sep 2026 — embed as-is):
     Detailing Barcelona: 1-stage €200–330 (compact) / €280–460 (van); 2-stage
     €360–590 / €440–720 / €520–850; 3-stage €560–1,300. WYZ (mobile): full
     detail €140–220; pulido €250–530; ceramic 3y €380–710. Kramex: 1-stage
     desde €150. DetailingBCN: pulido €450–700; ceramic €450–900; interior
     €190–300. White Garage (Madrid ref): 1-stage €399, 2-stage desde €499,
     headlights €80–120. Midas: faros €75/par. Cronoshare aggregates: full clean
     €85–500 (typ. €150–200), polish €40–180, faros €15–35/faro.
   - Positioning rules: restoreLab sits in the **upper third** of the mobile
     market, justified by named certifications (Gyeon/Gtechniq), €500k
     insurance, written rework guarantee, fixed photo-quote; **never above the
     published max for the size after the photo quote** — that promise is the
     core of "transparent"; IVA always included in B2C display; B2B tarifa shows
     neto + IVA line.
   - Current repo prices vs live-site prices differ (repo: single-stage €349,
     two-stage €599, ceramic-2y €849; live site showed €289/€549/€649) — record
     which is intended, flag for Mike's confirmation in the same checkpoint.
4. `scripts/check-pricing.mjs` + wire as `prebuild` step:
   - every `estimator.tiers` slug resolves to a package in all 3 langs;
   - slugs and all numeric fields identical across langs;
   - no hardcoded euro amounts (`/€\s?\d|\d\s?€/`) in `src/**/*.{astro,ts}`
     outside an allowlist (`areaProfiles.ts` travelFee, this script);
   - `size_pricing` keys exactly match `pricing.ui.size_categories` ids.
   Build fails with a readable message on violation.

**Acceptance:** script passes; matrix proposed and approved; JSONs carry numeric
fields; build green.

## ☐ RL-402 — Transparent pricing UI (public)

1. **Pricing page:** size selector (reuse `pricing.ui.size_categories`) that
   switches every card's price to the exact per-size number — no more bare
   "desde" where a real matrix exists. Under the cards: a full printable matrix
   table (all packages × sizes). Keep the Estimator below as today.
2. **Transparency block** (new component, used on pricing + service pages):
   - "Precio cerrado por fotos en ≤1h — nunca por encima del máximo publicado"
   - IVA incluido; `min_visit` (existing key); `sensitive_paint_surcharge`
     disclosed; travel-fee table by area pulled from `areaProfiles.travelFee`
     (0 → "incluido").
3. Surface existing `vs_price` anchors on service pages near the price
   (e.g. faros €79/par **vs cambio €200–600**; parabrisas €119 **vs luna nueva
   €300–900**) — strings via JSON ×3 langs.
4. Estimator result shows the per-size exact price once size is answered (it
   already collects size — join `size_pricing` by slug; keep the throw-on-missing
   contract).
5. B2B `#tarifa` section (from RL-303) reads the same structured data.

**Acceptance:** pricing page shows per-size exact prices + matrix + transparency
block ×3 langs; no display string drifts from `price_eur`/`size_pricing`
(spot-check via the RL-401 script); build green.

## ☐ RL-410 — Orders data layer (D1 + R2 + API)

1. `migrations/0001_init.sql` (+ `docs/setup-cloudflare-bindings.md` with
   `wrangler d1 create restorelab-orders`, Pages bindings `ORDERS_DB` (D1) and
   `PHOTOS` (R2 bucket `restorelab-photos`), and how to run migrations):
   - `orders`: `id` TEXT PK (ULID), `created_at`, `status` TEXT
     CHECK in (`new`,`quoted`,`booked`,`assigned`,`in_progress`,`qc`,
     `awaiting_payment`,`paid`,`done`,`cancelled`), `channel`
     (`form`/`whatsapp`/`phone`/`b2b`), `lang`, `service_slug`, `size`,
     `client_name`, `phone`, `area_slug`, `address`, `photos` (JSON array of R2
     keys), `quote_eur` REAL, `quote_breakdown` (JSON), `partner_id`,
     `scheduled_at`, `ref_code`, `attr` (JSON), `payment_link`,
     `paid_eur`, `paid_at`, `qc_status`, `rework` INTEGER DEFAULT 0,
     `review_sent_at`, `notes`.
   - `partners`: `id`, `name`, `company`, `nif`, `phone`, `email`,
     `zones` (JSON), `skills` (JSON of service slugs), `payout_pct` REAL,
     `active` INTEGER, `created_at`.
   - `order_events`: `order_id`, `ts`, `type`, `data` (JSON) — append-only audit
     of every transition/action.
2. `functions/api/orders/` endpoints:
   - `POST /api/orders` — public intake (used by RL-411): validates, honeypot
     field, per-IP rate limit (KV or in-D1 counter), stores attr/ref from the
     RL-301 payload the client sends, status `new`. Returns short order code
     `RL-O-XXXX` (unambiguous alphabet, stored as `id` alias column or derived).
   - `GET /api/orders?status=…`, `GET /api/orders/:id`, `PATCH /api/orders/:id`
     (status transitions validated against the state machine; every PATCH writes
     an `order_events` row) — all guarded by header `x-admin-token` ===
     `ADMIN_TOKEN` env (same pattern as `REF_ADMIN_TOKEN`; wrong → 404).
   - `POST /api/orders/:id/photos?kind=intake|before|after` — accepts
     jpeg/png/webp/heic ≤ 6 MB, stores to R2 under
     `orders/<id>/<kind>/<random128>.<ext>`, appends key to order; `GET
     /api/photo/<key>` streams from R2 (keys are unguessable; no listing).
     Partner-kind uploads authorized by job token (RL-430), intake by order
     creation flow, admin by token.
   - All endpoints inert-with-warning JSON when bindings are missing
     (capi.ts pattern). CORS: same-origin only.
3. Extend `RestoreLabEvent` union: `{ event: 'order_created'; channel; service? }`.

**Acceptance:** local `wrangler pages dev` roundtrip: create order → upload photo
→ fetch → patch status; state machine rejects illegal jumps; docs file complete;
build green.

## ☐ RL-411 — Public intake form ("Envía fotos, precio en ≤1h")

1. New page `/{lang}/solicitud` ×3 langs: steps — service (from pricing JSON,
   with per-size price hint), size, area (from `areaProfiles`, shows travel fee
   live), 1–6 photos (client-side compress to ≤2MB via canvas before upload),
   name + phone, RGPD checkbox (link privacy) → `POST /api/orders` + photo
   uploads → success screen: order code, "presupuesto en ≤1h laboral (9–19h)",
   and a wa.me button whose prefilled text includes `#pedido RL-O-XXXX` (the
   RL-301 `#ref` line appends automatically — do not duplicate).
2. Placement (never displacing WhatsApp-first): secondary CTA on the three paid
   landing service pages + contact page ("¿Prefieres no usar WhatsApp ahora?
   Envía fotos y te mandamos precio cerrado"), and the ads traffic can be sent
   straight to it. Replace the dead hidden `LeadForm.astro` with this (delete the
   component if nothing else uses it — check first).
3. Analytics: `lead_submitted { channel: 'form', service }` + `order_created`.

**Acceptance:** full submit works on mobile 390px incl. HEIC photo from iPhone;
strings ×3 langs; event fires; build green.

## ☐ RL-420 — Admin: pipeline board + quote composer

1. `/admin` (ES-only, `noindex`, out of sitemap): static shell + client JS. Token
   prompt once → localStorage → `x-admin-token` on every call. Document optional
   hardening via Cloudflare Access in the bindings doc.
2. **Pipeline view:** columns/sections per status with counts; each card: code,
   service+size, area, age-in-status, quote €, partner badge, channel badge
   (form/WA/B2B), ref/attr source. Filters: status, partner, channel, month.
3. **Order detail:** photos (intake / before / after side-by-side), client data
   (tel: + wa.me quick links), attribution block (ref → source/campaign via
   `GET /api/ref` when configured), timeline from `order_events`, notes,
   status buttons (only legal transitions), partner assign (dropdown of active
   partners filtered by skill/zone), schedule datetime.
4. **Quote composer** (the "quota in minutes" piece): package + size +
   extras/addons + `sensitive_paint_surcharge` toggle + travel fee (auto from
   area) → total computed from the pricing JSON (RL-401 data; NEVER a manually
   typed price without an explicit "custom override" field that logs an event) →
   renders the quote message in the order's `lang` from new
   `wa_messages.quote_*` templates (×3 langs: greeting, per-line items, total,
   validity "7 días", link to pricing page) → buttons: **Copy** and **Open in
   WhatsApp** (wa.me/<client phone> with prefilled text — sending stays on
   Mike's personal WA in v1) → saves `quote_eur` + `quote_breakdown`, status →
   `quoted`.
5. **Manual order entry** (~30 seconds): for WhatsApp-originated leads so 100% of
   orders live in the pipeline — minimal required fields: phone, service, size?,
   area?, channel=whatsapp. This discipline is what makes RL-460 metrics true —
   say so in a small UI hint.

**Acceptance:** create manual order → quote → copy message (correct numbers vs
pricing page for every size) → book → assign; all transitions logged; token
required everywhere; build green.

## ☐ RL-440 — Payments: Stripe links + webhook (card + Bizum)

1. `functions/api/stripe/create-link.ts` (admin-guarded): raw REST call creating
   a Checkout Session (mode payment, payment_method_types `['card','bizum']`,
   currency EUR, amount from order — full, or deposit; `metadata.order_id`);
   stores URL on order, status → `awaiting_payment` when sent. Admin buttons:
   "Enlace 100%" / "Señal 30%" (remainder link generated later from the same UI).
2. `functions/api/stripe/webhook.ts`: verify signature (`STRIPE_WEBHOOK_SECRET`,
   HMAC — implement per Stripe docs, no SDK), on `checkout.session.completed` →
   mark `paid_eur`/`paid_at` (accumulate for deposit+rest), status → `paid` when
   fully covered; log event. Idempotent by session id.
3. Manual reality path: "marcar pagado (efectivo/Bizum personal)" button with
   amount + method note — logged.
4. Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (inert until set).
   `docs/setup-stripe.md`: Mike's Stripe account with Bizum is ALREADY active —
   no onboarding steps. Document only: (1) create a **restricted** API key
   (Checkout Sessions: write; Payment Links: write; nothing else) instead of the
   full secret key; (2) run in TEST mode first (test keys + test webhook);
   (3) after the first deploy, register the webhook endpoint
   `https://restorelab.io/api/stripe/webhook` in the Stripe dashboard and copy
   the signing secret into `STRIPE_WEBHOOK_SECRET`; (4) verify Bizum shows as a
   payment method in a live Checkout before announcing it; fees note
   (~1.5% + €0.25 EU cards — already in the unit-economics model).

**Acceptance:** test-mode: link created from admin, paid with test card → webhook
flips status; deposit flow accumulates; signature verification rejects tampered
payloads; build green.

## ☐ RL-430 — Partner job cards (no login, no app)

1. Partners CRUD in admin (fields from RL-410; payout_pct default 70).
2. Assign flow: generates `job_token` (random 128-bit, stored hashed) →
   partner page `/p/<token>` (ES-only, `noindex`): job card — service +
   size, checklist per service (new `partner_checklists` map in a TS lib file,
   editable later), address + Maps link, time window, client first name only
   (no phone in v1 — Mike coordinates), house rules (uniform/photos/no direct
   contact reminder), **upload before (min 2) / after (min 2) photos**, textarea
   for notes, button "Trabajo terminado" → status `qc`, event logged.
   Token expires when order closes.
3. Dispatch v1 (manual): admin button "Mensaje para partner" → wa.me/<partner
   phone> prefilled (×ES): job summary + `/p/<token>` link. (Automated in RL-450.)
4. **QC screen** in admin: before/after grid, Approve (→ `awaiting_payment` +
   jump to payment UI) / Request rework (increments `rework`, note to partner,
   status back to `in_progress`).
5. Payout ledger: per-order payout = `payout_pct` × quote (or per-order
   override); admin "Partners" tab: per-month table per partner (jobs, GMV,
   payout, rework count) + CSV export — the partner invoices restoreLab against
   this statement.

**Acceptance:** full cycle on a test order: assign → open token page on a phone →
upload 2+2 photos → done → QC approve → payout appears in ledger; token from a
closed order is dead; build green.

## ☐ RL-460 — Metrics dashboard (the "цифры" tab)

1. Admin "Métricas" tab, month selector, cards + one simple table (no chart lib;
   tiny inline SVG bars max):
   - Orders: created / booked / done, by channel and by service; quote→booked %.
   - Time-to-quote median (order_events `new→quoted`).
   - Revenue: paid € total, avg ticket; **contribution estimate** per order =
     `paid − payout − 1.5%·paid − reserve 4%` (constants in one TS file with a
     comment pointing to the verdict doc) — total and per order avg.
   - Partner quality: jobs, rework %, avg time in_progress per partner.
   - **CAC block:** join orders.ref_code ↔ REF_LOG (`GET /api/ref` internally)
     → orders by source/campaign; manual monthly ad-spend input (stored in D1
     `settings` table) → blended CAC and CAC per source. Show the kill-criteria
     thresholds from the verdict doc (CAC €90, rework 8%, quote→booked 20%) as
     colored limit lines/badges.
2. CSV export of the orders table (month scope).

**Acceptance:** with seeded test data all metrics compute correctly by hand-check;
kill-criteria badges flip color across thresholds; build green.

## ☐ RL-450 — WhatsApp Cloud API automation (LAST — gated)

**Gate:** ≥30 orders/month or an active partner doing weekly jobs. Until then the
copy-buttons are genuinely enough.

1. **Second number only.** `docs/setup-whatsapp-cloud.md`: why the main number
   must NOT be migrated (Cloud API disconnects the consumer app; Mike would lose
   his sales inbox), buying a dedicated SIM/virtual number, Meta Business
   verification, phone registration, template (HSM) submission & approval flow.
2. Env: `WA_CLOUD_TOKEN`, `WA_CLOUD_PHONE_ID` (inert until set).
   `functions/api/wa/send.ts` (internal, admin/state-machine use): sends approved
   templates via Graph API.
3. Templates to register (ES/CA/EN bodies included in the doc): `job_assigned`
   (to partner: summary + job link), `payment_link` (to client), `review_request`
   (to client, Google review link), `reminder_24h` (to client).
4. Auto-triggers as status-transition hooks in the orders API (no cron):
   assigned → partner template; QC approved + link created → payment template;
   paid + 4h → review template (schedule via `order_events` check on next
   transition, or simple Workers cron if trivially available — else defer).
   Every send logged; failure → order flagged "manual send needed" in admin.

**Acceptance:** sandbox number sends all templates; triggers fire on transitions;
with envs unset everything degrades to the copy-buttons; build green.

## Housekeeping (fold into the last executed task)

- Update `CLAUDE.md`: new pages (`/solicitud`, `/admin`, `/p/<token>`), pricing
  structured fields + check script, D1/R2/Stripe/WA-Cloud bindings table, state
  machine diagram, "admin/partner = ES-only" note.
- `npm run gen:llms` if public pages changed.
- Verify `public/_headers` CSP still allows nothing new beyond same-origin API
  calls (no external scripts were added).

## Out of scope — do not build

Mobile app, client accounts/login, partner self-registration, AI photo quoting,
multi-city logic, an external CRM sync, email marketing, invoicing/accounting
(partner statements CSV is the boundary). Note ideas in the final report instead.
