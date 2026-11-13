// Ochre, Pigment Row: the wall that is a colour chart, and the lift up it. Pigment Row "grinds colours for half the
// raft", and Ochre's grinders "can match any colour you describe in about ten minutes" (docs/wander-year.md, Day 226;
// games/three-nights/src/15-canon.js, Ochre: the grinders, the Hollow's "pigment gardens and grinding pavilions by a
// small lake", the palette "Earth ramp" #21170e #7a5428 #d9a65a #fff3dc, "An ochre dawn, naturally"). The Spindle lift
// climbs the end wall, 1.5 km "in a little over 2 minutes at 12 m/s", to the flying halls; in the last ~400 m "the
// Coriolis push outweighs what's left of the spin's pull, so the cabin swings until 'down' points sideways", and in the
// last ~50 m "'down' swings toward the axis, then fades to nothing" (docs/drum-transport.md, The Hollow and the Spindle).
//
// The flight begins in a grinders' yard at the foot of the front wall at an ochre dawn, among cones and trays of pure
// pigment, slabs and mullers and lamps still lit; follows a wanderer with a jar to the lift station; rises beside a cab
// up the yellow-ochre spoke of the wall, terrace after terrace, the shades going from umber through ochre to cream as
// the land drops away and wraps up overhead; leans as "down" swings sideways near the top and then toward the axis;
// comes up through the gate into the netted front flying hall, where people fly in sleeves, looks out along the drum,
// turns to look back at the chart, now a whole wheel round the painted hub, and leaves through a hoop of lamps there.
//
// Not canon (the docs give Ochre its grinders, its dawn and a Hollow of pigment gardens and pavilions by a lake, not
// its wall):
//   - the front end wall painted as a colour chart: every house on the thirty terraces one swatch, the hue going once
//     round the wall through twelve pigments, deep shades at the foot and pale tints toward the axis, so that from the
//     floor the wall is a colour wheel three kilometres across; pale pilasters between the houses like the borders
//     between chips on a card; the front hub painted in the twelve pigments, the pin at the wheel's middle;
//   - the grinders' yards along the foot of the front wall, and everything in the one the flight starts in: slabs and
//     mullers, an edge-runner mill, cones of pigment on trays, the racks of jars, stained aprons;
//   - the Spindle lift as an open girder guideway leaning up the wall over the rails of the terraces, with cabs going up
//     one side and down the other, and how its station and its cabs look;
//   - the plan of the Hollow: the woods of the Dim Ends, the pigment gardens in bands of colour, the lake, the walks;
//   - what people do on the terraces passed (tea, trays of pigment drying, shelves of jars, a reel on the Third,
//     children on the Quarter), the wanderer's jar handed over in the yard, and the hoop of lamps in the hall;
//   - the dawn pressed into one minute.
import {
  Scene, Color, Vector3, Matrix4, Quaternion, Mesh, InstancedMesh, BufferGeometry, Float32BufferAttribute, Uint8BufferAttribute, ShaderMaterial, DoubleSide, Sphere,
} from 'three';
import { Plan, C, L } from '../kit/plan.js';
import { buildHollow, NT, TIER_H, tierPlace, tierDepths } from '../kit/hollow.js';
import { makePath } from '../core/path.js';
import { crowd, figureGeo, CLOTH, SKIN } from '../kit/folk.js';
import { scatterTrees } from '../kit/flora.js';
import { Geo, instances, rgb } from '../kit/geo.js';
import { G, CLIP_PARS, CLIP_FRAG, NOISE_GLSL, glowPoints, litMaterial } from '../kit/mats.js';
import { DRUM } from '../kit/drum.js';
import { makeRng, smoothstep, clamp } from '../core/rng.js';

const TAU = Math.PI * 2;
const RH = DRUM.RH;
// Twelve pigments, once round the wall: the yellow-ochre spoke at x = 0, where the lift climbs.
const PIGMENTS = ['#d4a034', '#c27a2e', '#a24a2a', '#b8362c', '#9a2642', '#6c3a6c', '#38448e', '#3a78b0', '#2f8a84', '#4a7a4e', '#7c873c', '#d6c04c'];
const DEPTHS = tierDepths();
const WALL_FOOT = DEPTHS.reduce((a, b) => a + b, 0);            // the front wall meets the floor here (z)
const X_L = 0;                                                 // the lift's spoke, flat x on the floor
const ZR = (t) => tierPlace(DEPTHS, t).zRail;                  // the rail of tier t (its riser's face)
const YT = (t) => (t + 1) * TIER_H;                            // the floor of tier t's terrace

// ---------------------------------------------------------------- the plan of the Hollow
const merge = (list) => { const p = new Path2D(); for (const q of list) p.addPath(q); return p; };
const lines = (list) => { const p = new Path2D(); for (const pts of list) pts.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]))); return p; };
const ring = (z, n = 120, wob = 0, ph = 0) => { const a = []; for (let i = 0; i <= n; i++) a.push([(i / n) * C, z + Math.sin(i * 0.41 + ph) * wob]); return a; };
const LAKE = { x: C * 0.42, z: 1900, rx: 520, rz: 300 };

// a band right round the floor, painted once per layer (plan.band is drawn three times over, the seam's copies included)
function bandOnce(plan, z0, z1, color, wood, life) {
  const r = (cx) => cx.fillRect(0, z0, C, z1 - z0);
  plan.once('alb', (cx) => { cx.fillStyle = color; r(cx); });
  if (wood !== null) plan.once('mask', (cx) => { cx.globalCompositeOperation = 'lighter'; cx.fillStyle = `rgb(0,${Math.round(255 * wood)},0)`; r(cx); });
  plan.once('kind', (cx) => { cx.globalCompositeOperation = life ? 'lighter' : 'multiply'; cx.fillStyle = life ? `rgb(0,0,${Math.round(255 * life)})` : 'rgb(255,255,0)'; r(cx); });
}

// many shapes, each its own colour, on the alb layer in one call (each separate fill costs the plan a turn)
function paintAlb(plan, list) { plan.layer('alb', (cx) => { for (const [path, col] of list) { cx.fillStyle = col; cx.fill(path); } }); }

function* paintOchre(plan) {
  const rng = makeRng('ochre-plan');
  const lampPts = [];
  const along = (pts, sp) => { let carry = 0; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]); let d = carry; while (d < len) { const t = d / len; lampPts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); d += sp; } carry = d - len; } };
  // the land: dry grass and earth, in the drum's own browns
  for (let k = 0; k < 4; k++) bandOnce(plan, (k * L) / 4, ((k + 1) * L) / 4, '#a6a276', null, 0.4);
  plan.mottle(['#9aa274', '#b2a674', '#a49a6a', '#8e9a6c', '#bcaa78', '#98a07a', '#c2a46e'], 40, 340, { alpha: 0.6, seed: 'ochre-m' });
  yield 'plan: land';
  // the Dim Ends: umber woods under both walls, with lamp-lit glades
  for (const [z0, z1] of [[WALL_FOOT + 40, 760], [L - 760, L - WALL_FOOT - 40]]) bandOnce(plan, z0, z1, '#5e6644', 0.85, 0);
  const glades = [];
  for (let i = 0; i < 24; i++) { const front = i % 2 === 0, z = front ? rng.f(470, 700) : rng.f(L - 700, L - 470); glades.push(plan.blob(rng.f(0, C), z, rng.f(30, 80), rng.f(20, 50), { seed: i + 3, n: 40, wobble: 0.45, lobes: 5 })); }
  plan.fill(merge(glades), { color: '#9a8a5c', clear: ['wood'], life: 0.5 });
  yield 'plan: woods';
  // the apron under each wall: a paved walk all round, and the grinders' yards along it
  for (const z of [WALL_FOOT + 14, L - WALL_FOOT - 14]) { const r = ring(z); plan.stroke(lines([r]), 26, { color: '#c4ae86', paved: 0.9, life: 0.6, clear: ['wood'] }); along(r, 22); }
  const yards = [];
  for (let x = 30; x < C; x += rng.f(150, 260)) yards.push(plan.rect(x, WALL_FOOT + 26, x + rng.f(50, 90), WALL_FOOT + rng.f(70, 110), 6));
  yards.push(plan.rect(X_L - 70, WALL_FOOT + 20, X_L + 70, WALL_FOOT + 112, 6));
  plan.fill(merge(yards), { color: '#b89466', paved: 0.9, life: 0.7, clear: ['wood'] });
  // heaps of pigment in the yards, a speck of colour each
  const heaps = [];
  for (let k = 0; k < PIGMENTS.length; k++) {
    const p = new Path2D();
    for (let i = 0; i < 70; i++) { const x = rng.f(0, C); if (Math.abs(((x + C / 2) % C) - C / 2) < 90) continue; const z = WALL_FOOT + rng.f(34, 90); p.moveTo(x + 2.2, z); p.arc(x, z, 2.2, 0, TAU); }
    heaps.push([p, PIGMENTS[k]]);
  }
  paintAlb(plan, heaps);
  yield 'plan: yards';
  // the lake, and the pigment gardens round it in bands of colour
  const lake = plan.blob(LAKE.x, LAKE.z, LAKE.rx, LAKE.rz, { wobble: 0.16, lobes: 6, seed: 4 });
  plan.stroke(lake, 36, { color: '#d2c09a', paved: 0.4, life: 1, clear: ['wood'] });
  // the pigment gardens: quarters of long beds stepping through the colours, like cards from the chart laid on the land
  const beds = PIGMENTS.map(() => []), quarters = [];
  for (let q = 0; q < 44; q++) {
    const x = rng.f(0, C), z = rng.f(860, L - 900), w = rng.f(140, 320), d = rng.f(90, 200);
    let dx = x + w / 2 - LAKE.x; dx = ((dx % C) + C * 1.5) % C - C / 2;
    if ((dx / (LAKE.rx + w / 2 + 40)) ** 2 + ((z + d / 2 - LAKE.z) / (LAKE.rz + d / 2 + 40)) ** 2 < 1) continue;
    quarters.push(plan.rect(x - 4, z - 4, x + w + 4, z + d + 4, 4));
    const h0 = rng.i(0, 11), step = rng.chance(0.5) ? 1 : -1, bw = rng.f(5, 8);
    for (let k = 0, zz = z; zz + bw <= z + d; zz += bw + 2, k++) beds[(h0 + step * Math.floor(k / 2) + 120) % 12].push(plan.rect(x, zz, x + w, zz + bw));
  }
  plan.fill(merge(quarters), { color: '#c8b896', paved: 0.3, life: 0.4, clear: ['wood'] });
  paintAlb(plan, PIGMENTS.map((c, i) => { const q = rgb(c), k = 0.62; const mix = new Color(q[0] * k + 0.5 * (1 - k), q[1] * k + 0.47 * (1 - k), q[2] * k + 0.36 * (1 - k)); return [merge(beds[i]), '#' + mix.getHexString()]; }));
  plan.fill(lake, { color: '#4f6a62', water: 1, clear: ['life', 'paved', 'wood'] });
  plan.fill(plan.blob(LAKE.x, LAKE.z, LAKE.rx * 0.75, LAKE.rz * 0.65, { wobble: 0.2, lobes: 5, seed: 5 }), { color: '#3a5650', feather: 50 });
  yield 'plan: gardens';
  // groves
  const groves = [[], [], []];
  for (let i = 0; i < 150; i++) {
    const x = rng.f(0, C), z = rng.f(800, L - 800), r = rng.f(14, 60);
    let dx = x - LAKE.x; dx = ((dx % C) + C * 1.5) % C - C / 2;
    if ((dx / (LAKE.rx + 60)) ** 2 + ((z - LAKE.z) / (LAKE.rz + 60)) ** 2 < 1) continue;
    groves[i % 3].push(plan.blob(x, z, r * 1.3, r * rng.f(0.5, 1.0), { wobble: 0.45, lobes: 6, seed: i + 1, n: 28 }));
  }
  plan.fill(merge([...groves[0], ...groves[1], ...groves[2]]), { wood: 1, clear: ['life'] });
  paintAlb(plan, ['#76804c', '#868a54', '#6e7a4c'].map((c, i) => [merge(groves[i]), c]));
  yield 'plan: groves';
  // walks: rings round the floor and lanes the length of it, lit
  const wide = [ring(800), ring(L - 800)], narrow = [];
  for (const z of [1250, 1600, 2250, 2650, 3000]) narrow.push(ring(z, 120, 26, z));
  for (let i = 0; i < 18; i++) { const x = (i / 18) * C + 60; narrow.push([[x, WALL_FOOT + 30], [x + 30, 800], [x - 40, 1500], [x + 20, 2300], [x, L - WALL_FOOT - 30]]); }
  plan.stroke(lines([...wide, ...narrow]), 7, { color: '#d6c49c', paved: 0.8, life: 0.8, clear: ['wood'] });
  for (const w of wide) along(w, 26);
  narrow.forEach((w, i) => along(w, 48));
  along(ring(LAKE.z - LAKE.rz - 20, 60).filter((q) => Math.abs(q[0] - LAKE.x) < LAKE.rx), 30);
  // grinding pavilions: terracotta roofs by the walks
  const pav = [];
  for (let i = 0; i < 90; i++) { const w = rng.pick(narrow), q = w[rng.i(0, w.length - 1)]; pav.push(plan.rect(q[0] + 12, q[1] + rng.f(-40, 40), q[0] + 30, q[1] + rng.f(-40, 40) + 12, 1)); }
  plan.fill(merge(pav), { color: '#b8644a', paved: 1, clear: ['wood'] });
  plan.dots(lampPts, 2.0, { lamp: 0.85 });
  for (const q of lampPts) plan.features.push({ type: 'lamp', x: ((q[0] % C) + C) % C, z: q[1], h: 4.5 });
  yield 'plan: walks';
}


