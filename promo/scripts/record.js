// Frame-accurate screen recordings of the real app (Expo web), for the promo.
// node record.js <outDir> [clip ...]   (the harness is in harness.js)
const { clip, chromium } = require('./harness');

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

  // A salon owner signs up off camera; the take is choosing a plan and starting the trial.
  await clip(b, 'business', '/business/register', async (a) => {
    await a.offCamera(async () => {
      await a.fill('Adınızı daxil edin', 'Rauf');
      await a.fill('Soyadınızı daxil edin', 'Məmmədov');
      await a.fill('Nömrənizi daxil edin', '50 123 45 67');
      await a.fill('E-poçtunuzu daxil edin', 'rauf@example.com');
      await a.fill('Şifrənizi daxil edin', 'salon123');
      await a.tap('Davam et');
      await a.settle();
      await a.fill('Salonun adını daxil edin', 'Old Town Barbers');
      await a.tap('Bərbər');
      await a.tap('Yalnız kişilər');
      await a.fill('Rayonu daxil edin', 'Səbail');
      await a.fill('Ünvanı daxil edin', 'Kiçik Qala küç. 12');
      await a.tap('Kodu göndər');
      await a.settle(1500);
      const code = (await a.p.evaluate(() => document.body.innerText)).match(/\b\d{6}\b/)[0];
      await a.p.locator('input[autocomplete="one-time-code"]').fill(code);
      await a.settle(2500);
    });
    await a.hold(900);
    await a.tap('Start');
    await a.hold(600);
    await a.tap('Pro');
    await a.hold(700);
    await a.tap('30 günlük pulsuz sınağa başla');
    await a.hold(2600);
  });

  await b.close();
})();
