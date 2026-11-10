// The Long Pipe: Matti Erdem's flute maker's on Thread Street (east side, x[3, 13] z[31.5, 40], front at x = 3).
// What it is about: in heliox a flute is 1.2 metres long, and every one is tuned in the shop's own air. The eye goes to the back
// wall, where the flutes stand in a rack like an organ's pipes, longest in the middle, brass catching a warm strip of light.
// Palette: deep indigo walls over honey ribbed panelling, brass, rust and mustard felt. Felt hangs everywhere: the room is dry.
import { lamp, block } from '../world/kit.js';
import { shopfront } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { deckRadius } from '../core/drum.js';
import { SIGNS } from '../content/signs.js';
import { PLACES } from '../content/places.js';
import { Rng, hashStr, mixHex } from '../core/util.js';
import { shell, streetSign, talk, readCard, found, shopMenu, drawFlute } from './craft_parts.js';

const X0 = 3, X1 = 13, Z0 = 31.5, Z1 = 40, H = 3.2;
const WOODS = ['#6b3f22', '#8a5a34', '#4a2e1c', '#a0704a', '#5a3a22', '#7a4a2a'];

// a few rising notes on the flute, if there is sound
function notes(game, n, x, y, z, base) {
  if (!game.audio) return;
  const f = game.world.frame('candlewick', deckRadius(16), 0, 625);
  const steps = [0, 2, 4, 5, 7, 9, 11, 12];
  for (let i = 0; i < n; i++) game.audio.play('flute-note', { pos: game.toListener(f, x, y, z), pitch: (base || 1) * Math.pow(2, steps[i % steps.length] / 12), delay: i * 0.42, vol: 0.7 });
}

