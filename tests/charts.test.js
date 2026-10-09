const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at } = require('./helpers');
after(closeAll);

const toResults = page => page.click('#view [data-act="screen"][data-screen="results"]');
/* Where a chart is on the screen, after scrolling to it: the charts are under the table, below the fold. */
const svgBox = async (page, slot) => { const svg = page.locator(`.rc-one[data-slot="${slot}"] .pg-svg svg`); await svg.scrollIntoViewIfNeeded(); return svg.boundingBox(); };

test('three charts, one for each exercise in the plan', async () => {
  const page = await openApp({ today: '2026-10-21', sessions: threeWeeks() });
  await toResults(page);
  assert.equal(await txt(page, '#view .rc-head .h2'), 'Charts');
  assert.equal(await txt(page, '#view .rc-head .small'), 'Your reps per workout, one chart for each exercise.');
  assert.deepEqual(await texts(page, '.rc-one .ex-n'), ['Overhead press', 'Seated cable row', 'Seated leg press']);
  assert.deepEqual(await texts(page, '.rc-one .rc-sub'), ['Push · 35 kg', 'Pull · 65 kg', 'Legs · 75 kg']);
  assert.deepEqual(await texts(page, '.rc-one .rc-now'), ['68 reps now', '80 reps now', '79 reps now']);
  assert.equal(await page.locator('.rc-one .pg-svg svg').count(), 3);
  assert.equal(await page.locator('.rc-one[data-slot="push"] .pg-svg svg circle:not(.xh-dot)').count(), 3);
  assert.equal(await txt(page, '#view .rc-hint'), 'Tap a point in a chart to see that day.');
});
test('the line follows the full scores, or all scores when none is full', async () => {
  const cut = session('2026-10-12', 'A', [20, 78, 88], { cut: [true, false, false] });
  const page = await openApp({ today: '2026-10-21', sessions: [first(), cut, session('2026-10-19', 'A', [66, 80, 90])] });
  assert.deepEqual(await page.evaluate(() => chartSeries(S.uid, 'schouderdrukken').map(p => [p.date, p.y])), [['2026-10-05', 62], ['2026-10-19', 66]]);
  const only = await openApp({ sessions: [session('2026-10-05', 'A', [20, 0, 0], { cut: [true, false, false] })] });
  assert.deepEqual(await only.evaluate(() => chartSeries(S.uid, 'schouderdrukken').map(p => [p.y, p.cut])), [[20, true]]);
  assert.deepEqual(await only.evaluate(() => chartSeries(S.uid, 'kabelroeien')), []);
});
test('one score waits for a second, and no score says so', async () => {
  const page = await openApp({ sessions: [session('2026-10-05', 'A', [62, 0, 0])] });
  await toResults(page);
  assert.deepEqual(await texts(page, '.rc-one .pg-wait'), ['The line starts the 2nd time.', 'No score yet.', 'No score yet.']);
  assert.deepEqual(await texts(page, '.rc-one .rc-now'), ['62 reps now']);
  assert.equal(await page.locator('.rc-one .pg-svg, #view .rc-hint').count(), 0);
});
test('a change of weight is marked at its point', async () => {
  const page = await openApp({ today: '2026-10-21', sessions: threeWeeks() });
  await toResults(page);
  const series = await page.evaluate(() => chartSeries(S.uid, 'c-seated-leg-press').map(p => [p.kgText.replace(/ /g, ' '), p.kgChange]));
  assert.deepEqual(series, [['75 kg', false], ['75 kg', false], ['80 kg', true]]);
  assert.deepEqual(await texts(page, '.rc-one[data-slot="legs"] .kgmark text'), ['80 kg']);
  assert.equal(await page.locator('.rc-one[data-slot="push"] .kgmark').count(), 0);
});
test('a tap on a point shows the reps, the weight and the day; the arrow keys walk along', async () => {
  const page = await openApp({ today: '2026-10-21', sessions: threeWeeks() });
  await toResults(page);
  const box = await svgBox(page, 'legs');
  await page.mouse.click(box.x + box.width - 12, box.y + box.height / 2);
  assert.deepEqual([await txt(page, '.rc-one[data-slot="legs"] .tip strong'), await txt(page, '.rc-one[data-slot="legs"] .tip span')], ['79 reps', '80 kg · Mon 19 Oct']);
  await page.keyboard.press('ArrowLeft');
  assert.deepEqual([await txt(page, '.rc-one[data-slot="legs"] .tip strong'), await txt(page, '.rc-one[data-slot="legs"] .tip span')], ['88 reps', '75 kg · Mon 12 Oct']);
});
test('dumbbell pairs and bodyweight read the way you set them, under the chart and in its label', async () => {
  const b2 = session('2026-10-14', 'B', [32, 10, 44], { kg: [24, 0, 32] });
  const page = await openApp({ today: '2026-10-16', profile: profile({ rotate: true }), sessions: [session('2026-10-07', 'B', [30, 8, 40]), b2] });
  await toResults(page);
  await page.click('#view [data-act="resTpl"][data-tpl="B"]');
  assert.deepEqual(await texts(page, '.rc-one .rc-sub'), ['Push · 2 × 12 kg', 'Pull · bodyweight', 'Legs · 2 × 16 kg']);
  assert.deepEqual(await texts(page, '.rc-one[data-slot="push"] .kgmark text'), ['2 × 12 kg']);
  const box = await svgBox(page, 'pull');
  await page.mouse.click(box.x + box.width - 12, box.y + box.height / 2);
  assert.equal(await txt(page, '.rc-one[data-slot="pull"] .tip span'), 'bodyweight · Wed 14 Oct');
});
test('a buddy’s charts follow his plan and his weights', async () => {
  const sam = { id: 'sam', profile: profile({ nick: 'Sam', weights: { schouderdrukken: 40 } }), sessions: threeWeeks() };
  const page = await openApp({ today: '2026-10-21', sessions: [first()], crew: [sam] });
  await toResults(page);
  await page.click('[data-act="person"][data-id="sam"]');
  assert.equal(await txt(page, '#view .rc-head .small'), 'Sam’s reps per workout, one chart for each exercise.');
  assert.deepEqual(await texts(page, '.rc-one .rc-sub'), ['Push · 40 kg', 'Pull · 65 kg', 'Legs · 80 kg']);
  assert.deepEqual(await texts(page, '.rc-one .rc-now'), ['68 reps now', '80 reps now', '79 reps now']);
});
test('without workouts there is nothing to chart', async () => {
  const page = await openApp();
  await toResults(page);
  assert.equal(await page.locator('#view .rc-head, #view .rc, #view .rc-hint').count(), 0);
});
for (const dark of [false, true]) {
  test(`the charts fit a 320 px phone (${dark ? 'dark' : 'light'})`, async () => {
    const page = await openApp({ width: 320, dark, today: '2026-10-21', sessions: threeWeeks() });
    await toResults(page);
    assert.equal(await page.locator('.rc-one .pg-svg svg').count(), 3);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
    assert.deepEqual(page.__errors, []);
  });
}
test('weight marks that would run into each other keep their line and drop the words, the newest first', async () => {
  const up = Array.from({ length: 10 }, (_, i) => session('2026-10-' + String(i + 5).padStart(2, '0'), 'A', [60, 70, 80], { kg: [30 + i * 2.5, 65, 75] }));
  const page = await openApp({ today: '2026-10-21', sessions: up });
  await toResults(page);
  assert.equal(await page.locator('.rc-one[data-slot="push"] .kgmark line').count(), 9);
  const words = await texts(page, '.rc-one[data-slot="push"] .kgmark text');
  assert.equal(words[words.length - 1], '52.5 kg');
  assert.equal(words.length > 1 && words.length < 9, true, `labels: ${words}`);
  const boxes = await page.evaluate(() => [...document.querySelectorAll('.rc-one[data-slot="push"] .kgmark text')].map(t => { const r = t.getBoundingClientRect(); return [r.left, r.right]; }));
  assert.equal(boxes.some((b, i) => i > 0 && b[0] < boxes[i - 1][1]), false, `boxes: ${JSON.stringify(boxes)}`);
});
