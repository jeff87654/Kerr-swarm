// Shared pieces for Lid Island and the Cold Rows (region 'hollow-island'): the zone conventions of the Hollow, meshes the
// scope can move every frame (the rope ferry's two boats, the slow splash), and the props both halves use: old apple trees
// in leaf, young ones in blossom, bare ones for the winter tents, the coat rack, the thermometer post, the chiller.
// Props are drawn at the origin with their front toward +z.
import * as THREE from 'three';
import { Geo, MeshBuf } from '../world/meshbuilder.js';
import { defineProp } from '../world/props.js';
import { bareTree } from './hollow_parts.js';
import { Rng, hashStr, shadeHex } from '../core/util.js';

export const IP = { iron: '#24443a', brass: '#b08a45', cream: '#efe6d2', teal: '#2f6f73', verm: '#c4472c', saffron: '#e7b547', indigo: '#34407a', rose: '#e07a6a', plum: '#6a2f5a', moss: '#5f7f3a', frost: '#e9f1f5' };
export const DYES = ['#d9472b', '#e7b547', '#2f8f8a', '#3b4a8f', '#b8336a', '#6b9f3e', '#f08a3a', '#6a2f5a'];

// The Hollow's zone conventions (the same values as hollow_places.js)
export const ENV = { exposure: 1.0, autoKey: 0.19, autoMin: 0.02, autoMax: 5, bloom: 0.045, warmth: 0.05, contrast: 1.1, saturation: 1.12 };
export const OPEN = { ambience: 'hollow-day', reverb: 'open', sky: true, skyTop: 40, sun: true, sunPower: 34, far: 2400, headroom: 30 };
export function openZone(s, list, o) { const z = s.zoneBox(Object.assign({}, OPEN, { env: Object.assign({}, ENV) }, o)); list.push(z); return z; }

// a local frame placed at (x, y, z) and turned by yaw (front toward +z); rot gives the world point of a local one
export const atYaw = (g, x, y, z, yaw, fn) => { g.at(x, y, z, yaw); fn(g); g.pop(); };
export const rot = (x, z, yaw, lx, lz) => [x + Math.cos(yaw) * lx + Math.sin(yaw) * lz, z - Math.sin(yaw) * lx + Math.cos(yaw) * lz];
export const who = (name) => ({ name, colour: '#e2c486' });
export function card(game, kicker, title, text) { if (game.ui && game.ui.card) game.ui.card({ kicker, title, text }); }
export function pick(arr, n) { return arr[((n % arr.length) + arr.length) % arr.length]; }

// A mesh the scope owns but that can be moved every frame by changing `origin` (translation only). draw(g) draws it
// about its own zero. Returns { mesh, origin }.
export function movingMesh(s, draw, o = {}) {
  const W = s.world, g = new Geo(new MeshBuf(2048, 4096));
  draw(g);
  const mesh = new THREE.Mesh(g.buf.toGeometry(), W.mats.opaque);
  const origin = (o.origin || [0, 0, 0]).slice();
  W.addRenderable(mesh, { frame: s.frame, origin, center: o.center || [0, 0, 0], radius: o.radius || 6, far: o.far || 700, caster: false, scope: s });
  s.meshes.push(mesh);
  return { mesh, origin };
}

