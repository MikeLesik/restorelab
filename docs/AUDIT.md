# RL-000 — Codebase Audit & Baseline Report

> Date: 2026-04-28 | Astro 4.16.18 | 49 pages | restorelab.io

---

## 1. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Astro (SSG, `output: 'static'`) | 4.16.18 |
| Styling | TailwindCSS + CSS custom properties | 3.4.17 |
| TypeScript | Strict mode, alias `@/*` → `src/*` | 5.7.3 |
| Fonts | DM Sans (body) + Space Grotesk (headings) | @fontsource-variable |
| Critical CSS | astro-critters | 2.2.1 |
| Sitemap | @astrojs/sitemap | 3.2.1 |
| Deploy | Cloudflare Pages (auto-deploy on push to `main`) | — |
| Domain | restorelab.io | — |

## 2. i18n Approach

**Hand-rolled `[lang]` dynamic routing** — NOT Astro native i18n, NOT astro-i18next.

- 2 languages: `en`, `es` (Spanish is default)
- Content in `src/content/en.json` (62 KB) and `src/content/es.json` (67 KB)
- Plain JSON imports, NOT Astro Content Collections
- Every route: `src/pages/[lang]/...` with `getStaticPaths()` returning `[{params:{lang:'en'},props:{t:en}}, {params:{lang:'es'},props:{t:es}}]`
- All components receive `t` (translations object) and `lang` as props
- Root `/` redirect: Cloudflare edge function (`functions/index.ts`) → checks `preferred_lang` cookie → falls back to `CF-IPCountry` geo → defaults to `/es`
- Backup redirect: `public/_redirects` (`/ /es 302`) + client-side fallback in `src/pages/index.astro`

**Impact for RL-201 (Catalan):** Adding `/ca/` requires:
1. New `src/content/ca.json`
2. Update all `getStaticPaths()` to include `{lang:'ca', t:ca}`
3. Update `functions/index.ts` for Catalonia geo-detection
4. Update hreflang tags in BaseLayout
5. Update language switcher in Header

## 3. Cloudflare Edge Function

**File:** `functions/index.ts` — `onRequestGet` handler for `/` only.

Logic:
1. Check `preferred_lang` cookie → redirect to `/{lang}`
2. Read `CF-IPCountry` header
3. 20 Spanish-speaking countries → `/es`, rest → `/en`
4. No support for `/ca/` yet

## 4. Components Inventory

**16 `.astro` components, 0 interactive islands (no .tsx/.jsx/.vue)**

| Component | Lines | Purpose |
|-----------|-------|---------|
| Calculator.astro | 475 | Price calculator (client-side DOM, no framework) |
| Header.astro | 310 | Nav, language switcher, mobile menu, theme toggle |
| CasesGallery.astro | 263 | Before/after gallery on /cases page |
| BeforeAfterCarousel.astro | 257 | Homepage before/after slider |
| Testimonials.astro | 205 | Social proof with Review schema |
| LeadForm.astro | 169 | Form → WhatsApp redirect |
| ServicesGrid.astro | 145 | Service cards grid |
| PricingCards.astro | 142 | Pricing tiers (filtered by categoryId) |
| FAQ.astro | 120 | Accordion + FAQPage schema (10 items) |
| Footer.astro | 112 | Footer with GBP link |
| AreaServedSection.astro | 104 | Service areas display |
| Hero.astro | 95 | Homepage hero with trust pills |
| HowItWorks.astro | 60 | 4-step process |
| PreFooterCTA.astro | 57 | CTA section above footer |
| StickyCTA.astro | 42 | Mobile sticky WhatsApp button |
| GuaranteeBlock.astro | 38 | Guarantees section |

## 5. Content Storage

**NOT using Astro Content Collections.** No `src/content/config.ts`.

All content in 2 JSON files with these top-level keys:
`lang`, `meta`, `nav`, `hero`, `social_proof`, `services`, `how_it_works`, `pricing`, `faq`, `guarantee`, `lead_form`, `footer`, `cases_gallery`, `cases_section`, `calculator`, `prefooter_cta`, `wa_messages`, `academy`, `academy_articles`, `area_pages`

Academy articles: dynamic `[slug].astro`, slug → JSON key via `slug.replace(/-/g, '_')`.

## 6. Page-to-File Mapping

| URL | File |
|-----|------|
| `/{lang}` | `src/pages/[lang]/index.astro` |
| `/{lang}/pricing` | `src/pages/[lang]/pricing.astro` |
| `/{lang}/cases` | `src/pages/[lang]/cases.astro` |
| `/{lang}/contact` | `src/pages/[lang]/contact.astro` |
| `/{lang}/privacy` | `src/pages/[lang]/privacy.astro` |
| `/{lang}/terms` | `src/pages/[lang]/terms.astro` |
| `/{lang}/academy` | `src/pages/[lang]/academy.astro` |
| `/{lang}/academy/{slug}` | `src/pages/[lang]/academy/[slug].astro` |
| `/{lang}/areas/{city}` | `src/pages/[lang]/areas/[city].astro` |
| `/{lang}/services` | `src/pages/[lang]/services/index.astro` |
| `/{lang}/services/car-paint-correction` | `src/pages/[lang]/services/car-paint-correction.astro` |
| `/{lang}/services/glass-polishing` | `src/pages/[lang]/services/glass-polishing.astro` |
| `/{lang}/services/acrylic-restoration` | `src/pages/[lang]/services/acrylic-restoration.astro` |
| `/` | `src/pages/index.astro` (redirect fallback) |

**Build output:** 49 static HTML pages (2 langs × 13 routes + 10 academy articles × 2 + 3 cities × 2 + root redirect)

## 7. Pricing Locations

