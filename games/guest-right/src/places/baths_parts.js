// Parts for the Candlewick baths: its own props (lockers, robes on the warm rail, wash stools, buckets, taps, loungers,
// the broth urn, a teapot, a board game) and helpers (pools cut into a tiled floor, the vault, the 65 degree pipes, the mosaic).
import { defineProp } from '../world/props.js';
import { shadeHex, mixHex, Rng, hashStr } from '../core/util.js';

export const bathsParts = true;

// The palette: sea greens and cream, dark oiled wood, brass, and one loud coral.
export const PAL = {
  cream: '#efe4cc', bone: '#e2d5b8', sea: '#6fa898', seaD: '#3f7f73', teal: '#2a6863', deep: '#1d4a47',
  coral: '#d4553a', coralD: '#a63c28', ochre: '#d9a441', wood: '#6b4a2f', woodD: '#4a3220', brass: '#b8913f',
  water: '#3f8f9a', felt: '#7a3a3a', indigo: '#33407a',
};

// ---------------------------------------------------------------------------------------------------------------
// props
// ---------------------------------------------------------------------------------------------------------------

// A bank of numbered wooden lockers. p: { cols, rows, cw (column width), h, d, body, doors: [..], odd: [..], seed }
defineProp('baths.lockers', (g, p) => {
  const cols = p.cols || 6, rows = p.rows || 3, cw = p.cw || 0.42, H = p.h || 2.0, d = p.d || 0.45, W = cols * cw;
  const r = new Rng(hashStr('lk' + (p.seed || 0)));
  const body = p.body || '#4f3624';
  g.mat('wood', shadeHex(body, 0.7)); g.box(-W / 2, 0, -d / 2, W / 2, 0.12, d / 2 - 0.04, { aoBottom: 0.55 });
  g.mat('wood', body);
  g.box(-W / 2 - 0.025, 0, -d / 2, -W / 2, H, d / 2, { bevel: 0.006 }); g.box(W / 2, 0, -d / 2, W / 2 + 0.025, H, d / 2, { bevel: 0.006 });
  g.box(-W / 2 - 0.05, H, -d / 2, W / 2 + 0.05, H + 0.06, d / 2 + 0.035, { bevel: 0.012 });
  g.box(-W / 2 - 0.03, H - 0.07, d / 2 - 0.01, W / 2 + 0.03, H, d / 2 + 0.02, { bevel: 0.008 });
  const rh = (H - 0.19) / rows;
  for (let i = 0; i <= cols; i++) { const x = -W / 2 + i * cw; g.box(x - 0.012, 0.12, d / 2 - 0.03, x + 0.012, H - 0.07, d / 2); }
  for (let j = 0; j <= rows; j++) { const y = 0.12 + j * rh; g.box(-W / 2, y - 0.012, d / 2 - 0.03, W / 2, y + 0.012, d / 2); }
  const doors = p.doors || ['#7a5233', '#6b4a2f', '#86603c', '#73502f'];
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x0 = -W / 2 + i * cw + 0.016, x1 = x0 + cw - 0.032, y0 = 0.12 + j * rh + 0.016, y1 = y0 + rh - 0.032;
    const c = r.chance(0.14) ? r.pick(p.odd || ['#2a6863', '#c9552e', '#d9a441', '#33407a']) : r.pick(doors);
    g.mat('wood', c, { rough: -0.05 }); g.box(x0, y0, d / 2 - 0.022, x1, y1, d / 2 + 0.006, { bevel: 0.007 });
    g.mat('wood', shadeHex(c, 0.4));
    for (let k = 0; k < 3; k++) { const yy = y1 - 0.07 - k * 0.032; g.box(x0 + 0.08, yy, d / 2 + 0.006, x1 - 0.08, yy + 0.013, d / 2 + 0.008, { faces: 'Z' }); }
    const cx = (x0 + x1) / 2, ym = (y0 + y1) / 2;
    g.mat('cast', '#c4a05a'); g.box(cx - 0.045, y1 - 0.2, d / 2 + 0.006, cx + 0.045, y1 - 0.14, d / 2 + 0.012, { bevel: 0.004 });
    g.mat('cast', '#8a6d3b'); g.tube([[x1 - 0.045, ym, d / 2 + 0.006], [x1 - 0.045, ym, d / 2 + 0.035], [x1 - 0.045, ym - 0.03, d / 2 + 0.045]], 0.007, { segs: 5 });
  }
  return { solid: [[-W / 2, 0, -d / 2, W / 2, H, d / 2]], tier: 's' };
});

