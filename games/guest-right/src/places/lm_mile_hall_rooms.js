// The home end of the Measure: the cab lobby, the concourse with its two boards, the changing room, the keeper's
// counter (shoes and balls lent), the physio's room, the timekeeper's desk and the drinks stall.
//
// Concourse x[-28, 0] z[-12, 10], six metres to its ceiling; the track's mouth is the opening in its spinward wall
// (x = 0, z[-3.6, 5]). The lobby is x[-36, -28] z[-4.5, 4.5]. The Tin opens off the concourse's back wall (z = 10).
import { floor, ceiling, wall, lamp, roomGlow, block } from '../world/kit.js';
import { room } from '../world/kit2.js';
import { prop, defineProp, bunting } from '../world/props.js';
import { sign } from '../world/signs.js';
import { Rng } from '../core/util.js';
import { PI, TR, LANE_Z, C, SHEET, RECORDS, say, toast, sfx, find, custom, sub, seat, fmtTime, tick } from './lm_mile_hall_props.js';

const CX0 = -28, CX1 = 0, CZ0 = -12, CZ1 = 10, CH = 6.0;
export const HOME = { x0: CX0, x1: CX1, z0: CZ0, z1: CZ1, h: CH, tinA: [-27.6, -25.6], tinB: [-6.4, -4.4] };

const KEEPER = { name: 'Hedda, the keeper', colour: '#c98a2e' };
const TIMER = { name: 'The timekeeper', colour: '#3fe0d0' };
const PHYSIO = { name: 'Ama, the physio', colour: '#8fd694' };
const STALL = { name: 'The Jug', colour: '#e9b23c' };

export async function buildHome(ctx) {
  const { game, s, f } = ctx, g = s.g;
  const clip = [CX0 - 0.1, -0.3, CZ0 - 0.1, CX1 + 0.4, CH + 0.1, CZ1 + 0.1];
  const r = new Rng(5252);

  // ---- the concourse shell
  floor(s, CX0, CZ0, CX1, CZ1, 0, 'terrazzo', '#cdbb9b');
  ceiling(s, CX0, CZ0, CX1, CZ1, CH, 'panel', '#2f3b3c');
  const W = { tint: '#e2d1b0', dado: { h: 1.2, mat: 'tile', tint: '#7a2f3c' } };
  wall(s, CX0, CZ0, CX1, CZ0, 0, CH, W);
  wall(s, CX0, CZ0, CX0, -4.5, 0, CH, W); wall(s, CX0, 4.5, CX0, CZ1, 0, CH, W);
  wall(s, CX0, -4.5, CX0, 4.5, 3.4, CH - 3.4, { tint: '#e2d1b0', skirt: false });
  wall(s, CX1 + 0.08, CZ0, CX1 + 0.08, CZ1, 0, CH, Object.assign({}, W, { openings: [{ at: TR.front - CZ0, w: TR.wall - TR.front, h: TR.h }] }));
  wall(s, CX0, CZ1, CX1, CZ1, 0, CH, Object.assign({}, W, { openings: [{ at: HOME.tinA[0] - CX0, w: 2.0, h: 2.6 }, { at: HOME.tinB[0] - CX0, w: 2.0, h: 2.6 }] }));
  // the run-up: the lanes come back into the concourse for sixteen metres
  s.structure(() => {
    g.mat('speckle', C.track, { rough: 0.1 }); g.box(-16, 0, TR.front, 0, 0.003, TR.l1 + 0.25, { faces: 'Y' });
    g.mat('paint', C.line, { rough: -0.1 }); for (const z of [-3.2, -1.7, -0.2, 1.3, 2.8]) g.box(-16, 0.003, z - 0.025, 0, 0.005, z + 0.025, { faces: 'Y' });
    g.mat('paint', C.ochre); g.box(-16.1, 0.003, TR.front, -16, 0.005, TR.l1 + 0.25, { faces: 'Y' });
  });
  // beams across, ducts along, a painted band at the top of the walls
  s.structure(() => {
    g.mat('paint', C.beam, { rough: -0.05 }); for (let x = -26; x < 0; x += 4) g.box(x - 0.15, CH - 0.45, CZ0, x + 0.15, CH, CZ1, { faces: 'xXy' });
    g.mat('brushed', '#8a8478'); g.box(CX0, CH - 1.0, -10.6, CX1, CH - 0.5, -9.9, { faces: 'yzZ' });
    g.mat('paint', C.teal); for (const z of [CZ0 + 0.09, CZ1 - 0.09]) g.box(CX0, CH - 0.8, z - 0.01, CX1, CH - 0.6, z + 0.01, { faces: z < 0 ? 'Z' : 'z' });
  });
  // lamps: big pendants down the middle, a warm one over each room front
  for (const x of [-22, -13, -5]) for (const z of [-2.5, 4.5]) lamp(s, 'globe', x, 3.7, z, { K: 2800, power: 1.5, range: 10, drop: 2.3, r: 0.26, clip });
  roomGlow(s, CX0, 0, CZ0, CX1, CH, CZ1, { sky: '#ffd7a8', ground: '#c9a57c', power: 0.24 });
  // bunting in the pad colours over the run-up
  for (const x of [-14, -9, -4]) bunting(s, [x, 4.6, CZ0 + 0.2], [x, 4.6, CZ1 - 0.2], { colors: [C.teal, C.red, C.saffron, C.indigo, C.cream], sag: 0.8 });
  // the running clubs' banners, hung from the beams over the room fronts and over the Tin's doors
  const CLUBS = [['Ring Seven Whisks', C.red, '#f6ead0'], ['Ring Six Kettles', C.teal, '#f6ead0'], ['Ring Eight Pans', C.indigo, '#f1e2b8'], ['Ring Five Sieves', C.saffron, '#2a211b'], ['Ring Four Ladles', '#4f7f3a', '#f6ead0'], ['Ring Nine Tongs', '#5b4060', '#f1e2b8'], ['Ring Three Spoons', '#a3563a', '#f6ead0'], ['Ring Two Graters', '#2f5d5a', '#e9b23c']];
  CLUBS.forEach((c, i) => {
    const front = i < 5, x = front ? -26 + i * 5.4 : -22 + (i - 5) * 5.2, z = front ? -5.4 : 8.6;
    s.deco(() => { g.mat('wood', '#3a2d22'); g.box(x - 0.42, 5.62, z - 0.03, x + 0.42, 5.68, z + 0.03); g.mat('cast', C.iron); for (const dx of [-0.36, 0.36]) g.tube([[x + dx, 5.68, z], [x + dx, CH - 0.45, z]], 0.006, { segs: 3 }); });
    sign(s, { kind: 'banner', text: c[0], palette: [c[1], c[2]] }, x, 4.5, z, { face: 'Z', double: true, w: 0.8, h: 2.2, board: false });
  });
  await tick(game);

  lobby(ctx);
  boards(ctx, clip);
  await tick(game);
  changing(ctx);
  keeper(ctx);
  await tick(game);
  physio(ctx);
  timekeeper(ctx);
  stall(ctx, clip);
  await tick(game);

  // benches facing the boards, people in the concourse
  prop(s, 'bench', -6.5, 0, -7.9, PI / 2, { w: 2.2, wood: C.wood, back: true }, { spot: { tags: ['watch', 'mile', 'records'] } });
  seat(s, -6.5, 0.45, -7.9, PI / 2, 'Sit and look at the records');
  prop(s, 'bench', -6.2, 0, 7.4, PI / 2, { w: 2.2, wood: C.wood, back: true }, { spot: { tags: ['watch', 'mile'] } });
  seat(s, -6.2, 0.45, 7.4, PI / 2, 'Sit and look at the times');
  for (const p of [[-19, 2.4], [-21, -3.4], [-21, 6.2], [-3.2, 6.0], [-9.5, -4.9]]) { for (let k = 0; k < 3; k++) { const a = k * 2.1 + r.f(0, 1); s.spot('chat', p[0] + Math.sin(a) * 0.7, 0, p[1] + Math.cos(a) * 0.7, a + PI, { tags: ['chat', 'mile', 'runners'] }); } }
  for (const p of [[-12, -4.6, PI / 2], [-14.5, -4.5, PI / 2], [-10.5, 4.2, PI / 2], [-13, 4.4, PI / 2]]) s.spot('stand', p[0], 0, p[1], p[2], { tags: ['stretch', 'mile', 'runners'] });
  // walkways: lobby, along the middle to the mouth, to each room, to the Tin
  // (the lanes of the run-up are kept clear: people cross them, they do not walk down them)
  s.path([[-34, 0], [-28, 0], [-20, 0.6], [-17.5, 0.6], [-14, 4.4], [-8, 4.5], [-3, 4.6]]);
  s.path([[-20, 0.6], [-20.5, -3.5], [-18.5, -4.6], [-12, -4.7], [-6.6, -4.7], [-3.6, -4.4]], { width: 1.4 });
  s.path([[-20.5, -3.5], [-22.6, -4.6], [-22.6, -6.6]], { width: 1.2 });
  s.path([[-15.6, -4.65], [-15.6, -6.4]], { width: 1.2 });
  s.path([[-6.6, -4.7], [-6.6, -5.8]], { width: 1.2 });
  s.path([[-20, 0.6], [-24, 5], [-26.6, 8.6], [-26.6, 11.2]], { width: 1.4 });
  s.path([[-8, 4.5], [-5.4, 6], [-5.4, 8.6], [-5.4, 11.2]], { width: 1.4 });
  s.path([[-14, 4.4], [-11, 6.4], [-11, 7.6]], { width: 1.2 });
  s.zoneBox({ id: 'mile-concourse', box: [CX0, -0.5, CZ0, CX1 + 0.1, CH, CZ1], name: 'The Measure', sub: 'The home end · deck 52 · Ring Seven', ambience: 'hall', reverb: 'hall', headroom: CH });
  s.loop('murmur', -14, 1.5, 0, { vol: 0.3, radius: 24, param: 0.35 });
  void f;
}

