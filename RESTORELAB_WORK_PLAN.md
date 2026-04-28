# restoreLab — Work Plan for Claude Code

> Version: 1.0 — April 2026
> Owner: restoreLab founding team
> For: Claude Code agent execution

---

## 0. How to use this plan with Claude Code

Save this file as `WORK_PLAN.md` (or `CLAUDE.md`) in the repo root. Then run Claude Code from the repo and start with:

```
Read WORK_PLAN.md. Run TICKET RL-000 first (codebase audit). Then propose
which Phase 1 tickets you can pick up. Do not start work on Phase 2+ tickets
until I confirm Phase 1 is closed. After each ticket, summarize what changed,
list files touched, and update the ticket status with a checkbox.
```

**Conventions for Claude Code:**
- One ticket = one branch + one PR. Branch name: `rl/<TICKET_ID>-<slug>`.
- Always run codebase audit (RL-000) first; do not assume tech stack.
- Always check whether copy strings live in i18n dictionaries before editing components directly.
- Commit format: `[RL-XXX] <imperative title>`.
- After completing a ticket, update its checkbox and add a "Done notes" line at the end of the ticket.
- For any ticket that requires a third-party account (Stripe, Cal.com, Resend, Plausible) — pause and ask the human.
- Never deploy to production. Every ticket ends with a preview URL or local screenshot.

---

## 1. Project context (read this before starting)

**What restoreLab is today:** mobile premium surface restoration service in the Barcelona metropolitan area (Sant Cugat del Vallès as primary base). Services: car paint correction, ceramic coating, glass scratch removal, acrylic restoration. WhatsApp-first lead flow. Single-provider (not yet a marketplace).

**Strategic shift this work plan implements:**
1. **Reposition from "Save 70%" to "premium craftsmanship"** — Sant Cugat is one of the top-5 wealthiest municipalities in Spain (€62K gross/capita); discount messaging is wrong for the catchment.
2. **Match Catalonia premium pricing** — local competitors (Kramex, Car Cosmetic, The Car Spa) price multi-stage correction + ceramic at €600–1000+. Current restoreLab pricing leaves 25–40% on the table.
3. **Add Catalan locale (`/ca/`)** — legal requirement + local trust signal.
4. **Open new verticals**: B2B dealer pre-sale, EV-specialised packages, yacht/marine (Barcelona = superyacht hub), corporate fleet, commercial glass.
5. **Multi-channel conversion**: instant estimator + booking calendar + email lead capture, not WhatsApp-only.
6. **Subscription product** for retention.

**Hard constraints / things NOT to break:**
- Slogan "Restore. Don't Replace." — keep, but reinforce with stronger narrative.
- 30-min response SLA — keep, prove it on the page.
- Free re-do guarantee — keep.
- Mobile service positioning — central differentiator.
- 5.0 Google rating — protect at all costs (any new flow that can hurt CSAT goes through human review).

---

## 2. Tech stack (confirmed)

- **Framework:** Astro
- **Styling:** Tailwind (assumed — verify in RL-000)
- **Hosting:** Cloudflare Pages (with edge function for geo-redirect `/` → `/es`)
- **Critical CSS:** `astro-critters` (already inlined)
- **Sitemap:** `@astrojs/sitemap` (auto-generated, sitemap-index.xml)
- **PWA:** manifest.json + apple-touch-icon present
- **Routing today:** static folders `/en/...` and `/es/...` (i18n approach to be confirmed in RL-000 — could be Astro 4.x native i18n, `astro-i18next`, or hand-rolled folders)

### Already-connected integrations (don't re-add)

| Integration | Status | Use |
|---|---|---|
| Google Tag Manager | ✅ Connected | Behind CookieConsent (analytics) |
| Microsoft Clarity | ✅ Connected | Behind CookieConsent (analytics) — heatmaps + session replay |
| Meta Pixel | ✅ Connected | Behind CookieConsent (marketing) |
| CookieConsent v3 | ✅ Connected | GDPR, bar layout |
| Google Search Console | ✅ Connected | Meta-tag verification |
| `@astrojs/sitemap` | ✅ Connected | Auto-generates `sitemap-index.xml` |
| PWA manifest | ✅ Connected | `manifest.json` + apple-touch-icon |
| `astro-critters` | ✅ Connected | Critical CSS inlining |
| Cloudflare edge function | ✅ Connected | Geo-redirect `/` → `/es` |

### Integrations to add (in scope of this plan)

| Integration | Used in ticket | Notes |
|---|---|---|
| **Cal.com** (preferred) | RL-302 | Open-source self-hostable booking; Astro-friendly embed. |
| **Resend** (or SendGrid) | RL-303, RL-501 | Transactional email + drip. Pause and ask human before signup. |
| **Stripe** | RL-501 | For Care Plans subscriptions. Pause and ask human. |
| **R2 / S3** | RL-305 | For form photo uploads. Cloudflare R2 is natural fit since hosting is on CF. |

### Repo layout (best guess for Astro — verify in RL-000)

```
src/
  pages/
    en/                    (or [lang]/ if dynamic routing)
    es/
    ca/                    (to be added — RL-201)
  components/
    *.astro                (static components)
    *.tsx or *.jsx         (interactive islands, e.g. Estimator)
  layouts/
  content/                 (Astro Content Collections — preferred for cases/academy)
    cases/
    academy/
  i18n/ or locales/        (translation dictionaries)
  styles/
public/
  images/
  video/
  brands/
astro.config.mjs
tailwind.config.cjs        (if Tailwind)
wrangler.toml              (Cloudflare Pages config — possibly)
functions/                 (Cloudflare edge functions)
```

If reality differs in any way, RL-000 documents the actual structure and all subsequent tickets adjust paths accordingly.

### Astro-specific conventions Claude Code should follow

- Default to `.astro` components for static UI; only use React/Preact/Solid islands when interactivity is needed (e.g. Estimator, Booking embed, Filters on Cases page).
- For islands, prefer `client:visible` over `client:load` — Astro philosophy is ship-less-JS.
- Use **Astro Content Collections** (`src/content/`) for cases and Academy posts — gives type safety + auto-generated pages + works well with `@astrojs/sitemap`.
- Never bypass CookieConsent — any new tracking must respect the consent state.
- For forms, prefer Astro Server Endpoints (`src/pages/api/*.ts`) deployed as Cloudflare Functions over external form services.

---

## 3. Glossary of new entities introduced

| Term | Meaning |
|---|---|
| **Tier** | A pricing package level (Express Refresh, Single-Stage, Two-Stage, Ceramic 2Y, Premium 5Y, Flagship PPF). |
| **Vehicle size multiplier** | Compact/Sedan/SUV/Large SUV/Sports — applied as +/- % on tier base. |
| **SKU** | Standalone bookable service (e.g. Headlight Restoration). Each SKU has its own page or anchor. |
| **Vertical landing** | A page targeting one customer segment: `/business`, `/yacht`, `/ev`, `/area/<slug>`. |
| **Estimator** | Interactive widget that returns a price band from inputs (no human in the loop). |
| **Care plan** | Subscription product (Essential / Plus / Pro). |

