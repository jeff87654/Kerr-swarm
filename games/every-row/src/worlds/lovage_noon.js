// Lovage, Herb Row: twelve hours of noon.
// Lovage auctions its high decks and its Hollow hours and spends the rents on a bigger commons, most visibly a sunline
// held at full brightness for twelve hours instead of six (docs/ashgrove.md, "Merrow and Herb Row"). The flight starts
// at the Glasshouse, which rents a strip of the Hollow's floor at auction and serves what it grows there: you eat
// between the rows (docs/eating-out.md). It lifts over the bright squares and the crowds, crosses the lake with the line
// lying in it, and climbs the back end wall to a wedding on a terrace at a third of a g, with the sunline still at full
// noon at six in the evening: the apple cut crosswise and held up, the new sofa, the old chair, and the reel that works
// its way round the terrace a hand's width at a time (ashgrove.md, "Day three: Lovage"). It leaves through the ring the
// couple were married under, at the rail, with the whole bright Hollow beyond.
//
// Not canon (this page's own, kept small):
// - the plan of Lovage's Hollow: rented strips (the Glasshouse, other glasshouses, orchards, herb fields) along the front
//   edge, three rows of paved squares right round the floor, the lake and its island rotunda, a field of plots for the
//   auctioned hours, lamplit squares under the back wall where Sorrel has dim woods
// - gilded domes on the lift pavilions and the rotunda; fountains in the squares
// - the Glasshouse's tables in the aisles between its houses, and which crops grow in which house
// - the gilded ring at the rail, the bunting, the long table, and the other weddings along the Third
// - the reel danced as two rings of leapers
import { Scene, Vector3 } from 'three';
import { Plan, C, L } from '../kit/plan.js';
import { buildHollow, TIERS } from '../kit/hollow.js';
import { makePath, nearPath } from '../core/path.js';
import { scatterTrees } from '../kit/flora.js';
import { crowd, figureGeo, SKIN } from '../kit/folk.js';
import { Geo, instances } from '../kit/geo.js';
import { litMaterial } from '../kit/mats.js';
import { makeRng, hash2 } from '../core/rng.js';

const XG = 2000;                                   // the Glasshouse's middle aisle, where the flight starts
const XA = 2200;                                   // where the wedding ring stands on the back wall's Third
const GLASS = { x0: XG - 176, x1: XG + 176, segs: [[452, 560], [568, 676], [684, 792]], pitch: 16, half: 4 };
const LAKE = { x: 2240, z: 2080, rx: 610, rz: 410 };
const ISLE = { x: 2105, z: 2185 };
const GOLD = '#f2c050', GOLD2 = '#d89a34', WHITE = '#f7f2e6';
// new clothes: Lovage dresses brighter than Sorrel
const NEW = ['#f6f1e4', '#ffffff', '#efc65a', '#f29e38', '#e8644a', '#d9476e', '#b83f86', '#7d5bd0', '#3c8fd6', '#2aa596', '#5cb85c', '#f7cfb6', '#1f2c4a', '#e0b04a', '#ff8a3c', '#9fd26a', '#c8e4f4', '#f4e0f0'];
const SQZ = [[850, 1040], [1105, 1295], [1360, 1550]];         // the three rows of squares
const SQN = 40;                                                 // squares round the floor in each row

