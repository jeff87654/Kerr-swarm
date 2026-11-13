// Let the flight run by itself and list every frame that took too long, with what the engine was doing at the time.
// The dev server must be running (python tools/serve.py). Run it on a quiet machine: it measures the machine too.
//
//   node tools/hitch.mjs --q "w=the-glide&t=40" --secs 45
//   node tools/hitch.mjs --page dist/index.html --secs 120
//
// --q     page query (w=<id> to start at a world, t=<seconds> to start partway)     --secs how long to watch (default 60)
// --over  what counts as too long, in ms (default 34: two frames at 60 a second)   --tier 0..3 (default 2)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const port = get('--port', '5210'), pageName = get('--page', ''), tier = get('--tier', '2'), secs = parseFloat(get('--secs', '60')), over = parseFloat(get('--over', '34'));
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => fs.existsSync(p));
if (!chrome) { console.log('No Chrome or Edge found.'); process.exit(1); }
const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new',
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--force_high_performance_gpu', '--enable-unsafe-swiftshader', '--window-size=1280,720', '--mute-audio'],
  defaultViewport: { width: 1280, height: 720 },
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 400)); });
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  await page.goto(`http://127.0.0.1:${port}/${pageName}?ui=0&tier=${tier}${get('--q', '') ? '&' + get('--q', '') : ''}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.app && window.app.ready, { timeout: 120000 });
  await page.evaluate((limit) => {
    window.__h = []; window.__n = 0; window.__sum = 0;
    let last = performance.now();
    const f = () => {
      const now = performance.now(), d = now - last; last = now; window.__n++; window.__sum += d;
      if (d > limit) { const e = window.app.engine, j = e.job; window.__h.push([Math.round(d), e.cur ? e.cur.def.id : '-', e.cur ? e.cur.t.toFixed(1) : '-', j ? `building ${j.def.id} (${j.stage}${j.stage === 'build' && j.at ? ', after "' + j.at + '"' : ''})` : e.next ? `next ready: ${e.next.def.id}` : '-']); }
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }, over);
  await new Promise((r) => setTimeout(r, secs * 1000));
  const out = await page.evaluate(() => ({ h: window.__h, n: window.__n, sum: window.__sum }));
  console.log(`${out.n} frames in ${(out.sum / 1000).toFixed(1)} s (${(out.n / (out.sum / 1000)).toFixed(0)} a second); ${out.h.length} took over ${over} ms, ${out.h.reduce((a, b) => a + b[0], 0)} ms in all`);
  for (const [d, id, t, what] of out.h) console.log(`  ${String(d).padStart(4)} ms   in ${id} at ${t} s   ${what}`);
  if (errors.length) console.log([...new Set(errors)].join('\n'));
} finally { await browser.close(); }
