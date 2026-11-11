// The Press and the Soufflé: two rides on line deck 63 (Ring Six, 0.92 g). A cab that runs spinward round a line deck
// is going round faster than the floor, so it presses you harder into it; one that runs anti is going round slower, and
// you weigh less. Your weight goes as the square of how fast you are going round: (1 + u/v) squared, where v is the
// deck's own speed, 157 metres a second here.
//   The Press: spinward at 22.5 m/s, 1.20 g, on the lower level (a canon Lattice limit for this deck).
//   The Soufflé: anti at 67 m/s, 0.30 g, on the upper level, on its own closed ride tube (the Lattice holds anti cabs
//     to 30 m/s, which here only takes you to 0.60).
// Frame `line63`: x spinward, z toward the back cap, y up; the floor of deck 63 is y = 0. The rides' cabins are in their
// own little frame, `line63-ride`, the way the game's cab has one.
import { floor, ceiling, wall, lamp, roomGlow, stairs } from '../world/kit.js';
import { room, railing, planter } from '../world/kit2.js';
import { prop, defineProp, bunting } from '../world/props.js';
import { sign, signRect } from '../world/signs.js';
import { deckRadius, DRUM } from '../core/drum.js';
import { Rng, smoother, clamp, lerp } from '../core/util.js';
import { say, toast, sfx, seat, buy, runX, lineX, movable, capsule, lobby, ropeRail, frameWait } from './lm_line_parts.js';

const PI = Math.PI;
const H = 7.6, X0 = -34, X1 = 34, Z0 = -12, Z1 = 12;
const XT = 160;                                  // the ride tubes run x[-XT, XT]
const PY = 0.4, PR = 3.6, PZ0 = -17.4;           // the Press: lower level, z[PZ0, Z0]
const SY = 4.4, SR = 7.4, SZ1 = 17.4;            // the Soufflé: upper level, z[Z1, SZ1]
const MY = 4.0, MZ = 7.5;                        // the mezzanine: y = 4, z[MZ, Z1]
const G0 = deckRadius(63) / DRUM.R;              // 0.917
const V = DRUM.OMEGA * deckRadius(63);           // the deck's own speed, m/s
const SUB = 'Line deck 63 · Ring Six';
const RIDES = {
  press: { id: 'press', name: 'The Press', fare: 0.3, dir: 1, gPeak: 1.2, gate: { x: 18, y: 0, z: -10.2, yaw: Math.PI }, carX: 18, carY: PY, carZ: (PZ0 + Z0) / 2, body: '#b0502c', band: '#d9a23a', roof: '#c9653a' },
  souffle: { id: 'souffle', name: 'The Soufflé', fare: 0.45, dir: -1, gPeak: 0.3, gate: { x: -18, y: MY, z: 10.3, yaw: 0 }, carX: -18, carY: SY, carZ: (Z1 + SZ1) / 2, body: '#e8e0cc', band: '#7fb8b0', roof: '#d8cce0' },
};
// speed for a weight: g = G0 (1 + dir u / V)^2
function speedFor(g, dir) { return Math.abs(Math.sqrt(g / G0) - 1) * V * (dir > 0 ? 1 : 1); }

export const place = {
  id: 'lm-line-rides', name: 'The Press and the Soufflé', order: 10,
  region: 'line-rides',
  stops: [{ id: 'line-rides', name: 'The Press and the Soufflé', sub: 'line deck 63 · Ring Six · rides at 1.2 g and 0.3 g', group: 'The line decks', spawn: 'line-rides', deck: 63, zd: 2290 }],
  async build(game) {
    const W = game.world;
    const f = W.frame('line63', deckRadius(63), -0.8, 2290);
    const s = W.scope('line-rides', f);
    concourse(game, s); await frameWait();
    pressTube(game, s); soufTube(game, s); await frameWait();
    mezzanine(game, s); await frameWait();
    lobby(game, s, { x0: -8, x1: 8, z0: Z1, z1: 22, h: 4.2, front: false, stop: 'line-rides', title: 'Line deck 63 · cabs', sub: 'the ride gates · four berths', tint: '#e0cfa8', accent: '#5b4060',
      board: { kind: 'board', title: 'From here', lines: ['Candlewick|about 2 min', 'Station Ring 2|about 3 min', 'The Hollow|about 3 min', 'Anywhere in Chervil|under 12 min', 'Cabs|free, as ever', 'The rides|by the kWh'] } });
    s.zoneBox({ id: 'rides-lobby', place: 'line-rides', box: [-8, -0.5, Z1, 8, 4.2, 22], name: 'Line deck 63', sub: 'the lift lobby · ' + SUB, ambience: 'station', reverb: 'room' });
    furnish(game, s); await frameWait();
    const cabins = buildCabins(game, W); await frameWait();
    gates(game, s, cabins);
    s.finish();
    game.spawns['line-rides'] = { frame: f, x: 0, y: 0, z: 18.6, yaw: 0 };
  },
};

// ---------------------------------------------------------------------------------------------------------------
// The concourse: x[-34, 34], z[-12, 12], two decks tall. The Press behind glass along the front, the Soufflé behind glass
// on the upper level along the back, over the lobby.
// ---------------------------------------------------------------------------------------------------------------
function concourse(game, s) {
  const g = s.g, clip = [X0, -0.5, Z0 - 0.1, X1, H + 0.1, Z1 + 0.1];
  floor(s, X0, Z0, X1, Z1, 0, 'terrazzo', '#c4b494');
  // the floor: a red band toward the Press end, a pale one toward the Soufflé end, a brass line down the middle
  g.mat('terrazzo', '#9a3b2a'); g.box(4, 0, -1.4, X1 - 0.5, 0.004, -0.8, { faces: 'Y' }); g.box(X1 - 0.6, 0, -1.9, X1 - 0.5, 0.004, -0.3, { faces: 'Y' });
  g.mat('terrazzo', '#7fb8b0'); g.box(X0 + 0.5, 0, -1.4, -4, 0.004, -0.8, { faces: 'Y' });
  g.mat('cast', '#b08a45', { rough: -0.2 }); g.box(X0 + 0.5, 0, -0.03, X1 - 0.5, 0.006, 0.03, { faces: 'Y' });
  s.flush({ tier: 's', cast: false });
  ceiling(s, X0, Z0, X1, Z1, H, 'paint', '#d8ccb0');
  g.mat('paint', '#5b4060'); for (let x = X0 + 4; x < X1; x += 4) g.box(x - 0.14, H - 0.45, Z0, x + 0.14, H, Z1, { faces: 'xXy' });
  g.mat('paint', '#d9a23a'); g.box(X0, H - 0.5, -0.12, X1, H - 0.4, 0.12, { faces: 'yzZ' }); s.flush({ tier: 's' });
  // end walls, with their big plates
  const wt = { tint: '#d9c7a0', dado: { h: 1.3, mat: 'tile', tint: '#5b4060' }, skirt: '#3a2d22' };
  wall(s, X0 + 0.08, Z0, X0 + 0.08, Z1, 0, H, wt); wall(s, X1 - 0.08, Z0, X1 - 0.08, Z1, 0, H, wt);
  // the back wall's lower part, under the mezzanine, with the lobby's opening; the front's plinth and upper wall
  wall(s, X0, Z1 + 0.08, -6.8, Z1 + 0.08, 0, MY, { tint: '#d9c7a0', dado: { h: 1.3, mat: 'tile', tint: '#5b4060' }, skirt: '#3a2d22' });
  wall(s, 6.8, Z1 + 0.08, X1, Z1 + 0.08, 0, MY, { tint: '#d9c7a0', dado: { h: 1.3, mat: 'tile', tint: '#5b4060' }, skirt: '#3a2d22' });
  wall(s, -6.8, Z1 + 0.08, 6.8, Z1 + 0.08, 3.6, MY - 3.6, { tint: '#d9c7a0', skirt: false });
  g.mat('cast', '#b08a45'); g.box(-7.0, 0, Z1 - 0.06, -6.8, 3.7, Z1 + 0.2); g.box(6.8, 0, Z1 - 0.06, 7.0, 3.7, Z1 + 0.2); g.box(-7.0, 3.6, Z1 - 0.06, 7.0, 3.75, Z1 + 0.2); s.flush({ tier: 's' });
  // the upper wall over the Press, in the Press's red, with its name in big letters
  runX(X0, X1, 17, (a, b) => {
    g.mat('panel', '#7a2f26'); g.box(a, PR, Z0 - 0.14, b, H, Z0, { faces: 'Z' });
    g.mat('paint', '#d9a23a'); g.box(a, PR + 0.3, Z0, b, PR + 0.42, Z0 + 0.02, { faces: 'ZyY' });
    s.flush({ tier: 's' });
  });
  s.solid(X0, PR, Z0 - 0.14, X1, H, Z0);
  sign(s, { kind: 'letters', text: 'THE PRESS', palette: ['#f3e2b8'] }, 18, 5.6, Z0 + 0.03, { face: 'Z', w: 7.2, h: 1.1 });
  sign(s, { kind: 'letters', text: 'THE SOUFFLÉ', palette: ['#f3ead4'] }, -18, 7.0, Z1 - 0.02, { face: 'z', w: 4.6, h: 0.5 });
  // lamps: big lanterns in the Chervil colours, panels at the ends, bunting across
  const LANT = ['#d9a23a', '#b0502c', '#7fb8b0', '#d8cce0', '#c9763e'];
  let li = 0;
  for (let x = X0 + 6; x < X1 - 2; x += 8) for (const z of [-5.5, 3]) lamp(s, 'lantern', x, 5.4, z, { tint: LANT[(li++) % LANT.length], r: 0.42, hh: 0.62, drop: 1.6, power: 1.4, clip, range: 9 });
  lamp(s, 'panel', X0 + 2.5, H - 0.5, 0, { w: 0.6, d: 4, K: 3200, power: 1.0, clip });
  lamp(s, 'panel', X1 - 2.5, H - 0.5, 0, { w: 0.6, d: 4, K: 3200, power: 1.0, clip });
  roomGlow(s, X0, 0, Z0, X1, H, Z1, { sky: '#ffdcae', ground: '#a8794f', power: 0.16 });
  for (const z of [-8, -2.5, 4]) bunting(s, [X0 + 0.3, 6.4, z], [X1 - 0.3, 6.4, z], { colors: ['#b0502c', '#d9a23a', '#7fb8b0', '#e8e0cc', '#5b4060', '#c9763e'], sag: 0.9, n: 90 });
  s.zoneBox({ id: 'rides-concourse', place: 'line-rides', box: [X0, -0.5, Z0, X1, H, Z1], name: 'The Press and the Soufflé', sub: SUB, ambience: 'arcade', reverb: 'ring', headroom: H });
  s.loop('murmur', 0, 1.6, -2, { vol: 0.34, radius: 34, param: 0.5 });
}

