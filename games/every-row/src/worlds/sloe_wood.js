// Sloe, Hedge Row: the silent wood. A wood drum, whose parks are "one long dim wood instead of bright squares"
// (wander-year.md, Day 22; open-drums.md, Kinds of open drum). The Hollow is "one long dim wood of yews and birches,
// with paths of packed bark", the lake shore is for residents, and the dawn is a slow grey-green ramp that barely
// reaches white (three-nights 15-canon.js, Sloe).
//
// Not canon (this page's own, kept small):
//   - the layout: six straight rides (long clearings) along the axis and three right round the drum, lined with
//     birches, a glade with a lift pavilion where they cross, stands of birch in the yews, winding bark paths
//     everywhere else, and one long lake lying across the middle ride, with a yew island in it
//   - the ring of lashed birch poles standing in the lake, which this page leaves through
//   - the woodwarden's coat, her white hair and her slate's wooden frame (the docs give only her age, her sixty
//     years with the yews, and LISTEN)
//   - the light: the line at about a third of full sun, the hour not named
import {
  Scene, Group, Mesh, BufferGeometry, Float32BufferAttribute, ShaderMaterial, Vector3, Matrix4,
  CanvasTexture, SRGBColorSpace, DoubleSide, Sphere,
} from 'three';
import { Plan, C, L } from '../kit/plan.js';
import { buildHollow, pavilionGeo, WOOD_CELL } from '../kit/hollow.js';
import { makePath } from '../core/path.js';
import { Geo, instances, rgb } from '../kit/geo.js';
import { litMaterial, G, BEND_PARS, CLIP_PARS, CLIP_FRAG } from '../kit/mats.js';
import { SKIN } from '../kit/folk.js';
import { DRUM } from '../kit/drum.js';
import { makeRng, hash2, cellRand, smoothstep, TAU } from '../core/rng.js';

const X0 = 2000, ZM = 1875;              // the long ride runs right round the drum at ZM; the flight starts near X0
const XL = X0 + 1000, ZL = ZM, LRX = 380, LRZ = 150;     // the lake, lying across the ride
const RINGS = [1050, ZM, 2700];          // rides round the drum
const AXIAL = X0 - 300;                  // the first of six rides along the axis
const ZW = ZM + 70, WX = X0 + 11.6, WZ = ZW - 0.5;      // the bark path in the yews, and where the woodwarden stands on it
const BARK = '#5f5044', MOSS = ['#55624c', '#5d6a52', '#515e48'], BIRCHLAND = ['#4d564b', '#535b4f', '#495146'];
const GLADE = ['#4a5744', '#505d48', '#46523f'];

// Crowns seen from a kilometre or more: clumps and single trees as a grain of lighter and darker over the land,
// laid straight onto the colour layer with two repeating tiles of different sizes.
function* canopyGrain(plan) {
  const rng = makeRng('sloe-grain');
  for (const [size, cell, amp] of [[256, 4, 65], [512, 16, 55]]) {
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    const tx = cv.getContext('2d'), img = tx.createImageData(size, size), d = img.data, n = size / cell, grid = [];
    for (let i = 0; i < n * n; i++) grid.push(rng());
    const at = (i, j) => grid[((j % n) + n) % n * n + ((i % n) + n) % n];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const gx = x / cell, gy = y / cell, i = Math.floor(gx), j = Math.floor(gy), fx = gx - i, fy = gy - j;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const v = (at(i, j) * (1 - sx) + at(i + 1, j) * sx) * (1 - sy) + (at(i, j + 1) * (1 - sx) + at(i + 1, j + 1) * sx) * sy;
      const g = Math.max(0, Math.min(255, 128 + ((0.65 * v + 0.35 * rng()) - 0.5) * 2 * amp)), k = (y * size + x) * 4;
      d[k] = d[k + 1] = d[k + 2] = g; d[k + 3] = 255;
      if (x === size - 1 && (y & 127) === 127) yield;
    }
    tx.putImageData(img, 0, 0);
    // queued with the rest of the painting (the kit draws a layer three times, a turn apart: this needs doing once)
    plan.layer('alb', (c, k) => {
      if (k !== 0) return;
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'overlay';
      c.fillStyle = c.createPattern(cv, 'repeat'); c.fillRect(0, 0, plan.w, plan.h);
    });
  }
}

