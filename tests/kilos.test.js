const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');
const { openApp, closeAll, profile, session, first, threeWeeks, txt, texts } = h;
/* The kilos lifted per exercise per day: reps × kg, set by set. On a card that is done today, and under the
   reps in the table of My results. The day is Wednesday 14 October. */
after(closeAll);

const toResults = page => page.click('#view [data-act="screen"][data-screen="results"]');
const lifts = page => page.locator('#view .xc').evaluateAll(els => els.map(e => e.querySelector('.xc-lift')?.textContent.trim() ?? null));
const cellKgs = (page, i) => page.locator('.rt-row').nth(i).locator('.rt-cell').evaluateAll(els => els.map(e => e.querySelector('.rt-l')?.textContent.trim() ?? null));
/* A workout of today whose push block has these sets ([reps, kg], ...) and nothing else done. */
const pushSets = sets => {
  const s = session('2026-10-14', 'A', [sets.reduce((a, x) => a + x[0], 0), 0, 0]);
  s.blocks[0].sets = sets.map(([r, kg], i) => ({ r, kg, t: 40 + i * 45 }));
  s.blocks[0].kg = sets[sets.length - 1][1];
  return s;
};

test('a card that is done today says the kilos lifted: reps × kg', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-14', 'A', [68, 0, 0])] });          // 68 reps at 35 kg
  assert.deepEqual(await lifts(page), ['2,380 kg lifted', null, null]);
  assert.equal(await page.locator('.xc[data-slot="push"]').getAttribute('aria-label'), 'Push, done: Overhead press, 68 reps, 2,380 kg lifted, ▲ 6 more. Fix it');
});
test('a pair of dumbbells counts both, bodyweight has no kilos, and zero kilos says nothing', async () => {
  const page = await openApp({ profile: profile({ rotate: true }), sessions: [first(), session('2026-10-14', 'B', [30, 8, 40])] });
  assert.deepEqual(await texts(page, '.xc .ex-kg'), ['2 × 10 kg', 'bodyweight', '2 × 16 kg']);
  assert.deepEqual(await lifts(page), ['600 kg lifted', null, '1,280 kg lifted']);
  const weighted = await openApp({ profile: profile({ rotate: true }), sessions: [first(), session('2026-10-14', 'B', [30, 8, 40], { kg: [20, 10, 32] })] });
  assert.deepEqual(await texts(weighted, '.xc .ex-kg'), ['2 × 10 kg', '+10 kg', '2 × 16 kg']);
  assert.deepEqual(await lifts(weighted), ['600 kg lifted', null, '1,280 kg lifted']);       // pull-ups with 10 kg on: still no kilos
  const zero = await openApp({ sessions: [first(), session('2026-10-14', 'A', [20, 0, 0], { kg: [0, 65, 75] })] });
  assert.deepEqual(await lifts(zero), [null, null, null]);
});
test('each set counts at its own weight, and the kilos are rounded to whole ones', async () => {
  const mixed = await openApp({ sessions: [first(), pushSets([[10, 30], [10, 35]])] });
  assert.deepEqual(await lifts(mixed), ['650 kg lifted', null, null]);
  const half = await openApp({ sessions: [first(), pushSets([[9, 37.5]])] });
  assert.deepEqual(await lifts(half), ['338 kg lifted', null, null]);
});
test('while another card is open the done cards leave the kilos out', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-14', 'A', [68, 0, 0])], prefs: { sound: false, lead: false } });
  await page.click('.xc[data-slot="pull"] [data-act="start"]');
  assert.equal(await page.locator('.xc[data-slot="push"][data-form="done"]').count(), 1);
  assert.equal(await page.locator('#view .xc-lift').count(), 0);
});
test('My results shows the kilos under the reps of every day, and says what the small number is', async () => {
  const page = await openApp({ today: '2026-10-21', sessions: threeWeeks() });
  await toResults(page);
  assert.deepEqual(await cellKgs(page, 0), ['2,380 kg', '5,200 kg', '6,320 kg']);        // Mon 19 Oct: 68 × 35, 80 × 65, 79 × 80
  assert.deepEqual(await cellKgs(page, 2), ['2,170 kg', '5,005 kg', '6,375 kg']);        // Mon 5 Oct: 62 × 35, 77 × 65, 85 × 75
  assert.equal(await txt(page, '#view .rt-note'), '▲ means you beat your last score. The small number is reps × kg. Tap a day to see or fix that workout.');
  assert.equal(await page.locator('.rt-row').nth(2).getAttribute('aria-label'), 'Mon 5 Oct: push 62, 2,170 kg lifted; pull 77, 5,005 kg lifted; legs 85, 6,375 kg lifted. Edit');
});
test('in the table a bodyweight exercise and a day not done have no kilos, and without kilos the note leaves them out', async () => {
  const page = await openApp({ profile: profile({ rotate: true }), sessions: [first(), session('2026-10-07', 'B', [30, 8, 0])] });
  await toResults(page);
  await page.click('#view [data-act="resTpl"][data-tpl="B"]');
  assert.deepEqual(await cellKgs(page, 0), ['600 kg', null, null]);
  const none = await openApp({ sessions: [session('2026-10-12', 'A', [10, 10, 10], { kg: [0, 0, 0] })] });
  await toResults(none);
  assert.deepEqual(await cellKgs(none, 0), [null, null, null]);
  assert.equal(await txt(none, '#view .rt-note'), '▲ means you beat your last score. Tap a day to see or fix that workout.');
});
test('on a 320 px screen five-digit kilos stay inside their column', async () => {
  const page = await openApp({ width: 320, sessions: [first(), session('2026-10-12', 'A', [162, 177, 100], { kg: [35, 65, 150] })] });
  await toResults(page);
  assert.deepEqual(await cellKgs(page, 0), ['5,670 kg', '11,505 kg', '15,000 kg']);
  assert.deepEqual(await page.locator('.rt-l').evaluateAll(els => els.filter(e => e.scrollWidth > e.clientWidth).map(e => e.textContent)), []);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
});