// ---------------------------------------------------------------- the plan
function paintLovage(plan) {
  const rng = makeRng('lovage-plan');
  plan.fill(plan.band(0, L), { color: '#adb67a', life: 0.3 });
  plan.mottle(['#b6bc80', '#a2b070', '#bcbd86', '#a5b26c', '#c3c08a', '#b0b876'], 520, 150, { alpha: 0.4, seed: 'lovage-lawn' });
  const walkway = (pts, w, o = {}) => plan.stroke(pts, w, { color: o.color || '#e9dcb8', paved: 0.9, life: o.life === undefined ? 0.8 : o.life, clear: ['wood', 'rows'] });
  const ring = (z, wob, n = 120) => { const a = []; for (let i = 0; i <= n; i++) a.push([(i / n) * C, z + Math.sin(i * 0.37 + z) * wob]); return a; };

  // ---- the front edge: strips rented at auction, at the edge of the line's light
  plan.fill(plan.band(374, 430), { color: '#e7d9b4', paved: 1, life: 0.5, clear: ['wood'] });
  let x = GLASS.x1 + 12;
  while (x < GLASS.x0 + C - 12) {
    const w = Math.min(rng.f(150, 360), GLASS.x0 + C - 12 - x), kind = rng.pick(['glass', 'orchard', 'herbs', 'orchard', 'glass', 'beds']);
    const x1 = x + w;
    if (w > 60) {
      if (kind === 'glass') paintGlassRows(plan, x, x1, [[452, 620], [628, 796]], 15);
      else if (kind === 'orchard') plan.fill(plan.rect(x, 452, x1, 796, 6), { color: '#9db06a', rows: 1, clear: ['life'] });
      else if (kind === 'herbs') { const cols = ['#b4a5d0', '#a9b98e', '#e9bd52', '#93ab6a', '#d79a9a', '#c9c4e0']; for (let s = x; s < x1 - 3; s += 7) plan.fill(plan.rect(s, 456, Math.min(s + 4.5, x1), 792), { color: cols[Math.floor((s - x) / 7) % cols.length], life: 0.25 }); }
      else { plan.fill(plan.rect(x, 452, x1, 796, 6), { color: '#c9bf9a', paved: 0.4, life: 0.4 }); for (let s = x + 6; s < x1 - 6; s += 12) plan.fill(plan.rect(s, 460, s + 8, 788, 3), { color: rng.pick(['#8fab62', '#a4b86e', '#7e9d58', '#b9b26a']) }); }
    }
    walkway([[x1 + 6, 440], [x1 + 6, 810]], 10, { life: 0.6 });
    x = x1 + 12;
  }
  paintGlassRows(plan, GLASS.x0, GLASS.x1, GLASS.segs, GLASS.pitch, true);
  walkway(ring(822, 0), 14);

  // ---- the bright squares: three rows right round the floor
  const px = C / SQN;
  for (let j = 0; j < SQZ.length; j++) {
    const [z0, z1] = SQZ[j];
    for (let i = 0; i < SQN; i++) {
      const x0 = i * px + 24, x1 = (i + 1) * px - 24, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
      const lawn = hash2(i, j, 3) < 0.22 && Math.abs(mx - XG) > 400;
      if (lawn) {
        plan.fill(plan.rect(x0, z0, x1, z1, 16), { color: '#b4c07e', life: 0.8, clear: ['wood'] });
        plan.garden(x0 + 20, z0 + 20, x1 - 20, z1 - 20, ['#e8b8c8', '#f0d070', '#c8dc8a', '#c0aadc', '#f4a070'], { seed: 'g' + i + '_' + j, gravel: '#e6dab8' });
        continue;
      }
      plan.fill(plan.rect(x0, z0, x1, z1, 18), { color: '#efe2bf', paved: 1, life: 0.95, clear: ['wood', 'rows'] });
      plan.stroke(plan.rect(x0 + 30, z0 + 30, x1 - 30, z1 - 30, 10), 3, { color: '#e2c88e' });
      plan.stroke(plan.rect(x0 + 52, z0 + 52, x1 - 52, z1 - 52, 8), 2, { color: '#e6d3a0' });
      plan.stroke([[x0 + 10, z0 + 10], [x1 - 10, z1 - 10]], 4, { color: '#e4cf98' });
      plan.stroke([[x1 - 10, z0 + 10], [x0 + 10, z1 - 10]], 4, { color: '#e4cf98' });
      const fl = rng.pick(['#e8a0b4', '#f2c860', '#d8789a', '#c6a6e0', '#f49a62', '#e7e2f0']);
      plan.stroke(plan.rect(x0 + 9, z0 + 9, x1 - 9, z1 - 9, 10), 6, { color: fl, clear: ['paved', 'life'] });
      for (const [qx, qz] of [[x0 + 36, z0 + 36], [x1 - 36, z0 + 36], [x0 + 36, z1 - 36], [x1 - 36, z1 - 36]]) plan.fill(plan.ellipse(qx, qz, 9, 9), { color: rng.pick(['#e8a0b4', '#f2c860', '#c6a6e0', '#f49a62']), clear: ['paved', 'life'] });
      plan.fill(plan.ellipse(mx, mz, 24, 24), { color: '#f7f0de', clear: ['life'] });
      plan.fill(plan.ellipse(mx, mz, 21, 21), { color: '#76bfc0', water: 1, clear: ['life', 'paved'] });
      plan.fill(plan.ellipse(mx, mz, 12, 12), { color: '#4aa2ae' });
      plan.features.push({ type: 'square', x: mx, z: mz });
    }
    // avenues between the squares, and walks along the rows
    for (let i = 0; i < SQN; i++) { walkway([[i * px, z0 - 6], [i * px, z1 + 6]], 9); plan.avenue([[i * px, z0], [i * px, z1]], 9, 11, { color: '#88a35a' }); }
  }
  for (const z of [845, 1072, 1327, 1582]) { walkway(ring(z, 0, 160), 12); plan.avenue(ring(z, 0, 160), 11, 12, { color: '#86a058' }); }

  // ---- the middle: the lake, lawns, gardens and clumps elsewhere round
  plan.clumps(700, 10, 36, { seed: 'lovage-clumps', z0: 1640, z1: 2560, colors: ['#7d9c55', '#86a45c', '#93ab62'], keep: (cx, cz) => Math.hypot((cx - LAKE.x) / (LAKE.rx + 160), (cz - LAKE.z) / (LAKE.rz + 140)) > 1 });
  for (let i = 0; i < 26; i++) {
    const gx = rng.f(0, C), gz = rng.f(1680, 2440);
    if (Math.abs(((gx - LAKE.x + C * 1.5) % C) - C / 2) < LAKE.rx + 260) continue;
    plan.garden(gx, gz, gx + rng.f(90, 170), gz + rng.f(70, 120), ['#e8b8c8', '#f0d070', '#c8dc8a', '#c0aadc', '#f4a070'], { seed: 'mg' + i, gravel: '#e6dab8' });
  }
  for (const [ox, oz, rx, rz, s] of [[LAKE.x + C * 0.47, 2010, 420, 280, 21], [LAKE.x + C * 0.24, 2150, 260, 190, 22], [LAKE.x + C * 0.73, 1960, 300, 220, 23]]) {
    const b = plan.blob(ox, oz, rx, rz, { wobble: 0.2, lobes: 6, seed: s });
    plan.stroke(b, 30, { color: '#ece0bc', paved: 0.8, life: 0.9, clear: ['wood'] });
    plan.fill(b, { color: '#6fb5b4', water: 1, clear: ['life', 'paved', 'wood', 'rows'] });
    plan.fill(plan.blob(ox, oz, rx * 0.75, rz * 0.7, { wobble: 0.2, lobes: 5, seed: s + 9 }), { color: '#3f93a2', feather: 40 });
  }
  const lake = plan.blob(LAKE.x, LAKE.z, LAKE.rx, LAKE.rz, { wobble: 0.14, lobes: 7, seed: 31 });
  plan.stroke(lake, 54, { color: '#efe3c0', paved: 0.9, life: 1, clear: ['wood', 'rows'] });
  plan.fill(lake, { color: '#74b9b6', water: 1, clear: ['life', 'paved', 'rows', 'wood'] });
  plan.fill(plan.blob(LAKE.x, LAKE.z, LAKE.rx * 0.8, LAKE.rz * 0.72, { wobble: 0.2, lobes: 6, seed: 32 }), { color: '#3a8fa2', feather: 60 });
  plan.fill(plan.blob(ISLE.x, ISLE.z, 30, 24, { wobble: 0.15, seed: 5 }), { color: '#b9c484', clear: ['water'], life: 0.5 });
  plan.fill(plan.ellipse(ISLE.x, ISLE.z, 12, 12), { color: '#f2e8cc', paved: 1 });
  const shore = []; for (let i = 0; i <= 90; i++) { const a = (i / 90) * Math.PI * 2; shore.push([LAKE.x + Math.cos(a) * (LAKE.rx + 40), LAKE.z + Math.sin(a) * (LAKE.rz + 36)]); }
  plan.lamps(shore, 28);
  walkway(ring(1640, 20), 10); walkway(ring(2560, 20), 10);
  for (let i = 0; i < 24; i++) { const wx = (i / 24) * C + 60; if (Math.abs(((wx - LAKE.x + C * 1.5) % C) - C / 2) < LAKE.rx + 80) continue; walkway([[wx, 1600], [wx + 40, 2000], [wx - 30, 2580]], 7); }

  // ---- the hours: lawn marked out in plots, each one bought at the auction for an hour
  for (let i = 0; i < 12; i++) {
    const hx0 = (i / 12) * C + 30, hx1 = ((i + 1) / 12) * C - 30;
    plan.fill(plan.rect(hx0, 2600, hx1, 2900, 10), { color: '#b9c486', life: 1, clear: ['wood'] });
    for (let gx = hx0 + 16; gx < hx1 - 4; gx += 16) plan.stroke([[gx, 2604], [gx, 2896]], 0.9, { color: '#f7f3e4', cap: 'butt' });
    for (let gz = 2616; gz < 2896; gz += 16) plan.stroke([[hx0 + 4, gz], [hx1 - 4, gz]], 0.9, { color: '#f7f3e4', cap: 'butt' });
    walkway([[hx1 + 30, 2590], [hx1 + 30, 2910]], 12);
  }
  walkway(ring(2590, 0), 12); walkway(ring(2915, 0), 12);

  // ---- the back end: bright squares under lamps, where other drums keep dim woods
  for (let i = 0; i < 30; i++) {
    const bx0 = (i / 30) * C + 18, bx1 = ((i + 1) / 30) * C - 18;
    plan.fill(plan.rect(bx0, 2940, bx1, 3360, 12), { color: '#ecdfba', paved: 1, life: 0.9, clear: ['wood'] });
    plan.stroke(plan.rect(bx0 + 20, 2960, bx1 - 20, 3340, 10), 3, { color: '#dcc285' });
    const cx = (bx0 + bx1) / 2;
    plan.fill(plan.ellipse(cx, 3150, 30, 30), { color: rng.pick(['#e8a0b4', '#f2c860', '#c6a6e0']), clear: ['paved', 'life'] });
    plan.fill(plan.ellipse(cx, 3150, 20, 20), { color: '#76bfc0', water: 1 });
    plan.features.push({ type: 'square', x: cx, z: 3150 });
    for (let lz = 2970; lz < 3350; lz += 32) plan.lamps([[bx0 + 14, lz], [bx1 - 14, lz]], 30, { power: 0.7 });
    plan.avenue([[bx1 + 18, 2950], [bx1 + 18, 3350]], 7, 11, { color: '#86a058' });
  }
  plan.fill(plan.band(3360, L), { color: '#e3d5b0', paved: 1, life: 0.6, clear: ['wood'] });
}

