# 3-3-30 Log: Three Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make it clear at once what the app does: one home screen with three exercise cards, each with its own "Start 10 minutes" button that turns into the clock, a week counter, and one results screen with a table and charts. The planning layer (fixed days, moving a workout, "Your plan", "This week") goes.

**Architecture:** The app stays one vanilla-JS file, `3-3-30/index.html`. The rules of spec sections 3 and 4 become small functions in the "Domain logic" section that read the store and return plain data (today's workout, the form of each card, the week counter, the rows of the table, the points of a chart); the views only draw what those return. `UI.screen` switches between three screens drawn by `viewHome()`; sheets stay for what is rare. The clock keeps its engine (`R`, `tick`, `beginBlock`, `endBlock`, the draft in localStorage) and is drawn inside the open card instead of on its own screen; a score is stored per exercise, in "today's workout".

**Tech Stack:** HTML/CSS/JS in a single file, no libraries. Tests: Node 22 test runner (`node:test`) driving Chromium through `playwright` 1.56.0, with a fixed clock and seeded data. `python3 3-3-30/build_web.py` builds the website copy in `docs/`.

**Spec:** `superpowers/specs/2026-10-09-drie-kaarten-design.md` (Dutch; "spec 2.4" below refers to its sections). It builds on `superpowers/specs/2026-10-08-herontwerp-design.md`: what the new spec does not mention keeps working as it does. Screen designs: first page of the canvas "3-3-30 Log eenvoudiger: 3 opties" (the spec wins where they differ). Read the spec before starting a task. Four sentences of the spec were sharpened while this plan was written (the width of the clock button in 2.4, the hint under the charts and the sentences on a buddy's results in 2.8, the line for a workout that was never done in 2.12); the commit that adds this plan shows them.

## Global Constraints

- Work on branch `kaarten` only. Never commit to `main`, never merge, never deploy: going live needs the owner's explicit go. `docs/index.html` is rebuilt and committed in every task that changes the source (a test demands it); on this branch that file is not the live site.
- Every commit message ends with these two lines, and every task ends with `git push`:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_013Ct2BQNhzh2r6E25BnbKZ2`
- The source is one file: `3-3-30/index.html`. No new libraries, no build step for the source. `docs/claude-shim.js` and `docs/firestore.rules` do not change. The crew code never appears in the repo, in a test or in a fixture.
- UI copy is English and exact: use the strings in this plan character for character, including `’` (curly apostrophe), `·` (middle dot), `−` (U+2212 minus in "−2.5 kg"), `–` (en dash for "not done"), `▲`, `▼`, `×`, `✓` and `…`.
- Colours and type: only the existing CSS variables and font stacks, plus two new variables, `--dot` and `--good-ink` (Appendix A). Everything new must read correctly in the dark theme.
- Every tappable control is at least 44 px high (the small segmented switches "Me | name" keep their 36 px), has an accessible name, and closing a sheet or a card puts focus back where spec 7 says.
- Stored data: the profile gets one optional field, `rotate`. A profile without it behaves as "the same three every time". Nothing in a stored profile or workout is rewritten on load; `mode`, `days` and `week` are never removed from a stored profile; a stored object never contains `undefined`.
- Design width is 390 px. Nothing may scroll sideways at 320 px. The open card with its pad fits 390 × 844 without scrolling.
- Test first: write the test, see it fail for the stated reason, then write the code. Run the whole suite (`npm test`) before every commit.
- Line numbers in this plan refer to commit `72aa614` and drift as tasks land. Find code by function name.

## Review Focus

Inputs the spec implies but does not spell out, most likely to bite first. Each has a test in the task named.

1. **A double tap on "Start 10 minutes".** The clock button appears exactly where Start was, so the second tap lands on it. Expected: the clock keeps running (a tap within half a second of a change is ignored), it does not pause at once. Test in Task 10.
2. **The day changes while the app stays open.** The page is not reloaded at midnight, with or without a card open. Expected: in the morning the home screen shows the new day with clean cards; a card left on pause is closed with its reps on the day it started; a clock that is running across midnight finishes normally. Tests in Task 12.
3. **Bodyweight, assistance and dumbbell pairs in the new places.** Weight 0, minus kilos, and "2 × 10 kg" stored as 20, now also in a card, a waiting row, the head of the table, under a chart and in its label. Expected: "bodyweight", "10 kg assist", "2 × 10 kg" everywhere. Tests in Tasks 6, 7, 9 and 10.
4. **A 40-character name on a 320 px phone.** In a card next to the goal, in the open card above the clock, and in a column head of the table. Expected: the name wraps or is cut off with "…", the page never scrolls sideways, the pad keeps five keys in a row. Tests in Tasks 6, 9 and 10.
5. **A buddy whose data is thin.** No nickname, no workouts, or a profile that fails validation. Expected: a quiet row in the week counter and an empty results screen under a fallback name, never an error. Tests in Tasks 6 and 9.

## Order of the work

The spec (section 8) builds the home screen first. This plan builds the two destinations first ("My results", "Settings") so that the two buttons on the new home screen lead somewhere finished from the start. Every task leaves a working app and a green suite.

| # | Task | What the owner would see after it |
|---|---|---|
| 1 | The name `history` back to the browser | Nothing |
| 2 | `rotate` replaces `mode` | His own three exercises every time |
| 3 | What counts, the start date, today's workout, the week counter | Nothing new yet |
| 4 | The verdict in words | "▲ 4 more" where it said "▲ +4" |
| 5 | Navigation | Two buttons instead of the switch at the bottom and the gear |
| 6 | My results: the table | The table |
| 7 | My results: the charts | The charts |
| 8 | Settings as plain rows | The new Settings |
| 9 | Home: three cards and the week counter | The new home screen (Start still opens the old workout screen, for one exercise) |
| 10 | The clock on the button | The clock on the card; the old workout screen is gone |
| 11 | "Stop and save" and "Throw away" | The two ways out on pause |
| 12 | Reload, an earlier day, an old open workout, a new day | Nothing is lost when the page reloads or stays open overnight |
| 13 | Adding a workout by hand, and the welcome screen | "Add a workout", the new welcome text |
| 14 | Remove the planning code | Nothing |
| 15 | The whole thing | Screenshots to compare with the drawings |

## Conventions

- **Where code goes.** Rule functions: the "Domain logic" section. Views replace the function they supersede, in place. The card clock: the "Workout mode" section, which Task 10 renames "The card clock". Sheets: the "Sheets" section. Handlers: the `ACT` object. Styles: Appendix A lists the CSS per task; add each block just above the final `@media (prefers-reduced-motion: reduce)` line, and delete the listed old rules in the same task.
- **Test files.** `tests/<area>.test.js`, CommonJS. A new file starts with:

```js
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at } = require('./helpers');
after(closeAll);
```

  Add further helper names to the third line when a task introduces them (`forward`, `jumpTo`, `breakSaving`, `mendSaving`).
- **The profile in tests.** `profile()` is the owner's real stored profile: it still says `mode: 'abc'` and has no `rotate`, so under the new rules it does the same three every time. Old test files whose subject is Workout A, B and C get the "turns" header of Task 2, which switches `rotate` on for every profile in that file.
- **Running tests.** One file: `node --test --test-reporter=spec tests/<area>.test.js`. Everything: `npm test` (about a minute).
- **Rebuilding the website copy.** After every change to `3-3-30/index.html`: `python3 3-3-30/build_web.py`, then `npm test`. Commit `docs/index.html` with the source.
- **Committing.** Each task ends with one commit, written like this, and a push:

```bash
git add -A
git commit -m "<the subject the task gives>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013Ct2BQNhzh2r6E25BnbKZ2"
git push
```

- **Reaching the app from a test.** Top-level functions and constants of the page (`S`, `UI`, `R`, `ACT`, `myProfile`, …) are callable inside `page.evaluate`.
- **Time in tests.** `openApp` freezes `Date.now()` at `today` + `time`; timers keep running. `forward(page, seconds)` (Task 9) moves that time on and calls `tick()`, so ten minutes take no time. `jumpTo(page, ymd, hm)` (Task 12) jumps to another moment and tells the page it came back into view. Between "Start" and a tap on the clock, move the time on by at least one second (Review Focus 1).
- **Calendar used in the tests** (October 2026): Mon 5, Wed 7, Fri 9 · Mon 12, Tue 13, Wed 14, Thu 15, Fri 16, Sat 17, Sun 18 · Mon 19, Wed 21. Without `today`, a test runs on Wed 14 Oct at 10:00.
- **Fixtures.** `first()` is the owner's real first workout (Mon 5 Oct, Workout A, 62 / 77 / 85 reps at 35 / 65 / 75 kg). `abc()` is A on Mon 5, B on Wed 7, C on Mon 12. `threeWeeks()` is Workout A on Mon 5, Mon 12 and Mon 19 with rising scores and a heavier leg press (80 kg, 79 reps) on the 19th. `session(date, tpl, [push, pull, legs], opts)` makes any other workout; 0 reps means not done.

## Files

- **Modify:** `3-3-30/index.html` (every task), `docs/index.html` (rebuilt), `tests/helpers.js`, `tests/counting.test.js`, `tests/data.test.js`, `tests/exercise.test.js`, `tests/picker.test.js`, `tests/logform.test.js`, `tests/rotation.test.js`, `tests/swap.test.js`, `tests/verdict.test.js`, `tests/whole.test.js`, `tests/nav.test.js` (rewritten), `tests/shots.js`, `docs/SETUP.md`.
- **Create:** `tests/rotate.test.js`, `tests/results.test.js`, `tests/charts.test.js`, `tests/settings.test.js`, `tests/home.test.js`, `tests/clock.test.js`, `tests/resume.test.js`.
- **Delete:** `tests/log.test.js`, `tests/scores.test.js`, `tests/exhistory.test.js` (Task 6); `tests/today.test.js`, `tests/strip.test.js`, `tests/thisweek.test.js`, `tests/plan.test.js` (Task 9); `tests/move.test.js` (Task 13); `tests/week.test.js` (Task 14).

---

### Task 1: The name `history` back to the browser

The app has a function called `history`. A top-level function replaces `window.history`, so the page cannot reach the browser's back-and-forward history, which Task 5 needs. The function gets the name `scoresOf`.

**Files:**
- Modify: `3-3-30/index.html` (`function history` at line 1085 and its eleven callers: lines 1152, 1180, 1253, 1374, 1672, 1690, 2152, 2227, 2524, 2551, 2844), `tests/counting.test.js:17`, `tests/exercise.test.js:85`, `tests/whole.test.js`

**Interfaces:**
- Produces: `scoresOf(id, exKey, beforeSessionId) → [block + { date, sid }]`, the old `history` under a new name, same behaviour. `window.history` is the browser's own object again.

- [ ] **Step 1: Write the failing test** in `tests/whole.test.js`, above "nothing of the old screens is left in the source"

```js
test('no function of the app hides the browser’s own history', async () => {
  const page = await openApp({ sessions: [first()] });
  assert.deepEqual(await page.evaluate(() => [typeof history.pushState, scoresOf(S.uid, 'schouderdrukken').length]), ['function', 1]);
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `node --test --test-reporter=spec tests/whole.test.js`
Expected: FAIL with `scoresOf is not defined`.

- [ ] **Step 3: Rename the function**

In `3-3-30/index.html`: `function history(` becomes `function scoresOf(`, and each of the eleven calls `history(` becomes `scoresOf(`. Comments that use the word stay. In the two test files, `history(S.uid` becomes `scoresOf(S.uid`.

- [ ] **Step 4: Rebuild and run everything**

Run: `python3 3-3-30/build_web.py && npm test`
Expected: every test passes (191).

- [ ] **Step 5: Commit**

Subject: `Rename the app's history function so the browser's history is reachable`

---

### Task 2: `rotate` replaces `mode`

**Files:**
- Modify: `3-3-30/index.html` (`DEFAULT_MODE` line 585; `normProfile` 698–699; `defaultProfile` 1025; every reader of `mode`: `nextTpl`, `upcoming`, `weekStripHtml`, `viewToday`, `scoresCardHtml`, `logListHtml`, `settingsHtml`, `planSheet`, `weekSheet`, `exEditHtml`, `sessionViewSheet`, `exPickListHtml`, `exSwitchTo`, `exOptionsHtml`, `sessionForm`, `submitSessionForm`, `planAskHtml`, `ACT.applyPlan`, `ACT.mode`)
- Modify: the header of thirteen test files (Step 4), and `mode: 'same'` in eleven of them
- Create: `tests/rotate.test.js`

**Interfaces:**
- Produces: `rotates(profile) → boolean`, true only when `profile.rotate === true`. `normProfile(p)` keeps `rotate: true` and drops every other value of the field; it always writes `mode: 'abc'` when rotating and `mode: 'same'` when not, whatever `mode` came in. After this task nothing reads `mode`.

- [ ] **Step 1: Write the failing tests** in `tests/rotate.test.js`

```js
test('a profile without the field does the same three every time', async () => {
  const page = await openApp({ sessions: abc() });                 // the owner's stored profile still says mode: 'abc'
  assert.deepEqual(await page.evaluate(() => [rotates(myProfile()), 'rotate' in myProfile(), myProfile().mode, nextTpl(S.uid)]), [false, false, 'same', 'A']);
  assert.equal(await txt(page, '#view .title'), 'Today’s workout');
  assert.deepEqual(await texts(page, '.wo .ex-n'), ['Overhead press', 'Seated cable row', 'Seated leg press']);
});
test('with the field on, A, B and C take turns', async () => {
  const page = await openApp({ sessions: [first()], profile: profile({ rotate: true }) });
  assert.deepEqual(await page.evaluate(() => [rotates(myProfile()), myProfile().rotate, myProfile().mode, nextTpl(S.uid)]), [true, true, 'abc', 'B']);
});
test('only true switches it on, and the old field no longer decides', async () => {
  const page = await openApp();
  assert.deepEqual(await page.evaluate(() => [1, 'true', 'abc', false, null].map(v => 'rotate' in normProfile(Object.assign({}, myProfile(), { rotate: v })))), [false, false, false, false, false]);
  assert.equal(await page.evaluate(() => normProfile(Object.assign({}, myProfile(), { mode: 'abc' })).mode), 'same');
});
test('saving writes the old field along, and the old training days stay', async () => {
  const page = await openApp();
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('d330.own.local')).profile);
  await page.evaluate(async () => { const p = clone(myProfile()); p.rotate = true; await saveProfile(p); });
  let p = await stored();
  assert.deepEqual([p.rotate, p.mode, p.days], [true, 'abc', [1, 3, 5]]);
  await page.evaluate(async () => { const q = clone(myProfile()); delete q.rotate; await saveProfile(q); });
  p = await stored();
  assert.deepEqual(['rotate' in p, p.mode, p.days], [false, 'same', [1, 3, 5]]);
});
test('a new profile starts without it', async () => {
  const page = await openApp({ profile: null });
  assert.deepEqual(await page.evaluate(() => { const p = defaultProfile('Kim'); return ['rotate' in p, p.mode]; }), [false, 'same']);
});
test('the switch in Settings sets the field', async () => {
  const page = await openApp();
  await page.evaluate(() => ACT.settings());
  assert.equal(await txt(page, '#sheet [data-act="mode"][aria-pressed="true"]'), 'Same every time');
  await page.click('#sheet [data-act="mode"][data-mode="abc"]');
  await page.waitForFunction(() => myProfile().rotate === true);
  await page.click('#sheet [data-act="mode"][data-mode="same"]');
  await page.waitForFunction(() => !('rotate' in myProfile()));
});
test('a backup carries the field, and an old backup restores without it', async () => {
  const src = await openApp({ crew: [], profile: profile({ rotate: true }), sessions: [first()] });
  await src.evaluate(() => exportData('json'));
  const backup = await src.evaluate(() => window.__saved.data);
  assert.equal(JSON.parse(backup).profile.rotate, true);
  const restore = (page, json) => page.evaluate(async j => { await importData(new File([j], 'b.json', { type: 'application/json' })); return [rotates(myProfile()), trainings(S.uid).length]; }, json);
  assert.deepEqual(await restore(await openApp(), backup), [true, 1]);
  const old = JSON.stringify({ app: '3-3-30-logboek', v: 1, profile: profile(), sessions: [first()] });
  assert.deepEqual(await restore(await openApp(), old), [false, 1]);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `node --test --test-reporter=spec tests/rotate.test.js`
Expected: FAIL with `rotates is not defined` (the Settings test fails on the pressed button: "Workout A, B, C").

- [ ] **Step 3: Implement**

- Above `DEFAULT_PLANS`: `const rotates = p => !!p && p.rotate === true;` with a one-line comment (true when Workout A, B and C take turns; without the field a person does the same three every time). Delete `DEFAULT_MODE`.
- `normProfile`: `mode: p.rotate === true ? 'abc' : 'same'`, and after `out` is built `if (p.rotate === true) out.rotate = true;`.
- `defaultProfile`: `mode: 'same'`, no `rotate`.
- Every reader listed under Files: `x.mode === 'abc'` becomes `rotates(x)`, `x.mode !== 'abc'` becomes `!rotates(x)` (in `nextTpl`: `if (!rotates(S.members.get(id)?.profile)) return 'A';`).
- `ACT.mode`: instead of `p.mode = el.dataset.mode`, set `p.rotate = true` for `abc` and `delete p.rotate` otherwise. The rest of the handler stays.

- [ ] **Step 4: Give the tests about A, B and C their "turns" header**

In these thirteen files: `exercise`, `exhistory`, `log`, `logform`, `picker`, `plan`, `rotation`, `scores`, `strip`, `swap`, `thisweek`, `today`, `week` (each `tests/<name>.test.js`), replace line 3 by:

```js
const h = require('./helpers');
const { closeAll, session, first, abc, threeWeeks, txt, texts, at } = h;
/* These tests are about Workout A, B and C taking turns: every profile here has that switched on. */
const profile = over => h.profile(Object.assign({ rotate: true }, over));
const openApp = opts => h.openApp(Object.assign({ profile: profile() }, opts));
```

In all test files replace `mode: 'same'` by `rotate: false` (thirteen places in eleven files). The other test files keep the plain header.

- [ ] **Step 5: Rebuild and run everything**

Run: `python3 3-3-30/build_web.py && npm test`
Expected: every test passes. (Checked beforehand: without Step 4 exactly these thirteen files fail, 51 tests.)

- [ ] **Step 6: Commit**

Subject: `Add the rotate field: without it a profile does the same three every time`

---

### Task 3: What counts, the start date, today's workout, the week counter

Spec section 3 and 4.1. Rules only; the screens do not change yet.

**Files:**
- Modify: `3-3-30/index.html` (`startOf` line 1063, `doneBlocks` 1071, `finished` 1076–1079, `trainings` 1081; new functions after `planFor`; `exportData` line 3271)
- Modify: `tests/counting.test.js`, `tests/rotation.test.js`, `tests/verdict.test.js` (two fixtures), `tests/scores.test.js` (one fixture)

**Interfaces:**
- Produces:
  - `isDone(block) → boolean`: done, not skipped, more than 0 reps. `doneBlocks(s)` and `countsAsTraining(s)` use it and mean what they meant.
  - `startOf(id) → 'YYYY-MM-DD'`: the Monday of the week the person joined, but never before `START`; the stored `start` when that is earlier; the stored `start` (or `START`) when the profile has no join date. Nothing is written to the profile.
  - `finished(id) → (session) => boolean`: a workout counts from its first finished exercise, whatever its status and whether or not it is open on this device. (The second parameter `today` is gone.)
  - `todaySession(id = S.uid, today = todayYmd()) → session | null`: the newest workout dated today.
  - `turnTpl(id = S.uid, today = todayYmd()) → 'A' | 'B' | 'C'`: the workout whose turn it is. `'A'` when the person does not rotate; today's workout's letter once that workout counts; otherwise `UI.tpl` (own id only) or `nextTpl(id)`.
  - `weekCount(id, today = todayYmd()) → { n, text, short }`: workouts that count with a date in this Monday-to-Sunday week. `text` is `"2 of 3 workouts"` up to three and `"4 workouts this week"` above; `short` is `"2 of 3"` and `"4 workouts"`.

- [ ] **Step 1: Write the failing tests**

In `tests/counting.test.js`, replace the tests "a workout started today and not finished does not count" and "the workout open on this device does not count, whatever its date" by the first two below, and add the rest:

```js
test('a workout counts from its first finished exercise', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-14', 'B', [10, 0, 0], { status: 'active' })] });
  assert.deepEqual(await page.evaluate(() => trainings(S.uid).map(s => s.id)), ['s-2026-10-05-A', 's-2026-10-14-B']);
  assert.equal(await page.evaluate(() => scoresOf(S.uid, 'db-schouderdrukken').length), 1);
});
test('a workout that is also open on this device counts like any other', async () => {
  const open = session('2026-10-13', 'B', [10, 0, 0], { status: 'active', id: 'd1' });
  const page = await openApp({ sessions: [first(), open], draft: open });
  assert.deepEqual(await page.evaluate(() => trainings(S.uid).map(s => s.id)), ['s-2026-10-05-A', 'd1']);
  assert.equal(await page.evaluate(() => shownSessions(S.uid).length), 2);
});
test('a workout with nothing done does not count', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-12', 'B', [0, 0, 0])] });
  assert.equal(await page.evaluate(() => trainings(S.uid).length), 1);
});

const start = page => page.evaluate(() => startOf(S.uid));
test('the start date is the Monday of the week you joined, or your stored date when that is earlier', async () => {
  assert.equal(await start(await openApp()), '2026-10-05');                                                                          // joined 28 Sept: never before the first Monday
  assert.equal(await start(await openApp({ profile: profile({ joined: at('2026-10-10'), start: '2026-10-12' }) })), '2026-10-05');   // joined on a Saturday and was told "next Monday"
  assert.equal(await start(await openApp({ profile: profile({ joined: at('2026-10-21'), start: '2026-10-05' }) })), '2026-10-05');   // an earlier stored date stays
  assert.equal(await start(await openApp({ profile: profile({ joined: at('2026-10-21'), start: '2026-10-19' }) })), '2026-10-19');
  assert.equal(await start(await openApp({ profile: profile({ joined: 0, start: '2026-10-19' }) })), '2026-10-19');                  // no join date: the stored date
});
test('a workout in the week you joined counts, and the profile is left as it is', async () => {
  const late = profile({ joined: at('2026-10-10'), start: '2026-10-12' });
  const page = await openApp({ today: '2026-10-11', profile: late, sessions: [session('2026-10-10', 'A', [20, 20, 20])] });
  assert.deepEqual(await page.evaluate(() => [trainings(S.uid).length, myProfile().start]), [1, '2026-10-12']);
});

const todayId = page => page.evaluate(() => { const s = todaySession(); return s ? s.id : null; });
test('today’s workout is the newest one dated today', async () => {
  assert.equal(await todayId(await openApp({ sessions: [first()] })), null);
  assert.equal(await todayId(await openApp({ today: '2026-10-05', sessions: [first()] })), 's-2026-10-05-A');
  const two = [first(), session('2026-10-05', 'B', [30, 8, 40], { hm: '18:00' })];
  assert.equal(await todayId(await openApp({ today: '2026-10-05', sessions: two })), 's-2026-10-05-B');
  const crew = [{ id: 'sam', profile: profile({ nick: 'Sam' }), sessions: [] }];
  assert.equal(await (await openApp({ today: '2026-10-05', sessions: [first()], crew })).evaluate(() => todaySession('sam')), null);
});

const week = (page, id) => page.evaluate(i => weekCount(i || S.uid), id || '');
test('the week counter counts this week’s workouts against three', async () => {
  assert.deepEqual(await week(await openApp()), { n: 0, text: '0 of 3 workouts', short: '0 of 3' });
  assert.deepEqual(await week(await openApp({ sessions: abc() })), { n: 1, text: '1 of 3 workouts', short: '1 of 3' });
  const full = abc().concat(session('2026-10-13', 'A', [60, 70, 80]), session('2026-10-14', 'B', [30, 8, 40]));
  assert.deepEqual(await week(await openApp({ sessions: full })), { n: 3, text: '3 of 3 workouts', short: '3 of 3' });
  const more = full.concat(session('2026-10-14', 'C', [40, 40, 40], { hm: '18:00' }));          // two on one day are two
  assert.deepEqual(await week(await openApp({ sessions: more })), { n: 4, text: '4 workouts this week', short: '4 workouts' });
});
test('the week runs from Monday to Sunday, and practice does not count', async () => {
  assert.equal((await week(await openApp({ today: '2026-10-18', sessions: abc() }))).n, 1);     // Sunday still belongs to the week of Mon 12
  assert.equal((await week(await openApp({ today: '2026-10-19', sessions: abc() }))).n, 0);     // Monday starts clean
  const late = profile({ joined: at('2026-10-19'), start: '2026-10-19' });
  assert.equal((await week(await openApp({ profile: late, sessions: abc() }))).n, 0);
});
test('the week counter works for a buddy, also one without workouts or without a profile', async () => {
  const crew = [{ id: 'sam', profile: profile({ nick: 'Sam' }), sessions: abc() }, { id: 'tom', profile: profile({ nick: 'Tom' }), sessions: [] }];
  const page = await openApp({ crew });
  assert.deepEqual([(await week(page, 'sam')).short, (await week(page, 'tom')).short, (await week(page, 'nobody')).short], ['1 of 3', '0 of 3', '0 of 3']);
});
```

In `tests/rotation.test.js`, replace "a workout still in progress today does not move the letter" by:

```js
test('a workout that is being done today keeps its letter, and the next letter moves on', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-14', 'B', [10, 0, 0], { status: 'active' })] });
  assert.deepEqual(await page.evaluate(() => [turnTpl(), nextTpl(S.uid)]), ['B', 'C']);
});
test('without a workout today the turn is the next letter, or the one picked in Swap workout', async () => {
  const page = await openApp({ sessions: [first()] });
  assert.deepEqual(await page.evaluate(() => { const a = turnTpl(); UI.tpl = 'C'; return [a, turnTpl(), turnTpl('nobody')]; }), ['B', 'C', 'A']);
});
test('without turns it is always A, whatever today’s workout says', async () => {
  const page = await openApp({ profile: profile({ rotate: false }), sessions: [first(), session('2026-10-14', 'B', [10, 0, 0])] });
  assert.equal(await page.evaluate(() => turnTpl()), 'A');
});
```

A start date after the join week no longer exists, so three fixtures that want a practice workout need a join date too:

- `tests/verdict.test.js`, "a practice workout has no summary": `profile({ joined: at('2026-10-19'), start: '2026-10-19' })`.
- `tests/verdict.test.js`, "the finish screen of a practice workout has no verdicts": `profile({ joined: at('2026-10-12'), start: '2026-10-12' })`.
- `tests/scores.test.js`, "nothing planned, nothing lifted and before the start": `profile({ joined: at('2026-10-19'), start: '2026-10-19' })`.

- [ ] **Step 2: Run them to see them fail**

Run: `node --test --test-reporter=spec tests/counting.test.js tests/rotation.test.js`
Expected: FAIL. "a workout counts from its first finished exercise" gets one id instead of two; the start-date test gets `'2026-10-12'`; the others fail with `todaySession is not defined`, `weekCount is not defined`, `turnTpl is not defined`.

- [ ] **Step 3: Implement the rules**

- `const isDone = b => !!b && !!b.done && !b.skipped && b.total > 0;` and `doneBlocks = s => (s.blocks || []).filter(isDone)`.
- `startOf(id)` as a function, by the rule under Interfaces. The join week is `mondayOf(ymd(new Date(profile.joined)))`.
- `finished(id)` returns `countsAsTraining`; `trainings(id)` filters `sessionsOf(id)` by it and by `!isTrial`. Rewrite the two comments above them to say what now holds. `scoresOf` and `shownSessions` keep calling `finished`.
- After `planFor`: `todaySession`, `turnTpl`, `weekCount`, by the rules under Interfaces. `todaySession` takes the last of `sessionsOf(id)` with that date (the list is sorted by start time).
- `exportData`: the week number of a row counts from `startOf(S.uid)` instead of `p?.start || START`.

- [ ] **Step 4: Rebuild and run everything**

Run: `python3 3-3-30/build_web.py && npm test`
Expected: every test passes. (Checked beforehand: these rules break exactly the six old tests that Step 1 replaces or adjusts.)

- [ ] **Step 5: Commit**

Subject: `Count a workout from its first exercise, and add today's workout and the week counter`

