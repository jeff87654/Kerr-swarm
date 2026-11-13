// Chervil, Herb Row: Booking Day, 06:00. Oona's dawn, a year in the making, watched from the Hollow's back terraces.
// It starts on the brown-violet of the River in a Window (the colour the back crews call bruise), warms through rose,
// gilds the far bank for twenty minutes while the near side is still dark, then turns into an ordinary morning
// (docs/open-drums.md, Booking Day in Chervil; docs/wander-year.md, Day 226; docs/eating-out.md, The Dawn Stand).
// The palette is "Oona's River dawn" from games/three-nights/src/15-canon.js.
//
// Not canon:
//   - the terrace: the crowd watches from the Third (tier 9) of the back wall, beside a Spindle lift track
//   - where the Dawn Stand's cart stands, how it looks, and its queue
//   - rugs, rail lamps, hand lamps on the terrace; an old woman with a cup at the rail
//   - Chervil's Hollow plan (chervil_flight.js's paintChervil)
//   - the three hours of dawn are pressed into one minute
import { Scene, Color } from 'three';
import { Plan, C, L } from '../kit/plan.js';
import { buildHollow, tierPlace, TIERS } from '../kit/hollow.js';
import { makePath } from '../core/path.js';
import { hollowRig, litMaterial } from '../kit/mats.js';
import { Geo } from '../kit/geo.js';
import { crowd, scatterPeople, SKIN } from '../kit/folk.js';
import { scatterTrees } from '../kit/flora.js';
import { DRUM } from '../kit/drum.js';
import { makeRng, smoothstep } from '../core/rng.js';
import { paintChervil } from './chervil_flight.js';

// The light over the minute: the bright side faces the far bank (sun), the camera's side is sunFar.
// Each key: time, far colour and power, near colour and power, the Hollow's glow, the rod, night lamps, lit windows, sharpness.
// Light colours are the palette's own hues brought to full strength (#3d2a3f is bruise, #8a4f6a rose, #e3925f the
// warming, #fff1d0 morning); the powers say how strong.
const hue = (c) => { const q = new Color(c); const m = Math.max(q.r, q.g, q.b, 1e-6); return q.multiplyScalar(1 / m); };
const LIGHT = [
  { t: 0, far: '#3d2a3f', farP: 0, near: '#3d2a3f', nearP: 0, amb: '#26304a', ambP: 2.0, rod: 0, lamp: 1, lit: 0.5, sharp: 1 },
  { t: 7, far: '#3d2a3f', farP: 0, near: '#3d2a3f', nearP: 0, amb: '#26304a', ambP: 2.0, rod: 0, lamp: 1, lit: 0.5, sharp: 1 },
  { t: 16, far: '#3d2a3f', farP: 0.2, near: '#3d2a3f', nearP: 0.16, amb: '#43305c', ambP: 2.3, rod: 26, lamp: 0.8, lit: 0.5, sharp: 1 },
  { t: 25, far: '#8a4f6a', farP: 0.45, near: '#8a4f6a', nearP: 0.2, amb: '#40283e', ambP: 1.9, rod: 22, lamp: 0.7, lit: 0.45, sharp: 1.5 },
  { t: 31, far: '#e88a50', farP: 1.2, near: '#8a4f6a', nearP: 0.07, amb: '#30283e', ambP: 1.5, rod: 30, lamp: 0.8, lit: 0.4, sharp: 3 },
  { t: 45, far: '#ee9a58', farP: 1.6, near: '#8a4f6a', nearP: 0.06, amb: '#30283e', ambP: 1.5, rod: 30, lamp: 0.8, lit: 0.35, sharp: 3.5 },
  { t: 53, far: '#fff1d0', farP: 0.95, near: '#fff1d0', nearP: 0.85, amb: '#9db0b8', ambP: 0.32, rod: 60, lamp: 0.06, lit: 0.06, sharp: 1 },
  { t: 99, far: '#fff1d0', farP: 0.95, near: '#fff1d0', nearP: 0.85, amb: '#9db0b8', ambP: 0.32, rod: 60, lamp: 0, lit: 0.03, sharp: 1 },
].map((k) => ({ ...k, far: hue(k.far), near: hue(k.near), amb: new Color(k.amb) }));