// ---------------------------------------------------------------------------------------------------------------
// Apple trees. p: { seed (0..5), kind: 'old' (in leaf, small apples, a prop under the heavy limb, a mended tie) |
//   'blossom' (just out of winter: white and pink, a few new leaves) }
// ---------------------------------------------------------------------------------------------------------------
defineProp('lmhi.apple', (g, p) => {
  const old = p.kind === 'old', bloom = p.kind === 'blossom';
  const r = new Rng(hashStr('lmhi.apple:' + p.kind + ':' + (p.seed || 0)));
  const H = old ? 1.7 : 1.45, tr = old ? 0.17 : 0.1;
  const lean = [r.f(-0.35, 0.35), r.f(-0.35, 0.35)];
  const T = (t) => [lean[0] * t * t, H * t, lean[1] * t * t];
  g.mat('bark', old ? '#6a5848' : '#7a6652');
  g.tube([T(0), T(0.35), T(0.7), T(1)], [tr * 1.4, tr * 1.05, tr * 0.9, tr * 0.7], { segs: old ? 8 : 6 });
  if (old) { g.mat('bark', '#5a4a3c'); for (let k = 0; k < 3; k++) { const a = k * 2.1 + r.f(0, 1); g.tube([[Math.cos(a) * 0.12, 0.0, Math.sin(a) * 0.12], [Math.cos(a) * 0.3, -0.05, Math.sin(a) * 0.3]], [0.07, 0.03], { segs: 4 }); } }
  // scaffold limbs, each forking twice; tips collect where the crown goes
  const tips = [], nb = old ? 5 : 4; let heavy = null;
  for (let i = 0; i < nb; i++) {
    const a = i / nb * 6.283 + r.f(-0.35, 0.35), b = T(r.f(0.65, 1)), len = r.f(1.1, 1.55) * (old ? 1.2 : 0.95), up = r.f(0.35, 0.7);
    const e = [b[0] + Math.cos(a) * len, b[1] + up * len * 0.6 - (old ? 0.15 : 0), b[2] + Math.sin(a) * len];
    const m = [(b[0] + e[0]) / 2 + r.f(-0.1, 0.1), (b[1] + e[1]) / 2 + 0.12, (b[2] + e[2]) / 2 + r.f(-0.1, 0.1)];
    g.mat('bark', old ? '#6a5848' : '#7a6652');
    g.tube([b, m, e], [tr * 0.62, tr * 0.45, tr * 0.24], { segs: 5 });
    if (!heavy || len > heavy.len) heavy = { m, e, len, a };
    for (const base of [m, e]) for (let k = 0; k < 2; k++) {
      const aa = a + r.f(-0.9, 0.9), l2 = r.f(0.45, 0.8), q = [base[0] + Math.cos(aa) * l2, base[1] + r.f(0.2, 0.55), base[2] + Math.sin(aa) * l2];
      g.tube([base, q], [tr * 0.22, tr * 0.08], { segs: 3, caps: false }); tips.push(q);
    }
    tips.push(e);
  }
  if (old && heavy) {
    // a forked prop under the heaviest limb, and a bright mended tie where it once split
    g.mat('wood', '#9a7a52'); const pt = heavy.m; g.tube([[pt[0] * 1.35, 0, pt[2] * 1.35], [pt[0] * 1.02, pt[1] - 0.12, pt[2] * 1.02]], 0.035, { segs: 5 });
    g.tube([[pt[0] * 1.02, pt[1] - 0.12, pt[2] * 1.02], [pt[0] * 1.02 + 0.08, pt[1] + 0.02, pt[2] * 1.02]], 0.022, { segs: 4 }); g.tube([[pt[0] * 1.02, pt[1] - 0.12, pt[2] * 1.02], [pt[0] * 1.02 - 0.08, pt[1] + 0.02, pt[2] * 1.02]], 0.022, { segs: 4 });
    g.mat('weave', pick(DYES, p.seed || 0)); const t1 = T(0.92); g.lathe(t1[0], t1[2], [[tr * 0.78, t1[1] - 0.06], [tr * 0.8, t1[1]], [tr * 0.78, t1[1] + 0.06]], { segs: 8, capTop: false, capBottom: false });
  }
  // the crown
  const cen = tips.filter((q, i) => i % 2 === 0);
  if (bloom) {
    g.mat('grass', '#c9d9b8', { rough: 0.2, shade: 'foliage' });
    for (const c of cen) g.ball(c[0], c[1], c[2], 0.32, 0.24, 0.32, { segs: 6, rings: 4 });
    g.mat('blossom', '#fff6f4', { sway: 0.35 });
    for (const c of tips) for (let k = 0; k < 6; k++) { const a = r.f(0, 6.283), d = r.f(0.05, 0.45), sz = r.f(0.32, 0.55); g.card(c[0] + Math.cos(a) * d, c[1] + r.f(-0.25, 0.2), c[2] + Math.sin(a) * d, sz, sz, a, { tilt: r.f(-0.6, 0.6) }); }
    g.mat('blossom', '#f6c9d2', { sway: 0.35 });
    for (const c of tips) for (let k = 0; k < 2; k++) { const a = r.f(0, 6.283), sz = r.f(0.3, 0.45); g.card(c[0] + Math.cos(a) * 0.25, c[1] + r.f(-0.1, 0.25), c[2] + Math.sin(a) * 0.25, sz, sz, a + 1, { tilt: r.f(-0.5, 0.5) }); }
    g.mat('leafA', '#e4f5c8', { sway: 0.5 });
    for (let k = 0; k < 10; k++) { const c = tips[k % tips.length], a = r.f(0, 6.283); g.card(c[0] + Math.cos(a) * 0.3, c[1] - 0.15, c[2] + Math.sin(a) * 0.3, 0.35, 0.35, a, { tilt: 0.4 }); }
  } else {
    g.mat('grass', '#a6c48c', { rough: 0.2, shade: 'foliage' });
    for (const c of cen) g.ball(c[0], c[1] + 0.05, c[2], 0.62, 0.46, 0.62, { segs: 7, rings: 5 });
    g.mat('leafA', '#f4ffe8', { sway: 0.55 });
    for (const c of tips) for (let k = 0; k < 5; k++) { const a = r.f(0, 6.283), el = r.f(-0.4, 0.9), d = r.f(0.35, 0.7), sz = r.f(0.45, 0.7); g.card(c[0] + Math.cos(a) * d * Math.cos(el), c[1] + Math.sin(el) * d * 0.7 - sz * 0.4, c[2] + Math.sin(a) * d * Math.cos(el), sz, sz, a + 1.57, { tilt: r.f(-0.5, 0.5) }); }
    g.mat('glaze', '#b3261e', { rough: -0.1 });
    for (let k = 0; k < 12; k++) { const c = cen[k % cen.length], a = r.f(0, 6.283); g.ball(c[0] + Math.cos(a) * 0.55, c[1] - r.f(0.15, 0.4), c[2] + Math.sin(a) * 0.55, 0.035, 0.033, 0.035, { segs: 5, rings: 3 }); }
    g.mat('glaze', '#c8a03a', { rough: -0.1 });
    for (let k = 0; k < 4; k++) { const c = cen[(k + 2) % cen.length], a = r.f(0, 6.283); g.ball(c[0] + Math.cos(a) * 0.5, c[1] - 0.3, c[2] + Math.sin(a) * 0.5, 0.034, 0.032, 0.034, { segs: 5, rings: 3 }); }
  }
  return { posts: [[0, 0, tr * 1.3, 0, H]], tier: 's' };
});

