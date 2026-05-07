# Programmatic Pages — Full Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand from 12 canary programmatic pages (ES only, 4 areas × 3 services) to **126 full-rollout programmatic pages** (3 langs × 42 pairs: 3 top areas × 6 active services + 8 secondary areas × 3 top services), with two quality improvements applied (consistent `tWithLang` plumbing + landmarks in Slot 1 to mitigate the barcelona/pedralbes uniqueness risk flagged by the canary final review).

**Architecture:** Same template + generator infrastructure as Plan 2. Three changes: (1) rename `CANARY_PAIRS` → `ALL_PAIRS` with 42 entries; (2) `getStaticPaths` renders all 3 langs (en + es + ca); (3) Slot 1 generator gains a 5th sentence using `area.landmarks` to differentiate near-identical area pairs. No new files; only modifications.

**Tech Stack:** Astro 4 (SSG), TypeScript strict, TailwindCSS 3, JSON-driven i18n. Validation: `npm run check` + `npm run build` + dist HTML inspection.

---

## ⚠️ PRECONDITION GATE — Canary Verification

**This plan must NOT execute until canary verification has passed.**

Before starting any task in this plan, the executor (or owner) must confirm:

1. **Canary deployed ≥ 7 days ago.** Check: `git log --oneline -1 -- "src/pages/[lang]/areas/[city]/[service].astro"` should show commit `7be468a` deployed at least 7 days before today.

2. **`docs/CANARY_VERIFICATION.md` checklist completed.** The 12 canary URLs must show ≥ 10/12 indexed in GSC (≥ 80% threshold from spec).

3. **No GSC manual actions** affecting `/es/areas/*/*` paths.

4. **No "soft 404" or "thin content" warnings** in GSC Coverage report for canary URLs.

If any of the above fails:
- **80% > indexed ≥ 60%** → execute Plan 2 refinement first (add more uniqueness to slots) before proceeding here
- **indexed < 60%** OR manual action present → halt; revert canary; root-cause before retry

If all preconditions pass — proceed to Task 1.

To skip this gate (e.g., owner explicitly accepts elevated risk and wants rollout regardless of canary signal), document the override in the canary verification log and proceed. **Default: do not skip.**

---

## Scope

**In scope (Plan 2.5 = full rollout):**
- Replace `CANARY_PAIRS` (12 entries) with `ALL_PAIRS` (42 entries — 3 top areas × 6 active services + 8 secondary areas × 3 top services)
- Expand `getStaticPaths` to render all 3 languages (EN, ES, CA)
- Improve `generateIntroBody` to add a 5th sentence using `area.landmarks` (mitigates barcelona/pedralbes uniqueness gap)
- Apply maintainability fix: pass `tWithLang` to all 4 slot generators (consistency, future-proofs Plan 3 work)
- Create `docs/FULL_ROLLOUT_MONITORING.md` — operational playbook for post-deploy weeks 1-4

**Out of scope:**
- Rendering programmatic pages for hidden services (`trim-restoration`, `wheel-ceramic`, `engine-bay`) — see "Inactive services rationale" below
- Adding more area×service pages beyond the 42 (would need stronger unique-content infrastructure first)
- Adding programmatic pages to llms.txt (would bloat the file from ~57 lines to ~200+; not standard practice)
- Hub-side reverse links to programmatic pages (still discoverable via sitemap; can revisit if data shows discovery problems)

### Inactive services rationale

The original spec section 6 specified 51 pairs (top 3 areas × all 9 services + 8 secondary × top 3). This plan ships 42 pairs (top 3 × **6 active** services + 8 × top 3) — the 9 pages for `trim-restoration` / `wheel-ceramic` / `engine-bay` on top areas are deliberately excluded.

**Reason:** these services have `hubActive: false` in `clusterMap.ts` (no service hub page exists, no `pricing` page entry). Rendering programmatic pages for them would:
- Surface services in search that the business does not actively offer → broken customer expectation when WhatsApp inquiry comes in
- Create dead "Back to {service} packages" links pointing to non-existent hubs
- Risk Google flagging as low-quality (ghost services)

If the owner activates trim/wheel/engine in the future, expanding `ALL_PAIRS` to 51 is a 2-line edit.

---

## Full pair set — exact 42 pairs

### Top tier: 3 areas × 6 active services = 18 pairs

| Area | Services |
|---|---|
| sant-cugat | car-paint-correction, glass-polishing, acrylic-restoration, headlight-restoration, interior-leather, pre-sale-pack |
| barcelona | car-paint-correction, glass-polishing, acrylic-restoration, headlight-restoration, interior-leather, pre-sale-pack |
| terrassa | car-paint-correction, glass-polishing, acrylic-restoration, headlight-restoration, interior-leather, pre-sale-pack |

### Secondary tier: 8 areas × 3 top services = 24 pairs

| Area | Services |
|---|---|
| pedralbes | car-paint-correction, glass-polishing, headlight-restoration |
| sant-gervasi | car-paint-correction, glass-polishing, headlight-restoration |
| bellaterra | car-paint-correction, glass-polishing, headlight-restoration |
| sant-just-desvern | car-paint-correction, glass-polishing, headlight-restoration |
| sant-quirze-del-valles | car-paint-correction, glass-polishing, headlight-restoration |
| matadepera | car-paint-correction, glass-polishing, headlight-restoration |
| castelldefels | car-paint-correction, glass-polishing, headlight-restoration |
| alella-tiana-teia | car-paint-correction, glass-polishing, headlight-restoration |

