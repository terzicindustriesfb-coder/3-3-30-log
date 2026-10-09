const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at } = require('./helpers');
after(closeAll);

const verdicts = (page, id) => page.evaluate(i => { const s = me().sessions.get(i); return s.blocks.map(b => verdict(b, S.uid, s.id).text); }, id);
const summary = (page, id) => page.evaluate(i => sessionSummary(me().sessions.get(i), S.uid), id);
const second = (reps, opts) => session('2026-10-12', 'A', reps, opts);
const ID = 's-2026-10-12-A';

test('same weight: up, level and down', async () => {
  const page = await openApp({ sessions: [first(), second([66, 77, 80])] });
  assert.deepEqual(await verdicts(page, ID), ['▲ 4 more', 'same as last time', '▼ 5 fewer']);
  assert.equal(await page.evaluate(i => verdict(me().sessions.get(i).blocks[0], S.uid, i).tone, ID), 'pos');
  assert.equal(await summary(page, ID), '1 of 3 beaten');
});
test('another weight is named, not judged', async () => {
  const page = await openApp({ sessions: [first(), second([66, 80, 79], { kg: [35, 65, 80] })] });
  assert.deepEqual(await verdicts(page, ID), ['▲ 4 more', '▲ 3 more', '+5 kg']);
  assert.equal(await summary(page, ID), '2 of 2 beaten · 1 heavier');
  const light = await openApp({ sessions: [first(), second([70, 77, 85], { kg: [30, 65, 75] })] });
  assert.deepEqual([await verdicts(light, ID), await summary(light, ID)], [['−5 kg', 'same as last time', 'same as last time'], '0 of 2 beaten · 1 lighter']);
});
test('first score, skipped and stopped early', async () => {
  const page = await openApp({ sessions: [session('2026-10-05', 'A', [62, 0, 85], { cut: [false, false, true] })] });
  assert.deepEqual(await verdicts(page, 's-2026-10-05-A'), ['first score', 'skipped', 'stopped early']);
  assert.equal(await summary(page, 's-2026-10-05-A'), '1 first score · 1 stopped early');
  assert.equal(await summary(await openApp({ sessions: [first()] }), 's-2026-10-05-A'), '3 first scores');
});
test('a new exercise and a stopped block next to compared ones', async () => {
  const fresh = await openApp({ sessions: [first(), second([30, 77, 80], { ex: ['bankdrukken', 'kabelroeien', 'c-seated-leg-press'], kg: [40, 65, 75] })] });
  assert.equal(await summary(fresh, ID), '0 of 2 beaten · 1 first score');
  const cut = await openApp({ sessions: [first(), second([66, 77, 20], { cut: [false, false, true] })] });
  assert.equal(await summary(cut, ID), '1 of 2 beaten · 1 stopped early');
});
test('dumbbell pairs and assisted bodyweight work read as the person changed them', async () => {
  const page = await openApp({ today: '2026-10-16', sessions: [session('2026-10-07', 'B', [30, 8, 40]), session('2026-10-14', 'B', [30, 10, 40], { kg: [24, -10, 32] })] });
  assert.deepEqual(await verdicts(page, 's-2026-10-14-B'), ['+4 kg', '−10 kg', 'same as last time']);
});
test('a practice workout has no summary', async () => {
  const page = await openApp({ sessions: [first()], profile: profile({ joined: at('2026-10-19'), start: '2026-10-19' }) });
  assert.equal(await summary(page, 's-2026-10-05-A'), '');
});
const longs = (page, id) => page.evaluate(i => { const s = me().sessions.get(i); return s.blocks.map(b => verdict(b, S.uid, s.id).long); }, id);
test('the verdict as a sentence, for the result after ten minutes', async () => {
  const page = await openApp({ sessions: [first(), second([66, 77, 80])] });
  assert.deepEqual(await longs(page, ID), ['▲ 4 more than last time', 'Same as last time', '▼ 5 fewer than last time']);
  const kg = await openApp({ sessions: [first(), second([60, 80, 79], { kg: [32.5, 65, 80] })] });
  assert.deepEqual(await longs(kg, ID), ['Lighter than last time: −2.5 kg', '▲ 3 more than last time', 'Heavier than last time: +5 kg']);
  const one = await openApp({ sessions: [session('2026-10-05', 'A', [62, 0, 85], { cut: [false, false, true] })] });
  assert.deepEqual(await longs(one, 's-2026-10-05-A'), ['First score. Next time, beat this.', '', 'It counts, but it is not your next score to beat.']);
});
test('stopped early comes before every other verdict', async () => {
  const page = await openApp({ sessions: [first(), second([70, 77, 85], { cut: [true, false, false] })] });
  const v = await page.evaluate(i => { const s = me().sessions.get(i); const x = verdict(s.blocks[0], S.uid, s.id); return [x.kind, x.text, x.tone]; }, ID);
  assert.deepEqual(v, ['cut', 'stopped early', '']);
});
