// The dim wood: a room lit like a cloudy evening, planted close. One deep doorway from the avenue, a lobby with a felt
// curtain, then stepping stones that wind round an island bed of trees to a bench where the path turns, past a spout in
// the back wall whose rill runs down to a pool. People come in to be alone for ten minutes.
import { say, note } from '../city/lots.js';
import { room } from '../world/kit2.js';
import { Rng, hashStr, mixHex } from '../core/util.js';
import { local, pick, sitAWhile, deepFront, steppingStone, rill, distToPath, smoothPath } from './lots_quiet_kit.js';

const NAMES = ['ALDER WALK', 'THE HUSH', 'MOSS WALK', 'FERN DIM', 'THE TEN MINUTES', 'ROWAN DIM', 'LOW WOOD', 'BIRCH DIM'];
const TREE_KINDS = ['birch', 'broad', 'fine'];

function benchAt(L, p, q, dp, dq, w, tags, wood) {
  L.prop('bench', p, 0, q, L.yaw(dp, dq), { w, back: true, wood: wood || '#5b4636', metal: '#2a3530' }, { noSpots: true });
  const n = Math.max(1, Math.floor(w / 0.6));
  for (let i = 0; i < n; i++) { const lx = -w / 2 + (i + 0.5) * w / n; L.spot('sit', p - dq * lx, 0.46, q + dp * lx, L.yaw(dp, dq), { tags }); }
}

