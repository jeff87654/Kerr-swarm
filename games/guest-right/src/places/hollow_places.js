// The places people made on the Hollow's floor round the lake pavilion: the pavilion itself (the glass top of
// Candlewick's lift core), the festival green with its long tables and bandstand, the lake shore with the jetty and the
// robe house, the orchard's working corner with its winter tent, the kite field, and the benches, lamps, taps and
// signposts along the walks between them. The ground, trees, lake and sky are hollow_land.js's.
import { floor, lamp, block, stairs, wall } from '../world/kit.js';
import { railing, planter } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { heightAt, landAt, BIOME, LAND, treeInCell, TREE_CELL } from '../world/land.js';
import { SIGNS } from '../content/signs.js';
import { MENUS } from '../content/menus.js';
import { CAST } from '../content/cast.js';
import { Rng, hashStr, shadeHex } from '../core/util.js';
import { FESTIVE, PAL, gy, maxGround, say, toast, found, sfx, buyFrom, lanternString, flags, kite, bareTree, mapBoard, signpost, picnic, onGround } from './hollow_parts.js';

const ENV = { exposure: 1.0, autoKey: 0.19, autoMin: 0.02, autoMax: 5, bloom: 0.045, warmth: 0.05, contrast: 1.1, saturation: 1.12 };
const OPEN = { ambience: 'hollow-day', reverb: 'open', sky: true, skyTop: 40, sun: true, sunPower: 34, far: 2400, headroom: 30 };
let ZONES = [];
const zone = (s, o) => { const z = s.zoneBox(Object.assign({}, OPEN, { env: Object.assign({}, ENV) }, o)); ZONES.push(z); return z; };
const who = (id, fallback) => { const c = CAST[id]; return c ? { name: c.name, colour: '#e2c486' } : { name: fallback || id, colour: '#e2c486' }; };
const card = (game, kicker, title, text) => { if (game.ui && game.ui.card) game.ui.card({ kicker, title, text }); };

// the pavilion stands where the cab sets you down: you step out of its east berth at (0, 1700), facing spinward
const PX = -3.2, PZ = 1700, PY = 0.16;
// the bandstand, the long tables, the jetty, the robe house, the orchard yard, the kite field
const BX = 66, BZ = 1850, BY = 1.05;
const JZ = 1800, J0 = 122, J1 = 170, JY = 0.38, DY = 2.65;
const OX = -366, OZ = 1690;
const KX = -200, KZ = 2115;

const A8 = (i) => Math.PI / 8 + i * Math.PI / 4;                  // octagon vertex angles (flats face the axes)
const octP = (cx, cz, r) => { const o = []; for (let i = 0; i < 8; i++) o.push([cx + Math.cos(A8(i)) * r, cz + Math.sin(A8(i)) * r]); return o; };
// collision for an octagonal plinth (vertex radius r): three overlapping boxes
function octSolid(s, cx, cz, r, y0, y1, surf) {
  const a = r * Math.cos(Math.PI / 8), b = a * Math.tan(Math.PI / 8), c = a * 0.70;
  s.solid(cx - a, y0, cz - b, cx + a, y1, cz + b, { surf }); s.solid(cx - b, y0, cz - a, cx + b, y1, cz + a, { surf }); s.solid(cx - c, y0, cz - c, cx + c, y1, cz + c, { surf });
}
// a flat ring band (r0 < r1) of an octagon at height y, facing up
function octBand(g, cx, cz, r0, r1, y) {
  const A = octP(cx, cz, r1), B = octP(cx, cz, r0);
  for (let i = 0; i < 8; i++) { const j = (i + 1) % 8; g.quad([A[i][0], y, A[i][1]], [B[i][0], y, B[i][1]], [B[j][0], y, B[j][1]], [A[j][0], y, A[j][1]]); }
}
// draw in a local frame placed at (x, y, z) turned by yaw; front toward +z
const atYaw = (g, x, y, z, yaw, fn) => { g.at(x, y, z, yaw); fn(g); g.pop(); };
const faceOf = (yaw) => { const s = Math.round(Math.sin(yaw)), c = Math.round(Math.cos(yaw)); return s > 0 ? 'X' : s < 0 ? 'x' : c > 0 ? 'Z' : 'z'; };
const rot = (x, z, yaw, lx, lz) => [x + Math.cos(yaw) * lx + Math.sin(yaw) * lz, z - Math.sin(yaw) * lx + Math.cos(yaw) * lz];

export const place = {
  id: 'hollow-places', name: 'The Hollow', order: 45,
  build(game) {
    const f = game.world.frame('hollow', 1500, 0, 0);
    ZONES = [];
    buildPavilion(game, f);
    buildGreen(game, f);
    buildShore(game, f);
    buildOrchard(game, f);
    buildKites(game, f);
    buildFurniture(game, f);
    // my zones follow the land's day, dusk and night beds
    const zs = ZONES.filter((z) => z.ambience && z.ambience.indexOf('hollow') === 0);
    game.events.on('prerender', () => { const lz = game.hollow && game.hollow.zone; if (!lz) return; for (const z of zs) z.ambience = lz.ambience; });
  },
};

