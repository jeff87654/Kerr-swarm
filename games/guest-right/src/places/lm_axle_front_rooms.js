// The small rooms off the Lap, on its back side (toward the Hollow), at a fiftieth of a g:
//   the Slow Pour (x 9.6..24): a tea room. Cups with clip lids, a tall pot whose stream takes its time, strap chairs, a
//     rail round everything, and a slit in the cap's wall onto the front flying hall.
//   the Hundreds (x -24..-9.6): the visitors' book and the wall of small brass plates for people who came up here on
//     their hundredth birthday.
//   the warden's post (x -9.6..-5): a hatch onto the Lap, red lamps, spare straps; its rules are on the Lap's far wall.
//   the alcove (x 5..9.6): a bench and the board of the Lap.
import { wall, ceiling, floor, lamp, roomGlow, warm } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { Rng } from '../core/util.js';
import { PI, RHO, say, toast, sfx, seat, ownMesh, innerBox, handLine, runX } from './lm_axle_front_parts.js';

const H = 3.2;                                    // the rooms' ceilings: low, as everywhere here
const FELT = { h: 1.0, mat: 'felt', tint: '#7a2f3c' };
const KEEP = { name: 'Dov, at the pot', colour: '#e7b547' };
const WARDEN = { name: 'Kwabena, warden', colour: '#ff6a4a' };
const OMEGA = 0.05718, G = 9.81 * RHO / 3000;     // the drum's turn; weight here in m/s^2

// The front wall of a room, on the Lap's back side (z = 0): the Lap sees its felt dado, the room its own finish.
function frontWall(s, x0, x1, openings, inner) {
  wall(s, x0, 0.08, x1, 0.08, 0, H, { mat: 'plaster', tintA: inner || '#e6dbc4', tintB: '#e6dbc4', dado: FELT, openings, skirt: '#2a2420' });
}
function sideWalls(s, x0, x1, z1, tint, dado) {
  const o = { mat: 'plaster', tint, dado: dado || FELT, skirt: '#2a2420' };
  wall(s, x0 + 0.08, 0.16, x0 + 0.08, z1, 0, H, o); wall(s, x1 - 0.08, 0.16, x1 - 0.08, z1, 0, H, o);
}

