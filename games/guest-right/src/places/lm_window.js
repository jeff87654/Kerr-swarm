// The Window: past the back axle, where nothing turns. The armoured car from the slow ring stops at a short dock (the back
// crews' sled bay behind glass, the dose board, the old bet board); then the robing lobby, where the attendant hands out
// grip slippers for the felt and the rule board says who may come; then a red passage to let the eyes open; then the
// gallery: three tiers of couches in the dark, a rail, and one long wall glazed with a metre and a half of water. Behind
// it, when the shutter goes up, the River.
//
// Frame 'still-side'. Nothing here turns, so nothing here weighs anything; the visitors wear grip slippers on felt floors
// and the game gives them an eighth of a g while they are in these rooms (player.gOverride). The frame sits at 360 m
// from the axis, where an eighth of a g is also what the engine would give, so the people here walk the same way and the
// rooms are drawn nearly flat. x spinward, z aft (toward the Window), y up.
import { floor, ceiling, wall, lamp, block, stairs, roomGlow } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { PI, say, toast, find, sfx, seat, handLine, movingMesh, trueToFlat, innerBox } from './lm_axle_back_parts.js';
import { paintRiver, paintRadiators, RIVER_W, RIVER_H } from './lm_axle_back_sky.js';
import { Rng, clamp, smoothstep } from '../core/util.js';

const RHO = 360;
const G_STILL = 0.12;
const ATTENDANT = { name: 'Imke, the attendant', colour: '#c9a24a' };
const GUIDE = { name: 'Tamsin, the guide', colour: '#b86a72' };
const FELT_D = '#2c2226', FELT_R = '#6e2a33', WOOD = '#4a3426';
const ENV_GALLERY = { exposure: 1.0, autoKey: 0.12, autoMin: 0.85, autoMax: 1.35, bloom: 0.05, contrast: 1.12, saturation: 1.22, warmth: 0.12, vignette: 0.38 };
const ENV_RED = { exposure: 1.0, autoKey: 0.12, autoMin: 0.6, autoMax: 2.2, bloom: 0.06, contrast: 1.1, saturation: 1.0, warmth: 0.1, vignette: 0.34 };
const ENV_DOCK = { exposure: 1.0, autoKey: 0.17, autoMin: 0.4, autoMax: 2.6, bloom: 0.05, warmth: 0.18, vignette: 0.28 };

export const place = {
  id: 'lm-window', name: 'The Window', order: 11,
  region: 'axle-back',
  async build(game) {
    const W = game.world;
    const f = W.frame('still-side', RHO, 0, 3800);
    const s = W.scope('lm-window', f), g = s.g;
    const r = new Rng(3800);
    const relend = () => { if (game.atlas && game.atlas.begin) game.atlas.begin('region:axle-back'); };
    const tick = async () => { await new Promise(requestAnimationFrame); relend(); };

    // ---- the pictures first: the River painted in stages on a canvas of its own, then copied onto the atlas
    const cv = document.createElement('canvas'); cv.width = RIVER_W; cv.height = RIVER_H;
    await paintRiver(cv.getContext('2d'), RIVER_W, RIVER_H, tick);
    relend();
    const sky = game.atlas.add(RIVER_W, RIVER_H, (ctx, w, h) => ctx.drawImage(cv, 0, 0, w, h), 'lm-window.river');
    cv.width = cv.height = 1;
    const rad = game.atlas.add(1024, 512, paintRadiators, 'lm-window.radiators');
    await tick();

    // the shutter's state, shared by the seats, the guide, the rail and the lights
    const st = { state: 'shut', k: 0, red: [], warm: null, lineDone: false };

    buildDock(game, s, f);
    await tick();
    buildLobby(game, s, f, r);
    await tick();
    buildPassage(game, s, f, st);
    await tick();
    buildGallery(game, s, f, r, st, sky, rad);
    await tick();

    // ---- weight: grip slippers on felt, an eighth of a g, while you are in these rooms
    let ours = false;
    const setG = (on) => { const p = game.player; if (on) { if (p.gOverride !== G_STILL && !(game.cab && game.cab.riding)) { p.gOverride = G_STILL; ours = true; } } else if (ours) { if (p.gOverride === G_STILL) p.gOverride = null; ours = false; } };
    const off = game.events.on('zone', (e) => { const z = e && e.zone; setG(!!(z && z.still)); });
    s.onDispose(off);
    s.every(() => { const p = game.player; if (p.frame === f) setG(true); else if (ours) setG(false); });
    s.onDispose(() => setG(false));

    // ---- a test hook: open the shutter at once (shot tools, play-throughs)
    place.openNow = () => { st.state = 'open'; st.k = 1; };
    place.runShutter = () => { if (st.state === 'shut') runShutter(game, st); };

    s.finish();
    game.spawns['still-dock'] = { frame: f, x: 0, y: 0, z: 1.6, yaw: PI };
    game.spawns['window'] = { frame: f, x: 2, y: -0.9, z: 40.6, yaw: PI };
    game.spawns['window-back'] = { frame: f, x: 4.5, y: 0, z: 31.9, yaw: PI - 0.15 };
  },
};

