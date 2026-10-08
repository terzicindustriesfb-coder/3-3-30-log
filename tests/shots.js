'use strict';
/* Pictures of every screen and sheet, light and dark, to lay next to the designs.
   Not a test. Run `node tests/shots.js`; the pictures land in shots/ (not in git).

   Fonts: the app asks Google Fonts for Archivo and Instrument Sans, which the test browser cannot reach.
   With these two packages installed the pictures use the real fonts, otherwise the system's wider ones:
     npm install --no-save @fontsource-variable/archivo @fontsource-variable/instrument-sans */
const fs = require('node:fs');
const path = require('node:path');
const { openApp, closeAll, profile, session, first, abc, threeWeeks } = require('./helpers');

const OUT = path.join(__dirname, '..', 'shots');
const WIDTH = 390, HEIGHT = 844;

const sam = () => ({ id: 'sam', profile: profile({ nick: 'Sam' }), sessions: threeWeeks() });
const act = name => page => page.evaluate(n => ACT[n](), name);
const pushRow = page => page.click('.wo .ex-row[data-slot="push"]');
const progressA = async page => { await page.click('#tabs [data-tab="progress"]'); await page.click('.sc [data-act="scoreTpl"][data-tpl="A"]'); };

/* name, what the app opens with, what to do before the picture */
const SHOTS = [
  ['today-train', { sessions: abc(), crew: [sam()] }],
  ['today-rest', { today: '2026-10-13', sessions: abc() }],
  ['today-done', { today: '2026-10-05', sessions: [first()] }],
  ['sheet-plan', { sessions: abc() }, act('plan')],
  ['sheet-week', { sessions: abc() }, act('week')],
  ['sheet-swap', { sessions: abc() }, act('swap')],
  ['sheet-exercise', { sessions: abc() }, pushRow],
  ['sheet-pick', { sessions: abc() }, async page => { await pushRow(page); await page.click('[data-act="exPick"]'); }],
  ['sheet-new', { sessions: abc() }, async page => { await pushRow(page); await page.click('[data-act="exPick"]'); await page.fill('#exSearch', 'Landmine press'); await page.click('[data-act="exNew"]'); }],
  ['sheet-log', { sessions: abc() }, act('manual')],
  ['progress', { today: '2026-10-21', sessions: threeWeeks() }, progressA],
  ['progress-buddy', { today: '2026-10-21', sessions: [first(), session('2026-10-12', 'B', [30, 8, 40])], crew: [sam()] },
    async page => { await page.click('#tabs [data-tab="progress"]'); await page.click('[data-act="person"][data-id="sam"]'); await page.click('.sc [data-act="scoreTpl"][data-tpl="A"]'); }],
  ['sheet-history', { today: '2026-10-21', sessions: threeWeeks() }, async page => { await progressA(page); await page.click('.sc-row[data-ex="schouderdrukken"]'); }],
];

/* The two typefaces as @font-face rules with the files inlined, or '' when the packages are not installed. */
function fontCss() {
  const face = (family, pkg, file, weight, stretch) => {
    const f = path.join(__dirname, '..', 'node_modules', '@fontsource-variable', pkg, 'files', file);
    if (!fs.existsSync(f)) return '';
    return `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${fs.readFileSync(f).toString('base64')}) format("woff2");font-weight:${weight};font-stretch:${stretch};font-style:normal}`;
  };
  return face('Archivo', 'archivo', 'archivo-latin-standard-normal.woff2', '100 900', '62% 125%')
    + face('Instrument Sans', 'instrument-sans', 'instrument-sans-latin-standard-normal.woff2', '400 700', '75% 100%');
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const fonts = fontCss();
  console.log(fonts ? 'fonts: Archivo and Instrument Sans' : 'fonts: system fallback (see the note at the top of this file)');
  for (const dark of [false, true]) {
    for (const [name, opts, prepare] of SHOTS) {
      const page = await openApp(Object.assign({ width: WIDTH, height: HEIGHT, dark }, opts));
      if (fonts) { await page.addStyleTag({ content: fonts }); await page.evaluate(() => document.fonts.ready); }
      if (prepare) await prepare(page);
      // Make the window as tall as what has to be seen, so the bottom switch and a sheet sit where they belong.
      const need = await page.evaluate(() => {
        const panel = document.querySelector('#sheet:not([hidden]) .sheet-panel');
        return Math.ceil(panel ? panel.scrollHeight / 0.92 + 24 : document.documentElement.scrollHeight);
      });
      if (need > HEIGHT) await page.setViewportSize({ width: WIDTH, height: need });
      await page.evaluate(() => { window.dispatchEvent(new Event('resize')); return new Promise(r => setTimeout(r, 400)); });   // the sheet has risen, charts are redrawn
      const file = path.join(OUT, `${name}${dark ? '-dark' : ''}.png`);
      await page.screenshot({ path: file, fullPage: true });
      if (page.__errors.length) console.log('PAGE ERRORS in', name, page.__errors);
      await page.context().close();
      console.log('saved', path.relative(path.join(__dirname, '..'), file));
    }
  }
  await closeAll();
})().catch(e => { console.error(e); process.exit(1); });
