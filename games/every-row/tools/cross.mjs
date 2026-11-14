// One crossing, looked at closely: the last seconds of one world with the next showing through its opening, the
// crossing itself, and the first seconds of the next. The dev server must be running (python tools/serve.py).
//
//   node tools/cross.mjs --file borage_fountains,borage_fair --out out/x/bf      # two world files, through dev.html
//   node tools/cross.mjs --w sloe-hush --out out/x/sh                            # a listed world and the one after it
//
// --lead   seconds before the crossing to begin at (default 9)      --after  seconds to go on after it (default 4)
// --every  seconds between pictures (default 1.5)                   --size 960x540 (default)     --tier 0..3 (default 2)
// Writes <out>-<nn>-<world>-<seconds from the crossing>.png and prints, for each picture, the world on screen, draw
// calls and triangles; then how long the second world took to build, its longest step, and any console errors.
// Exits 1 if the crossing never came or anything logged an error.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const port = get('--port', '5210'), tier = get('--tier', '2'), out = get('--out', 'out/cross');
const [w, h] = get('--size', '960x540').split('x').map(Number);
const lead = parseFloat(get('--lead', '9')), after = parseFloat(get('--after', '4')), every = parseFloat(get('--every', '1.5'));
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => fs.existsSync(p));
if (!chrome) { console.log('No Chrome or Edge found.'); process.exit(1); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new',
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--force_high_performance_gpu', '--enable-unsafe-swiftshader', `--window-size=${w},${h}`, '--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  defaultViewport: { width: w, height: h },
});
let code = 0;
try {
  const page = await browser.newPage();
  const errors = [], logs = [];
  page.on('console', (m) => { const t = m.text(); if (/favicon|status of 404/.test(t)) return; if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${t.slice(0, 1200)}`); else if (/^\[every-row\]/.test(t)) logs.push(t.slice(0, 400)); });
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  const file = get('--file', ''), world = get('--w', '');
  const q = `ui=0&debug&tier=${tier}&steady`;
  const url = file ? `http://127.0.0.1:${port}/dev.html?file=${file}&${q}` : `http://127.0.0.1:${port}/?${q}&w=${world}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const ok = await page.waitForFunction(() => window.app && window.app.ready, { timeout: 90000 }).then(() => true).catch(() => false);
  if (!ok) { console.log('THE PAGE DID NOT START'); code = 1; }
  else {
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    const info = () => page.evaluate(() => { const e = window.app.engine, s = e.stats, c = e.cur; return { id: c ? c.def.id : '-', t: c ? c.t : 0, tCross: c ? c.tCross : 0, n: window.app.crossings, calls: s.calls, tris: s.tris, next: e.next ? e.next.def.id : '', build: s.build, step: s.step }; });
    // hold the first world still until the second is built, then start `lead` seconds before the opening
    await page.evaluate(() => { window.app.engine.freeze = true; });
    const built = await page.waitForFunction(() => window.app.engine.next && window.app.engine.next.ready, { timeout: 120000 }).then(() => true).catch(() => false);
    if (!built) { console.log('THE NEXT WORLD WAS NEVER BUILT'); code = 1; }
    const first = await info();
    console.log(`${first.id} -> ${first.next || '?'}   (the next world built in ${first.build.toFixed(0)} ms, longest step ${(first.step || 0).toFixed(0)} ms)`);
    await page.evaluate((s) => { const e = window.app.engine; e.cur.t = Math.max(0, e.cur.tCross - s); e.freeze = false; }, lead);
    let n = 0, crossedAt = 0;
    const t0 = Date.now();
    while (Date.now() - t0 < (lead + after + 30) * 1000) {
      const i = await info();
      const rel = i.n > first.n ? i.t : i.t - i.tCross;
      if (i.n > first.n && !crossedAt) crossedAt = Date.now();
      const name = `${out}-${String(n).padStart(2, '0')}-${i.id}-${rel >= 0 ? 'p' : 'm'}${Math.abs(rel).toFixed(1)}.png`;
      await page.screenshot({ path: name });
      console.log(`${name}: world=${i.id} t=${i.t.toFixed(1)} calls=${i.calls} tris=${i.tris}`);
      n++;
      if (crossedAt && i.t >= after) break;
      await sleep(every * 1000);
    }
    if (!crossedAt) { console.log('NO CROSSING'); code = 1; }
  }
  const uniq = [...new Set(errors)];
  if (logs.length) console.log(logs.filter((l) => /built in|steps over/.test(l)).slice(0, 6).join('\n'));
  if (uniq.length) { console.log(uniq.slice(0, 30).join('\n')); code = 1; }
} finally { await browser.close(); }
process.exit(code);
