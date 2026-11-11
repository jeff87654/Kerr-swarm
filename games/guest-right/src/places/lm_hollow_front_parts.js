// The front wood's shared parts: where the Long Lamps run and how high, the trees the land has already planted there,
// small drawing helpers for sloped strips over rolling ground, and the props people made for the walk, the Bowl, the
// Halfway Urn, the Fern Cellar and the wood. Everything is in the Hollow's frame (x spinward, z the drum's own z).
import { defineProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { heightAt, treeInCell, TREE_CELL } from '../world/land.js';
import { Rng, hashStr } from '../core/util.js';

// ---- the plan ----
// The walk runs from the Bowl at the foot of the front wall (z 26) out to where the light starts to fail (z 722).
// It is straight, a hair off the axis (5.5 m over 660 m), because that line has the fewest birches standing in it.
export const HF = {
  Z0: 24, Z1: 722, HW: 4, KERB: 0.24, BAY: 12, LAMP0: 32, LAMPN: 58,
  BOWL: { x: 154.6, z: 13.4, r: 11.5 },
  URN: { x0: 162.1, x1: 171.6, z0: 368.5, z1: 381.5 },
  CELLAR: { x0: 114, x1: 146, z0: 300, z1: 334, rim: 1.8 },
  // where the kerb opens (side -1 anti, +1 spinward): the Urn's bay, the wood's three paths, the Cellar's ramp
  GAPS: [{ side: 1, z0: 368.9, z1: 381.1 }, { side: 1, z0: 350.9, z1: 353.3 }, { side: 1, z0: 383.4, z1: 385.8 }, { side: 1, z0: 468.8, z1: 471.2 }, { side: -1, z0: 315.6, z1: 318.8 }],
};
export function walkX(z) { return 155 + 5.5 * (z - 60) / 660; }
export const lampZ = (k) => HF.LAMP0 + HF.BAY * k;

// The walk's surface: nodes every 2 m at the highest ground across its width, eased so it reads as one long gentle grade.
export function makeWalk(bowlY) {
  const step = 2, n = Math.round((HF.Z1 - HF.Z0) / step), raw = new Float32Array(n + 1);
  for (let i = 0; i <= n; i++) {
    const z = HF.Z0 + i * step, cx = walkX(z); let m = -9;
    for (let dz = -1.5; dz <= 1.51; dz += 1.5) for (let dx = -HF.HW - 0.5; dx <= HF.HW + 0.51; dx += 1.1) m = Math.max(m, heightAt(cx + dx, z + dz));
    raw[i] = m;
  }
  const dil = new Float32Array(n + 1), ys = new Float32Array(n + 1);
  for (let i = 0; i <= n; i++) { let m = -9; for (let k = -2; k <= 2; k++) m = Math.max(m, raw[Math.max(0, Math.min(n, i + k))]); dil[i] = m; }
  for (let i = 0; i <= n; i++) { let a = 0, c = 0; for (let k = -4; k <= 4; k++) { a += dil[Math.max(0, Math.min(n, i + k))]; c++; } ys[i] = Math.max(raw[i], a / c) + 0.06; }
  // the first sixteen metres ease from the Bowl's floor onto the walk
  if (bowlY !== undefined) for (let i = 0; i <= n; i++) { const z = HF.Z0 + i * step; if (z > 40) break; const t = Math.max(0, (z - 26) / 14); ys[i] = Math.max(raw[i] + 0.06, bowlY + (ys[i] - bowlY) * t * t * (3 - 2 * t)); }
  const Y = (z) => { const t = (z - HF.Z0) / step; const i = Math.max(0, Math.min(n - 1, Math.floor(t))); const f = Math.max(0, Math.min(1, t - i)); return ys[i] + (ys[i + 1] - ys[i]) * f; };
  return { n, step, ys, Y };
}

// The trees the land plants (the same function the land draws them with), in a box: { x, z, sp (2 birch, 3 bamboo), s, r (trunk) }
export function treesIn(x0, z0, x1, z1) {
  const out = [];
  for (let iz = Math.floor(z0 / TREE_CELL) - 1; iz <= Math.ceil(z1 / TREE_CELL) + 1; iz++) for (let ix = Math.floor(x0 / TREE_CELL) - 1; ix <= Math.ceil(x1 / TREE_CELL) + 1; ix++) {
    const t = treeInCell(ix, iz, TREE_CELL); if (!t || t.x < x0 || t.x > x1 || t.z < z0 || t.z > z1) continue;
    out.push({ x: t.x, z: t.z, sp: t.sp, s: t.s, r: t.sp === 3 ? 0.5 * t.s + 0.1 : 0.14 * t.s });
  }
  return out;
}
export const nearTree = (trees, x, z, d) => trees.some((t) => Math.hypot(t.x - x, t.z - z) < d + t.r);
// the trees standing in the walk itself (each gets a ring of stone)
export function walkTrees(trees) { return trees.filter((t) => t.z > HF.Z0 + 14 && t.z < HF.Z1 + 0.5 && Math.abs(t.x - walkX(t.z)) < HF.HW + 0.45); }
export const ringR = (t) => t.sp === 3 ? 0.5 * t.s + 0.55 : 0.72 + 0.08 * t.s;
// the walkways down the walk (offset 0 and +-2.7 from the middle) bend round the tree rings; side paths join them at these z
export const JOINS = [[-2.7, 317.2], [2.7, 375], [2.7, 352], [2.7, 384.6], [2.7, 470]];
export function lanePoint(walk, inWalk, off, z) {
  let x = walkX(z) + off;
  for (const t of inWalk) { const R = ringR(t) + 0.9; if (Math.abs(t.z - z) < R + 1.5 && Math.abs(t.x - x) < R) x = t.x + (x >= t.x ? 1 : -1) * R; }
  x = Math.max(walkX(z) - HF.HW + 0.5, Math.min(walkX(z) + HF.HW - 0.5, x));
  return [x, walk.Y(z), z];
}

// ---- drawing helpers ----
// A strip lying over the ground, its top sloping along z: at za it spans [xa0, xa1] at height ya, at zb [xb0, xb1] at yb.
// The uv runs on in metres so long runs of gravel do not show a seam every segment.
export function hstrip(g, xa0, xa1, za, ya, xb0, xb1, zb, yb) {
  const T = g._tile || 1;
  g.quad([xb0, yb, zb], [xb1, yb, zb], [xa1, ya, za], [xa0, ya, za], { uv: [xb0 / T, zb / T, xb1 / T, za / T] });
}
// A vertical face along z at x, from yBottom to the sloping top (ya at za, yb at zb). face: -1 looks toward -x, +1 toward +x.
export function vstrip(g, x, za, zb, ya, yb, y0a, y0b, face) {
  const T = g._tile || 1;
  if (face < 0) g.quad([x, y0a, za], [x, y0b, zb], [x, yb, zb], [x, ya, za], { uv: [za / T, y0a / T, zb / T, ya / T] });
  else g.quad([x, y0b, zb], [x, y0a, za], [x, ya, za], [x, yb, zb], { uv: [zb / T, y0b / T, za / T, yb / T] });
}
// a regular polygon's corners round (cx, cz), counter-clockwise, first corner at angle a0
export function ngon(cx, cz, r, n, a0 = 0) { const o = []; for (let i = 0; i < n; i++) { const a = a0 + i * Math.PI * 2 / n; o.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } return o; }
// draw at (x, y, z) turned by yaw (front toward +z)
export const atYaw = (g, x, y, z, yaw, fn) => { g.at(x, y, z, yaw); fn(g); g.pop(); };
export const rotP = (x, z, yaw, lx, lz) => [x + Math.cos(yaw) * lx + Math.sin(yaw) * lz, z - Math.sin(yaw) * lx + Math.cos(yaw) * lz];

// Globes that must read as lit at midday, when the sunline outshines a lamp tuned for the evening: a brighter shell over
// each, kept in two scopes that show only while the line is up (the faint one from early dawn, the bright one by day).
export function makeDayGlow(game, f) {
  const a = game.world.scope('hf-glow-a', f), b = game.world.scope('hf-glow-b', f);
  a.every((dt, gm) => { const sun = gm.clock && gm.clock.sun ? gm.clock.sun() : 0; a.visible = sun > 0.06; b.visible = sun > 0.35; });
  return {
    add(x, y, z, rx, ry, em) {
      a.structure((g) => { g.mat('diffuser', '#ffcf8a', { emissive: em * 0.6 }); g.ball(x, y, z, rx + 0.008, ry + 0.008, rx + 0.008, { segs: 7, rings: 4 }); });
      b.structure((g) => { g.mat('diffuser', '#ffc982', { emissive: em }); g.ball(x, y, z, rx + 0.016, ry + 0.016, rx + 0.016, { segs: 7, rings: 4 }); });
    },
    finish() { a.finish(); b.finish(); },
  };
}

// A string of small paper lanterns between two points (the festival's, lit at night). o: { n, sag, cols, offset }
export const LANTERN_COLS = ['#d9472b', '#e7b547', '#2f8f8a', '#efe6d2', '#b8336a', '#f08a3a', '#3b4a8f', '#6b9f3e'];
export function lanternLine(s, a, b, o = {}) {
  const g = s.g, len = Math.hypot(b[0] - a[0], b[2] - a[2]), n = o.n || Math.max(3, Math.round(len / 2)), sag = o.sag === undefined ? len * 0.06 : o.sag, cols = o.cols || LANTERN_COLS;
  const P = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t];
  const line = []; for (let i = 0; i <= 8; i++) line.push(P(i / 8));
  g.mat('weave', '#3a332c'); g.tube(line, 0.007, { segs: 3, caps: false });
  for (let i = 0; i < n; i++) {
    const p = P((i + 0.5) / n), c = cols[(i + (o.offset || 0)) % cols.length], r = 0.12, hh = 0.2, y = p[1] - 0.08 - hh / 2;
    g.mat('paper', c, { emissive: 2.6, night: true });
    g.lathe(p[0], p[2], [[r * 0.35, y - hh / 2], [r, y - hh * 0.2], [r, y + hh * 0.2], [r * 0.35, y + hh / 2]], { segs: 6 });
  }
  return s.draw(() => {}, { tier: 's', cast: false });
}

