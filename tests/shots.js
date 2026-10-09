'use strict';
/* Pictures of every screen and sheet, light and dark, to lay next to the designs.
   Not a test. Run `node tests/shots.js`; the pictures land in shots/ (not in git).

   Fonts: the app asks Google Fonts for Archivo and Instrument Sans, which the test browser cannot reach.
   With these two packages installed the pictures use the real fonts, otherwise the system's wider ones:
     npm install --no-save @fontsource-variable/archivo @fontsource-variable/instrument-sans */
const fs = require('node:fs');
const path = require('node:path');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, forward } = require('./helpers');

const OUT = path.join(__dirname, '..', 'shots');
const WIDTH = 390, HEIGHT = 844;

const QUIET = { sound: false, lead: false };
const sam = () => ({ id: 'sam', profile: profile({ nick: 'Sam' }), sessions: threeWeeks() });
const to = screen => page => page.click(`#view [data-act="screen"][data-screen="${screen}"]`);
const start = async (page, reps = [], after = 0) => {
  await page.click('.xc[data-slot="push"] [data-act="start"]');
  for (const n of reps) await page.click(`.xc .pad [data-act="set"][data-n="${n}"]`);
  if (after) await forward(page, after);
};
const change = page => page.click('.xc[data-slot="push"] [data-act="editEx"]');

/* name, what the app opens with, what to do before the picture */
const SHOTS = [
  ['welcome', { profile: null }],
  ['home', { today: '2026-10-09', sessions: [first()] }],
  ['home-buddy', { sessions: abc(), crew: [sam()] }],
  ['home-one-done', { sessions: [first(), session('2026-10-14', 'A', [68, 0, 0])] }],
  ['home-done', { sessions: [first(), session('2026-10-14', 'A', [68, 80, 93])] }],
  ['home-turns', { profile: profile({ rotate: true }), sessions: [first()] }],
  ['card-countdown', { sessions: [first()], prefs: { sound: false, lead: true } }, page => start(page)],
  ['card-running', { sessions: [first()], prefs: QUIET }, page => start(page, [8, 8, 7], 198)],
  ['card-paused', { sessions: [first()], prefs: QUIET }, async page => { await start(page, [8, 8, 7], 198); await page.click('.clockbtn'); }],
  ['card-time-up', { sessions: [first()], prefs: QUIET }, async page => { await start(page, [8, 8, 7, 7, 6, 6, 6, 5, 5, 5, 5], 600); await page.waitForFunction(() => R.saved === 'saved'); }],
  ['card-stopped-early', { sessions: [first()], prefs: QUIET }, async page => { await start(page, [8, 8, 7], 198); await page.click('.clockbtn'); await page.click('.xc [data-act="stopSave"]'); await page.waitForFunction(() => R.saved === 'saved'); }],
  ['results', { today: '2026-10-21', sessions: threeWeeks() }, to('results')],
  ['results-buddy', { today: '2026-10-21', sessions: [first()], crew: [sam()] }, async page => { await to('results')(page); await page.click('[data-act="person"][data-id="sam"]'); }],
  ['results-turns', { profile: profile({ rotate: true }), sessions: abc() }, to('results')],
  ['settings', { sessions: [first()] }, to('settings')],
  ['settings-open', { sessions: [first()], crew: [] }, async page => { await to('settings')(page); await page.click('[data-act="more"][data-more="buddy"]'); await page.click('[data-act="more"][data-more="how"]'); }],
  ['sheet-exercise', { sessions: abc() }, change],
  ['sheet-pick', { sessions: abc() }, async page => { await change(page); await page.click('[data-act="exPick"]'); }],
  ['sheet-new', { sessions: abc() }, async page => { await change(page); await page.click('[data-act="exPick"]'); await page.fill('#exSearch', 'Landmine press'); await page.click('[data-act="exNew"]'); }],
  ['sheet-add', { sessions: abc() }, page => page.evaluate(() => ACT.manual())],
  ['sheet-edit', { sessions: [first(), session('2026-10-14', 'A', [68, 0, 0])] }, page => page.click('.xc[data-form="done"]')],
  ['sheet-swap', { profile: profile({ rotate: true }), sessions: [first()] }, page => page.click('#view [data-act="swap"]')],
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
      // Make the window as tall as what has to be seen, so the page and a sheet sit where they belong.
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
