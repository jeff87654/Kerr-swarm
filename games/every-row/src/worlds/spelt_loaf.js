// Spelt, Grain Row: a baker's dawn over the grain trial plots. Spelt gives its Hollow floor to the one food the Shade
// keeps for ritual: thousands of small trial plots in strips and squares, each its own stand (pale barley, gold wheat,
// green oats not yet ripe, red-brown spelt, rye, a few of blue-green), a quilt in every shade of crust wrapped round the
// sky. Reapers cut by hand and tie sheaves, stooks stand in rows on the stubble, and by the lake and its orchard a long
// bakehouse has its doors open while wanderers queue with a spoon of starter each (docs/wander-year.md, Day 290;
// games/three-nights/src/15-canon.js, Spelt: "grain trial plots under the sunline, and an orchard by the lake", lamps
// at 04:30, palette "Crust"; docs/food-system.md, Tier 3: "grains, pulses and nuts are ... reserved for ritual").
//
// Not canon:
//   - the whole plan of Spelt's Hollow: blocks of plots between lamplit walks, a lift pavilion at every crossing, the
//     lake and its orchard in one park, woods in the Dim Ends
//   - reaping by hand with sickles, binding sheaves, stooks, ricks and a threshing floor with flails
//   - the bakehouse by the lake, its racks of loaves, and the queue of wanderers there with their jars (the docs put
//     Pell's crock room indoors, by the Gate: here the spoons are taken in at the bakehouse door and carried down after)
//   - numbered stakes and labels at the plots
//   - the hours of dawn are pressed into one minute
import {
  Scene, BufferGeometry, Float32BufferAttribute, InstancedBufferGeometry, InstancedBufferAttribute, Mesh, ShaderMaterial,
  Sphere, Vector3, Vector4, DoubleSide, BufferAttribute,
} from 'three';
import { Plan, C, L } from '../kit/plan.js';
import { buildHollow, pavilionGeo } from '../kit/hollow.js';
import { makePath, nearPath } from '../core/path.js';
import { treeGeo } from '../kit/flora.js';
import { crowd, figureGeo, SKIN, CLOTH } from '../kit/folk.js';
import { Geo, instances } from '../kit/geo.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG, NOISE_GLSL, litMaterial, vec3col } from '../kit/mats.js';
import { makeRng, smoothstep, hash2 } from '../core/rng.js';

// ---------------------------------------------------------------- what grows
// head and stalk colours, stand height (m), head shape [length, width, droop, unused], weight among the plots, ripe
const CROPS = [
  { name: 'wheat', head: '#d8a85b', stalk: '#b48b4e', h: 1.0, shape: [0.09, 0.009, 0.14, 0], w: 20, ripe: 1 },
  { name: 'bearded wheat', head: '#e0b268', stalk: '#bb9253', h: 1.05, shape: [0.13, 0.011, 0.22, 0], w: 8, ripe: 1 },
  { name: 'barley', head: '#dcc386', stalk: '#c4a872', h: 0.8, shape: [0.13, 0.012, 0.5, 0], w: 13, ripe: 1 },
  { name: 'oats', head: '#a7ab6c', stalk: '#909e60', h: 1.0, shape: [0.17, 0.04, 0.55, 0], w: 10, ripe: 0 },
  { name: 'spelt', head: '#ad693c', stalk: '#b88a55', h: 1.2, shape: [0.11, 0.011, 0.32, 0], w: 12, ripe: 1 },
  { name: 'rye', head: '#bca47e', stalk: '#a99c77', h: 1.45, shape: [0.12, 0.008, 0.26, 0], w: 8, ripe: 1 },
  { name: 'blue-green', head: '#7f9a8f', stalk: '#839c87', h: 0.9, shape: [0.09, 0.009, 0.1, 0], w: 5, ripe: 0 },
  { name: 'young', head: '#9aac6a', stalk: '#8ea25f', h: 0.4, shape: [0, 0, 0, 0], w: 4, ripe: 0 },
  { name: 'stubble', head: '#d4b47a', stalk: '#c9a870', h: 0.15, shape: [0, 0, 0, 0], w: 0, ripe: 0 },
  { name: 'fallow', head: '#a99779', stalk: '#a99779', h: 0.02, shape: [0, 0, 0, 0], w: 3, ripe: 0 },
];
const STUBBLE = 8;
const PATHC = '#9f8f70', WALKC = '#bba98a';
const mixHex = (a, b, t) => { const p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16); const f = (s) => Math.round(((p >> s) & 255) * (1 - t) + ((q >> s) & 255) * t); return `rgb(${f(16)},${f(8)},${f(0)})`; };
const farCol = (k) => mixHex(CROPS[k].stalk, CROPS[k].head, 0.8);
const stookCol = (k) => mixHex(CROPS[k].stalk, '#e8d29a', 0.55);
const stubCol = (k) => mixHex(CROPS[STUBBLE].head, CROPS[k].stalk, 0.25);

// ---------------------------------------------------------------- the plan of the floor
// Blocks of plots between walks: 32 round the drum, 10 along it. A lift pavilion stands at every crossing.
const NCOL = 32, BW = C / NCOL, ZA = 620, ZB = 3130, NROW = 10, BH = (ZB - ZA) / NROW, WALK = 8, PATH = 2.2;
const PARK = { c0: 10, c1: 14, r0: 4, r1: 7 };          // blocks given to the lake, its orchard and the bakehouse
const TF = { c: 9, r: 4 };                              // the block with the threshing floor
const SB = { c: 8, r: 3 };                              // the block the flight begins in
const XS = 2480, ZS = 1450, ZR = 1482;                  // the path it begins on, where, and the reapers' line
const TFX = 2830, TFZ = ZA + (TF.r + 0.5) * BH;
const YARD = { x0: TFX - 44, x1: TFX + 44, z0: TFZ - 38, z1: TFZ + 38 };
const PX0 = PARK.c0 * BW, PZ0 = ZA + PARK.r0 * BH, PX1 = PARK.c1 * BW, PZ1 = ZA + PARK.r1 * BH;
const LAKE = { x: 3700, z: 2000, rx: 380, rz: 270 };
const ORCH = { x0: PX0 + 70, x1: LAKE.x - LAKE.rx - 40, z0: PZ0 + 60, z1: PZ1 - 60 };
const BAKE = { x0: PX0 + 22, x1: PX0 + 38, z0: 1955, z1: 2025 };   // the bakehouse: its front faces the walk (-x)

// a range cut into pieces wmin..wmax wide with a path between each
function split(rng, a, b, wmin, wmax, gap = PATH) {
  const out = []; let p = a;
  while (p < b - 0.5) {
    let w = rng.f(wmin, wmax);
    if (b - p - w - gap < wmin) w = b - p;
    out.push([p, p + w]); p += w + gap;
  }
  return out;
}
function pickCrop(rng) {
  let t = 0; for (const c of CROPS) t += c.w;
  let r = rng() * t; for (let k = 0; k < CROPS.length; k++) { r -= CROPS[k].w; if (r <= 0) return k; }
  return 0;
}
// A plot: its rectangle, crop, rows along z (dir 1) or x (0), the cut part along that axis [cutA, cutB] (stubble),
// flags (1 = real grain stands on it, 2 = stooks in its stubble, 4 = real stooks stand there), tint, seed.
function plot(rng, x0, z0, x1, z1, k, dir, harvest) {
  let cutA = 0, cutB = 0, flags = 0;
  if (CROPS[k].ripe) {
    const r = rng();
    if (r < harvest * 0.55) { cutA = 0; cutB = 1; if (rng.chance(0.75)) flags |= 2; }
    else if (r < harvest * 0.85) { const f = rng.f(0.2, 0.8); if (rng.chance(0.5)) { cutA = 0; cutB = f; } else { cutA = f; cutB = 1; } if (rng.chance(0.6)) flags |= 2; }
  }
  return { x0, z0, x1, z1, k, dir, cutA, cutB, flags, tint: rng.f(0.9, 1.1), seed: rng() };
}

function blockPlots(rng, bx0, bz0, bx1, bz1, out, harvest) {
  const pat = rng.pick(['z', 'z', 'x', 'grid', 'grid', 'mix', 'big']);
  const put = (xs, zs, dir) => { for (const [x0, x1] of xs) for (const [z0, z1] of zs) out.push(plot(rng, x0, z0, x1, z1, pickCrop(rng), dir, harvest)); };
  if (pat === 'z') put(split(rng, bx0, bx1, 8, 26), split(rng, bz0, bz1, 70, 125), 1);
  else if (pat === 'x') put(split(rng, bx0, bx1, 80, 150), split(rng, bz0, bz1, 8, 24), 0);
  else if (pat === 'grid') { const d = rng.chance(0.5) ? 1 : 0; put(split(rng, bx0, bx1, 26, 52), split(rng, bz0, bz1, 26, 52), d); }
  else if (pat === 'big') put(split(rng, bx0, bx1, 60, 140), split(rng, bz0, bz1, 55, 120), rng.chance(0.5) ? 1 : 0);
  else {
    const xm = (bx0 + bx1) / 2 + rng.f(-40, 40);
    put(split(rng, bx0, xm, 7, 18), split(rng, bz0, bz1, 70, 125), 1);
    put(split(rng, xm + PATH, bx1, 26, 50), split(rng, bz0, bz1, 26, 50), 0);
  }
}

// The block the flight begins in: narrow strips along z, a path down the middle of them at XS, cut across at ZS - 5
// and ZR + 32. The middle section is being reaped from its far end in a line at ZR; the far section is stubble in stooks.
const START_CROPS = { '-1': 0, '-2': 4, '-3': 5, '-4': 2, '-5': 3, '-6': 0, '1': 1, '2': 2, '3': 4, '4': 6, '5': 0, '6': 5, '7': 3 };
function startPlots(rng, bx0, bz0, bx1, bz1, out) {
  const W = 6.5, xs = [];
  for (let x = XS - 1.3; x - W > bx0 + 3; x -= W + PATH) xs.push([x - W, x, -1 - xs.filter((s) => s[2] < 0).length]);
  let i = 1; for (let x = XS + 1.3; x + W < bx1 - 3; x += W + PATH) xs.push([x, x + W, i++]);
  const zs = [[bz0, ZS - 6.2], [ZS - 4, ZR + 32], [ZR + 34.2, bz1]];
  for (const [x0, x1, j] of xs) {
    const k = START_CROPS[j] === undefined ? pickCrop(rng) : START_CROPS[j];
    for (let s = 0; s < 3; s++) {
      const p = plot(rng, x0, zs[s][0], x1, zs[s][1], k, 1, 0);
      if (CROPS[k].ripe && s === 1 && Math.abs(j) <= 6) { p.cutA = (ZR - zs[s][0]) / (zs[s][1] - zs[s][0]); p.cutB = 1; p.reap = true; }
      if (CROPS[k].ripe && s === 2 && (j % 2 === 0)) { p.cutA = 0; p.cutB = 1; p.flags |= 2; }
      if (s === 1 && Math.abs(j) <= 3) p.flags |= 1;
      p.tint = 1; p.lane = j;
      out.push(p);
    }
  }
}