**Total: 42 pairs × 3 langs = 126 programmatic pages**

After Plan 2.5: **136 base pages + 126 programmatic = 262 pages total** (was 148 with canary).

---

## File Structure

### Modified files
- `src/lib/areaServiceContent.ts` — three changes:
  1. Rename `CANARY_PAIRS` → `ALL_PAIRS`, expand to 42 entries
  2. `generateIntroBody` adds a 5th sentence using `area.landmarks` (uniqueness booster)
  3. All four slot generators accept and use `tWithLang` consistently (maintainability)
- `src/pages/[lang]/areas/[city]/[service].astro` — two changes:
  1. Import `ALL_PAIRS` instead of `CANARY_PAIRS`
  2. `getStaticPaths` iterates all 3 languages

### New files
- `docs/FULL_ROLLOUT_MONITORING.md` — operational playbook for weeks 1-4 post-deploy

### Files NOT touched
- `src/content/{en,es,ca}.json` — translations from Plan 2 already cover all needs. The duration_hours dictionary already has 6 entries (matches our 6 active services). No additions needed.
- `src/lib/areaProfiles.ts`, `src/lib/serviceProfiles.ts`, `src/lib/clusterMap.ts` — frozen as-is. The `// VERIFY` markers in areaProfiles carry forward; the elevated-risk acknowledgment from Plan 2 is now applied to 126 pages instead of 12.
- `public/llms.txt` — not bloated with programmatic page list

---

## Pre-flight check

- [ ] **Step 1: Verify clean working tree**

Run: `git status --short`
Expected: clean (or only the pre-existing untracked files: `.claude/settings.local.json`, `Book/`, `restorelab_action_plan.md`).

- [ ] **Step 2: Verify Plan 2 deployed and canary live**

Run: `git log --oneline -1`
Expected: HEAD is `0c3901b Add canary verification checklist (7-day post-deploy decision tree)` or later.

Run: `curl -s -o /dev/null -w "%{http_code}" https://restorelab.io/es/areas/sant-cugat/car-paint-correction`
Expected: `200`. (Canary is live.)

- [ ] **Step 3: Confirm precondition gate**

Open `docs/CANARY_VERIFICATION.md` (or check `git log --since="7 days ago"` for the canary commit timestamp). Confirm:
- ≥ 7 days since canary push
- Verification checklist filled in
- Indexation ≥ 80% (10+ of 12)
- No manual actions / soft 404s / thin-content warnings

If gate fails — STOP. Do not proceed to Task 1.

- [ ] **Step 4: Verify build passes**

Run: `npm run build`
Expected: 0 errors, 148 pages.

---

## Section 1 — Generator improvements

### Task 1: Update `areaServiceContent.ts` with 3 changes (rename, landmarks sentence, tWithLang consistency)

**Files:**
- Modify: `src/lib/areaServiceContent.ts`

This task makes 3 surgical changes to one file:
1. Rename `CANARY_PAIRS` → `ALL_PAIRS`, expand from 12 to 42 entries
2. Add 5th sentence to `generateIntroBody` using `area.landmarks` (boosts uniqueness)
3. Pass `tWithLang` to all four slot generators (was inconsistent — generateFaqs got it, others got bare `t`)

- [ ] **Step 1: Read current file**

Open `src/lib/areaServiceContent.ts`. Note the current shape:
- `CANARY_PAIRS` at the bottom (12 entries)
- `generateAreaServiceContent` calls 4 slot generators
- Of those, only `generateFaqs` receives `tWithLang`; `generateIntroBody`, `generatePricingTravelLine`, `generateTrustCaseLine` get bare `t`

- [ ] **Step 2: Add landmarks sentence to `generateIntroBody`**

Find the existing function `generateIntroBody`. After Sentence 4 (the price anchor), add Sentence 5 conditionally based on whether `area.landmarks` has entries.

Replace the entire function with this version. Use the Edit tool with the function's existing body as `old_string` and this new body:

