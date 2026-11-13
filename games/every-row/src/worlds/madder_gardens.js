// Madder, Pigment Row: the week they took the Count down. A red dawn over the dye gardens, the only Hollow in the
// journey that is not green: beds of madder (green, with its red roots lifted and laid out), weld in yellow flower,
// woad and indigo in blue-green, drying grounds hung with crimson, rose, ochre and indigo, and coloured rinse water
// running down to the lake (docs/wander-year.md, Day 222; games/three-nights/src/15-canon.js, Madder: "dye gardens of
// madder root and weld along the lake", "the whole row grinds colours, and Madder's are red", palette "Madder rose").
//
// Not canon:
//   - the whole plan of Madder's Hollow: a lake that runs right round the drum, beds in a patchwork both sides of it,
//     drying grounds, works yards with vats, grinding pavilions and racks of pigment cakes, rinse channels to the lake,
//     dark purple-leaved woods in the Dim Ends
//   - the boards in the gardens: the docs put the Count board and the new Ledger at Station Ring 4, down in the Keel.
//     Here a copy of the Ledger has been set up out of doors for the week, with the old Count board propped beside it
//     (its number tiles taken off), and a crowd standing about in front of them
//   - the cloth shirred by people walking the lines (there is no wind), the root mats, the bunting over the square
//   - the hours of dawn are pressed into one minute
import {
  Scene, Color, BufferGeometry, BufferAttribute, Float32BufferAttribute, Uint8BufferAttribute, Mesh, ShaderMaterial, Vector3,
  DoubleSide, CanvasTexture, SRGBColorSpace, Sphere,
} from 'three';
import { Plan, C, L } from '../kit/plan.js';
import { buildHollow, pavilionGeo } from '../kit/hollow.js';
import { makePath } from '../core/path.js';
import { scatterPeople, crowd, SKIN } from '../kit/folk.js';
import { scatterTrees } from '../kit/flora.js';
import { Geo, instances, fitBounds, rgb } from '../kit/geo.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG, NOISE_GLSL, litMaterial, vec3col } from '../kit/mats.js';
import { DRUM } from '../kit/drum.js';
import { makeRng, smoothstep } from '../core/rng.js';

const TAU = Math.PI * 2;

// ---------------------------------------------------------------- the plan
// The lake runs right round the drum, a ribbon about 300 m wide that wanders along the axis.
const lakeZ = (x) => 2400 + 90 * Math.sin((TAU * x) / C * 3 + 0.6) + 40 * Math.sin((TAU * x) / C * 7 + 2.1);
const lakeW = (x) => 150 + 45 * Math.sin((TAU * x) / C * 5 + 1.3) + 20 * Math.sin((TAU * x) / C * 11);
const shoreN = (x) => lakeZ(x) - lakeW(x);
const shoreS = (x) => lakeZ(x) + lakeW(x);
const minOver = (f, x0, x1) => { let m = 1e9; for (let x = x0; x <= x1; x += 10) m = Math.min(m, f(x)); return Math.min(m, f(x1)); };
const maxOver = (f, x0, x1) => { let m = -1e9; for (let x = x0; x <= x1; x += 10) m = Math.max(m, f(x)); return Math.max(m, f(x1)); };

// The flight's places. X0 is the drying ground's middle lane.
const X0 = 3100;
const DG = { x0: X0 - 66, x1: X0 + 66, z0: 900, z1: 1222 };          // the drying ground with real cloth
const WY = { x0: X0 - 90, x1: X0 + 95, z0: 1236, z1: 1392 };         // the works yard at the head of the red channel
const CHX = X0 + 24;                                                  // the red channel
const SQX = X0 + 92;                                                  // the square with the boards
const SQS = minOver(shoreN, SQX - 70, SQX + 70);                      // the lake's edge below it
const SQ = { x0: SQX - 62, x1: SQX + 62, z0: SQS - 112, z1: SQS - 20 };
const BZ = SQ.z1 - 14;                                                 // the line the boards stand on

// What grows in a field. fol: the leaves, flo: flowers, k: how much is in flower, lift: share of beds lifted (roots out)
const KINDS = [
  { name: 'madder', fol: '#6c9448', flo: '#6c9448', k: 0, lift: 0.3, w: 28 },
  { name: 'madder lifting', fol: '#6c9448', flo: '#6c9448', k: 0, lift: 0.85, w: 17 },
  { name: 'weld', fol: '#a6aa3c', flo: '#f4d636', k: 0.62, lift: 0, w: 13 },
  { name: 'woad', fol: '#46948e', flo: '#46948e', k: 0, lift: 0, w: 11 },
  { name: 'indigo', fol: '#28588a', flo: '#6a4aa0', k: 0.06, lift: 0, w: 9 },
  { name: 'drying ground', fol: '#e4d4c0', flo: '#e4d4c0', k: 0, lift: 0, w: 8 },
  { name: 'safflower', fol: '#6c8c44', flo: '#f2621e', k: 0.55, lift: 0, w: 7 },
  { name: 'woad in flower', fol: '#46948e', flo: '#ecd036', k: 0.42, lift: 0, w: 7 },
  { name: 'under cloth', fol: '#c4a690', flo: '#c4a690', k: 0, lift: 0, w: 0 },
];
const MED = '#a87a68', WALK = '#cdb09c', ROOT = '#b02426';
const CLOTHS = ['#9c1c2c', '#b8302c', '#d76a74', '#eab0a8', '#c99234', '#d9bd48', '#2c3a78', '#5878b0', '#eee4d4'];

// the colour a field averages to from far off (linear), the same sum the field shader makes
const lin = (c) => rgb(c);
const mixL = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function kindAverage(k) {
  if (k.name === 'under cloth') return lin(k.fol);
  if (k.name === 'drying ground') {
    let s = [0, 0, 0]; for (const c of CLOTHS) { const q = lin(c); s = [s[0] + q[0] / CLOTHS.length, s[1] + q[1] / CLOTHS.length, s[2] + q[2] / CLOTHS.length]; }
    return mixL(lin(k.fol), s, 0.36);
  }
  let leaf = mixL(lin(MED), lin(k.fol), 0.62); leaf = mixL(leaf, lin(k.flo), k.k * 0.55);
  const lifted = mixL(mixL(lin(MED), lin(WALK), 0.2), lin(ROOT), 0.34);
  return mixL(lin(WALK), mixL(leaf, lifted, k.lift), 0.8);
}
const AVG = KINDS.map(kindAverage);
const toHex = (c, k = 1) => '#' + new Color(c[0] * k, c[1] * k, c[2] * k).getHexString();