// ---------------------------------------------------------------------------------------------------------------
// The two ride tubes. Each is a closed loop round the drum; we see a stretch of it behind glass.
// ---------------------------------------------------------------------------------------------------------------
function tubeRun(s, o) {
  // o: { y0, y1, z0, z1, glassZ, glassFace ('Z' or 'z': the side the concourse is on), wall (far wall z), x0, x1 (glass extent), tint, strip }
  const g = s.g;
  runX(-XT, XT, 16, (a, b) => {
    g.mat('concrete', '#3b3f3c'); g.box(a, o.y0 - 0.02, o.z0, b, o.y0, o.z1, { faces: 'Y' });
    g.mat('panel', '#46524f'); g.box(a, o.y0, o.wall - 0.1, b, o.y1, o.wall + 0.1, { faces: o.glassFace === 'Z' ? 'Z' : 'z' });
    g.mat('diffuser', o.strip, { emissive: 2.8 }); g.box(a, o.y0 + 1.0, o.wall - 0.12, b, o.y0 + 1.04, o.wall + 0.12, { faces: o.glassFace === 'Z' ? 'Z' : 'z' });
    g.mat('panel', '#3f4a48'); g.box(a, o.y1, o.z0, b, o.y1 + 0.2, o.z1, { faces: 'y' });
    g.mat('brushed', '#a9b2ae', { rough: -0.2 }); const zc = (o.z0 + o.z1) / 2; for (const dz of [-0.55, 0.55]) g.box(a, o.y0, zc + dz - 0.09, b, o.y0 + 0.05, zc + dz + 0.09, { faces: 'YzZ' });
    s.flush({ tier: 's' });
    g.mat('diffuser', '#e0fff6', { emissive: 7 });
    for (let x = Math.ceil(a / 8) * 8 + 4; x < b; x += 8) g.box(x - 0.08, o.y1 - 0.06, o.z0 + 0.3, x + 0.08, o.y1, o.z1 - 0.3, { faces: 'y' });
    s.flush({ tier: 's' });
  });
  // the tube beyond the concourse's end walls: walled in, with the tube's own side walls
  for (const sx of [-1, 1]) {
    const xa = sx > 0 ? o.x1 : -XT, xb = sx > 0 ? XT : o.x0;
    runX(xa, xb, 16, (a, b) => { g.mat('panel', '#3a4442'); g.box(a, o.y0, o.glassZ - 0.1, b, o.y1, o.glassZ + 0.1, { faces: o.glassFace }); s.flush({ tier: 's' }); });
  }
  g.mat('plain', '#07090a'); for (const sx of [-1, 1]) g.box(sx * XT - 0.1, o.y0, Math.min(o.z0, o.z1), sx * XT + 0.1, o.y1, Math.max(o.z0, o.z1)); s.flush({ tier: 's' });
  s.ambient({ box: [-XT, o.y0, Math.min(o.z0, o.z1), XT, o.y1, Math.max(o.z0, o.z1)], sky: '#8fd0c4', ground: '#3d4a46', power: 0.1, soft: 0.4 });
}
function pressTube(game, s) {
  const g = s.g;
  tubeRun(s, { y0: PY, y1: PR, z0: PZ0, z1: Z0, glassZ: Z0, glassFace: 'Z', wall: PZ0, x0: X0, x1: X1, strip: '#ff8a5a' });
  // the plinth, the glass with its posts, a gap for the gate
  g.mat('paint', '#3a1f1a'); g.box(X0, 0, Z0 - 0.2, X1, PY, Z0 + 0.05, { faces: 'ZY' });
  g.mat('cast', '#b08a45', { rough: -0.15 }); g.box(X0, PR - 0.1, Z0 - 0.02, X1, PR, Z0 + 0.1, { faces: 'ZyY' });
  g.mat('cast', '#3a3430'); for (let x = X0; x <= X1; x += 4) if (Math.abs(x - 18) > 1.5) g.box(x - 0.06, PY, Z0 - 0.06, x + 0.06, PR, Z0 + 0.06, { faces: 'xXzZ' });
  s.flush({ tier: 's' });
  for (let x = X0; x < X1; x += 4) { if (x + 4 > 16.9 && x < 19.1) { if (x < 16.9) s.glass(x, PY, Z0, 16.9, PR, Z0, { tint: '#a8cfc6', opacity: 0.05, rough: 0.3 }); if (x + 4 > 19.1) s.glass(19.1, PY, Z0, x + 4, PR, Z0, { tint: '#a8cfc6', opacity: 0.05, rough: 0.3 }); continue; } s.glass(x, PY, Z0, x + 4, PR, Z0, { tint: '#a8cfc6', opacity: 0.05, rough: 0.3 }); }
  s.solid(X0, 0, Z0 - 0.12, X1, PR, Z0 + 0.05);
  s.loop('cab-hum', 0, 1.6, -14.8, { vol: 0.22, radius: 26 });
}
function soufTube(game, s) {
  const g = s.g;
  tubeRun(s, { y0: SY, y1: SR, z0: Z1, z1: SZ1, glassZ: Z1, glassFace: 'z', wall: SZ1, x0: X0, x1: X1, strip: '#7fd8ff' });
  // its floor slab sits on the lobby's ceiling; a sill under the glass on the mezzanine side, a header over it
  g.mat('paint', '#cfc2a8'); g.box(X0, MY, Z1 - 0.05, X1, SY, Z1 + 0.2, { faces: 'zY' });
  g.mat('cast', '#b08a45', { rough: -0.15 }); g.box(X0, SR, Z1 - 0.1, X1, SR + 0.1, Z1 + 0.02, { faces: 'zyY' });
  g.mat('paint', '#5b4060'); g.box(X0, SR + 0.1, Z1 - 0.02, X1, H, Z1 + 0.06, { faces: 'z' });
  g.mat('cast', '#3a3430'); for (let x = X0; x <= X1; x += 4) if (Math.abs(x + 18) > 1.5) g.box(x - 0.06, SY, Z1 - 0.06, x + 0.06, SR, Z1 + 0.06, { faces: 'xXzZ' });
  s.flush({ tier: 's' });
  for (let x = X0; x < X1; x += 4) { if (x + 4 > -19.1 && x < -16.9) { if (x < -19.1) s.glass(x, SY, Z1, -19.1, SR, Z1, { tint: '#a8cfc6', opacity: 0.05, rough: 0.3 }); if (x + 4 > -16.9) s.glass(-16.9, SY, Z1, x + 4, SR, Z1, { tint: '#a8cfc6', opacity: 0.05, rough: 0.3 }); continue; } s.glass(x, SY, Z1, x + 4, SR, Z1, { tint: '#a8cfc6', opacity: 0.05, rough: 0.3 }); }
  s.solid(X0, MY, Z1 - 0.05, X1, H, Z1 + 0.2);
  s.loop('cab-hum', 0, 5.6, 14.8, { vol: 0.18, radius: 20 });
}