// ===============================================================================================================
// The dock: where the car from the slow ring stops. The sled bay behind glass, the dose board, the old bet board.
// ===============================================================================================================
function buildDock(game, s, f) {
  const g = s.g, X0 = -7, X1 = 7, Z0 = 0, Z1 = 9, H = 3.4;
  const clip = [X0 - 0.1, -0.3, Z0 - 0.1, X1 + 0.1, H + 0.1, Z1 + 0.1];
  floor(s, X0, Z0, X1, Z1, 0, 'deckplate', '#6a6660');
  // a felt runner down the middle: the grip floor starts at the car door
  g.mat('felt', FELT_R); g.box(-1.3, 0, 0.1, 1.3, 0.012, Z1, { faces: 'YxXzZ' }); s.flush({ tier: 's' });
  ceiling(s, X0, Z0, X1, Z1, H, 'paint', '#cfc6b4');
  // steel beams across, a cable tray down the middle
  g.mat('cast', '#3a3e3c'); for (let z = Z0 + 1.5; z < Z1; z += 2) g.box(X0, H - 0.3, z - 0.1, X1, H, z + 0.1, { faces: 'xXyzZ' });
  g.mat('brushed', '#8a8a86'); g.box(-0.3, H - 0.42, Z0, 0.3, H - 0.36, Z1, { faces: 'yYxX' }); s.flush({ tier: 's' });
  g.mat('weave', '#2f5d5a'); for (let z = Z0 + 0.5; z < Z1; z += 0.9) g.tube([[-0.25, H - 0.36, z], [0.25, H - 0.36, z + 0.3]], 0.02, { segs: 4 }); s.flush({ tier: 'd' });
  const wallO = { tint: '#c9bfae', mat: 'panel', dado: { h: 1.1, mat: 'panel', tint: '#34413f' }, skirt: '#22201e' };
  wall(s, X0, Z0 + 0.08, X1, Z0 + 0.08, 0, H, Object.assign({}, wallO, { openings: [{ at: 5.4, w: 3.2, h: 2.5 }] }));
  wall(s, X0, Z1 - 0.08, X1, Z1 - 0.08, 0, H, Object.assign({}, wallO, { openings: [{ at: 5.9, w: 2.2, h: 2.4 }] }));
  wall(s, X0 + 0.08, Z0, X0 + 0.08, Z1, 0, H, wallO);
  wall(s, X1 - 0.08, Z0, X1 - 0.08, Z1, 0, H, Object.assign({}, wallO, { openings: [{ at: 1.0, w: 7.0, h: 1.65, sill: 0.95 }] }));
  // glazing onto the sled bay, in heavy frames
  g.mat('cast', '#2a3230');
  for (let z = 1.0; z <= 8.01; z += 1.75) g.box(X1 - 0.12, 0.95, z - 0.05, X1 - 0.02, 2.6, z + 0.05, { bevel: 0.01 });
  g.box(X1 - 0.14, 0.9, 1.0, X1 - 0.02, 0.98, 8.0); g.box(X1 - 0.14, 2.57, 1.0, X1 - 0.02, 2.65, 8.0);
  s.flush({ tier: 's' });
  for (let z = 1.0; z < 7.9; z += 1.75) s.glass(X1 - 0.07, 0.98, z + 0.05, X1 - 0.07, 2.57, z + 1.7, { tint: '#cfe0dc', opacity: 0.1 });
  roomGlow(s, X0, 0, Z0, X1, H, Z1, { sky: '#ffe2bc', ground: '#8a7a68', power: 0.24 });
  for (const z of [2.5, 6.5]) lamp(s, 'globe', 0, H - 0.75, z, { K: 3400, power: 1.0, drop: 0.35, clip, r: 0.2 });
  lamp(s, 'sconce', X0 + 0.12, 2.6, 4.6, { face: 'X', K: 3000, power: 0.6, clip });
  // the car berth: a deep recess behind the north wall, the car in it with its hatch open
  const CB = [-2.4, -7.6, 2.4, 0];
  g.mat('panel', '#3a3e3c'); innerBox(g, CB[0], 0, CB[1], CB[2], 3.0, CB[3], 'xXzY'); s.flush({ tier: 's' });
  g.mat('deckplate', '#4a4844'); g.box(CB[0], -0.02, CB[1], CB[2], 0, CB[3], { faces: 'Y' }); s.flush({ tier: 's' });
  g.mat('cast', '#d6a640'); g.box(-1.7, 0.005, -0.4, 1.7, 0.012, -0.12, { faces: 'Y' }); s.flush({ tier: 'd', cast: false });       // the yellow gap line
  // the track's guide rails, running back into the dark
  g.mat('brushed', '#8a8a86'); for (const x of [-1.2, 1.2]) g.box(x - 0.06, 0, CB[1], x + 0.06, 0.12, -0.2); s.flush({ tier: 's' });
  drawCar(s, -1.75, 1.75, -7.3, -0.22);
  s.solid(-1.8, 0, -7.4, 1.8, 2.9, -0.24);
  s.solid(-2.4, 0, -0.24, -0.62, 2.9, 0.0); s.solid(0.62, 0, -0.24, 2.4, 2.9, 0.0);
  // inside the car: a lamp, so the open hatch glows
  s.light({ at: [0, 2.1, -3.5], K: 2800, color: [1.0, 0.78, 0.55], power: 2.2, range: 5, clip: [-1.7, 0, -7.3, 1.7, 2.7, 0.6] });
  // the car's own plate over the hatch
  sign(s, { kind: 'plate', text: 'CAR SEVEN', sub: 'to the slow ring · port seven' }, 0, 2.62, 0.02, { face: 'Z', w: 0.62, h: 0.26 });
  // the sled bay through the glass
  buildSledBay(game, s, f);
  // hand lines on every wall: before the slippers, this is how you move
  handLine(s, [[X0 + 0.16, 0.6], [X0 + 0.16, 8.4]], 1.05, { side: -1 });
  handLine(s, [[X0 + 0.6, 0.18], [-1.8, 0.18]], 1.05, { side: -1 }); handLine(s, [[1.8, 0.18], [X1 - 0.6, 0.18]], 1.05, { side: -1 });
  handLine(s, [[1.4, Z1 - 0.18], [X1 - 0.6, Z1 - 0.18]], 1.05);
  // the back crews' lockers along the south wall, each with a name and something stuck to it
  const CREW = ['WENNA', 'DOV', 'AUREL', 'SANNE', 'IBRAHIM', 'LUISE'], LCOL = ['#2f5d5a', '#7a2f3c', '#3a4a6a', '#8a5a2a', '#2f6f73', '#5b4060'];
  for (let i = 0; i < 6; i++) {
    const x0 = -6.7 + i * 0.78;
    block(s, x0, 0, Z1 - 0.62, x0 + 0.74, 2.05, Z1 - 0.12, 'panel', LCOL[i], { bevel: 0.015 });
    s.detail(() => { g.mat('cast', '#b08a45'); g.box(x0 + 0.6, 1.0, Z1 - 0.65, x0 + 0.64, 1.18, Z1 - 0.62); g.mat('cast', '#1e1c1a'); for (let k = 0; k < 4; k++) g.box(x0 + 0.15, 1.7 + k * 0.05, Z1 - 0.625, x0 + 0.55, 1.72 + k * 0.05, Z1 - 0.62); });
    sign(s, { kind: 'label', text: CREW[i], sub: 'back crew' }, x0 + 0.37, 1.45, Z1 - 0.63, { face: 'z', w: 0.42, h: 0.12 });
  }
  s.interact({ x: -4.5, y: 1.3, z: Z1 - 1.2, radius: 1.4, prompt: 'Look at the lockers', onUse: async (gm) => {
    await say(gm, 'The lockers', ['Six crew lockers, painted six colours. A patch of tiny stitched stars on one, a child\'s drawing of the River on another, a hall rota on a third: Thursday, ramen, bring your own bowl.', 'The back crews see the stars on ordinary working days. Their lockers are the only ones in Chervil with pictures of them on.']);
  } });
  // a crate of returned slippers and a bench by the way out
  prop(s, 'bench', 4.6, 0, 8.45, PI, { w: 2.2, back: true, wood: '#6b4a2f' });
  prop(s, 'crate', 5.9, 0, 6.9, 0.2, { w: 0.6, h: 0.42, d: 0.42 });
  for (let i = 0; i < 4; i++) prop(s, 'lm-axle-back.slippers', 5.75 + (i % 2) * 0.22, 0.43, 6.8 + (i > 1 ? 0.18 : 0), 0.3 * i, { felt: ['#7a2f3c', '#2f5d5a', '#d6a640', '#5b4060'][i], size: 1 });

  // ---- the dose board and the old bet board, side by side on the anti wall
  const doseSpec = { kind: 'board', title: 'DOSE BOARD', lines: ['A visit, eighty minutes · 12 µSv', 'Back crew, one shift · 60 to 120 µSv', 'Back crew, a year · 14 to 29 mSv', 'A crew career · capped at 1 Sv', 'Outside, no shield · 2.5 to 10 Gy an hour'], palette: ['#101614', '#f3e6c8', '#3fe0d0'] };
  sign(s, doseSpec, X0 + 0.17, 1.75, 2.9, { face: 'X', w: 1.7, h: 1.05, glow: 1.3 });
  const betSpec = { kind: 'chalk', title: 'Old bet board', lines: ['Big one over the red star · Wenna · 44 min', 'Speck by the Shelf knot · Dov · 12 min', 'Two stars in one round · Aurel · paid', 'Three in one round · nobody yet', 'Stakes: an hour at the hall stove'] };
  sign(s, betSpec, X0 + 0.17, 1.7, 6.3, { face: 'X', w: 1.6, h: 1.15 });
  s.interact({ x: X0 + 0.7, y: 1.6, z: 2.9, radius: 1.3, prompt: 'Read the dose board', onUse: async (gm) => {
    await say(gm, 'The dose board', ['A lit board of what the dark between the rafts costs you. A visit to the Window, eighty minutes with the car: about twelve microsieverts, because the glass is a metre and a half of water.', 'A back crew shift in a closed sled: sixty to a hundred and twenty. A crew career is capped at one sievert, and the crews keep count to the last decimal.', 'At the bottom, smaller: outside, unshielded, two and a half to ten grays an hour. Nobody works out there in a suit.']);
  } });
  s.interact({ x: X0 + 0.7, y: 1.6, z: 6.3, radius: 1.3, prompt: 'Read the old bet board', onUse: async (gm) => {
    await say(gm, 'The old bet board', ['Chalk, gone soft with years of being rubbed out and written over. The back crews bet on when a raft\'s edge will cross a star: the nearest rafts are a few times the width of an orbit off, and their edges creep over a star in under an hour.', 'The stakes are an hour at the hall stove, because this is Chervil. Somebody called Wenna won forty-four minutes on the big one by the red star and has not let anyone forget it.']);
  } });
  // the car: back to the axle
  s.interact({ x: 0, y: 1.2, z: 0.35, radius: 1.5, prompt: 'Take the car back to the slow ring', onUse: (gm) => carBack(gm) });
  s.interact({ x: X1 - 0.6, y: 1.5, z: 4.5, radius: 1.6, prompt: 'Look at the sleds', onUse: async (gm) => {
    await say(gm, 'The sled bay', ['Two closed sleds in their berths, about four tonnes a square metre of shield, each with one small window that looks aft. The back crews ride them along the radiator rows to chase ammonia leaks, change pumps and patch punctures.', 'One has a crew patch stitched onto the hatch: a band of tiny stars. The other has a lidded pot strapped to the seat, which says something about Chervil.']);
  } });
  s.zoneBox({ id: 'still-dock', place: 'still-dock', box: [X0, -0.5, -7.6, X1, H, Z1], name: 'The still side', sub: 'The dock · nothing turns', ambience: 'station', reverb: 'room', headroom: H, env: ENV_DOCK, still: true });
  s.loop('air', 0, 2.6, 4.5, { vol: 0.35, radius: 12 });
  s.path([[0, 1.0], [0, 4.5], [0, 8.6], [0, 9.6]]); s.path([[0, 4.5], [-4.5, 4.5], [-6.2, 2.9]]); s.path([[-4.5, 4.5], [-6.2, 6.3]]); s.path([[0, 4.5], [5.6, 4.5]]);
  s.spot('stand', -6.0, 0, 3.0, PI / 2, { tags: ['read', 'window'] }); s.spot('stand', -6.0, 0, 6.4, PI / 2, { tags: ['read', 'window'] });
  s.spot('stand', 6.1, 0, 3.3, -PI / 2, { tags: ['watch', 'window'] }); s.spot('stand', 6.1, 0, 5.7, -PI / 2, { tags: ['watch', 'window'] });
  s.spot('chat', -1.9, 0, 6.2, 0.6, { tags: ['window'] }); s.spot('chat', -1.2, 0, 7.1, PI + 0.4, { tags: ['window'] });
}

