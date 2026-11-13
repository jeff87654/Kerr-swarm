// Chervil, Herb Row: the Long Flight. Booking night: the sunline stays dark, the Spindle opens end to end, and
// hundreds of thousands fly the axis with hand lamps, in shifts till lamp-dawn (docs/open-drums.md, The calendar and
// Booking Day in Chervil). The docs do not say how Chervil's Hollow is laid out; this plan is this page's own.
import { Scene } from 'three';
import { Plan, C, L } from '../kit/plan.js';
import { buildHollow } from '../kit/hollow.js';
import { makePath } from '../core/path.js';
import { litMaterial } from '../kit/mats.js';
import { instances } from '../kit/geo.js';
import { figureGeo, CLOTH, SKIN } from '../kit/folk.js';
import { DRUM } from '../kit/drum.js';
import { makeRng } from '../core/rng.js';

export function paintChervil(plan) {
  const rng = makeRng('chervil-plan');
  plan.fill(plan.band(0, L), { color: '#85a268', life: 0.3 });
  plan.mottle(['#90aa70', '#7a9a60', '#98ae76', '#74935c'], 420, 160, { alpha: 0.4, seed: 'chervil-lawn' });
  plan.fill(plan.band(0, 700), { color: '#4f7448', wood: 0.9, clear: ['life'], feather: 30 });
  plan.fill(plan.band(L - 700, L), { color: '#4a6f47', wood: 0.9, clear: ['life'], feather: 30 });
  // a long lake the halls picnic beside, winding most of the length of the floor
  const spine = []; for (let i = 0; i <= 40; i++) { const z = 900 + (i / 40) * 1950; spine.push([0.31 * C + Math.sin(i * 0.33) * 210 + Math.sin(i * 0.11 + 1) * 120, z]); }
  plan.stroke(spine, 330, { color: '#cdbf9a', paved: 0.2, life: 0.9, clear: ['wood'] });
  plan.stroke(spine, 280, { color: '#5aa3a0', water: 1, clear: ['life', 'paved', 'wood'] });
  plan.stroke(spine, 150, { color: '#2f7890' });
  plan.clumps(900, 9, 34, { seed: 'chervil-clumps', z0: 720, z1: L - 720, colors: ['#5f8a48', '#55803f', '#6b9450'], keep: (x, z) => Math.abs(x - 0.31 * C) > 420 || z < 800 || z > 2950 });
  // walks, every one lit: rings round the floor, lanes along it, and the shore
  const lit = (pts, w, sp) => { plan.stroke(pts, w, { color: '#cbbf9f', paved: 0.8, life: 0.8, clear: ['wood'] }); plan.lamps(pts, sp || 24); };
  const ring = (z, wob) => { const a = []; for (let i = 0; i <= 120; i++) a.push([(i / 120) * C, z + Math.sin(i * 0.31 + z) * wob]); return a; };
  for (let k = 0; k < 11; k++) lit(ring(760 + k * 223, 34), 6, k % 2 ? 30 : 22);
  for (let i = 0; i < 18; i++) { const x = (i / 18) * C; lit([[x, 740], [x + 60, 1500], [x - 40, 2300], [x, L - 740]], 5, 28); }
  plan.lamps(spine.map((q) => [q[0] - 170, q[1]]), 16); plan.lamps(spine.map((q) => [q[0] + 170, q[1]]), 16);
  // long tables set out on the lawns for the feast, each under a line of lanterns
  for (let i = 0; i < 70; i++) {
    const x = rng.f(0, C), z = rng.f(820, L - 820), a = rng.f(0, Math.PI), len = rng.f(50, 120);
    if (Math.abs(x - 0.31 * C) < 330 && z > 850 && z < 2900) continue;
    const p0 = [x - Math.cos(a) * len / 2, z - Math.sin(a) * len / 2], p1 = [x + Math.cos(a) * len / 2, z + Math.sin(a) * len / 2];
    plan.stroke([p0, p1], 9, { color: '#b9ab8c', paved: 0.5, life: 1, clear: ['wood'], cap: 'butt' });
    plan.stroke([p0, p1], 2.2, { color: '#efe6d2', cap: 'butt' });
    plan.lamps([p0, p1], 7, { radius: 1.6, power: 0.9 });
  }
}

