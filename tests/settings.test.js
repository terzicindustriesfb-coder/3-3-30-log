const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at, breakSaving } = require('./helpers');
after(closeAll);

const toSettings = page => page.click('#view [data-act="screen"][data-screen="settings"]');
const checked = page => page.locator('#view .st-opt').evaluateAll(els => els.map(e => e.getAttribute('aria-checked')));
const pressed = page => page.locator('#view .st-onoff').evaluateAll(els => els.map(e => e.getAttribute('aria-pressed')));

test('every row says in words what it does', async () => {
  const page = await openApp({ sessions: [first()] });
  await toSettings(page);
  assert.deepEqual(await texts(page, '#view .st-h'), ['Your name', 'Your exercises', 'Sound and countdown', 'Backup', 'More']);
  assert.equal(await page.inputValue('#nickIn'), 'Steef');
  assert.deepEqual(await texts(page, '#view .st-opt b'), ['The same 3 exercises every workout', '3 workouts that take turns']);
  assert.deepEqual(await texts(page, '#view .st-opt .st-sub'), ['You do your own three every time.', 'Workout A, B and C, each with its own three exercises.']);
  assert.deepEqual(await checked(page), ['true', 'false']);
  assert.deepEqual(await texts(page, '#view .st-row b'), ['Beeps', 'Countdown']);
  assert.deepEqual(await texts(page, '#view .st-row .st-sub'), ['At the start, with 5 and 1 minute to go, and at the end.', '10 seconds to get ready before the clock starts.']);
  assert.deepEqual([await texts(page, '#view .st-onoff'), await pressed(page), await page.locator('#view .st-onoff svg').count()], [['On', 'On'], ['true', 'true'], 2]);
  assert.equal(await page.locator('#view .st-onoff[data-pref="sound"]').getAttribute('aria-label'), 'Beeps: on. Tap to turn off.');
  assert.deepEqual(await texts(page, '#view .st-link b'), ['Save a backup', 'Restore a backup', 'Open in Excel', 'How 3-3-30 works']);
  assert.deepEqual(await texts(page, '#view .st-link .st-sub'), ['A file with all your workouts', 'Put back a file you saved before', 'All your workouts as a .csv file']);
  assert.equal(await txt(page, '#view .st-local'), 'Your workouts are saved on this device only.');
});
test('the name is saved when you leave the field', async () => {
  const page = await openApp();
  await toSettings(page);
  await page.fill('#nickIn', 'Stevan');
  await page.press('#nickIn', 'Tab');
  await page.waitForFunction(() => myProfile().nick === 'Stevan');
});
test('3 workouts that take turns switches it on, and your own three stay Workout A', async () => {
  const page = await openApp({ profile: profile({ plans: { A: { push: 'schouderdrukken', pull: 'kabelroeien', legs: 'c-seated-leg-press' } } }) });
  await toSettings(page);
  await page.click('#view .st-opt[data-on="1"]');
  await page.waitForFunction(() => myProfile().rotate === true);
  assert.deepEqual(await checked(page), ['false', 'true']);
  assert.deepEqual(await page.evaluate(() => [myProfile().plans.A.push, myProfile().plans.B.push, myProfile().plans.C.legs]), ['schouderdrukken', 'db-schouderdrukken', 'reverse-lunge']);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.on), '1');
  await page.click('#view .st-opt[data-on="0"]');
  await page.waitForFunction(() => !('rotate' in myProfile()));
  assert.deepEqual(await checked(page), ['true', 'false']);
  assert.equal(await page.evaluate(() => myProfile().plans.B.push), 'db-schouderdrukken');       // kept for when it is switched on again
});
test('Beeps and Countdown switch per device and say their state', async () => {
  const page = await openApp();
  await toSettings(page);
  await page.click('#view .st-onoff[data-pref="lead"]');
  assert.deepEqual([await texts(page, '#view .st-onoff'), await pressed(page)], [['On', 'Off'], ['true', 'false']]);
  assert.equal(await page.locator('#view .st-onoff[data-pref="lead"]').getAttribute('aria-label'), 'Countdown: off. Tap to turn on.');
  assert.deepEqual(await page.evaluate(() => [prefs.sound, prefs.lead, JSON.parse(localStorage.getItem('d330.prefs')).lead, document.activeElement.dataset.pref]), [true, false, false, 'lead']);
  await page.reload();
  await page.waitForFunction(() => !document.querySelector('#view .skeleton'));
  await toSettings(page);
  assert.deepEqual(await texts(page, '#view .st-onoff'), ['On', 'Off']);
});
test('the three backup rows do what the three buttons did', async () => {
  const page = await openApp({ crew: [], sessions: [first()] });
  await toSettings(page);
  await page.click('#view [data-act="export"][data-fmt="json"]');
  await page.waitForFunction(() => window.__saved);
  assert.equal(await page.evaluate(() => window.__saved.filename), '3-3-30-backup-2026-10-14.json');
  await page.evaluate(() => { window.__saved = null; });
  await page.click('#view [data-act="export"][data-fmt="csv"]');
  await page.waitForFunction(() => window.__saved);
  assert.equal(await page.evaluate(() => window.__saved.filename), '3-3-30-workouts.csv');
});
test('a backup made here can be put back on a fresh log', async () => {
  const src = await openApp({ crew: [], profile: profile({ rotate: true }), sessions: [first()] });
  await toSettings(src);
  await src.click('#view [data-act="export"][data-fmt="json"]');
  await src.waitForFunction(() => window.__saved);
  const json = await src.evaluate(() => window.__saved.data);
  const page = await openApp();
  await toSettings(page);
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('#view [data-act="importPick"]')]);
  await chooser.setFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(json) });
  await page.waitForFunction(() => /restored/.test(document.querySelector('#toast').textContent));
  assert.equal(await txt(page, '#toast'), '1 workout restored.');
  assert.deepEqual(await page.evaluate(() => [rotates(myProfile()), trainings(S.uid).length]), [true, 1]);
});
test('Train with a buddy and How 3-3-30 works open in place', async () => {
  const page = await openApp({ crew: [] });
  await toSettings(page);
  assert.deepEqual(await texts(page, '#view .st-link[data-act="more"] b'), ['Train with a buddy', 'How 3-3-30 works']);
  assert.equal(await page.locator('#view .st-more, #view .st-local').count(), 0);
  await page.click('#view [data-act="more"][data-more="buddy"]');
  assert.equal(await page.locator('#view [data-act="more"][data-more="buddy"]').getAttribute('aria-expanded'), 'true');
  assert.equal(await txt(page, '#view .st-more'), 'Share this page with Claude’s share button and invite them as a Contributor or Editor. Then you see their week on the home screen and their scores under My results.');
  await page.click('#view [data-act="more"][data-more="how"]');
  assert.equal(await page.locator('#view .st-more').count(), 2);
  assert.equal(await page.locator('#view .st-more ol li').count(), 5);
  assert.deepEqual(await texts(page, '#view .st-more .legend p'), [
    'Push: you press the weight away from you. Trains chest, shoulders and triceps.',
    'Pull: you pull the weight toward you. Trains back and biceps.',
    'Legs: you push with your legs or bend at the hips. Trains thighs, hamstrings and glutes.']);
  await page.click('#view [data-act="more"][data-more="buddy"]');
  assert.equal(await page.locator('#view .st-more').count(), 1);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.more), 'buddy');
});
test('on the website there is a Sign out row that says who is signed in', async () => {
  const page = await openApp({ crew: [], web: { who: 'steef@example.com' } });
  await toSettings(page);
  assert.deepEqual([await txt(page, '#view [data-act="signOut"] b'), await txt(page, '#view [data-act="signOut"] .st-sub')], ['Sign out', 'Signed in as steef@example.com']);
  await page.click('#view [data-act="more"][data-more="buddy"]');
  assert.match(await txt(page, '#view .st-more'), /^Send them the link to this page and your crew code\. .* on the home screen and their scores under My results\.$/);
  await page.click('#view [data-act="signOut"]');
  assert.equal(await page.evaluate(() => window.__signedOut), true);
});
test('when the choice cannot be saved the screen shows what is stored', async () => {
  const page = await openApp({ crew: [] });
  await toSettings(page);
  await breakSaving(page);
  await page.click('#view .st-opt[data-on="1"]');
  await page.waitForFunction(() => /Couldn’t save/.test(document.querySelector('#toast').textContent));
  await page.waitForFunction(() => document.querySelector('#view .st-opt[data-on="0"]').getAttribute('aria-checked') === 'true');
  assert.equal(await page.evaluate(() => 'rotate' in myProfile()), false);
});
test('the two new colours have a dark value of their own', async () => {
  const read = async dark => (await openApp({ dark })).evaluate(() => ['--dot', '--good-ink'].map(v => getComputedStyle(document.documentElement).getPropertyValue(v).trim()));
  assert.deepEqual([await read(false), await read(true)], [['#8F8A7E', '#125F33'], ['#7C828C', '#8FE0B0']]);
});
test('Settings fits a 320 px phone and every row is at least 44 px high', async () => {
  const page = await openApp({ width: 320, crew: [], web: { who: 'someone.with.a.long.address@example.com' } });
  await toSettings(page);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
  const low = await page.evaluate(() => [...document.querySelectorAll('#view .st-opt, #view .st-onoff, #view .st-link, #view #nickIn')].filter(e => e.getBoundingClientRect().height < 44).length);
  assert.equal(low, 0);
});
test('the rows of a card are divided by a thin line', async () => {
  const page = await openApp({ crew: [] });
  await toSettings(page);
  const tops = await page.evaluate(() => ['.st-row', '.st-link[data-act="export"]', '.st-link[data-act="importPick"]', '.st-link[data-more="how"]'].map(s => getComputedStyle(document.querySelector('#view ' + s)).borderTopWidth));
  assert.deepEqual(tops, ['0px', '0px', '1px', '1px']);
});
