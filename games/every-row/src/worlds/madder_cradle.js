// Madder, Pigment Row: the Dye House, in the week the Count came down. For fourteen years a birth here needed a
// licence and a number; this year, "for the first time in fourteen, a couple with a place could walk into a clinic and
// have theirs out without a number" (docs/wander-year.md, Day 222). Nobody has been born yet. But the Dye House has
// more orders for cradle cloth than in fourteen years, nobody can agree on the red, and so every red Madder makes has
// been hung up to dry in the court at once ("The whole row grinds colours, and Madder's are red": three-nights,
// 15-canon.js; neighbourhoods Rootyard and Dye House; "wet cloth hangs drying over your head": docs/sorrel.md, Blue Street).
//
// The place: the court of the block called Dye House, six decks high, 48 m by 28 m. y = 0 is its floor, on deck 150
// (radius 2,404 m, 0.80 g), and its ceiling of lamps is the underside of deck 156, 24 m up. The floor is the works:
// a dozen steel vats of red liquor on electric elements, two rinse troughs that run from crimson to pale pink, a hoist
// at the spinward end of each. Under the ceiling are twenty rails, and from them hang five hundred and forty lengths,
// each a metre and a half wide and up to twenty metres long, with lamps hung in the lanes between them at three
// heights. On the third terrace (y = 12) is a flat with a window on the court (flats on a court's terraces are the
// only homes that have one: docs/ashgrove.md), and in its smallest room, by that window, a cradle. The kitchen is the
// docs' kitchen: an inherited table, four chairs that do not match, a starter crock, a metre of herbs under a grow
// lamp, a larder cupboard (ashgrove.md, The flat).
//
// The flight: along the works floor between the troughs as a dyer sends a wet length up; straight up beside it into
// the hanging cloth, turning to look back down the lane; out along a cross lane at the third terrace, along its rail
// past the neighbours waiting with folded lengths over their arms; in at the flat's open door, slowly through the
// kitchen, to the small room's door, where everybody can be seen at once from three metres; then round to the cradle
// under its window, over it, and down into it.
//
// What only a drum does, and the sums (deck 150: r = 2,404 m, turning at 0.0572 rad/s, so g = 7.87 m/s2):
//   - A drop let go h metres above the floor is at rest only in the turning frame. It keeps the speed of the place it
//     left, the floor under it goes faster, and it lands r (tan a - a) antispinward, cos a = (r - h) / r, which is very
//     nearly (2h)^1.5 / (3 sqrt r): 2 cm from a table, 0.80 m from 12 m, 2.1 m from the rails. So the hoists stand at
//     the spinward ends of the troughs, the troughs run back under the wet lengths, a plate on each hoist says where
//     to stand, and every drop in the court falls on the same slant.
//   - A length going up at 1.1 m/s is pushed spinward (2 x 0.0572 x 1.1 = 0.126 m/s2 against 7.87): it leans 0.9
//     degrees while the hoist runs, 18 cm at its hem, and hangs plumb when the hoist stops.
//   - A hanging length swings in the first mode of a hanging chain, at 1.2025 sqrt(g / L) rad/s: once in 8.3 s for
//     twenty metres, 5.3 s for eight. There is no wind in a drum, so a length moves only after a hoist has gone up
//     beside it or a pole has touched its hem, and then it goes on for minutes.
//   - Steam rising toward the axis is carried a little spinward (what moves inward keeps its speed round the drum and
//     gets ahead of the floor): every plume leans the same way.
//
// Not canon (the docs give the week, the Count coming down, Madder's reds, the vat fire fourteen years back, the
// names Dye House and Rootyard, and what a flat holds):
//   - the Dye House as a block whose court is its dye works, its deck, its size, the works' whole layout (vats on
//     elements, troughs, hoists, rails, lamps hung in the lanes, tables where the dry lengths are folded), the plates
//     on the vats and hoists, and that the lengths dry indoors over the works
//   - the orders for cradle cloth and their number, the slates that count them and keep the tally of the argument,
//     the names of the reds (rose, madder, crimson, brick, oxblood), and the one length of weld yellow hung by mistake
//   - the block's own washing lines hung with short lengths along the terrace, and the banners over every rail
//   - the flat, its plan and everything in it beyond the docs' list (the reds left folded on the table, the shopping
//     slate, the small jacket, cap and shoes kept on a shelf); the cradle, its age, its mends, the brass tack in its
//     rail for each child, its lining; that it rocks a little, and runs down, as the flight comes in
//   - the couple, the neighbours and their folded lengths, the old man (the docs' old man stood at the board at
//     Ring 4 and said his granddaughter got her place in the spring; that he is here is this page's own)
//   - the clinic's notice on the terrace wall (its wording; the docs give the fact), the door numbers, the trades of
//     the shops under the first terrace
import {
  Scene, Mesh, ShaderMaterial, BufferGeometry, BufferAttribute, Float32BufferAttribute, InstancedBufferGeometry,
  InstancedBufferAttribute, Vector3, Vector4, Matrix4, DoubleSide, AdditiveBlending,
} from 'three';
import { makePath } from '../core/path.js';
import { makeFrame, deckRadius, DEG } from '../kit/drum.js';
import { makeDeck, finish, atrium, Run, PALETTES } from '../kit/deck.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG, NOISE_GLSL } from '../kit/mats.js';
import { Geo, rgb, mixc, shade, fitBounds } from '../kit/geo.js';
import { makeRng, smoothstep, clamp, lerp } from '../core/rng.js';

const TAU = Math.PI * 2;
// ---------------------------------------------------------------- the place (flat: x spinward, y up, z aft)
const DECK = 150, R_FLOOR = deckRadius(DECK), GRAV = 0.0572 * 0.0572 * R_FLOOR;
const CX0 = -24, CX1 = 24, CZ0 = -14, CZ1 = 14, TOP = 24;       // the court's floor and its ceiling
const RAIL_Y = 23.0;                                            // the rails the lengths hang from
const ROW = 1.25, ROW1 = 1.55;                                  // from rail to rail; and the first rail each side of the lane
const rowZ = (k) => (Math.abs(k) === 1 ? Math.sign(k) * ROW1 : k * ROW);      // the rows are planes z = rowZ(k), k = -10..10 but 0
const NROW = 10;                                                // rows each side of the lane the flight goes up (z = 0)
const XC = 7.4, LANE = 2.4;                                     // the cross lane, clear through every row
const WIDE = 1.5, GAP = 0.1;                                    // a length, and the gap to the next on its rail
const HOIST_X = XC - LANE / 2 - 0.1 - WIDE / 2;                 // the middle of the length going up, on the rail z = +ROW1
const TROUGH = { x0: -12.6, x1: HOIST_X + 1.0, w: 0.8, h: 0.62, water: 0.54 };
const T3 = 12;                                                  // the third terrace's floor
const WALL = CZ1 + 12;                                          // the line its doors stand on (z = 26)

// Every red Madder makes, as the dyers name them here, and how many lengths in a hundred are of each.
const REDS = [
  { name: 'rose', c: '#d4607a', w: 20 }, { name: 'madder', c: '#b03020', w: 23 }, { name: 'crimson', c: '#7a0a3c', w: 21 },
  { name: 'brick', c: '#8a4424', w: 13 }, { name: 'oxblood', c: '#34090c', w: 16 }, { name: 'pink', c: '#dc8a94', w: 4 },
  { name: 'pale pink', c: '#e3a0a0', w: 2 },
];
const WELD = '#d8b830';
const WOODPALE = '#cdb898', STEEL = '#8d9096', STEEL2 = '#6c7076', STONE = '#9c9794', IRON = '#3c3a3c';

// Madder's paint: grey stone, pale plaster, pale wood. Nothing is saturated but the reds.
const MADDER = {
  ...PALETTES.warm,
  walls: ['#d9cdc6', '#cfc2bb', '#d6c8c0', '#c9bdb8', '#ddd2ca', '#c8bab2'],
  dado: ['#8f8480', '#857a78', '#9a8e88', '#7d7472'],
  trim: ['#6a5a52', '#5a4c46', '#74645a', '#4f4440'],
  doors: ['#7e2d33', '#a05a50', '#c9b8a8', '#8a7a70', '#5a4440', '#b08a78', '#9a3a3a', '#d6c6b4'],
  awnings: [['#7e2d33', '#eadfd4'], ['#b0483e', '#efe4d8'], ['#e07a6e', '#f3e8de'], ['#5a1a20', '#e6d8cc'], ['#c9a090', '#f0e6dc']],
  signs: [['#2a1416', '#fff0ea'], ['#7e2d33', '#fff0ea'], ['#fff0ea', '#7e2d33'], ['#3a2a28', '#e9c8b8'], ['#5a2024', '#f3dcd0'], ['#e9dcd0', '#2a1416']],
  floor: '#8d8886', strip: '#6f6a68', court: STONE, ceiling: '#9a8f8a', rib: '#d2c6be',
  rooms: ['#d9b08a', '#c9a090', '#e0b898', '#b99080', '#d6b8a0', '#c4a088', '#e6c0a0'],
  metal: '#74757a', brass: '#b08d4a', glass: '#d6c8cc',
  leaf: ['#86927a', '#7a8870', '#929c80', '#8a9478', '#70806a', '#9aa286'],
  bloom: ['#f3e6e0', '#eab0a8', '#e07a6e', '#f6d0c8', '#d98a84'],
  tub: ['#9a6a58', '#b8aca4', '#8a7a74', '#a87868'],
  lamp: '#ffdcb8', window: ['#ffc890', '#ffd8ae', '#ffe6c8', '#f6bc80'], shop: '#ffd8a8',
  goods: 0.45,
};
// what people wear here: undyed, grey, brown, and old rose that has been through the wash a hundred times
const WEAR = ['#a39a8e', '#8f877e', '#77706a', '#625c57', '#8a7868', '#9c8c7a', '#6c5e56', '#aba296', '#94797a', '#7e6c6a', '#a08880', '#4f4844'];
const SKINS = ['#f1c9a5', '#d9a87c', '#b07b52', '#8a5a3a', '#5e3b26', '#e8b894'];
const HAIRS = ['#2a1f1a', '#3b2a20', '#5a3d28', '#1c1816', '#7a4a2a', '#8f8a84', '#b9b4ac'];

// ---------------------------------------------------------------- the cloth
// One mesh for every length in the court. A length is a strip hung from a batten: its vertices carry the batten's
// height, the length, how far down they are and how far across. The shader gives it soft folds, lets it swing in a
// hanging chain's first mode, lights both its faces at each vertex with the deck's own lamps, and draws the face
// toward the eye with what falls on it and what comes through from the other side. The lamp ceiling's own light soaks
// away down through the lengths, so the court is brightest at the rails and deep red at the hems.
const clothVert = (rig) => /* glsl */`
attribute vec4 aSheet;   // the batten's height, the length, a phase, how far the hem swings (metres)
attribute vec4 aFold;    // metres across, a seed, kind (0 hung, 1 on the hoist), wet 0..1
attribute vec3 aDir;     // the way its face looks (x, z), and its width
attribute vec3 aTint;
${BEND_PARS}
uniform float uTime; uniform vec4 uHoist;   // the hoisted length: its batten's height now, the water's level, its lean, -
varying vec3 vW; varying vec3 vF; varying vec3 vCol; varying vec3 vLa; varying vec3 vLb; varying vec4 vUv; varying vec2 vWide; varying vec4 vNs;
${rig.glsl}
void main() {
  vec3 p = position;
  float L = aSheet.y, s = aSheet.x - p.y, lean = 0.0;
  if (aFold.z > 0.5) { p.y = uHoist.x - s; lean = uHoist.z; }
  float hang = clamp(s / L, 0.0, 1.0), q = 1.0 - hang;
  // J0(2.405 sqrt(1 - hang)), the shape of a hanging chain's slowest swing, as a short series
  float mode = 1.0 - q * (1.446 - q * (0.523 - 0.084 * q));
  float sw = aSheet.w * mode * sin(uTime * 3.37 * inversesqrt(L) + aSheet.z);
  // soft folds that begin under the batten and gather toward the hem, and a slow twist: no length hangs quite flat
  float grow = smoothstep(0.0, 1.4, s), wide = min(aDir.z, 1.5) / 1.5;
  float fa = 0.05 * grow * (0.65 + 0.35 * sin(s * 0.33 + aFold.y * 9.0)) * (1.0 + 0.7 * smoothstep(L - 0.9, L, s)) * wide;
  float fk = 10.5 + 3.5 * sin(aFold.y * 37.0);
  float fph = aFold.x * fk + aFold.y * 21.0 + 0.7 * sin(s * 0.21 + aFold.y * 5.0);
  float tw = (0.1 * sin(s * 0.27 + aFold.y * 13.0) + 0.05 * sin(s * 0.71 + aFold.y * 29.0)) * grow * wide;
  float mid = aFold.x - aDir.z * 0.5;
  vec3 nrm = vec3(aDir.x, 0.0, aDir.y), tng = vec3(aDir.y, 0.0, -aDir.x);
  p += nrm * (sw * (1.0 + 0.25 * mid) + fa * sin(fph) + mid * tw);
  p.x += lean * hang;
  float slope = fa * fk * cos(fph) + tw;
  vec3 n = normalize(nrm - tng * slope);
  if (aFold.z > 0.5 && p.y < uHoist.y) p.y = uHoist.y - 0.04;      // what is still under the water
  vF = p; vCol = aTint; vUv = vec4(aFold.x, s, L, aFold.w); vWide = vec2(aDir.z, aFold.y);
  vec3 fn = n;
  kBend(p, n);
  vW = p; vNs = vec4(n, slope);
  vLa = kLight(p, n, vF, fn);
  vLb = kLight(p, -n, vF, -fn);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const clothFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform vec4 uCeil;      // the lamp ceiling's light on cloth just under it, and its height
uniform vec4 uThru;      // how much of the far face's lamp comes through, how much of the ceiling's, the depth it soaks away in, gain looking up
uniform vec3 uLit;       // the shared light on the near face, a lamp's on the near face, the shared light coming through
uniform vec3 uWood; uniform float uTime;
varying vec3 vW; varying vec3 vF; varying vec3 vCol; varying vec3 vLa; varying vec3 vLb; varying vec4 vUv; varying vec2 vWide; varying vec4 vNs;
${rig.glsl}
${NOISE_GLSL}
void main() {
  ${CLIP_FRAG}
  float across = vUv.x, s = vUv.y, L = vUv.z, wet = vUv.w, seed = vWide.y;
  vec3 La = gl_FrontFacing ? vLa : vLb, Lb = gl_FrontFacing ? vLb : vLa;
  vec3 down = uCeil.rgb * exp(-(uCeil.w - vF.y) / uThru.z);
  vec3 V = normalize(vW - cameraPosition);
  float upw = max(dot(V, kUp(vW)), 0.0);
  // the threads (seen only from a metre or so), the unevenness of a bath down twenty metres, a darker selvedge and a
  // doubled hem; wet cloth is darker to look at, and lets more light through
  float px = fwidth(across) + fwidth(s);
  float weave = 1.0 + 0.1 * sin(across * 1400.0) * sin(s * 1400.0) * (1.0 - smoothstep(0.0012, 0.004, px));
  float streak = 0.88 + 0.24 * kNoise(vec2(across * 9.0 + seed * 31.0, s * 0.2));
  float mott = 0.93 + 0.14 * kNoise(vec2(across * 2.1, s * 0.8) + seed * 17.0);
  float edge = 1.0 - 0.25 * (1.0 - smoothstep(0.0, 0.025, min(across, vWide.x - across)));
  float hem = smoothstep(L - 0.075, L - 0.06, s);
  vec3 base = vCol * weave * streak * mott * edge;
  vec3 thr = pow(base, vec3(1.35)) * 1.7 * (1.0 - 0.55 * hem) * (1.0 + 0.9 * wet);
  base = mix(base, base * base * 2.2 + base * 0.25, wet * 0.75);
  // what both faces share (the court's own grey light) and what only one has (a lamp hung on that side): the near
  // face shows its lamp plainly, and the far face's lamp comes through as a glow in the cloth's own colour
  vec3 sym = min(La, Lb);
  // the grey light comes more from one hand than the other, so a fold has a lit flank and a dull one; and cloth
  // seen along its surface shows a paler bloom
  float side = gl_FrontFacing ? 1.0 : -1.0;
  float pleat = clamp(1.0 - 0.85 * vNs.w * side, 0.5, 1.5);
  float graze = pow(1.0 - abs(dot(V, normalize(vNs.xyz))), 3.0);
  vec3 c = base * (sym * uLit.x * pleat + (La - sym) * uLit.y + down * 0.35)
         + thr * ((Lb - sym) * uThru.x + sym * uLit.z + down * uThru.y * (0.4 + uThru.w * upw * upw))
         + (sym + down * 0.5) * graze * 0.3 * mix(vec3(0.8, 0.62, 0.6), base * 2.0, 0.6);
  // water still running down a wet length: thin bright threads of it, going down at about a metre a second
  if (wet > 0.01) {
    float ax = across * 70.0, fx = fract(ax), run = kHash(vec2(floor(ax), seed * 91.0));
    float bead = fract(s * (0.35 + 0.3 * run) - uTime * (0.3 + 0.35 * run) + run * 7.0);
    float riv = step(0.8, run) * smoothstep(0.0, 0.3, fx) * smoothstep(1.0, 0.7, fx) * smoothstep(0.0, 0.03, bead) * smoothstep(0.3, 0.08, bead) * (1.0 - smoothstep(0.004, 0.02, px));
    c += wet * riv * (La + Lb * 0.6 + down) * (base * 2.2 + vec3(0.07, 0.025, 0.03));
  }
  // the batten a long length hangs from (what is over a washing line or a rail is just folded over it)
  if (s < 0.05 && L > 5.0) c = uWood * (La + down * 0.5);
  gl_FragColor = vec4(kAir(c, vW), 1.0);
}`;