// The armoured car: a squat heavy box with rounded ends, its hatch open toward the dock.
function drawCar(s, x0, x1, z0, z1) {
  const g = s.g, y0 = 0.12, y1 = 2.7;
  g.mat('panel', '#4b5650', { rough: 0.05 });
  g.box(x0, y0, z0, x1, y1, z1 - 0.12, { bevel: 0.22, faces: 'xXyYz' });
  // the front plate with the hatch opening
  const hx = 0.6, hy = 2.15;
  g.box(x0 + 0.1, y0 + 0.08, z1 - 0.14, -hx, y1 - 0.12, z1, { faces: 'ZxX' });
  g.box(hx, y0 + 0.08, z1 - 0.14, x1 - 0.1, y1 - 0.12, z1, { faces: 'ZxX' });
  g.box(-hx, hy, z1 - 0.14, hx, y1 - 0.12, z1, { faces: 'Zy' });
  g.box(-hx, y0 + 0.08, z1 - 0.14, hx, y0 + 0.2, z1, { faces: 'ZY' });
  s.flush({ tier: 's' });
  // its ochre band and stencil, rivets
  g.mat('paint', '#c9a24a'); g.box(x0 - 0.005, 1.05, z0 + 0.3, x0 + 0.01, 1.3, z1 - 0.3, { faces: 'x' }); g.box(x1 - 0.01, 1.05, z0 + 0.3, x1 + 0.005, 1.3, z1 - 0.3, { faces: 'X' });
  g.box(x0 + 0.1, 1.05, z1 - 0.005, -hx - 0.02, 1.3, z1 + 0.006, { faces: 'Z' }); g.box(hx + 0.02, 1.05, z1 - 0.005, x1 - 0.1, 1.3, z1 + 0.006, { faces: 'Z' });
  g.mat('cast', '#2a2e2c'); for (let x = x0 + 0.25; x < x1 - 0.1; x += 0.3) for (const y of [0.5, 2.35]) if (Math.abs(x) > hx + 0.08) g.cube(x, y, z1 + 0.01, 0.04, 0.04, 0.025);
  // hatch frame in brass, the hatch slid aside, a step
  g.mat('cast', '#b08a45', { rough: -0.1 }); g.box(-hx - 0.06, y0 + 0.08, z1 - 0.02, -hx, hy + 0.06, z1 + 0.04); g.box(hx, y0 + 0.08, z1 - 0.02, hx + 0.06, hy + 0.06, z1 + 0.04); g.box(-hx - 0.06, hy, z1 - 0.02, hx + 0.06, hy + 0.06, z1 + 0.04);
  g.mat('panel', '#3f4943'); g.box(hx + 0.08, y0 + 0.2, z1 + 0.04, hx + 1.24, hy - 0.04, z1 + 0.12, { bevel: 0.02 });
  s.flush({ tier: 's', cast: true });
  // inside: felt walls, two benches facing, a hand line, a warm ceiling strip
  g.mat('felt', '#6a4a3a'); innerBox(g, x0 + 0.12, y0 + 0.1, z0 + 0.15, x1 - 0.12, y1 - 0.15, z1 - 0.16, 'xXyYz');
  s.flush({ tier: 's' });
  g.mat('felt', FELT_R); for (const sx of [-1, 1]) g.box(sx * 1.05 - 0.28, 0.12, z0 + 0.5, sx * 1.05 + 0.28, 0.58, z1 - 0.6, { bevel: 0.05 });
  g.mat('cast', '#b08a45'); for (const sx of [-1, 1]) g.tube([[sx * 1.45, 1.6, z0 + 0.5], [sx * 1.45, 1.6, z1 - 0.5]], 0.02, { segs: 6 });
  g.mat('diffuser', '#ffd6a0', { emissive: 3 }); g.box(-0.5, y1 - 0.17, z0 + 0.6, 0.5, y1 - 0.15, z1 - 0.6, { faces: 'y' });
  s.flush({ tier: 'd', cast: false });
}

// The back crews' sled bay, seen through the dock's glass: two closed sleds, a tool wall, cold work light.
function buildSledBay(game, s, f) {
  const g = s.g, X0 = 7.0, X1 = 15.5, Z0 = -1.5, Z1 = 10.5, Y = -0.6, H = 4.2;
  g.mat('deckplate', '#555450'); g.box(X0, Y - 0.02, Z0, X1, Y, Z1, { faces: 'Y' }); s.flush({ tier: 's' });
  g.mat('panel', '#5d6461'); innerBox(g, X0, Y, Z0, X1, Y + H, Z1, 'XzZ'); s.flush({ tier: 's' });
  g.mat('panel', '#3a403e'); innerBox(g, X0, Y, Z0, X1, Y + H, Z1, 'Y'); s.flush({ tier: 's' });
  const sled = (cx, cz, body, n) => {
    g.mat('panel', body, { rough: 0.05 }); g.box(cx - 1.1, Y + 0.35, cz - 1.7, cx + 1.1, Y + 2.25, cz + 1.7, { bevel: 0.18 });
    g.mat('cast', '#2a2e2c'); for (const dz of [-1.3, 1.3]) g.box(cx - 0.9, Y, cz + dz - 0.12, cx + 0.9, Y + 0.38, cz + dz + 0.12, { bevel: 0.03 });
    g.mat('diffuser', '#1c2830', { rough: -0.3 }); g.box(cx - 0.45, Y + 1.35, cz + 1.69, cx + 0.45, Y + 1.85, cz + 1.72, { faces: 'Z' });
    g.mat('paint', '#e9e1cf'); g.box(cx - 1.11, Y + 1.0, cz - 0.4, cx - 1.1, Y + 1.5, cz + 0.4, { faces: 'x' });
    s.flush({ tier: 's', cast: true });
    sign(s, { kind: 'label', text: n, sub: 'closed sled' }, cx - 1.13, Y + 1.25, cz, { face: 'x', w: 0.6, h: 0.22 });
  };
  sled(10.2, 2.0, '#c9552e', 'SLED 3'); sled(13.0, 6.8, '#2f6f73', 'SLED 8');
  // the tool wall and a work bench at the far side
  g.mat('wood', '#5a4030'); g.box(X1 - 0.6, Y, 1.0, X1 - 0.02, Y + 0.9, 4.5, { bevel: 0.02 }); s.flush({ tier: 's', cast: true });
  g.mat('cast', '#3a3430'); for (let z = 1.2; z < 4.4; z += 0.32) g.box(X1 - 0.06, Y + 1.3 + (z * 7 % 0.5), z, X1 - 0.02, Y + 1.8 + (z * 5 % 0.4), z + 0.05);
  g.mat('glaze', '#d6a640'); for (let z = 1.4; z < 4.2; z += 0.7) g.cyl(X1 - 0.3, Y + 0.9, z, 0.09, 0.22, { segs: 10 });
  s.flush({ tier: 'd' });
  s.light({ at: [11.5, Y + H - 0.4, 4.5], K: 4200, color: [0.85, 0.92, 1.0], power: 5, range: 11, clip: [X0, Y - 0.2, Z0, X1, Y + H, Z1], shadow: true });
  g.mat('diffuser', '#e8f0ff', { emissive: 4 }); g.box(10.5, Y + H - 0.08, 4.0, 12.5, Y + H - 0.02, 5.0, { faces: 'y' }); s.flush({ tier: 'd', cast: false });
}

// Back to the slow ring: fade, the short ride, and the axle's ring room.
async function carBack(game) {
  if (game.busy) return;
  const sp = game.spawns['axle-ring'];
  if (!sp) { toast(game, 'The car is not running.'); return; }
  game.busy++;
  try {
    sfx(game, 'door-slide', game.player.frame, 0, 1.2, 0);
    if (game.ui) await game.ui.fade(true, 0.6);
    game.player.place(sp.frame, sp.x, sp.y, sp.z, sp.yaw || 0, 0);
    if (game.ui) { await game.ui.fade(false, 0.9); game.ui.toast('The car runs back along its shielded track. The slow ring takes up the turn again, and in two minutes the hall has stopped wheeling round you.', { kind: 'info', dur: 8 }); }
  } finally { game.busy--; }
}

