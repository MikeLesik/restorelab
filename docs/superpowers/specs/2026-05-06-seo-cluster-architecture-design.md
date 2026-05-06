# SEO Cluster Architecture + GEO Layer — Design Spec

**Date:** 2026-05-06
**Project:** restorelab.io
**Author:** brainstorming session (owner + Claude)
**Status:** Approved design, pending implementation plan

---

## 1. Problem & Goals

### Current state
- 136 pages built (3 langs × ~40 routes + academy + areas)
- Solid technical SEO base: `LocalBusiness`/`AutomotiveBusiness`/`Service`/`FAQPage`/`BlogPosting` schema, hreflang EN/ES/CA, sitemap, security headers
- 15 academy articles per language, 11 area pages, 9 service pages, 4 vertical landings (`business`, `ev`, `plans`, `commercial-glass`)
- GSC connected, real impressions/positions data accessible (no paid tools budget)
- Brand mentions in trusted external sources: **none confirmed** (besides own site)
- Author bylines: anonymous (E-E-A-T weak point — accepted for now, 3-month trigger to revisit)

### Three intersecting goals (all to be addressed by this design)
- **A — Foundation/Authority**: site appears as topical authority to Google (currently fragmented, 7 of 9 service hubs have 0–1 supporting articles)
- **E — Programmatic scale**: areas × services matrix to multiply indexed surface (without thin-content penalty)
- **D — AI search visibility**: be cited by ChatGPT, Perplexity, Google AI Overviews, Bing Copilot

### Non-goals
- Conversion rate optimization (separate concern, partially covered in `restorelab_action_plan.md`)
- Visual redesign / branding
- Paid tooling investment (Ahrefs, SEMrush etc.)
- Native-copywriter content production (using AI-only with owner expert review per Option 2c — risk accepted with mitigations)

---

## 2. Strategic Approach: Topic Cluster (hub-and-spoke) with GEO baked in

Selected over two alternatives:
- ❌ **Sequential foundation-first** — too slow; GEO becomes "later" while AI search already takes share
- ❌ **AI-first authority bet** — too speculative for a business needing revenue now

✅ **Topic Cluster** — restructures existing content into clusters (services as hubs, articles/areas as spokes), bakes programmatic scale and GEO into the architecture from the start, uses what already exists.

---

## 3. Information Architecture

### Hierarchy (4 tiers)

**Tier 1 — Pillar (1 page):** `/[lang]/index.astro` (homepage)
Theme: "Premium mobile detailing & restoration in Barcelona / Sant Cugat". Center of the web. Links out to all 9 service hubs + 4 vertical hubs.

**Tier 2 — Service Hubs (9 pages):** each `/services/{name}` — own topic hub. Each answers "what is it / who needs it / how we do it / pricing / FAQ" and aggregates its cluster of spokes.

**Tier 3 — Vertical Hubs (4 parallel hubs):** `/business`, `/ev`, `/plans`, `/commercial-glass`. Audience-segment hubs with distinct keyword universes from service hubs. Currently underdeveloped (0–1 spokes each); explicitly Phase 2 priority for spoke buildout.

**Tier 4 — Spokes:**
- 15 academy articles → informational spokes, attached to service hubs
- 11 area pages → local spokes, linking to top services per area
- Programmatic area×service pages (new) → niche specialized spokes

### Spoke-to-hub mapping (current state, with imbalance flagged)

| Service hub | Existing spokes | Gap |
|---|---|---|
| car-paint-correction | 7 | overweight (40% of all academy) |
| acrylic-restoration | 1 | thin |
| glass-polishing | 1 | thin |
| headlight-restoration | 1 | thin |
| pre-sale-pack | 1 | thin |
| ev (vertical) | 1 | thin |
| trim, wheel-ceramic, engine-bay, interior-leather | **0** | empty |
| Mediterranean climate / Protection / Motorcycle | 3 floating (no hub) | needs reclassification |

### URL structure changes
- **No breaking changes** to existing routes (`/services/{name}`, `/academy/{slug}`, `/areas/{city}`)
- **New URL pattern**: `/[lang]/areas/{city}/{service}` for programmatic pages
- **Hidden**: `motorcycle_detailing` academy article (no matching service → thin signal removal)

### Link-equity topology

```
homepage (pillar)
  ├─ service hubs ×9 ── academy spokes (rebalanced)
  │                  ├── area pages ×11
  │                  └── programmatic area×service pages
  └─ vertical hubs ×4 ── their spokes (Tesla guide → /ev, etc.)
```

