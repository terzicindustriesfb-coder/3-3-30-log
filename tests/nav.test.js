const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at } = require('./helpers');
after(closeAll);

const go = (page, screen) => page.click(`#view [data-act="screen"][data-screen="${screen}"]`);
const home = page => page.waitForFunction(() => UI.screen === 'home' && document.querySelector('#view .home-nav'));

test('the home screen has two buttons, and the switch and the gear are gone', async () => {
  const page = await openApp({ sessions: [first()] });
  assert.deepEqual(await texts(page, '#view .home-nav [data-act="screen"]'), ['My results', 'Settings']);
  assert.equal(await page.locator('#tabs, #gearBtn, #sync').count(), 0);
});
test('My results and Settings are screens with a Back button', async () => {
  const page = await openApp({ sessions: [first()] });
  await go(page, 'results');
  assert.equal(await txt(page, '#view [data-act="back"]'), 'Back');
  assert.deepEqual(await page.evaluate(() => [UI.screen, document.activeElement.dataset.act, scrollY]), ['results', 'back', 0]);
  assert.equal(await page.locator('#view .home-nav').count(), 0);
  await page.click('#view [data-act="back"]');
  await home(page);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.screen), 'results');     // focus is back on the button that led there
  await go(page, 'settings');
  assert.equal(await txt(page, '#view .title'), 'Settings');
  await page.click('#view [data-act="back"]');
  await home(page);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.screen), 'settings');
});
test('the back button of the phone or the browser does the same as Back', async () => {
  const page = await openApp({ sessions: [first()] });
  await go(page, 'results');
  await page.goBack();
  await home(page);
  await page.goForward();
  await page.waitForFunction(() => UI.screen === 'results' && document.querySelector('#view [data-act="back"]'));
});
test('going back closes a sheet that is still open', async () => {
  const page = await openApp({ sessions: [first()] });
  await go(page, 'results');
  await page.click('#view [data-act="manual"]');
  await page.goBack();
  await home(page);
  assert.deepEqual(await page.evaluate(() => [document.querySelector('#sheet').hidden, document.querySelector('#app').inert]), [true, false]);
});
test('a reload lands on the home screen, and Back still works after it', async () => {
  const page = await openApp({ sessions: [first()] });
  await go(page, 'results');
  await page.reload();
  await page.waitForFunction(() => !document.querySelector('#view .skeleton'));
  assert.equal(await page.evaluate(() => UI.screen), 'home');
  assert.equal(await page.locator('#view .home-nav').count(), 1);
  await go(page, 'settings');
  await page.click('#view [data-act="back"]');
  await home(page);
});
test('Back from Settings while your name is being typed saves the name and leaves', async () => {
  const page = await openApp();
  await go(page, 'settings');
  await page.fill('#nickIn', 'Stevan');
  await page.evaluate(() => ACT.back());             // a phone does not move focus to a button on a tap
  await home(page);
  assert.equal(await page.evaluate(() => myProfile().nick), 'Stevan');
});
test('the top bar shows today’s date, and says so when the log is on this device only', async () => {
  assert.equal(await txt(await openApp({ today: '2026-10-09' }), '.top #dateText'), 'Fri 9 Oct · this device only');
  assert.equal(await txt(await openApp({ today: '2026-10-09', crew: [] }), '.top #dateText'), 'Fri 9 Oct');
});
test('before there is a profile there is nowhere to go', async () => {
  const page = await openApp({ profile: null });
  assert.equal(await page.locator('#view [data-act="screen"]').count(), 0);
  assert.equal(await txt(page, '.top #dateText'), 'Wed 14 Oct · this device only');
});
test('the buddy switch lives on the results screen and a buddy cannot be logged for', async () => {
  const page = await openApp({ sessions: [first()], crew: [{ id: 'sam', profile: profile({ nick: 'Sam' }), sessions: [first()] }] });
  assert.equal(await page.locator('#view [data-act="person"]').count(), 0);
  await go(page, 'results');
  assert.deepEqual(await texts(page, '#view [data-act="person"]'), ['Me', 'Sam']);
  await page.click('#view [data-act="person"][data-id="sam"]');
  assert.equal(await page.locator('#view [data-act="manual"]').count(), 0);
});
test('both screens fit a 320 px phone and Back is at least 44 px high', async () => {
  const page = await openApp({ width: 320, sessions: abc() });
  for (const screen of ['results', 'settings']) {
    await go(page, screen);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320, screen);
    assert.equal(await page.evaluate(() => document.querySelector('[data-act="back"]').getBoundingClientRect().height >= 44), true, screen);
    await page.click('#view [data-act="back"]');
    await home(page);
  }
});
