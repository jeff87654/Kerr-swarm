// Parts for the back wall's high tiers (lm_back_upper.js): small helpers, the riser with its windows, the broad rail,
// rope nets (upright and overhead), the cab lobby, the wall lift between tiers, and this landmark's own props.
// Everything long that runs along x is drawn in short pieces, because x bends with the drum, sharply near the axis.
import * as THREE from 'three';
import { defineProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { lamp } from '../world/kit.js';
import { Geo, MeshBuf } from '../world/meshbuilder.js';
import { Rng, hashStr, shadeHex } from '../core/util.js';

export const PI = Math.PI;
export const ENV = { exposure: 1.0, autoKey: 0.19, autoMin: 0.02, autoMax: 5, bloom: 0.045, warmth: 0.05, contrast: 1.1, saturation: 1.12 };
export const SKY = { sky: true, skyTop: 30, sun: true, sunPower: 34, far: 2400, reverb: 'open' };

// ---------------------------------------------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------------------------------------------
// Split [a, b] into pieces no longer than `step` and call fn(p0, p1, i).
export function runX(a, b, step, fn) { const n = Math.max(1, Math.ceil((b - a) / step)); for (let i = 0; i < n; i++) fn(a + (b - a) * i / n, a + (b - a) * (i + 1) / n, i); }
// Points along x from a to b (every `step` metres) at height y and depth z, for tubes that must bend.
export function lineX(a, b, y, z, step = 2) { const n = Math.max(1, Math.ceil(Math.abs(b - a) / step)), out = []; for (let i = 0; i <= n; i++) out.push([a + (b - a) * i / n, y, z]); return out; }

export function toast(game, text, kind) { if (game.ui) game.ui.toast(text, { kind: kind || 'info' }); }
export function find(game, id) { if (game.journal) game.journal.find(id); }
export function sfx(game, name, f, x, y, z) { if (game.audio && game.sfxAt) game.sfxAt(name, f, x, y, z); }

// Say lines as someone (a name, or { name, colour }), safely.
export async function say(game, who, lines) {
  if (!game.ui) return;
  game.busy++;
  try { await game.ui.say(who, lines); } finally { game.busy--; }
}
// Read a sign spec as a short run of lines.
export async function readSpec(game, spec, extra) {
  const lines = [];
  if (spec.text) lines.push(spec.text + (spec.sub ? '. ' + spec.sub + '.' : '.'));
  if (spec.lines) { let buf = ''; for (const l of spec.lines) { buf = buf ? buf + ' ' + l : l; if (buf.length > 80) { lines.push(buf); buf = ''; } } if (buf) lines.push(buf); }
  if (extra) lines.push(...(Array.isArray(extra) ? extra : [extra]));
  await say(game, spec.title || spec.text || 'A notice', lines.length ? lines : ['(blank)']);
}
// A small menu, paid from the wallet. menu: { title, note, items: [{ id, name, desc, price }] }. Returns the item or null.
export async function buy(game, menu, kicker) {
  if (!game.ui || !game.ui.menu) return null;
  game.busy++;
  try {
    const items = menu.items.map((it) => Object.assign({}, it, { disabled: !!(game.wallet && it.price > game.wallet.kwh + 1e-6) }));
    const id = await game.ui.menu({ kicker: kicker || '', title: menu.title, note: menu.note, items, wallet: game.wallet ? game.wallet.kwh : 0 });
    if (!id) return null;
    const it = menu.items.find((q) => q.id === id); if (!it) return null;
    if (game.wallet && it.price > 0 && !game.wallet.spend(it.price, it.name)) return null;
    return it;
  } finally { game.busy--; }
}
// A seat the player can take: (x, y, z) the floor under it, yaw the way it faces (prop convention: 0 faces +z).
export function seat(s, x, y, z, yaw, label, o = {}) {
  return s.interact({ x, y: y + 0.55, z, radius: o.radius || 1.0,
    prompt: (game) => (game.player.seat ? 'Stand up' : label),
    onUse(game) {
      const p = game.player; if (p.seat) { p.stand(); return; }
      p.sit({ x, y: y + (o.lift || 0), z, yaw: PI - yaw, eye: o.eye || 1.12 }); p.yaw = PI - yaw; p.pitch = o.pitch || 0.02;
      if (o.onSit) o.onSit(game);
    } });
}
// The tier's own glow from the Hollow, following the sunline. k scales it (how much of the Hollow this terrace sees).
export function skyGlow(game, s, box, k) {
  const a = s.ambient({ box, sky: [0.5, 0.56, 0.42], ground: [0.32, 0.34, 0.26], power: 1, skylit: true, spec: 0.35, groundK: 1 });
  s.every(() => { const sun = game.clock ? game.clock.sun() : 1; a.scale = k * (34 * 0.2 * sun + 0.05 * (1 - sun)); });
  return a;
}
// A floor that bends: drawn in pieces no wider than `step` along x (the collider stays one flat box).
export function bentFloor(s, x0, z0, x1, z1, y, mat, tint, step, o = {}) {
  const g = s.g;
  runX(x0, x1, step, (a, b) => { g.mat(mat, tint, o.matOpts); g.box(a, y - (o.slab || 0.02), z0, b, y, z1, { faces: o.faces || 'Y' }); s.flush({ tier: 's', cast: false }); });
  if (!o.noCollide) s.solid(x0, y - 0.5, z0, x1, y, z1, { surf: o.surf || 'stone' });
}
// A box along x drawn in short pieces (for long things that must bend), with an optional collider.
export function bentBox(s, x0, y0, z0, x1, y1, z1, mat, tint, step, o = {}) {
  const g = s.g;
  runX(x0, x1, step, (a, b) => { g.mat(mat, tint, o.matOpts); g.box(a, y0, z0, b, y1, z1, { faces: o.faces, bevel: o.bevel, aoBottom: o.aoBottom }); });
  s.flush({ tier: o.tier || 's', cast: !!o.cast });
  if (o.solid) s.solid(x0, y0, z0, x1, y1, z1, { surf: o.surf || 'stone' });
}
// A mesh of its own that the world places from mesh.userData.origin every frame (for things that move).
export function movable(s, draw, origin, o = {}) {
  const g = new Geo(new MeshBuf(1024, 2048)); draw(g);
  if (!g.buf.ni) return null;
  const mesh = new THREE.Mesh(g.buf.toGeometry(), s.world.mats.opaque);
  s.world.addRenderable(mesh, { frame: s.frame, origin: origin.slice(), center: o.center || [0, 0, 0], radius: o.radius || 6, far: o.far || 150, caster: false, scope: s });
  s.meshes.push(mesh);
  return mesh;
}

// ---------------------------------------------------------------------------------------------------------------
// The riser behind a terrace (face toward -z at z = 0) with the windows of the oldest people's flats.
// Bays are 5.5 m and rows 4.17 m, as the engine paints the wall above, so the two read as one.
// o: { x0, x1, h, tint, stone, trim, gaps: [[a, b]], doors: [x...], seed, lit, step }   Returns { doors: [{ x }] }.
// ---------------------------------------------------------------------------------------------------------------
export const BAY = 5.5, ROW = 50 / 12;
const CURTAINS = ['#d9a46a', '#c9763e', '#e2c48a', '#b8584a', '#d8b06c', '#9a6a8a', '#7a9a8a', '#e6b980'];
const DOOR_COLS = ['#2f5d5a', '#8a3a2e', '#5b4060', '#2a4a6a', '#6b5a2a', '#3d5a3a'];
export function riser(s, o) {
  const g = s.g, x0 = o.x0, x1 = o.x1, h = o.h || 12.6, tint = o.tint || '#d9c8aa', stone = o.stone || '#b4a48a', trim = o.trim || '#2f5d5a', step = o.step || 4;
  const r = new Rng(hashStr('bu-riser' + (o.seed || 0)));
  const inGap = (a, b) => (o.gaps || []).some((gp) => b > gp[0] && a < gp[1]);
  runX(x0, x1, step, (a, b) => {
    g.mat('stone', stone); g.box(a, 0, 0, b, 1.0, 0.6, { faces: 'z', aoBottom: 0.7 });
    g.mat('plaster', tint); g.box(a, 1.0, 0, b, h, 0.6, { faces: 'zY' });
    g.mat('stone', shadeHex(stone, 0.9)); g.box(a, 0.98, -0.05, b, 1.06, 0, { faces: 'zY' });
    s.flush({ tier: 's' });
  });
  s.solid(x0, 0, 0, x1, Math.max(h + 0.6, o.solidH || 0), 0.6);
  runX(x0, x1, Math.min(step, 3), (a, b) => {
    g.mat('stone', stone);
    for (const yy of [ROW, 2 * ROW]) if (yy < h - 1) g.extrude([[0, yy - 0.12], [0, yy + 0.12], [-0.1, yy + 0.12], [-0.14, yy + 0.06], [-0.1, yy - 0.06], [-0.04, yy - 0.12]], a, b, 'x');
    g.extrude([[0, h - 0.5], [0, h], [-0.62, h], [-0.62, h - 0.12], [-0.4, h - 0.2], [-0.22, h - 0.3], [-0.12, h - 0.42]], a, b, 'x');
  });
  s.flush({ tier: 's' });
  // the planted gutter on the cornice
  g.mat('soil', '#ffffff'); runX(x0, x1, step, (a, b) => g.box(a, h, -0.6, b, h + 0.05, 0.4, { faces: 'Y' }));
  for (let x = x0 + 0.3; x < x1 - 0.2; x += 0.6) {
    const sc = r.f(0.6, 1.2);
    g.mat(r.chance(0.6) ? 'leafA' : 'fern', r.chance(0.2) ? '#d8e8b0' : '#ffffff', { sway: 0.4 });
    g.card(x + r.f(-0.2, 0.2), h + 0.02, r.f(-0.4, 0.1), 0.9 * sc, 0.7 * sc, r.f(0, 3.1), { tilt: r.f(-0.3, 0.3) });
    if (r.chance(0.45)) { g.mat('leafB', '#ffffff', { sway: 0.6 }); g.card(x, h - 0.9 * sc * (o.trail || 1.4), -0.66, 0.5 * sc, 0.95 * sc * (o.trail || 1.4), 0, { tilt: -0.08 }); }
  }
  s.flush({ tier: 's', cast: false });
  for (let k = Math.ceil(x0 / BAY); k * BAY <= x1; k++) {
    const x = k * BAY; if (x < x0 + 0.3 || x > x1 - 0.3 || inGap(x - 0.3, x + 0.3)) continue;
    g.mat('stone', stone); g.box(x - 0.3, 0, -0.2, x + 0.3, h - 0.5, 0, { faces: 'xXz', aoBottom: 0.7 });
    g.box(x - 0.36, 0, -0.26, x + 0.36, 0.5, 0, { faces: 'xXzY', aoBottom: 0.7 });
  }
  s.flush({ tier: 's' });
  const doors = [];
  const doorBays = new Set((o.doors || []).map((x) => Math.floor(x / BAY)));
  for (let k = Math.floor(x0 / BAY); k * BAY < x1; k++) {
    const wa = (k + 0.18) * BAY, wb = (k + 0.72) * BAY;
    if (wa < x0 + 0.4 || wb > x1 - 0.4 || inGap(wa - 0.3, wb + 0.3)) continue;
    for (const row of [1, 2]) if ((row + 0.8) * ROW < h - 0.6) windowPane(s, wa, wb, (row + 0.25) * ROW, (row + 0.8) * ROW, r, trim, stone, o.lit === undefined ? 0.4 : o.lit, row === 1 && r.chance(0.55));
    if (doorBays.has(k)) { const dx = (k + 0.45) * BAY; doors.push({ x: dx }); flatDoor(s, dx, r, trim, stone); }
    else for (const c of [wa + 0.35, wb - 1.25]) windowPane(s, c, c + 0.9, 1.05, 2.75, r, trim, stone, 0.35, false);
  }
  return { doors };
}
function windowPane(s, a, b, y0, y1, r, trim, stone, litShare, box) {
  const g = s.g, w = b - a;
  if (r.chance(litShare)) g.mat('weave', CURTAINS[r.i(0, CURTAINS.length - 1)], { emissive: 1.3, night: true });
  else g.mat('plain', '#1d2428', { rough: -0.45 });
  g.box(a, y0, -0.02, b, y1, -0.01, { faces: 'z' });
  g.mat('paint', trim);
  const bars = w > 1.6 ? 3 : 2;
  for (let i = 1; i < bars; i++) { const x = a + w * i / bars; g.box(x - 0.03, y0, -0.06, x + 0.03, y1, -0.02, { faces: 'xXz' }); }
  g.box(a, y0 + (y1 - y0) * 0.72 - 0.03, -0.06, b, y0 + (y1 - y0) * 0.72 + 0.03, -0.02, { faces: 'yYz' });
  g.mat('stone', stone);
  g.box(a - 0.14, y0 - 0.02, -0.12, a, y1 + 0.02, 0, { faces: 'xXz' }); g.box(b, y0 - 0.02, -0.12, b + 0.14, y1 + 0.02, 0, { faces: 'xXz' });
  g.box(a - 0.18, y1, -0.14, b + 0.18, y1 + 0.18, 0, { faces: 'xXzYy' });
  g.box(a - 0.2, y0 - 0.1, -0.2, b + 0.2, y0, 0, { faces: 'xXzY' });
  s.flush({ tier: 's' });
  if (box) {
    g.mat('wood', ['#2f6f73', '#8a3a2e', '#5b4060', '#6b8f4e'][r.i(0, 3)]); g.box(a + 0.1, y0 - 0.42, -0.42, b - 0.1, y0 - 0.1, -0.2, { faces: 'xXzY' });
    for (let x = a + 0.25; x < b - 0.2; x += 0.32) {
      g.mat(r.chance(0.5) ? 'blossom' : 'leafA', '#ffffff', { sway: 0.5 }); g.card(x, y0 - 0.12, -0.31, 0.38, 0.36, r.f(0, 3), { tilt: r.f(-0.2, 0.2) });
      if (r.chance(0.5)) { g.mat('leafB', '#ffffff', { sway: 0.6 }); g.card(x, y0 - 1.25, -0.45, 0.3, 1.1, 0, { tilt: -0.1 }); }
    }
    s.flush({ tier: 'd', cast: false });
  }
}
function flatDoor(s, x, r, trim, stone) {
  const g = s.g, w = 1.1, hh = 2.3, a = x - w / 2, b = x + w / 2;
  g.mat('plain', '#15191b'); g.box(a, 0, -0.01, b, hh + 0.5, 0, { faces: 'z' });
  const col = DOOR_COLS[r.i(0, DOOR_COLS.length - 1)];
  g.mat('wood', col, { rough: -0.05 }); g.box(a + 0.03, 0.02, -0.06, b - 0.03, hh, -0.01, { bevel: 0.01 });
  g.mat('wood', shadeHex(col, 1.2)); for (const p of [[0.18, 0.95], [1.12, hh - 0.16]]) g.box(a + 0.14, p[0], -0.075, b - 0.14, p[1], -0.055, { bevel: 0.008 });
  g.mat('weave', '#e2c48a', { emissive: 1.6, night: true }); g.box(a + 0.06, hh + 0.06, -0.03, b - 0.06, hh + 0.46, -0.02, { faces: 'z' });
  g.mat('paint', trim); g.box(a + 0.04, hh + 0.02, -0.06, b - 0.04, hh + 0.06, -0.02); g.box(x - 0.02, hh + 0.06, -0.05, x + 0.02, hh + 0.46, -0.02);
  g.mat('cast', '#c8a45a'); g.cyl(b - 0.16, 1.0, -0.08, 0.03, 0.03, { segs: 8 }); g.box(x - 0.1, 1.45, -0.08, x + 0.1, 1.48, -0.07);
  g.mat('stone', stone);
  g.box(a - 0.2, 0, -0.16, a, hh + 0.55, 0, { faces: 'xXzY', aoBottom: 0.7 }); g.box(b, 0, -0.16, b + 0.2, hh + 0.55, 0, { faces: 'xXzY', aoBottom: 0.7 });
  g.box(a - 0.28, hh + 0.5, -0.22, b + 0.28, hh + 0.72, 0, { faces: 'xXzYy' });
  g.box(a - 0.15, 0, -0.5, b + 0.15, 0.1, 0, { faces: 'xXzY', aoBottom: 0.8 });
  s.flush({ tier: 's' });
}

// ---------------------------------------------------------------------------------------------------------------
// The broad rail at a terrace's open edge: the slab's edge and corbels below, a stone parapet, bronze balusters, an
// oak rail to lean on, a planted lip over the drop. Rail line at z = zr. o: { x0, x1, zr, stone, bronze, oak, barrier, step }
// ---------------------------------------------------------------------------------------------------------------
export function broadRail(s, o) {
  const g = s.g, x0 = o.x0, x1 = o.x1, zr = o.zr, st = o.stone || '#b9a98e', br = o.bronze || '#5a4a33', oak = o.oak || '#8a6240', step = o.step || 4;
  const zo = zr - 0.4, r = new Rng(hashStr('bu-rail' + x0 + zr));
  runX(x0, x1, Math.max(step, 4), (a, b) => {
    g.mat('stone', shadeHex(st, 0.82)); g.box(a, -1.5, zo - 0.75, b, -0.02, 0, { faces: 'zy' });
    g.mat('stone', shadeHex(st, 0.95)); g.box(a, -0.35, zo - 0.85, b, -0.02, zo - 0.75, { faces: 'zyY' }); g.box(a, -1.6, zo - 0.8, b, -1.4, zo - 0.7, { faces: 'zyY' });
    s.flush({ tier: 's' });
  });
  for (let k = Math.ceil(x0 / BAY); k * BAY <= x1; k++) {
    const x = k * BAY; if (x < x0 + 0.5 || x > x1 - 0.5) continue;
    g.mat('stone', shadeHex(st, 0.78));
    g.at(x, 0, 0); g.extrude([[zo - 0.7, -1.5], [zo + 2.4, -1.5], [zo + 2.4, -5.2], [zo + 1.6, -4.6], [zo + 0.4, -3.0], [zo - 0.4, -2.0]], -0.35, 0.35, 'x'); g.pop();
  }
  s.flush({ tier: 's' });
  runX(x0, x1, step, (a, b) => {
    g.mat('stone', st); g.box(a, 0, zo, b, 0.55, zr, { faces: 'zZ', aoBottom: 0.7 });
    g.mat('stone', shadeHex(st, 1.08)); g.box(a, 0.55, zo - 0.04, b, 0.62, zr + 0.04, { faces: 'zZYy' });
  });
  s.flush({ tier: 's' });
  g.mat('cast', br);
  for (let x = x0 + 0.25; x < x1 - 0.1; x += 0.42) g.lathe(x, zr - 0.2, [[0.035, 0.62], [0.03, 0.66], [0.018, 0.72], [0.028, 0.84], [0.016, 0.96], [0.026, 1.0]], { segs: 6, capBottom: false, capTop: false });
  s.flush({ tier: 'd', cast: false });
  runX(x0, x1, Math.min(step, 3), (a, b) => {
    g.mat('cast', br); g.box(a, 0.99, zr - 0.26, b, 1.01, zr - 0.14, { faces: 'yY' });
    g.mat('wood', oak, { rough: -0.12 }); g.extrude([[zo - 0.04, 1.01], [zr + 0.05, 1.01], [zr + 0.07, 1.04], [zr + 0.05, 1.08], [zo + 0.02, 1.1], [zo - 0.05, 1.07]], a, b, 'x');
  });
  s.flush({ tier: 's' });
  s.solid(x0, 0, zo - 0.9, x1, 1.1, zr);
  s.solid(x0, 1.1, zo - 0.9, x1, o.barrier || 6, zr);
  runX(x0, x1, 4, (a, b) => { g.mat('stone', shadeHex(st, 0.9)); g.box(a, -0.35, zo - 0.75, b, 0.3, zo, { faces: 'zY' }); g.mat('soil', '#ffffff'); g.box(a, 0.28, zo - 0.7, b, 0.31, zo, { faces: 'Y' }); });
  s.flush({ tier: 's' });
  for (let x = x0 + 0.2; x < x1 - 0.2; x += 0.5) {
    const sc = r.f(0.7, 1.25);
    g.mat(r.chance(0.3) ? 'blossom' : 'leafA', r.chance(0.25) ? '#e8f0c0' : '#ffffff', { sway: 0.5 }); g.card(x, 0.28, zo - 0.38 + r.f(-0.15, 0.15), 0.6 * sc, 0.5 * sc, r.f(0, 3.1), { tilt: r.f(-0.25, 0.25) });
    if (r.chance(0.6)) { g.mat('leafB', '#ffffff', { sway: 0.7 }); const hh = r.f(0.8, 2.2) * (o.trail || 1); g.card(x + 0.1, 0.3 - hh, zo - 0.78, 0.42, hh, 0, { tilt: -0.04 }); }
  }
  s.flush({ tier: 's', cast: false });
}

// Rope netting in a plane of constant z, diamond mesh. o: { x0, x1, z, y0, y1, cell, tint, r }
export function netX(s, o) {
  const g = s.g, c = o.cell || 0.45, r = o.r || 0.008; g.mat('weave', o.tint || '#d8cdb0');
  const H = o.y1 - o.y0;
  runX(o.x0, o.x1, o.step || 6, (a, b) => {
    for (let x = a - H; x < b; x += c) {
      for (const d of [1, -1]) {
        let xa = x, xb = x + d * H; if (d < 0) { xa = x + H; xb = x; }
        const ya = o.y0, yb = o.y1;
        const clip = (xx) => Math.max(a, Math.min(b, xx));
        const ca = clip(xa), cb = clip(xb); if (Math.abs(cb - ca) < 0.02) continue;
        const ty = (xx) => ya + (yb - ya) * (xx - xa) / (xb - xa);
        g.tube([[ca, ty(ca), o.z], [cb, ty(cb), o.z]], r, { segs: 3, caps: false });
      }
    }
    s.flush({ tier: 'd', cast: false });
  });
  g.mat('weave', shadeHex(o.tint || '#d8cdb0', 0.8));
  g.tube(lineX(o.x0, o.x1, o.y1, o.z, 2), r * 3, { segs: 5 }); g.tube(lineX(o.x0, o.x1, o.y0, o.z, 2), r * 3, { segs: 5 });
  s.flush({ tier: 's', cast: false });
}
// The same in a plane of constant x. o: { x, z0, z1, y0, y1, cell, tint }
export function netZ(s, o) {
  const g = s.g, c = o.cell || 0.45, r = o.r || 0.008; g.mat('weave', o.tint || '#d8cdb0');
  const H = o.y1 - o.y0, a = o.z0, b = o.z1;
  for (let z = a - H; z < b; z += c) for (const d of [1, -1]) {
    const za = d > 0 ? z : z + H, zb = d > 0 ? z + H : z;
    const ca = Math.max(a, Math.min(b, za)), cb = Math.max(a, Math.min(b, zb)); if (Math.abs(cb - ca) < 0.02) continue;
    const ty = (zz) => o.y0 + H * (zz - za) / (zb - za);
    g.tube([[o.x, ty(ca), ca], [o.x, ty(cb), cb]], r, { segs: 3, caps: false });
  }
  s.flush({ tier: 'd', cast: false });
  g.mat('weave', shadeHex(o.tint || '#d8cdb0', 0.8)); g.tube([[o.x, o.y1, a], [o.x, o.y1, b]], r * 3, { segs: 5 }); g.tube([[o.x, o.y0, a], [o.x, o.y0, b]], r * 3, { segs: 5 });
  s.flush({ tier: 's', cast: false });
}
// A flat net overhead at height y over [x0, x1] x [z0, z1], square mesh, with heavier ropes every `rib` cells.
export function netRoof(s, o) {
  const g = s.g, c = o.cell || 0.6, r = o.r || 0.009, y = o.y, tint = o.tint || '#d8cdb0';
  for (let z = o.z0, i = 0; z <= o.z1 + 1e-3; z += c, i++) { g.mat('weave', i % (o.rib || 8) ? tint : shadeHex(tint, 0.75)); g.tube(lineX(o.x0, o.x1, y + (i % 2) * 0.01, z, 2), i % (o.rib || 8) ? r : r * 3, { segs: 3, caps: false }); if (i % 6 === 5) s.flush({ tier: 's', cast: false }); }
  s.flush({ tier: 's', cast: false });
  runX(o.x0, o.x1, 6, (a, b) => {
    for (let x = Math.ceil(a / c) * c, i = 0; x < b; x += c, i++) { const k = Math.round(x / c); g.mat('weave', k % (o.rib || 8) ? tint : shadeHex(tint, 0.75)); g.tube([[x, y, o.z0], [x, y, o.z1]], k % (o.rib || 8) ? r : r * 3, { segs: 3, caps: false }); }
    s.flush({ tier: 's', cast: false });
  });
}

// The end of a terrace: a pier against the wall, full height, with quoins, and a garden wall out to the rail.
export function endPier(s, xa, xb, zr, h, o = {}) {
  const g = s.g, tint = o.tint || '#d6c4a4', st = o.stone || '#b4a48a', r = new Rng(hashStr('bu-pier' + xa + zr));
  const zf = zr - 1.0, zp = o.zp || -2.6, gh = o.gh || 2.7;
  g.mat('plaster', tint); g.box(xa, -1.5, zp, xb, h + 0.6, 0, { faces: 'xXzY', aoBottom: 0.7 });
  g.mat('stone', st);
  for (let y = 0, k = 0; y < h; y += 0.55, k++) { const w = k % 2 ? 0.35 : 0.6; g.box(xa - 0.03, y + 0.02, zp - 0.03, xb + 0.03, y + 0.53, zp + w, { faces: 'xXzY' }); }
  g.box(xa - 0.08, h, zp - 0.1, xb + 0.08, h + 0.7, 0, { faces: 'xXzYy' });
  g.mat('plaster', shadeHex(tint, 0.94)); g.box(xa, -1.5, zf, xb, gh, zp, { faces: 'xXzY', aoBottom: 0.7 });
  g.mat('stone', st); g.box(xa - 0.08, gh, zf - 0.08, xb + 0.08, gh + 0.14, zp, { faces: 'xXzYy' }); g.box(xa - 0.05, 0, zf, xb + 0.05, 0.4, zp, { faces: 'xXY', aoBottom: 0.7 });
  s.flush({ tier: 's' });
  g.mat('soil', '#ffffff'); g.box(xa + 0.05, gh + 0.14, zf + 0.1, xb - 0.05, gh + 0.16, zp, { faces: 'Y' });
  for (let z = zf + 0.3; z < zp; z += 0.45) {
    g.mat(r.chance(0.3) ? 'blossom' : 'leafA', '#ffffff', { sway: 0.5 }); g.card((xa + xb) / 2 + r.f(-0.15, 0.15), gh + 0.14, z, 0.7, 0.55, r.f(0, 3), { tilt: r.f(-0.3, 0.3) });
    if (r.chance(0.7)) { g.mat('leafB', '#ffffff', { sway: 0.6 }); const hh = r.f(0.7, 1.8), sx = o.inner > 0 ? 1 : -1; g.card(sx > 0 ? xb + 0.06 : xa - 0.06, gh + 0.1 - hh, z, 0.45, hh, sx * PI / 2, { tilt: -0.05 }); }
  }
  s.flush({ tier: 's', cast: false });
  s.solid(xa, -2, zf - 0.2, xb, o.solidH || h + 4, 0);
}

// ---------------------------------------------------------------------------------------------------------------
// A small glazed cab lobby against the wall: two berth doors, a canopy, a lamp, and the call button.
// The stop itself is the place record's (regions register it); this only draws the lobby and calls the cab.
// o: { x0, x1, d, clip, id, sign }
// ---------------------------------------------------------------------------------------------------------------
export function cabLobby(game, s, o) {
  const g = s.g, x0 = o.x0, x1 = o.x1, d = o.d || 3.6, H = 3.2, cx = (x0 + x1) / 2, clip = o.clip;
  g.mat('stone', '#b9a98e'); g.box(x0 - 0.25, H, -d - 0.25, x1 + 0.25, H + 0.32, 0, { faces: 'xXzYy' });
  g.mat('paint', o.trim || '#2f5d5a'); g.box(x0 - 0.27, H + 0.06, -d - 0.27, x1 + 0.27, H + 0.26, -d - 0.25, { faces: 'z' });
  s.flush({ tier: 's' });
  g.mat('cast', '#5a4a33');
  for (const x of [x0, x1]) { g.box(x - 0.06, 0, -d - 0.06, x + 0.06, H, -d + 0.06, { bevel: 0.01 }); g.box(x - 0.05, 0, -0.1, x + 0.05, H, 0, { bevel: 0.01 }); g.box(x - 0.04, 0, -d, x + 0.04, 0.12, 0, { faces: 'xXY' }); g.box(x - 0.04, H - 0.1, -d, x + 0.04, H, 0, { faces: 'xXy' }); }
  g.box(x0, H - 0.5, -d - 0.05, x1, H - 0.4, -d + 0.05);
  s.flush({ tier: 's' });
  for (const x of [x0, x1]) { s.glass(x, 0.12, -d + 0.06, x, H - 0.1, -0.1, { tint: '#cfe3e0' }); s.solid(x - 0.06, 0, -d, x + 0.06, H, 0); }
  s.glass(x0 + 0.06, H - 0.4, -d, x1 - 0.06, H - 0.04, -d, { tint: '#e8dcc0', opacity: 0.2 });
  s.solid(x0 - 0.25, H, -d - 0.25, x1 + 0.25, H + 0.32, 0);
  const bw = 1.3, gap = (x1 - x0 - 2 * bw) / 3;
  for (const bx of [x0 + gap + bw / 2, x1 - gap - bw / 2]) {
    g.mat('stone', '#9c8f7c'); g.box(bx - bw / 2 - 0.18, 0, -0.18, bx + bw / 2 + 0.18, 2.6, -0.02, { faces: 'xXzY' });
    g.mat('cast', '#b08a45', { rough: -0.1 }); g.box(bx - bw / 2, 0.02, -0.2, bx - 0.01, 2.36, -0.17); g.box(bx + 0.01, 0.02, -0.2, bx + bw / 2, 2.36, -0.17);
    g.mat('cast', '#8a6d3b'); for (const yy of [0.5, 1.2, 1.9]) g.box(bx - bw / 2 + 0.06, yy, -0.215, bx + bw / 2 - 0.06, yy + 0.03, -0.2);
    g.mat('diffuser', '#ffd9a0', { emissive: 3, lamp: true }); g.box(bx - 0.2, 2.44, -0.2, bx + 0.2, 2.52, -0.18);
    g.mat('cast', '#3a3430'); g.box(bx + bw / 2 + 0.25, 1.05, -0.08, bx + bw / 2 + 0.4, 1.3, -0.02, { bevel: 0.01 });
    g.mat('diffuser', '#3fe0d0', { emissive: 2 }); g.cyl(bx + bw / 2 + 0.325, 1.16, -0.09, 0.03, 0.012, { segs: 8 });
  }
  s.flush({ tier: 's' });
  g.mat('rush', '#8a7a5a'); g.box(x0 + 0.3, 0.002, -d + 0.1, x1 - 0.3, 0.014, -0.35, { faces: 'Y' }); s.flush({ tier: 'd', cast: false });
  sign(s, o.sign, cx, H + 0.16, -d - 0.28, { face: 'z', w: Math.min(3.2, x1 - x0 - 0.4), h: 0.22, board: false, glow: 1.4 });
  lamp(s, 'panel', cx, H - 0.02, -d / 2, { w: 1.6, d: 0.5, K: 3300, power: 0.8, clip });
  s.interact({ x: cx, y: 1.2, z: -0.7, radius: 1.8, prompt: 'Call a cab', onUse: (gm) => { if (gm.cab) gm.cab.open(o.id); } });
  s.spot('stand', cx - 0.6, 0, -d + 1.6, 0, { tags: ['wait'] }); s.spot('stand', cx + 0.7, 0, -d + 1.9, PI * 0.1, { tags: ['wait'] });
  return { cx };
}

// ---------------------------------------------------------------------------------------------------------------
// A wall lift between tiers: brass doors in a stone frame against the riser, a dial, a lit plate, and a prompt that
// fades, moves the player to another frame, and names where they are. o: { x, label, sub, prompt, to: { frame (id),
// x, y, z, yaw }, secs (the ride, for the toast), banner: [name, sub], clip }
// ---------------------------------------------------------------------------------------------------------------
export function wallLift(game, s, o) {
  const g = s.g, x = o.x, w = 1.5;
  g.mat('stone', '#b4a48a'); g.box(x - w / 2 - 0.4, 0, -0.3, x - w / 2, 3.3, 0, { faces: 'xXzY' }); g.box(x + w / 2, 0, -0.3, x + w / 2 + 0.4, 3.3, 0, { faces: 'xXzY' }); g.box(x - w / 2 - 0.5, 3.0, -0.36, x + w / 2 + 0.5, 3.45, 0, { faces: 'xXzYy' });
  g.mat('cast', o.door || '#b08a45', { rough: -0.12 }); g.box(x - w / 2, 0.02, -0.12, x - 0.01, 2.8, -0.05); g.box(x + 0.01, 0.02, -0.12, x + w / 2, 2.8, -0.05);
  g.mat('cast', '#8a6d3b'); for (const yy of [0.6, 1.4, 2.2]) g.box(x - w / 2 + 0.05, yy, -0.135, x + w / 2 - 0.05, yy + 0.04, -0.12);
  g.mat('plain', '#1a1a1a'); g.box(x - w / 2, 2.8, -0.06, x + w / 2, 3.0, -0.05, { faces: 'z' });
  s.flush({ tier: 's' });
  s.solid(x - w / 2 - 0.4, 0, -0.3, x + w / 2 + 0.4, 3.45, 0);
  s.deco(() => {
    g.mat('paper', '#efe6d2', { emissive: 0.8, lamp: true }); g.lathe(x, -0.37, [[0.24, 3.62], [0, 3.62]], { segs: 18, capTop: false, capBottom: false });
    g.mat('cast', '#2e2a26'); g.box(x - 0.01, 3.62, -0.38, x + 0.01, 3.78, -0.375);
    g.mat('cast', '#5a4a33'); g.lathe(x, -0.36, [[0.27, 3.6], [0.27, 3.64]], { segs: 18, capTop: false, capBottom: false });
    g.mat('cast', '#3a3430'); g.box(x + w / 2 + 0.12, 1.1, -0.36, x + w / 2 + 0.3, 1.4, -0.3, { bevel: 0.01 });
    g.mat('diffuser', '#ffd27a', { emissive: 2.2 }); g.cyl(x + w / 2 + 0.21, 1.25, -0.37, 0.035, 0.012, { segs: 8 });
  });
  s.post(x, -0.37, 0.3, 3.4, 3.9);
  sign(s, { kind: 'plate', text: o.label, sub: o.sub }, x, 3.22, -0.37, { face: 'z', w: 1.6, h: 0.3, glow: 0.6 });
  lamp(s, 'sconce', x - w / 2 - 0.62, 2.4, -0.05, { face: 'z', K: 2800, power: 0.6, clip: o.clip });
  s.interact({ x, y: 1.2, z: -0.7, radius: 1.5, prompt: o.prompt, onUse: async (gm) => {
    const fr = gm.world.frames.get(o.to.frame);
    if (!fr) { toast(gm, 'The lift is standing at another tier. Try again in a minute.'); return; }
    if (gm.busy) return;
    gm.busy++;
    try {
      sfx(gm, 'chime', s.frame, x, 2.4, -0.3);
      if (gm.player.seat) gm.player.stand();
      if (gm.ui) await gm.ui.fade(true, 0.45);
      gm.player.place(fr, o.to.x, o.to.y || 0, o.to.z, o.to.yaw || 0, 0);
      if (gm.ui) { await gm.ui.fade(false, 0.55); if (o.banner && gm.ui.banner) gm.ui.banner(o.banner[0], o.banner[1] || ''); }
      if (o.secs) toast(gm, o.secs);
    } finally { gm.busy--; }
  } });
}

// ---------------------------------------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------------------------------------

// A long terrace bench: stone ends, oak slats, a low back. p: { w, wood, stone }
defineProp('bu.bench', (g, p) => {
  const w = p.w || 3, wood = p.wood || '#8a6240', st = p.stone || '#a89a84';
  const n = Math.max(2, Math.round(w / 2) + 1);
  g.mat('stone', st);
  for (let i = 0; i < n; i++) { const x = -w / 2 + 0.15 + (w - 0.3) * i / (n - 1); g.box(x - 0.1, 0, -0.2, x + 0.1, 0.4, 0.2, { bevel: 0.015, aoBottom: 0.7 }); }
  g.mat('wood', wood, { rough: -0.06 });
  for (let i = 0; i < 4; i++) { const z = -0.2 + i * 0.105; g.box(-w / 2, 0.4, z, w / 2, 0.44, z + 0.09, { bevel: 0.008 }); }
  if (p.back !== false) {
    g.mat('cast', '#4a3f33'); for (let i = 0; i < n; i++) { const x = -w / 2 + 0.15 + (w - 0.3) * i / (n - 1); g.tube([[x, 0.42, -0.22], [x, 0.85, -0.29]], 0.016, { segs: 5 }); }
    g.mat('wood', wood, { rough: -0.06 }); for (const yy of [0.62, 0.78]) g.box(-w / 2, yy, -0.31, w / 2, yy + 0.08, -0.26, { bevel: 0.008 });
  }
  const spots = []; const k = Math.max(1, Math.floor(w / 1.15));
  for (let i = 0; i < k; i++) spots.push({ type: 'sit', x: -w / 2 + (i + 0.5) * w / k, y: 0.45, z: 0.0, yaw: 0, tags: ['watch'] });
  return { solid: [[-w / 2, 0, -0.32, w / 2, 0.45, 0.22]], spots, tier: 's' };
});

// The tea stand on the Quarter: a counter with a panelled front, a copper urn on the 65-degree loop, lidded cups in rows,
// a stack of lidded bowls, a cake under a cover, and a canopy. Front (+z) is the customers' side. p: { body, trim }
defineProp('bu.teastand', (g, p) => {
  const body = p.body || '#2f5d5a', trim = p.trim || '#d6a640', W = 2.6;
  g.mat('paint', body); g.box(-W / 2, 0, -0.45, W / 2, 0.95, 0.45, { bevel: 0.02, aoBottom: 0.75 });
  g.mat('paint', shadeHex(body, 1.25)); for (const x of [-0.85, 0, 0.85]) g.box(x - 0.36, 0.12, 0.45, x + 0.36, 0.84, 0.47, { bevel: 0.008 });
  g.mat('cast', trim); for (const x of [-0.85, 0, 0.85]) { g.box(x - 0.37, 0.83, 0.465, x + 0.37, 0.845, 0.48); g.box(x - 0.37, 0.11, 0.465, x + 0.37, 0.125, 0.48); }
  g.mat('wood', '#9a6a3e', { rough: -0.12 }); g.box(-W / 2 - 0.05, 0.95, -0.5, W / 2 + 0.05, 1.0, 0.62, { bevel: 0.012 });
  // the urn: copper, domed lid, a brass tap toward the customers, a gauge
  g.mat('cast', '#b8693a'); g.lathe(-0.75, -0.15, [[0, 1.0], [0.21, 1.0], [0.23, 1.04], [0.23, 1.46], [0.21, 1.5], [0.14, 1.58], [0.05, 1.62], [0.04, 1.68], [0, 1.69]], { segs: 18 });
  g.mat('cast', '#c8a45a'); g.lathe(-0.75, -0.15, [[0.24, 1.18], [0.245, 1.2], [0.24, 1.22]], { segs: 18, capTop: false, capBottom: false });
  g.tube([[-0.75, 1.12, 0.08], [-0.75, 1.12, 0.16], [-0.75, 1.06, 0.2]], 0.016, { segs: 6 });
  g.mat('glaze', '#efe6d2'); g.lathe(-0.53, -0.22, [[0, 1.32], [0.045, 1.32], [0.045, 1.34], [0, 1.34]], { segs: 12 });
  // lidded cups in rows, lidded bowls stacked, a teapot with a long spout
  const cup = (x, y, z, c) => { g.mat('glaze', c); g.lathe(x, z, [[0, y], [0.028, y], [0.038, y + 0.012], [0.042, y + 0.085], [0, y + 0.085]], { segs: 10 }); g.mat('glaze', shadeHex(c, 0.78)); g.lathe(x, z, [[0.045, y + 0.085], [0.042, y + 0.095], [0.012, y + 0.104], [0.012, y + 0.114], [0, y + 0.115]], { segs: 10, capBottom: false }); };
  const CC = ['#e9e1cf', '#c9763e', '#2f6f73', '#e9e1cf', '#b8584a', '#d9c08a', '#5b4060', '#e9e1cf'];
  for (let i = 0; i < 8; i++) cup(-0.3 + (i % 4) * 0.11, 1.0, 0.3 + Math.floor(i / 4) * 0.11, CC[i]);
  for (let k = 0; k < 4; k++) { g.mat('glaze', ['#2f6f73', '#e9e1cf', '#c9763e', '#2f6f73'][k]); g.lathe(0.45, -0.2, [[0.06, 1.0 + k * 0.07], [0.1, 1.04 + k * 0.07], [0.1, 1.06 + k * 0.07]], { segs: 12, capTop: false }); }
  g.mat('glaze', '#d6a640'); g.lathe(0.45, -0.2, [[0.1, 1.28], [0.06, 1.31], [0.015, 1.33], [0, 1.34]], { segs: 12, capBottom: false });
  g.mat('glaze', '#7a2f3c'); g.lathe(0.2, 0.1, [[0, 1.0], [0.07, 1.0], [0.09, 1.05], [0.085, 1.12], [0.05, 1.15], [0, 1.16]], { segs: 12 });
  g.tube([[0.27, 1.06, 0.1], [0.36, 1.12, 0.1], [0.42, 1.17, 0.1]], 0.012, { segs: 5 });
  // the cake under a cloth on a board
  g.mat('wood', '#7a5233'); g.box(0.75, 1.0, -0.15, 1.2, 1.03, 0.3, { bevel: 0.006 });
  g.mat('hex', '#e0a84c', { rough: -0.05 }); g.box(0.79, 1.03, -0.11, 1.16, 1.08, 0.26, { bevel: 0.01 });
  g.mat('weave', '#efe6d2'); g.sheet([0.75, 1.12, -0.15], [1.22, 1.12, -0.15], [1.22, 1.09, 0.18], [0.75, 1.09, 0.18], { nu: 5, nv: 3, sag: 0.02 });
  // canopy: posts at the back, striped cloth sloping toward the customers
  g.mat('cast', '#3a3430'); for (const x of [-W / 2, W / 2]) { g.tube([[x, 1.0, -0.45], [x, 2.7, -0.45]], 0.024, { segs: 6 }); g.tube([[x, 2.68, -0.45], [x, 2.15, 0.95]], 0.017, { segs: 5 }); }
  g.tube([[-W / 2, 2.15, 0.95], [W / 2, 2.15, 0.95]], 0.017, { segs: 5 });
  const ST = ['#d98a3a', '#efe2c4', '#2f6f73', '#efe2c4'], NS = 10;
  for (let i = 0; i < NS; i++) {
    const a = -W / 2 - 0.05 + (W + 0.1) * i / NS, b = -W / 2 - 0.05 + (W + 0.1) * (i + 1) / NS; g.mat('weave', ST[i % ST.length]);
    g.quad([a, 2.72, -0.5], [b, 2.72, -0.5], [b, 2.16, 1.0], [a, 2.16, 1.0], { double: true });
    g.quad([a, 2.16, 1.0], [b, 2.16, 1.0], [b, 2.0, 1.01], [a, 2.0, 1.01], { double: true });
  }
  return { solid: [[-W / 2 - 0.05, 0, -0.5, W / 2 + 0.05, 1.0, 0.62]], tier: 's' };
});

// A wall of slipper holes, each with a brass number and most with a pair of felt slippers. p: { nx, ny, seed }
defineProp('bu.slippers', (g, p) => {
  const nx = p.nx || 12, ny = p.ny || 7, cw = 0.32, ch = 0.22, d = 0.3, W = nx * cw, H = ny * ch;
  const r = new Rng(hashStr('bu-slip' + (p.seed || 0)));
  g.mat('wood', '#7a5a3a'); g.box(-W / 2 - 0.03, 0, -d, W / 2 + 0.03, 0.14, 0, { bevel: 0.006 });
  g.mat('wood', '#4a3424'); g.box(-W / 2, 0.14, -d, W / 2, 0.14 + H, -d + 0.02, { faces: 'Z' });
  g.mat('wood', '#a87a4c');
  for (let i = 0; i <= nx; i++) { const x = -W / 2 + i * cw; g.box(x - 0.011, 0.14, -d, x + 0.011, 0.14 + H, 0, { faces: 'xXZY' }); }
  for (let j = 0; j <= ny; j++) { const y = 0.14 + j * ch; g.box(-W / 2, y - 0.011, -d, W / 2, y + 0.011, 0, { faces: 'yYZ' }); }
  g.box(-W / 2 - 0.05, 0.14 + H, -d - 0.02, W / 2 + 0.05, 0.18 + H, 0.04, { bevel: 0.01 });
  const SC = ['#c9552e', '#e7b547', '#2f8f8a', '#c23a6a', '#5a8f3a', '#2f5fa8', '#e8743b', '#7a3a9a', '#e9e2d0', '#d6a640'];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const cx = -W / 2 + (i + 0.5) * cw, y = 0.14 + j * ch + 0.012;
    g.mat('cast', '#c8a45a'); g.box(cx - 0.025, y + 0.005, -0.002, cx + 0.025, y + 0.03, 0.004);
    if (r.chance(0.22)) continue;
    const c = SC[r.i(0, SC.length - 1)];
    for (const sx of [-0.065, 0.065]) {
      const x = cx + sx + r.f(-0.01, 0.01);
      g.mat('felt', c); g.box(x - 0.045, y, -0.27, x + 0.045, y + 0.03, -0.04, { bevel: 0.012 });
      g.mat('felt', shadeHex(c, 0.8)); g.box(x - 0.043, y + 0.03, -0.27, x + 0.043, y + 0.075, -0.17, { bevel: 0.02 });
      if (r.chance(0.3)) { g.mat('weave', '#efe6d2'); g.box(x - 0.01, y + 0.03, -0.12, x + 0.01, y + 0.034, -0.06); }      // a mended seam, in pale thread
    }
  }
  return { solid: [[-W / 2 - 0.05, 0, -d - 0.02, W / 2 + 0.05, 0.18 + H, 0.04]], tier: 's' };
});

