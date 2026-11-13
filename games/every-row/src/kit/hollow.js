// The Hollow: the open middle of a nation drum. 3 km across and 3.75 km long, its floor 35 square kilometres of land
// wrapped right round the sky, lit by a sunline along the axis, closed at each end by a wall of thirty terraces.
//
// A world paints a Plan (plan.js) and hands it to buildHollow(), which returns the land, the walls, the sunline and the
// materials and scatterers for standing things on it. Everything is modelled flat (x = arc metres round the floor,
// y = height above it, z = metres from the front wall) and bent onto the drum when drawn.
import {
  BufferGeometry, Float32BufferAttribute, Mesh, ShaderMaterial, Vector2, Vector3, Vector4, Group, DoubleSide, FrontSide, AdditiveBlending, NormalBlending, Sphere,
} from 'three';
import { DRUM, makeFrame } from './drum.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG, NOISE_GLSL, CELL_GLSL, hollowRig, litMaterial, vec3col, glowPoints } from './mats.js';
import { Geo, instances } from './geo.js';
import { C, L } from './plan.js';
import { makeRng } from '../core/rng.js';

export const NT = 30;                                       // tiers on an end wall
export const TIER_H = (DRUM.RH - DRUM.SPINDLE) / NT;        // 47.5 m of rise each
export const WOOD_CELL = 7.5;                               // one tree to a cell of this size in a wood