// glasshouse rows as seen from far off: glass roofs, aisles between
function paintGlassRows(plan, x0, x1, segs, pitch, isGlasshouse) {
  for (const [z0, z1] of segs) {
    plan.fill(plan.rect(x0, z0 - 4, x1, z1 + 4), { color: '#dccfaa', paved: 1, life: isGlasshouse ? 0.9 : 0.5, clear: ['wood', 'rows'] });
    for (let hx = x0 + (isGlasshouse ? 0 : 3); hx + 8 <= x1 + 0.1; hx += pitch) {
      const c = isGlasshouse ? hx + 4 : hx + 4;
      plan.fill(plan.rect(c - 4, z0, c + 4, z1), { color: '#e6efea', clear: ['life', 'paved'] });
      plan.stroke([[c, z0 + 1], [c, z1 - 1]], 1.2, { color: '#f9fbf8' });
      plan.stroke([[c - 2, z0 + 2], [c - 2, z1 - 2]], 1.4, { color: '#a9c08e' });
      plan.stroke([[c + 2, z0 + 2], [c + 2, z1 - 2]], 1.4, { color: '#a4bb88' });
    }
  }
}

// lift pavilions with gilded domes, where cabs come up through the floor
function paintPavilions(plan) {
  const rng = makeRng('lovage-pav'), early = plan.sampler(1024, 512), pav = [];
  for (let z = 434; z < 3336; z += 170) for (let x = 0; x < C - 80; x += C / 55) {
    const px = x + rng.f(-28, 28), pz = z + rng.f(-28, 28), s = early(px, pz);
    if (s.water > 0.15) continue;
    if (px > GLASS.x0 - 30 && px < GLASS.x1 + 30 && pz < 820) continue;
    pav.push([px, pz]);
  }
  plan.dots(pav, 9, { color: '#e9dcb4', alpha: 0.9, paved: 1, clear: ['wood', 'rows'] });
  plan.dots(pav, 4.5, { color: '#e8bf5c' });
  return pav;
}

function pavilionGeo() {
  const g = new Geo();
  g.cyl(0, 0, 0, 7.4, 7.4, 0.4, 8, '#efe6d0', { smooth: false });
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; g.cyl(Math.cos(a) * 5.8, 0.4, Math.sin(a) * 5.8, 0.3, 0.24, 3.8, 6, GOLD, { emit: 0.12 }); }
  g.cyl(0, 0.4, 0, 2.4, 2.4, 3.6, 8, '#8f9a98', { smooth: false });
  g.cyl(0, 1.0, 0, 2.45, 2.45, 2.0, 8, '#fff0c8', { smooth: false, cap: false, emit: 1.2 });
  g.cyl(0, 4.2, 0, 7.9, 7.2, 0.55, 8, '#f8f0de', { smooth: false });
  g.lathe(0, 4.75, 0, [[7.0, 0], [6.7, 1.3], [5.7, 2.7], [4.0, 3.9], [2.0, 4.7], [0.6, 5.3], [0.0, 5.6]], 8, (k) => [GOLD, GOLD, '#f6cc62', '#f8d878', '#fbe39a', '#fff0c0'][k], { emit: 0.1 });
  g.cyl(0, 10.3, 0, 0.3, 0.04, 2.0, 5, GOLD, { emit: 0.3 });
  return g.build();
}

// a fountain in a square: a basin and a tall slow jet (at half a g a jet climbs twice as high)
function fountainGeo() {
  const g = new Geo();
  g.lathe(0, 0, 0, [[21.6, 0], [22.6, 0.7], [23.6, 0.7], [23.8, 0]], 24, '#f7f0e0');
  g.lathe(0, 0, 0, [[5.4, 0.2], [5.6, 1.4], [4.4, 1.6], [1.4, 2.4], [0.8, 3.6], [0, 3.8]], 10, (k) => (k < 2 ? '#f4ebd6' : GOLD), { emit: 0.05 });
  g.cyl(0, 3.6, 0, 0.55, 0.12, 15, 7, '#f2fbff', { emit: 0.9, cap: false });
  g.cyl(0, 3.6, 0, 0.9, 0.3, 6, 7, '#e8f6fb', { emit: 0.5, cap: false });
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.tube([[Math.cos(a) * 1.4, 2.6, Math.sin(a) * 1.4], [Math.cos(a) * 4, 5.2, Math.sin(a) * 4], [Math.cos(a) * 6.4, 4.0, Math.sin(a) * 6.4], [Math.cos(a) * 8.2, 0.3, Math.sin(a) * 8.2]], 0.16, 4, '#eaf8fc', { emit: 0.7 }); }
  return g.build();
}