// A low wash stool. p: { wood }
defineProp('baths.stool', (g, p) => {
  const c = p.wood || '#9a7448';
  g.mat('wood', c, { rough: -0.05 });
  g.box(-0.2, 0.2, -0.12, 0.2, 0.245, 0.12, { bevel: 0.012 });
  g.mat('wood', shadeHex(c, 0.8));
  for (const sx of [-1, 1]) g.box(sx * 0.15 - 0.018, 0, -0.11, sx * 0.15 + 0.018, 0.2, 0.11, { bevel: 0.006 });
  g.box(-0.14, 0.05, -0.012, 0.14, 0.08, 0.012, { bevel: 0.004 });
  return { posts: [[0, 0, 0.18, 0, 0.25]], spots: [{ type: 'sit', x: 0, y: 0.25, z: 0, yaw: 0, low: true }] };
});

// A wooden bucket with brass hoops, a little water and a dipper. p: { wood, r, h, dipper }
defineProp('baths.bucket', (g, p) => {
  const r = p.r || 0.14, h = p.h || 0.22, c = p.wood || '#a77e4c';
  g.mat('wood', c, { rough: -0.02 });
  g.lathe(0, 0, [[0, 0.004], [r * 0.86, 0.004], [r * 0.88, 0], [r, h], [r * 0.93, h], [r * 0.82, 0.03], [0, 0.03]], { segs: 16, capTop: false });
  g.mat('cast', '#b8913f');
  for (const y of [0.04, h - 0.04]) { const rr = r * 0.88 + (r * 0.12) * (y / h); g.lathe(0, 0, [[rr + 0.004, y - 0.012], [rr + 0.007, y], [rr + 0.004, y + 0.012]], { segs: 16, capTop: false, capBottom: false }); }
  g.mat('glaze', '#4f9aa2', { rough: -0.4 }); g.cyl(0, h * 0.6, 0, r * 0.9, 0.004, { segs: 14 });
  if (p.dipper) {
    g.mat('wood', shadeHex(c, 0.9)); g.lathe(r * 0.3, 0, [[0, h * 0.6], [0.045, h * 0.6], [0.05, h * 0.6 + 0.06], [0.044, h * 0.6 + 0.06], [0, h * 0.6 + 0.008]], { segs: 10, capTop: false });
    g.tube([[r * 0.3 + 0.04, h * 0.6 + 0.05, 0], [r + 0.08, h + 0.12, 0.02], [r + 0.2, h + 0.18, 0.04]], 0.008, { segs: 5 });
  }
  return { cast: false };
});

// A wash place on a wall (the wall at z = 0, the place stands out toward +z): a tiled shelf, a brass mixer with two
// cross handles on the 65 degree line, a round steel mirror, soap in a dish. p: { tile }
defineProp('baths.tap', (g, p) => {
  g.mat('tile', p.tile || '#e9dfc6'); g.box(-0.34, 0.6, 0, 0.34, 0.64, 0.17, { bevel: 0.008 });
  g.mat('cast', '#b8913f', { rough: -0.25 });
  g.tube([[0, 1.02, 0], [0, 1.02, 0.08], [0, 0.98, 0.15], [0, 0.9, 0.17]], 0.014, { segs: 8 });
  g.box(-0.1, 1.0, 0, 0.1, 1.05, 0.04, { bevel: 0.01 });
  for (const sx of [-1, 1]) {
    g.tube([[sx * 0.08, 1.025, 0.04], [sx * 0.08, 1.025, 0.07]], 0.008, { segs: 6 });
    g.tube([[sx * 0.08 - 0.03, 1.025, 0.07], [sx * 0.08 + 0.03, 1.025, 0.07]], 0.007, { segs: 5 });
    g.tube([[sx * 0.08, 0.995, 0.07], [sx * 0.08, 1.055, 0.07]], 0.007, { segs: 5 });
    g.mat('glaze', sx < 0 ? '#c9452e' : '#3b6fa0'); g.ball(sx * 0.08, 1.025, 0.078, 0.009, 0.009, 0.006, { segs: 6, rings: 4 }); g.mat('cast', '#b8913f', { rough: -0.25 });
  }
  g.push(); g.move(0, 1.42, 0.012); g.rotX(Math.PI / 2);
  g.mat('wood', '#5a3d28'); g.cyl(0, -0.012, 0, 0.17, 0.014, { segs: 20 });
  g.mat('brushed', '#d9ddd8', { rough: -0.45 }); g.cyl(0, 0.002, 0, 0.15, 0.006, { segs: 20 });
  g.pop();
  g.mat('glaze', '#f0e8d8'); g.lathe(0.22, 0.09, [[0, 0.64], [0.04, 0.64], [0.05, 0.66], [0.046, 0.66], [0, 0.648]], { segs: 10 });
  g.mat('plain', '#e8d9a8', { rough: 0.2 }); g.box(0.2, 0.648, 0.075, 0.245, 0.668, 0.105, { bevel: 0.006 });
  return { cast: false, tier: 'd' };
});

