// The laundry: a warm bright room of drum washers with round doors (each one a little spinning drum inside the big
// spinning drum, a joke the locals stopped noticing), drying racks on pulleys hung with dyed clothes, folding tables,
// baskets with name tags, a mending corner, a price board with the night price, a bench for waiting and talking, and a
// shelf of socks nobody came back for. A load is about 0.2 kWh, and cheapest in the lamp-night.
import { lamp } from '../world/kit.js';
import { room, shopfront } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { candlewick, say, found, sfx, seat, ceilingWorks, trims, dryingRack, jar, rngFor, fy, shade, wallClock } from './civic_parts.js';

const X0 = -61.5, X1 = -50, Z0 = -13.5, Z1 = -4, H = 3.2;
const PAL = { wall: '#f1dfa8', tile: '#c9654a', floor: '#e8dcc4', pine: '#c9a46a', cobalt: '#2f5f9f', cream: '#f4ecd8', ink: '#2a2622' };
const WASHERS = ['#efe6d2', '#9fd0b8', '#9cc4e4', '#f0a48a', '#f2d27a', '#efe6d2', '#2f5f9f', '#e9e1cf'];
const LOADS = ['#c9552e', '#2f6f73', '#e7b547', '#7a2a5a', '#3a5f9f', '#d4878a', '#6c9a4c', '#e8e2d0'];
const DYED = ['#c9552e', '#2f6f73', '#e7b547', '#7a2a5a', '#26306b', '#d4878a', '#6c9a4c', '#b5653a', '#33406e', '#f0d070', '#8a2f3c', '#3fa7a3'];

const PRICES = { kind: 'chalk', title: 'A load', lines: ['Lamp-noon · 0.24', 'Mornings, evenings · 0.20', 'After eleven · 0.15', 'One till lamp-dawn · 0.12', 'The machines want the night.', 'So does your washing.'] };
function priceNow(h) { return h >= 1 && h < 6.5 ? 0.12 : (h >= 23 || h < 1) ? 0.15 : (h >= 11 && h < 15) ? 0.24 : 0.2; }