// The threshing floor's block: a yard in the middle, stubble in stooks round it
function threshPlots(rng, bx0, bz0, bx1, bz1, out) {
  const tmp = [];
  blockPlots(rng, bx0, bz0, bx1, bz1, tmp, 1);
  const Y = { x0: YARD.x0 - PATH, x1: YARD.x1 + PATH, z0: YARD.z0 - PATH, z1: YARD.z1 + PATH };
  for (const p0 of tmp) {
    let parts = [p0];
    if (p0.x1 > Y.x0 && p0.x0 < Y.x1 && p0.z1 > Y.z0 && p0.z0 < Y.z1) {
      const mx0 = Math.max(p0.x0, Y.x0), mx1 = Math.min(p0.x1, Y.x1);
      parts = [{ ...p0, x1: Y.x0 }, { ...p0, x0: Y.x1 }, { ...p0, x0: mx0, x1: mx1, z1: Y.z0 }, { ...p0, x0: mx0, x1: mx1, z0: Y.z1 }]
        .filter((q) => q.x1 - q.x0 > 6 && q.z1 - q.z0 > 6 && q.x0 >= p0.x0 && q.x1 <= p0.x1 && q.z0 >= p0.z0 && q.z1 <= p0.z1);
    }
    for (const p of parts) {
      if (CROPS[p.k].ripe || rng.chance(0.6)) { if (!CROPS[p.k].ripe) p.k = rng.pick([0, 1, 2, 4, 5]); p.cutA = 0; p.cutB = 1; p.flags |= 2; }
      out.push(p);
    }
  }
}

function* layout() {
  const rng = makeRng('spelt-plots'), plots = [], paths = [];
  let t0 = performance.now();
  const yard = YARD;
  const pathRect = (x0, z0, x1, z1) => paths.push({ x0, z0, x1, z1, k: 9, seed: 0, dir: 0, flags: 0, cutA: 0, cutB: 0, tint: 1 });
  for (let c = 0; c < NCOL; c++) for (let r = 0; r < NROW; r++) {
    if (performance.now() - t0 > 4) { yield 'layout'; t0 = performance.now(); }
    if (c >= PARK.c0 && c < PARK.c1 && r >= PARK.r0 && r < PARK.r1) continue;
    const bx0 = c * BW + WALK / 2, bx1 = (c + 1) * BW - WALK / 2, bz0 = ZA + r * BH + WALK / 2, bz1 = ZA + (r + 1) * BH - WALK / 2;
    if (c === TF.c && r === TF.r) { pathRect(bx0, bz0, bx1, yard.z0); pathRect(bx0, yard.z1, bx1, bz1); pathRect(bx0, yard.z0, yard.x0, yard.z1); pathRect(yard.x1, yard.z0, bx1, yard.z1); }
    else pathRect(bx0, bz0, bx1, bz1);
    // the harvest runs round the drum: nearly done on one side, hardly begun on the other
    const harvest = 0.12 + 0.4 * (0.5 + 0.5 * Math.cos((c / NCOL) * Math.PI * 2 - 1.2));
    if (c === SB.c && r === SB.r) startPlots(rng, bx0, bz0, bx1, bz1, plots);
    else if (c === TF.c && r === TF.r) threshPlots(rng, bx0, bz0, bx1, bz1, plots);
    else blockPlots(rng, bx0, bz0, bx1, bz1, plots, harvest);
  }
  return { plots, paths };
}

function paintSpelt(plan, plots) {
  const rng = makeRng('spelt-plan');
  const once = (name, style, op, z0, z1) => plan.once(name, (cx) => { cx.globalCompositeOperation = op; cx.fillStyle = style; cx.fillRect(0, z0, C, z1 - z0); });
  once('alb', '#a69a72', 'source-over', 0, L);
  once('kind', 'rgb(0,0,26)', 'lighter', ZA - 4, ZB + 4);
  // the Dim Ends: dark woods under the walls, where the light falls away
  once('alb', '#5f6a40', 'source-over', 0, ZA - 4); once('alb', '#5a653e', 'source-over', ZB + 4, L);
  once('mask', 'rgb(0,242,0)', 'lighter', 0, ZA - 4); once('mask', 'rgb(0,242,0)', 'lighter', ZB + 4, L);
  plan.mottle(['#6d6a3c', '#56633d', '#7a7444', '#4f5c3a'], 40, 240, { alpha: 0.5, z0: 300, z1: ZA, seed: 'spelt-dim0' });
  plan.mottle(['#6d6a3c', '#56633d', '#7a7444', '#4f5c3a'], 40, 240, { alpha: 0.5, z0: ZB, z1: L - 300, seed: 'spelt-dim1' });
  for (const col of ['#8f8a58', '#a3976a']) {
    const glade = new Path2D();
    for (let i = 0; i < 20; i++) {
      const x = rng.f(100, C - 100), z = rng.chance(0.5) ? rng.f(430, ZA - 60) : rng.f(ZB + 60, L - 430), rx = rng.f(30, 80), rz = rng.f(20, 50);
      glade.moveTo(x + rx, z); glade.ellipse(x, z, rx, rz, rng.f(0, 3), 0, Math.PI * 2);
    }
    plan.fill(glade, { color: col, clear: ['wood'], life: 0.3 });
  }
  // the plots, block by block: paths first, then each stand (stubble where it is cut)
  const byBlock = new Map();
  for (const p of plots) { const k = Math.floor(p.x0 / BW) + '_' + Math.floor((p.z0 - ZA) / BH); let a = byBlock.get(k); if (!a) byBlock.set(k, a = []); a.push(p); }
  const groups = [];
  for (const [key, list] of byBlock) { const g = Math.floor(Number(key.split('_')[0]) / 4); (groups[g] = groups[g] || []).push([key, list]); }
  for (const grp of groups) if (grp) plan.once('alb', (cx) => {
    for (const [key, list] of grp) {
    const [c, r] = key.split('_').map(Number);
    const bx0 = c * BW + WALK / 2, bx1 = (c + 1) * BW - WALK / 2, bz0 = ZA + r * BH + WALK / 2, bz1 = ZA + (r + 1) * BH - WALK / 2;
      cx.fillStyle = PATHC; cx.fillRect(bx0, bz0, bx1 - bx0, bz1 - bz0);
      for (const p of list) {
        cx.fillStyle = farCol(p.k); cx.fillRect(p.x0, p.z0, p.x1 - p.x0, p.z1 - p.z0);
        if (p.cutB > p.cutA) {
          cx.fillStyle = stubCol(p.k);
          if (p.dir) cx.fillRect(p.x0, p.z0 + (p.z1 - p.z0) * p.cutA, p.x1 - p.x0, (p.z1 - p.z0) * (p.cutB - p.cutA));
          else cx.fillRect(p.x0 + (p.x1 - p.x0) * p.cutA, p.z0, (p.x1 - p.x0) * (p.cutB - p.cutA), p.z1 - p.z0);
        }
      }
    }
  });
  // the walks, lamplit, and a lift pavilion at every crossing
  const walks = new Path2D(), lamps = [];
  for (let c = 0; c < NCOL; c++) { walks.moveTo(c * BW, ZA); walks.lineTo(c * BW, ZB); for (let z = ZA + 14; z < ZB; z += 28) lamps.push([c * BW, z]); }
  for (let r = 0; r <= NROW; r++) { walks.moveTo(-20, ZA + r * BH); walks.lineTo(C + 20, ZA + r * BH); for (let x = 14; x < C; x += 28) lamps.push([x, ZA + r * BH]); }
  plan.stroke(walks, WALK, { color: WALKC, paved: 0.7, life: 0.2, cap: 'butt' });
  // lamp dots drawn once (as squares: at 4.6 m a pixel nobody can tell), with the ones on the seam drawn at both ends
  plan.once('mask', (cx) => { cx.globalCompositeOperation = 'lighter'; cx.fillStyle = 'rgb(0,0,255)'; for (const q of lamps) { cx.fillRect(q[0] - 2.2, q[1] - 2.2, 4.4, 4.4); if (q[0] < 3) cx.fillRect(q[0] + C - 2.2, q[1] - 2.2, 4.4, 4.4); } });
  for (const q of lamps) plan.features.push({ type: 'lamp', x: q[0], z: q[1], h: 4.5 });
  const pav = [];
  for (let c = 0; c < NCOL; c++) for (let r = 0; r <= NROW; r++) pav.push([c * BW, ZA + r * BH]);
  plan.dots(pav, 9, { color: '#bdb39c', paved: 1 });
  plan.once('mask', (cx) => { cx.globalCompositeOperation = 'lighter'; cx.fillStyle = 'rgb(0,0,230)'; for (const q of pav) cx.fillRect(q[0] - 2, q[1] - 2, 4, 4); });
  for (const q of pav) plan.features.push({ type: 'pavilion', x: q[0], z: q[1] });
  // the park: the lake, the orchard, the bakehouse and its forecourt
  plan.fill(plan.rect(PX0 + WALK / 2, PZ0 + WALK / 2, PX1 - WALK / 2, PZ1 - WALK / 2, 30), { color: '#9c9c66', life: 0.12 });
  plan.mottle(['#8f9560', '#a8a370', '#88905a'], 60, 60, { alpha: 0.5, x0: PX0, x1: PX1, z0: PZ0, z1: PZ1, seed: 'spelt-park' });
  plan.fill(plan.rect(ORCH.x0, ORCH.z0, ORCH.x1, ORCH.z1, 20), { color: '#8a9460', rows: 1, clear: ['life'] });
  for (let i = 1; i < 4; i++) { const z = ORCH.z0 + ((ORCH.z1 - ORCH.z0) * i) / 4; plan.stroke([[ORCH.x0, z], [ORCH.x1, z]], 9, { color: '#c4b48e', clear: ['rows'], paved: 0.5, life: 0.4 }); }
  const lake = plan.blob(LAKE.x, LAKE.z, LAKE.rx, LAKE.rz, { wobble: 0.14, lobes: 6, seed: 21 });
  plan.stroke(lake, 30, { color: '#cbb994', paved: 0.3, life: 0.6, clear: ['rows', 'wood'] });
  plan.fill(lake, { color: '#5f9c98', water: 1, clear: ['life', 'paved', 'rows', 'wood'] });
  plan.fill(plan.blob(LAKE.x, LAKE.z, LAKE.rx * 0.78, LAKE.rz * 0.7, { wobble: 0.2, seed: 22 }), { color: '#3a7a84', feather: 40 });
  const shore = []; for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2; shore.push([LAKE.x + Math.cos(a) * (LAKE.rx + 34), LAKE.z + Math.sin(a) * (LAKE.rz + 30)]); }
  plan.lamps(shore, 30);
  plan.fill(plan.rect(PX0 + 3, BAKE.z0 - 30, BAKE.x1 + 6, BAKE.z1 + 30, 4), { color: '#cdbc98', paved: 0.9, clear: ['rows', 'wood', 'life'] });
  plan.fill(plan.rect(BAKE.x0, BAKE.z0, BAKE.x1, BAKE.z1), { color: '#8f5a3a', clear: ['life'] });
  plan.lamps([[BAKE.x0 - 11, BAKE.z0 - 20], [BAKE.x0 - 11, BAKE.z1 + 26]], 12);
  // the threshing yard
  plan.fill(plan.rect(YARD.x0, YARD.z0, YARD.x1, YARD.z1, 10), { color: '#c9b080', clear: ['life'] });
  plan.fill(plan.blob(TFX, TFZ, 30, 26, { seed: 5, wobble: 0.2 }), { color: '#d9bf86' });
  plan.fill(plan.ellipse(TFX, TFZ, 16, 16), { color: '#d4bb8c', paved: 1 });
  plan.lamps([[YARD.x0 + 4, YARD.z0 + 4], [YARD.x1 - 4, YARD.z0 + 4], [YARD.x1 - 4, YARD.z1 - 4], [YARD.x0 + 4, YARD.z1 - 4], [YARD.x0 + 4, YARD.z0 + 4]], 84);
  return pav;
}

