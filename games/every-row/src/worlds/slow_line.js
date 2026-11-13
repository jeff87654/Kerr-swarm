// The slow line, between rows: the Wanderers' Galley, twice (docs/wander-year.md, Day 7 and Day 344; eating-out.md,
// The Wanderers' Galley; raft-transport.md, Cyclers). A slow cycler is a sleeper train that never stops, coasting at
// 2 km/s in a shielded trunk across the raft, and a coasting train has no up. Its galley belongs to whoever rides:
// a shelf of starter crocks, a stockpot that has not gone cold in living memory, soup in bulbs, bread in a net, bags
// clipped to the wall like coats. These are the only rooms in the piece without weight, so people hang at every angle,
// things drift and are caught, and the camera floats and slowly rolls. Outside the window is the mid-raft: the dark
// hall with a row of drums going by every twelve seconds, rank behind rank.
//
// Two worlds share the building code below:
//   slowLineOut   leg 1, seven days out. Begins outside, keeping pace with the train in its trunk, comes up to the
//                 galley's window, goes in through the water and the glass, drifts the length of the room past the
//                 shelf of crocks and the stockpot, and leaves by the hatch to the next car.
//   slowLineHome  leg 11, the night of the noodle lesson. Begins inside among loose noodle, turns right over once
//                 while following one long strand across the room, leaves through the window, and is left standing
//                 in the hall as the train goes on.
//
// How it is built. The world's own metres ride with the train: the galley is at the origin, +z is the way the train
// goes, +x is the window's side, and the kit's hall (kit/outside.js) is slid past at 2 km/s. The trunk is the same
// all along its length, so it stands still here. In the second world the frame lets go of the train at the end: the
// hall comes to rest round the camera and the train runs on up the trunk.
//
// Not canon (the docs give the cycler, its trunk, its speed, its capsules and the Galley's customs, and nothing of
// how any of it looks):
// - The trunk's glazing, and so which way the window faces. raft-transport.md gives a cycler's trunk 7.5 t/m2 of
//   water toward the Lantern and 6 t/m2 on every other side, keeps the train itself light, and says of a glide car
//   that its back windows "can be water too". Marit wants "to come in slow and watch the rows go by". So here the
//   slow line's trunk has one strip of clear tanks along a flank, and the galley's window looks through it: six
//   metres of water, which takes the red out of everything seen through it. No window faces the Lantern. The camera
//   goes through that water and the car's own glass; nothing else does, and nobody is ever outside the hull.
// - Where a trunk runs. "In their own corridors, away from drums": here between two columns of drums, 9.65 km from
//   the axes of the nearer and about two thirds of the way aft, crossing a row every 12.25 s. A main trunk runs
//   320 m off (wander-year.md: "the slow lines run beside the main trunks"). The lamps along both are this page's.
// - The train: twelve round cars about 22 m long, the galley the eighth, each sleeper with two rows of small windows.
// - The galley's layout: the shelf along the wall facing the window, the stockpot and its counters on a third wall,
//   the bags on a fourth, a frame of rail and old cloth slung in the middle for a table, lamps on the diagonals, a
//   hatch on the axis at each end. The bungee corner: a pad on the end wall, two cords, and the slate beside it,
//   whose words are Marit's ("do the bungee hour every day or your bones sulk").
// - The lettering: a tag on sixteen of the crocks naming a drum the docs name, "Take a spoon, leave a spoon" (the
//   guide's words) on a card, the Galley's name on a board over the hatch and painted on the hull over the window,
//   and a card on the stockpot saying what everyone does. The train's cream stripes.
// - Hair that floats, socks and no shoes, washing on a line, strings of small lamps, a herb box under a lamp of its
//   own, a guitar strapped to the wall, a bulb thrown slowly from one rider to another.
// - The noodle night's particulars: Marit in the middle of the room with strands between her hands, the long strand
//   the camera follows, a rider at the window who goes after it.
// - The first world's camera keeps pace with the train from outside before it goes in; the second's comes to rest
//   in the hall in six seconds. A camera weighs nothing.
import {
  Scene, Group, Vector3, Quaternion, Matrix4, Euler, Color, Mesh, InstancedMesh, BufferGeometry, Float32BufferAttribute, ShaderMaterial,
  CanvasTexture, SRGBColorSpace, LinearMipmapLinearFilter, LinearFilter, ClampToEdgeWrapping, DoubleSide, AdditiveBlending, NormalBlending,
  CustomBlending, AddEquation, ZeroFactor, SrcColorFactor, Sphere, DynamicDrawUsage,
} from 'three';
import { makePath } from '../core/path.js';
import { makeRng, clamp, smoothstep, smootherstep } from '../core/rng.js';
import { Geo } from '../kit/geo.js';
import { G, CLIP_PARS, CLIP_FRAG, lampRig, plainRig, litMaterial, glowPoints, vec3col } from '../kit/mats.js';
import { SKIN, CLOTH } from '../kit/folk.js';
import { RAFT, buildHall, farLights } from '../kit/outside.js';

const TAU = Math.PI * 2;
const SPEED = 2000;                         // the slow line, m/s
const PERIOD = RAFT.CELL / SPEED;           // 12.25 s from one row to the next
const HX = 0.5 * RAFT.CELL + 2600;          // the trunk's corridor, in the hall's own metres: between columns 0 and 1
const HY = 2350;                            // and this far aft of the rectenna layer
const R_IN = 3.5, R_HULL = 3.9;             // the car: inside and outside radius
const BORE = 5.0, R_TRUNK = 11.2;           // the trunk: its bore, and the outside of six metres of water
const SLOT = (25 * Math.PI) / 180;          // the clear strip: this far either side of the window's way
const ZA = -7.5, ZB = 7.5;                  // the galley's two end walls
const NSEG = 24, DTH = TAU / NSEG;          // the wall goes round in 24 panels
const WIN = { z0: -4.5, z1: 4.5, x: R_IN * Math.cos(DTH), h: R_IN * Math.sin(DTH) };      // the window: a chord two panels tall
const CAR = 23.5;                           // from one car's middle to the next
const CARS = [-7, 4];                       // the galley is car 0: seven behind it, four ahead
const WATER = [0.5, 0.86, 0.8];             // what six metres of water leaves of red, green and blue

const DRUMS = ['Sorrel', 'Lovage', 'Tansy', 'Chervil', 'Rue', 'Yarrow', 'Borage', 'Sloe', 'Kittiwake', 'Gloaming', 'Squall', 'Carillon', 'Dulse', 'Madder', 'Ochre', 'Spelt'];
const PANEL = ['#cdbd9e', '#c2b190', '#bcb596', '#c8b8a0', '#adb39c', '#c5ab88', '#b9ad92'];
const PATCH = ['#a3704a', '#6f8a86', '#b5553f', '#5d7480', '#8a9a62', '#b08a8a', '#b89a52', '#7a6a8a'];
const GLAZE = ['#7a5238', '#c9bfa6', '#5d7480', '#8a9a74', '#b98c4a', '#e3dccb', '#6e4a3e', '#93a7a8', '#a5683f', '#d8c9a0', '#4f5d52', '#b7b0a0'];
const WOOD = '#8a6644', WOOD2 = '#a98458', BRASS = '#c9a23a', STEEL = '#7c8088', DARK = '#3a3f47', NOODLE = '#f2e4bc';

