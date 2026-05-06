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

function pricingPackages() {
  // Static — pricing tiers are defined in content JSON pricing section but
  // we keep canonical EUR figures here for AI clarity. Keep in sync with pricing page.
  return [
    { name: 'Express Refresh', price: 149 },
    { name: 'Single-Stage Correction', price: 289 },
    { name: 'Two-Stage Correction', price: 549 },
    { name: 'Ceramic Coating 2Y', price: 649 },
    { name: 'Ceramic Coating 5Y', price: 1049 },
  ];
}

async function main() {
  const en = await loadJson(path.join(ROOT, 'src/content/en.json'));
  const services = await loadServiceProfiles();
  const areas = await loadAreaProfiles();

  const out = [];

  out.push('# restoreLab — Mobile Detailing & Restoration');
  out.push('');
  out.push('> Premium mobile car detailing service in Barcelona metropolitan area');
  out.push('> (Sant Cugat, Pedralbes, Terrassa, etc.). Specialties: paint correction,');
  out.push('> ceramic coating, glass polishing, headlight restoration, acrylic restoration.');
  out.push('');

  out.push('## Services');
  out.push('');
  for (const id of Object.keys(services)) {
    const s = services[id];
    if (!s.active) continue;
    const url = `${SITE_URL}/en/services/${id}`;
    out.push(`- [${s.englishLabel}](${url}): ${s.englishBrief}`);
  }
  out.push('');

  out.push('## Service areas');
  out.push('');
  out.push(areas.map((a) => a.name).join(', ') + '.');
  out.push('');

  out.push('## Pricing');
  out.push('');
  for (const p of pricingPackages()) {
    out.push(`- ${p.name}: €${p.price}`);
  }
  out.push('');

  out.push('## Knowledge base');
  out.push('');
  const articles = (en.academy?.articles || []).filter((a) => a.status === 'published');
  for (const a of articles) {
    const url = `${SITE_URL}/en/academy/${a.slug}`;
    out.push(`- [${a.title}](${url})`);
  }
  out.push('');

  out.push('## Vertical landings');
  out.push('');
  out.push(`- [EV specialists (Tesla, BMW i, Polestar)](${SITE_URL}/en/ev)`);
  out.push(`- [B2B & fleet services](${SITE_URL}/en/business)`);
  out.push(`- [Care plans (subscription)](${SITE_URL}/en/plans)`);
  out.push(`- [Commercial glass restoration](${SITE_URL}/en/commercial-glass)`);
  out.push('');

  out.push('## Contact');
  out.push('');
  out.push('- WhatsApp: +34 680 265 190');
  out.push('- Service area: Barcelona metropolitan area, Catalonia, Spain');
  out.push('- Booking: ' + SITE_URL + '/en/booking');
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