---

### Task 4: The verdict in words

Spec 2.3 (short, on a done card) and 2.5 (a sentence, after the ten minutes).

**Files:**
- Modify: `3-3-30/index.html` (`verdict`, lines 1147–1161), `tests/verdict.test.js`

**Interfaces:**
- Consumes: `scoresOf`, `refBlock`.
- Produces: `verdict(block, pid, sid) → { kind, text, long, tone }`. `kind` and `tone` are unchanged (`tone` is `'pos'` for `up` only). The words:

| `kind` | `text` | `long` |
|---|---|---|
| `skipped` | `skipped` | (empty) |
| `cut` | `stopped early` | `It counts, but it is not your next score to beat.` |
| `first` | `first score` | `First score. Next time, beat this.` |
| `up` | `▲ 6 more` | `▲ 6 more than last time` |
| `same` | `same as last time` | `Same as last time` |
| `down` | `▼ 3 fewer` | `▼ 3 fewer than last time` |
| `heavier` | `+2.5 kg` | `Heavier than last time: +2.5 kg` |
| `lighter` | `−2.5 kg` | `Lighter than last time: −2.5 kg` |

  The order of the checks stays: not done, stopped early, first score, another weight, then the reps.

- [ ] **Step 1: Write the failing tests** in `tests/verdict.test.js`

Change the expected texts in the existing tests: `'▲ +4'` becomes `'▲ 4 more'`, `'▲ +3'` becomes `'▲ 3 more'`, `'▼ −5'` becomes `'▼ 5 fewer'`. Add:

```js
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
```

- [ ] **Step 2: Run them to see them fail**

Run: `node --test --test-reporter=spec tests/verdict.test.js`
Expected: FAIL: `'▲ +4'` where `'▲ 4 more'` is expected, and `long` is `undefined`.

- [ ] **Step 3: Implement** the table in `verdict()`. The kilos keep `fmtNum`, so "+2.5 kg" and "+5 kg".

- [ ] **Step 4: Rebuild and run everything**

Run: `python3 3-3-30/build_web.py && npm test`
Expected: every test passes.

- [ ] **Step 5: Commit**

Subject: `Say the verdict in words: "6 more", "3 fewer", and a sentence for after the clock`

---

### Task 5: Navigation: three screens, "Back", the date in the top bar

Spec 2.1 and the top bar of 2.2. The switch at the bottom and the gear go. For now "My results" still shows the old Progress content and "Settings" the old settings content; Tasks 6 to 8 replace both.

**Files:**
- Modify: `3-3-30/index.html`: the markup of the top bar and the bottom switch (lines 465–477); `UI` (1408); `FOCUS_KEYS` (1419); `render` (1438); `renderHeader` (1467); `ICON` (1490); `viewHome` (1502); `viewProgressPage` (1515); the "+N more" button in `weekStripHtml` (1590); `settingsHtml` and `refreshSettings` (1904–1947); `finishAndSave` (2353); `ACT.settings`, `ACT.tab` (2904, 2908); `ACT.del` (2995); the boot lines (3324); styles (Appendix A)
- Modify: `tests/nav.test.js` (rewritten), and the way to the old Progress and Settings content in `tests/exhistory.test.js`, `tests/log.test.js`, `tests/scores.test.js`, `tests/whole.test.js`, `tests/plan.test.js`, `tests/rotate.test.js`

**Interfaces:**
- Consumes: the browser's `history` (Task 1).
- Produces:
  - `UI.screen: 'home' | 'results' | 'settings'` (replaces `UI.tab`). A reload starts on `'home'`.
  - `showScreen(screen, from)`: takes focus off whatever has it (so a name being typed is saved), sets `UI.screen`, renders at once, scrolls to the top and moves focus: on "results" and "settings" to the Back button, on "home" to the button that leads to `from`.
  - `ACT.screen(el)`: opens `el.dataset.screen`. Ignored for an unknown screen and while a card is open (`R.session`). Adds one entry to the browser history: `history.pushState({ screen }, '')`, inside `try` (a host may forbid it; Back still works then).
  - `ACT.back()`: `history.back()` when `history.state` has a `screen`, otherwise `showScreen('home', UI.screen)`.
  - A `popstate` listener: closes a sheet that is open (nothing in it is saved), then `showScreen(state && state.screen || 'home', the screen it leaves)`. With a card open it always shows "home".
  - At boot: when `history.state` has a `screen` (a reload on a results or settings entry), `history.replaceState(null, '')`.
  - Markup: `backHtml()` gives `<div class="scr-top"><button type="button" class="btn back" data-act="back">` + `ICON.back` + `Back</button></div>`. `homeNavHtml()` gives `<div class="home-nav">` with two `button.btn.ghost[data-act="screen"]`: `data-screen="results"` "My results" and `data-screen="settings"` "Settings". The top bar holds `<span class="date" id="dateText"></span>` in place of `#sync` and `#gearBtn`.
  - `viewResults()`: `viewProgressPage` under a new name with `backHtml()` on top. `viewSettings()`: `backHtml()`, `<h1 class="title">Settings</h1>`, then `settingsBody()`, which is `settingsHtml` without its sheet head.

- [ ] **Step 1: Write the failing tests**: replace the whole of `tests/nav.test.js` below its header by

```js
const go = (page, screen) => page.click(`#view [data-act="screen"][data-screen="${screen}"]`);
const home = page => page.waitForFunction(() => UI.screen === 'home' && document.querySelector('#view .home-nav'));