// A bare apple tree for the winter tents, with rime on its upper twigs and a row tag tied on. p: { seed, tag }
defineProp('lmhi.bare', (g, p) => {
  bareTree(g, 0, 0, 0, 'lmhi' + (p.seed || 0), 1);
  const r = new Rng(hashStr('lmhi.bare.rime' + (p.seed || 0)));
  // rime: small pale flecks along the upper twigs
  g.mat('plain', '#eef5f8', { rough: 0.4 });
  for (let k = 0; k < 26; k++) { const a = r.f(0, 6.283), d = r.f(0.35, 1.25), y = 1.75 + r.f(0, 1.1); g.box(Math.cos(a) * d - 0.025, y, Math.sin(a) * d - 0.025, Math.cos(a) * d + 0.025, y + 0.012, Math.sin(a) * d + 0.025); }
  // the row tag: a white card on a string at shoulder height, numbered
  g.mat('weave', '#d8cdb8'); g.tube([[0.09, 1.25, 0.0], [0.13, 1.18, 0.04]], 0.004, { segs: 3, caps: false });
  g.mat('paper', p.tag || '#f4efe2'); g.box(0.12, 1.08, 0.03, 0.2, 1.18, 0.035);
  return { posts: [[0, 0, 0.12, 0, 1.6]], tier: 's' };
});