// Robes hung over the warm rail: a lagged brass pipe on brackets carrying the loop's heat, robes folded over it.
// The rail runs along x at height p.y; the robes hang toward +z. p: { w, n, y, cols, seed }
defineProp('baths.robes', (g, p) => {
  const w = p.w || 2.4, n = p.n || 6, y = p.y || 1.62, r = new Rng(hashStr('rb' + (p.seed || 0)));
  const cols = p.cols || ['#efe4cc', '#6fa898', '#d4553a', '#efe4cc', '#d9a441', '#33407a', '#e2d5b8', '#2a6863'];
  g.mat('cast', '#b8913f', { rough: -0.2 }); g.tube([[-w / 2, y, 0.12], [w / 2, y, 0.12]], 0.03, { segs: 10 });
  for (const sx of [-1, 1]) { g.tube([[sx * w / 2, y, 0.12], [sx * w / 2, y, 0.0]], 0.02, { segs: 6 }); g.box(sx * w / 2 - 0.05, y - 0.06, -0.01, sx * w / 2 + 0.05, y + 0.06, 0.012, { bevel: 0.006 }); }
  g.tube([[-w / 2 - 0.1, y - 0.25, 0.05], [-w / 2, y - 0.1, 0.05], [-w / 2, y - 0.03, 0.1]], 0.012, { segs: 5 });
  const sp = w / n;
  for (let i = 0; i < n; i++) {
    const cx = -w / 2 + sp * (i + 0.5) + r.f(-0.04, 0.04), c = cols[(i + (p.seed || 0)) % cols.length], hw = Math.min(0.3, sp * 0.62);
    const L = r.f(0.95, 1.12), z = 0.12 + 0.034 + i * 0.004;
    const mat = r.chance(0.25) ? 'stripe' : 'knit';
    g.mat(mat, c);
    g.sheet([cx - hw, y + 0.02, z - 0.02], [cx + hw, y + 0.02, z - 0.02], [cx + hw + 0.04, y - L, z + 0.03], [cx - hw - 0.04, y - L, z + 0.03], { nu: 6, nv: 5, ripple: 0.025, rippleN: 5 });
    g.sheet([cx + hw, y + 0.02, z - 0.07], [cx - hw, y + 0.02, z - 0.07], [cx - hw, y - 0.45, z - 0.09], [cx + hw, y - 0.45, z - 0.09], { nu: 3, nv: 2 });
    g.mat('knit', shadeHex(c, 0.78)); g.box(cx - hw - 0.02, y - 0.48, z + 0.005, cx + hw + 0.02, y - 0.44, z + 0.03, { bevel: 0.01 });
    g.mat('weave', mixHex(c, '#ffffff', 0.25)); g.box(cx - hw * 0.4, y - 0.04, z - 0.006, cx + hw * 0.4, y + 0.035, z + 0.012, { bevel: 0.01 });
  }
  return { cast: false, tier: 'd' };
});

// Open shelves of folded towels. p: { w, h, shelves, seed, wood }
defineProp('baths.towels', (g, p) => {
  const w = p.w || 1.4, h = p.h || 2.0, n = p.shelves || 4, d = 0.42, r = new Rng(hashStr('tw' + (p.seed || 0)));
  g.mat('wood', p.wood || '#5a3d28');
  g.box(-w / 2, 0, -d / 2, -w / 2 + 0.03, h, d / 2, { bevel: 0.006 }); g.box(w / 2 - 0.03, 0, -d / 2, w / 2, h, d / 2, { bevel: 0.006 });
  g.box(-w / 2 + 0.03, 0.06, -d / 2, w / 2 - 0.03, h, -d / 2 + 0.014, { faces: 'Z' });
  const cols = ['#efe4cc', '#efe4cc', '#e2d5b8', '#6fa898', '#d4553a', '#d9a441', '#2a6863', '#f4ece0'];
  for (let i = 0; i < n; i++) {
    const y = 0.08 + i * (h - 0.12) / n; g.mat('wood', p.wood || '#5a3d28'); g.box(-w / 2 + 0.03, y, -d / 2 + 0.01, w / 2 - 0.03, y + 0.025, d / 2, { faces: 'yYZ' });
    let x = -w / 2 + 0.06;
    while (x < w / 2 - 0.3) {
      const tw = r.f(0.26, 0.32), k = r.i(3, 6), c = r.pick(cols); let yy = y + 0.025;
      for (let j = 0; j < k && yy < y + (h - 0.12) / n - 0.12; j++) {
        const th = r.f(0.06, 0.08), cc = r.chance(0.7) ? c : r.pick(cols);
        g.mat('knit', cc); g.box(x + r.f(-0.01, 0.01), yy, -d / 2 + 0.05, x + tw + r.f(-0.01, 0.01), yy + th, d / 2 - 0.02 + r.f(-0.02, 0.0), { bevel: 0.025 });
        yy += th;
      }
      x += tw + r.f(0.02, 0.06);
    }
  }
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], tier: 's', spots: [{ type: 'work', x: 0, y: 0, z: d / 2 + 0.45, yaw: Math.PI, tags: ['fold'] }] };
});

