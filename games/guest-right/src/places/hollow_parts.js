// Props and helpers for the places people made on the Hollow's floor (hollow_places.js): long tables and benches for the
// feast's overflow, lantern poles and paper lanterns, picnic cloths and lidded baskets, loungers and punts, orchard
// step-ladders and apple crates, kites on long lines, bare trees for the winter tent, a procedural enamel map of the Hollow.
// Everything is drawn in a frame's flat metres; props are drawn at the origin with their front toward +z.
import { defineProp, prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { heightAt, landAt, BIOME, LAND } from '../world/land.js';
import { Rng, hashStr, shadeHex, mixHex } from '../core/util.js';

export const hollowParts = true;

// The festival palette: strong dyes, because colour weighs nothing.
export const FESTIVE = ['#d9472b', '#e7b547', '#2f8f8a', '#3b4a8f', '#b8336a', '#6b9f3e', '#f08a3a', '#efe6d2'];
export const PAL = { iron: '#24443a', brass: '#b08a45', enamel: '#ece3cf', teal: '#2b6a6c', verm: '#c4472c', saffron: '#e7b547', indigo: '#34407a', magenta: '#b8336a', leaf: '#5f8f3a', rose: '#e07a6a', cream: '#efe6d2', plum: '#6a2f5a', sky: '#4f9fc0' };

export function gy(x, z) { return heightAt(x, z); }
// the highest ground under a rectangle (sampled), for level floors built over rolling land
export function maxGround(x0, z0, x1, z1, step = 1) {
  let m = -9; for (let z = z0; z <= z1 + 1e-6; z += step) for (let x = x0; x <= x1 + 1e-6; x += step) m = Math.max(m, heightAt(x, z));
  return m;
}
export function minGround(x0, z0, x1, z1, step = 1) {
  let m = 9; for (let z = z0; z <= z1 + 1e-6; z += step) for (let x = x0; x <= x1 + 1e-6; x += step) m = Math.min(m, heightAt(x, z));
  return m;
}

// ---- small, safe game helpers ----
export async function say(game, who, lines) {
  if (!game.ui) return;
  game.busy = (game.busy || 0) + 1;
  try { await game.ui.say(who, lines); } finally { game.busy--; }
}
export function toast(game, text, kind) { if (game.ui && game.ui.toast) game.ui.toast(text, { kind: kind || 'info' }); }
export function found(game, id) { if (game.journal) game.journal.find(id); }
export function sfx(game, name, f, x, y, z) { if (game.sfxAt) game.sfxAt(name, f, x, y, z); }
// buy from a MENUS entry: shows the menu, spends, returns the item or null
export async function buyFrom(game, menu, keeper) {
  if (!game.ui || !menu) return null;
  game.busy = (game.busy || 0) + 1;
  try {
    const day = game.clock ? game.clock.day : 1, hr = game.clock ? game.clock.hours : 12;
    const items = menu.items.filter((it) => !it.days || it.days.indexOf(day) >= 0)
      .map((it) => Object.assign({}, it, { disabled: (it.hours && (hr < it.hours[0] || hr >= it.hours[1])) || (game.wallet && it.price > game.wallet.kwh + 1e-6) }));
    const id = await game.ui.menu({ kicker: keeper || '', title: menu.title, note: menu.note, items, wallet: game.wallet ? game.wallet.kwh : 0 });
    if (!id) return null;
    const it = menu.items.find((q) => q.id === id); if (!it) return null;
    if (game.wallet && it.price > 0 && !game.wallet.spend(it.price, it.name)) return null;
    if (it.price <= 0) toast(game, it.name + (it.tag === 'loan' ? ', on loan' : ', with thanks'));
    return it;
  } finally { game.busy--; }
}

// ---- drawing helpers ----
// an upright board standing on two legs; the face toward +z in local space (used under g.at)
function boardLegs(g, w, h, y0, legCol) {
  g.mat('wood', legCol || '#5a4030');
  for (const sx of [-1, 1]) g.box(sx * (w / 2 - 0.08) - 0.04, 0, -0.06, sx * (w / 2 - 0.08) + 0.04, y0 + h + 0.06, -0.0, { bevel: 0.01 });
}

// A string of paper lanterns (and a line) between two points; the lanterns glow at night. o: { n, cols, sag, r, glow }
export function lanternString(s, a, b, o = {}) {
  const g = s.g, len = Math.hypot(b[0] - a[0], b[2] - a[2]), n = o.n || Math.max(3, Math.round(len / 1.6)), sag = o.sag === undefined ? len * 0.07 : o.sag;
  const cols = o.cols || FESTIVE, r = o.r || 0.13;
  const P = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t];
  const line = []; for (let i = 0; i <= 10; i++) line.push(P(i / 10));
  g.mat('weave', '#3a332c'); g.tube(line, 0.006, { segs: 3, caps: false });
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, p = P(t), c = cols[(i + (o.offset || 0)) % cols.length], hh = r * 1.5, y = p[1] - 0.1 - hh / 2;
    g.mat('weave', '#3a332c'); g.tube([[p[0], p[1], p[2]], [p[0], y + hh / 2, p[2]]], 0.004, { segs: 3, caps: false });
    g.mat('paper', c, { emissive: o.glow || 2.4, night: true });
    g.lathe(p[0], p[2], [[r * 0.3, y - hh / 2], [r * 0.85, y - hh * 0.32], [r, y], [r * 0.85, y + hh * 0.32], [r * 0.3, y + hh / 2]], { segs: 9 });
    g.mat('wood', '#2e2420'); g.cyl(p[0], y + hh / 2, p[2], r * 0.32, 0.025, { segs: 6 });
  }
  return s.draw(() => {}, { tier: 's', cast: false });
}

// Bunting in strong colours between two points (the kit's bunting, but kept in the structure tier so it reads from afar)
export function flags(s, a, b, o = {}) {
  const g = s.g, len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = o.n || Math.max(4, Math.round(len / 0.36)), sag = o.sag === undefined ? len * 0.06 : o.sag;
  const cols = o.cols || FESTIVE;
  const P = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t];
  const line = []; for (let i = 0; i <= 10; i++) line.push(P(i / 10));
  g.mat('weave', '#d8cdb8'); g.tube(line, 0.005, { segs: 3, caps: false });
  const dx = (b[0] - a[0]) / len, dz = (b[2] - a[2]) / len;
  for (let i = 0; i < n; i++) {
    const t0 = (i + 0.1) / n, t1 = (i + 0.9) / n, p0 = P(t0), p1 = P(t1), pm = P((t0 + t1) / 2), hh = o.drop || 0.26;
    g.mat('weave', cols[(i + (o.offset || 0)) % cols.length], { sway: 0.9 });
    const v0 = g.buf.nv;
    g.quad(p0, p1, [pm[0] + dx * 0.001, pm[1] - hh, pm[2] + dz * 0.001], [pm[0] - dx * 0.001, pm[1] - hh, pm[2] - dz * 0.001], { double: true });
    for (const k of [0, 1, 4, 7]) g.param(v0 + k, 0);
  }
  return s.draw(() => {}, { tier: 's', cast: false });
}

