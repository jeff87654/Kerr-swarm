// Sorrel, Herb Row: the Moth Organ, decks 225 to 229, Ring Seven, the Hour of the Moth. A great organ in heliox, whose
// biggest pipes stand nearly eighteen metres tall in an atrium cut five decks high to hold them (docs/sorrel.md,
// Middle decks). Sound runs about 1.8 times as fast in heliox, so a pipe must be nearly twice as long for the same note
// (habitat-design.md; open-drums.md, Heliox music): eighteen metres here is the old air's ten-metre pipe, the lowest
// note an organ has. Moth keeps Sorrel's lamps and votes bright every time (sorrel.md, The twelve Hours), and for a
// recital it turns them down.
// The flight goes along an ordinary street on deck 225, no higher than a room, where people have stopped to listen;
// out under the lowest terrace into the court, tilting up the pipes; up past the brass flat, the wooden towers and the
// swell shutters while the terraces of listeners rise round it; over the top of the tallest pipes under the lamps,
// looking straight down the ranks at the player; and out over the court toward the terraces, where the next world
// opens in the air.
//
// Not canon (the docs give the place, its decks, its Hour and Ring, its height and its tallest pipes):
//   - the court's size and plan, the organ against its front wall, the street that comes in from the back, the
//     direction plate at its mouth, the shops along it (Lamps, Sleeves, Dusties) and the notices
//   - the organ's design: a centre tower of nine tin pipes, two flats of old brass, two towers of square wooden pipes,
//     two swell boxes with shutters, pipe stays, wind trunks, two reservoirs with weights, blowers, the console with
//     four manuals, the page-turner
//   - one tower painted in Otter's teal and white, being the pipes that came over from the Pipe Court (sorrel.md says
//     only that the Pipe Court lost its organ to the Moth Organ)
//   - the recital itself: the lamps down, chairs on the court floor, children sitting at the front
import { Scene, Mesh, ShaderMaterial, Float32BufferAttribute, Vector3, Vector4, Quaternion, DoubleSide } from 'three';
import { makePath } from '../core/path.js';
import { makeFrame, deckRadius, DEG } from '../kit/drum.js';
import { makeDeck, finish, street, atrium, Run, PALETTES } from '../kit/deck.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG } from '../kit/mats.js';
import { Geo, mixc, shade, fitBounds } from '../kit/geo.js';
import { makeRng, smoothstep, clamp } from '../core/rng.js';

// the court on deck 225 (y = 0), five decks high: the ceiling is at y = 20
const CX0 = -18, CX1 = 18, CZ0 = -24, CZ1 = 18, STOREYS = 5;
const FZ = -15.2;            // the line the façade's pipes stand on
const CONZ = -8.5;           // the console: the player sits at x = 0 facing the organ (-z)
const ADDRESS = 'Two hundred and twenty-five, Seven, Moth';
const TAU = Math.PI * 2;
// Moth's mauve and grey, on an old warm paint
const MOTH = {
  ...PALETTES.warm,
  walls: ['#c2b5ba', '#b6abb2', '#c6bab2', '#aca2aa', '#bfb2a8', '#bab0b8'],
  dado: ['#6f6070', '#7a6e78', '#5f5866', '#837487'],
  trim: ['#4a3a40', '#5c4a4e', '#3f363a', '#5a4a3c'],
  ceiling: '#8f8490', rib: '#cbc1c6', court: '#b4aca6', floor: '#8c8784', strip: '#6b6468',
  awnings: [['#6a566e', '#d9d2cf'], ['#8c8890', '#e6e0dc'], ['#5a4766', '#d6cfd6'], ['#7a6880', '#e3d6bd'], ['#4f4a58', '#e8dcc2']],
  lamp: '#ffd6a6', window: ['#ffc98a', '#ffd6a6', '#f8ddb8', '#f0bf80'],
};
const TIN = ['#34373a', '#e9eae4'], TIN2 = ['#3e3d38', '#f4efdc'], BRASS = ['#33240f', '#e2c483'];
const WOODC = '#3a281e', GILT = '#c79d4e';

// ---------------------------------------------------------------- moving parts
// The deck kit merges what it draws into still meshes. What moves here (swell shutters, the player's arms, the page,
// the page-turner, children lifted to see, the reservoirs' boards) is drawn into one mesh of its own whose vertices
// each carry a pivot and a channel; each channel is a turn about an axis, a shift and a stretch in y, set every frame.
// One draw call for all of it, lit and bent like everything else.
const NCH = 16;
const MOVE_VERT = /* glsl */`
attribute vec4 aCol; attribute float aEmit; attribute vec4 aMov;
${BEND_PARS}
uniform vec4 uAx[${NCH}]; uniform vec4 uTr[${NCH}];
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying float vEmit; varying float vSoft;
vec3 kRot(vec3 v, vec4 A) { float c = cos(A.w), s = sin(A.w); return v * c + cross(A.xyz, v) * s + A.xyz * dot(A.xyz, v) * (1.0 - c); }
void main() {
  vec3 p = position, n = normal;
  int ch = int(aMov.w + 0.5);
  if (ch > 0) {
    vec4 A = uAx[ch], T = uTr[ch];
    vec3 d = p - aMov.xyz; d.y *= T.w;
    p = aMov.xyz + kRot(d, A) + T.xyz; n = kRot(n, A);
  }
  vF = p; vFN = normalize(n); vSoft = aCol.a; vCol = aCol.rgb; vEmit = aEmit;
  kBend(p, n);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const moveFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform float uSoft;
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying float vEmit; varying float vSoft;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN), FN = normalize(vFN);
  if (!gl_FrontFacing) { N = -N; FN = -FN; }
  float soft = vSoft * uSoft;
  N = normalize(mix(N, kUp(vW), soft)); FN = normalize(mix(FN, vec3(0.0, 1.0, 0.0), soft));
  gl_FragColor = vec4(kAir(vCol * (kLight(vW, N, vF, FN) + vEmit), vW), 1.0);
}`;

