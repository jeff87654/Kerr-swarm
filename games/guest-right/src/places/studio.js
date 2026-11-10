// Oona's lamp-painting studio, on Wick Court. A dark room for judging light, with a model of the Hollow on a long table:
// a cut-away cylinder with the land painted round its inside and a sunline the length of your arm down its axis.
// Round it: the swatch wall, the pigment shelves and the bruise jar, the score of this year's dawn, the lamp-test wall,
// gels on rods, Suvi's desk, and Oona's day bed under her sketches of the River.
import { lamp } from '../world/kit.js';
import { room, shopfront } from '../world/kit2.js';
import { prop, defineProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { deckRadius } from '../core/drum.js';
import { Rng, hexLin, mixHex, shadeHex, lerp, smoothstep, damp } from '../core/util.js';
import { SIGNS } from '../content/signs.js';
import { dynMesh, every, speaker, talk, found, give } from './studio_parts.js';

// ---- the room ----
const X0 = 3.5, X1 = 17, Z0 = 20, Z1 = 31, H = 3.2;
const WI = X0 + 0.16, EI = X1 - 0.16, BI = Z1 - 0.16;     // inner faces of the west, east and back walls
// ---- the model Hollow: axis along x ----
const MX0 = 8.6, MX1 = 11.2, AY = 1.3, AZ = 25.0, R = 0.42;
const FA = -35 * Math.PI / 180, FB = 200 * Math.PI / 180;    // the shell is kept from FA to FB (0 = bottom, +90 = back, 180 = top)
const SUN0 = MX0 + 0.12 * (MX1 - MX0), SUN1 = MX1 - 0.12 * (MX1 - MX0);
// the dawn's four colours, in order
const DAWN = { violet: '#6a4868', rose: '#e0909a', gold: '#f0b850', white: '#fff4e0' };

const P = (x, r, f) => [x, AY - r * Math.cos(f), AZ + r * Math.sin(f)];
// a quad whose winding is chosen so its normal points along n
function quadN(g, a, b, c, d, n) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if (nx * n[0] + ny * n[1] + nz * n[2] >= 0) g.quad(a, b, c, d); else g.quad(a, d, c, b);
}
// a band of the cylinder at radius r between angles f0..f1, facing in (toward the axis) or out
function band(g, x0, x1, r, f0, f1, inward, seg) {
  const n = seg || Math.max(2, Math.ceil((f1 - f0) / 0.12));
  for (let i = 0; i < n; i++) {
    const a = f0 + (f1 - f0) * i / n, b = f0 + (f1 - f0) * (i + 1) / n, m = (a + b) / 2;
    const out = [0, -Math.cos(m), Math.sin(m)], nn = inward ? [0, -out[1], -out[2]] : out;
    quadN(g, P(x0, r, a), P(x1, r, a), P(x1, r, b), P(x0, r, b), nn);
  }
}
// a flat ring sector in the plane x, between radii r0..r1, facing +x (s = 1) or -x (s = -1)
function annulus(g, x, r0, r1, f0, f1, s) {
  const n = Math.max(2, Math.ceil((f1 - f0) / 0.12));
  for (let i = 0; i < n; i++) {
    const a = f0 + (f1 - f0) * i / n, b = f0 + (f1 - f0) * (i + 1) / n;
    quadN(g, P(x, Math.max(r0, 0.002), a), P(x, Math.max(r0, 0.002), b), P(x, r1, b), P(x, r1, a), [s, 0, 0]);
  }
}
// draw on the land at (x, angle f): fn(g) works in a flat local frame whose ground is y = 0, up toward the axis
function onLand(g, x, f, lift, fn) { g.push(); g.move(x, AY, AZ); g.rotX(-f); g.move(0, -R + 0.006 + (lift || 0), 0); fn(g); g.pop(); }