// ---------------------------------------------------------------- the Glasshouse
function* buildGlasshouse(hollow) {
  const frame = hollow.frame, rng = makeRng('glasshouse');
  const fr = new Geo({ maxSeg: 16 }), gl = new Geo({ maxSeg: 16 }), crop = new Geo({ maxSeg: 16 }), table = new Geo({ maxSeg: 16 });
  const H = GLASS.half, EAVE = 2.7, RIDGE = 4.5;
  const diners = [], waiters = [];
  let n = 0;
  for (let k = -11; k <= 10; k++) {
    const cx = XG + GLASS.pitch * k + GLASS.pitch / 2, near = Math.abs(cx - XG) < 75;
    for (const [z0, z1] of GLASS.segs) {
      // the glass: sides, roof, gable ends
      gl.quad([cx - H, 0.4, z0], [cx - H, 0.4, z1], [cx - H, EAVE, z1], [cx - H, EAVE, z0], '#dcebe8', 0.05);
      gl.quad([cx + H, 0.4, z1], [cx + H, 0.4, z0], [cx + H, EAVE, z0], [cx + H, EAVE, z1], '#dcebe8', 0.05);
      gl.quad([cx - H, EAVE, z0], [cx - H, EAVE, z1], [cx, RIDGE, z1], [cx, RIDGE, z0], '#eaf4f2', 0.08);
      gl.quad([cx + H, EAVE, z1], [cx + H, EAVE, z0], [cx, RIDGE, z0], [cx, RIDGE, z1], '#eaf4f2', 0.08);
      for (const z of [z0, z1]) { gl.quad([cx - H, 0.4, z], [cx + H, 0.4, z], [cx + H, EAVE, z], [cx - H, EAVE, z], '#dcebe8', 0.05); gl.tri([cx - H, EAVE, z], [cx + H, EAVE, z], [cx, RIDGE, z], '#dcebe8', 0.05); }
      // the white frame
      fr.box(cx - H - 0.08, 0, z0, cx - H + 0.08, 0.4, z1, '#e9e4d8', { skip: 'b' });
      fr.box(cx + H - 0.08, 0, z0, cx + H + 0.08, 0.4, z1, '#e9e4d8', { skip: 'b' });
      fr.box(cx - H - 0.07, EAVE - 0.08, z0, cx - H + 0.07, EAVE + 0.06, z1, WHITE, { skip: 'b' });
      fr.box(cx + H - 0.07, EAVE - 0.08, z0, cx + H + 0.07, EAVE + 0.06, z1, WHITE, { skip: 'b' });
      fr.box(cx - 0.09, RIDGE - 0.1, z0, cx + 0.09, RIDGE + 0.08, z1, WHITE, { skip: 'b' });
      const bay = near ? 3.6 : 7.2;
      for (let z = z0; z <= z1 + 0.01; z += bay) {
        fr.box(cx - H - 0.06, 0.4, z - 0.05, cx - H + 0.06, EAVE, z + 0.05, WHITE, { skip: 'tb' });
        fr.box(cx + H - 0.06, 0.4, z - 0.05, cx + H + 0.06, EAVE, z + 0.05, WHITE, { skip: 'tb' });
        fr.tube([[cx - H, EAVE, z], [cx, RIDGE, z]], 0.06, 3, WHITE, { smooth: false });
        fr.tube([[cx + H, EAVE, z], [cx, RIDGE, z]], 0.06, 3, WHITE, { smooth: false });
      }
      // benches, and what grows on them
      const kind = ['straw', 'cuke', 'tom', 'radish', 'straw', 'cuke'][Math.floor(hash2(k + 40, z0, 7) * 6)];
      for (const s of [-1, 1]) {
        const bx = cx + s * 1.95;
        crop.box(bx - 0.85, 0, z0 + 1.2, bx + 0.85, 0.75, z1 - 1.2, '#ece7dc', { skip: 'b' });
        if (!near) { crop.box(bx - 0.7, 0.75, z0 + 1.4, bx + 0.7, kind === 'cuke' || kind === 'tom' ? 2.2 : 1.0, z1 - 1.4, kind === 'radish' ? '#7fa954' : '#6f9e4a', { skip: 'b' }); continue; }
        if (kind === 'cuke' || kind === 'tom') {
          for (let z = z0 + 1.4; z < z1 - 1.6; z += 3.2) {
            const g1 = ['#6c9c46', '#77a54c', '#649540', '#80aa52'][Math.floor(rng() * 4)];
            crop.box(bx - 0.3, 0.75, z, bx + 0.3, rng.f(2.2, 2.6), z + 3.0, g1, { skip: 'b' });
            for (let i = 0; i < 9; i++) {
              const fy = rng.f(0.95, 2.2), fz = z + rng.f(0.1, 2.8), side = rng.sign() * 0.31, sz = kind === 'tom' ? 0.07 : 0.05;
              const fc = kind === 'tom' ? rng.pick(['#e2402c', '#d8342a', '#f06a30']) : rng.pick(['#3f7a2c', '#f2d23a', '#3a7428']);
              const fh = kind === 'cuke' && fc !== '#f2d23a' ? 0.22 : sz;
              crop.quad([bx + side, fy - fh, fz + (side > 0 ? sz : -sz)], [bx + side, fy - fh, fz - (side > 0 ? sz : -sz)], [bx + side, fy + fh, fz - (side > 0 ? sz : -sz)], [bx + side, fy + fh, fz + (side > 0 ? sz : -sz)], fc);
            }
          }
        } else {
          for (let z = z0 + 1.6; z < z1 - 1.6; z += 0.75) for (const o of [-0.42, 0.42]) {
            const lg = kind === 'radish' ? rng.pick(['#86b25a', '#7aa950', '#92b862']) : rng.pick(['#5f9440', '#6a9c46', '#58893c']);
            crop.blob(bx + o, 0.86, z + rng.f(-0.1, 0.1), [0.34, kind === 'radish' ? 0.22 : 0.16, 0.32], 0, lg, { lump: 0.25, seed: n++ });
          }
          for (let z = z0 + 1.6; z < z1 - 1.6; z += 0.28) {
            if (rng() < 0.4) continue;
            const side = rng.sign(), fx = bx + side * 0.86, fy = rng.f(0.5, 0.72), q = 0.045;
            const fc = kind === 'radish' ? rng.pick(['#e0507a', '#f06a8a', '#ffffff']) : rng.pick(['#e8302a', '#d9282a', '#f2453a']);
            crop.quad([fx, fy - q, z + side * q], [fx, fy - q, z - side * q], [fx, fy + q, z - side * q], [fx, fy + q, z + side * q], fc);
          }
        }
      }
    }
    if ((k & 3) === 0) yield;
  }
  // the aisles: long tables, white cloths, cucumbers and strawberries, and the people eating between the rows
  for (let k = -9; k <= 9; k++) {
    const ax = XG + GLASS.pitch * k, rich = Math.abs(k) <= 4;
    for (const [z0, z1] of GLASS.segs) {
      for (const s of [-1, 1]) {
        for (let za = z0 + 2.5; za + 7 < z1 - 2; za += 8.6) {
          const tx0 = ax + s * 1.9, tx1 = ax + s * 2.8;
          table.box(Math.min(tx0, tx1), 0.32, za, Math.max(tx0, tx1), 0.76, za + 7, '#fbf8f1', { skip: 'b' });
          if (rich) {
            for (let pz = za + 0.5; pz < za + 6.7; pz += 0.85) {
              const pxo = ax + s * 2.1, pxi = ax + s * 2.6;
              for (const [ppx, c] of [[pxo, '#ffffff'], [pxi, '#ffffff']]) table.extrude([[ppx - 0.13, pz - 0.13], [ppx - 0.13, pz + 0.13], [ppx + 0.13, pz + 0.13], [ppx + 0.13, pz - 0.13]].reverse(), 0.765, 0.012, c, { noSides: true });
              if (rng() < 0.6) { const f = rng.pick(['#e2302a', '#76a84a', '#e85a7a', '#e2302a']); table.extrude([[pxo - 0.07, pz - 0.07], [pxo - 0.07, pz + 0.07], [pxo + 0.07, pz + 0.07], [pxo + 0.07, pz - 0.07]].reverse(), 0.77, 0.05, f); }
              if (rng() < 0.25) table.cyl(ax + s * 2.35, 0.76, pz + 0.4, 0.05, 0.04, 0.26, 5, '#d6eef0', { emit: 0.15 });
            }
          }
          const occ = rich ? 0.85 : 0.55;
          for (let dz = za + 0.6; dz < za + 6.8; dz += 0.85) {
            if (rng() < occ) diners.push({ p: [ax + s * 3.25, 0.42, dz], sit: true, yaw: -s * Math.PI / 2, color: rng.pick(NEW) });
            if (k !== 0 && rng() < occ) diners.push({ p: [ax + s * 1.45, 0.42, dz], sit: true, yaw: s * Math.PI / 2, color: rng.pick(NEW) });
          }
        }
      }
      if (k !== 0) for (let i = 0; i < 3; i++) waiters.push({ p: [ax + rng.f(-0.4, 0.4), 0, rng.f(z0 + 4, z1 - 4)], walk: rng.f(1.5, 4), color: '#f8f6f0' });
      else if (z0 > 600) waiters.push({ p: [ax, 0, (z0 + z1) / 2], walk: 3, color: '#f8f6f0' });
    }
    if ((k & 3) === 0) yield;
  }
  const glassMat = litMaterialFor(hollow, { transparent: true, opacity: 0.3, side: 'double', soft: 0 });
  hollow.add(fr.mesh(hollow.lit, frame));
  hollow.add(crop.mesh(hollow.lit, frame));
  hollow.add(table.mesh(hollow.lit, frame));
  const g = gl.mesh(glassMat, frame); g.renderOrder = 2; hollow.add(g);
  hollow.add(crowd(diners, hollow.walk, { frame, seed: 'diners' }));
  hollow.add(crowd(waiters, hollow.walk, { frame, seed: 'waiters', bob: 0.12 }));
  yield;
}