// ---------------------------------------------------------------------------------------------------------------
// The mezzanine along the back at y = 4: the Soufflé's gate and its queue. A stair at the anti end.
// ---------------------------------------------------------------------------------------------------------------
function mezzanine(game, s) {
  const g = s.g;
  floor(s, X0, MZ, 30, Z1, MY, 'planks', '#9a7048');
  floor(s, X0, 5.8, -30, MZ, MY, 'planks', '#9a7048');
  // its underside and its edge, with lanterns hung under it
  g.mat('paint', '#e0d2b0'); g.box(X0, MY - 0.3, MZ, 30, MY - 0.02, Z1, { faces: 'y' }); g.box(X0, MY - 0.3, 5.8, -30, MY - 0.02, MZ, { faces: 'y' });
  g.mat('paint', '#5b4060'); g.box(-30, MY - 0.35, MZ - 0.08, 30, MY + 0.05, MZ, { faces: 'zyX' }); g.box(X0, MY - 0.35, 5.72, -30, MY + 0.05, 5.8, { faces: 'zy' }); g.box(30, MY - 0.35, MZ, 30.08, MY + 0.05, Z1, { faces: 'Xy' });
  g.mat('cast', '#3a3430'); for (const x of [-24, -12, 12, 24]) { g.box(x - 0.12, 0, MZ + 0.05, x + 0.12, MY - 0.3, MZ + 0.29); s.post(x, MZ + 0.17, 0.16, 0, MY); }
  s.flush({ tier: 's', cast: true });
  railing(s, [[-30, MZ + 0.04], [30, MZ + 0.04], [30, Z1 - 0.1]], MY, { tint: '#5b4060', rail: '#7a5233' });
  railing(s, [[X0 + 0.1, 5.84], [-30.9, 5.84]], MY, { tint: '#5b4060', rail: '#7a5233' });
  stairs(s, -23, 0, 6.65, 'x', MY, 7.0, 1.5, { tint: '#b9ae98', nosing: '#5b4060' });
  g.mat('cast', '#5b4060'); g.tube([[-23, 1.05, 5.86], [-30, MY + 1.05, 5.86]], 0.03, { segs: 6 }); for (let x = -23; x >= -30; x -= 1.4) { const yb = MY * (-23 - x) / 7; g.tube([[x, yb, 5.86], [x, yb + 1.05, 5.86]], 0.018, { segs: 5 }); } s.flush({ tier: 's' });
  s.solid(-30.3, 0, 5.8, -23.2, 5.0, 5.9);
  for (let i = 0; i < 6; i++) { const xb = -23 - i, top = MY * i / 7 - 0.3; if (top > 0.3) s.solid(xb - 1, 0, 5.95, xb, top, 7.4); }
  // lanterns under the mezzanine's edge
  const clip = [X0, -0.5, MZ - 0.5, X1, MY, Z1];
  for (const x of [-26, -14, -2, 10, 22]) lamp(s, 'lantern', x, MY - 0.75, MZ + 0.6, { tint: x % 4 ? '#d9a23a' : '#7fb8b0', r: 0.2, drop: 0.3, power: 0.8, clip: [X0, -0.5, MZ - 3, X1, MY, Z1], range: 6 });
  roomGlow(s, X0, 0, MZ, X1, MY - 0.3, Z1, { sky: '#ffdcae', ground: '#a8794f', power: 0.12 });
  // the upper level's own light
  for (const x of [-26, -10, 6, 22]) lamp(s, 'globe', x, H - 0.9, 9.8, { K: 2900, power: 0.8, clip: [X0, MY - 0.2, MZ - 0.3, X1, H, Z1], drop: 0.8, r: 0.18 });
  s.zoneBox({ id: 'rides-mezz', place: 'line-rides', box: [X0, MY - 0.4, 5.8, 30.1, H, Z1], name: 'The Soufflé', sub: 'the upper level · ' + SUB, ambience: 'arcade', reverb: 'ring', headroom: H - MY });
  s.zoneBox({ id: 'rides-under', place: 'line-rides', box: [X0, -0.5, MZ, X1, MY - 0.3, Z1], name: 'The Press and the Soufflé', sub: 'under the gallery · ' + SUB, ambience: 'arcade', reverb: 'room', headroom: MY - 0.3 });
  s.path([[-22.6, 6.65], [-30.4, 6.65], [-31.5, 7.2], [-31.5, 9.6], [-20, 9.6], [-10, 9.6], [0, 9.6], [12, 9.6], [28, 9.6]], { y: MY });
}

// ---------------------------------------------------------------------------------------------------------------
// The furniture: the ticket desk, the queues, the still benches, the scale, the rules, the drinks stall.
// ---------------------------------------------------------------------------------------------------------------
defineProp('lmride.scale', (g) => {
  g.mat('cast', '#3a3430'); g.box(-0.45, 0, -0.45, 0.45, 0.1, 0.45, { bevel: 0.02 });
  g.mat('rush', '#8a7a5a'); g.box(-0.4, 0.1, -0.4, 0.4, 0.11, 0.4);
  g.mat('cast', '#b08a45', { rough: -0.15 }); g.lathe(0, -0.38, [[0.06, 0.1], [0.04, 0.15], [0.035, 1.35], [0.05, 1.4]], { segs: 10 });
  g.push(); g.move(0, 1.62, -0.38); g.rotX(PI / 2); g.mat('cast', '#b08a45'); g.cyl(0, -0.03, 0, 0.27, 0.06, { segs: 22 }); g.mat('paint', '#f3ead4', { emissive: 0.6 }); g.cyl(0, 0.03, 0, 0.24, 0.005, { segs: 22 }); g.pop();
  g.mat('plain', '#1d1b18'); for (let i = 0; i <= 12; i++) { const a = -2.2 + i * 4.4 / 12; g.box(Math.sin(a) * 0.2 - 0.004, 1.62 + Math.cos(a) * 0.2 - 0.004, -0.31, Math.sin(a) * 0.2 + 0.004, 1.62 + Math.cos(a) * 0.2 + 0.004, -0.3); }
  g.mat('paint', '#b0502c'); g.tube([[0, 1.62, -0.305], [Math.sin(0.9) * 0.19, 1.62 + Math.cos(0.9) * 0.19, -0.305]], 0.006, { segs: 3 });
  return { solid: [[-0.45, 0, -0.45, 0.45, 0.11, 0.45]], posts: [[0, -0.38, 0.06, 0, 1.9]], tier: 's' };
});
defineProp('lmride.urn', (g) => {
  g.mat('cast', '#b08a45', { rough: -0.1 }); g.lathe(0, 0, [[0.16, 0], [0.2, 0.05], [0.22, 0.4], [0.18, 0.5], [0.08, 0.56], [0.03, 0.62], [0, 0.63]], { segs: 14 });
  g.mat('cast', '#3a3430'); g.box(0.18, 0.1, -0.02, 0.28, 0.14, 0.02);
  return { tier: 'd', cast: false };
});