// ===================================================================================================================
// 1. The lake pavilion: an octagon of slim iron columns under a glazed lantern roof, round the enamelled top of the
//    lift core with its four berth doors.
// ===================================================================================================================
function buildPavilion(game, f) {
  const s = game.world.scope('hollow-pavilion', f), g = s.g;
  const RC = 7.0;                      // column ring (vertex radius)
  const APRON = 12.5;
  // ---- the apron, its four paved walks, the plinth and the floor
  s.structure(() => {
    g.mat('stone', '#cdbfa6'); g.prism(octP(PX, PZ, APRON), -0.5, 0.05);
    g.mat('stone', '#a99c86'); octBand(g, PX, PZ, APRON - 0.35, APRON, 0.052);
  });
  octSolid(s, PX, PZ, APRON, -0.5, 0.05, 'stone');
  const walks = [[1, 0, 34], [-1, 0, 30], [0, 1, 34], [0, -1, 26]];
  for (const [dx, dz, len] of walks) {
    const a = APRON * 0.92, b = len, w = 1.4;
    const x0 = dx ? PX + dx * a : PX - w, x1 = dx ? PX + dx * b : PX + w, z0 = dz ? PZ + dz * a : PZ - w, z1 = dz ? PZ + dz * b : PZ + w;
    block(s, Math.min(x0, x1), -0.3, Math.min(z0, z1), Math.max(x0, x1), 0.045, Math.max(z0, z1), 'stone', '#c7b9a0', { bevel: 0.01 });
    // dark kerbs along both edges
    if (dx) for (const sz of [-1, 1]) block(s, Math.min(x0, x1), -0.3, PZ + sz * w - (sz > 0 ? 0.14 : 0), Math.max(x0, x1), 0.06, PZ + sz * w + (sz < 0 ? 0.14 : 0), 'stone', '#8f846f', { noCollide: true });
    else for (const sx of [-1, 1]) block(s, PX + sx * w - (sx > 0 ? 0.14 : 0), -0.3, Math.min(z0, z1), PX + sx * w + (sx < 0 ? 0.14 : 0), 0.06, Math.max(z0, z1), 'stone', '#8f846f', { noCollide: true });
  }
  s.structure(() => {
    g.mat('stone', '#b3a68f'); g.prism(octP(PX, PZ, 8.0), -0.3, 0.085);
    g.mat('terrazzo', '#ddd0b6'); g.prism(octP(PX, PZ, 7.55), -0.3, PY);
    // inlay: a teal mosaic band with brass lines, and a brass compass star round the core
    g.mat('mosaic', '#2f6f73'); octBand(g, PX, PZ, 5.0, 5.5, PY + 0.002);
    g.mat('cast', PAL.brass); octBand(g, PX, PZ, 5.56, 5.63, PY + 0.003); octBand(g, PX, PZ, 4.87, 4.94, PY + 0.003);
    g.mat('pattern', '#c48a3a'); octBand(g, PX, PZ, 7.0, 7.45, PY + 0.002);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, L = i % 2 ? 3.7 : 4.6, w = 0.2;
      const t = [PX + Math.cos(a) * L, PZ + Math.sin(a) * L], l = [PX + Math.cos(a - w) * 2.55, PZ + Math.sin(a - w) * 2.55], r = [PX + Math.cos(a + w) * 2.55, PZ + Math.sin(a + w) * 2.55];
      g.mat('cast', i % 2 ? '#8a6d3b' : PAL.brass); g.quad([l[0], PY + 0.004, l[1]], [t[0], PY + 0.004, t[1]], [r[0], PY + 0.004, r[1]], [r[0], PY + 0.004, r[1]], { double: true });
    }
  });
  octSolid(s, PX, PZ, 8.0, -0.3, 0.085, 'stone'); octSolid(s, PX, PZ, 7.55, -0.3, PY, 'tile');

  // ---- the core: an enamelled drum with four berth doors, a lit band and a verdigris cap
  s.furniture(() => {
    g.mat('cast', '#2a3631'); g.lathe(PX, PZ, [[2.44, PY], [2.44, PY + 0.2], [2.3, PY + 0.26], [2.2, PY + 0.27]], { segs: 40 });
    g.mat('panel', PAL.teal); g.lathe(PX, PZ, [[2.2, PY + 0.27], [2.2, 3.05]], { segs: 40, capBottom: false, capTop: false });
    g.mat('cast', PAL.brass); g.lathe(PX, PZ, [[2.2, 3.05], [2.32, 3.12], [2.38, 3.24], [2.3, 3.3], [2.3, 3.36]], { segs: 40, capBottom: false });
    g.mat('cast', '#5f8f7a'); g.lathe(PX, PZ, [[2.3, 3.62], [2.36, 3.66], [2.2, 3.74], [1.9, 3.95], [1.3, 4.16], [0.5, 4.28], [0, 4.3]], { segs: 32 });
    g.mat('cast', PAL.brass); g.lathe(PX, PZ, [[0.12, 4.28], [0.07, 4.4], [0.13, 4.5], [0.09, 4.6], [0, 4.85]], { segs: 10 });
    // brass seams on the enamel, between the doors
    g.mat('cast', '#8a6d3b');
    for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8 + Math.PI / 16; if (Math.abs(((a + Math.PI / 4) % (Math.PI / 2)) - Math.PI / 4) > 0.55) continue; const c = Math.cos(a), sn = Math.sin(a); g.tube([[PX + c * 2.205, PY + 0.27, PZ + sn * 2.205], [PX + c * 2.205, 3.05, PZ + sn * 2.205]], 0.018, { segs: 4 }); }
  });
  s.deco(() => { g.mat('diffuser', '#ffe0b0', { emissive: 2.2, night: true }); g.lathe(PX, PZ, [[2.19, 3.36], [2.19, 3.62]], { segs: 40, capBottom: false, capTop: false }); });
  s.post(PX, PZ, 2.47, PY, 4.4);
  const DOORS = [{ yaw: Math.PI / 2, n: 1 }, { yaw: 0, n: 2 }, { yaw: -Math.PI / 2, n: 3 }, { yaw: Math.PI, n: 4 }];
  for (const d of DOORS) {
    s.furniture(() => atYaw(g, PX, 0, PZ, d.yaw, () => {
      g.mat('paint', PAL.verm, { rough: -0.1 });
      g.box(-0.82, PY, 1.95, -0.6, PY + 2.3, 2.42, { bevel: 0.015 }); g.box(0.6, PY, 1.95, 0.82, PY + 2.3, 2.42, { bevel: 0.015 });
      g.box(-0.82, PY + 2.3, 1.95, 0.82, PY + 2.64, 2.42, { bevel: 0.015 });
      g.mat('cast', PAL.brass); g.box(-0.9, PY + 2.64, 1.95, 0.9, PY + 2.7, 2.5, { bevel: 0.01 }); g.box(-0.6, PY, 2.28, 0.6, PY + 0.008, 2.62);
      g.mat('brushed', '#8c6a3e'); g.box(-0.6, PY + 0.01, 2.3, -0.004, PY + 2.3, 2.34); g.box(0.004, PY + 0.01, 2.3, 0.6, PY + 2.3, 2.34);
      g.mat('cast', PAL.brass); g.box(-0.6, PY + 0.01, 2.34, 0.6, PY + 0.26, 2.345, { faces: 'Z' });
      for (const sx of [-1, 1]) { g.push(); g.move(sx * 0.3, PY + 1.55, 2.346); g.rotX(Math.PI / 2); g.mat('cast', PAL.brass); g.cyl(0, -0.004, 0, 0.15, 0.008, { segs: 16 }); g.mat('plain', '#1f2a2c', { rough: -0.4 }); g.cyl(0, 0.004, 0, 0.12, 0.004, { segs: 16 }); g.pop(); }
    }));
    s.deco(() => atYaw(g, PX, 0, PZ, d.yaw, () => { g.mat('diffuser', '#ffb85a', { emissive: 4, lamp: true }); g.ball(0, PY + 2.82, 2.36, 0.07, 0.05, 0.07, { segs: 10, rings: 5, bottom: 0 }); }));
    const p = rot(PX, PZ, d.yaw, 0, 2.425), q = rot(PX, PZ, d.yaw, 0, 3.0);
    sign(s, d.n === 1 ? SIGNS['lake-pavilion.plate'] : { kind: 'plate', text: 'BERTH ' + d.n, sub: 'Candlewick · one party a cab' }, p[0], PY + 2.47, p[1], { face: faceOf(d.yaw), w: 0.5, h: 0.2 });
    s.light({ at: [q[0], PY + 2.6, q[1]], color: [1, 0.72, 0.4], power: 0.5, range: 4, night: true, radius: 0.08 });
    s.interact({ x: q[0], y: PY + 1.2, z: q[1], radius: 1.3, prompt: 'Call a cab', onUse: (gm) => { if (gm.cab) gm.cab.open('lake-pavilion'); } });
    const w0 = rot(PX, PZ, d.yaw, 1.5, 3.3); s.spot('queue', w0[0], PY, w0[1], d.yaw + Math.PI - 0.4, { tags: ['cab', 'pavilion'] });
  }

  // ---- the iron columns, brackets and the ring beam
  const V = octP(PX, PZ, RC);
  for (let i = 0; i < 8; i++) {
    const [cx, cz] = V[i];
    s.furniture(() => {
      g.mat('cast', PAL.iron);
      g.lathe(cx, cz, [[0.2, PY], [0.2, PY + 0.1], [0.14, PY + 0.17], [0.11, PY + 0.3], [0.085, PY + 0.42], [0.08, 3.2], [0.1, 3.32], [0.16, 3.46], [0.21, 3.6], [0.21, 3.63]], { segs: 12 });
      g.mat('cast', PAL.brass); g.lathe(cx, cz, [[0.09, 1.2], [0.1, 1.24], [0.09, 1.28]], { segs: 12, capBottom: false, capTop: false });
      // brackets curling up to the beam either side
      g.mat('cast', PAL.iron);
      for (const nb of [(i + 7) % 8, (i + 1) % 8]) {
        const dx = V[nb][0] - cx, dz = V[nb][1] - cz, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L; const pts = [];
        for (let k = 0; k <= 6; k++) { const t = k / 6, a = t * Math.PI / 2; pts.push([cx + ux * (1 - Math.cos(a)) * 0.75, 2.9 + Math.sin(a) * 0.72, cz + uz * (1 - Math.cos(a)) * 0.75]); }
        g.tube(pts, 0.022, { segs: 5 });
      }
    });
    s.post(cx, cz, 0.16, PY, 3.6);
  }
  for (let i = 0; i < 8; i++) {
    const a = V[i], b = V[(i + 1) % 8], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ang = Math.atan2(-dz, dx);
    s.furniture(() => {
      g.push(); g.move(mx, 0, mz); g.rotY(ang);
      g.mat('cast', PAL.iron); g.box(-L / 2 - 0.14, 3.62, -0.13, L / 2 + 0.14, 3.92, 0.13, { bevel: 0.015 });
      g.mat('paint', '#eadcc0'); g.box(-L / 2 - 0.1, 3.66, -0.2, L / 2 + 0.1, 3.88, -0.13);
      g.mat('cast', PAL.brass); g.box(-L / 2 - 0.1, 3.75, -0.205, L / 2 + 0.1, 3.78, -0.2, { faces: 'z' });
      g.mat('cast', '#4f7f6c'); g.box(-L / 2 - 0.2, 3.92, -0.36, L / 2 + 0.2, 4.0, -0.12, { bevel: 0.01 });
      g.mat('cast', PAL.brass); for (let k = 0; k < 16; k++) { const x = -L / 2 + 0.17 + k * (L - 0.34) / 15; g.ball(x, 3.58, -0.17, 0.035, 0.06, 0.035, { segs: 6, rings: 4 }); }
      g.pop();
    });
  }
  // ---- the glazed roof: eight sloping panes on iron ribs, up to a glazed lantern with a verdigris cap
  const RO = 7.35, YO = 3.98, RI = 2.55, YI = 5.3, YL = 6.15;
  const O = octP(PX, PZ, RO), I = octP(PX, PZ, RI);
  s.furniture(() => {
    g.mat('cast', PAL.iron);
    for (let i = 0; i < 8; i++) {
      g.tube([[O[i][0], YO, O[i][1]], [I[i][0], YI, I[i][1]]], 0.05, { segs: 6 });
      const j = (i + 1) % 8, mo = [(O[i][0] + O[j][0]) / 2, (O[i][1] + O[j][1]) / 2], mi = [(I[i][0] + I[j][0]) / 2, (I[i][1] + I[j][1]) / 2];
      g.tube([[mo[0], YO, mo[1]], [mi[0], YI, mi[1]]], 0.026, { segs: 4 });
      for (const t of [0.36, 0.7]) { const p0 = [O[i][0] + (I[i][0] - O[i][0]) * t, YO + (YI - YO) * t, O[i][1] + (I[i][1] - O[i][1]) * t], p1 = [O[j][0] + (I[j][0] - O[j][0]) * t, YO + (YI - YO) * t, O[j][1] + (I[j][1] - O[j][1]) * t]; g.tube([p0, p1], 0.022, { segs: 4 }); }
      g.tube([[I[i][0], YI, I[i][1]], [I[j][0], YI, I[j][1]]], 0.055, { segs: 6 });
      g.tube([[I[i][0], YI, I[i][1]], [I[i][0], YL, I[i][1]]], 0.04, { segs: 5 });
      g.tube([[I[i][0], YL, I[i][1]], [I[j][0], YL, I[j][1]]], 0.05, { segs: 5 });
    }
    g.push(); g.move(PX, 0, PZ); g.rotY(Math.PI / 8);
    g.mat('cast', '#5f8f7a'); g.lathe(0, 0, [[RI + 0.3, YL], [RI + 0.25, YL + 0.1], [1.6, YL + 0.5], [0.4, YL + 0.9], [0, YL + 0.95]], { segs: 8 });
    g.mat('cast', PAL.brass); g.lathe(0, 0, [[0.14, YL + 0.92], [0.1, YL + 1.05], [0.17, YL + 1.17], [0.12, YL + 1.28], [0.03, YL + 1.6], [0, YL + 1.65]], { segs: 10 });
    g.pop();
  });
  // the sloping roof is copper gone green on top and cream beneath, between the iron ribs; the lantern above it is glazed
  s.furniture(() => {
    for (let i = 0; i < 8; i++) {
      const j = (i + 1) % 8;
      g.mat('cast', '#6f9c86', { rough: 0.1 }); g.quad([O[i][0], YO + 0.05, O[i][1]], [I[i][0], YI + 0.05, I[i][1]], [I[j][0], YI + 0.05, I[j][1]], [O[j][0], YO + 0.05, O[j][1]]);
      g.mat('paint', '#efe4cc'); g.quad([O[i][0], YO, O[i][1]], [O[j][0], YO, O[j][1]], [I[j][0], YI, I[j][1]], [I[i][0], YI, I[i][1]]);
      // standing seams on the copper
      g.mat('cast', '#4f7f6c'); for (let k = 1; k < 6; k++) { const t = k / 6, p0 = [O[i][0] + (O[j][0] - O[i][0]) * t, O[i][1] + (O[j][1] - O[i][1]) * t], p1 = [I[i][0] + (I[j][0] - I[i][0]) * t, I[i][1] + (I[j][1] - I[i][1]) * t]; g.tube([[p0[0], YO + 0.07, p0[1]], [p1[0], YI + 0.07, p1[1]]], 0.018, { segs: 3, caps: false }); }
    }
  });
  g.mat('plain', '#e4f2ee'); g._col[3] = 30; g._mat[3] = 10;
  for (let i = 0; i < 8; i++) { const j = (i + 1) % 8; g.quad([I[i][0], YI, I[i][1]], [I[j][0], YI, I[j][1]], [I[j][0], YL, I[j][1]], [I[i][0], YL, I[i][1]]); }
  g._col[3] = 255;
  s.flush({ glass: true });
  // the bounce of the sunlit apron under the roof, by day
  s.ambient({ box: [PX - 7.6, PY - 0.2, PZ - 7.6, PX + 7.6, YL, PZ + 7.6], sky: '#fff0d8', ground: '#e8dcc4', power: 0.5, sun: true, soft: 1.5, spec: 0.3 });
  // a great brass lantern hangs from the middle of the roof on a chain, lit at night; four globes hang under the ribs
  s.furniture(() => {
    g.mat('cast', PAL.iron); g.tube([[PX, YL + 0.6, PZ], [PX, 5.25, PZ]], 0.02, { segs: 4 });
    g.mat('cast', PAL.brass); g.lathe(PX, PZ, [[0.0, 4.25], [0.1, 4.27], [0.36, 4.42], [0.4, 4.5], [0.34, 4.52]], { segs: 8 }); g.lathe(PX, PZ, [[0.42, 5.02], [0.48, 5.06], [0.3, 5.18], [0.08, 5.25], [0, 5.26]], { segs: 8 });
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + Math.PI / 8; g.tube([[PX + Math.cos(a) * 0.35, 4.5, PZ + Math.sin(a) * 0.35], [PX + Math.cos(a) * 0.44, 5.03, PZ + Math.sin(a) * 0.44]], 0.014, { segs: 4 }); }
  });
  s.deco(() => { g.mat('diffuser', '#ffe2b0', { emissive: 4, night: true }); g.lathe(PX, PZ, [[0.3, 4.52], [0.4, 4.75], [0.41, 5.0]], { segs: 8, capBottom: false, capTop: false }); g.lathe(PX, PZ, [[0.4, 5.0], [0.38, 4.75], [0.29, 4.53]], { segs: 8, capBottom: false, capTop: false }); });
  s.light({ at: [PX, 4.75, PZ], color: [1, 0.82, 0.6], power: 4, range: 13, night: true, radius: 0.4 });
  for (let i = 0; i < 4; i++) {
    const a = A8(2 * i + 1), r = 4.9, x = PX + Math.cos(a) * r, z = PZ + Math.sin(a) * r, yTop = YO + (YI - YO) * (RO - r) / (RO - RI);
    lamp(s, 'globe', x, 3.05, z, { drop: yTop - 3.05, r: 0.17, K: 2700, power: 0.9, range: 8, night: true });
  }

  // ---- furniture under the roof: benches, the map, this week's turns, a rack of borrowed picnic cloths, pots
  for (const a of [Math.PI / 4, 3 * Math.PI / 4]) prop(s, 'bench', PX + Math.cos(a) * 5.75, PY, PZ + Math.sin(a) * 5.75, Math.PI / 2 - a, { w: 2.2, back: true, wood: '#8a5a33', metal: PAL.iron });
  mapBoard(s, PX + 3.9, PY, PZ - 4.55, 0, { w: 2.1, h: 0.84, foot: 0.82, youX: 0, youZ: 1700 });
  sign(s, { kind: 'plate', text: 'THE HOLLOW', sub: 'all of it · you are the red dot' }, PX + 3.9, PY + 1.88, PZ - 4.5 + 0.035, { face: 'Z', w: 0.9, h: 0.2 });
  s.interact({ x: PX + 3.9, y: 1.3, z: PZ - 3.9, radius: 1.4, prompt: 'Read the map of the Hollow', onUse: (gm) => say(gm, { name: 'The enamel map', colour: '#9fd0c0' }, [
    "The whole floor, unrolled: 9.4 kilometres round and 3.75 long, enamelled in greens. The lake is the blue spinward of the red dot, with its island.",
    "Orchards in the dark green, lawns and meadows in the pale. The woods go dim near both end walls, and the walls themselves are the grey bands top and bottom.",
    "Somebody has scratched a tiny kite into the enamel just anti of the dot, and somebody else has tried to polish it out.",
  ]) });
  // this week's turns
  boardOnLegs(s, PX - 2.1, PZ - 5.55, 0, 1.7, 1.15, { kind: 'board', title: 'The Hollow this week', lines: ['Thursday · by lottery|Rings Two to Four', 'Morning turn|decks 16 to 60', 'Afternoon turn|decks 61 to 120', 'The Quiet|open to all', 'Booking Day|open to all · the festival', 'Changeover|on the hour, a quarter for it'], palette: ['#1e2c2a', '#f3e6c8', '#e7b547'] });
  s.interact({ x: PX - 2.1, y: 1.3, z: PZ - 4.9, radius: 1.4, prompt: "Read this week's turns", onUse: async (gm) => {
    await say(gm, { name: 'This week’s turns', colour: '#e7b547' }, ["Thursday, by lottery: the morning to decks 16 to 60, the afternoon to decks 61 to 120. Candlewick drew the morning.", "The Quiet and Booking Day: open to all, for the festival. Somebody has chalked a star by Booking Day.", "Underneath, smaller: the floor is about 35 square kilometres. Share it."]);
    found(gm, 'hollow-share');
  } });
  // the rack of borrowed picnic cloths
  {
    const a = A8(5) - 0.32, x = PX + Math.cos(a) * 5.5, z = PZ + Math.sin(a) * 5.5, yaw = Math.PI / 2 - a + Math.PI / 2;
    s.furniture(() => atYaw(g, x, PY, z, yaw, () => {
      g.mat('wood', '#7a5233');
      for (const sx of [-1, 1]) { g.tube([[sx * 0.9, 0, -0.4], [sx * 0.9, 1.45, 0]], 0.03, { segs: 5 }); g.tube([[sx * 0.9, 0, 0.4], [sx * 0.9, 1.45, 0]], 0.03, { segs: 5 }); }
      for (const [y, zz] of [[1.42, 0], [0.95, -0.14], [0.95, 0.14], [0.5, -0.27], [0.5, 0.27]]) g.tube([[-0.95, y, zz], [0.95, y, zz]], 0.022, { segs: 5 });
      const cols = ['#d9472b', '#2f8f8a', '#e7b547', '#3b4a8f', '#b8336a', '#6b9f3e', '#f08a3a'];
      for (let k = 0; k < 6; k++) { const x0 = -0.82 + k * 0.28, c = cols[k % cols.length]; g.mat(k % 2 ? 'stripe' : 'motif', c, { sway: 0.2 }); g.sheet([x0, 1.44, -0.03], [x0 + 0.24, 1.44, -0.03], [x0 + 0.24, 0.62, -0.23], [x0, 0.62, -0.23], { nu: 2, nv: 3 }); g.sheet([x0, 1.44, 0.03], [x0 + 0.24, 1.44, 0.03], [x0 + 0.24, 0.66, 0.24], [x0, 0.66, 0.24], { nu: 2, nv: 3 }); }
    }));
    s.solid(x - 1, PY, z - 1, x + 1, PY + 1.5, z + 1);
    sign(s, { kind: 'notice', title: 'Picnic cloths', lines: ['Borrow one.', 'Shake it out', 'and bring it back', 'folded, please.'] }, x + 0.0, PY + 1.62, z, { face: 'X', w: 0.28, h: 0.36 });
    s.interact({ x, y: 1.0, z, radius: 1.4, prompt: 'Borrow a picnic cloth', onUse: (gm) => { gm.flags = gm.flags || {}; if (gm.flags.hasCloth) { toast(gm, 'You fold the cloth and put it back on the rack.'); gm.flags.hasCloth = false; return; } gm.flags.hasCloth = true; toast(gm, 'A picnic cloth, on loan. It smells of grass from overhead.'); } });
  }
  // pots of ferns at the column bases outside, a drinking tap, the This way board, the notice
  for (const i of [0, 3, 4, 7]) { const a = A8(i), x = PX + Math.cos(a) * 7.85, z = PZ + Math.sin(a) * 7.85; prop(s, 'plant', x, 0.085, z, i, { kind: i % 2 ? 'fern' : 'broad', size: 1.3, pot: i % 2 ? '#2f6f73' : '#b5653a' }); }
  prop(s, 'hollow.tap', PX + 10.6, 0.05, PZ + 3.4, -Math.PI / 2, { col: '#2f5a4a' });
  s.interact({ x: PX + 10.4, y: 1.0, z: PZ + 3.4, radius: 1.2, prompt: 'Drink from the tap', onUse: (gm) => { sfx(gm, 'pour', f, PX + 10.4, 0.9, PZ + 3.4); toast(gm, 'Cold water, tasting faintly of the lake loop. Free, like the air.'); } });
  boardOnLegs(s, PX + 11.3, PZ - 3.4, -Math.PI / 2, 1.5, 1.0, SIGNS['lake-pavilion.board'] || { kind: 'board', title: 'This way', lines: [] });
  noticePost(s, PX + 9.6, PZ + 9.6, Math.PI / 4, SIGNS['lake-pavilion.notice']);
  noticePost(s, PX - 9.2, PZ - 9.9, -Math.PI / 4 * 3, { kind: 'notice', title: 'The Changeover', lines: ['Turns change on the hour.', 'Fold your cloth, take', 'your basket, leave the', 'grass as you found it.', 'No changeover in the', 'festival: stay put.'] });
  // apron lamps at the four diagonals
  for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2, x = PX + Math.cos(a) * 11.2, z = PZ + Math.sin(a) * 11.2; lamp(s, 'pole', x, 0.05, z, { h: 3.4, K: 2800, power: 0.9, range: 12, night: true, metal: PAL.iron }); }
  // a day bed on the lawn for looking up
  {
    const x = PX - 8.5, z = PZ + 15.5, y = gy(x, z);
    prop(s, 'hollow.lounger', x, y, z, Math.PI * 0.85, { towel: '#3b4a8f', wood: '#a8875a' });
    s.interact({ x, y: y + 0.6, z, radius: 1.4, prompt: 'Lie back and look up', onUse: (gm) => {
      if (gm.player && gm.player.sit) { gm.player.sit({ x, y: y + 0.38, z, yaw: Math.PI * 0.85, eye: 0.4 }); gm.player.yaw = Math.PI - Math.PI * 0.85; gm.player.pitch = 1.32; }
      found(gm, 'far-bank');
      card(gm, 'Overhead', 'The far bank', "Three kilometres up, upside down and perfectly sharp: lawns, the long lake, a pavilion like this one, and people on cloths looking back.");
    } });
  }
  // arriving: half your weight
  s.trigger({ box: [-1.2, -0.5, PZ - 1.4, 1.6, 2.5, PZ + 1.4], once: true, onEnter: (gm) => found(gm, 'hollow-cab') });

  // ---- people: waiting, sitting, looking up
  s.path([[PX + 3.7, PY, PZ], [PX + 11.8, 0.05, PZ], [PX + 34, 0.05, PZ]]);
  s.path([[PX, PY, PZ + 3.7], [PX, 0.05, PZ + 11.8], [PX, 0.05, PZ + 34]]);
  s.path([[PX - 3.7, PY, PZ], [PX - 11.8, 0.05, PZ], [PX - 30, 0.05, PZ]]);
  s.path([[PX, PY, PZ - 3.7], [PX, 0.05, PZ - 11.8], [PX, 0.05, PZ - 26]]);
  const ring = []; for (let i = 0; i <= 8; i++) { const a = i * Math.PI / 4; ring.push([PX + Math.cos(a) * 3.7 * (i % 2 ? 1.2 : 1), PY, PZ + Math.sin(a) * 3.7 * (i % 2 ? 1.2 : 1)]); } s.path(ring);
  for (const [a, r] of [[0.5, 5.2], [2.2, 4.8], [3.6, 5.0], [5.6, 4.6]]) s.spot('stand', PX + Math.cos(a) * r, PY, PZ + Math.sin(a) * r, a + Math.PI / 2, { tags: ['pavilion', 'look-up'] });
  for (const [a, r] of [[1.0, 9.5], [1.15, 10.2], [1.3, 9.6]]) s.spot('chat', PX + Math.cos(a) * r, 0.05, PZ + Math.sin(a) * r, Math.PI / 2 - a + Math.PI, { tags: ['pavilion'] });
  s.spot('stand', PX + 3.9, PY, PZ - 3.7, Math.PI, { tags: ['browse', 'map'] });
  zone(s, { id: 'lake-pavilion', place: 'lake-pavilion', box: [PX - 13, -3, PZ - 13, PX + 13, 30, PZ + 13], name: 'The lake pavilion', sub: 'Candlewick core' });
  s.finish();
}

