// The Warming Shelf: tier one of the front wall, fifty metres above the Hollow's floor, 0.48 g. Chervil watches its dawns
// from the back terraces and its dusks from here: the line goes down from the back end first, so the last of the light
// comes down the Hollow and stops on this wall. A long stone shelf with a broad rail; the front wood below and the whole
// length of the Hollow beyond; the Dusk Steps facing down the drum; the shelf flats in the riser behind (the oldest
// people's doors, each with a chair and pots); the Last Pot, a stall that sells one hot drink; a telescope on a post; the
// dusk book; the guests' bench; the cab lobby and the wall lift up to the Third.
import { lamp, block, stairs } from '../world/kit.js';
import { planter } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { Rng } from '../core/util.js';
import { PI, ENV, SKY, runX, toast, find, sfx, say, readSpec, buy, seat, hours, dayOf, sunOf, bentFloor, riser, broadRail, endPier, cabLobby, wallLift, magnets, tide, duskShare } from './lm_front_wall_parts.js';

export const shelfParts = true;

const POT = { title: 'The Last Pot', note: 'One thing, hot, from four till the lamps go down. Lid on.', items: [
  { id: 'dusk-cup', name: 'Dusk cup, lidded', desc: 'Vat milk warmed on the loop with cardamom and a little Mill sugar.', price: 0.12 },
] };
const POT_SAYS = [
  ['Lid on. In this air it goes cold in the time it takes to watch the lake go out.'],
  ['One thing. I have made one thing for thirty years and I am not tired of it yet.'],
  ['The cardamom is from the Garden. A pinch is three hundredths of a kay, so I do not count it.'],
  ['Cups back to the stall, or to any cart in the drum. They all come home in the end.'],
];
const KNOCK = [
  ['A card in the fanlight: Gone to sit on the steps. Back when the lamps go down.'],
  ['A voice through the door, in no hurry: We have eaten, and we have slept, and we have seen a dusk before. Go and see this one.'],
  ['A note pinned at eye height: Drawn for this door at a hundred and two. Still here at a hundred and nine. Knock louder.'],
  ['The door opens a hand. A very old woman looks past you at the Hollow, says the light is going the right way tonight, and shuts the door.'],
  ['Somebody inside is reading a long letter aloud to somebody else, slowly, and stops to say: wait, read that part again.'],
  ['A brass plate under the knocker: Knock, then wait. At this weight it takes me a while to come, but I come.'],
  ['Nobody answers. On the step, a lidded cup gone cold and a pair of slippers mended at both heels in bright red thread.'],
  ['A voice: If you are the Margin office, the answer is still no. If you are anyone else, come back after the dusk.'],
];
const PLATES = ['please knock', 'knock and wait', 'mind the pots', 'after the dusk', 'please knock', 'knock twice', 'no callers before four', 'please knock', 'mind the step'];