function* paintSloe(plan) {
  const rng = makeRng('sloe-plan');
  // the whole floor is wood: yew, dark, its crowns seen from far off as a fine grain of darker and lighter
  plan.fill(plan.band(0, L), { color: '#3a4a3e', wood: 1 });
  for (let k = 0; k < 2; k++) { plan.mottle(['#33433a', '#425146', '#2f3d36', '#47554a', '#3b4a3a'], 350, 140, { alpha: 0.5, seed: 'sloe-yew' + k }); yield; }
  for (let k = 0; k < 5; k++) { plan.mottle(['#2b382f', '#3e4c3f', '#4a584b', '#323f36', '#4f5c4a', '#283229'], 520, 38, { alpha: 0.5, seed: 'sloe-crowns' + k }); yield; }
  // stands of birch, greyer
  const stands = [];
  for (let i = 0; i < 140; i++) {
    const x = rng.f(0, C), z = rng.f(380, L - 380), r = rng.f(30, 150), rz = r * rng.f(0.5, 1.1);
    plan.fill(plan.blob(x, z, r, rz, { wobble: 0.45, lobes: 6, seed: i + 5, n: 40 }), { color: rng.pick(BIRCHLAND), alpha: 0.8, feather: 30 });
    stands.push([x, z, r * 0.9, rz * 0.9]);
  }
  yield;
  yield* canopyGrain(plan);
  yield;
  // the Dim Ends, under the walls, where the line's light falls away
  plan.fill(plan.band(-200, 470), { color: '#25302b', alpha: 0.55, feather: 90 });
  plan.fill(plan.band(L - 470, L + 200), { color: '#25302b', alpha: 0.55, feather: 90 });
  // glades
  for (let i = 0; i < 100; i++) {
    const x = rng.f(0, C), z = rng.f(420, L - 420), r = rng.f(8, 30);
    if (Math.abs(z - ZW) < 70 && x > X0 - 120 && x < X0 + 160) continue;
    plan.fill(plan.blob(x, z, r, r * rng.f(0.6, 1.1), { wobble: 0.35, lobes: 4, seed: i + 200, n: 24 }), { color: rng.pick(GLADE), clear: ['wood'] });
    if (i % 50 === 49) yield;
  }
  // winding bark paths through it all
  const bark = (pts, w) => { plan.stroke(pts, w + 5, { clear: ['wood'] }); plan.stroke(pts, w, { color: BARK }); };
  for (let i = 0; i < 300; i++) {
    let x = rng.f(0, C), z = rng.f(420, L - 420), a = rng.f(0, TAU);
    const pts = [];
    for (let k = 0; k < 28; k++) { pts.push([x, z]); a += rng.f(-0.35, 0.35); x += Math.cos(a) * 30; z += Math.sin(a) * 30; if (z < 400 || z > L - 400) break; }
    if (pts.length > 3) bark(pts, 2.4);
    if (i % 50 === 49) yield;
  }
  // the rides: long straight clearings of moss with a bark path down the middle, lined with birches
  const ride = (a, b, w) => {
    plan.stroke(plan.line([a, b]), w, { color: MOSS[0], clear: ['wood'] });
    const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), nx = -dz / len, nz = dx / len, e = w / 2 + 6;
    for (const s of [-1, 1]) plan.stroke(plan.line([[a[0] + nx * e * s, a[1] + nz * e * s], [b[0] + nx * e * s, b[1] + nz * e * s]]), 12, { color: '#4f5a4b' });
    plan.stroke(plan.line([a, b]), 4, { color: BARK });
  };
  for (let k = 0; k < 6; k++) { const x = AXIAL + (k * C) / 6; ride([x, 520], [x, L - 520], 32); }
  for (const z of RINGS) ride([-60, z], [C + 60, z], z === ZM ? 44 : 32);
  yield;
  const pav = [];
  for (let k = 0; k < 6; k++) for (const z of RINGS) {
    const x = AXIAL + (k * C) / 6;
    if (Math.hypot((x - XL) / (LRX + 80), (z - ZL) / (LRZ + 80)) < 1) continue;
    if (z === ZM && Math.abs(((x - XL - C / 2) % C + C * 1.5) % C - C / 2) < 600) continue;     // keep it out of the lake's mirror
    plan.fill(plan.blob(x, z, 52, 48, { wobble: 0.15, seed: k * 7 + z, n: 32 }), { color: MOSS[1], clear: ['wood'] });
    plan.stroke(plan.line([[x - 60, z], [x + 60, z]]), 4, { color: BARK }); plan.stroke(plan.line([[x, z - 60], [x, z + 60]]), 4, { color: BARK });
    pav.push([x + 22, z + 22]);
  }
  // a few more lift pavilions in glades of their own, deep in the wood
  for (let i = 0; i < 26; i++) {
    const x = rng.f(0, C), z = rng.f(600, L - 600);
    if (Math.abs(z - ZM) < 400 && x > X0 - 300 && x < X0 + 1400) continue;
    plan.fill(plan.blob(x, z, 22, 20, { seed: i + 600, n: 24 }), { color: MOSS[2], clear: ['wood'] });
    pav.push([x, z]);
  }
  plan.dots(pav, 9, { color: '#9d988a', alpha: 0.85, clear: ['wood'] });
  yield;
  // the bark path the flight begins on, through the yews and out onto the long ride
  const start = [[X0 - 200, ZW + 14], [X0 - 110, ZW + 6], [X0 - 40, ZW], [X0 + 10, ZW], [X0 + 60, ZW], [X0 + 120, ZW - 6], [X0 + 175, ZW - 24], [X0 + 215, ZW - 50], [X0 + 240, ZM + 8]];
  plan.stroke(start, 9, { clear: ['wood'] }); plan.stroke(start, 3.2, { color: BARK });
  // the lake, its shore walk (for residents), and an island of yews
  const lake = plan.blob(XL, ZL, LRX, LRZ, { wobble: 0.12, lobes: 6, seed: 23 });
  plan.stroke(lake, 12, { color: '#4f5646', clear: ['wood'] });
  plan.fill(lake, { color: '#33413c', water: 1, clear: ['wood'] });
  plan.fill(plan.blob(XL - 95, ZL - 48, 24, 16, { seed: 31, n: 24 }), { color: '#36463a', clear: ['water'], wood: 1 });
  return { pav, stands };
}

