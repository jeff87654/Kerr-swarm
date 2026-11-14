// Does the picture shake? Takes frames a sixtieth of a second of flight apart, with the camera held steady between
// them, and measures how much each differs from the one before. A surface whose pattern is worked out from where each
// pixel lies (the radiator plain, a Hollow's plan) shakes if that place is not carried precisely, and stills cannot
// show it. The dev server must be running (python tools/serve.py).
//
//   node tools/jitter.mjs --w ochre-backcrew --t 3,12,20 --out out/x/j
//
// --w      world id      --file  a world file, through dev.html      --t   seconds into the flight to test at
// --n      frames at each time (default 8)      --dt  seconds of flight between frames (default 1/60; with 0.002 the
//          camera hardly moves, and whatever still differs is the shake itself)
// --size   960x540 (default)      --out   path prefix: writes <out>-<t>-<k>.png, and <out>-<t>-diff.png, the
//          difference between the last two frames, eight times over
// Prints for each time the mean difference between consecutive frames (0 to 255, over the whole picture) and the share
// of pixels that changed by more than 24. The world's clock is held and the grain taken off, so with a small --dt a
// steady picture reads close to nothing, and a shaking surface does not.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const port = get('--port', '5210'), out = get('--out', 'out/jitter'), world = get('--w', ''), file = get('--file', '');
const times = get('--t', '5').split(',').map(Number), n = parseInt(get('--n', '8'), 10), dt = parseFloat(get('--dt', String(1 / 60)));
const [w, h] = get('--size', '960x540').split('x').map(Number);
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => fs.existsSync(p));
if (!chrome) { console.log('No Chrome or Edge found.'); process.exit(1); }

// a PNG's pixels, without a library: the screenshots are 8-bit RGB or RGBA, not interlaced
function decode(buf) {
  let p = 8, width = 0, height = 0, type = 0; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), name = buf.toString('ascii', p + 4, p + 8), data = buf.subarray(p + 8, p + 8 + len);
    if (name === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); type = data[9]; }
    else if (name === 'IDAT') idat.push(data);
    p += 12 + len;
  }
  const bpp = type === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), stride = width * bpp, px = Buffer.alloc(width * height * 3);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)], line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? line[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      line[x] = v & 255;
    }
    for (let x = 0; x < width; x++) { px[(y * width + x) * 3] = line[x * bpp]; px[(y * width + x) * 3 + 1] = line[x * bpp + 1]; px[(y * width + x) * 3 + 2] = line[x * bpp + 2]; }
    prev = line;
  }
  return { width, height, px };
}
function encode(width, height, px) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) px.copy(raw, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3);
  const chunk = (name, data) => { const b = Buffer.alloc(12 + data.length); b.writeUInt32BE(data.length, 0); b.write(name, 4, 'ascii'); data.copy(b, 8); b.writeUInt32BE(zlib.crc32 ? zlib.crc32(b.subarray(4, 8 + data.length)) : 0, 8 + data.length); return b; };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new',
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--force_high_performance_gpu', '--enable-unsafe-swiftshader', `--window-size=${w},${h}`, '--mute-audio'],
  defaultViewport: { width: w, height: h },
});
let code = 0;
try {
  const page = await browser.newPage();
  const q = 'ui=0&debug&tier=2&freeze&steady';
  const url = file ? `http://127.0.0.1:${port}/dev.html?file=${file}&${q}` : `http://127.0.0.1:${port}/?${q}&only=${world}&w=${world}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const ok = await page.waitForFunction(() => window.app && window.app.ready, { timeout: 90000 }).then(() => true).catch(() => false);
  if (!ok) { console.log('THE PAGE DID NOT START'); code = 1; }
  else {
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    // hold the world's own clock and take the film grain off, so that nothing differs between two frames but where
    // the camera is
    await page.evaluate(() => { const e = window.app.engine; e.paused = true; if (e.cur && e.cur.look) e.cur.look.grain = 0; });
    await new Promise((r) => setTimeout(r, 2500));      // the page fades in
    for (const t of times) {
      const frames = [];
      await page.evaluate((tt) => { window.app.engine.cur.t = tt; }, t);
      await new Promise((r) => setTimeout(r, 900));       // and a jump in the flight takes a moment to settle
      for (let k = 0; k < n; k++) {
        await page.evaluate((tt) => { window.app.engine.cur.t = tt; }, t + k * dt);
        await new Promise((r) => setTimeout(r, 220));
        const buf = Buffer.from(await page.screenshot({ type: 'png' }));
        if (k >= n - 2) fs.writeFileSync(`${out}-${t}-${k}.png`, buf);
        frames.push(decode(buf));
      }
      let sum = 0, big = 0, count = 0; const last = Buffer.alloc(frames[0].px.length);
      for (let k = 1; k < n; k++) {
        const a = frames[k - 1].px, b = frames[k].px;
        for (let i = 0; i < a.length; i += 3) {
          const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2]));
          sum += d; if (d > 24) big++; count++;
          if (k === n - 1) { const v = Math.min(255, d * 8); last[i] = v; last[i + 1] = v; last[i + 2] = v; }
        }
      }
      fs.writeFileSync(`${out}-${t}-diff.png`, encode(frames[0].width, frames[0].height, last));
      console.log(`t=${String(t).padStart(5)}   mean difference ${(sum / count).toFixed(2)}   over 24: ${(100 * big / count).toFixed(2)}%`);
    }
  }
} finally { await browser.close(); }
process.exit(code);