function makeMover(deck) {
  const g = new Geo({ maxSeg: 8 }), mov = [], ax = [], tr = [];
  for (let i = 0; i < NCH; i++) { ax.push(new Vector4(1, 0, 0, 0)); tr.push(new Vector4(0, 0, 0, 1)); }
  const _q = new Quaternion(), _v = new Vector3();
  const M = {
    g,
    /** draw a part: everything drawn in fn(g) turns about pivot with channel ch (0: still) */
    part(ch, pivot, fn) { const v0 = g.pos.length / 3; fn(g); const v1 = g.pos.length / 3; for (let i = v0; i < v1; i++) mov.push(pivot[0], pivot[1], pivot[2], ch); return M; },
    /** a turn about a unit axis */
    turn(ch, axis, angle) { ax[ch].set(axis[0], axis[1], axis[2], angle); },
    /** a turn given as a quaternion */
    quat(ch, q) { const a = 2 * Math.acos(clamp(q.w, -1, 1)), s = Math.sqrt(Math.max(1e-9, 1 - q.w * q.w)); if (a < 1e-5) ax[ch].set(1, 0, 0, 0); else ax[ch].set(q.x / s, q.y / s, q.z / s, a); },
    /** a shift, and a stretch in y about the pivot */
    shift(ch, x, y, z, sy = 1) { tr[ch].set(x, y, z, sy); },
    _q, _v,
    mesh() {
      const geo = g.build();
      geo.setAttribute('aMov', new Float32BufferAttribute(mov, 4));
      const mat = new ShaderMaterial({
        uniforms: { ...deck.rig.uniforms, uClip: G.uClip, uTime: G.uTime, uBend: { value: new Vector3(deck.frame.a0, deck.frame.z0, deck.frame.floorR) }, uSoft: { value: 0.5 }, uAx: { value: ax }, uTr: { value: tr } },
        vertexShader: MOVE_VERT, fragmentShader: moveFrag(deck.rig), side: DoubleSide,
      });
      const m = new Mesh(geo, mat);
      fitBounds(m, deck.frame);
      geo.boundingSphere.radius += 3;
      return m;
    },
  };
  return M;
}

// ---------------------------------------------------------------- pipes
// A round metal pipe standing at (x, y0, z): a conical foot, the mouth facing the court (+z) with a pointed upper lip,
// a body of `len` metres in all, and an open top. Its faces are painted light toward the court and dark at the sides,
// with a bright streak, so that tin and brass read as metal under lamps that light from above.
function roundPipe(g, x, y0, z, len, r, metal, o = {}) {
  const n = o.sides || (r > 0.3 ? 28 : r > 0.15 ? 16 : r > 0.08 ? 10 : 6), foot = o.foot || Math.min(len * 0.22, 2.7, Math.max(0.3, r * 6));
  const yb = y0 + foot, yt = y0 + len, toe = r * 0.2, glow = o.glow || 0;
  const back = o.back === undefined ? false : o.back;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU, am = (a0 + a1) / 2;
    const s = Math.sin(am);
    if (back && s < -0.2) continue;                                    // the back of a pipe nobody sees
    // a polished pipe shows the room in it: a dark middle (the dim court), a bright streak to one side (the lit
    // terraces), a softer one to the other, and dark again at its edges
    const d = Math.atan2(Math.sin(am - Math.PI / 2), Math.cos(am - Math.PI / 2)), gs = (c0, w) => Math.exp(-(((d - c0) / w) ** 2));
    const k = Math.min(1, 0.16 + 0.9 * gs(0.62, 0.2) + 0.45 * gs(-0.8, 0.25) + 0.16 * gs(0, 0.35) + 0.1 * gs(1.35, 0.3));
    const c = mixc(metal[0], metal[1], k), e = 0.55 * Math.max(0, k - 0.6) + glow * 0.3;
    const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    g.quad([x + c0 * r, yb, z + s0 * r], [x + c0 * r, yt, z + s0 * r], [x + c1 * r, yt, z + s1 * r], [x + c1 * r, yb, z + s1 * r], c, e);
    g.quad([x + c0 * toe, y0, z + s0 * toe], [x + c0 * r, yb, z + s0 * r], [x + c1 * r, yb, z + s1 * r], [x + c1 * toe, y0, z + s1 * toe], shade(c, 0.9), e * 0.6);
    g.tri([x, yt - 0.03, z], [x + c1 * r * 0.93, yt - 0.03, z + s1 * r * 0.93], [x + c0 * r * 0.93, yt - 0.03, z + s0 * r * 0.93], '#141012');
  }
  // the mouth, and the upper lip over it
  const w = r * 1.15, h = r * 0.5, zf = z + r + 0.008, lip = mixc(metal[0], metal[1], 0.92);
  g.quad([x - w / 2, yb, zf], [x + w / 2, yb, zf], [x + w / 2, yb + h, zf], [x - w / 2, yb + h, zf], '#16110f');
  g.quad([x - w / 2, yb + h, zf], [x + w / 2, yb + h, zf], [x + w / 2, yb + h + r * 0.45, zf], [x - w / 2, yb + h + r * 0.45, zf], lip, 0.3 + glow);
  g.tri([x - w / 2, yb + h + r * 0.45, zf], [x + w / 2, yb + h + r * 0.45, zf], [x, yb + h + r * 1.25, zf], lip, 0.3 + glow);
  return yb;
}

// A square wooden pipe: a narrower foot block, a body painted in one colour with gilt bands, a mouth on its front
// with a cap block below it, and an open top.
function woodPipe(g, x, y0, z, len, w, paint, o = {}) {
  const foot = Math.min(len * 0.12, 1.4), yb = y0 + foot, yt = y0 + len, d = w * 1.1, fw = w * 0.62;
  g.box(x - fw / 2, y0, z - d / 2 + 0.04, x + fw / 2, yb, z + d / 2 - 0.04, shade(paint, 0.7), { skip: 'b' });
  g.box(x - w / 2, yb, z - d / 2, x + w / 2, yt, z + d / 2, paint, { top: '#151012', skip: 'b' });
  for (const y of [yb + 0.1, yt - 0.35]) g.box(x - w / 2 - 0.012, y, z - d / 2 - 0.012, x + w / 2 + 0.012, y + 0.08, z + d / 2 + 0.012, GILT, { emit: 0.12 });
  const zf = z + d / 2 + 0.01, mh = w * 0.42;
  g.box(x - w / 2 + 0.03, yb - 0.02, zf - 0.02, x + w / 2 - 0.03, yb + w * 0.18, zf + w * 0.16, shade(paint, 0.82));
  g.quad([x - w / 2 + 0.06, yb + w * 0.18, zf], [x + w / 2 - 0.06, yb + w * 0.18, zf], [x + w / 2 - 0.06, yb + w * 0.18 + mh, zf], [x - w / 2 + 0.06, yb + w * 0.18 + mh, zf], '#140f0d');
  g.quad([x - w / 2 + 0.06, yb + w * 0.18 + mh, zf], [x + w / 2 - 0.06, yb + w * 0.18 + mh, zf], [x + w / 2 - 0.06, yb + w * 0.18 + mh + 0.1, zf], [x - w / 2 + 0.06, yb + w * 0.18 + mh + 0.1, zf], GILT, 0.25);
  if (o.mend) g.box(x - w / 2 - 0.01, o.mend, z - d / 2 - 0.01, x + w / 2 + 0.01, o.mend + 0.5, z + d / 2 + 0.01, shade(paint, 1.18));      // a board let in, a shade fresher
}

