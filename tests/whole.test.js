const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { openApp, closeAll, profile, session, first, abc, threeWeeks, txt, texts, at, forward } = require('./helpers');
after(closeAll);

const fs = require('node:fs');
const path = require('node:path');
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
  await forward(page, 1); await page.click('.xc[data-form="done"]'); await ok('edit sheet'); await page.keyboard.press('Escape');
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
test('the dark theme has its own ring colour', async () => {
  const light = await (await openApp()).evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ring').trim());
  const dark = await (await openApp({ dark: true })).evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ring').trim());
  assert.deepEqual([light, dark], ['#C9C4B8', '#4B515A']);
});
test('no function of the app hides the browser’s own history', async () => {
  const page = await openApp({ sessions: [first()] });
  assert.deepEqual(await page.evaluate(() => [typeof history.pushState, scoresOf(S.uid, 'schouderdrukken').length]), ['function', 1]);
});
test('nothing of the old screens is left in the source', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '3-3-30', 'index.html'), 'utf8');
  for (const gone of ['templateFor', 'nextTrainingDay', 'beatPrev', 'logTable', 'logCell', 'viewLog', 'chartEx', 'exByName', 'resolveExercise',
    'fillNameList', 'sheetHit', 'syncExSheet', 'equipOptions', 'exNames', '.lt-row', '.pg-card', 'pick 3', 'next to Progress',
    'renderRunner', 'openRunner', 'runMenu', 'finishAndSave', 'id="runner"', 'Workout done', 'Save workout', 'Skip this exercise', 'End block', 'New PR', 'Lifted in total',
    'Finish later', 'Resume workout', 'Train again today',
    'plannedDows', 'weekModel', 'upcoming(', 'movedDay', 'withWeekDays', 'moveFor', 'weekSheet', 'planSheet', 'weekStripHtml', 'dayDotHtml', 'lateStart', 'Your plan', 'Training days', 'Rest day',
    'Train anyway', '.daypick', '.wkd', 'data-act="week"', 'data-act="plan"', 'UI.tab', 'Today, Progress', 'Today and Progress', 'Today | Progress']) {
    assert.equal(src.includes(gone), false, gone + ' is still in the source');
  }
});
test('the website copy is built from this source', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '3-3-30', 'index.html'), 'utf8');
  const web = fs.readFileSync(path.join(__dirname, '..', 'docs', 'index.html'), 'utf8');
  assert.equal(web.includes(src.slice(src.indexOf('<div class="app" id="app">')).trim()), true);
});
test('the tests wrap the page in the same base styles as the website', () => {
  const build = fs.readFileSync(path.join(__dirname, '..', '3-3-30', 'build_web.py'), 'utf8');
  const style = build.match(/<style>(.*)<\/style>/)[1].replace(/\{\{/g, '{').replace(/\}\}/g, '}');
  assert.equal(require('./helpers').BASE_STYLE, style);
});
