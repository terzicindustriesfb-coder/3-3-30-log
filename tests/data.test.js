const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at } = require('./helpers');
after(closeAll);

test('an old profile comes through without new keys', async () => {
  const page = await openApp();
  assert.deepEqual(await page.evaluate(() => Object.keys(normProfile(myProfile())).sort()),
    ['custom', 'days', 'joined', 'mode', 'nick', 'plans', 'start', 'v', 'weights']);
});
test('names, weight types and the week list are kept when valid, dropped when not', async () => {
  const page = await openApp();
  const out = await page.evaluate(() => normProfile(Object.assign({}, myProfile(), {
    names: { schouderdrukken: '  Shoulder   press ', kabelroeien: 'Seated cable row', nope: 'x', squat: 'x'.repeat(60) },
    eqs: { schouderdrukken: 'machine', kabelroeien: 'machine', squat: 'laser', 'c-seated-leg-press': 'barbell' },
    week: { mon: '2026-10-12', days: [5, 1, 1, 9, 'x', 2] },
  })));
  assert.deepEqual(out.names, { schouderdrukken: 'Shoulder press', squat: 'x'.repeat(40) });
  assert.deepEqual(out.eqs, { schouderdrukken: 'machine' });
  assert.deepEqual(out.week, { mon: '2026-10-12', days: [1, 2, 5] });
});
test('a week that does not start on a Monday is dropped, an empty week is kept', async () => {
  const page = await openApp();
  const out = await page.evaluate(() => [
    'week' in normProfile(Object.assign({}, myProfile(), { week: { mon: '2026-10-13', days: [1] } })),
    normProfile(Object.assign({}, myProfile(), { week: { mon: '2026-10-12', days: [] } })).week,
  ]);
  assert.deepEqual(out, [false, { mon: '2026-10-12', days: [] }]);
});
test('exInfo lays your name and weight type over the list', async () => {
  const page = await openApp();
  const out = await page.evaluate(() => {
    const a = exInfo('schouderdrukken', { names: { schouderdrukken: 'Shoulder press' }, eqs: { schouderdrukken: 'machine' } });
    const b = exInfo('schouderdrukken', { eqs: { schouderdrukken: 'dbpair' } });
    const mine = { names: { schouderdrukken: 'Shoulder press' } };
    return [[a.n, a.eq, a.step, a.start, !!a.dbl, !!a.bw], [b.n, b.step, b.start, !!b.dbl], exInfo('squat', {}).step,
      exName('schouderdrukken', mine), blockName({ ex: 'schouderdrukken', name: 'Overhead press' }, mine)];
  });
  assert.deepEqual(out, [['Shoulder press', 'machine', 5, 25, false, false], ['Overhead press', 4, 20, true], 5, 'Shoulder press', 'Shoulder press']);
});
test('saving drops a week list that belongs to another week', async () => {
  const stale = await openApp({ profile: profile({ week: { mon: '2026-10-05', days: [1, 2] } }) });
  assert.equal(await stale.evaluate(async () => { await saveProfile(clone(myProfile())); return 'week' in myProfile(); }), false);
  const fresh = await openApp({ profile: profile({ week: { mon: '2026-10-12', days: [1, 2] } }) });
  assert.deepEqual(await fresh.evaluate(async () => { await saveProfile(clone(myProfile())); return myProfile().week; }), { mon: '2026-10-12', days: [1, 2] });
});
test('a renamed exercise shows under its new name', async () => {
  const page = await openApp({ profile: profile({ names: { schouderdrukken: 'Shoulder press' } }) });
  assert.match(await txt(page, '#view .ex-row .ex-n'), /Shoulder press$/);
});
test('a backup carries the new fields, and an old backup still restores', async () => {
  const mine = profile({ names: { schouderdrukken: 'Shoulder press' }, eqs: { schouderdrukken: 'machine' }, week: { mon: '2026-10-12', days: [1, 2, 5] } });
  const src = await openApp({ crew: [], profile: mine, sessions: [first()] });
  await src.evaluate(() => exportData('json'));
  const backup = await src.evaluate(() => window.__saved.data);
  assert.deepEqual(JSON.parse(backup).profile.names, { schouderdrukken: 'Shoulder press' });
  const restore = json => async page => page.evaluate(async j => { await importData(new File([j], 'b.json', { type: 'application/json' })); return [myProfile().names || null, trainings(S.uid).length]; }, json);
  assert.deepEqual(await restore(backup)(await openApp()), [{ schouderdrukken: 'Shoulder press' }, 1]);
  const old = JSON.stringify({ app: '3-3-30-logboek', v: 1, profile: profile(), sessions: [first()] });
  assert.deepEqual(await restore(old)(await openApp()), [null, 1]);
  const busy = await openApp({ sessions: [session('2026-10-07', 'B', [30, 8, 40])], profile: profile({ names: { kabelroeien: 'Cable row' } }) });
  assert.deepEqual(await restore(backup)(busy), [{ kabelroeien: 'Cable row' }, 2]);
});