// ---------------------------------------------------------------- the land
const GROUND_VERT = /* glsl */`
${BEND_PARS}
varying vec3 vW; varying vec3 vF;
void main() {
  vec3 p = position, n = vec3(0.0, 1.0, 0.0);
  vF = p;
  kBend(p, n);
  vW = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;

const groundFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform sampler2D tAlb, tMask, tKind;
uniform vec2 uSize, uRows, uSection;
uniform vec3 uWater, uLampCol, uWallTint, uCanopy, uBlossom, uFruit;
uniform float uLamp, uLampAuto, uTime, uSunRod, uSunWidth, uPeople, uWave, uGrain, uSwell, uTreeNear, uBlossomShare, uFruitShare, uWoodH, uStripes;
uniform vec3 uBend;
varying vec3 vW; varying vec3 vF;
${rig.glsl}
${NOISE_GLSL}
${CELL_GLSL}
// a field of slopes that drifts: ripples at one scale
vec2 kRipple(vec2 p, float t) {
  return vec2(kNoise(p + vec2(t, 0.7 * t)) - kNoise(p + vec2(t + 0.35, 0.7 * t)), kNoise(p.yx * 1.07 + vec2(-0.6 * t, t) + 5.3) - kNoise(p.yx * 1.07 + vec2(-0.6 * t, t + 0.35) + 5.3)) * 2.0;
}
// the nearest tree of a wood to a point: xy = offset from its centre in metres, z = its crown radius, w = a random number for it
vec4 kWoodTree(vec2 m, out float chance) {
  vec2 g = m / ${WOOD_CELL.toFixed(1)}; vec2 gi = floor(g);
  vec4 best = vec4(0.0, 0.0, 1.0, 0.0); float bd = 1e9; chance = 1.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 cell = gi + vec2(float(i), float(j));
    vec4 r = kCell(cell);
    vec2 c = (cell + 0.15 + 0.7 * r.xy) * ${WOOD_CELL.toFixed(1)};
    float rad = ${WOOD_CELL.toFixed(1)} * (0.36 + 0.2 * r.w);
    vec2 d = m - c; float dd = length(d) / rad;
    if (dd < bd) { bd = dd; best = vec4(d, rad, r.w); chance = r.z; }
  }
  return best;
}
void main() {
  ${CLIP_FRAG}
  vec2 m = vF.xz;
  float px = max(length(dFdx(m)), length(dFdy(m)));           // metres of land in this pixel
  vec2 uv = m / uSize;
  float dist = length(vW - cameraPosition);
  vec3 up = vec3(-normalize(vW.xy), 0.0);
  vec3 T = vec3(up.y, -up.x, 0.0);
  vec3 V = (cameraPosition - vW) / dist;
  vec3 vl = vec3(dot(V, T), dot(V, up), V.z);                  // the way to the eye, in the land's own frame
  vec2 par = vl.xz / max(vl.y, 0.2);                           // how far a thing h metres up slides toward the eye, per metre

  float nearK = smoothstep(3.0, 0.5, px);
  vec2 wob = (vec2(kNoise(m * 0.13), kNoise(m * 0.13 + 31.7)) - 0.5) * 3.0 * nearK;
  vec2 uv2 = (m + wob) / uSize;
  vec3 alb = texture2D(tAlb, uv2).rgb;
  vec3 mask = texture2D(tMask, uv2).rgb;
  vec3 kind = texture2D(tKind, uv2).rgb;

  // ---- the grain of the land
  vec3 c = alb * (0.9 + 0.2 * kFbm(m / 85.0));
  float grain = kNoise(m * 0.8) * 0.6 + kNoise(m * 2.9) * 0.4;
  c *= 1.0 + (grain - 0.5) * uGrain * smoothstep(1.2, 0.2, px);
  // mown stripes, turning from plot to plot
  float open = (1.0 - mask.g) * (1.0 - kind.r) * (1.0 - kind.g);
  vec2 plot = floor(m / 240.0);
  float sdir = step(0.5, kHash(plot));
  float stripe = smoothstep(0.42, 0.5, abs(fract(mix(m.x, m.y, sdir) / 7.0) - 0.5));
  c *= 1.0 + (stripe - 0.5) * uStripes * open * smoothstep(4.0, 1.0, px);

  float paved = kind.r;
  if (paved > 0.02) {
    vec2 t = abs(fract(m / 2.4) - 0.5);
    c *= 1.0 - 0.12 * smoothstep(0.46, 0.5, max(t.x, t.y)) * paved * smoothstep(0.7, 0.15, px);
  }

  // ---- trees: a dark floor under them, then their crowns, slid toward the eye so they stand up off the land
  float crownShow = smoothstep(uTreeNear * 0.55, uTreeNear, dist);        // near the eye real trees stand instead
  float wood = mask.g, rows = kind.g;
  float far = smoothstep(1.6, 4.5, px);                                  // crowns too small to draw one by one
  if (wood > 0.02) {
    float ch; vec4 tr = kWoodTree(m, ch);
    float under = (1.0 - smoothstep(0.5, 1.25, length(tr.xy) / tr.z)) * step(ch, wood + 0.02);
    c *= mix(1.0, mix(mix(0.74, 0.42, under), 0.9, far), wood);
  }
  if (rows > 0.02) {
    vec2 f = (fract(m / uRows) - 0.5) * uRows;
    c *= 1.0 - 0.42 * (1.0 - smoothstep(1.4, 3.0, length(f))) * rows * (1.0 - far);
  }
  float life = kind.b * uPeople;
  if (life > 0.01) {                                           // people, one by one and then in picnic groups
    vec2 q = m / 2.2; vec2 qi = floor(q); vec2 h = kHash2(qi);
    float present = step(1.0 - life * 0.5, kHash(qi + 7.7));
    float d = length(fract(q) - 0.25 - h * 0.5) * 2.2;
    vec3 cloth = mix(vec3(0.74), 0.5 + 0.5 * cos(6.2831 * (h.x + vec3(0.0, 0.33, 0.67))), 0.66);
    float fade1 = smoothstep(0.9, 0.22, px) * crownShow;
    c = mix(c, c * 0.6, (1.0 - smoothstep(0.3, 0.7, d)) * present * fade1);
    c = mix(c, cloth, (1.0 - smoothstep(0.2, 0.36, d)) * present * fade1);
    // farther off a crowd is a speckle on the grass
    float sp = kHash(floor(m / 1.6)) * step(1.0 - life * 0.5, kHash(floor(m / 1.6) + 7.7));
    c = mix(c, mix(c, vec3(0.86, 0.8, 0.72), 0.5), sp * (1.0 - fade1) * smoothstep(3.5, 0.9, px) * 0.8);
  }
  float crownLight = 1.0;
  {
    // orchard crowns, three metres up: in blossom, in leaf or in fruit by section, since each section has its own winter
    vec2 mo = m + par * 3.0;
    float rowsO = texture2D(tKind, mo / uSize).g;
    if (rowsO > 0.3) {
      vec2 q = mo / uRows; vec2 f = (fract(q) - 0.5) * uRows;
      float d = length(f) / 2.45;
      vec4 r = kCell(floor(q));
      vec4 sec = kCell(floor(mo / uSection) + 400.0);
      vec3 cc = uCanopy * (0.8 + 0.4 * r.x);
      if (sec.x < uBlossomShare) cc = mix(cc, uBlossom, 0.5 + 0.4 * r.y);
      else if (sec.x < uBlossomShare + uFruitShare) cc = mix(cc, uFruit, step(0.6, kNoise(mo * 1.9)) * 0.55 * smoothstep(1.2, 0.4, px));
      float dome = sqrt(max(1.0 - d * d, 0.0));
      float a = clamp((1.0 - d) * 2.45 / max(px, 0.05), 0.0, 1.0) * crownShow * step(0.5, rowsO);
      vec3 lit1 = cc * (0.66 + 0.5 * dome) * (0.9 + 0.2 * kNoise(mo * 1.3));
      c = mix(c, mix(lit1, mix(c, cc, 0.45), far), a * (1.0 - far) + far * 0.6 * rowsO * crownShow);
    }
    // wood crowns, higher up
    vec2 mw = m + par * uWoodH;
    vec3 mk = texture2D(tMask, mw / uSize).rgb;
    if (mk.g > 0.05) {
      float ch; vec4 tr = kWoodTree(mw, ch);
      float d = length(tr.xy) / tr.z;
      vec3 base = texture2D(tAlb, mw / uSize).rgb;
      vec3 cc = base * (1.02 + 0.5 * tr.w) * mix(vec3(1.08, 1.02, 0.86), vec3(0.9, 1.0, 1.06), fract(tr.w * 7.3));
      float dome = sqrt(max(1.0 - d * d, 0.0));
      float a = clamp((1.0 - d) * tr.z / max(px, 0.05), 0.0, 1.0) * step(ch, mk.g + 0.02) * crownShow;
      vec3 lit1 = cc * (0.6 + 0.58 * dome) * (0.88 + 0.24 * kNoise(mw * 1.1));
      c = mix(c, lit1, a * (1.0 - far));
    }
  }

  // ---- light
  vec3 Lgt = kLight(vW, up, vF, vec3(0.0, 1.0, 0.0));
  float halo = textureLod(tMask, uv, 2.2).b * 0.5 + textureLod(tMask, uv, 3.4).b + textureLod(tMask, uv, 5.0).b * 0.7;
  // lamps may follow the light: out where the line already shines on this side of the drum, lit where it does not yet
  float lampK = uLamp * mix(1.0, 1.0 - smoothstep(0.06, 0.4, dot(kSunColor(vW.xy), vec3(0.3, 0.55, 0.15))), uLampAuto);
  vec3 lit = c * (Lgt + uLampCol * halo * lampK * 9.0);
  lit += uLampCol * mask.b * lampK * 3.0;

  // ---- water: the lake holds the far bank and the sunline upside down
  float wat = mask.r;
  if (wat > 0.3) {
    float t = uTime * 0.45;
    vec2 tl = kRipple(m * 0.55, t * 1.6) * smoothstep(1.4, 0.3, px) * 1.2
            + kRipple(m * 0.12, t) * smoothstep(6.0, 1.5, px) * 0.7
            + kRipple(m * 0.022, t * 0.5) * smoothstep(34.0, 8.0, px) * 0.5;
    // a swell: long slow waves along the axis (half a g makes them tall and unhurried)
    float sw = uSwell * cos(m.y * 0.314 - uTime * 1.23 + kNoise(m * 0.01) * 4.0);
    vec3 Nw = normalize(up + T * tl.x * uWave + vec3(0.0, 0.0, 1.0) * (tl.y * uWave + sw));
    float ndv = max(dot(Nw, V), 0.0);
    float fres = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
    vec3 R = reflect(-V, Nw);
    float rr = max(dot(R.xy, R.xy), 1e-5);
    float tt = -2.0 * dot(vW.xy, R.xy) / rr;
    vec3 H = vW + R * tt;
    vec3 refl;
    if (tt > 0.0 && H.z > 0.0 && H.z < uSize.y) {
      vec2 huv = vec2(fract(atan(H.y, H.x) / 6.2831853 - uBend.x / 6.2831853), H.z / uSize.y);
      vec3 ha = textureLod(tAlb, huv, 3.0).rgb;
      ha = mix(ha, textureLod(tAlb, huv, 9.0).rgb, textureLod(tMask, huv, 3.0).r * 0.85);
      refl = ha * (kSunColor(H.xy) * kSunE(H, vec3(-normalize(H.xy), 0.0)) + uAmb);
    } else refl = uWallTint * (uAmb * 2.2 + kSunColor(vW.xy) * 0.25);
    vec3 Mid = vW + R * (tt * 0.5);
    float dm = length(Mid.xy);
    float inLine = smoothstep(uSunZ.x - 40.0, uSunZ.x + 40.0, Mid.z) * smoothstep(uSunZ.y + 40.0, uSunZ.y - 40.0, Mid.z) * step(0.0, tt);
    float wdt = uSunWidth * (1.0 + px * 0.35);
    float streak = exp(-dm * dm / (wdt * wdt));
    // glitter round the streak: facets of ripple that happen to throw the line at you
    float gl = kNoise(m * 1.9 + vec2(t * 2.3, -t * 1.9)) * kNoise(m * 0.83 - vec2(t * 0.9, t * 1.3) + 3.0);
    streak += smoothstep(0.28, 0.6, gl) * exp(-dm * dm / (wdt * wdt * 40.0)) * 0.8 * smoothstep(6.0, 0.5, px);
    vec3 toLine = normalize(vec3(0.0, 0.0, clamp(Mid.z, uSunZ.x, uSunZ.y)) - vW);
    float miss = acos(clamp(dot(R, toLine), -1.0, 1.0));
    float spark = smoothstep(0.66, 0.84, kNoise(m * 6.3 + vec2(t * 4.1, -t * 3.3)) * 0.55 + kNoise(m * 2.3 - vec2(t * 1.9, t * 2.3) + 3.0) * 0.45) * (0.5 + gl);
    vec3 sunRefl = kSunColor(vW.xy) * uSunRod * (streak * inLine + spark * exp(-miss * miss / 0.09) * 0.16 * smoothstep(3.0, 0.3, px) / max(fres, 0.08));
    vec3 body = alb * uWater * (Lgt * 0.9 + 0.02);
    vec3 wcol = body * (1.0 - fres) + (refl + sunRefl) * fres;
    lit = mix(lit, wcol, smoothstep(0.3, 0.55, wat));
  }
  gl_FragColor = vec4(kAir(lit, vW), 1.0);
}`;