// a ring round a pipe where a stay holds it
function collar(g, x, y, z, r, col) { g.cyl(x, y, z, r + 0.025, r + 0.025, 0.09, 10, col, { smooth: false, cap: false }); }

// ---------------------------------------------------------------- the organ
// Against the court's front wall, from x = -17.4 to 17.4: a centre tower of nine tin pipes (the biggest), two flats of
// old brass on the impost with the swell boxes over them, two towers of square wooden pipes, and two outer flats of
// small tin in three tiers. Behind the front: the windchests and their ranks, the pedal pipes against the wall, the
// wind trunks; on the floor beside it, the reservoirs and blowers; in front, the console.
function* buildOrgan(deck, rng) {
  const P = deck.pen(new Run(0, 0, 0, 0), 0, 'organ'), g = P.g;
  let t0 = performance.now();
  const due = () => performance.now() - t0 > 4;
  const wood = (x0, y0, z0, x1, y1, z1, o) => g.box(x0, y0, z0, x1, y1, z1, WOODC, o);
  // the centre tower: nine tin pipes on a plinth, held by three brass stays
  const LENS = [14.0, 15.0, 15.9, 16.8, 17.5, 16.8, 15.9, 15.0, 14.0];
  wood(-4.95, 0, -16.3, 4.95, 0.5, -14.35, { top: '#2a1d16' });
  g.box(-4.95, 0.46, -14.4, 4.95, 0.52, -14.3, GILT, { emit: 0.15 });
  for (let i = 0; i < 9; i++) {
    const x = (i - 4) * 1.03, r = 0.46 - 0.012 * Math.abs(i - 4), len = LENS[i];
    roundPipe(g, x, 0.5, FZ, len, r, i === 6 ? TIN2 : TIN, { foot: 2.6 });              // the one fresher than the rest was recast
    for (const y of [6.5, 11, 15]) if (len + 0.5 > y + 0.4) collar(g, x, y - 0.045, FZ, r, BRASS[1]);
  }
  for (const y of [6.5, 11, 15]) g.box(-4.95, y - 0.03, FZ - 0.05, 4.95, y + 0.03, FZ + 0.05, '#a8823e', { emit: 0.1 });
  yield 'organ: centre';
  // posts between the sections, with gilt capitals
  for (const [x, top] of [[5.05, 16.2], [9.95, 17.2], [13.95, 17.4], [17.45, 17.8]]) for (const sd of [-1, 1]) {
    const cx = sd * x;
    wood(cx - 0.25, 0, -16.6, cx + 0.25, top, -14.0, { skip: 'b' });
    g.box(cx - 0.3, top, -16.65, cx + 0.3, top + 0.22, -13.95, GILT, { emit: 0.18 });
    g.box(cx - 0.3, 3.9, -16.65, cx + 0.3, 4.15, -13.95, GILT, { emit: 0.12 });
    g.cyl(cx, top + 0.22, -15.3, 0.16, 0.02, 0.5, 6, GILT, { smooth: false, emit: 0.2 });
  }
  for (const sd of [-1, 1]) {
    const s = (a, b) => [Math.min(sd * a, sd * b), Math.max(sd * a, sd * b)];
    // the impost and the panelled case under it, for the brass flat and the outer flat
    for (const [a, b] of [[5.3, 9.7], [14.2, 17.2]]) {
      const [xa, xb] = s(a, b);
      wood(xa, 0, -16.5, xb, 3.9, -14.1);
      for (let k = 0; k < 3; k++) { const u0 = xa + (xb - xa) * k / 3 + 0.12, u1 = xa + (xb - xa) * (k + 1) / 3 - 0.12; g.box(u0, 0.4, -14.1, u1, 3.5, -14.04, '#4a3428', { skip: 'b' }); g.box(u0 + 0.12, 0.55, -14.04, u1 - 0.12, 3.35, -14.0, shade(MOTH.dado[0], 0.8), { skip: 'b' }); }
      g.box(xa - 0.05, 3.9, -16.55, xb + 0.05, 4.6, -13.9, '#4a3428');
      g.box(xa - 0.05, 4.45, -13.95, xb + 0.05, 4.55, -13.85, GILT, { emit: 0.15 });
    }
    // the brass flat: eight pipes on the impost, the longest by the centre tower
    for (let i = 0; i < 8; i++) roundPipe(g, sd * (5.62 + i * 0.54), 4.6, FZ + 0.25, 7.0 - i * 0.4, 0.2, BRASS, { foot: 1.15 });
    // the swell box over it: its frame and roof; the shutters are moving parts (see shutters())
    const [xa, xb] = s(5.3, 9.7);
    wood(xa, 11.95, -18.2, xb, 12.25, -14.3);
    wood(xa, 17.35, -18.2, xb, 17.7, -14.3);
    g.box(xa - 0.02, 17.6, -14.4, xb + 0.02, 17.75, -14.2, GILT, { emit: 0.15 });
    for (const x of [xa, xb - 0.2]) wood(x, 12.25, -18.2, x + 0.2, 17.35, -14.4);
    g.quad([xb, 12.25, -18.0], [xa, 12.25, -18.0], [xa, 17.35, -18.0], [xb, 17.35, -18.0], '#f2c890', 0.85);         // lit inside, so the light shows when they open
    for (let i = 0; i < 9; i++) roundPipe(g, (xa + xb) / 2 + (i - 4) * 0.42, 12.25, -17.0, 3.6 - Math.abs(i - 4) * 0.3, 0.1, TIN, { sides: 6, glow: 0.25, foot: 0.5 });
    for (let i = 0; i < 9; i++) roundPipe(g, (xa + xb) / 2 + (i - 4) * 0.42 + 0.2, 12.25, -16.0, 2.4 - Math.abs(i - 4) * 0.2, 0.07, BRASS, { sides: 6, glow: 0.25, foot: 0.4 });
    deck.glow([{ p: [(xa + xb) / 2, 14.5, -15.6], color: '#ffc983', power: 1.6, size: 3.2 }]);
    // the wooden tower: five square pipes on a plinth. Anti side Moth's mauve and grey; spinward, the teal and white
    // of the Pipe Court's old organ
    const paints = sd < 0 ? ['#6a566e', '#8c8890'] : ['#2f6f6a', '#d6d2c6'];
    const [ta, tb] = s(10.2, 13.7);
    wood(ta, 0, -16.1, tb, 0.4, -14.3);
    for (let i = 0; i < 5; i++) woodPipe(g, sd * (10.55 + i * 0.73), 0.4, FZ, 16.4 - i * 1.1, 0.64, paints[i % 2], { mend: i === 2 && sd < 0 ? 7.3 : 0 });
    for (const y of [6, 11]) g.box(ta, y - 0.04, FZ + 0.36, tb, y + 0.04, FZ + 0.44, '#a8823e', { emit: 0.08 });
    // the outer flat: small tin in three tiers
    const [oa, ob] = s(14.2, 17.2);
    wood(oa, 9.3, -16.4, ob, 9.6, -14.2); wood(oa, 13.3, -16.4, ob, 13.6, -14.2);
    g.box(oa, 17.0, -16.4, ob, 17.6, -14.1, '#4a3428');
    g.box(oa, 17.0, -14.15, ob, 17.12, -14.05, GILT, { emit: 0.15 });
    for (let i = 0; i < 6; i++) roundPipe(g, sd * (14.5 + i * 0.48), 4.6, FZ + 0.4, 4.6 - i * 0.28, 0.16, TIN);
    for (let i = 0; i < 6; i++) roundPipe(g, sd * (14.55 + i * 0.47), 9.6, FZ + 0.4, 3.5 - i * 0.18, 0.12, TIN);
    for (let i = 0; i < 7; i++) roundPipe(g, sd * (14.45 + i * 0.42), 13.6, FZ + 0.4, 3.1 - i * 0.15, 0.09, TIN);
    // pipe shades: a gilt fret under the cornice of the outer flat
    for (let i = 0; i < 6; i++) { const x0 = oa + (ob - oa) * i / 6, x1 = oa + (ob - oa) * (i + 1) / 6; g.tri([x0, 17.0, -14.06], [x1, 17.0, -14.06], [(x0 + x1) / 2, 16.55, -14.06], GILT, 0.2); }
    yield 'organ: flats';
  }
  // inside the case: the great windchest and its ranks, the choir chest high behind the centre tower, the pedal pipes
  // on the wall, walkboards, a tuner's ladder and the work lamps
  wood(-13.6, 3.9, -22.8, 13.6, 4.5, -16.8, { top: '#4a3428' });
  const ranks = [[4.4, TIN, 0], [3.4, TIN, 0], [2.3, TIN2, 0], [3.0, BRASS, 1], [1.6, TIN, 0], [1.2, TIN, 0], [0.9, TIN2, 0], [2.0, BRASS, 1]];
  for (let j = 0; j < ranks.length; j++) {
    const [base, metal, reed] = ranks[j], z = -17.3 - j * 0.68;
    for (let i = 0; i < 34; i++) {
      const u = (i - 16.5) / 16.5, x = u * 13.2, len = base * (1 - 0.5 * Math.abs(u)) * (0.97 + 0.06 * rng()), r = Math.max(0.03, len * 0.03);
      if (reed) { g.cyl(x, 4.5, z, 0.03, r * 1.6, len, 6, mixc(metal[0], metal[1], 0.7), { smooth: false, top: '#141012' }); g.cyl(x, 4.5, z, 0.05, 0.05, 0.3, 5, metal[0], { smooth: false }); }
      else roundPipe(g, x, 4.5, z, len, r, metal, { sides: 6, back: true, foot: Math.min(0.5, len * 0.22) });
    }
    if (due()) { yield 'organ: ranks'; t0 = performance.now(); }
  }
  wood(-4.7, 10.9, -21.6, 4.7, 11.4, -17.0, { top: '#4a3428' });
  for (const sd of [-1, 1]) wood(sd * 4.4 - 0.15, 4.5, -21.4, sd * 4.4 + 0.15, 10.9, -21.1);
  for (let j = 0; j < 6; j++) {
    const z = -17.5 - j * 0.68;
    for (let i = 0; i < 18; i++) { const u = (i - 8.5) / 8.5, len = (2.6 - j * 0.3) * (1 - 0.55 * Math.abs(u)); roundPipe(g, u * 4.3, 11.4, z, len, Math.max(0.03, len * 0.032), j % 3 === 2 ? BRASS : TIN, { sides: 6, back: true, foot: Math.min(0.45, len * 0.2) }); }
  }
  yield 'organ: choir';
  for (let i = 0; i < 18; i++) { const u = (i - 8.5) / 8.5, x = u * 13.0, len = 13.8 - 5.5 * Math.abs(u); woodPipe(g, x, 0, -23.25, len, 0.58, '#9a7a54'); }
  g.box(-13.4, 9.6, -16.7, 13.4, 9.66, -16.2, '#6b5038');                 // walkboards
  for (const sd of [-1, 1]) g.box(sd * 2 - 0.5, 9.66, -22.6, sd * 2 + 0.5, 9.72, -16.7, '#6b5038');
  g.tube([[-7.6, 4.5, -19.0], [-7.2, 9.6, -17.2]], 0.03, 4, '#b39a70'); g.tube([[-6.8, 4.5, -19.0], [-6.4, 9.6, -17.2]], 0.03, 4, '#b39a70');
  for (let k = 1; k < 12; k++) { const t = k / 12; g.box(-7.6 + 0.4 * t, 4.5 + 5.1 * t - 0.02, -19 + 1.8 * t - 0.03, -6.8 + 0.4 * t, 4.5 + 5.1 * t + 0.02, -19 + 1.8 * t + 0.03, '#c2aa80'); }
  for (const [x, y, z] of [[-9, 9.2, -19.5], [6, 9.2, -20.5], [0, 15.2, -19.2], [-12, 3.4, -20], [12, 3.4, -20]]) deck.glow([{ p: [x, y, z], color: '#ffc983', power: 1.4, size: 1.2 }]);
  // wind trunks: from the reservoirs on the floor, into the case at each side, up the corners and across to the chests
  const duct = '#6e6660';
  for (const sd of [-1, 1]) {
    const x = sd * 16.4;
    g.box(x - 0.35, 0, -14.6, x + 0.35, 0.7, -12.9, duct, { skip: 'b' });
    g.box(sd * 17.6 - 0.32, 0, -21.8, sd * 17.6 + 0.32, 11.8, -21.2, duct, { skip: 'b' });
    g.box(Math.min(sd * 17.6, sd * 13.4), 11.2, -21.8, Math.max(sd * 17.6, sd * 13.4), 11.8, -21.2, duct);
    g.box(Math.min(sd * 13.4, sd * 4.7), 10.95, -21.0, Math.max(sd * 13.4, sd * 4.7), 11.35, -20.6, duct);
    g.box(sd * 17.6 - 0.25, 3.7, -21.2, sd * 17.6 + 0.25, 4.2, -16.8, duct);
  }
  yield 'organ: wind';
  P.done();
}