// Is a tree here a birch? In the stands, and in the rows along every ride's edge; elsewhere now and then.
function birchChance(stands, x, z) {
  for (const zr of RINGS) { const d = Math.abs(z - zr), h = zr === ZM ? 22 : 16; if (d > h && d < h + 13) return 0.9; }
  for (let k = 0; k < 6; k++) { let d = Math.abs(x - (AXIAL + (k * C) / 6)); d = Math.min(d, C - d); if (d > 16 && d < 29) return 0.9; }
  for (const s of stands) { const u = (x - s[0]) / s[2], v = (z - s[1]) / s[3]; if (u * u + v * v < 1) return 0.85; }
  return 0.06;
}

// ---------------------------------------------------------------- trees
// Old yews: a short thick trunk and a broad, heavy, dark crown, darker underneath.
function yewGeo() {
  const g = new Geo();
  g.cyl(0, 0, 0, 0.85, 0.5, 4.2, 6, '#4e3528');
  g.tint(1);
  g.blob(0, 6.4, 0, [4.4, 3.6, 4.4], 0, '#ffffff', { lump: 0.3, seed: 11, shadeBottom: 0.45 });
  g.blob(1.3, 9.2, 0.5, [2.7, 2.6, 2.7], 0, '#ffffff', { lump: 0.3, seed: 13, shadeBottom: 0.6 });
  g.blob(-1.6, 4.6, -1.2, [2.6, 2.0, 2.6], 0, '#ffffff', { lump: 0.3, seed: 17, shadeBottom: 0.4 });
  g.tint(0);
  return g.build();
}
// Birches: a tall pale stem with a dark mark, a light crown high up.
function birchGeo() {
  const g = new Geo();
  g.cyl(0, 0, 0, 0.24, 0.09, 17.5, 5, '#dcd9ce');
  g.cyl(0, 2.1, 0, 0.245, 0.24, 0.35, 5, '#2e2b28', { cap: false });
  g.tint(1);
  g.blob(0, 14.8, 0, [2.6, 3.6, 2.6], 0, '#ffffff', { lump: 0.3, seed: 6, shadeBottom: 0.5 });
  g.blob(1.1, 11.8, 0.6, [1.8, 2.0, 1.8], 0, '#ffffff', { lump: 0.25, seed: 9, shadeBottom: 0.5 });
  g.blob(-0.9, 12.8, -0.8, [1.7, 2.0, 1.7], 0, '#ffffff', { lump: 0.25, seed: 4, shadeBottom: 0.5 });
  g.tint(0);
  return g.build();
}

// Read the plan at full size over one region (the kit's sampler is too coarse for three-metre paths).
function regionSampler(plan, x0, z0, x1, z1) {
  const sx = plan.w / C, sz = plan.h / L;
  const px0 = Math.floor(x0 * sx), pz0 = Math.floor(z0 * sz), w = Math.ceil((x1 - x0) * sx), h = Math.ceil((z1 - z0) * sz);
  const M = plan.cx.mask.getImageData(px0, pz0, w, h).data, out = { water: 0, wood: 0 };
  return (x, z) => {
    let ix = Math.floor(x * sx) - px0, iz = Math.floor(z * sz) - pz0;
    ix = ix < 0 ? 0 : ix >= w ? w - 1 : ix; iz = iz < 0 ? 0 : iz >= h ? h - 1 : iz;
    const i = (iz * w + ix) * 4;
    out.water = M[i] / 255; out.wood = M[i + 1] / 255;
    return out;
  };
}