// ---------------------------------------------------------------- the plots, drawn crisp over the plan
// One quad per plot, cut every 16 m to bend, reaching a metre into the paths round it. The shader draws the stand as a
// block of grain as tall as it really is: its heads on top and its side where a path or a cut edge shows it, slid by
// the view as the ground shader slides tree crowns. Stubble shows its rows and its stooks.
const PLOT_VERT = /* glsl */`
attribute vec4 aA;   // the plot's corner x, z and its size
attribute vec4 aB;   // crop, seed, rows along z, flags
attribute vec4 aC;   // cut from, cut to (along the rows), tint, unused
${BEND_PARS}
varying vec3 vW; varying vec3 vF; varying vec4 vA; varying vec4 vB; varying vec4 vC;
void main() {
  vec3 p = position, n = vec3(0.0, 1.0, 0.0);
  vF = p; vA = aA; vB = aB; vC = aC;
  kBend(p, n);
  vW = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const plotFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform vec3 uHead[10]; uniform vec3 uStalk[10]; uniform float uH[10];
uniform vec3 uPath, uStub, uLampCol; uniform float uLamp; uniform vec2 uSize; uniform sampler2D tMask;
varying vec3 vW; varying vec3 vF; varying vec4 vA; varying vec4 vB; varying vec4 vC;
${rig.glsl}
${NOISE_GLSL}
float boxIn(vec2 p, vec2 lo, vec2 hi, float aa) { vec2 d = min(p - lo, hi - p); return smoothstep(-aa, aa, min(d.x, d.y)); }
// the heads of a stand seen from above: drills, a speckle of single heads, patches, now and then a lodged swirl
vec3 canopy(int k, vec2 p, vec2 q, float seed, float px) {
  vec3 hc = uHead[k], sc = uStalk[k];
  float near = 1.0 - smoothstep(0.06, 0.5, px), mid = 1.0 - smoothstep(0.8, 4.0, px);
  float rows = 0.5 + 0.5 * cos(q.x * 6.2831 / 0.36);
  float speck = kNoise(p * 7.3) * 0.55 + kNoise(p * 21.0) * 0.45;
  float pat = kFbm(p / 9.0 + seed * 13.0);
  vec3 c = mix(sc, hc, 0.62 + 0.38 * pat);
  c *= 1.0 + (speck - 0.5) * 0.6 * near;
  c *= 1.0 - 0.2 * rows * near;
  float lodge = smoothstep(0.7, 0.8, kNoise(p / 6.0 + seed * 31.0)) * step(0.55, fract(seed * 7.3));
  c = mix(c, mix(sc, hc, 0.5) * 1.2, lodge * 0.7 * mid);
  c *= 0.93 + 0.14 * pat;
  return mix(mix(sc, hc, 0.8), c, mid);
}
void main() {
  ${CLIP_FRAG}
  vec2 m = vF.xz, rel = m - vA.xy, S = vA.zw;
  int k = int(vB.x + 0.5);
  float seed = vB.y, flags = vB.w;
  bool alongZ = vB.z > 0.5;
  bool tufted = mod(flags, 2.0) > 0.5, stooks = mod(floor(flags / 2.0), 2.0) > 0.5, real = mod(floor(flags / 4.0), 2.0) > 0.5;
  float px = max(length(dFdx(m)), length(dFdy(m)));
  float aa = max(px * 0.7, 0.01);
  vec3 up = vec3(-normalize(vW.xy), 0.0), T = vec3(up.y, -up.x, 0.0);
  float dist = length(vW - cameraPosition);
  vec3 V = (cameraPosition - vW) / dist;
  vec2 par = vec2(dot(V, T), V.z) / max(dot(V, up), 0.1);
  float pl = length(par); if (pl > 9.0) par *= 9.0 / pl;
  // the standing part and the cut part, as rectangles in the plot
  float sA = vC.x < 0.001 ? vC.y : 0.0, sB = vC.x < 0.001 ? 1.0 : vC.x;
  bool standing = sB - sA > 0.001, cut = vC.y - vC.x > 0.001;
  vec2 slo = alongZ ? vec2(0.0, sA * S.y) : vec2(sA * S.x, 0.0), shi = alongZ ? vec2(S.x, sB * S.y) : vec2(sB * S.x, S.y);
  vec2 clo = alongZ ? vec2(0.0, vC.x * S.y) : vec2(vC.x * S.x, 0.0), chi = alongZ ? vec2(S.x, vC.y * S.y) : vec2(vC.y * S.x, S.y);
  float h = tufted ? 0.0 : uH[k];
  vec2 rc = rel + par * max(h - 0.2, 0.0);
  float rag = 0.16 * kNoise(rc * 5.0) * (1.0 - smoothstep(0.05, 0.3, px));
  float inC = standing && h > 0.0 ? boxIn(rc, slo + rag, shi - rag, aa) : 0.0;
  float inS = standing ? boxIn(rel, slo, shi, aa) : 0.0;
  float inCut = cut ? boxIn(rel, clo, chi, aa) : 0.0;
  vec2 q = alongZ ? rel : rel.yx;
  // the path between plots: pale, worn down its middle
  vec3 col = uPath * (0.9 + 0.16 * kNoise(m * 0.9)) * (0.96 + 0.06 * kNoise(m * 4.0));
  float fine = 1.0 - smoothstep(0.02, 0.12, px);
  col *= 1.0 - 0.14 * smoothstep(0.66, 0.8, kNoise(m * 13.0)) * fine;
  col = mix(col, uStub, smoothstep(0.74, 0.86, kNoise(m * 7.0 + 9.0)) * fine * 0.4);
#ifdef PATHS
  inC = 0.0; inS = 0.0; inCut = 0.0;
#else
  // out in the path this quad reaches over: only the stand leaning into view is drawn; the path mesh does the rest
  if (boxIn(rel, vec2(0.0), S, aa) <= 0.0 && inC <= 0.0) discard;
#endif
  // stubble: rows of cut stalks, and stooks standing in rows down it
  if (inCut > 0.0) {
    vec3 st = mix(uStub, uStalk[k], 0.25) * (0.9 + 0.12 * kNoise(m * 1.7));
    float sr = 0.5 + 0.5 * cos(q.x * 6.2831 / 0.36);
    st *= 1.0 - 0.22 * sr * (1.0 - smoothstep(0.05, 0.4, px));
    if (stooks && !real) {
      vec2 sp = vec2(5.0, 6.0);
      vec2 ext = chi - clo, n = floor(ext / sp), off = (ext - n * sp) * 0.5;
      vec2 cr = rel - clo - off, ci = floor(cr / sp);
      if (ci.x >= 0.0 && ci.y >= 0.0 && ci.x < n.x && ci.y < n.y) {
        vec2 sc = cr - (ci + 0.5) * sp - par * 0.9;
        float d = length(sc);
        float rr = 0.8, sa = max(aa, 0.05);
        vec3 sk = mix(uStalk[k], uHead[k], 0.6) * (0.75 + 0.4 * sqrt(max(1.0 - d * d / (rr * rr), 0.0)));
        st = mix(st, st * 0.55, (1.0 - smoothstep(rr, rr + 0.6, length(cr - (ci + 0.5) * sp))) * 0.6);
        st = mix(st, sk, 1.0 - smoothstep(rr - sa, rr + sa, d));
      }
    }
    col = mix(col, st, inCut);
  }
  // the side of the stand where a path or a cut edge shows it, or the dark ground under real grain
  float te = 1e3;
  if (par.x > 1e-4) te = min(te, (shi.x - rel.x) / par.x); else if (par.x < -1e-4) te = min(te, (slo.x - rel.x) / par.x);
  if (par.y > 1e-4) te = min(te, (shi.y - rel.y) / par.y); else if (par.y < -1e-4) te = min(te, (slo.y - rel.y) / par.y);
  float fh = clamp(te / max(h - 0.2, 0.05), 0.0, 1.0);
  vec2 pe = rel + par * te;
  float streak = kNoise(vec2((pe.x + pe.y) * 11.0, fh * 3.0)) * (1.0 - smoothstep(0.1, 0.6, px));
  vec3 side = tufted ? uStalk[k] * 0.3 : mix(uStalk[k] * 0.3, mix(uStalk[k], uHead[k], 0.7) * 0.95, fh * fh) * (0.85 + 0.3 * streak);
  col = mix(col, side, inS);
  if (inC > 0.0) col = mix(col, canopy(k, rc, alongZ ? rc : rc.yx, seed, px), inC);
  col *= vC.z;
  vec3 Lgt = kLight(vW, up, vF, vec3(0.0, 1.0, 0.0));
  vec2 uv = m / uSize;
  float halo = textureLod(tMask, uv, 2.2).b * 0.5 + textureLod(tMask, uv, 3.4).b + textureLod(tMask, uv, 5.0).b * 0.7;
  vec3 lit = col * (Lgt * mix(1.0, 0.7, inS * (1.0 - inC)) + uLampCol * halo * uLamp * 9.0);
  gl_FragColor = vec4(kAir(lit, vW), 1.0);
}`;

