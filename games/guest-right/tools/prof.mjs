// A CPU profile of the running game in headless Chrome: which functions the time goes to. The dev server must be running.
//
//   node tools/prof.mjs --q "at=ladle-east-end" --run "game.player.place(game.player.frame, 209.9, 0, 3, 0)" --secs 6
//
// --q     query string for the page (auto is always added)      --run   javascript to run when profiling starts
// --secs  how long to profile (default 5)                         --top   how many functions to list (default 30)
// --wait  seconds to settle after loading before profiling (default 3)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const q = get('--q', ''), run = get('--run', ''), secs = parseFloat(get('--secs', '5')), top = parseInt(get('--top', '30'), 10), wait = parseFloat(get('--wait', '3')), port = get('--port', '5190');
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => fs.existsSync(p));
if (!chrome) { console.log('No Chrome or Edge found.'); process.exit(1); }
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--force_high_performance_gpu', '--window-size=1280,720', '--autoplay-policy=no-user-gesture-required'], defaultViewport: { width: 1280, height: 720 } });
try {
  const page = await browser.newPage();
  page.on('console', (m) => { const t = m.text(); if (/^\[city\]|^\[people\]/.test(t) || m.type() === 'error') console.log('  ' + t); });
  await page.goto(`http://127.0.0.1:${port}/?auto&${q}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction('window.game && window.game.ready', { timeout: 120000 });
  await new Promise((r) => setTimeout(r, wait * 1000));
  const cdp = await page.createCDPSession();
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
  await cdp.send('Profiler.start');
  if (run) await page.evaluate(run);
  await new Promise((r) => setTimeout(r, secs * 1000));
  const { profile } = await cdp.send('Profiler.stop');
  const dt = profile.timeDeltas, self = new Map(), byId = new Map();
  for (const n of profile.nodes) byId.set(n.id, n);
  let total = 0;
  profile.samples.forEach((id, i) => { const d = dt[i] || 0; total += d; self.set(id, (self.get(id) || 0) + d); });
  // self time by function, and inclusive time by function (a function counted once per sample however deep the recursion)
  const parent = new Map(); for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
  const name = (n) => (n.callFrame.functionName || '(anonymous)') + ' ' + n.callFrame.url.replace(/^.*\/src\//, '').replace(/\?.*$/, '') + ':' + (n.callFrame.lineNumber + 1);
  const selfBy = new Map(), inclBy = new Map();
  for (const [id, t] of self) {
    const n = byId.get(id); selfBy.set(name(n), (selfBy.get(name(n)) || 0) + t);
    const seen = new Set(); let k = id;
    while (k !== undefined) { const nm = name(byId.get(k)); if (!seen.has(nm)) { seen.add(nm); inclBy.set(nm, (inclBy.get(nm) || 0) + t); } k = parent.get(k); }
  }
  const show = (m, title) => { console.log('\n' + title); [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, top).forEach(([k, v]) => console.log((v / 1000).toFixed(0).padStart(7) + ' ms  ' + (100 * v / total).toFixed(1).padStart(5) + '%  ' + k)); };
  console.log('profiled ' + (total / 1e6).toFixed(1) + ' s');
  show(selfBy, 'self time'); show(inclBy, 'inclusive time');
} finally { await browser.close(); }
