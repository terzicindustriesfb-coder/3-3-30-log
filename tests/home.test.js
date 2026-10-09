const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at } = require('./helpers');
after(closeAll);

const titles = async page => [await txt(page, '#view .title'), await txt(page, '#view .head .lead-s')];
const forms = page => page.locator('#view .xc').evaluateAll(els => els.map(e => e.dataset.slot + ':' + e.dataset.form));
const primary = page => page.locator('.xc [data-act="start"]').evaluateAll(els => els.map(e => e.classList.contains('primary')));

test('three cards, each with its exercise, its weight, what to beat and its own Start', async () => {
  const page = await openApp({ sessions: [first()] });
  assert.deepEqual(await titles(page), ['Today: 3 exercises', 'Each one takes 10 minutes. Do them in any order and beat your last score.']);
  assert.deepEqual(await forms(page), ['push:todo', 'pull:todo', 'legs:todo']);
  assert.deepEqual(await texts(page, '.xc .xc-grp'), ['Push', 'Pull', 'Legs']);
  assert.deepEqual(await texts(page, '.xc .ex-n'), ['Overhead press', 'Seated cable row', 'Seated leg press']);
  assert.deepEqual(await texts(page, '.xc .ex-kg'), ['35 kg', '65 kg', '75 kg']);
  assert.deepEqual(await texts(page, '.xc .goal-l'), ['To beat', 'To beat', 'To beat']);
  assert.deepEqual(await texts(page, '.xc .goal-n'), ['62', '77', '85']);
  assert.deepEqual(await texts(page, '.xc [data-act="start"]'), ['Start 10 minutes', 'Start 10 minutes', 'Start 10 minutes']);
  assert.deepEqual(await texts(page, '.xc [data-act="editEx"]'), ['Change', 'Change', 'Change']);
  assert.deepEqual(await primary(page), [true, false, false]);
  assert.equal(await page.locator('.xc[data-slot="pull"] [data-act="editEx"]').getAttribute('aria-label'), 'Change Seated cable row');
  assert.equal(await page.locator('#view .hint, #view [data-act="swap"]').count(), 0);
  assert.deepEqual(await texts(page, '#view .home-nav .btn'), ['My results', 'Settings']);
});
test('a heavier set weight asks to match, and no score says First time', async () => {
  const heavy = await openApp({ sessions: [first()], profile: profile({ weights: { schouderdrukken: 37.5, kabelroeien: 65, 'c-seated-leg-press': 75 } }) });
  assert.deepEqual(await texts(heavy, '.xc .goal-l'), ['To match', 'To beat', 'To beat']);
  const none = await openApp();
  assert.deepEqual(await texts(none, '.xc .goal-l'), ['First time', 'First time', 'First time']);
  assert.equal(await none.locator('.xc .goal-n').count(), 0);
});
test('one done: its card shows the reps and the verdict, and the title counts down', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-14', 'A', [68, 0, 0])] });
  assert.deepEqual(await titles(page), ['Two to go', 'One done. Start the next one when you are ready.']);
  assert.deepEqual(await forms(page), ['push:done', 'pull:todo', 'legs:todo']);
  const push = '.xc[data-slot="push"] ';
  assert.deepEqual([await txt(page, push + '.xc-grp'), await txt(page, push + '.ex-n'), await txt(page, push + '.ex-kg')], ['Push · done', 'Overhead press', '35 kg']);
  assert.deepEqual([await txt(page, push + '.goal-n'), await txt(page, push + '.xc-u'), await txt(page, push + '.xc-verdict')], ['68', 'reps', '▲ 6 more']);
  assert.equal(await page.locator(push + '.xc-verdict.pos').count(), 1);
  assert.equal(await page.locator('.xc[data-slot="push"]').getAttribute('aria-label'), 'Push, done: Overhead press, 68 reps, ▲ 6 more. Fix it');
  assert.deepEqual(await primary(page), [true, false]);                // the first card that is still to do
  assert.equal(await txt(page, '#view .hint'), 'Something wrong? Tap an exercise to fix its reps.');
});
test('two done, and all three done', async () => {
  const two = await openApp({ sessions: [first(), session('2026-10-14', 'A', [68, 77, 0])] });
  assert.deepEqual(await titles(two), ['One to go', 'Two done. Start the last one when you are ready.']);
  const all = await openApp({ sessions: [first(), session('2026-10-14', 'A', [68, 77, 80])] });
  assert.deepEqual(await titles(all), ['Done for today', '1 of 3 beaten.']);
  assert.deepEqual(await texts(all, '.xc .xc-verdict'), ['▲ 6 more', 'same as last time', '▼ 5 fewer']);
  assert.equal(await all.locator('.xc [data-act="start"]').count(), 0);
});
test('a done card names another weight, a first score and a block that stopped early', async () => {
  const s = session('2026-10-14', 'A', [60, 20, 90], { kg: [37.5, 65, 70], cut: [false, true, false] });
  const page = await openApp({ sessions: [first(), s] });
  assert.deepEqual(await texts(page, '.xc .xc-verdict'), ['+2.5 kg', 'stopped early', '−5 kg']);
  assert.deepEqual(await texts(page, '.xc .ex-kg'), ['37.5 kg', '65 kg', '70 kg']);          // the weight you did it with
  const fresh = await openApp({ today: '2026-10-05', sessions: [first()] });
  assert.deepEqual(await texts(fresh, '.xc .xc-verdict'), ['first score', 'first score', 'first score']);
  assert.deepEqual(await titles(fresh), ['Done for today', '3 first scores.']);
});
test('a done card opens today’s workout to fix it, and empty reps bring the card back', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-14', 'A', [68, 77, 0], { id: 't1' })] });
  await page.click('.xc[data-slot="push"]');
  assert.equal(await txt(page, '#sheet .h2'), 'Edit workout');
  assert.equal(await page.locator('#sheet form').getAttribute('data-id'), 't1');
  await page.fill('#sheet [name="tot0"]', '');
  await page.click('#sheet button[type="submit"]');
  await page.waitForSelector('#sheet', { state: 'hidden' });
  assert.deepEqual(await forms(page), ['push:todo', 'pull:done', 'legs:todo']);
});
test('a card that is still to do follows the plan, a done card shows what you did', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-14', 'A', [68, 0, 0])] });
  await page.evaluate(async () => { const p = clone(myProfile()); p.plans.A = { push: 'bankdrukken', pull: 'lat-pulldown', legs: 'c-seated-leg-press' }; await saveProfile(p); });
  await page.waitForFunction(() => document.querySelector('.xc[data-slot="pull"] .ex-n').textContent === 'Lat pulldown');
  assert.deepEqual(await texts(page, '.xc .ex-n'), ['Overhead press', 'Lat pulldown', 'Seated leg press']);
  assert.deepEqual(await texts(page, '.xc[data-slot="pull"] .goal-l'), ['First time']);
});
test('with two workouts today the cards follow the newest', async () => {
  const page = await openApp({ today: '2026-10-05', sessions: [first(), session('2026-10-05', 'A', [0, 80, 0], { id: 'late', hm: '18:00' })] });
  assert.deepEqual(await forms(page), ['push:todo', 'pull:done', 'legs:todo']);
  assert.deepEqual([await txt(page, '.xc[data-slot="pull"] .goal-n'), await txt(page, '.xc[data-slot="pull"] .xc-verdict')], ['80', '▲ 3 more']);
});
test('deleting today’s workout brings all three cards back', async () => {
  const page = await openApp({ today: '2026-10-05', sessions: [first()] });
  await page.evaluate(() => deleteSession('s-2026-10-05-A'));
  await page.waitForFunction(() => document.querySelector('#view .title').textContent === 'Today: 3 exercises');
  assert.deepEqual(await forms(page), ['push:todo', 'pull:todo', 'legs:todo']);
});
test('the tip to go heavier sits on the card, above its buttons', async () => {
  const easy = first();
  easy.blocks[0].sets = [{ r: 14, kg: 35, t: 40 }, { r: 48, kg: 35, t: 500 }];
  const page = await openApp({ sessions: [easy] });
  const push = '.xc[data-slot="push"] ';
  assert.equal(await txt(page, push + '.up .grow'), 'Overhead press went well. Go up to 37.5 kg?');
  assert.deepEqual(await texts(page, push + '.up .btn'), ['Yes', 'Not now']);
  assert.equal(await page.evaluate(() => { const c = document.querySelector('.xc[data-slot="push"]'); return !!(c.querySelector('.up').compareDocumentPosition(c.querySelector('.xc-btns')) & Node.DOCUMENT_POSITION_FOLLOWING); }), true);
  assert.equal(await page.evaluate(() => [...document.querySelectorAll('.xc .up .btn')].every(e => e.getBoundingClientRect().height >= 44)), true);
  await page.click(push + '[data-act="applyUp"]');
  await page.waitForFunction(() => myProfile().weights.schouderdrukken === 37.5 && /37\.5/.test(document.querySelector('.xc[data-slot="push"] .ex-kg').textContent));   // the card is redrawn on the next frame
  assert.deepEqual([await txt(page, push + '.ex-kg'), await txt(page, push + '.goal-l')], ['37.5 kg', 'To match']);
});
test('the week counter: three dots and a line in words', async () => {
  const page = await openApp({ sessions: abc() });
  assert.equal(await txt(page, '.wkc .eyebrow'), 'This week');
  assert.deepEqual(await page.locator('.wkc-row.me .wkc-dots i').evaluateAll(els => els.map(e => e.classList.contains('on'))), [true, false, false]);
  assert.equal(await txt(page, '.wkc-row.me .wkc-n'), '1 of 3 workouts');
  assert.equal(await page.locator('.wkc-row.me').getAttribute('aria-label'), '1 of 3 workouts this week');
  assert.equal(await page.locator('.wkc-who').count(), 0);
  const more = abc().concat(session('2026-10-13', 'A', [60, 70, 80]), session('2026-10-14', 'A', [61, 71, 81]), session('2026-10-14', 'A', [1, 0, 0], { hm: '18:00', id: 'x' }));
  const four = await openApp({ sessions: more });
  assert.equal(await txt(four, '.wkc-row.me .wkc-n'), '4 workouts this week');
  assert.equal(await four.locator('.wkc-row.me .wkc-dots i.on').count(), 3);
});
test('with buddies the week counter has a row each, three buddies at most', async () => {
  const crew = ['d', 'c', 'b', 'a'].map((n, i) => ({ id: n, profile: profile({ nick: n.toUpperCase(), joined: at('2026-10-0' + (4 - i)) }),
    sessions: n === 'a' ? abc().concat(session('2026-10-14', 'A', [60, 70, 80])) : [] }));
  const page = await openApp({ sessions: abc(), crew });
  assert.deepEqual(await texts(page, '.wkc-row .wkc-who'), ['You', 'A', 'B', 'C']);
  assert.deepEqual(await texts(page, '.wkc-row .wkc-n'), ['1 of 3', '2 of 3', '0 of 3', '0 of 3']);
  assert.equal(await page.locator('.wkc-row[data-id="a"]').getAttribute('aria-label'), 'A: 2 of 3 workouts this week');
  assert.equal(await txt(page, '.wkc-more'), '+1 more');
  await page.click('.wkc-more');
  await page.waitForFunction(() => UI.screen === 'results');
});
test('a buddy with thin data never breaks the week counter', async () => {
  const page = await openApp({ sessions: abc(), crew: [{ id: 'anon', profile: profile({ nick: '' }), sessions: [] }, { id: 'ghost', profile: 'broken' }] });
  assert.deepEqual(await texts(page, '.wkc-row .wkc-who'), ['You', 'Training buddy']);
  assert.deepEqual(await texts(page, '.wkc-row .wkc-n'), ['1 of 3', '0 of 3']);
  assert.deepEqual(page.__errors, []);
});
test('with turns on the title names the workout and there is a way to do another', async () => {
  const page = await openApp({ profile: profile({ rotate: true, weights: { optrekken: -10 } }), sessions: [first()] });
  assert.deepEqual(await titles(page), ['Today: Workout B', 'Each one takes 10 minutes. Do them in any order and beat your last score.']);
  assert.equal(await txt(page, '#view [data-act="swap"]'), 'Do another workout');
  assert.deepEqual(await texts(page, '.xc .ex-n'), ['Seated dumbbell shoulder press', 'Pull-ups', 'Dumbbell Romanian deadlift']);
  assert.deepEqual(await texts(page, '.xc .ex-kg'), ['2 × 10 kg', '10 kg assist', '2 × 16 kg']);
  await page.click('#view [data-act="swap"]');
  await page.click('[data-sheet="swap"] [data-tpl="C"]');
  assert.equal(await txt(page, '#view .title'), 'Today: Workout C');
  assert.deepEqual(await texts(page, '.xc .ex-n'), ['Incline dumbbell press', 'Pendlay row', 'Dumbbell reverse lunge']);
});
test('once an exercise is done today the workout is fixed', async () => {
  const page = await openApp({ profile: profile({ rotate: true }), sessions: [first(), session('2026-10-14', 'B', [30, 0, 0])] });
  assert.equal(await txt(page, '#view .title'), 'Two to go');
  assert.equal(await page.locator('#view [data-act="swap"]').count(), 0);
  assert.deepEqual(await texts(page, '.xc .ex-n'), ['Seated dumbbell shoulder press', 'Pull-ups', 'Dumbbell Romanian deadlift']);
  assert.equal(await (await openApp({ sessions: [first()] })).locator('#view [data-act="swap"]').count(), 0);          // no turns: nothing to swap
});
test('a 40-character name and three-digit reps do not widen a 320 px screen', async () => {
  const long = profile({ names: { schouderdrukken: 'Standing barbell overhead press strict x' } });
  const page = await openApp({ width: 320, profile: long, sessions: [first(), session('2026-10-14', 'A', [0, 177, 0])] });
  assert.equal(await txt(page, '.xc[data-slot="push"] .ex-n'), 'Standing barbell overhead press strict x');
  assert.equal(await txt(page, '.xc[data-slot="pull"] .goal-n'), '177');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
});
test('the home screen fits a 390 × 844 phone without scrolling, and its buttons are at least 44 px high', async () => {
  const page = await openApp({ sessions: [first()] });
  assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight), true);
  const low = await page.evaluate(() => [...document.querySelectorAll('#view button')].filter(e => e.getBoundingClientRect().height < 44).length);
  assert.equal(low, 0);
});