// ---------------------------------------------------------------------------------------------------------------
function lobby(ctx) {
  const { s } = ctx, g = s.g, X0 = -36, X1 = CX0;
  const clip = room(s, { x0: X0, z0: -4.5, x1: X1, z1: 4.5, h: 3.4, floor: ['tile', '#b8a88a'], ceil: ['flute', '#d8c9a6'], wall: { tint: '#d9cfb8', dado: { h: 1.2, mat: 'panel', tint: '#2f5d5a' } }, open: { e: false }, glow: { sky: '#ffdcae', ground: '#a8794f', power: 0.3 } });
  lamp(s, 'panel', -32, 3.4, 0, { w: 1.8, d: 0.6, K: 3100, power: 1.0, clip });
  s.furniture(() => {
    for (const bz of [-2.2, 2.2]) {
      const bw = 1.3, x = X0 + 0.08;
      g.mat('stone', '#9c8f7c'); g.box(x, 0, bz - bw / 2 - 0.18, x + 0.16, 2.62, bz + bw / 2 + 0.18, { bevel: 0.01 });
      g.mat('cast', C.brass, { rough: -0.1 }); g.box(x + 0.16, 0.02, bz - bw / 2, x + 0.2, 2.36, bz - 0.01); g.box(x + 0.16, 0.02, bz + 0.01, x + 0.2, 2.36, bz + bw / 2);
      g.mat('cast', '#8a6d3b'); for (const yy of [0.5, 1.2, 1.9]) g.box(x + 0.2, yy, bz - bw / 2 + 0.06, x + 0.215, yy + 0.03, bz + bw / 2 - 0.06);
      g.mat('diffuser', '#ffd9a0', { emissive: 3, lamp: true }); g.box(x + 0.16, 2.44, bz - 0.2, x + 0.19, 2.52, bz + 0.2);
      g.mat('cast', '#3a3430'); g.box(x, 1.05, bz + bw / 2 + 0.25, x + 0.08, 1.3, bz + bw / 2 + 0.4, { bevel: 0.01 });
      g.mat('diffuser', '#3fe0d0', { emissive: 2 }); g.box(x + 0.08, 1.13, bz + bw / 2 + 0.3, x + 0.09, 1.2, bz + bw / 2 + 0.35);
    }
  });
  for (const bz of [-2.2, 2.2]) s.interact({ x: X0 + 0.8, y: 1.2, z: bz, radius: 1.6, prompt: 'Call a cab', onUse: (gm) => { if (gm.cab) gm.cab.open('mile-hall'); } });
  prop(s, 'bench', -33.5, 0, -4.05, 0, { w: 2.0, wood: C.wood, back: true }, { spot: { tags: ['wait', 'mile'] } });
  prop(s, 'plant', -29, 0, -3.9, 0, { kind: 'broad', size: 1.2, pot: C.red });
  prop(s, 'plant', -29, 0, 3.9, 0, { kind: 'fern', size: 1.0, pot: C.teal });
  sign(s, { kind: 'street', text: 'Cabs · the Measure', sub: 'the mile and the Tin · deck 52', palette: ['#22302c', '#f1ead8'] }, CX0 + 0.1, 4.2, 0, { face: 'X', w: 3.0, h: 0.6, glow: 0.8 });
  sign(s, { kind: 'plate', text: 'Deck 52 · 0.93 g', sub: 'Ring Seven · the Low decks' }, X0 + 0.02, 1.5, 3.6, { face: 'X' });
  s.zoneBox({ id: 'mile-lobby', box: [X0, -0.5, -4.5, X1, 3.4, 4.5], name: 'The Measure', sub: 'Cabs · deck 52 · Ring Seven', ambience: 'hall', reverb: 'room', headroom: 3.4 });
}

