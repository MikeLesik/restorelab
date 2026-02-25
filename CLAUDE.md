# CLAUDE.md — RestoreLab v2

## Project Overview
RestoreLab (restorelab.io) — premium mobile surface restoration service website.
Business area: Lisbon, Cascais, Sintra, Oeiras, Almada (Portugal).
Primary conversion channel: WhatsApp. Secondary: lead form.

## Tech Stack
- **Framework**: Astro 4 (SSG, `output: 'static'`)
- **Styling**: TailwindCSS 3 + custom design system in `global.css`
- **TypeScript**: strict mode, path alias `@/*` → `src/*`
- **Fonts**: DM Sans (body, `font-sans`) + Space Grotesk (headings, `font-display`) via `@fontsource-variable`
- **Deploy**: Cloudflare Pages (auto-deploy on push to `main`)
- **Domain**: restorelab.io

## i18n Architecture
- 3 languages: EN (default), ES, PT
- Content lives in `src/content/{en,es,pt}.json` — imported as plain JSON (NOT Astro Content Collections)
- All routes: `src/pages/[lang]/...` with `getStaticPaths()` returning `[{params:{lang:'en'},props:{t:en}}, ...]`
- Root `/` redirects to `/en` via `public/_redirects`
- Every component receives `t` (translations object) and `lang` as props
- **Any new user-facing text MUST be added to all 3 JSON files**

## Project Structure
```
src/
  layouts/BaseLayout.astro        — <html>, <head>, SEO, hreflang, JSON-LD, tracking, cookie consent
  pages/
    index.astro                   — root redirect
    [lang]/
      index.astro                 — homepage
      pricing.astro               — pricing page
      cases.astro                 — before/after gallery
      contact.astro               — contact / lead form
      privacy.astro               — privacy policy
      terms.astro                 — terms & conditions
      services/
        index.astro               — services listing
        car-paint-correction.astro
        glass-polishing.astro
        yacht-gelcoat.astro
        acrylic-restoration.astro
  components/
    Header.astro                  — nav, language switcher, mobile menu
    Footer.astro                  — footer with links
    Hero.astro                    — homepage hero
    ServicesGrid.astro            — services cards grid
    HowItWorks.astro              — 3-step process
    PricingCards.astro            — pricing tiers (accepts categoryId prop)
    CasesGallery.astro            — before/after slider gallery
    FAQ.astro                     — accordion FAQ with FAQPage schema
    LeadForm.astro                — form → WhatsApp redirect
    Testimonials.astro            — social proof carousel
    GuaranteeBlock.astro          — guarantees section
    Calculator.astro              — price calculator (disabled on homepage)
    StickyCTA.astro               — mobile sticky WhatsApp button
    PreFooterCTA.astro            — CTA section above footer
    AreaServedSection.astro       — service areas
  lib/
    constants.ts                  — WHATSAPP_NUMBER, SITE_URL (from env vars)
    calculatorConfig.ts           — calculator pricing data
  content/
    en.json, es.json, pt.json    — all translatable content
  styles/
    global.css                    — @fontsource imports, Tailwind layers, utility classes
public/
  _headers                        — Cloudflare security headers (CSP, HSTS, cache)
  _redirects                      — / → /en
  robots.txt                      — sitemap reference
  images/                         — static images
```

## Content JSON Structure
Each `{lang}.json` has these top-level keys:
- `lang` — language code
- `meta` — per-page SEO (title, description) keyed by: `home`, `services`, `car_paint`, `glass`, `acrylic`, `yacht`, `pricing`, `cases`, `contact`, `privacy`, `terms`
- `nav` — navigation labels
- `hero` — homepage hero content
- `social_proof` — rating, testimonials array
- `services` — section title + `items[]` array (each: `id`, `title`, `subtitle`, `icon`, `features[]`, `tag`, `starting_price`, `vs_price`)
- `how_it_works` — steps array
- `pricing` — `categories[]` with `plans[]` inside each
- `faq` — `items[]` array (question/answer pairs)
- `guarantee` — guarantee items
- `lead_form` — form labels and WhatsApp template
- `footer` — footer text and links
- `cases_gallery` — gallery labels and items
- `calculator` — calculator UI strings
- `prefooter_cta` — pre-footer CTA text

