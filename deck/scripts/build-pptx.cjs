// Editable PowerPoint of the deck: real text boxes, native shapes and a native chart.
// Words come from src/content.ts (the same file as the web deck), app screens from
// export/phones (python3 scripts/phones.py).
//   node scripts/build-pptx.cjs  ->  export/yazilnow-pitch-deck-editable.pptx
const path = require('path');
const { execFileSync } = require('child_process');
const fs = require('fs');
const pptxgen = require('pptxgenjs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'export', 'yazilnow-pitch-deck-editable.pptx');
const PH = (n) => path.join(ROOT, 'export', 'phones', `${n}.png`);

// content.ts → CommonJS, so the PowerPoint says exactly what the web deck says.
const tmp = path.join(require('os').tmpdir(), 'yazilnow-content.cjs');
execFileSync(path.join(ROOT, 'node_modules', '.bin', 'esbuild'), [path.join(ROOT, 'src', 'content.ts'), '--format=cjs', `--outfile=${tmp}`, '--log-level=warning']);
const c = require(tmp);

// The brand: beige and black, burgundy and silver in support.
const THEME = {
  name: 'yazilnow',
  headFontFace: 'Cambria',
  bodyFontFace: 'Calibri',
  colors: {
    dk1: '141210',
    lt1: 'FFFFFF',
    dk2: '5B544B',
    lt2: 'F2EADD',
    accent1: '6B1A2A',
    accent2: 'A3A8AE',
    accent3: 'E7DCC9',
    accent4: 'FBF7F0',
    accent5: '8C8478',
    accent6: 'F3E3E4',
    hlink: '6B1A2A',
    folHlink: '5B544B',
  },
};
const HEX = THEME.colors;

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 × 7.5 in
pres.title = 'yazılnow — pitch deck';
pres.author = 'yazılnow';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
// Plain hex, so the file looks right in any viewer; the theme carries the same colours.
const ink = HEX.dk1;
const soft = HEX.dk2;
const cream = HEX.lt2;
const burgundy = HEX.accent1;
const silver = HEX.accent2;
const sand = HEX.accent3;
const paper = HEX.accent4;
const mute = HEX.accent5;
const blush = HEX.accent6;

const W = 13.333;
const M = 0.75; // side margin
const PHONE_RATIO = 1768 / 860;

// --- Layouts ---------------------------------------------------------------
pres.defineSlideMaster({
  title: 'Cover',
  background: { color: cream },
  objects: [],
});
pres.defineSlideMaster({
  title: 'Content',
  background: { color: cream },
  margin: [0.5, M, 0.6, M],
  objects: [
    { image: { path: PH('mark'), x: M - 0.06, y: 6.86, w: 0.3, h: 0.3 } },
    { text: { text: 'yazılnow', options: { x: M + 0.24, y: 6.86, w: 1.4, h: 0.3, fontSize: 12, bold: true, color: ink, margin: 0, valign: 'middle' } } },
    {
      placeholder: {
        options: { name: 'kicker', type: 'body', x: M, y: 0.6, w: 9, h: 0.32, fontSize: 12, bold: true, color: burgundy, charSpacing: 2, margin: 0, valign: 'top' },
        text: '',
      },
    },
    {
      placeholder: {
        options: { name: 'title', type: 'title', x: M, y: 0.95, w: 7.3, h: 1.4, fontSize: 36, color: ink, margin: 0, align: 'left', valign: 'top', fontFace: THEME.headFontFace },
        text: '',
      },
    },
  ],
  slideNumber: { x: W - M - 0.8, y: 6.86, w: 0.8, h: 0.3, fontSize: 11, color: mute, align: 'right', margin: 0 },
});

let n = 0;
const content = (kicker, title, notes) => {
  const s = pres.addSlide({ masterName: 'Content' });
  s.addText(kicker.toUpperCase(), { placeholder: 'kicker' });
  s.addText(title.replace(/\.$/, ''), { placeholder: 'title', align: 'left' });
  s.addNotes(notes);
  n++;
  return s;
};
const text = (s, t, o) => s.addText(t, { isTextBox: true, margin: 0, color: ink, fontSize: 15, valign: 'top', ...o });
const card = (s, x, y, w, h, name, fill = paper) =>
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.18, fill: { color: fill }, line: { color: sand, width: 0.75 }, objectName: name });
const phone = (s, name, x, y, w, rotate = 0) =>
  s.addImage({ path: PH(name), x, y, w, h: w * PHONE_RATIO, rotate, altText: `App screen: ${name}`, objectName: `Phone ${name}` });