// sheets: [{ x, z (the middle of its batten), top, len, w, face: [nx, nz], col: [r, g, b] (linear), phase, swing, seed,
// kind, wet, nu, ns (how finely it is cut across and down) }]
function* clothMesh(deck, sheets, uniforms) {
  let nv = 0, ni = 0;
  for (const s of sheets) { nv += (s.nu + 1) * (s.ns + 1); ni += s.nu * s.ns * 6; }
  const pos = new Float32Array(nv * 3), sh = new Float32Array(nv * 4), fo = new Float32Array(nv * 4), di = new Float32Array(nv * 3), ti = new Float32Array(nv * 3);
  const idx = new Uint32Array(ni);
  let v = 0, k = 0, t0 = performance.now();
  yield 'cradle: cloth';
  for (const s of sheets) {
    if (performance.now() - t0 > 3) { yield 'cradle: cloth'; t0 = performance.now(); }
    const base = v, nx = s.face[0], nz = s.face[1], tx = nz, tz = -nx;
    for (let j = 0; j <= s.ns; j++) {
      // cut finer near the batten and the hem, where the folds begin and the eye goes
      const f = j / s.ns, down = s.len * (f * f * (3 - 2 * f) * 0.35 + f * 0.65);
      for (let i = 0; i <= s.nu; i++) {
        const u = (i / s.nu) * s.w, a = u - s.w / 2;
        pos[v * 3] = s.x + tx * a; pos[v * 3 + 1] = s.top - down; pos[v * 3 + 2] = s.z + tz * a;
        sh[v * 4] = s.top; sh[v * 4 + 1] = s.len; sh[v * 4 + 2] = s.phase; sh[v * 4 + 3] = s.swing;
        fo[v * 4] = u; fo[v * 4 + 1] = s.seed; fo[v * 4 + 2] = s.kind || 0; fo[v * 4 + 3] = s.wet || 0;
        di[v * 3] = nx; di[v * 3 + 1] = nz; di[v * 3 + 2] = s.w;
        ti[v * 3] = s.col[0]; ti[v * 3 + 1] = s.col[1]; ti[v * 3 + 2] = s.col[2];
        v++;
      }
    }
    for (let j = 0; j < s.ns; j++) for (let i = 0; i < s.nu; i++) {
      const a = base + j * (s.nu + 1) + i, b = a + 1, c = a + s.nu + 1, d = c + 1;
      idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d;
    }
  }
  yield 'cradle: cloth';
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('aSheet', new BufferAttribute(sh, 4));
  g.setAttribute('aFold', new BufferAttribute(fo, 4));
  g.setAttribute('aDir', new BufferAttribute(di, 3));
  g.setAttribute('aTint', new BufferAttribute(ti, 3));
  g.setIndex(new BufferAttribute(idx, 1));
  const rig = deck.rig, fr = deck.frame;
  const m = new ShaderMaterial({
    uniforms: { ...rig.uniforms, uClip: G.uClip, uTime: G.uTime, uBend: { value: new Vector3(fr.a0, fr.z0, fr.floorR) }, ...uniforms },
    vertexShader: clothVert(rig), fragmentShader: clothFrag(rig), side: DoubleSide,
  });
  const mesh = new Mesh(g, m);
  fitBounds(mesh, fr);
  mesh.geometry.boundingSphere.radius += 3;
  return mesh;
}

// ---------------------------------------------------------------- the field of lengths
// Twenty rails along the court, a rail every 1.25 m, none over the lane the hoists send lengths up (z = 0: the first
// rail each side stands 1.55 m from its middle); every rail is cut by the cross lane at x = XC. A bath dyes several lengths, and they are hung side by side, so the reds come in
// runs along a rail. near(x, z) is how far a place is from the flight, for cutting the lengths it passes more finely.
function* hangField(rng, near, dens) {
  const sheets = [];
  let total = 0; for (const r of REDS) total += r.w;
  const pickRed = () => { let w = rng() * total; for (const r of REDS) { w -= r.w; if (w <= 0) return r; } return REDS[0]; };
  const fine = (q) => (dens < 0.75 ? Math.round(q * 0.6) : q);      // on the lower settings they are cut less finely
  const xs = [];
  for (let x1 = XC - LANE / 2 - GAP; x1 - WIDE >= CX0 + 0.9; x1 -= WIDE + GAP) xs.push(x1 - WIDE / 2);
  for (let x0 = XC + LANE / 2 + GAP; x0 + WIDE <= CX1 - 0.9; x0 += WIDE + GAP) xs.push(x0 + WIDE / 2);
  xs.sort((a, b) => a - b);
  for (let k = -NROW; k <= NROW; k++) {
    if (k === 0) continue;
    const z = rowZ(k);
    let run = 0, red = REDS[0], lenBase = 17;
    for (const x of xs) {
      if (run-- <= 0) { run = rng.i(1, 5); red = pickRed(); lenBase = rng.f(17.6, 19.7); if (rng.chance(0.3)) lenBase = rng.f(7.5, 15.5); }
      const hoist = k === 1 && Math.abs(x - HOIST_X) < 0.1;
      let len = clamp(lenBase + rng.f(-1.6, 1.2), 7.5, 19.8), c = rgb(rng.chance(0.9) ? red.c : pickRed().c), kk = rng.f(0.86, 1.1);
      // the one that was hung by mistake, in the outermost rail on the flat's side, where its window looks
      const weld = k === NROW && Math.abs(x + 1.4) < 0.8;
      if (weld) { c = rgb(WELD); kk = 1; len = 16.5; }
      // over the works the hems are kept above a dyer's pole; over the vats, above their steam
      const over = Math.abs(Math.abs(z) - 4.4) < 1.6 ? 5.2 : Math.abs(k) === 1 ? 3.5 : 3.1;
      len = Math.min(len, RAIL_Y - over);
      const d = near(x, z), dh = Math.hypot(x - HOIST_X, z - ROW1);
      // newly up, by the hoists: still wet, still swinging
      const wet = Math.abs(k) === 1 && x < HOIST_X + 0.5 && x > HOIST_X - 9.5 ? clamp(1.15 - (HOIST_X - x) / 9, 0, 1) : 0;
      let swing = rng.chance(0.14) ? rng.f(0.05, 0.13) : rng.f(0.008, 0.035);
      if (dh < 3.2 || wet > 0.3) swing = rng.f(0.1, 0.2);
      if (weld) swing = 0.05;
      const sheet = {
        x, z, top: RAIL_Y, len, w: WIDE, face: [0, 1], col: [c[0] * kk, c[1] * kk, c[2] * kk], phase: rng.f(0, TAU), swing, seed: rng(),
        kind: 0, wet: wet * rng.f(0.7, 1), nu: d < 3.6 ? fine(10) : d < 9 ? fine(6) : 2, ns: d < 3.6 ? fine(44) : d < 9 ? fine(24) : 10,
      };
      if (hoist) { const q = rgb('#7a0a3c'); Object.assign(sheet, { kind: 1, wet: 1, len: 11.5, col: [q[0], q[1], q[2]], swing: 0.05, nu: 10, ns: 60 }); }
      // the three that went up before it, across the lane: short lengths, their hems high, still running
      const before = k === -1 ? [HOIST_X, HOIST_X - 1.6, HOIST_X - 3.2].findIndex((q) => Math.abs(x - q) < 0.1) : -1;
      if (before >= 0) Object.assign(sheet, { len: [10.2, 12.6, 9.1][before], wet: [1, 0.9, 0.75][before], swing: [0.16, 0.12, 0.1][before] });
      sheets.push(sheet);
    }
    yield 'cradle: lengths';
  }
  return sheets;
}

// ---------------------------------------------------------------- drops
// Each is a short streak falling from a wet hem. It keeps the speed round the drum of the place it left, so in the
// court's own frame it falls s = g t2 / 2 and is carried (2s)^1.5 / (3 sqrt r) antispinward on the way.
const DRIP_VERT = /* glsl */`
attribute vec3 aSrc;     // where it lets go (flat)
attribute vec4 aDrop;    // seconds from one drop to the next, a phase, 1 if it hangs from the length on the hoist, its size (m)
${BEND_PARS}
uniform float uTime, uPx; uniform vec2 uRes; uniform vec4 uFall;   // g, 3 sqrt r, the hoisted hem's height now, the level it lands at
varying vec3 vW; varying vec2 vQ; varying float vK;
void main() {
  float y0 = aDrop.z > 0.5 ? uFall.z : aSrc.y;
  float tt = fract(uTime / aDrop.x + aDrop.y) * aDrop.x;
  float s = 0.5 * uFall.x * tt * tt, room = y0 - uFall.w;
  float live = step(s, room) * step(0.3, room) * smoothstep(0.0, 0.06, tt);
  vec3 a = vec3(aSrc.x - pow(2.0 * s, 1.5) / uFall.y, y0 - s, aSrc.z);
  // a streak as long as it falls in a thirtieth of a second
  float len = max(0.04, uFall.x * tt * 0.033);
  vec3 b = a + normalize(vec3(-3.0 * sqrt(2.0 * s) / uFall.y, -1.0, 0.0)) * len;
  vec3 n = vec3(0.0, 1.0, 0.0);
  kBend(a, n); kBend(b, n);
  vW = a;
  vec4 ca = projectionMatrix * viewMatrix * vec4(a, 1.0), cb = projectionMatrix * viewMatrix * vec4(b, 1.0);
  if (ca.w < 0.06 || cb.w < 0.06 || live < 0.5) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vK = 0.0; vQ = vec2(0.0); return; }
  vec2 sa = ca.xy / ca.w * uRes * 0.5, sb = cb.xy / cb.w * uRes * 0.5;
  vec2 d = sb - sa; d /= max(length(d), 1e-3);
  float px = aDrop.w * uPx / ca.w, shown = clamp(px, 1.4, 7.0);
  vec4 c = mix(ca, cb, position.y);
  c.xy += (vec2(-d.y, d.x) * position.x * shown + d * (position.y * 2.0 - 1.0) * shown * 0.5) / (uRes * 0.5) * c.w;
  vK = min(px / shown, 1.0); vQ = position.xy;
  gl_Position = c;
}`;
const DRIP_FRAG = /* glsl */`
${CLIP_PARS}
uniform vec3 uTint;
varying vec3 vW; varying vec2 vQ; varying float vK;
void main() {
  ${CLIP_FRAG}
  float a = (1.0 - abs(vQ.x) * 2.0) * smoothstep(0.0, 0.25, vQ.y) * vK;
  if (a <= 0.0) discard;
  gl_FragColor = vec4(uTint * a, 1.0);
}`;
function dripMesh(deck, drops, uFall) {
  const n = drops.length, g = new InstancedBufferGeometry(), fr = deck.frame;
  g.setAttribute('position', new Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const src = new Float32Array(n * 3), dr = new Float32Array(n * 4);
  drops.forEach((q, i) => { src.set(q.p, i * 3); dr.set([q.every, q.phase, q.hoist ? 1 : 0, q.size || 0.012], i * 4); });
  g.setAttribute('aSrc', new InstancedBufferAttribute(src, 3));
  g.setAttribute('aDrop', new InstancedBufferAttribute(dr, 4));
  g.instanceCount = n;
  const m = new ShaderMaterial({
    uniforms: { uClip: G.uClip, uTime: G.uTime, uPx: G.uPx, uRes: G.uRes, uBend: { value: new Vector3(fr.a0, fr.z0, fr.floorR) }, uFall, uTint: { value: new Vector3(1.5, 0.42, 0.4) } },
    vertexShader: DRIP_VERT, fragmentShader: DRIP_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
  });
  const mesh = new Mesh(g, m);
  mesh.frustumCulled = false; mesh.renderOrder = 9;
  return mesh;
}

// ---------------------------------------------------------------- people
// A figure drawn straight into a mesh, since the kit's own cannot hold anything: legs, a coat, a head with hair, arms.
// With `carry` its arms are out in front with a folded length laid over them; with `pole` they are up to hold one;
// with `sit` it sits (on a seat 0.46 m high). It faces +z turned by yaw. Nobody is drawn to be looked at from close.
function person(g, x, y, z, yaw, o = {}) {
  const k = (o.h || 1.7) / 1.7, coat = o.coat || WEAR[1], skin = o.skin || SKINS[1], hair = o.hair || HAIRS[0], legs = o.legs || '#57524f';
  g.at(x, y, z, yaw, k);
  const arm = (pts) => g.tube(pts, 0.047, 5, shade(coat, 0.9));
  // the head is drawn under a mirror, so that it is a ball seen from outside (kit/geo.js, the note on blob) and the
  // hair, a cap on the crown and the back of it, hides what is under it
  const head = (y, z) => { g.tint(0).at(0, y, z, 0, [1, -1, 1]).blob(0, 0, 0, 0.14, 1, skin, { shadeBottom: 1 }).blob(0, -0.05, -0.035, [0.146, 0.105, 0.142], 1, hair, { shadeBottom: 1 }).pop(); };
  if (o.sit) {
    g.tint(0.3).box(-0.17, 0.44, -0.08, 0.17, 0.6, 0.46, legs).box(-0.16, 0, 0.32, 0.16, 0.46, 0.47, legs, { skip: 'b' });
    g.tint(0.7).cyl(0, 0.5, -0.02, 0.22, 0.17, 0.6, 6, coat, { smooth: false });
    head(1.26, 0.01);
    g.tint(0.7); for (const sd of [-1, 1]) arm([[sd * 0.2, 1.04, 0], [sd * 0.24, 0.8, 0.12], [sd * 0.13, 0.63, 0.36]]);
    g.tint(0).pop();
    return;
  }
  g.tint(0.3).box(-0.15, 0, -0.1, 0.15, 0.86, 0.1, legs, { skip: 'b' });
  g.tint(0.7).cyl(0, 0.82, 0, 0.22, 0.17, 0.62, 6, coat, { smooth: false });
  if (o.apron) g.tint(0.6).box(-0.165, 0.42, 0.1, 0.165, 1.3, 0.208, o.apron, { skip: 'bn' });
  head(1.6, 0);
  g.tint(0.7);
  if (o.carry) {
    for (const sd of [-1, 1]) arm([[sd * 0.19, 1.37, 0.02], [sd * 0.24, 1.1, 0.1], [sd * 0.13, 1.05, 0.36]]);
    // the length, folded, over both forearms, one end hanging
    g.tint(0.4).box(-0.2, 1.08, 0.14, 0.2, 1.16, 0.42, o.carry).box(-0.18, 0.8, 0.385, 0.18, 1.1, 0.425, shade(o.carry, 0.86));
    if (o.carry2) g.box(-0.17, 1.16, 0.17, 0.17, 1.215, 0.4, o.carry2);
  } else if (o.pole) {
    // both hands on a pole that passes the right hip (see pole() in buildDyers)
    arm([[-0.19, 1.37, 0.02], [0.02, 1.24, 0.24], [0.25, 1.42, 0.3]]); arm([[0.19, 1.37, 0.02], [0.33, 1.22, 0.02], [0.27, 1.52, -0.02]]);
  } else for (const sd of [-1, 1]) arm([[sd * 0.2, 1.37, 0], [sd * 0.25, 1.08, 0.02], [sd * 0.24, 0.82, 0.05]]);
  g.tint(0).pop();
}

// ---------------------------------------------------------------- the works
const VAT_X = [-17, -12.4, -7.8, -3.2, 1.4, 10.6], VAT_Z = 4.4, VAT_R = 1.3;
const LIQUOR = [['Rose', '#b83a4c'], ['Madder', '#9a1c18'], ['Crimson', '#7c0822'], ['Brick', '#84341a'], ['Oxblood', '#3a080e'], ['Madder', '#a2221c']];
const RINSE = ['#6a0c1e', '#8a2432', '#a6484f', '#bd6e70', '#d09892', '#dfbcb4'];
// a pile of folded lengths, tied: n of them, squared up or not
function foldedStack(g, x, y, z, yaw, n, rng, reds) {
  g.at(x, y, z, yaw);
  for (let i = 0; i < n; i++) {
    const c = shade(rng.pick(reds), rng.f(0.85, 1.1)), dx = rng.f(-0.012, 0.012), dz = rng.f(-0.012, 0.012), t = 0.034;
    g.tint(0.4).box(-0.17 + dx, i * t, -0.12 + dz, 0.17 + dx, (i + 1) * t - 0.003, 0.12 + dz, c);
    g.box(-0.172 + dx, i * t + 0.004, -0.123 + dz, -0.17 + dx, (i + 1) * t - 0.007, 0.123 + dz, shade(c, 0.8));      // the fold's edge
  }
  g.tint(0).box(-0.008, 0, -0.125, 0.008, n * 0.034 + 0.002, 0.125, '#e9dfd0').pop();        // the tape round it
}
// a slate on a trestle, for the works' tallies
function slate(deck, g, x, z, n, lines, w, h) {
  const l = Math.hypot(n[0], n[1]), nx = n[0] / l, nz = n[1] / l, rx = nz, rz = -nx, y0 = 1.02;
  for (const s of [-1, 1]) {
    const px = x + rx * s * (w / 2 - 0.08), pz = z + rz * s * (w / 2 - 0.08);
    g.tube([[px + nx * 0.34, 0, pz + nz * 0.34], [px, y0 + h + 0.08, pz]], 0.022, 4, '#8a7460');
    g.tube([[px - nx * 0.42, 0, pz - nz * 0.42], [px, y0 + h + 0.08, pz]], 0.02, 4, '#7a6654');
  }
  const a = [x - rx * w / 2 - nx * 0.01, z - rz * w / 2 - nz * 0.01], b = [x + rx * w / 2 - nx * 0.01, z + rz * w / 2 - nz * 0.01];
  g.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y0 + h, b[1]], [a[0], y0 + h, a[1]], '#2a2f2d');
  g.quad([b[0], y0, b[1]], [a[0], y0, a[1]], [a[0], y0 + h, a[1]], [b[0], y0 + h, b[1]], '#5a4a40');
  g.tube([[a[0], y0 - 0.02, a[1]], [b[0], y0 - 0.02, b[1]]], 0.025, 4, WOODPALE); g.tube([[a[0], y0 + h + 0.02, a[1]], [b[0], y0 + h + 0.02, b[1]]], 0.025, 4, WOODPALE);
  deck.sign(lines, { at: [x + nx * 0.012, y0 + h / 2, z + nz * 0.012], n: [nx, nz], w: w - 0.1, h: h - 0.08, style: 'chalk', font: 'hand', ground: '#2a2f2d', ink: '#f1e9df', head: true });
}