// A warden's high chair: a ladder up to a seat 1.6 m above the floor, a red flag in a holder, a brass bell. p: { paint }
defineProp('bu.wardenchair', (g, p) => {
  const paint = p.paint || '#a82a2a';
  g.mat('wood', '#6b4a2f');
  for (const sx of [-0.35, 0.35]) { g.tube([[sx, 0, -0.45], [sx * 0.8, 1.6, -0.1]], 0.035, { segs: 6 }); g.tube([[sx, 0, 0.35], [sx * 0.8, 1.6, 0.05]], 0.035, { segs: 6 }); }
  for (let k = 1; k < 5; k++) { const t = k / 5; g.tube([[-0.35 + 0.07 * t, 1.6 * t, 0.35 - 0.3 * t], [0.35 - 0.07 * t, 1.6 * t, 0.35 - 0.3 * t]], 0.018, { segs: 5 }); }
  g.mat('paint', paint); g.box(-0.34, 1.6, -0.3, 0.34, 1.66, 0.12, { bevel: 0.012 }); g.box(-0.34, 1.66, -0.32, 0.34, 2.15, -0.26, { bevel: 0.012 });
  g.mat('paint', '#e8e0d0'); g.box(-0.34, 1.9, -0.335, 0.34, 1.98, -0.32);
  g.mat('cast', '#3a3430'); g.tube([[0.4, 1.4, -0.2], [0.4, 2.6, -0.2]], 0.012, { segs: 4 });
  g.mat('weave', '#c8302a'); g.quad([0.41, 2.6, -0.2], [0.41, 2.6, 0.2], [0.41, 2.32, 0.18], [0.41, 2.32, -0.2], { double: true });
  g.mat('cast', '#c8a45a'); g.lathe(-0.42, -0.1, [[0.05, 1.7], [0.045, 1.78], [0.02, 1.82], [0, 1.83]], { segs: 10 });
  return { solid: [[-0.4, 0, -0.5, 0.4, 2.2, 0.4]], spots: [{ type: 'work', x: 0, y: 1.66, z: -0.05, yaw: 0, tags: ['warden'] }], tier: 's' };
});