// a big painted board standing on two legs, facing +z under yaw (x, z: the foot of its centre)
function boardOnLegs(s, x, z, yaw, w, h, spec, o = {}) {
  const g = s.g, y = gy(x, z), foot = o.foot || 0.7;
  s.furniture(() => atYaw(g, x, y, z, yaw, () => {
    g.mat('wood', o.leg || '#4a3a2c'); for (const sx of [-1, 1]) g.box(sx * (w / 2 + 0.04) - 0.045, -0.2, -0.09, sx * (w / 2 + 0.04) + 0.045, foot + h + 0.12, -0.0, { bevel: 0.01 });
    g.box(-w / 2 - 0.1, foot - 0.06, -0.08, w / 2 + 0.1, foot - 0.01, -0.0, { bevel: 0.006 });
    if (o.roof !== false) { g.mat('wood', o.roofCol || '#7a2a2a'); g.box(-w / 2 - 0.16, foot + h + 0.12, -0.3, w / 2 + 0.16, foot + h + 0.17, 0.12, { bevel: 0.01 }); }
  }));
  const c = [x + Math.sin(yaw) * 0.0, z + Math.cos(yaw) * 0.0];
  sign(s, spec, c[0], y + foot + h / 2, c[1], { face: faceOf(yaw), w, h, back: '#2a2420' });
  const bb = [Math.abs(Math.cos(yaw)) * (w / 2 + 0.1) + 0.12, Math.abs(Math.sin(yaw)) * (w / 2 + 0.1) + 0.12];
  s.solid(x - bb[0], y, z - bb[1], x + bb[0], y + foot + h, z + bb[1]);
}
// a notice on a short post with a little roof
function noticePost(s, x, z, yaw, spec) {
  const g = s.g, y = gy(x, z); const q = Math.round(yaw / (Math.PI / 2)) * Math.PI / 2;
  s.furniture(() => { g.mat('wood', '#4a3a2c'); g.box(x - 0.05, y - 0.2, z - 0.05, x + 0.05, y + 1.75, z + 0.05, { bevel: 0.01 }); g.mat('wood', '#2f4a3e'); atYaw(g, x, y, z, q, () => { g.box(-0.26, 1.06, 0.05, 0.26, 1.6, 0.08, { bevel: 0.008 }); g.box(-0.3, 1.62, -0.06, 0.3, 1.66, 0.2, { bevel: 0.008 }); }); });
  const p = rot(x, z, q, 0, 0.085);
  sign(s, spec, p[0], y + 1.33, p[1], { face: faceOf(q), w: 0.42, h: 0.5, board: false });
  s.post(x, z, 0.08, y, y + 1.7);
}

// ===================================================================================================================
// 2. The festival green: long tables in rows for the feast's overflow, lantern poles strung with paper lanterns and
//    bunting, a programme board, picnics, and the bandstand.
// ===================================================================================================================
function buildGreen(game, f) {
  const s = game.world.scope('hollow-green', f), g = s.g;
  const r = new Rng(hashStr('green'));
  const COLS = [-74, -58, -42, -26], ROWS = [1812, 1816.2, 1820.4];
  const runners = ['#e7b547', null, '#2f8f8a', null, '#d9472b', '#efe6d2'];
  const COVERS = [['#d9472b', '#e7b547'], null, ['#2f8f8a', '#efe6d2'], ['#e7b547', '#d9472b'], null, ['#3b4a8f', '#e7b547'], ['#efe6d2', '#2f8f8a'], ['#b8336a', '#efe6d2'], null];
  const tableAt = []; let ti = 0;
  ROWS.forEach((z, ri) => COLS.forEach((x, ci) => {
    const key = ri + ',' + ci; ti++;
    if (key === '2,3' || key === '2,2') return;                       // these two are still on the carts
    const y = gy(x, z);
    const cv = COVERS[ti % COVERS.length];
    prop(s, 'hollow.longtable', x, y, z, 0, cv ? { top: '#b8875a', cover: cv[0], hem: cv[1] } : { top: r.pick(['#b8875a', '#a87a50', '#c49a68']), cloth: runners[ti % runners.length] || undefined });
    tableAt.push([x, z]);
    if (key !== '1,2') { prop(s, 'hollow.longbench', x, y, z - 0.78, 0, { wood: r.pick(['#a87a50', '#9a6f48']) }); prop(s, 'hollow.longbench', x, y, z + 0.78, Math.PI, { wood: r.pick(['#a87a50', '#9a6f48']) }); }
  }));
  // a few things already out on the tables: lidded bowls, jugs, stacks of plates under cloths
  for (const [x, z] of tableAt) {
    const y = gy(x, z) + 0.74, n = r.i(0, 3);
    for (let k = 0; k < n; k++) { const xx = x + r.f(-5, 5); if (r.chance(0.5)) prop(s, 'crock', xx, y, z + r.f(-0.2, 0.2), 0, { glaze: r.pick(['#e8d9b8', '#2f6f73', '#b5653a']), h: 0.26, r: 0.09 }); else { prop(s, 'bowl', xx, y, z - 0.15, 0, { glaze: r.pick(['#e9e1cf', '#c9552e', '#e7b547']) }); prop(s, 'bowl', xx + 0.25, y, z + 0.12, 0, { glaze: '#e9e1cf' }); } }
  }
  // the carts: two with table tops still stacked, one with benches
  const carts = [[-26, 1826.6, 0.08, 'tables', 3], [-44, 1827, -0.1, 'tables', 2], [-40, 1817.6, Math.PI + 0.06, 'benches', 6]];
  for (const [x, z, yaw, load, n] of carts) {
    prop(s, 'hollow.handcart', x, gy(x, z), z, yaw, { load, n });
    s.spot('work', x + 2.0, gy(x, z), z + 0.9, Math.PI, { tags: ['set-tables', 'green'] }); s.spot('work', x - 1.0, gy(x, z), z + 0.9, Math.PI, { tags: ['set-tables', 'green'] });
  }
  // a table half laid on trestles, waiting for its other end
  prop(s, 'hollow.longtable', -26, gy(-26, 1820.4), 1820.4, 0.0, { top: '#b8875a', len: 6 });
  s.spot('work', -22.6, 0, 1820.4, -Math.PI / 2, { tags: ['set-tables', 'green'] });
  for (const [x, z] of [[-74, 1810], [-58, 1822.5], [-42, 1810], [-26, 1814], [-74, 1822.4]]) s.spot('work', x + r.f(-4, 4), gy(x, z), z, r.chance(0.5) ? 0 : Math.PI, { tags: ['set-tables', 'green'] });
  s.interact({ x: -26, y: 1.0, z: 1825.6, radius: 2.2, prompt: 'Help unload a table', onUse: async (gm) => {
    gm.flags = gm.flags || {};
    await say(gm, { name: 'A man with a cart', colour: '#e2c486' }, gm.flags.helpedTables ? ["Two more and that's the lot. Then the lanterns want checking, and then we sit down."] : ["Take the other end. Twelve metres, and it weighs half what it would downstairs, so don't throw it.", "Every block whose hall is full gets a table out here on Booking Day. Eating alone is possible. Nobody does it."]);
    gm.flags.helpedTables = true; found(gm, 'tables-on-green'); sfx(gm, 'clunk', f, -26, 0.8, 1824);
  } });
  for (const [x, z] of tableAt.slice(0, 4)) s.interact({ x, y: 0.9, z: z - 0.78, radius: 1.6, prompt: 'Sit at a long table', onUse: (gm) => { if (gm.player && gm.player.sit) { gm.player.sit({ x: gm.player.pos.x, y: gy(x, z) + 0.46, z: z - 0.78, yaw: 0, eye: 1.12 }); gm.player.yaw = Math.PI; } } });
  sign(s, SIGNS['green.tables'] || { kind: 'notice', title: 'Long tables', lines: [] }, -80.06, gy(-80, 1812) + 0.95, 1812, { face: 'x', w: 0.42, h: 0.34 });
  // ---- lantern poles and what is strung between them
  const PXS = [-82, -66, -50, -34, -18], PZS = [1808.4, 1824.4], PH = 4.4;
  const poleCols = ['#2f6f73', '#8a2f3c', '#3b4a8f', '#2f6f73', '#8a2f3c'];
  const top = (x, z) => [x, gy(x, z) + PH - 0.3, z];
  PXS.forEach((x, i) => PZS.forEach((z) => {
    prop(s, 'hollow.pole', x, gy(x, z), z, 0, { h: PH, col: poleCols[i], band: '#e7b547' });
    s.light({ at: [x, gy(x, z) + PH - 0.7, z], color: [1, 0.72, 0.42], power: 2.2, range: 11, night: true, radius: 0.3 });
  }));
  for (let i = 0; i < PXS.length - 1; i++) for (const z of PZS) lanternString(s, top(PXS[i], z), top(PXS[i + 1], z), { offset: i * 3, sag: 0.9 });
  for (let i = 0; i < PXS.length; i++) flags(s, top(PXS[i], PZS[0]), top(PXS[i], PZS[1]), { offset: i * 2, sag: 1.1 });
  for (let i = 0; i < PXS.length - 1; i++) { lanternString(s, top(PXS[i], PZS[0]), top(PXS[i + 1], PZS[1]), { offset: i, sag: 1.3, r: 0.11 }); lanternString(s, top(PXS[i], PZS[1]), top(PXS[i + 1], PZS[0]), { offset: i + 4, sag: 1.3, r: 0.11 }); }
  // ---- the lantern mast: a tall painted mast at the heart of the green, with lanterns and flags strung out from its crown
  {
    const MX = 2, MZ = 1816, MH = 12, my = gy(MX, MZ), crown = [MX, my + MH - 0.4, MZ];
    s.furniture(() => {
      g.mat('stone', '#bfb4a2'); g.prism(octP(MX, MZ, 1.5), my - 0.3, my + 0.42);
      g.mat('wood', '#7a5233'); g.prism(octP(MX, MZ, 1.62), my + 0.42, my + 0.48);
      g.mat('paint', '#8a2f3c'); g.lathe(MX, MZ, [[0.2, my + 0.48], [0.16, my + 0.8], [0.12, my + MH - 0.3], [0.14, my + MH]], { segs: 10 });
      const bands = ['#e7b547', '#2f8f8a', '#efe6d2', '#e7b547', '#3b4a8f', '#efe6d2', '#e7b547'];
      bands.forEach((c, i) => { const y = my + 1.6 + i * 1.4, rr = 0.16 - i * 0.005; g.mat('paint', c); g.cyl(MX, y, MZ, rr + 0.006, 0.3, { segs: 10 }); });
      g.mat('cast', PAL.brass); g.lathe(MX, MZ, [[0.0, my + MH - 0.55], [0.55, my + MH - 0.5], [0.6, my + MH - 0.42], [0.5, my + MH - 0.38], [0.14, my + MH - 0.35]], { segs: 16 });
      g.lathe(MX, MZ, [[0.16, my + MH], [0.1, my + MH + 0.15], [0.22, my + MH + 0.35], [0.05, my + MH + 0.8], [0, my + MH + 0.85]], { segs: 10 });
    });
    octSolid(s, MX, MZ, 1.62, my - 0.3, my + 0.48, 'stone');
    s.post(MX, MZ, 0.22, my, my + MH);
    for (let k = 0; k < 8; k += 2) { const a = A8(k) + Math.PI / 8; s.spot('sit', MX + Math.cos(a) * 1.75, my + 0.48, MZ + Math.sin(a) * 1.75, Math.PI / 2 - a, { tags: ['green', 'mast'] }); }
    const anchors = [[-18, 1808.4], [-18, 1824.4]];
    for (const deg of [0, 40, 80, 120, 240, 280, 320]) { const a = deg * Math.PI / 180, x = MX + Math.cos(a) * 20, z = MZ + Math.sin(a) * 20; anchors.push([x, z]); prop(s, 'hollow.pole', x, gy(x, z), z, a, { h: PH, col: ['#2f6f73', '#8a2f3c', '#3b4a8f'][anchors.length % 3], band: '#e7b547' }); s.light({ at: [x, gy(x, z) + PH - 0.7, z], color: [1, 0.72, 0.42], power: 2.0, range: 10, night: true, radius: 0.3 }); }
    anchors.forEach(([x, z], i) => {
      lanternString(s, crown, top(x, z), { offset: i * 2, sag: 1.2, n: 14, r: 0.15 });
      flags(s, [MX, my + MH - 1.0, MZ], [x, gy(x, z) + PH - 0.6, z], { offset: i, sag: 1.6, drop: 0.32 });
    });
    s.light({ at: [MX, my + MH - 1.2, MZ], color: [1, 0.75, 0.45], power: 4, range: 20, night: true, radius: 0.5 });
    s.interact({ x: MX, y: my + 1.0, z: MZ, radius: 2.4, prompt: 'Sit at the foot of the lantern mast', onUse: (gm) => { const a = Math.atan2((gm.player ? gm.player.pos.z : MZ + 2) - MZ, (gm.player ? gm.player.pos.x : MX) - MX), x = MX + Math.cos(a) * 1.72, z = MZ + Math.sin(a) * 1.72; if (gm.player && gm.player.sit) { gm.player.sit({ x, y: my + 0.48, z, yaw: Math.PI / 2 - a, eye: 1.12 }); gm.player.yaw = Math.PI - (Math.PI / 2 - a); } } });
  }
  // ---- the programme board at the head of the tables, and the banner arch over the walk
  boardOnLegs(s, -50, 1803.6, Math.PI, 2.4, 1.5, { kind: 'board', title: 'Booking Day on the green', lines: ['Thursday|the band, 18:00', 'The Quiet|old songs, slowly', 'Booking Day 13:00|the long tables', '15:00|reels on the bandstand', '17:00|the vote is read out', '20:00|last chord, then wait', '22:00|the Long Flight'], palette: ['#2b2f5a', '#f3e6c8', '#e7b547'] }, { foot: 0.8, roofCol: '#8a2f3c' });
  s.interact({ x: -50, y: 1.4, z: 1802.6, radius: 1.8, prompt: 'Read the programme', onUse: (gm) => say(gm, { name: 'The programme', colour: '#e7b547' }, ['Thursday, the band at six. The Quiet, old songs, slowly.', 'Booking Day: the long tables at one, reels on the bandstand at three, the vote read out at five, the last chord at eight, then wait for it.', 'The Long Flight at ten. Under it, in a child’s hand: bring a lamp.']) });
  {
    const ax = 40, az = 1793.5, y0 = gy(ax, az);
    s.furniture(() => {
      g.mat('paint', '#8a2f3c'); for (const sx of [-1, 1]) g.lathe(ax + sx * 3.4, az, [[0.13, y0], [0.1, y0 + 0.15], [0.08, y0 + 5.1], [0.1, y0 + 5.2]], { segs: 8 });
      g.mat('cast', PAL.brass); for (const sx of [-1, 1]) g.ball(ax + sx * 3.4, y0 + 5.32, az, 0.12, 0.12, 0.12, { segs: 8, rings: 6 });
      g.mat('wood', '#4a3a2c'); g.box(ax - 3.5, y0 + 4.86, az - 0.05, ax + 3.5, y0 + 4.96, az + 0.05);
    });
    s.post(ax - 3.4, az, 0.12, y0, y0 + 5); s.post(ax + 3.4, az, 0.12, y0, y0 + 5);
    sign(s, { kind: 'banner', text: 'Booking Day', palette: ['#d9472b', '#f6ead0'] }, ax, y0 + 4.35, az, { face: 'z', w: 5.6, h: 0.9, double: true, board: false });
    flags(s, [ax - 3.4, y0 + 5.0, az], [ax + 3.4, y0 + 5.0, az], { sag: 0.25, drop: 0.3 });
  }
  // ---- picnics, a ball, children
  const pics = [[-30, 1760, 0.3], [-8, 1748, 1.2], [20, 1742, 2.5], [70, 1772, 0.9], [92, 1800, 2.0], [-92, 1850, 0.4], [-60, 1862, 1.7], [10, 1868, 2.8], [-100, 1790, 0.2], [100, 1880, 1.1]];
  pics.forEach(([x, z, yaw], i) => picnic(s, x, z, yaw, i));
  prop(s, 'hollow.ball', 0, gy(0, 1772), 1772, 0, {});
  s.interact({ x: 0, y: 0.4, z: 1772, radius: 1.3, prompt: 'Throw the ball', onUse: (gm) => { sfx(gm, 'ball-throw', f, 0, 1, 1772); toast(gm, 'Along the axis it flies true. Spinward it sinks, and anti it floats. A child catches it and throws it back, anti, on purpose.'); } });
  for (const [x, z] of [[-6, 1768], [5, 1775], [8, 1764], [-3, 1781]]) s.spot('play', x, gy(x, z), z, r.f(0, 6.28), { tags: ['kids', 'green', 'ball'] });
  // ---- the bandstand
  buildBandstand(s, game, f);
  // ---- walks for people
  s.path([[PX, 0.05, PZ + 34], [-10, 0, 1764], [-50, 0, 1801.5], [-84, 0, 1814.1], [-84, 0, 1818.3], [-16, 0, 1818.3], [-16, 0, 1814.1], [-50, 0, 1801.5]]);
  s.path([[-16, 0, 1814.1], [-84, 0, 1814.1]]);
  s.path([[-16, 0, 1818.3], [40, 0, 1830], [BX - 8.5, 0, BZ]]);
  s.path([[-10, 0, 1764], [40, 0, 1793.5], [40, 0, 1830]]);
  s.path([[40, 0, 1793.5], [100, 0.1, 1800], [116, 0.1, 1800]]);
  zone(s, { id: 'green', place: 'green', box: [-105, -3, 1735, 45, 30, 1885], name: 'The festival green', sub: 'set out for Booking Day' });
  s.finish();
}