// A signpost standing at height y (the kit's Hollow one stands on the ground; these stand on the Bowl's floor too).
// arms: [{ dir: 'x' | 'X' | 'z' | 'Z', text, sub, col }]
export function fingerPost(s, x, y, z, arms, o = {}) {
  const g = s.g, H = o.h || 2.8;
  g.mat('wood', o.post || '#3c3026'); g.box(x - 0.065, y - 0.25, z - 0.065, x + 0.065, y + H, z + 0.065, { bevel: 0.015 });
  g.mat('cast', '#b08a45'); g.lathe(x, z, [[0.0, y + H], [0.085, y + H], [0.095, y + H + 0.04], [0.05, y + H + 0.1], [0, y + H + 0.16]], { segs: 8 });
  s.flush({ tier: 's', cast: true });
  s.post(x, z, 0.09, y, y + H);
  arms.forEach((a, i) => {
    const yy = y + H - 0.34 - i * 0.3, L = 1.1, ax = a.dir === 'X' ? 1 : a.dir === 'x' ? -1 : 0, az = a.dir === 'Z' ? 1 : a.dir === 'z' ? -1 : 0;
    const cx = x + ax * (0.1 + L / 2), cz = z + az * (0.1 + L / 2), bc = a.col || '#efe6d2';
    g.mat('paint', bc);
    const tip = (t, d, axis, c0, c1) => { const tri = [[t, yy - 0.11], [t + d * 0.16, yy], [t, yy + 0.11]]; g.extrude(tri, c0, c1, axis); g.extrude(tri.slice().reverse(), c0, c1, axis); };
    if (ax) { g.box(Math.min(cx - ax * L / 2, cx + ax * (L / 2 - 0.12)), yy - 0.11, cz - 0.02, Math.max(cx - ax * L / 2, cx + ax * (L / 2 - 0.12)), yy + 0.11, cz + 0.02, { bevel: 0.006 }); tip(cx + ax * (L / 2 - 0.12), ax, 'z', cz - 0.02, cz + 0.02); }
    else { g.box(cx - 0.02, yy - 0.11, Math.min(cz - az * L / 2, cz + az * (L / 2 - 0.12)), cx + 0.02, yy + 0.11, Math.max(cz - az * L / 2, cz + az * (L / 2 - 0.12))); tip(cz + az * (L / 2 - 0.12), az, 'x', cx - 0.02, cx + 0.02); }
    s.flush({ tier: 'd', cast: true });
    const spec = { kind: 'street', text: a.text, sub: a.sub || '', palette: [bc, '#2b2a26', '#9a3a2a'] };
    if (ax) sign(s, spec, cx - ax * 0.06, yy, cz, { face: 'Z', w: L - 0.22, h: 0.2, double: true, board: false, thick: 0.045 });
    else sign(s, spec, cx, yy, cz - az * 0.06, { face: 'X', w: L - 0.22, h: 0.2, double: true, board: false, thick: 0.045 });
  });
}