function* buildWorks(deck, rng, dens, sheets) {
  const P = deck.pen(new Run(0, 0, 0, 0), 0, 'works'), g = P.g, reds = REDS.map((r) => r.c);
  const glows = [], drops = [];
  // ---- the vats: steel, on their elements, a lamp on an arm over each
  let nv = 0;
  for (const sd of [-1, 1]) for (const x of VAT_X) {
    const z = sd * VAT_Z, [name, liquor] = LIQUOR[(nv * 5 + (sd > 0 ? 2 : 0)) % LIQUOR.length];
    nv++;
    g.cyl(x, 0, z, 1.52, 1.52, 0.16, 20, '#7c7775', { smooth: false });
    g.cyl(x, 0.16, z, 1.2, 1.2, 0.17, 20, '#c8562c', { emit: 1.5, cap: false });                 // the element, dull red
    g.cyl(x, 0.32, z, VAT_R, VAT_R, 0.94, 24, STEEL, { cap: false });
    for (const y of [0.3, 0.76]) g.cyl(x, y, z, VAT_R + 0.035, VAT_R + 0.035, 0.06, 24, STEEL2, { cap: false });
    g.lathe(x, 1.26, z, [[VAT_R + 0.06, 0], [VAT_R + 0.06, 0.07], [VAT_R - 0.05, 0.07], [VAT_R - 0.05, -0.05]], 24, shade(STEEL, 1.08));
    P.f.tint(0).cyl(x, 1.2, z, VAT_R - 0.05, VAT_R - 0.05, 0.02, 24, liquor, { emit: 1, smooth: false });      // the liquor: it holds the lamp over it
    // its box of switches, with a light, and its plate
    const bx = x + 1.72, bz = z - sd * 0.9;
    g.box(bx - 0.04, 0, bz - 0.04, bx + 0.04, 1.05, bz + 0.04, IRON, { skip: 'b' }).box(bx - 0.16, 1.05, bz - 0.09, bx + 0.16, 1.5, bz + 0.09, '#b9b4ae');
    glows.push({ p: [bx, 1.4, bz - sd * 0.1], color: nv % 3 ? '#ffb070' : '#ffe0a0', power: 1.0, size: 0.13 });
    deck.sign(['Vat ' + nv, name], { at: [x, 0.98, z - sd * (VAT_R + 0.012)], n: [0, -sd], w: 0.62, h: 0.34, style: 'plate', font: 'cond', font2: 'serif', head: true });
    // some have a length winding through the bath over a roller
    if (nv % 3 !== 1) {
      const wet = shade(liquor, 1.25);
      for (const dx of [-1.5, 1.5]) g.tube([[x + dx, 0, z - 0.5], [x + dx, 2.5, z], [x + dx, 0, z + 0.5]], 0.035, 4, IRON);
      g.tube([[x - 1.56, 2.5, z], [x + 1.56, 2.5, z]], 0.1, 8, '#b8a890');
      for (const s of [-1, 1]) P.c.quad([x - 0.75, 1.2, z + s * 0.62], [x + 0.75, 1.2, z + s * 0.62], [x + 0.75, 2.6, z + s * 0.1], [x - 0.75, 2.6, z + s * 0.1], wet);
      P.c.quad([x - 0.75, 2.6, z - 0.1], [x + 0.75, 2.6, z - 0.1], [x + 0.75, 2.6, z + 0.1], [x - 0.75, 2.6, z + 0.1], wet);
    }
    // steam: it rises toward the axis and is carried a little spinward
    for (let i = 0, n = Math.round(40 * dens); i < n; i++) {
      const a = rng() * TAU, r = Math.sqrt(rng()) * 1.05;
      glows.push({ p: [x + Math.cos(a) * r, 1.25 + rng.f(0, 0.5), z + Math.sin(a) * r], color: '#ffe0d6', power: rng.f(0.05, 0.11), size: rng.f(1.0, 2.5), move: [rng.f(0.06, 0.15), rng.f(0.28, 0.52), rng.f(-0.03, 0.03)], loop: rng.f(7, 11), phase: rng() });
    }
    yield 'cradle: vats';
  }
  // the lamps over the vats, on arms (one each side of the cross aisle too): they are the lattice the vats are lit by
  for (const sd of [-1, 1]) for (let i = 0; i < 7; i++) {
    const lx = -17 + i * 4.6, lz = sd * VAT_Z;
    g.tube([[lx - 1.62, 0, lz], [lx - 1.62, 2.9, lz], [lx - 1.4, 3.35, lz], [lx - 0.9, 3.5, lz], [lx, 3.42, lz]], 0.028, 5, IRON);
    g.cyl(lx, 3.2, lz, 0.3, 0.07, 0.22, 10, '#d9d2c8', { smooth: false });
    g.cyl(lx, 3.19, lz, 0.22, 0.22, 0.012, 10, '#fff2dc', { emit: 5, base: true, cap: false, smooth: false });
    glows.push({ p: [lx, 3.16, lz], color: '#ffe2c0', power: 1.7, size: 0.48 });
  }
  deck.lattice({ origin: [-17, 3.2, -VAT_Z], spacing: [4.6, 2 * VAT_Z], count: [7, 2], color: '#ffe6cc', power: 1.5, reach: 3.0, drop: 6, above: 30 });
  yield 'cradle: lamps';

  // ---- the rinse troughs, each side of the lane: six baths, the cloth going from the reddest to the clearest
  // (the water comes the other way), and a hoist at the spinward end
  for (const sd of [-1, 1]) {
    const z = sd * ROW1, z0 = z - TROUGH.w / 2, z1 = z + TROUGH.w / 2, { x0, x1, h, water } = TROUGH, nb = RINSE.length;
    for (let x = x0 + 0.25; x < x1; x += 1.9) for (const dz of [-0.32, 0.32]) g.box(x - 0.035, 0, z + dz - 0.035, x + 0.035, 0.16, z + dz + 0.035, IRON, { skip: 'tb' });
    g.box(x0, 0.14, z0, x1, 0.17, z1, STEEL2);
    g.box(x0, 0.17, z0, x1, h, z0 + 0.03, STEEL).box(x0, 0.17, z1 - 0.03, x1, h, z1, STEEL).box(x0, 0.17, z0 + 0.03, x0 + 0.03, h, z1 - 0.03, STEEL).box(x1 - 0.03, 0.17, z0 + 0.03, x1, h, z1 - 0.03, STEEL);
    for (let i = 0; i < nb; i++) {
      const xa = lerp(x0, x1, i / nb), xb = lerp(x0, x1, (i + 1) / nb);
      const wy = water - (nb - 1 - i) * 0.014;
      P.f.tint(0).floor(xa + 0.03, z0 + 0.03, xb - 0.015, z1 - 0.03, wy, RINSE[i], { emit: 1 });
      if (i < nb - 1) g.box(xb - 0.015, 0.17, z0 + 0.03, xb + 0.015, h - 0.035, z1 - 0.03, STEEL2);
      // a length lying in the bath, its folds just breaking the water
      if ((i + (sd > 0 ? 1 : 0)) % 2 === 0 || i === nb - 1) for (let k = 0, n = rng.i(2, 4); k < n; k++) g.at(rng.f(xa + 0.5, xb - 0.5), wy - 0.045, z + rng.f(-0.18, 0.18), rng.f(-0.3, 0.3), [1, -1, 1]).blob(0, 0, 0, [rng.f(0.2, 0.4), 0.065, rng.f(0.08, 0.16)], 1, shade(mixc(RINSE[i], '#7a0a3c', 0.45), 0.62), { lump: 0.3, seed: i * 7 + k, shadeBottom: 1 }).pop();
      for (let k = 0, n = Math.round(3 * dens); k < n; k++) glows.push({ p: [rng.f(xa, xb), water + rng.f(0, 0.3), z + rng.f(-0.3, 0.3)], color: '#ffe6de', power: rng.f(0.02, 0.05), size: rng.f(0.6, 1.3), move: [rng.f(0.03, 0.08), rng.f(0.14, 0.26), 0], loop: rng.f(6, 9), phase: rng() });
    }
    // the feed pipe along its outer side, and the drain under it
    g.tube([[x0, 0.72, z + sd * 0.47], [x1 + 0.3, 0.72, z + sd * 0.47], [x1 + 0.3, 0, z + sd * 0.47]], 0.03, 5, '#a35a44');
    deck.sign('First rinse', { at: [lerp(x0, x1, 0.5 / nb), 0.42, z - sd * (TROUGH.w / 2 + 0.006)], n: [0, -sd], w: 0.7, h: 0.15, style: 'plate', font: 'cond' });
    deck.sign('Last rinse', { at: [lerp(x0, x1, 5.5 / nb), 0.42, z - sd * (TROUGH.w / 2 + 0.006)], n: [0, -sd], w: 0.7, h: 0.15, style: 'plate', font: 'cond' });
    // the hoist: a frame over the last bath, its ropes up to the rail, a lamp, a plate
    const hx = HOIST_X, fz = z + sd * 0.62;
    for (const dx of [-0.98, 0.98]) g.box(hx + dx - 0.045, 0, fz - 0.045, hx + dx + 0.045, 2.75, fz + 0.045, STEEL2, { skip: 'b' });
    g.box(hx - 1.03, 2.66, fz - 0.05, hx + 1.03, 2.75, fz + 0.05, STEEL2);
    g.tube([[hx - 0.9, 2.3, fz], [hx + 0.9, 2.3, fz]], 0.11, 8, '#a89a8a');
    g.box(hx + 0.98, 1.0, fz - 0.16, hx + 1.06, 1.3, fz + 0.16, '#b9b4ae');
    for (const dx of [-0.805, 0.805]) g.box(hx + dx - 0.009, water, z - 0.009, hx + dx + 0.009, RAIL_Y, z + 0.009, '#d8ccb8', { skip: 'tb' });
    g.cyl(hx + 1.02, 2.86, fz, 0.2, 0.06, 0.16, 8, '#d9d2c8', { smooth: false });
    g.cyl(hx + 1.02, 2.85, fz, 0.15, 0.15, 0.012, 8, '#fff2dc', { emit: 5, base: true, cap: false, smooth: false });
    glows.push({ p: [hx + 1.02, 2.82, fz], color: '#ffe2c0', power: 2.0, size: 0.6 });
    deck.sign(['Hoist ' + (sd > 0 ? 2 : 1), 'Stand spinward of a wet length'], { at: [hx - 0.98 - 0.05, 1.72, fz - sd * 0.02], n: [-0.8, -sd * 0.6], w: 0.95, h: 0.4, style: 'plate', font: 'cond', font2: 'serif', head: true });
  }
  deck.lattice({ origin: [HOIST_X + 1.02, 2.85, -ROW1 - 0.62], spacing: [1, 2 * (ROW1 + 0.62)], count: [1, 2], color: '#ffe6cc', power: 1.3, reach: 2.6, drop: 6, above: 30 });
  // drops from the hems that are still wet, and from the one going up: none follows the last from the same place
  // before that one has landed (h metres take sqrt(2h / g) seconds: 1.8 s from 13 m)
  for (const s of sheets) {
    if (s.kind === 1) { for (let i = 0; i < 16; i++) drops.push({ p: [s.x + rng.f(-0.72, 0.72), 0, s.z + rng.f(-0.03, 0.03)], every: rng.f(1.75, 2.5), phase: rng(), hoist: true, size: 0.016 }); continue; }
    if (s.wet < 0.25) continue;
    const fall = Math.sqrt(2 * Math.max(s.top - s.len - TROUGH.water, 0.1) / GRAV);
    for (let i = 0, n = Math.round(2 + s.wet * 8); i < n; i++) drops.push({ p: [s.x + rng.f(-0.72, 0.72), s.top - s.len, s.z + rng.f(-0.03, 0.03)], every: Math.max(rng.f(1.8, 3.6) / (0.4 + s.wet), fall + 0.15), phase: rng(), size: 0.015 });
  }
  yield 'cradle: troughs';
  P.done();
  deck.glow(glows);
  return { drops };
}

