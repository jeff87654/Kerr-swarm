// Ochre, Pigment Row: the crews' baths, deck 366, at 0.51 g. Ochre "allots high decks by service on the back crews"
// (three-nights/src/15-canon.js), so the people who live up here are the ones who worked behind the raft and saw the
// sky on ordinary working days (docs/ashgrove.md, Day four; raft-transport.md, "Behind a raft"; wander-year.md, Day 226).
// Their bath is one long warm pool under a barrel vault two decks high, and over forty years they have tiled the vault
// with the River, from memory, in Pigment Row's own glazes: pale gold and orange stars, thick along the middle of the
// band and frayed at its edges, dust rifts lying along it in the brown-violet the crews call bruise, the fainter Shelf
// above and below, and patches of plain black tile where other rafts hide it. A tile is set for every shift someone
// worked. The far end is still bare render, with the drawing pinned up and a scaffold under it.
//
// The flight: the robing room at eye height, behind someone walking ahead into a doorway full of steam; through it
// and down to the water, where the vault and its double open out; along the pool low over the water, then up a
// little to look down on people floating on their backs where the River lies in it; up to the vault and along it a
// hand's breadth under the crown, close enough for single tiles, their grout and a few scratched initials; the
// unfinished end, where an old setter with a tray is being told that the Shelf is too bright; and straight up
// through a raft: a round patch of plain black tile at the crown.
//
// Co-ordinates (the deck kit's): x spinward, y up from deck 366's floor, z along the axis. The hall lies along z, so
// it is dead straight and a floating bather weighs the same whichever way they drift. The vault is half a cylinder
// 8 m in radius whose axis lies along z at floor level; below 2.5 m it stands on piers, with a low aisle behind each
// row of them. The pool is 14 m by 60, with broad steps down into it from the robing room's door.
//
// How it is drawn. The vault and the water have shaders of their own (below): one function says what the setters
// meant at any place on the vault and one what a single tile came out as; the water follows each mirrored ray to the
// half cylinder and asks the same two there, so the River in the pool is the River overhead, tile for tile. The slow
// parts of the picture (the dust's rifts, the star clouds) are worked out once as the world is built, into a texture
// 256 texels square; the sharp parts (each tile, the band's profile, the rafts' outlines) are the shaders'. All the
// light is low: a lamp at knee height on every pier, and one work lamp on the scaffold. The vault shows by the gold
// tiles' own faint glow, by its glaze (which holds the lamps, the work lamp's path of glitter, the River lying in the
// pool, and the light the water throws up) and by its double. Everything else is the deck kit's.
//
// The sums (docs/sorrel.md gives the Slow Water, "a warm bath at half a g where a wave takes thirteen seconds to
// cross"; the figure is kept here):
//   deck 366 is 3000 - 4 x 365 = 1,540 m from the axis; the drum turns once in 110 s, so g = (2 pi / 110)^2 x 1540
//     = 5.02 m/s2, 0.51 of a g.
//   The pool is 1.2 m deep, and the ripples a bather makes are a metre or two long, so they are deep-water waves:
//     a crest runs at sqrt(g L / 2 pi). The ripple that crosses the pool's 14 m in 13 s runs at 1.077 m/s and is
//     1.45 m long, with a crest every 1.35 s. At the rim the same ripple would cross in 9.3 s.
//   The same push stands a wave sqrt(9.81 / 5.02) = 1.4 times as tall as at the rim (equal energy, half the weight).
//   A ring spreading from a bather is drawn as deep water spreads one (Cauchy and Poisson): the surface at r metres
//     and t seconds goes as cos(g t^2 / 4 r), long waves leading and short ones following, its metre-and-a-half band
//     moving out at half a crest's speed.
//   The drum's turning shifts a ripple's rate by the drum's own, 0.057 rad/s, up for a crest running spinward and
//     down for one running anti (the water under a spinward crest is going round a little faster than the deck, and
//     weighs more). For the 1.45 m ripple that is 1.2% either way: 12.8 s across spinward, 13.2 s anti. It is in the
//     numbers; nobody could see it.
//   Steam rises on buoyancy, which goes as sqrt(g): about seven tenths as fast as at the rim, so it hangs.
//   Tiles are 4 cm. The vault's 20 m of arc by 71 m holds about 890,000 of them. At some 240 shifts a year a hand
//     works about 9,600 in a forty-year career (Hedda's, in ashgrove.md), so a tile a shift over forty years is the
//     work of about a hundred hands at a time: a dock's twelve sleds crewed round the clock.
//   One thing is not as water is: the pool is drawn a better mirror than it would be. Looking straight down, water
//     gives back a fiftieth of the light and this gives back two fifths. (The pool is lined with the rafts' black
//     tile, so a real one would hold the vault as cleanly, only dimmer.)
//
// Not canon:
// - The baths, the vault and its tiles, and the custom of a tile for every shift. The docs give Sorrel a Slow Water on
//   deck 359 and a room for retired back crews called the Bruise on deck 366 (sorrel.md), and give Ochre high decks
//   for service on the back crews; they say nothing of what Ochre's high decks hold. The deck number is borrowed.
// - The hall's plan: the half cylinder on piers, the aisles, the robing room, the steps into the water, the pool's
//   black lining; the scaffold, the drawing pinned across the far wall and the sheets pinned to the bare vault.
// - That the mural follows the kit's sky (kit/outside.js, buildSky): the same band, rifts and Shelf, laid along the
//   vault at 30 m of tile to a radian of sky, with rafts drawn over about a thirtieth of it as the kit draws them.
// - The setter, the other old hand and their argument. Tilde (54, a back-crew hand, still working) is in the docs;
//   she is quoted on the card and on a chalked board, and is not shown. That the Shelf is too bright is her opinion
//   here only. So is the tally of who agrees.
// - Every word written up: the tile count and "a tile a shift, bring your book", the tally about the Shelf, lids on
//   cups, the tea and robes notices, the board over the door, the plate for Crew Street (the street is Ochre's, in
//   15-canon.js; that the baths open off it is not).
// - Robes, lidded cups, the tea urn and crew numbers on lockers. (eating-out.md has people eating in robes at the Keel
//   Baths Kitchen, and ashgrove.md has a drum's baths heated free off the food plant's 65 degree loop, which is what
//   the two lagged pipes in the robing room are; the rest is invented.)
import {
  Scene, Mesh, ShaderMaterial, BufferGeometry, Float32BufferAttribute, InstancedBufferGeometry, InstancedBufferAttribute, Vector3, Vector4,
  DataTexture, RGBAFormat, UnsignedByteType, LinearFilter, ClampToEdgeWrapping, DoubleSide, FrontSide, AdditiveBlending,
} from 'three';
import { makePath } from '../core/path.js';
import { makeFrame, deckRadius, DEG } from '../kit/drum.js';
import { makeDeck, finish, PALETTES } from '../kit/deck.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG, NOISE_GLSL } from '../kit/mats.js';
import { Geo, instances, shade, fitBounds, rgb } from '../kit/geo.js';
import { SKIN } from '../kit/folk.js';
import { makeRng, noise2, fbm2 } from '../core/rng.js';

// ---------------------------------------------------------------- the hall's numbers (metres, flat)
const VR = 8;                          // the vault's radius: a half cylinder with its axis at floor level
const XA = 7.6, YS = 2.5;              // the piers' faces, and where the vault springs from them (7.6^2 + 2.5^2 = 8^2)
const PW = 7, PZ0 = -30, PZ1 = 30;     // the pool: 14 m by 60
const STEP0 = -32.4;                   // and the top of the broad steps that go down into it from the robing room's door
const HZ0 = -34, HZ1 = 37;             // the hall's two end walls
const WY = -0.12;                      // the water's surface
const DEPTH = 1.2;                     // the pool's depth
const TILE = 0.04;                     // a tile, grout and all
const KS = 30;                         // metres of vault to a radian of sky
const BAY = 4, PIER0 = -32, NPIER = 18;   // piers every 4 m, the first at z = -32; a lamp low on each
const LX = 7.52, LY = 0.55;            // the lamps: on the piers' faces, low
const ZF = 33.2;                       // about where the tiling has got to
const EXIT_Z = 28.3;                   // the raft the flight leaves by: a round black patch at the crown
const GEE = Math.pow((2 * Math.PI) / 110, 2) * deckRadius(366);      // 5.02 m/s2
const AW = 11.6, AH = 2.9;                // the aisles: how far out their back walls stand, and their ceilings
const SC = { x0: -3.1, x1: 0.5, z0: 30.3, z1: 33.5, top: 5.9 };      // the scaffold: its plan, and the height of its working deck
const AISLE_WALL = '#5c4852', AISLE_DADO = '#3b2a36', AISLE_CEIL = '#463a38', PIER_FACE = '#54444c';      // the aisles are kept dark, so the robes show
const SLATE = { ground: '#2b2226', ink: '#efe6d2' }, ENAMEL = { ground: '#e9dfc8', ink: '#3d2438' };      // signs: the kit's slate is green-grey and its enamel is lettered in blue, and this place has neither colour
const FLD = { w: 256, h: 256, x0: -10.24, xs: 20.48, z0: -35, zs: 72.96 };      // the River's slow parts as a texture: its size in texels, and the stretch of vault it covers (arc from the crown; along the hall)
const F = (x) => { const s = Number(x).toFixed(5); return s.indexOf('.') < 0 ? s + '.0' : s; };      // a number as GLSL text
const C = (hex, k = 1) => { const c = rgb(hex); return 'vec3(' + F(c[0] * k) + ', ' + F(c[1] * k) + ', ' + F(c[2] * k) + ')'; };       // a colour as GLSL text, in linear light