function buildBandstand(s, game, f) {
  const g = s.g, R = 4.6, ap = R * Math.cos(Math.PI / 8);
  const y0 = Math.min(gy(BX, BZ), gy(BX - R, BZ), gy(BX + R, BZ)) - 0.2;
  s.structure(() => {
    g.mat('block', '#b5653a'); g.prism(octP(BX, BZ, R), y0, BY - 0.12);
    g.mat('paint', '#efe8da'); g.prism(octP(BX, BZ, R + 0.12), BY - 0.12, BY - 0.02);
    g.mat('planks', '#b58a5e'); g.prism(octP(BX, BZ, R + 0.05), BY - 0.02, BY);
    // a lattice band round the plinth: white slats
    g.mat('paint', '#efe8da'); const V = octP(BX, BZ, R + 0.01);
    for (let i = 0; i < 8; i++) { const a = V[i], b = V[(i + 1) % 8]; for (let k = 1; k < 9; k++) { const t = k / 9, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; g.tube([[x, y0 + 0.25, z], [x, BY - 0.2, z]], 0.025, { segs: 4 }); } g.tube([[a[0], y0 + 0.24, a[1]], [b[0], y0 + 0.24, b[1]]], 0.03, { segs: 4 }); }
  });
  octSolid(s, BX, BZ, R + 0.05, y0, BY, 'wood');
  stairs(s, BX - ap - 1.9, gy(BX - ap - 1.9, BZ), BZ, 'X', BY - gy(BX - ap - 1.9, BZ), 1.9, 2.2, { mat: 'planks', tint: '#a8805a', nosing: '#efe8da' });
  // posts, rail, roof
  const PV = octP(BX, BZ, R - 0.15), RT = BY + 3.0;
  s.furniture(() => {
    g.mat('paint', '#efe8da'); for (const [x, z] of PV) { g.lathe(x, z, [[0.1, BY], [0.07, BY + 0.12], [0.06, RT - 0.2], [0.09, RT - 0.08], [0.11, RT]], { segs: 8 }); }
    for (let i = 0; i < 8; i++) { const a = PV[i], b = PV[(i + 1) % 8], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; const sag = 0.35; const pts = []; for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push([a[0] + (b[0] - a[0]) * t, RT - 0.08 - sag * Math.sin(Math.PI * t), a[1] + (b[1] - a[1]) * t]); } g.tube(pts, 0.03, { segs: 4 }); void m; }
    // the roof: eight panels in red and cream, a gold rim and a finial
    g.push(); g.move(BX, 0, BZ); g.rotY(Math.PI / 8);
    const RR = R + 0.5;
    for (let i = 0; i < 8; i++) { const a0 = i * Math.PI / 4, a1 = (i + 1) * Math.PI / 4; g.mat('paint', i % 2 ? '#efe2c8' : '#8a2f3c'); g.quad([Math.cos(a0) * RR, RT, Math.sin(a0) * RR], [0, RT + 1.9, 0], [Math.cos(a1) * RR, RT, Math.sin(a1) * RR], [Math.cos(a1) * RR, RT, Math.sin(a1) * RR], { double: true }); }
    g.mat('planks', '#efe2c8'); g.lathe(0, 0, [[0.05, RT + 1.8], [RR - 0.05, RT - 0.03]], { segs: 8, capBottom: false, capTop: false });
    g.mat('cast', '#d6a640'); g.lathe(0, 0, [[RR + 0.04, RT - 0.12], [RR + 0.06, RT], [RR - 0.02, RT + 0.06]], { segs: 8, capBottom: false, capTop: false });
    g.lathe(0, 0, [[0.16, RT + 1.84], [0.1, RT + 2.0], [0.18, RT + 2.15], [0.06, RT + 2.5], [0, RT + 2.55]], { segs: 8 });
    g.pop();
  });
  // the valance: gold scallops on the eaves
  s.deco(() => { const V = octP(BX, BZ, R + 0.5); for (let i = 0; i < 8; i++) { const a = V[(i + 7) % 8], b = V[i]; for (let k = 0; k < 9; k++) { const t0 = k / 9, t1 = (k + 1) / 9, p0 = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0], p1 = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1]; g.mat('paint', k % 2 ? '#efe2c8' : '#d6a640'); g.quad([p0[0], RT - 0.04, p0[1]], [p1[0], RT - 0.04, p1[1]], [(p0[0] + p1[0]) / 2, RT - 0.3, (p0[1] + p1[1]) / 2], [(p0[0] + p1[0]) / 2, RT - 0.3, (p0[1] + p1[1]) / 2], { double: true }); } } });
  const rv = octP(BX, BZ, R - 0.15); const rp = []; for (let i = 0; i < 8; i++) rp.push(rv[(i + 5) % 8]); rp.push(rv[4]);
  railing(s, [rv[4], rv[5], rv[6], rv[7], rv[0], rv[1], rv[2], rv[3]], BY, { h: 0.9, tint: '#efe8da', rail: '#efe8da', railMat: 'paint' });
  void rp;
  // chairs and music stands for the band, facing the green
  const cols = ['#6b4a2f', '#7a5233', '#4f3a28', '#8a6a48'];
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + (i - 3) * 0.32, rr = 2.4, x = BX + 0.6 + Math.cos(a) * rr, z = BZ + Math.sin(a) * rr, yaw = Math.PI / 2 - a;
    prop(s, 'chair', x, BY, z, yaw, { wood: cols[i % 4], back: i % 2 ? 'slat' : 'hoop', seat: ['#d9c08a', '#c9552e', '#2f6f73'][i % 3] }, { spot: { tags: ['band', 'bandstand', 'perform'] } });
    const m = rot(x, z, yaw, 0, 0.7); prop(s, 'hollow.musicstand', m[0], BY, m[1], yaw + Math.PI, {});
    s.spot('perform', x, BY, z, yaw, { tags: ['band', 'bandstand'] });
  }
  s.spot('perform', BX - 2.6, BY, BZ, -Math.PI / 2, { tags: ['bandleader', 'bandstand'], who: 'rufus' });
  // a hand drum, an instrument case and a long heliox flute in its stand
  s.detail(() => {
    g.mat('wood', '#8a5a33'); g.lathe(BX + 1.8, BZ - 1.4, [[0.0, BY], [0.16, BY], [0.2, BY + 0.2], [0.18, BY + 0.5], [0.0, BY + 0.5]], { segs: 14 }); g.mat('leather', '#e8d8b0'); g.cyl(BX + 1.8, BY + 0.5, BZ - 1.4, 0.185, 0.01, { segs: 14 });
    g.mat('leather', '#4a2a1e'); g.box(BX + 2.2, BY, BZ + 1.2, BX + 3.4, BY + 0.14, BZ + 1.55, { bevel: 0.03 });
    g.mat('cast', '#c9b98a'); g.tube([[BX + 2.6, BY, BZ - 2.1], [BX + 2.62, BY + 1.25, BZ - 2.08]], 0.022, { segs: 8 }); g.mat('wood', '#3a2a1e'); g.cyl(BX + 2.6, BY, BZ - 2.1, 0.12, 0.04, { segs: 8 });
  });
  for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; lamp(s, 'globe', BX + Math.cos(a) * 2.4, RT - 0.5, BZ + Math.sin(a) * 2.4, { drop: 0.8, r: 0.15, K: 2700, power: 0.8, range: 7, night: true }); }
  // chalkboard at the foot of the steps; seats for an audience on the grass
  {
    const x = BX - ap - 2.6, z = BZ + 2.2, y = gy(x, z);
    s.furniture(() => { g.mat('wood', '#6b4a2f'); g.tube([[x - 0.05, y, z - 0.35], [x + 0.02, y + 1.5, z - 0.3]], 0.025, { segs: 5 }); g.tube([[x - 0.05, y, z + 0.35], [x + 0.02, y + 1.5, z + 0.3]], 0.025, { segs: 5 }); g.tube([[x + 0.5, y, z], [x + 0.06, y + 1.45, z]], 0.025, { segs: 5 }); });
    sign(s, SIGNS['bandstand.chalk'] || { kind: 'chalk', title: 'Bandstand', lines: [] }, x - 0.04, y + 0.95, z, { face: 'x', w: 0.62, h: 0.86 });
  }
  const r = new Rng(hashStr('audience'));
  for (let row = 0; row < 2; row++) for (let i = 0; i < 6; i++) {
    const x = BX - ap - 6.0 - row * 1.1, z = BZ - 3.3 + i * 1.3 + r.f(-0.15, 0.15);
    prop(s, 'chair', x, gy(x, z), z, Math.PI / 2 + r.f(-0.2, 0.2), { wood: r.pick(cols), back: r.chance(0.5) ? 'slat' : 'hoop', seat: r.pick(['#d9c08a', '#c9552e', '#2f6f73', '#e7b547']) }, { spot: { tags: ['audience', 'bandstand'] } });
  }
  s.interact({ x: BX - ap - 1.0, y: 1.2, z: BZ, radius: 2.0, prompt: 'Wait for the last chord to come back', onUse: async (gm) => {
    sfx(gm, 'pluck', f, BX, BY + 1.2, BZ);
    await say(gm, who('rufus', 'The bandleader'), ["Sound goes about 620 metres a second in this air. Up to the far bank and back is six kilometres.", "So you play the last chord, and you keep your hands up, and you count. About nine and a half. Ten if you count like me.", "There. Hear it? Now you can clap."]);
    if (gm.sfxAt) setTimeout(() => sfx(gm, 'pluck', f, BX, BY + 30, BZ), 2500);
    found(gm, 'far-bank-echo');
  } });
  zone(s, { id: 'bandstand', place: 'bandstand', box: [BX - 9, -3, BZ - 7, BX + 6, 30, BZ + 7], name: 'The bandstand', sub: 'the festival green' });
  s.path([[BX - 8.5, 0, BZ], [BX - ap - 1.9, gy(BX - ap - 1.9, BZ), BZ], [BX - ap + 0.4, BY, BZ], [BX + 1.0, BY, BZ]]);
}

