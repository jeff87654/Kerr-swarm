// The plan of a Hollow floor: 9.4 km round and 3.75 km long, painted with the canvas 2D API in metres.
// x is arc length round the floor (0 .. C, wrapping), z runs from the front wall (0) to the back wall (L).
//
// Three layers are painted together:
//   alb   what the land looks like from far off (any colours)
//   mask  red = water, green = tree cover (woods), blue = lamps that glow at night
//   kind  red = paving, green = orchard rows (the shader draws a tree on every lattice point), blue = people about
// The ground shader adds the fine grain (grass, crowns, tiles, picnickers, ripples) and the worlds scatter real trees
// and people near the camera's flight with sampler().
import { CanvasTexture, SRGBColorSpace, NoColorSpace, RepeatWrapping, ClampToEdgeWrapping, LinearMipmapLinearFilter, LinearFilter } from 'three';
import { DRUM } from './drum.js';
import { makeRng, fbm2wrap } from '../core/rng.js';

export const C = 2 * Math.PI * DRUM.RH;     // 9424.78 m round the floor
export const L = DRUM.L;

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

export class Plan {
  /** size: [w, h] pixels of the main layers (default 4096 x 2048); floorR: radius of the floor being planned */
  constructor(size = [4096, 2048], opts = {}) {
    this.w = size[0]; this.h = size[1];
    this.C = opts.C || C; this.L = opts.L || L;
    this.cv = { alb: canvas(this.w, this.h), mask: canvas(this.w, this.h), kind: canvas(this.w >> 1, this.h >> 1) };
    this.cx = {};
    for (const k of ['alb', 'mask', 'kind']) {
      const cx = this.cv[k].getContext('2d', { willReadFrequently: !!opts.cpu });
      cx.fillStyle = k === 'alb' ? '#5d8a3c' : '#000000';
      cx.fillRect(0, 0, this.cv[k].width, this.cv[k].height);
      this.cx[k] = cx;
    }
    this.features = [];     // things worlds and the kit may want to find again: { type, x, z, ... }
    this.queue = [];        // painting waits here until settle(): drawing a plan this size takes a few hundred milliseconds
  }

  /**
   * Draw on one layer in metres. fn(ctx) is called three times, shifted by one turn each way, so shapes may cross the seam.
   * Nothing is drawn yet: the call is kept, in order, and done by settle() (buildHollow does that, a little each frame).
   */
  layer(name, fn) { this.queue.push([name, fn]); }
  /** The same, but fn(ctx) is called once only, unshifted: for drawing of your own that already handles the seam (or does not reach it). */
  once(name, fn) { this.queue.push([name, (cx, k) => { if (k === 0) fn(cx); }]); }
  _draw(name, fn) {
    const cx = this.cx[name], cv = this.cv[name];
    const sx = cv.width / this.C, sz = cv.height / this.L;
    for (const k of [-1, 0, 1]) {
      cx.save();
      cx.setTransform(sx, 0, 0, sz, k * cv.width, 0);
      fn(cx, k);
      cx.restore();
    }
  }
  // make the canvases actually draw what they have been told to (they put it off until someone reads them)
  _flush() { for (const k of ['alb', 'mask', 'kind']) this.cx[k].getImageData(0, 0, 1, 1); }
  /** Do the painting asked for so far, a few milliseconds at a time: `yield* plan.settle()`. */
  *settle() {
    // draw a batch, make the canvases really do it, see how long that took, and size the next batch to suit
    // (the first things painted are the big ones, whole-floor fills: start one at a time; many small shapes soon go 64 to a step)
    let n = this._batch || 1;
    while (this.queue.length) {
      const f0 = performance.now();
      for (let i = 0; i < n && this.queue.length; i++) { const [name, fn] = this.queue.shift(); this._draw(name, fn); }
      this._flush(); const fd = performance.now() - f0;
      if (fd < 4) n = Math.min(64, n * 2); else if (fd > 9) n = Math.max(1, n >> 1);
      yield 'plan: painting';
    }
    this._batch = n;
  }
  /** The same all at once (used if a plan is read before it has been settled). */
  settleNow() { while (this.queue.length) { const [name, fn] = this.queue.shift(); this._draw(name, fn); } }