// ---------------------------------------------------------------- the chart wall
// The kit's `chart` option paints the wheel, but every house takes the colour of the smooth wheel at its place, so that
// near to, a whole terrace of neighbours is one colour, and windows two-fifths of the face. This material, put on the
// kit's own wall mesh, keeps the wheel from far off and makes each house its own chip near to: houses of three bays, each
// a step of hue and value off the wheel, set between pale pilasters like chips on a card, with smaller windows.
const WALL_VERT = /* glsl */`
attribute vec3 aTier;
uniform vec3 uBend;
varying vec3 vW; varying vec3 vF; varying vec3 vN; varying vec3 vTier;
void main() {
  vec3 p = position, n = normal;
  vF = p; vTier = aTier;
  float a = uBend.x + p.x / uBend.z, r = uBend.z - p.y, c = cos(a), s = sin(a);
  vW = vec3(r * c, r * s, uBend.y + p.z);
  vN = vec3(-s * n.x - c * n.y, c * n.x - s * n.y, n.z);
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
}`;
const chartFrag = (rig, NOISE) => /* glsl */`
${CLIP_PARS}
uniform vec3 uStone, uGlass, uGarden, uPave, uWinA, uWinB, uTrack, uAwning, uDeep, uPale, uPilaster; uniform vec3 uChartCol[12];
uniform float uLit, uTime, uTierH, uSide, uLifts, uWinPower, uChroma;
uniform vec4 uTier[${NT}];
varying vec3 vW; varying vec3 vF; varying vec3 vN; varying vec3 vTier;
${rig.glsl}
${NOISE}
vec3 kStars(vec2 q, float share) {
  vec2 c = floor(q); vec2 h = kHash2(c);
  float on = step(1.0 - share * 0.62, kHash(c + 7.7));
  float d = length(fract(q) - 0.5 - (h - 0.5) * 0.5);
  return mix(uWinA, uWinB, h.x) * on * smoothstep(0.42, 0.08, d) * (0.35 + 1.1 * h.y);
}
vec3 kPig(float hue) {
  hue = fract(hue / 12.0) * 12.0;
  int h0 = int(floor(hue)); int h1 = h0 == 11 ? 0 : h0 + 1;
  return mix(uChartCol[h0], uChartCol[h1], smoothstep(0.0, 1.0, fract(hue)));
}
// a chip: the pigment at this hue, taken down to a shade or up to a tint by v (0 the foot of the wall, 1 the top)
vec3 kChip(float hue, float v) {
  vec3 c = kPig(hue);
  c = max(mix(vec3(dot(c, vec3(0.3, 0.55, 0.15))), c, 1.25), 0.0);
  c = mix(uDeep, c * mix(0.5, 1.0, smoothstep(0.0, 0.36, v)), mix(0.62, 1.0, smoothstep(-0.05, 0.22, v)));
  return mix(c * (1.0 + 0.14 * smoothstep(0.4, 1.0, v)), uPale, smoothstep(0.42, 1.02, v) * 0.36);
}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN);
  float R = ${RH.toFixed(1)};
  float r = R - vF.y;
  float arc = vF.x * r / R;
  float ti = floor(vTier.x + 0.5);
  vec4 tp = uTier[int(clamp(ti, 0.0, ${NT - 1}.0))];
  vec3 Lgt = kLight(vW, N, vF, N);
  vec3 col; vec3 glow = vec3(0.0);
  float nTr = max(uLifts, 1.0);
  float trackU = vF.x / (${C.toFixed(2)} / nTr);
  float trackD = abs(fract(trackU) - 0.5) * (${C.toFixed(2)} / nTr) * r / R;
  float trackId = floor(trackU);
  float onTrack = (1.0 - smoothstep(3.2, 4.4, trackD)) * step(0.5, uLifts);
  float cab = fract(uTime * 12.0 / ${(RH - DRUM.SPINDLE).toFixed(1)} * (0.8 + 0.4 * kHash(vec2(trackId, uSide))) + kHash(vec2(trackId, 3.0 + uSide))) * ${(RH - DRUM.SPINDLE).toFixed(1)};
  float cabGlow = onTrack * (1.0 - smoothstep(2.0, 6.0, abs(vF.y - cab)));
  if (vTier.y < 0.5) {
    float hy = vF.y - ti * uTierH;
    float rr = R - ti * uTierH;
    float arcR = vF.x * rr / R;
    float circ = ${C.toFixed(2)} * rr / R;
    float px = max(length(dFdx(vec2(arcR, hy))), length(dFdy(vec2(arcR, hy))));
    float flH = uTierH / 11.0;
    float fl = floor(hy / flH), fy = fract(hy / flH);
    float colx = arcR / 4.4; float ci = floor(colx), cx = fract(colx) - 0.5;
    float house = floor(arcR / 13.2), hx = fract(arcR / 13.2);
    vec2 hid = vec2(house, ti * 7.0 + uSide * 3.0);
    float hk = kHash(hid), hk2 = kHash(hid + 13.1), hk3 = kHash(hid + 27.7);
    float v = ti / ${(NT - 1).toFixed(1)};
    float hue = fract((house + 0.5) * 13.2 / circ) * 12.0;
    // near to, each house is a chip a step off the wheel: hue, value and how strong the colour is
    float off = (hk - 0.5) * 1.5 * uChroma;
    float dv = (hk2 - 0.5) * 0.14 * uChroma;
    vec3 chip = kChip(hue + off, clamp(v + dv, 0.0, 1.0));
    chip = mix(chip, vec3(dot(chip, vec3(0.3, 0.55, 0.15))), (1.0 - step(0.85, hk3)) * hk3 * 0.25 * uChroma);
    vec3 wheel = kChip(hue, v);
    float pil = 1.0 - smoothstep(0.016, 0.028, min(hx, 1.0 - hx));        // the pale strip between two chips
    vec2 wid = vec2(ci, fl + ti * 13.0 + uSide * 50.0);
    float wh = kHash(wid), wh2 = kHash(wid + 5.5);
    vec3 day = chip;
    float lit01 = 0.0; vec3 winCol = mix(uWinA, uWinB, wh2) * (0.55 + 0.9 * kHash(wid + 4.7));
    float on = step(1.0 - clamp(uLit + tp.z, 0.0, 1.0), wh);
    if (fl < 0.5) {
      float ax = abs(cx) / 0.36;
      float arch = step(ax, 1.0) * step(fy, 0.48 + 0.32 * sqrt(max(1.0 - ax * ax, 0.0)));
      day = mix(chip * 0.86, uGlass * 0.5 + vec3(0.08, 0.06, 0.04), arch);
      lit01 = arch * (0.5 + 0.5 * on);
      winCol = mix(uWinA, uWinB, 0.3) * 0.9;
    } else if (fl < 9.5) {
      float win = step(abs(cx), 0.21) * step(0.26, fy) * step(fy, 0.76);
      float frame = step(abs(cx), 0.25) * step(0.22, fy) * step(fy, 0.8) * (1.0 - win);
      float slab = step(fy, 0.07);
      float rail = step(0.07, fy) * step(fy, 0.2) * step(abs(cx), 0.42) * step(0.4, wh2);
      float plant = step(0.03, fy) * step(fy, 0.26) * step(abs(cx), 0.44) * step(0.55, kHash(wid + 3.3)) * step(kNoise(vec2(arcR * 1.7, hy * 1.5)), 0.55);
      float shut = step(0.25, abs(cx)) * step(abs(cx), 0.36) * step(0.26, fy) * step(fy, 0.76) * step(0.7, wh2);
      day = mix(day, mix(uGlass, chip * 0.55, 0.3), win);
      day = mix(day, mix(chip, uPilaster, 0.45), frame);
      day = mix(day, chip * 0.62, shut);
      day = mix(day, mix(chip, uPilaster, 0.5), slab);
      day = mix(day, chip * 0.7, rail * 0.6);
      day = mix(day, uGarden * (0.8 + 0.5 * wh), plant);
      lit01 = win * on;
    } else {
      day = mix(chip, uPilaster, fy > 0.45 ? 0.55 : 0.2);
    }
    day = mix(day, uPilaster, pil * step(0.5, fl));
    float hn = kNoise(vec2(arcR / 9.0, ti * 7.0)) * 0.65 + kNoise(vec2(arcR / 2.3, ti * 3.0 + 9.0)) * 0.35;
    float hang = smoothstep(0.0, 1.2, hy - (uTierH - (2.0 + 15.0 * hn * tp.y)));
    vec3 green = uGarden * (0.7 + 0.55 * kNoise(vec2(arcR * 0.5, hy * 0.5))) * mix(vec3(1.0), vec3(1.25, 1.1, 0.7), step(0.8, kNoise(vec2(arcR * 0.7, hy * 0.7) + 20.0)) * 0.5);
    float fade = smoothstep(2.4, 0.6, px);
    float mid = smoothstep(9.0, 3.0, px);                                   // chips still show while windows do not
    vec3 avg = mix(mix(wheel, chip, mid), uGlass, 0.05) * (0.95 + 0.07 * step(0.5, fract(hy / flH * 0.5)));
    avg = mix(avg, uPilaster, 0.06 * mid);
    avg *= fl < 0.5 ? 0.78 : 1.0;
    col = mix(avg, day, fade);
    col = mix(col, green, hang * step(0.05, tp.y));
    col *= Lgt;
    float share = clamp(uLit + tp.z, 0.0, 1.0);
    float lv = log2(max(px * 1.7, 4.4) / 4.4), l0 = floor(lv);
    vec2 sq = vec2(arcR, hy + ti * 211.0 + uSide * 977.0) / (4.4 * exp2(l0));
    vec3 farGlow = mix(kStars(sq, share), kStars(sq * 0.5 + 31.0, share), lv - l0) * step(0.5, fl) * step(fl, 9.5) * 0.7;
    glow = uWinPower * mix(farGlow, winCol * lit01, fade) * (1.0 - hang);
    col = mix(col, uTrack * Lgt, onTrack * 0.85);
    glow = mix(glow, vec3(0.0), onTrack) + vec3(1.0, 0.82, 0.55) * 7.0 * cabGlow;
  } else if (vTier.y < 1.5) {
    float de = vTier.z * tp.w;
    vec2 gq = vec2(arc, de);
    float px = max(length(dFdx(gq)), length(dFdy(gq)));
    float bed = kFbm(gq / 7.0 + ti * 3.1);
    vec3 garden = uGarden * (0.7 + 0.6 * bed);
    garden = mix(garden, kPig(kHash(floor(gq / 3.0)) * 12.0) * 1.2, step(0.72, kNoise(gq / 2.2 + 5.0)) * 0.6);       // flowers in the chart's colours
    vec2 tq = gq / 5.2; vec2 tc = fract(tq) - 0.5 - (kHash2(floor(tq) + ti) - 0.5) * 0.5;
    float tree = (1.0 - smoothstep(0.22, 0.34, length(tc))) * step(0.45, kHash(floor(tq) + ti * 3.0)) * step(4.0, de);
    garden = mix(garden, uGarden * 0.62, tree * smoothstep(1.6, 0.5, px));
    float walkW = min(3.4, tp.w * 0.34);
    float isWalk = step(de, walkW) + step(tp.w - 1.6, de);
    float beds = smoothstep(0.3, 0.6, kFbm(gq / 13.0 + 40.0 + ti)) * tp.y;
    vec3 ground = mix(uPave * (0.94 + 0.1 * kNoise(gq * 0.9)), garden, clamp(beds * 1.5, 0.0, 1.0) * (1.0 - clamp(isWalk, 0.0, 1.0)));
    ground = mix(ground, uPilaster * 1.05, step(de, 0.55));
    vec2 q = gq / 1.7; vec2 qi = floor(q); vec2 h = kHash2(qi + ti);
    float present = step(1.0 - tp.x * (0.35 + 0.65 * clamp(isWalk, 0.0, 1.0)), kHash(qi + 7.7 + ti));
    vec3 cloth = mix(vec3(0.72), 0.5 + 0.5 * cos(6.2831 * (h.x + vec3(0.0, 0.33, 0.67))), 0.62);
    float fadeP = smoothstep(1.2, 0.3, px);
    ground = mix(ground, cloth, (1.0 - smoothstep(0.2, 0.36, length(fract(q) - 0.25 - h * 0.5) * 1.7)) * present * fadeP * step(0.6, de));
    ground = mix(ground, mix(ground, vec3(0.6, 0.57, 0.55), 0.55), tp.x * 0.6 * (1.0 - fadeP));
    col = ground * Lgt;
    col = mix(col, uTrack * Lgt, onTrack * 0.85);
    glow = vec3(1.0, 0.8, 0.5) * uLit * 0.9 * step(0.975, kHash(floor(gq / 3.0) + ti)) * (1.0 - onTrack) + vec3(1.0, 0.82, 0.55) * 7.0 * cabGlow;
  } else {
    col = uStone * 0.4 * Lgt;
    float ring = smoothstep(2.0, 0.0, abs(r - 62.0)) + smoothstep(1.5, 0.0, abs(r - 31.0));
    glow = vec3(1.0, 0.86, 0.6) * ring * (1.5 + 3.0 * uLit);
  }
  gl_FragColor = vec4(kAir(col, vW) + glow, 1.0);
}`;