// The broth urn: a brass urn with a tap, on its warm feet. p: {}
defineProp('baths.urn', (g) => {
  g.mat('cast', '#b8913f', { rough: -0.15 });
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + 0.5; g.tube([[Math.cos(a) * 0.15, 0, Math.sin(a) * 0.15], [Math.cos(a) * 0.12, 0.1, Math.sin(a) * 0.12]], 0.012, { segs: 5 }); }
  g.lathe(0, 0, [[0, 0.09], [0.12, 0.09], [0.17, 0.14], [0.19, 0.3], [0.18, 0.5], [0.15, 0.56], [0.14, 0.58], [0.155, 0.6], [0.0, 0.62]], { segs: 20 });
  g.mat('wood', '#2a1c14'); g.lathe(0, 0, [[0.03, 0.62], [0.04, 0.66], [0.02, 0.69], [0, 0.7]], { segs: 10 });
  for (const sx of [-1, 1]) g.tube([[sx * 0.18, 0.46, 0], [sx * 0.24, 0.45, 0], [sx * 0.24, 0.36, 0], [sx * 0.185, 0.34, 0]], 0.012, { segs: 5 });
  g.mat('cast', '#9a7a3a'); g.tube([[0, 0.18, 0.18], [0, 0.18, 0.26], [0, 0.15, 0.28]], 0.016, { segs: 8 });
  g.mat('wood', '#2a1c14'); g.box(-0.01, 0.2, 0.22, 0.01, 0.26, 0.24, { bevel: 0.004 });
  return { posts: [[0, 0, 0.2, 0, 0.62]] };
});

// A slatted lounger, its back raised. p: { wood, towel }
defineProp('baths.lounger', (g, p) => {
  const c = p.wood || '#9a7448', L = 1.9, W = 0.62, y = 0.36;
  g.mat('wood', shadeHex(c, 0.75));
  for (const sx of [-1, 1]) { g.box(sx * W / 2 - 0.035, y - 0.08, -L / 2, sx * W / 2, y, L / 2 - 0.55, { bevel: 0.008 }); for (const z of [-L / 2 + 0.08, L / 2 - 0.62]) g.box(sx * (W / 2 - 0.05) - 0.025, 0, z - 0.025, sx * (W / 2 - 0.05) + 0.025, y - 0.05, z + 0.025, { bevel: 0.006 }); }
  g.mat('wood', c, { rough: -0.05 });
  for (let z = -L / 2 + 0.02; z < L / 2 - 0.6; z += 0.085) g.box(-W / 2 + 0.01, y, z, W / 2 - 0.01, y + 0.025, z + 0.06, { bevel: 0.006 });
  g.push(); g.move(0, y, L / 2 - 0.58); g.rotX(-0.62);
  for (let z = 0; z < 0.62; z += 0.085) g.box(-W / 2 + 0.01, 0, z, W / 2 - 0.01, 0.025, z + 0.06, { bevel: 0.006 });
  g.mat('wood', shadeHex(c, 0.75)); for (const sx of [-1, 1]) g.box(sx * W / 2 - 0.035, -0.06, 0, sx * W / 2, 0, 0.64, { bevel: 0.006 });
  if (p.towel) { g.mat('knit', p.towel); g.box(-0.2, 0.025, 0.36, 0.2, 0.11, 0.58, { bevel: 0.03 }); }
  g.pop();
  g.mat('wood', shadeHex(c, 0.6)); g.tube([[-W / 2 + 0.06, y - 0.02, L / 2 - 0.3], [-W / 2 + 0.06, 0.02, L / 2 - 0.2]], 0.014, { segs: 5 }); g.tube([[W / 2 - 0.06, y - 0.02, L / 2 - 0.3], [W / 2 - 0.06, 0.02, L / 2 - 0.2]], 0.014, { segs: 5 });
  return { solid: [[-W / 2, 0, -L / 2, W / 2, 0.62, L / 2 - 0.1]], tier: 's', spots: [{ type: 'sit', x: 0, y: y + 0.03, z: 0.2, yaw: Math.PI }] };
});

