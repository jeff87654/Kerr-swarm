// The workshops' props: a plain hired bench, what is on it (by the work being done), and the machines behind the rail.
// Front toward +z; the person working a bench stands at +z.
import { defineProp } from '../world/props.js';
import { Rng, hashStr, shadeHex } from '../core/util.js';
import { drawChair, drawCoat, CLOTH, GL } from './lots_market_goods.js';

export const benchProps = true;

// A workbench, hired by the hour: a thick top with a number painted on its edge, four legs, a shelf. p: { w, wood }
defineProp('lots-market.bench', (g, p) => {
  const w = p.w || 2.0, d = 0.72, h = 0.86, wood = p.wood || '#8a6a44';
  g.mat('wood', wood, { rough: 0.05 }); g.box(-w / 2, h - 0.07, -d / 2, w / 2, h, d / 2, { bevel: 0.012 });
  g.mat('wood', shadeHex(wood, 0.75));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (w / 2 - 0.1) - 0.04, 0, sz * (d / 2 - 0.08) - 0.04, sx * (w / 2 - 0.1) + 0.04, h - 0.07, sz * (d / 2 - 0.08) + 0.04, { faces: 'xXzZ' });
  g.box(-w / 2 + 0.06, 0.2, -d / 2 + 0.06, w / 2 - 0.06, 0.23, d / 2 - 0.06, { faces: 'yYzZxX' });
  g.box(-w / 2 + 0.1, 0.62, -d / 2 + 0.04, w / 2 - 0.1, 0.78, -d / 2 + 0.07, { faces: 'zZ' });
  // the vice at the front right, a number plate on the front edge
  g.mat('wood', shadeHex(wood, 1.15)); g.box(w / 2 - 0.45, h - 0.24, d / 2, w / 2 - 0.12, h - 0.01, d / 2 + 0.06, { faces: 'xXyYZ' });
  g.mat('cast', '#3c4148'); g.box(w / 2 - 0.4, h - 0.13, d / 2 + 0.06, w / 2 - 0.17, h - 0.11, d / 2 + 0.12, { faces: 'xXyYZ' });
  g.mat('paint', '#e9e1cf'); g.box(-0.09, h - 0.065, d / 2 + 0.001, 0.09, h - 0.012, d / 2 + 0.004, { faces: 'Z' });
  g.mat('paint', '#2a2622'); g.box(-0.02, h - 0.058, d / 2 + 0.004, 0.02, h - 0.02, d / 2 + 0.006, { faces: 'Z' });
  // offcuts on the shelf
  g.mat('wood', shadeHex(wood, 1.2)); g.box(-w / 2 + 0.2, 0.23, -0.18, -w / 2 + 0.7, 0.3, 0.15, { faces: 'xXYzZ' });
  g.mat('wood', shadeHex(wood, 0.9)); g.box(0.1, 0.23, -0.2, 0.5, 0.27, 0.2, { faces: 'xXYzZ' });
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2 + 0.12]], tier: 's' };
});

