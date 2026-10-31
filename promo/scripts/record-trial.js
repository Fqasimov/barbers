// The "trial" take: a cold start of the app (the yazılnow launch animation), a short
// look around (Discover, a salon, the map), then a salon owner signs up and starts the
// 30-day free trial of Pro (49 ₼ a month). Typing and short scrolls are marked as
// segments the edit plays at 2×.
// node record-trial.js <outDir> trial
const { clip, chromium } = require('./harness');

(async () => {
  const b = await chromium.launch();

  await clip(
    b,
    'trial',
    '/',
    async (a) => {
      const { p } = a;
      const field = (ph) => p.getByPlaceholder(ph, { exact: true });

      // The launch animation, then the first-run welcome.
      await a.hold(7000);
      await a.hold(900);
      await a.tap('Hələlik sadəcə baxım');
      await a.hold(1000);

      // Discover: a scroll down the city's salons.
      await a.scroll(440, 1500, { y: 520 });
      await a.hold(600);

      // A salon.
      await a.tap('Old Town Barbers, Bərbərxana');
      await a.hold(1100);
      await a.scroll(420, 1300, { y: 600 });
      await a.hold(700);
      await a.tap('Geri');
      await a.hold(700);

      // The map.
      await a.tap('Xəritə');
      await a.hold(1800);

      // Profile → open a business account.
      await a.tap('Profil');
      await a.hold(700);
      await a.tap('Salonunuz var?');
      await a.hold(600);

      // Step 1: the owner.
      await a.type('Adınızı daxil edin', 'Rauf');
      await a.type('Soyadınızı daxil edin', 'Məmmədov');
      await a.type('Nömrənizi daxil edin', '501234567');
      await a.reveal(field('E-poçtunuzu daxil edin'));
      await a.type('E-poçtunuzu daxil edin', 'rauf@oldtown.az');
      await a.reveal(field('Şifrənizi daxil edin'));
      await a.type('Şifrənizi daxil edin', 'salon123');
      await a.hold(150);
      await a.tap('Davam et');
      await a.hold(550);

      // Step 2: the salon.
      await a.type('Salonun adını daxil edin', 'Old Town Barbers');
      await a.hold(120);
      await a.tap('Bərbər', { exact: true });
      await a.hold(150);
      await a.reveal(p.getByLabel('Yalnız kişilər', { exact: true }));
      await a.tap('Yalnız kişilər', { exact: true });
      await a.hold(150);
      await a.reveal(field('Rayonu daxil edin'));
      await a.type('Rayonu daxil edin', 'Səbail');
      await a.reveal(field('Ünvanı daxil edin'));
      await a.type('Ünvanı daxil edin', 'Kiçik Qala küç. 12');
      await a.hold(150);
      await a.tap('Kodu göndər');
      await a.hold(800);

      const code = (await p.evaluate(() => document.body.innerText)).match(/\b\d{6}\b/)?.[0];
      if (!code) {
        await a.labels();
        throw new Error('[trial] no demo code on screen');
      }
      await a.type(null, code, { locator: p.locator('input[autocomplete="one-time-code"]'), perKey: 4 });
      await a.hold(1200);

      // Plans: Pro at 49 ₼, scroll to see it, pick it, start the free trial.
      await a.scroll(560, 1300, { y: 450 });
      await a.hold(500);
      await a.tap('Pro');
      await a.hold(900);
      await a.tap('30 günlük pulsuz sınağa başla');
      await a.hold(900);
      if (!(await p.getByText('Pulsuz sınaq: 30 gün qalıb').count())) {
        await a.labels();
        throw new Error('[trial] the dashboard did not open');
      }
      await a.hold(1800);
      // The Pro tools.
      await a.scroll(760, 1800, { y: 500 });
      await a.hold(2200);
    },
    { seed: { authPrompted: false }, launch: true },
  );

  await b.close();
})();
