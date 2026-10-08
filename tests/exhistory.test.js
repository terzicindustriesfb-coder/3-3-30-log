const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at } = require('./helpers');
after(closeAll);

const open = async (page, key) => { await page.click('#tabs [data-tab="progress"]'); await page.click('.sc [data-act="scoreTpl"][data-tpl="A"]'); await page.click(`.sc-row[data-ex="${key}"]`); };

test('charts and every score of one exercise', async () => {
  const page = await openApp({ today: '2026-10-21', sessions: threeWeeks() });
  await open(page, 'schouderdrukken');
  assert.deepEqual([await txt(page, '[data-sheet="exHistory"] .sheet-head .eyebrow'), await txt(page, '[data-sheet="exHistory"] .sheet-head .h2')], ['Push', 'Overhead press']);
  assert.deepEqual(await texts(page, '[data-sheet="exHistory"] .pg-lbl span'), ['Reps', 'Kilos lifted']);
  assert.equal(await page.locator('[data-sheet="exHistory"] .pg-svg svg').count(), 2);
  assert.deepEqual(await texts(page, '.eh-row'), ['Mon 19 Oct · 35 kg · 68 reps', 'Mon 12 Oct · 35 kg · 65 reps', 'Mon 5 Oct · 35 kg · 62 reps']);
});
test('one score waits for a second, and a cut block is marked', async () => {
  const page = await openApp({ today: '2026-10-07', sessions: [session('2026-10-05', 'A', [20, 77, 85], { cut: [true, false, false] })] });
  await open(page, 'schouderdrukken');
  assert.deepEqual(await texts(page, '.pg-wait'), ['The line starts the 2nd time.', 'The line starts the 2nd time.']);
  assert.deepEqual(await texts(page, '.eh-row'), ['Mon 5 Oct · 35 kg · 20 reps · stopped early']);
});
test('bodyweight counts reps only', async () => {
  const page = await openApp({ today: '2026-10-16', sessions: [session('2026-10-07', 'B', [30, 8, 40]), session('2026-10-14', 'B', [30, 10, 40])] });
  await page.click('#tabs [data-tab="progress"]');
  await page.click('.sc [data-act="scoreTpl"][data-tpl="B"]');
  await page.click('.sc-row[data-ex="optrekken"]');
  assert.equal(await page.locator('[data-sheet="exHistory"] .pg-svg svg').count(), 1);
  assert.deepEqual(await texts(page, '.pg-wait'), ['Bodyweight: counted in reps.']);
  assert.deepEqual(await texts(page, '.eh-row'), ['Wed 14 Oct · bodyweight · 10 reps', 'Wed 7 Oct · bodyweight · 8 reps']);
});
test('a buddy’s exercise opens the same way', async () => {
  const sam = { id: 'sam', profile: profile({ nick: 'Sam' }), sessions: threeWeeks() };
  const page = await openApp({ today: '2026-10-21', sessions: [first()], crew: [sam] });
  await page.click('#tabs [data-tab="progress"]');
  await page.click('[data-act="person"][data-id="sam"]');
  await page.click('.sc [data-act="scoreTpl"][data-tpl="A"]');
  await page.click('.sc-row[data-ex="kabelroeien"]');
  assert.equal((await texts(page, '.eh-row')).length, 3);
});
test('an exercise without a score says so', async () => {
  const page = await openApp({ today: '2026-10-07', sessions: [first()] });
  await page.click('#tabs [data-tab="progress"]');
  await page.click('.sc-row[data-ex="optrekken"]');
  assert.deepEqual([await txt(page, '[data-sheet="exHistory"] .sheet-head .eyebrow'), await txt(page, '[data-sheet="exHistory"] .sheet-head .h2')], ['Pull', 'Pull-ups']);
  assert.equal(await txt(page, '[data-sheet="exHistory"] .empty'), 'No score yet.');
  assert.deepEqual([await page.locator('.pg-charts').count(), await page.locator('.eh-row').count()], [0, 0]);
});
test('a pair of dumbbells, one rep, and focus back on the row', async () => {
  const page = await openApp({ today: '2026-10-16', sessions: [session('2026-10-07', 'B', [30, 8, 40]), session('2026-10-14', 'B', [1, 10, 40], { kg: [24, 0, 32] })] });
  await page.click('#tabs [data-tab="progress"]');
  await page.click('.sc [data-act="scoreTpl"][data-tpl="B"]');
  await page.click('.sc-row[data-ex="db-schouderdrukken"]');
  assert.equal(await page.locator('[data-sheet="exHistory"] .pg-svg svg').count(), 2);
  assert.deepEqual(await texts(page, '.eh-row'), ['Wed 14 Oct · 2 × 12 kg · 1 rep', 'Wed 7 Oct · 2 × 10 kg · 30 reps']);
  await page.click('[data-sheet="exHistory"] [data-act="closeSheet"]');
  assert.deepEqual(await page.evaluate(() => [document.activeElement.dataset.act, document.activeElement.dataset.ex]), ['exHistory', 'db-schouderdrukken']);
});
test('the history fits a 320 px phone', async () => {
  const page = await openApp({ width: 320, today: '2026-10-21', sessions: threeWeeks() });
  await open(page, 'c-seated-leg-press');
  assert.equal(await page.locator('[data-sheet="exHistory"] .pg-svg svg').count(), 2);
  assert.equal(await page.evaluate(() => { const el = document.querySelector('.sheet-panel'); return el.scrollWidth <= el.clientWidth; }), true);
});