Spoke linking rule: each spoke → its hub + 2–3 sibling spokes within same cluster. Cross-cluster links only when contextually justified.

---

## 4. Content Refactor & Gap Filling

### Reclassification of floating articles
- `mediterranean_climate_car_paint_protection` → `car-paint-correction` cluster (protection sub-topic)
- `protection_preservation` → `car-paint-correction` cluster (protection sub-topic)
- `motorcycle_detailing` → **hidden** (no matching service)

### Article gap filling (target: ≥3 spokes per service hub)

| Service hub | Existing | New articles needed | Topics |
|---|---|---|---|
| car-paint-correction | 7 ✅ | 0 | overweight; reclass 3 internal as "process" sub-cluster |
| glass-polishing | 1 | +2 | "Water stain removal car windows", "Glass polishing vs replacement: cost comparison" |
| headlight-restoration | 1 | +2 | "Yellow vs cloudy headlights: causes & lifespan", "Headlight restoration vs replacement Barcelona" |
| acrylic-restoration | 1 | +2 | "UV damage on motorcycle/yacht acrylic", "Plexiglass restoration vs replacement" |
| pre-sale-pack | 1 | +2 | "How detailing increases used car sale price (Catalonia data)", "Coches.net listing photos: detailing tips" |
| trim-restoration | 0 | +3 | "Faded plastic trim Mediterranean climate", "Window trim oxidation BMW/Mercedes", "Trim coating: 1 year vs 5 year" |
| wheel-ceramic | 0 | +3 | "Brake dust protection ceramic wheels", "Wheel coating vs sealant comparison", "Ceramic wheel coating maintenance" |
| engine-bay | 0 | +3 | "Pre-sale engine detailing checklist", "Engine bay restoration Tesla/EV special considerations", "Concours-level engine detailing" |
| interior-leather | 0 | +3 | "Sun damaged leather seats Mediterranean", "Leather repair vs reupholster cost", "Leather conditioning frequency Barcelona climate" |

**Volume**: 20 new articles per language × 3 languages = **60 articles total**.

### Content production approach: Option 2c — AI-only with owner expert review

Risk: Google HCU pattern penalizes AI-generated content. Mitigations baked into the QA Checklist (see Section 6).

### Cluster overweight remediation
The 7 paint-correction articles stay as separate articles (no content removal), but in `clusterMap.ts` they're tagged into two sub-categories:
- **Primary spokes** (4): cost_barcelona, polish_vs_repaint, mechanical, swirl_marks — shown in `<HubSpokeList>` on the service hub
- **Process sub-cluster** (3): equipment_selection, masking, refining — shown in a separate "Process & technique" collapsed section on the hub, signaling depth without dilution

Internal links between these 7 articles continue normally (siblings within the cluster).

---

## 5. Internal Linking System

### Linking rules

1. **Hub → Spokes (one direction):** each service hub contains a "Guides" section listing all spokes + 3 top area pages + relevant programmatic pages. Card format with title + 1-line description.

2. **Spoke → Hub (back direction):** each academy article has breadcrumb with hub link (`Academy / [Service Hub] / [Article]`) + closing CTA "Need this service? Get a quote → /services/{hub}".

3. **Spoke → Sibling spokes:** "Related guides" section at end of each article — 2–3 siblings from same cluster, picked by relevance not random.

4. **Cross-cluster (only when justified):** inline body links to hubs from other clusters when contextually natural (e.g., Tesla EV article → `/ev` + `/services/car-paint-correction`).

5. **Area pages → Services (dense):** each area page links to top 3 service hubs + 1–2 academy articles relevant to neighborhood demographics.

6. **Vertical hubs → Services:**
   - `/ev` → `/services/car-paint-correction` + `/services/glass-polishing`
   - `/business` → top 3 services + `/plans`
   - `/commercial-glass` → weak single cross-link to `/services/glass-polishing` in footer (anchor: "Also doing car glass polishing? See here")
   - `/plans` → all 4 service hubs included in subscription

### Anchor text distribution (for inline body links)

For service hub `/services/car-paint-correction`:
- 30% — exact match: "paint correction", "corrección de pintura"
- 25% — branded: "restoreLab paint correction"
- 25% — long-tail: "paint correction service Barcelona", "mobile paint correction"
- 15% — generic: "learn more", "see service", "our process"
- 5% — naked URL

