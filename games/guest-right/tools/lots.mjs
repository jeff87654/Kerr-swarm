// One of everything a generated block can hold: for every kind of lot the plans produce (each shop trade, each block
// room, each special place, a hall, a lobby), build a block that has one, stand outside it and then inside it, and say
// what was found. The dev server must be running (python tools/serve.py).
//
//   node tools/lots.mjs                          every kind
//   node tools/lots.mjs --keys special.school,shop.baker,hall
//   node tools/lots.mjs --match special --q "t=20" --out out/lots --settle 2 --page dist/index.html
//
// Pictures: out/lots/<key>.png (from the street) and out/lots/<key>.in.png (from the middle of the lot).
// Console errors are printed per lot and make the exit code 1.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const q = get('--q', 't=13');
const [w, h] = get('--size', '1280x720').split('x').map(Number);
const port = get('--port', '5190');
const pageName = get('--page', '');
const outDir = get('--out', 'out/lots');
const settle = parseFloat(get('--settle', '2'));
const only = get('--keys', '').split(',').map((s) => s.trim()).filter(Boolean);
const match = get('--match', '');
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => fs.existsSync(p));
if (!chrome) { console.log('No Chrome or Edge found.'); process.exit(1); }
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));

const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new', protocolTimeout: 600000,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--force_high_performance_gpu', '--enable-unsafe-swiftshader', `--window-size=${w},${h}`, '--autoplay-policy=no-user-gesture-required', '--disable-frame-rate-limit', '--disable-gpu-vsync'],
  defaultViewport: { width: w, height: h },
});
let code = 0;
try {
  const page = await browser.newPage();
  let errors = [], logs = [];
  page.on('console', (m) => { const t = m.text(); if (/favicon|status of 404/.test(t)) return; if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${t}`); else if (/^\[/.test(t)) logs.push(t); });
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  const url = `http://127.0.0.1:${port}/${pageName}?auto&citylog&${q}`;
  let ok = false;
  for (let attempt = 0; attempt < 3 && !ok; attempt++) {
    if (attempt) { errors = []; await sleep(1.5); }
    try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }); } catch (e) { errors.push('[goto] ' + e.message); continue; }
    ok = await page.waitForFunction(() => window.game && window.game.ready, { timeout: +get('--timeout', '240000') }).then(() => true).catch(() => false);
  }
  if (!ok) { console.log('GAME DID NOT START'); console.log(errors.join('\n')); process.exit(1); }
  await sleep(settle);
  // which kinds exist, and a block that has each: read the plans of some blocks in every band
  const found = await page.evaluate(async () => {
    const { planCell } = await import('/src/city/plan.js');
    const { LAYERS } = await import('/src/core/layout.js');
    const g = window.game, keyOf = (l) => (l.kind === 'special' ? 'special.' + l.special : l.kind === 'shop' ? 'shop.' + l.trade : l.kind === 'room' ? 'room.' + l.use : l.kind);
    const out = {};
    const byBand = {}; LAYERS.forEach((ly, L) => { (byBand[ly.band] = byBand[ly.band] || []).push(L); });
    for (const band of Object.keys(byBand)) {
      const Ls = byBand[band], pick = [Ls[1] || Ls[0], Ls[Math.floor(Ls.length / 2)], Ls[Ls.length - 2] || Ls[0]];
      for (const L of pick) for (let j = 2; j <= 16; j += 2) for (let i = 2; i < 40; i++) {
        if (g.city.info({ L, i, j }).built) continue;
        let plan; try { plan = planCell(L, i, j); } catch (e) { continue; }
        for (const l of plan.lots) { const k = keyOf(l); if (!out[k]) out[k] = { key: k, cell: { L, i, j }, band, name: l.name || '', front: l.front }; }
      }
    }
    return Object.values(out);
  });
  let list = found.filter((f) => f.key !== 'court');
  if (only.length) list = list.filter((f) => only.includes(f.key));
  if (match) list = list.filter((f) => f.key.includes(match));
  const order = (k) => (k.startsWith('special') ? 0 : k === 'hall' ? 1 : k === 'lobby' ? 2 : k.startsWith('room') ? 3 : 4);
  list.sort((a, b) => order(a.key) - order(b.key) || a.key.localeCompare(b.key));
  console.log(`${found.length} kinds of lot in the plans; visiting ${list.length}`);
  fs.mkdirSync(outDir, { recursive: true });
  let nBad = 0;
  for (const it of list) {
    errors = []; logs = [];
    const t0 = Date.now();
    const at = await page.evaluate(async (cell, key) => {
      const g = window.game; const r = await g.city.go(cell, key); if (!r) return null;
      const l = r.lot; return l ? { cell: r.cell, id: l.id, box: [l.x0, l.z0, l.x1, l.z1], front: l.front, name: l.name || '', size: l.size || '' } : { cell: r.cell };
    }, it.cell, it.key).catch((e) => ({ err: e.message }));
    await sleep(settle);
    const stat = () => page.evaluate(async () => {
      const g = window.game, s = g.pipeline.stats, z = g.zone, p = g.player;
      const fps = await new Promise((res) => { let n = 0; const t = performance.now(); const f = () => { n++; if (performance.now() - t < 1000) requestAnimationFrame(f); else res(n); }; requestAnimationFrame(f); });
      return { fps, calls: s.calls, tris: s.tris, lights: s.lights, zone: z ? z.name : null, sub: z ? z.sub || '' : '', place: z ? z.place || '' : '', pos: [p.pos.x, p.pos.y, p.pos.z].map((v) => +v.toFixed(1)), atlas: g.atlas && g.atlas.usage ? g.atlas.usage() : null };
    }).catch((e) => ({ err: e.message }));
    const outside = await stat();
    const file = it.key.replace(/[^a-z0-9.]+/gi, '_');
    try { await page.screenshot({ path: path.join(outDir, file + '.png') }); } catch (e) { /* ignore */ }
    let inside = null;
    if (at && at.box) {
      // the middle of the lot, a little toward the front, looking at the back wall
      await page.evaluate((b, front) => {
        const g = window.game, p = g.player, mx = (b[0] + b[2]) / 2, mz = (b[1] + b[3]) / 2;
        const dx = front === 'w' ? -1 : front === 'e' ? 1 : 0, dz = front === 'n' ? -1 : front === 's' ? 1 : 0;
        const depth = (front === 'n' || front === 's' ? b[3] - b[1] : b[2] - b[0]) * 0.3;
        const yaw = front === 'n' ? Math.PI : front === 's' ? 0 : front === 'w' ? Math.PI / 2 : -Math.PI / 2;      // looking in from the front
        const x = mx + dx * depth, z = mz + dz * depth, col = g.world.colliders(p.frame);
        let y = 0; try { const gr = col ? col.ground(x, z, 1.2) : null; if (gr !== null && gr !== undefined && gr !== -Infinity) y = typeof gr === 'number' ? gr : gr.y; } catch (e) { y = 0; }
        p.place(p.frame, x, Math.max(0, y) + 0.02, z, yaw, 0); if (g.pipeline.resetHistory) g.pipeline.resetHistory();
      }, at.box, at.front).catch(() => {});
      await sleep(Math.max(1, settle * 0.6));
      inside = await stat();
      try { await page.screenshot({ path: path.join(outDir, file + '.in.png') }); } catch (e) { /* ignore */ }
    }
    const built = logs.filter((t) => /^\[city\]/.test(t) && /by lot|built|failed|ms/.test(t)).map((t) => t.slice(0, 700));
    const mine = built.map((t) => { const m = new RegExp(it.key.replace(/\./g, '\\.') + "[^,;]*").exec(t); return m ? m[0] : null; }).filter(Boolean)[0] || '';
    const errs = [...new Set(errors)];
    const failed = logs.filter((t) => /failed|error/i.test(t));
    const bad = [];
    if (!at) bad.push('no block has one'); else if (at.err) bad.push('threw: ' + at.err);
    if (failed.length) bad.push(...failed.map((t) => t.slice(0, 500)));
    if (errs.length) bad.push(errs.length + ' console errors');
    if (inside && !inside.err && !inside.zone) bad.push('no zone inside the lot');
    if (bad.length) { nBad++; code = 1; }
    console.log(`\n${it.key}  (${it.band}, ${at && at.cell ? at.cell.L + ':' + at.cell.i + ':' + at.cell.j : '?'}${at && at.name ? ', "' + at.name + '"' : ''}${at && at.front ? ', front ' + at.front : ''})  ${((Date.now() - t0) / 1000).toFixed(1)} s  ${mine}`);
    if (outside && !outside.err) console.log(`  outside: zone "${outside.zone}" · ${outside.fps} fps · calls ${outside.calls} · tris ${outside.tris} · lights ${outside.lights}${outside.atlas ? ' · atlas ' + JSON.stringify(outside.atlas) : ''}`);
    if (inside && !inside.err) console.log(`  inside:  zone "${inside.zone}" · ${inside.sub} · place ${inside.place || '-'} · ${inside.fps} fps · calls ${inside.calls} · tris ${inside.tris} · lights ${inside.lights}`);
    for (const b of bad) console.log('  !! ' + b);
    for (const e of errs.slice(0, 8)) console.log('     ' + e.slice(0, 600));
  }
  console.log(`\n${list.length} kinds visited, ${nBad} with something to look at.`);
} finally { await browser.close(); }
process.exit(code);