// ===============================================================================================================
// The robing lobby: grip slippers, robes, the attendant, the rule board.
// ===============================================================================================================
function buildLobby(game, s, f, r) {
  const g = s.g, X0 = -7, X1 = 7, Z0 = 9, Z1 = 19, H = 3.0;
  const clip = [X0 - 0.1, -0.3, Z0 - 0.1, X1 + 0.1, H + 0.1, Z1 + 0.1];
  floor(s, X0, Z0, X1, Z1, 0, 'felt', '#8a3a3a', { surf: 'felt' });
  // a border in the felt, ochre
  g.mat('felt', '#c9a24a'); for (const b of [[X0 + 0.3, Z0 + 0.3, X1 - 0.3, Z0 + 0.42], [X0 + 0.3, Z1 - 0.42, X1 - 0.3, Z1 - 0.3], [X0 + 0.3, Z0 + 0.3, X0 + 0.42, Z1 - 0.3], [X1 - 0.42, Z0 + 0.3, X1 - 0.3, Z1 - 0.3]]) g.box(b[0], 0, b[1], b[2], 0.006, b[3], { faces: 'Y' });
  s.flush({ tier: 'd', cast: false });
  ceiling(s, X0, Z0, X1, Z1, H, 'felt', '#d8ccb4');
  // ceiling battens
  g.mat('wood', '#6b4a2f'); for (let x = X0 + 1; x < X1; x += 2) g.box(x - 0.05, H - 0.12, Z0, x + 0.05, H, Z1, { faces: 'xXy' }); s.flush({ tier: 's' });
  const wallO = { tint: '#dcc9a6', mat: 'plaster', dado: { h: 1.0, mat: 'felt', tint: '#2f5d5a' }, skirt: '#3a2a20' };
  wall(s, X0 + 0.08, Z0, X0 + 0.08, Z1, 0, H, wallO);
  wall(s, X1 - 0.08, Z0, X1 - 0.08, Z1, 0, H, wallO);
  wall(s, X0, Z1 - 0.08, X1, Z1 - 0.08, 0, H, Object.assign({}, wallO, { openings: [{ at: 6.0, w: 2.0, h: 2.3 }] }));
  // the dock's wall is the north side; its far face, seen from in here
  g.mat('plaster', '#dcc9a6'); g.box(X0, 0, Z0 + 0.0, -1.1, H, Z0 + 0.01, { faces: 'Z' }); g.box(1.1, 0, Z0 + 0.0, X1, H, Z0 + 0.01, { faces: 'Z' }); g.box(-1.1, 2.4, Z0, 1.1, H, Z0 + 0.01, { faces: 'Z' }); s.flush({ tier: 's' });
  g.mat('felt', '#2f5d5a'); g.box(X0, 0, Z0 + 0.01, -1.1, 1.0, Z0 + 0.02, { faces: 'Z' }); g.box(1.1, 0, Z0 + 0.01, X1, 1.0, Z0 + 0.02, { faces: 'Z' }); s.flush({ tier: 's' });
  roomGlow(s, X0, 0, Z0, X1, H, Z1, { sky: '#ffd9a8', ground: '#9a5a4a', power: 0.3 });
  lamp(s, 'globe', -3.0, 2.45, 14.0, { K: 2700, power: 0.9, drop: 0.5, clip });
  lamp(s, 'globe', 3.0, 2.45, 14.0, { K: 2700, power: 0.9, drop: 0.5, clip });
  lamp(s, 'sconce', X0 + 0.12, 2.1, 11.2, { face: 'X', K: 2600, power: 0.6, clip });
  lamp(s, 'sconce', X1 - 0.12, 2.1, 16.6, { face: 'x', K: 2600, power: 0.6, clip });

  // ---- the slipper wall: pigeonholes floor to head height, children's sizes on the lower shelves
  const SX = X0 + 0.12, SZ0 = 10.0, SZ1 = 17.9, cols = 8, rows = 5;
  g.mat('wood', '#7a5233', { rough: -0.03 });
  g.box(SX, 0, SZ0, SX + 0.38, 0.06, SZ1, { bevel: 0.01 });
  for (let i = 0; i <= rows; i++) { const y = 0.12 + i * 0.36; g.box(SX, y - 0.02, SZ0, SX + 0.38, y + 0.02, SZ1, { bevel: 0.006 }); }
  for (let j = 0; j <= cols; j++) { const z = SZ0 + (SZ1 - SZ0) * j / cols; g.box(SX, 0, z - 0.02, SX + 0.38, 0.12 + rows * 0.36 + 0.02, z + 0.02, { bevel: 0.006 }); }
  s.flush({ tier: 's', cast: true });
  s.solid(SX, 0, SZ0, SX + 0.4, 2.0, SZ1);
  const FELTS = ['#7a2f3c', '#2f5d5a', '#d6a640', '#5b4060', '#c9552e', '#3a4a6a', '#8a5a2a', '#4a5a3a'];
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    if (r.chance(0.12)) continue;
    const y = 0.14 + i * 0.36, z = SZ0 + (SZ1 - SZ0) * (j + 0.5) / cols;
    prop(s, 'lm-axle-back.slippers', SX + 0.19, y, z, PI / 2 + r.f(-0.12, 0.12), { felt: FELTS[(i * 3 + j * 5) % FELTS.length], size: i < 2 ? 0.72 : 1 });
  }
  // size plates along the bottom shelves
  sign(s, { kind: 'label', text: 'SMALL', sub: 'eight-year-olds' }, SX + 0.4, 0.66, 11.0, { face: 'X', w: 0.42, h: 0.13 });
  sign(s, { kind: 'label', text: 'LARGE', sub: 'their adults' }, SX + 0.4, 1.38, 11.0, { face: 'X', w: 0.42, h: 0.13 });
  // benches to sit and put them on
  prop(s, 'bench', -5.6, 0, 12.4, PI / 2, { w: 2.4, wood: '#7a5233' });
  prop(s, 'bench', -5.6, 0, 15.8, PI / 2, { w: 2.4, wood: '#7a5233' });
  seat(s, -5.6, 0, 12.4, PI / 2, 'Sit and put on slippers', { onSit: (gm) => slippers(gm, true) });

  // ---- robes on pegs along the south wall, beside the passage
  const ROBES = ['#5b4060', '#2f5d5a', '#7a2f3c', '#3a4a6a', '#8a5a2a', '#4a3a52', '#2f6f73', '#6b3a3a'];
  for (let i = 0; i < 9; i++) { const x = 1.8 + i * 0.55; if (x > X1 - 0.4) break; prop(s, 'lm-axle-back.robe', x, 1.95, Z1 - 0.2, PI, { cloth: ROBES[i % ROBES.length], trim: i % 3 ? '#d6a640' : '#e9e1cf' }); }
  for (let i = 0; i < 5; i++) { const x = -1.9 - i * 0.55; prop(s, 'lm-axle-back.robe', x, 1.95, Z1 - 0.2, PI, { cloth: ROBES[(i + 3) % ROBES.length], trim: '#d6a640' }); }
  g.mat('wood', '#5a4030'); g.box(-4.6, 1.9, Z1 - 0.2, -1.6, 2.0, Z1 - 0.1); g.box(1.6, 1.9, Z1 - 0.2, X1 - 0.2, 2.0, Z1 - 0.1); s.flush({ tier: 'd' });

  // ---- the attendant's desk: a ledger of rounds, a lidded flask, a basket of slippers to lend
  block(s, 3.0, 0, 11.0, 6.4, 0.95, 11.8, 'wood', '#5a3a28', { bevel: 0.02 });
  g.mat('wood', '#7a5233'); g.box(2.95, 0.95, 10.95, 6.45, 1.0, 11.85, { bevel: 0.01 }); s.flush({ tier: 's', cast: true });
  s.detail(() => {
    g.mat('paper', '#efe6d2'); g.box(3.5, 1.0, 11.2, 4.1, 1.03, 11.6); g.mat('weave', '#5a2a22'); g.box(3.48, 0.995, 11.18, 4.12, 1.0, 11.62);
    g.mat('cast', '#b08a45'); g.lathe(5.4, 11.35, [[0, 1.0], [0.07, 1.0], [0.075, 1.24], [0.05, 1.28], [0.055, 1.31], [0, 1.32]], { segs: 12 });
    g.mat('cane', '#b8955a'); g.lathe(4.7, 11.45, [[0.18, 1.0], [0.22, 1.08], [0.23, 1.16], [0.21, 1.17]], { segs: 14, capTop: false });
  });
  for (let i = 0; i < 3; i++) prop(s, 'lm-axle-back.slippers', 4.62 + i * 0.07, 1.06 + i * 0.03, 11.45, 0.4 * i, { felt: FELTS[i + 2], size: 0.72 });
  prop(s, 'stool', 4.8, 0, 10.4, 0, { h: 0.66 });
  s.spot('counter', 4.7, 0, 10.35, 0, { tags: ['window', 'keeper'] });
  sign(s, { kind: 'plate', text: 'SLIPPERS AND ROBES', sub: 'lent · bring them back' }, 4.7, 0.6, 11.82, { face: 'Z', w: 0.5, h: 0.2 });
  s.interact({ x: 4.7, y: 1.1, z: 12.1, radius: 1.5, kind: 'talk', prompt: (gm) => (gm.flags['window.slippers'] ? 'Talk to the attendant' : 'Ask the attendant for slippers'), onUse: async (gm) => {
    if (!gm.flags['window.slippers']) {
      await say(gm, ATTENDANT, ['Where did you sleep last night, and have you eaten. In that order. Good.', 'Slippers. The soles grip the felt, so you can walk; take them off and you will drift. Larges are on the top shelves. A robe if you like: the gallery is kept cool, and you sit still for an hour.', 'Spare seat on this round, so you may go in. Guests take the seats the eight-year-olds leave empty. Mind the curtain, and wait for the shutter.']);
      slippers(gm, false);
    } else {
      const k = (gm.flags['window.talk'] = (gm.flags['window.talk'] || 0) + 1);
      const L = [['Twenty minutes in the red light, then the hour. Nobody hurries the shutter, not for councillors from Rue, not for anyone.'], ['Some adults are chosen ten times by ten different children. Some are never chosen at all, and paint the River from memory instead.'], ['The children come out not saying anything. That is how you know it went well.'], ['Five rounds a day, a hundred and fifty to a round. Every eight-year-old in the drum, and the adult they chose when they were four or five.']];
      await say(gm, ATTENDANT, L[k % L.length]);
    }
  } });

  // ---- the rule board, and today's rounds beside the passage
  const rules = { kind: 'notice', title: 'THE WINDOW', lines: ['Every child of Chervil comes once,', 'at about eight, with one adult', 'of their own choosing.', 'An adult comes again only when', 'a child chooses them.', 'Guests: a spare seat, if a round has one.', 'Slippers on the felt. Hand lines elsewhere.', 'Twenty minutes in the red light.', 'No lamps past the curtain.', 'The shutter opens early for nobody.'] };
  sign(s, rules, -4.0, 1.6, Z1 - 0.12, { face: 'z', w: 1.5, h: 1.6 });
  s.interact({ x: -4.0, y: 1.5, z: Z1 - 0.8, radius: 1.4, prompt: 'Read the rule board', onUse: async (gm) => {
    await say(gm, 'The rule board', ['Every child of Chervil comes to the Window once, at about eight, with one adult of their own choosing. Most choose when they are four or five, and do not change their minds.', 'An adult comes again only when a child chooses them. So the old who come back are the ones the children wanted, and everybody knows it.', 'Guests may take a spare seat if a round has one. Slippers on the felt. Twenty minutes in the red light before the shutter. No lamps past the curtain. The shutter opens early for nobody.']);
  } });
  const rounds = { kind: 'chalk', title: "Today's rounds", lines: ['07:00 · Pennyfold', '09:00 · Hassock, Lindenhall', '11:00 · Ropewalk', '13:00 · Tessera', '15:00 · Candlewick', 'Spare seats to guests'] };
  sign(s, rounds, 2.6, 1.55, Z1 - 0.12, { face: 'z', w: 0.9, h: 1.05 });
  // a child's coat on a low peg, a note pinned to it
  prop(s, 'lm-axle-back.robe', 1.4, 1.1, Z1 - 0.2, PI, { cloth: '#d6a640', trim: '#7a2f3c' }, { scale: 0.62 });

  // ---- people: the party being robed, the children fidgeting, adults talking
  for (const p of [[-2.6, 12.6], [-1.6, 16.6], [1.8, 12.9], [2.2, 16.2]]) s.spot('play', p[0], 0, p[1], r.f(0, 6.28), { tags: ['hop', 'window', 'kids'] });
  const chats = [[-3.3, 15.0, 0.9], [-2.4, 15.6, PI + 0.6], [-2.6, 14.3, -0.5], [3.4, 14.4, -PI / 2], [2.5, 14.8, PI / 2 + 0.3]];
  for (const c of chats) s.spot('chat', c[0], 0, c[1], c[2], { tags: ['window'] });
  for (let i = 0; i < 4; i++) s.spot('sit', -5.45, 0.46, 15.2 + i * 0.55, PI / 2, { tags: ['window', 'wait'] });
  s.spot('queue', 4.7, 0, 12.6, PI, { tags: ['window'] }); s.spot('queue', 4.6, 0, 13.5, PI, { tags: ['window'] });
  s.path([[0, 9.6], [0, 12.2], [0, 14.6], [0, 17.5], [0, 19.6]]);
  s.path([[0, 12.2], [-4.3, 12.4], [-5.9, 13.6]]); s.path([[0, 14.6], [-4.3, 15.8]]); s.path([[0, 12.2], [3.2, 12.6], [4.7, 12.6]]); s.path([[0, 17.5], [3.5, 17.9]]); s.path([[0, 17.5], [-3.6, 17.9]]);
  s.zoneBox({ id: 'window-lobby', place: 'window-lobby', box: [X0, -0.5, Z0, X1, H, Z1], name: 'The robing lobby', sub: 'The still side · grip slippers', ambience: 'shop', reverb: 'felt', headroom: H, still: true });
  s.loop('murmur', 0, 1.3, 14.5, { vol: 0.2, radius: 9, param: 0.25 });
}