test('the home screen has two buttons, and the switch and the gear are gone', async () => {
  const page = await openApp({ sessions: [first()] });
  assert.deepEqual(await texts(page, '#view .home-nav [data-act="screen"]'), ['My results', 'Settings']);
  assert.equal(await page.locator('#tabs, #gearBtn, #sync').count(), 0);
});
test('My results and Settings are screens with a Back button', async () => {
  const page = await openApp({ sessions: [first()] });
  await go(page, 'results');
  assert.equal(await txt(page, '#view [data-act="back"]'), 'Back');
  assert.deepEqual(await page.evaluate(() => [UI.screen, document.activeElement.dataset.act, scrollY]), ['results', 'back', 0]);
  assert.equal(await page.locator('#view .home-nav').count(), 0);
  await page.click('#view [data-act="back"]');
  await home(page);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.screen), 'results');     // focus is back on the button that led there
  await go(page, 'settings');
  assert.equal(await txt(page, '#view .title'), 'Settings');
  await page.click('#view [data-act="back"]');
  await home(page);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.screen), 'settings');
});
test('the back button of the phone or the browser does the same as Back', async () => {
  const page = await openApp({ sessions: [first()] });
  await go(page, 'results');
  await page.goBack();
  await home(page);
  await page.goForward();
  await page.waitForFunction(() => UI.screen === 'results' && document.querySelector('#view [data-act="back"]'));
});
test('going back closes a sheet that is still open', async () => {
  const page = await openApp({ sessions: [first()] });
  await go(page, 'results');
  await page.click('#view [data-act="manual"]');
  await page.goBack();
  await home(page);
  assert.deepEqual(await page.evaluate(() => [document.querySelector('#sheet').hidden, document.querySelector('#app').inert]), [true, false]);
});
test('a reload lands on the home screen, and Back still works after it', async () => {
  const page = await openApp({ sessions: [first()] });
  await go(page, 'results');
  await page.reload();
  await page.waitForFunction(() => !document.querySelector('#view .skeleton'));
  assert.equal(await page.evaluate(() => UI.screen), 'home');
  assert.equal(await page.locator('#view .home-nav').count(), 1);
  await go(page, 'settings');
  await page.click('#view [data-act="back"]');
  await home(page);
});
test('Back from Settings while your name is being typed saves the name and leaves', async () => {
  const page = await openApp();
  await go(page, 'settings');
  await page.fill('#nickIn', 'Stevan');
  await page.evaluate(() => ACT.back());             // a phone does not move focus to a button on a tap
  await home(page);
  assert.equal(await page.evaluate(() => myProfile().nick), 'Stevan');
});
test('the top bar shows today’s date, and says so when the log is on this device only', async () => {
  assert.equal(await txt(await openApp({ today: '2026-10-09' }), '.top #dateText'), 'Fri 9 Oct · this device only');
  assert.equal(await txt(await openApp({ today: '2026-10-09', crew: [] }), '.top #dateText'), 'Fri 9 Oct');
});
test('before there is a profile there is nowhere to go', async () => {
  const page = await openApp({ profile: null });
  assert.equal(await page.locator('#view [data-act="screen"]').count(), 0);
  assert.equal(await txt(page, '.top #dateText'), 'Wed 14 Oct · this device only');
});
test('the buddy switch lives on the results screen and a buddy cannot be logged for', async () => {
  const page = await openApp({ sessions: [first()], crew: [{ id: 'sam', profile: profile({ nick: 'Sam' }), sessions: [first()] }] });
  assert.equal(await page.locator('#view [data-act="person"]').count(), 0);
  await go(page, 'results');
  assert.deepEqual(await texts(page, '#view [data-act="person"]'), ['Me', 'Sam']);
  await page.click('#view [data-act="person"][data-id="sam"]');
  assert.equal(await page.locator('#view [data-act="manual"]').count(), 0);
});
test('both screens fit a 320 px phone and Back is at least 44 px high', async () => {
  const page = await openApp({ width: 320, sessions: abc() });
  for (const screen of ['results', 'settings']) {
    await go(page, screen);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320, screen);
    assert.equal(await page.evaluate(() => document.querySelector('[data-act="back"]').getBoundingClientRect().height >= 44), true, screen);
    await page.click('#view [data-act="back"]');
    await home(page);
  }
});
```

Point the other tests at the new way in:

- `tests/exhistory.test.js` (five places), `tests/log.test.js` and `tests/scores.test.js` (`toProgress`): `page.click('#tabs [data-tab="progress"]')` becomes `page.click('#view [data-act="screen"][data-screen="results"]')`.
- `tests/whole.test.js`, `visit`: take `'settings'` out of the `ACT` loop; the last line becomes two lines: `await page.click('#view [data-act="screen"][data-screen="settings"]'); await page.click('#view [data-act="back"]');` and `await page.click('#view [data-act="screen"][data-screen="results"]'); await page.click('.sc-row'); await page.keyboard.press('Escape');`.
- `tests/plan.test.js`, "Training days moved out of Settings, and the explanation moved in": open with `await page.click('#view [data-act="screen"][data-screen="settings"]')` and look in `#view` instead of `#sheet`.
- `tests/rotate.test.js`, "the switch in Settings sets the field": the same two changes.

- [ ] **Step 2: Run them to see them fail**

Run: `node --test --test-reporter=spec tests/nav.test.js`
Expected: FAIL on the first assertion of each test (no `.home-nav`, no `[data-act="screen"]`, no `#dateText`).

- [ ] **Step 3: Implement**

- Markup: in `header.top` replace `#sync` and `#gearBtn` by `<span class="date" id="dateText"></span>`; delete `nav#tabs`.
- `UI`: `screen: 'home'` instead of `tab`. `FOCUS_KEYS`: add `'screen'`, remove `'tab'`.
- `renderHeader()`: `#dateText` gets `dayShort(todayYmd())`, followed by ` · this device only` when the log is not shared (the condition `#sync` used). The notice part stays. `ICON.today` and `ICON.progress` go.
- `viewHome()`: its last line returns `viewResults()`, `viewSettings()` or `viewToday(p) + homeNavHtml()` by `UI.screen`.
- `showScreen`, `ACT.screen`, `ACT.back`, the `popstate` listener and the boot line, as under Interfaces. `ACT.tab` and `ACT.settings` go.
- `viewResults()`, `viewSettings()`, `settingsBody()`, `backHtml()`, `homeNavHtml()` as under Interfaces. The words inside the old Progress and Settings content stay as they are until Tasks 6 and 8.
- `refreshSettings()` becomes `if (UI.screen === 'settings') render();`. In `render()`, remember whether `#view details[data-how]` is open before the HTML is replaced and open it again after (Task 8 removes this again).
- `weekStripHtml`: the "+N more" button gets `data-act="screen" data-screen="results"`.
- `ACT.del`: after deleting, focus goes to `#view .lg-row`, else to `#view [data-act="back"]`.
- `finishAndSave`: drop `UI.tab = 'today'`.
- Styles: Appendix A, Task 5.

- [ ] **Step 4: Rebuild and run everything**

Run: `python3 3-3-30/build_web.py && npm test`
Expected: every test passes.

- [ ] **Step 5: Commit**

Subject: `Replace the bottom switch and the gear by two buttons, a Back button and the browser's back`

---

### Task 6: My results: the table

Spec 2.8 (all but the charts) and the fourth point of 2.12. The table takes the place of the whole old Progress page: the week card, "Your scores" with its small lines, the history sheet of one exercise, and the log.

**Files:**
- Modify: `3-3-30/index.html`: `plannedKg` (1249); `viewResults` (was `viewProgressPage`); `personPick` (1697); delete `weekCardHtml`, `sparkHtml`, `scoresCardHtml` (1707–1762), `scoreRow` (1179–1191), `scored` (1107), `logListHtml` (1860–1878), `exHistorySheet` and `SHEETS.exHistory` (2548–2570), `ACT.exHistory`, `ACT.scoreTpl`, `UI.scoreTpl`; `sessionViewSheet` (2572); `ACT.person`, `ACT.del`; styles (Appendix A)
- Create: `tests/results.test.js`
- Delete: `tests/log.test.js`, `tests/scores.test.js`, `tests/exhistory.test.js`
- Modify: `tests/whole.test.js` (`visit`), `tests/strip.test.js` (one title)

**Interfaces:**
- Consumes: `turnTpl`, `rotates`, `verdict`, `shownSessions`, `isTrial`, `planFor`, `exInfo`, `kgLabel`, `showScreen`.
- Produces:
  - `plannedKg(profile, key, pid = S.uid)`: the third parameter says whose scores the fallback reads.
  - `resultRows(pid, tpl) → { head, rows }`. `head` is three `{ slot, key, name, kg }`: the exercise now in that person's plan for `tpl`, its name and its set weight as text (`kgLabel(plannedKg(profile, key, pid).kg, info)`). `rows` is one `{ id, date, practice, cells }` per workout of `shownSessions(pid)`, newest first; when that person rotates, only workouts whose letter is `tpl`. `cells` has three entries in push, pull, legs order: `null` when that exercise was not done, else `{ reps, up, other }`: `up` is true when the verdict of that block is `up` and the workout is not practice; `other` is true when the block's exercise is not the one in `head`.
  - `UI.resTpl` (`null` = the workout whose turn it is) and `ACT.resTpl(el)`.
  - `viewResults()` draws, top to bottom: `backHtml()`; `.head` with `h1.title` and `p.lead-s`; the person switch of `personPick()` (its label becomes "Whose results"); for a person who rotates `div.res-tpl` with three `button[data-act="resTpl"][data-tpl]` "Workout A", "Workout B", "Workout C" (`aria-pressed`); `section.card.rt`; `p.rt-note` when the table has a row; `p.rt-star` when a star is shown; `button.btn.ghost[data-act="manual"]` "Add a workout by hand" for yourself.
  - The table: `div.rt-head` with `span.rt-day` "Day" and three `span.rt-ex` holding `b.rt-grp` (with the class of its group), `span.rt-name`, `span.rt-kg`. Each row is a `button.rt-row[data-id]` with `data-act="edit"` for yourself and `data-act="viewSession"` for a buddy, holding `span.rt-date` (the date, and ` <small>practice</small>` for a practice workout) and three `span.rt-c`: the reps, then `<i>▲</i>` when `up`, then `<sup>*</sup>` when `other`; `–` when not done. Six rows at first; then `button.btn.link.rt-all[data-act="logAll"]` "Show all 14 workouts" inside the card.
  - The words:

| Where | Yourself | A buddy called Sam |
|---|---|---|
| `h1.title` | `My results` | `Sam’s results` |
| `p.lead-s` | `Your workouts, newest first. The numbers are your reps in 10 minutes.` | `Sam’s workouts, newest first. The numbers are the reps in 10 minutes.` |
| `p.rt-note` | `▲ means you beat your last score. Tap a day to see or fix that workout.` | `▲ means Sam beat the last score. Tap a day to see that workout.` |
| `p.rt-star` | `* another exercise that day` | the same |
| no workouts (`p.small.empty`) | `No workouts yet.` | `Sam hasn’t logged a workout yet.` |
| workouts, but none of the shown one (`p.small.rt-none`, in the card under the head) | `No Workout B yet.` | the same |

The sentence under a buddy's title and the line for a workout that was never done (possible only with turns on) were added to the spec together with this plan (2.8 and 2.12).
  - A row's `aria-label`: the date, `, practice` when it is, a colon, then per group `push 40`, `, beat the last score` when `up`, `, another exercise` when `other`, or `legs not done`; groups joined by `; `; then `. Edit` or `. View`. Example: `Mon 12 Oct: push 40, another exercise; pull 78, beat the last score; legs not done. Edit`.

- [ ] **Step 1: Write the failing tests** in `tests/results.test.js`

```js
const toResults = page => page.click('#view [data-act="screen"][data-screen="results"]');
const squash = t => t.replace(/\s+/g, ' ').trim();
const row = async (page, i) => (await page.locator('.rt-row').nth(i).locator('.rt-date, .rt-c').allTextContents()).map(squash);

test('a row per workout, newest first, with the reps of push, pull and legs', async () => {
  const page = await openApp({ today: '2026-10-21', sessions: threeWeeks() });
  await toResults(page);
  assert.equal(await txt(page, '#view .title'), 'My results');
  assert.equal(await txt(page, '#view .head .lead-s'), 'Your workouts, newest first. The numbers are your reps in 10 minutes.');
  assert.equal(await txt(page, '.rt-head .rt-day'), 'Day');
  assert.deepEqual(await texts(page, '.rt-head .rt-grp'), ['Push', 'Pull', 'Legs']);
  assert.deepEqual(await texts(page, '.rt-head .rt-name'), ['Overhead press', 'Seated cable row', 'Seated leg press']);
  assert.deepEqual(await texts(page, '.rt-head .rt-kg'), ['35 kg', '65 kg', '75 kg']);
  assert.deepEqual(await row(page, 0), ['Mon 19 Oct', '68▲', '80▲', '79']);          // legs went up to 80 kg: named on the card, no arrow here
  assert.deepEqual(await row(page, 1), ['Mon 12 Oct', '65▲', '78▲', '88▲']);
  assert.deepEqual(await row(page, 2), ['Mon 5 Oct', '62', '77', '85']);
  assert.equal(await txt(page, '#view .rt-note'), '▲ means you beat your last score. Tap a day to see or fix that workout.');
  assert.equal(await page.locator('#view .rt-star, #view [data-act="logAll"]').count(), 0);
  assert.equal(await txt(page, '#view [data-act="manual"]'), 'Add a workout by hand');
});
test('not done is a dash, another exercise gets a star, practice is named', async () => {
  const other = session('2026-10-12', 'A', [40, 78, 0], { ex: ['bankdrukken', 'kabelroeien', 'c-seated-leg-press'], kg: [40, 65, 75] });
  const page = await openApp({ sessions: [session('2026-09-30', 'A', [5, 5, 5]), first(), other] });
  await toResults(page);
  assert.deepEqual(await row(page, 0), ['Mon 12 Oct', '40*', '78▲', '–']);
  assert.deepEqual(await row(page, 2), ['Wed 30 Sept practice', '5', '5', '5']);
  assert.equal(await txt(page, '#view .rt-star'), '* another exercise that day');
  assert.equal(await page.locator('.rt-row').nth(0).getAttribute('aria-label'), 'Mon 12 Oct: push 40, another exercise; pull 78, beat the last score; legs not done. Edit');
  assert.equal(await page.locator('.rt-row').nth(2).getAttribute('aria-label'), 'Wed 30 Sept, practice: push 5; pull 5; legs 5. Edit');
});
test('six at first, then all of them', async () => {
  const ten = Array.from({ length: 10 }, (_, i) => session('2026-10-' + String(i + 5).padStart(2, '0'), 'A', [10, 10, 10]));
  const page = await openApp({ today: '2026-10-21', sessions: ten });
  await toResults(page);
  assert.equal(await page.locator('.rt-row').count(), 6);
  assert.equal(await txt(page, '[data-act="logAll"]'), 'Show all 10 workouts');
  await page.click('[data-act="logAll"]');
  assert.equal(await page.locator('.rt-row').count(), 10);
  assert.equal((await row(page, 0))[0], 'Wed 14 Oct');
});
test('no workouts yet', async () => {
  const page = await openApp();
  await toResults(page);
  assert.equal(await txt(page, '#view .empty'), 'No workouts yet.');
  assert.equal(await page.locator('#view .rt, #view .rt-note').count(), 0);
  assert.equal(await page.locator('#view [data-act="manual"]').count(), 1);
});
test('your own row opens the workout to fix it, and after deleting the focus is in the table', async () => {
  const page = await openApp({ today: '2026-10-21', sessions: threeWeeks() });
  await toResults(page);
  await page.click('.rt-row');
  assert.equal(await txt(page, '#sheet .h2'), 'Edit workout');
  await page.click('#sheet [data-act="del"]');
  await page.click('#sheet [data-act="del"]');
  await page.waitForSelector('#sheet', { state: 'hidden' });
  assert.equal(await page.locator('.rt-row').count(), 2);
  assert.equal(await page.evaluate(() => document.activeElement.classList.contains('rt-row')), true);
});
test('a buddy’s results: his name, his rows to read, nothing to add', async () => {
  const sam = { id: 'sam', profile: profile({ nick: 'Sam' }), sessions: threeWeeks() };
  const tom = { id: 'tom', profile: profile({ nick: 'Tom' }), sessions: [] };
  const page = await openApp({ today: '2026-10-21', sessions: [first()], crew: [sam, tom] });
  await toResults(page);
  assert.deepEqual(await texts(page, '#view [data-act="person"]'), ['Me', 'Sam', 'Tom']);
  await page.click('[data-act="person"][data-id="sam"]');
  assert.equal(await txt(page, '#view .title'), 'Sam’s results');
  assert.equal(await txt(page, '#view .head .lead-s'), 'Sam’s workouts, newest first. The numbers are the reps in 10 minutes.');
  assert.equal(await txt(page, '#view .rt-note'), '▲ means Sam beat the last score. Tap a day to see that workout.');
  assert.equal(await page.locator('.rt-row').count(), 3);
  assert.equal(await page.locator('#view [data-act="manual"]').count(), 0);
  await page.click('.rt-row');
  assert.deepEqual([await txt(page, '[data-sheet="sessionView"] .eyebrow'), await txt(page, '[data-sheet="sessionView"] .h2')], ['Sam', 'Mon 19 Oct']);
  assert.deepEqual(await texts(page, '[data-sheet="sessionView"] .goal-n'), ['68', '80', '79']);
  assert.equal(await page.locator('[data-sheet="sessionView"] input, [data-sheet="sessionView"] select, [data-sheet="sessionView"] [type="submit"], [data-sheet="sessionView"] .sum-total').count(), 0);
  await page.click('[data-sheet="sessionView"] [data-act="closeSheet"]');
  assert.deepEqual(await page.evaluate(() => [document.activeElement.dataset.act, document.activeElement.dataset.id]), ['viewSession', 's-2026-10-19-A']);
  await page.click('[data-act="person"][data-id="tom"]');
  assert.equal(await txt(page, '#view .empty'), 'Tom hasn’t logged a workout yet.');
});
test('with turns on, the table shows one workout at a time, starting with the one whose turn it is', async () => {
  const page = await openApp({ profile: profile({ rotate: true }), sessions: abc() });
  await toResults(page);
  assert.deepEqual(await texts(page, '#view [data-act="resTpl"]'), ['Workout A', 'Workout B', 'Workout C']);
  assert.equal(await txt(page, '#view [data-act="resTpl"][aria-pressed="true"]'), 'Workout A');
  assert.deepEqual(await texts(page, '.rt-head .rt-name'), ['Overhead press', 'Seated cable row', 'Seated leg press']);
  assert.equal(await page.locator('.rt-row').count(), 1);
  await page.click('#view [data-act="resTpl"][data-tpl="B"]');
  assert.deepEqual(await texts(page, '.rt-head .rt-name'), ['Seated dumbbell shoulder press', 'Pull-ups', 'Dumbbell Romanian deadlift']);
  assert.deepEqual(await texts(page, '.rt-head .rt-kg'), ['2 × 10 kg', 'bodyweight', '2 × 16 kg']);
  assert.deepEqual(await row(page, 0), ['Wed 7 Oct', '30', '8', '40']);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.tpl), 'B');
});
test('a workout that was never done says so, under the head of the table', async () => {
  const page = await openApp({ profile: profile({ rotate: true }), sessions: [first()] });
  await toResults(page);
  assert.equal(await txt(page, '#view [data-act="resTpl"][aria-pressed="true"]'), 'Workout B');
  assert.deepEqual(await texts(page, '.rt-head .rt-name'), ['Seated dumbbell shoulder press', 'Pull-ups', 'Dumbbell Romanian deadlift']);
  assert.equal(await txt(page, '#view .rt-none'), 'No Workout B yet.');
  assert.equal(await page.locator('.rt-row, #view .empty').count(), 0);
  assert.equal(await page.locator('#view .rt-note').count(), 0);
});
test('without turns there are no workout buttons and every workout is a row', async () => {
  const page = await openApp({ sessions: abc() });
  await toResults(page);
  assert.equal(await page.locator('#view [data-act="resTpl"]').count(), 0);
  assert.equal(await page.locator('.rt-row').count(), 3);
  assert.deepEqual(await row(page, 0), ['Mon 12 Oct', '40*', '40*', '40*']);
});
test('the workout buttons and the weights follow the person whose results are shown', async () => {
  const sam = { id: 'sam', profile: profile({ nick: 'Sam', rotate: true, weights: { schouderdrukken: 40 } }), sessions: threeWeeks() };
  const page = await openApp({ today: '2026-10-21', sessions: [first()], crew: [sam] });
  await toResults(page);
  assert.equal(await page.locator('#view [data-act="resTpl"]').count(), 0);
  await page.click('[data-act="person"][data-id="sam"]');
  assert.equal(await txt(page, '#view [data-act="resTpl"][aria-pressed="true"]'), 'Workout B');
  await page.click('#view [data-act="resTpl"][data-tpl="A"]');
  assert.deepEqual(await texts(page, '.rt-head .rt-kg'), ['40 kg', '65 kg', '80 kg']);       // his set weight, then his last scores, not mine
});
test('a 40-character name and three-digit reps stay inside a 320 px screen', async () => {
  const long = profile({ names: { schouderdrukken: 'Standing barbell overhead press strict x' } });
  const page = await openApp({ width: 320, profile: long, sessions: [first(), session('2026-10-12', 'A', [165, 178, 188])] });
  await toResults(page);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
  assert.deepEqual(await row(page, 0), ['Mon 12 Oct', '165▲', '178▲', '188▲']);
  const heights = await page.evaluate(() => ['.rt-row', '[data-act="manual"]', '[data-act="back"]'].map(s => document.querySelector(s).getBoundingClientRect().height));
  assert.deepEqual(heights.map(h => h >= 44), [true, true, true], `heights: ${heights}`);
});
test('a buddy with thin data never breaks the results', async () => {
  const page = await openApp({ sessions: abc(), crew: [{ id: 'anon', profile: profile({ nick: '' }), sessions: [] }, { id: 'ghost', profile: 'broken' }] });
  await toResults(page);
  assert.deepEqual(await texts(page, '#view [data-act="person"]'), ['Me', 'Training buddy']);
  await page.click('[data-act="person"][data-id="anon"]');
  assert.equal(await txt(page, '#view .title'), 'Training buddy’s results');
  assert.equal(await txt(page, '#view .empty'), 'Training buddy hasn’t logged a workout yet.');
  assert.deepEqual(page.__errors, []);
});
```

