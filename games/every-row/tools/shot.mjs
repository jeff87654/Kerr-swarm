// Pictures and smoke tests in headless Chrome on the real GPU. The dev server must be running (python tools/serve.py).
//
//   node tools/shot.mjs --file sorrel_lake --t 0,8,16,24,32,40 --out out/me/lake
//   node tools/shot.mjs --w sorrel-lake --t 12 --out out/me/a --eval "app.engine.cur.t = 30"
//
// --file   a file in src/worlds (without .js): loads only that world, through dev.html. Use this while building one.
// --w      world id (worlds already listed in src/worlds/index.js)      --t     seconds into its flight, one or several (comma separated): one picture each
// --out    path prefix: writes <out>-<t>.png            --size  1280x720 (default)
// --tier   0..3 (default 2)         --port  5210 (default)         --page  index.html (default) or dist/index.html
// --eval   JavaScript to run in the page before each picture      --settle seconds to wait after moving (default 0.6)
// --cam    "x,y,z,lx,ly,lz[,fov]": put the camera at a flat point looking at another (ignores the flight)
// --ui     keep the interface and take three pictures: the opening, the first card, the list of drums
// --live   do not freeze: let the flight run and take a picture every --every seconds (default 3) --count times
// Prints for each picture: frame rate, draw calls, triangles; then any console errors.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const has = (k) => args.includes(k);
const world = get('--w', '');
const times = get('--t', '0').split(',').map(Number);
const out = get('--out', 'out/shot');
const [w, h] = get('--size', '1280x720').split('x').map(Number);
const port = get('--port', '5210');
const pageName = get('--page', '');
const tier = get('--tier', '2');
const settle = parseFloat(get('--settle', '0.6'));
const js = get('--eval', '');
const camArg = get('--cam', '');      // "x,y,z,lookx,looky,lookz[,fov]" in the world's flat coordinates: look from anywhere
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => fs.existsSync(p));
if (!chrome) { console.log('No Chrome or Edge found.'); process.exit(1); }

const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new',
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--force_high_performance_gpu', '--enable-unsafe-swiftshader', `--window-size=${w},${h}`, '--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  defaultViewport: { width: w, height: h },
});
let code = 0;
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => { const t = m.text(); if (/favicon|status of 404/.test(t)) return; if (m.type() === 'error' || m.type() === 'warning' || /^\[/.test(t)) errors.push(`[${m.type()}] ${t.slice(0, 1500)}`); });
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  page.on('requestfailed', (r) => { const f = r.failure() ? r.failure().errorText : ''; if (!/ERR_ABORTED/.test(f)) errors.push('[requestfailed] ' + r.url() + ' ' + f); });
  const live = has('--live');
  const withUi = has('--ui');      // keep the interface: pictures of the opening screen, then of the first card after Begin
  const q = `${withUi ? '' : 'ui=0&'}debug&tier=${tier}${world ? '&only=' + world + '&w=' + world : ''}${live || withUi ? '' : '&freeze&steady'}${get('--q', '') ? '&' + get('--q', '') : ''}`;
  const file = get('--file', '');      // one world file through dev.html, without registering it in worlds/index.js
  const url = file ? `http://127.0.0.1:${port}/dev.html?file=${file}&${q}` : `http://127.0.0.1:${port}/${pageName}?${q}`;
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const ok = await page.waitForFunction(() => window.app && window.app.ready, { timeout: +get('--timeout', '60000') }).then(() => true).catch(() => false);
  console.log(`loaded in ${((Date.now() - t0) / 1000).toFixed(1)} s${ok ? '' : ' (DID NOT START)'}`);
  if (ok) {
    const gpu = await page.evaluate(() => { try { const gl = window.app.engine.renderer.getContext(); const e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; } catch (e) { return 'unknown'; } });
    console.log('gpu: ' + gpu);
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    const snap = async (name) => {
      const fps = await page.evaluate(() => new Promise((res) => { let n = 0; const t = performance.now(); const f = () => { n++; if (performance.now() - t < 700) requestAnimationFrame(f); else res(Math.round(n / 0.7)); }; requestAnimationFrame(f); }));
      await page.screenshot({ path: name });
      const info = await page.evaluate(() => { const e = window.app.engine, s = e.stats, c = e.cur; return `world=${c ? c.def.id : '-'} t=${c ? c.t.toFixed(1) : '-'}/${c ? c.duration.toFixed(0) : '-'} calls=${s.calls} tris=${s.tris} build=${s.build.toFixed(0)}ms next=${e.next ? e.next.def.id : e.job ? 'building ' + e.job.def.id : '-'} scale=${e.scale.toFixed(2)} tier=${e.tierIndex}`; });
      console.log(`${name}: ${fps} fps · ${info}`);
    };
    if (withUi) {
      await new Promise((r) => setTimeout(r, 1500));
      await snap(`${out}-open.png`);
      await page.click('.er-begin');
      await new Promise((r) => setTimeout(r, 4200));
      await page.mouse.move(600, 400);
      await snap(`${out}-card.png`);
      await page.keyboard.press('g');
      await new Promise((r) => setTimeout(r, 900));
      await snap(`${out}-drums.png`);
    } else if (live) {
      const every = parseFloat(get('--every', '3')), count = parseInt(get('--count', '6'), 10);
      for (let i = 0; i < count; i++) { await new Promise((r) => setTimeout(r, every * 1000)); if (js) await page.evaluate(js).catch((e) => errors.push('[eval] ' + e.message)); await snap(`${out}-${String(i).padStart(2, '0')}.png`); }
    } else {
      for (const t of times) {
        await page.evaluate((tt) => { const e = window.app.engine; if (e.cur) e.cur.t = tt; }, t);
        if (js) await page.evaluate(js).catch((e) => errors.push('[eval] ' + e.message));
        if (camArg) await page.evaluate((c) => { const v = c.split(',').map(Number); window.app.engine.debugCam = { p: v.slice(0, 3), look: v.slice(3, 6), fov: v[6] || undefined }; }, camArg);
        await new Promise((r) => setTimeout(r, settle * 1000));
        await snap(`${out}-${String(t).padStart(2, '0')}.png`);
      }
    }
  } else { code = 1; try { await page.screenshot({ path: out + '-failed.png' }); } catch (e) { /* ignore */ } }
  const uniq = [...new Set(errors)];
  if (uniq.length) console.log(uniq.slice(0, 40).join('\n'));
} finally { await browser.close(); }
process.exit(code);