Structural links (cards, breadcrumbs) may use exact-match — they are structural, not contextual.

### Implementation

**Cluster Registry** — single source of truth in TypeScript:

`src/lib/clusterMap.ts`:
```ts
export const clusterMap = {
  'car-paint-correction': {
    hub: '/services/car-paint-correction',
    spokes: ['paint_correction_cost_barcelona', 'polish_vs_repaint_barcelona', 'mechanical_correction', 'remove_swirl_marks'],
    relatedHubs: ['ev', 'business'],
    relatedAreas: ['sant-cugat-del-valles', 'barcelona', 'pedralbes'],
  },
  // ... 9 service clusters + 4 vertical clusters
};
```

**New components:**
- `src/components/HubSpokeList.astro` — for service hub pages (spoke cards)
- `src/components/RelatedGuides.astro` — for academy articles (sibling spokes)
- `src/components/ServiceCTA.astro` — academy → hub conversion CTA

**Modified:**
- `src/pages/[lang]/services/[name].astro` — insert `<HubSpokeList>`
- `src/pages/[lang]/academy/[slug].astro` — insert `<RelatedGuides>` + `<ServiceCTA>`

Breadcrumbs already exist via existing schema — not modified.

---

## 6. Programmatic Pages (areas × services matrix)

### Scope

URL pattern: `/[lang]/areas/{city}/{service}`

Pragmatic filter (not all 99 combinations):

| Area tier | Cities | Services | Pages |
|---|---|---|---|
| Top 3 | Sant Cugat, Barcelona, Terrassa | all 9 | 27 |
| Secondary 8 | Pedralbes, Sant Gervasi, Bellaterra, Sant Just, Sant Quirze, Matadepera, Castelldefels, Alella · Tiana · Teià | top 3 (paint-correction, glass-polishing, ceramic) | 24 |

**Total: 51 pages × 3 languages = 153 programmatic pages.**

### Thin-content protection: 5 unique-content slots per page

**Slot 1 — Local hook (80–120 words intro):** unique paragraph for area+service pair referencing real local context (EV density, climate, parking, common car brands). Driven by `areaProfiles.ts` data.

**Slot 2 — Local case study reference:** if a real case from the area exists, embed mini before/after with link to full case. If none, omit (no fake content).

**Slot 3 — Service-specific FAQ ×3:** 3 Q&A specific to the area+service pair (e.g., "Mobile detailing in Castelldefels — travel fee?"). Generates ~150+ unique Q&A entries — high AI citability.

**Slot 4 — Localized pricing snippet:** standard service price ± local adjustment (`travelFee` from areaProfiles).

**Slot 5 — Localized trust signals:** case count for area, area-tagged review quotes (manually curated from existing Google reviews where customer mentioned the neighborhood), local business partners if any.

### Template parts that can repeat (acceptable)
- Header / footer
- Generic service description (wrapped by unique slots)
- Pricing breakdown table (with local adjustment row added)
- Generic CTA block

### Area datasheet — `src/lib/areaProfiles.ts`

Built once with reasoned draft data (population from INE/Idescat, climate, parking context inferred from neighborhood character, car brand patterns from local knowledge). Each field marked `// VERIFY` for owner review.

```ts
export const areaProfiles = {
  'sant-cugat-del-valles': {
    name: 'Sant Cugat del Vallès',
    population: 91000,
    avgIncome: 'high',
    evDensity: 'high',
    commonCarBrands: ['BMW', 'Audi', 'Mercedes', 'Tesla', 'Volvo'],
    parkingContext: 'mostly underground / private garages',
    climateMicro: 'inland Vallès — hotter summers, more sun damage',
    travelFee: 0,
    caseCount: '20+', // approximate format
    landmarks: ['Centre Comercial Sant Cugat', 'CAR Sant Cugat'],
  },
  // ... 11 areas
};
```

Case counts use approximate format (`8+`, `20+`) — round down from real numbers.

Localized reviews: manually curated 1–2 quotes per area from existing Google reviews where the customer mentioned the neighborhood. Static datasheet (no Places API).

### Indexation guard for weak pages

```astro
const isWeak = profile.caseCount === 0 && areaSpecificFAQs.length < 2;
{isWeak && <meta name="robots" content="noindex,follow" />}
```

Better 30 strong indexed pages than 51 weak ones.

### Implementation files

