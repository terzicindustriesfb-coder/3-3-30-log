const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at, forward, breakSaving, mendSaving } = require('./helpers');
after(closeAll);

const QUIET = { sound: false, lead: false };
const start = (page, slot = 'push') => page.click(`.xc[data-slot="${slot}"] [data-act="start"]`);
const tap = async (page, ...reps) => { for (const n of reps) await page.click(`.xc .pad [data-act="set"][data-n="${n}"]`); };
const forms = page => page.locator('#view .xc').evaluateAll(els => els.map(e => e.dataset.slot + ':' + e.dataset.form));
const clock = async page => [await page.locator('.clockbtn').getAttribute('data-phase'), await page.locator('.clockbtn').getAttribute('data-left'), await txt(page, '.clockbtn .status')];
const result = async page => [await txt(page, '.xc-result .eyebrow'), await txt(page, '.xc-result .xc-big'), await txt(page, '.xc-result .xc-verdict')];
const saved = page => page.waitForFunction(() => R.saved === 'saved');
const open = '.xc[data-form="open"] ';

test('Start turns the button into the clock and the other cards into one line', async () => {
  const page = await openApp({ sessions: [first()], prefs: QUIET });
  await start(page, 'pull');
  assert.deepEqual(await forms(page), ['push:wait', 'pull:open', 'legs:wait']);
  assert.deepEqual(await clock(page), ['run', '10:00', 'Tap to pause or stop']);
  assert.equal(await page.locator('#view .title, #view .hint, #view .wkc, #view .home-nav').count(), 0);
  const wait = '.xc[data-slot="push"] ';
  assert.deepEqual([await txt(page, wait + '.ex-n'), await txt(page, wait + '.xc-sub'), await txt(page, wait + '.xc-goal')], ['Overhead press', 'Push · 35 kg · still to do', 'To beat 62']);
  assert.equal(await page.locator('.xc[data-form="wait"] button').count(), 0);
  assert.deepEqual([await txt(page, open + '.xc-grp'), await txt(page, open + '.ex-n'), await txt(page, open + '.ex-kg'), await txt(page, open + '.goal-n')], ['Pull', 'Seated cable row', '65 kg', '77']);
  assert.deepEqual([await txt(page, '.xc-total'), await txt(page, '.xc-how')], ['0 reps so far', 'After each set, tap how many reps you did.']);
  assert.equal(await page.locator(open + '.pad [data-act="set"]').count(), 20);
  assert.deepEqual(await page.evaluate(() => [document.activeElement.dataset.act, scrollY]), ['clock', 0]);
  await forward(page, 198);
  assert.deepEqual(await clock(page), ['run', '06:42', 'Tap to pause or stop']);
});
test('each tap on the pad is a set, and Undo takes the last one back', async () => {
  const page = await openApp({ sessions: [first()], prefs: QUIET });
  await start(page, 'pull');
  assert.equal(await page.locator('.xc-sets, .xc [data-act="undo"]').count(), 0);
  await tap(page, 8, 8, 7);
  assert.deepEqual([await txt(page, '.xc-total'), await txt(page, '.xc-sets'), await txt(page, '.xc [data-act="undo"]')], ['23 reps so far', 'Your sets: 8 8 7', 'Undo last set']);
  assert.equal(await page.locator('.pad [data-n="7"].last').count(), 1);
  await page.click('.xc [data-act="undo"]');
  assert.deepEqual([await txt(page, '.xc-total'), await txt(page, '.xc-sets')], ['16 reps so far', 'Your sets: 8 8']);
  assert.equal(await page.evaluate(() => todaySession()), null);            // nothing is stored before the bell
});
test('past the score to beat it says so next to the total', async () => {
  const page = await openApp({ sessions: [session('2026-10-05', 'A', [20, 20, 20])], prefs: QUIET });
  await start(page);
  await tap(page, 20);
  assert.equal(await page.locator('.xc-past').count(), 0);
  await tap(page, 1);
  assert.equal(await txt(page, '.xc-past'), '✓ Past last time (20)');
});
test('with Countdown on the button counts down from 10, and a tap starts at once', async () => {
  const page = await openApp({ sessions: [first()], prefs: { sound: false, lead: true } });
  await start(page);
  assert.deepEqual(await clock(page), ['lead', '10', 'Get ready · tap to start now']);
  assert.equal(await txt(page, '.xc [data-act="cancelLead"]'), 'Cancel');
  assert.equal(await page.locator('.xc .pad.off').count(), 1);
  assert.equal(await page.locator('.xc-score, .xc-how').count(), 0);
  await forward(page, 4);
  assert.deepEqual(await clock(page), ['lead', '6', 'Get ready · tap to start now']);
  await page.click('.clockbtn');
  assert.deepEqual(await clock(page), ['run', '10:00', 'Tap to pause or stop']);
  assert.equal(await page.locator('.xc .pad.off, .xc [data-act="cancelLead"]').count(), 0);
});
test('the countdown starts the clock by itself after ten seconds', async () => {
  const page = await openApp({ sessions: [first()], prefs: { sound: false, lead: true } });
  await start(page);
  await forward(page, 10);
  assert.deepEqual(await clock(page), ['run', '10:00', 'Tap to pause or stop']);
});
test('Cancel closes the card and nothing has happened', async () => {
  const page = await openApp({ sessions: [first()], prefs: { sound: false, lead: true } });
  await start(page, 'legs');
  await page.click('.xc [data-act="cancelLead"]');
  assert.deepEqual(await forms(page), ['push:todo', 'pull:todo', 'legs:todo']);
  assert.deepEqual(await page.evaluate(() => [R.session, localStorage.getItem(DRAFT_KEY()), todaySession(), document.activeElement.dataset.slot]), [null, null, null, 'legs']);
});
test('a tap on the clock pauses it, another tap goes on, and the time stands still in between', async () => {
  const page = await openApp({ sessions: [first()], prefs: QUIET });
  await start(page);
  await forward(page, 100);
  await page.click('.clockbtn');
  assert.deepEqual(await clock(page), ['paused', '08:20', 'Paused · tap to go on']);
  assert.equal(await page.locator('.xc-how').count(), 0);
  await forward(page, 300);
  assert.deepEqual(await clock(page), ['paused', '08:20', 'Paused · tap to go on']);
  await tap(page, 5);                                                       // a set can be logged on pause
  assert.equal(await txt(page, '.xc-total'), '5 reps so far');
  await page.click('.clockbtn');
  await forward(page, 20);
  assert.deepEqual(await clock(page), ['run', '08:00', 'Tap to pause or stop']);
});
test('a double tap on Start does not pause the clock', async () => {
  const page = await openApp({ sessions: [first()], prefs: QUIET });
  await start(page);
  await page.click('.clockbtn');                                            // the second tap lands where Start was
  assert.equal((await clock(page))[0], 'run');
  await forward(page, 1);
  await page.click('.clockbtn');
  assert.equal((await clock(page))[0], 'paused');
});
test('at 0:00 the score is stored and the card shows the result', async () => {
  const page = await openApp({ sessions: [first()], prefs: QUIET });
  await start(page, 'pull');
  await tap(page, 20, 20, 20, 20);
  await forward(page, 600);
  await saved(page);
  assert.equal(await page.locator('.clockbtn, .xc-score').count(), 0);
  assert.deepEqual(await result(page), ['Time is up', '80 reps', '▲ 3 more than last time']);
  assert.equal(await page.locator('.xc-result.good').count(), 1);
  assert.equal(await txt(page, '.xc-saved'), 'Your score is saved. Last set not in yet? Tap it now.');
  assert.equal(await txt(page, '.xc [data-act="cardDone"]'), 'Done');
  const b = await page.evaluate(() => { const t = todaySession(); const x = t.blocks[1]; return [t.status, x.ex, x.kg, x.total, x.dur, x.cut, x.done, x.sets.map(s => s.r)]; });
  assert.deepEqual(b, ['done', 'kabelroeien', 65, 80, 600, false, true, [20, 20, 20, 20]]);
  assert.deepEqual(await forms(page), ['push:wait', 'pull:open', 'legs:wait']);
});
test('a last set after the bell is stored too, and so is taking one back', async () => {
  const page = await openApp({ sessions: [first()], prefs: QUIET });
  await start(page, 'pull');
  await tap(page, 20, 20, 20);
  await forward(page, 600);
  await saved(page);
  await tap(page, 18);
  await page.waitForFunction(() => todaySession().blocks[1].total === 78);
  assert.deepEqual(await result(page), ['Time is up', '78 reps', '▲ 1 more than last time']);
  await page.click('.xc [data-act="undo"]');
  await page.click('.xc [data-act="undo"]');
  await page.waitForFunction(() => todaySession().blocks[1].total === 40);
  assert.deepEqual([(await result(page))[2], await page.locator('.xc-result.good').count()], ['▼ 37 fewer than last time', 0]);
});
test('Done closes the card: it is done and the next Start has the focus', async () => {
  const page = await openApp({ sessions: [first()], prefs: QUIET });
  await start(page, 'pull');
  await tap(page, 20, 20, 20, 20);
  await forward(page, 600);
  await saved(page);
  await page.click('.xc [data-act="cardDone"]');
  assert.deepEqual(await forms(page), ['push:todo', 'pull:done', 'legs:todo']);
  assert.deepEqual([await txt(page, '.xc[data-slot="pull"] .goal-n'), await txt(page, '.xc[data-slot="pull"] .xc-verdict'), await txt(page, '#view .title')], ['80', '▲ 3 more', 'Two to go']);
  assert.deepEqual(await page.evaluate(() => [document.activeElement.dataset.act, document.activeElement.dataset.slot, R.session, localStorage.getItem(DRAFT_KEY())]), ['start', 'push', null, null]);
});
test('after the third exercise the focus goes to the title', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-14', 'A', [68, 77, 0])], prefs: QUIET });
  await start(page, 'legs');
  await tap(page, 20);
  await forward(page, 600);
  await saved(page);
  await page.click('.xc [data-act="cardDone"]');
  assert.equal(await txt(page, '#view .title'), 'Done for today');
  assert.equal(await page.evaluate(() => document.activeElement.classList.contains('title')), true);
});
test('the weight of the score becomes the set weight', async () => {
  const page = await openApp({ profile: profile({ weights: {} }), prefs: QUIET });       // no set weights: the cards show the start weights
  assert.equal(await txt(page, '.xc[data-slot="push"] .ex-kg'), '25 kg');
  await start(page);
  await tap(page, 9);
  await forward(page, 600);
  await page.waitForFunction(() => myProfile().weights.schouderdrukken === 25);
});
test('the exercise and the weight are fixed when you tap Start', async () => {
  const page = await openApp({ sessions: [first()], prefs: QUIET });
  await start(page, 'pull');
  await page.evaluate(async () => { const p = clone(myProfile()); p.weights.kabelroeien = 70; p.plans.A.pull = 'lat-pulldown'; await saveProfile(p); });
  await tap(page, 10);
  await forward(page, 600);
  await saved(page);
  assert.deepEqual(await page.evaluate(() => { const b = todaySession().blocks[1]; return [b.ex, b.kg]; }), ['kabelroeien', 65]);
});
test('no reps: nothing is stored and Done puts the card back', async () => {
  const page = await openApp({ sessions: [first()], prefs: QUIET });
  await start(page);
  await forward(page, 600);
  assert.deepEqual(await result(page), ['Time is up', '0 reps', 'No reps logged.']);
  assert.equal(await page.locator('.xc-saved, .xc-result.good').count(), 0);
  assert.equal(await page.evaluate(() => todaySession()), null);
  await page.click('.xc [data-act="cardDone"]');
  assert.deepEqual(await forms(page), ['push:todo', 'pull:todo', 'legs:todo']);
  assert.deepEqual(await page.evaluate(() => [sessionsOf(S.uid).length, document.activeElement.dataset.slot]), [1, 'push']);
});
test('taking back the only set after the bell removes the score again', async () => {
  const page = await openApp({ sessions: [first()], prefs: QUIET });
  await start(page);
  await tap(page, 5);
  await forward(page, 600);
  await saved(page);
  await page.click('.xc [data-act="undo"]');
  await page.waitForFunction(() => todaySession() === null && R.saved === null);
  assert.equal((await result(page))[2], 'No reps logged.');
  const two = await openApp({ sessions: [first(), session('2026-10-14', 'A', [68, 0, 0], { id: 't1' })], prefs: QUIET });
  await start(two, 'pull');
  await tap(two, 5);
  await forward(two, 600);
  await saved(two);
  await two.click('.xc [data-act="undo"]');
  await two.waitForFunction(() => todaySession().blocks[1].done === false && R.saved === null);
  assert.deepEqual(await two.evaluate(() => [todaySession().id, todaySession().blocks[0].total]), ['t1', 68]);      // the other exercise stays
});
test('while the score is on its way it says Saving…', async () => {
  const page = await openApp({ crew: [], sessions: [first()], prefs: QUIET });
  await start(page);
  await tap(page, 20);
  await page.evaluate(() => { const real = S.db.doc.bind(S.db); S.db.doc = p => { const d = real(p); return Object.assign({}, d, { set: v => new Promise(res => { window.__release = () => d.set(v).then(res); }) }); }; });
  await forward(page, 600);
  await page.waitForFunction(() => R.saved === 'saving');
  assert.equal(await txt(page, '.xc-saved'), 'Saving…');
  await page.evaluate(() => window.__release());
  await saved(page);
  assert.equal(await txt(page, '.xc-saved'), 'Your score is saved. Last set not in yet? Tap it now.');
});
test('when storing fails the card stays open and Done tries again', async () => {
  const page = await openApp({ crew: [], sessions: [first()], prefs: QUIET });
  await start(page);
  await tap(page, 20, 20);
  await breakSaving(page);
  await forward(page, 600);
  await page.waitForFunction(() => R.saved === 'failed');
  assert.equal(await txt(page, '.xc-saved'), 'Not saved yet. Tap Done to try again.');
  assert.equal(await page.locator('#toast').isHidden(), true);
  await page.click('.xc [data-act="cardDone"]');
  await page.waitForFunction(() => window.__writes === 2 && R.saved === 'failed');
  assert.deepEqual(await forms(page), ['push:open', 'pull:wait', 'legs:wait']);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem(DRAFT_KEY())).session.blocks[0].sets.length), 2);      // safe on this device
  await mendSaving(page);
  await page.click('.xc [data-act="cardDone"]');
  await page.waitForFunction(() => !R.session);
  assert.deepEqual(await forms(page), ['push:done', 'pull:todo', 'legs:todo']);
});
test('when the shared log refuses, the score is kept on this device and the notice says so', async () => {
  const page = await openApp({ crew: [], sessions: [first()], prefs: QUIET });
  await start(page);
  await tap(page, 20);
  await page.evaluate(() => { S.db.doc = () => ({ get: async () => ({ exists: false }), set: async () => { throw Object.assign(new Error('no'), { code: 'not_granted' }); }, delete: async () => {} }); });
  await forward(page, 600);
  await saved(page);
  assert.equal(await page.evaluate(() => S.ownLocal), true);
  assert.match(await txt(page, '#notice'), /kept on this device/);
});
test('while a card is open nothing else can be started or opened', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-14', 'A', [68, 0, 0])], prefs: QUIET });
  await start(page, 'pull');
  assert.deepEqual(await forms(page), ['push:done', 'pull:open', 'legs:wait']);
  assert.equal(await page.locator('#view [data-act="start"], #view [data-act="editEx"], #view [data-act="screen"], #view [data-act="fixToday"], #view [data-act="swap"]').count(), 0);
  await page.evaluate(() => { ACT.screen({ dataset: { screen: 'results' } }); ACT.start({ dataset: { slot: 'legs' } }); ACT.fixToday(); });
  assert.deepEqual([await page.evaluate(() => UI.screen), await forms(page), await page.locator('#sheet').isHidden()], ['home', ['push:done', 'pull:open', 'legs:wait'], true]);
});
test('a waiting row reads bodyweight and dumbbell pairs the way you set them', async () => {
  const page = await openApp({ profile: profile({ rotate: true }), sessions: [first()], prefs: QUIET });      // Workout B is next
  await start(page, 'push');
  assert.deepEqual(await texts(page, '.xc[data-form="wait"] .xc-sub'), ['Pull · bodyweight · still to do', 'Legs · 2 × 16 kg · still to do']);
  assert.deepEqual(await texts(page, '.xc[data-form="wait"] .xc-goal'), ['First time', 'First time']);
  assert.equal(await txt(page, open + '.ex-kg'), '2 × 10 kg');
});
test('the beeps are the ones from before, and there are none when Beeps is off', async () => {
  const run = async prefs => {
    const page = await openApp({ sessions: [first()], prefs });
    await start(page);
    await page.evaluate(() => { window.__beeps = []; window.__sounded = 0; const real = beep; window.beep = (f, d, w) => { window.__beeps.push(f); real(f, d, w); }; window.audio = () => { window.__sounded++; return null; }; });
    for (const s of [7, 1, 1, 1, 300, 240, 57, 1, 1, 1]) await forward(page, s);
    return page.evaluate(() => [window.__beeps, window.__sounded]);
  };
  const all = [660, 660, 660, 1175, 880, 880, 880, 660, 660, 660, 988];      // countdown, start, 5 minutes, 1 minute (two), last seconds, the end
  assert.deepEqual(await run({ sound: true, lead: true }), [all, 11]);
  assert.deepEqual(await run({ sound: false, lead: true }), [all, 0]);
});
test('the clock tells a screen reader the minutes left, and the button has a name', async () => {
  const page = await openApp({ sessions: [first()], prefs: QUIET });
  await start(page);
  await forward(page, 60);
  assert.equal(await txt(page, '#clockSr'), '9 minutes left');
  assert.equal(await page.locator('.clockbtn').getAttribute('aria-label'), 'Clock. Tap to pause or stop');
  assert.equal(await page.locator('.pad [data-n="7"]').getAttribute('aria-label'), 'Log a set of 7 reps');
});
test('the open card with its pad fits a 390 × 844 phone, and a 320 px one keeps five keys in a row', async () => {
  const page = await openApp({ sessions: [first()], prefs: QUIET });
  await start(page, 'pull');
  await tap(page, 8, 8, 7);
  assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight), true);
  const long = profile({ names: { kabelroeien: 'Seated cable row with a very long name x' } });
  const small = await openApp({ width: 320, height: 568, sessions: [first()], prefs: QUIET, profile: long });
  await start(small, 'pull');
  assert.equal(await small.evaluate(() => document.documentElement.scrollWidth), 320);
  assert.equal(await small.evaluate(() => new Set([...document.querySelectorAll('.pad [data-act="set"]')].slice(0, 5).map(e => e.getBoundingClientRect().top)).size), 1);
  assert.equal(await small.evaluate(() => document.querySelector('.pad').getBoundingClientRect().bottom <= innerHeight), true);      // the pad is scrolled into view
  assert.equal(await small.evaluate(() => [...document.querySelectorAll('.pad [data-act="set"]')].every(e => e.getBoundingClientRect().height >= 44)), true);
});
test('the browser’s forward button cannot leave an open card, and its step becomes one of the home screen', async () => {
  const page = await openApp({ sessions: [first()], prefs: QUIET });
  await page.click('#view [data-act="screen"][data-screen="results"]');
  await page.goBack();
  await page.waitForFunction(() => UI.screen === 'home' && document.querySelector('#view .home-nav'));
  await start(page);
  await page.goForward();
  await page.waitForFunction(() => history.state === null);      // else a later Back would land on "My results" again
  assert.deepEqual([await page.evaluate(() => UI.screen), await forms(page)], ['home', ['push:open', 'pull:wait', 'legs:wait']]);
});
const pause = async (page, after = 100) => { await forward(page, after); await page.click('.clockbtn'); };