function litMaterialFor(hollow, opts) { return litMaterial(hollow.rig, { bend: hollow.frame, ...opts }); }

// ---------------------------------------------------------------- the squares near the flight, and the lake's rotunda
function* buildFloorThings(hollow, pav, low) {
  const frame = hollow.frame;
  const near = (x, z, r) => nearPath(low, x, z, C) < r;
  // gilded pavilions everywhere (they are small; the instances are culled by cell)
  const items = []; for (const q of pav) items.push({ p: [q[0], 0, q[1]], yaw: (q[0] * 0.37) % 6.28 });
  hollow.add(instances(pavilionGeo(), hollow.lit, items, { frame, cell: 1200 }));
  yield;
  const fItems = [];
  for (const f of hollow.plan.features) if (f.type === 'square' && near(f.x, f.z, 900)) fItems.push({ p: [f.x, 0, f.z], yaw: f.x * 0.1 });
  hollow.add(instances(fountainGeo(), hollow.lit, fItems, { frame, cell: 800 }));
  // the rotunda on the lake's island
  const g = new Geo({ maxSeg: 16 });
  g.cyl(ISLE.x, 0, ISLE.z, 13, 12.4, 1.2, 16, '#f4ecd8', { smooth: false });
  g.cyl(ISLE.x, 1.2, ISLE.z, 11.6, 11.4, 0.5, 16, '#efe2c2', { smooth: false });
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.cyl(ISLE.x + Math.cos(a) * 10, 1.7, ISLE.z + Math.sin(a) * 10, 0.55, 0.45, 8.5, 8, WHITE); g.cyl(ISLE.x + Math.cos(a) * 10, 10.0, ISLE.z + Math.sin(a) * 10, 0.75, 0.75, 0.5, 6, GOLD, { emit: 0.12 }); }
  g.cyl(ISLE.x, 10.2, ISLE.z, 11.4, 11.2, 1.6, 16, '#f7efdc', { smooth: false });
  g.lathe(ISLE.x, 11.8, ISLE.z, [[11.0, 0], [10.6, 2.2], [9.0, 4.6], [6.4, 6.6], [3.2, 7.8], [0.6, 8.2], [0, 8.3]], 16, (k) => [GOLD, GOLD, '#f6cc62', '#f8d878', '#fbe39a', '#fff2c8'][k], { emit: 0.12 });
  g.cyl(ISLE.x, 20, ISLE.z, 0.5, 0.05, 3.2, 6, GOLD, { emit: 0.4 });
  // a jetty out to it from the near shore
  g.box(ISLE.x + 24, 0.2, ISLE.z - 2, ISLE.x + 180, 0.6, ISLE.z + 2, '#d9c7a0', { skip: 'b' });
  hollow.add(g.mesh(hollow.lit, frame));
  const people = [];
  const rng = makeRng('rotunda');
  for (let i = 0; i < 46; i++) { const a = rng() * 6.28, r = rng.f(2, 17); people.push({ p: [ISLE.x + Math.cos(a) * r, r < 11 ? 1.7 : 0.2, ISLE.z + Math.sin(a) * r], walk: rng() < 0.5 ? rng.f(1, 3) : 0, color: rng.pick(NEW) }); }
  for (let i = 0; i < 30; i++) people.push({ p: [ISLE.x + rng.f(30, 175), 0.6, ISLE.z + rng.f(-1.2, 1.2)], walk: rng() < 0.6 ? 1.2 : 0, color: rng.pick(NEW) });
  hollow.add(crowd(people, hollow.walk, { frame, seed: 'rotunda' }));
  yield;
}

// people where the plan has life, near the flight, in new clothes
function* lovageFolk(hollow, near, R, density, max) {
  const cell = 4, dens = density * cell * cell / 100, spots = [];
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const p of near) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
  x0 -= R; x1 += R; z0 = Math.max(0, z0 - R); z1 = Math.min(L, z1 + R);
  const rng = makeRng('lovage-folk');
  let n = 0;
  for (let gz = Math.floor(z0 / cell); gz * cell < z1 && spots.length < max; gz++) {
    for (let gx = Math.floor(x0 / cell); gx * cell < x1; gx++) {
      const x = (gx + hash2(gx, gz, 5)) * cell, z = (gz + hash2(gx, gz, 9)) * cell;
      if (x > GLASS.x0 - 6 && x < GLASS.x1 + 6 && z > 440 && z < 805) continue;
      const s = hollow.at(x, z);
      if (s.water > 0.25 || s.life < 0.05) continue;
      const d = nearPath(near, x, z, C);
      if (d > R) continue;
      if (hash2(gx, gz, 13) > dens * s.life * (1 - (d / R) * (d / R))) continue;
      const r = hash2(gx, gz, 17);
      spots.push({ p: [((x % C) + C) % C, 0, z], walk: r < 0.4 ? 0 : 1.5 + 9 * hash2(gx, gz, 19), sit: r < 0.16, child: r > 0.86, color: rng.pick(NEW) });
    }
    if ((++n & 63) === 0) yield;
  }
  hollow.add(crowd(spots, hollow.walk, { frame: hollow.frame, bob: 0.16, speed: 0.95, seed: 'lovage-floor' }));
  return spots.length;
}

// ---------------------------------------------------------------- the wedding on the Third
// A figure with its arms up, holding the two halves of an apple cut crosswise.
function officiant(g, x, z, rot) {
  g.at(x, 0, z, rot);
  g.box(-0.16, 0, -0.1, 0.16, 0.9, 0.1, '#2a2a34');
  g.cyl(0, 0.0, 0, 0.42, 0.24, 1.42, 8, '#f4ead2', { smooth: false });
  g.blob(0, 1.58, 0, 0.13, 0, SKIN[2], { shadeBottom: 0.8 });
  for (const s of [-1, 1]) {
    g.tube([[s * 0.2, 1.36, 0], [s * 0.34, 1.7, 0.08], [s * 0.36, 2.02, 0.12]], 0.05, 4, '#f4ead2');
    g.blob(s * 0.36, 2.12, 0.14, [0.085, 0.085, 0.05], 0, '#c8382c');
    g.at(s * 0.36, 2.12, 0.18).rot('x', Math.PI / 2).cyl(0, 0, 0, 0.075, 0.075, 0.01, 10, '#fff6dc', { emit: 0.5 }).pop().pop();
  }
  g.pop();
}