// The ground's night lamps go out where the dawn has reached: a painter's lamps follow the light across the land.
function lampsFollowDawn(hollow) {
  const m = hollow.ground.material, before = m.fragmentShader;
  m.fragmentShader = before
    .replace('vec3 lit = c * (Lgt + uLampCol * halo * uLamp * 9.0);', 'float lampK = uLamp * (1.0 - smoothstep(0.06, 0.4, dot(kSunColor(vW.xy), vec3(0.3, 0.55, 0.15))));\n  vec3 lit = c * (Lgt + uLampCol * halo * lampK * 9.0);')
    .replace('lit += uLampCol * mask.b * uLamp * 3.0;', 'lit += uLampCol * mask.b * lampK * 3.0;');
  if (!m.fragmentShader.includes('lampK * 3.0')) throw new Error('chervil-dawn: the ground shader changed; lampsFollowDawn() needs updating');
}

// make a cloud of glow points dimmable: one uniform scales them all (the kit's glows are fixed at build)
function dimmable(mesh) {
  const m = mesh.material;
  m.uniforms.uDim = { value: 1 };
  const before = m.fragmentShader;
  m.fragmentShader = before.replace('uniform float uSoft;', 'uniform float uSoft; uniform float uDim;').replace('vec4(vC * a, 1.0)', 'vec4(vC * a * uDim, 1.0)');
  if (m.fragmentShader === before) throw new Error('chervil-dawn: the glow shader changed; dimmable() needs updating');
  return m.uniforms.uDim;
}

// The Dawn Stand: a coffee cart, long side along z, serving across its counter toward -x. Origin on the floor at its centre.
function cartGeo() {
  const g = new Geo();
  const wood = '#6a3b33', trim = '#d9c7a2', iron = '#3a3836';
  for (const z of [-0.95, 0.95]) {
    g.rot('z', Math.PI / 2);
    g.cyl(0.36, -0.75, z, 0.36, 0.36, 0.08, 10, iron, { smooth: false }); g.cyl(0.36, 0.67, z, 0.36, 0.36, 0.08, 10, iron, { smooth: false });
    g.pop();
  }
  g.box(-0.62, 0.36, -1.25, 0.62, 1.02, 1.25, wood, { top: trim });
  g.box(-0.66, 0.6, -1.27, -0.62, 0.66, 1.27, trim);
  g.box(-0.78, 1.02, -1.32, 0.66, 1.08, 1.32, '#e4d6b8');
  // the urn, the steamer baskets for the honeycomb cake, cups
  g.cyl(0.2, 1.08, -0.7, 0.2, 0.18, 0.5, 9, '#b9b2a4', { top: '#8e877a' }); g.cyl(0.2, 1.58, -0.7, 0.07, 0.03, 0.08, 6, '#55504a');
  for (let i = 0; i < 3; i++) g.cyl(0.18, 1.08 + i * 0.13, 0.55, 0.26, 0.26, 0.12, 10, i === 2 ? '#d8b37a' : '#c39b62', { top: '#e2c48e' });
  for (let i = 0; i < 4; i++) g.cyl(-0.45, 1.08, -0.2 + i * 0.13, 0.045, 0.05, 0.09, 6, '#f4efe4');
  // poles and the awning, striped in the dawn's own colours, sloping down toward the queue
  for (const [x, z] of [[-0.74, -1.28], [-0.74, 1.28], [0.6, -1.28], [0.6, 1.28]]) g.cyl(x, 1.08, z, 0.03, 0.03, x < 0 ? 1.12 : 1.42, 5, iron);
  const n = 8;
  for (let i = 0; i < n; i++) {
    const z0 = -1.45 + (2.9 * i) / n, z1 = -1.45 + (2.9 * (i + 1)) / n, c = i % 2 ? '#fff1d0' : '#c9603c';
    g.quad([-1.05, 2.12, z0], [-1.05, 2.12, z1], [0.75, 2.56, z1], [0.75, 2.56, z0], c);
    g.quad([-1.05, 2.12, z1], [-1.05, 2.12, z0], [0.75, 2.56, z0], [0.75, 2.56, z1], c);
    g.quad([-1.05, 1.9, z0], [-1.05, 1.9, z1], [-1.05, 2.12, z1], [-1.05, 2.12, z0], c);
  }
  // the lamp under the awning and a slate with the prices
  g.box(-0.3, 1.86, -0.9, 0.3, 1.94, 0.9, '#ffd9a0', { emit: 6 });
  g.box(-0.9, 0.0, 1.45, -0.86, 0.95, 2.05, '#2b2a2a', { emit: 0.0 });
  g.box(-0.93, 0.45, 1.52, -0.91, 0.88, 1.98, '#e9e3d4', { emit: 0.25 });
  // a crate of cups and a stool for whoever minds it
  g.box(0.75, 0, -0.4, 1.25, 0.42, 0.2, '#8a6a46');
  g.cyl(0.95, 0, 0.8, 0.2, 0.18, 0.62, 7, '#5a4a3a');
  return g;
}