Delete `tests/log.test.js`, `tests/scores.test.js` and `tests/exhistory.test.js`. In `tests/whole.test.js`, `visit`: the results line ends with `await page.click('.rt-row'); await page.keyboard.press('Escape');`. In `tests/strip.test.js`, "at most three buddies…": the title after "+1 more" is `'My results'`.

- [ ] **Step 2: Run them to see them fail**

Run: `node --test --test-reporter=spec tests/results.test.js`
Expected: FAIL: the title is "Progress" and there is no `.rt-row`.

- [ ] **Step 3: Implement**

- `plannedKg(profile, key, pid = S.uid)` and `resultRows(pid, tpl)` in "Domain logic", by the rules under Interfaces. A workout with two blocks for one group uses the first one that is done.
- `viewResults()` as under Interfaces. The shown workout is `rotates(profile) ? (TPLS.includes(UI.resTpl) ? UI.resTpl : turnTpl(pid)) : 'A'`. The loading and error cards for a buddy whose workouts have not arrived stay as they are, under the head.
- `ACT.resTpl(el)` sets `UI.resTpl` and renders. `ACT.person` also clears `UI.resTpl` (instead of `UI.scoreTpl`).
- `ACT.del`: after deleting, focus goes to `#view .rt-row`, else to `#view [data-act="back"]`.
- `sessionViewSheet`: no "Lifted in total" line any more (kilos lifted leave the screen, spec 6).
- Delete what the Files list names, and their styles. `chartBox`, `drawChart` and `.pg-svg` stay for Task 7.
- Styles: Appendix A, Task 6.

- [ ] **Step 4: Rebuild and run everything**

Run: `python3 3-3-30/build_web.py && npm test`
Expected: every test passes.

- [ ] **Step 5: Commit**

Subject: `Show the workouts as one table under My results, in place of the Progress page`

---

### Task 7: My results: the charts

Spec 2.8, "De grafieken".

**Files:**
- Modify: `3-3-30/index.html`: `viewResults`; `chartBox`, `drawChart` (1766–1851); styles (Appendix A)
- Create: `tests/charts.test.js`

**Interfaces:**
- Consumes: `scoresOf`, `resultRows` (its `head`), `plannedKg`, `blockKgLabel`, `chartBox`, `drawChart`.
- Produces:
  - `chartSeries(pid, key) → [{ date, y, kgText, ex, cut, kgChange }]`: the full scores of that exercise, old to new, or all its scores when none is full. `y` is the reps, `kgText` the weight of that score as text (`blockKgLabel`), `kgChange` true when the weight differs from the point before it.
  - `chartsHtml(pid, head)`: `div.rc-head` (`h2.h2` "Charts" and `p.small`), `section.card.rc` with one `div.rc-one[data-slot]` per exercise of `head`, and `p.tiny.rc-hint`. Each `rc-one` has `div.rc-top` (the small plate, `span.ex-n`, `span.rc-sub` like "Push · 35 kg", and `span.rc-now` like `<b>72</b> reps now` when there is a score), then the chart (`chartBox`, two points or more), or `p.tiny.pg-wait`.
  - The words: `p.small` is `Your reps per workout, one chart for each exercise.` (a buddy: `Sam’s reps per workout, one chart for each exercise.`); one score: `The line starts the 2nd time.`; no score: `No score yet.`; the hint `Tap a point in a chart to see that day.`, only when at least one line is drawn (spec 2.8).
  - `viewResults()` puts `chartsHtml` between the notes and "Add a workout by hand", and leaves it out when the person has no workouts.
  - `chartBox(id, pts, slot)` and `drawChart(el)` draw reps only. The label of a point shows `<reps> reps` and under it `<kgText> · <date>` (plus ` · stopped early`). A point with `kgChange` gets `<g class="kgmark">`: a thin vertical line over the height of the chart and its `kgText` above it (anchored at the end for the last point); the top margin of the chart grows from 10 to 18 px when there is a mark.

- [ ] **Step 1: Write the failing tests** in `tests/charts.test.js`

```js
const toResults = page => page.click('#view [data-act="screen"][data-screen="results"]');

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
  const box = await page.locator('.rc-one[data-slot="legs"] .pg-svg svg').boundingBox();
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
  const box = await page.locator('.rc-one[data-slot="pull"] .pg-svg svg').boundingBox();
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
```

- [ ] **Step 2: Run them to see them fail**

Run: `node --test --test-reporter=spec tests/charts.test.js`
Expected: FAIL: no `.rc-head`; `chartSeries is not defined`.

- [ ] **Step 3: Implement**

- `chartSeries` in "Domain logic". The weight of a point is the block's own (`Object.assign({}, info, { bw: !!block.bw })` for the label, as the old history sheet did).
- `chartsHtml`, and its place in `viewResults()`. The chart id is `pid + ':' + key`.
- `chartBox` and `drawChart`: drop the `metric` parameter and everything for kilos; add the label text and the weight mark as under Interfaces. The rest of `drawChart` (ticks, the bigger last point, the first and last date, pointer and arrow keys) stays.
- Styles: Appendix A, Task 7.

- [ ] **Step 4: Rebuild and run everything**

Run: `python3 3-3-30/build_web.py && npm test`
Expected: every test passes.

- [ ] **Step 5: Commit**

Subject: `Add a chart of the reps per exercise to My results, with the weight changes marked`

---

### Task 8: Settings as plain rows

Spec 2.9.

**Files:**
- Modify: `3-3-30/index.html`: `viewSettings` (replaces `settingsBody`); `refreshSettings` and its call in `saveProfile` (line 982); the two lines Task 5 added to `render()`; `ACT.mode` (3045); the `change` listener (3250); `UI`; `FOCUS_KEYS`; styles (Appendix A)
- Modify: `tests/helpers.js` (`web`, `prefs`, `breakSaving`, `mendSaving`), `tests/rotate.test.js`, `tests/plan.test.js`
- Create: `tests/settings.test.js`

**Interfaces:**
- Consumes: `rotates`, `showScreen`, `backHtml`, `legendHtml`, `exportData`, `importData`, `prefs`, `savePrefs`.
- Produces:
  - `viewSettings()`: `backHtml()`, `h1.title` "Settings", then five groups, each a `div.st` that starts with its heading (`.st-h`), and under them, when the log is not shared, `p.tiny.st-local`. The groups:
    1. `label.st-h[for="nickIn"]` "Your name" and the existing `#nickIn` field.
    2. "Your exercises": a `div.st-opts[role="radiogroup"]` with two `button.st-opt[role="radio"][data-act="rotate"]`, `data-on="0"` and `data-on="1"`, `aria-checked` on the chosen one. Each holds `b` and `span.st-sub`.
    3. "Sound and countdown": a card with two `div.st-row`, each `b`, `span.st-sub` and `button.st-onoff[data-act="pref"]` with `data-pref="sound"` or `data-pref="lead"`, `aria-pressed`, and the text `On` after a tick (`ICON.check`) or `Off`. Its `aria-label` is `Beeps: on. Tap to turn off.` / `Beeps: off. Tap to turn on.` (and the same with `Countdown`).
    4. "Backup": a card with three `button.st-link`: `data-act="export" data-fmt="json"`, `data-act="importPick"`, `data-act="export" data-fmt="csv"`; and the hidden `#importFile`.
    5. "More": a card with `button.st-link[data-act="more"][data-more="buddy"]` (only when the log is shared), `button.st-link[data-act="more"][data-more="how"]`, each with `aria-expanded` and, when open, a `div.st-more` right under it; on the website also `button.st-link[data-act="signOut"]`.
  - The words:

| Row | `b` | `span.st-sub` |
|---|---|---|
| exercises, `data-on="0"` | `The same 3 exercises every workout` | `You do your own three every time.` |
| exercises, `data-on="1"` | `3 workouts that take turns` | `Workout A, B and C, each with its own three exercises.` |
| `data-pref="sound"` | `Beeps` | `At the start, with 5 and 1 minute to go, and at the end.` |
| `data-pref="lead"` | `Countdown` | `10 seconds to get ready before the clock starts.` |
| backup, json | `Save a backup` | `A file with all your workouts` |
| backup, restore | `Restore a backup` | `Put back a file you saved before` |
| backup, csv | `Open in Excel` | `All your workouts as a .csv file` |
| more, buddy | `Train with a buddy` | |
| more, how | `How 3-3-30 works` | |
| sign out | `Sign out` | `Signed in as <who>` |

`p.st-local`: `Your workouts are saved on this device only.` The text under "Train with a buddy" is the old one without its first three words and with the new places: on the website `Send them the link to this page and your crew code. They sign in, type the code once and tap Let’s go. Then you see their week on the home screen and their scores under My results.`; inside Claude `Share this page with Claude’s share button and invite them as a <b>Contributor</b> or <b>Editor</b>. Then you see their week on the home screen and their scores under My results.` Under "How 3-3-30 works": the existing list of five, `legendHtml()` and the source link.
  - `UI.more = { buddy: false, how: false }`; `ACT.more(el)` flips `UI.more[el.dataset.more]` and renders.
  - `ACT.rotate(el)`: nothing when the choice is already that one. On: `rotate = true` and the plans of B and C that are missing come from `DEFAULT_PLANS` (existing plans stay). Off: the field is removed, the plans stay. Clears `UI.tpl` and `UI.resTpl`, then `saveProfile`.
  - `ACT.pref(el)`: flips `prefs.sound` or `prefs.lead`, saves the prefs, gives one short beep when sound goes on, renders.
  - Test helpers: `openApp` options `prefs` (an object stored as `d330.prefs` before the page loads) and `web` (`{ who }`: defines `window.__333web` with `who()` and a `signOut()` that sets `window.__signedOut = true`). `breakSaving(page)` makes every write to the shared log fail with code `internal` and counts the tries in `window.__writes`; `mendSaving(page)` undoes it.

- [ ] **Step 1: Extend `tests/helpers.js`**

In `openApp`: add `prefs: null, web: null` to the defaults and, before `page.goto`:

```js
  if (o.prefs) await page.addInitScript(seedLS, ['d330.prefs', o.prefs]);
  if (o.web) await page.addInitScript(w => { window.__333web = { who: () => w.who, signOut: () => { window.__signedOut = true; } }; }, o.web);
```

Next to `txt` and `texts`:

```js
/* Makes every write to the shared log fail the way a server error does (shared mode only), and counts the tries. */
const breakSaving = page => page.evaluate(() => {
  S.__doc = S.db.doc; window.__writes = 0;
  const fail = async () => { window.__writes++; throw Object.assign(new Error('refused'), { code: 'internal' }); };
  S.db.doc = () => ({ get: async () => ({ exists: false }), set: fail, delete: fail });
});
const mendSaving = page => page.evaluate(() => { S.db.doc = S.__doc; });
```

Export `breakSaving` and `mendSaving`, and describe the two new options in the comment above `openApp`.

- [ ] **Step 2: Write the failing tests** in `tests/settings.test.js` (its header also takes `breakSaving` from the helpers)

