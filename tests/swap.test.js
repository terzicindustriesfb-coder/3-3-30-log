const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at } = require('./helpers');
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
  assert.equal(await txt(page, '#view .title'), 'Workout B');
  assert.equal(await page.locator('#view [data-act="startSession"]').getAttribute('data-tpl'), 'B');
  assert.deepEqual(await page.locator('.wk-row.me .wd').evaluateAll(els => els.map(e => e.textContent.trim())), ['C', '', 'B', '', 'C', '', '']);
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
  assert.equal(await txt(page, '#view .title'), 'Workout A');
});
test('picking the letter that is next in line clears the choice', async () => {
  const page = await openApp({ sessions: abc() });
  await page.evaluate(() => { UI.tpl = 'C'; ACT.swap(); });
  await page.click('[data-sheet="swap"] [data-tpl="A"]');
  assert.equal(await page.evaluate(() => UI.tpl), null);
});
test('the choice is used up by the workout it was made for', async () => {
  const page = await openApp({ sessions: abc() });
  await page.evaluate(async () => {
    UI.tpl = 'C';
    openRunner(false, UI.tpl);
    R.session.blocks.forEach(b => { b.sets = [{ r: 10, kg: b.kg, t: 5 }]; b.total = 10; b.done = true; b.dur = 600; });
    R.phase = 'finish';
    await finishAndSave();
  });
  assert.deepEqual(await page.evaluate(() => [UI.tpl, nextTpl(S.uid)]), [null, 'A']);
});
test('same every time has nothing to swap', async () => {
  const page = await openApp({ sessions: abc(), profile: profile({ mode: 'same' }) });
  assert.equal(await page.locator('#view [data-act="swap"]').count(), 0);
});
test('Escape closes the sheet and focus returns to the link', async () => {
  const page = await openApp({ sessions: abc() });
  await page.click('#view [data-act="swap"]');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#sheet').isHidden(), true);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.act), 'swap');
});