---

## 4. Phases overview

| Phase | Goal | Tickets | Estimated sessions |
|---|---|---|---|
| **Phase 0** | Audit & baseline | RL-000 | 1 |
| **Phase 1** | Pricing, hero, trust signals (quick wins) | RL-101 → RL-108 | 3–5 |
| **Phase 2** | Catalan locale + geo landing pages + Cloudflare/Collections plumbing | RL-201 → RL-207 | 4–5 |
| **Phase 3** | Conversion mechanics (estimator, booking, lead capture) | RL-301 → RL-305 | 4–6 |
| **Phase 4** | Vertical landings (B2B, EV, Yacht, Commercial Glass) | RL-401 → RL-404 | 3–5 |
| **Phase 5** | Subscriptions, performance, GTM events, A/B testing, content pipeline | RL-501 → RL-505 | 4–6 |

Total: ~27 tickets, ~19–28 sessions.

---

# PHASE 0 — Audit

## ☐ RL-000 — Codebase audit & baseline report

**Why:** Stack is Astro on Cloudflare Pages (confirmed). RL-000 verifies the *details* — especially i18n approach, content storage, and where pricing/hero copy lives — because all downstream tickets depend on these specifics.

**Acceptance criteria:**
- [ ] Produce `docs/AUDIT.md` documenting:
  - Astro version (from `package.json`).
  - i18n approach: native Astro 4.x i18n? `astro-i18next`? hand-rolled `/en/` `/es/` folders? (look at `astro.config.mjs` + `src/pages/` structure).
  - Cloudflare edge function source (`functions/_middleware.ts` or similar) — needs update for `/ca/` in RL-201 + RL-206.
  - Tailwind config (yes/no, custom tokens, custom plugins).
  - Components inventory: `.astro` count vs island count (`.tsx`/`.jsx`/`.vue`).
  - Whether Astro Content Collections (`src/content/`) are used for cases/academy. If not, flag for migration in RL-107.
  - Build + deploy commands from `package.json` and `wrangler.toml`.
  - Form handling: do forms post to a Cloudflare Function endpoint, to a 3rd-party (Formspree/Basin), or only to WhatsApp deeplinks? List endpoints.
  - Image handling: `astro:assets`? raw `<img>`? Are images in `public/` or `src/assets/`?
  - List all third-party scripts loaded (we know GTM, Clarity, Meta Pixel, CookieConsent — confirm load order and that they're behind consent).
  - Where the GTM container ID lives (env var, hardcoded, layout file).
  - Verify hreflang tags on existing EN/ES pages (probably need fix in RL-201).
- [ ] Map current pages to file paths in a table (Page name → URL → file path).
- [ ] Identify locations where pricing values are hardcoded (we need these for RL-101). Output as a table: `Tier name | Price | File | Line`.
- [ ] Identify hero copy locations across home + service pages (we need these for RL-103). Output as a table.
- [ ] Confirm `npm run build` (or equivalent) produces a clean build.
- [ ] Confirm `npx wrangler pages dev` (or `npm run dev`) works locally.
- [ ] No code changes in this ticket.

---

# PHASE 1 — Pricing, hero, trust signals

> Goal: stop bleeding margin and reposition as premium. No new pages yet. All changes are copy/data/component-level.

## ☐ RL-101 — New pricing matrix (auto)

**Why:** Current pricing is below Catalonia market by 25–46% on key tiers. Local competitors (Kramex, Car Cosmetic Gyeon-authorized, The Car Spa) price multi-stage + ceramic at €600–1000.

**Scope:**
- Replace existing tiers with new 6-tier structure (see table below).
- Show vehicle size multipliers explicitly on the pricing page.
- Update price references in FAQ, services pages, and hero anchor copy.

**New tier table (sedan baseline):**

| Tier slug | Display name | Price (EUR) | Time | Includes |
|---|---|---|---|---|
| `express-refresh` | Express Refresh | 149 | 2h | Decon wash + clay bar + light hand polish + sealant |
| `single-stage` | Single-Stage Correction | 289 | 3–4h | 1-step machine polish + decon + 6m sealant |
| `two-stage` | Two-Stage Correction | 549 | 5–7h | Full 2-step correction, no ceramic |
| `ceramic-2y` | Ceramic Coating 2Y | 649 | 6–8h | Two-stage + 2-year ceramic (Gyeon/Gtechniq) |
| `premium-5y` | Premium Ceramic 5Y | 1049 | 8–10h | Multi-stage + 5y graphene ceramic + windshield + wheels |
| `flagship-ppf` | Flagship PPF + Ceramic | from 2290 | 1.5–2 days | PPF on impact zones + 5y ceramic |

**Size multipliers (display as a small table on pricing page):**
- Compact (Polo, Yaris): −10%
- Sedan: baseline
- SUV / Crossover (X3, GLC, Q5): +20%
- Large SUV / 7-seater (X7, GLE, Q7, Cayenne): +35%
- Sports / Supercar: +25–40%
- Sensitive paint (jet black, Audi Brilliant Black, Porsche Carrara White): +€60–100

**Acceptance criteria:**
- [ ] All 6 tiers visible on `/pricing` (EN/ES).
- [ ] "Most Popular" badge moved to `ceramic-2y`.
- [ ] Size multiplier table rendered.
- [ ] Old tier names ("Base Correction", "Ceramic Prep", "Premium Ceramic") replaced everywhere (search & replace check).
- [ ] WhatsApp deeplinks updated with new tier names.
- [ ] All existing pricing copy in FAQ updated to new amounts.
- [ ] Build passes; visual diff via screenshot.

**Files likely touched:** `src/pages/[en|es|ca]/pricing.astro`, `src/components/PricingTable.astro`, `src/i18n/en.json`, `src/i18n/es.json`, `src/components/FAQ.astro`.

---

## ☐ RL-102 — New SKUs (Headlight, Glass packs, Trim, Wheel ceramic, Pre-sale pack)

**Why:** Current site has 3 categories. We're missing 6+ standalone SKUs that are high-conversion or strong upsells.

**SKUs to add:**

| SKU | Price | Anchor link | Page treatment |
|---|---|---|---|
| Headlight Restoration | €79 / pair (€119 with UV sealant) | `/services/headlight-restoration` | Full landing |
| Plastic Trim Restoration | €69 element / €189 full | `/services/trim-restoration` | Anchor on services page |
| Wheel Ceramic Coating | €189 (4 wheels) | `/services/wheel-ceramic` | Anchor on services page |
| Engine Bay Detailing | €119 | `/services/engine-bay` | Anchor on services page |
| Interior Leather Refresh | €189 / €289 with ceramic | `/services/interior-leather` | Full landing |
| Pre-Sale Detail Pack | €249 | `/services/pre-sale-pack` | Full landing (B2C resellers) |
| Windshield Polish | €119 | (anchor in glass page) | — |
| Windshield + Hydrophobic | €179 | (anchor in glass page) | — |
| Full Glass Set | €289 | (anchor in glass page) | — |
| Glass Hydrophobic stand-alone | €89 / €159 | (anchor in glass page) | — |

**Acceptance criteria:**
- [ ] Each "full landing" SKU has its own page following the same structure as existing services (hero, what's included, FAQ, CTA).
- [ ] Anchor SKUs are added to `/services` index with cards.
- [ ] Each SKU has unique WhatsApp deeplink with the SKU name preselected.
- [ ] Each SKU has fields in i18n dictionaries (EN/ES).
- [ ] Sitemap regenerated; new URLs included.

**Files likely touched:** `src/pages/[en|es|ca]/services/`, `src/components/ServiceCard.astro`, `src/i18n/*.json`, `astro.config.mjs` (sitemap auto-regenerates via `@astrojs/sitemap`).

---

## ☐ RL-103 — Hero rewrite (premium positioning)

**Why:** Current hero "Save up to 70% vs replacement" is a discount anchor — wrong tone for Sant Cugat / Pedralbes / Matadepera audience.

**New hero (EN, primary variant):**
> **Headline:** Factory finish. At your doorstep.
> **Sub:** Premium paint correction & ceramic coating in Sant Cugat, Barcelona and Vallès Occidental — we come to your garage.
> **Primary CTA:** Get a Free Estimate (opens estimator, NOT WhatsApp directly — see RL-301)
> **Secondary CTA:** See Before & After
> **Trust strip:** ★ 5.0 Google · 47+ reviews · 500+ jobs · €500K liability insurance

**ES variant:**
> Acabado de fábrica. En tu garaje.
> Pulido y cerámica premium en Sant Cugat, Barcelona y Vallès Occidental — vamos a ti.

**CA variant (added in RL-201, leave placeholder for now):**
> Acabat de fàbrica. Al teu garatge.

**Hero video:**
- 15–20 sec MP4 loop, autoplay, muted, looped.
- Content: car panel before → polishing process → after with reflection.
- Source file goes in `public/video/hero-loop.mp4`.
- Fallback: poster image at `public/video/hero-poster.jpg`.

**Acceptance criteria:**
- [ ] New copy live on EN + ES home page.
- [ ] Hero video embedded (or poster fallback if video not yet shot — flag to human).
- [ ] "Save 70%" mentions removed from hero (it can stay in body of FAQ where contextually appropriate).
- [ ] Trust strip rendered.
- [ ] Primary CTA opens estimator modal (RL-301 dependency — until then, scrolls to pricing).
- [ ] Lighthouse accessibility ≥ 95.

**Files likely touched:** `src/pages/[en|es|ca]/index.astro`, `src/components/Hero.astro`, `src/i18n/*.json`, `public/video/`.

---

## ☐ RL-104 — Trust signals upgrade

**Why:** Premium clients in Sant Cugat compare you to Kramex (Rupes/Opti-Coat certified) and Car Cosmetic (Gyeon authorized). Generic trust signals aren't enough.

**Components to add:**

1. **"Materials we use" strip** — logos of polish/ceramic/PPF brands actually used. Render below hero. Logos go in `/public/brands/` (request from human if missing).
2. **Insurance badge** — small badge with text "€500K Civil Liability Insurance" + tooltip with policy ID.
3. **Certifications row** — placeholder slots for Gyeon Certified / Gtechniq Approved / IDA / Ceramic Pro. If any not yet held, render as "In progress".
4. **Replace anonymous initials** — testimonials currently use "DM", "SR" — change to full first name + last initial (e.g., "David M." → keep as is) but require photo placeholder. Add prop `photoUrl` to testimonial component; default to letter avatar if missing.
5. **Founder mini-strip** — small strip on home: "Founded in Sant Cugat. Run by [Name]. Trained on [equipment/method]." Links to /about (added in RL-203).

**Acceptance criteria:**
- [ ] Brands strip renders 4–6 logos with grayscale → color on hover.
- [ ] Insurance badge clickable; expands to policy info card.
- [ ] Certifications row renders even if some are placeholder ("Gyeon Certified — Q3 2026").
- [ ] Testimonial component supports `photoUrl` prop.
- [ ] Founder strip links to `/about` route (placeholder OK if /about not yet built).

**Files likely touched:** `src/components/BrandsStrip.astro` (new), `src/components/InsuranceBadge.astro` (new), `src/components/CertificationsRow.astro` (new), `src/components/Testimonial.astro`.

---

## ☐ RL-105 — Schema markup (LocalBusiness, Service, FAQPage)

**Why:** Local SEO. Currently no structured data → losing rich snippets in Google Local Pack.

**Schemas to add:**

1. **LocalBusiness** on home + footer:
   ```json
   {
     "@context": "https://schema.org",
     "@type": "AutomotiveBusiness",
     "name": "restoreLab",
     "image": "https://restorelab.io/og.jpg",
     "address": { "@type": "PostalAddress", "addressLocality": "Sant Cugat del Vallès", "addressRegion": "Catalonia", "postalCode": "08172", "addressCountry": "ES" },
     "areaServed": ["Sant Cugat del Vallès", "Barcelona", "Terrassa", "Sabadell", "Cerdanyola del Vallès", "Rubí", "Matadepera", "Sant Just Desvern", "Castelldefels"],
     "telephone": "+34680265190",
     "url": "https://restorelab.io",
     "priceRange": "€€€",
     "aggregateRating": { "@type": "AggregateRating", "ratingValue": "5.0", "reviewCount": "47" }
   }
   ```
2. **Service** schema for each service page (paint correction, glass, acrylic, headlight, etc.) with `priceRange` and `provider`.
3. **FAQPage** schema on pages that have FAQ (home, pricing, each service).
4. **BreadcrumbList** on all subpages.
5. **Organization** in root layout.

**Acceptance criteria:**
- [ ] All schemas validate on https://validator.schema.org.
- [ ] Google Rich Results Test passes for home, pricing, each service.
- [ ] Schemas live in `<Head>` via JSON-LD `<script type="application/ld+json">`.
- [ ] Reusable component `<JsonLd schema={...} />`.

**Files likely touched:** `src/components/JsonLd.astro` (new), `src/layouts/Layout.astro`, all page files.

---

## ☐ RL-106 — Footer legal info & NIF

**Why:** Premium clients (especially expats from HP/Roche/Boehringer) verify you. Currently footer just says "Made in Spain".

**Add to footer:**
- Legal entity name (e.g., "restoreLab S.L." — confirm with human).
- NIF/CIF number.
- Registered address.
- Insurance policy reference (linked to badge from RL-104).
- Link to terms, privacy, cookie policy.

**Acceptance criteria:**
- [ ] Footer renders legal block on all pages.
- [ ] NIF formatted correctly per Spanish convention (B-XXXXXXXX).
- [ ] If legal entity not finalized, render "(Provisional — pending registration)" — flag to human.

**Files likely touched:** `src/components/Footer.astro`, `src/i18n/*.json`.

---

## ☐ RL-107 — Cases page expansion (target: 15+ cases in 30 days)

**Why:** Currently 5 cases. Premium clients compare to Detailing Barcelona ("cientos de opiniones, 20 años"). 5 cases reads thin.

**Scope:**
- Refactor cases data into structured JSON or MDX with fields: `id`, `title`, `category` (car/glass/acrylic), `vehicleMake`, `vehicleColor`, `serviceTier`, `area` (Sant Cugat / Barcelona / Terrassa / Matadepera / etc.), `savedEur`, `beforeImage`, `afterImage`, `description`, `featured`.
- Add filters: by category (existing), by vehicle make, by area, by tier.
- Component for paint depth measurement photo (small badge).
- Image lazy-loading + blur-up placeholder.

**Acceptance criteria:**
- [ ] Cases data file (JSON/MDX) supports all fields.
- [ ] Filter UI renders and works (no page reload).
- [ ] Each case has stable URL `/cases/<id>` for deep-linking and sharing.
- [ ] Sitemap includes all case URLs.
- [ ] Each case has `Schema.org/Article` JSON-LD.
- [ ] Pagination if >12 cases.
- [ ] Adding a new case = adding one JSON entry + 2 images. Document the process in `docs/ADD_CASE.md`.

**Files likely touched:** `src/pages/[en|es|ca]/cases/`, `src/content/cases/*.md` (Astro Content Collection — preferred), `src/content/config.ts` (collection schema), `src/components/CaseCard.astro`, `src/components/CaseFilter.tsx` (interactive island, `client:visible`).

---

## ☐ RL-108 — Pre-Sale Detail Pack landing (B2C resellers)

**Why:** People selling their car are a distinct segment with strong intent and low price sensitivity (€249 to add €1500–3000 to resale).

**Page content:**
- Hero: "Sell Your Car for €1500–3000 More. Pre-Sale Detail Pack from €249."
- What's included: 1-step polish + headlight restoration + glass clean + interior wipe + tyre dressing + photo report.
- Comparison table: with vs without restoreLab Pre-Sale.
- 3 case studies with sale price uplift (anonymized OK, e.g. "BMW 3 Series 2018 sold +€2200 above pre-correction asking").
- FAQ specific to pre-sale (timing, buyer disclosure, photography for ad).
- CTA: "Get my pre-sale plan" → estimator with `service=pre-sale` preselected.

**Acceptance criteria:**
- [ ] EN + ES versions live at `/services/pre-sale-pack`.
- [ ] Internal links from pricing page and home services grid.
- [ ] Schema.org/Service JSON-LD.

**Files likely touched:** `src/pages/[en|es|ca]/services/pre-sale-pack.astro`, `src/i18n/*.json`.

---

# PHASE 2 — Catalan locale + geo landing pages

## ☐ RL-201 — Catalan locale (`/ca/`) — minimum viable

**Why:** Catalan is a legal requirement for serving Catalan-speaking customers in Catalonia and a strong local trust signal in Sant Cugat.

**Scope:**
- Add `ca` to locales config.
- Create `messages/ca.json` with translations for: home, services index, pricing, contact, footer, FAQ. (Cases and Academy can stay EN/ES initially — flag in human-facing copy.)
- Add CA flag to language switcher.
- Hreflang tags for all multi-locale pages.

**Acceptance criteria:**
- [ ] `/ca/` and `/ca/pricing` and `/ca/services/...` resolve.
- [ ] Hreflang headers/tags valid (verified with https://www.aleydasolis.com/english/international-seo-tools/hreflang-tags-generator/).
- [ ] Language switcher works on every page.
- [ ] Translations reviewed by human (flag for review — Claude Code drafts, founder approves).
- [ ] Cases + Academy fall back gracefully to ES if not yet translated.

**Files likely touched:** `astro.config.mjs` (i18n config), `src/i18n/ca.json` (new), `src/components/LanguageSwitcher.astro`, `functions/_middleware.ts` (Cloudflare edge function — see RL-206).

---

## ☐ RL-202 — Geo landing pages (premium districts)

**Why:** Local SEO + trust. Each premium district has different vibe and search intent.

**Pages to create (in priority order):**

1. `/areas/sant-cugat-del-valles` — already exists, extend.
2. `/areas/matadepera` — wealthiest in Catalonia.
3. `/areas/sant-just-desvern` — #2 Catalonia.
4. `/areas/sant-quirze-del-valles`.
5. `/areas/bellaterra` — UAB campus, executive cluster.
6. `/areas/pedralbes` — wealthiest Barcelona neighborhood.
7. `/areas/sant-gervasi` — Tres Torres / Bonanova.
8. `/areas/castelldefels` — coastal premium.
9. `/areas/alella-tiana-teia` — Maresme premium cluster.

**Each page template includes:**
- Hero: "Mobile paint correction & ceramic coating in [district]. We come to your home."
- Local angle (1 paragraph): why this district matters (briefly), travel time from base.
- 2–3 case studies tagged to this district (pull from cases data via filter).
- Pricing reminder + CTA.
- Local FAQ (parking, access, gated communities, etc.).
- LocalBusiness schema with `areaServed` set to the district.

**Acceptance criteria:**
- [ ] All 9 pages live in EN + ES (CA priority is Sant Cugat, Matadepera, Sant Just, Sant Quirze, Bellaterra).
- [ ] Each page has at least 2 unique paragraphs of district-specific content (no boilerplate).
- [ ] Internal cross-links: each district links to 2 nearby districts.
- [ ] Schema validates.
- [ ] Sitemap updated.

**Files likely touched:** `src/pages/[en|es|ca]/areas/[slug].astro` (dynamic route via `getStaticPaths`), `src/data/areas.json`, `src/i18n/*.json`.

---

## ☐ RL-203 — `/about` page (founder story)

**Why:** Premium mobile service requires high trust. Anonymous brand doesn't sell €1049 ceramic.

**Content (draft from human input):**
- Founder photo + name + Sant Cugat connection.
- Origin: why started restoreLab.
- Training/credentials/years of experience.
- Philosophy: "restore vs replace" → ESG narrative.
- Equipment: machines, brands.
- Local commitment: "based in Sant Cugat, serving Vallès Occidental and Barcelona metro".

**Acceptance criteria:**
- [ ] EN + ES + CA versions live at `/about`.
- [ ] Photo of founder rendered (placeholder if not yet provided — flag).
- [ ] Linked from footer + hero trust strip + every services page.
- [ ] Schema.org/Person JSON-LD.

**Files likely touched:** `src/pages/[en|es|ca]/about.astro`, `src/i18n/*.json`, `public/images/team/`.

---

## ☐ RL-204 — Local SEO content seeds (Academy posts)

**Why:** Long-tail organic traffic. Catalonia-specific intent has low competition.

**Seed posts (5 to start):**

1. "Pulido o pintar: cuándo restaurar la pintura tiene sentido en Barcelona" — ES + CA.
2. "Tesla paint care in the Mediterranean: why soft EV clear coats need ceramic protection" — EN + ES.
3. "Cómo conservar el faro de tu coche: guía 2026 para conductores en Sant Cugat" — ES.
4. "Pre-sale detailing checklist: what dealers and buyers in Catalonia look for" — EN + ES.
5. "Yacht gelcoat care between charters in Port Vell and Port Olímpic" — EN.

**Each post:**
- 800–1500 words.
- One real or anonymized case from `/cases`.
- 3+ internal links to services, pricing, areas.
- Author bio block at bottom (links to /about).
- Article schema.

**Acceptance criteria:**
- [ ] All 5 posts live under `/academy/` for EN + ES (CA only first 2).
- [ ] Updated sitemap.
- [ ] Each post has OG image and meta description.
- [ ] No duplicate content across locales (proper translations, not copy).

**Files likely touched:** `src/content/academy/*.md` (Astro Content Collection), `src/content/config.ts`, `src/pages/[en|es|ca]/academy/[...slug].astro`.

---

## ☐ RL-205 — Google Business Profile sync helper

**Why:** GBP is the single biggest local SEO lever. Need a way to keep website ↔ GBP in sync (services, hours, posts).

**Scope:**
- Document in `docs/GBP_SYNC.md`:
  - Current GBP URL.
  - Services list as it should appear in GBP.
  - Service area polygon (Sant Cugat + 25 km radius).
  - Q&A seed (10 pre-written FAQ entries).
  - Posting cadence (weekly cases, monthly offers).
- Add `og:image` + `og:title` per case page so GBP can pull rich previews when posted.

**Acceptance criteria:**
- [ ] `docs/GBP_SYNC.md` exists and is human-readable.
- [ ] OG metadata present on cases, services, areas.
- [ ] No code automation in this ticket — purely docs + metadata.

---

## ☐ RL-206 — Cloudflare edge function update for `/ca/` locale

**Why:** Existing edge function does geo-redirect `/` → `/es`. After RL-201 adds Catalan, we need:
1. The middleware to know about `/ca/` as a valid locale (not redirect away from it).
2. Optional: smart locale detection — visitors from Catalonia (CF `country === 'ES'` + `region === 'CT'`) could land on `/ca/`, others on `/es/` or `/en/` based on `Accept-Language`.

**Scope:**
- Audit existing edge function (likely in `functions/_middleware.ts` or `functions/[[path]].ts`).
- Update redirect rules:
  - `/` + Catalonia region (`CF-IPCountry=ES` + Cloudflare region header indicates Catalonia) → `/ca/`
  - `/` + rest of Spain → `/es/`
  - `/` + EU non-Spain with `Accept-Language: ca` → `/ca/`
  - `/` + everything else → `/en/`
- Add `/ca/` to allowed locales — never redirect away from it once user lands.
- Set `Vary: Accept-Language, CF-IPCountry` response header so CDN cache stays correct per visitor.
- Honor explicit user choice: if user selected a locale via switcher (cookie `restorelab_locale`), don't override on next visit.

**Acceptance criteria:**
- [ ] `/ca/` is reachable directly without redirect loop.
- [ ] Cookie `restorelab_locale` overrides geo-detection on subsequent visits.
- [ ] Test with Cloudflare Workers preview from 5 IPs (Catalonia, rest of ES, France, US, UK) — document outcomes in PR description.
- [ ] No regression for existing EN/ES traffic.
- [ ] `Vary` header set correctly (verify with `curl -I`).

**Files likely touched:** `functions/_middleware.ts`, `wrangler.toml` (if locale list is configured there), `astro.config.mjs` (i18n config).

**Dependencies:** RL-201 must be merged first.

---

## ☐ RL-207 — Migrate cases + academy to Astro Content Collections

**Why:** Astro Content Collections give type-safe content + auto-generated routes + better DX for non-coders adding content. If RL-000 reveals cases/academy are currently inline JSX or static MDX without a collection schema, this ticket migrates them.

**Scope:**
- Define `src/content/config.ts` with two collections:
  ```ts
  // cases collection
  {
    title: string,
    category: 'car' | 'glass' | 'acrylic',
    vehicleMake?: string,
    vehicleColor?: string,
    serviceTier: string,
    area: string,             // 'sant-cugat', 'matadepera', etc.
    savedEur?: number,
    beforeImage: image(),
    afterImage: image(),
    description: string,
    featured: boolean,
    publishedAt: date,
    locale: 'en' | 'es' | 'ca'
  }
  // academy collection
  {
    title: string,
    description: string,
    author: string,
    publishedAt: date,
    updatedAt?: date,
    cover: image(),
    tags: string[],
    locale: 'en' | 'es' | 'ca',
    relatedServices?: string[]
  }
  ```
- Migrate existing 5 case files to the new schema.
- Create `src/pages/[en|es|ca]/cases/[...slug].astro` and `[...]/academy/[...slug].astro` using `getStaticPaths` from collections.
- Generate per-locale RSS feed for academy via `@astrojs/rss`.
- Document the workflow in `docs/PUBLISHING.md` (also referenced in RL-505).

**Acceptance criteria:**
- [ ] `astro check` passes (type-safe content).
- [ ] All 5 existing cases render correctly post-migration (visual regression diff).
- [ ] Adding a new case = creating one `.md` file + 2 images. No code changes needed.
- [ ] Sitemap auto-includes new content.
- [ ] RSS feed available at `/[locale]/academy/rss.xml`.

**Dependencies:** Run RL-000 first; this ticket is only needed if RL-000 reveals cases/academy aren't already on Content Collections.

**Files likely touched:** `src/content/config.ts` (new), `src/content/cases/`, `src/content/academy/`, `src/pages/[en|es|ca]/cases/[...slug].astro`, `src/pages/[en|es|ca]/academy/[...slug].astro`.

---

# PHASE 3 — Conversion mechanics

## ☐ RL-301 — Instant estimator widget

**Why:** WhatsApp-only is a bottleneck and doesn't serve email-first expat clients. Estimator works 24/7.

**UX flow:**
1. Vehicle make + model (autocomplete from a small dataset).
2. Vehicle size (auto-derived from model, manual override).
3. Color sensitivity (white / black / metallic / standard).
4. Current condition (3 photo-cards: Light / Medium / Heavy).
5. Service goal (multi-select: Restore gloss / Add ceramic / Pre-sale / Long-term protection / Glass clarity).
6. Result: price range + recommended tier + ETA + 3 next steps + "Book this" / "Send to WhatsApp" / "Email me the quote" buttons.

**Tech:**
- Client-side React component, no backend in v1.
- Logic table for tier recommendation in `src/lib/estimator.ts`.
- Lead capture: when user picks "Email me", post to backend route → forward to founder's email (use Resend or similar — flag for human if not configured).
- All inputs serialized into the WhatsApp deeplink message for context.

**Acceptance criteria:**
- [ ] Widget reachable from hero CTA and pricing page.
- [ ] Returns price range within ±10% of actual quote 80% of the time (verify with 10 historical jobs from human).
- [ ] Mobile-first, works on iPhone Safari + Android Chrome.
- [ ] Email path captures lead even if user abandons before final step.
- [ ] Logic table covered by unit tests.

**Files likely touched:** `src/components/Estimator/ (React island, client:visible)`, `src/lib/estimator.ts`, `src/pages/api/lead.ts (Astro endpoint → Cloudflare Function)`, `src/data/vehicles.json`.

---

## ☐ RL-302 — Booking calendar (Cal.com or similar)

**Why:** Higher-intent users (B2B and expats) prefer to pick a slot vs. ping WhatsApp.

**Scope:**
- Embed Cal.com (or Calendly) for B2C estimator path's "Book this" button.
- 30-min consultation slot type for new clients.
- Travel-buffer logic: each booking blocks ±60 min based on location.
- Different event types: Estimate Visit (free, 30 min), Detail Booking (paid deposit, 4–10h).
- Auto-send pre-meeting checklist email.

**Acceptance criteria:**
- [ ] Cal.com account created (flag for human).
- [ ] Embed working on `/booking` page.
- [ ] At least 2 event types configured.
- [ ] Confirmation email sent in EN/ES based on user choice.
- [ ] Calendar synced to founder's Google Calendar.

**Files likely touched:** `src/pages/[en|es|ca]/booking.astro`, `src/components/CalendarEmbed.astro (Cal.com embed)`.

---

## ☐ RL-303 — Email lead magnet (PDF guide)

**Why:** Email-first capture for users who aren't ready to WhatsApp.

**Scope:**
- Lead magnet: PDF "Should I correct or repaint? 5 photos that decide" (EN/ES).
- Form: name + email → send PDF via Resend.
- Sequence: Day 0 PDF, Day 3 case study, Day 7 limited-time offer (€50 off first service).
- Drip stored in `/data/email-sequences/lead-magnet.json`.

**Acceptance criteria:**
- [ ] PDF designed (placeholder OK for v1 — flag human for design).
- [ ] Form on home + cases + pricing pages.
- [ ] Resend API integrated with proper FROM and DKIM (flag human for DNS).
- [ ] Drip emails go out on schedule.
- [ ] Unsubscribe link works.
- [ ] GDPR-compliant: explicit opt-in checkbox.

**Files likely touched:** `src/components/LeadMagnet.tsx (interactive island)`, `src/pages/api/lead-magnet.ts`, `src/lib/email/`.

---

## ☐ RL-304 — Referral mechanic

**Why:** Premium suburbs are word-of-mouth heavy. Sant Cugat school groups, padel clubs, neighbor chats.

**Scope:**
- Each client gets a unique referral code (auto-generated post-job).
- Code yields €60 off for both referrer and referred client.
- Tracked in lightweight DB (Postgres or Supabase — flag human if not set up; v1 can be a Google Sheet via API).
- Landing page `/refer` explains program in 3 lines.
- Email template after job completion includes the code.

**Acceptance criteria:**
- [ ] Referral codes generated and trackable.
- [ ] `/refer` page live in EN + ES + CA.
- [ ] WhatsApp share template includes code: "Hey, I just had my car detailed by restoreLab. Use my code [CODE] for €60 off — [link]".
- [ ] Discount auto-applied at booking when code is entered.

**Files likely touched:** `src/pages/[en|es|ca]/refer.astro`, `src/lib/referrals.ts`, `src/pages/api/referral/`.

---

## ☐ RL-305 — Form upgrades (multi-channel, photo upload)

**Why:** Existing forms send to WhatsApp only. Need email + photo upload native to the form.

**Scope:**
- Existing form on services + cases + pricing pages: add photo upload field (max 4 images, 5MB each).
- Add "Preferred channel" radio: WhatsApp / Email / Phone / Calendar booking.
- Auto-route based on choice.
- Server-side: photos saved to S3 (or Cloudflare R2 — flag human for bucket).
- Founder receives single notification with photos attached.

**Acceptance criteria:**
- [ ] Photo upload works on mobile and desktop.
- [ ] Image compression client-side before upload (target <500 KB each).
- [ ] All 4 channels work.
- [ ] Notification email contains photos + form data + recommended tier (using estimator logic).
- [ ] Form submission tracked in analytics (event name `lead_submitted`).

**Files likely touched:** `src/components/EstimateForm.tsx (interactive island)`, `src/pages/api/lead.ts (Astro endpoint → Cloudflare Function)`, S3 client.

---

# PHASE 4 — Vertical landings

## ☐ RL-401 — `/business` landing (B2B dealers + fleet)

**Why:** Primary B2B opportunity in 5–25km radius (QUADIS Mercedes/BMW Sant Cugat, Barcelona Premium, Cars Barcelona). Quick win per deep research.

**Page content:**
- Hero: "Mobile pre-sale detailing for Barcelona dealers. We come to your lot."
- Value props: turnaround ≤24h, photo report, NET-30 invoicing, single monthly bill.
- Pricing table (B2B): Standard €169 / SUV €229 / Sports €299 with volume discounts (5+/wk −10%, 10+/wk −15%, 20+/wk custom).
- Logos placeholder for "Trusted by" section (fill as deals close).
- "Book a 15-min call" CTA → Cal.com B2B event type.
- B2B-specific FAQ (insurance, liability, KPIs, on-site requirements).

**Acceptance criteria:**
- [ ] EN + ES versions at `/business`.
- [ ] Distinct CTA from B2C pages.
- [ ] B2B form fields: Company name, Role, Volume estimate, Email, Phone.
- [ ] Linked from main nav under "For Business" or footer.

**Files likely touched:** `src/pages/[en|es|ca]/business.astro`, `src/components/B2BPricingTable.astro`, `src/i18n/*.json`.

---

## ☐ RL-402 — `/ev` landing (Tesla / Polestar / Taycan / EV-specific)

**Why:** Catalonia is the #2 EV market in Spain after Madrid; 27.2% of new registrations electrified, above European average.

**Page content:**
- Hero: "EV-specialised paint protection in Barcelona. Sensor-safe ceramic coating for Tesla, Polestar, Taycan and more."
- EV-specific pain points: soft clear coat, sensor safety, no-touch wash compatibility, Mediterranean UV.
- 3 EV-specific packages:
  - EV New-Car Protection — €749
  - EV Premium Shield — €1290
  - Tesla / Polestar PPF Front-End — from €1690
- Compatibility table: brand → recommended package.
- Customer logos (anonymized OK for now).
- EV-specific FAQ: charging port care, sensor calibration, Autopilot/FSD compatibility.

**Acceptance criteria:**
- [ ] EN + ES at `/ev` (or `/electric-vehicle-detailing`).
- [ ] SEO meta tuned for "Tesla ceramic Barcelona", "PPF Polestar Sant Cugat", "coating Taycan España".
- [ ] At least 1 EV case study on the page.

**Files likely touched:** `src/pages/[en|es|ca]/ev.astro`, `src/i18n/*.json`.

---

## ☐ RL-403 — `/yacht` landing (marine vertical)

**Why:** Barcelona is a Mediterranean superyacht hub: Marina Port Vell (190m yachts), Port Olímpic (740 berths), Port Fòrum (241), Marina Vela. America's Cup 2024 was here.

**Page content:**
- Hero: "Mobile gelcoat & surface restoration for yachts in Port Vell, Port Olímpic and Vilanova."
- Services: gelcoat polishing, hull oxidation removal, ceramic for boats, acrylic windows, stainless steel polishing.
- Pricing per-foot:
  - Gelcoat polishing: €19/ft (≤40ft), €25/ft (40–60ft), custom (60ft+).
  - Hull ceramic: €39/ft.
  - Acrylic windows: €89–149 each.
  - Stainless: €8–15/m².
- Pre-season + post-season packages.
- "Charter-ready in 24h" express service callout.
- Marina coverage map (Port Vell, Port Olímpic, Marina Vela, Port Fòrum, Port Ginesta, Vilanova Grand Marina, Marina Empuriabrava).
- Yacht-specific FAQ (insurance, dock-side power requirements, between-charter timing).

**Acceptance criteria:**
- [ ] EN + ES at `/yacht`.
- [ ] Per-foot calculator (simple: input feet + tier → output price).
- [ ] Map of covered marinas.
- [ ] Distinct CTA: "Schedule a marina visit" → Cal.com B2B event.

**Files likely touched:** `src/pages/[en|es|ca]/yacht.astro`, `src/components/YachtCalculator.tsx (interactive island)`, `src/data/marinas.json`.

---

## ☐ RL-404 — `/commercial-glass` landing (B2B real estate)

**Why:** Office towers (22@), Passeig de Gràcia retail, restaurant storefronts. Replacing one storefront window = €1500+; restoring scratches = €280–600.

**Page content:**
- Hero: "After-hours mobile glass restoration. No business interruption."
- Use cases: retail storefronts, office facades, restaurant windows, hotel lobbies.
- Pricing: per-incident from €280, per-m² from €45, retainer plans for facility management.
- ROI calculator: replacement vs restoration.
- Targeted at: facility managers, retail operations, hospitality F&B.
- B2B form with "Property type" + "Number of locations".

**Acceptance criteria:**
- [ ] EN + ES at `/commercial-glass`.
- [ ] B2B form routes to dedicated email.
- [ ] At least 1 commercial glass case study (or "Pilot project" placeholder if none yet).

**Files likely touched:** `src/pages/[en|es|ca]/commercial-glass.astro`, `src/i18n/*.json`.

---

# PHASE 5 — Subscriptions, advanced SEO, performance

## ☐ RL-501 — Care plans (subscription product)

**Why:** Premium clients want ongoing care; subscriptions are anti-disintermediation and LTV-multiplying.

**Tiers (sedan baseline; size multipliers apply):**

| Plan | Monthly | Annual | What's included |
|---|---|---|---|
| Care Essential | €39 | €399 | 1× light maintenance polish/year + 50% off headlights/glass hydrophobic |
| Care Plus | €69 | €699 | 2× maintenance details + ceramic top-up + priority booking + 1 emergency stain removal |
| Care Pro | €119 | €1199 | All of above + annual ceramic refresh + interior protection + 2× show-ready details |

**Tech:**
- Stripe subscriptions (flag human for account).
- Customer portal: self-serve cancellation, plan changes, schedule.
- Welcome email with onboarding checklist.

**Acceptance criteria:**
- [ ] `/plans` page live in EN + ES + CA.
- [ ] Stripe Checkout integrated for all 3 tiers + monthly/annual toggle.
- [ ] Webhook listener stores subscription status in DB.
- [ ] Customer portal accessible at `/account`.
- [ ] Cancellation flow: keep cancellation reason for analytics.
- [ ] First booking after subscribing auto-applies plan benefits.

**Files likely touched:** `src/pages/[en|es|ca]/plans.astro`, `src/pages/[en|es|ca]/account/`, `src/pages/api/stripe/`, `src/lib/subscriptions.ts`.

---

## ☐ RL-502 — Performance optimization

**Why:** Google Ads CPL premium scales with landing page Quality Score. Slow site = doubled CPC. Astro is already fast by default + `astro-critters` handles critical CSS, so this ticket fine-tunes rather than rebuilds.

**Scope:**
- Audit Lighthouse on home, pricing, cases, services pages, all new vertical landings (`/business`, `/ev`, `/yacht`).
- Targets: LCP <2.0s, CLS <0.1, INP <200ms on 4G mobile.
- Use **`astro:assets`** (`<Image>` from `astro:assets`) for all images instead of raw `<img>` — gives automatic WebP/AVIF + responsive sizing.
- Audit existing GTM/Clarity/Meta Pixel load order — they should be loaded with `defer` and only after CookieConsent grants permission. Move from `Layout.astro` to a dedicated `<Analytics>` Astro component if not already isolated.
- Verify `astro-critters` is producing minimal critical CSS (check inline CSS size in compiled HTML; should be <14KB).
- Audit interactive islands: each `client:load` is JS shipped to user. Ensure most use `client:visible` or `client:idle` instead.
- Hero video: ensure poster image loads before video; lazy-load non-hero video on `<video preload="none">`.
- Preconnect/dns-prefetch to: cal.com (booking embed), Cloudflare R2 (image CDN), googletagmanager.com.
- Cloudflare-specific: enable "Auto Minify" + "Brotli" + "Early Hints" in CF Pages settings. Verify "Cache Everything" page rules are correct.

**Acceptance criteria:**
- [ ] All target pages score ≥95 on Lighthouse Performance, ≥95 Accessibility, ≥95 SEO, ≥95 Best Practices on mobile (Astro should easily hit this).
- [ ] Total JS shipped to home page <30KB (excluding GTM/Clarity which load post-consent).
- [ ] All images use `<Image>` from `astro:assets`.
- [ ] No `client:load` islands unless absolutely necessary; document each justification.
- [ ] Cloudflare Pages Web Analytics enabled (already free with CF Pages — confirm and use as RUM source).
- [ ] Document baseline + after metrics in `docs/PERF.md`.

**Files likely touched:** all page components (image refactor), `src/components/Analytics.astro` (new, isolates 3rd-party scripts), `astro.config.mjs` (compress/asset config), Cloudflare Pages dashboard (out of repo — note in PR).

---

## ☐ RL-503 — Funnel events through GTM (Clarity + Meta + GA4)

**Why:** GTM, Microsoft Clarity, and Meta Pixel are already wired — but without conversion events fired into them, they're collecting drive-by traffic only. We need a single dataLayer event taxonomy that all three tools consume.

**Scope:**
- Define dataLayer event taxonomy (single source of truth in `src/lib/analytics.ts`):
  ```ts
  type RestoreLabEvent =
    | { event: 'estimator_started', service?: string }
    | { event: 'estimator_completed', tier: string, priceBand: string }
    | { event: 'lead_submitted', channel: 'whatsapp' | 'email' | 'phone' | 'calendar', service?: string }
    | { event: 'pricing_tier_clicked', tier: string, locale: 'en' | 'es' | 'ca' }
    | { event: 'case_viewed', caseId: string }
    | { event: 'service_viewed', service: string }
    | { event: 'cta_clicked', ctaId: string, location: string }
    | { event: 'language_switched', from: string, to: string }
    | { event: 'subscription_started', plan: string }
    | { event: 'subscription_completed', plan: string, billing: 'monthly' | 'annual' }
  ```
- Wrapper `pushEvent(payload)` checks CookieConsent state before pushing — respects GDPR.
- In GTM, configure tags to relay to:
  - GA4 (if a GA4 property is configured — confirm with human; otherwise add).
  - Microsoft Clarity custom events.
  - Meta Pixel custom events.
- UTM parameter capture: capture on landing, store in `sessionStorage`, attach to `lead_submitted` payload.
- Conversion funnel definition (document, not code): home → service → estimator → booking → confirmed. Map each step to an event above.

**Acceptance criteria:**
- [ ] `src/lib/analytics.ts` exists with `pushEvent` wrapper + types.
- [ ] All key flows (estimator, lead form, language switch, subscription) call `pushEvent`.
- [ ] Events visible in GTM Preview mode (verify all 9 events fire correctly).
- [ ] Events visible in Microsoft Clarity custom events tab.
- [ ] Events visible in Meta Events Manager (Test Events).
- [ ] GA4 setup: if missing, configure via GTM (do not add a separate gtag) — flag human if GA4 property doesn't exist yet.
- [ ] Wrapper respects CookieConsent: no events fire if user denied analytics consent.
- [ ] No PII in events (email hashed via SHA-256 if needed, names never tracked).
- [ ] Document the taxonomy in `docs/ANALYTICS.md` with examples.

**Files likely touched:** `src/lib/analytics.ts` (new), all components that trigger conversions, `src/layouts/Layout.astro` (CookieConsent check helper).

**NOTE:** Do not install Plausible / PostHog / additional analytics tools. The current stack (GTM + Clarity + Meta) is sufficient. Adding more increases page weight and consent complexity.

---

## ☐ RL-504 — A/B testing setup (hero, pricing, CTA)

**Why:** Hero variants in §3 need to be tested, not assumed.

**Scope:**
- Lightweight A/B framework: **Cloudflare Workers KV** (already on CF Pages — natural fit) for variant assignment via cookie, or **GrowthBook** self-hosted on CF Workers. Flag human if neither preferred.
- Tests to run:
  1. Hero copy: "Factory finish at your doorstep" vs "Restore. Don't Replace." vs "500+ cars restored locally".
  2. Pricing display: price band ("from €289") vs fixed for sedan vs all sizes shown upfront.
  3. Primary CTA: "Get Free Estimate" vs "Book a Detail" vs "Send Photos via WhatsApp".
- Each test runs ≥2 weeks or until 95% confidence on conversion to lead.

**Acceptance criteria:**
- [ ] Framework integrated.
- [ ] First 3 tests configured.
- [ ] Results dashboard.
- [ ] Document each test outcome in `docs/AB_TESTS.md`.

---

## ☐ RL-505 — Content production pipeline (cases + posts)

**Why:** Cases and posts need to ship continuously; the bottleneck is process, not creativity.

**Scope:**
- Create `docs/PUBLISHING.md` describing:
  - Add a case: 3 steps (photos → JSON entry → publish).
  - Add an Academy post: template + checklist.
  - Localization workflow.
  - Image processing (sizes, formats, naming).
- CLI helper `npm run new:case` that scaffolds a case folder from template.
- CLI helper `npm run new:post` that scaffolds an Academy post.

**Acceptance criteria:**
- [ ] Both CLI scripts work.
- [ ] Documentation tested by the founder publishing 1 new case end-to-end without help.
- [ ] Image pipeline: dragging a HEIC/PNG/JPG into a folder runs through compression + WebP conversion automatically.

---

# Appendix A — Backlog (not in any sprint yet)

These are flagged for later. Add to a sprint when prerequisites are clear.

- **RL-601** — Mobile app (iOS/Android) — only after subscription product proves traction.
- **RL-602** — Marketplace mode (multi-provider, take rate, certification levels) — only after first external partner master joins.
- **RL-603** — Multi-city expansion (Madrid, Valencia, Costa Brava) — depends on certified provider pipeline.
- **RL-604** — Loyalty program (points / tiers) — depends on subscription baseline.
- **RL-605** — White-label B2B portal (dealer-branded service) — depends on B2B traction.
- **RL-606** — TikTok / Reels content automation — needs content team.

---

# Appendix B — Sources for copy and pricing decisions

This work plan is based on a market analysis covering:
- Sant Cugat / Catalonia wealth concentration (top-5 Spain by per-capita income).
- Catalonia automotive market (#2 in Spain, 24%+ EV share in 2025).
- Barcelona marina infrastructure (Port Vell superyacht hub, America's Cup 2024).
- Local detailing competitor pricing (Kramex Rupes/Opti-Coat-certified, Car Cosmetic Gyeon-authorized, The Car Spa, DetailingSpain, Detailing Barcelona).
- EU Right to Repair Directive (effective national law 31 July 2026).

Detailed sources available in `docs/MARKET_RESEARCH.md` (paste deep research report there as a separate ticket if needed).

---

# Appendix C — Master prompt template for Claude Code

When starting a new ticket session, use:

```
I'm working on the restoreLab website. The work plan is in WORK_PLAN.md.

Today I want to work on TICKET RL-XXX.

Constraints:
- Read RL-XXX in WORK_PLAN.md fully before proposing changes.
- Run any prerequisite tickets first if not yet done (check checkboxes).
- If the ticket touches i18n, update all 3 locales (en, es, ca).
- Before writing code, propose your plan and which files you'll touch.
- After implementing, run the build, run any tests, and show me the diff.
- Update the ticket checkbox in WORK_PLAN.md and add a "Done notes" line.

Begin.
```

For audit/discovery sessions:

```
Run TICKET RL-000 from WORK_PLAN.md. Produce docs/AUDIT.md per the
acceptance criteria. Do not modify any application code.
```

---

*End of Work Plan v1.0 — update this document as decisions are made and tickets close.*