// ===============================================================================================================
// The Slow Pour
// ===============================================================================================================
export function buildTeaRoom(game, s, f) {
  const g = s.g, X0 = 9.6, X1 = 24, Z1 = 9.6;
  const clip = [X0 - 0.1, -0.3, -0.1, X1 + 0.1, H + 0.1, Z1 + 0.2];
  floor(s, X0, 0.16, X1, Z1, 0, 'planks', '#9a6a42');
  ceiling(s, X0, 0, X1, Z1, H, 'felt', '#e2c98a');
  frontWall(s, X0, X1, [{ at: 0.8, w: 1.5, h: 2.3 }], '#e8c76a');
  sideWalls(s, X0, X1, Z1, '#e8c76a');
  // the back wall: the cap itself, with the slit in it
  const SX0 = 13.2, SX1 = 21.2, SY0 = 1.0, SY1 = 1.85;
  wall(s, X0, Z1 - 0.08, X1, Z1 - 0.08, 0, H, { mat: 'plaster', tint: '#e8c76a', dado: FELT, skirt: '#2a2420', openings: [{ at: SX0 - X0, w: SX1 - SX0, h: SY1 - SY0, sill: SY0 }] });
  // the slit's deep reveal through the cap, brass-lipped, with thick glass at the far end
  s.structure(() => { g.mat('concrete', '#8f8a80'); innerBox(g, SX0, SY0, Z1, SX1, SY1, 10.3, 'xXyY'); g.mat('cast', '#b08a45', { rough: -0.1 }); g.box(SX0 - 0.06, SY0 - 0.06, Z1 - 0.1, SX1 + 0.06, SY0, Z1 - 0.04, { faces: 'zY' }); g.box(SX0 - 0.06, SY1, Z1 - 0.1, SX1 + 0.06, SY1 + 0.06, Z1 - 0.04, { faces: 'zy' }); });
  s.solid(SX0, SY0, Z1 - 0.1, SX1, SY1, 10.3);
  // felt hangings between the beams: colour is cheap and soft walls keep a small room dry
  const HC = ['#c9552e', '#2f8f8a', '#e7b547', '#7a3a9a', '#2f5fa8'];
  s.deco(() => { let k = 0; for (let z = 1.2; z < Z1 - 1; z += 2.1) for (const x of [X0 + 0.17, X1 - 0.17]) { g.mat('felt', HC[(k++ * 2) % HC.length]); g.box(x - 0.02, 1.35, z, x + 0.02, 2.75, z + 1.3, { faces: x < 15 ? 'X' : 'x' }); } });
  // ceiling battens
  s.deco(() => { g.mat('wood', '#6b4a2f'); for (let x = X0 + 1.4; x < X1; x += 1.8) g.box(x - 0.05, H - 0.12, 0.2, x + 0.05, H, Z1 - 0.2, { faces: 'xXy' }); });

  // ---- the counter along the far wall, the pot, the can from below, shelves of clip cups, the price board
  const CX = 21.9, CZ0 = 1.4, CZ1 = 7.6;
  prop(s, 'counter', CX + 0.35, 0, (CZ0 + CZ1) / 2, -PI / 2, { w: CZ1 - CZ0, d: 0.7, body: '#2f6f73', top: '#8a6240' }, { noSpots: true });
  s.solid(CX, 0, CZ0, CX + 0.7, 0.92, CZ1);
  prop(s, 'shelving', X1 - 0.3, 0, 3.0, -PI / 2, { w: 1.6, h: 2.2, shelves: 4, wood: '#5a3a28' });
  prop(s, 'shelving', X1 - 0.3, 0, 6.2, -PI / 2, { w: 1.6, h: 2.2, shelves: 4, wood: '#5a3a28' });
  const CUPC = ['#e9e1cf', '#c9763e', '#2f6f73', '#d6a640', '#a82a2a', '#3a4a6a'];
  for (let i = 0; i < 40; i++) { const z = 2.35 + (i % 10) * 0.13 + (i % 20 >= 10 ? 3.2 : 0), y = 0.08 + (1 + Math.floor(i / 20)) * (2.2 - 0.11) / 4 + 0.03; prop(s, 'lm-axle-front.clipcup', X1 - 0.32, y, z, -PI / 2, { glaze: CUPC[i % 6], lid: CUPC[(i + 3) % 6] }); }
  // the insulated can that the tea comes up in, on its cradle, with its tap
  s.furniture(() => {
    g.mat('brushed', '#b9b2a4', { rough: -0.05 }); g.lathe(CX + 0.35, 2.0, [[0, 0.92], [0.2, 0.92], [0.22, 0.96], [0.22, 1.42], [0.17, 1.5], [0.06, 1.52], [0.06, 1.56], [0, 1.57]], { segs: 18 });
    g.mat('paint', '#a82a2a'); g.lathe(CX + 0.35, 2.0, [[0.225, 1.12], [0.225, 1.2]], { segs: 18, capTop: false, capBottom: false });
    g.mat('cast', '#c8a45a'); g.tube([[CX + 0.15, 1.0, 2.0], [CX + 0.05, 1.0, 2.0], [CX + 0.05, 0.96, 2.0]], 0.016, { segs: 6 });
  });
  sign(s, { kind: 'plate', text: 'From 375', lines: ['brewed below, sent up hot'] }, CX + 0.04, 1.08, 2.0, { face: 'x', w: 0.3, h: 0.12 });
  const PX = CX + 0.3, PZ = 4.9;                 // the pot on the counter; its spout points along -z
  prop(s, 'lm-axle-front.pot', PX, 0.92, PZ, PI / 2, { glaze: '#2f6f73' });
  const T_FALL = Math.sqrt(2 * 0.45 / G), V0 = 0.15;
  const cupX = PX - OMEGA * G * T_FALL * T_FALL * T_FALL / 3, cupZ = PZ - 0.29 - V0 * T_FALL;
  prop(s, 'cup', cupX, 0.92, cupZ, 0, { glaze: '#e9e1cf', open: true });
  const lid = ownMesh(s, (cg) => { cg.mat('glaze', '#2f6f73', { rough: -0.2 }); cg.lathe(0, 0, [[0.045, 0.08], [0.044, 0.09], [0.014, 0.098], [0.014, 0.108], [0, 0.11]], { segs: 14, capBottom: false }); cg.mat('cast', '#c8a45a'); for (const sx of [-1, 1]) cg.tube([[sx * 0.043, 0.06, 0], [sx * 0.048, 0.088, 0], [sx * 0.016, 0.1, 0]], 0.0025, { segs: 3 }); }, { origin: [cupX, 0.92, cupZ], radius: 0.2, far: 30, hidden: true });
  // the stream: pieces of the trajectory, each shown while the tea is passing through it
  const NSEG = 16, segs = [];
  const at = (t) => [PX - OMEGA * G * t * t * t / 3, 0.92 + 0.53 - 0.5 * G * t * t, PZ - 0.29 - V0 * t];
  for (let i = 0; i < NSEG; i++) {
    const t0 = T_FALL * i / NSEG, t1 = T_FALL * (i + 1) / NSEG, a = at(t0), b = at(t1);
    segs.push({ t0, t1, m: ownMesh(s, (cg) => { cg.mat('glaze', '#7a3f18', { rough: -0.45 }); cg.tube([[a[0] - PX, a[1], a[2] - PZ], [b[0] - PX, b[1], b[2] - PZ]], 0.0075, { segs: 6, caps: true }); }, { origin: [PX, 0, PZ], center: [0, 1.2, -0.4], radius: 0.6, far: 30, hidden: true }) });
  }
  const POUR = 3.2, pour = { t: -1, lidAt: 0 };
  s.every((dt) => {
    if (pour.t < 0) { if (pour.lidAt > 0) { pour.lidAt -= dt; if (pour.lidAt <= 0) lid.show(false); } return; }
    pour.t += dt; const e = pour.t;
    for (const q of segs) q.m.show(q.t0 < e && q.t1 > e - POUR);
    if (e > POUR + T_FALL + 0.05) { pour.t = -1; for (const q of segs) q.m.show(false); lid.show(true); pour.lidAt = 40; }
  });
  s.interact({ x: CX - 0.4, y: 1.1, z: PZ - 0.4, radius: 1.3, prompt: (gm) => (pour.t >= 0 ? 'The tea is on its way down' : 'Pour a cup of tea (0.15)'), onUse: async (gm) => {
    if (pour.t >= 0) return;
    if (gm.wallet && !gm.wallet.spend(0.15, 'Tea at the Slow Pour')) { toast(gm, 'Not enough kays for a cup just now.'); return; }
    lid.show(false); pour.lidAt = 0; pour.t = 0; sfx(gm, 'pour', f, PX, 1.3, PZ - 0.4);
    if (!gm.flags.slow_pour) {
      gm.flags.slow_pour = true;
      setTimeout(() => { if (gm.ui) say(gm, KEEP, ['Watch it. Half a metre takes two seconds up here, and it lands a finger\'s width anti of where you aimed, so you aim spinward.', 'Nothing boils this close to the axis, so the tea is brewed on deck 375 and comes up hot in that flask. Clip the lid on before you walk anywhere.']); }, 5600);
    } else setTimeout(() => toast(gm, 'The stream takes its time and lands a finger\'s width anti. You clip the lid on. 0.15.', 'spend'), 5600);
  } });
  sign(s, { kind: 'chalk', title: 'The Slow Pour', lines: ['Tea, long-poured 0.15', 'A bulb to take round 0.15', 'Steamed cake, lidded 0.30', 'Aim spinward', 'Clip your lid', 'Strap your lap'] }, X1 - 0.17, 2.55, 4.6, { face: 'x', w: 0.62, h: 0.9 });
  s.spot('counter', CX + 1.2, 0, PZ - 0.2, -PI / 2, { tags: ['tea', 'keeper'] });
  

  // ---- the seats facing the slit: a ledge with cup clips, a row of strap chairs
  s.furniture(() => { g.mat('wood', '#6b4a2f', { rough: -0.06 }); g.box(SX0 - 0.6, 0.72, Z1 - 0.55, SX1 + 0.6, 0.77, Z1 - 0.16, { bevel: 0.012 }); g.mat('cast', '#4a4038'); for (let x = SX0 - 0.3; x <= SX1 + 0.4; x += 1.4) g.box(x - 0.02, 0.4, Z1 - 0.2, x + 0.02, 0.72, Z1 - 0.16); });
  s.solid(SX0 - 0.6, 0, Z1 - 0.55, SX1 + 0.6, 0.77, Z1 - 0.16);
  s.detail(() => { g.mat('cast', '#c8a45a'); for (let x = SX0 - 0.15; x < SX1 + 0.5; x += 0.9) { const ring = []; for (let k = 0; k < 12; k++) { const a = k / 12 * 2 * PI; ring.push([x + Math.cos(a) * 0.05, 0.775, Z1 - 0.35 + Math.sin(a) * 0.05]); } g.tube(ring, 0.004, { segs: 3, closed: true }); } });
  const SC = ['#2f5d5a', '#c9552e', '#e7b547', '#2f5fa8', '#7a3a9a', '#a82a2a', '#2f8f8a', '#d6a640', '#3a4a6a'];
  let si = 0;
  for (let x = SX0 - 0.15; x < SX1 + 0.5; x += 0.9) { prop(s, 'lm-axle-front.strapchair', x, 0, Z1 - 1.05, 0, { cloth: SC[si % SC.length], strap: '#e9e1cf', tags: ['rail', 'tea', 'watch'] }, { noSpots: si !== 6 }); if (si % 3 === 1) prop(s, 'lm-axle-front.clipcup', x + 0.02, 0.77, Z1 - 0.35, 0, { glaze: CUPC[si % 6], lid: CUPC[(si + 2) % 6] }); si++; }
  seat(s, 17.1, 0, Z1 - 1.05, 0, 'Sit at the slit and buckle the strap', { onSit: (gm) => toast(gm, 'You buckle the lap strap. Without it you would drift off the cushion every time you reached for the cup.') });
  // ---- two small round tables, bolted down, three chairs each
  for (const tc of [[13.4, 4.6], [17.6, 3.6]]) {
    prop(s, 'table', tc[0], 0, tc[1], 0, { round: true, w: 0.9, d: 0.9, wood: '#6f4e33' });
    for (let k = 0; k < 3; k++) { const a = k * 2 * PI / 3 + 0.4; prop(s, 'lm-axle-front.strapchair', tc[0] + Math.sin(a) * 0.72, 0, tc[1] + Math.cos(a) * 0.72, a + PI, { cloth: SC[Math.floor(k + tc[0]) % SC.length], strap: '#d6a640', tags: ['tea', 'chat'] }, { noSpots: !(tc[0] < 15 && k < 2) }); }
    prop(s, 'lm-axle-front.clipcup', tc[0] + 0.12, 0.74, tc[1] - 0.05, 0, { glaze: '#e9e1cf', lid: '#c9552e' });
    prop(s, 'lm-axle-front.clipcup', tc[0] - 0.15, 0.74, tc[1] + 0.1, 0, { glaze: '#d6a640', lid: '#2f6f73' });
    s.detail(() => { g.mat('glaze', '#e9e1cf'); g.lathe(tc[0], tc[1] + 0.2, [[0, 0.74], [0.1, 0.74], [0.11, 0.76], [0.1, 0.77], [0, 0.77]], { segs: 14 }); g.mat('glaze', '#a82a2a'); g.lathe(tc[0], tc[1] + 0.2, [[0.1, 0.77], [0.08, 0.81], [0.02, 0.83], [0, 0.835]], { segs: 14, capBottom: false }); });
  }
  // the rail round everything
  handLine(s, [[X0 + 0.14, 1.0], [X0 + 0.14, Z1 - 0.9]], 1.0, { side: -1 });
  handLine(s, [[11.9 + 0.3, 0.3], [CX - 0.15, 0.3]], 1.0, { side: 1 });
  // the pictures: a printed plan of the flying hall, a long letter pinned up
  sign(s, { kind: 'poster', title: 'The front flying hall', lines: ['Netted, 300 m along the axis', 'The sunline starts at 450', 'Lengthwise is easy', 'Crosswise is a lesson'], palette: ['#1f2b40', '#e9e1cf', '#3fe0d0'] }, X0 + 0.18, 1.85, 2.6, { face: 'X', w: 0.62, h: 0.86 });
  // light: stem lamps under the felt, a strip over the counter; the slit brings in the flying hall's glow
  for (const p of [[12.6, 6.6], [15.6, 3.8], [19.0, 6.6]]) { prop(s, 'lm-axle-front.stemlamp', p[0], H, p[1], 0, {}); lamp(s, 'globe', p[0], H - 0.66, p[1], { K: 2700, power: 0.85, drop: 0.12, r: 0.13, clip }); }
  lamp(s, 'strip', CX + 0.6, H - 0.08, CZ0 + 0.3, { to: [CX + 0.6, H - 0.08, CZ1 - 0.3], K: 3000, power: 0.6, clip });
  roomGlow(s, X0, 0, 0, X1, H, Z1, { sky: '#ffd8a0', ground: '#a8794f', power: 0.25 });
  const slitLight = s.light({ at: [17.2, 1.4, Z1 + 0.2], color: warm(5200), power: 2.5, range: 6, clip, radius: 1.2 });
  s.every((dt, gm) => { const sun = gm && gm.clock ? gm.clock.sun() : 1; slitLight.color = slitLight.color || [1, 1, 1]; const k = 0.25 + 2.3 * sun, c = warm(5200 - 2400 * (1 - sun)); slitLight.color[0] = c[0] * k; slitLight.color[1] = c[1] * k; slitLight.color[2] = c[2] * k; });

  // ---- the slit and what is through it
  buildSlitView(game, s, f, SX0, SX1, SY0, SY1);
  s.interact({ x: 17.2, y: 1.35, z: Z1 - 0.7, radius: 1.6, prompt: 'Look through the slit', onUse: async (gm) => {
    const sun = gm.clock ? gm.clock.sun() : 1;
    await say(gm, 'The slit', sun > 0.14
      ? ['Through the cap, the front flying hall: a long sock of netting round the axis, lit from the far end by the Hollow. People in wing-sleeves go by lengthwise, slowly, most of them looking the other way.', 'The net runs about 300 metres out. The sunline starts at 450, and nobody flies within reach of it by day: at 75 metres it would burn in a minute.', 'Somebody has scratched a mark on the brass at seated eye height, where the end of the line just shows.']
      : ['Through the cap, the front flying hall in the dark, the net just showing against a few hand lamps far down the axis.', 'When the sunline is off, the whole Spindle opens and people fly the axis end to end. From here the lamps look like beads drifting on a string.']);
  } });

  s.path([[11.15, -1.5], [11.15, 1.2], [14.6, 3.2], [17.0, 7.6]]);
  s.zoneBox({ id: 'slow-pour', place: 'axle-front', box: [X0, -0.5, 0.1, X1, H, Z1], name: 'The Slow Pour', sub: 'The front axle · tea at a fiftieth of a g', ambience: 'flat', reverb: 'felt', headroom: H });
  s.loop('hum-lamp', 22.4, 2.6, 4.6, { vol: 0.12, radius: 5 });
  return { spawn: { x: 16.0, y: 0, z: 2.2, yaw: 3.0 } };
}