export async function buildDimWood(s, lot, plan, game, tick) {
  const r = new Rng(lot.seed), info = plan.info, H = 3.4;
  const L = local(s, lot, r.chance(0.5)), g = L.g, W = L.W, D = L.D;
  const name = NAMES[r.i(0, NAMES.length - 1)];
  const nice = name.charAt(0) + name.slice(1).toLowerCase();
  // ---------------- the shell: a soil floor, felt over old stone, a dark felt ceiling ----------------
  room(s, { x0: lot.x0, z0: lot.z0, x1: lot.x1, z1: lot.z1, y: 0, h: H, floor: ['soil', '#5b4a3a'], ceil: ['felt', '#1a2622'], wall: { mat: 'felt', tint: '#22403a', dado: { h: 1.1, mat: 'stone', tint: '#7f8576' }, skirt: false }, open: { [lot.front]: false }, glow: false });
  const clip = L.clip(0.1, 0.4, W - 0.1, D - 0.1, -0.3, H + 0.1, 0.05);
  await tick();
  // moss along the top of the stone, battens on the felt, dark beams across the ceiling
  g.mat('grass', '#5f7a3a');
  L.box(0.16, 1.1, 0.48, 0.2, 1.15, D - 0.16, { faces: 'PY' }); L.box(W - 0.2, 1.1, 0.48, W - 0.16, 1.15, D - 0.16, { faces: 'pY' }); L.box(0.16, 1.1, D - 0.2, W - 0.16, 1.15, D - 0.16, { faces: 'qY' });
  s.flush({ tier: 's' });
  g.mat('wood', '#2e2620');
  for (let p = 1.4; p < W - 0.5; p += 1.6) L.box(p - 0.03, 1.15, D - 0.2, p + 0.03, H, D - 0.16 - 0.04, { faces: 'qpP' });
  for (let q = 1.6; q < D - 0.5; q += 1.6) { L.box(0.16, 1.15, q - 0.03, 0.2, H, q + 0.03, { faces: 'PqQ' }); L.box(W - 0.2, 1.15, q - 0.03, W - 0.16, H, q + 0.03, { faces: 'pqQ' }); }
  s.flush({ tier: 's' });
  await tick();
  for (let p = 3; p < W - 1; p += 3.2) { g.mat('paint', '#2b2f2a'); L.box(p - 0.12, H - 0.32, 0.48, p + 0.12, H, D - 0.16, { faces: 'ypP' }); s.flush({ tier: 's' }); }
  await tick();

  // ---------------- the front: a plain wall of old stone, one deep doorway, the name in pale letters ----------------
  const fin = { mat: 'stone', tint: '#8f8a78', dado: { h: 1.0, mat: 'stone', tint: '#6f7566' }, trim: '#2b3a33', pil: '#9b917c', arch: '#b0a58e', step: '#7f7766', trough: '#8f8572' };
  const dP = W * 0.36 + r.f(-1, 1);
  const F = await deepFront(L, plan, { doorP: dP, doorW: 1.6, fin, H, name, letters: '#d9efc0', lettersGlow: 1.0, plate: [name, 'dim wood · kept dim by vote'],
    inner: { mat: 'felt', tint: '#22403a', dado: { h: 1.1, mat: 'stone', tint: '#7f8576' } }, lobby: { tint: '#2a3a33', felt: '#3d5a48', floor: ['rush', '#6b5f48'] }, troughs: 'fern', lampK: 2500 }, tick);
  await tick();

  // ivy over the lobby's walls and the inside of the front: flat cards of leaf against the felt
  {
    const ivy = (p0, p1, q, dq, y0, y1, n) => { for (let k = 0; k < n; k++) { const p = r.f(p0, p1), y = r.f(y0, y1), sz = r.f(0.55, 0.95); g.mat(r.chance(0.6) ? 'leafA' : 'leafB', mixHex('#ffffff', '#9fbf80', r.next() * 0.5), { sway: 0.05 }); L.card(p, y, q + dq * r.f(0.04, 0.09), sz, sz * 1.1, L.yaw(0, dq), { tilt: r.f(-0.15, 0.15) }); } s.flush({ tier: 'd', cast: false }); };
    const ivyQ = (p, q0, q1, dp, y0, y1, n) => { for (let k = 0; k < n; k++) { const q = r.f(q0, q1), y = r.f(y0, y1), sz = r.f(0.55, 0.95); g.mat(r.chance(0.6) ? 'leafA' : 'leafB', mixHex('#ffffff', '#9fbf80', r.next() * 0.5), { sway: 0.05 }); L.card(p + dp * r.f(0.04, 0.09), y, q, sz, sz * 1.1, L.yaw(dp, 0), { tilt: r.f(-0.15, 0.15) }); } s.flush({ tier: 'd', cast: false }); };
    ivy(dP - 1.8, dP + 1.8, 3.18, 1, 0, 2.6, 34);
    ivyQ(dP - 1.88, 0.6, 3.1, -1, 0, 2.6, 26);
    ivy(0.3, dP - 2.2, 0.48, 1, 0.2, 3.0, 20);
    ivy(dP + 2.4, W - 0.4, 0.48, 1, 0.2, 3.0, 26);
  }
  await tick();

  // ---------------- the plan: a loop of stones from the lobby, round an island bed, a turn at the back ----------------
  const j = () => r.f(-0.5, 0.5);
  const T = [W * 0.44 + j(), D - 3.0];
  const way = [[F.exitP, F.exitQ], [W * 0.68 + j(), D * 0.22 + j()], [W * 0.76 + j(), D * 0.48 + j()], [W * 0.66 + j(), D * 0.74 + j()], T,
    [W * 0.22 + j(), D * 0.68 + j()], [W * 0.17 + j(), D * 0.42 + j()], [W * 0.28 + j(), D * 0.22 + j()], [F.exitP - 0.6, F.Q1 + 0.9], [F.exitP, F.exitQ + 0.3]];
  const line = smoothPath(way, 0.62);
  const rillP = W - 2.2, poolP = W - 2.45, poolQ = D * 0.3, poolR = 0.95;
  const bench1 = [T[0], D - 1.05], bench2 = [poolP - 2.0, poolQ - 0.1];
  // the island: as big as the loop allows
  const ic = [W * 0.47, D * 0.5];
  let iR = 3.2; for (const pt of line) iR = Math.min(iR, Math.hypot(pt[0] - ic[0], pt[1] - ic[1]) - 0.8);
  iR = Math.max(1.3, iR);
  // beds against the walls: [p0, q0, p1, q1]
  const BD = 1.75;
  const beds = [
    [0.16, F.Q1 + 0.6, BD, D - 0.16],
    [BD, D - BD, Math.max(BD + 0.5, T[0] - 1.5), D - 0.16],
    [T[0] + 1.5, D - BD, W - 2.9, D - 0.16],
    [W - BD + 0.1, poolQ + 1.4, W - 0.16, D - 0.16],
  ].filter((b) => b[2] - b[0] > 0.6 && b[3] - b[1] > 0.6);
  const inBed = (p, q, m) => beds.some((b) => p > b[0] - m && p < b[2] + m && q > b[1] - m && q < b[3] + m);

  // ---------------- beds: old sleepers round a metre of growing fibre ----------------
  const BH = 0.42;
  for (const b of beds) {
    g.mat('wood', '#3f3226', { rough: 0.1 }); L.box(b[0], 0, b[1], b[2], BH, b[3], { bevel: 0.02, aoBottom: 0.6, faces: 'pPqQ' });
    g.mat('soil', '#6b5a48'); L.box(b[0] + 0.08, BH - 0.02, b[1] + 0.08, b[2] - 0.08, BH + 0.005, b[3] - 0.08, { faces: 'Y' });
    g.mat('grass', '#5f7a3a'); L.box(b[0] + 0.02, BH - 0.01, b[1] + 0.02, b[2] - 0.02, BH + 0.012, b[1] + 0.1, { faces: 'Y' });
    s.flush({ tier: 's', cast: true }); L.solid(b[0], 0, b[1], b[2], BH, b[3]);
  }
  // the island: a ring of mossed stone
  g.mat('stone', '#5f655a', { rough: 0.15 }); L.lathe(ic[0], ic[1], [[iR + 0.12, 0], [iR + 0.15, 0.2], [iR + 0.08, 0.34], [iR - 0.08, 0.36], [iR - 0.12, 0.3]], { segs: 28, capBottom: false });
  g.mat('soil', '#5b4a3a'); L.cyl(ic[0], 0.3, ic[1], iR - 0.1, 0.02, { segs: 24, capBottom: false });
  g.mat('grass', '#6f8f48'); L.lathe(ic[0], ic[1], [[iR - 0.02, 0.33], [iR - 0.25, 0.345]], { segs: 28, capBottom: false, capTop: false });
  s.flush({ tier: 's', cast: true }); L.post(ic[0], ic[1], iR + 0.12, 0, 0.36);
  await tick();

  // ---------------- the rill: a spout in the back wall, a channel, a pool ----------------
  rill(L, [rillP, D - 0.85], [rillP, poolQ + poolR - 0.05]);
  g.mat('stone', '#6f6a5c'); L.box(rillP - 0.7, 0, D - 0.3, rillP + 0.7, 1.7, D - 0.16, { bevel: 0.02, faces: 'qpPY' });
  g.mat('stone', '#6f7566'); L.box(rillP - 0.55, 0.2, D - 0.32, rillP + 0.55, 1.5, D - 0.3, { faces: 'q' });
  g.mat('grass', '#5f7a3a'); L.box(rillP - 0.72, 1.7, D - 0.32, rillP + 0.72, 1.76, D - 0.16, { faces: 'YqpP' });
  g.mat('cast', '#a8823f', { rough: -0.2 }); L.tube([[rillP, 0.95, D - 0.3], [rillP, 0.95, D - 0.5], [rillP, 0.9, D - 0.56]], 0.028, { segs: 8 });
  g.mat('plain', '#d6efe6', { rough: -0.5, emissive: 0.25 }); L.box(rillP - 0.012, 0.16, D - 0.6, rillP + 0.012, 0.9, D - 0.57);
  g.mat('stone', '#7a8070'); L.box(rillP - 0.5, 0, D - 0.9, rillP + 0.5, 0.25, D - 0.3, { bevel: 0.02, faces: 'pPqY' });
  g.mat('plain', '#1f3d38', { rough: -0.48 }); L.box(rillP - 0.4, 0.2, D - 0.85, rillP + 0.4, 0.205, D - 0.36, { faces: 'Y' });
  s.flush({ tier: 's', cast: false }); L.solid(rillP - 0.5, 0, D - 0.9, rillP + 0.5, 0.25, D - 0.16);
  g.mat('stone', '#7a8070'); L.lathe(poolP, poolQ, [[poolR + 0.2, 0], [poolR + 0.22, 0.14], [poolR + 0.15, 0.2], [poolR, 0.18], [poolR - 0.02, 0.05]], { segs: 24, capBottom: false, capTop: false });
  g.mat('stone', '#4d5248'); L.cyl(poolP, 0, poolQ, poolR, 0.02, { segs: 20 });
  g.mat('plain', '#1a3833', { rough: -0.5 }); L.cyl(poolP, 0.06, poolQ, poolR, 0.045, { segs: 24 });
  s.flush({ tier: 's', cast: false }); L.post(poolP, poolQ, poolR + 0.15, 0, 0.2);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; L.prop('fernery.stone', poolP + Math.cos(a) * (poolR + 0.38), 0, poolQ + Math.sin(a) * (poolR + 0.38), r.f(0, 6.28), { r: r.f(0.16, 0.28), v: i + 3 }); }
  L.loop('fountain', rillP, 0.6, D - 0.6, { vol: 0.32, radius: 9 });
  L.loop('water-lap', poolP, 0.2, poolQ, { vol: 0.14, radius: 5 });
  await tick();

  // ---------------- the stones, gravel under the benches, moss ----------------
  for (let i = 0; i < line.length; i++) {
    const pt = line[i]; steppingStone(L, pt[0] + r.f(-0.1, 0.1), pt[1] + r.f(-0.1, 0.1), r.f(0.25, 0.32), mixHex('#9a937f', '#7c7a6a', r.next()));
    if (i % 12 === 11) { s.flush({ tier: 's', cast: false }); await tick(); }
  }
  s.flush({ tier: 's', cast: false });
  g.mat('gravel', '#8f8775'); L.box(bench1[0] - 1.3, 0, bench1[1] - 1.1, bench1[0] + 1.3, 0.012, bench1[1] + 0.85, { faces: 'Y' }); L.box(bench2[0] - 0.9, 0, bench2[1] - 1.1, bench2[0] + 0.7, 0.012, bench2[1] + 1.1, { faces: 'Y' });
  s.flush({ tier: 's', cast: false });
  // moss: low mounds over the floor wherever the stones are not, and a cap of it on the island
  for (let k = 0, n = 0; k < 160 && n < 46; k++) {
    const p = r.f(0.6, W - 0.6), q = r.f(F.Q1 + 0.4, D - 0.5), rr = r.f(0.35, 0.95);
    if (distToPath(line, p, q) < rr + 0.35 || inBed(p, q, rr) || Math.hypot(p - poolP, q - poolQ) < poolR + 0.3 + rr || Math.hypot(p - ic[0], q - ic[1]) < iR + 0.2 + rr) continue;
    g.mat('grass', mixHex('#4f6a38', '#6c8a46', r.next()), { rough: 0.2 }); L.ball(p, -0.02, q, rr, r.f(0.05, 0.11), { segs: 9, rings: 3, bottom: 0 }); n++;
    if (n % 12 === 0) s.flush({ tier: 's', cast: false });
  }
  for (let k = 0; k < 9; k++) { const a = k / 9 * 6.28 + r.f(0, 0.5), rr = r.f(0.3, 0.6), d = r.f(0.3, iR - 0.6); g.mat('grass', mixHex('#4f6a38', '#6c8a46', r.next())); L.ball(ic[0] + Math.cos(a) * d, 0.27, ic[1] + Math.sin(a) * d, rr, r.f(0.1, 0.16), { segs: 9, rings: 4, bottom: 0 }); }
  s.flush({ tier: 's', cast: false });
  await tick();

  // ---------------- trees, shrubs, ferns, old stones ----------------
  const trees = [];
  const tk = (k) => TREE_KINDS[(k + r.i(0, 2)) % 3];
  trees.push([ic[0] - iR * 0.35, ic[1] + iR * 0.2, 0.3, tk(0)], [ic[0] + iR * 0.4, ic[1] - iR * 0.3, 0.3, tk(1)]);
  if (iR > 2.2) trees.push([ic[0] + iR * 0.1, ic[1] + iR * 0.55, 0.3, tk(2)]);
  trees.push([beds[0][0] + 0.9, D * 0.55, BH, tk(1)]);
  if (beds[1]) trees.push([(beds[1][0] + beds[1][2]) / 2, D - 0.95, BH, tk(2)]);
  if (beds[2]) trees.push([(beds[2][0] + beds[2][2]) / 2, D - 0.95, BH, tk(0)]);
  // two or three more standing in the floor among the ferns, each in a ring of stones
  for (let k = 0, n = 0; k < 40 && n < 3; k++) {
    const p = r.f(2.5, W - 3), q = r.f(F.Q1 + 1.5, D - 3);
    if (distToPath(line, p, q) < 1.1 || inBed(p, q, 0.8) || Math.hypot(p - ic[0], q - ic[1]) < iR + 1 || Math.hypot(p - poolP, q - poolQ) < poolR + 1.2 || trees.some((t) => Math.hypot(t[0] - p, t[1] - q) < 2.5)) continue;
    trees.push([p, q, 0, TREE_KINDS[(n + 1) % 3]]); n++;
    g.mat('grass', '#4f6a38'); L.ball(p, -0.02, q, 0.7, 0.1, { segs: 9, rings: 3, bottom: 0 }); s.flush({ tier: 's', cast: false });
  }
  trees.forEach((t, k) => { const h = H - t[2] - r.f(0.25, 0.55); L.prop('lots-quiet.tree', t[0], t[2], t[1], r.f(0, 6.28), { h: +h.toFixed(1), w: +(r.f(0.8, 1.15)).toFixed(2), v: k % 4, kind: t[3] }); });
  await tick();
  // shrubs along the beds
  for (const b of beds) {
    const long = (b[2] - b[0]) > (b[3] - b[1]);
    const len = long ? b[2] - b[0] : b[3] - b[1];
    for (let t = 0.5; t < len - 0.3; t += r.f(0.8, 1.3)) {
      const p = long ? b[0] + t : (b[0] + b[2]) / 2 + r.f(-0.3, 0.3), q = long ? (b[1] + b[3]) / 2 + r.f(-0.3, 0.3) : b[1] + t;
      if (trees.some((tr) => Math.hypot(tr[0] - p, tr[1] - q) < 0.6)) continue;
      if (r.chance(0.55)) L.prop('lots-quiet.shrub', p, BH, q, r.f(0, 6.28), { s: +(r.f(0.7, 1.3)).toFixed(1), v: r.i(0, 3), kind: r.chance(0.7) ? 'leafA' : 'leafB' }, { tint: [r.f(0.7, 0.95), r.f(0.8, 1), r.f(0.7, 0.9)] });
      else L.prop('fernery.fern', p, BH, q, r.f(0, 6.28), { s: +(r.f(0.8, 1.3)).toFixed(1), v: r.i(0, 3) }, { noCollide: true });
    }
    await tick();
  }
  // ferns in the island
  for (let k = 0; k < Math.round(iR * iR * 3.4); k++) {
    const a = r.f(0, 6.28), rr = Math.sqrt(r.next()) * (iR - 0.3), p = ic[0] + Math.cos(a) * rr, q = ic[1] + Math.sin(a) * rr;
    if (trees.some((tr) => Math.hypot(tr[0] - p, tr[1] - q) < 0.35)) continue;
    L.prop('fernery.fern', p, 0.3, q, r.f(0, 6.28), { s: +(r.f(0.45, 0.85)).toFixed(1), v: r.i(0, 3) }, { noCollide: true, tint: [r.f(0.75, 1), r.f(0.85, 1), r.f(0.7, 0.95)] });
  }
  await tick();
  // ferns on the floor, everywhere the stones, the beds, the water and the benches leave room
  const keepOut = (p, q) => {
    if (distToPath(line, p, q) < 0.62) return true;
    if (inBed(p, q, 0.15)) return true;
    if (Math.hypot(p - ic[0], q - ic[1]) < iR + 0.3) return true;
    if (Math.hypot(p - poolP, q - poolQ) < poolR + 0.5) return true;
    if (Math.abs(p - rillP) < 0.5 && q > poolQ) return true;
    if (q < F.Q1 + 0.4 && p > dP - 2.2 && p < F.exitP + 0.6) return true;
    if (trees.some((tr) => Math.hypot(tr[0] - p, tr[1] - q) < 0.45)) return true;
    if (Math.hypot(p - bench1[0], q - bench1[1]) < 1.3 || Math.hypot(p - bench2[0], q - bench2[1]) < 1.2) return true;
    return p < 0.4 || p > W - 0.4 || q < 0.7 || q > D - 0.4;
  };
  let nf = 0;
  for (let i = 0; i < 1100 && nf < 190; i++) {
    const p = r.f(0.4, W - 0.4), q = r.f(0.7, D - 0.4);
    if (keepOut(p, q)) continue;
    const dw = Math.min(p, W - p, D - q), sz = dw < 1.6 ? r.f(0.8, 1.2) : distToPath(line, p, q) > 1.8 ? r.f(0.55, 0.95) : r.f(0.4, 0.7);
    L.prop('fernery.fern', p, 0, q, r.f(0, 6.28), { s: +sz.toFixed(1), v: r.i(0, 3) }, { tint: [r.f(0.7, 1), r.f(0.82, 1), r.f(0.68, 0.95)], noCollide: true });
    nf++; if (nf % 20 === 0) await tick();
  }
  const boulders = []; for (let i = 0; i < 40 && boulders.length < 7; i++) { const p = r.f(1, W - 1), q = r.f(F.Q1 + 0.6, D - 0.6); if (keepOut(p, q) && !inBed(p, q, 0)) continue; if (inBed(p, q, 0.3)) continue; boulders.push([p, q]); }
  boulders.forEach((b, i) => L.prop('fernery.stone', b[0], 0, b[1], r.f(0, 6.28), { r: +(r.f(0.28, 0.5)).toFixed(2), v: 20 + i }));
  await tick();

  // ---------------- benches ----------------
  benchAt(L, bench1[0], bench1[1], 0, -1, 1.5, ['dimwood', 'quiet'], '#5b4636');
  benchAt(L, bench2[0], bench2[1], 1, 0, 1.3, ['dimwood', 'quiet'], '#6b4a2f');
  // a warm lamp on a post by the turn: the one bright thing at the end of the view
  const lp = [bench1[0] + 1.05, bench1[1] + 0.05];
  g.mat('cast', '#2a2622'); L.tube([[lp[0], 0, lp[1]], [lp[0], 1.95, lp[1]], [lp[0] - 0.25, 1.95, lp[1]]], 0.02, { segs: 6 }); s.flush({ tier: 's', cast: true }); L.post(lp[0], lp[1], 0.05, 0, 1.95);
  L.lamp('lantern', lp[0] - 0.25, 1.62, lp[1], { tint: '#f2b56b', clip, power: 0.5, drop: 0.2, range: 4.2 });
  await tick();

  // ---------------- light: low grow-lamps, green and dim; an uplight in the island; the spout ----------------
  const strip = (p0, q0, p1, q1, y) => {
    g.mat('cast', '#2a2622'); for (const v of [[p0, q0], [p1, q1]]) L.tube([[v[0], y + 0.08, v[1]], [v[0], H, v[1]]], 0.006, { segs: 4, caps: false });
    g.mat('brushed', '#3a3d36'); L.box(Math.min(p0, p1) - 0.07, y, Math.min(q0, q1) - 0.07, Math.max(p0, p1) + 0.07, y + 0.08, Math.max(q0, q1) + 0.07, { faces: 'pPqQY' });
    g.mat('diffuser', '#d6f5c0', { emissive: 2.2, lamp: true }); L.box(Math.min(p0, p1) - 0.04, y - 0.01, Math.min(q0, q1) - 0.04, Math.max(p0, p1) + 0.04, y, Math.max(q0, q1) + 0.04, { faces: 'y' });
    s.flush({ tier: 's', cast: false });
    L.light({ at: [(p0 + p1) / 2, y - 0.05, (q0 + q1) / 2], type: 'spot', dir: [0, -1, 0], cone: [68, 30], color: '#c9f0b0', power: 5.5, range: 5.5, clip, lamp: true, shadow: true });
  };
  strip(0.95, D * 0.42, 0.95, D * 0.42 + 4.5, 2.7);
  if (beds[1]) strip(beds[1][0] + 0.4, D - 0.9, Math.max(beds[1][0] + 1.2, beds[1][2] - 0.4), D - 0.9, 3.0);
  if (beds[2]) strip(beds[2][0] + 0.4, D - 0.9, Math.max(beds[2][0] + 1.2, beds[2][2] - 0.4), D - 0.9, 2.9);
  strip(ic[0] - 1.6, ic[1] - 0.6, ic[0] + 1.6, ic[1] - 0.6, 2.95);
  { const t = trees[0]; g.mat('cast', '#2a2622'); L.cyl(t[0] + 0.45, 0.3, t[1] + 0.25, 0.07, 0.12, { segs: 8 }); s.flush({ tier: 'd' });
    L.light({ at: [t[0] + 0.42, 0.5, t[1] + 0.24], type: 'spot', dir: [-0.25, 0.95, -0.15], cone: [42, 18], color: '#e6f5c8', power: 2.0, range: 6, clip, lamp: true }); }
  L.light({ at: [rillP, 0.35, D - 1.0], color: '#cfe8ff', power: 0.18, range: 2.2, clip, lamp: true });
  L.ambient(0, 0, 0.4, W, H, D, { sky: '#6f8f86', ground: '#3a3a2c', power: 0.24, lamp: true, soft: 0.6, spec: 0.3 });
  // the evening itself: a cool, grey wash off the felt, very soft, from two long sources under the ceiling
  for (const qq of [D * 0.35, D * 0.72]) L.light({ at: [W * 0.2, 1.4, qq], to: [W * 0.8, 1.4, qq], type: 'tube', color: '#a9bcc4', power: 0.7, range: 7, radius: 2.5, clip, lamp: true, nospec: true });
  // small lights set low beside the stones, lit only at lamp-night so the way is still there in the dark
  g.mat('diffuser', '#bfe3c0', { emissive: 1.2, night: true });
  for (let i = 4; i < line.length - 2; i += 5) { const a = line[i], b = line[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; const p = a[0] - dz / l * 0.48, q = a[1] + dx / l * 0.48; L.box(p - 0.04, 0, q - 0.04, p + 0.04, 0.06, q + 0.04, { faces: 'pPqQY' }); }
  s.flush({ tier: 'd', cast: false });
  await tick();

  // ---------------- people: two benches, a few places to stand, a gardener ----------------
  const tags = ['dimwood', 'quiet'];
  for (const k of [Math.floor(line.length * 0.3), Math.floor(line.length * 0.62), Math.floor(line.length * 0.82)]) {
    const a = line[k], b = line[Math.min(line.length - 1, k + 1)];
    L.spot('stand', a[0], 0, a[1], L.yaw(-(b[1] - a[1]), b[0] - a[0]), { tags });
  }
  { const a = line[Math.floor(line.length * 0.12)]; L.spot('work', a[0], 0, a[1], L.yaw(0, 1), { tags: ['dimwood', 'sweep'] }); }
  { const t = trees[trees.length - 1]; L.spot('work', t[0], 0, t[1] - 1.35, L.yaw(0, 1), { tags: ['dimwood', 'notes', 'garden'] }); }
  L.path(line.filter((_, i) => i % 3 === 0).concat([line[line.length - 1]]), { width: 0.9, tags: ['dimwood'] });
  L.path([[T[0], T[1]], [bench1[0], bench1[1] - 0.6]], { width: 0.9 });
  { const k = line.reduce((bi, pt, i) => (Math.hypot(pt[0] - bench2[0], pt[1] - bench2[1]) < Math.hypot(line[bi][0] - bench2[0], line[bi][1] - bench2[1]) ? i : bi), 0); L.path([line[k], [bench2[0] + 0.55, bench2[1]]], { width: 0.9 }); }

  // ---------------- things to do ----------------
  const seed = lot.seed, gS = info.g.toFixed(2);
  L.act(bench1[0], 0.7, bench1[1], 1.3, 'Sit on the bench a while', (gm) => sitAWhile(L, gm, bench1[0], bench1[1], 0, -1, 10, pick(seed, 1, [
    'Ten minutes. The water kept on, and somebody on the far side of the wood coughed once, politely.',
    'Ten minutes go by. Your eyes open up to the dark, and the ferns turn out to be four different greens.',
    'Ten minutes. Nobody came along the stones. Out on ' + info.avenue + ' a cart went by, and then nothing did.',
    'You sit ten minutes. The felt takes the edge off everything, even your own breathing.',
  ])));
  L.act(bench2[0], 0.7, bench2[1], 1.2, 'Sit by the pool', (gm) => sitAWhile(L, gm, bench2[0], bench2[1], 1, 0, 10, pick(seed, 2, [
    'Ten minutes by the water. The spout never changes its note.',
    'You sit and watch the pool. At ' + gS + ' of a g the ripples cross it slower than you expect, and you wait for every one.',
    'Ten minutes. A gardener came by with a rake, nodded, and raked somewhere else.',
    'Ten minutes, and the lamp-night is a little closer. Nobody in here is in a hurry for anything.',
  ])));
  L.act(poolP - poolR - 0.3, 0.5, poolQ + 0.4, 1.4, 'Put a hand in the pool', (gm) => { L.sfx(gm, 'splash', poolP - 0.5, 0.1, poolQ, { vol: 0.2 }); note(gm, pick(seed, 3, [
    'Cold, and barely moving. It comes off the deck main at the spout and goes back down under your feet.',
    'Clear to the stones at the bottom. Somebody has put one blue glass bead among them, and nobody has taken it.',
    'Cold enough to make your wrist ache. The rill runs on round your fingers as if you were a stone.',
    'The pool is kept starved and clear, like the Hollow\'s lake. Nothing grows in it but the light.',
  ])); });
  L.act(dP + 1.55, 1.5, -0.4, 1.3, 'Read the plate', (gm) => say(gm, nice, [pick(seed, 4, [
    'Lit like a cloudy evening for every hour the lamps are up. The same light would make a bright room a tenth this size. The block court asks every year which it wants, and it keeps choosing the wood.',
    'Ten minutes is the custom, and nobody times it. Speak low: the felt is listening.',
    'Ferns, moss, alder and birch, rooted in a metre of fibre on the deck\'s nutrient water. Keep to the stones: the moss is slower than you.',
    'Voted dim the year the deck was finished, and every court since has voted it dim again. The minutes are in the block office if you doubt it.',
  ])]));
  { const t = trees[0]; L.act(t[0], 1.4, t[1], 2.0, 'Read the label on the tree', (gm) => say(gm, 'A label on a string', [pick(seed, 5, [
    'Planted for Ines Ludo, who walked these stones every evening for sixty years. Her great-grandson waters it on Tuesdays.',
    '"Do not prune. It knows what it is doing." Signed by the block gardener. Under it, in another hand: "It does not."',
    'Older than the felt. The label gives its planting year and the name of the child who carried it in, who is ninety now and still comes.',
    'Grown from a cutting off the Hollow\'s dim end, carried up in a cab on somebody\'s lap. The label says the cab was very patient.',
  ])])); }

  L.zone({ place: 'city-special', name: nice.replace(/^The /, 'The '), sub: info.name + ' · dim wood · lit like a cloudy evening', ambience: 'quiet', reverb: 'felt', cell: info.key,
    env: { autoKey: 0.105, autoMax: 2.2, warmth: -0.05, bloom: 0.06, saturation: 0.95 } });
  void hashStr;
  return L;
}
