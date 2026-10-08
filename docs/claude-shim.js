/* Runs the 3-3-30 Log outside Claude. The page talks to a small `window.claude` API
   (db, user, downloads); here that API is backed by Firebase: Google or e-mail sign-in,
   a one-time crew code, and Firestore as the shared log. */
(function () {
  'use strict';
  const cfg = window.FIREBASE_CONFIG;
  const css = `
    .gate { position: fixed; inset: 0; z-index: 200; background: var(--bg, #F3F1EC); color: var(--ink, #16181B); overflow-y: auto;
      display: grid; align-items: start; justify-items: center; padding: max(28px, env(safe-area-inset-top)) 16px 32px; font-family: var(--body, system-ui, sans-serif); }
    .gate[hidden] { display: none; }
    .gate-in { width: 100%; max-width: 420px; display: grid; gap: 16px; }
    .gate-brand { font-family: var(--display, system-ui); font-stretch: 112%; font-weight: 900; font-size: 22px; }
    .gate-brand i { font-style: normal; color: var(--push, #CC2D27); }
    .gate h1 { font-family: var(--display, system-ui); font-stretch: 68%; font-weight: 800; font-size: 40px; line-height: .95; margin: 8px 0 0; }
    .gate p { margin: 0; color: var(--ink-2, #4A4E55); font-size: 15px; line-height: 1.45; }
    .gate-card { background: var(--surface, #fff); border-radius: 18px; padding: 18px; display: grid; gap: 12px; box-shadow: 0 10px 24px -14px rgb(40 30 10 / .25); }
    .gate label { display: grid; gap: 6px; font-size: 14px; font-weight: 650; color: var(--ink-2, #4A4E55); }
    .gate input { width: 100%; box-sizing: border-box; border: 0; box-shadow: inset 0 0 0 1.5px var(--line, #DAD6CD); border-radius: 10px; background: var(--surface, #fff);
      color: var(--ink, #16181B); padding: 11px 13px; min-height: 48px; font: inherit; font-size: 16px; font-weight: 500; }
    .gate input:focus { outline: none; box-shadow: inset 0 0 0 2px var(--pull, #1E58C8); }
    .gate button { font: inherit; cursor: pointer; border: 0; border-radius: 999px; min-height: 48px; padding: 10px 18px; font-weight: 750; font-size: 16px;
      background: var(--surface-2, #E9E6DF); color: var(--ink, #16181B); }
    .gate button.primary { background: var(--primary, #16181B); color: var(--on-primary, #F3F1EC); }
    .gate button.link { background: none; min-height: 40px; padding: 6px 4px; text-decoration: underline; text-underline-offset: 3px; color: var(--ink-2, #4A4E55); font-weight: 650; justify-self: center; }
    .gate button:disabled { opacity: .5; }
    .gate-row { display: flex; gap: 8px; flex-wrap: wrap; } .gate-row > * { flex: 1 1 140px; }
    .gate-or { text-align: center; font-size: 13px; color: var(--muted, #5E626A); }
    .gate-err { color: var(--bad, #B3261E); font-size: 14px; font-weight: 650; min-height: 1em; }
    .gate-google { display: flex; align-items: center; justify-content: center; gap: 10px; }
    .gate-google svg { width: 20px; height: 20px; }`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const downloads = downloadsFactory();
  const gate = document.createElement('div');
  gate.className = 'gate'; gate.hidden = true; gate.setAttribute('role', 'dialog'); gate.setAttribute('aria-modal', 'true'); gate.setAttribute('aria-label', 'Sign in');
  const mountGate = () => { if (!gate.isConnected) document.body.appendChild(gate); };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const brand = '<div class="gate-brand" aria-label="3-3-30">3<i>·</i>3<i>·</i>30</div>';
  const G = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  const say = (msg) => { const e = gate.querySelector('.gate-err'); if (e) e.textContent = msg || ''; };
  const busy = on => gate.querySelectorAll('button, input').forEach(el => { el.disabled = on; });
  const authMsg = e => {
    const c = (e && e.code) || '';
    if (c.includes('popup-closed') || c.includes('cancelled-popup')) return '';
    if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'That e-mail and password don’t match. Try again or create an account.';
    if (c.includes('email-already-in-use')) return 'There is already an account with this e-mail. Sign in instead.';
    if (c.includes('weak-password')) return 'Use a password of at least 6 characters.';
    if (c.includes('invalid-email')) return 'That isn’t a valid e-mail address.';
    if (c.includes('network')) return 'No connection. Check your internet and try again.';
    if (c.includes('too-many-requests')) return 'Too many tries. Wait a minute and try again.';
    if (c.includes('unauthorized-domain') || c.includes('operation-not-allowed')) return 'Sign-in isn’t switched on for this site yet (see the setup steps).';
    return 'Signing in didn’t work. Try again.';
  };

  /* ---- No Firebase settings yet: offer this device only ---- */
  function notSetUp() {
    return new Promise(resolve => {
      mountGate();
      gate.innerHTML = `<div class="gate-in">${brand}<h1>Not connected yet</h1>
        <p>This copy of the app has no shared log set up, so workouts can’t be shared yet. You can still use it on this device only.</p>
        <button class="primary" data-g="local">Use on this device only</button></div>`;
      gate.hidden = false;
      gate.querySelector('[data-g="local"]').onclick = () => { gate.hidden = true; resolve(null); };
    });
  }
  if (!cfg || !cfg.apiKey || !window.firebase) {
    const local = notSetUp();
    window.claude = { use: async name => (name === 'downloads' ? downloads : (await local, null)) };
    return;
  }

  firebase.initializeApp(cfg);
  const auth = firebase.auth();
  const fs = firebase.firestore();
  if (window.FIREBASE_EMULATORS) { auth.useEmulator('http://127.0.0.1:9099', { disableWarnings: true }); fs.useEmulator('127.0.0.1', 8089); }
  // Keep a copy on the phone: the gym often has no signal; writes sync when it's back.
  try { fs.enablePersistence({ synchronizeTabs: true }).catch(() => {}); } catch { /* not available */ }

  /* ---- Step 1: sign in ---- */
  function signInScreen() {
    mountGate();
    gate.innerHTML = `<div class="gate-in">${brand}<h1>Train together</h1>
      <p>Sign in so your workouts are saved and your training buddy can follow your progress (and you theirs).</p>
      <div class="gate-card">
        <button class="primary gate-google" data-g="google">${G}<span>Continue with Google</span></button>
        <div class="gate-or">or with e-mail</div>
        <label>E-mail<input type="email" id="gEmail" autocomplete="email" inputmode="email"></label>
        <label>Password<input type="password" id="gPass" autocomplete="current-password" minlength="6"></label>
        <div class="gate-row"><button data-g="in">Sign in</button><button data-g="new">Create account</button></div>
        <button class="link" data-g="reset">Forgot password?</button>
        <div class="gate-err" role="alert"></div>
      </div></div>`;
    gate.hidden = false;
    const val = id => gate.querySelector(id).value.trim();
    const run = async fn => { say(''); busy(true); try { await fn(); } catch (e) { say(authMsg(e)); } finally { busy(false); } };
    gate.querySelector('[data-g="google"]').onclick = () => run(async () => {
      const prov = new firebase.auth.GoogleAuthProvider();
      try { await auth.signInWithPopup(prov); }
      catch (e) { if ((e.code || '').includes('popup-blocked')) await auth.signInWithRedirect(prov); else throw e; }
    });
    gate.querySelector('[data-g="in"]').onclick = () => run(() => auth.signInWithEmailAndPassword(val('#gEmail'), gate.querySelector('#gPass').value));
    gate.querySelector('[data-g="new"]').onclick = () => run(() => auth.createUserWithEmailAndPassword(val('#gEmail'), gate.querySelector('#gPass').value));
    gate.querySelector('[data-g="reset"]').onclick = () => run(async () => {
      if (!val('#gEmail')) { say('Type your e-mail first.'); return; }
      await auth.sendPasswordResetEmail(val('#gEmail'));
      say('Check your e-mail for a link to set a new password.');
    });
  }

  /* ---- Step 2: the crew code (once per person) ---- */
  function crewScreen(user) {
    return new Promise(resolve => {
      mountGate();
      gate.innerHTML = `<div class="gate-in">${brand}<h1>Join your crew</h1>
        <p>Ask the person who set up this log for the crew code. You only enter it once.</p>
        <div class="gate-card">
          <label>Crew code<input type="text" id="gCode" autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="go"></label>
          <button class="primary" data-g="join">Join</button>
          <div class="gate-err" role="alert"></div>
        </div>
        <button class="link" data-g="out">Not ${esc(user.email || 'you')}? Sign out</button></div>`;
      gate.hidden = false;
      const join = async () => {
        const code = gate.querySelector('#gCode').value.trim();
        if (!code) { say('Type the crew code.'); return; }
        say(''); busy(true);
        try { await fs.doc('crew/' + user.uid).set({ code, at: Date.now() }); gate.hidden = true; resolve(); }
        catch (e) { say((e && e.code) === 'permission-denied' ? 'That code isn’t right. Check it with your crew.' : 'Couldn’t join right now. Check your connection and try again.'); }
        finally { busy(false); }
      };
      gate.querySelector('[data-g="join"]').onclick = join;
      gate.querySelector('#gCode').onkeydown = e => { if (e.key === 'Enter') join(); };
      gate.querySelector('[data-g="out"]').onclick = () => auth.signOut();
    });
  }
  async function inCrew(uid) {
    try { return (await fs.doc('crew/' + uid).get()).exists; }
    catch (e) {
      if ((e && e.code) === 'permission-denied') return false;
      // Offline on a known device: let the page open from its saved copy.
      return localStorage.getItem('d330.crew.' + uid) === '1';
    }
  }

  /* ---- The API the page uses ---- */
  const CODE = { 'permission-denied': 'not_granted', 'resource-exhausted': 'quota_exceeded', unavailable: 'unavailable' };
  const fail = e => { const x = new Error((e && e.message) || 'failed'); x.code = CODE[e && e.code] || (e && e.code) || 'unknown'; return x; };
  const clean = d => JSON.parse(JSON.stringify(d));
  // A write is safe once it is in the phone's copy; don't wait forever for the server when offline.
  const settle = p => Promise.race([p, new Promise(r => setTimeout(r, navigator.onLine === false ? 300 : 4000))]).catch(e => { throw fail(e); });
  const db = Object.freeze({
    doc(path) {
      const ref = fs.doc(path);
      return Object.freeze({
        get: () => ref.get().then(s => ({ exists: s.exists, data: () => s.data() })).catch(e => { throw fail(e); }),
        set: data => settle(ref.set(clean(data))),
        delete: () => settle(ref.delete()),
      });
    },
    collection(path) {
      const ref = fs.collection(path);
      return Object.freeze({
        onSnapshot(next, error) {
          return ref.onSnapshot({ includeMetadataChanges: true },
            snap => next({ docs: snap.docs.map(d => ({ id: d.id, data: () => d.data() })), metadata: { fromCache: snap.metadata.fromCache } }),
            e => { if (error) error(fail(e)); });
        },
      });
    },
  });
  let current = null;
  const user = Object.freeze({
    id: async () => current.uid,
    me: async () => ({ name: current.displayName || (current.email || '').split('@')[0] || '', avatarUrl: current.photoURL || '' }),
    can: async () => true,
    profiles: async () => ({}),
    isOwner: () => false,
    canEdit: () => false,
  });

  let resolveReady;
  const ready = new Promise(r => { resolveReady = r; });
  let started = false;
  auth.onAuthStateChanged(async u => {
    if (!u) {
      if (started) { location.reload(); return; }   // signed out: start clean
      signInScreen();
      return;
    }
    if (started) return;
    if (!(await inCrew(u.uid))) await crewScreen(u);
    try { localStorage.setItem('d330.crew.' + u.uid, '1'); } catch { /* ignore */ }
    started = true; current = u; gate.hidden = true;
    resolveReady();
  });
  window.__333web = Object.freeze({
    who: () => (current ? current.email || current.displayName || '' : ''),
    signOut: () => auth.signOut(),
  });
  window.claude = Object.freeze({
    use: async name => {
      if (name === 'downloads') return downloads;
      if (name === 'db') { await ready; return db; }
      if (name === 'user') { await ready; return user; }
      return null;
    },
  });

  /* Hand the viewer a file (backup / CSV). */
  function downloadsFactory() {
    return Object.freeze({
      save: async ({ filename, data }) => {
        const blob = new Blob([data], { type: /\.csv$/i.test(filename) ? 'text/csv;charset=utf-8' : 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      },
    });
  }
}());