```js
const toSettings = page => page.click('#view [data-act="screen"][data-screen="settings"]');
const checked = page => page.locator('#view .st-opt').evaluateAll(els => els.map(e => e.getAttribute('aria-checked')));
const pressed = page => page.locator('#view .st-onoff').evaluateAll(els => els.map(e => e.getAttribute('aria-pressed')));

test('every row says in words what it does', async () => {
  const page = await openApp({ sessions: [first()] });
  await toSettings(page);
  assert.deepEqual(await texts(page, '#view .st-h'), ['Your name', 'Your exercises', 'Sound and countdown', 'Backup', 'More']);
  assert.equal(await page.inputValue('#nickIn'), 'Steef');
  assert.deepEqual(await texts(page, '#view .st-opt b'), ['The same 3 exercises every workout', '3 workouts that take turns']);
  assert.deepEqual(await texts(page, '#view .st-opt .st-sub'), ['You do your own three every time.', 'Workout A, B and C, each with its own three exercises.']);
  assert.deepEqual(await checked(page), ['true', 'false']);
  assert.deepEqual(await texts(page, '#view .st-row b'), ['Beeps', 'Countdown']);
  assert.deepEqual(await texts(page, '#view .st-row .st-sub'), ['At the start, with 5 and 1 minute to go, and at the end.', '10 seconds to get ready before the clock starts.']);
  assert.deepEqual([await texts(page, '#view .st-onoff'), await pressed(page), await page.locator('#view .st-onoff svg').count()], [['On', 'On'], ['true', 'true'], 2]);
  assert.equal(await page.locator('#view .st-onoff[data-pref="sound"]').getAttribute('aria-label'), 'Beeps: on. Tap to turn off.');
  assert.deepEqual(await texts(page, '#view .st-link b'), ['Save a backup', 'Restore a backup', 'Open in Excel', 'How 3-3-30 works']);
  assert.deepEqual(await texts(page, '#view .st-link .st-sub'), ['A file with all your workouts', 'Put back a file you saved before', 'All your workouts as a .csv file']);
  assert.equal(await txt(page, '#view .st-local'), 'Your workouts are saved on this device only.');
});
test('the name is saved when you leave the field', async () => {
  const page = await openApp();
  await toSettings(page);
  await page.fill('#nickIn', 'Stevan');
  await page.press('#nickIn', 'Tab');
  await page.waitForFunction(() => myProfile().nick === 'Stevan');
});
test('3 workouts that take turns switches it on, and your own three stay Workout A', async () => {
  const page = await openApp({ profile: profile({ plans: { A: { push: 'schouderdrukken', pull: 'kabelroeien', legs: 'c-seated-leg-press' } } }) });
  await toSettings(page);
  await page.click('#view .st-opt[data-on="1"]');
  await page.waitForFunction(() => myProfile().rotate === true);
  assert.deepEqual(await checked(page), ['false', 'true']);
  assert.deepEqual(await page.evaluate(() => [myProfile().plans.A.push, myProfile().plans.B.push, myProfile().plans.C.legs]), ['schouderdrukken', 'db-schouderdrukken', 'reverse-lunge']);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.on), '1');
  await page.click('#view .st-opt[data-on="0"]');
  await page.waitForFunction(() => !('rotate' in myProfile()));
  assert.deepEqual(await checked(page), ['true', 'false']);
  assert.equal(await page.evaluate(() => myProfile().plans.B.push), 'db-schouderdrukken');       // kept for when it is switched on again
});
test('Beeps and Countdown switch per device and say their state', async () => {
  const page = await openApp();
  await toSettings(page);
  await page.click('#view .st-onoff[data-pref="lead"]');
  assert.deepEqual([await texts(page, '#view .st-onoff'), await pressed(page)], [['On', 'Off'], ['true', 'false']]);
  assert.equal(await page.locator('#view .st-onoff[data-pref="lead"]').getAttribute('aria-label'), 'Countdown: off. Tap to turn on.');
  assert.deepEqual(await page.evaluate(() => [prefs.sound, prefs.lead, JSON.parse(localStorage.getItem('d330.prefs')).lead, document.activeElement.dataset.pref]), [true, false, false, 'lead']);
  await page.reload();
  await page.waitForFunction(() => !document.querySelector('#view .skeleton'));
  await toSettings(page);
  assert.deepEqual(await texts(page, '#view .st-onoff'), ['On', 'Off']);
});
test('the three backup rows do what the three buttons did', async () => {
  const page = await openApp({ crew: [], sessions: [first()] });
  await toSettings(page);
  await page.click('#view [data-act="export"][data-fmt="json"]');
  await page.waitForFunction(() => window.__saved);
  assert.equal(await page.evaluate(() => window.__saved.filename), '3-3-30-backup-2026-10-14.json');
  await page.evaluate(() => { window.__saved = null; });
  await page.click('#view [data-act="export"][data-fmt="csv"]');
  await page.waitForFunction(() => window.__saved);
  assert.equal(await page.evaluate(() => window.__saved.filename), '3-3-30-workouts.csv');
});
test('a backup made here can be put back on a fresh log', async () => {
  const src = await openApp({ crew: [], profile: profile({ rotate: true }), sessions: [first()] });
  await toSettings(src);
  await src.click('#view [data-act="export"][data-fmt="json"]');
  await src.waitForFunction(() => window.__saved);
  const json = await src.evaluate(() => window.__saved.data);
  const page = await openApp();
  await toSettings(page);
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('#view [data-act="importPick"]')]);
  await chooser.setFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(json) });
  await page.waitForFunction(() => /restored/.test(document.querySelector('#toast').textContent));
  assert.equal(await txt(page, '#toast'), '1 workout restored.');
  assert.deepEqual(await page.evaluate(() => [rotates(myProfile()), trainings(S.uid).length]), [true, 1]);
});
test('Train with a buddy and How 3-3-30 works open in place', async () => {
  const page = await openApp({ crew: [] });
  await toSettings(page);
  assert.deepEqual(await texts(page, '#view .st-link[data-act="more"] b'), ['Train with a buddy', 'How 3-3-30 works']);
  assert.equal(await page.locator('#view .st-more, #view .st-local').count(), 0);
  await page.click('#view [data-act="more"][data-more="buddy"]');
  assert.equal(await page.locator('#view [data-act="more"][data-more="buddy"]').getAttribute('aria-expanded'), 'true');
  assert.equal(await txt(page, '#view .st-more'), 'Share this page with Claude’s share button and invite them as a Contributor or Editor. Then you see their week on the home screen and their scores under My results.');
  await page.click('#view [data-act="more"][data-more="how"]');
  assert.equal(await page.locator('#view .st-more').count(), 2);
  assert.equal(await page.locator('#view .st-more ol li').count(), 5);
  assert.deepEqual(await texts(page, '#view .st-more .legend p'), [
    'Push: you press the weight away from you. Trains chest, shoulders and triceps.',
    'Pull: you pull the weight toward you. Trains back and biceps.',
    'Legs: you push with your legs or bend at the hips. Trains thighs, hamstrings and glutes.']);
  await page.click('#view [data-act="more"][data-more="buddy"]');
  assert.equal(await page.locator('#view .st-more').count(), 1);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.more), 'buddy');
});
test('on the website there is a Sign out row that says who is signed in', async () => {
  const page = await openApp({ crew: [], web: { who: 'steef@example.com' } });
  await toSettings(page);
  assert.deepEqual([await txt(page, '#view [data-act="signOut"] b'), await txt(page, '#view [data-act="signOut"] .st-sub')], ['Sign out', 'Signed in as steef@example.com']);
  await page.click('#view [data-act="more"][data-more="buddy"]');
  assert.match(await txt(page, '#view .st-more'), /^Send them the link to this page and your crew code\. .* on the home screen and their scores under My results\.$/);
  await page.click('#view [data-act="signOut"]');
  assert.equal(await page.evaluate(() => window.__signedOut), true);
});
test('when the choice cannot be saved the screen shows what is stored', async () => {
  const page = await openApp({ crew: [] });
  await toSettings(page);
  await breakSaving(page);
  await page.click('#view .st-opt[data-on="1"]');
  await page.waitForFunction(() => /Couldn’t save/.test(document.querySelector('#toast').textContent));
  await page.waitForFunction(() => document.querySelector('#view .st-opt[data-on="0"]').getAttribute('aria-checked') === 'true');
  assert.equal(await page.evaluate(() => 'rotate' in myProfile()), false);
});
test('the two new colours have a dark value of their own', async () => {
  const read = async dark => (await openApp({ dark })).evaluate(() => ['--dot', '--good-ink'].map(v => getComputedStyle(document.documentElement).getPropertyValue(v).trim()));
  assert.deepEqual([await read(false), await read(true)], [['#8F8A7E', '#125F33'], ['#7C828C', '#8FE0B0']]);
});
test('Settings fits a 320 px phone and every row is at least 44 px high', async () => {
  const page = await openApp({ width: 320, crew: [], web: { who: 'someone.with.a.long.address@example.com' } });
  await toSettings(page);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
  const low = await page.evaluate(() => [...document.querySelectorAll('#view .st-opt, #view .st-onoff, #view .st-link, #view #nickIn')].filter(e => e.getBoundingClientRect().height < 44).length);
  assert.equal(low, 0);
});
```

Delete the tests these replace: in `tests/rotate.test.js` "the switch in Settings sets the field"; in `tests/plan.test.js` "Training days moved out of Settings, and the explanation moved in".

- [ ] **Step 3: Run them to see them fail**

Run: `node --test --test-reporter=spec tests/settings.test.js`
Expected: FAIL: no `.st-h`, `.st-opt`, `.st-onoff` or `.st-link`.

- [ ] **Step 4: Implement**

- `viewSettings()`, `UI.more`, `ACT.more`, `ACT.rotate`, `ACT.pref` as under Interfaces. `ACT.mode`, `settingsBody` and `refreshSettings` go, with the call to `refreshSettings` in `saveProfile` (the render that `saveProfile` already asks for shows what is stored) and the two `details` lines in `render()`.
- The `change` listener: the branch for `sound` and `lead` goes; `nick` stays.
- `FOCUS_KEYS`: add `'pref'`, `'on'`, `'more'`; remove `'mode'`.
- Styles: Appendix A, Task 8 (the rules for `.toggle-row` and `details.how` go).

- [ ] **Step 5: Rebuild and run everything**

Run: `python3 3-3-30/build_web.py && npm test`
Expected: every test passes.

- [ ] **Step 6: Commit**

Subject: `Rebuild Settings as rows that say what they do`

---

### Task 9: Home: three cards and the week counter

Spec 2.2, 2.3 (the forms "Te doen" and "Klaar"), 2.6, 2.7, 4.3, 4.4 and the first three points of 2.12. A score is stored per exercise from this task on. The clock itself still runs on the old workout screen, now for one exercise at a time (spec 8, step 2); Task 10 moves it onto the card.

**Files:**
- Modify: `3-3-30/index.html`: `viewHome`; `viewToday` (1613–1666) becomes `viewCards`; delete `cardState` (1600), `exRow` (1669), `draftRow` (1682); `maybeReopen` (1460); `loadDraft` (1954); `closeRunner` (2022); `renderRunner` (the buttons at 2214 and 2245); `runMenu` (2315); `ACT`: add `start`, `fixToday`, change `nextBlock`, delete `startSession`, `resume`, `discardDraft`, `skipBlock`, `runClose`; the focus after joining (3230); styles (Appendix A)
- Modify: `tests/helpers.js` (`forward`), `tests/exercise.test.js`, `tests/picker.test.js`, `tests/data.test.js`, `tests/swap.test.js`, `tests/rotation.test.js`, `tests/rotate.test.js`, `tests/whole.test.js`
- Create: `tests/home.test.js`
- Delete: `tests/today.test.js`, `tests/strip.test.js`, `tests/thisweek.test.js`, `tests/plan.test.js`

**Interfaces:**
- Consumes: `todaySession`, `turnTpl`, `weekCount`, `isDone`, `verdict`, `sessionSummary`, `scoresOf`, `refBlock`, `plannedKg`, `planFor`, `upHint`, `buddyIds`, `newSession`, `saveSession`, `deleteSession`, `saveProfile`, `homeNavHtml`.
- Produces:
  - `cardModel(today = todayYmd()) → { tpl, done, cards }`. `tpl` is `turnTpl()`. `cards` has one entry per group in push, pull, legs order. A group is **done** when today's workout has a done block for it: `{ slot, form: 'done', name, kgText, n, verdict }` with the block's own name, weight (`blockKgLabel`) and reps, and `verdict(block, S.uid, session.id)`. Otherwise it is **to do**: `{ slot, form: 'todo', key, name, kgText, goal }` with the exercise of the plan for `tpl`, its set weight (`kgLabel(plannedKg(profile, key).kg, info)`), and `goal` from `refBlock(scoresOf(S.uid, key))`: `{ label: 'To beat', n }`, `{ label: 'To match', n }` when the set weight is heavier than that score's, or `{ label: 'First time', n: null }`. `done` is the number of done cards.
  - `viewCards(profile)` draws, top to bottom: `div.head` with `h1.title[tabindex="-1"]`, `p.lead-s` and, for a profile that rotates with nothing done today, `button.btn.link[data-act="swap"]` "Do another workout"; the three cards; `p.tiny.hint` when `done > 0`; `weekCountHtml()`. `viewHome()` adds `homeNavHtml()` under it.
  - The title and the sentence:

| Done today | `h1.title` | `p.lead-s` |
|---|---|---|
| 0 | `Today: 3 exercises`, or `Today: Workout B` for a profile that rotates | `Each one takes 10 minutes. Do them in any order and beat your last score.` |
| 1 | `Two to go` | `One done. Start the next one when you are ready.` |
| 2 | `One to go` | `Two done. Start the last one when you are ready.` |
| 3 | `Done for today` | `sessionSummary(today's workout, S.uid)` with a full stop, like `3 of 3 beaten.` (nothing when the summary is empty) |

The hint: `Something wrong? Tap an exercise to fix its reps.`
  - A card to do: `section.card.xc[data-slot][data-form="todo"]` holding `div.xc-top` (the plate, then `span.ex-main` with `span.xc-grp` "Push" in the colour of its group, `span.ex-n`, `span.ex-kg`, then `span.goal` with `span.goal-l` and, when there is a score, `span.goal-n`), the tip of `upHint(profile, key)` when there is one, and `div.xc-btns` with `button.btn[data-act="start"][data-slot]` "Start 10 minutes" (`aria-label="Start 10 minutes: <name>"`; class `primary` on the first card that is to do, `line` on the others) and `button.btn[data-act="editEx"][data-tpl][data-slot]` "Change" (`aria-label="Change <name>"`).
  - A done card: `button.card.xc[data-slot][data-form="done"][data-act="fixToday"]` holding `span.xc-top` with `span.xc-tick` (a green disc with `ICON.check`), `span.ex-main` (`span.xc-grp.done` "Push · done", `span.ex-n`, `span.ex-kg`) and `span.goal` (`span.goal-n`, `span.xc-u` "reps", and `span.xc-verdict` with the verdict's `text`, class `pos` when its tone is). Its `aria-label`: `Push, done: Overhead press, 68 reps, ▲ 6 more. Fix it`.
  - `weekCountHtml()`: `section.card.wkc[aria-label="This week"]` with `span.eyebrow` "This week" and one `div.wkc-row[role="img"]` per person: `span.wkc-dots` with three `<i>` (class `on` for each workout this week, three at most) and `span.wkc-n`. Alone: one row (class `me`), `wkc-n` is `weekCount().text`, `aria-label` like `1 of 3 workouts this week` (`4 workouts this week`). With buddies: a row for you (`span.wkc-who` "You", class `me`, `data-id`) and for the first three of `buddyIds()` (their `displayName`), `wkc-n` is `weekCount().short`, `aria-label` like `Sam: 2 of 3 workouts this week`; more buddies give `button.btn.link.wkc-more[data-act="screen"][data-screen="results"]` "+2 more".
  - `openCard(slot)`: builds the working copy for one exercise in `R`: `R.session` is `newSession(turnTpl())` (three blocks from the plan, none done); when there is a workout today it takes over that workout's `id`, `startedAt`, `manual`, `feel` and `note`, and for every other group that workout's done block. `R.idx` is the place of `slot` in `SLOT_ORDER`; `R.phase` is `'ready'`; the clock fields are zero. So the exercise and the weight are fixed at this moment (spec 2.3).
  - `storeOpen() → Promise<boolean>`: stores the open exercise in today's workout. It sets the open block's `total` from its sets, `done` (reps above 0) and `skipped` (the opposite); saves a copy of `R.session` with `status: 'done'`, `paused: false`, `updatedAt` and `endedAt` now, in which every block that is not done is `{ done: false, skipped: true, sets: [], total: 0, dur: 0, cut: false }` (it keeps its exercise and weight); when that copy has no done block it deletes the stored workout with that id instead, or does nothing when there is none. It saves quietly (`{ quiet: true }`). After a successful save of a done block: `UI.tpl = null`, and when the profile's set weight for that exercise differs from the block's weight it becomes the block's weight (`saveProfile`, quiet). Returns whether it is stored.
  - `ACT.start(el)`: for now `openCard(el.dataset.slot)`, `saveDraft()`, `openRunner(true)`. Ignored while a card is open or for a group that is done. `ACT.fixToday()`: opens "Edit workout" for today's workout (`ACT.edit`); ignored while a card is open.
  - `forward(page, seconds)` in the test helpers.

- [ ] **Step 1: Add `forward` to `tests/helpers.js`**

In `openApp`, right after `page.clock.setFixedTime(...)`:

```js
  page.__now = new Date(`${o.today}T${o.time}:00+02:00`).getTime();
```

Next to `txt`:

```js
/* Move the frozen time on by this many seconds and let the app's clock notice. */
async function forward(page, seconds) {
  page.__now += seconds * 1000;
  await page.clock.setFixedTime(new Date(page.__now));
  await page.evaluate(() => tick());
}
```

Export it.

- [ ] **Step 2: Write the failing tests** in `tests/home.test.js` (its header also takes `forward`)

```js
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
  await page.waitForFunction(() => myProfile().weights.schouderdrukken === 37.5);
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

/* The next two drive the old workout screen; Task 10 replaces them by tests of the clock on the card. */
const doExercise = async (page, slot, reps) => {
  await page.click(`.xc[data-slot="${slot}"] [data-act="start"]`);
  await page.click('#runner [data-act="go"]');
  for (const n of reps) await page.click(`#runner [data-act="set"][data-n="${n}"]`);
  await forward(page, 600);
  assert.equal(await txt(page, '#runner [data-act="nextBlock"]'), 'Done');
  await page.click('#runner [data-act="nextBlock"]');
  await page.waitForSelector('#runner', { state: 'hidden' });
};
test('Start runs that one exercise and stores it in today’s workout', async () => {
  const page = await openApp({ sessions: [first()], prefs: { sound: false, lead: false } });
  await doExercise(page, 'pull', [8, 8, 7]);
  assert.deepEqual(await forms(page), ['push:todo', 'pull:done', 'legs:todo']);
  const stored = await page.evaluate(() => { const t = todaySession(); return [t.status, t.tpl, t.blocks.map(b => [b.slot, b.ex, b.done, b.skipped, b.total, b.kg, b.dur, b.cut])]; });
  assert.deepEqual(stored, ['done', 'A', [['push', 'schouderdrukken', false, true, 0, 35, 0, false], ['pull', 'kabelroeien', true, false, 23, 65, 600, false], ['legs', 'c-seated-leg-press', false, true, 0, 75, 0, false]]]);
  await doExercise(page, 'push', [10]);
  assert.equal(await page.evaluate(() => sessionsOf(S.uid).filter(x => x.date === '2026-10-14').length), 1);       // the same workout, not a second one
  assert.deepEqual(await forms(page), ['push:done', 'pull:done', 'legs:todo']);
  assert.equal(await txt(page, '#view .title'), 'One to go');
});
test('a reload in the middle of an exercise comes back to it', async () => {
  const page = await openApp({ sessions: [first()], prefs: { sound: false, lead: false } });
  await page.click('.xc[data-slot="legs"] [data-act="start"]');
  await page.reload();
  await page.waitForFunction(() => !document.querySelector('#view .skeleton'));
  await page.waitForSelector('#runner .run-name');
  assert.equal(await txt(page, '#runner .run-name'), 'Seated leg press');
});
```

Bring the surviving tests to the new home screen:

- `tests/exercise.test.js`: `openEx` clicks `.xc[data-slot="${slot}"] [data-act="editEx"]`. Where a test looks at the home screen, `.wo ` becomes `.xc `, and `'reps to match'` becomes `'To match'`. Delete "saving from the plan returns to the plan".
- `tests/picker.test.js`: `openPick` and the two tests that click `.wo .ex-row[data-slot="push"]` click `.xc[data-slot="push"] [data-act="editEx"]` instead. `texts(page, '.wo .goal-l')` becomes `texts(page, '.xc .goal-l')` with `['First time', 'To beat', 'To beat']`. Delete "from the plan, another workout gets the exercise and you return to the plan".
- `tests/data.test.js`, "a renamed exercise shows under its new name": the selector is `#view .xc .ex-n`.
- `tests/swap.test.js`: in the first test the title after the pick is `'Today: Workout B'`, and its last two assertions (the `startSession` attribute and the letters in the week strip) become `assert.deepEqual(await texts(page, '.xc .ex-n'), ['Seated dumbbell shoulder press', 'Pull-ups', 'Dumbbell Romanian deadlift']);`. In "the choice does not survive a reload" the title is `'Today: Workout A'`.
- `tests/rotation.test.js`, "the main screen offers the next letter": `'Today: Workout B'`.
- `tests/rotate.test.js`, first test: the title is `'Today: 3 exercises'` and the names are read from `.xc .ex-n`.
- `tests/whole.test.js`: in `visit`, `.wo .ex-row` becomes `.xc [data-act="editEx"]`; take `'Done for today'` out of the list of strings that must be gone (it is a title again).
- Delete `tests/today.test.js`, `tests/strip.test.js`, `tests/thisweek.test.js`, `tests/plan.test.js`: what they test is no longer on any screen.

