const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at } = require('./helpers');
after(closeAll);

test('opens on this device with the seeded profile', async () => {
  const page = await openApp({ sessions: [first()] });
  assert.deepEqual(await page.evaluate(() => [S.mode, myProfile().nick, todayYmd(), sessionsOf(S.uid).length]), ['local', 'Steef', '2026-10-14', 1]);
});
test('opens in shared mode with a buddy', async () => {
  const page = await openApp({ crew: [{ id: 'bud', profile: profile({ nick: 'Sam' }), sessions: [first()] }] });
  assert.deepEqual(await page.evaluate(() => [S.mode, S.uid, S.members.get('bud').profile.nick, sessionsOf('bud').length]), ['shared', 'me', 'Sam', 1]);
});
test('an unfinished workout from an earlier day counts', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-12', 'B', [10, 0, 0], { status: 'active' })] });
  assert.equal(await page.evaluate(() => trainings(S.uid).length), 2);
});
test('a practice workout stays out of the count but in the log', async () => {
  const page = await openApp({ sessions: [session('2026-09-30', 'A', [5, 5, 5])] });
  assert.deepEqual(await page.evaluate(() => [trainings(S.uid).length, shownSessions(S.uid).length]), [0, 1]);
});
test('a workout counts from its first finished exercise', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-14', 'B', [10, 0, 0], { status: 'active' })] });
  assert.deepEqual(await page.evaluate(() => trainings(S.uid).map(s => s.id)), ['s-2026-10-05-A', 's-2026-10-14-B']);
  assert.equal(await page.evaluate(() => scoresOf(S.uid, 'db-schouderdrukken').length), 1);
});
test('a workout that is also open on this device counts like any other', async () => {
  const open = session('2026-10-13', 'B', [10, 0, 0], { status: 'active', id: 'd1' });
  const page = await openApp({ sessions: [first(), open], draft: open });
  assert.deepEqual(await page.evaluate(() => trainings(S.uid).map(s => s.id)), ['s-2026-10-05-A', 'd1']);
  assert.equal(await page.evaluate(() => shownSessions(S.uid).length), 2);
});
test('a workout with nothing done does not count', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-12', 'B', [0, 0, 0])] });
  assert.equal(await page.evaluate(() => trainings(S.uid).length), 1);
});

const start = page => page.evaluate(() => startOf(S.uid));
test('the start date is the Monday of the week you joined, or your stored date when that is earlier', async () => {
  assert.equal(await start(await openApp()), '2026-10-05');                                                                          // joined 28 Sept: never before the first Monday
  assert.equal(await start(await openApp({ profile: profile({ joined: at('2026-10-10'), start: '2026-10-12' }) })), '2026-10-05');   // joined on a Saturday and was told "next Monday"
  assert.equal(await start(await openApp({ profile: profile({ joined: at('2026-10-21'), start: '2026-10-05' }) })), '2026-10-05');   // an earlier stored date stays
  assert.equal(await start(await openApp({ profile: profile({ joined: at('2026-10-21'), start: '2026-10-19' }) })), '2026-10-19');
  assert.equal(await start(await openApp({ profile: profile({ joined: 0, start: '2026-10-19' }) })), '2026-10-19');                  // no join date: the stored date
});
test('a workout in the week you joined counts, and the profile is left as it is', async () => {
  const late = profile({ joined: at('2026-10-10'), start: '2026-10-12' });
  const page = await openApp({ today: '2026-10-11', profile: late, sessions: [session('2026-10-10', 'A', [20, 20, 20])] });
  assert.deepEqual(await page.evaluate(() => [trainings(S.uid).length, myProfile().start]), [1, '2026-10-12']);
});

const todayId = page => page.evaluate(() => { const s = todaySession(); return s ? s.id : null; });
test('today’s workout is the newest one dated today', async () => {
  assert.equal(await todayId(await openApp({ sessions: [first()] })), null);
  assert.equal(await todayId(await openApp({ today: '2026-10-05', sessions: [first()] })), 's-2026-10-05-A');
  const two = [first(), session('2026-10-05', 'B', [30, 8, 40], { hm: '18:00' })];
  assert.equal(await todayId(await openApp({ today: '2026-10-05', sessions: two })), 's-2026-10-05-B');
  const crew = [{ id: 'sam', profile: profile({ nick: 'Sam' }), sessions: [] }];
  assert.equal(await (await openApp({ today: '2026-10-05', sessions: [first()], crew })).evaluate(() => todaySession('sam')), null);
});

const week = (page, id) => page.evaluate(i => weekCount(i || S.uid), id || '');
test('the week counter counts this week’s workouts against three', async () => {
  assert.deepEqual(await week(await openApp()), { n: 0, text: '0 of 3 workouts', short: '0 of 3' });
  assert.deepEqual(await week(await openApp({ sessions: abc() })), { n: 1, text: '1 of 3 workouts', short: '1 of 3' });
  const full = abc().concat(session('2026-10-13', 'A', [60, 70, 80]), session('2026-10-14', 'B', [30, 8, 40]));
  assert.deepEqual(await week(await openApp({ sessions: full })), { n: 3, text: '3 of 3 workouts', short: '3 of 3' });
  const more = full.concat(session('2026-10-14', 'C', [40, 40, 40], { hm: '18:00' }));          // two on one day are two
  assert.deepEqual(await week(await openApp({ sessions: more })), { n: 4, text: '4 workouts this week', short: '4 workouts' });
});
test('the week runs from Monday to Sunday, and practice does not count', async () => {
  assert.equal((await week(await openApp({ today: '2026-10-18', sessions: abc() }))).n, 1);     // Sunday still belongs to the week of Mon 12
  assert.equal((await week(await openApp({ today: '2026-10-19', sessions: abc() }))).n, 0);     // Monday starts clean
  const late = profile({ joined: at('2026-10-19'), start: '2026-10-19' });
  assert.equal((await week(await openApp({ profile: late, sessions: abc() }))).n, 0);
});
test('the week counter works for a buddy, also one without workouts or without a profile', async () => {
  const crew = [{ id: 'sam', profile: profile({ nick: 'Sam' }), sessions: abc() }, { id: 'tom', profile: profile({ nick: 'Tom' }), sessions: [] }];
  const page = await openApp({ crew });
  assert.deepEqual([(await week(page, 'sam')).short, (await week(page, 'tom')).short, (await week(page, 'nobody')).short], ['1 of 3', '0 of 3', '0 of 3']);
});