// Through the slit: the front flying hall, painted in the scope's own meshes. The net's hoops and guide ropes, the sock
// of netting, its far end, and beyond it the Hollow's glow by day or the dark with a few hand lamps by night.
function buildSlitView(game, s, f, SX0, SX1, SY0, SY1) {
  const g = s.g, C = 2 * PI * RHO;
  const NR = 74 - RHO;                          // the net at 74 m from the axis, 14 m below this floor
  // hoops round the axis every so often, and guide ropes along it
  for (const hz of [24, 60, 110, 170, 240, 310]) s.structure(() => { const pts = []; for (let k = 0; k < 120; k++) pts.push([-C / 2 + C * k / 120, -NR, hz]); g.mat('cast', '#5a5248'); g.tube(pts, 0.25, { segs: 5, closed: true }); });
  // the sock: a cut-out mesh all round, from the wall to the far end
  // guide ropes from the hoops in toward the axis, so the net's shape reads
  s.structure(() => { g.mat('weave', '#cfc4a8'); for (let k = 0; k < 48; k++) { const x = -C / 2 + C * (k + 0.5) / 48; g.tube([[x, -NR, 12], [x, -NR, 310]], 0.06, { segs: 4, caps: false }); } });
  // the far end of the net, and the light beyond it: day and night versions, shown by the sunline
  // by day the far end of the Hollow fills the view: the back wall, 3.75 km off and lit by the land, with the sunline
  // running down the axis into its middle. Painted as a disc 255 m across at 640 m, in rings, brightest at the centre.
  const DZ = 640, DR = 420;
  const day = ownMesh(s, (cg) => {
    const rings = [[0, 30, '#fff6e0', 2.4], [30, 80, '#f6e6c0', 1.7], [80, 150, '#e8d2a0', 1.2], [150, 260, '#c9b07c', 0.8], [260, DR, '#8a7454', 0.45]];
    for (const q of rings) { cg.mat('plain', q[2], { emissive: q[3] }); cg.box(-C / 2, RHO - q[1], DZ, C / 2, RHO - q[0], DZ + 0.5, { faces: 'z' }); }
    cg.mat('diffuser', '#fffbe8', { emissive: 10 }); cg.box(-C / 2, RHO - 1.2, 460, C / 2, RHO, DZ, { faces: 'y' });}, { origin: [0, 0, 0], center: [0, 0, 600], radius: 400, far: 3000 });
  const night = ownMesh(s, (cg) => {
    cg.mat('plain', '#1a2238', { emissive: 0.2 }); cg.box(-C / 2, RHO - DR, DZ, C / 2, RHO, DZ + 0.5, { faces: 'z' });
    cg.mat('diffuser', '#ffc27a', { emissive: 6 });
    const r = new Rng(9);
    // hand lamps of a few night flyers, out along the line of sight from the slit
    for (let i = 0; i < 46; i++) { const z = 30 + Math.pow(r.next(), 0.7) * 560, d = z - 10, x = 17 + r.f(-1, 1) * (3 + d * 0.35), y = 1.4 + r.f(-0.12, 0.3) * d, k = 0.25 + d * 0.004; cg.ball(x, Math.min(RHO - 2, y), z, k, k, k, { segs: 6, rings: 4 }); }
    // the wardens' red lamps on the hoops at the net's edge
    cg.mat('diffuser', '#ff3a2a', { emissive: 7 });
    for (const hz of [24, 60, 110, 170, 240, 310]) for (let k = 0; k < 24; k++) { const x = -C / 2 + C * (k + 0.5) / 24, s0 = 0.3 + hz * 0.003; cg.ball(x, -NR + 0.4, hz, s0, s0, s0, { segs: 6, rings: 4 }); }
  }, { origin: [0, 0, 0], center: [0, 20, 350], radius: 600, far: 3000, hidden: true });
  // flyers by day: a few figures in bright sleeves drifting along the hall, lengthwise
  const FL = [['#c9552e', 32, 0.6, 1.6], ['#2f8f8a', 44, -0.25, 1.1], ['#e7b547', 26, 0.15, 2.0], ['#7a3a9a', 50, -0.5, 1.4]];
  const flyers = FL.map((q, i) => ({ v: q[3], z: 40 + i * 70, m: ownMesh(s, (cg) => {
    cg.mat('weave', '#3a3430'); cg.ball(0, 0, 0, 0.22, 0.22, 0.85, { segs: 8, rings: 6 }); cg.ball(0, 0.05, -0.95, 0.13, 0.13, 0.13, { segs: 8, rings: 5 });
    cg.mat('weave', q[0]); cg.quad([-0.15, 0, -0.4], [-1.1, -0.05, 0.1], [-1.0, -0.05, 0.5], [-0.15, 0, 0.3], { double: true }); cg.quad([0.15, 0, -0.4], [0.15, 0, 0.3], [1.0, -0.05, 0.5], [1.1, -0.05, 0.1], { double: true });
  }, { origin: [q[2] * RHO, RHO - q[1], 40 + i * 70], radius: 2, far: 600 }) }));
  s.every((dt, gm) => {
    const sun = gm && gm.clock ? gm.clock.sun() : 1, lit = sun > 0.14;
    day.show(lit); night.show(!lit);
    for (const fl of flyers) { fl.m.show(lit); if (!lit) continue; fl.z += fl.v * dt; if (fl.z > 300) fl.z = 30; fl.m.origin[2] = fl.z; }
  });
}

