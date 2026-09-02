// scripts/check-pricing.mjs — pricing single-source-of-truth guardrails (RL-401).
// Runs as the `prebuild` step: a violation fails the build with a readable message.
//
// Enforced invariants:
//  1. Every estimator.tiers slug resolves to a pricing package in ALL 3 langs.
//  2. The package slug set and every numeric field (price_eur, size_pricing)
//     are identical across langs — only text may be localized.
//  3. No hardcoded euro amounts in src/**/*.{astro,ts} outside the allowlist:
//     prices live ONLY in the pricing JSON.
//  4. size_pricing keys (when present) are valid pricing.ui.size_categories ids.

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const LANGS = ['es', 'en', 'ca'];

// Files allowed to contain literal euro amounts. Keep this list short and
// justified — every entry is a place where a number is data, not display copy.
const EURO_ALLOWLIST = new Set([
  'src/lib/areaProfiles.ts', // travelFee per area — its own single source
]);

const errors = [];
const fail = (msg) => errors.push(msg);

const content = {};
for (const lang of LANGS) {
  content[lang] = JSON.parse(await fs.readFile(path.join(ROOT, `src/content/${lang}.json`), 'utf8'));
}

const packagesBySlug = (t) => {
  const out = new Map();
  for (const cat of t.pricing?.categories ?? []) {
    for (const pkg of cat.packages ?? []) {
      if (!pkg.slug) fail(`package without slug in category "${cat.id}"`);
      else out.set(pkg.slug, pkg);
    }
  }
  return out;
};

const pkgs = Object.fromEntries(LANGS.map((l) => [l, packagesBySlug(content[l])]));
const sizeIds = Object.fromEntries(
  LANGS.map((l) => [l, (content[l].pricing?.ui?.size_categories ?? []).map((c) => c.id)])
);

// ── 1. estimator.tiers slugs resolve everywhere ─────────────────────────────
for (const lang of LANGS) {
  for (const slug of Object.keys(content[lang].estimator?.tiers ?? {})) {
    if (!pkgs[lang].has(slug)) {
      fail(`${lang}.json: estimator.tiers slug "${slug}" has no pricing package`);
    }
  }
}

// ── 2. slug sets + numeric fields identical across langs ────────────────────
const refSlugs = [...pkgs.es.keys()].sort();
for (const lang of ['en', 'ca']) {
  const slugs = [...pkgs[lang].keys()].sort();
  if (JSON.stringify(slugs) !== JSON.stringify(refSlugs)) {
    fail(`${lang}.json package slugs differ from es.json:\n  es: ${refSlugs}\n  ${lang}: ${slugs}`);
  }
}
const NUMERIC_FIELDS = ['price_eur', 'price_unit', 'from'];
for (const slug of refSlugs) {
  const ref = pkgs.es.get(slug);
  if (ref.price_eur === undefined) fail(`es.json: package "${slug}" missing price_eur`);
  if (!['job', 'pair'].includes(ref.price_unit)) fail(`es.json: package "${slug}" bad price_unit "${ref.price_unit}"`);
  if (typeof ref.from !== 'boolean') fail(`es.json: package "${slug}" missing boolean \`from\``);
  for (const lang of ['en', 'ca']) {
    const p = pkgs[lang].get(slug);
    if (!p) continue; // already reported by the slug-set check
    for (const f of NUMERIC_FIELDS) {
      if (JSON.stringify(p[f]) !== JSON.stringify(ref[f])) {
        fail(`"${slug}".${f} differs: es=${JSON.stringify(ref[f])} ${lang}=${JSON.stringify(p[f])}`);
      }
    }
    if (JSON.stringify(p.size_pricing ?? null) !== JSON.stringify(ref.size_pricing ?? null)) {
      fail(`"${slug}".size_pricing differs between es and ${lang} — numbers must be identical across langs`);
    }
  }
}

// ── 4a. size_pricing must equal the APPROVED matrix exactly ─────────────────
// Approved by Mike 2026-09-02 (docs/pricing-strategy.md): multipliers
// ×0.9/×1.0/×1.2/×1.35 with deliberate overrides — Express compact floored at
// the €149 minimum visit, Ceramic 2Y SUV capped at 999, Pre-Sale van capped
// at 599. The matrix below IS the source the check enforces, not the formula.
const APPROVED_MATRIX = {
  'express-refresh':  { compact: 149, sedan: 149, suv: 179, van: 199 },
  'single-stage':     { compact: 309, sedan: 349, suv: 419, van: 469 },
  'ceramic-1y':       { compact: 449, sedan: 499, suv: 599, van: 669 },
  'two-stage':        { compact: 539, sedan: 599, suv: 719, van: 809 },
  'ceramic-2y':       { compact: 759, sedan: 849, suv: 999, van: 1149 },
  'full-glass-set':   { compact: 259, sedan: 289, suv: 349, van: 389 },
  'pre-sale-pack':    { compact: 399, sedan: 449, suv: 539, van: 599 },
};
for (const lang of LANGS) {
  for (const [slug, pkg] of pkgs[lang]) {
    const expected = APPROVED_MATRIX[slug];
    if (expected) {
      if (JSON.stringify(pkg.size_pricing) !== JSON.stringify(expected)) {
        fail(`${lang}.json: "${slug}".size_pricing deviates from the approved matrix\n    expected ${JSON.stringify(expected)}\n    got      ${JSON.stringify(pkg.size_pricing)}`);
      }
    } else if (pkg.size_pricing) {
      fail(`${lang}.json: "${slug}" carries size_pricing but is not in the approved matrix`);
    }
  }
}

// ── 4. size_pricing keys are valid size_categories ids ──────────────────────
for (const lang of LANGS) {
  const ids = sizeIds[lang];
  if (ids.some((id) => !id)) fail(`${lang}.json: pricing.ui.size_categories entries must all carry an \`id\``);
  for (const [slug, pkg] of pkgs[lang]) {
    for (const key of Object.keys(pkg.size_pricing ?? {})) {
      if (!ids.includes(key)) {
        fail(`${lang}.json: "${slug}".size_pricing key "${key}" is not a size_categories id (${ids.join(', ')})`);
      }
    }
  }
}
for (const lang of ['en', 'ca']) {
  if (JSON.stringify(sizeIds[lang]) !== JSON.stringify(sizeIds.es)) {
    fail(`size_categories ids differ: es=${sizeIds.es} ${lang}=${sizeIds[lang]}`);
  }
}

// ── 3. no hardcoded euro amounts in source ──────────────────────────────────
const EURO_RE = /€\s?\d|\d\s?€/;
async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (/\.(astro|ts)$/.test(entry.name)) yield p;
  }
}
for await (const file of walk(path.join(ROOT, 'src'))) {
  const rel = path.relative(ROOT, file);
  if (EURO_ALLOWLIST.has(rel)) continue;
  const lines = (await fs.readFile(file, 'utf8')).split('\n');
  lines.forEach((line, i) => {
    if (EURO_RE.test(line)) {
      fail(`${rel}:${i + 1}: hardcoded euro amount — prices belong in the pricing JSON\n    ${line.trim().slice(0, 100)}`);
    }
  });
}

if (errors.length) {
  console.error(`\n✖ check-pricing failed (${errors.length} violation${errors.length > 1 ? 's' : ''}):\n`);
  for (const e of errors) console.error(`  • ${e}`);
  console.error('');
  process.exit(1);
}
console.log(`✓ check-pricing: ${refSlugs.length} packages consistent across ${LANGS.length} langs, no hardcoded prices in src/`);
