// The front axle: where all of Chervil's power comes in. About 160 GW arrives from the rectennas in front of the raft
// through one rotary joint on the axis, and it makes no sound at all. The back axle, where the same power leaves as
// heat, is the loudest place in the drum; this is its quiet twin.
//
// Frame 'axle-front': 60 m from the axis, inside the front cap, a fiftieth of a g. Flat x is an angle round the axis
// (x / 60 radians), flat y is height toward it (the axis is at y = 60), flat z runs toward the Hollow (z = 10 is the
// cap's inner face). Anything that spans every x goes all the way round the axis.
//
//   the Lap (z -3..0): a corridor right round the axis, 377 m, which joins itself straight across from the lobby.
//   on its Hollow side (z 0..9.6): the Hundreds, the warden's post, the lift lobby, an alcove, the Slow Pour.
//   on its front side (z -3.3..-44): the Cold Room, the power hall, seen from a netted apron behind a rail.
import { floor, ceiling, wall, lamp, roomGlow, warm } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { PI, RHO, C, HALF, XR, say, runX, handLine } from './lm_axle_front_parts.js';
import { buildHall, HZ0, AX } from './lm_axle_front_hall.js';
import { buildTeaRoom, buildHundreds, buildWarden, wardenRules, buildAlcove } from './lm_axle_front_rooms.js';

const LZ0 = -3, LH = 3.2;                       // the Lap: z -3..0, ceiling at 3.2
const ROOMS = [-24, 24];                         // the stretch of the Lap's back wall the rooms build
const ENV_LAP = { exposure: 1.0, autoKey: 0.18, autoMin: 0.4, autoMax: 2.6, bloom: 0.05, contrast: 1.08, saturation: 1.08, warmth: 0.18, vignette: 0.28 };

export const place = {
  id: 'lm-axle-front', name: 'The front axle', order: 10,
  region: 'axle-front',
  stops: [{ id: 'axle-front', name: 'The front axle', sub: 'the Cold Room · the Slow Pour · the Lap', group: 'The axles', spawn: 'axle-front', deck: 376, zd: 0 }],
  async build(game) {
    const W = game.world;
    const f = W.frame('axle-front', RHO, 0, -10);
    const s = W.scope('lm-axle-front', f);
    const relend = () => { if (game.atlas && game.atlas.begin) game.atlas.begin('region:axle-front'); };
    const tick = async () => { await new Promise(requestAnimationFrame); relend(); };

    buildLobby(game, s, f);
    buildLap(game, s, f);
    await tick();
    buildHall(game, s, f);
    await tick();
    const tea = buildTeaRoom(game, s, f);
    buildHundreds(game, s, f);
    buildWarden(game, s, f);
    wardenRules(game, s, f, -7.4);
    buildAlcove(game, s, f);
    await tick();

    // the Lap joins itself straight across the axis from the lobby: carry the player over the seam
    s.every((dt, gm) => {
      const p = gm && gm.player; if (!p || p.frame !== f) return;
      if (p.pos.x > HALF) p.pos.x -= C; else if (p.pos.x < -HALF) p.pos.x += C;
    });

    let left = s.finish(24);
    while (left) { await tick(); left = s.finish(24); }
    game.spawns['axle-front'] = { frame: f, x: 0, y: 0, z: 5.6, yaw: 0 };
    game.spawns['cold-room'] = { frame: f, x: 0, y: 0.04, z: -9.0, yaw: 0 };
    game.spawns['slow-pour'] = { frame: f, x: tea.spawn.x, y: 0, z: tea.spawn.z, yaw: tea.spawn.yaw };
    game.spawns['the-lap'] = { frame: f, x: HALF - 7, y: 0, z: -1.5, yaw: PI / 2 };
  },
};