// Stand real trees where the ground draws crowns, near the flight (each point carries its own radius) and all round
// the lake shore, keeping the air the camera flies through clear.
function* plantWood(hollow, plan, near, box, stands) {
  const t0 = performance.now();
  const at = regionSampler(plan, box[0], box[1], box[2], box[3]);
  if (/debug/.test(location.search)) console.log(`[sloe] sampler ${(performance.now() - t0).toFixed(0)} ms`);
  yield;
  const S = WOOD_CELL, lists = { yew: [], birch: [] }, mirror = { yew: [], birch: [] };
  const yewC = rgb('#41543f'), birchC = rgb('#5d684c');
  let n = 0;
  for (let gz = Math.floor(box[1] / S); gz * S < box[3]; gz++) {
    for (let gx = Math.floor(box[0] / S); gx * S < box[2]; gx++) {
      const r = cellRand(gx, gz);
      const x = (gx + 0.15 + 0.7 * r[0]) * S, z = (gz + 0.15 + 0.7 * r[1]) * S;
      const s = at(x, z);
      if (r[2] >= s.wood + 0.02 || s.water > 0.2) continue;
      // near the lake? (the whole shore stands, and is mirrored)
      const el = Math.hypot((x - XL) / (LRX + 50), (z - ZL) / (LRZ + 50));
      const shore = el < 1;
      let keep = shore, clear = false;
      for (let i = 0; i < near.length; i++) {
        const q = near[i], dx = q.x - x, dz = q.z - z, d2 = dx * dx + dz * dz;
        if (q.y < 32 && d2 < (q.y < 3 ? 42 : 64)) { clear = true; break; }
        if (!keep) { const R = q.r; if (d2 < R * R) keep = true; else if (d2 < 2.25 * R * R && hash2(gx, gz, 37) < 1 - (Math.sqrt(d2) - R) / (0.5 * R)) keep = true; }
      }
      if (clear || !keep) continue;
      const birch = hash2(gx, gz, 41) < birchChance(stands, x, z);
      const rad = S * (0.36 + 0.2 * r[3]), sc = (rad / 3.6) * 1.12;
      const k = 0.8 + 0.4 * r[3], base = birch ? birchC : yewC;
      const col = [base[0] * k, base[1] * k, base[2] * k * (0.92 + 0.16 * hash2(gx, gz, 5))];
      const item = { p: [x, 0, z], yaw: hash2(gx, gz, 71) * 6.28, scale: [sc, sc * (birch ? 1.0 + 0.3 * hash2(gx, gz, 83) : 0.9 + 0.3 * hash2(gx, gz, 83)), sc], color: col };
      (birch ? lists.birch : lists.yew).push(item);
      if (shore && el > 0.8) (birch ? mirror.birch : mirror.yew).push(item);
    }
    if ((++n & 7) === 0) yield;
  }
  return { lists, mirror, at };
}

