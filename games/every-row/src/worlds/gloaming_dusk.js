// Gloaming, Weather Row: a painted dusk, seen from the auctioned seats of the end-wall terraces. Tonight's dusk is by
// Hesk, and he ends on green: forty minutes of it, the sunline going out through a cold sea-green while the far bank
// turns blue-black overhead, and then the lamps and the windows (docs/wander-year.md, Day 96; docs/open-drums.md,
// Culture, light-painting; games/three-nights/src/15-canon.js, Gloaming, the palette "Hesk's green dusk").
//
// Not canon (the docs say only "tiered end-wall terraces packed for the dusk, and long lawns below"):
//   - the plan: long lawns the length of the floor between lit walks, groves and gardens, a long straight water down
//     the middle of one bank that holds the line, lawns and groves under the walls in the Dim Ends;
//   - the seats: raked rows of benches built on the Third of the front wall; on every other tier the seats are painted;
//   - Hesk's sequence before the green (a late gold, then a cold white), the line going out from both ends toward the
//     middle, and the windows coming on tier by tier. The forty minutes are pressed into one.
import { Scene, Color } from 'three';
import { Plan, C, L } from '../kit/plan.js';
import { buildHollow, TIERS, NT } from '../kit/hollow.js';
import { makePath } from '../core/path.js';
import { Geo, instances } from '../kit/geo.js';
import { crowd, figureGeo, CLOTH, SKIN } from '../kit/folk.js';
import { makeRng, smoothstep, hash2 } from '../core/rng.js';
import { DRUM } from '../kit/drum.js';

const SEAT_DEG = 90;                          // where round the front wall the camera's seats are
const X0 = (SEAT_DEG / 360) * C;              // the same, as flat x on the Hollow floor
const WATER_X = X0 + 70;                      // the long water lies under the flight