// ---------------------------------------------------------------------------------------------------------------
// the spinward wall: the records board, the day's times, the weight notice, the shuttle door, and the mouth
function boards(ctx, clip) {
  const { s, game } = ctx, g = s.g, X = CX1 - 0.02;
  // the records board: a painted panel in a gilt frame
  if (ctx.sheet) {
    const u = sub(ctx.sheet, SHEET.W, SHEET.H, 0, SHEET.recY, SHEET.W, SHEET.H - SHEET.recY), uv = [u.u0, u.v1, u.u1, u.v0];
    const za = -9.6, zb = -6.4, y0 = 1.62, y1 = 3.27;
    g.atlas(ctx.sheet.page, { emissive: 0.25 }); g.quad([X - 0.06, y0, za], [X - 0.06, y0, zb], [X - 0.06, y1, zb], [X - 0.06, y1, za], { uv }); s.flush({ tier: 's', cast: false });
  }
  if (ctx.live) {
    const u = sub(ctx.live, 1024, 512, 528, 0, 496, 512), uv = [u.u0, u.v1, u.u1, u.v0];
    const za = 6.9, zb = 8.5, y0 = 1.6, y1 = 3.25;
    g.atlas(ctx.live.page, { emissive: 0.3 }); g.quad([X - 0.06, y0, za], [X - 0.06, y0, zb], [X - 0.06, y1, zb], [X - 0.06, y1, za], { uv }); s.flush({ tier: 's', cast: false });
  }
  s.furniture(() => {
    g.mat('cast', '#c9a24a', { rough: -0.15 });
    for (const b of [[-9.7, -6.3, 1.52, 3.37], [6.8, 8.6, 1.5, 3.35]]) { g.box(X - 0.07, b[2], b[0], X, b[2] + 0.1, b[1], { bevel: 0.01 }); g.box(X - 0.07, b[3] - 0.1, b[0], X, b[3], b[1], { bevel: 0.01 }); g.box(X - 0.07, b[2], b[0], X, b[3], b[0] + 0.1, { bevel: 0.01 }); g.box(X - 0.07, b[2], b[1] - 0.1, X, b[3], b[1], { bevel: 0.01 }); }
    // a chalk ledge under the times
    g.mat('wood', '#4a3424'); g.box(X - 0.16, 1.38, 6.8, X, 1.43, 8.6, { bevel: 0.01 });
    g.mat('paint', '#f2e8d2'); for (let i = 0; i < 4; i++) g.box(X - 0.12, 1.43, 7.0 + i * 0.12, X - 0.02, 1.455, 7.05 + i * 0.12);
    // the shuttle door
    g.mat('cast', '#8a6d3b'); g.box(X - 0.08, 0, -5.4, X, 2.3, -4.1);
    g.mat('brushed', '#b9b2a4'); g.box(X - 0.1, 0.02, -5.3, X - 0.07, 2.2, -4.76); g.box(X - 0.1, 0.02, -4.74, X - 0.07, 2.2, -4.2);
    g.mat('diffuser', '#3fe0d0', { emissive: 2.4 }); g.box(X - 0.12, 2.36, -5.1, X - 0.09, 2.46, -4.4);
  });
  // lamps on the boards
  lamp(s, 'strip', X - 0.5, 3.75, -9.4, { to: [X - 0.5, 3.75, -6.6], K: 3000, power: 0.7, range: 4.5, clip });
  lamp(s, 'strip', X - 0.5, 3.7, 6.9, { to: [X - 0.5, 3.7, 8.5], K: 3000, power: 0.6, range: 4, clip });
  sign(s, { kind: 'street', text: 'Shuttle · the far line', sub: 'for the Light Mile · free' }, X - 0.01, 2.75, -4.75, { face: 'x', w: 1.4, h: 0.3, glow: 0.8 });
  sign(s, { kind: 'letters', text: 'THE MEASURE', font: 'caps', palette: ['#f1e2b8'] }, X - 0.02, 4.55, 0.7, { face: 'x', w: 6.4, h: 0.85, glow: 1.2 });
  sign(s, { kind: 'street', text: 'One mile spinward', sub: 'the Heavy Mile out · the Light Mile home', palette: ['#7a2f3c', '#f6ead0'] }, X - 0.01, 3.95, 0.7, { face: 'x', w: 3.2, h: 0.42, glow: 0.6 });
  const WEIGH = { kind: 'notice', title: 'What you weigh on the Measure', lines: ['Standing still: 0.93 g', 'Walking spinward: 0.95 · anti: 0.92', 'Running spinward at 5 m/s: 0.99', 'Record pace spinward: 1.02', 'Running anti at 5 m/s: 0.87', 'Record pace anti: 0.85', 'The floor turns at 160 m/s. You add to it or take from it.'] };
  sign(s, WEIGH, X - 0.01, 1.75, 5.75, { face: 'x', w: 0.9, h: 1.15 });
  // interacts
  s.interact({ x: X - 1.2, y: 1.6, z: -8.0, radius: 2.0, prompt: 'Read the records', onUse: async (gm) => {
    const h = RECORDS.heavy[0], l = RECORDS.light[0];
    await say(gm, 'The records', [
      'The Heavy Mile, spinward from the home line: ' + h[2] + ', ' + h[0] + ' of ' + h[1] + ', in the year ' + h[3] + ' after the Count. The Light Mile, anti from the far line: ' + l[2] + ', ' + l[0] + ', the year ' + l[3] + '.',
      'At record pace the Heavy Mile runner weighs a little over a full g, every stride of the way. The Light Mile runner weighs 0.85, what a child weighs at home on the Middle decks.',
      'So the Light Mile is fifteen seconds quicker, and Ring Seven has spent two hundred years arguing about whether that makes it the lesser record or the better one. The board does not say. The board is careful.',
    ]);
    find(gm, 'spin-heavier');
  } });
  s.interact({ x: X - 1.2, y: 1.6, z: 7.7, radius: 1.8, prompt: "Read the day's times", onUse: async (gm) => {
    const R = ctx.run; const best = (w) => gm.flags['mile.best.' + w];
    const lines = ['Chalked by the timekeeper and wiped at lamp-night: whoever ran today, fastest first, the Heavy Mile on top and the Light Mile under it. Most of them are not fast. Most of them came back the next day.'];
    if (best('heavy') || best('light')) lines.push('Your name is on it, as You · Spelt.' + (best('heavy') ? ' Heavy Mile ' + fmtTime(best('heavy')) + '.' : '') + (best('light') ? ' Light Mile ' + fmtTime(best('light')) + '.' : ''));
    else lines.push('There is room at the bottom of each list. The timekeeper chalks a guest\'s time the same as anyone\'s.');
    void R; await say(gm, "Today's times", lines);
  } });
  s.interact({ x: X - 0.9, y: 1.5, z: 5.75, radius: 1.2, prompt: 'Read the notice', onUse: async (gm) => {
    await say(gm, 'What you weigh on the Measure', [
      'Deck 52 is 2,796 metres from the axis, and standing still you weigh 0.93 of a g. The floor is carrying you round at 160 metres a second.',
      'Run spinward at five metres a second and you are going round at 165: you weigh 0.99, near enough what you weigh at the rim. Run anti at the same pace and you weigh 0.87.',
      'That is the whole of the Heavy Mile and the Light Mile. One is a mile carrying an extra sixteenth of yourself. The other is a mile with a sixteenth taken off.',
    ]);
    custom(gm, 'Spinward and anti');
  } });
  s.interact({ x: X - 0.7, y: 1.2, z: -4.75, radius: 1.2, prompt: 'Take the shuttle to the far line', onUse: (gm) => ctx.shuttle(gm, 'far') });
  // the curve: a trigger at the line, the first time
  s.trigger({ box: [-1.5, -0.5, TR.front, 6, 3, TR.l1], once: true, onEnter(gm) { toast(gm, 'From the line the lanes run away ahead and rise to meet the lamps, a quarter of a kilometre off, where the floor stands eleven metres above your feet.', 'found', 7); } });
  void game;
}

