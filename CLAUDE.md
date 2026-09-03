# CLAUDE.md — RestoreLab v2

## Project Overview
RestoreLab (restorelab.io) — premium mobile surface restoration service website.
Business base: **Sant Cugat del Vallès** (Barcelona metro, Spain); service area extends to
Barcelona, Terrassa, Sabadell, Rubí and nearby towns.
Primary conversion channel: WhatsApp. Secondary: lead form on /contact.
(There is NO /booking page — Cal.com was dropped; the `booking` JSON key is stale.)

## Tech Stack
- **Framework**: Astro 5.18 (SSG, `output: 'static'`, `trailingSlash: 'never'`)
- **Integrations**: `@astrojs/tailwind` 6 (Tailwind 3), `@astrojs/sitemap` 3; CSS inlining via built-in `build.inlineStylesheets: 'auto'` (astro-critters removed in the Astro 5 migration)
- **Styling**: TailwindCSS 3 + custom design system in `src/styles/global.css`, `darkMode: 'class'`
- **TypeScript**: strict mode, path alias `@/*` → `src/*`
- **Fonts**: DM Sans (body, `font-sans`) + Space Grotesk (headings, `font-display`) via `@fontsource-variable`
- **Deploy**: Cloudflare Pages (auto-deploy on push to `main`)
- **Domain**: restorelab.io

## i18n Architecture
- **3 languages: ES (default), EN, CA (Catalan)**
- Content lives in `src/content/{en,es,ca}.json` — imported as plain JSON (NOT Astro Content Collections)
- All routes: `src/pages/[lang]/...` with `getStaticPaths()` returning one entry per language, each with `props: { t }`
- Root `/` → `/es` via `public/_redirects` + Cloudflare edge function (`functions/index.ts`, smart Accept-Language / CF-IPCountry detection). `src/pages/index.astro` is the client-side fallback.
- Every component receives `t` (translations object) and `lang` as props
- **Any new user-facing text MUST be added to ALL THREE JSON files (en, es, ca)**
- **hreflang** is generated only for the languages a page actually exists in. BaseLayout exposes an `availableLangs` prop (default `['en','es','ca']`); pages that exist in fewer languages — e.g. the ES-only programmatic `areas/[city]/[service]` canary — must pass their real subset (`['es']`). `x-default` is emitted only when `es` is in the set.

## Theme System (Dark / Light)
- Implemented with CSS custom properties + Tailwind `darkMode: 'class'`. **Dark is the default** (`<html class="dark">`), set before first paint by an inline no-FOUC script in BaseLayout.
- Brand tokens (`--brand-*`) and semantic theme tokens (`--th-*`: `heading`, `body`, `muted`, `faint`, `surface`, `border`) are defined in `global.css` and re-exposed as Tailwind colors (`brand-*`, `th-*`).
- `.card` auto-styles per theme (dark = glass, light = solid white + shadow). `meta[name="theme-color"]` is synced to the active theme.