function* plotMesh(hollow, plots, paths) {
  const M = paths ? 0 : PATH;
  const segs = plots.map((p) => Math.max(1, Math.ceil((p.x1 - p.x0 + 2 * M) / 16)));
  let nv = 0, ni = 0; for (const n of segs) { nv += (n + 1) * 2; ni += n * 6; }
  const pos = new Float32Array(nv * 3), a = new Float32Array(nv * 4), b = new Float32Array(nv * 4), c = new Float32Array(nv * 4), idx = new Uint32Array(ni);
  let v = 0, w = 0, t0 = performance.now();
  for (let k = 0; k < plots.length; k++) {
    const p = plots[k];
    if (performance.now() - t0 > 4) { yield 'plot mesh'; t0 = performance.now(); }
    const x0 = p.x0 - M, x1 = p.x1 + M, z0 = p.z0 - M, z1 = p.z1 + M, n = segs[k], base = v;
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      for (let j = 0; j < 2; j++) {
        pos[v * 3] = x; pos[v * 3 + 1] = 0.2; pos[v * 3 + 2] = j ? z1 : z0;
        a[v * 4] = p.x0; a[v * 4 + 1] = p.z0; a[v * 4 + 2] = p.x1 - p.x0; a[v * 4 + 3] = p.z1 - p.z0;
        b[v * 4] = p.k; b[v * 4 + 1] = p.seed; b[v * 4 + 2] = p.dir; b[v * 4 + 3] = p.flags;
        c[v * 4] = p.cutA; c[v * 4 + 1] = p.cutB; c[v * 4 + 2] = p.tint;
        v++;
      }
    }
    for (let i = 0; i < n; i++) { const q = base + i * 2; idx[w++] = q; idx[w++] = q + 1; idx[w++] = q + 2; idx[w++] = q + 2; idx[w++] = q + 1; idx[w++] = q + 3; }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('aA', new Float32BufferAttribute(a, 4));
  g.setAttribute('aB', new Float32BufferAttribute(b, 4));
  g.setAttribute('aC', new Float32BufferAttribute(c, 4));
  g.setIndex(new BufferAttribute(idx, 1));
  g.boundingSphere = new Sphere(new Vector3(0, 0, L / 2), Math.hypot(1500, L / 2) + 10);
  const gu = hollow.ground.material.uniforms, rig = hollow.rig;
  const m = new ShaderMaterial({
    uniforms: {
      ...rig.uniforms, uClip: G.uClip, uTime: G.uTime,
      uBend: { value: new Vector3(hollow.frame.a0, hollow.frame.z0, hollow.frame.floorR) },
      uHead: { value: CROPS.map((k) => vec3col(k.head)) }, uStalk: { value: CROPS.map((k) => vec3col(k.stalk)) }, uH: { value: CROPS.map((k) => k.h) },
      uPath: { value: vec3col(PATHC) }, uStub: { value: vec3col(CROPS[STUBBLE].head) },
      uLampCol: gu.uLampCol, uLamp: gu.uLamp, uSize: gu.uSize, tMask: gu.tMask,
    },
    vertexShader: PLOT_VERT, fragmentShader: plotFrag(rig), side: DoubleSide, defines: paths ? { PATHS: 1 } : {},
    polygonOffset: true, polygonOffsetFactor: paths ? -1 : -2, polygonOffsetUnits: paths ? -1 : -5,
  });
  const mesh = new Mesh(g, m);
  mesh.renderOrder = paths ? -4.5 : -4;
  return mesh;
}

// ---------------------------------------------------------------- real grain near the camera
// A tuft is three stalks and their heads, nine triangles, turned to face the eye about its own upright. Heads droop by
// crop (barley nods, oats hang open). Nothing in a Hollow blows, so a stand moves only where somebody walks along it:
// the grain leans away as she passes and sways back behind her. It also leans out of the way of the camera.
const NWALK = 6;
const TUFT_VERT = /* glsl */`
attribute vec4 aV;      // stalk 0..2, part (0 stalk, 1 head), across (-1..1), along (0..1)
attribute vec4 aT;      // flat x, z, height, seed
attribute vec2 aK;      // crop, tint
${BEND_PARS}
uniform vec3 uHeadC[10]; uniform vec3 uStalkC[10]; uniform vec4 uShape[10];
uniform float uTime, uPx;
uniform vec4 uWA[${NWALK}]; uniform vec4 uWB[${NWALK}];   // walkers: start x, z, velocity x, z | seconds round, phase, on, 0
varying vec3 vW; varying vec3 vCol; varying float vAo;
float h1(float n) { return fract(sin(n) * 43758.5453); }
void main() {
  float s = aV.x, seed = aT.w;
  int k = int(aK.x + 0.5);
  float r1 = h1(seed * 12.9 + s * 7.1), r2 = h1(seed * 3.7 + s * 19.3), r3 = h1(seed * 5.3 + s * 2.9);
  float H = aT.z * (0.84 + 0.28 * r1);
  float off = (s - 1.0) * 0.05 + (r2 - 0.5) * 0.06;
  float lean = (r3 - 0.5) * 0.36;
  vec2 base = aT.xy;
  // people passing along the paths
  vec2 push = vec2(0.0);
  for (int i = 0; i < ${NWALK}; i++) {
    vec4 A = uWA[i], B = uWB[i];
    if (B.z < 0.5) continue;
    float u = fract(uTime / B.x + B.y);
    vec2 wp = A.xy + A.zw * (u * B.x);
    vec2 vd = normalize(A.zw), d = base - wp;
    float sa = dot(d, vd); vec2 lat = d - vd * sa; float ll = length(lat);
    float amp = sa > 0.0 ? 0.55 * smoothstep(0.9, 0.0, sa) : 0.55 * exp(sa / 2.6) * cos(sa * 2.3);
    amp *= smoothstep(2.6, 0.9, ll) * smoothstep(0.0, 0.08, u) * smoothstep(1.0, 0.92, u);
    push += (lat / max(ll, 0.05)) * amp + vd * amp * 0.15;
  }
  float a = uBend.x + base.x / uBend.z, cA = cos(a), sA = sin(a);
  vec3 U = vec3(-cA, -sA, 0.0), X = vec3(-sA, cA, 0.0), Z = vec3(0.0, 0.0, 1.0);
  vec3 P0 = vec3(uBend.z * cA, uBend.z * sA, uBend.y + base.y);
  vec3 toC = cameraPosition - P0; float dC = length(toC);
  vec3 side = cross(U, toC); side = side / max(length(side), 1e-4);
  vec3 foot = P0 + side * off;
  vec3 top = foot + normalize(U + side * lean + X * push.x + Z * push.y) * H;
  // brushed aside by the camera going by
  vec3 dt = top - cameraPosition; dt -= U * dot(dt, U); float dl = length(dt);
  top += (dt / max(dl, 1e-3)) * smoothstep(1.7, 0.3, dl) * 0.4 * H;
  vec3 dir = normalize(top - foot);
  float wMin = dC / uPx * 0.85;
  vec4 sh = uShape[k];
  vec3 P;
  if (aV.y < 0.5) {
    float w = max(0.007, wMin);
    P = foot + side * (aV.z * w) + (top - foot) * aV.w;
    vCol = uStalkC[k]; vAo = mix(0.22, 1.0, aV.w * aV.w);
  } else {
    float len = sh.x * (0.8 + 0.4 * r2), w = max(sh.y, wMin);
    vec3 hd = normalize(dir + side * sh.z * (h1(seed * 1.7) > 0.5 ? 1.0 : -1.0) * (0.6 + 0.4 * r1) - U * sh.z * 0.7);
    vec3 hs = normalize(cross(hd, normalize(toC)));
    P = top + hd * len * aV.w + hs * aV.z * w;
    vCol = mix(uHeadC[k], uStalkC[k], 0.25 * (1.0 - aV.w)); vAo = 1.0;
  }
  vCol *= aK.y;
  vW = P;
  gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.0);
}`;
const tuftFrag = (rig) => /* glsl */`
${CLIP_PARS}
varying vec3 vW; varying vec3 vCol; varying float vAo;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 up = vec3(-normalize(vW.xy), 0.0);
  vec3 Lgt = kLight(vW, up, vW, vec3(0.0, 1.0, 0.0));
  gl_FragColor = vec4(kAir(vCol * Lgt * vAo, vW), 1.0);
}`;

// the nine triangles of a tuft
function tuftBase() {
  const v = [];
  for (let s = 0; s < 3; s++) {
    v.push(s, 0, -1, 0, s, 0, 1, 0, s, 0, 0, 1);
    v.push(s, 1, 0, 0, s, 1, 1, 0.45, s, 1, 0, 1);
    v.push(s, 1, 0, 0, s, 1, 0, 1, s, 1, -1, 0.45);
  }
  return new Float32BufferAttribute(v, 4);
}

function tuftMaterial(hollow) {
  const v4 = () => { const a = []; for (let i = 0; i < NWALK; i++) a.push(new Vector4()); return a; };
  return new ShaderMaterial({
    uniforms: {
      ...hollow.rig.uniforms, uClip: G.uClip, uTime: G.uTime, uPx: G.uPx,
      uBend: { value: new Vector3(hollow.frame.a0, hollow.frame.z0, hollow.frame.floorR) },
      uHeadC: { value: CROPS.map((k) => vec3col(k.head)) }, uStalkC: { value: CROPS.map((k) => vec3col(k.stalk)) },
      uShape: { value: CROPS.map((k) => new Vector4(k.shape[0], k.shape[1], k.shape[2], k.shape[3])) },
      uWA: { value: v4() }, uWB: { value: v4() },
    },
    vertexShader: TUFT_VERT, fragmentShader: tuftFrag(hollow.rig), side: DoubleSide,
  });
}

// Tufts as instanced meshes, one per 16 m cell so what is behind the camera is not drawn.
function tuftMeshes(hollow, mat, tufts) {
  const base = tuftBase(), dummy = new Float32BufferAttribute(new Float32Array(base.count * 3), 3), cells = new Map(), out = [];
  for (const t of tufts) { const key = Math.floor(t[0] / 16) + '_' + Math.floor(t[1] / 16); let a = cells.get(key); if (!a) cells.set(key, a = []); a.push(t); }
  for (const list of cells.values()) {
    const g = new InstancedBufferGeometry();
    g.setAttribute('aV', base);
    g.setAttribute('position', dummy);          // three counts vertices by it; the shader places them from aV

    const T = new Float32Array(list.length * 4), K = new Float32Array(list.length * 2);
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    list.forEach((t, i) => { T.set([t[0], t[1], t[2], t[3]], i * 4); K[i * 2] = t[4]; K[i * 2 + 1] = t[5]; x0 = Math.min(x0, t[0]); x1 = Math.max(x1, t[0]); z0 = Math.min(z0, t[1]); z1 = Math.max(z1, t[1]); });
    g.setAttribute('aT', new InstancedBufferAttribute(T, 4));
    g.setAttribute('aK', new InstancedBufferAttribute(K, 2));
    g.instanceCount = list.length;
    const c = hollow.frame.point((x0 + x1) / 2, 0.8, (z0 + z1) / 2);
    g.boundingSphere = new Sphere(c, Math.hypot(x1 - x0, z1 - z0) / 2 + 3);
    const m = new Mesh(g, mat);
    out.push(m);
  }
  return out;
}

// ---------------------------------------------------------------- sheaves, stooks, stakes
// A sheaf: butts at the origin, heads toward +y, tied at its waist. Takes the instance colour.
function sheafInto(g, a, b) {
  const m = [a[0] + (b[0] - a[0]) * 0.55, a[1] + (b[1] - a[1]) * 0.55, a[2] + (b[2] - a[2]) * 0.55];
  g.tube([a, m, b], (u) => (u < 0.1 ? 0.1 : u < 0.6 ? 0.075 : 0.15), 3, '#ffffff');
}
function stookGeo(near) {
  const g = new Geo(); g.tint(1);
  if (!near) { g.cyl(0, 0, 0, 0.62, 0.16, 1.25, 5, '#ffffff', { smooth: false }); g.cyl(0, 1.25, 0, 0.22, 0.04, 0.22, 5, '#f2ead8', { smooth: false }); return g.build(); }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3, c = Math.cos(a), s = Math.sin(a);
    sheafInto(g, [c * 0.5, 0, s * 0.42], [c * 0.12, 1.22, s * 0.1]);
  }
  return g.build();
}
function lyingSheafGeo() { const g = new Geo(); g.tint(1); sheafInto(g, [-0.55, 0.11, 0], [0.55, 0.15, 0]); return g.build(); }
// a numbered stake: a post with a white label, facing -z
function stakeGeo() {
  const g = new Geo();
  g.box(-0.03, 0, -0.03, 0.03, 0.85, 0.03, '#7a5c3c', { skip: 'b' });
  g.push().rot('x', -0.5);
  g.box(-0.13, 0.62, -0.25, 0.13, 0.8, -0.235, '#f1ebdc', { skip: 'b' });
  g.box(-0.08, 0.7, -0.252, 0.06, 0.73, -0.249, '#3a332c', { skip: 'b' });
  g.pop();
  return g.build();
}