// ===============================================================================================================
// The Hundreds: the visitors' book and the wall of plates
// ===============================================================================================================
const PLATES = [
  ['Hesper Oyelaran', 'Ninety Locks · 100'], ['Tomás Ilunga', 'Brineyard · 100'], ['Ama Rasmussen', 'Kettlewell · 100'], ['Ruth Achebe', 'Saltmarsh · 101'],
  ['Ivo Szabó', 'Copperdown · 100'], ['Noor Haddad', 'Lindenhall · 100'], ['Bao Lindqvist', 'Ropewalk · 100'], ['Esi Moreau', 'Hassock · 100'],
  ['Pavel Okafor', 'Tessera · 100'], ['Lumi Castellanos', 'Marrowfield · 100'], ['Dara Nakamura', 'Pennyfold · 100'], ['Selin Abara', 'Candlewick · 100'],
];
const BOOK = [
  ['Hesper Oyelaran, a hundred today, Ninety Locks, deck 211. My table brought the cake and somebody had to hold it down. Quiet, as promised.'],
  ['Tomás Ilunga, a hundred, Brineyard. I expected a hum. My granddaughter says I hummed instead, all the way round the Lap.'],
  ['Ama Rasmussen, 100. Came for the quiet and stayed for the tea. Lost my lid twice. Found it on the ceiling once.'],
  ['A guest from Sorrel, on a cousin\'s hundredth: ours is just as quiet and has worse tea. Do not tell them I said so.'],
  ['Ruth Achebe, a hundred and one. Missed last year with my hip. Came anyway. Plate please, a year late.'],
  ['A wanderer from Dulse, twenty, not a hundred. My aunt is, and could not come up, so she sent me to sit in the Cold Room for her and tell her what it sounded like. Nothing. I will tell her nothing, slowly.'],
  ['Pavel Okafor, 100, Tessera. Sat an hour by the rail. Counted the lamps. All there.'],
  ['Selin Abara, a hundred, Candlewick. Every kay I ever spent came in through that wall. It seemed only polite to visit.'],
];

