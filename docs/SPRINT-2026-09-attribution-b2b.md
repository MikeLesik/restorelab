# restoreLab — PHASE 3: Attribution & B2B Visibility Sprint (2026-09)

> **How to run:** open Claude Code in the repo root and say:
> `Read docs/SPRINT-2026-09-attribution-b2b.md and CLAUDE.md. Execute RL-301 fully, verify, commit, then stop and show me the result before continuing.`
> Then continue task by task (RL-302 → RL-303 → RL-304). One commit per task, message format: `RL-3XX: <summary>`.

## Context (why this sprint)

Business decision (see internal verdict doc, Sep 2026): restoreLab pivots weight toward
**B2B (VO dealers) + certified partner network + commercial glass**, keeps B2C on
organic + a capped paid test. In October we spend **€2,500 on Google Ads** to measure
real CAC. Today the repo has **zero UTM/gclid handling** (`grep -rn "gclid\|utm_" src`
returns nothing), so a paid click that converts in WhatsApp is unattributable — the
whole test would produce noise. Also, the money pages (`/business`,
`/commercial-glass`, `/plans`) are linked **only in the footer**, and
`business.hero_cta_secondary` ("Descargar Tarifa") has no wired href.

**Priority order: RL-301 → RL-302 → RL-303 → RL-304. RL-301 and RL-302 MUST ship
before any ad spend starts.**

## Hard constraints (do not violate)

1. Follow `CLAUDE.md` conventions strictly: every user-facing string goes into ALL
   THREE of `src/content/{en,es,ca}.json`; pages receive `t` via `getStaticPaths`;
   no hardcoded copy in `.astro` files.
2. Do NOT redesign anything. Reuse existing tokens (`--th-*`, `--brand-*`), `.card`,
   existing section patterns. Dark stays default.
3. Analytics: extend the `RestoreLabEvent` union in `src/lib/analytics.ts` for any
   new event; runtime logic lives ONLY in the BaseLayout `__rl_push` pipeline
   (see the comment in `analytics.ts` — never re-implement the fan-out).
   Respect the existing CookieConsent category split (analytics vs marketing).
4. No new npm dependencies unless strictly unavoidable. Cloudflare-native (Pages
   Functions, KV) is fine.
5. After each task: `npm run build` must pass (`astro check` + build). Do not
   commit a red build. Keep `trailingSlash: 'never'` / `format: 'file'` semantics
   (watch canonical URLs on any new page).
6. Sitemap and hreflang: any new page must follow the `availableLangs` rules from
   CLAUDE.md.

---

## ☐ RL-301 — First-touch attribution + WhatsApp ref-code (CORE TASK)

**Problem.** Conversion happens in WhatsApp. Once the user leaves the site, the
click's origin (campaign/keyword/gclid) is lost. We need every WhatsApp
conversation to carry a short code that maps back to the click's attribution.

**Build:**

1. `src/lib/attribution.ts` (new) — but with runtime logic inlined into the
   BaseLayout runtime block alongside `__rl_push` (same single-pipeline
   philosophy). Behavior:
   - On every page load, parse `location.search` for: `utm_source`, `utm_medium`,
     `utm_campaign`, `utm_term`, `utm_content`, `gclid`, `fbclid`, `msclkid`.
   - Maintain in `localStorage.rl_attr` a JSON object:
     `{ first: {...params, landing, ts}, last: {...params, landing, ts}, ref }`.
     `first` is written once (first touch wins), `last` updates on any new tagged
     visit. `landing` = pathname, `ts` = ISO date.
   - `ref`: a short internal code generated once per visitor:
     `RL-` + 4 chars from `[A-HJ-NP-Z2-9]` (no ambiguous chars), e.g. `RL-K7F3`.
     The ref itself is a first-party functional identifier (no 3rd-party id inside),
     so it may be generated pre-consent. **But** `gclid`/`fbclid`/`msclkid` values
     must only be *persisted* when marketing consent is granted (mirror how the
     existing pipeline gates Pixel/CAPI); UTM params are fine to keep always.
