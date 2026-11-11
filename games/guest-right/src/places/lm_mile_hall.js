// The Measure: Chervil's mile, on deck 52 under Ring Seven, at 0.93 of a g.
//
// A running hall 1,609 metres long laid round the drum. Run it spinward from the home line and every stride is heavier
// (the Heavy Mile); run it anti from the far line and every stride is lighter (the Light Mile). The two records are
// kept apart and argued about. From the home line the floor runs away ahead of you and rises, the lamp line with it,
// until a few hundred metres off it stands up like a wall with the lanes painted on it, and the low ceiling comes
// down to meet it.
//
// At the home end (lm_mile_hall_rooms.js): the cab lobby, the concourse with the records and the day's times, the
// changing room, the keeper's counter that lends shoes and balls, the physio's room, the timekeeper's desk and the
// drinks stall. Beside it the Tin (lm_mile_hall_tin.js), a spinball court under a vault drawn to the drum's own curve.
//
// Frame 'mile-hall': x spinward, z toward the back cap, y up. The track is x[0, 1620] z[-3.6, 5]; the home line is
// x = 0 and the far line x = 1,609.34.
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { warm } from '../world/kit.js';
import { deckRadius } from '../core/drum.js';
import { Rng } from '../core/util.js';
import { PI, REGION, MILE, BAY, NBAY, TR, LANE_Z, QUARTERS, C, SHEET, LIVE, GLYPHS, say, toast, sfx, find, custom, tick, fmtTime, floorSpeed, sub, seat, drawSheet, drawClock, drawTimes } from './lm_mile_hall_props.js';
import { buildHome } from './lm_mile_hall_rooms.js';
import { buildTin } from './lm_mile_hall_tin.js';

const ENV = { exposure: 1.0, autoKey: 0.16, bloom: 0.06, warmth: 0.06, contrast: 1.08, saturation: 1.1 };

export const place = {
  id: 'lm-mile-hall', name: 'The Measure', order: 10,
  region: REGION,
  stops: [
    { id: 'mile-hall', name: 'The Measure', sub: 'the mile and the Tin · deck 52 · Ring Seven', group: 'The Low decks', spawn: 'mile-hall', deck: 52, zd: 2710 },
  ],
  async build(game) {
    const t0 = performance.now();
    const W = game.world;
    const f = W.frame('mile-hall', deckRadius(52), -1.9, 2710);
    const s = W.scope('mile-hall', f);
    const ctx = { game, f, s, sheet: null, live: null, run: null };
    ctx.startRun = (gm, way) => startRun(gm, ctx, way);
    ctx.shuttle = (gm, to) => shuttle(gm, ctx, to);
    ctx.floorWord = floorWord;

    // the two painted rects: what never changes, and the clocks and the day's times
    if (game.atlas) {
      ctx.sheet = game.atlas.add(SHEET.W, SHEET.H, drawSheet, 'mile.sheet');
      ctx.run = runState(game);
      ctx.live = game.atlas.add(LIVE.W, LIVE.H, (c, w, h) => drawLive(c, w, h, ctx), 'mile.live');
    } else ctx.run = runState(game);

    await track(ctx);
    await buildHome(ctx);
    await tick(game);
    await buildTin(ctx);
    await tick(game);
    runs(ctx);

    s.zoneBox({ id: 'mile-track', box: [0, -0.5, TR.front, 1621, TR.h, TR.wall], name: 'The Measure', sub: 'Deck 52 · Ring Seven · one mile spinward', ambience: 'arcade', reverb: 'ring', headroom: TR.h, env: ENV });
    s.zoneBox({ id: 'mile-far', box: [MILE - 12, -0.5, TR.front, 1636, TR.h, TR.wall], name: 'The Measure', sub: 'The far line · 1,609 metres from home', ambience: 'arcade', reverb: 'ring', headroom: TR.h, env: ENV });
    for (const x of [8, MILE / 2, MILE - 8]) s.loop('air', x, 3.2, 0, { vol: 0.22, radius: 40 });

    let left = s.finish(48);
    while (left) { await tick(game); left = s.finish(48); }
    game.spawns['mile-hall'] = { frame: f, x: -32, y: 0, z: 0, yaw: PI / 2 };
    game.spawns['mile-hall-start'] = { frame: f, x: -1.0, y: 0, z: LANE_Z[1], yaw: PI / 2 };
    game.spawns['mile-hall-far'] = { frame: f, x: MILE + 1.0, y: 0, z: LANE_Z[1], yaw: -PI / 2 };
    game.spawns['mile-hall-tin'] = { frame: f, x: -16, y: 0, z: 19, yaw: PI };
    console.log('[lm-mile-hall] built in ' + (performance.now() - t0).toFixed(0) + ' ms');
  },
};