export function buildHundreds(game, s, f) {
  const g = s.g, X0 = -24, X1 = -9.6, Z1 = 9.6;
  const clip = [X0 - 0.1, -0.3, -0.1, X1 + 0.1, H + 0.1, Z1 + 0.1];
  floor(s, X0, 0.16, X1, Z1, 0, 'terrazzo', '#b9ab92');
  s.deco(() => { g.mat('terrazzo', '#2f5d5a'); g.box(X0 + 0.6, 0.0, 0.8, X1 - 0.6, 0.006, Z1 - 0.8, { faces: 'Y' }); g.mat('terrazzo', '#b9ab92'); g.box(X0 + 0.75, 0.0, 0.95, X1 - 0.75, 0.008, Z1 - 0.95, { faces: 'Y' }); });
  ceiling(s, X0, 0, X1, Z1, H, 'paint', '#ebe1ca');
  frontWall(s, X0, X1, [{ at: 12.3, w: 1.5, h: 2.3 }], '#2f4a5a');
  sideWalls(s, X0, X1, Z1, '#2f4a5a', { h: 0.9, mat: 'wood', tint: '#5a3a28' });
  wall(s, X0, Z1 - 0.08, X1, Z1 - 0.08, 0, H, { mat: 'plaster', tint: '#2f4a5a', dado: { h: 0.6, mat: 'wood', tint: '#5a3a28' }, skirt: '#2a2420' });

  // ---- the wall of plates: a painted field of thousands, brass on dark wood, with this year's legible ones at eye level
  const WX0 = -22.6, WX1 = -11.0, WY0 = 0.7, WY1 = 2.85, wz = Z1 - 0.17;
  const R = game.atlas.add(1024, 192, (ctx, w, h) => paintPlates(ctx, w, h), 'axle-front.plates');
  s.deco(() => { g.atlas(R.page, { emissive: 0 }); g.quad([WX1, WY0, wz], [WX0, WY0, wz], [WX0, WY1, wz], [WX1, WY1, wz], { uv: [R.u0, R.v1, R.u1, R.v0] }); });
  s.structure(() => { g.mat('wood', '#3a2a20', { rough: -0.05 }); g.box(WX0 - 0.1, WY0 - 0.1, wz - 0.03, WX1 + 0.1, WY0, wz + 0.05, { bevel: 0.01 }); g.box(WX0 - 0.1, WY1, wz - 0.03, WX1 + 0.1, WY1 + 0.1, wz + 0.05, { bevel: 0.01 }); });
  // a brass picture rail with the lamp strip under it
  lamp(s, 'strip', WX0 + 0.2, WY1 + 0.25, wz - 0.25, { to: [WX1 - 0.2, WY1 + 0.25, wz - 0.25], K: 2800, power: 0.9, clip });
  // this year's plates, at eye height on a panel of their own
  const PX0 = -19.4, PY = 1.55;
  s.structure(() => { g.mat('wood', '#5a3a28'); g.box(PX0 - 0.15, PY - 0.42, wz - 0.06, PX0 + 5 * 0.88 + 0.05, PY + 0.4, wz - 0.01, { bevel: 0.01 }); });
  PLATES.forEach((p, i) => sign(s, { kind: 'plate', text: p[0], lines: [p[1]] }, PX0 + 0.3 + (i % 6) * 0.72, PY + 0.2 - Math.floor(i / 6) * 0.38, wz - 0.065, { face: 'z', w: 0.36, h: 0.15 }));
  sign(s, { kind: 'label', text: 'THIS YEAR', sub: 'the rest go home to their tables' }, PX0 + 2.1, PY + 0.55, wz - 0.07, { face: 'z', w: 1.2, h: 0.14 });
  s.interact({ x: -16.8, y: 1.5, z: Z1 - 0.9, radius: 2.2, prompt: 'Read the plates', onUse: async (gm) => {
    await say(gm, 'The plates', ['Thousands of small brass plates, row on row, each the size of two fingers: a name, a block, an age. A hundred, mostly. Here and there a hundred and one, from somebody who was ill on the day.', 'The custom, the card by the door says, is older than the Count. On your hundredth birthday your table may bring you up here, where the power comes in. You sit in the Cold Room as long as you like, sign the book, and the Hundreds fix a plate.', 'The plate stays up until you die, and then it goes home to your table with the rest of what is kept. A few hundred people a year come. Most of Chervil turns a hundred without any fuss at all.']);
  } });
  sign(s, { kind: 'notice', title: 'The Hundreds', lines: ['On your hundredth birthday', 'your table may bring you here.', 'Sit in the Cold Room. Sign the book.', 'A plate goes on the wall', 'and stays until you go home.', 'A hundred years of wallets', 'is about 790,000 kays,', 'and every one came in next door.'] }, X1 - 0.17, 1.55, 2.4, { face: 'x', w: 0.5, h: 0.7 });

  // ---- the visitors' book on its lectern, and a strap bench to sit by it
  prop(s, 'lm-axle-front.lectern', -16.8, 0, 4.4, PI, { wood: '#5a3a28' });
  lamp(s, 'globe', -16.8, 2.35, 4.6, { K: 2700, power: 0.7, drop: 0.85, r: 0.12, clip });
  let page = 0;
  s.interact({ x: -16.8, y: 1.1, z: 3.7, radius: 1.2, prompt: 'Read the visitors\' book', onUse: async (gm) => {
    const r = new Rng(page++ * 7 + 3), a = r.i(0, BOOK.length - 1); let b = r.i(0, BOOK.length - 1); if (b === a) b = (a + 3) % BOOK.length;
    await say(gm, 'The visitors\' book', ['A thick book bound in red cloth, the seventh this decade, open at this week. The pencil is on a string, the string on a clip.'].concat(BOOK[a], BOOK[b]));
  } });
  s.interact({ x: -17.6, y: 1.1, z: 3.9, radius: 0.9, prompt: (gm) => (gm.flags.axle_signed ? 'Read what you wrote' : 'Sign the visitors\' book'), onUse: async (gm) => {
    if (gm.flags.axle_signed) { toast(gm, 'A wanderer from Spelt, twenty, on guest-right. Not a hundred. Came for the quiet.'); return; }
    gm.flags.axle_signed = true; sfx(gm, 'paper', f, -16.8, 1.1, 4.4);
    toast(gm, 'You write: a wanderer from Spelt, twenty, on guest-right. Not a hundred. Came for the quiet.');
  } });
  const BC = ['#a82a2a', '#2f6f73', '#d6a640'];
  for (let i = 0; i < 3; i++) prop(s, 'lm-axle-front.strapchair', -21.6 + i * 0.8, 0, 2.2, 0, { cloth: BC[i], strap: '#e9e1cf', tags: ['rail', 'elders'] }, { noSpots: true });
  for (let i = 0; i < 3; i++) prop(s, 'lm-axle-front.strapchair', -13.6 + i * 0.8, 0, 2.2, 0, { cloth: BC[(i + 1) % 3], strap: '#e9e1cf', tags: ['rail', 'chat'] }, { noSpots: true });
  // a cake stand under a lid on a side table, for whoever is having their birthday
  prop(s, 'table', -21.0, 0, 5.8, 0, { w: 1.2, d: 0.6, wood: '#6f4e33' });
  s.detail(() => { g.mat('glaze', '#e9e1cf'); g.lathe(-21.0, 5.8, [[0.06, 0.74], [0.03, 0.76], [0.03, 0.86], [0.2, 0.87], [0.21, 0.89], [0, 0.89]], { segs: 18 }); g.mat('glaze', '#d6a640', { rough: -0.2 }); g.lathe(-21.0, 5.8, [[0.2, 0.89], [0.19, 0.96], [0.12, 1.04], [0.03, 1.07], [0.03, 1.1], [0, 1.11]], { segs: 18, capBottom: false }); });
  s.spot('stand', -16.8, 0, 3.4, PI, { tags: ['read', 'elders'] });
  handLine(s, [[X0 + 0.14, 0.8], [X0 + 0.14, Z1 - 0.8]], 1.0, { side: -1 });
  lamp(s, 'panel', -19.0, H, 4.2, { w: 1.2, d: 0.6, K: 3000, power: 0.6, clip });
  roomGlow(s, X0, 0, 0, X1, H, Z1, { sky: '#ffdcae', ground: '#7a5a48', power: 0.22 });
  s.path([[-10.95, -1.5], [-10.95, 1.4], [-16.4, 3.0]]);
  s.zoneBox({ id: 'axle-hundreds', place: 'axle-front', box: [X0, -0.5, 0.1, X1, H, Z1], name: 'The Hundreds', sub: 'The front axle · the book and the plates', ambience: 'none', reverb: 'room', headroom: H });
}