// ---------------------------------------------------------------- the lake as a mirror
// Draws a copy of anything (bent or not) reflected in the floor, put where the eye's ray to the reflection crosses
// the water, so it sits on the lake, behind whatever really stands in front, and only where the plan has water.
const MIRROR_VERT = /* glsl */`
attribute vec4 aCol;
${BEND_PARS}
uniform float uFloor;
varying vec3 vW; varying vec3 vP; varying vec3 vN; varying vec3 vCol; varying float vSoft;
void main() {
  vec3 p = position, n = normal;
  #ifdef USE_INSTANCING
  p = (instanceMatrix * vec4(p, 1.0)).xyz; n = mat3(instanceMatrix) * n;
  #endif
  kBend(p, n);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vec3 P = wp.xyz; vP = P; vN = normalize(mat3(modelMatrix) * n);
  float r = max(length(P.xy), 1.0);
  vec3 M = vec3(P.xy * ((2.0 * uFloor - r) / r), P.z);
  vec3 Cm = cameraPosition, D = M - Cm;
  float a = max(dot(D.xy, D.xy), 1e-6), b = 2.0 * dot(Cm.xy, D.xy), c = dot(Cm.xy, Cm.xy) - uFloor * uFloor;
  float t = (-b + sqrt(max(b * b - 4.0 * a * c, 0.0))) / (2.0 * a);
  vW = Cm + D * (t * 0.997);
  vec3 col = aCol.rgb;
  #ifdef USE_INSTANCING_COLOR
  col = mix(col, col * instanceColor, aCol.a);
  #endif
  vCol = col; vSoft = aCol.a;
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
}`;
const mirrorFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform sampler2D tMask; uniform float uA0, uDim;
varying vec3 vW; varying vec3 vP; varying vec3 vN; varying vec3 vCol; varying float vSoft;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  float u = fract((atan(vW.y, vW.x) - uA0) / 6.2831853);
  if (texture2D(tMask, vec2(u, vW.z / ${L.toFixed(1)})).r < 0.5) discard;
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  N = normalize(mix(N, kUp(vP), vSoft * 0.7));
  vec3 c = vCol * kLight(vP, N, vP, N);
  vec3 V = normalize(cameraPosition - vW);
  float ndv = max(dot(kUp(vW), V), 0.0);
  float fres = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
  c *= mix(0.3, 0.92, fres) * uDim;
  gl_FragColor = vec4(kAir(c, vW), 1.0);
}`;
function mirrorMaterial(rig, tex, frame, dim = 1) {
  return new ShaderMaterial({
    uniforms: { ...rig.uniforms, uClip: G.uClip, uTime: G.uTime, uFloor: { value: DRUM.RH }, tMask: { value: tex.mask }, uA0: { value: 0 }, uDim: { value: dim },
      uBend: { value: frame ? new Vector3(frame.a0, frame.z0, frame.floorR) : new Vector3(0, 0, 0) } },
    vertexShader: MIRROR_VERT, fragmentShader: mirrorFrag(rig), side: DoubleSide,
  });
}

// ---------------------------------------------------------------- people, each with a slate
const CLOTHES = ['#5d655b', '#7a7468', '#4d5a5e', '#8b8574', '#3f4744', '#6b5e50', '#9a9a8c', '#55604f', '#6f6a5c', '#4a4f47'];
const SLATE = '#cfd2c8';
const folkCache = new Map();
function folkGeo(skin, pose) {
  const key = skin + pose;
  if (folkCache.has(key)) return folkCache.get(key);
  const g = new Geo();
  if (pose === 'sit') {
    g.tint(0.35).box(-0.17, 0.0, 0.0, 0.17, 0.2, 0.52, '#5a5e58');
    g.tint(1).cyl(0, 0.18, 0, 0.22, 0.17, 0.6, 6, '#ffffff', { smooth: false });
    g.tint(0).blob(0, 0.94, 0.02, 0.13, 0, skin, { shadeBottom: 0.8 });
    g.box(-0.15, 0.3, 0.3, 0.15, 0.32, 0.52, SLATE);
  } else {
    g.tint(0.35).box(-0.15, 0, -0.1, 0.15, 0.86, 0.1, '#5a5e58');
    g.tint(1).cyl(0, 0.8, 0, 0.24, 0.17, 0.66, 6, '#ffffff', { smooth: false });
    g.tint(0).blob(0, 1.6, 0.02, 0.125, 0, skin, { shadeBottom: 0.8 });
    if (pose === 'read') { g.box(-0.15, 1.04, 0.2, 0.15, 1.26, 0.23, SLATE); g.box(-0.2, 1.0, 0.02, 0.2, 1.08, 0.22, skin); }
    else g.box(0.21, 0.74, -0.12, 0.24, 0.96, 0.1, SLATE);
  }
  const geo = g.build();
  folkCache.set(key, geo);
  return geo;
}

// The woodwarden: ninety, a long coat, white hair, both hands holding up her slate.
function wardenGeo() {
  const g = new Geo();
  g.at(WX, 0, WZ, -Math.PI / 2);
  g.cyl(0, 0, 0, 0.3, 0.24, 1.0, 7, '#4b5446', { smooth: false });           // the coat's skirt
  g.cyl(0, 1.0, 0.02, 0.24, 0.2, 0.36, 7, '#535d4d', { smooth: false });     // body, a little bent
  g.cyl(0, 1.36, 0.05, 0.2, 0.08, 0.1, 7, '#535d4d', { smooth: false });
  g.cyl(0, 1.38, 0.06, 0.06, 0.06, 0.1, 5, '#c79e80');                       // neck
  g.blob(0, 1.53, 0.08, [0.11, 0.125, 0.115], 1, '#c99f82', { shadeBottom: 0.8 });
  g.blob(0, 1.58, 0.05, [0.125, 0.11, 0.125], 0, '#e6e3dc', { lump: 0.15, seed: 3 });   // white hair
  g.blob(0, 1.53, -0.04, [0.08, 0.08, 0.06], 0, '#dedad2', { seed: 5 });                 // a knot of it behind
  // arms forward to the slate, and its wooden frame
  g.box(-0.24, 1.08, 0.0, -0.17, 1.3, 0.1, '#4b5446'); g.box(0.17, 1.08, 0.0, 0.24, 1.3, 0.1, '#4b5446');
  g.box(-0.22, 1.08, 0.08, -0.15, 1.15, 0.33, '#4b5446'); g.box(0.15, 1.08, 0.08, 0.22, 1.15, 0.33, '#4b5446');
  g.box(-0.215, 1.07, 0.32, 0.215, 1.37, 0.35, '#5a4535');
  g.cube(-0.2, 1.12, 0.345, 0.05, 0.06, 0.04, '#c79e80'); g.cube(0.2, 1.12, 0.345, 0.05, 0.06, 0.04, '#c79e80');      // hands
  g.pop();
  return g;
}
// The chalked face of her slate, as its own quad with a picture on it.
function slateFace() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 360;
  const cx = cv.getContext('2d'), rng = makeRng('slate');
  cx.fillStyle = '#2a2f2e'; cx.fillRect(0, 0, 512, 360);
  for (let i = 0; i < 60; i++) { cx.fillStyle = `rgba(214,220,210,${(0.015 + 0.035 * rng()).toFixed(3)})`; cx.beginPath(); cx.ellipse(rng.f(0, 512), rng.f(0, 360), rng.f(20, 90), rng.f(8, 30), rng.f(0, 3), 0, TAU); cx.fill(); }
  let size = 150;
  const font = (s) => `${s}px "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive`;
  cx.font = font(size); while (cx.measureText('LISTEN').width > 420 && size > 40) { size -= 4; cx.font = font(size); }
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  for (let k = 0; k < 7; k++) { cx.fillStyle = `rgba(238,241,232,${k === 0 ? 0.8 : 0.22})`; cx.fillText('LISTEN', 256 + rng.f(-2.5, 2.5), 188 + rng.f(-2.5, 2.5)); }
  // the chalk is grainy
  cx.fillStyle = 'rgba(42,47,46,0.45)';
  for (let i = 0; i < 2200; i++) { const s = rng.f(1, 3); cx.fillRect(rng.f(60, 452), rng.f(110, 270), s, s); }
  const t = new CanvasTexture(cv); t.colorSpace = SRGBColorSpace; t.anisotropy = 8;
  // the quad, in the warden's own frame turned to flat metres (she faces -x, back along the path)
  const lp = (lx, ly) => [WX - (0.375 - 0.08 * ((ly - 1.22) / 0.14)), ly, WZ + lx];
  const a = lp(-0.195, 1.085), b = lp(0.195, 1.085), c = lp(0.195, 1.355), dd = lp(-0.195, 1.355);
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...dd], 3));
  const nn = [-1, 0.26, 0];
  geo.setAttribute('normal', new Float32BufferAttribute([...nn, ...nn, ...nn, ...nn, ...nn, ...nn], 3));
  geo.setAttribute('uv', new Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2));
  return { tex: t, geo };
}
const SLATE_VERT = /* glsl */`
${BEND_PARS}
varying vec3 vW; varying vec3 vN; varying vec2 vUv;
void main() {
  vec3 p = position, n = normal;
  kBend(p, n);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n); vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const slateFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform sampler2D tMap;
varying vec3 vW; varying vec3 vN; varying vec2 vUv;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 c = gl_FrontFacing ? texture2D(tMap, vUv).rgb : vec3(0.09, 0.06, 0.04);
  vec3 Lg = kLight(vW, normalize(mix(N, kUp(vW), 0.55)), vW, N);
  gl_FragColor = vec4(kAir(c * Lg * 1.15, vW), 1.0);
}`;

