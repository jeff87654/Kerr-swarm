// A check for changes to kit/plan.js: print a checksum of each Hollow world's painted plan (its three layers).
// Run it before and after a change that should not alter what is painted, and compare the two lists.
// The dev server must be running (python tools/serve.py).
//
//   node tools/planhash.mjs                      # every world file that paints a plan
//   node tools/planhash.mjs sloe_wood lovage_noon
//   node tools/planhash.mjs --save out/plans/a   # also save each layer as a PNG (half size), for tools/plandiff.py
// The checksums of one world differ a little from run to run (the graphics card's anti-aliasing is not exact), so for
// a real comparison save two sets and run `python tools/plandiff.py out/plans/a out/plans/b`.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, '..', 'src', 'worlds');
const argv = process.argv.slice(2), si = argv.indexOf('--save'), save = si >= 0 ? argv[si + 1] : '';
if (si >= 0) argv.splice(si, 2);
if (save) fs.mkdirSync(save, { recursive: true });
let files = argv.filter((a) => !a.startsWith('--'));
if (!files.length) files = fs.readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'index.js' && /buildHollow/.test(fs.readFileSync(path.join(dir, f), 'utf8'))).map((f) => f.replace(/\.js$/, ''));
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => fs.existsSync(p));
if (!chrome) { console.log('No Chrome or Edge found.'); process.exit(1); }

const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new',
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--force_high_performance_gpu', '--enable-unsafe-swiftshader', '--window-size=640,360', '--mute-audio'],
  defaultViewport: { width: 640, height: 360 },
});
try {
  for (const f of files) {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:5210/dev.html?file=${f}&ui=0&freeze&steady&tier=2`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const ok = await page.waitForFunction(() => window.app && window.app.ready, { timeout: 120000 }).then(() => true).catch(() => false);
    if (!ok) { console.log(`${f}: did not start`); await page.close(); continue; }
    const sums = await page.evaluate((wantPng) => {
      // the plan's canvases are the ground's three textures
      let mat = null;
      window.app.engine.cur.scene.traverse((o) => { if (!mat && o.material && o.material.uniforms && o.material.uniforms.tAlb && o.material.uniforms.tKind) mat = o.material; });
      if (!mat) return null;
      const out = [], png = [];
      for (const k of ['tAlb', 'tMask', 'tKind']) {
        const cv = mat.uniforms[k].value.image, d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
        let h = 2166136261;
        for (let i = 0; i < d.length; i++) { h ^= d[i]; h = Math.imul(h, 16777619); }
        out.push((h >>> 0).toString(16).padStart(8, '0'));
        if (wantPng) { const c = document.createElement('canvas'); c.width = 2048; c.height = 1024; c.getContext('2d').drawImage(cv, 0, 0, 2048, 1024); png.push(c.toDataURL('image/png').split(',')[1]); }
      }
      return { sums: out.join(' '), png };
    }, !!save);
    console.log(`${f}: ${sums ? sums.sums : 'no plan found'}`);
    if (sums && save) ['alb', 'mask', 'kind'].forEach((k, i) => fs.writeFileSync(path.join(save, `${f}-${k}.png`), Buffer.from(sums.png[i], 'base64')));
    await page.close();
  }
} finally { await browser.close(); }