// ---------------------------------------------------------------------------------------------------------------
// painting on the floor: one glyph of the sheet as a flat quad. dir +1 reads for a runner going spinward, -1 anti.
// ---------------------------------------------------------------------------------------------------------------
function glyphUV(R, ch, row) {
  let i = GLYPHS.indexOf(ch); if (i < 0) i = GLYPHS.length - 1;
  return sub(R, SHEET.W, SHEET.H, i * SHEET.cellW + 2, row * SHEET.cellH + 2, SHEET.cellW - 4, SHEET.cellH - 4);
}
// (cx, cz): centre; w across the track (z), h along it (x)
function floorQuad(g, u, cx, y, cz, w, h, dir) {
  const uv = [u.u0, u.v1, u.u1, u.v0];
  if (dir > 0) g.quad([cx - h / 2, y, cz - w / 2], [cx - h / 2, y, cz + w / 2], [cx + h / 2, y, cz + w / 2], [cx + h / 2, y, cz - w / 2], { uv });
  else g.quad([cx + h / 2, y, cz + w / 2], [cx + h / 2, y, cz - w / 2], [cx - h / 2, y, cz - w / 2], [cx - h / 2, y, cz + w / 2], { uv });
}
export function floorWord(s, R, text, row, cx, cz, w, h, dir, gap) {
  if (!R) return; const g = s.g; g.atlas(R.page, { rough: 0.5 }); g._mat[2] |= 16;
  const n = text.length, step = w * (gap || 1.04);
  for (let k = 0; k < n; k++) {
    const off = (k - (n - 1) / 2) * step * dir;          // reading left to right: +z going spinward, -z going anti
    floorQuad(g, glyphUV(R, text[k], row), cx, 0.004, cz + off, w, h, dir);
  }
  s.flush({ tier: 's', cast: false });
}