// The console, the reservoirs and the blowers (still), with the player, the page-turner and their moving arms
const DESK_U = [0, 0.94, -0.342], DESK_N = [0, 0.342, 0.94];
const deskPt = (x, s, lift = 0) => [x, 1.12 + DESK_U[1] * s + DESK_N[1] * lift, CONZ - 0.62 + DESK_U[2] * s + DESK_N[2] * lift];
function buildConsole(deck) {
  const P = deck.pen(new Run(0, 0, 0, 0), 0, 'console'), g = P.g, z = CONZ, wd = '#4a3022', wd2 = '#6b4630';
  g.box(-2.3, 0, z - 1.7, 2.3, 0.016, z + 1.5, '#6a2f35', { skip: 'b' });                         // the rug
  g.box(-1.3, 0, z - 1.2, 1.3, 0.72, z - 0.42, wd, { skip: 'b' });
  g.box(-1.3, 0.72, z - 1.2, 1.3, 1.12, z - 0.86, wd, { skip: 'b' });
  for (let i = 0; i < 4; i++) {
    const y = 0.74 + i * 0.105, zf = z - 0.33 - i * 0.13;
    g.box(-0.72, y - 0.05, zf - 0.17, 0.72, y, zf + 0.0, wd2);
    g.box(-0.7, y, zf - 0.17, 0.7, y + 0.022, zf, '#ece4d0', { emit: 0.12 });
    for (let k = 0; k < 28; k++) if ([1, 3, 6, 8, 10].includes(k % 12) || k % 7 === 2) { const x = -0.68 + k * 0.049; g.box(x, y + 0.022, zf - 0.17, x + 0.022, y + 0.042, zf - 0.07, '#1c1816'); }
  }
  for (const sd of [-1, 1]) {
    g.box(sd * 0.85 - 0.05, 0.6, z - 1.2, sd * 0.85 + 0.05, 1.2, z - 0.3, wd);
    // the stop jambs: terraced rows of stop knobs, some drawn
    g.box(Math.min(sd * 0.92, sd * 1.3), 0.72, z - 1.15, Math.max(sd * 0.92, sd * 1.3), 1.5, z - 0.62, wd2);
    for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) {
      const x = sd * (0.98 + c * 0.085), y = 0.82 + r * 0.11, out = (r * 3 + c * 5 + (sd > 0 ? 2 : 0)) % 4 === 0 ? 0.07 : 0.02;
      g.box(x - 0.026, y - 0.026, z - 0.62, x + 0.026, y + 0.026, z - 0.62 + out, ['#efe8d8', '#2a2522', '#efe8d8', '#b8452f'][(r + c) % 4], { emit: 0.15 });
    }
  }
  // the music desk, the left-hand page, the lamp over it
  const d0 = deskPt(-0.62, 0), d1 = deskPt(0.62, 0), d2 = deskPt(0.62, 0.5), d3 = deskPt(-0.62, 0.5);
  g.quad(d0, d1, d2, d3, wd2);
  g.box(-0.62, 1.08, z - 0.66, 0.62, 1.13, z - 0.56, wd);
  const pg = (x0, x1) => g.quad(deskPt(x0, 0.05, 0.012), deskPt(x1, 0.05, 0.012), deskPt(x1, 0.45, 0.012), deskPt(x0, 0.45, 0.012), '#f2ead6', 0.5);
  pg(-0.215, -0.005); pg(-0.43, -0.225);
  g.box(-0.02, 1.6, z - 0.83, 0.02, 1.86, z - 0.79, '#b08d4a');
  g.box(-0.34, 1.82, z - 0.86, 0.34, 1.88, z - 0.68, '#3d4a3a');
  g.box(-0.32, 1.8, z - 0.84, 0.32, 1.82, z - 0.7, '#fff2d2', { emit: 5 });
  deck.glow([{ p: [0, 1.72, z - 0.72], color: '#ffe2b0', power: 2.6, size: 0.7 }]);
  // the pedalboard and the bench
  for (let k = 0; k < 15; k++) { const x = -0.7 + k * 0.1; g.box(x - 0.03, 0.03, z - 0.42, x + 0.03, 0.08, z + 0.12, '#c7ad84'); if (k % 7 !== 2 && k % 7 !== 6) g.box(x + 0.02, 0.08, z - 0.42, x + 0.08, 0.13, z - 0.2, '#211b18'); }
  g.box(-0.85, 0.56, z + 0.04, 0.85, 0.62, z + 0.46, wd2);
  for (const sd of [-1, 1]) g.box(sd * 0.8 - 0.04, 0, z + 0.06, sd * 0.8 + 0.04, 0.56, z + 0.44, wd, { skip: 'b' });
  // the reservoirs: a base and a board, its folds and its weights moving (see buildMovers); and the blowers
  for (const sd of [-1, 1]) {
    const cx = sd * 15.3;
    g.box(cx - 1.15, 0, -12.95, cx + 1.15, 0.3, -10.75, wd, { skip: 'b' });
    g.box(sd * 16.9 - 0.5, 0, -10.2, sd * 16.9 + 0.5, 0.95, -9.0, '#5d5560', { skip: 'b' });
    g.rot('x', Math.PI / 2).cyl(sd * 16.9, -9.0, -0.48, 0.36, 0.36, 0.2, 10, '#77706a', { base: true }).pop();
    g.box(sd * 16.9 - 0.12, 0.95, -9.7, sd * 16.9 + 0.12, 1.1, -9.5, '#3a3836');
    g.box(sd * 16.0 - 0.18, 0.2, -10.75, sd * 16.0 + 0.18, 0.55, -10.2, '#6e6660');
    deck.glow([{ p: [sd * 16.4, 0.8, -9.0], color: '#9fe0b0', power: 0.9, size: 0.18 }]);
  }
  // footlights along the plinth, turned low
  for (let x = -16.5; x <= 16.6; x += 1.5) deck.glow([{ p: [x, 0.28, -13.75], color: '#ffd09a', power: 1.1, size: 0.35 }]);
  P.done();
}

