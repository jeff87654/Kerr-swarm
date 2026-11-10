// Screenshots and smoke tests in headless Chrome on the real GPU. The dev server must be running (python tools/serve.py).
//
//   node tools/shot.mjs --q "at=start&t=13" --shot out/me/a.png
//   node tools/shot.mjs --q "at=hall" --shot "out/me/a.png|2|game.player.yaw=1.2" --shot "out/me/b.png|1|game.clock.set(3,6.2)"
//
// --q       query string for the page (auto is always added: it skips the title screen)
// --shot    "path|secondsToWaitFirst|javascriptToRunFirst" (the last two optional); repeat for more pictures in one session
// --size    1280x720 (default)      --wait  seconds to settle after loading (default 3)      --page  index.html (default) or a tools/ page
// --title   do not skip the title screen
// --port    5190 (default)          --timeout ms to wait for the game (default 90000)        --keep  leave the browser open for N seconds at the end
// Prints for each picture: frames per second, draw calls, triangles, active lights, the player's position; then console errors.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const shots = []; args.forEach((a, i) => { if (a === '--shot') shots.push(args[i + 1]); });
const q = get('--q', '');
const [w, h] = get('--size', '1280x720').split('x').map(Number);
const wait = parseFloat(get('--wait', '3'));
const port = get('--port', '5190');
const pageName = get('--page', '');
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => fs.existsSync(p));
if (!chrome) { console.log('No Chrome or Edge found.'); process.exit(1); }

const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new',
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--force_high_performance_gpu', '--enable-unsafe-swiftshader', `--window-size=${w},${h}`, '--autoplay-policy=no-user-gesture-required', '--disable-frame-rate-limit', '--disable-gpu-vsync'],
  defaultViewport: { width: w, height: h },
});
let code = 0;
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => { const t = m.text(); if (/favicon|status of 404/.test(t)) return; if (m.type() === 'error' || m.type() === 'warning' || /^\[/.test(t)) errors.push(`[${m.type()}] ${t}`); });
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  page.on('requestfailed', (r) => { const f = r.failure() ? r.failure().errorText : ''; if (!/ERR_ABORTED/.test(f)) errors.push('[requestfailed] ' + r.url() + ' ' + f); });
  const t0 = Date.now();
  const url = `http://127.0.0.1:${port}/${pageName}?${args.includes('--title') ? '' : 'auto&'}${q}`;
  let ok = false;
  for (let attempt = 0; attempt < 3 && !ok; attempt++) {      // the dev server is shared and sometimes busy: try again
    if (attempt) { errors.length = 0; await new Promise((r) => setTimeout(r, 1500)); }
    try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }); } catch (e) { errors.push('[goto] ' + e.message); continue; }
    ok = await page.waitForFunction(() => window.game && window.game.ready, { timeout: +get('--timeout', '45000') }).then(() => true).catch(() => false);
  }
  console.log(`loaded in ${((Date.now() - t0) / 1000).toFixed(1)} s${ok ? '' : ' (GAME DID NOT START)'}`);
  if (ok) {
    const gpu = await page.evaluate(() => { try { const gl = window.game.renderer.getContext(); const e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; } catch (e) { return 'unknown'; } });
    console.log('gpu: ' + gpu);
    await new Promise((r) => setTimeout(r, wait * 1000));
    for (const s of shots.length ? shots : ['out/shot.png']) {
      const [out, secs, js] = s.split('|');
      if (js) { try { await page.evaluate(js); } catch (e) { errors.push('[eval] ' + e.message); } }
      if (secs) await new Promise((r) => setTimeout(r, parseFloat(secs) * 1000));
      const fps = await page.evaluate(() => new Promise((res) => { let n = 0; const t = performance.now(); const f = () => { n++; if (performance.now() - t < 1000) requestAnimationFrame(f); else res(n); }; requestAnimationFrame(f); }));
      fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
      await page.screenshot({ path: out });
      const info = await page.evaluate(() => { const g = window.game, p = g.player.pos, s = g.pipeline.stats; const pf = g.perf || {}; return `cpu=${(pf.update||0).toFixed(1)}+${(pf.prerender||0).toFixed(1)}+${(pf.render||0).toFixed(1)}ms calls=${s.calls} tris=${s.tris} lights=${s.lights} meshes=${g.world.stats.shown}/${g.world.stats.meshes} pos=${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)} yaw=${g.player.yaw.toFixed(2)} ${g.clock.label()} day ${g.clock.day}`; });
      console.log(`${out}: ${fps} fps · ${info}`);
    }
  } else { code = 1; try { await page.screenshot({ path: 'out/failed.png' }); } catch (e) { /* ignore */ } }
  const uniq = [...new Set(errors)];
  if (uniq.length) console.log(uniq.slice(0, 60).join('\n'));
  const keep = parseFloat(get('--keep', '0')); if (keep) await new Promise((r) => setTimeout(r, keep * 1000));
} finally { await browser.close(); }
process.exit(code);