// The rails under the ceiling, and the lamps hung in the lanes at three heights so that a red can be judged by lamp
// light as well as by the ceiling's. The lamps are one lattice of the deck's light, so the cloth beside each one is
// lit by it on the near face and glows with it on the far one.
const LAMPS = { x0: -21.5, dx: 4.5, nx: 10, z0: -9.5, dz: 3.8, nz: 6, y0: 6, rise: 6, n: 3 };
function* buildRails(deck, rng) {
  const P = deck.pen(new Run(0, 0, 0, 0), 0, 'rails'), g = P.g, glows = [];
  for (let k = -NROW; k <= NROW; k++) {
    if (k === 0) continue;
    const z = rowZ(k);
    g.box(CX0 + 0.7, RAIL_Y, z - 0.028, CX1 - 0.7, RAIL_Y + 0.07, z + 0.028, IRON);
    for (let x = CX0 + 2.5; x < CX1 - 1; x += 8.6) g.box(x - 0.014, RAIL_Y + 0.07, z - 0.014, x + 0.014, TOP - 0.05, z + 0.014, IRON, { skip: 'tb' });
    if (k % 4 === 0) yield 'cradle: rails';
  }
  // two beams across the rails' ends, which the rails are run out along when a rail is full
  for (const x of [CX0 + 0.7, CX1 - 0.7]) g.box(x - 0.05, RAIL_Y + 0.07, -NROW * ROW - 0.3, x + 0.05, RAIL_Y + 0.19, NROW * ROW + 0.3, STEEL2);
  for (let i = 0; i < LAMPS.nx; i++) for (let j = 0; j < LAMPS.nz; j++) {
    const x = LAMPS.x0 + i * LAMPS.dx, z = LAMPS.z0 + j * LAMPS.dz;
    g.box(x - 0.007, LAMPS.y0, z - 0.007, x + 0.007, TOP - 0.05, z + 0.007, '#2e2a2a', { skip: 'tb' });
    for (let k = 0; k < LAMPS.n; k++) {
      const y = LAMPS.y0 + k * LAMPS.rise;
      if (!deck.clear(x, y, z, 1.3)) continue;
      g.blob(x, y, z, [0.085, 0.1, 0.085], 1, '#fff0da', { emit: 4.5, shadeBottom: 1 });
      g.cyl(x, y + 0.09, z, 0.035, 0.02, 0.06, 5, '#4a4644', { smooth: false });
      glows.push({ p: [x, y, z], color: '#ffcf9c', power: 1.7, size: 0.5 });
    }
    yield 'cradle: lamps';
  }
  deck.lattice({ origin: [LAMPS.x0, LAMPS.y0, LAMPS.z0], spacing: [LAMPS.dx, LAMPS.dz], count: [LAMPS.nx, LAMPS.nz], storeys: LAMPS.n, rise: LAMPS.rise, drop: 4, above: 3, color: '#ffc890', power: 2.6, reach: 1.3 });
  P.done();
  deck.glow(glows);
}

// The dyers, and what the works has written up. A dyer is seen by the pole in the hands: stirring a bath, or
// steadying a length as the hoist takes it.
function* buildDyers(deck, rng, dens) {
  const P = deck.pen(new Run(0, 0, 0, 0), 0, 'dyers'), g = P.g, reds = REDS.map((r) => r.c);
  const APRON = ['#b3a898', '#a89888', '#a8807a', '#96706a', '#b8ac9c'];
  const dyer = (x, z, yaw, o = {}) => person(g, x, 0, z, yaw, { coat: rng.pick(WEAR), skin: rng.pick(SKINS), hair: rng.pick(HAIRS), apron: rng.pick(APRON), ...o });
  // a pole through a dyer's hands: three places along it, in the dyer's own frame (right, up, ahead)
  const pole = (x, z, yaw, a, b, c) => { const cs = Math.cos(yaw), sn = Math.sin(yaw), W = (q) => (q.length === 4 ? [q[0], q[1], q[2]] : [x + q[0] * cs + q[2] * sn, q[1], z - q[0] * sn + q[2] * cs]); g.tube([W(a), W(b), W(c)], 0.02, 5, WOODPALE); };
  // at the vats: one or two each, a pole over the rim into the bath
  let i = 0;
  for (const sd of [-1, 1]) for (const vx of VAT_X) {
    i++;
    if (i % 3 === 0) yield 'cradle: dyers';
    if (i % 4 === 2 && vx > -6) continue;
    for (let k = vx < -6 ? 1 : 0; k < (i % 3 === 0 || vx < -6 ? 2 : 1); k++) {
      const a = (sd > 0 ? -1 : 1) * (0.5 + k * 1.9) + rng.f(-0.25, 0.25) + (sd > 0 ? Math.PI : 0), r = VAT_R + 0.55;
      const px = vx + Math.sin(a) * r, pz = sd * VAT_Z + Math.cos(a) * r, yaw = a + Math.PI;
      if (!deck.clear(px, 1.2, pz, 2.6)) continue;
      dyer(px, pz, yaw, { pole: true });
      pole(px, pz, yaw, [0.27, 1.78, -0.75], [0.27, 1.42, 0.3], [0.27, 1.08, 1.3]);
    }
  }
  yield 'cradle: dyers';
  // at the hoist that is working: one steadies the length with a pole as it goes, one stands back to watch it up;
  // and one at the other trough, moving a length on to the next bath
  const hz = ROW1 + 0.62;
  dyer(HOIST_X + 1.75, hz + 0.75, -2.2, { pole: true, apron: '#a8807a', h: 1.74 });
  pole(HOIST_X + 1.75, hz + 0.75, -2.2, [0.51, 1.0, -0.45], [0.27, 1.47, 0.14], [HOIST_X + 0.6, 2.7, ROW1 + 0.1, 1]);
  dyer(HOIST_X + 2.6, hz + 2.3, -2.5, { h: 1.62 });
  dyer(HOIST_X - 2.4, -ROW1 - 1.4, 0, { pole: true });
  pole(HOIST_X - 2.4, -ROW1 - 1.4, 0, [0.27, 2.02, -0.5], [0.27, 1.42, 0.3], [0.27, 0.56, 1.45]);
  // the tallies: orders on one slate, the argument on the other
  slate(deck, g, -5.5, -3.05, [-0.55, 0.83], ['Cradle cloth', 'On order  1,940 lengths', 'The most in fourteen years', 'Which red  not settled'], 1.6, 1.2);
  slate(deck, g, -0.9, -3.05, [-0.5, 0.87], ['Which red', 'Rose  IIII IIII IIII', 'Madder  IIII IIII IIII II', 'Crimson  IIII IIII IIII I', 'Brick  IIII III', 'Oxblood  IIII IIII IIII', 'Weld  I'], 1.5, 1.45);
  yield 'cradle: slates';
  // beyond the cross lane: tables where the dry lengths are folded, tied and stacked for the carts
  for (let t = 0; t < 4; t++) {
    const tx = 11.2 + t * 3.1, tz = (t % 2 ? 1 : -1) * 1.05;
    g.box(tx - 1.1, 0.74, tz - 0.48, tx + 1.1, 0.79, tz + 0.48, WOODPALE);
    for (const dx of [-1.0, 1.0]) for (const dz of [-0.4, 0.4]) g.box(tx + dx - 0.03, 0, tz + dz - 0.03, tx + dx + 0.03, 0.74, tz + dz + 0.03, '#8a7460', { skip: 'tb' });
    for (let k = 0; k < 5; k++) if (rng() < 0.85) foldedStack(g, tx - 0.86 + k * 0.43, 0.79, tz + rng.f(-0.12, 0.12), rng.f(-0.12, 0.12), rng.i(3, 12), rng, reds);
    const side = tz > 0 ? 1 : -1;
    dyer(tx + rng.f(-0.5, 0.5), tz + side * 0.85, side > 0 ? Math.PI : 0, { carry: rng.pick(reds) });
    yield 'cradle: tables';
  }
  for (const [cx, cz, yaw] of [[9.6, 2.9, 0.3], [17.8, -2.7, 1.7], [-15.5, 1.9, 0.1]]) {
    deck.put('cart', { p: [cx, 0, cz], yaw, color: '#8a7a70' });
    for (let k = 0; k < 2; k++) foldedStack(g, cx + Math.cos(yaw) * (k * 0.45 - 0.2), 0.46, cz - Math.sin(yaw) * (k * 0.45 - 0.2), yaw, rng.i(5, 9), rng, reds);
  }
  P.done();
  // and people walking the works, outside the vats
  for (const [z, n] of [[7.4, 3], [-7.4, 3], [11.2, 2], [-11.2, 2]]) deck.walkersAlong({ from: [z > 0 ? -22.5 : 22.5, 0, z], to: [z > 0 ? 22.5 : -22.5, 0, z], n: Math.round(n * dens), spread: 0.3, speed: 0.95, rng, child: 0 });
  yield 'cradle: tables';
}

// ---------------------------------------------------------------- the flat
// On the third terrace's back side. Drawn in the row's own co-ordinates: u along the terrace (it is the deck's x),
// y above the terrace's floor, v in from the line of the doors. From the terrace: the front door (A) into the kitchen;
// the small room's window; and the door (B) of the room the neighbours have come round by.
const FLAT = {
  u0: -9.6, u1: 0.9,
  K: { u0: -9.4, u1: -5.0, v0: 0.2, v1: 4.9 },         // the kitchen
  S: { u0: -4.86, u1: -1.76, v0: 0.2, v1: 3.5 },       // the small room
  N: { u0: -1.62, u1: 0.7, v0: 0.2, v1: 4.9 },         // the next room
  doorA: [-8.87, -7.93], doorB: [-0.62, 0.32], win: [-4.3, -2.3, 0.82, 2.2],
  door1: [1.55, 2.5], door2: [1.7, 2.6],               // in the two partitions: places along v
  H: 2.95,
};
const PLASTER = '#d6c8c0', CREAM = '#dcc6a6', ROSY = '#e0c8b6', OLDWOOD = '#5c4130', MIDWOOD = '#8a6a4c';

// walls with openings: two faces t apart, and the reveals of each opening. axis 'u': a wall along u between v = c0 and
// c0 + t; axis 'v': along v between u = c0 and c0 + t. holes: [{ a0, a1, y0, y1 }]
function wallKit(g) {
  const face = (axis, c, a0, a1, y0, y1, dir, col, e = 0) => {
    if (a1 - a0 < 1e-4 || y1 - y0 < 1e-4) return;
    if (axis === 'u') { if (dir < 0) g.quad([a1, y0, c], [a0, y0, c], [a0, y1, c], [a1, y1, c], col, e); else g.quad([a0, y0, c], [a1, y0, c], [a1, y1, c], [a0, y1, c], col, e); }
    else if (dir < 0) g.quad([c, y0, a0], [c, y0, a1], [c, y1, a1], [c, y1, a0], col, e); else g.quad([c, y0, a1], [c, y0, a0], [c, y1, a0], [c, y1, a1], col, e);
  };
  const wall = (axis, c0, t, a0, a1, H, holes, colN, colP, trim) => {
    const hs = holes.slice().sort((p, q) => p.a0 - q.a0), other = axis === 'u' ? 'v' : 'u';
    for (const [c, dir, col] of [[c0, -1, colN], [c0 + t, 1, colP]]) {
      if (!col) continue;
      let at = a0;
      for (const h of hs) { face(axis, c, at, h.a0, 0, H, dir, col); face(axis, c, h.a0, h.a1, 0, h.y0, dir, col); face(axis, c, h.a0, h.a1, h.y1, H, dir, col); at = h.a1; }
      face(axis, c, at, a1, 0, H, dir, col);
    }
    for (const h of hs) {
      face(other, h.a0, c0, c0 + t, h.y0, h.y1, 1, trim); face(other, h.a1, c0, c0 + t, h.y0, h.y1, -1, trim);
      if (axis === 'u') { g.floor(h.a0, c0, h.a1, c0 + t, h.y1, trim, { down: true }); if (h.y0 > 0.01) g.floor(h.a0, c0, h.a1, c0 + t, h.y0, trim); }
      else { g.floor(c0, h.a0, c0 + t, h.a1, h.y1, trim, { down: true }); if (h.y0 > 0.01) g.floor(c0, h.a0, c0 + t, h.a1, h.y0, trim); }
    }
  };
  // a board along the foot of a wall (or anywhere up it): on the face at c that looks dir
  const board = (axis, c, a0, a1, y0, y1, dir, col, t = 0.014) => {
    const c1 = c + dir * t, lo = Math.min(c, c1), hi = Math.max(c, c1);
    if (axis === 'u') g.box(a0, y0, lo, a1, y1, hi, col, { skip: dir < 0 ? 's' : 'n' }); else g.box(lo, y0, a0, hi, y1, a1, col, { skip: dir < 0 ? 'e' : 'w' });
  };
  return { face, wall, board };
}

