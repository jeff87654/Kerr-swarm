// The tour: ride a cab to every landmark stop in turn, in one session, and say what was found at each.
// The dev server must be running (python tools/serve.py).
//
//   node tools/tour.mjs                         every stop that belongs to a region
//   node tools/tour.mjs --stops keel-vats,glide-quay
//   node tools/tour.mjs --q "t=21" --settle 4 --out out/tour --page dist/index.html
//
// For each stop it prints: how long the region took to build, where you stand and at what weight, the zone's name,
// people, triangles, lights, frames a second, how full the sign atlas is, how many things there are to use, whether a
// cab can be called to leave, and any place ids its zones use that src/content/places.js has no record of.
// A picture of each arrival lands in out/tour/<stop>.png. Console errors are printed per stop and make the exit code 1.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const q = get('--q', 't=13');
const [w, h] = get('--size', '1280x720').split('x').map(Number);
const port = get('--port', '5190');
const pageName = get('--page', '');
const outDir = get('--out', 'out/tour');
const settle = parseFloat(get('--settle', '3'));
const only = get('--stops', '').split(',').map((s) => s.trim()).filter(Boolean);
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
  page.on('requestfailed', (r) => { const f = r.failure() ? r.failure().errorText : ''; if (!/ERR_ABORTED/.test(f)) errors.push('[requestfailed] ' + r.url() + ' ' + f); });
  const url = `http://127.0.0.1:${port}/${pageName}?auto&${q}`;
  let ok = false;
  for (let attempt = 0; attempt < 3 && !ok; attempt++) {
    if (attempt) { errors = []; await sleep(1.5); }
    try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }); } catch (e) { errors.push('[goto] ' + e.message); continue; }
    ok = await page.waitForFunction(() => window.game && window.game.ready, { timeout: +get('--timeout', '240000') }).then(() => true).catch(() => false);
  }
  if (!ok) { console.log('GAME DID NOT START'); console.log(errors.join('\n')); process.exit(1); }
  await sleep(settle);
  if (errors.length) { console.log('at the start:\n  ' + [...new Set(errors)].slice(0, 20).join('\n  ')); code = 1; }
  await page.evaluate(async () => { const m = await import('/src/content/places.js'); window.__PLACES = m.PLACES; });
  const stops = await page.evaluate(() => window.game.cab.stops.filter((s) => s.region).map((s) => ({ id: s.id, name: s.name, group: s.group || '', region: s.region })));
  const list = only.length ? stops.filter((s) => only.includes(s.id) || only.includes(s.region)) : stops;
  console.log(`${stops.length} landmark stops in ${new Set(stops.map((s) => s.region)).size} regions; visiting ${list.length}`);
  fs.mkdirSync(outDir, { recursive: true });
  const rows = [];
  for (const st of list) {
    errors = []; logs = [];
    const t0 = Date.now();
    const rode = await page.evaluate(async (id) => {
      const g = window.game, to = g.cab.stops.find((s) => s.id === id);
      const t = performance.now();
      await g.cab.ride({ id: 'tour' }, to);
      return { ms: performance.now() - t, frame: g.player.frame ? g.player.frame.id : null };
    }, st.id).catch((e) => ({ err: e.message }));
    await sleep(settle);
    const info = await page.evaluate(async (id, region) => {
      const g = window.game, p = g.player, W = g.world, r = g.regions.get(region), P = window.__PLACES || {};
      const frames = new Set(r ? r.frames : []);
      const zones = W.zones.filter((z) => z.frame && frames.has(z.frame.id));
      const ids = [...new Set(zones.map((z) => z.place).filter(Boolean))];
      const prompt = (it) => { try { return typeof it.prompt === 'function' ? String(it.prompt(g) || '') : String(it.prompt || ''); } catch (e) { return '!' + e.message; } };
      const its = W.interacts.filter((it) => it.frame && frames.has(it.frame.id));
      const fps = await new Promise((res) => { let n = 0; const t = performance.now(); const f = () => { n++; if (performance.now() - t < 1000) requestAnimationFrame(f); else res(n); }; requestAnimationFrame(f); });
      const s = g.pipeline.stats, z = g.zone, u = g.atlas && g.atlas.usage ? g.atlas.usage() : null;
      const sp = g.spawns[(g.cab.stops.find((q) => q.id === id) || {}).spawn];
      return {
        loaded: !!(r && r.loaded), frame: p.frame ? p.frame.id : null, inRegion: !!(p.frame && frames.has(p.frame.id)),
        pos: [p.pos.x, p.pos.y, p.pos.z].map((v) => +v.toFixed(1)), g: +p.gNow.toFixed(3), zone: z ? z.name : null, sub: z ? z.sub || '' : '', place: z ? z.place || '' : '',
        spawn: !!sp, zones: zones.length, ids, missing: ids.filter((k) => !P[k]),
        interacts: its.length, cabs: its.filter((it) => /cab/i.test(prompt(it))).length, badPrompts: its.map(prompt).filter((t) => t[0] === '!').slice(0, 3),
        people: g.people.all.filter((q) => q.frame && frames.has(q.frame.id) && q.state !== 'away').length,
        fps, calls: s.calls, tris: s.tris, lights: s.lights, atlas: u, regions: g.regions.list().filter((q) => q.loaded).map((q) => q.id), frames: [...frames],
        scopes: r ? r.scopes.length : 0, locked: !!p.locked, busy: g.busy, gOver: p.gOverride === null || p.gOverride === undefined ? null : p.gOverride,
      };
    }, st.id, st.region).catch((e) => ({ err: e.message }));
    try { await page.screenshot({ path: path.join(outDir, st.id + '.png') }); } catch (e) { /* ignore */ }
    const built = logs.map((t) => /^\[region ([a-z0-9-]+)\] built in (\d+) ms/.exec(t)).filter(Boolean).map((m) => m[1] + ' ' + m[2] + ' ms').join(', ');
    const bad = [];
    if (rode.err || info.err) bad.push('threw: ' + (rode.err || info.err));
    else {
      if (!info.loaded) bad.push('region not loaded');
      if (!info.inRegion) bad.push('player is not in the region (frame ' + info.frame + ')');
      if (!info.spawn) bad.push('no spawn');
      if (!info.zone) bad.push('no zone at the spawn');
      if (!info.cabs) bad.push('no cab berth');
      if (info.locked || info.busy || info.gOver !== null) bad.push('player left locked/busy/gOverride: ' + info.locked + '/' + info.busy + '/' + info.gOver);
      if (info.missing.length) bad.push('no place record: ' + info.missing.join(', '));
      if (info.badPrompts.length) bad.push('prompt threw: ' + info.badPrompts.join(' | '));
      if (info.regions.length > 2) bad.push('regions still loaded: ' + info.regions.join(', '));
    }
    const errs = [...new Set(errors)];
    if (errs.length) { bad.push(errs.length + ' console errors'); code = 1; }
    rows.push({ st, info, bad });
    console.log(`\n${st.id}  (${st.group} · ${st.name})  ${((Date.now() - t0) / 1000).toFixed(1)} s${built ? '  built: ' + built : '  (already built)'}`);
    if (!info.err) {
      console.log(`  zone "${info.zone}" · ${info.sub} · place ${info.place || '-'} · ${info.g} g · pos ${info.pos.join(',')} in ${info.frame}`);
      console.log(`  ${info.people} people · ${info.interacts} things to use (${info.cabs} cab) · ${info.zones} zones · ${info.scopes} scopes · ${info.fps} fps · calls ${info.calls} · tris ${info.tris} · lights ${info.lights}${info.atlas ? ' · atlas ' + JSON.stringify(info.atlas) : ''}`);
      console.log(`  places: ${info.ids.join(', ') || '-'} · loaded regions: ${info.regions.join(', ')}`);
    }
    for (const b of bad) console.log('  !! ' + b);
    for (const e of errs.slice(0, 12)) console.log('     ' + e.slice(0, 600));
  }
  const nBad = rows.filter((r) => r.bad.length).length;
  console.log(`\n${rows.length} stops visited, ${nBad} with something to look at.`);
  if (nBad) code = 1;
} finally { await browser.close(); }
process.exit(code);