// Lay out the floor: channels, works yards at their heads, then bands of fields between spinward lanes.
function layout() {
  const rng = makeRng('madder-layout');
  const channels = [], works = [], fields = [], lanes = [];
  const chCols = ['#8e2a32', '#a8404a', '#b09232', '#2e4c80', '#283a66', '#b8642e', '#9a2a40'];
  // north of the lake
  for (let x = 140; x < C - 140; x += rng.f(250, 390)) {
    if (Math.abs(x - CHX) < 260) continue;
    channels.push({ x, z0: rng.f(1420, 1760), z1: shoreN(x) + 20, col: rng.pick(chCols), side: 0 });
  }
  channels.push({ x: CHX, z0: WY.z1 - 6, z1: shoreN(CHX) + 20, col: '#8a1e2c', side: 0, hero: true });
  // south of it
  for (let x = 260; x < C - 140; x += rng.f(260, 420)) channels.push({ x, z0: shoreS(x) - 20, z1: rng.f(2980, 3080), col: rng.pick(chCols), side: 1 });
  for (const ch of channels) {
    if (ch.hero) { works.push({ x0: WY.x0, z0: WY.z0, x1: WY.x1, z1: WY.z1, hero: true }); continue; }
    const w = rng.f(90, 140), d = rng.f(60, 90);
    if (ch.side === 0) works.push({ x0: ch.x - w / 2, z0: ch.z0 - d, x1: ch.x + w / 2, z1: ch.z0 + 4 });
    else works.push({ x0: ch.x - w / 2, z0: ch.z1 - 4, x1: ch.x + w / 2, z1: ch.z1 + d });
  }
  const hit = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;
  const keepOut = [...works, { x0: DG.x0 - 6, z0: DG.z0 - 30, x1: DG.x1 + 6, z1: DG.z1 + 6 }, { x0: SQ.x0 - 8, z0: SQ.z0 - 8, x1: SQ.x1 + 8, z1: SQS + 30 }];
  // bands: north from the Dim End to the lake, south from the lake to the far Dim End
  const bandsN = [], bandsS = [];
  for (let z = 640; z < 2330;) { const d = rng.f(150, 250); bandsN.push([z, Math.min(z + d, 2330)]); z += d; }
  for (let z = 3110; z > 2420;) { const d = rng.f(150, 250); bandsS.push([Math.max(z - d, 2420), z]); z -= d; }
  for (const b of [...bandsN, ...bandsS]) lanes.push(b[0], b[1]);
  const pickKind = (nearWorks) => {
    let tot = 0; for (const k of KINDS) tot += k.w * (nearWorks && k.name === 'drying ground' ? 4 : 1);
    let w = rng() * tot;
    for (let i = 0; i < KINDS.length; i++) { w -= KINDS[i].w * (nearWorks && KINDS[i].name === 'drying ground' ? 4 : 1); if (w <= 0) return i; }
    return 0;
  };
  for (const [side, bands] of [[0, bandsN], [1, bandsS]]) {
    for (const [bz0, bz1] of bands) {
      const z0 = bz0 + 4.5, z1 = bz1 - 4.5;
      const cuts = channels.filter((c) => c.z0 < z1 && c.z1 > z0).map((c) => c.x).sort((a, b) => a - b);
      let x = 0;
      while (x < C - 30) {
        let x1 = Math.min(x + rng.f(55, 185), C);
        if (C - x1 < 40) x1 = C;
        const cut = cuts.find((c) => c > x - 8 && c < x1 + 8);
        let next = x1;
        if (cut !== undefined) { x1 = cut - 8; next = cut + 8; }
        const f = { x0: x + 2.5, x1: x1 - 2.5, z0, z1 };
        x = next;
        if (f.x1 - f.x0 < 25) continue;
        // trim to the lake's promenade
        if (side === 0) f.z1 = Math.min(f.z1, minOver(shoreN, f.x0, f.x1) - 28);
        else f.z0 = Math.max(f.z0, maxOver(shoreS, f.x0, f.x1) + 28);
        if (f.z1 - f.z0 < 30) continue;
        if (keepOut.some((k) => hit(f, k))) {
          // split round what is in the way, along x only, keeping what is left if it is big enough
          const k = keepOut.find((q) => hit(f, q));
          const parts = [{ ...f, x1: Math.min(f.x1, k.x0 - 5) }, { ...f, x0: Math.max(f.x0, k.x1 + 5) }];
          for (const p of parts) if (p.x1 - p.x0 > 25 && !keepOut.some((q) => hit(p, q))) fields.push(p);
          // and what is above or below it
          const top = { ...f, z1: k.z0 - 5 }, bot = { ...f, z0: k.z1 + 5 };
          for (const p of [top, bot]) if (p.z1 - p.z0 > 30 && !keepOut.some((q) => hit(p, q))) fields.push(p);
          continue;
        }
        fields.push(f);
      }
    }
  }
  for (const f of fields) {
    const nearWorks = works.some((w) => Math.abs((w.x0 + w.x1) / 2 - (f.x0 + f.x1) / 2) < 220 && Math.abs((w.z0 + w.z1) / 2 - (f.z0 + f.z1) / 2) < 200);
    f.kind = pickKind(nearWorks);
    f.seed = rng();
    // long beds: the rows mostly run the long way of a field, sometimes across
    f.dir = (f.x1 - f.x0 > f.z1 - f.z0) === rng.chance(0.75) ? 1 : 0;
  }
  // the beds that line the flight down to the lake: madder both sides of the red channel, being lifted
  for (const f of fields) {
    const cx = (f.x0 + f.x1) / 2, cz = (f.z0 + f.z1) / 2;
    if (Math.abs(cx - CHX) < 160 && cz > WY.z1 && cz < SQ.z0) f.kind = rng.pick([0, 1, 1, 2, 6]);
  }
  return { channels, works, fields, lanes };
}

