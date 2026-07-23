# CLAUDE.md — RestoreLab v2

## Project Overview
RestoreLab (restorelab.io) — premium mobile surface restoration service website.
Business base: **Sant Cugat del Vallès** (Barcelona metro, Spain); service area extends to
Barcelona, Terrassa, Sabadell, Rubí and nearby towns.
Primary conversion channel: WhatsApp. Secondary: lead form / booking.

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
    [lang]/
      index.astro                   — homepage
      about.astro                   — about page
      pricing.astro                 — pricing page
      cases.astro                   — before/after gallery
      contact.astro                 — contact / lead form
      booking.astro                 — booking page
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
  components/                        — 20 components (see below)
  lib/
    constants.ts                    — WHATSAPP_NUMBER, SITE_URL (from env vars)
    analytics.ts                    — analytics helpers
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
scripts/
  new-case.mjs, new-post.mjs, generate-llms-txt.mjs
```

### Components (20, in `src/components/`)
`AreaServedSection`, `ArticleSchema`, `BeforeAfterCarousel`, `BrandsStrip`, `CasesGallery`,
`CertificationsRow`, `Estimator`, `FAQ`, `Footer`, `GuaranteeBlock`, `Header`, `Hero`,
`HowItWorks`, `HubSpokeList`, `LeadForm`, `PreFooterCTA`, `PricingCards`, `RelatedGuides`,
`ServiceCTA`, `ServicesGrid`, `StickyCTA`.

- **`Estimator.astro`** is the interactive package picker (replaced the old `Calculator`; there is no `Calculator.astro` / `calculatorConfig.ts`). It asks one question, plus a second only where the answer branches, and resolves to a single package via a 13-row `OUTCOMES` lookup — no scoring. It **never carries its own prices**: name, price and duration are joined from `t.pricing` by package slug, and a missing slug throws at build time. It renders *below* `PricingCards` on `/[lang]` and `/[lang]/pricing`, and takes a `source` prop used only as an analytics dimension.
- `LeadForm.astro` is **not rendered anywhere** — its `<section>` is unconditionally `hidden` and the component exposes no prop to unhide it. Kept for reuse only. The visible form lives on `/contact`.

## Content JSON Structure
Each `{lang}.json` has these top-level keys:
`lang`, `meta`, `nav`, `ui`, `hero`, `trust`, `services`, `how_it_works`,
`pricing`, `estimator`, `faq`, `area`, `wa_messages`, `lead_form`, `footer`, `guarantee`,
`cases_section`, `pre_footer_cta`, `about`, `academy`, `academy_articles`, `area_pages`,
`business`, `ev`, `commercial_glass`, `plans`, `area_service_pages`, `booking`, `cluster_ui`.

Notable substructures:
- `meta` — per-page SEO (title/description) keyed by: `home`, `services`, `car_paint`, `glass`, `acrylic`, `pricing`, `cases`, `contact`, `about`, `business`, `ev`, `commercial_glass`, `plans`, `booking`, `privacy`, `terms`, `academy`, `academy_equipment`, `headlight`, `interior_leather`, `pre_sale`
- `services.items[]` — each: `id`, `title`, `subtitle`, `icon`, `features[]`, `tag`, `starting_price`, `vs_price` (7 items; 6 have dedicated pages)
- `pricing.categories[]` (`car`, `glass`, `extras`) each with `packages[]` (each carrying a `slug`); `pricing.ui.*` holds pricing UI strings; `pricing.home_title` is the homepage-only `PricingCards` heading
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
- **172 static pages** (3 langs × routes + 20 academy articles/lang + 12 area pages/lang + verticals + plans/booking + 13 ES-only area×service canary pages + ES-only ceramic Barcelona landing + a static 404)
- Sitemap: `dist/sitemap-index.xml` (+ `dist/sitemap-0.xml`)
- Build must pass with **0 errors and 0 warnings**

## SEO & Tracking
- JSON-LD schemas: `AutomotiveBusiness` + `Organization` (BaseLayout, one per page; **no** `AggregateRating` — the rating was never defensible and both the schema and the visible claim are gone), `Service` (service/vertical pages), `BreadcrumbList` (most pages), `Offer` (pricing/verticals), `FAQPage` (FAQ component), `BlogPosting` with a `Person` author (academy articles).
- hreflang: only for the languages a page exists in (`availableLangs`), + `x-default` → ES.
- OpenGraph + Twitter Card meta on every page; `og:locale` per lang (`es_ES` / `en_GB` / `ca_ES`).
- Unified analytics push: `window.__rl_push(payload)` fans out to GTM → Clarity → Meta Pixel, gated on CookieConsent analytics/marketing consent. `data-event` attributes on CTAs drive event delegation.

## Security
- CSP + HSTS (with preload) in `public/_headers`. CSP whitelists: self, GTM, Clarity, Meta Pixel, Cal.com, and the CookieConsent CDN.
- CookieConsent v3 (`vanilla-cookieconsent@3.0.1`) currently loaded from `cdn.jsdelivr.net`.
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