export const place = {
  id: 'flutes', name: 'The Long Pipe', order: 55,
  build(game) {
    const f = game.world.frame('candlewick', deckRadius(16), 0, 625);
    const s = game.world.scope('flutes', f), g = s.g;
    const P = PLACES.flutes, r = new Rng(hashStr('flutes'));

    // ---------- shell ----------
    const clip = shell(s, { x0: X0, x1: X1, z0: Z0, z1: Z1, front: 'w', h: H, floor: ['planks', '#6e4a2e'], ceil: ['paint', '#d9d0c0'],
      wall: '#2c3a5c', dado: { h: 1.1, mat: 'flute', tint: '#a8743e' }, skirt: '#2a1c12', beam: '#3a2a1e', rail: '#c9a050', pipes: ['#c9a050', '#9a3a2a'], cornice: '#22304c',
      glow: { sky: '#ffd8a8', ground: '#7a5634', power: 0.13 } });
    const pal = { frame: '#26324e', plinth: '#1c2640', awning: ['#26324e', '#c9a050'] };
    shopfront(s, { side: 'w', a0: Z0 + 0.05, a1: Z1 - 0.05, c: X0, y: 0, h: H, fascia: Object.assign({}, SIGNS['flutes.fascia'], { palette: ['#26324e', '#f3e6c8', '#c9a050'], emblem: 'flute' }),
      palette: pal, door: { at: 0.45, w: 1.1, tint: '#26324e', label: P.name }, awning: { depth: 1.0, stripes: pal.awning }, plinth: 0.4 });
    streetSign(s, Object.assign({}, SIGNS['flutes.hanging'], { palette: ['#f0e2c0', '#26324e', '#c9a050'], emblem: 'flute' }), X0, Z1 - 0.75, -1);
    prop(s, 'rug', 3.9, 0, 32.55, Math.PI / 2, { w: 1.0, d: 0.7, a: '#26324e', b: '#c9a050', mat: 'rush' });
    prop(s, 'rug', 8.0, 0, 35.2, 0.02, { w: 3.6, d: 2.4, a: '#9a3a2a', b: '#c9952e', mat: 'felt' });
    // felt baffles hung under the beams, because in heliox a bare room rings
    s.deco(() => {
      const fc = ['#9a3a2a', '#c9952e', '#3a4a6a'];
      [[5.3, 34.4], [10.3, 35.6], [8.6, 38.4]].forEach((p, i) => {
        const w = 1.4, d = 0.9, y = 2.9 - (i % 2) * 0.05;
        g.mat('cast', '#2a2622'); for (const dx of [-w / 2 + 0.1, w / 2 - 0.1]) for (const dz of [-d / 2 + 0.1, d / 2 - 0.1]) g.tube([[p[0] + dx, y + 0.04, p[1] + dz], [p[0] + dx, H, p[1] + dz]], 0.004, { segs: 3 });
        g.mat('felt', fc[i]); g.box(p[0] - w / 2, y, p[1] - d / 2, p[0] + w / 2, y + 0.045, p[1] + d / 2, { bevel: 0.015 });
      });
    });

    // ---------- the window: three flutes on stands, a music stand, the lessons card ----------
    block(s, X0 + 0.12, 0, 34.1, 4.3, 0.45, Z1 - 0.2, 'wood', '#1c2640', { bevel: 0.015 });
    s.detail(() => { g.mat('felt', '#9a3a2a'); g.box(X0 + 0.16, 0.45, 34.14, 4.26, 0.462, Z1 - 0.24, { faces: 'Y' }); });
    const fstand = (x, y, z, len, wood, lean, body) => {
      g.mat('cast', '#2a2622'); for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + 0.4; g.tube([[x + Math.cos(a) * 0.14, y, z + Math.sin(a) * 0.14], [x, y + 0.2, z]], 0.006, { segs: 4 }); }
      g.tube([[x, y + 0.2, z], [x, y + 0.34, z]], 0.008, { segs: 4 });
      g.push(); g.move(x, y + 0.08, z); g.rotX(lean || 0); g.rotY(-Math.PI / 2); drawFlute(g, len, { wood, body, r: 0.02 }); g.pop();
    };
    s.detail(() => { fstand(3.75, 0.462, 35.1, 1.18, '#6b3f22', 0.04, '#d8d4cc'); fstand(3.7, 0.462, 36.3, 1.26, '#4a2e1c', -0.03, '#c9a050'); fstand(3.75, 0.462, 37.5, 1.1, '#a0704a', 0.02); });
    prop(s, 'craft.stand', 3.7, 0.46, 38.7, -Math.PI / 2 - 0.3, {});
    sign(s, SIGNS['flutes.notice'], 3.42, 0.9, 39.4, { face: 'x', w: 0.3, h: 0.42 });
    s.detail(() => { g.mat('wood', '#1c2640'); for (const dz of [-0.12, 0.12]) g.tube([[3.47, 0.46, 39.4 + dz], [3.44, 1.12, 39.4 + dz * 0.6]], 0.008, { segs: 4 }); g.tube([[3.62, 0.46, 39.4], [3.45, 1.06, 39.4]], 0.008, { segs: 4 }); });
    lamp(s, 'spot', 3.55, H, 35.6, { clip, K: 3000, power: 0.6, cone: [44, 18] });
    lamp(s, 'spot', 3.55, H, 38.3, { clip, K: 3000, power: 0.5, cone: [44, 18] });

    // ---------- the measuring board, just inside the door ----------
    s.deco(() => {
      const cx = 5.75, z = Z0 + 0.16;
      g.mat('wood', '#d0a870', { rough: -0.05 }); g.box(cx - 1.1, 0.3, z, cx + 1.1, 2.3, z + 0.03, { bevel: 0.01 });
      g.mat('wood', '#5a3a22'); g.box(cx - 1.14, 0.26, z, cx + 1.14, 0.3, z + 0.05); g.box(cx - 1.14, 2.3, z, cx + 1.14, 2.34, z + 0.05);
      // a painted figure with arms out, and the scale along the arms
      g.mat('paint', '#26324e'); g.box(cx - 0.11, 0.32, z + 0.03, cx + 0.11, 1.32, z + 0.032); g.cyl(cx, 1.5, z + 0.03, 0.1, 0.002, { segs: 14 });
      g.box(cx - 0.85, 1.36, z + 0.03, cx + 0.85, 1.42, z + 0.032);
      g.push(); g.move(cx, 1.66, z + 0.03); g.rotX(Math.PI / 2); g.cyl(0, 0, 0, 0.1, 0.003, { segs: 14 }); g.pop();
      g.mat('paint', '#2a2622');
      for (let i = -10; i <= 10; i++) { const x = cx + i * 0.1, L = i % 5 === 0 ? 0.12 : 0.05; g.box(x - 0.003, 1.48, z + 0.03, x + 0.003, 1.48 + L, z + 0.034); }
      g.box(cx - 1.0, 1.475, z + 0.03, cx + 1.0, 1.481, z + 0.034);
      // the chart of flute lengths: one brass bar for each span
      for (let i = 0; i < 5; i++) { const L = 0.9 + i * 0.1, y = 0.45 + i * 0.13; g.mat('cast', '#c9a050', { rough: -0.25 }); g.box(cx - L / 2, y, z + 0.03, cx + L / 2, y + 0.05, z + 0.045, { bevel: 0.004 }); g.mat('paint', '#9a3a2a'); g.box(cx - L / 2 - 0.12, y, z + 0.03, cx - L / 2 - 0.04, y + 0.05, z + 0.034); }
    });
    sign(s, { kind: 'label', text: 'Arm span, fingertip to fingertip', ink: '#26324e' }, 5.75, 2.13, Z0 + 0.2, { face: 'Z', w: 1.5, h: 0.14 });
    sign(s, { kind: 'label', text: 'Your flute', ink: '#9a3a2a' }, 5.75, 1.18, Z0 + 0.2, { face: 'Z', w: 0.6, h: 0.1 });
    lamp(s, 'sconce', 7.05, 2.05, Z0 + 0.16, { face: 'Z', clip, K: 2900, power: 0.55 });
    s.spot('stand', 5.75, 0, 32.3, Math.PI, { tags: ['measured'] });

    // ---------- the lathe and the bench along the north wall ----------
    prop(s, 'craft.lathe', 8.75, 0, Z0 + 0.62, 0, { len: 1.8, piece: '#8a5a34' }, { spot: { tags: ['carve', 'turn'], who: 'matti' } });
    lamp(s, 'globe', 8.75, 2.05, 32.5, { clip, K: 4000, power: 0.8, drop: 1.1, r: 0.13 });
    prop(s, 'craft.bench', 11.3, 0, Z0 + 0.5, 0, { w: 2.3, d: 0.66, wood: '#8a6a44' }, { spot: { tags: ['tune', 'carve'] } });
    s.detail(() => {
      // half-made bores, a tray of keys, pads in a tin, a coil of cork
      for (let i = 0; i < 5; i++) { g.push(); g.move(10.35 + i * 0.04, 0.88, Z0 + 0.3 + i * 0.075); g.rotZ(-Math.PI / 2); g.mat('wood', WOODS[i]); g.cyl(0, 0, 0, 0.018, 1.0 + i * 0.12, { segs: 8 }); g.pop(); }
      g.mat('wood', '#5a3a22'); g.box(11.85, 0.86, Z0 + 0.25, 12.3, 0.9, Z0 + 0.55); g.mat('felt', '#26324e'); g.box(11.87, 0.9, Z0 + 0.27, 12.28, 0.902, Z0 + 0.53);
      g.mat('cast', '#c9a050', { rough: -0.25 }); for (let i = 0; i < 18; i++) g.box(11.9 + (i % 6) * 0.065, 0.902, Z0 + 0.3 + Math.floor(i / 6) * 0.07, 11.93 + (i % 6) * 0.065, 0.91, Z0 + 0.34 + Math.floor(i / 6) * 0.07, { bevel: 0.003 });
      g.mat('cast', '#8c8a84'); g.cyl(11.6, 0.86, Z0 + 0.75, 0.05, 0.03, { segs: 12 }); g.mat('felt', '#e9e1cf'); for (let i = 0; i < 6; i++) g.cyl(11.6 + Math.cos(i) * 0.025, 0.89, Z0 + 0.75 + Math.sin(i) * 0.025, 0.012, 0.004, { segs: 6 });
      // a tuning fork on its block, and a page of numbers
      g.mat('wood', '#3a2418'); g.box(11.0, 0.86, Z0 + 0.7, 11.12, 0.92, Z0 + 0.8, { bevel: 0.006 }); g.mat('cast', '#c9c4bb', { rough: -0.3 }); g.tube([[11.04, 0.92, Z0 + 0.75], [11.04, 1.08, Z0 + 0.75]], 0.004, { segs: 4 }); g.tube([[11.08, 0.92, Z0 + 0.75], [11.08, 1.08, Z0 + 0.75]], 0.004, { segs: 4 });
      g.mat('paper', '#efe6d2'); g.box(10.6, 0.86, Z0 + 0.62, 10.84, 0.862, Z0 + 0.85);
    });
    lamp(s, 'sconce', 11.3, 1.95, Z0 + 0.16, { face: 'Z', clip, K: 3600, power: 0.6 });
    sign(s, { kind: 'poster', title: 'Long pipes in the court', lines: ['Thursdays after the hall', 'Bring a flute or borrow one', 'Long notes only'], palette: ['#26324e', '#f2c879', '#c9a050'], motif: 'flute' }, 8.75, 1.95, Z0 + 0.17, { face: 'Z', w: 0.5, h: 0.72 });

    // ---------- the rack of flutes on the back wall, like an organ ----------
    prop(s, 'craft.drawers', X1 - 0.38, 0, 34.5, -Math.PI / 2, { w: 3.9, h: 0.86, d: 0.42, cols: 12, rows: 5, wood: '#4a2e1c', top: '#a8743e' });
    s.furniture(() => {
      const bx = X1 - 0.16, z0 = 32.65, z1 = 36.35;
      g.mat('wood', '#a8743e'); g.box(bx - 0.05, 0.89, z0 - 0.16, bx, 2.8, z1 + 0.16, { bevel: 0.008 });
      g.mat('felt', '#1f2a46'); g.box(bx - 0.06, 0.95, z0 - 0.1, bx - 0.05, 2.74, z1 + 0.1);
      g.mat('wood', '#a8743e'); g.box(bx - 0.28, 0.89, z0 - 0.1, bx - 0.04, 0.95, z1 + 0.1, { bevel: 0.01 });
      g.mat('cast', '#c9a050', { rough: -0.25 }); g.box(bx - 0.2, 1.62, z0 - 0.1, bx - 0.04, 1.65, z1 + 0.1);
      g.mat('wood', '#a8743e'); g.prism([[bx - 0.06, z0 - 0.12], [bx, z0 - 0.12], [bx, z1 + 0.12], [bx - 0.06, z1 + 0.12]], 2.75, 2.8);
    });
    s.detail(() => {
      const n = 25, z0 = 32.75, z1 = 36.25;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1), d = Math.abs(t - 0.5) * 2, len = 1.55 - d * 0.7 + (i % 2) * 0.04, z = z0 + (z1 - z0) * t;
        g.push(); g.move(X1 - 0.16 - 0.12 - (i % 2) * 0.05, 0.95, z); g.rotY(-Math.PI / 2); drawFlute(g, len, { r: 0.02, wood: WOODS[i % WOODS.length], body: i % 3 === 1 ? '#d8d4cc' : i % 5 === 0 ? '#c9a050' : null, head: i % 3 ? '#cfcac0' : '#c9a050', keys: 6 + (i % 3) }); g.pop();
      }
    });
    lamp(s, 'strip', 12.15, 2.98, 32.9, { to: [12.15, 2.98, 36.1], clip, K: 3100, power: 1.0 });
    for (const z of [33.4, 35.6]) lamp(s, 'spot', 10.9, H, z, { clip, K: 3000, power: 0.75, dir: [0.62, -0.78, 0], cone: [40, 18] });
    s.spot('browse', 11.6, 0, 33.6, Math.PI / 2, { tags: ['flutes'] }); s.spot('browse', 11.6, 0, 35.4, Math.PI / 2, { tags: ['flutes'] });

    // ---------- the assembly table in the middle ----------
    prop(s, 'table', 8.1, 0, 35.0, 0, { w: 1.7, d: 0.8, h: 0.8, wood: '#4a2e1c', top: '#a8743e' });
    s.detail(() => {
      g.mat('felt', '#26324e'); g.box(7.5, 0.8, 34.75, 8.8, 0.803, 35.3);
      for (let i = 0; i < 3; i++) { g.push(); g.move(7.55, 0.82 + 0.0, 34.85 + i * 0.16); g.rotZ(-Math.PI / 2); drawFlute(g, 0.4 + i * 0.25, { wood: WOODS[i + 1], keys: 3 }); g.pop(); }
      g.mat('glaze', '#e9e4d8'); g.cyl(8.65, 0.8, 34.75, 0.05, 0.08, { segs: 10 }); g.mat('felt', '#e9e1cf'); g.cyl(8.65, 0.86, 34.75, 0.045, 0.02, { segs: 10 });
      g.mat('cast', '#3c4148'); g.box(7.3, 0.8, 35.25, 7.5, 0.81, 35.29); g.mat('wood', '#9a6a3a'); g.tube([[7.3, 0.805, 35.27], [7.18, 0.805, 35.27]], 0.008, { segs: 4 });
    });
    prop(s, 'stool', 8.1, 0, 35.7, 0, { wood: '#5a3a22', h: 0.62 });
    // flute cases waiting to go out, and a plant under the window light
    s.furniture(() => {
      const cc = ['#26324e', '#5b2a22', '#3a2418', '#9a3a2a'];
      for (let i = 0; i < 4; i++) { g.mat('leather', cc[i]); const y = i * 0.075; g.push(); g.move(5.75, y, 39.52); g.rotY(Math.PI / 2 + 0.05 * (i % 2 ? 1 : -1)); g.box(-0.12, 0, -0.68, 0.12, 0.07, 0.68, { bevel: 0.02 }); g.mat('cast', '#c9a050'); g.box(0.12, 0.025, -0.2, 0.125, 0.045, -0.15); g.box(0.12, 0.025, 0.15, 0.125, 0.045, 0.2); g.pop(); }
    });
    s.solid(5.05, 0, 39.38, 6.45, 0.3, 39.68);
    prop(s, 'plant', 4.6, 0, 39.4, 0, { kind: 'fern', size: 1.2, pot: '#c9a050' });
    lamp(s, 'spot', 4.1, H, 32.6, { clip, K: 2900, power: 0.4, cone: [60, 26] });
    s.spot('work', 8.1, 0, 35.65, Math.PI, { tags: ['tune', 'assemble'] });
    lamp(s, 'globe', 8.1, 2.05, 35.0, { clip, K: 3200, power: 0.7, drop: 1.1, r: 0.13 });

    // ---------- the counter by the window, and remade flutes on pegs on the south wall ----------
    prop(s, 'counter', 6.2, 0, 37.8, -Math.PI / 2, { w: 1.8, d: 0.6, body: '#26324e', top: '#a8743e' }, { noSpots: true });
    s.detail(() => {
      g.mat('felt', '#9a3a2a'); g.box(5.95, 0.92, 37.05, 6.45, 0.923, 38.55);
      g.push(); g.move(6.2, 0.945, 37.15); g.rotX(Math.PI / 2); g.rotY(Math.PI); drawFlute(g, 1.22, { wood: '#6b3f22' }); g.pop();
      g.mat('leather', '#5b2a22'); g.box(6.0, 0.92, 38.25, 6.38, 0.95, 38.6, { bevel: 0.006 });
      g.mat('wood', '#c9a06a'); g.box(6.05, 0.92, 36.95, 6.35, 0.96, 37.05, { bevel: 0.006 });
    });
    s.spot('counter', 6.95, 0, 37.8, -Math.PI / 2, { who: 'matti', tags: ['tune'] });
    s.spot('customer', 5.3, 0, 37.8, Math.PI / 2, {});
    lamp(s, 'globe', 6.2, 2.3, 37.8, { clip, K: 2800, power: 0.55, drop: 0.85, r: 0.12 });
    s.deco(() => {
      g.mat('wood', '#c9a06a');
      for (let row = 0; row < 4; row++) for (const x of [4.85, 5.55, 7.25, 7.95]) { g.mat('wood', '#c9a06a'); g.tube([[x, 1.25 + row * 0.3, Z1 - 0.16], [x, 1.27 + row * 0.3, Z1 - 0.27]], 0.01, { segs: 4 }); }
      for (const x0 of [4.6, 7.0]) for (let row = 0; row < 4; row++) { const k = 1 + ((row + (x0 > 5 ? 1 : 0)) % 2); for (let j = 0; j < k; j++) { g.push(); g.move(x0 + j * 0.05, 1.287 + row * 0.3 + j * 0.034, Z1 - 0.215 - j * 0.03); g.rotZ(-Math.PI / 2); drawFlute(g, 1.1 + ((row + j) % 3) * 0.08, { wood: WOODS[(row * 2 + j + (x0 > 5 ? 3 : 0)) % 6], keys: 7 }); g.pop(); }
        g.mat('paper', '#efe4c8'); g.box(x0 + 1.32, 1.18 + row * 0.3, Z1 - 0.2, x0 + 1.4, 1.24 + row * 0.3, Z1 - 0.195); }
    });
    sign(s, { kind: 'label', text: 'Remade, from 12', ink: '#f3e6c8' }, 6.6, 2.55, Z1 - 0.17, { face: 'z', w: 1.0, h: 0.14 });
    s.spot('browse', 6.0, 0, 39.1, 0, { tags: ['flutes'] }); s.spot('browse', 7.6, 0, 39.1, 0, { tags: ['flutes'] });

    // ---------- the tuning corner: felt on the walls and overhead, a stool, a stand, a bench at the back ----------
    s.structure(() => {
      const fc = ['#9a3a2a', '#c9952e', '#7a2e22', '#b8862a'];
      for (let i = 0; i < 6; i++) { g.mat('felt', fc[i % 4]); const x = 9.5 + i * 0.55; g.box(x, 0.12, Z1 - 0.2, x + 0.53, 2.75, Z1 - 0.16, { bevel: 0.01 }); }
      for (let i = 0; i < 5; i++) { g.mat('felt', fc[(i + 1) % 4]); const z = 36.85 + i * 0.6; g.box(X1 - 0.2, 0.12, z, X1 - 0.16, 2.75, z + 0.58, { bevel: 0.01 }); }
      g.mat('felt', '#3a4a6a'); g.sheet([9.4, 2.98, 36.7], [12.8, 2.98, 36.7], [12.8, 2.98, 39.8], [9.4, 2.98, 39.8], { nu: 8, nv: 6, sag: 0.18, sagEdge: 'all' });
      g.mat('cast', '#2a2622'); for (const p of [[9.45, 36.75], [12.75, 36.75], [9.45, 39.75]]) g.tube([[p[0], 2.98, p[1]], [p[0], H, p[1]]], 0.005, { segs: 4 });
    });
    prop(s, 'rug', 11.1, 0, 38.3, 0, { w: 3.2, d: 2.8, a: '#c9952e', b: '#26324e', mat: 'felt' });
    prop(s, 'bench', X1 - 0.5, 0, 38.25, -Math.PI / 2, { w: 2.2, wood: '#5a3a22', back: false });
    prop(s, 'stool', 10.4, 0, 39.2, 0, { wood: '#3a2418' }, { noSpots: true });
    prop(s, 'craft.stand', 10.4, 0, 38.1, Math.PI, {});
    s.detail(() => fstand(9.9, 0, 39.4, 1.2, '#7a4a2a', 0.03));
    s.spot('perform', 10.4, 0.46, 39.2, Math.PI, { tags: ['tune', 'teach'] });
    s.spot('stand', 10.4, 0, 37.55, 0, { tags: ['lesson', 'play'] });
    lamp(s, 'lantern', 11.0, 2.4, 38.2, { clip, tint: '#e8a040', power: 0.8, drop: 0.45 });

    // ---------- people's ways ----------
    s.path([[X0, 32.55], [4.4, 32.6], [5.75, 32.4]], { width: 1.1 });
    s.path([[4.4, 32.6], [5.0, 34.0], [5.3, 37.8]], { width: 1.0 });
    s.path([[5.0, 34.0], [7.0, 33.6], [10.6, 33.6], [11.6, 34.5]], { width: 1.0 });
    s.path([[10.6, 33.6], [9.6, 36.3], [11.0, 37.0], [12.0, 37.6]], { width: 0.9 });
    s.path([[5.3, 37.8], [6.8, 39.1], [9.0, 39.1]], { width: 0.9 });

    // ---------- things to do ----------
    s.interact({ x: 6.8, y: 1.4, z: 37.8, radius: 1.5, kind: 'talk', prompt: 'Talk to Matti', async onUse(game) {
      await talk(game, 'matti', ['Come in, close the door, the street is loud. Where are you staying? Have you eaten?', 'Good. Then you can hold a long note.']);
      if (!game.ui) return;
      game.busy++; let c = null;
      try { c = await game.ui.choose('Matti', 'What will it be?', [{ label: 'Lessons and flutes', value: 'menu' }, { label: 'Ask why the flutes are so long', value: 'long' }, { label: 'Just looking', value: null }]); } finally { game.busy--; }
      if (c === 'long') {
        await talk(game, 'matti', ['The air is quick. Sound goes about one and four-fifths as fast in heliox, so a pipe sings ten semitones sharp for its length.', 'To play the old notes the pipe has to be slow. About one metre twenty. Nearly twice what you see in old pictures.', 'Stand at the board by the door and I will show you yours.']);
        found(game, 'long-flute');
      } else if (c === 'menu') {
        await shopMenu(game, 'flutes', { kicker: 'Matti teaches', onBuy: async (it) => {
          if (it.id === 'lesson') { await talk(game, 'matti', ['Stand on the rug. Lips loose. Blow across, not into.']); notes(game, 6, 10.4, 1.5, 38.1, 0.9); if (game.ui) game.ui.toast('An hour on the rug in the tuning corner. By the end, three clean notes.', { kind: 'gain' }); }
          else if (it.id === 'listen') { await talk(game, 'matti', ['The bench at the back. And do not tap your foot.']); found(game, 'bright-voices'); }
          else if (it.id === 'tuning') { notes(game, 3, 11.0, 1.0, 32.2, 1.1); await talk(game, 'matti', ['There. The joint had crept out on the road, so it played flat. A pipe long enough for this air wants watching.']); }
          else await talk(game, 'matti', ['It will come with a case and a page of first tunes. Mind the length on the stairs.']);
        } });
      }
    } });
    s.interact({ x: 5.75, y: 1.4, z: 32.1, radius: 1.3, prompt: 'Stand at the measuring board', async onUse(game) {
      if (game.player && game.player.place) game.player.place(f, 5.75, 0, 32.25, Math.PI, -0.05);
      await readCard(game, 'The measuring board', ['You stand against the board with your arms out. Fingertip to fingertip you are about one metre seventy.', 'Matti stands a flute beside you. It comes up to your chin: about one metre twenty, the length that sings the old notes in this air.']);
      found(game, 'long-flute');
    } });
    s.interact({ x: 9.9, y: 1.1, z: 39.4, radius: 1.2, prompt: 'Try the flute on the stand', onUse(game) {
      notes(game, 5, 9.9, 1.3, 39.4, 0.8);
      if (game.ui) game.ui.toast('A breathy first note, then four that ring the whole felt corner.', { kind: 'info' });
    } });
    s.interact({ x: X1 - 0.5, y: 0.8, z: 38.25, radius: 1.3, prompt: 'Sit on the bench at the back', async onUse(game) {
      if (game.player && game.player.sit) game.player.sit({ x: X1 - 0.5, y: 0.46, z: 38.25, yaw: -Math.PI / 2 });
      await readCard(game, 'The bench at the back', ['From here a lesson sounds like this: the flute low and round, the voices over it bright and thin, as everyone\'s are in heliox.', 'Nobody here hears it as odd. Recordings from the old air sound to them as if spoken through a blanket.']);
      found(game, 'bright-voices');
    } });
    s.interact({ x: 10.4, y: 1.2, z: 38.1, radius: 1.0, prompt: 'Read the music on the stand', async onUse(game) {
      await readCard(game, 'On the stand', ['A page of first tunes in Matti\'s hand. At the top: Hall Bell. Then: Lids Up. Then one called The Long Way Round, with a note in the margin: breathe at the bar line, not before.']);
    } });
    s.interact({ x: 12.2, y: 1.6, z: 34.5, radius: 1.6, prompt: 'Look at the rack of flutes', async onUse(game) {
      await readCard(game, 'The rack', ['Twenty-five flutes, longest in the middle, each tuned in this room\'s own air and tagged with whoever has it on loan.', 'The drawers under them are full of keys, pads and reeds, sorted by a system only Matti understands.']);
    } });

    s.zoneBox({ id: 'flutes', place: 'flutes', box: [X0, -0.5, Z0, X1, H, Z1], name: P.name, sub: 'Thread Street', ambience: 'shop', reverb: 'felt', env: { exposure: 1.0, warmth: 0.3 } });
    s.finish();
    game.spawns.flutes = { frame: f, x: 0.9, y: 0, z: 35.6, yaw: Math.PI / 2 };
    game.spawns['flutes-in'] = { frame: f, x: 4.2, y: 0, z: 32.6, yaw: Math.PI / 2 };
    void mixHex;
  },
};
