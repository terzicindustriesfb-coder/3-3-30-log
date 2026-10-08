# 3-3-30 Log Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the screens around the workout timer so the app answers three questions at a glance: what do I do today, what do I have to beat, and how is my week (and my buddy's).

**Architecture:** The app stays one vanilla-JS file, `3-3-30/index.html`. The rules (what counts, next letter, week model, moving a workout, verdicts, names) become small functions in the existing "Domain logic" section that read the store and return plain data; the views only render what those functions return. Two screens ("Today", "Progress") behind a bottom switch; everything else is a bottom sheet, one at a time.

**Tech Stack:** HTML/CSS/JS in a single file, no libraries. Tests: Node 22 test runner (`node:test`) driving Chromium through `playwright` 1.56.0, with a fixed clock and seeded data. `python3 3-3-30/build_web.py` builds the website copy in `docs/`.

**Spec:** `superpowers/specs/2026-10-08-herontwerp-design.md` (Dutch; section numbers below, like "spec 5.3", refer to it). Screen designs: canvas "3-3-30 Log herontwerp" (the spec wins where they differ). Read the spec before starting a task.

## Global Constraints

- Work on branch `redesign` only. Never commit to `main`, do not rebuild `docs/` before Task 20, and never merge or deploy: going live needs the owner's explicit go.
- Every commit message ends with these two lines, and every task ends with `git push`:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_013Ct2BQNhzh2r6E25BnbKZ2`
- The source is one file: `3-3-30/index.html`. No new libraries, no build step for the source. `docs/claude-shim.js` and `docs/firestore.rules` do not change. The crew code never appears in the repo.
- UI copy is English and exact: use the strings in this plan character for character, including `’` (curly apostrophe), `·` (middle dot), `−` (U+2212 minus in "▼ −3" and "−5 kg"), `▲`, `▼` and `×`.
- Colours and type: only the existing CSS variables and font stacks, plus one new variable `--ring` (Appendix A). New components must read correctly in the dark theme.
- Every tappable control is at least 44 px high (the small segmented switches "Me | name" and "A B C" keep their 36 px), has an accessible name, and closing a sheet puts focus back on the control that opened it.
- The three new profile fields are optional. A profile without them must behave exactly as before, and a stored object must never contain `undefined`.
- Design width is 390 px. Nothing may scroll sideways at 320 px.
- Test first: write the test, see it fail for the stated reason, then write the code. Run the whole suite (`npm test`) before every commit.
- Line numbers in this plan refer to commit `67c86b5` and drift as tasks land. Find code by function name.

## Review Focus

Inputs the spec implies but does not spell out, most likely to bite first. Each has a test in the task named.

1. **Sunday and the turn of the week.** Sunday is day 0 in JavaScript but the seventh day of the week here; a week list left over from last week must not leak into Monday. Expected: Sunday is the last column, and on Monday the usual days apply again. Test in Task 4 ("Sunday closes the week…") and Task 12.
2. **Bodyweight and dumbbell-pair exercises in the number-first rows.** Weight 0, minus kilos for assistance, and "2 × 10 kg" stored as 20. Expected: "bodyweight", "2 × 10 kg", and verdicts like "+4 kg" / "−10 kg" that match what the person changed. Tests in Task 9 and Task 10.
3. **Deleting or editing the newest workout.** Nothing about the rotation or the day's state is stored, so both must fall back on their own. Expected: the previous letter is next again and Today shows the workout again. Tests in Task 3 and Task 10.
4. **Long names on a narrow phone.** A 40-character name next to a 42 px number. Expected: the name wraps, the page never scrolls sideways at 320 px. Tests in Task 10 and Task 17.
5. **A buddy whose data is thin.** No nickname, no workouts yet, workouts still loading, or a profile that fails validation. Expected: a quiet row or no row, never an error. Test in Task 7.

## Conventions

- **Where code goes.** Rule functions: the "Domain logic" section, after `planFor`. Views replace the function they supersede, in place. Sheets: the "Sheets" section. Handlers: the `ACT` object. Styles: Appendix A lists the CSS per task; add each block just above the final `@media (prefers-reduced-motion: reduce)` line.
- **Test files.** `tests/<area>.test.js`, CommonJS. Every file starts with:

```js
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at } = require('./helpers');
after(closeAll);
```

- **Running tests.** One file: `node --test --test-reporter=spec tests/<area>.test.js`. Everything: `npm test`.
- **Reaching the app from a test.** Top-level functions and constants of the page (`S`, `UI`, `ACT`, `myProfile`, …) are callable inside `page.evaluate`. Open a sheet with a click when its link exists in that task, otherwise with `page.evaluate(() => ACT.name())`.
- **Calendar used in the tests** (October 2026): Mon 5, Wed 7, Fri 9 · Mon 12, Tue 13, Wed 14, Thu 15, Fri 16, Sat 17, Sun 18 · Mon 19, Wed 21.
- **Fixtures** (Task 1): `first()` is the owner's real first workout (Mon 5 Oct, Workout A, 62 / 77 / 85 reps at 35 / 65 / 75 kg). `abc()` is A on Mon 5, B on Wed 7, C on Mon 12, so the next letter is A. `threeWeeks()` is Workout A on Mon 5, Mon 12 and Mon 19 with rising scores and a heavier leg press on the 19th.

---

### Task 1: Test harness and "what counts"

**Files:**
- Create: `package.json`, `.gitignore`, `tests/helpers.js`, `tests/counting.test.js`
- Modify: `3-3-30/index.html` (`trainings`, `history`, `shownSessions`; lines 915–935 and 1325–1329)

**Interfaces:**
- Produces (tests): `openApp(opts) → Promise<Page>`, `closeAll()`, `profile(over)`, `session(date, tpl, reps, opts)`, `first()`, `abc()`, `threeWeeks()`, `txt(page, sel)`, `texts(page, sel)`, `at(ymd, hm)`; `page.__errors` (array of uncaught page errors).
- Produces (app): `finished(id, today = todayYmd()) → (s) => boolean`; `trainings(id, today)`, `history(id, exKey, beforeSessionId)` and `shownSessions(pid)` now follow spec section 3.

- [ ] **Step 1: Add the package files**

`package.json`:

```json
{
  "name": "3-3-30-log",
  "private": true,
  "scripts": { "test": "node --test --test-concurrency=4 --test-reporter=spec \"tests/*.test.js\"" },
  "devDependencies": { "playwright": "1.56.0" }
}
```

`.gitignore`:

```
node_modules/
shots/
```

Run: `npm install` (Chromium is already on the machine; `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` is set). Commit `package-lock.json` too.

- [ ] **Step 2: Write `tests/helpers.js`**

```js
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
let server = null, base = '', browser = null;

async function boot() {
  if (browser) return;
  server = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (err, buf) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'content-type': file.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' });
      res.end(buf);
    });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
}
async function closeAll() {
  if (browser) await browser.close();
  if (server) server.close();
  browser = server = null;
}

const PLANS = {
  A: { push: 'schouderdrukken', pull: 'kabelroeien', legs: 'c-seated-leg-press' },
  B: { push: 'db-schouderdrukken', pull: 'optrekken', legs: 'db-rdl' },
  C: { push: 'schuin-db', pull: 'pendlay', legs: 'reverse-lunge' },
};
const KG = { A: [35, 65, 75], B: [20, 0, 32], C: [24, 40, 16] };
const BW = { optrekken: true };
const SLOTS = ['push', 'pull', 'legs'];
const clone = o => JSON.parse(JSON.stringify(o));
/* Milliseconds for a local date and time in the Netherlands (summer time). */
const at = (ymd, hm = '10:00') => new Date(`${ymd}T${hm}:00+02:00`).getTime();

/* The owner's profile: Mon/Wed/Fri, Workout A as he set it up, one exercise of his own. */
function profile(over = {}) {
  return Object.assign({
    v: 1, nick: 'Steef', joined: at('2026-09-28'), start: '2026-10-05', days: [1, 3, 5], mode: 'abc', plans: clone(PLANS),
    custom: [{ k: 'c-seated-leg-press', n: 'Seated leg press', s: 'legs', eq: 'machine', step: 5, start: 30, bw: false, dbl: false }],
    weights: { schouderdrukken: 35, kabelroeien: 65, 'c-seated-leg-press': 75 },
  }, over);
}
/* A workout. reps = [push, pull, legs]; 0 or null = skipped.
   opts: id, status ('done' | 'active'), kg [3], cut [3 booleans], ex [3 exercise keys], hm ('09:00'). */
function session(date, tpl, reps, opts = {}) {
  const ex = opts.ex || SLOTS.map(s => PLANS[tpl][s]);
  const kg = opts.kg || KG[tpl];
  const t = at(date, opts.hm || '09:00');
  const blocks = SLOTS.map((slot, i) => {
    const r = reps[i] || 0, cut = !!(opts.cut && opts.cut[i]);
    return { slot, ex: ex[i], name: opts.names ? opts.names[i] : ex[i], kg: kg[i], bw: !!BW[ex[i]], sets: r ? [{ r, kg: kg[i], t: 300 }] : [],
      total: r, dur: r ? (cut ? 240 : 600) : 0, done: r > 0, skipped: !r, cut };
  });
  const status = opts.status || 'done';
  return { v: 1, id: opts.id || `s-${date}-${tpl}`, date, tpl, status, paused: false, manual: false,
    startedAt: t, updatedAt: t, endedAt: status === 'done' ? t + 1800e3 : 0, blocks, feel: 0, note: '' };
}
const first = () => session('2026-10-05', 'A', [62, 77, 85]);
const abc = () => [first(), session('2026-10-07', 'B', [30, 8, 40]), session('2026-10-12', 'C', [40, 40, 40])];
const threeWeeks = () => [first(), session('2026-10-12', 'A', [65, 78, 88]), session('2026-10-19', 'A', [68, 80, 79], { kg: [35, 65, 80] })];

/* Runs in the page: an in-memory stand-in for window.claude (the shared log). */
function fakeClaude(seed) {
  const store = new Map(Object.entries(seed.docs));
  const subs = new Map();
  const copy = o => JSON.parse(JSON.stringify(o));
  const snap = col => ({ metadata: { fromCache: false }, docs: [...store]
    .filter(([p]) => p.startsWith(col + '/') && !p.slice(col.length + 1).includes('/'))
    .map(([p, d]) => ({ id: p.slice(col.length + 1), data: () => copy(d) })) });
  const emit = p => { const col = p.slice(0, p.lastIndexOf('/')); (subs.get(col) || []).forEach(fn => setTimeout(() => fn(snap(col)), 0)); };
  const db = {
    doc: p => ({
      get: async () => ({ exists: store.has(p), data: () => copy(store.get(p)) }),
      set: async d => { store.set(p, copy(d)); emit(p); },
      delete: async () => { store.delete(p); emit(p); },
    }),
    collection: col => ({ onSnapshot(next) {
      if (!subs.has(col)) subs.set(col, new Set());
      subs.get(col).add(next); setTimeout(() => next(snap(col)), 0);
      return () => subs.get(col).delete(next);
    } }),
  };
  const user = { id: async () => seed.uid, me: async () => ({ name: seed.name, avatarUrl: '' }), can: async () => true, profiles: async () => ({}) };
  window.__saved = null;
  const downloads = { save: async f => { window.__saved = f; } };
  window.claude = { use: async n => (n === 'db' ? db : n === 'user' ? user : n === 'downloads' ? downloads : null) };
}

/* Open the app with a fixed date and seeded data.
   today 'YYYY-MM-DD' ('2026-10-14'), time ('10:00'), profile (object, or null for a first visit), sessions ([]),
   crew (null = this-device mode; an array of { id, profile, sessions } = shared mode, own id 'me'),
   draft (a session left open on this device), dark (false), width (390), height (844). */
async function openApp(opts = {}) {
  await boot();
  const o = Object.assign({ today: '2026-10-14', time: '10:00', profile: profile(), sessions: [], crew: null, draft: null, dark: false, width: 390, height: 844 }, opts);
  const ctx = await browser.newContext({ viewport: { width: o.width, height: o.height }, timezoneId: 'Europe/Amsterdam', locale: 'en-GB', colorScheme: o.dark ? 'dark' : 'light' });
  const page = await ctx.newPage();
  page.__errors = [];
  page.on('pageerror', e => page.__errors.push(String(e)));
  await page.route('**/*', r => (r.request().url().startsWith(base) ? r.continue() : r.abort()));
  await page.clock.setFixedTime(new Date(`${o.today}T${o.time}:00+02:00`));
  const uid = o.crew ? 'me' : 'local';
  const seedLS = ([k, v]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify(v)); };
  if (o.crew) {
    const docs = {};
    if (o.profile) docs['members/me'] = o.profile;
    for (const s of o.sessions) docs['members/me/sessions/' + s.id] = s;
    for (const b of o.crew) { docs['members/' + b.id] = b.profile; for (const s of b.sessions || []) docs[`members/${b.id}/sessions/${s.id}`] = s; }
    await page.addInitScript(fakeClaude, { uid, name: 'Steef', docs });
  } else if (o.profile) {
    await page.addInitScript(seedLS, ['d330.own.local', { profile: o.profile, sessions: Object.fromEntries(o.sessions.map(s => [s.id, s])), hidden: [], dirty: [], profileDirty: false }]);
  }
  if (o.draft) await page.addInitScript(seedLS, ['d330.draft.' + uid, { session: o.draft, idx: 0, phase: 'ready', t0: 0, leadEnd: 0, pausedAt: 0, pausedMs: 0 }]);
  await page.goto(base + '/3-3-30/index.html');
  await page.waitForFunction(() => !document.querySelector('#view .skeleton'));
  await page.waitForFunction(() => S.mode !== 'shared' || [...S.members.values()].every(m => !m.profile || m.seen));
  return page;
}
const squash = t => t.replace(/\s+/g, ' ').trim();
const txt = async (page, sel) => squash(await page.locator(sel).first().textContent());
const texts = async (page, sel) => (await page.locator(sel).allTextContents()).map(squash);

module.exports = { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at, PLANS };
```

- [ ] **Step 3: Write the failing tests** in `tests/counting.test.js` (after the standard header)

```js
test('opens on this device with the seeded profile', async () => {
  const page = await openApp({ sessions: [first()] });
  assert.deepEqual(await page.evaluate(() => [S.mode, myProfile().nick, todayYmd(), sessionsOf(S.uid).length]), ['local', 'Steef', '2026-10-14', 1]);
});
test('opens in shared mode with a buddy', async () => {
  const page = await openApp({ crew: [{ id: 'bud', profile: profile({ nick: 'Sam' }), sessions: [first()] }] });
  assert.deepEqual(await page.evaluate(() => [S.mode, S.uid, S.members.get('bud').profile.nick, sessionsOf('bud').length]), ['shared', 'me', 'Sam', 1]);
});
test('a workout started today and not finished does not count', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-14', 'B', [10, 0, 0], { status: 'active' })] });
  assert.deepEqual(await page.evaluate(() => trainings(S.uid).map(s => s.id)), ['s-2026-10-05-A']);
  assert.equal(await page.evaluate(() => history(S.uid, 'db-schouderdrukken').length), 0);
});
test('an unfinished workout from an earlier day counts', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-12', 'B', [10, 0, 0], { status: 'active' })] });
  assert.equal(await page.evaluate(() => trainings(S.uid).length), 2);
});
test('the workout open on this device does not count, whatever its date', async () => {
  const open = session('2026-10-13', 'B', [10, 0, 0], { status: 'active', id: 'd1' });
  const page = await openApp({ sessions: [first(), open], draft: open });
  assert.deepEqual(await page.evaluate(() => trainings(S.uid).map(s => s.id)), ['s-2026-10-05-A']);
  assert.equal(await page.evaluate(() => shownSessions(S.uid).length), 1);
});
test('a practice workout stays out of the count but in the log', async () => {
  const page = await openApp({ sessions: [session('2026-09-30', 'A', [5, 5, 5])] });
  assert.deepEqual(await page.evaluate(() => [trainings(S.uid).length, shownSessions(S.uid).length]), [0, 1]);
});
```

- [ ] **Step 4: Run and see the rule tests fail**

Run: `node --test --test-reporter=spec tests/counting.test.js`
Expected: the two "opens…" tests pass (the harness works); "started today and not finished" fails with `['s-2026-10-05-A', 's-2026-10-14-B']`, and "open on this device" fails the same way.

- [ ] **Step 5: Implement the counting rule** (spec section 3)

- `finished(id, today = todayYmd())` returns a predicate that is true for a session with at least one done block (`countsAsTraining`) that is not the draft on this device (`id === S.uid` and `loadDraft()?.session.id === s.id`) and for which `s.status === 'done' || s.date < today`. Read the draft once per call of `finished`, not once per session.
- `trainings(id, today)` = `sessionsOf(id)` filtered by `finished(id, today)` and `!isTrial(s, id)`.
- `history(id, exKey, beforeSessionId)`: keep the early `break` at `beforeSessionId`, and skip every session that fails `finished(id)` or is a trial.
- `shownSessions(pid)` = `sessionsOf(pid)` filtered by `finished(pid)` (practice workouts included). The old `busyElsewhere` rule goes.

- [ ] **Step 6: Run everything**

Run: `npm test`
Expected: 6 tests pass.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .gitignore tests/helpers.js tests/counting.test.js 3-3-30/index.html
git commit -m "Add the test harness and one rule for which workouts count"
git push
```

---

### Task 2: Three optional profile fields

**Files:**
- Modify: `3-3-30/index.html` (`normProfile` 570–589, `saveProfile` 837–849, `exInfo` / `allExercises` / `exName` 892–900)
- Test: `tests/data.test.js`

**Interfaces:**
- Consumes: Task 1 helpers.
- Produces: profile fields `names: { [libKey]: string }`, `eqs: { [libKey]: 'barbell'|'dbpair'|'db'|'machine'|'bw' }`, `week: { mon: 'YYYY-MM-DD', days: number[] }`. `exInfo(key, profile)` returns the library entry with the person's name and weight type laid over it; `exName` and `allExercises` follow.

- [ ] **Step 1: Write the failing tests** in `tests/data.test.js`

