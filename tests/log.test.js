const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at } = require('./helpers');
after(closeAll);

const toProgress = page => page.click('#tabs [data-tab="progress"]');
const cells = async (page, i) => [await txt(page, `.lg-row >> nth=${i} >> .lg-date`), await txt(page, `.lg-row >> nth=${i} >> .lg-tpl`), await txt(page, `.lg-row >> nth=${i} >> .lg-reps`)];

test('a row per workout: date, letter, reps and the short verdict', async () => {
  const page = await openApp({ today: '2026-10-21', sessions: threeWeeks() });
  await toProgress(page);
  assert.equal(await txt(page, '#view .log-head .h2'), 'Log');
  assert.deepEqual(await cells(page, 0), ['Mon 19 Oct', 'A', '68 · 80 · 79 reps']);
  assert.deepEqual(await texts(page, '.lg-sum'), ['2 of 2 beaten · 1 heavier', '3 of 3 beaten', '3 first scores']);
  assert.equal(await page.locator('#view .lt').count(), 0);
});
test('a skipped exercise is a dash and a practice workout has no verdict', async () => {
  const page = await openApp({ sessions: [session('2026-09-30', 'A', [5, 5, 5]), session('2026-10-05', 'A', [62, 0, 85])] });
  await toProgress(page);
  assert.deepEqual(await cells(page, 0), ['Mon 5 Oct', 'A', '62 · – · 85 reps']);
  assert.deepEqual(await cells(page, 1), ['Wed 30 Sept', 'practice', '5 · 5 · 5 reps']);
  assert.deepEqual(await texts(page, '.lg-sum'), ['2 first scores']);
});
test('eight at first, then all of them', async () => {
  const ten = Array.from({ length: 10 }, (_, i) => session('2026-10-' + String(i + 5).padStart(2, '0'), 'ABC'[i % 3], [10, 10, 10]));
  const page = await openApp({ today: '2026-10-21', sessions: ten });
  await toProgress(page);
  assert.equal(await page.locator('.lg-row').count(), 8);
  assert.equal(await txt(page, '[data-act="logAll"]'), 'Show all 10 workouts');
  await page.click('[data-act="logAll"]');
  assert.equal(await page.locator('.lg-row').count(), 10);
  assert.equal(await txt(page, '.lg-row >> nth=0 >> .lg-date'), 'Wed 14 Oct');
});
test('no workouts yet', async () => {
  const page = await openApp();
  await toProgress(page);
  assert.equal(await txt(page, '#view .empty'), 'No workouts yet.');
});
test('your own workout opens for editing', async () => {
  const page = await openApp({ sessions: [first()] });
  await toProgress(page);
  await page.click('.lg-row');
  assert.equal(await txt(page, '#sheet .h2'), 'Edit workout');
});
test('a buddy’s workout opens to read only', async () => {
  const sam = { id: 'sam', profile: profile({ nick: 'Sam' }), sessions: threeWeeks() };
  const none = { id: 'tom', profile: profile({ nick: 'Tom' }), sessions: [] };
  const page = await openApp({ today: '2026-10-21', sessions: [first()], crew: [sam, none] });
  await toProgress(page);
  await page.click('[data-act="person"][data-id="sam"]');
  assert.equal(await page.locator('.lg-row').count(), 3);
  await page.click('.lg-row');
  assert.deepEqual([await txt(page, '[data-sheet="sessionView"] .eyebrow'), await txt(page, '[data-sheet="sessionView"] .h2')], ['Sam · Workout A', 'Mon 19 Oct']);
  assert.deepEqual(await texts(page, '[data-sheet="sessionView"] .ex-n'), ['Overhead press', 'Seated cable row', 'Seated leg press']);
  assert.deepEqual(await texts(page, '[data-sheet="sessionView"] .goal-n'), ['68', '80', '79']);
  assert.equal(await page.locator('[data-sheet="sessionView"] input, [data-sheet="sessionView"] select, [data-sheet="sessionView"] [type="submit"]').count(), 0);
  await page.keyboard.press('Escape');
  await page.click('[data-act="person"][data-id="tom"]');
  assert.equal(await txt(page, '#view .empty'), 'Tom hasn’t logged a workout yet.');
});
test('same every time shows no letter', async () => {
  const page = await openApp({ sessions: [first()], profile: profile({ mode: 'same' }) });
  await toProgress(page);
  assert.equal(await page.locator('.lg-row').count(), 1);
  assert.equal(await page.locator('.lg-row .lg-tpl').count(), 0);
});
test('a practice workout keeps its tag, also with the same workout every time', async () => {
  const page = await openApp({ profile: profile({ mode: 'same' }), sessions: [session('2026-09-30', 'A', [5, 5, 5]), first()] });
  await toProgress(page);
  assert.deepEqual(await texts(page, '.lg-row .lg-tpl'), ['practice']);
  assert.deepEqual(await texts(page, '.lg-reps'), ['62 · 77 · 85 reps', '5 · 5 · 5 reps']);
});
test('a buddy’s practice workout is shown without verdicts, with the kilos', async () => {
  const sam = { id: 'sam', profile: profile({ nick: 'Sam' }), sessions: [session('2026-09-30', 'A', [5, 5, 5]), first()] };
  const page = await openApp({ sessions: [], crew: [sam] });
  await toProgress(page);
  await page.click('[data-act="person"][data-id="sam"]');
  await page.click('.lg-row >> nth=1');
  assert.deepEqual([await txt(page, '[data-sheet="sessionView"] .eyebrow'), await txt(page, '[data-sheet="sessionView"] .h2')], ['Sam · Practice workout', 'Wed 30 Sept']);
  assert.equal(await page.locator('[data-sheet="sessionView"] .goal-l').count(), 0);
  assert.equal(await txt(page, '[data-sheet="sessionView"] .sum-total'), 'Lifted in total 875 kg');
  await page.click('[data-sheet="sessionView"] [data-act="closeSheet"]');
  assert.deepEqual(await page.evaluate(() => [document.activeElement.dataset.act, document.activeElement.dataset.id]), ['viewSession', 's-2026-09-30-A']);
});
test('after deleting a workout the focus is on the log again', async () => {
  const page = await openApp({ today: '2026-10-21', sessions: threeWeeks() });
  await toProgress(page);
  await page.click('.lg-row');
  await page.click('#sheet [data-act="del"]');
  await page.click('#sheet [data-act="del"]');
  await page.waitForSelector('#sheet', { state: 'hidden' });
  assert.equal(await page.locator('.lg-row').count(), 2);
  assert.equal(await page.evaluate(() => document.activeElement.classList.contains('lg-row')), true);
});
test('the log fits a 320 px phone', async () => {
  const page = await openApp({ width: 320, today: '2026-10-21', sessions: threeWeeks() });
  await toProgress(page);
  assert.equal(await page.locator('.lg-row').count(), 3);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
});
