// Frame-accurate screen recordings of the real app (Expo web), for the promo.
// Time is faked: every captured frame advances the page clock by exactly 1/30 s,
// so Reanimated transitions, press feedback and scroll physics play back at true speed.
// node rec.js <outDir> [clip ...]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2];
const ONLY = process.argv.slice(3);
const BASE = 'http://localhost:8081';
const FPS = 30;
const W = 390;
const H = 844; // iPhone 15 points; the promo draws the status bar and home indicator over the insets

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

async function clip(browser, name, route, script, { seed } = {}) {
  if (ONLY.length && !ONLY.includes(name)) return;
  const dir = path.join(OUT, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
    geolocation: { latitude: 40.3725, longitude: 49.8375 },
    permissions: ['geolocation'],
  });
  // Give the app real iPhone safe-area insets (react-native-safe-area-context reads them via getComputedStyle).
  await ctx.addInitScript(() => {
    const orig = window.getComputedStyle;
    window.getComputedStyle = function (el, ...rest) {
      const cs = orig.call(window, el, ...rest);
      if (el && el.style && String(el.style.paddingTop).includes('safe-area')) {
        return new Proxy(cs, {
          get: (t, k) => (k === 'paddingTop' ? '47px' : k === 'paddingBottom' ? '34px' : typeof t[k] === 'function' ? t[k].bind(t) : t[k]),
        });
      }
      return cs;
    };
  });
  await ctx.addInitScript((s) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('usta-store-v2', JSON.stringify({ state: { locale: 'az', ...s }, version: 2 }));
      sessionStorage.setItem('seeded', '1');
    }
  }, seed ?? {});
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('[err]', e.message));
  await p.clock.install();
  await p.goto(BASE + route);
  // Let the bundle, fonts and the splash finish in fake time before the take starts.
  for (let i = 0; i < 40; i++) {
    await p.clock.runFor(100);
    await p.waitForTimeout(60);
  }
  await p.clock.runFor(3000);
  await p.waitForTimeout(400);
  await p.clock.runFor(500);

  let n = 0;
  const events = [];
  const snap = async () => {
    await p.screenshot({ path: path.join(dir, `${String(n).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 93 });
    n++;
  };
  let rolling = true;
  const tick = async () => {
    await p.clock.runFor(1000 / FPS);
    if (rolling) await snap();
  };
  const api = {
    p,
    hold: async (ms) => {
      for (let i = 0; i < Math.round((ms / 1000) * FPS); i++) await tick();
    },
    /** Find a pressable by its accessibility label (prefix match) and return its centre. */
    find: async (label, { nth = 0, exact = false } = {}) => {
      const r = await p.evaluate(
        ({ label, nth, exact }) => {
          const els = [...document.querySelectorAll('[aria-label]')].filter((e) => {
            const l = e.getAttribute('aria-label');
            const b = e.getBoundingClientRect();
            return (exact ? l === label : l.startsWith(label)) && b.width > 0 && b.height > 0;
          });
          const e = els[nth];
          if (!e) return null;
          const b = e.getBoundingClientRect();
          return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
        },
        { label, nth, exact },
      );
      if (!r) {
        const all = await p.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')));
        throw new Error(`[${name}] no element "${label}". Have: ${all.join(' | ')}`);
      }
      return r;
    },
    tap: async (label, opts = {}) => {
      const { x, y } = typeof label === 'string' ? await api.find(label, opts) : label;
      events.push({ frame: n, x, y });
      await p.mouse.move(x, y);
      await p.mouse.down();
      for (let i = 0; i < 4; i++) await tick();
      await p.mouse.up();
      await tick();
      await p.waitForTimeout(80);
      await tick();
    },
    /** Eased scroll of the scroller under (x, y) by dy points. */
    scroll: async (dy, ms, { x = W / 2, y = H / 2, ease = easeInOut, horizontal = false } = {}) => {
      const frames = Math.round((ms / 1000) * FPS);
      const start = await p.evaluate(
        ({ x, y, horizontal }) => {
          let e = document.elementFromPoint(x, y);
          while (e && !(horizontal ? e.scrollWidth > e.clientWidth + 4 && /(auto|scroll)/.test(getComputedStyle(e).overflowX) : e.scrollHeight > e.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(e).overflowY))) e = e.parentElement;
          if (!e) return null;
          window.__scroller = e;
          return horizontal ? e.scrollLeft : e.scrollTop;
        },
        { x, y, horizontal },
      );
      if (start === null) throw new Error(`[${name}] nothing scrolls at ${x},${y}`);
      for (let i = 1; i <= frames; i++) {
        const v = start + dy * ease(i / frames);
        await p.evaluate(({ v, horizontal }) => {
          if (horizontal) window.__scroller.scrollLeft = v;
          else window.__scroller.scrollTop = v;
        }, { v, horizontal });
        await tick();
      }
    },
    box: async (label) =>
      p.evaluate((label) => {
        const e = [...document.querySelectorAll('[aria-label]')].find((e) => e.getAttribute('aria-label') === label);
        const b = e.getBoundingClientRect();
        return { x: b.x, y: b.y, w: b.width, h: b.height };
      }, label),
    /** Press, drag horizontally across, release — for the star slider. */
    drag: async (from, to, ms) => {
      events.push({ frame: n, x: from.x, y: from.y, drag: true });
      await p.mouse.move(from.x, from.y);
      await p.mouse.down();
      await tick();
      const frames = Math.round((ms / 1000) * FPS);
      for (let i = 1; i <= frames; i++) {
        const t = easeInOut(i / frames);
        await p.mouse.move(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t);
        events.push({ frame: n, x: from.x + (to.x - from.x) * t, y: from.y, drag: true });
        await tick();
      }
      await p.mouse.up();
      await tick();
    },
    /** Do setup the viewer shouldn't see. */
    offCamera: async (fn) => {
      rolling = false;
      const before = events.length;
      await fn();
      events.length = before;
      rolling = true;
    },
    labels: async () => console.log(await p.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).join(' | '))),
  };
  await script(api);
  fs.writeFileSync(path.join(dir, 'events.json'), JSON.stringify({ frames: n, events }));
  console.log(name, n, 'frames');
  await ctx.close();
}

(async () => {
  const b = await chromium.launch();

  await clip(b, 'home', '/', async (a) => {
    await a.hold(700);
    await a.scroll(520, 2200);
    await a.hold(500);
    await a.scroll(560, 2000);
    await a.hold(600);
  });

  await clip(b, 'find', '/find', async (a) => {
    await a.hold(600);
    await a.tap('Sabah');
    await a.hold(500);
    await a.tap('Səhər');
    await a.hold(500);
    await a.scroll(380, 1500);
    await a.hold(600);
  });

  await clip(b, 'salon', '/salon/old-town-barbers', async (a) => {
    await a.hold(600);
    await a.scroll(300, 1400);
    await a.hold(400);
    await a.tap('Növbə götür');
  });

  await clip(b, 'book', '/book/old-town-barbers', async (a) => {
    await a.hold(500);
    await a.tap('Skin fade');
    await a.hold(250);
    await a.tap('Saqqal düzəlişi');
    await a.hold(400);
    await a.tap('Davam et');
    await a.hold(600);
    await a.tap('Rauf Məmmədov');
    await a.hold(300);
    await a.tap('Davam et');
    await a.hold(600);
    await a.tap('Ç. 7 okt');
    await a.hold(500);
    await a.tap('15:30');
    await a.hold(400);
    await a.tap('Davam et');
    await a.hold(900);
    await a.tap('Təsdiqlə');
    await a.hold(2200);
  });

  await clip(b, 'map', '/map', async (a) => {
    await a.hold(700);
    await a.tap('Orta');
    await a.hold(700);
    await a.tap('Ən yaxın');
    await a.hold(900);
  });

  await clip(b, 'compare', '/compare', async (a) => {
    await a.offCamera(async () => {
      await a.tap('Old Town Barbers');
      await a.hold(400);
      await a.scroll(520, 300);
      await a.tap('The Shave Club');
      await a.hold(400);
      await a.scroll(-2000, 300);
      await a.hold(400);
    });
    await a.hold(700);
    await a.scroll(560, 1300);
    await a.hold(300);
    await a.tap('Kəsim Studio');
    await a.hold(500);
    await a.scroll(-560, 1300);
    await a.hold(1200);
  });

  await clip(b, 'past', '/bookings', async (a) => {
    await a.hold(300);
    await a.tap('Keçmiş');
    await a.hold(700);
    await a.tap('Ziyarətinizi qiymətləndirin');
  });

  await clip(b, 'review', '/review/old-town-barbers?booking=demo-visit', async (a) => {
    await a.hold(500);
    const r = await a.box('Qiymət');
    const star = (i) => ({ x: r.x + (r.w / 5) * (i + 0.5), y: r.y + r.h / 2 });
    await a.drag(star(0), star(4), 700);
    await a.hold(500);
    await a.tap('Rauf');
    await a.hold(250);
    await a.tap('Peşəkar');
    await a.hold(200);
    await a.tap('Təmiz');
    await a.hold(900);
  });

  await b.close();
})();
