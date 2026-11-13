// Sorrel, Herb Row: the Hollow at lamp-dawn, when the elders have the lake.
// The plan follows docs/sorrel.md, "The Hollow's plan": the lake from Fox to Stag in Rings Four to Six with Bench Island
// in Otter, the orchards from Heron to Bee, the lawns from Swift to Moth, the grounds from Wolf to Hare, and the Dim Ends.
import { Scene } from 'three';
import { Plan, C, L } from '../kit/plan.js';
import { buildHollow } from '../kit/hollow.js';
import { makePath } from '../core/path.js';
import { scatterTrees } from '../kit/flora.js';
import { scatterPeople } from '../kit/folk.js';
import { makeRng } from '../core/rng.js';

const H = C / 12, RING = L / 9;       // an Hour is a 30 degree wedge, a Ring a 417 m slice

export function paintSorrel(plan) {
  const rng = makeRng('sorrel-plan');
  plan.fill(plan.band(0, L), { color: '#8aa466', life: 0.25 });
  plan.mottle(['#93ab6c', '#7c9a5c', '#9bb074', '#74935a', '#a3b47a'], 500, 150, { alpha: 0.4, seed: 'sorrel-lawn' });
  // the Dim Ends: woods and fern gardens under the walls, where the light falls away
  plan.fill(plan.band(0, 720), { color: '#4f7448', wood: 0.95, clear: ['life'], feather: 30 });
  plan.fill(plan.band(L - 720, L), { color: '#4a6f47', wood: 0.95, clear: ['life'], feather: 30 });
  for (let i = 0; i < 26; i++) plan.fill(plan.blob(rng.f(0, C), rng.chance(0.5) ? rng.f(380, 700) : rng.f(L - 700, L - 380), rng.f(40, 110), rng.f(30, 70), { seed: i + 3 }), { color: rng.pick(['#7b9a5e', '#6c8f62', '#88a468']), clear: ['wood'], life: 0.3 });
  // the orchards: Heron to Bee, Rings Three to Seven
  const ox0 = 1 * H + 50, ox1 = 4 * H - 60, oz0 = 2 * RING + 40, oz1 = 7 * RING - 40;
  plan.fill(plan.rect(ox0, oz0, ox1, oz1, 90), { color: '#86a062', rows: 1, clear: ['life'] });
  for (let i = 1; i < 6; i++) plan.stroke([[ox0, oz0 + (oz1 - oz0) * i / 6], [ox1, oz0 + (oz1 - oz0) * i / 6]], 9, { color: '#b7ab8c', clear: ['rows'], paved: 0.6, life: 0.4 });
  for (let i = 1; i < 5; i++) plan.stroke([[ox0 + (ox1 - ox0) * i / 5, oz0], [ox0 + (ox1 - ox0) * i / 5, oz1]], 9, { color: '#b7ab8c', clear: ['rows'], paved: 0.6, life: 0.4 });
  // winter tents: sections of orchard chilled in turn, white under the sunline
  for (const [tx, tz] of [[ox0 + 300, oz0 + 260], [ox0 + 1100, oz0 + 1500], [ox0 + 1500, oz0 + 240]]) {
    plan.fill(plan.rect(tx, tz, tx + 230, tz + 150, 12), { color: '#e9ecec', clear: ['rows'] });
    for (let k = 1; k < 5; k++) plan.stroke([[tx + 46 * k, tz + 4], [tx + 46 * k, tz + 146]], 2.5, { color: '#c9d2d6' });
  }
  // the lawns and the kite field: Swift to Moth
  plan.fill(plan.rect(7 * H + 60, 1 * RING + 380, 10 * H - 60, 8 * RING - 380, 200), { color: '#97b06c', life: 0.75, feather: 20 });
  plan.fill(plan.ellipse(8.5 * H, 4.5 * RING, 520, 380), { color: '#a5b878', life: 0.55 });
  // the grounds: Wolf to Hare. The half-g track, twelve spinball pitches, the bandstand
  const gx = 11.4 * H;
  plan.stroke(plan.ellipse(gx, 3.2 * RING, 190, 105), 22, { color: '#b5674a', paved: 0.3 });
  plan.fill(plan.ellipse(gx, 3.2 * RING, 172, 88), { color: '#96b06c', life: 0.4 });
  for (let i = 0; i < 12; i++) { const px = 10.9 * H + (i % 4) * 190, pz = 4.3 * RING + Math.floor(i / 4) * 250; plan.fill(plan.rect(px, pz, px + 150, pz + 200, 6), { color: '#9fb873', life: 0.9 }); plan.stroke(plan.rect(px, pz, px + 150, pz + 200, 6), 3, { color: '#f1eee2' }); plan.stroke([[px, pz + 100], [px + 150, pz + 100]], 2.5, { color: '#f1eee2' }); }
  plan.fill(plan.ellipse(0.45 * H, 5.4 * RING, 60, 60), { color: '#cfc5ae', paved: 1, life: 1 });
  plan.fill(plan.ellipse(0.45 * H, 5.4 * RING, 17, 17), { color: '#f0ead9' });
  // the lake: Fox to Stag, Rings Four to Six, about 3 square kilometres, with Bench Island in Otter
  const lx = 6 * H - 60, lz = 4.5 * RING;
  const lake = plan.blob(lx, lz, 1170, 610, { wobble: 0.16, lobes: 7, seed: 11 });
  plan.stroke(lake, 46, { color: '#cdbf9a', paved: 0.2, life: 0.8, clear: ['rows', 'wood'] });
  plan.fill(lake, { color: '#5fa6a4', water: 1, clear: ['life', 'paved', 'rows', 'wood'] });
  plan.fill(plan.blob(lx, lz, 950, 440, { wobble: 0.2, lobes: 6, seed: 12 }), { color: '#2f7890', feather: 60 });
  plan.fill(plan.blob(5.5 * H, lz - 20, 46, 34, { wobble: 0.2, seed: 4 }), { color: '#93ad68', clear: ['water'], life: 0.6 });   // Bench Island
  plan.stroke([[5.5 * H + 30, lz - 20], [5.5 * H + 150, lz - 20]], 5, { color: '#a58f6c', clear: ['water'], paved: 1, life: 0.5 });   // the jetty
  // promenades, lit at night: round the lake, and the Lamp Walk right round the back Dim End
  const walk = (pts, w) => { plan.stroke(pts, w, { color: '#c9bd9f', paved: 0.8, life: 0.7, clear: ['rows', 'wood'] }); plan.lamps(pts, 26); };
  const ring = (z) => { const a = []; for (let i = 0; i <= 96; i++) a.push([(i / 96) * C, z + Math.sin(i * 0.39) * 26]); return a; };
  walk(ring(L - 640), 8); walk(ring(660), 7);
  for (let i = 0; i < 12; i++) walk([[i * H, 700], [i * H + 30, 1500], [i * H - 20, 2300], [i * H, L - 700]], 6);
  for (let k = 1; k < 9; k++) if (k !== 4 && k !== 5) walk(ring(k * RING), 5);
  const shore = []; for (let i = 0; i <= 80; i++) { const a = (i / 80) * Math.PI * 2; shore.push([lx + Math.cos(a) * 1215, lz + Math.sin(a) * 655]); }
  plan.lamps(shore, 30);
}

