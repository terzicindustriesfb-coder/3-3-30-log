const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at, forward, jumpTo } = require('./helpers');
after(closeAll);

const QUIET = { sound: false, lead: false };
const start = (page, slot = 'push') => page.click(`.xc[data-slot="${slot}"] [data-act="start"]`);
const tap = async (page, ...reps) => { for (const n of reps) await page.click(`.xc .pad [data-act="set"][data-n="${n}"]`); };
const forms = page => page.locator('#view .xc').evaluateAll(els => els.map(e => e.dataset.slot + ':' + e.dataset.form));
const clock = async page => [await page.locator('.clockbtn').getAttribute('data-phase'), await page.locator('.clockbtn').getAttribute('data-left'), await txt(page, '.clockbtn .status')];
const reload = async page => { await page.reload(); await page.waitForFunction(() => !document.querySelector('#view .skeleton')); };
const noDraft = page => page.waitForFunction(() => localStorage.getItem(DRAFT_KEY()) === null && !R.session);
/* A working copy as the app keeps it while a card is open: nothing done, `sets` tapped in the exercise at `idx`. */
const working = (date, idx, sets, id = 'w1') => {
  const s = session(date, 'A', [0, 0, 0], { id, status: 'active' });
  Object.assign(s.blocks[idx], { skipped: false, sets: sets.map((r, i) => ({ r, kg: s.blocks[idx].kg, t: 30 + i * 40 })) });
  return s;
};
const draftOf = (sess, idx, over) => Object.assign({ session: sess, idx, phase: 'run', t0: 0, leadEnd: 0, pausedAt: 0, pausedMs: 0, saved: null }, over);