// ===================================================================================================================
// 3. The lake shore: the plank jetty with its diving stage, the robe house, loungers, towels and punts on the sand.
// ===================================================================================================================
function buildShore(game, f) {
  const s = game.world.scope('hollow-shore', f), g = s.g;
  const r = new Rng(hashStr('shore'));
  // ---- the jetty: a plank deck on posts, steps at the root, a ladder, the diving stage and board at its end
  floor(s, J0, JZ - 1.2, J1, JZ + 1.2, JY, 'planks', '#b3a58e', { surf: 'wood' });
  s.structure(() => {
    g.mat('wood', '#6f6252'); for (const sz of [-1, 1]) g.box(J0, JY - 0.32, JZ + sz * 1.2 - 0.08, J1, JY - 0.01, JZ + sz * 1.2 + 0.08, { bevel: 0.01 });
    g.mat('wood', '#5a4e40'); for (let x = J0 + 1.2; x < J1; x += 2.4) g.box(x - 0.08, JY - 0.3, JZ - 1.2, x + 0.08, JY - 0.12, JZ + 1.2);
  });
  for (let x = J0 + 1.2; x <= J1 + 0.01; x += 2.4) for (const sz of [-1, 1]) {
    const z = JZ + sz * 1.25, yb = Math.min(gy(x, z), LAND.WATER - 1.2) - 0.3;
    s.furniture(() => { g.mat('wood', '#4f4438'); g.lathe(x, z, [[0.12, yb], [0.12, JY + 0.1], [0.1, JY + 0.16]], { segs: 8 }); });
    s.post(x, z, 0.12, yb, JY + 0.15);
  }
  stairs(s, J0 - 1.0, gy(J0 - 1.0, JZ), JZ, 'X', JY - gy(J0 - 1.0, JZ), 1.0, 2.4, { mat: 'planks', tint: '#b3a58e', nosing: '#6f6252' });
  // the ladder on the south side, down into the water
  const LX = 156;
  s.furniture(() => { g.mat('brushed', '#b9bcb6'); for (const dx of [-0.25, 0.25]) g.tube([[LX + dx, LAND.WATER - 1.3, JZ + 1.32], [LX + dx, JY + 0.02, JZ + 1.32], [LX + dx, JY + 0.75, JZ + 1.05]], 0.022, { segs: 6 }); for (let y = LAND.WATER - 1.1; y < JY; y += 0.3) g.tube([[LX - 0.25, y, JZ + 1.32], [LX + 0.25, y, JZ + 1.32]], 0.016, { segs: 5 }); });
  s.interact({ x: LX, y: LAND.WATER - 0.3, z: JZ + 1.8, radius: 1.4, prompt: 'Climb the ladder', onUse: (gm) => { if (gm.player) gm.player.place(f, LX, JY + 0.02, JZ + 0.4, Math.PI, 0); sfx(gm, 'splash', f, LX, LAND.WATER, JZ + 1.4); } });
  // the diving stage: a raised deck at three metres above the water, stairs up, rails, and the board
  const SX0 = 163.5, SX1 = J1;
  floor(s, SX0, JZ - 1.2, SX1, JZ + 1.2, DY, 'planks', '#b3a58e', { surf: 'wood' });
  s.structure(() => { g.mat('wood', '#6f6252'); g.box(SX0, DY - 0.3, JZ - 1.2, SX1, DY - 0.02, JZ + 1.2, { faces: 'xXzZy' }); });
  for (const [x, z] of [[SX0 + 0.15, JZ - 1.1], [SX0 + 0.15, JZ + 1.1], [SX1 - 0.15, JZ - 1.1], [SX1 - 0.15, JZ + 1.1]]) { s.furniture(() => { g.mat('wood', '#4f4438'); g.box(x - 0.1, JY, z - 0.1, x + 0.1, DY - 0.02, z + 0.1, { bevel: 0.01 }); }); s.post(x, z, 0.12, JY, DY); }
  stairs(s, SX0 - 4.6, JY, JZ - 0.65, 'X', DY - JY, 4.6, 0.95, { mat: 'planks', tint: '#b3a58e', nosing: '#6f6252' });
  s.furniture(() => { g.mat('brushed', '#b9bcb6'); for (let k = 0; k <= 3; k++) { const x = SX0 - 4.6 + k * 4.6 / 3, y = JY + (DY - JY) * k / 3; g.tube([[x, y, JZ - 0.12], [x, y + 1.0, JZ - 0.12]], 0.02, { segs: 6 }); } g.tube([[SX0 - 4.6, JY + 1.0, JZ - 0.12], [SX0, DY + 1.0, JZ - 0.12]], 0.028, { segs: 6 }); g.tube([[SX0 - 4.6, JY + 0.5, JZ - 0.12], [SX0, DY + 0.5, JZ - 0.12]], 0.014, { segs: 5 }); });
  s.solid(SX0 - 4.6, JY + 0.4, JZ - 0.16, SX0, DY + 1.0, JZ - 0.08);
  railing(s, [[SX0, JZ + 1.15], [SX1, JZ + 1.15]], DY, { h: 1.0, tint: '#b9bcb6', rail: '#b9bcb6', railMat: 'brushed' });
  railing(s, [[SX0 + 0.05, JZ - 0.15], [SX0 + 0.05, JZ + 1.15]], DY, { h: 1.0, tint: '#b9bcb6', rail: '#b9bcb6', railMat: 'brushed' });
  railing(s, [[SX0, JZ - 1.15], [SX1, JZ - 1.15]], DY, { h: 1.0, tint: '#b9bcb6', rail: '#b9bcb6', railMat: 'brushed' });
  railing(s, [[SX1 - 0.05, JZ - 1.15], [SX1 - 0.05, JZ - 0.45]], DY, { h: 1.0, tint: '#b9bcb6', rail: '#b9bcb6', railMat: 'brushed' }); railing(s, [[SX1 - 0.05, JZ + 0.45], [SX1 - 0.05, JZ + 1.15]], DY, { h: 1.0, tint: '#b9bcb6', rail: '#b9bcb6', railMat: 'brushed' });
  block(s, SX1 - 0.4, DY - 0.06, JZ - 0.32, SX1 + 2.7, DY + 0.05, JZ + 0.32, 'wood', '#d9b25c', { bevel: 0.02, surf: 'wood' });
  s.structure(() => { g.mat('speckle', '#2f6f73'); g.box(SX1 + 0.4, DY + 0.05, JZ - 0.28, SX1 + 2.6, DY + 0.058, JZ + 0.28, { faces: 'Y' }); g.mat('cast', '#3a3a36'); g.box(SX1 - 0.2, DY - 0.25, JZ - 0.3, SX1 + 0.2, DY - 0.06, JZ + 0.3); });
  s.interact({ x: SX1 + 2.2, y: DY + 1.0, z: JZ, radius: 1.1, prompt: 'Dive', onUse: (gm) => {
    const p = gm.player; if (!p) return;
    p.place(f, SX1 + 2.45, DY + 0.06, JZ, Math.PI / 2, -0.35);
    p.vel.y = 2.3; p.vel.x = 2.8; p.onGround = false;
    sfx(gm, 'dive', f, SX1 + 2.4, DY, JZ);
    found(gm, 'slow-dive');
    setTimeout(() => { sfx(gm, 'splash', f, SX1 + 3.6, LAND.WATER, JZ); toast(gm, 'Three metres to the water: about 1.1 seconds at half a g. At the rim it would be under eight tenths. You had time to think, and you thought about the cold.'); }, 1700);
  } });
  noticePost(s, SX0 - 5.4, JZ + 0.8, -Math.PI / 2, SIGNS['jetty.notice']);
  noticePost(s, J0 - 2.2, JZ - 2.2, -Math.PI / 2, SIGNS['lakeshore.notice']);
  lamp(s, 'pole', J0 + 0.5, JY, JZ + 1.0, { h: 2.9, K: 2900, power: 0.8, range: 10, night: true });
  lamp(s, 'pole', SX0 - 1.0, JY, JZ + 1.0, { h: 2.9, K: 2900, power: 0.8, range: 10, night: true });
  lamp(s, 'pole', SX1 - 0.3, DY, JZ + 0.95, { h: 1.6, K: 2900, power: 0.5, range: 9, night: true });
  // people on the jetty
  for (let x = J0 + 4; x < SX0 - 5; x += 5.5) { s.spot('sit', x + r.f(-0.5, 0.5), JY, JZ + 1.05, 0, { tags: ['jetty', 'dangle'], low: true }); s.spot('stand', x + 2.5, JY, JZ - 0.8, Math.PI / 2, { tags: ['jetty', 'look'] }); }
  s.spot('stand', SX1 - 0.6, DY, JZ + 0.6, Math.PI / 2, { tags: ['jetty', 'dive'] }); s.spot('queue', SX0 + 0.6, DY, JZ - 0.6, Math.PI / 2, { tags: ['jetty', 'dive'] });
  s.path([[116, 0.1, 1800], [J0 - 1.0, gy(J0 - 1, JZ), JZ], [J0 + 0.3, JY, JZ], [SX0 - 5.0, JY, JZ + 0.5], [J1 - 0.5, JY, JZ + 0.5]]);
  s.path([[SX0 - 4.8, JY, JZ - 0.65], [SX0 + 0.5, DY, JZ - 0.65], [SX1 - 0.6, DY, JZ]]);
  zone(s, { id: 'jetty', place: 'jetty', box: [J0 - 1.5, -4, JZ - 2.5, SX1 + 4, 30, JZ + 2.5], name: 'The jetty', sub: 'the lake' });

  // ---- the robe house: long and low, open to the lake, shelves of folded robes and a warm shelf of lidded cups
  const R0 = 1806, R1 = 1834, RXB = 106.5, RXF = 112.2, RW = maxGround(RXB - 0.5, R0, RXF + 1.8, R1, 1), RFY = RW + 0.16;
  const H = 2.6, RYB = RFY + 3.2, RYF = RFY + 2.5;
  block(s, RXB - 0.2, RW - 0.6, R0 - 0.2, RXF + 1.8, RFY, R1 + 0.2, 'planks', '#a8916f', { surf: 'wood' });
  s.structure(() => { g.mat('wood', '#6f5a44'); g.box(RXF + 1.8, RW - 0.6, R0 - 0.2, RXF + 1.86, RFY, R1 + 0.2, { faces: 'XY' }); });
  stairs(s, RXF + 2.5, gy(RXF + 2.5, 1820), 1820, 'x', RFY - gy(RXF + 2.5, 1820), 0.7, 8.0, { mat: 'planks', tint: '#a8916f', nosing: '#6f5a44' });
  // walls: the back, the two ends with doors through to the shore path
  const wallOpt = { tint: '#efe2c8', tintA: '#9fc0c8', tintB: '#efe2c8', mat: 'flute', matB: 'plaster', skirt: '#6b4a2f', t: 0.18 };
  wall(s, RXB, R0, RXB, R1, RFY, H + 0.6, Object.assign({}, wallOpt, { tintA: '#efe2c8', tintB: '#c4dde2', matA: 'plaster', matB: 'flute', dado: { h: 0.9, mat: 'paint', tint: '#2f6f73' } }));
  sign(s, { kind: 'banner', text: 'The robe house', palette: ['#e7b547', '#2b2f3a'] }, RXB - 0.1, RFY + 2.0, 1820, { face: 'x', w: 9.0, h: 1.1 });
  wall(s, RXB, R0, RXF, R0, RFY, H, Object.assign({}, wallOpt, { tintA: '#efe2c8', tintB: '#9fc0c8', matA: 'plaster', matB: 'flute', openings: [{ at: 1.6, w: 1.1, h: 2.1 }] }));
  wall(s, RXB, R1, RXF, R1, RFY, H, Object.assign({}, wallOpt, { openings: [{ at: 1.6, w: 1.1, h: 2.1 }] }));
  // front posts and the long lean-to roof, rust-red, with a cream fascia carrying the sign
  for (let z = R0; z <= R1 + 0.01; z += 3.5) { s.furniture(() => { g.mat('paint', '#efe2c8'); g.box(RXF + 1.45, RFY, z - 0.08, RXF + 1.61, RYF, z + 0.08, { bevel: 0.015 }); }); s.post(RXF + 1.53, z, 0.1, RFY, RYF); }
  s.furniture(() => {
    g.mat('flute', '#a8503a'); const ex = 0.5;
    g.quad([RXB - 0.3, RYB, R0 - ex], [RXB - 0.3, RYB, R1 + ex], [RXF + 2.1, RYF - 0.05, R1 + ex], [RXF + 2.1, RYF - 0.05, R0 - ex], { double: true });
    g.mat('paint', '#e9dcc0'); g.quad([RXB - 0.25, RYB - 0.07, R0 - ex], [RXF + 2.05, RYF - 0.12, R0 - ex], [RXF + 2.05, RYF - 0.12, R1 + ex], [RXB - 0.25, RYB - 0.07, R1 + ex], { double: true });
    g.mat('paint', '#e9dcc0'); g.box(RXF + 2.05, RYF - 0.42, R0 - ex, RXF + 2.15, RYF, R1 + ex, { bevel: 0.01 });
    g.mat('wood', '#6b4a2f'); for (let z = R0; z <= R1 + 0.01; z += 1.75) g.tube([[RXB, RYB - 0.16, z], [RXF + 2.0, RYF - 0.2, z]], 0.05, { segs: 4 });
    g.box(RXF + 1.43, RYF - 0.3, R0 - 0.1, RXF + 1.63, RYF - 0.08, R1 + 0.1);
    // the end gables, closing the roof triangle above the end walls
    for (const z of [R0, R1]) { g.mat('flute', '#9fc0c8'); g.quad([RXB, RFY + H, z], [RXF + 1.5, RFY + H, z], [RXF + 1.5, RYF - 0.1, z], [RXB, RYB - 0.1, z], { double: true }); }
  });
  sign(s, Object.assign({}, SIGNS['robe-house.fascia'], { palette: ['#2f6f73', '#f6ead0', '#e7b547'] }), RXF + 2.16, RYF - 0.21, 1820, { face: 'X', w: 4.2, h: 0.36, board: false });
  sign(s, { kind: 'banner', text: 'Every swimmer gets a robe', palette: ['#2f6f73', '#f6ead0'] }, RXB + 0.1, RFY + 2.62, 1820, { face: 'X', w: 7.0, h: 0.55 });
  // a drying line of robes and cloths on the south side, in every colour the dyer had
  {
    const lz0 = R1 + 2.5, lz1 = R1 + 13, lx = RXF - 0.5, ly = gy(lx, lz0);
    s.furniture(() => {
      g.mat('wood', '#6b4a2f'); for (const z of [lz0, lz1]) g.box(lx - 0.05, gy(lx, z) - 0.2, z - 0.05, lx + 0.05, gy(lx, z) + 2.05, z + 0.05, { bevel: 0.01 });
      g.mat('weave', '#e8e0cc'); g.tube([[lx, ly + 1.95, lz0], [lx, ly + 1.75, (lz0 + lz1) / 2], [lx, gy(lx, lz1) + 1.95, lz1]], 0.008, { segs: 3, caps: false });
      const cols = ['#e7b547', '#d9472b', '#2f8f8a', '#b8336a', '#3b4a8f', '#efe6d2', '#6b9f3e', '#f08a3a', '#2f8f8a', '#e7b547'];
      for (let k = 0; k < 10; k++) { const z = lz0 + 0.6 + k * (lz1 - lz0 - 1.2) / 9, t = (z - lz0) / (lz1 - lz0), yy = ly + 1.95 - 0.2 * 4 * t * (1 - t) - 0.02, w = k % 3 === 2 ? 0.35 : 0.48, L = k % 3 === 2 ? 0.7 : 1.15; g.mat(k % 3 === 2 ? 'stripe' : 'knit', cols[k], { sway: 0.5 }); const v0 = g.buf.nv; g.sheet([lx - 0.02, yy, z - w], [lx - 0.02, yy, z + w], [lx + 0.04, yy - L, z + w * 0.95], [lx + 0.04, yy - L, z - w * 0.95], { nu: 2, nv: 3 }); for (let q = 0; q < 3; q++) { g.param(v0 + q, 0); g.param(v0 + 12 + q, 0); } }
    });
    s.post(lx, lz0, 0.08, ly, ly + 2); s.post(lx, lz1, 0.08, ly, ly + 2);
  }
  // inside: robe shelves along the back wall, the warm shelf of cups and urns, the keeper's counter, benches, hooks
  const robeCols = [['#e7b547', '#d9472b', '#2f8f8a', '#3b4a8f'], ['#b8336a', '#efe6d2', '#6b9f3e', '#e7b547'], ['#2f8f8a', '#f08a3a', '#3b4a8f', '#b8336a'], ['#d9472b', '#e7b547', '#efe6d2', '#2f8f8a']];
  for (let k = 0; k < 4; k++) {
    const z = R0 + 2.4 + k * 2.0; prop(s, 'shelving', RXB + 0.28, RFY, z, Math.PI / 2, { w: 1.7, h: 2.0, d: 0.4, shelves: 4, wood: '#7a5a3a' });
    for (let sh = 0; sh < 4; sh++) for (let j = 0; j < 3; j++) prop(s, 'hollow.robes', RXB + 0.3, RFY + 0.1 + sh * 0.4725 + 0.02, z - 0.55 + j * 0.55, Math.PI / 2, { cols: robeCols[(k + sh + j) % 4].slice(0, 2 + ((sh + j) % 2)) });
  }
  // the warm shelf: a long stone shelf on the loop, rows of lidded cups and two urns
  const WZ0 = R1 - 9.2, WZ1 = R1 - 1.0;
  block(s, RXB + 0.1, RFY, WZ0, RXB + 0.62, RFY + 0.92, WZ1, 'tile', '#b5653a', { bevel: 0.01 });
  s.structure(() => { g.mat('stone', '#d8cdb8'); g.box(RXB + 0.08, RFY + 0.92, WZ0 - 0.04, RXB + 0.68, RFY + 0.97, WZ1 + 0.04, { bevel: 0.01 }); g.mat('cast', '#9a6a3a'); g.tube([[RXB + 0.66, RFY + 0.82, WZ0], [RXB + 0.66, RFY + 0.82, WZ1]], 0.025, { segs: 6 }); });
  for (let i = 0; i < 26; i++) { const z = WZ0 + 0.3 + (i % 13) * 0.42, x = RXB + 0.28 + Math.floor(i / 13) * 0.2; if (z > WZ1 - 2.4 && z < WZ1 - 0.6 && x < RXB + 0.4) continue; prop(s, 'hollow.cup', x, RFY + 0.97, z, 0, { c: ['#e9e1cf', '#3d6f8a', '#c9552e', '#e7b547', '#6b9f3e'][i % 5] }); }
  prop(s, 'hollow.urn', RXB + 0.36, RFY + 0.97, WZ1 - 1.0, 0, {}); prop(s, 'hollow.urn', RXB + 0.36, RFY + 0.97, WZ1 - 1.8, 0, { col: '#7a6a5a' });
  sign(s, { kind: 'label', text: 'WARM SHELF', sub: 'lids on · broth in the urns' }, RXB + 0.1 + 0.53, RFY + 0.6, (WZ0 + WZ1) / 2, { face: 'X', w: 0.7, h: 0.2 });
  s.light({ at: [RXB + 0.9, RFY + 0.5, (WZ0 + WZ1) / 2], to: [RXB + 0.9, RFY + 0.5, WZ1 - 1], type: 'tube', color: [1, 0.55, 0.3], power: 1.2, range: 3.0, radius: 0.1, lamp: true });
  // the counter, Ezra's post, the rules, the basket for used robes
  const CZ = 1820, CX = RXF - 0.6;
  prop(s, 'counter', CX, RFY, CZ, Math.PI / 2, { w: 2.6, d: 0.6, body: '#2f6f73', top: '#a8875a' }, { noSpots: true });
  s.spot('counter', CX - 0.9, RFY, CZ, Math.PI / 2, { who: 'ezra', tags: ['robe-house', 'keeper'] });
  s.spot('customer', CX + 1.1, RFY, CZ + 0.4, -Math.PI / 2, { tags: ['robe-house'] }); s.spot('queue', CX + 1.4, RFY, CZ + 1.4, -Math.PI / 2, { tags: ['robe-house'] });
  prop(s, 'hollow.robes', CX, RFY + 0.92, CZ - 0.8, 0.1, { cols: ['#e7b547', '#2f8f8a', '#d9472b'] }); prop(s, 'hollow.cup', CX + 0.1, RFY + 0.92, CZ + 0.5, 0, { c: '#e9e1cf' }); prop(s, 'hollow.cup', CX - 0.05, RFY + 0.92, CZ + 0.72, 0, { c: '#3d6f8a' });
  noticePost(s, RXF + 1.0, CZ + 2.2, Math.PI / 2, SIGNS['robe-house.rules']);
  s.detail(() => { g.mat('cane', '#b08d5e'); g.lathe(RXF + 0.6, R0 + 1.2, [[0.0, RFY], [0.3, RFY], [0.36, RFY + 0.55], [0.34, RFY + 0.57], [0.3, RFY + 0.05], [0, RFY + 0.05]], { segs: 14 }); g.mat('knit', '#2f8f8a'); g.ball(RXF + 0.6, RFY + 0.52, R0 + 1.2, 0.26, 0.1, 0.26, { segs: 10, rings: 4 }); g.mat('knit', '#e7b547'); g.ball(RXF + 0.66, RFY + 0.6, R0 + 1.14, 0.16, 0.08, 0.2, { segs: 8, rings: 4 }); });
  s.post(RXF + 0.6, R0 + 1.2, 0.36, RFY, RFY + 0.57);
  sign(s, { kind: 'label', text: 'USED ROBES', sub: 'in here, please' }, RXF + 0.6, RFY + 0.75, R0 + 1.2 + 0.37, { face: 'Z', w: 0.5, h: 0.16 });
  for (const z of [R0 + 0.15, R1 - 0.15]) prop(s, 'hollow.robehooks', RXB + 2.8, RFY, z, z < 1820 ? 0 : Math.PI, { n: 6 });
  for (const z of [R0 + 0.55, R1 - 0.55]) prop(s, 'bench', RXB + 3.2, RFY, z, z < 1820 ? 0 : Math.PI, { w: 2.6, wood: '#8a6a48' });
  prop(s, 'bench', RXF + 0.4, RFY, R0 + 5.0, -Math.PI / 2, { w: 2.2, wood: '#8a6a48', back: true }); prop(s, 'bench', RXF + 0.4, RFY, R1 - 4.6, -Math.PI / 2, { w: 2.2, wood: '#8a6a48', back: true });
  prop(s, 'plant', RXF + 1.3, RFY, R0 + 0.4, 0, { kind: 'fern', size: 1.0, pot: '#b5653a' }); prop(s, 'plant', RXF + 1.3, RFY, R1 - 0.4, 0, { kind: 'broad', size: 1.1, pot: '#2f6f73' });
  lamp(s, 'globe', RXB + 2.6, RFY + 2.5, R0 + 6.5, { drop: 0.5, K: 2700, power: 0.7, range: 7, clip: [RXB, RFY - 0.3, R0, RXF + 2.2, RYB, R1] });
  lamp(s, 'globe', RXB + 2.6, RFY + 2.5, R1 - 6.5, { drop: 0.5, K: 2700, power: 0.7, range: 7, clip: [RXB, RFY - 0.3, R0, RXF + 2.2, RYB, R1] });
  lamp(s, 'lantern', RXF + 1.2, RYF - 0.6, CZ, { tint: '#f2b56b', power: 0.8, drop: 0.3, night: true });
  s.ambient({ box: [RXB, RFY - 0.2, R0, RXF + 2, RYB, R1], sky: '#ffdcae', ground: '#c9a57c', power: 0.35, lamp: true, soft: 1.0, spec: 0.4 });
  s.interact({ x: CX + 0.6, y: RFY + 1.1, z: CZ, radius: 1.6, kind: 'talk', prompt: 'Ask Ezra for a robe and a cup', onUse: async (gm) => {
    gm.flags = gm.flags || {};
    if (!gm.flags.metEzra) { gm.flags.metEzra = true; await say(gm, who('ezra', 'Ezra'), ["Wet or dry? Doesn't matter. Everybody gets one.", "This air pulls the heat off wet skin about four times faster than you'd think. So: robe first, broth second, opinions after."]); }
    const it = await buyFrom(gm, MENUS['robe-house'], CAST.ezra ? CAST.ezra.short : 'Ezra');
    if (it) { sfx(gm, it.id === 'robe' || it.id === 'dry-cloth' ? 'paper' : 'cup', f, CX, RFY + 1, CZ); if (it.id === 'robe' || it.id === 'broth') found(gm, 'robe-and-cup'); if (it.id === 'robe') gm.flags.hasRobe = true; }
  } });
  s.interact({ x: RXB + 0.9, y: RFY + 1.1, z: R0 + 5.4, radius: 1.3, prompt: 'Look at the robes', onUse: (gm) => say(gm, { name: 'The robe shelves', colour: '#9fd0c0' }, ['Folded robes in every colour the dyer had that year: saffron, rose, teal, a hard blue. The oldest have their mends in bright thread at the cuffs.', 'Names are stitched inside a few: whoever wore it out first, presumably.']) });
  zone(s, { id: 'robe-house', place: 'robe-house', box: [RXB - 0.2, -3, R0, RXF + 2.0, 30, R1], name: 'The robe house', sub: 'the lake shore', reverb: 'room' });
  // ---- the sand: loungers and towels, punts pulled up, the water coming in slowly
  const lounge = [[124, 1774, 0.1], [126.5, 1778, -0.05], [125, 1783, 0.15], [127, 1788, 0.05], [123.5, 1792.5, -0.1], [118.5, 1843, 0.2], [116.5, 1847, 0.1]];
  const towels = ['#2f8f8a', '#e7b547', '#d9472b', '#3b4a8f', '#b8336a', '#6b9f3e', '#f08a3a'];
  lounge.forEach(([x, z, dy], i) => prop(s, 'hollow.lounger', x, gy(x, z), z, Math.PI / 2 + dy, { towel: towels[i % towels.length] }));
  for (const [x, z, yaw, i] of [[129.5, 1776, 1.4, 0], [131, 1785.5, 1.7, 1], [120, 1838.5, 1.2, 2], [128, 1792, 1.5, 3], [121.2, 1770.5, 1.9, 4]]) prop(s, 'hollow.towel', x, gy(x, z), z, yaw, { a: towels[(i + 3) % towels.length] });
  for (const [x, z, yaw, col, gun] of [[118.5, 1853.5, 1.2, '#4a3a2c', '#d9472b'], [116.2, 1857.5, 1.35, '#3a4a4f', '#e7b547'], [121.5, 1859.8, 1.1, '#4a3a2c', '#2f8f8a']]) prop(s, 'hollow.punt', x, gy(x, z) + 0.02, z, yaw, { col, gun });
  for (const [x, z] of [[133, 1780], [134, 1790], [130, 1806.5], [126, 1830], [124, 1836]]) s.spot('stand', x, gy(x, z), z, Math.PI / 2, { tags: ['shore', 'look'] });
  for (const [x, z, yaw] of [[122, 1812, 1.6], [123, 1814, -0.3], [124, 1812.6, 3.6]]) s.spot('chat', x, gy(x, z), z, yaw, { tags: ['shore', 'swimmers'] });
  for (const [x, z] of [[131, 1774], [129.5, 1794.5]]) s.spot('sit', x, gy(x, z) + 0.05, z, Math.PI / 2, { tags: ['shore', 'sand'], low: true });
  s.interact({ x: 132, y: 0.6, z: 1812, radius: 2.4, prompt: 'Watch the water come in', onUse: async (gm) => {
    await say(gm, { name: 'The lake', colour: '#9fd0e0' }, ['A wave comes in slow and tall, takes its time folding over, and goes back the way it came as if it had forgotten something.', 'Spinward and anti the lake curves up and up, until far along the shore the water stands on its side with swimmers on it.']);
    found(gm, 'slow-waves');
  } });
  let lap = null;
  s.trigger({ box: [100, -4, 1760, 150, 8, 1870], onEnter: (gm) => { if (!lap && gm.loopAt) lap = gm.loopAt('water-lap', f, 134, LAND.WATER, 1805, { vol: 0.5, radius: 30 }); } });
  s.path([[116, 0.1, 1800], [RXF + 3.0, gy(RXF + 3, CZ), CZ], [RXF + 2.2, RFY, CZ], [CX + 1.1, RFY, CZ + 0.4]]);
  s.path([[116, 0.1, 1800], [126, gy(126, 1784), 1784], [130, gy(130, 1774), 1774]]);
  s.path([[RXF + 3.0, gy(RXF + 3, CZ), CZ], [122, gy(122, 1846), 1846]]);
  zone(s, { id: 'lakeshore', place: 'lakeshore', box: [100, -4, 1760, 152, 30, 1870], name: 'The lake shore', sub: 'Chervil’s lake, two metres deep' });
  s.finish();
}

