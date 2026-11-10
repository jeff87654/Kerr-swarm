// Parts for the back end wall's terraces and the flying hall's gate (back_wall.js): props, the terrace facade with its
// windows, the broad rail with its planted lip, rope nets, lantern strings, and small helpers for seats and boards.
// Everything long that runs along x is drawn in short pieces, because x bends with the drum (sharply at the hub).
import { defineProp } from '../world/props.js';
import { Rng, hashStr, shadeHex } from '../core/util.js';

export const wallParts = true;

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

// Say lines as someone (a cast entry or a plain name), safely.
export async function say(game, who, lines) {
  if (!game.ui) return;
  const sp = who && typeof who === 'object' && who.look ? { name: who.short || who.name, colour: who.look.top } : who;
  game.busy++;
  try { await game.ui.say(sp, lines); } finally { game.busy--; }
}

// Read a sign spec aloud as a little card of lines.
export async function readSpec(game, spec, extra) {
  const lines = [];
  if (spec.text) lines.push(spec.text + (spec.sub ? '. ' + spec.sub + '.' : '.'));
  if (spec.lines) { let buf = ''; for (const l of spec.lines) { buf = buf ? buf + ' ' + l : l; if (buf.length > 80) { lines.push(buf); buf = ''; } } if (buf) lines.push(buf); }
  if (extra) lines.push(...(Array.isArray(extra) ? extra : [extra]));
  await say(game, spec.title || spec.text || 'A notice', lines.length ? lines : ['(blank)']);
}

// Show a menu and spend from the wallet. Returns the item bought or null.
export async function buy(game, menu, kicker, onBought) {
  if (!game.ui || !menu) return null;
  game.busy++;
  try {
    const day = game.clock ? game.clock.day : 1, hr = game.clock ? game.clock.hours : 12;
    const items = menu.items.filter((it) => !it.days || it.days.indexOf(day) >= 0).map((it) => Object.assign({}, it, { disabled: (it.hours && (hr < it.hours[0] || hr >= it.hours[1])) || (game.wallet && it.price > game.wallet.kwh + 1e-6) }));
    const id = await game.ui.menu({ kicker: kicker || '', title: menu.title, note: menu.note, items, wallet: game.wallet ? game.wallet.kwh : 0 });
    if (!id) return null;
    const it = menu.items.find((q) => q.id === id); if (!it) return null;
    if (game.wallet && it.price > 0 && !game.wallet.spend(it.price, it.name)) return null;
    if (it.price <= 0) toast(game, it.name + ', free tonight.');
    if (onBought) onBought(it);
    return it;
  } finally { game.busy--; }
}

// A seat the player can take: (x, y, z) the floor under it, yaw the way it faces (prop convention).
export function seat(s, x, y, z, yaw, label, o = {}) {
  return s.interact({ x, y: y + 0.55, z, radius: o.radius || 1.0,
    prompt: (game) => (game.player.seat ? 'Stand up' : label),
    onUse(game) {
      const p = game.player; if (p.seat) { p.stand(); return; }
      p.sit({ x, y: y + (o.lift || 0), z, yaw: Math.PI - yaw, eye: o.eye || 1.12 }); p.yaw = Math.PI - yaw; p.pitch = o.pitch || 0.02;
      if (o.onSit) o.onSit(game);
    } });
}