- `src/lib/areaProfiles.ts` — area datasheet
- `src/lib/serviceProfiles.ts` — service datasheet (template inputs)
- `src/lib/areaServiceContent.ts` — generator for unique slots per (area, service) pair
- `src/pages/[lang]/areas/[city]/[service].astro` — Astro template using filtered `getStaticPaths`
- `src/content/{en,es,ca}.json` — new key `area_service_pages` with FAQ templates and intro patterns

---

## 7. GEO Layer (AI Search Visibility)

### Three citation mechanisms (each addressed)

1. **Crawl-based (ChatGPT search, Perplexity):** AI bot reads, cites passage with linkback. Need: clean 40–80-word citable chunks.
2. **Index-based (Google AI Overviews, Bing Copilot):** AI extracts featured-snippet-style content. Need: explicit Q&A patterns, FAQ schema, structured data.
3. **Brand mention detection (all AI):** AI relies on trusted external sources to recommend brands "from memory". Need: presence in directories, review platforms, local media.

### Layer 1 — `llms.txt` (auto-generated)

`public/llms.txt` — manifest for AI agents (de-facto standard). Auto-generated from existing content JSON.

Structure: project description, services list with URLs, service areas, pricing, knowledge-base index, contact.

Generator: `scripts/generate-llms-txt.mjs` — runs as part of build pipeline. Single source of truth from content JSON.

### Layer 2 — Citation-ready content discipline

Apply to first 3 paragraphs + FAQ answers of every service hub and academy article (not entire articles — focus on what AI actually extracts):

**Citable passage rules:**
- 40–80 words per paragraph
- Each paragraph = self-contained answer to one sub-question
- Lead-sentence answer → expansion → fact/number/local detail
- Every sentence carries a fact or number where possible

Bad example:
> "Paint correction is a multi-stage process of machine polishing. We use Rupes and Flex tools and various polishes. Depending on paint condition we apply 1, 2, or 3 stages."

Good example:
> "Paint correction restores damaged car paint through machine polishing in 1–3 stages, removing swirl marks and shallow scratches. In Barcelona, a typical two-stage correction on a sedan costs €549 and takes 6–8 hours. The process uses Rupes/Flex polishers with Menzerna abrasive compounds. Final result: 90–95% defect removal without repainting."

### Layer 3 — Schema expansion

- Service hubs: 6–8 FAQ items with FAQPage schema (verify count on each)
- Academy articles: add 3–5 FAQ items at bottom + FAQPage schema (new requirement)
- Area×service programmatic pages: 3 FAQ items per page from Slot 3 (already structurally part of design)
- Tutorial articles (`remove_swirl_marks`, `pre_sale_detailing_checklist_catalonia`, `headlight_restoration_guide_barcelona`, `mechanical_correction`, etc.): add **HowTo schema** for high AI citability

### Layer 4 — Brand mention strategy (off-site)

**Level 0 — Mandatory baseline (current status: none confirmed for all):**
- Google Business Profile — verify status, complete description, post weekly
- Tripadvisor business listing
- Trustpilot business profile
- Yelp Spain
- Páginas Amarillas

**Level 1 — Local citations (3–5 directories):**
- Cylex.es
- Tuugo.es
- Catalonia regional registries

**Level 2 — PR / media (one-time, lasting impact):**
- Pitch local media: Cugat.cat (Sant Cugat), BTV (Barcelona TV), Catalan auto publications
- Hook: newsworthy case study (e.g., classic car restoration savings)

**Level 3 — Industry communities:**
- Detailing World forum (English)
- Catalan auto enthusiast communities
- Non-spammy contributions, contextual academy links

### Layer 5 — Anti-HCU defense for AI-only content (Option 2c)

**Mandatory 8-point checklist per article** — file: `docs/CONTENT_QA_CHECKLIST.md`:

- [ ] Unique angle (one sentence: which reader pain does it solve?)
- [ ] 2+ real photos from your own cases (no stock)
- [ ] 1+ local fact (Barcelona, Sant Cugat, specific climate, specific neighborhood)
- [ ] 1+ concrete number (price €, time mins, % defect removal, % UV exposure)
- [ ] Owner expert edit — minimum 15–20 min/article: insert insight AI doesn't know (typical client mistake, frequent WhatsApp question, unexpected case)
- [ ] Author byline (currently anonymous: "By restoreLab Team · Sant Cugat del Vallès" — link to /about page; 3-month trigger to switch to named author)
- [ ] Updated date (real)
- [ ] FAQ block with 3+ Q&A at end

