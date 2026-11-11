// The Fern Cellar: a sunk garden off the anti side of the Long Lamps, under the birches. A paved rim on a dry-stone
// wall goes round it; steps go down to beds of ferns, moss, stepping stones, a rill that runs from a spout in the wall to
// a small pool, tree ferns, the gardener's bench and cold frame, and in the middle the Name Bed, raised and edged in
// brass, where the chervil grows that the drum is named for.
import { block, stairs, lamp } from '../world/kit.js';
import { prop, hasProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { heightAt } from '../world/land.js';
import { Rng, hashStr } from '../core/util.js';
import { maxGround, minGround, say, toast, sfx } from './hollow_parts.js';
import { HF, walkX, nearTree, plateStand, walkTrees, lanePoint } from './lm_hollow_front_parts.js';

const WHO = { name: 'The Fern Cellar', colour: '#b8d890' };
const FERN_TINTS = ['#e4f4c0', '#d2ec9c', '#c6e0a0', '#e8d9a0', '#b9d88e', '#f0f4d0'];

export function buildCellar(game, f, ZONES, trees, walk, zoneFn, glow) {
  const s = game.world.scope('hf-cellar', f), g = s.g, r = new Rng(hashStr('hf-cellar'));
  const C = HF.CELLAR, RW = C.rim, ix0 = C.x0 + RW, ix1 = C.x1 - RW, iz0 = C.z0 + RW, iz1 = C.z1 - RW;
  const gHi = maxGround(C.x0, C.z0, C.x1, C.z1, 1.5), gLo = minGround(C.x0, C.z0, C.x1, C.z1, 1.5);
  const YR = gHi + 0.72;
  const gy = (x, z) => heightAt(x, z);
  const FERN = hasProp('fernery.fern') ? 'fernery.fern' : null, STONE = hasProp('fernery.stone') ? 'fernery.stone' : null;
  const fern = (x, z, sz, v) => { if (FERN) prop(s, FERN, x, gy(x, z) - 0.02, z, r.f(0, 6.28), { s: sz, v, t: FERN_TINTS[v % FERN_TINTS.length] }); else prop(s, 'plant', x, gy(x, z), z, 0, { kind: 'fern', size: sz, pot: '#4a4236' }); };

  // ---- the rim: a dry-stone wall all round with a paved walk on it, slabs overhanging the drop
  const RIM = [[C.x0, C.z0, C.x1, iz0], [C.x0, iz1, C.x1, C.z1], [C.x0, iz0, ix0, iz1], [ix1, iz0, C.x1, iz1]];
  for (const [x0, z0, x1, z1] of RIM) block(s, x0, gLo - 0.5, z0, x1, YR, z1, 'stone', '#8a8676');
  s.structure(() => {
    g.mat('stone', '#bdb4a2');
    g.box(C.x0 - 0.04, YR - 0.05, C.z0 - 0.04, C.x1 + 0.04, YR + 0.02, iz0 + 0.08, { bevel: 0.01 }); g.box(C.x0 - 0.04, YR - 0.05, iz1 - 0.08, C.x1 + 0.04, YR + 0.02, C.z1 + 0.04, { bevel: 0.01 });
    g.box(C.x0 - 0.04, YR - 0.05, iz0, ix0 + 0.08, YR + 0.02, iz1, { bevel: 0.01 }); g.box(ix1 - 0.08, YR - 0.05, iz0, C.x1 + 0.04, YR + 0.02, iz1, { bevel: 0.01 });
    // joints in the paving
    g.mat('stone', '#8f8774');
    for (let x = C.x0 + 1.6; x < C.x1 - 0.5; x += 1.6) { g.box(x - 0.015, YR + 0.02, C.z0, x + 0.015, YR + 0.024, iz0, { faces: 'Y' }); g.box(x - 0.015, YR + 0.02, iz1, x + 0.015, YR + 0.024, C.z1, { faces: 'Y' }); }
    for (let z = iz0 + 1.6; z < iz1 - 0.5; z += 1.6) { g.box(C.x0, YR + 0.02, z - 0.015, ix0, YR + 0.024, z + 0.015, { faces: 'Y' }); g.box(ix1, YR + 0.02, z - 0.015, C.x1, YR + 0.024, z + 0.015, { faces: 'Y' }); }
  });
  // moss in the joints of the inner faces, and iron grates round the birches growing through the rim
  s.detail(() => {
    g.mat('grass', '#4b6631');
    for (let i = 0; i < 46; i++) {
      const side = i % 4, u = r.f(0.05, 0.95), hh = r.f(0.12, 0.4), w = r.f(0.3, 1.1), y1 = YR - r.f(0.05, 0.3);
      if (side === 0) { const x = ix0 + (ix1 - ix0) * u; g.box(x - w / 2, y1 - hh, iz0, x + w / 2, y1, iz0 + 0.035); }
      else if (side === 1) { const x = ix0 + (ix1 - ix0) * u; g.box(x - w / 2, y1 - hh, iz1 - 0.035, x + w / 2, y1, iz1); }
      else if (side === 2) { const z = iz0 + (iz1 - iz0) * u; g.box(ix0, y1 - hh, z - w / 2, ix0 + 0.035, y1, z + w / 2); }
      else { const z = iz0 + (iz1 - iz0) * u; g.box(ix1 - 0.035, y1 - hh, z - w / 2, ix1, y1, z + w / 2); }
    }
    g.mat('cast', '#22392f');
    for (const t of trees) { const onRim = t.x > C.x0 && t.x < C.x1 && t.z > C.z0 && t.z < C.z1 && !(t.x > ix0 && t.x < ix1 && t.z > iz0 && t.z < iz1); if (!onRim) continue; g.lathe(t.x, t.z, [[t.r + 0.45, YR + 0.025], [t.r + 0.06, YR + 0.025]], { segs: 12, capBottom: false, capTop: false }); }
  });

  // ---- the way in: a paved ramp from the walk to the rim, steps down inside on the east and west
  const zE = 317.2, zW = 319.0, xk = walkX(zE) - HF.HW - HF.KERB, yW = walk.Y(zE);
  s.structure(() => {
    g.mat('stone', '#c7bda9'); g.quad([C.x1, YR, zE + 1.3], [xk, yW, zE + 1.3], [xk, yW, zE - 1.3], [C.x1, YR, zE - 1.3]);
    g.mat('stone', '#8a8676');
    for (const sz of [-1, 1]) { const z = zE + sz * 1.3, ya = gy(C.x1, z) - 0.4, yb = gy(xk, z) - 0.4; if (sz > 0) g.quad([C.x1, ya, z], [xk, yb, z], [xk, yW, z], [C.x1, YR, z]); else g.quad([xk, yb, z], [C.x1, ya, z], [C.x1, YR, z], [xk, yW, z]); }
  });
  s.ramp(C.x1, zE - 1.3, xk, zE + 1.3, YR, yW, 'x', { surf: 'stone' });
  const stairFoot = (xf, z) => { const yF = gy(xf, z); const rise = YR - yF, n = Math.max(2, Math.round(rise / 0.17)); return { yF, rise, run: n * 0.3 }; };
  const E = stairFoot(ix1 - 1.5, zE), Wd = stairFoot(ix0 + 1.5, zW);
  stairs(s, ix1 - E.run, E.yF, zE, 'X', E.rise, E.run, 1.6, { mat: 'stone', tint: '#b5ab97' });
  stairs(s, ix0 + Wd.run, Wd.yF, zW, 'x', Wd.rise, Wd.run, 1.6, { mat: 'stone', tint: '#b5ab97' });
  sign(s, { kind: 'plate', text: 'THE FERN CELLAR', sub: 'ferns · moss · the Name Bed' }, C.x1 + 0.006, YR - 0.28, zE + 3.2, { face: 'X', w: 1.3, h: 0.28 });

  // ---- the Name Bed: round, raised, edged in brass, full of chervil
  const NX = 130, NZ = 317, NR = 1.75;
  const n0 = minGround(NX - NR, NZ - NR, NX + NR, NZ + NR, 0.7) - 0.12, NY = maxGround(NX - NR, NZ - NR, NX + NR, NZ + NR, 0.7) + 0.5;
  s.furniture(() => {
    g.mat('stone', '#9d9583'); g.lathe(NX, NZ, [[NR, n0], [NR, NY - 0.06], [NR - 0.02, NY - 0.04]], { segs: 28, capBottom: false, capTop: false });
    g.mat('cast', '#b9913f', { rough: -0.2 }); g.lathe(NX, NZ, [[NR + 0.04, NY - 0.07], [NR + 0.05, NY + 0.035], [NR - 0.14, NY + 0.04], [NR - 0.15, NY - 0.01]], { segs: 28, capBottom: false, capTop: false });
    g.mat('gravel', '#4f4639'); g.lathe(NX, NZ, [[NR - 0.15, NY - 0.005], [0, NY + 0.01]], { segs: 20, capBottom: false, capTop: false });
  });
  s.post(NX, NZ, NR + 0.05, n0, NY + 0.04);
  { let v = 0; for (const [rr, n] of [[0.0, 1], [0.38, 6], [0.8, 11], [1.22, 16]]) for (let i = 0; i < n; i++) { const a = i / n * 6.283 + rr * 2; prop(s, 'lm-hollow-front.chervil', NX + Math.cos(a) * rr, NY + 0.01, NZ + Math.sin(a) * rr, a, { v: v++ % 5 }, { scale: 1.35 }); } }
  plateStand(s, NX + 2.55, gy(NX + 2.55, NZ + 1.6), NZ + 1.6, 'X', { kind: 'plate', text: 'CHERVIL', sub: 'the herb the drum is named for' }, { w: 0.6, hh: 0.26, h: 0.9 });
  s.interact({ x: NX + 3.1, y: gy(NX + 3, NZ + 1.6) + 1.0, z: NZ + 1.6, radius: 1.3, prompt: 'Read the plate on the Name Bed', onUse: (gm) => say(gm, WHO, [
    'Chervil. The herb this drum is named for, grown here because it likes the dim: in full light it bolts and goes bitter.',
    'At this end of the Hollow the floor gets about 38 per cent of the middle\'s light, and the birches take some of that. It suits chervil better than anywhere in the drum.',
    'There is no soil: the bed is a stone grit fed from the rill, like every park in the drum. On Booking Day a sprig from it goes to every ring counter, floated on the free cup of broth.',
  ]) });

  // ---- the rill: a spout in the back wall, a stone channel, a round pool
  const RX = 135.5, PZ = 323.8, PR = 1.15;
  const yP = minGround(RX - PR, PZ - PR, RX + PR, PZ + PR, 0.5) + 0.02, yPt = maxGround(RX - PR, PZ - PR, RX + PR, PZ + PR, 0.5) + 0.18;
  s.furniture(() => {
    g.mat('stone', '#8f8a78'); g.lathe(RX, PZ, [[PR + 0.18, yP - 0.2], [PR + 0.18, yPt], [PR + 0.1, yPt + 0.03], [PR, yPt], [PR, yPt - 0.12]], { segs: 22, capBottom: false, capTop: false });
    g.mat('plain', '#2c535b', { rough: -0.45 }); g.lathe(RX, PZ, [[PR, yPt - 0.06], [0, yPt - 0.06]], { segs: 22, capBottom: false, capTop: false });
    // the channel, in pieces down the slope
    for (let z = PZ + PR; z < iz1 - 0.05; z += 1.5) {
      const z1 = Math.min(iz1, z + 1.5), ya = gy(RX, (z + z1) / 2);
      g.mat('stone', '#8f8a78'); for (const sx of [-1, 1]) g.box(RX + sx * 0.2 - (sx > 0 ? 0 : 0.14), ya - 0.15, z, RX + sx * 0.2 + (sx > 0 ? 0.14 : 0), ya + 0.16, z1, { bevel: 0.01 });
      g.mat('plain', '#2c535b', { rough: -0.45 }); g.box(RX - 0.2, ya - 0.1, z, RX + 0.2, ya + 0.1, z1, { faces: 'Y' });
    }
    // the spout and its water
    const ys = gy(RX, iz1 - 0.2) + 0.55;
    g.mat('cast', '#7a5a32'); g.tube([[RX, ys, iz1 + 0.05], [RX, ys, iz1 - 0.28]], 0.035, { segs: 8 }); g.lathe(RX, iz1 - 0.3, [[0.045, ys - 0.04], [0.05, ys], [0.045, ys + 0.04]], { segs: 8 });
    g.mat('plain', '#d6eef2', { rough: -0.4, emissive: 0.1 }); g.tube([[RX, ys - 0.02, iz1 - 0.31], [RX, ys - 0.2, iz1 - 0.42], [RX, gy(RX, iz1 - 0.5) + 0.1, iz1 - 0.5]], [0.016, 0.014, 0.02], { segs: 4 });
  });
  for (let z = PZ + PR; z < iz1; z += 1.5) s.solid(RX - 0.34, gy(RX, z) - 0.2, z, RX + 0.34, gy(RX, z) + 0.16, Math.min(iz1, z + 1.5));
  s.post(RX, PZ, PR + 0.18, yP - 0.2, yPt + 0.03);
  s.loop('water-lap', RX, yPt, PZ, { vol: 0.3, radius: 10 });
  plateStand(s, RX + 0.75, gy(RX + 0.75, iz1 - 0.6), iz1 - 0.6, 'z', { kind: 'label', text: 'NOT FOR DRINKING', sub: 'nutrient solution · wood loop' }, { w: 0.34, hh: 0.14, h: 0.55 });
  s.interact({ x: RX - 0.4, y: yPt + 0.5, z: PZ - PR - 0.4, radius: 1.3, prompt: 'Put a hand in the rill', onUse: (gm) => { sfx(gm, 'splash', f, RX, yPt, PZ); say(gm, WHO, [
    'Cold, and running slow: at half a g a rill takes its time down even a steep bed.',
    'It is not water for drinking. It is the wood\'s nutrient solution, run in the open here so the ferns at its edges can drink, then back into the same pipe under the pool. The tag on the spout says so, twice.',
  ]); } });

  // ---- beds of ferns, edged in stone, each with a label
  const BEDS = [[117.5, 303.5, 123.5, 306.0], [117.5, 308.5, 122.5, 310.5], [117.5, 323.5, 122.5, 325.5], [117.5, 328.0, 123.5, 330.5], [136.5, 305.5, 142.5, 307.8], [137.5, 327.5, 142.5, 330.5], [127.0, 327.5, 132.0, 329.5], [128.0, 304.5, 132.5, 306.5], [138.0, 309.5, 142.5, 311.5], [137.5, 321.5, 141.8, 323.5]];
  BEDS.forEach(([x0, z0, x1, z1], bi) => {
    const yb = minGround(x0, z0, x1, z1, 0.8) - 0.12, yt = maxGround(x0, z0, x1, z1, 0.8) + 0.2;
    s.furniture(() => {
      g.mat('stone', bi % 3 ? '#9a9482' : '#8d8a7c');
      g.box(x0, yb, z0, x1, yt, z0 + 0.14, { bevel: 0.015 }); g.box(x0, yb, z1 - 0.14, x1, yt, z1, { bevel: 0.015 }); g.box(x0, yb, z0 + 0.14, x0 + 0.14, yt, z1 - 0.14, { bevel: 0.015 }); g.box(x1 - 0.14, yb, z0 + 0.14, x1, yt, z1 - 0.14, { bevel: 0.015 });
      g.mat('gravel', '#4f4639'); g.box(x0 + 0.14, yb, z0 + 0.14, x1 - 0.14, yt - 0.05, z1 - 0.14, { faces: 'Y' });
    });
    s.solid(x0, yb, z0, x1, yt, z1, { surf: 'stone' });
    const v0 = bi * 3, tint = FERN_TINTS[bi % FERN_TINTS.length], big = bi % 4 === 1 ? 1.25 : 0.85;
    for (let x = x0 + 0.55; x < x1 - 0.3; x += 0.85) for (let z = z0 + 0.5; z < z1 - 0.3; z += 0.8) {
      const fx = x + r.f(-0.15, 0.15), fz = z + r.f(-0.12, 0.12); if (nearTree(trees, fx, fz, 0.35)) continue;
      if (FERN) prop(s, FERN, fx, yt - 0.05, fz, r.f(0, 6.28), { s: big * r.f(0.8, 1.15), v: v0 + (Math.round(x * 3 + z) % 3), t: tint });
    }
    prop(s, 'lm-hollow-front.label', x0 + 0.3, yt - 0.05, z1 - 0.3, 0, { col: bi % 2 ? '#efe6d2' : '#e7d7a8' });
  });

  // ---- stepping stones from both stairs to the Name Bed, moss, mossy boulders, loose ferns, tree ferns
  const stones = [];
  for (let x = ix1 - E.run - 0.55; x > NX + NR + 0.35; x -= 0.72) stones.push([x, zE + Math.sin(x * 1.3) * 0.18]);
  for (let x = ix0 + Wd.run + 0.55; x < NX - NR - 0.35; x += 0.72) { const t = (x - ix0) / (NX - NR - ix0); stones.push([x, zW + (NZ + 0.6 - zW) * t + Math.sin(x * 1.7) * 0.15]); }
  s.detail(() => { g.mat('stone', '#bab09c'); for (const [x, z] of stones) { const y = gy(x, z); g.lathe(x, z, [[0.3, y - 0.05], [0.3, y + 0.05], [0.27, y + 0.075], [0, y + 0.08]], { segs: 9 }); } });
  const blocked = (x, z, pad) => BEDS.some(([x0, z0, x1, z1]) => x > x0 - pad && x < x1 + pad && z > z0 - pad && z < z1 + pad) || Math.hypot(x - NX, z - NZ) < NR + pad + 0.3 || Math.hypot(x - RX, z - PZ) < PR + pad + 0.2 || (Math.abs(x - RX) < 0.4 + pad && z > PZ) || stones.some(([sx, sz]) => Math.hypot(x - sx, z - sz) < 0.45 + pad) || (z > zE - 0.9 && z < zE + 0.9 && x > ix1 - E.run - 0.5) || (z > zW - 0.9 && z < zW + 0.9 && x < ix0 + Wd.run + 0.5) || (z < iz0 + 1.1 && ((x > 139.8 && x < 142.6) || (x > 125.4 && x < 127.6))) || x < ix0 + 0.2 || x > ix1 - 0.2 || z < iz0 + 0.2 || z > iz1 - 0.2;
  s.detail(() => {
    for (let i = 0, n = 0; i < 260 && n < 30; i++) {
      const x = r.f(ix0, ix1), z = r.f(iz0, iz1); if (blocked(x, z, 0.4)) continue; n++;
      // a cushion of moss: three or four soft lumps run together, two greens
      for (let k = 0; k < r.i(3, 4); k++) { const rx = r.f(0.25, 0.6), a = r.f(0, 6.28), d = r.f(0, 0.45), mx = x + Math.cos(a) * d, mz = z + Math.sin(a) * d; g.mat('grass', k % 2 ? '#56763a' : '#48652e'); g.ball(mx, gy(mx, mz) - 0.06, mz, rx, r.f(0.14, 0.26), rx * r.f(0.7, 1.1), { segs: 9, rings: 4, bottom: 0 }); }
    }
    // a fringe of moss along the foot of the inner walls
    g.mat('grass', '#56743a');
    for (let x = ix0 + 0.6; x < ix1 - 0.4; x += 1.4) { for (const z of [iz0 + 0.25, iz1 - 0.25]) if (!blocked(x, z + (z < NZ ? 0.4 : -0.4), 0)) g.ball(x, gy(x, z) - 0.03, z, 0.75, 0.13, 0.32, { segs: 7, rings: 3, bottom: 0 }); }
  });
  if (STONE) for (let i = 0, n = 0; i < 80 && n < 10; i++) { const x = r.f(ix0 + 0.6, ix1 - 0.6), z = r.f(iz0 + 0.6, iz1 - 0.6); if (blocked(x, z, 0.5) || nearTree(trees, x, z, 0.8)) continue; n++; prop(s, STONE, x, gy(x, z), z, r.f(0, 6.28), { r: r.f(0.3, 0.6), v: i }); }
  for (let i = 0, n = 0; i < 400 && n < 70; i++) {
    const wall = i % 5, u = r.next();
    let x, z; if (wall === 0) { x = ix0 + (ix1 - ix0) * u; z = iz0 + r.f(0.3, 0.9); } else if (wall === 1) { x = ix0 + (ix1 - ix0) * u; z = iz1 - r.f(0.3, 0.9); } else if (wall === 2) { x = ix0 + r.f(0.3, 0.9); z = iz0 + (iz1 - iz0) * u; } else if (wall === 3) { x = ix1 - r.f(0.3, 0.9); z = iz0 + (iz1 - iz0) * u; } else { const t = trees[r.i(0, trees.length - 1)]; if (!t || t.x < ix0 || t.x > ix1 || t.z < iz0 || t.z > iz1) continue; const a = r.f(0, 6.28); x = t.x + Math.cos(a) * r.f(0.4, 0.9); z = t.z + Math.sin(a) * r.f(0.4, 0.9); }
    if (blocked(x, z, 0.1) || nearTree(trees, x, z, 0.3)) continue;
    n++; fern(x, z, r.f(0.55, 1.15), r.i(0, 11));
  }
  [[125.6, 313.2, 2.6], [133.6, 320.4, 2.2], [118.4, 331.0, 2.8], [142.4, 314.2, 2.4], [120.8, 313.6, 2.0]].forEach(([x, z, h], i) => prop(s, 'lm-hollow-front.treefern', x, gy(x, z), z, i * 1.3, { h, v: i }));

  // ---- the gardener's corner: the potting bench with its slate and its basket of sprigs, the cold frame
  const PBX = 141.2, PBZ = iz0 + 0.42;
  prop(s, 'lm-hollow-front.potbench', PBX, gy(PBX, PBZ), PBZ, 0, {});
  sign(s, { kind: 'chalk', title: 'This week', lines: ['Lady fern: split, keep wet', 'Royal fern: rusty, leave it', 'Tree ferns: mist at six', 'Name Bed: cut at dawn', 'Cold frame: sow Thursday'] }, PBX, gy(PBX, PBZ) + 1.23, PBZ - 0.335, { face: 'Z', w: 0.95, h: 0.33, board: false });
  prop(s, 'hollow.basket', PBX + 0.55, gy(PBX, PBZ) + 0.88, PBZ + 0.05, 0.2, { col: '#b08d5e' });
  s.detail(() => { g.mat('leafB', '#d6f0a8'); const by = gy(PBX, PBZ) + 1.12; for (let k = 0; k < 6; k++) g.card(PBX + 0.45 + k * 0.035, by, PBZ + 0.05 + (k % 2) * 0.04, 0.12, 0.14, k * 1.1, { tilt: 0.4 }); });
  s.interact({ x: PBX - 0.3, y: gy(PBX, PBZ) + 1.0, z: PBZ + 0.9, radius: 1.1, prompt: 'Read the slate on the potting bench', onUse: (gm) => say(gm, { name: 'The gardener\'s slate', colour: '#d8d2c0' }, [
    'This week. Lady fern: split, keep wet. Royal fern: going rusty, leave it, it does that. Tree ferns: mist the trunks at six.',
    'Name Bed: cut at dawn for the counters. Cold frame: sow on Thursday, as always. Underneath, smaller: whoever keeps leaving cups on the rim, the rim thanks you.',
  ]) });
  s.interact({ x: PBX + 0.6, y: gy(PBX, PBZ) + 1.0, z: PBZ + 0.9, radius: 1.0, prompt: (gm) => (gm.flags && gm.flags.hfSprig) ? 'Look at the basket of sprigs' : 'Take a sprig from the basket', onUse: (gm) => {
    gm.flags = gm.flags || {};
    if (gm.flags.hfSprig) { toast(gm, 'The basket is for the ring counters. You have had yours.'); return; }
    gm.flags.hfSprig = true; sfx(gm, 'paper', f, PBX + 0.55, gy(PBX, PBZ) + 1.0, PBZ);
    toast(gm, 'A note on the basket: for the counters, and one for anybody who asks. You take one. It smells of aniseed and something green.');
  } });
  const CFX = 126.5, CFZ = iz0 + 0.65;
  prop(s, 'lm-hollow-front.coldframe', CFX, gy(CFX, CFZ), CFZ, 0, {});
  s.interact({ x: CFX, y: gy(CFX, CFZ) + 0.8, z: CFZ + 1.0, radius: 1.1, prompt: 'Look in the cold frame', onUse: (gm) => say(gm, WHO, [
    'Seed trays under the glass: chervil sown in rows a week apart, so some is always coming on. The oldest row is a finger high.',
    'A slate wedged in the corner: up in nine days, cut in six weeks, sow again on Thursday. It is never cold here, so the frame is for keeping the trays damp, not warm.',
  ]) });
  s.spot('work', CFX - 0.6, gy(CFX, CFZ + 0.9), CFZ + 0.9, Math.PI, { tags: ['garden', 'sow'] });

  // ---- light: four lamps on the rim, lit all day; benches on the rim
  for (const [x, z] of [[122, C.z0 + 0.35], [138, C.z1 - 0.35], [C.x0 + 0.35, 309], [C.x1 - 0.35, 327]]) { lamp(s, 'pole', x, YR, z, { h: 2.9, K: 2700, power: 1.2, range: 17, lampFlag: false, metal: '#22392f', glow: 10 }); glow.add(x, YR + 2.9, z, 0.17, 0.2, 40); }
  prop(s, 'bench', 129.8, YR, C.z0 + 0.95, 0, { w: 2.0, back: true, wood: '#7a5233', metal: '#22392f' }, { spot: { tags: ['garden', 'cellar'] } });
  prop(s, 'bench', 125.5, YR, C.z1 - 0.95, Math.PI, { w: 2.0, back: true, wood: '#8a5a33', metal: '#22392f' }, { spot: { tags: ['garden', 'cellar'] } });

  // ---- people
  s.path([lanePoint(walk, walkTrees(trees), -2.7, zE), [xk + 0.2, yW, zE], [C.x1 - 0.9, YR, zE], [ix1 - E.run - 0.3, E.yF, zE]].concat(stones.filter((p) => p[0] > NX).map(([x, z]) => [x, gy(x, z) + 0.08, z])).concat([[NX + NR + 0.5, gy(NX + NR + 0.5, NZ), NZ], [NX, gy(NX, NZ + NR + 0.5), NZ + NR + 0.5], [NX - NR - 0.5, gy(NX - NR - 0.5, NZ), NZ]]), { width: 1.2 });
  s.path([[NX - NR - 0.5, gy(NX - NR - 0.5, NZ), NZ]].concat(stones.filter((p) => p[0] < NX).reverse().map(([x, z]) => [x, gy(x, z) + 0.08, z])).concat([[ix0 + Wd.run + 0.3, Wd.yF, zW], [ix0 - 0.2, YR, zW], [C.x0 + 0.9, YR, zW]]), { width: 1.2 });
  const rimLoop = [[C.x0 + 0.9, C.z0 + 0.9], [C.x1 - 0.9, C.z0 + 0.9], [C.x1 - 0.9, zE], [C.x1 - 0.9, C.z1 - 0.9], [C.x0 + 0.9, C.z1 - 0.9], [C.x0 + 0.9, zW], [C.x0 + 0.9, C.z0 + 0.9]].map(([x, z]) => [x, YR, z]);
  s.path(rimLoop, { width: 1.2 });
  for (const [x0, z0, x1, z1] of BEDS.slice(0, 6)) { const x = (x0 + x1) / 2, z = z1 + 0.55; if (!blocked(x, z, -0.2)) s.spot('work', x, gy(x, z), z, Math.PI, { tags: ['garden', 'weed', 'fern'] }); }
  s.spot('work', RX - 0.7, gy(RX - 0.7, PZ + 2.5), PZ + 2.5, Math.PI / 2, { tags: ['garden', 'water', 'rill'] });
  for (let k = 0; k < 3; k++) { const a = Math.PI * (0.15 + k * 0.35), x = NX + Math.cos(a) * (NR + 0.55), z = NZ + Math.sin(a) * (NR + 0.55); s.spot('browse', x, gy(x, z), z, Math.atan2(NX - x, NZ - z), { tags: ['garden', 'name-bed'] }); }
  for (const [x, z, yaw] of [[C.x0 + 0.9, 323, Math.PI / 2], [C.x1 - 0.9, 306, -Math.PI / 2], [134, C.z1 - 0.9, Math.PI]]) s.spot('stand', x, YR, z, yaw, { tags: ['garden', 'cellar', 'look'] });
  zoneFn(s, ZONES, { id: 'hf-cellar', box: [C.x0 - 0.2, -4, C.z0 - 0.2, C.x1 + 0.2, 30, C.z1 + 0.2], name: 'The Fern Cellar', sub: 'the front wood · ferns and the Name Bed' });
  s.finish();
}
