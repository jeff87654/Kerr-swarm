// The Quarter: tier fifteen of the back wall, 750 m above the Hollow's floor and 750 m below the axis, a quarter of a g.
// The slow fountain (twelve jets that climb eight metres, hang five seconds and come down three metres spinward), the
// Tea Steps beside it where people sit with lidded cups, the tea stand, the stopping ring where children learn to be
// light, the riser's old flats, the cab lobby, and the wall lift up to the Tenth and down to the Third.
import { lamp, block } from '../world/kit.js';
import { planter } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { Rng } from '../core/util.js';
import { PI, ENV, SKY, runX, toast, find, sfx, say, readSpec, buy, seat, skyGlow, bentFloor, movable, riser, broadRail, netX, endPier, cabLobby, wallLift, stoodTrigger } from './lm_back_upper_parts.js';

export const quarterParts = true;

const OMEGA = 0.0572;
// The fountain's water in the floor's own frame: up toward the axis at v0, a quarter of a g down, and the spin's push
// spinward while it climbs and back while it falls. x(t), y(t) from the nozzle.
const G = 2.45, V0 = Math.sqrt(2 * G * 8), T = 2 * V0 / G;
function jetAt(t) { return [OMEGA * V0 * t * t - OMEGA * G * t * t * t / 3, V0 * t - G * t * t / 2]; }

const TEA = { title: 'The Tea Steps', note: 'Brewed below on the loop and sent up hot. Every cup lidded.', items: [
  { id: 'tea', name: 'Pot tea, lidded', desc: 'Black tea from the urn, poured from a metre up so you can watch it land.', price: 0.12 },
  { id: 'coffee', name: 'Cell-culture coffee', desc: 'The same as at the Dawn Stand, carried up the wall in a flask.', price: 0.15 },
  { id: 'cake', name: 'Ginger steamed cake', desc: 'Under a cloth till you take it. At a quarter of a g it rises half again as tall.', price: 0.3 },
] };