```js
test('an old profile comes through without new keys', async () => {
  const page = await openApp();
  assert.deepEqual(await page.evaluate(() => Object.keys(normProfile(myProfile())).sort()),
    ['custom', 'days', 'joined', 'mode', 'nick', 'plans', 'start', 'v', 'weights']);
});
test('names, weight types and the week list are kept when valid, dropped when not', async () => {
  const page = await openApp();
  const out = await page.evaluate(() => normProfile(Object.assign({}, myProfile(), {
    names: { schouderdrukken: '  Shoulder   press ', kabelroeien: 'Seated cable row', nope: 'x', squat: 'x'.repeat(60) },
    eqs: { schouderdrukken: 'machine', kabelroeien: 'machine', squat: 'laser', 'c-seated-leg-press': 'barbell' },
    week: { mon: '2026-10-12', days: [5, 1, 1, 9, 'x', 2] },
  })));
  assert.deepEqual(out.names, { schouderdrukken: 'Shoulder press', squat: 'x'.repeat(40) });
  assert.deepEqual(out.eqs, { schouderdrukken: 'machine' });
  assert.deepEqual(out.week, { mon: '2026-10-12', days: [1, 2, 5] });
});
test('a week that does not start on a Monday is dropped, an empty week is kept', async () => {
  const page = await openApp();
  const out = await page.evaluate(() => [
    'week' in normProfile(Object.assign({}, myProfile(), { week: { mon: '2026-10-13', days: [1] } })),
    normProfile(Object.assign({}, myProfile(), { week: { mon: '2026-10-12', days: [] } })).week,
  ]);
  assert.deepEqual(out, [false, { mon: '2026-10-12', days: [] }]);
});
test('exInfo lays your name and weight type over the list', async () => {
  const page = await openApp();
  const out = await page.evaluate(() => {
    const a = exInfo('schouderdrukken', { names: { schouderdrukken: 'Shoulder press' }, eqs: { schouderdrukken: 'machine' } });
    const b = exInfo('schouderdrukken', { eqs: { schouderdrukken: 'dbpair' } });
    const mine = { names: { schouderdrukken: 'Shoulder press' } };
    return [[a.n, a.eq, a.step, a.start, !!a.dbl, !!a.bw], [b.n, b.step, b.start, !!b.dbl], exInfo('squat', {}).step,
      exName('schouderdrukken', mine), blockName({ ex: 'schouderdrukken', name: 'Overhead press' }, mine)];
  });
  assert.deepEqual(out, [['Shoulder press', 'machine', 5, 25, false, false], ['Overhead press', 4, 20, true], 5, 'Shoulder press', 'Shoulder press']);
});
test('saving drops a week list that belongs to another week', async () => {
  const stale = await openApp({ profile: profile({ week: { mon: '2026-10-05', days: [1, 2] } }) });
  assert.equal(await stale.evaluate(async () => { await saveProfile(clone(myProfile())); return 'week' in myProfile(); }), false);
  const fresh = await openApp({ profile: profile({ week: { mon: '2026-10-12', days: [1, 2] } }) });
  assert.deepEqual(await fresh.evaluate(async () => { await saveProfile(clone(myProfile())); return myProfile().week; }), { mon: '2026-10-12', days: [1, 2] });
});
test('a renamed exercise shows under its new name', async () => {
  const page = await openApp({ sessions: abc(), profile: profile({ names: { schouderdrukken: 'Shoulder press' } }) });
  assert.equal(await txt(page, '#view .ex-row .ex-n'), 'Shoulder press');
});
test('a backup carries the new fields, and an old backup still restores', async () => {
  const mine = profile({ names: { schouderdrukken: 'Shoulder press' }, eqs: { schouderdrukken: 'machine' }, week: { mon: '2026-10-12', days: [1, 2, 5] } });
  const src = await openApp({ crew: [], profile: mine, sessions: [first()] });
  await src.evaluate(() => exportData('json'));
  const backup = await src.evaluate(() => window.__saved.data);
  assert.deepEqual(JSON.parse(backup).profile.names, { schouderdrukken: 'Shoulder press' });
  const restore = json => async page => page.evaluate(async j => { await importData(new File([j], 'b.json', { type: 'application/json' })); return [myProfile().names || null, trainings(S.uid).length]; }, json);
  assert.deepEqual(await restore(backup)(await openApp()), [{ schouderdrukken: 'Shoulder press' }, 1]);
  const old = JSON.stringify({ app: '3-3-30-logboek', v: 1, profile: profile(), sessions: [first()] });
  assert.deepEqual(await restore(old)(await openApp()), [null, 1]);
  const busy = await openApp({ sessions: [session('2026-10-07', 'B', [30, 8, 40])], profile: profile({ names: { kabelroeien: 'Cable row' } }) });
  assert.deepEqual(await restore(backup)(busy), [{ kabelroeien: 'Cable row' }, 2]);
});
```

- [ ] **Step 2: Run and see them fail**

Run: `node --test --test-reporter=spec tests/data.test.js`
Expected: the first test passes; the others fail (`out.names` is `undefined`, `a.n` is "Overhead press", and so on).

- [ ] **Step 3: Extend `normProfile(p)`**

Add the three keys to the returned object only when they hold something, so an old profile stays byte-identical:
- `names`: for each entry (at most 100) whose key is a `LIB` key: the value as a string, trimmed, inner whitespace collapsed to one space, cut to 40 characters; drop it when empty or exactly equal to the library name.
- `eqs`: for each entry whose key is a `LIB` key and whose value is a key of `EQUIP`; drop it when it equals that library entry's own type (`eqOf`).
- `week`: keep `{ mon, days }` when `validYmd(mon)` and `mondayOf(mon) === mon`; `days` = the integers 0–6 from the input, unique, ascending (an empty list is valid). Otherwise leave the key out.

- [ ] **Step 4: Drop a stale week on save**

In `saveProfile(p)`, after `normProfile`, delete `clean.week` when `clean.week.mon !== mondayOf(todayYmd())`.

- [ ] **Step 5: Lay the fields over the library in `exInfo(key, profile)`**

For a `LIB` key return a copy of the entry with `n = profile.names[key]` when set, and, when `profile.eqs[key]` is set, `eq` plus `step`, `bw` and `dbl` from `EQUIP[eq]`; `start` becomes `EQUIP[eq].start` only when `bw` or `dbl` differs from the library entry, otherwise it stays. Without either field return the library entry itself. `exName(key, profile, fallback)` returns `exInfo(key, profile).n` for a known key. `allExercises(profile)` returns the library mapped through `exInfo`, then the person's own exercises.

- [ ] **Step 6: Run everything**

Run: `npm test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add 3-3-30/index.html tests/data.test.js
git commit -m "Add optional profile fields: own names, weight types and this week's days"
git push
```

---

### Task 3: A/B/C runs on

**Files:**
- Modify: `3-3-30/index.html` (`templateFor` 1058–1063 and its callers: `cardState`, `newSession`, `ACT.manual`, `syncDateChips`)
- Test: `tests/rotation.test.js`

**Interfaces:**
- Consumes: `trainings(id)` (Task 1).
- Produces: `const TPLS = ['A', 'B', 'C']`; `nextTpl(id, upTo) → 'A'|'B'|'C'` — the letter after the newest training that counts, considering only trainings dated on or before `upTo` when given; `'A'` without trainings and for a profile whose `mode` is not `'abc'`. `templateFor` no longer exists.

- [ ] **Step 1: Write the failing tests** in `tests/rotation.test.js`

```js
const next = (page, upTo) => page.evaluate(d => nextTpl(S.uid, d || undefined), upTo || '');

test('the first workout is A', async () => {
  assert.equal(await next(await openApp()), 'A');
});
test('B follows A, also across a weekend', async () => {
  assert.equal(await next(await openApp({ sessions: [first()] })), 'B');
});
test('A follows C', async () => {
  assert.equal(await next(await openApp({ sessions: abc() })), 'A');
});
test('after a swapped workout the order continues from that letter', async () => {
  assert.equal(await next(await openApp({ sessions: [first(), session('2026-10-07', 'C', [40, 40, 40])] })), 'A');
});
test('a date limits which workouts are looked at', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-09', 'B', [30, 8, 40])] });
  assert.deepEqual([await next(page, '2026-10-07'), await next(page, '2026-10-09')], ['B', 'C']);
});
test('a workout still in progress today does not move the letter', async () => {
  assert.equal(await next(await openApp({ sessions: [first(), session('2026-10-14', 'B', [10, 0, 0], { status: 'active' })] })), 'B');
});
test('same every time has no order', async () => {
  assert.equal(await next(await openApp({ sessions: [first()], profile: profile({ mode: 'same' }) })), 'A');
});
test('deleting the newest workout steps the letter back', async () => {
  const page = await openApp({ sessions: abc() });
  await page.evaluate(() => deleteSession('s-2026-10-12-C'));
  assert.equal(await next(page), 'C');
});
test('the main screen offers the next letter', async () => {
  const page = await openApp({ sessions: [first()] });
  assert.equal(await txt(page, '#view .title'), 'Workout B');
});
test('logging a past workout suggests the letter for its date', async () => {
  const page = await openApp({ sessions: [first(), session('2026-10-09', 'B', [30, 8, 40])] });
  await page.evaluate(() => ACT.manual());
  assert.equal(await txt(page, '#sheet [data-act="formTpl"][aria-pressed="true"]'), 'C');
  await page.fill('#sDate', '2026-10-07');
  assert.equal(await txt(page, '#sheet [data-act="formTpl"][aria-pressed="true"]'), 'B');
});
```

- [ ] **Step 2: Run and see them fail**

Run: `node --test --test-reporter=spec tests/rotation.test.js`
Expected: `ReferenceError: nextTpl is not defined` in the function tests; the main-screen test fails with "Workout A" (the weekly reset).

- [ ] **Step 3: Implement `nextTpl(id, upTo)`** as described under Interfaces, reading the mode from `S.members.get(id)?.profile`.

- [ ] **Step 4: Replace `templateFor`**

Delete `templateFor`. `cardState`: `UI.tpl || nextTpl(S.uid)` when there is no draft. `newSession(tpl)`: `tpl || nextTpl(S.uid)`. `ACT.manual`: `UI.tpl || nextTpl(S.uid)`. `syncDateChips`: `nextTpl(S.uid, v)` for the date in the form.

- [ ] **Step 5: Run everything**

Run: `npm test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add 3-3-30/index.html tests/rotation.test.js
git commit -m "Let A/B/C run on from the last workout instead of restarting every Monday"
git push
```

---

### Task 4: The week model

**Files:**
- Modify: `3-3-30/index.html` (new functions after `planFor`; `nextTrainingDay` 1067–1076 and its callers `cardState`, `finishAndSave`)
- Test: `tests/week.test.js`

**Interfaces:**
- Consumes: `trainings(id, today)`, `nextTpl(id)`, profile field `week`.
- Produces:
  - `plannedDows(profile, mon, today = todayYmd()) → number[]` — `profile.week.days` when `profile.week.mon === mon` and `mon` is the Monday of `today`; otherwise `profile.days` (or `[1, 3, 5]`).
  - `weekModel(id, today = todayYmd()) → { mon, done, planned, days }` — `days` is seven entries from Monday: `{ date, dow, planned, n, tpl, state }`. `n` = trainings that count on that date; `tpl` = the letter of the last of them, else `null`; `planned` = the weekday is in the week's list, the date is on or after the start date, and (the date is on or after the day the person joined, or `n > 0`); `state` = `'done'` when `n > 0`, else for today `'today'` (planned) or `'todayRest'`, for later dates `'planned'` or `'rest'`, for earlier dates `'missed'` or `'rest'`. `done` = the number of trainings in the week; `planned` = the number of planned days.
  - `upcoming(id, n = 3, today = todayYmd()) → [{ date, tpl }]` — the next `n` dates, from today (from the start date when that is later), that are planned and have no training; looks at most 28 days ahead. The first letter is `UI.tpl` when `id === S.uid` and a letter is chosen, otherwise `nextTpl(id)`; each next date gets the next letter. With `mode !== 'abc'` every `tpl` is `'A'`.
  - `nextTrainingDay` no longer exists.

- [ ] **Step 1: Write the failing tests** in `tests/week.test.js`

```js
const states = (page, id = 'local') => page.evaluate(i => weekModel(i === 'local' ? S.uid : i).days.map(d => d.state), id);
const model = page => page.evaluate(() => { const w = weekModel(S.uid); return [w.mon, w.done, w.planned]; });

test('done, today and planned', async () => {
  const page = await openApp({ sessions: abc() });
  assert.deepEqual(await states(page), ['done', 'rest', 'today', 'rest', 'planned', 'rest', 'rest']);
  assert.deepEqual(await model(page), ['2026-10-12', 1, 3]);
  assert.equal(await page.evaluate(() => weekModel(S.uid).days[0].tpl), 'C');
});
test('a missed day and a rest day today', async () => {
  assert.deepEqual(await states(await openApp({ today: '2026-10-15', sessions: abc() })), ['done', 'rest', 'missed', 'todayRest', 'planned', 'rest', 'rest']);
});
test('this week’s own list wins, another week’s list is ignored', async () => {
  const own = await openApp({ today: '2026-10-13', sessions: abc(), profile: profile({ week: { mon: '2026-10-12', days: [1, 2, 5] } }) });
  assert.deepEqual(await states(own), ['done', 'today', 'rest', 'rest', 'planned', 'rest', 'rest']);
  const old = await openApp({ today: '2026-10-13', sessions: abc(), profile: profile({ week: { mon: '2026-10-05', days: [2] } }) });
  assert.deepEqual(await states(old), ['done', 'todayRest', 'planned', 'rest', 'planned', 'rest', 'rest']);
});
test('nothing is planned before the start date', async () => {
  const page = await openApp({ profile: profile({ start: '2026-10-19' }) });
  assert.deepEqual(await states(page), ['rest', 'rest', 'todayRest', 'rest', 'rest', 'rest', 'rest']);
  assert.deepEqual((await model(page)).slice(1), [0, 0]);
});
test('in a first week, days before joining are rest unless trained', async () => {
  const late = profile({ joined: at('2026-10-14') });
  const none = await openApp({ today: '2026-10-15', profile: late });
  assert.deepEqual(await states(none), ['rest', 'rest', 'missed', 'todayRest', 'planned', 'rest', 'rest']);
  assert.equal((await model(none))[2], 2);
  const some = await openApp({ today: '2026-10-15', profile: late, sessions: [session('2026-10-12', 'C', [40, 40, 40])] });
  assert.deepEqual([(await states(some))[0], (await model(some))[2]], ['done', 3]);
});
test('the counter has no ceiling', async () => {
  const four = [session('2026-10-12', 'A', [1, 1, 1]), session('2026-10-14', 'B', [1, 1, 1]), session('2026-10-16', 'C', [1, 1, 1]), session('2026-10-17', 'A', [1, 1, 1])];
  const page = await openApp({ today: '2026-10-18', sessions: four });
  assert.deepEqual(await states(page), ['done', 'rest', 'done', 'rest', 'done', 'done', 'todayRest']);
  assert.deepEqual((await model(page)).slice(1), [4, 3]);
});
test('two workouts on one day both count, and the day carries the last letter', async () => {
  const page = await openApp({ sessions: abc().concat(session('2026-10-12', 'A', [60, 70, 80], { hm: '18:00' })) });
  assert.deepEqual(await page.evaluate(() => { const w = weekModel(S.uid); return [w.done, w.days[0].n, w.days[0].tpl]; }), [2, 2, 'A']);
});
test('Sunday closes the week and Monday starts clean', async () => {
  const p = profile({ week: { mon: '2026-10-12', days: [1, 3, 0] } });
  const sun = await openApp({ today: '2026-10-18', profile: p });
  assert.deepEqual(await sun.evaluate(() => { const d = weekModel(S.uid).days[6]; return [d.date, d.dow, d.state]; }), ['2026-10-18', 0, 'today']);
  const mon = await openApp({ today: '2026-10-19', profile: p });
  assert.deepEqual(await model(mon), ['2026-10-19', 0, 3]);
  assert.equal((await states(mon))[0], 'today');
});
test('the coming training days carry the letters in order', async () => {
  const page = await openApp({ sessions: abc() });
  assert.deepEqual(await page.evaluate(() => upcoming(S.uid)), [{ date: '2026-10-14', tpl: 'A' }, { date: '2026-10-16', tpl: 'B' }, { date: '2026-10-19', tpl: 'C' }]);
});
test('after training today the list starts tomorrow', async () => {
  const page = await openApp({ sessions: abc().concat(session('2026-10-14', 'A', [60, 70, 80])) });
  assert.deepEqual(await page.evaluate(() => upcoming(S.uid, 1)), [{ date: '2026-10-16', tpl: 'B' }]);
});
test('one training day a week looks three weeks ahead', async () => {
  const page = await openApp({ sessions: abc(), profile: profile({ days: [1] }) });
  assert.deepEqual(await page.evaluate(() => upcoming(S.uid).map(u => u.date)), ['2026-10-19', '2026-10-26', '2026-11-02']);
});
test('a swapped letter leads, and same-every-time has no letters to turn', async () => {
  const page = await openApp({ sessions: abc() });
  assert.deepEqual(await page.evaluate(() => { UI.tpl = 'C'; return upcoming(S.uid).map(u => u.tpl); }), ['C', 'A', 'B']);
  const same = await openApp({ sessions: abc(), profile: profile({ mode: 'same' }) });
  assert.deepEqual(await same.evaluate(() => upcoming(S.uid).map(u => u.tpl)), ['A', 'A', 'A']);
});
test('before the start date the list begins on the start date', async () => {
  const page = await openApp({ profile: profile({ start: '2026-10-19' }) });
  assert.equal(await page.evaluate(() => upcoming(S.uid, 1)[0].date), '2026-10-19');
});
```

- [ ] **Step 2: Run and see them fail**

Run: `node --test --test-reporter=spec tests/week.test.js`
Expected: `ReferenceError: weekModel is not defined` / `upcoming is not defined`.

- [ ] **Step 3: Implement `plannedDows`, `weekModel` and `upcoming`** as described under Interfaces. The day a person joined is `ymd(new Date(profile.joined))`, or `''` when `joined` is 0.

- [ ] **Step 4: Replace `nextTrainingDay`**

Delete it. `cardState`: `next = (upcoming(S.uid, 1)[0] || { date: today }).date`. `finishAndSave`: build the "Saved. Next workout: …" toast from `upcoming(S.uid, 1)[0]` after the profile has been handed to `saveProfile` (it updates the profile in memory at once); leave the date out when the list is empty.

- [ ] **Step 5: Run everything**

Run: `npm test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add 3-3-30/index.html tests/week.test.js
git commit -m "Add the week model: planned, missed and rest days, and the coming training days"
git push
```

---

### Task 5: Moving a workout to the day you train

**Files:**
- Modify: `3-3-30/index.html` (new functions after `upcoming`; `finishAndSave`, `submitSessionForm`)
- Test: `tests/move.test.js`

**Interfaces:**
- Consumes: `weekModel`, `plannedDows`, `upcoming`.
- Produces:
  - `movedDay(id, date, today = todayYmd()) → string|null` — spec 5.3. `null` when `date` is before the person's start date, in another week than `today`, or planned. Otherwise, among the planned days of that week without a training: the earliest one before `date`, else the earliest one after `date`, else `null`.
  - `withWeekDays(profile, dows, today = todayYmd()) → profile` — a copy whose `week` is `{ mon: mondayOf(today), days }` (unique, ascending), or has no `week` when `dows` holds exactly the usual days.
  - `moveFor(profile, id, date, today = todayYmd()) → profile|null` — `profile` with the day from `movedDay` taken out of this week's list and the weekday of `date` put in; `null` when nothing moves.

- [ ] **Step 1: Write the failing tests** in `tests/move.test.js`