// The shell: walls, floors, ceiling, the doors' frames and leaves, the window. Returns nothing; the rooms are filled after.
function flatShell(deck, P, run, rng) {
  const g = P.g, { K, S, N, H } = FLAT, W = wallKit(g), trim = '#cbb89c', dark = '#6a5444';
  const A = FLAT.doorA, B = FLAT.doorB, WN = FLAT.win, D1 = FLAT.door1, D2 = FLAT.door2, back = K.v1;
  // the wall on the terrace
  W.wall('u', 0, 0.2, FLAT.u0, FLAT.u1, 3, [{ a0: A[0], a1: A[1], y0: 0, y1: 2.06 }, { a0: WN[0], a1: WN[1], y0: WN[2], y1: WN[3] }, { a0: B[0], a1: B[1], y0: 0, y1: 2.06 }], PLASTER, CREAM, trim);
  g.box(FLAT.u0, 0, -0.022, A[0] - 0.1, 1.0, 0, '#8f8480', { skip: 'bs' }).box(A[1] + 0.1, 0, -0.022, B[0] - 0.1, WN[2] - 0.08, 0, '#8f8480', { skip: 'bs' }).box(B[1] + 0.1, 0, -0.022, FLAT.u1, 1.0, 0, '#8f8480', { skip: 'bs' });
  for (const d of [A, B]) {
    g.box(d[0] - 0.1, 0, -0.04, d[0], 2.16, 0.02, dark, { skip: 'b' }).box(d[1], 0, -0.04, d[1] + 0.1, 2.16, 0.02, dark, { skip: 'b' }).box(d[0], 2.06, -0.04, d[1], 2.16, 0.02, dark);
    g.floor(d[0], -0.5, d[1], 0.2, 0.012, '#6e3a34');                                                   // a mat, and the sill
    const lu = d[1] + 0.34;
    g.box(lu - 0.05, 1.86, -0.1, lu + 0.05, 2.0, 0, '#3f3f40').box(lu - 0.07, 1.72, -0.13, lu + 0.07, 1.86, -0.02, '#ffe9c0', { emit: 3 });
    deck.glow([{ p: run.pt(lu, 1.79, -0.14), color: '#ffdcb8', power: 1.3, size: 0.5 }]);
  }
  deck.sign('37', { at: run.pt(A[1] + 0.34, 1.5, -0.012), n: [0, -1], h: 0.13, w: 0.3, style: 'plate', font: 'cond' });
  deck.sign('38', { at: run.pt(B[1] + 0.34, 1.5, -0.012), n: [0, -1], h: 0.13, w: 0.3, style: 'plate', font: 'cond' });
  // both doors stand open: A's leaf back against the kitchen's wall, B's into the next room
  const leaf = (u, v0, v1, col) => { g.box(u - 0.022, 0.02, v0, u + 0.022, 2.04, v1, col, { skip: 'b' }); for (const [y0, y1] of [[0.2, 0.95], [1.08, 1.88]]) for (const s of [-1, 1]) g.box(Math.min(u + s * 0.022, u + s * 0.034), y0, v0 + 0.14, Math.max(u + s * 0.022, u + s * 0.034), y1, v1 - 0.14, shade(col, 1.14)); };
  leaf(A[0] - 0.03, 0.22, 1.14, '#7e2d33');
  g.box(A[0] - 0.02, 0.98, 1.02, A[0] + 0.07, 1.1, 1.06, '#b08d4a');
  leaf(B[1] + 0.03, 0.22, 1.14, '#8a7a70');
  // the window: a frame, a mullion and a bar, four panes, a board for a sill inside
  const fw = 0.06;
  g.box(WN[0], WN[2], 0.05, WN[0] + fw, WN[3], 0.13, trim, { skip: 'tb' }).box(WN[1] - fw, WN[2], 0.05, WN[1], WN[3], 0.13, trim, { skip: 'tb' });
  g.box(WN[0], WN[2], 0.05, WN[1], WN[2] + fw, 0.13, trim).box(WN[0], WN[3] - fw, 0.05, WN[1], WN[3], 0.13, trim);
  const wm = (WN[0] + WN[1]) / 2, wb = WN[2] + (WN[3] - WN[2]) * 0.64;
  g.box(wm - 0.025, WN[2] + fw, 0.065, wm + 0.025, WN[3] - fw, 0.115, trim, { skip: 'tb' }).box(WN[0] + fw, wb - 0.02, 0.07, WN[1] - fw, wb + 0.02, 0.11, trim);
  P.gl.quad([WN[1] - fw, WN[2] + fw, 0.09], [WN[0] + fw, WN[2] + fw, 0.09], [WN[0] + fw, WN[3] - fw, 0.09], [WN[1] - fw, WN[3] - fw, 0.09], '#e6d8d8');
  g.box(WN[0] - 0.06, WN[2] - 0.035, 0.2, WN[1] + 0.06, WN[2], 0.36, trim);
  g.box(WN[0] - 0.08, WN[2] - 0.06, -0.06, WN[1] + 0.08, WN[2], 0.0, '#b8aca4');                         // and a stone one outside
  // the walls between and behind
  W.wall('v', FLAT.u0, 0.2, 0.2, back + 0.14, H, [], null, CREAM, trim);
  W.wall('v', K.u1, 0.14, 0.2, back, H, [{ a0: D1[0], a1: D1[1], y0: 0, y1: 2.05 }], CREAM, ROSY, trim);
  W.wall('v', S.u1, 0.14, 0.2, back, H, [{ a0: D2[0], a1: D2[1], y0: 0, y1: 2.05 }], ROSY, '#cdb89c', trim);
  W.wall('v', N.u1, 0.2, 0.2, back + 0.14, H, [], '#cdb89c', null, trim);
  W.wall('u', back, 0.14, FLAT.u0 + 0.2, FLAT.u1 - 0.2, H, [], CREAM, null, trim);
  W.wall('u', S.v1, 0.14, S.u0, S.u1, H, [], ROSY, null, trim);
  // frames round the two inner doorways, skirtings, and a rail for pictures
  for (const [u, d, ws] of [[K.u1, D1, [-1, 1]], [S.u1, D2, [-1, 1]]]) for (const s of ws) {
    const c = s < 0 ? u : u + 0.14;
    W.board('v', c, d[0] - 0.09, d[0], 0, 2.14, s, dark, 0.02); W.board('v', c, d[1], d[1] + 0.09, 0, 2.14, s, dark, 0.02); W.board('v', c, d[0], d[1], 2.05, 2.14, s, dark, 0.02);
  }
  const sk = (axis, c, a0, a1, dir) => { W.board(axis, c, a0, a1, 0.02, 0.12, dir, dark); W.board(axis, c, a0, a1, 2.2, 2.24, dir, trim, 0.012); };
  sk('v', K.u0, K.v0, K.v1, 1); sk('u', K.v1, K.u0, K.u1, -1); sk('v', K.u1, K.v0, D1[0] - 0.09, -1); sk('v', K.u1, D1[1] + 0.09, K.v1, -1); sk('u', K.v0, A[1] + 0.1, K.u1, 1);
  sk('v', S.u0, S.v0, D1[0] - 0.09, 1); sk('v', S.u0, D1[1] + 0.09, S.v1, 1); sk('u', S.v1, S.u0, S.u1, -1); sk('v', S.u1, S.v0, D2[0] - 0.09, -1); sk('v', S.u1, D2[1] + 0.09, S.v1, -1);
  sk('u', S.v0, S.u0, WN[0] - 0.1, 1); sk('u', S.v0, WN[1] + 0.1, S.u1, 1);
  sk('v', N.u0, N.v0, D2[0] - 0.09, 1); sk('v', N.u0, D2[1] + 0.09, N.v1, 1); sk('u', N.v1, N.u0, N.u1, -1); sk('v', N.u1, N.v0, N.v1, -1);
  // floors of old boards, each room's laid its own way; ceilings
  const boards = (r, along, col) => {
    P.f.tint(0);
    if (along === 'v') for (let u = r.u0; u < r.u1 - 0.01; u += 0.145) P.f.floor(u + 0.004, r.v0, Math.min(r.u1, u + 0.141), r.v1, 0.02, shade(col, rng.f(0.84, 1.1)), { emit: 0.5 });
    else for (let v = r.v0; v < r.v1 - 0.01; v += 0.145) P.f.floor(r.u0, v + 0.004, r.u1, Math.min(r.v1, v + 0.141), 0.02, shade(col, rng.f(0.84, 1.1)), { emit: 0.5 });
    g.floor(r.u0, r.v0, r.u1, r.v1, 0.014, '#2e241e');
    g.floor(r.u0, r.v0, r.u1, r.v1, H, '#e2d6c4', { down: true, emit: 0.2 });
  };
  boards(K, 'v', '#8e6c4a'); boards(S, 'u', '#93704c'); boards(N, 'v', '#86664a');
  for (const [u, d] of [[K.u1, D1], [S.u1, D2]]) g.floor(u, d[0], u + 0.14, d[1], 0.022, '#6e5038');     // thresholds
  g.floor(A[0], 0, A[1], 0.2, 0.022, '#6e5038').floor(B[0], 0, B[1], 0.2, 0.022, '#6e5038');
}

// The kitchen (docs/ashgrove.md, The flat): the table that was somebody's grandmother's, four chairs that do not
// match, the starter crock, a metre of herbs under a grow lamp, the larder cupboard. What the docs do not list is
// what any kitchen has, and one thing this week has brought: the reds the neighbours have left, folded, on the table.
function* kitchen(deck, P, run, rng) {
  const g = P.g, { K } = FLAT, F = 0.02, reds = REDS.map((r) => r.c), TX = -7.15, TV = 3.35, TOPY = 0.782 + F;
  // the table: a thick top on four turned legs, one leg newer than the rest, a board let into the top
  g.box(TX - 0.78, 0.735 + F, TV - 0.42, TX + 0.78, TOPY, TV + 0.42, OLDWOOD, { top: '#684834' });
  g.box(TX - 0.7, 0.63 + F, TV - 0.34, TX + 0.7, 0.735 + F, TV + 0.34, shade(OLDWOOD, 0.85), { skip: 't' });
  [[-0.66, -0.3], [0.66, -0.3], [-0.66, 0.3], [0.66, 0.3]].forEach(([du, dv], i) => g.lathe(TX + du, F, TV + dv, [[0.028, 0], [0.037, 0.1], [0.03, 0.18], [0.045, 0.34], [0.031, 0.5], [0.043, 0.63]], 8, i === 0 ? '#a88a62' : OLDWOOD));
  g.box(TX + 0.2, TOPY, TV - 0.42, TX + 0.4, TOPY + 0.002, TV + 0.06, '#86664a');
  g.floor(TX - 1.3, TV - 0.9, TX + 1.3, TV + 0.9, 0.026, '#6e3a34').floor(TX - 1.18, TV - 0.78, TX + 1.18, TV + 0.78, 0.028, '#7c4a3e');      // a rug that was red
  // on it: the starter crock under its cloth, a spoon, two cups, a plate of hard bread, and the reds
  const cx = TX + 0.42, cv = TV - 0.08;
  g.lathe(cx, TOPY, cv, [[0.085, 0], [0.11, 0.03], [0.116, 0.15], [0.096, 0.2], [0.09, 0.215]], 12, (k) => (k === 1 ? '#8c7a62' : '#b9a88c'));
  g.cyl(cx, TOPY + 0.2, cv, 0.104, 0.1, 0.03, 12, '#e8dcc8', { smooth: false }).cyl(cx, TOPY + 0.196, cv, 0.107, 0.107, 0.012, 12, '#8a3038', { cap: false });
  g.tube([[cx + 0.2, TOPY + 0.008, cv + 0.14], [cx + 0.38, TOPY + 0.01, cv + 0.02]], 0.008, 4, '#b89a70');
  g.cyl(cx + 0.19, TOPY, cv + 0.15, 0.022, 0.02, 0.008, 6, '#b89a70', { smooth: false });
  for (const [du, dv, c] of [[-0.02, 0.26, '#d8ccb8'], [0.25, -0.24, '#c9b8a8']]) { g.cyl(cx + du, TOPY, cv + dv, 0.06, 0.06, 0.008, 10, '#cfc4b0', { smooth: false }); g.cyl(cx + du, TOPY + 0.008, cv + dv, 0.032, 0.04, 0.07, 10, c, { top: '#5a3a2a' }); }
  g.cyl(TX - 0.02, TOPY, TV + 0.24, 0.12, 0.12, 0.012, 12, '#d6ccb8', { smooth: false });
  for (let i = 0; i < 3; i++) g.blob(TX - 0.06 + i * 0.05, TOPY + 0.035, TV + 0.24 + (i - 1) * 0.03, [0.06, 0.025, 0.035], 0, '#b08850', { seed: i + 3, shadeBottom: 0.8 });
  foldedStack(g, TX - 0.42, TOPY, TV - 0.02, 0.15, 12, rng, reds);
  foldedStack(g, TX - 0.05, TOPY, TV - 0.2, -0.3, 5, rng, reds);
  yield 'cradle: kitchen';
  // four chairs that do not match
  deck.put('chair', { p: run.pt(TX - 0.42, F, TV - 0.74), yaw: Math.PI + 0.12, color: '#b9a078' });
  deck.put('chair', { p: run.pt(TX + 0.3, F, TV + 0.76), yaw: -0.08, scale: [1, 1.09, 1], color: '#5a1a20' });
  deck.put('stool', { p: run.pt(TX - 1.14, F, TV + 0.1), yaw: 0.4, color: '#8a7a70' });
  deck.put('armchair', { p: run.pt(TX + 1.16, F, TV - 0.02), yaw: Math.PI / 2, scale: 0.78, color: '#a8807a' });
  // the lamp over it
  g.box(TX - 0.006, 2.1, TV - 0.006, TX + 0.006, FLAT.H, TV + 0.006, '#2e2a2a', { skip: 'tb' });
  g.cyl(TX, 1.92, TV, 0.25, 0.05, 0.2, 12, '#e6dcc8', { smooth: false });
  g.cyl(TX, 1.914, TV, 0.21, 0.21, 0.01, 12, '#fff0d0', { emit: 5, base: true, cap: false, smooth: false });
  deck.glow([{ p: run.pt(TX, 1.9, TV), color: '#ffdcb0', power: 1.8, size: 0.5 }]);
  deck.lattice({ origin: run.pt(TX, 1.9, TV), spacing: [1, 1], count: [1, 1], color: '#ffd9a8', power: 1.5, reach: 2.4, drop: 6, above: 1.3 });
  yield 'cradle: kitchen';
  // along the back wall: a counter with a sink, a hob and its kettle
  const c0 = K.u0, c1 = -6.3, cv0 = K.v1 - 0.58;
  g.box(c0, F, cv0 + 0.03, c1, 0.86, K.v1, '#b9a98c', { skip: 'bs' }).box(c0, 0.86, cv0, c1 + 0.02, 0.9, K.v1, '#d9cfbb');
  for (let i = 0; i < 5; i++) { const a = lerp(c0 + 0.04, c1 - 0.04, i / 5), b = lerp(c0 + 0.04, c1 - 0.04, (i + 1) / 5); g.box(a + 0.03, 0.12, cv0 + 0.012, b - 0.03, 0.8, cv0 + 0.03, i === 3 ? '#c4b598' : '#ad9c80', { skip: 's' }); g.box((a + b) / 2 - 0.012, 0.62, cv0 - 0.008, (a + b) / 2 + 0.012, 0.65, cv0 + 0.012, '#b08d4a'); }
  g.box(-9.12, 0.84, cv0 + 0.1, -8.56, 0.902, K.v1 - 0.08, '#77726c', { top: '#5f5a56' });
  g.tube([[-8.84, 0.9, K.v1 - 0.05], [-8.84, 1.12, K.v1 - 0.05], [-8.84, 1.13, K.v1 - 0.22], [-8.84, 1.08, K.v1 - 0.24]], 0.014, 5, '#9a9a9c');
  const hu = -6.72, hv = K.v1 - 0.3;
  g.box(hu - 0.3, 0.9, hv - 0.2, hu + 0.3, 0.912, hv + 0.2, '#2e2c2c').cyl(hu - 0.12, 0.912, hv, 0.1, 0.1, 0.004, 12, '#b0452a', { emit: 0.9, smooth: false });
  g.lathe(hu - 0.12, 0.916, hv, [[0.09, 0], [0.108, 0.03], [0.1, 0.12], [0.05, 0.16], [0.02, 0.17]], 10, '#9c9ea2');
  g.tube([[hu - 0.03, 0.99, hv], [hu + 0.07, 1.04, hv], [hu + 0.1, 1.09, hv]], 0.012, 5, '#9c9ea2');
  for (let i = 0; i < 5; i++) deck.glow([{ p: run.pt(hu + 0.1, 1.1, hv), color: '#fff0e4', power: 0.045, size: rng.f(0.14, 0.3), move: [rng.f(-0.01, 0.02), rng.f(0.1, 0.16), rng.f(-0.01, 0.01)], loop: rng.f(3, 5), phase: i / 5 }]);
  for (let i = 0; i < 4; i++) g.cyl(-7.9 + (i % 2) * 0.01, 0.9 + i * 0.03, cv0 + 0.26, 0.07, 0.1, 0.035, 10, i % 2 ? '#d6ccb8' : '#c4b8a4', { top: '#a89c88' });
  // the herb shelf: basil, chives, shiso and coriander in a trough, under the one lamp in the flat that is not warm
  const s0 = -8.4, s1 = -7.4, sy = 1.4, sv = K.v1;
  g.box(s0, sy - 0.025, sv - 0.2, s1, sy, sv, MIDWOOD);
  for (const u of [s0 + 0.08, s1 - 0.08]) g.tri([u, sy - 0.025, sv - 0.18], [u, sy - 0.2, sv - 0.005], [u, sy - 0.025, sv - 0.005], MIDWOOD).tri([u, sy - 0.025, sv - 0.005], [u, sy - 0.2, sv - 0.005], [u, sy - 0.025, sv - 0.18], MIDWOOD);
  g.box(s0 + 0.04, sy, sv - 0.17, s1 - 0.04, sy + 0.09, sv - 0.02, '#9a6a58', { top: '#3f352c' });
  for (let i = 0; i < 7; i++) g.blob(s0 + 0.1 + rng.f(0, 0.16), sy + 0.105 + rng.f(0, 0.11), sv - 0.1 + rng.f(-0.04, 0.04), [0.05, 0.035, 0.045], 0, mixc('#5f8f4a', '#7aa85a', rng()), { seed: i, shadeBottom: 0.75 });
  for (let i = 0; i < 12; i++) { const u = s0 + 0.33 + rng.f(0, 0.14), v = sv - 0.1 + rng.f(-0.04, 0.04); g.tube([[u, sy + 0.08, v], [u + rng.f(-0.03, 0.03), sy + rng.f(0.28, 0.4), v + rng.f(-0.03, 0.03)]], 0.004, 3, '#7aa456'); }
  for (let i = 0; i < 7; i++) g.blob(s0 + 0.56 + rng.f(0, 0.16), sy + 0.105 + rng.f(0, 0.12), sv - 0.1 + rng.f(-0.04, 0.04), [0.055, 0.03, 0.05], 0, mixc('#6a3050', '#4f6a48', rng() * 0.6), { seed: i + 9, shadeBottom: 0.75 });
  for (let i = 0; i < 9; i++) g.blob(s0 + 0.79 + rng.f(0, 0.14), sy + 0.1 + rng.f(0, 0.13), sv - 0.1 + rng.f(-0.04, 0.04), [0.03, 0.02, 0.03], 0, mixc('#86ac5c', '#a0c070', rng()), { seed: i + 20, shadeBottom: 0.8 });
  g.box(s0 + 0.03, sy + 0.53, sv - 0.16, s1 - 0.03, sy + 0.56, sv - 0.05, '#3a3636');
  g.floor(s0 + 0.05, sv - 0.15, s1 - 0.05, sv - 0.06, sy + 0.528, '#ff8ae2', { down: true, emit: 3.4 });
  for (const u of [s0 + 0.1, s1 - 0.1]) g.box(u - 0.006, sy + 0.56, sv - 0.11, u + 0.006, sy + 0.75, sv - 0.1, '#3a3636', { skip: 'b' }).box(u - 0.006, sy + 0.74, sv - 0.11, u + 0.006, sy + 0.752, sv, '#3a3636');
  for (const u of [s0 + 0.25, (s0 + s1) / 2, s1 - 0.25]) deck.glow([{ p: run.pt(u, sy + 0.51, sv - 0.105), color: '#ff62d2', power: 0.9, size: 0.3 }]);
  deck.lattice({ origin: run.pt((s0 + s1) / 2, sy + 0.5, sv - 0.105), spacing: [1, 1], count: [1, 1], color: '#ff54cc', power: 1.7, reach: 0.75, drop: 1.15, above: 0.3 });
  yield 'cradle: kitchen';
  // the larder cupboard, one door open on its jars
  const l0 = -6.15, l1 = -5.12, lv = K.v1 - 0.48, lm = (l0 + l1) / 2, lc = '#a8946e';
  g.box(l0, F, lv, l1, 2.0, K.v1, lc, { skip: 'bn' }).box(l0 - 0.02, 2.0, lv - 0.03, l1 + 0.02, 2.04, K.v1, shade(lc, 0.85));
  W_face(g, l0, lm, F, 2.0, lv, lc); g.box(l0 + 0.06, 0.12, lv - 0.014, lm - 0.03, 1.9, lv, shade(lc, 1.1), { skip: 's' });
  W_face(g, lm, l1, F, 2.0, lv + 0.36, '#3a2e26'); g.quad([lm, F, lv + 0.36], [lm, F, lv], [lm, 2.0, lv], [lm, 2.0, lv + 0.36], '#4a3a30');
  g.quad([l1 - 0.03, F, lv], [l1 - 0.03, F, lv + 0.36], [l1 - 0.03, 2.0, lv + 0.36], [l1 - 0.03, 2.0, lv], '#4a3a30');
  g.box(l1 - 0.022, 0.03, lv - 0.5, l1, 1.98, lv, lc).box(l1 - 0.034, 0.12, lv - 0.44, l1 - 0.022, 1.9, lv - 0.05, shade(lc, 1.1), { skip: 'e' });
  const JARS = ['#6a1a20', '#b07a30', '#d8ccb0', '#8a4a2a', '#7a2a30', '#c4a060', '#e0d6c0'];
  for (let k = 0; k < 5; k++) {
    const y = 0.14 + k * 0.38;
    g.box(lm, y - 0.02, lv, l1 - 0.03, y, lv + 0.36, shade(lc, 0.8), { skip: 's' });
    for (let u = lm + 0.07; u < l1 - 0.08; u += rng.f(0.1, 0.13)) { const hgt = rng.f(0.09, 0.2); if (k === 3 && u > lm + 0.25) { g.blob(u, y + 0.04, lv + 0.14, [0.07, 0.04, 0.05], 0, '#a8804c', { seed: k, shadeBottom: 0.8 }); u += 0.06; continue; } g.cyl(u, y, lv + rng.f(0.1, 0.2), 0.042, 0.042, hgt, 6, rng.pick(JARS), { smooth: false, top: '#cfc6b4', emit: 0.1 }); }
  }
  // by the other wall: pegs, with a coat, a dyer's apron and a bag; a bench with shoes under it
  const wu = K.u0;
  g.box(wu, 1.6, 1.5, wu + 0.025, 1.68, 3.1, MIDWOOD, { skip: 'w' });
  for (let i = 0; i < 6; i++) g.box(wu + 0.025, 1.63, 1.6 + i * 0.28, wu + 0.09, 1.65, 1.62 + i * 0.28, '#b08d4a');
  g.box(wu + 0.03, 0.72, 1.56, wu + 0.1, 1.64, 2.02, '#6f6862', { skip: 'w' }).box(wu + 0.03, 0.62, 2.16, wu + 0.07, 1.64, 2.56, '#b3a898', { skip: 'w' });
  for (let i = 0; i < 6; i++) g.box(wu + 0.07, rng.f(0.7, 1.3), rng.f(2.2, 2.46), wu + 0.072, rng.f(1.32, 1.5), rng.f(2.48, 2.54), mixc('#8c0a2a', '#b3a898', rng.f(0.2, 0.6)), { skip: 'w' });
  g.box(wu + 0.03, 1.16, 2.74, wu + 0.12, 1.64, 3.0, '#8a3038', { skip: 'w' });
  g.box(wu + 0.02, 0.36, 1.5, wu + 0.34, 0.4, 3.0, MIDWOOD); for (const v of [1.56, 2.94]) g.box(wu + 0.04, F, v - 0.02, wu + 0.32, 0.36, v + 0.02, MIDWOOD, { skip: 'tb' });
  for (const [v, c] of [[1.8, '#3a2a22'], [2.02, '#3a2a22'], [2.5, '#7e3f33'], [2.7, '#7e3f33']]) g.box(wu + 0.06, F, v, wu + 0.3, 0.1, v + 0.1, c, { skip: 'b' });
  // the slate by the small room's door
  g.box(K.u1 - 0.02, 1.2, 3.03, K.u1, 1.82, 3.47, MIDWOOD, { skip: 'e' });
  deck.sign(['To get', 'Bread', 'Miso', 'Red thread', '(which red)'], { at: run.pt(K.u1 - 0.024, 1.51, 3.25), n: [-1, 0], w: 0.38, h: 0.56, style: 'chalk', font: 'hand', head: true });
  deck.zone({ min: run.pt(K.u0, 0, K.v0), max: run.pt(K.u1, FLAT.H, K.v1), soft: 0.25, color: '#ffd9b4', power: 0.2, side: 0.7, under: 0.45 });
}
// a face looking toward -v (out of a cupboard, toward the room)
function W_face(g, u0, u1, y0, y1, v, col, e = 0) { g.quad([u1, y0, v], [u0, y0, v], [u0, y1, v], [u1, y1, v], col, e); }

