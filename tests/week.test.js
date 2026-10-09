const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');
const { closeAll, session, first, abc, threeWeeks, txt, texts, at } = h;
/* These tests are about Workout A, B and C taking turns: every profile here has that switched on. */
const profile = over => h.profile(Object.assign({ rotate: true }, over));
const openApp = opts => h.openApp(Object.assign({ profile: profile() }, opts));
after(closeAll);

const states = (page, id = 'local') => page.evaluate(i => weekModel(i === 'local' ? S.uid : i).days.map(d => d.state), id);
const model = page => page.evaluate(() => { const w = weekModel(S.uid); return [w.mon, w.done, w.planned]; });

test('done, today and planned', async () => {
  const page = await openApp({ sessions: abc() });
  assert.deepEqual(await states(page), ['done', 'rest', 'today', 'rest', 'planned', 'rest', 'rest']);
  assert.deepEqual(await model(page), ['2026-10-12', 1, 3]);
  assert.equal(await page.evaluate(() => weekModel(S.uid).days[0].tpl), 'C');
});
test('a missed day and a rest day today', async () => {
  assert.deepEqual(await states(await openApp({ today: '2026-10-15', sessions: abc() })), ['done', 'rest', 'missed', 'todayRest', 'planned', 'rest', 'rest']);
});
test('this week’s own list wins, another week’s list is ignored', async () => {
  const own = await openApp({ today: '2026-10-13', sessions: abc(), profile: profile({ week: { mon: '2026-10-12', days: [1, 2, 5] } }) });
  assert.deepEqual(await states(own), ['done', 'today', 'rest', 'rest', 'planned', 'rest', 'rest']);
  const old = await openApp({ today: '2026-10-13', sessions: abc(), profile: profile({ week: { mon: '2026-10-05', days: [2] } }) });
  assert.deepEqual(await states(old), ['done', 'todayRest', 'planned', 'rest', 'planned', 'rest', 'rest']);
});
test('nothing is planned before the start date', async () => {
  const page = await openApp({ profile: profile({ start: '2026-10-19' }) });
  assert.deepEqual(await states(page), ['rest', 'rest', 'todayRest', 'rest', 'rest', 'rest', 'rest']);
  assert.deepEqual((await model(page)).slice(1), [0, 0]);
});
test('in a first week, days before joining are rest unless trained', async () => {
  const late = profile({ joined: at('2026-10-14') });
  const none = await openApp({ today: '2026-10-15', profile: late });
  assert.deepEqual(await states(none), ['rest', 'rest', 'missed', 'todayRest', 'planned', 'rest', 'rest']);
  assert.equal((await model(none))[2], 2);
  const some = await openApp({ today: '2026-10-15', profile: late, sessions: [session('2026-10-12', 'C', [40, 40, 40])] });
  assert.deepEqual([(await states(some))[0], (await model(some))[2]], ['done', 3]);
});
test('the counter has no ceiling', async () => {
  const four = [session('2026-10-12', 'A', [1, 1, 1]), session('2026-10-14', 'B', [1, 1, 1]), session('2026-10-16', 'C', [1, 1, 1]), session('2026-10-17', 'A', [1, 1, 1])];
  const page = await openApp({ today: '2026-10-18', sessions: four });
  assert.deepEqual(await states(page), ['done', 'rest', 'done', 'rest', 'done', 'done', 'todayRest']);
  assert.deepEqual((await model(page)).slice(1), [4, 3]);
});
test('two workouts on one day both count, and the day carries the last letter', async () => {
  const page = await openApp({ sessions: abc().concat(session('2026-10-12', 'A', [60, 70, 80], { hm: '18:00' })) });
  assert.deepEqual(await page.evaluate(() => { const w = weekModel(S.uid); return [w.done, w.days[0].n, w.days[0].tpl]; }), [2, 2, 'A']);
});
test('Sunday closes the week and Monday starts clean', async () => {
  const p = profile({ week: { mon: '2026-10-12', days: [1, 3, 0] } });
  const sun = await openApp({ today: '2026-10-18', profile: p });
  assert.deepEqual(await sun.evaluate(() => { const d = weekModel(S.uid).days[6]; return [d.date, d.dow, d.state]; }), ['2026-10-18', 0, 'today']);
  const mon = await openApp({ today: '2026-10-19', profile: p });
  assert.deepEqual(await model(mon), ['2026-10-19', 0, 3]);
  assert.equal((await states(mon))[0], 'today');
});
test('the coming training days carry the letters in order', async () => {
  const page = await openApp({ sessions: abc() });
  assert.deepEqual(await page.evaluate(() => upcoming(S.uid)), [{ date: '2026-10-14', tpl: 'A' }, { date: '2026-10-16', tpl: 'B' }, { date: '2026-10-19', tpl: 'C' }]);
});
test('after training today the list starts tomorrow', async () => {
  const page = await openApp({ sessions: abc().concat(session('2026-10-14', 'A', [60, 70, 80])) });
  assert.deepEqual(await page.evaluate(() => upcoming(S.uid, 1)), [{ date: '2026-10-16', tpl: 'B' }]);
});
test('one training day a week looks three weeks ahead', async () => {
  const page = await openApp({ sessions: abc(), profile: profile({ days: [1] }) });
  assert.deepEqual(await page.evaluate(() => upcoming(S.uid).map(u => u.date)), ['2026-10-19', '2026-10-26', '2026-11-02']);
});
test('a swapped letter leads, and same-every-time has no letters to turn', async () => {
  const page = await openApp({ sessions: abc() });
  assert.deepEqual(await page.evaluate(() => { UI.tpl = 'C'; return upcoming(S.uid).map(u => u.tpl); }), ['C', 'A', 'B']);
  const same = await openApp({ sessions: abc(), profile: profile({ rotate: false }) });
  assert.deepEqual(await same.evaluate(() => upcoming(S.uid).map(u => u.tpl)), ['A', 'A', 'A']);
});
test('before the start date the list begins on the start date', async () => {
  const page = await openApp({ profile: profile({ start: '2026-10-19' }) });
  assert.equal(await page.evaluate(() => upcoming(S.uid, 1)[0].date), '2026-10-19');
});
