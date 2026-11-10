// Wick Court: Candlewick's atrium. A paved floor six decks deep, ringed by planted terraces and hung with lanterns,
// under a luminous ceiling the block's lamp-painters use to try out their colours. The block court sits here once a
// week; there is music most evenings; the tea cart (`teacart`) stands in the south-west corner by the stair.
import { floor, wall, lamp, block } from '../world/kit.js';
import { railing, planter, archway } from '../world/kit2.js';
import { prop, defineProp, bunting } from '../world/props.js';
import { sign, signRect } from '../world/signs.js';
import { door, doorFrame } from '../world/doors.js';
import { deckRadius } from '../core/drum.js';
import * as THREE from 'three';
import { Geo, MeshBuf, emisCode } from '../world/meshbuilder.js';
import { Rng, mixHex, shadeHex, rgb8, smoothstep } from '../core/util.js';
import { SIGNS } from '../content/signs.js';
import { MENUS } from '../content/menus.js';
import { CAST } from '../content/cast.js';

// ---------------------------------------------------------------------------------------------------------------
// Shared with terraces.js
// ---------------------------------------------------------------------------------------------------------------
export const COURT = { x0: -28, x1: 28, z0: -14, z1: 20, top: 23.4, decks: [4, 8, 12, 16, 20], tw: 3.2, hallTop: 7.2 };
export const CPAL = {
  plaster: '#e8d8bb', plaster2: '#dfc9a4', terracotta: '#b0563a', teal: '#2b6b69', ochre: '#d39b3a', wood: '#6a4529',
  dark: '#3a2a20', stone: '#c8bca6', cream: '#f1e6cf', rose: '#d0687a', indigo: '#33406e', leaf: '#5f8a4a',
};
export const LANTERN_COLS = ['#f2b13c', '#e2574a', '#f4e3c0', '#2f9a95', '#e07a9a', '#e8803a', '#7fae4e', '#f6cf62'];
// Piers on the void's edge, rising through every deck: [x, z, half-width along the edge, foot y]
export const PIERS = [
  [28, -9.2, 0.3, 0], [28, -4.3, 0.3, 0], [28, 4.3, 0.3, 0], [28, 12.2, 0.3, 0],
  [-28, -9.2, 0.3, 0], [-28, -4.3, 0.3, 0], [-28, 4.3, 0.3, 0], [-28, 12.2, 0.3, 0],
  [-17.3, 20, 0.25, 0], [-3.25, 20, 0.25, 0], [3.25, 20, 0.25, 0], [17.3, 20, 0.25, 0], [24.5, 20, 0.3, 0],
  [-21, -14, 0.3, 7.2], [-7, -14, 0.3, 7.2], [7, -14, 0.3, 7.2], [21, -14, 0.3, 7.2],
];
export function lvOf(y) { return Math.max(0, Math.min(5, Math.floor((y + 0.5) / 4))); }
// yaw for a prop or spot whose front faces (dx, dz); the player's yaw for the same facing is Math.PI - that
export function fy(dx, dz) { return Math.atan2(dx, dz); }

// A cast member as a speaker, and a guarded line or two.
export function speakerOf(id) { const c = CAST[id]; return c ? { name: c.short || c.name, colour: (c.look && (c.look.lining || c.look.top)) || '#FFE3A8' } : id; }
export async function sayAs(game, who, lines) {
  if (!game.ui) return;
  game.busy++;
  try { await game.ui.say(speakerOf(who), lines); } finally { game.busy--; }
}
export function found(game, id) { if (game.journal && game.journal.find) game.journal.find(id); }

// A seat (or a leaning place) the player can take. yaw: the way the seat faces (prop convention).
export function seatUse(s, x, y, z, yaw, label, o = {}) {
  return s.interact({ x, y: y + (o.hy === undefined ? 0.45 : o.hy), z, radius: o.radius || 1.25, wide: true,
    prompt: (game) => game.player.seat ? 'Stand up' : label,
    onUse(game) {
      const p = game.player; if (p.seat) { p.stand(); return; }
      p.sit({ x, y, z, yaw: Math.PI - yaw, eye: o.eye }); p.yaw = Math.PI - yaw; p.pitch = o.pitch || 0;
      if (o.onSit) o.onSit(game);
    } });
}

// Atlas text on a quad facing any way: (cx, cy, cz) the centre, yaw the way it faces (prop convention).
export function flatSign(s, spec, cx, cy, cz, yaw, w, h, o = {}) {
  const game = s.world.game; if (!game || !game.atlas) return;
  const R = signRect(game.atlas, spec, w, h), r = R.rect, g = s.g;
  const rx = Math.cos(yaw), rz = -Math.sin(yaw), nx = Math.sin(yaw) * 0.004, nz = Math.cos(yaw) * 0.004;
  g.atlas(r.page, { emissive: o.glow || 0, lamp: !!o.glow }); if (R.cutout) g._mat[2] |= 16;
  g.quad([cx - rx * w / 2 + nx, cy - h / 2, cz - rz * w / 2 + nz], [cx + rx * w / 2 + nx, cy - h / 2, cz + rz * w / 2 + nz], [cx + rx * w / 2 + nx, cy + h / 2, cz + rz * w / 2 + nz], [cx - rx * w / 2 + nx, cy + h / 2, cz - rz * w / 2 + nz], { uv: [r.u0, r.v1, r.u1, r.v0] });
  s.flush({ tier: o.tier || 'd', level: o.level });
}
// Atlas text lying on a floor, read by someone facing (ox, oz) from below it.
export function floorText(s, spec, cx, y, cz, ox, oz, w, h, o = {}) {
  const game = s.world.game; if (!game || !game.atlas) return;
  const R = signRect(game.atlas, spec, w, h), r = R.rect, g = s.g;
  const rx = -oz, rz = ox;
  g.atlas(r.page, {}); if (R.cutout) g._mat[2] |= 16;
  const P = (a, b) => [cx + rx * a + ox * b, y, cz + rz * a + oz * b];
  g.quad(P(-w / 2, -h / 2), P(w / 2, -h / 2), P(w / 2, h / 2), P(-w / 2, h / 2), { uv: [r.u0, r.v1, r.u1, r.v0] });
  s.flush({ tier: o.tier || 's', level: o.level || 0 });
}

// A sloping handrail from (ax, ay, az) to (bx, by, bz) (heights are the walking surface), with posts and two rails.
export function slopeRail(s, ax, ay, az, bx, by, bz, o = {}) {
  const g = s.g, h = o.h || 1.0, len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / 1.15));
  g.mat('cast', o.tint || CPAL.teal);
  for (let k = 0; k <= n; k++) { const t = k / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, y = ay + (by - ay) * t; g.tube([[x, y, z], [x, y + h, z]], 0.02, { segs: 6 }); }
  for (const hh of [0.33, 0.66]) g.tube([[ax, ay + hh, az], [bx, by + hh, bz]], 0.011, { segs: 5, caps: false });
  g.mat('wood', o.rail || '#7a5233'); g.tube([[ax, ay + h, az], [bx, by + h, bz]], 0.03, { segs: 8 });
  s.flush({ tier: 's', level: o.level });
  s.solid(Math.min(ax, bx) - 0.04, Math.min(ay, by), Math.min(az, bz) - 0.04, Math.max(ax, bx) + 0.04, Math.max(ay, by) + h, Math.max(az, bz) + 0.04);
}

// One hanging paper lantern (drawn at its centre). shape 0 round, 1 tall, 2 squat
export function lanternMesh(g, x, y, z, col, shape, glow) {
  g.mat('paper', col, { emissive: glow || 2.4, lamp: true });
  const k = 1.5, P = (shape === 1 ? [[0.07, -0.2], [0.12, -0.17], [0.125, 0], [0.12, 0.17], [0.07, 0.2]] : shape === 2 ? [[0.07, -0.1], [0.19, -0.06], [0.21, 0], [0.19, 0.06], [0.07, 0.1]] : [[0.06, -0.15], [0.15, -0.09], [0.175, 0], [0.15, 0.09], [0.06, 0.15]]).map((q) => [q[0] * k, q[1] * k]);
  g.lathe(x, z, P.map((p) => [p[0], y + p[1]]), { segs: 8, capTop: false, capBottom: false });
  const top = P[P.length - 1][1], bot = P[0][1];
  g.mat('wood', '#3b2a1e'); g.cyl(x, y + top - 0.005, z, 0.1, 0.035, { segs: 6, capBottom: false }); g.cyl(x, y + bot - 0.03, z, 0.1, 0.035, { segs: 6, capTop: false });
  return top;
}

// A string of paper lanterns between two points, sagging. o: { gap, sag, colors, seed, lights (count), power, range, drop }
export function lanternString(s, a, b, o = {}) {
  const g = s.g, len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const sag = o.sag === undefined ? len * 0.045 : o.sag, drop = o.drop || 0.32;
  const P = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t];
  const n = Math.max(2, Math.round(len / (o.gap || 1.8))); const cols = o.colors || LANTERN_COLS; const seed = o.seed || 0;
  const segN = Math.max(1, Math.ceil(len / 9));
  for (let k = 0; k < segN; k++) {
    const pts = []; for (let i = 0; i <= 6; i++) pts.push(P((k + i / 6) / segN));
    g.mat('weave', '#3e3228'); g.tube(pts, 0.007, { segs: 4, caps: false });
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n; if (t < k / segN || t >= (k + 1) / segN) continue;
      const p = P(t), dd = drop + ((i * 7 + seed) % 3) * 0.12, shape = (i + seed) % 5 === 0 ? 1 : (i + seed) % 7 === 3 ? 2 : 0;
      const top = lanternMesh(g, p[0], p[1] - dd, p[2], cols[(i + seed) % cols.length], shape, o.glow);
      g.mat('weave', '#3e3228'); g.tube([[p[0], p[1], p[2]], [p[0], p[1] - dd + top, p[2]]], 0.004, { segs: 3, caps: false });
    }
    const m = P((k + 0.5) / segN);
    s.flush({ tier: 's', cast: false, level: lvOf(m[1]) });
  }
  const nl = o.lights === undefined ? 1 : o.lights;
  for (let j = 0; j < nl; j++) {
    const p = P((j + 0.5) / nl);
    s.light({ at: [p[0], p[1] - drop - 0.1, p[2]], color: o.lightCol || '#ffc27a', power: o.power || 2.2, range: o.range || 9, lamp: true, radius: 0.3, clip: o.clip });
  }
}