// ---- props of the studio ----
defineProp('studio.daybed', (g) => {
  const w = 1.95, d = 0.82;
  g.mat('wood', '#5a3a26', { rough: -0.05 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.lathe(sx * (w / 2 - 0.06), sz * (d / 2 - 0.06), [[0.03, 0], [0.035, 0.08], [0.028, 0.2], [0.035, 0.3]], { segs: 8 });
  g.box(-w / 2, 0.28, -d / 2, w / 2, 0.36, d / 2, { bevel: 0.015 });
  // a low back against the wall and scrolled ends
  g.box(-w / 2, 0.36, -d / 2, w / 2, 0.78, -d / 2 + 0.06, { bevel: 0.012 });
  for (const sx of [-1, 1]) g.box(sx * w / 2 - 0.05, 0.36, -d / 2, sx * w / 2 + 0.03, 0.66, d / 2, { bevel: 0.014 });
  g.mat('weave', '#cdb89a'); g.box(-w / 2 + 0.04, 0.36, -d / 2 + 0.06, w / 2 - 0.04, 0.47, d / 2 - 0.02, { bevel: 0.035 });
  // a mended throw in bruise with a gold patch
  g.mat('motif', '#5b4060'); g.sheet([-0.15, 0.475, -0.36], [0.75, 0.475, -0.36], [0.75, 0.12, 0.43], [-0.15, 0.12, 0.43], { nu: 8, nv: 6, sag: 0.0, ripple: 0.02, rippleN: 4 });
  g.mat('weave', '#d6a640'); g.box(0.25, 0.476, 0.05, 0.42, 0.481, 0.2);
  g.mat('knit', '#e0909a'); g.box(0.42, 0.476, -0.1, 0.43, 0.481, 0.2);
  // bolsters and cushions
  g.mat('stripe', '#c9552e'); g.tube([[-w / 2 + 0.06, 0.56, -0.3], [-w / 2 + 0.06, 0.56, 0.3]], 0.1, { segs: 12 });
  g.mat('weave', '#2f6f73'); g.box(-0.6, 0.46, -0.36, -0.15, 0.85, -0.25, { bevel: 0.06 });
  g.mat('knit', '#d6a640'); g.box(-0.1, 0.46, -0.37, 0.32, 0.8, -0.27, { bevel: 0.06 });
  return { solid: [[-w / 2, 0, -d / 2, w / 2, 0.47, d / 2]], spots: [{ type: 'sit', x: -0.45, y: 0.47, z: 0.12, yaw: 0, tags: ['rest'] }, { type: 'sit', x: 0.4, y: 0.47, z: 0.12, yaw: 0, tags: ['rest'] }], tier: 's' };
});

defineProp('studio.teapot', (g, p) => {
  g.mat('glaze', p.glaze || '#2f6f73'); g.lathe(0, 0, [[0, 0], [0.05, 0], [0.075, 0.03], [0.08, 0.07], [0.06, 0.11], [0.035, 0.12], [0.032, 0.125]], { segs: 14, capTop: false });
  g.mat('glaze', shadeHex(p.glaze || '#2f6f73', 1.3)); g.lathe(0, 0, [[0.04, 0.122], [0.038, 0.13], [0.012, 0.14], [0.014, 0.155], [0, 0.158]], { segs: 12, capBottom: false });
  g.mat('glaze', p.glaze || '#2f6f73'); g.tube([[0.07, 0.04, 0], [0.11, 0.08, 0], [0.125, 0.115, 0]], [0.014, 0.01, 0.007], { segs: 6 });
  g.mat('cane', '#b89a62'); g.tube([[-0.04, 0.12, -0.03], [0, 0.2, 0], [0.04, 0.12, 0.03]], 0.006, { segs: 5 });
  return { cast: false };
});

// a lamp head of the kind the studio takes apart: a turned reflector on a yoke
defineProp('studio.lamphead', (g, p) => {
  g.mat('cast', p.metal || '#7a6a58'); g.lathe(0, 0, [[0.03, 0], [0.05, 0.02], [0.09, 0.08], [0.11, 0.15], [0.105, 0.155], [0.085, 0.085], [0.045, 0.025], [0.025, 0.01]], { segs: 14 });
  g.mat('diffuser', p.lens || '#f4e6c8'); g.cyl(0, 0.145, 0, 0.1, 0.006, { segs: 14 });
  g.mat('cast', '#3a3530'); g.tube([[-0.12, 0.08, 0], [-0.12, -0.03, 0], [0.12, -0.03, 0], [0.12, 0.08, 0]], 0.008, { segs: 5 });
  return { cast: false };
});

export const place = {
  id: 'studio', name: "Oona's studio", order: 50,
  build(game) {
    const f = game.world.frame('candlewick', deckRadius(16), 0, 625);
    const s = game.world.scope('studio', f);
    const g = s.g;
    const rng = new Rng('studio');

    // ================= shell =================
    const ambBefore = s.ambients.length;
    const clip = room(s, {
      x0: X0, z0: Z0, x1: X1, z1: Z1, y: 0, h: H,
      floor: ['planks', '#6e4c34'], ceil: ['paint', '#433d48'],
      wall: { tint: '#e2d6c2', dado: { h: 0.95, mat: 'paint', tint: '#3b3048' }, skirt: '#2a2228' },
      open: { n: false, w: [{ at: 2.5, w: 3.0, h: 1.5, sill: 0.95 }] },
      glow: { sky: '#ffd8b0', ground: '#8a5a40', power: 0.2 },
    });
    const roomAmb = s.ambients.slice(ambBefore);
    // the shop front: low plinth, tall glass, so the court sees the model
    shopfront(s, {
      side: 'n', a0: X0, a1: X1, c: Z0 + 0.08, y: 0, h: H, plinth: 0.32,
      fascia: SIGNS['studio.fascia'], glow: 0.5,
      palette: { frame: '#3b3048', plinth: '#2a2230', awning: [DAWN.violet, '#d4878a', '#d6a640', '#f1e6cf'] },
      door: { at: 1.6, w: 1.1, kind: 'hinge', style: 'panel', tint: '#3b3048' }, awning: { depth: 0.9 },
    });
    // the hanging sign rides above the awning, off the top of the fascia, where Thread Street can see it too
    sign(s, SIGNS['studio.hanging'], 4.1, 2.97, Z0 - 0.55, { face: 'X', double: true, w: 0.5, h: 0.46 });
    s.deco(() => { g.mat('cast', '#2a2622'); g.box(4.08, 3.24, Z0 - 0.85, 4.12, 3.27, Z0 + 0.02); g.box(4.08, 3.0, Z0 - 0.02, 4.12, 3.27, Z0 + 0.02); g.tube([[4.1, 3.24, Z0 - 0.75], [4.1, 3.2, Z0 - 0.75]], 0.004, { segs: 4 }); g.tube([[4.1, 3.24, Z0 - 0.35], [4.1, 3.2, Z0 - 0.35]], 0.004, { segs: 4 }); });
    sign(s, SIGNS['studio.notice'], 4.55, 1.45, Z0 + 0.02, { face: 'z', w: 0.26, h: 0.36 });
    // the side window onto Thread Street
    s.glass(X0 + 0.08, 0.95, 22.5, X0 + 0.08, 2.45, 25.5);
    s.furniture(() => {
      g.mat('paint', '#3b3048');
      for (const zz of [22.5, 23.5, 24.5, 25.5]) g.box(X0, 0.95, zz - 0.035, X0 + 0.2, 2.45, zz + 0.035, { bevel: 0.006 });
      g.box(X0, 2.42, 22.46, X0 + 0.2, 2.5, 25.54, { bevel: 0.008 });
      g.mat('wood', '#7a5638'); g.box(X0 - 0.04, 0.9, 22.4, X0 + 0.34, 0.95, 25.6, { bevel: 0.01 });
    });

    // picture rail, ceiling beams, track, duct, felt baffles
    s.deco(() => {
      g.mat('wood', '#4a3426');
      g.box(WI, 2.22, Z0 + 0.3, WI + 0.025, 2.27, 22.42); g.box(WI, 2.22, 25.58, WI + 0.025, 2.27, Z1 - 0.16); g.box(EI - 0.025, 2.22, Z0 + 0.3, EI, 2.27, 20.68); g.box(EI - 0.025, 2.22, 22.92, EI, 2.27, 23.26); g.box(EI - 0.025, 2.22, 27.54, EI, 2.27, Z1 - 0.16); g.box(X0 + 0.16, 2.22, BI - 0.025, X1 - 0.16, 2.27, BI);
    });
    s.structure(() => {
      g.mat('wood', '#3a2a22');
      for (const x of [5.75, 8.0, 10.25, 12.5, 14.75]) g.box(x - 0.07, H - 0.2, Z0 + 0.1, x + 0.07, H, Z1 - 0.1, { bevel: 0.01, faces: 'xXyzZ' });
      g.mat('wood', '#3a2a22'); g.box(X0 + 0.16, H - 0.16, 25.9, X1 - 0.16, H, 26.06, { faces: 'yzZ' });
    });
    s.deco(() => {
      // the lighting track over the model
      g.mat('brushed', '#2a2a2e'); g.box(7.6, 2.93, AZ - 0.02, 12.3, 2.97, AZ + 0.02);
      for (const x of [7.8, 10.0, 12.1]) g.tube([[x, 2.97, AZ], [x, H, AZ]], 0.006, { segs: 4 });
      // the air duct along the back, on brackets
      g.mat('brushed', '#8a8278'); g.tube([[X0 + 0.2, 2.86, 30.35], [X1 - 0.2, 2.86, 30.35]], 0.14, { segs: 12 });
      g.mat('cast', '#4a4440'); for (let x = 4.6; x < 16.5; x += 2.2) { g.box(x - 0.02, 2.7, 30.2, x + 0.02, H, 30.24); g.tube([[x, 2.72, 30.21], [x, 2.72, 30.5]], 0.01, { segs: 4 }); }
      g.mat('grille', '#cfc6b8'); g.box(9.6, 2.73, 30.2, 10.4, 2.75, 30.5, { faces: 'y' });
      // felt baffles between the beams at the back (the studio is sometimes loud with Suvi)
      g.mat('felt', '#4a3a52');
      for (const x of [6.88, 11.38, 13.62]) g.sheet([x - 0.8, 3.0, 28.6], [x + 0.8, 3.0, 28.6], [x + 0.8, 2.72, 28.6], [x - 0.8, 2.72, 28.6], { nu: 4, nv: 2, sag: 0.02 });
      // cables looping from the track down to the control board
      g.mat('weave', '#1e1c1e'); g.tube([[12.1, 2.94, AZ], [12.2, 2.4, AZ - 0.3], [12.0, 1.4, AZ - 0.55], [11.75, 0.96, AZ - 0.45]], 0.008, { segs: 4 });
    });

    // floor: a worn rug by the model and paint spots
    prop(s, 'rug', 9.9, 0, 23.55, 0, { w: 3.6, d: 1.25, a: '#5b4060', b: '#d6a640' });
    s.deco(() => {
      const cols = [DAWN.violet, '#d4878a', '#d6a640', '#e8e0cc', '#3fb0a8', '#5b4060'];
      for (let i = 0; i < 40; i++) {
        const x = i < 22 ? rng.f(7.6, 12.4) : rng.f(15.2, 16.8), z = i < 22 ? rng.f(24, 26.2) : rng.f(23, 30.4); const r = rng.f(0.008, 0.035);
        g.mat('plain', rng.pick(cols), { rough: -0.3 }); g.cyl(x, 0.001, z, r, 0.002, { segs: 7, r1: r * 0.9 });
      }
    });

    // ================= the model table =================
    const TX0 = 7.9, TX1 = 11.9, TZ0 = 24.3, TZ1 = 25.7, TY = 0.78;
    s.furniture(() => {
      g.mat('wood', '#8a6240', { rough: -0.08 }); g.box(TX0, TY - 0.05, TZ0, TX1, TY, TZ1, { bevel: 0.015 });
      g.mat('wood', '#6f4e33'); g.box(TX0 + 0.1, TY - 0.17, TZ0 + 0.03, TX1 - 0.1, TY - 0.05, TZ0 + 0.06, { bevel: 0.006 }); g.box(TX0 + 0.1, TY - 0.17, TZ1 - 0.06, TX1 - 0.1, TY - 0.05, TZ1 - 0.03, { bevel: 0.006 });
      g.mat('wood', '#5a3a26');
      for (const x of [TX0 + 0.35, TX1 - 0.35]) {
        g.box(x - 0.04, 0.05, TZ0 + 0.12, x + 0.04, TY - 0.05, TZ0 + 0.2, { bevel: 0.008 }); g.box(x - 0.04, 0.05, TZ1 - 0.2, x + 0.04, TY - 0.05, TZ1 - 0.12, { bevel: 0.008 });
        g.box(x - 0.05, 0, TZ0 + 0.06, x + 0.05, 0.06, TZ1 - 0.06, { bevel: 0.01 });
      }
      g.box(TX0 + 0.35, 0.32, AZ - 0.03, TX1 - 0.35, 0.39, AZ + 0.03, { bevel: 0.008 });
      // cradles that hold the model: blocks with felt pads
      for (const x of [8.95, 10.85]) {
        g.mat('wood', '#5a3a26'); g.box(x - 0.05, TY, AZ - 0.3, x + 0.05, AY - R + 0.03, AZ + 0.3, { bevel: 0.01 });
        g.mat('felt', '#8a2f3c'); g.box(x - 0.055, AY - R + 0.02, AZ - 0.2, x + 0.055, AY - R + 0.035, AZ + 0.2);
      }
    });
    s.solid(TX0, 0, TZ0, TX1, AY + R, TZ1, { surf: 'wood' });

    // ================= the model Hollow =================
    s.structure(() => {
      // outside: painted shell with brass ribs
      g.mat('paint', '#3b3048'); band(g, MX0, MX1, R + 0.012, FA, FB, false, 28);
      g.mat('cast', '#b08a45');
      for (let i = 0; i <= 6; i++) { const x = MX0 + 0.02 + (MX1 - MX0 - 0.04) * i / 6; const pts = []; for (let k = 0; k <= 22; k++) pts.push(P(x, R + 0.016, FA + (FB - FA) * k / 22)); g.tube(pts, 0.007, { segs: 5 }); }
      for (const fl of [FA, FB]) g.tube([P(MX0 - 0.012, R + 0.002, fl), P(MX1 + 0.012, R + 0.002, fl)], 0.008, { segs: 6 });
      // inside: the land's ground colour, then its patches
      { const N = 28; for (let i = 0; i < N; i++) {
        const a = FA + (FB - FA) * i / N, b = FA + (FB - FA) * (i + 1) / N, m = (a + b) / 2;
        const k = (0.72 + 0.28 * (0.5 + 0.5 * Math.cos(m))) * (1 - 0.18 * Math.max(0, 1 - Math.min(m - FA, FB - m) / 0.3));
        g.mat('grass', shadeHex('#8aa060', k)); band(g, MX0, MX1, R, a, b, true, 1);
      } }
      // cut edges of the shell
      g.mat('wood', '#5a3a26');
      for (const fl of [FA, FB]) { const a = P(MX0, R - 0.002, fl), b = P(MX1, R - 0.002, fl), c = P(MX1, R + 0.014, fl), d = P(MX0, R + 0.014, fl); quadN(g, a, b, c, d, [0, Math.sin(fl) * (fl > 1 ? -1 : 1), Math.cos(fl)]); quadN(g, a, d, c, b, [0, -Math.sin(fl) * (fl > 1 ? -1 : 1), -Math.cos(fl)]); }
    });
    // land patches: lakes, lawns, orchards, the festival green (near side at the bottom, far bank overhead)
    const patch = (x0, x1, fa, fb, mat, tint, lift) => { g.mat(mat, tint, { rough: mat === 'plain' ? -0.45 : 0 }); band(g, x0, x1, R - 0.002 - (lift || 0), fa * Math.PI / 180, fb * Math.PI / 180, true); };
    s.detail(() => {
      patch(9.3, 10.2, -17, 19, 'sand', '#e0d0a8', 0.0005);          // the lake's shore
      patch(9.35, 10.15, -14, 16, 'plain', '#2f5a78', 0.001);       // the lake, near side
      patch(9.45, 10.05, -9, 10, 'plain', '#3f7090', 0.0015);
      patch(10.3, 11.1, -34, -31, 'plain', '#c8a850', 0.0005);      // crop strips by the orchard
      patch(8.62, 9.2, 54, 62, 'plain', '#b89a48', 0.0005);
      patch(8.62, 9.2, 64, 70, 'plain', '#c8a850', 0.0005);
      patch(10.95, 11.15, 60, 110, 'plain', '#a8b860', 0.0005);
      patch(9.1, 9.5, 178, 198, 'plain', '#c8a850', 0.0005);
      patch(8.75, 9.25, -28, 4, 'grass', '#b0c880');                // lawns
      patch(10.3, 10.95, 18, 44, 'grass', '#b8d488');
      patch(8.7, 9.2, 8, 30, 'plain', '#d8c89a', 0.001);             // the festival green, worn
      patch(9.5, 10.6, 70, 110, 'grass', '#9ab86c');                // the back, up the curve
      patch(8.8, 9.3, 120, 150, 'plain', '#3f6f8a', 0.001);         // a pond on the far side
      patch(9.7, 10.9, 150, 196, 'grass', '#b8d07c');               // the far bank's lawns
      patch(10.05, 10.4, 156, 172, 'plain', '#4f86a0', 0.001);      // the far bank's lake, overhead
      // paths: pale lines along the axis
      for (const fa of [24, 96, 178]) patch(MX0 + 0.05, MX1 - 0.05, fa, fa + 1.2, 'plain', '#efe4c8', 0.0012);
      // a jetty on the near lake and a robe house
      onLand(g, 9.75, 15.2 * Math.PI / 180, 0, (q) => { q.mat('wood', '#7a5638'); q.box(-0.008, 0, -0.06, 0.008, 0.004, 0.0); q.mat('paint', '#e0909a'); q.box(-0.025, 0, 0.0, 0.025, 0.022, 0.03); });
      // long tables on the festival green
      for (let i = 0; i < 4; i++) onLand(g, 8.95, (12 + i * 4.5) * Math.PI / 180, 0.001, (q) => { q.mat('wood', '#8a6240'); q.box(-0.18, 0, -0.005, 0.18, 0.006, 0.005); });
      onLand(g, 8.82, 20 * Math.PI / 180, 0.001, (q) => { q.mat('paint', '#f1e6cf'); q.cyl(0, 0, 0, 0.022, 0.018, { segs: 8 }); q.mat('paint', '#c9552e'); q.cyl(0, 0.018, 0, 0.026, 0.012, { segs: 8, r1: 0.002 }); });
    });
    // orchards: rows of tiny trees, standing toward the axis
    const orchard = (xa, xb, fa, fb, crown) => {
      s.detail(() => {
        for (let x = xa; x <= xb + 1e-6; x += 0.05) for (let a = fa; a <= fb + 1e-6; a += 6.5) {
          const jit = rng.f(-0.006, 0.006);
          onLand(g, x + jit, a * Math.PI / 180, 0, (q) => { q.mat('bark', '#7a6248'); q.cyl(0, 0, 0, 0.003, 0.016, { segs: 4 }); q.mat('felt', crown); q.ball(0, 0.026, 0, 0.015, 0.013, 0.015, { segs: 5, rings: 3 }); });
        }
      });
    };
    orchard(10.3, 11.0, -30, 12, '#6f9a4a');
    orchard(8.75, 9.3, 40, 75, '#7aa050');
    orchard(10.2, 11.0, 118, 145, '#86a85a');
    orchard(8.75, 9.55, 160, 196, '#6a9446');
    // the end walls: terraces climbing toward the axis
    s.structure(() => {
      for (const [xe, sd] of [[MX0, 1], [MX1, -1]]) {
        g.mat('paint', '#3b3048'); annulus(g, xe - sd * 0.012, 0, R + 0.012, FA, FB, -sd);
        const N = 7; let x = xe;
        for (let k = 0; k < N; k++) {
          const r0 = R - k * (R - 0.08) / N, r1 = R - (k + 1) * (R - 0.08) / N;
          g.mat(k % 2 ? 'stone' : 'grass', k % 2 ? '#b0a48e' : '#7a9458'); annulus(g, x, r1, r0, FA, FB, sd);
          const x2 = x + sd * 0.028; g.mat('stone', '#857a68'); if (sd > 0) band(g, x, x2, r1, FA, FB, true, 14); else band(g, x2, x, r1, FA, FB, true, 14);
          x = x2;
        }
        g.mat('stone', '#e2dace'); annulus(g, x, 0, 0.08, FA, FB, sd);
        // the Spindle's hub, then a fine dark axle to where the sunline begins
        g.mat('brushed', '#9a9488'); g.tube([[x, AY, AZ], [x + sd * 0.05, AY, AZ]], 0.02, { segs: 10 });
        g.mat('cast', '#2a2a2e'); g.tube([[x + sd * 0.05, AY, AZ], [sd > 0 ? SUN0 : SUN1, AY, AZ]], 0.0025, { segs: 4 });
        // a fine net at the end: the flying hall
        g.mat('grille', '#d8d0c0'); annulus(g, x + sd * 0.12, 0.004, 0.06, FA, FB, sd); annulus(g, x + sd * 0.12, 0.004, 0.06, FA, FB, -sd);
      }
    });

    // the sunline: one mesh per state of the dawn, shown one at a time
    const rod = (col, em) => dynMesh(s, [(SUN0 + SUN1) / 2, AY, AZ], (q) => {
      q.mat('diffuser', col, em ? { emissive: em } : undefined); q.tube([[SUN0, AY, AZ], [SUN1, AY, AZ]], 0.0075, { segs: 8 });
      q.mat('cast', '#3a3530'); for (const x of [SUN0, SUN1]) q.cyl(x - 0.008, AY - 0.012, AZ, 0.012, 0.024, { segs: 8 });
    }, { radius: 1.4, hidden: true });
    const rods = { rest: rod('#ffe2b8', 3.2), dark: rod('#4a4450', 0), violet: rod(DAWN.violet, 4), rose: rod(DAWN.rose, 5.5), gold: rod(DAWN.gold, 7), white: rod(DAWN.white, 10) };
    // at night the resting line gets a soft sleeve of light, so it is what the court sees through the glass
    const sleeve = dynMesh(s, [(SUN0 + SUN1) / 2, AY, AZ], (q) => { q.mat('diffuser', '#ffe2b8', { emissive: 4, night: true }); q.tube([[SUN0 + 0.01, AY, AZ], [SUN1 - 0.01, AY, AZ]], 0.013, { segs: 8 }); }, { radius: 1.4, hidden: true });
    const showRod = (k) => { for (const n in rods) if (rods[n]) rods[n].userData.hidden = n !== k; };
    showRod('rest');
    const lin = (h, k) => { const c = hexLin(h); return [c[0] * k, c[1] * k, c[2] * k]; };
    const REST = lin('#ffd8a8', 0.4);
    const tube = s.light({ at: [SUN0, AY, AZ], to: [SUN1, AY, AZ], type: 'tube', color: REST.slice(), power: 1, range: 1.6, radius: 0.02, clip: [MX0 - 0.3, TY - 0.05, AZ - 0.9, MX1 + 0.3, AY + R + 0.2, AZ + 0.6] });
    tube.color = REST.slice();
    const farGold = s.light({ at: [(SUN0 + SUN1) / 2, AY + 0.02, AZ], type: 'spot', dir: [0, 1, 0], cone: [62, 40], color: '#f0b850', power: 5, range: 1.3, clip: [MX0, AY + 0.05, AZ - R - 0.1, MX1, AY + R + 0.1, AZ + R + 0.1] });
    farGold.on = false;

    // the dawn's key: four small lamps on a rail at the table's front edge, and a brighter one for the stage that is playing
    const KEYX = [10.56, 10.14, 9.72, 9.3], KEYC = [DAWN.violet, DAWN.rose, DAWN.gold, DAWN.white];
    s.detail(() => {
      g.mat('wood', '#3a2a22'); g.box(9.1, TY, TZ0 + 0.02, 10.76, TY + 0.04, TZ0 + 0.1, { bevel: 0.006 });
      KEYX.forEach((x, i) => {
        g.mat('cast', '#b08a45'); g.cyl(x, TY + 0.04, TZ0 + 0.06, 0.026, 0.014, { segs: 10 });
        g.mat('diffuser', KEYC[i], { emissive: 0.9 }); g.ball(x, TY + 0.075, TZ0 + 0.06, 0.024, 0.024, 0.024, { segs: 10, rings: 6 });
        g.mat('paper', '#efe6d2'); g.box(x - 0.06, TY + 0.001, TZ0 + 0.11, x + 0.06, TY + 0.003, TZ0 + 0.17);
        g.mat('plain', KEYC[i]); g.box(x - 0.045, TY + 0.003, TZ0 + 0.125, x + 0.045, TY + 0.004, TZ0 + 0.145);
      });
    });
    const keyLit = KEYX.map((x, i) => dynMesh(s, [x, TY + 0.06, TZ0 + 0.06], (q) => { q.mat('diffuser', KEYC[i], { emissive: 5 }); q.ball(x, TY + 0.075, TZ0 + 0.06, 0.028, 0.028, 0.028, { segs: 10, rings: 6 }); }, { radius: 0.2, hidden: true }));

    // the control board at the east end of the table: sliders, a dial, a run switch
    s.detail(() => {
      g.mat('paint', '#2a2a30'); g.push(); g.move(11.6, TY, 24.62); g.rotX(-0.35); g.box(-0.24, 0, -0.16, 0.24, 0.05, 0.16, { bevel: 0.01 });
      for (let i = 0; i < 7; i++) { const x = -0.18 + i * 0.06; g.mat('brushed', '#9a9488'); g.box(x - 0.004, 0.05, -0.11, x + 0.004, 0.052, 0.11); g.mat('paint', ['#6a4868', '#e0909a', '#f0b850', '#fff4e0', '#3fb0a8', '#c9552e', '#e8e0cc'][i]); g.box(x - 0.014, 0.05, -0.09 + rng.f(0, 0.16), x + 0.014, 0.068, -0.07 + rng.f(0, 0.12) + 0.02); }
      g.pop();
      g.mat('cast', '#b08a45'); g.cyl(11.82, TY, 24.95, 0.04, 0.03, { segs: 12 }); g.mat('paint', '#e8e0cc'); g.cyl(11.82, TY + 0.03, 24.95, 0.03, 0.004, { segs: 12 });
      g.mat('paint', '#8a2f3c'); g.box(11.4, TY, 25.15, 11.5, TY + 0.06, 25.3, { bevel: 0.01 });
      g.mat('weave', '#1e1c1e'); g.tube([[11.4, TY + 0.03, 25.2], [11.3, TY + 0.01, 25.3], [MX1 + 0.02, AY - 0.1, AZ + 0.2]], 0.006, { segs: 4 });
    });
    // the west end: Oona's rehearsal score on a clipboard, a pencil, her spectacles case, a lidded cup
    s.detail(() => {
      g.mat('wood', '#a07850'); g.box(8.0, TY, 24.45, 8.36, TY + 0.008, 24.95);
      g.mat('paper', '#f1e9d6'); g.box(8.02, TY + 0.008, 24.47, 8.34, TY + 0.012, 24.93);
      for (let i = 0; i < 9; i++) { g.mat('plain', i < 3 ? DAWN.violet : i < 6 ? DAWN.rose : DAWN.gold); g.box(8.05, TY + 0.012, 24.5 + i * 0.045, 8.05 + rng.f(0.08, 0.26), TY + 0.0135, 24.52 + i * 0.045); }
      g.mat('paint', '#c9a040'); g.tube([[8.1, TY + 0.016, 24.98], [8.3, TY + 0.016, 25.05]], 0.004, { segs: 5 });
      g.mat('leather', '#5b4060'); g.box(8.1, TY, 25.25, 8.28, TY + 0.03, 25.33, { bevel: 0.012 });
    });
    prop(s, 'cup', 8.3, TY, 25.5, 0, { glaze: '#d4878a' });
    sign(s, { kind: 'plate', text: 'The Hollow', lines: ['Chervil · rehearsal model'] }, 9.95, TY - 0.11, TZ0 + 0.027, { face: 'z', w: 0.3, h: 0.1 });

    // ================= the score of this year's dawn: three long sheets, one per hour =================
    const scoreSheet = (x0, x1, y, z, seed) => {
      const r = new Rng(seed); const hgt = 0.38;
      g.mat('paper', '#f1e9d6', { rough: 0.1 }); g.box(x0, y, z - 0.006, x1, y + hgt, z, { faces: 'z' });
      g.mat('plain', '#9a9080'); for (let k = 1; k < 6; k++) g.box(x0 + 0.03, y + k * hgt / 6, z - 0.007, x1 - 0.03, y + k * hgt / 6 + 0.002, z - 0.0065, { faces: 'z' });
      for (let k = 0; k < 5; k++) {
        let x = x0 + 0.05;
        while (x < x1 - 0.08) {
          const t = (x - 3.9 + seed * 4.4) / 13.2; const col = t < 0.28 ? mixHex(DAWN.violet, '#4a3048', r.f(0, 0.4)) : t < 0.55 ? mixHex(DAWN.violet, DAWN.rose, smoothstep(0.28, 0.5, t)) : t < 0.82 ? mixHex(DAWN.rose, DAWN.gold, smoothstep(0.55, 0.75, t)) : mixHex(DAWN.gold, DAWN.white, smoothstep(0.82, 0.95, t));
          const w = r.f(0.08, 0.42); if (r.chance(0.82)) { g.mat('plain', col, { rough: -0.1 }); g.box(x, y + k * hgt / 6 + 0.012, z - 0.009, Math.min(x + w, x1 - 0.04), y + (k + 1) * hgt / 6 - 0.012, z - 0.007, { faces: 'z' }); }
          x += w + r.f(0.01, 0.05);
        }
      }
      g.mat('plain', '#c0392b'); for (const xx of [x0 + 0.02, x1 - 0.02]) g.ball(xx, y + hgt - 0.02, z - 0.012, 0.008, 0.008, 0.006, { segs: 6, rings: 4 });
    };
    s.deco(() => { scoreSheet(3.95, 8.35, 1.9, BI, 0); scoreSheet(3.95, 8.35, 1.45, BI, 1); scoreSheet(3.95, 8.35, 1.0, BI, 2); });
    s.deco(() => {
      // pencilled notes in the margin of the second hour
      g.mat('plain', '#4a4440'); g.box(6.0, 1.86, BI - 0.011, 6.25, 1.87, BI - 0.009, { faces: 'z' }); g.box(6.3, 1.4, BI - 0.011, 6.6, 1.41, BI - 0.009, { faces: 'z' });
    });
    sign(s, { kind: 'label', text: 'HOUR ONE · TWO · THREE', ink: '#3b3048' }, 6.15, 2.42, BI - 0.004, { face: 'z', w: 0.9, h: 0.09 });

    // ================= the score table under the window =================
    s.furniture(() => {
      g.mat('wood', '#6f4e33', { rough: -0.05 }); g.box(3.7, 0.74, 22.4, 4.62, 0.78, 25.8, { bevel: 0.012 });
      for (const zz of [22.5, 25.7]) for (const xx of [3.78, 4.54]) g.tube([[xx, 0, zz], [xx, 0.74, zz]], 0.024, { segs: 6 });
      g.box(3.75, 0.2, 22.5, 4.58, 0.23, 25.7, { bevel: 0.006 });
    });
    s.solid(3.66, 0, 22.4, 4.62, 0.78, 25.8, { surf: 'wood' });
    s.detail(() => {
      // sheets laid out, overlapping; one runs off the end and down
      for (let i = 0; i < 4; i++) { const z0 = 22.55 + i * 0.75; g.mat('paper', i % 2 ? '#f1e9d6' : '#ece2cc'); g.box(3.8 + i * 0.03, 0.78 + i * 0.002, z0, 4.32 + i * 0.03, 0.783 + i * 0.002, z0 + 0.9); g.mat('plain', [DAWN.violet, DAWN.rose, DAWN.gold, '#c08060'][i]); for (let k = 0; k < 5; k++) g.box(3.86 + i * 0.03 + k * 0.08, 0.784 + i * 0.002, z0 + 0.08 + k * 0.1, 3.92 + i * 0.03 + k * 0.08, 0.785 + i * 0.002, z0 + 0.3 + k * 0.1); }
      g.mat('paper', '#efe6d0'); g.sheet([4.62, 0.785, 23.3], [4.62, 0.785, 23.75], [4.72, 0.3, 23.75], [4.68, 0.3, 23.3], { nu: 2, nv: 4, sag: 0.0 });
      // rolled scores in a crock, pencils in a jar, a ruler, a lidded cup
      g.mat('glaze', '#8a5a3c'); g.lathe(4.3, 25.5, [[0, 0.78], [0.09, 0.78], [0.1, 0.9], [0.095, 1.06], [0.08, 1.07]], { segs: 12, capTop: false });
      g.mat('paper', '#ece2cc'); for (let i = 0; i < 6; i++) { const a = i * 1.05; g.tube([[4.3 + Math.cos(a) * 0.04, 0.8, 25.5 + Math.sin(a) * 0.04], [4.3 + Math.cos(a) * 0.07, 1.4 + (i % 3) * 0.07, 25.5 + Math.sin(a) * 0.07]], 0.025, { segs: 8 }); }
      g.mat('glaze', '#2f6f73'); g.lathe(3.95, 25.55, [[0, 0.78], [0.03, 0.78], [0.032, 0.88], [0.028, 0.88]], { segs: 10, capTop: false });
      g.mat('paint', '#d6a640'); for (let i = 0; i < 5; i++) g.tube([[3.95, 0.8, 25.55], [3.95 + (i - 2) * 0.012, 0.96, 25.55 + (i % 2) * 0.01]], 0.0035, { segs: 4 });
      g.mat('wood', '#c8a878'); g.box(4.0, 0.785, 22.6, 4.04, 0.79, 23.5);
      // brass weights holding the sheets flat, and a pencil tray
      g.mat('cast', '#b08a45'); for (const [x, z] of [[3.85, 22.7], [4.25, 23.4], [3.9, 24.2], [4.3, 25.0]]) { g.cyl(x, 0.786, z, 0.03, 0.04, { segs: 10 }); g.ball(x, 0.832, z, 0.012, 0.012, 0.012, { segs: 6, rings: 4 }); }
      g.mat('wood', '#5a3a26'); g.box(4.35, 0.78, 24.3, 4.5, 0.8, 24.75, { bevel: 0.005 });
      g.mat('paint', '#2f6f73'); g.box(4.38, 0.8, 24.35, 4.39, 0.81, 24.7); g.mat('paint', '#c9552e'); g.box(4.42, 0.8, 24.38, 4.43, 0.81, 24.68); g.mat('paint', '#d6a640'); g.box(4.46, 0.8, 24.4, 4.47, 0.81, 24.72);
    });
    prop(s, 'stool', 4.95, 0, 24.0, 0, { wood: '#5a3a26' }, { spot: { type: 'sit', tags: ['score'] } });
    prop(s, 'cup', 4.45, 0.78, 22.55, 0, { glaze: '#e8e0cc', lid: '#8a2f3c' });

    // ================= the east wall: swatches, the workbench, pigments =================
    // the pinboard of swatch cards
    s.deco(() => {
      g.mat('rush', '#b89a70'); g.box(EI - 0.02, 1.08, 23.3, EI, 2.82, 27.5, { faces: 'xyYzZ' });
      g.mat('wood', '#4a3426'); g.box(EI - 0.035, 1.05, 23.27, EI, 1.09, 27.53); g.box(EI - 0.035, 2.81, 23.27, EI, 2.85, 27.53);
      const hues = ['#6a4868', '#5b4060', '#7a5070', '#8a5a6a', '#b06a78', '#d4878a', '#e0909a', '#e8a890', '#f0b850', '#d6a640', '#f4d080', '#fff0d0', '#3fb0a8', '#5a8aa8', '#c8402e', '#a0522d'];
      const cr = new Rng('swatch');
      for (let row = 0; row < 9; row++) for (let col = 0; col < 22; col++) {
        if (cr.chance(0.12)) continue;
        const z = 23.42 + col * 0.183 + cr.f(-0.015, 0.015), y = 1.2 + row * 0.18 + cr.f(-0.01, 0.01);
        // the violet cards crowd the bottom rows, gold the top: a dawn read upwards
        const t = (row + cr.f(-1.5, 1.5)) / 9; const hue = hues[Math.max(0, Math.min(hues.length - 1, Math.round(t * 11 + cr.f(-1, 1))))];
        const hue2 = cr.chance(0.1) ? cr.pick(hues) : hue;
        const x = EI - 0.021 - (row * 22 + col) * 0.00004;
        g.mat('paper', '#efe6d2'); g.box(x - 0.002, y, z, x, y + 0.14, z + 0.1, { faces: 'x' });
        g.mat('plain', hue2, { rough: -0.1 }); g.box(x - 0.003, y + 0.045, z + 0.008, x - 0.002, y + 0.132, z + 0.092, { faces: 'x' });
        g.mat('plain', '#5a5048'); g.box(x - 0.003, y + 0.02, z + 0.012, x - 0.002, y + 0.026, z + 0.012 + cr.f(0.03, 0.075), { faces: 'x' });
      }
    });
    // the workbench
    s.furniture(() => {
      g.mat('wood', '#8a6240', { rough: -0.06 }); g.box(16.15, 0.88, 23.35, EI, 0.93, 27.45, { bevel: 0.012 });
      g.mat('paint', '#3b3048'); g.box(16.22, 0.0, 23.4, EI, 0.88, 27.4, { faces: 'xzZ', aoBottom: 0.6 });
      g.mat('paint', '#4a3e58'); for (let i = 0; i < 5; i++) { const z0 = 23.48 + i * 0.78; g.box(16.205, 0.12, z0, 16.22, 0.8, z0 + 0.72, { bevel: 0.006 }); g.mat('cast', '#b08a45'); g.box(16.19, 0.62, z0 + 0.3, 16.205, 0.64, z0 + 0.42); g.mat('paint', '#4a3e58'); }
    });
    s.solid(16.15, 0, 23.35, EI, 0.93, 27.45, { surf: 'wood' });
    const jar = (x, y, z, pig, h, r, lid) => {
      const fill = 0.45 + 0.4 * ((x * 13 + z * 7) % 1);
      g.mat('glaze', mixHex(pig, '#b8c4c0', 0.18), { rough: -0.3 }); g.lathe(x, z, [[0, y], [r * 0.85, y], [r, y + 0.01], [r, y + h * fill]], { segs: 8, capTop: false, capBottom: false });
      g.mat('glaze', '#c8d0cc', { rough: -0.4 }); g.lathe(x, z, [[r, y + h * fill], [r, y + h * 0.82], [r * 0.82, y + h * 0.9], [r * 0.8, y + h * 0.95]], { segs: 8, capTop: false, capBottom: false });
      g.mat(lid === 'cork' ? 'wood' : 'glaze', lid === 'cork' ? '#b08d5e' : (lid || '#2a2622')); g.cyl(x, y + h * 0.93, z, r * 0.84, h * 0.1, { segs: 8 });
    };
    const PIG = ['#5b4060', '#6a4868', '#7a5070', '#8a2f3c', '#c9552e', '#e0909a', '#d6a640', '#f0b850', '#f4e08a', '#3fb0a8', '#2f4f6f', '#3d5a3a', '#a0522d', '#2a2230', '#e8e0cc', '#b06a78'];
    s.detail(() => {
      const r = new Rng('bench');
      // a row of pigment jars at the back of the bench
      for (let i = 0; i < 16; i++) jar(16.7, 0.93, 23.5 + i * 0.13, PIG[i], r.f(0.1, 0.15), r.f(0.035, 0.05), r.pick(['cork', '#2a2622', '#5b4060']));
      // the mortar and pestle, with violet dust in it
      g.mat('stone', '#bdb6aa'); g.lathe(16.45, 24.6, [[0.05, 0.93], [0.09, 0.94], [0.11, 0.99], [0.11, 1.03], [0.09, 1.03], [0.08, 0.98], [0.0, 0.96]], { segs: 16 });
      g.mat('plain', '#5b4060', { rough: 0.3 }); g.cyl(16.45, 0.965, 24.6, 0.08, 0.005, { segs: 12 });
      g.mat('stone', '#cfc8bc'); g.tube([[16.43, 0.97, 24.58], [16.5, 1.13, 24.7]], [0.018, 0.014], { segs: 8 });
      // spatulas, a palette knife, a glass slab with three smears
      g.mat('glaze', '#dde8e4', { rough: -0.4 }); g.box(16.3, 0.93, 25.0, 16.62, 0.938, 25.45);
      for (const [c, zz] of [[DAWN.violet, 25.08], [DAWN.rose, 25.2], [DAWN.gold, 25.33]]) { g.mat('plain', c, { rough: -0.2 }); g.cyl(16.46, 0.938, zz, 0.035, 0.003, { segs: 9 }); }
      g.mat('brushed', '#b8b4ac'); g.box(16.32, 0.94, 25.55, 16.36, 0.944, 25.85); g.mat('wood', '#7a5638'); g.box(16.32, 0.935, 25.85, 16.36, 0.955, 25.97, { bevel: 0.004 });
      // brushes in a pot
      g.mat('glaze', '#c9552e'); g.lathe(16.4, 26.3, [[0, 0.93], [0.045, 0.93], [0.05, 1.04], [0.046, 1.04]], { segs: 10, capTop: false });
      for (let i = 0; i < 7; i++) { const a = i * 0.9; g.mat('wood', i % 2 ? '#c8a878' : '#5b4060'); g.tube([[16.4, 0.95, 26.3], [16.4 + Math.cos(a) * 0.05, 1.18 + r.f(0, 0.06), 26.3 + Math.sin(a) * 0.05]], 0.004, { segs: 4 }); }
      // folded paper twists waiting for pigment
      for (let i = 0; i < 6; i++) { g.mat('paper', '#efe6d2'); g.push(); g.move(16.42 + r.f(-0.05, 0.05), 0.93, 26.7 + i * 0.08); g.rotY(r.f(0, 3)); g.box(-0.025, 0, -0.018, 0.025, 0.012, 0.018, { bevel: 0.004 }); g.pop(); }
      // the scale-less measure: a set of tiny spoons on a ring
      g.mat('brushed', '#c9c4bb'); for (let i = 0; i < 4; i++) g.lathe(16.6, 27.05 + i * 0.07, [[0, 0.932], [0.012 + i * 0.004, 0.935], [0.016 + i * 0.005, 0.945]], { segs: 8, capTop: false });
    });
    // the bruise jar: bigger, older, with its label
    s.detail(() => {
      g.mat('glaze', '#e8e4dc', { rough: -0.4 }); g.lathe(16.45, 23.75, [[0, 0.93], [0.07, 0.93], [0.085, 0.95], [0.085, 1.12], [0.07, 1.15], [0.068, 1.17]], { segs: 16, capTop: false });
      g.mat('plain', '#5b4060', { rough: 0.3 }); g.cyl(16.45, 0.935, 23.75, 0.08, 0.15, { segs: 14 });
      g.mat('glaze', '#3b3048'); g.lathe(16.45, 23.75, [[0.075, 1.165], [0.074, 1.18], [0.03, 1.19], [0.03, 1.21], [0, 1.215]], { segs: 14, capBottom: false });
      g.mat('paper', '#f1e6c8'); g.box(16.364, 0.99, 23.7, 16.37, 1.06, 23.8, { faces: 'x' });
    });
    sign(s, { kind: 'label', text: 'BRUISE', ink: '#3b3048' }, 16.362, 1.025, 23.75, { face: 'x', w: 0.09, h: 0.04 });
    // pigment shelves at the back of the east wall
    for (const zc of [28.3, 29.9]) {
      prop(s, 'shelving', 16.66, 0, zc, -Math.PI / 2, { w: 1.5, h: 2.3, d: 0.32, shelves: 5, wood: '#4a3426' });
      s.detail(() => {
        const r = new Rng('shelf' + zc);
        for (let lv = 0; lv < 5; lv++) {
          const y = 0.08 + lv * (2.3 - 0.11) / 5 + 0.025;
          let z = zc - 0.68;
          while (z < zc + 0.66) { const rr = r.f(0.03, 0.055); if (z + rr * 2 > zc + 0.7) break; if (r.chance(0.1)) { z += 0.08; continue; } jar(16.65 + r.f(-0.04, 0.04), y, z + rr, r.pick(PIG), r.f(0.1, 0.2), rr, r.pick(['cork', '#2a2622', '#3b3048', '#8a2f3c'])); z += rr * 2 + r.f(0.01, 0.03); }
        }
      });
    }

    // ================= Suvi's desk, in the front east corner =================
    s.furniture(() => {
      g.mat('wood', '#6f4e33', { rough: -0.05 }); g.box(16.05, 0.73, 20.55, EI, 0.77, 23.0, { bevel: 0.012 });
      g.mat('paint', '#2f6f73'); g.box(16.1, 0.05, 22.35, EI, 0.73, 22.95, { bevel: 0.01 });
      g.mat('wood', '#5a3a26'); for (const zz of [20.65]) for (const xx of [16.12, 16.76]) g.box(xx - 0.025, 0, zz - 0.025, xx + 0.025, 0.73, zz + 0.025);
      g.mat('paint', '#3fb0a8'); for (let i = 0; i < 3; i++) g.box(16.09, 0.12 + i * 0.2, 22.4, 16.1, 0.29 + i * 0.2, 22.9, { bevel: 0.004 });
    });
    s.solid(16.05, 0, 20.55, EI, 0.77, 23.0, { surf: 'wood' });
    s.detail(() => {
      const r = new Rng('suvi');
      // drifts of paper
      for (let i = 0; i < 9; i++) { g.mat('paper', r.pick(['#f1e9d6', '#e8dcc4', '#f4ecdc', '#e0909a'])); g.push(); g.move(16.42 + r.f(-0.2, 0.2), 0.77 + i * 0.002, 21.0 + r.f(0, 1.6)); g.rotY(r.f(-0.5, 0.5)); g.box(-0.1, 0, -0.14, 0.1, 0.002, 0.14); g.pop(); }
      // a lamp head in pieces, its lens, a coil of cable
      g.mat('diffuser', '#fff0d0'); g.cyl(16.35, 0.78, 22.1, 0.06, 0.008, { segs: 12 });
      g.mat('weave', '#c9552e'); { const pts = []; for (let k = 0; k <= 14; k++) { const a = k / 14 * Math.PI * 2; pts.push([16.65 + Math.cos(a) * 0.08, 0.785, 21.45 + Math.sin(a) * 0.08]); } g.tube(pts, 0.008, { segs: 4, closed: true }); }
      { const pts = []; for (let k = 0; k <= 14; k++) { const a = k / 14 * Math.PI * 2; pts.push([16.65 + Math.cos(a) * 0.065, 0.8, 21.45 + Math.sin(a) * 0.065]); } g.tube(pts, 0.008, { segs: 4, closed: true }); }
      // a tiny practice sunline on a stand, the length of a hand
      g.mat('cast', '#3a3530'); g.box(16.3, 0.77, 21.75, 16.7, 0.79, 21.82); for (const x of [16.33, 16.67]) g.tube([[x, 0.79, 21.785], [x, 0.9, 21.785]], 0.005, { segs: 4 });
      g.mat('diffuser', '#e0909a', { emissive: 3 }); g.tube([[16.33, 0.9, 21.785], [16.67, 0.9, 21.785]], 0.004, { segs: 6 });
      // test cards in a fan, a pencil, sweets in a tin with a lid
      for (let i = 0; i < 6; i++) { g.push(); g.move(16.45, 0.776 + i * 0.001, 20.75); g.rotY(-0.5 + i * 0.18); g.mat('paper', '#efe6d2'); g.box(-0.04, 0, 0, 0.04, 0.002, 0.16); g.mat('plain', [DAWN.violet, '#8a5a6a', DAWN.rose, '#e8a890', DAWN.gold, DAWN.white][i]); g.box(-0.03, 0.002, 0.07, 0.03, 0.003, 0.15); g.pop(); }
      g.mat('cast', '#3fb0a8'); g.cyl(16.75, 0.77, 22.6, 0.05, 0.04, { segs: 12 }); g.mat('cast', '#2f6f73'); g.cyl(16.75, 0.81, 22.6, 0.052, 0.01, { segs: 12 });
    });
    // her desk lamp: an arm with a little shade, and its light
    s.detail(() => {
      g.mat('cast', '#c9552e'); g.cyl(16.7, 0.77, 22.2, 0.06, 0.02, { segs: 10 });
      g.tube([[16.7, 0.79, 22.2], [16.62, 1.2, 22.1], [16.45, 1.28, 21.75]], 0.008, { segs: 5 });
      g.lathe(16.45, 21.75, [[0.07, 1.16], [0.05, 1.22], [0.025, 1.28], [0.015, 1.3]], { segs: 12, capBottom: false });
      g.mat('diffuser', '#ffe8c0', { emissive: 4, lamp: true }); g.cyl(16.45, 1.17, 21.75, 0.03, 0.015, { segs: 8 });
    });
    const roomL0 = s.lights.length;
    lamp(s, 'bulb', 16.45, 1.12, 21.75, { K: 3000, power: 0.32, range: 2.4, clip });
    // her pinboard: notes, a list, a drawing of the middle of the dawn with "fine" written under it
    s.deco(() => {
      g.mat('felt', '#3b3048'); g.box(EI - 0.015, 1.15, 20.7, EI, 2.0, 22.9, { faces: 'xyYzZ' });
      const r = new Rng('pins');
      for (let i = 0; i < 14; i++) { const y = r.f(1.22, 1.85), z = r.f(20.8, 22.7); g.mat('paper', r.pick(['#f1e9d6', '#f4e08a', '#e0909a', '#a9d8c8', '#efe6d2'])); g.box(EI - 0.017 - i * 0.0003, y, z, EI - 0.015, y + r.f(0.08, 0.15), z + r.f(0.08, 0.14), { faces: 'x' }); g.mat('plain', '#c0392b'); g.ball(EI - 0.022, y + 0.09, z + 0.04, 0.006, 0.006, 0.006, { segs: 5, rings: 3 }); }
    });
    sign(s, { kind: 'notice', title: 'The middle', lines: ['Rose to gold: 41 min.', 'Oona says too slow.', 'I say fine.', 'Ivo says nothing,', 'which means fine.'], hand: true }, EI - 0.02, 1.62, 21.2, { face: 'x', w: 0.24, h: 0.34 });
    prop(s, 'chair', 15.6, 0, 21.7, Math.PI / 2, { wood: '#3a2a22', back: 'slat', seat: '#e0909a' }, { spot: { type: 'sit', tags: ['write'], who: 'suvi' } });
    // a satchel slung on the chair back and a crate of bulbs under the desk
    prop(s, 'crate', 16.45, 0, 21.3, 0.1, { w: 0.5, h: 0.3, d: 0.4, wood: '#a08060' });

    // ================= the back wall: the lamp-test wall and its bench =================
    const TW0 = 8.4, TW1 = 13.4;
    s.structure(() => {
      g.mat('panel', '#1e1a22'); g.box(TW0, 1.0, BI - 0.05, TW1, 2.78, BI, { bevel: 0.01, faces: 'zxXyY' });
      g.mat('cast', '#b08a45'); g.box(TW0 - 0.03, 2.78, BI - 0.06, TW1 + 0.03, 2.82, BI, { bevel: 0.006 }); g.box(TW0 - 0.03, 0.96, BI - 0.06, TW1 + 0.03, 1.0, BI, { bevel: 0.006 });
    });
    const testCol = (i, j) => {
      const hues = ['#5b4060', '#6a4868', '#8a5a6a', '#b06a78', '#d4878a', '#e0909a', '#e8a890', '#f0b850', '#d6a640', '#f4d080', '#fff4e0', '#cfe6f0'];
      return j === 3 ? ['#3fb0a8', '#5a8aa8', '#c8402e', '#7aa85a', '#a0522d', '#e8743b', '#9ad0e8', '#d95d7a', '#f2c14e', '#6b8f4e', '#8a2f3c', '#e9e2d0'][i] : hues[(i + j * 2) % hues.length];
    };
    const bulbs = (em, hide) => dynMesh(s, [(TW0 + TW1) / 2, 1.9, BI - 0.1], (q) => {
      for (let j = 0; j < 4; j++) for (let i = 0; i < 12; i++) {
        const x = TW0 + 0.3 + i * (TW1 - TW0 - 0.6) / 11, y = 1.25 + j * 0.42;
        if (em) { q.mat('diffuser', testCol(i, j), { emissive: em }); q.ball(x, y, BI - 0.09, 0.04, 0.04, 0.035, { segs: 8, rings: 5 }); }
        else { q.mat('diffuser', mixHex(testCol(i, j), '#3a3430', 0.55)); q.ball(x, y, BI - 0.09, 0.04, 0.04, 0.035, { segs: 8, rings: 5 }); }
      }
    }, { radius: 3, hidden: hide });
    s.detail(() => {
      for (let j = 0; j < 4; j++) for (let i = 0; i < 12; i++) {
        const x = TW0 + 0.3 + i * (TW1 - TW0 - 0.6) / 11, y = 1.25 + j * 0.42;
        g.mat('cast', '#8a7a60');
        g.push(); g.move(x, y, BI - 0.05); g.rotX(Math.PI / 2); g.cyl(0, 0, 0, 0.055, 0.035, { segs: 10, r1: 0.048, capBottom: false }); g.pop();
        g.mat('paper', '#e8e0cc'); g.box(x - 0.06, y - 0.14, BI - 0.052, x + 0.06, y - 0.1, BI - 0.05, { faces: 'z' });
      }
    });
    const testOn = bulbs(3.5, false), testOff = bulbs(0, true);
    const testLights = [];
    { const n0 = s.lights.length;
      lamp(s, 'bulb', 9.5, 1.9, BI - 0.35, { color: '#e0909a', power: 0.22, range: 2.6, clip, lampFlag: false });
      lamp(s, 'bulb', 11.0, 2.1, BI - 0.35, { color: '#f0b850', power: 0.22, range: 2.6, clip, lampFlag: false });
      lamp(s, 'bulb', 12.4, 1.6, BI - 0.35, { color: '#3fb0a8', power: 0.18, range: 2.4, clip, lampFlag: false });
      for (const l of s.lights.slice(n0)) testLights.push(l); }
    let testIsOn = true;
    // the bench of lamp parts below it
    s.furniture(() => {
      g.mat('wood', '#5a3a26', { rough: -0.05 }); g.box(TW0, 0.82, 30.25, TW1, 0.86, BI, { bevel: 0.01 });
      for (const x of [TW0 + 0.1, (TW0 + TW1) / 2, TW1 - 0.1]) g.box(x - 0.03, 0, 30.3, x + 0.03, 0.82, 30.36, { bevel: 0.006 });
      g.box(TW0 + 0.05, 0.25, 30.3, TW1 - 0.05, 0.28, BI - 0.02);
    });
    s.solid(TW0, 0, 30.25, TW1, 0.86, BI, { surf: 'wood' });
    prop(s, 'studio.lamphead', 8.9, 0.86, 30.55, 0.4, { metal: '#7a6a58' });
    prop(s, 'studio.lamphead', 12.8, 0.86, 30.5, -0.3, { metal: '#b08a45', lens: '#e0909a' });
    prop(s, 'studio.lamphead', 9.5, 0.28, 30.55, 0.1, { metal: '#5a5a60' });
    prop(s, 'crate', 11.0, 0.28, 30.55, 0, { w: 0.6, h: 0.3, d: 0.4, wood: '#b08d5e' });
    prop(s, 'crate', 12.3, 0.28, 30.55, 0.2, { w: 0.5, h: 0.24, d: 0.36, wood: '#8a6a48' });
    s.detail(() => {
      const r = new Rng('parts');
      // lenses stacked, reflectors, a roll of gel, bulbs in a tray, a meter
      for (let i = 0; i < 5; i++) { g.mat('glaze', '#dde8ec', { rough: -0.45 }); g.cyl(9.6, 0.86 + i * 0.012, 30.5, 0.07 - i * 0.004, 0.011, { segs: 14 }); }
      g.mat('wood', '#7a5638'); g.box(10.0, 0.86, 30.35, 10.6, 0.9, 30.7, { bevel: 0.006 });
      for (let i = 0; i < 12; i++) { g.mat('diffuser', r.pick(['#fff0d0', '#ffe0b0', '#f0e8ff']), { rough: -0.3 }); g.ball(10.06 + (i % 6) * 0.1, 0.92, 30.42 + Math.floor(i / 6) * 0.15, 0.03, 0.04, 0.03, { segs: 8, rings: 6 }); }
      g.mat('paper', '#e0909a', { emissive: 0.25 }); g.tube([[10.9, 0.92, 30.4], [11.5, 0.92, 30.4]], 0.05, { segs: 12 });
      g.mat('paper', '#f0b850', { emissive: 0.25 }); g.tube([[10.9, 0.97, 30.6], [11.4, 0.97, 30.6]], 0.045, { segs: 12 });
      g.mat('paint', '#2a2a30'); g.box(11.8, 0.86, 30.35, 12.1, 1.0, 30.6, { bevel: 0.01 }); g.mat('paint', '#f1e6cf'); g.box(11.85, 0.93, 30.348, 12.05, 0.98, 30.352, { faces: 'z' });
      g.mat('plain', '#c0392b'); g.box(11.95, 0.935, 30.346, 11.955, 0.975, 30.35, { faces: 'z' });
      g.mat('weave', '#1e1c1e'); { const pts = []; for (let k = 0; k <= 16; k++) { const a = k / 16 * Math.PI * 2; pts.push([13.1 + Math.cos(a) * 0.12, 0.87, 30.55 + Math.sin(a) * 0.12]); } g.tube(pts, 0.01, { segs: 4, closed: true }); }
      { const pts = []; for (let k = 0; k <= 16; k++) { const a = k / 16 * Math.PI * 2; pts.push([13.1 + Math.cos(a) * 0.1, 0.89, 30.55 + Math.sin(a) * 0.1]); } g.tube(pts, 0.01, { segs: 4, closed: true }); }
    });

    // ================= a lamp trolley between the tables, and Oona's coat stand by the door =================
    s.furniture(() => {
      const tx = 6.9, tz = 26.7;
      g.mat('cast', '#3b3048'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.tube([[tx + sx * 0.32, 0.08, tz + sz * 0.22], [tx + sx * 0.32, 0.86, tz + sz * 0.22]], 0.012, { segs: 5 });
      g.mat('wood', '#8a6240'); g.box(tx - 0.36, 0.84, tz - 0.26, tx + 0.36, 0.87, tz + 0.26, { bevel: 0.006 }); g.box(tx - 0.36, 0.3, tz - 0.26, tx + 0.36, 0.33, tz + 0.26, { bevel: 0.006 });
      g.mat('cast', '#2a2622'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { g.push(); g.move(tx + sx * 0.32, 0.04, tz + sz * 0.22); g.rotZ(Math.PI / 2); g.cyl(0, -0.015, 0, 0.04, 0.03, { segs: 10 }); g.pop(); }
    });
    s.solid(6.52, 0, 26.42, 7.28, 0.87, 26.98, { surf: 'wood' });
    prop(s, 'studio.lamphead', 6.75, 0.87, 26.65, 0.8, { metal: '#b08a45', lens: '#f0b850' });
    prop(s, 'studio.lamphead', 7.05, 0.33, 26.7, -0.6, { metal: '#7a6a58', lens: '#e0909a' });
    s.detail(() => {
      g.mat('paint', '#2a2a30'); g.box(6.98, 0.87, 26.55, 7.22, 0.95, 26.85, { bevel: 0.01 }); g.mat('diffuser', '#f0b850', { emissive: 2 }); g.box(7.0, 0.95, 26.6, 7.03, 0.953, 26.63);
      g.mat('weave', '#1e1c1e'); g.tube([[7.1, 0.9, 26.85], [7.3, 0.6, 27.0], [7.5, 0.01, 27.2], [8.3, 0.01, 26.4], [8.8, 0.01, 25.9], [9.0, 0.3, 25.7]], 0.008, { segs: 4 });
      // the coat stand by the door, with Oona's shawl in gold and bruise
      g.mat('wood', '#3a2a22'); g.lathe(4.05, 20.65, [[0.2, 0], [0.18, 0.03], [0.03, 0.06], [0.025, 1.75], [0.03, 1.8]], { segs: 10 });
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; g.tube([[4.05, 1.65, 20.65], [4.05 + Math.cos(a) * 0.15, 1.72, 20.65 + Math.sin(a) * 0.15]], 0.012, { segs: 4 }); }
      g.mat('knit', '#5b4060'); g.sheet([3.92, 1.7, 20.58], [4.18, 1.7, 20.72], [4.2, 0.9, 20.8], [3.88, 0.95, 20.6], { nu: 3, nv: 5, ripple: 0.03 });
      g.mat('weave', '#d6a640'); g.sheet([3.95, 1.72, 20.78], [4.15, 1.72, 20.55], [4.16, 1.25, 20.5], [3.93, 1.2, 20.78], { nu: 3, nv: 3, ripple: 0.02 });
    });
    s.post(4.05, 20.65, 0.2, 0, 1.8);

    // ================= the back east corner: a plan chest of old scores, and this year's poster =================
    s.furniture(() => {
      g.mat('wood', '#4a3426', { rough: -0.05 }); g.box(13.7, 0, 30.05, 16.3, 0.95, BI, { bevel: 0.012, aoBottom: 0.6 });
      for (let i = 0; i < 6; i++) { const y0 = 0.08 + i * 0.145; g.mat('wood', i % 2 ? '#5a4030' : '#563c2c'); g.box(13.78, y0, 30.03, 16.22, y0 + 0.125, 30.06, { bevel: 0.005 }); g.mat('cast', '#b08a45'); g.box(14.85, y0 + 0.05, 30.0, 15.15, y0 + 0.07, 30.03); }
    });
    s.solid(13.7, 0, 30.05, 16.3, 0.95, BI, { surf: 'wood' });
    s.detail(() => {
      const r = new Rng('chest');
      for (let i = 0; i < 7; i++) { g.mat('paper', r.pick(['#ece2cc', '#f1e9d6', '#e0d4b8'])); const z = 30.2 + (i % 3) * 0.15, x0 = 13.85 + r.f(0, 0.3); g.tube([[x0, 0.98 + Math.floor(i / 3) * 0.05, z], [x0 + r.f(0.9, 1.6), 0.98 + Math.floor(i / 3) * 0.05, z]], 0.025, { segs: 8 }); g.mat('weave', '#8a2f3c'); g.cyl(x0 + 0.4, 0.98 + Math.floor(i / 3) * 0.05 - 0.026, z, 0.027, 0.012, { segs: 8 }); }
      // a clock: the dawn is played by the minute
      g.mat('wood', '#3a2a22'); g.push(); g.move(15.0, 2.62, BI - 0.02); g.rotX(Math.PI / 2); g.cyl(0, 0, 0, 0.17, 0.03, { segs: 20 }); g.pop();
      g.mat('paint', '#efe6d2'); g.push(); g.move(15.0, 2.62, BI - 0.051); g.rotX(Math.PI / 2); g.cyl(0, 0, 0, 0.15, 0.002, { segs: 20 }); g.pop();
      g.mat('plain', '#2a2622'); g.box(14.995, 2.62, BI - 0.056, 15.005, 2.73, BI - 0.053); g.box(15.0, 2.615, BI - 0.056, 15.08, 2.625, BI - 0.053);
    });
    // an easel by the front with a big colour study of the far bank going gold
    s.detail(() => {
      const ex = 14.6, ez = 21.6;
      g.mat('wood', '#7a5638'); g.tube([[ex - 0.35, 0, ez + 0.15], [ex - 0.08, 1.85, ez - 0.02]], 0.02, { segs: 5 }); g.tube([[ex + 0.35, 0, ez + 0.15], [ex + 0.08, 1.85, ez - 0.02]], 0.02, { segs: 5 }); g.tube([[ex, 0, ez - 0.45], [ex, 1.7, ez - 0.05]], 0.018, { segs: 5 });
      g.box(ex - 0.45, 0.78, ez + 0.06, ex + 0.45, 0.82, ez + 0.14, { bevel: 0.006 });
      g.push(); g.move(ex, 0.82, ez + 0.1); g.rotX(-0.09);
      g.mat('paper', '#2a2230'); g.box(-0.4, 0, -0.012, 0.4, 0.62, 0.0);
      const bands = ['#f4d080', '#f0b850', '#d4878a', '#8a5a6a', '#5b4060', '#3a2a40', '#2a2230'];
      bands.forEach((c, i) => { g.mat('plain', c); g.box(-0.38, 0.6 - (i + 1) * 0.08, 0.0, 0.38, 0.6 - i * 0.08 - 0.004, 0.003); });
      g.pop();
    });
    s.post(14.6, 21.6, 0.3, 0, 1.9);

    sign(s, SIGNS['poster.dawn'], 15.0, 1.75, BI - 0.003, { face: 'z', w: 0.7, h: 1.0 });
    sign(s, { kind: 'poster', title: 'The Long Dusk', lines: ['Oona · twelve years ago', 'Played once'], palette: ['#1f2b5c', '#f0b850', '#e0909a'], motif: 'dawn' }, 14.1, 1.6, BI - 0.003, { face: 'z', w: 0.42, h: 0.6 });
    sign(s, { kind: 'poster', title: 'Green Hour', lines: ['Ivo Rautio', 'Dawn of the refuge year'], palette: ['#2a3a2a', '#d6e8b0', '#7aa85a'], motif: 'dawn' }, 15.9, 1.6, BI - 0.003, { face: 'z', w: 0.42, h: 0.6 });

    // ================= a bench for visitors at the front, facing the model, and a stage lamp on a tripod =================
    prop(s, 'bench', 10.0, 0, 21.35, 0, { w: 1.9, back: true, wood: '#3b3048', metal: '#2a2622' }, { spot: { type: 'sit', tags: ['watch'] } });
    s.detail(() => { g.mat('knit', '#e0909a'); g.box(9.25, 0.46, 21.2, 10.5, 0.52, 21.52, { bevel: 0.025 }); g.mat('knit', '#d6a640'); g.box(10.5, 0.46, 21.22, 10.9, 0.53, 21.5, { bevel: 0.025 }); });
    s.detail(() => {
      const bx = 12.75, bz = 22.6;
      g.mat('cast', '#2a2622');
      for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + 0.3; g.tube([[bx + Math.cos(a) * 0.38, 0, bz + Math.sin(a) * 0.38], [bx, 1.15, bz]], 0.014, { segs: 5 }); }
      g.tube([[bx, 1.15, bz], [bx, 1.7, bz]], 0.018, { segs: 6 });
      g.push(); g.move(bx, 1.75, bz); g.rotY(0.66); g.rotZ(Math.PI / 2 + 0.2);
      g.mat('cast', '#3b3048'); g.lathe(0, 0, [[0.04, -0.12], [0.07, -0.1], [0.13, 0.04], [0.16, 0.18], [0.155, 0.19], [0.12, 0.05], [0.05, -0.08]], { segs: 14 });
      g.mat('diffuser', '#f4e6c8'); g.cyl(0, 0.17, 0, 0.14, 0.008, { segs: 14 });
      g.mat('cast', '#2a2622'); g.tube([[0, -0.1, -0.2], [0, 0.03, -0.2], [0, 0.03, 0.2], [0, -0.1, 0.2]], 0.01, { segs: 5 });
      g.pop();
      g.mat('weave', '#1e1c1e'); g.tube([[bx, 1.6, bz], [bx + 0.2, 0.4, bz + 0.3], [bx + 0.5, 0.01, bz + 0.6], [bx + 1.4, 0.01, bz + 0.9], [16.2, 0.01, 23.2]], 0.008, { segs: 4 });
    });
    s.post(12.75, 22.6, 0.3, 0, 1.9);

    // ================= gels and filters on rods, hung from the ceiling =================
    s.deco(() => {
      const r = new Rng('gels');
      const GEL = ['#e0607a', '#f2a33a', '#7a5aa8', '#3fb0a8', '#f4e08a', '#c8402e', '#6a4868', '#9ad0e8', '#e0909a', '#f0b850', '#d95d7a', '#5a8aa8'];
      for (const [zz, k0] of [[25.95, 0], [26.75, 3], [27.55, 6]]) {
        g.mat('brushed', '#5a5650'); g.tube([[13.2, 2.96, zz], [16.0, 2.96, zz]], 0.012, { segs: 6 });
        for (const x of [13.3, 15.9]) g.tube([[x, 2.96, zz], [x, H, zz]], 0.004, { segs: 4 });
        let x = 13.3, k = k0;
        while (x < 15.8) {
          const w = r.f(0.35, 0.55), bot = r.f(2.25, 2.45); const x1 = Math.min(15.9, x + w);
          g.mat('paper', GEL[k % GEL.length], { emissive: 0.55, rough: -0.4 });
          g.sheet([x, 2.95, zz + 0.01], [x1, 2.95, zz + 0.01], [x1, bot, zz + 0.02], [x, bot, zz + 0.02], { nu: 3, nv: 2, ripple: 0.012, rippleN: 2 });
          g.mat('cast', '#2a2622'); g.box(x + 0.02, 2.93, zz - 0.012, x + 0.05, 2.97, zz + 0.012); g.box(x1 - 0.05, 2.93, zz - 0.012, x1 - 0.02, 2.97, zz + 0.012);
          x = x1 + r.f(0.03, 0.1); k++;
        }
      }
      // small framed filters hanging on hooks off the end rod
      for (let i = 0; i < 4; i++) { const x = 13.5 + i * 0.6; g.mat('cast', '#2a2622'); g.tube([[x, 2.95, 28.2], [x, 2.6, 28.2]], 0.003, { segs: 3 }); g.box(x - 0.13, 2.32, 28.19, x + 0.13, 2.6, 28.21); g.mat('paper', GEL[(i * 5) % GEL.length], { emissive: 0.6, rough: -0.4 }); g.box(x - 0.11, 2.34, 28.186, x + 0.11, 2.58, 28.214); }
    });
    lamp(s, 'bulb', 14.6, 2.25, 26.75, { color: '#e07080', power: 0.18, range: 3.2, clip });

    // ================= the west back corner: day bed, tea, and the River sketches =================
    prop(s, 'rug', 4.75, 0, 28.1, Math.PI / 2, { w: 2.6, d: 1.9, a: '#2f4f6f', b: '#c9552e' });
    prop(s, 'studio.daybed', WI + 0.42, 0, 28.1, Math.PI / 2, {}, { spot: { type: 'sit', tags: ['rest', 'tea'] } });
    prop(s, 'table', 5.05, 0, 26.55, 0, { round: true, w: 0.55, h: 0.52, wood: '#5a3a26' });
    prop(s, 'studio.teapot', 5.05, 0.52, 26.55, 0.5, { glaze: '#2f6f73' });
    prop(s, 'cup', 4.9, 0.52, 26.7, 0, { glaze: '#d6a640' }); prop(s, 'cup', 5.2, 0.52, 26.68, 0, { glaze: '#e0909a', lid: '#5b4060' });
    s.detail(() => { g.mat('cast', '#3fb0a8'); g.cyl(5.12, 0.52, 26.4, 0.045, 0.06, { segs: 12 }); g.mat('cast', '#2f6f73'); g.cyl(5.12, 0.58, 26.4, 0.047, 0.012, { segs: 12 }); });
    prop(s, 'chair', 6.15, 0, 28.2, -Math.PI / 2, { wood: '#6b4a2f', seat: '#5b4060' }, { spot: { type: 'sit', tags: ['visit', 'tea'] } });
    prop(s, 'plant', 4.0, 0, 30.4, 0, { kind: 'fern', size: 1.0, pot: '#5b4060' });
    prop(s, 'plant', 7.4, 0, 30.45, 0, { kind: 'broad', size: 1.3, pot: '#c9552e' });
    // the River sketches above the day bed: brown-violet bands with dark rifts, and the first one, in crayon
    s.deco(() => {
      const r = new Rng('river');
      const sk = [[26.0, 1.62, 0.62, 0.46], [26.7, 1.3, 0.5, 0.36], [26.75, 1.75, 0.44, 0.38], [27.3, 1.25, 0.7, 0.5], [28.1, 1.85, 0.3, 0.24], [27.3, 1.82, 0.68, 0.32], [28.45, 1.25, 0.62, 0.52], [29.15, 1.3, 0.5, 0.38], [28.5, 1.85, 0.56, 0.34], [29.2, 1.75, 0.66, 0.44], [29.95, 1.28, 0.62, 0.42], [30.0, 1.78, 0.52, 0.4], [26.1, 1.17, 0.5, 0.0]].filter((a) => a[3] > 0);
      sk.forEach(([z, y, w, h], i) => {
        const x = WI + 0.004 + i * 0.0006;
        g.mat('paper', i === 4 ? '#efe2c0' : '#ece4d4'); g.box(x, y, z, x + 0.002, y + h, z + w, { faces: 'X' });
        if (i === 4) {      // the crayon one: a wobbly purple-brown blob on a black page edge, done at eight
          g.mat('plain', '#1e1a22'); g.box(x + 0.002, y + 0.03, z + 0.03, x + 0.003, y + h - 0.03, z + w - 0.03, { faces: 'X' });
          g.mat('plain', '#7a4a60'); for (let k = 0; k < 6; k++) g.box(x + 0.003, y + 0.12 + k * 0.018 + r.f(-0.01, 0.01), z + 0.06 + r.f(0, 0.04), x + 0.004, y + 0.135 + k * 0.018, z + w - 0.06 - r.f(0, 0.06), { faces: 'X' });
        } else {
          const n = 7; for (let k = 0; k < n; k++) {
            const yy = y + 0.03 + k * (h - 0.06) / n, col = mixHex('#3a2438', r.pick(['#9a6a78', '#7a5a68', '#a07888', '#6a4858']), r.f(0.1, 1));
            g.mat('plain', col, { rough: 0.2 }); g.box(x + 0.002, yy, z + 0.025, x + 0.003, yy + (h - 0.06) / n + 0.002, z + w - 0.025, { faces: 'X' });
            if (r.chance(0.6)) { g.mat('plain', '#231a24'); const z0 = z + r.f(0.05, w * 0.5); g.box(x + 0.003, yy + r.f(0.005, 0.02), z0, x + 0.004, yy + r.f(0.025, 0.035), Math.min(z + w - 0.03, z0 + r.f(0.06, w * 0.6)), { faces: 'X' }); }
          }
        }
        g.mat('plain', '#c0392b'); g.ball(x + 0.008, y + h - 0.02, z + w / 2, 0.007, 0.007, 0.007, { segs: 5, rings: 3 });
      });
    });
    lamp(s, 'sconce', WI + 0.02, 2.0, 27.0, { face: 'X', K: 2700, power: 0.6, clip });

    // ================= ceiling light over the model and the room =================
    lamp(s, 'spot', 7.8, 2.95, AZ - 0.3, { K: 3000, power: 0.45, range: 4.2, clip, cone: [38, 18], dir: [0.4, -1, 0.15] });
    lamp(s, 'spot', 12.1, 2.95, AZ - 0.3, { K: 3000, power: 0.45, range: 4.2, clip, cone: [38, 18], dir: [-0.4, -1, 0.15] });
    // the swatch wall washed at 4000 K so the colours can be judged
    lamp(s, 'spot', 15.4, H - 0.03, 24.4, { K: 4000, power: 0.4, range: 4, clip, cone: [50, 25], dir: [0.7, -0.6, 0.15] });
    lamp(s, 'spot', 15.4, H - 0.03, 26.6, { K: 4000, power: 0.4, range: 4, clip, cone: [50, 25], dir: [0.7, -0.6, -0.1] });
    // a pendant over the score table
    lamp(s, 'globe', 4.25, 2.15, 24.1, { K: 2800, power: 0.55, range: 4, clip, drop: 1.0, r: 0.13 });
    // a warm pendant over the tea corner
    lamp(s, 'lantern', 5.4, 2.25, 27.4, { tint: '#e0909a', power: 0.45, clip, drop: 0.8 });
    const roomLights = s.lights.slice(roomL0).filter((l) => testLights.indexOf(l) < 0);

    // ================= people =================
    s.spot('work', 8.3, 0, 24.0, Math.PI, { tags: ['paint', 'rehearse'], who: 'oona' });
    s.spot('work', 11.85, 0, 24.0, Math.PI, { tags: ['paint', 'sunline'], who: 'suvi' });
    s.spot('work', 15.9, 0, 23.9, Math.PI / 2, { tags: ['mix', 'grind'] });
    s.spot('work', 10.9, 0, 29.8, Math.PI, { tags: ['lamps', 'mend'] });
    s.spot('work', 5.0, 0, 25.1, -Math.PI / 2, { tags: ['write', 'score'] });
    for (const [x, z, yaw] of [[9.1, 23.55, Math.PI], [9.95, 23.45, Math.PI], [10.8, 23.6, Math.PI], [12.6, 24.4, -1.9], [14.6, 24.8, Math.PI / 2], [14.8, 28.6, Math.PI / 2], [11.2, 28.9, Math.PI], [6.6, 29.6, -2.6], [6.6, 22.0, Math.PI]]) s.spot('stand', x, 0, z, yaw, { tags: ['look'] });
    s.spot('chat', 12.9, 0, 27.8, -2.4, { tags: ['studio'] }); s.spot('chat', 12.2, 0, 28.6, 0.6, { tags: ['studio'] }); s.spot('chat', 13.3, 0, 28.8, -0.9, { tags: ['studio'] });
    s.path([[5.65, 17.6], [5.65, 20.0], [5.65, 22.6], [7.6, 23.4], [10.0, 23.45], [12.4, 23.6], [14.4, 24.6], [14.6, 28.9], [11.0, 29.5], [7.2, 29.2], [6.2, 26.0], [5.65, 22.6]], { width: 1.2 });
    s.path([[12.4, 23.6], [12.3, 26.0], [11.0, 29.5]], { width: 1.0 });

    // ================= things to do =================
    const run = { on: false, t: 0, said: 0 };
    const KEYS = [   // time (s), tube colour (linear, already scaled), far-bank gold, which rod
      [0, REST], [2, lin('#201820', 0.05)], [3, lin(DAWN.violet, 3.0)], [8, lin(DAWN.violet, 3.6)], [11, lin(DAWN.rose, 4.0)], [13, lin(DAWN.rose, 4.6)],
      [14, lin('#3a2a20', 0.25)], [20, lin('#4a3828', 0.4)], [21.5, lin(DAWN.white, 7)], [24, lin(DAWN.white, 7)], [26, REST],
    ];
    const DUR = 26;
    const rodAt = (t) => t < 2 ? 'dark' : t < 9.5 ? 'violet' : t < 13.5 ? 'rose' : t < 20.5 ? 'gold' : t < 24.5 ? 'white' : 'rest';
    const keyAt = (t) => t < 2 ? -1 : t < 9.5 ? 0 : t < 13.5 ? 1 : t < 20.5 ? 2 : t < 24.5 ? 3 : -1;
    const LINES = [
      [0.2, 'suvi', 'Lights down. From the top.'],
      [2.6, 'oona', 'The River first. Brown-violet, the dust at its edges. I saw it once, at eight.'],
      [8.6, 'oona', 'Now it warms. Rose, slowly. On the day that is the best part of an hour.'],
      [13.8, 'suvi', 'Far bank first. Twenty minutes of gold up there while we are still in the dark down here.'],
      [20.8, 'oona', 'And then it is an ordinary morning.'],
    ];
    let roomK = 1;
    every(s, (dt, game) => {
      let target = 1;
      if (run.on) {
        run.t += dt; const t = run.t;
        // blend the axis light between keys
        let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] <= t) i++;
        const a = KEYS[i], b = KEYS[Math.min(i + 1, KEYS.length - 1)]; const u = b[0] > a[0] ? smoothstep(a[0], b[0], t) : 1;
        for (let k = 0; k < 3; k++) tube.color[k] = lerp(a[1][k], b[1][k], u);
        const gold = t > 13.6 && t < 20.6; farGold.on = gold; farGold.scale = gold ? smoothstep(13.6, 15, t) * (1 - smoothstep(19.6, 20.6, t)) : 0;
        showRod(rodAt(t)); const kk = keyAt(t); keyLit.forEach((m, j) => { if (m) m.userData.hidden = j !== kk; });
        while (run.said < LINES.length && LINES[run.said][0] <= t) { const L = LINES[run.said++]; if (game.ui && game.ui.subtitle) game.ui.subtitle(speaker(L[1]), L[2], 5); }
        if (game.audio && game.audio.musicParam) game.audio.musicParam('progress', Math.min(1, t / 24));
        target = t > 0.5 && t < 24.5 ? 0.1 : 1;
        if (t >= DUR) {
          run.on = false; showRod('rest'); farGold.on = false; for (let k = 0; k < 3; k++) tube.color[k] = REST[k];
          if (game.audio && game.audio.music) game.audio.music(null, { fade: 3 });
          found(game, 'painted-dawn');
          talk(game, 'oona', [game.clock.day === 3 && game.clock.hours > 9 ? 'That is what they saw this morning. The middle was too slow.' : 'Too slow in the middle.', game.clock.day === 3 && game.clock.hours > 9 ? 'Next year I will fix it.' : 'Suvi, again from the rose. Our guest can stay.']);
        }
      }
      else { const h = game.clock ? game.clock.hours : 12, nt = h >= 20 || h < 6.5, nk = h >= 23 || h < 6.5 ? 2.6 : 1; for (let k = 0; k < 3; k++) tube.color[k] = REST[k] * nk; if (sleeve) sleeve.userData.hidden = !nt; }
      if (run.on && sleeve) sleeve.userData.hidden = true;
      roomK = damp(roomK, target, 1.6, dt);
      for (const l of roomLights) l.scale = roomK;
      for (const am of roomAmb) am.scale = 0.06 + 0.94 * roomK;
    });
    s.interact({ x: 11.6, y: 0.95, z: 24.55, radius: 1.3, wide: true,
      prompt: (gm) => gm.clock && gm.clock.day === 3 && gm.clock.hours > 9 ? "Run this morning's dawn again" : 'Run the dawn on the model',
      enabled: () => !run.on,
      onUse(gm) {
        run.on = true; run.t = 0; run.said = 0;
        if (gm.audio) { gm.sfxAt('lamp-click', f, 11.6, 0.9, 24.6); if (gm.audio.music) gm.audio.music('dawn', { vol: 0.45, fade: 2 }); }
      } });
    s.interact({ x: 9.95, y: 1.3, z: 24.3, radius: 1.5, prompt: 'Look into the model Hollow',
      onUse: (gm) => talk(gm, 'The model Hollow', ['The whole Hollow, two and a half metres long, cut open along one side. The lake is the size of a plate and the orchard trees are the size of peas.', 'The far bank hangs overhead, upside down, painted first. The sunline down the middle is nearly two metres long and stops short of each end wall, as the real one does.', 'The four little lamps at the front give the order: brown-violet, rose, gold, white.']) });
    s.interact({ x: 16.4, y: 1.8, z: 25.4, radius: 1.6, prompt: 'Read the swatch cards',
      onUse: (gm) => talk(gm, 'The swatch wall', ['Hundreds of cards, each a lamp colour with a date and a name in pencil.', '"The rose from the year of the refuge." "Gold, far bank only, too early." "Lake at nine, Ivo\'s." "Bruise, attempt three hundred and twelve."', 'The bruise cards go furthest back. The oldest is from the year she was fifteen, and it is a little too red.']) });
    s.interact({ x: 16.45, y: 1.05, z: 23.75, radius: 1.2, prompt: (gm) => gm.flags && gm.flags['item:bruise-twist'] ? 'Lift the lid on the bruise jar' : 'Lift the lid on the jar marked bruise',
      async onUse(gm) {
        if (gm.audio) gm.sfxAt('lid-up', f, 16.45, 1.2, 23.75);
        if (gm.flags && gm.flags['item:bruise-twist']) { await talk(gm, 'The bruise jar', ['Brown-violet, ground fine. The lid squeaks. It is still bruise.']); return; }
        await talk(gm, 'oona', ['Bruise. The back crews call it that. The dust at the River\'s edges.', 'Take a pinch. Fold it in the paper and keep it dry.']);
        give(gm, 'bruise-twist');
      } });
    s.interact({ x: 6.15, y: 1.45, z: BI - 0.1, radius: 1.8, prompt: 'Read the score of the dawn',
      onUse: (gm) => talk(gm, 'The score', ['A dawn written like music: three long sheets, one for each hour, ruled in lanes for the sunline, the far bank, the near bank and the lake.', 'The bars run brown-violet, then rose, then gold, then white.', 'In the middle of the second sheet someone has pencilled "too slow". Underneath, in another hand: "no it isn\'t".']) });
    s.interact({ x: WI + 0.1, y: 1.8, z: 28.3, radius: 1.8, prompt: 'Look at the sketches of the River',
      onUse: (gm) => talk(gm, 'Sketches of the River', ['Brown-violet bands with dark rifts through them: the dust lanes at the River\'s frayed edges, the way it looks through a Window.', 'They are dated over seventy years. The colours get closer.', 'The one in the middle is wax crayon on black paper, done by somebody who was eight.']) });
    s.interact({ x: 16.45, y: 0.85, z: 20.85, radius: 1.3, prompt: (gm) => gm.flags && gm.flags['item:lamp-card'] ? 'Look at the test cards' : 'Take one of the test cards',
      async onUse(gm) {
        if (gm.flags && gm.flags['item:lamp-card']) { await talk(gm, 'Test cards', ['Swatches from brown-violet to gold, the middle three crossed out in pencil on every one.']); return; }
        await talk(gm, 'suvi', ['Take one. She crossed out the middle three.', 'I would have crossed out none. Do not tell her I said so.']);
        give(gm, 'lamp-card');
      } });
    s.interact({ x: 11.0, y: 1.6, z: BI - 0.4, radius: 1.8, prompt: (gm) => testIsOn ? 'Switch off the test lamps' : 'Switch on the test lamps',
      onUse(gm) {
        testIsOn = !testIsOn; if (testOn) testOn.userData.hidden = !testIsOn; if (testOff) testOff.userData.hidden = testIsOn; for (const l of testLights) l.on = testIsOn;
        if (gm.audio) gm.sfxAt('lamp-click', f, 11, 1.5, BI - 0.2);
        if (testIsOn && gm.ui) gm.ui.toast('Forty-eight mixes, each one kept because it was nearly right.', { kind: 'info' });
      } });
    s.interact({ x: WI + 0.45, y: 0.6, z: 28.1, radius: 1.3, prompt: 'Sit on the day bed',
      onUse(gm) { if (gm.player && gm.player.sit) gm.player.sit({ x: WI + 0.5, y: 0, z: 28.3, yaw: Math.PI / 2 }); } });
    s.interact({ x: 4.55, y: 1.45, z: Z0 + 0.05, radius: 1.2, prompt: 'Read the notice on the glass',
      onUse: (gm) => talk(gm, 'A notice', ['Rehearsing. Model sunline running. If the room goes violet, stay where you are.']) });

    // the lamp-test wall hums a little: start it once, the first time you come in
    let hum = null;
    s.trigger({ box: [X0, 0, Z0, X1, H, Z1], onEnter(gm) { if (!hum && gm.audio) hum = gm.loopAt('hum-lamp', f, 10.9, 1.9, BI - 0.1, { vol: 0.25, radius: 5 }); } });

    s.zoneBox({ id: 'studio', place: 'studio', box: [X0, 0, Z0, X1, H, Z1], name: "Oona's studio", sub: 'Wick Court', ambience: 'shop', reverb: 'room', env: { exposure: 1.05, warmth: 0.2 } });
    s.finish();
    game.spawns.studio = { frame: f, x: 9.9, y: 0, z: 16.8, yaw: Math.PI };
    game.spawns['studio-model'] = { frame: f, x: 9.95, y: 0, z: 22.7, yaw: Math.PI };
  },
};