// A kite flying on a long line from a stake at (ax, ay, az) to its bridle at (kx, ky, kz). o: { cols: [a, b, patch], shape: 'diamond' | 'delta' | 'box', size, seed }
export function kite(s, ax, ay, az, kx, ky, kz, o = {}) {
  const g = s.g, r = new Rng(hashStr('kite' + kx + ',' + kz + (o.seed || 0)));
  const cols = o.cols || [r.pick(FESTIVE), r.pick(FESTIVE), r.pick(FESTIVE)], sz = o.size || 1;
  // the line: a long shallow curve, sagging a little toward the ground
  const L = Math.hypot(kx - ax, ky - ay, kz - az), sag = L * 0.05; const line = [];
  for (let i = 0; i <= 14; i++) { const t = i / 14; line.push([ax + (kx - ax) * t, ay + (ky - ay) * t - sag * 4 * t * (1 - t) * (1 - t * 0.4), az + (kz - az) * t]); }
  g.mat('weave', '#f4eedc'); g.tube(line, 0.014, { segs: 3, caps: false });
  // the kite faces back toward the flyer, leaning back
  const yaw = Math.atan2(ax - kx, az - kz);
  g.at(kx, ky, kz, yaw); g.rotX(-0.55); g.scale(sz);
  const shape = o.shape || 'diamond';
  if (shape === 'box') {
    // a box kite: two bands of cloth round four sticks
    g.mat('wood', '#c9a46e'); for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [0.3, 0.3], [-0.3, 0.3]]) g.tube([[x, -0.75, z], [x, 0.75, z]], 0.012, { segs: 4 });
    for (const yb of [[-0.75, -0.25], [0.25, 0.75]]) {
      const pts = [[-0.3, -0.3], [0.3, -0.3], [0.3, 0.3], [-0.3, 0.3]];
      for (let k = 0; k < 4; k++) { const p = pts[k], q = pts[(k + 1) % 4]; g.mat('weave', cols[k % 2]); g.quad([p[0], yb[0], p[1]], [q[0], yb[0], q[1]], [q[0], yb[1], q[1]], [p[0], yb[1], p[1]], { double: true }); }
    }
  } else {
    const top = shape === 'delta' ? 0.55 : 0.8, side = shape === 'delta' ? 0.75 : 0.52, mid = shape === 'delta' ? -0.25 : 0.18, bot = shape === 'delta' ? -0.35 : -0.6;
    g.mat('weave', cols[0]); g.quad([0, top, 0], [-side, mid, 0], [0, bot, 0], [0, bot, 0], { double: true });
    g.mat('weave', cols[1]); g.quad([0, top, 0], [0, bot, 0], [side, mid, 0], [side, mid, 0], { double: true });
    // a patch or two, sewn on in a third colour
    g.mat('weave', cols[2]); g.quad([-0.22, 0.05, 0.006], [-0.06, 0.05, 0.006], [-0.06, 0.2, 0.006], [-0.22, 0.2, 0.006], { double: true });
    if (r.chance(0.6)) g.quad([0.1, -0.15, 0.006], [0.24, -0.15, 0.006], [0.24, -0.03, 0.006], [0.1, -0.03, 0.006], { double: true });
    g.mat('wood', '#7a5a3a'); g.tube([[0, top, -0.02], [0, bot, -0.02]], 0.01, { segs: 4 }); g.tube([[-side, mid, -0.02], [side, mid, -0.02]], 0.009, { segs: 4 });
  }
  g.pop();
  // the tail: a ribbon with bows, hanging and swaying
  const tl = (o.tail || 3.4) * sz, nt = 12; let px = kx, py = ky - 0.55 * sz, pz = kz; const fx = Math.sin(yaw) * 0.12, fz = Math.cos(yaw) * 0.12;
  for (let i = 0; i < nt; i++) {
    const t1 = (i + 1) / nt, nx = kx + fx * t1 * 6, ny = ky - 0.55 * sz - tl * t1, nz = kz + fz * t1 * 6;
    g.mat('weave', cols[i % 2 ? 2 : 0], { sway: 1 });
    const v0 = g.buf.nv; const w = 0.05 * sz;
    g.quad([px - w * Math.cos(yaw), py, pz + w * Math.sin(yaw)], [px + w * Math.cos(yaw), py, pz - w * Math.sin(yaw)], [nx + w * Math.cos(yaw), ny, nz - w * Math.sin(yaw)], [nx - w * Math.cos(yaw), ny, nz + w * Math.sin(yaw)], { double: true });
    for (let k = 0; k < 8; k++) g.param(v0 + k, Math.min(1, (i + (k === 2 || k === 3 || k === 5 || k === 6 ? 1 : 0)) / nt * 1.0 + 0.05));
    if (i % 2 === 1) { g.mat('weave', cols[1], { sway: 1 }); const b0 = g.buf.nv; const bw = 0.14 * sz; g.quad([nx - bw * Math.cos(yaw), ny + 0.05, nz + bw * Math.sin(yaw)], [nx, ny, nz], [nx + bw * Math.cos(yaw), ny + 0.05, nz - bw * Math.sin(yaw)], [nx, ny - 0.02, nz], { double: true }); for (let k = 0; k < 8; k++) g.param(b0 + k, t1); }
    px = nx; py = ny; pz = nz;
  }
  return s.draw(() => {}, { tier: 's', cast: false });
}

// A bare apple tree (winter, for the chilled tent): trunk and forking branches, no leaves. Drawn into g at (x, y, z).
export function bareTree(g, x, y, z, seed, sc = 1) {
  const r = new Rng(hashStr('bare' + seed));
  g.mat('bark', '#7a6652');
  const H = 1.5 * sc;
  g.tube([[x, y, z], [x + 0.03, y + H * 0.5, z + 0.02], [x - 0.02, y + H, z]], [0.11 * sc, 0.095 * sc, 0.08 * sc], { segs: 7 });
  const twig = (p, dir, len, rad, depth) => {
    const e = [p[0] + dir[0] * len, p[1] + dir[1] * len, p[2] + dir[2] * len];
    const m = [p[0] + dir[0] * len * 0.5 + r.f(-0.08, 0.08), p[1] + dir[1] * len * 0.5 + 0.05, p[2] + dir[2] * len * 0.5 + r.f(-0.08, 0.08)];
    g.tube([p, m, e], [rad, rad * 0.75, rad * 0.45], { segs: depth > 1 ? 5 : 3, caps: depth === 0 });
    if (depth <= 0) return;
    const nb = depth > 1 ? 3 : 2;
    for (let i = 0; i < nb; i++) {
      const a = Math.atan2(dir[2], dir[0]) + r.f(-0.9, 0.9), up = Math.max(0.2, dir[1] + r.f(-0.15, 0.35)), hz = Math.sqrt(Math.max(0.05, 1 - up * up));
      twig(e, [Math.cos(a) * hz, up, Math.sin(a) * hz], len * r.f(0.55, 0.75), rad * 0.6, depth - 1);
    }
  };
  const top = [x - 0.02, y + H, z];
  for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283 + r.f(-0.3, 0.3), up = r.f(0.45, 0.75), hz = Math.sqrt(1 - up * up); twig(top, [Math.cos(a) * hz, up, Math.sin(a) * hz], 0.9 * sc * r.f(0.8, 1.15), 0.06 * sc, 2); }
}