```ts
/** Slot 1 — Local hook intro paragraph (80–150 words). Template-driven, area-conditional. */
function generateIntroBody(area: AreaProfile, service: ServiceProfile, t: any, lang: Lang): string {
  const serviceName = getServiceName(service.id, t);
  const sentences: string[] = [];

  // Sentence 1: Service contextualization for the area
  if (lang === 'es') {
    sentences.push(`En ${area.name}, los propietarios de ${area.commonCarBrands.slice(0, 3).join(', ')} solicitan habitualmente ${serviceName.toLowerCase()} para mantener el acabado del vehículo.`);
  } else if (lang === 'ca') {
    sentences.push(`A ${area.name}, els propietaris de ${area.commonCarBrands.slice(0, 3).join(', ')} sol·liciten habitualment ${serviceName.toLowerCase()} per mantenir l'acabat del vehicle.`);
  } else {
    sentences.push(`In ${area.name}, owners of ${area.commonCarBrands.slice(0, 3).join(', ')} regularly request ${serviceName.toLowerCase()} to maintain their vehicle's finish.`);
  }

  // Sentence 2: Climate-driven framing
  if (lang === 'es') {
    sentences.push(`El microclima local — ${area.climateMicro} — afecta directamente el desgaste de la pintura y los faros.`);
  } else if (lang === 'ca') {
    sentences.push(`El microclima local — ${area.climateMicro} — afecta directament el desgast de la pintura i els fars.`);
  } else {
    sentences.push(`The local microclimate — ${area.climateMicro} — directly affects paint and headlight wear.`);
  }

  // Sentence 3: Mobile / parking context
  if (lang === 'es') {
    sentences.push(`Nuestro servicio móvil llega hasta ${area.parkingContext} en ${area.name}, sin necesidad de desplazar tu coche a un taller.`);
  } else if (lang === 'ca') {
    sentences.push(`El nostre servei mòbil arriba fins a ${area.parkingContext} a ${area.name}, sense necessitat de desplaçar el cotxe a un taller.`);
  } else {
    sentences.push(`Our mobile service comes to ${area.parkingContext} in ${area.name} — no need to drop your car at a workshop.`);
  }

  // Sentence 4: Pricing anchor
  const priceText = service.startingPriceEur ? `€${service.startingPriceEur}` : '';
  if (priceText) {
    if (lang === 'es') {
      sentences.push(`${serviceName} desde ${priceText}, con presupuesto previo gratuito.`);
    } else if (lang === 'ca') {
      sentences.push(`${serviceName} des de ${priceText}, amb pressupost previ gratuït.`);
    } else {
      sentences.push(`${serviceName} from ${priceText}, with free upfront quote.`);
    }
  }

  // Sentence 5: Landmarks (uniqueness booster). Only render if landmarks exist.
  // Picks up to 2 landmarks to keep the sentence natural-length.
  if (area.landmarks.length > 0) {
    const landmarks = area.landmarks.slice(0, 2).join(', ');
    if (lang === 'es') {
      sentences.push(`Trabajamos cerca de ${landmarks} y en cualquier dirección de ${area.name}.`);
    } else if (lang === 'ca') {
      sentences.push(`Treballem prop de ${landmarks} i a qualsevol adreça de ${area.name}.`);
    } else {
      sentences.push(`We work near ${landmarks} and at any address in ${area.name}.`);
    }
  }

  return sentences.join(' ');
}
```

- [ ] **Step 3: Update slot generators to accept `tWithLang` consistently**

Three small signature changes for consistency. Each function already accepts `t: any` as last (or close to last) param — change the signature comments and ensure callers pass the language-tagged version.

Update `generatePricingTravelLine`:

Replace the entire function with:
```ts
/** Slot 4 — Pricing snippet with localized travel fee line. */
function generatePricingTravelLine(area: AreaProfile, t: any): string {
  const asp = t.area_service_pages;
  if (area.travelFee === 0) {
    return substitute(asp.pricing_travel_fee_included, { area: area.name });
  }
  return substitute(asp.pricing_travel_fee_charged, { area: area.name, fee: String(area.travelFee) });
}
```

(This is identical to the current implementation — the consistency fix is in HOW it's called from `generateAreaServiceContent`, not in the function itself.)

Update `generateTrustCaseLine`:
```ts
/** Slot 5 — Trust signal: case count line. Falls back to generic if caseCount is "0". */
function generateTrustCaseLine(area: AreaProfile, t: any): string {
  const asp = t.area_service_pages;
  if (!area.caseCount || area.caseCount === '0') {
    return asp.trust_generic;
  }
  return substitute(asp.trust_case_count_template, { count: area.caseCount, area: area.name });
}
```

(Same — no body change. The fix is in the caller.)

- [ ] **Step 4: Update `generateAreaServiceContent` to pass `tWithLang` consistently**

Find the function `generateAreaServiceContent`. The fix: pass `tWithLang` (not `t`) to all four slot generators.

Replace the body of `generateAreaServiceContent` with:

```ts
export function generateAreaServiceContent(
  citySlug: string,
  serviceId: string,
  t: any,
  lang: Lang
): AreaServiceSlots | null {
  const area = areaProfiles[citySlug];
  const service = serviceProfiles[serviceId];
  if (!area || !service || !service.active) return null;

  // Inject lang into t for branch logic in generators (without mutating original t).
  const tWithLang = { ...t, lang };
  const asp = t.area_service_pages;
  const serviceName = getServiceName(service.id, t);
  const priceStr = service.startingPriceEur ? String(service.startingPriceEur) : '';

  return {
    title: substitute(asp.title_template, { area: area.name, service: serviceName }),
    metaDescription: substitute(asp.meta_description_template, { area: area.name, service: serviceName, price: priceStr }),
    h1: substitute(asp.h1_template, { area: area.name, service: serviceName }),
    subtitle: substitute(asp.subtitle_template, { area: area.name, service: serviceName.toLowerCase() }),
    introLabel: asp.intro_label,
    introBody: generateIntroBody(area, service, tWithLang, lang),
    pricingLabel: asp.pricing_label,
    pricingStartingFrom: substitute(asp.pricing_starting_from, { price: priceStr }),
    pricingTravelLine: generatePricingTravelLine(area, tWithLang),
    trustLabel: substitute(asp.trust_label, { area: area.name }),
    trustCaseLine: generateTrustCaseLine(area, tWithLang),
    trustGeneric: asp.trust_generic,
    faqLabel: asp.faq_label,
    faqs: generateFaqs(area, service, tWithLang),
    ctaTitle: substitute(asp.cta_title, { area: area.name, service: serviceName }),
    ctaSubtitle: asp.cta_subtitle,
    ctaWhatsappText: substitute(asp.cta_whatsapp_template, { area: area.name, service: serviceName }),
    backToAreaLabel: substitute(asp.back_to_area, { area: area.shortName }),
    backToServiceLabel: substitute(asp.back_to_service, { service: serviceName.toLowerCase() }),
  };
}
```

The change is on the four lines that previously read:
- `introBody: generateIntroBody(area, service, t, lang),` → `tWithLang, lang`
- `pricingTravelLine: generatePricingTravelLine(area, t),` → `tWithLang`
- `trustCaseLine: generateTrustCaseLine(area, t),` → `tWithLang`
- `faqs: generateFaqs(area, service, tWithLang),` (already correct — leave as-is)

- [ ] **Step 5: Replace `CANARY_PAIRS` with `ALL_PAIRS` (42 entries)**

Find the existing `CANARY_PAIRS` export at the bottom of the file. Replace with:

```ts
/** All programmatic pairs for full rollout. 42 entries.
 *  Composition:
 *    - Top tier: 3 areas (sant-cugat, barcelona, terrassa) × 6 active services = 18
 *    - Secondary: 8 areas × top 3 services (car-paint-correction, glass-polishing, headlight-restoration) = 24
 *
 *  Hidden services (trim-restoration, wheel-ceramic, engine-bay) are NOT generated —
 *  see Plan 2.5 doc "Inactive services rationale" for reasoning. To re-enable them,
 *  add their IDs to `topActiveServices` below.
 */
