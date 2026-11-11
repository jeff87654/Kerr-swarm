// Shared plan, palette and drawing helpers for the Breadboard, the Hollow's playing grounds (lm_hollow_grounds.js):
// where the track, the pitches and the pavilion stand, the surface of the track (laid on the land, banked on the heavy
// bend), draped strips and flat quads that follow the ground, a stroke font for painted numbers, hoops and lamp posts.
import { defineProp } from '../world/props.js';
import { heightAt } from '../world/land.js';
import { DRUM } from '../core/drum.js';
import { clamp, smoothstep } from '../core/util.js';

export const lmhgParts = true;

// ---- the plan (frame 'hollow': x spinward, z the drum's own z). Chosen where the meadow is open: no trees on the lanes.
// The track: a 400 m oval, straights along the axis, the heavy bend at the back end (run spinward), the light bend at
// the front end (run anti). Lane 1's inner edge is 36.5 m from the bend centres; eight lanes of 1.22 m; a run-off beyond.
export const T = { X: -612, Z: 2416, HS: 42.195, RI: 36.5, LW: 1.22, NL: 8, RUN: 0.7, BANK: 1.05, SHOULDER: 2.2 };
T.RO = T.RI + T.LW * T.NL;                 // outer edge of lane 8: 46.26
T.RE = T.RO + T.RUN;                        // outer edge of the run-off
T.ZH = T.Z + T.HS;                          // the heavy bend's centre z, and the start and finish line
T.ZL = T.Z - T.HS;                          // the light bend's centre z
T.R1 = T.RI + 0.3;                          // the line a lap of lane 1 is measured on: 400 m
// four spinball pitches side by side along the axis, each 36 m spinward to anti by 20 m; pitch k spans z0(k)..z0(k)+W
export const P = { CX: -723, Z0: 2318, L: 36, W: 20, GAP: 4, BOARD: 1.2 };
export const pz0 = (k) => P.Z0 + k * (P.W + P.GAP);
// the pavilion: veranda edge, front wall, back wall, ends
export const V = { XV: -698.6, XF: -694.6, XB: -687.6, Z0: 2378, Z1: 2404 };
// the lift pavilion nearest the grounds (src/city/pavilions.js puts one at every path crossing)
export const LIFT = [-680, 2430];

// ---- palette: strong dyes on cream and dark wood, the track a brick red
export const C = {
  brick: '#b4452c', worn: '#c98a70', lane: '#efe7d6', kerb: '#e9e2d0', teal: '#2b6a6c', verm: '#c4472c', saffron: '#e3aa3a',
  indigo: '#34407a', magenta: '#b8336a', leaf: '#5f8f3a', cream: '#efe6d2', wood: '#5a4030', dark: '#2b2622', iron: '#24443a',
  brass: '#b08a45', walls: '#e6b04a', roof: '#2f5b5c', mown: '#d6ecb0', mown2: '#bcd892', ochre: '#c98b2e',
};
export const FLAGS = ['#d9472b', '#e7b547', '#2f8f8a', '#3b4a8f', '#b8336a', '#6b9f3e', '#f08a3a', '#efe6d2'];

// ---- the Hollow's open-air zone, as the first game's places make it
export const ENV = { exposure: 1.0, autoKey: 0.19, autoMin: 0.02, autoMax: 5, bloom: 0.045, warmth: 0.05, contrast: 1.1, saturation: 1.12 };
export const OPEN = { ambience: 'hollow-day', reverb: 'open', sky: true, skyTop: 40, sun: true, sunPower: 34, far: 2400, headroom: 30 };

// ---- physics, worked from the drum's own numbers
export const HOLLOW_G = DRUM.OMEGA * DRUM.OMEGA * DRUM.HOLLOW_R;          // 4.9 m/s2: half a g
export const RIM_SPEED = DRUM.OMEGA * DRUM.HOLLOW_R;                        // 85.8 m/s: how fast the floor turns
// weight of something moving spinward at v (anti if negative), as a fraction of its weight standing still, at radius r
export const weightFrac = (v, r = DRUM.HOLLOW_R) => { const w = DRUM.OMEGA * r; return (1 + v / w) * (1 + v / w); };

// ---- the ground, sampled once on a 2 m grid over the grounds (at even metres, where the land's nearest ring has its
// vertices) and read back bilinearly: much cheaper than the land's noise, and it follows the ground as it is drawn.
const HG = { x0: -770, z0: 2270, nx: 116, nz: 132, step: 2 };
const HGRID = new Float32Array(HG.nx * HG.nz).fill(NaN);
const hAt = (i, j) => { const k = j * HG.nx + i; let v = HGRID[k]; if (v !== v) { v = HGRID[k] = heightAt(HG.x0 + i * HG.step, HG.z0 + j * HG.step); } return v; };
export function groundY(x, z) {
  const fx = (x - HG.x0) / HG.step, fz = (z - HG.z0) / HG.step, i = Math.floor(fx), j = Math.floor(fz);
  if (i < 0 || j < 0 || i >= HG.nx - 1 || j >= HG.nz - 1) return heightAt(x, z);
  const tx = fx - i, tz = fz - j, a = hAt(i, j), b = hAt(i + 1, j), c = hAt(i, j + 1), d = hAt(i + 1, j + 1);
  return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz;
}

