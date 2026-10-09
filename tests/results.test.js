const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at } = require('./helpers');
after(closeAll);

const toResults = page => page.click('#view [data-act="screen"][data-screen="results"]');
const squash = t => t.replace(/\s+/g, ' ').trim();
const row = async (page, i) => (await page.locator('.rt-row').nth(i).locator('.rt-date, .rt-c').allTextContents()).map(squash);

test('a row per workout, newest first, with the reps of push, pull and legs', async () => {
  const page = await openApp({ today: '2026-10-21', sessions: threeWeeks() });
  await toResults(page);
  assert.equal(await txt(page, '#view .title'), 'My results');
  assert.equal(await txt(page, '#view .head .lead-s'), 'Your workouts, newest first. The numbers are your reps in 10 minutes.');
  assert.equal(await txt(page, '.rt-head .rt-day'), 'Day');
  assert.deepEqual(await texts(page, '.rt-head .rt-grp'), ['Push', 'Pull', 'Legs']);
  assert.deepEqual(await texts(page, '.rt-head .rt-name'), ['Overhead press', 'Seated cable row', 'Seated leg press']);
  assert.deepEqual(await texts(page, '.rt-head .rt-kg'), ['35 kg', '65 kg', '75 kg']);
  assert.deepEqual(await row(page, 0), ['Mon 19 Oct', '68▲', '80▲', '79']);          // legs went up to 80 kg: named on the card, no arrow here
  assert.deepEqual(await row(page, 1), ['Mon 12 Oct', '65▲', '78▲', '88▲']);
  assert.deepEqual(await row(page, 2), ['Mon 5 Oct', '62', '77', '85']);
  assert.equal(await txt(page, '#view .rt-note'), '▲ means you beat your last score. Tap a day to see or fix that workout.');
  assert.equal(await page.locator('#view .rt-star, #view [data-act="logAll"]').count(), 0);
  assert.equal(await txt(page, '#view [data-act="manual"]'), 'Add a workout by hand');
});
test('not done is a dash, another exercise gets a star, practice is named', async () => {
  const other = session('2026-10-12', 'A', [40, 78, 0], { ex: ['bankdrukken', 'kabelroeien', 'c-seated-leg-press'], kg: [40, 65, 75] });
  const page = await openApp({ sessions: [session('2026-09-30', 'A', [5, 5, 5]), first(), other] });
  await toResults(page);
  assert.deepEqual(await row(page, 0), ['Mon 12 Oct', '40*', '78▲', '–']);
  assert.deepEqual(await row(page, 2), ['Wed 30 Sept practice', '5', '5', '5']);
  assert.equal(await txt(page, '#view .rt-star'), '* another exercise that day');
  assert.equal(await page.locator('.rt-row').nth(0).getAttribute('aria-label'), 'Mon 12 Oct: push 40, another exercise; pull 78, beat the last score; legs not done. Edit');
  assert.equal(await page.locator('.rt-row').nth(2).getAttribute('aria-label'), 'Wed 30 Sept, practice: push 5; pull 5; legs 5. Edit');
});
test('six at first, then all of them', async () => {
  const ten = Array.from({ length: 10 }, (_, i) => session('2026-10-' + String(i + 5).padStart(2, '0'), 'A', [10, 10, 10]));
  const page = await openApp({ today: '2026-10-21', sessions: ten });
  await toResults(page);
  assert.equal(await page.locator('.rt-row').count(), 6);
  assert.equal(await txt(page, '[data-act="logAll"]'), 'Show all 10 workouts');
  await page.click('[data-act="logAll"]');
  assert.equal(await page.locator('.rt-row').count(), 10);
  assert.equal((await row(page, 0))[0], 'Wed 14 Oct');
});
test('no workouts yet', async () => {
  const page = await openApp();
  await toResults(page);
  assert.equal(await txt(page, '#view .empty'), 'No workouts yet.');
  assert.equal(await page.locator('#view .rt, #view .rt-note').count(), 0);
  assert.equal(await page.locator('#view [data-act="manual"]').count(), 1);
});
test('your own row opens the workout to fix it, and after deleting the focus is in the table', async () => {
  const page = await openApp({ today: '2026-10-21', sessions: threeWeeks() });
  await toResults(page);
  await page.click('.rt-row');
  assert.equal(await txt(page, '#sheet .h2'), 'Edit workout');
  await page.click('#sheet [data-act="del"]');
  await page.click('#sheet [data-act="del"]');
  await page.waitForSelector('#sheet', { state: 'hidden' });
  assert.equal(await page.locator('.rt-row').count(), 2);
  assert.equal(await page.evaluate(() => document.activeElement.classList.contains('rt-row')), true);
});
test('a buddy’s results: his name, his rows to read, nothing to add', async () => {
  const sam = { id: 'sam', profile: profile({ nick: 'Sam' }), sessions: threeWeeks() };
  const tom = { id: 'tom', profile: profile({ nick: 'Tom' }), sessions: [] };
  const page = await openApp({ today: '2026-10-21', sessions: [first()], crew: [sam, tom] });
  await toResults(page);
  assert.deepEqual(await texts(page, '#view [data-act="person"]'), ['Me', 'Sam', 'Tom']);
  await page.click('[data-act="person"][data-id="sam"]');
  assert.equal(await txt(page, '#view .title'), 'Sam’s results');
  assert.equal(await txt(page, '#view .head .lead-s'), 'Sam’s workouts, newest first. The numbers are the reps in 10 minutes.');
  assert.equal(await txt(page, '#view .rt-note'), '▲ means Sam beat the last score. Tap a day to see that workout.');
  assert.equal(await page.locator('.rt-row').count(), 3);
  assert.equal(await page.locator('#view [data-act="manual"]').count(), 0);
  await page.click('.rt-row');
  assert.deepEqual([await txt(page, '[data-sheet="sessionView"] .eyebrow'), await txt(page, '[data-sheet="sessionView"] .h2')], ['Sam', 'Mon 19 Oct']);
  assert.deepEqual(await texts(page, '[data-sheet="sessionView"] .goal-n'), ['68', '80', '79']);
  assert.equal(await page.locator('[data-sheet="sessionView"] input, [data-sheet="sessionView"] select, [data-sheet="sessionView"] [type="submit"], [data-sheet="sessionView"] .sum-total').count(), 0);
  await page.click('[data-sheet="sessionView"] [data-act="closeSheet"]');
  assert.deepEqual(await page.evaluate(() => [document.activeElement.dataset.act, document.activeElement.dataset.id]), ['viewSession', 's-2026-10-19-A']);
  await page.click('[data-act="person"][data-id="tom"]');
  assert.equal(await txt(page, '#view .empty'), 'Tom hasn’t logged a workout yet.');
});
test('with turns on, the table shows one workout at a time, starting with the one whose turn it is', async () => {
  const page = await openApp({ profile: profile({ rotate: true }), sessions: abc() });
  await toResults(page);
  assert.deepEqual(await texts(page, '#view [data-act="resTpl"]'), ['Workout A', 'Workout B', 'Workout C']);
  assert.equal(await txt(page, '#view [data-act="resTpl"][aria-pressed="true"]'), 'Workout A');
  assert.deepEqual(await texts(page, '.rt-head .rt-name'), ['Overhead press', 'Seated cable row', 'Seated leg press']);
  assert.equal(await page.locator('.rt-row').count(), 1);
  await page.click('#view [data-act="resTpl"][data-tpl="B"]');
  assert.deepEqual(await texts(page, '.rt-head .rt-name'), ['Seated dumbbell shoulder press', 'Pull-ups', 'Dumbbell Romanian deadlift']);
  assert.deepEqual(await texts(page, '.rt-head .rt-kg'), ['2 × 10 kg', 'bodyweight', '2 × 16 kg']);
  assert.deepEqual(await row(page, 0), ['Wed 7 Oct', '30', '8', '40']);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.tpl), 'B');
});
test('a workout that was never done says so, under the head of the table', async () => {
  const page = await openApp({ profile: profile({ rotate: true }), sessions: [first()] });
  await toResults(page);
  assert.equal(await txt(page, '#view [data-act="resTpl"][aria-pressed="true"]'), 'Workout B');
  assert.deepEqual(await texts(page, '.rt-head .rt-name'), ['Seated dumbbell shoulder press', 'Pull-ups', 'Dumbbell Romanian deadlift']);
  assert.equal(await txt(page, '#view .rt-none'), 'No Workout B yet.');
  assert.equal(await page.locator('.rt-row, #view .empty').count(), 0);
  assert.equal(await page.locator('#view .rt-note').count(), 0);
});
test('without turns there are no workout buttons and every workout is a row', async () => {
  const page = await openApp({ sessions: abc() });
  await toResults(page);
  assert.equal(await page.locator('#view [data-act="resTpl"]').count(), 0);
  assert.equal(await page.locator('.rt-row').count(), 3);
  assert.deepEqual(await row(page, 0), ['Mon 12 Oct', '40*', '40*', '40*']);
});
test('the workout buttons and the weights follow the person whose results are shown', async () => {
  const sam = { id: 'sam', profile: profile({ nick: 'Sam', rotate: true, weights: { schouderdrukken: 40 } }), sessions: threeWeeks() };
  const page = await openApp({ today: '2026-10-21', sessions: [first()], crew: [sam] });
  await toResults(page);
  assert.equal(await page.locator('#view [data-act="resTpl"]').count(), 0);
  await page.click('[data-act="person"][data-id="sam"]');
  assert.equal(await txt(page, '#view [data-act="resTpl"][aria-pressed="true"]'), 'Workout B');
  await page.click('#view [data-act="resTpl"][data-tpl="A"]');
  assert.deepEqual(await texts(page, '.rt-head .rt-kg'), ['40 kg', '65 kg', '80 kg']);       // his set weight, then his last scores, not mine
});
test('a 40-character name and three-digit reps stay inside a 320 px screen', async () => {
  const long = profile({ names: { schouderdrukken: 'Standing barbell overhead press strict x' } });
  const page = await openApp({ width: 320, profile: long, sessions: [first(), session('2026-10-12', 'A', [165, 178, 188])] });
  await toResults(page);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
  assert.deepEqual(await row(page, 0), ['Mon 12 Oct', '165▲', '178▲', '188▲']);
  const heights = await page.evaluate(() => ['.rt-row', '[data-act="manual"]', '[data-act="back"]'].map(s => document.querySelector(s).getBoundingClientRect().height));
  assert.deepEqual(heights.map(h => h >= 44), [true, true, true], `heights: ${heights}`);
});
test('a buddy with thin data never breaks the results', async () => {
  const page = await openApp({ sessions: abc(), crew: [{ id: 'anon', profile: profile({ nick: '' }), sessions: [] }, { id: 'ghost', profile: 'broken' }] });
  await toResults(page);
  assert.deepEqual(await texts(page, '#view [data-act="person"]'), ['Me', 'Training buddy']);
  await page.click('[data-act="person"][data-id="anon"]');
  assert.equal(await txt(page, '#view .title'), 'Training buddy’s results');
  assert.equal(await txt(page, '#view .empty'), 'Training buddy hasn’t logged a workout yet.');
  assert.deepEqual(page.__errors, []);
});
test('on a 320 px screen every weight in the head stays inside its own column, and a date stays on one line', async () => {
  const cases = [[{ 'db-schouderdrukken': 25, optrekken: -12.5 }, ['2 × 12.5 kg', '12.5 kg assist', '2 × 16 kg']], [{}, ['2 × 10 kg', 'bodyweight', '2 × 16 kg']]];
  for (const [weights, labels] of cases) {
    const page = await openApp({ width: 320, profile: profile({ rotate: true, weights }), sessions: abc() });
    await toResults(page);
    await page.click('#view [data-act="resTpl"][data-tpl="B"]');
    assert.deepEqual(await texts(page, '.rt-head .rt-kg'), labels);
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('.rt-head .rt-kg')].filter(el => el.scrollWidth > el.clientWidth).map(el => el.textContent)), []);
    await page.click('#view [data-act="resTpl"][data-tpl="C"]');
    assert.equal(await txt(page, '.rt-row .rt-date'), 'Mon 12 Oct');
    assert.equal(await page.evaluate(() => document.querySelector('.rt-row .rt-date').getBoundingClientRect().height < 20), true);
  }
});