## Environment Variables
Defined in `.env`, reference in `.env.example`:
```
PUBLIC_WHATSAPP_NUMBER=351933817788   # digits only, with country code
PUBLIC_SITE_URL=https://restorelab.io
PUBLIC_GTM_ID=GTM-W34GRX86
PUBLIC_CLARITY_ID=vmc619bvp9
PUBLIC_META_PIXEL_ID=812107381591231
```
Access in Astro: `import.meta.env.PUBLIC_*`
Centralized in `src/lib/constants.ts` for WhatsApp number and site URL.

## Design System (Tailwind)
Brand colors defined in `tailwind.config.mjs`:
| Token | Hex | Usage |
|-------|-----|-------|
| `brand-dark` | `#0A0A0A` | page background |
| `brand-navy` | `#0D1B2A` | sections, cards |
| `brand-blue` | `#1B3A5C` | accents, borders |
| `brand-accent` | `#2A7FFF` | primary CTA, links |
| `brand-gold` | `#D4A537` | premium tags |
| `brand-light` | `#F5F5F5` | body text base |
| `brand-white` | `#FFFFFF` | headings |
| `brand-whatsapp` | `#25D366` | WhatsApp buttons |

Gradient: `bg-gradient-hero` = `linear-gradient(135deg, #0A0A0A → #0D1B2A → #1B3A5C)`

Reusable CSS classes in `global.css`: `.btn-primary`, `.btn-secondary`, `.btn-whatsapp`, `.section-title`, `.section-subtitle`, `.card`, `.tag`, `.lead`, `.caption`, `.label`

## Commands
```bash
npm run dev       # dev server
npm run check     # TypeScript check
npm run build     # astro check && astro build (34 pages → dist/)
npm run preview   # preview built site
```

## Build Output
- 34 static pages (3 langs × 10 routes + 4 service subpages)
- Sitemap: `dist/sitemap-index.xml`
- Build must pass with 0 errors and 0 warnings

## SEO & Tracking
- JSON-LD schemas: `LocalBusiness` (BaseLayout), `Service` (each service page), `FAQPage` (FAQ component)
- hreflang: EN/ES/PT + x-default → EN
- OpenGraph + Twitter Card meta on every page
- Tracking loaded after CookieConsent v3: GTM → analytics, Clarity → analytics, Meta Pixel → marketing
- `data-event` attributes on CTA links for GTM event delegation

## Security
- CSP header whitelists: self, jsdelivr (CookieConsent), GTM, Clarity, Meta Pixel
- HSTS with preload
- No `innerHTML` — Calculator uses safe DOM construction (`createElement` + `textContent`)
- Form inputs have `maxlength` validation
- `.env` is gitignored, secrets never committed

## Critical Rules — DO NOT BREAK
1. **Routing**: `/en`, `/es`, `/pt` prefix on all routes — never create routes without `[lang]`
2. **Translations**: any new text → add to ALL 3 JSON files (en, es, pt)
3. **WhatsApp links**: always use `WHATSAPP_NUMBER` from `constants.ts`, never hardcode
4. **Imports**: always use `@/` alias, never relative (`../../`)
5. **Colors**: use `brand-*` tokens from Tailwind theme, never hardcode hex in templates
6. **Accessibility**: `focus-visible:ring-2` on all interactive elements, ARIA attributes on dynamic widgets
7. **Build**: run `npm run build` after changes — must produce 0 errors
8. **GDPR**: all tracking behind CookieConsent — never load GTM/Clarity/Pixel without consent

## Service IDs (used in JSON and route matching)
- `car-paint-correction` → route: `/services/car-paint-correction`
- `glass-polishing` → route: `/services/glass-polishing`
- `yacht-gelcoat` → route: `/services/yacht-gelcoat`
- `acrylic-restoration` → route: `/services/acrylic-restoration`

## Pricing Category IDs (PricingCards `categoryId` prop)
- `car` — car paint correction plans
- `glass` — glass polishing plans
- `yacht` — yacht gelcoat plans
- `acrylic` — acrylic restoration plans

## Git Conventions
- Commit messages in English
- One logical change per commit
- Never commit `.env` or secrets
- Deploy: push to `main` → Cloudflare auto-deploys