function furnish(game, s) {
  const g = s.g, r = new Rng(6363);
  const clip = [X0, -0.5, Z0 - 0.1, X1, H + 0.1, Z1 + 0.1];
  // ---- the ticket desk, an island in the middle, facing the lobby, with its fares on a stand behind it
  prop(s, 'counter', 0, 0, -3.2, 0, { w: 3.4, d: 0.8, body: '#5b4060', top: '#8a6240' });
  s.detail(() => { g.mat('paper', '#efe6d2'); g.box(-0.6, 0.92, -3.3, -0.1, 0.94, -2.95); g.mat('cast', '#b08a45', { rough: -0.2 }); g.lathe(0.9, -3.3, [[0.06, 0.92], [0.055, 0.96], [0.03, 0.99], [0.008, 1.0], [0.008, 1.03], [0, 1.035]], { segs: 12 }); });
  lamp(s, 'globe', 0, 2.6, -3.2, { K: 2700, power: 0.8, clip, drop: 4.4, r: 0.22 });
  sign(s, { kind: 'board', title: 'Fares', lines: ['The Press|0.30', 'The Soufflé|0.45', 'Children|no fare', 'Elders after six|no fare on the Soufflé', 'The cabs|free'], palette: ['#2a1a20', '#f3e6c8', '#d9a23a'] }, 0, 2.1, -4.25, { face: 'Z', w: 1.6, h: 1.1, glow: 0.6 });
  g.mat('wood', '#3a2d22'); g.box(-0.05, 0, -4.32, 0.05, 1.55, -4.24); s.flush({ tier: 'd' });
  s.interact({ x: 0, y: 1.1, z: -2.2, radius: 1.8, prompt: 'Ask at the desk', onUse: desk });
  // ---- the Press's queue: two rope lanes along the glass
  ropeRail(s, [[8, -8.6], [12, -8.6], [16, -8.6], [20, -8.6], [24, -8.6], [28, -8.6]], '#8a2f3c');
  ropeRail(s, [[10, -6.4], [14, -6.4], [18, -6.4], [22, -6.4], [26, -6.4], [30, -6.4]], '#8a2f3c');
  for (let i = 0; i < 8; i++) s.spot('queue', 19.5 + i * 1.2, 0, -9.7, -PI / 2, { tags: ['press'] });
  for (let i = 0; i < 6; i++) s.spot('queue', 11 + i * 1.6, 0, -7.5, PI / 2, { tags: ['press'] });
  // ---- the Soufflé's queue on the mezzanine
  ropeRail(s, [[-16, 9.4], [-12, 9.4], [-8, 9.4], [-4, 9.4], [0, 9.4]], '#3a6a66', MY);
  for (let i = 0; i < 8; i++) s.spot('queue', -15.4 + i * 1.3, MY, 10.6, -PI / 2, { tags: ['souffle'] });
  // ---- the rules, on stands by each queue
  const pressRules = { kind: 'notice', title: 'The Press · who may not ride', lines: ['1.20 g for about thirteen minutes, once round the deck.', 'Not if you are carrying a child, or carried one in the last three months.', 'Not within a year of a new hip, knee or back.', 'Not within an hour of a hall dinner.', 'Children from 1.1 metres, with an adult from their table.', 'Over a hundred: ask the desk. Most are told yes.', 'Hold the rail while it spins up. The bench does the rest.'] };
  const soufRules = { kind: 'notice', title: 'The Soufflé · how to ride', lines: ['0.30 g for about four and a half minutes, once round.', 'Lids on everything. A spilt cup takes its time and goes everywhere.', 'Elders first after six. It is good for knees.', 'It speeds up and brakes at half the usual rate, and still leans you.', 'Not after more than two gins.', 'This loop is not the Lattice: one car, its own tube, 67 m/s at the top.'] };
  sign(s, pressRules, 31.6, 1.55, -9.4, { face: 'Z', w: 0.9, h: 1.2 });
  g.mat('wood', '#3a2d22'); g.box(31.1, 0, -9.48, 32.1, 0.9, -9.4); s.flush({ tier: 'd' }); s.solid(31.1, 0, -9.5, 32.1, 2.2, -9.38);
  s.interact({ x: 31.6, y: 1.4, z: -8.6, radius: 1.3, prompt: 'Read the rules for the Press', onUse: async (gm) => {
    await say(gm, 'The Press', ['1.20 g for about thirteen minutes, once round line deck 63. The Lattice will not take anybody heavier than that, anywhere, so this is as heavy as Chervil gets.', 'Not if you are carrying a child or carried one in the last three months. Not within a year of a new hip, knee or back. Not within an hour of a hall dinner.', 'Children from 1.1 metres tall, with an adult from their table. Over a hundred: ask the desk. Most are told yes, and most of them ride twice.']);
  } });
  sign(s, soufRules, -31.6, MY + 1.55, 11.85, { face: 'z', w: 0.9, h: 1.2 });
  s.interact({ x: -31.6, y: MY + 1.4, z: 11.0, radius: 1.3, prompt: 'Read the rules for the Soufflé', onUse: async (gm) => {
    await say(gm, 'The Soufflé', ['0.30 g for about four and a half minutes, once round. Lids on everything: a spilt cup at a third of a g takes its time and goes everywhere.', 'Elders ride first after six, and free. It is good for knees, and the elders say it is good for arguments, because nobody can storm off.', 'It speeds up and brakes at half the usual rate, and it still leans you forward. Hold the strap.', 'This loop is not the Lattice. The Lattice holds an anti cab to thirty metres a second, which on this deck only takes you down to 0.6 of a g. The Soufflé runs one car on its own tube, at sixty-seven at the top, and nobody routes through it.']);
  } });
  // ---- the scale, beside the desk
  prop(s, 'lmride.scale', 7.5, 0, -1.6, 0, {});
  sign(s, { kind: 'plate', text: 'Weigh yourself', lines: ['marked in rim weights'] }, 7.5, 1.17, -1.98, { face: 'Z', w: 0.4, h: 0.16 });
  s.interact({ x: 7.5, y: 1.0, z: -1.2, radius: 1.1, prompt: 'Stand on the scale', onUse: async (gm) => {
    const gNow = gm.player && gm.player.gNow ? gm.player.gNow : G0;
    sfx(gm, 'clunk', s.frame, 7.5, 0.2, -1.6);
    await say(gm, 'The scale', ['The needle swings and settles at ' + gNow.toFixed(2) + '. The dial is marked in rim weights: one is what you would weigh down at the rim, on the station platform.', 'A brass plate under the dial: On the Press, 1.20. On the Soufflé, 0.30. Walk spinward across this hall and you will read a hair heavier; walk anti and a hair lighter. Stand still and it is only the deck.']);
    gm.flags['line.scale'] = true;
  } });
  // ---- the physics, painted on a board on the spinward wall
  sign(s, { kind: 'board', title: 'Why spinward is heavy', lines: ['The deck goes round at|157 m/s', 'That holds you down at|0.92 g', 'The Press adds|22.5 m/s spinward', 'Going round at|179.5 m/s: 1.20 g', 'The Soufflé takes away|67 m/s anti', 'Going round at|90 m/s: 0.30 g', 'Weight goes with|the square of the speed'], palette: ['#16201d', '#f3e6c8', '#d9a23a'] }, X1 - 0.1, 2.4, 2.5, { face: 'x', w: 2.4, h: 1.7, glow: 0.4 });
  s.interact({ x: X1 - 1.0, y: 1.8, z: 2.5, radius: 1.8, prompt: 'Read the board', onUse: async (gm) => {
    await say(gm, 'Why spinward is heavy', ['The whole deck is going round at about 157 metres a second. That is what holds you to the floor here, at 0.92 of a g.', 'Run a car spinward at 22.5 and it is going round at 179.5, a seventh faster than the floor. Weight goes with the square of the speed, so you weigh about three-tenths more: 1.20. Run one anti at 67 and it is going round at only 90, and you weigh 0.30.', 'Along the axis nothing changes, which is why the cross-lines never make anybody feel anything. Children learn it before they can read: axis flies true, spin sinks, anti floats.']);
  } });
  // ---- the drinks stall under the gallery: The Steady
  prop(s, 'counter', 16, 0, 9.0, PI, { w: 3.0, d: 0.7, body: '#2c5a56', top: '#8a6240' });
  g.mat('wood', '#5b3a26'); g.box(14.2, 1.05, 11.55, 17.8, 1.1, 11.92, { bevel: 0.01 }); s.flush({ tier: 'd' });
  prop(s, 'lmride.urn', 14.8, 1.1, 11.72, 0, {}); prop(s, 'lmride.urn', 15.6, 1.1, 11.72, 0, {});
  for (let i = 0; i < 6; i++) prop(s, 'cup', 16.3 + i * 0.22, 1.1, 11.7, 0, { glaze: ['#e9e1cf', '#2c5a56', '#d9a23a'][i % 3], lid: '#5b3a26' });
  for (let i = 0; i < 4; i++) prop(s, 'cup', 15.2 + i * 0.3, 0.92, 8.85, 0, { glaze: '#e9e1cf', lid: '#2c5a56' });
  sign(s, { kind: 'chalk', title: 'The Steady', lines: ['A cup of the Nine|0.17', 'Ginger and lemon peel|0.12', 'Cold barley water|0.08', 'Nothing heavy before the Press'] }, 16, 2.4, Z1 - 0.1, { face: 'z', w: 1.5, h: 1.05 });
  lamp(s, 'lantern', 15, 3.1, 9.6, { tint: '#d9a23a', r: 0.22, drop: 0.4, power: 0.8, clip: [X0, -0.5, MZ - 2, X1, MY, Z1], range: 5 });
  s.loop('steam', 15.2, 1.4, 11.7, { vol: 0.1, radius: 4 });
  const STEADY = { title: 'The Steady', note: 'Lids on. Sip, do not gulp, if you are about to ride.', items: [
    { id: 'nine', name: 'A cup of the Nine', desc: 'The bitter broth from the free table, hot and lidded. For anyone peaky after the Press.', price: 0.17 },
    { id: 'ginger', name: 'Ginger and lemon peel', desc: 'Steeped on the loop. Sharp. Settles the stomach and the nerves.', price: 0.12 },
    { id: 'barley', name: 'Cold barley water', desc: 'In a lidded cup with a straw through the lid, for the Soufflé queue.', price: 0.08 }] };
  s.interact({ x: 16, y: 1.1, z: 7.9, radius: 1.6, prompt: 'Buy a drink at the Steady', onUse: async (gm) => {
    const it = await buy(gm, STEADY, 'The Steady');
    if (!it) return;
    sfx(gm, 'pour', s.frame, 16, 1.0, 9.0);
    const line = it.id === 'nine' ? (gm.flags.rode_heavy ? 'Have some Nine, says the stall keeper, before you have even asked. You look like you have been on the Press.' : 'Have some Nine, says the stall keeper. Even if you are not peaky yet. You will be.')
      : it.id === 'ginger' ? 'The lid is warm. Under it the ginger is sharp enough to make your eyes water.' : 'A straw through a hole in the lid. On the Soufflé, she says, a straw is the only way.';
    await say(gm, 'The Steady', [line]);
  } });
  s.spot('counter', 16, 0, 9.75, PI, { tags: ['keeper', 'drinks'] });
  for (let i = 0; i < 3; i++) s.spot('customer', 15 + i, 0, 8.1, 0, { tags: ['drinks'] });
  // ---- benches in the middle, facing the Press's glass, for watching the car go; standing tables by the Steady
  for (const x of [-27, -20, -13]) { prop(s, 'bench', x, 0, -7.6, PI, { w: 2.6, back: true, wood: '#7a5233', metal: '#5b4060' }); }
  seat(s, -20, 0, -7.6, PI, 'Sit and watch the Press go', { radius: 1.3 });
  for (const p of [[22.5, 4.6], [27.5, 4.4], [-24, 1.5]]) {
    prop(s, 'table', p[0], 0, p[1], 0, { round: true, w: 0.7, h: 1.05, wood: '#4a3a2a', top: '#7a5233' });
    prop(s, 'cup', p[0] + 0.12, 1.05, p[1] - 0.05, 0, { glaze: '#e9e1cf', lid: '#2c5a56' }); prop(s, 'cup', p[0] - 0.1, 1.05, p[1] + 0.1, 0, { glaze: '#d9a23a', lid: '#5b3a26' });
    for (let k = 0; k < 3; k++) { const a = k * 2.1 + 0.3; s.spot('chat', p[0] + Math.sin(a) * 0.75, 0, p[1] + Math.cos(a) * 0.75, a + PI, { tags: ['drinks'] }); }
  }
  for (const p of [[-31, -3.5], [31, -3.5], [-4.5, 5.5], [4.5, 5.5]]) prop(s, 'plant', p[0], 0, p[1], 0, { kind: p[0] < 0 ? 'broad' : 'fern', size: 1.7, pot: p[0] < 0 ? '#2f6f73' : '#a3563a' });
  sign(s, { kind: 'banner', text: 'The Press', palette: ['#9a3b2a', '#f6ead0'] }, X1 - 3, 4.6, -5, { face: 'x', double: true, w: 0.8, h: 2.4 });
  sign(s, { kind: 'banner', text: 'The Soufflé', palette: ['#5f9a94', '#f6ead0'] }, X0 + 3, 5.4, -5, { face: 'x', double: true, w: 0.8, h: 2.4 });
  g.mat('cast', '#3a3430');
  for (const b of [[X1 - 3, 5.8], [X0 + 3, 6.6]]) { g.tube([[b[0], b[1] + 0.02, -5.45], [b[0], b[1] + 0.02, -4.55]], 0.02, { segs: 5 }); for (const dz of [-0.38, 0.38]) g.tube([[b[0], b[1] + 0.02, -5 + dz], [b[0], H, -5 + dz]], 0.006, { segs: 3 }); }
  s.flush({ tier: 'd' });
  // ---- the still benches: for those who have just come off and are sitting very still
  const still = [[-16, 11.0, PI], [-11.5, 11.0, PI], [22, 11.0, PI], [27, 11.0, PI], [X0 + 0.6, -6, PI / 2], [X0 + 0.6, 0, PI / 2], [X1 - 0.6, -6, -PI / 2]];
  still.forEach((b, i) => {
    prop(s, 'bench', b[0], 0, b[1], b[2], { w: 2.4, back: true, wood: '#7a5233', metal: '#5b4060' });
    if (i % 2 === 0) seat(s, b[0], 0, b[1], b[2], 'Sit very still', { radius: 1.2, onSit: stillSit });
  });
  sign(s, { kind: 'plate', text: 'The still benches', lines: ['sit until the room stops'] }, -9, 1.3, Z1 - 0.06, { face: 'z', w: 0.6, h: 0.22 });
  sign(s, { kind: 'poster', title: 'The Soufflé after six', lines: ['elders first, and free', 'lids on everything'], palette: ['#2f4f5a', '#f3ead4', '#7fd8ff'] }, -26, 2.0, Z1 - 0.06, { face: 'z', w: 0.8, h: 1.15 });
  sign(s, { kind: 'poster', title: 'Ten today', lines: ['ride the Press on your birthday', 'and see if you can lift your arms'], palette: ['#5a1f1a', '#f3e2b8', '#d9a23a'] }, 31.5, 2.0, Z1 - 0.06, { face: 'z', w: 0.8, h: 1.15 });
  // planters at the ends, a few chat groups, attendants at the gates, a sweeper
  for (const p of [[X0 + 1.0, -10.6], [X1 - 1.0, -10.6], [X0 + 1.0, 6.6], [X1 - 1.0, 6.6]]) planter(s, p[0], 0, p[1], { w: 1.4, d: 0.8, h: 0.55, plants: 'broad', tint: '#a89a84' });
  for (const c of [[-10, -4], [-20, 2], [24, 2.5]]) for (let k = 0; k < 3; k++) { const a = k * 2.1 + r.f(0, 1); s.spot('chat', c[0] + Math.sin(a) * 0.8, 0, c[1] + Math.cos(a) * 0.8, a + PI, { tags: ['ride'] }); }
  s.spot('work', 18, 0, -10.9, PI, { tags: ['crew'] }); s.spot('work', -18, MY, 11.2, 0, { tags: ['crew'] });
  s.spot('work', -4, 0, -8, PI / 2, { tags: ['sweep'] }); s.spot('work', 26, 0, 4, -PI / 2, { tags: ['porter'] });
  s.path([[0, Z1 + 1.5], [0, 6], [0, -1.5], [12, -1.5], [18, -5], [18, -10.4]]);
  s.path([[0, -1.5], [-12, -1.5], [-22.6, 4], [-22.6, 6.65]]);
  s.path([[0, 6], [16, 7.6]]); s.path([[0, 6], [-12, 9.8]]); s.path([[12, -1.5], [30, 0]]);
}
async function desk(gm) {
  if (!gm.ui) return;
  const who = { name: 'The desk', colour: '#d9a23a' };
  gm.busy++;
  try {
    await gm.ui.say(who, ['Riding, or watching. Both are free to stand here.']);
    for (;;) {
      const pick = await gm.ui.choose(who, 'Ask', [
        { label: 'Why are these rides here?', value: 'why' }, { label: 'Who rides them?', value: 'who' },
        { label: 'Why does nobody live on a line deck?', value: 'live' }, { label: 'Thank you', value: null }]);
      if (!pick) break;
      if (pick === 'why') await gm.ui.say(who, ['Every loop on every line deck makes you heavier one way round and lighter the other. On an ordinary ride nobody notices: the router keeps you between 0.3 and 1.2 of a g and you are reading.', 'Some people choose their route for the feeling. The Press and the Soufflé are for people who want the feeling and not the route.']);
      else if (pick === 'who') await gm.ui.say(who, ['Elders on the Soufflé after six, for their knees. Children on the Press on their tenth birthday, to see whether they can lift their arms.', 'Couples ride both on the same evening to argue about which was better. Wanderers ride both because somebody at home asked them to.']);
      else await gm.ui.say(who, ['Two decks deep and full of tubes, and the tubes are full of helium. The loops, the cross-lines, the berths, the depots and the rides take the lot.', 'And nobody would sleep. The Press goes past under the bedrooms every ninety seconds.']);
    }
  } finally { gm.busy--; }
}
function stillSit(gm) {
  const lines = ['You sit very still. The bench does not move. That is the point of it.', 'Somebody beside you, very upright, says without turning her head: give it a minute. Your knees will come back.', 'An old man on the end of the bench is holding a lidded cup in both hands and watching it as if it might leave.'];
  gm.flags['line.still'] = ((gm.flags['line.still'] || 0) + 1);
  toast(gm, lines[gm.flags['line.still'] % lines.length]);
}