// ---------------------------------------------------------------------------------------------------------------
// lockers: p { n, paint }. Front toward +z.
defineProp('mile.lockers', (g, p) => {
  const n = p.n || 8, w = 0.46, H = 1.85, D = 0.45, cols = ['#2f6f73', '#7a2f3c', '#c98a2e', '#33407a', '#4f7f3a'];
  for (let i = 0; i < n; i++) {
    const x0 = -n * w / 2 + i * w;
    g.mat('panel', cols[(i * 3 + 1) % cols.length]); g.box(x0 + 0.01, 0.12, -D, x0 + w - 0.01, H, 0, { bevel: 0.012 });
    g.mat('cast', '#2a2a28'); for (let k = 0; k < 5; k++) g.box(x0 + 0.12, H - 0.25 - k * 0.04, 0, x0 + w - 0.12, H - 0.23 - k * 0.04, 0.008);
    g.mat('paper', '#efe6d2'); g.box(x0 + 0.12, 1.2, 0, x0 + 0.3, 1.28, 0.006);
    g.mat('cast', C.brass); g.box(x0 + w - 0.09, 0.95, 0, x0 + w - 0.06, 1.1, 0.03);
  }
  g.mat('wood', '#3a2d22'); g.box(-n * w / 2, 0, -D, n * w / 2, 0.12, 0.02);
  return { solid: [[-n * w / 2, 0, -D, n * w / 2, H, 0]], tier: 's', cast: true };
});
// a pair of running shoes, front toward +z. p: { a, b }
defineProp('mile.shoes', (g, p) => {
  for (const sx of [-0.06, 0.06]) {
    g.mat('weave', p.a || '#c9552e'); g.box(sx - 0.045, 0.012, -0.13, sx + 0.045, 0.075, 0.13, { bevel: 0.03 });
    g.mat('speckle', p.b || '#2a2622'); g.box(sx - 0.048, 0, -0.135, sx + 0.048, 0.016, 0.135, { bevel: 0.008 });
  }
  return { tier: 'd' };
});
// a physio's padded bench, front toward +z (long along x)
defineProp('mile.physio', (g, p) => {
  g.mat('cast', '#c8c2b8'); for (const x of [-0.85, 0.85]) for (const z of [-0.28, 0.28]) g.box(x - 0.025, 0, z - 0.025, x + 0.025, 0.62, z + 0.025);
  g.box(-0.9, 0.18, -0.3, 0.9, 0.2, 0.3);
  g.mat('weave', p.c || '#2f6f73', { rough: -0.1 }); g.box(-0.95, 0.62, -0.33, 0.95, 0.72, 0.33, { bevel: 0.04 });
  g.mat('weave', '#efe6d2'); g.box(-0.95, 0.72, -0.33, -0.55, 0.725, 0.33);
  g.mat('knit', '#e9b23c'); g.cyl(0.75, 0.72, 0, 0.08, 0.05, { segs: 10 });
  return { solid: [[-0.95, 0, -0.33, 0.95, 0.72, 0.33]], spots: [{ type: 'sit', x: 0.3, y: 0.72, z: 0.25, yaw: 0, tags: ['physio', 'mile'] }], tier: 's', cast: true };
});
// wall bars, front toward +z
defineProp('mile.wallbars', (g) => {
  g.mat('wood', '#a8794f'); for (const x of [-0.5, 0.5]) g.box(x - 0.04, 0, -0.1, x + 0.04, 2.6, 0.0);
  for (let i = 0; i < 12; i++) g.tube([[-0.46, 0.2 + i * 0.2, -0.05], [0.46, 0.2 + i * 0.2, -0.05]], 0.016, { segs: 6 });
  return { tier: 's', cast: true };
});
// a high desk with a sloped top. Front toward +z (the desk is stood at from -z).
defineProp('mile.desk', (g) => {
  g.mat('wood', '#5b4030'); g.box(-0.7, 0, -0.3, 0.7, 1.0, 0.3, { bevel: 0.015 });
  g.mat('wood', '#7a5233'); g.push(); g.move(0, 1.06, -0.05); g.rotX(-0.18); g.box(-0.75, -0.03, -0.36, 0.75, 0.03, 0.36, { bevel: 0.012 }); g.pop();
  g.mat('paper', '#efe6d2'); g.push(); g.move(0, 1.1, -0.06); g.rotX(-0.18); g.box(-0.42, 0, -0.2, 0.32, 0.02, 0.16); g.pop();
  g.mat('cast', '#2a2622'); g.box(-0.7, 0.9, 0.3, 0.7, 0.93, 0.32);
  return { solid: [[-0.7, 0, -0.32, 0.7, 1.1, 0.32]], tier: 's', cast: true };
});
// a stopwatch on a cord
function stopwatch(g, x, y, z) {
  g.mat('cast', '#c9c2b4', { rough: -0.3 }); g.cyl(x, y - 0.02, z, 0.035, 0.016, { segs: 12 });
  g.mat('paper', '#f6f1e4'); g.cyl(x, y - 0.004, z, 0.03, 0.002, { segs: 12 });
  g.mat('weave', '#7a2f3c'); g.tube([[x, y, z], [x, y + 0.24, z]], 0.003, { segs: 3 });
}