```js
const moved = (page, date) => page.evaluate(d => movedDay(S.uid, d), date);
const week = page => page.evaluate(() => myProfile().week || null);
const wed14 = () => session('2026-10-14', 'A', [60, 70, 80]);
const fri16 = () => session('2026-10-16', 'B', [30, 8, 40]);
const early = () => [first(), session('2026-10-07', 'B', [30, 8, 40])];          // nothing in the week of 12 Oct

test('Monday done, train Tuesday: Wednesday moves', async () => {
  assert.equal(await moved(await openApp({ today: '2026-10-13', sessions: abc() }), '2026-10-13'), '2026-10-14');
});
test('Monday missed, train Tuesday: Monday moves', async () => {
  assert.equal(await moved(await openApp({ today: '2026-10-13', sessions: early() }), '2026-10-13'), '2026-10-12');
});
test('Monday missed, Wednesday done, train Thursday: Monday moves', async () => {
  assert.equal(await moved(await openApp({ today: '2026-10-15', sessions: early().concat(wed14()) }), '2026-10-15'), '2026-10-12');
});
test('Monday and Wednesday done, train Thursday: Friday moves', async () => {
  assert.equal(await moved(await openApp({ today: '2026-10-15', sessions: abc().concat(wed14()) }), '2026-10-15'), '2026-10-16');
});
test('all three done, train Saturday: nothing moves', async () => {
  assert.equal(await moved(await openApp({ today: '2026-10-17', sessions: abc().concat(wed14(), fri16()) }), '2026-10-17'), null);
});
test('a planned day, another week and a practice workout never move anything', async () => {
  const page = await openApp({ sessions: abc() });
  assert.deepEqual([await moved(page, '2026-10-14'), await moved(page, '2026-10-06')], [null, null]);
  assert.equal(await moved(await openApp({ profile: profile({ start: '2026-10-19' }) }), '2026-10-13'), null);
});
test('the week list is written sorted and dropped when it equals the usual days', async () => {
  const page = await openApp();
  assert.deepEqual(await page.evaluate(() => [withWeekDays(myProfile(), [5, 2, 1]).week, 'week' in withWeekDays(myProfile(), [5, 3, 1])]),
    [{ mon: '2026-10-12', days: [1, 2, 5] }, false]);
});
test('logging a past workout on a rest day moves the next planned day', async () => {
  const page = await openApp({ today: '2026-10-15', sessions: abc() });
  await page.evaluate(() => ACT.manual());
  await page.fill('#sDate', '2026-10-13');
  await page.fill('[name="tot0"]', '30');
  await page.click('#sheet button[type="submit"]');
  await page.waitForSelector('#sheet', { state: 'hidden' });
  assert.deepEqual(await week(page), { mon: '2026-10-12', days: [1, 2, 5] });
  assert.deepEqual(await page.evaluate(() => weekModel(S.uid).days.map(d => d.state)), ['done', 'done', 'rest', 'todayRest', 'planned', 'rest', 'rest']);
  await page.evaluate(() => deleteSession(sessionsOf(S.uid).find(s => s.date === '2026-10-13').id));
  assert.deepEqual(await week(page), { mon: '2026-10-12', days: [1, 2, 5] });          // deleting does not move it back
});
test('changing only the reps of a workout moves nothing', async () => {
  const sat = session('2026-10-17', 'C', [40, 40, 40], { id: 'sat' });
  const page = await openApp({ today: '2026-10-18', sessions: abc().concat(wed14(), fri16(), sat), profile: profile({ week: { mon: '2026-10-12', days: [0, 1, 3, 5] } }) });
  await page.evaluate(() => ACT.edit({ dataset: { id: 'sat' } }));
  await page.fill('[name="tot0"]', '41');
  await page.click('#sheet button[type="submit"]');
  await page.waitForSelector('#sheet', { state: 'hidden' });
  assert.deepEqual(await week(page), { mon: '2026-10-12', days: [0, 1, 3, 5] });
});
test('changing the date of a workout to a rest day moves a day', async () => {
  const page = await openApp({ today: '2026-10-15', sessions: abc().concat(wed14()) });
  await page.evaluate(() => ACT.edit({ dataset: { id: 's-2026-10-14-A' } }));
  await page.fill('#sDate', '2026-10-13');
  await page.click('#sheet button[type="submit"]');
  await page.waitForSelector('#sheet', { state: 'hidden' });
  assert.deepEqual(await week(page), { mon: '2026-10-12', days: [1, 2, 5] });
});
test('finishing a workout on a rest day moves the day and names the next one', async () => {
  const page = await openApp({ today: '2026-10-13', sessions: abc() });
  await page.evaluate(async () => {
    openRunner(false, nextTpl(S.uid));
    R.session.blocks.forEach(b => { b.sets = [{ r: 10, kg: b.kg, t: 5 }]; b.total = 10; b.done = true; b.dur = 600; });
    R.phase = 'finish';
    await finishAndSave();
  });
  assert.deepEqual(await week(page), { mon: '2026-10-12', days: [1, 2, 5] });
  assert.match(await txt(page, '#toast'), /Next workout: Friday 16 October/);
});
```

- [ ] **Step 2: Run and see them fail**

Run: `node --test --test-reporter=spec tests/move.test.js`
Expected: `ReferenceError: movedDay is not defined` / `withWeekDays is not defined`; the four form and runner tests fail with `null !== { mon: … }`.

- [ ] **Step 3: Implement `movedDay`, `withWeekDays` and `moveFor`** as described under Interfaces.

- [ ] **Step 4: Apply the rule when a workout is saved**

- `finishAndSave`: after `saveSession` succeeds, replace the profile copy by `moveFor(p, S.uid, s.date) || p` before it goes to `saveProfile`.
- `submitSessionForm`: after `saveSession` succeeds, when the workout is new or its date changed (`orig.date !== base.date`), apply `moveFor(pp, S.uid, base.date)` to the profile copy `pp` and save it (set `changed`). Not when only reps, weight or exercise changed.
- Nothing happens on delete.

- [ ] **Step 5: Run everything**

Run: `npm test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add 3-3-30/index.html tests/move.test.js
git commit -m "Move a planned workout to the rest day you train on: a missed day first, else the next one"
git push
```

---

### Task 6: The bottom switch and two screens

**Files:**
- Modify: `3-3-30/index.html` (page skeleton 358–368, `UI`, `FOCUS_KEYS`, `renderHeader`, `viewHome`, `viewToday`, `viewProgress`, `viewLog`, `finishAndSave`, `ACT`; styles: Appendix A "Task 6")
- Test: `tests/nav.test.js`

**Interfaces:**
- Produces: `UI.tab: 'today' | 'progress'` (starts as `'today'`); `ACT.tab(el)` (reads `data-tab`, resets `UI.logAll`, scrolls the page to the top); `viewProgressPage()`; `const ICON = { today, progress, pencil, check, back }` (SVG strings); `#tabs`.

- [ ] **Step 1: Write the failing tests** in `tests/nav.test.js`

```js
test('the bottom switch shows Today and Progress', async () => {
  const page = await openApp({ sessions: [first()] });
  assert.deepEqual(await texts(page, '#tabs button'), ['Today', 'Progress']);
  assert.equal(await page.locator('#tabs [data-tab="today"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#view [data-act="manual"]').count(), 0);
  await page.click('#tabs [data-tab="progress"]');
  assert.equal(await txt(page, '#view .title'), 'Progress');
  assert.equal(await page.locator('#tabs [data-tab="progress"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await txt(page, '#view [data-act="manual"]'), 'Log a past workout');
  assert.equal(await page.locator('#view [data-act="startSession"]').count(), 0);
});
test('no switch before there is a profile', async () => {
  const page = await openApp({ profile: null });
  assert.equal(await page.locator('#tabs').isHidden(), true);
});
test('a reload lands on Today', async () => {
  const page = await openApp({ sessions: [first()] });
  await page.click('#tabs [data-tab="progress"]');
  await page.reload();
  await page.waitForFunction(() => !document.querySelector('#view .skeleton'));
  assert.equal(await page.locator('#tabs [data-tab="today"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#view [data-act="startSession"]').count(), 1);
});
test('the buddy switch lives on Progress and a buddy cannot be logged for', async () => {
  const page = await openApp({ sessions: [first()], crew: [{ id: 'sam', profile: profile({ nick: 'Sam' }), sessions: [first()] }] });
  assert.equal(await page.locator('#view [data-act="person"]').count(), 0);
  await page.click('#tabs [data-tab="progress"]');
  assert.deepEqual(await texts(page, '#view [data-act="person"]'), ['Me', 'Sam']);
  await page.click('#view [data-act="person"][data-id="sam"]');
  assert.equal(await page.locator('#view [data-act="manual"]').count(), 0);
});
test('the switch stays clear of the content and of a sheet', async () => {
  const page = await openApp({ sessions: abc() });
  assert.equal(await page.evaluate(() => { const b = document.querySelector('#tabs').getBoundingClientRect(); return b.height >= 52 && b.bottom <= innerHeight; }), true);
  await page.evaluate(() => ACT.settings());
  assert.equal(await page.evaluate(() => document.querySelector('#app').inert), true);
});
```

- [ ] **Step 2: Run and see them fail**

Run: `node --test --test-reporter=spec tests/nav.test.js`
Expected: fails on `#tabs button` (no such element).

- [ ] **Step 3: Add the switch to the page skeleton**

Inside `<div class="app" id="app">`, after `</main>`:

```html
<nav class="tabs" id="tabs" aria-label="Main" hidden>
  <button data-act="tab" data-tab="today" aria-pressed="true"></button>
  <button data-act="tab" data-tab="progress" aria-pressed="false"></button>
</nav>
```

`renderHeader()` fills each button with its icon and label ("Today", "Progress"), sets `aria-pressed` from `UI.tab`, and hides `#tabs` while there is no profile. `ICON` paths, all in `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">`: today `<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z"/>`; progress `<path d="M4 17l5-5 4 4 7-8"/><path d="M15 8h5v5"/>`; pencil `<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>`; check `<path d="M5 12.5l4.5 4.5L19 7.5"/>`; back `<path d="M15 6l-6 6 6 6"/>`.

- [ ] **Step 4: Split the page**

- `viewHome()` keeps its loading, error and first-visit branches, then returns `viewToday(p)` for `UI.tab === 'today'` and `viewProgressPage()` otherwise.
- `viewToday(p)` loses the "Log a past workout" button; nothing else changes yet.
- `viewProgressPage()`: a head `<div class="row pr-head"><h1 class="title grow">Progress</h1>` + the person switch from `personPick()` + `</div>`; the existing buddy loading and error blocks (moved from `viewHome`); the existing chart cards (`viewProgress(pid)` without its own heading and person switch); then `<div class="log-head"><h2 class="h2 grow">Log</h2>` + for your own view `<button class="btn link" data-act="manual">Log a past workout</button>` + `</div>` and the existing `logTable(pid)`. These two blocks are replaced in Tasks 17–19.
- `finishAndSave` sets `UI.tab = 'today'`. Add `'tab'`, `'date'` and `'from'` to `FOCUS_KEYS`.

- [ ] **Step 5: Add the styles** from Appendix A, "Task 6".

- [ ] **Step 6: Run everything**

Run: `npm test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add 3-3-30/index.html tests/nav.test.js
git commit -m "Split the page into Today and Progress behind a bottom switch"
git push
```

---

### Task 7: The week strip

**Files:**
- Modify: `3-3-30/index.html` (`viewToday`; new `weekStripHtml`, `dayDotHtml`; styles: Appendix A "Task 7")
- Test: `tests/strip.test.js`