// ===============================================================================================================
// The lift lobby: two berths in the back wall, open to the Lap, the Cold Room's door straight across.
// ===============================================================================================================
function buildLobby(game, s, f) {
  const g = s.g, X0 = -5, X1 = 5, Z1 = 8.2, H = LH;
  const clip = [X0 - 0.1, -0.3, -0.1, X1 + 0.1, H + 0.1, Z1 + 0.1];
  floor(s, X0, 0.16, X1, Z1, 0, 'terrazzo', '#b9ab92');
  s.deco(() => { g.mat('terrazzo', '#2f4a6a'); g.box(-1.3, 0, 0.4, 1.3, 0.006, Z1 - 0.6, { faces: 'Y' }); g.mat('terrazzo', '#d6a640'); g.box(-1.42, 0, 0.4, -1.3, 0.007, Z1 - 0.6, { faces: 'Y' }); g.box(1.3, 0, 0.4, 1.42, 0.007, Z1 - 0.6, { faces: 'Y' }); });
  ceiling(s, X0, 0, X1, Z1, H, 'paint', '#ebe1ca');
  const wallO = { mat: 'plaster', tint: '#e2d4b8', dado: { h: 1.0, mat: 'panel', tint: '#2f4a6a' }, skirt: '#2a2420' };
  wall(s, X0, 0.08, X1, 0.08, 0, H, Object.assign({}, wallO, { tintB: '#e6dbc4', dado: { h: 1.0, mat: 'felt', tint: '#7a2f3c' }, openings: [{ at: 1.5, w: 7, h: 2.7 }] }));
  wall(s, X0 + 0.08, 0.16, X0 + 0.08, Z1, 0, H, wallO);
  wall(s, X1 - 0.08, 0.16, X1 - 0.08, Z1, 0, H, wallO);
  wall(s, X0, Z1 - 0.08, X1, Z1 - 0.08, 0, H, wallO);
  roomGlow(s, X0, 0, 0, X1, H, Z1, { sky: '#ffdcae', ground: '#a8794f', power: 0.28 });
  s.deco(() => { g.mat('wood', '#6b4a2f'); for (let z = 1.2; z < Z1; z += 1.6) g.box(X0 + 0.1, H - 0.1, z - 0.05, X1 - 0.1, H, z + 0.05, { faces: 'zZy' }); });
  // felt hangings in Chervil colours either side, soft walls for a quiet place
  s.deco(() => { const HC = ['#c9552e', '#2f8f8a', '#e7b547', '#7a3a9a']; let k = 0; for (const z of [3.2, 4.9]) for (const x of [X0 + 0.17, X1 - 0.17]) { g.mat('felt', HC[k++ % 4]); g.box(x - 0.02, 1.3, z - 0.7, x + 0.02, 2.75, z + 0.7, { faces: x < 0 ? 'X' : 'x' }); } });
  lamp(s, 'panel', 0, H, 2.6, { w: 1.6, d: 0.5, K: 3100, power: 0.85, clip });
  lamp(s, 'panel', 0, H, 6.2, { w: 1.6, d: 0.5, K: 3100, power: 0.85, clip });
  // the berths: brass doors in stone frames, a lit indicator over each, a call plate
  const BZ = Z1 - 0.16;
  for (const bx of [-2.3, 2.3]) {
    const bw = 1.3;
    g.mat('stone', '#9c8f7c'); g.box(bx - bw / 2 - 0.18, 0, BZ - 0.14, bx + bw / 2 + 0.18, 2.6, BZ, { faces: 'xXzY' });
    g.mat('cast', '#b08a45', { rough: -0.1 }); g.box(bx - bw / 2, 0.02, BZ - 0.18, bx - 0.01, 2.36, BZ - 0.14); g.box(bx + 0.01, 0.02, BZ - 0.18, bx + bw / 2, 2.36, BZ - 0.14);
    g.mat('cast', '#8a6d3b'); for (const yy of [0.5, 1.2, 1.9]) g.box(bx - bw / 2 + 0.06, yy, BZ - 0.195, bx + bw / 2 - 0.06, yy + 0.03, BZ - 0.18);
    g.mat('diffuser', '#ffd9a0', { emissive: 3, lamp: true }); g.box(bx - 0.2, 2.44, BZ - 0.16, bx + 0.2, 2.52, BZ - 0.14);
    g.mat('cast', '#3a3430'); g.box(bx + bw / 2 + 0.25, 1.05, BZ - 0.06, bx + bw / 2 + 0.4, 1.3, BZ, { bevel: 0.01 });
    g.mat('diffuser', '#3fe0d0', { emissive: 2 }); g.box(bx + bw / 2 + 0.3, 1.13, BZ - 0.07, bx + bw / 2 + 0.35, 1.18, BZ - 0.06);
    s.flush({ tier: 's' });
  }
  s.interact({ x: 0, y: 1.2, z: Z1 - 0.9, radius: 2.0, prompt: 'Call a cab', onUse: (gm) => { if (gm.cab) gm.cab.open('axle-front'); } });
  sign(s, { kind: 'street', text: 'CABS · THE FRONT AXLE', sub: 'deck 376 · the axis · the front cap' }, 0, 2.8, BZ - 0.01, { face: 'z', w: 2.8, h: 0.3, glow: 1.2 });
  // benches, a fern under the lamp, hand lines down both walls
  prop(s, 'bench', X0 + 0.5, 0, 4.2, PI / 2, { w: 2.4, back: true, wood: '#7a5233' }, { noSpots: true });
  prop(s, 'bench', X1 - 0.5, 0, 4.2, -PI / 2, { w: 2.4, back: true, wood: '#7a5233' }, { noSpots: true });
  prop(s, 'plant', X1 - 0.6, 0, 7.4, 0, { kind: 'fern', size: 1.0, pot: '#2f6f73' });
  prop(s, 'plant', X0 + 0.6, 0, 7.4, 0, { kind: 'broad', size: 0.9, pot: '#a3563a' });
  handLine(s, [[X0 + 0.16, 0.8], [X0 + 0.16, 7.6]], 1.0, { side: -1 }); handLine(s, [[X1 - 0.16, 0.8], [X1 - 0.16, 7.6]], 1.0);
  // the board: where you are
  const board = { kind: 'notice', title: 'The front axle', lines: ['All of Chervil\'s power comes in here:', 'about 160 GW, and not a sound.', 'You are 60 metres from the axis.', 'A fiftieth of a g. Hold a line.', 'The Cold Room, straight across.', 'The Slow Pour · the Hundreds', 'The Lap: 377 metres round.'] };
  sign(s, board, X0 + 0.17, 1.75, 1.8, { face: 'X', w: 0.95, h: 1.15 });
  s.interact({ x: X0 + 0.8, y: 1.6, z: 1.8, radius: 1.3, prompt: 'Read the board', onUse: async (gm) => {
    await say(gm, 'The board', ['All of Chervil\'s power comes in through this axle: about 160 gigawatts from the rectennas in front of the raft, through one rotary joint on the axis. It leaves again at the back axle, 3.75 kilometres behind you, as heat.', 'You are sixty metres from the axis and weigh a fiftieth of what you weigh at the rim. In front of you, past the Cold Room, is the cap: steel, half a metre of water, and a hundred and fifty metres of liquid hydrogen at twenty kelvin.', 'At the bottom, in chalk: walk spinward if you want to feel your feet.']);
  } });
  sign(s, { kind: 'plate', text: 'A fiftieth of a g', lines: ['walk slowly · hold a line'] }, X1 - 0.17, 1.5, 1.8, { face: 'x', w: 0.5, h: 0.2 });
  sign(s, { kind: 'poster', title: 'Power in', lines: ['160 GW from the rectennas', 'through one joint', 'without a sound', 'and out at the back as heat'], palette: ['#1f2b40', '#ffb347', '#e9e1cf'] }, X1 - 0.17, 1.65, 5.9, { face: 'x', w: 0.62, h: 0.9 });
  s.spot('sit', X0 + 0.55, 0.46, 3.6, PI / 2, { tags: ['wait'] });
  s.path([[0, Z1 - 1.2], [0, 1.0], [0, -1.5], [0, HZ0 - 0.6]]); s.path([[-10.95, -1.5], [0, -1.5], [11.15, -1.5]]);
  s.zoneBox({ id: 'axle-front-lobby', place: 'axle-front', box: [X0, -0.5, 0.1, X1, H, Z1], name: 'The front axle', sub: 'The lift lobby · the axis', ambience: 'none', reverb: 'room', headroom: H, env: ENV_LAP });
  s.loop('air', 0, 2.8, 4.5, { vol: 0.16, radius: 8 });
}

