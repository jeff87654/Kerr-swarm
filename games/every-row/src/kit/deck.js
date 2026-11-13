// The decks: the indoor city. Most of a drum is streets and arcades on decks 4 m apart under ceilings about 3 m high,
// lamp-lit about as brightly as a living room. Avenues run spinward and curve up ahead of you; streets run along the
// axis, dead straight. A block is some 3,000 people on six decks round an atrium court, and the courts and the Hollow
// are the only ceilings higher than a room (raft-habitat.md, A deck up close; ashgrove.md, Ashgrove).
//
// A world opens a deck with makeDeck(), lays streets, courts, halls and lobbies on it with the builders below, stands
// furniture, signs and people about, and calls finish(). Everything is modelled flat in the deck's frame (x = spinward
// metres, y = height above this deck's floor, z = metres along the axis) and bent onto the drum when drawn. Other decks
// of the same block are simply other heights: the deck above is y = 4, the one below y = -4.
//
//   const frame = makeFrame(a0, z0, deckRadius(75));
//   const path = makePath([...], { frame, ... });                  // the flight first: the deck is built round it
//   const deck = makeDeck(ctx, { frame, near: path.points(0.5), palette: PALETTES.warm, light: { level: 0.85 } });
//   const arcade = yield* street(deck, { axis: 'x', from: -200, to: -55, at: 0, trolley: { every: 70 },
//     fronts: { back: [{ from: -88, to: -78, kind: 'shop', name: "Dace's", goods: 'cloth' }] } });
//   const court = yield* atrium(deck, { x0: -45, x1: 45, z0: -30, z1: 30, y: -8, storeys: 6 });
//   yield* finish(deck);
//   scene.add(deck.group);
//
// What there is (each is documented where it is defined):
//   makeDeck(ctx, spec)        the place: frame, light rig, materials, and put / sign / people / glow / lattice / zone
//   street(deck, spec)         an avenue or a street of any length: floor, ceiling, ribs, lamps, shopfronts both sides, a trolley, people
//   frontage(deck, run, spec)  one row of fronts on its own (streets, courts and halls all use it)
//   atrium(deck, spec)         a court cut up through several decks: rings of planted terraces, flats' windows, a lit ceiling
//   bridge(deck, spec)         a way across a court
//   trolley(deck, spec)        slow cars with people aboard, along a line
//   hall(deck, spec)           one long room: a Mill Hall, a cooked hall with one table, baths
//   lobby(deck, spec)          a lift lobby's wall of cab doors; one of them can be a world's way out, and its leaves part
//   stairs(deck, spec)         a stair up and down
//   rose(deck, spec)           a direction rose inlaid in a floor
//   finish(deck)               turn everything drawn into a few meshes (one per material and chunk) and add them to deck.group
//   PALETTES, TRADES, Run      three paints; trades for fronts nobody names; a line of frontage in its own co-ordinates
//
// Words: an avenue's two sides are 'front' (the -z side, toward the front wall) and 'back'; a street's are 'anti' (-x)
// and 'spin' (+x). A court's four sides take the same four names. Places along a street or a side are given as the
// deck's own x or z.
//
// How it is drawn: solid geometry is gathered into one Geo per material for each 240 m square of deck (and each
// builder's `part`), furnishings are instanced by kind, people by skin and pose, every small light is in one
// glowPoints mesh and every sign in one mesh with a canvas atlas. Light is a lampRig: a lattice of lamps for each
// street and hall, a zone for a court. Floors have a shader of their own (slabs, wear, the shine of lamps).
//
// Canon limits a builder should keep in mind (drum-digest.md, sections 2 and 11): homes have no windows, except flats
// on a court's terraces; nothing burns (no candles, no smoke); no animals; plants root in tubs and troughs, not soil;
// things are old, mended and inherited, and the best chair in a room is the oldest.
import {
  Group, Mesh, ShaderMaterial, BufferGeometry, Float32BufferAttribute, CanvasTexture, SRGBColorSpace, LinearMipmapLinearFilter,
  LinearFilter, ClampToEdgeWrapping, Vector2, Vector3, Vector4, FrontSide,
} from 'three';
import { DRUM, deckRadius, makeFrame } from './drum.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG, NOISE_GLSL, lampRig, litMaterial, glowPoints, vec3col } from './mats.js';
import { Geo, instances, mixc, shade, fitBounds } from './geo.js';
import { crowd, figureGeo, SKIN, CLOTH } from './folk.js';
import { makeRng } from '../core/rng.js';

export const DECK_RISE = DRUM.DECK;       // floor to floor, metres
export const ROOM = 3;                    // floor to ceiling

// ---------------------------------------------------------------- palettes
// A palette is the paint of a place. Give a drum its own (spread one of these and change what differs), and set how
// bright it is with light.level: 0.5 is hushed, 0.85 a plain warm drum, 1.5 a drum that spends on its lamps.
export const PALETTES = {
  // plain and warm: plaster, old wood, worn paint
  warm: {
    walls: ['#d8c6a6', '#ccb592', '#c7b79d', '#d3bd9a', '#bfae93', '#cdc0a8'],
    dado: ['#a08467', '#8f7a66', '#94886f', '#a58a62'],
    trim: ['#5c4430', '#6f553c', '#4f4034', '#66503a'],
    doors: ['#5d7a62', '#3f6f73', '#7e3f33', '#b98a3a', '#51627a', '#2f6f9a', '#6a5a7a', '#8a5a3a'],
    awnings: [['#b5553f', '#e3d6bd'], ['#3f6f73', '#e3d6bd'], ['#b98a3a', '#e8dcc2'], ['#51627a', '#d9cfba'], ['#6f8a5a', '#e6dcc4']],
    signs: [['#2f3b34', '#ead9b0'], ['#4a2f26', '#f0dcb4'], ['#27394a', '#e6dcc6'], ['#e7dcc0', '#3a2c22'], ['#3b3530', '#e9c877'], ['#5a3a2a', '#f1e3c4']],
    floor: '#8f8c7e', strip: '#6c675c', court: '#b9b09c', ceiling: '#a8967a', rib: '#d6c6a6',
    rooms: ['#c9a36a', '#a9b08a', '#b98a6a', '#9aa6a0', '#d0b890', '#b7a088', '#c4b26e'],
    metal: '#6d6c68', brass: '#b08d4a', glass: '#b9d0d4',
    leaf: ['#7f9b63', '#6f8f5c', '#8aa466', '#94a875', '#5f7f55', '#86a06a'],
    bloom: ['#f1e6da', '#e9c9a0', '#e3a79a', '#f0dc9a', '#d9b6d0'],
    tub: ['#a9654a', '#bdb19a', '#8f7a66', '#b4795a'],
    lamp: '#ffdcae', window: ['#ffc98a', '#ffdcae', '#ffe9c8', '#f6c27e'], shop: '#ffd9a2',
    goods: 0.8,                             // how fresh the colours of things for sale are, 0..1
  },
  // lit higher, with new things in the windows
  bright: {
    walls: ['#efe6d6', '#e9dcc6', '#e3e0d6', '#f1e9dc', '#dcd6c8', '#ece2cf'],
    dado: ['#c9b9a2', '#b9c0bd', '#d0c2a6', '#bfb39c'],
    trim: ['#8a7358', '#3d3f44', '#a08663', '#57534c'],
    doors: ['#2f8f8a', '#d9603f', '#e0a52e', '#3f6fae', '#7a4f9a', '#3f9a5a', '#d05a7a', '#2f3b45'],
    awnings: [['#d9603f', '#fff6e6'], ['#2f8f8a', '#fff6e6'], ['#e0a52e', '#fffaf0'], ['#3f6fae', '#f6f1e6'], ['#d05a7a', '#fff1ea']],
    signs: [['#1f2a33', '#ffe9b0'], ['#f6efe0', '#1f2a33'], ['#d9603f', '#fff6e6'], ['#2f8f8a', '#fff6e6'], ['#27304a', '#ffd27a'], ['#fff6e6', '#b5402a']],
    floor: '#c6c0b2', strip: '#9a9488', court: '#d9d1c0', ceiling: '#cfc6b4', rib: '#f1e9d8',
    rooms: ['#f0d9a8', '#d6e0c0', '#f0c8a8', '#cfe0e0', '#f6e6c0', '#e6d0c0', '#e9e0a8'],
    metal: '#8e8f8c', brass: '#d0a85a', glass: '#c9e2e6',
    leaf: ['#7fae5c', '#6fa060', '#93b86a', '#86b070', '#5f9058', '#9cbf74'],
    bloom: ['#fff1e6', '#ffd08a', '#ff9f8a', '#ffe680', '#e6a6e0'],
    tub: ['#d98a5f', '#e6dcc8', '#b9b3a6', '#c9a27a'],
    lamp: '#fff1d6', window: ['#ffe0a8', '#fff0cf', '#fff6e6', '#ffd896'], shop: '#fff0d0',
    goods: 1.0,
  },
  // dim and hushed: dark wood, felt, deep greens
  dim: {
    walls: ['#8f8a78', '#7f8474', '#8a7f6c', '#797a70', '#857c70', '#74796c'],
    dado: ['#4f5548', '#5a4f42', '#4a4f4a', '#57503f'],
    trim: ['#2f2a24', '#3a3128', '#2a2f2a', '#3f352a'],
    doors: ['#3f5a48', '#2f4a4f', '#5a3a30', '#6a5a36', '#3a4458', '#4a3f52', '#4f4a3a', '#2f3a34'],
    awnings: [['#4f5a48', '#8f8a78'], ['#5a3a30', '#8a8474'], ['#3a4458', '#868474'], ['#6a5a36', '#8f8874'], ['#3f4a4f', '#7f8478']],
    signs: [['#22261f', '#bfb48f'], ['#2a221c', '#c9b98f'], ['#1f2a2f', '#b9bfae'], ['#8f8a78', '#22261f'], ['#262220', '#b79a5a'], ['#2f2a24', '#c9c0a0']],
    floor: '#5f5d54', strip: '#4a4842', court: '#77746a', ceiling: '#4a453d', rib: '#7a7364',
    rooms: ['#8a6f48', '#6f7a60', '#7f5f4a', '#66706c', '#8f7c5a', '#7a6a5a', '#80764a'],
    metal: '#4a4b48', brass: '#8a7240', glass: '#8fa6a8',
    leaf: ['#4f7048', '#456a4a', '#5a7a50', '#3f6045', '#557552', '#4a6f58'],
    bloom: ['#cfc9b9', '#b9a57a', '#a5837a', '#bfb27a', '#9a8aa5'],
    tub: ['#6a4f40', '#7f7a6c', '#5a5348', '#74604a'],
    lamp: '#ffc98a', window: ['#f0a85a', '#ffc27a', '#e9b06a', '#d99a52'], shop: '#f0b872',
    goods: 0.55,
  },
};

// Trades that any drum might have on a street: used for fronts a world does not name. No drum keeps animals, burns
// anything or grows grain for the table, so there is no butcher, chandler or miller here.
export const TRADES = [
  ['Bread', 'bread'], ['Tea', 'tea'], ['Noodles', 'noodles'], ['Books', 'books'], ['Lamps', 'lamps'], ['Herbs', 'greens'],
  ['Haircuts', 'none'], ['Flutes', 'flutes'], ['Shoes', 'shoes'], ['Pots and lids', 'pots'], ['Preserves', 'jars'],
  ['Cloth', 'cloth'], ['Toys', 'toys'], ['Old things', 'chairs'], ['Paper', 'paper'], ['Tailor', 'cloth'],
  ['Pastry', 'bread'], ['Dumplings', 'pots'], ['Miso', 'jars'], ['Lager', 'bottles'], ['Coffee', 'tea'], ['Laundry', 'none'],
];

// ---------------------------------------------------------------- small things
const TAU = Math.PI * 2;
const COS = [1, 0, -1, 0], SIN = [0, 1, 0, -1];
const lerp = (a, b, t) => a + (b - a) * t;
const pick = (rng, a) => a[Math.floor(rng() * a.length)];
// a colour a little lighter or darker, as old paint is
const vary = (c, rng, k = 0.08) => shade(c, 1 + (rng() * 2 - 1) * k);
// goods take their colour from a wheel, greyed for drums that keep old things
function hue(h, s, l) {
  const f = (n) => { const k = (n + h * 12) % 12; return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  const lin = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return [lin(f(0)), lin(f(8)), lin(f(4))];
}

/**
 * A run: a straight line of frontage, or anything else that is easier drawn in its own co-ordinates. u runs along it,
 * v across it, and what it draws faces -v. turn says which way it lies:
 *   0  u along +x, facing -z (the back side of an avenue)       2  u along -x, facing +z (its front side)
 *   3  u along +z, facing +x (the anti side of a street)        1  u along -z, facing -x (its spin side)
 */
export class Run {
  constructor(ox, oy, oz, turn = 0) { this.ox = ox; this.oy = oy; this.oz = oz; this.turn = ((turn % 4) + 4) % 4; this.c = COS[this.turn]; this.s = SIN[this.turn]; this.yaw = this.turn * Math.PI / 2; }
  /** a point of the run in the deck's flat co-ordinates */
  pt(u, y, v) { return [this.ox + u * this.c + v * this.s, this.oy + y, this.oz - u * this.s + v * this.c]; }
  /** a direction of the run (du, dv) in the deck's x and z */
  dir(du, dv) { return [du * this.c + dv * this.s, -du * this.s + dv * this.c]; }
  /** a point of the deck (x, z) in the run's own u and v */
  inv(x, z) { const dx = x - this.ox, dz = z - this.oz; return [dx * this.c - dz * this.s, dx * this.s + dz * this.c]; }
  /** where a place along the deck (an x for a run that lies along x, a z otherwise) falls along the run */
  u(along) { return this.turn === 0 ? along - this.ox : this.turn === 2 ? this.ox - along : this.turn === 3 ? along - this.oz : this.oz - along; }
  /** and back again */
  along(u) { return this.turn === 0 ? this.ox + u : this.turn === 2 ? this.ox - u : this.turn === 3 ? this.oz + u : this.oz - u; }
}

// ---------------------------------------------------------------- signs: real lettering, from one canvas
const FONTS = {
  serif: (px) => `400 ${px}px 'Cormorant Garamond', Georgia, 'Times New Roman', serif`,
  italic: (px) => `italic 600 ${px}px 'Cormorant Garamond', Georgia, serif`,
  sans: (px) => `500 ${px}px 'Barlow', 'Segoe UI', Arial, sans-serif`,
  cond: (px) => `500 ${px}px 'Barlow Condensed', 'Arial Narrow', Arial, sans-serif`,
  hand: (px) => `500 ${px}px 'Caveat', 'Segoe Print', cursive`,
};
// how wide a letter runs, as a share of its height: for sizing a sign before its font has loaded
const WIDE = { serif: 0.47, italic: 0.45, sans: 0.52, cond: 0.4, hand: 0.42 };

/**
 * Styles of sign. Each is drawn on the atlas by drawSign():
 *   board   a painted fascia board: ground, a thin line inside its edge, the name in ink
 *   plate   an enamel plate: pale ground, dark letters, a border (street names, addresses, door numbers)
 *   chalk   a slate written on by hand (menus, tallies, prices)
 *   paper   a notice: a heading and a few lines
 *   glow    a lit box: letters shining out of a dark ground (give the sign a `glow` as well)
 *   card    a small card with one or two lines (prices in a window)
 */
function drawSign(cx, e, x, y) {
  const w = e.pw, h = e.ph, st = e.style;
  cx.save();
  cx.translate(x, y);
  cx.beginPath(); cx.rect(0, 0, w, h); cx.clip();
  cx.fillStyle = e.ground; cx.fillRect(0, 0, w, h);
  // old paint is not flat: a few broad strokes of lighter and darker
  if (st !== 'glow') {
    const r = makeRng('sign' + e.key);
    for (let i = 0; i < 7; i++) {
      cx.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.055)';
      const yy = r() * h; cx.fillRect(0, yy, w, h * (0.06 + 0.2 * r()));
    }
  }
  const lines = e.lines, m = Math.max(2, Math.round(h * 0.07));
  cx.strokeStyle = e.ink; cx.fillStyle = e.ink;
  if (st === 'board' || st === 'glow') { cx.globalAlpha = 0.55; cx.lineWidth = Math.max(1, h * 0.022); cx.strokeRect(m, m, w - 2 * m, h - 2 * m); cx.globalAlpha = 1; }
  if (st === 'plate') {
    cx.lineWidth = Math.max(1.5, h * 0.05); cx.strokeRect(m * 0.9, m * 0.9, w - 1.8 * m, h - 1.8 * m);
    cx.beginPath(); for (const [sx, sy] of [[m * 2.2, m * 2.2], [w - m * 2.2, m * 2.2], [m * 2.2, h - m * 2.2], [w - m * 2.2, h - m * 2.2]]) { cx.moveTo(sx + m * 0.35, sy); cx.arc(sx, sy, m * 0.35, 0, TAU); } cx.globalAlpha = 0.6; cx.fill(); cx.globalAlpha = 1;
  }
  if (st === 'paper') { cx.globalAlpha = 0.5; cx.fillRect(w * 0.5 - m * 0.6, m * 0.5, m * 1.2, m * 1.2); cx.globalAlpha = 1; }
  // the words: one line fills the sign; more lines share it, the first as a heading
  const n = lines.length, pad = st === 'plate' ? 0.2 : st === 'board' || st === 'glow' ? 0.13 : 0.1;
  const availW = w * (1 - 2 * pad * Math.min(1, h / w * 2.2)), availH = h * (1 - 2 * pad);
  const share = n === 1 ? [1] : lines.map((_, i) => (i === 0 && e.head ? 1.45 : 1));
  const total = share.reduce((a, b) => a + b, 0);
  let yy = (h - availH) / 2;
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  for (let i = 0; i < n; i++) {
    const lh = availH * share[i] / total, fam = (i === 0 || !e.font2) ? e.font : e.font2;
    let px = lh * (n === 1 ? 0.8 : 0.74) * (fam === 'hand' ? 1.12 : 1);
    const txt = e.upper && fam !== 'hand' && fam !== 'italic' ? lines[i].toUpperCase() : lines[i];
    cx.font = FONTS[fam](px);
    if ('letterSpacing' in cx) cx.letterSpacing = (e.track ? (px * e.track).toFixed(1) : '0') + 'px';
    const tw = cx.measureText(txt).width;
    if (tw > availW) { px *= availW / tw; cx.font = FONTS[fam](px); if ('letterSpacing' in cx) cx.letterSpacing = (e.track ? (px * e.track).toFixed(1) : '0') + 'px'; }
    if (st === 'glow') { cx.shadowColor = e.ink; cx.shadowBlur = px * 0.25; }
    if (st === 'chalk') cx.globalAlpha = 0.88;
    cx.fillText(txt, w / 2, yy + lh / 2 + px * (fam === 'serif' || fam === 'italic' ? 0.04 : 0.02));
    cx.shadowBlur = 0; cx.globalAlpha = 1;
    if (i === 0 && n > 1 && e.head && (st === 'paper' || st === 'chalk')) { cx.globalAlpha = 0.45; cx.fillRect(w * 0.14, yy + lh * 0.98, w * 0.72, Math.max(1, h * 0.008)); cx.globalAlpha = 1; }
    yy += lh;
  }
  if ('letterSpacing' in cx) cx.letterSpacing = '0px';
  cx.restore();
}

const SIGN_VERT = /* glsl */`
attribute float aGlow;
${BEND_PARS}
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec2 vUv; varying float vGlow;
void main() {
  vec3 p = position, n = normal;
  vF = p; vFN = n; vUv = uv; vGlow = aGlow;
  kBend(p, n);
  vW = p; vN = n;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const signFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform sampler2D tAtlas;
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec2 vUv; varying float vGlow;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN), FN = normalize(vFN);
  if (!gl_FrontFacing) { N = -N; FN = -FN; }
  vec3 t = texture2D(tAtlas, vUv).rgb;
  gl_FragColor = vec4(kAir(t * (kLight(vW, N, vF, FN) + vGlow), vW), 1.0);
}`;

// ---------------------------------------------------------------- floors: slabs, wear, and the shine of lamps in them
// Drawn from Geo geometry: a vertex's colour is the stone's, its tint weight chooses the slabs (1 small, 0.5 large,
// 0 none) and its glow is how polished it is (0..1).
const FLOOR_VERT = /* glsl */`
attribute vec4 aCol; attribute float aEmit;
${BEND_PARS}
varying vec3 vW; varying vec3 vF; varying vec3 vCol; varying float vSlab; varying float vShine;
void main() {
  vec3 p = position, n = vec3(0.0, 1.0, 0.0);
  vF = p; vCol = aCol.rgb; vSlab = aCol.a; vShine = aEmit;
  kBend(p, n);
  vW = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const floorFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform vec3 uBend; uniform vec2 uSlab; uniform float uWear, uShine, uRough, uLampGlow;
uniform vec4 uSkyA[2], uSkyB[2], uSkyC[2];      // a lit ceiling over a court: x0, z0, x1, z1; its height, the floor's, -, on; colour
varying vec3 vW; varying vec3 vF; varying vec3 vCol; varying float vSlab; varying float vShine;
${rig.glsl}
${NOISE_GLSL}
void main() {
  ${CLIP_FRAG}
  vec2 m = vF.xz;
  float px = max(length(dFdx(m)), length(dFdy(m)));
  vec3 base = vCol;
  float on = step(0.25, vSlab);
  vec2 ts = uSlab * (vSlab < 0.75 ? 2.0 : 1.0);
  vec2 q = m / ts; vec2 id = floor(q); vec2 f = fract(q);
  float fine = on * smoothstep(ts.x * 0.5, ts.x * 0.1, px);
  base *= 1.0 + fine * (kHash(id) - 0.5) * 0.15;
  base = mix(base, base * vec3(0.8, 0.83, 0.88), fine * step(0.97, kHash(id + 17.3)) * uWear);       // a slab replaced with what there was
  float e = min(min(f.x, 1.0 - f.x) * ts.x, min(f.y, 1.0 - f.y) * ts.y);
  base *= 1.0 - 0.2 * on * (1.0 - smoothstep(0.0, 0.01 + px * 1.2, e)) * smoothstep(0.3, 0.04, px);
  base *= 0.92 + 0.16 * kFbm(m * 0.23);                                                              // and no old floor is one colour
  vec3 c = base * kLight(vW, kUp(vW), vF, vec3(0.0, 1.0, 0.0));
  float gl = vShine * uShine;
  if (gl > 0.002) {
    // the way to the eye in the floor's own frame, mirrored
    vec3 Vw = normalize(cameraPosition - vW), V = Vw;
    if (uBend.z > 0.0) { float a = uBend.x + vF.x / uBend.z, ca = cos(a), sa = sin(a); V = vec3(-sa * Vw.x + ca * Vw.y, -ca * Vw.x - sa * Vw.y, Vw.z); }
    float fres = 0.035 + 0.965 * pow(1.0 - clamp(V.y, 0.0, 1.0), 5.0);
    vec3 R = vec3(-V.x, max(V.y, 0.04), -V.z);
    vec2 al = normalize(R.xz + vec2(1e-5)), ac = vec2(-al.y, al.x);
    vec3 spec = vec3(0.0);
    for (int i = 0; i < LATTICES; i++) {
      vec4 A = uLatA[i], B = uLatB[i], C = uLatC[i];
      if (C.w < 0.5) continue;
      vec2 lb = kLatBand(vF.y + 0.5, A, uLatD[i]);
      float hgt = lb.x - vF.y;
      if (lb.y <= 0.0 || hgt < 0.3) continue;
      float t = hgt / R.y;
      vec2 H = m + R.xz * t;
      vec2 gi = clamp(floor((H - A.xz) / B.xy + 0.5), vec2(0.0), max(B.zw - 1.0, vec2(0.0)));
      vec2 d = H - (A.xz + gi * B.xy);
      float sig = 0.3 + uRough * t;
      float da = dot(d, al) / (sig * 3.2), dc = dot(d, ac) / sig;
      spec += C.rgb * exp(-da * da - dc * dc) * min(0.5 / sig, 1.0);
    }
    spec *= uLampGlow;
    for (int i = 0; i < 2; i++) {
      if (uSkyB[i].w < 0.5 || vF.y < uSkyB[i].y - 0.5 || vF.y > uSkyB[i].x - 0.5) continue;
      vec2 H = m + R.xz * ((uSkyB[i].x - vF.y) / R.y);
      vec4 A = uSkyA[i];
      spec += uSkyC[i].rgb * smoothstep(A.x - 3.0, A.x + 3.0, H.x) * smoothstep(A.z + 3.0, A.z - 3.0, H.x) * smoothstep(A.y - 3.0, A.y + 3.0, H.y) * smoothstep(A.w + 3.0, A.w - 3.0, H.y);
    }
    c += spec * fres * gl * (0.6 + 0.4 * kHash(id + 3.1) * on);
  }
  gl_FragColor = vec4(kAir(c, vW), 1.0);
}`;