export const ALL_PAIRS: Array<{ city: string; service: string }> = (() => {
  const topAreas = ['sant-cugat', 'barcelona', 'terrassa'] as const;
  const topActiveServices = [
    'car-paint-correction',
    'glass-polishing',
    'acrylic-restoration',
    'headlight-restoration',
    'interior-leather',
    'pre-sale-pack',
  ] as const;
  const secondaryAreas = [
    'pedralbes',
    'sant-gervasi',
    'bellaterra',
    'sant-just-desvern',
    'sant-quirze-del-valles',
    'matadepera',
    'castelldefels',
    'alella-tiana-teia',
  ] as const;
  const topThreeServices = ['car-paint-correction', 'glass-polishing', 'headlight-restoration'] as const;

  const pairs: Array<{ city: string; service: string }> = [];
  for (const city of topAreas) {
    for (const service of topActiveServices) pairs.push({ city, service });
  }
  for (const city of secondaryAreas) {
    for (const service of topThreeServices) pairs.push({ city, service });
  }
  return pairs;
})();

/** Backward-compat alias — points to ALL_PAIRS.
 *  Plan 2's template imports `CANARY_PAIRS`; that import will be updated in Task 2.
 *  This alias keeps the file from breaking if any external consumer hasn't migrated. */
export const CANARY_PAIRS = ALL_PAIRS;
```

- [ ] **Step 6: Type-check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 7: Verify ALL_PAIRS count and shape**

Run a one-off node check:
```bash
node -e "import('./src/lib/areaServiceContent.ts').catch(()=>{})"
```
(This may fail because Node can't import .ts directly without tsx — that's OK.)

Better, do a literal count via grep:
```bash
grep -c "{ city:" src/lib/areaServiceContent.ts
```
Expected: 0 (the IIFE generates the pairs at runtime; we don't write 42 literals).

Better verification — use Astro to confirm at build time. Just proceed to next step's build.

- [ ] **Step 8: Don't build yet** — the template still imports `CANARY_PAIRS` and only renders ES. Expanding to all 3 langs would generate 42×3=126 pages but the template hasn't been updated. Leave the build for after Task 2.

- [ ] **Step 9: Commit**

```bash
git add src/lib/areaServiceContent.ts
git commit -m "Extend areaServiceContent for full rollout (ALL_PAIRS=42, landmarks slot 1, tWithLang consistency)"
```

---

## Section 2 — Template expansion

### Task 2: Update programmatic template to render all 3 languages with `ALL_PAIRS`

**Files:**
- Modify: `src/pages/[lang]/areas/[city]/[service].astro`

Two surgical changes:
1. Import `ALL_PAIRS` instead of `CANARY_PAIRS`
2. `getStaticPaths` iterates all 3 languages (en, es, ca) instead of ES only

- [ ] **Step 1: Read the current file to identify exact change points**

Open `src/pages/[lang]/areas/[city]/[service].astro`. Find these two lines/blocks in the frontmatter:

Current import (line ~6):
```ts
import { generateAreaServiceContent, CANARY_PAIRS, type Lang } from '@/lib/areaServiceContent';
```

Current `getStaticPaths` (around lines 16-27):
```ts
export function getStaticPaths() {
  // Canary scope: ES only. CANARY_PAIRS = 12 (city, service) tuples.
  const langs: Array<{ lang: Lang; t: any }> = [
    { lang: 'es', t: es },
  ];

  return langs.flatMap(({ lang, t }) =>
    CANARY_PAIRS.map((pair) => ({
      params: { lang, city: pair.city, service: pair.service },
      props: { t, lang, citySlug: pair.city, serviceId: pair.service },
    }))
  );
}
```

- [ ] **Step 2: Update the import**

Use Edit tool with `old_string`:
```
import { generateAreaServiceContent, CANARY_PAIRS, type Lang } from '@/lib/areaServiceContent';
```
and `new_string`:
```
import { generateAreaServiceContent, ALL_PAIRS, type Lang } from '@/lib/areaServiceContent';
```

- [ ] **Step 3: Update `getStaticPaths`**

Use Edit tool to replace the existing `getStaticPaths` block:

`old_string`:
```ts
export function getStaticPaths() {
  // Canary scope: ES only. CANARY_PAIRS = 12 (city, service) tuples.
  const langs: Array<{ lang: Lang; t: any }> = [
    { lang: 'es', t: es },
  ];

  return langs.flatMap(({ lang, t }) =>
    CANARY_PAIRS.map((pair) => ({
      params: { lang, city: pair.city, service: pair.service },
      props: { t, lang, citySlug: pair.city, serviceId: pair.service },
    }))
  );
}
```

`new_string`:
```ts
export function getStaticPaths() {
  // Full rollout: 3 langs × 42 ALL_PAIRS = 126 programmatic pages.
  const langs: Array<{ lang: Lang; t: any }> = [
    { lang: 'en', t: en },
    { lang: 'es', t: es },
    { lang: 'ca', t: ca },
  ];

  return langs.flatMap(({ lang, t }) =>
    ALL_PAIRS.map((pair) => ({
      params: { lang, city: pair.city, service: pair.service },
      props: { t, lang, citySlug: pair.city, serviceId: pair.service },
    }))
  );
}
```

- [ ] **Step 4: Type-check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: 0 errors, **262 pages** (was 148; +114 new programmatic pages: 126 total programmatic minus 12 already-counted canary).

- [ ] **Step 6: Verify exactly 126 programmatic pages built**

Run:
```bash
find dist -mindepth 4 -path '*/areas/*/*/index.html' | wc -l
```
Expected: `126`.

Run per-language:
```bash
find dist/en -mindepth 4 -path '*/areas/*/*/index.html' | wc -l
find dist/es -mindepth 4 -path '*/areas/*/*/index.html' | wc -l
find dist/ca -mindepth 4 -path '*/areas/*/*/index.html' | wc -l
```
Expected: each prints `42`.

- [ ] **Step 7: Spot-check one page per language renders correctly**

Run:
```bash
grep -c '"@type":"Service"' dist/en/areas/sant-cugat/car-paint-correction/index.html
grep -c '"@type":"Service"' dist/es/areas/sant-cugat/car-paint-correction/index.html
grep -c '"@type":"Service"' dist/ca/areas/sant-cugat/car-paint-correction/index.html
```
Expected: each ≥ 1 (Service schema present).

Run:
```bash
grep -c "Trabajamos cerca de" dist/es/areas/sant-cugat/car-paint-correction/index.html
grep -c "Treballem prop de" dist/ca/areas/sant-cugat/car-paint-correction/index.html
grep -c "We work near" dist/en/areas/sant-cugat/car-paint-correction/index.html
```
Expected: each ≥ 1 (the new landmarks sentence renders in all 3 langs).

- [ ] **Step 8: Spot-check the previously-flagged barcelona/pedralbes uniqueness gap**

Both have `travelFee: 0`. Verify the new landmarks sentence differentiates them:

Run:
```bash
grep -A 1 "We work near" dist/en/areas/barcelona/car-paint-correction/index.html | head -2
grep -A 1 "We work near" dist/en/areas/pedralbes/car-paint-correction/index.html | head -2
```
Expected:
- barcelona: mentions "Sagrada Família, Parc de la Ciutadella" (or similar from areaProfiles.barcelona.landmarks)
- pedralbes: mentions "Monestir de Pedralbes, Palau Reial" (or similar)

Confirm the two pages now have distinct text in this sentence. This is the critical uniqueness check from canary final review.

- [ ] **Step 9: Commit**

```bash
git add "src/pages/[lang]/areas/[city]/[service].astro"
git commit -m "Roll out programmatic pages to all 3 langs and 42 pairs (126 pages total)"
```

---

## Section 3 — Verification & Monitoring

### Task 3: Smoke test the full rollout

This task does NOT commit — read-only verification. If issues are found, do not proceed to Task 4. Report them and let the controller dispatch fixes.

- [ ] **Step 1: Confirm exact 126 page count**

Run:
```bash
find dist -mindepth 4 -path '*/areas/*/*/index.html' | wc -l
```
Expected: `126`.

- [ ] **Step 2: Confirm all 42 pairs rendered per language**

Run:
```bash
find dist/es -mindepth 4 -path '*/areas/*/*/index.html' | sed 's|dist/es/areas/||;s|/index.html||' | sort
```

Expected output (42 lines, alphabetical):
```
alella-tiana-teia/car-paint-correction
alella-tiana-teia/glass-polishing
alella-tiana-teia/headlight-restoration
barcelona/acrylic-restoration
barcelona/car-paint-correction
barcelona/glass-polishing
barcelona/headlight-restoration
barcelona/interior-leather
barcelona/pre-sale-pack
bellaterra/car-paint-correction
bellaterra/glass-polishing
bellaterra/headlight-restoration
castelldefels/car-paint-correction
castelldefels/glass-polishing
castelldefels/headlight-restoration
matadepera/car-paint-correction
matadepera/glass-polishing
matadepera/headlight-restoration
pedralbes/car-paint-correction
pedralbes/glass-polishing
pedralbes/headlight-restoration
sant-cugat/acrylic-restoration
sant-cugat/car-paint-correction
sant-cugat/glass-polishing
sant-cugat/headlight-restoration
sant-cugat/interior-leather
sant-cugat/pre-sale-pack
sant-gervasi/car-paint-correction
sant-gervasi/glass-polishing
sant-gervasi/headlight-restoration
sant-just-desvern/car-paint-correction
sant-just-desvern/glass-polishing
sant-just-desvern/headlight-restoration
sant-quirze-del-valles/car-paint-correction
sant-quirze-del-valles/glass-polishing
sant-quirze-del-valles/headlight-restoration
terrassa/acrylic-restoration
terrassa/car-paint-correction
terrassa/glass-polishing
terrassa/headlight-restoration
terrassa/interior-leather
terrassa/pre-sale-pack
```

If the list differs, ALL_PAIRS or getStaticPaths is wrong. Report BLOCKED.

- [ ] **Step 3: Confirm hidden services NOT rendered**

Run:
```bash
find dist -mindepth 4 -path '*/areas/*/trim-restoration/*' 2>/dev/null
find dist -mindepth 4 -path '*/areas/*/wheel-ceramic/*' 2>/dev/null
find dist -mindepth 4 -path '*/areas/*/engine-bay/*' 2>/dev/null
```
Expected: all 3 commands return empty (no pages for hidden services).

- [ ] **Step 4: Confirm 3-language coverage**

Run:
```bash
ls -d dist/en/areas/sant-cugat/car-paint-correction dist/es/areas/sant-cugat/car-paint-correction dist/ca/areas/sant-cugat/car-paint-correction 2>/dev/null
```
Expected: 3 directories listed (one per language).

- [ ] **Step 5: Schema validation in built HTML**

Pick one from each lang and verify Service + BreadcrumbList + FAQPage:
```bash
for lang in en es ca; do
  PAGE=dist/$lang/areas/sant-cugat/car-paint-correction/index.html
  echo "=== $lang ==="
  grep -c '"@type":"Service"' $PAGE
  grep -c '"@type":"BreadcrumbList"' $PAGE
  grep -c '"@type":"FAQPage"' $PAGE