// ---------------------------------------------------------------------------------------------------------------
// The terrace facade: the riser behind a terrace, with the windows of the oldest people's flats.
// Bays are 5.5 m and rows 4.17 m, the same as the engine's painting of the wall above, so the two read as one.
// o: { x0, x1, h, tint, stone, trim, gaps: [[a, b]], doors: [x...], seed, lit (share of lit windows) }
// Returns { doors: [{ x }], windows: n }.
// ---------------------------------------------------------------------------------------------------------------
export const BAY = 5.5, ROW = 50 / 12;
const CURTAINS = ['#d9a46a', '#c9763e', '#e2c48a', '#b8584a', '#d8b06c', '#9a6a8a', '#7a9a8a', '#e6b980'];
export function facade(s, o) {
  const g = s.g, x0 = o.x0, x1 = o.x1, h = o.h || 12.6, tint = o.tint || '#d9c8aa', stone = o.stone || '#b4a48a', trim = o.trim || '#2f5d5a';
  const r = new Rng(hashStr('facade' + (o.seed || 0)));
  const inGap = (a, b) => (o.gaps || []).some((gp) => b > gp[0] && a < gp[1]);
  // the wall body, in 12 m stretches: a stone base to 1 m, warm render above
  runX(x0, x1, 12, (a, b) => {
    g.mat('stone', stone); g.box(a, 0, 0, b, 1.0, 0.6, { faces: 'z', aoBottom: 0.7 });
    g.mat('plaster', tint); g.box(a, 1.0, 0, b, h, 0.6, { faces: 'zY' });
    g.mat('stone', shadeHex(stone, 0.9)); g.box(a, 0.98, -0.05, b, 1.06, 0, { faces: 'zY' });
    s.flush({ tier: 's' });
  });
  s.solid(x0, 0, 0, x1, h + 0.6, 0.6);
  // string courses and the cornice, piece by piece
  runX(x0, x1, 3, (a, b) => {
    g.mat('stone', stone);
    for (const yy of [ROW, 2 * ROW]) g.extrude([[0, yy - 0.12], [0, yy + 0.12], [-0.1, yy + 0.12], [-0.14, yy + 0.06], [-0.1, yy - 0.06], [-0.04, yy - 0.12]], a, b, 'x');
    g.extrude([[0, h - 0.5], [0, h], [-0.62, h], [-0.62, h - 0.12], [-0.4, h - 0.2], [-0.22, h - 0.3], [-0.12, h - 0.42]], a, b, 'x');
  });
  s.flush({ tier: 's' });
  // the planted gutter on top of the cornice (the lip the far wall paints green)
  g.mat('soil', '#ffffff'); runX(x0, x1, 4, (a, b) => g.box(a, h, -0.6, b, h + 0.05, 0.4, { faces: 'Y' }));
  for (let x = x0 + 0.3; x < x1 - 0.2; x += 0.55) {
    const sc = r.f(0.6, 1.2);
    g.mat(r.chance(0.6) ? 'leafA' : 'fern', r.chance(0.2) ? '#d8e8b0' : '#ffffff', { sway: 0.4 });
    g.card(x + r.f(-0.2, 0.2), h + 0.02, r.f(-0.4, 0.1), 0.9 * sc, 0.7 * sc, r.f(0, 3.1), { tilt: r.f(-0.3, 0.3) });
    if (r.chance(0.45)) { g.mat('leafB', '#ffffff', { sway: 0.6 }); g.card(x, h - 0.9 * sc, -0.66, 0.5 * sc, 0.95 * sc, 0, { tilt: -0.08 }); }      // trailing over the edge
  }
  s.flush({ tier: 's', cast: false });
  // pilasters at every bay line
  for (let k = Math.ceil(x0 / BAY); k * BAY <= x1; k++) {
    const x = k * BAY; if (x < x0 + 0.3 || x > x1 - 0.3 || inGap(x - 0.3, x + 0.3)) continue;
    g.mat('stone', stone); g.box(x - 0.3, 0, -0.2, x + 0.3, h - 0.5, 0, { faces: 'xXz', aoBottom: 0.7 });
    g.box(x - 0.36, 0, -0.26, x + 0.36, 0.5, 0, { faces: 'xXzY', aoBottom: 0.7 });
  }
  s.flush({ tier: 's' });
  // windows: two upper rows in every bay, one ground-floor pair where there is no door
  let nWin = 0; const doors = [];
  const doorBays = new Set((o.doors || []).map((x) => Math.floor(x / BAY)));
  for (let k = Math.floor(x0 / BAY); k * BAY < x1; k++) {
    const wa = (k + 0.18) * BAY, wb = (k + 0.72) * BAY;
    if (wa < x0 + 0.4 || wb > x1 - 0.4 || inGap(wa - 0.3, wb + 0.3)) continue;
    for (const row of [1, 2]) { window_(s, wa, wb, (row + 0.25) * ROW, (row + 0.8) * ROW, r, trim, stone, o.lit === undefined ? 0.4 : o.lit, row === 1 && r.chance(0.55)); nWin++; }
    if (doorBays.has(k)) { const dx = (k + 0.45) * BAY; doors.push({ x: dx }); flatDoor(s, dx, r, trim, stone); }
    else { for (const c of [wa + 0.35, wb - 1.25]) window_(s, c, c + 0.9, 1.05, 2.75, r, trim, stone, 0.35, false); nWin++; }
  }
  return { doors, windows: nWin };
}

// One window on the facade (face toward -z at z = 0): stone surround, a dark pane or a lit curtain, glazing bars, a sill,
// and sometimes a window box of flowers.
function window_(s, a, b, y0, y1, r, trim, stone, litShare, box) {
  const g = s.g, w = b - a;
  const lit = r.chance(litShare);
  if (lit) g.mat('weave', CURTAINS[r.i(0, CURTAINS.length - 1)], { emissive: 1.3, night: true });
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
    g.mat('wood', ['#2f6f73', '#8a3a2e', '#5b4060', '#6b8f4e'][r.i(0, 3)]); g.box(a + 0.1, y0 - 0.42, -0.42, b - 0.1, y0 - 0.1, -0.2, { faces: 'xXzY', bevel: 0 });
    for (let x = a + 0.25; x < b - 0.2; x += 0.32) {
      g.mat(r.chance(0.5) ? 'blossom' : 'leafA', '#ffffff', { sway: 0.5 }); g.card(x, y0 - 0.12, -0.31, 0.38, 0.36, r.f(0, 3), { tilt: r.f(-0.2, 0.2) });
      if (r.chance(0.4)) { g.mat('leafB', '#ffffff', { sway: 0.6 }); g.card(x, y0 - 0.95, -0.45, 0.3, 0.6, 0, { tilt: -0.1 }); }
    }
    s.flush({ tier: 'd', cast: false });
  }
}