// ---------------------------------------------------------------------------------------------------------------
// The ride cars: drawn once, docked at their gates, leaving and coming back round the drum.
// ---------------------------------------------------------------------------------------------------------------
function drawRideCar(g, o) {
  const hz = 1.0;
  g.mat('paint', o.body, { rough: -0.25 }); g.extrude(capsule(6.2, 0.14, 2.25, 0.55, 3), -hz, hz, 'z');
  g.mat('paint', o.roof, { rough: -0.2 }); g.box(-2.4, 2.22, -0.75, 2.4, 2.28, 0.75, { bevel: 0.02 });
  g.mat('paint', '#2b2e30'); g.box(-2.7, 0.16, -hz - 0.012, 2.7, 0.42, hz + 0.012, { faces: 'zZ' });
  for (const sz of [-1, 1]) {
    const za = sz * hz, zb = sz * (hz + 0.014), f = sz > 0 ? 'Z' : 'z';
    g.mat('paint', o.band, { rough: -0.1 }); g.box(-2.9, 0.88, Math.min(za, zb), 2.9, 1.0, Math.max(za, zb), { faces: f });
    g.mat('diffuser', '#ffd9a0', { emissive: 2.0 }); g.box(-2.2, 1.15, Math.min(za, zb), 2.2, 1.85, Math.max(za, zb), { faces: f });
    g.mat('cast', '#b08a45'); for (let x = -2.2; x <= 2.21; x += 0.88) g.box(x - 0.03, 1.13, Math.min(za, zb) - 0.004 * sz, x + 0.03, 1.87, Math.max(za, zb) + 0.004 * sz, { faces: f });
  }
  for (const sx of [-1, 1]) { g.mat('diffuser', sx > 0 ? '#fff1d6' : '#ff8a5a', { emissive: 5 }); g.box(sx * 3.1 - 0.03, 1.55, -0.45, sx * 3.1 + 0.01, 1.65, 0.45); }
  g.mat('cast', '#2b2e30'); for (const sx of [-1, 1]) g.box(sx * 1.9 - 0.4, 0, -0.55, sx * 1.9 + 0.4, 0.16, 0.55);
}
function rideCarMover(game, s, R, light) {
  const f = s.frame;
  const mesh = movable(s, (g) => drawRideCar(g, R), [R.carX, R.carY, R.carZ], { center: [0, 1.1, 0], radius: 4, far: 220 });
  const l = s.light({ at: [R.carX, R.carY + 1.4, R.carZ], color: '#ffe2b8', power: 2.4, range: 8, clip: light, radius: 0.6 });
  // docked → leaving → away → arriving → docked; it leaves the way it runs and comes back from the other side
  const st = { s: 'docked', t: 0, dur: 30 + (R.dir > 0 ? 0 : 14) };
  const vmax = Math.min(30, speedFor(R.gPeak, R.dir));
  s.every((dt) => {
    st.t += dt;
    let x = R.carX;
    if (st.s === 'leaving') { const k = st.t / st.dur; x = R.carX + R.dir * 0.5 * (2 * vmax / st.dur) * (st.t * st.t) / 2; if (k >= 1) { st.s = 'away'; st.t = 0; st.dur = 26; } }
    else if (st.s === 'away') { x = R.carX + R.dir * 400; if (st.t >= st.dur) { st.s = 'arriving'; st.t = 0; st.dur = 9; sfx(game, 'whoosh', f, R.carX - R.dir * 20, R.carY + 1, R.carZ); } }
    else if (st.s === 'arriving') { const rem = st.dur - st.t; x = R.carX - R.dir * 0.5 * (2 * vmax / st.dur) * (rem * rem) / 2; if (st.t >= st.dur) { st.s = 'docked'; st.t = 0; st.dur = 35 + (R.dir > 0 ? 0 : 10); sfx(game, 'cab-stop', f, R.carX, R.carY + 1, R.carZ); sfx(game, 'chime', f, R.gate.x, R.gate.y + 2.5, R.gate.z); } }
    else if (st.t >= st.dur) { st.s = 'leaving'; st.t = 0; st.dur = 9; sfx(game, 'cab-go', f, R.carX, R.carY + 1, R.carZ); }
    if (st.s === 'leaving' && st.t > st.dur) x = R.carX + R.dir * 300;
    mesh.userData.origin[0] = x; l.theta = f.theta(x);
    mesh.userData.hidden = Math.abs(x - R.carX) > XT;
  });
  return st;
}