function groundMesh(rig, tex, frame, o) {
  const NX = o.nx || 384, NZ = o.nz || 40;
  const pos = new Float32Array((NX + 1) * (NZ + 1) * 3), idx = [];
  let k = 0;
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { pos[k++] = (i / NX) * C; pos[k++] = 0; pos[k++] = (j / NZ) * L; }
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.boundingSphere = new Sphere(new Vector3(0, 0, L / 2), Math.hypot(DRUM.RH, L / 2) + 10);
  const uniforms = {
    ...rig.uniforms, uClip: G.uClip, uTime: G.uTime,
    uBend: { value: new Vector3(frame.a0, frame.z0, frame.floorR) },
    tAlb: { value: tex.alb }, tMask: { value: tex.mask }, tKind: { value: tex.kind },
    uSize: { value: new Vector2(C, L) }, uRows: { value: new Vector2(o.rows ? o.rows[0] : 7, o.rows ? o.rows[1] : 6) },
    uSection: { value: new Vector2(o.section ? o.section[0] : 392, o.section ? o.section[1] : 347) },
    uWater: { value: vec3col(o.water || '#ffffff') }, uSwell: { value: o.swell || 0 },
    uLampCol: { value: vec3col(o.lampColor || '#ffc27a') }, uLamp: { value: o.lamp || 0 }, uLampAuto: { value: o.lampFollowsSun ? 1 : 0 },
    uWallTint: { value: vec3col(o.wallTint || '#b9b3a6') }, uCanopy: { value: vec3col(o.canopy || '#5c8a40') },
    uBlossom: { value: vec3col(o.blossom || '#f6e3e6') }, uFruit: { value: vec3col(o.fruit || '#c8402c') },
    uBlossomShare: { value: o.blossomShare === undefined ? 0.22 : o.blossomShare }, uFruitShare: { value: o.fruitShare === undefined ? 0.3 : o.fruitShare },
    uSunRod: { value: o.sunRod === undefined ? 60 : o.sunRod }, uSunWidth: { value: o.sunWidth || 22 },
    uPeople: { value: o.people === undefined ? 1 : o.people }, uWave: { value: o.wave === undefined ? 0.014 : o.wave }, uGrain: { value: o.grain === undefined ? 0.2 : o.grain },
    uTreeNear: { value: 0 }, uWoodH: { value: o.woodHeight || 7 }, uStripes: { value: o.stripes === undefined ? 0.04 : o.stripes },
  };
  const m = new ShaderMaterial({ uniforms, vertexShader: GROUND_VERT, fragmentShader: groundFrag(rig), side: DoubleSide });
  const mesh = new Mesh(g, m);
  mesh.renderOrder = -5;
  return mesh;
}