const polar = (r, th, z) => [r * Math.cos(th), r * Math.sin(th), z];
const v3 = (a) => new Vector3(a[0], a[1], a[2]);
const _x = new Vector3(), _y = new Vector3(), _z = new Vector3(), _m = new Matrix4(), _eu = new Euler();
/** a turn that takes +y to `up` and +z as near `fwd` as it can */
function quatOf(up, fwd, out = new Quaternion()) {
  _y.copy(up).normalize(); _x.crossVectors(_y, fwd);
  if (_x.lengthSq() < 1e-8) _x.crossVectors(_y, Math.abs(_y.x) < 0.9 ? _z.set(1, 0, 0) : _z.set(0, 0, 1));
  _x.normalize(); _z.crossVectors(_x, _y);
  return out.setFromRotationMatrix(_m.makeBasis(_x, _y, _z));
}
/** how far from the axis the wall really is at angle th: its panels are flat, so it is nearer in the middle of one */
const wallR = (th) => (R_IN * Math.cos(DTH / 2)) / Math.cos((((th % DTH) + DTH) % DTH) - DTH / 2);
/** a place on the wall at angle th and z: its +y points in from the wall, its +z along the car */
function onWall(th, z, r = wallR(th), turn = 0) {
  const c = Math.cos(th), s = Math.sin(th), m = new Matrix4().makeBasis(new Vector3(-s, c, 0), new Vector3(-c, -s, 0), new Vector3(0, 0, 1));
  m.setPosition(r * c, r * s, z);
  return turn ? m.multiply(new Matrix4().makeRotationY(turn)) : m;
}
/** the same on an end wall: +y points into the room, +x and +z lie in the wall */
function onEnd(z, x, y, turn = 0) {
  const s = z < 0 ? 1 : -1, m = new Matrix4().makeBasis(new Vector3(1, 0, 0), new Vector3(0, 0, s), new Vector3(0, -s, 0));
  m.setPosition(x, y, z);
  return turn ? m.multiply(new Matrix4().makeRotationY(turn)) : m;
}
/** many copies of one geometry, each with a matrix of its own that may change every frame */
function copies(geo, mat, n, colors) {
  const mesh = new InstancedMesh(geo, mat, n), c = new Color();
  for (let i = 0; i < n; i++) { mesh.setMatrixAt(i, _m.identity()); c.set(colors ? colors[i % colors.length] : '#ffffff'); mesh.setColorAt(i, c); }
  mesh.instanceMatrix.setUsage(DynamicDrawUsage); mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- shader text
// Water: whatever is behind this pane is seen through six metres of it. One pane stands on the trunk's outer face;
// another rides just in front of the lens while the camera is in the water.
const WATER_VERT = /* glsl */`
varying vec3 vW;
void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const WATER_FRAG = /* glsl */`
${CLIP_PARS}
uniform vec3 uTint;
varying vec3 vW;
void main() {
  ${CLIP_FRAG}
  gl_FragColor = vec4(uTint, 1.0);
}`;
const SHEEN_VERT = /* glsl */`
varying vec3 vW; varying vec3 vN;
void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * vec3(position.xy, 0.0)); gl_Position = projectionMatrix * viewMatrix * wp; }`;
const SHEEN_FRAG = /* glsl */`
${CLIP_PARS}
uniform vec3 uColor;
varying vec3 vW; varying vec3 vN;
void main() {
  ${CLIP_FRAG}
  float f = pow(1.0 - abs(dot(normalize(vN), normalize(cameraPosition - vW))), 3.0);
  gl_FragColor = vec4(uColor * f, 1.0);
}`;
function waterMaterial(tint, depthTest = true) {
  return new ShaderMaterial({
    uniforms: { uClip: G.uClip, uTint: { value: new Vector3(tint[0], tint[1], tint[2]) } }, vertexShader: WATER_VERT, fragmentShader: WATER_FRAG,
    side: DoubleSide, transparent: true, depthWrite: false, depthTest, blending: CustomBlending, blendEquation: AddEquation, blendSrc: ZeroFactor, blendDst: SrcColorFactor,
  });
}

// The lamps along a trunk, every 175 m. At the train's speed they are one thread of light; as the frame slows in the
// hall they come apart into lamps. A ribbon that turns to face the eye, as the kit's lanes do.
const THREAD_VERT = /* glsl */`
attribute vec2 aLane;     // metres along the trunk, side (-1, 1)
uniform float uPx, uMinPx, uWidth;
varying vec3 vW; varying float vS; varying float vOff;
void main() {
  vec4 wp = modelMatrix * vec4(position + vec3(0.0, 0.0, aLane.x), 1.0);
  vec3 toEye = cameraPosition - wp.xyz;
  vec3 sideV = normalize(cross(vec3(0.0, 0.0, 1.0), toEye) + vec3(0.0, 1e-4, 0.0));
  float w = max(uWidth, uMinPx * length(toEye) / uPx) * 1.7;
  wp.xyz += sideV * aLane.y * w * 0.5;
  vW = wp.xyz; vOff = aLane.y * w * 0.5; vS = aLane.x;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const THREAD_FRAG = /* glsl */`
${CLIP_PARS}
uniform float uPx, uMinPx, uWidth, uOff, uBlur, uPower; uniform vec3 uColor;
varying vec3 vW; varying float vS; varying float vOff;
void main() {
  ${CLIP_FRAG}
  float dist = length(vW - cameraPosition), shown = max(uWidth, uMinPx * dist / uPx);
  float prof = max(1.0 - abs(vOff) / (shown * 0.5), 0.0);
  if (prof <= 0.0) discard;
  prof = prof * prof * (uWidth / shown);
  float pxs = max(abs(dFdx(vS)) + abs(dFdy(vS)), 0.01);
  float f = abs(fract((vS + uOff) / 175.0) - 0.5) * 175.0;
  float hb = max(uBlur, 6.0) * 0.5;
  float lamp = clamp(0.5 + (hb - f) / max(pxs, 1.0), 0.0, 1.0) * (6.0 / hb);
  float c = mix(lamp, 12.0 / 175.0, smoothstep(40.0, 150.0, pxs));
  gl_FragColor = vec4(uColor * (c * prof * uPower), 1.0);
}`;

// Lettering: quads cut from one canvas, lit like the wall they are on.
const LABEL_VERT = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec2 vUv;
void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vUv = uv; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const labelFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform sampler2D tAtlas;
varying vec3 vW; varying vec3 vN; varying vec2 vUv;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 t = texture2D(tAtlas, vUv).rgb;
  t = mix(t / 12.92, pow((t + 0.055) / 1.055, vec3(2.4)), step(0.04045, t));      // kept as painted in a plain texture (a canvas sent into an sRGB one is slow); made into light here
  gl_FragColor = vec4(kAir(t * kLight(vW, N, vW, N), vW), 1.0);
}`;

// Noodle: a ribbon that turns to face the eye and is shaded as a round thing, never thinner than a pixel (it fades
// instead). Each strand is a slow corkscrew that turns about its own length while a curl runs along it, and its
// middle wanders. A PINNED strand is held at both ends (uA, uB) and only its belly swims.
const NOODLE_VERT = /* glsl */`
attribute vec3 aAx;       // the way its length lies
attribute vec4 aSt;       // metres along it from its middle, side (-1, 1), its length, its width
attribute vec4 aRnd;      // four numbers of its own, 0..1
uniform float uTime, uPx, uMinPx, uSwim; uniform vec3 uShift, uA, uB;
varying vec3 vW; varying vec3 vSide; varying vec3 vEye; varying float vX; varying float vA; varying float vTone;
vec3 kStrand(float s) {
  float L = aSt.z, t = uTime * uSwim, ph = aRnd.x * 37.0;
  #ifdef PINNED
    float u = clamp(s / L + 0.5, 0.0, 1.0);
    vec3 ax = normalize(uB - uA + vec3(1e-4, 0.0, 0.0));
    float belly = sin(3.14159 * u);
  #else
    vec3 ax = aAx;
    float belly = 1.0;
  #endif
  vec3 e1 = normalize(cross(ax, abs(ax.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0))), e2 = cross(ax, e1);
  float turn = aRnd.x * 6.2832 + t * (aRnd.y - 0.5) * 0.5, c = cos(turn), sn = sin(turn);
  vec3 f1 = e1 * c + e2 * sn, f2 = e2 * c - e1 * sn;
  float k = 6.2832 / (0.9 + 1.3 * aRnd.z), w = 0.45 + 0.6 * aRnd.w;
  float amp = (0.1 + 0.16 * aRnd.y) * (0.6 + 0.4 * min(L, 2.5)) * belly;
  float a = k * s - w * t + ph, b = 0.5 * k * s + 0.31 * w * t + ph * 1.7;
  vec3 q = f1 * (amp * (sin(a) + 0.6 * sin(b))) + f2 * (amp * (cos(a) + 0.5 * cos(b * 1.3 + 1.0)));
  #ifdef PINNED
    return mix(uA, uB, u) + q * 0.55;
  #else
    vec3 home = position + vec3(sin(t * 0.13 + ph), sin(t * 0.11 + ph * 2.1), sin(t * 0.09 + ph * 3.3)) * (0.25 + 0.35 * aRnd.w);
    return home + uShift + q + ax * (s * 0.8 + 0.07 * sin(a * 0.5 + 1.3));
  #endif
}
void main() {
  vec3 p = kStrand(aSt.x), T = normalize(kStrand(aSt.x + 0.04) - p);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vec3 V = cameraPosition - wp.xyz; float dist = max(length(V), 0.01); V /= dist;
  vec3 S = cross(T, V); float sl = length(S); S = sl > 1e-5 ? S / sl : vec3(0.0, 1.0, 0.0);
  float px = aSt.w * uPx / dist, shown = max(px, uMinPx);
  vA = px / shown; vX = aSt.y; vSide = S; vEye = V; vTone = 0.86 + 0.28 * aRnd.z;
  wp.xyz += S * (aSt.y * 0.5 * shown * dist / uPx);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const noodleFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform vec3 uCol; uniform float uGlow;
varying vec3 vW; varying vec3 vSide; varying vec3 vEye; varying float vX; varying float vA; varying float vTone;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vSide * (vX * 0.92) + vEye * sqrt(max(1.0 - vX * vX * 0.85, 0.02)));
  vec3 c = uCol * vTone * (kLight(vW, N, vW, N) + uGlow);
  gl_FragColor = vec4(kAir(c, vW), min(vA, 1.0) * smoothstep(1.0, 0.7, abs(vX)));
}`;

// ---------------------------------------------------------------- lettering
const FONT = {
  hand: (px) => `500 ${px}px 'Caveat', 'Segoe Print', cursive`,
  serif: (px) => `italic 600 ${px}px 'Cormorant Garamond', Georgia, serif`,
  cond: (px) => `500 ${px}px 'Barlow Condensed', 'Arial Narrow', Arial, sans-serif`,
};
// Every label in the room, on one canvas. add() takes the words and where they go; build() makes the mesh.
function makeLabels(rig) {
  const list = [];
  const draw = (cx, e) => {
    const w = e.pw, h = e.ph, st = e.style, r = makeRng('label' + e.lines.join(''));
    cx.save(); cx.translate(e.x, e.y); cx.beginPath(); cx.rect(0, 0, w, h); cx.clip();
    cx.fillStyle = e.ground; cx.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) { cx.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'; cx.fillRect(0, r() * h, w, h * (0.08 + 0.2 * r())); }
    const m = Math.max(2, Math.round(h * 0.07));
    cx.strokeStyle = e.ink; cx.fillStyle = e.ink;
    let left = 0;
    if (st === 'tag') { left = h * 0.36; cx.beginPath(); cx.arc(h * 0.24, h * 0.5, h * 0.09, 0, TAU); cx.globalAlpha = 0.75; cx.fill(); cx.globalAlpha = 1; }
    if (st === 'board') { cx.globalAlpha = 0.6; cx.lineWidth = Math.max(1.5, h * 0.025); cx.strokeRect(m, m, w - 2 * m, h - 2 * m); cx.globalAlpha = 1; }
    if (st === 'slate') { cx.lineWidth = m * 1.6; cx.strokeStyle = '#8a6644'; cx.strokeRect(m * 0.8, m * 0.8, w - 1.6 * m, h - 1.6 * m); }
    const n = e.lines.length, availW = (w - left) * 0.86, availH = h * (st === 'slate' ? 0.7 : 0.82);
    let yy = (h - availH) / 2;
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      const lh = availH / n;
      let px = lh * (e.font === 'hand' ? 0.98 : 0.8);
      cx.font = FONT[e.font](px);
      const tw = cx.measureText(e.lines[i]).width;
      if (tw > availW) { px *= availW / tw; cx.font = FONT[e.font](px); }
      cx.fillText(e.lines[i], left + (w - left) / 2, yy + lh / 2 + px * 0.03);
      yy += lh;
    }
    cx.restore();
  };
  return {
    /** words w by h metres, centred at C (a Vector3), reading along r with the top toward u. o: style, font, ground, ink, ppm */
    add(lines, C, r, u, w, h, o = {}) {
      const st = o.style || 'tag';
      list.push({ lines: Array.isArray(lines) ? lines : [lines], C, r, u, w, h, style: st, font: o.font || 'hand', ppm: o.ppm || 760,
        ground: o.ground || (st === 'slate' ? '#2c3330' : st === 'board' ? '#3f5a4a' : '#efe6cf'), ink: o.ink || (st === 'slate' ? '#e9e6da' : st === 'board' ? '#f2e6c8' : '#2f2a26') });
    },
    *build() {
      if (!list.length || typeof document === 'undefined') return null;
      const W = 1024; let x = 2, y = 2, row = 0;
      for (const e of list) {
        e.ph = Math.round(Math.min(300, e.h * e.ppm)); e.pw = Math.round(e.ph * e.w / e.h);
        if (e.pw > 1000) { e.ph = Math.round(e.ph * 1000 / e.pw); e.pw = 1000; }
        if (x + e.pw + 2 > W) { x = 2; y += row + 3; row = 0; }
        e.x = x; e.y = y; x += e.pw + 3; row = Math.max(row, e.ph);
      }
      const H = Math.pow(2, Math.ceil(Math.log2(Math.max(64, y + row + 2))));
      yield 'lettering: laid out';
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const cx = cv.getContext('2d');
      yield 'lettering: canvas';
      const tex = new CanvasTexture(cv);
      tex.flipY = false; tex.wrapS = tex.wrapT = ClampToEdgeWrapping;
      tex.minFilter = LinearMipmapLinearFilter; tex.magFilter = LinearFilter; tex.generateMipmaps = true; tex.anisotropy = 4;
      yield 'lettering: canvas';
      // lettered a few milliseconds at a time, here and again later if the type was late
      function* paint() {
        let t0 = performance.now();
        cx.fillStyle = '#20201e'; cx.fillRect(0, 0, W, H);
        for (const e of list) { draw(cx, e); if (performance.now() - t0 > 4) { yield 'lettering'; t0 = performance.now(); } }
        tex.needsUpdate = true;
      }
      yield* paint();
      yield 'lettering';
      // The page's own type may not have arrived yet: letter everything again when it has. Whether a face has arrived
      // is read from the faces themselves (as kit/deck.js does), never asked of document.fonts by a font shorthand,
      // which can hold the page for seconds while the system's fonts are looked up.
      if (document.fonts && document.fonts.forEach) {
        const want = new Set([...new Set(list.map((e) => e.font))].map((f) => (/'([^']+)'/.exec(FONT[f](40)) || [])[1]).filter(Boolean));
        const waiting = [];
        document.fonts.forEach((face) => { if (want.has(String(face.family).replace(/['"]/g, '')) && face.status !== 'loaded') waiting.push(face.status === 'unloaded' ? face.load() : face.loaded); });
        if (waiting.length) {
          const again = () => {
            if (tex.userData.gone) return;
            const it = paint();
            const slice = () => { if (!tex.userData.gone && !it.next().done) requestAnimationFrame(slice); };
            slice();
          };
          Promise.all(waiting).then(again, () => { /* keep the stand-in lettering */ });
        }
      }
      tex.addEventListener('dispose', () => { tex.userData.gone = true; });
      const pos = [], nrm = [], uv = [], n = new Vector3();
      for (const e of list) {
        const hw = e.w / 2, hh = e.h / 2, P = (a, b) => [e.C.x + e.r.x * a * hw + e.u.x * b * hh, e.C.y + e.r.y * a * hw + e.u.y * b * hh, e.C.z + e.r.z * a * hw + e.u.z * b * hh];
        const u0 = (e.x + 0.5) / W, u1 = (e.x + e.pw - 0.5) / W, v0 = (e.y + 0.5) / H, v1 = (e.y + e.ph - 0.5) / H;
        const q = [[P(-1, -1), u0, v1], [P(1, -1), u1, v1], [P(1, 1), u1, v0], [P(-1, 1), u0, v0]];
        n.crossVectors(e.r, e.u).normalize();
        for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(q[i][0][0], q[i][0][1], q[i][0][2]); nrm.push(n.x, n.y, n.z); uv.push(q[i][1], q[i][2]); }
      }
      const geo = new BufferGeometry();
      geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
      geo.setAttribute('normal', new Float32BufferAttribute(nrm, 3));
      geo.setAttribute('uv', new Float32BufferAttribute(uv, 2));
      geo.boundingSphere = new Sphere(new Vector3(), 12);
      const mesh = new Mesh(geo, new ShaderMaterial({ uniforms: { ...rig.uniforms, uClip: G.uClip, tAtlas: { value: tex } }, vertexShader: LABEL_VERT, fragmentShader: labelFrag(rig) }));
      mesh.renderOrder = 1;
      return mesh;
    },
  };
}

// ---------------------------------------------------------------- the car: wall, ribs, window, end walls, hatches, lamps
// Everything fixed goes into one Geo (S.g), drawn from both sides. Returns nothing: it fills S.
function* buildShell(S) {
  const g = S.g, rng = makeRng('galley-shell');
  let t0 = performance.now();
  const inWin = (k, z) => (k === 0 || k === NSEG - 1) && z > WIN.z0 - 0.01 && z < WIN.z1 + 0.01;
  // the wall: ten rings of twenty-four panels, old enamel, some of them replaced with whatever was to hand
  for (let j = 0; j < 10; j++) for (let k = 0; k < NSEG; k++) {
    const za = ZA + j * 1.5, zb = za + 1.5, a = k * DTH, b = a + DTH;
    if (inWin(k, (za + zb) / 2)) continue;
    const c = rng.chance(0.14) ? rng.pick(PATCH) : rng.pick(PANEL);
    g.quad(polar(R_IN, a, za), polar(R_IN, a, zb), polar(R_IN, b, zb), polar(R_IN, b, za), c);
    if (rng.chance(0.2)) { g.push(onWall(a + DTH / 2, za + rng.f(0.4, 1.1), undefined, rng.f(-0.3, 0.3))); g.box(-rng.f(0.1, 0.24), 0, -rng.f(0.08, 0.2), rng.f(0.1, 0.24), 0.005, rng.f(0.08, 0.2), rng.pick(PATCH)); g.pop(); }
    if (S.due()) yield 'wall';
  }
  yield 'wall';
  // ribs every metre and a half; two of them cross the window as its mullions
  for (let j = 1; j < 10; j++) {
    const z = ZA + j * 1.5;
    for (let k = 0; k < NSEG; k++) {
      if (inWin(k, z)) continue;
      const a = k * DTH, b = a + DTH, r = R_IN - 0.085, col = '#8a8272';
      g.quad(polar(r, a, z - 0.05), polar(r, a, z + 0.05), polar(r, b, z + 0.05), polar(r, b, z - 0.05), col);
      g.quad(polar(r, a, z - 0.05), polar(r, b, z - 0.05), polar(R_IN, b, z - 0.05), polar(R_IN, a, z - 0.05), '#6f685b');
      g.quad(polar(r, a, z + 0.05), polar(R_IN, a, z + 0.05), polar(R_IN, b, z + 0.05), polar(r, b, z + 0.05), '#6f685b');
    }
    if (performance.now() - t0 > 4) { yield 'ribs'; t0 = performance.now(); }
  }
  // the window: frame, mullions, the reveal through the hull, a rail above and below
  yield 'ribs';
  const wx = WIN.x, wh = WIN.h, ox = R_HULL * Math.cos(DTH), oh = R_HULL * Math.sin(DTH), FR = '#6f685b';
  for (const s of [-1, 1]) {
    g.box(wx - 0.05, s * wh - 0.05, WIN.z0, wx + 0.05, s * wh + 0.05, WIN.z1, FR);
    g.quad([wx, s * wh, WIN.z0], [ox, s * oh, WIN.z0], [ox, s * oh, WIN.z1], [wx, s * wh, WIN.z1], '#4f4a42');
    g.tube([[wx - 0.16, s * (wh + 0.16), WIN.z0 + 0.2], [wx - 0.16, s * (wh + 0.16), WIN.z1 - 0.2]], 0.017, 5, BRASS);
    for (let z = WIN.z0 + 0.2; z < WIN.z1; z += 1.72) g.tube([[wx - 0.16, s * (wh + 0.16), z], [wx - 0.02, s * (wh + 0.2), z]], 0.012, 4, STEEL);
  }
  for (const z of [WIN.z0, WIN.z1]) {
    g.box(wx - 0.05, -wh, z - 0.05, wx + 0.05, wh, z + 0.05, FR);
    g.quad([wx, -wh, z], [ox, -oh, z], [ox, oh, z], [wx, wh, z], '#4f4a42');
  }
  for (const z of [-1.5, 1.5]) g.box(wx - 0.04, -wh, z - 0.045, ox, wh, z + 0.045, FR);
  yield 'window';
  // the end walls, each with a round hatch on the axis
  for (const z of [ZA, ZB]) {
    for (let k = 0; k < NSEG; k++) for (const [r0, r1] of [[0.74, 1.9], [1.9, R_IN]]) {
      const a = k * DTH, b = a + DTH;
      g.quad(polar(r0, a, z), polar(r1, a, z), polar(r1, b, z), polar(r0, b, z), rng.chance(0.1) ? rng.pick(PATCH) : rng.pick(PANEL));
    }
    g.push(onEnd(z, 0, 0));
    g.lathe(0, 0, 0, [[0.86, 0], [0.8, 0.07], [0.66, 0.07], [0.62, 0], [0.62, -0.42]], 20, (i) => (i === 3 ? '#4f4a42' : '#7c7466'));
    for (let q = 0; q < 4; q++) { const a = q * (TAU / 4) + 0.78; g.tube([[Math.cos(a - 0.2) * 1.02, 0, Math.sin(a - 0.2) * 1.02], [Math.cos(a) * 1.04, 0.09, Math.sin(a) * 1.04], [Math.cos(a + 0.2) * 1.02, 0, Math.sin(a + 0.2) * 1.02]], 0.016, 5, BRASS); }
    g.pop();
  }
  // the hatch at the back end is shut: a door with a wheel and a small port. The one at the front stands open
  // against the wall, and beyond it is the way to the next car
  g.push(onEnd(ZA, 0, 0));
  g.cyl(0, -0.1, 0, 0.62, 0.62, 0.06, 20, '#8f8778', { top: '#a39a88' });
  g.lathe(0, -0.04, 0, [[0.27, 0], [0.27, 0.05], [0.22, 0.05], [0.22, 0]], 14, BRASS);
  for (let q = 0; q < 3; q++) { const a = q * (TAU / 3); g.tube([[0, 0, 0], [Math.cos(a) * 0.24, 0, Math.sin(a) * 0.24]], 0.014, 4, BRASS); }
  g.cyl(0.36, -0.04, 0.22, 0.09, 0.09, 0.012, 10, '#9fc0d8', { emit: 0.9 });
  g.pop();
  g.push(onEnd(ZB, 0, 0));
  g.cyl(1.56, 0.03, -0.3, 0.62, 0.62, 0.06, 20, '#8f8778', { top: '#a39a88' });
  g.lathe(1.56, 0.09, -0.3, [[0.27, 0], [0.27, 0.05], [0.22, 0.05], [0.22, 0]], 14, BRASS);
  for (let q = 0; q < 3; q++) { const a = q * (TAU / 3) + 0.5; g.tube([[1.56, 0.12, -0.3], [1.56 + Math.cos(a) * 0.24, 0.12, -0.3 + Math.sin(a) * 0.24]], 0.014, 4, BRASS); }
  g.lathe(1.56, 0.09, -0.3, [[0.52, 0], [0.52, 0.012], [0.47, 0.012], [0.47, 0]], 20, '#7c7466');
  g.box(0.86, 0, -0.42, 0.96, 0.1, -0.2, STEEL);
  g.tube([[0, -0.42, 0], [0, -1.9, 0]], 0.62, 16, '#5d574d');
  g.cyl(0, -1.96, 0, 0.62, 0.62, 0.06, 16, '#6a6458', { top: '#7c7466' });
  g.cyl(0, -1.9, 0, 0.2, 0.2, 0.02, 12, '#ffd9a0', { emit: 1.4 });
  g.pop();
  yield 'ends';
  // lamps: four rows on the diagonals. One has been replaced with a whiter lamp; one is on its way out
  let n = 0;
  for (const dy of [1, -1]) for (const dx of [1, -1]) for (let i = 0; i < 6; i++, n++) {
    const th = Math.atan2(dy, dx), z = -6 + i * 2.4, m = onWall(th, z), odd = n === 9, weak = n === 16;
    g.push(m);
    g.box(-0.1, 0, -0.28, 0.1, 0.045, 0.28, '#e9dfc9');
    g.box(-0.075, 0.045, -0.25, 0.075, 0.05, 0.25, odd ? '#eef2ff' : '#ffdcae', { emit: weak ? 1.2 : 2.6, skip: 'b' });
    g.pop();
    S.glows.push({ p: new Vector3(0, 0.09, 0).applyMatrix4(m).toArray(), color: odd ? '#e6ecff' : '#ffd2a0', power: weak ? 0.4 : 0.8, size: 0.36, twinkle: weak ? 0.35 : 0 });
  }
  // hand rails along the room, where there is nothing else to hold
  for (const [deg, za, zb] of [[62, -7, 7], [118, 2.6, 7], [152, -7, 7], [208, -7, 7], [242, -7, 1.2], [298, -7, 7], [332, -7, -4.9], [28, 4.9, 7], [28, -7, -4.9], [332, 4.9, 7]]) {
    const th = (deg * Math.PI) / 180;
    g.tube([polar(R_IN - 0.12, th, za), polar(R_IN - 0.12, th, zb)], 0.016, 5, BRASS);
    for (let z = za + 0.1; z <= zb; z += 1.5) g.tube([polar(R_IN - 0.12, th, z), polar(R_IN, th, z)], 0.011, 4, STEEL);
    if (performance.now() - t0 > 4) { yield 'rails'; t0 = performance.now(); }
  }
  yield 'lamps';
}

// ---------------------------------------------------------------- the shelf of starter crocks
// "A shelf of starter crocks, one per drum passed: take a spoon, leave a spoon" (eating-out.md). Three ledges with
// fiddle rails along the wall that faces the window, the crocks standing out from the wall with their lids to the room.
function crockGeos() {
  const out = [];
  const mk = (body, lid, extra) => { const g = new Geo(); g.tint(1).lathe(0, 0, 0, body, 8, '#ffffff'); g.tint(0); lid(g); if (extra) extra(g); out.push(g.build()); };
  mk([[0.0, 0], [0.065, 0], [0.088, 0.025], [0.092, 0.12], [0.07, 0.175], [0.056, 0.19], [0.062, 0.205]], (g) => g.lathe(0, 0, 0, [[0.064, 0.205], [0.05, 0.228], [0.016, 0.236], [0.022, 0.256], [0, 0.262]], 8, '#6e5a48'));
  mk([[0.0, 0], [0.072, 0], [0.08, 0.012], [0.08, 0.15], [0.085, 0.162]], (g) => { g.cyl(0, 0.162, 0, 0.083, 0.078, 0.022, 8, '#b9ad94'); g.cyl(0, 0.184, 0, 0.02, 0.024, 0.02, 6, '#8a8272'); },
    (g) => g.tube([[0.086, 0.12, 0], [0.1, 0.19, 0], [0, 0.225, 0], [-0.1, 0.19, 0], [-0.086, 0.12, 0]], 0.005, 4, STEEL));
  mk([[0.0, 0], [0.042, 0], [0.076, 0.03], [0.082, 0.08], [0.062, 0.122], [0.047, 0.132]], (g) => { g.blob(0, 0.136, 0, [0.062, 0.03, 0.062], 0, '#e6dcc4', { shadeBottom: 0.85 }); g.lathe(0, 0, 0, [[0.05, 0.118], [0.053, 0.126]], 8, '#7a5a3c'); });
  mk([[0.0, 0], [0.05, 0], [0.062, 0.02], [0.062, 0.16], [0.036, 0.212], [0.031, 0.25], [0.037, 0.262]], (g) => g.cyl(0, 0.255, 0, 0.026, 0.03, 0.03, 6, '#b08a5a'));
  return out;
}
function* buildShelf(S) {
  const g = S.g2, rng = makeRng('starter-crocks'), TH = Math.PI, rows = [-0.21, 0, 0.21], z0 = -5.6, z1 = 5.6;
  const items = [[], [], [], []], tops = [];
  for (let r = 0; r < 3; r++) {
    const th = TH + rows[r];
    g.push(onWall(th, 0));
    g.box(-0.17, 0, z0, 0.17, 0.03, z1, WOOD, { top: WOOD2 });
    for (const sx of [-1, 1]) {
      g.tube([[sx * 0.135, 0.115, z0], [sx * 0.135, 0.115, z1]], 0.009, 4, BRASS);
      for (let z = z0; z <= z1 + 0.01; z += 1.4) g.tube([[sx * 0.135, 0.03, z], [sx * 0.135, 0.115, z]], 0.007, 4, BRASS);
    }
    for (let z = z0 + 0.7; z < z1; z += 1.4) g.box(-0.2, -0.02, z - 0.02, 0.2, 0.03, z + 0.02, '#6f685b');
    g.pop();
    for (let z = z0 + 0.25; z < z1 - 0.12; z += rng.f(0.36, 0.5)) {
      if (rng.chance(0.07)) continue;
      const kind = rng.i(0, 3), sc = rng.f(1.15, 1.5);
      const m = onWall(th, z, R_IN - 0.03).multiply(new Matrix4().makeRotationY(rng.f(0, TAU))).multiply(new Matrix4().makeRotationX(rng.f(-0.06, 0.06))).scale(new Vector3(sc, sc, sc));
      items[kind].push({ m, color: rng.pick(GLAZE) });
      tops.push({ th, z, r, h: 0.27 * sc });
    }
    yield 'shelf';
  }
  const geos = crockGeos();
  for (let k = 0; k < 4; k++) {
    const mesh = copies(geos[k], S.prop, items[k].length, items[k].map((q) => q.color));
    items[k].forEach((q, i) => mesh.setMatrixAt(i, q.m));
    S.room.add(mesh);
  }
  yield 'crocks';
  // a tag on each crock: sixteen that can be read where the flight passes, the rest turned away or too small to
  const named = [];
  const want = S.kind === 'out' ? [-3.4, 5.2] : [-5.2, 3.2];
  for (const t of tops) if (t.z > want[0] && t.z < want[1]) named.push(t);
  const step = named.length / DRUMS.length, pickd = new Set();
  for (let i = 0; i < DRUMS.length; i++) pickd.add(named[Math.floor((i + 0.5) * step)]);
  let d = 0;
  const order = DRUMS.slice().sort((a, b) => makeRng(a)() - makeRng(b)());
  for (const t of tops) {
    // the tag stands off the crock's neck on its string, facing the room, and reads the way the room is flown
    const tilt = rng.f(-0.16, 0.16), u = new Vector3(0, Math.cos(tilt), Math.sin(tilt)), r = new Vector3(0, Math.sin(tilt), -Math.cos(tilt));
    const neck = v3(polar(R_IN - 0.03 - t.h * 0.8, t.th, t.z)), C = neck.clone().addScaledVector(u, 0.125).addScaledVector(r, 0.03);
    C.x += 0.03;
    const card = (w, h, col) => { const B = C.clone(); B.x -= 0.003; g.quad(B.clone().addScaledVector(r, -w).addScaledVector(u, -h), B.clone().addScaledVector(r, w).addScaledVector(u, -h), B.clone().addScaledVector(r, w).addScaledVector(u, h), B.clone().addScaledVector(r, -w).addScaledVector(u, h), col); };
    if (pickd.has(t)) {
      S.labels.add(order[d++ % order.length], C, r, u, 0.2, 0.082, { style: 'tag', ink: rng.pick(['#2f2a26', '#27394a', '#5a2a22', '#2c4034']), ground: rng.pick(['#efe6cf', '#e9dcc0', '#f2ead8', '#e4dccb']) });
      card(0.104, 0.045, '#d9cdb4');
      g.tube([neck, C.clone().addScaledVector(r, -0.075)], 0.003, 3, '#5a4a3a');
    } else if (rng.chance(0.7)) {
      card(rng.f(0.05, 0.075), 0.03, rng.pick(['#e9dcc0', '#d8c9a8', '#c9d0c0', '#e0c8b0']));
      g.tube([neck, C], 0.003, 3, '#5a4a3a');
    }
    if (S.due()) yield 'tags';
  }
  // the rule of the shelf, on a card over it, and the spoons on a cord
  const cth = TH - 0.335, cc = v3(polar(wallR(cth) - 0.008, cth, S.kind === 'out' ? 1.0 : -1.6));
  g.push(onWall(cth, cc.z)); g.box(-0.105, 0, -0.45, 0.105, 0.005, 0.45, '#d9cdb4'); g.pop();
  S.labels.add('Take a spoon, leave a spoon', cc, new Vector3(0, 0, -1), new Vector3(Math.sin(cth), -Math.cos(cth), 0), 0.86, 0.17, { style: 'card', ppm: 640 });
  for (let i = 0; i < 9; i++) {
    g.push(onWall(TH - 0.3, cc.z - 0.75 - i * 0.11, undefined, rng.f(-0.3, 0.3)));
    g.box(-0.007, 0.004, -0.004, 0.007, 0.012, 0.13, WOOD2); g.blob(0, 0.01, 0.15, [0.02, 0.008, 0.028], 0, rng.pick([WOOD, WOOD2, '#c9b48a']));
    g.pop();
  }
  S.lattices.push({ origin: [-2.72, 0.95, -5.25], spacing: [1, 1.5], count: [1, 8], color: '#ffcf90', power: 0.5, reach: 1.25 });
  for (let i = 0; i < 8; i++) {
    g.box(-2.76, 0.93, -5.33 + i * 1.5, -2.68, 0.96, -5.17 + i * 1.5, '#ffe2b8', { emit: 3.5 });
    g.tube([[-2.72, 0.96, -5.25 + i * 1.5], [-3.28, 1.22, -5.25 + i * 1.5]], 0.008, 4, STEEL);
    S.glows.push({ p: [-2.72, 0.92, -5.25 + i * 1.5], color: '#ffd9a0', power: 0.7, size: 0.3 });
  }
  yield 'tags';
}

// ---------------------------------------------------------------- the stockpot, the counter, the bread, the bulbs
// "The stockpot is a sealed crock with a crank on the side, and it hasn't gone cold in living memory."
const POT = { th: 1.5 * Math.PI, z: 3.8 };
// A bulb thrown from one rider to another and back: twelve seconds in the air each way, in a straight line.
const TOSS = { a: new Vector3(-2.2, -0.3, -3.6), b: new Vector3(1.42, -1.5, -0.62), fly: 12, hold: 2.5 };
function tossAt(t, out) {
  const T = TOSS.fly + TOSS.hold, ph = ((t % (2 * T)) + 2 * T) % (2 * T), back = ph >= T, u = clamp(((back ? ph - T : ph) - TOSS.hold) / TOSS.fly, 0, 1);
  return out.copy(back ? TOSS.b : TOSS.a).lerp(back ? TOSS.a : TOSS.b, u);
}
function bulbGeo() {
  const g = new Geo();
  g.tint(1).blob(0, 0, 0, [0.04, 0.052, 0.04], 1, '#ffffff', { emit: 0.55, shadeBottom: 0.8 });
  g.tint(0).cyl(0, 0.048, 0, 0.013, 0.01, 0.03, 6, '#e9e2d0'); g.cyl(0, 0.078, 0, 0.014, 0.014, 0.012, 6, '#c9563c');
  return g.build();
}
function* buildGalley(S) {
  const g = S.g2, rng = makeRng('stockpot'), M = onWall(POT.th, POT.z);
  g.push(M);
  g.cyl(0, 0, 0, 0.44, 0.4, 0.16, 12, DARK);
  g.cyl(0, 0.16, 0, 0.475, 0.475, 0.1, 14, '#c26a34', { emit: 0.7 });
  g.lathe(0, 0, 0, [[0.36, 0.26], [0.455, 0.34], [0.47, 0.76], [0.42, 0.95], [0.335, 1.02], [0.345, 1.05]], 14, (i) => (i === 2 ? '#6a4630' : '#573826'));
  for (const h of [0.42, 0.7]) g.lathe(0, 0, 0, [[0.468, h], [0.482, h + 0.008], [0.482, h + 0.04], [0.47, h + 0.048]], 14, BRASS);
  g.lathe(0, 0, 0, [[0.36, 1.05], [0.3, 1.12], [0.11, 1.15], [0.11, 1.2], [0, 1.2]], 14, '#7a5238');
  for (let q = 0; q < 4; q++) { const a = q * (TAU / 4) + 0.4; g.box(Math.cos(a) * 0.35 - 0.03, 1.0, Math.sin(a) * 0.35 - 0.03, Math.cos(a) * 0.35 + 0.03, 1.1, Math.sin(a) * 0.35 + 0.03, STEEL); }
  g.cyl(0.19, 1.13, 0.06, 0.07, 0.07, 0.05, 8, BRASS);
  g.tube([[0, 0.62, -0.46], [0, 0.62, -0.6]], 0.03, 6, STEEL);                    // the crank's axle
  g.tube([[0.46, 0.5, 0.1], [0.62, 0.5, 0.1], [0.62, 0.42, 0.1]], 0.02, 5, BRASS); // the tap bulbs are filled at
  g.pop();
  S.glows.push({ p: new Vector3(0, 0.21, 0).applyMatrix4(M).toArray(), color: '#ff9a50', power: 0.5, size: 1.5 });
  // the crank itself turns: an arm and a handle on the axle's end
  const cg = new Geo();
  cg.box(-0.022, -0.022, -0.02, 0.022, 0.2, 0.012, STEEL); cg.tube([[0, 0.18, 0], [0, 0.18, -0.15]], 0.02, 6, WOOD2);
  const crank = new Mesh(cg.build(), S.lit), base = M.clone().multiply(new Matrix4().makeTranslation(0, 0.62, -0.6));
  crank.matrixAutoUpdate = false; crank.frustumCulled = false;
  S.room.add(crank);
  const angle = (t) => t * 1.9 + 0.5 * Math.sin(t * 1.9);
  S.ticks.push((t) => { crank.matrix.copy(base).multiply(_m.makeRotationZ(angle(t))); crank.matrixWorldNeedsUpdate = true; });
  S.crankHand = (t, out) => { const a = angle(t); return out.set(-Math.sin(a) * 0.18, Math.cos(a) * 0.18, -0.1).applyMatrix4(base); };
  S.potTop = new Vector3(0.19, 1.24, 0.06).applyMatrix4(M);
  S.labels.add(['Add something from', 'the last drum you slept in'], new Vector3(-0.3, 1.04, -0.572).applyMatrix4(M), new Vector3(-1, 0, 0), new Vector3(0, 1, 0), 0.62, 0.2, { style: 'card', ppm: 700 });
  g.push(M); g.box(-0.62, 0.93, -0.568, 0.02, 1.15, -0.56, '#d9cdb4'); g.tube([[-0.3, 1.15, -0.565], [-0.2, 1.1, -0.36]], 0.004, 3, '#5a4a3a'); g.pop();
  yield 'stockpot';
  // counters either side of it along the same wall: a board to work on, taps, a strip of clips for bulbs
  const W = onWall(POT.th, 0);
  g.push(W);
  for (const [za, zb, top] of [[1.25, 2.5, '#b9b4a6'], [4.45, 6.7, '#a9a69c']]) {
    g.box(-0.6, 0, za, 0.6, 0.46, zb, '#7f8a7c', { top });
    for (let z = za + 0.06; z < zb - 0.3; z += 0.62) { g.box(-0.56, 0.05, z, -0.02, 0.42, z + 0.56, '#8a9486', { skip: 'b' }); g.box(0.02, 0.05, z, 0.56, 0.42, z + 0.56, '#869082', { skip: 'b' }); }
    g.tube([[-0.64, 0.4, za + 0.05], [-0.64, 0.4, zb - 0.05]], 0.014, 5, BRASS); g.tube([[0.64, 0.4, za + 0.05], [0.64, 0.4, zb - 0.05]], 0.014, 5, BRASS);
  }
  g.box(-0.42, 0.46, 1.42, 0.3, 0.49, 2.38, S.kind === 'home' ? '#f1ece0' : WOOD2);                           // the board
  g.tube([[-0.5, 0.1, 2.72], [0.5, 0.1, 2.72]], 0.016, 5, BRASS); g.tube([[-0.5, 0.1, 2.72], [-0.5, 0, 2.72]], 0.012, 4, STEEL); g.tube([[0.5, 0.1, 2.72], [0.5, 0, 2.72]], 0.012, 4, STEEL);   // a rail to hook a foot under
  g.box(-0.5, 0.46, 4.6, -0.2, 0.86, 4.72, '#8f958c'); g.cyl(-0.42, 0.7, 4.72, 0.02, 0.02, 0.05, 6, '#9fc0d8', { emit: 1.2 }); g.cyl(-0.28, 0.7, 4.72, 0.02, 0.02, 0.05, 6, '#e98a5a', { emit: 1.2 });
  g.box(0.0, 0.46, 4.7, 0.5, 0.5, 6.5, '#6f685b');
  g.pop();
  // three work lamps on stalks over the counters
  S.lattices.push({ origin: [0.98, -2.3, 2.2], spacing: [1, 1.6], count: [1, 3], color: '#ffc480', power: 0.6, reach: 1.5 });
  for (let i = 0; i < 3; i++) {
    const z = 2.2 + i * 1.6;
    g.tube([[1.16, -3.3, z], [1.12, -2.6, z], [0.98, -2.27, z]], 0.012, 4, STEEL); g.box(0.9, -2.3, z - 0.09, 1.06, -2.26, z + 0.09, '#ffe2b8', { emit: 4 });
    S.glows.push({ p: [0.98, -2.33, z], color: '#ffc890', power: 0.9, size: 0.4 });
  }
  // bulbs: a strip of them clipped by the taps, and others loose in the room
  const soups = ['#e0a040', '#cf7a30', '#c2a850', '#b25c2c', '#dcc478', '#a8b060'], held = [], loose = [];
  for (let i = 0; i < 9; i++) held.push(W.clone().multiply(new Matrix4().makeTranslation(0.25 + (i % 2) * 0.16, 0.56, 4.85 + i * 0.19)).multiply(new Matrix4().makeRotationX(rng.f(-0.3, 0.3))));
  const nLoose = S.kind === 'out' ? 10 : 5;
  for (let i = 0, tries = 0; i < nLoose && tries < 400; tries++) {
    const p = [rng.f(-1.9, 2.1), rng.f(-1.9, 1.5), rng.f(-5.5, 6.3)];
    if (!S.clear(p, 0.95)) continue;
    loose.push({ p, ax: new Vector3(rng.f(-1, 1), rng.f(-1, 1), rng.f(-1, 1)).normalize(), w: rng.f(0.15, 0.5) * rng.sign(), ph: rng.f(0, 40), amp: rng.f(0.12, 0.3) }); i++;
  }
  const bulbs = copies(bulbGeo(), S.prop, held.length + loose.length + 1, soups);
  held.forEach((m, i) => bulbs.setMatrixAt(i, m));
  S.room.add(bulbs);
  const q = new Quaternion(), p = new Vector3(), one = new Vector3(1, 1, 1), axis = new Vector3(0.3, 0.8, 0.5).normalize();
  S.ticks.push((t) => {
    loose.forEach((b, i) => {
      p.set(b.p[0] + b.amp * Math.sin(t * 0.07 + b.ph), b.p[1] + b.amp * Math.sin(t * 0.09 + b.ph * 1.7), b.p[2] + b.amp * 1.6 * Math.sin(t * 0.05 + b.ph * 2.3));
      bulbs.setMatrixAt(held.length + i, _m.compose(p, q.setFromAxisAngle(b.ax, b.ph + t * b.w), one));
    });
    // and one that is thrown: straight across the room, slowly, and caught (on leg 1; on leg 11 nobody has a hand free)
    bulbs.setMatrixAt(held.length + loose.length, S.kind === 'out' ? _m.compose(tossAt(t, p), q.setFromAxisAngle(axis, t * 1.3), one) : _m.makeScale(0, 0, 0));
    bulbs.instanceMatrix.needsUpdate = true;
  });
  yield 'counter';
  // bread comes in a net: a bag of loaves on a cord, swinging slowly about its hook
  const bg = new Geo(), brng = makeRng('bread');
  for (let i = 0; i < 11; i++) {
    const d = new Vector3(brng.f(-1, 1), brng.f(-1, 1), brng.f(-1, 1)).normalize().multiplyScalar(brng.f(0.08, 0.2));
    bg.blob(d.x, 0.95 + d.y, d.z, [brng.f(0.1, 0.14), brng.f(0.075, 0.1), brng.f(0.09, 0.12)], 1, brng.pick(['#c98f4a', '#b97a3a', '#d6a35c', '#a9692e']), { lump: 0.12, seed: i + 1, shadeBottom: 0.75 });
  }
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI, pts = []; for (let i = 0; i <= 12; i++) { const b = (i / 12) * TAU; pts.push([Math.cos(a) * Math.sin(b) * 0.33, 0.95 + Math.cos(b) * 0.3, Math.sin(a) * Math.sin(b) * 0.33]); } bg.tube(pts, 0.004, 3, '#4a4038'); }
  for (const h of [-0.12, 0.1]) { const pts = []; for (let i = 0; i <= 12; i++) { const b = (i / 12) * TAU; pts.push([Math.cos(b) * 0.32, 0.95 + h, Math.sin(b) * 0.32]); } bg.tube(pts, 0.004, 3, '#4a4038'); }
  bg.tube([[0, 0, 0], [0, 0.66, 0]], 0.005, 4, '#4a4038');
  const bread = new Mesh(bg.build(), S.lit), hook = W.clone().multiply(new Matrix4().makeTranslation(-0.2, 0.5, 5.9));
  bread.matrixAutoUpdate = false; bread.frustumCulled = false;
  S.room.add(bread);
  S.ticks.push((t) => { bread.matrix.copy(hook).multiply(_m.makeRotationZ(0.2 + 0.16 * Math.sin(t * 0.41))).multiply(new Matrix4().makeRotationX(-0.25 + 0.2 * Math.sin(t * 0.33 + 1))); bread.matrixWorldNeedsUpdate = true; });
  yield 'bread';
}

// ---------------------------------------------------------------- bags, the table, the bungee corner, and what is on the walls
// "You sleep in a bag clipped to the wall like a coat": a row of them on one wall, hanging in toward the middle of
// the room and swinging a little. Three have somebody in them.
function* buildBags(S) {
  const g = S.g2, rng = makeRng('bags');
  const mk = (full, skin, hair) => {
    const b = new Geo();
    b.tint(1).blob(0, -1.1, 0, [0.31, 0.92, full ? 0.25 : 0.12], 1, '#ffffff', { lump: 0.1, seed: full ? 3 : 7, shadeBottom: 0.8 });
    b.tint(0.45).blob(0.03, -1.56, 0.01, [0.3, 0.17, full ? 0.262 : 0.13], 0, '#c9b48a', { shadeBottom: 0.85 });
    b.tint(0);
    for (const s of [-1, 1]) b.tube([[s * 0.2, -0.27, 0], [0, 0, 0]], 0.011, 4, '#4a4038');
    b.box(-0.035, -0.03, -0.022, 0.035, 0.03, 0.022, BRASS);
    if (full) { b.blob(0, -0.3, 0.13, [0.1, 0.12, 0.11], 1, skin, { shadeBottom: 0.85 }); b.blob(0, -0.25, 0.07, [0.125, 0.135, 0.125], 1, hair, { lump: 0.22, seed: 5, shadeBottom: 0.8 }); }
    return b.build();
  };
  g.tube([[0, R_IN - 0.12, -6.9], [0, R_IN - 0.12, 1.0]], 0.016, 5, BRASS);
  for (let z = -6.8; z <= 1; z += 1.3) g.tube([[0, R_IN - 0.12, z], [0, R_IN, z]], 0.011, 4, STEEL);
  const bags = [];
  for (let i = 0; i < 8; i++) bags.push({ z: -6.3 + i * 0.95, full: i === 1 ? 1 : i === 4 ? 2 : i === 6 ? 1 : 0, a: rng.f(-0.22, 0.22), b: rng.f(-0.2, 0.2), yaw: rng.f(-0.5, 0.5), ph: rng.f(0, 30), col: ['#8fa0b0', '#b9806c', '#9aaa7a', '#c8a56a', '#7e8aa0', '#a98aa8', '#c98a5a', '#8ab0aa'][i] });
  yield 'bags';
  const sets = [[mk(false), bags.filter((q) => !q.full)], [mk(true, '#d9a87c', '#3a2a20'), bags.filter((q) => q.full === 1)], [mk(true, '#8a5a3a', '#1e1a18'), bags.filter((q) => q.full === 2)]];
  const meshes = sets.map(([geo, list]) => { const m = copies(geo, S.prop, list.length, list.map((q) => q.col)); S.room.add(m); return m; });
  const A = new Matrix4(), B = new Matrix4(), Y = new Matrix4();
  S.ticks.push((t) => {
    sets.forEach(([, list], k) => {
      list.forEach((q, i) => {
        _m.makeTranslation(0, R_IN - 0.15, q.z).multiply(A.makeRotationZ(q.a + 0.07 * Math.sin(t * 0.47 + q.ph))).multiply(B.makeRotationX(q.b + 0.06 * Math.sin(t * 0.39 + q.ph * 1.7))).multiply(Y.makeRotationY(q.yaw + 0.1 * Math.sin(t * 0.21 + q.ph)));
        meshes[k].setMatrixAt(i, _m);
      });
      meshes[k].instanceMatrix.needsUpdate = true;
    });
  });
  yield 'bags';
}

// "A table that is only a place to hold on to": a frame of rail with old cloth laced across it, slung on four cords
// in the middle of the room at no angle in particular.
const TABLE = { c: new Vector3(0.45, 1.2, 2.7), n: new Vector3(0.25, 0.9, 0.36).normalize(), r: 0.82 };
function* buildTable(S) {
  const g = S.g2, rng = makeRng('table'), q = quatOf(TABLE.n, new Vector3(0, 0, 1)), M = new Matrix4().compose(TABLE.c, q, new Vector3(1, 1, 1));
  TABLE.e1 = new Vector3(1, 0, 0).applyQuaternion(q); TABLE.e2 = new Vector3(0, 0, 1).applyQuaternion(q);
  TABLE.rim = (a, r = TABLE.r, lift = 0) => TABLE.c.clone().addScaledVector(TABLE.e1, Math.cos(a) * r).addScaledVector(TABLE.e2, Math.sin(a) * r).addScaledVector(TABLE.n, lift);
  g.push(M);
  const oct = []; for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + 0.39; oct.push([Math.cos(a) * 0.82, Math.sin(a) * 0.82]); }
  g.extrude(oct.map((p) => [p[0] * 0.96, -p[1] * 0.96]), -0.006, 0.012, '#8a5040', { top: '#955844' });
  g.extrude(oct.map((p) => [p[0] * 0.96, p[1] * 0.96]), -0.008, 0.001, '#834a3a', { noSides: true });
  g.tube([...oct, oct[0], oct[1]].map((p) => [p[0], 0, p[1]]), 0.022, 5, '#b08a4a');
  for (const [x, z, w, d, c] of [[0.2, 0.25, 0.22, 0.16, '#c9b48a'], [-0.35, -0.1, 0.18, 0.2, '#7d8f9c'], [0.1, -0.42, 0.26, 0.12, '#8a9a74']]) g.box(x - w / 2, 0.006, z - d / 2, x + w / 2, 0.009, z + d / 2, c);
  g.box(-0.3, 0.006, 0.3, -0.06, 0.03, 0.48, '#2c3330'); g.cyl(0.42, 0.006, -0.12, 0.05, 0.045, 0.12, 8, '#93a7a8'); g.cyl(0.3, -0.13, 0.3, 0.045, 0.05, 0.12, 8, '#b98c4a');
  for (let i = 0; i < 5; i++) g.tube([[0.4 + rng.f(-0.02, 0.02), 0.1, -0.12 + rng.f(-0.02, 0.02)], [0.4 + rng.f(-0.06, 0.06), 0.3, -0.12 + rng.f(-0.06, 0.06)]], 0.004, 3, WOOD2);
  g.box(-0.5, -0.03, -0.3, -0.28, -0.008, -0.14, '#e9dcc0'); g.box(-0.1, -0.05, -0.55, 0.12, -0.008, -0.4, '#5d7480');
  g.pop();
  // the four cords it is slung on, out to the wall
  for (const a of [0.39, 1.96, 3.53, 5.1]) {
    const p = TABLE.rim(a), k = R_IN / Math.hypot(p.x, p.y);
    g.tube([p, [p.x * k, p.y * k, p.z + (a > 3 ? -0.5 : 0.5)]], 0.006, 3, DARK);
  }
  yield 'table';
}

const PAD = { x: -1.7, y: -1.25 };
function* buildCorner(S) {
  const g = S.g2, M = onEnd(ZA, PAD.x, PAD.y);
  g.push(M);
  g.box(-0.72, 0, -0.46, 0.72, 0.04, 0.46, '#4a5a52', { top: '#5d6f66' });
  for (let i = 0; i < 9; i++) g.box(-0.66 + i * 0.16, 0.04, -0.4, -0.6 + i * 0.16, 0.046, 0.4, '#3a4640');
  for (const s of [-1, 1]) { g.cyl(0, 0, s * 0.64, 0.045, 0.03, 0.05, 6, BRASS); g.tube([[-0.72, 0.9, s * 0.52], [-0.72, 0.04, s * 0.52]], 0.014, 5, BRASS); }
  g.tube([[-0.72, 0.9, -0.52], [-0.72, 0.9, 0.52]], 0.016, 5, BRASS);
  g.pop();
  S.pad = { M, anchors: [new Vector3(0, 0.05, -0.64).applyMatrix4(M), new Vector3(0, 0.05, 0.64).applyMatrix4(M)] };
  // the slate beside it
  g.box(-2.42, 0.34, ZA + 0.004, -1.52, 0.86, ZA + 0.012, WOOD);
  S.labels.add(['Bungee hour', 'Every day, or your bones sulk'], new Vector3(-1.97, 0.6, ZA + 0.016), new Vector3(1, 0, 0), new Vector3(0, 1, 0), 0.84, 0.46, { style: 'slate', ppm: 560 });
  // the Galley's name, on a board over the hatch that leads on up the train
  const up = v3(S.signUp).normalize(), right = new Vector3(0, 0, 1).cross(up).normalize();
  S.labels.add("The Wanderers' Galley", new Vector3(0, 0, ZB - 0.016).addScaledVector(up, 1.42), right, up, 1.9, 0.36, { style: 'board', font: 'serif', ppm: 520 });
  g.push(new Matrix4().makeBasis(right, up, new Vector3(0, 0, 1)).setPosition(up.x * 1.42, up.y * 1.42, ZB - 0.012));
  g.box(-0.99, -0.21, 0, 0.99, 0.21, 0.008, WOOD);
  g.pop();
  yield 'corner';
}

function* buildWalls(S) {
  const g = S.g2, rng = makeRng('wall-things');
  const slots = [];
  for (const [deg, zs] of [[45, [-4.8, -2.4, 0, 2.4, 4.8]], [135, [-4.8, -2.4, 0, 2.4, 4.8]], [225, [-4.8, -2.4, 0, 2.4, 4.8]], [315, [-4.8, -2.4, 0, 2.4, 4.8]]]) for (const z of zs) slots.push([deg, z]);
  for (const [deg, z] of slots) {
    const kind = deg === 135 && z === 4.8 ? 'guitar' : deg === 315 && z === 2.4 ? 'herbs' : rng.pick(['locker', 'pocket', 'cards', 'locker', 'pocket', 'net']);
    const th = ((deg + rng.f(-5, 5)) * Math.PI) / 180, M = onWall(th, z + rng.f(-0.2, 0.2), undefined, kind === 'guitar' ? 0.5 : rng.f(-0.12, 0.12));
    g.push(M);
    if (kind === 'locker') {
      const c = rng.pick(['#8f9a8c', '#a39a80', '#7d8f9c', '#b0a58c', '#96826a']);
      g.box(-0.42, 0, -0.5, 0.42, 0.15, 0.5, c, { top: rng.pick(PANEL) });
      g.box(-0.004, 0.15, -0.5, 0.004, 0.153, 0.5, '#4f4a42'); g.box(-0.05, 0.15, -0.03, 0.05, 0.17, 0.03, BRASS);
      if (rng.chance(0.5)) g.box(0.1, 0.15, 0.2, 0.32, 0.154, 0.4, rng.pick(PATCH));
    } else if (kind === 'pocket') {
      g.box(-0.32, 0, -0.22, 0.32, 0.07, 0.22, rng.pick(['#7a8a62', '#8a5a5a', '#5e6a7e', '#a8895a', '#6a8a86']));
      g.box(-0.22, 0.015, -0.34, -0.04, 0.055, -0.08, rng.pick(['#c9563c', '#3a6ea5', '#e2c14a', '#d7d2c4'])); g.cyl(0.14, 0.035, -0.2, 0.035, 0.035, 0.001, 6, '#e9e2d0');
      g.rot('x', Math.PI / 2); g.cyl(0.14, -0.3, -0.035, 0.03, 0.03, 0.22, 6, '#d8cdb8'); g.pop();
    } else if (kind === 'cards') {
      g.box(-0.4, 0, -0.28, 0.4, 0.012, 0.28, '#8a7a5e');
      for (let i = 0; i < 8; i++) { g.at(rng.f(-0.3, 0.3), 0.012 + i * 0.0006, rng.f(-0.2, 0.2), rng.f(-0.4, 0.4)); g.box(-0.074, 0, -0.05, 0.074, 0.002, 0.05, rng.pick(['#e8c99a', '#9fd0d6', '#e07a6e', '#6fc9a8', '#f3c25c', '#d9c6cc', '#8a9a84', '#e9a6c2', '#d9a65a'])); g.pop(); }
    } else if (kind === 'net') {
      for (let i = 0; i < 6; i++) g.blob(rng.f(-0.18, 0.18), 0.1 + rng.f(0, 0.1), rng.f(-0.2, 0.2), rng.f(0.07, 0.12), 0, rng.pick(['#d8c9a0', '#93a7a8', '#c98b5e', '#8a9a74', '#b7b0a0']), { lump: 0.15, seed: i + 2 });
      for (const zz of [-0.12, 0.12]) g.tube([[-0.3, 0, zz], [-0.15, 0.24, zz], [0.15, 0.24, zz], [0.3, 0, zz]], 0.005, 3, '#4a4038');
    } else if (kind === 'guitar') {
      g.blob(0, 0.05, -0.12, [0.19, 0.045, 0.22], 1, '#b9773a', { shadeBottom: 0.85 }); g.blob(0, 0.05, 0.14, [0.145, 0.045, 0.16], 1, '#b9773a', { shadeBottom: 0.85 });
      g.cyl(0, 0.09, -0.05, 0.045, 0.045, 0.006, 8, '#2e2420'); g.box(-0.026, 0.05, 0.2, 0.026, 0.085, 0.74, '#5a3a24'); g.box(-0.04, 0.05, 0.74, 0.04, 0.08, 0.86, '#7a5238');
      for (const zz of [-0.2, 0.5]) g.tube([[-0.24, 0, zz], [0, 0.11, zz], [0.24, 0, zz]], 0.007, 3, '#c9563c');
    } else {
      // a box of herb cuttings under a lamp of its own
      g.box(-0.34, 0, -0.13, 0.34, 0.1, 0.13, '#6f685b', { top: '#4a4038' });
      for (let i = 0; i < 16; i++) { const x = rng.f(-0.3, 0.3), zz = rng.f(-0.09, 0.09), h = rng.f(0.08, 0.2); g.tube([[x, 0.1, zz], [x + rng.f(-0.03, 0.03), 0.1 + h, zz + rng.f(-0.03, 0.03)]], 0.004, 3, '#6f9a4e'); g.blob(x, 0.11 + h, zz, [0.035, 0.025, 0.035], 0, rng.pick(['#7fae58', '#8fba62', '#6c9c4c']), { lump: 0.3, seed: i + 1 }); }
      for (const s of [-1, 1]) g.tube([[s * 0.32, 0.1, 0], [s * 0.32, 0.46, 0]], 0.008, 4, STEEL);
      g.box(-0.34, 0.45, -0.035, 0.34, 0.47, 0.035, '#ffe6f2', { emit: 3.5 });
      const lp = new Vector3(0, 0.42, 0).applyMatrix4(M);
      S.glows.push({ p: lp.toArray(), color: '#ffd0e8', power: 0.6, size: 0.5 });
      S.lattices.push({ origin: lp.toArray(), spacing: [1, 1], count: [1, 1], color: '#ffd8ec', power: 0.7, reach: 0.6 });
    }
    g.pop();
    if (S.due()) yield 'walls';
  }
  // pipes along the room, three to a run, in whatever was fitted when each last leaked
  for (const deg of [72, 108, 215, 322]) for (let i = 0; i < 3; i++) {
    const th = ((deg + i * 1.1) * Math.PI) / 180, r = R_IN - 0.035 - (i === 1 ? 0.03 : 0);
    g.tube([polar(r, th, ZA + 0.05), polar(r, th, ZB - 0.05)], i === 1 ? 0.02 : 0.013, 5, ['#b9773a', '#8f958c', '#7d8f9c'][(i + deg) % 3]);
    if (i === 1) for (let z = ZA + 0.75; z < ZB; z += 1.5) g.box(...polar(r - 0.04, th - 0.02, z - 0.03), ...polar(r + 0.03, th + 0.02, z + 0.03), '#6f685b');
  }
  yield 'pipes';
  // cloths and towels clipped to the rails, each standing out the way it was left
  for (let i = 0; i < 18; i++) {
    const deg = rng.pick([62, 152, 208, 298, 242, 118]), z = rng.f(-6.6, 6.6);
    if ((deg === 242 && z > 1) || (deg === 118 && z < 2.8)) continue;
    g.push(onWall((deg * Math.PI) / 180, z, R_IN - 0.12, rng.f(0, TAU)));
    g.rot('x', rng.f(-0.6, 0.6));
    const w = rng.f(0.13, 0.24), h = rng.f(0.28, 0.52);
    g.box(-w, 0, -0.008, w, h, 0.008, rng.pick(CLOTH)); g.box(-w, h * 0.55, -0.0095, w, h * 0.7, 0.0095, rng.pick(PATCH)); g.box(-0.015, -0.02, -0.02, 0.015, 0.03, 0.02, WOOD2);
    g.pop(); g.pop();
  }
  yield 'pipes';
  // strings of small lamps, floating in whatever curve they were left in, and a ring of them round the way out
  const string = (a, b, c, n) => {
    const pts = [];
    for (let i = 0; i <= n; i++) { const u = i / n, v = 1 - u; pts.push([v * v * a[0] + 2 * u * v * b[0] + u * u * c[0], v * v * a[1] + 2 * u * v * b[1] + u * u * c[1], v * v * a[2] + 2 * u * v * b[2] + u * u * c[2]]); }
    g.tube(pts, 0.004, 3, '#3a332c');
    pts.forEach((p, i) => { if (i % 2) S.glows.push({ p, color: rng.pick(['#ffcf86', '#ffe2b0', '#ffc070', '#ffb0a0', '#c8f0d8', '#ffd27a']), power: 1.3, size: 0.07, twinkle: 0.15 }); });
  };
  string([-3.2, 1.3, -7.0], [-1.7, 3.3, -0.5], [-3.1, 1.7, 6.9], 60);
  yield 'strings';
  string([3.1, -1.4, -6.9], [2.2, -3.1, 0.5], [3.2, -1.3, 6.9], 60);
  string([2.9, 1.6, 4.7], [2.6, 3.0, 6.2], [1.0, 3.2, 7.2], 16);
  yield 'strings';
  for (let i = 0; i < 22; i++) { const a = (i / 22) * TAU; S.glows.push({ p: [Math.cos(a) * 1.2, Math.sin(a) * 1.2, ZB - 0.05], color: i % 3 ? '#ffd9a0' : '#ffb890', power: 1.5, size: 0.08, twinkle: 0.12 }); }
  g.push(onEnd(ZB, 0, 0)); g.lathe(0, 0, 0, [[1.19, 0], [1.2, 0.02], [1.21, 0]], 22, '#3a332c'); g.pop();
  yield 'strings';
  // washing on a line: socks and shirts, standing out from their pegs every which way
  const la = new Vector3(-2.7, 2.1, 3.3), lb = new Vector3(-0.5, 3.3, 6.9);
  g.tube([la, lb], 0.004, 3, '#e9e2d0');
  for (let i = 1; i < 9; i++) {
    const p = la.clone().lerp(lb, i / 9), shirt = i % 3 === 0, c = rng.pick(CLOTH);
    g.push(new Matrix4().makeRotationFromEuler(_eu.set(rng.f(-0.7, 0.7), rng.f(0, 6), rng.f(-0.7, 0.7))).setPosition(p.x, p.y, p.z));
    if (shirt) { g.box(-0.2, -0.5, -0.012, 0.2, 0, 0.012, c); g.box(-0.42, -0.2, -0.012, -0.2, -0.02, 0.012, c); g.box(0.2, -0.2, -0.012, 0.42, -0.02, 0.012, c); }
    else { g.box(-0.04, -0.22, -0.01, 0.04, 0, 0.01, c); g.box(-0.04, -0.26, -0.01, 0.1, -0.2, 0.01, c); }
    g.box(-0.012, -0.03, -0.02, 0.012, 0.02, 0.02, WOOD2);
    g.pop();
  }
  yield 'washing';
  // crumbs and drops adrift, catching the lamps
  const nc = Math.round(90 * clamp(S.ctx.density, 0.5, 1.3));
  for (let i = 0; i < nc; i++) {
    const a = rng.f(0, TAU), r = 2.6 * Math.sqrt(rng());
    S.glows.push({ p: [r * Math.cos(a), r * Math.sin(a), rng.f(-7, 7)], color: rng.pick(['#ffe2b0', '#ffd08a', '#fff0d8']), power: rng.f(0.35, 0.8), size: rng.f(0.008, 0.02), move: [rng.f(-0.03, 0.03), rng.f(-0.03, 0.03), rng.f(-0.03, 0.03)], loop: rng.f(10, 18), twinkle: 0.4 });
  }
  yield 'walls';
}

// ---------------------------------------------------------------- people
// Riders are jointed: a trunk, a head, and four limbs of two bones each. Every part is one copy among many of a
// shared shape, so the whole room of them is about a dozen draw calls. A limb is told where its hand or foot should
// be and finds its own elbow or knee. The body's own metres: the pelvis at the origin, +y to the head, +z the way
// it faces, +x to its left.
const ARM = [0.29, 0.26], LEG = [0.43, 0.41], SH = [0.19, 0.46, 0], HIP = [0.09, -0.06, 0];
function riderGeos() {
  const limb = (len, r0, r1) => { const g = new Geo(); g.tint(1).cyl(0, -len, 0, r1, r0, len, 6, '#ffffff', { smooth: false, base: true }); return g.build(); };
  const t = new Geo();
  t.tint(1).cyl(0, -0.02, 0, 0.15, 0.17, 0.26, 7, '#ffffff', { smooth: false, squash: [1, 0.62], cap: false });
  t.cyl(0, 0.24, 0, 0.17, 0.215, 0.2, 7, '#ffffff', { smooth: false, squash: [1, 0.6], cap: false });
  t.cyl(0, 0.44, 0, 0.215, 0.09, 0.075, 7, '#ffffff', { smooth: false, squash: [1, 0.62] });
  const h = new Geo(); h.tint(1).cyl(0, -0.16, 0, 0.14, 0.158, 0.17, 7, '#ffffff', { smooth: false, squash: [1, 0.68], base: true });
  const hd = new Geo();
  hd.tint(1).cyl(0, -0.01, 0, 0.05, 0.045, 0.09, 6, '#ffffff', { cap: false });
  hd.blob(0, 0.185, 0.012, [0.097, 0.12, 0.108], 1, '#ffffff', { shadeBottom: 0.82 });
  hd.blob(0, 0.165, 0.112, [0.017, 0.022, 0.02], 0, '#f4f0ea', { shadeBottom: 0.8 });
  hd.tint(0); for (const s of [-1, 1]) hd.box(s * 0.043 - 0.008, 0.186, 0.1, s * 0.043 + 0.008, 0.198, 0.109, '#2a2420');
  const hair = {};
  let g = new Geo(); g.tint(1).blob(0, 0.238, -0.04, [0.108, 0.092, 0.108], 1, '#ffffff', { lump: 0.08, seed: 2, shadeBottom: 0.75 }); hair.short = g.build();
  g = new Geo(); g.tint(1).blob(0, 0.285, -0.09, [0.16, 0.135, 0.15], 1, '#ffffff', { lump: 0.25, seed: 4, shadeBottom: 0.7 }); hair.float = g.build();
  g = new Geo(); g.tint(1).blob(0, 0.238, -0.04, [0.108, 0.092, 0.108], 1, '#ffffff', { lump: 0.08, seed: 6, shadeBottom: 0.75 });
  g.tube([[0, 0.26, -0.1], [0.02, 0.37, -0.2], [0.07, 0.44, -0.32], [0.06, 0.46, -0.45]], (u) => 0.04 - 0.027 * u, 5, '#ffffff'); hair.tail = g.build();
  const hand = new Geo(); hand.tint(1).blob(0, -0.05, 0, [0.036, 0.055, 0.03], 0, '#ffffff', { shadeBottom: 0.85 });
  const foot = new Geo(); foot.tint(1).box(-0.042, -0.075, -0.06, 0.042, 0, 0.17, '#ffffff');
  // what a hand may hold: chopsticks, chopsticks with a catch of noodle, a spoon, a sprig of something green
  const sticks = (noodle) => {
    const s = new Geo();
    s.tube([[0.012, -0.03, 0], [0.03, -0.3, 0.004]], 0.0045, 4, WOOD2); s.tube([[-0.012, -0.03, 0], [-0.004, -0.3, -0.004]], 0.0045, 4, WOOD2);
    if (noodle) { const pts = []; for (let i = 0; i <= 22; i++) { const u = i / 22; pts.push([0.013 + 0.11 * u * Math.sin(u * 7), -0.29 - 0.5 * u * (0.6 + 0.4 * Math.cos(u * 3)), 0.14 * u * Math.cos(u * 6.2) - 0.02 * u]); } s.tube(pts, 0.0048, 4, NOODLE); }
    return s.build();
  };
  const spoon = new Geo(); spoon.box(-0.007, -0.2, -0.004, 0.007, -0.03, 0.004, WOOD2); spoon.blob(0, -0.225, 0, [0.021, 0.03, 0.009], 0, WOOD2);
  const sprig = new Geo(); sprig.tube([[0, -0.03, 0], [0, -0.17, 0.01]], 0.004, 3, '#6f9a4e');
  for (let i = 0; i < 6; i++) sprig.blob(Math.sin(i * 2.4) * 0.03, -0.09 - i * 0.02, Math.cos(i * 2.4) * 0.03, [0.03, 0.016, 0.03], 0, i % 2 ? '#7fae58' : '#8fba62', { lump: 0.3, seed: i + 1 });
  return { torso: t.build(), hips: h.build(), head: hd.build(), hair, uarm: limb(ARM[0], 0.056, 0.046), farm: limb(ARM[1], 0.047, 0.036), hand: hand.build(), thigh: limb(LEG[0], 0.08, 0.06), shin: limb(LEG[1], 0.058, 0.042), foot: foot.build(),
    hold: { sticks: sticks(false), catch: sticks(true), spoon: spoon.build(), sprig: sprig.build(), bulb: bulbGeo() } };
}

const DOWN = new Vector3(0, -1, 0);
const _n = new Vector3(), _pl = new Vector3(), _d = new Vector3();
// two bones, a and b long, from J toward T, bending toward pole: writes the middle joint to E, where the end got to
// back into T, and the turn of each bone (from hanging straight down) to qa and qb
function reach(J, T, a, b, pole, E, qa, qb) {
  _n.subVectors(T, J);
  let d = _n.length();
  if (d < 1e-4) { _n.set(0, -1, 0); d = 1e-4; } else _n.divideScalar(d);
  d = clamp(d, Math.abs(a - b) + 0.02, a + b - 0.004);
  const x = (a * a - b * b + d * d) / (2 * d), h = Math.sqrt(Math.max(a * a - x * x, 0));
  _pl.copy(pole).addScaledVector(_n, -pole.dot(_n));
  if (_pl.lengthSq() < 1e-6) _pl.set(0.3, 0.2, 1).addScaledVector(_n, -_pl.dot(_n));
  _pl.normalize();
  E.copy(J).addScaledVector(_n, x).addScaledVector(_pl, h);
  T.copy(J).addScaledVector(_n, d);
  qa.setFromUnitVectors(DOWN, _d.subVectors(E, J).normalize());
  qb.setFromUnitVectors(DOWN, _d.subVectors(T, E).normalize());
}

/**
 * The people in the room. cast: [{ at, up, fwd (where the pelvis is, and which way the body's up and front point, in
 * the room's metres), skin, top, legs, socks, sleeve, hair: [style, colour], scale, hold: [left, right] (what each
 * hand holds), prog(t, P, me) }]. Each frame a rider's prog may move P.pos and P.quat and set P.hand[k] / P.foot[k]
 * (k: 0 left, 1 right) in the body's own metres, or in the room's with P.handW[k] / P.footW[k] = true, and P.look.
 * Returns tick(t). After it, me.hp[k] is where each hand got to.
 */
function makeFolk(S, cast) {
  const GE = riderGeos(), n = cast.length, mat = S.prop, twice = (f) => { const a = []; for (const r of cast) { const c = f(r); a.push(c, c); } return a; };
  const M = {
    torso: copies(GE.torso, mat, n, cast.map((r) => r.top)), hips: copies(GE.hips, mat, n, cast.map((r) => r.legs)), head: copies(GE.head, mat, n, cast.map((r) => r.skin)),
    uarm: copies(GE.uarm, mat, 2 * n, twice((r) => r.top)), farm: copies(GE.farm, mat, 2 * n, twice((r) => r.sleeve || r.top)), hand: copies(GE.hand, mat, 2 * n, twice((r) => r.skin)),
    thigh: copies(GE.thigh, mat, 2 * n, twice((r) => r.legs)), shin: copies(GE.shin, mat, 2 * n, twice((r) => r.legs)), foot: copies(GE.foot, mat, 2 * n, twice((r) => r.socks)),
  };
  const hairs = {}, holds = {};
  cast.forEach((r, i) => {
    r.i = i; r.base = quatOf(v3(r.up), v3(r.fwd)); r.hp = [new Vector3(), new Vector3()]; r.hq = [new Quaternion(), new Quaternion()]; r.s = r.scale || 1;
    (hairs[r.hair[0]] = hairs[r.hair[0]] || []).push(r);
    (r.hold || []).forEach((what, k) => { if (what) (holds[what] = holds[what] || []).push([r, k]); });
  });
  for (const k in hairs) { hairs[k].mesh = copies(GE.hair[k], mat, hairs[k].length, hairs[k].map((r) => r.hair[1])); S.room.add(hairs[k].mesh); }
  for (const k in holds) { holds[k].mesh = copies(GE.hold[k], mat, holds[k].length, k === 'bulb' ? ['#e0a040', '#cf7a30', '#c2a850'] : null); S.room.add(holds[k].mesh); }
  for (const k in M) S.room.add(M[k]);
  const P = { pos: new Vector3(), quat: new Quaternion(), look: new Quaternion(), hand: [new Vector3(), new Vector3()], foot: [new Vector3(), new Vector3()], handW: [false, false], footW: [false, false] };
  const J = new Vector3(), T = new Vector3(), E = new Vector3(), qa = new Quaternion(), qb = new Quaternion(), qi = new Quaternion(), w = new Vector3(), q = new Quaternion(), sv = new Vector3(), pole = new Vector3(), m = new Matrix4(), toe = new Vector3(0, -0.3, 1);
  const put = (mesh, i, local, turn, s) => { w.copy(local).multiplyScalar(s).applyQuaternion(P.quat).add(P.pos); q.copy(P.quat); if (turn) q.multiply(turn); mesh.setMatrixAt(i, m.compose(w, q, sv.set(s, s, s))); };
  return (t, ft) => {
    for (let i = 0; i < n; i++) {
      const r = cast[i], s = r.s, ph = i * 1.7;
      P.pos.set(r.at[0], r.at[1], r.at[2]); P.quat.copy(r.base); P.look.set(0.06 * Math.sin(t * 0.5 + ph), 0.1 * Math.sin(t * 0.37 + ph * 2), 0, 1).normalize();
      for (let k = 0; k < 2; k++) {
        const sg = k ? -1 : 1;
        P.hand[k].set(sg * (0.2 + 0.02 * Math.sin(t * 0.6 + ph + k)), 0.3 + 0.025 * Math.sin(t * 0.8 + ph * 1.3 + k), 0.33); P.handW[k] = false;
        P.foot[k].set(sg * 0.11, -0.66 + 0.03 * Math.sin(t * 0.45 + ph + k * 2), 0.2 + 0.04 * Math.sin(t * 0.33 + ph * 0.7 + k)); P.footW[k] = false;
      }
      if (r.prog) r.prog(t, P, r, ft || 0);
      qi.copy(P.quat).invert();
      put(M.torso, i, J.set(0, 0, 0), null, s); put(M.hips, i, J, null, s);
      put(M.head, i, J.set(0, 0.5, 0), P.look, s);
      if (hairs[r.hair[0]]) put(hairs[r.hair[0]].mesh, hairs[r.hair[0]].indexOf(r), J, P.look, s);
      for (let k = 0; k < 2; k++) {
        const sg = k ? -1 : 1;
        // an arm
        J.set(sg * SH[0], SH[1], SH[2]); T.copy(P.hand[k]);
        if (P.handW[k]) T.sub(P.pos).applyQuaternion(qi).divideScalar(s);
        reach(J, T, ARM[0], ARM[1], pole.set(sg * 0.5, -0.7, -0.5), E, qa, qb);
        put(M.uarm, i * 2 + k, J, qa, s); put(M.farm, i * 2 + k, E, qb, s); put(M.hand, i * 2 + k, T, qb, s);
        r.hp[k].copy(w); r.hq[k].copy(q);
        // a leg, and a foot square to its shin
        J.set(sg * HIP[0], HIP[1], HIP[2]); T.copy(P.foot[k]);
        if (P.footW[k]) T.sub(P.pos).applyQuaternion(qi).divideScalar(s);
        reach(J, T, LEG[0], LEG[1], pole.set(sg * 0.15, 0.1, 1), E, qa, qb);
        put(M.thigh, i * 2 + k, J, qa, s); put(M.shin, i * 2 + k, E, qb, s);
        put(M.foot, i * 2 + k, T, quatOf(_d.subVectors(E, T), toe, qa), s);
      }
    }
    for (const k in M) M[k].instanceMatrix.needsUpdate = true;
    for (const k in hairs) hairs[k].mesh.instanceMatrix.needsUpdate = true;
    for (const k in holds) {
      holds[k].forEach(([r, hnd], j) => holds[k].mesh.setMatrixAt(j, m.compose(r.hp[hnd], r.hq[hnd], sv.set(r.s, r.s, r.s))));
      holds[k].mesh.instanceMatrix.needsUpdate = true;
    }
  };
}

// ---------------------------------------------------------------- who is in the room, and what they are doing
const LEGS = ['#3a3f48', '#4a4440', '#5a5650', '#2f3b45', '#6a5a48', '#4f5d52'], SOCKS = ['#c9563c', '#e2c14a', '#d7d2c4', '#3f8a7a', '#a34b86', '#e7e1d3', '#5b4b9a', '#d98c2b'];
const HAIRS = ['#2a2018', '#3a2a20', '#5a3a24', '#1e1a18', '#7a5a34', '#8a3a24', '#c9a25a'];
function outfit(rng) {
  return { skin: rng.pick(SKIN), top: rng.pick(CLOTH), legs: rng.pick(LEGS), socks: rng.pick(SOCKS), scale: rng.f(0.93, 1.05), hair: [rng.pick(['float', 'float', 'short', 'short', 'tail']), rng.pick(HAIRS)] };
}
const MARIT = { skin: '#d9a87c', top: '#2f5a6a', legs: '#3a3f48', socks: '#e2c14a', hair: ['tail', '#5a3a24'], scale: 1 };
const _wq = new Quaternion(), _w = new Vector3();
// nobody without weight is ever quite still
function sway(P, t, ph, a = 1) {
  P.quat.multiply(_wq.set(0.05 * a * Math.sin(t * 0.41 + ph), 0.06 * a * Math.sin(t * 0.33 + ph * 1.9), 0.05 * a * Math.sin(t * 0.27 + ph * 2.7), 1).normalize());
  P.pos.x += 0.04 * a * Math.sin(t * 0.3 + ph); P.pos.y += 0.04 * a * Math.sin(t * 0.24 + ph * 1.3); P.pos.z += 0.04 * a * Math.sin(t * 0.2 + ph * 2.1);
}
const grip = (P, k, p) => { P.hand[k].copy(p); P.handW[k] = true; };
const hook = (P, k, p) => { P.foot[k].copy(p); P.footW[k] = true; };
// a hand that talks
function talk(P, k, t, ph) { const sg = k ? -1 : 1; P.hand[k].set(sg * (0.26 + 0.1 * Math.sin(t * 1.1 + ph)), 0.36 + 0.12 * Math.sin(t * 1.4 + ph * 1.6), 0.34 + 0.1 * Math.cos(t * 0.9 + ph)); }
// a hand that comes up to the mouth now and then
function sip(P, k, t, ph) { const sg = k ? -1 : 1; P.hand[k].lerp(_w.set(sg * 0.03, 0.62, 0.17), smoothstep(0.5, 0.9, Math.sin(t * 0.5 + ph))); }
// a hand with chopsticks, after something that will not hold still
function poke(P, k, t, ph) {
  const sg = k ? -1 : 1, a = t * 0.7 + ph, snap = Math.pow(Math.max(Math.sin(t * 1.3 + ph * 2.3), 0), 5);
  P.hand[k].set(sg * (0.22 + 0.2 * Math.sin(a)), 0.44 + 0.2 * Math.sin(a * 1.31 + 1), 0.34 + 0.1 * Math.cos(a * 0.8) + 0.16 * snap);
}
const tuck = (P, d = 0.3) => { for (let k = 0; k < 2; k++) { P.foot[k].y += d; P.foot[k].z += d * 0.5; } };
const turnX = (P, a) => P.quat.multiply(_wq.setFromAxisAngle(_w.set(1, 0, 0), a));

// round the table: standing at it from either side, hooked on by the feet, or lying out from it like a flag
function atTable(c, rng, a, side, how, o) {
  const rad = TABLE.rim(a).sub(TABLE.c).normalize(), n = TABLE.n.clone().multiplyScalar(side), lean = rng.f(0.1, 0.35), ph = rng.f(0, 30), k = rng.chance(0.5) ? 0 : 1;
  if (how === 'flag') {
    const g0 = TABLE.rim(a - 0.15), g1 = TABLE.rim(a + 0.15);
    c.push({ at: TABLE.rim(a, 1.72, 0.08 * side).toArray(), up: rad.clone().negate().toArray(), fwd: n.toArray(), ...outfit(rng), ...o, prog(t, P) { sway(P, t, ph, 0.7); grip(P, 0, side > 0 ? g1 : g0); grip(P, 1, side > 0 ? g0 : g1); P.foot[0].z -= 0.1; P.foot[1].z += 0.12; } });
  } else if (how === 'feet') {
    const f0 = TABLE.rim(a - 0.11, 0.84, 0.03 * side), f1 = TABLE.rim(a + 0.11, 0.84, 0.03 * side);
    c.push({ at: TABLE.rim(a, 1.0, 0.6 * side).toArray(), up: n.clone().addScaledVector(rad, 0.35).toArray(), fwd: rad.clone().negate().toArray(), ...outfit(rng), hold: [null, 'bulb'], ...o, prog(t, P) { sway(P, t, ph, 0.8); hook(P, 0, side > 0 ? f1 : f0); hook(P, 1, side > 0 ? f0 : f1); talk(P, 0, t, ph); sip(P, 1, t, ph); } });
  } else {
    const g = TABLE.rim(a + (k ? 0.14 : -0.14) * side);
    c.push({ at: TABLE.rim(a, 1.08, -0.12 * side).toArray(), up: n.clone().multiplyScalar(Math.cos(lean)).addScaledVector(rad, Math.sin(lean)).toArray(), fwd: rad.clone().negate().toArray(), ...outfit(rng), hold: k ? ['bulb', null] : [null, 'bulb'], ...o,
      prog(t, P) { sway(P, t, ph, 0.6); grip(P, k, g); if (how === 'talk') talk(P, 1 - k, t, ph); sip(P, 1 - k, t, ph); } });
  }
}

// An ordinary evening, seven days out.
function castOut(S) {
  const rng = makeRng('seven-days-out'), c = [];
  const add = (at, up, fwd, prog, o = {}) => { c.push({ at, up, fwd, prog, ...outfit(rng), ...o }); return c[c.length - 1]; };
  atTable(c, rng, 0.15, 1, 'sip'); atTable(c, rng, 1.05, -1, 'talk'); atTable(c, rng, 1.9, 1, 'talk'); atTable(c, rng, -0.75, -1, 'sip'); atTable(c, rng, -1.6, 1, 'feet'); atTable(c, rng, 2.75, 1, 'flag');
  // one at the crank, a foot under the rail
  const potEdge = new Vector3(0.3, -2.5, 3.45), fr = [new Vector3(0.16, -3.4, 2.76), new Vector3(-0.12, -3.4, 2.76)];
  add([0.12, -2.93, 2.9], [0, 0.97, 0.24], [0, -0.24, 0.97], (t, P) => { grip(P, 0, potEdge); grip(P, 1, S.crankHand(t, _w)); hook(P, 0, fr[0]); hook(P, 1, fr[1]); P.pos.y += 0.02 * Math.sin(t * 1.9); });
  // Marit over the stockpot with a sprig of coriander: "three people asked what the green was"
  const lid = new Vector3(0.36, -2.47, 3.95), port = S.potTop.clone().add(new Vector3(0, 0.16, 0.03));
  add([0.55, -2.2, 4.42], [-0.15, 0.85, -0.5], [-0.25, -0.53, -0.81], (t, P) => { sway(P, t, 3, 0.4); grip(P, 0, lid); grip(P, 1, _w.copy(port).setY(port.y + 0.05 * Math.sin(t * 0.8))); P.foot[0].z -= 0.15; P.foot[1].z -= 0.3; }, { ...MARIT, hold: [null, 'sprig'] });
  // two at the window, one the other way up
  const sill = new Vector3(WIN.x - 0.16, -WIN.h - 0.16, 1.42), lintel = new Vector3(WIN.x - 0.16, WIN.h + 0.16, 3.22);
  add([2.86, -0.85, 0.9], [0.1, 0.3, 0.95], [0.95, 0.3, -0.1], (t, P) => { sway(P, t, 5, 0.5); grip(P, 0, sill); sip(P, 1, t, 2); }, { hold: [null, 'bulb'] });
  add([2.8, 0.92, 3.3], [0.05, -0.95, 0.3], [1, 0, 0.05], (t, P) => { sway(P, t, 8, 0.5); grip(P, 1, lintel); tuck(P, 0.2); });
  // the bungee hour: running on the end wall against two cords
  const run = add([0, 0, 0], [0, 0, 1], [1, 0, 0], (t, P, me) => {
    const f = t * 8.2;
    P.pos.set(0, 0.935 + 0.035 * Math.abs(Math.sin(f)), 0).applyMatrix4(S.pad.M);
    for (let k = 0; k < 2; k++) { const a = f + k * Math.PI, sg = k ? -1 : 1; P.foot[k].set(sg * 0.1, -0.87 + 0.17 * Math.max(0, Math.cos(a)), 0.2 * Math.sin(a) + 0.03); P.hand[k].set(sg * 0.21, 0.2 + 0.07 * Math.sin(a), 0.2 - 0.15 * Math.sin(a)); }
    me.pw.copy(P.pos);
  }, { top: '#d7d2c4', legs: '#2f3b45', socks: '#c9563c' });
  run.pw = new Vector3(); S.runner = run;
  // two at the shelf: one taking a spoon, one reading the tags from the other way up
  const crock = new Vector3(-3.1, 0.12, 3.47), rail = new Vector3(-3.3, 0.68, 3.82), rail2 = new Vector3(-3.3, 0.62, -3.6);
  add([-2.5, -0.45, 3.55], [0.25, 0.95, 0.15], [-1, 0.15, 0], (t, P) => { sway(P, t, 11, 0.4); grip(P, 0, rail); grip(P, 1, _w.copy(crock).setX(crock.x + 0.06 + 0.06 * Math.sin(t * 0.7))); }, { hold: [null, 'spoon'] });
  const bulb = new Vector3(), near = (P, k, at) => { if (tossAt(G.uTime.value, bulb).distanceTo(at) < 0.75) grip(P, k, bulb); };
  add([-2.72, 0.32, -3.9], [0.3, -0.9, 0.3], [0.9, -0.3, 0.3], (t, P) => { sway(P, t, 14, 0.4); grip(P, 1, rail2); talk(P, 0, t * 0.5, 4); near(P, 0, TOSS.a); });
  // the argument about broth
  add([-1.5, -1.3, -2.6], [0.2, 0.95, 0.25], [0.55, -0.1, -0.8], (t, P) => { sway(P, t, 17, 0.8); talk(P, 0, t, 1); sip(P, 1, t, 4); tuck(P, 0.12); }, { hold: [null, 'bulb'] });
  add([-0.85, -1.95, -3.45], [-0.35, -0.7, 0.6], [-0.6, 0.3, 0.75], (t, P) => { sway(P, t, 21, 0.8); talk(P, 1, t * 1.2, 6); talk(P, 0, t * 0.9, 2); }, { hold: ['bulb', null] });
  // two under way: one head over heels across the room, one gliding its length
  add([0, -1.0, -4.3], [0, 1, 0], [1, 0, 0], (t, P) => { P.pos.x = 2.2 * Math.sin(t * 0.26 + 1); turnX(P, t * 0.36); tuck(P, 0.34); P.hand[0].set(0.3, 0.2, 0.36); P.hand[1].set(-0.3, 0.2, 0.36); });
  add([1.55, 1.75, -2.4], [0, 0.2, 1], [0, -1, 0.2], (t, P) => { P.pos.z = -2.4 + 2.6 * Math.sin(t * 0.21); sway(P, t, 2, 0.5); P.hand[0].set(0.16, 0.92, 0.22); P.hand[1].set(-0.2, 0.3, 0.3); });
  // one curled up with a bulb, and one by the hatch to see us off
  add([1.95, -2.0, -0.7], [-0.5, 0.6, 0.6], [-0.6, 0.2, -0.75], (t, P) => { sway(P, t, 25, 0.6); tuck(P, 0.36); sip(P, 1, t, 9); near(P, 0, TOSS.b); }, { hold: [null, 'bulb'] });
  const handle = new Vector3(0.73, -0.73, ZB - 0.09);
  add([1.0, -0.95, 6.72], [0.3, 0.9, -0.3], [-0.7, 0.3, -0.65], (t, P) => { sway(P, t, 28, 0.6); grip(P, 0, handle); talk(P, 1, t * 0.6, 3); });
  return c;
}

// ---------------------------------------------------------------- outside: the trunk, the train, the hall
// Where the trunk's lengths join: short near the train, longer and longer toward its two vanishing points.
const ZN = [-9e5, -4e5, -1.5e5, -6e4, -2.5e4, -1e4, -4000, -1500, -600, -250, -100, -40, 0, 40, 100, 250, 600, 1500, 4000, 1e4, 2.5e4, 6e4, 1.5e5, 4e5, 9e5];
function ribbon(x, y, color, power, width) {
  const pos = [], lane = [], idx = [];
  ZN.forEach((z, i) => { for (const s of [-1, 1]) { pos.push(x, y, 0); lane.push(z, s); } if (i < ZN.length - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3)); g.setAttribute('aLane', new Float32BufferAttribute(lane, 2)); g.setIndex(idx);
  g.boundingSphere = new Sphere(new Vector3(), 1e9);
  const mesh = new Mesh(g, new ShaderMaterial({
    uniforms: { uClip: G.uClip, uPx: G.uPx, uMinPx: { value: 1.25 }, uWidth: { value: width }, uOff: { value: 0 }, uBlur: { value: 175 }, uPower: { value: power }, uColor: { value: vec3col(color) } },
    vertexShader: THREAD_VERT, fragmentShader: THREAD_FRAG, side: DoubleSide, transparent: true, depthWrite: false, blending: AdditiveBlending,
  }));
  mesh.frustumCulled = false; mesh.renderOrder = 8.5;
  return mesh;
}
// The trunk: a pipe of water tanks with a clear strip down the side the windows face. It is the same all the way
// along, so it stands still in a world that rides with the train. Returns { group, pane, threads }.
function* buildTrunk(ext) {
  const group = new Group(), g = new Geo(), N = 18, a0 = SLOT, da = (TAU - 2 * SLOT) / N, rng = makeRng('trunk');
  // every tank a little different from its neighbours round the pipe, and the same all the way along: at this speed
  // that is all there is to see of them
  const skin = [], bore = [];
  for (let k = 0; k < N; k++) { const s = rng.f(0.5, 1.0); skin.push([0.075 * s, 0.09 * s, 0.11 * s]); const b = rng.f(0.5, 1.2); bore.push([0.03 * b, 0.026 * b, 0.022 * b]); }
  for (let i = 0; i < ZN.length - 1; i++) {
    const za = ZN[i], zb = ZN[i + 1];
    for (let k = 0; k < N; k++) {
      const a = a0 + k * da, b = a + da;
      g.quad(polar(R_TRUNK, a, za), polar(R_TRUNK, b, za), polar(R_TRUNK, b, zb), polar(R_TRUNK, a, zb), skin[k]);
      g.quad(polar(BORE, a, za), polar(BORE, a, zb), polar(BORE, b, zb), polar(BORE, b, za), bore[k]);
    }
    for (const s of [-1, 1]) g.quad(polar(BORE, s * SLOT, za), polar(R_TRUNK, s * SLOT, za), polar(R_TRUNK, s * SLOT, zb), polar(BORE, s * SLOT, zb), '#2c343a');
    // the main trunk beside it: the same pipe, wider, with no glass
    for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU, b = a + TAU / 12, p = (th, z) => [-320 + 13 * Math.cos(th), 46 + 13 * Math.sin(th), z]; g.quad(p(a, za), p(b, za), p(b, zb), p(a, zb), skin[k]); }
    yield 'trunk';
  }
  const mesh = g.mesh(ext); mesh.frustumCulled = false;
  group.add(mesh);
  // the water in the clear strip: one pane on its outer face
  const pos = [], idx = [], M = 6;
  ZN.forEach((z) => { for (let k = 0; k <= M; k++) { const a = -SLOT + (k / M) * 2 * SLOT; pos.push(R_TRUNK * Math.cos(a), R_TRUNK * Math.sin(a), z); } });
  for (let i = 0; i < ZN.length - 1; i++) for (let k = 0; k < M; k++) { const a = i * (M + 1) + k, b = a + M + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const pg = new BufferGeometry();
  pg.setAttribute('position', new Float32BufferAttribute(pos, 3)); pg.setIndex(idx); pg.boundingSphere = new Sphere(new Vector3(), 1e9);
  const pane = new Mesh(pg, waterMaterial(WATER));
  pane.frustumCulled = false; pane.renderOrder = 9.5;
  group.add(pane);
  // and what the hall's lights do on its face, seen at a slant
  const sheen = new Mesh(pg, new ShaderMaterial({
    uniforms: { uClip: G.uClip, uColor: { value: vec3col('#ffc890', 0.03) } }, vertexShader: SHEEN_VERT, fragmentShader: SHEEN_FRAG,
    side: DoubleSide, transparent: true, depthWrite: false, blending: AdditiveBlending,
  }));
  sheen.frustumCulled = false; sheen.renderOrder = 9.6;
  group.add(sheen);
  const edge = (s) => ribbon(Math.cos(s * SLOT) * (R_TRUNK + 0.15), Math.sin(s * SLOT) * (R_TRUNK + 0.15), '#ffd9a8', 0.55, 0.5);
  const threads = [ribbon(Math.cos(0.9) * (R_TRUNK + 0.5), Math.sin(0.9) * (R_TRUNK + 0.5), '#a8ccff', 1.5, 1.6), edge(1), edge(-1), ribbon(-320 + 13.6, 46, '#ffe9c8', 1.6, 1.8), ribbon(-320, 46 + 13.6, '#ffe9c8', 1.2, 1.8)];
  for (const t of threads) group.add(t);
  yield 'trunk';
  return { group, pane, threads };
}

// The train from outside: twelve round cars, their small lit windows on the strip's side, and the galley's hull with
// the long window cut in it. Returns its lamps as well: far lights, so they hold up when the train is kilometres off.
function* buildTrain(ext) {
  const g = new Geo(), rng = makeRng('slow-train'), lights = farLights({ minPx: 1.3, maxPx: 40, spin: 0, reach: 9e9, capacity: 512 });
  const paint = ['#5f6a66', '#6a6258', '#59626e', '#6e6a5a', '#5a5f58', '#66605c'];
  let t0 = performance.now();
  for (let k = CARS[0]; k <= CARS[1]; k++) {
    const zc = k * CAR, za = zc - 11, zb = zc + 11, col = paint[((k % 6) + 6) % 6], n = k === 0 ? NSEG : 16;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, b = a + TAU / n;
      const strip = (z0, z1) => g.quad(polar(R_HULL, a, z0), polar(R_HULL, b, z0), polar(R_HULL, b, z1), polar(R_HULL, a, z1), rng.chance(0.12) ? rng.pick(paint) : col);
      if (k === 0 && (i === 0 || i === n - 1)) { strip(za, WIN.z0); strip(WIN.z1, zb); } else { strip(za, zc - 3.7); strip(zc - 3.7, zc + 3.7); strip(zc + 3.7, zb); }
      g.tri([0, 0, za], polar(R_HULL, b, za), polar(R_HULL, a, za), DARK); g.tri([0, 0, zb], polar(R_HULL, a, zb), polar(R_HULL, b, zb), DARK);
      if (performance.now() - t0 > 4) { yield 'cars'; t0 = performance.now(); }
    }
    // the line's livery: two cream stripes along the window side of every car, as much as is left of them
    for (const th of [-0.4, 0.4]) for (let z = za + 0.6; z < zb - 0.7; z += 2.6) if (!rng.chance(0.14)) g.quad(polar(R_HULL + 0.015, th - 0.022, z), polar(R_HULL + 0.015, th + 0.022, z), polar(R_HULL + 0.015, th + 0.022, z + 2.5), polar(R_HULL + 0.015, th - 0.022, z + 2.5), rng.pick(['#cdbd9e', '#c2b190', '#b9ad92']));
    if (k < CARS[1]) g.tube([[0, 0, zb], [0, 0, zb + CAR - 22]], 1.3, 10, '#3f444b');
    for (const z of [za + 0.4, zb - 0.4]) g.tube([[0, 0, z - 0.25], [0, 0, z + 0.25]], R_HULL + 0.06, n, '#4a4f55');
    // a sleeper's windows: two rows of eight, most of them lit, in whatever colour the lamp behind them is
    if (k !== 0) for (const th of [-0.2, 0.2]) for (let j = 0; j < 8; j++) {
      const z = zc - 8.4 + j * 2.4, lit = rng.chance(0.72), c = rng.pick(['#ffd9a0', '#ffcf8a', '#ffe6c0', '#ffc070', '#e6ecff']);
      const r = R_HULL + 0.012, h = 0.085;
      g.quad(polar(r, th - h, z - 0.38), polar(r, th + h, z - 0.38), polar(r, th + h, z + 0.38), polar(r, th - h, z + 0.38), lit ? c : '#20242a', lit ? rng.f(2, 3.6) : 0);
      if (lit) lights.add(R_HULL + 0.3, Math.sin(th) * R_HULL, z, c, rng.f(1.6, 3), 0.75);
    }
    yield 'cars';
  }
  for (const s of [-1, 1]) { lights.add(s * 2.2, 0, CARS[1] * CAR + 11.4, '#fff2d8', 9, 0.9); lights.add(s * 2.2, 0, CARS[0] * CAR - 11.4, '#ff5030', 7, 0.8); }
  // the train's own light on the bore round it: a sleeve of glow that goes where the train goes
  // (the bore goes by at two kilometres a second, so whatever is on it is drawn out into lines along it)
  const z0 = CARS[0] * CAR - 70, z1 = CARS[1] * CAR + 70, NS = 14, NA = 40, da = (TAU - 2 * SLOT) / NA, streak = [];
  for (let k = 0; k < NA; k++) streak.push(rng.chance(0.2) ? rng.f(1.3, 2.2) : rng.f(0.25, 1.0));
  for (let i = 0; i < NS; i++) {
    const za = z0 + ((z1 - z0) * i) / NS, zb = z0 + ((z1 - z0) * (i + 1)) / NS, e = 0.7 * Math.pow(Math.sin((Math.PI * (i + 0.5)) / NS), 0.7);
    for (let k = 0; k < NA; k++) { const a = SLOT + k * da, b = a + da; g.quad(polar(BORE - 0.1, a, za), polar(BORE - 0.1, a, zb), polar(BORE - 0.1, b, zb), polar(BORE - 0.1, b, za), k % 3 ? '#8a6a4a' : '#7a6652', e * streak[k]); }
    if (i % 4 === 3) yield 'cars';
  }
  yield 'cars';
  // the galley's own window, for when the train is too far off for the room to show: put out as the camera comes near
  const own = farLights({ minPx: 1.3, maxPx: 40, spin: 0, reach: 9e9, capacity: 8 });
  for (let z = -3.6; z <= 3.61; z += 1.2) own.add(R_HULL + 0.3, 0, z, '#ffd9a0', 1.7, 0.9);
  const mesh = g.mesh(ext); mesh.frustumCulled = false;
  return { mesh, lights: lights.mesh(), own: own.mesh() };
}

// ---------------------------------------------------------------- the two flights
const UP = [0, 1, 0];
const rollUp = (deg) => [-Math.sin((deg * Math.PI) / 180), Math.cos((deg * Math.PI) / 180), 0];
// Leg 1: keeping pace with the train from behind and to the window's side, up to the galley's first pane, in through
// the water and the glass, along the shelf, round to the stockpot, and out by the hatch.
function flightOut() {
  const keys = [
    { t: 0, p: [118, 52, -372], look: [86, 38, -222], up: UP, fov: 56 },
    { t: 6, p: [84, 37, -212], look: [10, 4, -40], up: UP, fov: 56 },
    { t: 11, p: [47, 18, -88], look: [4, 0.5, -10], up: UP, fov: 56 },
    { t: 14.5, p: [25, 6, -30], look: [3.5, 0, -4], up: UP, fov: 58 },
    { t: 17, p: [13.2, 1.0, -8.5], look: [3.4, 0.1, -3.0], up: UP, fov: 60 },
    { t: 19, p: [8.0, 0.3, -4.2], look: [0, 0.1, -2.6], up: UP, fov: 62 },
    { t: 20.6, p: [4.4, 0.15, -3.1], look: [-3.3, 0.2, -2.4], up: UP, fov: 64 },
    { t: 22.5, p: [2.3, 0.1, -2.8], look: [-3.3, 0.1, -3.4], up: rollUp(0), fov: 66 },
    { t: 27.5, p: [-0.3, -0.05, -2.2], look: [-3.3, 0.3, 0.6], up: rollUp(8), fov: 66 },
    { t: 31, p: [-1.55, 0, -0.6], look: [-3.3, 0.2, 2.4], up: rollUp(18), fov: 66 },          // close along the shelf
    { t: 37, p: [-1.2, -0.25, 1.0], look: [2.6, 0.2, 3.6], up: rollUp(36), fov: 66 },         // across to the window and who is at it
    { t: 42, p: [-0.7, -0.7, 2.5], look: [0.2, -2.7, 4.2], up: rollUp(66), fov: 66 },         // the stockpot
    { t: 47.5, p: [-0.5, -0.2, 4.4], look: [0.2, -0.3, 7.4], up: rollUp(100), fov: 64 },
    { t: 53.7, p: [0, 0, 6.85], look: [0, 0, 9.6], up: rollUp(130), fov: 62 },
    { t: 54.5, p: [0, 0, 7.42], look: [0, 0, 10.2], up: rollUp(130), fov: 62 },
    { t: 55.3, p: [0, 0, 7.97], look: [0, 0, 10.8], up: rollUp(130), fov: 62 },
  ];
  // (nearIn is what the engine is told, and what the lens comes down to at the opening; nearRoom is how near it sees
  // in the room, where nothing is let closer to it than that)
  return { keys, opts: { up: UP, entryRadius: 28, exitRadius: 0.6, align: 1.8 }, nearIn: 0.25, nearRoom: 0.5, nearOut: 2.5, T1: 1e9, signUp: rollUp(130) };
}
// Leg 11: in at the back end of the room, past Marit, along the long strand while turning right over, out through the
// third pane, and then left behind.
function flightHome() {
  const ey = new Vector3(0, 1, 0), ex = new Vector3().crossVectors(ey, HERO.ax).normalize();
  const keys = [
    { t: 0, p: [0.25, -0.35, -5.9], look: [0.75, -0.3, -3.5], up: UP, fov: 66 },
    { t: 7, p: [0.75, -0.3, -3.5], look: [-0.9, 0.2, -1.1], up: UP, fov: 66 },
  ];
  // once round the long strand, from under it and back to under it, looking along it: the strand keeps its place in
  // the picture and the room goes round
  for (let i = 0; i <= 8; i++) {
    const t = 13.5 + i * 2.25, psi = -Math.PI / 2 + (i / 8) * TAU, s = -2.1 + i * 0.34, h = heroAt(t), off = ex.clone().multiplyScalar(Math.cos(psi)).addScaledVector(ey, Math.sin(psi));
    keys.push({ t, p: h.clone().addScaledVector(HERO.ax, s).addScaledVector(off, 0.76).toArray(), look: h.clone().addScaledVector(HERO.ax, s + 1.8).addScaledVector(off, 0.2).toArray(), up: off.clone().negate().toArray(), fov: 66 });
  }
  keys.push(
    { t: 35, p: [2.3, -0.35, 2.75], look: [4.6, 0.1, 3.7], up: UP, fov: 66 },          // the strand's head at the glass, and who is after it
    { t: 38.4, p: [2.95, -0.05, 3.0], look: [7, 0.2, 3.3], up: UP, fov: 64 },
    { t: 39.8, p: [3.6, 0, 3.05], look: [9, 0.2, 3.4], up: UP, fov: 62 },
    { t: 40.8, p: [4.7, 0, 3.1], look: [12, 0.4, 3.8], up: UP, fov: 62 },
    { t: 43.4, p: [8.4, 0.15, 3.4], look: [16, 1, 7], up: UP, fov: 60 },
    { t: 45.6, p: [12.8, 0.6, 4.4], look: [21, 3, 32], up: UP, fov: 58 },
    { t: 48.4, p: [22, 5, 16], look: [46, 12, 120], up: UP, fov: 56 },
    { t: 52.2, p: [42, 13, 66], look: [80, 26, 200], up: UP, fov: 56 },
    { t: 57.6, p: [83, 27.5, 210], look: [118, 40, 334], up: UP, fov: 56 },
    { t: 58.4, p: [89, 29.6, 231.1], look: [124, 42, 355], up: UP, fov: 56 },
  );
  return { keys, opts: { up: UP, entryRadius: 1.0, exitRadius: 24, align: 1.8 }, nearIn: 0.25, nearRoom: 0.25, nearOut: 2.0, T1: 45.6, signUp: rollUp(130) };
}

// ---------------------------------------------------------------- the night of the noodle lesson
// "Do not pull noodles at zero g. They don't hang, they swim. The galley is full of loose noodle, the riders are
// catching it with chopsticks." The long strand the camera follows drifts from the middle of the room to the window.
const HERO = { a: new Vector3(0.7, -0.15, -0.2), b: new Vector3(1.9, -0.05, 2.2), ax: new Vector3(0.25, 0, 0.97).normalize(), len: 5, t0: 12, t1: 36 };
const heroAt = (t, out = new Vector3()) => out.copy(HERO.a).lerp(HERO.b, clamp((t - HERO.t0) / (HERO.t1 - HERO.t0), 0, 1));
function castHome(S) {
  const rng = makeRng('noodle-night'), c = [];
  const add = (at, up, fwd, prog, o = {}) => { c.push({ at, up, fwd, prog, ...outfit(rng), ...o }); return c[c.length - 1]; };
  const R = 'sticks', N = 'catch';
  // Marit in the middle of it, a strand between her hands, flour to the elbow
  S.marit = add([-1.35, 0.3, -1.0], [0.12, 0.96, -0.25], [0.52, -0.17, -0.84], (t, P) => {
    sway(P, t, 3, 0.5);
    for (let k = 0; k < 2; k++) P.hand[k].set((k ? -1 : 1) * (0.47 + 0.15 * Math.sin(t * 0.5)), 0.4 + 0.08 * Math.sin(t * 0.37 + k * 2), 0.3 + 0.05 * Math.sin(t * 0.61 + k));
  }, { ...MARIT, sleeve: '#f4f0e8' });
  // catchers, at every angle
  const catcher = (at, up, fwd, k, ph, o = {}) => add(at, up, fwd, (t, P) => { sway(P, t, ph, 0.9); poke(P, k, t, ph); if (o.spin) turnX(P, t * o.spin); if (o.curl) tuck(P, o.curl); }, { hold: k ? [null, o.got ? N : R] : [o.got ? N : R, null], ...o });
  catcher([-1.9, 0.9, -3.6], [0.3, -0.4, 0.86], [0.8, -0.5, 0.3], 1, 1);
  catcher([1.9, -1.45, -3.9], [-0.5, 0.8, 0.25], [-0.6, 0.3, 0.75], 0, 5, { got: 1 });
  catcher([1.55, 1.35, -2.4], [0.2, -0.9, 0.4], [-0.6, -0.4, 0.5], 1, 9);
  catcher([-0.3, 0.75, -3.6], [0, 1, 0], [0.3, 0, -0.95], 1, 13, { spin: 0.3, curl: 0.3, got: 1 });
  catcher([-1.5, -1.75, -0.3], [0.4, 0.8, -0.45], [0.6, 0.3, 0.75], 0, 17);
  catcher([-1.9, -1.2, 3.0], [0.5, 0.6, 0.6], [0.8, 0.2, -0.55], 1, 21, { got: 1 });
  catcher([0.6, -1.15, 6.3], [0.3, 0.9, -0.3], [-0.3, 0.2, -0.93], 0, 25, { got: 1 });
  catcher([-1.3, 1.6, 5.2], [0.6, -0.6, 0.5], [0.2, -0.5, -0.85], 1, 29);
  catcher([2.75, -1.0, -1.2], [0.1, 0.5, 0.86], [-0.9, 0.2, 0.3], 0, 33, { curl: 0.2 });
  // one at the shelf with a hand on its rail, one hanging by the feet from the rail overhead
  const rail = new Vector3(-3.3, 0.68, 1.15), over = [new Vector3(1.63, 2.94, 0.9), new Vector3(1.63, 2.94, 1.12)];
  add([-2.35, 0.5, 0.9], [0.2, 0.95, 0.2], [1, 0, 0.2], (t, P) => { sway(P, t, 37, 0.4); grip(P, 0, rail); poke(P, 1, t, 2); }, { hold: [null, R] });
  add([1.36, 2.28, 1.0], [-0.25, -0.95, 0.15], [0.1, 0.1, -1], (t, P) => { sway(P, t, 41, 0.5); hook(P, 0, over[0]); hook(P, 1, over[1]); poke(P, 0, t, 6); poke(P, 1, t * 0.8, 11); }, { hold: [N, null] });
  // two at the table, on the side away from the long strand's way
  for (const a of [2.1, 3.4]) {
    const rad = TABLE.rim(a).sub(TABLE.c).normalize(), g = TABLE.rim(a - 0.14), ph = a * 7;
    add(TABLE.rim(a, 1.08, -0.12).toArray(), TABLE.n.clone().addScaledVector(rad, 0.25).toArray(), rad.clone().negate().toArray(), (t, P) => { sway(P, t, ph, 0.6); grip(P, 0, g); poke(P, 1, t, ph); }, { hold: [null, a > 3 ? N : R] });
  }
  // the one at the window who gets the long strand in the end
  const lintel = new Vector3(WIN.x - 0.16, WIN.h + 0.16, 4.15), head = new Vector3();
  add([2.72, 0.98, 4.28], [0.05, -0.97, -0.2], [0.3, 0, -0.95], (t, P, me, ft) => {
    sway(P, t, 45, 0.4); grip(P, 0, lintel); poke(P, 1, t, 4);
    const got = smoothstep(27, 33, ft);
    if (got > 0) { heroAt(ft, head).addScaledVector(HERO.ax, HERO.len * 0.4); P.hand[1].applyQuaternion(P.quat).add(P.pos).lerp(head, got * 0.85); P.handW[1] = true; }
  }, { hold: [null, R] });
  // and the stockpot is still being turned
  const potEdge = new Vector3(0.3, -2.5, 3.45), fr = [new Vector3(0.16, -3.4, 2.76), new Vector3(-0.12, -3.4, 2.76)];
  add([0.12, -2.93, 2.9], [0, 0.97, 0.24], [0, -0.24, 0.97], (t, P) => { grip(P, 0, potEdge); grip(P, 1, S.crankHand(t, _w)); hook(P, 0, fr[0]); hook(P, 1, fr[1]); P.look.set(0.1, 0.55, 0, 0.83).normalize(); });
  return c;
}

function* buildNoodles(S) {
  const rng = makeRng('loose-noodle'), n = Math.round(170 * clamp(S.ctx.density, 0.5, 1.3));
  const buf = () => ({ pos: [], ax: [], st: [], rnd: [], idx: [] });
  const strand = (b, home, axis, L, width) => {
    const segs = Math.max(6, Math.round(L / 0.07)), base = b.pos.length / 3, r4 = [rng(), rng(), rng(), rng()];
    for (let i = 0; i <= segs; i++) for (const side of [-1, 1]) { b.pos.push(home[0], home[1], home[2]); b.ax.push(axis.x, axis.y, axis.z); b.st.push((i / segs - 0.5) * L, side, L, width); b.rnd.push(r4[0], r4[1], r4[2], r4[3]); }
    for (let i = 0; i < segs; i++) { const a = base + i * 2; b.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  };
  const mesh = (b, defines, glow) => {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(b.pos, 3)); g.setAttribute('aAx', new Float32BufferAttribute(b.ax, 3));
    g.setAttribute('aSt', new Float32BufferAttribute(b.st, 4)); g.setAttribute('aRnd', new Float32BufferAttribute(b.rnd, 4)); g.setIndex(b.idx);
    g.boundingSphere = new Sphere(new Vector3(), 14);
    const m = new Mesh(g, new ShaderMaterial({
      uniforms: { ...S.rig.uniforms, uClip: G.uClip, uTime: G.uTime, uPx: G.uPx, uMinPx: { value: 1.3 }, uSwim: { value: 1 }, uShift: { value: new Vector3() }, uA: { value: new Vector3() }, uB: { value: new Vector3(1, 0, 0) }, uCol: { value: vec3col(NOODLE) }, uGlow: { value: glow } },
      defines, vertexShader: NOODLE_VERT, fragmentShader: noodleFrag(S.rig), side: DoubleSide, transparent: true, depthWrite: false, blending: NormalBlending,
    }));
    m.frustumCulled = false; m.renderOrder = 11;
    S.room.add(m);
    return m;
  };
  // loose strands through the whole room, thickest round the middle where they were let go
  const loose = buf(), mid = S.marit.at;
  for (let i = 0, tries = 0; i < n && tries < 4000; tries++) {
    const near = rng.chance(0.35), a = rng.f(0, TAU), r = 2.45 * Math.sqrt(rng());
    const home = near ? [mid[0] + rng.gauss() * 0.9, mid[1] + rng.gauss() * 0.8, mid[2] + rng.gauss() * 1.3] : [r * Math.cos(a), r * Math.sin(a), rng.f(-6.6, 6.6)];
    if (Math.hypot(home[0], home[1]) > 2.5 || Math.abs(home[2]) > 6.7 || !S.clear(home, 0.5)) continue;
    const long = rng.chance(0.16), L = long ? rng.f(1.8, 3.6) : rng.f(0.25, 1.5);
    const axis = long ? new Vector3(rng.f(-0.45, 0.45), rng.f(-0.45, 0.45), rng.sign()).normalize() : new Vector3(rng.gauss(), rng.gauss(), rng.gauss()).normalize();
    strand(loose, home, axis, L, rng.f(0.0065, 0.009)); i++;
    if (S.due()) yield 'noodles';
  }
  mesh(loose, {}, 0.1);
  yield 'noodles';
  // the long one the camera follows, and two shorter that keep it company
  const hero = buf();
  strand(hero, [0, 0, 0], HERO.ax, HERO.len, 0.0095); strand(hero, [0.1, -0.22, -0.8], HERO.ax, 2.2, 0.008); strand(hero, [-0.18, 0.2, 1.1], HERO.ax, 1.5, 0.008);
  const hm = mesh(hero, {}, 0.16);
  S.ticks.push((now, t) => heroAt(t || 0, hm.material.uniforms.uShift.value));
  // what Marit is pulling: four strands from one hand to the other, their bellies swimming
  const pull = buf();
  for (let i = 0; i < 4; i++) strand(pull, [0, 0, 0], HERO.ax, 1.5, 0.0085);
  const pm = mesh(pull, { PINNED: 1 }, 0.14);
  S.ticks.push(() => { pm.material.uniforms.uA.value.copy(S.marit.hp[0]); pm.material.uniforms.uB.value.copy(S.marit.hp[1]); });
  // flour in the air round her, and on the board she worked it on
  for (let i = 0; i < 150; i++) {
    const p = i < 110 ? [mid[0] + rng.gauss() * 0.7, mid[1] + rng.gauss() * 0.6, mid[2] + rng.gauss() * 0.8] : [rng.f(-0.4, 0.3), -2.9 + rng.f(0, 0.5), rng.f(1.4, 2.4)];
    S.glows.push({ p, color: '#fff4e0', power: rng.f(0.1, 0.3), size: rng.f(0.02, 0.05), move: [rng.f(-0.02, 0.02), rng.f(-0.02, 0.02), rng.f(-0.02, 0.02)], loop: rng.f(9, 16), twinkle: 0.3 });
  }
  // a work lamp let down on its cord from the bags' rail, over where she is
  const lp = [mid[0] + 0.15, mid[1] + 1.2, mid[2] - 0.3];
  S.lattices.push({ origin: lp, spacing: [1, 1], count: [1, 1], color: '#ffe2b8', power: 0.42, reach: 2.2 });
  S.g2.box(lp[0] - 0.09, lp[1], lp[2] - 0.09, lp[0] + 0.09, lp[1] + 0.05, lp[2] + 0.09, '#ffe9c8', { emit: 4.5 });
  S.g2.tube([[lp[0], lp[1] + 0.05, lp[2]], [lp[0] + 0.3, lp[1] + 1.1, lp[2] + 0.1], [0, R_IN - 0.12, lp[2] + 0.2]], 0.006, 3, DARK);
  S.glows.push({ p: [lp[0], lp[1] - 0.03, lp[2]], color: '#ffe2b8', power: 1.1, size: 0.4 });
  yield 'noodles';
}

// ---------------------------------------------------------------- the two worlds
const STOP = 6;                             // seconds the frame takes to come to rest in the hall once it lets go of the train
const REST = -11000;                        // and where along the hall it comes to rest: 11 km short of a row
// how many seconds' worth of the train's speed the frame has kept by flight time t, if it lets go at T1
function kept(t, T1) { if (t <= T1) return t; const x = Math.min((t - T1) / STOP, 1); return T1 + STOP * (x - x * x * x * x * (x * (x - 3) + 2.5)); }

function slowLine(kind, card) {
  const out = kind === 'out';
  return {
    ...card,
    drum: 'The slow line', kind: 'a slow cycler',
    *build(ctx) {
      const scene = new Scene(), train = new Group(), room = new Group(), hallGroup = new Group();
      scene.add(hallGroup, train); train.add(room);
      const fl = out ? flightOut() : flightHome(), path = makePath(fl.keys, fl.opts);
      const inside = path.points(0.25).filter((p) => Math.hypot(p.x, p.y) < R_IN && p.z > ZA && p.z < ZB);
      // the room's light: four rows of lamps on the diagonals, and whatever the builders add
      const rig = lampRig({ ambUp: '#4e4034', ambDown: '#3a3028', maxLattices: 8 });
      const S = {
        kind, ctx, room, rig, lit: litMaterial(rig, { side: 'double', soft: 0.25 }), prop: litMaterial(rig, { soft: 0.3 }), g: new Geo(), g2: new Geo(),
        glows: [], ticks: [], labels: makeLabels(rig), signUp: fl.signUp, t0: performance.now(),
        lattices: [{ origin: [-2.4, 2.4, -6], spacing: [4.8, 2.4], count: [2, 6], color: '#ffdcb6', power: 0.27, reach: 2.4 }, { origin: [-2.4, -2.4, -6], spacing: [4.8, 2.4], count: [2, 6], color: '#ffdcb6', power: 0.27, reach: 2.4 }],
        due() { if (performance.now() - S.t0 > 4) { S.t0 = performance.now(); return true; } return false; },
        clear(p, r) { for (const q of inside) { const dx = q.x - p[0], dy = q.y - p[1], dz = q.z - p[2]; if (dx * dx + dy * dy + dz * dz < r * r) return false; } return true; },
      };
      yield* buildShell(S);
      room.add(S.g.mesh(S.lit));
      yield 'shell';
      yield* buildShelf(S); yield* buildGalley(S); yield* buildBags(S); yield* buildTable(S); yield* buildCorner(S); yield* buildWalls(S);
      const cast = out ? castOut(S) : castHome(S);
      yield 'cast';
      S.ticks.push(makeFolk(S, cast));
      yield 'people';
      if (S.runner) {
        // the two cords of the bungee hour, from the pad to the runner's hips
        const cg = new Geo(); cg.tint(1).cyl(0, 0, 0, 0.011, 0.011, 1, 5, '#ffffff', { cap: false });
        const cords = copies(cg.build(), S.prop, 2, ['#c9563c']), q = new Quaternion(), d = new Vector3(), yUp = new Vector3(0, 1, 0);
        room.add(cords);
        S.ticks.push(() => {
          S.pad.anchors.forEach((a, k) => { d.copy(S.runner.pw).addScaledVector(_w.subVectors(a, S.pad.anchors[1 - k]), 0.11).sub(a); const len = d.length(); cords.setMatrixAt(k, _m.compose(a, q.setFromUnitVectors(yUp, d.divideScalar(len)), _w.set(1, len, 1))); });
          cords.instanceMatrix.needsUpdate = true;
        });
      }
      if (!out) yield* buildNoodles(S);
      room.add(S.g2.mesh(S.lit));
      yield 'furnishings';
      // the window's three panes: the room's lamps lie faintly in the glass
      const pg = new Geo();
      for (const z of [-3, 0, 3]) pg.quad([WIN.x + 0.03, -WIN.h, z - 1.45], [WIN.x + 0.03, -WIN.h, z + 1.45], [WIN.x + 0.03, WIN.h, z + 1.45], [WIN.x + 0.03, WIN.h, z - 1.45], '#b8c8c2');
      const glass = pg.mesh(litMaterial(rig, { transparent: true, opacity: 0.03, side: 'double' }));
      glass.renderOrder = 9.7;
      room.add(glass);
      const lm = yield* S.labels.build();
      if (lm) room.add(lm);
      room.add(glowPoints(S.glows, { maxPx: 90, soft: 1.9 }));
      S.lattices.forEach((l, i) => rig.setLattice(i, l));
      yield 'lamps lit';
      for (const f of S.ticks) f(G.uTime.value);
      yield 'room';

      // outside
      // (the trunk takes what light the near column of drums gives it; the cars sit in the spill of their own windows)
      const trunk = yield* buildTrunk(litMaterial(plainRig({ dir: [0.85, 0.3, 0.1], color: '#ffb878', power: 0.3, ambUp: '#3a4250', ambDown: '#262c36' }), { side: 'double' }));
      scene.add(trunk.group);
      const carRig = plainRig({ dir: [0.9, 0.2, 0], color: '#ffd9a8', power: 0.25, ambUp: '#6a5a48', ambDown: '#4a4038' });
      const cars = yield* buildTrain(litMaterial(carRig, { side: 'double' }));
      train.add(cars.mesh, cars.lights, cars.own);
      yield 'train';
      // the Galley's name again, painted on its hull over the window, for whoever comes up to it from outside
      const outer = makeLabels(carRig), oth = 0.53;
      outer.add("The Wanderers' Galley", v3(polar(R_HULL + 0.03, oth, 0)), new Vector3(0, 0, -1), new Vector3(-Math.sin(oth), Math.cos(oth), 0), 4.2, 0.62, { style: 'board', font: 'serif', ppm: 230 });
      const om = yield* outer.build();
      if (om) train.add(om);
      const hall = yield* buildHall(ctx, { focus: [HX / RAFT.CELL, 0] });
      // In the room the lens must see to within a hand's width, far nearer than the kit's hall is drawn for. Two things
      // keep the hall whole at that: its two layers are the backdrop to everything and need not write depth (one sheet
      // to the horizon cannot be placed in depth to better than kilometres from a near plane of centimetres), and its
      // lamps are drawn a little nearer still to the eye than the kit draws them.
      hall.ceiling.material.depthWrite = false; hall.floor.material.depthWrite = false;
      hall.lights.material.uniforms.uPull.value.set(0.02, 2000);
      hallGroup.add(hall.group);
      yield 'hall';
      // the water just in front of the lens, while the camera is in it
      const cg = new BufferGeometry();
      cg.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); cg.setIndex([0, 1, 2, 0, 2, 3]);
      const lens = new Mesh(cg, waterMaterial(WATER, false));
      lens.frustumCulled = false; lens.renderOrder = 60; lens.visible = false;
      scene.add(lens);

      const look = { exposure: out ? 2.3 : 1.9, bloom: 0.3, threshold: 0.75, vignette: 0.42, saturation: 1.06 };
      let lead = 0, ring = null;
      const fwd = new Vector3();
      // where everything stands at flight time t: the hall slid back, the train run on if the frame has let it go
      const place = (t) => {
        const k = kept(t, fl.T1);
        let zh;
        if (out) zh = SPEED * (lead + k - 9);
        else { const whole = Math.round(lead / PERIOD), part = lead - whole * PERIOD; zh = REST + whole * RAFT.CELL - SPEED * (fl.T1 + STOP / 2 - k) + SPEED * part * (1 - smoothstep(4, 34, t)); }
        hallGroup.position.set(-HX, -HY, -zh);
        train.position.z = SPEED * (t - k);
        const v = t <= fl.T1 ? SPEED : SPEED * (1 - smootherstep(fl.T1, fl.T1 + STOP, t));
        for (const th of trunk.threads) { th.material.uniforms.uOff.value = ((zh % 175) + 175) % 175; th.material.uniforms.uBlur.value = clamp(v * 0.09, 6, 175); }
      };
      place(0);
      return {
        scene, path, near: fl.nearIn, far: RAFT.FAR, look,
        // leg 1 leaves by the hatch, which is its own frame, and until the next world shows in it it is a dim way
        // through; leg 11 leaves by a ring of light standing in the hall
        portal: out ? { rim: false, mist: '#4a3626', mistPower: 0.7, openFor: 22 } : { mist: '#f2d9a0', rimPower: 1.4 },
        update(t, dt, camera) {
          if (t === 0) lead += dt;
          place(t);
          // that ring stands beside the trunk the whole flight, where the room's window would show it like a moon:
          // it is not drawn until the camera is on its way out
          if (!out) { if (!ring) ring = scene.children.filter((o) => o.isMesh && o.position.equals(path.exit.pos)); for (const o of ring) o.visible = t > fl.T1 - 7.5; }
          const now = G.uTime.value;
          for (const f of S.ticks) f(now, t);
          // how near the lens may see: close in the room, a couple of metres out in the hall, where the far lamps need
          // it, and close again on the way into the opening, which must not be cut by it. (The engine sets the
          // camera's near plane from the one number a world returns, the smallest of these, just before this is called.)
          const p = camera.position, rho = Math.hypot(p.x, p.y), off = rho - R_TRUNK;
          const wet = rho > BORE && rho < R_TRUNK && Math.abs(Math.atan2(p.y, p.x)) < SLOT + 0.06;
          // In the room that is a hand's width or two; at the window and in the gap, where the frame has left the
          // picture by the time it is that close, most of a metre; in the water, where there is nothing nearer than the
          // strip's edges, over a metre. Even so the far floor of the hall, which is one sheet, loses its pattern
          // beyond some tens of kilometres as seen from the room.
          const gap = 0.8, roomNear = fl.nearRoom + (gap - fl.nearRoom) * smoothstep(2.5, 3.5, rho);
          const clearAt = rho < BORE ? roomNear : off < 0 ? Math.min(gap + 0.6 * (rho - BORE), 1.2) : clamp(0.3 * off, 1.2, fl.nearOut);
          camera.near = Math.min(clearAt, Math.max(fl.nearIn, 0.08 * p.distanceTo(path.exit.pos)));
          camera.updateProjectionMatrix();
          // the water: going in, it is on the lens until the bore; going out, the strip's pane thins as the lens nears it
          const depth = (R_TRUNK - BORE), tint = (m, k) => m.material.uniforms.uTint.value.set(Math.pow(WATER[0], k), Math.pow(WATER[1], k), Math.pow(WATER[2], k));
          lens.visible = out && wet;
          if (lens.visible) {
            tint(lens, clamp((rho - BORE) / depth, 0, 1));
            lens.position.copy(p).addScaledVector(fwd.set(0, 0, -1).transformDirection(camera.matrixWorld), camera.near * 1.6);
            lens.quaternion.setFromRotationMatrix(camera.matrixWorld); lens.scale.setScalar(camera.near * 9);
          }
          tint(trunk.pane, !out && wet ? clamp((R_TRUNK - rho) / depth, 0, 1) : 1);
          // the eye opens in the hall and closes down in the room; seen from the room, through the water, the hall
          // is given back what that takes from it
          const inRoom = 1 - smoothstep(BORE - 1, R_TRUNK + 16, rho);
          look.exposure = 2.3 - 0.55 * inRoom;
          hall.set({ lamp: 1 + 1.4 * inRoom, trains: 1 + 1.4 * inRoom, glow: 2.5 + 2.5 * inRoom });
          for (const c of hall.columns) c.material.uniforms.uBand.value = 0.05 + 0.08 * inRoom;
          hall.ceiling.material.uniforms.uCollar.value = 0.1 + 0.12 * inRoom; hall.floor.material.uniforms.uCollar.value = 0.08 + 0.1 * inRoom;
          cars.own.material.uniforms.uPower.value = smoothstep(14, 60, Math.hypot(p.x - R_HULL, p.y, p.z - train.position.z));
        },
      };
    },
  };
}

export const slowLineOut = slowLine('out', {
  id: 'slow-line-1', title: "The Wanderers' Galley", row: 'leg 1, Herb Row to Hedge Row', light: 3.4,
  line: 'Nobody told me the slow line has no weight. Soup comes in bulbs, bread comes in a net, and you sleep in a bag clipped to the wall like a coat.',
  tone: '#e9b06a', source: "wander-year.md (Day 7), eating-out.md (The Wanderers' Galley), raft-transport.md (Cyclers)",
  sound: { root: 45, scale: 'dorian', pad: 0.45, air: 0.35, hum: 0.4, water: 0.08, crowd: 0.3, bells: 0.12, bright: 0.45 },
});

export const slowLineHome = slowLine('home', {
  id: 'slow-line-11', title: "They don't hang, they swim", row: 'leg 11, Kite Row to Quill Row', light: 7.6,
  line: "Do not pull noodles at zero g. The galley is full of loose noodle, the riders are catching it with chopsticks, and they've voted it the best night of the line.",
  tone: '#f2d9a0', source: "wander-year.md (Day 344), eating-out.md (The Wanderers' Galley), raft-transport.md (Cyclers)",
  sound: { root: 50, scale: 'mixo', pad: 0.4, air: 0.3, hum: 0.3, crowd: 0.8, bells: 0.3, bright: 0.65 },
});