done
```
Expected: each lang shows 3 lines, each ≥ 1.

- [ ] **Step 6: Confirm landmarks sentence in 3 langs**

Run:
```bash
grep -c "We work near" dist/en/areas/barcelona/glass-polishing/index.html
grep -c "Trabajamos cerca de" dist/es/areas/barcelona/glass-polishing/index.html
grep -c "Treballem prop de" dist/ca/areas/barcelona/glass-polishing/index.html
```
Expected: each ≥ 1.

- [ ] **Step 7: Confirm sitemap inclusion**

Run:
```bash
grep -c '/areas/[^<]*/[^<]*</loc>' dist/sitemap-*.xml | head -3
```
Expected: large number (≥ 126 — each programmatic URL listed).

If sitemap doesn't include them, check Astro sitemap integration config — but typically `getStaticPaths` output is auto-included.

- [ ] **Step 8: Pre-existing pages preserved**

Run:
```bash
ls dist/es/index.html dist/es/services/car-paint-correction/index.html dist/es/academy/remove-swirl-marks/index.html dist/es/areas/sant-cugat/index.html
```
Expected: all 4 paths listed (Plan 1 pages still work).

If any check fails, report DONE_WITH_CONCERNS or BLOCKED with specifics. Do not commit anything in this task.

---

### Task 4: Create FULL_ROLLOUT_MONITORING.md

**Files:**
- Create: `docs/FULL_ROLLOUT_MONITORING.md`

Operational monitoring playbook for weeks 1-4 post-deploy. Distinct from the canary verification (which had a binary go/no-go decision). The full rollout has gradient indexation expectations and ongoing quality monitoring.

- [ ] **Step 1: Create the file**

Exact content:

```markdown
# Programmatic Pages Full Rollout — Monitoring Playbook