// Slippers: the flag, and a word about how it feels.
function slippers(game, sitting) {
  if (game.flags['window.slippers']) { if (sitting) toast(game, 'Your slippers are already on. The felt holds them like a hand.'); return; }
  game.flags['window.slippers'] = true;
  toast(game, 'Grip slippers on. The soles take hold of the felt with a small dry tearing sound at every step, and the floor is a floor again.', 'found');
}

// ===============================================================================================================
// The red passage: a light trap so the eyes can open. Felt walls, red step lights, two curtains.
// ===============================================================================================================
function buildPassage(game, s, f, st) {
  const g = s.g, X0 = -1.1, X1 = 1.1, Z0 = 19, Z1 = 31, H = 2.5;
  floor(s, X0, Z0, X1, Z1, 0, 'felt', '#2a1a1e', { surf: 'felt' });
  ceiling(s, X0, Z0, X1, Z1, H, 'felt', '#1e1418');
  const wallO = { tint: '#3a1f24', mat: 'felt', skirt: '#140c0e' };
  wall(s, X0 - 0.08, Z0, X0 - 0.08, Z1, 0, H, wallO);
  wall(s, X1 + 0.08, Z0, X1 + 0.08, Z1, 0, H, wallO);
  // red step lights along both skirtings: a glow to find your feet by, no more
  for (const x of [X0 + 0.02, X1 - 0.02]) { g.mat('diffuser', '#ff3a22', { emissive: 2.2 }); for (let z = Z0 + 0.8; z < Z1 - 0.4; z += 1.5) g.box(x - 0.01, 0.12, z, x + 0.01, 0.16, z + 0.4, { faces: x < 0 ? 'X' : 'x' }); }
  s.flush({ tier: 'd', cast: false });
  const clip = [X0 - 0.2, -0.3, Z0, X1 + 0.2, H + 0.1, Z1 + 0.6];
  for (const z of [21.5, 25.0, 29.4]) s.light({ at: [0, 0.35, z], color: [1.0, 0.12, 0.05], power: 0.55, range: 3.4, clip });
  // the light trap: two heavy felt curtains, staggered
  g.mat('felt', '#241417');
  g.sheet([X0, H - 0.02, 26.3], [0.35, H - 0.02, 26.3], [0.35, 0.03, 26.36], [X0, 0.03, 26.36], { sag: 0.0, ripple: 0.05, nu: 6, nv: 3 });
  g.sheet([-0.35, H - 0.02, 27.6], [X1, H - 0.02, 27.6], [X1, 0.03, 27.66], [-0.35, 0.03, 27.66], { sag: 0.0, ripple: 0.05, nu: 6, nv: 3 });
  g.mat('cast', '#3a3430'); g.tube([[X0, H - 0.03, 26.3], [0.4, H - 0.03, 26.3]], 0.015, { segs: 5 }); g.tube([[-0.4, H - 0.03, 27.6], [X1, H - 0.03, 27.6]], 0.015, { segs: 5 });
  s.flush({ tier: 's', cast: false });
  handLine(s, [[X0 + 0.04, Z0 + 0.4], [X0 + 0.04, Z1 - 0.3]], 0.95, { side: 1, tint: '#7a5a3a' });
  handLine(s, [[X1 - 0.04, Z0 + 0.4], [X1 - 0.04, Z1 - 0.3]], 0.95, { side: -1, tint: '#7a5a3a' });
  sign(s, { kind: 'plate', text: 'QUIET FROM HERE', sub: 'red light only · no lamps past the curtain' }, X1 - 0.02, 1.55, 19.9, { face: 'x', w: 0.62, h: 0.24 });
  s.interact({ x: 0.6, y: 1.4, z: 20.2, radius: 1.1, prompt: 'Read the plate', onUse: async (gm) => {
    await say(gm, 'The plate', ['Quiet from here. Red light only. No lamps past the curtain.', 'Red does not undo the twenty minutes your eyes need for the dark. Anything brighter does, and somebody else\'s eight-year-old pays for it.']);
  } });
  for (let i = 0; i < 6; i++) s.spot('queue', (i % 2 ? 0.35 : -0.35), 0, 21.0 + i * 0.85, PI, { tags: ['window', 'wait'] });
  s.path([[0, 19.6], [0, 24.0], [-0.55, 25.9], [0.0, 26.9], [0.55, 28.1], [0, 30.0], [0, 31.6]], { width: 1.0 });
  s.zoneBox({ id: 'window-passage', place: 'window-passage', box: [X0, -0.5, Z0, X1, H, Z1], name: 'The red passage', sub: 'The still side · let your eyes open', ambience: 'quiet', reverb: 'felt', headroom: H, env: ENV_RED, still: true });
}

