// scripts/generate-llms-txt.mjs
// Generates public/llms.txt from content JSON.
// Run via: npm run gen:llms

import fs from 'node:fs/promises';
import path from 'node:path';

const SITE_URL = 'https://restorelab.io';
const ROOT = path.resolve(new URL('..', import.meta.url).pathname);

async function loadJson(filePath) {
  const buf = await fs.readFile(filePath, 'utf8');
  return JSON.parse(buf);
}

// We import service/area profiles by reading the .ts files as text and
// extracting the export object. Simpler than tsc invocation here — these
// files have predictable structure. (If complexity grows, consider tsx.)
async function loadServiceProfiles() {
  const txt = await fs.readFile(path.join(ROOT, 'src/lib/serviceProfiles.ts'), 'utf8');
  // Crude regex-based parsing; relies on the predictable shape produced by Task 5.
  // If this file is hand-edited in unusual ways, replace with a tsx-compiled import.
  const out = {};
  const blockRe = /'([\w-]+)':\s*\{([^}]+)\}/g;
  let m;
  while ((m = blockRe.exec(txt))) {
    const id = m[1];
    const body = m[2];
    const labelMatch = /englishLabel:\s*'([^']+)'/.exec(body);
    const briefMatch = /englishBrief:\s*'([^']+)'/.exec(body);
    const priceMatch = /startingPriceEur:\s*(null|\d+)/.exec(body);
    const activeMatch = /active:\s*(true|false)/.exec(body);
    out[id] = {
      id,
      englishLabel: labelMatch?.[1] ?? id,
      englishBrief: briefMatch?.[1] ?? '',
      startingPriceEur: priceMatch?.[1] === 'null' ? null : Number(priceMatch?.[1] ?? 0),
      active: activeMatch?.[1] === 'true',
    };
  }
  return out;
}

async function loadAreaProfiles() {
  const txt = await fs.readFile(path.join(ROOT, 'src/lib/areaProfiles.ts'), 'utf8');
  const out = [];
  const blockRe = /'([\w-]+)':\s*\{([^}]+)\}/gs;
  let m;
  while ((m = blockRe.exec(txt))) {
    const slug = m[1];
    const body = m[2];
    const nameMatch = /name:\s*'([^']+)'/.exec(body);
    if (nameMatch) out.push({ slug, name: nameMatch[1] });
  }
  return out;
}

// Derived from the content JSON, never retyped. The previous static list
// silently outlived the packages it described — it was still advertising a
// withdrawn Ceramic 5Y at 1049 long after the package was removed.
function pricingByCategory(en) {
  return (en.pricing?.categories ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    packages: (c.packages ?? [])
      .map((p) => ({
        name: p.name,
        price: Number(String(p.price).replace(/[^\d]/g, '')),
        duration: p.duration || '',
      }))
      .filter((p) => Number.isFinite(p.price) && p.price > 0),
  }));
}