// A hand-line post: a turned post with a brass ring at waist height for the rope. p: { h }
defineProp('bu.linepost', (g, p) => {
  const h = p.h || 1.25;
  g.mat('wood', '#6b4a2f'); g.lathe(0, 0, [[0.09, 0], [0.08, 0.06], [0.05, 0.1], [0.045, h - 0.1], [0.06, h - 0.05], [0.055, h], [0, h + 0.02]], { segs: 10 });
  g.mat('cast', '#c8a45a'); g.lathe(0, 0, [[0.07, 1.04], [0.075, 1.07], [0.07, 1.1]], { segs: 12, capTop: false, capBottom: false });
  return { posts: [[0, 0, 0.09, 0, h]], tier: 's' };
});

// A practice mat: a padded square with a bound edge and a sewn number. p: { w, d, color, edge }
defineProp('bu.mat', (g, p) => {
  const w = p.w || 2, d = p.d || 2, c = p.color || '#2f6f73';
  g.mat('felt', c); g.box(-w / 2 + 0.03, 0, -d / 2 + 0.03, w / 2 - 0.03, 0.11, d / 2 - 0.03, { bevel: 0.04 });
  g.mat('weave', p.edge || '#e8e0d0'); g.box(-w / 2, 0, -d / 2, w / 2, 0.06, -d / 2 + 0.05, { bevel: 0.01 }); g.box(-w / 2, 0, d / 2 - 0.05, w / 2, 0.06, d / 2, { bevel: 0.01 });
  g.box(-w / 2, 0, -d / 2, -w / 2 + 0.05, 0.06, d / 2, { bevel: 0.01 }); g.box(w / 2 - 0.05, 0, -d / 2, w / 2, 0.06, d / 2, { bevel: 0.01 });
  return { solid: [[-w / 2, 0, -d / 2, w / 2, 0.11, d / 2]], surf: 'felt', cast: false, tier: 's' };
});