export function buildShelf(game) {
  const W = game.world;
  const f = W.frame('fwall1', 1450, 0, 0); f.hollowView = true;
  const s = W.scope('fw-shelf', f), g = s.g;
  const X0 = -48, X1 = 48, ZR = 13, H = 12.6;
  const clip = [X0 - 0.5, -2, -0.8, X1 + 0.5, H + 1, ZR + 1.6];
  const r = new Rng(1450);
  const ST = '#c6b59a', OAK = '#8a6240';

  // ---- the shelf: floor, paving bands, the rail, the piers
  bentFloor(s, X0, 0, X1, ZR, 0, 'stone', ST, 8);
  runX(X0 + 0.8, X1 - 0.8, 8, (a, b) => { g.mat('stone', '#a6967c'); g.box(a, 0, ZR - 0.5, b, 0.006, ZR, { faces: 'Y' }); g.box(a, 0, 0.9, b, 0.006, 1.2, { faces: 'Y' }); g.mat('stone', '#d0c0a4'); g.box(a, 0, ZR - 1.4, b, 0.004, ZR - 0.5, { faces: 'Y' }); });
  s.flush({ tier: 's', cast: false });
  broadRail(s, { x0: X0 + 0.8, x1: X1 - 0.8, zr: ZR, stone: '#bba98c', bronze: '#5a4a33', oak: OAK, barrier: 4.5 });
  endPier(s, X0, X0 + 0.8, ZR, H, { inner: 1, tint: '#d8c2a6' }); endPier(s, X1 - 0.8, X1, ZR, H, { inner: -1, tint: '#d8c2a6' });

  // ---- the riser: the shelf flats, nine doors, lit windows, a chair and pots at every step
  const fac = riser(s, { x0: X0 + 0.8, x1: X1 - 0.8, h: H, tint: '#dcc6a6', stone: '#b4a48a', trim: '#5b4060', gaps: [[28.6, 33.4], [35.8, 43.2]], doors: [-41, -35.5, -30, -19, -8, -3, 13.5, 19, 24.5], seed: 1, lit: 0.5 });
  const CHAIRS = [['#7a2f3c', '#d6a640'], ['#2f5d5a', null], ['#5b4060', '#e2c48a'], ['#8a5a2a', '#2f6f73'], ['#3a4a6a', null], ['#6b3a3a', '#c9763e'], ['#4a5a3a', '#e8b45a'], ['#7a2a5a', null], ['#2f6f73', '#d98a7a']];
  fac.doors.forEach((d, i) => {
    sign(s, { kind: 'plate', text: 'Warming Shelf · ' + (i * 2 + 1), sub: PLATES[i % PLATES.length] }, d.x + 0.95, 1.5, 0.17, { face: 'Z' });
    lamp(s, 'sconce', d.x - 0.95, 2.45, 0.17, { face: 'Z', K: 2500, power: 0.55, night: true, clip });
    const c = CHAIRS[i % CHAIRS.length];
    prop(s, 'fw.armchair', d.x - 1.45, 0, 0.78, 0.25 - (i % 3) * 0.12, { cloth: c[0], throw: c[1] || undefined });
    prop(s, 'plant', d.x + 1.05, 0, 0.55, 0, { kind: ['fern', 'flower', 'broad'][i % 3], size: 0.9, pot: ['#a3563a', '#2f6f73', '#c9a24a'][i % 3] });
    if (i % 2 === 0) prop(s, 'plant', d.x + 1.5, 0, 0.42, 0, { kind: 'flower', size: 0.55, pot: '#7a2f3c' });
    if (i % 3 === 1) prop(s, 'cup', d.x - 0.85, 0, 0.9, 0, { glaze: '#e9e1cf' });
    s.interact({ x: d.x, y: 1.2, z: 0.6, radius: 1.2, prompt: 'Knock', onUse: async (gm) => {
      sfx(gm, 'knock', f, d.x, 1.2, 0.2);
      await say(gm, 'The door', KNOCK[i % KNOCK.length]);
    } });
  });
  for (const x of [-44.8, -24.6, -13.6, 7.6, 16.4, 27.2]) planter(s, x, 0, 0.55, { w: 1.6, d: 0.5, h: 0.5, plants: x > 0 ? 'flower' : 'broad', tint: '#a89a84' });

  // ---- the tier plate on the parapet, and the rail to lean on
  sign(s, { kind: 'plate', text: 'TIER ONE · 0.48 g', sub: 'fifty metres above the floor · twenty-nine to go' }, 0, 0.82, ZR - 0.005, { face: 'z', w: 0.5, h: 0.2 });
  s.interact({ x: 0, y: 1.0, z: ZR - 0.5, radius: 1.3, prompt: 'Read the tier plate', onUse: async (gm) => {
    await say(gm, 'Tier one', ['A brass plate on the parapet: tier one, 0.48 g, fifty metres above the floor, twenty-nine tiers to go.', 'Every tier up the wall is fifty metres nearer the axis, and you weigh a little less on each. Seventy kilos at the rim is thirty-four here. The Third, tier ten, is at a third of a g.']);
    find(gm, 'terraces-lighter');
  } });
  for (const lx of [-23.5, 6.5]) s.interact({ x: lx, y: 1.2, z: ZR - 0.35, radius: 1.4, prompt: 'Lean on the rail', onUse: async (gm) => { await say(gm, 'The rail', railLines(gm)); } });

  // ---- the quiet plaque on the anti pier's garden wall
  const quiet = { kind: 'notice', title: 'The quiet wall', lines: ['The drum\'s power comes in', 'at this end, through one joint', 'in the front cap: about 160', 'gigawatts, without a sound.', 'The heat goes out at the', 'back, loudly. So the back wall', 'is the busy one, and this is', 'where you can hear a lid lifted.'] };
  sign(s, quiet, X0 + 0.8 + 0.005, 1.55, 6.2, { face: 'X', w: 0.46, h: 0.62 });
  s.interact({ x: X0 + 1.5, y: 1.3, z: 6.2, radius: 1.3, prompt: 'Read the plaque', onUse: async (gm) => { await readSpec(gm, quiet, 'Under it, smaller: Thirty tiers. The oldest live in the risers, by draw.'); find(gm, 'quiet-wall'); } });
  // the corner by the plaque: two deep chairs facing down the drum, a small table, a lamp
  prop(s, 'rug', -44.3, 0, 8.4, 0, { w: 4.2, d: 3.0, a: '#5b4060', b: '#d6a640' });
  for (const c of [[-45.4, 8.6, 0.25, '#2f5d5a', '#e8b45a'], [-43.2, 8.8, -0.2, '#7a2f3c', null]]) {
    prop(s, 'fw.armchair', c[0], 0, c[1], c[2], { cloth: c[3], throw: c[4] || undefined });
    seat(s, c[0], 0, c[1], c[2], 'Sit in a deep chair', { eye: 1.05, radius: 0.9 });
  }
  prop(s, 'table', -44.3, 0, 7.6, 0, { round: true, w: 0.55, h: 0.52, wood: '#4a3020' });
  prop(s, 'cup', -44.42, 0.52, 7.55, 0, { glaze: '#c9763e' }); prop(s, 'bowl', -44.18, 0.52, 7.7, 0, { glaze: '#2f6f73', lid: '#d6a640', r: 0.06 });
  lamp(s, 'lantern', -44.3, 2.4, 9.6, { tint: '#d98a5a', drop: 0.4, power: 0.6, clip, night: true, lampFlag: false });
  g.mat('cast', '#3a3430'); g.tube([[-44.3, 0, 10.1], [-44.3, 2.75, 10.1], [-44.3, 2.75, 9.6]], 0.03, { segs: 6 }); s.flush({ tier: 'd' }); s.post(-44.3, 10.1, 0.05, 0, 2.8);

  // ---- the Dusk Steps: three rows of benches facing down the drum, like a small theatre
  const TX0 = -16, TX1 = 12;
  block(s, TX0, 0, 5.7, TX1, 0.38, 8.9, 'stone', '#b8a88c');
  block(s, TX0, 0.38, 5.7, TX1, 0.76, 7.3, 'stone', '#bfaf93');
  const AISLES = [-6.5, 3.5];
  const segs = [[TX0, AISLES[0] - 0.7], [AISLES[0] + 0.7, AISLES[1] - 0.7], [AISLES[1] + 0.7, TX1]];
  for (const sg of segs) {
    block(s, sg[0], 0, 5.1, sg[1], 1.22, 5.7, 'stone', '#a89a84', { bevel: 0.02 });
    planter(s, (sg[0] + sg[1]) / 2, 1.22, 5.4, { w: sg[1] - sg[0] - 0.1, d: 0.5, h: 0.04, plants: 'herbs', tint: '#a89a84', density: 9 });
  }
  for (const ax of AISLES) stairs(s, ax, 0, 5.1, 'Z', 0.76, 0.6, 1.4, { tint: '#bfaf93' });
  runX(TX0 + 0.2, TX1 - 0.2, 4, (a, b) => { g.mat('diffuser', '#ffcf8a', { emissive: 2.2, night: true }); g.box(a, 0.24, 8.9, b, 0.27, 8.92, { faces: 'Z' }); g.box(a, 0.62, 7.3, b, 0.65, 7.32, { faces: 'Z' }); });
  s.flush({ tier: 'd', cast: false });
  const benchRows = [[9.65, 0], [8.05, 0.38], [6.45, 0.76]];
  const CUSH = ['#5b4060', '#d98a3a', '#b8584a', '#2f6f73', '#d6a640', '#7a2f3c', '#3a5a7a'];
  benchRows.forEach((row, ri) => {
    for (const sg of segs) {
      const n = 3, w = (sg[1] - sg[0] - 0.3) / n;
      for (let i = 0; i < n; i++) {
        const cx = sg[0] + 0.15 + w * (i + 0.5);
        prop(s, 'fw.bench', cx, row[1], row[0], 0, { w: w - 0.2, wood: OAK });
        s.detail(() => { for (let k = 0; k < 3; k++) { if (r.chance(0.35)) continue; const x = cx - w / 2 + 0.5 + k * (w - 1) / 2; g.mat(r.chance(0.5) ? 'knit' : 'motif', CUSH[r.i(0, CUSH.length - 1)]); g.box(x - 0.24, row[1] + 0.44, row[0] - 0.18, x + 0.24, row[1] + 0.5, row[0] + 0.2, { bevel: 0.025 }); } });
        if (i === 1) seat(s, cx, row[1], row[0] + 0.05, 0, ri === 0 ? 'Sit on the Dusk Steps' : 'Sit up here', { radius: 1.3, onSit: stepSit });
      }
    }
  });
  s.detail(() => { for (const p of [[-15.2, 9.65, 0], [1.1, 8.05, 0.38], [11.1, 6.45, 0.76], [-7.6, 9.65, 0]]) { g.mat('knit', CUSH[r.i(0, 6)]); g.box(p[0] - 0.22, p[2] + 0.44, p[1] - 0.16, p[0] + 0.22, p[2] + 0.56, p[1] + 0.18, { bevel: 0.03 }); } });
  for (const p of [[-12.2, 9.55, 0], [6.9, 7.95, 0.38], [-2.1, 6.4, 0.76], [9.8, 9.6, 0]]) prop(s, 'cup', p[0], p[2] + 0.44, p[1], 0, { glaze: ['#e9e1cf', '#c9763e', '#2f6f73'][Math.abs(Math.round(p[0])) % 3] });
  sign(s, { kind: 'plate', text: 'THE DUSK STEPS', sub: 'sit anywhere · facing down the drum' }, TX0 - 0.005, 0.6, 7.3, { face: 'x', w: 0.6, h: 0.2 });

  // ---- the Last Pot: one hot drink, its keeper's post, a short queue, standing tables, its board
  const CX = -27.5, CZ = 5.0;
  prop(s, 'fw.potstall', CX, 0, CZ, 0, { body: '#5b4060', trim: '#d6a640' });
  prop(s, 'crate', CX - 0.5, 0, 3.1, 0.15, { w: 0.6, h: 0.4, d: 0.4 }); prop(s, 'crate', CX - 0.45, 0.4, 3.05, -0.1, { w: 0.5, h: 0.32, d: 0.36, wood: '#9a7a4e' });
  prop(s, 'stool', CX + 1.25, 0, 3.6, 0, { h: 0.62 });
  prop(s, 'crock', CX - 1.4, 0, 3.5, 0, { glaze: '#2f6f73', h: 0.42, r: 0.15 });
  g.mat('cast', '#3a3430'); g.tube([[CX + 1.1, 2.35, CZ - 0.45], [CX + 1.78, 2.35, CZ - 0.45]], 0.015, { segs: 5 }); for (const dx of [1.34, 1.7]) g.tube([[CX + dx, 2.35, CZ - 0.45], [CX + dx, 2.08, CZ - 0.45]], 0.004, { segs: 3 }); s.flush({ tier: 'd' });
  sign(s, { kind: 'hanging', text: 'THE LAST POT', sub: 'one thing, hot', emblem: 'cup', palette: ['#5b4060', '#e8b45a'] }, CX + 1.52, 1.8, CZ - 0.45, { face: 'z', double: true, w: 0.56, h: 0.56 });
  lamp(s, 'lantern', CX - 0.6, 1.76, CZ + 0.55, { tint: '#f2b56b', drop: 0.22, power: 0.7, clip, night: true, lampFlag: false });
  lamp(s, 'bulb', CX + 0.3, 1.9, CZ + 0.4, { K: 2400, power: 0.6, range: 5, clip, lampFlag: false, night: true });
  s.spot('counter', CX - 0.2, 0, CZ - 1.05, 0, { tags: ['serve', 'keeper', 'evening'] });
  for (let i = 0; i < 4; i++) s.spot('queue', CX - 0.2 - i * 0.95, 0, CZ + 1.55 + (i > 1 ? 0.25 : 0), i === 0 ? PI : PI / 2 + 0.3, { tags: ['drink', 'evening'] });
  // the board on an easel
  g.mat('wood', '#6b4a2f'); g.tube([[CX + 2.45, 0, CZ + 0.95], [CX + 2.45, 1.55, CZ + 1.15]], 0.018, { segs: 5 }); g.tube([[CX + 3.0, 0, CZ + 0.95], [CX + 3.0, 1.55, CZ + 1.15]], 0.018, { segs: 5 }); g.tube([[CX + 2.72, 0, CZ + 0.4], [CX + 2.72, 1.5, CZ + 1.12]], 0.016, { segs: 5 }); s.flush({ tier: 'd' });
  const board = { kind: 'chalk', title: 'The Last Pot', lines: ['ONE THING, HOT', 'vat milk, cardamom,', 'a little Mill sugar', 'lidded · 0.12', 'four till the lamps', 'cups back, please'] };
  sign(s, board, CX + 2.72, 1.08, CZ + 1.18, { face: 'Z', w: 0.62, h: 0.9 });
  s.solid(CX + 2.35, 0, CZ + 0.85, CX + 3.1, 1.5, CZ + 1.2);
  s.interact({ x: CX + 2.72, y: 1.1, z: CZ + 1.7, radius: 1.1, prompt: 'Read the board', onUse: (gm) => readSpec(gm, board, 'Chalked in the corner: no second thing, so do not ask.') });
  s.interact({ x: CX, y: 1.1, z: CZ + 1.3, radius: 1.5, prompt: (gm) => { const h = hours(gm); return h >= 15.5 && h < 23 ? 'Buy a dusk cup' : 'Look at the Last Pot'; }, onUse: async (gm) => {
    const h = hours(gm);
    if (h < 15.5 || h >= 23) { await say(gm, 'Ottilie, at the pot', h >= 23 || h < 5 ? ['Shut. The lamps are down and so is the pot. Come back at four tomorrow.'] : ['Shut till four. Nobody comes up here at noon but the people who live here, and they have their own pots.', 'Come back for the dusk. Everybody does.']); return; }
    const it = await buy(gm, POT, 'Ottilie, at the pot');
    if (!it) return;
    sfx(gm, 'pour', f, CX - 0.45, 1.2, CZ - 0.12);
    if (gm.inv && gm.inv.give && !gm.inv.has('lidded-cup')) gm.inv.give('lidded-cup');
    await say(gm, 'Ottilie', POT_SAYS[Math.floor(Math.random() * POT_SAYS.length)]);
  } });
  for (const p of [[-33.2, 9.4], [-24.0, 10.2], [-20.6, 7.6]]) {
    prop(s, 'table', p[0], 0, p[1], 0, { round: true, w: 0.7, h: 1.05, wood: '#4a3a2a', top: '#7a5233' });
    prop(s, 'cup', p[0] + 0.12, 1.05, p[1] - 0.05, 0, { glaze: '#c9763e' }); prop(s, 'cup', p[0] - 0.1, 1.05, p[1] + 0.08, 0, { glaze: '#e9e1cf' });
    for (let k = 0; k < 3; k++) { const a = k * 2.1 + 0.4; s.spot('chat', p[0] + Math.sin(a) * 0.75, 0, p[1] + Math.cos(a) * 0.75, a + PI, { tags: ['watch', 'drink', 'evening'] }); }
  }

  // ---- the dusk book on its lectern
  const LX = -18.4, LZ = 3.9;
  prop(s, 'fw.lectern', LX, 0, LZ, 0, {});
  s.light({ at: [LX + 0.24, 1.42, LZ - 0.02], K: 2600, color: [1, 0.78, 0.5], power: 0.35, range: 2.6, night: true, clip, radius: 0.05 });
  s.interact({ x: LX, y: 1.1, z: LZ + 0.75, radius: 1.1, prompt: 'Read the dusk book', onUse: async (gm) => { await say(gm, 'The dusk book', duskBook(gm)); } });

  // ---- the telescope at the rail, and the dusk in the paving beside it
  const TPX = 20.5;
  prop(s, 'fw.telescope', TPX, 0, ZR - 0.95, 0, {});
  sign(s, { kind: 'label', text: 'FREE', sub: 'steady it with two hands' }, TPX + 0.24, 1.0, ZR - 0.92, { face: 'z', w: 0.24, h: 0.1 });
  s.interact({ x: TPX, y: 1.35, z: ZR - 1.75, radius: 1.2, prompt: 'Look through the telescope', onUse: async (gm) => { sfx(gm, 'clunk', f, TPX, 1.3, ZR - 1.2); await say(gm, 'The telescope', teleLines(gm)); } });
  s.structure(() => {
    const RINGS = [[2.2, '#2a3260'], [1.8, '#4a3a62'], [1.4, '#7a3a5a'], [1.0, '#b8584a'], [0.6, '#d98a3a'], [0.25, '#e8b45a']];
    RINGS.forEach((rg, k) => { g.mat('mosaic', rg[1]); g.lathe(24.6, 7.4, [[rg[0], 0.003 + k * 0.0012], [0, 0.0032 + k * 0.0012]], { segs: 32, capTop: false, capBottom: false }); });
    g.mat('cast', '#b08a45'); const ring = []; for (let i = 0; i < 40; i++) { const a = i / 40 * PI * 2; ring.push([24.6 + Math.cos(a) * 2.24, 0.006, 7.4 + Math.sin(a) * 2.24]); } g.tube(ring, 0.02, { segs: 4, closed: true });
  });

  // ---- the guests' bench by the lobby
  const GBX = 37.4;
  prop(s, 'fw.bench', GBX, 0, ZR - 1.45, 0, { w: 3.4, wood: '#9a6a3e' });
  sign(s, { kind: 'plate', text: "GUESTS' BENCH", sub: 'no draw · sit at dusk' }, GBX, 0.7, ZR - 1.45 - 0.34, { face: 'z', w: 0.42, h: 0.15 });
  seat(s, GBX, 0, ZR - 1.4, 0, "Sit on the guests' bench", { radius: 1.3, onSit: guestSit });

  // ---- benches at the rail, the lobby, the lift
  for (const x of [-40.5, 15.6, 28.6]) prop(s, 'fw.bench', x, 0, ZR - 1.5, 0, { w: 2.8, wood: OAK });
  cabLobby(game, s, { x0: 36.2, x1: 42.6, d: 3.6, clip, id: 'front-shelf', sign: { kind: 'street', text: 'CABS · TIER ONE', sub: 'the front wall' } });
  wallLift(game, s, { x: 31.0, clip, label: 'WALL LIFT · UP', sub: 'the Third · tier ten', prompt: 'Take the wall lift up to the Third',
    to: { frame: 'fwall10', x: -22.6, y: 0, z: 2.2, yaw: PI }, banner: ['The front Third', 'tier ten · a third of a g'], secs: 'Four hundred and fifty metres up the wall in about twenty seconds. You weigh less with every floor.' });

  // ---- lamps for the dark hours: low bollards along the rail
  for (let x = -42; x <= 42; x += 8.4) {
    prop(s, 'fw.bollard', x, 0, ZR - 0.4, 0, {});
    s.light({ at: [x, 0.66, ZR - 0.55], K: 2400, color: [1.0, 0.62, 0.32], power: 0.9, range: 4.2, night: true, clip, radius: 0.08 });
  }

  // ---- people and walkways
  for (let x = -38; x <= 34; x += 2.2) if (Math.abs(x - TPX) > 1.2 && Math.abs(x) > 0.8) s.spot('stand', x + r.f(-0.3, 0.3), 0, ZR - 0.55, 0, { tags: ['rail', 'watch', 'evening'] });
  for (const c of [[-19.6, 11.2], [13.8, 9.4], [-10.5, 11.6], [9.2, 11.4], [30.6, 8.6]]) for (let k = 0; k < 3; k++) { const a = k * 2.09; s.spot('chat', c[0] + Math.sin(a) * 0.65, 0, c[1] + Math.cos(a) * 0.65, a + PI, { tags: ['watch', 'evening'] }); }
  s.path([[44, 3.2], [36, 4.6], [28, 3.2], [16, 3.4], [3.5, 3.6], [-6.5, 3.6], [-16, 3.4], [-24, 2.9], [-36, 3.0], [-46, 3.2]]);
  s.path([[-46, 11.6], [-36, 11.5], [-20, 11.4], [0, 11.3], [20, 11.4], [34, 11.5], [46, 11.6]]);
  s.path([[44, 3.2], [46, 7], [46, 11.6]]); s.path([[-46, 3.2], [-46.5, 7], [-46, 11.6]]);
  s.path([[3.5, 3.6], [3.5, 5.3], [3.5, 6.4]]); s.path([[-6.5, 3.6], [-6.5, 5.3], [-6.5, 6.4]]);
  s.path([[-16, 3.4], [-17.5, 7.5], [-20, 11.4]]); s.path([[16, 3.4], [16.5, 7.5], [20, 11.4]]);
  s.path([[-24, 2.9], [-24.5, 6.8], [-24, 11.4]]); s.path([[28, 3.2], [30.5, 7.5], [34, 11.5]]);

  // ---- zones, sound, the crowd at dusk, the spawn
  s.zoneBox(Object.assign({ id: 'front-shelf', place: 'front-wall', box: [X0, -2, -1, X1, H + 2, ZR + 1.5], name: 'The Warming Shelf', sub: 'The front wall · tier one', ambience: 'terrace', headroom: 30, env: ENV }, SKY));
  s.loop('murmur', -4, 1.2, 8, { vol: 0.22, radius: 22, param: 0.25 });
  s.loop('steam', CX - 0.45, 1.4, CZ - 0.12, { vol: 0.12, radius: 4 });
  s.trigger({ box: [X0, -1, 0, X1, 4, ZR], onEnter(gm) { if (gm.flags['fw.shelfseen']) return; gm.flags['fw.shelfseen'] = true; toast(gm, 'Quieter than the back wall. You can hear a lid lifted forty metres away.'); } });
  magnets(game, s, [1, 2, 3, 4].map((d) => ({ day: d, from: d === 3 ? 17.2 : 16.8, to: d === 3 ? 21.4 : 21.6, place: 'front-wall', k: 0.7 })));
  tide(game, s, f, 'front-wall', duskShare);
  s.finish();
  game.spawns['front-shelf'] = { frame: f, x: 39.4, y: 0, z: 5.6, yaw: -2.4 };
}