const tick = (s, x, y, name) => {
  s.addShape(pres.shapes.OVAL, { x, y, w: 0.26, h: 0.26, fill: { color: ink }, line: { type: 'none' }, objectName: name });
  text(s, '✓', { x, y: y - 0.01, w: 0.26, h: 0.26, fontSize: 11, bold: true, color: cream, align: 'center', valign: 'middle' });
};
const contactLine = (s, y, align = 'left', x = M, w = 8) =>
  text(s, [
    { text: c.brand.website },
    { text: '   ·   ', options: { color: burgundy } },
    { text: c.brand.email },
  ], { x, y, w, h: 0.35, fontSize: 15, color: soft, align });

// --- 1 · Introduction -------------------------------------------------------
{
  const s = pres.addSlide({ masterName: 'Cover' });
  text(s, c.brand.course.toUpperCase(), { x: 1, y: 1.85, w: W - 2, h: 0.32, fontSize: 12, bold: true, color: burgundy, charSpacing: 2, align: 'center', objectName: 'Course' });
  s.addImage({ path: PH('mark'), x: 3.55, y: 2.3, w: 1.35, h: 1.35, objectName: 'Logo mark' });
  text(s, 'yazılnow', { x: 4.95, y: 2.45, w: 5, h: 1.1, fontSize: 72, bold: true, color: ink, charSpacing: -2, valign: 'middle', objectName: 'Logo word' });
  text(s, c.brand.tagline, { x: 2.4, y: 4.0, w: W - 4.8, h: 0.95, fontSize: 24, italic: true, fontFace: THEME.headFontFace, align: 'center', objectName: 'Tagline' });
  contactLine(s, 5.25, 'center', 2.4, W - 4.8);
  s.addNotes('Introduction. In the web deck the app’s opening animation plays here first. One sentence: what yazılnow does.');
  n++;
}