// ---------------------------------------------------------------- people at work
// tint conventions as folk.js: 1 = clothes (the instance colour), 0.35 = legs, 0 = skin and tools. Facing +z.
const poseCache = new Map();
function workerGeo(pose, skin) {
  const key = pose + skin; if (poseCache.has(key)) return poseCache.get(key);
  const g = new Geo();
  const sickle = (h) => { g.tint(0); g.box(h[0] - 0.02, h[1] - 0.02, h[2] - 0.1, h[0] + 0.02, h[1] + 0.02, h[2] + 0.02, '#6a4a2c'); const pts = []; for (let i = 0; i <= 5; i++) { const a = -0.3 + i * 0.6; pts.push([h[0] + Math.sin(a) * 0.16, h[1] - 0.02, h[2] + 0.06 + 0.16 + Math.cos(a) * -0.16 + 0.1]); } g.tube(pts, 0.012, 3, '#d8d4c8'); };
  if (pose === 'reap' || pose === 'tie') {
    const deep = pose === 'tie';
    const hip = [0, 0.82, 0], ang = deep ? 1.35 : 1.05;
    const sh = [0, hip[1] + Math.cos(ang) * 0.6, Math.sin(ang) * 0.6];
    g.tint(0.35);
    g.box(-0.16, 0, -0.1, -0.05, 0.86, 0.02, '#8f8572'); g.box(0.05, 0, 0.0, 0.16, 0.86, 0.12, '#8f8572');
    g.tint(1); g.tube([hip, sh], 0.19, 6, '#ffffff', { smooth: false });
    g.tint(0); g.blob(0, sh[1] + Math.cos(ang) * 0.17 + 0.04, sh[2] + Math.sin(ang) * 0.17, 0.125, 0, skin, { shadeBottom: 0.8 });
    g.tint(1);
    const hl = deep ? [-0.12, 0.28, 0.62] : [-0.14, 0.5, 0.78], hr = deep ? [0.12, 0.26, 0.6] : [0.2, 0.4, 0.66];
    g.tube([[-0.19, sh[1] - 0.02, sh[2] - 0.04], hl], 0.055, 4, '#ffffff', { smooth: false });
    g.tube([[0.19, sh[1] - 0.02, sh[2] - 0.04], hr], 0.055, 4, '#ffffff', { smooth: false });
    if (!deep) { sickle(hr); g.tint(0.6); g.tube([[hl[0] - 0.05, hl[1] - 0.25, hl[2] + 0.05], [hl[0], hl[1] + 0.25, hl[2] - 0.05]], 0.06, 3, '#e0c27a'); }
  } else if (pose === 'give') {
    // Pell: broad, floury, an apron, holding out a heel of the loaf
    g.tint(0.35).box(-0.17, 0, -0.12, 0.17, 0.86, 0.12, '#6a6f7a');
    g.tint(1).cyl(0, 0.8, 0, 0.27, 0.21, 0.66, 7, '#ffffff', { smooth: false });
    g.tint(0).box(-0.2, 0.55, 0.2, 0.2, 1.3, 0.25, '#f6f2ea');
    g.blob(0, 1.62, 0, 0.15, 0, skin, { shadeBottom: 0.8 });
    g.blob(0, 1.73, -0.02, [0.13, 0.06, 0.13], 0, '#e9e4da');
    g.tint(1); g.tube([[-0.22, 1.38, 0], [-0.1, 1.16, 0.42]], 0.065, 4, '#ffffff', { smooth: false }); g.tube([[0.22, 1.38, 0], [0.1, 1.16, 0.42]], 0.065, 4, '#ffffff', { smooth: false });
    g.tint(0); g.blob(0, 1.2, 0.5, [0.13, 0.08, 0.1], 0, '#9a5a2e', { lump: 0.1 });
  } else if (pose === 'flail' || pose === 'carry' || pose === 'jar') {
    g.tint(0.35).box(-0.15, 0, -0.1, 0.15, 0.86, 0.1, '#6a6f7a');
    g.tint(1).cyl(0, 0.82, 0, 0.22, 0.17, 0.62, 6, '#ffffff', { smooth: false });
    g.tint(0).blob(0, 1.6, 0, 0.145, 0, skin, { shadeBottom: 0.8 });
    if (pose === 'flail') {
      g.tint(1); g.tube([[-0.18, 1.36, 0.02], [-0.05, 1.62, 0.32]], 0.05, 4, '#ffffff', { smooth: false }); g.tube([[0.18, 1.36, 0.02], [0.04, 1.55, 0.36]], 0.05, 4, '#ffffff', { smooth: false });
      g.tint(0); g.tube([[0.0, 1.4, 0.2], [0.0, 2.35, 0.6]], 0.025, 4, '#8a6a46'); g.tube([[0.0, 2.35, 0.6], [0.0, 2.0, 1.25]], 0.035, 4, '#6f5338');
    } else if (pose === 'carry') {
      g.tint(1); g.tube([[0.2, 1.36, 0], [0.26, 1.1, 0.22]], 0.05, 4, '#ffffff', { smooth: false });
      g.tint(0.6); g.tube([[0.28, 0.75, -0.25], [0.3, 1.05, 0.05], [0.32, 1.45, 0.4]], 0.13, 4, '#e0c27a');
    } else {
      // a wanderer: a pack on the back, a small jar held in front with both hands
      g.tint(1); g.tube([[-0.18, 1.36, 0], [-0.06, 1.1, 0.24]], 0.05, 4, '#ffffff', { smooth: false }); g.tube([[0.18, 1.36, 0], [0.06, 1.1, 0.24]], 0.05, 4, '#ffffff', { smooth: false });
      g.tint(0); g.cyl(0, 1.08, 0.27, 0.045, 0.045, 0.1, 6, '#e8efe8'); g.cyl(0, 1.18, 0.27, 0.048, 0.048, 0.025, 6, '#8a5a34');
      g.tint(0.25); g.box(-0.15, 0.98, -0.32, 0.15, 1.42, -0.14, '#b39b72'); g.box(-0.17, 1.42, -0.3, 0.17, 1.5, -0.15, '#d8c8a4');
    }
  }
  const geo = g.build(); poseCache.set(key, geo); return geo;
}
// workers as instanced figures: spots { p, yaw, pose, color }
function workers(hollow, spots) {
  const groups = new Map(), rng = makeRng('spelt-workers');
  for (const s of spots) { const skin = s.skin || SKIN[Math.floor(rng() * 5)]; const key = s.pose + '|' + skin; let a = groups.get(key); if (!a) groups.set(key, a = { pose: s.pose, skin, items: [] }); a.items.push({ p: s.p, yaw: s.yaw, scale: s.scale || 0.92 + 0.16 * rng(), color: s.color || CLOTH[Math.floor(rng() * CLOTH.length)] }); }
  const out = [];
  for (const g of groups.values()) for (const m of instances(workerGeo(g.pose, g.skin), hollow.lit, g.items, { frame: hollow.frame, cell: 300 })) out.push(m);
  return out;
}