  // ---- shapes (Path2D in metres)
  rect(x0, z0, x1, z1, r = 0) {
    const p = new Path2D();
    if (r > 0 && p.roundRect) p.roundRect(x0, z0, x1 - x0, z1 - z0, r); else p.rect(x0, z0, x1 - x0, z1 - z0);
    return p;
  }
  band(z0, z1) { return this.rect(-this.C, z0, 2 * this.C, z1); }
  ellipse(cx, cz, rx, rz, rot = 0) { const p = new Path2D(); p.ellipse(cx, cz, rx, rz, rot, 0, Math.PI * 2); return p; }
  poly(points) { const p = new Path2D(); points.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]))); p.closePath(); return p; }
  line(points) { const p = new Path2D(); points.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]))); return p; }
  /** an organic closed shape: centre, radii, opts { wobble 0..0.6, lobes (how many bumps), seed, n (points) } */
  blob(cx, cz, rx, rz, opts = {}) {
    const n = opts.n || 96, wob = opts.wobble === undefined ? 0.25 : opts.wobble, lobes = opts.lobes || 5, seed = opts.seed || 1;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const k = 1 + wob * (fbm2wrap((i / n) * lobes, seed * 3.7, lobes, 3, seed) - 0.5) * 2;
      pts.push([cx + Math.cos(a) * rx * k, cz + Math.sin(a) * rz * k]);
    }
    const p = new Path2D();
    // smooth through the points
    for (let i = 0; i <= n; i++) {
      const a = pts[i % n], b = pts[(i + 1) % n], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      if (i === 0) p.moveTo(mx, mz); else p.quadraticCurveTo(a[0], a[1], mx, mz);
    }
    p.closePath();
    return p;
  }
  /** a smooth open curve through points, as a Path2D for stroke() */
  curve(points) {
    const p = new Path2D(), n = points.length;
    p.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < n - 1; i++) { const mx = (points[i][0] + points[i + 1][0]) / 2, mz = (points[i][1] + points[i + 1][1]) / 2; p.quadraticCurveTo(points[i][0], points[i][1], mx, mz); }
    p.lineTo(points[n - 1][0], points[n - 1][1]);
    return p;
  }

  /**
   * Fill a shape. opts:
   *   color, alpha        land colour on the alb layer
   *   water, wood, lamp   0..1 added to the mask layer (water 1 = lake)
   *   paved, rows, life   0..1 added to the kind layer
   *   clear               array of channels to wipe inside the shape first: 'water','wood','lamp','paved','rows','life'
   *   feather             metres of soft edge
   */
  fill(shape, opts = {}) {
    const f = opts.feather || 0;
    const run = (name, style, op) => this.layer(name, (cx) => {
      cx.globalCompositeOperation = op || 'source-over';
      cx.fillStyle = style;
      cx.fill(shape, opts.rule || 'nonzero');
      if (f > 0) {
        // a soft edge: the outline stroked several times, wider and fainter each time (no blur filter: that is very slow here)
        cx.strokeStyle = style; cx.lineJoin = 'round';
        const n = 6, a0 = cx.globalAlpha;
        if (op !== 'multiply') for (let i = n; i >= 1; i--) { cx.globalAlpha = a0 / n; cx.lineWidth = 2 * f * (i / n); cx.stroke(shape); }
        cx.globalAlpha = a0;
      }
    });
    this._clear(opts, (name, style) => run(name, style, 'multiply'));
    if (opts.color) run('alb', withAlpha(opts.color, opts.alpha));
    const m = chan(opts.water, opts.wood, opts.lamp); if (m) run('mask', m, 'lighter');
    const k = chan(opts.paved, opts.rows, opts.life); if (k) run('kind', k, 'lighter');
    return this;
  }
  /** Stroke a line or curve (a Path2D from line()/curve(), or a list of points). width in metres. opts as fill(), plus cap, dash:[on, off] */
  stroke(shape, width, opts = {}) {
    if (Array.isArray(shape)) shape = this.curve(shape);
    const run = (name, style, op) => this.layer(name, (cx) => {
      cx.globalCompositeOperation = op || 'source-over';
      cx.lineWidth = width; cx.lineCap = opts.cap || 'round'; cx.lineJoin = 'round';
      if (opts.dash) cx.setLineDash(opts.dash);
      cx.strokeStyle = style;
      cx.stroke(shape);
    });
    this._clear(opts, (name, style) => run(name, style, 'multiply'));
    if (opts.color) run('alb', withAlpha(opts.color, opts.alpha));
    const m = chan(opts.water, opts.wood, opts.lamp); if (m) run('mask', m, 'lighter');
    const k = chan(opts.paved, opts.rows, opts.life); if (k) run('kind', k, 'lighter');
    return this;
  }
  _clear(opts, run) {
    if (!opts.clear) return;
    const c = opts.clear;
    const mm = `rgb(${c.includes('water') ? 0 : 255},${c.includes('wood') ? 0 : 255},${c.includes('lamp') ? 0 : 255})`;
    const kk = `rgb(${c.includes('paved') ? 0 : 255},${c.includes('rows') ? 0 : 255},${c.includes('life') ? 0 : 255})`;
    if (mm !== 'rgb(255,255,255)') run('mask', mm);
    if (kk !== 'rgb(255,255,255)') run('kind', kk);
  }
  /** Many small discs at once: points [[x, z], ...], radius in metres. opts as fill(). */
  dots(points, radius, opts = {}) {
    const p = new Path2D();
    for (const q of points) { p.moveTo(q[0] + radius, q[1]); p.arc(q[0], q[1], radius, 0, Math.PI * 2); }
    return this.fill(p, opts);
  }
  /** Lamps every `spacing` metres along a list of points (and remembered, so the kit can stand real lamps near the camera). */
  lamps(points, spacing, opts = {}) {
    const out = [];
    let carry = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let d = carry;
      while (d < len) { const t = d / len; out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); d += spacing; }
      carry = d - len;
    }
    this.dots(out, opts.radius || 2.2, { lamp: opts.power === undefined ? 1 : opts.power });
    for (const q of out) this.features.push({ type: 'lamp', x: ((q[0] % this.C) + this.C) % this.C, z: q[1], h: opts.h || 4.5, color: opts.color });
    return out;
  }
  /**
   * Trees in a line down both sides of a walk: points, how far each side of the centre line (metres), and their spacing.
   * opts: color (crown colour seen from far), radius (default 4.2)
   */
  avenue(points, side = 7, spacing = 11, opts = {}) {
    const dots = [];
    let carry = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 1e-6) continue;
      const nx = -(b[1] - a[1]) / len, nz = (b[0] - a[0]) / len;
      let d = carry;
      while (d < len) { const t = d / len, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; dots.push([x + nx * side, z + nz * side], [x - nx * side, z - nz * side]); d += spacing; }
      carry = d - len;
    }
    return this.dots(dots, opts.radius || 4.2, { color: opts.color || '#5f8a48', wood: 1 });
  }
  /**
   * Clumps of trees scattered over a rectangle of the floor: count of them, each r0..r1 metres across.
   * opts: x0, x1, z0, z1 (default the whole floor), color or colors, seed, keep(x, z) -> false to skip a spot,
   *       keepLife (people stay under the trees: at night a clump with nobody in it reads as a hole in the lawn's speckle)
   */
  clumps(count, r0, r1, opts = {}) {
    const rng = makeRng(opts.seed || 'clumps');
    const cols = opts.colors || [opts.color || '#5f8a48'];
    for (let i = 0; i < count; i++) {
      const x = rng.f(opts.x0 || 0, opts.x1 || this.C), z = rng.f(opts.z0 || 0, opts.z1 || this.L), r = rng.f(r0, r1);
      if (opts.keep && !opts.keep(x, z)) continue;
      this.fill(this.blob(x, z, r, r * rng.f(0.6, 1.1), { wobble: 0.3, lobes: 4, seed: i + 1, n: 24 }), { color: rng.pick(cols), wood: 1, clear: opts.keepLife ? ['rows'] : ['life', 'rows'] });
    }
    return this;
  }
  /**
   * A formal garden: a hedged rectangle with paths crossing at a round bed, and beds of colour in each quarter.
   * colors: flower colours for the beds.
   */
  garden(x0, z0, x1, z1, colors = ['#d9a0b4', '#e6cf7a', '#c9d98a', '#b7a3d6'], opts = {}) {
    const rng = makeRng(opts.seed || 'garden' + Math.round(x0 + z0));
    const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, w = x1 - x0, h = z1 - z0;
    this.fill(this.rect(x0, z0, x1, z1, 4), { color: opts.hedge || '#3f6b3a', clear: ['wood', 'rows', 'life'] });
    this.fill(this.rect(x0 + 3, z0 + 3, x1 - 3, z1 - 3, 3), { color: opts.gravel || '#d3c7a8', paved: 0.6, life: 0.5 });
    for (const [qx, qz] of [[x0 + w * 0.27, z0 + h * 0.27], [x0 + w * 0.73, z0 + h * 0.27], [x0 + w * 0.27, z0 + h * 0.73], [x0 + w * 0.73, z0 + h * 0.73]]) {
      this.fill(this.rect(qx - w * 0.19, qz - h * 0.19, qx + w * 0.19, qz + h * 0.19, 3), { color: rng.pick(colors), clear: ['paved', 'life'] });
      this.fill(this.rect(qx - w * 0.1, qz - h * 0.1, qx + w * 0.1, qz + h * 0.1, 2), { color: rng.pick(colors) });
    }
    this.fill(this.ellipse(mx, mz, Math.min(w, h) * 0.09, Math.min(w, h) * 0.09), { color: rng.pick(colors), clear: ['paved'] });
    return this;
  }

  /** Soft patches of varied colour over a shape (or everywhere): breaks up flat fills. colors: list; count: how many patches; size: metres */
  mottle(colors, count, size, opts = {}) {
    const rng = makeRng(opts.seed || 'mottle'), list = [];
    for (let i = 0; i < count; i++) {
      const s = size * rng.f(0.5, 1.5);
      list.push({ x: rng.f(opts.x0 || 0, opts.x1 || this.C), z: rng.f(opts.z0 || 0, opts.z1 || this.L), rx: s, rz: s * rng.f(0.5, 1.2), rot: rng.f(0, 3.14), a: (opts.alpha || 0.35) * rng.f(0.4, 1), c: rng.pick(colors) });
    }
    for (let i0 = 0; i0 < list.length; i0 += 20) this.layer('alb', (cx, k) => {
      if (opts.clip) cx.clip(opts.clip);
      for (const q of list.slice(i0, i0 + 20)) {
        if (q.x + k * this.C < -q.rx * 1.3 || q.x + k * this.C > this.C + q.rx * 1.3) continue;        // this copy of it is off the floor
        // a patch that fades out from its middle (a gradient, not a blur)
        cx.save();
        cx.translate(q.x, q.z); cx.rotate(q.rot); cx.scale(1, q.rz / q.rx);
        const g = cx.createRadialGradient(0, 0, 0, 0, 0, q.rx * 1.25);
        g.addColorStop(0, withAlpha(q.c, q.a)); g.addColorStop(0.45, withAlpha(q.c, q.a * 0.7)); g.addColorStop(1, withAlpha(q.c, 0));
        cx.fillStyle = g;
        cx.beginPath(); cx.arc(0, 0, q.rx * 1.25, 0, Math.PI * 2); cx.fill();
        cx.restore();
      }
    });
    return this;
  }

  /** The three textures the ground shader reads. */
  textures(renderer) {
    this.settleNow();
    const aniso = renderer ? Math.min(16, renderer.capabilities.getMaxAnisotropy()) : 8;
    const mk = (cv, srgb) => {
      const t = new CanvasTexture(cv);
      t.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
      t.wrapS = RepeatWrapping; t.wrapT = ClampToEdgeWrapping;
      t.minFilter = LinearMipmapLinearFilter; t.magFilter = LinearFilter; t.generateMipmaps = true; t.anisotropy = aniso;
      t.flipY = false;                 // row 0 of the canvas is z = 0, for the shader as for sampler()
      t.needsUpdate = true;
      return t;
    };
    return { alb: mk(this.cv.alb, true), mask: mk(this.cv.mask, false), kind: mk(this.cv.kind, false) };
  }

  /**
   * A reader for scattering: returns at(x, z) -> { water, wood, lamp, paved, rows, life, r, g, b } (0..1; r g b are the land colour, sRGB).
   * Reads the layers at reduced size once.
   */
  sampler(w = 1024, h = 512) {
    this.settleNow();
    return this._reader(this._grab(this.cv.alb, w, h), this._grab(this.cv.mask, w, h), this._grab(this.cv.kind, w, h), w, h);
  }
  /** The same reader made a layer a step, `const at = yield* plan.reader()`: reading one layer back takes tens of milliseconds. */
  *reader(w = 1024, h = 512) {
    yield* this.settle();
    const A = this._grab(this.cv.alb, w, h); yield 'plan: reading';
    const M = this._grab(this.cv.mask, w, h); yield 'plan: reading';
    const K = this._grab(this.cv.kind, w, h); yield 'plan: reading';
    return this._reader(A, M, K, w, h);
  }
  _grab(cv, w, h) { const c = canvas(w, h), cx = c.getContext('2d', { willReadFrequently: true }); cx.drawImage(cv, 0, 0, w, h); return cx.getImageData(0, 0, w, h).data; }
  _reader(A, M, K, w, h) {
    const Cc = this.C, Ll = this.L, out = { water: 0, wood: 0, lamp: 0, paved: 0, rows: 0, life: 0, r: 0, g: 0, b: 0 };
    const at = (x, z) => {
      let ix = Math.floor((((x % Cc) + Cc) % Cc) / Cc * w); if (ix >= w) ix = w - 1;
      let iz = Math.floor(z / Ll * h); iz = iz < 0 ? 0 : iz >= h ? h - 1 : iz;
      const i = (iz * w + ix) * 4;
      out.water = M[i] / 255; out.wood = M[i + 1] / 255; out.lamp = M[i + 2] / 255;
      out.paved = K[i] / 255; out.rows = K[i + 1] / 255; out.life = K[i + 2] / 255;
      out.r = A[i] / 255; out.g = A[i + 1] / 255; out.b = A[i + 2] / 255;
      return out;
    };
    at.data = { A, M, K, w, h };      // the pixels themselves (rgba bytes), for whoever paints after the reading and must keep it true
    return at;
  }
}

function chan(r, g, b) {
  if (!r && !g && !b) return null;
  const f = (v) => Math.round(255 * Math.min(1, Math.max(0, v || 0)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
function withAlpha(color, alpha) {
  if (alpha === undefined || alpha >= 1) return color;
  if (color[0] === '#' && color.length === 4) color = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
  if (color[0] === '#' && color.length === 7) { const n = parseInt(color.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${alpha})`; }
  return color;
}