2. **WhatsApp ref injection.** At click time (the existing delegated
   `[data-event]` click handler in BaseLayout is the right hook), for any
   `a[href*="wa.me"]`: append to the prefilled text a final line `\n\n#ref RL-K7F3`
   (URL-encoded). Do it at click/DOM-ready time by rewriting `href`, so JSON
   `wa_messages` templates stay untouched. Every wa.me link on the site must carry
   it — including Estimator-assembled messages.
3. **Event enrichment.** `wa_click`, `phone_click`, `lead_submitted`,
   `b2b_inquiry`, `commercial_glass_inquiry`, `estimator_result` payloads gain:
   `ref`, `attr_source` (first.utm_source || '(direct)'), `attr_campaign`,
   `attr_landing`. Extend the union type accordingly (optional fields).
4. **Server-side ref log.** New Pages Function `functions/api/ref.ts`:
   - `POST` body `{ ref, attr, page, event, ts }` → store in KV namespace
     binding `REF_LOG` (key `ref:<code>:<ts>`, value JSON, TTL 180 days).
     Called fire-and-forget from the pipeline on `wa_click` / `phone_click` /
     `lead_submitted` (only when the call would carry a ref).
   - `GET /api/ref?code=RL-K7F3&token=<REF_ADMIN_TOKEN>` → returns matching
     entries as JSON. Token from env `REF_ADMIN_TOKEN`; wrong/missing token → 404.
   - Add `REF_LOG` + `REF_ADMIN_TOKEN` to `.env.example` with comments, and a
     short "Cloudflare setup" note in the docs file from RL-302 (KV namespace
     creation + Pages binding — manual dashboard steps).
5. **Ops usage note** (add to docs): when a customer writes on WhatsApp, the last
   line shows `#ref RL-K7F3`; Mike looks it up →
   `restorelab.io/api/ref?code=RL-K7F3&token=…` → sees source/campaign → records
   channel in CRM. That closes click → conversation → booked job attribution.

**Acceptance:**
- Visit any page with `?utm_source=test&gclid=abc` → `localStorage.rl_attr`
  populated (gclid only after marketing consent); every wa.me link's decoded text
  ends with `#ref RL-XXXX`.
- `wa_click` dataLayer payload contains `ref` + `attr_*`.
- `npm run build` green; no regression in Estimator message assembly (empty-field
  lines still omitted).

---

## ☐ RL-302 — Google Ads readiness + measurement docs

1. **Docs:** new `docs/ads-measurement.md` (English or Spanish, concise):
   - GTM: create GA4 event tag for `wa_click` (already in dataLayer) → mark as
     key event → import into Google Ads as conversion `contact_whatsapp`
     (secondary: `lead_submitted`). Step-by-step, with the exact dataLayer
     variable names from RL-301.
   - Weekly ritual: export booked jobs with their `#ref` codes → look up via
     `/api/ref` → tag source in CRM → compute CAC per campaign. Include a 6-column
     table template (date, ref, service, gross €, source/campaign, booked y/n).
   - Cloudflare KV setup steps from RL-301.
2. **Landing message-match check** on the three paid-test targets:
   `/{lang}/services/headlight-restoration`, `/{lang}/services/car-paint-correction`,
   `/{lang}/services/glass-polishing`. Ensure each has, above the fold: price-from
   (`desde €79/€149/€119`), the guarantee mention, and a WhatsApp CTA visible
   without scrolling on 390px viewport. If a page lacks the price above the fold,
   surface it via existing JSON fields — copy changes in the three JSONs only.
3. Verify `StickyCTA` renders on those three service pages on mobile; if not, add.

**Acceptance:** docs file complete; three service pages pass the above-the-fold
checklist at 390×844; build green.

---

## ☐ RL-303 — B2B visibility & qualification