> **Status:** Active — full rollout. 126 programmatic pages live (3 langs × 42 area×service pairs).
> **Deploy date:** YYYY-MM-DD (fill in after first push)
> **Monitoring window:** weeks 1-4 post-deploy.

This document is the operational checklist for monitoring 126 programmatic pages after the Plan 2.5 push lands. Differs from `CANARY_VERIFICATION.md` — that was a one-shot 7-day decision; this is ongoing observation across 4 weeks.

---

## Week 1 (Day 1-7) — Discovery

**Goal:** Confirm Googlebot is finding the new URLs. Indexation lags discovery — that's expected.

### Day 1 (deploy day)

- ☐ Submit updated sitemap in GSC (Sitemaps → Resubmit)
- ☐ Submit updated sitemap in Bing Webmaster Tools (if verified)
- ☐ Confirm `https://restorelab.io/sitemap-0.xml` (or sitemap-index.xml) is reachable and contains the new URLs
- ☐ Spot-check 3 random programmatic URLs return HTTP 200:
  - `curl -s -o /dev/null -w "%{http_code}\n" https://restorelab.io/en/areas/matadepera/headlight-restoration`
  - `curl -s -o /dev/null -w "%{http_code}\n" https://restorelab.io/ca/areas/sant-quirze-del-valles/glass-polishing`
  - `curl -s -o /dev/null -w "%{http_code}\n" https://restorelab.io/es/areas/alella-tiana-teia/car-paint-correction`