// ---------------------------------------------------------------- the end walls
const WALL_VERT = /* glsl */`
attribute vec3 aTier;     // tier number, part (0 = riser, 1 = terrace, 2 = hub face), and across a terrace 0 (rail) .. 1 (foot of the next riser)
${BEND_PARS}
varying vec3 vW; varying vec3 vF; varying vec3 vN; varying vec3 vTier;
void main() {
  vec3 p = position, n = normal;
  vF = p; vTier = aTier;
  kBend(p, n);
  vW = p; vN = n;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;

const wallFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform vec3 uStone, uStone2, uGlass, uGarden, uPave, uWinA, uWinB, uTrack, uAwning; uniform vec3 uHouse[6]; uniform float uHouseMix; uniform vec3 uChartCol[12]; uniform float uChart;
uniform float uLit, uTime, uTierH, uSide, uLifts, uWinPower;
uniform vec4 uTier[${NT}];       // per tier: crowd 0..1, garden 0..1, extra share of lit windows, depth in metres
varying vec3 vW; varying vec3 vF; varying vec3 vN; varying vec3 vTier;
${rig.glsl}
${NOISE_GLSL}
// lit windows as a scatter of soft points on a lattice q; share = how many are lit
vec3 kStars(vec2 q, float share) {
  vec2 c = floor(q); vec2 h = kHash2(c);
  float on = step(1.0 - share * 0.62, kHash(c + 7.7));
  float d = length(fract(q) - 0.5 - (h - 0.5) * 0.5);
  return mix(uWinA, uWinB, h.x) * on * smoothstep(0.42, 0.08, d) * (0.35 + 1.1 * h.y);
}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN);
  float r = uFloorR - vF.y;
  float arc = vF.x * r / uFloorR;                              // true metres round the wall at this height
  float ti = floor(vTier.x + 0.5);
  vec4 tp = uTier[int(clamp(ti, 0.0, ${NT - 1}.0))];
  vec3 Lgt = kLight(vW, N, vF, N);
  vec3 col; vec3 glow = vec3(0.0);
  // the Spindle lifts: tracks straight up the wall, a cab light climbing each
  float nTr = max(uLifts, 1.0);
  float trackU = vF.x / (${C.toFixed(2)} / nTr);
  float trackD = abs(fract(trackU) - 0.5) * (${C.toFixed(2)} / nTr) * r / uFloorR;
  float trackId = floor(trackU);
  float onTrack = (1.0 - smoothstep(3.2, 4.4, trackD)) * step(0.5, uLifts);
  float cab = fract(uTime * 12.0 / ${(DRUM.RH - DRUM.SPINDLE).toFixed(1)} * (0.8 + 0.4 * kHash(vec2(trackId, uSide))) + kHash(vec2(trackId, 3.0 + uSide))) * ${(DRUM.RH - DRUM.SPINDLE).toFixed(1)};
  float cabGlow = onTrack * (1.0 - smoothstep(2.0, 6.0, abs(vF.y - cab)));
  if (vTier.y < 0.5) {
    // ---- a riser: an arcade at its foot, nine floors of flats with balconies, a garden spilling over its top
    float hy = vF.y - ti * uTierH;
    float arcR = vF.x * (uFloorR - ti * uTierH) / uFloorR;     // metres round the wall at this tier's foot: the same up the whole riser, so columns stand upright
    float px = max(length(dFdx(vec2(arcR, hy))), length(dFdy(vec2(arcR, hy))));
    float flH = uTierH / 11.0;
    float fl = floor(hy / flH), fy = fract(hy / flH);
    float colx = arcR / 4.4; float ci = floor(colx), cx = fract(colx) - 0.5;
    float house = floor(arcR / 26.4);
    float hh = kHash(vec2(house, ti * 7.0 + uSide * 3.0));
    float hk = kHash(vec2(house, ti * 5.0 + 31.0 + uSide * 9.0));
    vec3 stone = mix(uStone, uStone2, hh);
    stone = mix(stone, uHouse[int(hk * 5.999)], step(1.0 - uHouseMix, kHash(vec2(house + 77.0, ti * 3.0 + uSide))));
    if (uChart > 0.0) {
      // a colour chart: the hue goes once round the wall through twelve pigments, each house one swatch of it
      float hue = fract((house + 0.5) * 26.4 / (${C.toFixed(2)} * (uFloorR - ti * uTierH) / uFloorR) + (hk - 0.5) * 0.012) * 12.0;
      int h0 = int(floor(hue)); int h1 = h0 == 11 ? 0 : h0 + 1;
      vec3 sw = mix(uChartCol[h0], uChartCol[h1], smoothstep(0.0, 1.0, fract(hue)));
      float up = ti / ${(NT - 1).toFixed(1)};
      sw = mix(sw * mix(0.5, 1.0, smoothstep(0.0, 0.4, up)), vec3(0.96, 0.94, 0.9), smoothstep(0.45, 1.0, up) * 0.62);    // shades at the foot, tints toward the axis
      stone = mix(stone, sw, uChart);
    }
    stone *= (0.9 + 0.2 * kHash(vec2(house, ti + 11.0))) * (0.97 + 0.06 * kNoise(vec2(arcR, hy) * 0.7));
    float party = smoothstep(0.47, 0.5, abs(fract(arcR / 26.4) - 0.5));               // the line between two houses
    vec2 wid = vec2(ci, fl + ti * 13.0 + uSide * 50.0);
    float wh = kHash(wid), wh2 = kHash(wid + 5.5);
    vec3 day = stone;
    float lit01 = 0.0; vec3 winCol = mix(uWinA, uWinB, wh2) * (0.55 + 0.9 * kHash(wid + 4.7));
    float on = step(1.0 - clamp(uLit + tp.z, 0.0, 1.0), wh);
    if (fl < 0.5) {
      // the arcade: arches with shops and doors behind
      float ax = abs(cx) / 0.38;
      float arch = step(ax, 1.0) * step(fy, 0.5 + 0.34 * sqrt(max(1.0 - ax * ax, 0.0)));
      day = mix(stone * 0.9, uGlass * 0.4 + vec3(0.07, 0.05, 0.03), arch);
      lit01 = arch * (0.5 + 0.5 * on);
      winCol = mix(uWinA, uWinB, 0.3) * 0.9;
    } else if (fl < 9.5) {
      float win = step(abs(cx), 0.3) * step(0.24, fy) * step(fy, 0.82);
      float slab = step(fy, 0.07);                                                   // balcony slab
      float rail = step(0.07, fy) * step(fy, 0.24) * step(abs(cx), 0.42) * step(0.35, wh2);
      float plant = step(0.03, fy) * step(fy, 0.3) * step(abs(cx), 0.46) * step(0.42, kHash(wid + 3.3)) * step(kNoise(vec2(arcR * 1.7, hy * 1.5)), 0.6);
      float awn = step(abs(cx), 0.36) * step(0.82, fy) * step(fy, 0.93) * step(0.8, wh2);
      day = mix(day, uGlass, win);
      day = mix(day, stone * 1.12, slab);
      day = mix(day, stone * 0.8, rail * 0.6);
      day = mix(day, uGarden * (0.8 + 0.5 * wh), plant);
      day = mix(day, uAwning * (0.7 + 0.6 * hh), awn);
      lit01 = win * on;
    } else {
      // cornice, and the garden above hanging over it
      day = stone * (fy > 0.45 ? 1.1 : 0.94);
    }
    day = mix(day, stone * 0.72, party * 0.5);
    float hn = kNoise(vec2(arcR / 9.0, ti * 7.0)) * 0.65 + kNoise(vec2(arcR / 2.3, ti * 3.0 + 9.0)) * 0.35;
    float hang = smoothstep(0.0, 1.2, hy - (uTierH - (2.0 + 15.0 * hn * tp.y)));
    vec3 green = uGarden * (0.7 + 0.55 * kNoise(vec2(arcR * 0.5, hy * 0.5))) * mix(vec3(1.0), vec3(1.25, 1.1, 0.7), step(0.8, kNoise(vec2(arcR * 0.7, hy * 0.7) + 20.0)) * 0.5);
    float fade = smoothstep(2.4, 0.6, px);
    // from far off: bands of floors, the arcade's shadow, a scatter of planted balconies
    vec3 avg = mix(stone, uGlass, 0.15) * (0.93 + 0.1 * step(0.5, fract(hy / flH * 0.5)));
    avg = mix(avg, uGarden * 0.9, 0.2 * step(0.5, fl) * step(fl, 9.5));
    avg *= fl < 0.5 ? 0.72 : 1.0;
    col = mix(avg, day, fade);
    col = mix(col, green, hang * step(0.05, tp.y));
    col *= Lgt;
    // far off, single windows run together: each floor of each house is lit or dark as one
    // far off, single windows run together into a scatter of lights whose grain follows the distance, so it never shimmers
    float share = clamp(uLit + tp.z, 0.0, 1.0);
    float lv = log2(max(px * 1.7, 4.4) / 4.4), l0 = floor(lv);
    vec2 sq = vec2(arcR, hy + ti * 211.0 + uSide * 977.0) / (4.4 * exp2(l0));
    vec3 farGlow = mix(kStars(sq, share), kStars(sq * 0.5 + 31.0, share), lv - l0) * step(0.5, fl) * step(fl, 9.5);
    glow = uWinPower * mix(farGlow, winCol * lit01, fade) * (1.0 - hang);
    col = mix(col, uTrack * Lgt, onTrack * 0.85);
    glow = mix(glow, vec3(0.0), onTrack) + vec3(1.0, 0.82, 0.55) * 7.0 * cabGlow;
  } else if (vTier.y < 1.5) {
    // ---- a terrace: a rail, a walk along it, then beds and small trees back to the houses
    float de = vTier.z * tp.w;                                   // metres in from the rail
    vec2 gq = vec2(arc, de);
    float px = max(length(dFdx(gq)), length(dFdy(gq)));
    float bed = kFbm(gq / 7.0 + ti * 3.1);
    vec3 garden = uGarden * (0.7 + 0.6 * bed);
    garden = mix(garden, uGarden * vec3(1.5, 1.25, 0.6), step(0.74, kNoise(gq / 2.2 + 5.0)) * 0.5);       // flowers
    vec2 tq = gq / 5.2; vec2 tc = fract(tq) - 0.5 - (kHash2(floor(tq) + ti) - 0.5) * 0.5;
    float tree = (1.0 - smoothstep(0.22, 0.34, length(tc))) * step(0.45, kHash(floor(tq) + ti * 3.0)) * step(4.0, de);
    garden = mix(garden, uGarden * 0.62, tree * smoothstep(1.6, 0.5, px));
    float walkW = min(3.4, tp.w * 0.34);
    float isWalk = step(de, walkW) + step(tp.w - 1.6, de);
    float beds = smoothstep(0.3, 0.6, kFbm(gq / 13.0 + 40.0 + ti)) * tp.y;
    vec3 ground = mix(uPave * (0.94 + 0.1 * kNoise(gq * 0.9)), garden, clamp(beds * 1.5, 0.0, 1.0) * (1.0 - clamp(isWalk, 0.0, 1.0)));
    ground = mix(ground, uStone * 1.1, step(de, 0.55));                              // the rail
    // people along the walk and among the beds
    vec2 q = gq / 1.7; vec2 qi = floor(q); vec2 h = kHash2(qi + ti);
    float present = step(1.0 - tp.x * (0.35 + 0.65 * clamp(isWalk, 0.0, 1.0)), kHash(qi + 7.7 + ti));
    vec3 cloth = mix(vec3(0.72), 0.5 + 0.5 * cos(6.2831 * (h.x + vec3(0.0, 0.33, 0.67))), 0.62);
    float fadeP = smoothstep(1.2, 0.3, px);
    ground = mix(ground, cloth, (1.0 - smoothstep(0.2, 0.36, length(fract(q) - 0.25 - h * 0.5) * 1.7)) * present * fadeP * step(0.6, de));
    ground = mix(ground, mix(ground, vec3(0.6, 0.57, 0.55), 0.55), tp.x * 0.6 * (1.0 - fadeP));       // a crowd far off is a grey shimmer
    col = ground * Lgt;
    col = mix(col, uTrack * Lgt, onTrack * 0.85);
    glow = vec3(1.0, 0.8, 0.5) * uLit * 0.9 * step(0.975, kHash(floor(gq / 3.0) + ti)) * (1.0 - onTrack) + vec3(1.0, 0.82, 0.55) * 7.0 * cabGlow;
  } else {
    // ---- the hub face behind the flying hall
    col = uStone * 0.4 * Lgt;
    float ring = smoothstep(2.0, 0.0, abs(r - 62.0)) + smoothstep(1.5, 0.0, abs(r - 31.0));
    glow = vec3(1.0, 0.86, 0.6) * ring * (1.5 + 3.0 * uLit);
  }
  gl_FragColor = vec4(kAir(col, vW) + glow, 1.0);
}`;