// A coat rack: a frame with a shelf for boots and hooks of long quilted coats, each mended in another colour. p: { n, seed }
defineProp('lmhi.coatrack', (g, p) => {
  const n = p.n || 6, w = n * 0.38 + 0.2, r = new Rng(hashStr('coats' + (p.seed || 0)));
  g.mat('wood', '#6b4a2f');
  for (const sx of [-1, 1]) g.box(sx * w / 2 - 0.035, 0, -0.18, sx * w / 2 + 0.035, 1.9, -0.11, { bevel: 0.01 });
  g.box(-w / 2, 1.78, -0.18, w / 2, 1.85, -0.11, { bevel: 0.008 });
  g.box(-w / 2, 0.2, -0.3, w / 2, 0.24, 0.08, { bevel: 0.008 });
  g.box(-w / 2 - 0.05, 1.86, -0.32, w / 2 + 0.05, 1.9, 0.12, { bevel: 0.008 });
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.29 + i * 0.38; g.mat('cast', IP.brass); g.tube([[x, 1.8, -0.11], [x, 1.79, -0.04], [x, 1.83, -0.02]], 0.008, { segs: 4 });
    if (r.chance(0.82)) {
      const c = r.pick(['#3b4a8f', '#2f6f73', '#6a2f5a', '#7a3a2a', '#4a5a3a', '#c4472c', '#34407a']), L = r.f(1.15, 1.35);
      g.mat('knit', c, { sway: 0.15 });
      g.box(x - 0.17, 1.78 - L, -0.06, x + 0.17, 1.66, 0.06, { bevel: 0.05 });
      g.box(x - 0.08, 1.66, -0.05, x + 0.08, 1.8, 0.04, { bevel: 0.03 });
      // the visible mends: a bright patch or two and cuffs in another dye
      g.mat('weave', r.pick(DYES)); g.box(x - 0.12 + r.f(0, 0.1), 1.78 - L * r.f(0.35, 0.7), 0.058, x - 0.02 + r.f(0, 0.1), 1.78 - L * r.f(0.35, 0.7) + 0.1, 0.066);
      g.mat('weave', r.pick(DYES)); g.box(x - 0.175, 1.78 - L, -0.065, x + 0.175, 1.78 - L + 0.07, 0.065);
    }
  }
  // boots on the shelf
  for (let i = 0; i < Math.floor(n * 0.7); i++) { const x = -w / 2 + 0.25 + i * 0.5; g.mat('speckle', r.pick(['#2b2f2c', '#3a2a22', '#2f3f4a'])); for (const dx of [0, 0.13]) { g.box(x + dx - 0.05, 0.24, -0.2, x + dx + 0.05, 0.5, -0.08, { bevel: 0.02 }); g.box(x + dx - 0.05, 0.24, -0.2, x + dx + 0.05, 0.31, 0.04, { bevel: 0.02 }); } }
  return { solid: [[-w / 2, 0, -0.32, w / 2, 1.9, 0.12]], tier: 's' };
});

