// Screenshots and a keyboard pass for the UI bench (tools/ui-dev.html). Needs the dev server.
//
//   node tools/ui-shot.mjs                 every scene at both sizes, then the keyboard pass
//   node tools/ui-shot.mjs menu            only scenes whose name contains "menu" (or "menu,map,card")
//   node tools/ui-shot.mjs menu phone      ... and only at phone size
//   node tools/ui-shot.mjs --keys          only the keyboard and robustness pass
//
// Writes PNGs to out/ui/<scene>-<size>.png and prints console and page errors.

import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAGE = 'http://localhost:5190/tools/ui-dev.html?bare';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'out', 'ui');
mkdirSync(OUT, { recursive: true });

const args = process.argv.slice(2);
const keysOnly = args.includes('--keys');
const filter = args.filter((a) => !a.startsWith('--'))[0] || '';
const sizeFilter = args.filter((a) => !a.startsWith('--'))[1] || '';
const SIZES = [
  { name: 'desk', width: 1280, height: 720, deviceScaleFactor: 1 },
  { name: 'phone', width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  // only when named:  node tools/ui-shot.mjs "" narrow   or   node tools/ui-shot.mjs talk ultra
  { name: 'narrow', width: 360, height: 640, deviceScaleFactor: 1, isMobile: true, hasTouch: true, extra: true },
  { name: 'ultra', width: 2560, height: 1080, deviceScaleFactor: 1, extra: true },
  { name: 'landscape', width: 844, height: 390, deviceScaleFactor: 1, isMobile: true, hasTouch: true, extra: true },
];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = (page, js) => page.evaluate(js);                    // read a value
const act = (page, js) => page.evaluate(js + '\n;undefined');   // do something; never waits on a promise it returns
const press = async (page, key, n = 1, gap = 60) => { for (let i = 0; i < n; i++) { await page.keyboard.press(key); await wait(gap); } };

const SCENES = [
  { name: 'hud-dark', run: async (p) => { await act(p, 'dev.spin(false); dev.hud()'); await wait(700); } },
  { name: 'hud-bright', run: async (p) => { await act(p, "dev.backdrop('bright'); dev.spin(false); dev.hud(); dev.toasts()"); await wait(900); } },
  { name: 'talk-say', run: async (p) => { await act(p, 'dev.spin(false); dev.hud(); dev.marit()'); await wait(1300); } },
  { name: 'talk-choose', run: async (p) => { await act(p, 'dev.spin(false); dev.hud(); dev.marit()'); await wait(300); await press(p, 'Enter', 7, 120); await wait(600); } },
  { name: 'talk-choose-bright', run: async (p) => { await act(p, "dev.backdrop('bright'); dev.spin(false); dev.hud(); dev.marit()"); await wait(300); await press(p, 'Enter', 7, 120); await press(p, 'ArrowDown'); await wait(600); } },
  { name: 'menu', run: async (p) => { await act(p, 'dev.spin(false); dev.hud(); dev.menu()'); await wait(700); } },
  { name: 'menu-bright', run: async (p) => { await act(p, "dev.backdrop('bright'); dev.spin(false); dev.hud(); dev.menu(21.6)"); await wait(400); await press(p, 'ArrowDown', 2); await wait(400); } },
  { name: 'hour', run: async (p) => { await act(p, 'dev.spin(false); dev.hud(); dev.hour()'); await wait(400); await press(p, 'ArrowRight', 2); await wait(300); } },
  { name: 'notes', run: async (p) => { await act(p, 'dev.spin(false); dev.hud(); dev.discovery(); dev.subs(); dev.bubble()'); await wait(1500); } },
  { name: 'notes-bright', run: async (p) => { await act(p, "dev.backdrop('bright'); dev.spin(false); dev.hud(); dev.discovery(); dev.subs(); dev.bubble()"); await wait(1500); } },
  { name: 'banner', run: async (p) => { await act(p, "ui.hud.show(false); dev.arrival()"); await wait(2400); } },
  { name: 'banner-bright', run: async (p) => { await act(p, "dev.backdrop('bright'); dev.spin(false); dev.hud(); ui.prompt(null); dev.arrival()"); await wait(2400); } },
  { name: 'ride', run: async (p) => { await act(p, "dev.spin(false); dev.hud(); ui.reticle('none'); ui.prompt(null); dev.ride(); dev.letterbox(true)"); await wait(1100); } },
  { name: 'pause', run: async (p) => { await act(p, 'dev.spin(false); dev.hud(); dev.pause()'); await wait(600); } },
  { name: 'settings', run: async (p) => { await act(p, 'dev.spin(false); dev.hud(); dev.pause()'); await wait(300); await press(p, 'ArrowDown'); await press(p, 'Enter'); await wait(500); await press(p, 'ArrowDown', 2); await wait(300); } },
  { name: 'settings-scrolled', run: async (p) => { await act(p, 'dev.spin(false); dev.hud(); dev.pause()'); await wait(300); await press(p, 'ArrowDown'); await press(p, 'Enter'); await wait(500); await press(p, 'ArrowDown', 12, 40); await wait(400); } },
  { name: 'help', run: async (p) => { await act(p, 'dev.spin(false); dev.hud(); dev.pause()'); await wait(300); await press(p, 'ArrowDown', 2); await press(p, 'Enter'); await wait(600); } },
  { name: 'chapters', run: async (p) => { await act(p, 'dev.spin(false); dev.hud(); dev.pause()'); await wait(300); await press(p, 'ArrowDown', 3); await press(p, 'Enter'); await wait(600); } },
  { name: 'journal-threads', run: async (p) => { await act(p, "dev.spin(false); dev.hud(); dev.journal('threads')"); await wait(600); } },
  { name: 'journal-found', run: async (p) => { await act(p, "dev.spin(false); dev.hud(); dev.journal('found')"); await wait(400); await press(p, 'ArrowDown', 1); await wait(300); } },
  { name: 'journal-unfound', run: async (p) => { await act(p, "dev.spin(false); dev.hud(); dev.journal('found')"); await wait(400); await press(p, 'ArrowDown', 5); await wait(300); } },
  { name: 'journal-people', run: async (p) => { await act(p, "dev.spin(false); dev.hud(); dev.journal('people')"); await wait(600); } },
  { name: 'journal-detail', size: 'phone', run: async (p) => { await act(p, "dev.spin(false); dev.hud(); dev.journal('found'); setTimeout(() => document.querySelector('.gr-jrow').click(), 300)"); await wait(800); } },
  { name: 'journal-cards', run: async (p) => { await act(p, "dev.spin(false); dev.hud(); dev.journal('cards')"); await wait(700); } },
  { name: 'map-local', run: async (p) => { await act(p, "dev.spin(false); dev.hud(); dev.map('local')"); await wait(700); } },
  { name: 'map-drum', run: async (p) => { await act(p, "dev.spin(false); dev.hud(); dev.map('drum')"); await wait(700); } },
  { name: 'map-round', run: async (p) => { await act(p, "dev.spin(false); dev.hud(); dev.map('round')"); await wait(800); } },
  { name: 'map-round-keys', run: async (p) => { await act(p, "dev.spin(false); dev.hud(); dev.map('round')"); await wait(500); await press(p, 'ArrowRight', 5); await press(p, 'ArrowUp', 3); await wait(300); } },
  { name: 'map-round-layer', run: async (p) => { await act(p, "dev.spin(false); dev.hud(); dev.map('round')"); await wait(500); await press(p, 'PageUp', 20, 80); await wait(500); } },
  { name: 'map-round-top', run: async (p) => { await act(p, "dev.spin(false); dev.hud(); dev.map('round')"); await wait(500); await press(p, 'PageUp', 60, 30); await wait(500); } },
  { name: 'map-pick', run: async (p) => { await act(p, "dev.spin(false); dev.hud(); dev.pick()"); await wait(500); await press(p, 'ArrowRight', 3); await press(p, 'ArrowUp', 2); await press(p, 'Enter'); await wait(400); } },
  { name: 'map-nocity', run: async (p) => { await act(p, "dev.spin(false); dev.hud(); dev.nocity(true); dev.map('drum')"); await wait(700); } },
  { name: 'journal-chervil', run: async (p) => { await act(p, "dev.spin(false); dev.hud(); dev.journal('chervil')"); await wait(600); } },
  { name: 'journal-chervil-block', run: async (p) => { await act(p, "dev.spin(false); dev.hud(); dev.journal('chervil')"); await wait(400); await press(p, 'ArrowDown', 2); await wait(300); } },
  { name: 'photo', run: async (p) => { await act(p, 'dev.spin(false); dev.hud(); dev.photo()'); await wait(500); } },
  { name: 'photo-shot', run: async (p) => { await act(p, 'dev.spin(false); dev.hud(); dev.photo()'); await wait(400); await press(p, 'Enter'); await wait(1500); } },
  { name: 'card-front', run: async (p) => { await act(p, 'dev.spin(false); dev.cardHome()'); await wait(700); await press(p, 'ArrowRight'); await wait(300); } },
  { name: 'card-back', run: async (p) => { await act(p, 'dev.spin(false); dev.cardHome()'); await wait(500); await press(p, 'Enter'); await wait(1000); await p.keyboard.type("Dear Pell, Marit has your mother in a crock by the stove. She says it smells like Spelt. The table here curves up at both ends and nobody eats alone. I'll be home by Knotnight.", { delay: 4 }); await wait(400); } },
  { name: 'card-plain', run: async (p) => { await act(p, 'dev.spin(false); dev.cardHome(true)'); await wait(700); } },
  { name: 'title', run: async (p) => { await act(p, 'dev.spin(false); ui.hud.show(false); dev.title()'); await wait(800); } },
  { name: 'title-bright', run: async (p) => { await act(p, "dev.backdrop('bright'); dev.spin(false); ui.hud.show(false); dev.title()"); await wait(800); } },
  { name: 'loading', run: async (p) => { await act(p, 'dev.loading()'); await wait(900); } },
  { name: 'credits', run: async (p) => { await act(p, 'dev.credits()'); await wait(5000); } },
  { name: 'touch', run: async (p) => { await act(p, 'dev.spin(false); dev.hud(); dev.touch(true)'); await wait(600); } },
  { name: 'touch-bright', run: async (p) => { await act(p, "dev.backdrop('bright'); dev.spin(false); dev.hud(); dev.touch(true)"); await wait(600); } },
];

const problems = [];
const network = [];   // the shared dev server sometimes refuses a request under load; reported apart
const NET = /ERR_CONNECTION_REFUSED|ERR_NO_BUFFER_SPACE|ERR_CONNECTION_RESET|ERR_EMPTY_RESPONSE/;
function watch(page, where) {
  page.on('console', (m) => {
    if (m.type() !== 'error' && m.type() !== 'warning') return;
    (NET.test(m.text()) ? network : problems).push(where() + ' console.' + m.type() + ': ' + m.text());
  });
  page.on('pageerror', (e) => problems.push(where() + ' pageerror: ' + (e && e.message)));
  page.on('requestfailed', (r) => {
    const why = (r.failure() && r.failure().errorText) || '';
    (NET.test(why) ? network : problems).push(where() + ' requestfailed: ' + r.url() + ' ' + why);
  });
}

async function fresh(page) {
  for (let tries = 0; tries < 3; tries++) {
    await page.goto(PAGE, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    if (await page.evaluate(() => !!(window.dev && window.ui))) break;
    console.log('  reloading, the bench did not start');
    await wait(500);
  }
  await wait(150);
}

async function shots(browser) {
  const page = await browser.newPage();
  let where = '';
  watch(page, () => where);
  for (const size of SIZES) {
    if (sizeFilter ? size.name !== sizeFilter : size.extra) continue;
    await page.setViewport(size);
    where = 'load@' + size.name;
    await fresh(page);
    for (const s of SCENES) {
      if (filter && !filter.split(',').some((f) => s.name.indexOf(f) >= 0)) continue;
      if (s.size && s.size !== size.name) continue;
      where = s.name + '@' + size.name;
      // one page load per size; the bench resets itself between scenes (kinder to the shared dev server)
      await act(page, 'document.activeElement && document.activeElement.blur && document.activeElement.blur(); dev.clean()');
      await wait(250);
      try { await s.run(page); } catch (e) { problems.push(where + ' run: ' + e.message); }
      const file = path.join(OUT, s.name + '-' + size.name + '.png');
      await page.screenshot({ path: file });
      console.log('shot', path.relative(process.cwd(), file));
    }
  }
  await page.close();
}

async function keyboardPass(browser) {
  const page = await browser.newPage();
  let where = 'keys';
  watch(page, () => where);
  await page.setViewport(SIZES[0]);
  const checks = [];
  const check = (name, ok, got) => { checks.push([name, !!ok]); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : '  got ' + JSON.stringify(got))); };
  const race = (expr, ms = 3000) => page.evaluate((e, t) => Promise.race([eval(e), new Promise((r) => setTimeout(() => r('__timeout'), t))]), expr, ms);

  await fresh(page);
  // pause, into settings, change a value with the keys, back out with Esc
  where = 'keys:pause';
  await act(page, 'window.__p = dev.pause()');
  await wait(300);
  check('pause opens modal', await ev(page, 'ui.modal'));
  await press(page, 'ArrowDown');
  await press(page, 'Enter');
  await wait(400);
  const q0 = await ev(page, "game.settings.get('quality')");
  await press(page, 'ArrowRight');
  const q1 = await ev(page, "game.settings.get('quality')");
  check('settings: right arrow changes detail', q0 === 'high' && q1 === 'ultra', [q0, q1]);
  await press(page, 'ArrowDown');
  const f0 = await ev(page, "game.settings.get('renderScale')");
  await press(page, 'ArrowLeft', 2);
  const f1 = await ev(page, "game.settings.get('renderScale')");
  check('settings: slider moves with arrows', f1 < f0, [f0, f1]);
  await press(page, 'Escape');
  await wait(350);
  check('Esc closes settings, pause stays', await ev(page, "ui.modal && ui.pause.isOpen && !document.querySelector('.gr-sheet')"));
  await press(page, 'Escape');
  const pv = await race('window.__p');
  check('Esc closes pause and resolves resume', pv && pv.action === 'resume', pv);
  await wait(350);
  check('modal false after pause', !(await ev(page, 'ui.modal')));

  // dialogue: advance with Enter, pick the second reply with the 2 key
  where = 'keys:talk';
  await act(page, 'window.__t = dev.marit()');
  await wait(200);
  await press(page, 'Enter', 7, 100);
  await wait(300);
  await press(page, '2');
  const tv = await race('window.__t');
  check('number key picks a reply', tv === 'aunts', tv);
  await act(page, "window.__t = ui.choose('Marit', 'Stay or go.', [{ label: 'Stay', value: 1 }, { label: 'Go', value: 2 }])");
  await wait(200);
  await press(page, 'Escape');
  const tn = await race('window.__t');
  check('Esc dismisses a choice with null', tn === null, tn);
  await act(page, "window.__t = ui.choose('Marit', null, [{ label: 'Off', value: 1, disabled: true }, { label: 'On', value: 2 }])");
  await wait(200);
  await press(page, 'Enter');
  const td = await race('window.__t');
  check('focus skips a disabled reply', td === 2, td);

  // menu: arrow down and Enter
  where = 'keys:menu';
  await act(page, 'window.__m = dev.menu(21.6)');
  await wait(400);
  await press(page, 'ArrowDown');
  await press(page, 'Enter');
  const mv = await race('window.__m');
  check('menu picks with arrows and Enter', mv === 'aunts', mv);
  await act(page, 'window.__m = dev.menu(3.84)');
  await wait(400);
  await press(page, '5');
  await wait(100);
  check('an item you cannot afford stays open', await ev(page, 'ui.modal'));
  await press(page, 'Escape');
  const mn = await race('window.__m');
  check('Esc leaves the menu with null', mn === null, mn);

  // hour picker
  await act(page, 'window.__h = dev.hour()');
  await wait(300);
  await press(page, 'ArrowRight', 2);
  await press(page, 'Enter');
  const hv = await race('window.__h');
  check('hour picker returns an hour', hv === 16, hv);

  // journal and map
  where = 'keys:journal';
  await act(page, "dev.journal('threads')");
  await wait(300);
  await press(page, '2');
  check('number key switches journal tab', await ev(page, "document.querySelector('.gr-tab.is-on .gr-tab-t').textContent === 'Found'"));
  await press(page, 'ArrowRight');
  check('arrow switches journal tab', await ev(page, "document.querySelector('.gr-tab.is-on .gr-tab-t').textContent === 'People'"));
  await press(page, 'Escape');
  await wait(350);
  check('Esc closes the journal', !(await ev(page, 'ui.modal')));
  await act(page, "dev.map('local')");
  await wait(300);
  await press(page, '=');
  await press(page, 'v');
  check('v switches the map view', await ev(page, "!!document.querySelector('.gr-map-body.is-round')"));
  await press(page, 'ArrowRight', 2);
  await press(page, 'PageUp');
  check('arrows and Page Up move round the drum', await ev(page, "/Decks 22 to 27/.test(document.querySelector('.gr-rh-t').textContent)"));
  await press(page, 'v');
  check('v goes on to the section', await ev(page, "!!document.querySelector('.gr-map-body.is-drum')"));
  await press(page, 'm');
  await wait(350);
  check('m closes the map', !(await ev(page, 'ui.modal')));

  // title
  where = 'keys:title';
  await act(page, 'window.__ti = dev.title()');
  await wait(400);
  await press(page, 'Escape');
  check('Esc does not close the title', await ev(page, 'ui.modal'));
  await press(page, 'Enter');
  const tiv = await race('window.__ti');
  check('title: Enter on the default (Continue)', tiv && tiv.action === 'continue', tiv);
  await act(page, 'window.__ti = dev.title()');
  await wait(400);
  await press(page, 'ArrowDown', 1);
  await press(page, 'Enter');
  await wait(300);
  await press(page, 'ArrowDown');
  await press(page, 'Enter');
  const tic = await race('window.__ti');
  check('title: a chapter by keys', tic && tic.action === 'chapter' && tic.chapter === 'day2', tic);

  // card home: turn over, type, Ctrl+Enter
  where = 'keys:card';
  await act(page, 'window.__c = dev.cardHome()');
  await wait(400);
  await press(page, 'ArrowRight');
  await press(page, 'Enter');
  await wait(600);
  await page.keyboard.type('Dear Pell, everyone feeds you here. Even E and 2 type.', { delay: 2 });
  await page.keyboard.down('Control');
  await page.keyboard.press('Enter');
  await page.keyboard.up('Control');
  const cv = await race('window.__c');
  check('card home returns front and text', cv && cv.front === 'c1' && /Even E and 2 type\.$/.test(cv.text), cv && { front: cv.front, text: cv.text });

  // photo mode is not modal; Enter takes, Esc leaves
  where = 'keys:photo';
  check('nothing modal before photo mode', !(await ev(page, 'ui.modal')));
  await act(page, 'dev.reset()');
  await wait(200);
  await act(page, 'dev.photo()');
  await wait(300);
  check('photo mode is not modal', !(await ev(page, 'ui.modal')) && (await ev(page, 'ui.photo.active')));
  const n0 = await ev(page, 'game.journal.cards().length');
  await press(page, 'Enter');
  await wait(200);
  check('Enter takes a photo', (await ev(page, 'game.journal.cards().length')) === n0 + 1);
  await press(page, 'Escape');
  check('Esc leaves photo mode', !(await ev(page, 'ui.photo.active')));

  // robustness: overlapping calls all resolve; nothing throws with no game at all
  where = 'keys:robust';
  const rv = await ev(page, `(async () => {
    const out = [];
    const a = ui.say('A', ['one', 'two']);
    const b = ui.choose('B', 'pick', [{ label: 'x', value: 1 }]);
    const c = ui.menu({ title: 'M', items: [{ id: 'i', name: 'I', price: 1 }] });
    const d = ui.pickHour({ from: 10, to: 12 });
    const e = ui.cardHome({ photos: [] });
    const f = ui.fade(true, 0.2); const g = ui.fade(false, 0.1);
    ui.journal.open(); ui.map.open(); ui.journal.close(); ui.map.close();
    const p = ui.pause.open(); ui.pause.close();
    const all = [a, b, c, d, e, f, g, p];
    const timer = new Promise((r) => setTimeout(() => r('__timeout'), 2500));
    // close what is still open, one Esc per screen: card home, hour, menu, choice
    setTimeout(() => { for (let i = 0; i < 4; i++) window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); }, 400);
    const res = await Promise.race([Promise.all(all), timer]);
    out.push(res === '__timeout' ? 'timeout' : 'resolved:' + (ui.modal ? 'modal' : 'clear'));
    const t = ui.titleScreen({}); const t2 = ui.titleScreen({ canContinue: true });
    const tv = await t;
    setTimeout(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })), 100);
    const tv2 = await Promise.race([t2, timer]);
    out.push('titles:' + tv.action + ',' + (tv2 && tv2.action));
    const bare = (await import('../src/ui/ui.js')).createUI(undefined);
    bare.hud.place('A', 'B'); bare.hud.wallet(1); bare.hud.compass(10, [{ bearing: 3, label: 'x' }]); bare.toast('hi'); bare.card({ title: 't' });
    bare.banner('B'); bare.subtitle('s', 't'); bare.bubble('q', 'hello', () => null); bare.ride({ big: 1 }); bare.reticle('use'); bare.prompt('Go');
    const v1 = bare.say('x', 'line'); setTimeout(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })), 50); setTimeout(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })), 100);
    out.push(await Promise.race([v1.then(() => 'said'), new Promise((r) => setTimeout(() => r('say-timeout'), 1500))]));
    bare.journal.open('found'); bare.journal.close(); bare.map.open(); bare.map.close(); bare.photo.enter(); bare.photo.take(); bare.photo.exit();
    bare.touch.enable(true); bare.touch.enable(false);
    const pv = bare.pause.open(); bare.pause.close(); out.push(JSON.stringify(await pv));
    out.push('modal=' + bare.modal);
    bare.destroy();
    return out;
  })()`);
  check('overlapping calls all resolve and nothing stays open', rv[0] === 'resolved:clear', rv);
  check('a replaced title resolves, the new one answers', rv[1] === 'titles:none,continue', rv);
  check('say works with no game', rv[2] === 'said', rv);
  check('pause works with no game', rv[3] === '{"action":"resume"}', rv);
  check('nothing left modal', rv[4] === 'modal=false', rv);

  await page.close();
  const failed = checks.filter((c) => !c[1]).length;
  console.log('keyboard pass: ' + (checks.length - failed) + ' of ' + checks.length + ' passed');
  return failed;
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb'] });
let failed = 0;
try {
  if (!keysOnly) await shots(browser);
  if (keysOnly || (!filter && !sizeFilter)) failed = await keyboardPass(browser);
} finally {
  await browser.close();
}
if (network.length) console.log('\n' + network.length + ' request(s) refused by the dev server under load (retried; not a UI fault)');
if (problems.length) { console.log('\nproblems:'); for (const p of problems) console.log('  ' + p); }
else console.log('\nno console or page errors');
process.exitCode = failed || problems.length ? 1 : 0;
