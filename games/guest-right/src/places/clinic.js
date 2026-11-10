// The Candlewick clinic: the block's clinic on Ladle Row, free from the commons. A small calm front room in cool white
// light (the only 4000 K on the street, but kind): a nurse's desk, a waiting bench, a height-and-weight post marked in g,
// a children's corner, a shelf of lidded jars, a notice about bone days, the chair by the door for anyone who only wants
// to talk, and a consulting room behind a half-open door.
import { wall, lamp, block } from '../world/kit.js';
import { room, shopfront } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { SIGNS } from '../content/signs.js';
import { candlewick, say, choose, found, meet, sfx, seat, ceilingWorks, trims, jar, rngFor, fy, shade } from './civic_parts.js';

const X0 = 82, X1 = 92, Z0 = -13.5, Z1 = -4, H = 3.2, ZP = -9.2;     // ZP: the partition between the front room and the consulting room
const PAL = { wall: '#e4ece7', tile: '#8cc0b6', floor: '#c5cfca', teal: '#2f6f73', birch: '#c9a77a', coral: '#e0735a', ink: '#24403d', cream: '#f4efe4' };

const BONE = { kind: 'notice', title: 'Bone days', lines: ['Children are measured every', 'year, in their birthday week,', 'here at nearly a full g.', 'Shoes off. Bring an aunt.', 'Nobody is too old to be', 'measured. Ask.'] };
const RIGHTS = { kind: 'notice', title: 'Births', lines: ['Every birth in the block is', 'seen here and registered,', 'proofread or not.', 'A child is a child.', 'Ask Nkem anything.'], paper: '#e9f1ec' };
const HOURS = { kind: 'notice', title: 'The nurse is in', lines: ['Days: Nkem', 'Lamp-night: ring the bell', 'and someone comes down', 'from 17 · 2.'], paper: '#f3e3d0' };