// --- 2 · Problem ------------------------------------------------------------
{
  const s = content(c.problem.kicker, c.problem.title, 'Problem: booking in Baku happens in DMs. Walk through the three facts, then the chat.', 7.2);
  c.problem.points.forEach((p, i) => {
    const y = 2.75 + i * 1.32;
    text(s, p.figure, { x: M, y: y - 0.08, w: 1.75, h: 0.7, fontSize: 38, color: burgundy, fontFace: THEME.headFontFace, objectName: `Fact ${i + 1} figure` });
    text(s, p.text, { x: 2.65, y, w: 5.15, h: 0.62, fontSize: 15, objectName: `Fact ${i + 1}` });
    text(s, p.source, { x: 2.65, y: y + 0.66, w: 5.15, h: 0.3, fontSize: 10, color: mute, objectName: `Fact ${i + 1} source` });
  });
  // The DM, as native shapes.
  const X = 8.55;
  const CW = 4.03;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: X, y: 0.95, w: CW, h: 5.55, rectRadius: 0.25, fill: { color: sand }, line: { type: 'none' }, shadow: { type: 'outer', color: '2A2015', opacity: 0.22, blur: 18, offset: 6, angle: 90 }, objectName: 'Chat card' });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: X, y: 0.95, w: CW, h: 0.75, rectRadius: 0.25, fill: { color: paper }, line: { type: 'none' }, objectName: 'Chat header' });
  s.addShape(pres.shapes.RECTANGLE, { x: X, y: 1.45, w: CW, h: 0.25, fill: { color: paper }, line: { type: 'none' } });
  s.addShape(pres.shapes.OVAL, { x: X + 0.22, y: 1.1, w: 0.42, h: 0.42, fill: { color: ink }, line: { type: 'none' } });
  text(s, 'S', { x: X + 0.22, y: 1.1, w: 0.42, h: 0.42, fontSize: 13, bold: true, color: cream, align: 'center', valign: 'middle' });
  text(s, [{ text: 'Salon', options: { bold: true, breakLine: true } }, { text: 'Instagram DM', options: { fontSize: 11, color: mute } }], { x: X + 0.78, y: 1.05, w: 2.5, h: 0.55, fontSize: 15 });
  let y = 1.95;
  c.problem.chat.forEach((m, i) => {
    if (m.from === 'time') {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: X + CW / 2 - 0.75, y, w: 1.5, h: 0.34, rectRadius: 0.17, fill: { color: 'E0D5C2' }, line: { type: 'none' } });
      text(s, `⏱  ${m.text}`, { x: X + CW / 2 - 0.75, y, w: 1.5, h: 0.34, fontSize: 11, bold: true, color: soft, align: 'center', valign: 'middle', objectName: 'Chat time' });
      y += 0.55;
      return;
    }
    const mine = m.from === 'client';
    const last = i === c.problem.chat.length - 1;
    const bw = Math.min(3.1, 0.6 + m.text.length * 0.095);
    const lines = Math.ceil((m.text.length * 0.095) / (bw - 0.4));
    const bh = 0.28 + lines * 0.27;
    const bx = mine ? X + CW - 0.25 - bw : X + 0.25;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: bx, y, w: bw, h: bh, rectRadius: 0.16, fill: { color: mine ? ink : last ? blush : 'FFFFFF' }, line: { type: 'none' }, objectName: `Chat bubble ${i + 1}` });
    text(s, m.text, { x: bx + 0.18, y, w: bw - 0.36, h: bh, fontSize: 14, color: mine ? cream : last ? burgundy : ink, valign: 'middle', objectName: `Chat text ${i + 1}` });
    y += bh + 0.2;
  });
}

// --- 3 · Solution -----------------------------------------------------------
{
  const s = content(c.solution.kicker, c.solution.title, 'Solution: one map of every free time. Three groups of benefits, then what nobody else offers.', 7.2);
  const cw = 2.45;
  c.solution.pillars.forEach((p, i) => {
    const x = M + i * (cw + 0.22);
    card(s, x, 2.75, cw, 2.35, `Pillar ${p.title}`);
    text(s, p.title.toUpperCase(), { x: x + 0.22, y: 2.95, w: cw - 0.44, h: 0.3, fontSize: 12, bold: true, color: burgundy, charSpacing: 1.5 });
    text(s, p.lines.map((l, k) => ({ text: l, options: { breakLine: k < p.lines.length - 1 } })), { x: x + 0.22, y: 3.35, w: cw - 0.44, h: 1.65, fontSize: 14, paraSpaceAfter: 8 });
  });
  text(s, c.solution.unique, { x: M, y: 5.45, w: 7.8, h: 0.8, fontSize: 17, italic: true, fontFace: THEME.headFontFace, objectName: 'What nobody else does' });
  phone(s, 'find', 8.75, 1.45, 2.1, -3);
  phone(s, 'map', 10.35, 0.95, 2.1, 2);
}