// ---------------------------------------------------------------------------------------------------------------
function changing(ctx) {
  const { s, f } = ctx, g = s.g, X0 = -27.8, X1 = -19.6, Z0 = -11.85, Z1 = -6.0;
  const clip = room(s, { x0: X0, z0: Z0, x1: X1, z1: Z1, h: 3.2, floor: ['tile', '#b9c4bc'], ceil: ['paint', '#e9e1cf'], wall: { tint: '#dfe2d6', dado: { h: 1.25, mat: 'tile', tint: '#2f6f73' } }, open: { s: [{ at: 4.6, w: 1.1, h: 2.2 }], n: false, w: false }, glow: { sky: '#fff0d8', ground: '#9fb0a8', power: 0.3 } });
  lamp(s, 'panel', -25.5, 3.2, -9, { w: 1.4, d: 0.5, K: 3600, power: 0.9, clip });
  lamp(s, 'panel', -21.6, 3.2, -9, { w: 1.4, d: 0.5, K: 3600, power: 0.7, clip });
  prop(s, 'mile.lockers', -24.0, 0, -11.75, 0, { n: 14, paint: C.teal });
  prop(s, 'bench', -25.2, 0, -8.7, 0, { w: 2.4, wood: '#a8794f' }, { spot: { tags: ['change', 'mile'] } });
  prop(s, 'bench', -21.8, 0, -8.7, 0, { w: 2.0, wood: '#a8794f' }, { spot: { tags: ['change', 'mile'] } });
  // pegs on the end wall with kit hanging, shoes under the benches, a towel bin
  s.detail(() => {
    g.mat('wood', '#5b4030'); g.box(X1 - 0.1, 1.7, -11.4, X1 - 0.02, 1.8, -6.6);
    const KIT = ['#c9552e', '#2f6f73', '#e9b23c', '#33407a', '#7a2f3c', '#4f7f3a', '#f2e8d2'];
    for (let i = 0; i < 7; i++) { const z = -11.1 + i * 0.66; g.mat('cast', C.brass); g.tube([[X1 - 0.1, 1.75, z], [X1 - 0.22, 1.78, z]], 0.012, { segs: 5 }); g.mat('weave', KIT[i]); g.sheet([X1 - 0.18, 1.78, z - 0.22], [X1 - 0.18, 1.78, z + 0.22], [X1 - 0.16, 1.05 + (i % 3) * 0.1, z + 0.2], [X1 - 0.16, 1.05 + (i % 3) * 0.1, z - 0.2], { sag: 0.02 }); }
    g.mat('cane', '#b8955a'); g.lathe(-27.2, -6.7, [[0.22, 0], [0.26, 0.05], [0.27, 0.5], [0.25, 0.52]], { segs: 14, capTop: false });
    g.mat('weave', '#efe6d2'); g.ball(-27.2, 0.5, -6.7, 0.2, 0.08, 0.2, { segs: 10, rings: 5 });
  });
  for (const p of [[-25.8, -8.35, 0.2, '#c9552e'], [-24.4, -8.4, -0.1, '#2f6f73'], [-22.2, -8.3, 0.3, '#e9b23c']]) prop(s, 'mile.shoes', p[0], 0, p[1], p[2], { a: p[3] }, { noCollide: true });
  sign(s, { kind: 'notice', title: 'Changing', lines: ['Lockers are lent for the day.', 'Leave the key in the door.', 'Kit left on the pegs goes to', 'the keeper at lamp-night,', 'then to the menders in a year.'] }, -19.6 - 0.1, 1.65, -10.6, { face: 'x', w: 0.6, h: 0.8 });
  sign(s, { kind: 'plate', text: 'Changing', sub: 'lockers lent for the day' }, -22.6 + 0.95, 1.55, Z1 + 0.09, { face: 'Z' });
  for (const p of [[-26.4, -9.8, 0], [-23.1, -7.2, PI], [-20.6, -10.2, -PI / 2]]) s.spot('stand', p[0], 0, p[1], p[2], { tags: ['change', 'mile'] });
  s.interact({ x: -24.0, y: 1.1, z: -11.0, radius: 1.6, prompt: 'Open a locker', onUse: async (gm) => {
    sfx(gm, 'clunk', f, -24, 1.0, -11.5);
    const LOCK = [['Empty, but for a lidded cup someone forgot and a card: Spare socks are with the keeper. Please wash them first.'], ['A folded shirt with a name inked in the collar, and under it two older names crossed out. A hand\'s width folded into every seam.'], ['A pair of shoes with the soles worn down on one side only. Somebody runs the Heavy Mile in lane one, every day, and leans.']];
    await say(gm, 'A locker', LOCK[Math.floor((gm.time * 7) % 3)]);
  } });
  s.zoneBox({ id: 'mile-changing', box: [X0, -0.5, Z0, X1, 3.2, Z1], name: 'Changing', sub: 'The Measure · lockers lent for the day', ambience: 'flat', reverb: 'tile', headroom: 3.2 });
}