/** The front hub, where the spar meets the wall, painted in the twelve pigments: the pin at the middle of the wheel. */
function paintHub(hollow) {
  for (const m of hollow.group.children) {
    const g = m.geometry, a = g && g.attributes;
    if (!m.isMesh || m.isInstancedMesh || !a || !a.aCol || m.material !== hollow.plain) continue;
    g.computeBoundingBox();
    const b = g.boundingBox;
    if (b.max.x - b.min.x < 80 || b.max.x - b.min.x > 100) continue;           // the hubs: 92 m across
    const P = a.position, Cc = a.aCol;
    for (let i = 0; i < P.count; i += 3) {
      const cx = (P.getX(i) + P.getX(i + 1) + P.getX(i + 2)) / 3, cy = (P.getY(i) + P.getY(i + 1) + P.getY(i + 2)) / 3, cz = (P.getZ(i) + P.getZ(i + 1) + P.getZ(i + 2)) / 3;
      if (cz > L / 2) continue;
      const hue = (((Math.atan2(cy, cx) / TAU) * 12) + 12) % 12, r = Math.hypot(cx, cy);
      const c = chipJS(Math.floor(hue) + 0.5, 0.45 + 0.45 * clamp(1 - r / 46, 0, 1));
      for (let k = 0; k < 3; k++) Cc.setXYZW(i + k, c[0], c[1], c[2], Cc.getW(i + k));
    }
    Cc.needsUpdate = true;
  }
}

/** Put the chart material on the kit's front wall mesh, sharing its uniforms (so setNight and setWindows still work). */
function chartWall(hollow, o) {
  const wf = hollow.walls[0], u = wf.material.uniforms;
  const m = new ShaderMaterial({
    uniforms: { ...u, uDeep: { value: v3(o.deep) }, uPale: { value: v3(o.pale) }, uPilaster: { value: v3(o.pilaster) }, uChroma: { value: 1 } },
    vertexShader: WALL_VERT, fragmentShader: chartFrag(hollow.rig, NOISE_GLSL), side: wf.material.side,
  });
  wf.material.dispose();
  wf.material = m;
  return m;
}
const v3 = (c) => { const q = rgb(c); return new Vector3(q[0], q[1], q[2]); };

// ---------------------------------------------------------------- the lift
// An open girder leaning up the wall, OFF metres out from the rail of every terrace, from the station on the floor to the
// gate of the flying hall at the top terrace. Modelled unbent in the station's own frame (u across, y up, z along the
// axis), which stands at angle 0 on the floor: the guideway lies in one plane through the axis, so it is straight there.
const OFF = 5.5;                 // clearance outside each rail
const TRACK_U = [2.3, -2.3];     // up track (spinward side) and down track
const Y_TOP = NT * TIER_H;       // the top terrace, the hall's floor: 75 m from the axis
function guideway() {
  // the rail corners, out by OFF, then smoothed (never nearer a rail than OFF - 1)
  const corner = [[0, ZR(0) + OFF + 12]];
  for (let t = 0; t < NT; t++) corner.push([YT(t), ZR(t) + OFF]);
  const zAt = (y) => { for (let i = 0; i < corner.length - 1; i++) if (y <= corner[i + 1][0]) { const [y0, z0] = corner[i], [y1, z1] = corner[i + 1]; return z0 + (z1 - z0) * (y - y0) / (y1 - y0); } return corner[corner.length - 1][1]; };
  const dy = 2, n = Math.ceil(Y_TOP / dy);
  let Z = []; const Y = [];
  for (let i = 0; i <= n; i++) { Y.push(Math.min(i * dy, Y_TOP)); Z.push(zAt(Y[i])); }
  const minZ = (y) => { const t = Math.min(NT - 1, Math.floor(y / TIER_H)); let m = ZR(t) + OFF - 1; if (t > 0 && y - t * TIER_H < 3) m = Math.max(m, ZR(t - 1) + OFF - 1); return m; };
  for (let pass = 0; pass < 3; pass++) {
    const w = 12, out = [];
    for (let i = 0; i <= n; i++) { let s = 0, k = 0; for (let j = Math.max(0, i - w); j <= Math.min(n, i + w); j++) { s += Z[j]; k++; } out.push(s / k); }
    for (let i = 0; i <= n; i++) out[i] = Math.max(out[i], minZ(Y[i]));
    Z = out;
  }
  // arc length along it
  const S = [0];
  for (let i = 1; i <= n; i++) S.push(S[i - 1] + Math.hypot(Y[i] - Y[i - 1], Z[i] - Z[i - 1]));
  const total = S[n];
  /** the point s metres along: { y, z, dy, dz } (dy, dz the unit direction of travel, upward) */
  const at = (s) => {
    s = clamp(s, 0, total);
    let lo = 0, hi = n; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m] <= s) lo = m; else hi = m; }
    const f = (s - S[lo]) / Math.max(S[hi] - S[lo], 1e-6), y = Y[lo] + (Y[hi] - Y[lo]) * f, z = Z[lo] + (Z[hi] - Z[lo]) * f;
    const ly = Y[hi] - Y[lo], lz = Z[hi] - Z[lo], ll = Math.hypot(ly, lz) || 1;
    return { y, z, dy: ly / ll, dz: lz / ll };
  };
  const zOf = (y) => { const i = clamp(Math.floor(y / dy), 0, n - 1), f = (y - Y[i]) / dy; return Z[i] + (Z[i + 1] - Z[i]) * clamp(f, 0, 1); };
  return { Y, Z, S, total, at, zOf };
}