// A teapot. p: { glaze }
defineProp('baths.teapot', (g, p) => {
  const c = p.glaze || '#2a6863';
  g.mat('glaze', c); g.lathe(0, 0, [[0, 0], [0.05, 0], [0.075, 0.03], [0.08, 0.07], [0.065, 0.11], [0.04, 0.12], [0, 0.12]], { segs: 16 });
  g.tube([[0.07, 0.04, 0], [0.11, 0.08, 0], [0.13, 0.12, 0]], [0.016, 0.011, 0.008], { segs: 6 });
  g.tube([[-0.06, 0.1, 0], [-0.11, 0.09, 0], [-0.11, 0.04, 0], [-0.07, 0.03, 0]], 0.008, { segs: 5 });
  g.mat('glaze', shadeHex(c, 1.3)); g.lathe(0, 0, [[0.042, 0.12], [0.03, 0.135], [0.012, 0.14], [0.014, 0.155], [0, 0.16]], { segs: 12, capBottom: false });
  return { cast: false };
});

// A board game on its own low table: a board of squares, stones on it and beside it, two cushions. p: { a, b }
defineProp('baths.game', (g, p) => {
  const a = p.a || '#efe4cc', b = p.b || '#d4553a';
  g.mat('wood', '#5a3d28'); g.box(-0.36, 0.3, -0.36, 0.36, 0.34, 0.36, { bevel: 0.01 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * 0.3 - 0.025, 0, sz * 0.3 - 0.025, sx * 0.3 + 0.025, 0.3, sz * 0.3 + 0.025, { bevel: 0.006 });
  g.mat('wood', '#c9a46a'); g.box(-0.24, 0.34, -0.24, 0.24, 0.36, 0.24, { bevel: 0.006 });
  const n = 9, cs = 0.44 / n;
  g.mat('wood', '#3a2a1e');
  for (let i = 0; i <= n; i++) { const u = -0.22 + i * cs; g.box(u - 0.002, 0.36, -0.22, u + 0.002, 0.3605, 0.22, { faces: 'Y' }); g.box(-0.22, 0.36, u - 0.002, 0.22, 0.3605, u + 0.002, { faces: 'Y' }); }
  const r = new Rng(hashStr('go'));
  for (let k = 0; k < 22; k++) {
    const i = r.i(0, n), j = r.i(0, n); g.mat('glaze', k % 2 ? a : b);
    g.ball(-0.22 + i * cs, 0.366, -0.22 + j * cs, 0.019, 0.008, 0.019, { segs: 8, rings: 4 });
  }
  for (const sz of [-1, 1]) { g.mat('wood', '#3a2a1e'); g.cyl(0.3, 0.34, sz * 0.2, 0.06, 0.04, { segs: 12 }); g.mat('glaze', sz < 0 ? a : b); for (let k = 0; k < 5; k++) g.ball(0.3 + r.f(-0.03, 0.03), 0.37, sz * 0.2 + r.f(-0.03, 0.03), 0.019, 0.008, 0.019, { segs: 8, rings: 4 }); }
  return { solid: [[-0.36, 0, -0.36, 0.36, 0.36, 0.36]], tier: 'd' };
});

// A floor cushion. p: { c }
defineProp('baths.cushion', (g, p) => {
  g.mat('felt', p.c || '#d9a441'); g.box(-0.24, 0, -0.24, 0.24, 0.12, 0.24, { bevel: 0.05 });
  g.mat('weave', shadeHex(p.c || '#d9a441', 0.7)); g.ball(0, 0.12, 0, 0.02, 0.01, 0.02, { segs: 6, rings: 3 });
  return { spots: [{ type: 'sit', x: 0, y: 0.13, z: 0, yaw: 0, low: true }], cast: false };
});

// A pair of bath slippers. p: { c }
defineProp('baths.slippers', (g, p) => {
  g.mat('rush', p.c || '#c9a46a');
  for (const sx of [-1, 1]) {
    g.box(sx * 0.06 - 0.045, 0, -0.13, sx * 0.06 + 0.045, 0.02, 0.13, { bevel: 0.012 });
    g.mat('weave', p.strap || '#2a6863'); g.box(sx * 0.06 - 0.047, 0.02, 0.02, sx * 0.06 + 0.047, 0.045, 0.07, { bevel: 0.01 }); g.mat('rush', p.c || '#c9a46a');
  }
  return { cast: false };
});

// A tall pot of ferns. p: { pot, size }
defineProp('baths.fernpot', (g, p) => {
  const s = p.size || 1, c = p.pot || '#2a6863', r = new Rng(hashStr('fp' + c + s));
  g.mat('glaze', c); g.lathe(0, 0, [[0, 0], [0.16 * s, 0], [0.2 * s, 0.05 * s], [0.24 * s, 0.4 * s], [0.26 * s, 0.46 * s], [0.25 * s, 0.5 * s], [0.22 * s, 0.48 * s]], { segs: 18, capTop: false });
  g.mat('glaze', shadeHex(c, 1.35)); g.lathe(0, 0, [[0.235 * s, 0.3 * s], [0.243 * s, 0.32 * s], [0.247 * s, 0.34 * s]], { segs: 18, capTop: false, capBottom: false });
  g.mat('soil', '#ffffff'); g.cyl(0, 0.44 * s, 0, 0.22 * s, 0.01, { segs: 12 });
  g.mat('fern', '#ffffff', { sway: 0.5 });
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + r.f(-0.2, 0.2); const hh = r.f(0.6, 0.9) * s; g.card(Math.cos(a) * 0.04, 0.44 * s, Math.sin(a) * 0.04, hh * 0.45, hh, a + Math.PI / 2, { tilt: r.f(0.45, 0.85) }); }
  return { posts: [[0, 0, 0.25 * s, 0, 0.5 * s]], surf: 'stone' };
});

