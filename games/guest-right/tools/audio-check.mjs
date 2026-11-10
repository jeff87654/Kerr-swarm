// Automated audio check: opens tools/audio-dev.html in headless Chrome and runs window.audioSelfTest().
//
//   node tools/audio-check.mjs                 everything
//   node tools/audio-check.mjs cues,beds       only some groups (sfx ui steps voice loops beds reverbs cues cpu)
//   node tools/audio-check.mjs cues dawn,reel  only some names in those groups
//
// Needs the dev server on http://localhost:5190/ (python tools/serve.py). Exits 1 on any failure.

import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = 'http://localhost:5190/tools/audio-dev.html';
const only = process.argv[2] || '';
const name = process.argv[3] || '';
const here = dirname(fileURLToPath(import.meta.url));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
});
let code = 1;
try {
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
  const missing = [];
  page.on('response', (r) => { if (r.status() >= 400) missing.push(r.status() + ' ' + r.url()); });
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForFunction('window.audioDevReady === true', { timeout: 15000 });
  const t0 = Date.now();
  const res = await page.evaluate((o) => window.audioSelfTest(o), { only: only || undefined, name: name || undefined });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  const pad = (s, n) => String(s).padEnd(n);
  const num = (x, d, n) => (x === undefined || x === null ? '' : Number.isFinite(x) ? x.toFixed(d) : '-inf').padStart(n);
  console.log(pad('kind', 7) + pad('name', 15) + 'peak dB'.padStart(8) + 'rms dB'.padStart(8) + 'act dB'.padStart(8) + 'cent Hz'.padStart(9) + 'NaN'.padStart(5) + 'ms'.padStart(7) + '  result');
  for (const r of res.rows) {
    console.log(pad(r.kind, 7) + pad(r.name, 15) + num(r.peakDb, 1, 8) + num(r.rmsDb, 1, 8) + num(r.activeDb, 1, 8) +
      String(r.centroid ?? '').padStart(9) + String(r.nan ?? '').padStart(5) + String(r.ms ?? '').padStart(7) + '  ' + (r.fail.length ? 'FAIL ' + r.fail.join('; ') : 'ok'));
  }
  if (res.cpu) console.log('cpu', JSON.stringify(res.cpu));
  // a missing favicon is the browser's business, not ours
  const onlyFavicon = missing.length > 0 && missing.every((m) => /favicon/.test(m));
  const realErrors = consoleErrors.filter((e) => !(onlyFavicon && /Failed to load resource/.test(e)));
  for (const m of missing) if (!/favicon/.test(m)) realErrors.push('missing: ' + m);
  if (realErrors.length) { console.log('console errors:'); for (const e of realErrors) console.log('  ' + e); }
  const fails = res.rows.filter((r) => r.fail.length).length;
  console.log(`${res.rows.length} items in ${secs} s, ${fails} failing${res.cpu ? ', cpu ' + (res.cpu.ok ? 'ok' : 'FAIL') : ''}`);
  try {
    const out = join(here, '..', 'out', 'audio');
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, 'check-' + (only || 'all').replace(/[^a-z,]/g, '') + '.json'), JSON.stringify(res, null, 1));
  } catch (e) { /* scratch output is optional */ }
  code = res.ok && !realErrors.length ? 0 : 1;
} catch (e) {
  console.error('audio-check failed:', e.message);
} finally {
  await browser.close();
}
process.exit(code);