// A thermometer on a post: a brass dial with a red needle, a cold blue band, and a card ruled in pencil. p: { }
defineProp('lmhi.thermo', (g) => {
  g.mat('wood', '#6b4a2f'); g.box(-0.04, 0, -0.04, 0.04, 1.62, 0.04, { bevel: 0.008 });
  g.push(); g.move(0, 1.48, 0.05); g.rotX(Math.PI / 2);
  g.mat('cast', IP.brass); g.cyl(0, -0.02, 0, 0.17, 0.05, { segs: 22 });
  g.mat('plain', '#f4efe2'); g.cyl(0, 0.03, 0, 0.145, 0.004, { segs: 22 });
  g.pop();
  // the scale: ticks round the dial, a blue arc for the cold, the needle at four
  g.mat('cast', '#2a2a28'); for (let k = 0; k < 13; k++) { const a = -2.2 + k * (4.4 / 12); g.box(Math.sin(a) * 0.12 - 0.004, 1.48 + Math.cos(a) * 0.12 - 0.004, 0.084, Math.sin(a) * 0.12 + 0.004, 1.48 + Math.cos(a) * 0.12 + 0.004, 0.088); }
  g.mat('plain', '#5f9fc8'); for (let k = 0; k < 4; k++) { const a = -2.2 + k * 0.12; g.box(Math.sin(a) * 0.1 - 0.012, 1.48 + Math.cos(a) * 0.1 - 0.012, 0.083, Math.sin(a) * 0.1 + 0.012, 1.48 + Math.cos(a) * 0.1 + 0.012, 0.086); }
  g.mat('cast', '#c4472c'); { const a = -1.75; g.tube([[0, 1.48, 0.09], [Math.sin(a) * 0.115, 1.48 + Math.cos(a) * 0.115, 0.09]], 0.004, { segs: 3 }); }
  g.mat('paper', '#efe6d2'); g.box(-0.1, 1.06, 0.04, 0.1, 1.28, 0.045);
  g.mat('cast', '#3a3a36'); for (let k = 0; k < 6; k++) g.box(-0.08, 1.09 + k * 0.032, 0.046, 0.05 - (k % 3) * 0.02, 1.094 + k * 0.032, 0.047);
  return { posts: [[0, 0, 0.06, 0, 1.6]], tier: 's' };
});

// The chiller at the closed end of a tent: a louvred cabinet on feet, its fan grille, a pipe and a fat cloth duct. p: { h }
defineProp('lmhi.chiller', (g) => {
  g.mat('panel', '#b9c2c4'); g.box(-0.9, 0.15, -0.65, 0.9, 1.45, 0.65, { bevel: 0.025 });
  g.mat('cast', '#3a4044'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * 0.8 - 0.05, 0, sz * 0.55 - 0.05, sx * 0.8 + 0.05, 0.16, sz * 0.55 + 0.05);
  g.mat('grille', '#6a7276'); g.box(-0.6, 0.35, -0.67, 0.6, 1.3, -0.66, { faces: 'z' });
  g.push(); g.move(0, 0.82, -0.68); g.rotX(Math.PI / 2); g.mat('cast', '#2c3236'); g.cyl(0, -0.01, 0, 0.42, 0.02, { segs: 18 }); g.pop();
  g.mat('paint', '#2f6f73'); g.box(-0.92, 1.3, -0.67, 0.92, 1.36, 0.67);
  g.mat('plain', '#e7b547'); g.box(0.55, 1.05, 0.652, 0.85, 1.2, 0.656, { faces: 'Z' });
  g.mat('brushed', '#9aa4a8'); g.tube([[0.5, 1.45, 0.2], [0.5, 1.75, 0.2], [0.5, 1.9, 0.75]], 0.05, { segs: 8 });
  return { solid: [[-0.9, 0, -0.65, 0.9, 1.45, 0.65]], tier: 's' };
});