// A small plate on a short iron stand, its face toward `face`. Returns the plate's centre.
export function plateStand(s, x, y, z, face, spec, o = {}) {
  const g = s.g, h = o.h || 1.0, w = o.w || 0.5, hh = o.hh || 0.3;
  const nx = face === 'X' ? 1 : face === 'x' ? -1 : 0, nz = face === 'Z' ? 1 : face === 'z' ? -1 : 0;
  g.mat('cast', o.col || '#22392f'); g.box(x - 0.03, y - 0.2, z - 0.03, x + 0.03, y + h - 0.05, z + 0.03, { bevel: 0.008 });
  // a sloped lectern head
  if (nz) g.box(x - w / 2 - 0.03, y + h - 0.08, z - 0.05, x + w / 2 + 0.03, y + h + hh, z + 0.0 * nz, { bevel: 0.008 });
  else g.box(x - 0.05, y + h - 0.08, z - w / 2 - 0.03, x + 0.0, y + h + hh, z + w / 2 + 0.03, { bevel: 0.008 });
  s.flush({ tier: 'd', cast: true });
  sign(s, spec, x + nx * 0.004, y + h + hh / 2 - 0.04, z + nz * 0.004, { face, w, h: hh - 0.04, board: false });
  s.post(x, z, 0.05, y, y + h);
  return [x + nx * 0.5, z + nz * 0.5];
}