// ---------------------------------------------------------------- the bakehouse by the lake
// Long and low, its front to the walk (-x), five doors open on the ovens, racks of loaves under an awning before it.
const LOAF = ['#8a4f2a', '#a5632f', '#b9773a', '#7a4424', '#c08a4a'];
function bakehouse(g, glows, loaves) {
  const { x0, x1, z0, z1 } = BAKE, zm = (z0 + z1) / 2, H = 4.2, R = 7.4, xm = (x0 + x1) / 2;
  const lime = '#ecdfc6', lime2 = '#e2d2b4', post = '#6b4a30', roof = '#94573a', roof2 = '#7c472e';
  g.box(x0 - 0.4, 0, z0 - 0.4, x1 + 0.4, 0.3, z1 + 0.4, '#bfae8e');
  g.box(x1 - 0.5, 0.3, z0, x1, H, z1, lime2, { skip: 'b' });
  g.box(x0, 0.3, z0, x1, H, z0 + 0.5, lime, { skip: 'b' }); g.box(x0, 0.3, z1 - 0.5, x1, H, z1, lime, { skip: 'b' });
  // the inside: a warm back wall, oven mouths glowing along it, a floor, racks in silhouette
  g.box(x0 + 0.5, 0.3, z0 + 0.5, x1 - 0.5, 0.32, z1 - 0.5, '#a08060');
  g.quad([x1 - 0.55, 0.3, z1 - 0.5], [x1 - 0.55, 0.3, z0 + 0.5], [x1 - 0.55, H, z0 + 0.5], [x1 - 0.55, H, z1 - 0.5], '#ffcf94', 0.9);
  for (let z = z0 + 3; z < z1 - 2; z += 5.5) { g.box(x1 - 1.6, 0.3, z, x1 - 0.55, 2.2, z + 3.6, '#5a4a3e', { skip: 'b' }); g.box(x1 - 1.62, 0.9, z + 0.5, x1 - 1.6, 1.7, z + 3.1, '#ff9a44', { emit: 5 }); }
  g.quad([x0 + 0.2, H - 0.05, z0], [x1, H - 0.05, z0], [x1, H - 0.05, z1], [x0 + 0.2, H - 0.05, z1], '#e6c99a', 0.5);
  // the front: five open doors, lit windows between, timber posts
  const doors = [], nd = 5;
  for (let i = 0; i < nd; i++) doors.push(z0 + ((z1 - z0) * (i + 0.5)) / nd);
  let zc = z0 + 0.5;
  for (const dz of doors) {
    const a = dz - 1.7, b = dz + 1.7;
    g.box(x0, 0.3, zc, x0 + 0.5, H, a, lime, { skip: 'b' });
    g.box(x0, 3.1, a, x0 + 0.5, H, b, lime, { skip: 'b' });
    g.box(x0 - 0.06, 0.3, a - 0.18, x0 + 0.02, 3.2, a, post); g.box(x0 - 0.06, 0.3, b, x0 + 0.02, 3.2, b + 0.18, post); g.box(x0 - 0.06, 3.1, a, x0 + 0.02, 3.3, b, post);
    for (const s of [-1, 1]) { const w = s < 0 ? a : b; g.quad([x0 - 1.4, 0.3, w + s * 0.04], [x0, 0.3, w], [x0, 3.05, w], [x0 - 1.4, 3.05, w + s * 0.04], '#7a5638'); }
    glows.push({ p: [x0 + 1.5, 2.6, dz], color: '#ffc982', power: 3.5, size: 2.2 });
    zc = b;
  }
  g.box(x0, 0.3, zc, x0 + 0.5, H, z1 - 0.5, lime, { skip: 'b' });
  for (let i = 0; i < nd - 1; i++) {
    const wz = (doors[i] + doors[i + 1]) / 2;
    g.box(x0 - 0.04, 1.3, wz - 1.1, x0, 2.7, wz + 1.1, '#ffd391', { emit: 3.2 });
    g.box(x0 - 0.08, 1.95, wz - 1.15, x0 - 0.03, 2.05, wz + 1.15, post);
    glows.push({ p: [x0 - 0.3, 2.0, wz], color: '#ffc27a', power: 2.2, size: 1.6 });
  }
  // the roof: tiles the colour of a good crust, a row of vents along the ridge, gable ends
  const e = 0.9, ex0 = x0 - e, ex1 = x1 + e, ez0 = z0 - e, ez1 = z1 + e;
  g.quad([ex0, H - 0.3, ez1], [xm, R, ez1], [xm, R, ez0], [ex0, H - 0.3, ez0], roof);
  g.quad([xm, R, ez1], [ex1, H - 0.3, ez1], [ex1, H - 0.3, ez0], [xm, R, ez0], roof2);
  g.quad([ex0, H - 0.3, ez0], [xm, R, ez0], [xm, R, ez1], [ex0, H - 0.3, ez1], '#5a3a26');
  g.quad([xm, R, ez0], [ex1, H - 0.3, ez0], [ex1, H - 0.3, ez1], [xm, R, ez1], '#5a3a26');
  for (let k = 1; k < 9; k++) {
    const f = k / 9, y = H - 0.3 + (R - H + 0.3) * f + 0.04;
    g.quad([ex0 + (xm - ex0) * f, y, ez1], [ex0 + (xm - ex0) * f + 0.12, y + 0.06, ez1], [ex0 + (xm - ex0) * f + 0.12, y + 0.06, ez0], [ex0 + (xm - ex0) * f, y, ez0], '#6e3d26');
    g.quad([ex1 - (ex1 - xm) * f - 0.12, y + 0.06, ez1], [ex1 - (ex1 - xm) * f, y, ez1], [ex1 - (ex1 - xm) * f, y, ez0], [ex1 - (ex1 - xm) * f - 0.12, y + 0.06, ez0], '#5e3420');
  }
  g.box(xm - 0.25, R - 0.15, ez0, xm + 0.25, R + 0.15, ez1, '#6a3a24');
  g.tri([x0, H, z0], [xm, R - 0.1, z0], [x1, H, z0], lime2); g.tri([x1, H, z1], [xm, R - 0.1, z1], [x0, H, z1], lime2);
  for (let z = z0 + 5; z < z1 - 3; z += 8) g.box(xm - 0.9, R - 0.4, z, xm + 0.9, R + 0.9, z + 2.2, '#9a7a5a', { top: '#7a5a40' });
  // the awning on posts, and racks of loaves under it
  const ax = x0 - 4.2;
  g.quad([ax, 3.05, z1 - 1], [x0, 3.75, z1 - 1], [x0, 3.75, z0 + 1], [ax, 3.05, z0 + 1], '#d8c49c');
  g.quad([ax, 3.05, z0 + 1], [x0, 3.75, z0 + 1], [x0, 3.75, z1 - 1], [ax, 3.05, z1 - 1], '#b49c74');
  for (let z = z0 + 1; z <= z1 - 1; z += 4.5) g.cyl(ax + 0.15, 0.3, z, 0.08, 0.07, 2.78, 5, post);
  const rng = makeRng('spelt-loaves');
  for (let z = z0 + 2.2; z < z1 - 3; z += 3.1) {
    if (Math.abs(z + 1.2 - zm) < 3.4) continue;
    const rx0 = x0 - 2.9, rx1 = x0 - 2.2, rz0 = z, rz1 = z + 2.5;
    for (const [px, pz] of [[rx0, rz0], [rx1, rz0], [rx0, rz1], [rx1, rz1]]) g.box(px - 0.03, 0.3, pz - 0.03, px + 0.03, 2.2, pz + 0.03, post);
    for (let s = 0; s < 5; s++) {
      const y = 0.55 + s * 0.38;
      g.box(rx0, y, rz0, rx1, y + 0.03, rz1, '#9a7650');
      for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) if (rng() < 0.9) loaves.push({ p: [rx0 + 0.18 + j * 0.34, y + 0.03, rz0 + 0.17 + i * 0.3], yaw: rng.f(-0.3, 0.3), scale: rng.f(0.85, 1.15), color: rng.pick(LOAF) });
    }
  }
  // the table where heels are handed out, by the middle door, with baskets on it
  g.box(x0 - 5.2, 0.85, zm - 2.6, x0 - 4.2, 0.92, zm + 2.6, '#a9845a');
  for (const dz of [-2.4, 2.4]) for (const dx of [-5.1, -4.3]) g.box(x0 + dx - 0.04, 0, zm + dz - 0.04, x0 + dx + 0.04, 0.85, zm + dz + 0.04, post);
  for (const dz of [-1.8, 0, 1.6]) { g.cyl(x0 - 4.7, 0.92, zm + dz, 0.32, 0.38, 0.2, 9, '#b8955e'); for (let i = 0; i < 6; i++) loaves.push({ p: [x0 - 4.7 + rng.f(-0.2, 0.2), 1.06, zm + dz + rng.f(-0.2, 0.2)], yaw: rng.f(0, 6), scale: 0.8, color: rng.pick(LOAF) }); }
  // crates of jars beside it: the spoons, waiting to go down to the crock room
  for (let i = 0; i < 3; i++) { const cz = zm + 3.4 + i * 0.7; g.box(x0 - 4.9, 0, cz, x0 - 4.3, 0.32, cz + 0.55, '#8a6a46'); for (let j = 0; j < 6; j++) g.cyl(x0 - 4.8 + (j % 3) * 0.2, 0.32, cz + 0.12 + Math.floor(j / 3) * 0.28, 0.05, 0.05, 0.11, 6, '#dfe8e2'); }
  return { zm, doors };
}
function loafGeo() { const g = new Geo(); g.tint(1).blob(0, 0.07, 0, [0.15, 0.085, 0.12], 0, '#ffffff', { lump: 0.08, shadeBottom: 0.7 }); return g.build(); }

// ---------------------------------------------------------------- the threshing yard
function threshing(g, lie, spots, glows) {
  const cx = TFX, cz = TFZ, rng = makeRng('spelt-thresh');
  g.cyl(cx, 0, cz, 16.4, 16, 0.18, 24, '#b99a70', { top: '#d2b88c' });
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; g.box(cx + Math.cos(a) * 3 - 0.02, 0.18, cz + Math.sin(a) * 3 - 0.02, cx + Math.cos(a) * 3 + 0.02, 0.185, cz + Math.sin(a) * 3 + 0.02, '#c4a87c'); }
  g.cyl(cx, 0.18, cz, 2.8, 0.25, 1.15, 14, '#cc9c58');
  // sheaves laid out in a ring for the flails, and the flailers round them
  for (let i = 0; i < 70; i++) { const a = (i / 70) * Math.PI * 2 + rng.f(-0.04, 0.04), r = rng.f(6.5, 10.5); lie.push({ p: [cx + Math.cos(a) * r, 0.1, cz + Math.sin(a) * r], yaw: -a + rng.f(-0.3, 0.3), color: rng.pick(['#e2bd76', '#d8ad62', '#c9a46e']) }); }
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.2, r = 11.6; spots.push({ p: [cx + Math.cos(a) * r, 0.18, cz + Math.sin(a) * r], yaw: Math.atan2(-Math.cos(a), -Math.sin(a)), pose: 'flail' }); }
  for (let i = 0; i < 5; i++) { const a = rng.f(0, 6.28), r = rng.f(3.4, 5); spots.push({ p: [cx + Math.cos(a) * r, 0.18, cz + Math.sin(a) * r], yaw: rng.f(0, 6.28), pose: rng.chance(0.5) ? 'carry' : 'flail' }); }
  // ricks: round stacks of sheaves under thatch, along the yard's far side
  g.tint(1);
  for (let i = 0; i < 5; i++) {
    const x = cx - 32 + i * 16, z = cz + 28;
    g.cyl(x, 0, z, 3.2, 3.5, 3.4, 12, '#ecd08e', { smooth: false });
    for (let k = 1; k < 4; k++) g.cyl(x, k * 0.85, z, 3.36 - k * 0.03, 3.36 - k * 0.03, 0.06, 12, '#c9a560', { smooth: false, cap: false });
    g.cyl(x, 3.4, z, 3.9, 0.3, 2.9, 12, '#dcb872', { smooth: false });
    g.cyl(x, 6.3, z, 0.32, 0.05, 0.6, 5, '#9a7a48');
  }
  g.tint(0);
  // an open shed with sacks of grain
  const sx = cx + 18, sz = cz - 33;
  for (const dx of [0, 6, 12, 18]) for (const dz of [0, 8]) g.cyl(sx + dx, 0, sz + dz, 0.14, 0.12, 3.6, 5, '#6b4a30');
  g.quad([sx - 1, 3.4, sz + 9], [sx + 19, 3.4, sz + 9], [sx + 19, 4.4, sz - 1], [sx - 1, 4.4, sz - 1], '#8f6a48');
  g.quad([sx - 1, 4.4, sz - 1], [sx + 19, 4.4, sz - 1], [sx + 19, 3.4, sz + 9], [sx - 1, 3.4, sz + 9], '#6a4c34');
  for (let i = 0; i < 46; i++) { const x = sx + 0.8 + (i % 23) * 0.75, z = sz + 1.5 + Math.floor(i / 23) * 1.2 + rng.f(-0.1, 0.1); g.blob(x, 0.4, z, [0.32, 0.42, 0.26], 0, '#ddd0b2', { lump: 0.15, seed: i }); }
  // straw heaps
  for (let i = 0; i < 6; i++) { const a = -2.6 + i * 0.5, r = rng.f(21, 26); g.tint(1).cyl(cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r, rng.f(2.2, 3.2), 0.4, rng.f(1.4, 2.0), 10, '#ead08f').tint(0); }
  // two winnowers at the floor's edge with flat baskets, the chaff falling slowly away in the lamplight
  for (let i = 0; i < 2; i++) {
    const a = 1.2 + i * 0.5, x = cx + Math.cos(a) * 17.5, z = cz + Math.sin(a) * 17.5;
    spots.push({ p: [x, 0, z], yaw: a, pose: 'carry' });
    g.cyl(x + Math.cos(a) * 0.45, 1.25, z + Math.sin(a) * 0.45, 0.36, 0.42, 0.08, 9, '#b8955e');
    for (let k = 0; k < 40; k++) glows.push({ p: [x + Math.cos(a) * rng.f(0.4, 1.4), rng.f(0.6, 1.3), z + Math.sin(a) * rng.f(0.4, 1.4)], color: '#ffd69a', power: 0.8, size: 0.06, move: [Math.cos(a) * 0.25, -0.25, Math.sin(a) * 0.25], loop: 4, phase: rng() });
  }
}

