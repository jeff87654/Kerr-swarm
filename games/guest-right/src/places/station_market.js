// Station Ring 2: the Quaysides lane, a market of stalls and freight off the platform's south side, and at its far end
// the Gate, Chervil's quarantine for anything alive, seen through a long window. Frame 'station', deck 1, a full g.
import { floor, ceiling, wall, lamp, roomGlow, block } from '../world/kit.js';
import { railing } from '../world/kit2.js';
import { prop, bunting } from '../world/props.js';
import { sign } from '../world/signs.js';
import { door, doorFrame } from '../world/doors.js';
import { ledgerParts, spec, tell, found, flags, painted, drawPlate, drawChalk, seatHere, bulbs, CAPS, SERIF } from './ledger_parts.js';
import { Rng, mixHex, shadeHex, hashStr } from '../core/util.js';

void ledgerParts;
const PI = Math.PI;
const NOOR = { name: 'Noor', colour: '#3a8a8a' };

// A stall's name board, hung from the front of its awning.
function drawStallBoard(name, sub, bg, fg) {
  return (ctx, w, h) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = fg; ctx.globalAlpha = 0.5; ctx.lineWidth = Math.max(1.5, h * 0.04); ctx.strokeRect(h * 0.08, h * 0.08, w - h * 0.16, h - h * 0.16); ctx.globalAlpha = 1;
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let s = Math.round(h * (sub ? 0.46 : 0.6)); ctx.font = 'italic 600 ' + s + 'px ' + SERIF; while (s > 8 && ctx.measureText(name).width > w * 0.86) { s--; ctx.font = 'italic 600 ' + s + 'px ' + SERIF; }
    ctx.fillText(name, w / 2, h * (sub ? 0.4 : 0.52));
    if (sub) { let s2 = Math.round(h * 0.2); ctx.font = '600 ' + s2 + 'px ' + CAPS; while (s2 > 6 && ctx.measureText(sub).width > w * 0.86) { s2--; ctx.font = '600 ' + s2 + 'px ' + CAPS; } ctx.globalAlpha = 0.85; ctx.fillText(sub, w / 2, h * 0.77); ctx.globalAlpha = 1; }
  };
}

export const place = {
  id: 'quayside', name: 'The Quaysides lane and the Gate', order: 13,
  build(game) {
    const f = game.world.frame('station', 3000, 0, 625);
    buildLane(game, f);
    buildGate(game, f);
    game.spawns.quayside = { frame: f, x: 39, y: 0, z: 12.6, yaw: PI };
    game.spawns.gate = { frame: f, x: 41.8, y: 0, z: 50, yaw: PI / 2 };
  },
};