// The girder: two box rails on a spine, cross-frames every 6 m, legs down to the rails it passes, a lamp every 24 m.
function liftGeo(gw, glows) {
  const g = new Geo();
  const step = 6;
  let prev = null;
  for (let s = 0; s <= gw.total; s += step) {
    const p = gw.at(s), nY = -p.dz, nZ = p.dy;                    // the outward normal of the girder, in (y, z)
    p.nY = nY; p.nZ = nZ;
    if (prev) {
      const a = prev, b = p;
      for (const u of TRACK_U) {
        g.quad([u - 0.35, a.y, a.z], [u + 0.35, a.y, a.z], [u + 0.35, b.y, b.z], [u - 0.35, b.y, b.z], '#d9d2c2');      // the rail's face, outward
        const ia = [a.y - a.nY * 0.6, a.z - a.nZ * 0.6], ib = [b.y - b.nY * 0.6, b.z - b.nZ * 0.6];
        g.quad([u + 0.35, a.y, a.z], [u + 0.35, ia[0], ia[1]], [u + 0.35, ib[0], ib[1]], [u + 0.35, b.y, b.z], '#9e978a');
        g.quad([u - 0.35, ia[0], ia[1]], [u - 0.35, a.y, a.z], [u - 0.35, b.y, b.z], [u - 0.35, ib[0], ib[1]], '#9e978a');
        g.quad([u + 0.06, a.y + a.nY * 0.04, a.z + a.nZ * 0.04], [u + 0.2, a.y + a.nY * 0.04, a.z + a.nZ * 0.04], [u + 0.2, b.y + b.nY * 0.04, b.z + b.nZ * 0.04], [u + 0.06, b.y + b.nY * 0.04, b.z + b.nZ * 0.04], '#4a4a4c');
      }
      // the spine under both, and the diagonals
      const sa = [a.y - a.nY * 2.2, a.z - a.nZ * 2.2], sb = [b.y - b.nY * 2.2, b.z - b.nZ * 2.2];
      g.tube([[0, sa[0], sa[1]], [0, sb[0], sb[1]]], 0.32, 5, '#8a8478');
      for (const u of TRACK_U) g.tube([[u, a.y - a.nY * 0.6, a.z - a.nZ * 0.6], [0, sb[0], sb[1]]], 0.08, 3, '#a8a194');
    }
    // a cross-frame
    g.tube([[TRACK_U[0], p.y - nY * 0.5, p.z - nZ * 0.5], [TRACK_U[1], p.y - nY * 0.5, p.z - nZ * 0.5]], 0.1, 3, '#a8a194');
    if (Math.round(s / step) % 4 === 0) glows.push({ p: [0, p.y + nY * 0.3, p.z + nZ * 0.3], color: '#ffd8a0', power: 4, size: 0.5, twinkle: 0.04 });
    prev = p;
  }
  // legs: where it passes each terrace, two struts down to the rail and one back to the riser
  for (let t = 0; t < NT; t++) {
    const y = YT(t), z = gw.zOf(y);
    for (const u of [-1.6, 1.6]) {
      g.tube([[u, y - 1.6, z - 1.2], [u, y, ZR(t) - 0.4]], 0.14, 4, '#8a8478');
      g.tube([[u, y - 2.4, z - 1.6], [u, y - 9, ZR(t) + 0.05]], 0.12, 4, '#8a8478');
    }
    g.box(-2.2, y - 0.05, ZR(t) - 1.4, 2.2, y + 0.12, ZR(t) + 0.2, '#b8b0a0');          // a pad on the rail
  }
  // the station on the floor: a platform, a canopy, the berth
  const z0 = gw.zOf(0);
  for (const [a, b] of [[-10, -3.7], [3.7, 10]]) {
    g.box(a, 0, z0 - 7, b, 0.9, z0 + 9, '#c8bca4', { top: '#d6ccb6' });
    g.box(a, 0.9, z0 + 8.6, b, 1.95, z0 + 8.75, '#7a6a58');
    for (const z of [z0 - 6, z0 + 2.4]) g.cyl(a + 0.6, 0.9, z, 0.18, 0.16, 4.4, 6, '#7a6a58');
  }
  g.box(-3.7, 0, z0 - 7, 3.7, 0.05, z0 + 9, '#b0a690');
  g.box(-7, 5.3, z0 - 7.6, 7, 5.5, z0 + 1, '#c9b89a', { top: '#8a7a64' });
  for (let x = -8; x <= 8; x += 4) { g.box(x - 0.5, 5.0, z0 - 2.5, x + 0.5, 5.3, z0 - 1.5, '#fff0d0', { emit: 3 }); glows.push({ p: [x, 5.0, z0 - 2], color: '#ffd090', power: 5, size: 0.8 }); }
  // the gate at the top: a housing where the guideway meets the hall
  const zt = gw.zOf(Y_TOP - 4);
  g.box(-5, Y_TOP - 10, zt - 6, 5, Y_TOP + 2, zt + 3, '#d9d2c2', { skip: 'b' });
  g.box(-4, Y_TOP - 9, zt + 3, 4, Y_TOP - 1, zt + 3.1, '#ffe2b0', { emit: 1.4 });
  return g;
}

// A cab: a pale shell, long along the guideway, with a band of lit windows and the cabin's people inside.
function cabGeo() {
  const g = new Geo();
  g.push().rot('x', Math.PI / 2);                                  // lathe about y, turned so the cab's length runs along +z (then mapped to travel)
  g.lathe(0, -1.9, 0, [[0.2, 0], [0.9, 0.25], [1.15, 0.8], [1.2, 1.9], [1.15, 3.0], [0.9, 3.55], [0.2, 3.8]], 12, (k) => (k === 2 || k === 3 ? '#efe8da' : '#d8d0c0'));
  g.pop();
  // the window band, both sides and the outward face
  g.quad([1.22, -0.45, 1.0], [1.22, -0.45, -1.0], [1.22, 0.5, -1.0], [1.22, 0.5, 1.0], '#ffd498', 1.1);
  g.quad([-1.22, -0.45, -1.0], [-1.22, -0.45, 1.0], [-1.22, 0.5, 1.0], [-1.22, 0.5, -1.0], '#ffd498', 1.1);
  g.quad([-0.8, 1.21, 1.0], [0.8, 1.21, 1.0], [0.8, 1.21, -1.0], [-0.8, 1.21, -1.0], '#ffdcaa', 0.9);
  g.box(-0.9, -1.05, -1.4, 0.9, -0.9, 1.4, '#6a5a48');            // the shoe on the rail
  g.cyl(0, 0, 1.92, 0.18, 0.12, 0.2, 6, '#fff0d0', { emit: 4 });  // a lamp at its leading end (local +z before the turn)
  return g.build();
}

// ---------------------------------------------------------------- bending on the CPU
// Things on thirty different terraces each want their own frame; bending them here, vertex by vertex, puts them all
// in one unbent mesh and one draw call.
class Bent {
  constructor() { this.pos = []; this.nrm = []; this.col = []; this.emit = []; }
  add(g, frame) {
    const p = g.pos, n = g.nrm, v = new Vector3(), d = new Vector3();
    for (let i = 0; i < p.length; i += 3) {
      frame.point(p[i], p[i + 1], p[i + 2], v); this.pos.push(v.x, v.y, v.z);
      frame.dir(p[i], n[i], n[i + 1], n[i + 2], d); this.nrm.push(d.x, d.y, d.z);
    }
    for (const c of g.col) this.col.push(c);
    for (const e of g.emit) this.emit.push(e);
  }
  mesh(material) {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(new Float32Array(this.pos), 3));
    g.setAttribute('normal', new Float32BufferAttribute(new Float32Array(this.nrm), 3));
    g.setAttribute('aCol', new Uint8BufferAttribute(Uint8Array.from(this.col), 4, true));
    g.setAttribute('aEmit', new Float32BufferAttribute(new Float32Array(this.emit), 1));
    g.computeBoundingSphere();
    return new Mesh(g, material);
  }
}

// a chip colour as the wall draws it: hue in pigments (0..12), v from the foot (0) to the top (1)
const DEEP = '#2a1c10', PALE = '#fff3dc';
function chipJS(hue, v) {
  hue = ((hue % 12) + 12) % 12;
  const h0 = Math.floor(hue), h1 = (h0 + 1) % 12, f = hue - h0, s = f * f * (3 - 2 * f);
  const a = rgb(PIGMENTS[h0]), b = rgb(PIGMENTS[h1]), dp = rgb(DEEP), pl = rgb(PALE);
  let c = [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s];
  const k0 = 0.5 + 0.5 * smoothstep(0, 0.36, v), k1 = 0.62 + 0.38 * smoothstep(-0.05, 0.22, v), k2 = smoothstep(0.42, 1.02, v) * 0.36, kl = 1 + 0.14 * smoothstep(0.4, 1, v);
  c = c.map((x, i) => dp[i] + (x * k0 - dp[i]) * k1);
  return c.map((x, i) => x * kl + (pl[i] - x * kl) * k2);
}

// someone at a rail or a table: body tinted by the instance, a head
let personGeoC = null;
function personGeo() {
  if (personGeoC) return personGeoC;
  const g = new Geo();
  g.tint(0.35).box(-0.15, 0, -0.1, 0.15, 0.86, 0.1, '#6a6f7a');
  g.tint(1).cyl(0, 0.82, 0, 0.22, 0.17, 0.62, 6, '#ffffff', { smooth: false });
  g.tint(0).blob(0, 1.6, 0, 0.145, 0, '#c4946a', { shadeBottom: 0.8 });
  personGeoC = g.build();
  return personGeoC;
}
let sitterGeoC = null;
function sitterGeo() {
  if (sitterGeoC) return sitterGeoC;
  const g = new Geo();
  g.tint(0).box(-0.17, 0.0, 0.0, 0.17, 0.2, 0.5, '#3a3f48');
  g.tint(1).cyl(0, 0.18, 0, 0.21, 0.17, 0.58, 6, '#ffffff', { smooth: false });
  g.tint(0).blob(0, 0.92, 0, 0.14, 0, '#b8845e', { shadeBottom: 0.8 });
  sitterGeoC = g.build();
  return sitterGeoC;
}