// A flat's front door on the facade: stone frame, a painted panelled door, a fanlight, a step, a name plate (left to the caller).
const DOOR_COLS = ['#2f5d5a', '#8a3a2e', '#5b4060', '#2a4a6a', '#6b5a2a', '#3d5a3a'];
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
// The broad rail at a terrace's open edge: the slab's edge and its corbels below, a stone parapet, bronze balusters,
// a wide oak rail to lean on, and a planted lip trailing over the drop. Rail line at z = zr (the parapet's inner face).
// o: { x0, x1, zr, stone, bronze, oak, planted (default true), barrier (invisible height above the floor, default 4) }
// ---------------------------------------------------------------------------------------------------------------
export function broadRail(s, o) {
  const g = s.g, x0 = o.x0, x1 = o.x1, zr = o.zr, st = o.stone || '#b9a98e', br = o.bronze || '#5a4a33', oak = o.oak || '#8a6240';
  const zo = zr - 0.4, r = new Rng(hashStr('rail' + x0 + zr));
  // the slab's thickness and its fascia, seen from the floor below; corbels every bay
  runX(x0, x1, 12, (a, b) => {
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
  // the parapet and its coping
  runX(x0, x1, 4, (a, b) => {
    g.mat('stone', st); g.box(a, 0, zo, b, 0.55, zr, { faces: 'zZ', aoBottom: 0.7 });
    g.mat('stone', shadeHex(st, 1.08)); g.box(a, 0.55, zo - 0.04, b, 0.62, zr + 0.04, { faces: 'zZYy' });
  });
  s.flush({ tier: 's' });
  // balusters and the oak rail, bent along x
  g.mat('cast', br);
  for (let x = x0 + 0.25; x < x1 - 0.1; x += 0.42) g.lathe(x, zr - 0.2, [[0.035, 0.62], [0.03, 0.66], [0.018, 0.72], [0.028, 0.84], [0.016, 0.96], [0.026, 1.0]], { segs: 6, capBottom: false, capTop: false });
  s.flush({ tier: 'd', cast: false });
  runX(x0, x1, 3, (a, b) => {
    g.mat('cast', br); g.box(a, 0.99, zr - 0.26, b, 1.01, zr - 0.14, { faces: 'yY' });
    g.mat('wood', oak, { rough: -0.12 }); g.extrude([[zo - 0.04, 1.01], [zr + 0.05, 1.01], [zr + 0.07, 1.04], [zr + 0.05, 1.08], [zo + 0.02, 1.1], [zo - 0.05, 1.07]], a, b, 'x');
  });
  s.flush({ tier: 's' });
  s.solid(x0, 0, zo - 0.9, x1, 1.1, zr);
  s.solid(x0, 1.1, zo - 0.9, x1, o.barrier || 4, zr);
  // the planted lip outside the parapet, trailing over the drop
  if (o.planted !== false) {
    runX(x0, x1, 4, (a, b) => { g.mat('stone', shadeHex(st, 0.9)); g.box(a, -0.35, zo - 0.75, b, 0.3, zo, { faces: 'zY' }); g.mat('soil', '#ffffff'); g.box(a, 0.28, zo - 0.7, b, 0.31, zo, { faces: 'Y' }); });
    s.flush({ tier: 's' });
    for (let x = x0 + 0.2; x < x1 - 0.2; x += 0.5) {
      const sc = r.f(0.7, 1.25);
      g.mat(r.chance(0.3) ? 'blossom' : 'leafA', r.chance(0.25) ? '#e8f0c0' : '#ffffff', { sway: 0.5 }); g.card(x, 0.28, zo - 0.38 + r.f(-0.15, 0.15), 0.6 * sc, 0.5 * sc, r.f(0, 3.1), { tilt: r.f(-0.25, 0.25) });
      if (r.chance(0.6)) { g.mat('leafB', '#ffffff', { sway: 0.7 }); const hh = r.f(0.8, 2.2); g.card(x + 0.1, 0.3 - hh, zo - 0.78, 0.42, hh, 0, { tilt: -0.04 }); }
    }
    s.flush({ tier: 's', cast: false });
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Rope netting between two heights along a line of constant z, diamond mesh. o: { x0, x1, z, y0, y1, cell, tint, r }
// ---------------------------------------------------------------------------------------------------------------
export function netX(s, o) {
  const g = s.g, c = o.cell || 0.45, r = o.r || 0.008; g.mat('weave', o.tint || '#d8cdb0');
  const H = o.y1 - o.y0;
  runX(o.x0, o.x1, 6, (a, b) => {
    for (let x = a - H; x < b; x += c) {
      // one rope rising to the right, one rising to the left, each clipped to [a, b]
      for (const d of [1, -1]) {
        let xa = x, ya = o.y0, xb = x + d * H, yb = o.y1;
        if (d < 0) { xa = x + H; xb = x; }
        // clip to [a, b] along the rope
        const clip = (xx) => Math.max(a, Math.min(b, xx));
        const ca = clip(xa), cb = clip(xb); if (Math.abs(cb - ca) < 0.02) continue;
        const ty = (xx) => ya + (yb - ya) * (xx - xa) / (xb - xa);
        g.tube([[ca, ty(ca), o.z], [cb, ty(cb), o.z]], r, { segs: 3, caps: false });
      }
    }
    s.flush({ tier: 'd', cast: false });
  });
  // the edge ropes
  g.mat('weave', shadeHex(o.tint || '#d8cdb0', 0.8));
  g.tube(lineX(o.x0, o.x1, o.y1, o.z, 2), r * 3, { segs: 5 }); g.tube(lineX(o.x0, o.x1, o.y0, o.z, 2), r * 3, { segs: 5 });
  s.flush({ tier: 's', cast: false });
}
// The same, in a plane of constant x (the ends of a balcony). o: { x, z0, z1, y0, y1, cell, tint }
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
}

// ---------------------------------------------------------------------------------------------------------------
// A string of small cloth lanterns on a sagging cord. Returns the lanterns' positions (the caller lights a few).
// o: { n, sag, colors, r, lamp (dims at lamp-night, default true) }
// ---------------------------------------------------------------------------------------------------------------
export function lanternString(s, a, b, o = {}) {
  const g = s.g, n = o.n || 10, sag = o.sag === undefined ? 0.8 : o.sag, cols = o.colors || ['#f2b56b', '#e8743b', '#f0d070', '#d95d7a', '#f2c879'];
  const P = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t];
  const line = []; for (let i = 0; i <= 16; i++) line.push(P(i / 16));
  g.mat('brushed', '#3a3430'); g.tube(line, 0.006, { segs: 3, caps: false });
  const out = []; const rr = o.r || 0.13;
  for (let i = 0; i < n; i++) {
    const p = P((i + 0.5) / n); const y = p[1] - 0.16;
    g.mat('brushed', '#3a3430'); g.tube([[p[0], p[1], p[2]], [p[0], y + rr * 1.2, p[2]]], 0.004, { segs: 3, caps: false });
    g.mat('paper', cols[i % cols.length], { emissive: 2.4, lamp: o.lamp !== false });
    g.lathe(p[0], p[2], [[rr * 0.3, y - rr], [rr * 0.85, y - rr * 0.6], [rr, y], [rr * 0.85, y + rr * 0.6], [rr * 0.3, y + rr]], { segs: 8 });
    out.push([p[0], y, p[2], cols[i % cols.length]]);
  }
  s.flush({ tier: 'd', cast: false });
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------------------------------------

// The Dawn Stand: a coffee cart with big wheels, a copper boiler, lidded cups, a tray of honeycomb cake under a cloth,
// and a striped awning. Front (+z) is the customers' side. p: { body, trim, stripes: [..] }
defineProp('wall.cart', (g, p) => {
  const body = p.body || '#5b4060', trim = p.trim || '#d6a640', stripes = p.stripes || ['#d98a3a', '#efe2c4', '#b8584a', '#efe2c4'];
  // body: panelled, lined in gold
  g.mat('paint', body); g.box(-1.05, 0.34, -0.42, 1.05, 0.92, 0.42, { bevel: 0.02, aoBottom: 0.75 });
  g.mat('paint', shadeHex(body, 1.2)); for (const x of [-0.7, 0, 0.7]) g.box(x - 0.3, 0.42, 0.42, x + 0.3, 0.84, 0.44, { bevel: 0.008 });
  g.mat('cast', trim); for (const x of [-0.7, 0, 0.7]) { g.box(x - 0.31, 0.83, 0.435, x + 0.31, 0.845, 0.45); g.box(x - 0.31, 0.41, 0.435, x + 0.31, 0.425, 0.45); }
  g.box(-1.07, 0.9, -0.44, 1.07, 0.92, 0.44);
  // the top: oak, overhanging toward the customers as a ledge
  g.mat('wood', '#9a6a3e', { rough: -0.12 }); g.box(-1.1, 0.92, -0.46, 1.1, 0.96, 0.58, { bevel: 0.012 });
  // wheels on the ends: rim, spokes, hub
  for (const sx of [-1, 1]) {
    g.push(); g.move(sx * 1.12, 0.42, 0.05); g.rotZ(Math.PI / 2);
    g.mat('cast', '#2e2a26'); g.lathe(0, 0, [[0.36, -0.03], [0.42, -0.03], [0.425, 0], [0.42, 0.03], [0.36, 0.03], [0.36, -0.03]], { segs: 22, capTop: false, capBottom: false });
    g.mat('paint', trim); g.cyl(0, -0.05, 0, 0.06, 0.1, { segs: 10 });
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; g.tube([[Math.cos(a) * 0.05, 0, Math.sin(a) * 0.05], [Math.cos(a) * 0.36, 0, Math.sin(a) * 0.36]], 0.012, { segs: 4, caps: false }); }
    g.pop();
  }
  // a pair of legs at the handle end, and the push bar
  g.mat('cast', '#2e2a26'); for (const z of [-0.36, 0.36]) g.tube([[-0.95, 0, z], [-0.95, 0.36, z]], 0.02, { segs: 5 });
  g.mat('wood', '#6b4a2f'); g.tube([[-1.05, 0.88, -0.4], [-1.32, 0.95, -0.4], [-1.32, 0.95, 0.4], [-1.05, 0.88, 0.4]], 0.022, { segs: 6 });
  // the boiler: copper urn with a domed lid, a brass tap toward the customers, a gauge
  g.mat('cast', '#b8693a'); g.lathe(-0.55, -0.12, [[0.0, 0.96], [0.17, 0.96], [0.19, 1.0], [0.19, 1.36], [0.17, 1.4], [0.12, 1.47], [0.05, 1.5], [0.04, 1.56], [0.0, 1.57]], { segs: 18 });
  g.mat('cast', '#c8a45a'); g.lathe(-0.55, -0.12, [[0.2, 1.12], [0.205, 1.14], [0.2, 1.16]], { segs: 18, capTop: false, capBottom: false });
  g.tube([[-0.55, 1.08, 0.06], [-0.55, 1.08, 0.14], [-0.55, 1.02, 0.17]], 0.016, { segs: 6 });
  g.cyl(-0.55, 1.14, 0.1, 0.012, 0.06, { segs: 6 });
  g.mat('glaze', '#efe6d2'); g.lathe(-0.36, -0.2, [[0, 1.25], [0.045, 1.25], [0.045, 1.27], [0, 1.27]], { segs: 12 });
  g.tube([[-0.38, 1.26, -0.2], [-0.45, 1.26, -0.17]], 0.008, { segs: 4 });
  // cups: lidded, stacked and in a row
  const cup = (x, y, z, c) => {
    g.mat('glaze', c); g.lathe(x, z, [[0, y], [0.028, y], [0.038, y + 0.012], [0.042, y + 0.085], [0, y + 0.085]], { segs: 10 });
    g.mat('glaze', shadeHex(c, 0.78)); g.lathe(x, z, [[0.045, y + 0.085], [0.042, y + 0.095], [0.012, y + 0.104], [0.012, y + 0.114], [0, y + 0.115]], { segs: 10, capBottom: false });
  };
  const CC = ['#e9e1cf', '#c9763e', '#2f6f73', '#e9e1cf', '#b8584a', '#d9c08a'];
  for (let i = 0; i < 6; i++) cup(-0.18 + (i % 3) * 0.1, 0.96, 0.3 + Math.floor(i / 3) * 0.1, CC[i]);
  g.mat('glaze', '#e9e1cf'); for (let k = 0; k < 5; k++) g.lathe(0.18, -0.25, [[0.03, 0.96 + k * 0.03], [0.042, 0.99 + k * 0.03]], { segs: 10, capTop: false }); g.lathe(0.32, -0.25, [[0.03, 0.96], [0.042, 1.14]], { segs: 10 });
  // the cake: a wooden tray, a golden honeycomb slab, a cloth folded back over most of it
  g.mat('wood', '#7a5233'); g.box(0.42, 0.96, -0.2, 1.0, 0.99, 0.3, { bevel: 0.006 });
  g.mat('hex', '#e0a84c', { rough: -0.05 }); g.box(0.46, 0.99, -0.16, 0.96, 1.05, 0.26, { bevel: 0.01 });
  g.mat('plain', '#c98f4e'); g.box(0.62, 0.99, 0.26, 0.74, 1.05, 0.27);
  g.mat('weave', '#efe6d2'); g.sheet([0.42, 1.1, -0.2], [1.02, 1.1, -0.2], [1.02, 1.07, 0.16], [0.42, 1.07, 0.16], { nu: 6, nv: 3, sag: 0.02 });
  g.sheet([1.02, 1.08, -0.2], [1.02, 1.08, 0.16], [1.04, 0.9, 0.16], [1.04, 0.9, -0.2], { nu: 3, nv: 3 });
  // tongs, a jug, a small crock of honey
  g.mat('brushed', '#c9c4bb'); g.tube([[0.4, 1.0, 0.36], [0.62, 1.0, 0.4]], 0.006, { segs: 4 });
  g.mat('glaze', '#2f6f73'); g.lathe(0.86, 0.44, [[0, 0.96], [0.05, 0.96], [0.06, 1.06], [0.045, 1.12], [0.05, 1.14], [0, 1.14]], { segs: 12 });
  g.mat('glaze', '#d6a640'); g.lathe(0.98, 0.44, [[0, 0.96], [0.045, 0.96], [0.05, 1.03], [0.035, 1.06], [0, 1.065]], { segs: 10 });
  // awning: posts at the back, cantilevered frame, striped cloth with a scalloped valance
  g.mat('cast', '#3a3430'); for (const x of [-1.06, 1.06]) g.tube([[x, 0.92, -0.44], [x, 2.62, -0.44]], 0.022, { segs: 6 });
  for (const x of [-1.06, 1.06]) g.tube([[x, 2.6, -0.44], [x, 1.98, 0.92]], 0.016, { segs: 5 });
  g.tube([[-1.06, 1.98, 0.92], [1.06, 1.98, 0.92]], 0.016, { segs: 5 });
  g.mat('cast', '#d6a640'); for (const x of [-1.06, 1.06]) g.ball(x, 2.66, -0.44, 0.04, 0.04, 0.04, { segs: 8, rings: 5 });
  const NS = 8;
  for (let i = 0; i < NS; i++) {
    const a = -1.1 + 2.2 * i / NS, b = -1.1 + 2.2 * (i + 1) / NS; g.mat('weave', stripes[i % stripes.length]);
    g.quad([a, 2.64, -0.5], [b, 2.64, -0.5], [b, 2.0, 0.96], [a, 2.0, 0.96], { double: true });
    g.quad([a, 2.0, 0.96], [b, 2.0, 0.96], [b, 1.84, 0.97], [a, 1.84, 0.97], { double: true });
    g.quad([a, 1.84, 0.97], [b, 1.84, 0.97], [(a + b) / 2, 1.74, 0.975], [(a + b) / 2 - 0.001, 1.74, 0.975], { double: true });
  }
  return { solid: [[-1.35, 0, -0.48, 1.18, 1.0, 0.6]], tier: 's' };
});

// A deep armchair with a loose cushion and rolled arms. p: { cloth, wood, throw }
defineProp('wall.armchair', (g, p) => {
  const cloth = p.cloth || '#7a2f3c', wood = p.wood || '#4a3020';
  g.mat('wood', wood); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.lathe(sx * 0.36, sz * 0.34, [[0.03, 0], [0.026, 0.1], [0.032, 0.14]], { segs: 8 });
  g.mat('knit', cloth); g.box(-0.42, 0.14, -0.4, 0.42, 0.36, 0.4, { bevel: 0.04, aoBottom: 0.8 });
  g.mat('knit', shadeHex(cloth, 1.12)); g.box(-0.3, 0.36, -0.28, 0.3, 0.48, 0.4, { bevel: 0.05 });
  g.mat('knit', cloth);
  g.push(); g.move(0, 0.36, -0.36); g.rotX(-0.22); g.box(-0.42, 0, -0.08, 0.42, 0.62, 0.1, { bevel: 0.05 }); g.pop();
  for (const sx of [-1, 1]) { g.box(sx * 0.42 - 0.12, 0.14, -0.4, sx * 0.42 + 0.0, 0.6, 0.38, { bevel: 0.04 }); g.tube([[sx * 0.36, 0.6, -0.36], [sx * 0.36, 0.6, 0.38]], 0.07, { segs: 8 }); }
  if (p.throw) { g.mat('weave', p.throw); g.sheet([0.3, 0.68, -0.36], [0.3, 0.68, 0.2], [0.5, 0.25, 0.22], [0.5, 0.25, -0.36], { nu: 4, nv: 4, sag: 0.03 }); }
  return { solid: [[-0.45, 0, -0.45, 0.45, 0.48, 0.42]], spots: [{ type: 'sit', x: 0, y: 0.46, z: 0.08, yaw: 0 }], tier: 's' };
});

// A long terrace bench: stone end blocks, oak slats, a low back. p: { w, wood, stone }
defineProp('wall.bench', (g, p) => {
  const w = p.w || 4, wood = p.wood || '#8a6240', st = p.stone || '#a89a84';
  const n = Math.max(2, Math.round(w / 2) + 1);
  g.mat('stone', st);
  for (let i = 0; i < n; i++) { const x = -w / 2 + 0.15 + (w - 0.3) * i / (n - 1); g.box(x - 0.1, 0, -0.2, x + 0.1, 0.4, 0.2, { bevel: 0.015, aoBottom: 0.7 }); }
  g.mat('wood', wood, { rough: -0.06 });
  for (let i = 0; i < 4; i++) { const z = -0.2 + i * 0.105; g.box(-w / 2, 0.4, z, w / 2, 0.44, z + 0.09, { bevel: 0.008 }); }
  g.mat('cast', '#4a3f33'); for (let i = 0; i < n; i++) { const x = -w / 2 + 0.15 + (w - 0.3) * i / (n - 1); g.tube([[x, 0.42, -0.22], [x, 0.85, -0.29]], 0.016, { segs: 5 }); }
  g.mat('wood', wood, { rough: -0.06 }); for (const yy of [0.62, 0.78]) g.box(-w / 2, yy, -0.31, w / 2, yy + 0.08, -0.26, { bevel: 0.008 });
  const spots = []; const k = Math.max(1, Math.floor(w / 1.15));
  for (let i = 0; i < k; i++) spots.push({ type: 'sit', x: -w / 2 + (i + 0.5) * w / k, y: 0.45, z: 0.0, yaw: 0, tags: ['watch'] });
  return { solid: [[-w / 2, 0, -0.32, w / 2, 0.45, 0.22]], spots, tier: 's' };
});

// A low lamp post for the dark hours: a hooded head that throws light down and away from the view. p: { metal }
defineProp('wall.bollard', (g, p) => {
  g.mat('cast', p.metal || '#3a3a33');
  g.lathe(0, 0, [[0.09, 0], [0.085, 0.06], [0.05, 0.1], [0.04, 0.62], [0.06, 0.66]], { segs: 10 });
  g.box(-0.1, 0.66, -0.1, 0.1, 0.7, 0.1, { bevel: 0.01 });
  g.mat('diffuser', '#ffd6a0', { emissive: 3.2, night: true }); g.box(-0.075, 0.7, -0.075, 0.075, 0.78, 0.075, { faces: 'xXzZ' });
  g.mat('cast', p.metal || '#3a3a33'); g.lathe(0, 0, [[0.13, 0.78], [0.12, 0.8], [0.05, 0.86], [0.02, 0.89], [0, 0.9]], { segs: 10 });
  return { posts: [[0, 0, 0.1, 0, 0.9]], tier: 'd' };
});

// A big stone urn with a shrub. p: { stone, h, kind }
defineProp('wall.urn', (g, p) => {
  const st = p.stone || '#b4a48a', h = p.h || 0.8;
  g.mat('stone', st); g.lathe(0, 0, [[0.22, 0], [0.24, 0.06], [0.14, 0.12], [0.12, 0.2], [0.28, h * 0.55], [0.36, h * 0.88], [0.4, h * 0.94], [0.38, h], [0.33, h]], { segs: 16 });
  g.mat('soil', '#ffffff'); g.cyl(0, h - 0.05, 0, 0.33, 0.02, { segs: 12 });
  const r = new Rng(hashStr('urn' + h + (p.kind || ''))); const layer = p.kind === 'fern' ? 'fern' : p.kind === 'flower' ? 'blossom' : 'leafA';
  g.mat(layer, '#ffffff', { sway: 0.5 });
  for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + r.f(-0.3, 0.3), sc = r.f(0.7, 1.1); g.card(Math.cos(a) * 0.08, h - 0.05, Math.sin(a) * 0.08, 0.75 * sc, 0.85 * sc, a + 1.57, { tilt: r.f(0.15, 0.5) }); }
  return { posts: [[0, 0, 0.36, 0, h]], tier: 's' };
});

// Wing-sleeves hung on a rack like long folded fans: fins from wrist to hip, pleated, in bright colours. p: { w, cols }
defineProp('wall.sleeverack', (g, p) => {
  const w = p.w || 1.8, cols = p.cols || ['#c9552e', '#e7b547', '#2f8f8a', '#c23a6a', '#5a8f3a', '#2f5fa8', '#e8743b', '#7a3a9a'];
  g.mat('wood', '#6b4a2f'); for (const sx of [-1, 1]) { g.box(sx * w / 2 - 0.04, 0, -0.04, sx * w / 2 + 0.04, 2.25, 0.04, { bevel: 0.008 }); g.box(sx * w / 2 - 0.05, 0, -0.32, sx * w / 2 + 0.05, 0.06, 0.32, { bevel: 0.01 }); }
  g.mat('cast', '#c8a45a'); g.tube([[-w / 2, 2.15, 0], [w / 2, 2.15, 0]], 0.02, { segs: 6 });
  const n = Math.max(2, Math.floor(w / 0.24));
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.14 + (w - 0.28) * i / (n - 1), c = cols[i % cols.length], L = 1.35 + 0.15 * ((i * 7) % 3) / 2;
    // hook and wrist cuff
    g.mat('cast', '#8a8070'); g.tube([[x, 2.17, 0], [x, 2.1, 0.03], [x, 2.04, 0]], 0.006, { segs: 3 });
    g.mat('weave', shadeHex(c, 0.6)); g.lathe(x, 0, [[0.045, 1.94], [0.05, 2.0], [0.045, 2.04]], { segs: 8, capTop: false, capBottom: false });
    // the folded fin: a zigzag of pleats, widening toward the hip end
    g.mat('weave', c, { rough: -0.1 });
    const P = 7;
    for (let k = 0; k < P; k++) {
      const z0 = (k % 2 ? 0.03 : -0.03), z1 = (k % 2 ? -0.03 : 0.03);
      const u0 = (k / P - 0.5), u1 = ((k + 1) / P - 0.5);
      g.quad([x + u0 * 0.07, 1.96, z0], [x + u1 * 0.07, 1.96, z1], [x + u1 * 0.2, 1.96 - L, z1 * 1.6], [x + u0 * 0.2, 1.96 - L, z0 * 1.6], { double: true });
    }
    g.mat('weave', shadeHex(c, 1.3)); g.box(x - 0.1, 1.96 - L - 0.03, -0.05, x + 0.1, 1.96 - L, 0.05);
  }
  return { solid: [[-w / 2 - 0.06, 0, -0.32, w / 2 + 0.06, 2.25, 0.32]], tier: 's' };
});