// ===============================================================================================================
// The gallery: three tiers of couches facing a long pane of water, the shutter, the rail, the River.
// ===============================================================================================================
function buildGallery(game, s, f, r, st, sky, rad) {
  const g = s.g, X0 = -18, X1 = 18, Z0 = 31, ZP = 42.2, YF = -0.9, H = 2.6;
  const WX0 = -16, WX1 = 16, WY0 = -0.55, WY1 = 1.95, ZO = 43.7;          // the glazed opening and the outer pane
  const clip = [X0 - 0.1, YF - 0.3, Z0 - 0.1, X1 + 0.1, H + 0.1, ZP + 0.1];
  // ---- floors and tiers: the back tier at the passage's level, two steps of 0.45 down to the front
  floor(s, X0, Z0, X1, ZP, YF, 'felt', '#241c22', { surf: 'felt' });
  block(s, X0, YF, Z0, X1, 0, 34.4, 'felt', '#2a2026', { surf: 'felt', aoBottom: 0.8 });
  block(s, X0, YF, 34.4, X1, -0.45, 37.6, 'felt', '#271e24', { surf: 'felt', aoBottom: 0.8 });
  // the risers' brass nosings and red step lights
  g.mat('cast', '#7a5a3a'); g.box(X0, -0.03, 34.36, X1, 0.005, 34.44, { faces: 'YZ' }); g.box(X0, -0.48, 37.56, X1, -0.445, 37.64, { faces: 'YZ' }); s.flush({ tier: 'd', cast: false });
  g.mat('diffuser', '#ff3a22', { emissive: 2.0 });
  for (let x = X0 + 0.6; x < X1 - 0.4; x += 1.2) { g.box(x, -0.3, 34.44, x + 0.5, -0.27, 34.45, { faces: 'Z' }); g.box(x, -0.75, 37.64, x + 0.5, -0.72, 37.65, { faces: 'Z' }); }
  s.flush({ tier: 'd', cast: false });
  const AISLES = [-12, 0, 12];
  for (const ax of AISLES) { stairs(s, ax, -0.45, 35.3, 'z', 0.45, 0.9, 1.3, { mat: 'felt', tint: '#33262c', nosing: '#7a5a3a' }); stairs(s, ax, YF, 38.5, 'z', 0.45, 0.9, 1.3, { mat: 'felt', tint: '#33262c', nosing: '#7a5a3a' }); }
  // ---- the ceiling: low, felt, with ribs; the walls felt over panelling
  ceiling(s, X0, Z0, X1, ZP, H, 'felt', '#1a1519');
  g.mat('wood', '#2e221c'); for (let x = X0 + 1.5; x < X1; x += 3) g.box(x - 0.08, H - 0.22, Z0, x + 0.08, H, ZP - 0.4, { faces: 'xXy' }); s.flush({ tier: 's' });
  const wallO = { tint: '#2b2228', mat: 'felt', dado: { h: 0.9, mat: 'wood', tint: '#3a2a22' }, skirt: '#120c0e' };
  wall(s, X0, Z0 + 0.08, X1, Z0 + 0.08, 0, H, Object.assign({}, wallO, { openings: [{ at: 16.9, w: 2.2, h: 2.3 }] }));
  wall(s, X0 + 0.08, Z0, X0 + 0.08, ZP, YF, H - YF, wallO);
  wall(s, X1 - 0.08, Z0, X1 - 0.08, ZP, YF, H - YF, Object.assign({}, wallO, { openings: [{ at: 8.4, w: 1.6, h: 1.0, sill: 0.9 }] }));
  wall(s, X0, ZP + 0.08, X1, ZP + 0.08, YF, H - YF, { tint: '#1c171b', mat: 'felt', t: 0.16, skirt: false, openings: [{ at: WX0 - X0, w: WX1 - WX0, h: WY1 - WY0, sill: WY0 - YF }] });

  // ---- the glazing: a metre and a half of water between two panes, in steel bays four metres wide
  g.mat('cast', '#20252c', { rough: 0.1 });
  g.box(WX0, WY0 - 0.06, ZP + 0.16, WX1, WY0, ZO + 0.05, { faces: 'Y' }); g.box(WX0, WY1, ZP + 0.16, WX1, WY1 + 0.06, ZO + 0.05, { faces: 'y' });
  g.box(WX0 - 0.06, WY0, ZP + 0.16, WX0, WY1, ZO + 0.05, { faces: 'X' }); g.box(WX1, WY0, ZP + 0.16, WX1 + 0.06, WY1, ZO + 0.05, { faces: 'x' });
  s.flush({ tier: 's' });
  g.mat('cast', '#14181d', { rough: 0.05 });
  for (let x = WX0 + 4; x < WX1 - 0.1; x += 4) { g.box(x - 0.06, WY0, ZP + 0.16, x + 0.06, WY1, ZP + 0.36, { bevel: 0.01 }); g.box(x - 0.05, WY0, ZO - 0.2, x + 0.05, WY1, ZO, { bevel: 0.01 }); }
  // a brass frame on the room side, the bays numbered
  g.mat('cast', '#7a5a3a', { rough: -0.1 }); g.box(WX0 - 0.1, WY0 - 0.1, ZP - 0.02, WX1 + 0.1, WY0, ZP + 0.18); g.box(WX0 - 0.1, WY1, ZP - 0.02, WX1 + 0.1, WY1 + 0.08, ZP + 0.18);
  s.flush({ tier: 's' });
  // The panes themselves are not drawn as glass: any pane in this engine reflects a little lamplight, and over a black sky
  // that reads as grey haze. The water shows instead as its edges: the inner pane's thick lip, caught faintly green where
  // the bays' seals let a little light into the water, and the clamp bars that hold each tank.
  g.mat('glaze', '#24423e', { emissive: 0.05, rough: -0.3 });
  for (let x = WX0; x < WX1 - 0.1; x += 4) {
    g.box(x + 0.07, WY0, ZP + 0.18, x + 3.93, WY0 + 0.012, ZP + 0.3, { faces: 'Yz' }); g.box(x + 0.07, WY1 - 0.012, ZP + 0.18, x + 3.93, WY1, ZP + 0.3, { faces: 'yz' });
    g.box(x + 0.07, WY0, ZO - 0.24, x + 3.93, WY0 + 0.01, ZO - 0.2, { faces: 'Y' });
  }
  s.flush({ tier: 'd', cast: false });
  g.mat('cast', '#2a2f36'); for (let x = WX0 + 2; x < WX1; x += 4) for (const y of [WY0 + 0.02, WY1 - 0.06]) g.box(x - 0.25, y, ZP + 0.16, x + 0.25, y + 0.04, ZP + 0.24, { bevel: 0.008 });
  s.flush({ tier: 'd' });
  s.solid(WX0, WY0, ZP, WX1, WY1, ZP + 0.3);

  // ---- the River: painted on a curved screen sixty metres out, true to the eye, behind the water
  { const n0 = g.buf.nv, R = 60, CZ = 38, CY = 0.5, A0 = -80, A1 = 80, NA = 64, YT = 50, YB = -35, NV = 6;
    g.atlas(sky.page, { emissive: 2.6 });
    const U = (u) => sky.u0 + (sky.u1 - sky.u0) * u, V = (v) => sky.v0 + (sky.v1 - sky.v0) * v;
    for (let i = 0; i < NA; i++) {
      const aLo = (A0 + (A1 - A0) * i / NA) * PI / 180, aHi = (A0 + (A1 - A0) * (i + 1) / NA) * PI / 180;
      const uL = (80 - aHi * 180 / PI) / 160, uR = (80 - aLo * 180 / PI) / 160;
      for (let j = 0; j < NV; j++) {
        const yT = YT - (YT - YB) * j / NV, yB = YT - (YT - YB) * (j + 1) / NV, vT = j / NV, vB = (j + 1) / NV;
        const P = (a, y) => [R * Math.sin(a), CY + y, CZ + R * Math.cos(a)];
        g.quad(P(aHi, yB), P(aLo, yB), P(aLo, yT), P(aHi, yT), { uv: [U(uL), V(vB), U(uR), V(vT)] });
      }
    }
    trueToFlat(g, n0, RHO);
    s.flush({ tier: 's' });
  }

  // ---- the shutter: felt-faced slats that roll up into a housing over the pane
  g.mat('wood', '#241a16'); g.box(WX0 - 0.2, WY1 + 0.08, ZP - 0.5, WX1 + 0.2, H, ZP, { bevel: 0.02, faces: 'zyxX' });
  g.mat('cast', '#7a5a3a'); g.box(WX0 - 0.2, WY1 + 0.08, ZP - 0.53, WX1 + 0.2, WY1 + 0.14, ZP - 0.49); s.flush({ tier: 's' });
  const shutter = movingMesh(s, (sg) => {
    for (let k = 0; k < 21; k++) {
      const y0 = WY0 + k * 0.12, y1 = Math.min(WY1, y0 + 0.112);
      sg.mat('felt', k % 2 ? '#2b2125' : '#2e2428'); sg.box(WX0, y0, -0.03, WX1, y1, 0.03, { faces: 'zZyY' });
    }
    sg.mat('cast', '#9a7a42', { rough: -0.1 }); sg.box(WX0, WY0, -0.045, WX1, WY0 + 0.05, 0.045, { bevel: 0.01 });
    sg.mat('cast', '#3a3430'); for (let x = WX0 + 2; x < WX1; x += 4) sg.box(x - 0.08, WY0 + 0.05, -0.05, x + 0.08, WY0 + 0.12, -0.03);
  }, { origin: [0, 0, ZP - 0.25], center: [0, 0.7, 0], radius: 17, far: 120 });
  // ---- the rail, its felt pad, and the card on it
  { const RZ = 41.55, RY = YF + 1.0;
    g.mat('cast', '#9a7a42', { rough: -0.12 }); g.tube([[X0 + 0.1, RY, RZ], [X1 - 0.1, RY, RZ]], 0.035, { segs: 10 });
    g.mat('felt', '#5b2a33'); g.box(X0 + 0.1, RY + 0.02, RZ - 0.07, X1 - 0.1, RY + 0.06, RZ + 0.07, { bevel: 0.015 });
    g.mat('cast', '#3a3028'); for (let x = X0 + 1; x < X1; x += 2) g.tube([[x, YF, RZ], [x, RY, RZ]], 0.022, { segs: 6 });
    s.flush({ tier: 's', cast: false });
    s.solid(X0, YF, RZ - 0.06, X1, RY + 0.06, RZ + 0.06);
    sign(s, { kind: 'plate', text: 'WHAT YOU SEE', sub: 'the River · the Shelf · the holes' }, 0.0, RY + 0.075, RZ - 0.02, { face: 'Z', w: 0.36, h: 0.15, thick: 0.01 });
  }
  // ---- couches in three tiers, in bays between the aisles
  const BAYS = [[X0 + 0.5, -12.8], [-11.2, -0.8], [0.8, 11.2], [12.8, X1 - 0.5]];
  const ROWS = [[YF, 39.45], [-0.45, 36.5], [0, 33.35]];
  const CLOTH = ['#3a2f3f', '#3f2a2e', '#2f3540', '#3a3328'];
  let seatN = 0;
  ROWS.forEach((row, ri) => {
    for (const b of BAYS) {
      const len = b[1] - b[0], n = Math.max(1, Math.round(len / 2.6)), w = len / n;
      for (let i = 0; i < n; i++) {
        const cx = b[0] + w * (i + 0.5);
        prop(s, 'lm-axle-back.couch', cx, row[0], row[1], 0, { w: w - 0.12, cloth: CLOTH[(ri + i) % CLOTH.length], wood: WOOD });
        if ((i + ri) % 2 === 0) { seatN++; seat(s, cx, row[0] + 0.4, row[1] + 0.05, 0, (gm) => (st.state === 'open' ? 'Sit and look' : 'Sit and wait for the shutter'), { eye: 0.72, radius: 1.1, pitch: 0.06, onSit: (gm) => sitDown(gm, st) }); }
      }
    }
  });
  // a few blankets left on couches
  s.detail(() => { for (const p of [[-14.2, 39.45, YF], [5.5, 36.5, -0.45], [-6.2, 33.35, 0], [9.6, 39.45, YF]]) { g.mat('knit', ['#5b4060', '#7a2f3c', '#2f5d5a', '#d6a640'][Math.abs(Math.round(p[0])) % 4]); g.box(p[0] - 0.25, p[2] + 0.4, p[1] - 0.2, p[0] + 0.25, p[2] + 0.5, p[1] + 0.18, { bevel: 0.03 }); } });

  // ---- light: a few low red lamps, a red bounce, and starlight when the shutter is up
  for (const p of [[-15, 0.8, 32.0], [-5, 0.8, 31.6], [5, 0.8, 31.6], [15, 0.8, 32.0], [-17.5, 0.2, 38.5], [17.5, 0.2, 38.5]]) {
    g.mat('diffuser', '#ff4a2a', { emissive: 2.4 }); g.ball(p[0], p[1], p[2], 0.06, 0.04, 0.06, { segs: 8, rings: 5 }); s.flush({ tier: 'd', cast: false });
    st.red.push(s.light({ at: [p[0], p[1], p[2]], color: [1.0, 0.13, 0.05], power: 0.9, range: 5.5, clip }));
  }
  st.redAmb = s.ambient({ box: [X0, YF, Z0, X1, H, ZP], sky: '#ff3a26', ground: '#5a1a14', power: 0.05, spec: 0.2 });
  st.warm = s.ambient({ box: [X0, YF, 36, X1, H, ZP + 0.4], sky: '#ffe2b0', ground: '#5a4a3c', power: 0.07, spec: 0.5 });
  st.warm.scale = 0;
  // ---- the small side pane at the spinward end: along the radiators
  { const PX = X1, PZ0 = 39.4, PZ1 = 41.0, PY0 = 0.0, PY1 = 1.0;
    g.mat('cast', '#20252c'); g.box(PX, PY0 - 0.05, PZ0, PX + 0.8, PY0, PZ1, { faces: 'Y' }); g.box(PX, PY1, PZ0, PX + 0.8, PY1 + 0.05, PZ1, { faces: 'y' }); g.box(PX, PY0, PZ0 - 0.05, PX + 0.8, PY1, PZ0, { faces: 'Z' }); g.box(PX, PY0, PZ1, PX + 0.8, PY1, PZ1 + 0.05, { faces: 'z' });
    g.mat('cast', '#7a5a3a'); g.box(PX - 0.1, PY0 - 0.08, PZ0 - 0.08, PX - 0.04, PY0, PZ1 + 0.08); g.box(PX - 0.1, PY1, PZ0 - 0.08, PX - 0.04, PY1 + 0.08, PZ1 + 0.08); g.box(PX - 0.1, PY0, PZ0 - 0.08, PX - 0.04, PY1, PZ0); g.box(PX - 0.1, PY0, PZ1, PX - 0.04, PY1, PZ1 + 0.08);
    s.flush({ tier: 's' });
    g.mat('glaze', '#24423e', { emissive: 0.05 }); g.box(PX + 0.1, PY0, PZ0, PX + 0.2, PY0 + 0.012, PZ1, { faces: 'Y' }); s.flush({ tier: 'd', cast: false });
    const QX = PX + 1.5, QW = 3.6, QH = 1.8, QZ = (PZ0 + PZ1) / 2, QY = 0.55;
    g.atlas(rad.page, { emissive: 2.6 });
    // seen from inside looking spinward (+x), the picture's left is toward the low z
    const NQ = 4; for (let i = 0; i < NQ; i++) { const z0 = QZ - QW / 2 + QW * i / NQ, z1 = QZ - QW / 2 + QW * (i + 1) / NQ, u0 = rad.u0 + (rad.u1 - rad.u0) * i / NQ, u1 = rad.u0 + (rad.u1 - rad.u0) * (i + 1) / NQ;
      g.quad([QX, QY - QH / 2, z0], [QX, QY - QH / 2, z1], [QX, QY + QH / 2, z1], [QX, QY + QH / 2, z0], { uv: [u0, rad.v1, u1, rad.v0] }); }
    s.flush({ tier: 's' });
    sign(s, { kind: 'plate', text: 'ALONG THE RADIATORS', sub: 'spinward · our own' }, PX - 0.11, PY0 - 0.25, (PZ0 + PZ1) / 2, { face: 'x', w: 0.5, h: 0.17 });
    s.interact({ x: PX - 0.7, y: 0.6, z: (PZ0 + PZ1) / 2, radius: 1.2, prompt: 'Look along the radiators', onUse: async (gm) => {
      await say(gm, 'The small pane', st.state === 'open'
        ? ['Along the aft face of the radiator layer: row after row of panels running off into the dark, catching a little gold from the River. About three hundred and ninety square kilometres of them carry Chervil\'s heat away, and these are some of them.', 'Far down the rows, one warm lamp: a closed sled, a back crew working a pump. They see the stars on ordinary working days.']
        : ['Through a small square of water, rows of dark panels running off spinward, and far down them a single warm lamp. Your eyes are not open yet. Wait for the shutter, and look again.']);
    } });
  }
  // ---- things to read and do
  s.interact({ x: 0, y: 0.2, z: 41.1, radius: 1.0, prompt: 'Read the card on the rail', onUse: async (gm) => {
    await say(gm, 'What you see', ['The band across the middle is the River: the stars of the disk round the galaxy\'s middle, one to two hundred parsecs out. Their light set off centuries ago.', 'The fainter glow above and below it is the Shelf: the bulge beyond, too far off to break into stars.', 'The brightest are orange: old giants. There is no near star at all. The ones that once crowded the middle were taken apart long ago, and their hydrogen is in the drums\' jackets.', 'The black shapes are rafts, other people\'s, hiding what is behind them: about a sixth of the sky. The brown-violet at the River\'s frayed edges is dust. The back crews call that colour bruise.']);
  } });
  for (const lx of [-8, 7]) s.interact({ x: lx, y: 0.2, z: 41.15, radius: 1.3, prompt: 'Lean on the rail', onUse: async (gm) => {
    if (st.state !== 'open') { await say(gm, 'The rail', ['The shutter is down: dark felt slats behind a metre and a half of water. It goes up for people sitting, after twenty minutes in the red light.']); return; }
    const L = [['Watch the edge of the big one, just above the River, by the red star. It takes most of an hour, but the edge creeps over the star, and the star goes out.'], ['Out there they take the stars apart and sort them, and send the metal in. It falls for about a million years. The rail under your hands, your slippers, every bit of you heavier than helium: all of it fell out of that.'], ['The glass is cold under your fingers and the water in it is perfectly still. Behind you a hundred people are breathing quietly in the dark.']];
    const k = (st.lean = (st.lean || 0) + 1); await say(gm, 'The rail', L[k % L.length]);
  } });
  s.interact({ x: 2.2, y: 1.0, z: 40.9, radius: 1.4, kind: 'talk', prompt: 'Talk to the guide', onUse: async (gm) => {
    if (st.state !== 'open') { await say(gm, GUIDE, ['Find a seat. When enough of the round are sitting, we wait twenty minutes in the red light, because eyes need that long to wake up to the dark. Nobody wants to waste their one time.', 'You are the guest from Spelt. Then you have seen it once already, at eight, from wherever Spelt sends its children. This will be different. It always is.']); return; }
    const L = [['Take your time. You have the hour.'], ['I tell every round the same thing: do not try to remember it. You will anyway.'], ['The crews used to bet on the rafts\' edges. Hours at the stove. The board is still out on the dock, if you passed it.']];
    const k = (st.guide = (st.guide || 0) + 1); await say(gm, GUIDE, L[k % L.length]);
  } });

  // ---- people: visitors on the couches (from the props), the guide, a few standing at the rail, an adult and child at the side pane
  s.spot('stand', 1.6, YF, 40.9, PI, { tags: ['guide', 'window'] });
  for (const p of [[-9.4, 40.95], [-3.0, 40.95], [4.3, 40.95], [10.4, 40.95], [-14.6, 40.95]]) s.spot('stand', p[0], YF, p[1], 0, { tags: ['watch', 'window', 'rail'] });
  s.spot('stand', 15.6, YF, 41.0, PI / 2 - 0.5, { tags: ['watch', 'window'] }); s.spot('play', 15.2, YF, 40.3, PI / 2, { tags: ['window', 'kids'] });
  s.path([[0, 0, 31.6], [-12, 0, 31.9], [-17, 0, 31.9]]); s.path([[0, 0, 31.6], [12, 0, 31.9], [17, 0, 31.9]]);
  for (const ax of AISLES) s.path([[ax, 0, 31.9], [ax, 0, 34.1], [ax, -0.45, 35.6], [ax, -0.45, 37.3], [ax, YF, 38.8], [ax, YF, 40.9]]);
  s.path([[-17, YF, 40.9], [-12, YF, 40.9], [0, YF, 40.9], [12, YF, 40.9], [17, YF, 40.9]]);
  for (const ax of AISLES) for (const row of ROWS) { s.path([[ax, row[0], row[1] + 0.75], [ax + 5.4, row[0], row[1] + 0.75]], { width: 0.9 }); s.path([[ax, row[0], row[1] + 0.75], [ax - 5.4, row[0], row[1] + 0.75]], { width: 0.9 }); }

  s.trigger({ box: [WX0, YF - 0.2, 40.4, WX1, YF + 2.2, 41.6], onEnter(gm) { if (st.state === 'open') seenRiver(gm); } });
  s.zoneBox({ id: 'window-gallery', place: 'window-gallery', box: [X0, YF - 0.5, Z0, X1, H, ZP + 1.6], name: 'The Window', sub: 'The still side · behind the radiators', ambience: 'quiet', reverb: 'felt', headroom: H - YF, env: ENV_GALLERY, still: true });

  // ---- the shutter's life: red lamps down, slats up, the River
  s.every((dt, gm) => {
    if (st.state === 'opening') { st.k = Math.min(1, st.k + dt / 9); if (st.k >= 1) { st.state = 'open'; if (gm.player.frame === f) seenRiver(gm); } }
    const lift = smoothstep(0.25, 1, st.k), dim = smoothstep(0, 0.45, st.k);
    shutter.origin[1] = lift * 2.62;
    for (const l of st.red) l.scale = 1 - 0.95 * dim;
    if (st.redAmb) st.redAmb.scale = 1 - 0.92 * dim;
    st.warm.scale = lift;
  });
}

