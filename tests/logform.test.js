const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');
const { closeAll, session, first, abc, threeWeeks, txt, texts, at } = h;
/* These tests are about Workout A, B and C taking turns: every profile here has that switched on. */
const profile = over => h.profile(Object.assign({ rotate: true }, over));
const openApp = opts => h.openApp(Object.assign({ profile: profile() }, opts));
after(closeAll);

const openLog = page => page.evaluate(() => ACT.manual());
const opts = (page, name, group) => page.locator(`select[name="${name}"] optgroup[label="${group}"] option`).allTextContents();

test('each group offers its exercises in a list, the plan first', async () => {
  const page = await openApp({ sessions: abc() });
  await openLog(page);
  assert.equal(await page.locator('#sheet select[name="ex0"]').getAttribute('aria-label'), 'Push exercise');
  assert.deepEqual(await opts(page, 'ex0', 'In your plan'), ['Overhead press', 'Seated dumbbell shoulder press', 'Incline dumbbell press']);
  assert.deepEqual(await opts(page, 'ex0', 'More push exercises'), ['Barbell bench press', 'Chest press machine', 'Dips', 'Dumbbell bench press', 'Push-ups']);
  assert.deepEqual(await opts(page, 'ex2', 'In your plan'), ['Seated leg press', 'Dumbbell Romanian deadlift', 'Dumbbell reverse lunge']);
  assert.deepEqual([await page.inputValue('select[name="ex0"]'), await page.inputValue('select[name="ex1"]')], ['schouderdrukken', 'kabelroeien']);
  assert.equal(await page.locator('#sheet input[list]').count(), 0);
  assert.equal(await page.locator('#exNames').count(), 0);
});
test('another letter fills in that workout’s exercises', async () => {
  const page = await openApp({ sessions: abc() });
  await openLog(page);
  await page.click('#sheet [data-act="formTpl"][data-tpl="B"]');
  assert.deepEqual([await page.inputValue('select[name="ex0"]'), await page.inputValue('select[name="ex1"]')], ['db-schouderdrukken', 'optrekken']);
  assert.equal(await txt(page, '#sheet label[for="kg0"] .kglbl'), 'Each dumbbell (kg)');
  assert.equal(await txt(page, '#sheet label[for="kg1"] .kglbl'), 'Extra kg (− = assist)');
});
test('logging another exercise saves it and asks about the plan', async () => {
  const page = await openApp({ sessions: abc() });
  await openLog(page);
  await page.selectOption('select[name="ex0"]', 'bankdrukken');
  assert.equal(await page.inputValue('#kg0'), '40');
  await page.fill('[name="tot0"]', '30');
  await page.click('#sheet button[type="submit"]');
  assert.equal(await txt(page, '#sheet .h2'), 'Use these from now on?');
  assert.equal(await page.evaluate(() => sessionsOf(S.uid).find(s => s.date === '2026-10-14').blocks[0].ex), 'bankdrukken');
  await page.click('#sheet [data-act="applyPlan"]');
  assert.equal(await page.evaluate(() => myProfile().plans.A.push), 'bankdrukken');
});
test('an old workout keeps an exercise that is no longer in any list', async () => {
  const gone = session('2026-10-09', 'C', [20, 20, 20], { id: 'old', ex: ['c-gone', 'pendlay', 'reverse-lunge'], names: ['Old move', 'pendlay', 'reverse-lunge'] });
  const page = await openApp({ sessions: [first(), gone] });
  await page.evaluate(() => ACT.edit({ dataset: { id: 'old' } }));
  assert.equal(await page.inputValue('select[name="ex0"]'), 'c-gone');
  assert.equal(await txt(page, 'select[name="ex0"] > option'), 'Old move');
  await page.fill('[name="tot0"]', '21');
  await page.click('#sheet button[type="submit"]');
  await page.waitForSelector('#sheet', { state: 'hidden' });
  assert.deepEqual(await page.evaluate(() => { const b = me().sessions.get('old').blocks[0]; return [b.ex, b.total]; }), ['c-gone', 21]);
});
test('a renamed exercise appears under its new name', async () => {
  const page = await openApp({ sessions: abc(), profile: profile({ names: { schouderdrukken: 'Shoulder press' } }) });
  await openLog(page);
  assert.equal((await opts(page, 'ex0', 'In your plan'))[0], 'Shoulder press');
});
test('the code that guessed exercises from typed names is gone', async () => {
  const page = await openApp();
  assert.deepEqual(await page.evaluate(() => [typeof exByName, typeof resolveExercise, typeof fillNameList]), ['undefined', 'undefined', 'undefined']);
});
test('an old workout keeps the stored name of an exercise that is gone', async () => {
  const gone = session('2026-10-09', 'C', [20, 20, 20], { id: 'old', ex: ['c-gone', 'pendlay', 'reverse-lunge'], names: ['Old move', 'pendlay', 'reverse-lunge'] });
  const page = await openApp({ sessions: [first(), gone] });
  await page.evaluate(() => ACT.edit({ dataset: { id: 'old' } }));
  await page.fill('[name="tot1"]', '22');
  await page.click('#sheet button[type="submit"]');
  await page.waitForSelector('#sheet', { state: 'hidden' });
  assert.deepEqual(await page.evaluate(() => me().sessions.get('old').blocks.map(b => b.name)), ['Old move', 'Pendlay row', 'Dumbbell reverse lunge']);
});
test('in an edit, another exercise keeps the kilos and shows them its own way', async () => {
  const page = await openApp({ sessions: abc() });
  await page.evaluate(() => ACT.edit({ dataset: { id: 's-2026-10-07-B' } }));
  assert.deepEqual([await page.inputValue('#kg0'), await txt(page, '#sheet label[for="kg0"] .kglbl')], ['10', 'Each dumbbell (kg)']);
  await page.selectOption('select[name="ex0"]', 'bankdrukken');
  assert.deepEqual([await page.inputValue('#kg0'), await txt(page, '#sheet label[for="kg0"] .kglbl')], ['20', 'Weight (kg)']);
  await page.click('#sheet button[type="submit"]');
  await page.waitForSelector('#sheet', { state: 'hidden' });
  assert.deepEqual(await page.evaluate(() => { const b = me().sessions.get('s-2026-10-07-B').blocks[0]; return [b.ex, b.name, b.kg, b.total]; }), ['bankdrukken', 'Barbell bench press', 20, 30]);
  assert.equal(await page.evaluate(() => myProfile().custom.length), 1);
});
test('in a new log a typed weight stays when you choose another exercise', async () => {
  const page = await openApp({ sessions: abc() });
  await openLog(page);
  await page.fill('#kg0', '50');
  await page.selectOption('select[name="ex0"]', 'bankdrukken');
  assert.equal(await page.inputValue('#kg0'), '50');
  await page.selectOption('select[name="ex0"]', 'dips');
  assert.deepEqual([await page.inputValue('#kg0'), await txt(page, '#sheet label[for="kg0"] .kglbl')], ['0', 'Extra kg (− = assist)']);
});
test('with the same workout every time the list has one plan, and the form fits a 320 px phone', async () => {
  const page = await openApp({ width: 320, sessions: abc(), profile: profile({ rotate: false }) });
  await openLog(page);
  assert.deepEqual(await opts(page, 'ex0', 'In your plan'), ['Overhead press']);
  assert.equal(await page.evaluate(() => { const el = document.querySelector('.sheet-panel'); return el.scrollWidth <= el.clientWidth; }), true);
});
test('the sheet is called Add a workout and offers Today and Yesterday', async () => {
  const page = await openApp({ sessions: abc() });
  await openLog(page);
  assert.equal(await txt(page, '#sheet .h2'), 'Add a workout');
  assert.equal(await page.locator('#sheet .sheet-panel').getAttribute('aria-label'), 'Add a workout');
  assert.deepEqual(await texts(page, '#dateChips [data-act="pickDate"]'), ['Today', 'Yesterday']);
  assert.equal(await page.locator('#sheet [data-act="formTpl"]').count(), 3);
  const plain = await openApp({ sessions: abc(), profile: profile({ rotate: false }) });
  await openLog(plain);
  assert.equal(await plain.locator('#sheet [data-act="formTpl"]').count(), 0);
});
test('after saving nothing moves: the profile keeps its days and gets no week list', async () => {
  const page = await openApp({ today: '2026-10-15', sessions: abc() });
  await openLog(page);
  await page.fill('#sDate', '2026-10-13');
  await page.fill('[name="tot0"]', '30');
  await page.click('#sheet button[type="submit"]');
  await page.waitForSelector('#sheet', { state: 'hidden' });
  assert.deepEqual(await page.evaluate(() => ['week' in myProfile(), myProfile().days]), [false, [1, 3, 5]]);
  assert.equal(await page.evaluate(() => new Date(sessionsOf(S.uid).find(s => s.date === '2026-10-13').startedAt).getHours()), 12);
});
test('a workout added for today becomes today’s workout, and the cards follow it', async () => {
  const card = session('2026-10-14', 'A', [68, 0, 0], { id: 'card', hm: '13:00' });
  const page = await openApp({ time: '15:00', sessions: [first(), card], profile: profile({ rotate: false }) });
  await openLog(page);
  await page.fill('[name="tot1"]', '70');
  await page.click('#sheet button[type="submit"]');
  await page.waitForSelector('#sheet', { state: 'hidden' });
  assert.deepEqual(await page.evaluate(() => { const t = todaySession(); return [t.id !== 'card', t.manual, t.blocks.map(b => b.total)]; }), [true, true, [0, 70, 0]]);
  assert.deepEqual(await page.locator('#view .xc').evaluateAll(els => els.map(e => e.dataset.slot + ':' + e.dataset.form)), ['push:todo', 'pull:done', 'legs:todo']);
});