export function paintGloaming(plan) {
  const rng = makeRng('gloaming-plan');
  plan.fill(plan.band(0, L), { color: '#a6ae88', life: 0.5 });
  plan.mottle(['#b0b48c', '#98a67c', '#a9b98e', '#bcb894', '#8f9f76', '#a2ab84'], 300, 320, { alpha: 0.5, seed: 'gloaming-meadow' });
  plan.mottle(['#a9b28a', '#949f78', '#b7b892', '#9aa77e'], 900, 90, { alpha: 0.35, seed: 'gloaming-lawn' });
  // the long lawns: twelve strips the length of the floor, each mown its own way
  const NS = 12, sw = C / NS;
  for (let i = 0; i < NS; i++) plan.fill(plan.rect(i * sw + 30, 700, (i + 1) * sw - 30, L - 700, 60), { color: i % 2 ? '#acb78e' : '#9fae84', alpha: 0.45 });
  // under the walls: lawns where the people without seats lie and watch, and groves between them
  plan.fill(plan.band(0, 700), { color: '#93a07a', life: 0.9, feather: 40 });
  plan.fill(plan.band(L - 700, L), { color: '#93a07a', life: 0.9, feather: 40 });
  for (const [z0, z1, s] of [[400, 690, 'a'], [L - 690, L - 400, 'b']]) plan.clumps(110, 18, 60, { seed: 'gloaming-ends-' + s, z0, z1, colors: ['#5d7a54', '#647f58', '#56744f'] });
  // groves out on the lawns
  for (let i = 0; i < 80; i++) {
    const x = rng.f(0, C), z = rng.f(760, L - 760), r = rng.f(40, 150);
    if (Math.abs(x - WATER_X) < 230 + r) continue;
    plan.fill(plan.blob(x, z, r, r * rng.f(0.45, 0.9), { wobble: 0.35, lobes: 6, seed: i + 20 }), { color: rng.pick(['#62805a', '#6b8a60', '#5a7a56', '#71906a']), wood: 0.85, clear: ['life'] });
  }
  // walks: lanes the length of the floor between the strips, and five across, all lit
  const lit = (pts, w, sp, pw) => { plan.stroke(pts, w, { color: '#cfc5a8', paved: 0.8, life: 0.8, clear: ['wood'] }); if (sp) plan.lamps(pts, sp, { power: pw || 0.7 }); };
  const lanes = [];
  for (let i = 0; i < NS; i++) {
    const x = i * sw;
    if (Math.abs(x - WATER_X) < 300) continue;
    const pts = []; for (let k = 0; k <= 30; k++) { const z = 400 + (k / 30) * (L - 800); pts.push([x + Math.sin(k * 0.7 + i) * 22 + Math.sin(k * 0.23 + i * 2) * 40, z]); }
    lit(pts, 7, i % 2 ? 0 : 34); lanes.push(x);
    if (i % 3 === 1) plan.stroke(pts.map((q) => [q[0] + 24, q[1]]), 22, { color: '#c4bb8c', alpha: 0.7 });    // long grass, gone to seed
  }
  const ring = (z, wob) => { const a = []; for (let i = 0; i <= 120; i++) a.push([(i / 120) * C, z + Math.sin(i * 0.37 + z * 0.01) * wob]); return a; };
  lit(ring(700, 0), 10, 22, 1); lit(ring(L - 700, 0), 10, 22, 1);
  lit(ring(1160, 40), 6, 0); lit(ring(1875, 40), 6, 36); lit(ring(2590, 40), 6, 0);
  // flower meadows and paths that wander, so the long lawns are not all lawn
  for (let i = 0; i < 40; i++) {
    const x = rng.f(0, C), z = rng.f(800, L - 800);
    if (Math.abs(x - WATER_X) < 260) continue;
    plan.fill(plan.blob(x, z, rng.f(60, 160), rng.f(30, 80), { wobble: 0.4, lobes: 5, seed: 200 + i }), { color: rng.pick(['#c9b98a', '#c7a9a0', '#b8b07c', '#d0c294', '#b9a6b2']), alpha: 0.75, life: 0.3 });
  }
  for (let i = 0; i < 30; i++) {
    let x = rng.f(0, C), z = rng.f(800, L - 800), a = rng.f(0, 6.28); const pts = [];
    for (let k = 0; k < 12; k++) { pts.push([x, z]); a += rng.f(-0.5, 0.5); x += Math.cos(a) * 40; z += Math.sin(a) * 40; }
    plan.stroke(pts, 3, { color: '#cbbf9e', paved: 0.5, life: 0.6, clear: ['wood'] });
  }
  // lift pavilions where lanes cross the walks
  const pav = [];
  for (const x of lanes) for (const z of [700, 1875, L - 700]) pav.push([x + 18, z + 16]);
  plan.dots(pav, 9, { color: '#c4bca6', paved: 1, life: 0.6, clear: ['wood'] });
  plan.dots(pav, 2.4, { lamp: 0.9 });
  // formal gardens
  for (let i = 0; i < 18; i++) {
    const x = rng.f(0, C), z = rng.f(900, L - 900), w = rng.f(80, 140), h = rng.f(60, 100);
    if (Math.abs(x - WATER_X) < 280) continue;
    plan.garden(x - w / 2, z - h / 2, x + w / 2, z + h / 2, ['#c9a3a8', '#d8c48e', '#b9c48e', '#a99ab8', '#d6b090'], { seed: 'g' + i, hedge: '#53704c' });
  }
  // the long water, which holds the line all the way down, with a walk round it where people sit on the edge
  const wz0 = 760, wz1 = L - 760, ww = 85;
  plan.fill(plan.rect(WATER_X - ww - 30, wz0 - 30, WATER_X + ww + 30, wz1 + 30, 46), { color: '#d2c8aa', paved: 0.7, life: 1, clear: ['wood'] });
  plan.fill(plan.rect(WATER_X - ww - 160, wz0 - 60, WATER_X + ww + 160, wz1 + 60, 80), { color: '#a9b48c', alpha: 0.5, life: 0.95, feather: 30 });
  plan.fill(plan.rect(WATER_X - ww, wz0, WATER_X + ww, wz1, 30), { color: '#4f8f96', water: 1, clear: ['life', 'paved', 'wood'] });
  plan.fill(plan.rect(WATER_X - ww + 30, wz0 + 40, WATER_X + ww - 30, wz1 - 40, 20), { color: '#2d6a7a', feather: 30 });
  for (const s of [-1, 1]) plan.lamps([[WATER_X + s * (ww + 14), wz0], [WATER_X + s * (ww + 14), wz1]], 18, { radius: 1.8 });
}

// A seated figure for the far rows: two boxes, no face (it is seen from behind or from far off).
function farSitter() {
  const g = new Geo();
  g.tint(1).box(-0.2, 0.0, -0.13, 0.2, 0.66, 0.13, '#ffffff', { skip: 'b' });
  g.tint(0).box(-0.11, 0.7, -0.1, 0.11, 0.95, 0.11, '#c99a72', { skip: 'b' });
  return g.build();
}