async function main() {
  const en = await loadJson(path.join(ROOT, 'src/content/en.json'));
  const es = await loadJson(path.join(ROOT, 'src/content/es.json'));
  const services = await loadServiceProfiles();
  const areas = await loadAreaProfiles();

  // ES is the default locale and primary market — llms.txt links point to /es/,
  // with /en/ alternates listed once so AI engines can route English queries.
  const out = [];

  out.push('# restoreLab — Mobile Detailing & Restoration');
  out.push('');
  out.push('> Premium mobile car detailing service in Barcelona metropolitan area');
  out.push('> (Sant Cugat, Pedralbes, Terrassa, etc.). Specialties: paint correction,');
  out.push('> ceramic coating, glass polishing, headlight restoration, acrylic restoration.');
  out.push('> Primary language: Spanish (/es/). Also available in English (/en/) and Catalan (/ca/).');
  out.push('');

  const esServiceTitles = Object.fromEntries(
    (es.services?.items || []).map((i) => [i.id, i.title])
  );

  out.push('## Services');
  out.push('');
  for (const id of Object.keys(services)) {
    const s = services[id];
    if (!s.active) continue;
    const url = `${SITE_URL}/es/services/${id}`;
    const title = esServiceTitles[id] ? `${esServiceTitles[id]} (${s.englishLabel})` : s.englishLabel;
    out.push(`- [${title}](${url}): ${s.englishBrief} [EN](${SITE_URL}/en/services/${id})`);
  }
  out.push('');

  out.push('## Service areas');
  out.push('');
  for (const a of areas) {
    out.push(`- [${a.name}](${SITE_URL}/es/areas/${a.slug})`);
  }
  out.push('');

  out.push('## Pricing (EUR, sedan baseline, IVA included)');
  out.push('');
  for (const cat of pricingByCategory(en)) {
    for (const p of cat.packages) {
      out.push(`- ${p.name}: €${p.price}${p.duration ? ` (${p.duration})` : ''}`);
    }
  }
  out.push(`- Full price list: ${SITE_URL}/es/pricing (EN: ${SITE_URL}/en/pricing)`);
  out.push(`- B2B / dealer rate card: ${SITE_URL}/es/business`);
  out.push('');

  out.push('## Knowledge base');
  out.push('');
  const esArticles = (es.academy?.articles || []).filter((a) => a.status === 'published');
  const enTitles = Object.fromEntries(
    (en.academy?.articles || []).map((a) => [a.slug, a.title])
  );
  for (const a of esArticles) {
    const url = `${SITE_URL}/es/academy/${a.slug}`;
    const enSuffix = enTitles[a.slug] ? ` (EN: ${SITE_URL}/en/academy/${a.slug})` : '';
    out.push(`- [${a.title}](${url})${enSuffix}`);
  }
  out.push('');

  out.push('## Vertical landings');
  out.push('');
  out.push(`- [EV specialists (Tesla, BMW i, Polestar)](${SITE_URL}/es/ev)`);
  out.push(`- [B2B & fleet services](${SITE_URL}/es/business)`);
  out.push(`- [Care plans (subscription)](${SITE_URL}/es/plans)`);
  out.push(`- [Commercial glass restoration](${SITE_URL}/es/commercial-glass)`);
  out.push('');

  out.push('## Key facts');
  out.push('');
  out.push('- Fully mobile service: we come to the customer with our own generator, water and professional equipment — no workshop visit needed.');
  out.push('- Based in Sant Cugat del Vallès; serving the Barcelona metropolitan area (Barcelona, Terrassa, Sabadell, Rubí and nearby towns).');
  out.push('- Quotes are given from two photos over WhatsApp: one of the whole car, one of the worst defect. Fixed package price, no hidden extras.');
  out.push('- Satisfaction promise: if the customer is not happy with the result, the work is redone at no extra cost.');
  out.push('- Written own-brand warranty: 2 years on the hydrophobic function of ceramic-coated panels (subject to indicated maintenance).');
  out.push('- Working hours: Monday–Saturday, 08:00–19:00.');
  out.push('- Languages: Spanish, English, Catalan.');
  out.push('');

  out.push('## Contact');
  out.push('');
  out.push('- WhatsApp: +34 680 265 190 (primary channel — send photos for a quote)');
  out.push('- Email: support@restorelab.io');
  out.push(`- Contact form: ${SITE_URL}/es/contact`);
  out.push(`- Online photo request (fixed quote in ≤1 working hour): ${SITE_URL}/es/solicitud`);
  out.push('- Service area: Barcelona metropolitan area, Catalonia, Spain');
  out.push('');

  const output = out.join('\n');
  const outputPath = path.join(ROOT, 'public/llms.txt');
  await fs.writeFile(outputPath, output, 'utf8');
  console.log(`Wrote ${outputPath} (${output.length} bytes, ${out.length} lines)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