## Project Structure
```
src/
  layouts/BaseLayout.astro          — <html>, <head>, SEO, hreflang, JSON-LD, tracking, cookie consent, theme init
  pages/
    index.astro                     — root redirect / client fallback → /es
    admin.astro                     — Orders OS admin: pipeline + quote composer + Métricas + Partners (ES-only, noindex, no BaseLayout/tracking; x-admin-token from localStorage)
    p/index.astro                   — partner job card shell (ES-only, noindex; /p/<token> 200-rewrite in _redirects; token = authorization)
    [lang]/
      index.astro                   — homepage
      about.astro                   — about page
      pricing.astro                 — pricing page
      cases.astro                   — before/after gallery
      contact.astro                 — contact / lead form
      solicitud.astro               — public intake form ("Envía fotos, precio en ≤1h" → POST /api/orders)
      plans.astro                   — care plans (subscription tiers)
      business.astro                — B2B / fleet vertical
      ev.astro                      — EV vertical
      commercial-glass.astro        — commercial glass vertical
      privacy.astro                 — privacy policy (incl. RGPD data-controller block)
      terms.astro                   — terms & conditions
      legal.astro                   — aviso legal (LSSI-CE art. 10: titular Mikhail Lesik, NIF, domicilio)
      cookies.astro                 — cookie policy ("manage cookies" button reopens CC preferences)
      academy.astro                 — academy (blog) listing
      academy/[slug].astro          — academy article (20 articles; slug → JSON key via slug.replace(/-/g,'_'))
      areas/[city].astro            — geo area landing (12 cities × 3 langs)
      areas/[city]/[service].astro  — programmatic area×service (ES-ONLY canary, 12 pages)
      services/
        index.astro                 — services listing
        car-paint-correction.astro
        glass-polishing.astro
        acrylic-restoration.astro
        headlight-restoration.astro
        pre-sale-pack.astro
  components/                        — 23 components (see below)
  lib/
    constants.ts                    — WHATSAPP_NUMBER, SITE_URL (from env vars)
    analytics.ts                    — analytics helpers (RestoreLabEvent union; runtime lives in BaseLayout)
    attribution.ts                  — attribution schema/types (rl_attr storage, ref codes; runtime in BaseLayout)
    areaProfiles.ts                 — geo-area data (cities, case counts, travel fees)
    areaServiceContent.ts           — content for area×service canary pages
    serviceProfiles.ts              — per-service metadata
    authorBio.ts                    — author (Person) data for academy BlogPosting schema
    clusterMap.ts                   — internal-linking / topic-cluster map
  content/
    en.json, es.json, ca.json       — all translatable content (3 langs)
  styles/
    global.css                      — @fontsource imports, CSS tokens, Tailwind layers, utility classes
public/
  _headers                          — Cloudflare security headers (CSP, HSTS, cache)
  _redirects                        — / → /es
  robots.txt, llms.txt, manifest.json, favicon.svg, icon-192.png, icon-512.png, apple-touch-icon.png
  images/                           — static images
functions/
  index.ts                          — Cloudflare edge function (root locale redirect)
  _lib/                             — shared Function helpers (underscore = never routed)
    orders.ts                       — Orders OS helpers: ULID, order codes, state machine, auth, D1/R2 types
    schema.ts                       — Orders schema statements (mirror of migrations/0001_init.sql)
  api/capi.ts                       — Meta Conversions API forwarder (inert until env vars set)
  api/ref.ts                        — WhatsApp ref-code attribution log (KV REF_LOG; inert until bound)
  api/orders/index.ts               — POST public intake (+admin manual entry) / GET list (admin; includes status_ts)
  api/partners/index.ts             — GET list / POST create (admin; full CRUD lands with RL-430)
  api/stripe/create-link.ts         — POST Checkout link, card+Bizum, amount computed server-side (admin; inert w/o STRIPE_SECRET_KEY)
  api/stripe/webhook.ts             — Stripe webhook, HMAC-verified, accumulates paid_eur (inert w/o STRIPE_WEBHOOK_SECRET)
  api/metrics.ts                    — GET monthly metrics aggregation (admin): funnel, revenue, contribution, partners, CAC
  api/settings.ts                   — GET/PUT admin settings KV-in-D1 (ad_spend:<YYYY-MM> etc.)
  api/partners/[id].ts              — PATCH partner (admin: phone, payout_pct, active, zones, skills)
  api/orders/[id]/job-token.ts      — POST issue partner job token (admin; re-issue invalidates old)
  api/job/[token].ts                — GET job card data / POST "done" (partner, token-authorized)
  api/wa/send.ts                    — POST manual WA Cloud template send (admin; inert w/o WA_CLOUD_*)
  _lib/wa.ts                        — WA Cloud sender + status-transition hooks (assigned→partner, awaiting_payment+link→client)
  api/orders/[id].ts                — GET detail+timeline / PATCH fields+status (admin; state machine)
  api/orders/[id]/photos.ts         — POST photo upload (intake token / job token / admin)
  api/photo/[[key]].ts              — GET photo stream from R2 (unguessable keys)
  api/admin/migrate.ts              — POST apply schema (admin; idempotent)
migrations/
  0001_init.sql                     — Orders OS D1 schema (orders, partners, order_events, rate_limits)
  0002_partner_program.sql          — payout_pct/accepted_at on orders, rc_expiry on partners (ALTERs; migrate endpoint tolerates duplicate-column)
  0003_payment_pref.sql             — orders.payment_pref ('online'|'cash') for the payment-method flow
  0004_partner_registration.sql     — partners: token_hash/status/registered_at/docs/profile (magic-link self-registration)
  0005_order_addons.sql             — orders.addons (JSON) for partner on-site upsells
scripts/
  new-case.mjs, new-post.mjs, generate-llms-txt.mjs
```

