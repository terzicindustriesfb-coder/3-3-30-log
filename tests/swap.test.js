const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');
const { closeAll, session, first, abc, threeWeeks, txt, texts, at } = h;
/* These tests are about Workout A, B and C taking turns: every profile here has that switched on. */
const profile = over => h.profile(Object.assign({ rotate: true }, over));
const openApp = opts => h.openApp(Object.assign({ profile: profile() }, opts));
after(closeAll);

test('Swap workout offers the three workouts and marks the next one', async () => {
  const page = await openApp({ sessions: abc() });
  await page.click('#view [data-act="swap"]');
  assert.deepEqual(await texts(page, '[data-sheet="swap"] .swap-t'), ['Workout A', 'Workout B', 'Workout C']);
  assert.equal(await txt(page, '[data-sheet="swap"] [data-tpl="A"] .swap-next'), 'Next in line');
  assert.equal(await page.locator('[data-sheet="swap"] .swap-next').count(), 1);
  assert.match(await txt(page, '[data-sheet="swap"] [data-tpl="B"]'), /Seated dumbbell shoulder press.*Pull-ups.*Dumbbell Romanian deadlift/);
  await page.click('[data-sheet="swap"] [data-tpl="B"]');
  assert.equal(await page.locator('#sheet').isHidden(), true);
  assert.equal(await txt(page, '#view .title'), 'Today: Workout B');
  assert.deepEqual(await texts(page, '.xc .ex-n'), ['Seated dumbbell shoulder press', 'Pull-ups', 'Dumbbell Romanian deadlift']);
});
test('the letter buttons are gone from the card', async () => {
  const page = await openApp({ sessions: abc() });
  assert.equal(await page.locator('#view [data-act="pickTpl"]').count(), 0);
});
test('the choice does not survive a reload', async () => {
  const page = await openApp({ sessions: abc() });
  await page.click('#view [data-act="swap"]');
  await page.click('[data-sheet="swap"] [data-tpl="C"]');
  await page.reload();
  await page.waitForFunction(() => !document.querySelector('#view .skeleton'));
  assert.equal(await txt(page, '#view .title'), 'Today: Workout A');
});
test('picking the letter that is next in line clears the choice', async () => {
  const page = await openApp({ sessions: abc() });
  await page.evaluate(() => { UI.tpl = 'C'; ACT.swap(); });
  await page.click('[data-sheet="swap"] [data-tpl="A"]');
  assert.equal(await page.evaluate(() => UI.tpl), null);
});
test('the choice is used up by the first exercise that is stored', async () => {
  const page = await openApp({ sessions: abc(), prefs: { sound: false, lead: false } });
  await page.evaluate(() => { UI.tpl = 'C'; render(); });
  await page.click('.xc[data-slot="push"] [data-act="start"]');
  await page.click('.xc .pad [data-act="set"][data-n="10"]');
  await h.forward(page, 600);
  await page.waitForFunction(() => R.saved === 'saved');
  assert.deepEqual(await page.evaluate(() => [UI.tpl, todaySession().tpl, turnTpl(), nextTpl(S.uid)]), [null, 'C', 'C', 'A']);
});
test('same every time has nothing to swap', async () => {
  const page = await openApp({ sessions: abc(), profile: profile({ rotate: false }) });
  assert.equal(await page.locator('#view [data-act="swap"]').count(), 0);
});
test('Escape closes the sheet and focus returns to the link', async () => {
  const page = await openApp({ sessions: abc() });
  await page.click('#view [data-act="swap"]');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#sheet').isHidden(), true);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.act), 'swap');
});