// ---------------------------------------------------------------------------------------------------------------
function keeper(ctx) {
  const { s, f } = ctx, g = s.g, X0 = -19.2, X1 = -12.0, Z0 = -11.85, Z1 = -7.0;
  const clip = room(s, { x0: X0, z0: Z0, x1: X1, z1: Z1, h: 3.2, floor: ['planks', '#8a6440'], ceil: ['paint', '#e9e1cf'], wall: { tint: '#e8d7b6', dado: { h: 1.0, mat: 'wood', tint: '#5b4030' } }, open: { s: [{ at: 0.9, w: 5.4, h: 1.45, sill: 0.95 }], n: false }, glow: { sky: '#ffdcae', ground: '#a8794f', power: 0.32 } });
  lamp(s, 'globe', -15.6, 2.7, -9.4, { K: 2700, power: 0.9, drop: 0.5, r: 0.16, clip });
  lamp(s, 'bulb', -15.6, 2.4, -6.4, { K: 2800, power: 0.6, range: 4, clip: [X0, 0, Z0, X1, 3.2, -5] });
  prop(s, 'counter', -15.6, 0, -7.45, PI, { w: 5.4, d: 0.6, h: 0.95, body: '#7a2f3c', top: '#a8794f' }, { noSpots: true });
  // shelves of shoes on the back wall, in pairs, by size, mended
  prop(s, 'shelving', -17.4, 0, -11.6, 0, { w: 2.6, h: 2.4, d: 0.36, shelves: 5, wood: '#5b4030', back: true });
  prop(s, 'shelving', -13.9, 0, -11.6, 0, { w: 2.6, h: 2.4, d: 0.36, shelves: 5, wood: '#5b4030', back: true });
  const r = new Rng(77), SH = ['#c9552e', '#2f6f73', '#e9b23c', '#33407a', '#7a2f3c', '#4f7f3a', '#efe6d2', '#5b4060'];
  for (const sx of [-17.4, -13.9]) for (let k = 0; k < 5; k++) for (let i = 0; i < 6; i++) { if (r.chance(0.15)) continue; prop(s, 'mile.shoes', sx - 1.05 + i * 0.42, 0.06 + k * 0.47, -11.6, r.f(-0.2, 0.2), { a: r.pick(SH), b: r.pick(['#2a2622', '#5a4a3a']) }, { noCollide: true }); }
  // bins of balls by the door, a last with a shoe on it on the side bench
  for (const bx of [-18.5, -12.8]) {
    prop(s, 'crate', bx, 0, -8.8, 0.1, { w: 0.7, h: 0.5, d: 0.6, wood: '#8a6440' });
    s.detail(() => { const rr = new Rng(bx * 10); for (let i = 0; i < 7; i++) { g.mat('leather', '#d8b25a'); const px = bx + rr.f(-0.22, 0.22), pz = -8.8 + rr.f(-0.18, 0.18), py = 0.48 + rr.f(0, 0.12); g.ball(px, py, pz, 0.09, 0.09, 0.09, { segs: 10, rings: 7 }); g.mat('weave', '#b5532e'); g.ball(px, py, pz, 0.092, 0.02, 0.092, { segs: 10, rings: 3 }); } });
  }
  s.detail(() => {
    g.mat('wood', '#5b4030'); g.box(X1 - 0.6, 0.85, -11.0, X1 - 0.05, 0.9, -9.6);
    g.mat('cast', '#3a3430'); g.box(X1 - 0.4, 0.9, -10.4, X1 - 0.3, 1.1, -10.3); g.mat('weave', '#c9552e'); g.box(X1 - 0.45, 1.1, -10.5, X1 - 0.25, 1.18, -10.2, { bevel: 0.03 });
    g.mat('weave', '#e9b23c'); g.tube([[X1 - 0.35, 1.18, -10.2], [X1 - 0.33, 1.25, -9.95], [X1 - 0.5, 1.0, -9.8]], 0.004, { segs: 4 });
    // a ledger and a brass bell on the counter
    g.mat('paper', '#efe6d2'); g.box(-16.9, 0.95, -7.65, -16.4, 0.98, -7.3); g.mat('weave', '#5b2f2a'); g.box(-16.92, 0.948, -7.67, -16.38, 0.952, -7.28);
    g.mat('cast', C.brass, { rough: -0.25 }); g.lathe(-14.2, -7.4, [[0.07, 0.95], [0.065, 0.96], [0.05, 1.02], [0.02, 1.06], [0.008, 1.09], [0, 1.09]], { segs: 14 });
  });
  sign(s, { kind: 'hanging', text: 'The keeper', sub: 'shoes and balls lent', emblem: 'ball', palette: ['#7a2f3c', '#f6ead0'] }, -15.6, 2.75, -6.8, { face: 'Z', double: true, w: 1.1, h: 0.42 });
  sign(s, { kind: 'chalk', title: 'Lent today', lines: ['Shoes: 61 pairs', 'Balls: 23', 'Back by lamp-night', 'Mended: 4 pairs', 'Lost: none, yet'] }, X1 - 0.1, 1.6, -8.3, { face: 'x', w: 0.6, h: 0.8 });
  s.spot('counter', -15.6, 0, -8.3, 0, { tags: ['keeper', 'mile', 'lend'] });
  s.spot('work', -12.7, 0, -10.3, PI / 2, { tags: ['mend', 'mile', 'keeper'] });
  s.spot('customer', -16.4, 0, -6.4, PI, { tags: ['mile'] }); s.spot('queue', -15.2, 0, -5.6, PI, { tags: ['mile'] });
  // borrow shoes, borrow a ball, ask
  s.interact({ x: -16.6, y: 1.1, z: -6.6, radius: 1.3, prompt: (gm) => gm.flags['mile.shoes'] ? 'Give the shoes back' : 'Borrow running shoes', onUse: async (gm) => {
    if (gm.flags['mile.shoes']) { gm.flags['mile.shoes'] = false; sfx(gm, 'plate', f, -16.6, 1.0, -7.4); await say(gm, KEEPER, ['Back on the shelf by size. Thank you. If they rubbed, say so and I will put a note in them for the next one.']); return; }
    gm.flags['mile.shoes'] = true; sfx(gm, 'plate', f, -16.6, 1.0, -7.4);
    toast(gm, 'Running shoes, lent. A name in the heel, three names crossed out above it.', 'gain', 5);
    await say(gm, KEEPER, ['Here. These are about your size, and they have been round the Measure more times than anyone has counted.', 'New, a pair is twenty kays and a week\'s wait. Lent, they are nothing, and you bring them back. That is what the keeper is for.']);
  } });
  s.interact({ x: -14.4, y: 1.1, z: -6.6, radius: 1.3, prompt: (gm) => gm.flags.hasBall ? 'You have a ball already' : 'Borrow a spinball', onUse: async (gm) => {
    if (gm.flags.hasBall) { toast(gm, 'You have one. The Tin is through the back, either door.', 'info'); return; }
    gm.flags.hasBall = true; sfx(gm, 'ball-catch', f, -14.4, 1.0, -7.4);
    toast(gm, 'A spinball, lent. F, or the right mouse button, to throw.', 'gain', 6); custom(gm, 'Spinball');
    await say(gm, KEEPER, ['Take it into the Tin, not out on the Measure: a ball loose in lane one is how people learn to fall.', 'Throw it across the court and it goes where you mean. Throw it spinward and it gets heavy and dives. Anti, it floats. The children will show you. They will show you whether you ask or not.']);
  } });
  s.interact({ x: -15.6, y: 1.1, z: -6.4, radius: 1.0, prompt: 'Ask the keeper', onUse: async (gm) => {
    await say(gm, KEEPER, ['Sixty-one pairs out today, which is a slow day. On Booking Day it will be every pair I have and the school\'s as well.', 'People ask which mile is the real one. I lend the same shoes for both. The shoes wear out on the Heavy Mile first, if that is an answer.']);
  } });
  s.zoneBox({ id: 'mile-keeper', box: [X0, -0.5, Z0, X1, 3.2, Z1], name: "The keeper's counter", sub: 'The Measure · shoes and balls lent', ambience: 'shop', reverb: 'room', headroom: 3.2 });
}

