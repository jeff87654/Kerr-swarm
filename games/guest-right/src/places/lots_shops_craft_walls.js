// The upper walls and the odd things on the floor of the generated craft shops: a band of the trade between the picture rail and the
// ceiling (a patchwork, pinned patterns, skeins, little lamps, children's drawings, frames, plates, kites, chair backs, letters),
// and what stands at the end of a run of shelves. Called by lots_shops_craft.js with its context C; each band is a cached prop drawn
// in its run's own frame (x along the wall, +z into the room, z = 0 at the wall's face). Flat things show their front face only.
import { Rng, hsl, hashStr } from '../core/util.js';
import { defineProp } from '../world/props.js';
import { CLOTH, GLAZES } from './lots_shops_craft_props.js';

export const craftWalls = true;

const Y0 = 2.2, Y1 = 2.96, F = { faces: 'Z' };
const tag = (g, x, y, z, eye) => { g.mat('paper', '#efe4c8'); g.box(x - 0.02, y - 0.06, z, x + 0.02, y - 0.01, z + 0.003, F); g.mat('cast', eye || '#b08a45'); g.box(x - 0.005, y - 0.02, z + 0.003, x + 0.005, y - 0.01, z + 0.004, F); };
const BANDS = {
  patchwork(g, len, r) {
    const n = Math.floor(len / 0.25), x0 = -n * 0.125;
    g.mat('cast', '#2a2622'); g.tube([[x0 - 0.05, Y1, 0.05], [-x0 + 0.05, Y1, 0.05]], 0.014, { segs: 4, caps: false });
    for (let i = 0; i < n; i++) for (let j = 0; j < 3; j++) { const x = x0 + i * 0.25, y = Y1 - 0.02 - (j + 1) * 0.24, sag = 0.012 * Math.sin((i + 0.5) / n * Math.PI); g.mat(['weave', 'stripe', 'motif', 'knit'][r.i(0, 3)], r.pick(CLOTH)); g.box(x, y - sag, 0.04, x + 0.25, y + 0.24 - sag, 0.052, F); }
    g.mat('weave', '#e0b040'); for (let j = 0; j <= 3; j++) g.box(x0, Y1 - 0.02 - j * 0.24 - 0.004, 0.052, -x0, Y1 - 0.02 - j * 0.24 + 0.004, 0.056, F);
    for (let i = 0; i <= n; i++) g.box(x0 + i * 0.25 - 0.004, Y1 - 0.74, 0.052, x0 + i * 0.25 + 0.004, Y1 - 0.02, 0.056, F);
  },
  patterns(g, len, r) {
    g.mat('cast', '#2a2622'); g.box(-len / 2, Y1 - 0.03, 0.0, len / 2, Y1, 0.02, { faces: 'yZ' });
    for (let x = -len / 2 + 0.25; x < len / 2 - 0.25; x += r.f(0.38, 0.55)) {
      const w = r.f(0.22, 0.36), h = r.f(0.45, 0.7), sk = r.f(-0.08, 0.08);
      g.mat('paper', r.pick(['#e8dcc0', '#d9c9a8', '#efe4c8', '#cdbb98']), { rough: 0.1 });
      g.quad([x - w / 2, Y1 - 0.06 - h, 0.01], [x + w / 2 + sk, Y1 - 0.06 - h * 0.92, 0.01], [x + w / 2, Y1 - 0.06, 0.01], [x - w / 2 - sk * 0.5, Y1 - 0.06, 0.01]);
      g.mat('plain', '#5a4a3a'); g.box(x - w / 2 + 0.03, Y1 - 0.06 - h * 0.5, 0.012, x + w / 2 - 0.03, Y1 - 0.06 - h * 0.5 + 0.004, 0.013, F);
      g.mat('cast', '#c9c4bb'); g.box(x - 0.006, Y1 - 0.09, 0.012, x + 0.006, Y1 - 0.075, 0.016, F);
    }
  },
  skeins(g, len, r) {
    g.mat('wood', '#6b4a2f'); g.tube([[-len / 2, Y1 - 0.02, 0.08], [len / 2, Y1 - 0.02, 0.08]], 0.016, { segs: 4, caps: false });
    for (const sx of [-1, 1]) g.box(sx * len / 2 - 0.015, Y1 - 0.04, 0.0, sx * len / 2 + 0.015, Y1, 0.1, { faces: 'xXZ' });
    // each skein a twisted loop seen flat: two strands that cross halfway down, and a knot
    const n = Math.floor(len / 0.2);
    for (let i = 0; i < n; i++) {
      const x = -len / 2 + 0.1 + i * 0.2, L = r.f(0.32, 0.5), c = hsl(i / n, 0.62, r.f(0.4, 0.6)), y0 = Y1 - 0.02, z = 0.08;
      g.mat('knit', c); g.quad([x - 0.035, y0 - L * 0.5, z + 0.01], [x + 0.035, y0 - L * 0.5, z + 0.01], [x + 0.012, y0, z], [x - 0.012, y0, z]); g.quad([x - 0.03, y0 - L, z + 0.012], [x + 0.03, y0 - L, z + 0.012], [x + 0.035, y0 - L * 0.5, z + 0.01], [x - 0.035, y0 - L * 0.5, z + 0.01]);
      g.mat('knit', hsl(i / n, 0.5, 0.3)); g.box(x - 0.03, y0 - L * 0.52, z + 0.011, x + 0.03, y0 - L * 0.46, z + 0.016, F);
    }
  },
  lampheads(g, len, r) {
    const n = Math.max(2, Math.floor(len / 0.6));
    for (let i = 0; i < n; i++) {
      const x = -len / 2 + (i + 0.5) * len / n, y = Y0 + 0.35 + (i % 2) * 0.12;
      g.mat('cast', r.pick(['#b08a45', '#3a3530', '#7a6a58'])); g.box(x - 0.04, y - 0.08, 0, x + 0.04, y + 0.08, 0.02, { faces: 'xXyYZ' }); g.box(x - 0.008, y - 0.008, 0.02, x + 0.008, y + 0.008, 0.12, { faces: 'xXyY' });
      g.mat(r.chance(0.5) ? 'glaze' : 'paint', r.pick(['#2f6f73', '#d6a640', '#8a2f3c', '#e9e1cf', '#33407a'])); g.lathe(x, 0.15, [[0.02, y + 0.06], [0.06, y + 0.02], [0.09, y - 0.06]], { segs: 7, capBottom: false, capTop: false });
      g.mat('diffuser', ['#ffc884', '#ffe0b0', '#fff4e6'][i % 3], { emissive: 2.4 }); g.ball(x, y - 0.02, 0.15, 0.035, 0.035, 0.035, { segs: 6, rings: 3 });
    }
  },
  drawings(g, len, r) {
    for (let x = -len / 2 + 0.25; x < len / 2 - 0.25; x += r.f(0.36, 0.48)) {
      const w = r.f(0.26, 0.34), h = r.f(0.2, 0.28), y = r.f(Y0 + 0.08, Y1 - 0.38), c = r.pick(['#f4ead2', '#e9d9b0', '#d8ecf0', '#f2d6d0']);
      g.mat('paper', c); g.box(x - w / 2, y, 0.002, x + w / 2, y + h, 0.006, F);
      g.mat('paint', r.pick(['#e8705a', '#e9b23c', '#2f8a85', '#3b4f8f', '#7cab4e']));
      if (r.chance(0.5)) g.cyl(x - w * 0.15, y + h * 0.55, 0.006, 0.06, 0.002, { segs: 8, capBottom: false }); else g.box(x - w * 0.35, y + h * 0.15, 0.006, x + w * 0.35, y + h * 0.35, 0.008, F);
      g.mat('paint', r.pick(['#3b4f8f', '#e8705a', '#3a3430'])); g.box(x + w * 0.05, y + h * 0.45, 0.006, x + w * 0.35, y + h * 0.75, 0.008, F);
      g.mat('cast', '#c8402e'); g.box(x - 0.008, y + h - 0.03, 0.006, x + 0.008, y + h - 0.014, 0.01, F);
    }
  },
  frames(g, len, r) {
    for (let x = -len / 2 + 0.22; x < len / 2 - 0.2; x += r.f(0.34, 0.5)) {
      const w = r.f(0.18, 0.34), h = r.f(0.22, 0.42), y = r.f(Y0 + 0.02, Y1 - h - 0.05), fr = r.pick(['#b08a45', '#3a2a1e', '#6b4a2f', '#2a2622', '#8a6d3b']);
      g.mat(r.chance(0.4) ? 'cast' : 'wood', fr); g.box(x - w / 2, y, 0.0, x + w / 2, y + h, 0.025, { faces: 'xXyYZ' });
      g.mat('paint', r.pick(['#2f4a3a', '#5b4060', '#d9c7a6', '#33407a', '#8a2f3c', '#e9e1cf', '#3a3a44'])); g.box(x - w / 2 + 0.03, y + 0.03, 0.025, x + w / 2 - 0.03, y + h - 0.03, 0.028, F);
      if (r.chance(0.5)) { g.mat('paint', r.pick(['#d6a640', '#e9e1cf', '#c8402e'])); g.cyl(x, y + h * 0.5, 0.028, Math.min(w, h) * 0.18, 0.002, { segs: 8, capBottom: false }); }
      tag(g, x + w / 2 - 0.02, y + 0.02, 0.03, '#e8c26a');
    }
  },
  plates(g, len, r) {
    g.mat('wood', '#5a3d28'); g.box(-len / 2, Y0 + 0.2, 0, len / 2, Y0 + 0.23, 0.11, { faces: 'yYZ' }); g.box(-len / 2, Y0 + 0.28, 0.09, len / 2, Y0 + 0.3, 0.11, { faces: 'yYZ' });
    for (let x = -len / 2 + 0.16; x < len / 2 - 0.12; x += 0.32) { const rr = r.f(0.1, 0.13); g.push(); g.move(x, Y0 + 0.23 + rr, 0.05); g.rotX(-Math.PI / 2 + 0.2); g.mat('glaze', r.pick(GLAZES), { rough: -0.2 }); g.lathe(0, 0, [[rr * 0.6, 0], [rr, 0.016], [0, 0.008]], { segs: 7, capBottom: false }); g.mat('glaze', r.pick(GLAZES)); g.lathe(0, 0, [[rr * 0.45, 0.0115], [0, 0.0115]], { segs: 7, capBottom: false, capTop: false }); g.pop(); }
  },
  wings(g, len, r) {
    const c = r.pick(['#26306b', '#2f6f8f', '#c8402e']), c2 = '#d6a640', span = Math.min(1.3, len / 2 - 0.1);
    g.mat('weave', c); g.tube([[-span, Y1 - 0.2, 0.03], [0, Y1 - 0.1, 0.03], [span, Y1 - 0.2, 0.03]], 0.03, { segs: 5 });
    for (const sx of [-1, 1]) {
      g.mat('weave', c); g.sheet([0, Y1 - 0.12, 0.02], [sx * span, Y1 - 0.22, 0.02], [sx * span * 0.5, Y0 + 0.02, 0.02], [0, Y0 + 0.08, 0.02], { nu: 3, nv: 3, ripple: 0.01 });
      g.mat('weave', c2); for (let k = 1; k <= 3; k++) { const t = k / 4; g.tube([[sx * span * t * 0.4, Y1 - 0.13, 0.03], [sx * span * (1 - t * 0.5), Y1 - 0.22 - t * 0.45, 0.03]], 0.006, { segs: 3, caps: false }); }
      g.mat('weave', c2); g.cyl(sx * span, Y1 - 0.24, 0.03, 0.034, 0.05, { segs: 6, capBottom: false });
    }
    g.mat('weave', c); g.box(-0.1, Y0 + 0.06, 0.01, 0.1, Y1 - 0.08, 0.05, { faces: 'xXYZ' });
  },
  kites(g, len, r) {
    for (let x = -len / 2 + 0.35; x < len / 2 - 0.3; x += r.f(0.55, 0.75)) {
      const y = r.f(Y0 + 0.3, Y1 - 0.25), a = r.pick(CLOTH), b = r.pick(CLOTH), k = 0.5;
      g.mat('weave', a); g.quad([x - 0.25 * k, y, 0.01], [x, y - 0.4 * k, 0.01], [x, y + 0.3 * k, 0.01], [x, y + 0.3 * k, 0.01]);
      g.mat('weave', b); g.quad([x, y - 0.4 * k, 0.01], [x + 0.25 * k, y, 0.01], [x, y + 0.3 * k, 0.01], [x, y + 0.3 * k, 0.01]);
      g.mat('weave', '#d8cdb8'); g.tube([[x, y - 0.2, 0.012], [x + 0.05, y - 0.4, 0.012], [x - 0.02, y - 0.55, 0.012]], 0.002, { segs: 3, caps: false });
    }
  },
  chairparts(g, len, r) {
    g.mat('wood', '#4a3424'); g.box(-len / 2, Y0 + 0.5, 0.0, len / 2, Y0 + 0.56, 0.03, { faces: 'yYZ' });
    for (let x = -len / 2 + 0.2; x < len / 2 - 0.2; x += r.f(0.3, 0.45)) {
      g.mat('wood', '#c9a06a'); g.box(x - 0.01, Y0 + 0.52, 0.03, x + 0.01, Y0 + 0.54, 0.1, { faces: 'xXYZ' });
      g.mat('wood', r.pick(['#6b4428', '#8a5a34', '#4a2e1c', '#c9a06a']));
      if (r.chance(0.5)) { for (const sx of [-1, 1]) g.tube([[x + sx * 0.14, Y0 + 0.52, 0.06], [x + sx * 0.13, Y0 - 0.15, 0.08]], 0.016, { segs: 4, caps: false }); for (const yy of [0.35, 0.18, 0.0]) g.box(x - 0.14, Y0 + yy, 0.05, x + 0.14, Y0 + yy + 0.05, 0.075, { faces: 'yYZ' }); }
      else g.tube([[x, Y0 + 0.52, 0.06], [x + 0.02, Y0 - 0.05, 0.07]], 0.018, { segs: 4, caps: false });
    }
  },
  letters(g, len, r) {
    for (let x = -len / 2 + 0.25; x < len / 2 - 0.2; x += r.f(0.4, 0.55)) {
      const w = r.f(0.24, 0.32), h = w * 1.3, y = r.f(Y0 + 0.02, Y1 - h - 0.06);
      g.mat('wood', r.pick(['#3a2a1e', '#4a3222', '#b08a45'])); g.box(x - w / 2, y, 0, x + w / 2, y + h, 0.025, { faces: 'xXyYZ' });
      g.mat('paper', '#efe4c8'); g.box(x - w / 2 + 0.025, y + 0.025, 0.025, x + w / 2 - 0.025, y + h - 0.025, 0.027, F);
      g.mat('plain', '#5a4a3a'); for (let k = 0; k < 8; k++) g.box(x - w / 2 + 0.05, y + h - 0.07 - k * 0.035, 0.0272, x + w / 2 - 0.05 - (k === 7 ? 0.08 : 0), y + h - 0.066 - k * 0.035, 0.028, F);
    }
  },
};
// A band, cached as a prop per kind, length (to half a metre) and variant, so a block of shops stamps them rather than drawing them.
defineProp('shops-craft.band', (g, p) => { BANDS[p.k](g, p.len, new Rng(hashStr('band' + p.k + p.len + p.v))); return { tier: 'd', cast: false }; });
export function upperBand(C, run, kind) {
  if (!BANDS[kind]) return;
  const a = (run.a0 + run.a1) / 2, len = Math.max(1, Math.floor((run.a1 - run.a0 - 0.2) * 2) / 2), p = C.pt(run, a, 0);
  C.propAt('shops-craft.band', p[0], 0, p[1], C.ryaw(run), { k: kind, len, v: (C.seed + (run.side === 'R' ? 1 : 0)) % 3 });
}

