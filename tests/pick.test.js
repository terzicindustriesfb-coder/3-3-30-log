const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');
const { closeAll, session, first, abc, txt, texts } = h;
/* Workout A, B and C as three buttons on the home screen. Every profile here has turns switched on.
   The day is Wednesday 14 October; that week began on Monday 12 October. */
const profile = over => h.profile(Object.assign({ rotate: true }, over));
const openApp = opts => h.openApp(Object.assign({ profile: profile() }, opts));
after(closeAll);

const pressed = page => page.locator('#view .tp[aria-pressed="true"]').evaluateAll(els => els.map(e => e.dataset.tpl));

test('the three workouts are buttons under the title, each with the day it was last done', async () => {
  const page = await openApp({ sessions: abc() });                 // A on Mon 5 Oct, B on Wed 7 Oct, C on Mon 12 Oct
  assert.equal(await txt(page, '#view .title'), 'Today: Workout A');
  assert.deepEqual(await texts(page, '#view .head .tp'), ['Workout A last done Mon 5 Oct', 'Workout B last done Wed 7 Oct', 'Workout C done this week, Mon 12 Oct']);
  assert.deepEqual(await pressed(page), ['A']);                    // after C comes A
  assert.deepEqual(await page.locator('#view .tp').evaluateAll(els => els.map(e => !!e.querySelector('svg'))), [false, false, true]);   // the tick: done this week
});
test('a workout that was never done says First time', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-09', 'C', [0, 0, 0])] });   // a C on Fri 9 Oct in which nothing was done
  assert.deepEqual(await texts(page, '#view .tp'), ['Workout A last done Mon 5 Oct', 'Workout B First time', 'Workout C First time']);
  assert.deepEqual(await pressed(page), ['B']);
});
test('a tap on another workout puts its exercises and its scores on the cards, and focus stays on that button', async () => {
  const page = await openApp({ sessions: abc() });
  await page.click('#view .tp[data-tpl="B"]');
  assert.equal(await txt(page, '#view .title'), 'Today: Workout B');
  assert.deepEqual(await pressed(page), ['B']);
  assert.deepEqual(await texts(page, '.xc .ex-n'), ['Seated dumbbell shoulder press', 'Pull-ups', 'Dumbbell Romanian deadlift']);
  assert.deepEqual(await texts(page, '.xc .goal-n'), ['30', '8', '40']);          // what Workout B scored on Wed 7 Oct
  assert.equal(await page.evaluate(() => document.activeElement.dataset.tpl), 'B');
});
test('Change on a card of the picked workout changes that workout’s exercise', async () => {
  const page = await openApp({ sessions: abc() });                 // A is next in line
  await page.click('#view .tp[data-tpl="C"]');
  await page.click('.xc[data-slot="pull"] [data-act="editEx"]');
  assert.equal(await txt(page, '[data-sheet="ex"] .sheet-head .eyebrow'), 'Pull · Workout C');
});
test('the picked workout is the one that is stored, and the buttons are gone while a card is open and after', async () => {
  const page = await openApp({ sessions: abc(), prefs: { sound: false, lead: false } });
  await page.click('#view .tp[data-tpl="C"]');
  await page.click('.xc[data-slot="push"] [data-act="start"]');
  assert.equal(await page.locator('#view .tp').count(), 0);
  await page.click('.xc .pad [data-act="set"][data-n="10"]');
  await h.forward(page, 600);
  await page.waitForFunction(() => R.saved === 'saved');
  await page.click('.xc [data-act="cardDone"]');
  assert.equal(await page.evaluate(() => todaySession().tpl), 'C');
  assert.equal(await txt(page, '#view .title'), 'Two to go');
  assert.equal(await page.locator('#view .tp').count(), 0);
  assert.deepEqual(await texts(page, '.xc .ex-n'), ['Incline dumbbell press', 'Pendlay row', 'Dumbbell reverse lunge']);
});
test('with the same three every workout there are no workout buttons', async () => {
  const page = await openApp({ sessions: abc(), profile: profile({ rotate: false }) });
  assert.equal(await txt(page, '#view .title'), 'Today: 3 exercises');
  assert.equal(await page.locator('#view .tp').count(), 0);
});
test('on a 320 px screen the three buttons share one row and show the whole day', async () => {
  const page = await openApp({ width: 320, profile: profile({ start: '2026-09-28' }), sessions: [session('2026-09-30', 'B', [30, 8, 40]), first(), session('2026-10-12', 'C', [40, 40, 40])] });
  assert.deepEqual(await texts(page, '#view .tp .tp-d'), ['last done Mon 5 Oct', 'last done Wed 30 Sept', 'done this week, Mon 12 Oct']);   // en-GB writes September as Sept
  const boxes = await page.locator('#view .tp').evaluateAll(els => els.map(e => e.getBoundingClientRect()).map(r => [Math.round(r.top), r.left >= 0 && r.right <= innerWidth]));
  assert.equal(new Set(boxes.map(b => b[0])).size, 1);
  assert.deepEqual(boxes.map(b => b[1]), [true, true, true]);
  assert.deepEqual(await page.locator('#view .tp-d').evaluateAll(els => els.map(e => e.scrollWidth <= e.clientWidth)), [true, true, true]);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
});