// ===================================================================================================================
// 4. The orchard's working corner: the tool shed, crates counted for the feast, step-ladders with soft brushes among
//    the trees, the weighing table, and a chilled winter tent with bare trees inside it.
// ===================================================================================================================
function buildOrchard(game, f) {
  const s = game.world.scope('hollow-orchard', f), g = s.g;
  const r = new Rng(hashStr('orchard'));
  // ---- the shed: tarred boards, a lean-to roof, an open door, ladders racked on the wall
  const SX0 = -372, SX1 = -366.5, SZ0 = 1683, SZ1 = 1687.5, SY = maxGround(SX0, SZ0, SX1, SZ1, 0.5) + 0.12, SH = 2.5;
  block(s, SX0 - 0.1, SY - 0.6, SZ0 - 0.1, SX1 + 0.1, SY, SZ1 + 0.1, 'planks', '#8a7a62', { surf: 'wood' });
  const wo = { tint: '#54483c', mat: 'flute', skirt: false, t: 0.12 };
  wall(s, SX0, SZ0, SX1, SZ0, SY, SH + 0.5, wo);
  wall(s, SX0, SZ0, SX0, SZ1, SY, SH, Object.assign({}, wo));
  wall(s, SX1, SZ0, SX1, SZ1, SY, SH, Object.assign({}, wo, { openings: [{ at: 1.6, w: 1.2, h: 2.05 }] }));
  wall(s, SX0, SZ1, SX1, SZ1, SY, SH, Object.assign({}, wo, { openings: [{ at: 0.6, w: 1.0, h: 0.8, sill: 1.1 }] }));
  s.furniture(() => {
    g.mat('flute', '#4f7a3a'); g.quad([SX0 - 0.35, SY + SH + 0.55, SZ0 - 0.4], [SX0 - 0.35, SY + SH - 0.05, SZ1 + 0.45], [SX1 + 0.35, SY + SH - 0.05, SZ1 + 0.45], [SX1 + 0.35, SY + SH + 0.55, SZ0 - 0.4], { double: true });
    for (const x of [SX0, SX1]) { g.mat('flute', '#3a3430'); g.quad([x, SY + SH, SZ0], [x, SY + SH + 0.5, SZ0], [x, SY + SH, SZ1], [x, SY + SH, SZ1], { double: true }); }
    // the door, standing open, in Dagny's green
    g.mat('paint', '#4f7a3a'); g.box(SX1 + 0.02, SY, SZ0 + 1.6 - 0.04, SX1 + 1.12, SY + 2.03, SZ0 + 1.6);
    g.mat('cast', '#2a2a28'); g.box(SX1 + 0.8, SY + 1.0, SZ0 + 1.6 - 0.07, SX1 + 0.86, SY + 1.1, SZ0 + 1.6 - 0.04);
    // ladders leaning on the back wall outside, and a rack of rakes and a pruning pole
    g.mat('wood', '#b08d5e');
    for (let k = 0; k < 2; k++) { const x0 = SX0 + 0.8 + k * 2.4; for (const dx of [0, 0.5]) g.tube([[x0 + dx, SY, SZ0 - 0.75], [x0 + dx + 0.05, SY + 2.6, SZ0 - 0.1]], 0.025, { segs: 5 }); for (let t = 0.1; t < 1; t += 0.12) g.tube([[x0, SY + 2.6 * t, SZ0 - 0.75 + 0.65 * t], [x0 + 0.5 + 0.05 * t, SY + 2.6 * t, SZ0 - 0.75 + 0.65 * t]], 0.016, { segs: 4 }); }
    g.mat('wood', '#c9a46e'); for (let k = 0; k < 4; k++) { const z = SZ0 + 0.5 + k * 0.28; g.tube([[SX0 - 0.35, SY, z], [SX0 - 0.1, SY + 1.9, z + 0.05]], 0.018, { segs: 4 }); }
    g.mat('cast', '#3a3a36'); for (let k = 0; k < 4; k++) { const z = SZ0 + 0.5 + k * 0.28; g.box(SX0 - 0.13, SY + 1.85, z - 0.16, SX0 - 0.07, SY + 1.9, z + 0.26); }
  });
  s.solid(SX0 - 0.4, SY, SZ0 - 0.8, SX1, SY + 2.6, SZ0);
  prop(s, 'bench', SX1 + 0.55, gy(SX1 + 0.55, SZ1 - 0.8), SZ1 - 0.8, Math.PI / 2, { w: 1.6, wood: '#7a5233' });
  s.furniture(() => {
    const bx = SX0 + 1.0, bz = SZ1 + 0.7, by = gy(bx, bz);
    g.mat('wood', '#5a4a3a'); g.lathe(bx, bz, [[0.0, by], [0.3, by], [0.34, by + 0.45], [0.31, by + 0.9], [0.0, by + 0.9]], { segs: 14 });
    g.mat('cast', '#3a3a36'); for (const y of [0.18, 0.72]) g.lathe(bx, bz, [[0.33, by + y], [0.345, by + y + 0.03], [0.33, by + y + 0.06]], { segs: 14, capBottom: false, capTop: false });
    g.mat('plain', '#4a6a70', { rough: -0.4 }); g.cyl(bx, by + 0.86, bz, 0.29, 0.01, { segs: 14 });
    g.mat('paint', '#4f7a3a'); g.box(SX1 - 1.0, SY + 1.0, SZ1 + 0.05, SX1 - 0.1, SY + 1.18, SZ1 + 0.3, { bevel: 0.01 });
  });
  planter(s, SX1 - 0.55, SY + 1.0, SZ1 + 0.18, { w: 0.8, d: 0.2, h: 0.18, plants: 'flower', tint: '#4f7a3a' });
  s.post(SX0 + 1.0, SZ1 + 0.7, 0.33, gy(SX0 + 1, SZ1 + 0.7), gy(SX0 + 1, SZ1 + 0.7) + 0.9);
  // inside: a bench, brushes on hooks, a lamp
  prop(s, 'counter', SX0 + 0.5, SY, (SZ0 + SZ1) / 2, Math.PI / 2, { w: 3.6, d: 0.6, h: 0.9, body: '#5a4a3a', top: '#8a6a48' }, { noSpots: true });
  s.detail(() => {
    for (let k = 0; k < 10; k++) { const z = SZ0 + 0.5 + k * 0.38, y = SY + 1.6; g.mat('cast', PAL.brass); g.tube([[SX0 + 0.08, y + 0.08, z], [SX0 + 0.15, y + 0.06, z]], 0.006, { segs: 3 }); g.mat('wood', '#d9b25c'); g.tube([[SX0 + 0.14, y + 0.05, z], [SX0 + 0.14, y - 0.12, z]], 0.012, { segs: 5 }); g.mat('felt', ['#f1e2c0', '#e8d8b8', '#f5e8cc'][k % 3]); g.lathe(SX0 + 0.14, z, [[0, y - 0.24], [0.03, y - 0.23], [0.036, y - 0.18], [0.02, y - 0.125], [0, y - 0.12]], { segs: 8 }); }
    for (let k = 0; k < 5; k++) prop(s, 'crock', SX0 + 0.45, SY + 0.9, SZ0 + 0.5 + k * 0.7, 0, { glaze: ['#e8d9b8', '#8a5a3c', '#2f6f73'][k % 3], h: 0.2, r: 0.07 });
  });
  lamp(s, 'globe', (SX0 + SX1) / 2, SY + 2.2, (SZ0 + SZ1) / 2, { drop: 0.25, K: 3000, power: 0.6, range: 5, clip: [SX0, SY - 0.2, SZ0, SX1, SY + SH + 0.6, SZ1] });
  lamp(s, 'sconce', SX1 + 0.12, SY + 2.25, SZ0 + 2.9, { face: 'X', K: 2900, power: 0.8, range: 7, night: true });
  sign(s, { kind: 'plate', text: 'BRUSH CREW', sub: "Dagny Vos · rows 9 to 16" }, SX1 + 0.07, SY + 2.3, SZ0 + 1.0, { face: 'X', w: 0.5, h: 0.2 });
  s.interact({ x: SX0 + 0.4, y: SY + 1.4, z: SZ0 + 2.2, radius: 1.5, prompt: (gm) => gm.flags && gm.flags.hasBrush ? 'Hang the brush back up' : 'Take a soft brush', onUse: async (gm) => {
    gm.flags = gm.flags || {};
    if (gm.flags.hasBrush) { gm.flags.hasBrush = false; if (gm.inv && gm.inv.take) gm.inv.take('brush'); toast(gm, 'You hang the brush back on its hook, bristles down.'); return; }
    gm.flags.hasBrush = true; if (gm.inv && gm.inv.give) gm.inv.give('brush'); sfx(gm, 'brush', f, SX0 + 0.3, SY + 1.4, SZ0 + 2.2);
    await say(gm, who('dagny', 'Dagny'), ["Take that one, it's soft. Up the ladder, a touch to each open flower, then the next tree. No bees. Nobody here has ever seen a bee.", "Every blossom in these rows was done by hand. That's why the apples are counted."]);
    found(gm, 'hand-pollinated');
  } });

  // ---- crates counted for the feast, stacked in the yard and labelled
  const crates = []; const labels = ['Ropewalk hall: 190', 'Hassock hall: 180', 'Ring 2 hall: 200', 'Tallow Row: 150', 'The green: 120', 'Elders’ terrace: 40'];
  for (let st = 0; st < 6; st++) {
    const bx = -361.5 + (st % 3) * 1.6, bz = 1695.5 + Math.floor(st / 3) * 1.4, y = gy(bx, bz), n = 2 + ((st * 5) % 3);
    for (let k = 0; k < n; k++) prop(s, 'hollow.applecrate', bx + r.f(-0.04, 0.04), y + k * 0.33, bz + r.f(-0.04, 0.04), r.f(-0.06, 0.06), { seed: st * 10 + k, label: true, full: k === n - 1 });
    crates.push([bx, bz, y + n * 0.33, labels[st]]);
  }
  for (const [bx, bz, yTop, text] of crates) sign(s, { kind: 'label', text: text.split(':')[0].toUpperCase(), sub: 'feast apples · counted ·' + text.split(':')[1] }, bx, yTop - 0.17, bz + 0.195, { face: 'Z', w: 0.42, h: 0.13 });
  s.interact({ x: -360, y: 0.9, z: 1697.5, radius: 2.2, prompt: 'Read the crate labels', onUse: async (gm) => {
    await say(gm, { name: 'The crate labels', colour: '#e7b547' }, ['Ropewalk hall: 190. Hassock hall: 180. Ring 2 hall: 200. Tallow Row: 150. The green: 120. Elders’ terrace: 40.', 'One apple for every two people, cut crosswise so the table sees the star. Every crate counted twice, and initialled.', 'At the bottom, in pencil: lit free by the line, still 4.4 each, the light saved goes to the commons.']);
    found(gm, 'free-light');
  } });
  s.interact({ x: -358.0, y: 0.9, z: 1696, radius: 1.4, prompt: (gm) => gm.flags && gm.flags.carryingApples ? 'Set the crate down' : 'Carry a crate of apples', onUse: (gm) => {
    gm.flags = gm.flags || {};
    if (gm.flags.carryingApples) { gm.flags.carryingApples = false; toast(gm, 'You set the crate down on the stack, gently. Nobody wants a bruised star.'); sfx(gm, 'clunk', f, -358, 0.4, 1696); return; }
    gm.flags.carryingApples = true; sfx(gm, 'clunk', f, -358, 0.4, 1696);
    toast(gm, 'A crate of feast apples, counted. At half a g it weighs about what a sack of flour does downstairs.', 'thread');
  } });
  // the weighing table, and Dagny's post by it
  const WX = -363.4, WZ = 1691.5; prop(s, 'hollow.weightable', WX, gy(WX, WZ), WZ, Math.PI, {}, { noSpots: true });
  s.spot('work', WX, gy(WX, WZ), WZ + 0.75, Math.PI, { who: 'dagny', tags: ['orchard', 'weigh', 'keeper'] });
  s.spot('work', WX + 1.2, gy(WX, WZ), WZ - 0.75, 0, { tags: ['orchard', 'carry'] });
  sign(s, { kind: 'chalk', title: 'Weighed today', lines: ['Russet · 61 kg', 'Bramble red · 48 kg', 'Late gold · 30 kg', 'Bruised: 3, to the jam'] }, WX + 0.48, gy(WX, WZ) + 0.95, WZ + 0.36, { face: 'Z', w: 0.5, h: 0.42 });
  for (const [x, z] of [[-359, 1693.2], [-357.4, 1698.6], [-362.6, 1699]]) s.spot('work', x, gy(x, z), z, r.f(0, 6.28), { tags: ['orchard', 'carry'] });
  noticePost(s, -352.5, 1691.5, Math.PI / 2, SIGNS['orchard.notice']);
  // ---- step-ladders among the real trees, a brush hung on each; a row-end label
  const trees = []; for (let iz = Math.floor(1700 / TREE_CELL); iz <= Math.ceil(1745 / TREE_CELL); iz++) for (let ix = Math.floor(-392 / TREE_CELL); ix <= Math.ceil(-345 / TREE_CELL); ix++) { const t = treeInCell(ix, iz, TREE_CELL); if (t && t.sp === 0) trees.push([t.x, t.z, t.s]); }
  trees.sort((a, b) => Math.hypot(a[0] - OX, a[1] - OZ) - Math.hypot(b[0] - OX, b[1] - OZ));
  trees.slice(0, 7).forEach(([x, z, sc], i) => {
    const a = i * 2.1 + 0.4, lx = x + Math.cos(a) * 1.15, lz = z + Math.sin(a) * 1.15, yaw = Math.atan2(x - lx, z - lz) + Math.PI;
    prop(s, 'hollow.stepladder', lx, gy(lx, lz), lz, yaw, { h: 2.0 + sc * 0.3, brush: i % 3 !== 2 }, { spot: { tags: ['brush', 'pick', 'orchard'] } });
    s.spot('work', x + Math.cos(a + 1.8) * 1.0, gy(x, z), z + Math.sin(a + 1.8) * 1.0, a + Math.PI, { tags: ['pick', 'orchard'] });
    if (i < 3) prop(s, 'hollow.applecrate', x + Math.cos(a - 1.4) * 1.1, gy(x, z), z + Math.sin(a - 1.4) * 1.1, a, { seed: 90 + i, full: i !== 1 });
  });
  if (trees.length) {
    const [x, z] = trees[0];
    s.furniture(() => { g.mat('wood', '#8a6a48'); g.box(x + 1.6 - 0.04, gy(x, z) - 0.2, z - 1.6 - 0.04, x + 1.6 + 0.04, gy(x, z) + 0.95, z - 1.6 + 0.04); });
    sign(s, SIGNS['orchard.label'], x + 1.6 + 0.045, gy(x, z) + 0.8, z - 1.6, { face: 'X', w: 0.5, h: 0.16 });
    s.interact({ x: trees[0][0], y: gy(x, z) + 1.6, z: trees[0][1], radius: 2.2, prompt: 'Look for blossom', onUse: (gm) => say(gm, { name: 'Row 14, russet', colour: '#cfe0a0' }, ['The blossom is long over: small hard apples hang in clusters of two and three, and the ones for the feast went last week.', 'On the bark at shoulder height, a chalk tick for every time the crew came through. A lot of ticks.']) });
  }
  lamp(s, 'pole', -355.5, gy(-355.5, 1694), 1694, { h: 3.2, K: 2900, power: 0.9, range: 12, night: true });

  // ---- the winter tent: a long white ribbed barrel over bare trees, held at four degrees
  const TX = -370.5, T0 = 1648, T1 = 1672, TW = 4.6, TH = 4.7, TY = maxGround(TX - TW, T0, TX + TW, T1, 1) + 0.02;
  const arc = (t) => [TX - Math.cos(t * Math.PI) * TW, TY + Math.sin(t * Math.PI) * TH];
  const NA = 14, ribs = [];
  for (let z = T0; z <= T1 + 0.01; z += 3) ribs.push(z);
  s.furniture(() => {
    // the fabric: one strip per rib bay, sagging a little between the ribs, seen from both sides
    for (let b = 0; b < ribs.length - 1; b++) {
      const z0 = ribs[b], z1 = ribs[b + 1], zm = (z0 + z1) / 2;
      for (let k = 0; k < NA; k++) {
        const p = arc(k / NA), q = arc((k + 1) / NA), sg = 0.1;
        const pm = [TX + (p[0] - TX) * (1 - sg / TW), TY + (p[1] - TY) * (1 - sg / TH)], qm = [TX + (q[0] - TX) * (1 - sg / TW), TY + (q[1] - TY) * (1 - sg / TH)];
        g.mat('weave', k % 2 ? '#eef0ea' : '#e6e9e4');
        g.quad([p[0], p[1], z0], [q[0], q[1], z0], [qm[0], qm[1], zm], [pm[0], pm[1], zm], { double: true });
        g.quad([pm[0], pm[1], zm], [qm[0], qm[1], zm], [q[0], q[1], z1], [p[0], p[1], z1], { double: true });
      }
    }
    g.mat('cast', '#d8dcd8');
    for (const z of ribs) { const pts = []; for (let k = 0; k <= NA; k++) { const p = arc(k / NA); pts.push([p[0], p[1] + 0.03, z]); } g.tube(pts, 0.05, { segs: 5 }); }
    g.tube([[TX, TY + TH + 0.04, T0], [TX, TY + TH + 0.04, T1]], 0.05, { segs: 5 });
    // the closed north end and the south end with its doorway, flaps tied back
    for (const [z, door] of [[T0, false], [T1, true]]) {
      g.mat('weave', '#e9ece6');
      for (let k = 0; k < NA; k++) { const p = arc(k / NA), q = arc((k + 1) / NA), yb = door && (k === 6 || k === 7) ? TY + 2.3 : TY; g.quad([p[0], yb, z], [q[0], yb, z], [q[0], q[1], z], [p[0], p[1], z], { double: true }); }
      if (door) {
        const dx = TX - arc(6 / NA)[0];
        g.mat('weave', '#dfe3de', { sway: 0.4 }); for (const sx of [-1, 1]) g.sheet([TX + sx * dx, TY + 2.3, z + 0.02], [TX + sx * (dx + 0.5), TY + 2.3, z + 0.06], [TX + sx * (dx + 0.6), TY + 0.0, z + 0.1], [TX + sx * (dx + 0.05), TY + 0.0, z + 0.04], { nu: 3, nv: 4, ripple: 0.05, rippleN: 3 });
        g.mat('weave', '#2f6f73'); for (const sx of [-1, 1]) g.tube([[TX + sx * (dx + 0.05), TY + 1.1, z + 0.08], [TX + sx * (dx + 0.6), TY + 1.15, z + 0.12]], 0.02, { segs: 4 });
        g.mat('wood', '#6b4a2f'); g.box(TX - dx - 0.04, TY, z - 0.04, TX - dx + 0.04, TY + 2.35, z + 0.04); g.box(TX + dx - 0.04, TY, z - 0.04, TX + dx + 0.04, TY + 2.35, z + 0.04); g.box(TX - dx, TY + 2.3, z - 0.04, TX + dx, TY + 2.38, z + 0.04);
      }
    }
    // guy ropes and pegs along both sides
    g.mat('weave', '#cfc6b0'); for (const z of ribs) for (const sx of [-1, 1]) { const p = arc(sx < 0 ? 0.22 : 0.78); g.tube([[p[0], p[1], z], [TX + sx * (TW + 1.3), gy(TX + sx * (TW + 1.3), z) + 0.1, z]], 0.008, { segs: 3, caps: false }); }
  });
  for (const sx of [-1, 1]) s.solid(TX + sx * TW - 0.15, TY - 0.5, T0, TX + sx * TW + 0.15, TY + 2.0, T1);
  s.solid(TX - TW, TY - 0.5, T0 - 0.1, TX + TW, TY + 2.5, T0 + 0.1);
  s.solid(TX - TW, TY - 0.5, T1 - 0.1, TX - 1.05, TY + 2.5, T1 + 0.1); s.solid(TX + 1.05, TY - 0.5, T1 - 0.1, TX + TW, TY + 2.5, T1 + 0.1);
  // inside: frosted ground, a duckboard walk, eight bare trees in two rows, the thermometer
  floor(s, TX - TW + 0.3, T0 + 0.1, TX + TW - 0.3, T1 - 0.1, TY + 0.03, 'sand', '#b9c6cf', { surf: 'gravel' });
  floor(s, TX - 0.7, T0 + 0.6, TX + 0.7, T1 + 1.2, TY + 0.1, 'planks', '#9a8a70', { surf: 'wood' });
  s.structure(() => { g.mat('wood', '#6f6252'); for (let z = T0 + 0.8; z < T1 + 1.2; z += 0.6) g.box(TX - 0.7, TY + 0.03, z - 0.05, TX + 0.7, TY + 0.1, z + 0.05, { faces: 'xXzZ' }); });
  s.detail(() => { for (let k = 0; k < 4; k++) for (const sx of [-1, 1]) { const z = T0 + 3.5 + k * 5.6, x = TX + sx * 2.5; bareTree(g, x, TY + 0.03, z, k * 2 + (sx > 0 ? 1 : 0), 0.95); } });
  s.detail(() => { g.mat('plain', '#f4f8fa', { rough: 0.2 }); for (let k = 0; k < 40; k++) { const x = TX + r.f(-TW + 0.6, TW - 0.6), z = r.f(T0 + 0.5, T1 - 0.5); if (Math.abs(x - TX) < 0.8) continue; g.box(x - 0.2, TY + 0.031, z - 0.12, x + 0.2, TY + 0.037, z + 0.12, { faces: 'Y' }); } });
  {
    const x = TX + 1.1, z = T1 - 1.6, y = TY + 0.03;
    s.furniture(() => {
      g.mat('wood', '#6b4a2f'); g.box(x - 0.04, y, z - 0.04, x + 0.04, y + 1.55, z + 0.04);
      g.push(); g.move(x, y + 1.45, z + 0.05); g.rotX(Math.PI / 2); g.mat('cast', PAL.brass); g.cyl(0, -0.02, 0, 0.17, 0.05, { segs: 20 }); g.mat('plain', '#f4efe2'); g.cyl(0, 0.03, 0, 0.145, 0.004, { segs: 20 }); g.pop();
      g.mat('cast', '#c4472c'); g.box(x - 0.005, y + 1.45, z + 0.085, x + 0.005, y + 1.56, z + 0.09);
      g.mat('cast', '#2a2a28'); for (let k = 0; k < 9; k++) { const a = -2.2 + k * 0.55; g.box(x + Math.sin(a) * 0.12 - 0.004, y + 1.45 + Math.cos(a) * 0.12 - 0.004, z + 0.084, x + Math.sin(a) * 0.12 + 0.004, y + 1.45 + Math.cos(a) * 0.12 + 0.004, z + 0.088); }
    });
    sign(s, { kind: 'plate', text: 'FOUR DEGREES', sub: 'six weeks · then blossom' }, x, y + 1.12, z + 0.045, { face: 'Z', w: 0.4, h: 0.17 });
    s.post(x, z, 0.06, y, y + 1.6);
  }
  // the chiller outside the closed end, with its duct through the fabric
  s.furniture(() => {
    const cx = TX + 2.2, cz = T0 - 1.6, y = gy(cx, cz);
    g.mat('panel', '#b9c2c4'); g.box(cx - 0.8, y, cz - 0.6, cx + 0.8, y + 1.3, cz + 0.6, { bevel: 0.02 });
    g.mat('cast', '#3a4044'); g.push(); g.move(cx, y + 0.75, cz - 0.61); g.rotX(Math.PI / 2); g.cyl(0, 0, 0, 0.45, 0.02, { segs: 18 }); g.pop();
    g.mat('grille', '#6a7276'); g.box(cx - 0.45, y + 0.3, cz - 0.64, cx + 0.45, y + 1.2, cz - 0.63, { faces: 'z' });
    g.mat('weave', '#cfd6d8'); g.tube([[cx, y + 1.3, cz + 0.2], [cx, y + 1.9, cz + 0.6], [cx - 0.3, y + 2.1, T0 + 0.05]], 0.22, { segs: 10 });
  });
  s.solid(TX + 1.4, gy(TX + 2.2, T0 - 1.6), T0 - 2.2, TX + 3.0, gy(TX + 2.2, T0 - 1.6) + 1.3, T0 - 1.0);
  let chill = null;
  s.trigger({ box: [TX - 12, -2, T0 - 12, TX + 12, 8, T1 + 8], onEnter: (gm) => { if (!chill && gm.loopAt) chill = gm.loopAt('air', f, TX + 2.2, 1, T0 - 1.6, { vol: 0.35, radius: 14 }); } });
  // cold light: strips along the ridge, a blue-white wash
  const tclip = [TX - TW - 0.2, TY - 0.5, T0 - 0.2, TX + TW + 0.2, TY + TH + 0.3, T1 + 0.2];
  lamp(s, 'strip', TX, TY + TH - 0.55, T0 + 2, { to: [TX, TY + TH - 0.55, (T0 + T1) / 2 - 0.5], K: 6800, power: 0.9, range: 7, clip: tclip });
  lamp(s, 'strip', TX, TY + TH - 0.55, (T0 + T1) / 2 + 0.5, { to: [TX, TY + TH - 0.55, T1 - 2], K: 6800, power: 0.9, range: 7, clip: tclip });
  s.ambient({ box: [TX - TW, TY - 0.3, T0, TX + TW, TY + TH, T1], sky: '#dcecff', ground: '#b4c8d8', power: 0.9, soft: 0.6, spec: 0.3 });
  s.trigger({ box: [TX - TW + 0.3, TY - 1, T0 + 0.3, TX + TW - 0.3, TY + 3, T1 - 0.4], onEnter: (gm) => {
    gm.flags = gm.flags || {};
    if (!gm.flags.sawWinterTent) { gm.flags.sawWinterTent = true; card(gm, 'The winter tent', 'Four degrees, six weeks', 'The only winter you can walk into. Apple trees will not bloom without six weeks of cold, so the orchard takes its winters a tent at a time.'); }
    else toast(gm, 'Four degrees. Your breath shows.');
  } });
  zone(s, { id: 'winter-tent', place: 'orchard', box: [TX - TW + 0.2, -3, T0, TX + TW - 0.2, TY + TH, T1 - 0.3], name: 'The winter tent', sub: 'four degrees, six weeks', reverb: 'felt', sky: false, sun: false, headroom: 4, env: { exposure: 1.0, autoKey: 0.17, autoMin: 0.05, autoMax: 4, bloom: 0.04, warmth: -0.32, contrast: 1.04, saturation: 0.82 } });
  s.spot('stand', TX + 0.3, TY + 0.1, T0 + 6, Math.PI, { tags: ['orchard', 'tent'] }); s.spot('work', TX - 1.6, TY + 0.03, T0 + 9.1, -Math.PI / 2, { tags: ['orchard', 'tent', 'prune'] });
  // walks
  s.path([[-352.5, gy(-352.5, 1688), 1688], [WX + 1.5, gy(WX + 1.5, WZ + 1.5), WZ + 1.5], [SX1 + 1.5, gy(SX1 + 1.5, SZ0 + 2.2), SZ0 + 2.2], [SX1 - 0.6, SY, SZ0 + 2.2]]);
  s.path([[WX + 1.5, gy(WX + 1.5, WZ + 1.5), WZ + 1.5], [-360, gy(-360, 1697.5), 1697.5]]);
  s.path([[SX1 + 1.5, gy(SX1 + 1.5, SZ0 + 2.2), SZ0 + 2.2], [TX, TY + 0.1, T1 + 1.0], [TX, TY + 0.1, T0 + 1.5]]);
  zone(s, { id: 'orchard-yard', place: 'orchard', box: [-388, -3, 1640, -348, 30, 1735], name: 'The orchard rows', sub: 'the brush crew’s corner' });
  s.finish();
}

