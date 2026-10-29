// The "signup" take: a salon owner signs up on camera, from the Profile tab to the
// dashboard with the 30-day trial running. Every field is typed on camera; the
// typed spans (and the short scrolls to the next field) are marked as segments,
// which the SignupPhone edit plays at 2×.
// node record-signup.js <outDir> signup
const { clip, chromium } = require('./harness');

(async () => {
  const b = await chromium.launch();

  await clip(b, 'signup', '/profile', async (a) => {
    const { p } = a;
    const field = (ph) => p.getByPlaceholder(ph, { exact: true });

    await a.hold(450);
    await a.tap('Salonunuz var? Biznes hesabı açın');
    await a.hold(550);

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
    await a.tap('Saç', { exact: true });
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

    // The emailed code: the demo backend shows it on screen.
    const code = (await p.evaluate(() => document.body.innerText)).match(/\b\d{6}\b/)?.[0];
    if (!code) {
      await a.labels();
      throw new Error('[signup] no demo code on screen');
    }
    await a.type(null, code, { locator: p.locator('input[autocomplete="one-time-code"]'), perKey: 4 });
    await a.hold(1100);

    // The plan screen: Start, then the free trial.
    await a.tap('Start');
    await a.hold(450);
    await a.tap('30 günlük pulsuz sınağa başla');
    await a.hold(700);
    if (!(await p.getByText('Pulsuz sınaq: 30 gün qalıb').count())) {
      await a.labels();
      throw new Error('[signup] the dashboard did not open');
    }
    await a.hold(3000);
  });

  await b.close();
})();