// ---------------------------------------------------------------------------------------------------------------
// The ceiling's day. The panels are one mesh whose colours and glow are rewritten a few times a second from the
// clock: twelve hours of overcast day (07:00 to 19:00, with half-hour ramps), a rose and amber dusk, an evening the
// lamp-painters play with, a low indigo night, and a dawn that starts with the River's brown-violet. A slow wave
// drifts across the day so the light in the court is never quite the same twice. The court's daylight follows.
// ---------------------------------------------------------------------------------------------------------------
function rgbOf(hex) { const c = rgb8(hex); return [c[0], c[1], c[2]]; }
function mix3(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
export function courtDay(h) {
  if (h < 6.5) return 0.04;
  if (h < 7.5) return 0.04 + 0.96 * smoothstep(6.5, 7.5, h);
  if (h < 18.5) return 1;
  if (h < 19.5) return 0.16 + 0.84 * (1 - smoothstep(18.5, 19.5, h));
  if (h < 23) return 0.16;
  if (h < 23.5) return 0.04 + 0.12 * (1 - smoothstep(23, 23.5, h));
  return 0.04;
}
const DUSK = [rgbOf('#ffb27a'), rgbOf('#e88aa0'), rgbOf('#8a6aa8')];
const EVE = [rgbOf('#5b3f7a'), rgbOf('#a35f74'), rgbOf('#d98a5a'), rgbOf('#3f5f8a'), rgbOf('#2f6f6a')];
const NIGHT = rgbOf('#2b2f55'), RIVER = rgbOf('#8a6a86'), DAWNROSE = rgbOf('#e8909a'), DAWNGOLD = rgbOf('#ffd27a');
function courtSky(s, game, mesh, panels, amb, downs, zones) {
  const col = mesh.geometry.attributes.aColor, mat = mesh.geometry.attributes.aMat;
  const sky0 = amb.sky.slice();
  let acc = 1;
  s.world.dynamics.push({ scope: s, update(dt) {
    acc += dt; if (acc < 0.25) return; acc = 0;
    const h = game.clock ? game.clock.hours : 13, tm = (game.clock ? (game.clock.day - 1) * 24 + h : h) * 60;     // minutes of game time
    const k = courtDay(h);
    for (const p of panels) {
      const wave = Math.sin((p.t * 2.2 + p.u * 1.3) * Math.PI - tm * 0.011) * Math.sin((p.t - p.u * 1.7) * 3.1 + tm * 0.004);
      let c = p.base, e;
      if (h >= 7.5 && h < 18.5) { c = p.test ? c : mix3(c, DAWNROSE, Math.max(0, wave) * 0.12); e = 3.2 * (1 + 0.07 * wave); }
      else if (h >= 18.5 && h < 19.5) { const q = smoothstep(18.5, 19.5, h); const d = p.t < 0.5 ? mix3(DUSK[0], DUSK[1], p.t * 2) : mix3(DUSK[1], DUSK[2], p.t * 2 - 1); c = mix3(c, d, q); e = 3.2 + (1.0 - 3.2) * q; }
      else if (h >= 19.5 && h < 23.5) {
        const fz = ((p.t * 3 + p.u * 2 + tm * 0.008) % EVE.length + EVE.length) % EVE.length, i0 = Math.floor(fz);
        const d = mix3(EVE[i0], EVE[(i0 + 1) % EVE.length], fz - i0); const fade = h < 23 ? 1 : 1 - smoothstep(23, 23.5, h);
        c = mix3(NIGHT, d, fade); e = 0.28 + 0.72 * fade * (1 + 0.15 * wave);
      } else if (h >= 6 && h < 7.5) {
        const q = smoothstep(6, 7.5, h); const a = q < 0.33 ? mix3(NIGHT, RIVER, q * 3) : q < 0.66 ? mix3(RIVER, DAWNROSE, q * 3 - 1) : mix3(DAWNROSE, DAWNGOLD, q * 3 - 2);
        c = mix3(a, c, smoothstep(0.75, 1, q)); e = 0.28 + (3.2 - 0.28) * q;
      } else { c = NIGHT; e = 0.28; }
      const code = emisCode(e);
      for (let v = p.v0; v < p.v1; v++) { col.array[v * 4] = c[0]; col.array[v * 4 + 1] = c[1]; col.array[v * 4 + 2] = c[2]; mat.array[v * 4 + 1] = code; }
    }
    col.needsUpdate = true; mat.needsUpdate = true;
    // the daylight under it, warming as it fades
    amb.scale = k;
    const w = 1 - k; amb.sky[1] = sky0[1] * (1 - 0.12 * w); amb.sky[2] = sky0[2] * (1 - 0.35 * w);
    for (const l of downs) l.scale = k;
    // and the camera: a court that is bright by day and properly evening after the dusk
    for (const z of zones) z.env = { exposure: 0.58 + 0.24 * k, autoMax: 1.2 + 1.4 * k, bloom: 0.07 + 0.06 * (1 - k), warmth: 0.2 + 0.15 * (1 - k) };
  } });
}

// ---------------------------------------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------------------------------------

// The tea cart, front (customers) toward +z, Ben behind at -z.
defineProp('court.teacart', (g, p) => {
  const body = p.body || '#2b6b69';
  // wheels on the sides
  for (const sx of [-1, 1]) {
    g.push(); g.move(sx * 1.08, 0.42, 0.05); g.rotZ(Math.PI / 2);
    g.mat('cast', '#2a2a28'); g.cyl(0, -0.035, 0, 0.42, 0.07, { segs: 22 });
    g.mat('paint', '#c9a24a'); g.cyl(0, -0.045, 0, 0.09, 0.09, { segs: 10 });
    g.pop();
    g.mat('paint', '#c9a24a');
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.tube([[sx * 1.08, 0.42, 0.05], [sx * 1.08, 0.42 + Math.sin(a) * 0.36, 0.05 + Math.cos(a) * 0.36]], 0.012, { segs: 4, caps: false }); }
  }
  // body with panelled front
  g.mat('paint', body); g.box(-1.0, 0.3, -0.45, 1.0, 0.98, 0.45, { bevel: 0.02, aoBottom: 0.7 });
  g.mat('paint', shadeHex(body, 1.25));
  for (let i = 0; i < 3; i++) { const x0 = -0.92 + i * 0.62; g.box(x0, 0.38, 0.45, x0 + 0.54, 0.9, 0.47, { bevel: 0.01 }); }
  g.mat('paint', '#e9c46a'); g.box(-1.0, 0.92, 0.45, 1.0, 0.95, 0.475);
  // a leg at the back, a handle bar
  g.mat('cast', '#2a2a28'); g.tube([[-0.8, 0.3, -0.35], [-0.8, 0, -0.35]], 0.025, { segs: 6 }); g.tube([[0.8, 0.3, -0.35], [0.8, 0, -0.35]], 0.025, { segs: 6 });
  g.mat('cast', '#b08a45'); g.tube([[-0.9, 0.98, -0.45], [-0.9, 1.0, -0.62], [0.9, 1.0, -0.62], [0.9, 0.98, -0.45]], 0.018, { segs: 6 });
  // the top
  g.mat('wood', '#8a6240', { rough: -0.1 }); g.box(-1.06, 0.98, -0.5, 1.06, 1.03, 0.52, { bevel: 0.012 });
  // two brass urns with taps
  for (const ux of [-0.62, -0.18]) {
    g.mat('cast', '#c09048'); g.lathe(ux, -0.18, [[0.13, 1.03], [0.16, 1.08], [0.17, 1.4], [0.15, 1.5], [0.09, 1.56], [0.05, 1.6], [0.07, 1.63], [0, 1.65]], { segs: 16 });
    g.mat('cast', '#2a2a28'); g.tube([[ux, 1.15, -0.03], [ux, 1.15, 0.05], [ux, 1.1, 0.07]], 0.012, { segs: 5 });
    g.cyl(ux, 1.03, 0.05, 0.05, 0.015, { segs: 8 });
  }
  // a kettle on a hotplate, a stack of cups, the lid jar
  g.mat('brushed', '#5a5650'); g.box(0.15, 1.03, -0.35, 0.55, 1.07, -0.05, { bevel: 0.01 });
  g.mat('glaze', '#d9cfb8'); g.lathe(0.35, -0.2, [[0.1, 1.07], [0.12, 1.12], [0.115, 1.24], [0.07, 1.28], [0.03, 1.3], [0.04, 1.32], [0, 1.33]], { segs: 12 });
  g.tube([[0.46, 1.13, -0.2], [0.55, 1.22, -0.2], [0.6, 1.27, -0.2]], [0.022, 0.015, 0.01], { segs: 5 });
  g.mat('glaze', '#e7dcc4');
  for (let i = 0; i < 5; i++) g.lathe(0.32, 0.25, [[0.026, 1.03 + i * 0.05], [0.04, 1.08 + i * 0.05], [0.036, 1.08 + i * 0.05]], { segs: 10, capBottom: false, capTop: false });
  for (let i = 0; i < 4; i++) g.lathe(0.45, 0.28, [[0.026, 1.03 + i * 0.05], [0.04, 1.08 + i * 0.05], [0.036, 1.08 + i * 0.05]], { segs: 10, capBottom: false, capTop: false });
  g.mat('glaze', '#a3563a'); g.lathe(0.75, 0.15, [[0.08, 1.03], [0.1, 1.1], [0.1, 1.26], [0.085, 1.29]], { segs: 12 });
  g.mat('glaze', '#2b6b69'); for (let i = 0; i < 6; i++) g.cyl(0.75, 1.29 + i * 0.012, 0.15, 0.046, 0.01, { segs: 10 });
  // four lidded cups waiting
  for (let i = 0; i < 4; i++) {
    const cx = -0.85 + i * 0.16, cz = 0.32; g.mat('glaze', ['#e9e1cf', '#c9552e', '#2f6f8f', '#e9c46a'][i]);
    g.lathe(cx, cz, [[0, 1.03], [0.026, 1.03], [0.036, 1.045], [0.04, 1.11], [0, 1.11]], { segs: 10 });
    g.mat('glaze', '#3a2a20'); g.lathe(cx, cz, [[0.043, 1.11], [0.012, 1.125], [0.012, 1.135], [0, 1.137]], { segs: 10, capBottom: false });
  }
  // awning: four posts and a striped canopy that overhangs the front
  g.mat('cast', '#2a2a28');
  for (const sx of [-1, 1]) { g.tube([[sx * 1.0, 1.03, -0.46], [sx * 1.0, 2.35, -0.46]], 0.022, { segs: 6 }); g.tube([[sx * 1.0, 1.03, 0.46], [sx * 1.0, 2.2, 0.46], [sx * 1.0, 2.15, 1.25]], 0.02, { segs: 6 }); }
  const cols = p.stripes || ['#c9552e', '#f1e6cf'];
  for (let i = 0; i < 8; i++) {
    const x0 = -1.12 + i * 0.28, x1 = x0 + 0.28; g.mat('weave', cols[i % 2]);
    g.quad([x0, 2.42, -0.6], [x1, 2.42, -0.6], [x1, 2.12, 1.3], [x0, 2.12, 1.3], { double: true });
    g.quad([x0, 2.12, 1.3], [x1, 2.12, 1.3], [x1, 1.94, 1.32], [x0, 1.94, 1.32], { double: true });
  }
  return { solid: [[-1.12, 0, -0.5, 1.12, 1.05, 0.52]], tier: 's', spots: [{ type: 'counter', x: 0.1, y: 0, z: -0.95, yaw: 0, who: 'ben' }] };
});

// A light bentwood chair for crowds of them. p: { wood, seat, back: 'hoop' | 'slat' }
defineProp('court.chair', (g, p) => {
  g.mat('wood', p.wood || '#6b4a2f', { rough: -0.05 });
  for (const q of [[-0.19, 0.19], [0.19, 0.19]]) g.tube([[q[0] * 1.08, 0, q[1] * 1.08], [q[0], 0.44, q[1]]], 0.018, { segs: 5, caps: false });
  for (const sx of [-1, 1]) g.tube([[sx * 0.2, 0, -0.22], [sx * 0.19, 0.44, -0.19], [sx * 0.18, 0.9, -0.24]], 0.018, { segs: 5, caps: false });
  if (p.back === 'slat') { for (const yy of [0.66, 0.82]) g.box(-0.19, yy - 0.03, -0.245, 0.19, yy + 0.03, -0.225); }
  else { const h = []; for (let i = 0; i <= 6; i++) { const a = Math.PI * i / 6; h.push([-Math.cos(a) * 0.18, 0.62 + Math.sin(a) * 0.3, -0.23]); } g.tube(h, 0.016, { segs: 4, caps: false }); }
  g.lathe(0, 0, [[0.0, 0.43], [0.21, 0.43], [0.22, 0.45], [0.2, 0.465]], { segs: 12, capTop: false });
  g.mat('cane', p.seat || '#d9c08a'); g.lathe(0, 0, [[0.2, 0.465], [0.0, 0.468]], { segs: 12, capBottom: false, capTop: false });
  return { posts: [[0, 0, 0.2, 0, 0.46]], spots: [{ type: 'sit', x: 0, y: 0.46, z: 0.02, yaw: 0 }] };
});

// A cheap pot plant for terraces full of them. p: { kind, size, pot, seed }
defineProp('court.pot', (g, p) => {
  const size = p.size || 0.9, kind = p.kind || 'broad', pr = Math.min(0.26, size * 0.19), ph = Math.min(0.4, size * 0.3);
  g.mat('glaze', p.pot || '#a3563a'); g.lathe(0, 0, [[pr * 0.72, 0], [pr, ph * 0.85], [pr * 1.08, ph * 0.9], [pr * 1.06, ph], [pr * 0.92, ph * 0.94]], { segs: 8, capTop: false });
  g.mat('soil', '#ffffff'); g.cyl(0, ph * 0.9, 0, pr * 0.92, 0.01, { segs: 8, capBottom: false });
  const r = new Rng('pot' + kind + size + (p.seed || 0));
  const layer = kind === 'fine' ? 'leafB' : kind === 'fern' ? 'fern' : kind === 'flower' ? 'blossom' : 'leafA';
  const n = kind === 'fern' ? 6 : 5, lh = size - ph * 0.8;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + r.f(-0.3, 0.3), hgt = lh * r.f(0.7, 1.0);
    g.mat(i === n - 1 && kind === 'flower' ? 'leafA' : layer, '#ffffff', { sway: 0.45 });
    g.card(Math.cos(a) * 0.03, ph * 0.88, Math.sin(a) * 0.03, hgt * 0.9, hgt, a + Math.PI / 2, { tilt: kind === 'fern' ? r.f(0.35, 0.7) : r.f(0.05, 0.4) });
  }
  return { posts: [[0, 0, pr, 0, ph]], cast: false };
});

// A wooden music stand.
defineProp('court.stand', (g) => {
  g.mat('cast', '#2a2a28'); for (let i = 0; i < 3; i++) { const a = i * 2.09; g.tube([[Math.cos(a) * 0.22, 0, Math.sin(a) * 0.22], [0, 0.25, 0]], 0.01, { segs: 4 }); }
  g.tube([[0, 0.25, 0], [0, 1.05, 0]], 0.012, { segs: 5 });
  g.mat('wood', '#5a3d28'); g.push(); g.move(0, 1.12, 0.02); g.rotX(-0.35); g.box(-0.24, -0.16, -0.01, 0.24, 0.16, 0.01, { bevel: 0.004 }); g.pop();
  g.mat('paper', '#efe6d2'); g.push(); g.move(0, 1.13, 0.032); g.rotX(-0.35); g.box(-0.2, -0.13, 0, 0.2, 0.14, 0.004); g.pop();
  return { cast: true };
});

// A hand drum on a low stand.
defineProp('court.drum', (g) => {
  g.mat('wood', '#7a4428'); g.lathe(0, 0, [[0.12, 0.0], [0.1, 0.25], [0.16, 0.45], [0.2, 0.62], [0.19, 0.64]], { segs: 16 });
  g.mat('leather', '#e3d2ae'); g.cyl(0, 0.635, 0, 0.19, 0.012, { segs: 16 });
  g.mat('weave', '#c9552e'); g.tube([[0.2, 0.6, 0], [0.13, 0.3, 0.08]], 0.006, { segs: 3 }); g.tube([[-0.2, 0.6, 0], [-0.13, 0.3, -0.08]], 0.006, { segs: 3 });
  return { posts: [[0, 0, 0.2, 0, 0.64]] };
});

// A drinking fountain: fluted pedestal, a basin, a brass spout, and a lower basin for children.
defineProp('court.fountain', (g) => {
  g.mat('stone', '#bfb19a'); g.lathe(0, 0, [[0.42, 0], [0.42, 0.1], [0.3, 0.18], [0.2, 0.3], [0.17, 0.78], [0.24, 0.84]], { segs: 16 });
  g.mat('stone', '#d4c7ae'); g.lathe(0, 0, [[0.24, 0.84], [0.4, 0.88], [0.44, 0.96], [0.42, 0.98], [0.33, 0.93], [0, 0.9]], { segs: 20 });
  g.mat('plain', '#7aa6a8', { rough: -0.45 }); g.cyl(0, 0.925, 0, 0.32, 0.004, { segs: 16 });
  g.mat('cast', '#b08a45'); g.tube([[0, 0.9, -0.3], [0, 1.1, -0.3], [0, 1.16, -0.18], [0, 1.13, -0.1]], 0.016, { segs: 6 });
  g.mat('stone', '#bfb19a'); g.box(0.4, 0, -0.15, 0.62, 0.5, 0.15, { bevel: 0.02 });
  g.mat('stone', '#d4c7ae'); g.lathe(0.62, 0, [[0.05, 0.5], [0.16, 0.53], [0.18, 0.58], [0.16, 0.59], [0, 0.56]], { segs: 14 });
  g.mat('cast', '#b08a45'); g.tube([[0.62, 0.55, -0.16], [0.62, 0.68, -0.16], [0.62, 0.7, -0.08]], 0.012, { segs: 5 });
  return { posts: [[0, 0, 0.42, 0, 0.98], [0.6, 0, 0.2, 0, 0.6]], tier: 's' };
});

// A handcart: flatbed, two wheels, handles. Load it separately.
defineProp('court.handcart', (g) => {
  g.mat('wood', '#9a7448', { rough: 0.1 }); g.box(-0.8, 0.46, -0.45, 0.8, 0.52, 0.45, { bevel: 0.01 });
  for (const sz of [-1, 1]) g.box(-0.8, 0.52, sz * 0.45 - 0.02, 0.8, 0.68, sz * 0.45 + 0.02, { bevel: 0.006 });
  g.mat('cast', '#2b3a36'); g.tube([[-0.8, 0.5, -0.38], [-1.6, 0.86, -0.38]], 0.022, { segs: 6 }); g.tube([[-0.8, 0.5, 0.38], [-1.6, 0.86, 0.38]], 0.022, { segs: 6 });
  g.mat('wood', '#5a3d28'); g.tube([[-1.6, 0.86, -0.42], [-1.6, 0.86, 0.42]], 0.03, { segs: 8 });
  for (const sz of [-1, 1]) {
    g.push(); g.move(0.2, 0.34, sz * 0.53); g.rotX(Math.PI / 2);
    g.mat('cast', '#2a2a28'); g.cyl(0, -0.03, 0, 0.34, 0.06, { segs: 18 }); g.mat('paint', '#b0563a'); g.cyl(0, -0.04, 0, 0.07, 0.08, { segs: 8 });
    g.pop();
  }
  g.mat('cast', '#2a2a28'); g.tube([[0.75, 0.46, 0], [0.75, 0, 0]], 0.025, { segs: 6 });
  return { solid: [[-0.85, 0, -0.55, 0.85, 0.7, 0.55]], tier: 's' };
});

// A heliox flute on its stand: a long pipe, 1.2 m, standing up.
defineProp('court.flute', (g) => {
  g.mat('cast', '#2a2a28'); for (let i = 0; i < 3; i++) { const a = i * 2.09; g.tube([[Math.cos(a) * 0.16, 0, Math.sin(a) * 0.16], [0, 0.18, 0]], 0.008, { segs: 4 }); }
  g.mat('wood', '#c49a5a', { rough: -0.2 }); g.cyl(0, 0.16, 0, 0.022, 1.22, { segs: 10 });
  g.mat('cast', '#b08a45'); for (const y of [0.3, 0.75, 1.3]) g.cyl(0, y, 0, 0.026, 0.02, { segs: 10 });
  return { cast: true };
});