| Value | Context | File | Key path |
|-------|---------|------|----------|
| 189 | Base Correction package | `src/content/{en,es}.json` | `pricing.categories[0].packages[0].price` |
| 339 | Ceramic Prep package | `src/content/{en,es}.json` | `pricing.categories[0].packages[1].price` |
| 459 | Premium Ceramic package | `src/content/{en,es}.json` | `pricing.categories[0].packages[2].price` |
| 189, 339, 459 | FAQ answers (text) | `src/content/{en,es}.json` | `faq.items[0].answer`, `faq.items[3].answer` |
| dynamic | PricingCards Offer schema | `src/components/PricingCards.astro` | Reads from `t.pricing` at build |
| dynamic | Calculator config | `src/lib/calculatorConfig.ts` | `calculate()` function |

**All pricing is in JSON content files** — no hardcoded values in components.

## 8. Hero Copy Locations

| Copy | File | Key path |
|------|------|----------|
| "Restore. Don't Replace." | `src/content/en.json` | `hero.headline` |
| "Restaura. No Reemplaces." | `src/content/es.json` | `hero.headline` |
| "Save up to 70% vs replacement" | `src/content/en.json` | `hero.subheadline` |
| Trust pills (4 items) | `src/content/{en,es}.json` | `hero.trust_pills[]` |
| CTA primary/secondary | `src/content/{en,es}.json` | `hero.cta_primary`, `hero.cta_secondary` |
| Badge text | `src/content/{en,es}.json` | `hero.badge` |
| Sticky CTA label | `src/content/{en,es}.json` | `hero.sticky_cta` |

**Hero component:** `src/components/Hero.astro` — splits H1 on first period, applies gradient to second part.

## 9. Form Handling

**No server-side form processing.** No `src/pages/api/` directory.

LeadForm.astro: client-side `<form>` → constructs WhatsApp message → `window.location.href = 'https://wa.me/...'`

Fields: name, phone, service (select), location, message. Client-side validation only (`required`, `maxlength`).

GTM event `estimate_submit` + Meta Pixel `Lead` fired on submit.

**Note:** LeadForm section is currently hidden site-wide (`hidden` attribute).

## 10. Image Handling

**Raw `<img>` and `<picture>` tags** — NOT using `astro:assets` or `<Image>` component.

- Static images in `public/images/` (cases/, services/, og-home.*)
- WebP + JPG fallback via `<picture><source type="image/webp">` on service pages and carousel
- Attributes: `width`, `height`, `loading="lazy"`, `decoding="async"`
- Case images: 640×477px, WebP q=60 (~27 KB avg)
- Service images: 1200×1200px (large — could be optimized)

## 11. Third-Party Scripts

All behind CookieConsent v3 (GDPR compliant):

| Script | Category | Env var | Load condition |
|--------|----------|---------|---------------|
| GTM | analytics | `PUBLIC_GTM_ID` = `GTM-W34GRX86` | `CookieConsent.acceptedCategory('analytics')` |
| Clarity | analytics | `PUBLIC_CLARITY_ID` = `vmc619bvp9` | Same as GTM |
| Meta Pixel | marketing | `PUBLIC_META_PIXEL_ID` = `1556029059322810` | `CookieConsent.acceptedCategory('marketing')` |
| CookieConsent CSS | necessary | — | Non-blocking (`media="print" onload`) |
| CookieConsent JS | necessary | — | Appended to `<head>` dynamically |

Event delegation: auto-tags `wa.me` links as `wa_click`, `tel:` links as `phone_click`. Pushes to dataLayer for GTM.

## 12. Structured Data (JSON-LD)

| Schema | Location | Pages |
|--------|----------|-------|
| LocalBusiness + AggregateRating | BaseLayout.astro | All pages |
| Service + Offer | Service pages, PricingCards.astro | Service pages, homepage |
| BreadcrumbList | Service pages, academy/[slug], areas/[city] | Subpages |
| FAQPage | FAQ.astro | All pages with FAQ |
| BlogPosting | academy/[slug].astro | Academy articles |
| Review (×3) | Testimonials.astro | Homepage |
| LocalBusiness + Geo | areas/[city].astro | Area pages |

## 13. Environment Variables

```
PUBLIC_WHATSAPP_NUMBER=34680265190
PUBLIC_SITE_URL=https://restorelab.io
PUBLIC_GTM_ID=GTM-W34GRX86
PUBLIC_CLARITY_ID=vmc619bvp9
PUBLIC_META_PIXEL_ID=1556029059322810
```

Centralized in `src/lib/constants.ts`:
```ts
export const WHATSAPP_NUMBER = import.meta.env.PUBLIC_WHATSAPP_NUMBER || '34680265190';
export const SITE_URL = import.meta.env.PUBLIC_SITE_URL || 'https://restorelab.io';
```

## 14. Build Verification

```
$ npm run build
✓ 49 page(s) built in 2.09s
✓ astro check — 0 errors
✓ astro-critters — 48 HTML files inlined (40-57% critical CSS)
✓ sitemap-index.xml generated (66 URLs)
```

`npm run dev` works locally on port 4321.

## 15. Key Decisions for Downstream Tickets

| Decision | Impact |
|----------|--------|
| No Content Collections | RL-207 migration needed before scaling cases/academy |
| No interactive islands | RL-301 (Estimator) will be the first React island |
| No API endpoints | RL-303 (email), RL-305 (photo upload) need Cloudflare Functions |
| No `/ca/` locale | RL-201 requires updating all `getStaticPaths()` + edge function |
| WhatsApp-only forms | RL-305 (multi-channel) is a significant change |
| No `astro:assets` | RL-502 (performance) should migrate images |
| `priceRange: "€€"` in schema | RL-101 (premium pricing) should change to `"€€€"` |

---

*Audit complete. No code changes made. Ready for Phase 1.*