// A wall of shoe pigeon-holes, numbered by brass tags, with shoes in most of them. p: { nx, ny, cw, ch, seed }
defineProp('wall.cubbies', (g, p) => {
  const nx = p.nx || 10, ny = p.ny || 6, cw = p.cw || 0.36, ch = p.ch || 0.26, d = 0.34, W = nx * cw, H = ny * ch;
  const r = new Rng(hashStr('shoes' + (p.seed || 0)));
  g.mat('wood', '#7a5a3a'); g.box(-W / 2 - 0.03, 0, -d, W / 2 + 0.03, 0.12, 0, { bevel: 0.006 });
  g.mat('wood', '#4a3424'); g.box(-W / 2, 0.12, -d, W / 2, 0.12 + H, -d + 0.02, { faces: 'Z' });
  g.mat('wood', '#8a6240');
  for (let i = 0; i <= nx; i++) { const x = -W / 2 + i * cw; g.box(x - 0.012, 0.12, -d, x + 0.012, 0.12 + H, 0, { faces: 'xXZY' }); }
  for (let j = 0; j <= ny; j++) { const y = 0.12 + j * ch; g.box(-W / 2, y - 0.012, -d, W / 2, y + 0.012, 0, { faces: 'yYZ' }); }
  g.box(-W / 2 - 0.05, 0.12 + H, -d - 0.02, W / 2 + 0.05, 0.16 + H, 0.04, { bevel: 0.01 });
  const SC = ['#3a2a20', '#6b3a2a', '#2a2a30', '#8a5a3a', '#c9552e', '#e8e0d0', '#2f5d5a', '#5b4060', '#a07a50', '#1a1a1a'];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const cx = -W / 2 + (i + 0.5) * cw, y = 0.12 + j * ch + 0.012;
    g.mat('cast', '#c8a45a'); g.box(cx - 0.03, y + 0.005, -0.002, cx + 0.03, y + 0.035, 0.004);
    if (r.chance(0.28)) continue;
    const c = SC[r.i(0, SC.length - 1)]; g.mat('leather', c, { rough: -0.1 });
    for (const sx of [-0.07, 0.07]) {
      const x = cx + sx + r.f(-0.01, 0.01);
      g.box(x - 0.045, y, -0.3, x + 0.045, y + 0.035, -0.05, { bevel: 0.012 });
      g.box(x - 0.042, y + 0.035, -0.3, x + 0.042, y + 0.1, -0.2, { bevel: 0.02 });
      g.box(x - 0.04, y + 0.035, -0.2, x + 0.04, y + 0.06, -0.07, { bevel: 0.015 });
    }
  }
  return { solid: [[-W / 2 - 0.05, 0, -d - 0.02, W / 2 + 0.05, 0.16 + H, 0.04]], tier: 's' };
});