// ---------------------------------------------------------------- the world
const ZM = (BAKE.z0 + BAKE.z1) / 2;
const SUN = '#ffd09a', AMB = '#9a8574';
// the flight: ear height in a strip of wheat with the reapers ahead; up until the quilt closes overhead; down over the
// stooks and the threshing floor; along the bakehouse and its queue; out over the orchard to the lake
const KEYS = [
  { t: 0, p: [XS, 1.75, ZS] },
  { t: 7, p: [XS, 1.95, ZS + 22] },
  { t: 12, p: [XS + 1, 8, ZR + 14], look: [XS + 20, 40, ZR + 260] },
  { t: 20, p: [XS + 40, 110, ZR + 140], look: [XS + 700, 2000, ZR + 900], fov: 64 },
  { t: 27, p: [TFX - 130, 75, TFZ - 120], look: [TFX + 500, 900, TFZ + 300], fov: 62 },
  { t: 31, p: [TFX - 95, 48, TFZ - 80], look: [TFX + 60, 60, TFZ + 60] },
  { t: 35, p: [TFX - 42, 24, TFZ - 32], look: [TFX + 4, 0, TFZ + 4] },
  { t: 39, p: [TFX + 28, 15, TFZ + 28], look: [TFX + 120, 2, TFZ + 110] },
  { t: 44, p: [BAKE.x0 - 46, 10, ZM - 46], look: [BAKE.x0 - 8, 1.5, ZM - 14] },
  { t: 49, p: [BAKE.x0 - 9, 3.4, ZM - 7], look: [BAKE.x0 - 4.5, 1.4, ZM] },
  { t: 53, p: [BAKE.x0 - 7, 9, ZM + 30], look: [BAKE.x0 + 30, 6, ZM + 70] },
  { t: 58, p: [ORCH.x0 + 110, 28, ZM + 44] },
  { t: 64, p: [ORCH.x1 + 150, 45, ZM + 14] },
];

// distance from a point to a plot's rectangle, flat
const rectD = (p, x, z) => Math.hypot(Math.max(p.x0 - x, 0, x - p.x1), Math.max(p.z0 - z, 0, z - p.z1));

function* grainNear(plots, low) {
  const tufts = []; let t0 = performance.now();
  const lowest = low.filter((q) => q.y < 16 && q.x > XS + 60), dcache = new Map();
  for (const p of plots) {
    if ((p.flags & 1) || p.near > 30 || CROPS[p.k].h < 0.3) continue;
    let pn = 1e9; for (const q of lowest) pn = Math.min(pn, rectD(p, q.x, q.z));
    if (pn > 35) continue;
    const kind = p.k, h = CROPS[kind].h, S = 0.22;
    // the standing part's rectangle
    const sA = p.cutA < 0.001 ? p.cutB : 0, sB = p.cutA < 0.001 ? 1 : p.cutA;
    if (sB - sA < 0.001) continue;
    const r = p.dir ? [p.x0, p.z0 + (p.z1 - p.z0) * sA, p.x1, p.z0 + (p.z1 - p.z0) * sB] : [p.x0 + (p.x1 - p.x0) * sA, p.z0, p.x0 + (p.x1 - p.x0) * sB, p.z1];
    for (let z = r[1] + 0.05; z < r[3]; z += S) {
      for (let x = r[0] + 0.05; x < r[2]; x += S) {
        const e = Math.min(x - r[0], r[2] - x, z - r[1], r[3] - z);
        if (e > 3.2) { x = Math.max(x, r[2] - 3.3); if (x >= r[2]) break; continue; }
        const ix = Math.round(x * 5), iz = Math.round(z * 5);
        if (hash2(ix, iz, 3) > 0.75 * (1 - smoothstep(1.6, 3.2, e))) continue;
        const ck = Math.floor(x / 3) * 4096 + Math.floor(z / 3);
        let dd = dcache.get(ck); if (dd === undefined) { dd = nearPath(lowest, x, z); dcache.set(ck, dd); }
        if (dd > 35) continue;
        tufts.push([x + (hash2(ix, iz, 5) - 0.5) * S, z + (hash2(ix, iz, 7) - 0.5) * S, h * (0.92 + 0.12 * hash2(ix >> 4, iz >> 4, 17)), hash2(ix, iz, 11) * 100, kind, 0.85 + 0.3 * hash2(ix, iz, 13)]);
      }
      if (performance.now() - t0 > 4) { yield 'grain'; t0 = performance.now(); }
    }
  }
  for (const p of plots) {
    if (!(p.flags & 1)) continue;
    const S = 0.2, kind = p.k, h = CROPS[kind].h;
    const cz = p.cutB > p.cutA ? p.z0 + (p.z1 - p.z0) * p.cutA : 1e9;
    for (let z = p.z0 + 0.1; z < p.z1 - 0.05; z += S) {
      const stub = z >= cz;
      for (let x = p.x0 + 0.05; x < p.x1 - 0.05; x += S) {
        const ix = Math.round(x * 5), iz = Math.round(z * 5);
        const d = Math.abs(x - XS);
        let dens = 19 * (1 - 0.78 * smoothstep(1.5, 16, d));
        if (stub) dens *= 0.4;
        if (hash2(ix, iz, 3) * 25 > dens) continue;
        const tx = x + (hash2(ix, iz, 5) - 0.5) * S, tz = z + (hash2(ix, iz, 7) - 0.5) * S;
        // a ragged edge where the reapers have got to
        if (!stub && tz > cz - hash2(ix, 0, 9) * 0.5) continue;
        if (stub) tufts.push([tx, tz, 0.17, hash2(ix, iz, 11) * 100, STUBBLE, 0.9 + 0.2 * hash2(ix, iz, 13)]);
        else tufts.push([tx, tz, h * (0.92 + 0.12 * hash2(ix >> 4, iz >> 4, 17)), hash2(ix, iz, 11) * 100, kind, 0.85 + 0.3 * hash2(ix, iz, 13)]);
      }
      if (performance.now() - t0 > 4) { yield 'grain'; t0 = performance.now(); }
    }
  }
  return tufts;
}

export const speltLoaf = {
  id: 'spelt-loaf',
  title: 'A baker\'s dawn',
  drum: 'Spelt', row: 'Grain Row', kind: 'a maker drum', light: 23.7,
  line: 'Grain trial plots right round the sky, and a queue at the bakehouse with a spoon each. This year\'s mother has two hundred and twelve drums in it, and now ours.',
  tone: '#e9b979',
  source: 'wander-year.md (Day 290), food-system.md (Tier 3), three-nights 15-canon.js (Spelt)',
  sound: { root: 45, scale: 'mixo', pad: 0.5, air: 0.3, water: 0.15, crowd: 0.3, bells: 0.15, bright: 0.55 },
  *build(ctx) {
    const { plots, paths } = yield* layout();
    const plan = new Plan([Math.min(2048, ctx.q.plan[0]), Math.min(1024, ctx.q.plan[1])]);
    const pav = paintSpelt(plan, plots);
    yield 'plan queued';
    const walls = { lit: 0.4, crowd: 0.2, stone: '#ecdcc0', stone2: '#dcc09c', houses: ['#e9b979', '#c98f5a', '#efe0c4', '#b9774a', '#d9b48a', '#f1e6cf'], houseMix: 0.55, winA: '#ffb35c', winB: '#ffe0a8', gardenColor: '#8f9a58', awning: '#a8582e', winPower: 1.8 };
    const hollow = yield* buildHollow(ctx, {
      seed: 'spelt', plan, pavilions: false,
      light: { sun: SUN, sunPower: 0.45, amb: AMB, ambPower: 0.22, bounce: '#e0b070', bouncePower: 0.28, air: '#e9c08a', airDensity: 0.00008 },
      sunline: { power: 24 },
      ground: { rows: [7, 6], canopy: '#6f7f45', blossomShare: 0, fruitShare: 0.35, fruit: '#c8702c', lamp: 0.24, lampColor: '#ffbe70', people: 0.15, sunRod: 24, stripes: 0 },
      front: walls, back: walls,
    });
    yield 'hollow';
    const scene = new Scene();
    scene.add(hollow.group);
    hollow.add(instances(pavilionGeo(), hollow.lit, pav.map((q) => ({ p: [q[0], 0, q[1]], yaw: (q[0] * 0.37) % 6.28 })), { frame: hollow.frame, cell: 1200 }));
    yield 'pavilions';
    const path = makePath(KEYS, { frame: hollow.frame, entryRadius: 1.0, exitRadius: 30 });
    const pts = path.points(0.5), low = pts.filter((q) => q.y < 80), coarse = low.filter((_, i) => i % 3 === 0);
    let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9;
    for (const q of coarse) { bx0 = Math.min(bx0, q.x); bx1 = Math.max(bx1, q.x); bz0 = Math.min(bz0, q.z); bz1 = Math.max(bz1, q.z); }
    // how near each plot comes to the low part of the flight; stubble near it gets real stooks
    let t0 = performance.now();
    for (const p of plots) {
      p.near = 1e9;
      if (p.x1 < bx0 - 120 || p.x0 > bx1 + 120 || p.z1 < bz0 - 120 || p.z0 > bz1 + 120) continue;
      for (const q of coarse) { const d = rectD(p, q.x, q.z); if (d < p.near) p.near = d; }
      if ((p.flags & 2) && p.near < 90) p.flags |= 4;
      if (performance.now() - t0 > 4) { yield 'plots near'; t0 = performance.now(); }
    }
    hollow.add(yield* plotMesh(hollow, paths, true));
    hollow.add(yield* plotMesh(hollow, plots, false));
    yield 'plot mesh';
    const tufts = yield* grainNear(plots, low);
    hollow.add(tuftMeshes(hollow, tuftMaterial(hollow), tufts));
    yield 'grain meshes';
    yield* dress(hollow, plots, pts, low, ctx);
    hollow.lampPosts({ near: coarse, radius: 220, power: 2.6 });
    yield 'lamps';
    yield* orchard(hollow, low);

    const look = { exposure: 1.6, bloom: 0.22, threshold: 0.75, saturation: 1.02, contrast: 1.08, vignette: 0.45 };
    const update = (t) => {
      const s = smoothstep(0, 60, t);
      hollow.rig.set({ sun: SUN, sunPower: 0.4 + 0.22 * s, sunFar: SUN, sunFarPower: 0.4 + 0.22 * s, amb: AMB, ambPower: 0.22 });
      hollow.setNight(0.24 - 0.12 * s, 0.42 - 0.12 * s);
    };
    update(0);
    return { scene, path, hollow, near: 0.12, far: 9000, look, update, portal: { mist: '#e9b979' } };
  },
};

