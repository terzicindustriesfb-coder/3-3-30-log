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