// ---- the enamel map of the Hollow: the whole floor unrolled, drawn from the same land function you walk on ----
// (x, y, z): bottom centre of the board; the board faces +z under yaw; w x h the enamel face.
export function mapBoard(s, x, y, z, yaw, o = {}) {
  const g = s.g, w = o.w || 2.2, h = o.h || 0.9, foot = o.foot || 0.85;
  g.at(x, y, z, yaw);
  // frame and legs
  g.mat('cast', PAL.iron); for (const sx of [-1, 1]) g.box(sx * (w / 2 + 0.06) - 0.035, 0, -0.05, sx * (w / 2 + 0.06) + 0.035, foot + h + 0.25, 0.02, { bevel: 0.01 });
  g.box(-w / 2 - 0.1, foot - 0.07, -0.05, w / 2 + 0.1, foot - 0.02, 0.03, { bevel: 0.008 }); g.box(-w / 2 - 0.1, foot + h + 0.02, -0.05, w / 2 + 0.1, foot + h + 0.24, 0.03, { bevel: 0.01 });
  g.mat('glaze', '#20343a'); g.box(-w / 2 - 0.02, foot - 0.02, -0.04, w / 2 + 0.02, foot + h + 0.02, 0.0);
  // the floor, cell by cell, runs of one colour merged
  const NX = 120, NZ = 48, col = (b, l) => b === BIOME.LAKE ? '#2f6f9a' : b === BIOME.ORCHARD ? '#4f7a3a' : b === BIOME.WOOD ? '#33502f' : b === BIOME.BEACH ? '#e2d5ae' : b === BIOME.PLAZA ? '#b9ab92' : b === BIOME.MEADOW ? '#b8c86f' : b === BIOME.GREEN ? '#a6d07a' : '#8fbf62';
  const cw = w / NX, ch = h / NZ;
  for (let j = 0; j < NZ; j++) {
    const wz = (j + 0.5) / NZ * LAND.L; let run = null, i0 = 0;
    const flush = (i1) => { if (run === null) return; g.mat('glaze', run, { rough: -0.2 }); const u0 = -w / 2 + i0 * cw, u1 = -w / 2 + i1 * cw, v1 = foot + h - j * ch, v0 = v1 - ch; g.quad([u0, v0, 0.004], [u1, v0, 0.004], [u1, v1, 0.004], [u0, v1, 0.004]); };
    for (let i = 0; i <= NX; i++) {
      let c = null;
      if (i < NX) { const wx = ((i + 0.5) / NX - 0.5) * LAND.C; const l = landAt(wx, wz); c = col(l.biome, l); }
      if (c !== run) { flush(i); run = c; i0 = i; }
    }
  }
  // the end walls as bands, and a red dot for "you are here"
  g.mat('glaze', '#7a6a58'); g.quad([-w / 2, foot + h, 0.006], [w / 2, foot + h, 0.006], [w / 2, foot + h + 0.02, 0.006], [-w / 2, foot + h + 0.02, 0.006]);
  g.quad([-w / 2, foot - 0.02, 0.006], [w / 2, foot - 0.02, 0.006], [w / 2, foot, 0.006], [-w / 2, foot, 0.006]);
  const hx = (o.youX || 0) / LAND.C * w, hy = foot + h - (o.youZ || 1700) / LAND.L * h;
  g.pop();
  s.flush({ tier: 's', cast: true });
  // the dot is a little disc standing proud of the face: draw it properly facing out
  g.at(x, y, z, yaw); g.mat('glaze', '#e0301e', { emissive: 0.8 }); g.push(); g.move(hx, hy, 0.012); g.rotX(Math.PI / 2); g.cyl(0, -0.006, 0, 0.026, 0.012, { segs: 12 }); g.pop(); g.pop();
  s.flush({ tier: 'd', cast: false });
  const bb = aabbXZ(x, z, yaw, w / 2 + 0.12, 0.08); s.solid(bb[0], y, bb[1], bb[2], y + foot + h + 0.3, bb[3]);
}
// an axis-aligned box round a rotated rectangle (half sizes hx, hz): returns [x0, z0, x1, z1]
export function aabbXZ(x, z, yaw, hx, hz) {
  const c = Math.abs(Math.cos(yaw)), s = Math.abs(Math.sin(yaw)); const ex = c * hx + s * hz, ez = s * hx + c * hz;
  return [x - ex, z - ez, x + ex, z + ez];
}