// The journal's flag: the player has looked through the Window (once).
function seenRiver(game) {
  if (game.flags.saw_river) return;
  game.flags.saw_river = true;
  if (game.story && game.story.persist) game.story.persist();
  game.events.emit('window:seen');
}

// Sitting down in the gallery. The first time, the wait in the red light and the shutter; after that, a line or two.
async function sitDown(game, st) {
  seenRiver(game);
  if (st.state === 'open') {
    const L = [['You sit. Nobody near you is talking. A child two rows down has both hands flat on the rail and has not moved for a long time.'], ['You find the big raft again, by the red star. Its edge has moved. Or you think it has.'], ['The River runs right across the dark from one end of the glass to the other, thick and bright in the middle and frayed at the ends, and you stop trying to count anything.']];
    const k = (st.sat = (st.sat || 0) + 1); await say(game, 'The Window', L[k % L.length]); return;
  }
  if (st.state !== 'shut') return;
  st.state = 'waiting';
  await say(game, GUIDE, ['Everyone sitting. Good. Now twenty minutes in the red light. Eyes need that long to wake up to the dark.', 'Talk if you like, quietly. Nobody looks at anything bright.']);
  await runShutter(game, st);
}
// The wait and the opening, without the guide's first words (the seats call it after them; tests call it directly).
async function runShutter(game, st) {
  st.state = 'waiting';
  game.busy++;
  try {
    if (game.ui) await game.ui.fade(true, 1.2);
    if (game.clock) { game.clock.minutes += 20; while (game.clock.minutes >= 1440) { game.clock.minutes -= 1440; game.clock.day++; } game.events.emit('clock:jump'); }
    await new Promise((res) => setTimeout(res, 600));
    if (game.ui) { await game.ui.fade(false, 1.6); toast(game, 'Twenty minutes later. The red lamps go down, one by one.'); }
  } finally { game.busy--; }
  await new Promise((res) => setTimeout(res, 1800));
  st.state = 'opening';
  sfx(game, 'shutter', game.player.frame, 0, 1.0, 42);
  await new Promise((res) => setTimeout(res, 9500));
  find(game, 'window-at-eight');
  await say(game, GUIDE, ['That is the River.', 'Take your time. You have the hour.']);
}