/** The depth of each tier's terrace, metres, lowest first. The named tiers are wider. */
export function tierDepths(opts = {}) {
  const d = [];
  for (let i = 0; i < NT; i++) d.push(opts.depth || 11);
  const wide = opts.wide || { 9: 30, 14: 24, 24: 18, 27: 16 };      // the Third, the Quarter, the Tenth, the Twentieth
  for (const k in wide) d[k] = wide[k];
  return d;
}
/** Where a tier's terrace is: y = height of its floor, zRail and zFoot = metres out from the wall of its rail and of the riser behind it. */
export function tierPlace(depths, tier) {
  let z1 = 0; for (let i = NT - 1; i > tier; i--) z1 += depths[i];
  return { y: (tier + 1) * TIER_H, zFoot: z1, zRail: z1 + depths[tier], r: DRUM.RH - (tier + 1) * TIER_H, depth: depths[tier] };
}
/** The tiers the docs name, by weight: a third of a g, a quarter, a tenth, a twentieth. */
export const TIERS = { third: 9, quarter: 14, tenth: 24, twentieth: 27 };

function wallMesh(rig, frame, side, o) {
  // side 0 = front wall (z from 0 up), 1 = back wall (z from L down)
  const NX = o.nx || 384, depths = o.depths || tierDepths();
  const pos = [], nrm = [], tier = [], idx = [];
  const zAt = (d) => (side === 0 ? d : L - d), nz = side === 0 ? 1 : -1;
  let total = 0; for (const d of depths) total += d;
  let z = total, base = 0;
  const strip = (y0, z0, y1, z1, n, t, part, e0, e1) => {
    const s = pos.length / 3;
    for (let i = 0; i <= NX; i++) {
      const x = (i / NX) * C;
      pos.push(x, y0, zAt(z0), x, y1, zAt(z1)); nrm.push(n[0], n[1], n[2] * nz, n[0], n[1], n[2] * nz); tier.push(t, part, e0, t, part, e1);
    }
    for (let i = 0; i < NX; i++) { const a = s + i * 2, b = a + 1, c = a + 2, d = a + 3; if (side === 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c); }
  };
  for (let t = 0; t < NT; t++) {
    strip(base, z, base + TIER_H, z, [0, 0, 1], t, 0, 0, 0);                              // riser
    strip(base + TIER_H, z, base + TIER_H, z - depths[t], [0, 1, 0], t, 1, 0, 1);         // terrace, rail to foot
    base += TIER_H; z -= depths[t];
  }
  strip(base, 0, DRUM.RH - 0.5, 0, [0, 0, 1], NT - 1, 2, 0, 0);                            // the hub face, in to the axis
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nrm, 3));
  g.setAttribute('aTier', new Float32BufferAttribute(tier, 3));
  g.setIndex(idx);
  g.boundingSphere = new Sphere(new Vector3(0, 0, side === 0 ? total / 2 : L - total / 2), DRUM.RH + total);
  const tiers = [];
  for (let i = 0; i < NT; i++) { const t = (o.tiers && o.tiers[i]) || {}; tiers.push(new Vector4(t.crowd === undefined ? (o.crowd === undefined ? 0.25 : o.crowd) : t.crowd, t.garden === undefined ? (o.garden === undefined ? 0.8 : o.garden) : t.garden, t.lit || 0, depths[i])); }
  const uniforms = {
    ...rig.uniforms, uClip: G.uClip, uTime: G.uTime,
    uBend: { value: new Vector3(frame.a0, frame.z0, frame.floorR) },
    uStone: { value: vec3col(o.stone || '#efe4cf') }, uStone2: { value: vec3col(o.stone2 || '#e3c9a6') }, uGlass: { value: vec3col(o.glass || '#4e6470') }, uGarden: { value: vec3col(o.gardenColor || '#77a352') },
    uPave: { value: vec3col(o.pave || '#d2c8b2') }, uWinA: { value: vec3col(o.winA || '#ffc070') }, uWinB: { value: vec3col(o.winB || '#ffe6bc') }, uTrack: { value: vec3col(o.track || '#f1ece0') },
    uAwning: { value: vec3col(o.awning || '#c9603c') },
    uHouse: { value: (o.houses || ['#e8c39a', '#d9a58c', '#c9d2c0', '#e9d9a8', '#b9c8d2', '#e3b9a0']).map((h) => vec3col(h)) }, uHouseMix: { value: o.houseMix === undefined ? 0.45 : o.houseMix },
    uChart: { value: o.chart || 0 },
    uChartCol: { value: (o.chartColors || ['#c9952c', '#b5722a', '#9a4a2a', '#c8442c', '#a82a3a', '#7a4670', '#3a4a9a', '#3f7fb5', '#3f9a98', '#3a7a5c', '#6f8a4a', '#c4b04a']).map((h) => vec3col(h)) },
    uLit: { value: o.lit || 0 }, uTierH: { value: TIER_H }, uSide: { value: side }, uLifts: { value: o.lifts === undefined ? 8 : o.lifts }, uWinPower: { value: o.winPower === undefined ? 1.3 : o.winPower },
    uTier: { value: tiers },
  };
  const m = new ShaderMaterial({ uniforms, vertexShader: WALL_VERT, fragmentShader: wallFrag(rig), side: FrontSide });
  const mesh = new Mesh(g, m);
  mesh.userData.depths = depths; mesh.userData.total = total;
  return mesh;
}

