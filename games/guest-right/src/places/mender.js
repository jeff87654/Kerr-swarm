// The Shown Seam: Wim Adebayo's mending shop on Thread Street (west side, x[-13, -3] z[31.5, 40]).
// What it is about: a coat's seams tell its owners' story. The eye goes to the wall of thread at the back, three hundred
// spools in a rainbow under a bright strip; then to the coats on their forms in the window, each mend shown on purpose.
// Palette: deep teal panelling, warm plaster, dark walnut, Chervil green, and gold thread as the accent.
import { lamp, block } from '../world/kit.js';
import { shopfront } from '../world/kit2.js';
import { prop, bunting } from '../world/props.js';
import { sign } from '../world/signs.js';
import { deckRadius } from '../core/drum.js';
import { SIGNS } from '../content/signs.js';
import { PLACES } from '../content/places.js';
import { Rng, hashStr, hsl, shadeHex } from '../core/util.js';
import { shell, streetSign, talk, readCard, found, shopMenu, seat, drawPile, drawShears, drawTag } from './craft_parts.js';

const X0 = -13, X1 = -3, Z0 = 31.5, Z1 = 40, H = 3.2;

// the coats in the window and on the form by the table, and what their cards say
const COATS = {
  hessa: { coat: '#26306b', lining: '#d6a640', trim: '#8a2f3c', tag: '#c8402e',
    mends: [{ kind: 'patch', c: '#c8402e', a: -0.5, y: 1.38, w: 0.08, h: 0.07 }, { kind: 'darn', c: '#6c9a4c', a: 0.62, y: 1.12, w: 0.06, h: 0.07 }, { kind: 'gold', a: 0.15, y: 1.2, h: 0.2 }, { kind: 'patch', c: '#d6a640', a: Math.PI - 0.3, y: 1.25, w: 0.1, h: 0.08 }],
    title: 'The indigo coat',
    text: ["Indigo, cut on this street for a lamp fitter called Hessa Kwan, seventy-one years ago.", "The red patch at the shoulder is her son's, from a fall in the Third. The green darns are her granddaughter's, who wears it now.", 'It is in for a new lining before Booking Day. Nothing on the forms is for sale.'] },
  arno: { coat: '#b5653a', lining: '#2f6f8f', trim: '#2a2622', tag: '#2f6f8f',
    mends: [{ kind: 'patch', c: '#2f6f8f', a: 0.9, y: 1.05, w: 0.07, h: 0.07 }, { kind: 'patch', c: '#2f6f8f', a: -0.9, y: 1.05, w: 0.07, h: 0.07 }, { kind: 'darn', c: '#e9e1cf', a: 0.2, y: 0.98, w: 0.05, h: 0.05 }, { kind: 'darn', c: '#d6a640', a: Math.PI + 0.4, y: 1.3, w: 0.08, h: 0.06 }],
    title: 'The copper coat',
    text: ['Lid copper, spun cellulose. Made for Arno Petit when he was nine.', 'Let out three times, let down twice, then cut down for his sister\'s boy. The blue squares are where two sets of elbows went.', 'Each mend has its year written inside, in pencil, by whoever made it.'] },
  gold: { coat: '#2f4a3a', lining: '#c8402e', trim: '#1d2a22', tag: '#e0b040',
    mends: [{ kind: 'gold', a: -0.25, y: 1.25, h: 0.42 }, { kind: 'gold', a: -0.05, y: 1.0, h: 0.2 }, { kind: 'gold', a: 0.35, y: 1.38, h: 0.12 }, { kind: 'patch', c: '#e0b040', a: 0.7, y: 1.18, w: 0.06, h: 0.05, stitch: '#c8402e' }],
    title: 'The green coat with the gold seam',
    text: ['Torn on a cab-berth door, forty years ago, from the collar to the pocket.', 'Sewn back with gold thread over an hour, so the tear is the best part of the coat.', '"A coat should look as if it has been somewhere." W. A.'] },
};