// --- 4 · Product for clients ------------------------------------------------
{
  const s = content(c.productClients.kicker, c.productClients.title, 'Product for clients: home, a salon, booking a time, comparing salons. The web deck plays the screen recording.', 9);
  const shots = [['rec-browse', 'Home'], ['salon', 'Salon'], ['book', 'Booking'], ['compare', 'Compare']];
  shots.forEach(([n, cap], i) => {
    const x = M + i * 2.0;
    const yy = 2.15 + (i % 2) * 0.18;
    phone(s, n, x, yy, 1.82);
    text(s, cap, { x, y: yy + 1.82 * PHONE_RATIO + 0.08, w: 1.82, h: 0.28, fontSize: 11, color: mute, align: 'center' });
  });
  c.productClients.features.forEach((f, i) => {
    const y = 2.2 + i * 1.08;
    text(s, String(i + 1).padStart(2, '0'), { x: 9.0, y: y + 0.03, w: 0.45, h: 0.3, fontSize: 12, bold: true, color: burgundy });
    text(s, [{ text: f.title, options: { bold: true, fontSize: 16, breakLine: true } }, { text: f.text, options: { fontSize: 13, color: soft } }], { x: 9.45, y, w: 3.15, h: 0.95, objectName: `Feature ${f.title}` });
  });
}

// --- 5 · Product for salons -------------------------------------------------
{
  const s = content(c.productSalons.kicker, c.productSalons.title, 'Product for salons: signing up and starting the Pro trial, then the tools. The web deck plays the recording.', 7.2);
  c.productSalons.features.forEach((f, i) => {
    const y = 2.75 + i * 0.5;
    tick(s, M, y + 0.03, `Tick ${i + 1}`);
    text(s, f, { x: M + 0.42, y, w: 6.5, h: 0.36, fontSize: 16, valign: 'middle', objectName: `Salon feature ${i + 1}` });
  });
  text(s, c.productSalons.note, { x: M, y: 5.95, w: 6.5, h: 0.4, fontSize: 15, color: soft });
  phone(s, 'rec-trial', 8.55, 1.35, 2.15);
  phone(s, 'qr', 10.45, 0.95, 2.0, 2);
}

// --- 6 · Beta test ----------------------------------------------------------
{
  const s = content(c.testers.kicker, c.testers.title, 'Beta test: five anonymous testers. Replace these notes with what your testers actually said.', 11);
  text(s, c.testers.subtitle, { x: M, y: 1.75, w: 10, h: 0.4, fontSize: 16, color: soft });
  const cw = (W - 2 * M - 2 * 0.25) / 3;
  c.testers.notes.forEach((t, i) => {
    const row = i < 3 ? 0 : 1;
    const col = i < 3 ? i : i - 3;
    const x = M + (row ? cw / 2 + 0.125 : 0) + col * (cw + 0.25);
    const y = 2.5 + row * 2.0;
    card(s, x, y, cw, 1.75, `Tester ${i + 1}`);
    text(s, `“${t.text}”`, { x: x + 0.25, y: y + 0.2, w: cw - 0.5, h: 1.05, fontSize: 16, fontFace: THEME.headFontFace, objectName: `Tester ${i + 1} note` });
    text(s, t.who.toUpperCase(), { x: x + 0.25, y: y + 1.35, w: cw - 0.5, h: 0.25, fontSize: 10, bold: true, color: burgundy, charSpacing: 1.5 });
  });
}

