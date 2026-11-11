// Props for the tea dance: a little ballroom chair, a round tea table laid with lidded cups, the cloak room's coat rail
// with its tickets, a music stand.
import { defineProp } from '../world/props.js';
import { shadeHex, mixHex, Rng, hashStr } from '../core/util.js';

export const danceProps = true;

// A small ballroom chair: dark slim legs, a stuffed seat and back pad in cloth, a gilt top rail. p: { wood, seat, gilt }
defineProp('lots-baths.dance-chair', (g, p) => {
  const w = p.wood || '#2a1c14', gilt = p.gilt || '#c9a24a', seat = p.seat || '#7a2f45';
  g.mat('wood', w, { rough: -0.1 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * 0.165 - 0.017, 0, sz * 0.165 - 0.017, sx * 0.165 + 0.017, 0.42, sz * 0.165 + 0.017, { faces: 'xXzZ' });
  g.box(-0.2, 0.4, -0.2, 0.2, 0.44, 0.2, { faces: 'xXzZy' });
  for (const sx of [-1, 1]) g.box(sx * 0.165 - 0.016, 0.44, -0.205, sx * 0.165 + 0.016, 0.93, -0.17, { faces: 'xXzZ' });
  g.mat('cast', gilt, { rough: -0.2 }); g.box(-0.19, 0.9, -0.21, 0.19, 0.96, -0.165);
  g.mat('weave', seat); g.box(-0.185, 0.44, -0.185, 0.185, 0.495, 0.195, { bevel: 0.026 });
  g.box(-0.13, 0.56, -0.2, 0.13, 0.84, -0.172);
  return { posts: [[0, 0, 0.2, 0, 0.48]], spots: [{ type: 'sit', x: 0, y: 0.48, z: 0.03, yaw: 0 }], tier: 'd' };
});

// A round tea table under a cloth, laid with two lidded cups and a lidded pot. p: { cloth, cup, lid, wood }
defineProp('lots-baths.dance-table', (g, p) => {
  const h = 0.72, cloth = p.cloth || '#efe2c6', cup = p.cup || '#e9e1cf', lid = p.lid || '#2f7f7a';
  g.mat('cast', p.wood || '#3a2a1e'); g.lathe(0, 0, [[0.24, 0], [0.22, 0.03], [0.06, 0.07], [0.04, 0.35], [0.045, h - 0.06], [0.1, h - 0.03]], { segs: 8 });
  g.mat('wood', p.wood || '#3a2a1e'); g.lathe(0, 0, [[0.3, h - 0.04], [0.34, h - 0.04], [0.35, h]], { segs: 14, capTop: false, capBottom: false });
  g.mat('weave', cloth); g.lathe(0, 0, [[0.39, h - 0.17], [0.4, h - 0.06], [0.37, h + 0.004], [0, h + 0.006]], { segs: 14, capBottom: false });
  const put = (x, z) => {
    g.mat('glaze', cup); g.lathe(x, z, [[0, h], [0.026, h], [0.036, h + 0.012], [0.04, h + 0.08], [0.037, h + 0.082], [0, h + 0.07]], { segs: 8 });
    g.mat('glaze', lid); g.lathe(x, z, [[0.043, h + 0.08], [0.04, h + 0.088], [0.012, h + 0.098], [0.012, h + 0.108], [0, h + 0.11]], { segs: 8, capBottom: false });
  };
  put(-0.17, 0.06); put(0.17, -0.04);
  g.mat('glaze', lid); g.lathe(0, -0.13, [[0, h], [0.05, h], [0.075, h + 0.03], [0.08, h + 0.07], [0.065, h + 0.11], [0.04, h + 0.12], [0, h + 0.12]], { segs: 10 });
  g.tube([[0.07, h + 0.04, -0.13], [0.11, h + 0.08, -0.13], [0.13, h + 0.12, -0.13]], [0.015, 0.01, 0.008], { segs: 5 });
  g.mat('glaze', shadeHex(lid, 1.3)); g.lathe(0, -0.13, [[0.042, h + 0.12], [0.03, h + 0.135], [0.012, h + 0.14], [0.014, h + 0.155], [0, h + 0.16]], { segs: 8, capBottom: false });
  return { posts: [[0, 0, 0.36, 0, h]], tier: 'd' };
});

// The cloak room's rail: a stand with coats hung side-on along it, a paper ticket on every hanger. p: { w, n, seed, cols }
defineProp('lots-baths.dance-coats', (g, p) => {
  const w = p.w || 3, n = p.n || 10, r = new Rng(hashStr('dc' + (p.seed || 0)));
  const cols = p.cols || ['#33407a', '#7a2f45', '#5a4a3a', '#2f6a6a', '#c9893a', '#3a2a20', '#8a6a9a', '#6b7a3a'];
  g.mat('cast', '#2a2622', { rough: -0.1 });
  for (const sx of [-1, 1]) {
    g.tube([[sx * w / 2, 0.02, 0], [sx * w / 2, 1.82, 0]], 0.02, { segs: 6 });
    g.tube([[sx * w / 2, 0.02, -0.28], [sx * w / 2, 0.02, 0.28]], 0.02, { segs: 6 });
  }
  g.mat('cast', '#c9a24a', { rough: -0.25 }); g.tube([[-w / 2, 1.8, 0], [w / 2, 1.8, 0]], 0.016, { segs: 6 });
  for (let i = 0; i < n; i++) {
    if (r.chance(0.18)) continue;
    const x = -w / 2 + (i + 0.5) * w / n + r.f(-0.03, 0.03), c = r.pick(cols), L = r.f(0.85, 1.15), sw = r.f(0.2, 0.25);
    g.mat('wood', '#8a6240'); g.tube([[x, 1.8, 0], [x, 1.74, 0]], 0.004, { segs: 3 }); g.tube([[x, 1.72, -sw], [x, 1.76, 0], [x, 1.72, sw]], 0.008, { segs: 4 });
    g.mat(r.chance(0.3) ? 'motif' : 'weave', c);
    g.sheet([x, 1.72, -sw], [x, 1.72, sw], [x + 0.01, 1.72 - L, sw + 0.05], [x + 0.01, 1.72 - L, -sw - 0.05], { nu: 2, nv: 4, ripple: 0.02, rippleN: 3 });
    g.mat('weave', shadeHex(c, 0.75)); g.box(x - 0.035, 1.66, -sw, x + 0.035, 1.74, sw, { bevel: 0.02 });
    if (r.chance(0.4)) { g.mat('knit', mixHex(c, '#f1e2c2', 0.5)); g.box(x - 0.03, 1.6, -0.06, x + 0.03, 1.66, 0.06, { bevel: 0.015 }); }
    g.mat('paper', '#f1e8d4'); g.box(x - 0.004, 1.62, sw - 0.02, x + 0.004, 1.69, sw + 0.03);
  }
  return { solid: [[-w / 2, 0, -0.3, w / 2, 1.85, 0.3]], tier: 's' };
});

// A music stand with a sheet on it. p: {}
defineProp('lots-baths.dance-stand', (g) => {
  g.mat('cast', '#2a2622');
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; g.tube([[Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2], [0, 0.18, 0]], 0.008, { segs: 4 }); }
  g.tube([[0, 0.18, 0], [0, 1.05, 0]], 0.01, { segs: 5 });
  g.push(); g.move(0, 1.12, 0.02); g.rotX(-0.35);
  g.box(-0.24, -0.12, -0.006, 0.24, 0.14, 0.006); g.mat('paper', '#f3ead6'); g.box(-0.2, -0.1, 0.006, 0.2, 0.15, 0.009);
  g.pop();
  return { cast: false, tier: 'd' };
});
