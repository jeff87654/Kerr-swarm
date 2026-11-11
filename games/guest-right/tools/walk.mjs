// Walk the city by holding the keys down, and report what happens: where the player gets to, which blocks load and
// unload, the worst frames, and whether they ever fall out of the world. The dev server must be running.
//
//   node tools/walk.mjs --q "at=ladle-east-end" --yaw 1.5708 --secs 70           # spinward out of Candlewick, running
//   node tools/walk.mjs --q "cell=20:5:9" --yaw 3.1416 --secs 40 --walk          # along a street on the middle decks
//
// --yaw   which way to face (player yaw: 0 looks to the front, 1.5708 spinward, -1.5708 anti, 3.1416 to the back)
// --secs  how long to hold W      --walk  do not hold Shift      --shot  a folder for a picture every 10 s
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const q = get('--q', 'at=ladle-east-end'), yaw = parseFloat(get('--yaw', '1.5708')), secs = parseFloat(get('--secs', '60')), port = get('--port', '5190'), shotDir = get('--shot', '');
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => fs.existsSync(p));
if (!chrome) { console.log('No Chrome or Edge found.'); process.exit(1); }
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--force_high_performance_gpu', '--window-size=1280,720', '--autoplay-policy=no-user-gesture-required'], defaultViewport: { width: 1280, height: 720 } });
let code = 0;
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => { const t = m.text(); if (/favicon|status of 404/.test(t)) return; if (m.type() === 'error' || /^\[city\]/.test(t)) { if (m.type() === 'error') errors.push(t); console.log('  ' + t.slice(0, 260)); } });
  page.on('pageerror', (e) => { errors.push(e.message); console.log('  [pageerror] ' + e.message); });
  await page.goto(`http://127.0.0.1:${port}/?auto&citylog&${q}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction('window.game && window.game.ready', { timeout: 120000 });
  await sleep(/cell=/.test(q) ? 9 : 4);
  await page.evaluate((y) => {
    const g = window.game; g.player.yaw = y; g.player.pitch = 0;
    window.__w = { worst: 0, slow: 0, n: 0, minY: 1e9, falls: 0 };
    let last = performance.now();
    g.events.on('update', () => { const w = window.__w, now = performance.now(), dt = now - last; last = now; w.n++; if (dt > w.worst) w.worst = dt; if (dt > 40) w.slow++; if (g.player.pos.y < w.minY) w.minY = g.player.pos.y; if (g.player.pos.y < -3) w.falls++; });
    g.events.on('city:load', (i) => console.log('[city] + ' + i.name + ' at ' + (performance.now() / 1000).toFixed(1) + ' s'));
    g.events.on('city:unload', (i) => console.log('[city] - ' + i.name + ' at ' + (performance.now() / 1000).toFixed(1) + ' s'));
  }, yaw);
  if (shotDir) fs.mkdirSync(shotDir, { recursive: true });
  await page.keyboard.down('KeyW'); if (!args.includes('--walk')) await page.keyboard.down('ShiftLeft');
  let last = null, stuck = 0;
  for (let t = 0; t < secs; t += 2) {
    await sleep(2);
    const s = await page.evaluate(() => { const g = window.game, p = g.player, c = g.city && g.city.cellOfPlayer(), w = window.__w; const o = { x: +p.pos.x.toFixed(1), y: +p.pos.y.toFixed(2), z: +p.pos.z.toFixed(1), frame: p.frame.id, zone: g.zone ? g.zone.name : '', block: c ? g.city.info(c).name : '', loaded: g.city ? g.city.loaded().length : 0, fps: Math.round(g.fps), worst: Math.round(w.worst), slow: w.slow, people: g.people ? g.people.count() : 0 }; w.worst = 0; w.slow = 0; return o; });
    const moved = last ? Math.hypot(s.x - last.x, s.z - last.z) : 99; if (moved < 0.5) stuck++; else stuck = 0; last = s;
    console.log(`t=${String(t + 2).padStart(3)}  ${String(s.x).padStart(8)}, ${String(s.y).padStart(5)}, ${String(s.z).padStart(8)}  ${s.frame}  ${s.block.padEnd(14)} ${s.zone.padEnd(22)} blocks ${s.loaded}  ${s.fps} fps  worst ${s.worst} ms  slow ${s.slow}  people ${s.people}${moved < 0.5 ? '  (not moving)' : ''}`);
    if (shotDir && (t + 2) % 10 === 0) await page.screenshot({ path: path.join(shotDir, 'walk-' + String(t + 2).padStart(3, '0') + '.png') });
    if (stuck >= 3) { console.log('stopped: the player is not moving'); break; }
  }
  await page.keyboard.up('KeyW'); await page.keyboard.up('ShiftLeft');
  const w = await page.evaluate(() => window.__w);
  console.log(`lowest y ${w.minY.toFixed(2)}, frames below the floor ${w.falls}, console errors ${errors.length}`);
  if (w.falls || errors.length) code = 1;
} finally { await browser.close(); }
process.exit(code);