// ---------------------------------------------------------------------------------------------------------------
function physio(ctx) {
  const { s, f } = ctx, g = s.g, X0 = -11.6, X1 = -5.2, Z0 = -11.85, Z1 = -6.2;
  const clip = room(s, { x0: X0, z0: Z0, x1: X1, z1: Z1, h: 3.2, floor: ['speckle', '#6f8a7a'], ceil: ['paint', '#eef0e6'], wall: { tint: '#e6ecdf', dado: { h: 1.1, mat: 'paint', tint: '#8fb3a0' } }, open: { s: [{ at: 0.4, w: 3.8, h: 1.5, sill: 0.95 }, { at: 4.7, w: 1.0, h: 2.15 }], n: false }, glow: { sky: '#f4f6ee', ground: '#9fb0a8', power: 0.32 } });
  s.glass(X0 + 0.45, 0.95, Z1, X0 + 4.15, 2.45, Z1, { tint: '#d8e6de' });
  s.solid(X0 + 0.4, 0, Z1 - 0.08, X0 + 4.2, 2.45, Z1 + 0.08);
  lamp(s, 'panel', -8.4, 3.2, -9.2, { w: 1.2, d: 0.6, K: 4000, power: 0.9, clip });
  prop(s, 'mile.physio', -8.8, 0, -10.6, 0, { c: '#2f6f73' });
  prop(s, 'mile.wallbars', -6.2, 0, -11.8, 0, {});
  prop(s, 'stool', -7.4, 0, -9.6, 0, { h: 0.55, wood: '#7a5a3a' });
  prop(s, 'plant', -10.9, 0, -7.0, 0, { kind: 'broad', size: 1.0, pot: '#2f6f73' });
  s.detail(() => {
    g.mat('knit', '#c9552e'); g.cyl(-5.7, 0, -7.4, 0.12, 0.6, { segs: 12 });
    g.mat('knit', '#33407a'); g.cyl(-5.45, 0, -7.6, 0.1, 0.45, { segs: 12 });
    g.mat('rush', '#7a6a4a'); g.box(-10.8, 0.005, -11.4, -8.9, 0.02, -9.8);
  });
  sign(s, { kind: 'poster', title: 'The Heavy Mile knee', lines: ['A tenth more on every stride,', 'for four minutes or for nine.', 'Run it every other day.', 'Run the Light Mile between.', 'Come and see Ama before,', 'not after.'], palette: ['#2f5d5a', '#f3ecdc'] }, -10.6, 1.75, Z0 + 0.12, { face: 'Z', w: 0.75, h: 1.0 });
  sign(s, { kind: 'plate', text: 'Ama Ferreira · physio', sub: 'knees, shins, ankles, advice' }, X0 + 5.2 + 0.85, 1.55, Z1 + 0.09, { face: 'Z' });
  s.spot('work', -8.0, 0, -9.7, PI, { tags: ['physio', 'mile', 'keeper'] });
  s.interact({ x: -8.8, y: 0.9, z: -10.0, radius: 1.2, prompt: (gm) => gm.player.seat ? 'Get up' : "Sit on the physio's bench", onUse: async (gm) => {
    const p = gm.player; if (p.seat) { p.stand(); return; }
    p.sit({ x: -8.6, y: 0.72, z: -10.5, yaw: PI, eye: 1.0 }); p.yaw = PI; p.pitch = 0.1;
    const ran = gm.flags.ran_heavy_mile || gm.flags.ran_light_mile;
    await say(gm, PHYSIO, ran ? ['You ran one. Let me see the knee. Bend it. Again.', 'Run the Heavy Mile at a jog and each stride lands with a sixteenth more of you than it would standing. At a sprint it is a tenth. Your knee counts every one.', 'Nothing wrong with it. Drink something from the Jug, and run the Light Mile tomorrow if you want to run at all.'] : ['Sit, sit. You have not run yet. Good: I like to see a knee before, not after.', 'Here is all of it. Spinward, you are heavier with every stride. A tenth heavier at a sprint, a sixteenth at a jog. Anti, the same off. The Heavy Mile wears out knees and the Light Mile wears out lungs.', 'Start slow. Everybody starts fast. Everybody stops at the quarter tap.']);
    if (p.seat) p.stand();
  } });
  s.zoneBox({ id: 'mile-physio', box: [X0, -0.5, Z0, X1, 3.2, Z1], name: "Ama's room", sub: 'The Measure · the physio', ambience: 'shop', reverb: 'room', headroom: 3.2 });
  void f;
}

// ---------------------------------------------------------------------------------------------------------------
function timekeeper(ctx) {
  const { s, f } = ctx, g = s.g, x = -2.6, z = -5.6;
  prop(s, 'mile.desk', x, 0, z, PI / 2, {});
  prop(s, 'stool', x - 0.75, 0, z, 0, { h: 0.75, wood: '#5b4030' });
  s.detail(() => {
    g.mat('cast', '#3a3430'); g.box(x - 0.12, 1.55, z - 0.9, x - 0.08, 1.6, z + 0.9);
    for (let i = 0; i < 5; i++) stopwatch(g, x - 0.1, 1.33, z - 0.7 + i * 0.35);
    g.mat('glaze', '#2f6f73'); g.lathe(x + 0.35, z + 0.5, [[0, 1.08], [0.035, 1.08], [0.04, 1.17], [0, 1.17]], { segs: 10 });
  });
  lamp(s, 'globe', x, 2.35, z, { K: 2900, power: 0.6, drop: 3.6, r: 0.13, range: 5 });
  sign(s, { kind: 'label', text: 'Timekeeper', sub: 'ask, do not shout' }, x + 0.33, 0.7, z, { face: 'X', w: 0.5, h: 0.16 });
  s.spot('work', x - 0.6, 0, z, PI / 2, { tags: ['time', 'keeper', 'mile'] });
  s.interact({ x: x + 0.6, y: 1.2, z, radius: 1.3, prompt: 'Ask the timekeeper', onUse: async (gm) => {
    const R = ctx.run;
    const lines = ['Press a button on the gate post and I start the clock for you: the left post for the Heavy Mile, spinward from here, the right for the Light Mile. For that one the shuttle takes you to the far line first and you run home.', 'There is a board at the far end and one here. Both show the same clock.'];
    if (R && R.last) lines.push('Your last one was ' + (R.last.way === 'heavy' ? 'the Heavy Mile' : 'the Light Mile') + ' in ' + fmtTime(R.last.sec) + '. I chalked it. I chalk everyone.');
    else lines.push('Nobody minds if you walk it. Half the names on today\'s board walked it, and the other half say they did not.');
    await say(gm, TIMER, lines);
  } });
  void f;
}