function buildMovers(deck, M) {
  const z = CONZ, sleeve = '#5a4766', skin = '#d9a87c';
  // the swell shutters: nine blades to each box, turning about their middles
  for (const sd of [-1, 1]) {
    const xa = Math.min(sd * 5.3, sd * 9.7) + 0.2, xb = Math.max(sd * 5.3, sd * 9.7) - 0.2, h = 5.1 / 9;
    for (let i = 0; i < 9; i++) {
      const yc = 12.25 + (i + 0.5) * h;
      M.part(sd < 0 ? 1 : 2, [0, yc, -14.55], (g) => { g.box(xa, yc - h / 2 + 0.01, -14.59, xb, yc + h / 2 - 0.01, -14.51, i % 2 ? '#6a566e' : '#655469'); g.box(xa, yc + h / 2 - 0.05, -14.6, xb, yc + h / 2 - 0.01, -14.5, GILT, { emit: 0.12 }); });
    }
  }
  // the player's arms, from the shoulder
  const arm = (g, pts, col) => { g.tube(pts, 0.048, 6, col); const h = pts[pts.length - 1]; g.blob(h[0], h[1], h[2], [0.05, 0.035, 0.07], 0, skin); };
  M.part(3, [-0.19, 1.31, z + 0.26], (g) => arm(g, [[-0.19, 1.31, z + 0.26], [-0.28, 1.03, z + 0.03], [-0.22, 0.95, z - 0.5]], sleeve));
  M.part(4, [0.19, 1.31, z + 0.26], (g) => arm(g, [[0.19, 1.31, z + 0.26], [0.28, 1.05, z + 0.0], [0.21, 1.06, z - 0.64]], sleeve));
  // the page-turner's arm, modelled reaching the page's corner; and the page, turning about the spine
  const ts = [-0.5, 1.38, z + 0.06], corner = deskPt(0.19, 0.42, 0.03);
  M.part(5, ts, (g) => arm(g, [ts, [(ts[0] + corner[0]) / 2 - 0.05, (ts[1] + corner[1]) / 2 - 0.12, (ts[2] + corner[2]) / 2 + 0.05], corner], '#9a8f74'));
  const sp = deskPt(0, 0, 0.014);
  M.part(6, sp, (g) => { g.quad(deskPt(0.005, 0.05, 0.014), deskPt(0.215, 0.05, 0.014), deskPt(0.215, 0.45, 0.014), deskPt(0.005, 0.45, 0.014), '#f6eedb', 0.55); });
  // two children lifted up to see, and the parents' arms that lift them
  const child = (g, x, zz, col) => {
    g.box(x - 0.09, 0, zz - 0.06, x + 0.09, 0.56, zz + 0.06, '#5f6470');
    g.cyl(x, 0.52, zz, 0.15, 0.12, 0.42, 6, col, { smooth: false });
    g.blob(x, 1.06, zz, 0.105, 0, '#e8b894', { shadeBottom: 0.8 });
    for (const sd of [-1, 1]) g.tube([[x + sd * 0.13, 0.9, zz], [x + sd * 0.22, 1.18, zz - 0.06], [x + sd * 0.2, 1.38, zz - 0.1]], 0.03, 4, col);
  };
  const families = [[3.2, z + 5.6, '#d98c2b', '#3a6ea5', 7], [-3.9, z + 3.9, '#3f8a7a', '#a34b86', 9]];
  for (const [px, pz, ccol, pcol, ch] of families) {
    M.part(ch, [px + 0.42, 0, pz], (g) => child(g, px + 0.42, pz, ccol));
    for (const sd of [-1, 1]) M.part(ch + 1, [px + sd * 0.19, 1.36, pz], (g) => arm(g, [[px + sd * 0.19, 1.36, pz], [px + sd * 0.17, 1.62, pz - 0.05], [px + sd * 0.15, 1.86, pz - 0.04]], pcol));
    deck.people([{ p: [px, 0, pz], yaw: Math.PI, color: pcol }]);
  }
  // the reservoirs' folds (stretching) and boards with their weights (rising and falling)
  for (const sd of [-1, 1]) {
    const cx = sd * 15.3;
    M.part(12, [cx, 0.3, -11.85], (g) => { for (let k = 0; k < 3; k++) { const y = 0.3 + k * 0.2, i = k % 2 ? 0.02 : 0.1; g.box(cx - 1.12 + i, y, -12.92 + i, cx + 1.12 - i, y + 0.2, -10.78 - i, k % 2 ? '#6b5240' : '#5a4434', { skip: 'tb' }); } });
    M.part(11, [cx, 0.9, -11.85], (g) => { g.box(cx - 1.2, 0.9, -13.0, cx + 1.2, 1.0, -10.7, '#4a3022'); for (let k = 0; k < 6; k++) g.box(cx - 0.9 + (k % 3) * 0.65, 1.0, -12.4 + Math.floor(k / 3) * 0.75, cx - 0.55 + (k % 3) * 0.65, 1.18, -12.0 + Math.floor(k / 3) * 0.75, '#3a3836'); });
  }
  // the player and the page-turner themselves
  deck.people([{ p: [0, 0.62, z + 0.28], sit: true, yaw: Math.PI, color: sleeve }, { p: [-0.62, 0, z - 0.08], yaw: 2.3, color: '#9a8f74' }]);

  // and how it all moves: the music's swell, the hands on the keys, a page every nine seconds, the children going up
  const q1 = new Quaternion(), q2 = new Quaternion(), X = new Vector3(1, 0, 0), Y = new Vector3(0, 1, 0);
  const reachDir = new Vector3(corner[0] - ts[0], corner[1] - ts[1], corner[2] - ts[2]).normalize(), restQ = new Quaternion().setFromUnitVectors(reachDir, new Vector3(0.12, -0.98, 0.1).normalize());
  const spine = new Vector3(DESK_U[0], DESK_U[1], DESK_U[2]).normalize(), qI = new Quaternion();
  return (t) => {
    const sw = (ph) => 0.5 - 0.5 * Math.cos(t * 0.52 + ph + 0.6 * Math.sin(t * 0.17 + ph));
    M.turn(1, [1, 0, 0], 1.15 * sw(0)); M.turn(2, [1, 0, 0], 1.15 * sw(0.7));
    for (const [ch, a, b, c] of [[3, 0.22 * Math.sin(t * 1.7) + 0.08 * Math.sin(t * 4.1), 0.07 * Math.max(0, Math.sin(t * 7.3)), 0], [4, 0.2 * Math.sin(t * 1.3 + 1) + 0.1 * Math.sin(t * 3.7), 0.07 * Math.max(0, Math.sin(t * 6.1 + 2)), 0]]) {
      q1.setFromAxisAngle(Y, a + c); q2.setFromAxisAngle(X, b); q1.multiply(q2); M.quat(ch, q1);
    }
    const ph = (t + 4) % 9, reach = smoothstep(0, 1.1, ph) * (1 - smoothstep(2.7, 3.7, ph)), turn = smoothstep(1.2, 2.5, ph);
    q1.copy(qI).slerp(restQ, 1 - reach); M.quat(5, q1);
    M.turn(6, [spine.x, spine.y, spine.z], -Math.PI * turn * 0.985);
    for (const [ch, t0, dx] of [[7, 12.5, -0.42], [9, 20.5, -0.42]]) {
      const l = smoothstep(t0, t0 + 1.6, t), bob = l * 0.025 * Math.sin(t * 2.6 + ch);
      M.shift(ch, dx * l, 1.05 * l + bob, 0.02 * l); M.turn(ch + 1, [1, 0, 0], -Math.PI * 0.92 * (1 - smoothstep(t0 - 0.8, t0 + 0.8, t)));
    }
    const h = 0.08 + 0.05 * Math.sin(t * 0.9) + 0.02 * Math.sin(t * 2.3);
    M.shift(11, 0, h, 0); M.shift(12, 0, 0, 0, (0.6 + h) / 0.6);
  };
}