// ---------------------------------------------------------------------------------------------------------------
// The cabins you ride in: in their own frame, a felt room with a bench, a window onto the tube going by, a weight board
// and a drop case (a lidded brass cup dropped 1.33 m, again and again, so you can see how long it takes).
// ---------------------------------------------------------------------------------------------------------------
function buildCabins(game, W) {
  const f = W.frame('line63-ride', deckRadius(63), 0.5, 2290);
  const out = {};
  for (const id of ['press', 'souffle']) {
    const R = RIDES[id], CX = id === 'press' ? 0 : 400;
    const s = W.scope('line63-ride-' + id, f), g = s.g;
    const clip = room(s, { x0: CX - 2.7, z0: -1.1, x1: CX + 2.7, z1: 1.1, y: 0, h: 2.35, floor: ['carpet', id === 'press' ? '#5a2f3a' : '#3a4a6a'], ceil: ['felt', '#d8ccb4'],
      wall: { mat: 'felt', tint: id === 'press' ? '#6a3a2c' : '#55666c', dado: { h: 0.9, mat: 'wood', tint: '#5b4636' }, skirt: false }, open: { n: [{ at: 0.5, w: 3.0, h: 0.72, sill: 0.95 }] }, glow: { sky: '#ffdcae', ground: '#a8794f', power: 0.4 } });
    s.glass(CX - 2.2, 0.95, -1.1, CX + 0.8, 1.67, -1.1, { tint: '#a8cfc6', opacity: 0.06, rough: 0.3 });
    lamp(s, 'panel', CX, 2.35, 0.2, { w: 1.6, d: 0.4, K: 2800, power: 0.45, clip, range: 4, lampFlag: false });
    prop(s, 'bench', CX, 0, 0.82, PI, { w: 4.6, back: true, wood: '#7a5233' }, { noSpots: true, tier: 's' });
    g.mat('cast', '#c8a45a'); g.tube([[CX - 2.6, 1.05, -0.92], [CX + 1.15, 1.05, -0.92]], 0.016, { segs: 6 }); g.tube([[CX - 2.6, 1.25, 1.0], [CX + 2.6, 1.25, 1.0]], 0.016, { segs: 6 });
    for (const x of [-1.6, -0.5, 0.6, 1.7]) { g.mat('weave', '#3a3430'); g.tube([[CX + x, 2.3, 0.4], [CX + x, 1.95, 0.4]], 0.008, { segs: 3 }); g.mat('cast', '#c8a45a'); g.tube([[CX + x - 0.07, 1.93, 0.4], [CX + x + 0.07, 1.93, 0.4]], 0.012, { segs: 4 }); }
    // the drop case, on the front wall beside the window: a glass box, a release at the top, a felt pad at the bottom
    const DX = CX + 1.5, DZ = -0.71;
    g.mat('cast', '#b08a45'); g.box(DX - 0.25, 0.3, -0.94, DX + 0.25, 0.36, -0.48); g.box(DX - 0.25, 1.84, -0.94, DX + 0.25, 1.9, -0.48); g.box(DX - 0.05, 1.8, DZ - 0.05, DX + 0.05, 1.84, DZ + 0.05);
    g.mat('felt', '#5a2f3a'); g.box(DX - 0.18, 0.36, -0.88, DX + 0.18, 0.38, -0.54);
    for (const p of [[-0.25, -0.48], [0.25, -0.48]]) { g.mat('cast', '#b08a45'); g.box(DX + p[0] - 0.012, 0.3, p[1] - 0.012, DX + p[0] + 0.012, 1.9, p[1] + 0.012); }
    s.flush({ tier: 's' });
    sign(s, { kind: 'plate', text: 'Drop case', lines: ['a lidded cup · 1.33 m · timed'] }, DX, 2.06, -0.93, { face: 'Z', w: 0.42, h: 0.17 });
    const bead = movable(s, (gg) => { gg.mat('cast', '#d6b06a', { rough: -0.3 }); gg.lathe(0, 0, [[0, 0], [0.03, 0], [0.04, 0.012], [0.042, 0.075], [0.046, 0.08], [0.034, 0.092], [0.012, 0.1], [0.012, 0.11], [0, 0.112]], { segs: 12 }); }, [DX, 1.7, DZ], { radius: 0.15, far: 30 });
    // the tube outside the window: a dark wall, a floor, a roof, and ring lamps going by (one mesh, shifted)
    g.mat('panel', '#3a4442'); for (let x = CX - 56; x < CX + 56; x += 16) g.box(x, -0.8, -3.0, x + 16, 3.2, -2.9, { faces: 'Z' });
    g.mat('concrete', '#2b2f2d'); for (let x = CX - 56; x < CX + 56; x += 16) g.box(x, -0.82, -3.0, x + 16, -0.8, -1.1, { faces: 'Y' });
    g.mat('panel', '#323b39'); for (let x = CX - 56; x < CX + 56; x += 16) g.box(x, 3.2, -3.0, x + 16, 3.22, -1.1, { faces: 'y' });
    s.flush({ tier: 's' });
    const rings = movable(s, (gg) => {
      for (let k = -13; k <= 13; k++) {
        const x = k * 4;
        gg.mat('diffuser', id === 'press' ? '#ffc890' : '#bfefff', { emissive: 8 }); gg.box(x - 0.07, -0.8, -2.89, x + 0.07, 3.2, -2.87, { faces: 'Z' }); gg.box(x - 0.07, 3.18, -2.9, x + 0.07, 3.2, -1.15, { faces: 'y' });
        gg.mat('diffuser', id === 'press' ? '#ff8a5a' : '#7fd8ff', { emissive: 3 }); gg.box(x + 0.6, 1.0, -2.89, x + 2.0, 1.04, -2.87, { faces: 'Z' });
      }
    }, [CX, 0, 0], { radius: 56, far: 80 });
    const flash = s.light({ at: [CX - 0.7, 1.4, -2.2], color: id === 'press' ? '#ffc890' : '#bfefff', power: 2.4, range: 4.5, clip: [CX - 2.8, -1, -3.2, CX + 2.8, 2.5, 1.2], radius: 0.6 }); flash.scale = 0;
    // the weight board over the window, redrawn as the ride goes
    const R0 = signRect(game.atlas, { kind: 'board', title: id, lines: ['ride'], palette: ['#101614', '#f3e6c8', '#3fe0d0'], w: 1.4, h: 0.36 }, 1.4, 0.36);
    s.deco((gg) => { const rr = R0.rect; gg.atlas(rr.page, { emissive: 1.6 }); gg.quad([CX - 1.4, 1.78, -0.92], [CX, 1.78, -0.92], [CX, 2.14, -0.92], [CX - 1.4, 2.14, -0.92], { uv: [rr.u0, rr.v1, rr.u1, rr.v0] }); });
    s.zoneBox({ id: 'ride-' + id, box: [CX - 2.8, -0.5, -1.2, CX + 2.8, 2.5, 1.2], name: R.name, sub: 'once round line deck 63', ambience: 'cab', reverb: 'room', headroom: 2.3 });
    s.finish();
    const show = (big, small, right) => {
      game.atlas.redraw(R0.rect, (ctx, w, h) => {
        ctx.fillStyle = '#101614'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#f3e6c8'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.font = "600 " + Math.round(h * 0.5) + "px 'Barlow Condensed', sans-serif"; ctx.fillText(big, w * 0.05, h * 0.36);
        ctx.fillStyle = '#3fe0d0'; ctx.font = "500 " + Math.round(h * 0.22) + "px 'Barlow Condensed', sans-serif"; ctx.fillText(small, w * 0.05, h * 0.8);
        ctx.fillStyle = '#d9a23a'; ctx.textAlign = 'right'; ctx.font = "500 " + Math.round(h * 0.26) + "px 'Barlow Condensed', sans-serif"; ctx.fillText(right, w * 0.95, h * 0.36);
      });
    };
    show(G0.toFixed(2) + ' g', 'standing at the gate', 'drop ' + dropTime(G0).toFixed(2) + ' s');
    // the moving parts run only while somebody rides
    const run = { on: false, u: 0, x: 0, bt: 0, by: 1.7, phase: 0 };
    s.every((dt) => {
      if (!run.on) return;
      run.x += run.u * dt * (R.dir > 0 ? -1 : 1);
      rings.userData.origin[0] = CX + (((run.x % 4) + 4) % 4) - 2;
      flash.scale = Math.min(1, run.u / 12) * 0.7;
      // the cup: held at the top, let go, falls under the weight of the moment, rests, is lifted back
      const gg = game.player.gOverride || G0, top = 1.7, bottom = 0.38, hgt = top - bottom;
      run.bt += dt;
      if (run.phase === 0) { run.by = top; if (run.bt > 1.4) { run.phase = 1; run.bt = 0; } }
      else if (run.phase === 1) { run.by = top - 0.5 * gg * DRUM.G0 * run.bt * run.bt; if (run.by <= bottom) { run.by = bottom; run.phase = 2; run.bt = 0; sfx(game, 'cup', f, DX, 0.4, DZ); } }
      else if (run.phase === 2) { if (run.bt > 0.8) { run.phase = 3; run.bt = 0; } }
      else { run.by = bottom + hgt * Math.min(1, run.bt / 1.2); if (run.bt >= 1.2) { run.phase = 0; run.bt = 0; } }
      bead.userData.origin[1] = run.by;
    });
    out[id] = { frame: f, x: CX, show, run, scope: s };
  }
  return out;
}
function dropTime(g) { return Math.sqrt(2 * 1.33 / (g * DRUM.G0)); }