### Components (25, in `src/components/`)
`AreaServedSection`, `AvailabilityBanner`, `B2BStrip`, `BeforeAfterCarousel`, `CasesGallery`,
`CertificationsRow`, `Estimator`, `FAQ`, `Footer`, `GuaranteeBlock`, `Header`, `Hero`,
`HowItWorks`, `HubSpokeList`, `IntakeCTA`, `LegalSections`, `PlanUpsell`, `PreFooterCTA`,
`PricingCards`, `PricingMatrix`, `RelatedGuides`, `ServiceCTA`, `ServicesGrid`, `StickyCTA`,
`TransparencyBlock`.
(`ArticleSchema`, `BrandsStrip` and `LeadForm` were removed.)

- **`Estimator.astro`** is the interactive package picker (replaced the old `Calculator`; there is no `Calculator.astro` / `calculatorConfig.ts`). It asks one question, plus a second only where the answer branches, and resolves to a single package via a 13-row `OUTCOMES` lookup — no scoring. It **never carries its own prices**: name, price and duration are joined from `t.pricing` by package slug, and a missing slug throws at build time. It renders *below* `PricingCards` on `/[lang]` and `/[lang]/pricing`, and takes a `source` prop used only as an analytics dimension.
- `LeadForm.astro` was **deleted** (RL-411) — it was never rendered. The visible contact form lives on `/contact` (uses the `lead_form` JSON keys); the photo-intake path is `/solicitud` + `IntakeCTA` (secondary CTA on the three paid service pages + contact; supports `?service=<package-slug>` preselect).
- **`PlanUpsell.astro`** is the one-line care-plans cross-sell card (4 car-service pages + the Estimator result). Its "from …" price is joined at build time from the cheapest `t.plans.tiers` monthly price — never hardcode it. Fires `plan_upsell_clicked { source }`.
- **`B2BStrip.astro`** is the homepage "Para empresas" section (3 cards → /business, /commercial-glass, /plans); fires `cta_clicked` with `ctaId: home_b2b_<target>`.

## Content JSON Structure
Each `{lang}.json` has these top-level keys:
`lang`, `meta`, `nav`, `ui`, `hero`, `availability`, `trust`, `services`, `home_b2b`,
`how_it_works`, `pricing`, `estimator`, `intake`, `faq`, `area`, `wa_messages`, `lead_form`, `footer`,
`guarantee`, `cases_section`, `cases_gallery`, `pre_footer_cta`, `about`, `academy`,
`academy_articles`, `area_pages`, `business`, `ev`, `commercial_glass`, `plans`,
`area_service_pages`, `booking` (stale — page removed), `cluster_ui`, `legal_notice`,
`cookies_page`, `privacy_page`, `terms_page`, `ceramic_landing`.