// The small room and the room beyond it. (cu, cv) is where the cradle stands, by the window. Everybody in the flat is
// looking at it: the couple at its foot, the old man on a chair by the wall, the neighbours in the far doorway, who
// have come round through the next room with a length of red each.
function* smallRoom(deck, P, run, rng, cu, cv) {
  const g = P.g, { S, N } = FLAT, F = 0.02, WN = FLAT.win, D2 = FLAT.door2, reds = REDS.map((r) => r.c);
  const toward = (u, v) => Math.atan2(cu - u, cv - v);
  // the curtains, drawn back, and a string of the dyers' swatches across the glass: every red, to choose from
  for (const [a, b] of [[WN[0] - 0.14, WN[0] + 0.2], [WN[1] - 0.2, WN[1] + 0.14]]) for (let i = 0; i < 6; i++) {
    const u0 = lerp(a, b, i / 6), u1 = lerp(a, b, (i + 1) / 6), v0 = 0.25 + (i % 2) * 0.05, v1 = 0.25 + ((i + 1) % 2) * 0.05;
    P.c.quad([u0, 0.72, v0], [u1, 0.72, v1], [u1, 2.33, v1], [u0, 2.33, v0], i % 2 ? '#e2d5c0' : '#d3c5ae');
  }
  g.tube([[WN[0] - 0.26, 2.35, 0.275], [WN[1] + 0.26, 2.35, 0.275]], 0.014, 5, OLDWOOD);
  const sw = [...reds.slice(0, 5), reds[5], reds[1], reds[0], reds[2]];
  for (let i = 0; i < sw.length; i++) {
    const t = (i + 0.5) / sw.length, u = lerp(WN[0] + 0.28, WN[1] - 0.28, t), y = 2.04 - 0.05 * Math.sin(Math.PI * t), tilt = rng.f(-0.012, 0.012);
    P.c.quad([u - 0.05, y - 0.15, 0.2 + tilt], [u + 0.05, y - 0.15, 0.2 - tilt], [u + 0.05, y, 0.2], [u - 0.05, y, 0.2], shade(sw[i], 1.05));
  }
  g.tube([[WN[0] + 0.07, 2.06, 0.2], [(WN[0] + WN[1]) / 2, 1.99, 0.2], [WN[1] - 0.07, 2.06, 0.2]], 0.003, 3, '#3a3030');
  // a rug for the cradle to stand on, a chest with a lamp and what has been given so far
  g.floor(cu - 0.95, cv - 0.5, cu + 0.95, cv + 0.75, 0.026, '#6a3236').floor(cu - 0.85, cv - 0.4, cu + 0.85, cv + 0.65, 0.028, '#7e4444');
  const k0 = S.u0 + 0.12, k1 = k0 + 0.92, kv = S.v1 - 0.46;
  g.box(k0, F, kv, k1, 0.84, S.v1, '#74563e', { skip: 'bs', top: '#80624a' });
  for (let i = 0; i < 3; i++) { g.box(k0 + 0.04, 0.1 + i * 0.25, kv - 0.012, k1 - 0.04, 0.31 + i * 0.25, kv, '#80624a', { skip: 's' }); for (const u of [k0 + 0.25, k1 - 0.25]) g.box(u - 0.015, 0.19 + i * 0.25, kv - 0.03, u + 0.015, 0.22 + i * 0.25, kv - 0.012, '#b08d4a'); }
  const lu = k0 + 0.2, lv = kv + 0.24;
  g.cyl(lu, 0.84, lv, 0.07, 0.05, 0.03, 8, '#8a6a4a', { smooth: false }).cyl(lu, 0.87, lv, 0.012, 0.012, 0.22, 5, '#b08d4a', { cap: false });
  g.cyl(lu, 1.07, lv, 0.15, 0.085, 0.17, 10, '#f0d8b4', { emit: 1.5, smooth: false });
  deck.glow([{ p: run.pt(lu, 1.14, lv), color: '#ffc890', power: 1.1, size: 0.45 }]);
  deck.lattice({ origin: run.pt(lu, 1.2, lv), spacing: [1, 1], count: [1, 1], color: '#ffc890', power: 0.85, reach: 1.7, drop: 3, above: 1.6 });
  foldedStack(g, k0 + 0.62, 0.84, kv + 0.22, 0.1, 7, rng, reds);
  // light: what comes in at the window has been through the cloth; the next room has its own lamp
  deck.zone({ min: run.pt(S.u0, 0, S.v0), max: run.pt(S.u1, FLAT.H, 1.7), soft: 1.4, color: '#ffb4a4', power: 0.55, side: 0.75, under: 0.35 });
  deck.zone({ min: run.pt(N.u0, 0, N.v0), max: run.pt(N.u1, FLAT.H, N.v1), soft: 0.25, color: '#ffcf9c', power: 0.32, side: 0.75, under: 0.5 });
  g.cyl((N.u0 + N.u1) / 2, FLAT.H - 0.12, 2.3, 0.2, 0.2, 0.012, 10, '#fff0d0', { emit: 3.5, base: true, cap: false, smooth: false });
  deck.glow([{ p: run.pt((N.u0 + N.u1) / 2, FLAT.H - 0.14, 2.3), color: '#ffdcb0', power: 1.2, size: 0.5 }]);
  // on the wall beside the window: two pegs and a shelf, with what has been kept for whoever comes: a jacket the
  // length of a hand, darned at one elbow, a cap, a pair of shoes that have been walked in before
  {
    const wv = S.v0, jr = '#b8404e', ju = S.u0 + 0.21;
    g.box(S.u0 + 0.03, 1.5, wv, S.u0 + 0.4, 1.56, wv + 0.022, MIDWOOD, { skip: 'n' });
    for (const u of [ju, S.u0 + 0.35]) g.box(u - 0.01, 1.52, wv + 0.022, u + 0.01, 1.54, wv + 0.075, '#b08d4a');
    g.tint(0.5).box(ju - 0.12, 1.2, wv + 0.03, ju + 0.12, 1.45, wv + 0.055, jr, { skip: 'n' }).box(ju - 0.04, 1.42, wv + 0.028, ju + 0.04, 1.47, wv + 0.06, shade(jr, 0.8), { skip: 'n' });
    g.tube([[ju - 0.11, 1.42, wv + 0.045], [ju - 0.2, 1.29, wv + 0.05]], 0.032, 4, jr).tube([[ju + 0.11, 1.42, wv + 0.045], [ju + 0.2, 1.29, wv + 0.05]], 0.032, 4, jr);
    g.tint(0).box(ju + 0.155, 1.3, wv + 0.062, ju + 0.21, 1.35, wv + 0.084, '#d98c8e');
    g.at(S.u0 + 0.35, 1.47, wv + 0.085, 0, [1, -1, 1]).blob(0, 0, 0, [0.055, 0.05, 0.06], 1, '#7a0a3c', { shadeBottom: 1 }).pop();
    g.box(S.u0 + 0.02, 0.98, wv, S.u0 + 0.4, 1.0, wv + 0.17, MIDWOOD, { skip: 'n' });
    for (const u of [S.u0 + 0.06, S.u0 + 0.125]) g.box(u, 1.0, wv + 0.04, u + 0.045, 1.035, wv + 0.135, '#6a4630').box(u, 1.0, wv + 0.04, u + 0.045, 1.055, wv + 0.075, '#5c3c2a');
    for (let i = 0; i < 4; i++) g.box(S.u0 + 0.22, 1.0 + i * 0.022, wv + 0.02, S.u0 + 0.38, 1.02 + i * 0.022, wv + 0.15, i % 2 ? '#e2d8c6' : '#d6ccb8');
  }
  yield 'cradle: small room';
  // ---- the people
  const who = (u, v, o = {}) => person(g, u, F, v, o.yaw === undefined ? toward(u, v) + rng.f(-0.12, 0.12) : o.yaw, { coat: rng.pick(WEAR), skin: rng.pick(SKINS), hair: rng.pick(HAIRS), h: rng.f(1.58, 1.8), ...o });
  // the couple, close together at the cradle's foot
  who(cu + 1.38, cv + 0.13, { h: 1.64, coat: '#94797a', hair: '#2a1f1a', skin: SKINS[2] });
  who(cu + 1.4, cv + 0.73, { h: 1.8, coat: '#625c57', hair: '#3b2a20', skin: SKINS[1] });
  // the old man, sitting, with nothing to say
  const ou = S.u1 - 0.55, ov = S.v1 - 0.5, oy = toward(ou, ov);
  deck.put('chair', { p: run.pt(ou - Math.sin(oy) * 0.02, F, ov - Math.cos(oy) * 0.02), yaw: oy + Math.PI, color: '#6a4a36' });
  person(g, ou, F, ov, oy, { sit: true, h: 1.62, coat: '#6f6862', hair: '#d9d6d0', skin: SKINS[5], legs: '#4a4644' });
  yield 'cradle: small room';
  // the doorway: a child at the front, the rest behind, as many as can see in
  const dv = (D2[0] + D2[1]) / 2;
  who(S.u1 + 0.06, dv + 0.18, { h: 1.12, coat: '#a08880', hair: '#3b2a20' });
  who(S.u1 + 0.1, dv - 0.25, { h: 1.6, carry: reds[0] });
  let np = 0;
  for (const [du, dvv, carry] of [[0.36, 0.3, 1], [0.48, -0.12, 0], [0.7, 0.42, 1], [0.8, -0.42, 1], [0.98, 0.04, 1], [1.26, 0.5, 0], [1.34, -0.6, 1], [1.62, 0.1, 1]]) {
    who(S.u1 + du, dv + dvv, { carry: carry ? rng.pick(reds) : 0, carry2: carry && rng() < 0.3 ? rng.pick(reds) : 0 });
    if (++np % 3 === 0) yield 'cradle: small room';
  }
  yield 'cradle: small room';
  // more coming in by the next room's own door
  for (const [u, v, carry] of [[-0.55, 1.15, 1], [0.12, 1.4, 1], [0.3, 0.75, 0], [-0.2, 0.42, 1]]) who(u, v, { yaw: Math.atan2(S.u1 - u, dv - v) + rng.f(-0.2, 0.2), carry: carry ? rng.pick(reds) : 0 });
}