// =====================================================================================================================
// The Quaysides lane: x[34, 44] z[12, 60], 3.6 m high, stalls both sides, freight at the far end.
// =====================================================================================================================
function buildLane(game, f) {
  const s = game.world.scope('quayside', f), g = s.g;
  const X0 = 34, X1 = 44, Z0 = 12, Z1 = 60, H = 3.6;
  const CL = [X0, -0.3, Z0 - 1.5, X1, H + 0.1, Z1];
  const WX = X0 + 0.16 + 1.71, EX = X1 - 0.16 - 1.71;           // stall origins (their back panels against the walls)

  // ---- shell
  floor(s, X0, Z0, X1, Z1, 0, 'stone', '#958b7c');
  ceiling(s, X0, Z0, X1, Z1, H, 'paint', '#2a2f33');
  const LW = { tint: '#c9b48f', dado: { h: 1.0, mat: 'block', tint: '#55665e' }, skirt: '#2a2a26' };
  wall(s, X0 + 0.08, Z0, X0 + 0.08, Z1, 0, H, LW);
  wall(s, X1 - 0.08, Z0, X1 - 0.08, 40, 0, H, LW);
  wall(s, X0, Z1 - 0.08, X1, Z1 - 0.08, 0, H, Object.assign({}, LW, { openings: [{ at: 2.2, w: 5.6, h: 3.0 }] }));
  wall(s, X0, Z0 + 0.08, X1, Z0 + 0.08, 0, 4.0, { tint: '#6a2a24', openings: [{ at: 0.2, w: 9.6, h: 3.0 }], skirt: false });
  sign(s, { kind: 'fascia', text: 'Quaysides', sub: 'market · freight · the Gate', palette: ['#6a2a24', '#f6e6c0', '#e8c242'] }, 39, 3.5, Z0 - 0.003, { face: 'z', w: 5.2, h: 0.6, board: false });
  sign(s, spec('quayside.street'), X0 + 0.17, 2.75, 13.6, { face: 'X', w: 1.1, h: 0.25 });
  // worn paint lines on the floor at the stall fronts, and the loading hatching by the freight lift
  s.deco(() => {
    g.mat('paint', '#c9a23a'); for (const x of [36.4, 41.6]) g.box(x - 0.04, 0, Z0 + 0.4, x + 0.04, 0.004, 40.2, { faces: 'Y' });
    for (let i = 0; i < 14; i++) { g.mat('paint', i % 2 ? '#2a2a28' : '#d9b23a'); g.box(36.2 + i * 0.4, 0, 57.6, 36.6 + i * 0.4, 0.005, 58.0, { faces: 'Y' }); }
  });
  // the ceiling: pipes, a cable tray, hangers
  s.structure(() => {
    g.mat('paint', '#9a3a2a'); g.tube([[35.0, 3.33, Z0 + 0.2], [35.0, 3.33, Z1 - 0.2]], 0.09, { segs: 10 });
    g.mat('paint', '#3a403c', { rough: 0.45 }); g.tube([[38.3, 3.4, Z0 + 0.2], [38.3, 3.4, Z1 - 0.2]], 0.12, { segs: 12 });
    g.mat('paint', '#2f5a7a'); g.tube([[42.9, 3.36, Z0 + 0.2], [42.9, 3.36, Z1 - 0.2]], 0.07, { segs: 8 });
    g.mat('panel', '#3a3e40'); g.box(40.2, 3.42, Z0 + 0.2, 40.8, 3.46, Z1 - 0.2);
  });
  s.deco(() => {
    g.mat('brushed', '#6e6a62');
    for (let z = Z0 + 1; z < Z1 - 0.5; z += 2.4) { g.tube([[35.0, 3.42, z], [35.0, H, z]], 0.015, { segs: 4 }); g.tube([[38.3, 3.52, z], [38.3, H, z]], 0.015, { segs: 4 }); g.box(40.18, 3.46, z - 0.02, 40.82, 3.48, z + 0.02); for (const x of [40.2, 40.8]) g.tube([[x, 3.47, z], [x, H, z]], 0.008, { segs: 4 }); }
    const r = new Rng(5); for (let z = Z0 + 0.5; z < Z1 - 1; z += r.f(0.2, 0.5)) { g.mat('plain', ['#2a2a2a', '#a8392e', '#3a5a3a', '#d9b23a'][r.i(0, 3)]); g.tube([[40.3 + r.f(0, 0.4), 3.465, z], [40.3 + r.f(0, 0.4), 3.465, z + r.f(0.5, 1.6)]], 0.012, { segs: 4, caps: false }); }
  });

  // ---- the stalls
  const L = (o, yaw, lx, lz) => (yaw > 0 ? [o[0] + lz, o[1] - lx] : [o[0] - lz, o[1] + lx]);
  const stalls = [];
  const stall = (side, zc, w, name, sub, body, awn, kind) => {
    const yaw = side < 0 ? PI / 2 : -PI / 2, o = [side < 0 ? WX : EX, zc];
    prop(s, 'station.stall', o[0], 0, o[1], yaw, { w, body, top: '#9a7048' }, { spot: { tags: ['quayside', kind] } });
    // the awning in stripes, sloping out over the lane, and its valance
    s.furniture(() => {
      g.at(o[0], 0, o[1], yaw);
      const n = Math.max(4, Math.round(w / 0.42));
      for (let i = 0; i < n; i++) {
        const x0 = -w / 2 - 0.05 + (w + 0.1) * i / n, x1 = -w / 2 - 0.05 + (w + 0.1) * (i + 1) / n; g.mat('weave', awn[i % awn.length]);
        g.quad([x0, 2.62, 0.3], [x1, 2.62, 0.3], [x1, 2.3, 1.35], [x0, 2.3, 1.35], { double: true });
        g.mat('weave', awn[i % awn.length], { sway: 0.4 }); const v0 = g.buf.nv;
        g.quad([x0, 2.3, 1.35], [x1, 2.3, 1.35], [x1, 2.12, 1.36], [x0, 2.12, 1.36], { double: true }); for (const k of [0, 1, 4, 7]) g.param(v0 + k, 0);
      }
      g.mat('cast', '#3a3632'); for (const sx of [-1, 1]) g.tube([[sx * (w / 2 + 0.04), 2.55, 0.42], [sx * (w / 2 + 0.04), 2.32, 1.33]], 0.015, { segs: 5 });
      g.tube([[-w / 2 - 0.05, 2.31, 1.34], [w / 2 + 0.05, 2.31, 1.34]], 0.012, { segs: 5 });
      g.pop();
    });
    const bp = L(o, yaw, 0, 1.38);
    painted(s, 'quay.board.' + name, 1.5, 0.3, 170, drawStallBoard(name, sub, shadeHex(body, 0.8), '#f6ead0'), bp[0], 1.95, bp[1], { face: side < 0 ? 'X' : 'x' });
    s.deco(() => { g.mat('cast', '#3a3632'); const a = L(o, yaw, -0.6, 1.36), b = L(o, yaw, 0.6, 1.36); g.tube([[a[0], 2.1, a[1]], [a[0], 2.32, a[1]]], 0.005, { segs: 3 }); g.tube([[b[0], 2.1, b[1]], [b[0], 2.32, b[1]]], 0.005, { segs: 3 }); });
    const lp = L(o, yaw, 0, -0.1);
    lamp(s, 'globe', lp[0], 2.3, lp[1], { r: 0.13, drop: 0.3, power: 0.85, K: 2750, range: 5, clip: CL });
    const st = { side, zc, w, o, yaw, kind, name };
    stalls.push(st);
    return st;
  };
  // a helper to draw goods in a stall's own frame (front toward +z, the counter top at y 0.92, shelves behind)
  const inStall = (st, fn) => s.detail(() => { g.at(st.o[0], 0, st.o[1], st.yaw); fn(g, st); g.pop(); });
  const SH = [0.93, 1.38, 1.83], SZ = -1.47;

  const berries = stall(-1, 14.7, 2.8, 'Tansy Strawberries', 'picked this morning · through the Gate', '#a8392e', ['#c8243a', '#f2e6d0'], 'produce');
  const bread = stall(-1, 17.9, 2.6, 'The Crock, Lovage', 'loaves for the halls · first glide', '#7a5233', ['#d9b25c', '#6a4128'], 'bread');
  const cloth = stall(-1, 21.1, 2.8, 'Bolts and Lengths', 'dyed in Madder · by the metre', '#5a2f6a', ['#5a2f6a', '#e8c242', '#2f6f73'], 'cloth');
  const crocks = stall(-1, 24.3, 2.6, 'Crocks', 'glazed in Sorrel · lids that fit', '#2f6f73', ['#2f6f73', '#efe6d2'], 'crocks');
  const second = stall(-1, 27.8, 3.2, 'Second Owners', 'each thing with its story', '#4a5a3a', ['#6b8f4e', '#efe6d2'], 'secondhand');
  const noodles = stall(-1, 31.9, 3.4, 'Noodles', 'a bowl in broth 0.96 · lids on', '#9a2a24', ['#c9552e', '#f2c14e'], 'noodles');
  const offcuts = stall(-1, 35.9, 3.0, 'Offcuts by Weight', 'for menders first', '#3a4a6a', ['#3a4a6a', '#d9b25c', '#c9552e'], 'offcuts');
  const lamps = stall(-1, 39.3, 2.6, 'Hand Lamps', 'mended · rewired · lent', '#2a3a3a', ['#e8743b', '#2a3a3a'], 'lamps');
  const produce = stall(1, 15.0, 3.0, 'Produce by the Crate', 'halls and shops', '#3a6a3a', ['#6b8f4e', '#f2e6d0'], 'produce');
  const herbs = stall(1, 18.6, 2.8, 'Cut Herbs', 'bring herbs, not gin', '#4a6a2a', ['#8fbf5a', '#efe6d2'], 'herbs');
  const outgoing = stall(1, 22.5, 3.2, 'Outgoing', 'to Sorrel, Rue and along the Row', '#5a4a3a', ['#a8823f', '#3a2a1e'], 'freight');
  const thread = stall(1, 26.4, 3.0, 'Thread and Buttons', 'mend it so it shows', '#7a2a5a', ['#d95d7a', '#f2e6d0', '#3fa7a3'], 'mending');
  const tea = stall(1, 30.2, 2.8, 'Tea and Coffee', 'cell-culture coffee 0.15', '#6a4128', ['#c9963a', '#6a4128'], 'tea');

  // ---- what the stalls hold
  for (const p of [[-0.85, 0.05], [0, 0.05], [0.85, 0.05]]) { const w = L(berries.o, berries.yaw, p[0], p[1]); prop(s, 'station.fruitCrate', w[0], 0.92, w[1], berries.yaw, { fruit: '#c8243a', w: 0.62, d: 0.42 }); }
  for (const y of SH) for (const p of [-0.8, 0, 0.8]) { const w = L(berries.o, berries.yaw, p, SZ); prop(s, 'station.fruitCrate', w[0], y, w[1], berries.yaw, { fruit: y > 1.5 ? '#e0402a' : '#c8243a', w: 0.6, d: 0.32 }); }
  inStall(bread, (g) => {
    const r = new Rng(3);
    for (let i = 0; i < 3; i++) { const x = -0.85 + i * 0.85; g.mat('cane', '#c49a62'); g.lathe(x, 0.05, [[0, 0.92], [0.24, 0.92], [0.3, 1.04], [0.29, 1.05], [0.23, 0.94], [0, 0.94]], { segs: 14 }); }
    for (const y of SH) for (let x = -1.1; x < 1.1; x += r.f(0.24, 0.32)) { g.mat('plain', mixHex('#a8663a', '#7a4422', r.next()), { rough: 0.05 }); g.ball(x, y + 0.06, SZ, 0.13, 0.07, 0.09, { segs: 9, rings: 5, bottom: 0.5 }); }
  });
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const w = L(bread.o, bread.yaw, -0.85 + i * 0.85 + (j - 0.5) * 0.12, 0.05 + (j - 0.5) * 0.08); prop(s, 'station.loaf', w[0], 0.96 + j * 0.05, w[1], bread.yaw + j * 0.5, { c: j ? '#8a5530' : '#a8663a' }); }
  sign(s, { kind: 'notice', title: 'Gin goes through', lines: ['Chervil gin passes this way', 'for the halls, sealed.', 'Sold in the halls only,', 'after six, where', 'somebody is cooking.'] }, ...(() => { const w = L(bread.o, bread.yaw, 1.05, 0.42); return [w[0], 0.62, w[1]]; })(), { face: 'X', w: 0.26, h: 0.36 });
  inStall(cloth, (g) => {
    const cols = ['#a8392e', '#e8c242', '#2f6f73', '#5a2f6a', '#d95d7a', '#3a7a4a', '#26306b', '#e8743b'];
    for (let k = 0; k < 3; k++) for (let i = 0; i < 6; i++) { const x = -1.1 + i * 0.44, y = SH[k]; g.at(x, y + 0.09, SZ, PI / 2); g.mat('weave', cols[(i + k * 3) % cols.length]); g.rotZ(PI / 2); g.lathe(0, 0, [[0.085, -0.15], [0.085, 0.15]], { segs: 10 }); g.pop(); }
    // lengths hanging from a rail over the counter
    g.mat('cast', '#3a3632'); g.tube([[-1.3, 2.3, -0.2], [1.3, 2.3, -0.2]], 0.015, { segs: 5 });
    for (let i = 0; i < 6; i++) { const x = -1.15 + i * 0.46; g.mat('weave', cols[(i + 2) % cols.length], { sway: 0.5 }); g.sheet([x - 0.19, 2.3, -0.2], [x + 0.19, 2.3, -0.2], [x + 0.19, 1.15 + (i % 3) * 0.15, -0.2], [x - 0.19, 1.15 + (i % 3) * 0.15, -0.2], { ripple: 0.03, nu: 3, nv: 4 }); }
  });
  for (let i = 0; i < 4; i++) { const w = L(cloth.o, cloth.yaw, -0.9 + i * 0.6, 0.15); prop(s, 'station.bolt', w[0], 0.92 + (i % 2) * 0.17, w[1], cloth.yaw + 0.1, { c: ['#a8392e', '#26306b', '#e8c242', '#3a7a4a'][i] }); }
  {
    const r = new Rng(9); const gl = ['#8a5a3c', '#2f6f73', '#c9963a', '#e9e1cf', '#a8392e', '#3d6f8a', '#6b8f4e'];
    for (let i = 0; i < 5; i++) { const w = L(crocks.o, crocks.yaw, -1.0 + i * 0.5, 0.05 + r.f(-0.05, 0.05)); prop(s, 'crock', w[0], 0.92, w[1], r.f(0, 3), { glaze: gl[i % gl.length], h: r.f(0.22, 0.34), r: r.f(0.09, 0.13) }); }
    for (const y of SH) for (let i = 0; i < 6; i++) { const w = L(crocks.o, crocks.yaw, -1.05 + i * 0.42, SZ); prop(s, 'crock', w[0], y, w[1], r.f(0, 3), { glaze: gl[(i + Math.round(y * 3)) % gl.length], h: r.f(0.18, 0.3), r: r.f(0.08, 0.11) }); }
  }
  // second owners: a chair, a lamp, cups, books, each with its card
  { const w = L(second.o, second.yaw, -0.95, 0.0); prop(s, 'chair', w[0], 0.92, w[1], second.yaw + 0.4, { wood: '#8a5a3a', back: 'slat', seat: '#a8392e' }, { noCollide: true, noSpots: true }); }
  inStall(second, (g) => {
    const r = new Rng(21);
    g.mat('cast', '#b08a45'); g.lathe(0.2, 0.0, [[0.09, 0.92], [0.02, 0.95], [0.015, 1.3], [0.03, 1.32]], { segs: 10 }); g.mat('weave', '#e8c242'); g.lathe(0.2, 0.0, [[0.16, 1.28], [0.09, 1.46], [0.07, 1.46]], { segs: 12 });
    for (let i = 0; i < 5; i++) { g.mat('leather', ['#6b2a22', '#2a3a5c', '#3e4a2a', '#7a5a2a', '#1e2a2a'][i]); g.box(0.55 + i * 0.06, 0.92, -0.12, 0.6 + i * 0.06, 0.92 + r.f(0.2, 0.28), 0.1); }
    for (const y of SH) for (let x = -1.35; x < 1.3; x += r.f(0.22, 0.4)) {
      const k = r.i(0, 3);
      if (k === 0) { g.mat('glaze', ['#e9e1cf', '#2f6f73', '#c9552e'][r.i(0, 2)]); g.lathe(x, SZ, [[0, y], [0.05, y], [0.06, y + 0.12], [0.05, y + 0.14], [0, y + 0.15]], { segs: 10 }); }
      else if (k === 1) { g.mat('leather', ['#6b2a22', '#2a3a5c', '#3e4a2a'][r.i(0, 2)]); g.box(x - 0.04, y, SZ - 0.1, x + 0.04, y + 0.24, SZ + 0.1); }
      else if (k === 2) { g.mat('brushed', '#9a9590'); g.box(x - 0.08, y, SZ - 0.08, x + 0.08, y + 0.14, SZ + 0.08, { bevel: 0.01 }); }
      else { g.mat('glaze', '#3d6f8a'); g.lathe(x, SZ, [[0, y], [0.08, y], [0.1, y + 0.08], [0.06, y + 0.2], [0.03, y + 0.24], [0, y + 0.24]], { segs: 10 }); }
      g.mat('paper', '#f4ecd8'); g.box(x - 0.035, y + 0.005, SZ + 0.12, x + 0.035, y + 0.055, SZ + 0.125);
    }
    g.mat('paper', '#f4ecd8'); for (const x of [-0.95, 0.2, 0.6]) g.box(x - 0.05, 0.925, 0.25, x + 0.05, 0.93, 0.33, { faces: 'Y' });
  });
  // noodles: pots on the loop behind, bowls with lids on the counter, stools in front
  inStall(noodles, (g) => {
    g.mat('brushed', '#8a8c88'); g.box(-1.5, 0.92, -1.65, 1.5, 0.95, -1.3);
    g.mat('paint', '#9a3a2a'); g.tube([[-1.6, 0.6, -1.62], [1.6, 0.6, -1.62]], 0.04, { segs: 8 });
    g.mat('brushed', '#9a9c98'); g.tube([[1.2, 0.95, -1.5], [1.2, 1.5, -1.5], [1.05, 1.5, -1.35]], 0.015, { segs: 5 });
    for (const x of [-1.2, -0.5, 0.2, 0.9]) { g.mat('glaze', '#e9e1cf'); g.lathe(x, -1.45, [[0, 1.41], [0.06, 1.41], [0.1, 1.47], [0.11, 1.5], [0.0, 1.5]], { segs: 10 }); }
    g.mat('weave', '#f2e6d0', { sway: 0.4 }); g.sheet([-1.5, 2.45, 0.38], [1.5, 2.45, 0.38], [1.5, 2.15, 0.38], [-1.5, 2.15, 0.38], { ripple: 0.02, nu: 8, nv: 2 });
  });
  for (const p of [[-0.9, -1.47, 0.3], [-0.2, -1.47, 0.26], [0.55, -1.47, 0.3]]) { const w = L(noodles.o, noodles.yaw, p[0], p[1]); prop(s, 'station.pot', w[0], 0.95, w[1], 0, { r: p[2] * 0.7, h: 0.28 }); }
  for (let i = 0; i < 6; i++) { const w = L(noodles.o, noodles.yaw, -1.3 + i * 0.5, 0.2); prop(s, 'bowl', w[0], 0.92, w[1], 0, { glaze: i % 2 ? '#c9552e' : '#e9e1cf', lid: i % 2 ? '#e9e1cf' : '#2f6f73', r: 0.07 }); }
  const stoolSeats = [];
  for (let i = 0; i < 5; i++) { const w = L(noodles.o, noodles.yaw, -1.3 + i * 0.65, 0.95); prop(s, 'stool', w[0], 0, w[1], noodles.yaw + PI, { wood: ['#7a5a3a', '#5a3a26', '#8a6a44'][i % 3], h: 0.66 }, { spot: { tags: ['quayside', 'noodles'] } }); stoolSeats.push(w); }
  // offcuts in baskets
  inStall(offcuts, (g) => {
    const r = new Rng(31); const cols = ['#a8392e', '#e8c242', '#2f6f73', '#5a2f6a', '#d95d7a', '#3a7a4a', '#26306b', '#e8743b', '#efe6d2'];
    for (let i = 0; i < 4; i++) { const x = -1.05 + i * 0.7; g.mat('cane', '#b08d5e'); g.lathe(x, 0.05, [[0, 0.92], [0.22, 0.92], [0.27, 1.1], [0.26, 1.11], [0.2, 0.94], [0, 0.94]], { segs: 12 }); for (let k = 0; k < 9; k++) { g.mat('weave', cols[r.i(0, cols.length - 1)]); g.ball(x + r.f(-0.14, 0.14), 1.06 + r.f(0, 0.05), 0.05 + r.f(-0.14, 0.14), r.f(0.04, 0.08), 0.03, r.f(0.04, 0.08), { segs: 6, rings: 3 }); } }
    for (const y of SH) for (let x = -1.3; x < 1.3; x += 0.33) { g.mat('weave', cols[r.i(0, cols.length - 1)]); g.box(x, y, SZ - 0.15, x + 0.28, y + r.f(0.06, 0.16), SZ + 0.15, { bevel: 0.02 }); }
  });
  { const w = L(offcuts.o, offcuts.yaw, 1.15, 0.0); prop(s, 'station.scales', w[0], 0, w[1] , offcuts.yaw, {}, { noCollide: true }); }
  sign(s, spec('quayside.stall.offcuts'), ...(() => { const w = L(offcuts.o, offcuts.yaw, 0, 1.55); return [w[0], 2.9, w[1]]; })(), { face: 'X', w: 0.42, h: 0.42, double: true });
  // hand lamps, glowing
  inStall(lamps, (g) => {
    const r = new Rng(41); const cols = ['#ffcf7a', '#ffb45a', '#ffe0a8', '#f2a06a'];
    for (const y of SH.concat([0.92])) for (let x = -1.1; x < 1.15; x += 0.3) {
      const z = y < 0.95 ? 0.05 : SZ; g.mat('cast', ['#b08a45', '#3a3632', '#7a8a8a'][r.i(0, 2)]); g.cyl(x, y, z, 0.05, 0.03, { segs: 8 }); g.box(x - 0.008, y + 0.13, z - 0.04, x + 0.008, y + 0.17, z + 0.04);
      g.mat('diffuser', cols[r.i(0, 3)], { emissive: r.chance(0.6) ? 2.5 : 0.2, lamp: true }); g.lathe(x, z, [[0.045, y + 0.03], [0.05, y + 0.09], [0.035, y + 0.13]], { segs: 8 });
    }
  });
  for (const p of [[-0.8, '#e8743b'], [0, '#f2c14e'], [0.8, '#3fa7a3']]) { const w = L(lamps.o, lamps.yaw, p[0], 0.6); lamp(s, 'lantern', w[0], 2.0, w[1], { tint: p[1], drop: 0.35, power: 0.45, range: 4, clip: CL }); }
  // produce by the crate: tomatoes, apples (counted), greens
  for (const p of [[-1.0, '#d8352a', false], [-0.2, '#b8c83a', true], [0.6, '#c8243a', true], [1.25, '#e0402a', false]]) { const w = L(produce.o, produce.yaw, p[0], 0.05); prop(s, 'station.fruitCrate', w[0], 0.92, w[1], produce.yaw, { fruit: p[1], big: p[2], w: 0.6, d: 0.42 }); }
  for (const y of SH) for (const p of [-0.9, 0, 0.9]) { const w = L(produce.o, produce.yaw, p, SZ); prop(s, 'crate', w[0], y, w[1], produce.yaw, { w: 0.6, h: 0.3, d: 0.32, wood: '#c9a676' }); }
  sign(s, spec('quayside.stall.produce'), ...(() => { const w = L(produce.o, produce.yaw, 0, 1.55); return [w[0], 2.9, w[1]]; })(), { face: 'x', w: 0.42, h: 0.42, double: true });
  // cut herbs in buckets, under the lamp
  inStall(herbs, (g) => {
    const r = new Rng(51);
    for (let i = 0; i < 6; i++) { const x = -1.1 + i * 0.44; g.mat('brushed', ['#8a9a9a', '#2f6f73', '#a8392e'][i % 3]); g.lathe(x, 0.05, [[0, 0.92], [0.1, 0.92], [0.12, 1.12], [0.115, 1.12], [0.095, 0.94], [0, 0.94]], { segs: 10 }); for (let k = 0; k < 4; k++) { g.mat(r.chance(0.5) ? 'leafB' : 'leafA', mixHex('#ffffff', '#cfe8a0', r.next()), { sway: 0.5 }); g.card(x + r.f(-0.03, 0.03), 1.0, 0.05 + r.f(-0.03, 0.03), 0.2, r.f(0.25, 0.4), r.f(0, 3)); } }
    for (const y of SH) for (let x = -1.15; x < 1.2; x += 0.28) { g.mat('glaze', ['#a3563a', '#c9963a', '#e9e1cf'][r.i(0, 2)]); g.lathe(x, SZ, [[0, y], [0.06, y], [0.075, y + 0.1], [0.07, y + 0.1]], { segs: 8 }); g.mat('leafA', '#ffffff', { sway: 0.4 }); g.card(x, y + 0.08, SZ, 0.18, 0.2, r.f(0, 3)); }
  });
  // outgoing freight: crates with their stencils, a ledger and a stamp
  for (const p of [[-1.05, 'quayside.crate.sleeves'], [0.05, 'quayside.crate.felt'], [1.1, 'quayside.crate.pigment']]) {
    const w = L(outgoing.o, outgoing.yaw, p[0], SZ); prop(s, 'crate', w[0], 0, w[1], outgoing.yaw, { w: 0.9, h: 0.85, d: 0.32, wood: '#b08d5e' });
  }
  inStall(outgoing, (g) => { g.mat('leather', '#2a3a5c'); g.box(-0.5, 0.92, -0.15, 0.0, 0.95, 0.2, { bevel: 0.004 }); g.mat('paper', '#efe5cc'); g.box(-0.48, 0.95, -0.13, -0.02, 0.96, 0.18); g.mat('wood', '#3a2418'); g.cyl(0.3, 0.92, 0.05, 0.035, 0.08, { segs: 8 }); g.mat('plain', '#a8392e'); g.box(0.45, 0.92, -0.05, 0.65, 0.935, 0.08); });
  // thread and buttons: spools on pegs, jars of buttons
  inStall(thread, (g) => {
    const r = new Rng(61); const cols = ['#c8243a', '#e8c242', '#2f6f73', '#5a2f6a', '#d95d7a', '#3a7a4a', '#26306b', '#e8743b', '#efe6d2', '#3fa7a3', '#8fd694'];
    g.mat('wood', '#6a4128'); g.box(-1.4, 1.0, -1.69, 1.4, 2.5, -1.67);
    for (let j = 0; j < 7; j++) for (let i = 0; i < 12; i++) { const x = -1.3 + i * 0.235, y = 1.1 + j * 0.2; g.mat('weave', cols[(i * 3 + j * 5) % cols.length]); g.at(x, y, -1.63, 0); g.rotX(PI / 2); g.lathe(0, 0, [[0.03, -0.035], [0.03, 0.035]], { segs: 8 }); g.pop(); }
    for (let i = 0; i < 6; i++) { const x = -1.2 + i * 0.48; g.mat('plain', '#dfeceb', { rough: -0.4 }); g.lathe(x, 0.05, [[0, 0.92], [0.07, 0.92], [0.075, 1.1], [0.05, 1.12], [0, 1.12]], { segs: 10 }); g.mat('glaze', cols[(i * 2) % cols.length]); g.lathe(x, 0.05, [[0, 0.93], [0.065, 0.93], [0.065, 1.03], [0, 1.03]], { segs: 8 }); }
  });
  // tea and coffee: an urn, cups, a sack
  inStall(tea, (g) => {
    g.mat('brushed', '#c4c0b8', { rough: -0.2 }); g.lathe(-0.7, -0.05, [[0, 0.92], [0.17, 0.92], [0.18, 1.0], [0.18, 1.3], [0.12, 1.36], [0.04, 1.4], [0, 1.4]], { segs: 14 });
    g.mat('cane', '#b08d5e'); g.box(0.6, 0.0, -1.25, 1.1, 0.6, -0.95, { bevel: 0.04 });
    for (const y of SH) for (let x = -1.1; x < 1.1; x += 0.24) { g.mat('cast', ['#2f6f73', '#a8392e', '#c9963a', '#3a3632'][Math.round(x * 7 + y * 3) & 3]); g.cyl(x, y, SZ, 0.06, 0.16, { segs: 10 }); }
  });
  for (let i = 0; i < 5; i++) { const w = L(tea.o, tea.yaw, -0.2 + i * 0.22, 0.15); prop(s, 'cup', w[0], 0.92, w[1], 0, { glaze: ['#e9e1cf', '#2f6f73', '#c9552e', '#d9b25c', '#e9e1cf'][i] }); }

  // ---- islands down the middle: crates of the day's produce, with their stencils toward the lane
  const label = (id, x, y, z, face) => sign(s, spec(id), x, y, z, { face, w: 0.56, h: 0.17, tier: 'd' });
  const crateStack = (x, z, n, labels, wood) => {
    for (let i = 0; i < n; i++) prop(s, 'crate', x, i * 0.45, z, (i % 2) * 0.05, { w: 0.8, h: 0.44, d: 0.6, wood: wood || '#b08d5e' });
    labels.forEach((id, i) => { if (id) label(id, x + (i % 2 ? 0.401 : -0.401), 0.22 + Math.floor(i / 2) * 0.45, z, i % 2 ? 'X' : 'x'); });
  };
  crateStack(39.0, 20.2, 2, ['quayside.crate.strawberries', 'quayside.crate.tomatoes', 'quayside.crate.loaves', 'quayside.crate.cheese']);
  crateStack(39.0, 21.0, 1, ['quayside.crate.loaves', 'quayside.crate.strawberries']);
  prop(s, 'station.handcart', 39.4, 0, 26.2, 0.2, { wood: '#8a6a44', metal: '#2f5a5a' });
  for (let i = 0; i < 2; i++) prop(s, 'station.fruitCrate', 39.4 + (i - 0.5) * 0.31, 0.45, 26.0, 0.2, { fruit: '#c8243a', w: 0.3, d: 0.4 });
  crateStack(38.8, 34.2, 3, ['quayside.crate.apples', 'quayside.crate.starter', '', 'quayside.crate.felt']);

  // ---- freight at the far end: stacks against the west wall, Ines's desk and the weighbridge, handcarts, the lift
  for (const st of [[35.0, 42.0, 3], [35.0, 43.2, 2], [35.0, 45.6, 3], [35.0, 46.8, 1], [35.0, 50.6, 2], [35.0, 51.8, 3], [36.3, 51.8, 1]]) for (let i = 0; i < st[2]; i++) prop(s, 'crate', st[0], i * 0.62, st[1], 0, { w: 0.9, h: 0.6, d: 1.1, wood: i % 2 ? '#a88558' : '#b9976a' });
  label('quayside.crate.cheese', 35.451, 0.3, 42.0, 'X'); label('quayside.crate.apples', 35.451, 0.92, 42.0, 'X'); label('quayside.crate.pigment', 35.451, 0.3, 43.2, 'X');
  label('quayside.crate.sleeves', 35.451, 0.3, 45.6, 'X'); label('quayside.crate.strawberries', 35.451, 0.92, 45.6, 'X'); label('quayside.crate.starter', 35.451, 0.3, 50.6, 'X'); label('quayside.crate.tomatoes', 35.451, 0.92, 51.8, 'X'); label('quayside.crate.felt', 36.751, 0.3, 51.8, 'X');
  prop(s, 'station.handcart', 37.4, 0, 44.5, PI * 0.1, { wood: '#7a5a3a', metal: '#7a2a24' });
  prop(s, 'station.handcart', 37.0, 0, 55.0, -PI * 0.15, { wood: '#8a6a44', metal: '#2f5a5a' });
  for (let i = 0; i < 2; i++) prop(s, 'crate', 37.4 + (i - 0.5) * 0.02, 0.45 + i * 0.36, 44.4, PI * 0.1, { w: 0.6, h: 0.36, d: 0.5, wood: '#c9a676' });
  // Ines's freight desk
  block(s, 35.1, 0, 47.6, 36.0, 0.95, 49.6, 'wood', '#5a4636', { bevel: 0.02 });
  s.detail(() => {
    g.mat('wood', '#7a5a3a'); g.box(35.05, 0.95, 47.55, 36.05, 0.99, 49.65, { bevel: 0.01 });
    g.mat('leather', '#2a3a5c'); g.box(35.3, 0.99, 48.0, 35.8, 1.02, 48.6, { bevel: 0.004 });
    g.mat('paper', '#efe5cc'); g.box(35.32, 1.02, 48.02, 35.78, 1.025, 48.58);
    g.mat('paper', '#f4ecd8'); for (let i = 0; i < 6; i++) g.box(35.25 + (i % 3) * 0.1, 0.99 + i * 0.004, 49.0 + (i % 2) * 0.03, 35.45 + (i % 3) * 0.1, 0.993 + i * 0.004, 49.28 + (i % 2) * 0.03);
    g.mat('cast', '#c9a45c'); g.lathe(35.8, 49.4, [[0, 0.99], [0.04, 0.99], [0.03, 1.06], [0, 1.07]], { segs: 8 });
  });
  prop(s, 'station.deskLamp', 35.3, 0.99, 49.4, PI / 2, { shade: '#2f6f73' });
  lamp(s, 'bulb', 35.5, 1.35, 49.2, { power: 0.4, K: 2700, range: 3, clip: CL });
  prop(s, 'stool', 34.65, 0, 48.6, 0, { h: 0.66 }, { spot: { tags: ['quayside'] } });
  s.spot('counter', 34.7, 0, 48.3, PI / 2, { tags: ['quayside', 'freight'], who: 'ines' });
  prop(s, 'station.scales', 37.6, 0, 48.6, -PI / 2, {});
  sign(s, { kind: 'plate', text: 'FREIGHT · RING 2', lines: ['weigh it, sign it, send it'] }, 35.0, 1.3, 49.62, { face: 'Z', w: 0.5, h: 0.2 });
  // the freight lift at the south end: a slatted steel shutter, striped jambs
  s.furniture(() => {
    g.mat('panel', '#6a6e6c'); for (let i = 0; i < 20; i++) g.box(36.2, i * 0.15, Z1 - 0.12, 41.8, i * 0.15 + 0.13, Z1 - 0.1, { bevel: 0.01 });
    for (const x of [36.2, 41.6]) for (let i = 0; i < 12; i++) { g.mat('paint', i % 2 ? '#2a2a28' : '#d9b23a'); g.box(x, i * 0.25, Z1 - 0.2, x + 0.2, i * 0.25 + 0.25, Z1 - 0.1); }
    g.mat('paint', '#d9b23a'); g.box(36.2, 3.0, Z1 - 0.2, 41.8, 3.12, Z1 - 0.1);
  });
  s.solid(36.2, 0, Z1 - 0.2, 41.8, 3.0, Z1 - 0.08);
  painted(s, 'quay.lift', 1.6, 0.3, 200, drawPlate('FREIGHT LIFT', ['decks 1 to 4 · crates and porters'], { titleK: 0.5, a: '#c9b44a', b: '#e8d27a', c: '#a8923a' }), 39, 3.3, Z1 - 0.205, { face: 'z' });

  // ---- clutter in the gaps between stalls and at their feet: sacks, baskets, crates
  {
    const r = new Rng(808);
    const gapsW = [16.35, 19.45, 22.75, 25.9, 29.8, 34.0, 37.7], gapsE = [16.85, 20.45, 24.5, 28.35];
    const drop = (x, z) => {
      const k = r.i(0, 2);
      if (k === 0) prop(s, 'station.sack', x, 0, z, r.f(0, 3), { c: ['#a8946a', '#9a8460', '#b8a47a'][r.i(0, 2)] });
      else if (k === 1) prop(s, 'station.basket', x, 0, z, 0, { c: ['#c8243a', '#d8352a', '#b8c83a', '#e8743b'][r.i(0, 3)], r: 0.24 });
      else prop(s, 'crate', x, 0, z, r.f(-0.2, 0.2), { w: 0.55, h: 0.36, d: 0.42, wood: '#b08d5e' });
    };
    for (const z of gapsW) { drop(35.6, z); if (r.chance(0.6)) drop(36.15, z + r.f(-0.15, 0.15)); }
    for (const z of gapsE) { drop(42.4, z); if (r.chance(0.6)) drop(41.9, z + r.f(-0.15, 0.15)); }
    prop(s, 'station.sack', 38.6, 0, 23.9, 0.4, { c: '#a8946a' }); prop(s, 'station.sack', 39.05, 0, 24.1, 1.2, { c: '#9a8460' }); prop(s, 'station.sack', 38.8, 0.42, 24.0, 2.0, { c: '#b8a47a' });
    prop(s, 'station.handcart', 39.3, 0, 16.8, -0.15, { wood: '#8a6a44', metal: '#7a2a24' });
    for (let i = 0; i < 3; i++) prop(s, 'station.basket', 39.3 + Math.sin(i) * 0.1, 0.45, 16.4 + i * 0.42, 0, { c: ['#d8352a', '#e8743b', '#b8c83a'][i], r: 0.2 });
    prop(s, 'station.handcart', 39.6, 0, 37.0, 0.25, { wood: '#7a5a3a', metal: '#2f5a5a' });
    for (let i = 0; i < 3; i++) prop(s, 'station.bolt', 39.6 + Math.sin(i * 2) * 0.12, 0.52 + i * 0.17, 37.0 + (i - 1) * 0.3, 0.25 + 1.57, { c: ['#5a2f6a', '#e8c242', '#2f6f73'][i] });
  }
  // A-frame chalkboards in front of a few stalls
  const aframe = (st, lx, title, lines) => {
    const w = L(st.o, st.yaw, lx, 1.05); const yaw = st.yaw + 0.25 * (st.side < 0 ? 1 : -1);
    prop(s, 'station.aframe', w[0], 0, w[1], yaw, {});
    const R = game.atlas ? game.atlas.add(100, 140, drawChalk({ title, lines }), 'quay.chalk.' + title) : null;
    if (!R) return;
    g.at(w[0], 0, w[1], yaw); g.move(0, 0.36, 0.091); g.rotX(-0.24);
    g.atlas(R.page, {}); g.quad([-0.2, -0.29, 0.002], [0.2, -0.29, 0.002], [0.2, 0.29, 0.002], [-0.2, 0.29, 0.002], { uv: [R.u0, R.v1, R.u1, R.v0] });
    g.pop(); s.flush({ tier: 'd' });
  };
  aframe(berries, 0.9, 'Tansy, today', ['Strawberries 0.90', 'a punnet', 'Cherry tomato 0.10']);
  aframe(noodles, -1.1, 'Noodles', ['In broth 0.96', 'Coffee 0.15', 'Lids on, always']);
  aframe(bread, 0.8, 'From the Crock', ['Lovage loaf 1.10', 'Halls first,', 'then you']);
  aframe(offcuts, 0.95, 'By weight', ['Menders first,', 'then everyone', 'Ask for the blues']);
  // old painted signs high on the walls
  const frieze = [[-1, 18.0, 'Mind the carts', 'porters have right of way', '#2f5a5a'], [-1, 30.6, 'All living things to the Gate', 'starters · cuttings · seeds · rinds', '#7a2a24'], [-1, 44.4, 'Ring 2 Quays', 'decks 1 to 4 · freight and fair', '#3a3a5a'],
    [1, 20.8, 'No hot soup in the cars', 'drink it on the platform', '#5a4a2a'], [1, 34.5, 'Tansy · Lovage · Sorrel · Rue', 'and along the Row', '#2f5a3a']];
  for (const fr of frieze) { const x = fr[0] < 0 ? X0 + 0.17 : X1 - 0.17; painted(s, 'quay.frieze.' + fr[2], 2.2, 0.36, 150, drawStallBoard(fr[2], fr[3], fr[4], '#f2e4c4'), x, 3.02, fr[1], { face: fr[0] < 0 ? 'X' : 'x' }); }
  // the east wall past the stalls: a porters' bench, today's freight board, a water tap
  prop(s, 'bench', X1 - 0.45, 0, 34.6, -PI / 2, { w: 3.0, back: true, wood: '#5a3a26', metal: '#2a2a26' }, { spot: { tags: ['quayside', 'porter'] } });
  seatHere(s, X1 - 0.45, 0, 34.6, -PI / 2, "Sit on the porters' bench");
  sign(s, { kind: 'board', title: 'In today', lines: ['Tansy|strawberries · 40', 'Lovage|loaves · 200', 'Lovage|cherry tomatoes · 12', 'Sorrel|felt · 6 bolts', 'Madder|pigment · 9', 'Kittiwake|sleeves · 40 pairs', 'Hollow|feast apples · 200'], palette: ['#1d2622', '#efe4c8', '#e8c242'] }, X1 - 0.17, 1.85, 37.9, { face: 'x', w: 1.2, h: 0.9 });
  s.furniture(() => { g.mat('brushed', '#9a9c98'); g.box(X1 - 0.4, 0.75, 39.0, X1 - 0.16, 0.85, 39.5, { bevel: 0.01 }); g.tube([[X1 - 0.2, 0.85, 39.25], [X1 - 0.2, 1.15, 39.25], [X1 - 0.32, 1.15, 39.25]], 0.014, { segs: 5 }); });
  prop(s, 'crate', X1 - 0.5, 0, 32.4, 0.1, { w: 0.6, h: 0.45, d: 0.5 }); prop(s, 'crate', X1 - 0.5, 0.45, 32.4, -0.1, { w: 0.6, h: 0.4, d: 0.5, wood: '#c9a676' });

  // ---- strings of bulbs across the lane, zigzag, and their light
  for (let z = 13.2, k = 0; z < Z1 - 2; z += 3.4, k++) {
    const a = [36.0, 2.95, z], b = [42.0, 3.0, z + 1.7];
    bulbs(s, k % 2 ? b : a, k % 2 ? [36.0, 2.95, z + 3.4] : b, { colors: ['#ffb24a', '#ff9a3a', '#ffc070', '#ffa858'], glow: 5 });
    lamp(s, 'bulb', 39, 2.45, z + 1.7, { power: 0.75, K: 2500, range: 5.5, clip: CL });
    if (k % 2 === 0) bunting(s, [36.2, 3.25, z + 0.8], [41.8, 3.25, z + 2.6], { colors: ['#c9552e', '#e7b547', '#2f6f73', '#e9e2d0', '#8a2f3c', '#6b8f4e', '#26306b'], sag: 0.22, drop: 0.16 });
  }
  // freight light: hard and plain
  for (const z of [44.5, 53.5]) lamp(s, 'panel', 39, H, z, { w: 1.2, d: 0.4, power: 0.75, K: 3600, clip: CL });
  roomGlow(s, X0, 0, Z0, X1, H, Z1, { sky: '#ffd0a0', ground: '#a08868', power: 0.09 });

  // ---- by the Gate window: a lean-on sill, a rail, the cool light leaking out
  s.furniture(() => { g.mat('brushed', '#c4c8c6'); g.box(43.55, 0.82, 41.7, 43.88, 0.86, 58.3, { bevel: 0.006 }); for (let z = 42.2; z < 58.3; z += 2.0) g.box(43.6, 0.5, z - 0.02, 43.88, 0.82, z + 0.02); });
  s.solid(43.55, 0, 41.7, 43.92, 0.86, 58.3);
  s.deco(() => { for (let i = 0; i < 66; i++) { g.mat('paint', i % 2 ? '#2a2a28' : '#d9b23a'); g.box(43.0, 0, 41.7 + i * 0.25, 43.12, 0.005, 41.95 + i * 0.25, { faces: 'Y' }); } });

  // ---- people and paths
  for (const st of stalls) {
    const b1 = L(st.o, st.yaw, -st.w / 3, 1.4), b2 = L(st.o, st.yaw, st.w / 3, 1.5);
    s.spot('browse', b1[0], 0, b1[1], st.yaw + PI, { tags: ['quayside', st.kind] }); s.spot('browse', b2[0], 0, b2[1], st.yaw + PI + 0.2, { tags: ['quayside', st.kind] });
    const wk = L(st.o, st.yaw, st.w / 3, -0.75); s.spot('work', wk[0], 0, wk[1], st.yaw, { tags: ['quayside', 'stall'] });
  }
  const chat = (cx, cz, n) => { for (let i = 0; i < n; i++) { const a = i / n * PI * 2 + 0.4; s.spot('chat', cx + Math.sin(a) * 0.55, 0, cz - Math.cos(a) * 0.55, a + PI, { tags: ['quayside'] }); } };
  chat(39.2, 16.2, 3); chat(38.6, 29.4, 2); chat(39.4, 38.2, 3); chat(39.0, 46.5, 2);
  for (const p of [[36.0, 42.6, -PI / 2], [36.0, 45.0, -PI / 2], [36.4, 50.2, -PI / 2], [38.6, 58.3, PI], [40.2, 57.0, PI], [37.4, 46.0, 0]]) s.spot('work', p[0], 0, p[1], p[2], { tags: ['quayside', 'porter'] });
  for (const z of [43.5, 46.5, 49.5, 52.5, 55.5]) s.spot('stand', 43.1, 0, z, PI / 2, { tags: ['quayside', 'gate', 'watch'] });
  s.path([[39, Z0], [39, 13.5], [39, 18.0], [39.6, 24.0], [38.2, 28.0], [38.6, 31.0], [39.6, 36.6], [39.2, 41.0], [39.0, 47.0], [39.2, 52.0], [39.0, 57.0]], { width: 1.8 });
  s.path([[39, 13.5], [36.9, 14.5], [36.9, 21.0], [36.9, 27.0], [37.2, 33.0], [36.9, 39.0], [39.2, 41.0]], { width: 1.0 });
  s.path([[39, 13.5], [41.1, 14.6], [41.1, 20.0], [41.1, 26.0], [41.1, 31.5], [40.6, 36.6]], { width: 1.0 });
  for (const zz of [[21.0, 18.0], [27.0, 24.0], [33.0, 31.0]]) { s.path([[36.9, zz[0]], [39, zz[1]]]); }
  s.path([[39.2, 41.0], [42.6, 43.0], [42.6, 50.0], [42.6, 57.0], [39.0, 57.0]]);
  s.path([[39.0, 47.0], [36.8, 48.6]]);

  // ---- things to do
  const buy = async (game, title, note, items) => {
    if (!game.ui || !game.ui.menu) return;
    game.busy++; let pick = null;
    try { pick = await game.ui.menu({ kicker: 'Quaysides', title, note, items, wallet: game.wallet ? game.wallet.kwh : 0 }); } finally { game.busy--; }
    const it = items.find((i) => i.id === pick); if (!it) return;
    if (game.wallet && !game.wallet.spend(it.price, it.name)) return;
    if (game.sfxAt) game.sfxAt('paper', f, 39, 1, 30);
    if (it.after) await tell(game, null, [it.after]);
  };
  const at = (st, lz) => { const w = L(st.o, st.yaw, 0, lz); return { x: w[0], z: w[1] }; };
  { const p = at(berries, 0.7); s.interact({ x: p.x, y: 1.1, z: p.z, radius: 1.6, wide: true, prompt: 'Buy from the strawberry stall', onUse: (game) => buy(game, 'Tansy Strawberries', 'Picked in Tansy this morning, through the Gate on the first glide.', [
    { id: 'punnet', name: 'Tansy strawberries', desc: 'A small punnet, under a waxed lid.', price: 0.9, after: 'A small punnet under a waxed lid. They smell of somewhere with brighter lamps.' },
    { id: 'cherry', name: 'A cherry tomato', desc: "Lovage's, from the Glasshouse. Eat it whole.", price: 0.1, after: 'Warm from the crate, and gone in one bite.' }]) }); }
  { const p = at(bread, 0.7); s.interact({ x: p.x, y: 1.1, z: p.z, radius: 1.5, wide: true, prompt: 'Buy a loaf', onUse: (game) => buy(game, 'The Crock, Lovage', 'In by the first glide. Most of these go to the halls.', [
    { id: 'loaf', name: 'The Lovage loaf', desc: 'The country loaf everyone at the feast pretends Chervil makes.', price: 1.1, after: 'The crust crackles in your hands. Two hundred more like it are going up to the halls this morning.' }]) }); }
  { const p = at(noodles, 0.7); s.interact({ x: p.x, y: 1.1, z: p.z, radius: 1.6, wide: true, prompt: 'Order at the noodle counter', onUse: (game) => buy(game, 'Noodles', 'Sit on a stool. Lift the lid when it reaches you.', [
    { id: 'noodles', name: 'A bowl of noodles in broth', desc: 'Sweet-savoury broth, protein-boosted noodles, a lid on top.', price: 0.96, after: 'The bowl comes under a lid. Steam and broth, and the stall-keeper pretends not to watch you eat.' },
    { id: 'coffee', name: 'A cup of cell-culture coffee', desc: 'Black, in a lidded cup.', price: 0.15, after: 'Strong and hot, lid on.' }]) }); }
  for (const w of stoolSeats.filter((_, i) => i % 2 === 0)) seatHere(s, w[0], 0, w[1], -PI / 2, 'Sit at the noodle counter', 0.66);
  { const p = at(second, 0.7); s.interact({ x: p.x, y: 1.1, z: p.z, radius: 1.6, wide: true, prompt: 'Read the cards on the second-hand things', onUse: async (game) => {
    await tell(game, null, ['A hand lamp. Three owners. Rewired at Knotnight twelve years ago, and still bright.', 'A chair, Sorrel made. Mended twice, once in red thread, which shows, on purpose.', 'A lidded bowl glazed in Lovage. The lid is newer than the bowl, and the card says so.']);
    await buy(game, 'Second Owners', 'Each thing with its story. The card goes with it.', [{ id: 'cup', name: 'A mended lidded cup, with its card', desc: 'A crack mended in gold-coloured resin. Two owners before you.', price: 0.35, after: 'The card says: Tamsin, then Oke, then whoever has it now. You write Spelt underneath.' }]);
  } }); }
  { const p = at(offcuts, 0.7); s.interact({ x: p.x, y: 1.1, z: p.z, radius: 1.5, wide: true, prompt: 'Look through the offcuts', onUse: async (game) => { await tell(game, null, ['Scraps of every colour, sold by the gram. Menders get first pick, then everyone.', 'New cloth costs its weight in energy. Colour costs nothing. So a patch here is bright on purpose.']); } }); }
  { const p = at(lamps, 0.7); s.interact({ x: p.x, y: 1.1, z: p.z, radius: 1.5, wide: true, prompt: 'Look at the hand lamps', onUse: async (game) => { await tell(game, null, ['A watt or two of warm light with a clip for a collar. Every flat in Chervil keeps one by the door.', 'Half of these are lent, not sold, for the Long Flight. Bring it back by lamp-dawn.']); } }); }
  { const p = at(outgoing, 0.7); s.interact({ x: p.x, y: 1.1, z: p.z, radius: 1.6, wide: true, prompt: 'Read the crate labels', onUse: async (game) => {
    await tell(game, null, ['Tansy strawberries, sealed and certified, through the Gate. Lovage cherry tomatoes, from the Glasshouse. Kittiwake: remade wing-sleeves, forty pairs. Felt, Sorrel, for Marit Vell\'s Hall.', 'Produce is the one food worth carrying between drums. Everything else is cheaper made at home from the Mill and the Vats.']);
    found(game, 'produce-crates');
  } }); }
  s.interact({ x: 38.8, y: 1.0, z: 33.7, radius: 1.5, wide: true, prompt: 'Read the crate labels', onUse: async (game) => {
    await tell(game, null, ['Hollow orchard: feast apples, counted, two hundred. Starters, for the strain library, via the Gate.', 'Someone has written on the apple crate in pencil: counted twice. Hands off.']);
    found(game, 'produce-crates');
  } });
  s.interact({ x: 37.6, y: 0.8, z: 48.6, radius: 1.4, prompt: 'Stand on the scales', onUse: async (game) => {
    await tell(game, null, ['The needle swings and settles. Here on the rim you weigh a full g.', 'Up in Candlewick, sixty metres nearer the axis, you would weigh about two parts in a hundred less. On the terraces of the Third, a third of this.']);
  } });
  s.interact({ x: 39, y: 1.4, z: Z1 - 0.5, radius: 2.2, wide: true, prompt: 'Try the freight lift', onUse: async (game) => { if (game.audio) game.audio.ui('deny'); await tell(game, null, ['Freight only. A porter rides it up with the crates. People take the cabs on deck 4.']); } });

  let loops = null;
  game.events.on('zone', (e) => {
    if (loops || !e || !e.zone || e.zone.scope !== s) return;
    const w = L(noodles.o, noodles.yaw, 0, -0.8);
    loops = [game.loopAt('murmur', f, 39, 1.6, 28, { vol: 0.75, radius: 20, param: 0.85 }), game.loopAt('kitchen', f, w[0], 1.2, w[1], { vol: 0.3, radius: 6 }), game.loopAt('hum-lamp', f, 43.5, 1.6, 50, { vol: 0.12, radius: 5 })];
  });
  s.zoneBox({ id: 'quayside', place: 'quayside', box: [X0, -0.5, Z0, X1, H, Z1], name: 'The Quaysides lane', sub: 'Station Ring 2', ambience: 'station', reverb: 'hall', headroom: 3.5 });
  s.finish();
}