// ---------------------------------------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------------------------------------

// The walk's lamp post: cast iron painted bottle green, a brass collar, a ladder bar and scrolls; the globe is drawn by
// the place so each can burn a little brighter toward the wall. p: { h }
defineProp('lm-hollow-front.post', (g, p) => {
  const h = p.h || 4.3, iron = '#22392f';
  g.mat('cast', iron);
  g.lathe(0, 0, [[0.19, 0], [0.19, 0.1], [0.14, 0.18], [0.13, 0.42], [0.07, 0.62], [0.048, h - 0.5], [0.064, h - 0.42], [0.044, h - 0.32], [0.042, h - 0.14], [0.1, h]], { segs: 6 });
  g.mat('cast', '#b08a45'); g.lathe(0, 0, [[0.074, 0.6], [0.082, 0.65], [0.066, 0.7]], { segs: 6, capBottom: false, capTop: false });
  g.mat('cast', iron); g.box(-0.42, h - 0.66, -0.022, 0.42, h - 0.6, 0.022, { bevel: 0.008 });
  for (const sx of [-1, 1]) {
    g.tube([[sx * 0.05, h - 1.05, 0], [sx * 0.2, h - 0.95, 0], [sx * 0.33, h - 0.78, 0], [sx * 0.4, h - 0.64, 0]], 0.013, { segs: 4 });
    g.ball(sx * 0.42, h - 0.63, 0, 0.03, 0.03, 0.03, { segs: 6, rings: 4 });
  }
  // the cup the globe sits in
  g.mat('cast', '#b08a45'); g.lathe(0, 0, [[0.05, h], [0.14, h + 0.08], [0.12, h + 0.11]], { segs: 6 });
  return { posts: [[0, 0, 0.17, 0, h]], tier: 's' };
});

// A round iron table for the Urn. p: { top }
defineProp('lm-hollow-front.cafetable', (g, p) => {
  g.mat('cast', '#22392f'); g.lathe(0, 0, [[0.24, 0], [0.22, 0.03], [0.05, 0.07], [0.035, 0.68], [0.08, 0.71]], { segs: 10 });
  g.mat('glaze', p.top || '#2f6f73', { rough: -0.2 }); g.lathe(0, 0, [[0, 0.71], [0.36, 0.71], [0.37, 0.735], [0, 0.74]], { segs: 18 });
  g.mat('cast', '#b08a45'); g.lathe(0, 0, [[0.37, 0.715], [0.375, 0.735]], { segs: 18, capBottom: false, capTop: false });
  return { posts: [[0, 0, 0.3, 0, 0.74]], tier: 'd' };
});