// ===================================================================================================================
// 5. The kite field: kites tethered on long lines above their stakes, a kite-mender's cart, a wind-arrow joke.
// ===================================================================================================================
function buildKites(game, f) {
  const s = game.world.scope('hollow-kites', f), g = s.g;
  const r = new Rng(hashStr('kites'));
  const KITES = [[-30, -18, 20, 'diamond'], [-12, 10, 34, 'delta'], [8, -24, 48, 'diamond'], [24, 6, 15, 'box'], [-40, 22, 27, 'delta'], [36, -8, 40, 'diamond'], [-2, 28, 58, 'delta']];
  const kcols = [['#efe6d2', '#d9472b', '#3b4a8f'], ['#d9472b', '#e7b547', '#2f8f8a'], ['#3b4a8f', '#efe6d2', '#d9472b'], ['#b8336a', '#2f8f8a', '#e7b547'], ['#e7b547', '#d9472b', '#3b4a8f'], ['#6b9f3e', '#efe6d2', '#b8336a'], ['#2f8f8a', '#f08a3a', '#efe6d2']];
  KITES.forEach(([dx, dz, h, shape], i) => {
    const sx = KX + dx, sz = KZ + dz, y = gy(sx, sz);
    s.furniture(() => { g.mat('wood', '#6b4a2f'); g.box(sx - 0.05, y - 0.2, sz - 0.05, sx + 0.05, y + 1.1, sz + 0.05, { bevel: 0.01 }); g.mat('wood', '#c9a46e'); g.push(); g.move(sx, y + 0.9, sz + 0.07); g.rotX(Math.PI / 2); g.lathe(0, 0, [[0.12, -0.03], [0.12, 0.0], [0.07, 0.01], [0.07, 0.07], [0.12, 0.08], [0.12, 0.1]], { segs: 12 }); g.pop(); g.mat('paint', kcols[i % kcols.length][0]); g.box(sx - 0.055, y + 0.5, sz - 0.055, sx + 0.055, y + 0.62, sz + 0.055); });
    s.post(sx, sz, 0.07, y, y + 1.1);
    const kx = sx + 6 + h * 0.35, kz = sz + r.f(-6, 6);
    kite(s, sx, y + 1.0, sz + 0.07, kx, y + h, kz, { cols: kcols[i % kcols.length], shape, size: (shape === 'box' ? 2.0 : 2.4) + h / 40, tail: 3.2, seed: i });
    for (let k = 0; k < 2; k++) s.spot('play', sx - 2 - k * 2.5 + r.f(-1, 1), y, sz + r.f(-2, 2), Math.PI / 2 + r.f(-0.4, 0.4), { tags: ['kids', 'kitefield', 'kite'] });
  });
  // the mender's cart, a bench, the notice, the wind arrow
  const CX = KX - 34, CZ = KZ - 18;
  prop(s, 'hollow.kitecart', CX, gy(CX, CZ), CZ, Math.PI * 0.1, {});
  prop(s, 'bench', CX + 3.2, gy(CX + 3.2, CZ - 1.4), CZ - 1.4, Math.PI * 0.5, { w: 1.8, back: true, wood: '#8a5a33' });
  prop(s, 'hollow.applecrate', CX - 1.6, gy(CX - 1.6, CZ + 0.6), CZ + 0.6, 0.3, { full: false, wood: '#9a7a52' });
  prop(s, 'hollow.windvane', CX + 4.5, gy(CX + 4.5, CZ + 3.5), CZ + 3.5, 0.2, {});
  sign(s, { kind: 'plate', text: 'WIND TODAY: NONE', sub: 'tomorrow: none · walk backwards' }, CX + 4.5, gy(CX + 4.5, CZ + 3.5) + 1.6, CZ + 3.5 + 0.052, { face: 'Z', w: 0.5, h: 0.2 });
  noticePost(s, CX + 2.4, CZ + 3.2, Math.PI, SIGNS['kitefield.notice']);
  s.interact({ x: CX, y: 1.2, z: CZ + 1.0, radius: 1.8, prompt: 'Borrow a kite', onUse: async (gm) => {
    gm.flags = gm.flags || {};
    await say(gm, who('tavi', 'Tavi'), gm.flags.hasKite ? ['You have one already. Walk backwards. Faster. No, backwards.'] : ['You can have the blue one. It has four patches and they all fly.', "There's no wind, so you walk backwards and it comes up after you. Aim it at the far bank. Somebody up there might be aiming one back."]);
    if (!gm.flags.hasKite) { gm.flags.hasKite = true; if (gm.inv && gm.inv.give) gm.inv.give('kite'); sfx(gm, 'kite-snap', f, CX, 1.5, CZ); }
    found(gm, 'walking-kites');
  } });
  s.interact({ x: CX + 4.5, y: 1.4, z: CZ + 3.8, radius: 1.0, prompt: 'Read the wind arrow', onUse: (gm) => toast(gm, 'The arrow hangs straight down from its cross. Someone has painted under it: as usual.') });
  s.spot('counter', CX + 0.2, gy(CX, CZ), CZ - 0.95, Math.PI * 0.1, { tags: ['kitefield', 'mend'] });
  lamp(s, 'pole', CX + 2.0, gy(CX + 2.0, CZ - 3.0), CZ - 3.0, { h: 3.2, K: 2900, power: 0.8, range: 11, night: true });
  picnic(s, KX + 46, KZ + 30, 0.6, 40); picnic(s, KX - 48, KZ + 24, 2.1, 41); picnic(s, KX + 10, KZ + 36, 1.3, 42);
  s.path([[CX + 2.0, gy(CX + 2, CZ + 1.5), CZ + 1.5], [KX, gy(KX, KZ), KZ], [KX + 30, gy(KX + 30, KZ), KZ]]);
  zone(s, { id: 'kitefield', place: 'kitefield', box: [KX - 65, -3, KZ - 48, KX + 65, 60, KZ + 48], name: 'The kite field', sub: 'no wind, as usual' });
  s.finish();
}