// ---------------------------------------------------------------------------------------------------------------
// the track: 81 bays, the lamp line and its lights, marks every hundred metres, the quarters, benches, taps, doors
// ---------------------------------------------------------------------------------------------------------------
async function track(ctx) {
  const { game, s, f } = ctx, g = s.g, R = ctx.sheet;
  const clip = [-0.3, -0.5, TR.front - 0.1, BAY * NBAY + 0.3, TR.h + 0.1, TR.wall + 0.1];
  const r = new Rng(5209);
  for (let i = 0; i < NBAY; i++) {
    const x0 = i * BAY;
    prop(s, 'mile.bay', x0, 0, 0, 0, { c: i % 4, gap: i > 0 && i % 10 === 0, door: i % 10 === 5 && i < 80 }, { noCollide: true });
    prop(s, 'mile.lamps', x0, 0, 0, 0, {}, { noCollide: true });
    // light: one pool under every second fitting, with dark between
    for (const lx of [7.5, 17.5]) s.light({ at: [x0 + lx, TR.h - 0.3, TR.mid], to: [x0 + lx + 0.01, TR.h - 0.3, TR.mid], color: warm(3000), power: 5.2, range: 8.5, clip, lamp: true, radius: 0.3 });
    // collision: floor, walls, ceiling, rail (with its gap)
    s.solid(x0, -0.5, TR.front - 0.3, x0 + BAY, 0, TR.wall + 0.3, { surf: 'carpet' });
    s.solid(x0, 0, TR.front - 0.3, x0 + BAY, TR.h, TR.front + 0.1);
    s.solid(x0, 0, TR.wall, x0 + BAY, TR.h, TR.wall + 0.3);
    s.solid(x0, TR.h - 0.05, TR.front - 0.3, x0 + BAY, TR.h + 0.6, TR.wall + 0.3);
    const ra = i > 0 && i % 10 === 0 ? x0 + 1.4 : x0;
    s.solid(ra, 0, TR.rail - 0.04, x0 + BAY, 1.08, TR.rail + 0.04);
    if (i % 10 === 5 && i < 80) {
      const dx = x0 + 10;
      sign(s, { kind: 'plate', text: 'Stair · decks 51 and 53', sub: 'not a short cut, please' }, dx + 0.95, 1.5, TR.wall - 0.01, { face: 'z' });
      s.interact({ x: dx, y: 1.2, z: TR.wall - 0.6, radius: 1.1, prompt: 'Try the stair door', onUse: async (gm) => {
        sfx(gm, 'clunk', f, dx, 1.0, TR.wall - 0.1);
        await say(gm, 'The stair door', ['Locked from this side while the clock runs. A card on it: Runners who find a stair to be a short cut will find the timekeeper knows the stairs too.']);
      } });
    }
    if (i % 2) await tick(game);
  }
  s.ambient({ box: clip, sky: '#ffd9a8', ground: '#a4442e', power: 0.2, lamp: true, soft: 0.3, spec: 0.4 });

  // the home and far lines, and the hundreds
  s.structure(() => {
    g.mat('paint', C.line, { rough: -0.1 });
    g.box(-0.06, 0, TR.l0, 0.06, 0.005, TR.l1, { faces: 'Y' }); g.box(MILE - 0.06, 0, TR.l0, MILE + 0.06, 0.005, TR.l1, { faces: 'Y' });
  });
  for (let d = 100; d <= 1600; d += 100) {
    s.structure(() => { g.mat('paint', C.line, { rough: -0.1 }); g.box(d - 0.05, 0, TR.l0, d + 0.05, 0.004, TR.l1, { faces: 'Y' }); });
    const t = String(d);
    floorWord(s, R, t, 0, d + 2.1, TR.mid, 1.15, 2.4, 1);
    floorWord(s, R, t, 0, d - 2.1, TR.mid, 1.15, 2.4, -1);
    // and on a dark plate high on the front wall, where a runner's eye is
    const pw = t.length * 0.42 + 0.4;
    s.structure(() => { g.mat('paint', C.dark, { rough: 0.2 }); g.box(d - pw / 2, 1.95, TR.front, d + pw / 2, 2.85, TR.front + 0.03, { bevel: 0.01 }); g.mat('cast', C.brass); g.box(d - pw / 2 - 0.02, 1.93, TR.front, d + pw / 2 + 0.02, 1.97, TR.front + 0.04); });
    if (R) { g.atlas(R.page, { rough: 0.5, emissive: 0.4 }); g._mat[2] |= 16; for (let k = 0; k < t.length; k++) { const u = glyphUV(R, t[k], 0), cx = d + (k - (t.length - 1) / 2) * 0.42, zf = TR.front + 0.035; g.quad([cx - 0.2, 2.02, zf], [cx + 0.2, 2.02, zf], [cx + 0.2, 2.78, zf], [cx - 0.2, 2.78, zf], { uv: [u.u0, u.v1, u.u1, u.v0] }); } s.flush({ tier: 's', cast: false }); }
  }
  await tick(game);
  // lane numbers behind each line, in ochre
  for (let k = 0; k < 4; k++) { floorWord(s, R, String(k + 1), 1, 1.7, LANE_Z[k], 0.75, 1.3, 1); floorWord(s, R, String(k + 1), 1, MILE - 1.7, LANE_Z[k], 0.75, 1.3, -1); }
  // the quarters: an ochre line, the fraction each way, a tap and a bench on the walk
  const FR = ['¼', '½', '¾'];
  QUARTERS.forEach((qx, k) => {
    s.structure(() => { g.mat('paint', C.ochre, { rough: -0.1 }); g.box(qx - 0.07, 0, TR.l0, qx + 0.07, 0.0045, TR.l1, { faces: 'Y' }); });
    // the fraction on an ochre plate on the outer wall, over the tap
    s.structure(() => { g.mat('paint', C.ochre, { rough: 0.1 }); g.box(qx + 2.45, 2.0, TR.wall - 0.03, qx + 3.55, 2.9, TR.wall, { bevel: 0.01 }); });
    if (R) { const u = glyphUV(R, FR[k], 0), zf = TR.wall - 0.035; g.atlas(R.page, { rough: 0.5 }); g._mat[2] |= 16; g.quad([qx + 3.3, 2.06, zf], [qx + 2.7, 2.06, zf], [qx + 2.7, 2.84, zf], [qx + 3.3, 2.84, zf], { uv: [u.u0, u.v1, u.u1, u.v0] }); s.flush({ tier: 's', cast: false }); }
    tap(ctx, qx + 3, k);
  });
  // benches on the walk every hundred metres, against the outer wall; chat and watching spots near the ends
  for (let d = 50; d < 1600; d += 100) {
    prop(s, 'mile.bench', d, 0, TR.wall - 0.4, PI, { w: 2.2, cloth: r.chance(0.5) ? r.pick([C.red, C.teal, C.saffron]) : undefined });
    seat(s, d, 0.47, TR.wall - 0.45, PI, 'Sit on the bench');
  }
  for (const x of [6, 14, 26, 60, MILE - 30, MILE - 12]) for (let k = 0; k < 3; k++) { const a = k * 2.1 + 0.3; s.spot('chat', x + Math.sin(a) * 0.7, 0, 3.9 + Math.cos(a) * 0.45, a + PI, { tags: ['watch', 'mile', 'chat'] }); }
  for (let x = 4; x < 120; x += 7) s.spot('stand', x + r.f(-1, 1), 0, 3.4, PI, { tags: ['watch', 'rail', 'mile'] });
  for (let x = MILE - 60; x < MILE - 2; x += 8) s.spot('stand', x + r.f(-1, 1), 0, 3.4, PI, { tags: ['watch', 'rail', 'mile'] });
  // the walk is a walkway the whole way
  const walk = []; for (let x = 0; x <= 1620; x += 20) walk.push([x, 3.95]); s.path(walk, { width: 1.4 });
  s.path([[0, 3.95], [-3, 4.6], [-8, 4.6]], { width: 1.6 });
  await tick(game);
  // the gantries over the two lines, with the clock faces
  gantry(ctx, 0, true);
  gantry(ctx, MILE, false);
  farEnd(ctx);
}