1. **Header nav.** Add an "Empresas / For Business / Per a empreses" item to
   `Header.astro` (desktop + mobile menu), linking to `/{lang}/business`, with the
   `commercial-glass` page reachable either via a small dropdown (business +
   glass) or a second item — pick whichever fits the existing header pattern
   with least new CSS. New `nav.*` keys in all three JSONs.
2. **Homepage B2B strip.** New section on `/{lang}/index` (after services grid,
   before cases): three compact `.card`s — "Concesionarios VO" → `/business`,
   "Cristal comercial" → `/commercial-glass`, "Planes de cuidado" → `/plans`.
   One heading + one line each. JSON keys under a new `home_b2b` object ×3 langs.
   Fire `cta_clicked` with `ctaId: 'home_b2b_<target>'` (auto data-event is fine).
3. **Pack VO Foto-Ready tier.** In `business.pricing_tiers` (×3 langs) add an
   entry-level volume tier: name "Pack VO Foto-Ready"; contents: interior
   profundo + exterior enhance + pulido de faros; price "desde €99/coche (lotes
   de 5+)"; delivery "24–48h, informe fotográfico incluido". Keep existing
   premium tiers. Ensure the tier renders correctly in the page's pricing block.
4. **Fix `hero_cta_secondary`** ("Descargar Tarifa") on `/business`: wire it to a
   printable tarifa: new anchor section `#tarifa` on the same page rendering all
   `pricing_tiers` + volume tiers in a clean print-layout (add a minimal
   `@media print` rule set), CTA scrolls to it; secondary small link
   "Imprimir / Guardar PDF" triggers `window.print()`. No PDF asset generation.
5. **Qualification WhatsApp templates.** Rewrite `wa_messages.business` (×3 langs)
   to a fill-in template, e.g. (ES):
   `Hola restoreLab. Soy [nombre] de [concesionario] en [población]. Vendemos ~[nº] coches/mes. Me interesa el Pack VO Foto-Ready / preparación pre-venta. ¿Cuándo podéis hacer una demo?`
   Same pattern for `wa_messages.commercial_glass` (local/edificio, nº de cristales,
   población). Keep messages ≤ 3 lines before the blanks. `#ref` is appended
   automatically by RL-301 — do not duplicate it in templates.
6. `b2b_inquiry` / `commercial_glass_inquiry` events must fire from the new CTAs
   (check existing data-event slugs; extend union only if a new shape is needed).

**Acceptance:** nav shows Empresas on desktop+mobile in 3 langs; homepage strip
renders; business page shows the new tier and a working tarifa anchor + print;
templates updated ×3 langs; build green.

---

## ☐ RL-304 — Plans cross-sell + housekeeping

1. **Plans upsell block** on the four car-service pages and on the Estimator
   result: one-line card "Mantén el resultado: Planes de cuidado desde …" linking
   `/{lang}/plans` (pull the real lowest tier price from `t.plans.tiers` — never
   hardcode). New event `plan_upsell_clicked { source: string }` — add to the
   union. JSON ×3 langs.
2. **CLAUDE.md sync** — it has drifted: `booking.astro` does not exist;
   `ArticleSchema` / `BrandsStrip` are gone; `AvailabilityBanner`, `LegalSections`,
   `ServiceCTA`, `StickyCTA` are missing from its list. Update the structure
   section, the components list, and add a short "Attribution & ref-codes"
   section documenting RL-301 (storage key, ref format, KV binding, admin
   endpoint) and the new events.
3. Run `npm run gen:llms` if the nav/pages changed what llms.txt covers.
4. Full pass: `npm run build`; click through `/es`, `/es/business`,
   `/es/commercial-glass`, `/es/plans`, one service page — no console errors,
   wa links carry `#ref`, dark and light themes both legible on new blocks.

**Acceptance:** all four boxes above verified; final commit.

---

## Out of scope (do NOT do in this sprint)

- No customer app, no booking system, no CRM integration, no redesign, no new
  verticals/pages beyond the listed sections, no paid-tool signups, no i18n
  restructuring. If something looks broken outside scope — note it in the final
  report, don't fix it.