// The Halfway Urn: an octagonal tea kiosk with a hatch on its front (+z), a vermilion fascia and a copper-green roof.
defineProp('lm-hollow-front.kiosk', (g) => {
  const oct = (r) => ngon(0, 0, r, 8, Math.PI / 8);
  g.mat('stone', '#b7ad99'); g.prism(oct(1.78), -0.3, 0.18);
  g.mat('panel', '#2b6a6c'); g.prism(oct(1.5), 0.18, 1.0);
  g.mat('paint', '#efe4cc'); g.prism(oct(1.53), 0.18, 0.26); g.prism(oct(1.53), 0.92, 1.0);
  g.mat('wood', '#8a5a33', { rough: -0.1 }); g.prism(oct(1.66), 1.0, 1.06);
  const C = oct(1.47);
  // corner posts, and the upper panels on all but the three front faces (those are the hatch)
  g.mat('cast', '#22392f'); for (const [x, z] of C) g.tube([[x, 1.06, z], [x, 2.32, z]], 0.035, { segs: 5 });
  for (let i = 0; i < 8; i++) {
    const a = C[i], b = C[(i + 1) % 8], mz = (a[1] + b[1]) / 2;
    if (mz > 0.6) continue;                                      // the front faces stay open
    g.mat('paint', '#efe4cc'); g.quad([b[0], 1.06, b[1]], [a[0], 1.06, a[1]], [a[0], 2.32, a[1]], [b[0], 2.32, b[1]], { double: true });
    g.mat('paint', '#2b6a6c'); g.quad([b[0] * 1.01, 1.5, b[1] * 1.01], [a[0] * 1.01, 1.5, a[1] * 1.01], [a[0] * 1.01, 1.56, a[1] * 1.01], [b[0] * 1.01, 1.56, b[1] * 1.01]);
  }
  // the propped shutter over the hatch
  g.mat('panel', '#2b6a6c'); g.quad([-1.1, 2.3, 1.42], [1.1, 2.3, 1.42], [1.1, 2.1, 2.05], [-1.1, 2.1, 2.05], { double: true });
  g.mat('cast', '#22392f'); for (const sx of [-1, 1]) g.tube([[sx * 1.0, 1.08, 1.5], [sx * 1.0, 2.12, 2.03]], 0.012, { segs: 4 });
  // fascia, eaves and roof
  g.mat('paint', '#c4472c'); g.prism(oct(1.62), 2.32, 2.58);
  g.mat('cast', '#b08a45'); g.prism(oct(1.64), 2.42, 2.45);
  g.push(); g.rotY(Math.PI / 8);
  g.mat('cast', '#5f8f7a', { rough: 0.1 }); g.lathe(0, 0, [[1.98, 2.56], [1.92, 2.64], [1.2, 3.0], [0.5, 3.42], [0.12, 3.62], [0, 3.64]], { segs: 8 });
  g.mat('cast', '#b08a45'); g.lathe(0, 0, [[0.09, 3.6], [0.06, 3.75], [0.11, 3.86], [0.04, 4.05], [0, 4.1]], { segs: 8 });
  g.pop();
  g.mat('paint', '#efe4cc'); g.lathe(0, 0, [[1.55, 2.32], [0, 2.32]], { segs: 8, capTop: false, capBottom: false });
  // inside: the back shelf of cups, a lidded tin
  g.mat('wood', '#6b4a2f'); g.box(-0.9, 1.3, -1.32, 0.9, 1.34, -1.08); g.box(-0.9, 1.7, -1.32, 0.9, 1.74, -1.08);
  const cc = ['#e9e1cf', '#2f6f73', '#c9552e', '#e7b547', '#e9e1cf', '#3b4a8f'];
  for (let i = 0; i < 9; i++) { g.mat('glaze', cc[i % cc.length]); g.lathe(-0.8 + i * 0.2, -1.2, [[0, 1.34], [0.035, 1.34], [0.042, 1.43], [0.04, 1.45], [0, 1.46]], { segs: 8 }); }
  for (let i = 0; i < 5; i++) { g.mat('cast', ['#9a6a3a', '#b08a45', '#5a7f86'][i % 3]); g.lathe(-0.7 + i * 0.35, -1.2, [[0, 1.74], [0.08, 1.74], [0.08, 1.92], [0.06, 1.95], [0, 1.95]], { segs: 8 }); }
  return { solid: [[-1.55, 0, -1.55, 1.55, 2.3, 1.45]], tier: 's', spots: [{ type: 'counter', x: 0, y: 0.18, z: 0.6, yaw: 0, tags: ['tea', 'kiosk', 'urn'] }, { type: 'queue', x: 0.3, y: 0, z: 2.3, yaw: Math.PI, tags: ['tea', 'kiosk'] }, { type: 'customer', x: -0.4, y: 0, z: 2.0, yaw: Math.PI, tags: ['tea'] }] };
});

// A stone bowl on a pedestal, full to the lip, with a bronze spout whose water climbs, hangs and falls a little anti.
defineProp('lm-hollow-front.bowl', (g) => {
  g.mat('stone', '#c2b8a4');
  g.lathe(0, 0, [[0.62, 0], [0.62, 0.12], [0.5, 0.18], [0.38, 0.25], [0.34, 0.5], [0.42, 0.56], [1.5, 0.66], [1.86, 0.78], [1.94, 0.9], [1.88, 0.95], [1.78, 0.93], [1.6, 0.86], [0.3, 0.74], [0, 0.73]], { segs: 28 });
  g.mat('stone', '#8f8674'); g.lathe(0, 0, [[1.945, 0.88], [1.95, 0.92], [1.9, 0.955]], { segs: 28, capBottom: false, capTop: false });
  g.mat('plain', '#2f5a63', { rough: -0.45 }); g.lathe(0, 0, [[1.8, 0.87], [0, 0.87]], { segs: 28, capBottom: false, capTop: false });
  // the spout: a bronze stem, a cup
  g.mat('cast', '#7a5a32'); g.lathe(0, 0, [[0.12, 0.86], [0.08, 0.95], [0.05, 1.2], [0.07, 1.26], [0.11, 1.3], [0.06, 1.32]], { segs: 10 });
  // the water: up a metre, a slow crown, eight arcs landing a few centimetres anti of their mirror
  g.mat('plain', '#d6eef2', { rough: -0.4, emissive: 0.15 });
  g.tube([[0, 1.3, 0], [0, 1.9, 0], [0, 2.25, 0]], [0.022, 0.018, 0.01], { segs: 5 });
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4, pts = [];
    for (let i = 0; i <= 6; i++) { const t = i / 6, r = 0.02 + t * 0.95, y = 2.22 + 0.12 * Math.sin(t * Math.PI * 0.6) - t * t * 1.36; pts.push([Math.cos(a) * r - t * t * 0.04, y, Math.sin(a) * r]); }
    g.tube(pts, [0.012, 0.011, 0.01, 0.009, 0.008, 0.008, 0.01], { segs: 3, caps: false });
  }
  // rings on the water where the arcs come down
  g.mat('plain', '#bfe0e6', { rough: -0.4 }); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.lathe(Math.cos(a) * 0.97 - 0.04, Math.sin(a) * 0.97, [[0.07, 0.873], [0.05, 0.873]], { segs: 8, capBottom: false, capTop: false }); }
  return { posts: [[0, 0, 1.95, 0, 0.95]], tier: 's' };
});