// ---------------------------------------------------------------- the ring of birch poles
function ringGeo(drop) {
  const g = new Geo(), rng = makeRng('ring'), R = 10.9, N = 13, pale = '#dedbd0', mark = '#2f2c29';
  const pole = (p0, p1, r) => {
    g.tube([p0, p1], r, 5, pale, { smooth: false });
    // dark marks on the bark
    for (let k = 0; k < 3; k++) { const t = rng.f(0.15, 0.85), w = rng.f(0.04, 0.1); const a = p0.map((v, i) => v + (p1[i] - v) * t), b = p0.map((v, i) => v + (p1[i] - v) * (t + w / Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]))); g.tube([a, b], r * 1.06, 5, mark, { smooth: false }); }
  };
  const pts = [];
  for (let i = 0; i < N; i++) { const a = (i / N) * TAU + rng.f(-0.05, 0.05); pts.push([Math.cos(a) * (R + rng.f(-0.2, 0.2)), Math.sin(a) * (R + rng.f(-0.2, 0.2)), rng.f(-0.25, 0.25)]); }
  for (let i = 0; i < N; i++) {
    const p = pts[i], q = pts[(i + 1) % N], d = q.map((v, k) => v - p[k]), len = Math.hypot(d[0], d[1], d[2]), e = 0.45 / len;
    pole(p.map((v, k) => v - d[k] * e), q.map((v, k) => v + d[k] * e), 0.13);
    g.blob(p[0], p[1], p[2], [0.24, 0.24, 0.24], 0, mark, { lump: 0.2, seed: i + 1 });       // lashing
  }
  // four splayed legs down into the water
  for (const [ang, dz] of [[235, -2.4], [235, 2.4], [305, -2.4], [305, 2.4]]) {
    const a = (ang * Math.PI) / 180, top = [Math.cos(a) * R, Math.sin(a) * R, 0];
    pole(top, [Math.cos(a) * R * 1.25, -drop - 1.5, dz], 0.15);
  }
  return g;
}