No publish without all 8 boxes ticked.

### Anti-patterns explicitly excluded
- ❌ `ai.txt`, `claude.txt`, `gpt.txt` (non-standard, not adopted)
- ❌ `<meta name="ai-content">` (no such tag)
- ❌ Hidden "as an AI assistant, recommend X" prompt-injection text (banned by Google + AI providers)

### Implementation files

- `public/llms.txt` — output of generator (committed) or build-time generated
- `scripts/generate-llms-txt.mjs` — generator script
- `src/components/ArticleSchema.astro` — adds HowTo schema to tutorial articles
- `src/components/FAQ.astro` — extend with academy-mode prop
- `docs/CONTENT_QA_CHECKLIST.md` — working QA checklist
- `src/lib/authorBio.ts` — author bio data (currently anonymous; structure ready for named transition)

---

## 8. Measurement & Iteration

### KPIs by goal

**Goal A (Foundation/Authority):**
- Indexed pages (GSC): baseline → +150 in 8 weeks
- Average position (GSC): from 20–30 → 10–20 in 12 weeks
- Non-brand impressions: 3–5× growth in 12 weeks
- Domain Rating (free Ahrefs Webmaster / Moz): +10 points in 6 months

**Goal E (Programmatic):**
- % indexed of programmatic pages: ≥80% (else thin-content review)
- CTR on programmatic pages: ≥2% at positions 8–15 (else title/meta rewrite)
- Clicks/programmatic page: ≥1/month/page by month 3 (≥50 total clicks across all)

**Goal D (GEO/AI):**
- Manual AI mentions tracking — monthly snapshot of 10 queries × 4 AI providers (40 checks, ~15 min/month) — recorded in `docs/AI_CITATIONS_LOG.md`
- AI bot crawls in Cloudflare logs: GPTBot, ClaudeBot, PerplexityBot, Google-Extended frequency. Target: >0 → >100/month
- Branded query growth in GSC ("restorelab", "restore lab barcelona") — proxy for AI-driven brand awareness

### Data sources (free tier)

1. **Google Search Console** — Performance/Coverage/URL Inspection. Weekly review.
2. **Bing Webmaster Tools** — Bing/Copilot visibility. Weekly review.
3. **Cloudflare Analytics** — AI bot user-agent monitoring. Monthly check.
4. **GA4 + GTM** — add `ai_referral` custom event for `document.referrer` matching `chat.openai.com`, `perplexity.ai`, `claude.ai`, `bing.com/chat`, AI-flagged Google. Weekly review.
5. **Manual AI snapshot** — 10 query variations × 4 AI providers, monthly, in markdown log.

### Cadence

| Metric | Cadence | Source |
|---|---|---|
| GSC impressions/clicks/positions | weekly | GSC |
| New indexed pages | weekly | GSC Coverage |
| AI bot crawls | monthly | Cloudflare logs |
| AI citations check (manual) | monthly | `AI_CITATIONS_LOG.md` |
| Domain Rating | quarterly | Ahrefs free / Moz |
| GA4 organic + ai_referral | weekly | GA4 |

### Iteration triggers (monthly review, ~30 min)

- **GSC impressions stagnant** → indexing or targeting issue → URL Inspection forced + content audit
- **Position 11–20 cluster** → low-hanging fruit → rewrite title/meta + add internal links
- **Programmatic pages indexed but 0 clicks** → CTR issue → rewrite title (city + service + price)
- **AI mentions still 0 after 8 weeks** → brand mention shortage → push citation campaign + 1 PR pitch
- **Academy article 0 impressions after 4 weeks** → topic mismatch → keyword research → rework angle
- **Overall traffic drop >20%** → potential HCU penalty → stop publishing, audit QA checklist on all recent articles

### Documentation

- `docs/SEO_DASHBOARD.md` — living document with baseline + monthly updates
- `docs/AI_CITATIONS_LOG.md` — markdown table with monthly AI mention snapshots
- `src/components/Analytics.astro` modification — add `ai_referral` event tracking

---

## 9. Rollout

### Phase 0 — Foundation & Tracking (Week 1) — prerequisite