// A signpost with arms pointing along the axes. arms: [{ dir: 'x' | 'X' | 'z' | 'Z', text, sub, col }]
export function signpost(s, x, z, arms, o = {}) {
  const g = s.g, y = heightAt(x, z), H = o.h || 2.7;
  g.mat('wood', o.post || '#4a3a2c'); g.box(x - 0.06, y - 0.2, z - 0.06, x + 0.06, y + H, z + 0.06, { bevel: 0.015 });
  g.mat('cast', PAL.brass); g.lathe(x, z, [[0.0, y + H], [0.08, y + H], [0.09, y + H + 0.04], [0.05, y + H + 0.1], [0, y + H + 0.14]], { segs: 8 });
  s.flush({ tier: 's', cast: true });
  s.post(x, z, 0.08, y, y + H);
  arms.forEach((a, i) => {
    const yy = y + H - 0.32 - i * 0.3, L = 1.05, ax = a.dir === 'X' ? 1 : a.dir === 'x' ? -1 : 0, az = a.dir === 'Z' ? 1 : a.dir === 'z' ? -1 : 0;
    const cx = x + ax * (0.1 + L / 2), cz = z + az * (0.1 + L / 2), bc = a.col || '#efe6d2';
    g.mat('paint', bc);
    const tip = (t, d, axis, c0, c1) => { const tri = [[t, yy - 0.11], [t + d * 0.16, yy], [t, yy + 0.11]]; g.extrude(tri, c0, c1, axis); g.extrude(tri.slice().reverse(), c0, c1, axis); };
    if (ax) { g.box(Math.min(cx - ax * L / 2, cx + ax * (L / 2 - 0.12)), yy - 0.11, cz - 0.02, Math.max(cx - ax * L / 2, cx + ax * (L / 2 - 0.12)), yy + 0.11, cz + 0.02, { bevel: 0.006 }); tip(cx + ax * (L / 2 - 0.12), ax, 'z', cz - 0.02, cz + 0.02); }
    else { g.box(cx - 0.02, yy - 0.11, Math.min(cz - az * L / 2, cz + az * (L / 2 - 0.12)), cx + 0.02, yy + 0.11, Math.max(cz - az * L / 2, cz + az * (L / 2 - 0.12)), { bevel: 0.006 }); tip(cz + az * (L / 2 - 0.12), az, 'x', cx - 0.02, cx + 0.02); }
    s.flush({ tier: 'd', cast: true });
    const spec = { kind: 'street', text: a.text, sub: a.sub || '', palette: a.palette || [bc, '#2b2a26', '#9a3a2a'] };
    if (ax) sign(s, spec, cx - ax * 0.06, yy, cz, { face: 'Z', w: L - 0.2, h: 0.2, double: true, board: false, thick: 0.045 });
    else sign(s, spec, cx, yy, cz - az * 0.06, { face: 'X', w: L - 0.2, h: 0.2, double: true, board: false, thick: 0.045 });
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------------------------------------

// A long trestle table for the feast's overflow. p: { len (12), top, leg, cloth (a runner colour) }
defineProp('hollow.longtable', (g, p) => {
  const L = p.len || 12, d = 0.9, h = 0.74;
  g.mat('wood', p.top || '#b8875a', { rough: -0.05 });
  for (let i = 0; i < 3; i++) { const z0 = -d / 2 + i * d / 3 + 0.004, z1 = -d / 2 + (i + 1) * d / 3 - 0.004; g.box(-L / 2, h - 0.04, z0, L / 2, h, z1, { bevel: 0.008 }); }
  g.mat('wood', p.leg || '#6b4a2f');
  const n = Math.round(L / 3);
  for (let k = 0; k <= n; k++) {
    const x = -L / 2 + 0.35 + k * (L - 0.7) / n;
    g.tube([[x, 0, -0.36], [x, h - 0.06, -0.14]], 0.028, { segs: 5 }); g.tube([[x, 0, 0.36], [x, h - 0.06, 0.14]], 0.028, { segs: 5 });
    g.box(x - 0.035, h - 0.1, -0.41, x + 0.035, h - 0.04, 0.41, { bevel: 0.006 });
  }
  g.box(-L / 2 + 0.35, 0.3, -0.03, L / 2 - 0.35, 0.36, 0.03, { bevel: 0.006 });
  if (p.cloth) { g.mat('stripe', p.cloth); g.box(-L / 2 + 0.2, h, -0.24, L / 2 - 0.2, h + 0.004, 0.24, { faces: 'Y' }); }
  if (p.cover) {
    // a cloth over the whole top, hanging a hand's breadth over the sides, its hem in a second colour
    g.mat(p.coverMat || 'weave', p.cover); g.box(-L / 2 - 0.05, h + 0.002, -d / 2 - 0.05, L / 2 + 0.05, h + 0.008, d / 2 + 0.05, { faces: 'Y' });
    for (const sz of [-1, 1]) { g.quad([-L / 2 - 0.05, h + 0.008, sz * (d / 2 + 0.05)], [L / 2 + 0.05, h + 0.008, sz * (d / 2 + 0.05)], [L / 2 + 0.05, h - 0.2, sz * (d / 2 + 0.06)], [-L / 2 - 0.05, h - 0.2, sz * (d / 2 + 0.06)], { double: true }); }
    for (const sx of [-1, 1]) g.quad([sx * (L / 2 + 0.05), h + 0.008, -d / 2 - 0.05], [sx * (L / 2 + 0.05), h + 0.008, d / 2 + 0.05], [sx * (L / 2 + 0.06), h - 0.2, d / 2 + 0.05], [sx * (L / 2 + 0.06), h - 0.2, -d / 2 - 0.05], { double: true });
    if (p.hem) { g.mat('weave', p.hem); for (const sz of [-1, 1]) g.quad([-L / 2 - 0.05, h - 0.17, sz * (d / 2 + 0.062)], [L / 2 + 0.05, h - 0.17, sz * (d / 2 + 0.062)], [L / 2 + 0.05, h - 0.2, sz * (d / 2 + 0.062)], [-L / 2 - 0.05, h - 0.2, sz * (d / 2 + 0.062)], { double: true }); }
  }
  return { solid: [[-L / 2, 0.3, -d / 2, L / 2, h, d / 2]], tier: 's', surf: 'wood' };
});
// A long bench to go with it. p: { len, wood }
defineProp('hollow.longbench', (g, p) => {
  const L = p.len || 12; g.mat('wood', p.wood || '#a87a50', { rough: -0.03 });
  g.box(-L / 2, 0.42, -0.15, L / 2, 0.46, 0.15, { bevel: 0.008 });
  g.mat('wood', shadeHex(p.wood || '#a87a50', 0.7));
  const n = Math.round(L / 2);
  for (let k = 0; k <= n; k++) { const x = -L / 2 + 0.25 + k * (L - 0.5) / n; g.box(x - 0.03, 0, -0.13, x + 0.03, 0.42, -0.08); g.box(x - 0.03, 0, 0.08, x + 0.03, 0.42, 0.13); g.box(x - 0.035, 0.36, -0.15, x + 0.035, 0.42, 0.15); }
  const spots = []; for (let i = 0; i < Math.floor(L / 3); i++) spots.push({ type: 'sit', x: -L / 2 + 1.5 + i * 3, y: 0.46, z: 0, yaw: 0, tags: ['feast', 'green'] });
  return { solid: [[-L / 2, 0, -0.15, L / 2, 0.46, 0.15]], spots, tier: 's' };
});
// A handcart with table tops or benches stacked on it. p: { load: 'tables' | 'benches', n }
defineProp('hollow.handcart', (g, p) => {
  const L = p.load === 'benches' ? 3.2 : 3.4, W = 1.1, y0 = 0.55;
  g.mat('wood', '#8a6a48'); g.box(-L / 2, y0 - 0.06, -W / 2, L / 2, y0, W / 2, { bevel: 0.01 });
  for (const sz of [-1, 1]) g.box(-L / 2, y0, sz * W / 2 - (sz > 0 ? 0.05 : 0), L / 2, y0 + 0.12, sz * W / 2 + (sz < 0 ? 0.05 : 0), { bevel: 0.008 });
  g.mat('cast', '#2f3a36'); g.tube([[-L / 2, y0 - 0.03, -0.35], [-L / 2 - 0.9, 0.85, -0.3], [-L / 2 - 1.0, 0.86, 0], [-L / 2 - 0.9, 0.85, 0.3], [-L / 2, y0 - 0.03, 0.35]], 0.02, { segs: 6 });
  // two big wheels
  for (const sz of [-1, 1]) {
    g.push(); g.move(0.2, 0.42, sz * (W / 2 + 0.06)); g.rotX(Math.PI / 2);
    g.mat('cast', '#3a3a36'); g.lathe(0, 0, [[0.36, -0.035], [0.42, -0.03], [0.42, 0.03], [0.36, 0.035]], { segs: 18, capTop: false, capBottom: false });
    g.mat('wood', '#6b4a2f'); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI; g.box(-0.36 * Math.cos(a) - 0.015, -0.015, -0.36 * Math.sin(a), 0.36 * Math.cos(a) + 0.015, 0.015, 0.36 * Math.sin(a)); }
    g.cyl(0, -0.05, 0, 0.06, 0.1, { segs: 8 });
    g.pop();
  }
  g.mat('cast', '#2f3a36'); g.tube([[0.2, 0.42, -W / 2 - 0.1], [0.2, 0.42, W / 2 + 0.1]], 0.025, { segs: 6 });
  // the load
  const n = p.n || 4;
  if (p.load === 'benches') { g.mat('wood', '#a87a50'); for (let i = 0; i < n; i++) { const z = -0.32 + (i % 3) * 0.32, y = y0 + 0.05 + Math.floor(i / 3) * 0.05; g.box(-1.5, y, z - 0.14, 1.5, y + 0.04, z + 0.14, { bevel: 0.006 }); } }
  else { g.mat('wood', '#b8875a', { rough: -0.05 }); for (let i = 0; i < n; i++) { const y = y0 + 0.02 + i * 0.045, off = (i % 2 ? 0.04 : -0.03); g.box(-1.6 + off, y, -0.45, 1.6 + off, y + 0.04, 0.45, { bevel: 0.006 }); } g.mat('weave', '#c9552e'); g.tube([[0.6, y0 + 0.02, -0.5], [0.6, y0 + 0.05 + n * 0.045, -0.47], [0.6, y0 + 0.05 + n * 0.045, 0.47], [0.6, y0 + 0.02, 0.5]], 0.012, { segs: 4 }); }
  return { solid: [[-L / 2 - 1.0, 0, -W / 2 - 0.1, L / 2, y0 + 0.4, W / 2 + 0.1]], tier: 's' };
});
// A painted lantern pole with a crossarm and hooks. p: { h, col, band }
defineProp('hollow.pole', (g, p) => {
  const h = p.h || 4.2, col = p.col || '#2f6f73';
  g.mat('paint', col); g.lathe(0, 0, [[0.11, 0], [0.09, 0.08], [0.065, 0.2], [0.05, h - 0.1], [0.06, h]], { segs: 8 });
  g.mat('paint', p.band || '#e7b547'); for (const yy of [0.9, 2.2, h - 0.6]) g.cyl(0, yy, 0, 0.062, 0.12, { segs: 8 });
  g.mat('cast', PAL.brass); g.lathe(0, 0, [[0.06, h], [0.08, h + 0.04], [0.04, h + 0.14], [0, h + 0.18]], { segs: 8 });
  g.mat('cast', '#2f3a36'); g.box(-0.5, h - 0.32, -0.02, 0.5, h - 0.28, 0.02); g.box(-0.02, h - 0.32, -0.5, 0.02, h - 0.28, 0.5);
  return { posts: [[0, 0, 0.1, 0, h]], tier: 's' };
});
// A music stand. p: { col }
defineProp('hollow.musicstand', (g, p) => {
  g.mat('cast', p.col || '#2a2a2a');
  for (let i = 0; i < 3; i++) { const a = i / 3 * 6.283; g.tube([[Math.cos(a) * 0.22, 0, Math.sin(a) * 0.22], [0, 0.12, 0]], 0.008, { segs: 4 }); }
  g.tube([[0, 0.1, 0], [0, 1.05, 0]], 0.01, { segs: 5 });
  g.push(); g.move(0, 1.12, 0.02); g.rotX(-0.35); g.box(-0.24, -0.16, -0.006, 0.24, 0.16, 0.006); g.box(-0.24, -0.18, -0.006, 0.24, -0.16, 0.05); g.pop();
  g.mat('paper', '#f1ead8'); g.push(); g.move(0, 1.12, 0.03); g.rotX(-0.35); g.box(-0.2, -0.13, 0.006, 0.2, 0.13, 0.01); g.pop();
  return { posts: [[0, 0, 0.12, 0, 1.2]], cast: false };
});
// A picnic cloth on the grass. p: { a, b, w, d, mat }
defineProp('hollow.cloth', (g, p) => {
  const w = p.w || 1.8, d = p.d || 1.4;
  g.mat(p.mat || 'stripe', p.a || '#d9472b'); g.box(-w / 2, 0.01, -d / 2, w / 2, 0.022, d / 2, { faces: 'YxXzZ' });
  g.mat('weave', p.b || '#efe6d2'); for (const sz of [-1, 1]) g.box(-w / 2, 0.01, sz * d / 2 - (sz > 0 ? 0.07 : 0), w / 2, 0.025, sz * d / 2 + (sz < 0 ? 0.07 : 0), { faces: 'YzZ' });
  return { cast: false, tier: 's' };
});
// A lidded picnic basket. p: { col }
defineProp('hollow.basket', (g, p) => {
  g.mat('cane', p.col || '#c9a46e'); g.box(-0.22, 0, -0.15, 0.22, 0.2, 0.15, { bevel: 0.03 });
  g.mat('cane', shadeHex(p.col || '#c9a46e', 0.82)); g.box(-0.23, 0.2, -0.16, 0.23, 0.24, 0.16, { bevel: 0.025 });
  g.mat('leather', '#6b3a22'); g.tube([[-0.12, 0.24, 0], [-0.1, 0.36, 0], [0.1, 0.36, 0], [0.12, 0.24, 0]], 0.012, { segs: 5 });
  g.mat('weave', '#d9472b'); g.box(-0.23, 0.12, 0.155, 0.23, 0.15, 0.162, { faces: 'Z' });
  return { solid: [[-0.22, 0, -0.15, 0.22, 0.24, 0.15]] };
});
// A spinball: soft leather panels. p: { a, b }
defineProp('hollow.ball', (g, p) => {
  g.mat('leather', p.a || '#c9552e'); g.ball(0, 0.11, 0, 0.11, 0.11, 0.11, { segs: 14, rings: 10 });
  g.mat('leather', p.b || '#efe6d2'); g.ball(0, 0.11, 0, 0.1115, 0.035, 0.1115, { segs: 14, rings: 3 });
  return { cast: true };
});
// A wooden lounger with a towel. p: { towel, wood, back (angle) }
defineProp('hollow.lounger', (g, p) => {
  const wood = p.wood || '#b8a27e'; g.mat('wood', wood);
  for (let i = 0; i < 8; i++) { const z = -0.2 + i * 0.16; g.box(-0.32, 0.3, z, 0.32, 0.33, z + 0.12, { bevel: 0.006 }); }
  for (const sx of [-1, 1]) { g.box(sx * 0.32 - 0.03, 0.25, -0.25, sx * 0.32 + 0.03, 0.33, 1.1, { bevel: 0.006 }); g.box(sx * 0.3 - 0.025, 0, 1.0, sx * 0.3 + 0.025, 0.3, 1.05); g.box(sx * 0.3 - 0.025, 0, -0.15, sx * 0.3 + 0.025, 0.3, -0.1); }
  // the back rest, raised
  g.push(); g.move(0, 0.33, -0.22); g.rotX(0.95); for (let i = 0; i < 4; i++) g.box(-0.32, 0.0, -0.18 * (i + 1), 0.32, 0.03, -0.18 * (i + 1) + 0.12, { bevel: 0.006 }); g.pop();
  if (p.towel) { g.mat('stripe', p.towel); g.box(-0.28, 0.33, 0.1, 0.28, 0.345, 1.05, { bevel: 0.01 }); g.push(); g.move(0, 0.345, -0.22); g.rotX(0.95); g.box(-0.27, 0.03, -0.62, 0.27, 0.045, 0.0); g.pop(); }
  return { solid: [[-0.35, 0, -0.6, 0.35, 0.35, 1.1]], spots: [{ type: 'sit', x: 0, y: 0.36, z: 0.35, yaw: Math.PI, tags: ['lounge', 'shore'] }] };
});
// A towel spread on the sand. p: { a }
defineProp('hollow.towel', (g, p) => {
  g.mat('stripe', p.a || '#2f8f8a'); g.box(-0.42, 0.005, -0.85, 0.42, 0.02, 0.85, { faces: 'YxXzZ' });
  g.mat('weave', '#efe6d2'); g.box(-0.42, 0.005, 0.72, 0.42, 0.024, 0.85, { faces: 'Y' });
  return { cast: false };
});
// A flat punt, pulled up, with its pole beside it. p: { col, gun }
defineProp('hollow.punt', (g, p) => {
  const L = 4.6, W = 1.1, D = 0.38, col = p.col || '#4a3a2c';
  g.mat('wood', col);
  g.box(-W / 2, 0.02, -L / 2 + 0.5, W / 2, 0.08, L / 2 - 0.5);
  for (const sx of [-1, 1]) g.box(sx * W / 2 - (sx > 0 ? 0.05 : 0), 0.02, -L / 2 + 0.2, sx * W / 2 + (sx < 0 ? 0.05 : 0), D, L / 2 - 0.2, { bevel: 0.01 });
  // raked square ends
  for (const sz of [-1, 1]) { g.push(); g.move(0, 0.05, sz * (L / 2 - 0.4)); g.rotX(sz * 0.7); g.box(-W / 2, 0, -0.03, W / 2, 0.5, 0.03); g.pop(); }
  g.mat('paint', p.gun || '#d9472b'); for (const sx of [-1, 1]) g.box(sx * W / 2 - 0.035, D, -L / 2 + 0.2, sx * W / 2 + 0.035, D + 0.04, L / 2 - 0.2, { bevel: 0.008 });
  g.mat('wood', '#8a6a48'); for (const z of [-0.6, 0.7]) g.box(-W / 2 + 0.05, 0.24, z - 0.12, W / 2 - 0.05, 0.28, z + 0.12, { bevel: 0.008 });
  g.mat('wood', '#c9a46e'); g.tube([[W / 2 + 0.25, 0.04, -2.2], [W / 2 + 0.3, 0.04, 2.6]], 0.025, { segs: 5 });
  return { solid: [[-W / 2, 0, -L / 2, W / 2, D, L / 2]], tier: 's' };
});
// Folded robes in a stack. p: { cols }
defineProp('hollow.robes', (g, p) => {
  const cols = p.cols || ['#e7b547', '#d9472b', '#2f8f8a']; let y = 0;
  cols.forEach((c, i) => { const hh = 0.075; g.mat('knit', c); g.box(-0.2 + (i % 2) * 0.01, y, -0.15, 0.2 + (i % 2) * 0.01, y + hh, 0.15, { bevel: 0.03 }); y += hh + 0.002; });
  return { cast: false };
});
// A three-legged orchard step-ladder, with a soft brush hung on it. p: { h, brush }
defineProp('hollow.stepladder', (g, p) => {
  const h = p.h || 2.3; g.mat('wood', '#b08d5e', { rough: 0.05 });
  for (const sx of [-1, 1]) g.tube([[sx * 0.32, 0, 0.35], [sx * 0.1, h, 0.0]], 0.028, { segs: 5 });
  g.tube([[0, 0, -0.9], [0, h - 0.05, -0.04]], 0.03, { segs: 5 });
  const n = Math.round(h / 0.32);
  for (let i = 1; i < n; i++) { const t = i / n, w = 0.32 - 0.22 * t, z = 0.35 - 0.35 * t; g.box(-w, h * t - 0.015, z - 0.05, w, h * t + 0.015, z + 0.05, { bevel: 0.005 }); }
  g.box(-0.16, h - 0.02, -0.12, 0.16, h + 0.02, 0.1, { bevel: 0.008 });
  if (p.brush !== false) {
    g.mat('leather', '#6b3a22'); g.tube([[0.12, h * 0.75, 0.12], [0.14, h * 0.68, 0.14]], 0.006, { segs: 3 });
    g.mat('wood', '#d9b25c'); g.tube([[0.14, h * 0.68, 0.14], [0.14, h * 0.55, 0.15]], 0.012, { segs: 5 });
    g.mat('felt', '#f1e2c0'); g.lathe(0.14, 0.15, [[0.0, h * 0.5], [0.03, h * 0.505], [0.035, h * 0.53], [0.02, h * 0.555], [0, h * 0.556]], { segs: 8 });
  }
  return { posts: [[0, -0.2, 0.35, 0, h]], spots: [{ type: 'work', x: 0, y: 0, z: 0.75, yaw: Math.PI, tags: ['brush', 'orchard'] }] };
});
// A crate of apples. p: { wood, full, label }
defineProp('hollow.applecrate', (g, p) => {
  const w = 0.56, h = 0.32, d = 0.38; g.mat('wood', p.wood || '#c9a46e', { rough: 0.1 });
  for (let i = 0; i < 3; i++) { const y0 = i * h / 3 + 0.006, y1 = (i + 1) * h / 3 - 0.006; g.box(-w / 2, y0, -d / 2, w / 2, y1, -d / 2 + 0.014); g.box(-w / 2, y0, d / 2 - 0.014, w / 2, y1, d / 2); g.box(-w / 2, y0, -d / 2, -w / 2 + 0.016, y1, d / 2); g.box(w / 2 - 0.016, y0, -d / 2, w / 2, y1, d / 2); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (w / 2 - 0.02) - 0.02, 0, sz * (d / 2 - 0.02) - 0.02, sx * (w / 2 - 0.02) + 0.02, h, sz * (d / 2 - 0.02) + 0.02);
  g.box(-w / 2 + 0.016, 0.006, -d / 2 + 0.014, w / 2 - 0.016, 0.02, d / 2 - 0.014, { faces: 'Y' });
  if (p.full !== false) {
    const r = new Rng(hashStr('ac' + (p.seed || 0)));
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      const c = r.chance(0.3) ? '#c8a03a' : r.chance(0.5) ? '#b3261e' : '#9a2a1e'; g.mat('glaze', c, { rough: -0.05 });
      g.ball(-w / 2 + 0.08 + i * 0.13 + r.f(-0.01, 0.01), h - 0.035, -d / 2 + 0.07 + j * 0.12, 0.042, 0.038, 0.042, { segs: 7, rings: 4 });
    }
  }
  if (p.label) { g.mat('paper', '#f1ead8'); g.box(-0.14, 0.1, d / 2 + 0.001, 0.14, 0.22, d / 2 + 0.004, { faces: 'Z' }); }
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], tier: 's', surf: 'wood' };
});
// A drinking tap: a cast post with a spout and a basin. p: { col }
defineProp('hollow.tap', (g, p) => {
  g.mat('cast', p.col || '#2f5a4a');
  g.lathe(0, 0, [[0.16, 0], [0.16, 0.06], [0.11, 0.12], [0.09, 0.2], [0.08, 0.95], [0.1, 1.0], [0.12, 1.06], [0.06, 1.12], [0, 1.14]], { segs: 12 });
  g.mat('cast', PAL.brass); g.tube([[0, 0.92, 0.06], [0, 0.95, 0.2], [0, 0.88, 0.26]], 0.018, { segs: 6 }); g.cyl(0, 0.98, 0.0, 0.03, 0.06, { segs: 6 });
  g.mat('stone', '#bfb4a2'); g.lathe(0, 0.3, [[0.0, 0.0], [0.2, 0.0], [0.22, 0.55], [0.28, 0.66], [0.26, 0.7], [0.19, 0.62], [0.0, 0.6]], { segs: 16 });
  g.mat('plain', '#5a7f86', { rough: -0.45 }); g.cyl(0, 0.63, 0.3, 0.18, 0.005, { segs: 14 });
  return { posts: [[0, 0, 0.14, 0, 1.1], [0, 0.3, 0.28, 0, 0.7]], tier: 's' };
});
// A broth urn on the warm shelf, lidded. p: { col }
defineProp('hollow.urn', (g, p) => {
  g.mat('cast', p.col || '#9a6a3a');
  g.lathe(0, 0, [[0.0, 0], [0.12, 0], [0.14, 0.04], [0.17, 0.12], [0.18, 0.4], [0.16, 0.46], [0.15, 0.48]], { segs: 14, capTop: false });
  g.lathe(0, 0, [[0.16, 0.47], [0.15, 0.5], [0.06, 0.55], [0.03, 0.58], [0.04, 0.61], [0, 0.62]], { segs: 14, capBottom: false });
  g.mat('cast', PAL.brass); g.tube([[0.17, 0.12, 0], [0.24, 0.11, 0], [0.26, 0.08, 0]], 0.014, { segs: 5 });
  for (const sx of [-1, 1]) g.tube([[sx * 0.17, 0.38, -0.04], [sx * 0.23, 0.38, 0], [sx * 0.17, 0.38, 0.04]], 0.008, { segs: 4 });
  return { cast: false };
});
// A kite-mender's cart: a box on two wheels with a striped canopy, kites hung under it, spools and patches.
defineProp('hollow.kitecart', (g) => {
  g.mat('paint', '#2f6f73'); g.box(-0.9, 0.5, -0.45, 0.9, 1.0, 0.45, { bevel: 0.015 });
  g.mat('wood', '#c9a46e', { rough: -0.05 }); g.box(-0.95, 1.0, -0.5, 0.95, 1.04, 0.5, { bevel: 0.01 });
  g.mat('paint', '#e7b547'); for (let i = 0; i < 3; i++) g.box(-0.82 + i * 0.56, 0.58, 0.452, -0.32 + i * 0.56, 0.92, 0.462, { bevel: 0.006 });
  for (const sx of [-1, 1]) { g.push(); g.move(sx * 0.95, 0.38, 0); g.rotZ(Math.PI / 2); g.mat('cast', '#3a3a36'); g.lathe(0, 0, [[0.32, -0.03], [0.38, -0.025], [0.38, 0.025], [0.32, 0.03]], { segs: 16, capTop: false, capBottom: false }); g.mat('wood', '#6b4a2f'); g.cyl(0, -0.04, 0, 0.05, 0.08, { segs: 8 }); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI; g.box(-0.32 * Math.cos(a) - 0.012, -0.012, -0.32 * Math.sin(a), 0.32 * Math.cos(a) + 0.012, 0.012, 0.32 * Math.sin(a)); } g.pop(); }
  g.mat('wood', '#6b4a2f'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.tube([[sx * 0.88, 1.04, sz * 0.45], [sx * 0.88, 2.15, sz * 0.45]], 0.02, { segs: 5 });
  g.tube([[0, 0.55, 0.45], [0, 0.3, 1.3]], 0.025, { segs: 5 });
  const stripes = ['#d9472b', '#efe6d2'];
  for (let i = 0; i < 8; i++) { g.mat('weave', stripes[i % 2]); const x0 = -1.0 + i * 0.25, x1 = x0 + 0.25; g.quad([x0, 2.3, -0.65], [x1, 2.3, -0.65], [x1, 2.1, 0.7], [x0, 2.1, 0.7], { double: true }); g.mat('weave', stripes[i % 2], { sway: 0.6 }); const v0 = g.buf.nv; g.quad([x0, 2.1, 0.7], [x1, 2.1, 0.7], [x1, 1.93, 0.71], [x0, 1.93, 0.71], { double: true }); for (const k of [0, 1, 4, 7]) g.param(v0 + k, 0); }
  // kites hung under the canopy, spools on the top
  const kc = [['#3b4a8f', '#e7b547'], ['#b8336a', '#2f8f8a'], ['#6b9f3e', '#d9472b']];
  kc.forEach((c, i) => { const x = -0.55 + i * 0.55; g.mat('weave', c[0]); g.quad([x, 2.0, -0.4], [x - 0.22, 1.72, -0.41], [x, 1.35, -0.4], [x, 1.35, -0.4], { double: true }); g.mat('weave', c[1]); g.quad([x, 2.0, -0.4], [x, 1.35, -0.4], [x + 0.22, 1.72, -0.41], [x + 0.22, 1.72, -0.41], { double: true }); });
  for (let i = 0; i < 4; i++) { g.mat('wood', '#8a6a48'); g.lathe(-0.6 + i * 0.32, 0.1, [[0.07, 1.04], [0.07, 1.06], [0.045, 1.07], [0.045, 1.15], [0.07, 1.16], [0.07, 1.18]], { segs: 10 }); g.mat('weave', ['#e8e0cc', '#d9472b', '#e7b547', '#2f8f8a'][i]); g.cyl(-0.6 + i * 0.32, 1.07, 0.1, 0.06, 0.08, { segs: 10 }); }
  g.mat('motif', '#b8336a'); g.box(0.3, 1.04, -0.35, 0.8, 1.07, 0.0, {});
  return { solid: [[-1.0, 0, -0.5, 1.0, 1.05, 0.5]], tier: 's', spots: [{ type: 'counter', x: 0, y: 0, z: -0.95, yaw: 0, tags: ['kitefield', 'mend'] }, { type: 'customer', x: 0.3, y: 0, z: 1.0, yaw: Math.PI }] };
});
// A weighing table with a hanging scale and a slate.
defineProp('hollow.weightable', (g) => {
  g.mat('wood', '#9a7a52', { rough: -0.05 }); g.box(-0.9, 0.82, -0.4, 0.9, 0.87, 0.4, { bevel: 0.01 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * 0.82 - 0.03, 0, sz * 0.33 - 0.03, sx * 0.82 + 0.03, 0.82, sz * 0.33 + 0.03);
  g.box(-0.82, 0.18, -0.36, 0.82, 0.21, 0.36);
  // the scale: a gallows post with a dial and a pan
  g.mat('cast', '#2f3a36'); g.tube([[0.6, 0.87, -0.3], [0.6, 1.75, -0.3], [0.3, 1.75, -0.3]], 0.02, { segs: 6 });
  g.mat('cast', PAL.brass); g.push(); g.move(0.3, 1.55, -0.3); g.rotX(Math.PI / 2); g.cyl(0, -0.03, 0, 0.12, 0.06, { segs: 16 }); g.pop();
  g.mat('plain', '#f1ead8'); g.box(-0.11 + 0.3, 1.44, -0.27, 0.11 + 0.3, 1.66, -0.266, { faces: 'Z' });
  g.mat('cast', '#2f3a36'); for (let k = 0; k < 3; k++) { const a = k / 3 * 6.283; g.tube([[0.3, 1.42, -0.3], [0.3 + Math.cos(a) * 0.17, 1.1, -0.3 + Math.sin(a) * 0.17]], 0.004, { segs: 3, caps: false }); }
  g.mat('cast', PAL.brass); g.lathe(0.3, -0.3, [[0.0, 1.06], [0.15, 1.08], [0.19, 1.12], [0.18, 1.13], [0.14, 1.1], [0, 1.09]], { segs: 14 });
  g.mat('glaze', '#b3261e'); for (let i = 0; i < 4; i++) g.ball(0.26 + (i % 2) * 0.08, 1.14, -0.33 + Math.floor(i / 2) * 0.07, 0.04, 0.037, 0.04, { segs: 7, rings: 4 });
  g.mat('slate', '#2b2f2c'); g.box(-0.75, 0.87, 0.05, -0.2, 0.89, 0.35);
  return { solid: [[-0.9, 0, -0.4, 0.9, 0.87, 0.4]], tier: 's', spots: [{ type: 'work', x: 0, y: 0, z: -0.75, yaw: 0, tags: ['weigh', 'carry', 'orchard'] }] };
});
// Hooks with hung robes on a rail. p: { n, cols }
defineProp('hollow.robehooks', (g, p) => {
  const n = p.n || 5, cols = p.cols || ['#2f8f8a', '#e7b547', '#b8336a', '#3b4a8f', '#d9472b'], w = n * 0.42;
  g.mat('wood', '#6b4a2f'); g.box(-w / 2, 1.62, -0.03, w / 2, 1.72, 0.0, { bevel: 0.008 });
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.21 + i * 0.42; g.mat('cast', PAL.brass); g.tube([[x, 1.67, 0], [x, 1.66, 0.07], [x, 1.69, 0.09]], 0.008, { segs: 4 });
    if ((i * 7 + n) % 3 !== 0) { g.mat('knit', cols[i % cols.length], { sway: 0.3 }); const v0 = g.buf.nv; g.quad([x - 0.17, 1.65, 0.04], [x + 0.17, 1.65, 0.04], [x + 0.21, 0.78, 0.09], [x - 0.21, 0.78, 0.09], { double: true }); for (const k of [0, 1, 4, 7]) g.param(v0 + k, 0); g.box(x - 0.06, 1.55, 0.02, x + 0.06, 1.66, 0.09); }
  }
  return { cast: false };
});
// The wind-arrow joke: a weathervane on a post with its arrow pointing at the ground.
defineProp('hollow.windvane', (g) => {
  g.mat('wood', '#efe6d2'); g.box(-0.05, 0, -0.05, 0.05, 2.4, 0.05, { bevel: 0.01 });
  g.mat('paint', '#d9472b'); g.box(-0.05, 0.6, -0.051, 0.05, 0.75, 0.051); g.box(-0.05, 1.3, -0.051, 0.05, 1.45, 0.051);
  g.mat('cast', '#2f3a36'); g.box(-0.4, 2.4, -0.008, 0.4, 2.43, 0.008); g.box(-0.008, 2.4, -0.4, 0.008, 2.43, 0.4);
  g.mat('cast', PAL.brass); for (const [x, z] of [[0.45, 0], [-0.45, 0], [0, 0.45], [0, -0.45]]) g.ball(x, 2.415, z, 0.03, 0.03, 0.03, { segs: 6, rings: 4 });
  // the arrow, hung straight down from the top: there is no wind to turn it
  g.mat('paint', '#e7b547'); g.tube([[0.0, 2.75, 0.06], [0.0, 2.45, 0.06]], 0.012, { segs: 5 });
  g.box(-0.01, 2.75, 0.03, 0.01, 2.95, 0.09);
  g.push(); g.move(0, 2.48, 0.06); g.rotX(Math.PI); g.cyl(0, 0, 0, 0.07, 0.14, { r1: 0.0, segs: 4 }); g.pop();
  g.mat('cast', '#2f3a36'); g.cyl(0, 2.43, 0, 0.025, 0.4, { segs: 6 });
  return { posts: [[0, 0, 0.08, 0, 2.5]], tier: 's' };
});
// A lidded cup on a saucer, warm shelf style (smaller than the exemplar's). p: { c }
defineProp('hollow.cup', (g, p) => {
  const c = p.c || '#e9e1cf'; g.mat('glaze', c);
  g.lathe(0, 0, [[0, 0], [0.03, 0], [0.04, 0.012], [0.042, 0.085], [0.038, 0.087], [0.033, 0.014], [0, 0.012]], { segs: 10, capTop: false });
  g.mat('glaze', shadeHex(c, 0.78)); g.lathe(0, 0, [[0.045, 0.085], [0.042, 0.092], [0.012, 0.1], [0.012, 0.11], [0, 0.112]], { segs: 10, capBottom: false, capTop: false });
  return { cast: false };
});

