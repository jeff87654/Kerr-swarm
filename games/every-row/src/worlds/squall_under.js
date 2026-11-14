// Squall, Weather Row: Swell Street, under the lake. Squall keeps a swell on its Hollow lake for three hours a day
// (wander-year.md, Day 103, and Method: Half-g waves; 15-canon.js, Squall: Swell Street, Paddleside and Breakwater, the
// Sea-glass palette, "Stand up slowly", the broth with sea lettuce). This street runs round the drum from Paddleside,
// under the paddle works, and out under the water, and there its ceiling is glass. It is the one street in this piece
// with daylight in it: the sunline's light comes down through the swell and slides along the paving.
//
// The flight starts under a plain lamp-lit ceiling, under the paddle works; comes out under the glass; goes along at
// eye height past the racks and the board shapers while a crest overtakes it, with riders on it overhead; follows the
// children who set off under that crest (and lose); looks straight up at someone who has fallen off and is treading
// water beside a board; and leaves by the Wet Stair, up a glass tube through the water and out by a round door at the
// surface, into swell hour.
//
// y = 0 is the street's paving, 1,505.5 m from the axis: a metre and a half below deck 375's own floor. The lake is
// 2.5 m deep over the glass and its surface stands level with the Hollow's floor (deck 376, 1,500 m), so its bed is at
// 1,502.5 m, and a street with 3 m of headroom under it has to be let down that far (by steps, behind where the
// flight begins and not drawn).
//
// What is worked out, and drawn as worked out:
// - The water's numbers are squall_swell.js's: crests 20 m apart, 5.1 s apart, travelling spinward at 3.95 m/s (the
//   deep-water speed of a 20 m wave at half a g), 1.6 m from trough to crest, in sets of eight that travel at half
//   that. The flight goes at about the speed of the set, so every crest that passes it is near its biggest.
// - The sunline is a line, not a point, and it lies along the axis: across this street. From the paving it is under a
//   degree wide round the drum and over eighty degrees long (half its light comes from within 33 degrees of overhead,
//   which is 3 m either way by the time it lands). So ripples can focus its light only one way. The net of light a
//   point sun throws on the floor of a pool is smeared six metres along the axis here and averages away; what is left
//   is bars of light lying across the street, parallel to the sunline, which waver and fork because no ripple keeps
//   step with itself right across. The paddles are a line along the axis too, and make just the long-crested waves
//   that throw such bars. On a shop front the bars stand upright; a face that looks round the drum gets none.
// - Light that meets a slope s of the surface is bent 0.25 s in the water and 0.33 s again in the air under the glass,
//   and lands 1.6 s metres from where it would have. A ripple a metre long and a centimetre and a half high focuses at
//   about that distance: the bars are sharp on the paving, and soft at the top of a wall, nearer the water.
// - Short waves riding a long one are squeezed together on its crest and pulled apart in its trough (by a quarter each
//   way here), and are steeper there by the same share again: under a crest the bars crowd and harden, under a trough
//   they go slack. The crest of a steep wave is also half again as sharp as a sine's, a weak lens with its focus 34 m
//   down: 28 parts in a hundred more light under it, 7 fewer elsewhere. Foam spilling down the front of a big crest
//   throws a dull stripe a metre wide just ahead of that. So each crest takes a band of harder, brighter light with a
//   dark edge up the street at 3.95 m/s. Two and a half metres of water takes out more than half the red: the light is
//   the colour of sea-glass, and greener under a crest.
// - The glazing bars across the street throw sharp shadows and the ones along it none (the line again), and each
//   shadow sways a hand's width as the swell bends the light.
// - You are in air under a flat pane, not in the water, so there is no round window overhead with mirror all round
//   it: a ray from the eye is bent toward the upright as it enters the water (never more than 48.75 degrees from it),
//   and the surface can send it back down only where a wave's face tips it past that. Overhead the whole ceiling is
//   window: the far bank three kilometres up, the lake itself climbing the sky spinward, and the sunline a bright
//   line across, never still. Far along the street, where the eye's rays are nearly at that angle already, the nearer
//   face of every wave is mirror and holds the street's own paving, bars of light and all, upside down. The pane
//   itself holds a little of the street too, more as the angle grows.
//   Inside the tube of the Wet Stair the eye looks out through glass at the water's side, and from there the surface
//   is what a swimmer sees: window overhead, mirror beyond it, green with distance.
// - The children run spinward with the crest, so at a little over three metres a second they weigh about a
//   thirteenth more (2u/V, with V = 86 m/s here). It does not help. The crest does their thirty metres in 7.6 s.
//
// Not canon (the docs give Squall its swell, its paddles, swell hour open to all, and the name Swell Street):
// - all of the street: that it runs under the paddle works and the lake, its glass ceiling and how long it is, the
//   steps down to it, the glazing bars, the mains under the works
// - the Wet Stair, its tube, the round door at the waterline, the jetty it is said to lead to
// - the fronts (racks to leave a board in, board shapers, a mender of boards, robes and towels for hire, a broth
//   counter, and the trades the kit fills in), what they charge, the long benches down the middle and the people
//   lying on them, the race, its lines on the paving and its tally
// - the wording of the slates and notices (the motto, the broth and what Gloaming says of Squall are the docs')
// - the depth of the lake here (Sorrel's is 2 m), that swell hour is noon to three, and how the far bank is laid
//   out as it shows through the water (blocks of wood, lawn and allotment: squall_swell.js paints the real plan)
import {
  Scene, Mesh, ShaderMaterial, DataTexture, RedFormat, UnsignedByteType, RepeatWrapping, LinearMipmapLinearFilter, LinearFilter,
  InstancedMesh, DynamicDrawUsage, BufferGeometry, Float32BufferAttribute, BufferAttribute, Vector2, Vector3, Vector4, Matrix4, Quaternion, Euler, Color,
  DoubleSide, FrontSide, Sphere,
} from 'three';
import { makePath } from '../core/path.js';
import { DRUM, makeFrame, deckRadius } from '../kit/drum.js';
import { makeDeck, finish, street, frontage, Run, PALETTES } from '../kit/deck.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG, vec3col } from '../kit/mats.js';
import { Geo, shade } from '../kit/geo.js';
import { figureGeo, SKIN } from '../kit/folk.js';
import { makeRng, hash2, smoothstep } from '../core/rng.js';

// ---------------------------------------------------------------- the place, in the street's own metres
const SUNK = 1.5;                    // the paving is this far below deck 375's floor
const H = 3;                         // paving to glass
const W = 8;                         // wall to wall
const GX0 = 0, GX1 = 118;            // the glass: from the edge of the paddle works to the wall at the street's end
const XS = 94;                       // the foot of the Wet Stair
const SA = 20 * Math.PI / 180, TS = Math.tan(SA), CS = Math.cos(SA), SS = Math.sin(SA);   // an easy stair: this is where the old live
const RT = 1.75, TC = 1.25;          // the stair's tube: its radius, and its centre above the line of the treads
const EYE = 1.6;
// where the tube comes through the glass: an ellipse in the ceiling
const EX = XS + (H - TC / CS) / TS, EA = RT / SS, EB = RT;

// ---------------------------------------------------------------- the swell overhead (squall_swell.js's numbers)
const LAM = 20, HW = 1.6, SETA = 0.42;
const KW = (2 * Math.PI) / LAM;
const GH = DRUM.OMEGA * DRUM.OMEGA * DRUM.RH;        // the lake's surface is at the Hollow's floor: half a g
const OM = Math.sqrt(GH * KW);                       // deep water: 5.06 s between crests
const CW = OM / KW;                                  // 3.95 m/s
const KG = KW / 8, CG = CW / 2;                      // sets of eight, at the group speed
const D0 = 1.9;                                      // water over the glass in a trough (2.5 m on the average)
// Crest number n is at XC0 + CW w + 20 n at flight time w. Crest 0 comes up behind the flight at 18 s and reaches the
// children's line at 19.6; the crest behind it lifts the swimmer the flight looks up at, at 30 s; and crest -4 is
// climbing the Wet Stair's glass as the flight leaves by it. The set's highest point starts at XE0 and keeps pace.
const XC0 = -46.5, XE0 = -9.7;
const envW = (x, w) => 1 - SETA + SETA * Math.cos(KG * (x - XE0 - CG * w));
const thW = (x, w) => KW * (x - XC0) - OM * w;
/** water over the glass at x along the street at time w, metres */
function surfH(x, w) { const s = 0.5 + 0.5 * Math.cos(thW(x, w)); return D0 + HW * envW(x, w) * s * Math.sqrt(s); }
/** its slope along the street */
function surfDX(x, w) { const th = thW(x, w), s = 0.5 + 0.5 * Math.cos(th); return HW * envW(x, w) * 1.5 * Math.sqrt(s) * (-0.5 * Math.sin(th)) * KW; }
const crestX = (n, w) => XC0 + CW * w + LAM * n;
const f4 = (v) => v.toFixed(5);

// The same in every shader here. uSwW is the wave's clock.
const SWELL_GLSL = /* glsl */`
uniform float uSwW;
const float SW_KW = ${f4(KW)}, SW_OM = ${f4(OM)}, SW_KG = ${f4(KG)}, SW_CG = ${f4(CG)}, SW_HW = ${f4(HW)}, SW_SETA = ${f4(SETA)};
const float SW_XC0 = ${f4(XC0)}, SW_XE0 = ${f4(XE0)}, SW_D0 = ${f4(D0)}, SW_H = ${f4(H)};
const float SW_GX0 = ${f4(GX0)}, SW_GX1 = ${f4(GX1)}, SW_HALF = ${f4(W / 2)};
const float SW_EX = ${f4(EX)}, SW_EA = ${f4(EA)}, SW_EB = ${f4(EB)}, SW_XS = ${f4(XS)}, SW_TS = ${f4(TS)}, SW_RT = ${f4(RT)};
float swEnv(float x) { return 1.0 - SW_SETA + SW_SETA * cos(SW_KG * (x - SW_XE0 - SW_CG * uSwW)); }
float swTh(float x) { return SW_KW * (x - SW_XC0) - SW_OM * uSwW; }
// water over the glass, and its slope along the street
vec2 swH(float x) {
  float th = swTh(x), s = 0.5 + 0.5 * cos(th), e = swEnv(x), q = sqrt(s);
  return vec2(SW_D0 + SW_HW * e * s * q, SW_HW * e * 1.5 * q * (-0.5 * sin(th)) * SW_KW);
}
// small waves on the swell: their slopes along and across the street. Long-crested, as the paddles make them
vec2 swRip(vec2 m, float k) {
  float t = uSwW;
  vec2 r = vec2(0.0);
  r.x += 0.055 * sin(3.27 * m.x - 4.00 * t + 0.12 * m.y) + 0.045 * sin(5.9 * m.x - 5.38 * t - 0.21 * m.y + 1.7);
  r.x += 0.04 * sin(4.6 * m.x + 4.75 * t + 0.3 * m.y + 4.1) + 0.03 * k * sin(10.5 * m.x - 7.17 * t + 0.5 * m.y + 2.3);
  r.x += 0.025 * k * sin(15.7 * m.x - 8.77 * t - 0.8 * m.y + 0.6) + 0.028 * k * sin(21.0 * m.x - 3.3 * m.y - 10.1 * t) + 0.024 * k * sin(17.0 * m.x + 5.1 * m.y + 9.1 * t + 1.9);
  r.y += 0.03 * sin(1.9 * m.y + 0.7 * m.x - 1.6 * t) + 0.022 * k * sin(4.3 * m.y - 1.1 * m.x + 2.4 * t + 1.0) + 0.015 * k * sin(8.1 * m.y + 2.3 * m.x - 3.6 * t);
  return r;
}
// the Hollow as the lake sees it, for a ray going up (flat: x spinward, y up, z along the axis). Spinward the lake
// itself climbs the sky, to 56 degrees, with its crests as rungs; everywhere else there is land, three kilometres off
// overhead; and the sunline is a line through the zenith along the axis. blur widens the line (ripples too small to draw)
vec3 swSky(vec3 d, float blur) {
  float el = clamp(d.y, 0.0, 1.0);
  float far = 3000.0 * el;                                    // how far round the floor the ray comes down
  float lake = smoothstep(-0.1, 0.2, d.x) * smoothstep(0.84, 0.74, el) * smoothstep(1.7, 0.6, abs(d.z) * far / (275.0 * max(d.x, 0.05)));
  // the far bank: blocks a couple of hundred metres across (woods, lawns, allotments), thin pale walks between them
  vec2 q = d.xz / max(el, 0.12) * vec2(14.0, 8.6), fq = fract(q), id = floor(q);
  float hsh = fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453), h2 = fract(hsh * 57.31);
  float walk = smoothstep(0.0, 0.035, min(min(fq.x, 1.0 - fq.x), min(fq.y, 1.0 - fq.y)));
  vec3 use = hsh < 0.3 ? vec3(0.13, 0.24, 0.17) : hsh < 0.62 ? vec3(0.31, 0.42, 0.29) : hsh < 0.82 ? vec3(0.36, 0.38, 0.27) : vec3(0.25, 0.36, 0.26);
  use *= 0.9 + 0.2 * step(0.5, fract(fq.y * (2.0 + floor(h2 * 4.0)))) * step(0.62, hsh);          // beds in rows
  use = mix(use, vec3(0.12, 0.22, 0.16), step(hsh, 0.62) * step(0.3, hsh) * smoothstep(0.3, 0.2, length(fq - vec2(0.3 + 0.4 * h2, 0.5))));   // a clump of trees on a lawn
  float plain = clamp(smoothstep(0.5, 0.2, el) + blur * 12.0, 0.0, 1.0);
  vec3 land = mix(mix(vec3(0.37, 0.40, 0.33), mix(vec3(0.26, 0.35, 0.27), use, 0.62), 0.45 + 0.55 * walk), vec3(0.26, 0.35, 0.27), plain);
  float rung = smoothstep(0.55, 1.0, cos(SW_KW * far - SW_OM * uSwW)) * smoothstep(900.0, 60.0, far);
  vec3 water = vec3(0.10, 0.215, 0.235) + vec3(0.13, 0.18, 0.18) * rung;
  vec3 c = mix(land, water, lake);
  float ph = d.x / max(d.y, 0.04), wd = 0.02 + blur;
  float lit = smoothstep(1.1, 0.8, abs(d.z) / max(d.y, 0.04));
  c += vec3(1.0, 0.97, 0.88) * lit * (4.0 * exp(-ph * ph / (wd * wd)) * 0.02 / wd + 0.3 * exp(-ph * ph / (wd * wd * 8.0 + 0.0008)) + 0.05 * exp(-ph * ph / 0.02));
  return c;
}
// what water takes out of light over a path, metres: most of the red
vec3 swAbs(float len) { return exp(-vec3(0.30, 0.050, 0.035) * len); }
`;