// ---------------------------------------------------------------- furnishings
// Each is modelled once, standing on the floor at the origin with its front toward -z, and drawn many times with
// deck.put(kind, { p, yaw, scale, color }). Parts painted with tint(1) take the copy's colour. A world can add its own
// with deck.proto(name, (g, pal) => { ... }).
const WOOD = '#7a5c40', WOOD2 = '#5f4630';
const both = (g, a, b, c, d, col, e = 0) => { g.quad(a, b, c, d, col, e); g.quad(d, c, b, a, col, e); };
const legs = (g, hx, hz, h, t, col) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * hx - t, 0, sz * hz - t, sx * hx + t, h, sz * hz + t, col, { skip: 'tb' }); };
const PROTOS = {
  // a plain chair: painted seat and slats, bare legs. The sitter faces -z
  chair(g) {
    g.tint(0.3); legs(g, 0.18, 0.18, 0.44, 0.02, WOOD);
    g.box(-0.2, 0.48, 0.17, -0.16, 0.92, 0.21, WOOD, { skip: 'b' }).box(0.16, 0.48, 0.17, 0.2, 0.92, 0.21, WOOD, { skip: 'b' });
    g.tint(1).box(-0.21, 0.44, -0.21, 0.21, 0.48, 0.21, '#ffffff').box(-0.16, 0.6, 0.18, 0.16, 0.69, 0.2, '#ffffff').box(-0.16, 0.79, 0.18, 0.16, 0.9, 0.2, '#ffffff').tint(0);
  },
  // an easy chair in old cloth
  armchair(g) {
    g.tint(0.2); legs(g, 0.27, 0.27, 0.12, 0.03, WOOD2);
    g.tint(1).box(-0.32, 0.12, -0.3, 0.32, 0.44, 0.32, '#ffffff').box(-0.32, 0.44, 0.16, 0.32, 0.98, 0.34, '#ffffff', { skip: 'b' });
    g.box(-0.4, 0.12, -0.28, -0.3, 0.64, 0.34, '#e6e6e6').box(0.3, 0.12, -0.28, 0.4, 0.64, 0.34, '#e6e6e6').tint(0);
  },
  stool(g) { g.tint(0.3); for (let i = 0; i < 3; i++) { const a = i * TAU / 3; g.box(Math.cos(a) * 0.13 - 0.018, 0, Math.sin(a) * 0.13 - 0.018, Math.cos(a) * 0.13 + 0.018, 0.44, Math.sin(a) * 0.13 + 0.018, WOOD, { skip: 'tb' }); } g.tint(1).cyl(0, 0.44, 0, 0.17, 0.17, 0.04, 8, '#ffffff', { smooth: false, base: true }).tint(0); },
  table(g) { g.tint(0.25); legs(g, 0.36, 0.36, 0.71, 0.025, WOOD2); g.tint(0.6).box(-0.43, 0.71, -0.43, 0.43, 0.75, 0.43, '#c9b79a').tint(0); },
  tableRound(g) { g.tint(0.2).cyl(0, 0, 0, 0.2, 0.05, 0.05, 8, WOOD2, { smooth: false }).cyl(0, 0.05, 0, 0.04, 0.04, 0.67, 6, WOOD2, { cap: false }); g.tint(0.6).cyl(0, 0.72, 0, 0.42, 0.42, 0.035, 12, '#d0c0a4', { smooth: false, base: true }).tint(0); },
  // 2.4 m of long table, and of the bench beside it: stand them end to end
  tableLong(g) { g.tint(0.2); for (const x of [-0.95, 0.95]) g.box(x - 0.04, 0, -0.34, x + 0.04, 0.7, 0.34, WOOD2, { skip: 'tb' }); g.box(-0.95, 0.3, -0.03, 0.95, 0.36, 0.03, WOOD2); g.tint(0.5).box(-1.2, 0.7, -0.42, 1.2, 0.75, 0.42, '#c7b494').tint(0); },
  benchLong(g) { g.tint(0.2); for (const x of [-0.95, 0.95]) g.box(x - 0.03, 0, -0.13, x + 0.03, 0.41, 0.13, WOOD2, { skip: 'tb' }); g.tint(0.5).box(-1.2, 0.41, -0.16, 1.2, 0.45, 0.16, '#b89f7c').tint(0); },
  // a bench with a back, for a street or a terrace
  bench(g) {
    g.tint(0.1); for (const x of [-0.68, 0.68]) g.box(x - 0.03, 0, -0.2, x + 0.03, 0.42, 0.22, '#4a4b4c', { skip: 'b' }).box(x - 0.03, 0.42, 0.16, x + 0.03, 0.86, 0.22, '#4a4b4c', { skip: 'b' });
    g.tint(1); for (let i = 0; i < 3; i++) g.box(-0.78, 0.42, -0.2 + i * 0.13, 0.78, 0.45, -0.1 + i * 0.13, '#ffffff');
    g.box(-0.78, 0.56, 0.17, 0.78, 0.66, 0.2, '#ffffff').box(-0.78, 0.72, 0.17, 0.78, 0.84, 0.2, '#ffffff').tint(0);
  },
  // a slatted crate heaped with something
  crate(g) {
    g.tint(0.15).box(-0.26, 0, -0.19, 0.26, 0.05, 0.19, '#a58a66');
    for (const z of [-0.19, 0.17]) g.box(-0.26, 0.09, z, 0.26, 0.17, z + 0.02, '#b39672').box(-0.26, 0.22, z, 0.26, 0.3, z + 0.02, '#a88a64');
    for (const x of [-0.26, 0.24]) g.box(x, 0.05, -0.19, x + 0.02, 0.3, 0.19, '#9c8060');
    g.tint(1).blob(0, 0.26, 0, [0.22, 0.12, 0.16], 0, '#ffffff', { lump: 0.3, seed: 3, shadeBottom: 0.8 }).tint(0);
  },
  // growing things stand in tubs and troughs: there is no soil in a drum
  tub(g, pal) { g.cyl(0, 0, 0, 0.3, 0.36, 0.46, 8, pal.tub[0], { smooth: false, top: '#4f4338' }); g.tint(1).blob(0, 0.82, 0, [0.5, 0.42, 0.5], 1, '#ffffff', { lump: 0.26, seed: 5, shadeBottom: 0.72 }).tint(0); },
  tubTree(g, pal) { g.cyl(0, 0, 0, 0.38, 0.45, 0.55, 8, pal.tub[1], { smooth: false, top: '#4f4338' }); g.cyl(0, 0.5, 0, 0.055, 0.04, 1.3, 5, '#6b5440'); g.tint(1).blob(0, 2.2, 0, [0.85, 0.75, 0.85], 1, '#ffffff', { lump: 0.24, seed: 9, shadeBottom: 0.72 }).tint(0); },
  pot(g, pal) { g.cyl(0, 0, 0, 0.1, 0.14, 0.2, 6, pal.tub[3], { smooth: false, top: '#4f4338' }); g.tint(1).blob(0, 0.36, 0, [0.2, 0.2, 0.2], 0, '#ffffff', { lump: 0.3, seed: 2, shadeBottom: 0.75 }).tint(0); },
  planter(g, pal) { g.box(-0.8, 0, -0.22, 0.8, 0.42, 0.22, pal.tub[2], { top: '#4f4338' }); g.tint(1); for (let i = 0; i < 3; i++) g.blob(-0.52 + i * 0.52, 0.62, 0, [0.34, 0.28 + 0.06 * (i % 2), 0.3], 0, '#ffffff', { lump: 0.3, seed: i + 1, shadeBottom: 0.72 }); g.tint(0); },
  bush(g) { g.tint(1).blob(0, 0.26, 0, [0.46, 0.34, 0.4], 0, '#ffffff', { lump: 0.32, seed: 7, shadeBottom: 0.7 }).tint(0); },
  // something trailing over an edge: hang it from the lip
  trail(g) { g.tint(1).blob(0, -0.42, -0.07, [0.3, 0.52, 0.11], 0, '#ffffff', { lump: 0.3, seed: 4, shadeBottom: 0.85 }).tint(0); },
  flower(g) { g.tint(1); for (let i = 0; i < 4; i++) g.blob(Math.cos(i * 1.7) * 0.13, 0.08 + 0.03 * (i % 2), Math.sin(i * 1.7) * 0.11, 0.07, 0, '#ffffff', { shadeBottom: 0.9 }); g.tint(0); },
  // a market stall: a table of crates under a cloth
  stall(g) {
    g.tint(0.2); legs(g, 0.95, 0.5, 0.78, 0.03, WOOD2); g.box(-1.05, 0.78, -0.58, 1.05, 0.83, 0.58, '#b9a583');
    for (const [x, z] of [[-1.02, -0.55], [1.02, -0.55], [-1.02, 0.55], [1.02, 0.55]]) g.box(x - 0.02, 0.83, z - 0.02, x + 0.02, z < 0 ? 2.02 : 2.3, z + 0.02, WOOD2, { skip: 'tb' });
    g.tint(1); both(g, [-1.15, 2.0, -0.75], [1.15, 2.0, -0.75], [1.15, 2.32, 0.62], [-1.15, 2.32, 0.62], '#ffffff'); both(g, [-1.15, 1.86, -0.75], [1.15, 1.86, -0.75], [1.15, 2.0, -0.75], [-1.15, 2.0, -0.75], '#e9e9e9');
    g.tint(0);
  },
  // a lamp on a post, and one hung from a ceiling (its top at the origin)
  lampPost(g) { g.cyl(0, 0, 0, 0.11, 0.07, 0.12, 6, '#4a4b4c', { smooth: false }).cyl(0, 0.12, 0, 0.035, 0.03, 2.1, 5, '#4a4b4c', { cap: false }); g.blob(0, 2.34, 0, [0.16, 0.17, 0.16], 1, '#fff0d0', { emit: 3.2, shadeBottom: 1 }); },
  pendant(g) { g.cyl(0, -0.42, 0, 0.012, 0.012, 0.42, 4, '#3a3b3c', { cap: false }); g.tint(0.5).cyl(0, -0.62, 0, 0.24, 0.07, 0.2, 8, '#d8d2c4', { smooth: false, cap: false }); g.tint(0).cyl(0, -0.63, 0, 0.2, 0.2, 0.012, 8, '#fff0d0', { emit: 4, smooth: false, base: true }); },
  // a dish under its lid, and a bowl
  dish(g) { g.cyl(0, 0, 0, 0.17, 0.17, 0.015, 8, '#e9e4d8', { smooth: false }); g.tint(0.3).cyl(0, 0.015, 0, 0.145, 0.06, 0.085, 8, '#a9aaa6').cyl(0, 0.1, 0, 0.022, 0.022, 0.03, 5, '#77756f', { smooth: false }).tint(0); },
  bowl(g) { g.tint(0.6).cyl(0, 0, 0, 0.06, 0.11, 0.075, 8, '#e3ddd0', { top: '#b9a37c' }).tint(0); },
  pan(g) { g.cyl(0, 0, 0, 0.26, 0.28, 0.3, 10, '#8f908c', { top: '#77756f' }); g.tint(0.3).cyl(0, 0.3, 0, 0.27, 0.1, 0.1, 10, '#a9aaa6').cyl(0, 0.4, 0, 0.03, 0.03, 0.04, 5, '#5f5d58', { smooth: false }).tint(0); },
  cart(g) {
    g.tint(1).box(-0.55, 0.38, -0.36, 0.55, 0.46, 0.36, '#ffffff'); for (const z of [-0.36, 0.33]) g.box(-0.55, 0.46, z, 0.55, 0.74, z + 0.03, '#ececec'); g.box(0.52, 0.46, -0.36, 0.55, 0.74, 0.36, '#ececec');
    g.tint(0); for (const z of [-0.4, 0.4]) g.rot('x', Math.PI / 2).cyl(0.18, z - 0.02, -0.2, 0.2, 0.2, 0.04, 10, '#3a3b3c', { base: true }).pop();
    g.box(-0.98, 0.72, -0.3, -0.55, 0.75, -0.27, '#4a4b4c').box(-0.98, 0.72, 0.27, -0.55, 0.75, 0.3, '#4a4b4c').box(-0.6, 0, -0.03, -0.56, 0.38, 0.03, '#4a4b4c');
  },
  ladder(g) {
    g.tint(0.2); for (const x of [-0.24, 0.24]) { g.tube([[x, 0, -0.42], [x * 0.8, 1.75, 0]], 0.022, 4, '#b39a70'); g.tube([[x, 0, 0.5], [x * 0.8, 1.75, 0]], 0.02, 4, '#a58c62'); }
    for (let i = 1; i < 6; i++) { const t = i / 6; g.box(-0.24 + 0.04 * t, 1.75 * t - 0.012, -0.42 * (1 - t) - 0.06, 0.24 - 0.04 * t, 1.75 * t + 0.012, -0.42 * (1 - t) + 0.06, '#c2aa80'); }
    g.tint(0);
  },
  // a cleaning robot: an appliance, low and round
  robot(g) { g.tint(0.5).cyl(0, 0.02, 0, 0.24, 0.22, 0.1, 12, '#d9d4c8', { top: '#c9c3b6' }).tint(0).cyl(0, 0.12, 0, 0.07, 0.06, 0.02, 8, '#3a3b3c').box(-0.03, 0.05, -0.245, 0.03, 0.08, -0.22, '#9fe0b0', { emit: 3 }); },
  // cloth: a banner hanging from the origin, a sheet over a line, a string of flags 3 m long
  banner(g) { g.box(-0.5, -0.03, -0.012, 0.5, 0, 0.012, WOOD2); g.tint(1); both(g, [-0.46, -1.5, 0], [0.46, -1.5, 0], [0.46, -0.02, 0], [-0.46, -0.02, 0], '#ffffff'); g.tri([-0.46, -1.5, 0], [0, -1.78, 0], [0.46, -1.5, 0], '#ffffff'); g.tri([0.46, -1.5, 0], [0, -1.78, 0], [-0.46, -1.5, 0], '#ffffff'); g.tint(0); },
  sheet(g) { g.tint(1); both(g, [-0.7, -0.95, -0.1], [0.7, -0.95, -0.1], [0.7, 0, 0], [-0.7, 0, 0], '#ffffff'); both(g, [-0.7, 0, 0], [0.7, 0, 0], [0.7, -0.8, 0.1], [-0.7, -0.8, 0.1], '#f2f2f2'); g.tint(0); },
  bunting(g) { g.tint(0).box(-1.5, -0.012, -0.006, 1.5, 0, 0.006, '#5a5046'); g.tint(1); for (let i = 0; i < 8; i++) { const x = -1.32 + i * 0.377, sh = i % 2 ? '#ffffff' : '#cfcfcf'; g.tri([x - 0.15, 0, 0], [x, -0.3, 0], [x + 0.15, 0, 0], sh); g.tri([x + 0.15, 0, 0], [x, -0.3, 0], [x - 0.15, 0, 0], sh); } g.tint(0); },
  shelf(g) {
    g.tint(0.25).box(-0.62, 0, -0.16, -0.58, 1.6, 0.16, WOOD).box(0.58, 0, -0.16, 0.62, 1.6, 0.16, WOOD).box(-0.6, 0, 0.14, 0.6, 1.6, 0.16, WOOD2, { skip: 's' });
    for (let k = 0; k < 4; k++) { const y = 0.1 + k * 0.42; g.tint(0.25).box(-0.6, y, -0.16, 0.6, y + 0.03, 0.14, WOOD); g.tint(0.9); for (let i = 0; i < 5; i++) g.box(-0.52 + i * 0.22, y + 0.03, -0.1, -0.36 + i * 0.22, y + 0.2 + 0.1 * ((i * 7 + k * 3) % 3) / 2, 0.08, ['#ffffff', '#d9d9d9', '#f2e6c8', '#c8d6e0', '#e6c8c0'][(i + k * 2) % 5], { skip: 'b' }); }
    g.tint(0);
  },
  counter(g) { g.tint(0.4).box(-1.0, 0, -0.3, 1.0, 0.9, 0.3, '#a58a66', { skip: 'b' }).tint(0.2).box(-1.05, 0.9, -0.34, 1.05, 0.95, 0.34, '#d9ccb2').tint(0); },
  noticeboard(g) { g.tint(0.2).box(-0.66, 0, -0.03, -0.6, 1.9, 0.03, WOOD2).box(0.6, 0, -0.03, 0.66, 1.9, 0.03, WOOD2).box(-0.66, 0.85, -0.02, 0.66, 1.9, 0.02, '#8f7a60').tint(0); },
  // the slow trolley: an open car with benches back to back under a cloth roof. It runs along its own x
  trolley(g) {
    g.tint(0.15).box(-1.75, 0.08, -0.62, 1.75, 0.2, 0.62, '#3f3f40').tint(1).box(-1.75, 0.2, -0.66, 1.75, 0.34, 0.66, '#ffffff', { skip: 'b' });
    for (const x of [-1.72, 1.66]) g.box(x, 0.34, -0.62, x + 0.06, 1.0, 0.62, '#ffffff', { skip: 'b' });
    g.tint(0.3).box(-1.25, 0.34, -0.2, 1.25, 0.76, 0.2, WOOD, { skip: 'b' }).box(-1.25, 0.76, -0.035, 1.25, 1.24, 0.035, WOOD, { skip: 'b' });
    g.box(-1.25, 0.72, -0.44, 1.25, 0.76, -0.2, '#b89f7c').box(-1.25, 0.72, 0.2, 1.25, 0.76, 0.44, '#b89f7c');
    g.tint(0.1); for (const x of [-1.69, 1.69]) for (const z of [-0.6, 0.6]) g.box(x - 0.025, 0.34, z - 0.025, x + 0.025, 2.1, z + 0.025, '#4a4b4c', { skip: 'tb' });
    g.tint(0.7).box(-1.85, 2.1, -0.74, 1.85, 2.16, 0.74, '#efe6d2', { skip: 'b' }).floor(-1.85, -0.74, 1.85, 0.74, 2.1, '#d9cfb8', { down: true, emit: 0.35 });
    for (const z of [-0.74, 0.74]) both(g, [-1.85, 1.96, z], [1.85, 1.96, z], [1.85, 2.1, z], [-1.85, 2.1, z], '#e3d9c2');
    g.tint(0); for (const x of [-1.76, 1.76]) g.cube(x, 0.72, 0, 0.05, 0.16, 0.16, '#fff0c8', { emit: 4 });
    for (const x of [-1.15, 1.15]) for (const z of [-0.5, 0.5]) g.rot('x', Math.PI / 2).cyl(x, z - 0.04, -0.12, 0.13, 0.13, 0.08, 8, '#2f2f30', { base: true }).pop();
  },
};
// kinds that are leaves: they are lit softly, as leaves pass light on
const LEAFY = new Set(['tub', 'tubTree', 'pot', 'planter', 'bush', 'trail', 'flower']);

// ---------------------------------------------------------------- the deck
/**
 * Open a deck to build on. spec:
 *   frame       from makeFrame(a0, z0, deckRadius(n)): the deck whose floor is y = 0 (or give deck, a0, z0)
 *   near        the flight as flat points (path.points(0.5)): fronts are modelled in full within `detail` metres of it
 *               (default 48) and plainly beyond, and nothing that juts out is stood in its way
 *   palette     the place's paint: see PALETTES (default PALETTES.warm)
 *   light       { level (1 = a living room; scales every lamp and window), lamp (colour), ambUp, ambDown, ambPower, haze, hazeDensity }
 *   floor       { slab: [sx, sz] metres (default 0.6), wear 0..1, shine 0..1, rough }
 *   seed        a word: the same seed builds the same place
 *   chunk       metres: geometry is gathered into meshes by squares of this size, so what is out of sight is not drawn (default 240)
 *   clock       'flight': trolleys and other travelling things keep the deck's own clock, set by deck.tick(t) from the
 *               world's update(t), so the camera meets them where the world chooses (see trolley()). Default: the page's clock
 *   detail      metres from the flight within which fronts are modelled in full (default 48)
 * Returns the deck: { frame, rig, group, pal, level, lit, litDouble, prop, walk, drift, plain, ... } and the calls
 * documented on each below.
 */
