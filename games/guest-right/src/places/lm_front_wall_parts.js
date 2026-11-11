// Parts for the front end wall (lm_front_wall.js): small helpers, the riser with the oldest people's flats, the broad rail,
// rope nets, the end piers, the cab lobby, the wall lift between tiers, falling cloth petals, and this landmark's props.
// The front wall is the back wall's mirror: in every frame z = 0 is the wall and the terrace sticks out toward the Hollow
// at POSITIVE z. The structural pieces are drawn through mz(g), which mirrors z (and keeps faces and windings right), so
// they match the back wall's terraces piece for piece. Everything long that runs along x is drawn in short pieces.
import * as THREE from 'three';
import { defineProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { lamp } from '../world/kit.js';
import { Geo, MeshBuf } from '../world/meshbuilder.js';
import { Rng, hashStr, shadeHex } from '../core/util.js';

export const PI = Math.PI;
export const ENV = { exposure: 1.0, autoKey: 0.19, autoMin: 0.02, autoMax: 5, bloom: 0.045, warmth: 0.07, contrast: 1.1, saturation: 1.12 };
export const SKY = { sky: true, skyTop: 30, sun: true, sunPower: 34, far: 2400, reverb: 'open' };

// ---------------------------------------------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------------------------------------------
export function runX(a, b, step, fn) { const n = Math.max(1, Math.ceil((b - a) / step)); for (let i = 0; i < n; i++) fn(a + (b - a) * i / n, a + (b - a) * (i + 1) / n, i); }
export function lineX(a, b, y, z, step = 2) { const n = Math.max(1, Math.ceil(Math.abs(b - a) / step)), out = []; for (let i = 0; i <= n; i++) out.push([a + (b - a) * i / n, y, z]); return out; }
export function toast(game, text, kind) { if (game.ui) game.ui.toast(text, { kind: kind || 'info' }); }
export function find(game, id) { if (game.journal) game.journal.find(id); }
export function sfx(game, name, f, x, y, z) { if (game.audio && game.sfxAt) game.sfxAt(name, f, x, y, z); }
export function hours(game) { return game.clock ? game.clock.hours : 12; }
export function dayOf(game) { return game.clock ? Math.max(1, game.clock.day || 1) : 1; }
export function sunOf(game) { return game.clock && game.clock.sun ? game.clock.sun() : 1; }

export async function say(game, who, lines) {
  if (!game.ui) return;
  game.busy++;
  try { await game.ui.say(who, lines); } finally { game.busy--; }
}
export async function readSpec(game, spec, extra) {
  const lines = [];
  if (spec.text) lines.push(spec.text + (spec.sub ? '. ' + spec.sub + '.' : '.'));
  if (spec.lines) { let buf = ''; for (const l of spec.lines) { buf = buf ? buf + ' ' + l : l; if (buf.length > 80) { lines.push(buf); buf = ''; } } if (buf) lines.push(buf); }
  if (extra) lines.push(...(Array.isArray(extra) ? extra : [extra]));
  await say(game, spec.title || spec.text || 'A notice', lines.length ? lines : ['(blank)']);
}
// A small menu paid from the wallet. Returns the item bought or null.
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
// A seat the player can take: (x, y, z) the floor under it, yaw the way it faces (prop convention: 0 faces +z, the Hollow).
export function seat(s, x, y, z, yaw, label, o = {}) {
  return s.interact({ x, y: y + 0.55, z, radius: o.radius || 1.0,
    prompt: (game) => (game.player.seat ? 'Stand up' : label),
    onUse(game) {
      const p = game.player; if (p.seat) { p.stand(); return; }
      p.sit({ x, y: y + (o.lift || 0), z, yaw: PI - yaw, eye: o.eye || 1.12 }); p.yaw = PI - yaw; p.pitch = o.pitch || 0.02;
      if (o.onSit) o.onSit(game);
    } });
}
// The tier's own glow from the Hollow, following the sunline.
export function skyGlow(game, s, box, k) {
  const a = s.ambient({ box, sky: [0.5, 0.56, 0.42], ground: [0.32, 0.34, 0.26], power: 1, skylit: true, spec: 0.35, groundK: 1 });
  s.every(() => { const sun = sunOf(game); a.scale = k * (34 * 0.2 * sun + 0.05 * (1 - sun)); });
  return a;
}
// A floor that bends: drawn in pieces along x; the collider is one flat box.
export function bentFloor(s, x0, z0, x1, z1, y, mat, tint, step) {
  const g = s.g;
  runX(x0, x1, step, (a, b) => { g.mat(mat, tint); g.box(a, y - 0.02, z0, b, y, z1, { faces: 'Y' }); s.flush({ tier: 's', cast: false }); });
  s.solid(x0, y - 0.5, Math.min(z0, z1), x1, y, Math.max(z0, z1), { surf: 'stone' });
}
// Crowd magnets for the frame's people while this scope lives (the same way the ring stations do it).
export function magnets(game, s, list) {
  const M = game.people && game.people.magnets; if (!M || !list.length) return;
  for (const m of list) M.push(m);
  s.onDispose(() => { for (const m of list) { const i = M.indexOf(m); if (i >= 0) M.splice(i, 1); } });
}

// The terraces' tide: the front wall fills for the dusk and is nearly empty at noon, when only the people who live in
// the risers are about. frac(hour) is the share of this frame's passers-by who are here; the rest are sent away (out of
// sight first) and brought back to a seat in the place when the hour comes round. Only the people module's public handles.
export function tide(game, s, frame, place, frac) {
  const sent = new Set(); let t = 0, first = true;
  const share = (id) => (hashStr('fw-tide' + id) % 1000) / 1000;
  s.every((dt) => {
    t += dt; if (t < 0.5) return; t = 0;
    const P = game.people; if (!P || !P.all || !P.byId) return;
    const want = frac(hours(game)), eye = game.player && game.player.pos;
    let budget = first ? 1000 : 8;
    if (P.all.some((p) => p.frame === frame)) first = false;
    for (const p of P.all) {
      if (budget <= 0) break;
      if (p.frame !== frame || p.kind !== 'anon') continue;
      const keep = share(p.id) < want;
      if (!keep && !sent.has(p.id) && p.state !== 'away') {
        const far = !eye || game.player.frame !== frame || Math.hypot(p.x - eye.x, p.z - eye.z) > 24;
        if (!far && p.visible) continue;
        const h = P.byId(p.id); if (!h) continue;
        h.hide(); sent.add(p.id); budget--;
      } else if (keep && sent.has(p.id)) {
        const h = P.byId(p.id); sent.delete(p.id); budget--;
        if (h) h.goTo(place).then(() => h.release(), () => h.release());
      }
    }
  });
}
export function duskShare(h) {
  if (h >= 16.5 || h < 1) return 1;
  if (h >= 15) return 0.12 + 0.88 * (h - 15) / 1.5;
  if (h >= 9.5) return 0.12;
  if (h >= 6) return 0.4;
  return 0.6;
}

// ---------------------------------------------------------------------------------------------------------------
// mz(g): the same drawing calls with z mirrored (z -> -z). Boxes swap their z faces, extruded profiles and quads are
// turned round so they still face out, cards and transforms turn the other way. Used for the pieces that match the back wall.
// ---------------------------------------------------------------------------------------------------------------
const FZ = (f) => (f ? f.replace(/[zZ]/g, (c) => (c === 'z' ? 'Z' : 'z')) : f);
const MP = (p) => [p[0], p[1], -p[2]];
export function mz(g) {
  return {
    box(x0, y0, z0, x1, y1, z1, o) { return g.box(x0, y0, -z1, x1, y1, -z0, o && o.faces ? Object.assign({}, o, { faces: FZ(o.faces) }) : o); },
    lathe(cx, cz, prof, o) { return g.lathe(cx, -cz, prof, o); },
    cyl(cx, y0, cz, r, h, o) { return g.cyl(cx, y0, -cz, r, h, o); },
    ball(cx, cy, cz, rx, ry, rz, o) { return g.ball(cx, cy, -cz, rx, ry, rz, o); },
    tube(path, r, o) { return g.tube(path.map(MP), r, o); },
    extrude(pts, a0, a1, axis, o) { return axis === 'x' ? g.extrude(pts.map((p) => [-p[0], p[1]]).reverse(), a0, a1, 'x', o) : g.extrude(pts, -a1, -a0, 'z', o); },
    quad(p0, p1, p2, p3, o) { return g.quad(MP(p0), MP(p3), MP(p2), MP(p1), o); },
    sheet(a, b, c, d, o) { return g.sheet(MP(a), MP(b), MP(c), MP(d), o); },
    card(x, y, z, w, h, yaw, o) { return g.card(x, y, -z, w, h, PI - (yaw || 0), o); },
    at(x, y, z, yaw) { return g.at(x, y, -z, -(yaw || 0)); },
    pop() { return g.pop(); },
  };
}

// ---------------------------------------------------------------------------------------------------------------
// The riser behind a terrace (its face at z = 0, looking toward +z) with the windows and doors of the oldest people's
// flats. Bays 5.5 m and rows 4.17 m, as the engine paints the wall above. Returns { doors: [{ x }] }.
// o: { x0, x1, h, tint, stone, trim, gaps: [[a, b]], doors: [x...], seed, lit, step }
// ---------------------------------------------------------------------------------------------------------------
export const BAY = 5.5, ROW = 50 / 12;
const CURTAINS = ['#d9a46a', '#c9763e', '#e2c48a', '#b8584a', '#d8b06c', '#9a6a8a', '#7a9a8a', '#e6b980'];
const DOOR_COLS = ['#2f5d5a', '#8a3a2e', '#5b4060', '#2a4a6a', '#6b5a2a', '#3d5a3a', '#7a2a4a'];
export function riser(s, o) {
  const g = s.g, M = mz(g), x0 = o.x0, x1 = o.x1, h = o.h || 12.6, tint = o.tint || '#d9c8aa', stone = o.stone || '#b4a48a', trim = o.trim || '#2f5d5a', step = o.step || 4;
  const r = new Rng(hashStr('fw-riser' + (o.seed || 0)));
  const inGap = (a, b) => (o.gaps || []).some((gp) => b > gp[0] && a < gp[1]);
  runX(x0, x1, step, (a, b) => {
    g.mat('stone', stone); M.box(a, 0, 0, b, 1.0, 0.6, { faces: 'z', aoBottom: 0.7 });
    g.mat('plaster', tint); M.box(a, 1.0, 0, b, h, 0.6, { faces: 'zY' });
    g.mat('stone', shadeHex(stone, 0.9)); M.box(a, 0.98, -0.05, b, 1.06, 0, { faces: 'zY' });
    s.flush({ tier: 's' });
  });
  s.solid(x0, 0, -0.6, x1, Math.max(h + 0.6, o.solidH || 0), 0);
  runX(x0, x1, Math.min(step, 3), (a, b) => {
    g.mat('stone', stone);
    for (const yy of [ROW, 2 * ROW]) if (yy < h - 1) M.extrude([[0, yy - 0.12], [0, yy + 0.12], [-0.1, yy + 0.12], [-0.14, yy + 0.06], [-0.1, yy - 0.06], [-0.04, yy - 0.12]], a, b, 'x');
    M.extrude([[0, h - 0.5], [0, h], [-0.62, h], [-0.62, h - 0.12], [-0.4, h - 0.2], [-0.22, h - 0.3], [-0.12, h - 0.42]], a, b, 'x');
  });
  s.flush({ tier: 's' });
  // the planted gutter on the cornice
  g.mat('soil', '#ffffff'); runX(x0, x1, step, (a, b) => M.box(a, h, -0.6, b, h + 0.05, 0.4, { faces: 'Y' }));
  for (let x = x0 + 0.3; x < x1 - 0.2; x += 0.6) {
    const sc = r.f(0.6, 1.2);
    g.mat(r.chance(0.6) ? 'leafA' : 'fern', r.chance(0.2) ? '#d8e8b0' : '#ffffff', { sway: 0.4 });
    M.card(x + r.f(-0.2, 0.2), h + 0.02, r.f(-0.4, 0.1), 0.9 * sc, 0.7 * sc, r.f(0, 3.1), { tilt: r.f(-0.3, 0.3) });
    if (r.chance(0.45)) { g.mat('leafB', '#ffffff', { sway: 0.6 }); M.card(x, h - 1.25 * sc, -0.66, 0.5 * sc, 1.3 * sc, 0, { tilt: -0.08 }); }
  }
  s.flush({ tier: 's', cast: false });
  for (let k = Math.ceil(x0 / BAY); k * BAY <= x1; k++) {
    const x = k * BAY; if (x < x0 + 0.3 || x > x1 - 0.3 || inGap(x - 0.3, x + 0.3)) continue;
    g.mat('stone', stone); M.box(x - 0.3, 0, -0.2, x + 0.3, h - 0.5, 0, { faces: 'xXz', aoBottom: 0.7 });
    M.box(x - 0.36, 0, -0.26, x + 0.36, 0.5, 0, { faces: 'xXzY', aoBottom: 0.7 });
  }
  s.flush({ tier: 's' });
  const doors = [];
  const doorBays = new Set((o.doors || []).map((x) => Math.floor(x / BAY)));
  for (let k = Math.floor(x0 / BAY); k * BAY < x1; k++) {
    const wa = (k + 0.18) * BAY, wb = (k + 0.72) * BAY;
    if (wa < x0 + 0.4 || wb > x1 - 0.4 || inGap(wa - 0.3, wb + 0.3)) continue;
    for (const row of [1, 2]) if ((row + 0.8) * ROW < h - 0.6) windowPane(s, M, wa, wb, (row + 0.25) * ROW, (row + 0.8) * ROW, r, trim, stone, o.lit === undefined ? 0.4 : o.lit, row === 1 && r.chance(0.55));
    if (doorBays.has(k)) { const dx = (k + 0.45) * BAY; doors.push({ x: dx }); flatDoor(s, M, dx, r, trim, stone); }
    else for (const c of [wa + 0.35, wb - 1.25]) windowPane(s, M, c, c + 0.9, 1.05, 2.75, r, trim, stone, 0.45, false);
  }
  return { doors };
}
function windowPane(s, M, a, b, y0, y1, r, trim, stone, litShare, box) {
  const g = s.g, w = b - a;
  if (r.chance(litShare)) g.mat('weave', CURTAINS[r.i(0, CURTAINS.length - 1)], { emissive: 1.3, night: true });
  else g.mat('plain', '#1d2428', { rough: -0.45 });
  M.box(a, y0, -0.02, b, y1, -0.01, { faces: 'z' });
  g.mat('paint', trim);
  const bars = w > 1.6 ? 3 : 2;
  for (let i = 1; i < bars; i++) { const x = a + w * i / bars; M.box(x - 0.03, y0, -0.06, x + 0.03, y1, -0.02, { faces: 'xXz' }); }
  M.box(a, y0 + (y1 - y0) * 0.72 - 0.03, -0.06, b, y0 + (y1 - y0) * 0.72 + 0.03, -0.02, { faces: 'yYz' });
  g.mat('stone', stone);
  M.box(a - 0.14, y0 - 0.02, -0.12, a, y1 + 0.02, 0, { faces: 'xXz' }); M.box(b, y0 - 0.02, -0.12, b + 0.14, y1 + 0.02, 0, { faces: 'xXz' });
  M.box(a - 0.18, y1, -0.14, b + 0.18, y1 + 0.18, 0, { faces: 'xXzYy' });
  M.box(a - 0.2, y0 - 0.1, -0.2, b + 0.2, y0, 0, { faces: 'xXzY' });
  s.flush({ tier: 's' });
  if (box) {
    g.mat('wood', ['#2f6f73', '#8a3a2e', '#5b4060', '#6b8f4e'][r.i(0, 3)]); M.box(a + 0.1, y0 - 0.42, -0.42, b - 0.1, y0 - 0.1, -0.2, { faces: 'xXzY' });
    for (let x = a + 0.25; x < b - 0.2; x += 0.32) {
      g.mat(r.chance(0.5) ? 'blossom' : 'leafA', '#ffffff', { sway: 0.5 }); M.card(x, y0 - 0.12, -0.31, 0.38, 0.36, r.f(0, 3), { tilt: r.f(-0.2, 0.2) });
      if (r.chance(0.5)) { g.mat('leafB', '#ffffff', { sway: 0.6 }); M.card(x, y0 - 1.25, -0.45, 0.3, 1.1, 0, { tilt: -0.1 }); }
    }
    s.flush({ tier: 'd', cast: false });
  }
}
function flatDoor(s, M, x, r, trim, stone) {
  const g = s.g, w = 1.1, hh = 2.3, a = x - w / 2, b = x + w / 2;
  g.mat('plain', '#15191b'); M.box(a, 0, -0.01, b, hh + 0.5, 0, { faces: 'z' });
  const col = DOOR_COLS[r.i(0, DOOR_COLS.length - 1)];
  g.mat('wood', col, { rough: -0.05 }); M.box(a + 0.03, 0.02, -0.06, b - 0.03, hh, -0.01, { bevel: 0.01 });
  g.mat('wood', shadeHex(col, 1.2)); for (const p of [[0.18, 0.95], [1.12, hh - 0.16]]) M.box(a + 0.14, p[0], -0.075, b - 0.14, p[1], -0.055, { bevel: 0.008 });
  g.mat('weave', '#e2c48a', { emissive: 1.6, night: true }); M.box(a + 0.06, hh + 0.06, -0.03, b - 0.06, hh + 0.46, -0.02, { faces: 'z' });
  g.mat('paint', trim); M.box(a + 0.04, hh + 0.02, -0.06, b - 0.04, hh + 0.06, -0.02); M.box(x - 0.02, hh + 0.06, -0.05, x + 0.02, hh + 0.46, -0.02);
  g.mat('cast', '#c8a45a'); M.cyl(b - 0.16, 1.0, -0.08, 0.03, 0.03, { segs: 8 }); M.box(x - 0.1, 1.45, -0.08, x + 0.1, 1.48, -0.07);
  g.mat('stone', stone);
  M.box(a - 0.2, 0, -0.16, a, hh + 0.55, 0, { faces: 'xXzY', aoBottom: 0.7 }); M.box(b, 0, -0.16, b + 0.2, hh + 0.55, 0, { faces: 'xXzY', aoBottom: 0.7 });
  M.box(a - 0.28, hh + 0.5, -0.22, b + 0.28, hh + 0.72, 0, { faces: 'xXzYy' });
  M.box(a - 0.15, 0, -0.5, b + 0.15, 0.1, 0, { faces: 'xXzY', aoBottom: 0.8 });
  s.flush({ tier: 's' });
}

// ---------------------------------------------------------------------------------------------------------------
// The broad rail at the open edge: the slab's edge and corbels below, a stone parapet, bronze balusters, an oak rail,
// a planted lip over the drop. The rail's inner face is at z = zr (> 0). o: { x0, x1, zr, stone, bronze, oak, barrier, step, trail }
// ---------------------------------------------------------------------------------------------------------------
export function broadRail(s, o) {
  const g = s.g, M = mz(g), x0 = o.x0, x1 = o.x1, zr = -o.zr, st = o.stone || '#b9a98e', br = o.bronze || '#5a4a33', oak = o.oak || '#8a6240', step = o.step || 4;
  const zo = zr - 0.4, r = new Rng(hashStr('fw-rail' + x0 + zr));
  runX(x0, x1, Math.max(step, 4), (a, b) => {
    g.mat('stone', shadeHex(st, 0.82)); M.box(a, -1.5, zo - 0.75, b, -0.02, 0, { faces: 'zy' });
    g.mat('stone', shadeHex(st, 0.95)); M.box(a, -0.35, zo - 0.85, b, -0.02, zo - 0.75, { faces: 'zyY' }); M.box(a, -1.6, zo - 0.8, b, -1.4, zo - 0.7, { faces: 'zyY' });
    s.flush({ tier: 's' });
  });
  for (let k = Math.ceil(x0 / BAY); k * BAY <= x1; k++) {
    const x = k * BAY; if (x < x0 + 0.5 || x > x1 - 0.5) continue;
    g.mat('stone', shadeHex(st, 0.78));
    M.at(x, 0, 0); M.extrude([[zo - 0.7, -1.5], [zo + 2.4, -1.5], [zo + 2.4, -5.2], [zo + 1.6, -4.6], [zo + 0.4, -3.0], [zo - 0.4, -2.0]], -0.35, 0.35, 'x'); M.pop();
  }
  s.flush({ tier: 's' });
  runX(x0, x1, step, (a, b) => {
    g.mat('stone', st); M.box(a, 0, zo, b, 0.55, zr, { faces: 'zZ', aoBottom: 0.7 });
    g.mat('stone', shadeHex(st, 1.08)); M.box(a, 0.55, zo - 0.04, b, 0.62, zr + 0.04, { faces: 'zZYy' });
  });
  s.flush({ tier: 's' });
  g.mat('cast', br);
  for (let x = x0 + 0.25; x < x1 - 0.1; x += 0.42) M.lathe(x, zr - 0.2, [[0.035, 0.62], [0.03, 0.66], [0.018, 0.72], [0.028, 0.84], [0.016, 0.96], [0.026, 1.0]], { segs: 6, capBottom: false, capTop: false });
  s.flush({ tier: 'd', cast: false });
  runX(x0, x1, Math.min(step, 3), (a, b) => {
    g.mat('cast', br); M.box(a, 0.99, zr - 0.26, b, 1.01, zr - 0.14, { faces: 'yY' });
    g.mat('wood', oak, { rough: -0.12 }); M.extrude([[zo - 0.04, 1.01], [zr + 0.05, 1.01], [zr + 0.07, 1.04], [zr + 0.05, 1.08], [zo + 0.02, 1.1], [zo - 0.05, 1.07]], a, b, 'x');
  });
  s.flush({ tier: 's' });
  s.solid(x0, 0, -zr, x1, 1.1, -(zo - 0.9));
  s.solid(x0, 1.1, -zr, x1, o.barrier || 6, -(zo - 0.9));
  runX(x0, x1, 4, (a, b) => { g.mat('stone', shadeHex(st, 0.9)); M.box(a, -0.35, zo - 0.75, b, 0.3, zo, { faces: 'zY' }); g.mat('soil', '#ffffff'); M.box(a, 0.28, zo - 0.7, b, 0.31, zo, { faces: 'Y' }); });
  s.flush({ tier: 's' });
  for (let x = x0 + 0.2; x < x1 - 0.2; x += 0.5) {
    const sc = r.f(0.7, 1.25);
    g.mat(r.chance(0.3) ? 'blossom' : 'leafA', r.chance(0.25) ? '#e8f0c0' : '#ffffff', { sway: 0.5 }); M.card(x, 0.28, zo - 0.38 + r.f(-0.15, 0.15), 0.6 * sc, 0.5 * sc, r.f(0, 3.1), { tilt: r.f(-0.25, 0.25) });
    if (r.chance(0.6)) { g.mat('leafB', '#ffffff', { sway: 0.7 }); const hh = r.f(0.8, 2.2) * (o.trail || 1); M.card(x + 0.1, 0.3 - hh, zo - 0.78, 0.42, hh, 0, { tilt: -0.04 }); }
  }
  s.flush({ tier: 's', cast: false });
}

// Rope netting in a plane of constant z, diamond mesh. o: { x0, x1, z, y0, y1, cell, tint, r }
export function netX(s, o) {
  const g = s.g, c = o.cell || 0.45, r = o.r || 0.008; g.mat('weave', o.tint || '#d8cdb0');
  const H = o.y1 - o.y0;
  runX(o.x0, o.x1, 6, (a, b) => {
    for (let x = a - H; x < b; x += c) {
      for (const d of [1, -1]) {
        let xa = x, xb = x + d * H; if (d < 0) { xa = x + H; xb = x; }
        const clip = (xx) => Math.max(a, Math.min(b, xx));
        const ca = clip(xa), cb = clip(xb); if (Math.abs(cb - ca) < 0.02) continue;
        const ty = (xx) => o.y0 + H * (xx - xa) / (xb - xa);
        g.tube([[ca, ty(ca), o.z], [cb, ty(cb), o.z]], r, { segs: 3, caps: false });
      }
    }
    s.flush({ tier: 'd', cast: false });
  });
  g.mat('weave', shadeHex(o.tint || '#d8cdb0', 0.8));
  g.tube(lineX(o.x0, o.x1, o.y1, o.z, 2), r * 3, { segs: 5 }); g.tube(lineX(o.x0, o.x1, o.y0, o.z, 2), r * 3, { segs: 5 });
  s.flush({ tier: 's', cast: false });
}

// The end of a terrace: a pier against the wall with quoins, and a planted garden wall out to the rail. zr > 0.
export function endPier(s, xa, xb, zrF, h, o = {}) {
  const g = s.g, M = mz(g), tint = o.tint || '#d6c4a4', st = o.stone || '#b4a48a', r = new Rng(hashStr('fw-pier' + xa + zrF));
  const zr = -zrF, zf = zr - 1.0, zp = -2.6, gh = 2.7;
  g.mat('plaster', tint); M.box(xa, -1.5, zp, xb, h + 0.6, 0, { faces: 'xXzY', aoBottom: 0.7 });
  g.mat('stone', st);
  for (let y = 0, k = 0; y < h; y += 0.55, k++) { const w = k % 2 ? 0.35 : 0.6; M.box(xa - 0.03, y + 0.02, zp - 0.03, xb + 0.03, y + 0.53, zp + w, { faces: 'xXzY' }); }
  M.box(xa - 0.08, h, zp - 0.1, xb + 0.08, h + 0.7, 0, { faces: 'xXzYy' });
  g.mat('plaster', shadeHex(tint, 0.94)); M.box(xa, -1.5, zf, xb, gh, zp, { faces: 'xXzY', aoBottom: 0.7 });
  g.mat('stone', st); M.box(xa - 0.08, gh, zf - 0.08, xb + 0.08, gh + 0.14, zp, { faces: 'xXzYy' }); M.box(xa - 0.05, 0, zf, xb + 0.05, 0.4, zp, { faces: 'xXY', aoBottom: 0.7 });
  s.flush({ tier: 's' });
  g.mat('soil', '#ffffff'); M.box(xa + 0.05, gh + 0.14, zf + 0.1, xb - 0.05, gh + 0.16, zp, { faces: 'Y' });
  for (let z = zf + 0.3; z < zp; z += 0.45) {
    g.mat(r.chance(0.3) ? 'blossom' : 'leafA', '#ffffff', { sway: 0.5 }); M.card((xa + xb) / 2 + r.f(-0.15, 0.15), gh + 0.14, z, 0.7, 0.55, r.f(0, 3), { tilt: r.f(-0.3, 0.3) });
    if (r.chance(0.7)) { g.mat('leafB', '#ffffff', { sway: 0.6 }); const hh = r.f(0.7, 1.8), sx = o.inner > 0 ? 1 : -1; M.card(sx > 0 ? xb + 0.06 : xa - 0.06, gh + 0.1 - hh, z, 0.45, hh, sx * PI / 2, { tilt: -0.05 }); }
  }
  s.flush({ tier: 's', cast: false });
  s.solid(xa, -2, 0, xb, o.solidH || h + 4, zrF + 1.2);
}

// ---------------------------------------------------------------------------------------------------------------
// A small glazed cab lobby against the wall (z from 0 out to d): two berth doors, a canopy, a lamp and the call button.
// The stop itself is the place record's (the regions register it). o: { x0, x1, d, clip, id, sign, trim }
// ---------------------------------------------------------------------------------------------------------------
export function cabLobby(game, s, o) {
  const g = s.g, M = mz(g), x0 = o.x0, x1 = o.x1, d = o.d || 3.6, H = 3.2, cx = (x0 + x1) / 2, clip = o.clip;
  g.mat('stone', '#b9a98e'); M.box(x0 - 0.25, H, -d - 0.25, x1 + 0.25, H + 0.32, 0, { faces: 'xXzYy' });
  g.mat('paint', o.trim || '#5b4060'); M.box(x0 - 0.27, H + 0.06, -d - 0.27, x1 + 0.27, H + 0.26, -d - 0.25, { faces: 'z' });
  s.flush({ tier: 's' });
  g.mat('cast', '#5a4a33');
  for (const x of [x0, x1]) { M.box(x - 0.06, 0, -d - 0.06, x + 0.06, H, -d + 0.06, { bevel: 0.01 }); M.box(x - 0.05, 0, -0.1, x + 0.05, H, 0, { bevel: 0.01 }); M.box(x - 0.04, 0, -d, x + 0.04, 0.12, 0, { faces: 'xXY' }); M.box(x - 0.04, H - 0.1, -d, x + 0.04, H, 0, { faces: 'xXy' }); }
  M.box(x0, H - 0.5, -d - 0.05, x1, H - 0.4, -d + 0.05);
  s.flush({ tier: 's' });
  for (const x of [x0, x1]) { s.glass(x, 0.12, 0.1, x, H - 0.1, d - 0.06, { tint: '#cfe3e0' }); s.solid(x - 0.06, 0, 0, x + 0.06, H, d); }
  s.glass(x0 + 0.06, H - 0.4, d, x1 - 0.06, H - 0.04, d, { tint: '#e8dcc0', opacity: 0.2 });
  s.solid(x0 - 0.25, H, 0, x1 + 0.25, H + 0.32, d + 0.25);
  const bw = 1.3, gap = (x1 - x0 - 2 * bw) / 3;
  for (const bx of [x0 + gap + bw / 2, x1 - gap - bw / 2]) {
    g.mat('stone', '#9c8f7c'); M.box(bx - bw / 2 - 0.18, 0, -0.18, bx + bw / 2 + 0.18, 2.6, -0.02, { faces: 'xXzY' });
    g.mat('cast', '#b08a45', { rough: -0.1 }); M.box(bx - bw / 2, 0.02, -0.2, bx - 0.01, 2.36, -0.17); M.box(bx + 0.01, 0.02, -0.2, bx + bw / 2, 2.36, -0.17);
    g.mat('cast', '#8a6d3b'); for (const yy of [0.5, 1.2, 1.9]) M.box(bx - bw / 2 + 0.06, yy, -0.215, bx + bw / 2 - 0.06, yy + 0.03, -0.2);
    g.mat('diffuser', '#ffd9a0', { emissive: 3, lamp: true }); M.box(bx - 0.2, 2.44, -0.2, bx + 0.2, 2.52, -0.18);
    g.mat('cast', '#3a3430'); M.box(bx + bw / 2 + 0.25, 1.05, -0.08, bx + bw / 2 + 0.4, 1.3, -0.02, { bevel: 0.01 });
    g.mat('diffuser', '#3fe0d0', { emissive: 2 }); M.cyl(bx + bw / 2 + 0.325, 1.16, -0.09, 0.03, 0.012, { segs: 8 });
  }
  s.flush({ tier: 's' });
  g.mat('rush', '#8a7a5a'); M.box(x0 + 0.3, 0.002, -d + 0.1, x1 - 0.3, 0.014, -0.35, { faces: 'Y' }); s.flush({ tier: 'd', cast: false });
  sign(s, o.sign, cx, H + 0.16, d + 0.28, { face: 'Z', w: Math.min(3.2, x1 - x0 - 0.4), h: 0.22, board: false, glow: 1.4 });
  lamp(s, 'panel', cx, H - 0.02, d / 2, { w: 1.6, d: 0.5, K: 3300, power: 0.8, clip });
  s.interact({ x: cx, y: 1.2, z: 0.7, radius: 1.8, prompt: 'Call a cab', onUse: (gm) => { if (gm.cab) gm.cab.open(o.id); } });
  s.spot('stand', cx - 0.6, 0, d - 1.6, PI, { tags: ['wait'] }); s.spot('stand', cx + 0.7, 0, d - 1.9, PI * 0.9, { tags: ['wait'] });
  return { cx };
}

// ---------------------------------------------------------------------------------------------------------------
// A wall lift between tiers: brass doors in a stone frame against the riser, a dial, a lit plate, and a prompt that fades,
// moves the player to another frame and names where they are. o: { x, label, sub, prompt, to: { frame, x, y, z, yaw }, secs, banner, clip, door }
// ---------------------------------------------------------------------------------------------------------------
export function wallLift(game, s, o) {
  const g = s.g, M = mz(g), x = o.x, w = 1.5;
  g.mat('stone', '#b4a48a'); M.box(x - w / 2 - 0.4, 0, -0.3, x - w / 2, 3.3, 0, { faces: 'xXzY' }); M.box(x + w / 2, 0, -0.3, x + w / 2 + 0.4, 3.3, 0, { faces: 'xXzY' }); M.box(x - w / 2 - 0.5, 3.0, -0.36, x + w / 2 + 0.5, 3.45, 0, { faces: 'xXzYy' });
  g.mat('cast', o.door || '#b08a45', { rough: -0.12 }); M.box(x - w / 2, 0.02, -0.12, x - 0.01, 2.8, -0.05); M.box(x + 0.01, 0.02, -0.12, x + w / 2, 2.8, -0.05);
  g.mat('cast', '#8a6d3b'); for (const yy of [0.6, 1.4, 2.2]) M.box(x - w / 2 + 0.05, yy, -0.135, x + w / 2 - 0.05, yy + 0.04, -0.12);
  g.mat('plain', '#1a1a1a'); M.box(x - w / 2, 2.8, -0.06, x + w / 2, 3.0, -0.05, { faces: 'z' });
  s.flush({ tier: 's' });
  s.solid(x - w / 2 - 0.4, 0, 0, x + w / 2 + 0.4, 3.45, 0.3);
  s.deco(() => {
    g.mat('paper', '#efe6d2', { emissive: 0.8, lamp: true }); M.lathe(x, -0.37, [[0.24, 3.62], [0, 3.62]], { segs: 18, capTop: false, capBottom: false });
    g.mat('cast', '#2e2a26'); M.box(x - 0.01, 3.62, -0.38, x + 0.01, 3.78, -0.375);
    g.mat('cast', '#5a4a33'); M.lathe(x, -0.36, [[0.27, 3.6], [0.27, 3.64]], { segs: 18, capTop: false, capBottom: false });
    g.mat('cast', '#3a3430'); M.box(x + w / 2 + 0.12, 1.1, -0.36, x + w / 2 + 0.3, 1.4, -0.3, { bevel: 0.01 });
    g.mat('diffuser', '#ffd27a', { emissive: 2.2 }); M.cyl(x + w / 2 + 0.21, 1.25, -0.37, 0.035, 0.012, { segs: 8 });
  });
  sign(s, { kind: 'plate', text: o.label, sub: o.sub }, x, 3.22, 0.37, { face: 'Z', w: 1.6, h: 0.3, glow: 0.6 });
  lamp(s, 'sconce', x - w / 2 - 0.62, 2.4, 0.05, { face: 'Z', K: 2800, power: 0.6, clip: o.clip });
  s.interact({ x, y: 1.2, z: 0.7, radius: 1.5, prompt: o.prompt, onUse: async (gm) => {
    const fr = gm.world.frames.get(o.to.frame);
    if (!fr) { toast(gm, 'The lift is standing at another tier. Try again in a minute.'); return; }
    if (gm.busy) return;
    gm.busy++;
    try {
      sfx(gm, 'chime', s.frame, x, 2.4, 0.3);
      if (gm.player.seat) gm.player.stand();
      if (gm.ui && gm.ui.fade) await gm.ui.fade(true, 0.45);
      gm.player.place(fr, o.to.x, o.to.y || 0, o.to.z, o.to.yaw || 0, 0);
      if (gm.ui && gm.ui.fade) { await gm.ui.fade(false, 0.55); if (o.banner && gm.ui.banner) gm.ui.banner(o.banner[0], o.banner[1] || ''); }
      if (o.secs) toast(gm, o.secs);
    } finally { gm.busy--; }
  } });
}

// A string of small cloth lanterns on a sagging cord between a and b. Returns the lanterns' positions.
export function lanternString(s, a, b, cols, n = 10, sag = 0.8) {
  const g = s.g;
  const P = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t];
  const line = []; for (let i = 0; i <= 16; i++) line.push(P(i / 16));
  g.mat('brushed', '#3a3430'); g.tube(line, 0.006, { segs: 3, caps: false });
  const out = [], rr = 0.13;
  for (let i = 0; i < n; i++) {
    const p = P((i + 0.5) / n), y = p[1] - 0.16;
    g.mat('brushed', '#3a3430'); g.tube([[p[0], p[1], p[2]], [p[0], y + rr * 1.2, p[2]]], 0.004, { segs: 3, caps: false });
    g.mat('paper', cols[i % cols.length], { emissive: 2.4, lamp: true });
    g.lathe(p[0], p[2], [[rr * 0.3, y - rr], [rr * 0.85, y - rr * 0.6], [rr, y], [rr * 0.85, y + rr * 0.6], [rr * 0.3, y + rr]], { segs: 8 });
    out.push([p[0], y, p[2]]);
  }
  s.flush({ tier: 'd', cast: false });
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Cloth petals that fall slowly: one mesh of n small double-sided squares of cloth whose corners are rewritten every frame
// while any of them is moving, and which is hidden when none is. throw(x, y, z, yawOfThrow) sends a handful up.
// floorAt(x, z) gives the height they land on. At a third of a g, with cloth's drag, they come down at about a third of a
// metre a second and drift a little spinward.
// ---------------------------------------------------------------------------------------------------------------
const PETAL_COLS = ['#d95d7a', '#e8b45a', '#f2d27a', '#c9552e', '#e9e1cf', '#9a6a8a', '#e8743b', '#2f8f8a', '#d98a7a'];
export function petals(s, o) {
  const n = o.n || 72, g = new Geo(new MeshBuf(n * 8, n * 12)), r = new Rng(hashStr('fw-petals'));
  const P = [];
  for (let i = 0; i < n; i++) {
    g.mat('weave', PETAL_COLS[i % PETAL_COLS.length], { rough: 0.1 });
    g.quad([0, 0, 0], [0.05, 0, 0], [0.05, 0, 0.04], [0, 0, 0.04], { double: true });
    P.push({ x: 0, y: -9, z: 0, vx: 0, vy: 0, vz: 0, a: r.f(0, 6.28), w: r.f(2, 5), ph: r.f(0, 6.28), sz: r.f(0.07, 0.1), state: 0, t: 0 });
  }
  const geom = g.buf.toGeometry();
  const mesh = new THREE.Mesh(geom, s.world.mats.opaque);
  const origin = [o.x, 0, o.z];
  s.world.addRenderable(mesh, { frame: s.frame, origin: origin.slice(), center: [0, 3, 0], radius: 14, far: 90, caster: false, scope: s });
  s.meshes.push(mesh);
  mesh.userData.hidden = true;
  const pos = geom.attributes.position, nrm = geom.attributes.normal, PA = pos.array, NA = nrm.array;
  const G = o.g || 3.27, VT = o.vt || 0.34, DRIFT = o.drift || 0.05;
  let live = 0, rest = 0;
  const write = () => {
    for (let i = 0; i < n; i++) {
      const p = P[i], b = i * 8;
      // the petal's two edges: a spins about the vertical, the tumble tilts it
      const tl = p.state === 2 ? 0 : 0.9 * Math.sin(p.ph), c = Math.cos(p.a), sn = Math.sin(p.a), sz = p.sz;
      const ux = c * sz, uz = -sn * sz, vx = sn * sz * Math.cos(tl), vy = Math.sin(tl) * sz, vz = c * sz * Math.cos(tl);
      const cx = p.x - origin[0] - (ux + vx) / 2, cy = p.y - vy / 2 + 0.004, cz = p.z - origin[2] - (uz + vz) / 2;
      const C = [[cx, cy, cz], [cx + ux, cy, cz + uz], [cx + ux + vx, cy + vy, cz + uz + vz], [cx + vx, cy + vy, cz + vz]];
      const ord = [0, 1, 2, 3, 0, 3, 2, 1];
      // normal of the front face: u x v
      let nx = 0 * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - 0 * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      for (let k = 0; k < 8; k++) {
        const q = C[ord[k]], j = (b + k) * 3, sgn = k < 4 ? 1 : -1;
        PA[j] = q[0]; PA[j + 1] = q[1]; PA[j + 2] = q[2];
        NA[(b + k) * 4] = Math.round(sgn * nx * 127); NA[(b + k) * 4 + 1] = Math.round(sgn * ny * 127); NA[(b + k) * 4 + 2] = Math.round(sgn * nz * 127);
      }
    }
    pos.needsUpdate = true; nrm.needsUpdate = true;
  };
  s.every((dt) => {
    if (!live && rest <= 0) return;
    dt = Math.min(dt, 0.05);
    let moving = 0;
    for (const p of P) {
      if (p.state === 1) {
        p.t += dt;
        // for the first part of a second the handful flies up together; then each petal's drag takes over and it settles
        // to a slow fall (linear drag with the fall speed VT), swaying as it goes
        const c = p.t < 0.7 ? 0.6 : G / VT, e = Math.exp(-c * dt), vT = -G / c;
        p.vy = vT + (p.vy - vT) * e;
        const k = 1 - Math.exp(-dt * (p.t < 0.7 ? 0.4 : 1.1));
        p.vx += (DRIFT - p.vx) * k; p.vz += (0 - p.vz) * k;
        p.ph += p.w * dt; p.a += dt * p.w * 0.4;
        p.x += (p.vx + Math.sin(p.ph) * 0.22) * dt; p.y += p.vy * dt; p.z += (p.vz + Math.cos(p.ph * 0.7) * 0.18) * dt;
        const fy = o.floorAt ? o.floorAt(p.x, p.z) : 0;
        if (p.y <= fy && p.vy < 0) { p.y = fy; p.state = 2; }
        else moving++;
      }
    }
    live = moving;
    if (!live) rest -= dt;
    if (!live && rest <= 0) { mesh.userData.hidden = true; for (const p of P) { p.state = 0; p.y = -9; } }
    write();
  });
  return {
    throw(x, y, z, yaw) {
      const fx = Math.sin(yaw) * 2.6, fz = -Math.cos(yaw) * 2.6;
      const R = new Rng(hashStr('throw' + Math.round(performance.now())));
      for (const p of P) {
        p.x = x + R.f(-0.15, 0.15); p.y = y + R.f(-0.1, 0.1); p.z = z + R.f(-0.15, 0.15);
        p.vx = fx + R.f(-1.3, 1.3); p.vy = R.f(3.4, 5.6); p.vz = fz + R.f(-1.3, 1.3);
        p.state = 1; p.t = 0; p.ph = R.f(0, 6.28);
      }
      live = P.length; rest = 40; mesh.userData.hidden = false; write();
    },
    get flying() { return live; },
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Props (front +z, which on these terraces is the Hollow when yaw is 0)
// ---------------------------------------------------------------------------------------------------------------

// A long terrace bench: stone ends, oak slats, a low back. p: { w, wood, stone, back }
defineProp('fw.bench', (g, p) => {
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
  for (let i = 0; i < k; i++) spots.push({ type: 'sit', x: -w / 2 + (i + 0.5) * w / k, y: 0.45, z: 0.0, yaw: 0, tags: ['watch', 'evening'] });
  return { solid: [[-w / 2, 0, -0.32, w / 2, 0.45, 0.22]], spots, tier: 's' };
});

// A low lamp for the dark hours: a hooded head that throws light down, not into the view.
defineProp('fw.bollard', (g, p) => {
  g.mat('cast', p.metal || '#3a3a33');
  g.lathe(0, 0, [[0.09, 0], [0.085, 0.06], [0.05, 0.1], [0.04, 0.62], [0.06, 0.66]], { segs: 10 });
  g.box(-0.1, 0.66, -0.1, 0.1, 0.7, 0.1, { bevel: 0.01 });
  g.mat('diffuser', '#ffd6a0', { emissive: 3.2, night: true }); g.box(-0.075, 0.7, -0.075, 0.075, 0.78, 0.075, { faces: 'xXzZ' });
  g.mat('cast', p.metal || '#3a3a33'); g.lathe(0, 0, [[0.13, 0.78], [0.12, 0.8], [0.05, 0.86], [0.02, 0.89], [0, 0.9]], { segs: 10 });
  return { posts: [[0, 0, 0.1, 0, 0.9]], tier: 'd' };
});

// A deep armchair with rolled arms and a throw, for the doorsteps of the shelf flats. p: { cloth, wood, throw }
defineProp('fw.armchair', (g, p) => {
  const cloth = p.cloth || '#7a2f3c', wood = p.wood || '#4a3020';
  g.mat('wood', wood); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.lathe(sx * 0.36, sz * 0.34, [[0.03, 0], [0.026, 0.1], [0.032, 0.14]], { segs: 8 });
  g.mat('knit', cloth); g.box(-0.42, 0.14, -0.4, 0.42, 0.36, 0.4, { bevel: 0.04, aoBottom: 0.8 });
  g.mat('knit', shadeHex(cloth, 1.12)); g.box(-0.3, 0.36, -0.28, 0.3, 0.48, 0.4, { bevel: 0.05 });
  g.mat('knit', cloth);
  g.push(); g.move(0, 0.36, -0.36); g.rotX(-0.22); g.box(-0.42, 0, -0.08, 0.42, 0.62, 0.1, { bevel: 0.05 }); g.pop();
  for (const sx of [-1, 1]) { g.box(sx * 0.42 - 0.12, 0.14, -0.4, sx * 0.42 + 0.0, 0.6, 0.38, { bevel: 0.04 }); g.tube([[sx * 0.36, 0.6, -0.36], [sx * 0.36, 0.6, 0.38]], 0.07, { segs: 8 }); }
  if (p.throw) { g.mat('weave', p.throw); g.sheet([0.3, 0.68, -0.36], [0.3, 0.68, 0.2], [0.5, 0.25, 0.22], [0.5, 0.25, -0.36], { nu: 4, nv: 4, sag: 0.03 }); }
  return { solid: [[-0.45, 0, -0.45, 0.45, 0.48, 0.42]], spots: [{ type: 'sit', x: 0, y: 0.46, z: 0.08, yaw: 0, tags: ['elders', 'watch', 'evening'] }], tier: 's' };
});

// The Last Pot: a narrow stall with one big enamelled pot on a hotplate, a ladle on a hook, lidded cups in rows and a
// striped awning. Front (+z) is the customers' side. p: { body, trim }
defineProp('fw.potstall', (g, p) => {
  const body = p.body || '#5b4060', trim = p.trim || '#d6a640', W = 2.2;
  g.mat('paint', body); g.box(-W / 2, 0, -0.42, W / 2, 0.94, 0.42, { bevel: 0.02, aoBottom: 0.75 });
  g.mat('paint', shadeHex(body, 1.22)); for (const x of [-0.7, 0, 0.7]) g.box(x - 0.3, 0.12, 0.42, x + 0.3, 0.82, 0.44, { bevel: 0.008 });
  g.mat('cast', trim); for (const x of [-0.7, 0, 0.7]) { g.box(x - 0.31, 0.81, 0.435, x + 0.31, 0.825, 0.45); g.box(x - 0.31, 0.11, 0.435, x + 0.31, 0.125, 0.45); }
  g.mat('wood', '#9a6a3e', { rough: -0.12 }); g.box(-W / 2 - 0.05, 0.94, -0.48, W / 2 + 0.05, 0.99, 0.6, { bevel: 0.012 });
  // the hotplate and the pot: deep enamel, a domed lid with a knob, a ladle hanging from the rim
  g.mat('cast', '#2e2a26'); g.cyl(-0.45, 0.99, -0.12, 0.27, 0.06, { segs: 18 });
  g.mat('diffuser', '#ff8a3a', { emissive: 1.2 }); g.cyl(-0.45, 1.05, -0.12, 0.22, 0.004, { segs: 18 });
  g.mat('glaze', '#2f6f73', { rough: -0.2 }); g.lathe(-0.45, -0.12, [[0, 1.055], [0.22, 1.055], [0.25, 1.09], [0.255, 1.38], [0.245, 1.41]], { segs: 22, capTop: false });
  g.mat('glaze', '#e9e1cf'); g.lathe(-0.45, -0.12, [[0.255, 1.408], [0.25, 1.42], [0.2, 1.47], [0.08, 1.5], [0.04, 1.52], [0.05, 1.56], [0, 1.57]], { segs: 22, capBottom: false });
  g.mat('cast', '#c8a45a'); for (const sx of [-1, 1]) g.tube([[-0.45 + sx * 0.25, 1.32, -0.12], [-0.45 + sx * 0.31, 1.32, -0.12], [-0.45 + sx * 0.31, 1.26, -0.12], [-0.45 + sx * 0.25, 1.26, -0.12]], 0.012, { segs: 5 });
  g.mat('brushed', '#c9c4bb'); g.tube([[-0.18, 1.42, -0.12], [-0.12, 1.42, -0.12], [-0.1, 1.0, -0.1]], 0.009, { segs: 5 }); g.lathe(-0.1, -0.1, [[0, 0.98], [0.05, 0.99], [0.055, 1.03], [0.05, 1.035]], { segs: 10, capTop: false });
  // lidded cups: a tray of them ready, and a stack
  const cup = (x, y, z, c) => { g.mat('glaze', c); g.lathe(x, z, [[0, y], [0.028, y], [0.038, y + 0.012], [0.042, y + 0.085], [0, y + 0.085]], { segs: 10 }); g.mat('glaze', shadeHex(c, 0.78)); g.lathe(x, z, [[0.045, y + 0.085], [0.042, y + 0.095], [0.012, y + 0.104], [0.012, y + 0.114], [0, y + 0.115]], { segs: 10, capBottom: false }); };
  g.mat('wood', '#7a5233'); g.box(0.1, 0.99, 0.12, 0.72, 1.01, 0.5, { bevel: 0.006 });
  const CC = ['#e9e1cf', '#c9763e', '#2f6f73', '#d98a7a', '#e9e1cf', '#5b4060', '#d9c08a', '#e9e1cf'];
  for (let i = 0; i < 8; i++) cup(0.18 + (i % 4) * 0.15, 1.01, 0.2 + Math.floor(i / 4) * 0.16, CC[i]);
  g.mat('glaze', '#e9e1cf'); for (let k = 0; k < 6; k++) g.lathe(0.75, -0.25, [[0.03, 0.99 + k * 0.03], [0.042, 1.02 + k * 0.03]], { segs: 10, capTop: false });
  // a crock of spice and a jug
  g.mat('glaze', '#7a2f3c'); g.lathe(0.45, -0.28, [[0, 0.99], [0.06, 0.99], [0.07, 1.08], [0.05, 1.12], [0, 1.13]], { segs: 12 });
  g.mat('glaze', '#d6a640'); g.lathe(0.98, 0.3, [[0, 0.99], [0.05, 0.99], [0.06, 1.1], [0.045, 1.16], [0.05, 1.19], [0, 1.19]], { segs: 12 });
  // awning: posts at the back, frame, plum and ochre stripes with a scalloped edge
  g.mat('cast', '#3a3430'); for (const x of [-W / 2, W / 2]) { g.tube([[x, 0.99, -0.45], [x, 2.6, -0.45]], 0.022, { segs: 6 }); g.tube([[x, 2.58, -0.45], [x, 2.02, 0.92]], 0.016, { segs: 5 }); }
  g.tube([[-W / 2, 2.02, 0.92], [W / 2, 2.02, 0.92]], 0.016, { segs: 5 });
  g.mat('cast', trim); for (const x of [-W / 2, W / 2]) g.ball(x, 2.64, -0.45, 0.04, 0.04, 0.04, { segs: 8, rings: 5 });
  const ST = ['#5b4060', '#e8b45a', '#5b4060', '#efe2c4'], NS = 8;
  for (let i = 0; i < NS; i++) {
    const a = -W / 2 - 0.05 + (W + 0.1) * i / NS, b = -W / 2 - 0.05 + (W + 0.1) * (i + 1) / NS; g.mat('weave', ST[i % ST.length]);
    g.quad([a, 2.62, -0.5], [b, 2.62, -0.5], [b, 2.03, 0.96], [a, 2.03, 0.96], { double: true });
    g.quad([a, 2.03, 0.96], [b, 2.03, 0.96], [b, 1.87, 0.97], [a, 1.87, 0.97], { double: true });
    g.quad([a, 1.87, 0.97], [b, 1.87, 0.97], [(a + b) / 2, 1.77, 0.975], [(a + b) / 2 - 0.001, 1.77, 0.975], { double: true });
  }
  return { solid: [[-W / 2 - 0.05, 0, -0.5, W / 2 + 0.05, 1.0, 0.6]], tier: 's' };
});

// A brass telescope on a cast post with a yoke, a step for children, and a little shelf. It looks toward +z.
defineProp('fw.telescope', (g, p) => {
  g.mat('cast', '#3a3a33'); g.lathe(0, 0, [[0.22, 0], [0.2, 0.05], [0.07, 0.1], [0.055, 1.05], [0.07, 1.1], [0.05, 1.16]], { segs: 14 });
  g.mat('cast', '#5a4a33'); g.box(-0.13, 1.16, -0.03, 0.13, 1.2, 0.03, { bevel: 0.008 }); for (const sx of [-1, 1]) g.box(sx * 0.12 - 0.015, 1.18, -0.03, sx * 0.12 + 0.015, 1.36, 0.03, { bevel: 0.006 });
  // the tube: tilted up a little toward the Hollow
  g.push(); g.move(0, 1.32, 0); g.rotX(-0.18);
  g.mat('cast', '#b08a45', { rough: -0.18 }); g.tube([[0, 0, -0.55], [0, 0, 0.45]], [0.045, 0.06], { segs: 14 });
  g.mat('cast', '#8a6d3b'); for (const z of [-0.45, -0.1, 0.25]) g.tube([[0, 0, z - 0.012], [0, 0, z + 0.012]], 0.064, { segs: 14 });
  g.tube([[0, 0, 0.45], [0, 0, 0.6]], 0.075, { segs: 14 });
  g.mat('plain', '#101418', { rough: -0.45 }); g.cyl(0, 0, 0.6, 0.06, 0.002, { segs: 12 });
  g.mat('cast', '#2e2a26'); g.tube([[0, 0, -0.55], [0, 0, -0.68]], 0.022, { segs: 10 });
  g.pop();
  // the step, worn in the middle
  g.mat('stone', '#a89a84'); g.box(-0.3, 0, -0.75, 0.3, 0.22, -0.45, { bevel: 0.02, aoBottom: 0.7 });
  g.mat('stone', '#bfb19a'); g.box(-0.18, 0.22, -0.7, 0.18, 0.226, -0.5, { faces: 'Y' });
  return { posts: [[0, 0, 0.2, 0, 1.4]], solid: [[-0.3, 0, -0.75, 0.3, 0.22, -0.45]], tier: 's' };
});

// The dusk book: a sloped stone lectern with a big open book chained to it under a bronze hood. Front (+z) is the reader's side.
defineProp('fw.lectern', (g, p) => {
  g.mat('stone', '#b4a48a'); g.box(-0.28, 0, -0.22, 0.28, 0.08, 0.22, { bevel: 0.015, aoBottom: 0.7 }); g.box(-0.16, 0.08, -0.12, 0.16, 0.95, 0.1, { bevel: 0.02 });
  g.push(); g.move(0, 1.0, 0); g.rotX(0.38);
  g.mat('stone', '#c4b49a'); g.box(-0.36, -0.06, -0.26, 0.36, 0.0, 0.24, { bevel: 0.015 });
  g.mat('leather', '#5b3a2a'); g.box(-0.32, 0.0, -0.2, 0.32, 0.02, 0.2, { bevel: 0.006 });
  g.mat('paper', '#efe6d2'); g.box(-0.3, 0.02, -0.19, -0.01, 0.045, 0.19, { bevel: 0.004 }); g.box(0.01, 0.02, -0.19, 0.3, 0.045, 0.19, { bevel: 0.004 });
  g.mat('plain', '#5a4e44'); for (let k = 0; k < 9; k++) { const z = -0.15 + k * 0.035; g.box(-0.27, 0.046, z, -0.04 - (k % 3) * 0.03, 0.047, z + 0.006); g.box(0.04, 0.046, z, 0.27 - (k % 2) * 0.05, 0.047, z + 0.006); }
  g.mat('weave', '#b8584a'); g.box(-0.005, 0.045, -0.19, 0.005, 0.048, 0.3);
  g.pop();
  g.mat('cast', '#5a4a33'); g.tube([[0.2, 0.9, -0.12], [0.24, 1.25, -0.2], [0.24, 1.55, -0.1]], 0.014, { segs: 5 });
  g.mat('cast', '#7a5a33', { rough: -0.1 }); g.lathe(0.24, -0.02, [[0.0, 1.5], [0.12, 1.5], [0.16, 1.47], [0.12, 1.56], [0.03, 1.6], [0, 1.6]], { segs: 14 });
  g.mat('diffuser', '#ffd9a0', { emissive: 3.2, night: true }); g.cyl(0.24, 1.49, -0.02, 0.05, 0.01, { segs: 10 });
  return { solid: [[-0.3, 0, -0.25, 0.3, 1.0, 0.25]], tier: 's' };
});

// A big lidded tureen on a board, for a hall's dish. p: { glaze, lid, r }
defineProp('fw.tureen', (g, p) => {
  const r = p.r || 0.2, c = p.glaze || '#2f6f73';
  g.mat('wood', '#6b4a2f'); g.box(-r - 0.08, 0, -r - 0.08, r + 0.08, 0.025, r + 0.08, { bevel: 0.008 });
  g.mat('glaze', c, { rough: -0.2 }); g.lathe(0, 0, [[0, 0.025], [r * 0.6, 0.025], [r * 0.65, 0.04], [r * 0.95, r * 0.45], [r, r * 0.7], [r * 0.97, r * 0.74]], { segs: 22, capTop: false });
  g.mat('glaze', p.lid || '#e9e1cf'); g.lathe(0, 0, [[r * 1.02, r * 0.72], [r, r * 0.8], [r * 0.7, r * 1.05], [r * 0.25, r * 1.15], [r * 0.12, r * 1.18], [r * 0.18, r * 1.3], [r * 0.1, r * 1.38], [0, r * 1.39]], { segs: 22, capBottom: false });
  g.mat('cast', '#c8a45a'); for (const sx of [-1, 1]) g.tube([[sx * r * 0.95, r * 0.55, 0], [sx * r * 1.2, r * 0.6, 0], [sx * r * 1.2, r * 0.45, 0], [sx * r * 0.97, r * 0.4, 0]], 0.01, { segs: 5 });
  return { cast: false };
});

// The petal bag: a deep cloth bag on a stand, full of cloth petals. p: { cloth }
defineProp('fw.petalbag', (g, p) => {
  g.mat('wood', '#6b4a2f'); for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2 + 0.3; g.tube([[Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3], [Math.cos(a) * 0.2, 0.75, Math.sin(a) * 0.2]], 0.02, { segs: 5 }); }
  g.mat('cast', '#5a4a33'); const ring = []; for (let k = 0; k < 16; k++) { const a = k / 16 * PI * 2; ring.push([Math.cos(a) * 0.22, 0.75, Math.sin(a) * 0.22]); } g.tube(ring, 0.014, { segs: 4, closed: true });
  g.mat('weave', p.cloth || '#e2c48a'); g.lathe(0, 0, [[0.06, 0.32], [0.17, 0.4], [0.22, 0.55], [0.23, 0.75], [0.25, 0.8]], { segs: 16, capTop: false });
  const r = new Rng(hashStr('fw-bag'));
  for (let i = 0; i < 40; i++) { const a = r.f(0, 6.28), d = r.f(0, 0.19); g.mat('weave', PETAL_COLS[i % PETAL_COLS.length]); g.box(Math.cos(a) * d - 0.022, 0.73 + r.f(0, 0.04), Math.sin(a) * d - 0.018, Math.cos(a) * d + 0.022, 0.735 + r.f(0, 0.04), Math.sin(a) * d + 0.018); }
  return { posts: [[0, 0, 0.3, 0, 0.82]], tier: 's' };
});

// A frame drum on a low stand, and a hand drum: for the band corner. p: { skin }
defineProp('fw.drums', (g, p) => {
  g.mat('wood', '#8a5a2a'); g.lathe(0, 0, [[0.24, 0], [0.26, 0.05], [0.26, 0.42], [0.24, 0.46]], { segs: 18 });
  g.mat('weave', p.skin || '#e8dcc0'); g.cyl(0, 0.46, 0, 0.245, 0.01, { segs: 18 });
  g.mat('cast', '#c8a45a'); g.lathe(0, 0, [[0.262, 0.2], [0.265, 0.22], [0.262, 0.24]], { segs: 18, capTop: false, capBottom: false });
  g.push(); g.move(0.55, 0.62, -0.05); g.rotX(1.2);
  g.mat('wood', '#c9a46a'); g.lathe(0, 0, [[0.3, -0.04], [0.31, 0], [0.31, 0.06], [0.3, 0.08]], { segs: 22, capTop: false, capBottom: false });
  g.mat('weave', '#efe2c4'); g.cyl(0, 0.08, 0, 0.3, 0.004, { segs: 22 });
  g.pop();
  g.mat('cast', '#3a3430'); g.tube([[0.55, 0, 0.1], [0.55, 0.45, 0.0]], 0.012, { segs: 4 }); g.tube([[0.45, 0, -0.2], [0.55, 0.45, 0.0]], 0.012, { segs: 4 }); g.tube([[0.65, 0, -0.2], [0.55, 0.45, 0.0]], 0.012, { segs: 4 });
  return { posts: [[0, 0, 0.26, 0, 0.46]], tier: 's' };
});
