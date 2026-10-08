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
test('a workout started today and not finished does not count', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-14', 'B', [10, 0, 0], { status: 'active' })] });
  assert.deepEqual(await page.evaluate(() => trainings(S.uid).map(s => s.id)), ['s-2026-10-05-A']);
  assert.equal(await page.evaluate(() => history(S.uid, 'db-schouderdrukken').length), 0);
});
test('an unfinished workout from an earlier day counts', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-12', 'B', [10, 0, 0], { status: 'active' })] });
  assert.equal(await page.evaluate(() => trainings(S.uid).length), 2);
});
test('the workout open on this device does not count, whatever its date', async () => {
  const open = session('2026-10-13', 'B', [10, 0, 0], { status: 'active', id: 'd1' });
  const page = await openApp({ sessions: [first(), open], draft: open });
  assert.deepEqual(await page.evaluate(() => trainings(S.uid).map(s => s.id)), ['s-2026-10-05-A']);
  assert.equal(await page.evaluate(() => shownSessions(S.uid).length), 1);
});
test('a practice workout stays out of the count but in the log', async () => {
  const page = await openApp({ sessions: [session('2026-09-30', 'A', [5, 5, 5])] });
  assert.deepEqual(await page.evaluate(() => [trainings(S.uid).length, shownSessions(S.uid).length]), [0, 1]);
});
