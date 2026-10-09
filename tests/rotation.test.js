const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');
const { closeAll, session, first, abc, threeWeeks, txt, texts, at } = h;
/* These tests are about Workout A, B and C taking turns: every profile here has that switched on. */
const profile = over => h.profile(Object.assign({ rotate: true }, over));
const openApp = opts => h.openApp(Object.assign({ profile: profile() }, opts));
after(closeAll);

const next = (page, upTo) => page.evaluate(d => nextTpl(S.uid, d || undefined), upTo || '');

test('the first workout is A', async () => {
  assert.equal(await next(await openApp()), 'A');
});
test('B follows A, also across a weekend', async () => {
  assert.equal(await next(await openApp({ sessions: [first()] })), 'B');
});
test('A follows C', async () => {
  assert.equal(await next(await openApp({ sessions: abc() })), 'A');
});
test('after a swapped workout the order continues from that letter', async () => {
  assert.equal(await next(await openApp({ sessions: [first(), session('2026-10-07', 'C', [40, 40, 40])] })), 'A');
});
test('a date limits which workouts are looked at', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-09', 'B', [30, 8, 40])] });
  assert.deepEqual([await next(page, '2026-10-07'), await next(page, '2026-10-09')], ['B', 'C']);
});
test('a workout still in progress today does not move the letter', async () => {
  assert.equal(await next(await openApp({ sessions: [first(), session('2026-10-14', 'B', [10, 0, 0], { status: 'active' })] })), 'B');
});
test('same every time has no order', async () => {
  assert.equal(await next(await openApp({ sessions: [first()], profile: profile({ rotate: false }) })), 'A');
});
test('deleting the newest workout steps the letter back', async () => {
  const page = await openApp({ sessions: abc() });
  await page.evaluate(() => deleteSession('s-2026-10-12-C'));
  assert.equal(await next(page), 'C');
});
test('the main screen offers the next letter', async () => {
  const page = await openApp({ sessions: [first()] });
  assert.equal(await txt(page, '#view .title'), 'Workout B');
});
test('logging a past workout suggests the letter for its date', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-09', 'B', [30, 8, 40])] });
  await page.evaluate(() => ACT.manual());
  assert.equal(await txt(page, '#sheet [data-act="formTpl"][aria-pressed="true"]'), 'C');
  await page.fill('#sDate', '2026-10-07');
  assert.equal(await txt(page, '#sheet [data-act="formTpl"][aria-pressed="true"]'), 'B');
});
