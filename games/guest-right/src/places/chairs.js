// Second Sitting: Gustav Lomu's chair remaker's on Thread Street (west side, x[-13, -3] z[50, 61]).
// What it is about: the best chair in a room is the oldest one. From the door the eye runs diagonally across the shop to a
// very old chair under a white sheet in the far corner, lit by one warm spot, while stripped frames hang upside down from the
// beams overhead. Palette: deep bottle green below, ochre plaster above, honey timber, rust webbing, cream sheet.
import { lamp, block } from '../world/kit.js';
import { shopfront } from '../world/kit2.js';
import { prop, defineProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { deckRadius } from '../core/drum.js';
import { SIGNS } from '../content/signs.js';
import { PLACES } from '../content/places.js';
import { Rng, hashStr, mixHex } from '../core/util.js';
import { shell, streetSign, talk, readCard, found, shopMenu, seat, drawChair, drawClamp, drawTag } from './craft_parts.js';

const X0 = -13, X1 = -3, Z0 = 50, Z1 = 61, H = 3.2;

// A chair under a dust sheet: only its carved feet show.
defineProp('chairs.sheeted', (g, p) => {
  const c = p.sheet || '#ece4d2';
  g.mat('wood', '#3a2418', { rough: -0.1 }); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.ball(sx * 0.33, 0.04, sz * 0.31, 0.04, 0.045, 0.04, { segs: 8, rings: 5 });
  g.mat('weave', c);
  g.sheet([-0.36, 1.08, -0.36], [0.36, 1.08, -0.36], [0.38, 0.56, -0.2], [-0.38, 0.56, -0.2], { nu: 6, nv: 4, ripple: 0.02 });
  g.sheet([-0.38, 0.56, -0.2], [0.38, 0.56, -0.2], [0.42, 0.52, 0.36], [-0.42, 0.52, 0.36], { nu: 6, nv: 4, sag: 0.04, sagEdge: 'all' });
  g.sheet([-0.42, 0.52, 0.36], [0.42, 0.52, 0.36], [0.47, 0.03, 0.46], [-0.47, 0.03, 0.46], { nu: 8, nv: 5, ripple: 0.035, rippleN: 5 });
  for (const sx of [-1, 1]) {
    g.sheet([sx * 0.4, 0.74, 0.36], [sx * 0.4, 0.74, -0.34], [sx * 0.48, 0.03, -0.38], [sx * 0.48, 0.03, 0.44], { nu: 7, nv: 5, ripple: 0.03, rippleN: 4 });
    g.sheet([sx * 0.36, 1.08, -0.36], [sx * 0.4, 0.74, 0.3], [sx * 0.4, 0.74, 0.3], [sx * 0.38, 0.6, -0.34], { nu: 3, nv: 3 });
  }
  g.sheet([0.36, 1.08, -0.36], [-0.36, 1.08, -0.36], [-0.44, 0.03, -0.44], [0.44, 0.03, -0.44], { nu: 8, nv: 6, ripple: 0.03, rippleN: 5 });
  g.tube([[-0.36, 1.08, -0.36], [0.36, 1.08, -0.36]], 0.03, { segs: 6 });
  return { solid: [[-0.48, 0, -0.44, 0.48, 1.1, 0.46]], tier: 's' };
});

// A sofa: an armchair's frame drawn long. p: { state, cloth, wood }
defineProp('chairs.sofa', (g, p) => {
  g.push(); g.scale(2.3, 1, 1); drawChair(g, { style: 'arm', state: p.state || 'webbed', cloth: p.cloth, wood: p.wood }); g.pop();
  return { solid: [[-0.88, 0, -0.34, 0.88, 0.66, 0.33]], tier: 's' };
});

const ROW = [
  { style: 'ladder', state: 'done', wood: '#5a3a22', seat: 'rush' },
  { style: 'spindle', state: 'done', wood: '#7a5233' },
  { style: 'arm', state: 'done', wood: '#4a2e1c', cloth: '#a0452e' },
  { style: 'slat', state: 'done', wood: '#8a6a44', seat: 'cloth', cloth: '#2f4a3a' },
  { style: 'ladder', state: 'done', wood: '#9a7448', seat: 'cloth', cloth: '#d6a640' },
  { style: 'spindle', state: 'done', wood: '#3a2418' },
];

export const place = {
  id: 'chairs', name: 'Second Sitting', order: 54,
  build(game) {
    const f = game.world.frame('candlewick', deckRadius(16), 0, 625);
    const s = game.world.scope('chairs', f), g = s.g;
    const P = PLACES.chairs, r = new Rng(hashStr('chairs'));

    // ---------- shell ----------
    const clip = shell(s, { x0: X0, x1: X1, z0: Z0, z1: Z1, front: 'e', h: H, floor: ['planks', '#7d5a3a'], ceil: ['paint', '#e3d2b2'],
      wall: '#d6ae6e', dado: { h: 1.15, mat: 'planks', tint: '#2f4a3a' }, skirt: '#1e2a22', beam: '#3a2a1e', rail: '#2f4a3a', pipes: ['#2f4a3a', '#a0452e'],
      glow: { sky: '#ffd8a0', ground: '#8a6440', power: 0.13 } });
    const pal = { frame: '#2f4a3a', plinth: '#22362b', awning: ['#c58a3a', '#2f4a3a'] };
    shopfront(s, { side: 'e', a0: Z0 + 0.05, a1: Z1 - 0.05, c: X1, y: 0, h: H, fascia: Object.assign({}, SIGNS['chairs.fascia'], { palette: ['#2f4a3a', '#f3e6c8', '#c58a3a'], emblem: 'chair' }),
      palette: pal, door: { at: 0.6, w: 1.1, tint: '#2f4a3a', label: P.name }, awning: { depth: 1.0, stripes: pal.awning }, plinth: 0.4 });
    streetSign(s, Object.assign({}, SIGNS['chairs.hanging'], { palette: ['#f0e2c0', '#2f4a3a', '#a0452e'] }), X1, Z1 - 0.75, 1);
    prop(s, 'rug', -3.9, 0, 51.2, Math.PI / 2, { w: 1.0, d: 0.7, a: '#2f4a3a', b: '#c58a3a', mat: 'rush' });
    // shavings and sawdust on the floor, thickest by the bench and the lathe
    s.deco(() => {
      g.mat('wood', '#c9a46e');
      for (let i = 0; i < 70; i++) {
        const x = i < 45 ? r.f(-12.5, -8.6) : r.f(-12.2, -10.8), z = i < 45 ? r.f(51.0, 52.0) : r.f(52.0, 53.6), a = r.f(0, 6.28);
        const pts = []; for (let k = 0; k <= 5; k++) { const t = k / 5 * Math.PI * 1.7; pts.push([x + Math.cos(a) * k * 0.012 + Math.cos(t) * 0.012, 0.012 + Math.sin(t) * 0.01, z + Math.sin(a) * k * 0.012 + Math.sin(t) * 0.004]); }
        g.tube(pts, 0.0035, { segs: 3, caps: false });
      }
      g.mat('plain', '#9a7a52', { rough: 0.3 }); for (let i = 0; i < 14; i++) g.cyl(r.f(-12.4, -8.8), 0.001, r.f(50.9, 52.2), r.f(0.08, 0.22), 0.002, { segs: 9, capBottom: false });
    });

    // ---------- the window: a finished bow-back, a rush ladderback, an armchair, and a card ----------
    block(s, -4.3, 0, 54.4, X1 - 0.12, 0.45, Z1 - 0.2, 'wood', '#22362b', { bevel: 0.015 });
    s.detail(() => { g.mat('felt', '#a0452e'); g.box(-4.26, 0.45, 54.44, X1 - 0.16, 0.462, Z1 - 0.24, { faces: 'Y' }); });
    prop(s, 'craft.chair', -3.75, 0.46, 55.5, Math.PI / 2 + 0.35, { style: 'spindle', state: 'done', wood: '#6b4428' }, { noSpots: true });
    prop(s, 'craft.chair', -3.72, 0.46, 57.4, Math.PI / 2 - 0.2, { style: 'ladder', state: 'done', wood: '#4a2e1c', seat: 'rush' }, { noSpots: true });
    prop(s, 'craft.chair', -3.8, 0.46, 59.5, Math.PI / 2 - 0.4, { style: 'arm', state: 'done', wood: '#3a2418', cloth: '#c58a3a', stud: '#2a2622' }, { noSpots: true });
    sign(s, { kind: 'notice', title: 'In the window', lines: ['Bow-back, 96 years.', 'Ladderback, 140 years.', 'Armchair, 71 years.', 'Older than the shop.', 'Ask inside.'], hand: true }, -3.4, 0.86, 58.45, { face: 'X', w: 0.3, h: 0.42 });
    s.detail(() => { g.mat('wood', '#22362b'); for (const dz of [-0.12, 0.12]) g.tube([[-3.45, 0.46, 58.45 + dz], [-3.42, 1.1, 58.45 + dz * 0.6]], 0.008, { segs: 4 }); g.tube([[-3.6, 0.46, 58.45], [-3.43, 1.05, 58.45]], 0.008, { segs: 4 }); g.box(-3.44, 0.62, 58.25, -3.38, 0.64, 58.65); });
    lamp(s, 'spot', -3.55, H, 56.3, { clip, K: 3000, power: 0.6, cone: [48, 20] });
    lamp(s, 'spot', -3.55, H, 59.2, { clip, K: 3000, power: 0.6, cone: [48, 20] });

    // ---------- the bench along the north wall: a chair in clamps, glue, a shadow board of tools ----------
    prop(s, 'craft.bench', -10.6, 0, 50.62, 0, { w: 3.6, d: 0.75, wood: '#9a7448' }, { spot: { tags: ['carve', 'glue'] } });
    prop(s, 'craft.toolboard', -10.6, 1.28, Z0 + 0.18, 0, { w: 3.2, h: 0.9, board: '#22362b' });
    s.detail(() => {
      g.push(); g.move(-11.3, 0.86, 50.62); g.rotY(0.25); drawChair(g, { style: 'ladder', state: 'bare', wood: '#6b4428' }); g.pop();
      for (const dz of [-0.2, 0.2]) { g.push(); g.move(-11.62, 0.86 + 0.42, 50.62 + dz); g.rotY(0.25); drawClamp(g, 0.68); g.pop(); }
      g.push(); g.move(-11.62, 0.86 + 0.16, 50.62); g.rotY(0.25 + Math.PI / 2); drawClamp(g, 0.6, { jaw: '#d6a640' }); g.pop();
      // a mallet, a chisel, a coil of webbing, tacks in a tin
      g.mat('wood', '#c9a06a'); g.box(-10.1, 0.86, 50.3, -9.95, 0.94, 50.42, { bevel: 0.01 }); g.mat('wood', '#7a4a2a'); g.tube([[-10.02, 0.9, 50.42], [-9.9, 0.9, 50.72]], 0.012, { segs: 5 });
      g.mat('weave', '#cdb07a'); g.lathe(-9.5, 50.5, [[0.12, 0.86], [0.12, 0.92], [0.04, 0.92], [0.04, 0.86]], { segs: 14 });
      g.mat('cast', '#8c8a84'); g.cyl(-9.2, 0.86, 50.75, 0.04, 0.04, { segs: 10 });
      g.mat('cast', '#b9b6ae', { rough: -0.2 }); g.box(-9.05, 0.86, 50.5, -9.03, 0.87, 50.7); g.mat('wood', '#9a6a3a'); g.tube([[-9.04, 0.87, 50.7], [-9.04, 0.87, 50.86]], 0.011, { segs: 5 });
    });
    prop(s, 'craft.gluepot', -10.4, 0.86, 50.8, 0, { glaze: '#6b4a2f' });
    prop(s, 'craft.gluepot', -10.25, 0.86, 50.38, 1, { glaze: '#2f4a3a' });
    lamp(s, 'strip', -12.2, 2.45, 50.85, { to: [-9.0, 2.45, 50.85], clip, K: 4000, power: 0.8 });
    // the timber rack over the lathe, on the back wall
    s.furniture(() => {
      g.mat('cast', '#2a2622'); for (const z of [51.6, 53.0, 54.4]) for (const y of [2.15, 2.55]) g.box(-12.84, y - 0.03, z - 0.02, -12.45, y, z + 0.02);
      const woods = ['#b07a42', '#8a5a34', '#c9a06a', '#6b4428', '#d0a870', '#9a6a3a'];
      for (let i = 0; i < 6; i++) { g.mat('wood', woods[i]); const y = (i < 3 ? 2.15 : 2.55) + (i % 3) * 0.035; const x = -12.8 + (i % 3) * 0.12; g.box(x, y, 51.35 + r.f(0, 0.2), x + 0.1, y + 0.03, 54.7 - r.f(0, 0.3), { bevel: 0.004 }); }
    });
    prop(s, 'craft.lathe', -12.35, 0, 52.7, Math.PI / 2, { len: 1.25, piece: '#c9a06a' });
    s.detail(() => { g.mat('wood', '#c9a06a'); for (let i = 0; i < 6; i++) g.lathe(-12.0 + (i % 3) * 0.08, 53.55 + Math.floor(i / 3) * 0.08, [[0.022, 0], [0.026, 0.03], [0.02, 0.06], [0.024, 0.09], [0.0, 0.095]], { segs: 8 }); });
    // a barrel of cloth on end, and a box of springs
    s.furniture(() => {
      g.mat('cane', '#a07848'); g.lathe(-8.1, 50.75, [[0.22, 0], [0.26, 0.3], [0.25, 0.6], [0.0, 0.6]], { segs: 14, capTop: false });
      const cl = ['#a0452e', '#c58a3a', '#2f4a3a', '#ece4d2', '#26306b', '#6c9a4c', '#5b4060'];
      cl.forEach((c, i) => { const a = i / cl.length * 6.28; g.mat(i % 2 ? 'stripe' : 'weave', c); g.tube([[-8.1 + Math.cos(a) * 0.12, 0.1, 50.75 + Math.sin(a) * 0.12], [-8.1 + Math.cos(a) * 0.16, 1.05 + (i % 3) * 0.08, 50.75 + Math.sin(a) * 0.16]], 0.055, { segs: 9 }); });
    });
    s.post(-8.1, 50.75, 0.27, 0, 1.2);
    s.spot('work', -11.85, 0, 52.7, -Math.PI / 2, { tags: ['carve', 'turn'] });

    // ---------- the middle: an armchair being re-webbed on a low trestle; frames hung from the beams ----------
    block(s, -9.3, 0, 54.7, -8.1, 0.24, 55.9, 'wood', '#6b4a2f', { bevel: 0.01 });
    prop(s, 'craft.chair', -8.7, 0.24, 55.3, -0.3, { style: 'arm', state: 'webbed', wood: '#5a3a22' }, { noSpots: true });
    s.detail(() => {
      g.mat('weave', '#cdb07a'); g.lathe(-9.15, 56.25, [[0.14, 0], [0.14, 0.09], [0.05, 0.09], [0.05, 0]], { segs: 14 });
      g.mat('wood', '#7a5233'); g.box(-8.0, 0, 56.1, -7.6, 0.18, 56.4, { bevel: 0.01 });
      g.mat('cast', '#8c8a84', { rough: -0.2 });
      for (let k = 0; k < 7; k++) { const cx = -7.92 + (k % 4) * 0.08, cz = 56.18 + Math.floor(k / 4) * 0.12; const c = []; for (let i = 0; i <= 20; i++) { const a = i / 20 * Math.PI * 2 * 3; c.push([cx + Math.cos(a) * 0.035, 0.18 + i / 20 * 0.09, cz + Math.sin(a) * 0.035]); } g.tube(c, 0.003, { segs: 3 }); }
    });
    prop(s, 'stool', -9.6, 0, 55.9, 0, { wood: '#6b4a2f', h: 0.5 }, { noSpots: true });
    s.spot('work', -9.55, 0, 55.6, Math.PI / 2, { tags: ['carve', 'upholster'], who: 'gustav' });
    lamp(s, 'globe', -8.75, 2.2, 55.3, { clip, K: 2800, power: 0.85, drop: 1.0, r: 0.15 });
    const hung = [[-10.8, 53.4, 0.3, 'ladder'], [-7.0, 53.0, 1.2, 'spindle'], [-10.4, 57.6, -0.6, 'slat'], [-6.4, 57.9, 2.2, 'ladder'], [-8.6, 58.8, 0.9, 'spindle'], [-5.6, 55.4, -1.1, 'arm']];
    s.deco(() => {
      for (const h of hung) {
        const top = h[3] === 'arm' ? 2.95 : 3.0;
        g.push(); g.move(h[0], top, h[1]); g.rotZ(Math.PI); g.rotY(h[2]); drawChair(g, { style: h[3], state: 'bare', wood: mixHex('#8a5a34', '#c9a06a', r.next()) }); g.pop();
        g.mat('weave', '#b8a888'); g.tube([[h[0] - 0.12, top + 0.01, h[1]], [h[0], H - 0.02, h[1]], [h[0] + 0.12, top + 0.01, h[1]]], 0.006, { segs: 4 });
        g.mat('cast', '#2a2622'); g.box(h[0] - 0.02, H - 0.05, h[1] - 0.02, h[0] + 0.02, H, h[1] + 0.02);
      }
    });

    // ---------- the grandparents' sofa, half stripped ----------
    prop(s, 'chairs.sofa', -12.25, 0, 56.4, Math.PI / 2, { state: 'webbed', wood: '#4a2e1c' });
    s.detail(() => { drawTag(g, -11.9, 0.64, 57.25, { eye: '#a0452e' }); g.mat('weave', '#5b6e4a'); g.sheet([-12.55, 0.66, 55.55], [-12.55, 0.66, 56.2], [-12.0, 0.33, 56.3], [-12.0, 0.33, 55.6], { nu: 4, nv: 3, ripple: 0.02 }); });

    // ---------- the old chair under its sheet, in the far corner ----------
    s.furniture(() => { g.mat('wood', '#3a2418'); g.lathe(-11.85, 59.65, [[0.62, 0], [0.62, 0.1], [0.6, 0.12], [0, 0.12]], { segs: 22 }); g.mat('felt', '#5b2a22'); g.cyl(-11.85, 0.12, 59.65, 0.58, 0.006, { segs: 22 }); });
    s.solid(-12.47, 0, 59.03, -11.23, 0.12, 60.27, { surf: 'wood' });
    prop(s, 'chairs.sheeted', -11.85, 0.126, 59.65, Math.PI / 2 + 0.6, {});
    lamp(s, 'spot', -11.5, H, 59.4, { clip, K: 2700, power: 0.75, cone: [30, 12] });
    sign(s, { kind: 'plate', text: 'Not for sale', lines: ['ask, and he will lift the sheet'] }, -12.8, 1.3, 59.65, { face: 'X', w: 0.36, h: 0.16 });

    // ---------- the row of finished chairs on the south wall, and the board of their families ----------
    ROW.forEach((c, i) => {
      const x = -10.5 + i * 0.98;
      prop(s, 'craft.chair', x, 0, Z1 - 0.52, Math.PI + (i % 2 ? 0.08 : -0.06), c);
      s.detail(() => drawTag(g, x + 0.12, c.style === 'arm' ? 0.9 : 0.95, Z1 - 0.8, { eye: '#a0452e' }));
    });
    sign(s, { kind: 'board', title: 'Remade, with their families', palette: ['#22362b', '#f3e6c8', '#d6a640'], lines: ['Ladderback, rush seat|140 yrs · 4 families · 124', 'Bow-back, ash|96 yrs · 3 families · 108', 'Armchair, rust weave|71 yrs · 2 families · 101', 'Slat-back, kitchen|58 yrs · 2 families · 96', 'Ladderback, gold seat|33 yrs · 1 family · 90', 'Bow-back, dark|120 yrs · 5 families · 117'] }, -8.05, 1.95, Z1 - 0.17, { face: 'z', w: 2.6, h: 1.0 });
    lamp(s, 'spot', -8.0, H, 59.6, { clip, K: 3000, power: 0.6, cone: [56, 26] });
    for (const x of [-9.75, -6.35]) lamp(s, 'sconce', x, 2.25, Z1 - 0.16, { face: 'z', clip, K: 2800, power: 0.5 });

    // ---------- chairs waiting their turn, a crate of legs, a seat being re-covered, chair backs on pegs ----------
    prop(s, 'craft.chair', -6.75, 0, 54.0, 0.6, { style: 'spindle', state: 'bare', wood: '#8a5a34' }, { noSpots: true });
    s.detail(() => { g.push(); g.move(-6.75, 0.455 + 0.47, 54.0); g.rotZ(Math.PI); g.rotY(-0.3); drawChair(g, { style: 'ladder', state: 'bare', wood: '#6b4428' }); g.pop(); });
    prop(s, 'craft.chair', -7.55, 0, 54.5, -0.4, { style: 'slat', state: 'webbed', wood: '#5a3a22' }, { noSpots: true });
    prop(s, 'craft.chair', -6.3, 0, 55.05, 2.4, { style: 'ladder', state: 'bare', wood: '#9a6a3a' }, { noSpots: true });
    prop(s, 'crate', -5.9, 0, 56.4, 0.3, { w: 0.6, h: 0.36, d: 0.42, wood: '#8a6a44' });
    s.detail(() => {
      for (let i = 0; i < 14; i++) { g.mat('wood', mixHex('#6b4428', '#d0a870', r.next())); const a = r.f(-0.5, 0.5), x = -5.9 + r.f(-0.18, 0.18), z = 56.4 + r.f(-0.12, 0.12); g.tube([[x, 0.12, z], [x + Math.sin(a) * 0.2, 0.62 + r.f(0, 0.12), z + Math.cos(a) * 0.08]], 0.017, { segs: 5 }); }
    });
    prop(s, 'table', -10.75, 0, 54.55, 0.08, { w: 1.2, d: 0.7, wood: '#5a3a22', top: '#9a7448' });
    s.detail(() => {
      g.push(); g.move(-10.75, 0.74, 54.55); g.rotY(0.08);
      g.mat('wood', '#7a5233'); g.box(-0.22, 0, -0.2, 0.22, 0.04, 0.2, { bevel: 0.008 });
      g.mat('weave', '#a0452e'); g.sheet([-0.32, 0.045, -0.3], [0.32, 0.045, -0.3], [0.32, 0.045, 0.3], [-0.32, 0.045, 0.3], { nu: 4, nv: 4, sag: -0.02, sagEdge: 'all' });
      g.mat('cast', '#3c4148'); g.box(0.36, 0.0, -0.05, 0.38, 0.03, 0.1); g.mat('wood', '#9a6a3a'); g.tube([[0.37, 0.015, 0.1], [0.37, 0.015, 0.3]], 0.012, { segs: 5 });
      g.mat('cast', '#8c8a84'); g.cyl(-0.42, 0.0, 0.18, 0.035, 0.03, { segs: 8 });
      g.pop();
    });
    s.spot('work', -10.75, 0, 55.2, Math.PI, { tags: ['upholster'] });
    s.deco(() => {
      g.mat('wood', '#c9a06a'); for (const z of [57.9, 58.5]) g.tube([[-12.84, 1.95, z], [-12.7, 1.97, z]], 0.012, { segs: 5 });
      for (const z of [57.9, 58.5]) { g.push(); g.move(-12.74, 1.47, z); g.rotY(Math.PI / 2); g.mat('wood', mixHex('#8a5a34', '#c9a06a', z - 57.8));
        const bow = []; for (let i = 0; i <= 10; i++) { const a = Math.PI * i / 10; bow.push([-Math.cos(a) * 0.2, Math.sin(a) * 0.52, 0]); } g.tube(bow, 0.015, { segs: 5 });
        for (let i = 1; i < 6; i++) { const a = Math.PI * i / 6; g.tube([[-Math.cos(a) * 0.17, 0.02, 0], [-Math.cos(a) * 0.2, Math.sin(a) * 0.52, 0]], 0.007, { segs: 4 }); }
        g.pop(); }
    });
    for (const x of [-10.0, -7.5, -5.5]) s.spot('browse', x, 0, 59.4, 0, { tags: ['chairs'] });

    // ---------- Gustav's counter by the window ----------
    prop(s, 'counter', -5.4, 0, 53.2, Math.PI / 2, { w: 1.4, d: 0.6, body: '#2f4a3a', top: '#9a7448' }, { noSpots: true });
    sign(s, SIGNS['chairs.notice'], -4.5, 1.55, Z0 + 0.17, { face: 'Z', w: 0.3, h: 0.42 });
    s.detail(() => {
      g.mat('leather', '#5b2a22'); g.box(-5.6, 0.92, 52.7, -5.25, 0.955, 53.05, { bevel: 0.006 }); g.mat('paper', '#efe4c8'); g.box(-5.58, 0.955, 52.71, -5.27, 0.96, 53.04);
      g.mat('wood', '#c9a06a'); for (let i = 0; i < 4; i++) g.lathe(-5.4 + (i - 1.5) * 0.06, 53.65, [[0.02, 0.92], [0.026, 0.95], [0.018, 0.99], [0.0, 1.0]], { segs: 8 });
    });
    prop(s, 'plant', -5.45, 0.92, 53.25, 0, { kind: 'fine', size: 0.55, pot: '#a0452e' });
    prop(s, 'stool', -6.1, 0, 53.6, 0, { wood: '#5a3a22', h: 0.62 }, { noSpots: true });
    s.spot('counter', -6.15, 0, 53.2, Math.PI / 2, { who: 'gustav', tags: ['carve'] });
    s.spot('customer', -4.55, 0, 53.2, -Math.PI / 2, {});
    lamp(s, 'globe', -5.4, 2.3, 53.2, { clip, K: 2800, power: 0.55, drop: 0.85, r: 0.12 });

    // ---------- people's ways ----------
    s.path([[X1, 51.2], [-4.5, 51.6], [-4.55, 53.2]], { width: 1.1 });
    s.path([[-4.5, 51.6], [-7.2, 52.4], [-10.3, 52.3], [-11.4, 53.5]], { width: 1.0 });
    s.path([[-7.2, 52.4], [-8.0, 53.6], [-9.9, 56.6], [-8.0, 59.2], [-10.6, 58.6]], { width: 1.0 });
    s.path([[-4.55, 53.2], [-5.1, 57.4], [-6.0, 59.3]], { width: 0.9 });

    // ---------- things to do ----------
    s.interact({ x: -5.9, y: 1.4, z: 53.2, radius: 1.5, kind: 'talk', prompt: 'Talk to Gustav', async onUse(game) {
      await talk(game, 'gustav', ['A wanderer. Where are they keeping you, the Margin flats? Have you eaten?', 'Good. Sit in something while you are here. That is what they are for.']);
      if (!game.ui) return;
      game.busy++; let c = null;
      try { c = await game.ui.choose('Gustav', 'What will it be?', [{ label: 'Ask about his prices', value: 'menu' }, { label: 'Ask which chair here is oldest', value: 'old' }, { label: 'Ask what couples come in for', value: 'sofa' }, { label: 'Just looking', value: null }]); } finally { game.busy--; }
      if (c === 'old') {
        await talk(game, 'gustav', ['The one under the sheet. Two hundred and ten years, eleven families. It is in for a new seat and it is going back.', 'A new chair is five kilograms of new mass. A hundred and twenty-five kays. Fifty dinners.', 'So most of what you sit on was made before you were born, and the best chair in a room is the oldest one.']);
        found(game, 'oldest-chair');
      } else if (c === 'sofa') {
        await talk(game, 'gustav', ['A sofa. They come in with plans for a new one, forty kilograms, a thousand kays. Forty-six days of a wallet.', 'Then I show them the remake: four kilograms of webbing and filling and cover, and forty hours of me. They go home with their grandparents\' sofa and a plan.']);
        found(game, 'sofa-sums');
      } else if (c === 'menu') {
        await shopMenu(game, 'chairs', { kicker: 'Gustav remakes', onBuy: async (it) => {
          if (it.id === 'new-chair') await talk(game, 'gustav', ['If you insist. I will build it well, and in a hundred years someone will bring it here.']);
          else await talk(game, 'gustav', ['Bring it in when you like. Put your name on the underside in pencil; everyone does.']);
        } });
      }
    } });
    s.interact({ x: -11.8, y: 0.9, z: 59.65, radius: 1.4, prompt: 'Lift the sheet on the old chair', async onUse(game) {
      if (game.audio) game.audio.play('brush', { vol: 0.5 });
      await readCard(game, 'Under the sheet', ['A carved armchair, the arms worn pale where two hundred and ten years of hands have rested.', 'Pencilled on the underside, eleven names in eleven hands, the oldest nearly gone. The newest says Lomu, and a date, and new seat.']);
      found(game, 'oldest-chair');
    } });
    s.interact({ x: -8.05, y: 1.5, z: 60.3, radius: 1.8, prompt: 'Read the board of remade chairs', async onUse(game) {
      await readCard(game, 'Remade, with their families', ['Six chairs, each with its age and how many families have sat in it. The prices climb with the years.', 'The oldest is the dearest. The young one is the bargain, and nobody wants it.']);
    } });
    s.interact({ x: -12.0, y: 0.7, z: 57.2, radius: 1.3, prompt: 'Read the tag on the sofa', async onUse(game) {
      await readCard(game, 'A tag on the sofa', ['For Hollis and Bea, after Booking Day. Her grandmother\'s sofa. Strip, re-web, re-spring, new cover in Chervil green.', 'Forty hours. Four kilograms of new. In pencil underneath: they wanted a new one, a thousand kays. Talked out of it.']);
      found(game, 'sofa-sums');
    } });
    s.interact({ x: -11.3, y: 1.2, z: 50.7, radius: 1.4, prompt: 'Look at the chair in the clamps', async onUse(game) {
      await readCard(game, 'In the clamps', ['A ladderback stripped to the wood, every joint glued and clamped and left overnight.', 'A label tied to the leg: back rail loose since the Okonjos\' wedding. Their fault, they say.']);
    } });
    seat(s, -8.54, 0.46, Z1 - 0.55, 0, 'Sit in the rust armchair');

    s.zoneBox({ id: 'chairs', place: 'chairs', box: [X0, -0.5, Z0, X1, H, Z1], name: P.name, sub: 'Thread Street', ambience: 'shop', reverb: 'room', env: { exposure: 1.0, warmth: 0.38 } });
    s.finish();
    game.spawns.chairs = { frame: f, x: -0.9, y: 0, z: 55.5, yaw: -Math.PI / 2 };
    game.spawns['chairs-in'] = { frame: f, x: -4.4, y: 0, z: 51.3, yaw: -Math.PI / 2 - 0.5 };
  },
};