// ===============================================================================================================
// The Lap: a corridor right round the axis. Felt below the hand line, warm plaster above, ribs across a ceiling that
// curves away overhead; windows on its inner wall into the Cold Room; marks at every eighth; at halfway, the seam.
// ===============================================================================================================
const WIN_W = 1.5, WIN_Y0 = 1.0, WIN_Y1 = 2.3;
function windowsIn(a, b) {
  const out = [];
  for (let k = -40; k <= 40; k++) { const x = k * 6 + 3; if (Math.abs(x) < 9 || Math.abs(x) > HALF - 4 || Math.abs(x + 7.4) < 1.6) continue; if (x - WIN_W / 2 >= a && x + WIN_W / 2 <= b) out.push(x); }
  return out;
}
function buildLap(game, s, f) {
  const g = s.g;
  const EIGHTHS = [];
  for (let k = 1; k < 8; k++) { if (k === 4) continue; const d = C * k / 8; EIGHTHS.push({ k, d, x: d <= HALF ? d : d - C }); }
  // ---- floor, ceiling, ribs, the centre line, the walls, piece by piece
  runX(-HALF, HALF, 7.86, (a, b) => {
    s.structure(() => {
      g.mat('speckle', '#3d5652'); g.box(a, -0.02, LZ0, b, 0, 0, { faces: 'Y' });
      g.mat('paint', '#c9a24a'); g.box(a, 0.002, -1.56, b, 0.007, -1.44, { faces: 'Y' });
      g.mat('paint', '#efe4cc'); g.box(a, LH, LZ0, b, LH + 0.02, 0, { faces: 'y' });
    });
    s.deco(() => { g.mat('wood', '#8a6240'); for (let x = Math.ceil(a / 2) * 2; x < b; x += 2) g.box(x - 0.04, LH - 0.06, LZ0, x + 0.04, LH, 0, { faces: 'xXy' }); });
    // felt hangings on the outer wall between the rooms' stretch and the seam, one every twelve metres
    s.deco(() => { const HC = ['#c9552e', '#2f8f8a', '#e7b547', '#7a3a9a', '#2f5fa8']; for (let x = Math.ceil((a - 6) / 12) * 12 + 6; x < b; x += 12) { if (Math.abs(x) < 27 || Math.abs(x) > HALF - 3) continue; g.mat('felt', HC[Math.abs(Math.round(x / 12)) % 5]); g.box(x - 0.55, 1.15, -0.03, x + 0.55, 2.5, -0.01, { faces: 'z' }); g.mat('cast', '#8a6d3b'); g.box(x - 0.6, 2.5, -0.05, x + 0.6, 2.53, -0.01, { faces: 'zYy' }); } });
    // the inner wall (toward the Cold Room): felt below the sill, plaster above, windows between
    const wins = windowsIn(a, b), door = a < 1.2 && b > -1.2;
    s.structure(() => {
      const FZ = LZ0, BZ = HZ0;
      const span = (x0, x1, y0, y1, mat, tint, hall) => { if (x1 - x0 < 1e-3) return; g.mat(mat, tint); g.box(x0, y0, FZ, x1, y1, FZ + 0.001, { faces: 'Z' }); if (hall && !(x1 > -AX && x0 < AX)) { g.mat('panel', '#2a3142'); g.box(x0, y0, BZ, x1, y1, BZ + 0.001, { faces: 'z' }); } };
      // build the inner wall as columns between windows (and the door)
      const cuts = wins.map((x) => [x - WIN_W / 2, x + WIN_W / 2, WIN_Y0, WIN_Y1]); if (door) cuts.push([-1.2, 1.2, 0, 2.45]);
      cuts.sort((p, q) => p[0] - q[0]);
      let u = a;
      for (const c of cuts) {
        const c0 = Math.max(a, c[0]), c1 = Math.min(b, c[1]);
        span(u, c0, 0, 1.0, 'felt', '#7a2f3c', true); span(u, c0, 1.0, LH, 'plaster', '#e6dbc4', true);
        if (c[2] > 0) { span(c0, c1, 0, 1.0, 'felt', '#7a2f3c', true); }
        span(c0, c1, c[3], LH, 'plaster', '#e6dbc4', true);
        u = c1;
      }
      span(u, b, 0, 1.0, 'felt', '#7a2f3c', true); span(u, b, 1.0, LH, 'plaster', '#e6dbc4', true);
      if (!(b > -AX && a < AX)) { g.mat('panel', '#2a3142'); g.box(a, LH, BZ, b, 3.45, BZ + 0.001, { faces: 'z' }); }
      // the reveals of the windows: brass sills and frames, dark jambs
      for (const x of wins) {
        g.mat('concrete', '#6a6f78'); g.box(x - WIN_W / 2, WIN_Y0, BZ, x - WIN_W / 2 + 0.001, WIN_Y1, FZ, { faces: 'X' }); g.box(x + WIN_W / 2 - 0.001, WIN_Y0, BZ, x + WIN_W / 2, WIN_Y1, FZ, { faces: 'x' }); g.box(x - WIN_W / 2, WIN_Y1 - 0.001, BZ, x + WIN_W / 2, WIN_Y1, FZ, { faces: 'y' });
        g.mat('cast', '#b08a45', { rough: -0.1 }); g.box(x - WIN_W / 2 - 0.05, WIN_Y0 - 0.04, BZ, x + WIN_W / 2 + 0.05, WIN_Y0, FZ + 0.12, { faces: 'YZ', bevel: 0 });
        g.box(x - WIN_W / 2 - 0.05, WIN_Y1, FZ, x + WIN_W / 2 + 0.05, WIN_Y1 + 0.05, FZ + 0.03, { faces: 'Zy' });
        for (const sx of [-1, 1]) g.box(x + sx * WIN_W / 2 - 0.05, WIN_Y0, FZ, x + sx * WIN_W / 2 + 0.05, WIN_Y1, FZ + 0.03, { faces: 'ZxX' });
      }
    });
    for (const x of wins) s.glass(x - WIN_W / 2, WIN_Y0, LZ0 - 0.15, x + WIN_W / 2, WIN_Y1, LZ0 - 0.15, { tint: '#cfdde6', opacity: 0.08 });
    // the outer wall (toward the Hollow), where no room builds it
    const outer = [[a, Math.min(b, ROOMS[0])], [Math.max(a, ROOMS[1]), b]].filter((q) => q[1] - q[0] > 1e-3);
    if (outer.length) s.structure(() => { for (const q of outer) { g.mat('felt', '#7a2f3c'); g.box(q[0], 0, -0.001, q[1], 1.0, 0, { faces: 'z' }); g.mat('plaster', '#e6dbc4'); g.box(q[0], 1.0, -0.001, q[1], LH, 0, { faces: 'z' }); g.mat('wood', '#2a2420'); g.box(q[0], 0, -0.03, q[1], 0.11, 0, { faces: 'zY' }); } });
    s.deco(() => { g.mat('wood', '#2a2420'); g.box(a, 0, LZ0, b, 0.11, LZ0 + 0.03, { faces: 'ZY' }); g.mat('cast', '#8a6d3b'); g.box(a, 2.62, LZ0, b, 2.66, LZ0 + 0.02, { faces: 'ZYy' }); for (const q of outer) g.box(q[0], 2.62, -0.02, q[1], 2.66, 0, { faces: 'zYy' }); });
  });
  // hand lines down both walls, broken at the doors
  const lineRuns = (z, side, gaps) => { let u = -HALF; for (const gp of gaps.concat([[HALF, HALF]])) { if (gp[0] - u > 0.4) runX(u, gp[0], 15.7, (a, b) => handLine(s, [[a, z], [b, z]], 0.9, { side })); u = gp[1]; } };
  lineRuns(LZ0 + 0.17, -1, [[-1.6, 1.6]]);
  lineRuns(-0.12, 1, [[-11.9, -9.9], [-9.4, -5.2], [-3.7, 3.7], [5.2, 9.4], [10.2, 12.1]]);
  // collision: floor, ceiling, both walls (past the seam on both sides, so the join is solid)
  s.solid(-XR - 3, -0.5, LZ0, XR + 3, 0, 0);
  s.solid(-XR - 3, LH, LZ0 - 0.3, XR + 3, LH + 0.6, 0.2);
  s.solid(-XR - 3, 0, HZ0, -1.2, LH + 0.3, LZ0); s.solid(1.2, 0, HZ0, XR + 3, LH + 0.3, LZ0);
  s.solid(-XR - 3, 0, 0, ROOMS[0], LH, 0.2); s.solid(ROOMS[1], 0, 0, XR + 3, LH, 0.2);

  // ---- lamps: a fitting every seven metres, a light at every other one
  const lampX = []; for (let x = -182; x <= 182.1; x += 7) lampX.push(x);
  runX(-HALF, HALF, 15.7, (a, b) => s.deco(() => { for (const x of lampX) { if (x < a || x >= b) continue; g.mat('cast', '#8a6d3b'); g.box(x - 0.5, LH - 0.06, -1.7, x + 0.5, LH, -1.3, { faces: 'yxXzZ' }); g.mat('diffuser', '#ffd9a6', { emissive: 4, lamp: true }); g.box(x - 0.44, LH - 0.07, -1.65, x + 0.44, LH - 0.06, -1.35, { faces: 'y' }); } }));
  lampX.forEach((x, i) => { if (i % 2) return; s.light({ at: [x, 2.55, -1.5], color: warm(2800), power: 2.4, range: 8, lamp: true, clip: [x - 7.6, -0.3, LZ0 - 0.05, x + 7.6, LH + 0.1, 0.05], radius: 0.3 }); });
  s.ambient({ box: [-XR, -0.3, LZ0, XR, LH, 0], sky: '#ffe0b8', ground: '#8a5a48', power: 0.2, spec: 0.3, allRound: true });

  // ---- signs over the Cold Room's door and the lobby's opening
  sign(s, { kind: 'street', text: 'THE COLD ROOM', sub: '160 GW · quiet, please', palette: ['#1f2b40', '#e9e1cf'] }, 0, 2.86, LZ0 + 0.03, { face: 'Z', w: 2.2, h: 0.36, glow: 0.8 });
  sign(s, { kind: 'street', text: 'CABS', sub: 'the lift lobby', palette: ['#2f4a6a', '#f1ead8'] }, 0, 2.95, -0.03, { face: 'z', w: 1.1, h: 0.26, glow: 0.8 });
  sign(s, { kind: 'street', text: 'THE SLOW POUR', sub: 'tea · strap in · clip your lid', palette: ['#7a2f3c', '#f3e6c8'] }, 11.15, 2.75, -0.03, { face: 'z', w: 1.7, h: 0.3, glow: 0.7 });
  sign(s, { kind: 'street', text: 'THE HUNDREDS', sub: 'the book · the plates', palette: ['#2f4a5a', '#f3e6c8'] }, -10.95, 2.75, -0.03, { face: 'z', w: 1.7, h: 0.3, glow: 0.7 });

  // ---- the eighths: a band across the floor, a plate, and at the quarters a bench in a shallow niche
  const NAMES = { 1: 'an eighth round', 2: 'a quarter round', 3: 'three eighths', 5: 'five eighths', 6: 'three quarters', 7: 'seven eighths' };
  for (const e of EIGHTHS) {
    s.deco(() => { g.mat('paint', '#e9e1cf'); g.box(e.x - 0.08, 0.004, LZ0 + 0.1, e.x + 0.08, 0.01, -0.1, { faces: 'Y' }); g.mat('paint', '#2f4a6a'); g.box(e.x - 0.2, 0.003, LZ0 + 0.1, e.x - 0.1, 0.009, -0.1, { faces: 'Y' }); g.box(e.x + 0.1, 0.003, LZ0 + 0.1, e.x + 0.2, 0.009, -0.1, { faces: 'Y' }); });
    sign(s, { kind: 'plate', text: Math.round(e.d) + ' metres', lines: [NAMES[e.k] + ' · ' + Math.round(C - e.d) + ' to go'] }, e.x, 1.55, -0.03, { face: 'z', w: 0.42, h: 0.17 });
    if (e.k === 2 || e.k === 6) {
      prop(s, 'bench', e.x + 2.4, 0, -0.4, PI, { w: 2.2, back: false, wood: '#7a5233' }, { noSpots: true });
      s.interact({ x: e.x, y: 1.4, z: -0.8, radius: 1.3, prompt: 'Read the plate', onUse: async (gm) => {
        await say(gm, 'The plate', [Math.round(e.d) + ' metres round the Lap, ' + NAMES[e.k] + '. The floor you are standing on is a wall to anybody in the lift lobby. If the walls were glass they would see you standing sideways on it.', 'Walking here from the lobby you have turned ' + (e.k === 2 ? 'ninety degrees' : 'two hundred and seventy degrees') + ' and never felt the floor tilt. Weight follows the floor, all the way round.']);
      } });
    }
  }
  // ---- the seam at halfway: an arch of brass and blue straight across the axis from the lobby
  for (const side of [1, -1]) {
    const x = side * HALF;
    s.structure(() => {
      const xa = side > 0 ? x - 0.28 : x, xb = side > 0 ? x : x + 0.28;
      g.mat('panel', '#2f4a6a'); g.box(xa, 0, LZ0, xb, LH, LZ0 + 0.22, { faces: 'xXZ' }); g.box(xa, 0, -0.22, xb, LH, 0, { faces: 'xXz' }); g.box(xa, LH - 0.4, LZ0, xb, LH, 0, { faces: 'xXy' });
      g.mat('cast', '#c8a45a', { rough: -0.12 }); g.box(xa, 0, LZ0 + 0.22, xb, 0.12, -0.22, { faces: 'Y' }); g.box(xa, LH - 0.44, LZ0 + 0.22, xb, LH - 0.4, -0.22, { faces: 'y' });
    });
    sign(s, { kind: 'plate', text: 'Halfway', lines: ['188 metres · the lobby is overhead'] }, x - side * 1.4, 1.55, -0.03, { face: 'z', w: 0.5, h: 0.2 });
    s.interact({ x: x - side * 1.4, y: 1.4, z: -0.8, radius: 1.3, prompt: 'Read the halfway plate', onUse: async (gm) => {
      await say(gm, 'The halfway plate', ['Halfway round the Lap: 188 metres. The lift lobby where you started is a hundred and twenty metres straight over your head, and from there, you are standing on its ceiling.', 'Nothing feels any different. The floor is down, the axis is up, and the Cold Room\'s windows are still on your left going spinward.']);
    } });
  }
  s.zoneBox({ id: 'the-lap', place: 'axle-front', box: [-XR, -0.5, LZ0, XR, LH, 0.1], name: 'The Lap', sub: 'The front axle · 377 metres round the axis', ambience: 'none', reverb: 'room', headroom: LH, env: ENV_LAP }).allRound = true;
}