// ---- the track's surface: the land, a few centimetres of sprung floor, the bank of the heavy bend and its grass shoulder
const SURF = 0.06;
const bankT = (th) => smoothstep(0, 0.55, th) * smoothstep(0, 0.55, Math.PI - th);
// where a point is on the oval: { part: 'heavy' | 'light' | 'back' | 'home', r (distance from the bend centre or the line
// of the straight's inner kerb, measured outward from the oval's middle), th (bend angle, 0 at the spinward side) }
const W = { part: '', r: 0, th: 0 };
export function where(x, z) {
  const dx = x - T.X;
  if (z > T.ZH) { W.part = 'heavy'; W.r = Math.hypot(dx, z - T.ZH); W.th = Math.atan2(z - T.ZH, dx); }
  else if (z < T.ZL) { W.part = 'light'; W.r = Math.hypot(dx, z - T.ZL); W.th = Math.atan2(z - T.ZL, dx); }
  else { W.part = dx > 0 ? 'back' : 'home'; W.r = Math.abs(dx); W.th = 0; }
  return W;
}
// the bank: rises across the lanes to BANK at the outer edge, faded in over the first and last half radian of the bend
export function bankAt(x, z) {
  if (z <= T.ZH) return 0;
  const dx = x - T.X, dz = z - T.ZH, r = Math.hypot(dx, dz), th = Math.atan2(dz, dx);
  const k = bankT(th); if (k <= 0) return 0;
  if (r <= T.RE) return T.BANK * k * clamp((r - T.RI) / (T.RE - T.RI), 0, 1);
  // the grass shoulder behind the bank, down at one in two
  return Math.max(0, T.BANK * k - (r - T.RE) * 0.45);
}
export function trackY(x, z) { return groundY(x, z) + SURF + bankAt(x, z); }
// the ground under a thing that stands beside the track: the land, or the shoulder where it is higher
export function standY(x, z) { const b = bankAt(x, z); return b > 0 ? groundY(x, z) + SURF + b : groundY(x, z); }
// arc-length position round lane 1 from the finish line, in the running direction (heavy bend first): 0 .. 400
export function lapS(x, z) {
  const w = where(x, z), R = T.R1, HS2 = 2 * T.HS;
  if (w.part === 'heavy') return (Math.PI - clamp(w.th, 0, Math.PI)) * R;
  if (w.part === 'back') return Math.PI * R + (T.ZH - z);
  if (w.part === 'light') return Math.PI * R + HS2 + clamp(-w.th, 0, Math.PI) * R;
  return 2 * Math.PI * R + HS2 + (z - T.ZL);
}
export const LAP = 2 * Math.PI * T.R1 + 4 * T.HS;
// a point on the oval at distance r out from the middle line (r measured as in where()) and position s along lane 1
export function ovalPoint(s, r) {
  const R = T.R1, a = Math.PI * R, HS2 = 2 * T.HS;
  s = ((s % LAP) + LAP) % LAP;
  if (s < a) { const th = Math.PI - s / R; return [T.X + Math.cos(th) * r, T.ZH + Math.sin(th) * r]; }
  if (s < a + HS2) return [T.X + r, T.ZH - (s - a)];
  if (s < 2 * a + HS2) { const th = -(s - a - HS2) / R; return [T.X + Math.cos(th) * r, T.ZL + Math.sin(th) * r]; }
  return [T.X - r, T.ZL + (s - 2 * a - HS2)];
}