// --- 7 · Market -------------------------------------------------------------
{
  const s = content(c.market.kicker, c.market.title, 'Market: who we serve, and what a salon with five masters pays a month elsewhere.', 11);
  c.market.who.forEach((w, i) => {
    const y = 2.6 + i * 0.95;
    text(s, w.label.toUpperCase(), { x: M, y, w: 5, h: 0.26, fontSize: 11, bold: true, color: burgundy, charSpacing: 1.5 });
    text(s, w.text, { x: M, y: y + 0.28, w: 5.2, h: 0.55, fontSize: 15 });
    if (w.source) text(s, w.source, { x: M, y: y + 0.6, w: 5.2, h: 0.25, fontSize: 10, color: mute });
  });
  text(s, c.market.trend, { x: M, y: 5.5, w: 5.2, h: 0.8, fontSize: 16, italic: true, fontFace: THEME.headFontFace });
  card(s, 6.45, 2.45, W - M - 6.45, 4.05, 'Chart card');
  s.addChart(pres.charts.BAR, [{ name: 'AZN a month', labels: c.market.chart.map((b) => b.name), values: c.market.chart.map((b) => b.value) }], {
    x: 6.65, y: 2.6, w: W - M - 6.85, h: 2.9,
    barDir: 'bar',
    showTitle: true,
    title: c.market.chartTitle,
    titleFontSize: 14,
    titleColor: HEX.dk1,
    titleFontFace: '+mn-lt',
    chartColors: c.market.chart.map((b) => (b.ours ? HEX.accent1 : HEX.accent2)),
    catAxisOrientation: 'maxMin',
    catAxisLabelColor: HEX.dk1,
    catAxisLabelFontSize: 12,
    catAxisLabelFontFace: '+mn-lt',
    catAxisLineShow: false,
    valAxisHidden: true,
    valGridLine: { style: 'none' },
    catGridLine: { style: 'none' },
    showValue: true,
    dataLabelPosition: 'outEnd',
    dataLabelFormatCode: '0" ₼"',
    dataLabelColor: HEX.dk1,
    dataLabelFontSize: 12,
    dataLabelFontBold: true,
    dataLabelFontFace: '+mn-lt',
    barGapWidthPct: 60,
    showLegend: false,
    objectName: 'Price chart',
  });
  text(s, c.market.chart.map((b, i) => ({ text: `${b.name}: ${b.note}`, options: { breakLine: i < c.market.chart.length - 1 } })), { x: 6.7, y: 5.5, w: W - M - 6.95, h: 0.75, fontSize: 10, color: soft });
  text(s, c.market.chartSource, { x: 6.7, y: 6.2, w: W - M - 6.95, h: 0.22, fontSize: 10, color: mute });
}

// --- 8 · Business model -----------------------------------------------------
{
  const s = content(c.model.kicker, c.model.title, 'Business model: the three plans exactly as in the app. No commission on bookings.', 11);
  const cw = (W - 2 * M - 2 * 0.25) / 3;
  c.model.plans.forEach((p, i) => {
    const x = M + i * (cw + 0.25);
    const y = 2.2;
    const dark = !!p.recommended;
    card(s, x, y, cw, 3.55, `Plan ${p.name}`, dark ? ink : paper);
    text(s, p.name, { x: x + 0.3, y: y + 0.28, w: 2, h: 0.5, fontSize: 24, fontFace: THEME.headFontFace, color: dark ? cream : ink });
    if (dark) {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + cw - 1.65, y: y + 0.33, w: 1.35, h: 0.32, rectRadius: 0.16, fill: { color: burgundy }, line: { type: 'none' } });
      text(s, 'RECOMMENDED', { x: x + cw - 1.65, y: y + 0.33, w: 1.35, h: 0.32, fontSize: 10, bold: true, color: cream, align: 'center', valign: 'middle', charSpacing: 1 });
    }
    text(s, [{ text: `${p.price} ₼`, options: { fontSize: 36, bold: true } }, { text: '  / month', options: { fontSize: 13, color: dark ? silver : mute } }], { x: x + 0.3, y: y + 0.9, w: cw - 0.6, h: 0.7, color: dark ? cream : ink, valign: 'bottom' });
    text(s, p.lines.map((l, k) => ({ text: l, options: { bullet: { indent: 14 }, breakLine: k < p.lines.length - 1 } })), { x: x + 0.3, y: y + 1.8, w: cw - 0.55, h: 1.6, fontSize: 14, color: dark ? cream : ink, paraSpaceAfter: 6 });
  });
  text(s, c.model.extras.join('     ·     '), { x: M, y: 6.0, w: W - 2 * M, h: 0.35, fontSize: 15, color: soft });
}