// The wall of plates, painted: rows of small brass plates on dark wood, each with two scratched lines of a name.
function paintPlates(ctx, w, h) {
  ctx.fillStyle = '#2a1e16'; ctx.fillRect(0, 0, w, h);
  const r = new Rng(100);
  const pw = 11, ph = 5, gx = 3, gy = 3;
  for (let y = 3; y + ph < h - 2; y += ph + gy) for (let x = 3 + ((y / (ph + gy)) % 2) * 2; x + pw < w - 2; x += pw + gx) {
    if (r.chance(0.035)) continue;                                    // a gap where a plate went home
    const k = r.f(0.75, 1.1), b = r.chance(0.08);
    const c = b ? [214, 176, 98] : [Math.round(176 * k), Math.round(138 * k), Math.round(69 * k)];
    ctx.fillStyle = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; ctx.fillRect(x, y, pw, ph);
    ctx.fillStyle = 'rgba(255,240,200,0.35)'; ctx.fillRect(x, y, pw, 1);
    ctx.fillStyle = 'rgba(40,26,10,0.7)'; ctx.fillRect(x + 2, y + 2, Math.round(r.f(4, pw - 3)), 1);
    if (r.chance(0.6)) ctx.fillRect(x + 2, y + 3.4, Math.round(r.f(2, 5)), 1);
  }
}