// A tap on the outer wall, a cup and a few words.
function tap(ctx, x, k) {
  const { s, f } = ctx;
  prop(s, 'mile.tap', x, 0, TR.wall, PI, {});
  s.spot('stand', x - 1.1, 0, 4.1, PI * 0.8, { tags: ['drink', 'mile'] });
  const lines = [
    ['Cold water from the commons, free. A card over the cups: Drink at the quarter. Do not stop at the half, the clock does not.'],
    ['The tap at the half. Somebody has scratched a tally of the runs they have done into the tile, small and neat. It is a long tally.'],
    ['Cold, and tasting faintly of the pipe. Three quarters gone. From here the far line is under the lamps, about four hundred metres on, and it looks uphill both ways.'],
  ];
  s.interact({ x, y: 1.1, z: TR.wall - 0.6, radius: 1.1, prompt: 'Drink from the tap', onUse: async (gm) => {
    sfx(gm, 'pour', f, x, 1.1, TR.wall - 0.2);
    await say(gm, 'The tap', lines[k] || lines[0]);
  } });
}

// A start and finish gate over one of the lines: the gantry, its clock (two faces of one picture), the buttons.
function gantry(ctx, x, home) {
  const { s } = ctx, g = s.g, L = ctx.live;
  prop(s, 'mile.gantry', x, 0, 0, 0, { col: home ? C.red : C.indigo }, { tier: 's' });
  if (L) {
    const u = sub(L, LIVE.W, LIVE.H, 0, home ? 0 : LIVE.farY, LIVE.clockW, LIVE.clockH), uv = [u.u0, u.v1, u.u1, u.v0];
    const za = -0.98, zb = 0.58, y0 = 2.38, y1 = 2.88;
    g.atlas(L.page, { emissive: 1.5 });
    g.quad([x - 0.125, y0, za], [x - 0.125, y0, zb], [x - 0.125, y1, zb], [x - 0.125, y1, za], { uv });
    g.quad([x + 0.125, y0, zb], [x + 0.125, y0, za], [x + 0.125, y1, za], [x + 0.125, y1, zb], { uv });
    s.flush({ tier: 's', cast: false });
  }
  // the brass button boxes on the posts
  s.deco(() => {
    for (const z of [TR.l0 - 0.15, TR.l1 + 0.12]) {
      g.mat('cast', C.brass, { rough: -0.2 }); g.box(x - 0.2, 1.05, z - 0.09, x - 0.09, 1.3, z + 0.09, { bevel: 0.01 }); g.box(x + 0.09, 1.05, z - 0.09, x + 0.2, 1.3, z + 0.09, { bevel: 0.01 });
      g.mat('diffuser', home ? '#ffcf6a' : '#5fc4c8', { emissive: 3 }); g.cyl(x - 0.21, 1.18, z, 0.035, 0.012, { segs: 10 }); g.cyl(x + 0.2, 1.18, z, 0.035, 0.012, { segs: 10 });
    }
  });
}

