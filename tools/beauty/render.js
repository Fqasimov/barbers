// Serve this folder (python3 -m http.server 8766), then:
// node render.js <outDir> <name>=<json pose> ...   e.g. hairdryer='{"tool":"hairdryer"}'
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const [outDir, ...jobs] = process.argv.slice(2);
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1000, height: 1000 } });
  p.on('console', (m) => console.log('[page]', m.text()));
  p.on('pageerror', (e) => console.log('[err]', e.message));
  await p.goto(`http://127.0.0.1:8766/scene.html?size=${process.env.SIZE || 900}`);
  await p.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  for (const job of jobs) {
    const i = job.indexOf('=');
    const name = job.slice(0, i);
    const url = await p.evaluate((pose) => window.renderTool(pose), JSON.parse(job.slice(i + 1)));
    const file = path.join(outDir, `${name}.png`);
    fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    console.log(file);
  }
  await b.close();
})();
