// Serve this folder (python3 -m http.server 8765), then:
// node render.js <outDir> <angles, comma-separated> [query, e.g. "size=1200" or "size=1024&bg=F3EFE8&view=icon"]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const [outDir, anglesArg, query = ''] = process.argv.slice(2);
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1000, height: 1000 } });
  p.on('console', (m) => console.log('[page]', m.text()));
  p.on('pageerror', (e) => console.log('[err]', e.message));
  await p.goto(`http://127.0.0.1:8765/scene.html?${query}`);
  await p.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  const angles = anglesArg.split(',').map(Number);
  for (let i = 0; i < angles.length; i++) {
    const url = await p.evaluate((a) => window.renderAngle(a), angles[i]);
    const file = path.join(outDir, `f${String(i).padStart(2, '0')}.png`);
    fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    console.log(file, angles[i]);
  }
  await b.close();
})();