test('a reload while the clock runs opens the same card with the clock still running', async () => {
  const page = await openApp({ sessions: [first()], prefs: QUIET });
  await start(page, 'pull');
  await tap(page, 8, 8);
  await forward(page, 100);
  await reload(page);
  assert.deepEqual(await forms(page), ['push:wait', 'pull:open', 'legs:wait']);
  assert.deepEqual(await clock(page), ['run', '08:20', 'Tap to pause or stop']);
  assert.equal(await txt(page, '.xc-total'), '16 reps so far');
  await forward(page, 500);
  await page.waitForFunction(() => R.saved === 'saved');
  assert.equal(await page.evaluate(() => todaySession().blocks[1].total), 16);
});
test('on pause the time stands still, also across a reload', async () => {
  const page = await openApp({ sessions: [first()], prefs: QUIET });
  await start(page);
  await forward(page, 100);
  await page.click('.clockbtn');
  await forward(page, 3600);
  await reload(page);
  assert.deepEqual(await clock(page), ['paused', '08:20', 'Paused · tap to go on']);
  await page.click('.clockbtn');
  await forward(page, 20);
  assert.deepEqual(await clock(page), ['run', '08:00', 'Tap to pause or stop']);
});
test('a reload after the bell shows the result again', async () => {
  const page = await openApp({ sessions: [first()], prefs: QUIET });
  await start(page);
  await tap(page, 20);
  await forward(page, 600);
  await page.waitForFunction(() => R.saved === 'saved');
  await reload(page);
  assert.deepEqual(await forms(page), ['push:open', 'pull:wait', 'legs:wait']);
  assert.deepEqual([await txt(page, '.xc-result .xc-big'), await txt(page, '.xc-saved')], ['20 reps', 'Your score is saved. Last set not in yet? Tap it now.']);
  await page.click('.xc [data-act="cardDone"]');
  assert.deepEqual(await forms(page), ['push:done', 'pull:todo', 'legs:todo']);
});
test('a reload during the countdown puts the card back', async () => {
  const page = await openApp({ sessions: [first()], prefs: { sound: false, lead: true } });
  await start(page);
  await forward(page, 3);
  await reload(page);
  await noDraft(page);
  assert.deepEqual(await forms(page), ['push:todo', 'pull:todo', 'legs:todo']);
});
test('a clock that ran out while the app was closed: the time is up and the sets are stored', async () => {
  const d = draftOf(working('2026-10-14', 1, [8, 8, 7]), 1, { t0: at('2026-10-14', '09:00') });      // started an hour ago
  const page = await openApp({ sessions: [first()], prefs: QUIET, draft: d });
  await page.waitForFunction(() => R.saved === 'saved');
  assert.deepEqual([await txt(page, '.xc-result .eyebrow'), await txt(page, '.xc-result .xc-big')], ['Time is up', '23 reps']);
  assert.deepEqual(await page.evaluate(() => { const b = todaySession().blocks[1]; return [b.total, b.dur, b.cut]; }), [23, 600, false]);
});
test('coming back to the app after the ten minutes shows the same, without a reload', async () => {
  const page = await openApp({ sessions: [first()], prefs: QUIET });
  await start(page, 'pull');
  await tap(page, 8, 8, 7);
  await jumpTo(page, '2026-10-14', '11:00');
  await page.waitForFunction(() => R.saved === 'saved');
  assert.deepEqual([await txt(page, '.xc-result .eyebrow'), await txt(page, '.xc-result .xc-big')], ['Time is up', '23 reps']);
});
test('a score that could not be stored is tried again on the next visit', async () => {
  const w = working('2026-10-14', 0, [20, 20]);
  Object.assign(w.blocks[0], { total: 40, done: true, dur: 600 });
  const page = await openApp({ sessions: [first()], prefs: QUIET, draft: draftOf(w, 0, { phase: 'over', saved: 'failed' }) });
  await page.waitForFunction(() => R.saved === 'saved');
  assert.equal(await page.evaluate(() => todaySession().blocks[0].total), 40);
});
test('a card left open on an earlier day is closed: its reps count for that day, as stopped early', async () => {
  const d = draftOf(working('2026-10-13', 1, [8, 8, 7]), 1, { phase: 'paused', t0: at('2026-10-13', '18:00'), pausedAt: at('2026-10-13', '18:04') });
  const page = await openApp({ sessions: [first()], prefs: QUIET, draft: d });
  await noDraft(page);
  assert.deepEqual(await forms(page), ['push:todo', 'pull:todo', 'legs:todo']);
  const b = await page.evaluate(() => { const s = me().sessions.get('w1'); const x = s.blocks[1]; return [s.date, s.status, x.total, x.dur, x.cut, x.done, s.blocks[0].done, s.blocks[0].skipped]; });
  assert.deepEqual(b, ['2026-10-13', 'done', 23, 240, true, true, false, true]);
  assert.equal(await page.evaluate(() => refBlock(scoresOf(S.uid, 'kabelroeien')).total), 77);       // stopped early: not the next score to beat
});
test('an earlier-day card whose clock ran out counts as a full score, and one without reps is dropped', async () => {
  const full = await openApp({ sessions: [first()], prefs: QUIET, draft: draftOf(working('2026-10-13', 1, [8, 8, 7]), 1, { t0: at('2026-10-13', '18:00') }) });
  await noDraft(full);
  assert.deepEqual(await full.evaluate(() => { const x = me().sessions.get('w1').blocks[1]; return [x.total, x.dur, x.cut]; }), [23, 600, false]);
  const empty = await openApp({ sessions: [first()], prefs: QUIET, draft: draftOf(working('2026-10-13', 1, []), 1, { phase: 'paused', t0: at('2026-10-13', '18:00'), pausedAt: at('2026-10-13', '18:04') }) });
  await noDraft(empty);
  assert.equal(await empty.evaluate(() => sessionsOf(S.uid).length), 1);
});
test('a workout left open by the old version: what is done counts, the rest is dropped', async () => {
  const old = session('2026-10-12', 'A', [62, 0, 0], { id: 'old1', status: 'active' });          // exercise 1 done, exercise 2 was up next
  const page = await openApp({ sessions: [first()], draft: old });
  await noDraft(page);
  assert.deepEqual(await page.evaluate(() => { const s = me().sessions.get('old1'); return [s.status, s.blocks.map(b => b.done)]; }), ['done', [true, false, false]]);
  assert.deepEqual(await forms(page), ['push:todo', 'pull:todo', 'legs:todo']);
});
for (const crew of [null, []]) {
  test(`an old copy never overwrites what is stored (${crew ? 'shared log' : 'this device'})`, async () => {
    const old = session('2026-10-12', 'A', [62, 0, 0], { id: 'old1', status: 'active' });
    const stored = session('2026-10-12', 'A', [64, 77, 0], { id: 'old1' });                      // changed and finished further somewhere else
    const page = await openApp({ crew, sessions: [first(), stored], draft: old });
    await noDraft(page);
    assert.deepEqual(await page.evaluate(() => me().sessions.get('old1').blocks.map(b => b.total)), [64, 77, 0]);
  });
}
test('an old open workout of today opens as a card in the same state', async () => {
  const old = session('2026-10-14', 'A', [62, 0, 0], { id: 'old1', status: 'active' });
  Object.assign(old.blocks[1], { skipped: false, sets: [{ r: 8, kg: 65, t: 30 }] });
  const d = draftOf(old, 1, { phase: 'paused', t0: at('2026-10-14', '09:50'), pausedAt: at('2026-10-14', '09:52') });
  const page = await openApp({ sessions: [first()], prefs: QUIET, draft: d });
  assert.deepEqual(await forms(page), ['push:done', 'pull:open', 'legs:wait']);
  assert.deepEqual(await clock(page), ['paused', '08:00', 'Paused · tap to go on']);
  assert.equal(await txt(page, '.xc-total'), '8 reps so far');
});
test('the next morning the home screen starts clean without a reload', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-14', 'A', [68, 77, 80])] });
  assert.equal(await txt(page, '#view .title'), 'Done for today');
  await jumpTo(page, '2026-10-15', '07:00');
  await page.waitForFunction(() => document.querySelector('#view .title').textContent === 'Today: 3 exercises');
  assert.equal(await txt(page, '.top #dateText'), 'Thu 15 Oct · this device only');
  assert.equal(await txt(page, '.wkc-row.me .wkc-n'), '1 of 3 workouts');
});
test('a card left on pause overnight is closed in the morning, with its reps on the day before', async () => {
  const page = await openApp({ time: '23:50', sessions: [first()], prefs: QUIET });
  await start(page, 'pull');
  await tap(page, 8, 8);
  await forward(page, 120);
  await page.click('.clockbtn');
  await jumpTo(page, '2026-10-15', '07:00');
  await noDraft(page);
  assert.deepEqual(await forms(page), ['push:todo', 'pull:todo', 'legs:todo']);
  assert.deepEqual(await page.evaluate(() => { const b = sessionsOf(S.uid).find(x => x.date === '2026-10-14').blocks[1]; return [b.total, b.dur, b.cut]; }), [16, 120, true]);
});
test('a clock that runs past midnight finishes, and the score belongs to the day it started', async () => {
  const page = await openApp({ time: '23:55', sessions: [first()], prefs: QUIET });
  await start(page, 'pull');
  await tap(page, 8, 8);
  await jumpTo(page, '2026-10-15', '00:01');                               // six minutes in, the app comes back into view
  assert.deepEqual(await clock(page), ['run', '04:00', 'Tap to pause or stop']);
  await forward(page, 240);
  await page.waitForFunction(() => R.saved === 'saved');
  await page.click('.xc [data-act="cardDone"]');
  assert.deepEqual(await forms(page), ['push:todo', 'pull:todo', 'legs:todo']);                   // a new day
  assert.equal(await page.evaluate(() => sessionsOf(S.uid).find(x => x.date === '2026-10-14').blocks[1].total), 16);
});
