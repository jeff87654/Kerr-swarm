// Fly the whole journey the way a visitor would, skipping ahead in each world, and report every crossing.
// The dev server must be running (python tools/serve.py).
//
//   node tools/flow.mjs                         # every world once, from the page's first
//   node tools/flow.mjs --page dist/index.html  # the built page
//   node tools/flow.mjs --count 6 --shots out/flow     # six crossings, a picture just after each
//
// --count  crossings to make (default: one for every world)      --tier 0..3 (default 2)      --port 5210
// --sound  turn the sound on first (checks that it starts without errors)
// Prints for each world: its id, how long its build took and its longest step, frame rate just after arriving, then
// any console errors. Exits 1 if a crossing never came or anything logged an error.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const has = (k) => args.includes(k);
const port = get('--port', '5210'), pageName = get('--page', ''), tier = get('--tier', '2'), shots = get('--shots', '');
const [w, h] = get('--size', '1280x720').split('x').map(Number);
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
  const errors = [];
  page.on('console', (m) => { const t = m.text(); if (/favicon|status of 404/.test(t)) return; if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${t.slice(0, 1200)}`); });
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  await page.goto(`http://127.0.0.1:${port}/${pageName}?debug&tier=${tier}${get('--q', '') ? '&' + get('--q', '') : ''}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const ok = await page.waitForFunction(() => window.app && window.app.ready, { timeout: 90000 }).then(() => true).catch(() => false);
  if (!ok) { console.log('THE PAGE DID NOT START'); code = 1; }
  else {
    const total = await page.evaluate(() => window.app.WORLDS.filter((d) => !d.hidden).length);
    const count = parseInt(get('--count', String(total)), 10);
    await page.click('.er-begin');
    if (has('--sound')) { await page.keyboard.press('s'); await sleep(500); }
    if (shots) fs.mkdirSync(path.dirname(path.resolve(shots + '-x')), { recursive: true });
    const info = () => page.evaluate(() => { const e = window.app.engine, s = e.stats; return { id: e.cur ? e.cur.def.id : '-', n: window.app.crossings, build: s.build, step: s.step, calls: s.calls, tris: s.tris, waiting: s.waiting, t: e.cur ? e.cur.t : 0 }; });
    let seen = await info();
    console.log(`start: ${seen.id}`);
    for (let i = 0; i < count; i++) {
      await sleep(2500);
      await page.keyboard.press('ArrowRight');
      const t0 = Date.now();
      let now = seen, crossed = false;
      while (Date.now() - t0 < 120000) { await sleep(250); now = await info(); if (now.n > seen.n) { crossed = true; break; } }
      if (!crossed) { console.log(`NO CROSSING out of ${seen.id} after 120 s (waiting for the next world: ${now.waiting})`); code = 1; break; }
      await sleep(700);
      const fps = await page.evaluate(() => new Promise((res) => { let n = 0; const t = performance.now(); const f = () => { n++; if (performance.now() - t < 700) requestAnimationFrame(f); else res(Math.round(n / 0.7)); }; requestAnimationFrame(f); }));
      if (shots) await page.screenshot({ path: `${shots}-${String(i + 1).padStart(2, '0')}-${now.id}.png` });
      const after = await info();
      // what the page still holds after the crossing: these should level off, not climb, over a whole journey
      const mem = await page.evaluate(() => { const r = window.app.engine.renderer, m = r && r.info ? r.info.memory : null; return { geo: m ? m.geometries : -1, tex: m ? m.textures : -1, heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1 }; });
      console.log(`${String(i + 1).padStart(2)}. ${seen.id} -> ${now.id}   ${((Date.now() - t0) / 1000).toFixed(1)} s to cross · ${fps} fps · calls ${after.calls} · tris ${after.tris} · build ${after.build.toFixed(0)} ms, longest step ${after.step.toFixed(0)} ms · holds ${mem.geo} geometries, ${mem.tex} textures, ${mem.heap} MB`);
      seen = now;
    }
  }
  const uniq = [...new Set(errors)];
  if (uniq.length) { console.log(uniq.slice(0, 40).join('\n')); code = 1; }
} finally { await browser.close(); }
process.exit(code);
