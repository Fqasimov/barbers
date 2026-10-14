// Builds the generated parts of the website. Run from web/:
//   npm install && npm run pages
//
//  - public/data/demo.json      sample salons and reviews (from the backend's demo catalogue),
//                               shown in demo mode only (see src/config.ts)
//  - public/privacy/index.html  from docs/legal/privacy-policy.md
//  - public/terms/index.html    from docs/legal/terms.md
//  - public/help/index.html     from docs/help.md
//
// The output is committed, so hosting needs no extra step beyond `npm run build`.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { marked } from 'marked';

const web = join(dirname(fileURLToPath(import.meta.url)), '..');
const root = join(web, '..');

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------
const catalogue = JSON.parse(await readFile(join(root, 'backend/database/seeders/data/demo-catalogue.json'), 'utf8'));
const reviewsBySalon = {};
for (const r of catalogue.reviews) {
  if (!r.text) continue;
  (reviewsBySalon[r.salonId] ??= []).push({
    author: r.author,
    rating: r.rating,
    text: r.text,
    date: r.date,
    serviceName: r.serviceName ?? null,
  });
}
const demo = {
  salons: catalogue.salons.map((s) => ({
    id: s.id,
    name: s.name,
    kind: s.kind,
    categories: s.categories,
    district: s.district,
    address: s.address,
    coords: s.coords,
    rating: s.rating,
    reviewCount: s.reviewCount,
    tone: s.tone,
    photos: [],
    masters: s.masters.length,
  })),
  reviews: Object.fromEntries(
    Object.entries(reviewsBySalon).map(([id, list]) => [id, list.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)]),
  ),
};
await mkdir(join(web, 'public/data'), { recursive: true });
await writeFile(join(web, 'public/data/demo.json'), JSON.stringify(demo));
console.log(`public/data/demo.json: ${demo.salons.length} salons`);

// ---------------------------------------------------------------------------
// Text pages
// ---------------------------------------------------------------------------
const pages = [
  { src: 'docs/legal/privacy-policy.md', out: 'privacy', title: 'Məxfilik siyasəti · Privacy policy' },
  { src: 'docs/legal/terms.md', out: 'terms', title: 'İstifadə şərtləri · Terms of use' },
  { src: 'docs/help.md', out: 'help', title: 'Kömək · Помощь · Help' },
];

const shell = (title, body) => `<!doctype html>
<html lang="az">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Usta</title>
<link rel="icon" href="/img/favicon-32.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="/doc.css">
</head>
<body>
<header class="doc-head"><a class="wm" href="/" aria-label="Usta" data-text="usta">usta</a></header>
<main class="doc">
${body}
</main>
<footer class="doc-foot"><a href="/">← ustatap.az</a></footer>
</body>
</html>
`;

for (const p of pages) {
  const md = await readFile(join(root, p.src), 'utf8');
  // Notes for the team ("> **Layihədir.**…", "> **Draft.**…") stay out of the public page.
  const clean = md
    .split('\n')
    .filter((line) => !/^> \*\*(Layihədir|Draft)/.test(line))
    .filter((line) => !/^The customer FAQ for the website/.test(line))
    .join('\n');
  await mkdir(join(web, 'public', p.out), { recursive: true });
  await writeFile(join(web, 'public', p.out, 'index.html'), shell(p.title, marked.parse(clean)));
  console.log(`public/${p.out}/index.html`);
}
