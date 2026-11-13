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
// the end walls in Lovage gold, windows dark at noon
const WALL = { crowd: 0.3, lit: 0, houseMix: 0.3, stone: '#f4e8cc', stone2: '#ecd8ac', houses: ['#f3d9a0', '#e8c890', '#fff1d6', '#e2c08c', '#f0e0b8', '#ecc47a'], glass: '#8a9ea0', awning: '#d8a23a', gardenColor: '#98b066', pave: '#efe2c2', track: '#fff4dc' };

// ---------------------------------------------------------------- the plan
// Shapes of one kind are gathered into one path and painted in one go: the plan queues every call, and a few hundred
// calls settle much faster than a few thousand.
const gather = () => { const m = new Map(); m.put = (key, shape) => { let p = m.get(key); if (!p) m.set(key, p = new Path2D()); p.addPath(shape); return m; }; return m; };
function aveDots(out, points, side, spacing) {
  let carry = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 1e-6) continue;
    const nx = -(b[1] - a[1]) / len, nz = (b[0] - a[0]) / len;
    let d = carry;
    while (d < len) { const t = d / len, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; out.push([x + nx * side, z + nz * side], [x - nx * side, z - nz * side]); d += spacing; }
    carry = d - len;
  }
  return out;
}

// soft patches of colour over the land, each a radial gradient (the kit's mottle blurs every patch, which is slow)
function softMottle(plan, colors, count, size, alpha, seed) {
  const rng = makeRng(seed), list = [];
  for (let i = 0; i < count; i++) { const s = size * rng.f(0.5, 1.5); list.push([rng.f(0, C), rng.f(0, L), s, rng.f(0.5, 1.2), rng.f(0, 3.14), alpha * rng.f(0.4, 1), rng.pick(colors)]); }
  plan.layer('alb', (cx) => {
    for (const [x, z, s, k, rot, a, c] of list) {
      cx.save(); cx.translate(x, z); cx.rotate(rot); cx.scale(1, k);
      const g = cx.createRadialGradient(0, 0, 0, 0, 0, s);
      g.addColorStop(0, c); g.addColorStop(1, c + '00');
      cx.globalAlpha = a; cx.fillStyle = g; cx.fillRect(-s, -s, 2 * s, 2 * s);
      cx.restore();
    }
  });
}