// A short post with a cloth lantern hung from a crook, for the ring on the island's crown. p: { col, h }
defineProp('lmhi.lanternpost', (g, p) => {
  const h = p.h || 2.6;
  g.mat('wood', '#4a3a2c'); g.lathe(0, 0, [[0.08, 0], [0.07, 0.1], [0.055, 0.25], [0.05, h], [0.06, h + 0.06]], { segs: 8 });
  g.mat('cast', IP.iron); g.tube([[0, h - 0.1, 0], [0, h + 0.18, 0], [0.12, h + 0.3, 0], [0.32, h + 0.26, 0]], 0.016, { segs: 5 });
  g.mat('paint', p.band || IP.saffron); g.cyl(0, 1.0, 0, 0.056, 0.1, { segs: 8 });
  return { posts: [[0, 0, 0.08, 0, h]], tier: 's' };
});

// ---------------------------------------------------------------------------------------------------------------
// The rope ferry's boat, drawn about the waterline (y = 0) with its length along local x, for a moving mesh.
// o: { hull, gun, cushions: [..] }
// ---------------------------------------------------------------------------------------------------------------
export function drawBoat(g, o) {
  if (o.yaw) g.at(0, 0, 0, o.yaw);
  drawHull(g, o);
  if (o.yaw) g.pop();
}
function drawHull(g, o) {
  const L = 3.0, B = 0.88, D = 0.52, hull = o.hull, gun = o.gun;
  // the sides, raked at both ends, in planks
  for (const sz of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const y0 = -0.16 + k * (D + 0.16) / 3, y1 = y0 + (D + 0.16) / 3 - 0.008, rk = (y) => 0.35 * (1 - (y + 0.16) / (D + 0.16));
      g.mat('wood', k === 1 ? shadeHex(hull, 1.12) : hull, { rough: -0.05 });
      const z0 = sz * B - (sz > 0 ? 0.05 : 0), z1 = sz * B + (sz < 0 ? 0.05 : 0);
      g.prism([[-L + rk(y0), z0], [L - rk(y0), z0], [L - rk(y0), z1], [-L + rk(y0), z1]], y0, y1);
    }
  }
  // the raked ends
  for (const sx of [-1, 1]) {
    g.mat('wood', shadeHex(hull, 0.9));
    g.quad([sx * (L - 0.35), -0.16, -B], [sx * (L - 0.35), -0.16, B], [sx * L, D, B], [sx * L, D, -B], { double: true });
    g.mat('paint', gun); g.box(sx * L - 0.06, D - 0.02, -B, sx * L + 0.06, D + 0.04, B, { bevel: 0.01 });
  }
  // the floor, the gunwales, the knees
  g.mat('planks', '#a8916f'); g.box(-L + 0.35, 0.02, -B + 0.05, L - 0.35, 0.07, B - 0.05, { faces: 'Y' });
  g.mat('paint', gun); for (const sz of [-1, 1]) g.box(-L, D, sz * B - 0.07, L, D + 0.05, sz * B + 0.07, { bevel: 0.012 });
  g.mat('wood', shadeHex(hull, 0.75)); for (let x = -2.2; x <= 2.21; x += 1.1) for (const sz of [-1, 1]) g.box(x - 0.04, 0.07, sz * (B - 0.1) - 0.03, x + 0.04, D, sz * (B - 0.1) + 0.03);
  // three thwarts, cushions on two
  g.mat('wood', '#c49a68', { rough: -0.05 }); for (const x of [-1.7, 0, 1.7]) g.box(x - 0.17, 0.38, -B + 0.05, x + 0.17, 0.43, B - 0.05, { bevel: 0.01 });
  const cu = o.cushions || ['#e7b547', '#b8336a'];
  cu.forEach((c, i) => { g.mat('knit', c); g.box(-1.7 + i * 1.7 - 0.15, 0.43, -0.55, -1.7 + i * 1.7 + 0.15, 0.49, 0.55, { bevel: 0.03 }); });
  // the rope guides on the -z side: two iron brackets with sheaves, the rope running through them and back into the water
  g.mat('cast', IP.iron);
  for (const sx of [-1, 1]) { g.box(sx * 2.4 - 0.05, D - 0.1, -B - 0.12, sx * 2.4 + 0.05, D + 0.42, -B); g.push(); g.move(sx * 2.4, D + 0.3, -B - 0.2); g.rotX(Math.PI / 2); g.mat('cast', IP.brass); g.cyl(0, -0.03, 0, 0.11, 0.06, { segs: 12 }); g.pop(); g.mat('cast', IP.iron); }
  g.mat('weave', '#c9b48a'); g.tube([[-L - 1.4, -0.35, -B - 0.25], [-2.4, D + 0.41, -B - 0.2], [2.4, D + 0.41, -B - 0.2], [L + 1.4, -0.35, -B - 0.25]], 0.025, { segs: 5 });
  // a pole at the stern with a cloth lantern, and a coil of spare line
  g.mat('wood', '#4a3a2c'); g.tube([[-2.75, 0.07, 0.6], [-2.75, 1.7, 0.6]], 0.03, { segs: 5 });
  g.mat('cast', IP.brass); g.tube([[-2.75, 1.66, 0.6], [-2.55, 1.72, 0.6]], 0.012, { segs: 4 });
  g.mat('paper', o.lantern || '#f2b56b', { emissive: 3.5, night: true }); g.lathe(-2.55, 0.6, [[0.04, 1.42], [0.11, 1.48], [0.12, 1.55], [0.1, 1.62], [0.04, 1.66]], { segs: 9 });
  g.mat('weave', '#d8c49a'); g.lathe(2.2, -0.45, [[0.14, 0.07], [0.2, 0.09], [0.2, 0.15], [0.14, 0.17], [0.12, 0.12]], { segs: 12 });
  // a bright mend on the side: a new plank in another wood
  g.mat('wood', '#b8875a'); g.box(0.4, 0.1, -B - 0.056, 1.3, 0.24, -B - 0.05);
}