export const place = {
  id: 'laundry', name: 'The laundry', order: 59,
  build(game) {
    const f = candlewick(game), s = game.world.scope('laundry', f), g = s.g;
    const clip = room(s, { x0: X0, z0: Z0, x1: X1, z1: Z1, y: 0, h: H, floor: ['pattern', PAL.floor], ceil: ['paint', '#f4ecd8'],
      wall: { tint: PAL.wall, dado: { h: 1.25, mat: 'tile', tint: PAL.tile }, skirt: '#7a3b2e' }, open: { s: false }, glow: { sky: '#ffe6bf', ground: '#e8d2a8', power: 0.32 } });

    // ---------------- the front ----------------
    shopfront(s, { side: 's', a0: X0, a1: X1, c: Z1, y: 0, h: H, door: { at: 1.0, w: 1.1, kind: 'slide' },
      fascia: { kind: 'fascia', text: 'The Round Doors', sub: 'laundry · night price after eleven', emblem: 'drop', palette: [PAL.cobalt, '#f4ecd8', '#f2d27a'] },
      palette: { frame: PAL.cobalt, plinth: '#c9654a', awning: ['#f2d27a', '#f4ecd8'] }, awning: { depth: 1.0 }, plinth: 0.5, glow: 0.6 });
    sign(s, { kind: 'hanging', text: 'LAUNDRY', sub: 'warm all night', emblem: 'drop', palette: ['#f4ecd8', PAL.cobalt, '#c9654a'] }, -50.4, 2.3, Z1 + 0.55, { face: 'X', double: true, w: 0.5, h: 0.5 });
    s.deco(() => { g.mat('cast', '#2f2c28'); g.tube([[-50.4, 2.62, Z1 + 0.1], [-50.4, 2.62, Z1 + 0.85]], 0.012, { segs: 6 }); });

    // ---------------- ceiling, trims ----------------
    ceilingWorks(s, X0 + 0.16, Z0 + 0.16, X1 - 0.16, Z1, H, { beam: '#efe4cc', beamMat: 'paint', every: 2.3, duct: '#b9b4aa', ductZ: Z0 + 0.5, pipe: '#c47a45', pipeZ: Z0 + 0.95, beamD: 0.18 });
    trims(s, X0, Z0, X1, Z1, { skip: 's', rail: 2.05, railTint: '#7a3b2e', band: PAL.cobalt, bandH: 0.18, H });
    s.deco(() => {
      // the water: a copper main along the back wall, a drop to every washer, a blue-lagged hot line from the loop
      g.mat('cast', '#c47a45', { rough: -0.2 }); g.tube([[X0 + 0.3, 1.55, Z0 + 0.25], [-55.0, 1.55, Z0 + 0.25]], 0.025, { segs: 8 });
      g.mat('felt', '#3a5f9f'); g.tube([[X0 + 0.3, 1.68, Z0 + 0.26], [-55.0, 1.68, Z0 + 0.26]], 0.04, { segs: 8 });
      g.mat('cast', '#c8a45a'); for (let x = X0 + 0.8; x < -55.2; x += 0.72) g.tube([[x, 1.68, Z0 + 0.26], [x + 0.03, 1.68, Z0 + 0.26]], 0.045, { segs: 8 });
      g.mat('cast', '#c47a45', { rough: -0.2 }); g.tube([[X0 + 0.25, 1.55, Z0 + 0.3], [X0 + 0.25, 1.55, -8.6]], 0.025, { segs: 8 });
    });

    // ---------------- the washers: a row along the back wall and another down the west wall ----------------
    const rw = rngFor('washers');
    for (let i = 0; i < 7; i++) {
      const x = X0 + 0.75 + i * 0.74;
      prop(s, 'civic.washer', x, 0, Z0 + 0.52, 0, { body: WASHERS[i % WASHERS.length], load: LOADS[(i * 3) % LOADS.length] });
      s.deco(() => { g.mat('cast', '#c47a45'); g.tube([[x + 0.22, 1.55, Z0 + 0.27], [x + 0.22, 0.88, Z0 + 0.27], [x + 0.22, 0.88, Z0 + 0.22]], 0.012, { segs: 5 }); });
      if (i % 2 === 0) s.spot('work', x, 0, Z0 + 1.35, Math.PI, { tags: ['wash', 'laundry'] });
    }
    for (let i = 0; i < 5; i++) {
      const z = Z0 + 1.55 + i * 0.74;
      prop(s, 'civic.washer', X0 + 0.52, 0, z, Math.PI / 2, { body: WASHERS[(i + 3) % WASHERS.length], load: LOADS[(i * 5 + 1) % LOADS.length] });
      if (i % 2 === 1) s.spot('work', X0 + 1.35, 0, z, -Math.PI / 2, { tags: ['wash', 'laundry'] });
    }
    // a shelf over the back row: soap in lidded crocks, a jar of pegs, a little radio-shaped thing that is a timer
    s.furniture(() => {
      g.mat('wood', PAL.pine); g.box(X0 + 0.3, 1.95, Z0 + 0.16, -55.6, 1.99, Z0 + 0.45, { bevel: 0.006 });
      g.mat('cast', '#3a3630'); for (let x = X0 + 0.6; x < -55.6; x += 1.2) g.box(x - 0.015, 1.85, Z0 + 0.16, x + 0.015, 1.95, Z0 + 0.4);
    });
    for (let i = 0; i < 6; i++) prop(s, 'crock', X0 + 0.7 + i * 0.8, 1.99, Z0 + 0.3, 0, { glaze: ['#2f5f9f', '#c9654a', '#e8e2d0', '#6c9a4c', '#e7b547', '#7a2a5a'][i], h: 0.22 + (i % 3) * 0.04, r: 0.08 });
    s.detail(() => { for (let i = 0; i < 4; i++) jar(g, -57.3 + i * 0.25, 1.99, Z0 + 0.3, 0.06, 0.16, '#dfeae6', '#f4ecd8', ['#e7b547', '#c9654a', '#9fd0b8', '#f4ecd8'][i]); });
    sign(s, { kind: 'label', text: 'SOAP · A SPOON A LOAD', sub: 'lids on · or it dries to a cake', ink: '#2a2622' }, -58.5, 2.12, Z0 + 0.17, { face: 'Z', w: 1.4, h: 0.12 });
    s.interact({ x: -58.5, y: 0.9, z: Z0 + 1.3, radius: 1.3, prompt: 'Look into a washer', onUse(gm) { say(gm, 'A washer', ['A round door, and behind it a little drum turning a load of someone\'s red shirts round and round, inside the big drum turning everybody round and round.', 'Somebody once painted "and so on" on the inside of one door, very small. The locals stopped noticing the joke a few centuries ago. Guests notice it every time.']); } });
    s.interact({ x: X0 + 1.2, y: 0.9, z: -10.0, radius: 1.3, prompt: (gm) => 'Wash your travelling clothes (' + priceNow(gm.clock ? gm.clock.hours : 12).toFixed(2) + ')', async onUse(gm) {
      const p = priceNow(gm.clock ? gm.clock.hours : 12);
      if (gm.wallet && !gm.wallet.spend(p, 'A load of washing')) { if (gm.audio) gm.audio.ui('deny'); await say(gm, 'The washer', ['The little panel blinks: not enough in your wallet. Somebody on the bench says the night price is kinder.']); return; }
      sfx(gm, 'clunk', f, X0 + 0.6, 0.5, -10.0);
      await say(gm, 'The washer', ['Your shirt, your other shirt, the socks from three drums ago. The round door clunks shut and the little drum starts to turn.', p <= 0.15 ? 'Night price. The machines have the drum to themselves at this hour, and so do you.' : 'Day price. Come back after eleven and it is cheaper; after one, cheaper still.']);
    } });

    // ---------------- the back wall's other end: the folder (an appliance), an ironing board, the blanket shelves, the clock ----------------
    s.furniture(() => {
      const x0 = -55.45, x1 = -54.15, z0 = Z0 + 0.18, z1 = Z0 + 0.8;
      g.mat('paint', '#efe6d2', { rough: -0.25 }); g.box(x0, 0.05, z0, x1, 1.12, z1, { bevel: 0.03, aoBottom: 0.6 });
      g.mat('paint', PAL.cobalt); g.box(x0 - 0.005, 0.86, z0, x1 + 0.005, 0.92, z1 + 0.005);
      g.mat('paint', '#3a3630'); g.box(x0 + 0.05, 0, z0 + 0.05, x1 - 0.05, 0.05, z1 - 0.05);
      g.mat('plain', '#1d1b18'); g.box(x0 + 0.15, 1.0, z1 - 0.02, x1 - 0.15, 1.05, z1 + 0.004);
      g.mat('diffuser', '#9fe8d8', { emissive: 1.6 }); g.box(x1 - 0.32, 0.7, z1, x1 - 0.12, 0.78, z1 + 0.006);
      g.mat('brushed', '#c9c4bb'); g.box(x0 + 0.1, 0.42, z1, x1 - 0.1, 0.45, z1 + 0.3, { bevel: 0.006 });
      // an ironing board and its iron
      g.mat('cast', '#3a3630'); g.tube([[-53.6, 0, -12.5], [-52.6, 0.86, -12.7]], 0.012, { segs: 5 }); g.tube([[-52.6, 0, -12.5], [-53.6, 0.86, -12.7]], 0.012, { segs: 5 });
      g.mat('stripe', '#2f5f9f'); g.box(-53.8, 0.86, -12.9, -52.4, 0.9, -12.5, { bevel: 0.03 });
      g.mat('paint', '#c9654a', { rough: -0.3 }); g.box(-52.85, 0.9, -12.78, -52.6, 0.98, -12.66, { bevel: 0.02 }); g.mat('wood', '#3a2a20'); g.box(-52.8, 0.98, -12.74, -52.65, 1.02, -12.7);
    });
    s.solid(-55.45, 0, Z0 + 0.18, -54.15, 1.12, Z0 + 0.8);
    prop(s, 'civic.folded', -54.8, 0.45, Z0 + 0.95, 0.05, { cols: ['#e8e2d0', '#9cc4e4', '#e8e2d0'], n: 5 }, { cast: false });
    sign(s, { kind: 'label', text: 'THE FOLDER', sub: 'shirts and sheets · it does not do socks', ink: '#2a2622' }, -54.8, 1.25, Z0 + 0.17, { face: 'Z', w: 1.2, h: 0.11 });
    s.interact({ x: -54.8, y: 1.0, z: Z0 + 1.4, radius: 1.1, prompt: 'Watch the folder', onUse(gm) { sfx(gm, 'clunk', f, -54.8, 0.9, Z0 + 0.6); say(gm, 'The folder', ['You feed it a sheet. It takes it in at the top with a soft hum and four seconds later lays it on the tray in a square you could build with.', 'It is an appliance, like a kettle. Nobody thanks it. A child once tried, and it did not answer, and that was the end of that.']); } });
    prop(s, 'shelving', -51.9, 0, Z0 + 0.34, 0, { w: 1.5, h: 2.0, shelves: 4, wood: PAL.pine });
    for (let k = 1; k < 4; k++) for (let j = 0; j < 3; j++) prop(s, 'civic.folded', -52.4 + j * 0.48, 0.08 + k * (2.0 - 0.11) / 4 + 0.025, Z0 + 0.36, 0, { cols: [DYED[(k * 3 + j) % DYED.length], '#e8e2d0', DYED[(k + j * 5) % DYED.length]], n: 3 + ((k + j) % 3) }, { cast: false });
    sign(s, { kind: 'label', text: 'BLANKETS ON LOAN', sub: 'for the Long Flight · back by Homecoming', ink: '#2a2622' }, -51.9, 2.12, Z0 + 0.17, { face: 'Z', w: 1.4, h: 0.11 });
    wallClock(s, game, -53.3, 2.45, Z0 + 0.16, 'Z', { r: 0.24, rim: PAL.cobalt });
    s.spot('work', -54.8, 0, Z0 + 1.35, Math.PI, { tags: ['fold', 'laundry'] });
    s.spot('work', -53.1, 0, -12.0, Math.PI, { tags: ['iron', 'laundry'] });

    // ---------------- folding tables, baskets with names, folded stacks ----------------
    for (const t of [[-57.2, -8.4], [-57.2, -10.6]]) {
      prop(s, 'table', t[0], 0, t[1], 0, { w: 2.6, d: 0.95, h: 0.86, wood: PAL.pine, legs: 'trestle' });
      s.spot('work', t[0] - 0.5, 0, t[1] + 0.85, Math.PI, { tags: ['fold', 'laundry'] });
      s.spot('work', t[0] + 0.6, 0, t[1] - 0.85, 0, { tags: ['fold', 'laundry'] });
    }
    const rb = rngFor('laundry-folds');
    for (let k = 0; k < 6; k++) {
      const x = -58.2 + (k % 3) * 0.95 + rb.f(-0.1, 0.1), z = (k < 3 ? -8.4 : -10.6) + rb.f(-0.2, 0.2);
      const cols = [DYED[rb.i(0, DYED.length - 1)], DYED[rb.i(0, DYED.length - 1)], DYED[rb.i(0, DYED.length - 1)], '#e8e2d0'];
      prop(s, 'civic.folded', x, 0.86, z, rb.f(-0.2, 0.2), { cols, n: 3 + (k % 3) });
    }
    const names = ['Quist', 'Halloran', 'Pip', 'Okafor', 'Brennan', 'Mbaye', 'Sato', 'Rautio', 'Lindqvist'];
    names.forEach((nm, i) => {
      const x = -58.6 + (i % 5) * 0.68 + rb.f(-0.05, 0.05), z = i < 5 ? -9.5 + rb.f(-0.06, 0.06) : -11.6;
      if (i >= 5 && x > -56.0) return;
      prop(s, 'civic.basket', x, 0, z, rb.f(-0.4, 0.4), { cane: shade('#c9a46a', rb.f(0.85, 1.1)), fill: DYED[(i * 5) % DYED.length], tag: ['#f4ecd8', '#f2d27a', '#9fd0b8', '#f0a48a'][i % 4] });
    });
    s.interact({ x: -57.2, y: 1.0, z: -9.5, radius: 1.5, prompt: 'Read the names on the baskets', onUse(gm) { say(gm, 'Baskets', ['Each basket has a name on a card tied to its handle: Quist, Halloran, Okafor, Brennan, Mbaye, Sato. One just says Pip, in a child\'s capitals, and is full of one sock.']); } });

    // ---------------- the drying racks on pulleys, hung with dyed clothes ----------------
    const rackClothes = (seed, n) => { const r = rngFor('rack' + seed), out = []; for (let i = 0; i < n; i++) out.push({ at: (i + 0.5) / n + r.f(-0.02, 0.02), w: r.f(0.38, 0.62), drop: r.f(0.32, 0.7), colour: DYED[r.i(0, DYED.length - 1)], mat: r.chance(0.25) ? 'stripe' : r.chance(0.2) ? 'motif' : 'weave', side: r.chance(0.5) ? 0.22 : -0.22, fold: r.chance(0.3) }); return out; };
    dryingRack(s, -59.6, -54.4, -8.4, 2.55, H, rackClothes(1, 9));
    dryingRack(s, -59.6, -54.4, -10.6, 2.6, H, rackClothes(2, 8));
    dryingRack(s, -59.8, -53.6, -12.4, 2.6, H, rackClothes(3, 9));
    s.deco(() => {
      // pulley cords run to cleats on the east wall
      g.mat('weave', '#e6dcc6'); for (const z of [-8.4, -10.6, -12.4]) g.tube([[-54.4, H - 0.12, z], [X1 - 0.2, H - 0.12, z], [X1 - 0.2, 1.3, z]], 0.005, { segs: 3, caps: false });
      g.mat('cast', '#3a3630'); for (const z of [-8.4, -10.6, -12.4]) { g.cyl(X1 - 0.2, H - 0.18, z, 0.04, 0.1, { segs: 8 }); g.box(X1 - 0.22, 1.24, z - 0.08, X1 - 0.17, 1.3, z + 0.08, { bevel: 0.01 }); }
    });
    // a child's trousers with a hand folded into every seam, on the first rack
    s.detail(() => { g.mat('weave', '#26306b', { sway: 0.3 }); g.sheet([-55.0, 2.55, -8.18], [-54.7, 2.55, -8.18], [-54.72, 2.0, -8.16], [-54.98, 2.0, -8.16], { nu: 3, nv: 3, ripple: 0.02 }); g.mat('weave', '#e7b547'); g.box(-55.0, 2.0, -8.175, -54.7, 2.06, -8.15); });
    s.interact({ x: -54.9, y: 1.7, z: -7.9, radius: 1.0, prompt: "Look at the child's trousers", onUse(gm) { say(gm, "A child's trousers", ['Dark blue, small, very clean. Turned out at the hem you can see the seam: a whole hand\'s width of cloth folded in and stitched down in yellow, so they can be let out.', 'The yellow stitches are new; the blue ones under them are not. These have been let out twice already.']); found(gm, 'growing-seam'); } });

    // ---------------- the price board, by the door ----------------
    sign(s, PRICES, X0 + 0.19, 1.6, -5.4, { face: 'X', w: 0.62, h: 0.9 });
    s.interact({ x: X0 + 0.9, y: 1.5, z: -5.4, radius: 1.2, prompt: 'Read the price board', onUse(gm) {
      const p = priceNow(gm.clock ? gm.clock.hours : 12);
      say(gm, 'A load', ['Lamp-noon, 0.24. Mornings and evenings, 0.20. After eleven, 0.15. One o\'clock till lamp-dawn, 0.12.', 'The machines want the night, so does your washing.', 'Right now a load is ' + p.toFixed(2) + '. Someone has drawn a little lamp turned low next to the night prices, and someone else a little lamp with a nightcap.']);
    } });

    // ---------------- the bench along the east wall, where people wait and talk ----------------
    prop(s, 'bench', X1 - 0.45, 0, -9.6, -Math.PI / 2, { w: 2.8, back: true, wood: PAL.pine, metal: PAL.cobalt }, { spot: { tags: ['waiting', 'chat', 'laundry'] } });
    s.detail(() => { const r = rngFor('lb-cush'); for (let i = 0; i < 3; i++) { g.mat('knit', ['#c9654a', '#9fd0b8', '#f2d27a'][i]); const z = -10.6 + i * 0.95 + r.f(-0.05, 0.05); g.box(X1 - 0.65, 0.46, z - 0.2, X1 - 0.27, 0.52, z + 0.2, { bevel: 0.03 }); } });
    seat(s, X1 - 0.5, 0, -9.6, -Math.PI / 2, 'Sit on the bench and wait');
    prop(s, 'cup', X1 - 0.38, 0.46, -11.2, 0, { glaze: '#2f5f9f', lid: '#f4ecd8' });
    s.spot('chat', X1 - 1.4, 0, -10.2, fy(1, 0.3), { tags: ['chat', 'laundry'] });
    s.spot('chat', X1 - 1.6, 0, -9.3, fy(1, -0.2), { tags: ['chat', 'laundry'] });
    // the odd socks
    s.furniture(() => { g.mat('wood', PAL.pine); g.box(X1 - 0.38, 1.4, -12.95, X1 - 0.16, 1.43, -11.75, { bevel: 0.006 }); g.box(X1 - 0.38, 1.75, -12.95, X1 - 0.16, 1.78, -11.75, { bevel: 0.006 }); });
    s.detail(() => {
      const r = rngFor('socks');
      for (const y of [1.43, 1.78]) for (let i = 0; i < 6; i++) {
        const z = -12.85 + i * 0.19 + r.f(-0.02, 0.02); g.mat(r.chance(0.4) ? 'stripe' : 'knit', DYED[r.i(0, DYED.length - 1)]);
        g.box(X1 - 0.35, y, z, X1 - 0.2, y + 0.05, z + 0.12, { bevel: 0.015 }); if (r.chance(0.5)) g.box(X1 - 0.35, y + 0.05, z + 0.02, X1 - 0.24, y + 0.09, z + 0.1, { bevel: 0.015 });
      }
    });
    sign(s, { kind: 'label', text: 'ODD SOCKS', sub: 'take one, leave one', ink: '#2a2622' }, X1 - 0.17, 1.95, -12.35, { face: 'x', w: 0.8, h: 0.12 });
    s.interact({ x: X1 - 0.9, y: 1.5, z: -12.35, radius: 1.0, prompt: 'Look at the odd socks', onUse(gm) { say(gm, 'Odd socks', ['Two shelves of single socks, every one mended at least once, sorted loosely by colour. A card says: take one, leave one.', 'You count four with the same yellow darn on the heel, done by the same hand. Somewhere in Candlewick a very patient person keeps losing socks.']); } });

    // ---------------- the mending corner, by the window ----------------
    prop(s, 'rug', -51.4, 0, -5.4, 0.1, { w: 1.8, d: 1.4, a: '#2f5f9f', b: '#f2d27a', mat: 'motif' });
    prop(s, 'civic.armchair', -51.0, 0, -5.6, fy(-0.7, 0.3), { cloth: '#c9654a', wood: '#5b3d27', mend: '#3fa7a3' }, { spot: { tags: ['mend', 'laundry'] } });
    seat(s, -51.0, 0, -5.6, fy(-0.7, 0.3), 'Sit in the mending chair');
    s.spot('work', -51.7, 0, -6.1, fy(0.6, -0.4), { tags: ['mend', 'laundry'] });
    prop(s, 'table', -52.0, 0, -6.6, 0.2, { round: true, w: 0.55, h: 0.6, wood: '#7a5233' });
    s.detail(() => {
      const r = rngFor('spools');
      for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, x = -52.0 + Math.cos(a) * 0.14, z = -6.6 + Math.sin(a) * 0.14; g.mat('wood', '#e8d9b0'); g.cyl(x, 0.6, z, 0.022, 0.05, { segs: 8 }); g.mat('weave', DYED[r.i(0, DYED.length - 1)]); g.cyl(x, 0.605, z, 0.026, 0.04, { segs: 8 }); }
      g.mat('cane', '#c9a46a'); g.lathe(-52.0, -6.6, [[0.06, 0.6], [0.09, 0.63], [0.085, 0.63]], { segs: 12 });
    });
    prop(s, 'civic.basket', -51.6, 0, -6.95, 0.3, { r: 0.18, h: 0.2, fill: '#7a2a5a', tag: '#f2d27a' });
    // a coat on a dress form, its mends shown in bright thread
    s.furniture(() => {
      g.mat('wood', '#3a2a20'); g.cyl(-50.65, 0, -6.95, 0.18, 0.03, { segs: 12 }); g.tube([[-50.65, 0.03, -6.95], [-50.65, 1.05, -6.95]], 0.015, { segs: 6 });
      g.mat('weave', '#33406e'); g.lathe(-50.65, -6.95, [[0.0, 0.85], [0.21, 0.88], [0.2, 1.15], [0.17, 1.35], [0.19, 1.5], [0.08, 1.58], [0.0, 1.6]], { segs: 14 });
      g.mat('weave', '#33406e'); for (const sx of [-1, 1]) g.tube([[-50.65 + sx * 0.18, 1.52, -6.95], [-50.65 + sx * 0.24, 1.1, -6.93]], 0.055, { segs: 8 });
      g.mat('weave', '#e7b547'); g.box(-50.75, 1.2, -6.76, -50.55, 1.26, -6.74); g.box(-50.73, 1.3, -6.765, -50.6, 1.33, -6.745);
      g.mat('weave', '#3fa7a3'); g.box(-50.86, 1.0, -6.88, -50.84, 1.18, -6.78);
      g.mat('weave', '#c9654a'); g.box(-50.53, 1.36, -6.78, -50.45, 1.45, -6.75);
    });
    s.post(-50.65, -6.95, 0.22, 0, 1.6);
    s.furniture(() => {
      g.mat('cast', '#3a3630'); g.cyl(-51.85, 0, -4.55, 0.13, 0.03, { segs: 12 }); g.tube([[-51.85, 0.03, -4.55], [-51.85, 1.3, -4.55], [-51.55, 1.55, -4.85]], 0.012, { segs: 6 });
      g.mat('cast', '#2f5f9f'); g.lathe(-51.55, -4.85, [[0.12, 1.42], [0.09, 1.52], [0.03, 1.58]], { segs: 12, capBottom: false });
      g.mat('diffuser', '#ffe2b0', { emissive: 4, lamp: true }); g.ball(-51.55, 1.47, -4.85, 0.04, 0.03, 0.04, { segs: 8, rings: 4 });
    });
    lamp(s, 'bulb', -51.55, 1.4, -4.9, { K: 2700, power: 0.45, range: 3, clip });
    s.interact({ x: -51.0, y: 1.2, z: -6.6, radius: 1.2, prompt: 'Look at the mending', onUse(gm) { say(gm, 'The mending corner', ['A navy coat on a dress form, mid-repair. The elbow is patched in yellow cross-stitch, a pocket rehung in teal, the collar turned and stitched in red, and none of it hidden.', 'Pinned to the sleeve, a card: "Three owners. The yellow is mine. Leave the others alone." New cloth is new mass at about 25 kWh a kilogram; a mend is somebody\'s evening.']); found(gm, 'shown-mend'); } });

    // ---------------- notices, plants, a sink ----------------
    sign(s, { kind: 'notice', title: 'Lamp-night', lines: ['The door is open all night.', 'Lamps fade at eleven:', 'the washers do not.', 'Elders who sleep in pieces', 'are welcome to the bench.'], paper: '#f4ecd8' }, X0 + 0.19, 1.6, -6.35, { face: 'X', w: 0.3, h: 0.42, board: false });
    sign(s, { kind: 'notice', title: 'Found', lines: ['One wing-sleeve, left,', 'blue, size four.', 'Hung behind the door.'], hand: true, paper: '#e8f0e0' }, X1 - 0.17, 1.6, -7.5, { face: 'x', w: 0.26, h: 0.32, board: false });
    s.structure(() => { g.mat('glaze', '#f4ecd8'); g.box(X1 - 0.75, 0.8, -13.25, X1 - 0.2, 0.95, -12.75, { bevel: 0.03 }); g.mat('glaze', '#e8e2d0'); g.box(X1 - 0.7, 0, -13.2, X1 - 0.25, 0.8, -12.8); g.mat('cast', '#c47a45'); g.tube([[X1 - 0.47, 1.25, Z0 + 0.18], [X1 - 0.47, 1.25, -13.05], [X1 - 0.47, 1.12, -13.05]], 0.012, { segs: 6 }); });
    s.solid(X1 - 0.75, 0, -13.25, X1 - 0.2, 0.95, -12.75);
    prop(s, 'plant', -55.3, 0, -4.55, 0.5, { kind: 'broad', size: 1.3, pot: PAL.cobalt, seed: 31 });
    prop(s, 'plant', X0 + 0.5, 0, -7.2, 1.2, { kind: 'fern', size: 1.0, pot: '#c9654a', seed: 32 });
    prop(s, 'plant', -54.9, 1.99, Z0 + 0.3, 0.2, { kind: 'fine', size: 0.5, pot: '#f2d27a', seed: 33 });

    // ---------------- light: bright and warm ----------------
    for (const l of [[-58.6, -6.5], [-55.0, -9.5], [-58.6, -12.0], [-53.0, -12.0]]) lamp(s, 'panel', l[0], H - 0.04, l[1], { w: 1.2, d: 0.6, K: 3200, power: 0.75, clip, range: 7 });
    lamp(s, 'globe', -57.2, 2.25, -9.5, { K: 3000, power: 0.5, clip, drop: 0.9, r: 0.16 });

    // ---------------- sound, zone, paths ----------------
    { let on = false; s.world.dynamics.push({ scope: s, update() { if (on || !game.audio || !game.loopAt) return; on = true; game.loopAt('tide', f, -58.0, 0.6, Z0 + 0.6, { vol: 0.12, radius: 7 }); } }); }
    s.zoneBox({ id: 'laundry', place: 'laundry', box: [X0, -0.5, Z0, X1, H, Z1], name: 'The Round Doors', sub: 'laundry · Ladle Row', ambience: 'shop', reverb: 'tile' });
    s.path([[-59.95, -2.9], [-59.95, -5.2], [-58.6, -7.2], [-55.4, -7.3], [-52.6, -8.3]]);
    s.path([[-55.4, -7.3], [-55.3, -9.5], [-55.5, -11.7], [-58.4, -12.4]], { width: 1.2 });
    s.path([[-58.6, -7.2], [-60.2, -9.4], [-59.6, -11.6], [-58.4, -12.4]], { width: 1.1 });
    s.path([[-55.4, -7.3], [-52.4, -6.4]], { width: 1.1 });
    s.path([[-52.6, -8.3], [-51.5, -10.6], [-51.4, -12.2]], { width: 1.1 });
    s.finish();
    game.spawns.laundry = { frame: f, x: -59.95, y: 0, z: -2.4, yaw: 0 };
  },
};