// The ring stands at the rail turned RING.a from square, so the flight can come at it along the terrace and leave
// through it at a slant, out over the whole bright Hollow. u runs from the ring into the terrace, v across.
const RING = { a: 35 * Math.PI / 180, z: 1.5, y: 5.2, r: 4.5 };
const RD = [-Math.sin(RING.a), -Math.cos(RING.a)], RN = [Math.cos(RING.a), -Math.sin(RING.a)];
const ringUV = (u, v) => [-RD[0] * u + RN[0] * v, RING.z - RD[1] * u + RN[1] * v];

function* buildWedding(hollow, T, path) {
  const rng = makeRng('wedding');
  const g = new Geo({ maxSeg: 8 });
  const spots = [], dancers = [];
  // a gilded rail along the stretch of terrace the weddings use, open where the ring stands
  for (let x = -150; x <= 150; x += 2.4) { if (Math.abs(x) < 6) continue; g.cyl(x, 0, 0.4, 0.07, 0.07, 1.0, 4, WHITE); }
  for (const [a, b] of [[-150, -6], [6, 150]]) { g.box(a, 0.95, 0.28, b, 1.08, 0.52, GOLD, { emit: 0.12 }); g.box(a, 0, 0.25, b, 0.12, 0.55, '#e8dcc0'); }
  // poles along the rail, with bunting between
  const poles = []; for (let x = -146; x <= 146; x += 11.5) if (Math.abs(x) > 8) poles.push(x);
  for (const x of poles) { g.cyl(x, 0, 0.6, 0.09, 0.07, 5.6, 5, GOLD, { emit: 0.1 }); g.blob(x, 5.75, 0.6, 0.2, 0, GOLD, { emit: 0.3 }); }
  const flagCols = ['#e8644a', '#f2c050', '#ffffff', '#3c8fd6', '#d9476e', '#2aa596', '#f29e38', '#7d5bd0'];
  for (let i = 0; i < poles.length - 1; i++) {
    const a = poles[i], b = poles[i + 1];
    if (b - a > 12) continue;
    for (let u = 0.04; u < 0.97; u += 0.05) {
      const x = a + (b - a) * u, y = 5.35 - 1.3 * (1 - (2 * u - 1) * (2 * u - 1)), c = flagCols[Math.floor(u * 20 + i) % flagCols.length];
      g.tri([x - 0.22, y, 0.6], [x + 0.22, y, 0.6], [x, y - 0.5, 0.6], c, 0.1);
    }
  }
  // a pale floor for the wedding, laid over the terrace's beds
  g.floor(-24, 2.5, 100, 29.5, 0.02, '#f1e6c8');
  // the long table against the houses: cloth, plates, bowls, flowers, and the Sorrelers' gin
  const TZ = 26, TX0 = 8, TX1 = 40;
  g.box(TX0, 0.3, TZ - 0.6, TX1, 0.78, TZ + 0.6, '#fdfaf2');
  for (let x = TX0 + 0.6; x < TX1 - 0.4; x += 0.9) {
    for (const s of [-1, 1]) {
      g.cyl(x, 0.78, TZ + s * 0.35, 0.14, 0.14, 0.01, 7, '#ffffff');
      if (rng() < 0.9) spots.push({ p: [x, 0.45, TZ + s * 1.05], sit: true, yaw: s > 0 ? Math.PI : 0, color: rng.pick(NEW) });
    }
    if (rng() < 0.35) g.cyl(x + 0.4, 0.78, TZ + rng.f(-0.15, 0.15), 0.045, 0.04, 0.32, 6, '#d8eef2', { emit: 0.25 });
    if (rng() < 0.25) g.blob(x + 0.45, 0.85, TZ, [0.16, 0.08, 0.16], 0, rng.pick(['#e2302a', '#f2c050', '#7ab04a', '#e85a7a']));
  }
  for (let x = TX0 + 2; x < TX1; x += 5) { g.cyl(x, 0.78, TZ, 0.11, 0.06, 0.5, 6, GOLD, { emit: 0.2 }); g.blob(x, 1.42, TZ, [0.3, 0.26, 0.3], 0, rng.pick(['#f4a6b8', '#ffffff', '#f2c860', '#e8644a']), { shadeBottom: 0.85 }); }
  // the new sofa on a dais where everyone can see it, and the 110-year-old chair beside it
  const SX = 47, SZ = 25.5;
  g.box(SX - 3.2, 0, SZ - 2.0, SX + 5.2, 0.25, SZ + 1.8, '#f6ecd2');
  g.at(SX, 0.25, SZ, Math.PI);
  g.box(-1.15, 0.12, -0.45, 1.15, 0.48, 0.45, '#1f8e8a');
  g.box(-1.15, 0.48, 0.22, 1.15, 1.0, 0.45, '#1c8580');
  g.box(-1.3, 0.12, -0.45, -1.05, 0.74, 0.45, '#1a7d78'); g.box(1.05, 0.12, -0.45, 1.3, 0.74, 0.45, '#1a7d78');
  g.box(-1.0, 0.48, -0.4, -0.02, 0.62, 0.22, '#28a29c'); g.box(0.02, 0.48, -0.4, 1.0, 0.62, 0.22, '#28a29c');
  for (const [lx, lz] of [[-1.2, -0.38], [1.2, -0.38], [-1.2, 0.38], [1.2, 0.38]]) g.cyl(lx, 0, lz, 0.05, 0.04, 0.12, 5, GOLD, { emit: 0.3 });
  g.box(-1.16, 0.9, 0.2, 1.16, 0.96, 0.47, GOLD, { emit: 0.25 });
  g.pop();
  g.at(SX + 2.9, 0.25, SZ - 0.1, Math.PI - 0.3);
  g.box(-0.36, 0.16, -0.34, 0.36, 0.48, 0.34, '#7a7c3c');
  g.box(-0.36, 0.48, 0.2, 0.36, 1.12, 0.34, '#727438');
  g.box(-0.42, 0.3, -0.34, -0.32, 0.66, 0.34, '#6b4a2e'); g.box(0.32, 0.3, -0.34, 0.42, 0.66, 0.34, '#6b4a2e');
  for (const [lx, lz] of [[-0.32, -0.3], [0.32, -0.3], [-0.32, 0.3], [0.32, 0.3]]) g.cyl(lx, 0, lz, 0.04, 0.035, 0.16, 5, '#5a3c24');
  g.pop();
  for (let i = 0; i < 24; i++) { const a = rng.f(-1.3, 1.3), r = rng.f(3.6, 7); spots.push({ p: [SX + 1.2 + Math.sin(a) * r, 0, SZ - 2.5 - Math.abs(Math.cos(a)) * r * 0.7], walk: rng() < 0.3 ? 0.8 : 0, yaw: Math.PI + rng.f(-0.6, 0.6), color: rng.pick(NEW) }); }
  // the ceremony: guests on gilded chairs facing the ring, the couple, and the officiant holding up the apple
  const face = Math.atan2(RD[0], RD[1]);
  for (let row = 0; row < 6; row++) for (let i = 0; i < 14; i++) {
    const v = (i - 6.5) * 1.15 + (i >= 7 ? 0.9 : -0.9), u = 5.5 + row * 1.5;
    const [cx, cz] = ringUV(u, v);
    g.at(cx, 0, cz, face);
    g.box(-0.24, 0.42, -0.22, 0.24, 0.47, 0.22, GOLD, { emit: 0.1 });
    g.box(-0.24, 0.47, -0.26, 0.24, 1.0, -0.2, GOLD, { emit: 0.1 });
    g.pop();
    if (rng() < 0.85) spots.push({ p: [cx, 0.45, cz], sit: true, yaw: face, color: rng.pick(NEW) });
  }
  for (let i = 0; i < 26; i++) { const [cx, cz] = ringUV(rng.f(15, 18.5), rng.f(-10, 10)); spots.push({ p: [cx, 0, cz], yaw: face + rng.f(-0.3, 0.3), color: rng.pick(NEW) }); }
  const [ox, oz] = ringUV(2.4, 0);
  officiant(g, ox, oz, face + Math.PI);
  // Mira and Tobiah, a half each
  const [mx, mz] = ringUV(2.9, -1.3), [tx, tz] = ringUV(2.9, 1.3);
  g.at(mx, 0, mz, face + Math.PI + 0.5); g.cyl(0, 0, 0, 0.62, 0.2, 1.4, 10, '#fbf4e2'); g.blob(0, 1.56, 0, 0.13, 0, SKIN[0]); g.blob(0, 1.62, -0.06, [0.14, 0.12, 0.12], 0, '#4a2e1c'); g.pop();
  g.at(tx, 0, tz, face + Math.PI - 0.5); g.box(-0.16, 0, -0.1, 0.16, 0.9, 0.1, '#1d2232'); g.cyl(0, 0.82, 0, 0.24, 0.19, 0.64, 6, '#e0b04a'); g.blob(0, 1.6, 0, 0.13, 0, SKIN[3]); g.pop();
  // flowers in urns along the rail
  for (let x = -140; x <= 140; x += 7.2) {
    if (Math.abs(x) < 9) continue;
    g.cyl(x, 0, 2.2, 0.35, 0.5, 0.8, 7, '#efe4cc');
    g.blob(x, 1.1, 2.2, [0.65, 0.5, 0.65], 0, rng.pick(['#e8708a', '#f4c040', '#ffffff', '#f49a62', '#c07ad0']), { lump: 0.3, seed: Math.round(x), shadeBottom: 0.85 });
  }
  // the reel: two rings of young people leaping, every leap a hand's width spinward
  const DX = 74, DZ = 12;
  g.cyl(DX, 0, DZ, 8.4, 8.4, 0.05, 24, '#f8e8bc');
  for (let i = 0; i < 14; i++) dancers.push({ p: [DX, 0, DZ], walk: [6.2, 1.05, (i / 14) * Math.PI * 2, 0.7], color: rng.pick(NEW) });
  for (let i = 0; i < 7; i++) dancers.push({ p: [DX, 0, DZ], walk: [3.3, -0.75, (i / 7) * Math.PI * 2, 0.62], color: rng.pick(NEW) });
  for (let i = 0; i < 44; i++) { const a = rng() * 6.28, r = rng.f(9.4, 12.5); spots.push({ p: [DX + Math.cos(a) * r, 0, DZ + Math.sin(a) * r * 0.75], yaw: Math.atan2(-Math.cos(a), -Math.sin(a)), color: rng.pick(NEW) }); }
  // other weddings further along the Third, each with its own ring and table
  for (const [cx, w] of [[-58, 30], [-112, 26], [118, 26], [142, 14]]) {
    g.box(cx - w / 2, 0.3, 15.4, cx + w / 2, 0.78, 16.6, '#fdfaf2');
    for (let x = cx - w / 2 + 0.5; x < cx + w / 2; x += 0.9) for (const s of [-1, 1]) if (rng() < 0.85) spots.push({ p: [x, 0.45, 16 + s * 1.05], sit: true, yaw: s > 0 ? Math.PI : 0, color: rng.pick(NEW) });
    const pts = []; for (let i = 0; i <= 28; i++) { const a = (i / 28) * Math.PI * 2; pts.push([cx + Math.cos(a) * 3.2, 3.4 + Math.sin(a) * 3.2, 1.4]); }
    g.tube(pts, 0.16, 5, GOLD, { emit: 0.15 });
    for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2; g.blob(cx + Math.cos(a) * 3.2, 3.4 + Math.sin(a) * 3.2, 1.4, 0.26, 0, rng.pick(['#f4a6b8', '#ffffff', '#f2c860']), { shadeBottom: 0.9, emit: 0.1 }); }
    for (let i = 0; i < 40; i++) spots.push({ p: [cx + rng.f(-9, 9), 0, rng.f(4, 12)], walk: rng() < 0.4 ? rng.f(0.6, 2) : 0, color: rng.pick(NEW) });
  }
  yield;
  T.add(g.mesh(T.lit, T.frame));
  T.add(crowd(spots, T.walk, { frame: T.frame, seed: 'guests', bob: 0.18, speed: 0.6 }));
  const bySkin = new Map();
  for (const it of dancers) { const skin = rng.pick(SKIN); let a = bySkin.get(skin); if (!a) bySkin.set(skin, a = []); a.push({ ...it, scale: rng.f(0.92, 1.06) }); }
  const reel = [];
  for (const [skin, list] of bySkin) for (const m of instances(figureGeo(skin, 'stand'), T.walk, list, { frame: T.frame, walk: true })) { T.add(m); reel.push(m); }
  // the apple's two halves catch the line: the only star most people here will see
  const hand = (s) => { const [hx, hz] = ringUV(2.4 + 0.2, s * 0.36); return { p: [hx, 2.12, hz], color: '#fff2c8', power: 2.4, size: 0.2 }; };
  T.glow([hand(-1), hand(1)], { minPx: 1.2, maxPx: 40 });
  yield;

  // the ring the couple were married under: the way out
  const R = path.exit.radius, ring = new Geo();
  const loc = T.frame.local(path.exit.pos, new Vector3());
  const floorY = -loc.y, RR = R + 0.45;
  const hoop = []; for (let i = 0; i <= 72; i++) { const a = (i / 72) * Math.PI * 2; hoop.push([Math.cos(a) * RR, Math.sin(a) * RR, 0]); }
  ring.tube(hoop, 0.28, 8, GOLD, { emit: 0.2 });
  ring.tube(hoop.map((q) => [q[0] * 1.075, q[1] * 1.075, 0.04]), 0.09, 5, '#fff0b8', { emit: 0.35 });
  const fcols = ['#ffffff', '#fbe0e8', '#f4a6b8', '#f2c860', '#fff4d6', '#ef7a5a', '#ffffff', '#f8c8d8'];
  for (let i = 0; i < 150; i++) {
    const a = (i / 150) * Math.PI * 2 + rng.f(-0.02, 0.02), up = Math.max(0, Math.sin(a));
    if (rng() > 0.45 + 0.55 * up) continue;
    const r = RR + rng.f(-0.15, 0.4);
    for (let k = 0; k < 2; k++) ring.blob(Math.cos(a) * r + rng.f(-0.18, 0.18), Math.sin(a) * r + rng.f(-0.18, 0.18), rng.f(-0.32, 0.32), rng.f(0.13, 0.24), 0, rng.pick(fcols), { lump: 0.2, seed: i * 5 + k, shadeBottom: 0.9, emit: 0.12 });
    if (rng() < 0.4) ring.blob(Math.cos(a) * (r + 0.1), Math.sin(a) * (r + 0.1), rng.f(-0.3, 0.3), [0.22, 0.08, 0.14], 0, '#7fae4e', { seed: i });
  }
  // garlands hanging inside the top of the ring, and a plinth down to the terrace floor
  for (const [a0, a1] of [[0.45, 1.2], [1.2, 1.94], [1.94, 2.69]]) {
    const pts = []; for (let u = 0; u <= 1.001; u += 0.1) { const a = a0 + (a1 - a0) * u; pts.push([Math.cos(a) * (RR - 0.1), Math.sin(a) * (RR - 0.1) - 0.6 * Math.sin(u * Math.PI), 0.12]); }
    ring.tube(pts, 0.08, 5, '#86b452');
    for (const q of pts) ring.blob(q[0], q[1] - 0.08, q[2], 0.13, 0, rng.pick(['#ffffff', '#f4a6b8', '#f2c860']), { shadeBottom: 0.9, emit: 0.1 });
  }
  ring.cyl(0, floorY, 0, 1.5, 1.1, 0.4, 8, '#f4ead2', { smooth: false });
  const rm = ring.mesh(hollow.plain);
  rm.position.copy(path.exit.pos); rm.quaternion.copy(path.exit.quat);
  hollow.add(rm);
  return reel;
}

