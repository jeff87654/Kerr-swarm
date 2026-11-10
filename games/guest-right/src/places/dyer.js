// Fast Colour: Priya Castellane's dyer's and tailor's on Thread Street (west side, x[-13, -3] z[40, 50]).
// What it is about: colour weighs nothing. The most colourful room in the game: wet cloth drying on rails overhead, a wall of
// named swatches at the back under a bright strip, vats along the north wall with years of one colour on each rim, and the
// festival's six colours hung in the window. Palette: white tile, dawn-rose plaster, teal beams, and every colour as the accent.
import { lamp, block } from '../world/kit.js';
import { shopfront } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { deckRadius } from '../core/drum.js';
import { SIGNS } from '../content/signs.js';
import { PLACES } from '../content/places.js';
import { MENUS } from '../content/menus.js';
import { Rng, hashStr, hsl, mixHex, shadeHex } from '../core/util.js';
import { shell, streetSign, talk, readCard, found, shopMenu, drawDrape, drawSkein, drawShears, drawTag, loopOnEnter } from './craft_parts.js';

const X0 = -13, X1 = -3, Z0 = 40, Z1 = 50, H = 3.2;
const FEST = MENUS.dyer.items.filter((it) => it.colour);              // this festival's six colours
const FC = FEST.map((it) => it.colour);
const NAME = (hex) => { const it = FEST.find((x) => x.colour === hex); return it ? it.name.replace('Re-dye a coat: ', '') : null; };