// ---------------------------------------------------------------- the River in tile
// One function says what the setters meant at any place on the vault, and one says what a single tile came out as.
// The vault's own shader calls them at the tile under each pixel; the water's shader calls the same two at the place
// where a mirrored ray meets the vault. Where a tile is smaller than a pixel both draw what a great many tiles come
// to, so nothing shimmers. The slow parts of the picture (the dust's rifts, the star clouds) are worked out once, when
// the world is built, into a small texture that all of them read: see riverField().
const RIVER_GLSL = /* glsl */`
const float VR = ${F(VR)}, TILE = ${F(TILE)}, KS = ${F(KS)};
const vec3 PALE = ${C('#f4d089')}, GOLD = ${C('#e8a640')}, ORANGE = ${C('#ee7636')}, STRAW = ${C('#dcb974')};
const vec3 BRUISE1 = ${C('#93607f')}, BRUISE2 = ${C('#6b4162')}, BRUISE3 = ${C('#38222f')}, SHELF = ${C('#a3906c')};
const vec3 DARK1 = ${C('#0e0b0d')}, DARK2 = ${C('#17100f')}, DARK3 = ${C('#1d1519')}, BLACK = ${C('#050505')};
const vec3 GROUT = ${C('#3b322c')}, RENDER = ${C('#8f7b68')}, CHALK = ${C('#efe9dc')}, PAPER = ${C('#e9dfc8')}, CHARCOAL = ${C('#2e2824')};
uniform vec4 uExit;        // the raft the flight leaves by: arc from the crown, z, half its width across, half its length
uniform sampler2D tField;  // the picture's slow parts (riverField): the rifts' two noises, the star clouds of the band and of its core
const vec2 FLD0 = vec2(${F(FLD.x0)}, ${F(FLD.z0)}), FLDS = vec2(${F(FLD.xs)}, ${F(FLD.zs)});
// (Everything from here to the water is written without branches or early returns, as sums and choices by step():
// the same shaders written with them took the graphics driver ten and fifteen seconds to compile.)
//
// Other rafts: flat black shapes lying level, their number falling as the cube of their width. One to a cell at each
// of two sizes (half a metre and more; a hand's breadth and more), kept inside its cell so that a place need ask
// only its own. (The sky's specks would be a tile or two each, and a black tile among dark ones is not a shape.)
// pm: a pixel's size there, in metres, round the vault and along it. A raft less than a pixel or two across is left
// out (seen at one point a pixel, small ones came and went as the eye moved), as the kit's sky leaves out its smallest
float kRaftIn(vec2 m, vec2 pm, float cell, float lo, float hi, float share, float seed) {
  vec2 c = floor(m / cell);
  vec2 h = kHash2(c + seed), h2 = kHash2(c + seed + 19.3);
  float w = inversesqrt(1.0 / (lo * lo) - h.y * (1.0 / (lo * lo) - 1.0 / (hi * hi)));
  float sq = mix(0.36, 0.8, kHash(c + seed + 5.5));
  vec2 half_ = 0.5 * vec2(w * sq, w);
  vec2 ctr = (c + 0.5) * cell + (h2 - 0.5) * (cell - 2.0 * half_);
  vec2 d = (m - ctr) / half_; d *= d;
  vec2 seen = 1.0 - smoothstep(0.8, 2.0, pm / half_);
  return step(h.x, share) * step(dot(d, d), 1.0) * seen.x * seen.y;
}
float kRafts(vec2 m, vec2 pm) {
  vec2 e = (m - uExit.xy) / uExit.zw; e *= e;
  float e4 = dot(e, e);
  float others = max(kRaftIn(m, pm, 3.4, 0.5, 1.7, 0.55, 3.0), kRaftIn(m, pm, 0.92, 0.14, 0.46, 0.5, 71.0));
  return mix(others * step(2.6, e4), 1.0, step(e4, 1.0));       // the way out, and a clear margin round it so that it reads as one shape
}
// how far the tiling has got: a ragged front near the far end, stepped by the course
float kSet(vec2 m) {
  float zf = ${F(ZF)} + 2.2 * (kNoise(vec2(m.x * 0.3, 3.0)) - 0.5) + 0.5 * kHash(vec2(floor(m.x / 0.24), 9.0)) - 1.6 * exp(-m.x * m.x / 9.0);
  return step(m.y, zf);
}
// What the setters meant at a place on the vault (m: metres of arc from the crown, metres along the hall).
//   A: the share of tiles that are stars; of the rest, the share that are bruise; of what is left, the share that are
//      Shelf; and 1 inside a raft.   B: how hot the stars are; how deep the dust; 1 where tiles are set (0: bare render)
//   pm: a pixel's size there in metres, round the vault and along it
void kField(vec2 m, vec2 pm, out vec4 A, out vec4 B) {
  float l = m.y / KS + 1.9, b = m.x / KS;
  vec4 T = texture2D(tField, (m - FLD0) / FLDS);
  // dust, as the kit's sky has it (kit/outside.js, kDust): long rifts lying along the River, patches at its middle
  // and where it frays into the Shelf
  float lanes = smoothstep(0.8, 0.98, 1.0 - abs(2.0 * T.r - 1.0));
  float mid = exp(-b * b / 0.0009), body = exp(-b * b / 0.012), edge = exp(-pow((abs(b) - 0.115) / 0.045, 2.0));
  float tau = lanes * (0.9 * body + 0.8 * edge) + 0.6 * mid * smoothstep(0.4, 0.75, T.g) + 0.8 * edge * smoothstep(0.5, 0.85, T.g);
  float bb = b / (1.0 + 0.45 * (kNoise(vec2(l * 3.0, 2.0)) - 0.5));                    // broader here, narrower there
  float river = exp(-bb * bb / 0.009) * T.b * 1.7, core = exp(-bb * bb / 0.0018) * T.a * 1.8;
  float shelf = exp(-abs(b) / 0.3), ext = exp(-tau * 1.7);
  A.x = clamp((0.62 * river + 0.42 * core) * ext + 0.022 * shelf + 0.004, 0.0, 0.9);
  A.y = clamp(1.5 * tau * (0.25 + river + 0.5 * shelf), 0.0, 0.96);
  // the Shelf: brighter toward the newest work, which is what the argument on the scaffold is about
  A.z = clamp(0.16 * shelf * (1.0 + 1.6 * smoothstep(${F(ZF - 14)}, ${F(ZF - 1)}, m.y)), 0.0, 0.6);
  A.w = kRafts(m, pm);
  B = vec4(clamp(core * ext, 0.0, 1.0), clamp(tau * 0.75, 0.0, 1.0), kSet(m), 0.0);
}
// one tile: its glaze, and the little light a gold one gives back
void kPick(vec2 id, vec4 A, vec4 B, out vec3 alb, out vec3 emi) {
  vec2 h = kHash2(id); float v = 0.8 + 0.4 * kHash(id + 31.7);          // no two firings come out alike
  float hot = 0.07 + 0.3 * B.x, veryHot = step(h.y, hot * 0.5);
  vec3 star = mix(mix(mix(STRAW, PALE, step(h.y, 0.55 + 0.3 * B.x)), GOLD, step(h.y, hot)), ORANGE, veryHot);
  vec3 bru = mix(mix(BRUISE1, BRUISE2, smoothstep(0.1, 0.5, B.y)), BRUISE3, smoothstep(0.4, 0.95, B.y + 0.35 * (h.y - 0.5)));
  vec3 drk = mix(mix(DARK3, DARK2, step(h.y, 0.85)), DARK1, step(h.y, 0.6));
  // a star; or, of the rest, bruise; or, of what is left, Shelf; or dark
  float r1 = (h.x - A.x) / (1.0 - A.x), r2 = (r1 - A.y) / (1.0 - A.y);
  vec4 t = mix(mix(mix(vec4(drk, 0.0), vec4(SHELF, 0.16), step(r2, A.z)), vec4(bru, 0.09), step(r1, A.y)), vec4(star, 0.5 + 0.12 * veryHot), step(h.x, A.x));
  float tile = 1.0 - A.w;                                               // (a raft is plain black, and gives nothing back)
  alb = mix(BLACK, t.rgb * v, tile); emi = t.rgb * (v * t.a * tile);
}
// and what a great many of them come to (rafts aside: whoever asks knows whether it stands in one)
void kMeanTile(vec4 A, vec4 B, out vec3 alb, out vec3 emi) {
  float hot = 0.07 + 0.3 * B.x, pale = 0.55 + 0.3 * B.x - hot;
  vec3 so = ORANGE * (0.5 * hot), sg = GOLD * (0.5 * hot) + PALE * pale + STRAW * (1.0 - hot - pale);
  vec3 br = mix(mix(BRUISE1, BRUISE2, smoothstep(0.1, 0.5, B.y)), BRUISE3, smoothstep(0.4, 0.95, B.y));
  vec3 dk = DARK1 * 0.6 + DARK2 * 0.25 + DARK3 * 0.15;
  float pb = (1.0 - A.x) * A.y, ps = (1.0 - A.x) * (1.0 - A.y) * A.z, pd = (1.0 - A.x) * (1.0 - A.y) * (1.0 - A.z);
  alb = A.x * (so + sg) + pb * br + ps * SHELF + pd * dk;
  emi = A.x * (so * 0.62 + sg * 0.5) + pb * br * 0.09 + ps * SHELF * 0.16;
}`;