// Paint the plan. Thousands of small shapes go in a few batched layers: each layer call costs the canvas a read-back,
// so one call per field would take tens of seconds.
function paintMadder(plan, lay) {
  const rng = makeRng('madder-plan');
  const many = (name, items, draw, op, style) => {
    for (let i = 0; i < items.length; i += 60) {
      const part = items.slice(i, i + 60);
      plan.layer(name, (cx) => { cx.globalCompositeOperation = op || 'source-over'; if (style) { cx.fillStyle = style; cx.strokeStyle = style; } cx.lineCap = 'round'; cx.lineJoin = 'round'; for (const it of part) draw(cx, it); });
    }
  };
  const lampPts = [];
  const lamps = (pts, spacing) => {
    let carry = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let d = carry; while (d < len) { const t = d / len; lampPts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); d += spacing; }
      carry = d - len;
    }
  };
  const line = (pts) => plan.line(pts);
  // the walks between fields: pale rose gravel over the inert beds
  plan.fill(plan.band(0, L), { color: WALK, paved: 0.35, life: 0.12 });
  // the Dim Ends: woods of purple-leaved trees, dark under the walls, with glades
  plan.fill(plan.band(0, 620), { color: '#5a3a42', wood: 0.95, clear: ['life'] });
  plan.fill(plan.band(L - 620, L), { color: '#553844', wood: 0.95, clear: ['life'] });
  const glades = [];
  for (let i = 0; i < 22; i++) glades.push({ p: plan.blob(rng.f(0, C), rng.chance(0.5) ? rng.f(380, 600) : rng.f(L - 600, L - 380), rng.f(40, 100), rng.f(30, 60), { seed: i + 3, n: 32 }), c: rng.pick(['#9a6a6a', '#8a6060', '#a07a70']) });
  many('alb', glades, (cx, g) => { cx.fillStyle = g.c; cx.fill(g.p); });
  many('mask', glades, (cx, g) => cx.fill(g.p), 'multiply', 'rgb(255,0,255)');
  many('kind', glades, (cx, g) => cx.fill(g.p), 'lighter', 'rgb(0,0,64)');
  // fields, each its own colour from far off; a few people working in them
  many('alb', lay.fields, (cx, f) => { cx.fillStyle = toHex(AVG[f.kind], 0.9 + 0.2 * f.seed); cx.fillRect(f.x0, f.z0, f.x1 - f.x0, f.z1 - f.z0); });
  many('kind', lay.fields, (cx, f) => cx.fillRect(f.x0, f.z0, f.x1 - f.x0, f.z1 - f.z0), 'lighter', 'rgb(0,0,46)');
  // works yards: paving, the vats in rows seen from far off, the grinding pavilions' roofs
  const vatCols = ['#8e2a32', '#a8404a', '#b09232', '#2e4c80'];
  many('alb', lay.works, (cx, w) => {
    cx.fillStyle = '#d4bcaa'; cx.fillRect(w.x0, w.z0, w.x1 - w.x0, w.z1 - w.z0);
    if (w.hero) return;
    cx.fillStyle = vatCols[Math.floor(w.x0) % 4];
    for (let x = w.x0 + 10; x < w.x1 - 10; x += 7) for (let z = w.z0 + 10; z < w.z0 + 30; z += 7) { cx.beginPath(); cx.arc(x, z, 2.2, 0, TAU); cx.fill(); }
    cx.fillStyle = '#b8644e'; cx.fillRect(w.x0 + 12, w.z1 - 34, w.x1 - w.x0 - 24, 20);
  });
  many('kind', lay.works, (cx, w) => cx.fillRect(w.x0, w.z0, w.x1 - w.x0, w.z1 - w.z0), 'lighter', 'rgb(230,0,140)');
  // the drying ground at the start of the flight
  plan.fill(plan.rect(DG.x0, DG.z0, DG.x1, DG.z1), { color: '#e6d6c4', life: 0.5 });
  // the lake, right round the drum, with a walk along each shore
  const top = [], bot = [];
  for (let i = 0; i <= 400; i++) { const x = (i / 400) * C; top.push([x, shoreN(x)]); bot.push([x, shoreS(x)]); }
  const lake = plan.poly([...top, ...bot.slice().reverse()]);
  for (const pts of [top.map((q) => [q[0], q[1] - 12]), bot.map((q) => [q[0], q[1] + 12])]) {
    plan.stroke(line(pts), 18, { color: '#d9c1ae', paved: 0.8, life: 0.7 });
    lamps(pts, 28);
  }
  plan.fill(lake, { color: '#6c4652', water: 1, clear: ['life', 'paved', 'wood', 'rows'] });
  const mid = []; for (let i = 0; i <= 400; i++) { const x = (i / 400) * C; mid.push([x, lakeZ(x)]); }
  plan.stroke(line(mid), 120, { color: '#563442', alpha: 0.6 });
  // rinse channels: coloured water down to the lake, a walk each side, and a stain where each one meets it
  const chs = lay.channels.map((ch) => {
    const pts = []; for (let z = ch.z0; z <= ch.z1; z += 20) pts.push([ch.x + Math.sin(z * 0.004 + ch.x) * (ch.hero ? 0 : 6), z]);
    pts.push([ch.x, ch.z1]);
    lamps(pts.map((q) => [q[0] + 6, q[1]]), 30);
    return { ...ch, path: line(pts), mz: ch.side === 0 ? shoreN(ch.x) + 45 : shoreS(ch.x) - 45, rx: rng.f(50, 90), rz: rng.f(30, 55) };
  });
  many('alb', chs, (cx, c) => { cx.lineWidth = 15; cx.strokeStyle = '#d2b8a4'; cx.stroke(c.path); cx.lineWidth = 6.5; cx.strokeStyle = c.col; cx.stroke(c.path); });
  many('kind', chs, (cx, c) => { cx.lineWidth = 15; cx.stroke(c.path); }, 'lighter', 'rgb(204,0,102)');
  many('kind', chs, (cx, c) => { cx.lineWidth = 6.5; cx.stroke(c.path); }, 'multiply', 'rgb(0,255,0)');
  many('mask', chs, (cx, c) => { cx.lineWidth = 6.5; cx.stroke(c.path); }, 'lighter', 'rgb(255,0,0)');
  many('alb', chs, (cx, c) => {
    cx.save(); cx.translate(c.x, c.mz); cx.scale(1, c.rz / c.rx);
    const g = cx.createRadialGradient(0, 0, 0, 0, 0, c.rx);
    const q = new Color(c.col).convertLinearToSRGB(), rgbS = `${Math.round(q.r * 255)},${Math.round(q.g * 255)},${Math.round(q.b * 255)}`;
    g.addColorStop(0, `rgba(${rgbS},0.7)`); g.addColorStop(0.5, `rgba(${rgbS},0.4)`); g.addColorStop(1, `rgba(${rgbS},0)`);
    cx.fillStyle = g; cx.beginPath(); cx.arc(0, 0, c.rx, 0, TAU); cx.fill(); cx.restore();
  });
  // spinward lanes between the bands, lit
  const lanes = lay.lanes.map((z) => { const pts = []; for (let i = 0; i <= 24; i++) pts.push([(i / 24) * C, z]); lamps(pts, 32); return line(pts); });
  many('alb', lanes, (cx, p) => { cx.lineWidth = 7; cx.stroke(p); }, null, '#d8c0ac');
  many('kind', lanes, (cx, p) => { cx.lineWidth = 7; cx.stroke(p); }, 'lighter', 'rgb(178,0,90)');
  // the square by the red channel's mouth: paving, people, lamps all round
  plan.fill(plan.rect(SQ.x0, SQ.z0, SQ.x1, SQ.z1, 10), { color: '#b89886', paved: 1, life: 0.5 });
  lamps([[SQ.x0, SQ.z0], [SQ.x1, SQ.z0], [SQ.x1, SQ.z1], [SQ.x0, SQ.z1], [SQ.x0, SQ.z0]], 34);
  // trees along the promenades, purple-leaved like the woods, kept off the channel walks and the square
  plan.avenue(top.filter((_, i) => i % 3 === 0).map((q) => [q[0], q[1] - 12]), 13, 22, { color: '#6a3e48', radius: 4 });
  plan.avenue(bot.filter((_, i) => i % 3 === 0).map((q) => [q[0], q[1] + 12]), 13, 22, { color: '#6a3e48', radius: 4 });
  const bare = chs.map((c) => { const zA = c.side === 0 ? shoreN(c.x) - 40 : shoreS(c.x) - 10; return [c.x - 12, zA, 24, 50]; });
  bare.push([SQ.x0 - 10, SQ.z0, SQ.x1 - SQ.x0 + 20, SQS + 2 - SQ.z0]);
  many('mask', bare, (cx, r) => cx.fillRect(r[0], r[1], r[2], r[3]), 'multiply', 'rgb(255,0,255)');
  // lift pavilions, where the lanes cross the walks
  const pav = [];
  for (const z of lay.lanes) for (let x = rng.f(0, 170); x < C - 40; x += rng.f(150, 260)) {
    if (lay.channels.some((c) => Math.abs(c.x - x) < 30 && z > c.z0 - 20 && z < c.z1 + 20)) continue;
    if (x > DG.x0 - 30 && x < DG.x1 + 30 && z > DG.z0 - 30 && z < WY.z1 + 30) continue;
    if (x > SQ.x0 - 30 && x < SQ.x1 + 30 && z > SQ.z0 - 30) continue;
    if (Math.abs(z - lakeZ(x)) < lakeW(x) + 25) continue;
    pav.push([x, z]);
  }
  plan.dots(pav, 9, { color: '#cdbcae', alpha: 0.9, paved: 1, clear: ['wood'] });
  plan.dots(pav, 2.0, { lamp: 0.9 });
  // every lamp at once, remembered so lamp posts can stand near the flight
  plan.dots(lampPts, 2.2, { lamp: 1 });
  for (const q of lampPts) plan.features.push({ type: 'lamp', x: ((q[0] % C) + C) % C, z: q[1], h: 4.5 });
  return pav;
}

