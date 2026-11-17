// The "owner" take: a salon owner opens a business account, sees the four plans, starts
// the free trial, adds a service and a barber, and lands on the salon dashboard.
// node record-owner.js <outDir> owner
const { clip, chromium } = require('./harness');

(async () => {
  const b = await chromium.launch();

  await clip(
    b,
    'owner',
    '/',
    async (a) => {
      const { p } = a;
      const field = (ph) => p.getByPlaceholder(ph, { exact: true });

      await a.offCamera(async () => {
        await a.hold(1500);
        await a.tap('Hələlik sadəcə baxım');
        await a.hold(800);
      });
      await a.tap('Profil');
      await a.hold(600);
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
      await a.tap('Davam et');
      await a.hold(500);

      // Step 2: the salon.
      await a.type('Salonun adını daxil edin', 'Old Town Barbers');
      await a.tap('Bərbər', { exact: true });
      await a.reveal(p.getByLabel('Yalnız kişilər', { exact: true }));
      await a.tap('Yalnız kişilər', { exact: true });
      await a.reveal(field('Rayonu daxil edin'));
      await a.type('Rayonu daxil edin', 'Səbail');
      await a.reveal(field('Ünvanı daxil edin'));
      await a.type('Ünvanı daxil edin', 'Kiçik Qala küç. 12');
      await a.tap('Kodu göndər');
      await a.hold(700);
      const code = (await p.evaluate(() => document.body.innerText)).match(/\b\d{6}\b/)?.[0];
      if (!code) {
        await a.labels();
        throw new Error('[owner] no demo code on screen');
      }
      await a.type(null, code, { locator: p.locator('input[autocomplete="one-time-code"]'), perKey: 4 });
      await a.hold(1000);

      // The plans: Sadə, Fərdi, Start, Pro.
      await a.scroll(700, 1600, { y: 450 });
      await a.hold(400);
      await a.tap('Pro');
      await a.hold(600);
      if (await p.getByLabel('30 günlük pulsuz sınağa başla').count()) await a.tap('30 günlük pulsuz sınağa başla');
      await a.hold(1500);

      // A service.
      await a.reveal(p.getByLabel(/^Xidmətlər, /));
      await a.tap('Xidmətlər, 0 xidmət');
      await a.hold(500);
      await a.tap('Xidmət əlavə et');
      await a.hold(500);
      await a.type('Xidmətin adını daxil edin', 'Saç kəsimi');
      await a.type('Dəqiqəni daxil edin', '45');
      await a.type('Qiyməti daxil edin', '20');
      await a.tap('Yadda saxla');
      await a.hold(800);
      await a.tap('Geri');
      await a.hold(500);

      // A barber.
      await a.reveal(p.getByLabel(/^Ustalar, /));
      await a.tap('Ustalar, 0 usta');
      await a.hold(500);
      await a.tap('Usta əlavə et');
      await a.hold(500);
      await a.type('Ustanın adını daxil edin', 'Elvin Quliyev');
      await a.type('Vəzifəni daxil edin', 'Bərbər');
      // The salon's only service is already ticked for a new barber.
      await a.hold(300);
      await a.reveal(p.getByLabel('Yadda saxla', { exact: true }));
      await a.tap('Yadda saxla');
      await a.hold(1000);
      await a.tap('Geri');
      await a.hold(800);

      // The dashboard.
      await a.hold(1200);
      try {
        await a.scroll(600, 1500, { y: 600 });
      } catch {
        // already at the end
      }
      await a.hold(1500);
    },
    { seed: { authPrompted: false } },
  );

  await b.close();
})();