export const sorrelLake = {
  id: 'sorrel-lake',
  *build(ctx) {
    const plan = new Plan(ctx.q.plan);
    paintSorrel(plan);
    yield;
    const hollow = yield* buildHollow(ctx, {
      seed: 'sorrel', plan,
      light: { sun: '#ffd7a2', sunPower: 0.5, amb: '#9db8d8', ambPower: 0.2 },
      sunline: { power: 26 },
      ground: { rows: [7, 6], canopy: '#7fa44e', people: 0.7, lamp: 0.5, sunRod: 26 },
      front: { crowd: 0.15, lit: 0.3, houseMix: 0.3 }, back: { crowd: 0.2, lit: 0.34, houseMix: 0.3 },
    });
    yield;
    const scene = new Scene();
    scene.add(hollow.group);
    const lx = 6 * H - 60, lz = 4.5 * RING;
    // out from under the apple trees, up to see the land close over the sky, down the lake toward the back wall
    // along the sunline's reflection, round Bench Island, and up over the lawns
    const path = makePath([
      { t: 0, p: [2700, 2.2, lz] },
      { t: 7, p: [2760, 3.2, lz], look: [3300, 520, lz + 240] },
      { t: 15, p: [2950, 30, lz - 30], look: [lx, 0, lz] },
      { t: 25, p: [3400, 34, lz - 170], look: [5.2 * H, 60, lz + 900] },
      { t: 34, p: [5.5 * H - 130, 9, lz - 150], look: [5.5 * H + 40, 3, lz - 20] },
      { t: 42, p: [5.5 * H + 100, 7, lz + 90], look: [5.9 * H, 70, lz + 1400] },
      { t: 50, p: [5.9 * H, 60, lz + 520], look: [6.3 * H, 300, lz + 1500] },
      { t: 56, p: [6.2 * H, 170, lz + 900] },
    ], { frame: hollow.frame, entryRadius: 1.8, exitRadius: 34 });
    const pts = path.points(0.5);
    yield* scatterTrees(hollow, { near: pts, radius: 180, max: 30000 * ctx.density });
    yield* scatterPeople(hollow, { near: pts, radius: 240, density: 1.3 * ctx.density, max: 8000 });
    return { scene, path, hollow, near: 0.6, far: 9000, look: { exposure: 1.9, bloom: 0.2, saturation: 1.05, threshold: 0.75 } };
  },
};