// ---------------------------------------------------------------- the beds, drawn crisp over the plan
// One quad per field, cut every 16 m to bend, drawn just above the land. The shader draws its beds and rows (and, in a
// drying ground, its lines of cloth), fading to the field's average colour where they are too fine to see.
const FIELD_VERT = /* glsl */`
attribute vec4 aField;   // kind, seed, rows along x (1) or along z (0), the line left out (under cloth)
attribute vec2 aOrigin;  // the field's corner
${BEND_PARS}
varying vec3 vW; varying vec3 vF; varying vec4 vField; varying vec2 vL;
void main() {
  vec3 p = position, n = vec3(0.0, 1.0, 0.0);
  vF = p; vField = aField;
  vec2 rel = p.xz - aOrigin;
  vL = aField.z > 0.5 ? rel : rel.yx;
  kBend(p, n);
  vW = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const fieldFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform vec3 uFol[9]; uniform vec3 uFlo[9]; uniform vec3 uAvg[9]; uniform float uFloK[9]; uniform float uLift[9];
uniform vec3 uMed, uWalk, uRoot, uLampCol; uniform float uLamp; uniform vec2 uSize;
uniform vec3 uCloth[9];
uniform sampler2D tMask;
varying vec3 vW; varying vec3 vF; varying vec4 vField; varying vec2 vL;
${rig.glsl}
${NOISE_GLSL}
void main() {
  ${CLIP_FRAG}
  int kind = int(vField.x + 0.5);
  float seed = vField.y * 97.0;
  vec2 m = vL;
  float px = max(length(dFdx(vF.xz)), length(dFdy(vF.xz)));
  float fRow = 1.0 - smoothstep(0.22, 0.85, px);
  float fBed = 1.0 - smoothstep(1.4, 4.5, px);
  float tint = 0.9 + 0.2 * vField.y;
  vec3 col; float shade = 1.0;
  if (kind == 8) {
    // the ground under the real lines of cloth: pale gravel, a soft shadow and a little dye under each line
    float li = floor(m.y / 3.0), lv = m.y - li * 3.0;
    float under = (1.0 - smoothstep(0.15, 1.1, abs(lv - 1.5))) * step(0.5, abs(li - vField.w));
    vec3 g = uFol[8] * (0.86 + 0.12 * kNoise(m * 0.9) + 0.06 * kNoise(m * 4.1));
    vec3 stain = uCloth[int(kHash(vec2(li, 3.0)) * 8.99)];
    col = mix(g * (1.0 - 0.55 * under), stain * 0.6, under * 0.25 * kNoise(m * vec2(0.6, 2.0)));
  } else if (kind == 5) {
    // a drying ground: lines of cloth every 3.2 m, a bolt to each colour, gaps between bolts
    float li = floor(m.y / 3.2), lv = m.y - li * 3.2;
    float h = kHash(vec2(li, seed));
    float bolt = floor(m.x / 10.0 + h * 7.0);
    float hb = kHash(vec2(bolt, li + seed));
    vec3 cl = uCloth[int(fract(h * 3.0 + floor(li / 3.0) * 0.37) * 8.99)] * (0.85 + 0.25 * hb);
    float gap = step(fract(m.x / 10.0 + h * 7.0), 0.88);
    float band = (1.0 - smoothstep(0.45, 0.62, abs(lv - 1.6))) * gap;
    float shadow = (1.0 - smoothstep(0.6, 1.2, abs(lv - 1.6))) * gap;
    vec3 g = uFol[5] * (0.95 + 0.08 * kNoise(m * 0.7));
    vec3 near = mix(g * (1.0 - 0.25 * shadow), cl, band);
    vec3 mid = mix(g, uAvg[5] * 1.0, 0.0);
    mid = mix(g, cl, 0.36);
    col = mix(mid, near, fRow);
    shade = 1.0;
  } else {
    float P = 8.0;
    float bi = floor(m.y / P), vb = m.y - bi * P;
    float hb = kHash(vec2(bi, seed));
    float inBed = smoothstep(0.2, 0.45, vb) * (1.0 - smoothstep(6.45, 6.7, vb));
    vec3 fol = uFol[kind], flo = uFlo[kind];
    float flk = uFloK[kind];
    bool lifted = hb < uLift[kind];
    float rv = (vb - 0.4) / 1.55;
    float ri = floor(rv), rf = fract(rv);
    float lump = kNoise(vec2(m.x * 1.6, ri * 13.1 + bi * 3.7 + seed));
    float lump2 = kNoise(vec2(m.x * 5.3, ri * 7.3 + seed + bi));
    vec3 med = uMed * (0.9 + 0.2 * kNoise(m * 2.1));
    vec3 near, bedAvg;
    if (lifted) {
      // roots out of the ground and laid along the rows to dry, red on the pale beds
      float prof = 1.0 - smoothstep(0.1, 0.24 + 0.06 * lump, abs(rf - 0.5));
      float strand = smoothstep(0.3, 0.55, kNoise(vec2(m.x * 3.7, ri * 5.1 + seed)) * 0.6 + kNoise(vec2(m.x * 11.0, rf * 6.0 + ri)) * 0.4);
      vec3 base = mix(uMed, uWalk, 0.2) * (0.92 + 0.12 * lump2);
      near = mix(base, uRoot * (0.75 + 0.5 * lump2), prof * strand);
      bedAvg = mix(mix(uMed, uWalk, 0.2), uRoot, 0.34);
      shade = mix(1.0, 0.92 + 0.12 * prof, fRow);
    } else {
      float prof = 1.0 - smoothstep(0.16, 0.44 + 0.08 * lump, abs(rf - 0.5));
      near = mix(med, fol * (0.72 + 0.45 * lump) * (0.85 + 0.3 * lump2), prof);
      float fl = step(1.0 - flk, kNoise(m * vec2(2.7, 2.1) + seed * 7.0) * 0.55 + kNoise(m * 6.1 + seed) * 0.45) * prof;
      near = mix(near, flo * (0.85 + 0.3 * lump2), fl);
      bedAvg = mix(mix(uMed, fol, 0.62), flo, flk * 0.55);
      shade = mix(1.0, 0.78 + 0.3 * prof, fRow);
    }
    vec3 walk = uWalk * (0.94 + 0.1 * kNoise(m * 0.9));
    near = mix(walk, near, inBed);
    vec3 mid = mix(uWalk, bedAvg * (0.94 + 0.12 * hb), inBed);
    col = mix(mid, near, fRow);
  }
  col = mix(uAvg[kind], col, fBed) * tint;
  vec3 up = vec3(-normalize(vW.xy), 0.0);
  vec3 Lgt = kLight(vW, up, vF, vec3(0.0, 1.0, 0.0));
  vec2 uv = vF.xz / uSize;
  float halo = textureLod(tMask, uv, 2.2).b * 0.5 + textureLod(tMask, uv, 3.4).b + textureLod(tMask, uv, 5.0).b * 0.7;
  vec3 lit = col * (Lgt * shade + uLampCol * halo * uLamp * 9.0);
  gl_FragColor = vec4(kAir(lit, vW), 1.0);
}`;