// The audience on the court's floor: children on the floor at the front, then rows of odd chairs with an aisle up the
// middle, people standing at the back and under the terraces
function* audience(deck, rng, density) {
  const spots = [], free = (x, z) => ![[3.2, CONZ + 5.6], [-3.9, CONZ + 3.9]].some((q) => Math.hypot(x - q[0], z - q[1]) < 0.95);
  for (let x = -5.2; x <= 5.2; x += 0.55) for (const z of [-6.5, -5.8, -5.1]) {
    if (Math.abs(x) < 2.5 && z < CONZ + 1.9) continue;
    if (rng() < 0.82 * Math.min(1, density) && deck.clear(x, 1, z, 1.6)) spots.push({ p: [x + rng.f(-0.12, 0.12), 0.0, z + rng.f(-0.12, 0.12)], sit: true, yaw: Math.PI + rng.f(-0.35, 0.35), scale: 0.72 });
  }
  let t0 = performance.now();
  for (let z = -4.4, row = 0; z < 13.2; z += 1.02, row++) {
    for (let x = -14.6 + (row % 2) * 0.3; x <= 14.6; x += 0.62) {
      if (Math.abs(x) < 1.25 || Math.abs(Math.abs(x) - 8.2) < 0.5 || !free(x, z) || !deck.clear(x, 1.2, z, 1.8)) continue;
      const cc = deck.pal.doors[Math.floor(rng() * 8)], gone = rng();
      deck.put('chair', { p: [x, 0, z], yaw: rng.f(-0.06, 0.06), color: shade(cc, rng.f(0.85, 1.15)) });
      if (gone < 0.86 * Math.min(1, density + 0.1)) spots.push({ p: [x, 0.47, z + 0.02], sit: true, yaw: Math.PI + rng.f(-0.12, 0.12) });
    }
    if (performance.now() - t0 > 4) { yield 'organ: chairs'; t0 = performance.now(); }
  }
  // standing at the back, and under the first terrace all round
  for (let i = 0; i < 70 * density; i++) {
    const x = rng.f(-16, 16), z = rng.f(13.8, 22.5);
    if (deck.clear(x, 1.5, z, 2.0)) spots.push({ p: [x, 0, z], yaw: Math.PI + rng.f(-0.4, 0.4), child: rng() < 0.12 });
  }
  for (const sd of [-1, 1]) for (let i = 0; i < 26 * density; i++) {
    const x = sd * rng.f(16.6, 22.5), z = rng.f(-9, 16);
    if (deck.clear(x, 1.5, z, 2.0)) spots.push({ p: [x, 0, z], yaw: Math.atan2(-x * 0.6, -z - 14) + rng.f(-0.3, 0.3), child: rng() < 0.1 });
  }
  deck.people(spots);
}