// A bench with webbing straps and foot loops: at a fortieth of a g, people float off seats. p: { w, strap }
defineProp('wall.strapbench', (g, p) => {
  const w = p.w || 2.4, strap = p.strap || '#c9552e';
  g.mat('wood', '#8a6240', { rough: -0.05 }); g.box(-w / 2, 0.4, -0.22, w / 2, 0.45, 0.22, { bevel: 0.012 });
  g.box(-w / 2, 0.55, -0.27, w / 2, 0.85, -0.22, { bevel: 0.012 });
  g.mat('cast', '#3d4a45'); for (const sx of [-1, 1]) { const x = sx * (w / 2 - 0.12); g.box(x - 0.03, 0, -0.2, x + 0.03, 0.4, 0.2, { bevel: 0.008 }); g.box(x - 0.03, 0.4, -0.27, x + 0.03, 0.85, -0.22); }
  const n = Math.max(1, Math.floor(w / 0.6));
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (i + 0.5) * w / n;
    g.mat('weave', strap); g.box(x - 0.2, 0.45, -0.02, x + 0.2, 0.465, 0.03); g.box(x - 0.025, 0.45, -0.22, x + 0.025, 0.466, 0.22);
    g.mat('cast', '#c8a45a'); g.box(x - 0.04, 0.465, -0.02, x + 0.04, 0.48, 0.04, { bevel: 0.004 });
    g.mat('weave', shadeHex(strap, 0.7)); g.tube([[x - 0.12, 0.005, 0.3], [x - 0.12, 0.09, 0.36], [x + 0.12, 0.09, 0.36], [x + 0.12, 0.005, 0.3]], 0.012, { segs: 4 });
  }
  const spots = []; for (let i = 0; i < n; i++) spots.push({ type: 'sit', x: -w / 2 + (i + 0.5) * w / n, y: 0.46, z: 0.02, yaw: 0 });
  return { solid: [[-w / 2, 0, -0.27, w / 2, 0.47, 0.22]], spots, tier: 's' };
});

