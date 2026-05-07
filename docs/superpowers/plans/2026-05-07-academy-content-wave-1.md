# Academy Content Wave 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Draft the first wave of 5 priority academy articles in English, all shipped to `status: "draft"` so they exist in JSON but DO NOT render publicly until owner reviews and promotes them. Build content production framework + per-article QA tracking, ready for subsequent waves.

**Architecture:** Add 5 new academy_articles entries to `src/content/en.json` only (ES + CA translation deferred to subsequent waves). Each entry is a complete article (~1800-2400 words) following existing schema, marked `status: "draft"`. The existing `[lang]/academy/[slug].astro` route already filters by `status === 'published'`, so drafts are automatically excluded from build output. Per-article QA state tracked in new `docs/CONTENT_QA_LOG.md`.

**Tech Stack:** Astro 4, JSON-driven content (existing academy schema), no new code. Pure content production + tracking docs.

---

## Critical Risk Acknowledgment

The spec section 4D (Option 2c — AI-only with owner review) and section 7 layer 5 (Anti-HCU defense) explicitly mandate **owner expert review before any article goes `status: 'published'`**. This plan **does not bypass that gate**. Articles ship as `status: 'draft'` — invisible to the public, invisible to Google, invisible to AI crawlers (unindexable due to filter at `getStaticPaths`).

**No HCU exposure** because no draft is published. Owner promotes drafts via single-line edit (`"status": "draft"` → `"status": "published"`) after running 8-pt QA checklist from `docs/CONTENT_QA_CHECKLIST.md`.

**Without owner promotion**, this plan delivers zero SEO impact. That's by design — better zero impact than negative impact.

---

## Wave 1 articles (5 — all in English)

Selected for cluster gap coverage (highest-priority hubs first):

| # | Hub | Slug | Title | Why first |
|---|---|---|---|---|
| 1 | interior-leather | `leather-seats-mediterranean-restoration` | Sun-Damaged Leather Seats: Mediterranean Climate Restoration | Hub has **0** spokes (biggest gap of all active hubs) |
| 2 | glass-polishing | `water-stain-removal-car-windows` | Water Stain Removal from Car Windows: When to Polish vs Replace | Hub has only 1 spoke (windshield-scratch-repair); needs +2 to hit cluster authority |
| 3 | headlight-restoration | `yellow-vs-cloudy-headlights-causes-lifespan` | Yellow vs Cloudy Headlights: Causes, Lifespan, and Restoration Cost | Hub has only 1 spoke; high local-search value |
| 4 | acrylic-restoration | `uv-damage-motorcycle-yacht-acrylic` | UV Damage on Motorcycle Visors and Yacht Acrylic | Hub has only 1 spoke; differentiates from car-focused content |
| 5 | pre-sale-pack | `detailing-used-car-sale-price-catalonia` | How Detailing Increases Used Car Sale Price in Catalonia | Hub has only 1 spoke; commercial-intent content |

After Wave 1: each of these 5 hubs gains 1 article. Cluster spoke counts: interior-leather 0→1, glass-polishing 1→2, headlight 1→2, acrylic 1→2, pre-sale 1→2.

To hit the spec target (≥3 spokes per hub), Waves 2 and 3 will add the remaining articles. Each subsequent wave is a separate plan.

---

## File Structure

### Modified files
- `src/content/en.json` — add 5 entries to `academy.articles[]` (status: "draft") + 5 entries to `academy_articles{}` (full content). Single file.
- `docs/CONTENT_QA_CHECKLIST.md` — append "Draft → Published Promotion Workflow" section explaining how owner promotes drafts.

### New files
- `docs/CONTENT_QA_LOG.md` — per-article tracking table for the 5 Wave 1 articles plus structure for future waves.

### Files NOT touched
- `src/content/es.json` and `src/content/ca.json` — translations are subsequent waves' work
- `src/pages/[lang]/academy/[slug].astro` — already filters by `status === 'published'`; no logic change
- `src/pages/[lang]/academy.astro` (listing page) — already filters by status; drafts auto-hidden
- `src/lib/clusterMap.ts` — drafts don't appear in cluster lookups because they're filtered at runtime by `resolveSpoke` (which checks `status === 'published'`)

---

## Pre-flight check

- [ ] **Step 1: Verify clean working tree**

Run: `git status --short`
Expected: clean (or only the pre-existing untracked files: `.claude/settings.local.json`, `Book/`, `restorelab_action_plan.md`).

- [ ] **Step 2: Verify Plan 1 + Plan 2 deployed**

Run: `git log --oneline -1`
Expected: HEAD includes Plan 2.5 commit (`a712f35` or similar).

- [ ] **Step 3: Verify existing academy article schema**

Run: `jq '.academy_articles.uv_damage_acrylic_restoration | keys' src/content/en.json`
Expected: `["description", "intro", "sections", "seo_description", "seo_title", "title"]`

This is the schema each new article entry must follow.

- [ ] **Step 4: Verify build passes**

Run: `npm run build`
Expected: 0 errors, 262 pages.

---