// Hesk's sequence, pressed into a minute: [t, sun, sun power, far bank, its power, glow, its power, rod, sharpness, lamps]
const SEQ = [
  [0, '#ffc480', 0.75, '#ffb478', 0.55, '#9a8070', 0.2, 30, 1.0, 0.0],
  [8, '#ffcf98', 0.72, '#e8a880', 0.45, '#8c7c74', 0.22, 30, 1.2, 0.0],
  [15, '#f2fff8', 0.6, '#a0a8c0', 0.22, '#6c8078', 0.24, 32, 1.8, 0.0],
  [23, '#6fc9a8', 0.9, '#2a3a5a', 0.06, '#2f5a5c', 0.4, 30, 2.6, 0.1],
  [31, '#55b090', 0.62, '#141c34', 0.015, '#22405a', 0.8, 22, 3.0, 0.45],
  [39, '#1f5a52', 0.6, '#0a0f1e', 0.0, '#1c3058', 1.6, 10, 3.0, 0.85],
  [46, '#0c1a1c', 0.3, '#0a0f1e', 0.0, '#1a2c5c', 1.9, 0, 3.0, 1.0],
  [62, '#0c1a1c', 0.0, '#0a0f1e', 0.0, '#1a2c5c', 2.0, 0, 3.0, 1.0],
];
const SEQC = SEQ.map((k) => [new Color(k[1]), new Color(k[3]), new Color(k[5])]);