// ---------------------------------------------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------------------------------------------

// The cells of the rectangle [x0,z0,x1,z1] not covered by any hole (holes: [[x0,z0,x1,z1], ...]), merged into strips.
export function cutRects(x0, z0, x1, z1, holes) {
  const xs = [x0, x1], zs = [z0, z1];
  for (const h of holes) { for (const x of [h[0], h[2]]) if (x > x0 && x < x1) xs.push(x); for (const z of [h[1], h[3]]) if (z > z0 && z < z1) zs.push(z); }
  xs.sort((a, b) => a - b); zs.sort((a, b) => a - b);
  const out = [];
  for (let j = 0; j < zs.length - 1; j++) {
    let run = null;
    for (let i = 0; i < xs.length - 1; i++) {
      const cx = (xs[i] + xs[i + 1]) / 2, cz = (zs[j] + zs[j + 1]) / 2;
      const inHole = holes.some((h) => cx > h[0] && cx < h[2] && cz > h[1] && cz < h[3]);
      if (xs[i + 1] - xs[i] < 1e-4 || zs[j + 1] - zs[j] < 1e-4) continue;
      if (!inHole) { if (run && Math.abs(run[2] - xs[i]) < 1e-4) run[2] = xs[i + 1]; else { run = [xs[i], zs[j], xs[i + 1], zs[j + 1]]; out.push(run); } }
      else run = null;
    }
  }
  return out;
}

// A quad that faces the way of `n` whatever order its corners come in.
export function quadN(g, a, b, c, d, n) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
  const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
  if (cx * n[0] + cy * n[1] + cz * n[2] >= 0) g.quad(a, b, c, d); else g.quad(a, d, c, b);
}