// A placed group: a picnic on a cloth, with sit spots round it. Returns nothing.
export function picnic(s, x, z, yaw, seed) {
  const r = new Rng(hashStr('picnic' + seed)), y = heightAt(x, z);
  const a = r.pick(FESTIVE.slice(0, 7)), b = r.pick(['#efe6d2', '#f3d9a0', '#2b2f3a']);
  prop(s, 'hollow.cloth', x, y, z, yaw, { a, b, mat: r.pick(['stripe', 'motif', 'weave']), w: r.f(1.6, 2.2), d: r.f(1.3, 1.6) });
  const c = Math.cos(yaw), sn = Math.sin(yaw), L = (lx, lz) => [x + c * lx + sn * lz, z - sn * lx + c * lz];
  let q = L(r.f(-0.5, 0.5), r.f(-0.3, 0.2)); prop(s, 'hollow.basket', q[0], y + 0.022, q[1], yaw + r.f(-0.4, 0.4), { col: r.pick(['#c9a46e', '#b08d5e', '#d9b77e']) });
  for (let i = 0; i < r.i(2, 4); i++) { q = L(r.f(-0.7, 0.7), r.f(-0.5, 0.5)); prop(s, 'hollow.cup', q[0], y + 0.022, q[1], 0, { c: r.pick(['#e9e1cf', '#3d6f8a', '#c9552e', '#e7b547']) }); }
  if (r.chance(0.7)) { q = L(r.f(-0.4, 0.4), r.f(0.1, 0.4)); prop(s, 'bowl', q[0], y + 0.022, q[1], 0, { glaze: r.pick(['#e9e1cf', '#2f6f73', '#b5653a']) }); }
  if (r.chance(0.5)) { q = L(r.f(0.4, 0.8), r.f(-0.5, 0.5)); prop(s, 'crock', q[0], y + 0.022, q[1], 0, { h: 0.2, r: 0.07, glaze: '#e8d9b8' }); }
  const seats = [[0, -0.9, 0], [0, 0.9, Math.PI], [-1.2, 0, -Math.PI / 2], [1.2, 0, Math.PI / 2]];
  seats.forEach((st, i) => { if (i > 1 && r.chance(0.75)) return; q = L(st[0], st[1]); s.spot('sit', q[0], y + 0.05, q[1], yaw + st[2], { tags: ['picnic', 'ground', 'hollow'], low: true }); });
}

// Ground-standing prop: places a prop at the ground height under (x, z)
export function onGround(s, name, x, z, yaw, p, o) { return prop(s, name, x, heightAt(x, z), z, yaw, p, o); }