export const gloamingDusk = {
  id: 'gloaming-dusk',
  title: 'Hesk ends on green', drum: 'Gloaming', row: 'Weather Row', kind: 'a fair drum', light: 28.0,
  line: 'Hesk ended on green. Forty minutes of it, the sunline going out through a cold sea-green, and the terraces silent until it was gone. Then they roared.',
  tone: '#6fc9a8', source: 'wander-year.md (Day 96), open-drums.md (Culture)',
  sound: { root: 43, scale: 'aeolian', pad: 0.55, air: 0.25, crowd: 0.35, bells: 0.12, bright: 0.3, hum: 0.15 },
  *build(ctx) {
    const plan = new Plan(ctx.q.plan);
    paintGloaming(plan);
    yield;
    const tiers = {};
    for (let i = 0; i < NT; i++) tiers[i] = i < 23 ? { crowd: 1, garden: 0.25 } : { crowd: 0.7, garden: 0.8 };
    const wall = {
      lit: 0.0, crowd: 0.95, garden: 0.4, houseMix: 0.4, winA: '#ffb060', winB: '#ffe0b0', winPower: 2.6,
      stone: '#e4dccc', stone2: '#d6c6aa', houses: ['#d9c2a0', '#c9b49a', '#b4c4b8', '#e0d2ae', '#a9bcc4', '#d4b09c'], tiers,
    };
    const hollow = yield* buildHollow(ctx, {
      seed: 'gloaming', plan, pavilions: false,
      light: { sun: SEQ[0][1], sunPower: SEQ[0][2], sunFar: SEQ[0][3], sunFarPower: SEQ[0][4], sunAngle: X0 / DRUM.RH, amb: SEQ[0][5], ambPower: SEQ[0][6], ground: '#ffb468', groundPower: 0, air: '#d8d6d0' },
      sunline: { power: 30, keep: true },
      ground: { lamp: 0, lampColor: '#ffc68a', people: 0.9, sunRod: 30, wave: 0.01, stripes: 0.07 },
      front: wall, back: { ...wall },
    });
    yield;
    const scene = new Scene();
    scene.add(hollow.group);
    const rng = makeRng('gloaming-seats');

    // ---- the seats: raked rows of benches on the Third of the front wall, every seat sold and taken
    const T = hollow.terrace(0, TIERS.third, SEAT_DEG);
    const NR = 14, RUN = 0.9, RISE = 0.36, Z0 = 3.4, XS = 300, AISLE = 28, AW = 1.25;
    const rowZ = (k) => -(Z0 + k * RUN);          // front edge of row k (the rail is z = 0, the houses at z = -depth)
    const rowH = (k) => (k + 1) * RISE;
    const inAisle = (x) => Math.abs(x - Math.round(x / AISLE) * AISLE) < AW;
    const g = new Geo({ maxSeg: 8 });
    for (let k = 0; k < NR; k++) {
      const z0 = rowZ(k), z1 = rowZ(k + 1), y = rowH(k), yb = k ? rowH(k - 1) : 0;
      g.floor(-XS, z1, XS, z0, y, k % 2 ? '#d2c8b6' : '#dad0bd');
      g.quad([-XS, yb, z0], [XS, yb, z0], [XS, y, z0], [-XS, y, z0], '#b0a590');
      for (const s of [-1, 1]) { const x = s * XS; if (s > 0) g.quad([x, 0, z0], [x, 0, z1], [x, y, z1], [x, y, z0], '#b8ad98'); else g.quad([x, 0, z1], [x, 0, z0], [x, y, z0], [x, y, z1], '#b8ad98'); }
      // benches between the aisles
      for (let a = -XS; a < XS; a += AISLE) {
        const xa = Math.max(-XS, a + AW), xb = Math.min(XS, a + AISLE - AW);
        g.box(xa, y + 0.36, z0 - 0.62, xb, y + 0.44, z0 - 0.16, '#8a6a50', { skip: 'b' });
        g.box(xa, y, z0 - 0.5, xb, y + 0.36, z0 - 0.42, '#6e5440', { skip: 'bt' });
      }
    }
    g.quad([XS, 0, rowZ(NR)], [-XS, 0, rowZ(NR)], [-XS, rowH(NR - 1), rowZ(NR)], [XS, rowH(NR - 1), rowZ(NR)], '#b8ad98');
    g.floor(-XS, rowZ(0), XS, 0.34, 0.03, '#d8cfbc');                                          // the walk along the rail
    // the rail: a coping on posts, so the seats see through it
    g.box(-XS, 0, 0.02, XS, 0.16, 0.3, '#cfc5b2', { skip: 'b' });
    g.box(-XS, 0.98, 0.02, XS, 1.08, 0.3, '#ddd3c2', { skip: 'b', top: '#efe7d8' });
    for (let x = -XS; x <= XS; x += 1.6) g.box(x - 0.05, 0.16, 0.11, x + 0.05, 0.98, 0.21, '#c4baa6', { skip: 'bt' });
    T.add(g.mesh(T.lit, T.frame));
    yield;
    // the people in them: whole figures near the camera, simpler ones farther along
    const near = new Map(), far = [], NEAR = 64;
    for (let k = 0; k < NR; k++) {
      for (let x = -XS + 0.4; x < XS - 0.3; x += 0.6 + rng.f(-0.04, 0.06)) {
        if (inAisle(x) || rng.chance(0.04)) continue;
        const p = [x + rng.f(-0.06, 0.06), rowH(k) + 0.44, rowZ(k) - 0.4], yaw = rng.f(-0.25, 0.25), color = rng.pick(CLOTH);
        if (Math.abs(x) < NEAR) { const skin = rng.pick(SKIN); let a = near.get(skin); if (!a) near.set(skin, a = []); a.push({ p, yaw, color, scale: rng.f(0.94, 1.06) }); }
        else far.push({ p, yaw, color, scale: [rng.f(0.9, 1.1), rng.f(0.9, 1.08), 1] });
      }
      if (k % 4 === 3) yield;
    }
    const people = [];
    for (const [skin, list] of near) people.push(...instances(figureGeo(skin, 'sit'), T.lit, list, { frame: T.frame, cell: 140 }));
    people.push(...instances(farSitter(), T.lit, far, { frame: T.frame, cell: 160 }));
    // late-comers along the walk by the rail
    const spots = [];
    for (let x = -XS; x < XS; x += rng.f(2.2, 6)) {
      if (Math.abs(x) < 3) continue;
      spots.push({ p: [x, 0.03, -rng.f(0.7, 2.8)], walk: rng.chance(0.6) ? rng.f(1, 6) : 0, yaw: rng.f(-0.6, 0.6) + (rng.chance(0.5) ? 0 : Math.PI) });
    }
    people.push(...crowd(spots, T.walk, { frame: T.frame, seed: 'gloaming-rail', bob: 0.25 }));
    T.add(people);
    yield;

    // ---- the flight: from a seat on the aisle out over the rail and down past the lower terraces, along the long
    // water toward the line as it goes green, a look up at the far bank, round in a long turn, and back toward the
    // wall of terraces as it lights window by window
    const tf = (x, y, z) => { const v = hollow.frame.local(T.frame.point(x, y, z)); return [v.x, v.y, v.z]; };
    const path = makePath([
      { t: 0, p: tf(0, rowH(7) + 1.95, rowZ(7) - 0.5) },
      { t: 8, p: tf(0, 4.2, -0.2), look: [X0, 380, 3300] },
      { t: 14, p: tf(0, -40, 80), look: [X0 + 700, 260, 330] },
      { t: 22, p: [X0 + 40, 330, 860], look: [X0 + 60, 650, 2900] },
      { t: 30, p: [X0 + 90, 300, 1480], look: [X0 + 150, 1000, 2700] },
      { t: 37, p: [X0 + 170, 330, 1980], look: [X0 + 330, 2500, 2900] },
      { t: 44, p: [X0 + 800, 380, 2300], look: [X0 + 2600, 200, 2150] },
      { t: 51, p: [X0 + 1700, 400, 2000], look: [X0 + 1800, 520, 300] },
      { t: 60, p: [X0 + 2000, 420, 1250] },
    ], { frame: hollow.frame, entryRadius: 1.2, exitRadius: 30 });
    yield;

    // ---- the dusk itself
    const rig = hollow.rig, U = rig.uniforms, rodU = hollow.rod ? hollow.rod.material.uniforms : null, haloU = hollow.halo ? hollow.halo.material.uniforms : null;
    const walls = hollow.walls.map((w) => w.material.uniforms);
    // each tier's windows come on in their own time, lower tiers a little sooner
    const winT = [0, 1].map((s) => { const a = []; for (let i = 0; i < NT; i++) a.push([19 + i * 0.35 + 12 * hash2(i, s, 3), 0.1 + 0.14 * hash2(i, s, 7) + (i < 10 ? 0.05 : 0)]); return a; });
    // after the line is out people walk home over the lawns with hand lamps: thousands of small lights, slowly moving
    const hand = [], hrng = makeRng('gloaming-lamps');
    for (let i = 0; i < Math.round(26000 * ctx.density); i++) {
      const x = hrng.f(0, C), z = hrng.f(420, L - 420), s = hollow.at(x, z);
      if (s.water > 0.2 || s.wood > 0.5 || s.life < 0.3) continue;
      const a = hrng.f(0, 6.28), v = hrng.f(0.8, 1.5);
      hand.push({ p: [x, 1.1, z], color: hrng.pick(['#ffc070', '#ffd49a', '#ffb060', '#ffe2b8', '#9fe0c8']), power: hrng.f(5, 9), size: 1.4, move: [Math.cos(a) * v, 0, Math.sin(a) * v], loop: hrng.f(80, 200), twinkle: 0.15, phase: hrng() });
    }
    const handMesh = hollow.glow(hand, { minPx: 1.4, maxPx: 30, soft: 2.0 });
    const handU = handMesh.material.uniforms;
    const sun = new Color(), farC = new Color(), amb = new Color();
    const mid = L / 2, half0 = mid - DRUM.SUN0;
    function light(t) {
      let i = 0; while (i < SEQ.length - 2 && SEQ[i + 1][0] <= t) i++;
      const a = SEQ[i], b = SEQ[i + 1], u = smoothstep(a[0], b[0], t), ca = SEQC[i], cb = SEQC[i + 1];
      const m = (j) => a[j] + (b[j] - a[j]) * u;
      sun.copy(ca[0]).lerp(cb[0], u); farC.copy(ca[1]).lerp(cb[1], u); amb.copy(ca[2]).lerp(cb[2], u);
      rig.set({ sun, sunPower: m(2), sunFar: farC, sunFarPower: m(4), amb, ambPower: m(6), ground: '#ffb468', groundPower: 0.3 * m(9) });
      U.uSunSharp.value = m(8);
      hollow.setRod(m(7));
      hollow.setNight(m(9), 0.04 * m(9));
      // the line goes out from both ends toward the middle
      const half = half0 * (1 - 0.86 * smoothstep(30, 47, t));
      U.uSunZ.value.set(mid - half, mid + half);
      if (rodU) rodU.uZ.value.set(mid - half, mid + half);
      if (haloU) haloU.uZ.value.set(mid - half - 60, mid + half + 60);
      for (let s = 0; s < 2; s++) { const tv = walls[s].uTier.value; for (let k = 0; k < NT; k++) { const w = winT[s][k]; tv[k].z = w[1] * smoothstep(w[0], w[0] + 11, t); } }
      // the seated crowd is too small to see once the camera is well away
      const show = t < 26;
      for (const m2 of people) m2.visible = show;
      const hk = smoothstep(38, 52, t);
      handU.uSize.value = 0.05 + 0.95 * hk; handMesh.visible = hk > 0;
    }
    light(0);
    return {
      scene, path, hollow, near: 0.3, far: 8500,
      look: { exposure: 1.5, bloom: 0.26, threshold: 0.7, saturation: 1.04, vignette: 0.5 },
      portal: { mist: '#6fc9a8' },
      update(t) { light(t); },
    };
  },
};
