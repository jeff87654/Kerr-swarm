// The bright square: the dim wood's opposite. A room lit like an overcast noon under a ceiling of glowing coffers, a pale
// floor, four big tubs with real small trees, long benches where people eat their bowls, and one coffer brighter than the
// rest, over a worn pale disc, where you stand with your face up. On the High decks there are rails to hold.
import { say, note } from '../city/lots.js';
import { room, railing } from '../world/kit2.js';
import { Rng, mixHex, shadeHex } from '../core/util.js';
import { local, pick, sitAWhile, passTime, brightFront, wallRail, wallRailQ, noticeBoard } from './lots_quiet_kit.js';

const SPECIES = [
  { name: 'lemon', kind: 'fruit', fruit: '#e8c53a', sq: 'ZEST SQUARE', leaf: '#ffffff' },
  { name: 'kumquat', kind: 'fruit', fruit: '#e88a2a', sq: 'KUMQUAT SQUARE', leaf: '#f4ffe8' },
  { name: 'bay', kind: 'broad', sq: 'BAY SQUARE', leaf: '#dfeccc' },
  { name: 'fig', kind: 'fruit', fruit: '#6a3a5a', sq: 'FIG SQUARE', leaf: '#ffffff' },
];
const GENERIC = ['BOWL SQUARE', 'NOON SQUARE', 'LID SQUARE', 'THE BRIGHT', 'PALE SQUARE', 'CRUST SQUARE'];
const ACCENT = ['#2f6f73', '#c9962e', '#a8412b', '#33407a', '#6b7a3a', '#8a2f3c'];
const GLAZE = ['#e9e2d0', '#a3563a', '#3d6f8a', '#6b7a3a', '#d9c7a6', '#2f6f73'];
const LID = ['#c9552e', '#2f6f73', '#d6a640', '#33407a', '#8a2f3c'];