Notable substructures:
- `meta` — per-page SEO (title/description) keyed by: `home`, `services`, `car_paint`, `glass`, `acrylic`, `pricing`, `cases`, `contact`, `about`, `business`, `ev`, `commercial_glass`, `plans`, `privacy`, `terms`, `academy`, `academy_equipment`, `headlight`, `pre_sale`, `legal`, `cookies`
- `services.items[]` — each: `id`, `title`, `subtitle`, `icon`, `features[]`, `tag`, `starting_price`, `vs_price` (6 items; 5 have dedicated pages)
- `pricing.categories[]` (`car`, `glass`, `extras`) each with `packages[]` (each carrying a `slug`); `pricing.ui.*` holds pricing UI strings; `pricing.home_title` is the homepage-only `PricingCards` heading
- **Pricing single source of truth (RL-401/402)**: every package carries structured fields `price_eur` (null = quote-only), `price_unit` (`job`|`pair`), `from`, and (7 size-dependent packages) `size_pricing {compact,sedan,suv,van}` — the approved matrix in `docs/pricing-strategy.md`. `scripts/check-pricing.mjs` runs as `prebuild` and FAILS the build on cross-lang drift, deviation from the approved matrix, or hardcoded euro amounts in `src/` (allowlist: `areaProfiles.ts`). Upsell captions use a `{diff}` template — deltas are computed from `price_eur`/`size_pricing`, never typed. `pricing.transparency` holds the TransparencyBlock copy; travel fees come from `areaProfiles.travelFee`.
- `estimator` — estimator UI, the 13 `why_*` rationale lines, and `estimator.tiers` **keyed by pricing slug** carrying `desc` only. Never put a package `name` or `price` here: they come from `t.pricing`, so drift is structurally impossible. Estimator WhatsApp copy lives in `t.wa_messages.estimator_*` (Critical Rule 3), assembled line by line so empty fields are omitted rather than sent blank.
- `wa_messages` — **all WhatsApp message templates** (keys such as `header`, `hero`, `pricing_plan`, `pricing_custom`, `sticky_cta`, `prefooter_cta`, `footer`, `contact`)
- `academy_articles` — keyed by article slug (underscored)

## Environment Variables
Defined in `.env`, referenced in `.env.example`:
```
PUBLIC_WHATSAPP_NUMBER=34680265190    # digits only, with country code (Spain)
PUBLIC_SITE_URL=https://restorelab.io
PUBLIC_GTM_ID=GTM-W34GRX86
PUBLIC_CLARITY_ID=vmc619bvp9
PUBLIC_META_PIXEL_ID=1556029059322810
```
Access in Astro: `import.meta.env.PUBLIC_*`. WhatsApp number and site URL are centralized in `src/lib/constants.ts`.

## Design System (Tailwind)
Colors are CSS custom properties re-exposed as Tailwind tokens in `tailwind.config.mjs`.

Brand tokens (`brand-*`, driven by `--brand-*`):
| Token | Role |
|-------|------|
| `brand-dark` | page background base |
| `brand-navy` | sections, cards |
| `brand-blue` | accents, borders |
| `brand-accent` | primary CTA, links |
| `brand-gold` | premium tags |
| `brand-light` | body text base |
| `brand-white` | headings |
| `brand-whatsapp` (`#25D366`) | WhatsApp buttons |

Semantic theme tokens (`th-*`, driven by `--th-*`): `th-heading`, `th-body`, `th-muted`, `th-faint`, `th-surface`, `th-border` — prefer these for text/surfaces so components work in both themes.

Gradient: `bg-gradient-hero` = `linear-gradient(135deg, var(--hero-from) → var(--hero-via) → var(--hero-to))`.

Reusable CSS classes in `global.css`: `.btn-primary`, `.btn-secondary`, `.btn-whatsapp`, `.section-title`, `.section-subtitle`, `.card`, `.tag`, `.lead`, `.caption`, `.label`.

## Commands
```bash
npm run dev        # dev server
npm run check      # TypeScript / Astro check
npm run build      # astro check && astro build (172 pages → dist/)
npm run preview    # preview built site
npm run new:case   # scaffold a new before/after case
npm run new:post   # scaffold a new academy article
npm run gen:llms   # regenerate public/llms.txt
```

## Build Output
- **169 static pages** (3 langs × routes + 20 academy articles/lang + 12 area pages/lang + verticals + plans + 13 ES-only area×service canary pages + ES-only ceramic Barcelona landing + a static 404)
- Sitemap: `dist/sitemap-index.xml` (+ `dist/sitemap-0.xml`)
- Build must pass with **0 errors and 0 warnings**