// The far end: overrun, the end wall with the shuttle door, a bench and a tap, a lamp, a sign.
function farEnd(ctx) {
  const { s, game, f } = ctx, g = s.g, XE = BAY * NBAY;
  s.structure(() => {
    g.mat('plaster', C.plaster); g.box(XE, 0, TR.front, XE + 0.2, TR.h, TR.wall, { faces: 'x' });
    g.mat('weave', C.indigo, { rough: 0.2 }); for (let i = 0; i < 4; i++) { const z0 = TR.l0 + i * 1.5; g.box(XE - 0.1, 0.12, z0 + 0.04, XE, 1.6, z0 + 1.46, { faces: 'xyYzZ', bevel: 0.03 }); }
    g.mat('cast', C.brass, { rough: -0.15 }); g.box(XE - 0.13, 1.6, TR.front, XE, 1.66, TR.l1 + 0.2, { faces: 'xyY' });
    // the shuttle door: a narrow brass-framed slide door on the walk side
    g.mat('cast', '#8a6d3b'); g.box(XE - 0.08, 0, 3.4, XE, 2.3, 4.7, { faces: 'xyYzZ' });
    g.mat('brushed', '#b9b2a4'); g.box(XE - 0.1, 0.02, 3.5, XE - 0.07, 2.2, 4.04); g.box(XE - 0.1, 0.02, 4.06, XE - 0.07, 2.2, 4.6);
    g.mat('diffuser', '#3fe0d0', { emissive: 2.4 }); g.box(XE - 0.12, 2.36, 3.7, XE - 0.09, 2.46, 4.4);
  });
  s.solid(XE, 0, TR.front, XE + 0.3, TR.h, TR.wall);
  sign(s, { kind: 'street', text: 'Shuttle · home', sub: 'the home line and the Tin · ninety seconds' }, XE - 0.03, 2.75, 4.05, { face: 'x', w: 1.5, h: 0.32, glow: 0.8 });
  sign(s, { kind: 'board', title: 'The far line', lines: ['From home|1,609 m', 'Light Mile|start here', 'Heavy Mile|finish here', 'Shuttle home|free'], palette: ['#1b1f2a', '#f3e6c8', '#5fc4c8'] }, XE - 0.03, 2.05, -1.2, { face: 'x', w: 1.3, h: 0.95 });
  prop(s, 'mile.tap', XE - 6, 0, TR.wall, PI, {});
  s.interact({ x: XE - 6, y: 1.1, z: TR.wall - 0.6, radius: 1.1, prompt: 'Drink from the tap', onUse: async (gm) => { sfx(gm, 'pour', f, XE - 6, 1.1, TR.wall - 0.2); await say(gm, 'The tap', ['Cold. Someone has stuck a paper star over the tap at the far end, for getting here.']); } });
  s.interact({ x: XE - 0.7, y: 1.2, z: 4.05, radius: 1.3, prompt: 'Take the shuttle home', onUse: (gm) => shuttle(gm, ctx, 'home') });
  s.light({ at: [XE - 1.2, 2.9, 4.05], color: warm(3300), power: 2.4, range: 5, lamp: true, clip: [XE - 12, -0.5, TR.front, XE + 0.1, TR.h, TR.wall] });
  for (const p of [[XE - 3, 4.2], [XE - 4.2, 3.6], [XE - 2.4, 3.4]]) s.spot('stand', p[0], 0, p[1], -PI / 2, { tags: ['wait', 'mile'] });
  s.path([[XE - 20, 3.95], [XE - 8, 3.95], [XE - 1.2, 4.05]], { width: 1.4 });
  void game;
}