// What is on a bench. p: { t: 'carve' | 'mend' | 'sew' | 'tune' | 'dye', v } (drawn on the bench top at y = 0)
defineProp('lots-market.project', (g, p) => {
  const r = new Rng(hashStr('pj' + p.t + p.v)), t = p.t;
  if (t === 'carve') {
    g.mat('wood', ['#c9a06a', '#b07a42', '#d9b98a'][p.v % 3]); g.box(-0.45, 0, -0.12, 0.35, 0.05, 0.14, { faces: 'xXYzZ' });
    g.mat('wood', '#7a4a2a'); g.box(0.45, 0, -0.04, 0.6, 0.08, 0.05, { faces: 'xXYzZ' }); g.box(0.52, 0.03, 0.05, 0.54, 0.05, 0.28, { faces: 'xXYZ' });
    g.mat('cast', '#b9b6ae'); g.box(-0.1, 0, 0.18, 0.12, 0.006, 0.2, { faces: 'Y' }); g.mat('wood', '#9a6a3a'); g.box(0.12, 0, 0.17, 0.24, 0.022, 0.21, { faces: 'xXYzZ' });
    g.mat('wood', '#e0c49a'); for (let i = 0; i < 6; i++) { const x = r.f(-0.4, 0.3), z = r.f(-0.25, 0.3); g.tube([[x, 0.005, z], [x + 0.02, 0.025, z + 0.01], [x + 0.04, 0.008, z]], 0.006, { segs: 3, caps: false }); }
  } else if (t === 'mend') {
    drawChair(g, 0, 0.9, 0, 0.3 + p.v * 0.4, ['#6b4a2f', '#8a6240', '#5a3a26'][p.v % 3], 'wood', true);
    g.mat('cast', '#c9552e'); for (const x of [-0.17, 0.17]) { g.box(x - 0.012, 0.4, -0.25, x + 0.012, 0.46, 0.25, { faces: 'xXyYzZ' }); }
    g.mat('glaze', '#6b4a2f'); g.lathe(0.55, 0.15, [[0.055, 0], [0.06, 0.1], [0, 0.11]], { segs: 7 });
  } else if (t === 'sew') {
    const c = CLOTH[(p.v * 3 + 1) % CLOTH.length];
    g.mat('weave', c); g.box(-0.5, 0, -0.25, 0.3, 0.02, 0.25, { faces: 'xXYzZ' });
    g.mat('weave', p.v % 2 ? '#e8c26a' : '#c8402e'); g.box(-0.2, 0.02, -0.05, -0.05, 0.024, 0.08, { faces: 'Y' });
    for (let i = 0; i < 4; i++) { g.mat('knit', CLOTH[(i * 4 + p.v) % CLOTH.length]); g.cyl(0.42 + (i % 2) * 0.06, 0, -0.15 + Math.floor(i / 2) * 0.07, 0.02, 0.05, { segs: 6 }); }
    g.mat('cast', '#9a9488'); g.box(0.4, 0, 0.12, 0.6, 0.006, 0.16, { faces: 'Y' });
  } else if (t === 'tune') {
    g.mat('wood', ['#b07a42', '#8a5a34', '#c9a06a'][p.v % 3]); g.push(); g.move(-0.6, 0.03, 0.02); g.rotZ(-Math.PI / 2); g.cyl(0, 0, 0, 0.026, 1.2, { segs: 8 }); g.pop();
    g.mat('cast', '#b08a45'); for (const x of [-0.4, -0.1, 0.2]) g.cyl(x, 0.003, 0.02, 0.029, 0.054, { segs: 8, capTop: false, capBottom: false });
    g.mat('cast', '#c9c4bb'); g.box(0.42, 0, -0.2, 0.44, 0.006, 0.0, { faces: 'Y' }); g.box(0.46, 0, -0.2, 0.48, 0.006, 0.0, { faces: 'Y' });
    g.mat('paper', '#efe6d2'); g.box(0.3, 0, 0.05, 0.6, 0.004, 0.3, { faces: 'Y' });
  } else {
    for (const [x, c] of [[-0.35, CLOTH[p.v % CLOTH.length]], [0.05, CLOTH[(p.v + 5) % CLOTH.length]]]) {
      g.mat('glaze', '#e9e1cf'); g.lathe(x, 0, [[0.14, 0], [0.16, 0.22]], { segs: 9, capBottom: false, capTop: false });
      g.mat('plain', c, { rough: -0.4 }); g.cyl(x, 0.17, 0, 0.155, 0.004, { segs: 9, capBottom: false });
    }
    g.mat('wood', '#c9a06a'); g.box(-0.55, 0.3, -0.01, 0.35, 0.32, 0.01, { faces: 'xXyYzZ' });
    g.mat('weave', CLOTH[(p.v + 5) % CLOTH.length]); g.sheet([0.0, 0.31, 0.012], [0.3, 0.31, 0.012], [0.32, 0.05, 0.02], [0.02, 0.05, 0.02], { nu: 2, nv: 2, ripple: 0.01, rippleN: 2 });
    g.mat('paint', '#3a2a20'); g.box(0.3, 0, 0.15, 0.55, 0.02, 0.3, { faces: 'xXYzZ' });
  }
  return { cast: false };
});

// An enamel shade on a rod over a bench: coloured outside, white inside, a warm bulb. Hung with its rim at y = 0. p: { c }
defineProp('lots-market.shade', (g, p) => {
  g.mat('cast', '#2a2622'); g.box(-0.008, 0.12, -0.008, 0.008, 1.15, 0.008, { faces: 'xXzZ' });
  g.mat('paint', p.c || '#2f5a44', { rough: -0.3 }); g.lathe(0, 0, [[0.24, 0], [0.16, 0.06], [0.05, 0.12], [0.03, 0.14]], { segs: 10, capBottom: false });
  g.mat('paint', '#f1ead8'); g.lathe(0, 0, [[0.03, 0.135], [0.05, 0.115], [0.16, 0.055], [0.235, 0.002]], { segs: 10, capBottom: false, capTop: false });
  g.mat('diffuser', '#ffe2b0', { emissive: 4, lamp: true }); g.ball(0, 0.07, 0, 0.045, 0.05, 0.045, { segs: 7, rings: 4 });
  return { cast: false, tier: 'd' };
});