test('on pause there are two ways out, and none while the clock runs', async () => {
  const page = await openApp({ sessions: [first()], prefs: QUIET });
  await start(page, 'pull');
  assert.equal(await page.locator('.xc-stop').count(), 0);
  await pause(page);
  assert.deepEqual(await texts(page, '.xc-stop .btn'), ['Stop and save', 'Throw away']);
  assert.equal(await page.evaluate(() => [...document.querySelectorAll('.xc-stop .btn')].every(e => e.getBoundingClientRect().height >= 44)), true);
  await forward(page, 1);
  await page.click('.clockbtn');
  assert.equal(await page.locator('.xc-stop').count(), 0);
});
test('Stop and save keeps the reps as a score that stopped early', async () => {
  const page = await openApp({ sessions: [first()], prefs: QUIET });
  await start(page, 'pull');
  await tap(page, 20, 20, 20, 20);
  await pause(page, 240);
  await page.click('.xc [data-act="stopSave"]');
  await saved(page);
  assert.deepEqual(await result(page), ['Stopped early', '80 reps', 'It counts, but it is not your next score to beat.']);
  assert.equal(await page.locator('.xc-result.good').count(), 0);
  assert.deepEqual(await page.evaluate(() => { const b = todaySession().blocks[1]; return [b.total, b.dur, b.cut]; }), [80, 240, true]);
  await page.click('.xc [data-act="cardDone"]');
  assert.deepEqual([await txt(page, '.xc[data-slot="pull"] .goal-n'), await txt(page, '.xc[data-slot="pull"] .xc-verdict')], ['80', 'stopped early']);
  assert.equal(await page.evaluate(() => refBlock(scoresOf(S.uid, 'kabelroeien')).total), 77);       // the score to beat is still the full one
});
test('without reps there is nothing to stop and save', async () => {
  const page = await openApp({ sessions: [first()], prefs: QUIET });
  await start(page);
  await pause(page);
  await page.click('.xc [data-act="stopSave"]');
  assert.equal(await txt(page, '#toast'), 'Nothing to save yet.');
  assert.equal((await clock(page))[0], 'paused');
});
test('Throw away asks for a second tap, then the attempt is gone', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-14', 'A', [68, 0, 0], { id: 't1' })], prefs: QUIET });
  await start(page, 'pull');
  await tap(page, 8, 8);
  await pause(page);
  await page.click('.xc [data-act="throwAway"]');
  assert.equal(await txt(page, '.xc [data-act="throwAway"]'), 'Tap again to throw away');
  assert.deepEqual(await forms(page), ['push:done', 'pull:open', 'legs:wait']);
  await page.click('.xc [data-act="throwAway"]');
  assert.deepEqual(await forms(page), ['push:done', 'pull:todo', 'legs:todo']);
  assert.deepEqual(await page.evaluate(() => [R.session, localStorage.getItem(DRAFT_KEY()), todaySession().id, todaySession().blocks[1].done, document.activeElement.dataset.slot]), [null, null, 't1', false, 'pull']);
});
test('the second tap has to come within three and a half seconds', async () => {
  const page = await openApp({ sessions: [first()], prefs: QUIET });
  await start(page);
  await pause(page);
  await page.click('.xc [data-act="throwAway"]');
  await page.waitForFunction(() => document.querySelector('.xc [data-act="throwAway"]').textContent.trim() === 'Throw away', null, { timeout: 6000 });
  await page.click('.xc [data-act="throwAway"]');
  assert.equal(await txt(page, '.xc [data-act="throwAway"]'), 'Tap again to throw away');
  assert.equal((await clock(page))[0], 'paused');
});
test('after throwing away, the weight can be changed and the exercise started again', async () => {
  const page = await openApp({ sessions: [first()], prefs: QUIET });
  await start(page, 'pull');
  await pause(page);
  await page.click('.xc [data-act="throwAway"]');
  await page.click('.xc [data-act="throwAway"]');
  await page.evaluate(async () => { const p = clone(myProfile()); p.weights.kabelroeien = 70; await saveProfile(p); });
  await page.waitForFunction(() => /70/.test(document.querySelector('.xc[data-slot="pull"] .ex-kg').textContent));
  await start(page, 'pull');
  assert.deepEqual([await txt(page, open + '.ex-kg'), await txt(page, open + '.goal-l')], ['70 kg', 'To match']);
});