export function makeDeck(ctx, spec = {}) {
  const frame = spec.frame || makeFrame(spec.a0 || 0, spec.z0 === undefined ? DRUM.L / 2 : spec.z0, deckRadius(spec.deck || 201));
  const pal = { ...PALETTES.warm, ...(spec.palette || {}) };
  const lt = spec.light || {}, level = lt.level === undefined ? 1 : lt.level, fl = spec.floor || {};
  if (lt.lamp) pal.lamp = lt.lamp;
  const rig = lampRig({
    ambUp: lt.ambUp || '#5b4e42', ambDown: lt.ambDown || '#40372f', ambPower: (lt.ambPower === undefined ? 0.75 : lt.ambPower) * level,
    haze: lt.haze || '#14110e', hazeDensity: lt.hazeDensity || 0, maxLattices: 8, maxZones: 6,
  });
  const bendU = () => ({ value: new Vector3(frame.a0, frame.z0, frame.floorR) });
  const sky = { A: [], B: [], C: [] };
  for (let i = 0; i < 2; i++) { sky.A.push(new Vector4(0, 0, 0, 0)); sky.B.push(new Vector4(0, 0, 0, 0)); sky.C.push(new Vector4(0, 0, 0, 0)); }
  const floorMat = new ShaderMaterial({
    uniforms: {
      ...rig.uniforms, uClip: G.uClip, uBend: bendU(), uSlab: { value: new Vector2(fl.slab ? fl.slab[0] : 0.6, fl.slab ? fl.slab[1] : 0.6) },
      uWear: { value: fl.wear === undefined ? 0.8 : fl.wear }, uShine: { value: fl.shine === undefined ? 1 : fl.shine }, uRough: { value: fl.rough === undefined ? 0.035 : fl.rough },
      uLampGlow: { value: (fl.lampGlow === undefined ? 2.2 : fl.lampGlow) }, uSkyA: { value: sky.A }, uSkyB: { value: sky.B }, uSkyC: { value: sky.C },
    },
    defines: { LATTICES: rig.lattices }, vertexShader: FLOOR_VERT, fragmentShader: floorFrag(rig), side: FrontSide,
  });
  const signMat = new ShaderMaterial({ uniforms: { ...rig.uniforms, uClip: G.uClip, uBend: bendU(), tAtlas: { value: null } }, vertexShader: SIGN_VERT, fragmentShader: signFrag(rig), side: FrontSide });
  // the flight, close-set, for keeping its way clear
  const coarse = (spec.near || []).filter((_, i) => i % 2 === 0), dense = [];
  const src = spec.near || [];
  for (let i = 0; i < src.length - 1; i++) { const a = src[i], b = src[i + 1], n = Math.max(1, Math.ceil(a.distanceTo(b) / 0.6)); for (let k = 0; k < n; k++) dense.push(a.clone().lerp(b, k / n)); }
  if (src.length) dense.push(src[src.length - 1].clone());
  const CH = spec.chunk || 240;
  let nLat = 0, nZone = 0, nSky = 0;
  // things that travel (trolleys, their riders and lamps, robots) keep the page's own clock, so where they are when the
  // camera comes by is chance. With clock: 'flight' they keep a clock of the deck's own, which stands at 0 until the
  // world sets it with deck.tick(t) from its update(): then a trolley is where the flight wants it at each second
  const clock = spec.clock === 'flight' ? { value: 0 } : G.uTime;
  const timed = (m) => { m.uniforms.uTime = clock; return m; };
  // ask for the page's type now, so that it has arrived by the time the signs are lettered
  if (typeof document !== 'undefined' && document.fonts && document.fonts.load) for (const f in FONTS) { try { document.fonts.load(FONTS[f](40)).catch(() => { }); } catch (err) { /* lettering falls back to the system's type */ } }

  const D = {
    ctx, frame, rig, group: new Group(), pal, level, glowK: 0.45 + 0.55 * level, rng: makeRng(spec.seed || 'deck'), seed: spec.seed || 'deck',
    density: ctx && ctx.density ? ctx.density : 1, detail: spec.detail || 48,
    /** the kit's materials, bent to this deck: lit (soft on leaves), litDouble (cloth), prop (furniture), walk (people), drift (things that travel), glassMat, plain (unbent) */
    lit: litMaterial(rig, { bend: frame }), litDouble: litMaterial(rig, { bend: frame, side: 'double', soft: 0.35 }),
    prop: litMaterial(rig, { bend: frame, soft: 0.15 }), walk: litMaterial(rig, { bend: frame, walk: true, soft: 0.5 }),
    drift: litMaterial(rig, { bend: frame, drift: true, soft: 0.5, stride: 0.035 }), driftProp: timed(litMaterial(rig, { bend: frame, drift: true, soft: 0.15 })),
    ride: timed(litMaterial(rig, { bend: frame, drift: true, soft: 0.5 })), pace: timed(litMaterial(rig, { bend: frame, drift: true, soft: 0.5, stride: 0.04 })), clock,
    /** with clock: 'flight', set the deck's clock to the flight's seconds: call it from the world's update(t) */
    tick(t) { if (clock !== G.uTime) clock.value = t; },
    glassMat: litMaterial(rig, { bend: frame, transparent: true, opacity: 0.16, side: 'double' }), plain: litMaterial(rig, {}),
    floorMat, signMat,
    chunks: new Map(), items: new Map(), protos: new Map(), spots: [], walkers: [], pacers: [], riders: [], glows: [], rideGlows: [], signs: [],
    clk: { t: performance.now(), due() { return performance.now() - this.t > 4; }, go() { this.t = performance.now(); } },

    /** the geometry being gathered for the square of deck round (x, z): { g: solid, c: cloth (seen from both sides), f: floors, gl: glass }, each a Geo */
    bucket(x, z, part = '') {
      const k = Math.floor((x + CH / 2) / CH) + '_' + Math.floor((z + CH / 2) / CH) + part;
      let b = D.chunks.get(k);
      if (!b) D.chunks.set(k, b = { g: new Geo({ maxSeg: 8 }), c: new Geo({ maxSeg: 8 }), f: new Geo({ maxSeg: 8 }), gl: new Geo({ maxSeg: 8 }) });
      return b;
    },
    /** the same, turned to draw in a run's own co-ordinates (u, y, v). Call done() when finished */
    pen(run, u = 0, part = '') {
      const p = run.pt(u, 0, 0), b = D.bucket(p[0], p[2], part), all = [b.g, b.c, b.f, b.gl];
      for (const q of all) q.at(run.ox, run.oy, run.oz, run.yaw);
      return { g: b.g, c: b.c, f: b.f, gl: b.gl, done() { for (const q of all) q.pop(); } };
    },
    /** how far a flat point is from the flight (a deck up or down counts for more), and whether that is near enough to model in full */
    dist(x, y, z) { if (!coarse.length) return 0; let best = 1e18; for (const p of coarse) { const dx = p.x - x, dy = (p.y - y) * 1.6, dz = p.z - z, d = dx * dx + dy * dy + dz * dz; if (d < best) best = d; } return Math.sqrt(best); },
    fine(x, y, z, k = 1) { return D.dist(x, y, z) < D.detail * k; },
    /** true if nothing of the flight passes within r metres of the point: ask before standing anything where the camera might go */
    clear(x, y, z, r = 1.3) { const r2 = r * r; for (const p of dense) { const dx = p.x - x, dy = p.y - y, dz = p.z - z; if (dx * dx + dy * dy + dz * dz < r2) return false; } return true; },
    /** the same for a whole line along a run: true if the flight keeps r metres clear of the line v across it, at head height, between u0 and u1 */
    clearLane(run, u0, u1, v, r = 1.15) { for (const p of dense) { const q = run.inv(p.x, p.z), dy = p.y - run.oy - 1.2; if (q[0] > u0 - r && q[0] < u1 + r && Math.abs(q[1] - v) < r && Math.abs(dy) < r + 0.6) return false; } return true; },

    /** stand a furnishing: kind is one of the PROTOS (chair, table, bench, tub, stall, crate, banner, ...) or one given to proto(). item: { p:[x,y,z], yaw, scale, color } */
    put(kind, item) { let a = D.items.get(kind); if (!a) D.items.set(kind, a = []); a.push(item); return item; },
    /** a furnishing of the world's own: fn(g, pal) draws it at the origin, front toward -z. opts.leafy for plants */
    proto(name, fn, opts = {}) { D.protos.set(name, { fn, leafy: !!opts.leafy, geo: null }); },
    /**
     * Lettering. text is a string or a list of lines. o: at [x,y,z] (the centre), and which way it faces: n [nx, nz], or
     * run (a Run: it faces out of the run; with side: 1 or -1 it faces along it instead), or up: yaw (flat on a floor, its
     * top toward that heading). w, h in metres (w defaults from the words). style 'board' | 'plate' | 'chalk' | 'paper' |
     * 'glow' | 'card'; font 'serif' | 'italic' | 'sans' | 'cond' | 'hand'; ground, ink (colours); glow (its own light,
     * 0..3); upper, track (letter spacing as a share of height); head (the first of several lines is a heading); font2 (the other lines' font).
     */
    sign(text, o = {}) {
      const lines = Array.isArray(text) ? text.slice() : [String(text)];
      const style = o.style || 'board', font = o.font || (style === 'chalk' ? 'hand' : style === 'plate' || style === 'paper' ? 'cond' : 'serif');
      const h = o.h || 0.4, longest = lines.reduce((a, b) => Math.max(a, b.length), 1);
      const w = Math.min(o.maxW || 1e9, o.w || Math.max(h, (h / lines.length) * 0.8 * WIDE[font] * (longest + 2.5) * (o.track ? 1 + o.track : 1)));
      let r, top, n;
      if (o.up !== undefined) { top = [Math.sin(o.up), 0, Math.cos(o.up)]; r = [-top[2], 0, top[0]]; n = [0, 1, 0]; }
      else {
        let nx, nz;
        if (o.run) { const d = o.side ? o.run.dir(o.side, 0) : o.run.dir(0, -1); nx = d[0]; nz = d[1]; } else { nx = o.n ? o.n[0] : 0; nz = o.n ? o.n[1] : -1; }
        const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
        n = [nx, 0, nz]; r = [nz, 0, -nx]; top = [0, 1, 0];
      }
      const def = style === 'plate' ? ['#e9e2cf', '#27394a'] : style === 'chalk' ? ['#2c3330', '#e9e6da'] : style === 'paper' || style === 'card' ? ['#efe6cf', '#2f2a26'] : style === 'glow' ? ['#1c1a18', '#ffd9a0'] : D.pal.signs[0];
      const s = { lines, style, font, font2: o.font2, ground: o.ground || def[0], ink: o.ink || def[1], upper: o.upper === undefined ? (font === 'cond') : o.upper, track: o.track === undefined ? (font === 'cond' ? 0.08 : font === 'serif' ? 0.04 : 0) : o.track, head: o.head === undefined ? lines.length > 1 : o.head, C: o.at, r, top, n, w, h, glow: o.glow || 0 };
      D.signs.push(s);
      if (o.both) D.signs.push({ ...s, C: [o.at[0] - n[0] * (o.both === true ? 0.05 : o.both), o.at[1], o.at[2] - n[2] * (o.both === true ? 0.05 : o.both)], r: [-r[0], 0, -r[2]], n: [-n[0], 0, -n[2]] });
      return s;
    },
    /** people, as kit/folk.js's crowd() takes them: [{ p, walk (metres of stroll; 0 stands), yaw, sit, child, color }] */
    people(spots) { for (const s of spots) D.spots.push(s); },
    /** a knot of n people standing talking round (x, y, z) */
    knot(x, y, z, n, rng = D.rng) { const a0 = rng() * TAU, r = 0.42 + 0.12 * n; for (let i = 0; i < n; i++) { const a = a0 + (i / n) * TAU + rng.f(-0.25, 0.25), px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (D.clear(px, y + 1.2, pz, 1.1)) D.spots.push({ p: [px, y, pz], yaw: Math.atan2(x - px, z - pz), child: rng() < 0.12 }); } },
    /**
     * People walking a straight line and coming round again: { from:[x,y,z], to:[x,y,z], speed (m/s, default 1.3), n, spread (metres to either side),
     * child (share who are children, default 0.1), phase }. Their ends should be out of sight: they fade in and out there.
     * On a deck with clock: 'flight', start (metres along the line from `from`) puts them there as the flight begins, a
     * few steps apart, and they keep the deck's clock: children who run past the camera at a second of the world's choosing.
     */
    walkersAlong(o) {
      const rng = o.rng || D.rng, a = o.from, b = o.to, len = Math.hypot(b[0] - a[0], b[2] - a[2]), ux = (b[0] - a[0]) / len, uz = (b[2] - a[2]) / len;
      for (let i = 0; i < (o.n || 4); i++) {
        const timed = o.start !== undefined, sp = (o.speed || 1.3) * (timed ? rng.f(0.94, 1.06) : rng.f(0.85, 1.15)), off = rng.f(-1, 1) * (o.spread || 0);
        const phase = timed ? (((o.start + rng.f(-1.6, 1.6)) / len) % 1 + 1) % 1 : o.phase === undefined ? rng() : (o.phase + i * 0.013) % 1;
        (timed ? D.pacers : D.walkers).push({ p: [a[0] - uz * off, a[1], a[2] + ux * off], yaw: Math.atan2(ux, uz), drift: [ux * sp, 0, uz * sp, len / sp], phase, color: pick(rng, CLOTH), child: rng() < (o.child === undefined ? 0.1 : o.child), skin: pick(rng, SKIN), scale: rng.f(0.93, 1.07) });
      }
    },
    /** small lights (kit/mats.js glowPoints): [{ p, color, power, size, move, loop, twinkle }] */
    glow(points) { for (const p of points) D.glows.push(p); },
    /** a grid of ceiling lamps that light what is under them (lampRig lattice; power is scaled by the deck's light.level). Up to eight on a deck */
    lattice(l) { if (nLat >= rig.lattices) { console.warn('[deck] no room for another lamp lattice'); return -1; } rig.setLattice(nLat, { color: pal.lamp, ...l, power: (l.power === undefined ? 1 : l.power) * level }); return nLat++; },
    /** a box of light from above (lampRig zone): a court, a bright wall. Up to six on a deck */
    zone(z) { if (nZone >= rig.zones) { console.warn('[deck] no room for another zone of light'); return -1; } rig.setZone(nZone, z); return nZone++; },
    /** a lit ceiling for polished floors below to hold: { x0, z0, x1, z1, y (its height), floor (the lowest floor that shows it), color, power } */
    sky(s) { if (nSky >= 2) return; const c = vec3col(s.color || '#ffffff', s.power === undefined ? 1 : s.power); sky.A[nSky].set(s.x0, s.z0, s.x1, s.z1); sky.B[nSky].set(s.y, s.floor === undefined ? -1e4 : s.floor, 0, 1); sky.C[nSky].set(c.x, c.y, c.z, 1); nSky++; },
  };
  for (const k in PROTOS) D.protos.set(k, { fn: PROTOS[k], leafy: LEAFY.has(k), geo: null });
  return D;
}

/**
 * Turn everything drawn on the deck into meshes and add them to deck.group: `yield* finish(deck)`, once, last.
 * Solid geometry becomes one mesh per material per chunk; furnishings one instanced mesh per kind; people, lights and
 * signs one each (people, by skin and pose).
 */
export function* finish(D) {
  const { frame, group, clk } = D;
  clk.go();
  for (const b of D.chunks.values()) {
    for (const [geo, mat, order] of [[b.g, D.lit, 0], [b.f, D.floorMat, -1], [b.c, D.litDouble, 0], [b.gl, D.glassMat, 4]]) {
      if (!geo.tris) continue;
      const m = geo.mesh(mat, frame); m.renderOrder = order; group.add(m);
      yield 'deck: meshes';
    }
  }
  // furnishings
  for (const [kind, items] of D.items) {
    const pr = D.protos.get(kind);
    if (!pr || !items.length) continue;
    if (!pr.geo) { const g = new Geo(); pr.fn(g, D.pal); pr.geo = g.build(); }
    const drift = items[0].drift !== undefined;
    for (const m of instances(pr.geo, drift ? D.driftProp : pr.leafy ? D.lit : D.prop, items, { frame, cell: 300, drift })) group.add(m);
    if (clk.due()) { yield 'deck: furnishings'; clk.go(); }
  }
  yield 'deck: furnishings';
  // people: those who stand, sit and stroll; those who walk a line; those who ride
  if (D.spots.length) for (const m of crowd(D.spots, D.walk, { frame, bob: 0.045, speed: 0.75, cell: 300, seed: D.seed + 'folk' })) group.add(m);
  yield 'deck: people';
  for (const [list, mat] of [[D.walkers, D.drift], [D.pacers, D.pace], [D.riders, D.ride]]) {
    const lines = new Map();
    for (const w of list) { const k = w.skin + '|' + (w.pose || (w.child ? 'child' : 'stand')); let a = lines.get(k); if (!a) lines.set(k, a = { skin: w.skin, pose: w.pose || (w.child ? 'child' : 'stand'), items: [] }); a.items.push(w); }
    for (const l of lines.values()) for (const m of instances(figureGeo(l.skin, l.pose), mat, l.items, { frame, cell: 4000, drift: true })) group.add(m);
  }
  yield 'deck: walkers';
  if (D.glows.length) group.add(glowPoints(D.glows, { bend: frame, minPx: 1.4, maxPx: 150, soft: 1.9 }));
  if (D.rideGlows.length) { const m = glowPoints(D.rideGlows, { bend: frame, minPx: 1.4, maxPx: 150, soft: 1.9 }); m.material.uniforms.uTime = D.clock; group.add(m); }
  yield 'deck: lights';
  yield* buildSigns(D);
  return D;
}