// ---------------------------------------------------------------------------------------------------------------
// The place
// ---------------------------------------------------------------------------------------------------------------
export const place = {
  id: 'court', name: 'Wick Court', order: 30,
  build(game) {
    const W = game.world;
    const f = W.frame('candlewick', deckRadius(16), 0, 625);
    const s = W.scope('court', f);
    const g = s.g;
    const { x0: X0, x1: X1, z0: Z0, z1: Z1, top: TOP } = COURT;
    const CLIP = [X0 - 3.4, -0.3, Z0 - 3.4, X1 + 3.4, TOP + 0.2, Z1 + 3.4];
    const CLIPF = [X0 - 0.2, -0.3, Z0 - 0.2, X1 + 0.2, 6, Z1 + 0.2];       // the floor and its lower air
    const rr = new Rng('wick-court');
    const skyZones = [];

    // ---------------------------------------------------------------- the floor
    floor(s, X0, Z0, X1, Z1, 0, 'stone', '#b3a283', { level: 0 });
    const FX0 = X0 + 1.4, FX1 = X1 - 1.4, FZ0 = Z0 + 1.4, FZ1 = Z1 - 1.4;
    // a checker of warmer squares, then slate strips on a 4 m grid
    for (let j = Math.floor(FZ0 / 4); j * 4 < FZ1; j++) {
      g.mat('stone', '#977e5e');
      for (let i = Math.floor(FX0 / 4); i * 4 < FX1; i++) {
        if (((i + j) & 1) === 0) continue;
        const a0 = Math.max(FX0, i * 4), a1 = Math.min(FX1, i * 4 + 4), b0 = Math.max(FZ0, j * 4), b1 = Math.min(FZ1, j * 4 + 4);
        if (a1 - a0 > 0.05 && b1 - b0 > 0.05) g.box(a0, 0, b0, a1, 0.002, b1, { faces: 'Y' });
      }
      s.flush({ tier: 's', level: 0 });
    }
    g.mat('slate', '#4c4640');
    for (let x = Math.ceil(FX0 / 4) * 4; x < FX1; x += 4) { g.box(x - 0.09, 0, FZ0, x + 0.09, 0.004, FZ1, { faces: 'Y' }); s.flush({ tier: 's', level: 0 }); }
    for (let z = Math.ceil(FZ0 / 4) * 4; z < FZ1; z += 4) { for (let x = FX0; x < FX1 - 0.1; x += 14) { g.box(x, 0, z - 0.09, Math.min(FX1, x + 14), 0.004, z + 0.09, { faces: 'Y' }); s.flush({ tier: 's', level: 0 }); } }
    // a small diamond of terracotta and brass at every crossing of the grid
    for (let x = Math.ceil(FX0 / 4) * 4; x < FX1; x += 4) {
      for (let z = Math.ceil(FZ0 / 4) * 4; z < FZ1; z += 4) {
        if (Math.hypot(x, z) < 5) continue;
        g.mat('tile', '#a4583c'); g.prism([[x, z - 0.42], [x + 0.42, z], [x, z + 0.42], [x - 0.42, z]], 0, 0.005, { capBottom: false });
        g.mat('cast', '#b08a45'); g.prism([[x, z - 0.12], [x + 0.12, z], [x, z + 0.12], [x - 0.12, z]], 0, 0.007, { capBottom: false });
      }
      s.flush({ tier: 's', level: 0 });
    }
    // terracotta border with a brass line inside it
    const band = (a0, b0, a1, b1, mat, tint, y) => { g.mat(mat, tint); g.box(a0, 0, b0, a1, y, b1, { faces: 'Y' }); s.flush({ tier: 's', level: 0 }); };
    for (let x = X0; x < X1 - 0.1; x += 14) { band(x, Z0, x + 14, FZ0, 'tile', '#a4583c', 0.005); band(x, FZ1, x + 14, Z1, 'tile', '#a4583c', 0.005); }
    band(X0, FZ0, FX0, FZ1, 'tile', '#a4583c', 0.005); band(FX1, FZ0, X1, FZ1, 'tile', '#a4583c', 0.005);
    for (let x = FX0; x < FX1 - 0.1; x += 13.3) { band(x, FZ0 - 0.03, Math.min(FX1, x + 13.3), FZ0 + 0.03, 'cast', '#b08a45', 0.006); band(x, FZ1 - 0.03, Math.min(FX1, x + 13.3), FZ1 + 0.03, 'cast', '#b08a45', 0.006); }
    band(FX0 - 0.03, FZ0, FX0 + 0.03, FZ1, 'cast', '#b08a45', 0.006); band(FX1 - 0.03, FZ0, FX1 + 0.03, FZ1, 'cast', '#b08a45', 0.006);
    // the compass rose at the middle: spinward, anti, front, back
    {
      const disc = (r, n, y0, y1) => { const p = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; p.push([Math.cos(a) * r, Math.sin(a) * r]); } g.prism(p, y0, y1, { capBottom: false }); };
      g.mat('stone', '#e2d6bd'); disc(4.6, 40, 0, 0.006);
      g.mat('slate', '#3d3833'); disc(3.5, 40, 0, 0.008);
      g.mat('cast', '#b08a45'); disc(3.32, 40, 0, 0.009);
      g.mat('stone', '#2f3c3a'); disc(3.24, 40, 0, 0.010);
      s.flush({ tier: 's', level: 0 });
      const tri = (p, y) => { const ar = (p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) - (p[1][1] - p[0][1]) * (p[2][0] - p[0][0]); g.prism(ar > 0 ? p : [p[0], p[2], p[1]], 0, y, { capBottom: false }); };
      for (let k = 0; k < 8; k++) {
        const a = k * Math.PI / 4, long = (k & 1) === 0, R = long ? 3.1 : 2.0, w = long ? 0.46 : 0.32, y = long ? 0.014 : 0.012;
        const T = [Math.cos(a) * R, Math.sin(a) * R], L = [Math.cos(a + Math.PI / 2) * w, Math.sin(a + Math.PI / 2) * w], Rt = [-L[0], -L[1]];
        g.mat(long ? 'stone' : 'tile', long ? '#efe3c6' : '#d39b3a'); tri([[0, 0], L, T], y);
        g.mat(long ? 'tile' : 'tile', long ? '#a4583c' : '#2b6b69'); tri([[0, 0], T, Rt], y);
      }
      g.mat('cast', '#c9a45c'); disc(0.32, 16, 0, 0.018);
      s.flush({ tier: 's', level: 0 });
      // brass studs on the ring every 22.5 degrees
      g.mat('cast', '#c9a45c'); for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8; g.cyl(Math.cos(a) * 3.9, 0, Math.sin(a) * 3.9, 0.07, 0.012, { segs: 8 }); }
      s.flush({ tier: 'd', level: 0 });
      const lab = (t, ox, oz) => floorText(s, { kind: 'letters', text: t, font: 'caps', palette: ['#efe3c6'] }, ox * 4.05, 0.016, oz * 4.05, ox, oz, 1.9, 0.36);
      lab('SPINWARD', 1, 0); lab('ANTI', -1, 0); lab('FRONT', 0, -1); lab('BACK', 0, 1);
    }

    // ---------------------------------------------------------------- the ground-floor walls (the corners nobody else owns)
    const T = 0.16;
    const groundWall = (ax, az, bx, bz, nIn, o) => {
      // nIn: the court side, 'x' (toward -x), 'X' (toward +x), 'z', 'Z'
      const alongX = Math.abs(bx - ax) > Math.abs(bz - az);
      const courtIsA = nIn === 'X' || nIn === 'Z';
      wall(s, ax, az, bx, bz, 0, 3.4, { tintA: courtIsA ? CPAL.plaster : '#cdbb9c', tintB: courtIsA ? '#cdbb9c' : CPAL.plaster, dado: { h: 1.15, mat: 'tile', tint: '#2f6a68' }, openings: o.openings || [], level: 0 });
      // dado rail and a painted band under the cornice, on the court face
      const off = (nIn === 'X' || nIn === 'Z' ? 1 : -1) * (T / 2);
      const len = alongX ? bx - ax : bz - az;
      const pieces = []; let u = 0; for (const op of (o.openings || []).slice().sort((p, q) => p.at - q.at)) { if (op.at > u) pieces.push([u, op.at]); u = op.at + op.w; } if (u < len) pieces.push([u, len]);
      g.mat('wood', '#5a3d28');
      for (const pc of pieces) {
        if (alongX) { g.box(ax + pc[0], 1.13, az + off - 0.02, ax + pc[1], 1.19, az + off + 0.02, { bevel: 0.006 }); }
        else { g.box(ax + off - 0.02, 1.13, az + pc[0], ax + off + 0.02, 1.19, az + pc[1], { bevel: 0.006 }); }
      }
      g.mat('paint', CPAL.terracotta);
      if (alongX) g.box(ax, 2.86, az + off - 0.012, bx, 2.98, az + off + 0.012); else g.box(ax + off - 0.012, 2.86, az, ax + off + 0.012, 2.98, bz);
      s.flush({ tier: 's', level: 0 });
    };
    const faceOf = (nIn) => nIn;     // a sign on the court face looks into the court
    const wallPt = (ax, az, bx, bz, nIn, u, out) => {
      const alongX = Math.abs(bx - ax) > Math.abs(bz - az); const sg = nIn === 'X' || nIn === 'Z' ? 1 : -1;
      return alongX ? [ax + u, az + sg * (T / 2 + out)] : [ax + sg * (T / 2 + out), az + u];
    };
    // a niche: two pilasters and an arched head proud of the wall, a coloured back, a bench built in
    const niche = (W4, u0, w, colour, benchSeat) => {
      const [ax, az, bx, bz, nIn] = W4; const alongX = Math.abs(bx - ax) > Math.abs(bz - az);
      const c = wallPt(ax, az, bx, bz, nIn, u0 + w / 2, 0.15); const b = wallPt(ax, az, bx, bz, nIn, u0 + w / 2, 0.01);
      archway(s, c[0], 0, c[1], w, 2.5, alongX ? 'x' : 'z', { depth: 0.3, tint: '#cdbb9c', level: 0 });
      g.mat('tile', colour);
      if (alongX) g.box(ax + u0, 0.5, b[1] - 0.01, ax + u0 + w, 2.0, b[1] + 0.01, { faces: nIn === 'Z' ? 'Z' : 'z' });
      else g.box(b[0] - 0.01, 0.5, az + u0, b[0] + 0.01, 2.0, az + u0 + w, { faces: nIn === 'X' ? 'X' : 'x' });
      s.flush({ tier: 's', level: 0 });
      const p0 = wallPt(ax, az, bx, bz, nIn, u0 + 0.02, 0.0), p1 = wallPt(ax, az, bx, bz, nIn, u0 + w - 0.02, 0.48);
      block(s, Math.min(p0[0], p1[0]), 0, Math.min(p0[1], p1[1]), Math.max(p0[0], p1[0]), 0.44, Math.max(p0[1], p1[1]), 'wood', '#7a5233', { bevel: 0.015, level: 0 });
      // a cushion or two
      g.mat('weave', benchSeat || CPAL.ochre);
      const q0 = wallPt(ax, az, bx, bz, nIn, u0 + 0.15, 0.04), q1 = wallPt(ax, az, bx, bz, nIn, u0 + w / 2 - 0.05, 0.44);
      g.box(Math.min(q0[0], q1[0]), 0.44, Math.min(q0[1], q1[1]), Math.max(q0[0], q1[0]), 0.5, Math.max(q0[1], q1[1]), { bevel: 0.02 });
      s.flush({ tier: 'd', level: 0 });
      const yaw = nIn === 'X' ? Math.PI / 2 : nIn === 'x' ? -Math.PI / 2 : nIn === 'Z' ? 0 : Math.PI;
      for (let k = 0; k < Math.floor(w / 0.65); k++) { const p = wallPt(ax, az, bx, bz, nIn, u0 + 0.35 + k * 0.65, 0.26); s.spot('sit', p[0], 0.44, p[1], yaw, { tags: ['court', 'bench'] }); }
      const m = wallPt(ax, az, bx, bz, nIn, u0 + w / 2, 0.3);
      seatUse(s, m[0], 0.44, m[1], yaw, 'Sit in the niche');
    };
    const wallSconce = (W4, u, h) => { const [ax, az, bx, bz, nIn] = W4; const p = wallPt(ax, az, bx, bz, nIn, u, 0); lamp(s, 'sconce', p[0], h || 2.3, p[1], { face: nIn, clip: CLIPF, K: 2800, power: 0.8, level: 0 }); };
    const wallDoor = (W4, u, w, tint, label, lockedText) => {
      const [ax, az, bx, bz, nIn] = W4; const alongX = Math.abs(bx - ax) > Math.abs(bz - az);
      const c = alongX ? [ax + u + w / 2, az] : [ax, az + u + w / 2];
      doorFrame(s, c[0], 0, c[1], w, 2.1, alongX ? 'x' : 'z', { depth: 0.26, tint: '#4a3426', level: 0 });
      door(s, { x: alongX ? ax + u : ax, y: 0, z: alongX ? az : az + u, w, h: 2.1, along: alongX ? 'x' : 'z', tint, style: 'panel', locked: true, lockedText, level: 0 });
      const pp = wallPt(ax, az, bx, bz, nIn, u + w + 0.32, 0.005);
      sign(s, { kind: 'plate', text: label[0], lines: [label[1]] }, pp[0], 1.55, pp[1], { face: faceOf(nIn), w: 0.3, h: 0.14, level: 0 });
    };
    const EAST_N = [27.92, -14, 27.92, -4, 'x'], EAST_S = [27.92, 4, 27.92, 20, 'x'], WEST_N = [-27.92, -14, -27.92, -4, 'X'], WEST_S = [-27.92, 4, -27.92, 20, 'X'];
    const SOUTH_W = [-28, 19.92, -17.05, 19.92, 'z'], SOUTH_E = [17.05, 19.92, 28, 19.92, 'z'];
    groundWall(...EAST_N.slice(0, 4), 'x', { openings: [{ at: 1.2, w: 1.0, h: 2.1 }] });
    groundWall(...EAST_S.slice(0, 4), 'x', { openings: [{ at: 9.2, w: 1.0, h: 2.1 }] });
    groundWall(...WEST_N.slice(0, 4), 'X', {});
    groundWall(...WEST_S.slice(0, 4), 'X', { openings: [{ at: 1.6, w: 1.0, h: 2.1 }] });
    groundWall(...SOUTH_W.slice(0, 4), 'z', {});
    groundWall(...SOUTH_E.slice(0, 4), 'z', { openings: [{ at: 3.2, w: 1.0, h: 2.1 }] });
    // the lintels over the book room and the studio, and the small returns by Thread Street
    for (const r of [[-17.05, -3.5], [3.5, 17.05]]) block(s, r[0], 3.2, 19.84, r[1], 3.42, 20.0, 'paint', CPAL.plaster2, { level: 0, noCollide: true });
    wallDoor(EAST_N, 1.2, 1.0, '#7a2f2a', ['WASHROOMS', 'court · free'], 'Engaged');
    wallDoor(EAST_S, 9.2, 1.0, '#33406e', ['COURT STORE', 'chairs and trestles'], 'Locked: the court store');
    wallDoor(WEST_S, 1.6, 1.0, '#3d5a3a', ['VALVES', 'deck 16 water'], 'Locked: valves');
    wallDoor(SOUTH_E, 3.2, 1.0, '#5b4060', ['THE CEILING', 'lamp-painters only'], 'Locked: the lamp room');
    niche(EAST_N, 4.6, 3.2, '#c46a3e', '#2b6b69');
    niche(EAST_S, 1.0, 3.0, '#2f6f8f', CPAL.ochre);
    niche(EAST_S, 12.0, 3.0, '#a24a5a', '#e9c46a');
    niche(WEST_S, 4.4, 3.4, '#c46a3e', '#2f6f8f');
    niche(SOUTH_E, 6.6, 3.0, '#2b6b69', '#d0687a');
    for (const w4 of [[EAST_N, 3.9], [EAST_S, 6.0], [EAST_S, 15.6], [WEST_S, 3.8], [WEST_N, 2.0], [WEST_N, 8.0], [SOUTH_E, 1.5], [SOUTH_W, 8.4]]) wallSconce(w4[0], w4[1]);
    // the west corner: a painted dawn, the block's own mural, with a bench before it
    {
      const x = -27.84 + 0.01, zz0 = -13.0, zz1 = -5.0, y0 = 1.25, y1 = 2.75, N = 16;
      const cols = ['#4a3a5c', '#6b4a6a', '#a35f74', '#d98a7a', '#efc27a', '#f5dc9c'];
      for (let i = 0; i < N; i++) {
        const za = zz0 + (zz1 - zz0) * i / N, zb = zz0 + (zz1 - zz0) * (i + 1) / N;
        for (let j = 0; j < 5; j++) {
          const t = (j + 0.5) / 5, k = Math.min(cols.length - 1.001, (1 - t) * 2.2 + (i / N) * 3.2);
          g.mat('paint', mixHex(cols[Math.floor(k)], cols[Math.min(cols.length - 1, Math.floor(k) + 1)], k - Math.floor(k)));
          g.box(x, y0 + (y1 - y0) * j / 5, za, x + 0.006, y0 + (y1 - y0) * (j + 1) / 5, zb, { faces: 'X' });
        }
      }
      // the far bank, a band of gold land, and the dark near side
      g.mat('paint', '#3a2e2a'); g.box(x, y0, zz0, x + 0.008, y0 + 0.28, zz1, { faces: 'X' });
      g.mat('paint', '#e8b552'); g.box(x, y1 - 0.2, zz0 + 2.0, x + 0.008, y1 - 0.12, zz1 - 0.6, { faces: 'X' });
      g.mat('wood', '#4a3426'); g.box(x - 0.01, y0 - 0.06, zz0 - 0.06, x + 0.04, y0, zz1 + 0.06); g.box(x - 0.01, y1, zz0 - 0.06, x + 0.04, y1 + 0.06, zz1 + 0.06);
      g.box(x - 0.01, y0, zz0 - 0.06, x + 0.04, y1, zz0); g.box(x - 0.01, y0, zz1, x + 0.04, y1, zz1 + 0.06);
      s.flush({ tier: 's', level: 0 });
      sign(s, { kind: 'label', text: 'A RIVER DAWN, AFTER OONA', lines: ['painted by the school, year five'] }, x + 0.03, 1.08, -9, { face: 'X', w: 1.1, h: 0.16, level: 0 });
      prop(s, 'bench', -26.7, 0, -9, Math.PI / 2, { w: 2.4, back: true }, { level: 0 });
      seatUse(s, -26.7, 0.46, -9, Math.PI / 2, 'Sit under the dawn');
      lamp(s, 'spot', -26.2, 3.35, -9, { clip: CLIPF, K: 3000, power: 0.6, dir: [-0.6, -0.8, 0], cone: [55, 30], level: 0 });
    }
    // the lost and found board by the court store
    {
      const x = -0 + 27.84 - 0.02;
      g.mat('felt', '#8a6a4a'); g.box(x - 0.03, 1.3, 9.0, x, 2.2, 10.9, { faces: 'x' }); g.mat('wood', '#4a3426'); g.box(x - 0.05, 1.26, 8.96, x, 2.24, 10.94, { faces: 'xyY' });
      s.flush({ tier: 's', level: 0 });
      sign(s, SIGNS['court.lost.thread'], x - 0.04, 1.78, 9.35, { face: 'x', level: 0 });
      sign(s, SIGNS['court.lost.cab'], x - 0.04, 1.74, 9.95, { face: 'x', level: 0 });
      sign(s, SIGNS['court.lost.lid'], x - 0.04, 1.8, 10.55, { face: 'x', level: 0 });
      sign(s, { kind: 'label', text: 'LOST · FOUND', lines: ['take only what is yours'] }, x - 0.04, 2.08, 9.95, { face: 'x', w: 1.2, h: 0.12, level: 0 });
      s.interact({ x: x - 0.4, y: 1.7, z: 9.95, radius: 1.4, prompt: 'Read the lost and found', onUse: async (gm) => {
        if (!gm.ui) return; gm.busy++;
        try { await gm.ui.say('Lost and found', ['Found: one black thread, left wrist, small. Ask at the baths.', 'Lost: a wooden cab, gimbal stiff. Toy library property. Ros knows who.', 'Found: a hall lid, numbered 211.']); } finally { gm.busy--; }
      } });
    }
    // planters along the south corner walls
    planter(s, -19.1, 0, 19.45, { w: 3.2, d: 0.6, h: 0.55, plants: 'fern', tint: '#a4583c', level: 0 });
    planter(s, 24.0, 0, 19.45, { w: 3.6, d: 0.6, h: 0.55, plants: 'flower', tint: '#a4583c', level: 0 });
    planter(s, 27.4, 0, -1.0 - 6.0, { w: 0.6, d: 1.4, h: 0.55, plants: 'broad', tint: '#a4583c', level: 0 });
    // deck and court plates at the street mouths
    sign(s, SIGNS['court.plate'], 2.95, 2.3, 19.7, { face: 'z', w: 0.42, h: 0.18, level: 0 });
    sign(s, SIGNS['court.plate'], 27.68, 2.3, -4.6, { face: 'x', w: 0.42, h: 0.18, level: 0 });
    sign(s, SIGNS['court.plate'], -27.68, 2.3, 4.6, { face: 'X', w: 0.42, h: 0.18, level: 0 });
    sign(s, SIGNS['deck16.plate'], -2.95, 2.3, 19.7, { face: 'z', w: 0.42, h: 0.18, level: 0 });
    sign(s, SIGNS['ladle-row.street'], 27.68, 2.75, 4.6, { face: 'x', level: 0 });
    sign(s, SIGNS['ladle-row.street'], -27.68, 2.75, -4.6, { face: 'X', level: 0 });
    sign(s, SIGNS['thread-street.street'], 0, 3.0, 19.95, { face: 'z', level: 0 });

    // ---------------------------------------------------------------- piers rising through every deck
    for (const pr of PIERS) {
      const [px, pz, hw, foot] = pr; const alongX = Math.abs(pz - Z1) < 0.01 || Math.abs(pz - Z0) < 0.01;
      const a0 = alongX ? px - hw : pz - hw, a1 = alongX ? px + hw : pz + hw;
      const B = (y0, y1, grow, mat, tint, faces) => { g.mat(mat, tint); if (alongX) g.box(a0 - grow, y0, pz - 0.28 - grow, a1 + grow, y1, pz + 0.28 + grow, { faces }); else g.box(px - 0.28 - grow, y0, a0 - grow, px + 0.28 + grow, y1, a1 + grow, { faces }); };
      const segs = [];
      if (foot <= 0) segs.push([0, 3.4, 0]);
      for (const L of COURT.decks) { if (L + 0.1 >= foot) segs.push([Math.max(L + 0.1, foot), L === 20 ? 22.6 : L + 3.4, L]); }
      for (const sg of segs) {
        const [y0, y1, L] = sg; const lv = lvOf(L);
        if (L === 0) { B(0, 0.9, 0.04, 'stone', '#a99a82'); B(0.9, 0.98, 0.06, 'stone', '#bcae96'); }
        B(L === 0 ? 0.98 : y0, y1 - 0.22, 0, 'plaster', CPAL.plaster);
        B(y1 - 0.22, y1 - 0.14, 0.05, 'paint', CPAL.terracotta); B(y1 - 0.14, y1, 0.09, 'paint', CPAL.plaster2);
        s.flush({ tier: 's', cast: false, level: lv });
        s.solid(alongX ? a0 : px - 0.28, y0, alongX ? pz - 0.28 : a0, alongX ? a1 : px + 0.28, y1, alongX ? pz + 0.28 : a1);
      }
    }

    // ---------------------------------------------------------------- the luminous ceiling
    {
      const Y = TOP, NX = 14, NZ = 8, cw = (X1 - X0) / NX, cd = (Z1 - Z0) / NZ;
      // the deep perimeter beam at the void's edge
      g.mat('plaster', CPAL.plaster);
      g.box(X0 - 0.3, Y - 0.85, Z0 - 0.3, X1 + 0.3, Y, Z0 + 0.25, { faces: 'yzZ' }); s.flush({ tier: 's', level: 5 });
      g.box(X0 - 0.3, Y - 0.85, Z1 - 0.25, X1 + 0.3, Y, Z1 + 0.3, { faces: 'yzZ' }); s.flush({ tier: 's', level: 5 });
      g.box(X0 - 0.3, Y - 0.85, Z0, X0 + 0.25, Y, Z1, { faces: 'yxX' }); s.flush({ tier: 's', level: 5 });
      g.box(X1 - 0.25, Y - 0.85, Z0, X1 + 0.3, Y, Z1, { faces: 'yxX' }); s.flush({ tier: 's', level: 5 });
      g.mat('paint', CPAL.terracotta);
      for (const z of [Z0 + 0.27, Z1 - 0.27]) { g.box(X0, Y - 0.85, z - 0.02, X1, Y - 0.72, z + 0.02); }
      g.mat('cast', '#b08a45');
      g.box(X0 + 0.25, Y - 0.87, Z0 + 0.25, X1 - 0.25, Y - 0.85, Z0 + 0.3); g.box(X0 + 0.25, Y - 0.87, Z1 - 0.3, X1 - 0.25, Y - 0.85, Z1 - 0.25);
      s.flush({ tier: 's', level: 5 });
      // coffer beams
      for (let i = 1; i < NX; i++) { const x = X0 + i * cw; g.mat('paint', '#efe5d1'); g.box(x - 0.16, Y - 0.62, Z0 + 0.25, x + 0.16, Y, Z1 - 0.25, { faces: 'yxX', bevel: 0.02 }); g.mat('cast', '#b08a45'); g.box(x - 0.04, Y - 0.64, Z0 + 0.25, x + 0.04, Y - 0.62, Z1 - 0.25, { faces: 'y' }); s.flush({ tier: 's', level: 5 }); }
      for (let j = 1; j < NZ; j++) { const z = Z0 + j * cd; for (let i = 0; i < NX; i += 7) { g.mat('paint', '#efe5d1'); g.box(X0 + 0.25 + i * cw, Y - 0.62, z - 0.16, X0 + (i + 7) * cw - (i + 7 === NX ? 0.25 : 0), Y, z + 0.16, { faces: 'yzZ', bevel: 0.02 }); g.mat('cast', '#b08a45'); g.box(X0 + 0.25 + i * cw, Y - 0.64, z - 0.04, X0 + (i + 7) * cw, Y - 0.62, z + 0.04, { faces: 'y' }); s.flush({ tier: 's', level: 5 }); } }
      // the panels: warm white, a wash of rose across the middle, pale gold toward spinward, and a few test colours.
      // They are their own mesh, recoloured through the day (see courtSky above): the lamp-painters' ceiling.
      const tests = { '2,1': '#b68aa6', '3,1': '#a87c9a', '11,6': '#ffd27a', '12,6': '#ffc35e', '6,7': '#c8e3d0' };
      const OY = Y - 0.1, pg = new Geo(new MeshBuf(1024, 2048)); pg.push(); pg.move(0, -OY, -3);
      const panels = [];
      for (let i = 0; i < NX; i++) {
        for (let j = 0; j < NZ; j++) {
          const t = (i + 0.5) / NX, u = (j + 0.5) / NZ;
          const rose = Math.exp(-Math.pow((t * 0.9 - u * 0.75 - 0.08), 2) / 0.035);
          let c = mixHex('#fff4e2', '#ffd0c8', 0.75 * rose); c = mixHex(c, '#ffe2a2', Math.max(0, t - 0.55) * 1.1);
          const test = tests[i + ',' + j]; if (test) c = test;
          const xa = X0 + i * cw + (i === 0 ? 0.25 : 0.16), xb = X0 + (i + 1) * cw - (i === NX - 1 ? 0.25 : 0.16);
          const za = Z0 + j * cd + (j === 0 ? 0.25 : 0.16), zb = Z0 + (j + 1) * cd - (j === NZ - 1 ? 0.25 : 0.16);
          g.mat('paint', '#e6dac4'); g.box(xa, Y - 0.12, za, xb, Y, zb, { faces: 'xXzZ' });
          pg.mat('diffuser', c, { emissive: 3.2 }); const v0 = pg.buf.nv; pg.box(xa + 0.04, Y - 0.1, za + 0.04, xb - 0.04, Y - 0.08, zb - 0.04, { faces: 'y' });
          panels.push({ v0, v1: pg.buf.nv, t, u, base: rgbOf(c), test: !!test });
        }
        s.flush({ tier: 's', level: 5 });
      }
      pg.pop();
      const pmesh = new THREE.Mesh(pg.buf.toGeometry(), W.mats.opaque);
      W.addRenderable(pmesh, { frame: f, origin: [0, OY, 3], center: [0, 0, 0], radius: 34, far: 400, caster: false, scope: s, level: 5 });
      s.meshes.push(pmesh);
      // the light of it: an overcast day for the floor, a warm fill for the evening, and big soft downlights, all on the ceiling's clock
      const amb = s.ambient({ box: [X0 + 0.6, 0, Z0 + 0.6, X1 - 0.6, TOP, Z1 - 0.6], sky: '#fff0de', ground: '#d6bf98', power: 5.6, skylit: true, soft: 2.2 });
      s.ambient({ box: [X0 + 0.6, 0, Z0 + 0.6, X1 - 0.6, TOP, Z1 - 0.6], sky: '#ffd8b0', ground: '#c9a57c', power: 1.1, skylit: true, lamp: true, soft: 2.2 });
      const downs = [];
      for (const lx of [-20, -7, 7, 20]) for (const lz of [-5, 11]) {
        downs.push(s.light({ at: [lx, Y - 0.5, lz], type: 'spot', dir: [0, -1, 0], cone: [72, 38], color: '#fff1df', power: 420, range: 34, shadow: true, radius: 2.2, clip: CLIP }));
      }
      // two big warm washes for the evening
      for (const lx of [-12, 12]) s.light({ at: [lx, Y - 0.6, 3], type: 'spot', dir: [0, -1, 0], cone: [80, 45], color: '#ffd9a8', power: 200, range: 32, shadow: true, lamp: true, radius: 3, clip: CLIP });
      courtSky(s, game, pmesh, panels, amb, downs, skyZones);
    }

    // ---------------------------------------------------------------- the stair tower (south-west corner)
    {
      const TX0 = -28, TX1 = -21, TZ0 = 13, TZ1 = 20, ML = -26.4, MD = -23;      // main landing x[TX0, ML], flights x[ML, MD], mid landing x[MD, TX1]
      const SL = [18, 20], NL = [13, 15];                                         // lanes: flight A climbs +x in the south lane, flight B -x in the north
      const stepMat = '#cbb79a', nose = '#8a6a3a';
      const flight = (xa, ya, xb, yb, zl, lv) => {
        const n = Math.round((yb - ya) / 0.167), sr = (yb - ya) / n, run = xb - xa, st = run / n, z0 = zl[0], z1 = zl[1];
        for (let i = 0; i < n; i++) {
          const u0 = xa + i * st, u1 = xa + (i + 1) * st, yt = ya + (i + 1) * sr;
          g.mat('terrazzo', stepMat); g.box(Math.min(u0, u1), yt - sr, z0 + 0.06, Math.max(u0, u1), yt, z1 - 0.06, { faces: (st > 0 ? 'x' : 'X') + 'Y' });
          g.mat('cast', nose); g.box(Math.min(u0, u0 + Math.sign(st) * 0.05), yt - 0.025, z0 + 0.06, Math.max(u0, u0 + Math.sign(st) * 0.05), yt + 0.003, z1 - 0.06, { faces: 'Y' + (st > 0 ? 'x' : 'X') });
        }
        const xl = Math.min(xa, xb), xh = Math.max(xa, xb), yl = xa < xb ? ya : yb, yh = xa < xb ? yb : ya;
        g.mat('paint', '#e3d3b6'); g.extrude([[xl, yl - sr - 0.2], [xh, yh - sr - 0.2], [xh, yh - sr], [xl, yl - sr]], z0 + 0.06, z1 - 0.06, 'z');
        g.mat('paint', CPAL.terracotta);
        for (const zz of [[z0, z0 + 0.06], [z1 - 0.06, z1]]) g.extrude([[xl, yl - sr - 0.26], [xh, yh - sr - 0.26], [xh, yh + 0.12], [xl, yl + 0.12]], zz[0], zz[1], 'z');
        s.flush({ tier: 's', cast: true, level: lv });
        s.ramp(xl, z0, xh, z1, yl, yh, 'x', { surf: 'tile' });
      };
      const slab = (x0, z0, x1, z1, y, lv) => {
        floor(s, x0, z0, x1, z1, y, 'terrazzo', '#d6c4a4', { level: lv });
        g.mat('paint', '#e3d3b6'); g.box(x0, y - 0.3, z0, x1, y - 0.02, z1, { faces: 'yxXzZ' });
        g.mat('paint', CPAL.terracotta); g.box(x0 - 0.02, y - 0.3, z0 - 0.02, x1 + 0.02, y - 0.18, z1 + 0.02, { faces: 'xXzZ' });
        s.flush({ tier: 's', level: lv });
      };
      // posts: two heavy ones on the court side, four slim ones round the well
      for (const p of [[-21.15, 13.15, 0.2], [-21.15, 19.85, 0.2]]) {
        g.mat('cast', CPAL.teal); g.box(p[0] - p[2], 0, p[1] - p[2], p[0] + p[2], TOP - 0.85, p[1] + p[2], { bevel: 0.02 });
        for (const L of [2, 6, 10, 14, 18]) { g.mat('cast', '#b08a45'); g.box(p[0] - p[2] - 0.02, L - 0.32, p[1] - p[2] - 0.02, p[0] + p[2] + 0.02, L - 0.28, p[1] + p[2] + 0.02); }
        s.flush({ tier: 's', cast: true, level: 2 }); s.solid(p[0] - p[2], 0, p[1] - p[2], p[0] + p[2], TOP, p[1] + p[2]);
      }
      for (const p of [[ML, 15], [ML, 18], [MD, 15], [MD, 18]]) { g.mat('cast', CPAL.teal); g.box(p[0] - 0.06, 0, p[1] - 0.06, p[0] + 0.06, TOP - 0.85, p[1] + 0.06); s.flush({ tier: 's', cast: true, level: 2 }); s.solid(p[0] - 0.06, 0, p[1] - 0.06, p[0] + 0.06, TOP, p[1] + 0.06); }
      for (const L of [0, 4, 8, 12, 16]) {
        const lv = lvOf(L);
        flight(ML, L, MD, L + 2, SL, lv);                    // A: climbs spinward along the south lane
        slab(MD, TZ0, TX1, TZ1, L + 2, lvOf(L + 2));        // the half landing
        flight(MD, L + 2, ML, L + 4, NL, lvOf(L + 2));      // B: climbs anti along the north lane
        slab(TX0, TZ0, ML, TZ1, L + 4, lvOf(L + 4));         // the deck landing, open to the terraces
        // rails: the well and the outer edges of both flights, round the half landing
        slopeRail(s, ML, L, SL[0] + 0.03, MD, L + 2, SL[0] + 0.03, { level: lv });
        slopeRail(s, ML, L, SL[1] - 0.05, MD, L + 2, SL[1] - 0.05, { level: lv });
        slopeRail(s, MD, L + 2, NL[1] - 0.03, ML, L + 4, NL[1] - 0.03, { level: lv });
        slopeRail(s, MD, L + 2, NL[0] + 0.05, ML, L + 4, NL[0] + 0.05, { level: lv });
        railing(s, [[TX1 - 0.05, TZ0 + 0.05], [TX1 - 0.05, TZ1 - 0.05]], L + 2, { tint: CPAL.teal, level: lvOf(L + 2) });
        railing(s, [[MD + 0.05, 15.06], [MD + 0.05, 17.94]], L + 2, { tint: CPAL.teal, level: lvOf(L + 2) });
        railing(s, [[MD, TZ0 + 0.05], [TX1, TZ0 + 0.05]], L + 2, { tint: CPAL.teal, level: lvOf(L + 2) });
        railing(s, [[MD, TZ1 - 0.05], [TX1, TZ1 - 0.05]], L + 2, { tint: CPAL.teal, level: lvOf(L + 2) });
        railing(s, [[ML - 0.05, 15.06], [ML - 0.05, 17.94]], L + 4, { tint: CPAL.teal, level: lvOf(L + 4) });
        railing(s, [[TX0, TZ0 + 0.05], [ML, TZ0 + 0.05]], L + 4, { tint: CPAL.teal, level: lvOf(L + 4) });
        // a lamp under each half landing and each deck landing, and a pot on every landing
        lamp(s, 'globe', -22.0, L + 3.3, 16.5, { clip: [TX0 - 0.1, L, TZ0 - 0.2, TX1 + 0.4, L + 4.3, TZ1 + 0.2], K: 2700, power: 0.7, drop: 0.35, level: lvOf(L + 2) });
        prop(s, 'plant', -21.8, L + 2, 19.3, rr.f(0, 6), { kind: ['broad', 'fern', 'fine', 'flower'][L / 4], size: 1.1, pot: ['#a3563a', '#2b6b69', '#d39b3a', '#5b4060'][L / 4] }, { level: lvOf(L + 2) });
        const dp = SIGNS['deck' + (17 + L / 4) + '.plate'];
        if (dp) sign(s, dp, -21.15 - 0.21, L + 4 + 1.6, 13.15, { face: 'x', w: 0.36, h: 0.16, level: lvOf(L + 4) });
      }
      railing(s, [[ML - 0.05, 15.06], [ML - 0.05, TZ1 - 0.05]], 20, { tint: CPAL.teal, level: 5 });
      // ground floor: close the space under the first flights; posters on the face toward the court
      block(s, ML, 0, TZ0, TX1, 1.9, TZ0 + 0.14, 'paint', '#cdbb9c', { level: 0 });
      block(s, TX1 - 0.14, 0, TZ0, TX1, 1.9, TZ1, 'paint', '#cdbb9c', { level: 0 });
      g.mat('tile', '#2f6a68'); g.box(ML, 0, TZ0 - 0.012, TX1, 0.9, TZ0, { faces: 'z' }); g.box(TX1, 0, TZ0, TX1 + 0.012, 0.9, TZ1, { faces: 'X' }); s.flush({ tier: 's', level: 0 });
      const posters = ['poster.booking', 'poster.feast', 'poster.flight', 'poster.dawn', 'poster.choir', 'poster.reels'];
      posters.forEach((id, i) => { if (SIGNS[id]) sign(s, SIGNS[id], TX1 + 0.02, 1.15, 13.95 + i * 1.05, { face: 'X', level: 0 }); });
      sign(s, { kind: 'hanging', text: 'STAIRS' }, -27.2, 3.05, 12.85, { face: 'z', double: true, level: 0 });
      // a long chain of lanterns down the well, from the ceiling to the ground
      for (let k = 0; k < 15; k++) {
        const y = 21.6 - k * 1.38; const x = -24.7 + Math.sin(k * 1.3) * 0.18, z = 16.5 + Math.cos(k * 1.7) * 0.2;
        lanternMesh(g, x, y, z, LANTERN_COLS[k % LANTERN_COLS.length], k % 3 === 1 ? 1 : 0, 2.6);
        s.flush({ tier: 's', cast: false, level: lvOf(y) });
      }
      g.mat('weave', '#3e3228'); g.tube([[-24.7, TOP - 0.6, 16.5], [-24.7, 1.0, 16.5]], 0.006, { segs: 3, caps: false }); s.flush({ tier: 's', cast: false, level: 2 });
      for (const y of [17.5, 9.5, 2.5]) s.light({ at: [-24.7, y, 16.5], color: '#ffc27a', power: 2.0, range: 6, lamp: true, clip: [TX0, 0, TZ0, TX1, TOP, TZ1] });
      planter(s, -24.7, 0, 16.5, { w: 1.2, d: 1.2, h: 0.45, plants: 'fern', tint: CPAL.terracotta, level: 0 });
      s.path([[-27.2, 0, 10.5], [-27.2, 0, 19.0], [-26.4, 0, 19.0]], { width: 1.4 });
      for (const L of [0, 4, 8, 12, 16]) {
        s.path([[-26.4, L, 19.0], [-23.0, L + 2, 19.0], [-22.0, L + 2, 19.0], [-22.0, L + 2, 14.0], [-23.0, L + 2, 14.0], [-26.4, L + 4, 14.0], [-27.2, L + 4, 14.0], [-27.2, L + 4, 19.0], [-26.4, L + 4, 19.0]], { width: 1.4 });
        // the joins to the west and south terraces (terraces.js runs its walkways through these points)
        s.path([[-27.2, L + 4, 14.0], [-29.6, L + 4, 14.0]], { width: 1.4 });
        s.path([[-27.2, L + 4, 19.0], [-27.2, L + 4, 21.6]], { width: 1.4 });
        s.spot('stand', -22.2, L + 2, 18.4, fy(1, 0), { tags: ['court', 'stair', 'look'] });
      }
    }

    // ---------------------------------------------------------------- trees in raised beds
    const tree = (x, z, o) => {
      const r = new Rng('tree' + x + ',' + z), H = o.h || 9, R = o.bed || 1.8, Ri = R - 0.38;
      const oct = (rad) => { const p = []; for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; p.push([x + Math.cos(a) * rad, z + Math.sin(a) * rad]); } return p; };
      g.mat('stone', '#b9aa90'); g.prism(oct(R), 0, 0.4); g.mat('stone', '#a99a82'); g.prism(oct(R + 0.06), 0, 0.08);
      g.mat('soil', '#ffffff'); g.prism(oct(Ri), 0.4, 0.43, { capBottom: false });
      const O = oct(R + 0.04), I = oct(Ri);
      for (let i = 0; i < 8; i++) { const j = (i + 1) % 8; g.mat('wood', i % 2 ? '#8a6240' : '#7a5636', { rough: -0.05 }); g.prism([O[i], O[j], I[j], I[i]], 0.4, 0.47); }
      s.flush({ tier: 's', cast: true, level: 0 });
      s.post(x, z, R, 0, 0.47);
      // trunk and limbs
      const lx = r.f(-0.4, 0.4), lz = r.f(-0.4, 0.4), tH = H * 0.52;
      const tp = (t) => [x + lx * t, 0.38 + (tH - 0.38) * t, z + lz * t];
      g.mat('bark', o.bark || '#ffffff');
      g.tube([tp(0), tp(0.3), tp(0.65), tp(1)], [0.34, 0.25, 0.2, 0.15], { segs: 10 });
      g.lathe(x, z, [[0.46, 0.38], [0.34, 0.55], [0.3, 0.8]], { segs: 10, capBottom: false, capTop: false });
      const ends = [];
      const nb = o.limbs || 6;
      for (let k = 0; k < nb; k++) {
        const b = k / nb * Math.PI * 2 + r.f(-0.3, 0.3), t0 = r.f(0.45, 0.95), p0 = tp(t0), L = r.f(1.5, 2.6) * (o.spread || 1), rise = r.f(1.3, 2.4);
        const pm = [p0[0] + Math.cos(b) * L * 0.5, p0[1] + rise * 0.55, p0[2] + Math.sin(b) * L * 0.5], pe = [p0[0] + Math.cos(b) * L, p0[1] + rise, p0[2] + Math.sin(b) * L];
        g.tube([p0, pm, pe], [0.12, 0.08, 0.035], { segs: 6 });
        const b2 = b + r.sign() * r.f(0.5, 0.9), pe2 = [pm[0] + Math.cos(b2) * L * 0.55, pm[1] + rise * 0.7, pm[2] + Math.sin(b2) * L * 0.55];
        g.tube([pm, pe2], [0.06, 0.025], { segs: 5 });
        ends.push(pe, pe2);
      }
      ends.push(tp(1), [x + lx, tH + 2.2, z + lz]);
      s.flush({ tier: 's', cast: true, level: lvOf(H * 0.5) });
      s.post(x + lx * 0.2, z + lz * 0.2, 0.32, 0.4, tH);
      // canopy: clumps of leaf cards round the limb ends
      for (const e of ends) {
        const cr = r.f(1.3, 1.9) * (o.spread || 1), cy = r.f(0.9, 1.3), n = Math.round((o.cards || 46) * 2.2);
        for (let i = 0; i < n; i++) {
          let u, v, w; do { u = r.f(-1, 1); v = r.f(-1, 1); w = r.f(-1, 1); } while (u * u + v * v + w * w > 1);
          const k = Math.pow(u * u + v * v + w * w, 0.15) / Math.max(0.2, Math.sqrt(u * u + v * v + w * w));
          const px = e[0] + u * k * cr, py = e[1] + v * k * cy * 0.9, pz = e[2] + w * k * cr, sz = r.f(0.55, 0.9);
          const bl = o.blossom && r.chance(o.blossom);
          g.mat(bl ? 'blossom' : (o.leaf || 'leafA'), bl ? '#ffffff' : mixHex('#ffffff', o.tint || '#cfe3a6', r.f(0, 0.6)), { sway: 0.28 });
          g.card(px, py - sz * 0.45, pz, sz, sz, r.f(0, Math.PI * 2), { tilt: r.f(-0.55, 0.55) });
        }
        s.flush({ tier: 'd', cast: true, level: lvOf(e[1]) });
      }
      // seats round the rim
      for (let i = 0; i < 8; i++) {
        const a = Math.PI / 4 + i * Math.PI / 4, rad = (R + Ri) / 2 * Math.cos(Math.PI / 8) + 0.05;
        s.spot('sit', x + Math.cos(a) * (rad + 0.12), 0.47, z + Math.sin(a) * (rad + 0.12), fy(Math.cos(a), Math.sin(a)), { tags: ['court', 'tree'] });
      }
      const a = o.seatA === undefined ? Math.PI / 2 : o.seatA, rad = R;
      seatUse(s, x + Math.cos(a) * rad, 0.47, z + Math.sin(a) * rad, fy(Math.cos(a), Math.sin(a)), 'Sit under the tree');
    };
    tree(-17, -8.5, { h: 9.5, cards: 48 });
    tree(17, -8.5, { h: 9.0, cards: 46, tint: '#bfe08f', seatA: -Math.PI / 2 });
    tree(-6.5, 6.5, { h: 8.0, cards: 40, blossom: 0.5, spread: 0.85, tint: '#d8eab0', seatA: -Math.PI / 2 });
    tree(7.2, 6.3, { h: 8.5, cards: 42, leaf: 'leafB', tint: '#b8d88a', seatA: -Math.PI / 2 });

    // ---------------------------------------------------------------- the bandstand
    const BX = 17.6, BZ = 12.2, BR = 3.2;
    {
      const oct = (rad, y) => { const p = []; for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; p.push([BX + Math.cos(a) * rad, BZ + Math.sin(a) * rad]); } return p; };
      g.mat('stone', '#a99a82'); g.prism(oct(BR + 0.05), 0, 0.12);
      g.mat('paint', CPAL.terracotta); g.prism(oct(BR), 0.12, 0.5);
      g.mat('paint', CPAL.cream); g.prism(oct(BR + 0.03), 0.5, 0.58);
      g.mat('planks', '#a87a4e'); g.prism(oct(BR - 0.02), 0.58, 0.64, { capBottom: false });
      s.flush({ tier: 's', cast: true, level: 0 });
      s.post(BX, BZ, BR * 0.95, 0, 0.64, { surf: 'wood' });
      // steps on the court side
      const ap = BR * Math.cos(Math.PI / 8);
      block(s, BX - ap - 0.44, 0, BZ - 0.9, BX - ap, 0.21, BZ + 0.9, 'stone', '#bcae96', { bevel: 0.01, level: 0 });
      block(s, BX - ap - 0.22, 0.21, BZ - 0.9, BX - ap, 0.42, BZ + 0.9, 'stone', '#bcae96', { bevel: 0.01, level: 0 });
      const C = oct(BR - 0.15);
      g.mat('cast', CPAL.teal);
      for (const c of C) { g.tube([[c[0], 0.64, c[1]], [c[0], 3.45, c[1]]], 0.055, { segs: 8 }); g.lathe(c[0], c[1], [[0.09, 0.64], [0.07, 0.75], [0.055, 0.8]], { segs: 8, capTop: false }); }
      // low rails between posts, except the step side
      for (let i = 0; i < 8; i++) { const a = C[i], b = C[(i + 1) % 8]; const mid = Math.atan2((a[1] + b[1]) / 2 - BZ, (a[0] + b[0]) / 2 - BX); if (Math.abs(Math.abs(mid) - Math.PI) < 0.3) continue; g.tube([[a[0], 1.55, a[1]], [b[0], 1.55, b[1]]], 0.025, { segs: 6 }); for (let k = 1; k < 6; k++) { const t = k / 6; g.tube([[a[0] + (b[0] - a[0]) * t, 0.64, a[1] + (b[1] - a[1]) * t], [a[0] + (b[0] - a[0]) * t, 1.55, a[1] + (b[1] - a[1]) * t]], 0.01, { segs: 4, caps: false }); } }
      // brackets under the eaves
      for (const c of C) { const dx = c[0] - BX, dz = c[1] - BZ, l = Math.hypot(dx, dz); g.tube([[c[0], 3.0, c[1]], [c[0] + dx / l * 0.35, 3.45, c[1] + dz / l * 0.35]], 0.025, { segs: 5 }); }
      s.flush({ tier: 's', cast: true, level: 0 });
      // the roof: eight painted panels, ochre and terracotta, a cream underside, a scalloped valance and a brass finial
      const E = oct(BR + 0.45), apex = [BX, 5.15, BZ], eave = 3.5;
      for (let i = 0; i < 8; i++) {
        const a = E[i], b = E[(i + 1) % 8];
        g.mat('panel', i % 2 ? CPAL.ochre : CPAL.terracotta); g.quad([b[0], eave, b[1]], [a[0], eave, a[1]], apex, apex);
        g.mat('paint', CPAL.cream); g.quad([a[0], eave - 0.02, a[1]], [b[0], eave - 0.02, b[1]], [apex[0], apex[1] - 0.05, apex[2]], [apex[0], apex[1] - 0.05, apex[2]]);
      }
      g.mat('cast', '#b08a45'); g.lathe(BX, BZ, [[0.16, 5.0], [0.12, 5.2], [0.14, 5.35], [0.02, 5.75]], { segs: 10 }); g.ball(BX, 5.42, BZ, 0.1, 0.1, 0.1, { segs: 10, rings: 6 });
      s.flush({ tier: 's', cast: true, level: 1 });
      for (let i = 0; i < 8; i++) {
        const a = E[i], b = E[(i + 1) % 8];
        g.mat('stripe', i % 2 ? '#2b6b69' : '#f1e6cf', { sway: 0.4 });
        g.sheet([a[0], eave, a[1]], [b[0], eave, b[1]], [b[0], eave - 0.42, b[1]], [a[0], eave - 0.42, a[1]], { nu: 6, nv: 2, ripple: 0.03, rippleN: 6 });
        // bulbs along the eave
        for (let k = 0; k < 3; k++) { const t = (k + 0.5) / 3; g.mat('diffuser', '#ffe2a8', { emissive: 6, lamp: true }); g.ball(a[0] + (b[0] - a[0]) * t, eave - 0.47, a[1] + (b[1] - a[1]) * t, 0.045, 0.06, 0.045, { segs: 8, rings: 5 }); }
      }
      s.flush({ tier: 'd', cast: false, level: 0 });
      lamp(s, 'globe', BX, 3.0, BZ, { clip: CLIP, K: 2700, power: 1.4, drop: 1.9, r: 0.22, range: 9, level: 0 });
      lamp(s, 'spot', BX - 6.5, 3.35, BZ - 0.0, { clip: CLIP, K: 3000, power: 1.2, dir: [0.85, -0.53, 0], cone: [40, 22], range: 12, level: 0 });
      // chairs, stands and instruments for the evening's band
      const seats = [[-1.2, -1.3], [0.4, -1.8], [1.6, -0.6], [1.4, 1.1], [-0.2, 1.8]];
      seats.forEach((sp, i) => {
        const x = BX + sp[0], z = BZ + sp[1], yaw = fy(BX - 2.5 - x, BZ - z);
        prop(s, 'chair', x, 0.64, z, yaw, { wood: ['#5a3d28', '#7a5233', '#3a2a20'][i % 3], seat: ['#c9552e', '#d9c08a', '#2f6f8f'][i % 3] }, { level: 0, noSpots: true });
        s.spot('perform', x, 1.1, z, yaw, { tags: ['court', 'band', 'evening'] });
        if (i < 4) prop(s, 'court.stand', x - Math.sin(yaw) * -0.6, 0.64, z - Math.cos(yaw) * -0.6, yaw + Math.PI, {}, { level: 0 });
      });
      prop(s, 'court.drum', BX + 0.6, 0.64, BZ + 0.7, 0, {}, { level: 0 });
      prop(s, 'court.flute', BX + 2.2, 0.64, BZ - 0.3, 0, {}, { level: 0 });
      prop(s, 'court.flute', BX + 2.1, 0.64, BZ + 0.2, 0, {}, { level: 0 });
      s.spot('perform', BX - 0.6, 0.64, BZ + 0.2, fy(-1, 0), { tags: ['court', 'band', 'choir', 'evening'] });
      sign(s, SIGNS['court.choir'], BX - ap - 1.1, 0.75, BZ + 1.55, { face: 'x', level: 0 });
      g.mat('wood', '#4a3426'); g.tube([[BX - ap - 1.06, 0, BZ + 1.25], [BX - ap - 1.06, 1.2, BZ + 1.55], [BX - ap - 1.06, 0, BZ + 1.85]], 0.02, { segs: 5 }); g.tube([[BX - ap - 1.2, 0, BZ + 1.55], [BX - ap - 1.08, 1.2, BZ + 1.55]], 0.02, { segs: 5 }); s.flush({ tier: 'd', level: 0 });
      // benches for the audience, facing the stage
      for (const a of [Math.PI * 0.82, Math.PI, Math.PI * 1.18]) {
        const x = BX + Math.cos(a) * 6.6, z = BZ + Math.sin(a) * 6.6; const yaw = fy(BX - x, BZ - z);
        prop(s, 'bench', x, 0, z, yaw, { w: 2.2, back: true }, { level: 0 });
      }
      seatUse(s, BX - 6.6, 0.46, BZ, fy(1, 0), 'Sit and listen');
      s.interact({ x: BX - ap - 1.1, y: 0.8, z: BZ + 1.55, radius: 1.3, prompt: 'Read the choir board', onUse: async (gm) => {
        if (!gm.ui) return; gm.busy++; try { await gm.ui.say('Chalked on the board', SIGNS['court.choir'].lines.join(' ').replace('; the court rings.', '. The court rings.')); } finally { gm.busy--; }
      } });
    }

    // ---------------------------------------------------------------- where the block court sits
    const RC = [-11.5, 12.6], RR = 3.3;
    {
      const woods = ['#6b4a2f', '#7a5233', '#3a2a20', '#8a6240', '#5a3d28'], seatsC = ['#c9552e', '#d9c08a', '#2f6f8f', '#8a2f3c', '#6b8f4e', '#e9c46a', '#5b4060'];
      for (let i = 0; i < 15; i++) {
        const a = -Math.PI / 2 + (i + 1) * Math.PI * 2 / 16; const x = RC[0] + Math.cos(a) * RR, z = RC[1] + Math.sin(a) * RR;
        prop(s, 'court.chair', x, 0, z, fy(-Math.cos(a), -Math.sin(a)), { wood: woods[i % woods.length], seat: seatsC[(i * 3) % seatsC.length], back: i % 3 === 1 ? 'slat' : 'hoop' }, { level: 0, spot: { tags: ['court', 'blockcourt'] } });
      }
      // the speaker's stool and a little table with the list on it, toward the front
      const sx = RC[0], sz = RC[1] - RR;
      prop(s, 'stool', sx, 0, sz, 0, { h: 0.62, wood: '#3a2a20' }, { level: 0, noSpots: true });
      s.spot('counter', sx, 0.62, sz, 0, { tags: ['court', 'blockcourt', 'speaker'], who: 'halima' });
      prop(s, 'table', sx + 0.75, 0, sz - 0.1, 0, { w: 0.6, d: 0.45, h: 0.72, wood: '#5a3d28' }, { level: 0 });
      g.mat('paper', '#efe6d2'); g.box(sx + 0.6, 0.72, sz - 0.25, sx + 0.84, 0.735, sz - 0.0); g.mat('brushed', '#9a9488'); g.cyl(sx + 0.95, 0.72, sz - 0.15, 0.05, 0.03, { segs: 10 }); s.flush({ tier: 'd', level: 0 });
      prop(s, 'cup', sx + 0.95, 0.75, sz + 0.05, 0, { glaze: '#2f6f8f' }, { level: 0 });
      // the court board on its frame, facing the ring; this week's matters pinned round it
      const bz = sz - 1.15;
      g.mat('wood', '#4a3426'); for (const ox of [-1.25, 1.25]) g.box(sx + ox - 0.05, 0, bz - 0.05, sx + ox + 0.05, 2.6, bz + 0.05, { bevel: 0.01 });
      g.mat('wood', '#4a3426'); g.box(sx - 1.4, 2.6, bz - 0.25, sx + 1.4, 2.66, bz + 0.25, { bevel: 0.01 });
      g.mat('felt', '#8a6a4a'); g.box(sx - 1.2, 0.95, bz - 0.03, sx + 1.2, 2.5, bz + 0.0, { faces: 'zZ' });
      s.flush({ tier: 's', cast: true, level: 0 });
      s.solid(sx - 1.3, 0, bz - 0.06, sx + 1.3, 2.6, bz + 0.06);
      sign(s, SIGNS['court.notices'], sx - 0.25, 1.75, bz + 0.005, { face: 'Z', w: 1.25, h: 0.86, level: 0 });
      sign(s, SIGNS['court.leave'], sx + 0.72, 2.05, bz + 0.005, { face: 'Z', level: 0 });
      sign(s, SIGNS['court.noise'], sx + 0.72, 1.35, bz + 0.005, { face: 'Z', w: 0.28, h: 0.36, level: 0 });
      sign(s, SIGNS['court.heat'], sx + 1.02, 1.7, bz + 0.005, { face: 'Z', w: 0.24, h: 0.32, level: 0 });
      sign(s, SIGNS['court.swap'], sx - 1.02, 1.95, bz + 0.005, { face: 'Z', w: 0.24, h: 0.36, level: 0 });
      sign(s, SIGNS['court.rooms'], sx - 1.02, 1.32, bz + 0.005, { face: 'Z', w: 0.24, h: 0.34, level: 0 });
      sign(s, { kind: 'label', text: 'THE BLOCK COURT', lines: ['sits here · all welcome · out loud'] }, sx, 2.42, bz + 0.005, { face: 'Z', w: 1.6, h: 0.14, level: 0 });
      // the back of the frame faces the stair: festival posters
      g.mat('wood', '#5a3d28'); g.box(sx - 1.2, 0.95, bz - 0.05, sx + 1.2, 2.5, bz - 0.03, { faces: 'z' }); s.flush({ tier: 's', level: 0 });
      ['poster.quiet', 'poster.sun', 'poster.fund'].forEach((id, i) => { if (SIGNS[id]) sign(s, SIGNS[id], sx - 0.75 + i * 0.75, 1.62, bz - 0.055, { face: 'z', w: 0.56, h: 0.8, level: 0 }); });
      s.interact({ x: sx - 0.25, y: 1.7, z: bz + 0.3, radius: 1.6, prompt: "Read this week's matters", onUse: async (gm) => {
        if (!gm.ui) return; gm.busy++;
        try { await gm.ui.say('Block court this week', ['Noise: flute practice after ten. The Long Pipe asks for felt; Mags has offered to hang it.', 'Heat: deck 20, spinward end, runs warm. A pump is coming.', 'Rooms: 18 · 3 and 21 · 6 wish to swap. Both agreed. The stairs did not get a vote.', 'Hollow: Candlewick gives Hassock our turn on the ninth, for the eleventh, with the lake.', 'Leave: Nell and Arturo Okonjo.', 'The Quiet, 19:00, here.']); } finally { gm.busy--; }
        found(gm, 'block-court');
      } });
      s.interact({ x: sx + 0.72, y: 2.0, z: bz + 0.3, radius: 1.2, priority: 0.2, prompt: 'Read the notice asking leave', onUse: async (gm) => {
        if (!gm.ui) return; gm.busy++;
        try { await gm.ui.say('Asking leave', ["Nell and Arturo Okonjo ask the block's leave for a third.", 'The court will hear it aloud. Come if you know them.']); } finally { gm.busy--; }
        found(gm, 'blocks-leave');
      } });
      s.interact({ x: sx, y: 1.2, z: sz + 0.2, radius: 1.3, kind: 'talk', prompt: 'Ask the speaker how the court works', onUse: async (gm) => {
        await sayAs(gm, 'halima', ["We meet once a week, here, out loud. Noise, heat, rooms, Hollow swaps. Most of it takes a minute.", "A third child takes longer. A block this size has room for about one a year, and the court gives it to someone who asked.", "Say yes too often and the Ledger shows it. Then we answer with what we have: our weight in the Hollow draw, our couples' turn in the flat lottery, our place on the Long Flight.", 'Mild things. They work because everyone can see them.']);
        found(gm, 'mild-sanctions');
      } });
      // a standard lamp for the evening sittings, and a rug where the speaker stands
      lamp(s, 'pole', RC[0] + RR + 0.9, 0, RC[1] - 1.6, { h: 2.6, clip: CLIPF, K: 2700, power: 0.9, level: 0 });
      prop(s, 'rug', RC[0], 0, RC[1], 0.12, { w: 3.4, d: 2.6, a: '#7a2f3a', b: '#e8c25a' }, { level: 0 });
      for (let i = 0; i < 4; i++) { const a = i * 1.7; s.spot('chat', RC[0] + 4.6 + Math.cos(a) * 0.65, 0, RC[1] - 0.4 + Math.sin(a) * 0.65, fy(-Math.cos(a), -Math.sin(a)), { tags: ['court', 'chat'] }); }
    }

    // ---------------------------------------------------------------- the notice pillar, in line with Thread Street
    {
      const PX = -3.4, PZ = 11.8, R = 0.85;
      const oct = (rad) => { const p = []; for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; p.push([PX + Math.cos(a) * rad, PZ + Math.sin(a) * rad]); } return p; };
      g.mat('stone', '#a99a82'); g.prism(oct(R + 0.12), 0, 0.5);
      g.mat('paint', '#2f4a44'); g.prism(oct(R), 0.5, 2.9);
      g.mat('paint', '#b08a45'); g.prism(oct(R + 0.06), 2.9, 3.0);
      g.mat('paint', '#2f4a44'); g.prism(oct(R + 0.16), 3.0, 3.14);
      s.flush({ tier: 's', cast: true, level: 0 });
      g.mat('panel', '#2b6b69'); g.lathe(PX, PZ, [[R + 0.1, 3.14], [R * 0.85, 3.4], [R * 0.45, 3.62], [0.12, 3.72], [0, 3.74]], { segs: 8 });
      g.mat('cast', '#b08a45'); g.lathe(PX, PZ, [[0.12, 3.72], [0.06, 3.85], [0.09, 3.95], [0, 4.2]], { segs: 8 });
      s.flush({ tier: 's', cast: true, level: 0 });
      s.post(PX, PZ, R + 0.12, 0, 3.2);
      const ap = R * Math.cos(Math.PI / 8) + 0.004;
      const lower = ['poster.booking', 'poster.feast', 'poster.flight', 'poster.dawn', 'poster.sun', 'poster.fund', 'poster.choir', 'poster.reels'];
      const upper = ['poster.quiet', 'poster.knotnight', 'poster.homecoming', 'poster.flight'];
      lower.forEach((id, k) => { const a = k * Math.PI / 4; if (SIGNS[id]) flatSign(s, SIGNS[id], PX + Math.cos(a) * ap, 1.42, PZ + Math.sin(a) * ap, fy(Math.cos(a), Math.sin(a)), 0.6, 0.86, { level: 0 }); });
      upper.forEach((id, k) => { const a = (2 * k + 1) * Math.PI / 4; if (SIGNS[id]) flatSign(s, SIGNS[id], PX + Math.cos(a) * ap, 2.38, PZ + Math.sin(a) * ap, fy(Math.cos(a), Math.sin(a)), 0.38, 0.54, { level: 0 }); });
      // a ring of lamps under the cap
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; g.mat('diffuser', '#ffe2a8', { emissive: 5, lamp: true }); g.ball(PX + Math.cos(a) * (R + 0.22), 3.0, PZ + Math.sin(a) * (R + 0.22), 0.07, 0.09, 0.07, { segs: 8, rings: 6 }); }
      s.flush({ tier: 'd', cast: false, level: 0 });
      s.light({ at: [PX, 3.0, PZ], color: '#ffd9a0', power: 2.6, range: 6, lamp: true, clip: CLIPF });
      s.interact({ x: PX, y: 1.5, z: PZ, radius: 1.9, wide: true, prompt: 'Read the festival posters', onUse: async (gm) => {
        if (!gm.ui) return; gm.busy++;
        try { await gm.ui.say('Pasted on the pillar', SIGNS['ledger.programme'] ? ['Booking Day.'].concat(SIGNS['ledger.programme'].lines) : ['Booking Day.']); } finally { gm.busy--; }
      } });
    }

    // ---------------------------------------------------------------- the drinking fountain
    prop(s, 'court.fountain', -3.4, 0, -6.4, Math.PI / 2, {}, { level: 0 });
    s.spot('stand', -2.6, 0, -6.4, fy(-1, 0), { tags: ['court', 'drink'] });
    s.interact({ x: -3.4, y: 1.0, z: -6.4, radius: 1.3, prompt: 'Have a drink of water', onUse: (gm) => { gm.sfxAt('sip', f, -3.4, 1, -6.4); if (gm.ui) gm.ui.toast('Cool, and free, like the air.', { kind: 'info' }); } });

    // ---------------------------------------------------------------- tables spilling out from the hall
    {
      const laid = (x, z, w, d, k) => {
        const r = new Rng('laid' + x + z);
        const n = Math.max(2, Math.round(w * d * 4));
        for (let i = 0; i < n; i++) {
          const px = x + r.f(-w / 2 + 0.15, w / 2 - 0.15), pz = z + r.f(-d / 2 + 0.12, d / 2 - 0.12), c = r.next();
          if (c < 0.45) prop(s, 'cup', px, 0.74, pz, 0, { glaze: r.pick(['#d9cfb8', '#2f6f8f', '#c9552e', '#e9c46a', '#6b8f4e']) }, { level: 0 });
          else if (c < 0.75) prop(s, 'bowl', px, 0.74, pz, 0, { glaze: r.pick(['#e9e1cf', '#a3563a', '#3d6f8a']), lid: r.pick(['#e9e1cf', '#2b3a4a', '#c9a45c']) }, { level: 0 });
          else prop(s, 'plate', px, 0.74, pz, 0, {}, { level: 0 });
        }
        if (k) prop(s, 'plant', x, 0.74, z, 0, { kind: 'flower', size: 0.32, pot: '#e9e1cf', seed: k }, { level: 0, noCollide: true });
      };
      const woods = ['#6b4a2f', '#7a5233', '#8a6240', '#5a3d28'], seatsC = ['#c9552e', '#d9c08a', '#2f6f8f', '#8a2f3c', '#6b8f4e', '#e9c46a'];
      let ci = 0;
      const chair = (x, z, yaw) => { prop(s, 'court.chair', x, 0, z, yaw, { wood: woods[ci % 4], seat: seatsC[ci % 6], back: ci % 4 === 2 ? 'slat' : 'hoop' }, { level: 0, spot: { tags: ['court', 'table', 'eat'] } }); ci++; };
      for (const t of [[-24.2, -10.6], [-10.0, -10.6], [10.0, -10.6], [24.2, -10.6]]) {
        const [x, z] = t, w = 2.8, d = 0.86;
        prop(s, 'table', x, 0, z, 0, { w, d, legs: 'trestle', wood: '#6f4e33', top: '#8a6240' }, { level: 0 });
        g.mat('motif', t[0] < 0 ? '#8a2f3c' : '#2f4f6f'); g.box(x - w / 2 + 0.05, 0.74, z - 0.2, x + w / 2 - 0.05, 0.746, z + 0.2, { faces: 'YzZ' }); s.flush({ tier: 'd', level: 0 });
        for (const ox of [-0.9, 0, 0.9]) { chair(x + ox, z - 0.72, 0); chair(x + ox, z + 0.72, Math.PI); }
        laid(x, z, w, d, ci);
      }
      for (const t of [[-12.4, -12.6], [-3.6, -11.0], [3.8, -11.4], [12.4, -12.6], [-22.8, -6.2], [22.8, -6.2], [-11.0, -6.6], [11.2, -6.4]]) {
        const [x, z] = t; prop(s, 'table', x, 0, z, 0, { round: true, w: 0.82, wood: '#5a3d28', top: '#7a5233' }, { level: 0 });
        const n = 3 + ((x * 7) & 1); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.4; chair(x + Math.cos(a) * 0.72, z + Math.sin(a) * 0.72, fy(-Math.cos(a), -Math.sin(a))); }
        laid(x, z, 0.5, 0.5, 0);
      }
      // a few groups talking by the tables
      const group = (x, z, n, tags) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + x; s.spot('chat', x + Math.cos(a) * 0.7, 0, z + Math.sin(a) * 0.7, fy(-Math.cos(a), -Math.sin(a)), { tags }); } };
      group(-6.8, -9.2, 3, ['court', 'chat']); group(6.5, -8.0, 4, ['court', 'chat']); group(-20.6, -2.6, 2, ['court', 'chat']);
      group(20.8, 2.4, 3, ['court', 'chat']); group(-2.8, 9.4, 2, ['court', 'chat']); group(12.4, 1.8, 5, ['court', 'chat', 'evening']);
      group(-17.5, 5.6, 3, ['court', 'chat']); group(24.8, 15.8, 2, ['court', 'chat']);
      // the stand-alone spots: people waiting, looking up, leaning on the piers
      for (const p of [[0, 4.8, 0], [2.2, -2.6, 2.0], [-4.6, 2.2, -1.2], [26.6, -2.4, -1.57], [-26.6, 2.6, 1.57], [-1.6, 17.2, 3.0], [4.6, 18.6, 3.1], [14.6, -4.8, 0.4]]) s.spot('stand', p[0], 0, p[1], p[2], { tags: ['court', 'look'] });
    }

    // ---------------------------------------------------------------- children's chalk games
    {
      const cz0 = 13.6, cx0 = 3.6;
      g.mat('plain', '#f2e9da', { rough: 0.3 });
      // hopscotch: one, two-and-three, four, five-and-six, seven, eight-and-nine, then home
      const sq = (x, z, col) => { g.mat('plain', col, { rough: 0.3 }); for (const e of [[x, z, x + 0.5, z + 0.035], [x, z + 0.465, x + 0.5, z + 0.5], [x, z, x + 0.035, z + 0.5], [x + 0.465, z, x + 0.5, z + 0.5]]) g.box(e[0], 0, e[1], e[2], 0.006, e[3], { faces: 'Y' }); };
      const hop = [[0.25, 0], [0, 0.5], [0.5, 0.5], [0.25, 1.0], [0, 1.5], [0.5, 1.5], [0.25, 2.0], [0, 2.5], [0.5, 2.5]];
      hop.forEach((h, i) => sq(cx0 + h[0], cz0 + h[1], ['#f2e9da', '#f4c6cf', '#f6e3a2', '#bfe0e6'][i % 4]));
      g.mat('plain', '#f4c6cf', { rough: 0.3 }); for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI, b = (k + 1) / 24 * Math.PI; g.box(cx0 + 0.5 + Math.cos(a) * 0.5 - 0.02, 0, cz0 + 3.0 + Math.sin(a) * 0.45 - 0.02, cx0 + 0.5 + Math.cos(b) * 0.5 + 0.02, 0.006, cz0 + 3.0 + Math.sin(b) * 0.45 + 0.02, { faces: 'Y' }); }
      // a ring for marbles and a spiral
      g.mat('plain', '#bfe0e6', { rough: 0.3 }); for (let k = 0; k < 32; k++) { const a = k / 32 * Math.PI * 2; g.cyl(cx0 + 3.2 + Math.cos(a) * 1.0, 0, cz0 + 1.2 + Math.sin(a) * 1.0, 0.03, 0.006, { segs: 4 }); }
      g.mat('plain', '#f6e3a2', { rough: 0.3 }); for (let k = 0; k < 60; k++) { const a = k * 0.32, rad = 0.06 + k * 0.012; g.cyl(cx0 + 5.4 + Math.cos(a) * rad, 0, cz0 + 2.7 + Math.sin(a) * rad, 0.025, 0.006, { segs: 4 }); }
      s.flush({ tier: 'd', cast: false, level: 0 });
      floorText(s, { kind: 'letters', text: 'axis flies true', palette: ['#f4c6cf'] }, cx0 + 3.0, 0.008, cz0 + 3.6, 0, -1, 1.7, 0.32, { tier: 'd' });
      floorText(s, { kind: 'letters', text: 'spin sinks · anti floats', palette: ['#bfe0e6'] }, cx0 + 3.6, 0.008, cz0 + 4.1, 0, -1, 2.0, 0.28, { tier: 'd' });
      // chalk stubs, a ball, a marble or two
      g.mat('plain', '#f4c6cf'); g.cyl(cx0 + 1.4, 0, cz0 + 0.2, 0.012, 0.012, { segs: 6 }); g.mat('plain', '#f6e3a2'); g.cyl(cx0 + 1.5, 0, cz0 + 0.3, 0.012, 0.012, { segs: 6 });
      g.mat('leather', '#c9552e'); g.ball(cx0 + 2.4, 0.11, cz0 + 3.3, 0.11, 0.11, 0.11, { segs: 12, rings: 8 });
      g.mat('glaze', '#2f6f8f'); g.ball(cx0 + 3.3, 0.012, cz0 + 1.1, 0.012, 0.012, 0.012, { segs: 6, rings: 4 }); g.mat('glaze', '#e9c46a'); g.ball(cx0 + 3.0, 0.012, cz0 + 1.4, 0.012, 0.012, 0.012, { segs: 6, rings: 4 });
      s.flush({ tier: 'd', level: 0 });
      for (const p of [[cx0 + 0.25, cz0 + 0.8, 0], [cx0 + 0.6, cz0 - 0.4, 0], [cx0 + 2.4, cz0 + 1.2, 1.57], [cx0 + 4.0, cz0 + 1.0, -1.57], [cx0 + 3.2, cz0 + 2.0, 3.1], [cx0 + 5.4, cz0 + 2.0, 0.2]]) s.spot('play', p[0], 0, p[1], p[2], { tags: ['court', 'kids'] });
    }

    // ---------------------------------------------------------------- a handcart of crates for the feast
    {
      const hx = 14.6, hz = -12.6, hy = 0.3;
      prop(s, 'court.handcart', hx, 0, hz, hy, {}, { level: 0 });
      const c = Math.cos(hy), sn = Math.sin(hy), at = (lx, lz) => [hx + c * lx + sn * lz, hz - sn * lx + c * lz];
      for (const cr of [[-0.45, -0.2, 0.52, 0], [0.25, -0.18, 0.52, 0], [-0.4, 0.22, 0.52, 0], [0.3, 0.24, 0.52, 0], [-0.1, 0.0, 0.94, 0.3]]) { const p = at(cr[0], cr[1]); prop(s, 'crate', p[0], cr[2], p[1], hy + cr[3], { w: 0.6, h: 0.4, d: 0.4, wood: '#b08d5e' }, { level: 0, noCollide: true }); }
      // apples in the top crate, counted
      g.mat('glaze', '#b5653a', { rough: -0.2 }); for (let i = 0; i < 6; i++) { const p = at(-0.1 + (i % 3 - 1) * 0.15, (i < 3 ? -0.07 : 0.07)); g.ball(p[0], 1.33, p[1], 0.05, 0.048, 0.05, { segs: 8, rings: 6 }); } s.flush({ tier: 'd', level: 0 });
      const lp = at(0.25, -0.39); sign(s, { kind: 'label', text: 'FOR THE FEAST', lines: ['hall · counted · lids on'], ink: '#3a2a20' }, lp[0], 0.85, lp[1] - 0.01, { face: 'z', w: 0.55, h: 0.15, level: 0 });
      s.spot('work', hx - 1.8, 0, hz + 0.3, fy(1, -0.2), { tags: ['court', 'carry', 'feast'] });
    }

    // ---------------------------------------------------------------- street lamps round the floor, for the evenings
    for (const p of [[-14.5, -4.6], [14.5, -4.6], [-14.5, 4.6], [14.5, 4.6], [-3.4, 15.0], [24.6, 7.2], [-24.6, -1.0]]) lamp(s, 'pole', p[0], 0, p[1], { h: 3.3, clip: CLIPF, K: 3000, power: 1.0, range: 10, level: 0 });

    // ---------------------------------------------------------------- lanterns and bunting across the void
    {
      const LS = (a, b, o) => lanternString(s, a, b, Object.assign({ clip: CLIP }, o));
      // deck 17: north to south, the hall's top at one end
      [-16, -5.5, 5.5, 16].forEach((x, i) => LS([x, 6.6, Z0 + 0.15], [x + (i % 2 ? 1.5 : -1.5), 6.9, Z1 - 0.15], { seed: i, sag: 1.4 }));
      // deck 18: spinward across
      [-8, 0.5, 9].forEach((z, i) => LS([X0 + 0.15, 10.8, z], [X1 - 0.15, 10.8, z + (i - 1) * 2], { seed: i + 4, sag: 2.0, lights: 2 }));
      // deck 19: the two long diagonals and one down the middle
      LS([X0 + 0.3, 14.9, Z0 + 0.3], [X1 - 0.3, 14.9, Z1 - 0.3], { seed: 7, sag: 2.4, lights: 2 });
      LS([X0 + 0.3, 14.9, Z1 - 0.3], [X1 - 0.3, 14.9, Z0 + 0.3], { seed: 9, sag: 2.4, lights: 2 });
      LS([0, 14.6, Z0 + 0.15], [0, 14.6, Z1 - 0.15], { seed: 11, sag: 1.6 });
      // deck 20: a zigzag between the long sides
      const zx = [-26, -15, -4, 7, 18, 27];
      for (let i = 0; i < zx.length - 1; i++) LS([zx[i], 18.8, i % 2 ? Z1 - 0.15 : Z0 + 0.15], [zx[i + 1], 18.8, i % 2 ? Z0 + 0.15 : Z1 - 0.15], { seed: 13 + i, sag: 1.5, lights: i % 2 });
      // deck 21: close under the ceiling, spinward across
      [-6, 6].forEach((z, i) => LS([X0 + 0.15, 22.3, z], [X1 - 0.15, 22.3, z], { seed: 21 + i, sag: 0.9, glow: 3, lights: 0 }));
      // bunting low over the floor: from the trees to the piers, and across the bandstand
      const BC = ['#c9552e', '#e7b547', '#2f6f73', '#e9e2d0', '#8a2f3c', '#6b8f4e', '#d0687a'];
      const bun = (a, b) => bunting(s, a, b, { colors: BC, level: lvOf(Math.min(a[1], b[1])) });
      bun([-17, 7.4, -8.5], [-28, 5.6, -9.2]); bun([-17, 7.4, -8.5], [-6.5, 6.6, 6.5]); bun([17, 7.2, -8.5], [28, 5.6, -9.2]); bun([17, 7.2, -8.5], [7.2, 6.6, 6.3]);
      bun([-6.5, 6.6, 6.5], [7.2, 6.6, 6.3]); bun([BX, 4.9, BZ], [28, 5.4, 12.2]); bun([BX, 4.9, BZ], [17.3, 5.6, 20]); bun([BX, 4.9, BZ], [7.2, 6.4, 6.3]);
      bun([-6.5, 6.4, 6.5], [-17.3, 5.6, 20]); bun([-6.5, 6.4, 6.5], [-3.25, 5.4, 20]); bun([7.2, 6.4, 6.3], [3.25, 5.4, 20]);
      bun([-17, 7.6, -8.5], [-7, 7.0, -14]); bun([17, 7.6, -8.5], [7, 7.0, -14]);
    }

    // ---------------------------------------------------------------- people's walkways
    s.path([[-28, 0, 0], [-20, 0, 0], [-4.6, 0, 0], [0, 0, -4.6], [4.6, 0, 0], [0, 0, 4.6], [-4.6, 0, 0]], { width: 2.4 });
    s.path([[4.6, 0, 0], [20, 0, 0], [28, 0, 0]], { width: 2.4 });
    s.path([[0, 0, 20], [0, 0, 16.6], [-1.6, 0, 14.2], [0, 0, 9.5], [0, 0, 4.6]], { width: 2.0 });
    s.path([[0, 0, 16.6], [2.6, 0, 14.4], [0, 0, 9.5]], { width: 1.6 });
    s.path([[0, 0, -4.6], [0, 0, -11], [0, 0, -14]], { width: 2.0 });
    s.path([[-7, 0, -14], [-7, 0, -11], [-7, 0, -8.4], [-4.6, 0, -4.4], [-4.6, 0, 0]], { width: 1.6 });
    s.path([[7, 0, -14], [7, 0, -11], [7, 0, -8.4], [4.6, 0, -4.4], [4.6, 0, 0]], { width: 1.6 });
    s.path([[-21, 0, -14], [-21, 0, -11], [-20.6, 0, -8.0], [-20, 0, 0]], { width: 1.6 });
    s.path([[21, 0, -14], [21, 0, -11], [20.6, 0, -8.0], [20, 0, 0]], { width: 1.6 });
    for (const sx of [-1, 1]) s.path([[sx * 14, 0, -14], [sx * 14, 0, -11], [sx * 13.4, 0, -6.0], [sx * 12.4, 0, -2.6], [sx * 4.6, 0, 0]], { width: 1.6 });
    s.path([[-20, 0, 0], [-19.8, 0, 6.6], [-16.0, 0, 10.0], [-16.4, 0, 16.4], [-10.2, 0, 18.4], [-1.6, 0, 18.4], [0, 0, 20]], { width: 1.6 });
    s.path([[-19.8, 0, 6.6], [-27.2, 0, 10.5]], { width: 1.6 });
    s.path([[-16.0, 0, 10.0], [-11.5, 0, 7.6], [-4.6, 0, 3.0], [-4.6, 0, 0]], { width: 1.6 });
    s.path([[20, 0, 0], [10.4, 0, 5.4], [10.6, 0, 10.4], [9.0, 0, 17.4], [1.6, 0, 18.4], [0, 0, 20]], { width: 1.6 });
    s.path([[20, 0, 0], [23.4, 0, 6.0], [24.0, 0, 14.6], [17.6, 0, 18.0], [9.0, 0, 17.4]], { width: 1.6 });
    s.path([[24.0, 0, 14.6], [26.4, 0, 18.0]], { width: 1.2 });
    s.path([[23.4, 0, 6.0], [26.6, 0, 10.0]], { width: 1.2 });
    s.path([[-10.2, 0, 18.4], [-10.2, 0, 20]], { width: 1.4 });
    s.path([[9.0, 0, 17.4], [10.0, 0, 20]], { width: 1.4 });

    // ---------------------------------------------------------------- the zone, sound and the things to find
    skyZones.push(s.zoneBox({ id: 'court', place: 'court', box: [X0, -0.5, Z0, X1, TOP, Z1], name: 'Wick Court', sub: 'Candlewick', ambience: 'court', reverb: 'hall', env: { exposure: 0.82, bloom: 0.07, warmth: 0.2 }, headroom: 22, sky: true, skyTop: 23 }));
    const snd = { started: false };
    game.events.on('zone', (e) => {
      const z = e && e.zone; if (!z || snd.started || !game.audio) return;
      if (z.place !== 'court' && z.place !== 'teacart' && z.place !== 'terraces') return;
      snd.started = true;
      snd.fountain = game.loopAt('fountain', f, -3.4, 0.9, -6.4, { vol: 0.25, radius: 7 });
      snd.kids = game.loopAt('kids', f, 6.4, 1.0, 15.0, { vol: 0.35, radius: 16 });
      snd.murmur = game.loopAt('murmur', f, 0, 1.4, -9.5, { vol: 0.5, radius: 30, param: 0.6 });
    });
    // the ceiling: stand on the floor and look up for a few seconds
    const look = { t: 0, done: false, scope: s, update(dt) {
      if (this.done) return; const gm = s.world.game; if (!gm || !gm.player || gm.player.frame !== f) return;
      const p = gm.player.pos;
      if (p.y < 1 && p.x > X0 && p.x < X1 && p.z > Z0 && p.z < Z1 && gm.player.pitch > 0.75) { this.t += dt; if (this.t > 2.2) { this.done = true; if (gm.journal && gm.journal.find) gm.journal.find('court-ceiling'); else if (gm.ui) gm.ui.card({ kicker: 'Wick Court', title: 'A ceiling that tries colours', text: 'Lamp-painters test their colours up there. The light in the court is never quite the same twice.', dur: 6 }); } }
      else this.t = Math.max(0, this.t - dt * 2);
    } };
    W.dynamics.push(look);

    s.finish();

    // ================================================================ the tea cart (its own place)
    {
      const t = W.scope('teacart', f), tg = t.g;
      const CX = -18.2, CZ = 11.8, YAW = Math.PI / 2;     // the cart's front faces spinward, into the court
      prop(t, 'court.teacart', CX, 0, CZ, YAW, { stripes: ['#c9552e', '#f1e6cf'] }, { level: 0 });
      // the awning's fascia and the hanging sign
      sign(t, SIGNS['teacart.fascia'], CX + 1.34, 2.04, CZ, { face: 'X', w: 1.9, h: 0.24, board: false, level: 0 });
      sign(t, SIGNS['teacart.hanging'], CX + 1.3, 1.62, CZ + 1.18, { face: 'X', double: true, w: 0.42, h: 0.42, level: 0 });
      tg.mat('cast', '#2a2a28'); tg.tube([[CX + 1.3, 2.13, CZ + 1.18], [CX + 1.3, 1.84, CZ + 1.18]], 0.006, { segs: 4 }); t.flush({ tier: 'd', level: 0 });
      // the chalkboard on an A-frame
      const bx = CX + 2.0, bz = CZ - 1.5;
      sign(t, SIGNS['teacart.chalk'], bx, 0.78, bz, { face: 'X', level: 0 });
      tg.mat('wood', '#4a3426'); tg.tube([[bx - 0.05, 0, bz - 0.32], [bx - 0.05, 1.24, bz]], 0.018, { segs: 5 }); tg.tube([[bx - 0.05, 0, bz + 0.32], [bx - 0.05, 1.24, bz]], 0.018, { segs: 5 }); tg.tube([[bx - 0.55, 0, bz], [bx - 0.06, 1.2, bz]], 0.018, { segs: 5 }); t.flush({ tier: 'd', level: 0 });
      t.solid(bx - 0.6, 0, bz - 0.35, bx + 0.02, 1.2, bz + 0.35);
      // a crate of lent cups waiting to go back, a bin for the returns
      prop(t, 'crate', CX - 0.4, 0, CZ - 1.55, 0.2, { w: 0.5, h: 0.32, d: 0.36 }, { level: 0 });
      tg.mat('glaze', '#e7dcc4'); for (let i = 0; i < 6; i++) tg.lathe(CX - 0.55 + (i % 3) * 0.12, CZ - 1.6 + Math.floor(i / 3) * 0.12, [[0.026, 0.33], [0.04, 0.4], [0.036, 0.4]], { segs: 8, capBottom: false, capTop: false }); t.flush({ tier: 'd', level: 0 });
      sign(t, { kind: 'label', text: 'CUPS BACK HERE', lines: ['any cart · any time'] }, CX - 0.4, 0.45, CZ - 1.33, { face: 'Z', w: 0.42, h: 0.1, level: 0 });
      // two little tables with stools
      for (const p of [[CX + 1.6, CZ + 3.4], [CX - 0.2, CZ - 3.6], [CX + 2.6, CZ - 4.2]]) {
        prop(t, 'table', p[0], 0, p[1], 0, { round: true, w: 0.6, h: 0.74, wood: '#3a2a20', top: '#2b6b69' }, { level: 0 });
        for (let i = 0; i < 2; i++) { const a = i * Math.PI + p[0]; prop(t, 'stool', p[0] + Math.cos(a) * 0.55, 0, p[1] + Math.sin(a) * 0.55, 0, { wood: '#7a5a3a' }, { level: 0, spot: { tags: ['teacart', 'tea'] } }); }
        prop(t, 'cup', p[0] + 0.1, 0.74, p[1] - 0.05, 0, { glaze: '#c9552e' }, { level: 0 });
        prop(t, 'cup', p[0] - 0.12, 0.74, p[1] + 0.08, 0, { glaze: '#e9c46a' }, { level: 0 });
      }
      // the lamp under the awning
      lamp(t, 'bulb', CX + 0.7, 2.0, CZ, { K: 2600, power: 1.0, range: 6, clip: CLIPF, level: 0 });
      tg.mat('diffuser', '#ffd9a0', { emissive: 6, lamp: true }); tg.ball(CX + 0.7, 2.06, CZ, 0.05, 0.065, 0.05, { segs: 8, rings: 6 }); t.flush({ tier: 'd', cast: false, level: 0 });
      // the queue, curving toward Ladle Row
      for (let i = 0; i < 6; i++) t.spot('queue', CX + 1.15 + i * 0.12, 0, CZ - i * 0.78, fy(-0.3, 1), { tags: ['teacart', 'queue'], order: i });
      t.spot('stand', CX + 1.3, 0, CZ + 1.0, fy(-1, 0), { tags: ['teacart', 'tea', 'chat'] });
      t.spot('stand', CX + 1.9, 0, CZ + 1.6, fy(-1, -0.6), { tags: ['teacart', 'tea', 'chat'] });
      t.spot('stand', CX + 2.4, 0, CZ + 0.9, fy(-1, 0.3), { tags: ['teacart', 'tea', 'chat'] });
      t.path([[CX + 1.6, 0, CZ - 5.4], [CX + 1.2, 0, CZ], [-16.0, 0, 10.0]], { width: 1.4 });
      const ben = 'ben';
      t.interact({ x: CX + 0.75, y: 1.15, z: CZ, radius: 1.7, kind: 'talk', prompt: 'Buy from the tea cart', onUse: async (gm) => {
        if (!gm.ui) return;
        const M = MENUS.teacart; let id = null;
        gm.busy++;
        try { id = await gm.ui.menu({ kicker: 'Wick Court', title: M.title, note: M.note, items: M.items, wallet: gm.wallet.kwh }); } finally { gm.busy--; }
        if (!id) return;
        const it = M.items.find((i) => i.id === id); if (!it) return;
        if (it.price > 0 && !gm.wallet.spend(it.price, it.name)) { await sayAs(gm, ben, ['Short today. Have it anyway, and bring the cup back.']); }
        if (id === 'cup') {
          gm.flags = gm.flags || {};
          if (!gm.flags['item:lidded-cup']) { gm.flags['item:lidded-cup'] = true; if (gm.inv && gm.inv.give && !gm.inv.has('lidded-cup')) gm.inv.give('lidded-cup', 1, true); if (gm.ui) gm.ui.toast('Lidded cup', { kind: 'gain' }); }
          await sayAs(gm, ben, ['Lent, not sold. Any cart in Candlewick will take it back.']);
          return;
        }
        gm.sfxAt('pour', f, CX + 0.4, 1.3, CZ);
        if (id === 'tea') {
          await sayAs(gm, ben, ['Watch the stream, not the cup.', 'There. It lands a little anti of where I aimed. It always does. The tea keeps the speed of the spout, and the cup is going round faster.']);
          found(gm, 'tea-anti');
        } else await sayAs(gm, ben, [id === 'coffee' ? 'Coffee. Lid on, it cools fast in this air.' : id === 'puff' ? 'One puff, warm. Eat it before the air does.' : 'There you are. Lid on till you sit down.']);
        gm.sfxAt('lid-down', f, CX + 0.4, 1.1, CZ);
      } });
      skyZones.push(t.zoneBox({ id: 'teacart', place: 'teacart', box: [CX - 1.4, -0.5, CZ - 5.6, CX + 3.6, 3.0, CZ + 3.4], name: 'The tea cart', sub: 'Wick Court', ambience: 'court', reverb: 'hall', env: { exposure: 0.82, bloom: 0.07, warmth: 0.2 }, headroom: 22, sky: true, skyTop: 23 }));
      t.finish();
      game.spawns.teacart = { frame: f, x: CX + 3.2, y: 0, z: CZ - 0.6, yaw: -Math.PI / 2 - 0.2 };
    }

    game.spawns.court = { frame: f, x: 0, y: 0, z: 18.5, yaw: 0, pitch: 0.05 };
    game.spawns['court-stair'] = { frame: f, x: -27.2, y: 0, z: 11.0, yaw: Math.PI };
  },
};