// The River's slow parts, worked out once on the way in: at every 8 cm round the vault and 28 cm along it, the two
// noises the dust is cut from (long rifts lying along the River; patches) and the star clouds of the band and of its
// core. The construction is the kit's sky (kit/outside.js: kDust, kSky) on core/rng.js's noise, so the rifts lie
// along the River as they do behind the raft. What is sharp (a rift's edge, the band's own profile, a raft's outline,
// how far the tiling has got) is left to the shaders, which read this between its texels.
// (Worked out in the shaders instead, at every pixel, this was nineteen noises a pixel: most of what the vault and
// the water cost to draw, and most of the ten and fifteen seconds the graphics driver took to compile them.)
// SEED chooses which River: 4 has gold, orange and a rift of bruise along the stretch the flight passes closest.
function* riverField() {
  const { w, h, x0, xs, z0, zs } = FLD, data = new Uint8Array(w * h * 4), SEED = 4;
  let t0 = performance.now(), k = 0;
  for (let j = 0; j < h; j++) {
    const z = z0 + ((j + 0.5) / h) * zs, l = z / KS + 1.9, qx = l * 5;
    for (let i = 0; i < w; i++) {
      const x = x0 + ((i + 0.5) / w) * xs, b = x / KS, qy = b * 20;
      const warp = noise2(qx * 0.6 + 3.1, qy * 0.6 + 3.1, SEED + 3) - 0.5;
      const n1 = fbm2(qx * 0.6 + warp * 1.2 + 11, qy + warp * 1.6 + 11, 4, SEED + 11), n2 = fbm2(qx * 1.7 + 40, qy * 1.7 + 40, 4, SEED + 40);
      const clouds = 0.72 + 0.56 * noise2(x * 1.3 + 7, z * 1.3 + 7, SEED + 7);                // star clouds, most of a metre across
      const river = (0.7 + 0.6 * fbm2(l * 4 + 5, b * 14 + 5, 4, SEED + 5)) * clouds, core = (0.6 + 0.8 * fbm2(l * 9 + 2, b * 30 + 2, 4, SEED + 2)) * clouds;
      data[k++] = Math.round(255 * n1); data[k++] = Math.round(255 * n2); data[k++] = Math.round(255 * Math.min(1, river / 1.7)); data[k++] = Math.round(255 * Math.min(1, core / 1.8));
      // (asked every 64 tiles' worth and not once a row: the first time through, before the browser has made this loop quick, a row is slow)
      if ((i & 63) === 63 && performance.now() - t0 > 3.5) { yield 'baths: the River'; t0 = performance.now(); }
    }
  }
  const tex = new DataTexture(data, w, h, RGBAFormat, UnsignedByteType);
  tex.minFilter = tex.magFilter = LinearFilter; tex.wrapS = tex.wrapT = ClampToEdgeWrapping; tex.generateMipmaps = false; tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------- the hall, as light
// Everything here works in the hall's own flat co-ordinates, where the vault is a true cylinder and a mirrored ray is
// a straight line. (The hall lies along the axis, so bending it onto the drum moves nothing by more than 2 cm.)
const HALL_GLSL = /* glsl */`
uniform vec3 uBend; uniform float uTime, uPx;
const float XA = ${F(XA)}, YS = ${F(YS)}, HZ0 = ${F(HZ0)}, HZ1 = ${F(HZ1)}, WY = ${F(WY)};
const float LX = ${F(LX)}, LY = ${F(LY)}, LZ0 = ${F(PIER0)}, LDZ = ${F(BAY)}, LN = ${F(NPIER)}, PWD = ${F(PW)}, PZA = ${F(STEP0)}, PZB = ${F(PZ1)};
const vec3 SCX = vec3(${F(SC.x0)}, ${F(SC.x1)}, ${F(SC.top)});
const vec3 WORKP = vec3(${F(SC.x0 + 0.24)}, ${F(SC.top + 1.44)}, ${F(SC.z0 + 0.1)}), WORKC = ${C('#ffe2b8', 12)};
const float AW = ${F(AW)}, AH = ${F(AH)};
const vec3 LAMPC = ${C('#ffb066', 9)}, PIERC = ${C(PIER_FACE)}, AWALLC = ${C(AISLE_WALL)}, ADADOC = ${C(AISLE_DADO)}, ACEILC = ${C(AISLE_CEIL)}, ENDC = ${C('#2e2229')}, DOORC = ${C('#ffc98e', 0.5)};
// the eye, in the hall's own co-ordinates
vec3 kEye() {
  vec3 c = cameraPosition;
  float a = mod(atan(c.y, c.x) - uBend.x + 3.14159265, 6.2831853) - 3.14159265;
  return vec3(a * uBend.z, uBend.z - length(c.xy), c.z - uBend.y);
}
// steam in the air: far things go toward its own warm dusk
vec3 kFog(vec3 c, float d) { return mix(c, uHaze.rgb, 1.0 - exp(-uHaze.w * d)); }
// the work lamp on the scaffold, held in something glazed: one point, so it lays a path of glitter along the tiles toward it
vec3 kWorkSpec(vec3 P, vec3 Rd, float rough) {
  vec3 d = WORKP - P; float t = max(dot(d, Rd), 0.0);
  vec3 miss = d - Rd * t; float sig = 0.06 + rough * t;
  return WORKC * (exp(-dot(miss, miss) / (sig * sig)) * min(1.0, 0.0036 / (sig * sig)) * step(1e-4, t));
}
// What else a glazed tile holds when its mirrored ray goes down to the pool: the River again, lying in the water
vec3 kSheen(vec3 Q, vec3 Rd) {
  vec3 W = Q + Rd * ((WY - Q.y) / min(Rd.y, -0.05));
  return GOLD * (0.3 * exp(-W.x * W.x / 5.0) * step(abs(W.x), PWD) * step(PZA, W.z) * step(W.z, PZB) * step(Rd.y, -0.05));
}
// One row of lamps, held the same way. P: the place; Rd: the mirrored ray; rough: how far the glaze scatters it; lx:
// the row. The ray's nearest pass to the row's line is found, and the nearest lamp along the row to that.
float kRowSpec(vec3 P, vec3 Rd, float rough, float lx) {
  vec2 L2 = vec2(lx, LY);
  float t = max(dot(L2 - P.xy, Rd.xy) / max(dot(Rd.xy, Rd.xy), 1e-6), 0.0);
  vec2 miss = P.xy + Rd.xy * t - L2;
  float zc = P.z + Rd.z * t, dz = zc - (LZ0 + clamp(floor((zc - LZ0) / LDZ + 0.5), 0.0, LN - 1.0) * LDZ);
  float sig = 0.07 + rough * t;
  return exp(-(dot(miss, miss) + dz * dz) / (sig * sig)) * min(1.0, 0.0049 / (sig * sig)) * step(1e-4, t);
}
vec3 kLampSpec(vec3 P, vec3 Rd, float rough) { return LAMPC * (kRowSpec(P, Rd, rough, -LX) + kRowSpec(P, Rd, rough, LX)) + kWorkSpec(P, Rd, rough); }
#ifdef NEAR
// Initials, scratched through the glaze before firing: two letters of up to four strokes each, on a tile here and
// there and on the ones the world names (uInit: the tile, and its two letters; uGlyph: sixteen letters, four strokes each)
uniform vec4 uInit[6]; uniform vec4 uGlyph[64];
float kSeg(vec2 p, vec4 s) { vec2 pa = p - s.xy, ba = s.zw - s.xy; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }
float kGlyph(vec2 p, float ch) { int k = int(ch) * 4; return min(min(kSeg(p, uGlyph[k]), kSeg(p, uGlyph[k + 1])), min(kSeg(p, uGlyph[k + 2]), kSeg(p, uGlyph[k + 3]))); }
void kScratch(vec2 id, vec2 f, float w, float close, inout vec3 alb, inout vec3 emi) {
  // by chance, one tile in 770: its two letters, and whether it has any
  vec2 hs = kHash2(id + 77.7);
  vec3 let = vec3(floor(vec2(hs.y, kHash(id + 55.5)) * 15.99), step(hs.x, 0.0013));
  for (int i = 0; i < 6; i++) let = mix(let, vec3(uInit[i].zw, 1.0), step(abs(id.x - uInit[i].x), 0.5) * step(abs(id.y - uInit[i].y), 0.5));
  // read from below by someone facing the far end: up the tile is back along the hall, and to the right is anti
  vec2 q = vec2(1.0 - f.x, 1.0 - f.y), sk = (kHash2(id + 3.9) - 0.5) * 0.12;
  q += vec2(sk.x * (q.y - 0.5), sk.y * (q.x - 0.5));
  float d = min(kGlyph((q - vec2(0.13, 0.26)) / 0.3, let.x), kGlyph((q - vec2(0.57, 0.24)) / 0.3, let.y));
  float px = w / 0.3, k = (1.0 - smoothstep(0.075 - px * 0.5, 0.075 + px * 0.5, d)) * close * let.z;
  // down to the clay: pale on a dark glaze, dark on a pale one
  alb = mix(alb, mix(${C('#cdb894')}, ${C('#4f3d2c')}, step(0.2, dot(alb, vec3(0.3, 0.6, 0.1)))), 0.88 * k); emi *= 1.0 - k;
}
#endif
// the far end, where the tiles have not come yet: trowelled render, chalk lines every twenty-four tiles, and the
// drawing pinned up in sheets, each a pale copy of what is to go there (mean: what a great many tiles there would come
// to; raft: 1 inside one). Its fine detail is drawn on the vault itself and not in its mirror image.
vec3 kBare(vec2 m, float pm, float raft, vec3 mean) {
  vec2 q = m / vec2(1.18, 0.86) + vec2(0.37, 0.0), qi = floor(q), qf = q - qi;
  float lean = (kHash(qi + 5.1) - 0.5) * 0.05;
  vec2 d = abs(qf - 0.5 + vec2(0.0, lean * (qf.x - 0.5))) - vec2(0.41, 0.4);
  float sheet = step(kHash(qi + 3.3), 0.7) * (1.0 - smoothstep(-pm * 0.6, pm * 0.6, max(d.x * 1.18, d.y * 0.86)));
  vec3 c = RENDER, paper = PAPER;
#ifdef NEAR
  c *= 0.84 + 0.3 * kFbm(m * vec2(2.4, 0.8) + 3.0);
  vec2 g = abs(fract(m / 0.96 + 0.5) - 0.5) * 0.96;
  c = mix(c, CHALK, 0.6 * (1.0 - smoothstep(0.003, 0.006 + pm, min(g.x, g.y))) * (0.35 + 0.65 * kNoise(m * 14.0)) * smoothstep(0.08, 0.02, pm));
  paper *= 0.9 + 0.12 * kNoise(m * 23.0);
#endif
  vec3 wash = mix(paper, paper * 0.25 + mean * 1.5, 0.62);                                    // crayon and wash, pale
  wash = mix(wash, CHARCOAL, 0.8 * raft);                                                       // rafts, blocked in
#ifdef NEAR
  vec2 sq = abs(fract(m / 0.24 + 0.5) - 0.5) * 0.24;                                            // squared up for the courses
  wash = mix(wash, CHARCOAL, 0.3 * (1.0 - smoothstep(0.002, 0.004 + pm, min(sq.x, sq.y))) * smoothstep(0.03, 0.008, pm));
#endif
  wash *= 1.0 - 0.5 * smoothstep(0.03, 0.0, min(-d.x * 1.18, -d.y * 0.86)) * smoothstep(0.02, 0.005, pm) * step(0.5, kHash(qi + 9.0));   // a curled edge
  return mix(c, wash, sheet);
}
// The far wall: bare render, and pinned right across it the whole vault drawn small, a sheet to every six metres of
// hall, squared up for the courses, with a rust line where the tiling has got to. m: the place on the wall (x, y)
vec3 kEndWall(vec2 m, float pm) {
  vec3 c = RENDER * (0.84 + 0.3 * kFbm(m * vec2(0.9, 2.4) + 9.0));
  vec2 d = abs(m - vec2(0.0, 4.4)) - vec2(6.2, 1.75);
  float on = 1.0 - smoothstep(-pm, pm, max(d.x, d.y));
  vec2 vm = vec2((m.y - 4.4) * ${F(-(2 * VR * Math.asin(XA / VR)) / 3.5)}, HZ0 + (m.x + 6.2) * ${F((HZ1 - HZ0) / 12.4)});      // the place on the vault this spot stands for
  vec4 A, B; kField(vm, vec2(pm * ${F((HZ1 - HZ0) / 12.4)}), A, B);
  vec3 alb, emi; kMeanTile(A, B, alb, emi);
  float sh = floor((m.x + 6.2) / 1.033);
  vec3 paper = PAPER * (0.86 + 0.14 * kHash(vec2(sh, 4.0))) * (0.93 + 0.1 * kNoise(m * 17.0));
  vec3 wash = mix(paper, paper * 0.22 + alb * 1.7, 0.7);
  wash = mix(wash, CHARCOAL, 0.85 * A.w);
  vec2 sq = abs(fract(vm / 2.0 + 0.5) - 0.5) * 2.0 / ${F((HZ1 - HZ0) / 12.4)};                   // a line to every two metres of vault
  wash = mix(wash, CHARCOAL, 0.35 * (1.0 - smoothstep(0.004, 0.008 + pm, min(sq.x, sq.y))) * smoothstep(0.05, 0.015, pm));
  wash = mix(wash, ${C('#a5482c')}, (1.0 - smoothstep(0.012, 0.02 + pm, abs(vm.y - ${F(ZF)}) / ${F((HZ1 - HZ0) / 12.4)})) * 0.9);
  wash *= 1.0 - 0.3 * (1.0 - smoothstep(0.0, 0.012 + pm, abs(fract((m.x + 6.2) / 1.033 + 0.5) - 0.5) * 1.033));     // where one sheet laps the next
  return mix(c, wash, on);
}
// What the vault's own gold gives back to the rest of it: hundreds of thousands of tiles each glowing a little light
// the whole vault a little, which is what shows the bruise for the colour it is
const vec3 GIVEN = ${C('#ffd9a0', 0.075)};
// Lamp light thrown up off the moving water onto the vault's feet: a slow net of light, strongest low down and over
// each lamp
vec3 kCaustic(vec3 Q) {
  float h = smoothstep(7.2, 2.6, Q.y);
  vec2 q = vec2(Q.z, Q.y * 1.3 + abs(Q.x) * 0.2);
  float t = uTime * 0.16;
  float n = kNoise(q * 0.9 + vec2(t, -0.6 * t)) + 0.5 * kNoise(q * 2.1 - vec2(0.7 * t, t) + 9.0);
  float web = pow(max(1.0 - abs(n - 0.75) * 3.4, 0.0), 2.0);
  return LAMPC * (0.02 * web * h * h * (0.6 + 0.4 * cos((Q.z - LZ0) / LDZ * 6.2831853)));
}
// The vault's surface at Q, seen with a pixel fw tiles wide (round the vault, and along it): its colour, the light
// it gives of itself, which way its glaze faces, and g = (how glazed; how far the glaze scatters; how far off, from 0
// where tiles are told apart to 1 where they are not; how much this one tile sparkles).
// With NEAR (the vault itself, not its mirror image) tiles also get their domed faces, their lips and their scratches.
void kVaultSurf(vec3 Q, vec2 fw, out vec3 alb, out vec3 emi, out vec3 Nt, out vec4 g) {
  float phi = atan(Q.x, Q.y);
  vec2 uv = vec2(phi * VR, Q.z) / TILE, id = floor(uv), f = uv - id;
  vec4 A, B; kField((id + 0.5) * TILE, fw * TILE, A, B);
  vec3 N = vec3(-sin(phi), -cos(phi), 0.0), Tu = vec3(cos(phi), -sin(phi), 0.0);
  float w = max(fw.x, fw.y), lod = smoothstep(1.0, 2.2, w);
  vec3 mean; kMeanTile(A, B, mean, emi);
  alb = mix(mean, BLACK, A.w); emi *= 1.0 - A.w;                         // (a raft is plain black, and gives nothing back)
  // far off: a grain about two pixels across each way, round the vault and along it (seen at a slant a pixel takes
  // in many more tiles along the hall than round it), about as strong as that many tiles together would leave.
  // (Set by hand, tiles clump: the grain dies away more slowly than chance alone would have it.)
  vec2 lv = log2(max(fw, vec2(1.0)) * 2.0), s0 = exp2(floor(lv)), fr = lv - floor(lv), q0 = uv / s0 + 13.0, q1 = 0.5 * uv / s0 + 13.0;
  float gr = mix(mix(kNoise(q0) - 0.5, (kNoise(vec2(q1.x, q0.y)) - 0.5) * 0.81, fr.x), mix((kNoise(vec2(q0.x, q1.y)) - 0.5) * 0.81, (kNoise(q1) - 0.5) * 0.66, fr.x), fr.y) * pow(s0.x * s0.y, -0.3);
  float k = clamp(1.0 + 5.0 * gr * min(sqrt((1.0 - A.x) / (A.x + 0.02)), 3.0) * (1.0 - A.w), 0.3, 2.6);
  alb *= k; emi *= k;
  // near: the tiles themselves, each one colour: this one and the three neighbours the pixel may lap over, each in
  // the share of it that the pixel covers
  vec2 p = clamp(fw, vec2(0.02), vec2(2.0)), side = step(0.5, f) * 2.0 - 1.0;
  vec2 own = min(f + 0.5 * p, 1.0) - max(f - 0.5 * p, 0.0), nb = clamp(0.5 * p - f, 0.0, 1.0) + clamp(f + 0.5 * p - 1.0, 0.0, 1.0);
  vec3 a00, e00, a10, e10, a01, e01, a11, e11;
  kPick(id, A, B, a00, e00); kPick(id + vec2(side.x, 0.0), A, B, a10, e10); kPick(id + vec2(0.0, side.y), A, B, a01, e01); kPick(id + side, A, B, a11, e11);
  float tw = (own.x + nb.x) * (own.y + nb.y);
  alb = mix(((a00 * own.x + a10 * nb.x) * own.y + (a01 * own.x + a11 * nb.x) * nb.y) / tw, alb, lod);
  emi = mix(((e00 * own.x + e10 * nb.x) * own.y + (e01 * own.x + e11 * nb.x) * nb.y) / tw, emi, lod);
  // grout, as much of it as the pixel holds
  const float GH = ${F(0.0017 / TILE)};
  vec2 e = min(f, 1.0 - f), pg = max(fw, vec2(0.02));
  vec2 cov = max(vec2(0.0), min(e + 0.5 * pg, vec2(GH)) - max(e - 0.5 * pg, vec2(-GH))) / pg;
  cov = mix(cov, vec2(2.0 * GH), smoothstep(0.5, 1.2, fw));
  float gt = 1.0 - (1.0 - cov.x) * (1.0 - cov.y);
  alb = mix(alb, GROUT, gt); emi *= 1.0 - gt;
  // each tile sits a little out of true, so the glaze breaks a lamp into glitter
  vec2 hh = kHash2(id + 7.7), tl = (hh - 0.5) * 0.085 * (1.0 - lod);
#ifdef NEAR
  // and close to, its face is slightly domed (no two alike), the glaze thins at its lip, and one in some hundreds is signed
  float close = 1.0 - smoothstep(0.25, 1.0, w);
  tl += (f - 0.5 + (hh.yx - 0.5) * 0.5) * (0.1 + 0.3 * hh.x) * close;
  alb *= 1.0 - 0.22 * close * smoothstep(0.36, 0.5, max(abs(f.x - 0.5), abs(f.y - 0.5)));
  kScratch(id, f, w, close, alb, emi);
#endif
  // where the tiles have not come yet: bare render, and the drawing
  float bare = 1.0 - B.z;
  alb = mix(alb, kBare(uv * TILE, w * TILE, A.w, mean), bare); emi *= B.z;
  Nt = normalize(N + (Tu * tl.x + vec3(0.0, 0.0, tl.y)) * B.z);
  g = vec4((1.0 - gt) * B.z, 0.012 + 0.03 * lod, lod, 0.25 + 1.6 * pow(kHash(id + 91.3), 6.0));
}
// What the glaze adds to a place on the vault seen along V: the lamps, the River lying in the pool, and the light off
// the water (cst), which a tile here and there throws back
vec3 kGlaze(vec3 Q, vec3 V, vec3 Nt, vec4 g, vec3 cst) {
  float fres = 0.1 + 0.9 * pow(1.0 - max(dot(Nt, V), 0.0), 5.0);
  vec3 Rd = reflect(-V, Nt);
  return g.x * (fres * (1.6 * kLampSpec(Q, Rd, g.y) + kSheen(Q, Rd)) + cst * (0.5 * mix(g.w, 0.48, g.z)));
}`;

// What a mirror at P sees along Rd: the vault, or under its foot a pier, the lintel or an aisle, or an end wall.
// blur: the angle that ripples too fine to draw scatter it through; d0: how far the eye is from the mirror.
// All three are worked out and one is chosen, so that the light is asked for once.
const MIRROR_GLSL = /* glsl */`
// The far wall as the water holds it: the render, the drawing as a pale band with the River's gold along its middle,
// and the scaffold's posts, ledgers and decks before it
vec3 kEndFar(vec2 m, float pm) {
  vec2 d = abs(m - vec2(0.0, 4.4)) - vec2(6.2, 1.75);
  vec3 c = mix(RENDER * 0.95, mix(PAPER * 0.55, GOLD * 0.8, 0.6 * exp(-pow((m.y - 4.4) / 0.4, 2.0))), step(max(d.x, d.y), 0.0));
  float u = (m.x - SCX.x) / (SCX.y - SCX.x);
  float post = min(min(abs(u), abs(u - 0.5)), abs(u - 1.0)) * (SCX.y - SCX.x) - 0.05;
  float bar = min(min(abs(m.y - 1.95), abs(m.y - 3.9)), min(abs(m.y - SCX.z), abs(m.y - SCX.z - 1.0))) - 0.06;
  return mix(c, ${C('#3a2c20')}, step(-0.03, u) * step(u, 1.03) * step(m.y, SCX.z + 1.05) * (1.0 - smoothstep(-pm, pm, min(post, bar))) * 0.9);
}
vec3 kHall(vec3 P, vec3 Rd, float blur, float d0) {
  float spread = 1.0 / uPx + blur;
  // where the ray meets the vault's cylinder, and where it meets the end wall it is heading for
  float a = max(dot(Rd.xy, Rd.xy), 1e-6), b = dot(P.xy, Rd.xy), cc = dot(P.xy, P.xy) - VR * VR;
  float t = (-b + sqrt(max(b * b - a * cc, 0.0))) / a;
  float far_ = step(0.0, Rd.z), sz = far_ * 2.0 - 1.0, te = (mix(HZ0, HZ1, far_) - P.z) / (sz * max(abs(Rd.z), 1e-5));
  vec3 Qv = P + Rd * t, Nv = -normalize(vec3(Qv.xy, 0.0));
  float isEnd = step(te, t), low = (1.0 - isEnd) * step(Qv.y, YS), isV = (1.0 - isEnd) * (1.0 - low);
  // the vault
  vec3 alb, emi, Nt; vec4 g;
  // how much of the vault one pixel of the water holds: read off its neighbours, since a ripple squeezes the
  // picture here and stretches it there (a mirror's own flat reckoning made the squeezed parts glitter)
  vec2 uq = vec2(atan(Qv.x, Qv.y) * VR, Qv.z) / TILE;
  vec2 fq = vec2(length(vec2(dFdx(uq.x), dFdy(uq.x))), length(vec2(dFdx(uq.y), dFdy(uq.y))));
  kVaultSurf(Qv, min(fq, vec2(4096.0)) + blur * (d0 + t) / TILE, alb, emi, Nt, g);
  // under its foot: a pier or the lintel; or, between two piers, the aisle's back wall or its ceiling
  float sx = step(0.0, Rd.x) * 2.0 - 1.0, rx = sx * max(abs(Rd.x), 1e-5);
  float ta = (sx * XA - P.x) / rx, tb = (sx * AW - P.x) / rx, tc = (AH - P.y) / max(Rd.y, 1e-4);
  vec3 Qp = P + Rd * ta, Qw = P + Rd * tb;
  float pier = max(step(abs((fract((Qp.z - LZ0) / LDZ + 0.5) - 0.5) * LDZ), 0.5), step(2.15, Qp.y)), ceil_ = (1.0 - pier) * step(AH, Qw.y);
  vec3 albl = mix(mix(mix(AWALLC, ADADOC, step(Qw.y, 1.0)), ACEILC, ceil_), PIERC, pier);
  float tl = mix(mix(tb, tc, ceil_), ta, pier);
  // an end wall: the far one, or the near one of dark tile with the robing room's lit door in it
  vec3 Qe = P + Rd * te;
  float door = (1.0 - far_) * step(abs(Qe.x), 1.3) * step(Qe.y, 2.5);
  vec3 albe = mix(ENDC, kEndFar(Qe.xy, spread * (d0 + te)), far_) * (1.0 - door);
  // whichever it is, lit once
  float ts = mix(mix(t, tl, low), te, isEnd);
  vec3 Qs = P + Rd * ts, Ns = mix(mix(Nt, mix(vec3(-sx, 0.0, 0.0), vec3(0.0, -1.0, 0.0), ceil_), low), vec3(0.0, 0.0, -sz), isEnd);
  vec3 cst = kCaustic(Qv) * isV;
  vec3 c = mix(mix(alb, albl, low), albe, isEnd) * (kLight(Qs, Ns, Qs, Ns) + cst + GIVEN * isV) + emi * isV + DOORC * (door * isEnd) + isV * kGlaze(Qv, normalize(P - Qv), Nt, g, cst);
  return kFog(c, d0 + ts);
}`;

const FLAT_VERT = /* glsl */`
${BEND_PARS}
varying vec3 vW; varying vec3 vF;
void main() {
  vec3 p = position, n = vec3(0.0, 1.0, 0.0);
  vF = p;
  kBend(p, n);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const vaultFrag = (rig) => /* glsl */`
${CLIP_PARS}
varying vec3 vW; varying vec3 vF;
${rig.glsl}
${NOISE_GLSL}
${RIVER_GLSL}
${HALL_GLSL}
void main() {
  ${CLIP_FRAG}
  vec2 uv = vec2(atan(vF.x, vF.y) * VR, vF.z) / TILE;
  vec2 fw = vec2(length(vec2(dFdx(uv.x), dFdy(uv.x))), length(vec2(dFdx(uv.y), dFdy(uv.y))));
  vec3 alb, emi, Nt; vec4 g; kVaultSurf(vF, fw, alb, emi, Nt, g);
  vec3 cst = kCaustic(vF);
  vec3 c = alb * (kLight(vF, Nt, vF, Nt) + cst + GIVEN) + emi + kGlaze(vF, normalize(kEye() - vF), Nt, g, cst);
  gl_FragColor = vec4(kAir(c, vW), 1.0);
}`;

const endFrag = (rig) => /* glsl */`
${CLIP_PARS}
varying vec3 vW; varying vec3 vF;
${rig.glsl}
${NOISE_GLSL}
${RIVER_GLSL}
${HALL_GLSL}
void main() {
  ${CLIP_FRAG}
  vec3 N = vec3(0.0, 0.0, -1.0);
  float pm = length(vW - cameraPosition) / uPx;
  gl_FragColor = vec4(kAir(kEndWall(vF.xy, pm) * kLight(vW, N, vF, N), vW), 1.0);
}`;

// ---------------------------------------------------------------- steam
// Soft puffs that face the eye, climb slowly, widen and thin. They fade as the eye comes up to them, so that flying
// through the doorway is flying through a veil and not through discs. One draw call for all of them.
const STEAM_VERT = /* glsl */`
attribute vec3 aPos;      // where it starts (flat)
attribute vec4 aKind;     // its width (m), how fast it climbs (m/s), the seconds before it starts over, where in that it began
attribute float aPow;
${BEND_PARS}
uniform float uTime;
varying vec3 vW; varying vec3 vQ; varying float vA;
void main() {
  float u = fract(uTime / aKind.z + aKind.w);
  vec3 p = aPos + vec3(0.3 * sin(uTime * 0.21 + aKind.w * 40.0) * u, aKind.y * aKind.z * u, 0.3 * cos(uTime * 0.17 + aKind.w * 31.0) * u);
  vec3 n = vec3(0.0, 1.0, 0.0);
  kBend(p, n);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz;
  vec4 mv = viewMatrix * wp;
  mv.xy += position.xy * (aKind.x * (0.55 + 0.9 * u));
  vQ = vec3(position.xy * 2.0, aKind.w * 61.0 + uTime * 0.035);
  vA = aPow * smoothstep(0.0, 0.3, u) * smoothstep(1.0, 0.5, u) * smoothstep(1.0, 3.2, -mv.z);
  // a puff the eye is inside of has faded to nothing, and would fill the picture with nothing: it is not drawn at all
  gl_Position = vA > 0.0005 ? projectionMatrix * mv : vec4(2.0, 2.0, 2.0, 1.0);
}`;
const STEAM_FRAG = /* glsl */`
${CLIP_PARS}
uniform vec3 uTint;
varying vec3 vW; varying vec3 vQ; varying float vA;
${NOISE_GLSL}
void main() {
  ${CLIP_FRAG}
  // a puff is not a disc: its edge is eaten away, differently for each, and slowly
  float n = 0.62 * kNoise(vQ.xy * 1.3 + vQ.z) + 0.38 * kNoise(vQ.xy * 2.9 - vQ.z + 7.0);
  float a = max(1.0 - dot(vQ.xy, vQ.xy) * (0.55 + 0.9 * n), 0.0);
  gl_FragColor = vec4(uTint * (vA * a * a * (0.5 + n)), 1.0);
}`;
// puffs: [{ p, size, rise, loop, phase, power }]
function steamMesh(puffs, frame, tint) {
  const n = puffs.length, g = new InstancedBufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const aPos = new Float32Array(n * 3), aKind = new Float32Array(n * 4), aPow = new Float32Array(n);
  puffs.forEach((q, i) => { aPos.set(q.p, i * 3); aKind.set([q.size, q.rise, q.loop, q.phase], i * 4); aPow[i] = q.power; });
  g.setAttribute('aPos', new InstancedBufferAttribute(aPos, 3));
  g.setAttribute('aKind', new InstancedBufferAttribute(aKind, 4));
  g.setAttribute('aPow', new InstancedBufferAttribute(aPow, 1));
  g.instanceCount = n;
  const c = rgb(tint);
  const m = new Mesh(g, new ShaderMaterial({
    uniforms: { uClip: G.uClip, uTime: G.uTime, uBend: { value: new Vector3(frame.a0, frame.z0, frame.floorR) }, uTint: { value: new Vector3(c[0], c[1], c[2]) } },
    vertexShader: STEAM_VERT, fragmentShader: STEAM_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending,
  }));
  m.frustumCulled = false; m.renderOrder = 11;
  return m;
}

// ---------------------------------------------------------------- the water
// A mirror that moves. Its slope at each pixel is the sum of a few trains of ripples, each turning at the rate water
// 1.2 m deep gives its length at 0.51 g, and of the rings spreading from each bather (see the sums at the top). The
// mirrored ray is followed to the vault and the tile found there.
const NW = 6, NR = 16;
const waterFrag = (rig) => /* glsl */`
${CLIP_PARS}
varying vec3 vW; varying vec3 vF;
${rig.glsl}
${NOISE_GLSL}
${RIVER_GLSL}
${HALL_GLSL}
${MIRROR_GLSL}
uniform vec4 uWave[${NW}];      // a train: its wavenumber across the pool and along it, how fast its phase turns, its height
uniform vec4 uRing[${NR}];      // a bather: x, z, the seconds between stirrings, where in that they began
const float GEE = ${F(GEE)}, K0 = ${F((2 * Math.PI) / 1.45)};
void main() {
  ${CLIP_FRAG}
  vec3 E = kEye(), P = vec3(vF.x, WY, vF.z);
  vec3 V = E - P; float d0 = length(V); V /= d0;
  float pm = d0 / uPx / max(V.y, 0.04);                    // a pixel's length on the water
  vec2 sl = vec2(0.0); float lost = 0.0;
  for (int i = 0; i < ${NW}; i++) {
    vec4 w = uWave[i]; float k = length(w.xy), keep = smoothstep(0.5, 0.16, pm * k / 6.2832), ak = w.w * k;
    sl += (w.xy / k) * (ak * keep * cos(dot(w.xy, P.xz) - w.z * uTime + float(i) * 1.7));
    lost += 0.5 * ak * ak * (1.0 - keep * keep);           // ripples too fine to draw blur the mirror instead
  }
  for (int i = 0; i < ${NR}; i++) {
    vec4 r = uRing[i]; float per = max(r.z, 1.0);          // (a ring nobody makes has no period, and comes to nothing)
    vec2 dv = P.xz - r.xy; float rr = max(length(dv), 0.25), tt = mod(uTime + r.w, per);
    float ph = GEE * tt * tt / (4.0 * rr), kl = ph / rr;   // deep water's ring: the phase, and the wavenumber it has brought here
    float env = exp(-pow((kl - K0) / (0.5 * K0), 2.0)) * smoothstep(0.0, 2.0, tt) * smoothstep(per, per - 5.0, tt) / sqrt(rr + 0.5) * step(0.5, r.z);
    sl += (dv / rr) * (0.008 * env * kl * smoothstep(0.5, 0.16, pm * kl / 6.2832) * sin(ph));
  }
  vec3 N = normalize(vec3(-sl.x, 1.0, -sl.y));
  vec3 Rd = reflect(-V, N); Rd.y = max(Rd.y, 0.015); Rd = normalize(Rd);
  float fres = 0.42 + 0.58 * pow(1.0 - max(dot(N, V), 0.0), 3.0);
  vec3 refl = kHall(P, Rd, 2.0 * sqrt(lost), d0) + kLampSpec(P, Rd, 0.004 + sqrt(lost));
  // the pool is lined with the rafts' plain black tile, so all that shows of it is what the lamps reach by its walls
  vec3 body = ${C('#1c1614')} * (0.03 + 0.3 * exp(-(PWD - abs(P.x)) / 1.2));
  gl_FragColor = vec4(kAir(body * (1.0 - fres) + refl * fres, vW), 1.0);
}`;

function gridMesh(pos, nu, nv, material, frame) {
  const idx = [];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return fitBounds(new Mesh(g, material), frame);
}
// the vault: 20 m of arc from pier to pier, the length of the hall
function vaultMesh(deck, uniforms) {
  const PH = Math.asin(XA / VR), NP = 48, NZ = 10, pos = [];
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NP; i++) { const ph = -PH + (2 * PH * i) / NP; pos.push(VR * Math.sin(ph), VR * Math.cos(ph), HZ0 + ((HZ1 - HZ0) * j) / NZ); }
  return gridMesh(pos, NP, NZ, new ShaderMaterial({ uniforms, defines: { NEAR: 1 }, vertexShader: FLAT_VERT, fragmentShader: vaultFrag(deck.rig), side: DoubleSide }), deck.frame);
}
function waterMesh(deck, uniforms) {
  const NX = 4, NZ = 8, pos = [];
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) pos.push(-PW + (2 * PW * i) / NX, WY, STEP0 + ((PZ1 - STEP0) * j) / NZ);
  return gridMesh(pos, NX, NZ, new ShaderMaterial({ uniforms, vertexShader: FLAT_VERT, fragmentShader: waterFrag(deck.rig), side: FrontSide }), deck.frame);
}
// Initials. The sixteen letters a scratch may be (T H M K V A L N E O X Y Z W I F), each up to four strokes between
// points of a grid one wide and one and a half tall
const PEN = { a: [0, 0], b: [1, 0], c: [0, 1.5], d: [1, 1.5], l: [0, 0.75], r: [1, 0.75], t: [0.5, 1.5], u: [0.5, 0], o: [0.5, 0.75], m: [0.25, 0.75], n: [0.75, 0.75], e: [0.7, 0.75], v: [0.25, 0], w: [0.75, 0] };
const LETTERS = ['cd tu', 'ac bd lr', 'ac co od db', 'ac ld lb', 'cu ud', 'at tb mn', 'ca ab', 'ac cb bd', 'ac cd le ab', 'ac cd db ba', 'ad cb', 'co do ou', 'cd da ab', 'cv vo ow wd', 'tu', 'ac cd le'];
function glyphUniform() {
  const out = [];
  for (const l of LETTERS) { const st = l.split(' '); for (let i = 0; i < 4; i++) out.push(st[i] ? new Vector4(...PEN[st[i][0]], ...PEN[st[i][1]]) : new Vector4(9, 9, 9, 9.5)); }
  return out;
}
// and the tiles that carry them along the stretch the flight passes closest: [tiles round from the crown, tiles along
// the hall, and two letters by their numbers in that list]. Others turn up by chance, one tile in 770.
const INITIALS = [[27, 401, 3, 5], [30, 409, 9, 7], [25, 418, 6, 2], [28, 428, 8, 4], [23, 439, 11, 0], [26, 452, 13, 1]];
// trains of ripples: [length (m), heading (x, z), height (m)]. The first is the one that takes thirteen seconds
const TRAINS = [[1.45, [1, 0.12], 0.004], [1.38, [-1, 0.2], 0.0022], [7.5, [0.1, 1], 0.007], [3.1, [-0.5, -0.85], 0.003], [0.8, [0.7, -0.7], 0.0006], [0.55, [-0.3, 0.95], 0.0004]];
function trainUniforms() {
  return TRAINS.map(([len, dir, h]) => {
    const k = (2 * Math.PI) / len, n = Math.hypot(dir[0], dir[1]), kx = (k * dir[0]) / n, kz = (k * dir[1]) / n;
    // water of this depth at this weight; and a crest running spinward turns faster by the drum's own rate, anti slower
    const w = Math.sqrt(GEE * k * Math.tanh(k * DEPTH)) + ((2 * Math.PI) / 110) * (kx / k);
    return new Vector4(kx, kz, w, h);
  });
}

// ---------------------------------------------------------------- the hall's shell
// Piers and lamps, the lintel the vault springs from, the coping, the two low aisles, the end walls and the landing.
// All of it is the deck kit's own geometry, lit by the deck's lamps.
const PIER = '#463840', PIER2 = PIER_FACE, CORN = '#9a846c', DOORW = 1.3, DOORH = 2.45, RZ0 = -48, RZ1 = -34.35, RW = 4.6;
function* buildHall(deck) {
  const pal = deck.pal, wall = AISLE_WALL, dado = AISLE_DADO;
  for (const sd of [-1, 1]) {
    const b = deck.bucket(sd * 9, 0, 'side' + sd), g = b.g, f = b.f;
    const bx = (a0, y0, z0, a1, y1, z1, col, o) => g.box(Math.min(sd * a0, sd * a1), y0, z0, Math.max(sd * a0, sd * a1), y1, z1, col, o);
    // a wall that faces the pool, at |x| = a
    const face = (a, z0, z1, y0, y1, col, e = 0) => (sd > 0 ? g.quad([a, y0, z0], [a, y0, z1], [a, y1, z1], [a, y1, z0], col, e) : g.quad([-a, y0, z1], [-a, y0, z0], [-a, y1, z0], [-a, y1, z1], col, e));
    bx(XA, 2.15, HZ0, XA + 0.55, AH, HZ1, PIER, { skip: 't' });                     // the lintel
    bx(XA - 0.06, 2.36, HZ0, XA, 2.5, HZ1, CORN);                                    // and the lip the tiles start from
    for (let i = 0; i < NPIER; i++) {
      const z = PIER0 + i * BAY;
      bx(XA, 0.16, z - 0.5, XA + 0.55, 2.15, z + 0.5, i % 5 === 3 ? shade(PIER2, 1.12) : PIER2, { skip: 'tb' });
      bx(XA - 0.04, 0, z - 0.56, XA + 0.59, 0.16, z + 0.56, PIER, { skip: 'b' });
      // the lamp: a strip of light under a hood, at knee height
      bx(XA - 0.16, 0.64, z - 0.15, XA, 0.69, z + 0.15, '#2e2826');
      bx(XA - 0.04, 0.47, z - 0.1, XA, 0.64, z + 0.1, '#ffe0ac', { emit: 5 * deck.glowK });
      deck.glow([{ p: [sd * LX, LY, z], color: '#ffb066', power: 2.3, size: 0.3 }]);
      if (i % 5 === 4) yield 'baths: piers';
    }
    // the aisle behind: back wall with a dado and a rail of pegs, ceiling, ends
    face(AW, HZ0, HZ1, 1.0, AH, wall); face(AW - 0.022, HZ0, HZ1, 0, 1.0, dado);
    bx(AW - 0.05, 1.0, HZ0, AW, 1.05, HZ1, pal.trim[0]);
    bx(AW - 0.05, 1.72, HZ0, AW, 1.8, HZ1, pal.trim[1]);
    g.floor(Math.min(sd * (XA + 0.55), sd * AW), HZ0, Math.max(sd * (XA + 0.55), sd * AW), HZ1, AH, AISLE_CEIL, { down: true });
    for (const [z, dir] of [[HZ0, 1], [HZ1, -1]]) {
      const x0 = Math.min(sd * XA, sd * AW), x1 = Math.max(sd * XA, sd * AW);
      if (dir > 0) g.quad([x0, 0, z], [x1, 0, z], [x1, AH, z], [x0, AH, z], wall); else g.quad([x1, 0, z], [x0, 0, z], [x0, AH, z], [x1, AH, z], wall);
      // a doorway in it, dark beyond: the people who walk the aisles come and go by these
      const d0 = Math.min(sd * 8.95, sd * 10.45), d1 = Math.max(sd * 8.95, sd * 10.45), zf = z + dir * 0.012;
      if (dir > 0) g.quad([d0, 0, zf], [d1, 0, zf], [d1, 2.15, zf], [d0, 2.15, zf], '#0e090b'); else g.quad([d1, 0, zf], [d0, 0, zf], [d0, 2.15, zf], [d1, 2.15, zf], '#0e090b');
      g.box(d0 - 0.1, 0, Math.min(z, z + dir * 0.06), d0, 2.25, Math.max(z, z + dir * 0.06), pal.trim[0], { skip: 'b' }).box(d1, 0, Math.min(z, z + dir * 0.06), d1 + 0.1, 2.25, Math.max(z, z + dir * 0.06), pal.trim[0], { skip: 'b' });
      g.box(d0, 2.15, Math.min(z, z + dir * 0.06), d1, 2.25, Math.max(z, z + dir * 0.06), pal.trim[0]);
    }
    yield 'baths: aisle';
    // floors: the coping by the water, wet and polished; the aisle, duller
    f.tint(1).floor(Math.min(sd * PW, sd * XA), STEP0, Math.max(sd * PW, sd * XA), PZ1, 0, '#5c4c48', { emit: 1 });
    f.tint(0.5).floor(Math.min(sd * XA, sd * AW), HZ0, Math.max(sd * XA, sd * AW), HZ1, 0, pal.floor, { emit: 0.55 }).tint(0);
    // the pool's wall where it stands out of the water
    face(PW, STEP0, PZ1, WY - 0.25, 0, '#141012');
    bx(PW - 0.03, -0.035, STEP0, PW + 0.02, 0.0, PZ1, '#3a302e');
    yield 'baths: piers';
  }
  const b = deck.bucket(0, 0, 'ends'), g = b.g, f = b.f;
  // the landing inside the door, its edge, the far apron and the pool's far wall
  f.tint(1).floor(-XA, HZ0, XA, STEP0, 0, '#5c4c48', { emit: 0.9 }).floor(-XA, PZ1, XA, HZ1, 0, '#5c4c48', { emit: 0.8 }).tint(0);
  g.quad([-PW, WY - 0.25, STEP0], [PW, WY - 0.25, STEP0], [PW, 0, STEP0], [-PW, 0, STEP0], '#2a2220');
  g.quad([PW, WY - 0.25, PZ1], [-PW, WY - 0.25, PZ1], [-PW, 0, PZ1], [PW, 0, PZ1], '#141012');
  // the near end wall, hall side: dark tile from floor to vault, with the robing room's door in it
  const N = 38, top = (x) => Math.sqrt(Math.max(VR * VR - x * x, 0));
  for (let i = 0; i < N; i++) {
    const x0 = -XA + (2 * XA * i) / N, x1 = -XA + (2 * XA * (i + 1)) / N, y0 = Math.abs((x0 + x1) / 2) < DOORW ? DOORH : 0;
    g.quad([x0, y0, HZ0], [x1, y0, HZ0], [x1, top(x1), HZ0], [x0, top(x0), HZ0], '#2e2229');
  }
  yield 'baths: ends';
}
// the far wall as one mesh of its own (its drawing is the shader's)
function endWallMesh(deck, uniforms) {
  const N = 38, pos = [];
  for (let j = 0; j <= 1; j++) for (let i = 0; i <= N; i++) { const x = -XA + (2 * XA * i) / N; pos.push(x, j ? Math.sqrt(VR * VR - x * x) : 0, HZ1); }
  return gridMesh(pos, N, 1, new ShaderMaterial({ uniforms, vertexShader: FLAT_VERT, fragmentShader: endFrag(deck.rig), side: DoubleSide }), deck.frame);
}

// ---------------------------------------------------------------- the robing room
// Off Crew Street, no higher than a room: lockers with crew numbers down one side, robes on pegs down the other, a
// bench before each, and the door to the water at the far end with the slates beside it.
function* buildRobing(deck, rng, tally) {
  const pal = deck.pal, b = deck.bucket(0, -41, 'robing'), g = b.g, f = b.f, c = b.c, H = 3, wall = pal.walls[2], dado = pal.dado[1], trim = pal.trim[0];
  f.tint(0.5).floor(-RW, RZ0, RW, HZ0, 0, '#7a685c', { emit: 0.5 }).tint(0);
  g.floor(-RW, RZ0, RW, RZ1, H, shade(pal.ceiling, 1.0), { down: true, emit: 0.12 });
  for (let z = RZ0 + 2.3; z < RZ1 - 1; z += 3.4) g.box(-RW, H - 0.22, z - 0.11, RW, H, z + 0.11, pal.rib, { skip: 't' });
  // side walls and the street end
  for (const sd of [-1, 1]) {
    const x = sd * RW;
    if (sd > 0) { g.quad([x, 0, RZ0], [x, 0, RZ1], [x, H, RZ1], [x, H, RZ0], wall); g.quad([x - 0.02, 0, RZ0], [x - 0.02, 0, RZ1], [x - 0.02, 1.0, RZ1], [x - 0.02, 1.0, RZ0], dado); }
    else { g.quad([x, 0, RZ1], [x, 0, RZ0], [x, H, RZ0], [x, H, RZ1], wall); g.quad([x + 0.02, 0, RZ1], [x + 0.02, 0, RZ0], [x + 0.02, 1.0, RZ0], [x + 0.02, 1.0, RZ1], dado); }
    g.box(Math.min(x, x - sd * 0.04), 1.0, RZ0, Math.max(x, x - sd * 0.04), 1.05, RZ1, trim);
  }
  g.quad([-RW, 0, RZ0], [RW, 0, RZ0], [RW, H, RZ0], [-RW, H, RZ0], wall);
  // the wall with the door in it, and the doorway's jambs and head, as deep as the wall is thick
  for (const [x0, x1, y0] of [[-RW, -DOORW, 0], [DOORW, RW, 0], [-DOORW, DOORW, DOORH]]) {
    g.quad([x1, y0, RZ1], [x0, y0, RZ1], [x0, H, RZ1], [x1, H, RZ1], wall);
    if (!y0) g.quad([x1, 0, RZ1 - 0.02], [x0, 0, RZ1 - 0.02], [x0, 1.0, RZ1 - 0.02], [x1, 1.0, RZ1 - 0.02], dado);
  }
  for (const sd of [-1, 1]) g.box(Math.min(sd * DOORW, sd * (DOORW + 0.14)), 0, RZ1 - 0.06, Math.max(sd * DOORW, sd * (DOORW + 0.14)), DOORH + 0.14, HZ0, trim, { skip: 'b' });
  g.box(-DOORW, DOORH, RZ1 - 0.06, DOORW, DOORH + 0.14, HZ0, trim);
  yield 'baths: robing room';
  // lamps: three plain panels, kept low so the door ahead is the bright thing
  for (const z of [-45.4, -41.9, -38.5]) { g.floor(-0.5, z - 0.16, 0.5, z + 0.16, H - 0.02, '#fff0d6', { down: true, emit: 2.6 * deck.glowK }); deck.glow([{ p: [0, H - 0.08, z], color: pal.lamp, power: 1.2, size: 0.6 }]); }
  deck.lattice({ origin: [0, H - 0.1, -45.4], spacing: [1, 3.45], count: [1, 3], color: '#ffcf9a', power: 0.62, reach: 3.2, drop: 4 });
  yield 'baths: robing room';
  // lockers down the anti side, each with its crew's number; a few stand open
  const LK = ['#6b4162', '#8a5a3a', '#7a5078', '#a8783a', '#5a3f52', '#9a6a3a', '#70485a', '#b98a3a'];
  let n = 0;
  for (let z = RZ0 + 0.5; z < RZ1 - 2.6; z += 0.62, n++) {
    const col = shade(LK[(n * 5 + 2) % LK.length], rng.f(0.8, 1.05)), open = n % 7 === 4, x = -RW + 0.02;
    g.box(x, 0.12, z, x + 0.5, 2.0, z + 0.58, shade(col, 0.55), { skip: 'bw' });
    if (open) { g.box(x + 0.5, 0.14, z + 0.56, x + 0.98, 1.98, z + 0.6, col); g.box(x + 0.06, 0.2, z + 0.04, x + 0.44, 1.2, z + 0.54, '#1a1416', { skip: 'w' }); c.tint(0).quad([x + 0.3, 1.0, z + 0.1], [x + 0.3, 1.0, z + 0.5], [x + 0.34, 1.8, z + 0.48], [x + 0.34, 1.8, z + 0.12], '#d9c9a8'); }
    else { g.box(x + 0.5, 0.14, z + 0.02, x + 0.53, 1.98, z + 0.56, col, { skip: 'w' }); g.box(x + 0.53, 1.0, z + 0.44, x + 0.56, 1.12, z + 0.47, pal.brass); for (let k = 0; k < 3; k++) g.box(x + 0.53, 1.72 + k * 0.06, z + 0.14, x + 0.535, 1.75 + k * 0.06, z + 0.44, shade(col, 0.5), { skip: 'w' }); }
    if (!open) deck.sign(String(tally.crew0 + n * 3 + (n % 4)), { at: [x + 0.535, 1.52, z + 0.29], n: [1, 0], h: 0.11, w: 0.24, style: 'plate', ...ENAMEL, font: 'cond' });
    if (n % 7 === 6) yield 'baths: lockers';
  }
  g.box(-RW, 0, RZ0, -RW + 0.52, 0.12, RZ1 - 2.6, '#3a2f2c', { skip: 'b' });
  // a runner worn pale down its middle, and overhead the two lagged pipes of the 65 degree loop on their way to the pool
  g.box(-0.95, 0, RZ0 + 0.5, 0.95, 0.012, RZ1 - 0.4, '#5a3350', { skip: 'b' });
  g.box(-0.42, 0.012, RZ0 + 0.5, 0.42, 0.014, RZ1 - 0.4, '#6f4a62', { skip: 'b' });
  for (const sd of [-1, 1]) g.box(sd * 0.86 - 0.03, 0.012, RZ0 + 0.5, sd * 0.86 + 0.03, 0.015, RZ1 - 0.4, '#b98a3a', { skip: 'b' });
  for (const [x, col] of [[-2.75, '#b9a890'], [-2.4, '#8f7f70']]) {
    g.tube([[x, H - 0.34, RZ0], [x, H - 0.34, RZ1]], 0.1, 8, col);
    for (let z = RZ0 + 1.2; z < RZ1; z += 2.6) g.box(x - 0.115, H - 0.455, z - 0.06, x + 0.115, H - 0.225, z + 0.06, '#6b4162');
  }
  for (let z = RZ0 + 2.3; z < RZ1 - 1; z += 3.4) g.box(-2.9, H - 0.22, z + 0.11, -2.25, H - 0.2, z + 0.16, '#4a3e38');
  // the tea table: an urn on the loop, cups and their lids
  const tx = RW - 0.42, tz = -36.25;
  deck.put('counter', { p: [tx, 0, tz], yaw: Math.PI / 2, color: '#8a6a50' });
  g.cyl(tx, 0.95, tz - 0.5, 0.17, 0.19, 0.46, 10, '#b08d4a').cyl(tx, 1.41, tz - 0.5, 0.19, 0.03, 0.12, 10, '#9a7a3e').box(tx - 0.26, 1.02, tz - 0.52, tx - 0.17, 1.06, tz - 0.48, '#4a3a30');
  for (let i = 0; i < 9; i++) deck.put('cup', { p: [tx - 0.12 + 0.13 * (i % 3) + rng.f(-0.02, 0.02), 0.95, tz + 0.05 + 0.14 * Math.floor(i / 3) + rng.f(-0.02, 0.02)], yaw: rng.f(0, 6.28), color: shade(rng.pick(['#e6dcc8', '#c9a36a', '#93607f', '#d9c7a0']), rng.f(0.8, 1.1)) });
  deck.sign(['Tea', 'Rinse your cup.'], { at: [RW - 0.012, 1.72, tz + 0.1], n: [-1, 0], w: 0.52, h: 0.3, style: 'card', font: 'cond' });
  yield 'baths: lockers';
}

// ---------------------------------------------------------------- people and their things
// Everyone here is retired, so they are drawn with hair: white, grey and iron. Figures face +z as the kit's do, and
// faces drawn with tint(1) take each copy's colour (the robe; a floater's bathing dress).
const HAIR = ['#f1ede4', '#d8d3c8', '#b3aea4', '#8d877e'];
const ROBES = ['#e6dcc6', '#d9c7a0', '#c9a36a', '#b9855a', '#8a5a7a', '#6b4162', '#e9e2d4', '#a8783a', '#d6b28a', '#93607f'];
const SUITS = ['#d9c7a0', '#c9a36a', '#b9855a', '#93607f', '#e6dcc6', '#a8783a'];
function folkProtos(deck) {
  SKIN.slice(0, 4).forEach((skin, i) => {
    const hair = HAIR[i % HAIR.length];
    // sitting, the robe over the knees: the seat is at y = 0
    deck.proto('sit' + i, (g) => {
      g.tint(1).box(-0.19, 0, -0.02, 0.19, 0.17, 0.46, '#ffffff').box(-0.18, -0.43, 0.35, 0.18, 0.02, 0.48, '#dcdcdc', { skip: 't' });
      g.cyl(0, 0.14, 0, 0.215, 0.17, 0.6, 7, '#ffffff', { smooth: false });
      g.box(-0.29, 0.2, -0.05, -0.2, 0.62, 0.3, '#e4e4e4').box(0.2, 0.2, -0.05, 0.29, 0.62, 0.3, '#e4e4e4');                 // sleeves, forearms on the lap
      g.tint(0).box(-0.15, -0.46, 0.4, -0.04, -0.42, 0.62, skin).box(0.04, -0.46, 0.4, 0.15, -0.42, 0.62, skin);
      g.blob(0, 0.92, 0.02, 0.125, 0, skin, { shadeBottom: 0.8 }).blob(0, 0.985, -0.03, [0.132, 0.1, 0.125], 0, hair, { shadeBottom: 0.85 });
    });
    // standing or walking, the robe to the ankles
    deck.proto('stand' + i, (g) => g.add(robedGeo(skin, hair)));
    // sitting in the water on the ledge under the coping: head and shoulders
    deck.proto('soak' + i, (g) => {
      g.tint(0).blob(0, 0.02, 0, [0.23, 0.1, 0.13], 0, skin, { shadeBottom: 0.75 });
      g.blob(0, 0.2, 0.01, 0.12, 0, skin, { shadeBottom: 0.8 }).blob(0, 0.265, -0.035, [0.127, 0.095, 0.12], 0, hair, { shadeBottom: 0.85 });
    });
  });
  // a cup with a lid: tea climbs out of an open one at half a g
  deck.proto('cup', (g) => { g.tint(0.7).cyl(0, 0, 0, 0.036, 0.044, 0.085, 8, '#e6dcc8', { smooth: false }).cyl(0, 0.085, 0, 0.05, 0.046, 0.014, 8, '#ffffff', { smooth: false }).tint(0).cyl(0, 0.099, 0, 0.012, 0.012, 0.018, 5, '#5a4a40', { smooth: false }); });
  // a robe on its peg, and the slippers left under it
  deck.proto('robe', (g) => {
    g.tint(0).box(-0.02, -0.03, -0.01, 0.02, 0.01, 0.1, '#4a3a32');
    g.tint(1).cyl(0, -1.24, 0.085, 0.2, 0.1, 1.2, 6, '#ffffff', { smooth: false, squash: [1, 0.34], cap: false });
    g.box(-0.3, -0.72, 0.05, -0.17, -0.1, 0.12, '#e2e2e2').box(0.17, -0.72, 0.05, 0.3, -0.1, 0.12, '#e2e2e2').box(-0.05, -0.14, 0.04, 0.05, -0.02, 0.12, '#f4f4f4');
    g.tint(0);
  });
  deck.proto('slippers', (g) => { g.tint(1).box(-0.11, 0, -0.12, -0.02, 0.035, 0.12, '#ffffff').box(0.02, 0, -0.1, 0.11, 0.035, 0.14, '#ffffff').tint(0); });
  deck.proto('towels', (g) => { g.tint(1); for (let k = 0; k < 4; k++) g.box(-0.2 + 0.01 * (k % 2), k * 0.05, -0.14, 0.2 - 0.012 * (k % 3), k * 0.05 + 0.045, 0.14, k % 2 ? '#ffffff' : '#e6e6e6'); g.tint(0); });
}
const geoCache = new Map();
function robedGeo(skin, hair) {
  const key = 'robed' + skin + hair;
  if (!geoCache.has(key)) {
    const g = new Geo();
    g.tint(1).cyl(0, 0.05, 0, 0.23, 0.2, 0.82, 7, '#ffffff', { smooth: false, cap: false }).cyl(0, 0.87, 0, 0.215, 0.165, 0.56, 7, '#ffffff', { smooth: false });
    // (no face of a robe may look straight down: the walkers' material lights cloth as if it half faced up, and a face
    // turned exactly from that has no direction left)
    g.box(-0.3, 0.74, -0.07, -0.2, 1.38, 0.08, '#e2e2e2', { skip: 'b' }).box(0.2, 0.74, -0.07, 0.3, 1.38, 0.08, '#e2e2e2', { skip: 'b' });
    g.tint(0).box(-0.13, 0, -0.06, -0.03, 0.05, 0.16, skin).box(0.03, 0, -0.06, 0.13, 0.05, 0.16, skin);
    g.blob(0, 1.6, 0, 0.13, 0, skin, { shadeBottom: 0.8 }).blob(0, 1.665, -0.04, [0.137, 0.105, 0.13], 0, hair, { shadeBottom: 0.85 });
    geoCache.set(key, g);
  }
  return geoCache.get(key);
}
// Someone floating on their back, toes up: y = 0 is the water, the head at the origin, the feet toward +z. Drawn so
// that from above it is one shape (head, body, two arms out, two legs) lying on the water, most of it just awash.
function floaterGeo(skin, hair) {
  const key = 'float' + skin + hair;
  if (!geoCache.has(key)) {
    const g = new Geo(), limb = shade(skin, 0.92);
    g.tint(0).blob(0, 0.05, 0, [0.1, 0.112, 0.12], 0, skin, { shadeBottom: 0.8 }).blob(0, 0.025, -0.07, [0.112, 0.1, 0.09], 0, hair, { shadeBottom: 0.85 });
    g.box(-0.05, -0.05, 0.08, 0.05, 0.035, 0.2, limb, { skip: 'b' });
    // the body: a low slab from shoulders to hips with the chest riding highest (no face of it looks down: see robedGeo)
    g.tint(1).extrude([[0.21, 0.17], [0.2, 0.42], [0.16, 0.66], [0.19, 0.9], [-0.19, 0.9], [-0.16, 0.66], [-0.2, 0.42], [-0.21, 0.17]], -0.12, 0.165, '#ffffff', { sides: '#dcdcdc' });
    g.blob(0, 0.035, 0.4, [0.17, 0.07, 0.2], 0, '#ffffff', { shadeBottom: 0.9 });
    g.tint(0);
    for (const sd of [-1, 1]) {
      g.tube([[sd * 0.1, 0.015, 0.86], [sd * 0.13, 0.005, 1.22], [sd * 0.17, 0.015, 1.56]], 0.085, 6, limb);                    // legs, a little apart
      g.box(sd * 0.17 - 0.045, -0.05, 1.5, sd * 0.17 + 0.045, 0.14, 1.63, skin, { skip: 'b' });                                 // toes up
      g.tube([[sd * 0.19, 0.012, 0.24], [sd * 0.44, 0.008, 0.4], [sd * 0.66, 0.012, 0.62]], 0.06, 6, limb);                    // arms out on the water
      g.blob(sd * 0.7, 0.01, 0.67, [0.065, 0.05, 0.09], 0, skin, { shadeBottom: 0.85 });
    }
    geoCache.set(key, g);
  }
  return geoCache.get(key);
}

// One figure drawn where it stands (not a copy of a kind), so that its arms can do something. It faces +z; its
// shoulders are at x = -0.2 and 0.2, y = 1.36; each arm is [elbow, hand] in its own co-ordinates.
function person(g, at, yaw, o) {
  g.at(at[0], at[1], at[2], yaw);
  g.cyl(0, 0.05, 0, 0.23, 0.2, 0.82, 7, o.robe, { smooth: false, cap: false }).cyl(0, 0.87, 0, 0.215, 0.165, 0.56, 7, o.robe, { smooth: false });
  g.box(-0.225, 0.85, -0.205, 0.225, 0.94, 0.215, o.sash);
  for (const [sd, arm] of [[-1, o.left], [1, o.right]]) { g.tube([[sd * 0.2, 1.36, 0], arm[0], arm[1]], 0.05, 5, shade(o.robe, 0.88)); g.blob(arm[1][0], arm[1][1], arm[1][2], [0.045, 0.045, 0.055], 0, o.skin); }
  g.box(-0.13, 0, -0.06, -0.03, 0.05, 0.16, o.skin).box(0.03, 0, -0.06, 0.13, 0.05, 0.16, o.skin);
  g.blob(0, 1.6, 0, 0.13, 0, o.skin, { shadeBottom: 0.8 }).blob(0, 1.665, -0.04, [0.137, 0.105, 0.13], 0, o.hair, { shadeBottom: 0.85 });
  g.pop();
}
// a point of such a figure, in the deck's co-ordinates
const ofPerson = (at, yaw, l) => [at[0] + l[0] * Math.cos(yaw) + l[2] * Math.sin(yaw), at[1] + l[1], at[2] - l[0] * Math.sin(yaw) + l[2] * Math.cos(yaw)];

// benches, robes on pegs, slippers, and the people in the robing room and the two aisles
function* furnish(deck, rng, dens) {
  const robe = () => shade(rng.pick(ROBES), rng.f(0.82, 1.05));
  const sitter = (x, y, z, yaw, cup) => {
    deck.put('sit' + rng.i(0, 3), { p: [x, y, z], yaw, color: robe(), scale: rng.f(0.94, 1.04) });
    if (cup) { const s = rng.sign() * 0.34; deck.put('cup', { p: [x + Math.cos(yaw) * s + Math.sin(yaw) * 0.12, y, z - Math.sin(yaw) * s + Math.cos(yaw) * 0.12], yaw: rng.f(0, 6.28), color: shade(rng.pick(['#e6dcc8', '#c9a36a', '#93607f', '#d9c7a0']), rng.f(0.8, 1.1)) }); }
  };
  // the robing room: a bench before the lockers and one under the pegs
  for (const sd of [-1, 1]) for (let z = RZ0 + 1.9; z < RZ1 - 3.2; z += 2.5) deck.put('benchLong', { p: [sd * (RW - 1.25), 0, z], yaw: Math.PI / 2, color: shade('#9a7a5a', rng.f(0.8, 1.1)) });
  for (let z = RZ0 + 0.6; z < -37.9; z += 0.47) {
    if (rng() < 0.3) continue;
    deck.put('robe', { p: [RW - 0.06, 1.76, z], yaw: -Math.PI / 2, color: robe(), scale: [1, rng.f(0.9, 1.05), 1] });
    if (rng() < 0.55) deck.put('slippers', { p: [RW - 0.35, 0, z + rng.f(-0.1, 0.1)], yaw: -Math.PI / 2 + rng.f(-0.3, 0.3), color: shade(rng.pick(ROBES), 0.7) });
  }
  const b = deck.bucket(0, -41, 'robing'), g = b.g;
  g.box(RW - 0.07, 1.74, RZ0 + 0.3, RW, 1.82, -37.6, deck.pal.trim[1]);
  deck.put('towels', { p: [RW - 1.25, 0.45, -38.9], yaw: Math.PI / 2, color: '#e6dcc6' }); deck.put('towels', { p: [RW - 1.25, 0.45, -39.5], yaw: Math.PI / 2 + 0.1, color: '#d9c7a0' });
  sitter(RW - 1.25, 0.45, -42.6, -Math.PI / 2, false); sitter(-RW + 1.25, 0.45, -40.2, Math.PI / 2, true); sitter(-RW + 1.25, 0.45, -44.9, Math.PI / 2, false);
  deck.put('stand1', { p: [-3.95, 0, -35.55], yaw: 0.4, color: ROBES[4] });                   // reading the tally
  deck.put('stand2', { p: [-RW + 1.0, 0, -37.3], yaw: -Math.PI / 2 + 0.3, color: ROBES[2] }); // at an open locker
  yield 'baths: robing people';
  // the aisles: benches along the back wall, robes over them, people with cups; nobody is in a hurry
  for (const sd of [-1, 1]) {
    const face = sd > 0 ? -Math.PI / 2 : Math.PI / 2, bxn = sd * (AW - 0.42);
    for (let z = HZ0 + 2.2; z < HZ1 - 5; z += 2.5) {
      if (rng() < 0.16) continue;
      deck.put('benchLong', { p: [bxn, 0, z], yaw: Math.PI / 2, color: shade('#8a6a50', rng.f(0.8, 1.1)) });
      const n = rng() < 0.62 * Math.min(1, dens + 0.15) ? rng.i(1, 3) : 0;
      for (let k = 0; k < n; k++) sitter(bxn, 0.45, z - 0.8 + k * 0.8 + rng.f(-0.1, 0.1), face + rng.f(-0.25, 0.25), rng() < 0.7);
    }
    for (let z = HZ0 + 0.8; z < HZ1 - 0.8; z += 0.5) if (rng() < 0.42) deck.put('robe', { p: [sd * (AW - 0.06), 1.76, z], yaw: face, color: robe(), scale: [1, rng.f(0.9, 1.05), 1] });
    // on the coping, feet in the water, and in it on the ledge, talking in twos
    for (let i = 0; i < NPIER - 1; i++) {
      const z = PIER0 + (i + 0.5) * BAY, r = rng();
      if (z < STEP0 + 1 || z > PZ1 - 1) continue;
      if (r < 0.2) sitter(sd * (PW + 0.3), 0, z + rng.f(-0.8, 0.8), face, true);
      else if (r < 0.55) {
        const n = rng.i(1, 2), z0 = z + rng.f(-0.9, 0.5);
        for (let k = 0; k < n; k++) deck.put('soak' + rng.i(0, 3), { p: [sd * (PW - 0.26), WY, z0 + k * 0.62], yaw: face + (n > 1 ? (k ? 0.5 : -0.5) * sd : rng.f(-0.3, 0.3)), scale: rng.f(0.94, 1.05) });
        if (rng() < 0.7) deck.put('cup', { p: [sd * (PW + 0.16), 0, z0 + 0.3], yaw: 0, color: '#d9c7a0' });
      }
    }
    yield 'baths: aisle people';
  }
  // on the landing, at the top of the steps: one going in, one come out and dripping
  deck.put('stand0', { p: [-3.3, 0, -33.3], yaw: 0.5, color: ROBES[0] }); deck.put('stand3', { p: [4.4, 0, -33.0], yaw: -2.2, color: ROBES[7] });
}
// people walking the aisles in their robes, slowly, and coming round again
function strollers(deck, rng) {
  const out = [];
  SKIN.slice(0, 4).forEach((skin, i) => {
    const items = [];
    for (const sd of [-1, 1]) {
      // from 4.2 m beyond one end wall to 4.2 m beyond the other: a walker dwindles away over the last twentieth of
      // its round, and that is done out of sight, past the doorways in the aisles' ends
      const dir = (i + (sd > 0 ? 1 : 0)) % 2 ? 1 : -1, sp = rng.f(0.5, 0.75), x = sd * rng.f(9.3, 10.1), len = HZ1 - HZ0 + 8.4;
      items.push({ p: [x, 0, dir > 0 ? HZ0 - 4.2 : HZ1 + 4.2], yaw: dir > 0 ? 0 : Math.PI, drift: [0, 0, dir * sp, len / sp], phase: rng(), color: shade(rng.pick(ROBES), rng.f(0.85, 1.05)) });
    }
    for (const m of instances(robedGeo(skin, HAIR[i]).build(), deck.drift, items, { frame: deck.frame, drift: true })) out.push(m);
  });
  return out;
}

// ---------------------------------------------------------------- the unfinished end
// A timber tower on the far apron, old and much mended, its top deck two metres under the vault where the tiling has
// got to. On it: the setter with a tray, a table of tiles sorted by glaze, a work lamp, and another old hand with a
// stick, pointing at the Shelf.
function* buildScaffold(deck, rng) {
  const b = deck.bucket(0, 32, 'scaffold'), g = b.g, T1 = '#8a6a48', T2 = '#74583c', T3 = '#a08060', { x0, x1, z0, z1, top } = SC;
  const post = (x, z, h) => g.box(x - 0.05, 0, z - 0.05, x + 0.05, h, z + 0.05, T2, { skip: 'b' });
  for (const x of [x0, (x0 + x1) / 2, x1]) for (const z of [z0, z1]) { post(x, z, top + 1.05); g.box(x - 0.11, 0, z - 0.11, x + 0.11, 0.05, z + 0.11, '#3a3432'); }
  for (const y of [1.95, 3.9, top - 0.09]) {
    for (const z of [z0, z1]) g.box(x0, y - 0.06, z - 0.03, x1, y + 0.06, z + 0.03, T1);
    for (const x of [x0, x1]) g.box(x - 0.03, y - 0.06, z0, x + 0.03, y + 0.06, z1, T1);
  }
  // braces, crossing on each face, one of them a different wood
  const lv = [0.1, 1.95, 3.9, top - 0.1];
  for (let k = 0; k < 3; k++) {
    for (const z of [z0, z1]) g.tube([[k % 2 ? x0 : x1, lv[k], z], [k % 2 ? x1 : x0, lv[k + 1], z]], 0.028, 4, k === 1 && z === z0 ? T3 : T2);
    for (const x of [x0, x1]) g.tube([[x, lv[k], k % 2 ? z1 : z0], [x, lv[k + 1], k % 2 ? z0 : z1]], 0.028, 4, T2);
  }
  // the decks: a half deck at 3.9 and the working deck, of planks that do not match; toe boards and a rail
  for (let i = 0, x = x0 - 0.1; x < x1 + 0.05; i++) { const w = [0.24, 0.3, 0.22, 0.27][i % 4]; g.box(x, top - 0.03, z0 - 0.15, Math.min(x + w - 0.012, x1 + 0.1), top + 0.012, z1 + 0.15, shade(i % 5 === 2 ? T3 : T1, 0.85 + 0.1 * (i % 3))); x += w; }
  for (let i = 0, x = x0; x < (x0 + x1) / 2; i++) { g.box(x, 3.93, z0, x + 0.26, 3.97, z1, shade(T1, 0.8 + 0.1 * (i % 3))); x += 0.275; }
  for (const z of [z0 - 0.15, z1 + 0.13]) g.box(x0 - 0.1, top, z, x1 + 0.1, top + 0.14, z + 0.02, T2);
  for (const y of [top + 0.55, top + 1.02]) { g.box(x0, y - 0.025, z1 - 0.02, x1, y + 0.025, z1 + 0.02, T1); for (const x of [x0, x1]) g.box(x - 0.02, y - 0.025, z0, x + 0.02, y + 0.025, z1, T1); }
  g.box(x0, top + 0.98, z0 - 0.02, x0 + 1.5, top + 1.03, z0 + 0.02, T1);
  yield 'baths: scaffold';
  // ladders: floor to the half deck outside, half deck to the top inside
  const ladder = (xa, ya, za, xb, yb, zb) => {
    for (const s of [-0.21, 0.21]) g.tube([[xa + s, ya, za], [xb + s, yb, zb]], 0.02, 4, T3);
    const n = Math.round((yb - ya) / 0.29);
    for (let k = 1; k < n; k++) { const t = k / n; g.box(xa - 0.21 + (xb - xa) * t, ya + (yb - ya) * t - 0.012, za + (zb - za) * t - 0.02, xa + 0.21 + (xb - xa) * t, ya + (yb - ya) * t + 0.012, za + (zb - za) * t + 0.02, T1); }
  };
  ladder(x0 + 0.5, 0, z0 - 1.15, x0 + 0.5, 4.5, z0 - 0.06); ladder(x0 + 0.5, 3.97, z1 - 1.0, x0 + 0.5, top + 0.9, z1 - 0.12);
  yield 'baths: scaffold';
  // the table of tiles: shallow trays, one to a glaze
  const tx = x1 - 0.55, tz = z1 - 1.45;
  g.box(tx - 0.42, top + 0.72, tz - 0.3, tx + 0.42, top + 0.76, tz + 0.75, T3);
  for (const [dx, dz] of [[-0.36, -0.24], [0.36, -0.24], [-0.36, 0.69], [0.36, 0.69]]) g.box(tx + dx - 0.025, top, tz + dz - 0.025, tx + dx + 0.025, top + 0.72, tz + dz + 0.025, T2, { skip: 'tb' });
  const GLZ = [['#f6dba4', 0.5], ['#e9b055', 0.4], ['#ee7a3c', 0.5], ['#93607f', 0.08], ['#6b4162', 0.05], ['#a3906c', 0.15], ['#0a0909', 0], ['#d8c08c', 0.4]];
  GLZ.forEach(([col, e], i) => {
    const ax = tx - 0.38 + (i % 2) * 0.4, az = tz - 0.26 + Math.floor(i / 2) * 0.25;
    g.box(ax, top + 0.76, az, ax + 0.36, top + 0.785, az + 0.22, '#5a4a40');
    for (let u = 0; u < 7; u++) for (let v = 0; v < 4; v++) if ((u * 3 + v * 5 + i) % 9) g.box(ax + 0.02 + u * 0.046, top + 0.785, az + 0.02 + v * 0.046, ax + 0.06 + u * 0.046, top + 0.795 + 0.004 * ((u + v) % 2), az + 0.06 + v * 0.046, col, { emit: e, skip: 'b' });
  });
  g.cyl(x0 + 0.5, top + 0.012, z1 - 0.5, 0.16, 0.19, 0.3, 9, '#6a625c', { top: '#b9a48c' });                 // a bucket of bedding
  yield 'baths: tiles';
  // the work lamp, on a pole lashed to a post: the one light in the hall that is not low
  const lp = [x0 + 0.08, top + 1.42, z0 + 0.1];
  g.box(lp[0] - 0.02, top, lp[2] - 0.02, lp[0] + 0.02, lp[1], lp[2] + 0.02, '#4a4442', { skip: 'b' });
  g.box(lp[0] - 0.09, lp[1] - 0.05, lp[2] - 0.07, lp[0] + 0.12, lp[1] + 0.09, lp[2] + 0.1, '#3a3432');
  g.quad([lp[0] + 0.125, lp[1] - 0.04, lp[2] - 0.06], [lp[0] + 0.125, lp[1] - 0.04, lp[2] + 0.09], [lp[0] + 0.125, lp[1] + 0.08, lp[2] + 0.09], [lp[0] + 0.125, lp[1] + 0.08, lp[2] - 0.06], '#fff0d0', 6);
  deck.glow([{ p: [lp[0] + 0.16, lp[1] + 0.02, lp[2]], color: '#ffe2b8', power: 3.4, size: 0.5 }]);
  deck.lattice({ origin: [x0 + 1.75, top + 1.75, z0 - 0.7], spacing: [1, 1], count: [1, 1], color: '#ffdcb0', power: 1.9, reach: 2.6 });      // (its light is taken from a little in front of the deck, so that it falls on their faces)
  // the two of them: the setter by the table with the tray, the other hand a pace off with the stick up
  const setter = [x0 + 1.0, top + 0.012, z0 + 0.6], other = [x0 + 2.5, top + 0.012, z0 + 0.7], ys = 1.5, yo = -1.62;
  person(g, setter, ys, { robe: '#c9b48e', sash: '#6b4162', skin: SKIN[1], hair: HAIR[0], left: [[-0.25, 1.13, 0.12], [-0.17, 1.1, 0.33]], right: [[0.25, 1.13, 0.12], [0.17, 1.1, 0.33]] });
  person(g, other, yo, { robe: '#e6dcc6', sash: '#a8783a', skin: SKIN[2], hair: HAIR[1], left: [[-0.33, 1.12, -0.02], [-0.23, 0.95, 0.1]], right: [[0.3, 1.42, 0.2], [0.24, 1.52, 0.45]] });
  g.at(setter[0], setter[1], setter[2], ys).box(-0.2, 1.085, 0.24, 0.2, 1.115, 0.56, '#5a4a40');
  for (let u = 0; u < 5; u++) for (let v = 0; v < 4; v++) if ((u + v * 2) % 5) g.box(-0.18 + u * 0.074, 1.115, 0.26 + v * 0.07, -0.118 + u * 0.074, 1.127, 0.32 + v * 0.07, '#a3906c', { emit: 0.25, skip: 'b' });
  g.pop();
  const tip = [x0 + 0.14, 0, other[2] + 0.75]; tip[1] = Math.sqrt(VR * VR - tip[0] * tip[0]) - 0.02;
  g.tube([ofPerson(other, yo, [0.24, 1.5, 0.3]), tip], 0.011, 4, '#c9b48a');          // the stick, at the Shelf
  // chalked on a board tied to the rail, by somebody else
  g.box(x0 + 1.15, top - 1.3, z0 - 0.085, x0 + 2.45, top - 0.62, z0 - 0.06, '#3a322e');
  deck.sign(['Too bright,', 'says Tilde'], { at: [x0 + 1.8, top - 0.96, z0 - 0.09], n: [0, -1], w: 1.22, h: 0.6, style: 'chalk', ...SLATE, head: false });
  // round its feet: crates of tiles by glaze, a hand cart, a spare ladder
  [['#f6dba4', -4.6, 32.2], ['#e9b055', -4.1, 32.9], ['#93607f', -4.9, 33.4], ['#14100f', -4.2, 33.9], ['#a3906c', 1.6, 33.6], ['#f6dba4', 2.2, 33.1], ['#6b4162', 1.5, 34.4]].forEach(([col, x, z]) => deck.put('crate', { p: [x, 0, z], yaw: rng.f(-0.4, 0.4), scale: 1.25, color: col }));
  deck.put('cart', { p: [2.6, 0, 31.6], yaw: 0.5, color: '#8a5a3a' });
  deck.put('ladder', { p: [-5.6, 0, 35.2], yaw: 0.3, color: '#a08060' });
  yield 'baths: the setter';
}

// the slates by the door, and what else is written up
function writeSigns(deck, tally) {
  const b = deck.bucket(0, -41, 'robing'), g = b.g, zw = RZ1 - 0.03, num = (n) => String(n).replace(/\B(?=(\d{3})+$)/g, ',');
  const slate = (cx, cy, w, h) => g.box(cx - w / 2 - 0.05, cy - h / 2 - 0.05, zw - 0.02, cx + w / 2 + 0.05, cy + h / 2 + 0.05, zw + 0.03, '#4a3a30');
  deck.sign('Thirteen seconds across', { at: [0, DOORH + 0.36, zw - 0.01], n: [0, -1], h: 0.27, w: 2.5, style: 'board', font: 'serif', ground: '#3d2438', ink: '#ead9b0' });
  slate(3.0, 1.62, 2.1, 1.3);
  deck.sign(['The vault', 'Set  ' + num(tally.set), 'To set  ' + num(tally.left), 'A tile a shift. Bring your book.'], { at: [3.0, 1.62, zw - 0.03], n: [0, -1], w: 2.1, h: 1.3, style: 'chalk', ...SLATE });
  slate(-3.05, 1.7, 1.7, 1.12);
  deck.sign(['The Shelf', 'Too bright  31', 'About right  4', 'The setter  1'], { at: [-3.05, 1.7, zw - 0.03], n: [0, -1], w: 1.7, h: 1.12, style: 'chalk', ...SLATE });
  deck.sign(['Slow water', 'Lids on cups.', 'Tea climbs at half a g.'], { at: [-1.86, 1.55, zw - 0.012], n: [0, -1], w: 0.62, h: 0.5, style: 'paper' });
  deck.sign(['Robes', 'Take a dry one.', 'Hang the wet one.'], { at: [RW - 0.012, 2.25, -40.6], n: [-1, 0], w: 0.7, h: 0.46, style: 'paper' });
  deck.sign('Crew lockers', { at: [-RW + 0.012, 2.32, -41.5], n: [1, 0], h: 0.2, style: 'plate', ...ENAMEL, font: 'cond' });
  deck.sign(['Crew Street', 'the way out, behind you'], { at: [RW - 0.012, 2.3, -42.5], n: [-1, 0], w: 1.25, h: 0.42, style: 'plate', ...ENAMEL, font: 'cond', font2: 'serif' });
}

// Ochre's earths, and the brown-violet its back crews named: warm render, dark dados, no green and no blue
const BATHS = {
  ...PALETTES.warm,
  walls: ['#b9a48c', '#ae977f', '#c2ad94', '#a8927c', '#b49d88', '#bda792'],
  dado: ['#5a3f52', '#4f3a4a', '#63465a', '#553c44'],
  trim: ['#3a2a30', '#46323a', '#33262a', '#4a3630'],
  doors: ['#7a5078', '#8a5a3a', '#b98a3a', '#6b4162', '#9a6a3a', '#5a3f52', '#a8783a', '#70485a'],
  floor: '#6f6058', strip: '#544842', court: '#8a7868', ceiling: '#8a7868', rib: '#b9a48c',
  metal: '#5a5250', brass: '#b08d4a',
  lamp: '#ffb872', window: ['#ffc98a', '#ffb872', '#ffd6a6', '#f6c27e'], shop: '#ffc98a',
};

export const ochreBaths = {
  id: 'ochre-baths',
  title: 'The River in tile', drum: 'Ochre', row: 'Pigment Row', kind: 'a steady drum', light: 33.1,
  line: 'Retired back crews get the high decks in Ochre, and they have tiled the vault of their baths with the River from memory, a tile for every shift. You float on your back at half a g and look at it. Tilde says the Shelf is too bright.',
  tone: '#8a5a7a', source: 'wander-year.md (Day 226); ashgrove.md (Day four); sorrel.md (the Slow Water, the Bruise)',
  sound: { root: 38, scale: 'dorian', pad: 0.6, air: 0.1, hum: 0.2, water: 0.5, crowd: 0.15, bells: 0.15, bright: 0.25 },
  *build(ctx) {
    const frame = makeFrame(214 * DEG, 3480, deckRadius(366));      // toward the heat end, where the crews go out
    const rng = makeRng('ochre-baths'), dens = ctx.density || 1;
    // the robing room at eye height; through the door and down to the water; low along the pool, then up a little
    // to look down on three people floating where the River lies in it; up to the vault and along it, a hand's
    // breadth under the crown; the scaffold; and straight up through the raft, the far end falling away under the feet
    const path = makePath([
      { t: 0, p: [0, 1.55, -47.2], look: [0, 1.45, -39.5] },
      { t: 5, p: [0, 1.5, -40.5], look: [0, 1.3, -33] },
      { t: 9, p: [0, 1.38, -35.6], look: [0, 1.7, -20] },
      { t: 13, p: [0, 0.66, -29.6], look: [0, 2.4, 0], fov: 66 },
      { t: 18.5, p: [-0.4, 0.45, -21.5], look: [0.3, 2.2, 10], fov: 68 },
      { t: 23.5, p: [-0.9, 0.75, -14], look: [0.3, 0.3, -4], fov: 62 },
      { t: 28, p: [-0.5, 1.75, -7.2], look: [0.4, -0.3, -2] },
      { t: 32.5, p: [0.6, 1.6, 0.5], look: [0.9, 3.8, 13], fov: 60 },
      { t: 37.5, p: [2.3, 5.1, 11.5], look: [1.4, 7.8, 17.5] },
      { t: 41, p: [1.45, 7.38, 15.6], look: [1.1, 7.92, 16.25], fov: 46 },
      { t: 45, p: [1.2, 7.05, 19.9], look: [-0.4, 7.9, 26], fov: 54 },
      { t: 49.5, p: [0.4, 6.2, 24.6], look: [-1.2, 7.3, 31.2], fov: 46, up: [0, 1, 0] },
      { t: 54, p: [0, 5.5, 27.6], look: [0, 8.6, EXIT_Z + 0.15], up: [0, 0.3, -0.95] },
      { t: 57.2, p: [0, VR - 0.07, EXIT_Z], look: [0, VR + 3, EXIT_Z], up: [0, 0, -1] },
      { t: 58, p: [0, VR + 0.85, EXIT_Z], look: [0, VR + 4, EXIT_Z], up: [0, 0, -1] },
    ], { frame, entryRadius: 1.2, exitRadius: 1.0 });
    const deck = makeDeck(ctx, {
      frame, near: path.points(0.5), seed: 'ochre-baths', palette: BATHS, clock: 'flight',
      light: { level: 1, ambUp: '#3a2a26', ambDown: '#2a1e22', ambPower: 0.35, haze: '#241814', hazeDensity: 0.005 }, floor: { shine: 0.9 },
    });
    yield 'baths: path';
    // the lamps: one low on every pier, both sides. (The robing room has its own, and the scaffold one work lamp.)
    deck.lattice({ origin: [-LX, LY, PIER0], spacing: [2 * LX, BAY], count: [2, NPIER], color: '#ffbb78', power: 1.4, reach: 2.4 });
    // and what the vault gives back: a little gold light from above on whoever is out in the middle of the pool
    deck.zone({ min: [-PW, -1, STEP0], max: [PW, 2.4, PZ1], soft: 1.2, color: '#ffd9a0', power: 0.3, side: 0.8, under: 0.3 });
    // how the work stands: tiles across the vault, courses along it, and how many of them are up
    const across = Math.round((2 * VR * Math.asin(XA / VR)) / TILE), set = across * Math.round((ZF - 0.8 - HZ0) / TILE);
    const tally = { crew0: 1104, set, left: across * Math.round((HZ1 - HZ0) / TILE) - set };
    folkProtos(deck);
    yield 'baths: kinds';
    yield* buildHall(deck);
    yield* buildRobing(deck, rng, tally);
    yield* furnish(deck, rng, dens);
    yield* buildScaffold(deck, rng);
    writeSigns(deck, tally);
    yield 'baths: signs';

    // ---- the bathers: on their backs down the middle of the pool, where the River lies in the water
    const KEPT = 3, floats = [[0.5, -3.5], [1.9, -0.6], [-1.3, -1.3], [1.9, -17.5], [-2.9, -12.5], [2.8, -8.5], [-3.4, 3.5], [-0.4, 9], [2.9, 6], [-2.2, 15], [1.2, 19.5], [3.6, -24]];
    for (let i = 0, n = Math.round(7 * dens); i < n; i++) floats.push([rng.f(-5.2, 5.2), rng.f(-26, 25)]);
    const afloat = [0, 1, 2, 3].map(() => []), rings = [];
    floats.forEach(([x, z], i) => {
      if (i >= KEPT && (!deck.clear(x, 0.5, z, 1.7) || floats.slice(0, i).some((q) => Math.hypot(q[0] - x, q[1] - z) < 2.2))) return;
      afloat[i % 4].push({ p: [x, WY, z], color: shade(SUITS[i % SUITS.length], rng.f(0.8, 1.2)), scale: rng.f(0.94, 1.05), walk: [rng.f(0.25, 0.6), rng.f(0.012, 0.03) * rng.sign(), rng.f(0, 6.28), 0.012] });
      if (rings.length < NR) rings.push(new Vector4(x, z + 0.5, rng.f(17, 29), rng.f(0, 30)));
    });
    while (rings.length < NR) rings.push(new Vector4(0, 0, 0, 0));
    const extra = [];
    for (let i = 0; i < 4; i++) {
      if (afloat[i].length) for (const m of instances(floaterGeo(SKIN[i], HAIR[i]).build(), deck.walk, afloat[i], { frame, walk: true })) extra.push(m);
      yield 'baths: afloat';
    }
    for (const m of strollers(deck, rng)) extra.push(m);
    yield 'baths: walkers';
    // one more in the robing room, on the flight's own clock: someone walks ahead of you, in at the door and into the
    // steam, and is gone before you reach it. (A walker goes in a straight line for a minute and comes round again:
    // the line starts out in the deck beyond the street wall and ends a pace inside the hall.)
    {
      const secs = 60, sp = 1.25, at0 = [2.0, -41.5], to = [0.3, -31.0], d = Math.hypot(to[0] - at0[0], to[1] - at0[1]), ux = (to[0] - at0[0]) / d, uz = (to[1] - at0[1]) / d;
      const start = [to[0] - ux * sp * secs, 0, to[1] - uz * sp * secs], item = { p: start, yaw: Math.atan2(ux, uz), drift: [ux * sp, 0, uz * sp, secs], phase: 1 - d / (sp * secs), color: ROBES[1] };
      for (const m of instances(robedGeo(SKIN[1], HAIR[1]).build(), deck.pace, [item], { frame, drift: true })) extra.push(m);
    }
    yield 'baths: bathers';

    // ---- steam: a veil in the doorway, and slow sparse puffs off the water, brightest where the lamps are
    const puffs = [];
    for (let i = 0; i < 30; i++) puffs.push({ p: [rng.f(-1.5, 1.5), rng.f(0.0, 1.7), rng.f(-34.9, -31.2)], size: rng.f(1.3, 2.6), rise: rng.f(0.04, 0.09), loop: rng.f(9, 16), phase: rng(), power: rng.f(0.11, 0.2) });
    for (let i = 0, n = Math.round(60 * dens); i < n; i++) {
      const x = rng.f(-6.6, 6.6), edge = Math.pow(Math.abs(x) / 6.6, 3);
      puffs.push({ p: [x, WY + rng.f(0.1, 0.5), rng.f(STEP0 + 1, PZ1 - 1)], size: rng.f(1.2, 2.6), rise: rng.f(0.05, 0.11), loop: rng.f(18, 34), phase: rng(), power: 0.05 + 0.1 * edge });
    }
    for (let i = 0, n = Math.round(36 * dens); i < n; i++) puffs.push({ p: [rng.f(-6.8, 6.8), WY + rng.f(0.05, 0.25), rng.f(STEP0 + 0.5, PZ1 - 0.5)], size: rng.f(2.2, 3.8), rise: rng.f(0.012, 0.03), loop: rng.f(24, 40), phase: rng(), power: rng.f(0.02, 0.04) });
    for (let i = 0; i < 5; i++) puffs.push({ p: [RW - 0.42 + rng.f(-0.05, 0.05), 1.55, -36.75 + rng.f(-0.05, 0.05)], size: rng.f(0.3, 0.5), rise: 0.09, loop: rng.f(4, 6), phase: i / 5, power: 0.16 });      // off the tea urn
    const steam = steamMesh(puffs, frame, '#ffd2a4');
    yield 'baths: steam';

    // ---- the vault, the far wall with its drawing, and the water that holds them
    const field = yield* riverField();
    const shared = {
      ...deck.rig.uniforms, tField: { value: field }, uClip: G.uClip, uTime: G.uTime, uPx: G.uPx, uBend: { value: new Vector3(frame.a0, frame.z0, frame.floorR) },
      uExit: { value: new Vector4(0, EXIT_Z, 1.22, 1.3) }, uInit: { value: INITIALS.map((q) => new Vector4(q[0], q[1], q[2], q[3])) }, uGlyph: { value: glyphUniform() },
    };
    const vault = vaultMesh(deck, shared);
    yield 'baths: vault';
    const endWall = endWallMesh(deck, shared);
    const water = waterMesh(deck, { ...shared, uWave: { value: trainUniforms() }, uRing: { value: rings } });
    yield 'baths: water';
    yield* finish(deck);
    deck.chunks.clear();      // the meshes are made: what they were made from (some nine megabytes of plain arrays) need not live as long as the world
    const scene = new Scene();
    scene.add(deck.group, vault, endWall, water, steam);
    for (const m of extra) scene.add(m);
    return {
      scene, path, deck, near: 0.08, far: 400,
      look: { exposure: 1.9, bloom: 0.27, threshold: 1.0, vignette: 0.5, saturation: 1.06, contrast: 1.04 },
      portal: { rim: false, mist: '#120d0a', mistPower: 0.6, openFor: 8 },
      update(t) { deck.tick(t); },
    };
  },
};
