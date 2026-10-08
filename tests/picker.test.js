const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at } = require('./helpers');
after(closeAll);

const openPick = async (page, slot = 'push') => { await page.click(`.wo .ex-row[data-slot="${slot}"]`); await page.click('[data-act="exPick"]'); };
const rows = (page, group) => texts(page, `.pick-group[data-group="${group}"] .ex-n`);
const subs = (page, group) => texts(page, `.pick-group[data-group="${group}"] .tiny`);

test('the list shows your plan first, then the rest of the group', async () => {
  const page = await openApp({ sessions: abc() });
  await openPick(page);
  assert.equal(await txt(page, '[data-view="pick"] .h2'), 'Choose a push exercise');
  assert.equal(await txt(page, '.pick-help'), 'Push: you press the weight away from you. Trains chest, shoulders and triceps.');
  assert.equal(await page.locator('#exSearch').getAttribute('placeholder'), 'Search, or type your own');
  assert.deepEqual(await texts(page, '#exPickList .eyebrow'), ['In your plan', 'More push exercises']);
  assert.deepEqual(await rows(page, 'plan'), ['Overhead press', 'Seated dumbbell shoulder press', 'Incline dumbbell press']);
  assert.deepEqual(await subs(page, 'plan'), ['Barbell · Workout A', 'Dumbbells · Workout B', 'Dumbbells · Workout C']);
  assert.deepEqual(await rows(page, 'more'), ['Barbell bench press', 'Chest press machine', 'Dips', 'Dumbbell bench press', 'Push-ups']);
  assert.deepEqual(await subs(page, 'more'), ['Barbell', 'Machine / cable', 'Bodyweight', 'Dumbbells', 'Bodyweight']);
  assert.deepEqual(await texts(page, '.pick-row[aria-pressed="true"] .ex-n'), ['Overhead press']);
  assert.equal(await txt(page, '[data-act="exNew"]'), 'Add your own exercise');
});
test('search finds other names but never picks for you', async () => {
  const page = await openApp({ sessions: abc() });
  await openPick(page);
  await page.fill('#exSearch', 'shoulder press');
  assert.deepEqual([await rows(page, 'plan'), await page.locator('.pick-group[data-group="more"]').count()], [['Overhead press', 'Seated dumbbell shoulder press'], 0]);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'exSearch');
  assert.equal(await page.evaluate(() => myProfile().plans.A.push), 'schouderdrukken');
});
test('picking puts it in the workout and opens its sheet', async () => {
  const page = await openApp({ sessions: abc() });
  await openPick(page);
  await page.click('.pick-row[data-ex="bankdrukken"]');
  assert.equal(await txt(page, '#toast'), 'Barbell bench press is in Workout A.');
  assert.equal(await page.evaluate(() => myProfile().plans.A.push), 'bankdrukken');
  assert.equal(await page.locator('[data-view="edit"]').count(), 1);
  assert.equal(await page.inputValue('#exName'), 'Barbell bench press');
  assert.equal(await page.locator('.to-beat').count(), 0);
  await page.click('[data-sheet="ex"] [data-act="closeSheet"]');
  assert.deepEqual(await texts(page, '.wo .goal-l'), ['First time', 'reps to beat', 'reps to beat']);
});
test('the current exercise and the back button change nothing', async () => {
  const page = await openApp({ sessions: abc() });
  await openPick(page);
  await page.click('.pick-row[data-ex="schouderdrukken"]');
  assert.equal(await page.locator('[data-view="edit"]').count(), 1);
  await page.click('[data-act="exPick"]');
  await page.click('[data-act="exBack"]');
  assert.equal(await page.inputValue('#exName'), 'Overhead press');
  assert.equal(await page.locator('#toast').isHidden(), true);
});
test('nothing found offers your own exercise', async () => {
  const page = await openApp({ sessions: abc() });
  await openPick(page);
  await page.fill('#exSearch', 'Landmine press');
  assert.equal(await txt(page, '.pick-none'), 'No push exercise called “Landmine press”.');
  await page.click('[data-act="exNew"]');
  assert.equal(await txt(page, '[data-view="new"] .h2'), 'New push exercise');
  assert.equal(await page.inputValue('#newName'), 'Landmine press');
  assert.deepEqual(await texts(page, '[data-act="newEq"][aria-pressed="true"]'), ['Barbell']);
  await page.click('[data-act="newEq"][data-eq="machine"]');
  await page.click('[data-view="new"] button[type="submit"]');
  assert.equal(await txt(page, '#toast'), 'Landmine press is in Workout A.');
  assert.deepEqual(await page.evaluate(() => { const c = myProfile().custom.find(x => x.n === 'Landmine press'); return [c.k, c.s, c.eq, myProfile().plans.A.push]; }),
    ['c-landmine-press', 'push', 'machine', 'c-landmine-press']);
  assert.equal(await page.inputValue('#exName'), 'Landmine press');
});
test('a name that exists is refused when adding', async () => {
  const page = await openApp({ sessions: abc() });
  await openPick(page);
  await page.click('[data-act="exNew"]');
  await page.fill('#newName', 'dips');
  await page.click('[data-view="new"] button[type="submit"]');
  assert.equal(await txt(page, '#toast'), 'You already have an exercise with that name. Pick it from the list.');
  await page.fill('#newName', '');
  await page.click('[data-view="new"] button[type="submit"]');
  assert.equal(await txt(page, '#toast'), 'Type a name for the exercise.');
  assert.equal(await page.evaluate(() => myProfile().custom.length), 1);
});
test('the weight type follows the name until you choose one', async () => {
  const page = await openApp({ sessions: abc() });
  await openPick(page, 'pull');
  await page.click('[data-act="exNew"]');
  await page.fill('#newName', 'Cable face pull');
  assert.deepEqual(await texts(page, '[data-act="newEq"][aria-pressed="true"]'), ['Machine / cable']);
  await page.click('[data-act="newEq"][data-eq="db"]');
  await page.fill('#newName', 'Cable face pull high');
  assert.deepEqual(await texts(page, '[data-act="newEq"][aria-pressed="true"]'), ['One dumbbell']);
});
test('an exercise in two workouts says so, and same-every-time has one plan', async () => {
  const plans = JSON.parse(JSON.stringify(profile().plans)); plans.C.push = 'schouderdrukken';
  const page = await openApp({ sessions: abc(), profile: profile({ plans }) });
  await openPick(page);
  assert.deepEqual(await subs(page, 'plan'), ['Barbell · Workout A and C', 'Dumbbells · Workout B']);
  const same = await openApp({ sessions: abc(), profile: profile({ mode: 'same' }) });
  await openPick(same);
  assert.deepEqual([await rows(same, 'plan'), await subs(same, 'plan')], [['Overhead press'], ['Barbell']]);
  await same.click('.pick-row[data-ex="dips"]');
  assert.equal(await txt(same, '#toast'), 'Dips is in your plan.');
});
test('from the plan, another workout gets the exercise and you return to the plan', async () => {
  const page = await openApp({ sessions: abc() });
  await page.evaluate(() => ACT.plan());
  await page.click('.plan-card[data-tpl="B"] .plan-row[data-slot="pull"]');
  await page.click('[data-act="exPick"]');
  assert.deepEqual(await subs(page, 'plan'), ['Machine / cable · Workout A', 'Bodyweight · Workout B', 'Barbell · Workout C']);
  await page.click('.pick-row[data-ex="chin-ups"]');
  assert.equal(await txt(page, '#toast'), 'Chin-ups is in Workout B.');
  assert.deepEqual(await page.evaluate(() => [myProfile().plans.A.pull, myProfile().plans.B.pull]), ['kabelroeien', 'chin-ups']);
  assert.equal(await txt(page, '[data-sheet="ex"] .sheet-head .eyebrow'), 'Pull · Workout B');
  await page.click('[data-sheet="ex"] [data-act="closeSheet"]');
  assert.deepEqual(await texts(page, '.plan-card[data-tpl="B"] .ex-n'), ['Seated dumbbell shoulder press', 'Chin-ups', 'Dumbbell Romanian deadlift']);
});
test('what you changed but did not save is gone after a switch', async () => {
  const page = await openApp({ sessions: abc() });
  await page.click('.wo .ex-row[data-slot="push"]');
  await page.fill('#exName', 'My press');
  await page.click('[data-act="eq"][data-eq="machine"]');
  await page.click('[data-act="exPick"]');
  await page.click('.pick-row[data-ex="bankdrukken"]');
  assert.deepEqual(await page.evaluate(() => ['names' in myProfile(), 'eqs' in myProfile(), myProfile().weights.schouderdrukken]), [false, false, 35]);
  assert.deepEqual(await texts(page, '[data-act="eq"][aria-pressed="true"]'), ['Barbell']);
});
test('going back keeps what you typed, in the search and in the sheet', async () => {
  const page = await openApp({ sessions: abc() });
  await page.click('.wo .ex-row[data-slot="push"]');
  await page.fill('#exName', 'My press');
  await page.click('[data-act="exPick"]');
  await page.fill('#exSearch', '<b>Landmine</b>');
  assert.equal(await txt(page, '.pick-none'), 'No push exercise called “<b>Landmine</b>”.');
  assert.equal(await page.locator('.pick-none b').count(), 0);
  await page.click('[data-act="exNew"]');
  await page.click('[data-act="exBack"]');
  assert.equal(await page.inputValue('#exSearch'), '<b>Landmine</b>');
  assert.equal(await page.locator('.pick-none').count(), 1);
  await page.click('[data-act="exBack"]');
  assert.equal(await page.inputValue('#exName'), 'My press');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.act), 'exPick');
});
test('the list and the new-exercise form fit a 320 px phone', async () => {
  const fits = page => page.evaluate(() => { const el = document.querySelector('.sheet-panel'); return el.scrollWidth <= el.clientWidth; });
  const page = await openApp({ width: 320, sessions: abc() });
  await openPick(page);
  assert.equal(await fits(page), true);
  await page.fill('#exSearch', 'An exercise with a very long name, forty');
  await page.click('[data-act="exNew"]');
  assert.equal(await page.inputValue('#newName'), 'An exercise with a very long name, forty');
  assert.equal(await fits(page), true);
});