## SEO & Tracking
- JSON-LD schemas: `AutomotiveBusiness` + `Organization` + `WebSite` (BaseLayout, every page; **no** `AggregateRating` — the rating was never defensible and both the schema and the visible claim are gone), `Service` (service/vertical pages), `BreadcrumbList` (most pages; bare pages use the BaseLayout `breadcrumbs` prop), `Offer` (pricing/verticals), `FAQPage` (FAQ component, opt-in `schema` prop — exactly ONE page per language owns it: /contact), `BlogPosting` with a `Person` author (academy articles).
- **Entity graph**: stable `@id` anchors — `#organization`, `#business`, `#website`, `#founder` — link every node; `sameAs` → Facebook page. The academy author and the /about founder are the SAME person (`#founder`, Mikhail Lesik) — never reintroduce a divergent byline name.
- **AI search (GEO)**: `public/robots.txt` explicitly allows the AI crawlers (GPTBot, ClaudeBot, PerplexityBot…); `public/llms.txt` is generated by `npm run gen:llms` — regenerate after pricing/services/areas/academy changes, never hand-edit. Academy articles show a visible byline + published/updated `<time>` dates (dates live in `academy.articles[]` cards).
- hreflang: only for the languages a page exists in (`availableLangs`), + `x-default` → ES.
- OpenGraph + Twitter Card meta on every page; `og:locale` per lang (`es_ES` / `en_GB` / `ca_ES`).
- Unified analytics push: `window.__rl_push(payload)` fans out to GTM → Clarity → Meta Pixel, gated on CookieConsent analytics/marketing consent. `data-event` attributes on CTAs drive event delegation; optional `data-cta` → `ctaId` (+ `location`) and `data-source` → `source` are mapped onto the payload by the delegate, so typed shapes (`cta_clicked`, `b2b_inquiry`, `commercial_glass_inquiry`, `plan_upsell_clicked`) work declaratively.

## Attribution & Ref-Codes (RL-301)
- **Storage**: `localStorage.rl_attr` = `{ first, last, ref }` — schema documented in `src/lib/attribution.ts`. `first` touch is written once; `last` updates on any visit carrying `utm_*` / click-id params. `gclid`/`fbclid`/`msclkid` persist only after **marketing** consent; UTMs always.
- **Ref code**: `RL-` + 4 chars from `[A-HJ-NP-Z2-9]` (e.g. `RL-K7F3`), generated once per visitor, pre-consent (first-party functional id). Appended as a final `Ref: RL-XXXX` line to **every** wa.me prefill (DOM-ready pass + click-time rewrite for dynamic links like the Estimator; reads to the client as a plain reference number — the `#ref` prefix was renamed 2026-09-02). Never put the ref line inside `wa_messages` templates — it is injected at runtime.
- **Event enrichment**: contact-intent events (`wa_click`, `phone_click`, `lead_submitted`, `b2b_inquiry`, `commercial_glass_inquiry`, `estimator_result`, plus any click whose href is wa.me/tel:) carry `ref`, `attr_source`, `attr_campaign`, `attr_landing`.
- **Server log**: `functions/api/ref.ts` — POST (fire-and-forget from the pipeline) stores contact moments in KV binding `REF_LOG` (180d TTL); `GET /api/ref?code=RL-XXXX&token=<REF_ADMIN_TOKEN>` returns them (wrong token → 404). Inert until the KV binding + env var are configured in the Cloudflare dashboard.
- Runtime lives ONLY in the BaseLayout tracking block (same rule as `__rl_push`). Setup + GTM/Ads wiring + weekly CAC ritual: `docs/ads-measurement.md`.