// A fly press: a cast C-frame on a stand, the screw, the weighted arm. p: {}
defineProp('lots-market.press', (g) => {
  g.mat('cast', '#2f4a44', { rough: 0.05 }); g.box(-0.3, 0, -0.3, 0.3, 0.8, 0.3, { faces: 'xXYzZ' });
  g.mat('cast', '#7d3526'); g.box(-0.12, 0.8, -0.22, 0.12, 0.88, 0.2, { faces: 'xXYzZ' }); g.box(-0.1, 0.88, -0.22, 0.1, 1.5, -0.08, { faces: 'xXzZ' }); g.box(-0.12, 1.42, -0.22, 0.12, 1.55, 0.12, { faces: 'xXyYzZ' });
  g.mat('cast', '#c9c4bb', { rough: -0.3 }); g.cyl(0, 1.1, 0.04, 0.025, 0.6, { segs: 8 });
  g.tube([[-0.55, 1.62, 0.04], [0.55, 1.62, 0.04]], 0.016, { segs: 6 });
  g.mat('cast', '#2a2622'); for (const sx of [-1, 1]) g.ball(sx * 0.58, 1.62, 0.04, 0.07, 0.07, 0.07, { segs: 8, rings: 5 });
  g.mat('paint', '#e8c242'); g.box(-0.31, 0.79, 0.3, 0.31, 0.81, 0.31, { faces: 'Z' });
  return { solid: [[-0.3, 0, -0.3, 0.3, 1.6, 0.3]], spots: [{ type: 'work', x: 0, y: 0, z: 0.7, yaw: Math.PI, tags: ['mend', 'machine'] }], tier: 's' };
});

// A bandsaw: a tall cabinet with its two wheel housings, a table, a guard. p: {}
defineProp('lots-market.bandsaw', (g) => {
  g.mat('paint', '#3a5a4a'); g.box(-0.3, 0, -0.25, 0.3, 0.7, 0.25, { faces: 'xXYzZ' });
  g.mat('paint', '#c9c4a8'); g.box(-0.32, 0.9, -0.18, 0.32, 1.9, 0.0, { faces: 'xXyYzZ' });
  for (const y of [1.05, 1.75]) { g.push(); g.move(0, y, 0.0); g.rotX(Math.PI / 2); g.cyl(0, 0, 0, 0.3, 0.06, { segs: 14 }); g.pop(); }
  g.mat('cast', '#3c4148'); g.box(-0.3, 0.9, -0.2, 0.3, 0.94, 0.3, { faces: 'xXyYzZ' }); g.box(0.24, 0.7, -0.05, 0.28, 0.9, 0.0, { faces: 'xXzZ' });
  g.mat('cast', '#c9c4bb', { rough: -0.3 }); g.box(-0.004, 0.94, 0.08, 0.004, 1.5, 0.09, { faces: 'xX' });
  g.mat('paint', '#e8c242'); g.box(-0.05, 1.3, 0.06, 0.05, 1.55, 0.1, { faces: 'xXzZ' });
  return { solid: [[-0.32, 0, -0.25, 0.32, 1.9, 0.3]], spots: [{ type: 'work', x: 0, y: 0, z: 0.75, yaw: Math.PI, tags: ['carve', 'machine'] }], tier: 's' };
});

// An electric kiln for crocks: a squat insulated box on legs, a hinged lid, dials and a lit lamp when it is firing. p: {}
defineProp('lots-market.kiln', (g) => {
  g.mat('cast', '#2a2622'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * 0.42 - 0.03, 0, sz * 0.42 - 0.03, sx * 0.42 + 0.03, 0.3, sz * 0.42 + 0.03, { faces: 'xXzZ' });
  g.mat('brushed', '#b4b8b6', { rough: -0.1 }); g.lathe(0, 0, [[0.5, 0.3], [0.5, 1.0]], { segs: 8, capBottom: true, capTop: false });
  g.mat('brushed', '#9a9e9c'); g.lathe(0, 0, [[0.52, 1.0], [0.52, 1.08], [0.15, 1.12], [0, 1.12]], { segs: 8 });
  g.mat('cast', '#3c4148'); for (const y of [0.45, 0.85]) g.lathe(0, 0, [[0.51, y], [0.51, y + 0.03]], { segs: 8, capTop: false, capBottom: false });
  g.mat('paint', '#2a2622'); g.box(-0.18, 0.55, 0.47, 0.18, 0.8, 0.55, { faces: 'xXyYZ' });
  g.mat('diffuser', '#ff7a2f', { emissive: 4, lamp: false }); g.ball(-0.1, 0.72, 0.555, 0.014, 0.014, 0.008, { segs: 6, rings: 4 });
  g.mat('cast', '#c9c4bb'); for (const x of [0.0, 0.1]) g.cyl(x, 0.62, 0.55, 0.025, 0.02, { segs: 8 });
  g.mat('paper', '#f3ead6'); g.box(-0.15, 0.85, 0.505, 0.15, 0.97, 0.51, { faces: 'Z' });
  return { solid: [[-0.52, 0, -0.52, 0.52, 1.12, 0.52]], spots: [{ type: 'work', x: 0.6, y: 0, z: 0.75, yaw: Math.PI + 0.5, tags: ['dye', 'machine'] }], tier: 's' };
});