// ---------------------------------------------------------------- the terraces the lift passes
const W_DRESS = 42;              // metres either side of the lift dressed in full
function* dressTerraces(hollow, glows, ctx) {
  let bent = new Bent();
  const rng = makeRng('ochre-terraces');
  const tiers = [];
  let t0 = performance.now();
  for (let t = 0; t < NT; t++) {
    const T = hollow.terrace(0, t, 0), d = T.depth, v = t / (NT - 1);
    const W = Math.min(W_DRESS, Math.PI * T.floorR * 0.3);
    const g = new Geo({ maxSeg: 8 });
    const stand = [], sit = [];
    const walkW = Math.min(3.4, d * 0.34);
    // the railing, with a gap where the lift's pad sits on it
    for (const [a, b] of [[-W, -2.6], [2.6, W]]) {
      g.box(a, 0.98, -0.2, b, 1.06, -0.08, '#e8dcc4', { skip: 'b' });
      g.box(a, 0, -0.2, b, 0.12, -0.08, '#cbbd9e', { skip: 'b' });
      for (let x = a + 0.3; x < b; x += 3.0) g.box(x - 0.03, 0.12, -0.17, x + 0.03, 0.98, -0.11, '#b8a888', { skip: 'bt' });
    }
    // lamps along the rail
    for (let x = -W + 5; x < W; x += 13) {
      if (Math.abs(x) < 5) continue;
      g.cyl(x, 0, -0.9, 0.06, 0.05, 3.2, 5, '#5e5248');
      g.cyl(x, 3.15, -0.9, 0.2, 0.15, 0.32, 6, '#fff0d0', { emit: 3 });
      glows.push({ p: T.frame.point(x, 3.3, -0.9).toArray(), color: '#ffcf8a', power: 4.5, size: 0.55, twinkle: 0.05 });
    }
    // people at the rail, looking out, some turned to the lift
    for (let x = -W + 1; x < W; x += rng.f(1.2, 3.4)) {
      if (Math.abs(x) < 3.2 || !rng.chance(0.6)) continue;
      const toLift = Math.abs(x) < 22 && rng.chance(0.5);
      stand.push({ p: [x, 0.03, -rng.f(0.45, 0.8)], yaw: toLift ? (x > 0 ? -0.9 : 0.9) : rng.f(-0.3, 0.3), color: rng.pick(CLOTH), walk: [0, 0, 0, 0], scale: rng.chance(0.12) ? 0.68 : rng.f(0.92, 1.06) });
    }
    // strollers on the walk
    for (let x = -W + 2; x < W; x += rng.f(4, 10)) stand.push({ p: [x, 0.03, -rng.f(1.2, walkW)], yaw: 0, color: rng.pick(CLOTH), walk: [rng.f(1.5, 6), rng.f(0.4, 0.8) * rng.sign(), rng.f(0, 6.28), 0.12 / Math.max(T.g * 2, 0.2)], scale: rng.f(0.92, 1.05) });
    // tables for tea, chairs round them
    if (d > 9 && t % 2 === 0) for (let x = -W + 6; x < W - 4; x += rng.f(7, 13)) {
      if (Math.abs(x) < 6 || !rng.chance(0.7)) continue;
      const z = -rng.f(walkW + 1.2, d - 3.5);
      g.cyl(x, 0, z, 0.06, 0.05, 0.72, 5, '#5e5248');
      g.cyl(x, 0.72, z, 0.48, 0.48, 0.04, 9, '#e8e0d0');
      for (let k = 0; k < 3; k++) g.cyl(x + rng.f(-0.25, 0.25), 0.76, z + rng.f(-0.25, 0.25), 0.05, 0.04, 0.09, 6, rng.pick(['#f0ebe0', '#c9b48a', '#7a8a8e']));
      const n = rng.i(2, 4);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * TAU + rng.f(-0.3, 0.3), sx = x + Math.cos(a) * 0.82, sz = z + Math.sin(a) * 0.82;
        g.box(sx - 0.2, 0.4, sz - 0.2, sx + 0.2, 0.45, sz + 0.2, '#8a6a4a');
        if (rng.chance(0.85)) sit.push({ p: [sx, 0.45, sz], yaw: Math.atan2(x - sx, z - sz), color: rng.pick(CLOTH) });
      }
    }
    // trays of pigment set out to dry along the houses, in this tier's own colours, and jars on shelves
    for (let x = -W + 3; x < W - 3; x += rng.f(3.5, 7)) {
      if (!rng.chance(0.55)) continue;
      const z = -d + rng.f(1.0, 2.2), hue = (x / (TAU * T.floorR)) * 12 + rng.f(-0.9, 0.9), c = chipJS(hue, clamp(v + rng.f(-0.12, 0.12), 0, 1));
      g.box(x - 0.7, 0.35, z - 0.45, x + 0.7, 0.45, z + 0.45, '#8a6a4a', { top: c });
      g.box(x - 0.6, 0, z - 0.35, x - 0.52, 0.35, z - 0.27, '#6a5040'); g.box(x + 0.52, 0, z + 0.27, x + 0.6, 0.35, z + 0.35, '#6a5040');
    }
    for (let x = -W + 8; x < W; x += rng.f(20, 34)) {
      const z = -d + 0.5;
      g.box(x - 1.2, 0, z - 0.25, x + 1.2, 1.9, z + 0.25, '#7a6048', { skip: 'b' });
      for (let s = 0; s < 2; s++) for (let k = 0; k < 6; k++) {
        const hue = (x / (TAU * T.floorR)) * 12 + rng.f(-3, 3);
        g.box(x - 1.05 + k * 0.38, 0.5 + s * 0.7, z + 0.2, x - 0.85 + k * 0.38, 0.78 + s * 0.7, z + 0.4, chipJS(hue, rng.f(0.2, 0.6)), { top: '#d8cfc0', skip: 'b' });
      }
    }
    // planting in tubs (no soil: inert media in troughs)
    for (let x = -W + 2; x < W; x += rng.f(7, 13)) {
      const z = -rng.f(walkW + 0.6, d - 0.8);
      if (Math.abs(x) < 4) continue;
      g.box(x - 0.4, 0, z - 0.4, x + 0.4, 0.45, z + 0.4, '#a07a58', { skip: 'b' });
      g.blob(x, 0.95, z, [0.6, 0.55, 0.6], 0, rng.pick(['#7a8a4a', '#8a9a52', '#6e8048']), { lump: 0.25, seed: Math.round(x * 7) });
    }
    // the named tiers: a reel on the Third, children learning to stop on the Quarter
    if (t === 9) for (let k = 0; k < 28; k++) {
      const a = (k / 28) * TAU, cx = 24, cz = -16;
      stand.push({ p: [cx + Math.cos(a) * 7, 0.03 + (k % 3 === 0 ? 0.9 : 0), cz + Math.sin(a) * 7], yaw: a + 1.57, color: k % 2 ? '#c27a2e' : '#efe4cc', walk: [0, 0, 0, 0] });
    }
    if (t === 14) for (let k = 0; k < 16; k++) stand.push({ p: [-30 + rng.f(-8, 8), 0.03 + rng.f(0, 2.4), -rng.f(5, 18)], yaw: rng.f(0, 6.28), color: rng.pick(CLOTH), walk: [0, 0, 0, 0], scale: 0.66 });
    bent.add(g, T.frame);
    if (t % 5 === 4) { yield 'terraces ' + t; hollow.add(bent.mesh(hollow.plain)); bent = new Bent(); t0 = performance.now(); }
    const folk = [...instances(personGeo(), T.walk, stand, { frame: T.frame, cell: 4000, walk: true })];
    if (sit.length) folk.push(...instances(sitterGeo(), T.lit, sit, { frame: T.frame, cell: 4000 }));
    for (const m of folk) hollow.add(m);
    tiers.push({ T, folk, centre: T.frame.point(0, 2, -d / 2) });
    if (performance.now() - t0 > 4) { yield 'terraces ' + t; t0 = performance.now(); }
  }
  return tiers;
}

