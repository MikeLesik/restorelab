#!/usr/bin/env node
/**
 * Scaffold a new Academy article listing entry in all 3 language JSON files.
 * Usage: npm run new:post
 *
 * This adds the listing card to academy.articles[].
 * You still need to manually add the full content to academy_articles.{key}.
 */
import { createInterface } from 'node:readline';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(__dirname, '../src/content');
const LANGS = ['en', 'es', 'ca'];

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

async function main() {
  console.log('\n📝 New Academy Article\n');

  const slug = await ask('Slug (e.g. "ceramic-coating-myths"): ');
  const titleEn = await ask('Title (EN): ');
  const titleEs = await ask('Title (ES): ');
  const titleCa = await ask('Title (CA): ');
  const excerptEn = await ask('Excerpt (EN, 1 sentence): ');
  const excerptEs = await ask('Excerpt (ES): ');
  const excerptCa = await ask('Excerpt (CA): ');

  const today = new Date().toISOString().slice(0, 10);
  const contentKey = slug.replace(/-/g, '_');

  const titles = { en: titleEn, es: titleEs, ca: titleCa };
  const excerpts = { en: excerptEn, es: excerptEs, ca: excerptCa };

  for (const lang of LANGS) {
    const filePath = resolve(CONTENT_DIR, `${lang}.json`);
    const json = JSON.parse(readFileSync(filePath, 'utf-8'));

    // Determine next number
    const articles = json.academy?.articles || [];
    const maxNum = articles.reduce((max, a) => {
      const n = parseInt(a.number, 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const nextNum = String(maxNum + 1).padStart(2, '0');

    const newEntry = {
      number: nextNum,
      title: titles[lang],
      excerpt: excerpts[lang],
      slug: slug,
      date: today,
      status: 'published',
    };

    json.academy.articles.push(newEntry);

    // Also scaffold an empty content entry
    if (!json.academy_articles) {
      json.academy_articles = {};
    }
    if (!json.academy_articles[contentKey]) {
      json.academy_articles[contentKey] = {
        seo_title: `${titles[lang]} | restoreLab Academy`,
        seo_description: excerpts[lang].slice(0, 155),
        title: titles[lang],
        description: '',
        intro: '',
        sections: [],
      };
    }

    writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf-8');
    console.log(`  ✅ ${lang}.json updated (article #${nextNum})`);
  }

  console.log(`\n📌 Content key: "${contentKey}"`);
  console.log(`   Slug: "${slug}"`);
  console.log(`\n⚠️  Next steps:`);
  console.log(`   1. Write the full article content in academy_articles.${contentKey}`);
  console.log(`      in all 3 JSON files (en.json, es.json, ca.json).`);
  console.log(`   2. Run: npm run build`);
  console.log('');

  rl.close();
}

main().catch((e) => {
  console.error(e);
  rl.close();
  process.exit(1);
});