export const sorrelOrgan = {
  id: 'sorrel-organ',
  title: 'The Moth Organ', drum: 'Sorrel', row: 'Herb Row', kind: 'a steady drum', light: 0.0,
  line: 'You hear it three streets away, and people stop walking. The biggest pipe is nearly eighteen metres, because in our air a note needs nearly twice the pipe.',
  tone: '#d9c6cc', source: 'sorrel.md (The Moth Organ); habitat-design.md (heliox)',
  sound: { root: 36, scale: 'dorian', pad: 0.85, air: 0.1, hum: 0.5, crowd: 0.06, choir: 0.4, bells: 0, bright: 0.3 },
  *build(ctx) {
    const frame = makeFrame(285 * DEG, 2700, deckRadius(225));      // the Hour of the Moth, Ring Seven, deck 225
    const rng = makeRng('mothorgan'), dens = ctx.density || 1;
    // along the street at head height; out under the lowest terrace, tilting up; up past the brass flat, the wooden
    // tower and the swell shutters; over the top of the tallest pipes, looking down at the player; out over the court
    const path = makePath([
      { t: 0, p: [0.8, 1.6, 46] },
      { t: 5, p: [0.7, 1.62, 38.5], look: [0.2, 2.2, -10] },
      { t: 9, p: [0.5, 1.7, 32], look: [0, 3.2, -14] },
      { t: 12.5, p: [0.3, 1.95, 26.5], look: [0, 7, -15] },
      { t: 16.5, p: [0, 2.9, 15.5], look: [0, 14, -15] },
      { t: 22.5, p: [-4.8, 5.0, 3.5], look: [-6.5, 6.5, -15] },
      { t: 28, p: [-7.4, 6.9, -8.8], look: [-5.6, 7.4, -15.2] },
      { t: 33.5, p: [-6.0, 12.0, -10.8], look: [-1.5, 14.2, -15.2] },
      { t: 38.5, p: [-2.8, 17.2, -11.8], look: [0.5, 15.5, -15.4] },
      { t: 43, p: [0.6, 18.8, -14.0], look: [0.2, 0, -8.2] },
      { t: 47.5, p: [0.4, 17.4, -6.0], look: [0, 9, 14] },
      { t: 52.5, p: [0.1, 15.6, 7.0] },
      { t: 56, p: [0, 15.1, 13.0] },
    ], { frame, entryRadius: 1.1, exitRadius: 2.4 });
    const deck = makeDeck(ctx, { frame, near: path.points(0.5), seed: 'mothorgan', palette: MOTH, light: { level: 0.72, ambPower: 0.6 }, floor: { shine: 0.9 }, clock: 'flight' });
    yield 'organ: path';

    // ---- the street, deck 225: no higher than a room, and people stopped in it to listen
    const S0 = CZ1 + 6;
    yield* street(deck, {
      axis: 'z', from: S0, to: 66, at: 0, y: 0, width: 7, cloth: 0.65,
      lamps: { every: 6, kind: 'panel', power: 0.8 },
      plates: [{ at: 31, lines: ['The Moth Organ', ADDRESS], w: 3.0 }],
      folk: { stand: 1, stroll: 1, walk: 1.2 },
      fronts: {
        anti: [
          { from: S0, to: S0 + 5.5, kind: 'shop', name: 'Lamps', goods: 'lamps', awning: false, blade: true, lit: 1, ground: '#3a3040', ink: '#ead9c0', font: 'serif' },
          { from: S0 + 5.5, to: S0 + 9, kind: 'wall', bench: false, notice: ['Recital tonight', 'The lamps go down at nine.', 'Children sit at the front.'] },
          { from: S0 + 9, to: S0 + 14.5, kind: 'stall', name: 'Dusties', goods: 'bread', lit: 1 },
          { from: S0 + 14.5, to: S0 + 20, kind: 'shop', name: 'Lamps', goods: 'lamps', awning: ['#7a6880', '#d9d2cf'], lit: 1 },
        ],
        spin: [
          { from: S0, to: S0 + 6, kind: 'shop', name: 'Sleeves', sub: ['Wing-sleeves', 'remade and let out'], goods: 'cloth', awning: false, blade: true, lit: 1, ground: '#5a4766', ink: '#efe2cc', font: 'italic' },
          { from: S0 + 6, to: S0 + 10, kind: 'stair', sub: 'Up 226, down 224' },
          { from: S0 + 10, to: S0 + 16, kind: 'shop', name: 'Flutes', goods: 'flutes', awning: false, blade: true, lit: 1 },
        ],
      },
      fill: { mix: { shop: 2, home: 2.4, wall: 0.3, stall: 0.3 }, numbers: 41, lit: 0.8 },
    });
    // listeners stopped in the street, turned toward the court
    {
      const spots = [];
      for (let z = S0 + 1.5; z < 66; z += rng.f(1.4, 3.2)) for (const sd of [-1, 1]) {
        if (rng() < 0.35) continue;
        const x = sd * rng.f(1.9, 2.9);
        if (deck.clear(x, 1.5, z, 2.0)) spots.push({ p: [x, 0, z], yaw: Math.PI + rng.f(-0.35, 0.35) - sd * 0.1, child: rng() < 0.12 });
      }
      deck.people(spots);
      deck.walkersAlong({ from: [-2.5, 0, 64], to: [-2.5, 0, 15.5], n: Math.round(8 * dens), spread: 0.3, speed: 1.0, rng });
    }
    yield 'organ: street';

    // ---- the court: five decks high, its lamps turned down
    yield* atrium(deck, {
      x0: CX0, x1: CX1, z0: CZ0, z1: CZ1, y: 0, storeys: STOREYS, step: 2, depth: 6,
      sides: { front: { wall: STOREYS, color: '#6f6470' } },
      mouths: [{ side: 'back', storey: 0, at: 0, width: 7 }],
      light: { power: 0.34, terraces: 0.45, walks: 0.12, gloss: 0.18, color: '#f3e2d2', terraceColor: '#e9e0dc' },
      ceiling: { emit: 0.085, color: '#f6e2c8' },
      floor: { bands: 6, shine: 0.6, color: '#8e8682' },
      folk: { rail: 15, stroll: 1.0, floor: 0 },
      planting: 0.55,
      fill: { mix: { flat: 1 }, bay: [5.2, 6.6], lit: 0.45 },
      ground: { mix: { flat: 2, home: 1 }, lit: 0.6, blades: 0, awnings: 0 },
    });
    yield 'organ: court';
    // the ceiling's lamps, turned down for the recital to a field of small warm points
    for (let x = -25; x <= 25.1; x += 3.5) for (let z = -22.5; z <= 27; z += 3.5) deck.glow([{ p: [x + rng.f(-0.1, 0.1), 19.25, z], color: '#ffcf96', power: rng.f(0.7, 1.0), size: 0.42 }]);
    // listeners still arriving along two terraces, toward the organ end
    deck.walkersAlong({ from: [CX1 + 4 + 3.6, 8, 30], to: [CX1 + 4 + 3.6, 8, -70], n: 6, spread: 0.3, speed: 0.75, start: 4, rng });
    deck.walkersAlong({ from: [CX0 - 6 - 3.6, 12, 32], to: [CX0 - 6 - 3.6, 12, -70], n: 5, spread: 0.3, speed: 0.7, start: 6, rng });
    deck.walkersAlong({ from: [-30, 16, CZ1 + 8 + 3.6], to: [40, 16, CZ1 + 8 + 3.6], n: 5, spread: 0.3, speed: 0.8, start: 12, rng });

    // ---- the organ, its console and its listeners
    yield* buildOrgan(deck, rng);
    buildConsole(deck);
    const M = makeMover(deck), animate = buildMovers(deck, M);
    yield* audience(deck, rng, dens);
    // light: the façade warm, the console under its lamp, the case's insides glowing low
    deck.zone({ min: [-17.8, 0, -16.6], max: [17.8, 18.6, -13.4], soft: 1.4, color: '#ffd29a', power: 0.85, side: 0.6, under: 0.6 });
    deck.zone({ min: [-2.0, 0, CONZ - 1.4], max: [2.0, 2.4, CONZ + 1.0], soft: 0.9, color: '#ffe0b0', power: 1.1, side: 0.7, under: 0.5 });
    deck.zone({ min: [-14, 0, -23.8], max: [14, 15.5, -16.8], soft: 2, color: '#ffc98a', power: 0.45, side: 0.8, under: 0.5 });
    yield 'organ: light';

    yield* finish(deck);
    const scene = new Scene();
    scene.add(deck.group);
    scene.add(M.mesh());
    animate(0);
    return {
      scene, path, deck, near: 0.12, far: 900,
      look: { exposure: 1.55, bloom: 0.26, threshold: 0.95, saturation: 1.02, vignette: 0.55, contrast: 1.06 },
      portal: { mist: '#e8d6cc' },
      update(t) { deck.tick(t); animate(t); },
    };
  },
};