export const place = {
  id: 'dyer', name: 'Fast Colour', order: 53,
  build(game) {
    const f = game.world.frame('candlewick', deckRadius(16), 0, 625);
    const s = game.world.scope('dyer', f), g = s.g;
    const P = PLACES.dyer, r = new Rng(hashStr('dyer'));

    // ---------- shell ----------
    const clip = shell(s, { x0: X0, x1: X1, z0: Z0, z1: Z1, front: 'e', h: H, floor: ['tile', '#d9d3c6'], ceil: ['paint', '#f1e9dc'],
      wall: '#e8c9bf', dado: { h: 1.35, mat: 'tile', tint: '#e9e4d8' }, skirt: '#3a5a5a', beam: '#2f6f73', rail: '#2f6f73', pipes: ['#d6a640', '#5b4060'], duct: '#a39c8e',
      glow: { sky: '#fff0e0', ground: '#d9c8b8', power: 0.17 } });
    const pal = { frame: '#3b2a40', plinth: '#2c1f30', awning: FC };
    shopfront(s, { side: 'e', a0: Z0 + 0.05, a1: Z1 - 0.05, c: X1, y: 0, h: H, fascia: Object.assign({}, SIGNS['dyer.fascia'], { palette: ['#3b2a40', '#f6ead0', '#d6a640'], emblem: 'drop' }),
      palette: pal, door: { at: 4.45, w: 1.1, tint: '#3b2a40', label: P.name }, awning: { depth: 1.05, stripes: FC }, plinth: 0.4 });
    streetSign(s, Object.assign({}, SIGNS['dyer.hanging'], { palette: ['#f6ead0', '#3b2a40', '#d4878a'] }), X1, Z0 + 0.75, 1);
    prop(s, 'rug', -3.9, 0, 45.05, Math.PI / 2, { w: 1.0, d: 0.7, a: '#5b4060', b: '#d6a640', mat: 'rush' });
    // dye on the floor: drips and old splashes, thickest by the vats
    s.deco(() => {
      for (let i = 0; i < 90; i++) {
        const near = i < 60, x = near ? r.f(-12.6, -7.6) : r.f(-12.4, -4.2), z = near ? r.f(40.3, 42.6) : r.f(40.5, 49.6);
        g.mat('plain', mixHex(FC[r.i(0, 5)], '#d9d3c6', near ? r.f(0.1, 0.45) : r.f(0.4, 0.7)), { rough: -0.2 });
        g.cyl(x, 0.001, z, near ? r.f(0.02, 0.12) : r.f(0.01, 0.05), 0.002, { segs: 8, capBottom: false });
      }
      // a drain channel in front of the vats
      g.mat('grille', '#6a6560'); g.box(-12.7, 0.0, 42.1, -7.6, 0.004, 42.3, { faces: 'Y' });
    });

    // ---------- the window: two mannequins in festival coats (north bay), the six colours hung (south bay) ----------
    block(s, -4.3, 0, Z0 + 0.2, X1 - 0.12, 0.45, 44.2, 'wood', '#2c1f30', { bevel: 0.015 });
    block(s, -4.0, 0, 45.9, X1 - 0.12, 0.45, Z1 - 0.2, 'wood', '#2c1f30', { bevel: 0.015 });
    s.detail(() => { g.mat('felt', '#d6a640'); g.box(-4.26, 0.45, Z0 + 0.24, X1 - 0.16, 0.462, 44.16, { faces: 'Y' }); g.mat('felt', '#26306b'); g.box(-3.96, 0.45, 45.94, X1 - 0.16, 0.462, Z1 - 0.24, { faces: 'Y' }); });
    prop(s, 'craft.form', -3.72, 0.46, 41.3, Math.PI / 2 - 0.25, { coat: '#5b4060', lining: '#d6a640', trim: '#d6a640', head: true, long: true, form: '#e8dccb', button: '#d6a640',
      mends: [{ kind: 'patch', c: '#d4878a', a: 0.55, y: 1.0, w: 0.09, h: 0.07, stitch: '#d6a640' }] });
    prop(s, 'craft.form', -3.72, 0.46, 43.2, Math.PI / 2 + 0.25, { coat: '#6c9a4c', lining: '#b5653a', trim: '#26306b', head: true, long: true, form: '#d9c7a6', button: '#b5653a' });
    // six lengths of the festival colours on a rail behind the glass, each with its card
    s.deco(() => {
      g.mat('cast', '#2a2622'); g.tube([[-3.55, 2.62, 46.05], [-3.55, 2.62, 49.7]], 0.012, { segs: 6 });
      FC.forEach((c, i) => {
        const z0 = 46.12 + i * 0.6, z1 = z0 + 0.54, bot = 0.66 + (i % 2) * 0.12;
        g.mat('weave', c); g.sheet([-3.55, 2.6, z0], [-3.55, 2.6, z1], [-3.5 - 0.04 * (i % 2), bot, z1], [-3.5 - 0.04 * (i % 2), bot, z0], { nu: 6, nv: 6, ripple: 0.025, rippleN: 4 });
        drawTag(g, -3.46, bot + 0.02, (z0 + z1) / 2, { eye: c });
      });
    });

    // ---------- the vats along the north wall ----------
    const vats = [['#26306b', true], ['#5b4060', false], ['#d4878a', false], ['#6c9a4c', true]];
    vats.forEach((v, i) => {
      const x = -12.0 + i * 1.22;
      prop(s, 'craft.vat', x, 0, 40.85, 0, { dye: v[0], open: v[1] });
      s.detail(() => {
        // a water tap over each one, from the loop pipe on the wall
        g.mat('cast', '#9a9488', { rough: -0.2 }); g.tube([[x + 0.3, 1.25, Z0 + 0.16], [x + 0.3, 1.25, Z0 + 0.32], [x + 0.3, 1.32, Z0 + 0.42], [x + 0.3, 1.18, Z0 + 0.62]], 0.018, { segs: 6 });
        g.mat('cast', '#c24a2a'); g.cyl(x + 0.3, 1.33, Z0 + 0.3, 0.03, 0.02, { segs: 8 });
      });
    });
    s.deco(() => {
      g.mat('cast', '#b5653a', { rough: -0.1 }); g.tube([[-12.84, 1.25, Z0 + 0.22], [-7.5, 1.25, Z0 + 0.22]], 0.03, { segs: 8 });
      g.mat('cast', '#3a3632'); for (let x = -12.5; x < -7.5; x += 1.2) g.box(x - 0.015, 1.18, Z0 + 0.16, x + 0.015, 1.3, Z0 + 0.28);
      // the shelf of dye powders above the vats
      g.mat('wood', '#2f6f73'); g.box(-12.84, 1.78, Z0 + 0.16, -7.6, 1.81, Z0 + 0.42, { bevel: 0.005 });
      for (const x of [-12.4, -10.2, -8.0]) g.box(x - 0.015, 1.62, Z0 + 0.16, x + 0.015, 1.78, Z0 + 0.36);
      g.box(-12.84, 2.28, Z0 + 0.16, -7.6, 2.31, Z0 + 0.42, { bevel: 0.005 });
    });
    s.detail(() => {
      for (const sy of [1.81, 2.31]) for (let i = 0; i < 26; i++) {
        const x = -12.7 + i * 0.198 + r.f(-0.02, 0.02), hh = r.f(0.11, 0.17), rr = r.f(0.035, 0.05), c = hsl((i / 26 + (sy > 2 ? 0.5 : 0)) % 1, r.f(0.5, 0.8), r.f(0.3, 0.55));
        g.mat('plain', c, { rough: 0.2 }); g.cyl(x, sy + 0.005, Z0 + 0.29, rr * 0.9, hh * 0.7, { segs: 8, capBottom: false });
        g.mat('glaze', '#dfe6e4', { rough: -0.4 }); g.lathe(x, Z0 + 0.29, [[rr, sy], [rr, sy + hh], [rr * 0.7, sy + hh + 0.01], [rr * 0.7, sy + hh + 0.025]], { segs: 8, capBottom: false });
        g.mat('cast', '#3a3632'); g.cyl(x, sy + hh + 0.02, Z0 + 0.29, rr * 0.75, 0.02, { segs: 8 });
      }
    });
    lamp(s, 'spot', -3.75, H, 42.3, { clip, K: 3100, power: 0.6, cone: [44, 18] });
    lamp(s, 'spot', -3.25, H, 47.9, { clip, K: 3100, power: 0.7, cone: [56, 24] });
    lamp(s, 'globe', -11.4, 2.25, 41.45, { clip, K: 4000, power: 0.9, drop: 0.95, r: 0.14 });
    lamp(s, 'globe', -8.95, 2.25, 41.45, { clip, K: 4000, power: 0.9, drop: 0.95, r: 0.14 });
    for (const x of [-11.4, -9.0]) s.spot('work', x, 0, 41.75, Math.PI, { tags: ['dye'] });
    loopOnEnter(game, 'dyer', [() => game.loopAt('steam', f, -10.2, 0.9, 40.9, { vol: 0.18, radius: 6 })]);

    // ---------- cloth drying overhead ----------
    s.deco(() => {
      const rails = [41.15, 42.1, 43.05, 43.95, 46.1, 47.05];
      g.mat('cast', '#2a2622');
      for (const z of rails) { g.tube([[-11.3, 2.92, z], [-4.4, 2.92, z]], 0.012, { segs: 6 }); for (const x of [-11.2, -7.9, -4.6]) g.tube([[x, 2.92, z], [x, H, z]], 0.006, { segs: 4 }); }
      rails.forEach((z, k) => {
        let x = -11.2;
        while (x < -4.8) {
          const w = r.f(0.55, 1.4), x1 = Math.min(-4.6, x + w);
          if (r.chance(0.82)) {
            const c = r.chance(0.5) ? FC[r.i(0, 5)] : hsl(r.next(), r.f(0.45, 0.8), r.f(0.35, 0.65));
            drawDrape(g, x, x1, 2.9, z, r.f(0.55, 0.95), c, { mat: ['weave', 'weave', 'stripe', 'motif', 'knit'][r.i(0, 4)], back: r.f(0.8, 1.0) });
          }
          x = x1 + r.f(0.06, 0.2);
        }
        void k;
      });
      // skeins on a lower rail over the aisle
      g.mat('cast', '#2a2622'); g.tube([[-11.8, 2.55, 45.0], [-5.6, 2.55, 45.0]], 0.01, { segs: 6 }); for (const x of [-11.8, -5.6]) g.tube([[x, 2.55, 45.0], [x, H, 45.0]], 0.006, { segs: 4 });
      for (let i = 0; i < 18; i++) drawSkein(g, -11.6 + i * 0.34, 2.55, 45.0, r.f(0.3, 0.42), i % 3 === 0 ? FC[i % 6] : hsl(i / 18, 0.65, 0.5), 'x');
    });
    lamp(s, 'lantern', -6.3, 2.35, 44.55, { clip, tint: '#d4878a', power: 0.55, drop: 0.65 });
    lamp(s, 'lantern', -9.7, 2.35, 45.45, { clip, tint: '#d6a640', power: 0.55, drop: 0.65 });

    // ---------- the swatch wall at the back ----------
    prop(s, 'craft.drawers', -12.6, 0, 44.8, Math.PI / 2, { w: 6.6, h: 0.8, d: 0.42, cols: 18, rows: 3, wood: '#2f6f73', top: '#d9d3c6' });
    s.deco(() => {
      const bx = -12.82, z0 = 41.4, z1 = 48.0, y0 = 1.0, y1 = 2.42, cols = 20, rows = 6;
      g.mat('paint', '#f3ece0'); g.box(bx, y0 - 0.06, z0 - 0.08, bx + 0.025, y1 + 0.06, z1 + 0.08, { bevel: 0.006 });
      g.mat('wood', '#2f6f73'); g.box(bx, y1 + 0.06, z0 - 0.12, bx + 0.05, y1 + 0.1, z1 + 0.12, { bevel: 0.006 }); g.box(bx, y0 - 0.1, z0 - 0.12, bx + 0.05, y0 - 0.06, z1 + 0.12, { bevel: 0.006 });
      const dz = (z1 - z0) / cols, dy = (y1 - y0) / rows;
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const zc = z0 + (i + 0.5) * dz, yc = y0 + (j + 0.5) * dy;
        let c = hsl(i / cols, 0.55 + 0.25 * (j % 2), 0.78 - j * 0.1);
        if (j === rows - 1 && i % 4 === 1) c = FC[(i >> 2) % 6];
        g.mat(['weave', 'knit', 'weave', 'felt'][(i + j) % 4], c); g.box(bx + 0.025, yc - dy * 0.16, zc - dz * 0.4, bx + 0.032, yc + dy * 0.36, zc + dz * 0.4);
        g.mat('paper', '#fbf6ea'); g.box(bx + 0.025, yc - dy * 0.38, zc - dz * 0.36, bx + 0.03, yc - dy * 0.22, zc + dz * 0.36);
        g.mat('plain', '#4a4040'); g.box(bx + 0.03, yc - dy * 0.31, zc - dz * 0.26, bx + 0.031, yc - dy * 0.29, zc + dz * (0.06 + 0.2 * ((i * 7 + j * 3) % 5) / 5));
      }
    });
    sign(s, { kind: 'letters', text: 'Any colour on this wall', palette: ['#3b2a40'] }, -12.8, 2.74, 44.7, { face: 'X', w: 3.6, h: 0.42 });
    lamp(s, 'strip', -11.7, 2.9, 41.9, { to: [-11.7, 2.9, 47.6], clip, K: 3600, power: 1.15 });
    for (const z of [42.4, 44.2, 46.6]) s.spot('browse', -11.7, 0, z, -Math.PI / 2, { tags: ['swatches'] });

    // ---------- the tailor's side: cutting table, fitting booth, mirror ----------
    prop(s, 'table', -11.3, 0, 46.55, 0, { w: 1.9, d: 0.95, h: 0.88, wood: '#4a3a30', top: '#b08a5a' });
    s.detail(() => {
      g.mat('weave', '#6c9a4c'); g.box(-12.2, 0.88, 46.2, -11.0, 0.886, 46.9);
      g.mat('paper', '#d9c9a8'); g.prism([[-11.6, 46.25], [-10.8, 46.3], [-10.7, 46.8], [-11.5, 46.95]], 0.886, 0.889);
      g.mat('plain', '#f3ede2'); g.box(-12.1, 0.887, 46.6, -11.1, 0.889, 46.61);
      g.push(); g.move(-10.9, 0.886, 46.2); g.rotY(2.2); drawShears(g, { handle: '#d6a640' }); g.pop();
      g.mat('weave', '#d6a640'); const tp = []; for (let i = 0; i <= 20; i++) { const t = i / 20; tp.push([-12.3 + t * 0.5, 0.89, 46.85 - Math.sin(t * 6) * 0.04]); } g.tube(tp, 0.006, { segs: 3 });
      for (let i = 0; i < 5; i++) { g.mat('knit', FC[i]); g.cyl(-12.25 + i * 0.06, 0.88, 46.25, 0.02, 0.05, { segs: 7 }); }
    });
    s.spot('work', -11.45, 0, 47.2, Math.PI, { tags: ['sew', 'cut'] });
    // the fitting booth: a curtain on a rail in the corner, a stool inside
    s.deco(() => {
      g.mat('cast', '#2a2622'); g.tube([[-11.2, 2.3, Z1 - 0.16], [-11.2, 2.3, 48.25], [-12.84, 2.3, 48.25]], 0.012, { segs: 6 });
      g.mat('stripe', '#5b4060'); g.sheet([-11.2, 2.28, 49.75], [-11.2, 2.28, 48.9], [-11.2, 0.06, 48.95], [-11.2, 0.06, 49.75], { nu: 8, nv: 6, ripple: 0.05, rippleN: 6 });
      g.sheet([-11.25, 2.28, 48.25], [-12.1, 2.28, 48.25], [-12.1, 0.06, 48.25], [-11.25, 0.06, 48.25], { nu: 8, nv: 6, ripple: 0.05, rippleN: 7 });
      for (let i = 0; i < 9; i++) { g.mat('cast', '#b08a45'); g.tube([[-11.2, 2.3, 49.75 - i * 0.1], [-11.2, 2.28, 49.75 - i * 0.1]], 0.012, { segs: 5, closed: false }); }
    });
    s.solid(-11.25, 0, 48.2, -11.15, 2.3, Z1); s.solid(-12.84, 0, 48.2, -11.2, 2.3, 48.3);
    prop(s, 'stool', -12.2, 0, 49.2, 0, { wood: '#4a3a30' });
    prop(s, 'craft.mirror', -10.2, 0, 49.5, Math.PI, { wood: '#2f6f73' });
    s.furniture(() => { g.mat('wood', '#4a3a30'); g.lathe(-10.2, 48.75, [[0.36, 0], [0.36, 0.12], [0.34, 0.14], [0, 0.14]], { segs: 20 }); g.mat('felt', '#d4878a'); g.cyl(-10.2, 0.14, 48.75, 0.33, 0.006, { segs: 20 }); });
    s.solid(-10.56, 0, 48.39, -9.84, 0.14, 49.11, { surf: 'wood' });
    s.spot('stand', -10.2, 0.14, 48.75, Math.PI, { tags: ['fitting'] });
    s.spot('work', -9.6, 0, 48.2, Math.PI - 0.6, { tags: ['sew', 'fitting'] });
    lamp(s, 'spot', -10.4, H, 48.6, { clip, K: 3000, power: 0.6, cone: [40, 16] });

    // ---------- a rail of coats re-dyed for the festival, ready by morning ----------
    s.furniture(() => {
      g.mat('cast', '#2a2622');
      for (const x of [-9.4, -6.7]) { g.tube([[x, 0.02, 46.4], [x, 1.86, 46.4]], 0.016, { segs: 6 }); g.tube([[x, 0.02, 46.1], [x, 0.02, 46.7]], 0.016, { segs: 6 }); for (const z of [46.1, 46.7]) g.ball(x, 0.03, z, 0.03, 0.03, 0.03, { segs: 6, rings: 4 }); }
      g.tube([[-9.45, 1.86, 46.4], [-6.65, 1.86, 46.4]], 0.014, { segs: 6 });
    });
    s.solid(-9.45, 0, 46.25, -6.65, 1.9, 46.55);
    for (let i = 0; i < 13; i++) prop(s, 'craft.coat', -9.2 + i * 0.2, 1.86, 46.4, Math.PI / 2 + (i % 2 ? 0.08 : -0.06), { coat: FC[(i * 5) % 6], lining: FC[(i * 5 + 3) % 6], trim: shadeHex(FC[(i * 5) % 6], 0.7), tag: '#d6a640' });
    sign(s, { kind: 'label', text: 'Ready by morning', ink: '#3b2a40' }, -8.05, 2.0, 46.4, { face: 'Z', w: 0.9, h: 0.14 });
    s.spot('browse', -8.0, 0, 47.1, Math.PI, { tags: ['collect'] });

    // ---------- Priya's counter, the chalkboard behind it, a rail of tailoring by the window ----------
    prop(s, 'counter', -7.8, 0, 48.7, Math.PI, { w: 2.0, d: 0.6, body: '#5b4060', top: '#d9d3c6', topMat: 'tile' }, { noSpots: true });
    s.spot('counter', -7.8, 0, 49.45, 0 + Math.PI, { who: 'priya', tags: ['dye', 'sew'] });
    s.spot('customer', -7.8, 0, 47.85, 0, {});
    s.spot('queue', -6.7, 0, 47.6, -0.4, {});
    sign(s, SIGNS['dyer.chalk'], -7.8, 1.62, Z1 - 0.17, { face: 'z', w: 0.7, h: 0.98 });
    prop(s, 'craft.buttons', -8.4, 0.92, 48.75, 0.3, { wood: '#4a3a30' });
    prop(s, 'craft.bolt', -7.4, 0.92, 48.75, 0.1, { c: '#d4878a', len: 0.7, r: 0.06 });
    prop(s, 'plant', -8.65, 0.92, 48.55, 0, { kind: 'flower', size: 0.5, pot: '#d6a640' });
    s.detail(() => {
      // Priya's book of the week's coats, and a jar of six-coloured fingers' worth of brushes
      g.mat('leather', '#26306b'); g.box(-7.95, 0.92, 48.5, -7.6, 0.95, 48.8, { bevel: 0.006 }); g.mat('paper', '#fbf6ea'); g.box(-7.93, 0.95, 48.51, -7.62, 0.955, 48.79);
      g.mat('glaze', '#e9e4d8'); g.cyl(-7.15, 0.92, 48.55, 0.04, 0.12, { segs: 8 });
      for (let i = 0; i < 6; i++) { g.mat('wood', '#c9a06a'); const a = i; g.tube([[-7.15, 0.95, 48.55], [-7.15 + Math.cos(a) * 0.04, 1.14, 48.55 + Math.sin(a) * 0.04]], 0.004, { segs: 3 }); g.mat('plain', FC[i]); g.ball(-7.15 + Math.cos(a) * 0.042, 1.15, 48.55 + Math.sin(a) * 0.042, 0.008, 0.016, 0.008, { segs: 5, rings: 3 }); }
    });
    lamp(s, 'globe', -7.8, 2.3, 48.7, { clip, K: 2800, power: 0.6, drop: 0.85, r: 0.13 });
    s.deco(() => { g.mat('cast', '#2a2622'); g.tube([[-6.45, 1.82, Z1 - 0.42], [-4.25, 1.82, Z1 - 0.42]], 0.012, { segs: 6 }); for (const x of [-6.4, -4.3]) g.box(x - 0.015, 1.8, Z1 - 0.42, x + 0.015, 1.84, Z1 - 0.16); });
    const tail = [['#e9e1cf', '#26306b'], ['#2a2622', '#d4878a'], ['#b5653a', '#6c9a4c'], ['#26306b', '#d6a640']];
    tail.forEach((c, i) => prop(s, 'craft.coat', -6.2 + i * 0.55, 1.82, Z1 - 0.48, Math.PI, { coat: c[0], lining: c[1], tag: '#3b2a40', child: i === 1 }));
    sign(s, { kind: 'label', text: 'Let out, taken in, relined', ink: '#3b2a40' }, -5.35, 2.12, Z1 - 0.17, { face: 'z', w: 1.3, h: 0.14 });
    s.spot('browse', -5.3, 0, 48.9, 0, { tags: ['tailoring'] });

    // ---------- people's ways ----------
    s.path([[X1, 45.05], [-4.8, 45.05], [-7.5, 45.0], [-11.0, 45.0]], { width: 1.2 });
    s.path([[-7.5, 45.0], [-8.0, 47.7]], { width: 1.0 });
    s.path([[-7.5, 45.0], [-9.0, 42.0], [-11.2, 41.9]], { width: 1.0 });
    s.path([[-4.8, 45.05], [-5.3, 48.4]], { width: 0.9 });

    // ---------- things to do ----------
    const redye = async (game) => shopMenu(game, 'dyer', { kicker: 'Priya dyes', footer: 'Your coat now: ' + (NAME(game.flags.coat) || (game.flags.coat ? 'dyed here' : 'Spelt grey')), onBuy: async (it) => {
      if (game.audio) game.audio.play('splash', { vol: 0.35 });
      if (it.colour) {
        game.flags.coat = it.colour; game.events.emit('coat', { colour: it.colour });
        const nm = NAME(it.colour);
        await talk(game, 'priya', [nm + '. Off with it, then. Ten minutes in the hot vat, ten under the fan.', 'There. You look like you live here.']);
        if (game.ui) game.ui.toast('Your coat is ' + nm + ' now. Colour weighs nothing.', { kind: 'gain' });
        found(game, 'colour-weighs-nothing');
      } else if (it.id === 'collar-cuffs') {
        let c = null;
        if (game.ui) { game.busy++; try { c = await game.ui.choose('Priya', 'Which colour for the collar and cuffs?', FEST.map((x) => ({ label: NAME(x.colour), value: x.colour }))); } finally { game.busy--; } }
        c = c || FC[1]; game.flags.cuffs = c; game.events.emit('coat', { cuffs: c });
        await talk(game, 'priya', ['Just the edges. That is where fashion lives anyway.']);
        if (game.ui) game.ui.toast('Your collar and cuffs are ' + NAME(c) + ' now.', { kind: 'gain' });
      } else await talk(game, 'priya', ['Leave it on the hook with your name. By morning.']);
    } });
    s.interact({ x: -7.8, y: 1.4, z: 49.0, radius: 1.6, kind: 'talk', prompt: 'Talk to Priya', async onUse(game) {
      await talk(game, 'priya', ['You have the look of someone who slept on a slow line. Have you eaten?', 'Then let us talk about that coat. It has been grey for eleven legs.']);
      if (!game.ui) return;
      game.busy++; let c = null;
      try { c = await game.ui.choose('Priya', 'What can she do for you?', [{ label: 'Re-dye your coat for the festival', value: 'menu' }, { label: 'Ask why it costs so little', value: 'why' }, { label: 'Just looking', value: null }]); } finally { game.busy--; }
      if (c === 'menu') await redye(game);
      else if (c === 'why') { await talk(game, 'priya', ['A new shirt is about five kays of new mass. Dye is grams. The vats sit on the loop and keep warm for nothing.', 'So a tenth of a kay buys you a different coat for Booking Day. I have done four hundred this week. My hands are six colours.']); found(game, 'colour-weighs-nothing'); }
    } });
    s.interact({ x: -7.8, y: 1.6, z: 49.6, radius: 1.0, priority: -0.5, prompt: 'Read the festival colours', async onUse(game) {
      await readCard(game, 'Festival colours', ['Bruise, Dawn Rose, Far-Bank Gold, Flight Indigo, Chervil Green, Lid Copper.', 'Re-dye a coat: 0.1. Collar and cuffs: 0.05.']);
      found(game, 'colour-weighs-nothing');
    } });
    s.interact({ x: -5.3, y: 1.3, z: Z1 - 0.5, radius: 1.3, prompt: "Look inside the seam of the child's coat", async onUse(game) {
      await readCard(game, "A child's coat", ['Inside every seam there is a hand\'s width of cloth folded in and tacked down, and two pencil lines where it has already been let out.', 'Priya\'s tag says: once more, then it goes to the cousin.']);
      found(game, 'growing-seam');
    } });
    s.interact({ x: -10.78, y: 1.0, z: 41.0, radius: 1.2, prompt: 'Lift the lid of the bruise vat', async onUse(game) {
      if (game.audio) game.audio.play('lid-up', { vol: 0.6 });
      await readCard(game, 'The bruise vat', ['Warm off the loop, the colour of the River\'s dusty edges. The rim has been this colour for nine years.', 'A sign taped to the lid says: Oona\'s coat goes in last.']);
      if (game.audio) game.audio.play('lid-down', { vol: 0.6 });
    } });
    s.interact({ x: -10.2, y: 1.3, z: 49.4, radius: 1.4, prompt: 'Look in the mirror', async onUse(game) {
      const nm = NAME(game.flags.coat);
      await readCard(game, 'The fitting mirror', nm ? ['A wanderer in a ' + nm + ' coat looks back, a little tired, and better dressed than yesterday.'] : ['A wanderer in a grey Spelt coat looks back. Eleven legs of grey.', 'Everyone else on this street is wearing a colour.']);
    } });
    s.interact({ x: -12.4, y: 1.7, z: 45.0, radius: 1.8, prompt: 'Read the swatch names', async onUse(game) {
      await readCard(game, 'The swatch wall', ['Every colour Priya can make, each with its name in her hand: Mill White, Keel Grey, Loop Rust, Orchard Leaf, Lake at Noon, Ladle Brass, Spindle Night.', 'The bottom row is this festival\'s six, and the names are already wearing off from being pointed at.']);
    } });

    s.zoneBox({ id: 'dyer', place: 'dyer', box: [X0, -0.5, Z0, X1, H, Z1], name: P.name, sub: 'Thread Street', ambience: 'shop', reverb: 'room', env: { exposure: 1.0, warmth: 0.2, saturation: 1.15 } });
    s.finish();
    game.spawns.dyer = { frame: f, x: -0.9, y: 0, z: 45.0, yaw: -Math.PI / 2 };
    game.spawns['dyer-in'] = { frame: f, x: -4.6, y: 0, z: 45.0, yaw: -Math.PI / 2 };
  },
};