async function stepSit(gm) {
  if (gm.flags['fw.stepsit']) return; gm.flags['fw.stepsit'] = true;
  toast(gm, 'The stone is still warm from the line. Everybody on the steps is facing the same way.');
}
async function guestSit(gm) {
  if (gm.flags['fw.guestsit']) { toast(gm, 'The guests\' bench. Nobody will ask you to move.'); return; }
  gm.flags['fw.guestsit'] = true;
  toast(gm, 'Terrace seats here go by draw, like the flats behind you. This bench never has: a guest from any drum may sit on it at dusk without a turn.');
}

// What the rail shows, by the hour.
function railLines(gm) {
  const h = hours(gm), sun = sunOf(gm);
  if (h >= 23 || h < 5) return ['The Hollow at lamp-night: small lamps on the paths, going on up both sides and over your head, where a window on the far bank is looking back at you.', 'Fifty metres down, the front wood is dark. It smells of wet fern.'];
  if (h >= 15 && h < 18.6 && sun > 0.02) return ['The line is going down from the far end toward you. The back wall goes into its lamps first, then the lake, then the orchards, and the last of the light lies on the front wood for a few minutes before it goes.', 'Nobody on the shelf says much while it does.'];
  if (sun < 0.05) return ['Lamps everywhere now, rising up the curve and closing over your head. Somewhere on the back wall the Third is dancing. In heliox the band reaches you about six seconds late, from nearly four kilometres off.'];
  return ['Fifty metres down, the tops of the front wood, in the dim end where the line\'s light falls away. Beyond it the orchards, the lake shining a long way off, and the land curving up on both sides until it is over your head.', 'The sunline starts 450 metres out from this wall and 1,450 metres up, and runs away for nearly three kilometres. From here you see its end, hanging in the air like a lamp on a wire.'];
}