export const chervilDawn = {
  id: 'chervil-dawn',
  title: 'Oona\'s River dawn', drum: 'Chervil', row: 'Herb Row', kind: 'an open hall drum', light: 0.0,
  line: 'It started the brown-violet the back crews call bruise. For twenty minutes the far bank was gold and we were still in the dark. Oona says it was too slow in the middle.',
  tone: '#e3925f', source: 'open-drums.md (Booking Day in Chervil), eating-out.md (The Dawn Stand), wander-year.md (Day 226)',
  sound: { root: 46, scale: 'lydian', pad: 0.55, air: 0.25, crowd: 0.3, choir: 0.35, bells: 0.2, bright: 0.4 },
  *build(ctx) {
    const plan = new Plan(ctx.q.plan);
    paintChervil(plan);
    yield;
    const k0 = LIGHT[0];
    const backTiers = {}; for (let i = 3; i < 16; i++) backTiers[i] = { crowd: 0.95, lit: 0.1 };
    const frontTiers = {}; for (let i = 3; i < 16; i++) frontTiers[i] = { crowd: 0.8 };
    const hollow = yield* buildHollow(ctx, {
      seed: 'chervil', plan,
      light: { sun: k0.far, sunPower: 0, sunFar: k0.near, sunFarPower: 0, amb: k0.amb, ambPower: k0.ambP, ground: '#ffb468', groundPower: 0.25, air: '#2a3a5a', airDensity: 0.00005, bouncePower: 0.25 },
      sunline: { power: 0, keep: true },
      ground: { lamp: 1, lampColor: '#ffbe76', people: 0.6, sunRod: 0 },
      front: { lit: 0.5, crowd: 0.4, houseMix: 0.6, winPower: 2.2, winA: '#ffab58', winB: '#ffdca8', tiers: frontTiers },
      back: { lit: 0.5, crowd: 0.6, houseMix: 0.6, winPower: 2.6, winA: '#ffab58', winB: '#ffdca8', tiers: backTiers },
    });
    lampsFollowDawn(hollow);
    yield;
    const scene = new Scene();
    scene.add(hollow.group);
    const rng = makeRng('chervil-dawn');

    // ---- the terrace: the Third on the back wall, its x = 0 on a Spindle lift track
    const tier = TIERS.third;
    const tp = tierPlace(hollow.wallDepths[1], tier);
    const A0 = (2.5 * C / 8) / DRUM.RH;
    const ter = hollow.terrace(1, tier, (A0 * 180) / Math.PI);
    const FR = ter.floorR, Z0 = L - tp.zRail;
    const H = (xt, yt, zt) => [DRUM.RH * (A0 + xt / FR), tp.y + yt, Z0 + zt];
    // terrace things get their own rig: the same sunline, plus warm light off the rail lamps near the terrace floor
    const trig = hollowRig({ floorR: FR, ground: '#ffb070', groundPower: 0.5 });
    for (const k of ['uSunA', 'uSunB', 'uSunDir', 'uSunSharp', 'uSunZ', 'uAmb', 'uBounce', 'uAir']) trig.uniforms[k] = hollow.rig.uniforms[k];
    const tLit = litMaterial(trig, { bend: ter.frame }), tDouble = litMaterial(trig, { bend: ter.frame, side: 'double' });
    const tWalk = litMaterial(trig, { bend: ter.frame, walk: true });

    // the camera's way through the crowd to the rail, in terrace metres
    const AX = [-46, 19], BX = [-37, -2];
    const aisle = (x, z) => { const dx = BX[0] - AX[0], dz = BX[1] - AX[1]; let u = ((x - AX[0]) * dx + (z - AX[1]) * dz) / (dx * dx + dz * dz); u = Math.max(0, Math.min(1, u)); return Math.hypot(x - AX[0] - u * dx, z - AX[1] - u * dz); };

    // the terrace floor near the watchers: the walk along the rail, lawn and beds, the walk under the houses
    const RX = 300;
    const floor = new Geo();
    // (the wall's own terrace is a polygon whose chords stand up to 3.4 cm proud of the true curve: build over it)
    const FY = 0.05, lawn = new Color('#7d9a62'), bed = new Color('#728f58');
    for (let x = -RX; x < RX; x += 2) {
      const pv = (k) => (k + 0.05 * (rng() - 0.5));
      floor.floor(x, 0.3, x + 2, 3.4, FY, [pv(0.5), pv(0.45), pv(0.36)]);
      for (let z = 3.4; z < 25.4; z += 2) {
        const g = 0.9 + 0.2 * rng(), q = rng() < 0.25 ? bed : lawn;
        floor.floor(x, z, x + 2, Math.min(z + 2, 25.4), FY, [q.r * g, q.g * g, q.b * g]);
        if (rng() < 0.18) { const fx = x + rng.f(0.2, 1.4), fz = z + rng.f(0.2, 1.4), s = rng.f(0.25, 0.5); floor.floor(fx, fz, fx + s, fz + s, FY + 0.01, rng.pick(['#c98a9a', '#d9b25a', '#b9a3d6', '#e0d0b0', '#e3925f'])); }
      }
      floor.floor(x, 25.4, x + 2, 29.9, FY, [pv(0.48), pv(0.43), pv(0.35)]);
    }
    ter.add(floor.mesh(tLit, ter.frame));
    yield;

    // the rail, its posts, and lamps along it
    const rail = new Geo({ maxSeg: 4 });
    rail.box(-RX, 1.02, 0.12, RX, 1.1, 0.34, '#d8ccb4');
    rail.box(-RX, 0.0, 0.16, RX, 0.14, 0.3, '#b9ad96');
    for (let x = -RX; x <= RX; x += 2.4) rail.box(x - 0.04, 0.14, 0.19, x + 0.04, 1.02, 0.27, '#9c917e');
    const lampGlows = [];
    for (let x = -RX + 14; x <= RX; x += 16) {
      rail.cyl(x, 0, 0.9, 0.07, 0.05, 3.1, 5, '#3c3b3a');
      rail.cyl(x, 3.05, 0.9, 0.18, 0.13, 0.3, 6, '#fff0c8', { emit: 2.5 });
      lampGlows.push({ p: [x, 3.2, 0.9], color: '#ffc983', power: 7, size: 0.9 });
    }
    ter.add(rail.mesh(tLit, ter.frame));
    const railDim = dimmable(ter.glow(lampGlows, { maxPx: 70, soft: 2.0 }));
    yield;

    // ---- the Dawn Stand, its queue and a little warm light
    const CX = -31, CZ = 9;
    const cart = cartGeo();
    const stand = new Geo();
    stand.at(CX, 0, CZ, 0).add(cart).pop();
    // two high tables to drink at
    for (const [x, z] of [[CX - 4.5, CZ - 3.2], [CX - 3.6, CZ + 3.8]]) { stand.cyl(x, 0, z, 0.06, 0.06, 1.05, 5, '#3a3836'); stand.cyl(x, 1.05, z, 0.42, 0.42, 0.04, 10, '#d9c7a2'); stand.cyl(x - 0.15, 1.09, z, 0.04, 0.045, 0.09, 6, '#f4efe4'); }
    ter.add(stand.mesh(tLit, ter.frame));
    const cartLight = [];
    for (let i = 0; i < 7; i++) cartLight.push({ p: [CX - 1.05, 1.98, CZ - 1.4 + (2.8 * i) / 6], color: '#ffd08a', power: 5, size: 0.16, twinkle: 0.05 });
    cartLight.push({ p: [CX - 0.4, 1.6, CZ], color: '#ffb468', power: 1.6, size: 4.5 });
    const cartDim = dimmable(ter.glow(cartLight, { maxPx: 400, soft: 2.4 }));
    // a pool of lamplight on the paving in front of the counter
    const pool = new Geo();
    for (let i = 0; i < 4; i++) { const r = 1.2 + i * 1.1; pool.cyl(CX - 1.4, 0.08 + i * 0.004, CZ, r, r, 0.001, 18, '#ffb060', { emit: 0.6, cap: true, smooth: false }); }
    const poolMat = litMaterial(trig, { bend: ter.frame, additive: true, emit: 1 });
    poolMat.uniforms.uTint.value.set(0.12, 0.08, 0.05);
    ter.add(pool.mesh(poolMat, ter.frame));
    yield;

    // ---- the watchers
    const spots = [], hand = [];
    const facing = () => Math.PI + rng.f(-0.3, 0.3);
    const busy = (x) => 0.92 - 0.5 * smoothstep(40, 260, Math.abs(x + 30));
    const free = (x, z, d) => aisle(x, z) > d && Math.hypot(x - CX, z - CZ) > 3.2;
    // along the rail, standing two deep
    for (let x = -RX + 2; x < RX - 2; x += 0.72) {
      for (const z0 of [0.95, 1.75]) {
        if (!rng.chance(busy(x) * (z0 < 1 ? 1 : 0.7))) continue;
        const x1 = x + rng.f(-0.18, 0.18), z1 = z0 + rng.f(-0.15, 0.2);
        if (!free(x1, z1, 2.3)) continue;
        const child = rng.chance(0.12);
        spots.push({ p: [x1, FY, z1], yaw: facing(), child });
        if (rng.chance(0.1)) hand.push({ p: [x1 + rng.f(-0.25, 0.25), child ? 0.6 : 0.95, z1 - 0.3], color: rng.pick(['#ffc070', '#ffd08a', '#ffb060']), power: rng.f(3, 6), size: 0.13, twinkle: 0.15 });
      }
    }
    // seated on rugs in the beds behind them, in their tables
    const rugs = new Geo();
    for (let x = -RX + 4; x < RX - 4; x += rng.f(3.5, 6.5)) {
      for (let row = 0; row < 3; row++) {
        if (!rng.chance(busy(x))) continue;
        const rx = x + rng.f(-1.5, 1.5), rz = 4 + row * 4 + rng.f(-0.8, 0.8), w = rng.f(1.8, 3.2), d = rng.f(1.5, 2.4);
        if (Math.hypot(rx - CX, rz - CZ) < 4) continue;
        rugs.box(rx - w / 2, FY, rz - d / 2, rx + w / 2, FY + 0.03, rz + d / 2, rng.pick(['#8a4f6a', '#c9603c', '#d7c49a', '#5b4b9a', '#3f6f6a', '#b98a4a', '#7a4a2e']));
        const n = rng.i(2, 5);
        for (let k = 0; k < n; k++) {
          const px = rx - w / 2 + 0.35 + (w - 0.7) * ((k + 0.5) / n) + rng.f(-0.15, 0.15), pz = rz + rng.f(-d / 3, d / 3);
          if (free(px, pz, 2.3)) spots.push({ p: [px, FY + 0.03, pz], sit: true, yaw: facing() });
        }
        const sx = rx + rng.f(-w / 2, w / 2), sz = rz + d / 2 + 0.3;
        if (rng.chance(0.35) && free(sx, sz, 2.4)) spots.push({ p: [sx, FY + 0.03, sz], yaw: facing(), child: rng.chance(0.4) });
      }
    }
    ter.add(rugs.mesh(tLit, ter.frame));
    // an old woman at the rail with a cup, frowning at the middle of her own dawn
    const OX = -51, OZ = 2.6;
    spots.push({ p: [OX, FY + 0.03, OZ], sit: true, yaw: Math.PI + 0.25, color: '#6b3f5a', skin: SKIN[0] });
    const cup = new Geo(); cup.cyl(OX - 0.06, 0.62, OZ - 0.3, 0.05, 0.055, 0.1, 7, '#f4efe4'); cup.box(OX - 0.6, FY, OZ - 0.5, OX + 0.6, FY + 0.03, OZ + 0.6, '#3d2a3f');
    ter.add(cup.mesh(tLit, ter.frame));
    // the queue for the Dawn Stand, back along the terrace
    for (let i = 0; i < 26; i++) {
      const u = i * 0.85;
      const x = CX - 1.9 - Math.min(u, 3.2) + rng.f(-0.12, 0.12), z = CZ + (u > 3.2 ? u - 3.2 : 0) + Math.sin(u * 0.4) * 0.5;
      if (!free(x, z, 2.2) && i > 2) continue;
      spots.push({ p: [x, 0, z], yaw: u > 3.2 ? Math.PI + rng.f(-0.4, 0.4) : Math.PI / 2 + rng.f(-0.3, 0.3), child: rng.chance(0.08) });
    }
    // and people with cups, standing about the tables
    for (const [x, z] of [[CX - 4.5, CZ - 3.2], [CX - 3.6, CZ + 3.8]]) for (let k = 0; k < 3; k++) { const a = rng.f(0, 6.28); spots.push({ p: [x + Math.cos(a) * 0.75, 0, z + Math.sin(a) * 0.75], yaw: Math.atan2(-Math.cos(a), -Math.sin(a)) }); }
    // strollers on the back walk, under the houses
    for (let i = 0; i < 90; i++) { const x = rng.f(-RX, RX), z = rng.f(26, 28.5); if (free(x, z, 3)) spots.push({ p: [x, 0, z], walk: rng.f(1.5, 6) }); }
    for (const m of crowd(spots, tWalk, { frame: ter.frame, cell: 2000, bob: 0.22, speed: 0.7, seed: 'dawn-crowd' })) ter.add(m);
    const handDim = dimmable(ter.glow(hand, { maxPx: 40, soft: 2.0 }));
    yield;

    // ---- the flight
    const F = (x, y, z) => [x, y, z];
    const X0 = DRUM.RH * A0;
    const path = makePath([
      { t: 0, p: H(-46, 2.2, 19) },
      { t: 10, p: H(-41.5, 2.5, 8), look: F(X0 - 60, 560, 1200), fov: 56 },
      { t: 18, p: H(-38.5, 3.0, 1.2), look: F(X0 - 20, 760, 600), fov: 58 },
      { t: 26, p: F(X0 - 20, tp.y + 10, Z0 - 160), look: F(X0 + 900, 480, Z0 - 900), fov: 62 },
      { t: 33, p: F(X0, tp.y - 10, Z0 - 430), look: F(X0 + 700, 820, L), fov: 64 },
      { t: 41, p: F(X0 + 50, 430, Z0 - 780), look: F(X0 + 1300, 1300, Z0 - 1050), fov: 64, roll: 0.3 },
      { t: 49, p: F(X0 + 160, 320, Z0 - 1180), look: F(X0 + 450, 650, 500), fov: 60, roll: 0.05 },
      { t: 56, p: F(X0 + 290, 190, Z0 - 1540) },
      { t: 62, p: F(X0 + 420, 120, Z0 - 1830) },
    ], { frame: hollow.frame, entryRadius: 2, exitRadius: 30 });
    yield;
    const low = path.points(0.5).filter((q) => q.y < 200);
    if (low.length) {
      yield* scatterTrees(hollow, { near: low, radius: 150, max: 5000 * ctx.density });
      yield* scatterPeople(hollow, { near: low, radius: 200, density: 1.0 * ctx.density, max: 4000 });
    }

    const farAngle = A0 + Math.PI;
    const far = new Color(), near = new Color(), amb = new Color();
    const frontLit = hollow.walls[0].material.uniforms.uLit;
    const sharpU = hollow.rig.uniforms.uSunSharp, glowU = trig.uniforms.uGroundGlow, warm = new Color('#ffb070');
    const update = (t) => {
      let i = 0; while (i < LIGHT.length - 2 && LIGHT[i + 1].t <= t) i++;
      const a = LIGHT[i], b = LIGHT[i + 1], s = smoothstep(a.t, b.t, t);
      far.lerpColors(a.far, b.far, s); near.lerpColors(a.near, b.near, s); amb.lerpColors(a.amb, b.amb, s);
      const mix = (k) => a[k] + (b[k] - a[k]) * s;
      hollow.rig.set({ sun: far, sunPower: mix('farP'), sunFar: near, sunFarPower: mix('nearP'), sunAngle: farAngle, amb, ambPower: mix('ambP') });
      sharpU.value = mix('sharp');
      // the rod is seen from the near side: its brightness is rod x the near light
      hollow.setRod(mix('rod'));
      const lamp = mix('lamp');
      hollow.setNight(lamp, mix('lit'));
      frontLit.value = mix('lit') * 0.6;
      glowU.value.set(warm.r * 0.5 * lamp, warm.g * 0.5 * lamp, warm.b * 0.5 * lamp);
      railDim.value = lamp; handDim.value = lamp * lamp; cartDim.value = 0.45 + 0.55 * lamp;
      poolMat.uniforms.uEmit.value = lamp;
    };
    update(0);
    return { scene, path, hollow, near: 0.3, far: 9000, look: { exposure: 1.35, bloom: 0.3, threshold: 0.7, saturation: 1.06, vignette: 0.5 }, portal: { mist: '#e3925f' }, update };
  },
};
