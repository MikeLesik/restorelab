#!/usr/bin/env node
/**
 * Scaffold a new before/after case entry in CasesGallery.astro.
 * Usage: npm run new:case
 */
import { createInterface } from 'node:readline';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GALLERY_PATH = resolve(__dirname, '../src/components/CasesGallery.astro');

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

async function main() {
  console.log('\n📸 New Case — Before & After\n');

  const title = await ask('Title (e.g. "BMW 3 Series — Paint Correction"): ');
  const category = await ask('Category (car / glass / acrylic): ');
  const slug = await ask('Image slug (e.g. "bmw3"): ');
  const result = await ask('Result text (e.g. "Swirl marks eliminated, deep gloss restored"): ');
  const metric = await ask('Metric (e.g. "95% clarity" or "Saved €380"): ');
  const location = await ask('Location (e.g. "Sant Cugat"): ');

  const beforePath = `/images/cases/${slug}-before.jpg`;
  const afterPath = `/images/cases/${slug}-after.jpg`;

  const gallery = readFileSync(GALLERY_PATH, 'utf-8');

  // Find the highest existing id
  const idMatches = [...gallery.matchAll(/id:\s*(\d+)/g)];
  const maxId = idMatches.reduce((max, m) => Math.max(max, parseInt(m[1], 10)), 0);
  const newId = maxId + 1;

  const entry = `  {
    id: ${newId},
    title: '${title.replace(/'/g, "\\'")}',
    category: '${category}',
    before: '${beforePath}',
    after: '${afterPath}',
    result: '${result.replace(/'/g, "\\'")}',
    metric: '${metric.replace(/'/g, "\\'")}',
    location: '${location.replace(/'/g, "\\'")}',
  },`;

  // Insert before the closing ];
  const closingBracket = gallery.lastIndexOf('];');
  if (closingBracket === -1) {
    console.error('Could not find closing ]; in CasesGallery.astro');
    process.exit(1);
  }

  const updated = gallery.slice(0, closingBracket) + entry + '\n' + gallery.slice(closingBracket);
  writeFileSync(GALLERY_PATH, updated, 'utf-8');

  console.log(`\n✅ Case #${newId} added to CasesGallery.astro`);
  console.log(`\n📁 Don't forget to add images:`);
  console.log(`   public${beforePath}`);
  console.log(`   public${afterPath}`);
  console.log(`\n   Recommended: 1200×800px, JPEG quality 80–85%\n`);

  rl.close();
}

main().catch((e) => {
  console.error(e);
  rl.close();
  process.exit(1);
});