// What the telescope shows, by the hour.
function teleLines(gm) {
  const h = hours(gm), d = dayOf(gm), sun = sunOf(gm);
  if ((d === 3 && h >= 21.8) || (d === 4 && h < 3)) return ['The telescope will not tip up far enough for the axis, so you swing it along the Hollow instead.', 'Up the middle of the dark, all the way to the back wall, small lamps drift along the axis like a slow river: people flying the Spindle with hand lamps. You can pick out single lamps. One of them is waving.'];
  if (h >= 23 || h < 5) return ['Lamp-night. Through the glass the far bank is a scatter of window light, three kilometres up. On a lawn out by the lake a cleaning cart crawls along a path with its one green lamp.', 'The lamp-night belongs to the machines.'];
  if (h < 9) return d === 3 && h >= 6 && h < 7.6 ? ['At the far end of the drum the back terraces are packed. You can make out a striped awning and a queue. Overhead the far bank has gone gold, and down here the front wood is still dark.'] : ['At the far end, 3.75 kilometres off, the back terraces are filling up. Chervil watches its dawns from there and its dusks from here.'];
  if (h < 15) return ['You find the lake first, about 1.8 kilometres out and a little spinward, with its island. People on the jetty. A child goes off the end and takes a long time to reach the water.', 'Swing it up the curve and the orchards run on up the side of the world until they are overhead, upside down and perfectly sharp. Somebody on the far bank, three kilometres away, is flying a kite by walking.'];
  if (h < 18.6 && sun > 0.02) return ['The light is going out of the line from the back end first. Through the glass the back wall is already in its own lamps while the orchards out by the lake are still lit.', 'Tonight\'s painter has laid a band of plum across the far bank. It will reach the front wood last, right under your feet.'];
  return ['The far end is lamplit now. On the back wall, five hundred metres up, the Third is dancing: you can see the reel go round the floor and the dancers hang at the top of every leap.', 'Nearer, the lamps along the Hollow\'s paths make a loose grid, brighter where the paths cross.'];
}

// The dusk book: the last three evenings, in different hands.
const DUSKS = [
  'Monday. Painted by Hanne Ostrova. Ochre to plum, two hours forty. The last of it lay on the front wood for eleven minutes. Underneath, another hand: twelve.',
  'Tuesday. A plain dusk, nobody painting. Thirty-one on the steps anyway. Ottilie ran out of cups at seven.',
  'Wednesday. Painted by four apprentices from the light studios, all at once. Too much green, everyone agrees. One of them has written: next year.',
  'Thursday. Painted by Iker Solberg, eighty-eight, his fortieth. Rose to brown, very slow, and the brown held on the far bank after the near side was dark. The steps stood up for it.',
  'The Quiet. A plain dusk. Nobody wrote anything for an hour, and then everybody did.',
];
function duskBook(gm) {
  const d = dayOf(gm), i0 = Math.min(2, d - 1);
  return ['A big book chained to the lectern, open at this week. Every dusk is written up here by somebody who watched it: the painter, the colours, how long, how it ended.', DUSKS[i0], DUSKS[i0 + 1], DUSKS[i0 + 2], 'The book has been kept since the year after the Count. This is its ninth volume.'];
}