export function buildQuarter(game) {
  const W = game.world;
  const f = W.frame('quarter', 750, 0, 3750); f.hollowView = true;
  const s = W.scope('bu-quarter', f), g = s.g;
  const X0 = -34, X1 = 34, ZR = -18, H = 12.6;
  const clip = [X0 - 0.5, -2, ZR - 1.5, X1 + 0.5, H + 1, 0.8];
  const r = new Rng(750);
  const ST = '#c7b89e', OAK = '#8a6240';

  // ---- the shelf: floor with paving bands, the broad rail and its net, the piers
  bentFloor(s, X0, ZR, X1, 0, 0, 'stone', ST, 8);
  runX(X0 + 0.8, X1 - 0.8, 8, (a, b) => { g.mat('stone', '#a89878'); g.box(a, 0, ZR, b, 0.006, ZR + 0.5, { faces: 'Y' }); g.box(a, 0, -3.4, b, 0.006, -3.1, { faces: 'Y' }); g.mat('stone', '#d2c4aa'); g.box(a, 0, ZR + 0.5, b, 0.004, ZR + 1.4, { faces: 'Y' }); });
  s.flush({ tier: 's', cast: false });
  broadRail(s, { x0: X0 + 0.8, x1: X1 - 0.8, zr: ZR, stone: '#bdae94', bronze: '#5a4a33', oak: OAK, barrier: 9, step: 4, trail: 1.4 });
  endPier(s, X0, X0 + 0.8, ZR, H, { inner: 1, tint: '#dcc8aa', solidH: 20 }); endPier(s, X1 - 0.8, X1, ZR, H, { inner: -1, tint: '#dcc8aa', solidH: 20 });
  // a light net above the rail: at a quarter of a g a child on the parapet can jump nearly three metres
  const ZN = ZR - 0.2;
  for (let x = X0 + 1.2; x <= X1 - 1.1; x += 6.6) { g.mat('cast', '#5a4a33'); g.lathe(x, ZN, [[0.07, 0.62], [0.05, 0.75], [0.04, 4.4], [0.06, 4.46], [0.03, 4.6], [0, 4.65]], { segs: 8 }); }
  s.flush({ tier: 's' });
  netX(s, { x0: X0 + 0.8, x1: X1 - 0.8, z: ZN, y0: 1.12, y1: 4.3, cell: 0.5, tint: '#e6dcc0' });

  // ---- the riser: the old flats' windows and doors, and the gaps for the lobby and the wall lift
  const fac = riser(s, { x0: X0 + 0.8, x1: X1 - 0.8, h: H, tint: '#e2cfb2', stone: '#b8a68a', trim: '#7a3a2a', gaps: [[-33.4, -25.4], [23.4, 32.2]], doors: [-19.5, -3, 12], seed: 15, lit: 0.42, step: 6 });
  const KNOCK = [
    ['A card in the fanlight: Gone down to the floor for the week. Seven hundred and fifty metres, and three quarters of my weight back. Water the fern.'],
    ['A voice through the door, unhurried: We have eaten, thank you, and we have slept. Go and look at the fountain.'],
    ['Somebody inside is practising the long flute, the same four notes, very slowly. At a quarter of a g you can hold a flute that long for hours.'],
  ];
  fac.doors.forEach((d, i) => {
    sign(s, { kind: 'plate', text: 'Tier fifteen · ' + (i * 6 + 4), sub: i === 1 ? 'knock twice' : 'please knock' }, d.x + 0.95, 1.5, -0.17, { face: 'z' });
    lamp(s, 'sconce', d.x - 0.95, 2.45, -0.17, { face: 'z', K: 2600, power: 0.55, night: true, clip });
    prop(s, 'plant', d.x + 1.05, 0, -0.55, 0, { kind: i % 2 ? 'fern' : 'flower', size: 0.9, pot: ['#a3563a', '#2f6f73', '#c9a24a'][i % 3] });
    s.interact({ x: d.x, y: 1.2, z: -0.6, radius: 1.2, prompt: 'Knock', onUse: async (gm) => { sfx(gm, 'knock', f, d.x, 1.2, -0.2); await say(gm, 'The door', KNOCK[i % KNOCK.length]); } });
  });
  for (const x of [-23.5, -8, 6.5, 18.5]) planter(s, x, 0, -0.7, { w: 1.8, d: 0.55, h: 0.55, plants: x > 0 ? 'flower' : 'broad', tint: '#a89a84' });

  // ---- the tier plate and the rail
  sign(s, { kind: 'plate', text: 'TIER FIFTEEN · THE QUARTER', sub: '750 m up · 750 m to the axis · a quarter of a g' }, -2, 0.82, ZR + 0.005, { face: 'Z', w: 0.56, h: 0.2 });
  s.interact({ x: -2, y: 1.0, z: ZR + 0.5, radius: 1.3, prompt: 'Read the tier plate', onUse: async (gm) => {
    await say(gm, 'Tier fifteen', ['A brass plate on the parapet: tier fifteen, the Quarter. Seven hundred and fifty metres above the floor, seven hundred and fifty below the axis, halfway up the wall.', 'A quarter of a g. If you weigh seventy kilos at the rim, here you weigh what seventeen and a half would. A standing jump goes four times as high as at the rim, nearly three metres, and you are three seconds in the air.']);
    find(gm, 'terraces-lighter');
  } });
  for (const lx of [-29, 8.5, 24]) s.interact({ x: lx, y: 1.2, z: ZR + 0.35, radius: 1.4, prompt: 'Lean on the rail', onUse: async (gm) => {
    const sun = gm.clock ? gm.clock.sun() : 1;
    await say(gm, 'The rail', sun < 0.05
      ? ['The Hollow at night is a bowl of small lamps: the floor 750 metres below you, and the lamps going on up both sides and over the top, where the far bank is 2,250 metres away.', 'Somewhere below, the Third is still dancing. You can hear the band, a beat late.']
      : ['Straight down, 750 metres, the back wood is a green fur. Further out the orchards, the lake shining, and the land curving up both ways until it is over your head.', 'The sunline starts 450 metres out from the wall and 750 metres above you, and runs away for nearly three kilometres. From here you look along it, not up at it.']);
    find(gm, 'far-bank');
  } });

  // ---- the slow fountain
  const BX0 = -23.4, BX1 = -5.2, BZ0 = -13.6, BZ1 = -6.6, BH = 0.5;
  g.mat('stone', '#b4a48a');
  g.box(BX0, 0, BZ0, BX1, BH, BZ0 + 0.35, { bevel: 0.03, aoBottom: 0.7 }); g.box(BX0, 0, BZ1 - 0.35, BX1, BH, BZ1, { bevel: 0.03, aoBottom: 0.7 });
  g.box(BX0, 0, BZ0 + 0.35, BX0 + 0.35, BH, BZ1 - 0.35, { bevel: 0.03 }); g.box(BX1 - 0.35, 0, BZ0 + 0.35, BX1, BH, BZ1 - 0.35, { bevel: 0.03 });
  g.mat('stone', '#cbbb9f'); for (const z of [BZ0, BZ1 - 0.35]) g.box(BX0 - 0.04, BH, z - 0.03, BX1 + 0.04, BH + 0.05, z + 0.38, { bevel: 0.015 });
  s.flush({ tier: 's', cast: true });
  g.mat('mosaic', '#2f6f73'); g.box(BX0 + 0.35, 0, BZ0 + 0.35, BX1 - 0.35, 0.05, BZ1 - 0.35, { faces: 'Y' });
  g.mat('mosaic', '#d6a640'); for (let x = BX0 + 1.2; x < BX1 - 0.6; x += 1.9) g.box(x - 0.04, 0.05, BZ0 + 0.5, x + 0.04, 0.052, BZ1 - 0.5, { faces: 'Y' });
  s.flush({ tier: 's', cast: false });
  g.mat('plain', '#3f8a90', { rough: -0.45 }); g.box(BX0 + 0.35, 0.34, BZ0 + 0.35, BX1 - 0.35, 0.35, BZ1 - 0.35, { faces: 'Y' }); s.flush({ tier: 's', cast: false });
  s.solid(BX0, 0, BZ0, BX1, BH + 0.05, BZ1);
  const NOZ = []; for (let i = 0; i < 12; i++) NOZ.push([BX0 + 2.2 + (i % 6) * 1.9, (BZ0 + BZ1) / 2 + (i < 6 ? -1.0 : 1.0)]);
  const JET = '#c4ecf2';
  for (const n of NOZ) s.detail(() => {
    g.mat('cast', '#8a6d3b'); g.cyl(n[0], 0.05, n[1], 0.08, 0.34, { segs: 8, r1: 0.045 });
    // a glassy rope out of the nozzle that breaks into beads where it slows near the top, and joins up again falling
    const N = 44, P = []; for (let k = 0; k <= N; k++) { const p = jetAt(T * k / N); P.push([n[0] + p[0], 0.4 + p[1], n[1]]); }
    g.mat('plain', JET, { rough: -0.48, emissive: 0.45 });
    for (let k = 0; k < N; k++) { const solid = k < 9 || k > 38; if (!solid && k % 2) continue; const rr = solid ? 0.03 : 0.024; g.tube([P[k], P[k + 1]], rr, { segs: 5, caps: !solid }); }
    g.mat('plain', '#ffffff', { rough: -0.4 }); const e = jetAt(T); g.ball(n[0] + e[0], 0.36, n[1], 0.24, 0.05, 0.24, { segs: 10, rings: 4, bottom: 0 });
  });
  // the water that hangs: clusters of drops riding the arcs, one mesh per moment of the five seconds
  { const PH = 10, base = [NOZ[0][0], 0.4, NOZ[0][1]], meshes = [];
    for (let k = 0; k < PH; k++) {
      const R = new Rng(900 + k);
      const m = movable(s, (gg) => { gg.mat('plain', '#dff6fa', { rough: -0.5, emissive: 0.6 }); for (const n of NOZ) for (let q = 0; q < 3; q++) gg.ball(n[0] - base[0] + R.f(-0.12, 0.12), R.f(-0.18, 0.18), n[1] - base[2] + R.f(-0.12, 0.12), 0.055, 0.075, 0.055, { segs: 6, rings: 4 }); }, base, { center: [5, 0, 0], radius: 9, far: 160 });
      if (m) meshes.push(m);
    }
    let clock = 0;
    s.every((dt) => { clock = (clock + Math.min(dt, 0.1)) % T; for (let k = 0; k < meshes.length; k++) { const t = (clock + T * k / meshes.length) % T, p = jetAt(t), o = meshes[k].userData.origin; o[0] = base[0] + p[0]; o[1] = base[1] + p[1]; o[2] = base[2]; } });
  }
  for (const x of [BX0 + 3, (BX0 + BX1) / 2, BX1 - 3]) s.light({ at: [x, 0.55, (BZ0 + BZ1) / 2], type: 'spot', dir: [0.12, 1, 0], cone: [42, 18], K: 4200, color: [0.75, 0.9, 1.0], power: 5, range: 12, night: true, clip });
  // its plate
  const fplate = { kind: 'notice', title: 'The slow fountain', lines: ['Twelve jets. Each climbs eight', 'metres, hangs five seconds,', 'and comes down three metres', 'spinward of where it left.', 'Climbing toward the axis, the', 'water keeps the speed of the', 'floor it left, and that is faster', 'than the air it climbs into.'] };
  g.mat('stone', '#a89a84'); g.box(-4.4, 0, -14.6, -4.0, 1.0, -14.2, { bevel: 0.02 }); g.box(-4.5, 1.0, -14.7, -3.9, 1.06, -14.1, { bevel: 0.01 }); s.flush({ tier: 's', cast: true }); s.solid(-4.5, 0, -14.7, -3.9, 1.06, -14.1);
  sign(s, fplate, -4.4 - 0.005, 1.38, -14.4, { face: 'x', w: 0.4, h: 0.58 });
  s.interact({ x: -4.9, y: 1.2, z: -14.4, radius: 1.2, prompt: 'Read the fountain plate', onUse: (gm) => readSpec(gm, fplate, 'Scratched small under it: at the rim it would come down four centimetres off. Up here you can watch it.') });
  s.interact({ x: -14, y: 0.8, z: BZ0 - 0.4, radius: 1.6, prompt: 'Put a hand in the falling water', onUse: async (gm) => {
    sfx(gm, 'splash', f, -14, 0.6, BZ0 + 0.6);
    await say(gm, 'The slow fountain', ['You hold your hand out over the basin. The water arrives in slow fat drops from the anti side, a long way from the nozzle that threw it, and lands on your palm almost gently.', 'At a quarter of a g it is falling at a quarter of the speed it would at the rim, from the same height. Children stand in it with their mouths open.']);
  } });
  // benches round it, facing the water
  // benches round it: on the wall side they look over the water to the Hollow; at the rail, out at the Hollow itself
  for (const p of [[-19.5, -15.4], [-9.6, -15.4], [-19.5, -5.0], [-9.6, -5.0]]) prop(s, 'bu.bench', p[0], 0, p[1], PI, { w: 3.2, wood: OAK });
  seat(s, -19.5, 0, -15.5, PI, 'Sit by the fountain'); seat(s, -9.6, 0, -5.1, PI, 'Sit and watch the water');

  // ---- the Tea Steps: four broad steps climbing toward the wall, facing the Hollow and the water
  const TX0 = 0.6, TX1 = 21.4, TZ0 = -12.2, SD = 1.75, RISE = 0.38, NSTEP = 4, TZB = TZ0 + SD * NSTEP;
  const STC = ['#c9b99c', '#c2b294', '#bbab8d', '#b4a486'];
  for (let k = 0; k < NSTEP; k++) {
    const z0 = TZ0 + SD * k, y1 = RISE * (k + 1);
    runX(TX0, TX1, 8, (a, b) => { g.mat('stone', STC[k]); g.box(a, RISE * k, z0, b, y1, TZB, { faces: 'zYxX', aoBottom: 0.75 }); g.mat('stone', '#9a8a70'); g.box(a, y1 - 0.04, z0 - 0.02, b, y1 + 0.004, z0 + 0.06, { faces: 'zY' }); });
    s.flush({ tier: 's', cast: true });
    s.solid(TX0, 0, z0, TX1, y1, TZB, { surf: 'stone' });
    // oak seat boards along the front of each step, in lengths, with a gap between
    runX(TX0 + 0.3, TX1 - 0.3, 3.4, (a, b) => { g.mat('wood', ['#9a6a3e', '#8a5a32', '#a87a4a'][Math.floor(a) % 3], { rough: -0.08 }); g.box(a + 0.05, y1, z0 + 0.08, b - 0.05, y1 + 0.045, z0 + 0.82, { bevel: 0.012 }); });
    s.flush({ tier: 's', cast: false });
  }
  // the back: a planted wall closing the top step
  block(s, TX0, 0, TZB, TX1, RISE * NSTEP + 0.45, TZB + 0.6, 'stone', '#a89a84', { bevel: 0.02 });
  for (let x = TX0 + 2.6; x < TX1 - 1; x += 5.2) planter(s, x, RISE * NSTEP + 0.45, TZB + 0.3, { w: 4.6, d: 0.48, h: 0.04, plants: 'herbs', tint: '#a89a84', density: 9 });
  // step lights in the risers, to find your feet by
  runX(TX0 + 0.2, TX1 - 0.2, 4, (a, b) => { g.mat('diffuser', '#ffcf8a', { emissive: 2.2, night: true }); for (let k = 0; k < NSTEP; k++) g.box(a, RISE * k + 0.2, TZ0 + SD * k - 0.012, b, RISE * k + 0.23, TZ0 + SD * k, { faces: 'z' }); });
  s.flush({ tier: 'd', cast: false });
  // cushions, cups and trays on the steps, and the people's places
  const CUSH = ['#5b4060', '#d98a3a', '#b8584a', '#2f6f73', '#d6a640', '#7a2f3c', '#3a5a7a'];
  s.detail(() => {
    for (let k = 0; k < NSTEP; k++) for (let x = TX0 + 0.8; x < TX1 - 0.5; x += r.f(1.6, 3.2)) {
      const y = RISE * (k + 1) + 0.045, z = TZ0 + SD * k + 0.45;
      g.mat(r.chance(0.5) ? 'knit' : 'motif', CUSH[r.i(0, CUSH.length - 1)]); g.box(x - 0.26, y, z - 0.24, x + 0.26, y + 0.07, z + 0.24, { bevel: 0.03 });
    }
  });
  for (let i = 0; i < 14; i++) { const k = i % NSTEP, x = TX0 + 1.4 + r.f(0, TX1 - TX0 - 2.8), y = RISE * (k + 1), z = TZ0 + SD * k + 1.1; prop(s, 'cup', x, y, z, 0, { glaze: ['#e9e1cf', '#c9763e', '#2f6f73', '#b8584a'][i % 4] }); }
  for (const p of [[5.2, 1], [13.6, 2], [18.4, 0]]) { const y = RISE * (p[1] + 1), z = TZ0 + SD * p[1] + 1.0; s.detail(() => { g.mat('wood', '#7a5233'); g.box(p[0] - 0.3, y, z - 0.2, p[0] + 0.3, y + 0.03, z + 0.2, { bevel: 0.008 }); }); prop(s, 'bowl', p[0] - 0.12, y + 0.03, z, 0, { glaze: '#2f6f73', lid: '#d6a640', r: 0.07 }); prop(s, 'cup', p[0] + 0.14, y + 0.03, z + 0.05, 0, { glaze: '#e9e1cf' }); }
  for (let k = 0; k < NSTEP; k++) for (let x = TX0 + 0.9; x < TX1 - 0.6; x += 1.35) s.spot('sit', x + r.f(-0.15, 0.15), RISE * (k + 1), TZ0 + SD * k + 0.42, PI + r.f(-0.25, 0.25), { tags: ['tea', 'watch', k % 2 ? 'chat' : 'evening'] });
  for (const p of [[4.0, 0], [10.5, 2], [16.8, 1], [7.2, 3]]) seat(s, p[0], RISE * (p[1] + 1), TZ0 + SD * p[1] + 0.45, PI, 'Sit on the Tea Steps', { lift: 0, eye: 1.1, onSit: teaSit });
  sign(s, { kind: 'plate', text: 'THE TEA STEPS', sub: 'sit anywhere · cups back to the stand' }, TX0 - 0.02, 0.95, TZ0 + 2.6, { face: 'x', w: 0.6, h: 0.2 });

  // ---- the tea stand, its keeper and a few standing tables
  const CX = 27.2, CZ = -9.6;
  prop(s, 'bu.teastand', CX, 0, CZ, -PI / 2, { body: '#2f5d5a', trim: '#d6a640' });
  prop(s, 'crate', CX + 1.3, 0, CZ - 1.4, 0.2, { w: 0.6, h: 0.4, d: 0.4 }); prop(s, 'crate', CX + 1.35, 0.4, CZ - 1.42, -0.1, { w: 0.5, h: 0.3, d: 0.36, wood: '#9a7a4e' });
  prop(s, 'crock', CX + 1.4, 0, CZ + 1.6, 0, { glaze: '#7a2f3c', h: 0.4, r: 0.15 });
  prop(s, 'stool', CX + 1.2, 0, CZ + 0.9, 0, { h: 0.62 });
  lamp(s, 'bulb', CX - 0.2, 2.2, CZ, { K: 2500, power: 0.7, range: 5, clip, night: true });
  lamp(s, 'lantern', CX - 1.0, 1.95, CZ - 1.1, { tint: '#e8743b', drop: 0.2, power: 0.6, clip, night: true, lampFlag: false });
  s.spot('counter', CX + 0.95, 0, CZ, -PI / 2, { tags: ['tea', 'keeper'] });
  s.spot('work', CX + 1.0, 0, CZ - 0.9, -PI * 0.4, { tags: ['tea'] });
  for (let i = 0; i < 5; i++) s.spot('queue', CX - 1.5 - (i > 1 ? 0.2 : 0), 0, CZ - 0.3 + i * 0.85, PI / 2, { tags: ['tea'] });
  s.interact({ x: CX - 1.5, y: 1.1, z: CZ, radius: 1.6, prompt: 'Buy tea', onUse: async (gm) => {
    const it = await buy(gm, TEA, 'Benedek, at the urn');
    if (!it) return;
    sfx(gm, it.id === 'cake' ? 'plate' : 'pour', f, CX, 1.1, CZ);
    if (it.id === 'cake' && gm.inv) gm.inv.give('steamed-cake');
    else if (gm.inv && !gm.inv.has('lidded-cup')) gm.inv.give('lidded-cup');
    await say(gm, 'Benedek', it.id === 'tea' ? ['Watch. From a metre up it takes nine tenths of a second to fall, and it lands three and a half centimetres anti of where it left the spout. So I aim a thumb to spinward.', 'Lid on. Up here it goes cold in the time it takes to look at the fountain.']
      : it.id === 'cake' ? ['Steamed down on the loop and carried up in a box. It rises half again as tall at a quarter of a g, and it never quite comes back down.'] : ['Lid on. Cups back to the stand, or to any cart in the drum.']);
  } });
  for (const p of [[24.2, -14.6], [29.4, -14.2], [31.2, -5.0]]) {
    prop(s, 'table', p[0], 0, p[1], 0, { round: true, w: 0.7, h: 1.05, wood: '#4a3a2a', top: '#7a5233' });
    prop(s, 'cup', p[0] + 0.12, 1.05, p[1] - 0.05, 0, { glaze: '#c9763e' }); prop(s, 'cup', p[0] - 0.1, 1.05, p[1] + 0.08, 0, { glaze: '#2f6f73' });
    for (let k = 0; k < 3; k++) { const a = k * 2.1 + 0.4; s.spot('chat', p[0] + Math.sin(a) * 0.75, 0, p[1] + Math.cos(a) * 0.75, a + PI, { tags: ['tea', 'watch'] }); }
  }
  // a lantern string from the riser to the masts, over the steps
  const LS = [];
  for (const x of [3, 9.6, 16.2, 22.8]) { const pts = lanternString(s, [x, 6.8, -0.45], [x + 0.6, 4.4, ZN + 0.15], ['#f2b56b', '#e8743b', '#f0d070', '#d95d7a']); LS.push(pts[2], pts[7]); g.mat('cast', '#3a3430'); g.tube([[x, 6.8, -0.02], [x, 6.8, -0.48]], 0.025, { segs: 5 }); s.flush({ tier: 'd' }); }
  for (const L of LS) s.light({ at: [L[0], L[1], L[2]], K: 2500, color: [1, 0.7, 0.45], power: 1.2, range: 6, lamp: true, clip, radius: 0.1 });

  // ---- the stopping ring: where Low-deck children learn to be light, starting with how to stop
  const RX = -27.4, RZ = -11.6;
  s.structure(() => {
    for (const rg of [[2.6, 2.25, '#2f6f73', 0.004], [2.25, 2.1, '#d6a640', 0.005], [1.0, 0.0, '#b8584a', 0.006], [0.55, 0.0, '#e8dcc0', 0.008]]) { g.mat('mosaic', rg[2]); g.lathe(RX, RZ, [[rg[0], rg[3]], [rg[1], rg[3] + 0.0005]], { segs: 40, capTop: false, capBottom: false }); }
    g.mat('paint', '#e8dcc0'); for (let i = 0; i < 4; i++) { const z = RZ + 5.2 + i * 0.9; g.box(RX - 0.6, 0, z, RX + 0.6, 0.005, z + 0.12, { faces: 'Y' }); }
  });
  sign(s, { kind: 'label', text: 'RUN IN · STOP IN', sub: 'small steps · knees soft · lean back early' }, RX, 0.9, RZ - 2.9, { face: 'Z', w: 0.7, h: 0.22 });
  g.mat('cast', '#3a3430'); g.tube([[RX, 0, RZ - 2.95], [RX, 0.78, RZ - 2.95]], 0.02, { segs: 5 }); s.flush({ tier: 'd' }); s.post(RX, RZ - 2.95, 0.05, 0, 1.0);
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; s.spot('play', RX + Math.cos(a) * 3.1, 0, RZ + Math.sin(a) * 3.1, Math.atan2(-Math.cos(a), -Math.sin(a)), { tags: ['kids', 'learn'] }); }
  s.spot('stand', RX + 3.4, 0, RZ + 2.6, -PI * 0.75, { tags: ['kids', 'teach'] });
  s.interact({ x: RX, y: 0.8, z: RZ + 3.2, radius: 1.6, prompt: 'Try the stopping ring', onUse: async (gm) => {
    await say(gm, 'The stopping ring', ['You run at the ring and try to stop in the middle. Your feet go on without you and you slide out of the far side, still upright, feeling foolish.', 'At a quarter of a g your soles have a quarter of their grip, so stopping takes four times the floor it takes at the rim. The children here learn it before anything else: small steps, knees soft, lean back early.']);
  } });

  // ---- the lift lobby and the wall lift
  cabLobby(game, s, { x0: -32.2, x1: -26.2, d: 3.6, clip, id: 'back-quarter', sign: { kind: 'street', text: 'CABS · TIER FIFTEEN', sub: 'the Quarter' } });
  wallLift(game, s, { x: 25.2, clip, label: 'WALL LIFT · DOWN', sub: 'the Third · tier ten', prompt: 'Take the wall lift down to the Third',
    to: { frame: 'terrace10', x: 13.2, y: 0, z: -4.6, yaw: -0.85 }, banner: ['The Third', 'tier ten · a third of a g'], secs: 'Two hundred and fifty metres down the wall in about twelve seconds. You get heavier all the way.' });
  wallLift(game, s, { x: 29.8, clip, door: '#c08a45', label: 'WALL LIFT · UP', sub: 'the Tenth · tier twenty-four', prompt: 'Take the wall lift up to the Tenth',
    to: { frame: 'tenth', x: 15.6, y: 0, z: -1.8, yaw: 0.3 }, banner: ['The Tenth', 'tier twenty-four · a tenth of a g'], secs: 'Four hundred and fifty metres up the wall in about twenty-two seconds. You weigh less with every floor.' });

  // ---- benches at the rail, bollards for the dark hours
  for (const x of [-30.5, -1.5, 4.8, 13.6, 20.4]) { prop(s, 'bu.bench', x, 0, ZR + 1.5, PI, { w: 2.8, wood: OAK }); }
  seat(s, 13.6, 0, ZR + 1.4, PI, 'Sit at the rail');
  for (let x = -30; x <= 30; x += 7.5) { prop(s, 'bu.bollard', x, 0, ZR + 0.4, 0, {}); s.light({ at: [x, 0.66, ZR + 0.55], K: 2400, color: [1.0, 0.62, 0.32], power: 0.9, range: 4.2, night: true, clip, radius: 0.08 }); }

  // ---- people and walkways
  for (let x = -24; x <= 31; x += 2.4) if (Math.abs(x + 2) > 1 && (x < -24 || x > -4)) s.spot('stand', x + r.f(-0.3, 0.3), 0, ZR + 0.6, PI, { tags: ['watch', 'rail'] });
  for (const c of [[-15, -16.6], [-1.6, -15.4], [-25, -5.5]]) for (let k = 0; k < 3; k++) { const a = k * 2.09; s.spot('chat', c[0] + Math.sin(a) * 0.65, 0, c[1] + Math.cos(a) * 0.65, a + PI, { tags: ['watch', 'evening'] }); }
  s.path([[-29.2, -4.8], [-24, -4.2], [-12, -4.6], [-2, -3.0], [10, -2.0], [22, -2.0], [27.5, -2.0], [31, -2.4]]);
  s.path([[-31, -16.4], [-20, -16.4], [-4, -16.0], [10, -16.0], [24, -16.4], [31.5, -16.4]]);
  s.path([[-29.2, -4.8], [-30.5, -10], [-31, -16.4]]); s.path([[31, -2.4], [32, -9], [31.5, -16.4]]);
  s.path([[-2, -3.0], [-3, -9.6], [-4, -16.0]]); s.path([[22, -2.0], [24.5, -8.5], [24, -16.4]]);
  s.path([[10, -16.0], [10, -13.2], [10, -10.6]]);

  // ---- light, zone, sound, spawn
  skyGlow(game, s, [X0 - 1, -2, ZR - 2, X1 + 1, H + 2, 0.8], 0.95);
  s.zoneBox(Object.assign({ id: 'back-quarter', place: 'back-quarter', box: [X0, -2, ZR - 1.5, X1, H + 4, 0.6], name: 'The Quarter', sub: 'The back wall · tier fifteen · a quarter of a g', ambience: 'terrace', headroom: 30, env: ENV }, SKY));
  s.loop('fountain', (BX0 + BX1) / 2, 1.2, (BZ0 + BZ1) / 2, { vol: 0.42, radius: 16 });
  s.loop('murmur', 11, 1.2, -8, { vol: 0.24, radius: 18, param: 0.3 });
  stoodTrigger(s, [X0, -1, ZR, X1, H + 4, 0], 'quarter');
  s.finish();
  game.spawns['back-quarter'] = { frame: f, x: -29.2, y: 0, z: -5.2, yaw: 0.35 };
}