// ---------------------------------------------------------------------------------------------------------------
// the clock, the runs and the day's times
// ---------------------------------------------------------------------------------------------------------------
const NAMES = ['Ilse Marten', 'Kofi Brandt', 'Noor Halloran', 'Pim Achebe', 'Saoirse Lund', 'Tamsin Oyelaran', 'Ruben Kask', 'Femi Arden', 'Wren Takahashi', 'Ottilie Moss', 'Haruto Bell', 'Esme Dahl', 'Jonah Ikeda', 'Marta Quist', 'Selim Varga', 'Ada Pell-Ngata', 'Lukas Obi', 'Mei Sorrell'];

function runState(game) {
  const day = game.clock ? game.clock.day : 1, r = new Rng(5200 + day * 31);
  const pool = NAMES.slice(); const pick = () => pool.splice(r.i(0, pool.length - 1), 1)[0];
  const heavy = [], light = [];
  for (let i = 0; i < 6; i++) heavy.push({ name: pick(), sec: r.f(262, 455) });
  for (let i = 0; i < 6; i++) light.push({ name: pick(), sec: r.f(248, 430) });
  return { phase: 'idle', way: null, t: 0, cd: 0, q: 0, shown: -1, doneAt: -99, last: null, heavy, light, day, locked: false };
}

function wayName(way) { return way === 'heavy' ? 'the Heavy Mile' : 'the Light Mile'; }

function drawLive(c, w, h, ctx) {
  const R = ctx.run, game = ctx.game;
  c.clearRect(0, 0, w, h);
  let big = '0:00.0', line = 'THE MEASURE · 1,609 M', hot = false, idle = true;
  if (R.phase === 'count') { idle = false; big = String(Math.max(1, Math.ceil(R.cd))); line = (R.way === 'heavy' ? 'HEAVY MILE' : 'LIGHT MILE') + ' · ON YOUR MARK'; hot = true; }
  else if (R.phase === 'run') { idle = false; big = fmtTime(R.t, false); line = (R.way === 'heavy' ? 'HEAVY MILE · ' : 'LIGHT MILE · ') + Math.max(0, Math.floor(R.prog || 0)).toLocaleString('en-GB') + ' M'; }
  else if (R.last && game.time - R.doneAt < 90) { idle = false; big = fmtTime(R.last.sec); line = 'YOUR ' + (R.last.way === 'heavy' ? 'HEAVY' : 'LIGHT') + ' MILE'; hot = true; }
  drawClock(c, 0, 0, LIVE.clockW, LIVE.clockH, big, line + (idle ? ' · HOME' : ''), hot);
  drawClock(c, 0, LIVE.farY, LIVE.clockW, LIVE.clockH, big, line + (idle ? ' · FAR LINE' : ''), hot);
  // the day's times, the player's best each way among them
  const mk = (list, way) => {
    const out = list.map((q) => ({ name: q.name, sec: q.sec }));
    const best = game.flags ? game.flags['mile.best.' + way] : 0;
    if (best) out.push({ name: 'You · Spelt', sec: best, you: true });
    out.sort((a, b) => a.sec - b.sec);
    return out.slice(0, 6).map((q) => ({ name: q.name, time: fmtTime(q.sec), you: q.you }));
  };
  drawTimes(c, LIVE.timesX, 0, w - LIVE.timesX, h, [
    { title: 'HEAVY MILE · SPINWARD', accent: '#e9b23c', list: mk(R.heavy, 'heavy') },
    { title: 'LIGHT MILE · ANTI', accent: '#5fc4c8', list: mk(R.light, 'light') },
  ], "Today's times");
}
function redraw(ctx) { if (ctx.live && ctx.game.atlas && ctx.game.atlas.redraw) ctx.game.atlas.redraw(ctx.live, (c, w, h) => drawLive(c, w, h, ctx)); }