function paintLovage(plan) {
  const rng = makeRng('lovage-plan');
  plan.fill(plan.band(0, L), { color: '#a9b47c', life: 0.3 });
  softMottle(plan, ['#b2bb84', '#9fae74', '#b8bc88', '#a2b070', '#bebf8c', '#acb67a'], 360, 170, 0.45, 'lovage-lawn');
  const walks = gather(), aves = [];
  const walk = (pts, w) => walks.put(w, plan.line(pts));
  const ring = (z, wob, n = 120) => { const a = []; for (let i = 0; i <= n; i++) a.push([(i / n) * C, z + Math.sin(i * 0.37 + z) * wob]); return a; };
  const paintWalks = (life = 0.8) => { for (const [w, p] of walks) plan.stroke(p, w, { color: '#e9dcb8', paved: 0.9, life, clear: ['wood', 'rows'] }); walks.clear(); };
  const flowers = ['#e8a0b4', '#f2c860', '#d8789a', '#c6a6e0', '#f49a62', '#e7e2f0'];

  // ---- the front edge: strips rented at auction, at the edge of the line's light
  plan.fill(plan.band(374, 430), { color: '#e7d9b4', paved: 1, life: 0.5, clear: ['wood'] });
  const glass = { base: new Path2D(), roof: new Path2D(), ridge: new Path2D(), green: new Path2D() };
  const orch = new Path2D(), herbs = gather(), beds = new Path2D(), plots = gather();
  const hcols = ['#b4a5d0', '#a9b98e', '#e9bd52', '#93ab6a', '#d79a9a', '#c9c4e0'];
  let x = GLASS.x1 + 12;
  while (x < GLASS.x0 + C - 12) {
    const w = Math.min(rng.f(150, 360), GLASS.x0 + C - 12 - x), kind = rng.pick(['glass', 'orchard', 'herbs', 'orchard', 'glass', 'beds']);
    const x1 = x + w;
    if (w > 60) {
      if (kind === 'glass') glassRows(plan, glass, x, x1, [[452, 620], [628, 796]], 15);
      else if (kind === 'orchard') orch.addPath(plan.rect(x, 452, x1, 796, 6));
      else if (kind === 'herbs') { for (let s = x; s < x1 - 3; s += 7) herbs.put(hcols[Math.floor((s - x) / 7) % hcols.length], plan.rect(s, 456, Math.min(s + 4.5, x1), 792)); }
      else { beds.addPath(plan.rect(x, 452, x1, 796, 6)); for (let s = x + 6; s < x1 - 6; s += 12) plots.put(rng.pick(['#8fab62', '#a4b86e', '#7e9d58', '#b9b26a']), plan.rect(s, 460, s + 8, 788, 3)); }
    }
    walk([[x1 + 6, 440], [x1 + 6, 810]], 10);
    x = x1 + 12;
  }
  plan.fill(orch, { color: '#9db06a', rows: 1, clear: ['life'] });
  for (const [c, p] of herbs) plan.fill(p, { color: c, life: 0.25 });
  plan.fill(beds, { color: '#c9bf9a', paved: 0.4, life: 0.4 });
  for (const [c, p] of plots) plan.fill(p, { color: c });
  const gh = { base: new Path2D(), roof: glass.roof, ridge: glass.ridge, green: glass.green };
  glassRows(plan, gh, GLASS.x0, GLASS.x1, GLASS.segs, GLASS.pitch);
  plan.fill(glass.base, { color: '#dccfaa', paved: 1, life: 0.5, clear: ['wood', 'rows'] });
  plan.fill(gh.base, { color: '#dccfaa', paved: 1, life: 0.9, clear: ['wood', 'rows'] });
  plan.fill(glass.roof, { color: '#e6efea', clear: ['life', 'paved'] });
  plan.stroke(glass.ridge, 1.2, { color: '#f9fbf8' });
  plan.stroke(glass.green, 1.4, { color: '#a7be8b' });
  walk(ring(822, 0), 14);
  paintWalks(0.6);

  // ---- the bright squares: three rows right round the floor
  const px = C / SQN;
  const sq = { pave: new Path2D(), ring1: new Path2D(), ring2: new Path2D(), diag: new Path2D(), rim: new Path2D(), pool: new Path2D(), deep: new Path2D(), lawn: new Path2D(), cross: new Path2D() };
  const border = gather(), corner = gather();
  for (let j = 0; j < SQZ.length; j++) {
    const [z0, z1] = SQZ[j];
    for (let i = 0; i < SQN; i++) {
      const x0 = i * px + 24, x1 = (i + 1) * px - 24, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
      if (hash2(i, j, 3) < 0.22 && Math.abs(mx - XG) > 400) {
        // a lawn instead, with a round bed and two paths across it
        sq.lawn.addPath(plan.rect(x0, z0, x1, z1, 16));
        sq.cross.addPath(plan.line([[x0 + 8, mz], [x1 - 8, mz]])); sq.cross.addPath(plan.line([[mx, z0 + 8], [mx, z1 - 8]]));
        corner.put(rng.pick(flowers), plan.ellipse(mx, mz, 26, 26));
        for (const [qx, qz] of [[x0 + 45, z0 + 45], [x1 - 45, z0 + 45], [x0 + 45, z1 - 45], [x1 - 45, z1 - 45]]) border.put(rng.pick(flowers), plan.rect(qx - 26, qz - 26, qx + 26, qz + 26, 6));
        continue;
      }
      sq.pave.addPath(plan.rect(x0, z0, x1, z1, 18));
      sq.ring1.addPath(plan.rect(x0 + 30, z0 + 30, x1 - 30, z1 - 30, 10));
      sq.ring2.addPath(plan.rect(x0 + 52, z0 + 52, x1 - 52, z1 - 52, 8));
      sq.diag.addPath(plan.line([[x0 + 10, z0 + 10], [x1 - 10, z1 - 10]])); sq.diag.addPath(plan.line([[x1 - 10, z0 + 10], [x0 + 10, z1 - 10]]));
      border.put(rng.pick(flowers), plan.rect(x0 + 9, z0 + 9, x1 - 9, z1 - 9, 10));
      for (const [qx, qz] of [[x0 + 36, z0 + 36], [x1 - 36, z0 + 36], [x0 + 36, z1 - 36], [x1 - 36, z1 - 36]]) corner.put(rng.pick(flowers), plan.ellipse(qx, qz, 9, 9));
      sq.rim.addPath(plan.ellipse(mx, mz, 24, 24)); sq.pool.addPath(plan.ellipse(mx, mz, 21, 21)); sq.deep.addPath(plan.ellipse(mx, mz, 12, 12));
      plan.features.push({ type: 'square', x: mx, z: mz });
    }
    for (let i = 0; i < SQN; i++) { walk([[i * px, z0 - 6], [i * px, z1 + 6]], 9); aveDots(aves, [[i * px, z0], [i * px, z1]], 9, 11); }
  }
  plan.fill(sq.lawn, { color: '#b0bd80', life: 0.8, clear: ['wood'] });
  plan.stroke(sq.cross, 6, { color: '#e6dab8', paved: 0.6, life: 0.6 });
  plan.fill(sq.pave, { color: '#efe2bf', paved: 1, life: 0.95, clear: ['wood', 'rows'] });
  plan.stroke(sq.ring1, 3, { color: '#e2c88e' });
  plan.stroke(sq.ring2, 2, { color: '#e6d3a0' });
  plan.stroke(sq.diag, 4, { color: '#e4cf98' });
  for (const [c, p] of border) plan.stroke(p, 6, { color: c, clear: ['paved', 'life'] });
  for (const [c, p] of corner) plan.fill(p, { color: c, clear: ['paved', 'life'] });
  plan.fill(sq.rim, { color: '#f7f0de', clear: ['life'] });
  plan.fill(sq.pool, { color: '#76bfc0', water: 1, clear: ['life', 'paved'] });
  plan.fill(sq.deep, { color: '#4aa2ae' });
  for (const z of [845, 1072, 1327, 1582]) { const r = ring(z, 0, 160); walk(r, 12); aveDots(aves, r, 11, 12); }
  paintWalks();
  plan.dots(aves, 4.2, { color: '#87a159', wood: 1 });
  aves.length = 0;

  // ---- the middle: the lake, lawns, gardens and clumps elsewhere round
  const clumps = gather();
  for (let i = 0; i < 700; i++) {
    const cx = rng.f(0, C), cz = rng.f(1640, 2560), r = rng.f(10, 36);
    if (Math.hypot((cx - LAKE.x) / (LAKE.rx + 160), (cz - LAKE.z) / (LAKE.rz + 140)) < 1) continue;
    clumps.put(rng.pick(['#7d9c55', '#86a45c', '#93ab62']), plan.blob(cx, cz, r, r * rng.f(0.6, 1.1), { wobble: 0.3, lobes: 4, seed: i + 1, n: 24 }));
  }
  for (const [c, p] of clumps) plan.fill(p, { color: c, wood: 1, clear: ['life', 'rows'] });
  const gd = { hedge: new Path2D(), gravel: new Path2D() }, gbeds = gather();
  for (let i = 0; i < 26; i++) {
    const gx = rng.f(0, C), gz = rng.f(1680, 2440), w = rng.f(90, 170), h = rng.f(70, 120);
    if (Math.abs(((gx - LAKE.x + C * 1.5) % C) - C / 2) < LAKE.rx + 260) continue;
    gd.hedge.addPath(plan.rect(gx, gz, gx + w, gz + h, 4)); gd.gravel.addPath(plan.rect(gx + 3, gz + 3, gx + w - 3, gz + h - 3, 3));
    for (const [qx, qz] of [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]]) gbeds.put(rng.pick(flowers), plan.rect(gx + w * qx - w * 0.19, gz + h * qz - h * 0.19, gx + w * qx + w * 0.19, gz + h * qz + h * 0.19, 3));
  }
  plan.fill(gd.hedge, { color: '#4f7a44', clear: ['wood', 'rows', 'life'] });
  plan.fill(gd.gravel, { color: '#e6dab8', paved: 0.6, life: 0.5 });
  for (const [c, p] of gbeds) plan.fill(p, { color: c, clear: ['paved', 'life'] });
  for (const [ox, oz, rx, rz, s] of [[LAKE.x + C * 0.47, 2010, 420, 280, 21], [LAKE.x + C * 0.24, 2150, 260, 190, 22], [LAKE.x + C * 0.73, 1960, 300, 220, 23]]) {
    const b = plan.blob(ox, oz, rx, rz, { wobble: 0.2, lobes: 6, seed: s });
    plan.stroke(b, 30, { color: '#ece0bc', paved: 0.8, life: 0.9, clear: ['wood'] });
    plan.fill(b, { color: '#68a8a8', water: 1, clear: ['life', 'paved', 'wood', 'rows'] });
    plan.fill(plan.blob(ox, oz, rx * 0.85, rz * 0.8, { wobble: 0.2, lobes: 5, seed: s + 9 }), { color: '#4c92a0' });
    plan.fill(plan.blob(ox, oz, rx * 0.65, rz * 0.6, { wobble: 0.2, lobes: 5, seed: s + 9 }), { color: '#2f7d8e' });
  }
  const lake = plan.blob(LAKE.x, LAKE.z, LAKE.rx, LAKE.rz, { wobble: 0.14, lobes: 7, seed: 31 });
  plan.stroke(lake, 54, { color: '#efe3c0', paved: 0.9, life: 1, clear: ['wood', 'rows'] });
  plan.fill(lake, { color: '#6aa8a8', water: 1, clear: ['life', 'paved', 'rows', 'wood'] });
  plan.fill(plan.blob(LAKE.x, LAKE.z, LAKE.rx * 0.88, LAKE.rz * 0.84, { wobble: 0.2, lobes: 6, seed: 32 }), { color: '#4f96a2' });
  plan.fill(plan.blob(LAKE.x, LAKE.z, LAKE.rx * 0.74, LAKE.rz * 0.66, { wobble: 0.2, lobes: 6, seed: 33 }), { color: '#357f8f' });
  plan.fill(plan.blob(LAKE.x, LAKE.z, LAKE.rx * 0.55, LAKE.rz * 0.45, { wobble: 0.2, lobes: 6, seed: 34 }), { color: '#2b7486' });
  plan.fill(plan.blob(ISLE.x, ISLE.z, 30, 24, { wobble: 0.15, seed: 5 }), { color: '#b9c484', clear: ['water'], life: 0.5 });
  plan.fill(plan.ellipse(ISLE.x, ISLE.z, 12, 12), { color: '#f2e8cc', paved: 1 });
  const shore = []; for (let i = 0; i <= 90; i++) { const a = (i / 90) * Math.PI * 2; shore.push([LAKE.x + Math.cos(a) * (LAKE.rx + 40), LAKE.z + Math.sin(a) * (LAKE.rz + 36)]); }
  plan.lamps(shore, 28);
  walk(ring(1640, 20), 10); walk(ring(2560, 20), 10);
  for (let i = 0; i < 24; i++) { const wx = (i / 24) * C + 60; if (Math.abs(((wx - LAKE.x + C * 1.5) % C) - C / 2) < LAKE.rx + 80) continue; walk([[wx, 1600], [wx + 40, 2000], [wx - 30, 2580]], 7); }

  // ---- the hours: lawn marked out in plots, each one bought at the auction for an hour
  const hl = new Path2D(), grid = new Path2D();
  for (let i = 0; i < 12; i++) {
    const hx0 = (i / 12) * C + 30, hx1 = ((i + 1) / 12) * C - 30;
    hl.addPath(plan.rect(hx0, 2600, hx1, 2900, 10));
    for (let gx = hx0 + 16; gx < hx1 - 4; gx += 16) grid.addPath(plan.line([[gx, 2604], [gx, 2896]]));
    for (let gz = 2616; gz < 2896; gz += 16) grid.addPath(plan.line([[hx0 + 4, gz], [hx1 - 4, gz]]));
    walk([[hx1 + 30, 2590], [hx1 + 30, 2910]], 12);
  }
  plan.fill(hl, { color: '#b5c288', life: 1, clear: ['wood'] });
  plan.stroke(grid, 0.9, { color: '#f7f3e4', cap: 'butt' });
  walk(ring(2590, 0), 12); walk(ring(2915, 0), 12);
  paintWalks();

  // ---- the back end: bright squares under lamps, where other drums keep dim woods
  const bk = { pave: new Path2D(), line: new Path2D(), pool: new Path2D() }, bbeds = gather(), lamps = [];
  for (let i = 0; i < 30; i++) {
    const bx0 = (i / 30) * C + 18, bx1 = ((i + 1) / 30) * C - 18, cx = (bx0 + bx1) / 2;
    bk.pave.addPath(plan.rect(bx0, 2940, bx1, 3360, 12));
    bk.line.addPath(plan.rect(bx0 + 20, 2960, bx1 - 20, 3340, 10));
    bbeds.put(rng.pick(['#e8a0b4', '#f2c860', '#c6a6e0']), plan.ellipse(cx, 3150, 30, 30));
    bk.pool.addPath(plan.ellipse(cx, 3150, 20, 20));
    plan.features.push({ type: 'square', x: cx, z: 3150 });
    for (let lz = 2970; lz < 3350; lz += 32) for (let lx = bx0 + 14; lx < bx1 - 10; lx += 30) lamps.push([lx, lz]);
    aveDots(aves, [[bx1 + 18, 2950], [bx1 + 18, 3350]], 7, 11);
  }
  plan.fill(bk.pave, { color: '#ecdfba', paved: 1, life: 0.9, clear: ['wood'] });
  plan.stroke(bk.line, 3, { color: '#dcc285' });
  for (const [c, p] of bbeds) plan.fill(p, { color: c, clear: ['paved', 'life'] });
  plan.fill(bk.pool, { color: '#76bfc0', water: 1 });
  plan.dots(lamps, 2.2, { lamp: 0.7 });
  plan.dots(aves, 4.2, { color: '#86a058', wood: 1 });
  plan.fill(plan.band(3360, L), { color: '#e3d5b0', paved: 1, life: 0.6, clear: ['wood'] });
}