// ---------------------------------------------------------------- the sunline
const ROD_VERT = /* glsl */`
uniform float uRadius;
varying vec3 vW; varying float vSide;
void main() {
  // position: x = side (-1, 1), z = distance along the axis. The strip turns to face the camera about the axis.
  vec3 axisP = vec3(0.0, 0.0, position.z);
  vec3 toCam = cameraPosition - axisP;
  vec3 side = normalize(cross(vec3(0.0, 0.0, 1.0), toCam) + vec3(1e-5, 0.0, 0.0));
  vec3 p = axisP + side * position.x * uRadius;
  vW = p; vSide = position.x;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const rodFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform float uPower, uCore, uEnds; uniform vec2 uZ;
varying vec3 vW; varying float vSide;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  float a = abs(vSide);
  float prof = uCore > 0.5 ? step(a, 1.0) : (1.0 / (1.0 + 60.0 * a * a) - 1.0 / 61.0);
  float ends = smoothstep(uZ.x, uZ.x + uEnds, vW.z) * smoothstep(uZ.y, uZ.y - uEnds, vW.z);
  gl_FragColor = vec4(kSunColor(cameraPosition.xy) * uPower * prof * ends, 1.0);
}`;

function rodStrip(rig, z1, z2, radius, power, core) {
  const n = 64, pos = [], idx = [];
  for (let i = 0; i <= n; i++) { const z = z1 + (z2 - z1) * (i / n); pos.push(-1, 0, z, 1, 0, z); }
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.boundingSphere = new Sphere(new Vector3(0, 0, (z1 + z2) / 2), (z2 - z1) / 2 + radius);
  const m = new ShaderMaterial({
    uniforms: { ...rig.uniforms, uClip: G.uClip, uRadius: { value: radius }, uPower: { value: power }, uCore: { value: core ? 1 : 0 }, uEnds: { value: core ? 1 : 90 }, uZ: { value: new Vector2(z1, z2) } },
    vertexShader: ROD_VERT, fragmentShader: rodFrag(rig), side: DoubleSide, transparent: !core, depthWrite: !!core, blending: core ? NormalBlending : AdditiveBlending,
  });
  const mesh = new Mesh(g, m);
  mesh.renderOrder = core ? 0 : 8;
  return mesh;
}

// ---------------------------------------------------------------- the whole Hollow
/**
 * Build a Hollow. A generator: use `const hollow = yield* buildHollow(ctx, spec)`.
 * spec:
 *   plan       a painted Plan (required)
 *   light      options for hollowRig: sun, sunPower, sunFar, sunFarPower, sunAngle, sunSharp, amb, ambPower, bounce, ground, groundPower, air, airDensity
 *   sunline    { power: brightness of the rod itself (0 = a dark cable), halo: width in metres of its glow, haloPower }
 *   ground     { canopy, blossom, fruit, blossomShare, fruitShare, rows:[sx, sz], section:[sx, sz], lamp (0..1 night lamps), lampColor,
 *                lampFollowsSun (lamps go out wherever the line already shines: for a painted dawn that lights one bank first),
 *                people, wave, swell, grain, stripes, sunRod, sunWidth, woodHeight }
 *   front, back   end walls: { depths, lit (share of windows lit), crowd, garden, stone, stone2, houses: [six colours], houseMix (share of
 *                houses painted one of them), glass, gardenColor, awning, lifts,
 *                tiers: { 9: { crowd, garden, lit } } }
 *   pavilions  false to leave out the lift pavilions (default: one every 170 m, clear of water)
 * returns the Hollow: { group, rig, frame, plan, lit, litDouble, walk, plain, at(x, z), glow(points), add(mesh), wallDepths, ... }
 */