// ---------------------------------------------------------------------------------------------------------------
// The gates and the rides themselves, done the way the game's cab does a ride.
// ---------------------------------------------------------------------------------------------------------------
let riding = false;
function gates(game, s, cabins) {
  const g = s.g;
  s.lmRide = { press: () => ride(game, RIDES.press, cabins.press), souffle: () => ride(game, RIDES.souffle, cabins.souffle) };   // for tests
  for (const id of ['press', 'souffle']) {
    const R = RIDES[id], y = R.gate.y, gz = id === 'press' ? Z0 : Z1, sg = id === 'press' ? 1 : -1;
    // the gate: brass leaves either side of the opening, a lit board over it
    g.mat('cast', '#b08a45', { rough: -0.1 }); g.box(R.carX - 1.15, y + (id === 'press' ? PY : SY - MY), gz - 0.08, R.carX - 1.0, y + 2.7, gz + 0.08); g.box(R.carX + 1.0, y + (id === 'press' ? PY : SY - MY), gz - 0.08, R.carX + 1.15, y + 2.7, gz + 0.08); g.box(R.carX - 1.15, y + 2.6, gz - 0.08, R.carX + 1.15, y + 2.75, gz + 0.08);
    g.mat('cast', '#3a3430'); g.box(R.carX - 1.4, y + 2.4, gz + sg * 0.1, R.carX - 1.2, y + 2.95, gz + sg * 0.18, { bevel: 0.01 });
    g.mat('diffuser', id === 'press' ? '#ff8a5a' : '#7fd8ff', { emissive: 3.5 }); g.cyl(R.carX - 1.3, y + 2.6, gz + sg * 0.19, 0.05, 0.02, { segs: 10 });
    s.flush({ tier: 's' });
    const board = id === 'press' ? { kind: 'board', title: 'The Press', lines: ['spinward|22.5 m/s', 'at the top|1.20 g', 'once round|about 13 min', 'fare|0.30 kWh'], palette: ['#2a1210', '#f3e6c8', '#ff8a5a'] }
      : { kind: 'board', title: 'The Soufflé', lines: ['anti|67 m/s', 'at the top|0.30 g', 'once round|about 4½ min', 'fare|0.45 kWh'], palette: ['#101a1c', '#f3ead4', '#7fd8ff'] };
    sign(s, board, R.carX + 2.4, y + 2.25, gz + sg * 0.2, { face: sg > 0 ? 'Z' : 'z', w: 1.5, h: 0.95, glow: 1.0 });
    rideCarMover(game, s, R, id === 'press' ? [-XT, PY, PZ0, XT, PR, Z0] : [-XT, SY, Z1, XT, SR, SZ1]);
    s.interact({ x: R.carX, y: y + 1.2, z: gz + sg * 1.0, radius: 1.8, prompt: (gm) => (riding ? R.name : 'Ride ' + R.name.replace('The', 'the') + ' (' + R.fare.toFixed(2) + ' kWh)'), onUse: (gm) => ride(gm, R, cabins[id]) });
  }
}