// A rack of hand lamps on hooks, under a little roof. p: { n }
defineProp('lm-hollow-front.lamprack', (g, p) => {
  const n = p.n || 6, w = n * 0.32 + 0.3;
  g.mat('wood', '#4a3426'); for (const sx of [-1, 1]) g.box(sx * w / 2 - 0.05, 0, -0.05, sx * w / 2 + 0.05, 1.95, 0.05, { bevel: 0.01 });
  g.box(-w / 2 - 0.05, 1.5, -0.04, w / 2 + 0.05, 1.58, 0.04, { bevel: 0.008 });
  g.mat('wood', '#7a2a2a'); g.box(-w / 2 - 0.15, 1.95, -0.25, w / 2 + 0.15, 2.0, 0.22, { bevel: 0.01 });
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.3 + i * 0.32, hang = i !== 2 && i !== 4;
    g.mat('cast', '#b08a45'); g.tube([[x, 1.5, 0.04], [x, 1.5, 0.1], [x, 1.46, 0.12]], 0.007, { segs: 3 });
    if (!hang) continue;
    // a hand lamp: a brass frame round a frosted globe, a ring to carry it by
    g.mat('cast', '#b08a45'); g.tube([[x, 1.45, 0.12], [x, 1.4, 0.12]], 0.005, { segs: 3 }); g.lathe(x, 0.12, [[0.045, 1.38], [0.06, 1.36], [0.03, 1.34]], { segs: 6 });
    g.mat('diffuser', '#f1e2c4'); g.lathe(x, 0.12, [[0.03, 1.34], [0.06, 1.3], [0.065, 1.22], [0.05, 1.18]], { segs: 8 });
    g.mat('cast', '#b08a45'); g.lathe(x, 0.12, [[0.06, 1.18], [0.065, 1.16], [0, 1.15]], { segs: 8 });
  }
  return { solid: [[-w / 2 - 0.08, 0, -0.08, w / 2 + 0.08, 1.95, 0.08]], tier: 'd' };
});

// A half-log seat, bark on and the top planed flat; people sit facing +z. p: { len }
defineProp('lm-hollow-front.log', (g, p) => {
  const L = p.len || 2.4, r = 0.21;
  g.mat('bark', '#ffffff'); g.tube([[-L / 2, r, 0], [L / 2, r, 0]], r, { segs: 9, caps: false });
  g.mat('wood', '#d2b285'); for (const sx of [-1, 1]) { g.push(); g.move(sx * L / 2, r, 0); g.rotZ(Math.PI / 2); g.cyl(0, -0.006, 0, r, 0.012, { segs: 9 }); g.pop(); }
  g.mat('wood', '#c9a87a', { rough: -0.05 }); g.box(-L / 2 + 0.02, 0.37, -0.13, L / 2 - 0.02, 0.43, 0.13, { bevel: 0.01 });
  const spots = []; const n = Math.max(1, Math.floor(L / 0.65)); for (let i = 0; i < n; i++) spots.push({ type: 'sit', x: -L / 2 + (i + 0.5) * L / n, y: 0.43, z: 0.02, yaw: 0, tags: ['wood', 'log-ring'] });
  return { solid: [[-L / 2, 0, -0.2, L / 2, 0.43, 0.2]], spots, tier: 's' };
});

