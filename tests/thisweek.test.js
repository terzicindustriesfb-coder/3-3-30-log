const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at } = require('./helpers');
after(closeAll);

const status = page => texts(page, '[data-sheet="week"] .wkd-st');
const switches = page => page.locator('[data-sheet="week"] .switch').evaluateAll(els => els.map(e => e.dataset.date.slice(8) + ':' + e.getAttribute('aria-checked')));
const flip = (page, date) => page.click(`[data-sheet="week"] .switch[data-date="${date}"]`);

test('the sheet lists the seven days with their state', async () => {
  const page = await openApp({ today: '2026-10-13', sessions: abc() });
  await page.click('.wk-edit');
  assert.equal(await txt(page, '[data-sheet="week"] .sheet-head .h2'), 'This week');
  assert.equal(await txt(page, '[data-sheet="week"] .sheet-sub'), 'Mon 12 – Sun 18 Oct · tap a day to train or rest');
  assert.deepEqual(await texts(page, '[data-sheet="week"] .wkd-d'), ['Mon 12', 'Tue 13', 'Wed 14', 'Thu 15', 'Fri 16', 'Sat 17', 'Sun 18']);
  assert.deepEqual(await status(page), ['Done', 'Rest', 'Planned', 'Rest', 'Planned', 'Rest', 'Rest']);
  assert.deepEqual(await switches(page), ['13:false', '14:true', '15:false', '16:true', '17:false', '18:false']);
  assert.equal(await page.locator('[data-sheet="week"] .switch[data-date="2026-10-13"]').getAttribute('aria-label'), 'Train on Tuesday 13');
  assert.equal(await page.locator('[data-sheet="week"] .wkd[data-date="2026-10-12"] .wkd-ok').count(), 1);
});
test('today on and Wednesday off moves the workout', async () => {
  const page = await openApp({ today: '2026-10-13', sessions: abc() });
  await page.evaluate(() => ACT.week());
  await flip(page, '2026-10-13');
  assert.deepEqual((await status(page)).slice(1, 3), ['Today', 'Planned']);
  await flip(page, '2026-10-14');
  assert.deepEqual(await status(page), ['Done', 'Today · moved from Wed', 'Rest', 'Rest', 'Planned', 'Rest', 'Rest']);
  assert.deepEqual(await page.evaluate(() => myProfile().week), { mon: '2026-10-12', days: [1, 2, 5] });
  assert.deepEqual(await page.locator('[data-sheet="week"] .wd').evaluateAll(els => els.map(e => e.textContent.trim())), ['C', 'A', '', '', 'B', '', '']);
  await page.click('[data-sheet="week"] .btn.xl');
  assert.equal(await txt(page, '#view .title'), 'Workout A');
});
test('switching back drops the week list', async () => {
  const page = await openApp({ today: '2026-10-13', sessions: abc() });
  await page.evaluate(() => ACT.week());
  await flip(page, '2026-10-17');
  assert.deepEqual(await page.evaluate(() => myProfile().week.days), [1, 3, 5, 6]);
  await flip(page, '2026-10-17');
  assert.equal(await page.evaluate(() => 'week' in myProfile()), false);
});
test('past days cannot be changed', async () => {
  const page = await openApp({ today: '2026-10-15', sessions: abc() });
  await page.evaluate(() => ACT.week());
  assert.deepEqual((await status(page)).slice(0, 4), ['Done', 'Rest', 'Missed', 'Rest']);
  assert.deepEqual(await switches(page), ['15:false', '16:true', '17:false', '18:false']);
  await page.evaluate(() => ACT.weekDay({ dataset: { date: '2026-10-14' } }));
  assert.equal(await page.evaluate(() => 'week' in myProfile()), false);
});
test('switching the last coming day off is allowed', async () => {
  const page = await openApp({ today: '2026-10-15', sessions: abc() });
  await page.evaluate(() => ACT.week());
  await flip(page, '2026-10-16');
  assert.deepEqual(await page.evaluate(() => [myProfile().week.days, weekModel(S.uid).planned]), [[1, 3], 2]);
});
test('the footer names the usual days and leads to the plan', async () => {
  const page = await openApp({ today: '2026-10-13', sessions: abc() });
  await page.evaluate(() => ACT.week());
  assert.match(await txt(page, '[data-sheet="week"] .wk-foot'), /^Only this week changes\. Your usual days stay Mon, Wed and Fri\. Change usual days$/);
  await page.click('[data-sheet="week"] [data-act="plan"]');
  assert.equal(await page.locator('[data-sheet="plan"]').count(), 1);
  const two = await openApp({ profile: profile({ days: [5, 1] }) });
  await two.evaluate(() => ACT.week());
  assert.match(await txt(two, '[data-sheet="week"] .wk-foot'), /stay Mon and Fri\./);
});
test('on Sunday only Sunday can change, and the week spans the right dates', async () => {
  const page = await openApp({ today: '2026-10-18', sessions: abc() });
  await page.evaluate(() => ACT.week());
  assert.deepEqual(await switches(page), ['18:false']);
  const turn = await openApp({ today: '2026-09-30', profile: profile({ start: '2026-09-28' }) });
  await turn.evaluate(() => ACT.week());
  assert.equal(await txt(turn, '[data-sheet="week"] .sheet-sub'), 'Mon 28 Sept – Sun 4 Oct · tap a day to train or rest');
});
test('the strip and the rest-day link open the sheet', async () => {
  const page = await openApp({ today: '2026-10-13', sessions: abc() });
  assert.deepEqual(await texts(page, '.wo-links .btn'), ['Your plan', 'Change this week']);
  await page.click('.wo-links [data-act="week"]');
  assert.equal(await page.locator('[data-sheet="week"]').count(), 1);
  await page.keyboard.press('Escape');
  await page.click('.wk-row.me');
  assert.equal(await page.locator('[data-sheet="week"]').count(), 1);
  assert.equal(await page.locator('.wk-edit').getAttribute('aria-label'), 'Move a workout this week');
});
test('closing the sheet puts the focus back on the control that opened it', async () => {
  const page = await openApp({ sessions: abc() });
  await page.click('.wk-edit');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => document.activeElement.className), 'iconbtn wk-edit');
  await page.evaluate(() => render());                       // a redraw of the page keeps it there too
  assert.equal(await page.evaluate(() => document.activeElement.className), 'iconbtn wk-edit');
  const rest = await openApp({ today: '2026-10-13', sessions: abc() });
  await rest.click('.wo-links [data-act="week"]');
  await rest.click('[data-sheet="week"] .btn.primary');
  assert.equal(await rest.evaluate(() => document.activeElement.textContent), 'Change this week');
});
/* Makes every write to the shared log fail, the way a server error does. */
const breakSaving = page => page.evaluate(() => { S.db.doc = () => ({ get: async () => ({ exists: false }), set: async () => { throw Object.assign(new Error('refused'), { code: 'internal' }); }, delete: async () => {} }); });
test('when a change cannot be saved the sheet shows what is stored', async () => {
  const page = await openApp({ sessions: abc(), crew: [] });
  await page.click('.wk-edit');
  await breakSaving(page);
  await flip(page, '2026-10-15');
  await page.waitForFunction(() => /Couldn’t save/.test(document.querySelector('#toast').textContent));
  assert.deepEqual(await switches(page), ['14:true', '15:false', '16:true', '17:false', '18:false']);
  assert.equal(await page.evaluate(() => 'week' in myProfile()), false);
});
