const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at } = require('./helpers');
after(closeAll);

const prob = (page, name, key, over) => page.evaluate(([n, k, o]) => nameProblem(Object.assign({}, myProfile(), o), n, k), [name, key, over || {}]);
const found = (page, slot, q, over) => page.evaluate(([s, t, o]) => searchExercises(Object.assign({}, myProfile(), o), s, t).map(e => e.n), [slot, q, over || {}]);

test('a name must be filled in and free', async () => {
  const page = await openApp();
  assert.equal(await prob(page, '   ', 'schouderdrukken'), 'empty');
  assert.equal(await prob(page, 'Seated cable row', 'schouderdrukken'), 'taken');
  assert.equal(await prob(page, 'seated-leg  PRESS', 'schouderdrukken'), 'taken');
  assert.equal(await prob(page, 'Overhead press', 'schouderdrukken'), '');
  assert.equal(await prob(page, 'Shoulder press', 'schouderdrukken'), '');
  assert.equal(await prob(page, 'Leg press', null), 'taken');
  assert.equal(await prob(page, 'Hip thrust', null), '');
});
test('a library name stays reserved after you rename that exercise', async () => {
  const page = await openApp();
  const mine = { names: { kabelroeien: 'Cable row' } };
  assert.equal(await prob(page, 'Cable row', 'schouderdrukken', mine), 'taken');
  assert.equal(await prob(page, 'Seated cable row', 'schouderdrukken', mine), 'taken');
  assert.equal(await prob(page, 'Seated cable row', 'kabelroeien', mine), '');
});
test('weight types: all five without scores, the plain three with', async () => {
  const none = await openApp();
  assert.deepEqual(await none.evaluate(() => allowedEqs(S.uid, 'schouderdrukken')), ['barbell', 'dbpair', 'db', 'machine', 'bw']);
  const page = await openApp({ sessions: abc() });
  assert.deepEqual(await page.evaluate(() => ['schouderdrukken', 'db-schouderdrukken', 'optrekken'].map(k => allowedEqs(S.uid, k))),
    [['barbell', 'db', 'machine'], ['dbpair'], ['bw']]);
});
test('search finds by name, by other known names and by the original name', async () => {
  const page = await openApp();
  assert.deepEqual(await found(page, 'push', ''), ['Barbell bench press', 'Chest press machine', 'Dips', 'Dumbbell bench press',
    'Incline dumbbell press', 'Overhead press', 'Push-ups', 'Seated dumbbell shoulder press']);
  assert.deepEqual(await found(page, 'push', 'Shoulder Press'), ['Overhead press', 'Seated dumbbell shoulder press']);
  assert.deepEqual(await found(page, 'legs', 'press'), ['Leg press', 'Seated leg press']);
  assert.deepEqual(await found(page, 'push', 'overhead', { names: { schouderdrukken: 'Shoulder press' } }), ['Shoulder press']);
  assert.deepEqual(await found(page, 'pull', 'zzz'), []);
});
test('a new exercise gets its own key and the settings of its weight type', async () => {
  const page = await openApp();
  const out = await page.evaluate(() => {
    const a = newCustom(myProfile(), 'Landmine press', 'push', 'barbell');
    const b = newCustom(a.p, 'Landmine  Press!', 'push', 'machine');
    return [a.key, a.p.custom.find(c => c.k === a.key), b.key, myProfile().custom.length];
  });
  assert.deepEqual(out, ['c-landmine-press', { k: 'c-landmine-press', n: 'Landmine press', s: 'push', eq: 'barbell', step: 2.5, start: 20, bw: false, dbl: false }, 'c-landmine-press-2', 1]);
});