## Orders OS (RL-410, Phase 4)
- **Bindings** (all inert until configured — capi.ts philosophy; setup: `docs/setup-cloudflare-bindings.md`): D1 `ORDERS_DB` (db `restorelab-orders`), R2 `PHOTOS` (bucket `restorelab-photos`), env `ADMIN_TOKEN` (guards list/detail/PATCH/migrate; wrong → 404).
- **State machine** (enforced in PATCH): `new→quoted→booked→(assigned→)in_progress→qc→awaiting_payment→paid→done`; `qc→in_progress` = rework (auto-increments the counter); most states → `cancelled`, incl. `paid→cancelled` (refund path — and the only route a paid test order has to the cancelled-only DELETE); `booked→in_progress` legal (Mike works the job himself). Every mutation writes an `order_events` row.
- **Photos**: raw-bytes POST, jpeg/png/webp/heic ≤6MB, per-kind limits (intake 6 / before 8 / after 8), R2 keys `orders/<id>/<kind>/<rand128>.<ext>` — the key IS the capability; `/api/photo/<key>` streams, no listing. Intake uploads use the `intake_token` from order creation; before/after use the RL-430 job token (sha256 vs `job_token_hash`).
- Public intake: honeypot field `website`, per-IP D1 rate limit (5/h, hashed IPs), same-origin only, order code `RL-O-XXXX`.
- Schema changes: edit BOTH `migrations/0001_init.sql` and `functions/_lib/schema.ts` (mirror for `/api/admin/migrate`).
- **D1 gotcha (production only)**: prod D1 rejects LIKE patterns longer than its (small) pattern limit with "LIKE or GLOB pattern too complex" — and only evaluates the pattern once matching-candidate rows exist, so the bug hides until the second row. Never bind long strings into LIKE; use `instr(col, ?) > 0` (see stripe/webhook.ts idempotency check).
- **Payments (RL-440)**: Stripe via raw REST (no SDK). Amounts are ALWAYS computed server-side from `quote_eur` (deposit = 30%, rest = quote − paid); link creation advances to `awaiting_payment` only when legal from the current status; the webhook accumulates `paid_eur` across deposit+rest, is idempotent by session id, and moves to `paid` only when covered AND legal. Manual payments go through the admin "Marcar pagado" (method recorded via PATCH `event_note`). Env: `STRIPE_SECRET_KEY` (restricted key), `STRIPE_WEBHOOK_SECRET`; setup in `docs/setup-stripe.md`. `STRIPE_API_BASE` exists only as a test hook.
- **Metrics (RL-460)**: `/admin` Métricas tab ← `GET /api/metrics?month=`. Unit-economics constants + kill-criteria thresholds (CAC ≤90€, rework ≤8%, quote→booked ≥20%) live ONLY in `src/lib/unitEconomics.ts`. Contribution = paid − partner payout − 1.5% Stripe − 4% reserve. CAC uses the attribution snapshot stored on each order (no REF_LOG round-trip) + manual monthly spend in `settings` key `ad_spend:<YYYY-MM>`. CSV export is client-side from the same payload. NB: the euro-amount guardrail applies to comments too — write "25-cent", never "€0.25", in src/.
- **Partners (RL-430)**: job token = the ONLY partner auth (128-bit, sha256 stored, dead outside assigned/in_progress/qc; re-issue invalidates). `/p/<token>` shows client FIRST NAME only, no phone. Checklists in `src/lib/partnerChecklists.ts`. "Done" enforces ≥2 before + ≥2 after photos and walks assigned→in_progress→qc. Payout accrues on ACCEPTED work (awaiting_payment/paid/done) = **the order's `payout_pct` snapshot** (frozen at assignment; renegotiating a partner's live % never rewrites issued statements) × quote; ledger + CSV in the admin Partners tab.
- **Client language (auto-reply flow)**: every order carries `lang` (ES/EN/CA); the admin shows it as a badge on the pipeline card + detail header (accent when not ES) and an editable "Idioma del cliente" selector. ALL lifecycle/quote WhatsApp copy renders in the order's `lang`. **WhatsApp message copy is deliberately emoji-free and em-dash-free** (both read as AI/tofu) and written in natural native ES/EN/CA — keep it that way when editing `wa_messages`.
- **Payment method (`payment_pref` 'online'|'cash')**: the Pagos card asks "¿Cómo paga el cliente?" once; cash hides the Stripe buttons + señal nudge, online shows them. A status banner (paid-in-full / señal received + remaining / not collected) sits at the top of Pagos, and a pay badge (✓ pagado / señal X€ / efectivo) shows on every pipeline card. `payment_pref` guides the UI; the manual "Registrar" records actual cash/Bizum received (method in the event note).
- **Partner self-registration (RL-431, `/socio/<token>`)**: Mike clicks "🔗 Enlace de registro" in the admin Partners tab → `POST /api/partners/invite` creates an `invited` partner row (active=0) + a magic-link token → sends the link. The partner opens `/socio/<token>` (ES-only, noindex, `/socio/*` 200-rewrite, token = auth), fills the form (data, NIF, alta autónomo, RC expiry, zones, skills, availability, portfolio) and uploads work photos / kit video / DNI / RETA / RC (R2 under `partners/<id>/...`, served via `/api/photo`), accepts the agreement → status `pending`. The admin shows a review card (submitted profile + doc thumbnails) with "✓ Activar partner" → status `active` (keeps the legacy `active` flag in lock-step so the assign dropdown gates on it). The SAME token becomes the persistent cabinet (profile, month payout, active jobs, editable availability). `POST /api/socio/<token>` is a PARTIAL merge — a cabinet edit never wipes the profile. `token_hash` is never exposed by the partners API. `src/lib/partnerChecklists.ts` still holds the per-service checklists shown on the job card.
- **Partner cabinet is the work surface**: the cabinet lists the partner's jobs (incl. `booked` — anything assigned that isn't closed); each offered-not-accepted job shows **Aceptar/Rechazar** (`POST /api/socio/<ptoken>/respond` — accept logs it; decline unassigns + reverts assigned→booked + kills the job token + logs `partner_declined`, shown as a red banner in the admin). Accepted/working jobs show **Abrir y trabajar** → `POST /api/socio/<ptoken>/open` issues a fresh job token and opens the full `/p/<jobtoken>` card. `/api/job` + `/p/` accept `booked` too. Mike's "Mensaje para partner" is a fallback.
- **On-site upsell add-ons (RL-432)**: 8-item fixed-price catalog in `t.addons` (×3 langs); `orders.addons` JSON. On the `/p/` card the partner marks extras the client accepted (`POST /api/job/<jobtoken>/addon` — price looked up server-side from the catalog, never client-sent). Add-ons raise what the client owes (Stripe full/rest + webhook `covered` use quote+addons) and the partner's pay at **`ADDON_PARTNER_PCT`=80%** (vs the 70% base — restoreLab keeps 20% not 30%), applied in the job card, cabinet, metrics ledger/contribution and the admin. `addonsTotal()` helper in `_lib/orders.ts`. Note: this deliberately lets the partner interface with the client on fixed-price extras — flag for the falso-autónomo review in the contract.
- **Partner extra-work (free-text)**: `/p/` "¿Hace falta algo fuera de la lista?" box → `POST /api/job/<token>` `action:'suggest_extra'` (text only, never a price) → `partner_suggested_extra` → gold banner in admin (Mike re-quotes). For non-catalog work.
- **Order Flow v2 (blueprint: docs/order-flow-v2-partner-program.md)**: assignment is an OFFER — the /p/ card carries an explicit "Acepto" button (`POST /api/job/<t>` `action:'accept'` → `accepted_at`, also the falso-autónomo right-to-decline evidence; reassignment resets it); the /p/ card shows the partner's payout € and the latest rework note. Assign is hard-gated on address+scheduled_at and on a non-expired partner `rc_expiry`. Lifecycle client messages = `wa_messages.lc_*` ×3 langs (booking confirmation, T-24h, on-my-way ±partner, work started/done, follow-ups 1/2/3, review ask [link line appears once localStorage `rl_review_url` is set], 48h check-in), rendered per-status as wa.me copy-buttons in the order detail; unfillable placeholder lines are dropped whole. `quoted` SLA escalates 24h/3d/7d/14d + a "Seguimiento" chip. New public orders ping the owner via env `NOTIFY_WEBHOOK` (ntfy.sh-compatible, inert until set).
- **WhatsApp Cloud (RL-450, gated)**: SECOND number only — NEVER register the personal +34 680 265 190 (disconnects the phone app). Hooks in `functions/_lib/wa.ts` fire on →assigned (job_assigned to partner, auto-issues token) and →awaiting_payment with a link (payment_link to client, in the order's lang); paid+4h review is deliberately deferred (no cron). Failures log `wa_send_failed` and the admin shows "envío manual necesario" — copy-buttons always remain the fallback. Env `WA_CLOUD_TOKEN`/`WA_CLOUD_PHONE_ID` (inert until set); setup + HSM template bodies in `docs/setup-whatsapp-cloud.md`. All Meta-side setup is done BY THE OWNER BY HAND (Meta restriction rule of 2026-07-31).
- **State machine source of truth**: `src/lib/orderPipeline.ts` — imported by the Functions AND `/admin`, so buttons and API can never disagree. Admin/partner surfaces are **ES-only by design**; they are `noindex` (meta + `X-Robots-Tag` in `_headers`), excluded from the sitemap (astro.config filter on `/admin` + `/p/`), and never linked from public pages. The quote composer computes every number from the pricing JSON (RL-401); a manual price requires the explicit override field + reason, recorded in `quote_breakdown`. Quote WhatsApp copy lives in `wa_messages.quote_*` ×3 langs (message renders in the ORDER's lang).

## Security
- CSP + HSTS (with preload) in `public/_headers`. CSP whitelists: self, GTM, Clarity, Meta Pixel.
- CookieConsent v3 (`vanilla-cookieconsent@3.0.1`) is self-hosted from `public/vendor/`.
- WhatsApp deep-links are built with `encodeURIComponent`; never inject raw user input into the DOM.
- Form inputs have `maxlength` validation.
- `.env` is gitignored; secrets are never committed.

## Critical Rules — DO NOT BREAK
1. **Routing**: `/en`, `/es`, `/ca` prefix on all routes — never create routes without `[lang]`.
2. **Translations**: any new user-facing text → add to **ALL THREE** JSON files (en, es, ca).
3. **WhatsApp templates**: message text comes **ONLY** from `t.wa_messages` in the content JSON — never hardcode WhatsApp message strings in components/pages.
4. **WhatsApp links**: always use `WHATSAPP_NUMBER` from `constants.ts`, never hardcode the number.
5. **hreflang**: generate alternates only for languages where the page exists (`availableLangs` prop on BaseLayout).
6. **Imports**: always use the `@/` alias, never relative (`../../`).
7. **Colors**: use `brand-*` / `th-*` tokens from the Tailwind theme, never hardcode hex in templates.
8. **Accessibility**: `focus-visible:ring-2` on all interactive elements, ARIA attributes on dynamic widgets, `for`/`id` pairing on form labels/inputs.
9. **Build**: run `npm run build` after changes — must produce 0 errors.
10. **GDPR**: all tracking behind CookieConsent — never load GTM/Clarity/Pixel without consent.

## Service IDs (used in JSON and route matching)
Services grid (`services.items`) has 6 entries; 5 have dedicated `/services/*` pages:
- `car-paint-correction` → `/services/car-paint-correction`
- `glass-polishing` → `/services/glass-polishing`
- `acrylic-restoration` → `/services/acrylic-restoration`
- `headlight-restoration` → `/services/headlight-restoration`
- `pre-sale-pack` → `/services/pre-sale-pack`
(`trim-restoration` appears in the grid but has no dedicated page. Interior leather
cleaning was withdrawn — it quoted three different prices and had no package.)

## Pricing Category IDs (`PricingCards` `categoryId` prop)
- `car` — car paint correction plans
- `glass` — glass polishing plans
- `extras` — add-on / extra services

## Git Conventions
- Commit messages in English
- One logical change per commit
- Never commit `.env` or secrets
- Deploy: push to `main` → Cloudflare auto-deploys