// An arched opening's surround in a wall (the wall() call makes the rectangular hole, w by h): two jambs, a head that is
// square outside and arched inside (so the corners are filled), a coral line round the arch and a keystone.
// (x, y, z) = the opening's centre at floor level; along: 'x' | 'z' (the wall's direction). o: { depth, f, rise, tint, mat, line, key }
export function smoothArch(s, x, y, z, w, h, along, o = {}) {
  const g = s.g, d = o.depth || 0.3, f = o.f || 0.16, rise = Math.min(w / 2, o.rise || w * 0.28), n = 14;
  const P = (u, yy, a) => along === 'x' ? [x + u, y + yy, z + a] : [x + a, y + yy, z + u];
  const N = (nu, ny, na) => along === 'x' ? [nu, ny, na] : [na, ny, nu];
  g.mat(o.mat || 'stone', o.tint || '#e2d5b8');
  const B = (u0, y0, u1, y1) => { const a = P(u0, y0, -d / 2), b = P(u1, y1, d / 2); g.box(Math.min(a[0], b[0]), a[1], Math.min(a[2], b[2]), Math.max(a[0], b[0]), b[1], Math.max(a[2], b[2]), { bevel: 0.012, aoBottom: 0.7 }); };
  B(-w / 2 - f, 0, -w / 2, h + f); B(w / 2, 0, w / 2 + f, h + f); B(-w / 2, h, w / 2, h + f);
  const yc = h - rise, inner = (t) => [-Math.cos(t) * w / 2, yc + Math.sin(t) * rise];
  for (let i = 0; i < n; i++) {
    const a = inner(Math.PI * i / n), b = inner(Math.PI * (i + 1) / n);
    for (const sd of [-1, 1]) quadN(g, P(a[0], a[1], sd * d / 2), P(b[0], b[1], sd * d / 2), P(b[0], h, sd * d / 2), P(a[0], h, sd * d / 2), N(0, 0, sd));
    const mu = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, l = Math.hypot(mu, yc - my) || 1;
    quadN(g, P(a[0], a[1], -d / 2), P(b[0], b[1], -d / 2), P(b[0], b[1], d / 2), P(a[0], a[1], d / 2), N(-mu / l, (yc - my) / l, 0));
  }
  // a coral line following the arch on both faces, and a keystone
  g.mat('tile', o.line || '#d4553a');
  for (let i = 0; i < n; i++) {
    const t0 = Math.PI * i / n, t1 = Math.PI * (i + 1) / n;
    const r0 = (t, k) => [-Math.cos(t) * (w / 2 + k), yc + Math.sin(t) * (rise + k)];
    for (const sd of [-1, 1]) { const a0 = r0(t0, 0.03), a1 = r0(t1, 0.03), b0 = r0(t0, 0.08), b1 = r0(t1, 0.08); quadN(g, P(a0[0], a0[1], sd * (d / 2 + 0.004)), P(a1[0], a1[1], sd * (d / 2 + 0.004)), P(b1[0], b1[1], sd * (d / 2 + 0.004)), P(b0[0], b0[1], sd * (d / 2 + 0.004)), N(0, 0, sd)); }
  }
  g.mat('tile', o.key || '#2a6863'); B(-0.13, h - 0.02, 0.13, h + f + 0.06);
  return s.flush({ tier: 's', level: o.level });
}