// start a run: way 'heavy' from the home line, 'light' from the far line (the shuttle takes you there first)
export async function startRun(game, ctx, way) {
  const R = ctx.run, f = ctx.f, p = game.player;
  if (R.phase === 'count' || R.phase === 'run' || game.busy) return;
  game.busy++;
  try {
    if (game.ui) await game.ui.fade(true, way === 'light' ? 0.5 : 0.3);
    if (way === 'light') p.place(f, MILE + 1.0, 0, LANE_Z[1], -PI / 2, 0);
    else p.place(f, -1.0, 0, LANE_Z[1], PI / 2, 0);
    if (way === 'light') sfx(game, 'door-slide', f, MILE + 6, 1.2, 4.0);
    if (game.ui) await game.ui.fade(false, 0.4);
  } finally { game.busy--; }
  R.phase = 'count'; R.way = way; R.cd = 3.2; R.t = 0; R.q = 0; R.prog = 0; R.shown = -1;
  p.locked = true; R.locked = true;
  toast(game, way === 'heavy' ? 'The Heavy Mile: 1,609 metres spinward, heavier every stride. Hold Shift to run.' : 'The Light Mile: 1,609 metres anti, home to the Tin. Hold Shift to run.', 'thread', 5);
  redraw(ctx);
}

function finishRun(game, ctx) {
  const R = ctx.run, sec = R.t, way = R.way;
  R.phase = 'idle'; R.last = { way, sec }; R.doneAt = game.time;
  const key = 'mile.best.' + way, prev = game.flags[key];
  if (!prev || sec < prev) game.flags[key] = sec;
  if (way === 'heavy') game.flags.ran_heavy_mile = true; else game.flags.ran_light_mile = true;
  game.events.emit('mile:done', { way, seconds: sec });
  if (game.audio) game.audio.play('cheer', { vol: 0.35 });
  const rec = way === 'heavy' ? '3:46.8' : '3:31.9';
  toast(game, (way === 'heavy' ? 'The Heavy Mile in ' : 'The Light Mile in ') + fmtTime(sec) + (prev && sec < prev ? ', your best.' : '.') + ' The record is ' + rec + '. It is on the board at home.', 'gain', 8);
  find(game, 'spin-heavier'); custom(game, 'Spinward and anti');
  redraw(ctx);
}

function abortRun(game, ctx, why) {
  const R = ctx.run; R.phase = 'idle';
  if (R.locked) { game.player.locked = false; R.locked = false; }
  if (why) toast(game, why, 'info', 6);
  redraw(ctx);
}

export async function shuttle(game, ctx, to) {
  const f = ctx.f, p = game.player, R = ctx.run;
  if (game.busy) return;
  if (R.phase === 'run' || R.phase === 'count') abortRun(game, ctx, 'The clock stops when you take the shuttle.');
  game.busy++;
  try {
    sfx(game, 'door-slide', f, p.pos.x, 1.2, p.pos.z);
    if (game.ui) await game.ui.fade(true, 0.5);
    if (to === 'home') p.place(f, -3.0, 0, 6.4, PI / 2, 0);
    else p.place(f, MILE + 5, 0, 3.9, -PI / 2, 0);
    if (game.audio) game.audio.play('chime', { vol: 0.5 });
    if (game.ui) { await game.ui.fade(false, 0.5); toast(game, to === 'home' ? 'Ninety seconds in a small car behind the wall, and you are home. The day\'s times are on the wall in front of you.' : 'The far line. The home end is 1,609 metres anti, round the curve and out of sight.', 'info', 6); }
  } finally { game.busy--; }
}