export const place = {
  id: 'mender', name: 'The Shown Seam', order: 52,
  build(game) {
    const f = game.world.frame('candlewick', deckRadius(16), 0, 625);
    const s = game.world.scope('mender', f), g = s.g;
    const P = PLACES.mender;

    // ---------- shell ----------
    const clip = shell(s, { x0: X0, x1: X1, z0: Z0, z1: Z1, front: 'e', h: H, floor: ['planks', '#9a6e48'], ceil: ['paint', '#eadcc2'],
      wall: '#e6d6b8', dado: { h: 1.0, mat: 'flute', tint: '#2f5a55' }, skirt: '#2a2018', beam: '#4a3526', rail: '#3a2a1e', pipes: ['#c8402e', '#2f5a55'],
      glow: { sky: '#ffdcae', ground: '#a87a52', power: 0.13 } });
    const pal = { frame: '#23413d', plinth: '#1b302d', awning: ['#2f5a55', '#e9dcc4'] };
    shopfront(s, { side: 'e', a0: Z0 + 0.05, a1: Z1 - 0.05, c: X1, y: 0, h: H, fascia: Object.assign({}, SIGNS['mender.fascia'], { palette: ['#23413d', '#f3e6c8', '#e0b040'], emblem: 'thread' }),
      palette: pal, door: { at: 6.35, w: 1.1, tint: '#23413d', label: P.name }, awning: { depth: 1.0, stripes: pal.awning }, plinth: 0.4 });
    streetSign(s, Object.assign({}, SIGNS['mender.hanging'], { palette: ['#f0e2c0', '#23413d', '#c8402e'], emblem: 'thread' }), X1, Z0 + 0.7, 1);
    // a door mat and a rug down the middle
    prop(s, 'rug', -3.9, 0, 38.45, Math.PI / 2, { w: 1.0, d: 0.7, a: '#2f5a55', b: '#e0b040', mat: 'rush' });
    prop(s, 'rug', -8.6, 0, 36.15, 0, { w: 4.6, d: 2.2, a: '#8a2f3c', b: '#d6a640' });

    // ---------- the window: two coats on forms on a low stage ----------
    block(s, -4.4, 0, Z0 + 0.2, X1 - 0.12, 0.45, 37.55, 'wood', '#3a2a1e', { bevel: 0.015 });
    s.detail(() => { g.mat('felt', '#8a2f3c'); g.box(-4.36, 0.45, Z0 + 0.24, X1 - 0.16, 0.462, 37.5, { faces: 'Y' }); });
    prop(s, 'craft.form', -3.72, 0.46, 33.1, Math.PI / 2, { coat: COATS.hessa.coat, lining: COATS.hessa.lining, trim: COATS.hessa.trim, mends: COATS.hessa.mends, tag: COATS.hessa.tag, long: true });
    prop(s, 'craft.form', -3.72, 0.46, 35.7, Math.PI / 2, { coat: COATS.arno.coat, lining: COATS.arno.lining, trim: COATS.arno.trim, mends: COATS.arno.mends, tag: COATS.arno.tag, form: '#c9b48e' });
    bunting(s, [-3.35, 2.6, Z0 + 0.3], [-3.35, 2.6, 37.4], { colors: ['#c8402e', '#e0b040', '#26306b', '#6c9a4c', '#e9e1cf', '#5b4060', '#2f6f8f'], sag: 0.22, drop: 0.16 });
    prop(s, 'craft.basket', -3.85, 0.46, 34.4, 0.4, { cols: ['#26306b', '#d6a640', '#c8402e', '#6c9a4c'] });
    prop(s, 'craft.bolt', -3.95, 0.46, 37.15, 0.25, { c: '#6c9a4c', len: 0.6, mat: 'stripe' });
    sign(s, { kind: 'notice', title: 'Whose coat', lines: ['Every mend here', 'is somebody.', 'Come in and', 'read the cards.'], hand: true }, -3.4, 0.86, 36.45, { face: 'X', w: 0.3, h: 0.42 });
    s.detail(() => { g.mat('wood', '#3a2a1e'); for (const dz of [-0.12, 0.12]) g.tube([[-3.45, 0.46, 36.45 + dz], [-3.42, 1.1, 36.45 + dz * 0.6]], 0.008, { segs: 4 }); g.tube([[-3.6, 0.46, 36.45], [-3.43, 1.05, 36.45]], 0.008, { segs: 4 }); g.box(-3.44, 0.62, 36.25, -3.38, 0.64, 36.65); });

    // ---------- the counter by the window, Wim's post ----------
    prop(s, 'counter', -5.9, 0, 33.6, Math.PI / 2, { w: 2.0, d: 0.6, body: '#2f5a55', top: '#7a5233' }, { noSpots: true });
    prop(s, 'craft.buttons', -5.9, 0.92, 33.05, 0.1, {});
    prop(s, 'plant', -5.92, 0.92, 34.4, 0, { kind: 'fern', size: 0.55, pot: '#c8402e' });
    sign(s, SIGNS['mender.notice'], -5.62, 1.12, 33.8, { face: 'X', w: 0.24, h: 0.32 });
    s.detail(() => {
      g.mat('wood', '#3a2a1e'); g.push(); g.move(-5.66, 0.92, 33.8); g.rotZ(-0.25); g.box(-0.02, 0, -0.13, 0.0, 0.36, 0.13); g.pop();
      // a ledger, a pincushion, a tape measure, a pair of spectacles
      g.mat('leather', '#5b2a22'); g.box(-6.15, 0.92, 33.2, -5.85, 0.95, 33.5, { bevel: 0.006 });
      g.mat('paper', '#efe4c8'); g.box(-6.13, 0.95, 33.21, -5.87, 0.956, 33.49);
      g.mat('weave', '#c8402e'); g.ball(-5.8, 0.95, 34.0, 0.05, 0.035, 0.05, { segs: 10, rings: 6 });
      g.mat('cast', '#c9c4bb'); for (let i = 0; i < 9; i++) { const a = i * 0.7; g.tube([[-5.8 + Math.cos(a) * 0.02, 0.965, 34.0 + Math.sin(a) * 0.02], [-5.8 + Math.cos(a) * 0.035, 1.0, 34.0 + Math.sin(a) * 0.035]], 0.0015, { segs: 3 }); }
      g.mat('weave', '#e0b040'); const tp = []; for (let i = 0; i <= 30; i++) { const a = i / 30 * Math.PI * 6; tp.push([-6.05 + Math.cos(a) * (0.02 + i * 0.0012), 0.925, 34.15 + Math.sin(a) * (0.02 + i * 0.0012)]); } g.tube(tp, 0.004, { segs: 3 });
      g.mat('cast', '#2a2622'); g.tube([[-5.95, 0.93, 32.85], [-5.85, 0.93, 32.85]], 0.012, { segs: 6 }); g.tube([[-5.95, 0.93, 32.95], [-5.85, 0.93, 32.95]], 0.012, { segs: 6 });
    });
    prop(s, 'stool', -6.7, 0, 33.2, 0, { wood: '#5a3d28', h: 0.62 });
    s.spot('counter', -6.65, 0, 33.75, Math.PI / 2, { who: 'wim', tags: ['mend'] });
    s.spot('customer', -5.0, 0, 33.6, -Math.PI / 2, {});
    s.spot('queue', -4.9, 0, 34.7, -Math.PI / 2 - 0.3, {});
    lamp(s, 'globe', -5.9, 2.25, 33.6, { clip, K: 2800, power: 0.6, drop: 0.9, r: 0.13 });

    // ---------- the thread wall at the back ----------
    prop(s, 'craft.drawers', -12.6, 0, 35.75, Math.PI / 2, { w: 5.2, h: 0.86, d: 0.42, cols: 13, rows: 4, wood: '#5a3d28', top: '#7a5233' });
    prop(s, 'craft.spoolwall', -12.8, 0.97, 35.75, Math.PI / 2, { w: 5.4, h: 1.38, cols: 30, rows: 9, board: '#3a2a1e', shelf: '#6b4a2f' });
    sign(s, { kind: 'label', text: 'Thread, by colour', lines: ['take one, put one back'] }, -12.78, 2.68, 35.75, { face: 'X', w: 1.4, h: 0.26 });
    lamp(s, 'strip', -11.75, 2.98, 33.4, { to: [-11.75, 2.98, 38.1], clip, K: 3600, power: 1.1 });
    s.detail(() => {
      // a few spools out on the drawer top, and a cone of gold
      const r = new Rng(hashStr('loose'));
      for (let i = 0; i < 9; i++) { g.mat('knit', hsl(r.next(), 0.6, 0.5)); const z = 33.6 + r.f(0, 4.2), x = -12.5 + r.f(0, 0.25); g.cyl(x, 0.89, z, 0.022, 0.05, { segs: 7 }); g.mat('wood', '#c9a06a'); g.cyl(x, 0.94, z, 0.025, 0.006, { segs: 7 }); }
      g.mat('knit', '#e0b040', { rough: -0.25 }); g.cyl(-12.45, 0.89, 37.9, 0.05, 0.16, { segs: 10, r1: 0.025 });
    });

    // ---------- offcuts by fibre and colour, on the north wall, with a patchwork above ----------
    const fibres = ['Cellulose', 'Linen', 'Hemp', 'Nettle'];
    const r = new Rng(hashStr('offcuts'));
    fibres.forEach((name, k) => {
      const cx = -11.9 + k * 1.42;
      prop(s, 'shelving', cx, 0, Z0 + 0.32, 0, { w: 1.4, h: 2.05, d: 0.32, shelves: 5, wood: '#5a3d28' });
      sign(s, { kind: 'plate', text: name }, cx, 1.99, Z0 + 0.49, { face: 'Z', w: 0.36, h: 0.1 });
      s.detail(() => {
        for (let sh = 0; sh < 5; sh++) {
          const y = 0.08 + sh * (2.05 - 0.11) / 5 + 0.025;
          const hue = (sh / 5 + k * 0.07) % 1;
          for (let q = 0; q < 3; q++) {
            const cols = []; const n = r.i(4, 8);
            for (let i = 0; i < n; i++) cols.push(hsl((hue + r.f(-0.05, 0.05) + 1) % 1, k === 2 ? 0.25 : 0.55 + r.f(-0.15, 0.1), 0.3 + r.f(0, 0.35)));
            drawPile(g, cx - 0.63 + q * 0.43, y, Z0 + 0.46, 0.38, 0.27, cols, r);
          }
        }
      });
    });
    s.deco(() => {
      g.mat('cast', '#2a2622'); g.tube([[-12.7, 3.0, Z0 + 0.22], [-6.9, 3.0, Z0 + 0.22]], 0.016, { segs: 6 });
      for (const x of [-12.6, -9.8, -7.0]) g.box(x - 0.015, 2.98, Z0 + 0.16, x + 0.015, 3.02, Z0 + 0.25);
      const qr = new Rng(hashStr('quilt')), qc = ['#26306b', '#c8402e', '#d6a640', '#6c9a4c', '#e9e1cf', '#5b4060', '#2f6f8f', '#b5653a', '#d4878a'];
      for (let i = 0; i < 23; i++) for (let j = 0; j < 3; j++) {
        const x = -12.65 + i * 0.25, y = 2.96 - (j + 1) * 0.25, sag = 0.012 * Math.sin(i / 22 * Math.PI);
        g.mat(['weave', 'stripe', 'motif', 'knit'][qr.i(0, 3)], qc[qr.i(0, qc.length - 1)]); g.box(x, y - sag, Z0 + 0.2, x + 0.25, y + 0.25 - sag, Z0 + 0.212);
      }
      g.mat('weave', '#e0b040'); for (let j = 0; j <= 3; j++) g.box(-12.65, 2.96 - j * 0.25 - 0.004, Z0 + 0.212, -6.9, 2.96 - j * 0.25 + 0.004, Z0 + 0.216);
      for (let i = 0; i <= 23; i++) g.box(-12.65 + i * 0.25 - 0.004, 2.21, Z0 + 0.212, -12.65 + i * 0.25 + 0.004, 2.96, Z0 + 0.216);
    });
    for (const x of [-11.2, -8.4]) s.spot('browse', x, 0, 32.75, Math.PI, { tags: ['offcuts'] });

    // ---------- the long cutting table ----------
    s.furniture(() => {
      g.mat('wood', '#b08a5a', { rough: -0.08 }); g.box(-10.6, 0.86, 35.6, -6.8, 0.92, 36.7, { bevel: 0.012 });
      g.mat('wood', '#5a3d28');
      for (const x of [-10.45, -6.95]) for (const z of [35.72, 36.58]) g.box(x - 0.045, 0, z - 0.045, x + 0.045, 0.86, z + 0.045, { bevel: 0.008 });
      g.box(-10.5, 0.74, 35.66, -6.9, 0.86, 35.7); g.box(-10.5, 0.74, 36.6, -6.9, 0.86, 36.64);
      g.box(-10.45, 0.2, 35.72, -6.95, 0.23, 36.58, { bevel: 0.005 });
      // a brass rule let into the edge
      g.mat('cast', '#c9a050', { rough: -0.2 }); g.box(-10.5, 0.905, 36.69, -6.9, 0.918, 36.71);
    });
    s.solid(-10.6, 0, 35.6, -6.8, 0.92, 36.7);
    for (let i = 0; i < 5; i++) prop(s, 'craft.bolt', -10.0 + i * 0.75, 0.23, 36.15, Math.PI / 2, { c: ['#26306b', '#c8402e', '#6c9a4c', '#e9e1cf', '#5b4060'][i], len: 0.75, r: 0.08, mat: i % 2 ? 'stripe' : 'weave' });
    s.detail(() => {
      // a coat laid out to be cut, chalk lines, pattern pieces, pins, shears
      g.mat('weave', '#5b4060'); g.box(-9.9, 0.92, 35.75, -8.5, 0.926, 36.55);
      g.mat('weave', '#d6a640'); g.box(-9.6, 0.926, 36.0, -9.2, 0.929, 36.3);
      g.mat('plain', '#f3ede2'); g.box(-9.85, 0.927, 35.9, -8.6, 0.929, 35.91); g.box(-8.65, 0.927, 35.9, -8.64, 0.929, 36.45);
      g.mat('paper', '#d9c9a8'); g.prism([[-8.3, 35.8], [-7.5, 35.8], [-7.4, 36.3], [-8.2, 36.5]], 0.92, 0.923);
      g.mat('paper', '#c9b896'); g.prism([[-8.1, 36.0], [-7.6, 36.05], [-7.65, 36.55], [-8.15, 36.45]], 0.923, 0.926);
      g.mat('plain', '#e9e1cf'); g.box(-7.3, 0.92, 36.3, -7.2, 0.94, 36.33, { bevel: 0.004 });
      g.push(); g.move(-9.0, 0.925, 36.35); g.rotY(0.6); drawShears(g); g.pop();
      g.push(); g.move(-7.2, 0.925, 35.85); g.rotY(-2.2); drawShears(g, { handle: '#c8402e' }); g.pop();
      g.mat('weave', '#e0b040'); g.box(-10.4, 0.921, 35.8, -10.1, 0.924, 35.82);
      const tp = []; for (let i = 0; i <= 24; i++) { const t = i / 24; tp.push([-10.4 + t * 0.6, 0.924, 36.45 + Math.sin(t * 7) * 0.05]); } g.tube(tp, 0.006, { segs: 3 });
      g.mat('knit', '#c8402e'); g.cyl(-7.0, 0.92, 36.5, 0.022, 0.05, { segs: 7 }); g.mat('knit', '#2f6f8f'); g.cyl(-7.06, 0.92, 36.42, 0.022, 0.05, { segs: 7 });
    });
    prop(s, 'stool', -9.0, 0, 37.2, 0, { wood: '#6b4a2f', h: 0.66 });
    s.spot('work', -8.6, 0, 35.15, 0, { tags: ['mend', 'cut'] });
    s.spot('work', -9.8, 0, 37.2, Math.PI, { tags: ['mend'] });
    lamp(s, 'globe', -9.7, 2.2, 36.15, { clip, K: 2700, power: 0.9, drop: 0.95, r: 0.15 });
    lamp(s, 'globe', -7.7, 2.2, 36.15, { clip, K: 2700, power: 0.9, drop: 0.95, r: 0.15 });

    // ---------- the green coat with the gold seam, on its form by the table ----------
    prop(s, 'craft.form', -11.7, 0, 37.9, Math.PI / 2 + 0.5, { coat: COATS.gold.coat, lining: COATS.gold.lining, trim: COATS.gold.trim, mends: COATS.gold.mends, tag: COATS.gold.tag, form: '#e2d3b0' });
    lamp(s, 'spot', -11.3, H, 37.9, { clip, K: 3000, power: 0.45, cone: [34, 14] });

    // ---------- the ironing board ----------
    prop(s, 'craft.ironing', -9.4, 0, 33.75, 0, { cover: '#2f6f8f' });
    s.detail(() => { g.mat('weave', '#e9e1cf'); g.box(-9.6, 0.885, 33.62, -9.0, 0.89, 33.86); });
    s.spot('work', -9.4, 0, 34.35, Math.PI, { tags: ['mend', 'press'] });

    // ---------- the rail of finished work on the south wall ----------
    s.deco(() => {
      g.mat('cast', '#2a2622'); g.tube([[-12.6, 1.86, 39.45], [-8.8, 1.86, 39.45]], 0.014, { segs: 6 });
      for (const x of [-12.5, -10.7, -8.9]) { g.box(x - 0.015, 1.84, 39.45, x + 0.015, 1.88, Z1 - 0.16); g.box(x - 0.02, 1.7, Z1 - 0.18, x + 0.02, 1.95, Z1 - 0.16); }
    });
    const done = [['#c8402e', '#2a2622', '#d6a640'], ['#e9e1cf', '#2f6f8f', '#c8402e'], ['#6c9a4c', '#5b4060', '#e0b040'], ['#2a2622', '#c8402e', '#6c9a4c'], ['#d4878a', '#26306b', '#2f6f8f'], ['#5b4060', '#d6a640', '#e9e1cf'], ['#2f6f8f', '#b5653a', '#d4878a'], ['#d6a640', '#2a2622', '#26306b']];
    done.forEach((c, i) => prop(s, 'craft.coat', -12.35 + i * 0.47, 1.86, 39.35 - (i % 2) * 0.05, Math.PI, { coat: c[0], lining: c[1], mend: c[2], tag: '#b08a45', child: i === 5 }));
    sign(s, { kind: 'label', text: 'Mended', lines: ['collect with your name'] }, -10.7, 2.15, Z1 - 0.17, { face: 'z', w: 0.9, h: 0.2 });
    for (const x of [-11.6, -9.8]) s.spot('browse', x, 0, 38.85, 0, { tags: ['collect'] });
    lamp(s, 'spot', -10.6, H, 38.7, { clip, K: 3000, power: 0.5, cone: [44, 18] });

    // ---------- the treadle machine, and the waiting chair ----------
    prop(s, 'craft.treadle', -7.6, 0, Z1 - 0.42, Math.PI, { thread: '#e0b040', cloth: '#26306b' }, { spot: { tags: ['sew', 'mend'] } });
    prop(s, 'stool', -7.6, 0, 38.95, 0, { wood: '#5a3d28' }, { noSpots: true });
    lamp(s, 'sconce', -7.1, 1.85, Z1 - 0.16, { face: 'z', clip, K: 3000, power: 0.7 });
    prop(s, 'chair', -6.1, 0, 39.35, Math.PI, { wood: '#4a3020', seat: '#c8402e' });
    seat(s, -6.1, 0.46, 39.35, 0, 'Sit in the waiting chair');
    prop(s, 'plant', -12.35, 0, 39.3, 0, { kind: 'broad', size: 1.3, pot: '#2f5a55' });
    prop(s, 'craft.basket', -5.2, 0, 35.2, 0.3, { cols: ['#c8402e', '#e9e1cf', '#2f6f8f', '#2a2622'] });
    s.detail(() => drawTag(g, -5.1, 0.6, 35.45, { eye: '#c8402e' }));

    // ---------- people's ways ----------
    s.path([[X1, 38.45], [-4.8, 38.2], [-4.9, 35.9], [-5.0, 34.2]], { width: 1.1 });
    s.path([[-4.8, 38.2], [-8.4, 37.85], [-11.0, 38.5]], { width: 1.0 });
    s.path([[-8.4, 37.85], [-11.3, 37.1], [-11.4, 34.8], [-8.0, 34.85], [-6.6, 35.1]], { width: 0.9 });

    // ---------- things to do ----------
    s.interact({ x: -6.3, y: 1.4, z: 33.75, radius: 1.5, kind: 'talk', prompt: 'Talk to Wim', async onUse(game) {
      await talk(game, 'wim', ['Where did they put you? Candlewick. Good.', 'Have you eaten? Then sit a minute and show me what is torn.']);
      if (!game.ui) return;
      game.busy++; let c = null;
      try { c = await game.ui.choose('Wim', 'What will it be?', [{ label: 'Have something mended', value: 'menu' }, { label: 'Ask how he reads a coat', value: 'read' }, { label: 'Just looking', value: null }]); } finally { game.busy--; }
      if (c === 'read') {
        await talk(game, 'wim', ['Look at the seams, not the cloth. Straight little stitches are a machine. Small slanted ones are somebody\'s grandmother.', 'A patch in a colour that does not match is somebody who wanted you to know.', 'New cloth is twenty-five kays a kilogram. My hour moves six kays from your wallet to mine and costs the drum nothing. So we mend, and we let it show.']);
        found(game, 'shown-mend');
      } else if (c === 'menu') {
        await shopMenu(game, 'mender', { kicker: 'Wim mends', onBuy: async (it) => {
          if (it.id === 'patch') {
            game.flags.shownPatch = true; game.events.emit('item', { id: 'shown-patch', from: 'wim' });
            if (game.audio) game.audio.play('scissors', { vol: 0.6 });
            await talk(game, 'wim', ['Give me your cuff. Green, I think. You are in Chervil now.']);
            if (game.ui) game.ui.toast('Wim stitches over the hole in your cuff in Chervil green. It shows on purpose.', { kind: 'gain' });
          } else if (it.id === 'gold-seam') await talk(game, 'wim', ['An hour. Go and eat; come back when the hall bell goes. It will be the best part of the coat.']);
          else await talk(game, 'wim', ['Leave it with me. It will have your name on a tag by tonight.']);
        } });
      }
    } });
    const coatCard = (k, x, y, z) => s.interact({ x, y, z, radius: 1.3, prompt: 'Read the card on ' + COATS[k].title.replace('The ', 'the '), async onUse(game) { await readCard(game, COATS[k].title, COATS[k].text); if (k === 'gold') found(game, 'shown-mend'); } });
    coatCard('hessa', -3.75, 1.35, 33.1); coatCard('arno', -3.75, 1.35, 35.7); coatCard('gold', -11.6, 1.3, 37.9);
    s.interact({ x: -12.3, y: 1.6, z: 35.75, radius: 1.6, prompt: 'Look at the wall of thread', async onUse(game) {
      await readCard(game, 'The thread wall', ['Every colour Wim has ever needed to match, about three hundred spools, light at the top and dark at the bottom.', 'The two columns of greys at the end are for people who want a mend to whisper. Almost nobody asks for them.']);
    } });
    s.interact({ x: -5.2, y: 0.5, z: 35.2, radius: 1.1, prompt: 'Look in the basket of things waiting', async onUse(game) {
      await readCard(game, 'Waiting', ['A child\'s sleeve with no elbow left. A wing-sleeve fin for the Long Flight. Three hand lamps. A pair of shoes that want soles.', 'The tag on top says, in Wim\'s hand: flight things first.']);
    } });
    s.interact({ x: -9.8, y: 1.1, z: Z0 + 0.6, radius: 1.6, prompt: 'Read the offcut shelves', async onUse(game) {
      await readCard(game, 'Offcuts', ['Cellulose, linen, hemp and nettle, sorted by fibre along the wall and by colour up each shelf.', 'Sold by the gram. A shown patch takes about ten.']);
    } });

    s.zoneBox({ id: 'mender', place: 'mender', box: [X0, -0.5, Z0, X1, H, Z1], name: P.name, sub: 'Thread Street', ambience: 'shop', reverb: 'room', env: { exposure: 1.0, warmth: 0.32 } });
    s.finish();
    game.spawns.mender = { frame: f, x: -0.9, y: 0, z: 35.6, yaw: -Math.PI / 2 };
    game.spawns['mender-in'] = { frame: f, x: -4.8, y: 0, z: 38.0, yaw: -Math.PI / 2 - 0.35 };
    void shadeHex;
  },
};