// The mosaic on the end wall: the Hollow seen from its lake shore, the sunline across the middle and the far bank hanging
// overhead, set in a coral and cream border. Drawn as cells of `mosaic` tile, each its own colour, on the wall plane z = zf
// (facing +z), between x0 and x1, from y0 up to the curve top(x). Returns the cells of the sunline (to light it).
export function mosaicPicture(s, x0, x1, y0, zf, top, o = {}) {
  const g = s.g, cell = o.cell || 0.14, r = new Rng(hashStr('mosaic2'));
  const W = x1 - x0, nx = Math.round(W / cell), cw = W / nx, ny = Math.ceil(((o.yMax || 7.2) - y0) / cell);
  const C = {
    b1: PAL.coral, b2: '#f1e2c2', b3: '#5a1e18',
    lakeD: '#174a56', lake: '#23707c', lakeL: '#78c0b8', gold: '#f2c060',
    sand: '#dcc28a', lawn: '#7aa04e', lawnD: '#557d3c', crown: '#2f6a3a', crownL: '#5f9a44', trunk: '#4a3220',
    stone: '#cdb894', stoneD: '#a8926c', terr: '#6f9a4c',
    air0: '#fbe6b4', air1: '#f4c58e', air2: '#e89a7a', air3: '#9cc4bc',
    sun: '#fff6d8', sunC: '#ffffff',
    fields: ['#7aa04e', '#557d3c', '#d2a650', '#2f7f8a', '#9ab45a', '#3f6e3a'], hang: '#2f5a34',
  };
  // the near shore curves up toward both ends, as the floor of a drum does
  const shore = (u) => 1.15 + 1.6 * Math.pow(Math.abs(u - 0.5) * 2, 2.6);
  const trees = []; for (let k = 0; k < 17; k++) { const u = 0.08 + k * 0.052 + r.f(-0.012, 0.012); trees.push([u, shore(u) + 0.48 + r.f(-0.05, 0.08), r.f(0.2, 0.3)]); }
  const hangs = []; for (let k = 0; k < 15; k++) hangs.push([0.12 + k * 0.054 + r.f(-0.01, 0.01), r.f(0.16, 0.26)]);
  const sunCells = [];
  for (let i = 0; i < nx; i++) {
    const xa = x0 + i * cw, xb = xa + cw, xm = (xa + xb) / 2, u = (xm - x0) / W, yt = top(xm);
    const farEdge = yt - 1.25 - 0.35 * Math.cos((u - 0.5) * Math.PI);
    const sunY = y0 + (o.sunY || 3.3) - y0;
    for (let j = 0; j < ny; j++) {
      const ya = y0 + j * cell, yb = Math.min(ya + cell, yt), ym = (ya + yb) / 2; if (yb - ya < 0.04) break;
      const v = ym - y0, edge = Math.min(xm - x0, x1 - xm, ym - y0, yt - ym);
      let col, em = 0;
      if (edge < cell) col = (i + j) % 2 ? C.b1 : C.b2;
      else if (edge < cell * 2) col = C.b3;
      else {
        const sh = shore(u), ends = Math.abs(u - 0.5) * 2;
        // the end walls' terraces at both sides, stepping up toward the far bank
        const stepH = Math.floor((ends - 0.84) / 0.03);
        if (ends > 0.84 && v > sh - 0.3 && ym < farEdge + 0.2) { const lvl = ym - y0 - (sh - 0.3) - stepH * 0.32; col = (Math.floor((ym - y0) / 0.28) % 2) ? C.stone : (lvl % 0.56 < 0.14 ? C.terr : C.stoneD); }
        else if (v < sh) {
          const k = v / sh, wave = Math.sin(u * 47 + v * 11 + Math.sin(u * 9) * 2.2) > 0.8;
          col = wave ? C.lakeL : (k < 0.5 ? mixHex(C.lakeD, C.lake, k * 2) : C.lake);
          const road = Math.abs(u - 0.5) < 0.025 + 0.06 * k;                     // the sunline's light on the water
          if (road && (j % 2 === 0 || Math.abs(u - 0.5) < 0.02)) col = mixHex(C.gold, '#fff0c0', k);
          if (u > 0.63 && u < 0.655 && v > sh - 0.75) col = C.trunk;              // a jetty
          if (u > 0.6 && u < 0.69 && v > sh - 0.8 && v < sh - 0.7) col = '#6a4a2a';
        } else if (v < sh + 0.16) col = C.sand;
        else {
          // near trees, then lawn, then the air
          let tree = null; for (const t of trees) { const dx = (u - t[0]) * W, dy = v - t[1]; if (dx * dx + dy * dy < t[2] * t[2]) { tree = [dx, dy, t[2]]; break; } if (Math.abs(dx) < 0.05 && v < t[1] && v > sh + 0.1) tree = [0, 0, -1]; }
          if (tree && tree[2] < 0) col = C.trunk;
          else if (tree) col = (tree[0] + tree[1] * 0.8) < -tree[2] * 0.15 ? C.crownL : C.crown;
          else if (v < sh + 0.34) col = (Math.sin(u * 90) > 0.5) ? C.lawnD : C.lawn;
          else if (ym > farEdge) {
            const d = ym - farEdge;
            if (d < cell * 1.2) col = C.lawnD;
            else { const fi = Math.floor(u * 16 + Math.floor(d / 0.4) * 0.5), fj = Math.floor(d / 0.4); col = C.fields[Math.abs(fi * 7 + fj * 3) % C.fields.length]; if (Math.sin(u * 140) > 0.92) col = shadeHex(col, 0.8); }
          } else {
            let hang = false; for (const t of hangs) { const dx = (u - t[0]) * W, dy = farEdge - ym; if (dy > 0 && dx * dx + (dy - t[1] * 0.6) * (dy - t[1] * 0.6) < t[1] * t[1]) { hang = true; break; } }
            const ds = Math.abs(ym - sunY);
            if (hang) col = C.hang;
            else if (ds < cell * 0.55 && ends < 0.86) { col = ends < 0.7 ? C.sunC : C.sun; em = 1.15; }
            else if (ds < cell * 1.6 && ends < 0.84 && (i % 3 === 0)) { col = C.sun; em = 0.35; }
            else {
              const up = ym > sunY; const span = up ? (farEdge - sunY) : (sunY - (y0 + sh + 0.34)); const k = Math.min(1, ds / Math.max(0.3, span));
              col = k < 0.35 ? mixHex(C.air0, C.air1, k / 0.35) : k < 0.75 ? mixHex(C.air1, C.air2, (k - 0.35) / 0.4) : mixHex(C.air2, C.air3, (k - 0.75) / 0.25);
            }
          }
        }
      }
      col = shadeHex(col, 1 + r.f(-0.06, 0.06));
      g.mat('mosaic', col, em ? { emissive: em, lamp: true } : undefined);
      g.box(xa + 0.004, ya + 0.004, zf, xb - 0.004, yb - 0.004, zf + 0.012, { faces: 'Z' });
      if (em > 1) sunCells.push([xm, ym]);
    }
    if ((i & 7) === 7 || i === nx - 1) s.flush({ tier: 's', level: o.level });
  }
  return sunCells;
}