// ---------------------------------------------------------------- the grinders' yard at the foot of the wall
// A lane runs from the yard's gate up to the lift station (x = 0 .. 9, the flight comes down it). West of it, an open
// pavilion of grinding slabs; east, the edge-runner mill and the benches of pure pigment in cones and trays.
const YD = { z0: WALL_FOOT + 26, z1: WALL_FOOT + 112 };
const MARIT = { x: -3.2, z: WALL_FOOT + 72 };          // the wanderer with her jar, at the end of a slab
const BRUISE = '#5a3a54';                              // the colour in the jar: brown-violet
function* buildYard(hollow, glows, motes, ctx) {
  const rng = makeRng('ochre-yard');
  const g = new Geo({ maxSeg: 8 });
  const spots = [];
  const apron = (c) => { const q = rgb(c); return [q[0] * 0.8 + 0.12, q[1] * 0.8 + 0.1, q[2] * 0.8 + 0.08]; };
  // paving under the yard, with the stains of years of colour
  for (let i = 0; i < 30; i++) { const x = rng.f(-68, 68), z = rng.f(YD.z0, YD.z1 - 2), r = rng.f(0.25, 0.6); g.cyl(x, 0.05, z, r, r, 0.004, 9, apron(rng.pick(PIGMENTS)), { cap: true }); }
  // ---- the grinding pavilion, west of the lane
  const PX0 = -46, PX1 = -9, PZ0 = WALL_FOOT + 50, PZ1 = WALL_FOOT + 92;
  for (let x = PX0; x <= PX1 + 0.1; x += (PX1 - PX0) / 4) for (const z of [PZ0, PZ1]) g.cyl(x, 0, z, 0.24, 0.2, 4.6, 6, '#e8d8bc');
  g.box(PX0 - 0.8, 4.6, PZ0 - 0.8, PX1 + 0.8, 4.85, PZ1 + 0.8, '#b8644a', { top: '#a8583e' });
  g.quad([PX0 - 0.8, 4.85, PZ1 + 0.8], [PX1 + 0.8, 4.85, PZ1 + 0.8], [PX1 + 0.8, 6.9, (PZ0 + PZ1) / 2], [PX0 - 0.8, 6.9, (PZ0 + PZ1) / 2], '#b05e46');
  g.quad([PX1 + 0.8, 4.85, PZ0 - 0.8], [PX0 - 0.8, 4.85, PZ0 - 0.8], [PX0 - 0.8, 6.9, (PZ0 + PZ1) / 2], [PX1 + 0.8, 6.9, (PZ0 + PZ1) / 2], '#a65842');
  for (let x = PX0 + 4; x < PX1; x += 8) { g.box(x - 0.35, 4.1, (PZ0 + PZ1) / 2 - 0.35, x + 0.35, 4.45, (PZ0 + PZ1) / 2 + 0.35, '#fff0d0', { emit: 4 }); glows.push({ p: [x, 4.2, (PZ0 + PZ1) / 2], color: '#ffc880', power: 7, size: 1.2 }); }
  // slabs in two rows, a grinder at each with a muller, a heap of colour and a palette knife
  let k = 0;
  for (const z of [PZ0 + 9, PZ0 + 23, PZ1 - 7]) for (let x = PX0 + 4; x < PX1 - 2; x += 6.5) {
    const c = PIGMENTS[(k * 5) % 12]; k++;
    g.box(x - 1.1, 0, z - 0.55, x + 1.1, 0.88, z + 0.55, '#8c8478', { top: '#b8b0a2' });
    g.cyl(x - 0.3, 0.88, z, 0.42, 0.42, 0.006, 10, c);                                  // a spread of colour being ground
    g.cyl(x + 0.5, 0.88, z - 0.15, 0.22, 0.0, 0.2, 8, c);                               // the heap waiting
    g.cyl(x - 0.25, 0.89, z + 0.05, 0.13, 0.11, 0.16, 8, '#c8c2b6', { top: '#d8d2c6' });     // the muller
    g.cyl(x + 0.85, 0.88, z + 0.3, 0.09, 0.09, 0.16, 7, '#e8e0d0', { top: c });          // a jar
    spots.push({ p: [x - 0.25, 0.02, z - 0.95], yaw: 0, color: apron(c), walk: 0 });
  }
  // ---- Marit at the end of a slab by the lane, taking a jar from the grinder who matched her colour
  g.box(MARIT.x - 3.2, 0, MARIT.z - 0.5, MARIT.x - 0.9, 0.88, MARIT.z + 0.5, '#8c8478', { top: '#b8b0a2' });
  g.cyl(MARIT.x - 2.3, 0.88, MARIT.z, 0.4, 0.4, 0.006, 10, BRUISE);
  g.cyl(MARIT.x - 1.6, 0.88, MARIT.z + 0.2, 0.18, 0.0, 0.14, 8, BRUISE);
  for (const [cx, cc] of [[-2.9, '#6a4a5a'], [-2.6, '#5a3a5e'], [-2.0, '#5e4048']]) g.cyl(MARIT.x + cx, 0.89, MARIT.z - 0.3, 0.035, 0.035, 0.005, 6, cc);   // the tries
  // the grinder: stained apron, holding the jar out
  g.at(MARIT.x - 1.7, 0, MARIT.z - 1.1, 0.5);
  g.box(-0.15, 0, -0.1, 0.15, 0.85, 0.1, '#4a4038'); g.cyl(0, 0.82, 0, 0.23, 0.18, 0.62, 6, '#7a5a3c', { smooth: false });
  g.box(-0.2, 0.4, 0.12, 0.2, 1.3, 0.17, '#9a6a48');
  for (const [px, pz, c] of [[-0.1, 0.15, '#5a3a54'], [0.08, 0.16, '#a24a2a'], [0.12, 0.155, '#3a78b0']]) g.box(px - 0.06, 0.55 + pz, 0.172, px + 0.06, 0.66 + pz, 0.18, c);
  g.blob(0, 1.6, 0, 0.14, 0, '#8a5a3a', { shadeBottom: 0.8 }); g.blob(0, 1.7, -0.03, [0.13, 0.08, 0.13], 0, '#e8e4dc');
  g.tube([[0.2, 1.35, 0], [0.32, 1.2, 0.3], [0.22, 1.28, 0.55]], 0.05, 5, '#7a5a3c');
  g.pop();
  // Marit: travelling coat, her other hand out for the jar
  g.at(MARIT.x - 0.95, 0, MARIT.z - 0.15, -2.4);
  g.box(-0.15, 0, -0.1, 0.15, 0.86, 0.1, '#3a3f48'); g.cyl(0, 0.82, 0, 0.24, 0.18, 0.66, 6, '#2f5a6a', { smooth: false });
  g.cyl(0, 0.3, 0, 0.28, 0.24, 0.55, 6, '#2f5a6a', { smooth: false });
  g.blob(0, 1.62, 0, 0.14, 0, '#d9a87c', { shadeBottom: 0.8 }); g.blob(0, 1.68, -0.05, [0.15, 0.12, 0.14], 0, '#5a3a24');
  g.box(-0.18, 0.95, -0.2, 0.18, 1.35, -0.1, '#8a5a3a');                 // her pack
  g.tube([[-0.22, 1.35, 0], [-0.3, 1.18, 0.28], [-0.12, 1.25, 0.5]], 0.05, 5, '#2f5a6a');
  g.pop();
  // the jar between their hands
  const jx = MARIT.x - 1.32, jz = MARIT.z - 0.62;
  g.cyl(jx, 1.12, jz, 0.08, 0.08, 0.16, 8, '#e9e4da', { top: BRUISE });
  g.cyl(jx, 1.28, jz, 0.085, 0.085, 0.03, 8, '#7a6a58');
  // ---- the lane's benches: cones and trays of pure pigment, all twelve, the length of the lane on both sides
  for (const side of [-1, 1]) {
    const bx = side < 0 ? -7.4 : 12.4;
    for (let z = YD.z0 + 4, i = 0; z < YD.z1 - 6; z += 3.0, i++) {
      if (side < 0 && Math.abs(z - MARIT.z) < 4) continue;
      const c = PIGMENTS[(i + (side > 0 ? 6 : 0)) % 12];
      g.box(bx - 0.75, 0, z - 1.3, bx + 0.75, 0.8, z + 1.3, '#7a6048', { top: '#8a6e54' });
      g.box(bx - 0.65, 0.8, z - 1.2, bx + 0.65, 0.88, z + 1.2, '#efe8da');
      for (const dz of [-0.75, 0, 0.75]) g.cyl(bx, 0.88, z + dz, 0.3, 0.0, 0.42 + rng.f(0, 0.1), 10, c);
      const c2 = chipJS(((i + (side > 0 ? 6 : 0)) % 12) + 0.5, 0.75);
      g.box(bx - 0.6, 0.0, z - 1.25, bx + 0.6, 0.12, z + 1.25, c2);
    }
  }
  yield 'yard: benches';
  // ---- the edge-runner mill, east of the lane: a stone basin and a wheel that goes round in it (drawn as its own mesh)
  const MX = 30, MZ = WALL_FOOT + 70;
  g.cyl(MX, 0, MZ, 4.2, 4.2, 0.85, 20, '#9a9284', { top: '#7a5a3c' });
  g.cyl(MX, 0.85, MZ, 3.9, 3.9, 0.01, 20, '#c27a2e');
  g.cyl(MX, 0.85, MZ, 0.35, 0.3, 2.6, 8, '#6a5a4a');
  // racks of jars, and sacks of earth waiting to be washed and ground
  for (let r = 0; r < 4; r++) {
    const rx0 = 18 + r * 9, rz = WALL_FOOT + 96;
    g.box(rx0, 0, rz - 0.4, rx0 + 7, 2.4, rz + 0.4, '#7a6048', { skip: 'b' });
    for (let s = 0; s < 4; s++) for (let i = 0; i < 18; i++) g.cyl(rx0 + 0.3 + i * 0.38, 0.3 + s * 0.52, rz + 0.48, 0.12, 0.12, 0.3, 6, chipJS(r * 3 + i * 0.16, 0.18 + s * 0.2), { top: '#e8e0d0' });
  }
  for (let i = 0; i < 26; i++) g.blob(18 + rng.f(0, 30), 0.38, WALL_FOOT + 44 + rng.f(-4, 4), [0.5, 0.38, 0.4], 0, rng.pick(['#8a6a44', '#9a5a3a', '#7a6a4a', '#a88a54']), { lump: 0.2, seed: i });
  yield 'yard: mill';
  // ---- lamps along the lane, still lit
  for (let z = YD.z0 + 2; z < YD.z1; z += 11) for (const x of [-5, 10.4]) {
    g.cyl(x, 0, z, 0.08, 0.06, 4.4, 6, '#4a4038');
    g.cyl(x, 4.2, z, 0.26, 0.2, 0.42, 6, '#fff0d0', { emit: 3.5 });
    glows.push({ p: [x, 4.45, z], color: '#ffc27a', power: 6.5, size: 1.1 });
  }
  // the station's queue and the yard's people: carriers, sweepers, people looking at the colours
  for (let i = 0; i < 16; i++) spots.push({ p: [rng.sign() * rng.f(4.4, 9.4), 0.92, gwZ0() + rng.f(-5.5, 2)], walk: rng.chance(0.3) ? 0.6 : 0, color: rng.pick(CLOTH) });
  for (let i = 0; i < 40; i++) {
    const x = rng.pick([rng.f(-68, -50), rng.f(-48, -8) , rng.f(14, 68)]), z = rng.f(YD.z0 + 2, YD.z1 - 2);
    spots.push({ p: [x, 0.03, z], walk: rng.chance(0.6) ? rng.f(1, 4) : 0, color: rng.chance(0.5) ? apron(rng.pick(PIGMENTS)) : rng.pick(CLOTH) });
  }
  // people in the lane, keeping to its west side (the flight comes down the east side)
  for (let i = 0; i < 14; i++) spots.push({ p: [rng.f(-5.6, -3.4), 0.03, rng.pick([rng.f(YD.z0 + 6, MARIT.z - 6), rng.f(MARIT.z + 5, YD.z1 - 4)])], walk: rng.chance(0.7) ? rng.f(0.8, 1.8) : 0, color: rng.chance(0.4) ? apron(rng.pick(PIGMENTS)) : rng.pick(CLOTH) });
  for (let i = 0; i < 5; i++) spots.push({ p: [11 + rng.f(-0.5, 0.5), 0.03, YD.z0 + 10 + i * 12], yaw: Math.PI / 2 + Math.PI, color: rng.pick(CLOTH) });      // looking at the trays
  hollow.add(g.mesh(hollow.lit, hollow.frame));
  hollow.add(crowd(spots, hollow.walk, { frame: hollow.frame, bob: 0.12, seed: 'ochre-yard' }));
  // the mill's wheel, turned each frame
  const w = new Geo();
  w.push().rot('z', Math.PI / 2); w.cyl(0, -0.35, 0, 1.35, 1.35, 0.7, 16, '#b8b0a2', { top: '#a8a092', base: true }); w.pop();
  w.box(-0.1, -0.1, -2.6, 0.1, 0.1, 0, '#5a4a3a');
  const wheel = new Mesh(w.build(), hollow.plain);
  wheel.matrixAutoUpdate = false;
  hollow.add(wheel);
  // colour in the air over the slabs and the mill, lit by the lamps
  for (let i = 0; i < 260; i++) {
    const nearMill = i % 3 === 0, x = nearMill ? MX + rng.f(-4, 4) : rng.f(PX0, PX1), z = nearMill ? MZ + rng.f(-4, 4) : rng.f(PZ0, PZ1);
    motes.push({ p: [x, rng.f(0.6, 2.2), z], color: nearMill ? '#e8a850' : rng.pick(PIGMENTS), power: 0.5, size: rng.f(0.05, 0.12), move: [rng.f(-0.05, 0.05), rng.f(0.05, 0.14), rng.f(-0.05, 0.05)], loop: rng.f(6, 12) });
  }
  return { wheel, mill: [MX, MZ] };
}
let GW_Z0 = 390;
const gwZ0 = () => GW_Z0;