// A pillar drill on a stand. p: {}
defineProp('lots-market.drill', (g) => {
  g.mat('cast', '#2f4a44'); g.box(-0.25, 0, -0.3, 0.25, 0.08, 0.25, { faces: 'xXYzZ' });
  g.mat('cast', '#c9c4bb', { rough: -0.25 }); g.cyl(0, 0.08, -0.18, 0.04, 1.6, { segs: 8 });
  g.mat('cast', '#2f4a44'); g.box(-0.18, 0.75, -0.25, 0.18, 0.8, 0.12, { faces: 'xXyYzZ' }); g.box(-0.14, 1.4, -0.28, 0.14, 1.72, 0.18, { faces: 'xXyYzZ' });
  g.mat('cast', '#3c4148'); g.cyl(0, 1.25, 0.06, 0.02, 0.15, { segs: 6 }); g.tube([[0.14, 1.5, 0], [0.32, 1.42, 0.05]], 0.01, { segs: 4 });
  return { solid: [[-0.25, 0, -0.3, 0.25, 1.72, 0.25]], spots: [{ type: 'work', x: 0, y: 0, z: 0.6, yaw: Math.PI, tags: ['tune', 'machine'] }], tier: 's' };
});

// A rack of work waiting to be collected: two shelves and a hanging rail, every thing tagged. p: { w, v }
defineProp('lots-market.waiting', (g, p) => {
  const w = p.w || 2.0, r = new Rng(hashStr('wt' + w + p.v));
  g.mat('wood', '#5a3a26'); for (const sx of [-1, 1]) g.box(sx * w / 2 - 0.04, 0, -0.22, sx * w / 2 + 0.04, 2.1, 0.22, { faces: 'xXzZY' });
  g.mat('wood', '#7a5233'); for (const y of [0.35, 1.0]) g.box(-w / 2, y - 0.03, -0.22, w / 2, y, 0.22, { faces: 'yYzZ' });
  g.mat('cast', '#2a2622'); g.box(-w / 2, 1.98, -0.01, w / 2, 2.0, 0.01, { faces: 'yYzZ' });
  const tag = (x, y, z) => { g.mat('paper', '#f3ead6'); g.box(x - 0.025, y - 0.07, z, x + 0.025, y - 0.03, z + 0.003, { faces: 'Z' }); g.mat('weave', '#c8402e'); g.box(x - 0.002, y - 0.03, z, x + 0.002, y, z + 0.003, { faces: 'Z' }); };
  // on the low shelf a chair and crocks, on the high shelf small things, on the rail coats
  drawChair(g, -w / 4, 0.35, 0, 0.3, r.pick(['#6b4a2f', '#8a6240', '#2f6f73']), 'rush', false); tag(-w / 4 + 0.15, 0.8, 0.21);
  for (let i = 0; i < 3; i++) { const x = w / 8 + i * 0.22; g.mat('glaze', r.pick(GL)); g.lathe(x, 0, [[0.07, 0.35], [0.09, 0.45], [0.07, 0.55]], { segs: 7, capBottom: false }); g.mat('glaze', r.pick(GL)); g.lathe(x, 0, [[0.075, 0.55], [0.03, 0.58], [0, 0.6]], { segs: 7 }); tag(x, 0.5, 0.1); }
  for (let i = 0; i < 4; i++) { const x = -w / 2 + 0.3 + i * (w - 0.6) / 3; g.mat(i % 2 ? 'wood' : 'paint', i % 2 ? '#c9a06a' : r.pick(CLOTH)); g.box(x - 0.14, 1.0, -0.12, x + 0.14, 1.0 + 0.08 + (i % 3) * 0.06, 0.12, { faces: 'xXYzZ' }); tag(x, 1.25, 0.13); }
  for (let i = 0; i < 2; i++) { const x = (i - 0.5) * w * 0.5; drawCoat(g, x, 1.97, 0.0, r.pick(CLOTH), r.pick(['#e8c26a', '#c8402e'])); tag(x + 0.16, 1.6, 0.08); }
  return { solid: [[-w / 2, 0, -0.22, w / 2, 2.1, 0.22]], tier: 's', cast: false };
});