export const place = {
  id: 'clinic', name: 'The Candlewick clinic', order: 57,
  build(game) {
    const f = candlewick(game), s = game.world.scope('clinic', f), g = s.g;
    const clip = room(s, { x0: X0, z0: Z0, x1: X1, z1: Z1, y: 0, h: H, floor: ['speckle', PAL.floor], ceil: ['paint', '#eef2ee'],
      wall: { tint: PAL.wall, dado: { h: 1.15, mat: 'tile', tint: PAL.tile }, skirt: PAL.teal }, open: { s: false }, glow: { sky: '#eef4ff', ground: '#c5cfca', power: 0.2 } });
    const clipF = [X0 - 0.05, -0.2, ZP, X1 + 0.05, H + 0.1, Z1 + 0.6], clipB = [X0 - 0.05, -0.2, Z0 - 0.05, X1 + 0.05, H + 0.1, ZP + 0.1];

    // ---------------- the front ----------------
    shopfront(s, { side: 's', a0: X0, a1: X1, c: Z1, y: 0, h: H, door: { at: 0.85, w: 1.1, kind: 'slide' },
      fascia: { kind: 'fascia', text: 'Candlewick Clinic', sub: 'a nurse in · always free · walk in', emblem: 'drop', palette: [PAL.teal, '#f4efe4', '#9fe0d0'] },
      palette: { frame: PAL.teal, plinth: '#3e7f7b', awning: ['#e9f1ec', '#2f6f73'] }, awning: { depth: 0.9 }, plinth: 0.45, glow: 0.5 });
    sign(s, SIGNS['clinic.plate'], 86.6, 0.26, Z1 + 0.08, { face: 'Z', w: 0.5, h: 0.2 });
    sign(s, SIGNS['clinic.hanging'], 82.5, 2.3, Z1 + 0.55, { face: 'X', double: true, w: 0.5, h: 0.5 });
    s.deco(() => { g.mat('cast', '#2f2c28'); g.tube([[82.5, 2.62, Z1 + 0.1], [82.5, 2.62, Z1 + 0.85]], 0.012, { segs: 6 }); g.tube([[82.5, 2.62, Z1 + 0.55], [82.5, 2.56, Z1 + 0.55]], 0.006, { segs: 4 }); });

    // ---------------- the partition and the consulting room's half-open door ----------------
    wall(s, X0 + 0.16, ZP, X1 - 0.16, ZP, 0, H, { tint: PAL.wall, dado: { h: 1.15, mat: 'tile', tint: PAL.tile }, skirt: PAL.teal,
      openings: [{ at: 2.98, w: 1.7, h: 0.95, sill: 1.25 }, { at: 7.25, w: 0.92, h: 2.1 }] });
    s.glass(85.14, 1.25, ZP, 86.84, 2.2, ZP, { tint: '#e8f2ee', opacity: 0.55 });
    s.structure(() => {
      g.mat('wood', PAL.birch); g.box(85.1, 1.2, ZP - 0.1, 86.88, 1.25, ZP + 0.12, { bevel: 0.01 });
      g.box(85.1, 2.2, ZP - 0.1, 86.88, 2.26, ZP + 0.1, { bevel: 0.008 });
      g.mat('wood', shade(PAL.birch, 0.8));
      g.box(89.35, 0, ZP - 0.11, 89.41, 2.16, ZP + 0.11, { bevel: 0.006 }); g.box(90.33, 0, ZP - 0.11, 90.39, 2.16, ZP + 0.11, { bevel: 0.006 }); g.box(89.35, 2.1, ZP - 0.11, 90.39, 2.16, ZP + 0.11, { bevel: 0.006 });
    });
    s.furniture(() => {
      // the door, standing half open into the consulting room, hinged at its east jamb
      g.at(90.31, 0, ZP - 0.06, -1.35);
      g.mat('wood', '#e9efe9'); g.box(-0.9, 0, -0.02, 0, 2.08, 0.02, { bevel: 0.006 });
      g.mat('wood', '#d6e2dc'); g.box(-0.8, 0.15, 0.02, -0.1, 0.95, 0.03, { bevel: 0.006 }); g.box(-0.8, 1.1, 0.02, -0.1, 1.95, 0.03, { bevel: 0.006 });
      g.mat('cast', '#c8a45a'); g.tube([[-0.82, 1.0, 0.02], [-0.82, 1.0, 0.07], [-0.7, 1.0, 0.07]], 0.009, { segs: 6 });
      g.pop();
    });
    sign(s, { kind: 'plate', text: 'CONSULTING', lines: ['knock, then come in'] }, 89.0, 1.6, ZP + 0.085, { face: 'Z', w: 0.36, h: 0.16 });

    // ---------------- ceiling and trims ----------------
    ceilingWorks(s, X0 + 0.16, Z0 + 0.16, X1 - 0.16, Z1, H, { beam: '#dfe7e2', beamMat: 'paint', every: 2.5, duct: '#c4c8c4', ductZ: Z0 + 0.5, pipe: '#b07a45', pipeZ: Z0 + 0.95, beamD: 0.16 });
    trims(s, X0, Z0, X1, Z1, { skip: 's', rail: 2.15, railTint: PAL.birch, band: '#cfe3dc', bandH: 0.25, H });

    // ---------------- the nurse's desk, and the jars behind it ----------------
    prop(s, 'counter', 89.55, 0, -6.9, -Math.PI / 2, { w: 2.3, d: 0.6, body: '#e9efe9', top: PAL.birch }, { noSpots: true });
    s.spot('counter', 90.3, 0, -6.9, -Math.PI / 2, { who: 'nkem', tags: ['nurse', 'clinic'] });
    s.spot('customer', 88.75, 0, -6.6, Math.PI / 2, { tags: ['clinic'] });
    prop(s, 'civic.desklamp', 89.5, 0.92, -7.75, 0, { shade: '#2f6f73' });
    lamp(s, 'bulb', 89.5, 1.25, -7.72, { K: 3000, power: 0.25, range: 2.5, clip: clipF });
    prop(s, 'civic.bell', 89.45, 0.92, -6.05, 0, {});
    s.detail(() => {
      // a ledger open on the desk, a cup of pens, a lidded cup of tea, a blood-pressure cuff coiled in a tray
      g.mat('paper', '#f3ead6'); g.box(89.35, 0.92, -7.25, 89.75, 0.935, -6.75); g.mat('leather', '#7a2a3a'); g.box(89.34, 0.915, -7.26, 89.76, 0.922, -6.74);
      g.mat('plain', '#3a3a44'); for (let i = 0; i < 9; i++) g.box(89.4, 0.936, -7.2 + i * 0.022, 89.7 - (i % 3) * 0.06, 0.937, -7.19 + i * 0.022);
      g.mat('glaze', '#2f6f73'); g.cyl(89.65, 0.92, -6.45, 0.04, 0.11, { segs: 10 });
      g.mat('plain', '#e0735a'); g.box(89.635, 1.03, -6.46, 89.645, 1.12, -6.45); g.mat('plain', '#26306b'); g.box(89.66, 1.03, -6.44, 89.67, 1.1, -6.43);
      g.mat('wood', PAL.birch); g.box(89.3, 0.92, -6.35, 89.6, 0.95, -6.15);
      g.mat('weave', '#3a4f6b'); g.tube([[89.35, 0.96, -6.2], [89.5, 0.97, -6.3], [89.55, 0.96, -6.2], [89.42, 0.965, -6.18]], 0.018, { segs: 6 });
    });
    prop(s, 'cup', 89.72, 0.92, -6.25, 0, { glaze: '#e0735a' });
    prop(s, 'civic.rushstool', 90.5, 0, -7.0, -Math.PI / 2, { seat: '#8cc0b6' }, { noSpots: true });
    // shelves of lidded jars on the east wall
    prop(s, 'shelving', 91.66, 0, -6.9, -Math.PI / 2, { w: 2.4, h: 2.1, d: 0.32, shelves: 5, wood: PAL.birch });
    s.detail(() => {
      const r = rngFor('clinic-jars');
      const glazes = ['#e9efe9', '#8cc0b6', '#f4efe4', '#e0735a', '#2f6f73', '#d6c49a'];
      for (let k = 0; k < 5; k++) {
        const y = 0.08 + k * (2.1 - 0.11) / 5 + 0.025;
        if (k === 0) continue;
        let z = -8.0;
        while (z < -5.85) {
          const rr = r.f(0.04, 0.07), hh = r.f(0.1, 0.22);
          jar(g, 91.66 + r.f(-0.04, 0.04), y, z + rr, rr, hh, r.chance(0.5) ? '#dfeae6' : '#f0ead8', glazes[r.i(0, glazes.length - 1)], r.chance(0.6) ? ['#f4efe4', '#e8c27a', '#d4878a', '#a9d8c8', '#c9a46a'][r.i(0, 4)] : null);
          z += rr * 2 + r.f(0.03, 0.08);
        }
        // a paper label strip along the shelf edge
        g.mat('paper', '#f4efe4'); g.box(91.49, y - 0.02, -8.05, 91.5, y + 0.0, -5.75);
      }
    });
    s.spot('work', 90.6, 0, -8.25, Math.PI / 2, { tags: ['nurse', 'shelf', 'clinic'] });

    // ---------------- the waiting bench, the chair by the door, the water ----------------
    prop(s, 'bench', 82.45, 0, -7.4, Math.PI / 2, { w: 2.4, back: true, wood: PAL.birch, metal: PAL.teal }, { spot: { tags: ['waiting', 'clinic'] } });
    s.detail(() => { const r = rngFor('clinic-cushions'); for (let i = 0; i < 3; i++) { g.mat('weave', ['#e0735a', '#8cc0b6', '#d6c49a'][i]); const z = -8.3 + i * 0.85 + r.f(-0.05, 0.05); g.box(82.27, 0.46, z - 0.2, 82.62, 0.52, z + 0.2, { bevel: 0.03 }); } });
    seat(s, 82.5, 0, -7.4, Math.PI / 2, 'Sit and wait');
    prop(s, 'civic.armchair', 84.75, 0, -5.15, fy(1, -0.5), { cloth: '#d4878a', wood: '#7a5233', mend: '#2f6f73' }, { spot: { tags: ['talk', 'clinic'] } });
    seat(s, 84.75, 0, -5.15, fy(1, -0.5), 'Sit in the chair by the door', { onSit(gm) { chairTalk(gm); } });
    // its own warm standard lamp, the one warm light in the room
    s.furniture(() => {
      g.mat('cast', '#3a3630'); g.cyl(84.2, 0, -5.75, 0.14, 0.03, { segs: 14 }); g.tube([[84.2, 0.03, -5.75], [84.2, 1.45, -5.75]], 0.012, { segs: 6 });
      g.mat('weave', '#f0d9a8', { emissive: 0.7, lamp: true }); g.lathe(84.2, -5.75, [[0.2, 1.3], [0.13, 1.58], [0.12, 1.58]], { segs: 16, capTop: false, capBottom: false });
    });
    s.post(84.2, -5.75, 0.15, 0, 1.6);
    lamp(s, 'bulb', 84.2, 1.4, -5.75, { K: 2700, power: 0.55, range: 3.5, clip: clipF });
    sign(s, { kind: 'label', text: 'FOR ANYONE', sub: 'who only wants to talk', ink: '#24403d' }, 82.18, 1.5, -5.1, { face: 'X', w: 0.42, h: 0.12 });
    // a side table: a jug of water under a cloth, lidded cups
    prop(s, 'table', 83.0, 0, -9.0 + 0.3, 0, { w: 0.6, d: 0.4, h: 0.7, wood: PAL.birch });
    s.detail(() => { g.mat('diffuser', '#dfeae6', { rough: -0.4 }); g.lathe(82.9, -8.7, [[0.05, 0.7], [0.07, 0.75], [0.065, 0.92], [0.04, 0.96], [0.045, 0.99]], { segs: 12, capTop: false }); g.mat('weave', '#8cc0b6'); g.box(82.84, 0.99, -8.76, 82.96, 1.0, -8.64); });
    prop(s, 'cup', 83.12, 0.7, -8.62, 0, { glaze: '#f4efe4', lid: '#8cc0b6' }); prop(s, 'cup', 83.2, 0.7, -8.78, 0, { glaze: '#f4efe4', lid: '#e0735a' });

    // ---------------- the height-and-weight post, marked in g ----------------
    s.furniture(() => {
      g.at(-1.0, 0, 0, 0);
      g.mat('wood', PAL.birch); g.box(85.0, 0.0, ZP + 0.08, 85.16, 2.2, ZP + 0.18, { bevel: 0.01 });
      // a scale of bands from 0.95 to 1.00 g up the post, and a centimetre rule beside it
      const bands = ['#2f6f73', '#5f9a8e', '#8cc0b6', '#e8c27a', '#e0735a'];
      for (let i = 0; i < 5; i++) { g.mat('paint', bands[i]); g.box(85.16, 0.6 + i * 0.3, ZP + 0.1, 85.17, 0.88 + i * 0.3, ZP + 0.16); }
      g.mat('plain', '#24403d'); for (let k = 0; k <= 20; k++) g.box(85.17, 0.2 + k * 0.1, ZP + 0.1, 85.175, 0.205 + k * 0.1, ZP + (k % 5 === 0 ? 0.17 : 0.13));
      // a brass head slider and the weighing plate on the floor
      g.mat('cast', '#c8a45a', { rough: -0.2 }); g.box(85.0, 1.62, ZP + 0.16, 85.42, 1.65, ZP + 0.3, { bevel: 0.006 }); g.box(84.98, 1.58, ZP + 0.07, 85.18, 1.7, ZP + 0.2, { bevel: 0.01 });
      g.mat('speckle', '#3e4a48'); g.box(84.75, 0, ZP + 0.2, 85.55, 0.06, ZP + 0.85, { bevel: 0.015 });
      g.mat('cast', '#c8a45a'); g.box(84.8, 0.06, ZP + 0.25, 85.5, 0.065, ZP + 0.8);
      // the dial: a round face low on the post
      g.at(85.08, 1.0, ZP + 0.19, 0); g.rotX(Math.PI / 2);
      g.mat('cast', '#c8a45a'); g.cyl(0, 0, 0, 0.13, 0.03, { segs: 22 });
      g.mat('paint', '#f4efe4', { emissive: 0.3, lamp: true }); g.cyl(0, 0.03, 0, 0.11, 0.004, { segs: 22 });
      g.pop();
      g.mat('plain', '#e0735a'); g.box(85.075, 1.0, ZP + 0.225, 85.085, 1.09, ZP + 0.23);
      g.pop();
    });
    s.solid(83.75, 0, ZP + 0.05, 84.55, 0.06, ZP + 0.85);
    sign(s, { kind: 'label', text: 'MEASURED AT 0.98 g', sub: 'deck 16 · near a full weight', ink: '#24403d' }, 84.35, 2.42, ZP + 0.085, { face: 'Z', w: 0.62, h: 0.16 });
    sign(s, BONE, 88.0, 1.6, ZP + 0.085, { face: 'Z', w: 0.36, h: 0.5 });
    s.interact({ x: 84.15, y: 1.0, z: ZP + 0.6, radius: 1.1, prompt: 'Weigh yourself', async onUse(gm) {
      const gg = gm.player && gm.player.gNow ? gm.player.gNow : 0.98;
      sfx(gm, 'clunk', f, 84.15, 0.1, ZP + 0.5);
      await say(gm, 'The post', ['You step on the plate in your socks, because the sign says to. The brass slider comes down to the top of your head and the dial swings and settles.', 'It reads ' + gg.toFixed(2) + ' g: what this deck does to you, ' + Math.round(gg * 100) + ' parts in a hundred of what you would weigh down at the rim. Your height is printed beside it in centimetres, which nobody here finds as interesting.', 'The bands on the post are for children. A child who grows up past the coral band was raised heavy enough, or so every parent in the block believes.']);
      found(gm, 'low-deck-bones');
    } });
    s.spot('stand', 84.2, 0, ZP + 0.55, 0, { tags: ['measure', 'clinic'] });

    // ---------------- the children's corner ----------------
    prop(s, 'rug', 87.0, 0, -5.4, 0, { w: 2.2, d: 1.6, a: '#e0735a', b: '#f2c879', mat: 'motif' });
    prop(s, 'table', 87.0, 0, -5.35, 0, { round: true, w: 0.6, h: 0.45, wood: '#e8c27a' });
    for (const c of [[86.5, -5.2, '#2f6f73'], [87.5, -5.15, '#e0735a'], [87.05, -5.85, '#f2c879']]) prop(s, 'stool', c[0], 0, c[1], 0, { h: 0.28, wood: c[2] }, { spot: { type: 'play', tags: ['kids', 'clinic'] } });
    s.detail(() => {
      const r = rngFor('clinic-blocks');
      for (let i = 0; i < 9; i++) { g.mat('paint', ['#e0735a', '#2f6f73', '#f2c879', '#6c9a4c', '#26306b'][i % 5]); const x = 86.85 + r.f(-0.18, 0.18), z = -5.35 + r.f(-0.18, 0.18), y = 0.45 + (i > 5 ? 0.06 : 0); g.box(x - 0.03, y, z - 0.03, x + 0.03, y + 0.06, z + 0.03, { bevel: 0.006 }); }
      // a toy tub, a cloth doll, a wooden cab on a string
      g.mat('cane', '#c9a46a'); g.lathe(88.35, -4.87, [[0.18, 0], [0.22, 0.3], [0.2, 0.3]], { segs: 14 });
      g.mat('knit', '#d4878a'); g.ball(88.3, 0.33, -4.89, 0.07, 0.09, 0.06, { segs: 8, rings: 6 }); g.mat('knit', '#f2c879'); g.ball(88.3, 0.44, -4.89, 0.045, 0.045, 0.045, { segs: 8, rings: 5 });
      g.mat('wood', '#c9552e'); g.box(85.9, 0, -6.15, 86.12, 0.12, -6.0, { bevel: 0.015 }); g.mat('wood', '#2f2c28'); for (const dx of [85.95, 86.07]) g.cyl(dx, 0.0, -6.15, 0.022, 0.02, { segs: 8 });
    });
    // a low shelf of picture books against the front window
    s.furniture(() => {
      g.mat('wood', PAL.birch); g.box(85.6, 0, -4.48, 88.6, 0.05, -4.2); g.box(85.6, 0.38, -4.48, 88.6, 0.41, -4.2); g.box(85.6, 0, -4.48, 85.63, 0.55, -4.2); g.box(88.57, 0, -4.48, 88.6, 0.55, -4.2); g.box(85.6, 0.52, -4.48, 88.6, 0.55, -4.2);
    });
    s.solid(85.6, 0, -4.48, 88.6, 0.55, -4.2);
    prop(s, 'civic.books', 87.1, 0.05, -4.34, 0, { w: 2.9, seed: 3, cols: ['#e0735a', '#f2c879', '#2f6f73', '#6c9a4c', '#d4878a', '#26306b'] });
    prop(s, 'civic.books', 86.6, 0.41, -4.34, 0, { w: 1.8, seed: 4, cols: ['#8cc0b6', '#e8c27a', '#c9552e', '#f4efe4'] });
    lamp(s, 'lantern', 87.0, 2.35, -5.4, { tint: '#f2a48f', clip: clipF, power: 0.55, drop: 0.7, K: 2900 });
    s.interact({ x: 87.0, y: 0.8, z: -5.6, radius: 1.3, prompt: "Look at the children's corner", onUse(gm) { say(gm, "The children's corner", ['A rug, a low round table, three stools no higher than your knee and a tub of toys, all mended. A wooden cab has lost one wheel and been given a button.', 'Picture books along the window, spines out to the street, so the children outside can choose before they come in.']); } });

    // ---------------- notices by the door, a plant, the front room lamps ----------------
    sign(s, SIGNS['clinic.notice'], 82.18, 1.6, -6.0, { face: 'X', w: 0.3, h: 0.42 });
    sign(s, RIGHTS, 91.82, 1.62, -4.85, { face: 'x', w: 0.3, h: 0.42 });
    sign(s, HOURS, 91.82, 1.62, -5.35, { face: 'x', w: 0.26, h: 0.34 });
    prop(s, 'plant', 91.35, 0, -8.85, 0.4, { kind: 'broad', size: 1.5, pot: PAL.teal, seed: 2 });
    prop(s, 'plant', 88.95, 0, -4.55, 1.1, { kind: 'fern', size: 0.9, pot: '#f4efe4', seed: 5 });
    s.interact({ x: 83.0, y: 1.5, z: -5.9, radius: 1.0, prompt: 'Read the notices', onUse(gm) { say(gm, 'The clinic', ['Free from the commons. Walk in, sit down. The chair by the door is for anyone who wants to talk.']); } });
    s.interact({ x: 91.1, y: 1.5, z: -5.1, radius: 1.0, prompt: 'Read the notices', onUse(gm) { say(gm, 'Pinned by the window', ['Every birth in the block is seen here and registered, proofread or not. A child is a child. Ask Nkem anything.', 'The nurse is in: days, Nkem. Lamp-night: ring the bell and someone comes down from 17 · 2.']); } });
    s.interact({ x: 88.0, y: 1.5, z: ZP + 0.5, radius: 0.9, prompt: 'Read about bone days', onUse(gm) { say(gm, 'Bone days', ['Children are measured every year, in their birthday week, here at nearly a full g. Shoes off. Bring an aunt.', 'Nobody is too old to be measured. Ask.']); } });
    for (const x of [85.0, 89.0]) lamp(s, 'panel', x, H - 0.04, -6.6, { w: 1.2, d: 0.6, K: 4000, power: 0.6, clip: clipF, range: 6 });

    // ---------------- the consulting room ----------------
    s.furniture(() => {
      // the couch: a padded top on a steel frame, a roll of paper over it, a step
      g.mat('cast', '#c4c8c4', { rough: -0.1 }); for (const x of [85.2, 86.9]) for (const z of [-12.95, -12.35]) g.tube([[x, 0, z], [x, 0.62, z]], 0.022, { segs: 6 });
      g.box(85.15, 0.58, -13.0, 86.95, 0.62, -12.3);
      g.mat('leather', '#5f9a8e'); g.box(85.1, 0.62, -13.02, 87.0, 0.72, -12.28, { bevel: 0.03 }); g.box(85.1, 0.72, -13.02, 85.55, 0.86, -12.28, { bevel: 0.04 });
      g.mat('paper', '#f6f2e8'); g.box(85.55, 0.722, -12.85, 87.02, 0.728, -12.45); g.cyl(87.04, 0.62, -12.65, 0.05, 0.05, { segs: 10 });
      g.mat('wood', PAL.birch); g.box(86.3, 0, -12.2, 86.8, 0.2, -11.95, { bevel: 0.01 });
      // a folded blanket at the foot
      g.mat('knit', '#e0735a'); g.box(86.5, 0.72, -12.95, 86.95, 0.8, -12.35, { bevel: 0.02 });
    });
    s.solid(85.1, 0, -13.02, 87.0, 0.72, -12.28);
    s.spot('sit', 86.2, 0.72, -12.4, 0, { tags: ['patient', 'clinic'] });
    prop(s, 'civic.armlamp', 87.15, 0.0, -13.3, -0.6, { shade: '#e9efe9' });
    s.furniture(() => { g.mat('cast', '#3a3630'); g.tube([[87.15, 0, -13.3], [87.15, 1.3, -13.3]], 0.015, { segs: 6 }); g.cyl(87.15, 0, -13.3, 0.16, 0.03, { segs: 12 }); });
    lamp(s, 'spot', 86.5, 1.9, -12.9, { K: 3500, power: 0.35, dir: [-0.3, -1, 0.1], cone: [35, 15], range: 3, clip: clipB });
    // the cabinet of drawers, a small desk and two chairs, a sink, a curtain on a rail
    prop(s, 'civic.drawers', 91.6, 0, -11.6, -Math.PI / 2, { w: 1.4, h: 1.25, d: 0.42, rows: 5, cols: 3, wood: '#e9efe9', pull: '#2f6f73' });
    s.detail(() => { for (let i = 0; i < 4; i++) jar(g, 91.55, 1.28, -12.1 + i * 0.25, 0.05, 0.14, '#dfeae6', ['#e0735a', '#8cc0b6', '#2f6f73', '#f4efe4'][i], i % 2 ? '#f4efe4' : null); });
    prop(s, 'table', 88.7, 0, -12.9, 0, { w: 1.1, d: 0.6, wood: PAL.birch });
    prop(s, 'chair', 88.7, 0, -12.3, Math.PI, { wood: '#7a5233', seat: '#8cc0b6' }, { spot: { who: 'nkem', type: 'sit', tags: ['nurse', 'write', 'clinic'] } });
    prop(s, 'chair', 89.75, 0, -11.9, -Math.PI / 2 - 0.4, { wood: PAL.birch, back: 'slat' });
    s.detail(() => { g.mat('paper', '#f3ead6'); g.box(88.4, 0.74, -13.0, 88.7, 0.752, -12.75); g.mat('glaze', '#e0735a'); g.cyl(89.05, 0.74, -12.95, 0.035, 0.09, { segs: 10 }); g.mat('leather', '#26306b'); g.box(88.8, 0.74, -13.1, 89.0, 0.77, -12.8, { bevel: 0.004 }); });
    s.structure(() => {
      g.mat('glaze', '#f4efe4'); g.box(82.2, 0.8, -12.1, 82.65, 0.92, -11.45, { bevel: 0.03 });
      g.mat('cast', '#c4c8c4', { rough: -0.2 }); g.tube([[82.2, 1.15, -11.78], [82.42, 1.15, -11.78], [82.42, 1.05, -11.78]], 0.012, { segs: 6 });
      g.mat('glaze', '#e9efe9'); g.box(82.22, 0, -12.0, 82.5, 0.8, -11.55);
      // a curtain on a rail round the couch end
      g.mat('cast', '#c4c8c4'); g.tube([[84.6, 2.4, -13.34], [84.6, 2.4, -11.6], [86.0, 2.4, -11.6]], 0.012, { segs: 6 });
    });
    s.solid(82.2, 0, -12.1, 82.65, 0.92, -11.45);
    s.detail(() => { g.mat('weave', '#cfe3dc', { sway: 0.15 }); g.sheet([84.6, 2.38, -13.3], [84.6, 2.38, -12.4], [84.6, 0.3, -12.4], [84.6, 0.3, -13.3], { ripple: 0.05, nu: 8, nv: 4 }); });
    sign(s, { kind: 'board', title: 'A body', lines: ['Bones grow best heavy', 'Lives run about 120 years', 'Children measured yearly', 'Elders monthly'], palette: ['#24403d', '#f4efe4', '#8cc0b6'] }, 88.7, 1.75, Z0 + 0.17, { face: 'Z', w: 1.0, h: 0.68 });
    prop(s, 'plant', 82.55, 0, -13.0, 0.2, { kind: 'fine', size: 1.2, pot: '#e0735a', seed: 7 });
    lamp(s, 'panel', 87.0, H - 0.04, -11.4, { w: 1.2, d: 0.6, K: 4000, power: 0.5, clip: clipB, range: 5 });
    s.spot('work', 91.0, 0, -11.6, Math.PI / 2, { tags: ['nurse', 'clinic'] });
    s.interact({ x: 86.0, y: 0.9, z: -12.2, radius: 1.3, prompt: 'Look round the consulting room', onUse(gm) { say(gm, 'The consulting room', ['A couch with a fresh length of paper pulled over it, a lamp on an arm, a cabinet of small drawers with every label written in the same round hand.', 'It smells of nothing at all, which in a drum takes effort.']); } });

    // ---------------- Nkem ----------------
    s.interact({ x: 88.85, y: 1.2, z: -6.9, radius: 1.2, kind: 'talk', prompt: 'Talk to the nurse', onUse(gm) { nurseTalk(gm); } });
    s.interact({ x: 89.45, y: 1.0, z: -6.05, radius: 0.8, prompt: 'Ring the desk bell', onUse(gm) { sfx(gm, 'bell', f, 89.45, 1.0, -6.05); if (gm.ui) gm.ui.toast('A small bright ding. Somebody in the back says, "Coming."', { kind: 'info' }); } });

    // ---------------- sound, zone, people ----------------
    s.zoneBox({ id: 'clinic', place: 'clinic', box: [X0, -0.5, Z0, X1, H, Z1], name: 'The Candlewick clinic', sub: 'Ladle Row', ambience: 'shop', reverb: 'room', env: { warmth: -0.15 } });
    s.path([[83.45, -2.9], [83.45, -5.2], [85.6, -7.3], [88.5, -7.1]]);
    s.path([[85.6, -7.3], [83.2, -7.8]], { width: 1.2 });
    s.path([[85.6, -7.3], [84.4, -8.2]], { width: 1.2 });
    s.path([[88.5, -7.1], [89.75, -8.5], [89.72, -10.0], [88.6, -11.4], [86.4, -11.6]], { width: 1.1 });
    s.spot('stand', 88.3, 0, -8.2, fy(1, 0.2), { tags: ['waiting', 'clinic'] });
    s.spot('chat', 86.2, 0, -7.6, fy(0.6, 0.8), { tags: ['chat', 'clinic'] });
    s.spot('chat', 86.7, 0, -6.9, fy(-0.4, -0.9), { tags: ['chat', 'clinic'] });
    s.finish();
    game.spawns.clinic = { frame: f, x: 83.45, y: 0, z: -2.4, yaw: 0 };
  },
};

