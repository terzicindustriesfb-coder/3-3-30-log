const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');
const { closeAll, session, first, abc, threeWeeks, txt, texts, at } = h;
/* These tests are about Workout A, B and C taking turns: every profile here has that switched on. */
const profile = over => h.profile(Object.assign({ rotate: true }, over));
const openApp = opts => h.openApp(Object.assign({ profile: profile() }, opts));
after(closeAll);

const toProgress = page => page.click('#view [data-act="screen"][data-screen="results"]');
const pickA = page => page.click('.sc [data-act="scoreTpl"][data-tpl="A"]');

test('the score row of an exercise', async () => {
  const page = await openApp({ today: '2026-10-21', sessions: threeWeeks() });
  const [a, c, none] = await page.evaluate(() => ['schouderdrukken', 'c-seated-leg-press', 'pendlay'].map(k => scoreRow(S.uid, k)));
  assert.deepEqual([a.state, a.kg, a.n, a.best, a.delta, a.series], ['same', 35, 68, 68, 3, [62, 65, 68]]);
  assert.deepEqual([c.state, c.kg, c.n, c.dk, c.prev], ['changed', 80, 79, 5, { n: 88, kg: 75 }]);
  assert.equal(none.state, 'none');
  const one = await openApp({ today: '2026-10-07', sessions: [first()] });
  assert.deepEqual(await one.evaluate(() => { const r = scoreRow(S.uid, 'kabelroeien'); return [r.state, r.n, r.date]; }), ['one', 77, '2026-10-05']);
});
test('a block that was stopped early only counts when there is nothing else', async () => {
  const cut = session('2026-10-12', 'A', [20, 78, 88], { cut: [true, false, false] });
  const page = await openApp({ today: '2026-10-14', sessions: [first(), cut] });
  assert.deepEqual(await page.evaluate(() => { const r = scoreRow(S.uid, 'schouderdrukken'); return [r.state, r.n]; }), ['one', 62]);
  const only = await openApp({ today: '2026-10-07', sessions: [session('2026-10-05', 'A', [20, 77, 85], { cut: [true, false, false] })] });
  assert.deepEqual(await only.evaluate(() => { const r = scoreRow(S.uid, 'schouderdrukken'); return [r.state, r.n]; }), ['one', 20]);
});
test('this week and your scores after three weeks', async () => {
  const page = await openApp({ today: '2026-10-21', sessions: threeWeeks() });
  await toProgress(page);
  assert.deepEqual([await txt(page, '.pw .eyebrow'), await txt(page, '.pw-n'), await txt(page, '.pw-kg .goal-n'), await txt(page, '.pw-kg .goal-l')],
    ['This week', '1 of 3 workouts', '13,900', 'kg lifted']);
  assert.equal(await txt(page, '.sc .eyebrow'), 'Your scores');
  assert.deepEqual(await texts(page, '.sc [data-act="scoreTpl"][aria-pressed="true"]'), ['B']);
  assert.deepEqual(await texts(page, '.sc .sc-sub'), ['2 × 10 kg', 'bodyweight', '2 × 16 kg']);
  assert.deepEqual(await texts(page, '.sc .sc-none'), ['No score yet', 'No score yet', 'No score yet']);
  await pickA(page);
  assert.deepEqual(await texts(page, '.sc .ex-n'), ['Overhead press', 'Seated cable row', 'Seated leg press']);
  assert.deepEqual(await texts(page, '.sc .sc-sub'), ['35 kg · best 68', '65 kg · best 80', '80 kg · was 88 at 75 kg']);
  assert.deepEqual(await texts(page, '.sc .sc-n'), ['68', '80', '79']);
  assert.deepEqual(await texts(page, '.sc .sc-d'), ['▲ +3', '▲ +2', '+5 kg']);
  assert.equal(await page.locator('.sc .sc-d.pos').count(), 2);
  assert.equal(await page.locator('.sc svg.spark').count(), 3);
  assert.equal(await page.locator('.sc-row[data-ex="schouderdrukken"] .spark path').getAttribute('d'), 'M3,23L28,14L53,5');
});
test('a first score, a level score and a lower one', async () => {
  const one = await openApp({ today: '2026-10-07', sessions: [first()] });
  await toProgress(one); await pickA(one);
  assert.deepEqual(await texts(one, '.sc .sc-sub'), ['35 kg · first score, Mon 5 Oct', '65 kg · first score, Mon 5 Oct', '75 kg · first score, Mon 5 Oct']);
  assert.deepEqual([await texts(one, '.sc .sc-n'), await texts(one, '.sc .sc-u')], [['62', '77', '85'], ['reps', 'reps', 'reps']]);
  assert.equal(await one.locator('.sc svg.spark').count(), 0);
  const two = await openApp({ today: '2026-10-14', sessions: [first(), session('2026-10-12', 'A', [62, 75, 90], { kg: [35, 65, 70] })] });
  await toProgress(two); await pickA(two);
  assert.deepEqual(await texts(two, '.sc .sc-d'), ['same', '▼ −2', '−5 kg']);
  assert.equal(await two.locator('.sc-row[data-ex="schouderdrukken"] .spark path').getAttribute('d'), 'M3,14L53,14');
});
test('nothing planned, nothing lifted and before the start', async () => {
  const empty = await openApp({ sessions: [first()], profile: profile({ week: { mon: '2026-10-12', days: [] } }) });
  await toProgress(empty);
  assert.equal(await txt(empty, '.pw-n'), 'Nothing planned this week.');
  assert.equal(await empty.locator('.pw-kg').count(), 0);
  const pre = await openApp({ profile: profile({ joined: at('2026-10-19'), start: '2026-10-19' }) });
  await toProgress(pre);
  assert.equal(await pre.locator('.pw').count(), 0);
  assert.equal(await pre.locator('.sc').count(), 1);
});
test('same every time has no letters to choose', async () => {
  const page = await openApp({ sessions: [first()], profile: profile({ rotate: false }) });
  await toProgress(page);
  assert.equal(await page.locator('.sc [data-act="scoreTpl"]').count(), 0);
  assert.deepEqual(await texts(page, '.sc .ex-n'), ['Overhead press', 'Seated cable row', 'Seated leg press']);
});
test('a buddy’s scores carry his name, his plan and his names', async () => {
  const sam = { id: 'sam', profile: profile({ nick: 'Sam', names: { schouderdrukken: 'Military press' } }), sessions: threeWeeks() };
  const page = await openApp({ today: '2026-10-21', sessions: [first()], crew: [sam] });
  await toProgress(page);
  await page.click('[data-act="person"][data-id="sam"]');
  assert.equal(await txt(page, '.sc .eyebrow'), 'Sam’s scores');
  assert.equal(await txt(page, '.pw-n'), '1 of 3 workouts');
  await pickA(page);
  assert.deepEqual([await txt(page, '.sc .ex-n'), await txt(page, '.sc .sc-d')], ['Military press', '▲ +3']);
});
test('long names and big numbers stay inside a 320 px screen', async () => {
  const page = await openApp({ width: 320, today: '2026-10-21', sessions: threeWeeks(), profile: profile({ names: { schouderdrukken: 'Standing barbell overhead press strict x' } }) });
  await toProgress(page); await pickA(page);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
});
test('the spark line is drawn through at most eight scores', async () => {
  const days = ['2026-10-05', '2026-10-08', '2026-10-12', '2026-10-15', '2026-10-19', '2026-10-22', '2026-10-26', '2026-10-29', '2026-11-02', '2026-11-05'];
  const page = await openApp({ today: '2026-11-06', profile: profile({ rotate: false }), sessions: days.map((d, i) => session(d, 'A', [50 + i, 60, 70])) });
  assert.deepEqual(await page.evaluate(() => scoreRow(S.uid, 'schouderdrukken').series), [52, 53, 54, 55, 56, 57, 58, 59]);
  assert.match(await page.evaluate(() => sparkHtml([10, 20, 15, 30], 'pull')),
    /^<svg class="spark" width="56" height="28" viewBox="0 0 56 28" aria-hidden="true"><path d="M3,23L19\.7,14L36\.3,18\.5L53,5" [^>]*stroke="var\(--c-pull\)"[^>]*\/><circle cx="53" cy="5" r="3\.2" fill="var\(--c-pull\)"\/><\/svg>$/);
});
test('dumbbell pairs and bodyweight read the way you set them', async () => {
  const again = session('2026-10-14', 'B', [28, 10, 44], { kg: [24, -10, 32] });
  const page = await openApp({ today: '2026-10-16', sessions: abc().concat(again) });
  await toProgress(page);
  await page.click('.sc [data-act="scoreTpl"][data-tpl="B"]');
  assert.deepEqual(await texts(page, '.sc .sc-sub'), ['2 × 12 kg · was 30 at 2 × 10 kg', '10 kg assist · was 8 at bodyweight', '2 × 16 kg · best 44']);
  assert.deepEqual(await texts(page, '.sc .sc-d'), ['+4 kg', '−10 kg', '▲ +4']);
  await page.click('.sc [data-act="scoreTpl"][data-tpl="C"]');
  assert.deepEqual(await texts(page, '.sc .sc-sub'), ['2 × 12 kg · first score, Mon 12 Oct', '40 kg · first score, Mon 12 Oct', '2 × 8 kg · first score, Mon 12 Oct']);
});
test('the letter starts on the workout that is next, also after a swap, and per person', async () => {
  const sam = { id: 'sam', profile: profile({ nick: 'Sam', weights: {} }), sessions: [] };
  const page = await openApp({ today: '2026-10-07', sessions: [first()], crew: [sam] });
  await page.evaluate(() => { UI.tpl = 'C'; });
  await toProgress(page);
  assert.deepEqual(await texts(page, '.sc [data-act="scoreTpl"][aria-pressed="true"]'), ['C']);
  await pickA(page);
  assert.deepEqual(await texts(page, '.sc [data-act="scoreTpl"][aria-pressed="true"]'), ['A']);
  await page.click('[data-act="person"][data-id="sam"]');
  assert.deepEqual(await texts(page, '.sc [data-act="scoreTpl"][aria-pressed="true"]'), ['A']);
  // Sam has no scores and no weights of his own: the list's start weights, not my last weights.
  assert.deepEqual(await texts(page, '.sc .sc-sub'), ['25 kg', '35 kg', '30 kg']);
  await page.click('.sc [data-act="scoreTpl"][data-tpl="B"]');
  await page.click('[data-act="person"][data-id="me"]');
  assert.deepEqual(await texts(page, '.sc [data-act="scoreTpl"][aria-pressed="true"]'), ['C']);
});
test('the week line also reads well with one planned day or none', async () => {
  const one = await openApp({ profile: profile({ week: { mon: '2026-10-12', days: [5] } }) });
  await toProgress(one);
  assert.equal(await txt(one, '.pw-n'), '0 of 1 workout');
  const extra = await openApp({ profile: profile({ week: { mon: '2026-10-12', days: [] } }), sessions: [session('2026-10-12', 'A', [10, 10, 10]), session('2026-10-13', 'B', [10, 10, 10])] });
  await toProgress(extra);
  assert.equal(await txt(extra, '.pw-n'), '2 workouts');
  assert.equal(await txt(extra, '.pw-kg .goal-n'), '2,270');
});
