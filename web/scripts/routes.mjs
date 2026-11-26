// After `vite build`: each website page gets its own folder with the same app shell, so
// /pricing and /register open directly on any static host (no rewrite rules needed).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const html = await readFile(join(dist, 'index.html'), 'utf8');

const pages = {
  pricing: {
    title: 'Qiymətlər · yazılnow',
    description: 'yazılnow planları: salonlar, bərbərxanalar və couture showroomlar üçün. İlk 30 gün pulsuz, kart tələb olunmur.',
  },
  register: {
    title: 'Biznesinizi qoşun · yazılnow',
    description: 'Salonunuzu, bərbərxananızı və ya showroomunuzu 15 dəqiqəyə yazılnow-a qoşun. İlk 30 gün pulsuz.',
  },
};

for (const [name, meta] of Object.entries(pages)) {
  const out = html
    .replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${meta.description}$2`)
    .replace(/(<link rel="canonical" href="https:\/\/[^/"]+\/)(")/, `$1${name}$2`)
    .replace(/(<meta property="og:url" content="https:\/\/[^/"]+\/)(")/, `$1${name}$2`);
  await mkdir(join(dist, name), { recursive: true });
  await writeFile(join(dist, name, 'index.html'), out);
}
console.log('pages:', Object.keys(pages).join(', '));
