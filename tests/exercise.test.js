const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at } = require('./helpers');
after(closeAll);

const openEx = (page, slot = 'push') => page.click(`.wo .ex-row[data-slot="${slot}"]`);
const save = page => page.click('[data-sheet="ex"] button[type="submit"]');

test('the sheet shows name, weight type, weight and the score to beat', async () => {
  const page = await openApp({ sessions: abc() });
  await openEx(page);
  assert.equal(await page.locator('[data-sheet="ex"] [data-view="edit"]').count(), 1);
  assert.deepEqual([await txt(page, '[data-sheet="ex"] .sheet-head .eyebrow'), await txt(page, '[data-sheet="ex"] .sheet-head .h2')], ['Push · Workout A', 'Exercise']);
  assert.equal(await page.inputValue('#exName'), 'Overhead press');
  assert.equal(await txt(page, '[data-sheet="ex"] label[for="exName"] + .tiny'), 'Rename it and your scores stay with it.');
  assert.deepEqual(await texts(page, '[data-act="eq"]'), ['Barbell', 'Dumbbells (pair)', 'One dumbbell', 'Machine / cable', 'Bodyweight']);
  assert.deepEqual(await texts(page, '[data-act="eq"][aria-pressed="true"]'), ['Barbell']);
  assert.deepEqual(await texts(page, '[data-act="eq"]:disabled'), ['Dumbbells (pair)', 'Bodyweight']);
  assert.equal(await txt(page, '.eq-note'), 'Different kind of weight? Switch to another exercise.');
  assert.deepEqual([await page.inputValue('#exKgIn'), await txt(page, '#exKgNote')], ['35', 'steps of 2.5 kg']);
  assert.deepEqual([await txt(page, '.to-beat .eyebrow'), await txt(page, '.to-beat .small'), await txt(page, '.to-beat .goal-n'), await txt(page, '.to-beat .goal-l')],
    ['Score to beat', 'At 35 kg · Mon 5 Oct', '62', 'reps']);
  assert.deepEqual(await texts(page, '[data-sheet="ex"] .btn'), ['Save', 'Switch to another exercise']);
});
test('renaming keeps the scores', async () => {
  const page = await openApp({ sessions: abc() });
  await openEx(page);
  await page.fill('#exName', 'Shoulder press');
  await save(page);
  assert.equal(await txt(page, '#toast'), 'Saved.');
  assert.deepEqual(await page.evaluate(() => [myProfile().names, myProfile().plans.A.push]), [{ schouderdrukken: 'Shoulder press' }, 'schouderdrukken']);
  assert.deepEqual([await txt(page, '.wo .ex-n'), await txt(page, '.wo .goal-n')], ['Shoulder press', '62']);
});
test('a taken or empty name is refused and the sheet stays open', async () => {
  const page = await openApp({ sessions: abc() });
  await openEx(page);
  await page.fill('#exName', 'Seated cable row');
  await save(page);
  assert.equal(await txt(page, '#toast'), 'You already have an exercise with that name. Switch to it instead.');
  await page.fill('#exName', '  ');
  await save(page);
  assert.equal(await txt(page, '#toast'), 'Type a name for the exercise.');
  assert.equal(await page.locator('[data-sheet="ex"]').count(), 1);
  assert.equal(await page.evaluate(() => 'names' in myProfile()), false);
});
test('back to the original name drops your own name', async () => {
  const page = await openApp({ sessions: abc(), profile: profile({ names: { schouderdrukken: 'Shoulder press' } }) });
  await openEx(page);
  await page.fill('#exName', 'Overhead press');
  await save(page);
  assert.equal(await page.evaluate(() => 'names' in myProfile()), false);
});
test('a machine instead of a barbell changes the step', async () => {
  const page = await openApp({ sessions: abc() });
  await openEx(page);
  await page.click('[data-act="eq"][data-eq="machine"]');
  assert.equal(await txt(page, '#exKgNote'), 'steps of 5 kg');
  await page.click('[data-act="exKg"][data-dir="1"]');
  assert.equal(await page.inputValue('#exKgIn'), '40');
  await save(page);
  assert.deepEqual(await page.evaluate(() => [myProfile().eqs, myProfile().weights.schouderdrukken]), [{ schouderdrukken: 'machine' }, 40]);
  assert.deepEqual([await txt(page, '.wo .ex-kg'), await txt(page, '.wo .goal-l')], ['40 kg', 'reps to match']);
});
test('without scores an exercise can become a pair of dumbbells', async () => {
  const page = await openApp({ today: '2026-10-05' });
  await openEx(page);
  assert.equal(await page.locator('[data-act="eq"]:disabled').count(), 0);
  assert.equal(await page.locator('.eq-note').count(), 0);
  assert.equal(await page.locator('.to-beat').count(), 0);
  await page.click('[data-act="eq"][data-eq="dbpair"]');
  assert.deepEqual([await page.inputValue('#exKgIn'), await txt(page, '#exKgNote')], ['10', 'steps of 2 kg per dumbbell']);
  await save(page);
  assert.equal(await txt(page, '.wo .ex-kg'), '2 × 10 kg');
});
test('your own exercise is renamed in place', async () => {
  const page = await openApp({ sessions: abc() });
  await openEx(page, 'legs');
  await page.fill('#exName', 'Leg press machine');
  await save(page);
  assert.deepEqual(await page.evaluate(() => myProfile().custom.map(c => [c.k, c.n])), [['c-seated-leg-press', 'Leg press machine']]);
  assert.equal(await page.evaluate(() => history(S.uid, 'c-seated-leg-press').length), 1);
});
test('a bodyweight exercise explains minus kilos', async () => {
  const page = await openApp({ today: '2026-10-07', sessions: [first()] });
  await openEx(page, 'pull');
  assert.deepEqual([await txt(page, '[data-sheet="ex"] .sheet-head .eyebrow'), await txt(page, '#exKgNote')], ['Pull · Workout B', 'steps of 2.5 kg · minus = assist']);
});
test('saving from the plan returns to the plan', async () => {
  const page = await openApp({ sessions: abc() });
  await page.evaluate(() => ACT.plan());
  await page.click('.plan-card[data-tpl="A"] .plan-row[data-slot="push"]');
  await page.fill('#exName', 'Shoulder press');
  await save(page);
  assert.equal(await txt(page, '.plan-card[data-tpl="A"] .ex-n'), 'Shoulder press');
});
test('tapping another weight type and back changes nothing', async () => {
  const page = await openApp({ today: '2026-10-05' });
  await openEx(page);
  await page.click('[data-act="eq"][data-eq="dbpair"]');
  await page.click('[data-act="eq"][data-eq="barbell"]');
  assert.equal(await page.inputValue('#exKgIn'), '35');
  await save(page);
  assert.deepEqual(await page.evaluate(() => ['eqs' in myProfile(), myProfile().weights.schouderdrukken]), [false, 35]);
});
test('a typed weight is saved, per dumbbell for a pair', async () => {
  const page = await openApp({ today: '2026-10-07', sessions: [first()] });
  await openEx(page);                       // Workout B: seated dumbbell shoulder press
  assert.equal(await page.inputValue('#exKgIn'), '10');
  await page.fill('#exKgIn', '12,5');
  await save(page);
  assert.equal(await page.evaluate(() => myProfile().weights['db-schouderdrukken']), 25);
  assert.equal(await txt(page, '.wo .ex-kg'), '2 × 12.5 kg');
});
test('minus kilos are refused for a barbell', async () => {
  const page = await openApp({ sessions: abc() });
  await openEx(page);
  await page.fill('#exKgIn', '-5');
  await page.press('#exKgIn', 'Tab');
  assert.equal(await txt(page, '#toast'), 'Minus kilos only work for bodyweight exercises (assistance).');
  assert.equal(await page.inputValue('#exKgIn'), '35');
  await save(page);
  assert.equal(await page.evaluate(() => myProfile().weights.schouderdrukken), 35);
});
test('a weight type that is switched off cannot be picked', async () => {
  const page = await openApp({ sessions: abc() });
  await openEx(page);
  await page.evaluate(() => ACT.eq(document.querySelector('[data-act="eq"][data-eq="dbpair"]')));
  assert.deepEqual(await texts(page, '[data-act="eq"][aria-pressed="true"]'), ['Barbell']);
});
test('your own exercise takes another weight type', async () => {
  const page = await openApp({ sessions: abc() });
  await openEx(page, 'legs');
  assert.deepEqual(await texts(page, '[data-act="eq"][aria-pressed="true"]'), ['Machine / cable']);
  await page.click('[data-act="eq"][data-eq="barbell"]');
  assert.equal(await txt(page, '#exKgNote'), 'steps of 2.5 kg');
  await save(page);
  assert.deepEqual(await page.evaluate(() => { const c = myProfile().custom[0]; return [c.n, c.eq, c.step, c.bw, c.dbl, myProfile().weights[c.k]]; }),
    ['Seated leg press', 'barbell', 2.5, false, false, 75]);
});
test('with the same workout every time the sheet only names the group', async () => {
  const page = await openApp({ sessions: [first()], profile: profile({ mode: 'same' }) });
  await openEx(page);
  assert.equal(await txt(page, '[data-sheet="ex"] .sheet-head .eyebrow'), 'Push');
});
test('the sheet fits a 320 px phone', async () => {
  const page = await openApp({ width: 320, today: '2026-10-07', sessions: [first()] });
  await openEx(page, 'pull');
  assert.equal(await page.evaluate(() => { const el = document.querySelector('.sheet-panel'); return el.scrollWidth <= el.clientWidth; }), true);
});
