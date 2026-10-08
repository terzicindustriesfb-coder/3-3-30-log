const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at } = require('./helpers');
after(closeAll);

test('the bottom switch shows Today and Progress', async () => {
  const page = await openApp({ sessions: [first()] });
  assert.deepEqual(await texts(page, '#tabs button'), ['Today', 'Progress']);
  assert.equal(await page.locator('#tabs [data-tab="today"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#view [data-act="manual"]').count(), 0);
  await page.click('#tabs [data-tab="progress"]');
  assert.equal(await txt(page, '#view .title'), 'Progress');
  assert.equal(await page.locator('#tabs [data-tab="progress"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await txt(page, '#view [data-act="manual"]'), 'Log a past workout');
  assert.equal(await page.locator('#view [data-act="startSession"]').count(), 0);
});
test('no switch before there is a profile', async () => {
  const page = await openApp({ profile: null });
  assert.equal(await page.locator('#tabs').count(), 1);
  assert.equal(await page.locator('#tabs').isHidden(), true);
});
test('a reload lands on Today', async () => {
  const page = await openApp({ sessions: [first()] });
  await page.click('#tabs [data-tab="progress"]');
  await page.reload();
  await page.waitForFunction(() => !document.querySelector('#view .skeleton'));
  assert.equal(await page.locator('#tabs [data-tab="today"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#view [data-act="startSession"]').count(), 1);
});
test('the buddy switch lives on Progress and a buddy cannot be logged for', async () => {
  const page = await openApp({ sessions: [first()], crew: [{ id: 'sam', profile: profile({ nick: 'Sam' }), sessions: [first()] }] });
  assert.equal(await page.locator('#view [data-act="person"]').count(), 0);
  await page.click('#tabs [data-tab="progress"]');
  assert.deepEqual(await texts(page, '#view [data-act="person"]'), ['Me', 'Sam']);
  await page.click('#view [data-act="person"][data-id="sam"]');
  assert.equal(await page.locator('#view [data-act="manual"]').count(), 0);
});
test('the switch stays clear of the content and of a sheet', async () => {
  const page = await openApp({ sessions: abc() });
  assert.equal(await page.evaluate(() => { const b = document.querySelector('#tabs').getBoundingClientRect(); return b.height >= 52 && b.bottom <= innerHeight; }), true);
  await page.evaluate(() => ACT.settings());
  assert.equal(await page.evaluate(() => document.querySelector('#app').inert), true);
});