- [ ] **Step 3: Run them to see them fail**

Run: `node --test --test-reporter=spec tests/home.test.js`
Expected: FAIL: no `.xc`, the title is "Today’s workout".

- [ ] **Step 4: Implement the home screen**

`cardModel`, `viewCards`, `weekCountHtml`, `ACT.fixToday` as under Interfaces; `viewHome()` returns `viewCards(p) + homeNavHtml()` on the home screen. `cardState`, `exRow` and `draftRow` go. The functions for the week strip and the two planning sheets are no longer called from any screen; they stay until Task 14. After joining, focus goes to the first `[data-act="start"]`. `ACT.del` falls back to the first `[data-act="start"]` when there is no table and no Back button. Styles: Appendix A, Task 9.

- [ ] **Step 5: Implement storing per exercise, on the old workout screen**

- `openCard` and `storeOpen` in the "Workout mode" section, as under Interfaces.
- `ACT.start` as under Interfaces. `ACT.startSession`, `ACT.resume`, `ACT.discardDraft` go.
- `renderRunner`: in the "ready" state the "Skip this exercise" button goes (`ACT.skipBlock` too); after the bell the right-hand button says `Done`.
- `ACT.nextBlock`: `if (await storeOpen()) { LS.del(DRAFT_KEY()); closeRunner(); } else toast('Couldn’t save. Your data is still on screen — try again in a moment.');`
- `runMenu`: the row "Finish later (clock pauses)" and `ACT.runClose` go.
- `loadDraft`: the three lines that drop a draft whose workout is stored as done go. A working copy shares its id with today's stored workout, so that check would throw away an exercise in progress.
- `maybeReopen`: reopens the workout screen for a draft in any state, not only while the clock runs.
- `closeRunner`: focus falls back to the first `[data-act="start"]`.

- [ ] **Step 6: Rebuild and run everything**

Run: `python3 3-3-30/build_web.py && npm test`
Expected: every test passes.

- [ ] **Step 7: Commit**

Subject: `Rebuild the home screen as three cards with a week counter, and store each exercise by itself`

---

### Task 10: The clock on the button

Spec 2.4 (all but "Stop and save" and "Throw away"), 2.5, 4.2 (the first rule) and 4.3. The old workout screen goes in this task.

**Files:**
- Modify: `3-3-30/index.html`: the markup (`#runner`, line 480); the whole "Workout mode" section (1949–2359), renamed "The card clock"; `cardModel`, `viewCards`; `maybeReopen`; `closeSheet` (2377); `armConfirm`, `toast` (2882–2896); the `ACT` entries of the workout screen (3050–3142); `advance`, `discardActive` (3154–3175); the listeners that mention `runKgIn`, `#runner` or `R.confirm === 'menu'` (1415, 3184–3198, 3240); `recordKind`, `VERDICT_TEXT` (1140, 1193); `totalRowHtml`, `kgTotal`; styles (Appendix A)
- Create: `tests/clock.test.js`
- Modify: `tests/home.test.js` (the two tests marked for this task go), `tests/swap.test.js`, `tests/verdict.test.js`, `tests/move.test.js`, `tests/whole.test.js`