// ===============================================================================================================
// The warden's post: a hatch onto the Lap. Its rules hang on the Lap's far wall, opposite.
// ===============================================================================================================
export function buildWarden(game, s, f) {
  const g = s.g, X0 = -9.6, X1 = -5.0, Z1 = 4.4;
  const clip = [X0 - 0.1, -0.3, -0.2, X1 + 0.1, H + 0.1, Z1 + 0.1];
  floor(s, X0, 0.16, X1, Z1, 0, 'speckle', '#4a4844');
  ceiling(s, X0, 0, X1, Z1, H, 'paint', '#ebe1ca');
  frontWall(s, X0, X1, [{ at: 0.5, w: 3.4, h: 1.25, sill: 0.95 }], '#b8452e');
  sideWalls(s, X0, X1, Z1, '#b8452e', { h: 1.0, mat: 'panel', tint: '#3a3430' });
  wall(s, X0, Z1 - 0.08, X1, Z1 - 0.08, 0, H, { mat: 'plaster', tint: '#b8452e', dado: { h: 1.0, mat: 'panel', tint: '#3a3430' }, skirt: '#2a2420' });
  // the counter in the hatch
  s.furniture(() => { g.mat('wood', '#5a3a28', { rough: -0.06 }); g.box(X0 + 0.4, 0.92, -0.18, X1 - 0.4, 0.98, 0.5, { bevel: 0.012 }); });
  s.detail(() => {
    g.mat('paper', '#efe6d2'); g.box(-8.6, 0.98, 0.0, -8.1, 0.99, 0.3);
    g.mat('weave', '#d6a640'); for (let k = 0; k < 4; k++) g.box(-7.6 + k * 0.08, 0.98, 0.05, -7.55 + k * 0.08, 1.0, 0.4);
    g.mat('cast', '#c8a45a'); for (let k = 0; k < 4; k++) g.box(-7.61 + k * 0.08, 0.98, 0.0, -7.54 + k * 0.08, 1.01, 0.05);
  });
  prop(s, 'lm-axle-front.clipcup', -6.2, 0.98, 0.2, 0, { glaze: '#a82a2a', lid: '#e9e1cf' });
  // red lamps on hooks, a coil of line, spare lap straps, a box with a cross, the warden's own strap stool
  s.detail(() => {
    for (let k = 0; k < 5; k++) { const x = X0 + 0.6 + k * 0.32; g.mat('cast', '#3a3430'); g.tube([[x, 1.95, Z1 - 0.2], [x, 1.85, Z1 - 0.2]], 0.005, { segs: 3 }); g.mat('diffuser', '#c83020', { emissive: k === 2 ? 3 : 0 }); g.ball(x, 1.78, Z1 - 0.2, 0.05, 0.065, 0.05, { segs: 8, rings: 5 }); }
    g.mat('weave', '#cfc4a8'); for (let k = 0; k < 6; k++) g.lathe(-6.0, Z1 - 0.3, [[0.2 - k * 0.012, 1.2 + k * 0.035], [0.22 - k * 0.012, 1.218 + k * 0.035], [0.2 - k * 0.012, 1.235 + k * 0.035]], { segs: 14, capTop: false, capBottom: false });
    g.mat('paint', '#e8e0d0'); g.box(-7.2, 1.3, Z1 - 0.3, -6.7, 1.62, Z1 - 0.12, { bevel: 0.01 }); g.mat('paint', '#a82a2a'); g.box(-7.0, 1.38, Z1 - 0.31, -6.9, 1.54, Z1 - 0.3); g.box(-7.03, 1.42, Z1 - 0.31, -6.87, 1.5, Z1 - 0.3);
    g.mat('wood', '#6b4a2f'); g.box(X0 + 0.3, 1.05, Z1 - 0.32, X1 - 0.3, 1.09, Z1 - 0.12);
  });
  s.light({ at: [X0 + 1.24, 1.78, Z1 - 0.3], color: '#ff3020', power: 0.5, range: 2.5, clip, radius: 0.06 });
  lamp(s, 'globe', -7.3, 2.6, 2.0, { K: 3000, power: 0.7, drop: 0.4, r: 0.12, clip });
  roomGlow(s, X0, 0, 0, X1, H, Z1, { sky: '#ffcfa0', ground: '#8a4a30', power: 0.18 });
  s.spot('counter', -7.3, 0, 1.0, PI, { tags: ['warden'] });
  sign(s, { kind: 'street', text: 'WARDEN', sub: 'straps · lamps · the way back', palette: ['#8a2a20', '#f3e6c8'] }, -7.3, 2.6, -0.02, { face: 'z', w: 1.4, h: 0.3, glow: 0.8 });
  s.interact({ x: -7.3, y: 1.2, z: -0.6, radius: 1.4, prompt: 'Ask the warden about the weight here', onUse: async (gm) => {
    await say(gm, WARDEN, ['A fiftieth of a g. You can walk, slowly, if you keep a hand near a line. Do not jump. In the open a jump would take you thirty-five metres up and forty seconds to come down, and in here it takes you to the ceiling.', 'The floor up here goes round at three and a half metres a second. Walk spinward and you weigh twice what you weigh standing still. Run anti and you weigh next to nothing: run anti at three and a half and you would stop going round with us at all.', 'So the Lap has a rule. Walk it spinward. Children race it anti and I pretend not to see.']);
  } });
  s.zoneBox({ id: 'axle-warden', place: 'axle-front', box: [X0, -0.5, 0.1, X1, H, Z1], name: "The warden's post", sub: 'The front axle · the Lap', ambience: 'none', reverb: 'room', headroom: H });
}