// What stands at the end of a run of shelves.
export const CLUTTER = {
  mender: [['craft.basket', { cols: ['#c8402e', '#e9e1cf', '#2f6f8f', '#2a2622'] }], ['crate', { w: 0.5, h: 0.32, d: 0.4, wood: '#a8794f' }]],
  tailor: [['crate', { w: 0.5, h: 0.32, d: 0.4, wood: '#8a6240' }], ['craft.basket', { cols: ['#26306b', '#e9e1cf', '#c8402e', '#d6a640'] }]],
  dyer: [['shops-craft.crock', { g: '#e6e1d5', l: '#2f6f8f', h: 0.5, r: 0.2 }], ['shops-craft.crock', { g: '#e6e1d5', l: '#c8402e', h: 0.42, r: 0.17 }]],
  chairs: [['craft.chair', { style: 'ladder', state: 'webbed', wood: '#5a3a22' }], ['crate', { w: 0.6, h: 0.4, d: 0.45, wood: '#8a6240' }]],
  lamps: [['books.standard', { shade: '#d9a24e', h: 1.45 }], ['crate', { w: 0.5, h: 0.32, d: 0.4, wood: '#6b4a2f' }]],
  flutes: [['shops-craft.stand', {}], ['shops-craft.flutestand', { len: 1.25, wood: '#4a2a18' }]],
  felt: [['shops-craft.roll', { c: '#2f6f73', h: 1.4, r: 0.15 }], ['shops-craft.roll', { c: '#c9552e', h: 1.2, r: 0.13 }]],
  books: [['crate', { w: 0.5, h: 0.3, d: 0.38, wood: '#6b4a2f' }], ['books.standard', { shade: '#b7832f', h: 1.4 }]],
  toys: [['toys.bin', { col: '#e9b23c', fill: 'balls', seed: 4 }], ['toys.bin', { col: '#2f8a85', fill: 'blocks', seed: 5 }]],
  second: [['chairs.sheeted', { sheet: '#ece4d2' }], ['crate', { w: 0.55, h: 0.35, d: 0.42, wood: '#8a6a44' }]],
  sleeves: [['crate', { w: 0.6, h: 0.35, d: 0.45, wood: '#8a6a44' }], ['craft.basket', { cols: ['#26306b', '#d6a640', '#e9e1cf', '#2f6f8f'] }]],
  kites: [['shops-craft.reel', { c: '#c8402e' }], ['crate', { w: 0.5, h: 0.32, d: 0.4, wood: '#b08d5e' }]],
  crocks: [['shops-craft.crock', { g: '#8a5a3c', h: 0.55, r: 0.22 }], ['shops-craft.crock', { g: '#2f6f73', h: 0.45, r: 0.18, l: '#d6a640' }]],
};
export const BAND_OF = { mender: 'patchwork', tailor: 'patterns', dyer: 'skeins', chairs: 'chairparts', lamps: 'lampheads', books: 'letters', toys: 'drawings', second: 'frames', sleeves: 'wings', kites: 'kites', crocks: 'plates' };
