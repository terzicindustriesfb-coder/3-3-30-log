const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at } = require('./helpers');
after(closeAll);

const head = async page => [await txt(page, '.head .eyebrow'), await txt(page, '#view .title')];

test('a training day shows the workout and what to beat', async () => {
  const page = await openApp({ sessions: abc() });
  assert.deepEqual(await head(page), ['Wed 14 Oct · today', 'Workout A']);
  assert.deepEqual(await texts(page, '.wo .ex-n'), ['Overhead press', 'Seated cable row', 'Seated leg press']);
  assert.deepEqual(await texts(page, '.wo .ex-kg'), ['35 kg', '65 kg', '75 kg']);
  assert.deepEqual(await texts(page, '.wo .goal-n'), ['62', '77', '85']);
  assert.deepEqual(await texts(page, '.wo .goal-l'), ['reps to beat', 'reps to beat', 'reps to beat']);
  assert.equal(await txt(page, '.wo [data-act="startSession"]'), 'Start · 30 min');
  assert.deepEqual(await texts(page, '.wo-links .btn'), ['Your plan', 'Swap workout']);
  assert.equal(await page.evaluate(() => todaySituation(myProfile())), 'train');
});
test('a heavier weight asks to match, and no score says First time', async () => {
  const heavy = await openApp({ sessions: abc(), profile: profile({ weights: { schouderdrukken: 37.5, kabelroeien: 65, 'c-seated-leg-press': 75 } }) });
  assert.deepEqual(await texts(heavy, '.wo .goal-l'), ['reps to match', 'reps to beat', 'reps to beat']);
  const none = await openApp({ today: '2026-10-05' });
  assert.deepEqual(await texts(none, '.wo .goal-l'), ['First time', 'First time', 'First time']);
  assert.equal(await none.locator('.wo .goal-n').count(), 0);
});
test('a rest day offers to bring the next workout forward', async () => {
  const page = await openApp({ today: '2026-10-13', sessions: abc() });
  assert.deepEqual(await head(page), ['Tue 13 Oct · today', 'Rest day']);
  assert.deepEqual([await txt(page, '.wo-next .eyebrow'), await txt(page, '.wo-next .h2')], ['Next up · Wed 14 Oct', 'Workout A']);
  assert.deepEqual(await texts(page, '.wo .goal-n'), ['62', '77', '85']);
  assert.equal(await txt(page, '.wo [data-act="startSession"]'), 'Train today instead');
  assert.equal(await txt(page, '.wo-note'), 'Moves Wednesday’s workout to today.');
});
test('after a missed day a rest day catches up first', async () => {
  const page = await openApp({ today: '2026-10-13', sessions: [first(), session('2026-10-07', 'B', [30, 8, 40])] });
  assert.equal(await txt(page, '.wo-note'), 'Moves Monday’s workout to today.');
  assert.equal(await txt(page, '.wo-next .eyebrow'), 'Next up · Wed 14 Oct');
});
test('with nothing left to move it is an extra workout', async () => {
  const page = await openApp({ today: '2026-10-17', sessions: abc().concat(session('2026-10-14', 'A', [60, 70, 80]), session('2026-10-16', 'B', [30, 8, 40])) });
  assert.equal(await txt(page, '.wo [data-act="startSession"]'), 'Train anyway');
  assert.equal(await txt(page, '.wo-note'), 'Counts as an extra workout this week.');
  assert.equal(await txt(page, '.wo-next .eyebrow'), 'Next up · Mon 19 Oct');
});
test('before the start date', async () => {
  const page = await openApp({ profile: profile({ start: '2026-10-19' }) });
  assert.deepEqual(await head(page), ['You start Monday 19 October', 'Get ready']);
  assert.equal(await txt(page, '.wo [data-act="startSession"]'), 'Try a practice workout');
  assert.equal(await page.locator('.wk').count(), 0);
});
test('a workout left open comes before everything else', async () => {
  const open = session('2026-10-14', 'A', [10, 0, 0], { status: 'active', id: 'd1' });
  const page = await openApp({ sessions: abc().concat(open), draft: open });
  assert.equal(await txt(page, '#view .title'), 'Workout in progress');
  assert.deepEqual(await texts(page, '.wo .btn'), ['Resume workout', 'Discard it']);
  assert.equal(await page.locator('.wk').count(), 1);
});
test('after training the card shows today’s result', async () => {
  const page = await openApp({ today: '2026-10-05', sessions: [first()] });
  assert.deepEqual(await head(page), ['Mon 5 Oct · today', 'Workout A done']);
  assert.deepEqual(await texts(page, '.wo .goal-n'), ['62', '77', '85']);
  assert.deepEqual(await texts(page, '.wo .goal-l'), ['first score', 'first score', 'first score']);
  assert.match(await txt(page, '.wo .sum-total'), /Lifted in total 13,550 kg/);
  assert.equal(await txt(page, '.after .next-line'), 'Next: Wed 7 Oct · Workout B');
  assert.deepEqual(await texts(page, '.after .btn'), ['Edit', 'Train again today', 'Your plan']);
  assert.equal(await page.locator('.after [data-act="startSession"]').getAttribute('data-tpl'), 'B');
  await page.click('.after [data-act="edit"]');
  assert.equal(await txt(page, '#sheet .h2'), 'Edit workout');
});
test('two workouts on one day: the card shows the last', async () => {
  const page = await openApp({ today: '2026-10-05', sessions: [first(), session('2026-10-05', 'B', [30, 8, 40], { hm: '18:00' })] });
  assert.equal(await txt(page, '#view .title'), 'Workout B done');
  assert.equal(await txt(page, '.after .next-line'), 'Next: Wed 7 Oct · Workout C');
});
test('a workout without kilos shows no total', async () => {
  const page = await openApp({ today: '2026-10-07', sessions: [session('2026-10-07', 'B', [0, 8, 0])] });
  assert.equal(await txt(page, '#view .title'), 'Workout B done');
  assert.deepEqual(await texts(page, '.wo .goal-l'), ['skipped', 'first score', 'skipped']);
  assert.equal(await page.locator('.wo .sum-total').count(), 0);
});
test('deleting today’s workout brings the workout back', async () => {
  const page = await openApp({ today: '2026-10-05', sessions: [first()] });
  await page.evaluate(() => deleteSession('s-2026-10-05-A'));
  await page.waitForFunction(() => document.querySelector('#view .title').textContent === 'Workout A');
  assert.equal(await txt(page, '.wo [data-act="startSession"]'), 'Start · 30 min');
});
test('same every time uses plain titles', async () => {
  const same = profile({ mode: 'same' });
  assert.equal(await txt(await openApp({ sessions: abc(), profile: same }), '#view .title'), 'Today’s workout');
  const rest = await openApp({ today: '2026-10-13', sessions: abc(), profile: same });
  assert.equal(await rest.locator('.wo-next .h2').count(), 0);
  const done = await openApp({ today: '2026-10-05', sessions: [first()], profile: same });
  assert.deepEqual([await txt(done, '#view .title'), await txt(done, '.after .next-line')], ['Workout done', 'Next: Wed 7 Oct']);
});
test('bodyweight and dumbbell pairs read naturally', async () => {
  const page = await openApp({ today: '2026-10-07', sessions: [first()] });
  assert.equal(await txt(page, '#view .title'), 'Workout B');
  assert.deepEqual(await texts(page, '.wo .ex-kg'), ['2 × 10 kg', 'bodyweight', '2 × 16 kg']);
});
test('a 40-character name does not widen a 320 px screen', async () => {
  const page = await openApp({ width: 320, sessions: abc(), profile: profile({ names: { schouderdrukken: 'Standing barbell overhead press strict x' } }) });
  assert.equal(await txt(page, '.wo .ex-n'), 'Standing barbell overhead press strict x');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
});
test('the whole screen fits a phone without scrolling', async () => {
  const page = await openApp({ sessions: abc(), crew: [{ id: 'sam', profile: profile({ nick: 'Sam' }), sessions: [] }] });
  assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight), true);
});