// ---------------------------------------------------------------- the cradle
// Three hundred years old: dark wood gone pale where hands go, on two rockers. Its mends are meant to be seen
// (open-drums.md, Visible mending): a board let into one side, one rocker's end spliced on under two iron straps, a
// split in the headboard held by two butterfly keys, one finial that does not match the other three. Along one rail
// is a brass tack for each child who has slept in it, and room for more. It was lined this week, in rose. It is a
// mesh of its own so that it can rock: (x, z) is the middle of the opening in its lining, top the lining's height.
const ROCK_R = 0.85;
function buildCradle(deck, x, z, top) {
  const g = new Geo(), FY = T3 + 0.02, hM = top - FY, OLD = '#4a3224', WORN = '#74553c', PALE = '#b89a70', LINE = '#d47a76', LINE2 = '#c96a68';
  const HX = 0.49, B0 = 0.27, B1 = 0.31, Y0 = 0.2, Y1 = 0.56, sideZ = (y) => B0 + (y - Y0) / (Y1 - Y0) * (B1 - B0);
  g.at(x - 0.06, FY, z);
  // the rockers: arcs of a circle 0.85 m in radius, so it rolls on the floor as it rocks
  const yb = (q) => ROCK_R - Math.sqrt(ROCK_R * ROCK_R - q * q), NS = 12;
  for (const rx of [-0.34, 0.34]) {
    for (let i = 0; i < NS; i++) {
      const za = lerp(-0.45, 0.45, i / NS), zb = lerp(-0.45, 0.45, (i + 1) / NS), ya = yb(za), yc = yb(zb), ta = ya + 0.058, tb = yc + 0.058;
      const col = rx < 0 && za > 0.17 ? PALE : OLD, x0 = rx - 0.023, x1 = rx + 0.023;
      g.quad([x0, ya, za], [x1, ya, za], [x1, yc, zb], [x0, yc, zb], shade(col, 0.8)).quad([x0, tb, zb], [x1, tb, zb], [x1, ta, za], [x0, ta, za], col);
      g.quad([x0, yc, zb], [x0, tb, zb], [x0, ta, za], [x0, ya, za], col).quad([x1, ya, za], [x1, ta, za], [x1, tb, zb], [x1, yc, zb], col);
      if (i === 0) g.quad([x1, ya, za], [x0, ya, za], [x0, ta, za], [x1, ta, za], col); if (i === NS - 1) g.quad([x0, yc, zb], [x1, yc, zb], [x1, tb, zb], [x0, tb, zb], col);
    }
    for (const sz of [-0.17, 0.17]) g.box(rx - 0.023, yb(sz) + 0.05, sz - 0.03, rx + 0.023, Y0, sz + 0.03, OLD, { skip: 'tb' });
  }
  for (const q of [0.19, 0.26]) g.box(-0.34 - 0.027, yb(q) - 0.004, q - 0.012, -0.34 + 0.027, yb(q) + 0.064, q + 0.012, '#34302e');       // the straps on the splice
  g.tube([[-0.34, 0.1, 0], [0.34, 0.1, 0]], 0.017, 6, OLD);
  // the body: a floor, two flared sides, a headboard and a footboard
  g.box(-HX + 0.01, Y0 - 0.02, -B0, HX - 0.01, Y0 + 0.01, B0, OLD);
  for (const s of [-1, 1]) {
    const a = [-HX, Y0, s * B0], b = [HX, Y0, s * B0], c = [HX, Y1, s * B1], d = [-HX, Y1, s * B1];
    if (s > 0) g.quad(a, b, c, d, OLD); else g.quad(b, a, d, c, OLD);
    const ai = [-HX, Y0, s * (B0 - 0.022)], bi = [HX, Y0, s * (B0 - 0.022)], ci = [HX, Y1, s * (B1 - 0.022)], di = [-HX, Y1, s * (B1 - 0.022)];
    if (s > 0) g.quad(bi, ai, di, ci, OLD); else g.quad(ai, bi, ci, di, OLD);
    // its top edge, worn pale by three hundred years of hands
    g.box(-HX, Y1, Math.min(s * (B1 - 0.03), s * (B1 + 0.006)), HX, Y1 + 0.016, Math.max(s * (B1 - 0.03), s * (B1 + 0.006)), WORN, { skip: 'b' });
  }
  const end = (ex, dir, peak, col) => {
    // the outline, from the foot of one side up over the top to the foot of the other
    const pts = [[Y0, -B0], [Y1, -B1]];
    for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8; pts.push([Y1 + (peak - Y1) * Math.sin(a) ** 0.8, -B1 * Math.cos(a)]); }
    pts.push([Y0, B0]);
    for (const [xx, d2] of [[ex, dir], [ex - dir * 0.024, -dir]]) for (let i = 1; i < pts.length - 1; i++) {
      const p0 = [xx, pts[0][0], pts[0][1]], p1 = [xx, pts[i][0], pts[i][1]], p2 = [xx, pts[i + 1][0], pts[i + 1][1]];
      if (d2 > 0) g.tri(p0, p1, p2, col); else g.tri(p0, p2, p1, col);
    }
    for (let i = 1; i < pts.length - 2; i++) { const p1 = pts[i], p2 = pts[i + 1], xa = Math.min(ex, ex - dir * 0.024), xb = Math.max(ex, ex - dir * 0.024); g.quad([xa, p1[0], p1[1]], [xa, p2[0], p2[1]], [xb, p2[0], p2[1]], [xb, p1[0], p1[1]], WORN); }
  };
  end(-HX, -1, 0.75, OLD); end(HX, 1, 0.63, OLD);
  // four posts with turned finials; one finial was lost and made again, plainer
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const px = sx * (HX + 0.004), pz = sz * (B1 - 0.012), odd = sx > 0 && sz > 0;
    g.box(px - 0.024, 0.13, pz - 0.024, px + 0.024, 0.615, pz + 0.024, OLD, { skip: 'b' });
    if (odd) g.cyl(px, 0.615, pz, 0.026, 0.02, 0.05, 4, PALE, { smooth: false, phase: Math.PI / 4 });
    else g.lathe(px, 0.615, pz, [[0.02, 0], [0.03, 0.018], [0.016, 0.034], [0.029, 0.058], [0.014, 0.082], [0.001, 0.09]], 8, OLD);
  }
  // the board let into the side toward the room, and the split in the headboard with its two keys
  { const y0 = 0.3, y1 = 0.45, e = 0.0015; g.quad([0.02, y0, sideZ(y0) + e], [0.3, y0, sideZ(y0) + e], [0.3, y1, sideZ(y1) + e], [0.02, y1, sideZ(y1) + e], PALE); }
  const fx = -HX - 0.0012;
  g.quad([fx, 0.27, -0.065], [fx, 0.27, -0.057], [fx, 0.57, -0.03], [fx, 0.57, -0.038], '#1e1410');
  for (const ky of [0.35, 0.48]) { const kz = -0.061 + (ky - 0.27) * 0.09, e = fx - 0.001; g.tri([e, ky, kz], [e, ky - 0.026, kz + 0.045], [e, ky + 0.026, kz + 0.045], PALE).tri([e, ky, kz], [e, ky + 0.026, kz - 0.045], [e, ky - 0.026, kz - 0.045], PALE); }
  // a brass tack for each child: twenty-six of them, and room on the rail for more
  for (let i = 0; i < 26; i++) g.cyl(-0.43 + i * 0.027, Y1 + 0.016, B1 - 0.012, 0.0055, 0.003, 0.004, 5, '#d4ae58', { smooth: false, emit: 0.25 });
  // the lining, new: padded in channels up the sides, rolled over the rim, a quilted bed, a small pillow, a cover
  // folded at the foot
  const NC = 9;
  for (const s of [-1, 1]) for (let i = 0; i < NC; i++) {
    const xa = lerp(-HX + 0.03, HX - 0.03, i / NC), xb = lerp(-HX + 0.03, HX - 0.03, (i + 1) / NC), xm = (xa + xb) / 2, ya = 0.24, yc = Y1 - 0.004;
    const za = s * (sideZ(ya) - 0.028), zc = s * (sideZ(yc) - 0.028), bz = -s * 0.013, col = i % 2 ? LINE : LINE2;
    const q = (p0, p1, p2, p3) => (s > 0 ? g.quad(p1, p0, p3, p2, col) : g.quad(p0, p1, p2, p3, col));
    q([xa, ya, za], [xm, ya, za + bz], [xm, yc, zc + bz], [xa, yc, zc]); q([xm, ya, za + bz], [xb, ya, za], [xb, yc, zc], [xm, yc, zc + bz]);
  }
  for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) {
    const za = lerp(-B0 + 0.03, B0 - 0.03, i / 5), zb = lerp(-B0 + 0.03, B0 - 0.03, (i + 1) / 5), zm = (za + zb) / 2, k1 = (B1 - 0.03) / (B0 - 0.03), ex = sx * (HX - 0.03), bx = -sx * 0.012, col = i % 2 ? LINE2 : LINE;
    const q = (p0, p1, p2, p3) => (sx > 0 ? g.quad(p0, p1, p2, p3, col) : g.quad(p1, p0, p3, p2, col));
    q([ex, 0.24, za], [ex + bx, 0.24, zm], [ex + bx, Y1 - 0.004, zm * k1], [ex, Y1 - 0.004, za * k1]); q([ex + bx, 0.24, zm], [ex, 0.24, zb], [ex, Y1 - 0.004, zb * k1], [ex + bx, Y1 - 0.004, zm * k1]);
  }
  for (const s of [-1, 1]) g.tube([[-HX + 0.02, Y1 + 0.004, s * (B1 - 0.024)], [HX - 0.02, Y1 + 0.004, s * (B1 - 0.024)]], 0.015, 6, LINE);
  const mx = HX - 0.035, mz = B0 - 0.036, NQX = 8, NQZ = 4;
  for (let i = 0; i < NQX; i++) for (let j = 0; j < NQZ; j++) {
    const xa = lerp(-mx, mx, i / NQX), xb = lerp(-mx, mx, (i + 1) / NQX), za = lerp(-mz, mz, j / NQZ), zb = lerp(-mz, mz, (j + 1) / NQZ), ap = [(xa + xb) / 2, hM + 0.0, (za + zb) / 2], y = hM - 0.009;
    g.tri([xa, y, za], ap, [xb, y, za], LINE).tri([xb, y, za], ap, [xb, y, zb], LINE).tri([xb, y, zb], ap, [xa, y, zb], LINE).tri([xa, y, zb], ap, [xa, y, za], LINE);
  }
  {
    // the pillow: a small cushion, smooth, of undyed linen
    const N = 6, px = -0.335, pw = 0.105, pl = 0.165, lin = '#e6dccb', cl = (q) => Math.max(0, Math.min(N, q));
    const Pp = (i, j) => { const a = (cl(i) / N) * 2 - 1, b = (cl(j) / N) * 2 - 1; return new Vector3(px + a * pw, hM - 0.008 + 0.05 * Math.sqrt((1 - a ** 4) * (1 - b ** 4)), b * pl); };
    const Nm = (i, j) => { const n = Pp(i, j + 1).sub(Pp(i, j - 1)).cross(Pp(i + 1, j).sub(Pp(i - 1, j))); if (n.lengthSq() < 1e-12) return new Vector3(0, 1, 0); n.normalize(); return n.y < 0 ? n.negate() : n; };
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const a = Pp(i, j), b = Pp(i + 1, j), c = Pp(i + 1, j + 1), d = Pp(i, j + 1);
      g.tri(a, d, c, lin, 0, Nm(i, j), Nm(i, j + 1), Nm(i + 1, j + 1)).tri(a, c, b, lin, 0, Nm(i, j), Nm(i + 1, j + 1), Nm(i + 1, j));
    }
  }
  for (let i = 0; i < 3; i++) g.box(0.325 + i * 0.006, hM - 0.004 + i * 0.016, -0.17 + i * 0.008, 0.445 - i * 0.004, hM + 0.012 + i * 0.016, 0.17 - i * 0.008, i % 2 ? '#8a1830' : '#7a1028');
  g.pop();
  const mesh = g.mesh(deck.lit, deck.frame);
  mesh.matrixAutoUpdate = false;
  // rocking: it turns about the middle of the rockers' circle, which moves along as the rocker rolls. Someone set it
  // going as the flight came in at the door, and it runs down (about 1.3 s a rock, at 0.8 g)
  const B = deck.frame.stand(x - 0.06, z, { h: FY + ROCK_R }), Bi = B.clone().invert(), R = new Matrix4(), T = new Matrix4();
  const rock = (t) => {
    const a = t < 47.5 ? 0 : 0.085 * Math.exp(-(t - 47.5) / 4.5) * Math.sin((t - 47.5) * 4.9);
    mesh.matrix.copy(B).multiply(T.makeTranslation(0, 0, ROCK_R * a)).multiply(R.makeRotationX(a)).multiply(Bi);
    mesh.matrixWorldNeedsUpdate = true;
  };
  rock(0);
  return { mesh, rock };
}