// A tree fern: a shaggy trunk and a crown of long fronds. p: { h, v }
defineProp('lm-hollow-front.treefern', (g, p) => {
  const h = p.h || 2.4, r = new Rng(hashStr('tf' + (p.v || 0)));
  const pts = [], rad = []; let x = 0, z = 0; for (let i = 0; i <= 5; i++) { const t = i / 5; pts.push([x, t * h, z]); rad.push(0.15 - 0.04 * t); x += r.f(-0.05, 0.05); z += r.f(-0.05, 0.05); }
  g.mat('bark', '#7a6450'); g.tube(pts, rad, { segs: 7 });
  g.mat('fern', '#e8f2c8', { sway: 0.3 });
  const top = pts[5], n = 13;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + r.f(-0.2, 0.2), L = r.f(1.4, 1.9); g.card(top[0] + Math.cos(a) * 0.06, top[1] - 0.12, top[2] + Math.sin(a) * 0.06, L * 0.38, L, a + Math.PI / 2, { tilt: r.f(0.9, 1.4) }); }
  for (let i = 0; i < 4; i++) { const a = r.f(0, 6.28); g.card(top[0], top[1] - 0.05, top[2], 0.3, 0.7, a, { tilt: 0.15 }); }
  return { posts: [[0, 0, 0.16, 0, h]], tier: 's', cast: true };
});

// A clump of chervil: lacy pale leaves and small white umbels. p: { v }
defineProp('lm-hollow-front.chervil', (g, p) => {
  const r = new Rng(hashStr('cv' + (p.v || 0)));
  g.mat('leafB', '#d6f0a8', { sway: 0.4 });
  for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28 + r.f(-0.3, 0.3), s = r.f(0.18, 0.28); g.card(Math.cos(a) * 0.03, 0, Math.sin(a) * 0.03, s * 0.9, s, a + Math.PI / 2, { tilt: r.f(0.3, 0.7) }); }
  for (let k = 0; k < 3; k++) {
    const a = r.f(0, 6.28), d = r.f(0.03, 0.08), hh = r.f(0.3, 0.42), ux = Math.cos(a) * d, uz = Math.sin(a) * d;
    g.mat('grass', '#9fc070'); g.tube([[0, 0, 0], [ux, hh, uz]], 0.004, { segs: 3, caps: false });
    g.mat('plain', '#f4f1e6'); for (let j = 0; j < 5; j++) { const b = j / 5 * 6.28; g.ball(ux + Math.cos(b) * 0.025, hh + 0.01, uz + Math.sin(b) * 0.025, 0.012, 0.008, 0.012, { segs: 4, rings: 2 }); }
  }
  return { tier: 'd', cast: false };
});

// A plant label on a stake. p: { col }
defineProp('lm-hollow-front.label', (g, p) => {
  g.mat('wood', '#b08d5e'); g.box(-0.008, 0, -0.008, 0.008, 0.26, 0.008);
  g.push(); g.move(0, 0.24, 0.01); g.rotX(-0.35); g.mat('paint', p.col || '#efe6d2'); g.box(-0.05, 0, -0.003, 0.05, 0.07, 0.003); g.mat('plain', '#2b2a26'); g.box(-0.035, 0.035, 0.0032, 0.03, 0.042, 0.0036, { faces: 'Z' }); g.box(-0.035, 0.02, 0.0032, 0.015, 0.026, 0.0036, { faces: 'Z' }); g.pop();
  return { tier: 'd', cast: false };
});