function fieldMesh(hollow, fields) {
  const pos = [], fa = [], org = [], idx = [];
  for (const f of fields) {
    const n = Math.max(1, Math.ceil((f.x1 - f.x0) / 16)), base = pos.length / 3;
    for (let i = 0; i <= n; i++) {
      const x = f.x0 + ((f.x1 - f.x0) * i) / n;
      for (const z of [f.z0, f.z1]) { pos.push(x, 0.22, z); fa.push(f.kind, f.seed, f.dir, f.gap === undefined ? -9 : f.gap); org.push(f.x0, f.z0); }
    }
    for (let i = 0; i < n; i++) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('aField', new Float32BufferAttribute(fa, 4));
  g.setAttribute('aOrigin', new Float32BufferAttribute(org, 2));
  g.setIndex(idx);
  g.boundingSphere = new Sphere(new Vector3(0, 0, L / 2), Math.hypot(DRUM.RH, L / 2) + 10);
  const gu = hollow.ground.material.uniforms, rig = hollow.rig;
  const v3 = (c) => new Vector3(c[0], c[1], c[2]);
  const m = new ShaderMaterial({
    uniforms: {
      ...rig.uniforms, uClip: G.uClip, uTime: G.uTime,
      uBend: { value: new Vector3(hollow.frame.a0, hollow.frame.z0, hollow.frame.floorR) },
      uFol: { value: KINDS.map((k) => v3(lin(k.fol))) }, uFlo: { value: KINDS.map((k) => v3(lin(k.flo))) },
      uAvg: { value: AVG.map(v3) }, uFloK: { value: KINDS.map((k) => k.k) }, uLift: { value: KINDS.map((k) => k.lift) },
      uMed: { value: vec3col(MED) }, uWalk: { value: vec3col(WALK) }, uRoot: { value: vec3col(ROOT) },
      uCloth: { value: CLOTHS.map((c) => vec3col(c)) },
      uLampCol: gu.uLampCol, uLamp: gu.uLamp, uSize: gu.uSize, tMask: gu.tMask,
    },
    vertexShader: FIELD_VERT, fragmentShader: fieldFrag(rig), side: DoubleSide,
    polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -6,
  });
  const mesh = new Mesh(g, m);
  mesh.renderOrder = -4;
  return mesh;
}

// ---------------------------------------------------------------- cloth
// Lengths of dyed cloth hung over lines at head height. Nothing in a Hollow blows them about: they stir only where
// somebody walks the lane beside them, swinging away from her and settling behind. Each walker is a figure drifting
// along the lane at the same pace (litMaterial's drift), so the stir and the walker keep together.
const CLOTH_VERT = /* glsl */`
attribute vec4 aCol;     // rgb, how much it shines through
attribute vec4 aSheet;   // top (the line), drop, phase, side lean
attribute vec4 aWalkA;   // the walker in the lane on the -x side: start z, signed length of her walk, seconds round, phase
attribute vec4 aWalkB;   // and in the lane on the +x side
${BEND_PARS}
uniform float uTime;
varying vec3 vW; varying vec3 vF; varying vec3 vN; varying vec3 vCol; varying float vHang; varying float vPh;
float push(vec4 w, float z) {
  if (w.z <= 0.0) return 0.0;
  float wz = w.x + w.y * fract(uTime / w.z + w.w);
  float s = (wz - z) * sign(w.y);                       // metres she has gone past this bit of cloth
  float near = smoothstep(-1.6, 0.0, s);
  float after = max(s, 0.0);
  return near * exp(-after / 5.0) * cos(after * 0.9);
}
float disp(vec3 p, float hang) {
  float k = pow(hang, 1.5);
  float drift = 0.03 * sin(uTime * 0.7 + aSheet.z + p.z * 0.3) + 0.02 * sin(uTime * 1.13 + p.z * 0.71 + aSheet.z * 2.0);
  return k * (drift + 0.42 * push(aWalkA, p.z) - 0.42 * push(aWalkB, p.z)) + aSheet.w * hang;
}
void main() {
  vec3 p = position;
  float hang = clamp((aSheet.x - p.y) / aSheet.y, 0.0, 1.0);
  float d = disp(p, hang);
  float dz = disp(p + vec3(0.0, 0.0, 0.25), hang) - d;
  float dy = disp(p, clamp(hang + 0.1, 0.0, 1.0)) - d;
  p.x += d;
  vec3 n = normalize(vec3(1.0, dy / (0.1 * aSheet.y), -dz / 0.25));
  vF = p; vHang = hang; vPh = aSheet.z; vCol = aCol.rgb;
  kBend(p, n);
  vW = p; vN = n;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const clothFrag = (rig) => /* glsl */`
${CLIP_PARS}
varying vec3 vW; varying vec3 vF; varying vec3 vN; varying vec3 vCol; varying float vHang; varying float vPh;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 up = kUp(vW);
  vec3 Ns = normalize(mix(N, up, 0.55));
  // soft folds down the length, the fold over the line a little darker, the hem a little heavier
  float fold = 0.86 + 0.14 * sin(vF.z * 8.5 + vPh * 5.0 + sin(vF.z * 2.3) * 1.5);
  float top = 0.8 + 0.2 * smoothstep(0.0, 0.08, vHang);
  vec3 Lg = kLight(vW, Ns, vF, vec3(0.0, 1.0, 0.0));
  // dyed cloth lets the line's light through
  vec3 through = kSunColor(vW.xy) * min(kSunE(vW, up), 3.0) * 0.22;
  vec3 c = vCol * (Lg + through) * fold * top;
  gl_FragColor = vec4(kAir(c, vW), 1.0);
}`;

function clothMesh(hollow, sheets) {
  let nv = 0, ni = 0;
  for (const s of sheets) { nv += (s.nz + 1) * (s.ny + 1); ni += s.nz * s.ny * 6; }
  const pos = new Float32Array(nv * 3), col = new Uint8Array(nv * 4), sh = new Float32Array(nv * 4), wa = new Float32Array(nv * 4), wb = new Float32Array(nv * 4);
  const idx = new Uint32Array(ni);
  let v = 0, k = 0;
  for (const s of sheets) {
    const base = v, c = rgb(s.col);
    for (let j = 0; j <= s.ny; j++) {
      for (let i = 0; i <= s.nz; i++) {
        const u = i / s.nz, z = s.z0 + (s.z1 - s.z0) * u;
        // the hem is not quite straight
        const drop = s.drop * (1 + 0.012 * Math.sin(u * 9 + s.phase * 3) * (j / s.ny));
        pos[v * 3] = s.x; pos[v * 3 + 1] = s.top - drop * (j / s.ny); pos[v * 3 + 2] = z;
        col[v * 4] = Math.min(255, c[0] * 255); col[v * 4 + 1] = Math.min(255, c[1] * 255); col[v * 4 + 2] = Math.min(255, c[2] * 255); col[v * 4 + 3] = 255;
        sh[v * 4] = s.top; sh[v * 4 + 1] = s.drop; sh[v * 4 + 2] = s.phase; sh[v * 4 + 3] = s.lean;
        for (let q = 0; q < 4; q++) { wa[v * 4 + q] = s.wa[q]; wb[v * 4 + q] = s.wb[q]; }
        v++;
      }
    }
    for (let j = 0; j < s.ny; j++) for (let i = 0; i < s.nz; i++) {
      const a = base + j * (s.nz + 1) + i, b = a + 1, cc = a + s.nz + 1, d = cc + 1;
      idx[k++] = a; idx[k++] = cc; idx[k++] = b; idx[k++] = b; idx[k++] = cc; idx[k++] = d;
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('aCol', new Uint8BufferAttribute(col, 4, true));
  g.setAttribute('aSheet', new Float32BufferAttribute(sh, 4));
  g.setAttribute('aWalkA', new Float32BufferAttribute(wa, 4));
  g.setAttribute('aWalkB', new Float32BufferAttribute(wb, 4));
  g.setIndex(new BufferAttribute(idx, 1));
  const rig = hollow.rig;
  const m = new ShaderMaterial({
    uniforms: { ...rig.uniforms, uClip: G.uClip, uTime: G.uTime, uBend: { value: new Vector3(hollow.frame.a0, hollow.frame.z0, hollow.frame.floorR) } },
    vertexShader: CLOTH_VERT, fragmentShader: clothFrag(rig), side: DoubleSide,
  });
  const mesh = new Mesh(g, m);
  fitBounds(mesh, hollow.frame);
  mesh.geometry.boundingSphere.radius += 2;
  return mesh;
}

// ---------------------------------------------------------------- the boards
// The new Ledger, lit, and the old Count beside it with its number tiles taken off. One picture holds both faces.
function boardFace() {
  const W = 1024, H = 512, cv = document.createElement('canvas'); cv.width = W * 2; cv.height = H;
  const cx = cv.getContext('2d'), rng = makeRng('madder-boards');
  const serif = (s, b) => `${b ? 'bold ' : ''}${s}px Georgia, "Times New Roman", serif`;
  // the Ledger: cream letters on Madder's dark red
  cx.fillStyle = '#2a1416'; cx.fillRect(0, 0, W, H);
  cx.strokeStyle = '#e07a6e'; cx.lineWidth = 8; cx.strokeRect(14, 14, W - 28, H - 28);
  cx.fillStyle = '#fff0ea'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.font = serif(84, true); cx.fillText('LEDGER', W / 2, 78);
  cx.fillStyle = '#e07a6e'; cx.fillRect(W * 0.2, 128, W * 0.6, 4);
  cx.textAlign = 'left'; cx.fillStyle = '#fff0ea'; cx.font = serif(50);
  cx.fillText('Shares', 70, 186); cx.fillText('Margin', 70, 252);
  cx.textAlign = 'right'; cx.fillText('200,000,000', W - 70, 186); cx.fillText('3,800,000', W - 70, 252);
  cx.fillStyle = '#e07a6e'; cx.fillRect(70, 292, W - 140, 3);
  // the names, too small to read from the square: two columns of them
  cx.fillStyle = 'rgba(255,240,234,0.7)';
  for (let col = 0; col < 2; col++) for (let r = 0; r < 7; r++) {
    const x = 70 + col * 450, y = 320 + r * 25;
    cx.fillRect(x, y, rng.f(90, 180), 9); cx.fillRect(x + 200, y, rng.f(90, 170), 9);
  }
  // the Count: faded grey, its slots empty
  cx.fillStyle = '#4b4446'; cx.fillRect(W, 0, W, H);
  cx.strokeStyle = '#8a8082'; cx.lineWidth = 8; cx.strokeRect(W + 14, 14, W - 28, H - 28);
  cx.fillStyle = '#b9b0aa'; cx.textAlign = 'center'; cx.font = serif(84, true); cx.fillText('COUNT', W + W / 2, 84);
  cx.textAlign = 'left'; cx.font = serif(56); cx.fillText('People', W + 70, 222); cx.fillText('Shares', W + 70, 348);
  for (const y of [222, 348]) for (let i = 0; i < 11; i++) { cx.strokeStyle = '#6d6466'; cx.lineWidth = 4; cx.strokeRect(W + 330 + i * 56, y - 36, 46, 72); }
  // where the tiles were, the board is a little less faded
  cx.fillStyle = 'rgba(30,26,28,0.35)';
  for (const y of [222, 348]) for (let i = 0; i < 11; i++) cx.fillRect(W + 333 + i * 56, y - 33, 40, 66);
  const t = new CanvasTexture(cv); t.colorSpace = SRGBColorSpace; t.anisotropy = 8;
  return t;
}
const BOARD_VERT = /* glsl */`
attribute float aGlow;
${BEND_PARS}
varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying float vGlow;
void main() {
  vec3 p = position, n = normal;
  kBend(p, n);
  vW = p; vN = n; vUv = uv; vGlow = aGlow;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const boardFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform sampler2D tMap;
varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying float vGlow;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 c = texture2D(tMap, vUv).rgb;
  vec3 Lg = kLight(vW, normalize(mix(N, kUp(vW), 0.5)), vW, N);
  gl_FragColor = vec4(kAir(c * (Lg * 1.1 + vGlow), vW), 1.0);
}`;
function boardMesh(hollow, quads) {
  // quads: { a, b, c, d (flat corners, counter-clockwise from the front, from bottom left), u0, u1, glow }
  const pos = [], nrm = [], uv = [], glow = [];
  for (const q of quads) {
    const e1 = new Vector3(...q.b).sub(new Vector3(...q.a)), e2 = new Vector3(...q.d).sub(new Vector3(...q.a)), n = e1.cross(e2).normalize();
    for (const [p, u, w] of [[q.a, q.u0, 0], [q.b, q.u1, 0], [q.c, q.u1, 1], [q.a, q.u0, 0], [q.c, q.u1, 1], [q.d, q.u0, 1]]) { pos.push(...p); nrm.push(n.x, n.y, n.z); uv.push(u, w); glow.push(q.glow); }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setAttribute('aGlow', new Float32BufferAttribute(glow, 1));
  const m = new ShaderMaterial({
    uniforms: { ...hollow.rig.uniforms, uClip: G.uClip, uBend: { value: new Vector3(hollow.frame.a0, hollow.frame.z0, hollow.frame.floorR) }, tMap: { value: boardFace() } },
    vertexShader: BOARD_VERT, fragmentShader: boardFrag(hollow.rig), side: DoubleSide,
  });
  const mesh = new Mesh(g, m);
  fitBounds(mesh, hollow.frame);
  return mesh;
}

// ---------------------------------------------------------------- light over the minute
// A red dawn for the dye, warming to rose-gold. The palette's own colours brought to full strength; powers say how strong.
const hue = (c) => { const q = new Color(c); const m = Math.max(q.r, q.g, q.b, 1e-6); return q.multiplyScalar(1 / m); };
const LIGHT = [
  { t: 0, sun: '#ffb4a0', sunP: 0.36, far: '#ffa898', farP: 0.3, amb: '#b88a90', ambP: 0.5, rod: 16, lamp: 1.0, lit: 0.34 },
  { t: 14, sun: '#ffbca4', sunP: 0.42, far: '#ffb09c', farP: 0.34, amb: '#bc9094', ambP: 0.48, rod: 20, lamp: 0.9, lit: 0.3 },
  { t: 32, sun: '#ffc8ac', sunP: 0.52, far: '#ffbaa4', farP: 0.42, amb: '#c49c9c', ambP: 0.44, rod: 26, lamp: 0.75, lit: 0.26 },
  { t: 50, sun: '#ffd4b4', sunP: 0.62, far: '#ffc6ac', farP: 0.52, amb: '#c8a6a0', ambP: 0.42, rod: 32, lamp: 0.6, lit: 0.22 },
  { t: 99, sun: '#ffdcbc', sunP: 0.68, far: '#ffcfb4', farP: 0.58, amb: '#ccaca4', ambP: 0.42, rod: 36, lamp: 0.5, lit: 0.2 },
].map((k) => ({ ...k, sun: hue(k.sun), far: hue(k.far), amb: new Color(k.amb) }));

export const madderGardens = {
  id: 'madder-gardens',
  title: 'The week of the Ledger', drum: 'Madder', row: 'Pigment Row', kind: 'a counted drum, newly open', light: 33.1,
  line: 'They lifted the old Count board off the wall at Ring 4 and put up a Ledger. I didn\'t expect to cry at a board. Everyone did.',
  tone: '#e07a6e', source: 'wander-year.md (Day 222), three-nights 15-canon.js (Madder)',
  sound: { root: 45, scale: 'dorian', pad: 0.5, air: 0.2, water: 0.3, crowd: 0.35, bells: 0.15, bright: 0.45 },
  *build(ctx) {
    const lay = layout();
    yield 'layout';
    const plan = new Plan(ctx.q.plan);
    const pav = paintMadder(plan, lay);
    plan._batch = 1;        // settle() starts with six items to a step; ours are big enough to go one at a time
    yield 'plan queued';
    const k0 = LIGHT[0];
    const houses = ['#c8706a', '#e0a090', '#b0504a', '#e8c0a0', '#d08870', '#9a4a48'];
    const wall = { stone: '#ead2c4', stone2: '#d9b0a0', houses, houseMix: 0.6, winA: '#ffa868', winB: '#ffd8b0', awning: '#a8303a', gardenColor: '#8c7a58', lit: k0.lit, crowd: 0.25, winPower: 1.4 };
    const hollow = yield* buildHollow(ctx, {
      seed: 'madder', plan, pavilions: false,
      light: { sun: k0.sun, sunPower: k0.sunP, sunFar: k0.far, sunFarPower: k0.farP, sunAngle: (X0 / DRUM.RH) + Math.PI, amb: k0.amb, ambPower: k0.ambP, bounce: '#c8907a', bouncePower: 0.25, ground: '#ffb070', groundPower: 0.2, air: '#e8b0a0', airDensity: 0.000035 },
      sunline: { power: k0.rod, keep: true },
      ground: { lamp: k0.lamp, lampColor: '#ffb27a', people: 0.8, sunRod: k0.rod, canopy: '#6a3e48', stripes: 0.0, grain: 0.25 },
      front: wall, back: wall,
    });
    yield 'hollow';
    const scene = new Scene();
    scene.add(hollow.group);
    // the ground under the drying lines, its pattern lined up with them (lines at X0 +- 3, 6, ... 66)
    hollow.add(fieldMesh(hollow, [...lay.fields, { x0: X0 - 67.5, x1: X0 + 67.5, z0: DG.z0, z1: DG.z1, kind: 8, seed: 0.5, dir: 0, gap: 22 }]));
    yield 'fields';
    // lift pavilions on the lanes
    const pi = pav.map((q) => ({ p: [q[0], 0, q[1]], yaw: (q[0] * 0.37) % 6.28 }));
    for (const m of instances(pavilionGeo(), hollow.lit, pi, { frame: hollow.frame, cell: 1200 })) hollow.add(m);
    for (const q of pav) plan.features.push({ type: 'pavilion', x: q[0], z: q[1] });
    yield 'pavilions';

    // ---- the flight: along a lane of crimson cloth, up to see the beds close over the sky, down the red channel to the
    // lake, over the crowd to the boards, and out across the water to an opening over the southern beds
    const sh = shoreN(CHX);
    const path = makePath([
      { t: 0, p: [X0, 2.2, DG.z0 + 2] },
      { t: 7, p: [X0, 2.4, DG.z0 + 40], look: [X0, 2.6, DG.z0 + 200] },
      { t: 13, p: [X0 + 2, 9, DG.z0 + 115], look: [X0 + 20, 90, DG.z0 + 520] },
      { t: 21, p: [X0 + 10, 80, 1190], look: [X0 + 200, 2400, 2200], fov: 64 },
      { t: 29, p: [CHX, 50, 1640], look: [CHX, 0, sh - 60] },
      { t: 36, p: [CHX + 25, 18, SQ.z0 - 45], look: [SQX - 4, 2, BZ] },
      { t: 42, p: [SQX - 5, 9, BZ - 42], look: [SQX - 4, 3, BZ + 10] },
      { t: 46, p: [SQX - 5, 7.5, BZ - 17], look: [SQX - 4, 3.8, BZ + 40] },
      { t: 48.5, p: [SQX + 4, 14, BZ + 32], look: [SQX + 110, 24, BZ + 130] },
      { t: 52.5, p: [SQX + 85, 38, SQS + 50], look: [SQX + 700, 260, SQS - 60] },
      { t: 60, p: [SQX + 460, 110, SQS - 160] },
    ], { frame: hollow.frame, entryRadius: 1.8, exitRadius: 30 });
    const pts = path.points(0.5);
    yield 'path';

    yield* dress(hollow, lay, pts, ctx, sh);
    const low = pts.filter((q) => q.y < 120 && q.z > WY.z1);
    yield* scatterTrees(hollow, { near: low, radius: 150, max: 6000 * ctx.density, wood: [{ kind: 'round', weight: 3, tint: [0.75, 0.6, 0.65] }, { kind: 'birch', weight: 1, tint: [0.85, 0.7, 0.72] }] });
    yield* scatterPeople(hollow, { near: pts.filter((q) => q.y < 120), radius: 220, density: 1.0 * ctx.density, max: 5000, seed: 'madder-folk' });
    yield 'folk';
    hollow.lampPosts({ near: pts, radius: 200, power: 5, color: '#ffb47a' });
    yield 'people';

    const look = { exposure: 1.85, bloom: 0.24, threshold: 0.72, saturation: 1.16, vignette: 0.5, contrast: 1.03 };
    const sun = new Color(), far = new Color(), amb = new Color();
    const update = (t) => {
      let i = 0; while (i < LIGHT.length - 2 && LIGHT[i + 1].t <= t) i++;
      const a = LIGHT[i], b = LIGHT[i + 1], s = smoothstep(a.t, b.t, t);
      const mix = (k) => a[k] + (b[k] - a[k]) * s;
      sun.lerpColors(a.sun, b.sun, s); far.lerpColors(a.far, b.far, s); amb.lerpColors(a.amb, b.amb, s);
      hollow.rig.set({ sun, sunPower: mix('sunP'), sunFar: far, sunFarPower: mix('farP'), amb, ambPower: mix('ambP') });
      hollow.setRod(mix('rod'));
      hollow.setNight(mix('lamp'), mix('lit'));
    };
    update(0);
    return { scene, path, hollow, near: 0.3, far: 9000, look, portal: { mist: '#e07a6e' }, update };
  },
};

// ---------------------------------------------------------------- what the flight passes
function* dress(hollow, lay, pts, ctx, sh) {
  const rng = makeRng('madder-dress');
  const frame = hollow.frame;
  let t0 = performance.now();
  const tick = function* (what) { if (performance.now() - t0 > 4) { yield what; t0 = performance.now(); } };

  // ---- the drying ground: lines along the axis, 3 m apart, a lane down the middle for the flight
  const xs = [];
  for (let k = 0; X0 + 3 + 3 * k <= DG.x1; k++) { xs.push(X0 + 3 + 3 * k); xs.push(X0 - 3 - 3 * k); }
  xs.sort((a, b) => a - b);
  const top = 3.35, zA = DG.z0 + 6, zB = DG.z1 - 6;
  // walkers in the lanes between lines: lane i is between xs[i] and xs[i + 1]
  const lanes = [];
  const walkers = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const lx = (xs[i] + xs[i + 1]) / 2, mine = Math.abs(lx - X0) < 1;
    if (!mine && !rng.chance(0.75)) { lanes.push([0, 0, 0, 0]); continue; }
    const v = rng.f(0.75, 1.1), fwd = mine ? true : rng.chance(0.5);
    // in the flight's own lane they walk ahead of the camera, never back past where it starts
    const zs = mine ? DG.z0 + 22 : zA, ze = zB, len = ze - zs;
    const w = [fwd ? zs : ze, fwd ? len : -len, len / v, rng()];
    lanes.push(w);
    const off = mine ? 1.9 : rng.f(-0.35, 0.35);
    walkers.push({ p: [lx + off, 0, w[0]], yaw: fwd ? 0 : Math.PI, drift: [0, 0, fwd ? v : -v, w[2]], phase: w[3], color: rng.pick(['#7e2d33', '#e07a6e', '#d9c7b2', '#3a3f6a', '#c99234', '#f0e2d4']) });
    if (mine) walkers.push({ p: [lx - 1.9, 0, w[0] + 9], yaw: 0, drift: [0, 0, v, w[2]], phase: w[3], color: '#2c3a78' });
  }
  const sheets = [];
  // whole lines are dyed in one bath: neighbouring lines share a colour, so from above the ground is striped
  const lineCol = (i, x) => (Math.abs(x - X0) < 4 ? 0 : [0, 1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 0][Math.floor((i + 3) / 3) % 12]);
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i], close = Math.abs(x - X0) < 12, ci = lineCol(i, x);
    const wa = i > 0 ? lanes[i - 1] : [0, 0, 0, 0], wb = i < lanes.length ? lanes[i] : [0, 0, 0, 0];
    for (let z = zA; z < zB - 3;) {
      const len = Math.min(rng.f(6, 13), zB - z), c = rgb(CLOTHS[rng.chance(0.85) ? ci : rng.i(0, CLOTHS.length - 1)]), k = rng.f(0.86, 1.12);
      sheets.push({ x, z0: z, z1: z + len, top, drop: rng.f(3.0, 3.18), col: [c[0] * k, c[1] * k, c[2] * k], phase: rng.f(0, 6.28), lean: rng.f(-0.06, 0.06), nz: Math.ceil(len / (close ? 0.6 : 2)), ny: close ? 6 : 2, wa, wb });
      z += len + rng.f(0.4, 1.6);
    }
    yield* tick('cloth');
  }
  hollow.add(clothMesh(hollow, sheets));
  yield 'cloth mesh';
  const g = new Geo({ maxSeg: 16 });
  for (const x of xs) {
    g.box(x - 0.015, top - 0.02, zA - 1, x + 0.015, top + 0.015, zB + 1, '#3a3234');
    for (let z = zA - 1; z <= zB + 1; z += 12.6) g.cyl(x, 0, z, 0.06, 0.05, top + 0.12, 5, '#7a6458');
  }
  yield 'posts';

  // ---- the works yard: vats, grinding pavilions, racks of pigment cakes, mats of madder root drying
  const vatCols = ['#8e1e2a', '#a8303a', '#c24a48', '#7a1a26', '#b09030', '#2e4a80', '#5a1a2e'];
  for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) {
    const x = WY.x0 + 12 + i * 6.2, z = WY.z0 + 12 + r * 6.4, liquor = vatCols[(i * 3 + r * 5) % vatCols.length];
    g.cyl(x, 0, z, 2.25, 2.35, 1.35, 12, '#8a6a5a', { top: '#5a4038' });
    g.cyl(x, 1.35, z, 2.35, 2.35, 0.12, 12, '#a4887a', { top: '#b89a8a' });
    g.cyl(x, 1.38, z, 2.05, 2.05, 0.08, 12, liquor, { top: liquor, emit: 0.18 });
    yield* tick('vats');
  }
  // the red channel's head: a basin the vats drain to
  g.box(CHX - 7, -0.4, WY.z1 - 26, CHX + 7, 0.25, WY.z1 - 2, '#a08878', { top: '#b8a090' });
  g.box(CHX - 6, 0.25, WY.z1 - 25, CHX + 6, 0.27, WY.z1 - 3, '#8a1e2c', { emit: 0.1 });
  // grinding pavilions: open sides, a terracotta roof, two mills under each
  for (const [px, pz] of [[CHX + 40, WY.z0 + 24], [CHX + 40, WY.z0 + 66], [WY.x0 + 26, WY.z0 + 70]]) {
    const w = 18, d = 12;
    for (let i = 0; i <= 3; i++) for (const dz of [-d / 2, d / 2]) g.cyl(px - w / 2 + (w * i) / 3, 0, pz + dz, 0.22, 0.2, 3.6, 6, '#e8d6c6');
    g.box(px - w / 2 - 0.6, 3.6, pz - d / 2 - 0.6, px + w / 2 + 0.6, 3.85, pz + d / 2 + 0.6, '#c86a52', { top: '#b85a46' });
    g.quad([px - w / 2 - 0.6, 3.85, pz + d / 2 + 0.6], [px + w / 2 + 0.6, 3.85, pz + d / 2 + 0.6], [px + w / 2 + 0.6, 5.6, pz], [px - w / 2 - 0.6, 5.6, pz], '#c0644c');
    g.quad([px + w / 2 + 0.6, 3.85, pz - d / 2 - 0.6], [px - w / 2 - 0.6, 3.85, pz - d / 2 - 0.6], [px - w / 2 - 0.6, 5.6, pz], [px + w / 2 + 0.6, 5.6, pz], '#b45a44');
    g.box(px - w / 2, 0, pz - d / 2, px + w / 2, 0.12, pz + d / 2, '#c9b2a2');
    for (const mx of [px - 4.5, px + 4.5]) {
      g.cyl(mx, 0.12, pz, 1.5, 1.5, 0.7, 12, '#a89a92', { top: '#b8aca4' });
      g.push().at(mx, 1.45, pz, 0).rot('x', Math.PI / 2); g.cyl(0, -0.25, 0, 0.62, 0.62, 0.5, 12, '#9a8e88'); g.pop().pop();
      g.cyl(mx, 0.82, pz, 1.1, 1.1, 0.02, 12, rng.pick(['#a8303a', '#c24a48', '#c99234', '#2e4a80']));
    }
    // a lamp still lit under the roof
    g.box(px - 0.4, 3.2, pz - 0.4, px + 0.4, 3.55, pz + 0.4, '#ffe0b8', { emit: 4 });
  }
  yield 'pavilions';
  // racks of pigment cakes drying: shelves of small bricks in every colour the row grinds
  const cakes = ['#a8303a', '#c24a48', '#e07a6e', '#7e2d33', '#c99234', '#d9bd48', '#2e4a80', '#5878b0', '#3a2a5a', '#e8c0a0', '#8a4a2a'];
  for (let r = 0; r < 6; r++) {
    const rz = WY.z0 + 34 + r * 5.2, rx0 = WY.x0 + 8, rx1 = WY.x0 + 62;
    for (const x of [rx0, (rx0 + rx1) / 2, rx1]) g.box(x - 0.08, 0, rz - 0.45, x + 0.08, 2.3, rz + 0.45, '#7a6052');
    for (let s = 0; s < 5; s++) {
      const y = 0.3 + s * 0.46;
      g.box(rx0, y, rz - 0.45, rx1, y + 0.05, rz + 0.45, '#8a6e5e');
      const c = cakes[(r * 3 + s * 7) % cakes.length];
      for (let x = rx0 + 0.3; x < rx1 - 0.4; x += 0.62) g.box(x, y + 0.05, rz - 0.3, x + 0.42, y + 0.2, rz + 0.3, rng.chance(0.85) ? c : rng.pick(cakes));
    }
    yield* tick('racks');
  }
  // mats of lifted madder root, laid out to dry beside the yard: long pale mats under rust-red roots
  for (let m = 0; m < 6; m++) {
    const mx = CHX + 14 + m * 4, mz0 = WY.z0 + 82, mz1 = WY.z1 - 6;
    g.box(mx - 1.4, 0, mz0, mx + 1.4, 0.05, mz1, '#d9c8b4');
    for (let z = mz0 + 0.3; z < mz1 - 0.3; z += 0.35) {
      const w = rng.f(0.15, 0.4);
      g.box(mx - 1.2 + rng.f(0, 0.4), 0.05, z, mx - 1.2 + rng.f(0.4, 0.8) + 1.4, 0.05 + rng.f(0.05, 0.14), z + w, rng.pick(['#a5352c', '#8e2a26', '#b8463a', '#7a2a22']));
    }
    yield* tick('roots');
  }
  yield 'roots';

  // ---- the red channel: stone edges from the yard to the lake, footbridges where the lanes cross
  const chZ1 = sh + 20;
  g.box(CHX - 3.6, -0.6, WY.z1, CHX - 3.2, 0.3, chZ1, '#c8b0a0', { top: '#d8c2b2' });
  g.box(CHX + 3.2, -0.6, WY.z1, CHX + 3.6, 0.3, chZ1, '#c8b0a0', { top: '#d8c2b2' });
  for (const z of lay.lanes) if (z > WY.z1 && z < sh) {
    g.box(CHX - 4.5, 0.5, z - 2, CHX + 4.5, 0.75, z + 2, '#b89a88', { top: '#ccb2a0' });
    for (const s of [-1, 1]) g.box(CHX - 4.5, 0.75, z + s * 1.9 - 0.06, CHX + 4.5, 1.7, z + s * 1.9 + 0.06, '#8a6a5a');
  }
  yield 'channel';

  // ---- the square: the Ledger set up out of doors for the week, the old Count propped beside it
  const bw = 7.2, bh = 3.6, by = 1.4, bx = SQX - 5;
  // the Ledger's frame and legs
  g.box(bx - bw / 2 - 0.25, by - 0.25, BZ - 0.1, bx + bw / 2 + 0.25, by + bh + 0.25, BZ + 0.25, '#3a2224');
  for (const dx of [-bw / 2 + 0.4, bw / 2 - 0.4]) g.box(bx + dx - 0.12, 0, BZ + 0.1, bx + dx + 0.12, by, BZ + 0.3, '#3a2224');
  g.box(bx - bw / 2 - 0.6, by + bh + 0.25, BZ - 0.7, bx + bw / 2 + 0.6, by + bh + 0.45, BZ + 0.4, '#7e2d33');
  // the Count, leaning back against a trestle
  const cxB = SQX + 6.4, cw = 5.6, ch = 2.8, lean = 0.33;
  g.box(cxB - cw / 2 - 0.3, 0, BZ + 0.55, cxB + cw / 2 + 0.3, 1.15, BZ + 0.85, '#6a5a52');
  hollow.add(g.mesh(hollow.lit, frame));
  yield 'yard mesh';
  const quads = [
    // seen from the crowd (from -z) +x is on the left
    { a: [bx + bw / 2, by, BZ - 0.12], b: [bx - bw / 2, by, BZ - 0.12], c: [bx - bw / 2, by + bh, BZ - 0.12], d: [bx + bw / 2, by + bh, BZ - 0.12], u0: 0, u1: 0.5, glow: 0.55 },
    { a: [cxB + cw / 2, 0.05, BZ + 0.1], b: [cxB - cw / 2, 0.05, BZ + 0.1], c: [cxB - cw / 2, 0.05 + ch * Math.cos(lean), BZ + 0.1 + ch * Math.sin(lean)], d: [cxB + cw / 2, 0.05 + ch * Math.cos(lean), BZ + 0.1 + ch * Math.sin(lean)], u0: 0.5, u1: 1.0, glow: 0 },
  ];
  hollow.add(boardMesh(hollow, quads));
  // a lamp each side of the Ledger, and bunting of dyed cloth across the square
  const b = new Geo({ maxSeg: 16 });
  const glows = [];
  for (const dx of [-bw / 2 - 1.2, bw / 2 + 1.2]) { b.cyl(bx + dx, 0, BZ - 0.3, 0.08, 0.06, 5.4, 6, '#3a3234'); b.cyl(bx + dx, 5.2, BZ - 0.3, 0.3, 0.22, 0.5, 6, '#fff0d8', { emit: 3 }); glows.push({ p: [bx + dx, 5.45, BZ - 0.3], color: '#ffc890', power: 6, size: 1.1 }); }
  const poles = [];
  for (let i = 0; i <= 6; i++) { poles.push([SQ.x0 + 6 + (i * (SQ.x1 - SQ.x0 - 12)) / 6, SQ.z0 + 10]); poles.push([SQ.x0 + 6 + (i * (SQ.x1 - SQ.x0 - 12)) / 6, SQ.z1 - 4]); }
  for (const [x, z] of poles) { b.cyl(x, 0, z, 0.09, 0.07, 6.2, 6, '#5a4a48'); b.cyl(x, 6.0, z, 0.26, 0.2, 0.42, 6, '#fff0d8', { emit: 3 }); glows.push({ p: [x, 6.2, z], color: '#ffc890', power: 5, size: 1.0 }); }
  const strings = [];
  for (let i = 0; i <= 6; i++) strings.push([poles[i * 2], poles[i * 2 + 1]]);
  for (let i = 0; i < 6; i++) { strings.push([poles[i * 2], poles[i * 2 + 2]]); strings.push([poles[i * 2 + 1], poles[i * 2 + 3]]); }
  for (const [p, q] of strings) {
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.floor(len / 0.9);
    for (let k = 0; k < n; k++) {
      const u0 = k / n, u1 = (k + 0.6) / n, sag = (u) => 5.9 - 1.6 * Math.sin(Math.PI * u);
      const x0 = p[0] + (q[0] - p[0]) * u0, z0 = p[1] + (q[1] - p[1]) * u0, x1 = p[0] + (q[0] - p[0]) * u1, z1 = p[1] + (q[1] - p[1]) * u1, um = (u0 + u1) / 2;
      b.tri([x0, sag(u0), z0], [(x0 + x1) / 2, sag(um) - 0.55, (z0 + z1) / 2], [x1, sag(u1), z1], CLOTHS[(k + strings.indexOf(q) ) % 8]);
    }
  }
  hollow.add(b.mesh(hollow.litDouble, frame));
  hollow.glow(glows, { maxPx: 80 });
  yield 'square';

  // ---- the crowd, standing about in front of the boards the way people do when there is nothing more to read
  const spots = [];
  const wear = ['#7e2d33', '#e07a6e', '#a8303a', '#fff0ea', '#2a1416', '#c99234', '#2c3a78', '#d9c7b2', '#b8463a', '#eab0a8', '#5a6a8a'];
  for (let i = 0; i < 1500; i++) {
    const x = rng.f(SQ.x0 + 3, SQ.x1 - 3), z = rng.f(SQ.z0 + 6, BZ - 3);
    const dx = x - (bx + 1), dz = BZ - z, d = Math.hypot(dx * 0.7, dz);
    // thicker near the boards, thinning to the back of the square
    if (!rng.chance(1.5 - d / 45)) continue;
    const yaw = Math.atan2(bx + 1 - x, BZ - z) + rng.f(-0.35, 0.35);
    const child = rng.chance(0.1);
    spots.push({ p: [x, 0.02, z], yaw, child, walk: rng.chance(0.1) ? rng.f(1, 3) : 0, color: rng.pick(wear) });
    // a few children up on someone's shoulders
    if (!child && rng.chance(0.03)) spots.push({ p: [x, 1.3, z - 0.05], yaw, child: true, color: rng.pick(wear) });
  }
  // and the drying-ground workers, on the lines
  hollow.add(crowd(spots, hollow.walk, { frame, bob: 0.08, seed: 'madder-crowd' }));
  const driftMat = litMaterial(hollow.rig, { bend: frame, drift: true });
  const byskin = new Map();
  for (const w of walkers) { const s = rng.pick(SKIN); let a = byskin.get(s); if (!a) byskin.set(s, a = []); a.push(w); }
  for (const [s, items] of byskin) for (const m of instances(figGeo(s), driftMat, items, { frame, cell: 400, drift: true })) hollow.add(m);
  yield 'crowd';
}

// a figure walking a line (the kit's standing figure, built here so it carries the drift attributes on its own copy)
const figCache = new Map();
function figGeo(skin) {
  if (figCache.has(skin)) return figCache.get(skin);
  const g = new Geo();
  g.tint(0.35).box(-0.15, 0, -0.1, 0.15, 0.86, 0.1, '#6a6f7a');
  g.tint(1).cyl(0, 0.82, 0, 0.22, 0.17, 0.62, 6, '#ffffff', { smooth: false });
  g.tint(0).blob(0, 1.6, 0, 0.145, 0, skin, { shadeBottom: 0.8 });
  const geo = g.build();
  figCache.set(skin, geo);
  return geo;
}
