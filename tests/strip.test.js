const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at } = require('./helpers');
after(closeAll);

const row = (page, id) => page.locator(`.wk-row[data-id="${id}"] .wd`).evaluateAll(els => els.map(e => e.dataset.state + ':' + e.textContent.trim()));

test('your row shows done, today and planned with their letters', async () => {
  const page = await openApp({ sessions: abc() });
  assert.deepEqual(await row(page, 'local'), ['done:C', 'rest:', 'today:A', 'rest:', 'planned:B', 'rest:', 'rest:']);
  assert.equal(await txt(page, '.wk-row.me .wk-who'), 'You');
  assert.equal(await txt(page, '.wk-row.me .wk-n'), '1/3');
  assert.deepEqual(await texts(page, '.wk-head .wk-d'), ['M', 'T', 'W', 'T', 'F', 'S', 'S']);
  assert.equal(await txt(page, '.wk-head .wk-d[aria-current="date"]'), 'W');
});
test('a missed day and a rest day today stay empty', async () => {
  assert.deepEqual(await row(await openApp({ today: '2026-10-15', sessions: abc() }), 'local'),
    ['done:C', 'rest:', 'missed:', 'todayRest:', 'planned:A', 'rest:', 'rest:']);
});
test('a buddy gets a row without letters', async () => {
  const sam = { id: 'sam', profile: profile({ nick: 'Sam', joined: at('2026-09-29') }),
    sessions: [session('2026-10-12', 'A', [50, 50, 50], { id: 'b1' }), session('2026-10-14', 'B', [20, 5, 30], { id: 'b2' })] };
  const page = await openApp({ sessions: abc(), crew: [sam] });
  assert.deepEqual(await row(page, 'sam'), ['done:', 'rest:', 'done:', 'rest:', 'planned:', 'rest:', 'rest:']);
  assert.equal(await page.locator('.wk-row[data-id="sam"] .wd[data-state="done"] svg').count(), 2);
  assert.deepEqual([await txt(page, '.wk-row[data-id="sam"] .wk-who'), await txt(page, '.wk-row[data-id="sam"] .wk-n')], ['Sam', '2/3']);
  assert.equal(await page.locator('.wk-row[data-id="sam"]').getAttribute('aria-label'), 'Sam: 2 of 3 workouts this week');
});
test('at most three buddies, in the order they joined', async () => {
  const crew = ['d', 'c', 'b', 'a'].map((n, i) => ({ id: n, profile: profile({ nick: n.toUpperCase(), joined: at('2026-10-0' + (4 - i)) }), sessions: [] }));
  const page = await openApp({ sessions: abc(), crew });
  assert.deepEqual(await texts(page, '.wk-row[data-id] .wk-who'), ['You', 'A', 'B', 'C']);
  assert.equal(await txt(page, '.wk-more'), '+1 more');
  await page.click('.wk-more');
  assert.equal(await txt(page, '#view .title'), 'Progress');
});
test('same every time shows a tick instead of a letter', async () => {
  const page = await openApp({ sessions: abc(), profile: profile({ mode: 'same' }) });
  assert.deepEqual(await row(page, 'local'), ['done:', 'rest:', 'today:', 'rest:', 'planned:', 'rest:', 'rest:']);
  assert.equal(await page.locator('.wk-row.me .wd[data-state="done"] svg').count(), 1);
});
test('no strip before the start date, and no counter when nothing is planned', async () => {
  assert.equal(await (await openApp({ profile: profile({ start: '2026-10-19' }) })).locator('.wk').count(), 0);
  const empty = await openApp({ profile: profile({ week: { mon: '2026-10-12', days: [] } }) });
  assert.equal(await txt(empty, '.wk-row.me .wk-n'), '');
});
test('a buddy with thin data never breaks the strip', async () => {
  const page = await openApp({ sessions: abc(), crew: [{ id: 'anon', profile: profile({ nick: '' }), sessions: [] }, { id: 'ghost', profile: 'broken' }] });
  assert.deepEqual(await texts(page, '.wk-row[data-id] .wk-who'), ['You', 'Training buddy']);
  assert.deepEqual(await row(page, 'anon'), ['missed:', 'rest:', 'planned:', 'rest:', 'planned:', 'rest:', 'rest:']);
  assert.deepEqual(page.__errors, []);
});