// The splash, in pieces that rise and fall on their own: a column, a crown, a spray and a ring of foam (all drawn upward
// from y = 0 at their own zero; the caller moves them).
export function drawColumn(g) {
  g.mat('plain', '#f2f8fa', { rough: -0.35, emissive: 0.25 });
  g.lathe(0, 0, [[0.34, -3.0], [0.3, -1.6], [0.2, -0.6], [0.13, -0.2], [0.08, 0.0], [0.0, 0.1]], { segs: 12 });
}
export function drawCrown(g) {
  g.mat('plain', '#eef6f8', { rough: -0.35, emissive: 0.2 });
  for (let k = 0; k < 18; k++) {
    const a = k / 18 * 6.283, a1 = (k + 0.5) / 18 * 6.283, a2 = (k + 1) / 18 * 6.283, r0 = 0.55, r1 = 0.75;
    g.quad([Math.cos(a) * r0, -1.0, Math.sin(a) * r0], [Math.cos(a2) * r0, -1.0, Math.sin(a2) * r0], [Math.cos(a1) * r1, 0.0 + (k % 3) * 0.12, Math.sin(a1) * r1], [Math.cos(a1) * r1, 0.0 + (k % 3) * 0.12, Math.sin(a1) * r1], { double: true });
  }
}
export function drawSpray(g) {
  const r = new Rng(hashStr('spray'));
  g.mat('plain', '#f4fafc', { rough: -0.4, emissive: 0.3 });
  for (let k = 0; k < 46; k++) { const a = r.f(0, 6.283), el = r.f(0.2, 1.4), d = r.f(0.5, 1.5); g.ball(Math.cos(a) * Math.cos(el) * d, Math.sin(el) * d * 0.8 - 0.6, Math.sin(a) * Math.cos(el) * d, 0.05, 0.07, 0.05, { segs: 5, rings: 3 }); }
}
export function drawFoam(g) {
  g.mat('plain', '#e8f2f2', { rough: -0.2 });
  g.lathe(0, 0, [[1.9, 0.0], [1.5, 0.04], [0.9, 0.05], [0.5, 0.04], [0.0, 0.03]], { segs: 18 });
}
