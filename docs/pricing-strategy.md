# restoreLab — Pricing Strategy (RL-401)

> Status: size matrix below is a **PROPOSAL — pending Mike's approval**
> (RL-401 checkpoint). Structured fields (`price_eur`, `price_unit`, `from`)
> are already in the JSONs, mirroring the published display prices.
> `size_pricing` will be written into the JSONs only after approval, and the
> public UI switches to it in RL-402.

## Competitor landscape (Barcelona, researched Sep 2026)

| Competitor | Offer | Price range |
|---|---|---|
| Detailing Barcelona | 1-stage | €200–330 (compact) / €280–460 (van) |
| Detailing Barcelona | 2-stage | €360–590 / €440–720 / €520–850 |
| Detailing Barcelona | 3-stage | €560–1,300 |
| WYZ (mobile) | full detail | €140–220 |
| WYZ (mobile) | pulido | €250–530 |
| WYZ (mobile) | ceramic 3y | €380–710 |
| Kramex | 1-stage | desde €150 |
| DetailingBCN | pulido | €450–700 |
| DetailingBCN | ceramic | €450–900 |
| DetailingBCN | interior | €190–300 |
| White Garage (Madrid ref) | 1-stage / 2-stage | €399 / desde €499 |
| White Garage (Madrid ref) | headlights | €80–120 |
| Midas | faros | €75/par |
| Cronoshare (aggregates) | full clean | €85–500 (typ. €150–200) |
| Cronoshare (aggregates) | polish | €40–180 |
| Cronoshare (aggregates) | faros | €15–35/faro |

## Positioning rules

- restoreLab sits in the **upper third of the mobile market**. Justified by
  what is TRUE and provable: professional product lines (Gyeon / Gtechniq
  consumer-pro ranges), written own-brand rework guarantee (2-year hydrophobic
  warranty on ceramic panels), satisfaction promise (redo at no cost), fixed
  photo-quote with no surprises, fully self-sufficient mobile unit.
  ⚠️ **Never claim brand certifications/accreditations** (we are NOT a
  Gyeon/Gtechniq certified detailer — art. 21 Ley 3/1991; rule of 2026-08-18).
  ⚠️ The €500k liability-insurance claim from the verdict doc must be verified
  against the actual policy before it appears anywhere public.
- **Core transparency promise: never above the published maximum for the size
  after the photo quote.** The photo quote can come in below, never above.
- IVA always included in B2C display. B2B tarifa shows neto + IVA line.
- Minimum visit: €149 (already published via `pricing.ui.min_visit`).

## Repo vs live prices — state of record

The Aug-2026 repricing (commit a09b397: single-stage €349, two-stage €599,
ceramic-2y €849, ceramic-1y €499) has been LIVE on restorelab.io since the
2026-09-01 push. The older live set (€289/€549/€649) no longer exists anywhere.
**Confirm in this checkpoint that the €349/€599/€849 ladder is the intended
baseline for the size matrix below.**

## PROPOSED size matrix (APPROVAL CHECKPOINT)

Multipliers per the Phase-4 spec: compact ×0.9 · sedan ×1.0 (base) ·
SUV ×1.15 · van/7-seater ×1.3 — rounded to the nearest €10 with psychological
endings. All amounts EUR, IVA included, per job.

| Package (base) | Compact | Sedán | SUV / Crossover | SUV grande / 7 plazas |
|---|---|---|---|---|
| Express Refresh (€149) | **€149**¹ | €149 | €169 | €189 |
| Single-Stage (€349) | €309 | €349 | €399 | €449 |
| Ceramic 1Y (€499) | €449 | €499 | €569 | €649 |
| Two-Stage (€599) | €539 | €599 | €689 | €779 |
| Ceramic 2Y (€849) | €759 | €849 | €979 | €1,099 |
| Full Glass Set (€289) | €259 | €289 | €329 | €379 |
| Pre-Sale Pack (€449) | €399 | €449 | €519 | €579 |

¹ ×0.9 would give €129, below the published €149 minimum visit — floored at
the minimum. (Alternative: lower the minimum; not recommended.)

Not in the matrix (size-independent or quote-only):
- Windshield Polish €119, Windshield Hydrophobic €179, Hydrophobic standalone
  desde €89, Headlight Restoration €79/pair — fixed regardless of car size.
- Acrylic Restoration — quote-only (`price_eur: null`).
- **Deportivo / Superdeportivo** (5th size category): stays photo-quote with
  the existing "+25–40%" guidance — too variable for a fixed public matrix.

### Open questions for Mike (answer = approval)

1. **Multipliers**: the spec's ×1.15 (SUV) / ×1.3 (van) vs the currently
   displayed modifiers "+20%" / "+35%" (`pricing.ui.size_categories`). The
   matrix above uses the spec's; the displayed modifier strings get replaced
   by exact numbers in RL-402. Confirm the spec multipliers (or name others).
2. **Express compact floor** at €149 (see ¹).
3. **Baseline ladder** €349/€599/€849/€499 confirmed as intended (see above).
4. Rounding style: 9-endings (€399/€979) used throughout — OK?

## Guardrails (live since RL-401)

`scripts/check-pricing.mjs` runs as `prebuild` and fails the build when:
- an `estimator.tiers` slug has no pricing package in any lang;
- package slugs or any numeric field (`price_eur`, `price_unit`, `from`,
  `size_pricing`) differ across langs;
- a hardcoded euro amount appears in `src/**/*.{astro,ts}` outside the
  allowlist (`areaProfiles.ts` travel fees);
- a `size_pricing` key is not a `pricing.ui.size_categories` id.