export const chervilFlight = {
  id: 'chervil-flight',
  *build(ctx) {
    const plan = new Plan(ctx.q.plan);
    paintChervil(plan);
    yield;
    const hollow = yield* buildHollow(ctx, {
      seed: 'chervil', plan,
      light: { sun: '#000000', sunPower: 0, amb: '#1c2c52', ambPower: 2.2, ground: '#ffb468', groundPower: 0.25, air: '#2a3a5a', airDensity: 0.00005, bouncePower: 0 },
      sunline: { power: 0 },
      ground: { lamp: 1, lampColor: '#ffbe76', people: 0.5, sunRod: 0 },
      front: { lit: 0.42, crowd: 0.3, houseMix: 0.6, winPower: 3.0, winA: '#ffab58', winB: '#ffdca8' }, back: { lit: 0.5, crowd: 0.6, houseMix: 0.6, winPower: 3.0, winA: '#ffab58', winB: '#ffdca8', tiers: { 9: { crowd: 1, lit: 0.3 }, 14: { crowd: 0.9 } } },
    });
    yield;
    const scene = new Scene();
    scene.add(hollow.group);
    const R = DRUM.RH, rng = makeRng('long-flight');
    // the flight: down the axis from the front flying hall toward the back wall, turning slowly about it
    const ax = (deg, r, z) => [(deg / 360) * C, R - r, z];
    const path = makePath([
      { t: 0, p: ax(200, 16, 360), up: [0, 1, 0] },
      { t: 10, p: ax(215, 22, 560), look: ax(215, 0, 1800), up: [0, 1, 0] },
      { t: 24, p: ax(250, 34, 1150), look: ax(250, -160, 2500), up: [0, 1, 0] },
      { t: 38, p: ax(300, 30, 1850), look: ax(300, 180, 2900), up: [0, 1, 0] },
      { t: 50, p: ax(350, 20, 2500), look: ax(350, 0, 3600), up: [0, 1, 0] },
      { t: 60, p: ax(380, 8, 3050), up: [0, 1, 0] },
    ], { frame: hollow.frame, entryRadius: 9, exitRadius: 24 });
    const track = path.points(1.0);
    const clear = (x, y, z, d) => { for (const q of track) { if (Math.abs(q.z - z) > 400) continue; const a = (x - q.x) / R, r1 = R - y, r2 = R - q.y; const dx = r1 * Math.cos(x / R) - r2 * Math.cos(q.x / R), dy = r1 * Math.sin(x / R) - r2 * Math.sin(q.x / R); if (dx * dx + dy * dy < d * d) return false; } return true; };
    yield;
    // the river of hand lamps: everyone within 75 m of the axis, most heading for the back wall
    const lamps = [], n = Math.round(70000 * ctx.density);
    const tones = ['#ffc070', '#ffd08a', '#ffb060', '#ffd9a0', '#ffc878', '#ff9a58', '#ffb878', '#ffe0b0', '#ff8f50', '#ffcf90', '#ffc070', '#9fd0ff'];
    for (let i = 0; i < n; i++) {
      const r = DRUM.SPINDLE * Math.pow(rng(), 0.85) * 0.98 + 1.5, a = rng() * Math.PI * 2, z = rng.f(120, L - 120);
      const x = a * R, y = R - r;
      if (!clear(x, y, z, 3.5)) continue;
      const back = rng.chance(0.82), v = (back ? 1 : -1) * rng.f(1.2, 3.4), loop = rng.f(60, 140);
      lamps.push({ p: [x, y, z], color: rng.pick(tones), power: rng.f(5, 14), size: rng.f(0.4, 0.6), move: [0, 0, v], loop, twinkle: 0.25, phase: rng() });
    }
    hollow.glow(lamps, { minPx: 1.3, maxPx: 90, soft: 2.2 });
    yield;
    // flyers near the way, in wing-sleeves
    const flyMat = litMaterial(hollow.rig, { bend: hollow.frame, drift: true, side: 'double', soft: 0.5 });
    const flyers = new Map(), carried = [];
    for (let i = 0; i < Math.round(2600 * ctx.density); i++) {
      const q = track[Math.floor(rng() * track.length)];
      const r = Math.min(74, Math.max(2, (R - q.y) + rng.gauss() * 16)), a = q.x / R + rng.gauss() * 0.9, z = q.z + rng.f(-150, 150);
      const x = a * R, y = R - r;
      if (!clear(x, y, z, 6) || z < 150 || z > L - 150) continue;
      const back = rng.chance(0.82), v = (back ? 1 : -1) * rng.f(1.4, 3.2), loop = rng.f(50, 90), ph = rng();
      const skin = rng.pick(SKIN); let list = flyers.get(skin); if (!list) flyers.set(skin, list = []);
      list.push({ p: [x, y, z], yaw: back ? 0 : Math.PI, color: rng.pick(CLOTH), drift: [0, 0, v, loop], phase: ph, scale: rng.f(0.9, 1.1) });
      carried.push({ p: [x, y - 0.25, z + (back ? 0.9 : -0.9)], color: rng.pick(tones), power: rng.f(5, 9), size: 0.3, move: [0, 0, v], loop, phase: ph });
    }
    for (const [skin, list] of flyers) for (const m of instances(figureGeo(skin, 'fly'), flyMat, list, { frame: hollow.frame, drift: true })) hollow.group.add(m);
    hollow.glow(carried, { minPx: 1.5, maxPx: 160, soft: 2.0 });
    yield;
    return { scene, path, hollow, near: 0.4, far: 9000, look: { exposure: 1.5, bloom: 0.34, threshold: 0.6, saturation: 1.08, vignette: 0.55 }, portal: { mist: '#ffcf8a' } };
  },
};