**Interfaces:**
- Consumes: `openCard`, `storeOpen`, `cardModel`, `verdict`, `compare`, `prevBlock`, `ledSvg`, `beep`, `buzz`, `wakeOn`, `wakeOff`, `forward`, `breakSaving`, `mendSaving`.
- Produces:
  - `R`: `{ session, idx, phase, t0, leadEnd, pausedAt, pausedMs, timer, lastRem, wake, confirm, lastSet, saved, since, storeN, storing }`. `phase` is `'lead' | 'run' | 'paused' | 'over'` while a card is open. `saved` is `null | 'saving' | 'saved' | 'failed'`. `since` is when the phase last changed. The draft keeps `session, idx, phase, t0, leadEnd, pausedAt, pausedMs, saved`.
  - `cardModel()` reads `R.session` instead of the stored workout while a card is open, and gains `open: { slot, phase } | null` and two forms. The card of the open group is `{ slot, form: 'open', name, kgText, goal, phase, left, total, sets, past, saved, title, verdict, good }`; a group that is not done and not open is `form: 'wait'` (the fields of a card to do). Done cards stay as they are.
  - While a card is open `viewCards` draws only the cards: no head, hint, week counter or home buttons. A done card is then a `section`, not a button.
  - A waiting row: `section.card.xc[data-form="wait"]` with the small plate, `span.ex-main` (`span.ex-n`, `span.xc-sub` like `Pull · 65 kg · still to do`) and `span.xc-goal` like `To beat <b>77</b>` (or `To match <b>77</b>`, or `First time`).
  - The open card: `section.card.xc[data-form="open"]` with, top to bottom:
    - `div.xc-top` as on a card to do (the goal says what to beat, from the block's own weight).
    - Until the bell: `button.clockbtn[data-act="clock"][data-phase][data-left]` holding `span.ledbox` (the LED digits), `span.prog > b` and `span.status`; and `span#clockSr.sr-only[aria-live="polite"]`.
    - In the countdown: `button.btn.link[data-act="cancelLead"]` "Cancel".
    - After the bell instead: `div.xc-result[role="status"]` (class `good` for a first score or more reps) with `span.eyebrow`, `span.xc-big` (`<b class="total">80</b> <span class="xc-u">reps</span>`) and `span.xc-verdict`; and `p.xc-saved` when `R.saved` is set.
    - While the clock runs or is paused: `div.xc-score` with `span.xc-total` (`<b class="total">23</b> <span class="xc-u">reps so far</span>`) and, past the score to beat, `span.xc-past` `✓ Past last time (62)`. While it runs also `p.xc-how`.
    - `div.pad` (class `off` in the countdown) with twenty `button[data-act="set"][data-n]` (`aria-label="Log a set of 7 reps"`; class `last` on the number tapped last).
    - With at least one set: `div.xc-setrow` holding `div.xc-sets` (`<span class="xc-u">Your sets:</span>` and `span.setlist` with a `span` per set) and `button.btn.link[data-act="undo"]` "Undo last set".
    - After the bell: `button.btn.primary.xl[data-act="cardDone"]` "Done".
  - The clock button per phase:

| `data-phase` | Digits (`data-left`) | Colour | `span.status` | `aria-label` |
|---|---|---|---|---|
| `lead` | seconds to go, `10` down to `1` | amber | `Get ready · tap to start now` | `Get ready. Tap to start now` |
| `run` | `MM:SS` left, like `06:42` | red; amber in the last ten seconds | `Tap to pause or stop` | `Clock. Tap to pause or stop` |
| `paused` | the same time, standing still | amber | `Paused · tap to go on` | `Clock paused. Tap to go on` |

`clockText(rem)` gives `MM:SS` with a leading zero. The bar fills with the time used. The clock button takes the full width of the card, as drawn, and sits where the row with Start was; "Change" is not there while the card is open (spec 2.4).
  - The result: `span.eyebrow` is `Time is up`, or `Stopped early` for a block that was cut. `span.xc-verdict` is the `long` of the verdict of the live block, or `No reps logged.` without reps. `p.xc-saved` is `Saving…`, `Your score is saved. Last set not in yet? Tap it now.` or `Not saved yet. Tap Done to try again.`
  - `ACT.start(el)`: ignored while a card is open or for a group that is done. `audio()`, `openCard(slot)`, then the countdown (`phase 'lead'`, `leadEnd` ten seconds on) when `prefs.lead`, else `beginBlock()`. Keeps the screen awake, saves the draft, renders, scrolls to the top, puts focus on the clock button.
  - `ACT.clock()`: ignored within 500 ms of `R.since`. Countdown: `beginBlock()`. Running: pause (`pausedAt` now, the screen may sleep). Paused: go on (`pausedMs` grows by the pause).
  - `ACT.cancelLead()`: in the countdown only: `closeCard(slot)`.
  - `ACT.set(el)` and `ACT.undo()`: while running, paused or after the bell. A set is `{ r, kg: the block's weight, t: seconds into the block }`. A short buzz per set and the double buzz when the total passes the score to beat, as before. After the bell every change is stored again (`storeNow`).
  - `endBlock(auto)`: `dur` and `cut` as before, `phase 'over'`, the clock and the wake lock stop, the long beep when `auto`, then `storeNow()`.
  - `storeNow() → Promise<boolean>`: without reps and without a stored workout there is nothing to store: `R.saved = null`. Otherwise `R.saved = 'saving'`, `storeOpen()`, then `'saved'` (or `null` when the block ended up without reps) or `'failed'`. Only the newest call sets `R.saved`. It saves the draft and renders before and after. `R.storing` holds its promise.
  - `ACT.cardDone()`: after the bell only. A failed save is tried again first, a save on its way is awaited; when that does not succeed the card stays open. Then `closeCard(slot)`.
  - `closeCard(slot)`: stops the clock and the wake lock, empties `R.session` and the draft, renders, and puts focus on Start of `slot` when that card is to do again, else on the first Start, else on the title.

- [ ] **Step 1: Write the failing tests** in `tests/clock.test.js` (its header also takes `forward`, `breakSaving`, `mendSaving`)

```js
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
```

Tests of the old workout screen go, or move onto the card:

- `tests/home.test.js`: delete `doExercise` and the two tests under the comment that names this task.
- `tests/swap.test.js`: replace "the choice is used up by the workout it was made for" by

```js
test('the choice is used up by the first exercise that is stored', async () => {
  const page = await openApp({ sessions: abc(), prefs: { sound: false, lead: false } });
  await page.evaluate(() => { UI.tpl = 'C'; render(); });
  await page.click('.xc[data-slot="push"] [data-act="start"]');
  await page.click('.xc .pad [data-act="set"][data-n="10"]');
  await h.forward(page, 600);
  await page.waitForFunction(() => R.saved === 'saved');
  assert.deepEqual(await page.evaluate(() => [UI.tpl, todaySession().tpl, turnTpl(), nextTpl(S.uid)]), [null, 'C', 'C', 'A']);
});
```

- `tests/verdict.test.js`: delete "the finish screen shows reps first, with the verdict under them" and "the finish screen of a practice workout has no verdicts".
- `tests/move.test.js`: delete "finishing a workout on a rest day moves the day and names the next one".
- `tests/whole.test.js`: add to the list of strings that must be gone: `'renderRunner'`, `'openRunner'`, `'runMenu'`, `'finishAndSave'`, `'id="runner"'`, `'Workout done'`, `'Save workout'`, `'Skip this exercise'`, `'End block'`, `'New PR'`, `'Lifted in total'`, `'Finish later'`, `'Resume workout'`, `'Train again today'`.

- [ ] **Step 2: Run them to see them fail**

Run: `node --test --test-reporter=spec tests/clock.test.js tests/whole.test.js`
Expected: FAIL: no `.clockbtn` (Start opens `#runner`); the source still holds `renderRunner`.

- [ ] **Step 3: Remove the old workout screen**

Delete: the `#runner` element; `openRunner`, `closeRunner`, `statusText`, `renderRunner`, `setRunHtml` and `runRendering`, `bigDrop`, `keepKgEdit`, `kgUnitText`, `commitRunKg`, `setBlockKg`, `flushRunner`, `pointerIsDown` and its three listeners, `runMenu`, `runnerFinish`, `finishAndSave`, `advance`, `discardActive`, `recordKind`, `VERDICT_TEXT`, `totalRowHtml`, `kgTotal`; the `ACT` entries `go`, `goNow`, `pause`, `resumeClock`, `endEarly`, `runKg`, `nextBlock`, `toggleSound`, `runMenu`, `menuBack`, `stopSave`, `discardRun`, `discardEmpty`, `saveSession`, `finishBack`; the fields `confirm2`, `menuPaused`, `menuLead`, `dirty` and `corr` of `R` (`lastSet` stays); `UI.runReturn`; the `focusout` listener for `runKgIn`, the click listener on `#runner`, the `runKgIn` branches in the `keydown` and `change` listeners, and the three `R.session` branches of the Escape key (Escape does nothing while a card is open). `closeSheet` calls `setBackgroundInert(false)`. `toast` no longer looks for `#runner .clock`. `armConfirm` always asks for a render.

Kept as they are: `DRAFT_KEY`, `loadDraft`, `clearDraftFor`, `newSession`, `blk`, `elapsed`, `startTick`, `stopTick`, `tick`, `audio`, `beep`, `buzz`, `wakeOn`, `wakeOff`, the `visibilitychange` listener, `SEGS`, `DIGITS`, `ledSvg`, `mmss`, `prevBlock`, `compare`.

- [ ] **Step 4: Draw the clock on the card**

- `cardModel` and `viewCards`: the forms `open` and `wait`, by Interfaces. The goal of the open card compares the block's own weight with `prevBlock()`; `past` is `compare(live block, prevBlock())?.verdict === 'beter'` with at least one rep, as the old screen had it.
- `clockText`, `updateClock` (it now updates the LED digits, `data-left`, the bar and `#clockSr` inside `.clockbtn`, in place, on every tick), `keepPadInView` (the pad of the open card), `beginBlock`, `endBlock`, `saveDraft` (the fields under Interfaces).
- `ACT.start`, `ACT.clock`, `ACT.cancelLead`, `ACT.set`, `ACT.undo`, `ACT.cardDone`, `storeNow`, `closeCard`, by Interfaces. Every change of state saves the draft and calls `render()` directly, so a tap shows at once; the total gets the `flash` class after a set.
- `maybeReopen` (Task 12 replaces it): a draft in the state `run`, `paused` or `over` is put back into `R` (with `since` 0) and the home screen is rendered, with the clock ticking again when it ran; a draft in any other state is dropped.
- Styles: Appendix A, Task 10 (all styles of the old workout screen go).

- [ ] **Step 5: Rebuild and run everything**

Run: `python3 3-3-30/build_web.py && npm test`
Expected: every test passes.

- [ ] **Step 6: Commit**

Subject: `Run the clock on the button of the card, and remove the separate workout screen`

---

### Task 11: "Stop and save" and "Throw away"

Spec 2.4, "Pauze en stoppen".

**Files:**
- Modify: `3-3-30/index.html` (`viewCards` for the open card; `ACT.stopSave`, `ACT.throwAway`; styles, Appendix A), `tests/clock.test.js`

**Interfaces:**
- Consumes: `endBlock`, `closeCard`, `armConfirm`, `toast`.
- Produces:
  - On pause the open card shows, between the clock and the total, `div.xc-stop` with `button.btn.line[data-act="stopSave"]` "Stop and save" and `button.btn.danger[data-act="throwAway"]` "Throw away" (after one tap, for 3.5 seconds: "Tap again to throw away").
  - `ACT.stopSave()`: on pause only. Without a set: `toast('Nothing to save yet.')`. Otherwise `endBlock(false)`: the block ends at the paused time, is `cut`, and is stored like any score; the result box says "Stopped early".
  - `ACT.throwAway()`: on pause only. The first tap arms it (`armConfirm('throw', R)`); a second tap while armed closes the card with `closeCard(slot)`: nothing of the attempt is stored.

- [ ] **Step 1: Write the failing tests**: add to `tests/clock.test.js`

```js
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
```

- [ ] **Step 2: Run them to see them fail**

Run: `node --test --test-reporter=spec tests/clock.test.js`
Expected: the six new tests FAIL (no `.xc-stop`); the others pass.

- [ ] **Step 3: Implement** `div.xc-stop` in the open card and the two handlers, by Interfaces. Styles: Appendix A, Task 11.

- [ ] **Step 4: Rebuild and run everything**

Run: `python3 3-3-30/build_web.py && npm test`
Expected: every test passes.

- [ ] **Step 5: Commit**

Subject: `Add the two ways out on pause: Stop and save, and Throw away`

---

### Task 12: Reload, an earlier day, an old open workout, a new day

Spec 4.2 (reload, pause, an earlier day), 4.3 (safe on this device until it is stored) and 5 (a workout left open by the old version).

**Files:**
- Modify: `3-3-30/index.html`: `maybeReopen` (becomes `resumeDraft`) and its three callers (`render`, `subscribeMembers`, `subscribeSessions`, the boot line); `render` (`UI.day`); the `visibilitychange` listener; `tests/helpers.js` (`draft`, `jumpTo`)
- Create: `tests/resume.test.js`

**Interfaces:**
- Consumes: `loadDraft`, `saveSession`, `isDone`, `endBlock`, `storeNow`, `closeCard`, `todayYmd`.
- Produces:
  - `settleDraft(d) → Promise<boolean>`: closes an attempt that will not go on. `d` is `{ session, idx, phase, t0, pausedAt, pausedMs }`. When the open block has sets and is not done, it becomes a score: `total` from the sets, `done`, and `dur` is the time the clock had run (running: until now, ten minutes at most; paused: until the pause; otherwise the block's own `dur`), `cut` when that is under ten minutes. Then the done blocks of `d.session` are merged into the stored workout with the same id: a group that is done in the stored workout keeps the stored block; a group that is only done in the draft gets the draft's block; when the workout is not stored it is the draft's, with every block that is not done emptied as `storeOpen` does. Nothing is written when the merge adds nothing. A workout that is written gets `status: 'done'`. Saves quietly; returns false only when a needed save failed.
  - `resumeDraft()` (replaces `maybeReopen`, same moment and same guards: a profile, the store loaded, your own workouts seen, once): what it does with the draft:

| The draft | What happens |
|---|---|
| The clock runs and its ten minutes are not over (also when it began yesterday) | The card opens with the clock running. |
| The clock ran out while the app was closed, today | The card opens after the bell: ten minutes, not cut, stored. |
| On pause, today | The card opens on pause at the same time. |
| After the bell, today | The card opens with the result; when `saved` is not `'saved'` and there are sets it is stored again. |
| Anything else: a countdown, an earlier day (unless its clock still runs), a state of the old version (`ready`, `finish`) | `settleDraft`, then the draft is removed; the home screen shows today. When the save fails the draft stays for the next visit. |

When a card opens from a draft, the other groups are read again from the stored workout with that id (its done blocks replace the draft's), so an old copy never overwrites what was stored since. `R.since` is 0.
  - `dayCheck()`: runs when the page becomes visible and once a minute. When the day is not the one last rendered (`UI.day`, set by `render()`) and no card is open, it renders. When the page becomes visible with a card open that began on an earlier day and is on pause or after the bell, it settles it (`settleDraft` from `R`), closes it and renders. A clock that is running is left alone.
  - Test helpers: the `draft` option of `openApp` takes a session (the old draft shape: `phase: 'ready'`) or a whole draft `{ session, idx, phase, t0, leadEnd, pausedAt, pausedMs, saved }`. `jumpTo(page, ymd, hm = '10:00')` sets the frozen time to that moment and fires `visibilitychange` on the page.

- [ ] **Step 1: Extend `tests/helpers.js`**

The line that seeds the draft becomes:

```js
  if (o.draft) await page.addInitScript(seedLS, ['d330.draft.' + uid, o.draft.session ? o.draft : { session: o.draft, idx: 0, phase: 'ready', t0: 0, leadEnd: 0, pausedAt: 0, pausedMs: 0 }]);
```

Next to `forward`:

```js
/* Jump to another moment, as if the app was out of view until then and now comes back. */
async function jumpTo(page, ymd, hm = '10:00') {
  page.__now = at(ymd, hm);
  await page.clock.setFixedTime(new Date(page.__now));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
}
```

Export it, and describe both in the comment above `openApp`. A seeded draft comes back on every reload of the page while the key is empty, so a test that seeds a draft does not reload.

- [ ] **Step 2: Write the failing tests** in `tests/resume.test.js` (its header also takes `forward` and `jumpTo`)

```js
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
```

- [ ] **Step 3: Run them to see them fail**

Run: `node --test --test-reporter=spec tests/resume.test.js`
Expected: six tests FAIL: "a score that could not be stored is tried again on the next visit", the two about a card of an earlier day, "a workout left open by the old version: what is done counts, the rest is dropped", "the next morning the home screen starts clean without a reload" and "a card left on pause overnight is closed in the morning…". The other ten pass already (Task 10 puts a running, paused or finished card back and drops everything else, and the clock itself notices that its time is up); they stay as guards for the new code.

- [ ] **Step 4: Implement** `settleDraft`, `resumeDraft` and `dayCheck`, by Interfaces. `render()` sets `UI.day = todayYmd()`. `dayCheck` hangs on `visibilitychange` (next to the listener that lets the clock catch up) and on `setInterval(dayCheck, 60000)`; the interval never settles a card, it only renders a new day when no card is open.

- [ ] **Step 5: Rebuild and run everything**

Run: `python3 3-3-30/build_web.py && npm test`
Expected: every test passes.

- [ ] **Step 6: Commit**

Subject: `Keep an open card across a reload, close one left from an earlier day, and start each day clean`

---

### Task 13: Adding a workout by hand, and the welcome screen

Spec 2.10, 2.11, 4.4 (a workout added by hand for today) and the start date of section 3 for someone new.

**Files:**
- Modify: `3-3-30/index.html`: `sessionForm` (2745–2748), `dateChips` (2756), `submitSessionForm` (2835, 2849–2853), `ACT.manual` (2982), `lateStart` and `defaultProfile` (1018–1027), `viewOnboarding` (1882)
- Modify: `tests/logform.test.js`, `tests/home.test.js`
- Delete: `tests/move.test.js`

**Interfaces:**
- Consumes: `rotates`, `todaySession`, `cardModel`, `startOf`.
- Produces:
  - The sheet for a new workout is called `Add a workout` (its heading and its `aria-label`). `dateChips(cur)` gives two buttons, "Today" and "Yesterday". The letters "A B C" are in the sheet only for a profile that rotates (already so since Task 2).
  - `submitSessionForm`: a new workout dated today gets `startedAt = Date.now()`, so it is today's newest workout and the cards follow it; a new workout on another date keeps noon of that date. After saving, nothing in the profile moves: the call to `moveFor` goes.
  - `defaultProfile(nick)`: `start` is the Monday of this week, or `START` when that is later; `mode: 'same'`; `days: [1, 3, 5]` is still written, for a page of the old version. `lateStart` goes.
  - `viewOnboarding()`: under the title `Each workout is three 10-minute blocks: push, pull, legs. Do as many clean reps as you can, and beat it next time.`; under "Let’s go" `You start with three standard exercises. Tap Change on a card to pick your own.`, followed by ` Your workouts are saved on this device.` when the log is not shared.

- [ ] **Step 1: Write the failing tests**

In `tests/logform.test.js`:

```js
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
```

In `tests/home.test.js`:

```js
test('the welcome screen says how it works and where to change the exercises', async () => {
  const page = await openApp({ profile: null });
  assert.equal(await txt(page, '#view .lead'), 'Each workout is three 10-minute blocks: push, pull, legs. Do as many clean reps as you can, and beat it next time.');
  assert.equal(await txt(page, '#view form .tiny'), 'You start with three standard exercises. Tap Change on a card to pick your own. Your workouts are saved on this device.');
  assert.equal(await txt(page, '#view [data-act="importPick"]'), 'Restore a backup');
  const shared = await openApp({ profile: null, crew: [] });
  assert.equal(await txt(shared, '#view form .tiny'), 'You start with three standard exercises. Tap Change on a card to pick your own.');
});
test('Let’s go makes a profile that starts this week and does the same three every time', async () => {
  const page = await openApp({ profile: null, today: '2026-10-17' });          // a Saturday
  await page.fill('#joinNick', 'Kim');
  await page.click('#view form button[type="submit"]');
  await page.waitForFunction(() => myProfile() && document.querySelector('#view .xc'));
  assert.deepEqual(await page.evaluate(() => { const p = myProfile(); return [p.nick, p.start, startOf(S.uid), 'rotate' in p, p.mode, p.days]; }), ['Kim', '2026-10-12', '2026-10-12', false, 'same', [1, 3, 5]]);
  assert.equal(await txt(page, '#view .title'), 'Today: 3 exercises');
  assert.deepEqual(await texts(page, '.xc .ex-n'), ['Dumbbell bench press', 'Chest-supported dumbbell row', 'Goblet squat']);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.act), 'start');
  const early = await openApp({ profile: null, today: '2026-10-01' });
  assert.equal(await early.evaluate(() => defaultProfile('x').start), '2026-10-05');
});
```

Delete `tests/move.test.js`: moving a workout to the day you train no longer exists.

- [ ] **Step 2: Run them to see them fail**

Run: `node --test --test-reporter=spec tests/logform.test.js tests/home.test.js`
Expected: FAIL: the heading is "Log a past workout" and there are more than two quick dates; the profile has a `week`; today's workout is still `card`; the welcome text names the start day and "Your plan"; the new profile starts `2026-10-19`.

- [ ] **Step 3: Implement** by Interfaces. The sentence "Leave reps empty for an exercise you skipped." and everything else in the sheet stay.

- [ ] **Step 4: Rebuild and run everything**

Run: `python3 3-3-30/build_web.py && npm test`
Expected: every test passes.

- [ ] **Step 5: Commit**

Subject: `Rename the sheet to Add a workout, stop moving days after it, and rewrite the welcome text`

---

### Task 14: Remove the planning code

Spec 6 and 5 (`days` and `week` stay in stored profiles). After Task 13 nothing on screen calls this code any more.

**Files:**
- Modify: `3-3-30/index.html`: delete `plannedDows`, `weekModel`, `upcoming`, `movedDay`, `withWeekDays`, `moveFor` (1270–1350); `dayDotHtml`, `weekStripHtml` (1553–1595); `redrawUnsaved` (2405); `planSheet` and `SHEETS.plan` (2424–2447); `weekSheet` and `SHEETS.week` (2449–2484); `ACT.plan`, `ACT.week`, `ACT.weekDay`, `ACT.day`; the two lines in `saveProfile` that drop a week list (973–974); the way back to the plan in `exState`, `exSwitchTo`, `ACT.editEx` and `dismissSheet`; the comment at the top of the style block and the one above `UI`; styles (Appendix A)
- Modify: `tests/whole.test.js`, `tests/data.test.js`
- Delete: `tests/week.test.js`

**Interfaces:**
- Produces: `exState(tpl, slot)` (no third parameter); `dismissSheet()` closes the sheet. `saveProfile` stores `days` and `week` exactly as it got them. `normProfile` keeps reading both.

- [ ] **Step 1: Write the failing tests**

In `tests/whole.test.js`, add to the list of strings that must be gone: `'plannedDows'`, `'weekModel'`, `'upcoming('`, `'movedDay'`, `'withWeekDays'`, `'moveFor'`, `'weekSheet'`, `'planSheet'`, `'weekStripHtml'`, `'dayDotHtml'`, `'lateStart'`, `'Your plan'`, `'Training days'`, `'Rest day'`, `'Train anyway'`, `'.daypick'`, `'.wkd'`, `'data-act="week"'`, `'data-act="plan"'`, `'UI.tab'`, `'Today, Progress'`, `'Today and Progress'`, `'Today | Progress'`. In `visit`, take `'plan'` and `'week'` out of the `ACT` loop.

In `tests/data.test.js`, replace "saving drops a week list that belongs to another week" by:

```js
test('the old week list and training days stay in a stored profile, untouched', async () => {
  const page = await openApp({ profile: profile({ days: [2, 4], week: { mon: '2026-10-05', days: [1, 2] } }) });
  await page.evaluate(async () => { const p = clone(myProfile()); p.nick = 'Stevan'; await saveProfile(p); });
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('d330.own.local')).profile);
  assert.deepEqual([stored.nick, stored.days, stored.week], ['Stevan', [2, 4], { mon: '2026-10-05', days: [1, 2] }]);
});
```

Delete `tests/week.test.js`.

- [ ] **Step 2: Run them to see them fail**

Run: `node --test --test-reporter=spec tests/whole.test.js tests/data.test.js`
Expected: FAIL: `plannedDows is still in the source`; the stored profile has no `week`.

- [ ] **Step 3: Delete** what the Files list names. Then look for helpers that lost their last caller and delete those too: for each of `fmtLong`, `fmtShort`, `fmtWeekday`, `ICON.pencil` (the `pencil:` line), `CHEV`, `andList`, `plural`, `daysBetween`, `dayShort`, run `grep -c "<name>" 3-3-30/index.html`; a count of 1 is the definition alone, and only those go. `FOCUS_KEYS` loses `'date'` and `'from'`. Rewrite the two comments named under Files so they describe the three screens and the sheets that are left.

- [ ] **Step 4: Rebuild and run everything**

Run: `python3 3-3-30/build_web.py && npm test`
Expected: every test passes.

- [ ] **Step 5: Commit**

Subject: `Remove fixed training days, the week strip, This week and Your plan`

---

### Task 15: The whole thing

A walk through every screen in both themes and at both widths, the pictures to lay next to the drawings, and the setup notes. Nothing goes live in this task.

**Files:**
- Modify: `tests/whole.test.js` (`visit`), `tests/shots.js`, `docs/SETUP.md` (lines 45–49)

**Interfaces:**
- Consumes: everything above.
- Produces: the pictures in `shots/` (not in git) and a branch that is ready to be shown to the owner.

- [ ] **Step 1: Replace the walk in `tests/whole.test.js`**

The header also takes `forward`. Replace `sam`, `visit` and the four tests that use them by:

```js
const sam = () => ({ id: 'sam', profile: profile({ nick: 'Sam' }), sessions: threeWeeks() });
const visit = async (page, width) => {
  const ok = async where => {
    assert.deepEqual(page.__errors, [], where);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, where);
  };
  const home = () => page.waitForFunction(() => UI.screen === 'home' && document.querySelector('#view .home-nav'));
  await ok('home');
  await page.click('.xc [data-act="editEx"]'); await page.click('[data-act="exPick"]'); await page.click('[data-act="exNew"]'); await ok('exercise sheet'); await page.keyboard.press('Escape');
  await page.click('#view [data-act="swap"]'); await ok('swap sheet'); await page.keyboard.press('Escape');
  await page.click('.xc[data-slot="push"] [data-act="start"]'); await ok('countdown');
  await forward(page, 10); await page.click('.xc .pad [data-act="set"][data-n="8"]'); await ok('clock running');
  await forward(page, 60); await page.click('.clockbtn'); await ok('paused');
  await forward(page, 5); await page.click('.clockbtn'); await forward(page, 600);
  await page.waitForFunction(() => R.saved === 'saved'); await ok('time is up');
  await page.click('.xc [data-act="cardDone"]'); await ok('one done');
  await page.click('.xc[data-form="done"]'); await ok('edit sheet'); await page.keyboard.press('Escape');
  await page.click('#view [data-act="screen"][data-screen="results"]'); await ok('results');
  await page.click('#view [data-act="manual"]'); await ok('add sheet'); await page.keyboard.press('Escape');
  await page.click('#view [data-act="resTpl"][data-tpl="B"]'); await page.click('.rt-row'); await page.keyboard.press('Escape');
  await page.click('#view [data-act="person"][data-id="sam"]'); await ok('a buddy’s results');
  await page.click('.rt-row'); await ok('a buddy’s workout'); await page.keyboard.press('Escape');
  await page.click('#view [data-act="back"]'); await home();
  await page.click('#view [data-act="screen"][data-screen="settings"]');
  await page.click('#view [data-act="more"][data-more="buddy"]'); await page.click('#view [data-act="more"][data-more="how"]'); await ok('settings');
  await page.click('#view [data-act="back"]'); await home(); await ok('home again');
};

for (const dark of [false, true]) for (const width of [390, 320]) {
  test(`every screen, sheet and state of the clock opens cleanly (${dark ? 'dark' : 'light'}, ${width} px)`, async () => {
    const page = await openApp({ dark, width, profile: profile({ rotate: true }), sessions: abc(), crew: [sam()], prefs: { sound: false, lead: true } });
    await visit(page, width);
  });
}
```

(With `abc()` and turns on, today is Workout A; after the walk its push is done, so the table of Workout A has a row for today and Workout B has the row of Wed 7 Oct.)

- [ ] **Step 2: Run it**

Run: `node --test --test-reporter=spec tests/whole.test.js`
Expected: PASS. A failure here is a defect in the app: find its cause (superpowers:systematic-debugging), add a test for it to the test file of that screen, fix it. Do not weaken the walk.

- [ ] **Step 3: Rewrite the list of pictures in `tests/shots.js`**

Import `forward` as well. Replace `act`, `pushRow`, `progressA` and `SHOTS` by:

```js
const QUIET = { sound: false, lead: false };
const sam = () => ({ id: 'sam', profile: profile({ nick: 'Sam' }), sessions: threeWeeks() });
const to = screen => page => page.click(`#view [data-act="screen"][data-screen="${screen}"]`);
const start = async (page, reps = [], after = 0) => {
  await page.click('.xc[data-slot="push"] [data-act="start"]');
  for (const n of reps) await page.click(`.xc .pad [data-act="set"][data-n="${n}"]`);
  if (after) await forward(page, after);
};
const change = page => page.click('.xc[data-slot="push"] [data-act="editEx"]');

/* name, what the app opens with, what to do before the picture */
const SHOTS = [
  ['welcome', { profile: null }],
  ['home', { today: '2026-10-09', sessions: [first()] }],
  ['home-buddy', { sessions: abc(), crew: [sam()] }],
  ['home-one-done', { sessions: [first(), session('2026-10-14', 'A', [68, 0, 0])] }],
  ['home-done', { sessions: [first(), session('2026-10-14', 'A', [68, 80, 93])] }],
  ['home-turns', { profile: profile({ rotate: true }), sessions: [first()] }],
  ['card-countdown', { sessions: [first()], prefs: { sound: false, lead: true } }, page => start(page)],
  ['card-running', { sessions: [first()], prefs: QUIET }, page => start(page, [8, 8, 7], 198)],
  ['card-paused', { sessions: [first()], prefs: QUIET }, async page => { await start(page, [8, 8, 7], 198); await page.click('.clockbtn'); }],
  ['card-time-up', { sessions: [first()], prefs: QUIET }, async page => { await start(page, [8, 8, 7, 7, 6, 6, 6, 5, 5, 5, 5], 600); await page.waitForFunction(() => R.saved === 'saved'); }],
  ['card-stopped-early', { sessions: [first()], prefs: QUIET }, async page => { await start(page, [8, 8, 7], 198); await page.click('.clockbtn'); await page.click('.xc [data-act="stopSave"]'); await page.waitForFunction(() => R.saved === 'saved'); }],
  ['results', { today: '2026-10-21', sessions: threeWeeks() }, to('results')],
  ['results-buddy', { today: '2026-10-21', sessions: [first()], crew: [sam()] }, async page => { await to('results')(page); await page.click('[data-act="person"][data-id="sam"]'); }],
  ['results-turns', { profile: profile({ rotate: true }), sessions: abc() }, to('results')],
  ['settings', { sessions: [first()] }, to('settings')],
  ['settings-open', { sessions: [first()], crew: [] }, async page => { await to('settings')(page); await page.click('[data-act="more"][data-more="buddy"]'); await page.click('[data-act="more"][data-more="how"]'); }],
  ['sheet-exercise', { sessions: abc() }, change],
  ['sheet-pick', { sessions: abc() }, async page => { await change(page); await page.click('[data-act="exPick"]'); }],
  ['sheet-new', { sessions: abc() }, async page => { await change(page); await page.click('[data-act="exPick"]'); await page.fill('#exSearch', 'Landmine press'); await page.click('[data-act="exNew"]'); }],
  ['sheet-add', { sessions: abc() }, page => page.evaluate(() => ACT.manual())],
  ['sheet-edit', { sessions: [first(), session('2026-10-14', 'A', [68, 0, 0])] }, page => page.click('.xc[data-form="done"]')],
  ['sheet-swap', { profile: profile({ rotate: true }), sessions: [first()] }, page => page.click('#view [data-act="swap"]')],
];
```

In the comment above the window-height line, "the bottom switch" becomes "the page".

- [ ] **Step 4: Update `docs/SETUP.md`**, section "4. Gebruiken":

- "…in de Claude-versie **⚙ → Save backup**, op de website **⚙ → Restore**." becomes "…in de Claude-versie **⚙ → Save backup**, op de website **Settings → Restore a backup**."
- "Na het inloggen zie je de week van je maatje op **Today** en zijn scores onder **Progress**." becomes "Na het inloggen zie je de week van je maatje op het beginscherm en zijn scores onder **My results**."

- [ ] **Step 5: Make the pictures and walk through them**

Run: `npm install --no-save @fontsource-variable/archivo @fontsource-variable/instrument-sans` (once, for the real fonts), then `node tests/shots.js`
Expected: 44 files in `shots/` (22 names, light and dark) and no line "PAGE ERRORS".

Open every picture (the Read tool shows images) and lay it next to its board on the canvas: `home` next to "1 · Begin: drie kaarten", `card-running` next to "2 · Na Start: de knop is de klok", `card-paused` next to "Tik op de klok: pauze of stoppen", `card-time-up` next to "3 · Tijd om", `home-one-done` next to "4 · Eén klaar, twee te gaan", `home-done` next to "5 · Alle drie klaar", `results`, `settings`. Check against the spec's own list of differences with the drawings (section 1); anything else that differs in layout, size, colour or words is a defect: fix it in the source (a test first when it is behaviour), rebuild, rerun `npm test`. Check the dark pictures for text that is hard to read.

- [ ] **Step 6: Rebuild and run everything one last time**

Run: `python3 3-3-30/build_web.py && npm test`
Expected: every test passes, and `git status` shows nothing outside what this task changed.

- [ ] **Step 7: Commit**

Subject: `Walk every screen in the tests, renew the screenshots list and the setup notes`

Then stop. Do not merge into `main`. Report to the owner: what was built, the pictures of the main screens, the rulings made along the way, and the question whether it may go live. After a yes: superpowers:finishing-a-development-branch, and the owner reloads the page once on every device (spec 9).

---

## Appendix A: Styles

Add each block when its task says so, just above the final `@media (prefers-reduced-motion: reduce)` line. Sizes and colours come from the drawings; colours are the app's variables. "Delete" lists the old rules that go in the same task.

**Task 5.** Delete: `.sync` and its four companions (`.sync .dot`, `.sync[hidden] + .gear`, `.sync.on .dot`, the `max-width: 359px` rule for `.sync .dot`), `.gear`, the three `.tabs` rules. Change `.app` and `.toast` as shown.

```css
.app { padding-block: 0 calc(28px + env(safe-area-inset-bottom, 0px)); }
.toast { bottom: calc(24px + env(safe-area-inset-bottom, 0px)); }
.top { justify-content: space-between; }
.date { font-size: 14px; font-weight: 600; color: var(--muted); white-space: nowrap; }
.scr-top { display: flex; padding-top: 2px; }
.btn.back { min-height: 44px; padding: 0 18px 0 12px; font-size: 15px; gap: 6px; }
.home-nav { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.home-nav .btn { box-shadow: inset 0 0 0 1.5px var(--ring); font-size: 15.5px; padding-inline: 8px; }
```

**Task 6.** Delete: `.pg-charts`, `.pg-chart`, `.pg-lbl` (two rules), `.log-head` (three rules), every `.lg` and `.lg-*` rule with its `max-width` rule, every `.pw` and `.pw-*` rule, every `.sc` and `.sc-*` rule with `.spark` and its `max-width` rule, the three `.eh-*` rules, `.pr-head`.

```css
.lead-s { font-size: 15px; color: var(--ink-2); }
.res-tpl { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
.res-tpl button { min-height: 44px; border: 0; border-radius: 999px; padding: 0 6px; background: var(--surface-2); color: var(--ink-2); font-weight: 700; font-size: 14.5px; }
.res-tpl button[aria-pressed="true"] { background: var(--primary); color: var(--on-primary); }
.rt { padding: 12px 12px 4px; gap: 0; }
.rt-head, .rt-row { display: grid; grid-template-columns: 88px repeat(3, minmax(0, 1fr)); column-gap: 8px; }
.rt-head { align-items: end; padding: 0 4px 10px; }
.rt-day, .rt-grp { display: block; font-family: var(--display); font-stretch: 125%; font-size: 10.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
.rt-grp.push { color: var(--bad); } .rt-grp.pull { color: var(--pull); } .rt-grp.legs { color: var(--legs-mark); }
.rt-ex { display: block; min-width: 0; }
.rt-name { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere;
  font-family: var(--display); font-stretch: 75%; font-weight: 750; font-size: 14.5px; line-height: 1.15; }
.rt-kg { display: block; font-size: 12.5px; color: var(--ink-2); white-space: nowrap; }
.rt-row { width: 100%; align-items: center; border: 0; border-top: 1px solid var(--surface-2); background: transparent; text-align: left; padding: 6px 4px; min-height: 52px; }
.rt-date { font-weight: 700; font-size: 15px; line-height: 1.2; }
.rt-date small { display: block; font-weight: 600; font-size: 12px; color: var(--muted); }
.rt-c { font-family: var(--display); font-stretch: 75%; font-weight: 800; font-size: 25px; line-height: 1; font-variant-numeric: tabular-nums; white-space: nowrap; }
.rt-c i { font-style: normal; font-size: 13px; color: var(--good); margin-left: 3px; }
.rt-c sup { font-size: 14px; color: var(--muted); }
.rt-all { width: 100%; min-height: 44px; border-top: 1px solid var(--surface-2); border-radius: 0; color: var(--ink); }
.rt-none { padding: 14px 4px; border-top: 1px solid var(--surface-2); }
.rt-note, .rt-star { padding: 0 4px; font-size: 14.5px; color: var(--ink-2); }
.rt-note b { color: var(--good); }
@media (max-width: 359px) {
  .rt-head, .rt-row { grid-template-columns: 74px repeat(3, minmax(0, 1fr)); column-gap: 5px; }
  .rt-c { font-size: 21px; } .rt-date { font-size: 14px; } .rt-name { font-size: 13px; }
}
```

**Task 7.**

```css
.rc-head { display: grid; gap: 2px; padding: 6px 4px 0; }
.rc-head .h2 { font-size: 26px; }
.rc { padding: 14px; gap: 12px; }
.rc-one { display: grid; gap: 8px; min-width: 0; }
.rc-one + .rc-one { border-top: 1px solid var(--surface-2); padding-top: 12px; }
.rc-top { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 10px; }
.rc-top .ex-n { font-size: 16.5px; }
.rc-sub { font-size: 13px; color: var(--ink-2); }
.rc-now { font-size: 13px; color: var(--ink-2); white-space: nowrap; }
.rc-now b { margin-right: 5px; font-family: var(--display); font-stretch: 75%; font-weight: 800; font-size: 24px; line-height: 1; color: var(--ink); }
.rc-hint { padding: 0 4px; }
.pg-svg .kgmark line { stroke: var(--ink-2); stroke-width: 1; stroke-dasharray: 2 3; }
.pg-svg .kgmark text { fill: var(--ink-2); font-weight: 700; }
```

**Task 8.** Add `--dot: #8F8A7E; --good-ink: #125F33;` to `:root`, and `--dot: #7C828C; --good-ink: #8FE0B0;` to both dark blocks. Delete: the two `.toggle-row` rules, the three `details.how` rules, `.how h3`; `.how ol` becomes `.st-more ol`.

```css
.st { display: grid; gap: 6px; }
.st-h { padding: 0 4px; font-family: var(--display); font-stretch: 125%; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-2); }
.st-opts { display: grid; gap: 8px; }
.st-opt { width: 100%; min-height: 56px; border: 0; border-radius: var(--r); background: var(--surface); box-shadow: inset 0 0 0 1.5px var(--ring); text-align: left; padding: 12px 14px;
  display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 12px; }
.st-opt i { width: 22px; height: 22px; border-radius: 50%; box-shadow: inset 0 0 0 2px var(--dot); display: grid; place-items: center; }
.st-opt[aria-checked="true"], .st-opt[aria-checked="true"] i { box-shadow: inset 0 0 0 2px var(--ink); }
.st-opt[aria-checked="true"] i::after { content: ""; width: 10px; height: 10px; border-radius: 50%; background: var(--ink); }
.st-opt b, .st-row b, .st-link b { display: block; font-family: var(--display); font-stretch: 75%; font-weight: 750; font-size: 17px; line-height: 1.15; }
.st-sub { display: block; font-size: 13.5px; font-weight: 400; color: var(--ink-2); overflow-wrap: anywhere; }
.st-card { padding: 4px 14px; gap: 0; }
.st-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 10px 0; }
.st-card > * + * { border-top: 1px solid var(--surface-2); }
.st-onoff { min-height: 44px; min-width: 72px; padding: 0 14px 0 10px; border: 0; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-weight: 700; font-size: 15px;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
.st-onoff[aria-pressed="true"] { background: var(--good-wash); color: var(--good-ink); }
.st-link { width: 100%; min-height: 54px; border: 0; background: transparent; text-align: left; padding: 8px 2px; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 10px; }
.st-link[aria-expanded="true"] .chev { transform: rotate(90deg); }
.st-more { padding: 12px 2px 14px; display: grid; gap: 10px; font-size: 14px; color: var(--ink-2); }
.st-more ol { margin: 0; padding-left: 20px; display: grid; gap: 8px; }
.st-local { padding: 0 4px; }
```

**Task 9.**

```css
.xc { padding: 14px; gap: 12px; }
button.xc { width: 100%; border: 0; text-align: left; color: inherit; }
.xc-top { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px; }
.xc .plate { width: 36px; height: 36px; } .xc .plate::after { width: 11px; height: 11px; }
.xc-grp { font-family: var(--display); font-stretch: 125%; font-size: 10.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.xc-grp.push { color: var(--bad); } .xc-grp.pull { color: var(--pull); } .xc-grp.legs { color: var(--legs-mark); } .xc-grp.done { color: var(--good); }
.xc .ex-n { font-size: 18px; line-height: 1.15; }
.xc .ex-kg { font-size: 13.5px; font-weight: 400; color: var(--ink-2); white-space: normal; }
.xc .goal { gap: 2px; }
.xc .goal-l { font-size: 10.5px; }
.xc .goal-n { font-size: 28px; font-weight: 800; line-height: 1; }
.xc-btns { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
.xc-btns .btn { min-height: 50px; font-size: 16.5px; padding-inline: 12px; }
.xc-btns [data-act="editEx"] { font-size: 15px; padding-inline: 18px; }
.btn.line { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ink); }
.xc .up .btn { min-height: 44px; }
.xc-tick { width: 36px; height: 36px; border-radius: 50%; background: var(--good); color: var(--on-good); display: grid; place-items: center; }
.xc-tick svg { width: 18px; height: 18px; stroke-width: 3; }
.xc-u { font-size: 13.5px; font-weight: 400; color: var(--ink-2); }
.xc-verdict { font-size: 13.5px; font-weight: 700; color: var(--ink-2); white-space: nowrap; }
.xc-verdict.pos { color: var(--good); }
.xc[data-form="done"] .goal { grid-template-columns: auto auto; column-gap: 5px; align-items: baseline; justify-content: end; }
.xc[data-form="done"] .xc-verdict { grid-column: 1 / -1; justify-self: end; }
.head .btn.link { justify-self: start; min-height: 44px; }
.hint { padding: 0 4px; text-align: center; }
.wkc { padding: 13px 16px; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 6px 12px; }
.wkc .eyebrow { font-size: 11px; }
.wkc-row { display: flex; align-items: center; gap: 12px; min-width: 0; }
.wkc-row[data-id], .wkc-more { grid-column: 1 / -1; }
.wkc-who { flex: 0 1 96px; min-width: 0; font-size: 14px; font-weight: 650; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wkc-dots { display: flex; gap: 6px; }
.wkc-dots i { width: 14px; height: 14px; border-radius: 50%; box-shadow: inset 0 0 0 2px var(--dot); }
.wkc-dots i.on { background: var(--ink); box-shadow: none; }
.wkc-n { margin-left: auto; font-weight: 700; font-size: 15px; white-space: nowrap; }
.wkc-row[data-id]:not(.me) .wkc-who, .wkc-row[data-id]:not(.me) .wkc-n { color: var(--ink-2); }
.wkc-more { justify-self: start; min-height: 44px; font-size: 14px; }
```

**Task 10.** Delete every rule of the old workout screen: `.runner`, `.run`, `.run-top`, the five `.steps` rules, `.run-ex`, `.run-name` (also out of the `overflow-wrap` list), `.run-kg`, `.clock` with `.clock svg.led`, `.clock .status`, `.clock .prog` and `.clock .prog b`, the four `.score` rules, the four `.run-ctrl` rules, the three `.result` rules, `.ready-info`, the three `.run-label` rules, `.run-menu`, `.sum-total` (two rules), `.wo > .sum-total`, `.led.paused` and its `blink` keyframes, the `#runner` rule for the toast, the two `max-height` blocks and the `max-width: 340px` block. The `.led` rules, `.pad`, `.setlist`, `.flash` and `.kg-in` stay.

```css
.clockbtn { width: 100%; min-height: 104px; border: 0; border-radius: 36px; padding: 12px 28px; background: var(--clock-bg); box-shadow: inset 0 0 0 1.5px var(--clock-edge);
  display: grid; grid-template-rows: 58px auto auto; gap: 7px; justify-items: center; align-items: center; }
.clockbtn .ledbox { width: 100%; height: 58px; display: grid; place-items: center; }
.clockbtn svg.led { height: 100%; width: auto; max-width: 100%; display: block; }
.clockbtn .prog { display: block; width: 100%; height: 4px; border-radius: 2px; background: var(--clock-edge); overflow: hidden; }
.clockbtn .prog b { display: block; height: 100%; width: 0; background: var(--led-on); }
.clockbtn[data-phase="paused"] .prog b { background: var(--led-lead); }
.clockbtn .status { font-family: var(--display); font-stretch: 125%; font-size: 10.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: #C8CCD2; }
.clockbtn[data-phase="paused"] .status { color: #FFFFFF; }
.xc[data-form="open"] > .btn.link { justify-self: center; min-height: 44px; }
.xc-score { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 10px; }
.xc-total .total, .xc-big .total { display: inline-block; margin-right: 8px; font-family: var(--display); font-stretch: 75%; font-weight: 800; font-size: 44px; line-height: .9; font-variant-numeric: tabular-nums; }
.xc-total .xc-u, .xc-big .xc-u { font-size: 16px; font-weight: 600; color: var(--ink); }
.xc-past { margin-left: auto; }
.xc-how { font-size: 15.5px; font-weight: 600; }
.xc .pad { gap: 8px; }
.xc .pad button { min-height: 52px; border-radius: 12px; background: var(--bg); box-shadow: inset 0 0 0 1px var(--line); font-stretch: 75%; font-size: 22px; }
.xc .pad button.last { box-shadow: inset 0 0 0 2.5px var(--ink); }
.xc-setrow { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0 10px; }
.xc-sets { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; min-width: 0; font-size: 15px; color: var(--ink-2); }
.xc-sets .setlist { min-height: 0; font-size: 15px; }
.xc-setrow .btn.link { min-height: 44px; font-size: 15px; color: var(--ink); }
.xc-result { border-radius: var(--r-lg); padding: 12px 16px 14px; background: var(--surface-2); display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: baseline; gap: 6px 10px; }
.xc-result .eyebrow { grid-column: 1 / -1; }
.xc-result.good { background: var(--good-wash); }
.xc-result.good .eyebrow, .xc-result.good .xc-verdict { color: var(--good-ink); }
.xc-big .total { font-size: 48px; }
.xc-result .xc-verdict { font-size: 15px; white-space: normal; text-align: right; }
.xc-saved { font-size: 15px; }
.xc[data-form="wait"] { grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 10px 14px; }
.xc[data-form="wait"] .plate { width: 28px; height: 28px; } .xc[data-form="wait"] .plate::after { width: 9px; height: 9px; }
.xc[data-form="wait"] .ex-n { font-size: 16.5px; }
.xc-sub { font-size: 13px; color: var(--ink-2); }
.xc-goal { font-size: 13.5px; color: var(--ink-2); white-space: nowrap; }
.xc-goal b { font-family: var(--display); font-stretch: 75%; font-weight: 800; font-size: 19px; color: var(--ink); }
@media (max-height: 620px) {
  .clockbtn { min-height: 84px; grid-template-rows: 44px auto auto; padding-block: 8px; } .clockbtn .ledbox { height: 44px; }
  .xc[data-form="open"] { gap: 8px; } .xc .pad { gap: 6px; } .xc .pad button { min-height: 44px; }
}
```

**Task 11.**

```css
.xc-stop { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.xc-stop .btn { min-height: 48px; padding-inline: 8px; font-size: 15px; }
```

**Task 14.** Delete: the three `.daypick` rules and their `max-width` rule; every `.wk` and `.wk-*` rule; every `.wd` rule; every `.wkd` and `.wkd-*` rule; the four `.switch` rules; `.plan-card`, `.plan-card .h2`, the two `.plan-when` rules and the three `.plan-row` rules; `.wo > .btn.xl`, `.wo-next`, `.wo-note`, the two `.wo-links` rules, `.after`, the two `.next-line` rules; `.sheet-sub`; the two `.wk-foot` rules. `.wo`, `.wo .ex-list`, `.wo .ex-list li + li` and `.wo .ex-row` stay: the sheet that shows a buddy's workout uses them.