// ---------------------------------------------------------------- the world
export const lovageNoon = {
  id: 'lovage-noon',
  title: 'Noon at six', drum: 'Lovage', row: 'Herb Row', kind: 'a steady drum', light: 0.0,
  line: 'Six in the evening and the sunline still at full noon. They cut an apple crosswise and held up the star, and the young ones danced a reel round the terrace a hand\'s width at a time.',
  tone: '#f3c25c', source: 'ashgrove.md (Day three: Lovage), eating-out.md (The Glasshouse)',
  sound: { root: 52, scale: 'major', pad: 0.45, air: 0.2, water: 0.25, crowd: 0.6, bells: 0.35, bright: 0.85 },
  *build(ctx) {
    const plan = new Plan(ctx.q.plan);
    paintLovage(plan);
    yield;
    const pav = paintPavilions(plan);
    yield;
    const hollow = yield* buildHollow(ctx, {
      seed: 'lovage', plan, pavilions: false,
      light: { sun: '#fff3d8', sunPower: 1.15, amb: '#f0dcb0', ambPower: 0.36, bounce: '#d8c070', bouncePower: 0.3, air: '#fff1d2', airDensity: 0.00008, ground: '#ffd890', groundPower: 0.0 },
      sunline: { power: 64, halo: 300, haloPower: 0.04 },
      ground: { rows: [7, 6], canopy: '#8fb058', blossom: '#fbeef0', fruit: '#d8402c', people: 1.0, lamp: 0.3, lampColor: '#ffd68a', sunRod: 64, stripes: 0.08, grain: 0.18 },
      front: { crowd: 0.3, lit: 0.04, houseMix: 0.6, stone: '#f6ead0', stone2: '#ecd6a6', houses: ['#f3d9a0', '#e8c27a', '#fff1d6', '#d9b27c', '#f0e0b8', '#e9b968'], awning: '#d8a23a', gardenColor: '#86ad57', pave: '#efe2c2', track: '#fff4dc' },
      back: { crowd: 0.35, lit: 0.04, houseMix: 0.6, stone: '#f6ead0', stone2: '#ecd6a6', houses: ['#f3d9a0', '#e8c27a', '#fff1d6', '#d9b27c', '#f0e0b8', '#e9b968'], awning: '#d8a23a', gardenColor: '#86ad57', pave: '#efe2c2', track: '#fff4dc', tiers: { 9: { crowd: 1, garden: 1 }, 14: { crowd: 0.6 }, 24: { crowd: 0.4 } } },
    });
    yield;
    const scene = new Scene();
    scene.add(hollow.group);
    const T = hollow.terrace(1, TIERS.third, (XA / 1500) * 180 / Math.PI);
    const k = 1500 / T.floorR, tz = T.frame.z0;
    const th = (x, y, z) => [XA + x * k, T.y + y, tz + z];
    // out of the Glasshouse's aisle, up over its roofs and the squares, low across the lake along the line's reflection,
    // up the back wall to the Third, along the wedding and out through the ring at the rail
    const path = makePath([
      { t: 0, p: [XG, 2.2, 462] },
      { t: 6, p: [XG, 3.2, 482], look: [XG + 30, 140, 900] },
      { t: 11, p: [XG + 4, 16, 545], look: [XG + 30, 10, 900] },
      { t: 16, p: [XG + 20, 48, 740], look: [XG + 120, 0, 1150] },
      { t: 22, p: [XG + 70, 72, 1120], look: [XG + 950, 1150, 1400] },
      { t: 28, p: [XG + 130, 45, 1600], look: [XG + 190, 0, 2050] },
      { t: 34, p: [XG + 190, 18, 2120], look: [XG + 230, 30, 3100] },
      { t: 40, p: [XG + 240, 50, 2620], look: th(60, 0, 0) },
      { t: 45, p: [XA + 140, 200, 2990], look: th(50, 5, 10) },
      { t: 50, p: th(110, -150, -100), look: th(40, 4, 10) },
      { t: 54.5, p: th(86, 12, -5), look: th(30, 2, 14) },
      { t: 58.5, p: th(42, 7.5, 7), look: th(0, 4, 6) },
      { t: 62, p: th(9, 5.6, 9.5), look: th(0, 5.2, -20) },
      { t: 63.8, p: th(0.6, 5.2, 4.5) },
      { t: 65, p: th(0, 5.2, -1.5) },
    ], { frame: hollow.frame, entryRadius: 1.8, exitRadius: 4.5 });
    yield;
    yield* buildGlasshouse(hollow);
    const pts = path.points(0.5), low = pts.filter((q) => q.y < 260);
    yield* buildFloorThings(hollow, pav, low);
    const reel = yield* buildWedding(hollow, T, path, ctx);
    yield* scatterTrees(hollow, { near: low, radius: 180, max: 26000 * ctx.density, wood: [{ kind: 'round', weight: 3 }, { kind: 'poplar', weight: 1 }, { kind: 'pear', weight: 1, tint: [1.1, 1.08, 0.9] }] });
    yield* lovageFolk(hollow, low.filter((q) => q.z > 700), 230, 1.6 * ctx.density, 9000);
    const drift = 0.075 / T.floorR;            // a hand's width spinward every leap
    return {
      scene, path, hollow, near: 0.4, far: 9000,
      look: { exposure: 0.95, bloom: 0.3, threshold: 0.95, saturation: 1.06, contrast: 1.04, lift: [0.012, 0.008, 0.0], gain: [1.03, 1.0, 0.93], vignette: 0.4 },
      portal: { rim: false, mist: '#fff1c8' },
      update(t) { for (const m of reel) m.rotation.z = t * drift; },
    };
  },
};
