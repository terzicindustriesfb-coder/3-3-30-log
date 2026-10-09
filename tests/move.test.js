const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at } = require('./helpers');
after(closeAll);

const moved = (page, date) => page.evaluate(d => movedDay(S.uid, d), date);
const week = page => page.evaluate(() => myProfile().week || null);
const wed14 = () => session('2026-10-14', 'A', [60, 70, 80]);
const fri16 = () => session('2026-10-16', 'B', [30, 8, 40]);
const early = () => [first(), session('2026-10-07', 'B', [30, 8, 40])];          // nothing in the week of 12 Oct

test('Monday done, train Tuesday: Wednesday moves', async () => {
  assert.equal(await moved(await openApp({ today: '2026-10-13', sessions: abc() }), '2026-10-13'), '2026-10-14');
});
test('Monday missed, train Tuesday: Monday moves', async () => {
  assert.equal(await moved(await openApp({ today: '2026-10-13', sessions: early() }), '2026-10-13'), '2026-10-12');
});
test('Monday missed, Wednesday done, train Thursday: Monday moves', async () => {
  assert.equal(await moved(await openApp({ today: '2026-10-15', sessions: early().concat(wed14()) }), '2026-10-15'), '2026-10-12');
});
test('Monday and Wednesday done, train Thursday: Friday moves', async () => {
  assert.equal(await moved(await openApp({ today: '2026-10-15', sessions: abc().concat(wed14()) }), '2026-10-15'), '2026-10-16');
});
test('all three done, train Saturday: nothing moves', async () => {
  assert.equal(await moved(await openApp({ today: '2026-10-17', sessions: abc().concat(wed14(), fri16()) }), '2026-10-17'), null);
});
test('a planned day, another week and a practice workout never move anything', async () => {
  const page = await openApp({ sessions: abc() });
  assert.deepEqual([await moved(page, '2026-10-14'), await moved(page, '2026-10-06')], [null, null]);
  assert.equal(await moved(await openApp({ profile: profile({ start: '2026-10-19' }) }), '2026-10-13'), null);
});
test('the week list is written sorted and dropped when it equals the usual days', async () => {
  const page = await openApp();
  assert.deepEqual(await page.evaluate(() => [withWeekDays(myProfile(), [5, 2, 1]).week, 'week' in withWeekDays(myProfile(), [5, 3, 1])]),
    [{ mon: '2026-10-12', days: [1, 2, 5] }, false]);
});
test('logging a past workout on a rest day moves the next planned day', async () => {
  const page = await openApp({ today: '2026-10-15', sessions: abc() });
  await page.evaluate(() => ACT.manual());
  await page.fill('#sDate', '2026-10-13');
  await page.fill('[name="tot0"]', '30');
  await page.click('#sheet button[type="submit"]');
  await page.waitForSelector('#sheet', { state: 'hidden' });
  assert.deepEqual(await week(page), { mon: '2026-10-12', days: [1, 2, 5] });
  assert.deepEqual(await page.evaluate(() => weekModel(S.uid).days.map(d => d.state)), ['done', 'done', 'rest', 'todayRest', 'planned', 'rest', 'rest']);
  await page.evaluate(() => deleteSession(sessionsOf(S.uid).find(s => s.date === '2026-10-13').id));
  assert.deepEqual(await week(page), { mon: '2026-10-12', days: [1, 2, 5] });          // deleting does not move it back
});
test('changing only the reps of a workout moves nothing', async () => {
  const sat = session('2026-10-17', 'C', [40, 40, 40], { id: 'sat' });
  const page = await openApp({ today: '2026-10-18', sessions: abc().concat(wed14(), fri16(), sat), profile: profile({ week: { mon: '2026-10-12', days: [0, 1, 3, 5] } }) });
  await page.evaluate(() => ACT.edit({ dataset: { id: 'sat' } }));
  await page.fill('[name="tot0"]', '41');
  await page.click('#sheet button[type="submit"]');
  await page.waitForSelector('#sheet', { state: 'hidden' });
  assert.deepEqual(await week(page), { mon: '2026-10-12', days: [0, 1, 3, 5] });
});
test('changing the date of a workout to a rest day moves a day', async () => {
  const page = await openApp({ today: '2026-10-15', sessions: abc().concat(wed14()) });
  await page.evaluate(() => ACT.edit({ dataset: { id: 's-2026-10-14-A' } }));
  await page.fill('#sDate', '2026-10-13');
  await page.click('#sheet button[type="submit"]');
  await page.waitForSelector('#sheet', { state: 'hidden' });
  assert.deepEqual(await week(page), { mon: '2026-10-12', days: [1, 2, 5] });
});