/* After today's workout is done, the next one can be picked and started the same day. */
const doneToday = () => [...abc(), session('2026-10-14', 'A', [70, 80, 90], { hm: '08:00' })];   // A, B, C as before, and A done this morning
const forms = page => page.locator('#view .xc').evaluateAll(els => els.map(e => e.dataset.slot + ':' + e.dataset.form));

test('after today’s workout is done the three workouts show again, with today’s pressed', async () => {
  const page = await openApp({ sessions: doneToday() });
  assert.equal(await txt(page, '#view .title'), 'Done for today');
  assert.deepEqual(await forms(page), ['push:done', 'pull:done', 'legs:done']);
  assert.deepEqual(await texts(page, '#view .head .tp'), ['Workout A done this week, Wed 14 Oct', 'Workout B last done Wed 7 Oct', 'Workout C done this week, Mon 12 Oct']);
  assert.deepEqual(await pressed(page), ['A']);
  const same = await openApp({ sessions: doneToday(), profile: profile({ rotate: false }) });
  assert.equal(await same.locator('#view .tp').count(), 0);
});
test('a tap on the next workout shows it to start, and a tap on today’s shows today again', async () => {
  const page = await openApp({ sessions: doneToday() });
  await page.click('#view .tp[data-tpl="B"]');                    // B is also next in line after A
  assert.equal(await txt(page, '#view .title'), 'Today: Workout B');
  assert.deepEqual(await pressed(page), ['B']);
  assert.deepEqual(await forms(page), ['push:todo', 'pull:todo', 'legs:todo']);
  assert.deepEqual(await texts(page, '.xc .ex-n'), ['Seated dumbbell shoulder press', 'Pull-ups', 'Dumbbell Romanian deadlift']);
  assert.equal(await txt(page, '.wkc-row.me .wkc-n'), '2 of 3 workouts');
  await page.click('#view .tp[data-tpl="A"]');
  assert.equal(await txt(page, '#view .title'), 'Done for today');
  assert.deepEqual(await forms(page), ['push:done', 'pull:done', 'legs:done']);
  assert.deepEqual(await pressed(page), ['A']);
});
test('the next workout of the day is stored as a second workout and counts in the week', async () => {
  const page = await openApp({ sessions: doneToday(), prefs: { sound: false, lead: false } });
  await page.click('#view .tp[data-tpl="C"]');
  await page.click('.xc[data-slot="push"] [data-act="start"]');
  await page.click('.xc .pad [data-act="set"][data-n="10"]');
  await h.forward(page, 600);
  await page.waitForFunction(() => R.saved === 'saved');
  await page.click('.xc [data-act="cardDone"]');
  assert.deepEqual(await page.evaluate(() => sessionsOf(S.uid).filter(s => s.date === '2026-10-14').map(s => [s.tpl, s.blocks.map(b => b.total)])), [['A', [70, 80, 90]], ['C', [10, 0, 0]]]);
  assert.equal(await txt(page, '#view .title'), 'Two to go');
  assert.deepEqual(await texts(page, '.xc .ex-n'), ['Incline dumbbell press', 'Pendlay row', 'Dumbbell reverse lunge']);
  assert.equal(await page.locator('#view .tp').count(), 0);
  assert.equal(await txt(page, '.wkc-row.me .wkc-n'), '3 of 3 workouts');
});