// ---------------------------------------------------------------------------------------------------------------
function stall(ctx, clip) {
  const { s, f } = ctx, g = s.g, X0 = -14, X1 = -8, ZF = 8.3;
  prop(s, 'counter', (X0 + X1) / 2, 0, ZF, PI, { w: X1 - X0, d: 0.6, h: 0.95, body: '#2f6f73', top: '#c9a070' }, { noSpots: true });
  block(s, X0 - 0.1, 0, ZF - 0.35, X0, 2.6, CZ1, 'paint', '#2f6f73');
  block(s, X1, 0, ZF - 0.35, X1 + 0.1, 2.6, CZ1, 'paint', '#2f6f73');
  s.furniture(() => {
    // the awning
    for (let i = 0; i < 12; i++) { const a = X0 + i * 0.5, b = a + 0.5; g.mat('weave', i % 2 ? '#f1e6cf' : '#c9552e'); g.quad([a, 2.6, ZF - 0.4], [b, 2.6, ZF - 0.4], [b, 2.9, CZ1 - 0.1], [a, 2.9, CZ1 - 0.1], { double: true }); }
    // the back shelf
    g.mat('wood', '#5b4030'); g.box(X0, 1.3, CZ1 - 0.45, X1, 1.34, CZ1 - 0.1); g.box(X0, 0.9, CZ1 - 0.45, X1, 0.94, CZ1 - 0.1);
  });
  s.detail(() => {
    // lidded urns on the counter, cups stacked, a pot of mint
    for (const p of [[X0 + 0.6, '#c9763e'], [X0 + 1.4, '#2f6f73'], [X0 + 2.2, '#e9b23c']]) { g.mat('glaze', '#e9e1cf', { rough: -0.1 }); g.lathe(p[0], ZF + 0.05, [[0, 0.95], [0.16, 0.95], [0.17, 1.35], [0.12, 1.42], [0, 1.42]], { segs: 14 }); g.mat('glaze', p[1]); g.lathe(p[0], ZF + 0.05, [[0.125, 1.42], [0.1, 1.47], [0.03, 1.5], [0, 1.52]], { segs: 14, capBottom: false }); g.mat('cast', C.brass); g.tube([[p[0], 1.05, ZF - 0.1], [p[0], 1.05, ZF - 0.2]], 0.012, { segs: 5 }); }
    for (let k = 0; k < 4; k++) for (let i = 0; i < 6; i++) { g.mat('glaze', ['#e9e1cf', '#c9552e', '#2f6f73', '#e9b23c'][(i + k) % 4]); g.lathe(X0 + 0.4 + i * 0.22, CZ1 - 0.27, [[0, 1.34 + k * 0], [0.04, 1.34], [0.05, 1.44], [0, 1.44]], { segs: 8 }); }
    g.mat('glaze', '#a3563a'); g.lathe(X1 - 0.6, ZF + 0.05, [[0.08, 0.95], [0.1, 1.1], [0, 1.1]], { segs: 10 });
    g.mat('leafB', '#ffffff', { sway: 0.4 }); g.card(X1 - 0.6, 1.08, ZF + 0.05, 0.25, 0.25, 0.3); g.card(X1 - 0.6, 1.08, ZF + 0.05, 0.25, 0.25, 1.9);
  });
  sign(s, { kind: 'hanging', text: 'The Jug', sub: 'drinks under lids', emblem: 'cup', palette: ['#c9552e', '#f6ead0'] }, (X0 + X1) / 2, 3.25, ZF - 0.45, { face: 'z', double: true, w: 1.1, h: 0.42 });
  sign(s, { kind: 'chalk', title: 'The Jug', lines: ['Salt and sugar 0.04', 'Mint water 0.06', 'Mill broth 0.12', 'Sweet tea 0.15', 'Broth free after a mile'] }, X1 + 0.11, 1.55, 9.0, { face: 'X', w: 0.6, h: 0.82 });
  lamp(s, 'bulb', (X0 + X1) / 2, 2.4, ZF + 0.6, { K: 2600, power: 0.8, range: 5, clip });
  s.spot('counter', (X0 + X1) / 2, 0, ZF + 0.8, PI, { tags: ['drinks', 'mile', 'keeper'] });
  s.spot('work', X0 + 1.2, 0, ZF + 1.0, PI, { tags: ['drinks', 'mile'] });
  for (let i = 0; i < 4; i++) s.spot('queue', (X0 + X1) / 2 + 0.4, 0, ZF - 0.9 - i * 0.8, 0, { tags: ['drinks', 'mile'] });
  const MENU = { title: 'The Jug', note: 'Every cup has a lid. Bring the cup back.', items: [
    { id: 'saltsugar', name: 'Salt and sugar water', desc: 'What the runners drink. Lidded, with a straw through the lid.', price: 0.04 },
    { id: 'mint', name: 'Mint water', desc: 'Cold, with a sprig cut from the pot on the counter.', price: 0.06 },
    { id: 'broth', name: 'A cup of Mill broth', desc: 'Salt for after. Free to anyone who has just run a mile.', price: 0.12 },
    { id: 'tea', name: 'Sweet tea', desc: 'Hot and lidded. In this air it is cold by the quarter tap, if you take it with you.', price: 0.15 },
  ] };
  s.interact({ x: (X0 + X1) / 2, y: 1.1, z: ZF - 0.6, radius: 1.5, prompt: 'Buy a drink', onUse: async (gm) => {
    if (!gm.ui) return;
    const R = ctx.run, fresh = R && R.last && gm.time - R.doneAt < 600;
    const items = MENU.items.map((it) => Object.assign({}, it, { price: it.id === 'broth' && fresh ? 0 : it.price, disabled: gm.wallet && it.price > gm.wallet.kwh + 1e-6 && !(it.id === 'broth' && fresh) }));
    gm.busy++;
    let id = null;
    try { id = await gm.ui.menu({ kicker: 'The Jug', title: MENU.title, note: MENU.note, items, wallet: gm.wallet ? gm.wallet.kwh : 0 }); } finally { gm.busy--; }
    if (!id) return;
    const it = items.find((q) => q.id === id); if (!it) return;
    if (it.price > 0 && gm.wallet && !gm.wallet.spend(it.price, it.name)) return;
    sfx(gm, 'pour', f, (X0 + X1) / 2, 1.0, ZF);
    const L = { saltsugar: ['Lid on, straw through it. It tastes of exactly what it is.'], mint: ['A sprig from the pot, pinched in front of you so you can smell it. Cold.'], broth: [fresh ? 'You ran one, so it is on the Jug. Sit down before you drink it.' : 'Mill broth, lidded, salty, the same broth as every ring counter in the drum.'], tea: ['Sweet tea under a lid. Drink it here. Out on the Measure it is cold before the quarter.'] };
    await say(gm, STALL, L[id] || ['Lid on.']);
  } });
  s.zoneBox({ id: 'mile-jug', box: [X0, -0.5, ZF - 1.4, X1, 3.0, CZ1], name: 'The Jug', sub: 'The Measure · drinks under lids', ambience: 'shop', reverb: 'room', headroom: 2.6 });
}