// The gardener's potting bench: a slatted top, a back with a shelf, pots, a trowel, a tin of labels, a lidded flask, a can.
defineProp('lm-hollow-front.potbench', (g) => {
  g.mat('wood', '#7a5a3a', { rough: 0.05 });
  for (let i = 0; i < 5; i++) g.box(-0.85, 0.84, -0.32 + i * 0.13, 0.85, 0.88, -0.32 + i * 0.13 + 0.11, { bevel: 0.006 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * 0.8 - 0.035, 0, sz * 0.28 - 0.035, sx * 0.8 + 0.035, 0.84, sz * 0.28 + 0.035);
  for (const sx of [-1, 1]) g.box(sx * 0.8 - 0.03, 0.84, -0.36, sx * 0.8 + 0.03, 1.55, -0.3);
  g.box(-0.85, 1.05, -0.38, 0.85, 1.4, -0.34); g.box(-0.85, 1.4, -0.38, 0.85, 1.43, -0.18, { bevel: 0.006 }); g.box(-0.8, 0.22, -0.3, 0.8, 0.25, 0.3);
  // pots, stacked and single
  g.mat('glaze', '#b5653a', { rough: 0.2 });
  for (let i = 0; i < 4; i++) g.lathe(-0.6 + i * 0.14, -0.28, [[0, 1.43], [0.04, 1.43], [0.055, 1.52], [0.058, 1.53], [0.05, 1.53], [0, 1.45]], { segs: 8 });
  for (let k = 0; k < 3; k++) g.lathe(0.45, 0.05, [[0, 0.88 + k * 0.04], [0.06, 0.88 + k * 0.04], [0.08, 0.98 + k * 0.04], [0.07, 0.98 + k * 0.04]], { segs: 9 });
  for (let i = 0; i < 3; i++) g.lathe(-0.15 + i * 0.16, 0.12, [[0, 0.88], [0.04, 0.88], [0.052, 0.96], [0.046, 0.96], [0, 0.9]], { segs: 8 });
  g.mat('fern', '#d8f0a0', { sway: 0.2 }); for (let i = 0; i < 3; i++) for (let k = 0; k < 4; k++) g.card(-0.15 + i * 0.16, 0.94, 0.12, 0.09, 0.2, k * 1.6, { tilt: 0.5 });
  // trowel, the tin of labels, the flask
  g.mat('brushed', '#9a9a92'); g.box(-0.62, 0.885, 0.0, -0.5, 0.89, 0.08); g.mat('wood', '#c9a46e'); g.tube([[-0.5, 0.9, 0.04], [-0.36, 0.91, 0.06]], 0.012, { segs: 5 });
  g.mat('cast', '#5a7f86'); g.lathe(-0.6, -0.15, [[0, 0.88], [0.05, 0.88], [0.05, 0.98], [0, 0.98]], { segs: 8 });
  g.mat('paint', '#efe6d2'); for (let i = 0; i < 6; i++) g.box(-0.62 + i * 0.008, 0.98, -0.16 + (i % 2) * 0.01, -0.61 + i * 0.008, 1.07, -0.14 + (i % 2) * 0.01);
  g.mat('cast', '#2f6f73'); g.lathe(0.15, -0.18, [[0, 0.88], [0.045, 0.88], [0.045, 1.08], [0.035, 1.1], [0.037, 1.13], [0, 1.135]], { segs: 8 });
  // the watering can under it
  g.mat('cast', '#3f6a4a'); g.lathe(0.4, 0.05, [[0, 0.25], [0.12, 0.25], [0.12, 0.45], [0.1, 0.47], [0, 0.47]], { segs: 10 });
  g.tube([[0.5, 0.3, 0.05], [0.64, 0.46, 0.05], [0.7, 0.52, 0.05]], 0.016, { segs: 5 }); g.tube([[0.3, 0.45, 0.05], [0.4, 0.62, 0.05], [0.5, 0.45, 0.05]], 0.01, { segs: 4 });
  return { solid: [[-0.85, 0, -0.38, 0.85, 0.88, 0.32]], tier: 'd', spots: [{ type: 'work', x: 0, y: 0, z: 0.7, yaw: Math.PI, tags: ['garden', 'pot', 'fern'] }] };
});

// A cold frame: a low wooden box with a sloping glazed lid propped open on a stick, seedlings in rows inside.
defineProp('lm-hollow-front.coldframe', (g) => {
  const w = 1.6, d = 0.9;
  g.mat('wood', '#6b5236'); g.box(-w / 2, 0, -d / 2, w / 2, 0.5, -d / 2 + 0.05); g.box(-w / 2, 0, d / 2 - 0.05, w / 2, 0.3, d / 2);
  for (const sx of [-1, 1]) g.extrude([[-d / 2, 0], [d / 2, 0], [d / 2, 0.3], [-d / 2, 0.5]], sx * w / 2 - (sx > 0 ? 0.05 : 0), sx * w / 2 + (sx < 0 ? 0.05 : 0), 'x');
  g.mat('soil', '#8a7a62'); g.box(-w / 2 + 0.05, 0.12, -d / 2 + 0.05, w / 2 - 0.05, 0.16, d / 2 - 0.05, { faces: 'Y' });
  g.mat('leafB', '#d6f0a8'); for (let row = 0; row < 4; row++) for (let i = 0; i < 9; i++) { const x = -w / 2 + 0.15 + i * 0.16, z = -d / 2 + 0.17 + row * 0.18, s = 0.05 + row * 0.03; g.card(x, 0.16, z, s, s, i * 0.9 + row, { tilt: 0.3 }); }
  // the lid, hinged at the back and propped open
  g.push(); g.move(0, 0.5, -d / 2); g.rotX(-0.55);
  g.mat('wood', '#6b5236'); g.box(-w / 2, 0, 0, -w / 2 + 0.05, 0.04, d + 0.05); g.box(w / 2 - 0.05, 0, 0, w / 2, 0.04, d + 0.05); g.box(-w / 2, 0, d, w / 2, 0.04, d + 0.05); g.box(-0.02, 0, 0, 0.02, 0.04, d);
  g.mat('plain', '#dceeea', { rough: -0.4 }); g.box(-w / 2 + 0.05, 0.015, 0.02, w / 2 - 0.05, 0.02, d, { faces: 'Y' });
  g.pop();
  g.mat('wood', '#c9a46e'); g.tube([[0.5, 0.3, d / 2 - 0.05], [0.5, 0.88, -0.02]], 0.012, { segs: 4 });
  return { solid: [[-w / 2, 0, -d / 2, w / 2, 0.5, d / 2]], tier: 'd' };
});