function runs(ctx) {
  const { s, f, game } = ctx, R = ctx.run;
  // the home gate: a button on each post
  s.interact({ x: -0.6, y: 1.2, z: TR.l0 + 0.25, radius: 1.3, prompt: (gm) => (R.phase === 'run' || R.phase === 'count') ? 'Stop the clock' : 'Start the clock: the Heavy Mile, spinward', onUse: (gm) => (R.phase === 'run' || R.phase === 'count') ? abortRun(gm, ctx, 'Clock stopped.') : startRun(gm, ctx, 'heavy') });
  s.interact({ x: -0.6, y: 1.2, z: TR.l1 - 0.3, radius: 1.3, prompt: (gm) => (R.phase === 'run' || R.phase === 'count') ? 'Stop the clock' : 'Start the clock: the Light Mile, anti', onUse: (gm) => (R.phase === 'run' || R.phase === 'count') ? abortRun(gm, ctx, 'Clock stopped.') : startRun(gm, ctx, 'light') });
  // the far gate
  s.interact({ x: MILE + 0.6, y: 1.2, z: TR.l0 + 0.25, radius: 1.3, prompt: (gm) => (R.phase === 'run' || R.phase === 'count') ? 'Stop the clock' : 'Start the clock: the Light Mile, anti', onUse: (gm) => (R.phase === 'run' || R.phase === 'count') ? abortRun(gm, ctx, 'Clock stopped.') : startRun(gm, ctx, 'light') });
  s.interact({ x: MILE + 0.6, y: 1.2, z: TR.l1 - 0.3, radius: 1.3, prompt: 'Read the far gate', onUse: async (gm) => {
    const v = floorSpeed(f);
    await say(gm, 'The far gate', ['A brass plate on the post: The far line. 1,609 metres from home, measured on the floor of deck 52 by the Ring Seven surveyors and checked every Booking Day with a tape nobody is allowed to borrow.', 'The floor here goes round with the drum at ' + v.toFixed(0) + ' metres a second. Run anti and you take a little off that, and the floor holds you a little less hard. Run spinward and you add to it.']);
  } });
  let lastDraw = -1;
  s.every((dt, gm) => {
    if (R.phase === 'idle') { if (R.last && gm.time - R.doneAt > 90 && R.doneAt > 0) { R.doneAt = -1e9; redraw(ctx); } return; }
    const p = gm.player;
    if (p.frame !== f) { abortRun(gm, ctx, null); return; }
    if (R.phase === 'count') {
      const before = Math.ceil(R.cd); R.cd -= dt; const now = Math.ceil(R.cd);
      if (now !== before && now > 0) { toast(gm, now === 3 ? 'On your mark.' : now === 2 ? 'Set.' : 'Steady.', 'info', 1.2); if (gm.audio && gm.audio.ui) gm.audio.ui('click'); redraw(ctx); }
      if (R.cd <= 0) { R.phase = 'run'; R.t = 0; if (R.locked) { p.locked = false; R.locked = false; } toast(gm, 'Go.', 'thread', 1.5); if (gm.audio) gm.audio.play('bell', { vol: 0.4 }); redraw(ctx); }
      return;
    }
    R.t += dt;
    const x = p.pos.x;
    R.prog = R.way === 'heavy' ? x : MILE - x;
    if (R.prog < -25) { abortRun(gm, ctx, 'You ran the wrong way. The clock stops, and the timekeeper pretends not to have seen.'); return; }
    if (R.t > 1800) { abortRun(gm, ctx, 'Half an hour. The clock gives up before you do.'); return; }
    if (R.q < 3 && R.prog >= QUARTERS[R.q]) {
      const g1 = p.gNow || f.weight(0, 0);
      const word = ['A quarter', 'Half', 'Three quarters'][R.q];
      toast(gm, word + ': ' + fmtTime(R.t, false) + '. You weigh ' + g1.toFixed(2) + ' g at this pace; standing still, 0.93.', 'info', 5);
      R.q++;
    }
    if (R.prog >= MILE) { finishRun(gm, ctx); return; }
    const sec = Math.floor(R.t); if (sec !== lastDraw) { lastDraw = sec; redraw(ctx); }
  });
  s.onDispose(() => { if (R.locked) { game.player.locked = false; R.locked = false; } });
  void wayName;
}