// ---------------------------------------------------------------- the terrace, and the block's own reds
// Half the corridor has come round: neighbours along the third terrace with a folded length each, waiting their turn
// at the next room's door, or standing at the rail where they can see in at the window. And the block has hung its
// own washing lines with red: short lengths over every head along the walk, and banners over the rails of all five
// terraces. These go into the same mesh as the lengths in the court (sheets).
function* terrace(deck, P, run, rng, sheets, dens) {
  const g = P.g, reds = REDS.map((r) => r.c), F = 0;
  const who = (u, v, yaw, o = {}) => person(g, u, F, v, yaw, { coat: rng.pick(WEAR), skin: rng.pick(SKINS), hair: rng.pick(HAIRS), h: rng.f(1.56, 1.82), carry: rng.pick(reds), ...o });
  const bu = (FLAT.doorB[0] + FLAT.doorB[1]) / 2;
  // waiting along the wall for the next room's door, in ones and twos
  for (let i = 0; i < 13; i++) {
    if (i % 3 === 2) yield 'cradle: terrace';
    const u = 1.0 + i * 0.66 + rng.f(-0.12, 0.12), v = -0.7 - (i % 3) * 0.44 + rng.f(-0.08, 0.08);
    who(u, v, i % 4 === 2 ? Math.atan2(1, rng.f(-0.4, 0.4)) : Math.atan2(bu - u, -0.2 - v) + rng.f(-0.25, 0.25), { carry2: rng() < 0.25 ? rng.pick(reds) : 0 });
  }
  who(bu + 0.05, -0.55, 0.1); who(bu + 0.6, -0.4, -0.5, { h: 1.15, carry: 0 });
  yield 'cradle: terrace';
  // at the rail, their backs to the court, where the window can be seen into
  for (const [u, o] of [[-3.7, {}], [-3.1, { h: 1.18, carry: 0 }], [-2.4, {}], [-1.9, { carry: 0 }], [-0.6, {}], [1.3, {}], [2.2, {}], [4.6, { carry: 0 }], [5.3, {}]]) { who(u + rng.f(-0.1, 0.1), -5.02 + rng.f(-0.06, 0.06), Math.atan2(-3.3 - u, 5.6) * 0.5 + rng.f(-0.15, 0.15), o); if (u > 0 || u < -3) yield 'cradle: terrace'; }
  yield 'cradle: terrace';
  // and by the flat's own door, not going in
  who(-11.7, -0.8, 1.2); who(-12.35, -1.4, 1.0, { carry: 0 }); who(-11.95, -1.95, 0.8, { h: 1.2, carry: 0 });
  // the clinic's notice, on the wall by the door
  g.box(-7.62, 1.22, -0.03, -6.66, 2.0, 0, '#6a5a52', { skip: 's' });
  deck.sign(['Dye House Clinic', 'Couples with a place:', 'walk in.', 'No number needed.'], { at: run.pt(-7.14, 1.61, -0.034), n: [0, -1], w: 0.9, h: 0.72, style: 'paper', font2: 'serif', head: true });
  yield 'cradle: terrace';
  // washing lines: across the walk from the wall to the posts, and from post to post, with short lengths over them
  const short = (x, z, top, w, len, face, fine) => { const c = rgb(rng.pick(reds)), k = rng.f(0.85, 1.1); sheets.push({ x, z, top, len, w, face, col: [c[0] * k, c[1] * k, c[2] * k], phase: rng.f(0, TAU), swing: rng.f(0.004, 0.02), seed: rng(), kind: 0, wet: 0, nu: fine ? 5 : 2, ns: fine ? 6 : 3 }); };
  const LY = 2.8;
  for (const u of [-17.4, -14.6, -12.6, -5.3, -1.75, 1.2, 3.4, 5.5, 8.2, 10.6, 13.4, 16.2]) {
    g.box(u - 0.004, LY, -3.86, u + 0.004, LY + 0.008, -0.02, '#3a3030');
    for (let v = -3.5, i = 0; v < -0.5; v += 0.92, i++) if (rng() < 0.85) short(u, WALL + v, T3 + LY, rng.f(0.62, 0.84), rng.f(0.42, 0.72), [1, 0], Math.abs(u + 3.3) < 3);
  }
  for (const [a, b] of [[-5.72, -0.2], [0.2, 5.72], [6.12, 11.64], [-17.56, -12.04]]) {
    g.box(a, LY - 0.03, -3.904, b, LY - 0.022, -3.896, '#3a3030');
    for (let u = a + 0.6; u < b - 0.4; u += rng.f(0.9, 1.15)) if (rng() < 0.9) short(u, WALL - 3.9, T3 + LY - 0.03, rng.f(0.62, 0.86), rng.f(0.42, 0.7), [0, 1], a < -3 && b > -3);
  }
  // banners over the rails, on every terrace and all four sides
  let total = 0; for (const r of REDS) total += r.w;
  const pickRed = () => { let w = rng() * total; for (const r of REDS) { w -= r.w; if (w <= 0) return r.c; } return REDS[0].c; };
  for (let k = 1; k <= 5; k++) for (const side of ['back', 'front', 'spin', 'anti']) {
    if (side === 'back') yield 'cradle: banners';
    const out = 2 * k, along = side === 'back' || side === 'front', lo = (along ? CX0 : CZ0) - out + 1.2, hi = (along ? CX1 : CZ1) + out - 1.2, top = 4 * k + 0.84;
    const near = side === 'back' && (k === 3 || k === 4);
    for (let a = lo + rng.f(0, 1.5); a < hi - 1.5; a += 1.62) {
      if (rng() > (near ? 0.5 : 0.3) * Math.min(1, dens + 0.2)) continue;
      const x = along ? a + 0.75 : (side === 'spin' ? CX1 + out - 0.06 : CX0 - out + 0.06), z = along ? (side === 'back' ? CZ1 + out - 0.06 : CZ0 - out + 0.06) : a + 0.75;
      const len = rng.f(1.3, 3.0);
      if (!deck.clear(x, top - 0.6, z, 1.7) || !deck.clear(x, top - len, z, 1.7)) continue;
      const c = rgb(pickRed()), kk = rng.f(0.85, 1.1);
      const fine = deck.dist(x, top - 1, z) < 9;
      sheets.push({ x, z, top, len, w: 1.5, face: along ? [0, 1] : [1, 0], col: [c[0] * kk, c[1] * kk, c[2] * kk], phase: rng.f(0, TAU), swing: rng.f(0.003, 0.012), seed: rng(), kind: 0, wet: 0, nu: fine ? 8 : 2, ns: fine ? 8 : 4 });
    }
  }
}
//@@WORLD@@

// ---------------------------------------------------------------- the world
export const madderCradle = {
  id: 'madder-cradle',
  title: 'Every red they have', drum: 'Madder', row: 'Pigment Row', kind: 'a counted drum, newly open', light: 33.1,
  line: 'The Dye House has more orders for cradle cloth than in fourteen years and nobody can agree on the red, so they have hung up all of them, six storeys of it. The cradle I saw is three hundred years old and still empty. Half the corridor had come round to look at it.',
  tone: '#e07a6e', source: 'wander-year.md (Day 222); three-nights 15-canon.js (Madder); ashgrove.md (The flat); people.md (Counted drums)',
  sound: { root: 45, scale: 'dorian', pad: 0.5, air: 0.15, hum: 0.2, water: 0.3, crowd: 0.3, choir: 0.2, bells: 0.1, bright: 0.4 },
  *build(ctx) {
    const frame = makeFrame(212 * DEG, 1650, R_FLOOR);
    const rng = makeRng('madder-cradle'), dens = ctx.density || 1;
    const path = makePath([
      { t: 0, p: [-11.5, 1.7, 0] },
      { t: 5, p: [-4.2, 1.8, 0], look: [5, 3.0, 0.8] },
      { t: 8.5, p: [2.4, 2.0, -0.6], look: [HOIST_X, 2.7, ROW1] },
      { t: 11.5, p: [4.2, 3.9, -0.8], look: [HOIST_X + 0.1, 7.6, ROW1 + 0.9] },  // up along the wet length as it goes
      { t: 15, p: [4.8, 7.0, -0.4], look: [-2.2, 7.6, -0.1] },               // round to look back down the lane
      { t: 17.5, p: [5.1, 9.3, -0.3], look: [-1.4, 12.2, -0.1] },
      { t: 21, p: [5.7, 12.0, -0.5], look: [4.6, 13.4, 6.9] },                 // and back: the same length, a lamp behind it
      { t: 23, p: [7.0, 13.1, 1.6], look: [XC, 13.9, 14] },
      { t: 25, p: [XC, 13.5, 5.6], look: [XC, 13.6, 24] },
      { t: 27.5, p: [XC, 13.7, 11.6], look: [XC - 3, 13.4, 26] },
      { t: 30.5, p: [5.6, 13.8, 16.6], look: [-2, 13.3, 24] },
      { t: 34, p: [0.4, 13.75, 17.4], look: [-6, 13.3, 25] },
      { t: 37.5, p: [-5.0, 13.8, 17.7], look: [-8.4, 13.4, 26] },
      { t: 40.5, p: [-8.0, 13.95, 20.7], look: [-8.4, 13.4, 27.5] },
      { t: 43, p: [-8.4, 13.6, 24.5], look: [-8.3, 13.3, 29] },
      { t: 45, p: [-8.4, 13.5, 26.4], look: [-7.9, 13.2, 30.5] },
      { t: 48, p: [-8.05, 13.47, 27.7], look: [-7.0, 12.85, 29.7] },
      { t: 51, p: [-6.6, 13.45, 28.05], look: [-1.7, 13.3, 28.15] },
      { t: 53.5, p: [-4.93, 13.45, 28.03], look: [-2.58, 12.95, 27.18], up: [0, 1, 0] },      // everyone, from three metres
      // round to the left, so that nobody is much nearer than that while they are in the picture: the small clothes
      // on their pegs, the window, the cradle under it
      { t: 55.7, p: [-4.45, 13.48, 28.2], look: [-4.0, 12.95, 26.3], up: [0, 1, 0], fov: 54 },
      { t: 58.3, p: [-4.0, 13.42, 27.75], look: [-3.75, 12.5, 26.6], up: [0, 1, 0], fov: 54 },
      // over it, and straight down: the last two legs are plumb, so the opening lies level in the lining
      { t: 60.5, p: [-3.3, 13.15, 26.76], look: [-3.3, 12.2, 26.74], up: [0, 0.5, -0.87], fov: 50 },
      { t: 62.3, p: [-3.3, 12.75, 26.76], look: [-3.3, 11.8, 26.76], up: [0, 0, -1], fov: 50 },
      { t: 64.5, p: [-3.3, 12.12, 26.76], look: [-3.3, 11.2, 26.76], up: [0, 0, -1], fov: 50 },
    ], { frame, entryRadius: 1.4, exitRadius: 0.22 });
    const pts = path.points(0.5);
    const deck = makeDeck(ctx, {
      frame, near: pts, seed: 'madder-cradle', palette: MADDER, detail: 40,
      light: { level: 0.85, ambUp: '#5e4c46', ambDown: '#43342f', ambPower: 0.7, haze: '#3a1616', hazeDensity: 0.004 },
      floor: { shine: 1, slab: [0.8, 0.8], wear: 0.9 },
    });
    yield 'cradle: path';

    const court = yield* atrium(deck, {
      x0: CX0, x1: CX1, z0: CZ0, z1: CZ1, y: 0, storeys: 6, step: 2, depth: 6,
      sides: { back: { fronts: { 3: [{ from: FLAT.u0, to: FLAT.u1, kind: 'custom', piers: false }] } } },
      light: { power: 0.6, terraces: 0.42, walks: 0.17, gloss: 0.16, color: '#ffd9cc', terraceColor: '#f2d6d0' },
      ceiling: { panel: 4, emit: 1.35, color: '#ffe4d2' },
      floor: { shine: 0.8, color: '#8f8a88' },
      folk: { rail: 2.5, stroll: 1.5, floor: 0 },
      planting: 0.3,
      fill: { mix: { flat: 1 }, bay: [5.2, 6.6], lit: 0.55, numbers: 101 },
      ground: { mix: { shop: 1.4, wall: 0.8, home: 0.6 }, lit: 0.7, blades: 0, awnings: 0.5, trades: [['Linings', 'cloth'], ['Thread', 'cloth'], ['Cradle cloth', 'cloth'], ['Tea', 'tea'], ['Tailor', 'cloth'], ['Buttons', 'jars'], ['Dumplings', 'pots']] },
    });
    yield 'cradle: court';

    // the lengths
    const low = pts.filter((q) => q.y < 16);
    const near = (x, z) => { let b = 1e9; for (const q of low) { const d = Math.hypot(q.x - x, q.z - z); if (d < b) b = d; } return b; };
    const sheets = yield* hangField(rng, near, dens);
    yield 'cradle: lengths';

    // the flat on the third terrace, the people who have come to it, and the cradle
    const frun = court.sideRun('back', 3, WALL - CZ1), ex = path.exit.flat;
    const FP = deck.pen(frun, -4, 'flat');
    flatShell(deck, FP, frun, rng);
    yield 'cradle: flat';
    yield* kitchen(deck, FP, frun, rng);
    yield 'cradle: kitchen';
    yield* smallRoom(deck, FP, frun, rng, ex.x - 0.06, ex.z - WALL);
    yield 'cradle: small room';
    yield* terrace(deck, FP, frun, rng, sheets, dens);
    FP.done();
    yield 'cradle: terrace';
    const cradle = buildCradle(deck, ex.x, ex.z, ex.y - 0.004);
    yield 'cradle: cradle';
    const ceilC = rgb('#ffe2d2');
    const uni = {
      uHoist: { value: new Vector4(RAIL_Y, TROUGH.water, 0, 0) },
      uCeil: { value: new Vector4(ceilC[0] * 1.2, ceilC[1] * 1.2, ceilC[2] * 1.2, TOP) },
      uThru: { value: new Vector4(0.9, 0.5, 6.0, 1.2) },
      uLit: { value: new Vector3(0.62, 1.0, 0.22) },
      uWood: { value: new Vector3(...rgb(WOODPALE)) },
    };
    const cloth = yield* clothMesh(deck, sheets, uni);
    yield '~cradle: cloth';

    // the works under them
    const works = yield* buildWorks(deck, rng, dens, sheets);
    yield* buildRails(deck, rng);
    yield* buildDyers(deck, rng, dens);
    const uFall = { value: new Vector4(GRAV, 3 * Math.sqrt(R_FLOOR), 0, TROUGH.water) };
    const drips = dripMesh(deck, works.drops, uFall);
    yield 'cradle: works';

    // nobody here wears anything brighter than the cloth
    deck.spots = deck.spots.filter((q) => deck.clear(q.p[0], q.p[1] + 1.2, q.p[2], 3.0));      // nobody is passed closer than three metres
    for (const kind of ['bush', 'trail', 'flower']) { const a = deck.items.get(kind); if (a) deck.items.set(kind, a.filter((q) => deck.clear(q.p[0], q.p[1], q.p[2], 4.5))); }      // and the rail's planting is kept back from the lens
    for (const s of deck.spots) if (!s.color) s.color = rng.pick(WEAR);
    for (const w of [...deck.walkers, ...deck.pacers]) w.color = rng.pick(WEAR);
    yield* finish(deck);
    const scene = new Scene();
    scene.add(deck.group);
    scene.add(cloth);
    scene.add(drips);
    scene.add(cradle.mesh);
    const look = { exposure: 1.45, bloom: 0.22, threshold: 1.0, saturation: 1.06, vignette: 0.5, contrast: 1.04 };
    const HOIST_LEN = sheets.find((s) => s.kind === 1).len;
    return {
      scene, path, deck, near: 0.05, far: 400, look,
      portal: { rim: false, mist: '#e07a6e', openFor: 5.5 },
      update(t, dt, camera) {
        // the room wants a near plane a hand's breadth off; the court does not
        const nr = lerp(0.14, 0.05, smoothstep(40.5, 44.5, t));
        if (Math.abs(nr - camera.near) > 1e-4) { camera.near = nr; camera.updateProjectionMatrix(); }
        // the hoist: 1.1 m/s, from the last bath to the rail. What goes up toward the axis is pushed spinward
        // (2 x 0.0572 x 1.1 = 0.126 m/s2 against 7.87): the length leans 0.9 degrees, 18 cm at its hem
        const top = clamp(0.95 + 1.1 * (t - 5.5), 0.95, RAIL_Y);
        uni.uHoist.value.x = top;
        uni.uHoist.value.z = 0.18 * smoothstep(5.5, 7.5, t) * (1 - smoothstep(24.5, 26.5, t));
        uFall.value.z = top - HOIST_LEN;
        cradle.rock(t);
      },
    };
  },
};
