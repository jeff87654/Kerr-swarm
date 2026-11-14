// How fast the camera turns. Samples a world's flight and prints where the view swings quickly, which stills cannot
// show. The dev server must be running (python tools/serve.py).
//
//   node tools/gaze.mjs --file lovage_rise     # a file in src/worlds (without .js), through dev.html
//   node tools/gaze.mjs --w sorrel-lake        # a world listed in src/worlds/index.js
//   node tools/gaze.mjs --all                  # every listed world, one line each
//
// --step   seconds between samples (default 0.05)      --over  degrees a second that counts as a swing (default 45)
// --port   5210 (default)                              --page  index.html (default) or dist/index.html
// Prints for each world: its length, the fastest turn of the view (degrees a second) and when, how many seconds of the
// flight turn faster than --over, and each such swing with its start, end, peak and the angle turned through.
// For scale: the worlds of the first round turn at 5 to 15 degrees a second most of the time and peak at 20 to 45.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const has = (k) => args.includes(k);
const port = get('--port', '5210'), pageName = get('--page', '');
const step = parseFloat(get('--step', '0.05')), over = parseFloat(get('--over', '45'));
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => fs.existsSync(p));
if (!chrome) { console.log('No Chrome or Edge found.'); process.exit(1); }

const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new',
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--window-size=640,360', '--mute-audio'],
  defaultViewport: { width: 640, height: 360 },
});

// the flight as samples of [t, x, y, z, qx, qy, qz, qw], taken in the page from the world's own path
async function sample(url) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const ok = await page.waitForFunction(() => window.app && window.app.ready, { timeout: 90000 }).then(() => true).catch(() => false);
    if (!ok) return { error: 'did not start' + (errors.length ? ': ' + errors[0] : '') };
    return await page.evaluate((dt) => {
      const e = window.app.engine, c = e.cur, path = c.path;
      const P = { pos: e.pose.pos.clone(), quat: e.pose.quat.clone(), fov: 58 };
      const s = [];
      for (let t = 0; t <= path.tCross + 1e-6; t += dt) { path.sample(t, P); s.push([t, P.pos.x, P.pos.y, P.pos.z, P.quat.x, P.quat.y, P.quat.z, P.quat.w]); }
      return { id: c.def.id, duration: path.duration, tCross: path.tCross, s, ids: window.app.WORLDS.map((d) => d.id) };
    }, step);
  } finally { await page.close(); }
}

function report(r, brief) {
  if (r.error) { console.log(`  ${r.error}`); return; }
  const s = r.s, rate = [];
  for (let i = 1; i < s.length; i++) {
    const a = s[i - 1], b = s[i];
    const dot = Math.min(1, Math.abs(a[4] * b[4] + a[5] * b[5] + a[6] * b[6] + a[7] * b[7]));
    rate.push(2 * Math.acos(dot) * 180 / Math.PI / (b[0] - a[0]));
  }
  // smooth over a fifth of a second: a single sample's spike is not a swing anyone sees
  const k = Math.max(1, Math.round(0.2 / step)), sm = rate.map((_, i) => { let n = 0, sum = 0; for (let j = Math.max(0, i - k); j <= Math.min(rate.length - 1, i + k); j++) { sum += rate[j]; n++; } return sum / n; });
  let peak = 0, at = 0, fast = 0, mean = 0;
  sm.forEach((v, i) => { mean += v; if (v > peak) { peak = v; at = s[i][0]; } if (v > over) fast += step; });
  mean /= sm.length;
  const swings = [];
  for (let i = 0; i < sm.length; i++) {
    if (sm[i] <= over) continue;
    let j = i, top = 0, angle = 0;
    while (j < sm.length && sm[j] > over * 0.6) { top = Math.max(top, sm[j]); angle += rate[j] * step; j++; }
    let i0 = i; while (i0 > 0 && sm[i0 - 1] > over * 0.6) { i0--; angle += rate[i0] * step; }
    swings.push(`${s[i0][0].toFixed(1)} to ${s[Math.min(j, s.length - 1)][0].toFixed(1)} s: peak ${top.toFixed(0)}, ${angle.toFixed(0)} degrees`);
    i = j;
  }
  console.log(`${r.id.padEnd(22)} ${r.tCross.toFixed(0).padStart(3)} s   mean ${mean.toFixed(0).padStart(3)}   peak ${peak.toFixed(0).padStart(3)} at ${at.toFixed(1).padStart(5)} s   ${fast.toFixed(1).padStart(4)} s over ${over}${swings.length ? '   swings: ' + swings.length : ''}`);
  if (!brief || swings.length) for (const w of swings) console.log(`      ${w}`);
}

let code = 0;
try {
  const base = `http://127.0.0.1:${port}/`;
  const q = 'ui=0&debug&tier=0&freeze&steady';
  if (has('--all')) {
    const first = await sample(`${base}${pageName}?${q}`);
    if (first.error) { console.log(first.error); code = 1; }
    else for (const id of first.ids) report(await sample(`${base}${pageName}?${q}&only=${id}&w=${id}`), true);
  } else if (get('--file', '')) report(await sample(`${base}dev.html?file=${get('--file')}&${q}`));
  else if (get('--w', '')) report(await sample(`${base}${pageName}?${q}&only=${get('--w')}&w=${get('--w')}`));
  else console.log('Give --file, --w or --all.');
} finally { await browser.close(); }
process.exit(code);