// ---------------------------------------------------------------- the front flying hall
// A sock of netting 75 m about the axis from the top terrace's rail out to 300 m (raft-habitat.md), drawn as in
// kittiwake_crosswise.js: a diamond mesh, with heavier ropes, in one transparent draw.
const NET_R = 75, NET_Z0 = 11, NET_Z1 = 300;
const NET_VERT = /* glsl */`
attribute vec2 aM;
varying vec3 vW; varying vec2 vM; varying vec3 vN;
void main() { vW = position; vM = aM; vN = normal; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`;
const netFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform float uCell, uRope, uMainU, uMainV, uMainW, uOpacity; uniform vec3 uCol;
varying vec3 vW; varying vec2 vM; varying vec3 vN;
${rig.glsl}
float kLines(float t, float w, float p) {
  p = max(p, 1e-4);
  float a = t - 0.5 * p + 0.5 * w, b = t + 0.5 * p + 0.5 * w;
  float g1 = floor(a) * w + min(fract(a), w), g2 = floor(b) * w + min(fract(b), w);
  return clamp((g2 - g1) / p, 0.0, 1.0);
}
void main() {
  ${CLIP_FRAG}
  vec2 d = vec2(vM.x + vM.y, vM.x - vM.y) / uCell;
  vec2 pw = fwidth(d);
  float w = uRope / uCell;
  float c1 = kLines(d.x, w, pw.x), c2 = kLines(d.y, w, pw.y);
  vec2 mm = vM / vec2(uMainU, uMainV); vec2 pm = fwidth(mm);
  float c3 = kLines(mm.x, uMainW / uMainU, pm.x), c4 = kLines(mm.y, uMainW / uMainV, pm.y);
  float a = 1.0 - (1.0 - c1) * (1.0 - c2) * (1.0 - c3) * (1.0 - c4);
  vec3 V = normalize(cameraPosition - vW), N = normalize(vN);
  a = 1.0 - pow(max(1.0 - a * uOpacity, 0.0), 1.0 / max(abs(dot(N, V)), 0.07));
  vec3 Lg = (kLight(vW, N, vW, N) + kLight(vW, -N, vW, -N)) * 0.5 + uAmb * 0.6;
  gl_FragColor = vec4(kAir(uCol * Lg, vW), a);
}`;
function netMesh(rig) {
  const pos = [], nrm = [], m = [], idx = [];
  const NA = 200, NZ = 16, circ = TAU * NET_R;
  for (let j = 0; j <= NZ; j++) {
    const z = NET_Z0 + (NET_Z1 - NET_Z0) * (j / NZ);
    for (let i = 0; i <= NA; i++) { const a = (i / NA) * TAU, c = Math.cos(a), s = Math.sin(a); pos.push(NET_R * c, NET_R * s, z); nrm.push(-c, -s, 0); m.push((i / NA) * circ, z); }
  }
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const s0 = pos.length / 3, NR = 10;
  for (let j = 0; j <= NR; j++) {
    const r = 1.8 + (NET_R - 1.8) * Math.pow(j / NR, 0.8);
    for (let i = 0; i <= NA; i++) { const a = (i / NA) * TAU, c = Math.cos(a), s = Math.sin(a); pos.push(r * c, r * s, NET_Z1); nrm.push(0, 0, -1); m.push(r * c, r * s); }
  }
  for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const a = s0 + j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nrm, 3));
  g.setAttribute('aM', new Float32BufferAttribute(m, 2));
  g.setIndex(idx);
  g.boundingSphere = new Sphere(new Vector3(0, 0, (NET_Z0 + NET_Z1) / 2), 190);
  const mat = new ShaderMaterial({
    uniforms: { ...rig.uniforms, uClip: G.uClip, uCell: { value: circ / 400 }, uRope: { value: 0.07 }, uMainU: { value: circ / 24 }, uMainV: { value: 24 }, uMainW: { value: 0.16 }, uOpacity: { value: 0.85 }, uCol: { value: v3('#f2ece0') } },
    vertexShader: NET_VERT, fragmentShader: netFrag(rig), side: DoubleSide, transparent: true, depthWrite: false,
  });
  const mesh = new Mesh(g, mat);
  mesh.renderOrder = 4;
  return mesh;
}
// a ring in its own xy plane
function torus(g, R, r, segs, sides, colAt, emit = 0) {
  const P = (a, b) => [(R + r * Math.cos(b)) * Math.cos(a), (R + r * Math.cos(b)) * Math.sin(a), r * Math.sin(b)];
  const N = (a, b) => [Math.cos(b) * Math.cos(a), Math.cos(b) * Math.sin(a), Math.sin(b)];
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * TAU, a1 = ((i + 1) / segs) * TAU, col = colAt(i);
    for (let j = 0; j < sides; j++) {
      const b0 = (j / sides) * TAU, b1 = ((j + 1) / sides) * TAU;
      g.tri(P(a0, b0), P(a1, b0), P(a1, b1), col, emit, N(a0, b0), N(a1, b0), N(a1, b1));
      g.tri(P(a0, b0), P(a1, b1), P(a0, b1), col, emit, N(a0, b0), N(a1, b1), N(a0, b1));
    }
  }
}
// flyers in sleeves drifting along the hall, each with a hand lamp; the hoop the flight leaves through kept clear
function hallFlyers(hollow, exitPos, rng) {
  const items = [], lamps = [];
  const drift = litMaterial(hollow.rig, { drift: true, soft: 0.5 });
  for (let i = 0; i < 110; i++) {
    const a = i < 45 ? rng.f(-0.7, 0.7) : rng.f(0, TAU), r = rng.f(14, 66), v = rng.f(1.5, 4) * rng.sign(), loop = (NET_Z1 - NET_Z0 - 30) / Math.abs(v);
    const z = v > 0 ? NET_Z0 + 15 : NET_Z1 - 15;
    const p = [r * Math.cos(a), r * Math.sin(a), z];
    // keep the line of each flyer clear of the exit hoop
    const dx = p[0] - exitPos.x, dy = p[1] - exitPos.y;
    if (Math.hypot(dx, dy) < 26) continue;
    const ph = rng();
    items.push({ p, yaw: v > 0 ? 0 : Math.PI, drift: [0, 0, v, loop], phase: ph, color: rng.pick(PIGMENTS), scale: 1 });
    lamps.push({ p: [p[0], p[1], p[2] + (v > 0 ? 0.6 : -0.6)], color: '#ffd89a', power: 5, size: 0.5, move: [0, 0, v], loop, phase: ph });
  }
  const out = instances(figureGeo(SKIN[1], 'fly'), drift, items, { drift: true });
  for (const m of out) hollow.add(m);
  hollow.add(glowPoints(lamps, { maxPx: 30 }));
}

// ---------------------------------------------------------------- an ochre dawn, pressed into one minute
// [t, sun, power, far side, power, glow, power, rod, lamps, windows lit]
const SEQ = [
  [0, '#ffcc90', 0.55, '#f4c088', 0.45, '#a49c8c', 0.36, 16, 1.0, 0.2],
  [22, '#ffd8a8', 0.68, '#f8cc9c', 0.56, '#aca596', 0.38, 22, 0.8, 0.17],
  [44, '#ffe6c4', 0.8, '#fcdcb8', 0.68, '#b4aea0', 0.4, 28, 0.6, 0.14],
  [66, '#fff0d8', 0.9, '#ffe8cc', 0.78, '#b8b4a8', 0.42, 32, 0.5, 0.12],
];
const SEQC = SEQ.map((k) => [new Color(k[1]), new Color(k[3]), new Color(k[5])]);

// ---------------------------------------------------------------- the world
export const ochreChart = {
  id: 'ochre-chart',
  title: 'The chart wall', drum: 'Ochre', row: 'Pigment Row', kind: 'a steady drum', light: 33.1,
  line: 'Every house on Ochre\'s front wall is one colour off a chart, dark at the foot and pale at the top. The grinder matched your bruise in about ten minutes, which annoyed me, so I\'m bringing you a jar.',
  tone: '#d9a65a', source: 'wander-year.md (Day 226), 15-canon.js (Ochre), drum-transport.md (The Hollow and the Spindle)',
  sound: { root: 46, scale: 'mixolydian', pad: 0.5, air: 0.35, crowd: 0.3, bells: 0.15, bright: 0.5, hum: 0.2 },
  *build(ctx) {
    const plan = new Plan(ctx.q.plan);
    yield* paintOchre(plan);
    const s0 = SEQ[0];
    const tiers = {};
    for (let i = 0; i < NT; i++) tiers[i] = { crowd: 0.4, garden: i % 5 === 4 ? 0.55 : 0.22 };
    const wall = {
      chart: 1, chartColors: PIGMENTS, lit: s0[9], crowd: 0.4, garden: 0.25, lifts: 12, winA: '#ffb060', winB: '#ffe0b0', winPower: 1.15,
      stone: '#d8c2a0', stone2: '#c8aa80', pave: '#d6c6a6', gardenColor: '#8a9452', awning: '#a8583a', glass: '#34363a', tiers,
    };
    const back = { ...wall, chart: 0, tiers: undefined, garden: 0.6, houses: ['#7a5428', '#a87a44', '#d9a65a', '#c49a64', '#8a6a44', '#e2c08a'], houseMix: 0.7, stone: '#d9b88a', stone2: '#b89468', glass: '#4a4a48' };
    const hollow = yield* buildHollow(ctx, {
      seed: 'ochre', plan, pavilions: false,
      light: { sun: s0[1], sunPower: s0[2], sunFar: s0[3], sunFarPower: s0[4], sunAngle: 0, sunSharp: 1.2, amb: s0[5], ambPower: s0[6], bounce: '#c8a470', bouncePower: 0.24, air: '#e4d8c4', airDensity: 0.000035, ground: '#ffb468', groundPower: 0.22 },
      sunline: { power: s0[7], halo: 300, haloPower: 0.04 },
      ground: { lamp: s0[8], lampColor: '#ffbe78', people: 1, sunRod: s0[7], canopy: '#7a7a4a', stripes: 0.03 },
      front: wall, back,
    });
    yield 'hollow';
    const chart = chartWall(hollow, { deep: DEEP, pale: PALE, pilaster: '#efe4cc' });
    paintHub(hollow);
    const scene = new Scene();
    scene.add(hollow.group);
    const glows = [], motes = [];

    // ---- the lift
    const gw = guideway();
    yield 'guideway';
    GW_Z0 = gw.zOf(0);
    const station = hollow.frame.stand(X_L, 0);
    const lift = liftGeo(gw, glows).build();
    const liftMesh = new Mesh(lift, hollow.plain);
    liftMesh.matrixAutoUpdate = false; liftMesh.matrix.copy(station);
    hollow.add(liftMesh);
    yield 'lift';
    // cabs going up the spinward track and down the other; one waits in the station for the flight
    const UP_GAP = 150, N_UP = Math.ceil(gw.total / UP_GAP), N_DN = N_UP;
    const cabs = new InstancedMesh(cabGeo(), hollow.plain, N_UP + N_DN + 1);
    cabs.frustumCulled = false;
    hollow.add(cabs);
    const cabM = new Matrix4(), bx = new Vector3(), by = new Vector3(), bz = new Vector3(), bp = new Vector3();
    const placeCab = (i, s, u, down) => {
      if (s < 0 || s > gw.total - 2) { cabM.makeScale(0, 0, 0); cabs.setMatrixAt(i, cabM); return; }
      const p = gw.at(s);
      bz.set(0, p.dy, p.dz); if (down) bz.negate();
      by.set(0, -p.dz, p.dy);
      bx.set(down ? 1 : -1, 0, 0);
      bp.set(u, p.y + by.y * 1.15, p.z + by.z * 1.15);
      cabM.makeBasis(bx, by, bz).setPosition(bp);
      cabM.premultiply(station);
      cabs.setMatrixAt(i, cabM);
    };
    const T_GO = 9.5;                                                  // the flight's cab leaves the station
    const heroS = (t) => (t < T_GO ? 0 : t < T_GO + 8 ? 0.75 * (t - T_GO) ** 2 : 48 + 12 * (t - T_GO - 8));
    const placeCabs = (t) => {
      placeCab(0, heroS(t), TRACK_U[0], false);
      for (let k = 0; k < N_UP; k++) placeCab(1 + k, (12 * t + 75 + k * UP_GAP) % (N_UP * UP_GAP), TRACK_U[0], false);
      for (let k = 0; k < N_DN; k++) placeCab(1 + N_UP + k, gw.total - 2.5 - ((12 * t + 40 + k * UP_GAP) % (N_DN * UP_GAP)), TRACK_U[1], true);
      cabs.instanceMatrix.needsUpdate = true;
    };
    placeCabs(0);
    // the guideway's lamps, in drum space
    const liftGlows = glows.splice(0).map((q) => { const v = new Vector3(...q.p).applyMatrix4(station); return { ...q, p: v.toArray() }; });

    // ---- the terraces, the yard
    const tglows = [];
    const tiers2 = yield* dressTerraces(hollow, tglows, ctx);
    yield 'terraces';
    const yard = yield* buildYard(hollow, glows, motes, ctx);
    yield 'yard';

    // ---- the flight
    const gz = (y) => gw.zOf(y);
    const camF = (u, y, z) => [X_L + (u * RH) / (RH - y), y, z];
    const up0 = [0, 1, 0], upR = (deg) => [-Math.sin((deg * Math.PI) / 180), Math.cos((deg * Math.PI) / 180), 0];
    const path = makePath([
      { t: 0, p: [8, 2.2, WALL_FOOT + 104], up: up0 },
      { t: 5, p: [1.6, 2.7, MARIT.z + 6], look: [MARIT.x - 1.3, 1.25, MARIT.z - 0.6], up: up0 },
      { t: 9, p: [7, 4.4, GW_Z0 + 17], look: [2.3, 1.6, GW_Z0], up: up0 },
      { t: 12.5, p: camF(13, 12, gz(12) + 10), look: camF(2.3, 11, gz(11) + 1), up: up0 },
      { t: 16, p: camF(10, 34, gz(34) + 9), look: camF(1, 90, gz(90)), up: up0 },
      { t: 21, p: camF(24, 190, gz(190) + 34), look: camF(-40, 300, gz(300) - 30), up: up0 },
      { t: 26, p: camF(60, 420, gz(420) + 120), look: [1500, 200, 600], up: up0, fov: 64 },
      { t: 31, p: camF(56, 650, gz(650) + 110), look: [520, 260, 820], up: up0, fov: 68 },
      { t: 36, p: camF(26, 900, gz(900) + 50), look: camF(-12, 1000, gz(1000) - 20), up: up0 },
      { t: 41, p: camF(16, 1150, gz(1150) + 26), look: camF(-6, 1260, gz(1260) - 10), up: upR(30) },
      { t: 45.5, p: camF(11, 1320, gz(1320) + 16), look: camF(-30, 1350, gz(1350) - 12), up: upR(75) },
      { t: 49, p: camF(7, 1400, gz(1400) + 12), look: camF(-10, 1380, gz(1380) - 6), up: upR(140) },
      { t: 53, p: [0, 1445, 85], look: [0, 1450, 300], up: upR(180), fov: 66 },
      { t: 57, p: [0, 1440, 205], look: [0, 1150, 40], up: upR(180), fov: 68 },
      { t: 60.5, p: [0, 1458, 236], look: [0, 1500, 0], up: upR(180), fov: 74 },
      { t: 65, p: [0, 1460, 172], up: upR(180) },
    ], { frame: hollow.frame, entryRadius: 1.6, exitRadius: 11 });
    yield 'path';
    const pts = path.points(0.5);
    yield* scatterTrees(hollow, { near: pts.filter((q) => q.y < 40), radius: 120, max: 1400, wood: [{ kind: 'round', weight: 3, tint: [0.9, 0.85, 0.7] }, { kind: 'birch', weight: 1 }] });
    hollow.lampPosts({ near: pts.filter((q) => q.y < 40), radius: 180, power: 5, color: '#ffbe78' });
    yield 'trees';

    // ---- the hall: net, flyers, the hoop out
    scene.add(netMesh(hollow.rig));
    hallFlyers(hollow, path.exit.pos, makeRng('ochre-flyers'));
    const hg = new Geo(), R = path.exit.radius + 0.6;
    torus(hg, R, 0.35, 96, 7, (i) => chipJS(i / 8, 0.55));
    const hoop = hg.mesh(hollow.plain);
    hoop.position.copy(path.exit.pos); hoop.quaternion.copy(path.exit.quat); hoop.updateMatrixWorld(true);
    hollow.add(hoop);
    const hoopLamps = [];
    for (let i = 0; i < 36; i++) { const a = (i / 36) * TAU, v = new Vector3(Math.cos(a) * (R + 0.6), Math.sin(a) * (R + 0.6), 0).applyMatrix4(hoop.matrixWorld); hoopLamps.push({ p: v.toArray(), color: '#ffdca0', power: 6, size: 0.6, twinkle: 0.08, phase: i / 36 }); }
    yield 'hall';

    // ---- small lights: lift, terraces, yard (bent), colour in the air, the hoop
    const lightsW = glowPoints([...liftGlows, ...tglows, ...hoopLamps], { maxPx: 60 });
    hollow.add(lightsW);
    const yardLamps = hollow.glow(glows, { maxPx: 70 });
    hollow.glow(motes, { minPx: 1, maxPx: 6, soft: 2 });

    // ---- light over the minute
    const rig = hollow.rig, sun = new Color(), farC = new Color(), amb = new Color();
    function light(t) {
      let i = 0; while (i < SEQ.length - 2 && SEQ[i + 1][0] <= t) i++;
      const a = SEQ[i], b = SEQ[i + 1], u = smoothstep(a[0], b[0], t), ca = SEQC[i], cb = SEQC[i + 1];
      const m = (j) => a[j] + (b[j] - a[j]) * u;
      sun.copy(ca[0]).lerp(cb[0], u); farC.copy(ca[1]).lerp(cb[1], u); amb.copy(ca[2]).lerp(cb[2], u);
      rig.set({ sun, sunPower: m(2), sunFar: farC, sunFarPower: m(4), amb, ambPower: m(6) });
      hollow.setRod(m(7));
      hollow.setNight(m(8), m(9));
      yardLamps.material.uniforms.uPower.value = 0.5 + 0.5 * m(8);
    }
    light(0);
    const mill = new Matrix4(), rot = new Matrix4(), q = new Quaternion(), yAx = new Vector3(0, 1, 0);
    const millAt = hollow.frame.stand(yard.mill[0], yard.mill[1]);
    const look = { exposure: 1.55, bloom: 0.24, threshold: 0.75, saturation: 1.06, contrast: 1.04, vignette: 0.45, lift: [0.008, 0.005, 0.0], gain: [1.02, 1.0, 0.95] };
    return {
      scene, path, hollow, near: 0.2, far: 9000, look, portal: { rim: false, mist: '#d9a65a' },
      update(t, dt, camera) {
        light(t);
        placeCabs(t);
        // the mill's wheel goes round its basin, rolling
        const a = t * 0.9;
        q.setFromAxisAngle(yAx, a); rot.makeRotationFromQuaternion(q);
        mill.copy(millAt).multiply(rot).multiply(new Matrix4().makeTranslation(0, 2.2, 2.0));
        yard.wheel.matrix.copy(mill);
        // people on terraces far from the camera are too small to see
        for (const k of tiers2) { const vis = camera.position.distanceTo(k.centre) < 700; for (const mm of k.folk) mm.visible = vis; }
      },
    };
  },
};