export async function buildSquare(s, lot, plan, game, tick) {
  const r = new Rng(lot.seed), info = plan.info, H = 3.4, high = info.band === 'high';
  const L = local(s, lot, r.chance(0.5)), g = L.g, W = L.W, D = L.D;
  const sp = SPECIES[r.i(0, SPECIES.length - 1)];
  const name = r.chance(0.5) ? sp.sq : GENERIC[r.i(0, GENERIC.length - 1)];
  const nice = name.split(' ').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  const acc = ACCENT[(info.style + r.i(0, 2)) % ACCENT.length];

  // ---------------- the shell: pale stone, limewash over a tiled dado in the block's colour ----------------
  room(s, { x0: lot.x0, z0: lot.z0, x1: lot.x1, z1: lot.z1, y: 0, h: H, floor: ['stone', '#e3dccb'], ceil: ['paint', '#f2efe8'], wall: { mat: 'plaster', tint: '#f1eadb', dado: { h: 1.05, mat: 'tile', tint: acc }, skirt: shadeHex(acc, 0.6) }, open: { [lot.front]: false }, glow: false });
  const clip = L.clip(0.1, 0.3, W - 0.1, D - 0.1, -0.3, H + 0.1, 0.05);
  // a rail on the dado and a border of darker stone round the floor
  g.mat('wood', shadeHex(acc, 0.55));
  L.box(0.16, 1.04, 0.48, 0.2, 1.09, D - 0.16, { faces: 'PyY' }); L.box(W - 0.2, 1.04, 0.48, W - 0.16, 1.09, D - 0.16, { faces: 'pyY' }); L.box(0.16, 1.04, D - 0.2, W - 0.16, 1.09, D - 0.16, { faces: 'qyY' });
  g.mat('stone', '#b9ae98'); L.box(0.16, 0, 0.48, W - 0.16, 0.004, 0.9, { faces: 'Y' }); L.box(0.16, 0, D - 0.6, W - 0.16, 0.004, D - 0.16, { faces: 'Y' }); L.box(0.16, 0, 0.9, 0.6, 0.004, D - 0.6, { faces: 'Y' }); L.box(W - 0.6, 0, 0.9, W - 0.16, 0.004, D - 0.6, { faces: 'Y' });
  s.flush({ tier: 's' });
  await tick();

  // ---------------- the ceiling: coffers, each with a glowing panel; one brighter than the rest ----------------
  const nP = Math.max(3, Math.round((W - 0.4) / 4)), nQ = Math.max(3, Math.round((D - 0.6) / 4));
  const cp = (i) => 0.2 + (W - 0.4) * i / nP, cq = (k) => 0.5 + (D - 0.7) * k / nQ;
  const bi = Math.floor(nP / 2) - (nP % 2 ? 0 : r.i(0, 1)), bk = Math.floor(nQ * 0.55);
  const patch = [(cp(bi) + cp(bi + 1)) / 2, (cq(bk) + cq(bk + 1)) / 2];
  g.mat('paint', '#e9e3d6');
  for (let i = 1; i < nP; i++) L.box(cp(i) - 0.12, H - 0.32, 0.48, cp(i) + 0.12, H, D - 0.16, { faces: 'ypP' });
  for (let k = 1; k < nQ; k++) L.box(0.16, H - 0.32, cq(k) - 0.12, W - 0.16, H, cq(k) + 0.12, { faces: 'yqQ' });
  s.flush({ tier: 's' });
  for (let i = 0; i < nP; i++) for (let k = 0; k < nQ; k++) {
    const hot = i === bi && k === bk;
    g.mat('diffuser', hot ? '#fffaf0' : '#f6f4ee', { emissive: hot ? 7 : 1.7, lamp: true });
    L.box(cp(i) + 0.3, H - 0.03, cq(k) + 0.3, cp(i + 1) - 0.3, H - 0.02, cq(k + 1) - 0.3, { faces: 'y' });
    g.mat('cast', '#c9c3b6'); L.box(cp(i) + 0.22, H - 0.05, cq(k) + 0.22, cp(i + 1) - 0.22, H - 0.03, cq(k) + 0.3, { faces: 'yq' }); L.box(cp(i) + 0.22, H - 0.05, cq(k + 1) - 0.3, cp(i + 1) - 0.22, H - 0.03, cq(k + 1) - 0.22, { faces: 'yQ' });
  }
  s.flush({ tier: 's' });
  // the light itself: one long source under each row of coffers, and the bright patch
  for (let k = 0; k < nQ; k++) {
    if (nQ > 4 && k % 2 === 1 && k !== nQ - 1) continue;
    const q = (cq(k) + cq(k + 1)) / 2;
    L.light({ at: [1.2, H - 0.2, q], to: [W - 1.2, H - 0.2, q], type: 'tube', color: '#fff3e2', power: 13, range: 8.5, radius: 1.2, clip, lamp: true, shadow: true });
  }
  L.light({ at: [patch[0], H - 0.1, patch[1]], type: 'spot', dir: [0, -1, 0], cone: [30, 16], color: '#fffaf0', power: 46, range: 6, clip, lamp: true, shadow: true });
  L.glow(0, 0, 0.4, W, H, D, { sky: '#f6f1e6', ground: '#d8ccb0', power: 0.5 });
  await tick();

  // the pale disc under the patch, worn darker in the middle by feet, ringed with brass
  g.mat('terrazzo', '#f4efe4'); L.lathe(patch[0], patch[1], [[0, 0.004], [1.15, 0.004], [1.17, 0.012], [0, 0.014]], { segs: 32 });
  g.mat('cast', '#c8a45a', { rough: -0.3 }); L.lathe(patch[0], patch[1], [[1.17, 0.012], [1.24, 0.014], [1.24, 0.016], [1.17, 0.016]], { segs: 32, capBottom: false, capTop: false });
  g.mat('terrazzo', '#e2d9c6'); L.lathe(patch[0], patch[1], [[0, 0.0145], [0.45, 0.0145], [0, 0.0146]], { segs: 20, capBottom: false });
  s.flush({ tier: 's', cast: false });

  // ---------------- the front: tall windows and a wide way in, the name lit above ----------------
  const fin = { mat: 'plaster', tint: '#efe4cc', dado: { h: 1.0, mat: 'tile', tint: acc }, trim: shadeHex(acc, 0.6), pil: '#d4c7ae', bar: shadeHex(acc, 0.5), step: '#c9bda6', sillT: '#8a6240' };
  const dP = W / 2 + r.f(-2.4, 2.4);
  await brightFront(L, plan, { doorP: dP, doorW: 3.6, fin, H, name, sub: 'lit like an overcast noon', palette: [shadeHex(acc, 0.5), '#fbf3df', '#f3d27a'], inner: { mat: 'plaster', tint: '#f1eadb', dado: { h: 1.05, mat: 'tile', tint: acc } } }, tick);
  await tick();

  // ---------------- four tubs with trees, seats built round them ----------------
  const tubs = [[W * 0.2, D * 0.34], [W * 0.8, D * 0.34], [W * 0.2, D * 0.76], [W * 0.8, D * 0.76]].map((t) => [t[0] + r.f(-0.4, 0.4), t[1] + r.f(-0.3, 0.3)]);
  const TS = 2.5, TH = 0.6;
  const tubWood = ['#8a6240', '#7a5233', '#6b4a2f', '#9a6a40'];
  const seats = [];
  tubs.forEach((t, k) => {
    const a = TS / 2;
    L.block(t[0] - a, 0, t[1] - a, t[0] + a, TH, t[1] + a, 'wood', tubWood[k], { bevel: 0.02 });
    g.mat('stone', '#d8ccb4'); L.box(t[0] - a - 0.04, TH, t[1] - a - 0.04, t[0] + a + 0.04, TH + 0.05, t[1] + a + 0.04, { bevel: 0.01 });
    g.mat('soil', '#6b5a48'); L.box(t[0] - a + 0.08, TH + 0.03, t[1] - a + 0.08, t[0] + a - 0.08, TH + 0.055, t[1] + a - 0.08, { faces: 'Y' });
    // the seat: a plank ledge on the two sides that face the middle of the room
    const sp2 = t[0] < W / 2 ? 1 : -1, sq2 = t[1] < D * 0.55 ? 1 : -1;
    g.mat('wood', '#b98a5a', { rough: -0.1 });
    L.box(t[0] + sp2 * a, 0.42, t[1] - a, t[0] + sp2 * (a + 0.42), 0.47, t[1] + a, { bevel: 0.01 });
    L.box(t[0] - a, 0.42, t[1] + sq2 * a, t[0] + a, 0.47, t[1] + sq2 * (a + 0.42), { bevel: 0.01 });
    g.mat('cast', '#3d4a45'); for (const u of [-a + 0.2, a - 0.2]) { L.box(t[0] + sp2 * (a + 0.3) - 0.03, 0, t[1] + u - 0.03, t[0] + sp2 * (a + 0.3) + 0.03, 0.42, t[1] + u + 0.03); L.box(t[0] + u - 0.03, 0, t[1] + sq2 * (a + 0.3) - 0.03, t[0] + u + 0.03, 0.42, t[1] + sq2 * (a + 0.3) + 0.03); }
    s.flush({ tier: 's', cast: true });
    L.solid(t[0] + Math.min(0, sp2) * (a + 0.42) + Math.max(0, sp2) * a, 0, t[1] - a, t[0] + Math.max(0, sp2) * (a + 0.42) + Math.min(0, sp2) * a, 0.47, t[1] + a);
    L.solid(t[0] - a, 0, t[1] + Math.min(0, sq2) * (a + 0.42) + Math.max(0, sq2) * a, t[0] + a, 0.47, t[1] + Math.max(0, sq2) * (a + 0.42) + Math.min(0, sq2) * a);
    for (const u of [-0.55, 0.55]) { seats.push([t[0] + sp2 * (a + 0.22), t[1] + u, sp2, 0]); seats.push([t[0] + u, t[1] + sq2 * (a + 0.22), 0, sq2]); }
    // the tree, and herbs under it
    L.prop('lots-quiet.tree', t[0], TH + 0.04, t[1], r.f(0, 6.28), { h: 2.68, w: 1.35, v: k, kind: sp.kind, fruit: sp.fruit, nf: sp.fruit ? 6 + k * 2 : 0, fs: sp.name === 'kumquat' ? 0.03 : 0.04, leaf: sp.leaf });
    for (let j = 0; j < 7; j++) { const an = j / 7 * 6.28 + 0.4; L.prop('lots-quiet.shrub', t[0] + Math.cos(an) * 0.85, TH + 0.04, t[1] + Math.sin(an) * 0.85, r.f(0, 6.28), { s: j % 3 ? 0.42 : 0.6, v: j % 3, kind: j % 2 ? 'blossom' : 'leafB' }); }
  });
  await tick();

  // ---------------- long benches against the walls ----------------
  const benchRow = (p0, p1, q, dq) => {
    const n = Math.max(1, Math.floor((p1 - p0) / 3.4)), w = (p1 - p0) / n - 0.3;
    for (let i = 0; i < n; i++) {
      const c = p0 + (p1 - p0) * (i + 0.5) / n;
      L.prop('bench', c, 0, q, L.yaw(0, dq), { w, back: true, wood: ['#7a5233', '#8a6240', '#6b4a2f'][(i + Math.round(q)) % 3], metal: shadeHex(acc, 0.45) }, { noSpots: true });
      for (let u = -w / 2 + 0.35; u < w / 2 - 0.2; u += 0.65) seats.push([c + u, q, 0, dq]);
    }
  };
  const benchRowQ = (q0, q1, p, dp) => {
    const n = Math.max(1, Math.floor((q1 - q0) / 3.4)), w = (q1 - q0) / n - 0.3;
    for (let i = 0; i < n; i++) {
      const c = q0 + (q1 - q0) * (i + 0.5) / n;
      L.prop('bench', p, 0, c, L.yaw(dp, 0), { w, back: true, wood: ['#7a5233', '#8a6240', '#6b4a2f'][(i + 1) % 3], metal: shadeHex(acc, 0.45) }, { noSpots: true });
      for (let u = -w / 2 + 0.35; u < w / 2 - 0.2; u += 0.65) seats.push([p, c + u, dp, 0]);
    }
  };
  benchRow(1.2, W - 1.2, D - 0.62, -1);
  benchRowQ(3.0, D - 1.6, 0.62, 1); benchRowQ(3.0, D - 1.6, W - 0.62, -1);
  await tick();
  // cloths hung above the benches, in every colour the dyers had over: colour weighs nothing
  const CLOTH = ['#c9552e', '#2f6f73', '#d6a640', '#5b3a6e', '#6b7a3a', '#a8412b', '#33407a', '#e0b04a', '#8a2f3c', '#3f7f6a'];
  const hangP = (p0, p1, q, dq) => { for (let p = p0; p < p1 - 1.0; p += r.f(1.9, 2.6)) { const w = r.f(0.9, 1.4), c = CLOTH[r.i(0, CLOTH.length - 1)], c2 = CLOTH[r.i(0, CLOTH.length - 1)];
    g.mat(r.chance(0.5) ? 'stripe' : 'motif', c); L.box(p, 1.45 + r.f(0, 0.2), q, p + w, 2.85, q + dq * 0.02, { faces: dq > 0 ? 'Q' : 'q' });
    g.mat('weave', c2); L.box(p - 0.02, 2.85, q, p + w + 0.02, 2.9, q + dq * 0.035); g.mat('wood', '#6b4a2f'); L.tube([[p - 0.08, 2.92, q + dq * 0.04], [p + w + 0.08, 2.92, q + dq * 0.04]], 0.015, { segs: 5 }); } s.flush({ tier: 'd', cast: false }); };
  const hangQ = (q0, q1, p, dp) => { for (let q = q0; q < q1 - 1.0; q += r.f(1.9, 2.6)) { const w = r.f(0.9, 1.4), c = CLOTH[r.i(0, CLOTH.length - 1)], c2 = CLOTH[r.i(0, CLOTH.length - 1)];
    g.mat(r.chance(0.5) ? 'stripe' : 'motif', c); L.box(p, 1.45 + r.f(0, 0.2), q, p + dp * 0.02, 2.85, q + w, { faces: dp > 0 ? 'P' : 'p' });
    g.mat('weave', c2); L.box(p, 2.85, q - 0.02, p + dp * 0.035, 2.9, q + w + 0.02); g.mat('wood', '#6b4a2f'); L.tube([[p + dp * 0.04, 2.92, q - 0.08], [p + dp * 0.04, 2.92, q + w + 0.08]], 0.015, { segs: 5 }); } s.flush({ tier: 'd', cast: false }); };
  hangP(1.0, W - 1.0, D - 0.17, -1); hangQ(3.2, D - 1.2, 0.17, 1); hangQ(3.2, D - 1.2, W - 0.17, -1);
  // big pots in the corners and between the benches
  for (const pp of [[0.75, D - 0.75], [W - 0.75, D - 0.75], [0.7, 2.6], [W - 0.7, 2.6]]) L.prop('plant', pp[0], 0, pp[1], r.f(0, 6), { kind: r.chance(0.5) ? 'broad' : 'fine', size: r.f(1.5, 1.9), pot: GLAZE[r.i(0, 5)] });
  await tick();
  // bowls on the seats, under their lids, beside about a third of them
  seats.forEach((st, k) => {
    L.spot('sit', st[0], 0.46, st[1], L.yaw(st[2], st[3]), { tags: ['square', 'eat', 'bowl'] });
    if (r.chance(0.3)) { const off = r.chance(0.5) ? 0.28 : -0.28; L.prop('bowl', st[0] - st[3] * off, 0.47, st[1] + st[2] * off, r.f(0, 6), { glaze: GLAZE[r.i(0, 5)], lid: LID[r.i(0, 4)], r: 0.085 }, { noCollide: true }); }
  });
  await tick();

  // two benches facing the bright patch from either side, for those waiting their minute
  for (const sg of [-1, 1]) {
    const bp = patch[0] + sg * 3.3, bq = patch[1];
    if (bp < 2 || bp > W - 2) continue;
    L.prop('bench', bp, 0, bq, L.yaw(-sg, 0), { w: 2.2, back: true, wood: '#8a6240', metal: shadeHex(acc, 0.45) }, { noSpots: true });
    for (const u of [-0.7, 0, 0.7]) L.spot('sit', bp, 0.46, bq + u, L.yaw(-sg, 0), { tags: ['square', 'eat', 'wait'] });
  }
  await tick();
  // ---------------- the cart for lids by the door, a fountain, a few pots ----------------
  const cartP = dP > W / 2 ? dP - 3.2 : dP + 3.2, cartQ = 1.3;
  g.mat('wood', '#6b4a2f'); L.box(cartP - 0.5, 0.25, cartQ - 0.3, cartP + 0.5, 0.82, cartQ + 0.3, { bevel: 0.015 });
  g.mat('cast', '#3d4a45'); for (const u of [-0.42, 0.42]) L.cyl(cartP + u, 0, cartQ - 0.3, 0.12, 0.04, { segs: 10 }), L.cyl(cartP + u, 0, cartQ + 0.3, 0.12, 0.04, { segs: 10 });
  L.tube([[cartP - 0.5, 0.82, cartQ - 0.3], [cartP - 0.62, 1.0, cartQ - 0.3], [cartP - 0.62, 1.0, cartQ + 0.3], [cartP - 0.5, 0.82, cartQ + 0.3]], 0.014, { segs: 5 });
  s.flush({ tier: 's', cast: true }); L.solid(cartP - 0.6, 0, cartQ - 0.32, cartP + 0.5, 0.82, cartQ + 0.32);
  for (let k = 0; k < 7; k++) { const c = LID[k % LID.length]; g.mat('glaze', c); L.cyl(cartP - 0.25 + (k % 3) * 0.25, 0.82 + Math.floor(k / 3) * 0.035, cartQ + (k % 2 ? 0.1 : -0.1), 0.1, 0.03, { segs: 12 }); }
  s.flush({ tier: 'd', cast: false });
  { const fp = dP > W / 2 ? 1.0 : W - 1.0; L.prop('court.fountain', fp, 0, 2.0, L.yaw(fp < W / 2 ? 1 : -1, 0)); }
  for (const pp of [[0.7, 1.1], [W - 0.7, 1.1]]) L.prop('plant', pp[0], 0, pp[1], 0, { kind: 'broad', size: 1.4, pot: GLAZE[r.i(1, 3)] });

  // ---------------- rails to hold on the High decks ----------------
  if (high) {
    wallRail(L, D - 0.16, 0.6, W - 0.6, 1, { y: 0.92, tint: '#8a6240' });
    wallRailQ(L, 0.16, 1.0, D - 0.6, -1, { y: 0.92 }); wallRailQ(L, W - 0.16, 1.0, D - 0.6, 1, { y: 0.92 });
    railing(s, [L.P(patch[0] - 1.55, patch[1] - 1.1), L.P(patch[0] - 1.55, patch[1] + 1.1)], 0, { h: 0.95, tint: '#3d4a45', rail: '#b98a5a', posts: 1.1 });
    railing(s, [L.P(patch[0] + 1.55, patch[1] - 1.1), L.P(patch[0] + 1.55, patch[1] + 1.1)], 0, { h: 0.95, tint: '#3d4a45', rail: '#b98a5a', posts: 1.1 });
  }
  await tick();

  // ---------------- people: groups standing and talking, a sweeper, somebody in the light ----------------
  const ring = (p, q, n, rad) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.5, pp = p + Math.cos(a) * rad, qq = q + Math.sin(a) * rad; L.spot('chat', pp, 0, qq, L.yaw(p - pp, q - qq), { tags: ['square', 'talk'] }); } };
  ring(W * 0.5, D * 0.3, 3, 0.75); ring(W * 0.36, D * 0.86, 4, 0.8); ring(W * 0.64, D * 0.86, 3, 0.7);
  L.spot('stand', patch[0], 0, patch[1], L.yaw(0, -1), { tags: ['square', 'light', 'faceup'] });
  L.spot('stand', patch[0] + 0.5, 0, patch[1] + 0.35, L.yaw(-0.3, -1), { tags: ['square', 'light'] });
  L.spot('work', W * 0.5, 0, D * 0.42, L.yaw(1, 0), { tags: ['square', 'sweep'] });
  L.spot('work', tubs[1][0] - 1.4, 0, tubs[1][1] - 1.3, L.yaw(1, 1), { tags: ['square', 'notes', 'garden'] });
  L.path([[dP, 1.2], [dP, D * 0.5], [W * 0.5, D * 0.86]], { width: 1.6, tags: ['square'] });
  L.path([[dP, D * 0.5], [W * 0.2, D * 0.55], [1.4, D * 0.55]], { width: 1.4 });
  L.path([[dP, D * 0.5], [W * 0.8, D * 0.55], [W - 1.4, D * 0.55]], { width: 1.4 });
  L.path([[dP, D * 0.5], [patch[0], patch[1] - 0.8]], { width: 1.2 });
  L.loop('murmur', W / 2, 1.2, D / 2, { vol: 0.28, radius: 15, param: 0.35 });

  // ---------------- things to do ----------------
  const seed = lot.seed;
  L.act(patch[0], 1.0, patch[1], 1.2, 'Stand in the light, face up', async (gm) => {
    const pl = gm.player; if (pl) { const a = L.P(patch[0], patch[1]); if (pl.seat) pl.stand(); pl.place(pl.frame, a[0], 0, a[1], L.look(0, 1), 1.25); }
    await passTime(gm, 2);
    note(gm, pick(seed, 11, [
      'You stand in the brightest patch with your face up. It is warm on the eyelids, the way the old ones say the sunline is over the Hollow at noon.',
      'Face up, eyes shut. The light comes through your eyelids red. The person next to you is doing the same, and neither of you mentions it.',
      'Two minutes in the brightest light in the block. Children are sent here when they are peaky, with a bowl of the Nine.',
      'The patch is lit several times brighter than a home. People take a minute each in it, and the queue sorts itself out.',
    ]));
  });
  L.act(seats[0][0], 0.7, seats[0][1], 1.2, 'Sit on the bench a while', (gm) => sitAWhile(L, gm, seats[0][0], seats[0][1], seats[0][2], seats[0][3], 20, pick(seed, 12, [
    'Twenty minutes on the bench. Three people beside you lifted their lids at the same moment, and laughed about it.',
    'You sit. Somebody passes you the heel of a loaf without a word, as if you had been expected.',
    'Twenty minutes in the bright. Your shoulders come down from round your ears.',
    'A while on the bench. A child walks the length of the square with a full bowl in both hands, very slowly, and makes it.',
  ])));
  { const t = tubs[0]; const n = 6 + (seed % 9); L.act(t[0], 1.2, t[1], 2.0, 'Look at the ' + sp.name + ' tree', (gm) => say(gm, 'The ' + sp.name + ' tree', [pick(seed, 13, [
    'A ' + sp.name + ' in a tub, under more light than most homes get. ' + (sp.fruit ? n + ' fruit this year. The block court decides who has them, and minutes it.' : 'The hall cooks take a leaf at a time and sign the book on the tub.'),
    'A brass plate on the tub: given by the hall when the old tree died. The old tree is part of the hall\'s table now.',
    'Under this much light a ' + sp.name + ' grows as if it means it. Under a home lamp it sulks.',
    'A paper tag on the lowest branch: "Counted. Please do not count again."',
  ])])); }
  { const nb = L.P(0.17, D * 0.3); void nb; }
  await tick();
  noticeBoard(L, 0.17, 1.55, 2.4, 1, 0, lot.seed);
  await tick();
  L.act(0.6, 1.5, 2.4, 1.3, 'Read the notice', (gm) => say(gm, nice, [pick(seed, 14, [
    'Lit like an overcast noon from eight to eight, then down to a lamp. The light is the block\'s: about what a dim wood ten times this size would cost.',
    'Bowls welcome. Lids back on the cart by the door. Crumbs are the trees\' business.',
    'The bright patch: one minute each when there is a queue. Elders and the peaky first.',
    'Voted bright by the block court, over a dim wood, by a show of hands. The wood lost by nine, and still asks every year.',
  ]) + (high ? ' Rails along the walls and by the patch: hold on when you look up.' : '')]));

  L.zone({ place: 'city-special', name: nice, sub: info.name + ' · bright square · lit like an overcast noon', ambience: 'court', reverb: 'room', cell: info.key,
    env: { exposure: 1.0, autoKey: 0.19, autoMin: 0.55, autoMax: 1.4, bloom: 0.07, warmth: 0.08, contrast: 1.14, saturation: 1.12 } });
  void mixHex;
  return L;
}