// =====================================================================================================================
// The Gate: x[44, 60] z[40, 60]. White, cool and orderly. Seen through the long window; its door is locked.
// =====================================================================================================================
function buildGate(game, f) {
  const s = game.world.scope('gate', f), g = s.g;
  const X0 = 44, X1 = 60, Z0 = 40, Z1 = 60, H = 3.4;
  const GC = [42.6, -0.2, Z0, X1 + 0.05, H + 0.05, Z1 + 0.05];
  const WHITE = '#eef1ee';
  floor(s, X0, Z0, X1, Z1, 0, 'speckle', '#dde3e0');
  ceiling(s, X0, Z0, X1, Z1, H, 'paint', '#eef0ee');
  s.deco(() => { g.mat('brushed', '#c8ccca'); for (let x = X0 + 2; x < X1; x += 2) g.box(x - 0.02, H - 0.03, Z0 + 0.16, x + 0.02, H, Z1 - 0.16, { faces: 'yxX' }); for (let z = Z0 + 2; z < Z1; z += 2) g.box(X0 + 0.12, H - 0.03, z - 0.02, X1 - 0.16, H, z + 0.02, { faces: 'yzZ' }); });
  const GW = { tint: WHITE, dado: { h: 1.2, mat: 'tile', tint: '#d4e2de' }, skirt: '#9aa8a6' };
  wall(s, X0, Z0 + 0.08, X1, Z0 + 0.08, 0, H, GW);
  wall(s, X1 - 0.08, Z0, X1 - 0.08, Z1, 0, H, GW);
  wall(s, X0, Z1 - 0.08, X1, Z1 - 0.08, 0, H, GW);
  // the window wall, shared with the lane: a door at its north end, then sixteen metres of glass
  wall(s, X0, Z0, X0, Z1, 0, 3.6, { t: 0.24, tintA: WHITE, tintB: '#c9b48f', skirt: false, openings: [{ at: 0.35, w: 1.0, h: 2.1 }, { at: 1.7, w: 16.6, h: 1.95, sill: 0.85 }] });
  s.structure(() => {
    g.mat('block', '#55665e'); g.box(X0 - 0.13, 0, 41.7, X0 - 0.12, 0.85, 58.3, { faces: 'x' }); g.box(X0 - 0.13, 0, Z0, X0 - 0.12, 1.0, 40.35, { faces: 'x' });
    g.mat('paint', '#e9eeec'); for (let z = 41.7; z <= 58.31; z += 16.6 / 8) g.box(X0 - 0.14, 0.85, z - 0.04, X0 + 0.14, 2.8, z + 0.04);
    g.box(X0 - 0.14, 2.76, 41.7, X0 + 0.14, 2.84, 58.3); g.box(X0 - 0.14, 0.82, 41.7, X0 + 0.14, 0.88, 58.3);
  });
  s.glass(X0, 0.88, 41.7, X0, 2.76, 58.3, { tint: '#d8ecea', opacity: 0.09 });
  sign(s, spec('gate.glass'), X0 - 0.01, 1.5, 44.3, { face: 'x', w: 0.44, h: 0.14 });
  sign(s, spec('gate.glass'), X0 - 0.01, 1.5, 55.8, { face: 'x', w: 0.44, h: 0.14 });
  painted(s, 'gate.name', 2.4, 0.42, 220, drawPlate('THE GATE', ['quarantine · anything alive'], { titleK: 0.55, a: '#d8dedc', b: '#f4f6f4', c: '#c4ccca', ink: '#1e3a3a' }), X0 - 0.13, 3.15, 50, { face: 'x' });
  sign(s, spec('gate.notice'), X0 - 0.17, 1.6, 39.5, { face: 'x', w: 0.34, h: 0.46 });
  // the locked door
  doorFrame(s, X0, 0, 40.85, 1.0, 2.1, 'z', { tint: '#c4ccca' });
  door(s, { x: X0, y: 0, z: 40.35, w: 1.0, h: 2.08, along: 'z', kind: 'hinge', style: 'glazed', tint: '#dfe6e4', locked: true, lockedText: 'Locked. Staff only',
    onLocked: (game) => tell(game, null, ['A white door with wired glass and a small engraved plate: Here a phage is a famine.', 'Through the glass someone in white looks up, smiles, and holds up one finger.']) });
  painted(s, 'gate.door.plate', 0.5, 0.12, 400, drawPlate('HERE A PHAGE IS A FAMINE', [], { titleK: 0.7 }), X0 - 0.125, 2.33, 40.85, { face: 'x' });

  // inside: the roller line with crates, hazard stripes, the spot-check bench, cabinets, the sequencer bay, the cold room
  for (const z of [43, 47, 51, 55]) prop(s, 'station.roller', 50.5, 0, z, PI / 2, { l: 4 });
  const r = new Rng(77);
  for (const z of [41.8, 43.4, 45.6, 48.1, 51.0, 53.2, 56.4]) {
    prop(s, 'crate', 50.5, 0.8, z, r.f(-0.05, 0.05), { w: 0.6, h: 0.4, d: 0.45, wood: '#c9a676' });
    s.deco(() => { g.mat('plain', '#2f8a8a'); g.box(50.19, 0.95, z - 0.23, 50.21, 1.0, z + 0.23); g.box(50.79, 0.95, z - 0.23, 50.81, 1.0, z + 0.23); g.mat('paper', '#f4f0e6'); g.box(50.18, 1.03, z - 0.08, 50.19, 1.13, z + 0.08); });
  }
  s.deco(() => { for (let i = 0; i < 64; i++) for (const x of [49.95, 51.05]) { g.mat('paint', i % 2 ? '#2a2a28' : '#e8c242'); g.box(x - 0.05, 0, 41.0 + i * 0.25, x + 0.05, 0.004, 41.25 + i * 0.25, { faces: 'Y' }); } });
  // spot-check bench
  block(s, 54.0, 0, 46.8, 57.2, 0.9, 48.2, 'brushed', '#d4d8d6', { bevel: 0.02 });
  prop(s, 'crate', 55.0, 0.9, 47.5, 0.3, { w: 0.6, h: 0.4, d: 0.45, wood: '#c9a676' });
  s.detail(() => {
    g.mat('wood', '#c9a676'); g.at(55.0, 1.3, 46.95, 0.3); g.rotX(-1.2); g.box(-0.3, 0, -0.01, 0.3, 0.45, 0.01); g.pop();
    for (let i = 0; i < 10; i++) { g.mat('plain', '#e8eeee', { rough: -0.3 }); g.cyl(56.1 + (i % 5) * 0.06, 0.9, 47.2 + Math.floor(i / 5) * 0.06, 0.012, 0.09, { segs: 6 }); g.mat('plain', ['#2f8a8a', '#e8c242', '#c9552e'][i % 3]); g.cyl(56.1 + (i % 5) * 0.06, 0.99, 47.2 + Math.floor(i / 5) * 0.06, 0.013, 0.012, { segs: 6 }); }
    g.mat('plain', '#5aa8c8'); g.box(56.6, 0.9, 47.6, 56.9, 0.98, 47.85, { bevel: 0.005 });
    g.mat('paper', '#f4f0e6'); g.box(54.3, 0.9, 47.1, 54.6, 0.905, 47.5);
  });
  // cabinets along the east wall and the north wall
  for (const z of [42.0, 43.3, 44.6, 45.9]) prop(s, 'station.cabinet', X1 - 0.16 - 0.28, 0, z, -PI / 2, { w: 1.2 });
  for (const x of [53.0, 54.3, 55.6]) prop(s, 'station.cabinet', x, 0, Z0 + 0.16 + 0.28, 0, { w: 1.2 });
  // the sequencer bay along the south wall
  block(s, 52.0, 0, Z1 - 0.8, 59.8, 0.9, Z1 - 0.08, 'brushed', '#d4d8d6', { bevel: 0.015 });
  prop(s, 'station.sequencer', 53.6, 0.9, Z1 - 0.44, PI, {});
  prop(s, 'station.sequencer', 55.6, 0.9, Z1 - 0.44, PI, {});
  prop(s, 'stool', 55.6, 0, Z1 - 1.3, 0, { h: 0.62, wood: '#9aa8a6' }, { noSpots: true });
  painted(s, 'gate.seq', 1.2, 0.22, 220, drawPlate('SEQUENCER BAY', ['twelve minutes, if it is clean'], { titleK: 0.5, a: '#d8dedc', b: '#f4f6f4', c: '#c4ccca', ink: '#1e3a3a' }), 54.6, 2.2, Z1 - 0.17, { face: 'z' });
  lamp(s, 'strip', 52.3, 2.45, Z1 - 0.22, { to: [57.6, 2.45, Z1 - 0.22], power: 0.5, K: 5000, clip: GC });
  // the cold-room door: heavy, insulated, a frost-blue lamp over it
  s.furniture(() => {
    g.mat('brushed', '#c8cfd0'); g.box(X1 - 0.2, 0, 50.0, X1 - 0.08, 2.3, 52.0, { bevel: 0.03 });
    g.mat('brushed', '#8a9294'); g.box(X1 - 0.28, 1.0, 50.25, X1 - 0.2, 1.08, 50.9, { bevel: 0.01 }); g.box(X1 - 0.26, 0.9, 50.25, X1 - 0.2, 1.2, 50.35);
    g.mat('plain', '#2a2a28'); g.box(X1 - 0.21, 0, 49.95, X1 - 0.08, 2.35, 50.0); g.box(X1 - 0.21, 0, 52.0, X1 - 0.08, 2.35, 52.05); g.box(X1 - 0.21, 2.3, 49.95, X1 - 0.08, 2.35, 52.05);
  });
  lamp(s, 'bulb', X1 - 0.4, 2.5, 51.0, { color: '#a8d8ff', power: 0.5, range: 3.5, clip: GC });
  s.deco(() => { g.mat('diffuser', '#bfe6ff', { emissive: 3 }); g.box(X1 - 0.22, 2.45, 50.85, X1 - 0.08, 2.55, 51.15, { bevel: 0.01 }); });
  painted(s, 'gate.cold', 0.8, 0.2, 260, drawPlate('COLD ROOM', ['two degrees · close the door'], { titleK: 0.5, a: '#bcd4dc', b: '#e4f0f4', c: '#a8c0c8', ink: '#1e3a3a' }), X1 - 0.21, 2.7, 51.0, { face: 'x' });
  // clipboards on the north wall, white coats on hooks
  s.detail(() => {
    for (let i = 0; i < 5; i++) { const x = 45.6 + i * 0.42; g.mat('wood', '#a88558'); g.box(x - 0.13, 1.25, Z0 + 0.16, x + 0.13, 1.6, Z0 + 0.175); g.mat('paper', '#f6f4ee'); g.box(x - 0.11, 1.27, Z0 + 0.175, x + 0.11, 1.53, Z0 + 0.18); g.mat('brushed', '#9a9e9c'); g.box(x - 0.05, 1.55, Z0 + 0.175, x + 0.05, 1.6, Z0 + 0.19); g.mat('plain', '#5a6a6a'); for (let k = 0; k < 5; k++) g.box(x - 0.09, 1.48 - k * 0.04, Z0 + 0.181, x + 0.06 - (k % 2) * 0.04, 1.484 - k * 0.04, Z0 + 0.182); }
    for (let i = 0; i < 3; i++) { const x = 49.4 + i * 0.5; g.mat('brushed', '#9a9e9c'); g.tube([[x, 1.85, Z0 + 0.16], [x, 1.85, Z0 + 0.24]], 0.01, { segs: 4 }); g.mat('weave', '#f4f6f4', { sway: 0.2 }); g.sheet([x - 0.24, 1.82, Z0 + 0.26], [x + 0.24, 1.82, Z0 + 0.26], [x + 0.26, 0.75, Z0 + 0.3], [x - 0.26, 0.75, Z0 + 0.3], { ripple: 0.03, nu: 3, nv: 5 }); }
  });
  // one crate in fifty: painted where the lane can read it, and a white trolley of crates waiting their turn
  painted(s, 'gate.fifty', 2.6, 0.4, 160, drawPlate('ONE CRATE IN FIFTY IS OPENED', ['the rest go up sealed, the same hour'], { titleK: 0.55, a: '#2f6f73', b: '#3a8a8a', c: '#2a5a5a', ink: '#f2f6f4' }), X1 - 0.17, 2.75, 50.0, { face: 'x' });
  prop(s, 'station.handcart', 46.8, 0, 52.5, 0.1, { wood: '#d8dcda', metal: '#9aa8a6' });
  for (let i = 0; i < 2; i++) prop(s, 'crate', 46.8, 0.45 + i * 0.4, 52.4, 0.1 + i * 0.05, { w: 0.6, h: 0.4, d: 0.45, wood: '#c9a676' });
  s.deco(() => { g.mat('paint', '#3a8a8a'); g.box(X0 + 0.2, 0, 59.0, 51.6, 0.004, 59.12, { faces: 'Y' }); g.box(53.6, 0, 46.4, 57.6, 0.004, 46.5, { faces: 'Y' }); });
  // a hand basin by the door
  s.furniture(() => { g.mat('glaze', '#f4f6f4'); g.box(44.6, 0.8, 41.4, 45.2, 0.95, 41.9, { bevel: 0.03 }); g.mat('brushed', '#a8aca8'); g.tube([[44.9, 0.95, 41.88], [44.9, 1.2, 41.88], [44.9, 1.2, 41.7]], 0.012, { segs: 5 }); });

  // light: cool and even, as a clean room should be, with a little of it out through the glass
  for (const x of [47.5, 53.5]) for (const z of [43.5, 49.5, 55.5]) lamp(s, 'panel', x, H, z, { w: 1.6, d: 0.45, power: 1.0, K: 5200, clip: GC });
  roomGlow(s, X0, 0, Z0, X1, H, Z1, { sky: '#eef4f6', ground: '#d8e0de', power: 0.32 });
  s.ambient({ box: [42.8, 0, 41.5, 44, 2.9, 58.5], sky: '#dfeef2', ground: '#c8d8da', power: 0.12 });

  // people inside, behind the glass
  s.spot('work', 55.6, 0, Z1 - 1.25, PI, { tags: ['gate'], who: 'noor' });
  s.spot('work', 55.6, 0, 46.4, PI, { tags: ['gate'] });
  s.spot('work', 49.7, 0, 49.0, PI / 2, { tags: ['gate'] });
  s.spot('work', 58.6, 0, 44.0, PI / 2, { tags: ['gate'] });
  // no walkways in here: only the Gate's own crew stand at these posts

  // things to do from the lane
  s.interact({ x: X0 - 0.4, y: 1.6, z: 50, radius: 2.4, wide: true, prompt: 'Look into the Gate', onUse: async (game) => {
    await tell(game, null, ['A long white room, cool and very clean. Crates roll in on a line of steel rollers, sealed, and a few of them are lifted off and opened on the bench.', 'One crate in fifty is spot-checked. At the back, a sequencer bay, cabinets of vials, and a heavy door to a cold room.']);
  } });
  s.interact({ x: X0 - 0.5, y: 1.6, z: 39.5, radius: 1.6, prompt: 'Read the notice by the door', onUse: async (game) => {
    await tell(game, null, ['Declare it. Starters, cultures, cuttings, seeds, yogurt, cheese rinds. A phage is a famine. We are quick, and kind.', "Chervil's protein comes from monoculture vats. A virus that takes one line can take it down, and a starter can carry a sleeping phage that is harmless in a kitchen and dangerous in a vat."]);
    found(game, 'phage');
  } });
  s.interact({ x: X0 - 0.4, y: 1.3, z: 46.0, radius: 1.6, prompt: "Hold your crock of Spelt's mother up to the glass", onUse: async (game) => {
    await tell(game, NOOR, ['Noor looks up from the bench, reads the seal on your crock through the glass, and nods.', "It's registered. Spelt's Gate read it before you left. The library has it as a frozen vial and a genome.", 'If the crock ever dies, they could grow it back in a week. The family would still mourn it. Go on, take it to Marit.']);
    found(game, 'starter-file');
  } });

  s.zoneBox({ id: 'gate', place: 'gate', box: [X0, -0.5, Z0, X1, H, Z1], name: 'The Gate', sub: 'Station Ring 2', ambience: 'station', reverb: 'tile', headroom: 3.3 });
  s.finish();
  void hashStr; void railing;
}