// ---------------------------------------------------------------- the bars of light
// One picture of them, made once: along it, 9.6 m of street; up it, 8 s of time. For each instant a row of rays is sent
// straight down through a surface of long-crested ripples (whole waves in 9.6 m, turning whole times in 8 s, as near
// the deep-water speed at half a g as that allows), each is moved 1.61 m for every unit of slope it met, and they are
// counted where they land. 1 is the light there would be with no ripples.
const CPX = 9.6, CTL = 8, CNX = 512, CNT = 256, LEVER = 1.61;
function* barsTexture() {
  const comps = [];
  for (const [m, amp] of [[5, 1], [7, 1], [9, 1], [12, 1], [16, 0.9], [21, 0.8], [27, 0.6], [-6, 0.8], [-10, 0.7], [-14, 0.6], [-19, 0.45]]) {
    const k = (2 * Math.PI * m) / CPX, turns = Math.round((Math.sqrt(GH * Math.abs(k)) * CTL) / (2 * Math.PI));
    comps.push({ k, om: (turns * 2 * Math.PI) / CTL, ak: (0.55 * amp) / k, ph: hash2(m, 7, 3) * 6.283 });      // a k2 = 0.55: on its own it would focus 1.1 m down
  }
  const NR = CNX * 3, nc = comps.length, data = new Uint8Array(CNX * CNT), acc = new Float32Array(CNX);
  const sn = comps.map((c) => { const a = new Float32Array(NR); for (let i = 0; i < NR; i++) a[i] = Math.sin(c.k * (i / NR) * CPX); return a; });
  const cs = comps.map((c) => { const a = new Float32Array(NR); for (let i = 0; i < NR; i++) a[i] = Math.cos(c.k * (i / NR) * CPX); return a; });
  yield 'swell: ripples';
  const A = new Float32Array(nc), B = new Float32Array(nc);
  let t0 = performance.now();
  for (let j = 0; j < CNT; j++) {
    const tau = (j / CNT) * CTL;
    // the slope of a cos(k X - om t + ph) is -a k sin(k X + p), p = ph - om t
    for (let c = 0; c < nc; c++) { const p = comps[c].ph - comps[c].om * tau; A[c] = -comps[c].ak * Math.cos(p); B[c] = -comps[c].ak * Math.sin(p); }
    acc.fill(0);
    for (let i = 0; i < NR; i++) {
      let s = 0;
      for (let c = 0; c < nc; c++) s += A[c] * sn[c][i] + B[c] * cs[c][i];
      let x = (i / NR + (LEVER * s) / CPX) * CNX;
      x -= Math.floor(x / CNX) * CNX;
      const i0 = Math.floor(x), f = x - i0;
      acc[i0 % CNX] += 1 - f; acc[(i0 + 1) % CNX] += f;
    }
    // three rays were aimed at each place; a little blur for the sunline's own width (about 3 cm down here)
    for (let i = 0; i < CNX; i++) { const v = (acc[(i + CNX - 1) % CNX] + 2 * acc[i] + acc[(i + 1) % CNX]) / 12; data[j * CNX + i] = Math.min(255, Math.round(v * 42.5)); }
    if (performance.now() - t0 > 4) { yield 'swell: bars'; t0 = performance.now(); }
  }
  const tex = new DataTexture(data, CNX, CNT, RedFormat, UnsignedByteType);
  tex.wrapS = tex.wrapT = RepeatWrapping; tex.minFilter = LinearMipmapLinearFilter; tex.magFilter = LinearFilter; tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

// The light the lake lets down, added to the deck kit's own lamps: every surface under the glass takes it (paving,
// fronts, benches, people), through the kit's materials. F is a place in the street (x along it, y up, z across).
const LIGHT_GLSL = /* glsl */`
${SWELL_GLSL}
uniform sampler2D tSwBars; uniform vec4 uSwSun;
vec3 kSwell(vec3 F, vec3 FN, vec2 fp) {
  float inStreet = smoothstep(SW_GX0 - 0.2, SW_GX0 + 0.3, F.x) * smoothstep(SW_GX1 + 0.3, SW_GX1 - 0.3, F.x) * smoothstep(SW_HALF + 0.34, SW_HALF + 0.02, abs(F.z)) * step(F.y, SW_H + 0.03);
  float inTube = step(SW_H, F.y) * smoothstep(SW_RT + 0.12, SW_RT - 0.1, abs(F.z)) * step(SW_XS, F.x) * step(F.x, SW_XS + 24.0);
  float m = max(inStreet, inTube) * uSwSun.a;
  // the sunline is overhead and lies along z: level faces take all of it, faces that look along the axis the half
  // of it they can see, faces that look round the drum none of it
  float facing = max(FN.y, 0.0) + 0.42 * abs(FN.z) * smoothstep(-0.5, 0.2, FN.y) * (1.0 - 0.6 * max(FN.y, 0.0));
  if (m * facing < 0.002) return vec3(0.0);
  float y = clamp(F.y, 0.0, 9.0);
  float th = swTh(F.x), e = swEnv(F.x), a = 0.5 * SW_HW * e;
  // the small waves ride the swell: on a crest they are carried forward and squeezed together, in a trough pulled apart
  float X = F.x + a * sin(th);
  X = F.x + a * sin(swTh(X));
  float thx = swTh(X), J = 1.0 / (1.0 - a * SW_KW * cos(thx));
  // sharp on the paving, where the ripples focus; soft higher up, nearer the water, and under a trough, where the
  // ripples are pulled out flat
  float s = 0.5 + 0.5 * cos(thx), steep = 1.0 + a * SW_KW * cos(thx);
  float soft = 4.2 * y / SW_H + 0.7 * (1.0 - s);
  float lod = max(0.0, log2(max(fp.x * ${f4(CNX / CPX)} * J, fp.y * 1.5) + 1e-4));
  // no two ripples are in step right across the street: along a bar the picture is read a little early or late
  float lag = 0.045 * F.z + 0.5 * sin(0.8 * F.z + 0.31 * X + 1.3 * sin(0.37 * F.z + 0.07 * X)) + 0.25 * sin(1.7 * F.z - 0.45 * X) + 0.12 * y;
  vec2 uv = vec2(X / ${f4(CPX)}, (uSwW + lag) / ${f4(CTL)});
  float I = 6.0 * textureLod(tSwBars, uv, lod + soft).r;
  I = mix(I, 6.0 * textureLod(tSwBars, vec2(X / ${f4(CPX * 0.61)} + 0.37, uv.y * 1.3 + 0.21 - 0.004 * F.z), lod + soft + 0.7).r, 0.3);
  // squeezed ripples are steeper too (by the same share again), and steeper ripples throw harder bars. The swell
  // itself is a weak lens (a steep wave's crest is half again as sharp as a sine's: its focus is 34 m down, and the
  // light has gone 1.86 m for a unit of slope by the time it lands): 28 parts in a hundred more light under a crest,
  // 7 fewer everywhere else
  I = max(1.0 + (I - 1.0) * mix(1.0, steep * steep, 0.75), 0.0);
  float band = 1.0 / (1.0 - 0.147 * e * (cos(thx) + 0.5 * cos(2.0 * thx)));
  // foam spilling down the front of a big crest: a dull stripe a metre wide, just ahead of the middle of its bright band
  float ph = mod(th + 3.14159265, 6.2831853) - 3.14159265;
  band *= 1.0 - 0.4 * smoothstep(0.62, 0.95, e) * smoothstep(-0.1, 0.0, ph) * smoothstep(0.4, 0.2, ph);
  // the glazing bars across the street, every three metres: sharp shadows, swaying as the swell bends the light
  float lever = (SW_H - y) * 0.33;
  float bx = F.x - lever * (swH(F.x).y + 0.6 * swRip(F.xz, 1.0).x);
  float d = abs(fract(bx / 3.0 + 0.5) - 0.5) * 3.0;
  float bar = mix(1.0, smoothstep(0.03, 0.075 + 0.035 * lever + fp.x, d), inStreet * step(y, SW_H - 0.25));
  // deeper water under a crest takes a little more of the red
  vec3 tint = mix(vec3(1.0), vec3(0.78, 1.0, 1.02), e * s * s);
  return uSwSun.rgb * tint * (m * facing * band * bar * I);
}
vec3 kLight(vec3 P, vec3 N, vec3 F, vec3 FN) {
  vec2 fp = vec2(max(abs(dFdx(F.x)), abs(dFdy(F.x))), max(abs(dFdx(F.z)), abs(dFdy(F.z))));
  return kLightDeck(P, N, F, FN) + kSwell(F, FN, fp);
}
`;
const DECK_HEAD = 'vec3 kLight(vec3 P, vec3 N, vec3 F, vec3 FN) {';
/** give every material of the deck the lake's light as well as its lamps' */
function addSwellLight(deck, uniforms) {
  const rig = deck.rig, old = rig.glsl;
  if (!old.includes(DECK_HEAD)) { console.warn('[squall-under] the deck kit lights differently now: no bars of light'); return false; }
  const glsl = old.replace(DECK_HEAD, () => 'vec3 kLightDeck(vec3 P, vec3 N, vec3 F, vec3 FN) {') + LIGHT_GLSL;
  for (const k of ['lit', 'litDouble', 'prop', 'walk', 'drift', 'driftProp', 'ride', 'pace', 'glassMat', 'floorMat', 'signMat']) {
    const m = deck[k];
    if (!m || !m.fragmentShader || !m.fragmentShader.includes(old)) continue;
    m.fragmentShader = m.fragmentShader.replace(old, () => glsl);
    Object.assign(m.uniforms, uniforms);
    m.needsUpdate = true;
  }
  rig.glsl = glsl;
  return true;
}

// ---------------------------------------------------------------- the ceiling: the lake seen from under its glass
// Drawn on the pane itself. For every point of it the eye's ray is bent into the water, followed up to the swell,
// and there either let out into the Hollow or sent back down, as the header says. Boards on the surface, people
// astride them, people treading water and people swimming across are worked out on the same ray: a board is a shape on
// the surface, a limb a rounded stick in the water.
const NB = 10, NS = 6;
const WET_VERT = /* glsl */`
${BEND_PARS}
varying vec3 vW; varying vec3 vF;
void main() {
  vec3 p = position, n = vec3(0.0, 1.0, 0.0);
  vF = p;
  kBend(p, n);
  vW = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const STICK_GLSL = /* glsl */`
// how much of this pixel a rounded stick from pa to pb covers: radius r, w half a pixel's width out there, far the end of the ray
float swStick(vec3 ro, vec3 rd, vec3 pa, vec3 pb, float r, float w, float far) {
  vec3 ba = pb - pa, oa = ro - pa;
  float bb = dot(ba, ba), bd = dot(ba, rd), bo = dot(ba, oa), od = dot(oa, rd);
  float s = clamp((bo - bd * od) / max(bb - bd * bd, 1e-5), 0.0, 1.0);
  float t = bd * s - od;
  vec3 q = oa + rd * t - ba * s;
  return (1.0 - smoothstep(r - w, r + w, length(q))) * step(0.0, t) * step(t, far);
}
// someone in the water at c (the surface over their middle), heading f: treading water (kind 1) or swimming along
// (kind 2). x: how much of the pixel their vest covers; y: their suit; z: bare feet and hands
vec3 swBody(vec3 ro, vec3 rd, vec3 c, vec2 f, float kind, float ph, float w, float far) {
  vec3 fw = vec3(f.x, 0.0, f.y), sd = vec3(-f.y, 0.0, f.x), up = vec3(0.0, 1.0, 0.0);
  float vest = 0.0, suit = 0.0, skin = 0.0;
  if (kind < 1.5) {
    // upright: shoulders, chest, hips; knees out, the lower legs going round like an egg whisk; hands sculling
    vec3 sh = c - up * 0.2, hip = c - up * 0.72;
    vest = max(swStick(ro, rd, sh + sd * 0.15, sh - sd * 0.15, 0.115, w, far), swStick(ro, rd, sh - up * 0.08, hip + up * 0.1, 0.16, w, far));
    for (float k = -1.0; k < 1.5; k += 2.0) {
      float a = ph + (k > 0.0 ? 0.0 : 3.14159);
      vec3 hp = hip + sd * (0.1 * k);
      vec3 knee = hp + sd * (0.2 * k) + fw * (0.26 + 0.08 * sin(a)) - up * 0.22;
      vec3 foot = knee + sd * (0.2 * k * cos(a)) + fw * (0.14 * sin(a) - 0.1) - up * 0.42;
      suit = max(suit, max(swStick(ro, rd, hp, knee, 0.085, w, far), swStick(ro, rd, knee, foot, 0.065, w, far)));
      skin = max(skin, swStick(ro, rd, foot, foot + fw * 0.17 - up * 0.04, 0.045, w, far));
      vec3 hand = sh + sd * (0.56 * k) + fw * (0.22 * cos(a + 0.5)) - up * 0.08;
      vest = max(vest, swStick(ro, rd, sh + sd * (0.2 * k), hand, 0.05, w, far));
    }
  } else {
    // level, just under the surface: legs kicking, one arm reaching as the other pulls
    vec3 m = c - up * 0.2, sh = m + fw * 0.5;
    vest = swStick(ro, rd, m - fw * 0.1, sh, 0.16, w, far);
    for (float k = -1.0; k < 1.5; k += 2.0) {
      float a = ph + (k > 0.0 ? 0.0 : 3.14159);
      vec3 hp = m - fw * 0.15 + sd * (0.09 * k), foot = m - fw * 0.98 + sd * (0.1 * k) + up * (0.17 * sin(a));
      suit = max(suit, swStick(ro, rd, hp, foot, 0.07, w, far));
      skin = max(skin, swStick(ro, rd, foot, foot - fw * 0.17, 0.04, w, far));
      vec3 hand = sh + sd * (0.22 * k) + fw * (0.55 * cos(a)) - up * (0.3 + 0.3 * sin(a));
      vest = max(vest, swStick(ro, rd, sh + sd * (0.19 * k), hand, 0.05, w, far));
    }
  }
  return vec3(vest, suit, skin);
}`;
const PANE_FRAG = /* glsl */`
${CLIP_PARS}
uniform vec3 uBend, uSwGlow, uSwPave; uniform float uPx;
uniform vec4 uBoard[${NB}];    // x along the street, z across it; cos and sin of its heading
uniform float uBoardY[${NB}];  // the water's height there, over the pane
uniform vec4 uBoardK[${NB}];   // 0 none, 1 someone standing on it, 2 someone astride it, 3 nobody; the colour
uniform vec4 uSwim[${NS}];     // x, z; cos and sin of their heading
uniform vec2 uSwimP[${NS}];    // the water's height there; where the legs are in their stroke
uniform vec4 uSwimK[${NS}];    // 0 none, 1 treading water, 2 swimming along; the colour
uniform vec4 uLeashA; uniform vec3 uLeashB;      // the cord from a board's tail (w: there is one) to its rider's ankle
uniform sampler2D tSwBars;
varying vec3 vW; varying vec3 vF;
${SWELL_GLSL}
${STICK_GLSL}
const vec3 SUIT = vec3(0.016, 0.026, 0.034);
// the paving's light at x along the street, as the bars leave it (blur: metres)
float swPaving(float x, float blur) {
  float e = swEnv(x), a = 0.5 * SW_HW * e, X = x + a * sin(swTh(x));
  X = x + a * sin(swTh(X));
  float I = 6.0 * textureLod(tSwBars, vec2(X / ${f4(CPX)}, uSwW / ${f4(CTL)}), max(0.0, log2(blur * ${f4(CNX / CPX)} + 1e-3))).r;
  float st = 1.0 + a * SW_KW * cos(swTh(X));
  return 0.3 + 0.7 * max(1.0 + (I - 1.0) * st * st, 0.0);
}
void main() {
  ${CLIP_FRAG}
  // the Wet Stair's tube comes up through here
  vec2 qe = vec2((vF.x - SW_EX) / SW_EA, vF.z / SW_EB);
  if (dot(qe, qe) < 1.0) discard;
  vec3 Vw = normalize(vW - cameraPosition);
  float an = uBend.x + vF.x / uBend.z, ca = cos(an), sa = sin(an);
  vec3 V = vec3(-sa * Vw.x + ca * Vw.y, -ca * Vw.x - sa * Vw.y, Vw.z);
  V.y = max(V.y, 0.015); V = normalize(V);
  // into the water: never more than 48.75 degrees from the upright
  vec3 T = refract(V, vec3(0.0, -1.0, 0.0), 0.7519);
  vec2 g0 = vF.xz;
  float hh = swH(g0.x).x;
  vec2 ps = g0 + T.xz * (hh / T.y);
  hh = swH(ps.x).x; ps = g0 + T.xz * (hh / T.y);
  vec2 hs = swH(ps.x); hh = hs.x; ps = g0 + T.xz * (hh / T.y);
  float len = hh / T.y, eyeD = length(vW - cameraPosition);
  float px = (eyeD + len) / uPx / max(V.y, 0.08);          // metres of surface under one pixel
  float keep = smoothstep(0.45, 0.05, px);
  vec2 rp = swRip(ps, keep) * mix(0.35, 1.0, keep);
  vec3 Nd = normalize(vec3(hs.y + rp.x, -1.0, rp.y));      // the surface's own normal, looking down into the water
  vec3 Ta = refract(T, Nd, 1.33);                          // out into the air, or nothing
  float through = step(0.5, dot(Ta, Ta));
  float fr = mix(1.0, 0.02 + 0.98 * pow(1.0 - clamp(dot(Ta, -Nd), 0.0, 1.0), 5.0), through);
  vec3 sky = swSky(normalize(Ta + vec3(0.0, 1e-3, 0.0)), 0.05 * (1.0 - keep) + px * 0.12);
  // sent back down, it finds the bed of the lake: over the street that is this glass, with the street's light coming up
  vec3 Rd = reflect(T, Nd);
  float back = hh / max(-Rd.y, 0.08);
  vec2 qb = ps + Rd.xz * back;
  float over = smoothstep(SW_HALF + 0.4, SW_HALF - 0.4, abs(qb.y)) * step(SW_GX0, qb.x) * step(qb.x, SW_GX1);
  vec3 bed = mix(vec3(0.012, 0.045, 0.055), uSwGlow * swPaving(qb.x, px * 2.0 + 0.04), over) * swAbs(back);
  vec3 c = mix(sky, bed, fr);
  // foam on the lip of a big crest, from under: milky, and it hides what is over it
  float th = swTh(ps.x), e = swEnv(ps.x);
  float ph = mod(th + 3.14159265, 6.2831853) - 3.14159265;
  float lip = smoothstep(0.62, 0.95, e) * smoothstep(-0.1, 0.0, ph) * smoothstep(0.42, 0.18, ph) * (0.55 + 0.45 * sin(ps.y * 2.3 + 2.0 * sin(ps.y * 0.7 + ps.x * 1.9)));
  c = mix(c, vec3(0.50, 0.66, 0.66), clamp(lip, 0.0, 1.0) * 0.7);
  // boards, and who is on them. Only the board nearest to where this ray meets the surface can show here
  vec3 ro = vec3(g0.x, 0.0, g0.y), sp = vec3(ps.x, hh, ps.y);
  float w = (eyeD + len) / uPx * 0.9;
  vec4 b = vec4(0.0), k = vec4(0.0);
  float hb = 0.0, best = 12.0;
  for (int i = 0; i < ${NB}; i++) {
    vec2 d = ps - uBoard[i].xy;
    float d2 = dot(d, d) + (uBoardK[i].x < 0.5 ? 1e3 : 0.0);
    if (d2 < best) { best = d2; b = uBoard[i]; k = uBoardK[i]; hb = uBoardY[i]; }
  }
  if (k.x > 0.5) {
    vec2 d = ps - b.xy, l = vec2(d.x * b.z + d.y * b.w, -d.x * b.w + d.y * b.z);
    float f = pow(abs(l.x) / 1.33, 2.4) + pow(abs(l.y) / 0.29, 2.0);
    float aa = clamp(px * 5.0, 0.02, 0.6);
    float on = 1.0 - smoothstep(1.0 - aa, 1.0 + aa, f);
    vec3 fw = vec3(b.z, 0.0, b.w), sd = vec3(-b.w, 0.0, b.z), seat = vec3(b.x, hb - 0.04, b.y);
    // someone standing on it, seen through the water round the board: a figure that will not keep still
    float fig = swStick(sp, Ta, seat + vec3(0.0, 0.14, 0.0), seat + fw * 0.12 + vec3(0.0, 1.5, 0.0), 0.2, w * 2.0 + 0.03, 1.7) * through * step(k.x, 1.5);
    c = mix(c, SUIT * 2.0 + k.yzw * 0.06, fig * 0.6);
    // or sitting astride it, legs in the water
    float sw = 0.12 * sin(uSwW * 1.3 + b.x), sit = step(1.5, k.x) * step(k.x, 2.5);
    float lg = max(swStick(ro, T, seat + sd * 0.26, seat + sd * 0.33 + fw * (0.2 + sw) - vec3(0.0, 0.66, 0.0), 0.075, w, len + 0.2),
                   swStick(ro, T, seat - sd * 0.26, seat - sd * 0.33 + fw * (0.2 - sw) - vec3(0.0, 0.66, 0.0), 0.075, w, len + 0.2));
    c = mix(c, SUIT + vec3(0.01, 0.03, 0.03), lg * sit);
    // its fin, and the underside of the board itself: dark against the light, a stripe down its middle
    vec3 tail = seat - fw * 0.98;
    c = mix(c, SUIT, swStick(ro, T, tail, tail - fw * 0.14 - vec3(0.0, 0.2, 0.0), 0.035, w, len + 0.3));
    vec3 bc = k.yzw * (0.16 - 0.07 * smoothstep(0.03, 0.02, abs(l.y))) * (0.6 + 0.4 * uSwGlow);
    c = mix(c, bc * swAbs(len * 0.5), on);
  }
  // people in the water: the one nearest this ray
  vec4 s = vec4(0.0), ks = vec4(0.0);
  vec2 sy = vec2(0.0);
  best = 1.9;
  for (int i = 0; i < ${NS}; i++) {
    vec3 oc = vec3(uSwim[i].x, uSwimP[i].x - 0.6, uSwim[i].y) - ro;
    vec3 dd = oc - T * dot(oc, T);
    float d2 = dot(dd, dd) + (uSwimK[i].x < 0.5 ? 1e3 : 0.0);
    if (d2 < best) { best = d2; s = uSwim[i]; ks = uSwimK[i]; sy = uSwimP[i]; }
  }
  if (ks.x > 0.5) {
    vec3 ctr = vec3(s.x, sy.x, s.y);
    vec3 bd = swBody(ro, T, ctr, s.zw, ks.x, sy.y, w, len + 0.25);
    // their head is out in the air: seen through the surface, never still
    float head = swStick(sp, Ta, ctr + vec3(0.0, 0.14, 0.0), ctr + vec3(0.0, 0.16, 0.0), 0.12, w * 2.0 + 0.02, 0.9) * through * step(ks.x, 1.5);
    c = mix(c, vec3(0.10, 0.08, 0.06), head * 0.6);
    c = mix(c, (ks.yzw * 0.4 + 0.01) * (0.7 + 0.3 * uSwGlow), bd.x);
    c = mix(c, SUIT + vec3(0.008, 0.024, 0.024), bd.y);
    c = mix(c, vec3(0.16, 0.12, 0.09), bd.z);
  }
  c = mix(c, SUIT * 2.0, swStick(ro, T, uLeashA.xyz, uLeashB, 0.014, w, len + 0.2) * uLeashA.w);
  // what the water took on the way down, and a little of its own glow
  c = c * mix(vec3(1.0), swAbs(len), 0.85) * vec3(0.93, 0.98, 0.97) + vec3(0.01, 0.035, 0.035) * len;
  // weed along the pane's edges, where nobody can reach to wipe
  c *= mix(vec3(1.0), vec3(0.62, 0.8, 0.66), smoothstep(SW_HALF - 0.75, SW_HALF - 0.05, abs(vF.z)) * (0.55 + 0.45 * sin(vF.x * 1.7 + sin(vF.x * 0.37) * 3.0)));
  // and what the pane itself holds of the street under it: the paving in the middle, the lit fronts down its edges
  float fpn = 0.045 + 0.955 * pow(1.0 - V.y, 5.0);
  float tw = (SW_HALF - sign(V.z) * vF.z) / max(abs(V.z), 1e-3), tf = SW_H / V.y;
  float yw = SW_H - V.y * tw;
  vec3 wall = mix(vec3(0.30, 0.38, 0.38), vec3(0.50, 0.46, 0.37), smoothstep(0.4, 0.9, yw) * smoothstep(2.4, 1.9, yw));
  vec3 refl = mix(uSwPave * swPaving(vF.x + V.x * tf, eyeD / uPx / V.y * 2.0 + 0.03), wall, smoothstep(-0.5, 0.5, tf - tw));
  c = mix(c, refl, fpn);
  gl_FragColor = vec4(c, 1.0);
}`;

// ---------------------------------------------------------------- who is on the water over the street
const BOARDS = ['#f3fdff', '#e8b44a', '#d9643f', '#9fd0d6', '#c94f5a', '#f0e2c0', '#5fa8b0', '#e9d36a', '#3a6ea5', '#2d5f70'];
const VESTS = ['#d9643f', '#e8b44a', '#c94f5a', '#f3fdff', '#5fa8b0', '#4f9a6a', '#3a6ea5', '#a34b86', '#e07a5f', '#e7e1d3'];
// riders: which crest, where across the street, how far down its face
const RIDERS = [[0, -1.5, 2.5], [0, 2.7, 3.1], [-1, -1.6, 2.6], [1, -2.3, 2.7], [2, 1.7, 2.3], [-2, 2.3, 2.9]];
// the one the flight looks up at: riding crest 0 until TF, when they fall off; then treading water beside the board
const TF = 23.19, FALL_Z = 0.6, FALL_AT = [52.5, 0.9], FALL_BOARD = [51.2, -0.3];
// people sitting astride their boards waiting for a set: x, z, heading
const SITTERS = [[78.2, 1.9, 3.4], [80.7, -1.4, 2.9], [11.5, -2.7, 3.3]];
const _col = new Color();
function setK(v, kind, hex) { _col.set(hex); v.set(kind, _col.r, _col.g, _col.b); }
/** fill the pane's lists for wave time w. Everything is worked out from w, so a still picture of any second is true */
function cast(w, U) {
  const B = U.uBoard.value, BK = U.uBoardK.value, BY = U.uBoardY.value, S = U.uSwim.value, SK = U.uSwimK.value, SP = U.uSwimP.value;
  const swim = (j, x, z, yaw, ph) => { S[j].set(x, z, Math.cos(yaw), Math.sin(yaw)); SP[j].set(surfH(x, w), ph); };
  let i = 0;
  for (const [n, z0, off] of RIDERS) {
    const x = crestX(n, w) + off, z = z0 + 0.5 * Math.sin(0.5 * w + i * 2.1), yaw = Math.atan2(0.25 * Math.cos(0.5 * w + i * 2.1), CW);
    B[i].set(x, z, Math.cos(yaw), Math.sin(yaw)); setK(BK[i], 1, BOARDS[i + 1]); i++;
  }
  // the one who falls
  const xf = crestX(0, TF) + 2.4, u = w - TF;
  if (u < 0) { B[i].set(crestX(0, w) + 2.4, FALL_Z + 0.3 * Math.sin(0.6 * w), 1, 0); setK(BK[i], 1, '#d9643f'); }
  else {
    const k = smoothstep(0, 2.6, u), yaw = 0.55 * k + 0.1 * Math.sin(w * 0.4), bob = 0.12 * Math.sin(w * 0.9);
    B[i].set(xf + (FALL_BOARD[0] - xf) * k + bob, FALL_Z + (FALL_BOARD[1] - FALL_Z) * k, Math.cos(yaw), Math.sin(yaw)); setK(BK[i], 3, '#d9643f');
  }
  const fb = B[i];
  i++;
  for (const [x, z, yaw] of SITTERS) { B[i].set(x + 0.15 * Math.sin(w * 0.5 + x), z + 0.1 * Math.sin(w * 0.37 + z), Math.cos(yaw), Math.sin(yaw)); setK(BK[i], 2, BOARDS[(i + 3) % BOARDS.length]); i++; }
  for (; i < NB; i++) BK[i].set(0, 0, 0, 0);
  for (let q = 0; q < NB; q++) BY[q] = surfH(B[q].x, w);
  // swimmers: the one who fell; two crossing the street; two treading water by the sitters
  let j = 0;
  if (u > 0.5) { const k = smoothstep(0.5, 3.2, u); swim(j, xf + 1.2 + (FALL_AT[0] - xf - 1.2) * k, FALL_Z + (FALL_AT[1] - FALL_Z) * k, 0.4 + 0.3 * Math.sin(w * 0.23), w * 3.4); setK(SK[j], 1, '#e8b44a'); } else SK[j].set(0, 0, 0, 0);
  // the cord from the board's tail to their ankle
  if (u > 0.5) { const tx = fb.x - 1.25 * fb.z, tz = fb.y - 1.25 * fb.w; U.uLeashA.value.set(tx, surfH(tx, w) - 0.03, tz, 1); U.uLeashB.value.set(S[j].x + 0.25, surfH(S[j].x, w) - 1.3, S[j].y - 0.2); } else U.uLeashA.value.w = 0;
  j++;
  swim(j, 22 + 0.4 * Math.sin(w * 0.3), -7.5 + 0.55 * w, Math.PI / 2 + 0.1 * Math.sin(w * 0.5), w * 4.2); setK(SK[j], 2, '#c94f5a'); j++;
  swim(j, 68 + 0.5 * Math.sin(w * 0.27), 20.5 - 0.5 * w, -Math.PI / 2 + 0.1 * Math.sin(w * 0.45), w * 4.0); setK(SK[j], 2, '#5fa8b0'); j++;
  swim(j, 79.4, 0.3 + 0.2 * Math.sin(w * 0.31), 3.0, w * 3.0); setK(SK[j], 1, '#f3fdff'); j++;
  swim(j, 36.5 + 0.2 * Math.sin(w * 0.4), -3.1, 2.6, w * 3.1 + 1); setK(SK[j], 1, '#4f9a6a'); j++;
  for (; j < NS; j++) SK[j].set(0, 0, 0, 0);
}

// ---------------------------------------------------------------- the street under the glass
// Squall's paint: whites and sea-glass, beach-hut doors, striped cloth, and warm lamps inside the shops
const SEA = {
  ...PALETTES.bright,
  walls: ['#e6ecea', '#dfe6dc', '#cfe0e2', '#e8ecea', '#d5e2e0', '#eef0ea'],
  dado: ['#5fa8b0', '#2d5f70', '#9fc0c8', '#4f7f8a'],
  trim: ['#2a3a40', '#41565e', '#5d8a94', '#24343a'],
  doors: ['#d9643f', '#e8b44a', '#2d5f70', '#f3fdff', '#c94f5a', '#5fa8b0', '#3a6ea5', '#e9d36a'],
  awnings: [['#d9643f', '#f3fdff'], ['#2d5f70', '#f3fdff'], ['#e8b44a', '#f3fdff'], ['#c94f5a', '#f3fdff'], ['#5fa8b0', '#f3fdff']],
  signs: [['#13212a', '#f3fdff'], ['#2d5f70', '#f3fdff'], ['#f3fdff', '#2d5f70'], ['#d9643f', '#f3fdff'], ['#e8b44a', '#13212a'], ['#f3fdff', '#c94f5a']],
  floor: '#9ba49e', strip: '#8f9a98', court: '#c9cfc8', ceiling: '#d6d8cc', rib: '#eef0e6',
  rooms: ['#f0d9a8', '#e6c890', '#f0c8a8', '#f6e6c0', '#e9d0a0', '#e6d0c0', '#f2dca0'],
  metal: '#7f8a8c', brass: '#c9a45a', glass: '#c9e2e6',
  lamp: '#ffe0b0', window: ['#ffd9a0', '#ffe6bc', '#fff0d0', '#ffcf8c'], shop: '#ffe0a8',
  goods: 0.95,
};
const STEEL = '#33454b', BAR = '#e3ebe8';
// half the width of the tube's hole in the ceiling at x along the street (0 where there is none)
const holeZ = (x) => { const q = (x - EX) / EA; return Math.abs(q) < 1 ? EB * Math.sqrt(1 - q * q) : 0; };

/** paving and glazing bars from the paddle works to the street's end. No ceiling: that is the pane */
function* glassPaving(deck) {
  const run = new Run(0, 0, 0, 0), pal = deck.pal;
  for (let u0 = GX0; u0 < GX1 - 0.01; u0 += 6) {
    const u1 = Math.min(GX1, u0 + 6), P = deck.pen(run, (u0 + u1) / 2, 'sw'), g = P.g;
    P.f.tint(1).floor(u0, -W / 2 - 0.3, u1, W / 2 + 0.3, 0, pal.floor, { emit: 0.9 }).tint(0);
    // bars across the street every three metres (cut where the tube comes through), and a plate along each wall
    for (const u of [u0, u0 + 3]) {
      if (u < GX0 + 0.5 || u > GX1 - 0.5) continue;
      const hz = holeZ(u), cuts = hz > 0 ? [[-W / 2, -hz - 0.12], [hz + 0.12, W / 2]] : [[-W / 2, W / 2]];
      for (const [za, zb] of cuts) g.box(u - 0.04, H - 0.13, za, u + 0.04, H, zb, BAR, { skip: 't', emit: 0.22 });
    }
    for (const sd of [-1, 1]) g.box(u0, H - 0.1, sd > 0 ? W / 2 - 0.08 : -W / 2, u1, H, sd > 0 ? W / 2 : -W / 2 + 0.08, BAR, { skip: 't' });
    P.done();
    if (deck.clk.due()) { yield 'swell: paving'; deck.clk.go(); }
  }
  {
    // two bars along the street, stopped either side of the tube; the beam where the works' ceiling ends; the end wall
    const P = deck.pen(run, 40, 'sw'), g = P.g;
    for (const z of [-1.34, 1.34]) for (const [a, b] of [[GX0, EX - 3.5], [EX + 3.5, GX1]]) g.box(a, H - 0.09, z - 0.03, b, H, z + 0.03, BAR, { skip: 't', emit: 0.22 });
    g.box(GX0 - 0.3, H - 0.6, -W / 2, GX0 + 0.1, H, W / 2, pal.rib, { skip: 't' });
    g.quad([GX1, 0, -W / 2], [GX1, 0, W / 2], [GX1, H, W / 2], [GX1, H, -W / 2], pal.walls[2]);
    g.box(GX1 - 0.03, 0, -W / 2, GX1, 1.0, W / 2, pal.dado[1], { skip: 'be' });
    P.done();
  }
  yield 'swell: bars';
}
/** both rows of fronts under the glass */
function* glassFronts(deck, fronts, fill) {
  const back = new Run(0, 0, W / 2, 0), front = new Run(0, 0, -W / 2, 2), rows = {};
  rows.back = yield* frontage(deck, back, { from: back.u(GX0), to: back.u(GX1), height: H, fronts: fronts.back, fill: { ...fill, trades: SWELL_TRADES.back }, part: 'sw' });
  rows.front = yield* frontage(deck, front, { from: front.u(GX0), to: front.u(GX1), height: H, fronts: fronts.front, fill: { ...fill, trades: SWELL_TRADES.front }, part: 'sw' });
  return rows;
}

// ---------------------------------------------------------------- what stands in the street
const HUT = ['#d9643f', '#e8b44a', '#f3fdff', '#c94f5a', '#5fa8b0', '#3a6ea5', '#e9d36a', '#9fd0d6', '#f0e2c0'];
const OUTLINE = [[1.35, 0], [1.05, 0.25], [0.3, 0.3], [-1.1, 0.27], [-1.3, 0.16], [-1.3, -0.16], [-1.1, -0.27], [0.3, -0.3], [1.05, -0.25]];
// a board's shape as a slab 8 cm thick, both faces
function slab(g) {
  g.extrude(OUTLINE, 0, 0.08, '#ffffff');
  for (let i = 1; i < OUTLINE.length - 1; i++) g.tri([OUTLINE[0][0], 0, OUTLINE[0][1]], [OUTLINE[i][0], 0, OUTLINE[i][1]], [OUTLINE[i + 1][0], 0, OUTLINE[i + 1][1]], '#ffffff');
  return g;
}
function furnish(deck) {
  // a board stood on its tail, leaning back a little (its width along x, its deck toward the street)
  deck.proto('boardUp', (g) => { g.at(0, 1.32, 0).rot('x', Math.PI / 2 + 0.13).rot('y', Math.PI / 2); slab(g.tint(1)).tint(0).box(-0.9, 0.08, -0.012, 1.0, 0.084, 0.012, '#5a6a70').box(-0.9, -0.004, -0.012, 1.0, 0, 0.012, '#5a6a70'); g.pop().pop().pop(); });
  // a board lying flat along x, and a pair of trestles to lay it on
  deck.proto('boardFlat', (g) => { slab(g.tint(1)).tint(0).box(-0.9, 0.08, -0.012, 1.0, 0.084, 0.012, '#5a6a70'); });
  deck.proto('trestles', (g) => { for (const x of [-0.75, 0.75]) { g.box(x - 0.03, 0.8, -0.36, x + 0.03, 0.86, 0.36, '#8a7358'); for (const z of [-0.32, 0.32]) g.tube([[x, 0.8, z * 0.8], [x + 0.14, 0, z], [x - 0.14, 0, z], [x, 0.8, z * 0.8]], 0.018, 4, '#7a6650'); } });
  // a board under someone's arm: they face +z and it rides at their right hip
  deck.proto('boardCarry', (g) => { g.at(-0.34, 0.98, 0.1).rot('x', -0.1).rot('y', -Math.PI / 2).rot('x', Math.PI / 2); slab(g.tint(1)).tint(0); g.pop().pop().pop().pop(); });
  // a long bench with no back, to lie on
  deck.proto('longBench', (g) => { g.tint(0.2); for (const x of [-1.7, 0, 1.7]) g.box(x - 0.04, 0, -0.24, x + 0.04, 0.4, 0.24, '#4a565c', { skip: 'tb' }); g.tint(1); for (let i = 0; i < 4; i++) g.box(-2.1, 0.4, -0.3 + i * 0.155, 2.1, 0.445, -0.3 + i * 0.155 + 0.135, '#ffffff'); g.tint(0); });
  // someone lying on their back along x, head toward +x, knees up, hands behind the head
  for (const [nm, skin] of [['lierA', SKIN[0]], ['lierB', SKIN[2]], ['lierC', SKIN[4]]]) deck.proto(nm, (g) => {
    g.tint(1).box(-0.2, 0, -0.2, 0.52, 0.2, 0.2, '#ffffff', { skip: 'b' });
    g.tint(0.45).tube([[-0.2, 0.1, 0.1], [-0.62, 0.44, 0.11], [-0.98, 0.05, 0.12]], 0.062, 5, '#d5dadc').tube([[-0.2, 0.1, -0.1], [-0.6, 0.48, -0.12], [-0.94, 0.05, -0.13]], 0.062, 5, '#d5dadc');
    g.tint(0).box(-1.12, 0, 0.07, -0.94, 0.09, 0.17, skin).box(-1.08, 0, -0.18, -0.9, 0.09, -0.08, skin);
    g.tint(1).tube([[0.46, 0.14, 0.2], [0.62, 0.1, 0.4], [0.78, 0.08, 0.14]], 0.05, 4, '#ffffff').tube([[0.46, 0.14, -0.2], [0.62, 0.1, -0.4], [0.78, 0.08, -0.14]], 0.05, 4, '#ffffff');
    g.tint(0).blob(0.72, 0.15, 0, 0.125, 0, skin, { shadeBottom: 0.85 });
  });
  // a robe on a hanger, and a pile of folded towels
  deck.proto('robe', (g) => {
    g.tint(0).box(-0.24, 0, -0.01, 0.24, 0.02, 0.01, '#5f4630').tube([[0, 0.02, 0], [0, 0.12, 0]], 0.008, 4, '#6d6c68');
    g.tint(1).box(-0.25, -1.2, -0.06, 0.25, -0.02, 0.06, '#ffffff').box(-0.42, -0.62, -0.05, -0.25, -0.04, 0.05, '#ececec').box(0.25, -0.62, -0.05, 0.42, -0.04, 0.05, '#ececec');
    g.tint(0.6).box(-0.03, -1.2, -0.068, 0.03, -0.1, -0.06, '#d9d9d9').tint(0);
  });
  deck.proto('towels', (g) => { g.tint(1); for (let i = 0; i < 5; i++) g.box(-0.2 + 0.012 * (i % 2), i * 0.07, -0.15, 0.2 - 0.012 * (i % 3), i * 0.07 + 0.062, 0.15, i % 2 ? '#ffffff' : '#dcdcdc'); g.tint(0); });
}
const wallAt = (g, u0, u1, y0, y1, v, col, e = 0) => g.quad([u1, y0, v], [u0, y0, v], [u0, y1, v], [u1, y1, v], col, e);
// a lit room behind an open front: floor, three walls, a ceiling with a strip of lamp in it
function room(deck, P, run, u0, u1, H, dep, wall, floor) {
  const g = P.g, e = 0.62 * deck.glowK, hi = H - 0.2;
  g.floor(u0, 0.1, u1, dep, 0.015, floor);
  wallAt(g, u0, u1, 0, hi, dep, wall, e);
  g.quad([u0, 0, dep], [u0, 0, 0.26], [u0, hi, 0.26], [u0, hi, dep], wall, e * 0.75).quad([u1, 0, 0.26], [u1, 0, dep], [u1, hi, dep], [u1, hi, 0.26], wall, e * 0.75);
  g.floor(u0, 0.26, u1, dep, hi, shade(wall, 0.85), { down: true, emit: e * 0.5 });
  let n = 0;
  for (let u = u0 + 1.6; u < u1 - 0.8; u += 3.2, n++) g.floor(u - 0.6, dep * 0.45, u + 0.6, dep * 0.45 + 0.3, hi - 0.01, '#fff0d0', { down: true, emit: 3.6 * deck.glowK });
  // and the light those lamps give: on what stands in the room, and a warm pool on the paving outside
  deck.lattice({ origin: run.pt(u0 + 1.6, hi - 0.05, dep * 0.45 + 0.15), spacing: [3.2, 40], count: [n, 1], color: deck.pal.shop, power: 0.95, reach: 3.4, drop: 3.9 });
}
// the fascia over an open front, with its name
function fascia(deck, P, run, b, H, name, ground, ink) {
  const g = P.g, u0 = b.u0 + 0.24, u1 = b.u1 - 0.24;
  g.box(u0, 2.3, -0.02, u1, 2.36, 0.26, b.trim, { skip: 't' }).box(u0, 2.36, -0.05, u1, 2.86, 0.26, ground, { skip: 'tb' }).box(u0, 2.86, -0.1, u1, 2.93, 0.26, b.trim).box(u0, 2.93, 0, u1, H, 0.26, b.wall, { skip: 'tb' });
  deck.sign(name, { run, at: run.pt((u0 + u1) / 2, 2.61, -0.056), maxW: u1 - u0 - 0.6, h: 0.42, style: 'board', font: 'serif', ground, ink, track: 0.1 });
  for (let u = u0 + 1.2; u < u1 - 0.5; u += 2.4) deck.glow([{ p: run.pt(u, 2.1, 1.0), color: deck.pal.shop, power: 0.5 * deck.glowK, size: 1.4 }]);
}

// The board shapers: an open workshop. Boards stand in racks along its back wall; out on the paving, in the light, one
// lies on trestles being sanded, and a blank waits on another pair.
function shapers(deck, P, b, run, H, rng) {
  const g = P.g, u0 = b.u0 + 0.24, u1 = b.u1 - 0.24, dep = 4.2;
  room(deck, P, run, b.u0 + 0.12, b.u1 - 0.12, H, dep, '#f0d9a8', '#8f8a78');
  fascia(deck, P, run, b, H, 'Board shapers', '#13212a', '#f3fdff');
  for (const u of [u0 + (u1 - u0) / 3, u0 + 2 * (u1 - u0) / 3]) g.box(u - 0.06, 0, 0.02, u + 0.06, 2.3, 0.14, STEEL, { skip: 'tb' });
  // the racks: two rails, and a board in every slot
  g.box(u0 + 0.3, 1.86, dep - 0.42, u1 - 0.3, 1.92, dep - 0.36, '#5f4630').box(u0 + 0.3, 0.04, dep - 0.75, u1 - 0.3, 0.1, dep - 0.2, '#5f4630');
  for (let u = u0 + 0.7; u < u1 - 0.5; u += 0.46) deck.put('boardUp', { p: run.pt(u, 0.1, dep - 0.72), yaw: run.yaw, scale: [1, rng.f(0.86, 1.02), 1], color: rng.pick(BOARDS) });
  // templates hung on the side wall, a bench with a plane and a tin of wax
  for (let k = 0; k < 4; k++) g.quad([b.u0 + 0.13, 0.5 + k * 0.1, 3.4 - k * 0.55], [b.u0 + 0.13, 0.5 + k * 0.1, 3.0 - k * 0.55], [b.u0 + 0.13, 2.2, 3.05 - k * 0.55], [b.u0 + 0.13, 2.2, 3.35 - k * 0.55], k % 2 ? '#c9a36a' : '#b08d5a', 0.3);
  g.box(u1 - 2.6, 0, 1.2, u1 - 0.5, 0.86, 1.9, '#8a7358', { skip: 'b', top: '#c9b79a' }).box(u1 - 1.3, 0.86, 1.4, u1 - 0.9, 0.95, 1.55, '#3a4a50').cyl(u1 - 2.1, 0.86, 1.55, 0.09, 0.09, 0.1, 8, '#e8b44a');
  // out on the paving: the one being sanded (its dust on the slabs under it) and a blank
  const ua = u0 + 4.2, ub = u0 + 9.4;
  g.floor(ua - 1.7, -1.75, ua + 1.7, -0.45, 0.012, '#dfe7e2');
  for (const [u, col] of [[ua, '#e8b44a'], [ub, '#f3fdff']]) { deck.put('trestles', { p: run.pt(u, 0, -1.1), yaw: run.yaw }); deck.put('boardFlat', { p: run.pt(u, 0.86, -1.1), yaw: run.yaw, color: col }); }
  g.box(ua + 0.25, 0.94, -1.2, ua + 0.5, 1.0, -1.04, '#c9a45a');                                    // the sanding block, under a hand
  deck.people([{ p: run.pt(ua + 0.36, 0, -0.52), yaw: run.yaw + Math.PI, color: '#2d5f70' }, { p: run.pt(ub - 0.7, 0, -0.5), yaw: run.yaw + Math.PI - 0.4, color: '#e7e1d3' }, { p: run.pt(ub + 1.5, 0, -0.8), yaw: run.yaw + Math.PI + 0.7, child: true }]);
  // finished boards against a bit of wall by the pier, for sale
  wallAt(g, u1 - 2.5, u1, 0, 2.3, 0.0, b.wall);
  for (let k = 0; k < 4; k++) deck.put('boardUp', { p: run.pt(u1 - 0.5 - k * 0.5, 0, -0.42), yaw: run.yaw, scale: [1, 0.92 + 0.03 * k, 1], color: HUT[(k * 2 + 1) % HUT.length] });
  deck.sign(['Shaped to', 'your height', 'From 310'], { run, at: run.pt(u1 - 1.25, 2.02, -0.1), w: 0.9, h: 0.5, style: 'card', font: 'serif', font2: 'cond', head: false });
}

// Robes and towels for hire: a rail of robes out on the paving, towels in piles on shelves behind
function robes(deck, P, b, run, H, rng) {
  const g = P.g, u0 = b.u0 + 0.24, u1 = b.u1 - 0.24, dep = 3.4;
  room(deck, P, run, b.u0 + 0.12, b.u1 - 0.12, H, dep, '#f6e6c0', '#9a9488');
  fascia(deck, P, run, b, H, 'Robes and towels', '#f3fdff', '#2d5f70');
  for (let k = 0; k < 3; k++) {
    const y = 0.55 + k * 0.62;
    g.box(u0 + 0.2, y, dep - 0.45, u1 - 0.2, y + 0.04, dep, '#5d8a94', { skip: 's' });
    for (let u = u0 + 0.5; u < u1 - 0.4; u += 0.52) if (rng() < 0.85) deck.put('towels', { p: run.pt(u, y + 0.04, dep - 0.24), yaw: run.yaw, scale: [1, rng.f(0.5, 1.15), 1], color: rng.pick(HUT) });
  }
  g.box(u0 + 0.5, 0, 0.5, u0 + 3.1, 0.92, 1.05, '#5fa8b0', { skip: 'b', top: '#e6ecea' });
  // the rail, on the paving
  const ra = u0 + 3.8, rb = u1 - 0.5;
  g.tube([[ra, 0, -0.62], [ra, 1.78, -0.62], [rb, 1.78, -0.62], [rb, 0, -0.62]], 0.022, 5, deck.pal.metal);
  for (let u = ra + 0.35; u < rb - 0.25; u += 0.47) deck.put('robe', { p: run.pt(u, 1.66, -0.62), yaw: run.yaw + rng.f(-0.25, 0.25), scale: [1, rng.f(0.9, 1.05), 1], color: rng.pick(['#f3fdff', '#f3fdff', '#9fd0d6', '#e9d36a', '#d9643f', '#e7e1d3', '#5fa8b0', '#f0e2c0']) });
  deck.people([{ p: run.pt(u0 + 1.8, 0, 1.5), yaw: run.yaw + Math.PI, color: '#5fa8b0' }]);
  deck.sign(['A robe 0.2', 'A towel 0.1', 'Bring them', 'back wet'], { run, at: run.pt(u0 + 1.8, 1.55, dep - 0.03), w: 1.25, h: 1.0, style: 'chalk' });
}

// The racks: where you leave a board between sets. In swell hour half the slots are empty
function racks(deck, P, b, run, H, rng) {
  const g = P.g, u0 = b.u0 + 0.24, u1 = b.u1 - 0.24;
  wallAt(g, b.u0, b.u1, 0, H, 0, b.wall);
  g.box(b.u0, 0, -0.022, b.u1, 1.0, 0, b.dado, { skip: 'bs' });
  g.box(u0, 1.8, -0.2, u1, 1.86, -0.14, STEEL).box(u0, 0.03, -0.62, u1, 0.09, -0.05, STEEL);
  for (let u = u0 + 0.3; u < u1 - 0.1; u += 0.62) {
    g.box(u - 0.3, 1.8, -0.2, u - 0.27, 1.86, 0, STEEL);
    if (rng() < 0.58) deck.put('boardUp', { p: run.pt(u, 0.09, -0.52), yaw: run.yaw, scale: [1, rng.f(0.84, 1.02), 1], color: rng.pick(BOARDS) });
  }
  deck.sign(['Racks', 'Take the board', 'you came with'], { run, at: run.pt((u0 + u1) / 2, 2.42, -0.012), w: 1.5, h: 0.62, style: 'plate', font: 'cond', font2: 'serif', head: true });
}

// ---------------------------------------------------------------- people who go somewhere
// The deck kit's walkers keep to a level line and never stop. The children who race the crest, and the people on the
// Wet Stair, are placed afresh each frame from the flight's clock instead.
const RACE_X0 = 31, RACE_X1 = 61, RACE_T = (RACE_X0 - XC0) / CW;       // crest 0 is over the start line at 19.6 s
const softmin = (a, b, k) => a - k * Math.log(1 + Math.exp((a - b) / k));
function makeActors(deck, door, rng) {
  const geos = { a0: figureGeo(SKIN[1], 'stand'), a1: figureGeo(SKIN[3], 'stand'), c0: figureGeo(SKIN[0], 'child'), c1: figureGeo(SKIN[4], 'child') };
  const cg = new Geo(); cg.at(-0.34, 0.98, 0.1).rot('x', -0.1).rot('y', -Math.PI / 2).rot('x', Math.PI / 2); slab(cg.tint(1)).tint(0); cg.pop().pop().pop().pop();
  geos.board = cg.build();
  const P = {};
  for (const k in geos) { P[k] = pack(geos[k], deck.prop, 12); deck.group.add(P[k].mesh); }
  const place = (kind, x, y, z, yaw, lean, s, color) => { _ee.set(lean, yaw, 0, 'YXZ'); _va.set(x, y, z); P[kind].put(_mm.compose(_va, _qq.setFromEuler(_ee), _vs.set(s, s, s)), color); };
  // Two heats on the start line. Four small ones go with the crest before (14.6 s); then six step up to the line and go
  // with crest 0. Each sets off a moment after the crest's light reaches the line, runs at about three metres a second
  // in long low-g bounds, and pulls up past the finish
  const kids = [];
  for (let i = 0; i < 4; i++) kids.push({ t0: RACE_T - LAM / CW, z: -2.0 + i * 0.3 + rng.f(-0.04, 0.04), v: rng.f(2.7, 3.1), r: rng.f(0.1, 0.8), x0: RACE_X0 - 0.3 - rng.f(0, 0.2), back: 0, D: RACE_X1 - RACE_X0 + rng.f(6, 9.5), kind: i % 2 ? 'c1' : 'c0', color: new Color(VESTS[(i * 2 + 4) % VESTS.length]), s: rng.f(0.86, 0.98), ph: rng.f(0, 6.28) });
  for (let i = 0; i < 6; i++) kids.push({ t0: RACE_T, z: -2.05 + i * 0.22 + rng.f(-0.03, 0.03), v: rng.f(2.95, 3.5), r: rng.f(0.1, 0.9), x0: RACE_X0 - 0.3 - rng.f(0, 0.25), back: rng.f(1.0, 1.5), D: RACE_X1 - RACE_X0 + rng.f(1.5, 4.5), kind: i % 2 ? 'c0' : 'c1', color: new Color(VESTS[(i * 3 + 1) % VESTS.length]), s: rng.f(1.0, 1.16), ph: rng.f(0, 6.28) });
  const kidX = (k, w) => {
    const u = w - k.t0 - k.r;
    if (u <= 0) return k.x0 - k.back * (1 - smoothstep(k.t0 - 4.4, k.t0 - 2.4, w));        // the second heat waits a pace behind the first
    return k.x0 + softmin(k.v * (u - 0.5 * (1 - Math.exp(-u / 0.5))), k.D, 1.2) + 1.2 * Math.log(1 + Math.exp(-k.D / 1.2));
  };
  // on the stair: someone with a board going up ahead of the flight and out at the door; two coming down, wet, in robes
  const doorX = XS + door[0] * CS, VS = 0.89, white = new Color('#f3fdff'), board = new Color('#e8b44a'), vest = new Color('#3a6ea5'), towel = new Color('#9fd0d6');
  const upT = 55.3 - (doorX - XS) / VS;                                 // when the climber reaches the stair's foot
  const down = [{ foot: 46.8, z: -0.9, to: -2.9, over: 3.5, kind: 'a0', color: white, s: 1 }, { foot: 42.5, z: 0.7, to: 2.7, over: 5, kind: 'c1', color: towel, s: 1.2 }];
  return function act(w) {
    for (const k of kids) {
      const x = kidX(k, w), sp = (kidX(k, w + 0.05) - x) / 0.05, go = Math.min(1, sp / 3), u = w - k.t0 - k.r;
      const wait = u < 0 && u > -4 ? 0.03 * Math.abs(Math.sin(w * 4 + k.ph)) : 0;       // on their toes as the crest comes
      place(k.kind, x, 0.11 * go * Math.abs(Math.sin(Math.PI * 2.1 * u + k.ph)) + wait, k.z, Math.PI / 2, 0.3 * go, k.s, k.color);
    }
    {
      const x = w < upT ? XS - 1.3 * (upT - w) : XS + VS * (w - upT), y = stairY(x), bob = 0.03 * Math.abs(Math.sin(w * 5.2));
      const z = 0.45 + 0.6 * (1 - smoothstep(XS - 14, XS - 3, x));
      place('a1', x, y + bob, z, Math.PI / 2, w < upT ? 0.03 : 0.14, 1, vest); place('board', x, y + bob, z, Math.PI / 2, 0, 1, board);
    }
    for (const d of down) {
      const u = w - d.foot, x = u < 0 ? XS - VS * u : XS - 1.25 * u, zAt = (q) => d.z + (d.to - d.z) * smoothstep(0, d.over, q), z = zAt(u);
      if (x > doorX + 3) continue;
      place(d.kind, x, stairY(x) + 0.03 * Math.abs(Math.sin(w * 5 + d.foot)), z, Math.atan2(-1.25, (zAt(u + 0.1) - z) / 0.1), u < 0 ? -0.08 : 0.03, d.s, d.color);
    }
    for (const k in P) P[k].done();
  };
}

// the trades the kit fills in with: a list for each side, so that no shop faces its twin
const SWELL_TRADES = { back: [['Tea', 'tea'], ['Sandals', 'shoes'], ['Bread', 'bread'], ['Lamps', 'lamps'], ['Preserves', 'jars']], front: [['Noodles', 'noodles'], ['Vests', 'cloth'], ['Books', 'books'], ['Pots and lids', 'pots'], ['Flutes', 'flutes']] };
const CLOTHS = ['#d9643f', '#e8b44a', '#5fa8b0', '#3a6ea5', '#c94f5a', '#e7e1d3', '#4f9a6a', '#a34b86', '#f3fdff', '#9fd0d6', '#2d5f70'];
/** the fronts the street is known for: the row on the back side (the right, going spinward) and on the front side */
function frontsOf(deck, rng) {
  // (the kit draws a front in one go: these three are kept back, and drawn one to a step once the rows are laid out)
  const later = [], keep = (fn) => (P, b, run, H) => { later.push([fn, b, run, H]); };
  const back = [
    { from: 1.5, to: 8, kind: 'shop', name: 'Wax', goods: 'jars', lit: 1, awning: false, blade: true },
    { from: 8, to: 22.5, kind: 'custom', id: 'shapers', draw: keep(shapers) },
    { from: 22.5, to: 29.5, kind: 'shop', id: 'mender', name: 'Boards mended', sub: ['Dings and fins', 'while you swim'], goods: 'none', awning: false, blade: false, lit: 1, open: true, props: false, doorSide: 0, ground: '#2d5f70', ink: '#f3fdff', font: 'serif' },
    { from: 77, to: 89, kind: 'custom', id: 'robes', draw: keep(robes) },
  ];
  const front = [
    { from: 2, to: 14.5, kind: 'custom', id: 'racks', draw: keep(racks) },
    { from: 27.5, to: 32, kind: 'wall', bench: false, notice: ['Raced today', 'The crest 41', 'Us 0'], noticeStyle: 'chalk' },
    { from: 44, to: 48.5, kind: 'wall', bench: false, notice: ['Gloaming says', 'we would paddle', 'the sunline.', 'We have asked.'] },
    { from: 71, to: 79.5, kind: 'stall', id: 'broth', name: 'Broth', goods: 'pots', lit: 1, awning: ['#2d5f70', '#f3fdff'], ground: '#13212a', ink: '#f3fdff', font: 'serif' },
    { from: 79.5, to: 82.5, kind: 'wall', bench: false, notice: ['Broth', 'with sea lettuce', 'from the strain library', '0.4 a bowl'], noticeStyle: 'chalk' },
  ];
  return { back, front, later };
}

/** benches down the middle and who lies on them, the slate at the street's mouth, the race's lines, the people */
function* dress(deck, rows, rng, D) {
  const pal = deck.pal;
  // long benches down the middle, under the glass, and people on their backs on them watching the water
  for (const bx of [9, 16, 23, 32, 39, 46]) {
    deck.put('longBench', { p: [bx, 0, 0], yaw: 0, color: rng.pick(['#5fa8b0', '#2d5f70', '#e6ecea', '#d9643f']) });
    const two = rng.chance(0.65);
    for (let k = 0; k < (two ? 2 : 1); k++) deck.put(rng.pick(['lierA', 'lierB', 'lierC']), { p: [bx + (two ? (k ? 1.05 : -1.05) : rng.f(-0.7, 0.7)), 0.445, rng.f(-0.03, 0.03)], yaw: rng.chance(0.5) ? 0 : Math.PI, color: rng.pick(CLOTHS) });
  }
  yield 'swell: benches';
  // the slate at the street's mouth
  const n = [-0.939, -0.344], bp = [-2.6, 0, 3.0];
  deck.put('noticeboard', { p: bp, yaw: 1.22, color: '#5f4630' });
  deck.sign(['Swell hour', 'Noon to three', 'Open to anyone', 'Stand up slowly'], { at: [bp[0] + n[0] * 0.03, 1.375, bp[2] + n[1] * 0.03], n, w: 1.2, h: 0.98, style: 'chalk' });
  // the race: a line to start from and a line to finish on, thirty metres apart, painted on the paving
  const P = deck.pen(new Run(0, 0, 0, 0), 40, 'sw');
  for (const x of [RACE_X0, RACE_X1]) P.g.floor(x - 0.07, -2.15, x + 0.07, -0.55, 0.012, '#f3fdff');
  P.done();
  deck.sign('Start', { at: [RACE_X0 + 0.55, 0.016, -1.35], up: Math.PI / 2, h: 0.42, w: 1.5, style: 'card', font: 'cond', ground: '#a9b0a8', ink: '#f6fbf8', upper: true, track: 0.2 });
  deck.sign('30 m', { at: [RACE_X1 + 0.55, 0.016, -1.35], up: Math.PI / 2, h: 0.42, w: 1.5, style: 'card', font: 'cond', ground: '#a9b0a8', ink: '#f6fbf8', upper: true, track: 0.2 });
  // the Wet Stair's name, hung where you come to it
  {
    const u = XS - 3.4, ww = 2.6, hh = 0.5, run = new Run(0, 0, 0, 0), Q = deck.pen(run, u, 'sw');
    Q.g.box(u - 0.035, H - 0.2 - hh - 0.06, -ww / 2 - 0.05, u + 0.035, H - 0.2, ww / 2 + 0.05, pal.trim[0]);
    for (const v of [-ww / 2 + 0.2, ww / 2 - 0.2]) Q.g.box(u - 0.012, H - 0.2, v - 0.012, u + 0.012, H, v + 0.012, pal.metal, { skip: 'tb' });
    Q.done();
    for (const sd of [1, -1]) deck.sign(['The Wet Stair', 'To the jetty'], { run, side: sd, at: run.pt(u + sd * 0.037, H - 0.23 - hh / 2, 0), w: ww, h: hh, style: 'plate', font: 'cond', font2: 'serif', head: true });
  }
  {
    const Q = deck.pen(new Run(0, 0, 0, 0), XS - 4, 'sw'), wet = shade(pal.floor, 0.72);
    Q.f.tint(1).floor(XS - 1.6, -1.5, XS + 0.05, 1.5, 0.008, wet, { emit: 1 }).tint(0);
    for (let i = 0; i < 26; i++) {
      const t = i / 25, x = XS - 1.0 - 6.6 * t, z = 0.5 + 2.4 * t * t, a = Math.atan2(4.8 * t, -6.6), sd = i % 2 ? 0.13 : -0.13;
      Q.g.at(x - Math.sin(a) * sd, 0.012, z + Math.cos(a) * sd, -a);
      Q.g.box(-0.13, 0, -0.045, 0.1, 0.002, 0.045, shade(pal.floor, 0.62 + 0.3 * t), { skip: 'b' }).box(0.12, 0, -0.04, 0.17, 0.002, 0.04, shade(pal.floor, 0.62 + 0.3 * t), { skip: 'b' });
      Q.g.pop();
    }
    Q.done();
  }
  yield 'swell: paint';
  // the mender's window: three boards waiting, one with a patch still grey
  const mb = rows.back.find('mender');
  if (mb) for (let k = 0; k < 3; k++) deck.put('boardUp', { p: mb.at(0.42 + k * 0.2, 0.63, 0.55), yaw: rows.back.run.yaw, scale: [0.6, 0.6, 0.6], color: HUT[(k * 3 + 4) % HUT.length] });
  // the broth counter: pans, bowls set out, steam, and a queue in robes
  const bb = rows.front.find('broth');
  if (bb) {
    const run = rows.front.run;
    for (const t of [0.3, 0.68]) { deck.put('pan', { p: bb.at(t, 0.95, 0.12), yaw: 0, scale: 0.62, color: '#c9c8c2' }); for (let i = 0; i < 6; i++) deck.glow([{ p: bb.at(t + rng.f(-0.02, 0.02), 1.25, 0.12), color: '#f3fdff', power: rng.f(0.1, 0.2), size: rng.f(0.5, 1.0), move: [rng.f(-0.03, 0.03), rng.f(0.1, 0.2), rng.f(-0.03, 0.03)], loop: rng.f(4, 7), phase: rng() }]); }
    for (let i = 0; i < 6; i++) deck.put('bowl', { p: bb.at(0.14 + i * 0.145, 0.95, -0.2), yaw: 0, color: i % 2 ? '#e6ecea' : '#9fd0d6' });
    deck.people([0.2, 0.42, 0.6, 0.83].map((t, i) => ({ p: bb.at(t, 0, -0.68 - 0.16 * (i % 2)), yaw: run.yaw + rng.f(-0.3, 0.3), color: ['#f3fdff', '#9fd0d6', '#f3fdff', '#e9d36a'][i], child: i === 2 })));
  }
  // what came back wet, drying on lines across the right-hand half of the street before the hire shop
  {
    const Q = deck.pen(new Run(0, 0, 0, 0), 74, 'sw');
    for (const x of [70.6, 72.8, 75.0]) {
      Q.g.box(x - 0.008, H - 0.52, 1.25, x + 0.008, H - 0.505, W / 2, pal.metal);
      for (const z of [2.0, 3.25]) deck.put('sheet', { p: [x, H - 0.5, z + rng.f(-0.12, 0.12)], yaw: Math.PI / 2, scale: [rng.f(0.6, 0.78), rng.f(0.75, 1.05), 1], color: rng.pick(['#f3fdff', '#9fd0d6', '#e9d36a', '#d9643f', '#f0e2c0', '#5fa8b0']) });
    }
    Q.done();
  }
  yield 'swell: counters';
  // people watching the race from the wall, and standing about wet at the foot of the stair
  deck.people([[26.9, -3.5], [32.8, -3.55], [33.7, -3.45], [60.2, -3.5], [62.4, -3.55], [63.6, -3.4]].map(([x, z]) => ({ p: [x, 0, z], yaw: 0.3 + rng.f(-0.4, 0.4), color: rng.pick(CLOTHS) })));
  for (const [x, z, m] of [[86, -2.6, 3], [90.5, 2.9, 2], [84.5, 2.5, 2], [96, -2.9, 3], [103, 2.8, 2], [108, -2.4, 3]]) deck.knot(x, 0, z, m, rng);
  // strollers and knots along both sides, clear of the race and of the flight
  for (let i = 0; i < Math.round(26 * D); i++) {
    const x = rng.f(2, 112), right = rng.chance(0.6), z = right ? rng.f(2.6, 3.2) : -rng.f(3.15, 3.35), rad = right ? rng.f(0.4, 0.9) : rng.f(0.3, 0.45);
    if ((right && x > 6 && x < 31) || (right && x > 75 && x < 90) || Math.abs(x - XS - 4) < 6 || !deck.clear(x, 1.2, z, rad + 2.1)) continue;
    if (rng.chance(0.45)) deck.knot(x, 0, z, 2 + Math.floor(rng() * 2), rng); else deck.people([{ p: [x, 0, z], walk: rad, child: rng.chance(0.2), color: rng.pick(CLOTHS) }]);
  }
  yield 'swell: strollers';
  // people carrying their boards up the street as the flight begins: it overtakes them under the glass
  for (const [x0, z, sp, col, bc] of [[-4, -2.45, 1.3, '#3a6ea5', '#f3fdff'], [10, -2.5, 1.22, '#c94f5a', '#e9d36a']]) {
    const len = GX1 + 34, drift = [sp, 0, 0, len / sp], phase = ((x0 + 36) / len) % 1;
    deck.pacers.push({ p: [-36, 0, z], yaw: Math.PI / 2, drift, phase, color: col, child: false, skin: rng.pick(SKIN), scale: 1 });
    deck.put('boardCarry', { p: [-36, 0, z], yaw: Math.PI / 2, drift, phase, color: bc });
  }
  // and a steady coming and going along the left-hand fronts
  deck.walkersAlong({ from: [-30, 0, -2.45], to: [GX1 - 2, 0, -2.45], n: Math.round(10 * D), spread: 0.07, rng });
  deck.walkersAlong({ from: [GX1 - 2, 0, -2.8], to: [-30, 0, -2.8], n: Math.round(10 * D), spread: 0.07, rng });
}

// ---------------------------------------------------------------- the Wet Stair
const stairY = (x) => Math.max(0, (x - XS) * TS);          // the line of the treads
const GO = 0.36;                                           // a tread's going; it rises 0.131 m
// a point of the tube's own co-ordinates (s metres up the stair from its foot, h square to it) in the street's
const tubeXY = (s, h) => [XS + s * CS - h * SS, s * SS + h * CS];
/**
 * The stair, its tube through the water and the round door where it breaks the surface. door: [s, h] of the middle of
 * the opening the flight leaves by, in the tube's co-ordinates.
 */
function* wetStair(deck, door) {
  const pal = deck.pal, b = deck.bucket(XS, 0, 'stair'), g = b.g, gl = b.gl, brass = pal.brass, top = door[0] + 0.02;
  // treads to the door, and the wedge they stand on
  const n = Math.ceil((top * CS + 0.6) / GO);
  for (let i = 0; i < n; i++) {
    const x = XS + i * GO, y = (i + 1) * GO * TS;
    g.box(x, y - 0.42, -1.2, x + GO, y, 1.2, i % 2 ? '#c3cbc5' : '#b8c1bb', { skip: 'b', top: '#d3dad4' });
    g.box(x - 0.012, y - 0.035, -1.2, x + 0.03, y + 0.004, 1.2, '#e9d36a', { skip: 'b' });           // a painted nosing: wet feet
    if (deck.clk.due()) { yield 'swell: treads'; deck.clk.go(); }
  }
  // Squall's motto, a word to a riser, where you read it on the way up to the water
  ['Stand', 'up', 'slowly'].forEach((word, k) => { const i = 15 + k * 2; deck.sign(word, { at: [XS + i * GO - 0.006, (i + 0.38) * GO * TS, 0], n: [-1, 0], w: 1.1, h: 0.096, style: 'card', font: 'cond', ground: '#c9d1cb', ink: '#13212a', upper: true, track: 0.45 }); });
  const L = (H - 0.25) / TS;
  for (const z of [-1.2, 1.2]) {
    const s = z > 0 ? 1 : -1, tri = [[XS + 0.6, 0, z], [XS + L, 0, z], [XS + L, L * TS - 0.3, z]];
    if (s > 0) g.tri(tri[0], tri[1], tri[2], pal.walls[2]); else g.tri(tri[0], tri[2], tri[1], pal.walls[2]);
    g.box(XS + 0.6, 0, Math.min(z, z + s * 0.02), XS + L, 0.12, Math.max(z, z + s * 0.02), pal.dado[1], { skip: 'b' });
  }
  g.quad([XS + L, 0, 1.2], [XS + L, 0, -1.2], [XS + L, H, -1.2], [XS + L, H, 1.2], pal.walls[2]);            // its back, under the tube
  yield 'swell: treads';
  // everything else in the tube's own co-ordinates
  for (const q of [g, gl]) { q.at(XS, 0, 0); q.rot('z', SA); }
  const over = (s, h) => s * SS + h * CS > H + 0.02;                    // above the glass of the street's ceiling
  const ring = (s, a) => [s, TC + RT * Math.sin(a), RT * Math.cos(a)];
  const A0 = -Math.asin(TC / RT) + 0.03, A1 = Math.PI - A0;
  // hoops every metre and a half, and five rails along it
  for (let s = 1.5; s < top - 0.4; s += 1.5) {
    let run = [];
    for (let k = 0; k <= 22; k++) {
      const a = A0 + (A1 - A0) * (k / 22), p = ring(s, a);
      if (over(p[0], p[1])) run.push(p); else { if (run.length > 1) g.tube(run, 0.035, 4, BAR); run = []; }
    }
    if (run.length > 1) g.tube(run, 0.035, 4, BAR);
    yield 'swell: hoops';
  }
  yield 'swell: hoops';
  for (const a of [0.12, 0.85, Math.PI / 2, Math.PI - 0.85, Math.PI - 0.12]) {
    const h = TC + RT * Math.sin(a), s0 = Math.max(0.2, (H + 0.03 - h * CS) / SS);
    g.tube([[s0, h, RT * Math.cos(a)], [top, h, RT * Math.cos(a)]], 0.026, 5, BAR);
  }
  // its glass
  for (let s = 0; s < top - 0.01; s += 0.75) {
    const s1 = Math.min(top, s + 0.75);
    for (let k = 0; k < 18; k++) {
      const a = A0 + (A1 - A0) * (k / 18), c = A0 + (A1 - A0) * ((k + 1) / 18), m = ring((s + s1) / 2, (a + c) / 2);
      if (!over(m[0], m[1])) continue;
      gl.quad(ring(s, a), ring(s1, a), ring(s1, c), ring(s, c), '#d2ecea');
    }
    if (deck.clk.due()) { yield 'swell: glass'; deck.clk.go(); }
  }
  yield 'swell: tube';
  // handrails, and a glass balustrade to the open flight under the ceiling
  for (const z of [-1.12, 1.12]) {
    g.tube([[0.25, 0.0, z], [0.25, 0.95, z], [top - 0.1, 0.95, z]], 0.024, 6, brass);
    for (let s = 1.6; s < 6.2; s += 1.5) g.tube([[s, 0.04, z], [s, 0.95, z]], 0.016, 4, brass);
    gl.quad([0.3, 0.08, z], [6.1, 0.08, z], [6.1, 0.9, z], [0.3, 0.9, z], pal.glass);
  }
  // the round door at the waterline: a plate across the tube with the opening in it, and a brass ring
  const [ds, dh] = door, R0 = 1.22, pts = [];
  for (let k = 0; k <= 48; k++) {
    const a = (k / 48) * Math.PI * 2, cz = Math.cos(a), sy = Math.sin(a), off = dh - TC;
    let t = -off * sy + Math.sqrt(Math.max(0, off * off * sy * sy - off * off + RT * RT));
    if (dh + sy * t < 0) t = -dh / sy;                                  // not below the treads
    pts.push([[ds + 0.012, dh + sy * R0, cz * R0], [ds + 0.012, dh + sy * t, cz * t], [ds - 0.03, dh + sy * (R0 + 0.05), cz * (R0 + 0.05)]]);
  }
  for (let k = 0; k < 48; k++) { const p = pts[k], q = pts[k + 1]; g.quad(p[0], q[0], q[1], p[1], '#dfe9e6'); g.quad(p[0], p[1], q[1], q[0], '#dfe9e6'); }
  g.tube(pts.map((p) => p[2]), 0.045, 6, brass);
  for (const q of [g, gl]) { q.pop(); q.pop(); }
  // the rim of the hole in the street's ceiling
  const rim = [];
  for (let k = 0; k <= 40; k++) { const a = (k / 40) * Math.PI * 2; rim.push([EX + EA * Math.cos(a), H - 0.03, EB * Math.sin(a)]); }
  g.tube(rim, 0.05, 5, BAR);
  yield 'swell: stair';
}

// ---------------------------------------------------------------- the water round the Wet Stair
// Inside the tube the eye is above the street's ceiling, with water outside the glass on every side. What is out there
// is built, not worked out on the pane: the swell from under, the bed of the lake (which over the street is the pane,
// alight from below), people treading water and sitting astride their boards, and, where the tube stands clear of a
// trough, the day. All of it is seen through water: it loses its red and goes to green with distance.
const BX0 = XS - 9, BX1 = XS + 40, BZ = 24;
const TUBE_GLSL = /* glsl */`
uniform vec3 uSwEye;     // the eye, in the street's own metres
const vec3 SW_TA = vec3(${f4(CS)}, ${f4(SS)}, 0.0), SW_TC0 = vec3(${f4(XS - TC * SS)}, ${f4(TC * CS)}, 0.0);
float swTubeD(vec3 F) { vec3 d = F - SW_TC0; return length(d - SW_TA * dot(d, SW_TA)); }
// metres of water on the eye's way to F: all of the way but what lies inside the tube
float swWater(vec3 F) {
  vec3 D = F - uSwEye; float L = length(D); D /= max(L, 1e-4);
  vec3 oc = uSwEye - SW_TC0, op = oc - SW_TA * dot(oc, SW_TA), dp = D - SW_TA * dot(D, SW_TA);
  float A = dot(dp, dp), B = dot(op, dp), C = dot(op, op) - SW_RT * SW_RT, h = B * B - A * C;
  float air = (h > 0.0 && A > 1e-6) ? clamp((-B + sqrt(h)) / A, 0.0, L) : 0.0;
  return L - air;
}
const vec3 SW_FOG = vec3(0.030, 0.150, 0.155);
vec3 swFog(vec3 c, float dw) { return mix(SW_FOG, c * swAbs(dw * 0.5), exp(-0.16 * dw)); }
`;
const SURF_VERT = /* glsl */`
${BEND_PARS}
${SWELL_GLSL}
varying vec3 vW; varying vec3 vF;
void main() {
  vec3 p = position, n = vec3(0.0, 1.0, 0.0);
  p.y = SW_H + swH(p.x).x;
  vF = p;
  kBend(p, n);
  vW = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const SURF_FRAG = /* glsl */`
${CLIP_PARS}
uniform vec3 uBend, uSwGlow; uniform float uPx;
varying vec3 vW; varying vec3 vF;
${SWELL_GLSL}
${TUBE_GLSL}
void main() {
  ${CLIP_FRAG}
  if (swTubeD(vF) < SW_RT) discard;
  vec3 Vw = normalize(vW - cameraPosition);
  float an = uBend.x + vF.x / uBend.z, ca = cos(an), sa = sin(an);
  vec3 V = vec3(-sa * Vw.x + ca * Vw.y, -ca * Vw.x - sa * Vw.y, Vw.z);
  float eyeD = length(vW - cameraPosition), px = eyeD / uPx / max(abs(V.y), 0.08);
  float keep = smoothstep(0.45, 0.05, px);
  vec2 hs = swH(vF.x), rp = swRip(vF.xz, keep) * mix(0.35, 1.0, keep);
  vec3 c;
  if (V.y > 0.0) {
    // from under: a window where the ray is steep enough to get out, a mirror where it is not
    vec3 Nd = normalize(vec3(hs.y + rp.x, -1.0, rp.y));
    vec3 Ta = refract(V, Nd, 1.33);
    float through = step(0.5, dot(Ta, Ta));
    float fr = mix(1.0, 0.02 + 0.98 * pow(1.0 - clamp(dot(Ta, -Nd), 0.0, 1.0), 5.0), through);
    vec3 sky = swSky(normalize(Ta + vec3(0.0, 1e-3, 0.0)), 0.05 * (1.0 - keep) + px * 0.12);
    vec3 Rd = reflect(V, Nd);
    float back = (vF.y - SW_H) / max(-Rd.y, 0.06);
    vec2 qb = vF.xz + Rd.xz * back;
    float over = smoothstep(SW_HALF + 0.4, SW_HALF - 0.4, abs(qb.y)) * step(SW_GX0, qb.x) * step(qb.x, SW_GX1);
    c = mix(sky, swFog(mix(vec3(0.012, 0.045, 0.055), uSwGlow, over), back), fr);
    c = swFog(c, swWater(vF));
  } else {
    // from over it, out of the top of the tube: the lake on a bright day
    vec3 N = normalize(vec3(-hs.y - rp.x, 1.0, -rp.y));
    float fr = 0.03 + 0.97 * pow(1.0 - clamp(dot(-V, N), 0.0, 1.0), 5.0);
    c = mix(vec3(0.07, 0.20, 0.24), swSky(reflect(V, N), 0.05), fr);
  }
  gl_FragColor = vec4(c, 1.0);
}`;
const SOLID_VERT = /* glsl */`
attribute vec4 aCol; attribute float aEmit;
${BEND_PARS}
varying vec3 vW; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying float vEmit;
void main() {
  vec3 p = position, n = normal;
  #ifdef USE_INSTANCING
    p = (instanceMatrix * vec4(p, 1.0)).xyz; n = mat3(instanceMatrix) * n;
  #endif
  vec3 c = aCol.rgb;
  #ifdef USE_INSTANCING_COLOR
    c = mix(c, c * instanceColor, aCol.a);
  #endif
  vF = p; vFN = normalize(n); vCol = c; vEmit = aEmit;
  kBend(p, n);
  vW = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const SOLID_FRAG = /* glsl */`
${CLIP_PARS}
uniform vec3 uSwGlow; uniform vec4 uSwSun; uniform sampler2D tSwBars;
varying vec3 vW; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying float vEmit;
${SWELL_GLSL}
${TUBE_GLSL}
void main() {
  ${CLIP_FRAG}
  // the bed stops at the hole the tube comes up through
  vec2 qe = vec2((vF.x - SW_EX) / SW_EA, vF.z / SW_EB);
  if (vF.y < SW_H + 0.05 && dot(qe, qe) < 1.0) discard;
  vec3 N = normalize(vFN);
  if (!gl_FrontFacing) N = -N;
  float top = SW_H + swH(vF.x).x, depth = max(top - vF.y, 0.0), wet = step(vF.y, top + 0.02);
  // light from above through that much water, dappled; and from below, off the street's glass
  float dap = 6.0 * textureLod(tSwBars, vec2(vF.x / ${f4(CPX)}, (uSwW + 0.12 * vF.z) / ${f4(CTL)}), 2.0 + 0.6 * depth).r;
  vec3 L = uSwSun.rgb * (0.22 + 0.78 * max(N.y, 0.0)) * mix(1.0, dap, 0.6 * wet) * swAbs(depth) + uSwGlow * (0.4 * max(-N.y, 0.0)) + vec3(0.03, 0.07, 0.07);
  vec3 c = vCol * (L + vEmit);
  c = mix(c, swFog(c, swWater(vF)), wet);
  gl_FragColor = vec4(c, 1.0);
}`;

// people round the tube: metres up the street from the stair's foot, z, heading, 1 treading water or 2 astride a board
const TUBE_FOLK = [[5.4, -2.5, 1.2, 1], [7.6, 2.45, -1.9, 1], [9.6, -2.3, 1.7, 1], [10.8, 2.7, 3.3, 2], [3.6, 3.3, -2.4, 1], [12.8, -3.2, 2.8, 2], [8.4, -4.6, 0.4, 1], [6.4, 4.5, 3.0, 2]];
const _Y = new Vector3(0, 1, 0), _va = new Vector3(), _vd = new Vector3(), _qq = new Quaternion(), _mm = new Matrix4(), _vs = new Vector3(), _ee = new Euler(), _c1 = new Color();
// an instanced mesh filled afresh each frame
function pack(geo, material, cap) {
  const mesh = new InstancedMesh(geo, material, cap);
  mesh.frustumCulled = false; mesh.count = 0;
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  mesh.setColorAt(0, _c1.set('#ffffff'));
  mesh.instanceColor.setUsage(DynamicDrawUsage);
  const P = { mesh, n: 0,
    put(m, color) { if (P.n >= cap) return; mesh.setMatrixAt(P.n, m); mesh.setColorAt(P.n, color); P.n++; },
    done() { mesh.count = P.n; mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; P.n = 0; } };
  return P;
}
// a rounded limb from a to b
function stick(P, a, b, r, color) {
  _va.set(a[0], a[1], a[2]); _vd.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const len = _vd.length() || 1e-4;
  _qq.setFromUnitVectors(_Y, _vd.multiplyScalar(1 / len));
  P.put(_mm.compose(_va, _qq, _vs.set(r, len, r)), color);
}
function boardGeo() {
  const g = new Geo();
  g.tint(1).extrude([[1.35, 0], [1.05, 0.25], [0.3, 0.3], [-1.1, 0.27], [-1.3, 0.16], [-1.3, -0.16], [-1.1, -0.27], [0.3, -0.3], [1.05, -0.25]], 0, 0.09, '#ffffff').tint(0);
  g.box(-1.02, -0.2, -0.015, -0.78, 0, 0.015, '#1c262b');             // its fin
  return g;
}
const DAY_FRAG = /* glsl */`
${CLIP_PARS}
uniform vec3 uBend;
varying vec3 vW; varying vec3 vF;
${SWELL_GLSL}
void main() {
  ${CLIP_FRAG}
  vec3 Vw = normalize(vW - cameraPosition);
  float an = uBend.x + vF.x / uBend.z, ca = cos(an), sa = sin(an);
  vec3 V = normalize(vec3(-sa * Vw.x + ca * Vw.y, max(-ca * Vw.x - sa * Vw.y, 0.0) + 0.02, Vw.z));
  // low down the eye looks along the lake to its banks, pale with distance; higher, the far bank and the sunline
  vec3 c = mix(vec3(0.44, 0.58, 0.57), mix(vec3(0.30, 0.40, 0.33), swSky(V, 0.03), 0.7), smoothstep(0.03, 0.3, V.y));
  gl_FragColor = vec4(c * 1.3, 1.0);
}`;

/** the swell from under, the lake's bed, the far water, and the people in it. Returns { U, folk(w) } */
function* tubeWater(deck, scene, SW, bendU) {
  const frame = deck.frame;
  const U = { ...SW, uClip: G.uClip, uPx: G.uPx, uBend: bendU, uSwGlow: { value: vec3col('#a9d2cf', 0.75) }, uSwEye: { value: new Vector3() } };
  {
    // the surface: a grid, lifted into the swell as it is drawn
    const dx = 0.5, dz = 2, nx = Math.round((BX1 - BX0) / dx), nz = Math.round((2 * BZ) / dz);
    const pos = new Float32Array((nx + 1) * (nz + 1) * 3), idx = new Uint32Array(nx * nz * 6);
    let k = 0;
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { pos[k++] = BX0 + i * dx; pos[k++] = 0; pos[k++] = -BZ + j * dz; }
    k = 0;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d; }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
    geo.setIndex(new BufferAttribute(idx, 1));
    const pts = [];
    for (let i = 0; i <= 6; i++) for (const z of [-BZ, BZ]) for (const y of [H, H + 4]) pts.push(frame.point(BX0 + (BX1 - BX0) * (i / 6), y, z));
    geo.boundingSphere = new Sphere().setFromPoints(pts);
    scene.add(new Mesh(geo, new ShaderMaterial({ uniforms: U, vertexShader: SURF_VERT, fragmentShader: SURF_FRAG, side: DoubleSide })));
  }
  {
    // the day over the lake, for the top of the tube where it stands clear of a trough: the Hollow as the lake sees it
    const g = new Geo({ maxSeg: 8 }), y0 = H + D0 - 0.3, y1 = 26;
    g.quad([BX1, y0, -BZ], [BX1, y0, BZ], [BX1, y1, BZ], [BX1, y1, -BZ], '#ffffff').quad([BX0, y0, BZ], [BX0, y0, -BZ], [BX0, y1, -BZ], [BX0, y1, BZ], '#ffffff');
    g.quad([BX0, y0, -BZ], [BX1, y0, -BZ], [BX1, y1, -BZ], [BX0, y1, -BZ], '#ffffff').quad([BX1, y0, BZ], [BX0, y0, BZ], [BX0, y1, BZ], [BX1, y1, BZ], '#ffffff');
    g.floor(BX0, -BZ, BX1, BZ, y1, '#ffffff', { down: true });
    scene.add(g.mesh(new ShaderMaterial({ uniforms: U, vertexShader: WET_VERT, fragmentShader: DAY_FRAG, side: DoubleSide }), frame));
  }
  yield 'swell: the surface';
  const solid = new ShaderMaterial({ uniforms: U, vertexShader: SOLID_VERT, fragmentShader: SOLID_FRAG, side: DoubleSide });
  {
    // the bed: dark, and over the street the pane, alight, with its bars; and walls of far water all round
    const g = new Geo({ maxSeg: 8 }), bed = '#2a5a5e', far = '#0a2a2c', yt = H + D0 + 0.2;
    g.floor(BX0, -BZ, BX1, -W / 2, H + 0.01, bed).floor(BX0, W / 2, BX1, BZ, H + 0.01, bed).floor(GX1, -W / 2, BX1, W / 2, H + 0.01, bed);
    g.floor(BX0, -W / 2, GX1, W / 2, H + 0.01, '#a9d2cf', { emit: 0.42 });
    for (const z of [-W / 2, W / 2]) g.box(BX0, H + 0.01, z - 0.12, GX1, H + 0.1, z + 0.12, '#8fa6a3', { skip: 'b' });
    g.quad([BX1, H, -BZ], [BX1, H, BZ], [BX1, yt, BZ], [BX1, yt, -BZ], far).quad([BX0, H, BZ], [BX0, H, -BZ], [BX0, yt, -BZ], [BX0, yt, BZ], far);
    g.quad([BX0, H, -BZ], [BX1, H, -BZ], [BX1, yt, -BZ], [BX0, yt, -BZ], far).quad([BX1, H, BZ], [BX0, H, BZ], [BX0, yt, BZ], [BX1, yt, BZ], far);
    scene.add(g.mesh(solid, frame));
  }
  yield 'swell: the bed';
  // the people: every limb a rounded stick, placed afresh each frame
  const sg = new Geo(); sg.tint(1).cyl(0, 0, 0, 1, 1, 1, 7, '#ffffff', { smooth: true, base: true }).tint(0);
  const hg = new Geo(); hg.tint(1).blob(0, 0, 0, 0.125, 1, '#ffffff', { shadeBottom: 0.85 }).tint(0);
  const P = { stick: pack(sg.build(), solid, 150), head: pack(hg.build(), solid, 12), board: pack(boardGeo().build(), solid, 6) };
  for (const k in P) scene.add(P[k].mesh);
  const suit = new Color('#222d34'), who = TUBE_FOLK.map((f, i) => ({ x: XS + f[0], z: f[1], yaw: f[2], kind: f[3], vest: new Color(VESTS[(i * 3 + 1) % VESTS.length]), skin: new Color(SKIN[(i * 2 + 1) % SKIN.length]), board: new Color(BOARDS[(i * 3 + 2) % BOARDS.length]), ph: i * 1.7 }));
  function folk(w) {
    for (const f of who) {
      const x = f.x + 0.2 * Math.sin(w * 0.4 + f.ph), z = f.z + 0.12 * Math.sin(w * 0.33 + f.ph * 2), y = H + surfH(x, w), cy = Math.cos(f.yaw), sy = Math.sin(f.yaw);
      const at = (fw, up, sd) => [x + cy * fw - sy * sd, y + up, z + sy * fw + cy * sd];
      if (f.kind === 1) {
        // treading water: shoulders, chest, knees out and the lower legs going round, hands sculling
        const ph = w * 3.1 + f.ph;
        stick(P.stick, at(0, -0.2, 0.15), at(0, -0.2, -0.15), 0.115, f.vest); stick(P.stick, at(0, -0.28, 0), at(0, -0.62, 0), 0.16, f.vest);
        for (const k of [-1, 1]) {
          const a = ph + (k > 0 ? 0 : Math.PI), hp = at(0, -0.72, 0.1 * k);
          const kf = 0.26 + 0.08 * Math.sin(a), knee = at(kf, -0.94, 0.3 * k), foot = at(kf + 0.14 * Math.sin(a) - 0.1, -1.36, 0.3 * k + 0.2 * k * Math.cos(a));
          stick(P.stick, hp, knee, 0.085, suit); stick(P.stick, knee, foot, 0.065, suit);
          stick(P.stick, foot, [foot[0] + cy * 0.17, foot[1] - 0.04, foot[2] + sy * 0.17], 0.045, f.skin);
          const hand = at(0.22 * Math.cos(a + 0.5), -0.28, 0.56 * k);
          stick(P.stick, at(0, -0.2, 0.2 * k), hand, 0.05, f.vest); stick(P.stick, hand, at(0.22 * Math.cos(a + 0.5), -0.28, 0.65 * k), 0.045, f.skin);
        }
        _va.set(x, y + 0.13, z); P.head.put(_mm.compose(_va, _qq.identity(), _vs.set(1, 1, 1)), f.skin);
      } else {
        // astride a board, waiting for a set: legs in the water
        const sw = 0.12 * Math.sin(w * 1.3 + f.ph);
        _ee.set(0, -f.yaw, Math.atan(surfDX(x, w)) * cy, 'YZX'); _va.set(x, y - 0.07, z);
        P.board.put(_mm.compose(_va, _qq.setFromEuler(_ee), _vs.set(1, 1, 1)), f.board);
        stick(P.stick, at(-0.05, 0.06, 0), at(-0.08, 0.6, 0), 0.16, f.vest);
        for (const k of [-1, 1]) {
          const knee = at(0.22, -0.1, 0.33 * k);
          stick(P.stick, at(0, 0.06, 0.14 * k), knee, 0.08, suit); stick(P.stick, knee, at(0.2 + sw * k, -0.66, 0.34 * k), 0.07, suit);
          stick(P.stick, at(-0.06, 0.55, 0.19 * k), at(0.2, 0.2, 0.22 * k), 0.05, f.vest);
        }
        _va.set(x - 0.08 * cy, y + 0.84, z - 0.08 * sy); P.head.put(_mm.compose(_va, _qq.identity(), _vs.set(1, 1, 1)), f.skin);
      }
    }
    for (const k in P) P[k].done();
  }
  yield 'swell: swimmers';
  return { U, folk };
}

// ---------------------------------------------------------------- the flight
function flight() {
  const up = (dx) => [XS + dx, stairY(XS + dx) + EYE, 0];
  return [
    { t: 0, p: [-13.6, 1.6, 0.9] },
    { t: 5, p: [-5, 1.6, 1.1], look: [14, 1.9, 0.4] },
    { t: 9, p: [3.5, 1.68, 1.25], look: [24, 2.5, 0] },
    { t: 14, p: [15, 1.72, 1.25], look: [36, 2.0, 0.6] },
    { t: 20, p: [28, 1.7, 1.2], look: [47, 1.5, -1.2] },
    { t: 26, p: [40.5, 1.75, 1.15], look: [54, 2.0, -0.9] },
    { t: 30.5, p: [50.0, 2.0, 0.95], look: [51.5, 6.6, 0.85] },
    { t: 33.2, p: [53.6, 2.0, 0.85], look: [55.1, 6.6, 0.6] },
    { t: 37, p: [59.5, 1.8, 0.55], look: [71, 3.4, 0.1] },
    { t: 41.2, p: [70.5, 1.65, 0.3], look: [87, 2.4, 0] },
    { t: 45.5, p: [82.5, 1.6, 0.05], look: [98, 3.0, 0] },
    { t: 50.5, p: up(0.5), look: [XS + 9, 5.2, 0] },
    { t: 54, p: up(5.2) },
    { t: 56.8, p: up(9.2) },
    { t: 59, p: up(12.3) },
  ];
}

export const squallUnder = {
  id: 'squall-under',
  title: 'The ceiling is the lake', drum: 'Squall', row: 'Weather Row', kind: 'a steady drum', light: 28.0,
  line: 'Swell Street runs under the lake and its ceiling is glass. In swell hour the light comes down through the waves and slides along the paving, and the children race each crest up the street. At four metres a second the crest wins.',
  tone: '#9fd0d6', source: 'wander-year.md (Day 103; Method, Half-g waves)',
  sound: { root: 48, scale: 'lydian', pad: 0.45, air: 0.15, water: 0.7, crowd: 0.45, bells: 0.15, bright: 0.65 },
  *build(ctx) {
    // under the lake, 45 m on from the paddle line and in the lane where squall_swell's flight begins
    const frame = makeFrame((1000 + 45) / DRUM.RH, 1872, deckRadius(375) + SUNK);
    const rng = makeRng('swell-street');
    const path = makePath(flight(), { frame, entryRadius: 1.15, exitRadius: 1.2 });
    const deck = makeDeck(ctx, {
      frame, near: path.points(0.5), seed: 'swell-street', palette: SEA, clock: 'flight',
      light: { level: 0.85, ambUp: '#5a5750', ambDown: '#4d4a44' }, floor: { shine: 1, wear: 0.9 },
    });
    yield 'swell: path';
    const bars = yield* barsTexture();
    yield '~swell: bars';
    const SW = { uSwW: { value: 0 }, tSwBars: { value: bars }, uSwSun: { value: new Vector4(...vec3col('#c4f0f0', 1.2).toArray(), 1) } };
    addSwellLight(deck, SW);

    // ---- under the lake
    // (the paving and the stair are built before any of the kit's fronts: plain boxes first, so that the page has
    // learned to make them quickly by the time the first shop front, the longest single thing, is asked for)
    furnish(deck);
    yield* glassPaving(deck);
    // ---- the Wet Stair: its round door stands where the flight leaves, square to the way it is going
    const ex = path.exit.flat, door = [(ex.x - XS) * CS + ex.y * SS, -(ex.x - XS) * SS + ex.y * CS];
    yield* wetStair(deck, door);
    // ---- under the paddle works: a plain street, lamps, a plain ceiling
    yield* street(deck, {
      axis: 'x', from: -30.5, to: GX0, at: 0, y: 0, width: W, height: H,
      lamps: { every: 6, rows: 2, kind: 'globe', power: 0.8 }, folk: { stand: 5, stroll: 3, walk: 0 }, cloth: 0.7,
      plates: [{ at: -6.3, lines: ['Swell Street', 'Paddleside'] }],
      // (a wall and a door first on each side: the plainest fronts the kit has, and so the first it is asked to make)
      fronts: { back: [{ from: -30.5, to: -28.6, kind: 'wall', bench: false }, { from: -28.6, to: -24.2, kind: 'home' }], front: [{ from: -30.5, to: -28.4, kind: 'wall', bench: false }, { from: -28.4, to: -24, kind: 'home' }] },
      fill: { mix: { shop: 1.2, home: 2, wall: 0.5 }, numbers: 3, awnings: 0.2 },
      ends: ['wall', 'open'],
    });
    {
      const P = deck.pen(new Run(0, 0, 0, 0), -12, 'works'), pipe = '#5fa8b0';
      for (const x of [-22.3, -19.6, -16.4, -10.6, -7.7, -4.6]) {
        P.g.tube([[x, H - 0.13, -W / 2 + 0.05], [x, H - 0.13, W / 2 - 0.05]], 0.1, 8, pipe);
        for (const z of [-2.6, 0.2, 2.9]) P.g.tube([[x, H - 0.13, z - 0.05], [x, H - 0.13, z + 0.05]], 0.13, 8, shade(pipe, 0.8));
      }
      P.done();
      deck.sign('The lake begins here', { at: [GX0 - 0.312, H - 0.3, 0], n: [-1, 0], w: 3.6, h: 0.34, style: 'board', font: 'serif', ground: '#13212a', ink: '#f3fdff', track: 0.14 });
    }
    yield 'swell: the works';

    const fronts = frontsOf(deck, rng);
    const rows = yield* glassFronts(deck, fronts, { mix: { shop: 2, home: 1.2, wall: 0.3, stall: 0.5 }, numbers: 21, awnings: 0.3, lit: 0.9, blades: 0.5 });
    for (const [draw, b, run, hh] of fronts.later) { const P = deck.pen(run, (b.u0 + b.u1) / 2, 'sw'); draw(deck, P, b, run, hh, rng); P.done(); yield 'swell: fronts'; }
    deck.zone({ min: [GX0, -0.5, -W / 2 - 0.3], max: [GX1 + 1, H + 0.2, W / 2 + 0.3], soft: 1.0, color: '#a8d8da', power: 0.27, side: 0.65, under: 0.5 });
    deck.sky({ x0: GX0, z0: -W / 2, x1: GX1, z1: W / 2, y: H, floor: -0.5, color: '#bfe6e6', power: 0.55 });
    yield 'swell: the street';

    yield* dress(deck, rows, rng, ctx.density);
    const act = makeActors(deck, door, rng);
    yield 'swell: people';
    deck.zone({ min: [XS + 2.5, H - 0.6, -RT - 0.1], max: [XS + 15, 9.5, RT + 0.1], soft: 0.5, color: '#9fd8cc', power: 0.4, side: 0.9, under: 0.6 });

    yield* finish(deck);
    const scene = new Scene();
    scene.add(deck.group);

    // ---- the pane
    const bendU = { value: new Vector3(frame.a0, frame.z0, frame.floorR) };
    const paneU = {
      ...SW, uClip: G.uClip, uPx: G.uPx, uBend: bendU,
      uSwGlow: { value: vec3col('#a9d2cf', 0.75) }, uSwPave: { value: vec3col('#aebfbb', 0.8) },
      uBoard: { value: Array.from({ length: NB }, () => new Vector4()) }, uBoardK: { value: Array.from({ length: NB }, () => new Vector4()) },
      uSwim: { value: Array.from({ length: NS }, () => new Vector4()) }, uSwimK: { value: Array.from({ length: NS }, () => new Vector4()) },
      uBoardY: { value: new Float32Array(NB) }, uSwimP: { value: Array.from({ length: NS }, () => new Vector2()) },
      uLeashA: { value: new Vector4() }, uLeashB: { value: new Vector3() },
    };
    {
      const g = new Geo({ maxSeg: 4 });
      g.floor(GX0, -W / 2, GX1, W / 2, H - 0.01, '#ffffff', { down: true });
      const m = g.mesh(new ShaderMaterial({ uniforms: paneU, vertexShader: WET_VERT, fragmentShader: PANE_FRAG, side: FrontSide }), frame);
      scene.add(m);
    }
    yield 'swell: the pane';
    const water = yield* tubeWater(deck, scene, SW, bendU);

    const look = { exposure: 1.2, bloom: 0.26, threshold: 0.95, saturation: 1.06, contrast: 1.05, vignette: 0.42 };
    const api = {
      scene, path, deck, near: 0.12, far: 420, look,
      portal: { mist: '#9fd0d6', rim: false },
      update(t, dt, cam, engine) {
        // the wave's clock is the flight's; while this world is only seen through the last one's opening it counts
        // down to the crossing, so that nothing jumps there
        const seen = engine && engine.cur && engine.cur.userData !== api;
        const w = seen ? -Math.max(0, engine.cur.tCross - engine.cur.t) : t;
        SW.uSwW.value = w;
        deck.tick(w);
        cast(w, paneU);
        frame.local(cam.position, water.U.uSwEye.value);
        water.folk(w);
        act(w);
      },
    };
    return api;
  },
};