// glasshouse rows as seen from far off: glass roofs, aisles between (gathered into paths p: base, roof, ridge, green)
function glassRows(plan, p, x0, x1, segs, pitch) {
  for (const [z0, z1] of segs) {
    p.base.addPath(plan.rect(x0, z0 - 4, x1, z1 + 4));
    for (let hx = x0; hx + 8 <= x1 + 0.1; hx += pitch) {
      const c = hx + 4;
      p.roof.addPath(plan.rect(c - 4, z0, c + 4, z1));
      p.ridge.addPath(plan.line([[c, z0 + 1], [c, z1 - 1]]));
      p.green.addPath(plan.line([[c - 2, z0 + 2], [c - 2, z1 - 2]])); p.green.addPath(plan.line([[c + 2, z0 + 2], [c + 2, z1 - 2]]));
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
function* buildGlasshouse(hollow, lod) {
  const frame = hollow.frame, rng = makeRng('glasshouse');
  const fr = new Geo({ maxSeg: 16 }), gl = new Geo({ maxSeg: 16 }), crop = new Geo({ maxSeg: 16 }), table = new Geo({ maxSeg: 16 });
  const H = GLASS.half, EAVE = 2.7, RIDGE = 4.5;
  const diners = [], waiters = [];
  let n = 0;
  for (let k = -11; k <= 10; k++) {
    const cx = XG + GLASS.pitch * k + GLASS.pitch / 2, near = Math.abs(cx - XG) < 60;
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
      const bay = near ? 3.6 : 9;
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
          crop.box(bx - 0.78, 0.75, z0 + 1.4, bx + 0.78, 0.82, z1 - 1.4, '#6d9a48', { skip: 'b' });
          for (let z = z0 + 1.7; z < z1 - 1.6; z += 0.95) {
            const lg = kind === 'radish' ? rng.pick(['#86b25a', '#7aa950', '#92b862']) : rng.pick(['#679c44', '#72a64c', '#5f9440']);
            crop.blob(bx, 0.86, z + rng.f(-0.1, 0.1), [0.78, kind === 'radish' ? 0.24 : 0.18, 0.5], 0, lg, { lump: 0.25, seed: n++, shadeBottom: 0.8 });
          }
          for (let z = z0 + 1.6; z < z1 - 1.6; z += 0.4) {
            if (rng() < 0.4) continue;
            const side = rng.sign(), fx = bx + side * 0.86, fy = rng.f(0.5, 0.72), q = 0.045;
            const fc = kind === 'radish' ? rng.pick(['#e0507a', '#f06a8a', '#ffffff']) : rng.pick(['#e8302a', '#d9282a', '#f2453a']);
            crop.quad([fx, fy - q, z + side * q], [fx, fy - q, z - side * q], [fx, fy + q, z - side * q], [fx, fy + q, z + side * q], fc);
          }
        }
      }
    }
    yield;
  }
  // the aisles: long tables, white cloths, cucumbers and strawberries, and the people eating between the rows
  for (let k = -9; k <= 9; k++) {
    const ax = XG + GLASS.pitch * k, rich = Math.abs(k) <= 3;
    for (const [z0, z1] of GLASS.segs) {
      for (const s of [-1, 1]) {
        for (let za = z0 + 2.5; za + 7 < z1 - 2; za += 8.6) {
          const tx0 = ax + s * 1.9, tx1 = ax + s * 2.8;
          table.box(Math.min(tx0, tx1), 0.32, za, Math.max(tx0, tx1), 0.76, za + 7, '#fbf8f1', { skip: 'b' });
          if (rich && Math.abs(k) <= 2) {
            for (let pz = za + 0.5; pz < za + 6.7; pz += 0.85) {
              const pxo = ax + s * 2.1, pxi = ax + s * 2.6;
              for (const [ppx, c] of [[pxo, '#ffffff'], [pxi, '#ffffff']]) table.extrude([[ppx - 0.13, pz - 0.13], [ppx - 0.13, pz + 0.13], [ppx + 0.13, pz + 0.13], [ppx + 0.13, pz - 0.13]].reverse(), 0.765, 0.012, c, { noSides: true });
              if (rng() < 0.6) { const f = rng.pick(['#e2302a', '#76a84a', '#e85a7a', '#e2302a']); table.extrude([[pxo - 0.07, pz - 0.07], [pxo - 0.07, pz + 0.07], [pxo + 0.07, pz + 0.07], [pxo + 0.07, pz - 0.07]].reverse(), 0.77, 0.05, f); }
              if (rng() < 0.25) table.cyl(ax + s * 2.35, 0.76, pz + 0.4, 0.05, 0.04, 0.26, 5, '#d6eef0', { emit: 0.15 });
            }
          }
          const ak = Math.abs(k), occ = ak === 0 ? 0.85 : ak <= 2 ? 0.7 : ak <= 6 ? 0.4 : 0;
          for (let dz = za + 0.6; dz < za + 6.8; dz += 0.85) {
            if (rng() < occ) diners.push({ p: [ax + s * 3.25, 0.42, dz], sit: true, yaw: -s * Math.PI / 2, color: rng.pick(NEW), near: ak <= 1 });
            if (k !== 0 && ak <= 4 && rng() < occ) diners.push({ p: [ax + s * 1.45, 0.42, dz], sit: true, yaw: s * Math.PI / 2, color: rng.pick(NEW), near: ak <= 1 });
          }
        }
      }
      if (k !== 0) for (let i = 0; i < 3; i++) waiters.push({ p: [ax + rng.f(-0.4, 0.4), 0, rng.f(z0 + 4, z1 - 4)], walk: rng.f(1.5, 4), color: '#f8f6f0' });
      else if (z0 > 600) waiters.push({ p: [ax, 0, (z0 + z1) / 2], walk: 3, color: '#f8f6f0' });
    }
    yield;
  }
  const glassMat = litMaterialFor(hollow, { transparent: true, opacity: 0.3, side: 'double', soft: 0 });
  lod.push([hollow.add(fr.mesh(hollow.lit, frame)), 2500], [hollow.add(crop.mesh(hollow.lit, frame)), 450], [hollow.add(table.mesh(hollow.lit, frame)), 450]);
  const g = gl.mesh(glassMat, frame); g.renderOrder = 2; hollow.add(g);
  // the diners are seated figures cut down to a body and a head: there are thousands, and their legs are under the tables
  const bySkin = new Map();
  for (const m of hollow.add(crowd(diners.filter((d) => d.near), hollow.walk, { frame, seed: 'diners', cell: 120 }))) lod.push([m, 420]);
  for (const d of diners) { if (d.near) continue; const skin = SKIN[Math.floor(rng() * SKIN.length)]; let a = bySkin.get(skin); if (!a) bySkin.set(skin, a = []); a.push({ p: d.p, yaw: d.yaw, color: d.color, scale: rng.f(0.92, 1.06) }); }
  for (const [skin, list] of bySkin) for (const m of instances(dinerGeo(skin), hollow.lit, list, { frame, cell: 120 })) lod.push([hollow.add(m), 420]);
  for (const m of hollow.add(crowd(waiters, hollow.walk, { frame, seed: 'waiters', bob: 0.12 }))) lod.push([m, 420]);
  yield;
}