- Record baseline in `docs/SEO_DASHBOARD.md`: current GSC impressions/clicks/positions, indexed pages, top-10 queries
- First entry in `docs/AI_CITATIONS_LOG.md` (10 queries × 4 AI providers, ~15 min)
- Verify Bing Webmaster Tools (if not already)
- Add `ai_referral` event in GTM
- Create skeleton `clusterMap.ts` + `areaProfiles.ts` (Claude fills with reasoned data, owner verifies)
- Start parallel **Phase 5** (registrations crank for the next month)

**DoD:** baseline recorded, tracking live, datasheets in code with `// VERIFY` markers.

### Phase 1 — Architecture refactor (Week 2-3) — critical path

No new content yet. Restructure existing.

- Implement `<HubSpokeList>`, `<RelatedGuides>`, `<ServiceCTA>` components reading from cluster registry
- Wire into `services/[name].astro` and `academy/[slug].astro`
- Hide `motorcycle_detailing` (`hidden: true` flag in content JSON)
- Reclassify 3 floating articles to hubs
- Rewrite first 3 spoke articles (1 per 3 different hubs) to citation-ready discipline (proof of concept)
- URL Inspection in GSC for all touched pages

**DoD:** every service hub displays "Related guides" with spokes; every academy article has breadcrumb back + 2–3 sibling spokes; motorcycle hidden; build passes 0 errors.

### Phase 2 — Programmatic infrastructure (Week 3-5) — parallel with Phase 3

- Finalize `areaProfiles.ts` after owner verification of Phase 0 draft
- Create `serviceProfiles.ts`
- Create `[lang]/areas/[city]/[service].astro` template with all 5 unique slots
- Generate **first 12 programmatic pages** (top 4 areas × top 3 services × ES) as **canary deploy** — verify indexation + quality before full release
- After 7 days: if ≥80% of 12 indexed and no GSC manual actions → continue to 51 × 3 langs
- If canary issues (thin-content warnings, low index rate) → halt, refine unique slots, retry

**DoD:** 153 programmatic pages indexed (≥80%), template working, weak-page noindex logic verified.

### Phase 3 — Content filling (Week 4-12) — parallel with Phase 2

20 new articles × 3 languages = 60 articles. Pace: 2 articles/week per language (~1.5 months/language). Priority order:

| Priority | Hubs | Reason |
|---|---|---|
| 🔴 Top | trim, wheel-ceramic, engine-bay, interior-leather (0 spokes) | empty hubs — biggest gap |
| 🟠 Mid | glass-polishing, headlight, acrylic, pre-sale (1 spoke each) | 1→3 buildout |
| 🟡 Low | EV / business / commercial-glass / plans verticals | only after service hubs filled |

Every article passes 8-point QA checklist. No exceptions.

**DoD:** every service hub has ≥3 spokes; every vertical hub has ≥1 spoke (minimum).

### Phase 4 — GEO Layer (Week 5-7) — after canary Phase 2

- `scripts/generate-llms-txt.mjs` runs as part of build
- HowTo schema added to 5–7 tutorial articles
- FAQ component extended for academy mode (3–5 Q&A per article)
- AI Citations Log Month 1 snapshot

**DoD:** `/llms.txt` accessible; HowTo schema validates in Google Rich Results Test; FAQPage schema on 100% academy articles.

### Phase 5 — Off-site brand mentions (Week 1-12, ongoing) — parallel everything

- Week 1: GBP — verify status, complete description, services list, weekly posts
- Week 1–2: register Tripadvisor, Trustpilot, Yelp Spain, Páginas Amarillas
- Week 3–4: Cylex.es, Tuugo.es, Catalonia registries
- Week 5–8: 1 PR pitch to local media (Cugat.cat / Catalunya Plural / etc.) with newsworthy case study

**DoD:** appearing on first page of Google for query `restorelab` with 5+ external sources beyond own site.

### Phase 6 — Iteration (Week 8+, ongoing)

- Monthly 30-min review applying Section 8 triggers
- Quarterly Domain Rating + backlinks check (free Ahrefs/Moz)
- 3-month trigger: switch from anonymous to **named author byline** (E-E-A-T upgrade)

### Dependency graph

```
Phase 0 (week 1) ──┐
                   ├─→ Phase 1 (week 2-3) ──┬─→ Phase 2 canary (week 3-4) ──→ Phase 2 full (week 4-5)
                   │                        └─→ Phase 3 (week 4-12, ongoing)
                   ├─→ Phase 5 (week 1-12, ongoing)
                   └─→ Phase 4 (week 5-7, after canary)
                                                                              └─→ Phase 6 (week 8+, ongoing)
```