// --- 9 · Where we are -------------------------------------------------------
{
  const s = content(c.built.kicker, c.built.title, 'Where we are: what exists today, and the next three steps.', 7.2);
  c.built.done.forEach((d, i) => {
    const y = 2.6 + i * 0.5;
    tick(s, M, y + 0.03, `Done ${i + 1}`);
    text(s, d, { x: M + 0.42, y, w: 6.6, h: 0.36, fontSize: 16, valign: 'middle' });
  });
  text(s, 'NEXT', { x: M, y: 5.25, w: 3, h: 0.26, fontSize: 11, bold: true, color: burgundy, charSpacing: 1.5 });
  text(s, c.built.next.map((t, i) => ({ text: t, options: { bullet: { type: 'number' }, breakLine: i < c.built.next.length - 1 } })), { x: M, y: 5.55, w: 6.5, h: 1.1, fontSize: 15, color: soft, paraSpaceAfter: 4 });
  phone(s, 'home', 8.6, 1.35, 2.1, -2);
  phone(s, 'tools', 10.45, 0.95, 2.1, 2);
}

// --- 10 · Team --------------------------------------------------------------
{
  const s = content(c.team.kicker, c.team.title, 'Team: names, roles and one line each. Then the contacts.', 11);
  const cw = (W - 2 * M - 2 * 0.25) / 3;
  c.team.people.forEach((p, i) => {
    const x = M + i * (cw + 0.25);
    card(s, x, 2.2, cw, 2.75, `Person ${i + 1}`);
    s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: 2.5, w: 0.75, h: 0.75, fill: { color: ink }, line: { type: 'none' } });
    const ini = p.name.split(' ').map((w) => w[0]).join('').slice(0, 2);
    text(s, ini, { x: x + 0.3, y: 2.5, w: 0.75, h: 0.75, fontSize: 20, color: cream, align: 'center', valign: 'middle', fontFace: THEME.headFontFace, objectName: `Person ${i + 1} initials` });
    text(s, p.name, { x: x + 0.3, y: 3.45, w: cw - 0.6, h: 0.45, fontSize: 22, fontFace: THEME.headFontFace, objectName: `Person ${i + 1} name` });
    text(s, p.role.toUpperCase(), { x: x + 0.3, y: 3.92, w: cw - 0.6, h: 0.26, fontSize: 11, bold: true, color: burgundy, charSpacing: 1.5, objectName: `Person ${i + 1} role` });
    text(s, p.bio, { x: x + 0.3, y: 4.25, w: cw - 0.6, h: 0.6, fontSize: 14, color: soft, objectName: `Person ${i + 1} bio` });
  });
  contactLine(s, 5.35);
}

// --- 11 · Thank you ---------------------------------------------------------
{
  const s = pres.addSlide({ masterName: 'Cover' });
  s.addImage({ path: PH('mark'), x: 4.2, y: 1.55, w: 1.0, h: 1.0, objectName: 'Logo mark' });
  text(s, 'yazılnow', { x: 5.2, y: 1.62, w: 4, h: 0.85, fontSize: 52, bold: true, charSpacing: -1.5, valign: 'middle', objectName: 'Logo word' });
  text(s, c.thanks.title.replace(/\.$/, ''), { x: 1, y: 2.95, w: W - 2, h: 1.3, fontSize: 60, fontFace: THEME.headFontFace, align: 'center', valign: 'middle', objectName: 'Thank you' });
  text(s, c.thanks.line, { x: 1, y: 4.35, w: W - 2, h: 0.5, fontSize: 22, italic: true, fontFace: THEME.headFontFace, align: 'center', objectName: 'Line' });
  contactLine(s, 5.15, 'center', 2.4, W - 4.8);
  s.addNotes('Thank you. Contacts on screen.');
  n++;
}

(async () => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  await pres.writeFile({ fileName: OUT });
  // Optional: write the brand palette and fonts into the file's theme too.
  if (process.env.PPTX_THEME_TOOL) await require(process.env.PPTX_THEME_TOOL).applyTheme(OUT, THEME);
  console.log(`${OUT} (${n} slides)`);
})();
