const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');
const { closeAll, session, first, abc, threeWeeks, txt, texts, at } = h;
/* These tests are about Workout A, B and C taking turns: every profile here has that switched on. */
const profile = over => h.profile(Object.assign({ rotate: true }, over));
const openApp = opts => h.openApp(Object.assign({ profile: profile() }, opts));
after(closeAll);

test('Your plan lists the days, the workouts and when each comes up', async () => {
  const page = await openApp({ sessions: abc() });
  await page.click('#view [data-act="plan"]');
  assert.equal(await txt(page, '[data-sheet="plan"] .sheet-head .h2'), 'Your plan');
  assert.deepEqual(await texts(page, '[data-sheet="plan"] .daypick button'), ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  assert.deepEqual(await texts(page, '[data-sheet="plan"] .daypick [aria-pressed="true"]'), ['Mon', 'Wed', 'Fri']);
  assert.deepEqual(await texts(page, '.plan-card .h2'), ['Workout A', 'Workout B', 'Workout C']);
  assert.deepEqual(await texts(page, '.plan-card .plan-when'), ['Today', 'Fri 16 Oct', 'Mon 19 Oct']);
  assert.deepEqual(await texts(page, '.plan-card[data-tpl="A"] .ex-n'), ['Overhead press', 'Seated cable row', 'Seated leg press']);
  assert.deepEqual(await texts(page, '.plan-card[data-tpl="B"] .ex-kg'), ['2 × 10 kg', 'bodyweight', '2 × 16 kg']);
  assert.deepEqual(await texts(page, '[data-sheet="plan"] .legend p'), [
    'Push: you press the weight away from you. Trains chest, shoulders and triceps.',
    'Pull: you pull the weight toward you. Trains back and biceps.',
    'Legs: you push with your legs or bend at the hips. Trains thighs, hamstrings and glutes.']);
});
test('the link is there in every situation but a workout in progress', async () => {
  for (const today of ['2026-10-14', '2026-10-13', '2026-10-12']) {
    assert.equal(await txt(await openApp({ today, sessions: abc() }), '#view [data-act="plan"]'), 'Your plan');
  }
  assert.equal(await (await openApp({ profile: profile({ start: '2026-10-19' }) })).locator('#view [data-act="plan"]').count(), 1);
  const open = session('2026-10-14', 'A', [10, 0, 0], { status: 'active', id: 'd1' });
  assert.equal(await (await openApp({ sessions: [open], draft: open })).locator('#view [data-act="plan"]').count(), 0);
});
test('Training days moved out of Settings, and the explanation moved in', async () => {
  const page = await openApp({ sessions: abc() });
  await page.click('#view [data-act="screen"][data-screen="settings"]');
  assert.equal(await page.locator('#view .daypick').count(), 0);
  assert.equal(await page.locator('#view details.how .legend p').count(), 3);
});
test('changing the usual days starts today', async () => {
  const page = await openApp({ sessions: [first()] });                                   // Monday 12 Oct was missed
  await page.evaluate(() => ACT.plan());
  await page.click('.daypick [data-d="5"]');
  await page.click('.daypick [data-d="1"]');
  await page.click('.daypick [data-d="6"]');
  assert.deepEqual(await page.evaluate(() => [myProfile().days.slice().sort(), myProfile().week]), [[3, 6], { mon: '2026-10-12', days: [1, 3, 6] }]);
  assert.deepEqual(await page.evaluate(() => weekModel(S.uid).days.map(d => d.state)), ['missed', 'rest', 'today', 'rest', 'rest', 'planned', 'rest']);
  assert.deepEqual(await texts(page, '[data-sheet="plan"] .daypick [aria-pressed="true"]'), ['Wed', 'Sat']);
});
test('one day at least, three at most', async () => {
  const page = await openApp({ profile: profile({ days: [1] }) });
  await page.evaluate(() => ACT.plan());
  await page.click('.daypick [data-d="1"]');
  assert.equal(await txt(page, '#toast'), 'Keep at least one training day.');
  const full = await openApp();
  await full.evaluate(() => ACT.plan());
  await full.click('.daypick [data-d="2"]');
  assert.equal(await txt(full, '#toast'), 'You already picked 3 days. Turn one off first.');
});
test('same every time shows one card', async () => {
  const page = await openApp({ sessions: abc(), profile: profile({ rotate: false }) });
  await page.evaluate(() => ACT.plan());
  assert.deepEqual(await texts(page, '.plan-card .h2'), ['Every workout']);
  assert.deepEqual(await texts(page, '.plan-card .plan-when'), ['Today']);
});
test('an exercise opens from the plan and closing returns to the plan', async () => {
  const page = await openApp({ sessions: abc() });
  await page.evaluate(() => ACT.plan());
  await page.click('.plan-card[data-tpl="B"] .plan-row[data-slot="pull"]');
  assert.equal(await page.locator('[data-sheet="ex"]').count(), 1);
  await page.click('[data-sheet="ex"] [data-act="closeSheet"]');
  assert.equal(await page.locator('[data-sheet="plan"]').count(), 1);
  await page.click('[data-sheet="plan"] [data-act="closeSheet"]');
  assert.equal(await page.locator('#sheet').isHidden(), true);
});
test('the welcome screen points to Your plan', async () => {
  const page = await openApp({ profile: null });
  assert.match(await txt(page, '#view form .tiny'), /^You train on Mon, Wed and Fri — change it any time in Your plan\./);
});
test('when the usual days cannot be saved the sheet shows what is stored', async () => {
  const page = await openApp({ sessions: abc(), crew: [] });
  await page.evaluate(() => ACT.plan());
  await page.evaluate(() => { S.db.doc = () => ({ get: async () => ({ exists: false }), set: async () => { throw Object.assign(new Error('refused'), { code: 'internal' }); }, delete: async () => {} }); });
  await page.click('[data-sheet="plan"] [data-act="day"][data-d="5"]');
  await page.waitForFunction(() => /Couldn’t save/.test(document.querySelector('#toast').textContent));
  assert.deepEqual(await texts(page, '[data-sheet="plan"] [data-act="day"][aria-pressed="true"]'), ['Mon', 'Wed', 'Fri']);
  assert.deepEqual(await page.evaluate(() => myProfile().days), [1, 3, 5]);
});