// A hand lamp of a watt or two, with a collar clip. p: { body, glow }
defineProp('wall.handlamp', (g, p) => {
  g.mat('paint', p.body || '#2f5d5a'); g.lathe(0, 0, [[0.0, 0], [0.032, 0], [0.035, 0.02], [0.03, 0.11], [0.036, 0.13], [0, 0.13]], { segs: 10 });
  g.mat('diffuser', '#ffe0a8', p.glow ? { emissive: 2.5, night: true } : undefined); g.ball(0, 0.15, 0, 0.034, 0.03, 0.034, { segs: 10, rings: 6 });
  g.mat('brushed', '#c9c4bb'); g.tube([[0.02, 0.1, 0.03], [0.02, 0.04, 0.045]], 0.005, { segs: 3 }); g.tube([[0, 0.18, 0], [0, 0.21, 0]], 0.004, { segs: 3 });
  return { cast: false };
});

// ---------------------------------------------------------------------------------------------------------------
// The end of a terrace: a pier against the wall, full height, with quoins; in front of it a garden wall with a planted
// top running out to the rail. (xa, xb): its width along x; zr: the rail line; h: the facade height.
// ---------------------------------------------------------------------------------------------------------------
export function endPier(s, xa, xb, zr, h, o = {}) {
  const g = s.g, tint = o.tint || '#d6c4a4', st = o.stone || '#b4a48a', r = new Rng(hashStr('pier' + xa));
  const zf = zr - 1.0, zp = -2.6, gh = 2.7;
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
    if (r.chance(0.7)) { g.mat('leafB', '#ffffff', { sway: 0.6 }); const hh = r.f(0.7, 1.8), sx = o.inner > 0 ? 1 : -1; g.card(sx > 0 ? xb + 0.06 : xa - 0.06, gh + 0.1 - hh, z, 0.45, hh, sx * Math.PI / 2, { tilt: -0.05 }); }
  }
  s.flush({ tier: 's', cast: false });
  s.solid(xa, -2, zf - 0.2, xb, h + 4, 0);
}
