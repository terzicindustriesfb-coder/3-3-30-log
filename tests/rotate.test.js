const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at } = require('./helpers');
after(closeAll);

test('a profile without the field does the same three every time', async () => {
  const page = await openApp({ sessions: abc() });                 // the owner's stored profile still says mode: 'abc'
  assert.deepEqual(await page.evaluate(() => [rotates(myProfile()), 'rotate' in myProfile(), myProfile().mode, nextTpl(S.uid)]), [false, false, 'same', 'A']);
  assert.equal(await txt(page, '#view .title'), 'Today’s workout');
  assert.deepEqual(await texts(page, '.wo .ex-n'), ['Overhead press', 'Seated cable row', 'Seated leg press']);
});
test('with the field on, A, B and C take turns', async () => {
  const page = await openApp({ sessions: [first()], profile: profile({ rotate: true }) });
  assert.deepEqual(await page.evaluate(() => [rotates(myProfile()), myProfile().rotate, myProfile().mode, nextTpl(S.uid)]), [true, true, 'abc', 'B']);
});
test('only true switches it on, and the old field no longer decides', async () => {
  const page = await openApp();
  assert.deepEqual(await page.evaluate(() => [1, 'true', 'abc', false, null].map(v => 'rotate' in normProfile(Object.assign({}, myProfile(), { rotate: v })))), [false, false, false, false, false]);
  assert.equal(await page.evaluate(() => normProfile(Object.assign({}, myProfile(), { mode: 'abc' })).mode), 'same');
});
test('saving writes the old field along, and the old training days stay', async () => {
  const page = await openApp();
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('d330.own.local')).profile);
  await page.evaluate(async () => { const p = clone(myProfile()); p.rotate = true; await saveProfile(p); });
  let p = await stored();
  assert.deepEqual([p.rotate, p.mode, p.days], [true, 'abc', [1, 3, 5]]);
  await page.evaluate(async () => { const q = clone(myProfile()); delete q.rotate; await saveProfile(q); });
  p = await stored();
  assert.deepEqual(['rotate' in p, p.mode, p.days], [false, 'same', [1, 3, 5]]);
});
test('a new profile starts without it', async () => {
  const page = await openApp({ profile: null });
  assert.deepEqual(await page.evaluate(() => { const p = defaultProfile('Kim'); return ['rotate' in p, p.mode]; }), [false, 'same']);
});
test('the switch in Settings sets the field', async () => {
  const page = await openApp();
  await page.click('#view [data-act="screen"][data-screen="settings"]');
  assert.equal(await txt(page, '#view [data-act="mode"][aria-pressed="true"]'), 'Same every time');
  await page.click('#view [data-act="mode"][data-mode="abc"]');
  await page.waitForFunction(() => myProfile().rotate === true);
  await page.click('#view [data-act="mode"][data-mode="same"]');
  await page.waitForFunction(() => !('rotate' in myProfile()));
});
test('a backup carries the field, and an old backup restores without it', async () => {
  const src = await openApp({ crew: [], profile: profile({ rotate: true }), sessions: [first()] });
  await src.evaluate(() => exportData('json'));
  const backup = await src.evaluate(() => window.__saved.data);
  assert.equal(JSON.parse(backup).profile.rotate, true);
  const restore = (page, json) => page.evaluate(async j => { await importData(new File([j], 'b.json', { type: 'application/json' })); return [rotates(myProfile()), trainings(S.uid).length]; }, json);
  assert.deepEqual(await restore(await openApp(), backup), [true, 1]);
  const old = JSON.stringify({ app: '3-3-30-logboek', v: 1, profile: profile(), sessions: [first()] });
  assert.deepEqual(await restore(await openApp(), old), [false, 1]);
});