async function chairTalk(gm) {
  if (gm.flags.clinicChair) return;
  gm.flags.clinicChair = true;
  await say(gm, 'nkem', ['You found the chair. Good. Where did you sleep last night, and have you eaten?', 'Then sit as long as you like. Half the people who come in here only want to sit somewhere with someone in it. That is medicine too, and it is free from the same place the rest is.']);
  meet(gm, 'nkem');
}

async function nurseTalk(gm) {
  meet(gm, 'nkem');
  const pick = await choose(gm, 'nkem', 'Nkem looks up from the ledger.', [
    { label: 'How long have you nursed the block?', value: 'stay' },
    { label: 'What is a bone day?', value: 'bone' },
    { label: 'Is everybody here proofread?', value: 'proof' },
    { label: 'Could I be measured?', value: 'me' },
  ]);
  if (pick === 'stay') {
    await say(gm, 'nkem', ['Fifteen years. I took Augusta Nwachukwu\'s blood pressure this morning and she told me I was doing it wrong, as she has every month since I started.', 'Chervil pays for people\'s time more than most drums do. Cooks, teachers, music most nights, and nurses who stay. Staying is the whole job. I know which of the elders lie about their knees.']);
    found(gm, 'nurses-stay');
  } else if (pick === 'bone') {
    await say(gm, 'nkem', ['Every child in the block comes in once a year, in their birthday week, and stands on that post. Here at 0.98 of a g.', 'Families live down on the Low decks because bones grow best heavy. Or so every parent believes. I believe it too, on bone days.']);
    found(gm, 'low-deck-bones');
  } else if (pick === 'proof') {
    await say(gm, 'nkem', ['Nearly everybody. Proofreading every embryo is how it is done, and almost every family wants it.', 'Some don\'t, and that is a freedom here. The clinic still sees the birth and registers the child. In an open drum a wild-born child is a child, not a case. I have caught two. Both are loud and both are fine.']);
  } else if (pick === 'me') {
    await say(gm, 'nkem', ['Of course. Socks on the plate, back to the post. The slider comes down gently.', 'You are a guest, so I won\'t write it in the book. But I will tell you if you have been eating.']);
  }
}