### Day 7

- ☐ GSC → Coverage → Indexed: count programmatic URLs (filter `inurl:/areas/`). Target: ≥ 30 of 126 indexed.
- ☐ GSC → Crawl Stats: confirm Googlebot is hitting `/areas/*/*/` paths actively
- ☐ No new manual actions
- ☐ No "Discovered, currently not indexed" cluster on programmatic URLs older than 5 days (some are normal; a cluster is bad)

**If < 30 indexed by day 7:**
- Discovery problem. Force-index 6 strategic URLs via GSC URL Inspection (1 per language × 2 areas).
- Check internal linking — programmatic pages should be linked from at least area landing pages or sitemap.

---

## Week 2 (Day 8-14) — Indexation ramp

**Goal:** Most programmatic pages should be indexed by end of week 2. Track CTR / impressions starting to appear.

### Day 14

- ☐ GSC indexed count: target ≥ 80 of 126 (~63%)
- ☐ GSC Performance → filter `/areas/`: impressions present (≥ 50/day across all programmatic URLs combined)
- ☐ GSC clicks: ≥ 1/day across all programmatic URLs combined (early signal)
- ☐ No manual actions, no soft 404s, no "Excluded by 'noindex' tag" entries on programmatic URLs

**If indexed < 60 by day 14:**
- Half-rollout indexation issue. Likely thin content perception.
- Investigate which subset isn't indexing (often the secondary-area × non-top-service combinations like `bellaterra/glass-polishing`).
- Mitigation: strengthen those pages (add an area-specific FAQ or trust signal). Re-deploy.

---

## Week 3 (Day 15-21) — Quality signals

**Goal:** Pages start ranking. Pull GSC query data to see what searches surface them.

### Day 21

- ☐ GSC indexed: target ≥ 110 of 126 (~87%)
- ☐ GSC Performance → top queries surfacing programmatic pages: list the top 10. Are they relevant local intent queries (e.g., `corrección pintura sant cugat`, `windshield repair Barcelona`)?
- ☐ Average position for programmatic URLs: should be ≤ 30 (page 3 or better) on at least some queries
- ☐ Spot-check 3 query/URL pairs in actual Google search → confirm pages appear and the snippet is sensible

**If average position > 50:** thin content or topic mismatch. Likely needs more area-specific facts in slot 1 or new internal links from related academy articles.

---

## Week 4 (Day 22-28) — Optimization decisions

**Goal:** Decide what to refine. Pages that aren't moving from page 3+ may need additional content; pages on page 1 are already winning.

### Day 28

- ☐ GSC indexed: target ≥ 120 of 126 (~95%)
- ☐ Pull top 20 ranking programmatic URLs and bottom 20. Compare:
  - Top 20: what's working? More commonCarBrands? Specific trustcase counts? Distinctive landmarks?
  - Bottom 20: what's missing? travelFee 0 (less differentiation)? Generic parkingContext?
- ☐ Identify 5-10 candidates for content expansion (Slot 2 case studies, expanded FAQ, custom local copy)

**Decision points:**

1. **All metrics healthy (indexed ≥ 95%, impressions/clicks growing, no warnings):**
   - Move on to Plan 3 (academy article writing)
   - Re-evaluate areaProfiles VERIFY markers — start owner verification for the underperforming areas

2. **Indexed plateau at 70-90% with some thin content warnings:**
   - Plan 2.6 (refinement): add Slot 2 (case studies) to bottom-20 pages
   - Verify areaProfiles for affected areas first

3. **Manual action or systemic indexation problems:**
   - Halt and revert Plan 2.5
   - Investigate root cause (likely owner-data quality)
   - Revisit verifying ALL areaProfiles before retry

---

## Monthly snapshot (post-week-4 cadence)

After week 4, fold programmatic page metrics into the monthly cadence in `docs/SEO_DASHBOARD.md`. Add these new fields:

- Programmatic indexed: ___ / 126
- Programmatic impressions (28d): ___
- Programmatic clicks (28d): ___
- Programmatic top query: ___
- Bottom-quartile pages needing attention: list

---

## Reverting if needed

If at any point a critical issue arises (manual action, > 30% of pages excluded, deceptive content claim from Google):

```bash
# Find the Plan 2.5 commits:
git log --oneline --since="14 days ago" -- src/lib/areaServiceContent.ts "src/pages/[lang]/areas/[city]/[service].astro"

# Revert in reverse order (newest first):
git revert <newest commit>
git revert <next commit>
# etc.

git push origin main
```