function* buildSigns(D) {
  const list = D.signs;
  if (!list.length || typeof document === 'undefined') return;
  const cap = D.ctx && D.ctx.renderer ? D.ctx.renderer.capabilities : null;
  const maxTex = Math.min(4096, cap ? cap.maxTextureSize : 2048), W = 2048;
  const entries = new Map();
  for (const s of list) {
    const d = D.dist(s.C[0], s.C[1], s.C[2]);
    const ppm = d < 12 ? 300 : d < 30 ? 190 : d < 70 ? 100 : 52;
    let ph = Math.round(Math.min(360, Math.max(16, s.h * ppm))), pw = Math.round(ph * s.w / s.h);
    if (pw > 1000) { ph = Math.round(ph * 1000 / pw); pw = 1000; }
    const key = [s.lines.join('|'), s.style, s.font, s.font2 || '', s.ground, s.ink, s.upper ? 1 : 0, s.track, s.head ? 1 : 0, (s.w / s.h).toFixed(2)].join('~');
    let e = entries.get(key);
    if (!e) entries.set(key, e = { key, lines: s.lines, style: s.style, font: s.font, font2: s.font2, ground: s.ground, ink: s.ink, upper: s.upper, track: s.track, head: s.head, pw, ph });
    else if (ph > e.ph) { e.ph = ph; e.pw = pw; }
    s.e = e;
  }
  const all = [...entries.values()].sort((a, b) => b.ph - a.ph);
  // shelves, tallest first. The canvas is 2048 square if the lettering fits at seven-tenths of its size or better, else twice as tall
  let scale = 1, used = 0, limit = Math.min(maxTex, 2048);
  for (let tries = 0; tries < 10; tries++) {
    let x = 2, y = 2, row = 0;
    for (const e of all) { const w = Math.max(8, Math.round(e.pw * scale)), h = Math.max(8, Math.round(e.ph * scale)); if (x + w + 2 > W) { x = 2; y += row + 3; row = 0; } e.x = x; e.y = y; e.w = w; e.h = h; x += w + 3; row = Math.max(row, h); }
    used = y + row + 2;
    if (used <= limit) break;
    const next = scale * Math.sqrt(limit / used) * 0.97;
    if (next < 0.7 && limit < maxTex) { limit = maxTex; scale = 1; } else scale = next;
  }
  const H = Math.min(maxTex, Math.pow(2, Math.ceil(Math.log2(Math.max(64, used)))));
  yield 'deck: signs laid out';
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const fams = [...new Set(all.flatMap((e) => [e.font, e.font2 || e.font]))];
  const tex = new CanvasTexture(cv);
  tex.colorSpace = SRGBColorSpace; tex.flipY = false; tex.wrapS = tex.wrapT = ClampToEdgeWrapping;
  tex.minFilter = LinearMipmapLinearFilter; tex.magFilter = LinearFilter; tex.generateMipmaps = true;
  tex.anisotropy = cap ? Math.min(8, cap.getMaxAnisotropy()) : 4;
  function* paint() {
    cx.fillStyle = '#20201e'; cx.fillRect(0, 0, W, H);
    for (const e of all) { drawSign(cx, { ...e, pw: e.w, ph: e.h }, e.x, e.y); if (D.clk.due()) { yield 'deck: lettering'; D.clk.go(); } }
    tex.needsUpdate = true;
  }
  yield* paint();
  yield 'deck: lettering';
  // The page's own type may not have arrived yet: letter the signs again when it has, a few milliseconds a frame.
  // (Whether a face has arrived is read from the faces themselves. document.fonts.check() is not used: given these
  // long lists of stand-in families it can hold the page for a second or two while the system's fonts are looked up.)
  if (document.fonts && document.fonts.forEach) {
    const want = new Set(fams.map((f) => (/'([^']+)'/.exec(FONTS[f](40)) || [])[1]).filter(Boolean));
    const waiting = [];
    document.fonts.forEach((face) => { if (want.has(String(face.family).replace(/['"]/g, '')) && face.status !== 'loaded') waiting.push(face.status === 'unloaded' ? face.load() : face.loaded); });
    if (waiting.length) {
      const again = () => {
        if (tex.userData.gone) return;
        const it = paint();
        const slice = () => { if (tex.userData.gone) return; D.clk.go(); if (!it.next().done) requestAnimationFrame(slice); };
        slice();
      };
      Promise.all(waiting).then(again, () => { /* keep the stand-in lettering */ });
    }
  }
  tex.addEventListener('dispose', () => { tex.userData.gone = true; });
  D.signMat.uniforms.tAtlas.value = tex;
  const pos = [], nrm = [], uv = [], glow = [];
  for (const s of list) {
    const e = s.e, hw = s.w / 2, hh = s.h / 2, C = s.C, r = s.r, t = s.top;
    const P = (a, b) => [C[0] + r[0] * a * hw + t[0] * b * hh, C[1] + r[1] * a * hw + t[1] * b * hh, C[2] + r[2] * a * hw + t[2] * b * hh];
    const u0 = (e.x + 0.5) / W, u1 = (e.x + e.w - 0.5) / W, v0 = (e.y + 0.5) / H, v1 = (e.y + e.h - 0.5) / H;
    const q = [[P(-1, -1), u0, v1], [P(1, -1), u1, v1], [P(1, 1), u1, v0], [P(-1, 1), u0, v0]];
    for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(q[i][0][0], q[i][0][1], q[i][0][2]); nrm.push(s.n[0], s.n[1], s.n[2]); uv.push(q[i][1], q[i][2]); glow.push(s.glow); }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setAttribute('aGlow', new Float32BufferAttribute(glow, 1));
  const mesh = fitBounds(new Mesh(g, D.signMat), D.frame);
  mesh.renderOrder = 1;
  D.group.add(mesh);
  D.signTexture = tex;
  yield 'deck: signs';
}

// ---------------------------------------------------------------- fronts
// Everything in this part is drawn in a run's own co-ordinates: u along the row, y up, v into the building, the street
// at v < 0. P is a pen (deck.pen(run)): P.g solid, P.c cloth, P.gl glass.
const wallN = (g, u0, u1, y0, y1, v, col, e = 0) => g.quad([u1, y0, v], [u0, y0, v], [u0, y1, v], [u1, y1, v], col, e);

// Things for sale, set out behind a window or on a counter between ua and ub, on a shelf at height y, from va back to vb.
const GOODS = {
  bread(D, P, run, ua, ub, y, va, vb, rng, s) {
    const g = P.g; g.box(ua, y, va + 0.3, ub, y + 0.16, vb, '#cdbb98', { skip: 'b' });
    for (let x = ua + 0.2; x < ub - 0.12; x += 0.36) {
      g.blob(x, y + 0.08, va + 0.17, [0.15, 0.08, 0.085], 0, mixc('#cf9a55', '#8f5f30', rng()), { seed: x, shadeBottom: 0.75 });
      if (rng() < 0.8) g.blob(x + 0.05, y + 0.25, va + 0.5, [0.12, 0.1, 0.12], 0, mixc('#d8a862', '#a06a34', rng()), { seed: x + 2, shadeBottom: 0.75 });
    }
  },
  greens(D, P, run, ua, ub, y, va, vb, rng, s) {
    const g = P.g, cols = ['#6f9a50', '#86a85a', '#4f8048', '#9ab860', '#c8503a', '#d98a3a', '#7fa066', '#b9c46a'];
    for (let x = ua + 0.3; x < ub - 0.25; x += 0.6) {
      g.box(x - 0.26, y, va + 0.06, x + 0.26, y + 0.1, va + 0.5, '#a88c66', { skip: 'b' });
      g.blob(x, y + 0.13, va + 0.28, [0.23, 0.1, 0.19], 0, shade(pick(rng, cols), 0.75 + 0.35 * s), { lump: 0.3, seed: x, shadeBottom: 0.8 });
    }
  },
  cloth(D, P, run, ua, ub, y, va, vb, rng, s) {
    const g = P.g;
    for (let x = ua + 0.12, k = 0; x < ub - 0.5; x += 0.56, k++) for (let j = 0; j < 3 - (k % 2); j++) g.box(x, y + j * 0.13, va + 0.08, x + 0.5, y + j * 0.13 + 0.12, va + 0.36, hue(rng(), 0.45 * s, 0.34 + 0.25 * rng()), { skip: 'b' });
    for (let x = ua + 0.3; x < ub - 0.2; x += 0.5) both(P.g, [x - 0.2, y + 0.25, vb - 0.1], [x + 0.2, y + 0.25, vb - 0.1], [x + 0.2, y + 1.45, vb - 0.1], [x - 0.2, y + 1.45, vb - 0.1], hue(rng(), 0.5 * s, 0.3 + 0.3 * rng()));
  },
  pots(D, P, run, ua, ub, y, va, vb, rng) {
    const g = P.g;
    for (let x = ua + 0.2; x < ub - 0.15; x += 0.36) { const r = 0.09 + 0.05 * rng(), h = 0.1 + 0.1 * rng(), c = pick(rng, ['#8f908c', '#6f706c', '#a9744a', '#3f3f40', '#b9b6aa']); g.cyl(x, y, va + 0.24, r, r * 1.06, h, 8, c, { top: shade(c, 0.6) }); g.cyl(x, y + h, va + 0.24, r * 1.08, r * 0.35, 0.05, 8, shade(c, 1.15)); }
    for (let i = 0; i < 5; i++) g.cyl(ub - 0.3, y + i * 0.022, va + 0.55, 0.13, 0.13, 0.018, 8, i % 2 ? '#a9aaa6' : '#8f908c', { smooth: false });
  },
  books(D, P, run, ua, ub, y, va, vb, rng, s) {
    const g = P.g; let x = ua + 0.12;
    while (x < ub - 0.15) { const w = 0.035 + 0.03 * rng(), h = 0.19 + 0.08 * rng(); if (rng() < 0.12) { x += 0.12; continue; } g.box(x, y, va + 0.1, x + w, y + h, va + 0.27, hue(rng(), 0.4 * s, 0.25 + 0.3 * rng()), { skip: 'b' }); x += w + 0.006; }
    for (let i = 0; i < 4; i++) g.box(ua + 0.2, y + i * 0.04, va + 0.42, ua + 0.45, y + i * 0.04 + 0.035, va + 0.6, hue(rng(), 0.35 * s, 0.4), { skip: 'b' });
  },
  lamps(D, P, run, ua, ub, y, va, vb, rng) {
    const g = P.g;
    for (let x = ua + 0.3; x < ub - 0.2; x += 0.62) {
      const h = 0.3 + 0.5 * rng(), c = pick(rng, D.pal.window);
      g.cyl(x, y, va + 0.3, 0.07, 0.05, 0.03, 6, '#4a4b4c', { smooth: false }).cyl(x, y + 0.03, va + 0.3, 0.012, 0.012, h, 4, '#6d6c68', { cap: false });
      g.cyl(x, y + h, va + 0.3, 0.14, 0.07, 0.17, 8, c, { emit: 1.6 * D.glowK, cap: false, smooth: false });
      const p = run.pt(x, y + h + 0.06, va + 0.3); D.glows.push({ p, color: c, power: 1.5 * D.glowK, size: 0.55 });
    }
  },
  toys(D, P, run, ua, ub, y, va, vb, rng, s) {
    const g = P.g;
    for (let x = ua + 0.25; x < ub - 0.15; x += 0.42) {
      const k = Math.floor(rng() * 3), c = hue(rng(), 0.6 * s, 0.5);
      if (k === 0) g.cube(x, y + 0.08, va + 0.25, 0.16, 0.16, 0.16, c).cube(x + 0.03, y + 0.22, va + 0.25, 0.11, 0.11, 0.11, hue(rng(), 0.6 * s, 0.5));
      else if (k === 1) g.blob(x, y + 0.11, va + 0.25, 0.11, 0, c, { shadeBottom: 0.8 });
      else g.cyl(x, y, va + 0.25, 0.1, 0.0, 0.24, 6, c, { smooth: false });
    }
  },
  shoes(D, P, run, ua, ub, y, va, vb, rng) {
    const g = P.g; g.box(ua, y, va + 0.34, ub, y + 0.2, vb, '#b9a888', { skip: 'b' });
    for (let x = ua + 0.2; x < ub - 0.2; x += 0.44) for (const [yy, vv] of [[y, va + 0.1], [y + 0.2, va + 0.42]]) { const c = pick(rng, ['#3a2a22', '#5a3a2a', '#2f2f30', '#7e3f33', '#8a6a4a']); g.box(x, yy, vv, x + 0.09, yy + 0.07, vv + 0.24, c, { skip: 'b' }).box(x + 0.12, yy, vv + 0.02, x + 0.21, yy + 0.07, vv + 0.26, c, { skip: 'b' }); }
  },
  flutes(D, P, run, ua, ub, y, va, vb, rng) {
    const g = P.g; g.box(ua + 0.1, y + 1.12, vb - 0.16, ub - 0.1, y + 1.16, vb - 0.1, '#5f4630');
    for (let x = ua + 0.25; x < ub - 0.2; x += 0.2) g.tube([[x, y, vb - 0.42], [x + 0.02, y + 1.2, vb - 0.14]], 0.02, 5, pick(rng, ['#d9d6ca', '#c9aa6a', '#a9a8a0', '#e3d9b0']), { emit: 0.25 });
  },
  jars(D, P, run, ua, ub, y, va, vb, rng, s) {
    const g = P.g; g.box(ua, y, va + 0.3, ub, y + 0.17, vb, '#cdbb98', { skip: 'b' });
    for (let x = ua + 0.14; x < ub - 0.08; x += 0.19) for (const [yy, vv] of [[y, va + 0.15], [y + 0.17, va + 0.42]]) { if (rng() < 0.15) continue; g.cyl(x, yy, vv, 0.055, 0.055, 0.13, 6, hue(pick(rng, [0.0, 0.05, 0.1, 0.13, 0.3, 0.92]), 0.65 * s, 0.36), { emit: 0.25, smooth: false, top: '#c9c3b0' }); }
  },
  tea(D, P, run, ua, ub, y, va, vb, rng, s) {
    const g = P.g;
    for (let x = ua + 0.2; x < ub - 0.4; x += 0.3) g.cyl(x, y, va + 0.2 + 0.2 * (Math.round(x * 3) % 2), 0.075, 0.075, 0.17 + 0.06 * rng(), 8, hue(0.2 + 0.4 * rng(), 0.4 * s, 0.33), { smooth: false, top: '#b9a070' });
    g.blob(ub - 0.3, y + 0.1, va + 0.3, [0.13, 0.1, 0.13], 1, '#7e3f33', { shadeBottom: 0.8 }).cyl(ub - 0.3, y + 0.19, va + 0.3, 0.05, 0.03, 0.03, 6, '#5f2f26');
  },
  noodles(D, P, run, ua, ub, y, va, vb, rng) {
    const g = P.g; g.box(ua + 0.05, y + 1.05, va + 0.28, ub - 0.05, y + 1.08, va + 0.31, '#5f4630');
    for (let x = ua + 0.16; x < ub - 0.1; x += 0.17) { const h = 0.45 + 0.25 * rng(); both(g, [x - 0.06, y + 1.05 - h, va + 0.295], [x + 0.06, y + 1.05 - h, va + 0.295], [x + 0.06, y + 1.05, va + 0.295], [x - 0.06, y + 1.05, va + 0.295], mixc('#eadfb6', '#d9c48a', rng())); }
    for (let x = ua + 0.25; x < ub - 0.2; x += 0.5) g.cyl(x, y, va + 0.14, 0.07, 0.12, 0.08, 8, '#e3ddd0', { top: '#d9c48a' });
  },
  bottles(D, P, run, ua, ub, y, va, vb, rng, s) {
    const g = P.g; g.box(ua, y, va + 0.26, ub, y + 0.2, vb, '#5a4636', { skip: 'b' });
    for (let x = ua + 0.12; x < ub - 0.06; x += 0.15) for (const [yy, vv] of [[y, va + 0.13], [y + 0.2, va + 0.38]]) { if (rng() < 0.1) continue; const c = pick(rng, ['#4f7a5a', '#7a5a2a', '#9fb8b0', '#3f5a4a', '#b08d4a']); g.cyl(x, yy, vv, 0.04, 0.04, 0.19, 6, c, { emit: 0.3, smooth: false, cap: false }).cyl(x, yy + 0.19, vv, 0.04, 0.014, 0.05, 6, c, { emit: 0.3, cap: false }).cyl(x, yy + 0.24, vv, 0.014, 0.014, 0.06, 5, c, { emit: 0.2 }); }
  },
  paper(D, P, run, ua, ub, y, va, vb, rng, s) {
    const g = P.g;
    for (let x = ua + 0.14; x < ub - 0.3; x += 0.4) g.box(x, y, va + 0.1, x + 0.3, y + 0.04 + 0.1 * rng(), va + 0.32, pick(rng, ['#efe6cf', '#e3d9bf', '#d9d2c4', '#e9dcc0', '#cfd6d6']), { skip: 'b' });
    for (let x = ua + 0.3; x < ub - 0.2; x += 0.34) wallN(g, x - 0.1, x + 0.1, y + 0.05, y + 0.33, va + 0.52, hue(rng(), 0.3 * s, 0.72));
  },
  // children's pictures stuck to the inside of the glass
  drawings(D, P, run, ua, ub, y, va, vb, rng, s) {
    for (let x = ua + 0.3; x < ub - 0.25; x += 0.42 + 0.2 * rng()) { const yy = y + 0.25 + 0.75 * rng(), w = 0.15 + 0.05 * rng(), h = 0.11 + 0.05 * rng(); wallN(P.g, x - w, x + w, yy - h, yy + h, va + 0.012, hue(rng(), 0.55 * s, 0.7), 0.35); }
  },
  none() { },
};

// a door leaf in its opening: shut at depth v, or standing open into the room
function doorLeaf(g, d0, d1, top, v, col, o = {}) {
  if (o.open) { g.box(d0 + 0.02, 0.02, v, d0 + 0.07, top, v + (d1 - d0) - 0.08, col, { skip: 'b' }); return; }
  g.box(d0 + 0.03, 0.02, v, d1 - 0.03, top, v + 0.05, col, { skip: 'b' });
  if (o.glazed) wallN(g, d0 + 0.17, d1 - 0.17, 1.05, top - 0.15, v - 0.006, o.light || '#ffd9a0', o.e || 0.6);
  else { const c2 = shade(col, 1.14); g.box(d0 + 0.15, 0.2, v - 0.016, d1 - 0.15, 0.95, v, c2, { skip: 's' }).box(d0 + 0.15, 1.08, v - 0.016, d1 - 0.15, top - 0.17, v, c2, { skip: 's' }); }
  g.box(d1 - 0.14, 0.98, v - 0.05, d1 - 0.1, 1.1, v, o.brass || '#b08d4a', { skip: 's' });
}

// a cloth awning over a front, in stripes; an old one has a stripe or two that do not match
function awning(P, u0, u1, y0, y1, out, cols, rng, mended) {
  const n = Math.max(2, Math.round((u1 - u0) / 0.52)), odd = mended && rng() < 0.5 ? Math.floor(rng() * n) : -1;
  for (let i = 0; i < n; i++) {
    const a = lerp(u0, u1, i / n), b = lerp(u0, u1, (i + 1) / n), col = i === odd ? shade(cols[1], 0.82) : cols[i % 2];
    P.c.quad([a, y0, -0.06], [b, y0, -0.06], [b, y1, -out], [a, y1, -out], col);
    P.c.quad([a, y1, -out], [b, y1, -out], [b, y1 - 0.16, -out], [a, y1 - 0.16, -out], shade(col, 0.9));
  }
  P.c.tri([u0, y0, -0.06], [u0, y1, -out], [u0, y1, -0.06], cols[0]); P.c.tri([u1, y0, -0.06], [u1, y1, -out], [u1, y1, -0.06], cols[0]);
  for (const x of [u0 + 0.03, u1 - 0.03]) P.g.tube([[x, y1 - 0.02, -out + 0.02], [x, y1 - 0.42, -0.04]], 0.012, 4, '#4a4b4c');
}

const FRONTS = {
  // a shop: a door, a window with things in it, its name on a board above, sometimes an awning or a hanging sign
  shop(D, P, run, b, H) {
    const g = P.g, rng = b.rng, u0 = b.u0, u1 = b.u1, pier = 0.24, dw = 0.96, dep = b.depth || 3.2, pal = D.pal;
    const head = Math.min(2.2, H - 0.8), fas0 = head + 0.06, fas1 = Math.min(H - 0.2, fas0 + 0.54), sill = b.frosted ? 0.95 : 0.56;
    const ds = b.doorSide, d0 = ds ? u1 - pier - dw : u0 + pier, d1 = d0 + dw;
    const w0 = ds ? u0 + pier : d1 + 0.14, w1 = ds ? d0 - 0.14 : u1 - pier, em = (0.22 + 0.55 * b.lit) * D.glowK, hi = H - 0.22;
    if (!b.fine) {
      wallN(g, u0, u1, 0, H, 0, b.wall); wallN(g, d0, d1, 0, 2.1, -0.012, b.door);
      wallN(g, w0, w1, sill, head, -0.012, b.inside, em * 2.2); wallN(g, u0 + pier, u1 - pier, fas0, fas1, -0.014, b.ground);
      return;
    }
    g.box(u0, 0, -0.07, u0 + pier, H, 0.3, b.wall, { skip: 'tb' }).box(u1 - pier, 0, -0.07, u1, H, 0.3, b.wall, { skip: 'tb' });
    g.box(ds ? d0 - 0.14 : d1, 0, -0.01, ds ? d0 : d1 + 0.14, head, 0.24, b.trim, { skip: 'tb' });
    g.box(w0, 0, 0, w1, sill, 0.22, b.dado, { skip: 'b' }).box(w0 - 0.02, sill, -0.07, w1 + 0.02, sill + 0.06, 0.3, b.trim);
    g.box(u0 + pier, head, -0.02, u1 - pier, fas0, 0.26, b.trim, { skip: 't' }).box(u0 + pier, fas0, -0.05, u1 - pier, fas1, 0.26, b.ground, { skip: 'tb' });
    g.box(u0 + pier, fas1, -0.11, u1 - pier, fas1 + 0.07, 0.26, b.trim);
    if (H > fas1 + 0.09) g.box(u0 + pier, fas1 + 0.07, 0, u1 - pier, H, 0.26, b.wall, { skip: 'tb' });
    const nb = Math.max(1, Math.round((w1 - w0) / 1.25));
    for (let i = 1; i < nb; i++) { const x = lerp(w0, w1, i / nb); g.box(x - 0.025, sill + 0.06, 0.02, x + 0.025, head, 0.09, b.trim, { skip: 'tb' }); }
    if (b.frosted) wallN(g, w0, w1, sill + 0.06, head, 0.07, '#e6eef0', 0.75 * D.glowK);
    else P.gl.quad([w1, sill + 0.06, 0.06], [w0, sill + 0.06, 0.06], [w0, head, 0.06], [w1, head, 0.06], pal.glass);
    doorLeaf(g, d0, d1, head - 0.04, 0.2, b.door, { open: b.open, glazed: true, light: b.inside, e: em * 2.2, brass: pal.brass });
    wallN(g, d0, d1, head - 0.04, head, 0.2, b.trim);
    // inside: a room that glows with its own lamps
    g.floor(u0 + 0.12, 0.2, u1 - 0.12, dep, 0.015, b.floorIn);
    wallN(g, u0 + 0.12, u1 - 0.12, 0, hi, dep, b.inside, em);
    g.quad([u0 + 0.12, 0, dep], [u0 + 0.12, 0, 0.26], [u0 + 0.12, hi, 0.26], [u0 + 0.12, hi, dep], b.inside, em * 0.7);
    g.quad([u1 - 0.12, 0, 0.26], [u1 - 0.12, 0, dep], [u1 - 0.12, hi, dep], [u1 - 0.12, hi, 0.26], b.inside, em * 0.7);
    g.floor(u0 + 0.12, 0.26, u1 - 0.12, dep, hi, shade(b.inside, 0.85), { down: true, emit: em * 0.5 });
    g.floor((u0 + u1) / 2 - 0.5, dep * 0.4, (u0 + u1) / 2 + 0.5, dep * 0.4 + 0.3, hi - 0.01, '#fff0d0', { down: true, emit: 3.5 * D.glowK });
    if (!b.frosted) {
      // shelves along the back wall, a counter, and the window's own show on a step with a painted screen behind it
      for (let k = 0; k < 3; k++) {
        const y = 1.0 + k * 0.46; g.box(u0 + 0.3, y, dep - 0.32, u1 - 0.3, y + 0.035, dep, b.trim, { skip: 's' });
        for (let x = u0 + 0.4; x < u1 - 0.55; x += 0.34 + 0.2 * rng()) { if (rng() < 0.15) continue; const w = 0.2 + 0.12 * rng(); g.box(x, y + 0.035, dep - 0.27, x + w, y + 0.16 + 0.2 * rng(), dep - 0.05, hue(rng(), 0.55 * pal.goods, 0.3 + 0.25 * rng()), { skip: 'bs', emit: 0.3 }); }
      }
      const cu = ds ? w0 + 0.3 : w1 - 1.7; g.box(cu, 0, dep - 1.5, cu + 1.4, 0.92, dep - 0.95, b.dado, { skip: 'b', top: shade(b.trim, 1.5) });
      if (b.goods && b.goods !== 'none' && b.goods !== 'drawings') { const sc = mixc(b.door, '#e6d8bc', 0.42); g.box(w0, 0.2, 0.9, w1, sill + 0.5, 0.94, sc, { skip: 'b', emit: 0.2 }); g.floor(w0, 0.1, w1, 0.9, sill + 0.058, shade(b.trim, 1.7)); }
      (GOODS[b.goods] || GOODS.none)(D, P, run, w0 + 0.08, w1 - 0.08, sill + 0.06, 0.1, 0.85, rng, pal.goods);
    }
    // a small lamp on each pier
    for (const pu of [u0 + pier / 2, u1 - pier / 2]) { g.box(pu - 0.045, 2.02, -0.16, pu + 0.045, 2.16, -0.07, '#ffe9c0', { emit: 3 * D.glowK, skip: 's' }).box(pu - 0.06, 2.16, -0.17, pu + 0.06, 2.19, -0.07, '#3f3f40'); D.glows.push({ p: run.pt(pu, 2.09, -0.18), color: pal.lamp, power: 1.1 * D.glowK, size: 0.42 }); }
    // its name: on the board, and on a sign hung out over the street
    const mid = (u0 + u1) / 2, sg = b.sign || {};
    if (b.name) D.sign(b.name, { run, at: run.pt(mid, (fas0 + fas1) / 2, -0.056), maxW: u1 - u0 - 2 * pier - 0.08, h: fas1 - fas0 - 0.07, style: sg.style || 'board', font: sg.font || b.font, ground: b.ground, ink: b.ink, glow: sg.glow || 0, upper: sg.upper, track: sg.track });
    const jut = D.clear(...run.pt(mid, 2.1, -0.7), 1.25);
    if (b.awning && jut) awning(P, u0 + pier - 0.1, u1 - pier + 0.1, fas0 + 0.04, head - 0.18, 1.15, b.awning, rng, pal.goods < 0.9);
    else if (b.blade && jut) {
      const bu = ds ? u0 + pier * 0.5 : u1 - pier * 0.5, word = typeof b.blade === 'string' ? b.blade : b.name;
      g.box(bu - 0.02, fas1 - 0.1, -0.98, bu + 0.02, fas1 - 0.06, -0.05, '#4a4b4c').box(bu - 0.025, fas0 - 0.36, -0.95, bu + 0.025, fas1 - 0.14, -0.25, b.ground);
      if (word) for (const sd of [1, -1]) D.sign(word, { run, side: sd, at: run.pt(bu + sd * 0.027, (fas0 - 0.36 + fas1 - 0.14) / 2, -0.6), w: 0.66, h: fas1 - fas0 + 0.18, style: 'board', font: b.font, ground: b.ground, ink: b.ink });
    }
    if (b.sub) D.sign(b.sub, { run, at: run.pt(ds ? w1 - 0.5 : w0 + 0.5, head - 0.3, 0.04), h: Array.isArray(b.sub) ? 0.4 : 0.24, w: 0.82, style: 'card', font: 'cond' });
    if (b.lit > 0.3) D.glows.push({ p: run.pt(mid, head - 0.2, 0.9), color: pal.shop, power: 0.4 * b.lit * D.glowK, size: 1.3 });
  },
  // a stall: an open counter under a cloth, the goods set out on it
  stall(D, P, run, b, H) {
    const g = P.g, rng = b.rng, u0 = b.u0, u1 = b.u1, pier = 0.24, dep = 2.4, pal = D.pal, em = (0.3 + 0.5 * b.lit) * D.glowK;
    const head = Math.min(2.25, H - 0.7), fas1 = Math.min(H - 0.2, head + 0.5);
    if (!b.fine) { wallN(g, u0, u1, 0, H, 0, b.wall); wallN(g, u0 + pier, u1 - pier, 0.95, head, -0.012, b.inside, em * 2); wallN(g, u0 + pier, u1 - pier, head, fas1, -0.014, b.ground); return; }
    g.box(u0, 0, -0.07, u0 + pier, H, 0.3, b.wall, { skip: 'tb' }).box(u1 - pier, 0, -0.07, u1, H, 0.3, b.wall, { skip: 'tb' });
    g.box(u0 + pier, 0, -0.28, u1 - pier, 0.9, 0.3, b.dado, { skip: 'b' }).box(u0 + pier - 0.03, 0.9, -0.34, u1 - pier + 0.03, 0.95, 0.36, shade(b.trim, 1.5));
    g.box(u0 + pier, head, -0.04, u1 - pier, fas1, 0.26, b.ground, { skip: 'b' });
    if (H > fas1 + 0.02) g.box(u0 + pier, fas1, 0, u1 - pier, H, 0.26, b.wall, { skip: 'tb' });
    const hi = H - 0.22;
    wallN(g, u0 + 0.12, u1 - 0.12, 0, hi, dep, b.inside, em);
    g.quad([u0 + 0.12, 0, dep], [u0 + 0.12, 0, 0.26], [u0 + 0.12, hi, 0.26], [u0 + 0.12, hi, dep], b.inside, em * 0.7);
    g.quad([u1 - 0.12, 0, 0.26], [u1 - 0.12, 0, dep], [u1 - 0.12, hi, dep], [u1 - 0.12, hi, 0.26], b.inside, em * 0.7);
    g.floor(u0 + 0.12, 0.26, u1 - 0.12, dep, hi, shade(b.inside, 0.85), { down: true, emit: em * 0.5 });
    for (let k = 0; k < 3; k++) { const y = 1.0 + k * 0.45; g.box(u0 + 0.3, y, dep - 0.3, u1 - 0.3, y + 0.03, dep, b.trim, { skip: 's' }); for (let x = u0 + 0.4; x < u1 - 0.5; x += 0.32 + 0.2 * rng()) g.box(x, y + 0.03, dep - 0.24, x + 0.18, y + 0.14 + 0.18 * rng(), dep - 0.05, hue(rng(), 0.4 * pal.goods, 0.3 + 0.3 * rng()), { skip: 'bs', emit: 0.25 }); }
    (GOODS[b.goods] || GOODS.none)(D, P, run, u0 + pier + 0.05, u1 - pier - 0.05, 0.95, -0.3, 0.3, rng, pal.goods);
    const mid = (u0 + u1) / 2;
    if (b.name) D.sign(b.name, { run, at: run.pt(mid, (head + fas1) / 2, -0.046), maxW: u1 - u0 - 2 * pier - 0.08, h: fas1 - head - 0.08, style: 'board', font: b.font, ground: b.ground, ink: b.ink });
    if (b.awning && D.clear(...run.pt(mid, 2.1, -0.7), 1.25)) awning(P, u0 + pier - 0.1, u1 - pier + 0.1, head - 0.02, head - 0.3, 1.1, b.awning, rng, pal.goods < 0.9);
    D.glows.push({ p: run.pt(mid, head - 0.2, 0.9), color: pal.shop, power: 0.4 * b.lit * D.glowK, size: 1.3 });
    for (const pu of [u0 + pier / 2, u1 - pier / 2]) { g.box(pu - 0.045, 2.02, -0.16, pu + 0.045, 2.16, -0.07, '#ffe9c0', { emit: 3 * D.glowK, skip: 's' }).box(pu - 0.06, 2.16, -0.17, pu + 0.06, 2.19, -0.07, '#3f3f40'); D.glows.push({ p: run.pt(pu, 2.09, -0.18), color: pal.lamp, power: 1.1 * D.glowK, size: 0.42 }); }
    if (rng() < 0.7) D.spots.push({ p: run.pt(mid + rng.f(-0.6, 0.6), 0, 1.0), yaw: run.yaw + Math.PI });
  },
  // a home's door in a wall: no window (nothing in a drum has one, away from the courts and the Hollow)
  home(D, P, run, b, H) { FRONTS.flat(D, P, run, { ...b, windows: 0 }, H); },
  // a flat on a court's terrace: a door, and windows that look out
  flat(D, P, run, b, H) {
    const g = P.g, rng = b.rng, u0 = b.u0, u1 = b.u1, pal = D.pal, w = u1 - u0, dt = 2.08;
    const nw = Math.min(b.windows === undefined ? (w > 5.2 ? 2 : 1) : b.windows, Math.max(0, Math.floor((w - 1.9) / 1.6)));
    const dc = b.doorSide ? u1 - 0.95 : u0 + 0.95, d0 = dc - 0.47, d1 = dc + 0.47;
    const wins = [];
    for (let i = 0; i < nw; i++) { const c = b.doorSide ? u0 + (w - 1.9) * (i + 0.5) / nw : u0 + 1.9 + (w - 1.9) * (i + 0.5) / nw; wins.push([c - 0.72, c + 0.72]); }
    const on = (i) => b.rnd[i % 4] < b.lit, wc = (i) => (on(i) ? pick(rng, pal.window) : shade(pick(rng, pal.doors), 0.5)), we = (i) => (on(i) ? (0.7 + 0.9 * b.rnd[(i + 1) % 4]) * D.glowK : 0.12);
    if (!b.fine) {
      wallN(g, u0, u1, 0, H, 0, b.wall); wallN(g, d0, d1, 0, dt, -0.012, b.door);
      wins.forEach((q, i) => wallN(g, q[0], q[1], 0.95, 2.15, -0.012, wc(i), we(i)));
      return;
    }
    // the wall, pieced round its openings, with a painted dado
    const cuts = [[d0 - 0.1, d1 + 0.1, 0, dt + 0.1], ...wins.map((q) => [q[0], q[1], 0.95, 2.15])].sort((a, c) => a[0] - c[0]);
    let x = u0;
    for (const c of cuts) { if (c[0] > x) wallN(g, x, c[0], 0, H, 0, b.wall); if (c[2] > 0) wallN(g, c[0], c[1], 0, c[2], 0, b.wall); wallN(g, c[0], c[1], c[3], H, 0, b.wall); x = c[1]; }
    if (x < u1) wallN(g, x, u1, 0, H, 0, b.wall);
    x = u0;
    for (const c of cuts) { if (c[2] > 0.5) continue; if (c[0] > x) g.box(x, 0, -0.022, c[0], 1.0, 0, b.dado, { skip: 'bs' }); x = c[1]; }
    if (x < u1) g.box(x, 0, -0.022, u1, 1.0, 0, b.dado, { skip: 'bs' });
    // a skirting, a strip where one house's paint meets the next, and (on a home with no window) a grille for its air
    const dark = shade(b.trim, 0.85);
    g.box(u0, 0, -0.036, d0 - 0.1, 0.1, 0, dark, { skip: 'bs' }).box(d1 + 0.1, 0, -0.036, u1, 0.1, 0, dark, { skip: 'bs' }).box(u0 - 0.06, 0, -0.045, u0 + 0.06, H, 0, shade(b.wall, 0.86), { skip: 'tbs' });
    if (!nw && w > 3.4 && b.rnd[2] < 0.6) { const gu = b.doorSide ? u0 + 0.9 : u1 - 0.9; wallN(g, gu - 0.3, gu + 0.3, 2.28, 2.6, -0.006, '#2f2a26'); for (let k = 0; k < 4; k++) g.box(gu - 0.3, 2.29 + k * 0.08, -0.03, gu + 0.3, 2.33 + k * 0.08, -0.004, b.trim, { skip: 's' }); }
    g.box(d0 - 0.1, 0, -0.04, d0, dt + 0.1, 0.14, b.trim, { skip: 'b' }).box(d1, 0, -0.04, d1 + 0.1, dt + 0.1, 0.14, b.trim, { skip: 'b' }).box(d0, dt, -0.04, d1, dt + 0.1, 0.14, b.trim);
    doorLeaf(g, d0, d1, dt, 0.09, b.door, { brass: pal.brass });
    if (b.rnd[0] < 0.4) wallN(g, d0 + 0.05, d1 - 0.05, 0.0, 0.03, 0.085, '#ffe2b0', 4 * D.glowK);          // light under the door
    g.floor(d0 + 0.05, -0.62, d1 - 0.05, -0.04, 0.012, shade(b.door, 0.7));
    const lu = b.doorSide ? d0 - 0.32 : d1 + 0.32;
    g.box(lu - 0.05, 1.86, -0.1, lu + 0.05, 2.0, 0, '#3f3f40').box(lu - 0.07, 1.72, -0.13, lu + 0.07, 1.86, -0.02, '#ffe9c0', { emit: 3 * D.glowK });
    D.glows.push({ p: run.pt(lu, 1.79, -0.14), color: pal.lamp, power: 1.2 * D.glowK, size: 0.5 });
    if (b.number) D.sign(String(b.number), { run, at: run.pt(lu, 1.5, -0.012), h: 0.13, w: 0.3, style: 'plate', font: 'cond' });
    wins.forEach((q, i) => {
      g.box(q[0] - 0.06, 0.89, -0.05, q[1] + 0.06, 0.95, 0.12, b.trim).box(q[0] - 0.06, 2.15, -0.04, q[1] + 0.06, 2.21, 0.12, b.trim);
      g.box(q[0] - 0.06, 0.95, -0.04, q[0], 2.15, 0.12, b.trim, { skip: 'tb' }).box(q[1], 0.95, -0.04, q[1] + 0.06, 2.15, 0.12, b.trim, { skip: 'tb' });
      g.box((q[0] + q[1]) / 2 - 0.02, 0.95, 0.03, (q[0] + q[1]) / 2 + 0.02, 2.15, 0.07, b.trim, { skip: 'tb' });
      wallN(g, q[0], q[1], 0.95, 2.15, 0.09, wc(i), we(i));
      const cc = shade(pick(rng, pal.awnings)[0], 0.9);
      wallN(g, q[0], q[0] + 0.22, 0.95, 2.15, 0.08, cc, on(i) ? 0.35 : 0.05); wallN(g, q[1] - 0.22, q[1], 0.95, 2.15, 0.08, cc, on(i) ? 0.35 : 0.05);
      if (b.rnd[(i + 2) % 4] < 0.45) { g.box(q[0], 0.72, -0.24, q[1], 0.9, -0.04, pal.tub[(i + 1) % pal.tub.length], { top: '#4f4338' }); for (let k = 0; k < 3; k++) D.put('bush', { p: run.pt(lerp(q[0] + 0.25, q[1] - 0.25, k / 2), 0.84, -0.14), yaw: rng() * TAU, scale: rng.f(0.5, 0.75), color: vary(pick(rng, pal.leaf), rng, 0.15) }); }
      if (b.rnd[(i + 3) % 4] > 0.72) awning(P, q[0] - 0.12, q[1] + 0.12, 2.3, 2.02, 0.66, pick(rng, pal.awnings), rng, false);
    });
    // what people keep by their doors
    const pu = b.doorSide ? d0 - 0.9 : d1 + 0.9, r = b.rnd[3];
    if (D.clear(...run.pt(pu, 1, -0.5), 1.3)) {
      if (r < 0.3) D.put('pot', { p: run.pt(pu, 0, -0.3), yaw: rng() * TAU, scale: rng.f(1.2, 1.9), color: vary(pick(rng, pal.leaf), rng, 0.15) });
      else if (r < 0.42) { D.put('bench', { p: run.pt(pu + 0.4, 0, -0.34), yaw: run.yaw, color: vary(pick(rng, pal.doors), rng, 0.1) }); if (rng() < 0.5) D.spots.push({ p: run.pt(pu + 0.3, 0.45, -0.3), sit: true, yaw: run.yaw + Math.PI }); }
      else if (r < 0.52) D.put('chair', { p: run.pt(pu, 0, -0.4), yaw: run.yaw + rng.f(-0.4, 0.4), color: vary(pick(rng, pal.doors), rng, 0.1) });
      else if (r < 0.6) D.put('tub', { p: run.pt(pu, 0, -0.45), yaw: rng() * TAU, scale: rng.f(0.8, 1.1), color: vary(pick(rng, pal.leaf), rng, 0.15) });
    }
  },
  // a plain wall: perhaps a notice on it, perhaps a bench against it
  wall(D, P, run, b, H) {
    const g = P.g, u0 = b.u0, u1 = b.u1, mid = (u0 + u1) / 2;
    wallN(g, u0, u1, 0, H, 0, b.wall);
    if (!b.fine) return;
    g.box(u0, 0, -0.022, u1, 1.0, 0, b.dado, { skip: 'bs' }).box(u0, 1.0, -0.035, u1, 1.05, 0, b.trim, { skip: 's' });
    g.box(u0 - 0.06, 0, -0.045, u0 + 0.06, H, 0, shade(b.wall, 0.86), { skip: 'tbs' });
    if (b.notice) { g.box(mid - 0.62, 1.2, -0.03, mid + 0.62, 2.15, 0, b.trim, { skip: 's' }); D.sign(b.notice, { run, at: run.pt(mid, 1.675, -0.036), w: 1.1, h: 0.85, style: b.noticeStyle || 'paper' }); }
    const bench = b.bench === undefined ? (u1 - u0 > 2.6 && b.rnd[1] < 0.6) : b.bench;
    if (bench && D.clear(...run.pt(mid, 1, -0.5), 1.3)) { D.put('bench', { p: run.pt(mid + (b.notice ? 1.6 : 0), 0, -0.34), yaw: run.yaw, color: vary(pick(b.rng, D.pal.doors), b.rng, 0.1) }); if (b.rnd[2] < 0.6) D.spots.push({ p: run.pt(mid + (b.notice ? 1.6 : 0) + (b.rnd[3] - 0.5), 0.45, -0.3), sit: true, yaw: run.yaw + Math.PI }); }
    else if (u1 - u0 > 2 && b.rnd[1] > 0.75 && D.clear(...run.pt(mid, 1, -0.5), 1.3)) D.put('tub', { p: run.pt(mid, 0, -0.42), yaw: b.rnd[0] * TAU, scale: 0.9 + 0.4 * b.rnd[3], color: vary(pick(b.rng, D.pal.leaf), b.rng, 0.15) });
  },
  // the open side of a hall: piers and a beam over, the room beyond for hall() to make. bays: how many openings; glazed
  hall(D, P, run, b, H) {
    const g = P.g, u0 = b.u0, u1 = b.u1, n = b.bays || Math.max(1, Math.round((u1 - u0) / 6)), top = Math.min(2.55, H - 0.4), pw = 0.4;
    if (!b.fine) { wallN(g, u0, u1, top, H, 0, b.wall); for (let i = 0; i <= n; i++) { const x = lerp(u0, u1, i / n); wallN(g, Math.max(u0, x - pw / 2), Math.min(u1, x + pw / 2), 0, top, 0, b.wall); } return; }
    g.box(u0, top, -0.06, u1, H, 0.3, b.wall, { skip: 't' });
    for (let i = 0; i <= n; i++) { const x = lerp(u0, u1, i / n); g.box(Math.max(u0, x - pw / 2), 0, -0.08, Math.min(u1, x + pw / 2), top, 0.32, b.wall, { skip: 'tb' }); }
    if (b.glazed) for (let i = 0; i < n; i++) {
      const a = lerp(u0, u1, i / n) + pw / 2, c = lerp(u0, u1, (i + 1) / n) - pw / 2;
      P.gl.quad([c, 0.5, 0.1], [a, 0.5, 0.1], [a, top, 0.1], [c, top, 0.1], D.pal.glass);
      g.box(a, 0, 0.04, c, 0.5, 0.16, b.dado, { skip: 'b' }).box((a + c) / 2 - 0.025, 0.5, 0.07, (a + c) / 2 + 0.025, top, 0.13, b.trim, { skip: 'tb' }).box(a, 1.5, 0.07, c, 1.55, 0.13, b.trim);
    }
    if (b.name) D.sign(b.name, { run, at: run.pt((u0 + u1) / 2, (top + H) / 2 + 0.02, -0.066), maxW: u1 - u0 - 1, h: Math.min(0.37, H - top - 0.07), style: 'board', font: b.font, ground: b.ground, ink: b.ink, track: 0.12 });
  },
  // a stair: an opening in the wall, a flight up on one hand and a flight down on the other
  stair(D, P, run, b, H) {
    const g = P.g, u0 = b.u0, u1 = b.u1, mid = (u0 + u1) / 2, hw = Math.min(1.5, (u1 - u0) / 2 - 0.3), top = Math.min(2.5, H - 0.35), dep = 4.4;
    wallN(g, u0, mid - hw, 0, H, 0, b.wall); wallN(g, mid + hw, u1, 0, H, 0, b.wall); wallN(g, mid - hw, mid + hw, top, H, 0, b.wall);
    if (!b.fine) { wallN(g, mid - hw, mid + hw, 0, top, 0.5, shade(b.wall, 0.8), 0.25); return; }
    g.box(mid - hw - 0.12, 0, -0.05, mid - hw, top + 0.12, 0.3, b.trim, { skip: 'b' }).box(mid + hw, 0, -0.05, mid + hw + 0.12, top + 0.12, 0.3, b.trim, { skip: 'b' }).box(mid - hw, top, -0.05, mid + hw, top + 0.12, 0.3, b.trim);
    const wl = shade(b.wall, 0.92), e = 0.3 * D.glowK;
    wallN(g, mid - hw, mid + hw, -2, H + 1, dep, wl, e);
    g.quad([mid - hw, -2, dep], [mid - hw, -2, 0.3], [mid - hw, H + 1, 0.3], [mid - hw, H + 1, dep], wl, e);
    g.quad([mid + hw, -2, 0.3], [mid + hw, -2, dep], [mid + hw, H + 1, dep], [mid + hw, H + 1, 0.3], wl, e);
    g.floor(mid - hw, 0, mid + hw, 0.75, 0.01, b.floorIn);
    for (let i = 0; i < 12; i++) {
      const v = 0.75 + i * 0.29, y = (i + 1) * (DECK_RISE / 24);
      g.box(mid + 0.06, 0, v, mid + hw, y, v + 0.29, i % 2 ? '#b9ae98' : '#c4b9a2', { skip: 'b' });                 // up
      g.box(mid - hw, -y - 0.6, v, mid - 0.06, -y + DECK_RISE / 24, v + 0.29, i % 2 ? '#aba08a' : '#b5aa94', { skip: 'b' });   // down
    }
    g.box(mid - 0.06, -2, 0.75, mid + 0.06, 0.95, dep, b.dado, { skip: 'b' });
    g.tube([[mid + 0.1, 0.95, 0.75], [mid + 0.1, 0.95 + 2, 0.75 + 3.48]], 0.022, 4, D.pal.brass);
    D.sign(b.name || 'Stair', { run, at: run.pt(mid, top + (H - top) / 2 + 0.03, -0.012), h: Math.min(0.24, H - top - 0.1), style: 'plate', font: 'cond' });
    if (b.sub) D.sign(b.sub, { run, at: run.pt(mid + hw + 0.5, 1.6, -0.012), h: 0.2, w: 0.62, style: 'plate', font: 'cond' });
    D.glows.push({ p: run.pt(mid, H - 0.2, 1.4), color: D.pal.lamp, power: 1.3 * D.glowK, size: 0.7 });
  },
  // nothing: a way through (a cross street, a court's mouth)
  gap() { },
  // the world's own front: piers at the ends, and draw(P, bay, run) for the rest
  custom(D, P, run, b, H) { if (b.piers !== false) { P.g.box(b.u0, 0, -0.07, b.u0 + 0.24, H, 0.3, b.wall, { skip: 'tb' }).box(b.u1 - 0.24, 0, -0.07, b.u1, H, 0.3, b.wall, { skip: 'tb' }); } if (b.draw) b.draw(P, b, run, H); },
};

/**
 * A row of fronts along a run, facing -v at v = 0. A generator: `const row = yield* frontage(deck, run, spec)`.
 * spec:
 *   from, to     where the row runs, in the run's own u
 *   height       floor to ceiling (default 3)
 *   fronts       the fronts the world wants: [{ from, to, kind, ... }]. from and to are places along the deck (x for a row
 *                that lies along x, z otherwise), or along the run itself with local: true
 *   fill         what stands in between: { mix: { shop: 2, home: 2, wall: 0.4, stall: 0.3, flat: 0 }, bay: [4.6, 6.4] (widths, m),
 *                trades: [[name, goods], ...], lit: 0.8, awnings: 0.4, blades: 0.4, numbers: 100 (first door number) } or false
 *   paint        { wall, dado, trim }: one paint for the whole row, where a front does not give its own
 *   part         a name: keeps this row's geometry in meshes of its own
 * A front: { kind: 'shop' | 'stall' | 'home' | 'flat' | 'wall' | 'hall' | 'stair' | 'gap' | 'custom', id, and any of
 *   name (on its board), sub (a card by the door), goods ('bread', 'greens', 'cloth', 'pots', 'books', 'lamps', 'toys', 'shoes',
 *   'flutes', 'jars', 'tea', 'noodles', 'bottles', 'paper', 'drawings', 'none'), awning (true or two colours), blade (true or a word),
 *   wall, trim, door, ground, ink (colours), font, lit (0..1), open (its door stands open), frosted, doorSide (0 or 1),
 *   windows, number, notice (lines), bench, bays, glazed, draw(P, bay, run, H) }
 * returns { bays: [...], find(id) }: a bay is its front with u0, u1 and at(t, y, v), a point of it in the deck's co-ordinates.
 */
export function* frontage(D, run, spec) {
  const H = spec.height || ROOM, rng = makeRng(D.seed + (spec.part || '') + run.ox + '_' + run.oz + '_' + run.turn + '_' + run.oy), pal = D.pal;
  const a = Math.min(spec.from, spec.to), z = Math.max(spec.from, spec.to), fill = spec.fill === false ? null : { ...(spec.fill || {}) };
  const given = (spec.fronts || []).map((f) => { let u0 = f.local ? f.from : run.u(f.from), u1 = f.local ? f.to : run.u(f.to); if (u0 > u1) { const t = u0; u0 = u1; u1 = t; } return { ...f, u0: Math.max(a, u0), u1: Math.min(z, u1) }; }).filter((f) => f.u1 - f.u0 > 0.3).sort((p, q) => p.u0 - q.u0);
  const bays = [];
  const mix = fill ? (fill.mix || { shop: 2, home: 2, wall: 0.4 }) : {}, kinds = Object.keys(mix), total = kinds.reduce((s, k) => s + mix[k], 0);
  const trades = fill && fill.trades ? fill.trades.slice() : TRADES.slice();
  let ti = Math.floor(rng() * trades.length), number = fill && fill.numbers ? fill.numbers : 0;
  const stretch = (u0, u1) => {
    if (u1 - u0 < 0.3) return;
    if (!fill || total <= 0 || u1 - u0 < 2.2) { bays.push({ kind: 'wall', u0, u1 }); return; }
    const bw = fill.bay || [4.6, 6.4], n = Math.max(1, Math.round((u1 - u0) / lerp(bw[0], bw[1], rng())));
    for (let i = 0; i < n; i++) {
      let r = rng() * total, kind = kinds[0];
      for (const k of kinds) { r -= mix[k]; if (r <= 0) { kind = k; break; } }
      const f = { kind, u0: lerp(u0, u1, i / n), u1: lerp(u0, u1, (i + 1) / n) };
      if (kind === 'shop' || kind === 'stall') { const t = trades[ti++ % trades.length]; f.name = t[0]; f.goods = t[1]; }
      bays.push(f);
    }
  };
  let at = a;
  for (const f of given) { stretch(at, f.u0); bays.push(f); at = Math.max(at, f.u1); }
  stretch(at, z);
  // paint: neighbours often share a wall colour, as houses do; doors, boards and awnings are each their own
  let house = 0, wall = pick(rng, pal.walls), dado = pick(rng, pal.dado);
  const litK = fill && fill.lit !== undefined ? fill.lit : 0.8;
  for (const b of bays) {
    if (house-- <= 0) { house = Math.floor(rng() * 3); wall = vary(pick(rng, pal.walls), rng, 0.05); dado = vary(pick(rng, pal.dado), rng, 0.06); }
    const sg = pick(rng, pal.signs), mid = (b.u0 + b.u1) / 2, p = run.pt(mid, 1.5, 0);
    b.rng = rng.fork(bays.indexOf(b)); b.rnd = [rng(), rng(), rng(), rng()];
    b.fine = D.fine(p[0], p[1], p[2], b.kind === 'flat' || b.kind === 'home' ? 0.8 : 1);
    const pt = spec.paint || {};
    if (b.wall === undefined) b.wall = pt.wall || wall;
    if (b.dado === undefined) b.dado = pt.dado || dado;
    if (b.trim === undefined) b.trim = pt.trim || vary(pick(rng, pal.trim), rng, 0.08);
    if (b.door === undefined) b.door = vary(pick(rng, pal.doors), rng, 0.08);
    if (b.ground === undefined) { b.ground = sg[0]; if (b.ink === undefined) b.ink = sg[1]; } else if (b.ink === undefined) b.ink = '#efe6cf';
    if (b.font === undefined) b.font = pick(rng, ['serif', 'serif', 'serif', 'italic', 'cond', 'sans']);
    if (b.inside === undefined) b.inside = vary(pick(rng, pal.rooms), rng, 0.08);
    if (b.floorIn === undefined) b.floorIn = vary(pal.strip, rng, 0.1);
    if (b.lit === undefined) b.lit = rng() < litK ? 0.6 + 0.4 * rng() : 0.12;
    if (b.doorSide === undefined) b.doorSide = rng() < 0.5 ? 0 : 1;
    if (b.open === undefined) b.open = rng() < 0.45;
    if (b.awning === undefined) b.awning = (b.kind === 'stall' || rng() < (fill && fill.awnings !== undefined ? fill.awnings : 0.4)) ? pick(rng, pal.awnings) : null; else if (b.awning === true) b.awning = pick(rng, pal.awnings);
    if (b.blade === undefined) b.blade = !b.awning && rng() < (fill && fill.blades !== undefined ? fill.blades : 0.5) && b.name && b.name.length <= 11;
    if ((b.kind === 'home' || b.kind === 'flat') && b.number === undefined && number) { b.number = number; number += 1 + Math.floor(rng() * 2); }
    b.at = (t, y = 0, v = 0) => run.pt(lerp(b.u0, b.u1, t), y, v);
    const draw = FRONTS[b.kind];
    if (draw) { const P = D.pen(run, mid, spec.part || ''); draw(D, P, run, b, H); P.done(); }
    // something stood outside, and someone looking in
    if (b.fine && (b.kind === 'shop' || b.kind === 'stall') && b.props !== false) {
      const q = b.rnd[2], pu = lerp(b.u0 + 0.5, b.u1 - 0.5, b.rnd[1]), pp = run.pt(pu, 0, -0.5);
      if (D.clear(pp[0], pp[1] + 1.2, pp[2], 1.5)) {
        if (q < 0.22) D.put('planter', { p: pp, yaw: run.yaw, color: vary(pick(rng, pal.leaf), rng, 0.15) });
        else if (q < 0.4) D.put('tub', { p: pp, yaw: rng() * TAU, scale: rng.f(0.85, 1.15), color: vary(pick(rng, pal.leaf), rng, 0.15) });
        else if (q < 0.55) { D.put('crate', { p: pp, yaw: run.yaw + rng.f(-0.3, 0.3), color: hue(rng(), 0.4 * pal.goods, 0.45) }); D.put('crate', { p: run.pt(pu + 0.6, 0, -0.45), yaw: run.yaw + rng.f(-0.3, 0.3), color: hue(rng(), 0.4 * pal.goods, 0.45) }); }
        else if (q < 0.68) D.put('bench', { p: run.pt(pu, 0, -0.36), yaw: run.yaw, color: vary(pick(rng, pal.doors), rng, 0.1) });
      }
      const sp = run.pt(lerp(b.u0 + 0.8, b.u1 - 0.8, b.rnd[3]), 0, -0.95);
      if (b.rnd[0] < 0.4 && D.clear(sp[0], sp[1] + 1.2, sp[2], 1.4)) D.spots.push({ p: sp, yaw: run.yaw, child: b.rnd[0] < 0.06 });
    }
    if (D.clk.due()) { yield 'deck: fronts'; D.clk.go(); }
  }
  return { bays, run, find: (id) => bays.find((b) => b.id === id) };
}

// ---------------------------------------------------------------- streets
/**
 * An avenue (axis 'x': it runs spinward, and curves up ahead of you) or a street (axis 'z': along the axis, dead straight).
 * A generator: `const st = yield* street(deck, spec)`. spec:
 *   axis, from, to, at   which way it runs, between which places along it, and where its centre line lies across
 *   y (0), width (8), height (3)
 *   fronts     an avenue's { front: [...], back: [...] }, a street's { anti: [...], spin: [...] }: see frontage()
 *   fill       what stands between the fronts given (see frontage()); false for bare walls; or one for each side by name
 *   lamps      { every: 6, rows: 1, kind: 'panel' | 'globe', power: 1, color, reach: 4.2 }, or false. Also grid (lamps stand
 *              at grid + k x every: give two stretches of one street the same) and lattice (false: no light of its own,
 *              another stretch's covers it; { from, to }: its light covers that much of the grid)
 *   ribs       { every: 6, spring: 2.3 }: flat arches across, or false for a plain ceiling
 *   trolley    { every: 70 (metres between cars), speed: 1.5, dir: 1 or -1, color }: a slow trolley down the middle
 *   folk       people to each 100 m: { stand: 5, stroll: 4, walk: 5, kids: 0 (children running, anti on an avenue) }
 *   cloth      0..1: flags and banners hung across
 *   plates     where its name is hung: [{ at, lines: [name, address] }]
 *   floor      { color, strip, shine: 0.8 }
 *   ends       [how it begins, how it ends]: 'open' | 'wall'
 *   part       a name: keeps its geometry in meshes of its own
 * returns { run, sides: { front|back|anti|spin: the row from frontage() }, lamps: [[x, y, z], ...], pt(along, y, across) }
 */
export function* street(D, spec) {
  const X = spec.axis !== 'z', y = spec.y || 0, w = spec.width || 8, H = spec.height || ROOM, at = spec.at || 0, pal = D.pal;
  const a = Math.min(spec.from, spec.to), z = Math.max(spec.from, spec.to), len = z - a, part = spec.part || (X ? 'av' : 'st');
  const rng = makeRng(D.seed + 'street' + spec.axis + at + '_' + a + '_' + y);
  const run = X ? new Run(0, y, at, 0) : new Run(at, y, 0, 3);
  const fl = spec.floor || {}, floorCol = fl.color || pal.floor, stripCol = fl.strip || pal.strip, shine = fl.shine === undefined ? 0.8 : fl.shine;
  const lampO = spec.lamps === false ? null : { every: 6, rows: 1, kind: 'panel', power: 1, reach: 4.2, ...(spec.lamps || {}) };
  const ribO = spec.ribs === false ? null : { every: lampO ? lampO.every : 6, spring: Math.min(2.3, H - 0.7), ...(spec.ribs || {}) };
  const tr = spec.trolley ? { ...spec.trolley } : null, railed = !!tr || !!spec.rails;
  // floor, ceiling and ribs, a stretch at a time
  for (let u0 = a; u0 < z - 0.01; u0 += 8) {
    const u1 = Math.min(z, u0 + 8), P = D.pen(run, (u0 + u1) / 2, part), band = railed ? 0.85 : 0;
    P.f.tint(1);
    if (railed) {
      P.f.floor(u0, -w / 2 - 0.3, u1, -band, 0, floorCol, { emit: shine }); P.f.floor(u0, band, u1, w / 2 + 0.3, 0, floorCol, { emit: shine });
      P.f.tint(0.5).floor(u0, -band, u1, band, 0, stripCol, { emit: shine * 0.7 }).tint(1);
      for (const v of [-0.5, 0.5]) P.g.box(u0, 0, v - 0.03, u1, 0.012, v + 0.03, pal.metal, { skip: 'b' });
    } else P.f.floor(u0, -w / 2 - 0.3, u1, w / 2 + 0.3, 0, floorCol, { emit: shine });
    P.f.tint(0);
    P.g.floor(u0, -w / 2, u1, w / 2, H, pal.ceiling, { down: true, emit: 0.26 * D.glowK });     // a ceiling takes a little light back off the floor
    // two pipes along the ceiling, as every street has: one of them the warm loop
    if (spec.pipes !== false && w > 5) { P.g.box(u0, H - 0.2, -w / 2 + 0.42, u1, H - 0.07, -w / 2 + 0.55, '#a8553a', { skip: 't' }).box(u0, H - 0.17, -w / 2 + 0.66, u1, H - 0.08, -w / 2 + 0.75, pal.metal, { skip: 't' }).box(u0, H - 0.18, w / 2 - 0.58, u1, H - 0.07, w / 2 - 0.47, shade(pal.rib, 0.8), { skip: 't' }); }
    P.done();
    if (D.clk.due()) { yield 'deck: street'; D.clk.go(); }
  }
  if (ribO) {
    const n = Math.floor(len / ribO.every), sp = ribO.spring, rise = H - 0.04 - sp, S = 10;
    for (let i = 0; i <= n; i++) {
      const u = a + i * ribO.every, p0 = run.pt(u, H - 0.4, 0);
      if (u > z + 0.01) break;
      const fine = D.fine(p0[0], p0[1], p0[2], 3), seg = fine ? S : 4, P = D.pen(run, Math.min(z - 0.1, Math.max(a + 0.1, u)), part), g = P.g, t = 0.16;
      for (let k = 0; k < seg; k++) {
        const va = lerp(-w / 2, w / 2, k / seg), vb = lerp(-w / 2, w / 2, (k + 1) / seg);
        const ya = sp + rise * Math.sqrt(Math.max(0, 1 - (2 * va / w) ** 2)), yb = sp + rise * Math.sqrt(Math.max(0, 1 - (2 * vb / w) ** 2));
        g.quad([u - t, ya, va], [u + t, ya, va], [u + t, yb, vb], [u - t, yb, vb], pal.rib);                                   // the soffit
        g.quad([u - t, ya, va], [u - t, yb, vb], [u - t, H, vb], [u - t, H, va], shade(pal.rib, 0.93));                      // its two faces
        g.quad([u + t, yb, vb], [u + t, ya, va], [u + t, H, va], [u + t, H, vb], shade(pal.rib, 0.93));
      }
      P.done();
      if (D.clk.due()) { yield 'deck: ribs'; D.clk.go(); }
    }
  }
  // lamps: a row or two down the ceiling, and the light they give
  const lamps = [];
  if (lampO) {
    // lamps stand evenly along the street; or, given lamps.grid, at grid + k x every, so that two stretches of one
    // street (either side of a court) keep one rhythm and can share one lattice of light
    const ev = lampO.every, rows = lampO.rows || 1, col = lampO.color || pal.lamp;
    let n = Math.max(1, Math.floor(len / ev)), u0 = a + (len - (n - 1) * ev) / 2;
    if (lampO.grid !== undefined) { u0 = lampO.grid + Math.ceil((a + 0.8 - lampO.grid) / ev) * ev; n = Math.max(0, Math.floor((z - 0.8 - u0) / ev) + 1); }
    const vs = rows === 1 ? [0] : [-w / 4, w / 4], ly = H - (lampO.kind === 'globe' ? 0.62 : 0.1);
    for (let i = 0; i < n; i++) for (const v of vs) {
      const u = u0 + i * lampO.every, p = run.pt(u, ly, v);
      lamps.push(p);
      D.glows.push({ p: [p[0], p[1] - 0.04, p[2]], color: col, power: 2.3 * D.glowK, size: 0.75 });
      if (lampO.kind === 'globe') D.put('pendant', { p: run.pt(u, H, v), yaw: 0 });
      else { const P = D.pen(run, u, part); P.g.floor(u - 0.55, v - 0.19, u + 0.55, v + 0.19, H - 0.02, '#fff3dc', { down: true, emit: 4.2 * D.glowK }); P.g.box(u - 0.62, H - 0.05, v - 0.26, u + 0.62, H, v + 0.26, pal.metal, { skip: 't' }); P.done(); }
    }
    // their light: one lattice. lamps.lattice: false leaves it out (another stretch's covers this one); { from, to }
    // stretches it over more of the same grid than this street's own length
    if (lampO.lattice !== false && n > 0) {
      let l0 = u0, ln = n;
      if (lampO.lattice && lampO.lattice.from !== undefined) { l0 = u0 + Math.ceil((lampO.lattice.from - u0) / ev) * ev; ln = Math.floor((lampO.lattice.to - l0) / ev) + 1; }
      const cross = rows === 1 ? 40 : w / 2, o = X ? [l0, ly + y, at + vs[0]] : [at - vs[vs.length - 1], ly + y, l0];
      D.lattice({ origin: o, spacing: X ? [ev, cross] : [cross, ev], count: X ? [ln, rows] : [rows, ln], color: col, power: lampO.power, reach: lampO.reach, drop: (H - 0.1) / 0.75 + 0.05 });
    }
    yield 'deck: lamps';
  }
  // the two rows of fronts
  const names = X ? ['back', 'front'] : ['anti', 'spin'], sides = {};
  for (let s = 0; s < 2; s++) {
    const nm = names[s], sr = s === 0 ? (X ? new Run(0, y, at + w / 2, 0) : new Run(at - w / 2, y, 0, 3)) : (X ? new Run(0, y, at - w / 2, 2) : new Run(at + w / 2, y, 0, 1));
    const fill = spec.fill === false ? false : (spec.fill && (spec.fill[nm] !== undefined) ? spec.fill[nm] : spec.fill);
    sides[nm] = yield* frontage(D, sr, { from: sr.u(a), to: sr.u(z), height: H, fronts: (spec.fronts && spec.fronts[nm]) || [], fill, part });
  }
  // ends
  const ends = spec.ends || ['open', 'open'];
  for (let e = 0; e < 2; e++) if (ends[e] === 'wall') { const P = D.pen(run, e ? z - 0.1 : a + 0.1, part), u = e ? z : a; if (e) P.g.quad([u, 0, -w / 2], [u, 0, w / 2], [u, H, w / 2], [u, H, -w / 2], pal.walls[0]); else P.g.quad([u, 0, w / 2], [u, 0, -w / 2], [u, H, -w / 2], [u, H, w / 2], pal.walls[0]); P.done(); }
  // its name, hung under the ceiling where the world asks
  for (const pl of spec.plates || []) {
    const u = pl.at, lines = pl.lines || [spec.name], hh = lines.length > 1 ? 0.5 : 0.3, P = D.pen(run, u, part), ww = pl.w || 2.3;
    P.g.box(u - 0.035, H - 0.12 - hh - 0.06, -ww / 2 - 0.05, u + 0.035, H - 0.12, ww / 2 + 0.05, pal.trim[0]);
    for (const v of [-ww / 2 + 0.2, ww / 2 - 0.2]) P.g.box(u - 0.012, H - 0.12, v - 0.012, u + 0.012, H, v + 0.012, pal.metal, { skip: 'tb' });
    P.done();
    for (const sd of [1, -1]) D.sign(lines, { run, side: sd, at: run.pt(u + sd * 0.037, H - 0.15 - hh / 2, 0), w: ww, h: hh, style: 'plate', font: 'cond', font2: 'serif', head: true });
  }
  // the trolley and the people aboard
  if (tr) trolley(D, { ...tr, axis: spec.axis, from: a, to: z, at, y, rng });
  // people: knots of them standing, some strolling, some walking the length of it, children running
  const fk = { stand: 5, stroll: 4, walk: 5, kids: 0, ...(spec.folk || {}) }, dens = D.density, lane0 = railed ? 1.25 : 0.4, lane1 = w / 2 - 1.5;
  const seen = (u, v) => { const p = run.pt(u, 1.2, v); return D.dist(p[0], p[1], p[2]) < 150; };
  if (lane1 > lane0) {
    for (let i = 0, n = Math.round(fk.stand * len / 100 * dens / 2.4); i < n; i++) { const u = rng.f(a + 1, z - 1), v = rng.sign() * rng.f(lane0 + 0.3, lane1 + 0.4); if (!seen(u, v)) continue; const p = run.pt(u, 0, v); D.knot(p[0], p[1], p[2], 2 + Math.floor(rng() * 2.4), rng); }
    for (let i = 0, n = Math.round(fk.stroll * len / 100 * dens); i < n; i++) {
      const u = rng.f(a + 2, z - 2), rad = rng.f(0.5, Math.min(1.5, (lane1 - lane0) / 2)), v = rng.sign() * rng.f(lane0 + rad, Math.max(lane0 + rad, lane1 - rad)), p = run.pt(u, 0, v);
      if (!seen(u, v) || !D.clear(p[0], p[1] + 1.2, p[2], rad + 1.2)) continue;
      D.spots.push({ p, walk: rad, child: rng() < 0.12 });
    }
    const lanes = [];
    for (let k = 0; k < 6; k++) { const v = (k % 2 ? -1 : 1) * lerp(lane0 + 0.15, lane1, ((k >> 1) + 0.5) / 3); if (D.clearLane(run, a, z, v)) lanes.push(v); }
    if (lanes.length) {
      for (let i = 0, n = Math.round(fk.walk * len / 100 * dens); i < n; i++) { const v = pick(rng, lanes), fwd = rng() < 0.5; D.walkersAlong({ from: run.pt(fwd ? a : z, 0, v), to: run.pt(fwd ? z : a, 0, v), n: 1, spread: 0.12, rng, speed: 1.25 }); }
      // children race anti: running that way they weigh a little less (ashgrove.md, Weight is a map)
      for (let i = 0, n = Math.round(fk.kids * len / 100 * dens / 3); i < n; i++) { const v = pick(rng, lanes), ph = rng(), back = X ? true : rng() < 0.5; D.walkersAlong({ from: run.pt(back ? z : a, 0, v), to: run.pt(back ? a : z, 0, v), n: 3, spread: 0.35, rng, speed: 3.6, child: 1, phase: ph }); }
    }
  }
  // cloth hung across: strings of flags, a banner here and there
  if (spec.cloth) {
    for (let u = a + 4; u < z - 2; u += 5 + 6 * rng()) {
      if (rng() > spec.cloth || !seen(u, 0)) continue;
      const cols = pick(rng, pal.awnings);
      if (rng() < 0.6) { for (const v of [-w / 2 + 1.7, w / 2 - 1.7, 0].slice(0, w > 7 ? 3 : 2)) { const p = run.pt(u, H - 0.3, v); if (D.clear(p[0], p[1] - 0.2, p[2], 1.0)) D.put('bunting', { p, yaw: run.yaw + Math.PI / 2, scale: [(w - 1.2) / (w > 7 ? 9 : 6), 1, 1], color: mixc(cols[0], cols[1], rng()) }); } }
      else { const v = rng.sign() * rng.f(1.2, w / 2 - 1.4), p = run.pt(u, H - 0.08, v); if (D.clear(p[0], p[1] - 0.6, p[2], 1.3)) D.put('banner', { p, yaw: run.yaw + Math.PI / 2, scale: [0.8, 0.52, 1], color: cols[0] }); }
    }
  }
  yield 'deck: street';
  return { run, sides, lamps, len, pt: (along, yy = 0, across = 0) => run.pt(along, yy, across) };
}

/**
 * Slow trolleys along a line, with people aboard: { axis, from, to, at, y, every (70 m between cars), speed (1.5 m/s),
 * dir (1 or -1), color, riders (0.55: the share of seats taken), phase, cars }. street() calls this for its own trolley;
 * call it yourself for a line that runs on across a court's bridge. A car fades in at one end and out at the other, so
 * put the ends out of sight. On a deck made with clock: 'flight', cars: [places along the line] says where each car is
 * as the flight begins, and deck.tick(t) in the world's update() moves them: the camera then meets them where you choose.
 */
export function trolley(D, spec) {
  const X = spec.axis !== 'z', a = Math.min(spec.from, spec.to), z = Math.max(spec.from, spec.to), len = z - a, rng = spec.rng || D.rng;
  const run = X ? new Run(0, spec.y || 0, spec.at || 0, 0) : new Run(spec.at || 0, spec.y || 0, 0, 3), speed = spec.speed || 1.5;
  const loop = len / speed, d = spec.dir < 0 ? -1 : 1, dir = run.dir(d, 0), yaw = run.yaw + (d < 0 ? Math.PI : 0);
  const start = run.pt(d > 0 ? a : z, 0, 0), ph0 = spec.phase === undefined ? rng() : spec.phase, cy = Math.cos(yaw), sy = Math.sin(yaw);
  // one car every `every` metres; or, given cars, a car at each of those places along the line when the clock reads 0
  const n = spec.cars ? spec.cars.length : Math.max(1, Math.round(len / (spec.every || 70)));
  for (let i = 0; i < n; i++) {
    const phase = spec.cars ? ((((d > 0 ? spec.cars[i] - a : z - spec.cars[i]) / len) % 1) + 1) % 1 : (ph0 + i / n) % 1, drift = [dir[0] * speed, 0, dir[1] * speed, loop];
    D.put('trolley', { p: start, yaw, color: spec.color || D.pal.doors[2], drift, phase });
    for (const sx of [-1.0, -0.5, 0, 0.5, 1.0]) for (const sz of [-0.31, 0.31]) {
      if (rng() > (spec.riders === undefined ? 0.55 : spec.riders)) continue;
      D.riders.push({ p: [start[0] + sx * cy + sz * sy, start[1] + 0.76, start[2] - sx * sy + sz * cy], yaw: yaw + (sz > 0 ? 0 : Math.PI), drift, phase, pose: 'sit', skin: pick(rng, SKIN), color: pick(rng, CLOTH), scale: rng.f(0.92, 1.05) });
    }
    for (const sx of [-1.8, 1.8]) D.rideGlows.push({ p: [start[0] + sx * cy, start[1] + 0.72, start[2] - sx * sy], color: '#ffe6b8', power: 2.2, size: 0.5, move: [drift[0], 0, drift[2]], loop, phase });
  }
  return { run, loop, n };
}

// ---------------------------------------------------------------- courts
const SIDES = ['anti', 'spin', 'front', 'back'];
/**
 * A court: an atrium cut up through several decks. Its terraces step back as they rise, so each ring of planting
 * stands in the light and the court opens toward its ceiling. A generator: `const court = yield* atrium(deck, spec)`.
 *   x0, x1, z0, z1   its floor
 *   y                the floor's height in the deck's frame (a floor two decks below the deck: -8)
 *   storeys          how many decks it is cut through (6): the ceiling is storeys x 4 m above the floor
 *   step, depth      each ring's rail stands `step` (2 m) behind the one below; a terrace is `depth` (6 m) from rail to doors
 *   sides            { anti, spin, front, back }, each { wall: n (a sheer wall n storeys tall before its terraces begin), color,
 *                    fronts: { storey: [fronts] } (see frontage(); storey 0 is the court's own floor), fill }
 *   mouths           where streets come out: [{ side, storey, at (along the side: z for anti and spin, x for front and back), width,
 *                    bridge (the width of a bridge that lands there: the rail is left open for it) }]
 *   light            { power: 1.2 (on the floor: an overcast day beside a street's lamps), color, terraces: 0.3 (their share of
 *                    it), terraceColor, walks: 0.13 (the soft lamps under each slab), gloss: 0.5 (the ceiling held in the floor), soft: 1.5 }
 *   ceiling          { panel: 5 (metres), emit: 2.6, color }
 *   floor            { color, shine: 0.6, bands (metres: darker bands of paving that far apart), bandWidth: 1.1 }
 *   fill             the terraces' fronts (default: flats); ground: the same for the court's own floor (default: flats, shops, stalls)
 *   planting         0..1 how much grows along the rails (default 1)
 *   folk             { rail: 3, stroll: 2 } people to each 100 m of terrace; floor: people to each 100 m2 of the court's floor (0.8)
 *   keep             (x, z) => false where nobody is to be stood on the court's floor (a flower bed, a class at a wall)
 * returns { y(storey), rail(side, storey), wall(side, storey) (where its rail and its doors stand: an x or a z), sideRun(side,
 * storey, out) (a Run along that side, v metres out from the floor's edge), top, floor: [x0, z0, x1, z1], void, rows }
 * The light it sets: one zone straight up from the floor, one that widens with the terraces for their open edges,
 * and one lattice of small lamps under every slab. Add a zone of your own for a wall that should be brightest.
 */
export function* atrium(D, spec) {
  const { x0, x1, z0, z1 } = spec, y0 = spec.y || 0, n = spec.storeys || 6, step = spec.step === undefined ? 2 : spec.step, depth = spec.depth || 6, pal = D.pal;
  const top = y0 + n * DECK_RISE, part = spec.part || 'court', rng = makeRng(D.seed + 'atrium' + x0 + '_' + z0), so = spec.sides || {}, lt = spec.light || {};
  const planting = spec.planting === undefined ? 1 : spec.planting, fk = { rail: 3, stroll: 2, floor: 0.8, ...(spec.folk || {}) };
  const nw = (s) => (so[s] && so[s].wall) || 0;
  const rail = (s, k) => (k >= Math.max(1, nw(s)) ? step * (k - nw(s)) : null);
  const outer = (s, k) => { const r = rail(s, k); return r === null ? (k === 0 && !nw(s) ? depth : 0) : r + depth; };
  const sideRun = (s, k, out = 0) => { const y = y0 + k * DECK_RISE; return s === 'back' ? new Run(0, y, z1 + out, 0) : s === 'front' ? new Run(0, y, z0 - out, 2) : s === 'spin' ? new Run(x1 + out, y, 0, 1) : new Run(x0 - out, y, 0, 3); };
  const span = (s, k, inner) => {
    const f = inner ? (q) => rail(q, k) || 0 : (q) => outer(q, k);
    return s === 'back' ? [x0 - f('anti'), x1 + f('spin')] : s === 'front' ? [-(x1 + f('spin')), -(x0 - f('anti'))] : s === 'anti' ? [z0 - f('front'), z1 + f('back')] : [-(z1 + f('back')), -(z0 - f('front'))];
  };
  const mouths = spec.mouths || [], rows = {};
  const stone = pal.court, fascia = shade(pal.walls[0], 0.97), soffit = shade(pal.ceiling, 0.95);
  const shine = spec.floor && spec.floor.shine !== undefined ? spec.floor.shine : 0.6;

  // the floor of the court, out to the doors under the first terrace
  {
    const P = D.pen(new Run(0, y0, 0, 0), (x0 + x1) / 2, part), fc = (spec.floor && spec.floor.color) || stone, e = 2.2;
    const X0 = x0 - outer('anti', 0), X1 = x1 + outer('spin', 0), Z0 = z0 - outer('front', 0), Z1 = z1 + outer('back', 0);
    const bc = shade(fc, 0.86), pitch = spec.floor && spec.floor.bands, bw = (spec.floor && spec.floor.bandWidth) || 1.1;
    // the paving: large slabs, crossed (if asked) by darker bands every `bands` metres
    const cuts = (a, b) => { const out = []; if (!pitch) return [[a, b, 0]]; const n = Math.max(1, Math.round((b - a) / pitch)), s = (b - a) / n; let at = a; for (let i = 1; i < n; i++) { const c = a + i * s; out.push([at, c - bw / 2, 0], [c - bw / 2, c + bw / 2, 1]); at = c + bw / 2; } out.push([at, b, 0]); return out; };
    for (const cx of cuts(x0 + e, x1 - e)) for (const cz of cuts(z0 + e, z1 - e)) { const band = cx[2] || cz[2]; P.f.tint(band ? 1 : 0.5).floor(cx[0], cz[0], cx[1], cz[1], 0, band ? shade(fc, 0.8) : fc, { emit: shine }); }
    P.f.tint(0.5);
    P.f.floor(X0, Z0, X1, z0 + e, 0, bc, { emit: shine }).floor(X0, z1 - e, X1, Z1, 0, bc, { emit: shine }).floor(X0, z0 + e, x0 + e, z1 - e, 0, bc, { emit: shine }).floor(x1 - e, z0 + e, X1, z1 - e, 0, bc, { emit: shine }).tint(0);
    P.done();
    yield 'deck: court floor';
  }
  // storey by storey, side by side
  for (let k = 0; k < n; k++) {
    for (const s of SIDES) {
      const r = rail(s, k), o = so[s] || {}, y = y0 + k * DECK_RISE;
      const given = ((o.fronts && o.fronts[k]) || []).concat(mouths.filter((m) => m.side === s && m.storey === k).map((m) => ({ from: m.at - m.width / 2, to: m.at + m.width / 2, kind: 'gap' })));
      if (r === null && k > 0 || (k === 0 && nw(s))) {
        // a sheer wall
        const sr = sideRun(s, k), sp = span(s, k, false), P = D.pen(sr, (sp[0] + sp[1]) / 2, part + k);
        wallN(P.g, sp[0], sp[1], 0, DECK_RISE, 0, o.color || pal.walls[0]);
        P.done();
        continue;
      }
      if (k === 0) {
        // the court's own floor: piers under the first terrace's edge, and fronts behind them
        const fr = sideRun(s, 0, depth), sp = span(s, 0, false);
        rows[s + 0] = yield* frontage(D, fr, { from: sp[0], to: sp[1], fronts: given, fill: o.ground || spec.ground || { mix: { flat: 2, shop: 1, stall: 0.6 }, lit: 0.6, blades: 0, awnings: 0.7 }, part: part + 0 });
        const sr = sideRun(s, 0), si = span(s, 1, true), P = D.pen(sr, (si[0] + si[1]) / 2, part + 0), np = Math.max(1, Math.round((si[1] - si[0]) / 6));
        const ways0 = mouths.filter((m) => m.side === s && m.storey === 0).map((m) => { const c = sr.u(m.at); return [c - m.width / 2 - 0.5, c + m.width / 2 + 0.5]; });
        for (let i = 0; i <= np; i++) { const u = lerp(si[0] + 0.3, si[1] - 0.3, i / np); if (!ways0.some((q) => u > q[0] && u < q[1])) P.g.box(u - 0.26, 0, step + 0.06, u + 0.26, ROOM, step + 0.58, fascia, { skip: 'tb' }); }
        P.done();
        continue;
      }
      const sr = sideRun(s, k), X = s === 'front' || s === 'back', sf = span(s, k, !X ? false : true), si = span(s, k, true), mid = (si[0] + si[1]) / 2;
      const P = D.pen(sr, mid, part + k), g = P.g, last = k === n - 1;
      // the terrace: its floor, the edge of its slab, the ceiling it makes for the walk below
      P.f.tint(1).floor(sf[0], r, sf[1], r + depth, 0, shade(stone, 0.96), { emit: shine * 0.5 }).tint(0);
      wallN(g, si[0], si[1], -1.0, 0.0, r, fascia);
      const rb = rail(s, k - 1), below = rb === null ? (k - 1 === 0 && !nw(s) ? depth : null) : rb + depth;
      if (below !== null && below > r) g.floor(sf[0], r, sf[1], below, -1.0, soffit, { down: true, emit: 0.16 });
      // a lamp under the slab every few metres, where the walk below is under cover
      if (below !== null && below > r + 1) for (let u = si[0] + 3; u < si[1] - 2; u += 6) { const v = (r + below) / 2 + 0.6; g.floor(u - 0.45, v - 0.15, u + 0.45, v + 0.15, -1.02, '#fff0d6', { down: true, emit: 3.2 * D.glowK }); D.glows.push({ p: sr.pt(u, -1.08, v), color: pal.lamp, power: 1.6 * D.glowK, size: 0.6 }); }
      const ways = mouths.filter((m) => m.side === s && m.storey === k).map((m) => { const c = sr.u(m.at); return [c - m.width / 2 - 0.4, c + m.width / 2 + 0.4]; });
      if (!last) for (let u = si[0] + 0.4, nn = Math.max(1, Math.round((si[1] - si[0] - 0.8) / 6)), i = 0; i <= nn; i++, u = lerp(si[0] + 0.4, si[1] - 0.4, i / nn)) { if (!ways.some((q) => u > q[0] && u < q[1])) g.box(u - 0.1, 0, r + step + 0.08, u + 0.1, ROOM, r + step + 0.28, shade(fascia, 0.94), { skip: 'tb' }); }
      else wallN(g, sf[0], sf[1], ROOM, DECK_RISE, r + depth, fascia);
      // the rail: a trough of plants for most of its length, a glass rail for the rest, nothing where a bridge lands
      const gaps = mouths.filter((m) => m.side === s && m.storey === k && m.bridge).map((m) => { const c = sr.u(m.at), gw = m.bridge === true ? m.width : m.bridge; return [c - gw / 2 - 0.1, c + gw / 2 + 0.1]; });
      for (let u = si[0]; u < si[1] - 0.2;) {
        const u1 = Math.min(si[1], u + 2.4 + 1.6 * rng());
        const q = gaps.find((q2) => u1 > q2[0] && u < q2[1]);
        if (q) { if (u < q[0] - 0.3) planter(u, q[0]); u = q[1]; continue; }
        if (rng() < 0.74) planter(u, u1); else glassRail(u, u1);
        u = u1;
      }
      function planter(ua, ub) {
        g.box(ua, 0, r, ub, 0.78, r + 0.5, pick(rng, pal.tub), { top: '#4f4338', skip: 'b' });
        const p0 = sr.pt((ua + ub) / 2, 0.8, r + 0.25), near = D.dist(p0[0], p0[1], p0[2]) < 90, gap = (near ? 0.7 : 1.15) / Math.max(0.2, planting);
        for (let x = ua + 0.3; x < ub - 0.2; x += gap * rng.f(0.8, 1.25)) {
          const leaf = vary(pick(rng, pal.leaf), rng, 0.16);
          D.put('bush', { p: sr.pt(x, 0.72, r + 0.25 + rng.f(-0.06, 0.06)), yaw: rng() * TAU, scale: [rng.f(0.85, 1.3), rng.f(0.8, 1.7), rng.f(0.85, 1.2)], color: leaf });
          if (rng() < 0.55 * planting) D.put('trail', { p: sr.pt(x + rng.f(-0.2, 0.2), 0.84, r - 0.03), yaw: sr.yaw, scale: [rng.f(0.8, 1.3), rng.f(0.5, 2.1), 1], color: vary(leaf, rng, 0.12) });
          if (near && rng() < 0.22 * planting) D.put('flower', { p: sr.pt(x + rng.f(-0.2, 0.2), 1.0 + rng.f(0, 0.25), r + 0.2), yaw: rng() * TAU, scale: rng.f(0.9, 1.5), color: pick(rng, pal.bloom) });
        }
      }
      function glassRail(ua, ub) {
        g.box(ua, 0, r, ub, 0.12, r + 0.14, fascia, { skip: 'b' }).box(ua, 1.0, r + 0.03, ub, 1.05, r + 0.11, pal.metal);
        for (const x of [ua + 0.03, ub - 0.03]) g.box(x - 0.025, 0.12, r + 0.045, x + 0.025, 1.0, r + 0.095, pal.metal, { skip: 'tb' });
        P.gl.quad([ub, 0.12, r + 0.07], [ua, 0.12, r + 0.07], [ua, 1.0, r + 0.07], [ub, 1.0, r + 0.07], pal.glass);
        // now and then a cloth put over the rail to air
        if (rng() < 0.3) D.put('sheet', { p: sr.pt((ua + ub) / 2, 1.07, r + 0.07), yaw: sr.yaw, scale: [Math.min(1.25, (ub - ua) / 1.6), rng.f(0.7, 1), 1], color: vary(pick(rng, pal.awnings)[0], rng, 0.15) });
      }
      P.done();
      // the flats behind, their windows on the court
      const fr = sideRun(s, k, r + depth), sp = span(s, k, false);
      rows[s + k] = yield* frontage(D, fr, { from: sp[0], to: sp[1], fronts: given, fill: o.fill || spec.fill || { mix: { flat: 1 }, bay: [5.2, 6.6], lit: 0.5, numbers: 100 * (k + 1) + 1 }, part: part + k });
      // people: at the rail looking down, and walking the terrace
      const L = si[1] - si[0];
      for (let i = 0, m = Math.round(fk.rail * L / 100 * D.density); i < m; i++) { const u = rng.f(si[0] + 0.5, si[1] - 0.5), p = sr.pt(u, 0, r + 0.86); if (!gaps.some((q) => u > q[0] - 0.6 && u < q[1] + 0.6) && D.clear(p[0], p[1] + 1.3, p[2], 1.3)) D.spots.push({ p, yaw: sr.yaw + Math.PI + rng.f(-0.3, 0.3), child: rng() < 0.1 }); }
      for (let i = 0, m = Math.round(fk.stroll * L / 100 * D.density); i < m; i++) { const rad = rng.f(0.5, 1.3), p = sr.pt(rng.f(si[0] + 1.5, si[1] - 1.5), 0, r + step + 0.6 + rad + rng.f(0, depth - step - 2.2 - 2 * rad > 0 ? depth - step - 2.2 - 2 * rad : 0)); if (D.clear(p[0], p[1] + 1.3, p[2], rad + 1.3)) D.spots.push({ p, walk: rad, child: rng() < 0.1 }); }
      if (D.clk.due()) { yield 'deck: terraces'; D.clk.go(); }
    }
  }
  // the ceiling: a field of lamps as bright as an overcast sky
  const kt = n - 1, cz = spec.ceiling || {}, pan = cz.panel || 5, emit = (cz.emit === undefined ? 2.6 : cz.emit), cc = cz.color || '#fbf7ee';
  const TX0 = x0 - outer('anti', kt), TX1 = x1 + outer('spin', kt), TZ0 = z0 - outer('front', kt), TZ1 = z1 + outer('back', kt);
  const VX0 = x0 - (rail('anti', kt) || 0) - step, VX1 = x1 + (rail('spin', kt) || 0) + step, VZ0 = z0 - (rail('front', kt) || 0) - step, VZ1 = z1 + (rail('back', kt) || 0) + step;
  {
    const P = D.pen(new Run(0, top, 0, 0), (x0 + x1) / 2, part + 'top'), g = P.g;
    g.floor(TX0, TZ0, TX1, TZ1, 0, shade(pal.ceiling, 0.6), { down: true, emit: 0.25 });
    const nx = Math.max(1, Math.round((VX1 - VX0) / pan)), nz = Math.max(1, Math.round((VZ1 - VZ0) / pan)), px = (VX1 - VX0) / nx, pz = (VZ1 - VZ0) / nz;
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) g.floor(VX0 + i * px + 0.22, VZ0 + j * pz + 0.22, VX0 + (i + 1) * px - 0.22, VZ0 + (j + 1) * pz - 0.22, -0.06, mixc(cc, pal.lamp, rng() < 0.12 ? 0.5 : 0.06 * rng()), { down: true, emit: emit * (rng() < 0.05 ? 0.55 : rng.f(0.92, 1.0)) });
      if (D.clk.due()) { yield 'deck: court ceiling'; D.clk.go(); }
    }
    // deep beams across, so the ceiling has a grain
    for (let i = 0; i <= nx; i += 2) g.box(VX0 + i * px - 0.16, -0.6, VZ0, VX0 + i * px + 0.16, 0, VZ1, shade(pal.ceiling, 0.7), { skip: 't' });
    P.done();
  }
  // light: the court's floor has the most of it; the terraces a grey share, where they stand open to the ceiling
  // (the box of that light widens as they step back); and there are soft lamps under every slab
  const pw = lt.power === undefined ? 1.2 : lt.power, sf = lt.soft || 1.5, tq = lt.terraces === undefined ? 0.3 : lt.terraces;
  D.zone({ min: [x0 - sf, y0 - 0.5, z0 - sf], max: [x1 + sf, top + 1, z1 + sf], soft: sf, color: lt.color || '#f6f2e8', power: pw * (1 - tq), side: 0.36, under: 0.5 });
  D.zone({ min: [x0 - 3, y0 - 0.5, z0 - 3], max: [x1 + 3, top + 1, z1 + 3], soft: 3, flare: step / DECK_RISE, color: lt.terraceColor || '#e3e8ea', power: pw * tq, side: 0.55, under: 0.5 });
  D.lattice({ origin: [TX0 + 1.5, y0 + DECK_RISE + ROOM - 0.1, TZ0 + 1.5], spacing: [3, 3], count: [Math.ceil((TX1 - TX0) / 3), Math.ceil((TZ1 - TZ0) / 3)], storeys: n - 1, rise: DECK_RISE, power: lt.walks === undefined ? 0.13 : lt.walks, reach: 3.2 });
  D.sky({ x0: VX0, z0: VZ0, x1: VX1, z1: VZ1, y: top, floor: y0, color: cc, power: lt.gloss === undefined ? 0.5 : lt.gloss });
  // people on the court's floor
  const area = (x1 - x0) * (z1 - z0);
  for (let i = 0, m = Math.round(fk.floor * area / 100 * D.density / 2.2); i < m; i++) {
    const x = rng.f(x0 + 2, x1 - 2), zz = rng.f(z0 + 2, z1 - 2);
    if (spec.keep && !spec.keep(x, zz)) continue;
    if (rng() < 0.55) D.knot(x, y0, zz, 2 + Math.floor(rng() * 3), rng);
    else { const rad = rng.f(0.8, 2.6); if (D.clear(x, y0 + 1.3, zz, rad + 1.4)) D.spots.push({ p: [x, y0, zz], walk: rad, child: rng() < 0.2 }); }
  }
  yield 'deck: court';
  const where = (s, v) => (s === 'back' ? z1 + v : s === 'front' ? z0 - v : s === 'spin' ? x1 + v : x0 - v);
  return {
    top, floor: [x0, z0, x1, z1], rows, storeys: n, y: (k) => y0 + k * DECK_RISE,
    rail: (s, k) => where(s, rail(s, k) || 0), wall: (s, k) => where(s, outer(s, k)), sideRun,
    void: [VX0, VZ0, VX1, VZ1],
  };
}

/**
 * A way across a court, hung from its ceiling on rods. A generator. spec: { axis, from, to, at, y, width (5), hang (the
 * ceiling's height in the deck's frame), lamps (true), rails (true: for a trolley), bare ([[from, to], ...]: stretches
 * with no rods, where another bridge crosses overhead), floor (colour), shine }. For a trolley that runs on across it,
 * call trolley() over the street's whole length.
 */
export function* bridge(D, spec) {
  const X = spec.axis !== 'z', y = spec.y || 0, w = spec.width || 5, at = spec.at || 0, pal = D.pal, part = spec.part || 'bridge';
  const a = Math.min(spec.from, spec.to), z = Math.max(spec.from, spec.to), run = X ? new Run(0, y, at, 0) : new Run(at, y, 0, 3);
  const hang = spec.hang === undefined ? y + 8 : spec.hang, fc = spec.floor || pal.court, shine = spec.shine === undefined ? 0.6 : spec.shine, steel = shade(pal.metal, 0.8);
  const n = Math.max(1, Math.round((z - a) / 6));
  for (let i = 0; i < n; i++) {
    const u0 = lerp(a, z, i / n), u1 = lerp(a, z, (i + 1) / n), P = D.pen(run, (u0 + u1) / 2, part), g = P.g;
    P.f.tint(1).floor(u0, -w / 2, u1, w / 2, 0, fc, { emit: shine }).tint(0);
    g.floor(u0, -w / 2, u1, w / 2, -0.32, shade(pal.ceiling, 0.8), { down: true });
    for (const sd of [-1, 1]) {
      const v = sd * w / 2;
      g.box(u0, -0.32, Math.min(v, v - sd * 0.16), u1, 0.14, Math.max(v, v - sd * 0.16), steel, { skip: 'b' });
      g.box(u0, 1.02, Math.min(v - sd * 0.04, v - sd * 0.12), u1, 1.07, Math.max(v - sd * 0.04, v - sd * 0.12), pal.brass);
      P.gl.quad([u1, 0.14, v - sd * 0.08], [u0, 0.14, v - sd * 0.08], [u0, 1.02, v - sd * 0.08], [u1, 1.02, v - sd * 0.08], pal.glass);
      g.box(u0 - 0.03, 0.14, v - sd * 0.08 - 0.03, u0 + 0.03, 1.02, v - sd * 0.08 + 0.03, steel, { skip: 'tb' });
      g.box(u0, -0.75, sd * w / 3 - 0.1, u1, -0.32, sd * w / 3 + 0.1, steel, { skip: 't' });
      // a rod up to the ceiling, and a lamp on it (not where the flight passes)
      const um = (u0 + u1) / 2;
      let free = !(spec.bare || []).some((q) => um > q[0] && um < q[1]);
      for (let yy = 0.6; yy < hang - y && free; yy += 0.9) { const q = run.pt(um, yy, v - sd * 0.08); free = D.clear(q[0], q[1], q[2], 2.2); }
      if (i % 2 === 0 && free) {
        g.box(um - 0.035, 1.02, v - sd * 0.08 - 0.035, um + 0.035, hang - y, v - sd * 0.08 + 0.035, steel, { skip: 'tb' });
        if (spec.lamps !== false) { g.blob(um, 2.7, v - sd * 0.08, [0.15, 0.16, 0.15], 1, '#fff0d0', { emit: 3.2 * D.glowK, shadeBottom: 1 }); D.glows.push({ p: run.pt(um, 2.7, v - sd * 0.08), color: pal.lamp, power: 2 * D.glowK, size: 0.6 }); }
      }
    }
    if (spec.rails) for (const v of [-0.5, 0.5]) g.box(u0, 0, v - 0.03, u1, 0.012, v + 0.03, pal.metal, { skip: 'b' });
    P.done();
    if (D.clk.due()) { yield 'deck: bridge'; D.clk.go(); }
  }
  yield 'deck: bridge';
  return { run, from: a, to: z, width: w };
}

// ---------------------------------------------------------------- rooms
// how far behind a lobby wall's face the middle of a cab doorway is: where a world's opening stands (see lobby())
export const DOOR_IN = 0.34;
// the run that looks out of a wall facing one of the four ways, with its middle at (x, z)
const faceRun = (x, y, z, face) => new Run(x, y, z, face === 'front' ? 0 : face === 'back' ? 2 : face === 'anti' ? 1 : 3);

/**
 * One long room: a Mill Hall, a cooked hall with a single table, baths. A generator: `const h = yield* hall(deck, spec)`.
 *   x0, x1, z0, z1, y, height (3)
 *   open      { front | back | anti | spin: [[from, to], ...] }: stretches of each wall left out (places along the deck),
 *             where a street's 'hall' front stands, or a court's terrace; true for the whole side under a beam; 'none'
 *             for no wall there at all (a lobby's doors stand in its place)
 *   wall, dado, floor (colours), shine (0.7)
 *   lamps     { spacing: [sx, sz] (4, 5), kind: 'globe' | 'panel', power: 0.9, color, reach: 3.4 }
 *   tables    { axis: 'x' | 'z', rows: 3, from, to (along that axis), taken: 0.6 (the share of seats with someone in them), dishes: true }
 *             long tables with benches, dishes under lids down the middle, a bowl at each place taken
 *   pool      { x0, x1, z0, z1, color, steam: true, bathers: 8 }: warm water let into the floor
 * returns { tables: [{ from: [x, z], to: [x, z] }], lamps: [[x, y, z], ...] }
 */
export function* hall(D, spec) {
  const { x0, x1, z0, z1 } = spec, y = spec.y || 0, H = spec.height || ROOM, pal = D.pal, part = spec.part || 'hall';
  const rng = makeRng(D.seed + 'hall' + x0 + '_' + z0), wall = spec.wall || pal.walls[0], dado = spec.dado || pal.dado[0], open = spec.open || {};
  const fc = spec.floor || pal.floor, shine = spec.shine === undefined ? 0.7 : spec.shine, top = Math.min(2.55, H - 0.4);
  // floor (round the pool, if there is one) and ceiling
  const P = D.pen(new Run(0, y, 0, 0), (x0 + x1) / 2, part), pool = spec.pool;
  P.f.tint(0.5);
  if (pool) { P.f.floor(x0, z0, x1, pool.z0, 0, fc, { emit: shine }).floor(x0, pool.z1, x1, z1, 0, fc, { emit: shine }).floor(x0, pool.z0, pool.x0, pool.z1, 0, fc, { emit: shine }).floor(pool.x1, pool.z0, x1, pool.z1, 0, fc, { emit: shine }); }
  else P.f.floor(x0, z0, x1, z1, 0, fc, { emit: shine });
  P.f.tint(0);
  P.g.floor(x0, z0, x1, z1, H, shade(pal.ceiling, 0.95), { down: true, emit: 0.26 * D.glowK });
  // beams across the shorter way
  if (x1 - x0 >= z1 - z0) for (let x = x0 + 4; x < x1 - 1; x += 4) P.g.box(x - 0.12, H - 0.24, z0, x + 0.12, H, z1, pal.rib, { skip: 't' });
  else for (let z = z0 + 4; z < z1 - 1; z += 4) P.g.box(x0, H - 0.24, z - 0.12, x1, H, z + 0.12, pal.rib, { skip: 't' });
  if (pool) {
    const wc = pool.color || '#4f9a9a', tile = shade(wc, 1.5), d = 0.14;
    P.f.floor(pool.x0, pool.z0, pool.x1, pool.z1, -d, wc, { emit: 1 });
    wallN(P.g, pool.x0, pool.x1, -d - 0.02, 0, pool.z1, tile); P.g.quad([pool.x0, -d - 0.02, pool.z0], [pool.x1, -d - 0.02, pool.z0], [pool.x1, 0, pool.z0], [pool.x0, 0, pool.z0], tile);
    P.g.quad([pool.x0, -d - 0.02, pool.z1], [pool.x0, -d - 0.02, pool.z0], [pool.x0, 0, pool.z0], [pool.x0, 0, pool.z1], tile); P.g.quad([pool.x1, -d - 0.02, pool.z0], [pool.x1, -d - 0.02, pool.z1], [pool.x1, 0, pool.z1], [pool.x1, 0, pool.z0], tile);
    for (let i = 0, n = Math.round((pool.bathers === undefined ? 8 : pool.bathers) * D.density); i < n; i++) D.spots.push({ p: [rng.f(pool.x0 + 0.5, pool.x1 - 0.5), y - 0.86, rng.f(pool.z0 + 0.5, pool.z1 - 0.5)], sit: true, color: '#d9d2c4' });
    // steam: slow soft lights going up
    if (pool.steam !== false) for (let i = 0, n = Math.round((pool.x1 - pool.x0) * (pool.z1 - pool.z0) * 0.9); i < n; i++) D.glows.push({ p: [rng.f(pool.x0, pool.x1), y + rng.f(-0.1, 0.5), rng.f(pool.z0, pool.z1)], color: '#fff1e0', power: rng.f(0.05, 0.11), size: rng.f(1.0, 2.0), move: [rng.f(-0.03, 0.03), rng.f(0.12, 0.24), rng.f(-0.03, 0.03)], loop: rng.f(8, 14), phase: rng() });
  }
  P.done();
  yield 'deck: hall';
  // walls: plain inside, with a dado, left out where the room stands open; a beam over each opening
  for (const s of SIDES) {
    if (open[s] === 'none') continue;          // no wall at all on this side: something else stands there (a lobby's doors)
    const r = s === 'back' ? new Run(0, y, z1, 0) : s === 'front' ? new Run(0, y, z0, 2) : s === 'spin' ? new Run(x1, y, 0, 1) : new Run(x0, y, 0, 3);
    const lo = s === 'back' || s === 'front' ? [x0, x1] : [z0, z1], gaps = open[s] === true ? [lo] : (open[s] || []);
    yield* frontage(D, r, { from: r.u(lo[0]), to: r.u(lo[1]), height: H, fill: false, paint: { wall, dado, trim: pal.trim[0] }, fronts: gaps.map((q) => ({ from: q[0], to: q[1], kind: 'gap' })), part });
    const Q = D.pen(r, (r.u(lo[0]) + r.u(lo[1])) / 2, part);
    for (const q of gaps) wallN(Q.g, Math.min(r.u(q[0]), r.u(q[1])), Math.max(r.u(q[0]), r.u(q[1])), top, H, -0.02, wall);      // just inside the room: a street's front may stand on the wall's own line
    Q.done();
  }
  // lamps
  const lamps = [], lo = spec.lamps === false ? null : { spacing: [4, 5], kind: 'globe', power: 0.9, reach: 3.4, ...(spec.lamps || {}) };
  if (lo) {
    const nx = Math.max(1, Math.round((x1 - x0) / lo.spacing[0])), nz = Math.max(1, Math.round((z1 - z0) / lo.spacing[1])), sx = (x1 - x0) / nx, sz = (z1 - z0) / nz;
    const ly = y + H - (lo.kind === 'globe' ? 0.62 : 0.1), col = lo.color || pal.lamp;
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const p = [x0 + (i + 0.5) * sx, ly, z0 + (j + 0.5) * sz];
      lamps.push(p); D.glows.push({ p: [p[0], p[1] - 0.04, p[2]], color: col, power: 2.1 * D.glowK, size: 0.7 });
      if (lo.kind === 'globe') D.put('pendant', { p: [p[0], y + H, p[2]], yaw: 0 });
      else { const Q = D.pen(new Run(0, y, 0, 0), p[0], part); Q.g.floor(p[0] - 0.5, p[2] - 0.18, p[0] + 0.5, p[2] + 0.18, H - 0.02, '#fff3dc', { down: true, emit: 4.2 * D.glowK }); Q.done(); }
    }
    D.lattice({ origin: [x0 + sx / 2, ly, z0 + sz / 2], spacing: [sx, sz], count: [nx, nz], color: col, power: lo.power, reach: lo.reach, drop: (H - 0.1) / 0.75 + 0.05 });
  }
  // long tables
  const tables = [], tb = spec.tables;
  if (tb) {
    const TX = tb.axis !== 'z', rows = tb.rows || 3, a = tb.from === undefined ? (TX ? x0 : z0) + 2.5 : tb.from, b = tb.to === undefined ? (TX ? x1 : z1) - 2.5 : tb.to;
    const c0 = TX ? z0 : x0, c1 = TX ? z1 : x1, nseg = Math.max(1, Math.round((b - a) / 2.4)), seg = (b - a) / nseg, taken = tb.taken === undefined ? 0.6 : tb.taken;
    const at = (al, ac, yy) => (TX ? [al, y + yy, ac] : [ac, y + yy, al]), yaw = TX ? 0 : Math.PI / 2;
    for (let r = 0; r < rows; r++) {
      const c = c0 + (c1 - c0) * (r + 0.5) / rows + (tb.shift || 0);
      tables.push({ from: at(a, c, 0), to: at(b, c, 0) });
      for (let i = 0; i < nseg; i++) {
        const al = a + (i + 0.5) * seg, sc = [seg / 2.4, 1, 1];
        D.put('tableLong', { p: at(al, c, 0), yaw, scale: sc, color: vary('#d9c6a4', rng, 0.12) });
        for (const sd of [-1, 1]) D.put('benchLong', { p: at(al, c + sd * 0.72, 0), yaw, scale: sc, color: vary('#c9b08a', rng, 0.12) });
      }
      for (let al = a + 0.6; al < b - 0.3; al += 1.2) if (tb.dishes !== false) D.put(rng() < 0.75 ? 'dish' : 'pan', { p: at(al + rng.f(-0.15, 0.15), c + rng.f(-0.08, 0.08), 0.75), yaw: rng() * TAU, scale: rng() < 0.75 ? rng.f(0.9, 1.25) : rng.f(0.5, 0.62), color: vary('#c9c8c2', rng, 0.2) });
      for (let al = a + 0.35; al < b - 0.25; al += 0.62) for (const sd of [-1, 1]) {
        if (rng() > taken) continue;
        const p = at(al + rng.f(-0.08, 0.08), c + sd * 0.72, 0.45), dirc = TX ? [0, -sd] : [-sd, 0];
        D.spots.push({ p, sit: true, yaw: Math.atan2(dirc[0], dirc[1]), child: false });
        D.put('bowl', { p: at(al, c + sd * 0.27, 0.75), yaw: 0, color: vary('#e6dfd0', rng, 0.1) });
      }
      if (D.clk.due()) { yield 'deck: tables'; D.clk.go(); }
    }
  }
  yield 'deck: hall';
  return { tables, lamps };
}

/**
 * A lift lobby's wall of cab doors (drum-transport.md: a core every 100 m, four berths to a lobby, a cab waiting in most).
 * spec: { at: [x, z] (the middle of the wall, on the floor), y, face ('front' | 'back' | 'anti' | 'spin': the way the doors look
 *   out), doors: 4, pitch: 2.6 (m from door to door), doorW: 1.5, doorH: 2.2, height: 3, width, name ('Cabs'), lines (an address
 *   to go under it), open: [i, ...] (doors standing open on a lit cab), hole: i (a door left as a bare opening: a world's way out),
 *   wall, door (colours) }
 * returns { doors: [{ p: [x, y, z] (the middle of the opening), w, h, n: [nx, nz] (the way it looks) }], run, slide(k) }
 * A world leaving by door `hole` ends its path square through that door, and stands the wall so that the path's
 * opening (path.exit.flat) is DOOR_IN metres behind the wall's face, just behind the door's leaves.
 */
export function lobby(D, spec) {
  const y = spec.y || 0, H = spec.height || ROOM, n = spec.doors || 4, pitch = spec.pitch || 2.6, dw = spec.doorW || 1.5, dh = spec.doorH || 2.2, pal = D.pal;
  const run = faceRun(spec.at[0], y, spec.at[1], spec.face || 'front'), W = spec.width || n * pitch + 1.2, rng = makeRng(D.seed + 'lobby' + spec.at[0] + '_' + spec.at[1]);
  const P = D.pen(run, 0, spec.part || 'lobby'), g = P.g, wall = spec.wall || pal.walls[0], steel = shade(pal.metal, 1.25), doors = [], out = run.dir(0, -1);
  const us = []; for (let i = 0; i < n; i++) us.push((i - (n - 1) / 2) * pitch);
  let x = -W / 2;
  for (const u of us) { wallN(g, x, u - dw / 2, 0, H, 0, wall); wallN(g, u - dw / 2, u + dw / 2, dh, H, 0, wall); x = u + dw / 2; }
  wallN(g, x, W / 2, 0, H, 0, wall);
  g.box(-W / 2, 0, -0.022, W / 2, 0.14, 0, shade(pal.metal, 0.8), { skip: 'bs' });
  us.forEach((u, i) => {
    const a = u - dw / 2, b = u + dw / 2, isOpen = (spec.open || []).includes(i), isHole = spec.hole === i, col = spec.door || pal.doors[(i * 3 + 1) % pal.doors.length];
    g.box(a - 0.1, 0, -0.05, a, dh + 0.1, 0.26, steel, { skip: 'b' }).box(b, 0, -0.05, b + 0.1, dh + 0.1, 0.26, steel, { skip: 'b' }).box(a, dh, -0.05, b, dh + 0.1, 0.26, steel);
    // the light over the door, and its number
    g.box(u - 0.2, dh + 0.18, -0.04, u + 0.2, dh + 0.3, 0, '#2f2f30', { skip: 's' }).box(u - 0.16, dh + 0.2, -0.05, u + 0.16, dh + 0.28, -0.04, isOpen || isHole ? '#b9f0c0' : '#ffcf8a', { emit: 3 * D.glowK, skip: 's' });
    D.glows.push({ p: run.pt(u, dh + 0.24, -0.08), color: isOpen || isHole ? '#b9f0c0' : '#ffcf8a', power: 1.3 * D.glowK, size: 0.45 });
    g.box(b + 0.22, 1.0, -0.03, b + 0.36, 1.3, 0, '#3a3b3c', { skip: 's' }).box(b + 0.26, 1.12, -0.04, b + 0.32, 1.18, -0.03, '#ffe0a0', { emit: 3, skip: 's' });
    if (!isOpen && !isHole) {
      for (const sd of [-1, 1]) { const p0 = sd < 0 ? a : u + 0.008, p1 = sd < 0 ? u - 0.008 : b; g.box(p0, 0.02, 0.18, p1, dh, 0.23, col, { skip: 'b' }).box(p0 + 0.12, 0.3, 0.165, p1 - 0.12, dh - 0.25, 0.18, shade(col, 1.12), { skip: 's' }); }
      g.box(a, 0.02, 0.17, b, 0.24, 0.18, steel, { skip: 's' });
    } else if (isOpen) {
      // the cab: a small lit room with a seat round it
      const cw = 2.0, cd = 1.9, ch = dh - 0.05, felt = mixc(pal.rooms[i % pal.rooms.length], col, 0.3), e = 0.4 * D.glowK;
      wallN(g, u - cw / 2, u + cw / 2, 0, ch, 0.3 + cd, felt, e);
      g.quad([u - cw / 2, 0, 0.3 + cd], [u - cw / 2, 0, 0.3], [u - cw / 2, ch, 0.3], [u - cw / 2, ch, 0.3 + cd], felt, e).quad([u + cw / 2, 0, 0.3], [u + cw / 2, 0, 0.3 + cd], [u + cw / 2, ch, 0.3 + cd], [u + cw / 2, ch, 0.3], felt, e);
      g.floor(u - cw / 2, 0.26, u + cw / 2, 0.3 + cd, 0.01, shade(felt, 0.6)).floor(u - cw / 2, 0.26, u + cw / 2, 0.3 + cd, ch, '#fff3dc', { down: true, emit: 2.2 * D.glowK });
      g.box(u - cw / 2, 0, 0.3 + cd - 0.45, u + cw / 2, 0.45, 0.3 + cd, shade(col, 0.9), { skip: 'b' });
      g.box(a - 0.02, 0.02, 0.18, a + 0.1, dh, 0.23, col, { skip: 'b' }).box(b - 0.1, 0.02, 0.18, b + 0.02, dh, 0.23, col, { skip: 'b' });
      D.glows.push({ p: run.pt(u, 1.5, 1.0), color: pal.shop, power: 1.6 * D.glowK, size: 1.6 });
    }
    doors.push({ p: run.pt(u, dh / 2, DOOR_IN), w: dw, h: dh, n: out, u });
  });
  P.done();
  const name = spec.name === undefined ? 'Cabs' : spec.name;
  if (name) D.sign(spec.lines ? [name, ...spec.lines] : name, { run, at: run.pt(0, H - 0.37, -0.014), h: spec.lines ? 0.6 : 0.36, w: spec.lines ? 2.5 : undefined, style: 'plate', font: 'cond', font2: 'serif', head: true, track: 0.16 });
  // someone waiting at about every other door
  for (const u of us) if (rng() < 0.5 && D.clear(...run.pt(u, 1.2, -1.4), 1.5)) D.spots.push({ p: run.pt(u + rng.f(-0.4, 0.4), 0, -1.2 - rng()), yaw: run.yaw + rng.f(-0.4, 0.4) });
  // the doors of the way out are two meshes of their own, so that they can part: slide(0) shut, slide(1) open
  let slide = () => { };
  if (spec.hole !== undefined && us[spec.hole] !== undefined) {
    const u = us[spec.hole], col = spec.door || pal.doors[(spec.hole * 3 + 1) % pal.doors.length], leaves = [];
    for (const sd of [-1, 1]) {
      const lg = new Geo({ maxSeg: 8 }), p0 = sd < 0 ? u - dw / 2 : u + 0.006, p1 = sd < 0 ? u - 0.006 : u + dw / 2;
      lg.at(run.ox, run.oy, run.oz, run.yaw);
      lg.box(p0, 0.02, 0.18, p1, dh, 0.23, col, { skip: 'b' }).box(p0 + 0.12, 0.3, 0.165, p1 - 0.12, dh - 0.25, 0.18, shade(col, 1.12), { skip: 's' }).box(p0, 0.02, 0.17, p1, 0.24, 0.18, steel, { skip: 's' });
      lg.pop();
      const m = lg.mesh(D.lit, D.frame); D.group.add(m); leaves.push([m, sd]);
    }
    slide = (k) => { for (const [m, sd] of leaves) { const d = run.dir(sd * Math.max(0, Math.min(1, k)) * (dw / 2 + 0.04), 0); m.rotation.z = d[0] / D.frame.floorR; m.position.z = d[1]; } };
  }
  return { doors, run, width: W, slide };
}

/** A stair on its own, in a wall: { at: [x, z] (the middle of its opening), y, face, width (3.4), height, name, sub, wall }. A generator. */
export function* stairs(D, spec) {
  const w = spec.width || 3.4, run = faceRun(spec.at[0], spec.y || 0, spec.at[1], spec.face || 'front');
  return yield* frontage(D, run, { from: -w / 2, to: w / 2, height: spec.height || ROOM, fill: false, part: spec.part || 'stair', fronts: [{ local: true, from: -w / 2, to: w / 2, kind: 'stair', name: spec.name, sub: spec.sub, wall: spec.wall }] });
}

/**
 * A direction rose inlaid in a floor: its four long points are spinward, anti, front and back (sorrel.md has one in the
 * Sixty-Two Lobby). spec: { at: [x, z], y, r (3), colors: [dark, light], words: ['Spinward', 'Anti', 'Front', 'Back'] or false, ground, ink }
 */
export function rose(D, spec) {
  const [cx, cz] = spec.at, y = (spec.y || 0) + 0.014, r = spec.r || 3, cols = spec.colors || [shade(D.pal.strip, 0.8), D.pal.brass];
  const g = D.bucket(cx, cz, 'rose').g;
  const up = (a, b, c, col) => { const s = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]); if (s > 0) g.tri(a, b, c, col); else g.tri(a, c, b, col); };
  const pt = (ang, rad) => [cx + Math.cos(ang) * rad, y, cz + Math.sin(ang) * rad];
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4, R = i % 2 ? r * 0.56 : r, tip = pt(a, R), c = [cx, y, cz];
    up(c, pt(a - Math.PI / 8, r * 0.24), tip, cols[0]); up(c, tip, pt(a + Math.PI / 8, r * 0.24), cols[1]);
  }
  for (let i = 0; i < 24; i++) { const a0 = i * TAU / 24, a1 = (i + 1) * TAU / 24; up(pt(a0, r * 1.06), pt(a1, r * 1.06), pt(a1, r * 1.12), cols[0]); up(pt(a0, r * 1.06), pt(a1, r * 1.12), pt(a0, r * 1.12), cols[0]); }
  const words = spec.words === undefined ? ['Spinward', 'Anti', 'Front', 'Back'] : spec.words;
  if (words) [[1, 0, Math.PI / 2], [-1, 0, -Math.PI / 2], [0, -1, Math.PI], [0, 1, 0]].forEach((q, i) => D.sign(words[i], { at: [cx + q[0] * r * 1.36, y + 0.004, cz + q[1] * r * 1.36], up: q[2], h: r * 0.13, style: 'plate', font: 'cond', ground: spec.ground || '#8d7c69', ink: spec.ink || '#efe2c0', track: 0.2 }));
}