## Section 1 — Tracking infrastructure

### Task 1: Update `docs/CONTENT_QA_CHECKLIST.md` with promotion workflow

**Files:**
- Modify: `docs/CONTENT_QA_CHECKLIST.md`

Add an explanatory section explaining the draft → published gate.

- [ ] **Step 1: Open existing file**

Read current `docs/CONTENT_QA_CHECKLIST.md`. It was created in Plan 1 Task 1 with the 8-point checklist template.

- [ ] **Step 2: Append new section at end of file**

Use Edit tool. After the existing "Reviewer sign-off" block, append:

```markdown

---

## Draft → Published Promotion Workflow

AI-drafted articles are committed with `status: "draft"` to `src/content/en.json` (and later `es.json` / `ca.json` after translation). They render NOWHERE on the live site — `getStaticPaths` filters them out, so no public URL exists.

To promote a single article from draft to published:

1. **Review the draft** — open `src/content/en.json`, find the article entry by slug under `academy.articles[]`, read the full content under `academy_articles[content_key]` (slug with hyphens → underscores).

2. **Run the 8-pt QA checklist above** — fill in your responses inline in `docs/CONTENT_QA_LOG.md` (the per-article tracking table).

3. **Insert your expert insight** — minimum 15-20 minutes editing the prose. Add at least one of:
   - A typical client mistake you've observed in real Sant Cugat / Barcelona work
   - A frequent question received via WhatsApp
   - An unexpected case or counterintuitive finding from your case database

4. **Verify or replace the photos** — the AI draft has no embedded images. Article entries don't currently surface images in the rendering template (only sections, paragraphs, FAQ). If you want hero photos, that's a separate template extension. For Wave 1 we're text-only — but you can edit the JSON to add image references in section objects if you choose.

5. **Verify pricing/factual claims** — the AI draft has placeholder numbers based on serviceProfiles.ts. Replace any pricing or duration figure that doesn't match your actual practice.

6. **Flip the status flag**:
   ```json
   "status": "published"
   ```

7. **Set the `dateModified`** in the corresponding `card.date` field to today's date.

8. **Build and verify**:
   ```bash
   npm run build
   ```
   The article should now render at `/en/academy/{slug}`.

9. **Commit**:
   ```bash
   git add src/content/en.json docs/CONTENT_QA_LOG.md
   git commit -m "Promote academy article {slug} to published after owner QA review"
   ```

10. **(Optional)** Translate to ES and CA following the same workflow — add entries to `es.json` and `ca.json`, mark each `status: "draft"` until quality-checked.

### When NOT to promote

- Don't promote without all 8 QA items checked
- Don't promote with unverified pricing
- Don't promote with stock or AI-generated images
- Don't promote with anonymous "restoreLab Team" byline if a 3-month milestone (per spec) has been reached and named author is now possible

### Bulk promotion warning

Tempting as it is to promote multiple drafts in one commit: **don't**. Promoting > 2 articles per week creates the "scaled content" pattern Google's HCU is tuned to detect. Spread promotions over time (target: 1-2 per week per language).
```

- [ ] **Step 3: Verify file**

Run: `tail -50 docs/CONTENT_QA_CHECKLIST.md`
Expected: shows the new "Draft → Published Promotion Workflow" section.

- [ ] **Step 4: Commit**

```bash
git add docs/CONTENT_QA_CHECKLIST.md
git commit -m "Document draft → published promotion workflow in CONTENT_QA_CHECKLIST"
```

---

### Task 2: Create `docs/CONTENT_QA_LOG.md` (per-article tracking table)

**Files:**
- Create: `docs/CONTENT_QA_LOG.md`

A markdown tracking table where the owner records 8-pt QA state for each draft article. Pre-populated with the 5 Wave 1 entries (status: pending review, all checkboxes empty).

- [ ] **Step 1: Create file**

Exact content:

```markdown
# Content QA Log — restoreLab Academy

Per-article tracking of the 8-pt QA checklist from `docs/CONTENT_QA_CHECKLIST.md`. Update before promoting any article from `status: "draft"` to `status: "published"`.

## Status legend

- `📝 Drafted` — AI draft committed to JSON, awaiting owner review
- `🔍 In review` — Owner started QA process
- `✅ Promoted` — All 8 QA items checked, status flipped to `published`, live on site

## Wave 1 articles (drafted YYYY-MM-DD)

| # | Slug | Hub | Lang | Status | QA1 angle | QA2 photos | QA3 local | QA4 numbers | QA5 expert | QA6 byline | QA7 date | QA8 FAQ | Promoted date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | leather-seats-mediterranean-restoration | interior-leather | EN | 📝 Drafted | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | — |
| 2 | water-stain-removal-car-windows | glass-polishing | EN | 📝 Drafted | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | — |
| 3 | yellow-vs-cloudy-headlights-causes-lifespan | headlight-restoration | EN | 📝 Drafted | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | — |
| 4 | uv-damage-motorcycle-yacht-acrylic | acrylic-restoration | EN | 📝 Drafted | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | — |
| 5 | detailing-used-car-sale-price-catalonia | pre-sale-pack | EN | 📝 Drafted | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | — |

## Future waves

Add rows below as new waves are drafted.

## Per-article notes (optional, for owner review)

### leather-seats-mediterranean-restoration
- Date drafted: YYYY-MM-DD
- Owner notes: _______
- Insight added during expert review: _______

### water-stain-removal-car-windows
- Date drafted: YYYY-MM-DD
- Owner notes: _______
- Insight added during expert review: _______

### yellow-vs-cloudy-headlights-causes-lifespan
- Date drafted: YYYY-MM-DD
- Owner notes: _______
- Insight added during expert review: _______

### uv-damage-motorcycle-yacht-acrylic
- Date drafted: YYYY-MM-DD
- Owner notes: _______
- Insight added during expert review: _______

### detailing-used-car-sale-price-catalonia
- Date drafted: YYYY-MM-DD
- Owner notes: _______
- Insight added during expert review: _______
```