async function teaSit(gm) {
  if (gm.flags['bu.teasit']) return; gm.flags['bu.teasit'] = true;
  toast(gm, 'Somebody along the step slides a lidded cup toward you without looking away from the water.');
}

// A string of small cloth lanterns on a sagging cord between a and b. Returns the lanterns' positions.
function lanternString(s, a, b, cols) {
  const g = s.g, n = 10, sag = 0.8;
  const P = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t];
  const line = []; for (let i = 0; i <= 16; i++) line.push(P(i / 16));
  g.mat('brushed', '#3a3430'); g.tube(line, 0.006, { segs: 3, caps: false });
  const out = [], rr = 0.13;
  for (let i = 0; i < n; i++) {
    const p = P((i + 0.5) / n), y = p[1] - 0.16;
    g.mat('brushed', '#3a3430'); g.tube([[p[0], p[1], p[2]], [p[0], y + rr * 1.2, p[2]]], 0.004, { segs: 3, caps: false });
    g.mat('paper', cols[i % cols.length], { emissive: 2.4, lamp: true });
    g.lathe(p[0], p[2], [[rr * 0.3, y - rr], [rr * 0.85, y - rr * 0.6], [rr, y], [rr * 0.85, y + rr * 0.6], [rr * 0.3, y + rr]], { segs: 8 });
    out.push([p[0], y, p[2]]);
  }
  s.flush({ tier: 'd', cast: false });
  return out;
}