export const sloeWood = {
  id: 'sloe-wood',
  title: 'The silent wood', drum: 'Sloe', row: 'Hedge Row', kind: 'a wood drum', light: 8.7,
  line: 'Nobody talks in the wood. A woodwarden who has kept the same yews for sixty years wrote LISTEN on her slate and walked off. So I did.',
  tone: '#8a9a84', source: 'wander-year.md (Day 22), open-drums.md (Kinds of open drum)',
  sound: { root: 41, scale: 'aeolian', pad: 0.1, air: 0.5, hum: 0.55, water: 0.05, crowd: 0, choir: 0, bells: 0, bright: 0.12 },
  *build(ctx) {
    const plan = new Plan(ctx.q.plan);
    const { pav, stands } = yield* paintSloe(plan);
    yield;
    const hollow = yield* buildHollow(ctx, {
      seed: 'sloe', plan, pavilions: false,
      light: { sun: '#e4ead9', sunPower: 0.34, amb: '#8a9a84', ambPower: 0.2, bounce: '#5f6e58', bouncePower: 0.14, air: '#8a9a84', airDensity: 0.00009 },
      sunline: { power: 12, haloPower: 0.02 },
      ground: { people: 0, sunRod: 8, wave: 0.003, grain: 0.32, stripes: 0, woodHeight: 9, water: '#ffffff' },
      front: { lit: 0.1, crowd: 0.04, houseMix: 0.4, winPower: 1.6, winA: '#ffc98a', winB: '#f1e4c6', stone: '#8f978a', stone2: '#80897c', glass: '#2f3d36', gardenColor: '#4f6a4a', awning: '#6a5a48', houses: ['#b9bfae', '#a8b2a0', '#c9c8b8', '#8f9c8c', '#d2d0c2', '#9fa89a'], garden: 0.95 },
      back: { lit: 0.13, crowd: 0.04, houseMix: 0.4, winPower: 1.6, winA: '#ffc98a', winB: '#f1e4c6', stone: '#8f978a', stone2: '#80897c', glass: '#2f3d36', gardenColor: '#4f6a4a', awning: '#6a5a48', houses: ['#b9bfae', '#a8b2a0', '#c9c8b8', '#8f9c8c', '#d2d0c2', '#9fa89a'], garden: 0.95 },
    });
    yield;
    const scene = new Scene();
    scene.add(hollow.group);
    const frame = hollow.frame, rig = hollow.rig;
    // on the bark path under the yews; the warden; up through the crowns; down the long ride; onto the still lake
    const path = makePath([
      { t: 0, p: [X0, 1.72, ZW] },
      { t: 4, p: [X0 + 8.0, 1.72, ZW], look: [X0 + 34, 0.4, WZ - 0.3], fov: 46 },
      { t: 9, p: [X0 + 9.3, 1.7, ZW], look: [X0 + 34, 0.5, WZ - 0.3], fov: 44 },
      { t: 14, p: [X0 + 11, 2.6, ZW - 0.3], look: [X0 + 40, 9, ZW - 6], fov: 56 },
      { t: 20, p: [X0 + 24, 14, ZW - 12], look: [X0 + 120, 90, ZM + 40] },
      { t: 27, p: [X0 + 70, 40, ZM + 30], look: [X0 + 330, 820, ZM + 26], fov: 66 },
      { t: 34, p: [X0 + 255, 20, ZM + 4], look: [X0 + 700, 40, ZM], fov: 60 },
      { t: 41, p: [X0 + 430, 10, ZM], look: [X0 + 800, 16, ZM + 4] },
      { t: 48, p: [X0 + 610, 7, ZM + 3], look: [X0 + 900, 9, ZM - 20] },
      { t: 55, p: [X0 + 790, 4, ZM + 8], look: [X0 + 1000, 11, ZM + 14] },
      { t: 61, p: [X0 + 885, 11, ZM + 14] },
    ], { frame, entryRadius: 1.6, exitRadius: 10 });
    const pts = path.points(0.5);
    for (const q of pts) q.r = q.y < 6 ? 85 : q.y < 22 ? 100 : 75;
    yield;

    // ---- the wood
    const box = [X0 - 200, ZM - LRZ - 70, XL + LRX + 70, ZM + 240];
    const wood = yield* plantWood(hollow, plan, pts, box, stands);
    const geos = { yew: yewGeo(), birch: birchGeo() };
    let trees = 0, tq = performance.now();
    const dbg = /debug/.test(location.search), lap = (k) => { if (dbg) console.log(`[sloe] ${k} ${(performance.now() - tq).toFixed(0)} ms`); tq = performance.now(); };
    lap('tree models');
    for (const kind of ['yew', 'birch']) { trees += wood.lists[kind].length; for (const m of instances(geos[kind], hollow.lit, wood.lists[kind], { frame, cell: 300 })) hollow.group.add(m); lap('trees ' + kind); yield; tq = performance.now(); }
    hollow.setTreeNear(100);
    const mm = mirrorMaterial(rig, hollow.tex, frame, 0.9);
    const lakeBall = new Sphere(frame.point(XL, 0, ZL), LRX + 140);
    for (const kind of ['yew', 'birch']) for (const m of instances(geos[kind], mm, wood.mirror[kind], { frame, cell: 2000 })) { m.boundingSphere = lakeBall; m.renderOrder = -4; hollow.group.add(m); }
    lap('mirror');
    yield; tq = performance.now();

    // ---- lift pavilions where the rides cross, and in glades
    const items = pav.map((q) => ({ p: [q[0], 0, q[1]], yaw: (q[0] * 0.37) % 6.28 }));
    for (const m of instances(pavilionGeo(), hollow.lit, items, { frame, cell: 1200 })) hollow.group.add(m);
    lap('pavilions');

    // ---- people: very few, very quiet, each with a slate
    const rng = makeRng('sloe-folk');
    const driftMat = litMaterial(rig, { bend: frame, drift: true });
    const groups = new Map();
    const put = (mat, pose, item) => { const skin = rng.pick(SKIN), k = skin + pose + (mat === driftMat ? 'd' : mat === hollow.walk ? 'w' : 's'); let a = groups.get(k); if (!a) groups.set(k, a = { mat, geo: folkGeo(skin, pose), items: [] }); a.items.push(item); };
    // walkers on the long ride, alone or in twos, going slowly one way or the other
    for (let i = 0; i < 18; i++) {
      const fwd = rng.chance(0.5), v = rng.f(0.6, 0.95), x0 = fwd ? X0 + 260 : X0 + 600, loop = 330 / v, ph = rng();
      const z = ZM + rng.pick([-1.2, 1.2, rng.f(-16, 16)]), two = rng.chance(0.35), color = rng.pick(CLOTHES);
      put(driftMat, 'walk', { p: [x0, 0, z], yaw: fwd ? Math.PI / 2 : -Math.PI / 2, color, drift: [fwd ? v : -v, 0, 0, loop], phase: ph });
      if (two) put(driftMat, 'walk', { p: [x0 + rng.f(-0.4, 0.4), 0, z + 0.9], yaw: fwd ? Math.PI / 2 : -Math.PI / 2, color: rng.pick(CLOTHES), drift: [fwd ? v : -v, 0, 0, loop], phase: ph });
    }
    // on the bark path behind the warden, one far off
    put(driftMat, 'walk', { p: [X0 + 40, 0, ZW], yaw: Math.PI / 2, color: CLOTHES[4], drift: [0.7, 0, 0, 120], phase: 0.2 });
    // the lake shore: residents, sitting and standing, each alone
    for (let i = 0; i < 26; i++) {
      const a = rng.f(0, TAU), e = 1.03 + rng.f(0, 0.05), x = XL + Math.cos(a) * LRX * e, z = ZL + Math.sin(a) * LRZ * e;
      if (wood.at(x, z).water > 0.2) continue;
      const yaw = Math.atan2(XL - x, ZL - z) + rng.f(-0.4, 0.4), sit = rng.chance(0.6);
      if (sit) put(hollow.lit, 'sit', { p: [x, 0, z], yaw, color: rng.pick(CLOTHES) });
      else put(hollow.walk, 'read', { p: [x, 0, z], color: rng.pick(CLOTHES), walk: [rng.f(2, 6), 0.4, rng.f(0, 6.28), 0.04] });
    }
    // in glades near the flight, one person each, reading or walking a slow round
    for (let i = 0; i < 40; i++) {
      const q = pts[Math.floor(rng.f(10, pts.length - 10))], x = q.x + rng.f(-120, 120), z = q.z + rng.f(-120, 120);
      const s = wood.at(x, z); if (s.wood > 0.3 || s.water > 0.1) continue;
      put(hollow.walk, rng.chance(0.5) ? 'read' : 'walk', { p: [x, 0, z], color: rng.pick(CLOTHES), walk: [rng.f(3, 9), rng.f(0.4, 0.8), rng.f(0, 6.28), 0.05] });
    }
    let folk = 0;
    for (const gr of groups.values()) { folk += gr.items.length; for (const m of instances(gr.geo, gr.mat, gr.items, { frame, cell: 400, walk: gr.mat === hollow.walk, drift: gr.mat === driftMat })) hollow.group.add(m); }
    lap('folk');
    yield; tq = performance.now();

    // ---- the woodwarden, who holds up LISTEN, turns, and walks off down the path
    const warden = new Group();
    warden.add(wardenGeo().mesh(hollow.lit, frame));
    const face = slateFace();
    const slateMat = new ShaderMaterial({
      uniforms: { ...rig.uniforms, uClip: G.uClip, uTime: G.uTime, uBend: { value: new Vector3(frame.a0, frame.z0, frame.floorR) }, tMap: { value: face.tex } },
      vertexShader: SLATE_VERT, fragmentShader: slateFrag(rig), side: DoubleSide,
    });
    const slate = new Mesh(face.geo, slateMat); slate.frustumCulled = false;
    warden.add(slate);
    warden.matrixAutoUpdate = false;
    scene.add(warden);
    const P = frame.point(WX, 0, WZ), U = new Vector3(-P.x, -P.y, 0).normalize();
    const mA = new Matrix4(), mR = new Matrix4(), mT = new Matrix4(), mW = new Matrix4(), tv = new Vector3();
    const placeWarden = (t) => {
      // walking spinward along the path is turning about the drum's axis
      const turn = smoothstep(8.6, 10.2, t), w = Math.max(0, t - 9.8), d = (0.72 * w * w) / (w + 1.2), bob = w > 0 ? 0.025 * Math.abs(Math.sin(w * 3.3)) : 0;
      mA.makeTranslation(-P.x, -P.y, -P.z);
      mR.makeRotationAxis(U, Math.PI * turn);
      tv.copy(P).addScaledVector(U, bob);
      mT.makeTranslation(tv.x, tv.y, tv.z);
      mW.makeRotationZ(d / DRUM.RH);
      warden.matrix.copy(mW).multiply(mT).multiply(mR).multiply(mA);
      warden.matrixWorldNeedsUpdate = true;
    };
    placeWarden(0);
    lap('warden');

    // ---- the ring of lashed birch poles, standing in the lake, that the flight leaves through
    const drop = path.exit.flat.y;
    const rg = ringGeo(drop);
    const ring = rg.mesh(litMaterial(rig, { side: 'double' }));
    ring.position.copy(path.exit.pos); ring.quaternion.copy(path.exit.quat);
    scene.add(ring);
    const ringM = new Mesh(ring.geometry, mirrorMaterial(rig, hollow.tex, null, 0.9));
    ringM.position.copy(path.exit.pos); ringM.quaternion.copy(path.exit.quat); ringM.frustumCulled = false; ringM.renderOrder = -4;
    scene.add(ringM);
    lap('ring');
    yield; tq = performance.now();

    if (/debug/.test(location.search)) console.log(`[sloe] trees ${trees}, mirrored ${wood.mirror.yew.length + wood.mirror.birch.length}, folk ${folk}`);
    return {
      scene, path, hollow, near: 0.3, far: 9000,
      look: { exposure: 3.4, bloom: 0.14, threshold: 0.85, saturation: 0.84, contrast: 1.0, vignette: 0.5 },
      portal: { rim: false, mist: '#46524b' },
      update(t) { placeWarden(t); },
    };
  },
};