const dinerCache = new Map();
function dinerGeo(skin) {
  if (dinerCache.has(skin)) return dinerCache.get(skin);
  const g = new Geo();
  g.tint(1).box(-0.19, 0.1, -0.12, 0.19, 0.74, 0.13, '#ffffff', { skip: 'b' });
  g.tint(0).cyl(0, 0.76, 0.01, 0.12, 0.11, 0.25, 5, skin);
  const geo = g.build();
  dinerCache.set(skin, geo);
  return geo;
}

function litMaterialFor(hollow, opts) { return litMaterial(hollow.rig, { bend: hollow.frame, ...opts }); }

// ---------------------------------------------------------------- the squares near the flight, and the lake's rotunda
function* buildFloorThings(hollow, pav, low, lod) {
  const frame = hollow.frame;
  const near = (x, z, r) => nearPath(low, x, z, C) < r;
  // gilded pavilions near the flight; farther off the plan's gold dot stands for each
  const items = []; for (const q of pav) if (near(q[0], q[1], 1100)) items.push({ p: [q[0], 0, q[1]], yaw: (q[0] * 0.37) % 6.28 });
  for (const m of hollow.add(instances(pavilionGeo(), hollow.lit, items, { frame, cell: 700 }))) lod.push([m, 2400]);
  yield;
  const fItems = [];
  for (const f of hollow.plan.features) if (f.type === 'square' && near(f.x, f.z, 900)) fItems.push({ p: [f.x, 0, f.z], yaw: f.x * 0.1 });
  for (const m of hollow.add(instances(fountainGeo(), hollow.lit, fItems, { frame, cell: 500 }))) lod.push([m, 1500]);
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
  for (const m of hollow.add(crowd(people, hollow.walk, { frame, seed: 'rotunda' }))) lod.push([m, 600]);
  yield;
}