// ---- drawing helpers (call with an identity transform: they write vertices directly)
const nrm = (yFn, x, z) => {
  const e = 0.4, dx = (yFn(x + e, z) - yFn(x - e, z)) / (2 * e), dz = (yFn(x, z + e) - yFn(x, z - e)) / (2 * e);
  const l = Math.hypot(dx, 1, dz); return [-dx / l, 1 / l, -dz / l];
};
// A draped strip between two polylines L and R (lists of [x, z]), its height yFn(x, z) + off, facing up. o.tints: one tint
// per row (optional), for wear that comes and goes along the strip.
export function strip(g, L, R, yFn, off = 0, o = {}) {
  const base = g.buf.nv, n = L.length;
  for (let i = 0; i < n; i++) {
    if (o.tints) g.tint(o.tints[i]);
    for (const p of [L[i], R[i]]) { const N = nrm(yFn, p[0], p[1]); g.v(p[0], yFn(p[0], p[1]) + off, p[1], N[0], N[1], N[2], p[0], p[1]); }
  }
  for (let i = 0; i < n - 1; i++) {
    const a = base + i * 2, b = a + 1, c = a + 3, d = a + 2;
    const ux = R[i][0] - L[i][0], uz = R[i][1] - L[i][1], vx = L[i + 1][0] - L[i][0], vz = L[i + 1][1] - L[i][1];
    if (uz * vx - ux * vz > 0) g.quadI(a, b, c, d); else g.quadI(a, d, c, b);
  }
}
// A flat-ish quad lying on the surface yFn: four corners [x, z] in any order round it; faces up.
export function patch(g, pts, yFn, off = 0) {
  const ys = pts.map((p) => yFn(p[0], p[1]) + off);
  const ux = pts[1][0] - pts[0][0], uz = pts[1][1] - pts[0][1], vx = pts[3][0] - pts[0][0], vz = pts[3][1] - pts[0][1];
  const q = pts.map((p, i) => [p[0], ys[i], p[1]]);
  if (uz * vx - ux * vz > 0) g.quad(q[0], q[1], q[2], q[3]); else g.quad(q[0], q[3], q[2], q[1]);
}
// A painted line from a to b ([x, z]) of width w on the surface yFn, cut into pieces of at most `step` metres.
export function paintLine(g, a, b, w, yFn, off = 0.012, step = 2) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / step));
  const nx = -(b[1] - a[1]) / L * w / 2, nz = (b[0] - a[0]) / L * w / 2;
  const Lp = [], Rp = [];
  for (let i = 0; i <= n; i++) { const t = i / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; Lp.push([x - nx, z - nz]); Rp.push([x + nx, z + nz]); }
  strip(g, Lp, Rp, yFn, off);
}
// A painted arc round (cx, cz) of radius r from angle a0 to a1 (radians, 0 = +x), width w.
export function paintArc(g, cx, cz, r, a0, a1, w, yFn, off = 0.012) {
  const n = Math.max(3, Math.ceil(Math.abs(a1 - a0) * r / 1.2)), Lp = [], Rp = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n, c = Math.cos(a), s = Math.sin(a); Lp.push([cx + c * (r - w / 2), cz + s * (r - w / 2)]); Rp.push([cx + c * (r + w / 2), cz + s * (r + w / 2)]); }
  strip(g, Lp, Rp, yFn, off);
}

// ---- a stroke font for digits painted on the ground. The digit's "up" points along (ux, uz); h is its height.
const SEG = { a: [[0, 1], [1, 1]], b: [[1, 1], [1, 0.5]], c: [[1, 0.5], [1, 0]], d: [[0, 0], [1, 0]], e: [[0, 0.5], [0, 0]], f: [[0, 1], [0, 0.5]], g: [[0, 0.5], [1, 0.5]] };
const DIG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abfgcd' };
export function paintDigits(g, text, cx, cz, ux, uz, h, yFn, off = 0.014) {
  const rx = -uz, rz = ux;                                   // the digit's "right" (looking along up, right hand)
  const w = h * 0.55, gap = h * 0.3, lw = h * 0.13, n = String(text).length, tot = n * w + (n - 1) * gap;
  for (let k = 0; k < n; k++) {
    const segs = DIG[String(text)[k]] || '';
    const x0 = -tot / 2 + k * (w + gap);
    for (const sname of segs) {
      const s = SEG[sname];
      const P = (q) => { const lx = x0 + q[0] * w, ly = (q[1] - 0.5) * h; return [cx + rx * lx + ux * ly, cz + rz * lx + uz * ly]; };
      paintLine(g, P(s[0]), P(s[1]), lw, yFn, off, 4);
    }
  }
}