async function ride(game, R, C) {
  if (riding || game.busy || (game.cab && game.cab.riding)) return;
  const p = game.player, ui = game.ui;
  if (game.wallet && !game.wallet.spend(R.fare, R.name)) { toast(game, 'The fare is ' + R.fare.toFixed(2) + ' kWh, and you are short of it.'); return; }
  riding = true; game.busy++;
  const back = R.gate;
  let hum = null, rush = null, finished = false;
  try {
    if (game.audio) game.sfx('berth-door');
    if (ui) await ui.fade(true, 0.45);
    p.place(C.frame, C.x - 0.5, 0, 0.62, 0, 0); p.sit({ x: C.x - 0.5, y: 0, z: 0.62, yaw: 0, eye: 1.12 }); p.locked = true; p.yaw = 0; p.pitch = 0.12;
    if (game.audio) {
      game.audio.ambience('cab', { fade: 0.6 }); game.audio.reverb('room');
      hum = game.audio.loop('cab-hum', { vol: 0.45 }); rush = game.audio.loop('wind', { vol: 0.0, param: 0 });
    }
    C.run.on = true; C.run.u = 0; C.run.phase = 0; C.run.bt = 0;
    if (ui) { ui.hud.thread(null); await ui.fade(false, 0.5); }
    if (game.audio) game.sfx('cab-go');
    const T = 26, A = 8.5, Bk = 17.5;                 // spin up till A, hold, brake from Bk
    const uPeak = speedFor(R.gPeak, R.dir);
    let t = 0, lastShown = '', told = false;
    await new Promise((res) => {
      const off = game.events.on('update', (dt) => {
        t += Math.min(dt, 0.1);
        const k = t < A ? smoother(t / A) : t < Bk ? 1 : smoother(clamp((T - t) / (T - Bk), 0, 1));
        const u = uPeak * k;
        const gNow = G0 * Math.pow(1 + R.dir * u / V, 2);
        p.gOverride = gNow;
        C.run.u = u;
        // the body: you sink into the bench when heavy and lift a little when light; a lean as it speeds up and brakes
        const acc = t < A ? 1 : t < Bk ? 0 : -1;
        p.camOffset.set(0, -(gNow - G0) * 0.12, 0);
        p.roll = acc * Math.sin(Math.PI * (t < A ? t / A : t < Bk ? 0 : clamp((t - Bk) / (T - Bk), 0, 1))) * 0.02 * (R.dir > 0 ? 1 : -1);
        if (hum) hum.set({ pitch: 0.85 + 0.5 * k });
        if (rush) rush.set({ vol: 0.22 * k, param: k });
        const big = gNow.toFixed(2) + ' g', small = u < 0.5 ? 'standing at the gate' : u.toFixed(1) + ' m/s ' + (R.dir > 0 ? 'spinward' : 'anti') + ' · going round at ' + (V + R.dir * u).toFixed(0);
        const right = 'drop ' + dropTime(gNow).toFixed(2) + ' s';
        const key = big + small + right;
        if (key !== lastShown && Math.floor(t * 8) !== Math.floor((t - dt) * 8)) { lastShown = key; C.show(big, small, right); }
        if (!told && t > A + 1.5) {
          told = true;
          toast(game, R.dir > 0 ? 'You are pressed into the bench. Your arms weigh more than they did, and lifting a hand to the strap is work.' : 'The cup in the drop case takes its time. Your sleeves lift a little off your arms, and your stomach has gone somewhere else.');
        }
        if (t >= T) { off(); res(); }
      });
    });
    finished = true;
    if (game.audio) { game.sfx('cab-stop'); game.sfx('chime', { delay: 0.25 }); }
    if (ui) await ui.fade(true, 0.45);
  } catch (e) { console.error('[line-rides] ' + (e && e.stack ? e.stack : e)); }
  if (hum) hum.stop(0.4); if (rush) rush.stop(0.4);
  C.run.on = false;
  p.gOverride = null; p.roll = 0; p.camOffset.set(0, 0, 0);
  p.stand(); p.locked = false;
  const f = game.world.frames.get('line63');
  if (f) p.place(f, back.x, back.y, back.z, back.yaw, 0);
  if (finished) {
    if (R.id === 'press') game.flags.rode_heavy = true;
    else game.flags.rode_light = true;
    game.flags['line.rides'] = (game.flags['line.rides'] || 0) + 1;
    if (game.story && game.story.persist) game.story.persist();
    game.events.emit('ride:done', { ride: R.id === 'press' ? 'heavy' : 'light' });
  }
  if (ui) { await ui.fade(false, 0.6); ui.hud.thread(game.journal ? game.journal.current() : null); }
  toast(game, R.dir > 0 ? 'Back at 0.92. For a minute everything feels as if it might float off the floor. The still benches are just there.' : 'Back at 0.92. Your legs have forgotten how heavy they are and are surprised. The still benches are just there.');
  riding = false; game.busy--;
}