- [ ] **Step 2: Verify file exists**

Run: `ls -la docs/CONTENT_QA_LOG.md`
Expected: file present.

- [ ] **Step 3: Commit**

```bash
git add docs/CONTENT_QA_LOG.md
git commit -m "Add CONTENT_QA_LOG tracking table for Wave 1 academy drafts"
```

---

## Section 2 — Article drafts

### Task 3: Draft Article 1 — Sun-Damaged Leather Seats (interior-leather hub)

**Files:**
- Modify: `src/content/en.json` (add 1 entry to `academy.articles[]` + 1 entry to `academy_articles{}`)

This article fills the biggest cluster gap (interior-leather has 0 spokes today).

**Article specifications:**

- **Slug:** `leather-seats-mediterranean-restoration`
- **Content key (snake_case):** `leather_seats_mediterranean_restoration`
- **Number:** `16` (continuing from existing 15 articles, even though motorcycle-detailing is hidden — keeping unique numbers)
- **Date:** `2026-05-07` (today's draft date; owner updates on promotion)
- **Status:** `draft`
- **Length:** 1800-2400 words across 4-5 sections
- **Audience:** car owners in Sant Cugat / Barcelona / Pedralbes who own premium vehicles (BMW, Audi, Mercedes, Tesla) experiencing leather wear from Mediterranean sun exposure

**Required structural elements:**

1. **`title`** — concise, includes "Mediterranean" or "Sun" to flag local relevance
2. **`description`** — 1-2 sentence hook for the academy listing card
3. **`seo_title`** — Google-optimized title with location ("Barcelona" or "Sant Cugat") if natural fit, ≤ 60 chars
4. **`seo_description`** — meta description, ≤ 158 chars, includes search-intent keyword
5. **`intro`** — opening paragraph (60-100 words) hooking the reader with the local pain point
6. **`sections[]`** — 4-5 sections, each with:
   - `number` (string, "1" through "5")
   - `title` (clear, scannable, search-friendly)
   - `paragraphs[]` (2-3 paragraphs of 60-90 words each — citation-ready discipline per spec section 7 layer 2)
   - Optionally: `key_params[]` (4-5 bullet points for technical lists)
   - Optionally: `analogy` (object with `title` + `text`) for one section
   - Optionally: `table` (object with `caption`, `headers[]`, `rows[][]`) — useful for cost comparison

**Required content beats** (the article MUST cover these — they're what make it useful for cluster authority):

- The mechanism: how UV + heat + dry climate (Mediterranean specifics) damage leather differently than humid climates
- The signs: what early, mid, and late-stage damage look like (color fade, surface cracking, deep splits, structural failure)
- DIY vs professional: why over-the-counter conditioners fail on advanced damage, and the threshold where restoration ≠ replacement
- The restoration process: realistic timeline (steps + hours per stage) for what a professional restorer does
- Cost framework: typical restoration cost range vs reupholster cost in Spain; ROI math for retaining vehicle value
- One section dedicated to "When restoration ISN'T worth it" — honest framing builds E-E-A-T trust

**Local references that MUST appear** (uniqueness signals):

- "Mediterranean climate" or "Sant Cugat / Barcelona / Pedralbes / Tres Torres" mentions naturally placed
- Common car brands per `areaProfiles.commonCarBrands` for Sant Cugat / Pedralbes (BMW, Mercedes, Audi, Tesla)
- Concrete numbers: realistic price ranges in EUR (use `serviceProfiles['interior-leather'].startingPriceEur = 199` as anchor; restoration scope-based: 199-450 EUR for partial work, 600-1200 EUR for full restoration). Time figures: 2-5 hours for conditioning, 5-10 hours for color repair.
- One reference to a specific neighborhood challenge (e.g., underground garages in Pedralbes have lower UV exposure, so leather aging there is more from heat than UV directly)

**FAQ block** — must be added as a separate field `faq[]` on the academy_articles entry (NOT on academy.articles card). 4 Q&A items.

Example shape:
```json
"faq": [
  { "question": "How much does leather seat restoration cost in Barcelona?", "answer": "Partial restoration..." },
  ...
]
```

**Note:** the existing academy_articles schema does not yet have a top-level `faq` field. We add one. The `[lang]/academy/[slug].astro` template would need to be extended in a follow-up to render this — for Wave 1 we just store the data; rendering is a separate task in Wave 1.5 or later. **Document this gap in your commit message.**

Or — alternate path — embed FAQs as the last section using the existing `sections[]` schema. Title that section "Frequently asked" and use `key_params[]` as Q lines. This works with the existing template, no template change needed.

**Recommendation: use the second approach (FAQs as a final section using existing schema).** Avoids template modification this wave; keeps Plan 3 minimal.

So the article structure should be:
- Sections 1-4: actual content
- Section 5: titled "Frequently Asked Questions" with `paragraphs[]` containing the answer prose (one paragraph per Q&A, with the question as a bold lead-in or the section subtitle conveying it)

Or use the table feature: section "Frequently Asked Questions" with a 2-column table (Question | Answer). This is acceptable and renders cleanly with the existing template's table support.

**Steps:**

- [ ] **Step 1: Read the existing article structure for reference**

Read one existing article entry to confirm the JSON shape:
```bash
jq '.academy_articles.uv_damage_acrylic_restoration' src/content/en.json | head -100
```

Note the exact nesting and key names.

- [ ] **Step 2: Add `academy.articles[]` card entry**

In `src/content/en.json`, find the `academy.articles[]` array. Add a new entry at the END (after the last existing entry):

```json
{
  "number": "16",
  "title": "Sun-Damaged Leather Seats: Mediterranean Climate Restoration",
  "excerpt": "Why Mediterranean sun and dry heat age leather faster than humid climates — early signs, restoration vs reupholster cost, and when the seats genuinely can't be saved.",
  "slug": "leather-seats-mediterranean-restoration",
  "date": "2026-05-07",
  "status": "draft"
}
```

Use the Edit tool with surrounding context (the closing `}` of the last existing article + a comma) to add the new entry safely.

- [ ] **Step 3: Add `academy_articles.leather_seats_mediterranean_restoration` content entry**

This is the substantive article body. The implementer subagent must DRAFT THE FULL CONTENT following the specifications above. The content fills this shape:

```json
"leather_seats_mediterranean_restoration": {
  "title": "Sun-Damaged Leather Seats: Mediterranean Climate Restoration",
  "description": "<60-100 word hook>",
  "seo_title": "<≤ 60 chars, Google-optimized>",
  "seo_description": "<≤ 158 chars, search-intent>",
  "intro": "<60-100 words>",
  "sections": [
    {
      "number": "1",
      "title": "<Section 1 title>",
      "paragraphs": ["<para 1>", "<para 2>"],
      "key_params": ["<bullet 1>", "<bullet 2>", "<bullet 3>", "<bullet 4>"]
    },
    {
      "number": "2",
      "title": "<Section 2 title>",
      "paragraphs": ["<para 1>", "<para 2>", "<para 3>"]
    },
    {
      "number": "3",
      "title": "<Section 3 title>",
      "paragraphs": ["<para 1>", "<para 2>"],
      "table": {
        "caption": "<caption>",
        "headers": ["<col 1>", "<col 2>", "<col 3>"],
        "rows": [["<r1c1>", "<r1c2>", "<r1c3>"], ["..."]]
      }
    },
    {
      "number": "4",
      "title": "When Restoration ISN'T Worth It",
      "paragraphs": ["<honest framing>", "<...>"]
    },
    {
      "number": "5",
      "title": "Frequently Asked Questions",
      "paragraphs": [
        "<Q1 phrased as section opener>: <A1>",
        "<Q2>: <A2>",
        "<Q3>: <A3>",
        "<Q4>: <A4>"
      ]
    }
  ]
}
```

The implementer drafts the actual prose for each `<...>` placeholder, following the content beats and constraints listed at the top of this Task. Aim for natural prose, not bullet-formatted text. Each paragraph should be a complete idea, citation-ready.

Add this entire object as a new key inside the `academy_articles` object in `src/content/en.json`. The new key sits among the existing 15 keys (alphabetical placement preferred but not required — JSON object key order is just for human readability).

- [ ] **Step 4: Verify JSON validity**

Run:
```bash
jq '.' src/content/en.json > /dev/null && echo "valid"
```
Expected: prints `valid`.

Run:
```bash
jq '.academy.articles | map(.slug) | length' src/content/en.json
```
Expected: `16` (was 15, +1).

Run:
```bash
jq '.academy_articles | keys | length' src/content/en.json
```
Expected: `16` (was 15, +1).

- [ ] **Step 5: Verify draft is invisible in build**

Run: `npm run build`
Expected: 0 errors. Page count UNCHANGED at 262 (draft article does NOT generate a page because of the status filter in `[slug].astro`).

Run:
```bash
find dist -name 'leather-seats-mediterranean-restoration*' 2>/dev/null
```
Expected: empty (no page generated for the draft).

- [ ] **Step 6: Update QA log**

Edit `docs/CONTENT_QA_LOG.md`. Find the row for this article (slug `leather-seats-mediterranean-restoration`) and update:
- "Date drafted: 2026-05-07" in the per-article notes section

- [ ] **Step 7: Commit**

```bash
git add src/content/en.json docs/CONTENT_QA_LOG.md
git commit -m "Draft academy article: leather seats Mediterranean restoration (interior-leather, status=draft)"
```

---

### Task 4: Draft Article 2 — Water Stain Removal Car Windows (glass-polishing hub)

**Files:**
- Modify: `src/content/en.json`
- Modify: `docs/CONTENT_QA_LOG.md`

Same workflow as Task 3. Specs below.

**Article specifications:**

- **Slug:** `water-stain-removal-car-windows`
- **Content key:** `water_stain_removal_car_windows`
- **Number:** `17`
- **Date:** `2026-05-07`
- **Status:** `draft`
- **Length:** 1800-2400 words, 4-5 sections
- **Audience:** owners with hard-water spotting on side windows and windshields, common in Barcelona's coastal areas (Castelldefels, Alella) and from sprinkler systems in private garages

**Required content beats:**

- What hard-water mineral deposits actually do to glass (etching mechanism — calcium and magnesium carbonate bonding to silica surface)
- Why early-stage stains can be polished and late-stage etching cannot (the threshold where polishing flips from solving the problem to merely removing the surface layer)
- DIY remedies that don't work (vinegar, alcohol, bar-keeper's friend) and why
- Professional polishing process: timeline (1-3 hours per car window set), abrasive grades, final result
- Cost framework: polishing 89-189 EUR, replacement 250-800+ EUR per pane — ROI math
- Honest section on "If polishing won't work" — when replacement is the only option
- Local angle: Mediterranean coastal salt-spray accelerates calcium deposit formation; vehicles parked outdoors in Castelldefels see this faster than inland Sant Cugat

**Local references that MUST appear:**

- Castelldefels, Sant Cugat, Barcelona at minimum
- Reference to coastal vs inland water hardness differential
- Concrete pricing using `serviceProfiles['glass-polishing'].startingPriceEur = 89` as anchor

**Steps:** Identical structure to Task 3 (Steps 1-7). Draft the article in JSON following all the content beats above, using the same 4-5 section structure with one section dedicated to "When polishing won't work" and one section as Frequently Asked Questions.

- [ ] **Step 1: Add `academy.articles[]` card entry** (number "17", slug `water-stain-removal-car-windows`, status `draft`, date `2026-05-07`)
- [ ] **Step 2: Add `academy_articles.water_stain_removal_car_windows` full content** (1800-2400 words across 4-5 sections, following content beats)
- [ ] **Step 3: Verify JSON valid**: `jq '.' src/content/en.json > /dev/null && echo valid` → expected `valid`. `jq '.academy.articles | length' src/content/en.json` → 17.
- [ ] **Step 4: Build verification**: `npm run build` → 0 errors, 262 pages (unchanged — draft invisible).
- [ ] **Step 5: Update QA log** with date drafted entry for this article.
- [ ] **Step 6: Commit**: `git add src/content/en.json docs/CONTENT_QA_LOG.md && git commit -m "Draft academy article: water stain removal car windows (glass-polishing, status=draft)"`

---

### Task 5: Draft Article 3 — Yellow vs Cloudy Headlights (headlight-restoration hub)

**Files:**
- Modify: `src/content/en.json`
- Modify: `docs/CONTENT_QA_LOG.md`

**Article specifications:**

- **Slug:** `yellow-vs-cloudy-headlights-causes-lifespan`
- **Content key:** `yellow_vs_cloudy_headlights_causes_lifespan`
- **Number:** `18`
- **Date:** `2026-05-07`
- **Status:** `draft`
- **Length:** 1800-2400 words, 4-5 sections
- **Audience:** Spanish ITV (Inspección Técnica de Vehículos) candidates who fail headlight clarity tests, plus general owners noticing reduced night driving visibility

**Required content beats:**

- The fundamental difference between yellowing (UV + clear-coat photo-degradation) and clouding (oxidation, micro-pitting, internal moisture)
- Why the distinction matters for restoration: yellowing can be polished out; advanced internal clouding cannot (the lens substrate itself is degraded)
- Lifespan expectations: stock OEM clear-coat lasts 5-7 years before yellowing in Mediterranean sun; restoration adds 2-4 years; ceramic-protected restoration adds 4-6 years
- ITV connection: failed headlight test triggers cost decision (polish 79 EUR vs replace 200-800 EUR per side)
- Restoration process: 30-90 min per pair, sanding grades, sealant application
- Honest section: when even restoration won't help (delaminated reflector, internal moisture, broken lens)
- Local angle: Mediterranean UV exposure rate vs northern Europe; specific neighborhoods with high outdoor parking (Castelldefels, Alella) see faster aging

**Local references:**

- Reference to Spanish ITV (the regulatory test most readers will know)
- Sant Cugat, Barcelona, Castelldefels mentions
- Concrete pricing using `serviceProfiles['headlight-restoration'].startingPriceEur = 79`

**Steps:**

- [ ] **Step 1: Add card entry** (number "18", slug `yellow-vs-cloudy-headlights-causes-lifespan`, status `draft`, date `2026-05-07`)
- [ ] **Step 2: Add full content** under `academy_articles.yellow_vs_cloudy_headlights_causes_lifespan` following the content beats (4-5 sections)
- [ ] **Step 3: Verify JSON valid + count = 18**
- [ ] **Step 4: Build verification (262 pages, unchanged)**
- [ ] **Step 5: Update QA log**
- [ ] **Step 6: Commit**: `git commit -m "Draft academy article: yellow vs cloudy headlights causes lifespan (headlight-restoration, status=draft)"`

---

### Task 6: Draft Article 4 — UV Damage Motorcycle Yacht Acrylic (acrylic-restoration hub)

**Files:**
- Modify: `src/content/en.json`
- Modify: `docs/CONTENT_QA_LOG.md`

**Article specifications:**

- **Slug:** `uv-damage-motorcycle-yacht-acrylic`
- **Content key:** `uv_damage_motorcycle_yacht_acrylic`
- **Number:** `19`
- **Date:** `2026-05-07`
- **Status:** `draft`
- **Length:** 1800-2400 words, 4-5 sections
- **Audience:** motorcycle owners in Barcelona / Sant Cugat / Castelldefels (visor and windscreen acrylic) and yacht owners on the Maresme coast (instrument panel and porthole acrylic). Hub already has 1 spoke (uv-damage-acrylic-restoration) — this article complements it by focusing on motorcycle and yacht use cases specifically rather than generic acrylic.

**Required content beats:**

- Polycarbonate vs acrylic distinction — why motorcycle visors typically use polycarbonate while yacht ports use acrylic, and how each degrades differently
- Maresme coastal angle: salt + UV + heat triple-stress accelerates degradation 30-40% faster than inland exposure (concrete percentage from manufacturer data)
- Restoration techniques: which surfaces respond well, which don't (polycarbonate substrate is more fragile and softens before it polishes cleanly)
- Cost framework: 99 EUR motorcycle visor restoration, 200-450 EUR per yacht porthole, 600-1500 EUR for full instrument cluster restoration
- DIY warning: aggressive grit polishes ruin polycarbonate visors permanently (real loss of optical clarity)
- Honest section: when replacement is unavoidable (deep cracking, internal delamination, severely brittle material)
- Local angle: specific reference to Castelldefels marina, Alella coastal exposure, common motorcycle parking patterns in Barcelona

**Local references:**

- Maresme coast, Castelldefels, Alella · Tiana · Teià
- Reference to coastal salt impact
- Concrete pricing using `serviceProfiles['acrylic-restoration'].startingPriceEur = 99`

**Steps:**

- [ ] **Step 1: Add card entry** (number "19", slug `uv-damage-motorcycle-yacht-acrylic`, status `draft`, date `2026-05-07`)
- [ ] **Step 2: Add full content** under `academy_articles.uv_damage_motorcycle_yacht_acrylic` following content beats
- [ ] **Step 3: Verify JSON valid + count = 19**
- [ ] **Step 4: Build verification (262 pages, unchanged)**
- [ ] **Step 5: Update QA log**
- [ ] **Step 6: Commit**: `git commit -m "Draft academy article: UV damage motorcycle yacht acrylic (acrylic-restoration, status=draft)"`

---

### Task 7: Draft Article 5 — Detailing and Used Car Sale Price Catalonia (pre-sale-pack hub)

**Files:**
- Modify: `src/content/en.json`
- Modify: `docs/CONTENT_QA_LOG.md`

**Article specifications:**

- **Slug:** `detailing-used-car-sale-price-catalonia`
- **Content key:** `detailing_used_car_sale_price_catalonia`
- **Number:** `20`
- **Date:** `2026-05-07`
- **Status:** `draft`
- **Length:** 1800-2400 words, 4-5 sections
- **Audience:** owners preparing to sell on coches.net, autocasion, or wallapop in Catalonia. Commercial-intent content — readers are pre-decision and price-shopping detailing services.

**Required content beats:**

- The market mechanism: why detailing changes a buyer's first 60-second impression on a listing photo and showroom inspection
- Documented uplift data: real ranges from used-car dealer studies (most cite 5-15% sale price uplift for clean, well-photographed used cars vs comparable un-detailed listings)
- The categories: what detailing addresses (paint clarity, interior, glass, headlights) vs what it doesn't (mechanical, structural, accident history)
- Process for sellers: 4-hour pre-sale detail vs 8-hour full prep — when each is appropriate based on car age and listing price
- Cost framework: 249 EUR pre-sale pack vs estimated 800-3000 EUR sale price uplift on cars in 8000-25000 EUR range (typical Spanish used-car bracket)
- Photo strategy: which angles benefit most from detailing (front 3/4, paint reflection shots, wheel detail, interior wide-angle)
- Local angle: Sant Cugat / Pedralbes / Sarrià premium used market; what dealers in this area look for
- Honest section: when detailing won't move the needle (cars below 5000 EUR sale price, cars with major mechanical issues)

**Local references:**

- coches.net, autocasion (Spanish used-car platforms — most readers know these)
- Catalonia, Sant Cugat, Pedralbes
- Concrete pricing using `serviceProfiles['pre-sale-pack'].startingPriceEur = 249`

**Steps:**

- [ ] **Step 1: Add card entry** (number "20", slug `detailing-used-car-sale-price-catalonia`, status `draft`, date `2026-05-07`)
- [ ] **Step 2: Add full content** under `academy_articles.detailing_used_car_sale_price_catalonia` following content beats
- [ ] **Step 3: Verify JSON valid + count = 20**
- [ ] **Step 4: Build verification (262 pages, unchanged)**
- [ ] **Step 5: Update QA log**
- [ ] **Step 6: Commit**: `git commit -m "Draft academy article: detailing used car sale price Catalonia (pre-sale-pack, status=draft)"`

---

## Section 3 — Verification

### Task 8: Smoke test — verify drafts invisible in build

This task does NOT commit. Read-only verification.

- [ ] **Step 1: Clean build**

Run: `rm -rf dist && npm run build`
Expected: 0 errors, **262 pages** (unchanged from before Plan 3 — drafts must NOT generate pages).

- [ ] **Step 2: Confirm draft articles are NOT in `dist/`**

For each Wave 1 slug, verify the article does NOT have a directory:

```bash
for slug in \
  leather-seats-mediterranean-restoration \
  water-stain-removal-car-windows \
  yellow-vs-cloudy-headlights-causes-lifespan \
  uv-damage-motorcycle-yacht-acrylic \
  detailing-used-car-sale-price-catalonia; do
  result=$(find dist -type d -name "$slug" 2>/dev/null)
  if [ -z "$result" ]; then
    echo "OK: $slug not in dist (draft invisible)"
  else
    echo "FAIL: $slug found at $result (should be invisible)"
  fi
done
```
Expected: 5 lines all starting with `OK:`. None should `FAIL:`.

- [ ] **Step 3: Confirm draft articles are NOT in academy listing**

Run:
```bash
grep -E "leather-seats-mediterranean|water-stain-removal|yellow-vs-cloudy|uv-damage-motorcycle|detailing-used-car-sale" dist/en/academy/index.html
```
Expected: empty (no draft slugs leaked into the listing page).

If any output appears, the listing page rendering is missing a status filter — investigate.

- [ ] **Step 4: Confirm draft articles ARE in source JSON**

Run:
```bash
jq -r '.academy.articles | map(select(.status == "draft")) | map(.slug)' src/content/en.json
```
Expected: array with the 5 Wave 1 slugs.

- [ ] **Step 5: Confirm cluster components don't render drafts**

Drafts should be skipped by `<HubSpokeList>` because of the `status === 'published'` filter in `resolveSpoke`. Verify by spot-check on a hub page:

```bash
grep -E "leather-seats-mediterranean|water-stain-removal|yellow-vs-cloudy|uv-damage-motorcycle|detailing-used-car-sale" dist/en/services/interior-leather/index.html
```
Expected: empty (interior-leather hub does not link to its draft article — by design, until owner promotes).

- [ ] **Step 6: Confirm pre-existing pages still work**

Run:
```bash
ls dist/en/academy/uv-damage-acrylic-restoration/index.html dist/en/academy/headlight-restoration-guide-barcelona/index.html
```
Expected: both files exist (existing published articles unaffected).

- [ ] **Step 7: Final verification log update**

Edit `docs/CONTENT_QA_LOG.md` — under "Wave 1 articles (drafted YYYY-MM-DD)" header, replace `YYYY-MM-DD` with `2026-05-07`.

This is a small content change, not a separate commit — fold into Task 9's final commit if needed.

---

### Task 9: Final review and summary

This task does NOT commit unless Task 7's QA log update was missed. It's the wrap-up.

- [ ] **Step 1: Verify all 5 articles drafted**

Run:
```bash
for slug in leather-seats-mediterranean-restoration water-stain-removal-car-windows yellow-vs-cloudy-headlights-causes-lifespan uv-damage-motorcycle-yacht-acrylic detailing-used-car-sale-price-catalonia; do
  key=$(echo "$slug" | tr '-' '_')
  echo "=== $slug ==="
  jq ".academy_articles.$key | { title, intro: (.intro | length), sections: (.sections | length), seo_title }" src/content/en.json
done
```
Expected: 5 articles, each with title, intro length > 100 chars, sections array length 4-5, seo_title present.

- [ ] **Step 2: Verify each article has required content beats**

For each article, spot-check that the local references are present:

```bash
# Article 1 — interior-leather: should mention Mediterranean, Sant Cugat or Pedralbes, BMW/Mercedes/Audi/Tesla
jq -r '.academy_articles.leather_seats_mediterranean_restoration | (.intro + " " + (.sections | map(.paragraphs // [] | join(" ")) | join(" ")))' src/content/en.json | grep -ic -E "mediterranean|sant cugat|pedralbes|bmw|audi|mercedes|tesla"

# Article 2 — glass: Castelldefels or coastal
jq -r '.academy_articles.water_stain_removal_car_windows | (.intro + " " + (.sections | map(.paragraphs // [] | join(" ")) | join(" ")))' src/content/en.json | grep -ic -E "castelldefels|coastal|sant cugat|barcelona"

# Article 3 — headlights: ITV
jq -r '.academy_articles.yellow_vs_cloudy_headlights_causes_lifespan | (.intro + " " + (.sections | map(.paragraphs // [] | join(" ")) | join(" ")))' src/content/en.json | grep -ic "ITV"

# Article 4 — acrylic: maresme or coastal
jq -r '.academy_articles.uv_damage_motorcycle_yacht_acrylic | (.intro + " " + (.sections | map(.paragraphs // [] | join(" ")) | join(" ")))' src/content/en.json | grep -ic -E "maresme|castelldefels|coastal"

# Article 5 — pre-sale: coches.net or Spanish used car
jq -r '.academy_articles.detailing_used_car_sale_price_catalonia | (.intro + " " + (.sections | map(.paragraphs // [] | join(" ")) | join(" ")))' src/content/en.json | grep -ic -E "coches.net|catalonia|catalan"
```
Expected: each grep returns a number ≥ 1.

- [ ] **Step 3: Verify each article has concrete pricing**

```bash
for key in leather_seats_mediterranean_restoration water_stain_removal_car_windows yellow_vs_cloudy_headlights_causes_lifespan uv_damage_motorcycle_yacht_acrylic detailing_used_car_sale_price_catalonia; do
  count=$(jq -r ".academy_articles.$key | tostring" src/content/en.json | grep -cE '€|EUR|euro' )
  echo "$key: $count price mentions"
done
```
Expected: each article shows count ≥ 1 (concrete pricing from spec section 7 layer 5 QA item #4).

- [ ] **Step 4: Final commit if QA log needs update**

If `docs/CONTENT_QA_LOG.md` still has `YYYY-MM-DD` placeholder in the "Wave 1 articles" header, update it now to `2026-05-07` and commit:

```bash
git add docs/CONTENT_QA_LOG.md
git commit -m "Set Wave 1 draft date in CONTENT_QA_LOG to 2026-05-07"
```

If already updated in Task 8, skip this step.

- [ ] **Step 5: Generate final report**

Print summary:
```bash
echo "=== Plan 3 Wave 1 — Final Status ==="
echo "Build pages: $(find dist -name 'index.html' | wc -l) (expected 262)"
echo "Draft articles in JSON: $(jq -r '.academy.articles | map(select(.status == \"draft\")) | length' src/content/en.json) (expected 5)"
echo "Total academy articles in JSON: $(jq -r '.academy.articles | length' src/content/en.json) (expected 20)"
echo "All Wave 1 commits:"
git log --oneline | grep -E 'Draft academy article|CONTENT_QA' | head -10
```

---

## Summary of deliverables (after all 9 tasks)

- 1 modified file: `docs/CONTENT_QA_CHECKLIST.md` (promotion workflow appended)
- 1 new file: `docs/CONTENT_QA_LOG.md` (per-article tracking table)
- 1 modified file: `src/content/en.json` (5 new academy.articles[] entries + 5 new academy_articles{} entries)
- 7 commits (1 setup + 5 article drafts + 1 final QA log update)
- 5 academy articles in `status: "draft"` — invisible to public, ready for owner review
- 0 SEO impact (intentional — gates on owner review)

After deploy: drafts are invisible. Owner reviews via 8-pt QA checklist whenever ready, flips `status: "draft"` → `"published"` per article. Each promotion = 1 commit, 1 article live.

---

## Self-review checklist (executor verifies after Task 9)

1. ✅ All 5 articles in `status: "draft"`
2. ✅ Build is 262 pages (unchanged — no drafts in output)
3. ✅ Each article has 1800-2400 words across 4-5 sections
4. ✅ Each article includes required local references and concrete pricing
5. ✅ Each article includes a "When this won't help" honest section
6. ✅ Each article includes a "Frequently Asked Questions" final section
7. ✅ JSON files remain valid
8. ✅ `docs/CONTENT_QA_LOG.md` shows 5 entries, all in 📝 Drafted state
9. ✅ Pre-existing 15 academy articles still work (live URLs unaffected)

---

## Subsequent waves (NOT in this plan)

- **Wave 2** (separate plan): 5 more EN drafts (e.g., Trim Restoration Mediterranean, Wheel Coating Maintenance, Engine Bay Concours — but only if owner activates these hidden services first; otherwise pivot to vertical hub spokes for /ev, /business, /plans, /commercial-glass)
- **Wave 3+**: ES translations of approved Wave 1
- **Wave 4+**: CA translations of approved Wave 1
- **Wave 5+**: ES + CA of Wave 2

Plan: never publish > 2 articles per week per language to avoid HCU "scaled content" pattern detection.

---

**Plan complete.**