// ===================================================================================================================
// 6. Along the walks: lamp posts, benches facing the views, signposts at the crossings, taps, a picnic or two.
// ===================================================================================================================
function buildFurniture(game, f) {
  const s = game.world.scope('hollow-furniture', f), g = s.g;
  const r = new Rng(hashStr('walks'));
  const keepOut = [[PX, PZ, 16], [-50, 1816, 40], [BX, BZ, 12], [40, 1793, 6], [125, 1815, 30], [-366, 1685, 30], [KX, KZ, 60]];
  const clear = (x, z, pad = 0) => !keepOut.some(([cx, cz, rr]) => Math.hypot(x - cx, z - cz) < rr + pad);
  const pd = (x, z) => landAt(x, z).pd;
  // find points on the centre lines of the walks: start from a grid and slide down the distance field
  const pts = [];
  for (let gz = 1700 - 400; gz <= 1700 + 400; gz += 18) for (let gx = -400; gx <= 400; gx += 18) {
    if (Math.hypot(gx, gz - 1700) > 390) continue;
    let x = gx, z = gz, d = pd(x, z); if (d > 12) continue;
    for (let it = 0; it < 14 && d > 0.15; it++) { const ex = (pd(x + 0.5, z) - pd(x - 0.5, z)), ez = (pd(x, z + 0.5) - pd(x, z - 0.5)), gl = Math.hypot(ex, ez) || 1; x -= ex / gl * d * 0.9; z -= ez / gl * d * 0.9; d = pd(x, z); }
    if (d > 0.4) continue;
    const l = landAt(x, z); if (l.biome !== BIOME.PATH) continue;
    pts.push([x, z]);
  }
  // the direction across the walk at a point: the way the distance grows fastest
  const across = (x, z) => { let best = 0, bd = -1; for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, d = pd(x + Math.cos(a) * 3, z + Math.sin(a) * 3); if (d > bd) { bd = d; best = a; } } return best; };
  // the arms of a crossing: how many separate runs of path lie on a circle round the point
  const arms = (x, z) => { const on = []; for (let k = 0; k < 32; k++) { const a = k * Math.PI / 16; on.push(pd(x + Math.cos(a) * 8, z + Math.sin(a) * 8) < 1.6); } let n = 0; for (let k = 0; k < 32; k++) if (on[k] && !on[(k + 31) % 32]) n++; return n; };
  const lamps = [], benches = [], posts = [];
  const far = (list, x, z, d) => list.every((p) => Math.hypot(p[0] - x, p[1] - z) > d);
  for (const [x, z] of pts) {
    if (!clear(x, z, 4)) continue;
    const dist = Math.hypot(x, z - 1700);
    const n = arms(x, z);
    if (n >= 3 && dist < 380 && far(posts, x, z, 60)) { posts.push([x, z]); continue; }
    if (dist < 360 && far(lamps, x, z, 44) && lamps.length < 34) { lamps.push([x, z]); continue; }
    if (dist < 380 && far(benches, x, z, 50) && far(lamps, x, z, 8) && benches.length < 16) benches.push([x, z]);
  }
  // lamp posts, just off the gravel
  for (const [x, z] of lamps) { const a = across(x, z), lx = x + Math.cos(a) * 2.3, lz = z + Math.sin(a) * 2.3; const l = landAt(lx, lz); if (l.biome === BIOME.LAKE || l.biome === BIOME.BEACH) continue; lamp(s, 'pole', lx, gy(lx, lz), lz, { h: 3.3, K: 2850, power: 0.9, range: 12, night: true, metal: PAL.iron }); }
  // benches facing away from the walk, toward the view; the lake gets more of them
  for (const [x, z] of benches) {
    const a = across(x, z), bx = x + Math.cos(a) * 2.6, bz = z + Math.sin(a) * 2.6; const l = landAt(bx, bz); if (l.biome === BIOME.LAKE || l.tree > 0.5) continue;
    const yaw = Math.PI / 2 - a;
    prop(s, 'bench', bx, gy(bx, bz), bz, yaw, { w: 1.9, back: true, wood: r.pick(['#8a5a33', '#7a5233', '#9a6f48']), metal: PAL.iron });
    if (r.chance(0.3)) { const q = [bx + Math.cos(a) * 1.2 + Math.sin(a) * 1.4, bz + Math.sin(a) * 1.2 - Math.cos(a) * 1.4]; prop(s, 'plant', q[0], gy(q[0], q[1]), q[1], 0, { kind: 'flower', size: 0.8, pot: r.pick(['#b5653a', '#2f6f73', '#c48a3a']) }); }
  }
  // signposts at the crossings: arms toward the lake, the pavilion, the green, the orchard, the walls
  const targets = [['The lake', 140, 1800], ['The lake pavilion', PX, PZ], ['The festival green', -30, 1815], ['The orchard rows', -366, 1690], ['The kite field', KX, KZ], ['The robe house', 112, 1820]];
  for (const [x, z] of posts.slice(0, 7)) {
    const used = {}; const list = [];
    const dirOf = (dx, dz) => Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'X' : 'x') : (dz > 0 ? 'Z' : 'z');
    const sorted = targets.map((t) => [t, Math.hypot(t[1] - x, t[2] - z)]).filter((q) => q[1] > 30).sort((a, b) => a[1] - b[1]);
    for (const [t, d] of sorted) { const dir = dirOf(t[1] - x, t[2] - z); if (used[dir]) continue; used[dir] = 1; list.push({ dir, text: t[0], sub: d < 1000 ? Math.round(d / 10) * 10 + ' m' : (d / 1000).toFixed(1) + ' km' }); if (list.length >= 3) break; }
    if (!used.Z) list.push({ dir: 'Z', text: 'Back wall', sub: ((3750 - z) / 1000).toFixed(1) + ' km', col: '#e7b547' });
    else if (!used.z) list.push({ dir: 'z', text: 'Front wall', sub: (z / 1000).toFixed(1) + ' km', col: '#e7b547' });
    const a = across(x, z), sx = x + Math.cos(a) * 2.4, sz = z + Math.sin(a) * 2.4;
    signpost(s, sx, sz, list);
  }
  // taps and a few picnics on the lawns along the walks
  const tapAt = [[-140, 1700], [60, 1640], [-60, 1930]];
  for (const [x0, z0] of tapAt) {
    let best = null, bd = 1e9; for (const [x, z] of pts) { const d = Math.hypot(x - x0, z - z0); if (d < bd && clear(x, z, 2)) { bd = d; best = [x, z]; } }
    if (!best || bd > 60) continue; const a = across(best[0], best[1]) + 0.5, tx = best[0] + Math.cos(a) * 2.2, tz = best[1] + Math.sin(a) * 2.2;
    prop(s, 'hollow.tap', tx, gy(tx, tz), tz, Math.PI / 2 - a + Math.PI, {});
    s.interact({ x: tx, y: gy(tx, tz) + 0.9, z: tz, radius: 1.2, prompt: 'Drink from the tap', onUse: (gm) => toast(gm, 'Cold, and free. Somebody has tied a cup to it with a bright red mend.') });
  }
  const lawnPics = [[-190, 1760, 0.4], [-230, 1790, 2.2], [-250, 1770, 1.0], [-170, 1640, 2.8], [80, 1600, 0.6], [-60, 1980, 1.9], [180, 1660, 0.2], [-210, 1820, 1.4]];
  lawnPics.forEach(([x, z, yaw], i) => { const l = landAt(x, z); if (l.biome === BIOME.PATH || l.biome === BIOME.LAKE || l.tree > 0.3 || !clear(x, z)) return; picnic(s, x, z, yaw, 100 + i); });
  noticePost(s, -190, 1772, 0, SIGNS['lawns.notice']);
  zone(s, { id: 'lawns-west', place: 'lawns', box: [-280, -3, 1730, -150, 30, 1850], name: 'The lawns', sub: 'cloths down, shoes off' });
  s.finish();
}