// The rules board for weightless visitors, on the Lap's far wall opposite the warden's post.
export function wardenRules(game, s, f, x) {
  const rules = { kind: 'board', title: 'Weightless visitors', lines: ['A fiftieth of a g|0.02', 'Hold a line|hip height', 'Never jump|40 s down', 'Walk the Lap spinward|twice the weight', 'Strap in to sit|clip your lid', 'Do not touch the collars|20 K', 'Children with an adult|in the Lap'], palette: ['#2a1c18', '#f3e6c8', '#ff7a5a'] };
  sign(s, rules, x, 1.75, -2.96, { face: 'Z', w: 1.3, h: 0.95 });
  s.interact({ x, y: 1.6, z: -2.3, radius: 1.2, prompt: 'Read the rules for weightless visitors', onUse: async (gm) => {
    await say(gm, 'The rules', ['A fiftieth of a g. You are sixty metres from the axis, and you weigh about what a bag of flour weighs at the rim.', 'Hold a line: they run at hip height on every wall. Never jump. A cup knocked off a table takes nearly three seconds to reach the floor, and lands most of a hand\'s width anti.', 'Walk the Lap spinward: you will weigh about twice as much and keep your feet. Strap in to sit. Clip your lid. Do not touch the collars in the Cold Room: twenty kelvin. Children hold an adult\'s hand in the Lap.']);
  } });
}

// ===============================================================================================================
// The alcove: a bench and the board of the Lap
// ===============================================================================================================
export function buildAlcove(game, s, f) {
  const g = s.g, X0 = 5.0, X1 = 9.6, Z1 = 3.2;
  const clip = [X0 - 0.1, -0.3, -0.2, X1 + 0.1, H + 0.1, Z1 + 0.1];
  floor(s, X0, 0.16, X1, Z1, 0, 'speckle', '#3d5652');
  ceiling(s, X0, 0, X1, Z1, H, 'paint', '#ebe1ca');
  frontWall(s, X0, X1, [{ at: 0.4, w: 3.8, h: 2.6 }], '#2f5d5a');
  sideWalls(s, X0, X1, Z1, '#2f5d5a');
  wall(s, X0, Z1 - 0.08, X1, Z1 - 0.08, 0, H, { mat: 'plaster', tint: '#2f5d5a', dado: FELT, skirt: '#2a2420' });
  const board = { kind: 'board', title: 'The Lap · 377 metres round', lines: ['0|the lift lobby · the Cold Room', '10 spinward|the Slow Pour', '10 anti|the warden · the Hundreds', '94|a quarter: the lobby is round the bend', '188|halfway: the lobby is overhead', '283|three quarters', '377|here again'], palette: ['#16201d', '#f3e6c8', '#3fe0d0'] };
  sign(s, board, (X0 + X1) / 2, 1.85, Z1 - 0.17, { face: 'z', w: 2.2, h: 1.3 });
  prop(s, 'bench', (X0 + X1) / 2, 0, Z1 - 0.7, 0, { w: 2.6, back: false, wood: '#7a5233' }, { noSpots: true });
  
  lamp(s, 'sconce', X0 + 0.25, 2.3, 1.8, { face: 'X', K: 2800, power: 0.6, clip });
  s.interact({ x: (X0 + X1) / 2, y: 1.6, z: 1.6, radius: 1.6, prompt: 'Read the board of the Lap', onUse: async (gm) => {
    await say(gm, 'The board of the Lap', ['The Lap goes once round the axis, 377 metres, and comes back to this board. The floor curves up ahead of you whichever way you walk, so you can never see more than twenty-odd metres of it.', 'A quarter of the way round, the floor you stand on is a wall to the people in the lobby. Halfway, they are a hundred and twenty metres over your head and you are on their ceiling.', 'Windows on the inner wall all the way round look into the Cold Room. From every one of them a conductor is coming down to the floor somewhere near.']);
  } });
}