// ---- props
// A spinball hoop: a ring of painted steel, its plane facing +z, with a socket below. p: { r, col, socket }
defineProp('lmhg.hoop', (g, p) => {
  const r = p.r || 0.42, pts = [];
  for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; pts.push([Math.cos(a) * r, Math.sin(a) * r, 0]); }
  g.mat('paint', p.col || C.saffron, { rough: -0.1 }); g.tube(pts, 0.03, { segs: 6, closed: true });
  g.mat('cast', C.iron); g.box(-0.04, -r - 0.12, -0.04, 0.04, -r + 0.02, 0.04, { bevel: 0.01 });
  // a short net sock of cord, hung behind the ring
  g.mat('grille', '#e8dcc0');
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, b = (i + 1) / 12 * Math.PI * 2; g.quad([Math.cos(a) * r, Math.sin(a) * r, -0.02], [Math.cos(b) * r, Math.sin(b) * r, -0.02], [Math.cos(b) * r * 0.7, Math.sin(b) * r * 0.7 - 0.06, -0.22], [Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7 - 0.06, -0.22], { double: true }); }
  return { cast: true, tier: 's' };
});
// A spinball: panels in two colours. p: { a, b }
defineProp('lmhg.ball', (g, p) => {
  g.mat('speckle', p.a || C.verm, { rough: 0.1 }); g.ball(0, 0.11, 0, 0.11, 0.11, 0.11, { segs: 12, rings: 8 });
  g.mat('weave', p.b || C.cream); g.ball(0, 0.11, 0, 0.1125, 0.032, 0.1125, { segs: 12, rings: 3 });
  return { cast: true };
});
// A tall lamp post for the grounds: a painted column, a crossarm and a lantern head under a hat. p: { h, col, band }
defineProp('lmhg.post', (g, p) => {
  const h = p.h || 5.2, col = p.col || C.teal;
  g.mat('paint', col, { rough: -0.1 }); g.lathe(0, 0, [[0.13, 0], [0.12, 0.1], [0.08, 0.3], [0.06, h - 0.5], [0.075, h - 0.4]], { segs: 8 });
  g.mat('paint', p.band || C.saffron); for (const yy of [1.1, 2.4]) g.cyl(0, yy, 0, 0.072, 0.14, { segs: 8 });
  g.mat('cast', C.brass); g.lathe(0, 0, [[0.08, h - 0.42], [0.11, h - 0.38], [0.09, h - 0.3], [0.06, h - 0.25]], { segs: 8 });
  // the head: a cage of four bars round a glass, under a hat
  g.mat('cast', C.dark); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; g.tube([[Math.cos(a) * 0.14, h - 0.25, Math.sin(a) * 0.14], [Math.cos(a) * 0.17, h + 0.25, Math.sin(a) * 0.17]], 0.012, { segs: 4 }); }
  g.lathe(0, 0, [[0.2, h + 0.25], [0.3, h + 0.27], [0.12, h + 0.42], [0.03, h + 0.5], [0, h + 0.52]], { segs: 10 });
  g.mat('cast', C.dark); g.box(-0.55, h - 0.75, -0.02, 0.55, h - 0.71, 0.02);
  for (const sx of [-1, 1]) g.tube([[sx * 0.53, h - 0.73, 0], [sx * 0.53, h - 0.86, 0]], 0.008, { segs: 3 });
  return { posts: [[0, 0, 0.13, 0, h]], tier: 's' };
});
// the glass of the lamp post's head, lit: drawn separately so it can glow (emissive) without the post
export function postGlass(g, x, y, z, h, glow = 5) {
  g.mat('diffuser', '#ffe2b0', { emissive: glow, night: true });
  g.lathe(x, z, [[0.06, y + h - 0.24], [0.14, y + h - 0.14], [0.15, y + h + 0.1], [0.1, y + h + 0.24], [0, y + h + 0.25]], { segs: 10 });
}
// A shoe on the loan rack (a running shoe, mended). p: { a, b }
defineProp('lmhg.shoe', (g, p) => {
  g.mat('weave', p.a || C.teal); g.box(-0.045, 0.02, -0.13, 0.045, 0.08, 0.1, { bevel: 0.03 });
  g.mat('speckle', '#3a3330'); g.box(-0.05, 0, -0.14, 0.05, 0.025, 0.12, { bevel: 0.01 });
  g.mat('weave', p.b || C.saffron); g.box(-0.046, 0.04, 0.02, 0.046, 0.075, 0.06, { faces: 'xX' });
  return { cast: false };
});

// the names of a few real blocks of Chervil: the ones whose lift cores come up round the grounds, and the ones under them
export function blockNames(game) {
  const out = [];
  try {
    const city = game.city, pav = city && city.pavilions;
    if (city && city.info) {
      const pts = [[-680, 2430], [-850, 2430], [-680, 2260], [-510, 2430], [-850, 2600], [-510, 2260], [-680, 2600], [-1020, 2430]];
      for (const [x, z] of pts) { const c = pav && pav.cellUnder ? pav.cellUnder(x, z) : null; if (!c) continue; const n = city.info(c).name; if (n && out.indexOf(n) < 0) out.push(n); }
      for (const c of [{ L: 0, i: 3, j: 11 }, { L: 12, i: 20, j: 11 }, { L: 30, i: 7, j: 12 }, { L: 44, i: 33, j: 10 }]) { try { const n = city.info(c).name; if (n && out.indexOf(n) < 0) out.push(n); } catch (e) { /* skip */ } }
    }
  } catch (e) { /* no city */ }
  const spare = ['Saltcellar', 'Brine Yard', 'Long Spoon', 'Steamwell', 'Pickle Row', 'Hob End', 'Crust Lane', 'Colander'];
  for (const n of spare) { if (out.length >= 8) break; if (out.indexOf(n) < 0) out.push(n); }
  return out.slice(0, 8);
}