export function* buildHollow(ctx, spec) {
  const frame = makeFrame(0, 0, DRUM.RH);
  const rig = hollowRig(spec.light || {});
  const group = new Group();
  const plan = spec.plan;
  const go = spec.ground || {};
  const sun = spec.sunline || {};

  // lift pavilions come up through the floor all over: paint them before the textures are made
  const pav = [];
  const sum = (w) => (w && w.depths ? w.depths : tierDepths()).reduce((a, b) => a + b, 0);
  const frontD = sum(spec.front), backD = sum(spec.back);
  // the plan is read back once (a layer a step): the reading places the pavilions here and answers hollow.at() ever after
  const sampler = yield* plan.reader();
  if (spec.pavilions !== false) {
    const rng = makeRng((spec.seed || 'hollow') + 'pav');
    for (let z = frontD + 60; z < L - backD - 40; z += 170) for (let x = 0; x < C - 80; x += C / Math.round(C / 170)) {
      const px = x + rng.f(-28, 28), pz = z + rng.f(-28, 28), s = sampler(px, pz);
      if (s.water > 0.2) continue;
      pav.push([px, pz]);
    }
    // (a hundred at a time: one path of a thousand circles is a long step for the canvas)
    for (let i = 0; i < pav.length; i += 100) {
      const part = pav.slice(i, i + 100);
      plan.dots(part, 9, { color: '#b9b29c', alpha: 0.8, paved: 1, clear: ['wood', 'rows'] });
      plan.dots(part, 2.0, { lamp: 0.9 });
    }
    for (const q of pav) plan.features.push({ type: 'pavilion', x: q[0], z: q[1] });
    // the pavilions are painted after the reading: mark their paving in it by hand (no trees or rows where one stands)
    const d = sampler.data, sx = C / d.w, sz = L / d.h;
    for (const q of pav) {
      const cx = Math.floor(q[0] / sx), cz = Math.floor(q[1] / sz);
      for (let iz = cz - 2; iz <= cz + 2; iz++) for (let ix = cx - 1; ix <= cx + 1; ix++) {
        if (iz < 0 || iz >= d.h) continue;
        const ddx = (ix + 0.5) * sx - q[0], ddz = (iz + 0.5) * sz - q[1];
        if ((ix !== cx || iz !== cz) && ddx * ddx + ddz * ddz > 81) continue;
        const i = (iz * d.w + ((ix % d.w) + d.w) % d.w) * 4;
        d.M[i + 1] = 0; d.K[i] = 255; d.K[i + 1] = 0;
      }
    }
  }
  yield* plan.settle();
  yield 'hollow: pavilions';
  const tex = plan.textures(ctx.renderer);
  // send the three big pictures to the graphics card one at a time, a frame apart
  if (ctx.renderer && ctx.renderer.initTexture) for (const k of ['alb', 'mask', 'kind']) { yield 'hollow: plan painted'; ctx.renderer.initTexture(tex[k]); }
  yield 'hollow: plan painted 2';
  const ground = groundMesh(rig, tex, frame, { ...go, wallTint: (spec.front && spec.front.stone) || '#cfc6b4' });
  group.add(ground);
  yield 'hollow: texture';
  const wf = wallMesh(rig, frame, 0, spec.front || {}), wb = wallMesh(rig, frame, 1, spec.back || {});
  group.add(wf, wb);
  yield 'hollow: textures';

  // the spar from axle to axle, the lit line on it, and its glow
  const lit = litMaterial(rig, { bend: frame });
  const litDouble = litMaterial(rig, { bend: frame, side: 'double' });
  const plain = litMaterial(rig, {});
  const spar = new Geo();
  spar.rot('x', Math.PI / 2).cyl(0, 0, 0, 1.4, 1.4, L, 8, '#2a2c30', { cap: false }).pop();
  group.add(spar.mesh(plain));
  const rodPower = sun.power === undefined ? 60 : sun.power;
  const haloK = sun.haloPower === undefined ? 0.03 : sun.haloPower;
  let rod = null, halo = null;
  if (rodPower > 0 || sun.keep) {
    rod = rodStrip(rig, DRUM.SUN0, L - DRUM.SUN0, sun.radius || 3.2, rodPower, true);
    halo = rodStrip(rig, DRUM.SUN0 - 60, L - DRUM.SUN0 + 60, sun.halo || 260, rodPower * haloK, false);
    group.add(rod, halo);
  }
  // hubs: the housings where the spar meets each wall
  const hub = new Geo();
  for (const s of [0, 1]) {
    hub.push().rot('x', (s === 0 ? 1 : -1) * Math.PI / 2);
    const y0 = s === 0 ? 0 : -L;
    hub.lathe(0, y0, 0, [[46, 0], [40, 26], [22, 60], [9, 120], [4, 150]], 24, (k) => ['#8d8c88', '#77767a', '#5c5d63', '#44464c'][k]);
    hub.pop().pop();
  }
  group.add(hub.mesh(plain));
  yield 'hollow: ground';

  if (pav.length) {
    const pg = pavilionGeo(), items = [];
    for (const q of pav) items.push({ p: [q[0], 0, q[1]], yaw: (q[0] * 0.37) % 6.28 });
    for (const m of instances(pg, lit, items, { frame, cell: 1200 })) group.add(m);
  }
  yield 'hollow: walls';

  const H = {
    group, rig, frame, plan, tex, ground, walls: [wf, wb], lit, litDouble, plain, pavilions: pav, rod, halo,
    walk: litMaterial(rig, { bend: frame, walk: true }),
    wallDepths: [wf.userData.depths, wb.userData.depths], wallTotal: [wf.userData.total, wb.userData.total],
    /** read the plan at (x, z): { water, wood, lamp, paved, rows, life, r, g, b } */
    at(x, z) { return sampler(x, z); },
    /** flat (x, y, z) -> a point on the drum */
    point(x, y, z, out) { return frame.point(x, y, z, out); },
    /** night lamp strength and the share of windows lit: for worlds that change light as they go */
    setNight(lamp, lit01) { ground.material.uniforms.uLamp.value = lamp; wf.material.uniforms.uLit.value = lit01; wb.material.uniforms.uLit.value = lit01; },
    /** the share of windows lit on one tier of one wall (side 0 front, 1 back), on top of setNight's share for the whole wall */
    setWindows(side, tier, share) { (side === 0 ? wf : wb).material.uniforms.uTier.value[tier].z = share; },
    /** shorten or move the lit part of the sunline: the light on the land, the rod and its glow all follow */
    setLine(z1, z2) {
      rig.uniforms.uSunZ.value.set(z1, z2);
      if (rod) { rod.material.uniforms.uZ.value.set(z1, z2); halo.material.uniforms.uZ.value.set(z1 - 60, z2 + 60); }
    },
    /** brightness of the rod itself and of its reflection in water */
    setRod(p) { if (rod) { rod.material.uniforms.uPower.value = p; halo.material.uniforms.uPower.value = p * haloK; } ground.material.uniforms.uSunRod.value = p; },
    /** the ground stops drawing crowns nearer the eye than this, because real trees stand there (scatterTrees sets it) */
    setTreeNear(d) { ground.material.uniforms.uTreeNear.value = d; },
    add(obj) { if (Array.isArray(obj)) for (const o of obj) group.add(o); else group.add(obj); return obj; },
    /**
     * A terrace of an end wall as a place to build on. side: 0 front wall, 1 back wall; tier: 0 (lowest) .. 29, see TIERS;
     * deg: the angle round the wall that the terrace's own x = 0 sits at.
     * Returns { frame, rig, lit, litDouble, walk, glow(points), setGlow(color, power), y, depth, floorR, g, toWall }.
     * The wall's own terrace floor is drawn in 384 flat pieces and stands up to 3.4 cm proud of the true curve: set things
     * that lie on the floor (rugs, paving, shadows) 5 cm up or they flicker.
     * In its frame x runs round the terrace in true metres, y is height above the terrace floor, and z = 0 is the rail:
     * the houses behind are at z = toWall * depth (toWall is -1 on the front wall, +1 on the back), the Hollow at the other side.
     */
    terrace(side, tier, deg = 0) {
      const tp = tierPlace(side === 0 ? wf.userData.depths : wb.userData.depths, tier);
      const floorR = DRUM.RH - tp.y, fr = makeFrame((deg * Math.PI) / 180, side === 0 ? tp.zRail : L - tp.zRail, floorR);
      // the Hollow's light, but with the warm glow of lamps sitting at this terrace's floor (rig.uniforms.uGroundGlow is its own here)
      const trig = { glsl: rig.glsl, kind: rig.kind, uniforms: { ...rig.uniforms, uFloorR: { value: floorR }, uGroundGlow: { value: rig.uniforms.uGroundGlow.value.clone() } } };
      return {
        frame: fr, side, tier, y: tp.y, depth: tp.depth, floorR, g: floorR / DRUM.R, toWall: side === 0 ? -1 : 1, rig: trig,
        /** warm light near the terrace floor, from its own lamps: colour and strength */
        setGlow(color, power) { trig.uniforms.uGroundGlow.value.copy(vec3col(color, power)); },
        lit: litMaterial(trig, { bend: fr }), litDouble: litMaterial(trig, { bend: fr, side: 'double' }), walk: litMaterial(trig, { bend: fr, walk: true }),
        glow(points, opts = {}) { const m = glowPoints(points, { ...opts, bend: fr }); group.add(m); return m; },
        add(obj) { if (Array.isArray(obj)) for (const o of obj) group.add(o); else group.add(obj); return obj; },
      };
    },
    /**
     * Stand lamp posts where the plan has lamps (plan.lamps) within `radius` of the flight. power > 0 lights them.
     * opts: near (flat flight points), radius (default 160), power (default 0), color, height (default 4.5)
     */
    lampPosts(opts = {}) {
      const near = opts.near || [], R = opts.radius || 160, h = opts.height || 4.5, items = [], glows = [];
      for (const f of plan.features) {
        if (f.type !== 'lamp') continue;
        let best = 1e9; for (let i = 0; i < near.length; i += 2) { let dx = near[i].x - f.x; dx = ((dx % C) + C * 1.5) % C - C / 2; const dz = near[i].z - f.z, d = dx * dx + dz * dz; if (d < best) best = d; }
        if (best > R * R) continue;
        items.push({ p: [f.x, 0, f.z] });
        if (opts.power) glows.push({ p: [f.x, h, f.z], color: opts.color || f.color || '#ffc27a', power: opts.power, size: 0.9 });
      }
      if (!items.length) return [];
      const g = new Geo(); g.cyl(0, 0, 0, 0.09, 0.06, h - 0.3, 5, '#4a4b50'); g.cyl(0, h - 0.3, 0, 0.26, 0.2, 0.5, 6, '#fff0c8', { emit: opts.power ? 3 : 0.15 });
      const out = instances(g.build(), lit, items, { frame, cell: 500 });
      for (const m of out) group.add(m);
      if (glows.length) out.push(H.glow(glows, { maxPx: 60 }));
      return out;
    },
    /** small lights standing in the Hollow (flat coordinates) */
    glow(points, opts = {}) { const m = glowPoints(points, { ...opts, bend: frame }); group.add(m); return m; },
    dispose() { tex.alb.dispose(); tex.mask.dispose(); tex.kind.dispose(); },
  };
  return H;
}

// A lift pavilion: an eight-sided kiosk with a pale shallow roof, where cabs come up through the ground.
export function pavilionGeo() {
  const g = new Geo();
  g.cyl(0, 0, 0, 7.2, 7.2, 0.35, 8, '#cfc8b8', { smooth: false });
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; g.cyl(Math.cos(a) * 5.6, 0.35, Math.sin(a) * 5.6, 0.28, 0.24, 3.6, 5, '#e9e3d5'); }
  g.cyl(0, 0.35, 0, 2.4, 2.4, 3.2, 8, '#8e9aa0', { smooth: false });
  g.cyl(0, 0.9, 0, 2.45, 2.45, 2.0, 8, '#ffe2ae', { smooth: false, cap: false, emit: 1.4 });
  g.cyl(0, 3.95, 0, 7.6, 6.4, 0.5, 8, '#f1ece0', { smooth: false });
  g.cyl(0, 4.45, 0, 6.4, 1.2, 1.3, 8, '#e3dccb', { smooth: false });
  return g.build();
}