// What the flight passes: the reapers and binders in the start block, sheaves and stooks, stakes at the plots, people
// walking the paths through the grain, the threshing floor, the bakehouse and its queue.
function* dress(hollow, plots, pts, low, ctx) {
  const rng = makeRng('spelt-dress');
  const spots = [], lie = [], stN = [], stF = [], stakes = [], glows = [], loaves = [], folk = [];
  // reapers in a line across the strips at ZR, binders behind them, sheaves lying, carriers taking them to the stooks
  for (const p of plots) {
    if (!p.reap) continue;
    const w = p.x1 - p.x0, col = stookCol(p.k);
    for (let i = 0; i < 2; i++) spots.push({ p: [p.x0 + w * (0.28 + 0.44 * i) + rng.f(-0.4, 0.4), 0, ZR + 0.5 + rng.f(0, 0.5)], yaw: Math.PI + rng.f(-0.35, 0.35), pose: 'reap' });
    spots.push({ p: [p.x0 + w * rng.f(0.3, 0.7), 0, ZR + rng.f(3, 5)], yaw: rng.f(0, 6.28), pose: 'tie' });
    if (rng.chance(0.6)) spots.push({ p: [p.x0 + w * rng.f(0.2, 0.8), 0, ZR + rng.f(14, 24)], yaw: rng.chance(0.5) ? 0 : Math.PI, pose: 'carry' });
    for (let i = 0; i < 7; i++) lie.push({ p: [p.x0 + rng.f(0.6, w - 0.6), 0, ZR + rng.f(1.5, 13)], yaw: rng.f(0, 6.28), color: col });
    for (let z = ZR + 18; z < p.z1 - 2; z += 6) for (let x = p.x0 + 1.6; x < p.x1 - 1; x += 3.3) stN.push({ p: [x + rng.f(-0.3, 0.3), 0, z + rng.f(-0.4, 0.4)], yaw: rng.f(0, 6.28), color: col });
  }
  spots.push({ p: [XS + 0.9, 0, ZR + 1.2], yaw: Math.PI + 0.4, pose: 'carry', color: '#c9563c' });
  yield 'reapers';
  // real stooks where the shader would draw them, near enough to need them
  for (const p of plots) {
    if (!(p.flags & 4)) continue;
    const alongZ = p.dir === 1, S = [p.x1 - p.x0, p.z1 - p.z0];
    const clo = alongZ ? [0, p.cutA * S[1]] : [p.cutA * S[0], 0], chi = alongZ ? [S[0], p.cutB * S[1]] : [p.cutB * S[0], S[1]];
    const sp = [5, 6], ext = [chi[0] - clo[0], chi[1] - clo[1]], n = [Math.floor(ext[0] / sp[0]), Math.floor(ext[1] / sp[1])];
    const off = [(ext[0] - n[0] * sp[0]) / 2, (ext[1] - n[1] * sp[1]) / 2], col = stookCol(p.k);
    for (let i = 0; i < n[0]; i++) for (let j = 0; j < n[1]; j++) {
      const x = p.x0 + clo[0] + off[0] + (i + 0.5) * sp[0], z = p.z0 + clo[1] + off[1] + (j + 0.5) * sp[1];
      const d = nearPath(low, x, z);
      (d < 40 ? stN : stF).push({ p: [x, 0, z], yaw: hash2(i, j, 5) * 6.28, color: col, scale: 0.92 + 0.16 * hash2(i, j, 9) });
    }
  }
  yield 'stooks';
  // numbered stakes at the corners of the plots near the flight
  for (const p of plots) {
    if (p.near > 70) continue;
    stakes.push({ p: [p.x0 + 0.2, 0, p.z0 - 0.3], yaw: 0 }, { p: [p.x1 - 0.2, 0, p.z1 + 0.3], yaw: Math.PI });
  }
  yield 'stakes';
  // the threshing floor and the bakehouse
  const g = new Geo({ maxSeg: 8 });
  threshing(g, lie, spots, glows);
  hollow.add(g.mesh(hollow.lit, hollow.frame));
  yield 'threshing floor';
  const g2 = new Geo({ maxSeg: 8 });
  bakehouse(g2, glows, loaves);
  hollow.add(g2.mesh(hollow.lit, hollow.frame));
  yield 'bakehouse';
  hollow.add(instances(stookGeo(true), hollow.lit, stN, { frame: hollow.frame, cell: 60 }));
  hollow.add(instances(stookGeo(false), hollow.lit, stF, { frame: hollow.frame, cell: 120 }));
  hollow.add(instances(lyingSheafGeo(), hollow.lit, lie, { frame: hollow.frame, cell: 60 }));
  hollow.add(instances(stakeGeo(), hollow.lit, stakes, { frame: hollow.frame, cell: 120 }));
  hollow.add(instances(loafGeo(), hollow.lit, loaves, { frame: hollow.frame, cell: 100 }));
  hollow.glow(glows, { maxPx: 120 });
  yield 'props';
  // Pell at the table, and the queue of wanderers with their jars
  const x0 = BAKE.x0;
  spots.push({ p: [x0 - 3.7, 0, ZM + 0.3], yaw: -Math.PI / 2, pose: 'give', scale: [1.4, 1.12, 1.35], color: '#e8e2d6', skin: SKIN[1] });
  const qline = [[x0 - 6, ZM], [x0 - 15, ZM], [x0 - 15, ZM - 40]];
  let u = 0;
  for (let i = 0; i < qline.length - 1; i++) {
    const a = qline[i], b = qline[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), yaw = Math.atan2(a[0] - b[0], a[1] - b[1]);
    for (; u < len; u += 0.85) { const f = u / len; spots.push({ p: [a[0] + (b[0] - a[0]) * f + rng.f(-0.15, 0.15), 0, a[1] + (b[1] - a[1]) * f + rng.f(-0.15, 0.15)], yaw: yaw + rng.f(-0.3, 0.3), pose: 'jar' }); }
    u -= len;
  }
  hollow.add(workers(hollow, spots));
  yield 'workers';
  // people walking the paths between the strips: the grain leans away from them as they pass
  const lanes = [[-8.9, -1, 50], [8.9, 1, 46], [17.6, -1, 58], [-17.6, 1, 52], [-26.3, -1, 61], [26.3, 1, 49]];
  const walkMat = litMaterial(hollow.rig, { bend: hollow.frame, drift: true });
  const items = [], wa = [], wb = [];
  lanes.forEach(([dx, dir, loop], i) => {
    const sp = 1.05, z0 = dir > 0 ? ZS - 6 : ZR + 26, ph = (i * 0.37) % 1;
    items.push({ p: [XS + dx, 0, z0], yaw: dir > 0 ? 0 : Math.PI, drift: [0, 0, dir * sp, loop], phase: ph, color: rng.pick(CLOTH) });
    wa.push([XS + dx, z0, 0, dir * sp]); wb.push([loop, ph, 1, 0]);
  });
  const fg = figureGeo(SKIN[2], 'stand');
  hollow.add(instances(fg, walkMat, items, { frame: hollow.frame, drift: true }));
  const tm = hollow.group.children.find((m) => m.material && m.material.uniforms && m.material.uniforms.uWA);
  if (tm) { const U = tm.material.uniforms; wa.forEach((w, i) => U.uWA.value[i].set(w[0], w[1], w[2], w[3])); wb.forEach((w, i) => U.uWB.value[i].set(w[0], w[1], w[2], w[3])); }
  // people on the walks, the forecourt and the lawns near the flight
  yield* walkers(hollow, pts, folk, rng, ctx);
  hollow.add(crowd(folk, hollow.walk, { frame: hollow.frame, bob: 0.14, seed: 'spelt-folk' }));
  yield 'folk';
}

function* walkers(hollow, pts, folk, rng, ctx) {
  const near = pts.filter((q) => q.y < 150);
  let t0 = performance.now();
  const n = Math.round(2600 * ctx.density);
  for (let i = 0; i < n * 4 && folk.length < n; i++) {
    const q = near[Math.floor(rng() * near.length)];
    let x = q.x + rng.f(-240, 240), z = q.z + rng.f(-240, 240);
    const inPark = x > PX0 + 6 && x < PX1 - 6 && z > PZ0 + 6 && z < PZ1 - 6;
    if (inPark) {
      if (((x - LAKE.x) / (LAKE.rx + 12)) ** 2 + ((z - LAKE.z) / (LAKE.rz + 12)) ** 2 < 1) continue;
      if (x > BAKE.x0 - 1 && x < BAKE.x1 + 1 && z > BAKE.z0 - 1 && z < BAKE.z1 + 1) continue;
      if (x > ORCH.x0 && x < ORCH.x1 && z > ORCH.z0 && z < ORCH.z1 && rng() < 0.7) continue;
      if (Math.abs(x - BAKE.x0 + 10) < 6 && Math.abs(z - ZM + 20) < 22) continue;
    } else {
      // onto the nearest walk
      const cx = Math.round(x / BW) * BW, rz = ZA + Math.round((z - ZA) / BH) * BH;
      if (Math.abs(x - cx) < Math.abs(z - rz)) x = cx + rng.f(-1.8, 1.8); else z = rz + rng.f(-1.8, 1.8);
      if (z < ZA - 2 || z > ZB + 2) continue;
      if (Math.hypot(x - cx, z - rz) < 9) continue;
    }
    const r = rng();
    folk.push({ p: [((x % C) + C) % C, 0, z], walk: r < 0.4 ? 0 : inPark ? rng.f(1.5, 8) : rng.f(0.8, 1.6), sit: inPark && r < 0.25, child: r > 0.88 });
    if (performance.now() - t0 > 4) { yield 'folk'; t0 = performance.now(); }
  }
}

// The orchard by the lake: real apple trees on the ground's own lattice near the flight (the ground draws the rest),
// and a ring of round trees along the shore walk.
function* orchard(hollow, low) {
  const rng = makeRng('spelt-orchard'), apples = [], round = [];
  const near = low.filter((q) => q.x > ORCH.x0 - 200), R = 105;
  const rows = [7, 6], cross = [1, 2, 3].map((i) => ORCH.z0 + ((ORCH.z1 - ORCH.z0) * i) / 4);
  let t0 = performance.now();
  for (let gz = Math.ceil(ORCH.z0 / rows[1]); (gz + 0.5) * rows[1] < ORCH.z1 - 4; gz++) {
    const z = (gz + 0.5) * rows[1];
    if (cross.some((c) => Math.abs(z - c) < 4.5)) continue;
    for (let gx = Math.ceil(ORCH.x0 / rows[0]); (gx + 0.5) * rows[0] < ORCH.x1 - 4; gx++) {
      const x = (gx + 0.5) * rows[0];
      if (z < ORCH.z0 + 4 || x < ORCH.x0 + 4) continue;
      if (nearPath(near, x, z) > R) continue;
      const k = 0.8 + 0.4 * rng();
      apples.push({ p: [x, 0, z], yaw: rng.f(0, 6.28), scale: 0.92 + 0.16 * rng(), color: rng.chance(0.25) ? [0.5 * k, 0.32 * k, 0.12 * k] : [0.2 * k, 0.27 * k, 0.09 * k] });
    }
    if (performance.now() - t0 > 4) { yield 'orchard'; t0 = performance.now(); }
  }
  for (let i = 0; i < 260; i++) {
    const a = (i / 260) * Math.PI * 2, side = i % 2 ? 1 : -1, r = 1 + (side * 14) / LAKE.rx;
    const x = LAKE.x + Math.cos(a) * (LAKE.rx + 34) * r + rng.f(-2, 2), z = LAKE.z + Math.sin(a) * (LAKE.rz + 30) * r + rng.f(-2, 2);
    round.push({ p: [x, 0, z], yaw: rng.f(0, 6.28), scale: rng.f(0.8, 1.1), color: rng.pick([[0.22, 0.27, 0.1], [0.3, 0.3, 0.11], [0.42, 0.3, 0.12]]) });
  }
  hollow.add(instances(treeGeo('apple'), hollow.lit, apples, { frame: hollow.frame, cell: 150 }));
  hollow.add(instances(treeGeo('round'), hollow.lit, round, { frame: hollow.frame, cell: 300 }));
  hollow.setTreeNear(R * 0.8);
  yield 'trees';
}