// A low lamp post for the dark hours: a hooded head that throws light down, not into the view. p: { metal }
defineProp('bu.bollard', (g, p) => {
  g.mat('cast', p.metal || '#3a3a33');
  g.lathe(0, 0, [[0.09, 0], [0.085, 0.06], [0.05, 0.1], [0.04, 0.62], [0.06, 0.66]], { segs: 10 });
  g.box(-0.1, 0.66, -0.1, 0.1, 0.7, 0.1, { bevel: 0.01 });
  g.mat('diffuser', '#ffd6a0', { emissive: 3.2, night: true }); g.box(-0.075, 0.7, -0.075, 0.075, 0.78, 0.075, { faces: 'xXzZ' });
  g.mat('cast', p.metal || '#3a3a33'); g.lathe(0, 0, [[0.13, 0.78], [0.12, 0.8], [0.05, 0.86], [0.02, 0.89], [0, 0.9]], { segs: 10 });
  return { posts: [[0, 0, 0.1, 0, 0.9]], tier: 'd' };
});

// The first time the player stands on a tier: a flag the journal reads, saved, and an event. tier: 'quarter' | 'tenth' | 'twentieth'
export function stoodTrigger(s, box, tier) {
  return s.trigger({ box, onEnter(game) {
    const key = 'stood_' + tier; if (game.flags[key]) return;
    game.flags[key] = true;
    if (game.story && game.story.persist) game.story.persist();
    game.events.emit('tier:stood', { tier });
  } });
}