This restores the canary state (12 ES pages). Investigate root cause before re-attempting full rollout.
```

- [ ] **Step 2: Verify file exists**

Run: `ls -la docs/FULL_ROLLOUT_MONITORING.md`
Expected: file present.

- [ ] **Step 3: Commit**

```bash
git add docs/FULL_ROLLOUT_MONITORING.md
git commit -m "Add full rollout monitoring playbook (weeks 1-4 post-deploy)"
```

---

### Task 5: Final smoke test before push

This task does NOT commit. Final read-only verification before pushing the full rollout to production (Cloudflare auto-deploys).

- [ ] **Step 1: Clean build**

Run:
```bash
rm -rf dist && npm run build
```
Expected: 0 errors, **262 pages**.

- [ ] **Step 2: Confirm exact page counts**

Run:
```bash
find dist -name 'index.html' | wc -l
find dist -mindepth 4 -path '*/areas/*/*/index.html' | wc -l
```
Expected: 262 total, 126 programmatic.

- [ ] **Step 3: Confirm sitemap consistency**

Run:
```bash
grep -c '<loc>' dist/sitemap-0.xml
```
Expected: large number including new programmatic URLs.

Run:
```bash
grep '/areas/.*-/.*-/' dist/sitemap-0.xml | wc -l
```
(grep for paths matching the programmatic pattern — adjust regex if no matches.)

Alternative robust check:
```bash
grep -o 'restorelab.io/[^<]*' dist/sitemap-0.xml | grep -E '/areas/[^/]+/[^/]+$' | wc -l
```
Expected: ≥ 126.

- [ ] **Step 4: Confirm `// VERIFY` markers in areaProfiles unchanged**

Plan 2.5 doesn't modify `src/lib/areaProfiles.ts`. Verify:
```bash
git diff main -- src/lib/areaProfiles.ts
```
Expected: empty (no changes from main).

- [ ] **Step 5: Spot-check 5 random pages render with all 4 slots**

Run:
```bash
for path in \
  "en/areas/sant-cugat/car-paint-correction" \
  "es/areas/barcelona/interior-leather" \
  "ca/areas/terrassa/pre-sale-pack" \
  "es/areas/pedralbes/headlight-restoration" \
  "en/areas/castelldefels/glass-polishing"; do
  echo "=== $path ==="
  grep -c -E "(intro_label|What we do|Qué hacemos|Què fem)" "dist/$path/index.html"
  grep -c -E "(Pricing|Precio|Preu)" "dist/$path/index.html"
  grep -c -E "(Trusted|Confianza|Confiança)" "dist/$path/index.html"
  grep -c -E "(Frequently asked|Preguntas frecuentes|Preguntes freqüents)" "dist/$path/index.html"
done
```
Expected: each page shows 4 lines with values ≥ 1.

- [ ] **Step 6: Compare barcelona vs pedralbes uniqueness (the previously-flagged risk)**

Run:
```bash
diff \
  <(sed -n '/<main\|<article/,/<\/main>\|<\/article>/p' dist/en/areas/barcelona/car-paint-correction/index.html | grep -oE '[A-Za-z]{4,}' | sort | uniq) \
  <(sed -n '/<main\|<article/,/<\/main>\|<\/article>/p' dist/en/areas/pedralbes/car-paint-correction/index.html | grep -oE '[A-Za-z]{4,}' | sort | uniq) \
  | wc -l
```
Expected: ≥ 30 (≥30 unique words distinguish the two pages — landmarks sentence + brand list + parking context contribute).

If output < 20, the uniqueness mitigation isn't working. Report DONE_WITH_CONCERNS — landmarks sentence may not be rendering or both pages have empty landmarks arrays.

- [ ] **Step 7: Final assessment**

If all spot-checks pass, report DONE — ready to push. If any fail, report DONE_WITH_CONCERNS with specifics.

This task does NOT commit anything.

---

## Summary of deliverables (after all 5 tasks)

- 1 modified file: `src/lib/areaServiceContent.ts` (3 changes)
- 1 modified file: `src/pages/[lang]/areas/[city]/[service].astro` (2 changes)
- 1 new file: `docs/FULL_ROLLOUT_MONITORING.md`
- 3 commits (1 per task that commits)
- **126 new programmatic pages** in production (replacing 12 canary pages with same paths covered)
- Total page count: 262

After deploy: owner runs `docs/FULL_ROLLOUT_MONITORING.md` checklist over weeks 1-4 post-push.

---

## Self-review checklist

After all 5 tasks complete:

1. ✅ ALL_PAIRS produces exactly 42 pairs
2. ✅ getStaticPaths generates 126 paths (42 × 3)
3. ✅ Build is 262 pages
4. ✅ All 3 languages have programmatic pages
5. ✅ No programmatic pages for hidden services (trim/wheel/engine)
6. ✅ Landmarks sentence renders in all 3 langs
7. ✅ Service / BreadcrumbList / FAQPage schemas valid on all programmatic pages
8. ✅ Pre-existing 148 pages still work (Plan 1 + Plan 2 canary preserved)
9. ✅ Sitemap includes all 126 new URLs
10. ✅ FULL_ROLLOUT_MONITORING.md committed

---

**Plan complete.**