**Interfaces:**
- Consumes: `weekModel`, `upcoming`, `displayName`, `ICON.check`.
- Produces:
  - `dayDotHtml(state, text) → string` — `<span class="wd" data-state="STATE" aria-hidden="true">TEXT</span>`; `text` is a letter, the check icon, or empty.
  - `weekStripHtml() → string` — the card `section.card.wk[aria-label="This week"]`, or `''` before your start date. Rows: `div.wk-row.wk-head` (label "Week", seven day letters `span.wk-d` "M T W T F S S", today's with `aria-current="date"`), then `div.wk-row.me[data-id]` and up to three `div.wk-row[data-id]` for buddies (members with a profile, ordered by `profile.joined`, then id). Each person row: `span.wk-who` ("You" or `displayName(id)`), seven dots, `span.wk-n` ("1/3", empty when nothing is planned and nothing is done), and `aria-label="NAME: 1 of 3 workouts this week"`. More buddies: `button.btn.link.wk-more[data-act="tab"][data-tab="progress"]` with "+2 more".
  - Dot content, your row: `done` shows that day's letter, `today` and `planned` show the letter from `upcoming(S.uid, 7)` for that date; in same-every-time mode `done` shows the check icon and the others are empty. Buddy rows: `done` shows the check icon, and the row writes `planned` for `today` and `rest` for `todayRest`.

- [ ] **Step 1: Write the failing tests** in `tests/strip.test.js`

```js
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
```

- [ ] **Step 2: Run and see them fail**

Run: `node --test --test-reporter=spec tests/strip.test.js`
Expected: every test fails on missing `.wk-row` elements.

- [ ] **Step 3: Implement `dayDotHtml` and `weekStripHtml`** as described under Interfaces, and put the strip in `viewToday` between the head and the workout card (also when a workout is in progress).

- [ ] **Step 4: Add the styles** from Appendix A, "Task 7".

- [ ] **Step 5: Run everything**

Run: `npm test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add 3-3-30/index.html tests/strip.test.js
git commit -m "Show the week for you and your buddies on Today"
git push
```

---

### Task 8: One sheet at a time, and "Swap workout"

**Files:**
- Modify: `3-3-30/index.html` (`openSheet`, `closeSheet` and its three callers, `viewToday`, `ACT.pickTpl`; new `SHEETS`, `showSheet`, `refreshSheet`, `dismissSheet`, `swapSheet`; styles: Appendix A "Task 8")
- Test: `tests/swap.test.js`

**Interfaces:**
- Consumes: `nextTpl`, `planFor`, `exName`.
- Produces:
  - `const SHEETS = {}` — kind → `{ label, html(st) }`; `label` is the dialog's accessible name. Later tasks add their sheet here.
  - `showSheet(st)` — sets `UI.sheet = st` and opens `SHEETS[st.kind].html(st)` under that label.
  - `refreshSheet()` — re-renders the open sheet from `UI.sheet` when its kind is in `SHEETS`, keeping scroll position and focus.
  - `dismissSheet()` — what the close button, the backdrop and Escape do: when `UI.sheet.back` names a kind in `SHEETS` it calls `showSheet({ kind: UI.sheet.back })`, otherwise `closeSheet()`.
  - `openSheet` writes `data-sheet="KIND"` on `.sheet-panel` (from `UI.sheet.kind`, empty when there is none).
  - `ACT.swap()`; `ACT.pickTpl(el)` now sets `UI.tpl` (or `null` when the letter is the one next in line) and dismisses the sheet.

- [ ] **Step 1: Write the failing tests** in `tests/swap.test.js`

```js
test('Swap workout offers the three workouts and marks the next one', async () => {
  const page = await openApp({ sessions: abc() });
  await page.click('#view [data-act="swap"]');
  assert.deepEqual(await texts(page, '[data-sheet="swap"] .swap-t'), ['Workout A', 'Workout B', 'Workout C']);
  assert.equal(await txt(page, '[data-sheet="swap"] [data-tpl="A"] .swap-next'), 'Next in line');
  assert.equal(await page.locator('[data-sheet="swap"] .swap-next').count(), 1);
  assert.match(await txt(page, '[data-sheet="swap"] [data-tpl="B"]'), /Seated dumbbell shoulder press.*Pull-ups.*Dumbbell Romanian deadlift/);
  await page.click('[data-sheet="swap"] [data-tpl="B"]');
  assert.equal(await page.locator('#sheet').isHidden(), true);
  assert.equal(await txt(page, '#view .title'), 'Workout B');
  assert.equal(await page.locator('#view [data-act="startSession"]').getAttribute('data-tpl'), 'B');
  assert.deepEqual(await page.locator('.wk-row.me .wd').evaluateAll(els => els.map(e => e.textContent.trim())), ['C', '', 'B', '', 'C', '', '']);
});
test('the letter buttons are gone from the card', async () => {
  const page = await openApp({ sessions: abc() });
  assert.equal(await page.locator('#view [data-act="pickTpl"]').count(), 0);
});
test('the choice does not survive a reload', async () => {
  const page = await openApp({ sessions: abc() });
  await page.click('#view [data-act="swap"]');
  await page.click('[data-sheet="swap"] [data-tpl="C"]');
  await page.reload();
  await page.waitForFunction(() => !document.querySelector('#view .skeleton'));
  assert.equal(await txt(page, '#view .title'), 'Workout A');
});
test('picking the letter that is next in line clears the choice', async () => {
  const page = await openApp({ sessions: abc() });
  await page.evaluate(() => { UI.tpl = 'C'; ACT.swap(); });
  await page.click('[data-sheet="swap"] [data-tpl="A"]');
  assert.equal(await page.evaluate(() => UI.tpl), null);
});
test('the choice is used up by the workout it was made for', async () => {
  const page = await openApp({ sessions: abc() });
  await page.evaluate(async () => {
    UI.tpl = 'C';
    openRunner(false, UI.tpl);
    R.session.blocks.forEach(b => { b.sets = [{ r: 10, kg: b.kg, t: 5 }]; b.total = 10; b.done = true; b.dur = 600; });
    R.phase = 'finish';
    await finishAndSave();
  });
  assert.deepEqual(await page.evaluate(() => [UI.tpl, nextTpl(S.uid)]), [null, 'A']);
});
test('same every time has nothing to swap', async () => {
  const page = await openApp({ sessions: abc(), profile: profile({ mode: 'same' }) });
  assert.equal(await page.locator('#view [data-act="swap"]').count(), 0);
});
test('Escape closes the sheet and focus returns to the link', async () => {
  const page = await openApp({ sessions: abc() });
  await page.click('#view [data-act="swap"]');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#sheet').isHidden(), true);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.act), 'swap');
});
```

- [ ] **Step 2: Run and see them fail**

Run: `node --test --test-reporter=spec tests/swap.test.js`
Expected: fails on `[data-act="swap"]` (no such element).

- [ ] **Step 3: Add the sheet plumbing** — `SHEETS`, `showSheet`, `refreshSheet`, `dismissSheet` and the `data-sheet` attribute, as described under Interfaces. `ACT.closeSheet`, the backdrop click and the Escape key call `dismissSheet()`.

- [ ] **Step 4: Add the sheet and the link**

- `SHEETS.swap = { label: 'Swap workout', html: swapSheet }`: a head (`b.h2` "Swap workout", close button) and three `button.swap-opt[data-act="pickTpl"][data-tpl]`, each with `b.swap-t` "Workout A", for the letter from `nextTpl(S.uid)` a `span.swap-next` "Next in line", and the three exercise names of that workout joined with " · " in a `span.small`.
- `viewToday`: remove the A/B/C segment and the row it sat in. Under the main button add `<button class="btn link" data-act="swap">Swap workout</button>` when the profile mode is `'abc'` and no workout is in progress.

- [ ] **Step 5: Add the styles** from Appendix A, "Task 8".

- [ ] **Step 6: Run everything**

Run: `npm test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add 3-3-30/index.html tests/swap.test.js
git commit -m "Replace the A/B/C buttons with a Swap workout sheet"
git push
```

---

### Task 9: Verdicts, result rows and the finish screen

**Files:**
- Modify: `3-3-30/index.html` (new functions after `compare`; `runnerFinish` 2052–2086; styles: Appendix A "Task 9")
- Test: `tests/verdict.test.js`

**Interfaces:**
- Consumes: `history`, `refBlock`, `isTrial`, `blockKgLabel`, `blockVolume`, `plateHtml`.
- Produces:
  - `verdict(b, pid, sid) → { kind, text, tone }` — spec 2.5, compared with `refBlock(history(pid, b.ex, sid))`:

    | Case, checked in this order | `kind` | `text` | `tone` |
    |---|---|---|---|
    | not done, skipped, or 0 reps | `'skipped'` | `skipped` | `''` |
    | `b.cut` | `'cut'` | `stopped early` | `''` |
    | no earlier score | `'first'` | `first score` | `''` |
    | heavier than the score to beat | `'heavier'` | `+5 kg` | `''` |
    | lighter | `'lighter'` | `−5 kg` | `''` |
    | same weight, more reps | `'up'` | `▲ +4` | `'pos'` |
    | same weight, same reps | `'same'` | `same as last time` | `''` |
    | same weight, fewer reps | `'down'` | `▼ −3` | `''` |

    Weight difference rounded to one decimal and shown with `fmtNum`.
  - `sessionSummary(s, pid) → string` — spec 2.11. `''` for a practice workout. Otherwise the non-zero parts in this order, joined with ` · `: `${up} of ${up + same + down} beaten` (when that total is above 0), `${n} heavier`, `${n} lighter`, `${n} first score` / `${n} first scores`, `${n} stopped early`. Skipped blocks are not counted.
  - `resultRowsHtml(s, pid, judged = true) → string` — `<ul class="ex-list">` with one `li > div.ex-row.static` per block: plate, `span.ex-main` (`span.ex-n` name, `span.ex-sub > span.ex-kg` weight from `blockKgLabel`), `span.goal` holding `span.goal-n` (reps; left out for a skipped block) and `span.goal-l` (the verdict text, class `pos` for tone `'pos'`; left out when `judged` is false).

- [ ] **Step 1: Write the failing tests** in `tests/verdict.test.js`

```js
const verdicts = (page, id) => page.evaluate(i => { const s = me().sessions.get(i); return s.blocks.map(b => verdict(b, S.uid, s.id).text); }, id);
const summary = (page, id) => page.evaluate(i => sessionSummary(me().sessions.get(i), S.uid), id);
const second = (reps, opts) => session('2026-10-12', 'A', reps, opts);
const ID = 's-2026-10-12-A';

test('same weight: up, level and down', async () => {
  const page = await openApp({ sessions: [first(), second([66, 77, 80])] });
  assert.deepEqual(await verdicts(page, ID), ['▲ +4', 'same as last time', '▼ −5']);
  assert.equal(await page.evaluate(i => verdict(me().sessions.get(i).blocks[0], S.uid, i).tone, ID), 'pos');
  assert.equal(await summary(page, ID), '1 of 3 beaten');
});
test('another weight is named, not judged', async () => {
  const page = await openApp({ sessions: [first(), second([66, 80, 79], { kg: [35, 65, 80] })] });
  assert.deepEqual(await verdicts(page, ID), ['▲ +4', '▲ +3', '+5 kg']);
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
  const page = await openApp({ sessions: [first()], profile: profile({ start: '2026-10-19' }) });
  assert.equal(await summary(page, 's-2026-10-05-A'), '');
});
test('the finish screen shows reps first, with the verdict under them', async () => {
  const page = await openApp({ today: '2026-10-05' });
  await page.evaluate(() => {
    openRunner(false, 'A');
    R.session.blocks.forEach((b, i) => { const r = [62, 77, 85][i]; b.sets = [{ r, kg: b.kg, t: 300 }]; b.total = r; b.done = true; b.dur = 600; });
    R.phase = 'finish'; renderRunner();
  });
  assert.equal(await txt(page, '#runner .title'), 'Workout done');
  assert.deepEqual(await texts(page, '#runner .goal-n'), ['62', '77', '85']);
  assert.deepEqual(await texts(page, '#runner .goal-l'), ['first score', 'first score', 'first score']);
  assert.deepEqual(await texts(page, '#runner .ex-kg'), ['35 kg', '65 kg', '75 kg']);
  assert.equal(await txt(page, '#runner .head .small'), '3 first scores');
  assert.match(await txt(page, '#runner .sum-total'), /Lifted in total 13,550 kg/);
  assert.deepEqual(await texts(page, '#runner .run > .btn'), ['Save workout', 'Back to the last exercise']);
});
test('the finish screen of a practice workout has no verdicts', async () => {
  const page = await openApp({ today: '2026-10-05', profile: profile({ start: '2026-10-12' }) });
  await page.evaluate(() => {
    openRunner(false, 'A');
    R.session.blocks.forEach(b => { b.sets = [{ r: 9, kg: b.kg, t: 300 }]; b.total = 9; b.done = true; b.dur = 600; });
    R.phase = 'finish'; renderRunner();
  });
  assert.equal(await txt(page, '#runner .title'), 'Practice done');
  assert.equal(await page.locator('#runner .goal-l').count(), 0);
});
```

- [ ] **Step 2: Run and see them fail**

Run: `node --test --test-reporter=spec tests/verdict.test.js`
Expected: `ReferenceError: verdict is not defined` / `sessionSummary is not defined`; the finish-screen tests fail on missing `.goal-n`.

- [ ] **Step 3: Implement `verdict` and `sessionSummary`** as described under Interfaces.

- [ ] **Step 4: Implement `resultRowsHtml`** and use it in `runnerFinish`

The finish screen keeps its eyebrow, its title ("Workout done" / "Practice done"), "No blocks done", "Lifted in total", "Save workout" and "Back to the last exercise". Its rows become `resultRowsHtml(s, S.uid, !trial)` inside the card, and the line under the title becomes `sessionSummary(s, S.uid)` (nothing for a practice workout).

- [ ] **Step 5: Add the styles** from Appendix A, "Task 9".

- [ ] **Step 6: Run everything**

Run: `npm test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add 3-3-30/index.html tests/verdict.test.js
git commit -m "Judge each exercise against the score to beat and show reps first on the finish screen"
git push
```

---

### Task 10: Today in five situations

**Files:**
- Modify: `3-3-30/index.html` (`cardState`, `viewToday`, `exRow`; styles: Appendix A "Task 10")
- Test: `tests/today.test.js`

**Interfaces:**
- Consumes: `weekModel`, `upcoming`, `movedDay`, `nextTpl`, `weekStripHtml`, `resultRowsHtml`, `advice`, `plannedKg`, `upHint`, `draftRow`.
- Produces: `todaySituation(p) → 'progress' | 'pre' | 'done' | 'train' | 'rest'` (the first that applies, in that order: a draft on this device; today before the start date; a training that counts dated today; today planned; otherwise). `viewToday(p)` renders spec 2.2, 2.4 and 2.5:

  | Situation | Date line (`.head .eyebrow`) | Title | Card `section.card.wo` | Main button | Links |
  |---|---|---|---|---|---|
  | progress | `Wed 14 Oct · today` | `Workout in progress` | the draft's rows, as now | `Resume workout` | `Discard it` |
  | pre | `You start Monday 19 October` | `Get ready` | three exercise rows | `Try a practice workout` (ghost) | `Swap workout` |
  | done | `Wed 14 Oct · today` | `Workout A done` | `resultRowsHtml` + "Lifted in total" | none | below the card: `div.after` with `span.next-line` "Next: **Wed 7 Oct · Workout B**", and `div.wo-links` with `Edit` (`data-act="edit"`, the session id) and `Train again today` (`data-act="startSession"`, `data-tpl` = `nextTpl`) |
  | train | `Wed 14 Oct · today` | `Workout A` | three exercise rows | `Start · 30 min` (primary) | `Swap workout` |
  | rest | `Tue 13 Oct · today` | `Rest day` | `div.wo-next` (`span.eyebrow` "Next up · Wed 14 Oct", `b.h2` "Workout A"), three rows | `Train today instead` (primary) or `Train anyway` (ghost) | none yet |

  - Same-every-time mode: titles `Today’s workout` and `Workout done`, no `b.h2` in `div.wo-next`, "Next: Wed 7 Oct" without a letter, no `Swap workout`.
  - The done situation shows the last training of today. "Lifted in total" (`div.sum-total`, as on the finish screen) is left out when the total is 0.
  - Rest day: `const from = movedDay(S.uid, today)`. With a day: button `Train today instead` and `p.wo-note` "Moves Wednesday’s workout to today." (the weekday of `from`, written out). Without: `Train anyway` and "Counts as an extra workout this week."
  - An exercise row (`button.ex-row[data-act="editEx"][data-tpl][data-slot]`): plate, `span.ex-main` (`span.ex-n`, `span.ex-sub > span.ex-kg`), `span.goal`. With a score to beat: `span.goal-n` = its reps and `span.goal-l` = `reps to beat`, or `reps to match` when the planned weight is heavier than that score's weight. Without: only `span.goal-l` "First time".
  - Links sit in `div.wo-links` as `button.btn.link`. Tasks 11 and 12 add "Your plan" and "Change this week".
  - The week strip stays above the card except before the start date. The go-heavier tip stays under the rows in the pre, train and rest situations.

- [ ] **Step 1: Write the failing tests** in `tests/today.test.js`

```js
const head = async page => [await txt(page, '.head .eyebrow'), await txt(page, '#view .title')];

test('a training day shows the workout and what to beat', async () => {
  const page = await openApp({ sessions: abc() });
  assert.deepEqual(await head(page), ['Wed 14 Oct · today', 'Workout A']);
  assert.deepEqual(await texts(page, '.wo .ex-n'), ['Overhead press', 'Seated cable row', 'Seated leg press']);
  assert.deepEqual(await texts(page, '.wo .ex-kg'), ['35 kg', '65 kg', '75 kg']);
  assert.deepEqual(await texts(page, '.wo .goal-n'), ['62', '77', '85']);
  assert.deepEqual(await texts(page, '.wo .goal-l'), ['reps to beat', 'reps to beat', 'reps to beat']);
  assert.equal(await txt(page, '.wo [data-act="startSession"]'), 'Start · 30 min');
  assert.deepEqual(await texts(page, '.wo-links .btn'), ['Swap workout']);
  assert.equal(await page.evaluate(() => todaySituation(myProfile())), 'train');
});
test('a heavier weight asks to match, and no score says First time', async () => {
  const heavy = await openApp({ sessions: abc(), profile: profile({ weights: { schouderdrukken: 37.5, kabelroeien: 65, 'c-seated-leg-press': 75 } }) });
  assert.deepEqual(await texts(heavy, '.wo .goal-l'), ['reps to match', 'reps to beat', 'reps to beat']);
  const none = await openApp({ today: '2026-10-05' });
  assert.deepEqual(await texts(none, '.wo .goal-l'), ['First time', 'First time', 'First time']);
  assert.equal(await none.locator('.wo .goal-n').count(), 0);
});
test('a rest day offers to bring the next workout forward', async () => {
  const page = await openApp({ today: '2026-10-13', sessions: abc() });
  assert.deepEqual(await head(page), ['Tue 13 Oct · today', 'Rest day']);
  assert.deepEqual([await txt(page, '.wo-next .eyebrow'), await txt(page, '.wo-next .h2')], ['Next up · Wed 14 Oct', 'Workout A']);
  assert.deepEqual(await texts(page, '.wo .goal-n'), ['62', '77', '85']);
  assert.equal(await txt(page, '.wo [data-act="startSession"]'), 'Train today instead');
  assert.equal(await txt(page, '.wo-note'), 'Moves Wednesday’s workout to today.');
});
test('after a missed day a rest day catches up first', async () => {
  const page = await openApp({ today: '2026-10-13', sessions: [first(), session('2026-10-07', 'B', [30, 8, 40])] });
  assert.equal(await txt(page, '.wo-note'), 'Moves Monday’s workout to today.');
  assert.equal(await txt(page, '.wo-next .eyebrow'), 'Next up · Wed 14 Oct');
});
test('with nothing left to move it is an extra workout', async () => {
  const page = await openApp({ today: '2026-10-17', sessions: abc().concat(session('2026-10-14', 'A', [60, 70, 80]), session('2026-10-16', 'B', [30, 8, 40])) });
  assert.equal(await txt(page, '.wo [data-act="startSession"]'), 'Train anyway');
  assert.equal(await txt(page, '.wo-note'), 'Counts as an extra workout this week.');
  assert.equal(await txt(page, '.wo-next .eyebrow'), 'Next up · Mon 19 Oct');
});
test('before the start date', async () => {
  const page = await openApp({ profile: profile({ start: '2026-10-19' }) });
  assert.deepEqual(await head(page), ['You start Monday 19 October', 'Get ready']);
  assert.equal(await txt(page, '.wo [data-act="startSession"]'), 'Try a practice workout');
  assert.equal(await page.locator('.wk').count(), 0);
});
test('a workout left open comes before everything else', async () => {
  const open = session('2026-10-14', 'A', [10, 0, 0], { status: 'active', id: 'd1' });
  const page = await openApp({ sessions: abc().concat(open), draft: open });
  assert.equal(await txt(page, '#view .title'), 'Workout in progress');
  assert.deepEqual(await texts(page, '.wo .btn'), ['Resume workout', 'Discard it']);
  assert.equal(await page.locator('.wk').count(), 1);
});
test('after training the card shows today’s result', async () => {
  const page = await openApp({ today: '2026-10-05', sessions: [first()] });
  assert.deepEqual(await head(page), ['Mon 5 Oct · today', 'Workout A done']);
  assert.deepEqual(await texts(page, '.wo .goal-n'), ['62', '77', '85']);
  assert.deepEqual(await texts(page, '.wo .goal-l'), ['first score', 'first score', 'first score']);
  assert.match(await txt(page, '.wo .sum-total'), /Lifted in total 13,550 kg/);
  assert.equal(await txt(page, '.after .next-line'), 'Next: Wed 7 Oct · Workout B');
  assert.deepEqual(await texts(page, '.after .btn'), ['Edit', 'Train again today']);
  assert.equal(await page.locator('.after [data-act="startSession"]').getAttribute('data-tpl'), 'B');
  await page.click('.after [data-act="edit"]');
  assert.equal(await txt(page, '#sheet .h2'), 'Edit workout');
});
test('two workouts on one day: the card shows the last', async () => {
  const page = await openApp({ today: '2026-10-05', sessions: [first(), session('2026-10-05', 'B', [30, 8, 40], { hm: '18:00' })] });
  assert.equal(await txt(page, '#view .title'), 'Workout B done');
  assert.equal(await txt(page, '.after .next-line'), 'Next: Wed 7 Oct · Workout C');
});
test('a workout without kilos shows no total', async () => {
  const page = await openApp({ today: '2026-10-07', sessions: [session('2026-10-07', 'B', [0, 8, 0])] });
  assert.equal(await txt(page, '#view .title'), 'Workout B done');
  assert.deepEqual(await texts(page, '.wo .goal-l'), ['skipped', 'first score', 'skipped']);
  assert.equal(await page.locator('.wo .sum-total').count(), 0);
});
test('deleting today’s workout brings the workout back', async () => {
  const page = await openApp({ today: '2026-10-05', sessions: [first()] });
  await page.evaluate(() => deleteSession('s-2026-10-05-A'));
  await page.waitForFunction(() => document.querySelector('#view .title').textContent === 'Workout A');
  assert.equal(await txt(page, '.wo [data-act="startSession"]'), 'Start · 30 min');
});
test('same every time uses plain titles', async () => {
  const same = profile({ mode: 'same' });
  assert.equal(await txt(await openApp({ sessions: abc(), profile: same }), '#view .title'), 'Today’s workout');
  const rest = await openApp({ today: '2026-10-13', sessions: abc(), profile: same });
  assert.equal(await rest.locator('.wo-next .h2').count(), 0);
  const done = await openApp({ today: '2026-10-05', sessions: [first()], profile: same });
  assert.deepEqual([await txt(done, '#view .title'), await txt(done, '.after .next-line')], ['Workout done', 'Next: Wed 7 Oct']);
});
test('bodyweight and dumbbell pairs read naturally', async () => {
  const page = await openApp({ today: '2026-10-07', sessions: [first()] });
  assert.equal(await txt(page, '#view .title'), 'Workout B');
  assert.deepEqual(await texts(page, '.wo .ex-kg'), ['2 × 10 kg', 'bodyweight', '2 × 16 kg']);
});
test('a 40-character name does not widen a 320 px screen', async () => {
  const page = await openApp({ width: 320, sessions: abc(), profile: profile({ names: { schouderdrukken: 'Standing barbell overhead press strict x' } }) });
  assert.equal(await txt(page, '.wo .ex-n'), 'Standing barbell overhead press strict x');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
});
test('the whole screen fits a phone without scrolling', async () => {
  const page = await openApp({ sessions: abc(), crew: [{ id: 'sam', profile: profile({ nick: 'Sam' }), sessions: [] }] });
  assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight), true);
});
```

- [ ] **Step 2: Run and see them fail**

Run: `node --test --test-reporter=spec tests/today.test.js`
Expected: fails on missing `.wo` / `.goal-n` elements and on the old strings ("Done for today ✓", "Train anyway" on every rest day).

- [ ] **Step 3: Implement `todaySituation` and rebuild `cardState`** to return what the table needs: `{ today, start, situation, draft, done (the last training of today, or null), next (from upcoming, { date, tpl }), tpl }`, where `tpl` is the draft's letter when a workout is open and `next.tpl` otherwise.

- [ ] **Step 4: Rebuild `viewToday` and `exRow`** as described under Interfaces.

- [ ] **Step 5: Add the styles** from Appendix A, "Task 10".

- [ ] **Step 6: Run everything**

Run: `npm test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add 3-3-30/index.html tests/today.test.js
git commit -m "Rebuild Today: big targets, the result after training, and moving on a rest day"
git push
```

---

### Task 11: "Your plan"

**Files:**
- Modify: `3-3-30/index.html` (`settingsHtml`, `refreshSettings`, `viewOnboarding`, `viewToday`, `ACT.day`, `ACT.editEx`, `submitExSheet`; new `planSheet`, `slotHelpHtml`, `legendHtml`; styles: Appendix A "Task 11")
- Test: `tests/plan.test.js`

**Interfaces:**
- Consumes: `showSheet`, `refreshSheet`, `dismissSheet`, `upcoming`, `plannedDows`, `withWeekDays`, `planFor`, `plannedKg`, `kgLabel`.
- Produces:
  - `const SLOT_HELP = { push: 'You press the weight away from you. Trains chest, shoulders and triceps.', pull: 'You pull the weight toward you. Trains back and biceps.', legs: 'You push with your legs or bend at the hips. Trains thighs, hamstrings and glutes.' }`.
  - `slotHelpHtml(slot)` — `<p><i class="SLOT"></i><span><b>Push:</b> you press the weight away from you. Trains chest, shoulders and triceps.</span></p>` (the sentence starts in lower case after the label); `legendHtml()` — `<div class="legend" aria-label="What push, pull and legs mean">` with all three.
  - `SHEETS.plan = { label: 'Your plan', html: planSheet }`; `ACT.plan()`. Layout: head (`b.h2` "Your plan", close); `div.f` "Training days" with `div.daypick` of seven `button[data-act="day"][data-d]` (Mon … Sun); one `section.card.plan-card[data-tpl]` per workout with `b.h2` ("Workout A" / "Workout B" / "Workout C", or one card "Every workout" in same-every-time mode), `span.plan-when` (the date of that letter in `upcoming(S.uid, 3)`: "Today", class `now`, or "Fri 16 Oct"), and three `button.plan-row[data-act="editEx"][data-tpl][data-slot][data-from="plan"]` (small plate, `span.ex-n`, `span.ex-kg`, chevron); then `legendHtml()`.
  - `ACT.day` keeps its two refusals ("Keep at least one training day.", "You already picked 3 days. Turn one off first.") and now applies spec 5.2: this week keeps its days before today as they were and takes the new usual days from today on (`withWeekDays`), then `refreshSheet()`.
  - `ACT.editEx` records `back: 'plan'` on the exercise sheet when the row has `data-from="plan"`; saving or closing the exercise sheet then returns to the plan.

- [ ] **Step 1: Write the failing tests** in `tests/plan.test.js`

```js
test('Your plan lists the days, the workouts and when each comes up', async () => {
  const page = await openApp({ sessions: abc() });
  await page.click('#view [data-act="plan"]');
  assert.equal(await txt(page, '[data-sheet="plan"] .sheet-head .h2'), 'Your plan');
  assert.deepEqual(await texts(page, '[data-sheet="plan"] .daypick button'), ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  assert.deepEqual(await texts(page, '[data-sheet="plan"] .daypick [aria-pressed="true"]'), ['Mon', 'Wed', 'Fri']);
  assert.deepEqual(await texts(page, '.plan-card .h2'), ['Workout A', 'Workout B', 'Workout C']);
  assert.deepEqual(await texts(page, '.plan-card .plan-when'), ['Today', 'Fri 16 Oct', 'Mon 19 Oct']);
  assert.deepEqual(await texts(page, '.plan-card[data-tpl="A"] .ex-n'), ['Overhead press', 'Seated cable row', 'Seated leg press']);
  assert.deepEqual(await texts(page, '.plan-card[data-tpl="B"] .ex-kg'), ['2 × 10 kg', 'bodyweight', '2 × 16 kg']);
  assert.deepEqual(await texts(page, '[data-sheet="plan"] .legend p'), [
    'Push: you press the weight away from you. Trains chest, shoulders and triceps.',
    'Pull: you pull the weight toward you. Trains back and biceps.',
    'Legs: you push with your legs or bend at the hips. Trains thighs, hamstrings and glutes.']);
});
test('the link is there in every situation but a workout in progress', async () => {
  for (const today of ['2026-10-14', '2026-10-13', '2026-10-12']) {
    assert.equal(await txt(await openApp({ today, sessions: abc() }), '#view [data-act="plan"]'), 'Your plan');
  }
  assert.equal(await (await openApp({ profile: profile({ start: '2026-10-19' }) })).locator('#view [data-act="plan"]').count(), 1);
  const open = session('2026-10-14', 'A', [10, 0, 0], { status: 'active', id: 'd1' });
  assert.equal(await (await openApp({ sessions: [open], draft: open })).locator('#view [data-act="plan"]').count(), 0);
});
test('Training days moved out of Settings, and the explanation moved in', async () => {
  const page = await openApp({ sessions: abc() });
  await page.evaluate(() => ACT.settings());
  assert.equal(await page.locator('#sheet .daypick').count(), 0);
  assert.equal(await page.locator('#sheet details.how .legend p').count(), 3);
});
test('changing the usual days starts today', async () => {
  const page = await openApp({ sessions: [first()] });                                   // Monday 12 Oct was missed
  await page.evaluate(() => ACT.plan());
  await page.click('.daypick [data-d="5"]');
  await page.click('.daypick [data-d="1"]');
  await page.click('.daypick [data-d="6"]');
  assert.deepEqual(await page.evaluate(() => [myProfile().days.slice().sort(), myProfile().week]), [[3, 6], { mon: '2026-10-12', days: [1, 3, 6] }]);
  assert.deepEqual(await page.evaluate(() => weekModel(S.uid).days.map(d => d.state)), ['missed', 'rest', 'today', 'rest', 'rest', 'planned', 'rest']);
  assert.deepEqual(await texts(page, '[data-sheet="plan"] .daypick [aria-pressed="true"]'), ['Wed', 'Sat']);
});
test('one day at least, three at most', async () => {
  const page = await openApp({ profile: profile({ days: [1] }) });
  await page.evaluate(() => ACT.plan());
  await page.click('.daypick [data-d="1"]');
  assert.equal(await txt(page, '#toast'), 'Keep at least one training day.');
  const full = await openApp();
  await full.evaluate(() => ACT.plan());
  await full.click('.daypick [data-d="2"]');
  assert.equal(await txt(full, '#toast'), 'You already picked 3 days. Turn one off first.');
});
test('same every time shows one card', async () => {
  const page = await openApp({ sessions: abc(), profile: profile({ mode: 'same' }) });
  await page.evaluate(() => ACT.plan());
  assert.deepEqual(await texts(page, '.plan-card .h2'), ['Every workout']);
  assert.deepEqual(await texts(page, '.plan-card .plan-when'), ['Today']);
});
test('an exercise opens from the plan and closing returns to the plan', async () => {
  const page = await openApp({ sessions: abc() });
  await page.evaluate(() => ACT.plan());
  await page.click('.plan-card[data-tpl="B"] .plan-row[data-slot="pull"]');
  assert.equal(await page.locator('[data-sheet="ex"]').count(), 1);
  await page.click('[data-sheet="ex"] [data-act="closeSheet"]');
  assert.equal(await page.locator('[data-sheet="plan"]').count(), 1);
  await page.click('[data-sheet="plan"] [data-act="closeSheet"]');
  assert.equal(await page.locator('#sheet').isHidden(), true);
});
test('the welcome screen points to Your plan', async () => {
  const page = await openApp({ profile: null });
  assert.match(await txt(page, '#view form .tiny'), /^You train on Mon, Wed and Fri — change it any time in Your plan\./);
});
```

- [ ] **Step 2: Run and see them fail**

Run: `node --test --test-reporter=spec tests/plan.test.js`
Expected: fails on `[data-act="plan"]` (no such element) and `ACT.plan is not a function`.

- [ ] **Step 3: Add `SLOT_HELP`, `slotHelpHtml`, `legendHtml` and the plan sheet** as described under Interfaces.

- [ ] **Step 4: Move the training days and apply the from-today rule** in `ACT.day`; remove the "Training days" row from `settingsHtml`.

- [ ] **Step 5: Wire the links and texts**

- "Your plan" (`button.btn.link[data-act="plan"]`) is the first link in `div.wo-links` in the pre, train and rest situations, and the last link under the result in the done situation.
- `settingsHtml`: add `legendHtml()` after the list in "How 3-3-30 works". The buddy tip ends "…Then you see their week on Today and their scores under Progress." in both variants (website and Claude) instead of "Then tap their name next to Progress to see their charts and log."
- `viewOnboarding`: "You train on Mon, Wed and Fri — change it any time in Your plan."
- `ACT.editEx` and `submitExSheet` follow the back rule under Interfaces.

- [ ] **Step 6: Add the styles** from Appendix A, "Task 11".

- [ ] **Step 7: Run everything**

Run: `npm test`
Expected: all pass. In `tests/today.test.js` update the two link assertions to the new lists: `['Your plan', 'Swap workout']` and `['Edit', 'Train again today', 'Your plan']`.

- [ ] **Step 8: Commit**

```bash
git add 3-3-30/index.html tests/plan.test.js tests/today.test.js
git commit -m "Add Your plan: training days, the three workouts and what push, pull and legs mean"
git push
```

---

### Task 12: "This week"

**Files:**
- Modify: `3-3-30/index.html` (`weekStripHtml`, `viewToday`; new `weekSheet`, `ACT.week`, `ACT.weekDay`; styles: Appendix A "Task 12")
- Test: `tests/thisweek.test.js`

**Interfaces:**
- Consumes: `weekModel`, `upcoming`, `plannedDows`, `withWeekDays`, `dayDotHtml`, `showSheet`, `refreshSheet`, `ICON.pencil`, `ICON.check`.
- Produces: `SHEETS.week = { label: 'This week', html: weekSheet }`; `ACT.week()`; `ACT.weekDay(el)` (reads `data-date`; ignores a date before today or one with a training; toggles that weekday in this week's list, saves with `withWeekDays`, then `refreshSheet()`). Layout: head (`b.h2` "This week", `span.sheet-sub` "Mon 12 – Sun 18 Oct · tap a day to train or rest" — both ends with their month, as `fmtDM` writes it ("Mon 28 Sept – Sun 4 Oct"), when the week spans two months — and close); `section.card.wkd-list[aria-label="Days of this week"]` with seven `div.wkd[data-date]`: `span.wkd-d` ("Mon 12"), the day's dot as in your row of the strip, `span.wkd-st` (status), and either `span.wkd-ok` with the check icon (a done day), nothing (a past day), or `button.switch[role="switch"][data-act="weekDay"][data-date][aria-checked][aria-label="Train on Tuesday 13"]`. Then `p.wk-foot` "Only this week changes. Your usual days stay Mon, Wed and Fri." (one day "Mon", two "Mon and Wed"; Monday first) with `button.btn.link[data-act="plan"]` "Change usual days", and `button.btn.primary.xl[data-act="closeSheet"]` "Done".
- Status text: `Done`; past: `Missed` or `Rest`; today: `Today` or `Rest`; later: `Planned` or `Rest`. A planned day today or later that is not a usual day, paired with a usual day that is switched off (first extra day with first switched-off day, Monday first), gets ` · moved from Wed` after its status.
- The strip's head row ends with `button.iconbtn.wk-edit[data-act="week"][aria-label="Move a workout this week"]` (pencil), and a tap anywhere on the strip opens the sheet too. On a rest day `div.wo-links` gets "Change this week" (`data-act="week"`) as its second link.

- [ ] **Step 1: Write the failing tests** in `tests/thisweek.test.js`

```js
const status = page => texts(page, '[data-sheet="week"] .wkd-st');
const switches = page => page.locator('[data-sheet="week"] .switch').evaluateAll(els => els.map(e => e.dataset.date.slice(8) + ':' + e.getAttribute('aria-checked')));
const flip = (page, date) => page.click(`[data-sheet="week"] .switch[data-date="${date}"]`);

test('the sheet lists the seven days with their state', async () => {
  const page = await openApp({ today: '2026-10-13', sessions: abc() });
  await page.click('.wk-edit');
  assert.equal(await txt(page, '[data-sheet="week"] .sheet-head .h2'), 'This week');
  assert.equal(await txt(page, '[data-sheet="week"] .sheet-sub'), 'Mon 12 – Sun 18 Oct · tap a day to train or rest');
  assert.deepEqual(await texts(page, '[data-sheet="week"] .wkd-d'), ['Mon 12', 'Tue 13', 'Wed 14', 'Thu 15', 'Fri 16', 'Sat 17', 'Sun 18']);
  assert.deepEqual(await status(page), ['Done', 'Rest', 'Planned', 'Rest', 'Planned', 'Rest', 'Rest']);
  assert.deepEqual(await switches(page), ['13:false', '14:true', '15:false', '16:true', '17:false', '18:false']);
  assert.equal(await page.locator('[data-sheet="week"] .switch[data-date="2026-10-13"]').getAttribute('aria-label'), 'Train on Tuesday 13');
  assert.equal(await page.locator('[data-sheet="week"] .wkd[data-date="2026-10-12"] .wkd-ok').count(), 1);
});
test('today on and Wednesday off moves the workout', async () => {
  const page = await openApp({ today: '2026-10-13', sessions: abc() });
  await page.evaluate(() => ACT.week());
  await flip(page, '2026-10-13');
  assert.deepEqual((await status(page)).slice(1, 3), ['Today', 'Planned']);
  await flip(page, '2026-10-14');
  assert.deepEqual(await status(page), ['Done', 'Today · moved from Wed', 'Rest', 'Rest', 'Planned', 'Rest', 'Rest']);
  assert.deepEqual(await page.evaluate(() => myProfile().week), { mon: '2026-10-12', days: [1, 2, 5] });
  assert.deepEqual(await page.locator('[data-sheet="week"] .wd').evaluateAll(els => els.map(e => e.textContent.trim())), ['C', 'A', '', '', 'B', '', '']);
  await page.click('[data-sheet="week"] .btn.xl');
  assert.equal(await txt(page, '#view .title'), 'Workout A');
});
test('switching back drops the week list', async () => {
  const page = await openApp({ today: '2026-10-13', sessions: abc() });
  await page.evaluate(() => ACT.week());
  await flip(page, '2026-10-17');
  assert.deepEqual(await page.evaluate(() => myProfile().week.days), [1, 3, 5, 6]);
  await flip(page, '2026-10-17');
  assert.equal(await page.evaluate(() => 'week' in myProfile()), false);
});
test('past days cannot be changed', async () => {
  const page = await openApp({ today: '2026-10-15', sessions: abc() });
  await page.evaluate(() => ACT.week());
  assert.deepEqual((await status(page)).slice(0, 4), ['Done', 'Rest', 'Missed', 'Rest']);
  assert.deepEqual(await switches(page), ['15:false', '16:true', '17:false', '18:false']);
  await page.evaluate(() => ACT.weekDay({ dataset: { date: '2026-10-14' } }));
  assert.equal(await page.evaluate(() => 'week' in myProfile()), false);
});
test('switching the last coming day off is allowed', async () => {
  const page = await openApp({ today: '2026-10-15', sessions: abc() });
  await page.evaluate(() => ACT.week());
  await flip(page, '2026-10-16');
  assert.deepEqual(await page.evaluate(() => [myProfile().week.days, weekModel(S.uid).planned]), [[1, 3], 2]);
});
test('the footer names the usual days and leads to the plan', async () => {
  const page = await openApp({ today: '2026-10-13', sessions: abc() });
  await page.evaluate(() => ACT.week());
  assert.match(await txt(page, '[data-sheet="week"] .wk-foot'), /^Only this week changes\. Your usual days stay Mon, Wed and Fri\. Change usual days$/);
  await page.click('[data-sheet="week"] [data-act="plan"]');
  assert.equal(await page.locator('[data-sheet="plan"]').count(), 1);
  const two = await openApp({ profile: profile({ days: [5, 1] }) });
  await two.evaluate(() => ACT.week());
  assert.match(await txt(two, '[data-sheet="week"] .wk-foot'), /stay Mon and Fri\./);
});
test('on Sunday only Sunday can change, and the week spans the right dates', async () => {
  const page = await openApp({ today: '2026-10-18', sessions: abc() });
  await page.evaluate(() => ACT.week());
  assert.deepEqual(await switches(page), ['18:false']);
  const turn = await openApp({ today: '2026-09-30', profile: profile({ start: '2026-09-28' }) });
  await turn.evaluate(() => ACT.week());
  assert.equal(await txt(turn, '[data-sheet="week"] .sheet-sub'), 'Mon 28 Sept – Sun 4 Oct · tap a day to train or rest');
});
test('the strip and the rest-day link open the sheet', async () => {
  const page = await openApp({ today: '2026-10-13', sessions: abc() });
  assert.deepEqual(await texts(page, '.wo-links .btn'), ['Your plan', 'Change this week']);
  await page.click('.wo-links [data-act="week"]');
  assert.equal(await page.locator('[data-sheet="week"]').count(), 1);
  await page.keyboard.press('Escape');
  await page.click('.wk-row.me');
  assert.equal(await page.locator('[data-sheet="week"]').count(), 1);
  assert.equal(await page.locator('.wk-edit').getAttribute('aria-label'), 'Move a workout this week');
});
```

- [ ] **Step 2: Run and see them fail**

Run: `node --test --test-reporter=spec tests/thisweek.test.js`
Expected: fails on `.wk-edit` (no such element) and `ACT.week is not a function`.

- [ ] **Step 3: Implement the sheet, `ACT.week` and `ACT.weekDay`** as described under Interfaces.

- [ ] **Step 4: Make the strip open it and add the rest-day link.** The strip section carries `data-act="week"`; the "+n more" button inside it keeps its own action.

- [ ] **Step 5: Add the styles** from Appendix A, "Task 12".

- [ ] **Step 6: Run everything**

Run: `npm test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add 3-3-30/index.html tests/thisweek.test.js
git commit -m "Add This week: switch days on or off for the current week"
git push
```

---

### Task 13: Rules for exercise names, weight types and search

**Files:**
- Modify: `3-3-30/index.html` (new functions in the section "Exercises typed by name", 1079–1124)
- Test: `tests/exrules.test.js`

**Interfaces:**
- Consumes: `normName`, `exInfo`, `allExercises`, `eqOf`, `history`, `ALIAS`, `EQUIP`, `EQUIP_ORDER`, `slug`.
- Produces:
  - `cleanName(s) → string` — trimmed, inner whitespace collapsed, at most 40 characters.
  - `nameProblem(profile, name, key) → '' | 'empty' | 'taken'` — spec 6.1. `key` is the exercise being named, or `null` for a new one. `'taken'` when `normName(name)` equals the normalised name of another own exercise, another library exercise as the person named it, or another library exercise's original name.
  - `allowedEqs(id, key) → string[]` — spec 6.2, in `EQUIP_ORDER`: all five while `history(id, key)` is empty; otherwise `['barbell', 'db', 'machine']` when the exercise's type is one of those, else only its own type.
  - `searchExercises(profile, slot, q) → info[]` — spec 6.3: the exercises of that group (`exInfo` objects), sorted by name, whose name, original library name or one of its `ALIAS` names contains `normName(q)`; all of them for an empty `q`.
  - `newCustom(profile, name, slot, eq) → { p, key }` — a profile copy with a new own exercise (`k = 'c-' + slug(name)`, with `-2` appended while the key exists; `step`, `start`, `bw`, `dbl` from `EQUIP[eq]`).

- [ ] **Step 1: Write the failing tests** in `tests/exrules.test.js`

```js
const prob = (page, name, key, over) => page.evaluate(([n, k, o]) => nameProblem(Object.assign({}, myProfile(), o), n, k), [name, key, over || {}]);
const found = (page, slot, q, over) => page.evaluate(([s, t, o]) => searchExercises(Object.assign({}, myProfile(), o), s, t).map(e => e.n), [slot, q, over || {}]);

test('a name must be filled in and free', async () => {
  const page = await openApp();
  assert.equal(await prob(page, '   ', 'schouderdrukken'), 'empty');
  assert.equal(await prob(page, 'Seated cable row', 'schouderdrukken'), 'taken');
  assert.equal(await prob(page, 'seated-leg  PRESS', 'schouderdrukken'), 'taken');
  assert.equal(await prob(page, 'Overhead press', 'schouderdrukken'), '');
  assert.equal(await prob(page, 'Shoulder press', 'schouderdrukken'), '');
  assert.equal(await prob(page, 'Leg press', null), 'taken');
  assert.equal(await prob(page, 'Hip thrust', null), '');
});
test('a library name stays reserved after you rename that exercise', async () => {
  const page = await openApp();
  const mine = { names: { kabelroeien: 'Cable row' } };
  assert.equal(await prob(page, 'Cable row', 'schouderdrukken', mine), 'taken');
  assert.equal(await prob(page, 'Seated cable row', 'schouderdrukken', mine), 'taken');
  assert.equal(await prob(page, 'Seated cable row', 'kabelroeien', mine), '');
});
test('weight types: all five without scores, the plain three with', async () => {
  const none = await openApp();
  assert.deepEqual(await none.evaluate(() => allowedEqs(S.uid, 'schouderdrukken')), ['barbell', 'dbpair', 'db', 'machine', 'bw']);
  const page = await openApp({ sessions: abc() });
  assert.deepEqual(await page.evaluate(() => ['schouderdrukken', 'db-schouderdrukken', 'optrekken'].map(k => allowedEqs(S.uid, k))),
    [['barbell', 'db', 'machine'], ['dbpair'], ['bw']]);
});
test('search finds by name, by other known names and by the original name', async () => {
  const page = await openApp();
  assert.deepEqual(await found(page, 'push', ''), ['Barbell bench press', 'Chest press machine', 'Dips', 'Dumbbell bench press',
    'Incline dumbbell press', 'Overhead press', 'Push-ups', 'Seated dumbbell shoulder press']);
  assert.deepEqual(await found(page, 'push', 'Shoulder Press'), ['Overhead press', 'Seated dumbbell shoulder press']);
  assert.deepEqual(await found(page, 'legs', 'press'), ['Leg press', 'Seated leg press']);
  assert.deepEqual(await found(page, 'push', 'overhead', { names: { schouderdrukken: 'Shoulder press' } }), ['Shoulder press']);
  assert.deepEqual(await found(page, 'pull', 'zzz'), []);
});
test('a new exercise gets its own key and the settings of its weight type', async () => {
  const page = await openApp();
  const out = await page.evaluate(() => {
    const a = newCustom(myProfile(), 'Landmine press', 'push', 'barbell');
    const b = newCustom(a.p, 'Landmine  Press!', 'push', 'machine');
    return [a.key, a.p.custom.find(c => c.k === a.key), b.key, myProfile().custom.length];
  });
  assert.deepEqual(out, ['c-landmine-press', { k: 'c-landmine-press', n: 'Landmine press', s: 'push', eq: 'barbell', step: 2.5, start: 20, bw: false, dbl: false }, 'c-landmine-press-2', 1]);
});
```

- [ ] **Step 2: Run and see them fail**

Run: `node --test --test-reporter=spec tests/exrules.test.js`
Expected: `ReferenceError: nameProblem is not defined` (and the same for the other four).

- [ ] **Step 3: Implement `cleanName`, `nameProblem`, `allowedEqs`, `searchExercises` and `newCustom`** as described under Interfaces.

- [ ] **Step 4: Run everything**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add 3-3-30/index.html tests/exrules.test.js
git commit -m "Add the rules for exercise names, weight types and search"
git push
```

---

### Task 14: The "Exercise" sheet

**Files:**
- Modify: `3-3-30/index.html` (replace `exerciseSheet`, `sheetHit`, `syncExSheet`, `pickEq`, `updateExKg`, `typedExKg`, `submitExSheet`, `equipOptions`, `ACT.editEx`, `ACT.exKg`, and the `exName` / `exEq` branches of the input and change listeners; styles: Appendix A "Task 14")
- Test: `tests/exercise.test.js`

**Interfaces:**
- Consumes: `showSheet`, `refreshSheet`, `dismissSheet`, `nameProblem`, `cleanName`, `allowedEqs`, `exInfo`, `plannedKg`, `refBlock`, `history`, `blockKgLabel`, `stepKg`.
- Produces: `SHEETS.ex = { label: 'Exercise', html: exSheet }`. Sheet state: `UI.sheet = { kind: 'ex', view: 'edit', tpl, slot, back, key, name, eq, kg, kgTouched }`. `ACT.editEx(el)` builds that state from the plan; `ACT.eq(el)` picks a weight type (only one in `allowedEqs`); `ACT.exKg(el)` steps the weight. Layout of the edit view, `form[data-form="ex"][data-view="edit"]`:
  - head: plate, `div.eyebrow` "Push · Workout A" (only "Push" in same-every-time mode), `b.h2` "Exercise", close;
  - `label.f` "Name" with `input#exName` (max 40), then `p.tiny` "Rename it and your scores stay with it.";
  - `div.f` "Weight type" with `div.choices[aria-label="Weight type"]` of five `button[data-act="eq"][data-eq]` labelled from `EQUIP` ("Barbell", "Dumbbells (pair)", "One dumbbell", "Machine / cable", "Bodyweight"), `aria-pressed` on the chosen one, `disabled` on those not allowed; when any is disabled `span.tiny.eq-note` "Different kind of weight? Switch to another exercise.";
  - `div.f` "Next weight" with the stepper (`[data-act="exKg"][data-dir]`, `input#exKgIn`) and `span.small#exKgNote`: "steps of 2.5 kg"; for a pair "steps of 2 kg per dumbbell" (half the step); for bodyweight "steps of 2.5 kg · minus = assist";
  - with a score to beat, `div.to-beat`: `span.eyebrow` "Score to beat", `span.small` "At 35 kg · Mon 5 Oct", `span.goal-n` (reps), `span.goal-l` "reps";
  - `button.btn.primary.xl[type="submit"]` "Save";
  - `button.btn.ghost[data-act="exPick"]` "Switch to another exercise" and `span.tiny` "Another exercise keeps its own scores."
- Saving: refuse with a toast for `nameProblem` — `'empty'`: "Type a name for the exercise."; `'taken'`: "You already have an exercise with that name. Switch to it instead." Otherwise write the name (`names[key]`, removed when it equals the library name; `custom[].n` for an own exercise), the weight type (`eqs[key]`, removed when it equals the library's own; for an own exercise its `eq`, `step`, `bw`, `dbl`), and the weight when it was touched; toast "Saved."; then `dismissSheet()`.
- The step is the exercise's own step while the type is unchanged, and `EQUIP[eq].step` after a change. Changing to or from a pair or bodyweight puts the weight on that type's start weight, as `pickEq` does now.

- [ ] **Step 1: Write the failing tests** in `tests/exercise.test.js`

```js
const openEx = (page, slot = 'push') => page.click(`.wo .ex-row[data-slot="${slot}"]`);
const save = page => page.click('[data-sheet="ex"] button[type="submit"]');

test('the sheet shows name, weight type, weight and the score to beat', async () => {
  const page = await openApp({ sessions: abc() });
  await openEx(page);
  assert.equal(await page.locator('[data-sheet="ex"] [data-view="edit"]').count(), 1);
  assert.deepEqual([await txt(page, '[data-sheet="ex"] .sheet-head .eyebrow'), await txt(page, '[data-sheet="ex"] .sheet-head .h2')], ['Push · Workout A', 'Exercise']);
  assert.equal(await page.inputValue('#exName'), 'Overhead press');
  assert.equal(await txt(page, '[data-sheet="ex"] label[for="exName"] + .tiny'), 'Rename it and your scores stay with it.');
  assert.deepEqual(await texts(page, '[data-act="eq"]'), ['Barbell', 'Dumbbells (pair)', 'One dumbbell', 'Machine / cable', 'Bodyweight']);
  assert.deepEqual(await texts(page, '[data-act="eq"][aria-pressed="true"]'), ['Barbell']);
  assert.deepEqual(await texts(page, '[data-act="eq"]:disabled'), ['Dumbbells (pair)', 'Bodyweight']);
  assert.equal(await txt(page, '.eq-note'), 'Different kind of weight? Switch to another exercise.');
  assert.deepEqual([await page.inputValue('#exKgIn'), await txt(page, '#exKgNote')], ['35', 'steps of 2.5 kg']);
  assert.deepEqual([await txt(page, '.to-beat .eyebrow'), await txt(page, '.to-beat .small'), await txt(page, '.to-beat .goal-n'), await txt(page, '.to-beat .goal-l')],
    ['Score to beat', 'At 35 kg · Mon 5 Oct', '62', 'reps']);
  assert.deepEqual(await texts(page, '[data-sheet="ex"] .btn'), ['Save', 'Switch to another exercise']);
});
test('renaming keeps the scores', async () => {
  const page = await openApp({ sessions: abc() });
  await openEx(page);
  await page.fill('#exName', 'Shoulder press');
  await save(page);
  assert.equal(await txt(page, '#toast'), 'Saved.');
  assert.deepEqual(await page.evaluate(() => [myProfile().names, myProfile().plans.A.push]), [{ schouderdrukken: 'Shoulder press' }, 'schouderdrukken']);
  assert.deepEqual([await txt(page, '.wo .ex-n'), await txt(page, '.wo .goal-n')], ['Shoulder press', '62']);
});
test('a taken or empty name is refused and the sheet stays open', async () => {
  const page = await openApp({ sessions: abc() });
  await openEx(page);
  await page.fill('#exName', 'Seated cable row');
  await save(page);
  assert.equal(await txt(page, '#toast'), 'You already have an exercise with that name. Switch to it instead.');
  await page.fill('#exName', '  ');
  await save(page);
  assert.equal(await txt(page, '#toast'), 'Type a name for the exercise.');
  assert.equal(await page.locator('[data-sheet="ex"]').count(), 1);
  assert.equal(await page.evaluate(() => 'names' in myProfile()), false);
});
test('back to the original name drops your own name', async () => {
  const page = await openApp({ sessions: abc(), profile: profile({ names: { schouderdrukken: 'Shoulder press' } }) });
  await openEx(page);
  await page.fill('#exName', 'Overhead press');
  await save(page);
  assert.equal(await page.evaluate(() => 'names' in myProfile()), false);
});
test('a machine instead of a barbell changes the step', async () => {
  const page = await openApp({ sessions: abc() });
  await openEx(page);
  await page.click('[data-act="eq"][data-eq="machine"]');
  assert.equal(await txt(page, '#exKgNote'), 'steps of 5 kg');
  await page.click('[data-act="exKg"][data-dir="1"]');
  assert.equal(await page.inputValue('#exKgIn'), '40');
  await save(page);
  assert.deepEqual(await page.evaluate(() => [myProfile().eqs, myProfile().weights.schouderdrukken]), [{ schouderdrukken: 'machine' }, 40]);
  assert.deepEqual([await txt(page, '.wo .ex-kg'), await txt(page, '.wo .goal-l')], ['40 kg', 'reps to match']);
});
test('without scores an exercise can become a pair of dumbbells', async () => {
  const page = await openApp({ today: '2026-10-05' });
  await openEx(page);
  assert.equal(await page.locator('[data-act="eq"]:disabled').count(), 0);
  assert.equal(await page.locator('.eq-note').count(), 0);
  assert.equal(await page.locator('.to-beat').count(), 0);
  await page.click('[data-act="eq"][data-eq="dbpair"]');
  assert.deepEqual([await page.inputValue('#exKgIn'), await txt(page, '#exKgNote')], ['10', 'steps of 2 kg per dumbbell']);
  await save(page);
  assert.equal(await txt(page, '.wo .ex-kg'), '2 × 10 kg');
});
test('your own exercise is renamed in place', async () => {
  const page = await openApp({ sessions: abc() });
  await openEx(page, 'legs');
  await page.fill('#exName', 'Leg press machine');
  await save(page);
  assert.deepEqual(await page.evaluate(() => myProfile().custom.map(c => [c.k, c.n])), [['c-seated-leg-press', 'Leg press machine']]);
  assert.equal(await page.evaluate(() => history(S.uid, 'c-seated-leg-press').length), 1);
});
test('a bodyweight exercise explains minus kilos', async () => {
  const page = await openApp({ today: '2026-10-07', sessions: [first()] });
  await openEx(page, 'pull');
  assert.deepEqual([await txt(page, '[data-sheet="ex"] .sheet-head .eyebrow'), await txt(page, '#exKgNote')], ['Pull · Workout B', 'steps of 2.5 kg · minus = assist']);
});
test('saving from the plan returns to the plan', async () => {
  const page = await openApp({ sessions: abc() });
  await page.evaluate(() => ACT.plan());
  await page.click('.plan-card[data-tpl="A"] .plan-row[data-slot="push"]');
  await page.fill('#exName', 'Shoulder press');
  await save(page);
  assert.equal(await txt(page, '.plan-card[data-tpl="A"] .ex-n'), 'Shoulder press');
});
```

- [ ] **Step 2: Run and see them fail**

Run: `node --test --test-reporter=spec tests/exercise.test.js`
Expected: fails on `[data-view="edit"]` and `[data-act="eq"]` (no such elements).

- [ ] **Step 3: Build the edit view, its state and its handlers** as described under Interfaces. Typing in `#exName` updates `UI.sheet.name`; typing in `#exKgIn` updates `UI.sheet.kg` as `typedExKg` does now; picking a type or stepping the weight updates the state and calls `refreshSheet()`.

- [ ] **Step 4: Save** as described under Interfaces. Render the "Switch to another exercise" button now; Task 15 adds its handler `ACT.exPick`.

- [ ] **Step 5: Add the styles** from Appendix A, "Task 14".

- [ ] **Step 6: Run everything**

Run: `npm test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add 3-3-30/index.html tests/exercise.test.js
git commit -m "Rebuild the Exercise sheet: rename keeps scores, weight type as buttons, score to beat"
git push
```

---

### Task 15: Choosing another exercise, and adding your own

**Files:**
- Modify: `3-3-30/index.html` (`exSheet` gains two views; new handlers; styles: Appendix A "Task 15")
- Test: `tests/picker.test.js`

**Interfaces:**
- Consumes: `searchExercises`, `nameProblem`, `cleanName`, `newCustom`, `guessEquip`, `slotHelpHtml`, `eqOf`, `planFor`, `ICON.back`, `ICON.check`.
- Produces: `const EQ_SHORT = { barbell: 'Barbell', dbpair: 'Dumbbells', db: 'One dumbbell', machine: 'Machine / cable', bw: 'Bodyweight' }`. Sheet state gains `view: 'pick' | 'new'`, `q`, `newName`, `newEq`, `newEqTouched`. Handlers: `ACT.exPick()`, `ACT.exBack()` (pick → edit, new → pick), `ACT.pickEx(el)`, `ACT.exNew()`, `ACT.newEq(el)`; form `data-form="exNew"`.
  - **Pick view** `div[data-view="pick"]`: head with `button.iconbtn[data-act="exBack"][aria-label="Back"]` and `b.h2` "Choose a push exercise" (pull / legs); `div.legend.pick-help` with `slotHelpHtml(slot)`; `input#exSearch[type="search"][placeholder="Search, or type your own"][aria-label="Search exercises"]`; `div#exPickList`; `button.btn.ghost[data-act="exNew"]` "Add your own exercise".
  - **The list** (`#exPickList`, re-rendered on every keystroke without touching the search field): `span.eyebrow` "In your plan" + `section.card.pick-group[data-group="plan"]` with the matching exercises that are in workout A, B or C (in A, B, C order, each once; only plan A in same-every-time mode); `span.eyebrow` "More push exercises" + `section.card.pick-group[data-group="more"]` with the other matches by name. A group without rows is left out with its heading. No match at all: `p.small.pick-none` "No push exercise called “Landmine press”."
  - **A row** `button.pick-row[data-act="pickEx"][data-ex][aria-pressed]` (pressed and with the check icon for the current exercise): `span.ex-n` name and `span.tiny` — `EQ_SHORT` of its type, and in the plan group " · Workout A", or " · Workout A and C" when it is in two.
  - **Picking** another exercise puts it in the slot (plan A in same-every-time mode), saves, toasts "Barbell bench press is in Workout A." ("… is in your plan." in same-every-time mode) and shows the edit view for that exercise. Picking the current one only goes back.
  - **New view** `form[data-form="exNew"][data-view="new"]`: head with back and `b.h2` "New push exercise"; `label.f` "Name" with `input#newName` (filled with the search text); "Weight type" with five `button[data-act="newEq"][data-eq]`, preselected by `guessEquip(name)` until the person picks one; `button.btn.primary.xl[type="submit"]` "Add exercise". Submitting: `'empty'` → "Type a name for the exercise."; `'taken'` → "You already have an exercise with that name. Pick it from the list."; otherwise `newCustom`, then the same as picking.

- [ ] **Step 1: Write the failing tests** in `tests/picker.test.js`

```js
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
```

- [ ] **Step 2: Run and see them fail**

Run: `node --test --test-reporter=spec tests/picker.test.js`
Expected: fails on `[data-view="pick"]` (no such element).

- [ ] **Step 3: Build the pick view and its handlers** as described under Interfaces.

- [ ] **Step 4: Build the new-exercise view and its form** as described under Interfaces.

- [ ] **Step 5: Add the styles** from Appendix A, "Task 15".

- [ ] **Step 6: Run everything**

Run: `npm test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add 3-3-30/index.html tests/picker.test.js
git commit -m "Choose another exercise from a list, with search and your own exercises"
git push
```

---

### Task 16: Exercises as a list in the log form

**Files:**
- Modify: `3-3-30/index.html` (`sessionForm`, `syncFormExercise`, `submitSessionForm`, `ACT.formTpl`; remove `exByName`, `resolveExercise`, `fillNameList`, the `<datalist id="exNames">` and the call in `render`)
- Test: `tests/logform.test.js`

**Interfaces:**
- Consumes: `searchExercises`, `planFor`, `exInfo`, `plannedKg`, `kgFieldLabel`.
- Produces: in the form each exercise is `select[name="ex0|ex1|ex2"][aria-label="Push exercise"][data-slot]` with `optgroup[label="In your plan"]` (that group's exercises in workouts A, B and C, each once; only workout A in same-every-time mode) and `optgroup[label="More push exercises"]` (the rest by name). The option value is the exercise key. When the workout holds a key that is in neither group, one extra option comes first, with that key and the name stored in the workout. Nothing in the app turns a typed name into an exercise any more.

- [ ] **Step 1: Write the failing tests** in `tests/logform.test.js`

```js
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
```

- [ ] **Step 2: Run and see them fail**

Run: `node --test --test-reporter=spec tests/logform.test.js`
Expected: fails on `select[name="ex0"]` (the form still has text fields).

- [ ] **Step 3: Replace the text fields by lists** in `sessionForm`, as described under Interfaces.

- [ ] **Step 4: Follow the choice**

- `syncFormExercise(sel)` takes the key from the list and keeps what it does now for the weight field: its label (`kgFieldLabel`), the per-dumbbell value, and for a new log the planned weight of the chosen exercise unless the person already typed a weight.
- `ACT.formTpl` sets each list to that workout's exercise.
- `submitSessionForm` takes each block's exercise from its list; the parts that matched or created exercises from names go. "Use these from now on?" stays as it is.
- Remove `exByName`, `resolveExercise`, `fillNameList`, the `<datalist>` and the `fillNameList()` call in `render`.

- [ ] **Step 5: Run everything**

Run: `npm test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add 3-3-30/index.html tests/logform.test.js
git commit -m "Pick exercises from a list when logging; stop turning typed names into exercises"
git push
```

---

### Task 17: Progress: this week and your scores

**Files:**
- Modify: `3-3-30/index.html` (`viewProgressPage`; new `scoreRow`, `sparkHtml`, `weekCardHtml`, `scoresCardHtml`; `UI`, `ACT`; styles: Appendix A "Task 17")
- Test: `tests/scores.test.js`

**Interfaces:**
- Consumes: `history`, `weekModel`, `trainings`, `blockVolume`, `nextTpl`, `planFor`, `exInfo`, `plannedKg`, `kgLabel`, `blockKgLabel`, `dayShort`, `plateHtml`.
- Produces:
  - `scoreRow(pid, key) → { state, kg, n, date, best, delta, dk, prev, series }` — spec 2.11. The series is the full scores of `history(pid, key)`, or all of them when none is full. `state`: `'none'` (empty), `'one'`, `'same'` (the last two at the same weight) or `'changed'`. `kg`, `n`, `date`: weight, reps and date of the last score. `best`: the most reps at that weight. `delta`: reps of the last minus the one before. `dk`: weight of the last minus the one before. `prev`: `{ n, kg }` of the one before. `series`: the reps of the last eight.
  - `sparkHtml(series, slot) → string` — `<svg class="spark" width="56" height="28" viewBox="0 0 56 28" aria-hidden="true">`: one path through the points, x from 3 to 53 in equal steps, y from 23 (lowest value) to 5 (highest), y 14 for every point when all values are equal; a dot of radius 3.2 on the last point; colour `var(--c-SLOT)`, stroke width 2.2, round caps and joins. The path is `M x,y` then `L x,y` per further point, without spaces, each number rounded to one decimal and written without a trailing `.0` (`M3,23L28,14L53,5`).
  - `UI.scoreTpl` (`null` = the workout that is next for that person); `ACT.scoreTpl(el)`; `ACT.person` also resets it.
  - `viewProgressPage()` shows, under the head: `weekCardHtml(pid)`, `scoresCardHtml(pid)`, then the log head and (until Task 19) the existing log table.
    - **Week card** `section.card.pw[aria-label="This week"]`: `span.eyebrow` "This week"; `span.pw-n` "1 of 3 workouts" (`done` of `planned` from `weekModel`), or "Nothing planned this week." when both are 0; `span.pw-kg` with `span.goal-n` (the kilos lifted in this week's trainings, `fmtNum` of the rounded sum) and `span.goal-l` "kg lifted", left out when the sum is 0. No card before that person's start date.
    - **Scores card** `section.card.sc[aria-label="Scores"]`: `span.eyebrow` "Your scores" or "Sam’s scores"; in A/B/C mode `div.seg[aria-label="Workout"]` with `button[data-act="scoreTpl"][data-tpl]`; three `button.sc-row[data-act="exHistory"][data-ex][data-slot]` for the exercises of the chosen workout in that person's plan: plate, `span.ex-main` (`span.ex-n`, `span.sc-sub`), then by state —
      - `none`: sub = the planned weight; right `span.sc-none` "No score yet";
      - `one`: sub "35 kg · first score, Mon 5 Oct"; right `span.sc-n` + `span.sc-u` "reps";
      - `same`: sub "35 kg · best 68"; the spark line; right `span.sc-n` + `span.sc-d` "▲ +3" (class `pos`), "▼ −2" or "same";
      - `changed`: sub "80 kg · was 88 at 75 kg"; the spark line; right `span.sc-n` + `span.sc-d` "+5 kg" or "−5 kg".

      The weight in the sub is bold (`<b>`), written with `kgLabel`.

- [ ] **Step 1: Write the failing tests** in `tests/scores.test.js`

```js
const toProgress = page => page.click('#tabs [data-tab="progress"]');
const pickA = page => page.click('.sc [data-act="scoreTpl"][data-tpl="A"]');

test('the score row of an exercise', async () => {
  const page = await openApp({ today: '2026-10-21', sessions: threeWeeks() });
  const [a, c, none] = await page.evaluate(() => ['schouderdrukken', 'c-seated-leg-press', 'pendlay'].map(k => scoreRow(S.uid, k)));
  assert.deepEqual([a.state, a.kg, a.n, a.best, a.delta, a.series], ['same', 35, 68, 68, 3, [62, 65, 68]]);
  assert.deepEqual([c.state, c.kg, c.n, c.dk, c.prev], ['changed', 80, 79, 5, { n: 88, kg: 75 }]);
  assert.equal(none.state, 'none');
  const one = await openApp({ today: '2026-10-07', sessions: [first()] });
  assert.deepEqual(await one.evaluate(() => { const r = scoreRow(S.uid, 'kabelroeien'); return [r.state, r.n, r.date]; }), ['one', 77, '2026-10-05']);
});
test('a block that was stopped early only counts when there is nothing else', async () => {
  const cut = session('2026-10-12', 'A', [20, 78, 88], { cut: [true, false, false] });
  const page = await openApp({ today: '2026-10-14', sessions: [first(), cut] });
  assert.deepEqual(await page.evaluate(() => { const r = scoreRow(S.uid, 'schouderdrukken'); return [r.state, r.n]; }), ['one', 62]);
  const only = await openApp({ today: '2026-10-07', sessions: [session('2026-10-05', 'A', [20, 77, 85], { cut: [true, false, false] })] });
  assert.deepEqual(await only.evaluate(() => { const r = scoreRow(S.uid, 'schouderdrukken'); return [r.state, r.n]; }), ['one', 20]);
});
test('this week and your scores after three weeks', async () => {
  const page = await openApp({ today: '2026-10-21', sessions: threeWeeks() });
  await toProgress(page);
  assert.deepEqual([await txt(page, '.pw .eyebrow'), await txt(page, '.pw-n'), await txt(page, '.pw-kg .goal-n'), await txt(page, '.pw-kg .goal-l')],
    ['This week', '1 of 3 workouts', '13,900', 'kg lifted']);
  assert.equal(await txt(page, '.sc .eyebrow'), 'Your scores');
  assert.deepEqual(await texts(page, '.sc [data-act="scoreTpl"][aria-pressed="true"]'), ['B']);
  assert.deepEqual(await texts(page, '.sc .sc-sub'), ['2 × 10 kg', 'bodyweight', '2 × 16 kg']);
  assert.deepEqual(await texts(page, '.sc .sc-none'), ['No score yet', 'No score yet', 'No score yet']);
  await pickA(page);
  assert.deepEqual(await texts(page, '.sc .ex-n'), ['Overhead press', 'Seated cable row', 'Seated leg press']);
  assert.deepEqual(await texts(page, '.sc .sc-sub'), ['35 kg · best 68', '65 kg · best 80', '80 kg · was 88 at 75 kg']);
  assert.deepEqual(await texts(page, '.sc .sc-n'), ['68', '80', '79']);
  assert.deepEqual(await texts(page, '.sc .sc-d'), ['▲ +3', '▲ +2', '+5 kg']);
  assert.equal(await page.locator('.sc .sc-d.pos').count(), 2);
  assert.equal(await page.locator('.sc svg.spark').count(), 3);
  assert.equal(await page.locator('.sc-row[data-ex="schouderdrukken"] .spark path').getAttribute('d'), 'M3,23L28,14L53,5');
});
test('a first score, a level score and a lower one', async () => {
  const one = await openApp({ today: '2026-10-07', sessions: [first()] });
  await toProgress(one); await pickA(one);
  assert.deepEqual(await texts(one, '.sc .sc-sub'), ['35 kg · first score, Mon 5 Oct', '65 kg · first score, Mon 5 Oct', '75 kg · first score, Mon 5 Oct']);
  assert.deepEqual([await texts(one, '.sc .sc-n'), await texts(one, '.sc .sc-u')], [['62', '77', '85'], ['reps', 'reps', 'reps']]);
  assert.equal(await one.locator('.sc svg.spark').count(), 0);
  const two = await openApp({ today: '2026-10-14', sessions: [first(), session('2026-10-12', 'A', [62, 75, 90], { kg: [35, 65, 70] })] });
  await toProgress(two); await pickA(two);
  assert.deepEqual(await texts(two, '.sc .sc-d'), ['same', '▼ −2', '−5 kg']);
  assert.equal(await two.locator('.sc-row[data-ex="schouderdrukken"] .spark path').getAttribute('d'), 'M3,14L53,14');
});
test('nothing planned, nothing lifted and before the start', async () => {
  const empty = await openApp({ sessions: [first()], profile: profile({ week: { mon: '2026-10-12', days: [] } }) });
  await toProgress(empty);
  assert.equal(await txt(empty, '.pw-n'), 'Nothing planned this week.');
  assert.equal(await empty.locator('.pw-kg').count(), 0);
  const pre = await openApp({ profile: profile({ start: '2026-10-19' }) });
  await toProgress(pre);
  assert.equal(await pre.locator('.pw').count(), 0);
  assert.equal(await pre.locator('.sc').count(), 1);
});
test('same every time has no letters to choose', async () => {
  const page = await openApp({ sessions: [first()], profile: profile({ mode: 'same' }) });
  await toProgress(page);
  assert.equal(await page.locator('.sc [data-act="scoreTpl"]').count(), 0);
  assert.deepEqual(await texts(page, '.sc .ex-n'), ['Overhead press', 'Seated cable row', 'Seated leg press']);
});
test('a buddy’s scores carry his name, his plan and his names', async () => {
  const sam = { id: 'sam', profile: profile({ nick: 'Sam', names: { schouderdrukken: 'Military press' } }), sessions: threeWeeks() };
  const page = await openApp({ today: '2026-10-21', sessions: [first()], crew: [sam] });
  await toProgress(page);
  await page.click('[data-act="person"][data-id="sam"]');
  assert.equal(await txt(page, '.sc .eyebrow'), 'Sam’s scores');
  assert.equal(await txt(page, '.pw-n'), '1 of 3 workouts');
  await pickA(page);
  assert.deepEqual([await txt(page, '.sc .ex-n'), await txt(page, '.sc .sc-d')], ['Military press', '▲ +3']);
});
test('long names and big numbers stay inside a 320 px screen', async () => {
  const page = await openApp({ width: 320, today: '2026-10-21', sessions: threeWeeks(), profile: profile({ names: { schouderdrukken: 'Standing barbell overhead press strict x' } }) });
  await toProgress(page); await pickA(page);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
});
```

- [ ] **Step 2: Run and see them fail**

Run: `node --test --test-reporter=spec tests/scores.test.js`
Expected: `ReferenceError: scoreRow is not defined`; the screen tests fail on missing `.pw` and `.sc` elements.

- [ ] **Step 3: Implement `scoreRow` and `sparkHtml`** as described under Interfaces.

- [ ] **Step 4: Build the two cards** and put them in `viewProgressPage` in place of the chart cards. The old `viewProgress` and its chart cards go; `chartBox`, `drawChart` and their styles stay for Task 18.

- [ ] **Step 5: Add the styles** from Appendix A, "Task 17".

- [ ] **Step 6: Run everything**

Run: `npm test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add 3-3-30/index.html tests/scores.test.js
git commit -m "Show this week and a score per exercise on Progress"
git push
```

---

### Task 18: The history of one exercise

**Files:**
- Modify: `3-3-30/index.html` (new `exHistorySheet`, `ACT.exHistory`; `openSheet` draws charts; styles: Appendix A "Task 18")
- Test: `tests/exhistory.test.js`

**Interfaces:**
- Consumes: `showSheet`, `history`, `chartBox`, `drawCharts`, `blockVolume`, `scored`, `blockKgLabel`, `exInfo`, `SLOT`.
- Produces: `SHEETS.exHistory = { label: 'Exercise history', html: exHistorySheet }`; state `{ kind: 'exHistory', pid, key, slot }`; `ACT.exHistory(el)` (reads `data-ex` and `data-slot`, takes the person from `personPick()`). Layout: head (plate, `div.eyebrow` "Push", `b.h2` the exercise name, close); `div.pg-charts` with two `div.pg-chart` — "Reps" and "Kilos lifted" — built the way the old progress card built them, including the texts "The line starts the 2nd time." (fewer than two points) and "Bodyweight: counted in reps." (no kilos to chart); `section.card.eh-list` with one `div.eh-row` per score, newest first: "Mon 19 Oct · 35 kg · 68 reps", with " · stopped early" after a block that was cut. Every score of `history(pid, key)` is listed, full or not. After any sheet opens or refreshes, `drawCharts` runs on it.

- [ ] **Step 1: Write the failing tests** in `tests/exhistory.test.js`

```js
const open = async (page, key) => { await page.click('#tabs [data-tab="progress"]'); await page.click('.sc [data-act="scoreTpl"][data-tpl="A"]'); await page.click(`.sc-row[data-ex="${key}"]`); };

test('charts and every score of one exercise', async () => {
  const page = await openApp({ today: '2026-10-21', sessions: threeWeeks() });
  await open(page, 'schouderdrukken');
  assert.deepEqual([await txt(page, '[data-sheet="exHistory"] .sheet-head .eyebrow'), await txt(page, '[data-sheet="exHistory"] .sheet-head .h2')], ['Push', 'Overhead press']);
  assert.deepEqual(await texts(page, '[data-sheet="exHistory"] .pg-lbl span'), ['Reps', 'Kilos lifted']);
  assert.equal(await page.locator('[data-sheet="exHistory"] .pg-svg svg').count(), 2);
  assert.deepEqual(await texts(page, '.eh-row'), ['Mon 19 Oct · 35 kg · 68 reps', 'Mon 12 Oct · 35 kg · 65 reps', 'Mon 5 Oct · 35 kg · 62 reps']);
});
test('one score waits for a second, and a cut block is marked', async () => {
  const page = await openApp({ today: '2026-10-07', sessions: [session('2026-10-05', 'A', [20, 77, 85], { cut: [true, false, false] })] });
  await open(page, 'schouderdrukken');
  assert.deepEqual(await texts(page, '.pg-wait'), ['The line starts the 2nd time.', 'The line starts the 2nd time.']);
  assert.deepEqual(await texts(page, '.eh-row'), ['Mon 5 Oct · 35 kg · 20 reps · stopped early']);
});
test('bodyweight counts reps only', async () => {
  const page = await openApp({ today: '2026-10-16', sessions: [session('2026-10-07', 'B', [30, 8, 40]), session('2026-10-14', 'B', [30, 10, 40])] });
  await page.click('#tabs [data-tab="progress"]');
  await page.click('.sc [data-act="scoreTpl"][data-tpl="B"]');
  await page.click('.sc-row[data-ex="optrekken"]');
  assert.equal(await page.locator('[data-sheet="exHistory"] .pg-svg svg').count(), 1);
  assert.deepEqual(await texts(page, '.pg-wait'), ['Bodyweight: counted in reps.']);
  assert.deepEqual(await texts(page, '.eh-row'), ['Wed 14 Oct · bodyweight · 10 reps', 'Wed 7 Oct · bodyweight · 8 reps']);
});
test('a buddy’s exercise opens the same way', async () => {
  const sam = { id: 'sam', profile: profile({ nick: 'Sam' }), sessions: threeWeeks() };
  const page = await openApp({ today: '2026-10-21', sessions: [first()], crew: [sam] });
  await page.click('#tabs [data-tab="progress"]');
  await page.click('[data-act="person"][data-id="sam"]');
  await page.click('.sc [data-act="scoreTpl"][data-tpl="A"]');
  await page.click('.sc-row[data-ex="kabelroeien"]');
  assert.equal((await texts(page, '.eh-row')).length, 3);
});
```

- [ ] **Step 2: Run and see them fail**

Run: `node --test --test-reporter=spec tests/exhistory.test.js`
Expected: fails on `[data-sheet="exHistory"]` (tapping a row does nothing yet).

- [ ] **Step 3: Implement the sheet and its handler** as described under Interfaces.

- [ ] **Step 4: Add the styles** from Appendix A, "Task 18".

- [ ] **Step 5: Run everything**

Run: `npm test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add 3-3-30/index.html tests/exhistory.test.js
git commit -m "Open the charts and every score of an exercise from its row"
git push
```

---

### Task 19: The log

**Files:**
- Modify: `3-3-30/index.html` (`viewProgressPage`; replace `viewLog`, `logTable`, `logCell`, `beatPrev`; new `logListHtml`, `sessionViewSheet`, `ACT.viewSession`; styles: Appendix A "Task 19")
- Test: `tests/log.test.js`

**Interfaces:**
- Consumes: `shownSessions`, `sessionSummary`, `isTrial`, `resultRowsHtml`, `dayShort`, `showSheet`.
- Produces:
  - `logListHtml(pid) → string` — `section.card.lg[aria-label="Workouts"]` with the workouts of `shownSessions(pid)`, newest first: eight, then `button.btn.link[data-act="logAll"]` "Show all 14 workouts". Each row is `button.lg-row[data-id]` — `data-act="edit"` for your own, `data-act="viewSession"` for a buddy's — with `span.lg-date` "Mon 19 Oct"; `span.lg-tpl` (the letter; "practice" for a practice workout; no letter in same-every-time mode); `span.lg-main` holding `span.lg-reps` "68 · 80 · 79 reps" (push, pull, legs; "–" for an exercise that was skipped) and `span.lg-sum` (`sessionSummary`, left out when empty); and a chevron. Without workouts: `p.small.empty` "No workouts yet." for yourself, "Sam hasn’t logged a workout yet." for a buddy.
  - `SHEETS.sessionView = { label: 'Workout', html: sessionViewSheet }`; state `{ kind: 'sessionView', pid, id }`; `ACT.viewSession(el)`. Layout: head (`div.eyebrow` "Sam · Workout A", `b.h2` "Mon 19 Oct", close) and a card with `resultRowsHtml(s, pid)`. Nothing in it can be changed.

- [ ] **Step 1: Write the failing tests** in `tests/log.test.js`

```js
const toProgress = page => page.click('#tabs [data-tab="progress"]');
const cells = async (page, i) => [await txt(page, `.lg-row >> nth=${i} >> .lg-date`), await txt(page, `.lg-row >> nth=${i} >> .lg-tpl`), await txt(page, `.lg-row >> nth=${i} >> .lg-reps`)];

test('a row per workout: date, letter, reps and the short verdict', async () => {
  const page = await openApp({ today: '2026-10-21', sessions: threeWeeks() });
  await toProgress(page);
  assert.equal(await txt(page, '#view .log-head .h2'), 'Log');
  assert.deepEqual(await cells(page, 0), ['Mon 19 Oct', 'A', '68 · 80 · 79 reps']);
  assert.deepEqual(await texts(page, '.lg-sum'), ['2 of 2 beaten · 1 heavier', '3 of 3 beaten', '3 first scores']);
  assert.equal(await page.locator('#view .lt').count(), 0);
});
test('a skipped exercise is a dash and a practice workout has no verdict', async () => {
  const page = await openApp({ sessions: [session('2026-09-30', 'A', [5, 5, 5]), session('2026-10-05', 'A', [62, 0, 85])] });
  await toProgress(page);
  assert.deepEqual(await cells(page, 0), ['Mon 5 Oct', 'A', '62 · – · 85 reps']);
  assert.deepEqual(await cells(page, 1), ['Wed 30 Sept', 'practice', '5 · 5 · 5 reps']);
  assert.deepEqual(await texts(page, '.lg-sum'), ['2 first scores']);
});
test('eight at first, then all of them', async () => {
  const ten = Array.from({ length: 10 }, (_, i) => session('2026-10-' + String(i + 5).padStart(2, '0'), 'ABC'[i % 3], [10, 10, 10]));
  const page = await openApp({ today: '2026-10-21', sessions: ten });
  await toProgress(page);
  assert.equal(await page.locator('.lg-row').count(), 8);
  assert.equal(await txt(page, '[data-act="logAll"]'), 'Show all 10 workouts');
  await page.click('[data-act="logAll"]');
  assert.equal(await page.locator('.lg-row').count(), 10);
  assert.equal(await txt(page, '.lg-row >> nth=0 >> .lg-date'), 'Wed 14 Oct');
});
test('no workouts yet', async () => {
  const page = await openApp();
  await toProgress(page);
  assert.equal(await txt(page, '#view .empty'), 'No workouts yet.');
});
test('your own workout opens for editing', async () => {
  const page = await openApp({ sessions: [first()] });
  await toProgress(page);
  await page.click('.lg-row');
  assert.equal(await txt(page, '#sheet .h2'), 'Edit workout');
});
test('a buddy’s workout opens to read only', async () => {
  const sam = { id: 'sam', profile: profile({ nick: 'Sam' }), sessions: threeWeeks() };
  const none = { id: 'tom', profile: profile({ nick: 'Tom' }), sessions: [] };
  const page = await openApp({ today: '2026-10-21', sessions: [first()], crew: [sam, none] });
  await toProgress(page);
  await page.click('[data-act="person"][data-id="sam"]');
  assert.equal(await page.locator('.lg-row').count(), 3);
  await page.click('.lg-row');
  assert.deepEqual([await txt(page, '[data-sheet="sessionView"] .eyebrow'), await txt(page, '[data-sheet="sessionView"] .h2')], ['Sam · Workout A', 'Mon 19 Oct']);
  assert.deepEqual(await texts(page, '[data-sheet="sessionView"] .ex-n'), ['Overhead press', 'Seated cable row', 'Seated leg press']);
  assert.deepEqual(await texts(page, '[data-sheet="sessionView"] .goal-n'), ['68', '80', '79']);
  assert.equal(await page.locator('[data-sheet="sessionView"] input, [data-sheet="sessionView"] select, [data-sheet="sessionView"] [type="submit"]').count(), 0);
  await page.keyboard.press('Escape');
  await page.click('[data-act="person"][data-id="tom"]');
  assert.equal(await txt(page, '#view .empty'), 'Tom hasn’t logged a workout yet.');
});
test('same every time shows no letter', async () => {
  const page = await openApp({ sessions: [first()], profile: profile({ mode: 'same' }) });
  await toProgress(page);
  assert.equal(await page.locator('.lg-row .lg-tpl').count(), 0);
});
```

- [ ] **Step 2: Run and see them fail**

Run: `node --test --test-reporter=spec tests/log.test.js`
Expected: fails on `.lg-row` (the old table is still there).

- [ ] **Step 3: Implement `logListHtml`, the read-only sheet and its handler** as described under Interfaces, and use the list in `viewProgressPage`.

- [ ] **Step 4: Remove the old table**: `viewLog`, `logTable`, `logCell`, `beatPrev` and the line "Kilos lifted = weight × reps. ▲ = beat last time. Tap a workout to change it."

- [ ] **Step 5: Add the styles** from Appendix A, "Task 19".

- [ ] **Step 6: Run everything**

Run: `npm test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add 3-3-30/index.html tests/log.test.js
git commit -m "Rebuild the log: one row per workout with reps and a short verdict"
git push
```

---

### Task 20: Clean up, build the website copy, check the whole

**Files:**
- Modify: `3-3-30/index.html` (dead code and styles), `docs/index.html` (rebuilt), `README.md`, `docs/SETUP.md`
- Create: `tests/whole.test.js`, `tests/shots.js`

**Interfaces:**
- Consumes: everything above.
- Produces: a clean source file, the rebuilt website copy on the work branch, and screenshots for the owner. Nothing goes live in this task.

- [ ] **Step 1: Write the failing tests** in `tests/whole.test.js`

```js
const fs = require('node:fs');
const path = require('node:path');
const sam = () => ({ id: 'sam', profile: profile({ nick: 'Sam' }), sessions: threeWeeks() });
const visit = async page => {
  for (const act of ['plan', 'week', 'swap', 'settings', 'manual']) { await page.evaluate(a => ACT[a](), act); await page.keyboard.press('Escape'); }
  await page.click('.wo .ex-row'); await page.click('[data-act="exPick"]'); await page.click('[data-act="exNew"]'); await page.keyboard.press('Escape');
  await page.click('#tabs [data-tab="progress"]'); await page.click('.sc-row'); await page.keyboard.press('Escape');
};

for (const dark of [false, true]) for (const width of [390, 320]) {
  test(`every screen and sheet opens cleanly (${dark ? 'dark' : 'light'}, ${width} px)`, async () => {
    const page = await openApp({ dark, width, sessions: abc(), crew: [sam()] });
    await visit(page);
    assert.deepEqual(page.__errors, []);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
  });
}
test('the dark theme has its own ring colour', async () => {
  const light = await (await openApp()).evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ring').trim());
  const dark = await (await openApp({ dark: true })).evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ring').trim());
  assert.deepEqual([light, dark], ['#C9C4B8', '#4B515A']);
});
test('nothing of the old screens is left in the source', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '3-3-30', 'index.html'), 'utf8');
  for (const gone of ['templateFor', 'nextTrainingDay', 'beatPrev', 'logTable', 'logCell', 'viewLog', 'chartEx', 'exByName', 'resolveExercise',
    'fillNameList', 'sheetHit', 'syncExSheet', 'equipOptions', 'exNames', '.lt-row', '.pg-card', 'Done for today', 'pick 3', 'next to Progress']) {
    assert.equal(src.includes(gone), false, gone + ' is still in the source');
  }
});
test('the website copy is built from this source', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '3-3-30', 'index.html'), 'utf8');
  const web = fs.readFileSync(path.join(__dirname, '..', 'docs', 'index.html'), 'utf8');
  assert.equal(web.includes(src.slice(src.indexOf('<div class="app" id="app">')).trim()), true);
});
```

- [ ] **Step 2: Run and see them fail**

Run: `node --test --test-reporter=spec tests/whole.test.js`
Expected: "nothing of the old screens is left" fails on the first leftover it meets; "the website copy" fails because `docs/index.html` is the old build.

- [ ] **Step 3: Remove what nothing uses any more**

Go through the list in the test and through the stylesheet: the `.lt*` rules and their media query, `.pg-card`, `.pg-t`, `.pg-ex`, the empty section comments ("Today: week dots", "Stats", "Charts", "History", "Crew"), `UI.chartEx` and `ACT.chartEx`, and any function no caller is left for. Keep `chartBox`, `drawChart`, `.pg-charts`, `.pg-chart`, `.pg-lbl`, `.pg-svg`, `.pg-wait` (the history sheet uses them), `compare`, `recordKind` and `VERDICT_TEXT` (the workout timer uses them).

- [ ] **Step 4: Rebuild the website copy**

Run: `python3 3-3-30/build_web.py`
Expected: `built docs/index.html`

- [ ] **Step 5: Update the two documents** (Dutch, as they are)

- `README.md`: add the lines "Testen: `npm install` en daarna `npm test`." and "Ontwerp en bouwplan staan in `superpowers/`."
- `docs/SETUP.md`, section 4: replace "Na het inloggen zien jullie elkaar onder **Progress** (Me | naam)." by "Na het inloggen zie je de week van je maatje op **Today** en zijn scores onder **Progress**." In "Bijwerken", add after the build command: "Draai eerst de tests: `npm install` en `npm test`."

- [ ] **Step 6: Run everything**

Run: `npm test`
Expected: all pass.

- [ ] **Step 7: Write `tests/shots.js` and take the screenshots**

A script, not a test: `node tests/shots.js` writes PNGs to `shots/` (ignored by git) with `openApp` and `page.screenshot({ path, fullPage: true })`, each in light and dark at 390 × 844:

| File | State |
|---|---|
| `today-train` | `sessions: abc()`, one buddy |
| `today-rest` | `today: '2026-10-13'`, `sessions: abc()` |
| `today-done` | `today: '2026-10-05'`, `sessions: [first()]` |
| `sheet-plan`, `sheet-week`, `sheet-swap` | `sessions: abc()`, each sheet open |
| `sheet-exercise`, `sheet-pick` | `sessions: abc()`, the push exercise of Workout A |
| `progress` | `today: '2026-10-21'`, `sessions: threeWeeks()`, Workout A chosen |
| `sheet-history` | the same, "Overhead press" open |

Look at every picture next to its artboard in the canvas: alignment, spacing, nothing cut off, nothing unreadable in the dark theme. Fix what is off, re-run `npm test`, take the pictures again.

- [ ] **Step 8: Commit**

```bash
git add 3-3-30/index.html docs/index.html README.md docs/SETUP.md tests/whole.test.js tests/shots.js
git commit -m "Remove the old screens, rebuild the website copy and document the tests"
git push
```

- [ ] **Step 9: Stop and report**

Do not merge into `main`. Send the owner the screenshots and a short note in Dutch on what changed and what he should try, and ask whether it may go live. Going live is: merge `redesign` into `main` and push, then check the live site signs in and shows his data. Tell him and his buddy to reload the page once afterwards: an old copy of the page that saves the profile would wipe a new name or this week's changes (spec section 11).

---

## Appendix A: Styles

Add each block when its task says so. Values come from the artboards; colours are the app's variables.

**Task 6** — add `--ring: #C9C4B8;` to `:root`, and `--ring: #4B515A;` to both dark blocks. Change `.app`'s bottom padding and the toast's bottom offset as shown.

```css
.app { padding-block: 0 calc(96px + env(safe-area-inset-bottom, 0px)); }
.toast { bottom: calc(88px + env(safe-area-inset-bottom, 0px)); }
.tabs { position: fixed; z-index: 20; left: 50%; transform: translateX(-50%); bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  width: min(528px, calc(100% - 32px)); height: 60px; padding: 4px; background: var(--surface); border-radius: 999px;
  box-shadow: 0 1px 2px rgb(40 30 10 / .08), 0 12px 28px -12px rgb(40 30 10 / .3); display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px; }
.tabs button { border: 0; border-radius: 999px; background: transparent; color: var(--ink-2); font-weight: 750; font-size: 15px;
  display: flex; align-items: center; justify-content: center; gap: 8px; }
.tabs button[aria-pressed="true"] { background: var(--primary); color: var(--on-primary); }
.pr-head { align-items: flex-end; flex-wrap: wrap; padding-block: 6px 4px; }
```

**Task 7**

```css
.wk { padding: 14px 14px 12px; gap: 8px; }
.wk-row { display: grid; grid-template-columns: 66px repeat(7, minmax(0, 1fr)) 32px; align-items: center; column-gap: 2px; min-height: 28px; }
.wk-head > :first-child { font-family: var(--display); font-stretch: 125%; font-size: 10.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }
.wk-d { justify-self: center; font-family: var(--display); font-stretch: 125%; font-size: 10.5px; font-weight: 800; color: var(--muted); }
.wk-d[aria-current="date"] { padding: 0 4px 2px; box-shadow: inset 0 -2px 0 var(--ink); color: var(--ink); }
.wk-who { font-size: 14px; font-weight: 650; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wk-n { justify-self: end; font-family: var(--display); font-stretch: 80%; font-weight: 800; font-size: 15px; font-variant-numeric: tabular-nums; }
.wk-row:not(.me) .wk-who, .wk-row:not(.me) .wk-n { color: var(--ink-2); }
.wk-more { justify-self: start; min-height: 44px; font-size: 14px; }
.wd { justify-self: center; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; font-family: var(--display); font-weight: 800; font-size: 13px; }
.wd svg { width: 14px; height: 14px; stroke-width: 3.2; }
.wd[data-state="rest"] { width: 5px; height: 5px; background: var(--line); }
.wd[data-state="done"] { background: var(--ink); color: var(--bg); }
.wk-row:not(.me) .wd[data-state="done"] { background: var(--ink-2); }
.wd[data-state="today"] { box-shadow: inset 0 0 0 2.5px var(--ink); }
.wd[data-state="planned"] { box-shadow: inset 0 0 0 1.5px var(--ring); color: var(--muted); }
.wd[data-state="todayRest"] { border: 2px dashed var(--ink-2); }
.wd[data-state="missed"] { border: 1.5px dashed var(--ring); }
```

**Task 8**

```css
.sheet-sub { font-size: 14px; color: var(--muted); }
.swap-opt { width: 100%; border: 0; border-radius: var(--r-lg); background: var(--surface); box-shadow: var(--shadow); padding: 14px 16px; min-height: 64px;
  text-align: left; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2px 10px; align-items: center; }
.swap-t { font-family: var(--display); font-stretch: 72%; font-weight: 800; font-size: 22px; line-height: 1.05; }
.swap-opt .small { grid-column: 1 / -1; }
.swap-next { border-radius: 999px; padding: 3px 10px; background: var(--primary); color: var(--on-primary); font-size: 13px; font-weight: 650; white-space: nowrap; }
```

**Task 9**

```css
.goal { display: grid; justify-items: end; gap: 3px; }
.goal-n { font-family: var(--display); font-stretch: 75%; font-weight: 900; font-size: 42px; line-height: .86; font-variant-numeric: tabular-nums; }
.goal-l { font-family: var(--display); font-stretch: 125%; font-size: 9.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); white-space: nowrap; }
.goal-l.pos { color: var(--good); }
.ex-sub .ex-kg { font-size: 15px; color: var(--ink-2); }
```

**Task 10**

```css
.wo { padding: 12px 14px 8px; gap: 4px; }
.wo .ex-list { gap: 0; }
.wo .ex-list li + li { border-top: 1px solid var(--surface-2); }
.wo .ex-row { padding: 8px 4px; min-height: 64px; }
.wo > .btn.xl { margin-top: 8px; }
.wo-next { display: grid; gap: 4px; padding: 2px 4px; }
.wo-note { text-align: center; font-size: 13px; color: var(--muted); margin-top: 2px; }
.wo-links { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0 12px; }
.wo-links .btn.link, .after .btn.link { min-height: 44px; font-size: 15px; }
.after { display: grid; gap: 2px; padding: 0 4px; }
.next-line { font-size: 15px; color: var(--ink-2); }
.next-line b { color: var(--ink); }
```

**Task 11**

```css
.plan-card { padding: 12px 14px 8px; gap: 2px; }
.plan-card .h2 { font-size: 22px; }
.plan-when { border-radius: 999px; padding: 3px 10px; background: var(--surface-2); color: var(--ink-2); font-size: 13px; font-weight: 650; white-space: nowrap; }
.plan-when.now { background: var(--primary); color: var(--on-primary); }
.plan-row { width: 100%; border: 0; background: transparent; text-align: left; display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center; gap: 10px; padding: 6px 4px; min-height: 48px; }
.plan-row + .plan-row { border-top: 1px solid var(--surface-2); }
.plan-row .ex-n { font-size: 17px; }
.legend { display: grid; gap: 8px; padding: 4px 4px 0; }
.legend p { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 10px; align-items: start; font-size: 14px; color: var(--ink-2); }
.legend i { margin-top: 4px; width: 14px; height: 14px; border-radius: 50%; }
.legend i.push { background: var(--push); } .legend i.pull { background: var(--pull); } .legend i.legs { background: var(--legs); }
.legend b { color: var(--ink); }
```

**Task 12**

```css
.wk { cursor: pointer; }
.wk-edit { justify-self: end; width: 44px; height: 44px; margin: -8px -10px -8px 0; background: transparent; color: var(--ink-2); }
.wk-edit svg { width: 16px; height: 16px; }
.wkd-list { padding: 4px 14px; gap: 0; }
.wkd { display: grid; grid-template-columns: 64px 30px minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 0 4px; min-height: 54px; }
.wkd + .wkd { border-top: 1px solid var(--surface-2); }
.wkd-d { font-family: var(--display); font-stretch: 80%; font-weight: 800; font-size: 16px; }
.wkd-st { font-size: 14px; color: var(--ink-2); }
.wkd-ok { width: 54px; height: 44px; display: grid; place-items: center; color: var(--good); }
.wkd-ok svg { width: 20px; height: 20px; stroke-width: 2.8; }
.switch { width: 54px; height: 44px; padding: 0; border: 0; background: transparent; display: grid; place-items: center; }
.switch i { width: 46px; height: 28px; border-radius: 999px; background: var(--ring); padding: 3px; display: flex; justify-content: flex-start; }
.switch i::after { content: ""; width: 22px; height: 22px; border-radius: 50%; background: var(--surface); }
.switch[aria-checked="true"] i { background: var(--primary); justify-content: flex-end; }
.wk-foot { padding: 0 4px; font-size: 14px; color: var(--ink-2); }
.wk-foot .btn.link { min-height: 44px; font-size: 14px; }
```

**Task 14**

```css
.sheet .choices button { min-height: 44px; padding: 8px 14px; }
.to-beat { background: var(--surface); border-radius: var(--r); box-shadow: var(--shadow); padding: 12px 14px; display: flex; align-items: center; gap: 12px; }
.to-beat .grow { display: grid; gap: 2px; }
.to-beat .goal-n { font-size: 36px; }
```

**Task 15**

```css
.pick-group { padding: 4px 14px; gap: 0; }
.pick-row { width: 100%; border: 0; background: transparent; text-align: left; display: grid; grid-template-columns: minmax(0, 1fr) auto;
  align-items: center; gap: 10px; padding: 6px 4px; min-height: 54px; }
.pick-row + .pick-row { border-top: 1px solid var(--surface-2); }
.pick-row .ex-n { display: block; font-size: 17px; }
.pick-row .tiny { font-size: 13px; }
.pick-row svg { width: 20px; height: 20px; stroke-width: 2.8; color: var(--good); }
#exPickList { display: grid; gap: 10px; }
#exPickList .eyebrow { padding: 2px 4px 0; }
input[type="search"] { width: 100%; border: 0; box-shadow: inset 0 0 0 1.5px var(--line); border-radius: var(--r-sm); background: var(--surface); padding: 11px 13px; min-height: 48px; font-size: 16px; }
```

**Task 17**

```css
.pw { grid-template-columns: minmax(0, 1fr) auto; align-items: center; padding: 12px 18px; gap: 2px 12px; }
.pw .eyebrow { grid-column: 1; }
.pw-n { grid-column: 1; font-size: 15px; font-weight: 650; }
.pw-kg { grid-column: 2; grid-row: 1 / span 2; display: grid; justify-items: end; gap: 3px; }
.pw-kg .goal-n { font-size: 30px; line-height: .9; }
.sc { padding: 12px 14px 10px; gap: 4px; }
.sc > .row { padding: 0 4px 4px; }
.sc-row { width: 100%; border: 0; background: transparent; text-align: left; display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center; gap: 10px; padding: 8px 4px; min-height: 64px; border-radius: var(--r); }
.sc-row + .sc-row { border-top: 1px solid var(--surface-2); }
.sc-sub { font-size: 13.5px; color: var(--muted); }
.sc-sub b { color: var(--ink-2); font-variant-numeric: tabular-nums; }
.sc-r { display: grid; justify-items: end; gap: 4px; min-width: 46px; }
.sc-n { font-family: var(--display); font-stretch: 75%; font-weight: 900; font-size: 36px; line-height: .86; font-variant-numeric: tabular-nums; }
.sc-d, .sc-u, .sc-none { font-size: 12.5px; font-weight: 800; color: var(--ink-2); white-space: nowrap; }
.sc-d.pos { color: var(--good); }
.sc-none { color: var(--muted); font-weight: 650; }
```

**Task 18**

```css
.eh-list { padding: 4px 14px; gap: 0; }
.eh-row { padding: 12px 4px; font-size: 15px; font-variant-numeric: tabular-nums; }
.eh-row + .eh-row { border-top: 1px solid var(--surface-2); }
```

**Task 19**

```css
.lg { padding: 4px 14px; gap: 0; }
.lg-row { width: 100%; border: 0; background: transparent; text-align: left; display: grid; grid-template-columns: 92px minmax(30px, auto) minmax(0, 1fr) auto;
  align-items: center; gap: 10px; padding: 8px 4px; min-height: 54px; }
.lg-row + .lg-row { border-top: 1px solid var(--surface-2); }
.lg-date { font-family: var(--display); font-stretch: 80%; font-weight: 800; font-size: 16px; }
.lg-tpl { justify-self: start; border-radius: 6px; padding: 1px 7px; background: var(--surface-2); color: var(--ink-2); font-family: var(--display); font-weight: 800; font-size: 12px; }
.lg-main { display: grid; gap: 1px; min-width: 0; }
.lg-reps { font-weight: 700; font-size: 15px; font-variant-numeric: tabular-nums; }
.lg-sum { font-size: 13.5px; color: var(--ink-2); }
@media (max-width: 359px) { .lg-row { grid-template-columns: 78px minmax(26px, auto) minmax(0, 1fr) auto; gap: 8px; } }
```