// people where the plan has life, near the flight, in new clothes
function* lovageFolk(hollow, near, R, density, max, lod) {
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
  for (const m of hollow.add(crowd(spots, hollow.walk, { frame: hollow.frame, bob: 0.16, speed: 0.95, seed: 'lovage-floor', cell: 160 }))) lod.push([m, 560]);
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

function* buildWedding(hollow, T, path, lod) {
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
  for (const m of T.add(crowd(spots, T.walk, { frame: T.frame, seed: 'guests', bob: 0.18, speed: 0.6, cell: 60 }))) lod.push([m, 700]);
  const bySkin = new Map();
  for (const it of dancers) { const skin = rng.pick(SKIN); let a = bySkin.get(skin); if (!a) bySkin.set(skin, a = []); a.push({ ...it, scale: rng.f(0.92, 1.06) }); }
  const reel = [];
  for (const [skin, list] of bySkin) for (const m of instances(figureGeo(skin, 'stand'), T.walk, list, { frame: T.frame, walk: true })) { T.add(m); reel.push(m); }
  // the apple's two halves catch the line: the only star most people here will see
  const hand = (s) => { const [hx, hz] = ringUV(2.4 + 0.2, s * 0.36); return { p: [hx, 2.12, hz], color: '#fff2c8', power: 0.9, size: 0.12 }; };
  T.glow([hand(-1), hand(1)], { minPx: 1, maxPx: 8 });
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
    yield* plan.settle();
    const pav = paintPavilions(plan);
    yield;
    const hollow = yield* buildHollow(ctx, {
      seed: 'lovage', plan, pavilions: false,
      light: { sun: '#fff3d8', sunPower: 1.15, amb: '#f0dcb0', ambPower: 0.34, bounce: '#d8c070', bouncePower: 0.3, air: '#fff1d2', airDensity: 0.000045, ground: '#ffd890', groundPower: 0.0 },
      sunline: { power: 64, halo: 300, haloPower: 0.04 },
      ground: { rows: [7, 6], canopy: '#8fb058', blossom: '#fbeef0', fruit: '#d8402c', people: 1.0, lamp: 0.3, lampColor: '#ffd68a', sunRod: 64, stripes: 0.08, grain: 0.18 },
      front: WALL, back: { ...WALL, crowd: 0.35, tiers: { 9: { crowd: 0.35, garden: 0.3 }, 14: { crowd: 0.5 }, 24: { crowd: 0.4 } } },
    });
    yield;
    const scene = new Scene();
    scene.add(hollow.group);
    const T = hollow.terrace(1, TIERS.third, (XA / 1500) * 180 / Math.PI);
    const k = 1500 / T.floorR, tz = T.frame.z0;
    const th = (x, y, z) => [XA + x * k, T.y + y, tz + z];
    const tr = (u, y) => { const q = ringUV(u, 0); return th(q[0], y, q[1]); };
    // out of the Glasshouse's aisle, up over its roofs and the squares, across the lake along the line's reflection,
    // up the back wall to the Third, along the wedding and out through the ring at the rail
    const path = makePath([
      { t: 0, p: [XG, 2.2, 462] },
      { t: 8, p: [XG, 4.5, 500], look: [XG + 30, 140, 900] },
      { t: 13, p: [XG + 5, 22, 585], look: [XG + 40, 10, 950] },
      { t: 17, p: [XG + 22, 52, 790], look: [XG + 150, 0, 1150] },
      { t: 22, p: [XG + 70, 80, 1120], look: [XG + 700, 450, 1500] },
      { t: 28, p: [XG + 130, 150, 1640], look: [XG + 200, 0, 2000], fov: 66 },
      { t: 34, p: [XG + 190, 240, 2110], look: [XG + 200, 0, 2260], fov: 72 },
      { t: 39, p: [XG + 290, 270, 2560], look: [XG + 1500, 900, 2900], fov: 64 },
      { t: 44, p: [XA + 180, 340, 3060], look: [XA - 900, 300, 2750] },
      { t: 48.5, p: th(118, -60, -70), look: th(-80, 30, -30) },
      { t: 52, p: th(94, 13, -2), look: th(55, 0, 15) },
      { t: 54.8, p: th(64, 7.5, 15), look: th(30, 3, 19) },
      { t: 57.6, p: th(34, 6.3, 21), look: tr(0, 4) },
      { t: 60.2, p: tr(20, RING.y + 0.4), look: tr(-20, 4) },
      { t: 62.65, p: tr(8, RING.y) },
      { t: 65, p: tr(-4.2, RING.y) },
    ], { frame: hollow.frame, entryRadius: 1.8, exitRadius: RING.r });
    yield;
    const lod = [];                            // [mesh, metres]: hidden when the camera is farther than that from it
    yield* buildGlasshouse(hollow, lod);
    const pts = path.points(0.5), low = pts.filter((q) => q.y < 260);
    yield* buildFloorThings(hollow, pav, low, lod);
    const reel = yield* buildWedding(hollow, T, path, lod);
    // scatterTrees stands a tree in 2% of cells even where the plan has no wood: read land without wood as water so it does not
    const treeLand = { ...hollow, at(x, z) { const s = hollow.at(x, z); if (s.wood < 0.05 && s.rows < 0.5) s.water = 1; return s; } };
    const trees = yield* scatterTrees(treeLand, { near: low, radius: 130, max: 7000 * ctx.density, wood: [{ kind: 'round', weight: 3 }, { kind: 'poplar', weight: 1 }, { kind: 'pear', weight: 1, tint: [1.1, 1.08, 0.9] }] });
    for (const m of trees) lod.push([m, 1300]);
    const folk = yield* lovageFolk(hollow, low.filter((q) => q.z > 700), 200, 1.2 * ctx.density, 7000, lod);
    const drift = 0.075 / T.floorR;            // a hand's width spinward every leap
    return {
      scene, path, hollow, near: 0.4, far: 9000,
      look: { exposure: 0.88, bloom: 0.3, threshold: 0.95, saturation: 1.1, contrast: 1.1, lift: [0.012, 0.008, 0.0], gain: [1.03, 1.0, 0.93], vignette: 0.4 },
      portal: { rim: false, mist: '#fff1c8' },
      update(t, dt, camera) {
        for (const m of reel) m.rotation.z = t * drift;
        const cp = camera.position;
        for (const [m, far] of lod) { const s = m.isInstancedMesh ? m.boundingSphere : m.geometry.boundingSphere; m.visible = cp.distanceTo(s.center) - s.radius < far; }
      },
    };
  },
};