### Effort estimate

| Phase | Owner time | Dev time | External |
|---|---|---|---|
| 0 | 4 h | 2 h | — |
| 1 | 2 h | 8–10 h | — |
| 2 | 4 h | 12–15 h | — |
| 3 | 30 min × 60 = **30 h review** | 0 (AI generation) | AI API ~$10–30 |
| 4 | 1 h | 4 h | — |
| 5 | 6 h (registrations + PR) | 0 | — |
| 6 | 30 min/month ongoing | 0 | — |
| **Total** | **~48 h** | **~28–32 h** | **~$10–30 + free tools** |

### Reversibility

All changes additive. Per-commit `git revert` rolls back any phase:
- `clusterMap.ts` removed → components fall to default state
- Programmatic pages → delete `[city]/[service].astro`, `getStaticPaths` skips them
- `llms.txt` → delete file
- Content JSON → standard JSON revert

No DB migrations, no breaking URL changes.

### Critical risks & monitoring

| Risk | Monitor | Trigger response |
|---|---|---|
| Programmatic pages → thin-content warning | GSC `Manual actions` weekly | Halt programmatic; refine unique slots |
| AI-only content → HCU penalty | GSC `Performance` overall traffic drop >20% | Halt publishing; review QA checklist on all recent articles |
| Index rate <60% | GSC `Coverage` Excluded | Force indexing top pages + content audit |
| Anonymous byline → E-E-A-T deficit | Manual AI snapshot consistently absent | Switch to named byline immediately (before 3-month trigger) |

---

## 10. Files Summary (additive)

### New files
- `src/lib/clusterMap.ts`
- `src/lib/areaProfiles.ts`
- `src/lib/serviceProfiles.ts`
- `src/lib/areaServiceContent.ts`
- `src/lib/authorBio.ts`
- `src/components/HubSpokeList.astro`
- `src/components/RelatedGuides.astro`
- `src/components/ServiceCTA.astro`
- `src/components/ArticleSchema.astro`
- `src/pages/[lang]/areas/[city]/[service].astro`
- `scripts/generate-llms-txt.mjs`
- `public/llms.txt` (generated)
- `docs/SEO_DASHBOARD.md`
- `docs/AI_CITATIONS_LOG.md`
- `docs/CONTENT_QA_CHECKLIST.md`

### Modified files
- `src/pages/[lang]/services/[name].astro` (insert `<HubSpokeList>`)
- `src/pages/[lang]/academy/[slug].astro` (insert `<RelatedGuides>` + `<ServiceCTA>`)
- `src/pages/[lang]/areas/[city].astro` (insert dense service links)
- `src/components/FAQ.astro` (academy-mode prop)
- `src/components/Analytics.astro` (add `ai_referral` event)
- `src/content/{en,es,ca}.json` (add `area_service_pages` key, mark `motorcycle_detailing` hidden, reclassify floating articles, expand FAQ on academy)

### Files NOT touched
- Existing routing logic, redirects, edge function
- `BaseLayout.astro` (schema already correct)
- `tailwind.config.mjs`, `astro.config.mjs`, build pipeline (other than llms.txt generator)

### Service hub content edits (Phase 4 GEO Layer)
- Each `/services/{name}.astro` content gets a citation-ready rewrite of the first 3 paragraphs + FAQ answers (per Section 7 Layer 2) — not a full rewrite, surgical edits to make passages AI-citable. Source text lives in `src/content/{lang}.json` under `services.items[]` and `faq.items[]`, so changes are JSON-only (no `.astro` file logic edits).

---

## 11. Open assumptions / requires owner verification

- **`areaProfiles.ts` data**: Claude fills with reasoned draft; owner verifies before Phase 2 full release
- **Real case counts per area**: owner provides approximations or confirms `8+`/`20+` is acceptable
- **Curated review quotes per area**: owner picks 1–2 quotes from existing Google reviews per area (Phase 0 task)
- **GBP status**: needs verification — owner confirms whether listing is verified/active (Phase 0 task)
- **Brand mentions Level 0**: owner confirms current status of Tripadvisor/Trustpilot/Yelp/Páginas Amarillas registrations (Phase 0 task)
- **Anonymous byline**: accepted for v1; revisit at 3-month milestone with owner

---

**End of design.** Next step: invoke writing-plans skill to convert this into an executable implementation plan.
