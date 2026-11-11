// The smaller places of the Garden: the cab lobby, the Packing Hall in front of the Greens, the Tomato House (with the
// brush bench and the strawberry rack), the Tea Rows, the Cool Rooms, the Green Tanks, and the far lobby at the end of
// the Glass Walk. Frame 'keel-garden' (see lm_keel_garden.js and the plan in lm_keel_garden_props.js).
import { floor, ceiling, wall, lamp } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { PI, C, HALL, GAL, STREET, PACK, LOBBY, FAR, BELT_X0, TOMATO, TEA, COOL, TANKS, say, toast, sfx, find, tick, pickBy, sends, crateLabel } from './lm_keel_garden_props.js';

export async function buildRooms(game, s, f, R, r) {
  lobby(game, s, f);
  farLobby(game, s, f);
  await tick(game);
  packingHall(game, s, f, R, r);
  await tick(game);
  tomatoHouse(game, s, f, r);
  await tick(game);
  teaRows(game, s, f, r);
  await tick(game);
  coolRooms(game, s, f, r);
  greenTanks(game, s, f, r);
}

const WZ = GAL.z0 - 0.15;          // the room side of the Glass Walk's outer wall

// Two berths on a wall and their call buttons. (x, z): the wall's face; yaw: the way the berths face; dz: half the spacing.
function berths(s, x, z, yaw, stopId, label) {
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  for (const d of [-2.2, 2.2]) {
    const px = x + Math.cos(yaw) * d, pz = z - Math.sin(yaw) * d;
    prop(s, 'keelgarden.berth', px, 0, pz, yaw, {});
    s.interact({ x: px + fx * 0.7, y: 1.2, z: pz + fz * 0.7, radius: 1.6, prompt: 'Call a cab', onUse: (gm) => { sfx(gm, 'berth-door', gm.world.frames.get('keel-garden'), px, 1.2, pz); if (gm.cab) gm.cab.open(stopId); } });
  }
  void label;
}

// Coats on pegs along a rail (from (x0, z) to (x1, z) facing +z when face > 0, -z when face < 0).
function coats(s, x0, x1, z, face, cols) {
  const g = s.g;
  s.detail(() => {
    g.mat('wood', '#5b4636'); g.box(x0, 1.86, z - 0.03, x1, 1.96, z + 0.03);
    const n = Math.floor((x1 - x0) / 0.5);
    for (let i = 0; i < n; i++) {
      const x = x0 + 0.25 + i * 0.5, c = cols[i % cols.length], zf = z + face * 0.06;
      g.mat('cast', C.brass); g.box(x - 0.01, 1.8, z - 0.01, x + 0.01, 1.86, zf);
      g.mat('weave', c); g.box(x - 0.2, 0.95, zf - 0.04, x + 0.2, 1.8, zf + 0.04, { bevel: 0.03 });
      g.box(x - 0.27, 1.1, zf - 0.035, x - 0.19, 1.76, zf + 0.035, { bevel: 0.02 }); g.box(x + 0.19, 1.1, zf - 0.035, x + 0.27, 1.76, zf + 0.035, { bevel: 0.02 });
      // a bright mend at a cuff or a pocket
      g.mat('knit', ['#d6a640', '#b5532e', '#2f6f73', '#7fe08a'][i % 4]); g.box(x - 0.08 + (i % 2) * 0.1, 1.2, zf + face * 0.041 - 0.002, x + 0.0 + (i % 2) * 0.1, 1.3, zf + face * 0.043, { faces: face > 0 ? 'Z' : 'z' });
    }
  });
}

// ---------------------------------------------------------------------------------------------------------------
// the cab lobby, off the anti side of the Packing Hall
// ---------------------------------------------------------------------------------------------------------------
function lobby(game, s, f) {
  const L = LOBBY, g = s.g, clip = [L.x0 - 0.2, -0.3, L.z0 - 0.2, L.x1 + 2, L.h + 0.2, L.z1 + 0.2];
  floor(s, L.x0, L.z0, L.x1, L.z1, 0, 'terrazzo', '#c9bca2');
  ceiling(s, L.x0, L.z0, L.x1, L.z1, L.h, 'panel', '#d9cfb8');
  wall(s, L.x0, L.z0, L.x0, L.z1, 0, L.h, { tint: '#d9cfb8', dado: { h: 1.2, mat: 'panel', tint: '#2f5d5a' }, t: 0.16 });
  wall(s, L.x0, L.z0, L.x1, L.z0, 0, L.h, { tint: '#e3d7bd', dado: { h: 1.2, mat: 'panel', tint: '#2f5d5a' } });
  wall(s, L.x0, L.z1, L.x1, L.z1, 0, L.h, { tint: '#e3d7bd', dado: { h: 1.2, mat: 'panel', tint: '#2f5d5a' } });
  s.detail(() => { g.mat('rush', '#6b5a3a'); g.box(L.x1 - 3.2, 0.002, L.z0 + 2, L.x1 - 0.4, 0.012, L.z1 - 2, { faces: 'Y' }); });
  berths(s, L.x0 + 0.08 + 0.16, (L.z0 + L.z1) / 2, PI / 2, 'keel-garden');
  sign(s, { kind: 'plate', text: 'BERTHS 1 AND 2', sub: 'the Garden · deck 6 · one party a cab' }, L.x0 + 0.1, 2.95, (L.z0 + L.z1) / 2, { face: 'X', w: 0.9, h: 0.3 });
  prop(s, 'bench', L.x0 + 4.2, 0, L.z0 + 0.45, 0, { w: 2.2, wood: '#7a5233', back: true });
  // a sill of herb pots under their own lamp: the herb pot is the last of the Garden to go dark
  s.furniture(() => { g.mat('wood', '#6b4a2f'); g.box(L.x0 + 6.4, 0.95, L.z0 + 0.08, L.x1 - 0.8, 1.0, L.z0 + 0.42, { bevel: 0.01 }); g.mat('cast', '#3d4245'); for (const x of [L.x0 + 6.6, L.x1 - 1.0]) g.box(x - 0.02, 0.6, L.z0 + 0.08, x + 0.02, 0.95, L.z0 + 0.4); });
  for (let i = 0; i < 7; i++) prop(s, 'plant', L.x0 + 6.8 + i * 0.62, 1.0, L.z0 + 0.25, i, { kind: ['fine', 'fern', 'broad', 'fine', 'fern', 'fine', 'broad'][i], size: 0.42, pot: ['#a3563a', '#2f6f73', '#c9962e', '#e9e1cf', '#a3563a', '#5b4060', '#2f6f73'][i] });
  lamp(s, 'strip', L.x0 + 6.6, 1.9, L.z0 + 0.3, { to: [L.x1 - 1.0, 1.9, L.z0 + 0.3], color: '#ff6ab8', power: 0.22, range: 2.5, clip, lampFlag: false });
  // coats on pegs: Garden coats, pale, each with a name in the lining
  coats(s, L.x0 + 3.2, L.x1 - 1.0, L.z1 - 0.12, -1, ['#e8e2d6', '#dcd6ca', '#e8e2d6', '#d8e0d8', '#e8e2d6', '#e6d8d8']);
  sign(s, { kind: 'notice', title: 'Visitors', lines: ['The Glass Walk is open to anyone.', 'Please do not touch the glass:', 'it is cleaned by hand, both sides.', 'Crews: your own peg, your own coat.', 'Nothing from the street', 'goes past the Lock.'] }, L.x0 + 2.1, 1.6, L.z1 - 0.1, { face: 'z', w: 0.62, h: 0.62 });
  s.interact({ x: L.x0 + 2.1, y: 1.4, z: L.z1 - 0.9, radius: 1.4, prompt: 'Read the notice by the pegs', onUse: async (gm) => {
    await say(gm, 'Visitors', [
      'The Glass Walk is open to anyone, at any hour. Please do not touch the glass: it is cleaned by hand, from both sides, and the inside crew can see your fingers.',
      'Crews: your own peg, your own coat. Garden coats are washed in the loop at sixty-five degrees every shift. Nothing from the street goes past the Lock, and that includes you.',
    ]);
  } });
  lamp(s, 'panel', L.x0 + 3.5, L.h, (L.z0 + L.z1) / 2, { w: 2.2, d: 0.6, K: 3300, power: 0.85, clip });
  lamp(s, 'panel', L.x0 + 8.5, L.h, (L.z0 + L.z1) / 2, { w: 2.2, d: 0.6, K: 3300, power: 0.75, clip });
  s.ambient({ box: clip, sky: '#ffdcae', ground: '#c9a57c', power: 0.2, lamp: true });
  for (const p of [[L.x0 + 6, L.z0 + 4, 0.7], [L.x0 + 6.6, L.z0 + 5.1, -2.4], [L.x0 + 5.5, L.z0 + 5.2, 2.2]]) s.spot('chat', p[0], 0, p[1], p[2], { tags: ['shift'] });
  s.spot('stand', L.x0 + 1.6, 0, L.z0 + 3.2, -PI / 2, { tags: ['wait'] });
  s.path([[L.x0 + 1.6, (L.z0 + L.z1) / 2], [L.x0 + 6, (L.z0 + L.z1) / 2], [L.x1 + 1, (L.z0 + L.z1) / 2], [L.x1 + 4, 14]]);
  s.zoneBox({ id: 'keel-garden-lobby', place: 'keel-garden', box: [L.x0, -0.5, L.z0, L.x1, L.h, L.z1], name: 'Garden cabs', sub: 'The Garden · the Keel · deck 6 · Ring Four', ambience: 'station', reverb: 'room', headroom: L.h });
}

// ---------------------------------------------------------------------------------------------------------------
// the far lobby, at the spinward end of the Glass Walk
// ---------------------------------------------------------------------------------------------------------------
function farLobby(game, s, f) {
  const F = FAR, g = s.g, clip = [F.x0 - 0.5, -0.3, F.z0 - 0.2, F.x1 + 0.2, F.h + 0.2, F.z1 + 0.2];
  floor(s, F.x0, F.z0, F.x1, F.z1, 0, 'terrazzo', '#c9bca2');
  ceiling(s, F.x0, F.z0, F.x1, F.z1, F.h, 'panel', '#d9cfb8');
  wall(s, F.x1, F.z0, F.x1, F.z1, 0, F.h, { tint: '#d9cfb8', dado: { h: 1.2, mat: 'panel', tint: '#2f5d5a' } });
  wall(s, F.x0, F.z0, F.x1, F.z0, 0, F.h, { tint: '#e3d7bd', dado: { h: 1.2, mat: 'panel', tint: '#2f5d5a' } });
  wall(s, F.x0, F.z1, F.x1, F.z1, 0, F.h, { tint: '#e3d7bd', dado: { h: 1.2, mat: 'panel', tint: '#2f5d5a' } });
  wall(s, F.x0, F.z0, F.x0, GAL.z0, 0, F.h, { tint: '#e3d7bd', t: 0.3 });
  s.structure(() => { g.mat('cast', '#3d4245'); g.box(F.x0 - 0.15, F.h - 0.3, GAL.z0, F.x0 + 0.15, F.h, GAL.z1); });
  berths(s, F.x1 - 0.24, (F.z0 + F.z1) / 2, -PI / 2, 'keel-garden-far');
  sign(s, { kind: 'plate', text: 'BERTHS 3 AND 4', sub: 'the Garden, spinward end' }, F.x1 - 0.1, 2.95, (F.z0 + F.z1) / 2, { face: 'x', w: 0.9, h: 0.3 });
  sign(s, { kind: 'street', text: 'Cabs', sub: 'the end of the Glass Walk', palette: ['#22302c', '#f1ead8'] }, F.x0 - 0.01, F.h + 0.5, (GAL.z0 + GAL.z1) / 2, { face: 'x', w: 2.4, h: 0.55, glow: 0.8 });
  prop(s, 'bench', F.x0 + 4, 0, F.z0 + 0.45, 0, { w: 2.0, wood: '#7a5233', back: true });
  lamp(s, 'panel', (F.x0 + F.x1) / 2, F.h, (F.z0 + F.z1) / 2, { w: 2.2, d: 0.6, K: 3300, power: 0.85, clip });
  s.ambient({ box: clip, sky: '#ffdcae', ground: '#c9a57c', power: 0.2, lamp: true });
  s.zoneBox({ id: 'keel-garden-far', place: 'keel-garden', box: [F.x0, -0.5, F.z0, F.x1, F.h, F.z1], name: 'Garden cabs', sub: 'The Garden · the spinward end', ambience: 'station', reverb: 'room', headroom: F.h });
}

// ---------------------------------------------------------------------------------------------------------------
// the Packing Hall: cool white, three decks tall, the glass end of the Greens across its spinward side
// ---------------------------------------------------------------------------------------------------------------
const LOCK = { z0: 23.4, z1: 26.6, x0: -3.4 };
const CLOTHS = ['#e6dcc4', '#b5532e', '#2f6f73', '#e6dcc4', '#c9962e', '#5b4060', '#e6dcc4', '#33407a'];
function packingHall(game, s, f, R, r) {
  const P = PACK, g = s.g, clip = [P.x0 - 0.2, -0.3, P.z0 - 0.2, P.x1 + 0.4, P.h + 0.2, P.z1 + 0.2];
  floor(s, P.x0, P.z0, P.x1, P.z1, 0, 'speckle', '#b4bcb6');
  s.structure(() => {
    g.mat('paint', '#2f6f73', { rough: -0.2 }); for (const z of [8.2, 19.0]) g.box(P.x0 + 1, 0, z - 0.06, P.x1 - 0.5, 0.006, z + 0.06, { faces: 'Y' });
    g.mat('paint', '#d6a640', { rough: -0.2 }); g.box(P.x1 - 1.4, 0, 0.2, P.x1 - 1.28, 0.006, P.z1 - 0.2, { faces: 'Y' });
  });
  ceiling(s, P.x0, P.z0, P.x1, P.z1, P.h, 'panel', '#e2e6e4');
  // white trusses under the roof, and the two decks' lines on the walls
  for (let x = P.x0 + 4; x < P.x1; x += 8) s.structure(() => { g.mat('brushed', '#e8ecea'); g.box(x - 0.12, P.h - 0.8, P.z0, x + 0.12, P.h - 0.6, P.z1); g.box(x - 0.08, P.h - 0.6, P.z0, x + 0.08, P.h, P.z0 + 0.3); for (let z = P.z0 + 2; z < P.z1; z += 4) g.tube([[x, P.h - 0.6, z - 2], [x, P.h - 0.02, z]], 0.03, { segs: 4 }); });
  const wl = { mat: 'paint', tint: '#dfe5e2', dado: { h: 2.2, mat: 'tile', tint: '#eef0ec' }, skirt: '#7a8a86', t: 0.3 };
  for (const [a, b] of [[P.x0, -12], [-12, P.x1]]) { wall(s, a, P.z0, b, P.z0, 0, P.h, wl); wall(s, a, P.z1, b, P.z1, 0, P.h, wl); }
  wall(s, P.x0, P.z0, P.x0, P.z1, 0, P.h, Object.assign({}, wl, { openings: [{ at: LOBBY.z0 - P.z0, w: LOBBY.z1 - LOBBY.z0, h: LOBBY.h }] }));
  s.structure(() => { g.mat('paint', '#2f6f73'); for (const y of [4, 8]) { g.box(P.x0 + 0.15, y - 0.08, P.z0, P.x0 + 0.2, y + 0.08, P.z1, { faces: 'XyY' }); g.box(P.x0, y - 0.08, P.z1 - 0.2, P.x1, y + 0.08, P.z1 - 0.15, { faces: 'zyY' }); g.box(P.x0, y - 0.08, P.z0 + 0.15, P.x1, y + 0.08, P.z0 + 0.2, { faces: 'ZyY' }); } });
  sign(s, { kind: 'street', text: 'Cabs · the Garden', sub: 'the Packing Hall · the Glass Walk', palette: ['#22302c', '#f1ead8'] }, P.x0 + 0.17, LOBBY.h + 0.55, (LOBBY.z0 + LOBBY.z1) / 2, { face: 'X', w: 3.4, h: 0.62, glow: 0.8 });
  sign(s, { kind: 'letters', text: 'The Packing Hall', palette: ['#2f5d5a'] }, P.x0 + 0.17, 9.6, (LOBBY.z0 + LOBBY.z1) / 2, { face: 'X', w: 9, h: 1.6 });
  // the glass end of the Greens: mullions, transoms at the decks, the belt hatch and the Lock
  const panes = 12, pw = HALL.z1 / panes;
  for (let i = 0; i < panes; i++) {
    const z0 = i * pw, z1 = (i + 1) * pw, belt = z0 < STREET.belt + 0.7 && z1 > STREET.belt - 0.7, lock = z0 < LOCK.z1 && z1 > LOCK.z0;
    s.glass(0, belt ? 1.5 : lock ? 2.6 : 0.3, z0, 0, P.h, z1, { tint: C.glassTint, opacity: 0.07, rough: 0.22 });
  }
  s.structure(() => {
    g.mat('cast', '#2a2c30', { rough: -0.1 });
    for (let i = 0; i <= panes; i++) g.box(-0.08, 0, i * pw - 0.07, 0.08, P.h, i * pw + 0.07, { faces: 'xXzZ' });
    for (const y of [4, 8]) g.box(-0.1, y - 0.1, 0, 0.1, y + 0.1, HALL.z1, { faces: 'xXyY' });
    g.mat('concrete', '#4a4640'); g.box(-0.18, 0, 0, 0.18, 0.3, HALL.z1, { faces: 'xXY' });
    // the belt hatch's frame and the Lock's door frame
    g.mat('paint', '#d6a640'); g.box(-0.12, 0.6, STREET.belt - 0.8, 0.12, 1.55, STREET.belt - 0.7); g.box(-0.12, 0.6, STREET.belt + 0.7, 0.12, 1.55, STREET.belt + 0.8); g.box(-0.12, 1.45, STREET.belt - 0.8, 0.12, 1.55, STREET.belt + 0.8);
    g.box(-0.12, 0, LOCK.z0 + 1.0, 0.12, 2.6, LOCK.z0 + 1.1); g.box(-0.12, 0, LOCK.z1 - 1.1, 0.12, 2.6, LOCK.z1 - 1.0); g.box(-0.12, 2.5, LOCK.z0 + 1.0, 0.12, 2.6, LOCK.z1 - 1.0);
  });
  // strip curtains in the hatch and the Lock's inner door
  s.detail(() => {
    g.mat('plain', '#c8d4d8', { rough: -0.3 });
    for (let z = STREET.belt - 0.68; z < STREET.belt + 0.68; z += 0.12) g.box(-0.02, 0.84, z, 0.02, 1.45, z + 0.1, { faces: 'xX' });
    for (let z = LOCK.z0 + 1.12; z < LOCK.z1 - 1.12; z += 0.14) g.box(-0.02, 0.05, z, 0.02, 2.5, z + 0.12, { faces: 'xX' });
  });
  s.solid(-0.12, 0, 0, 0.12, P.h, HALL.z1, { surf: 'stone' });
  // the Lock: a glazed room inside the Packing Hall's glass, with Garden coats on pegs
  const lockClip = [LOCK.x0 - 0.1, -0.2, LOCK.z0 - 0.1, 0.1, 2.9, LOCK.z1 + 0.1];
  s.glass(LOCK.x0, 0, LOCK.z0, 0, 2.6, LOCK.z0, { tint: '#e8f0ee', opacity: 0.1 }); s.glass(LOCK.x0, 0, LOCK.z1, 0, 2.6, LOCK.z1, { tint: '#e8f0ee', opacity: 0.1 });
  s.glass(LOCK.x0, 0, LOCK.z0, LOCK.x0, 2.6, LOCK.z0 + 1.0, { tint: '#e8f0ee', opacity: 0.1 }); s.glass(LOCK.x0, 0, LOCK.z1 - 1.0, LOCK.x0, 2.6, LOCK.z1, { tint: '#e8f0ee', opacity: 0.1 });
  s.structure(() => {
    g.mat('brushed', '#cfd4d2'); g.box(LOCK.x0 - 0.05, 2.6, LOCK.z0 - 0.05, 0, 2.75, LOCK.z1 + 0.05);
    for (const [x, z] of [[LOCK.x0, LOCK.z0], [LOCK.x0, LOCK.z1], [LOCK.x0, LOCK.z0 + 1.0], [LOCK.x0, LOCK.z1 - 1.0], [-1.7, LOCK.z0], [-1.7, LOCK.z1]]) g.box(x - 0.05, 0, z - 0.05, x + 0.05, 2.6, z + 0.05);
    g.mat('paint', '#d6a640'); g.box(LOCK.x0 - 0.02, 0, LOCK.z0 + 1.0, LOCK.x0 + 0.02, 0.006, LOCK.z1 - 1.0, { faces: 'Y' });
  });
  s.solid(LOCK.x0 - 0.05, 0, LOCK.z0 - 0.05, 0, 2.75, LOCK.z0 + 0.05); s.solid(LOCK.x0 - 0.05, 0, LOCK.z1 - 0.05, 0, 2.75, LOCK.z1 + 0.05);
  s.solid(LOCK.x0 - 0.05, 0, LOCK.z0, LOCK.x0 + 0.05, 2.75, LOCK.z0 + 1.0); s.solid(LOCK.x0 - 0.05, 0, LOCK.z1 - 1.0, LOCK.x0 + 0.05, 2.75, LOCK.z1);
  coats(s, LOCK.x0 + 0.4, -0.6, LOCK.z1 - 0.1, -1, ['#f0ece4', '#e6eee8', '#f0ece4', '#ece4e4']);
  s.furniture(() => { g.mat('wood', '#7a5233'); g.box(LOCK.x0 + 0.3, 0.42, LOCK.z0 + 0.15, -0.5, 0.46, LOCK.z0 + 0.5, { bevel: 0.01 }); g.mat('cast', '#3d4a45'); for (const x of [LOCK.x0 + 0.5, -0.8]) g.box(x - 0.03, 0, LOCK.z0 + 0.2, x + 0.03, 0.42, LOCK.z0 + 0.45); });
  sign(s, { kind: 'plate', text: 'THE LOCK', sub: 'crews only past the curtain' }, LOCK.x0 - 0.06, 2.95, (LOCK.z0 + LOCK.z1) / 2, { face: 'x', w: 0.9, h: 0.3 });
  lamp(s, 'panel', -1.7, 2.6, (LOCK.z0 + LOCK.z1) / 2, { w: 1.2, d: 0.5, K: 4600, power: 0.6, clip: lockClip });
  s.interact({ x: -0.7, y: 1.2, z: (LOCK.z0 + LOCK.z1) / 2, radius: 1.3, prompt: 'Push through the curtain', onUse: async (gm) => {
    await say(gm, 'The Lock', [
      'A picker in a pale coat puts a hand flat on your chest, kindly, and shakes their head. Visitors stay on the Glass Walk.',
      'Crews come in here in their own clothes and go through in the Garden\'s: coat, cap and gloves, all washed in the loop at sixty-five degrees. Anything you carried down from the street can carry a blight.',
      'Past the curtain the air is the Greens\' air, thick with carbon dioxide. It is safe for a shift, and the crews come out for a cup every two hours anyway.',
    ]);
  } });
  s.solid(-0.6, 0, LOCK.z0 + 1.0, -0.1, 2.6, LOCK.z1 - 1.0);
  // the belt comes through the hatch and ends at a roller table
  s.furniture(() => {
    g.mat('brushed', '#cfcdc6', { rough: -0.2 }); g.box(BELT_X0 - 2.6, 0.62, STREET.belt - 1.2, BELT_X0, 0.72, STREET.belt + 1.2, { bevel: 0.01 });
    g.mat('cast', '#7a7a72'); for (let x = BELT_X0 - 2.4; x < BELT_X0; x += 0.16) g.tube([[x, 0.74, STREET.belt - 1.15], [x, 0.74, STREET.belt + 1.15]], 0.03, { segs: 6, caps: false });
    g.mat('cast', '#3d4245'); for (const [x, z] of [[BELT_X0 - 2.4, -1], [BELT_X0 - 2.4, 1], [BELT_X0 - 0.2, -1], [BELT_X0 - 0.2, 1]]) g.box(x - 0.03, 0, STREET.belt + z - 0.03, x + 0.03, 0.62, STREET.belt + z + 0.03);
  });
  s.solid(BELT_X0 - 2.6, 0, STREET.belt - 1.2, BELT_X0, 0.75, STREET.belt + 1.2, { surf: 'metal' });
  for (let i = 0; i < 3; i++) prop(s, 'keelgarden.crate', BELT_X0 - 1.8 + i * 0.7, 0.76, STREET.belt + (i % 2 ? 0.4 : -0.3), 0.1 * i, { w: 0.6, d: 0.4, h: 0.3, fill: ['#9fd06a', '#c07a88', '#a6dc7e'][i], leaf: i % 2 ? 'leafB' : 'leafA' });
  // the packing benches either side of the belt, crates on them being filled, packers at them
  const FILL = ['#9fd06a', '#7cc455', '#c07a88', '#a6dc7e', '#6fa878', '#b4e07a'];
  for (const bz of [STREET.belt - 3.2, STREET.belt + 3.2]) {
    for (let k = 0; k < 2; k++) {
      const bx = -11.6 + k * 4.4, face = bz < STREET.belt ? -1 : 1;
      prop(s, 'keelgarden.bench', bx, 0, bz, 0, { w: 3.4 });
      for (let c = 0; c < 3; c++) prop(s, 'keelgarden.crate', bx - 0.85 + c * 0.95, 0.92, bz + r.f(-0.15, 0.15), r.f(-0.08, 0.08), { w: 0.6, d: 0.4, h: 0.3, fill: c === 2 ? undefined : FILL[(k * 3 + c) % FILL.length], leaf: (k + c) % 2 ? 'leafB' : 'leafA', lid: c === 2 || undefined });
      for (const dx of [-0.9, 0.9]) s.spot('work', bx + dx, 0, bz + face * 0.85, face > 0 ? PI : 0, { tags: ['crew', 'pack'] });
    }
  }
  // stacks of lidded crates on pallets, each column labelled for a block, along the back wall and the front
  let k = 0;
  for (let i = 0; i < 5; i++) { crateStack(s, R, -19.6 + i * 3.9, P.z1 - 0.8, PI, k, r); k += 3; }
  for (const cx of [-14.5, -4.8]) { crateStack(s, R, cx, P.z0 + 0.8, 0, k, r); k += 3; }
  for (const p of [[-16, 25.6, 0.4], [-8, 25.4, -0.3], [-15, -1.6, 3.0]]) s.spot('work', p[0], 0, p[1], p[2], { tags: ['porter'] });
  // the crate-labels interact: read one stack's tag
  const S = sends();
  for (let i = 0; i < 5; i += 2) {
    const sx = -19.6 + i * 3.9, kk = i * 3 + 1;
    s.interact({ x: sx, y: 1.0, z: P.z1 - 1.6, radius: 1.4, prompt: 'Read a crate\'s tag', onUse: async (gm) => {
      const b = S[kk % S.length], contents = pickBy([
        'Under the cloth: forty kilos of lettuce, two of chervil, a bundle of chives and a folded note in the cook\'s hand that says thank you for the basil last week.',
        'Under the cloth: chard, cress, a kilo of coriander and a tomato a head, which means somebody in that block is being named tomorrow.',
        'Under the cloth: leaves, leaves and more leaves, and on top, wrapped on its own, a single cucumber with the grower\'s initials on the paper.',
        'Under the cloth: herbs only. Basil, chervil, chives and coriander, a kilo each, which in that hall means a week of green soup.',
      ], kk + i);
      await say(gm, b.name, [
        'A paper tag tied to the slats: ' + b.name.toUpperCase() + ', for ' + b.hall + '. Decks ' + b.decks + '. Cook: ' + b.cook + '.',
        contents,
        'The empty crate is the receipt. It comes back down, is washed, and goes out again. The slats of this one have been mended in three different woods.',
      ]);
    } });
  }
  // the send board on the anti wall, and the clerk's desk under it
  const SB = { kind: 'chalk', title: 'Send board', lines: ['Sends close at midnight', S[0].name + ' · leaves 40 · chervil 2', S[1].name + ' · leaves 36 · basil 3', S[2].name + ' · tomato a head · naming', S[3].name + ' · herbs only', 'Crates up on the night freight', 'Empties back washed, please'] };
  sign(s, SB, P.x0 + 0.17, 2.3, 2.4, { face: 'X', w: 4.6, h: 2.6 });
  prop(s, 'counter', P.x0 + 2.4, 0, 2.4, PI / 2, { w: 2.6, body: '#2f5d5a', top: '#8a6240' }, { noSpots: true });
  s.detail(() => { g.mat('paper', '#efe6d0'); g.box(P.x0 + 2.25, 0.92, 1.7, P.x0 + 2.6, 0.95, 2.1, { bevel: 0.004 }); g.mat('glaze', '#2f6f73'); g.lathe(P.x0 + 2.3, 3.2, [[0, 0.92], [0.04, 0.92], [0.045, 1.0], [0, 1.0]], { segs: 10 }); });
  s.spot('counter', P.x0 + 1.5, 0, 2.4, PI / 2, { tags: ['write'] });
  s.spot('customer', P.x0 + 3.4, 0, 2.6, -PI / 2, { tags: ['send'] });
  s.interact({ x: P.x0 + 3.6, y: 1.4, z: 2.4, radius: 1.8, prompt: 'Read the send board', onUse: async (gm) => {
    await say(gm, 'The send board', [
      'Every hall\'s cook sends down by midnight for the next day\'s greens: so many kilos of leaves, so many bunches of herbs, a tomato a head if a child is being named. Chervil\'s halls each have a cook, and the cook\'s name is on the door.',
      'The crates go up overnight in empty cabs and are on the kitchen pass by six. A cook who forgets to send gets herbs and an apology.',
      'Seconds go up free with every send, for sauce. The Garden would sooner see a split tomato in a pot than in the oxidisers.',
    ]);
  } });
  // the crate wash: the loop's red riser, a deep sink, a rack of clean empties
  s.furniture(() => {
    const x = P.x0 + 0.5, z = 24.5;
    g.mat('cast', C.loop); g.tube([[x, 0, z - 0.6], [x, 1.6, z - 0.6], [x + 0.5, 1.6, z - 0.6]], 0.05, { segs: 8 });
    g.mat('brushed', '#b9b4a8', { rough: -0.2 }); g.box(x, 0.85, z - 1.0, x + 0.9, 0.95, z + 1.0, { bevel: 0.01 }); g.mat('cast', '#3d4245'); g.box(x + 0.05, 0, z - 0.95, x + 0.85, 0.85, z + 0.95);
    g.mat('wood', '#5b4636'); for (const y of [0.3, 0.9, 1.5]) g.box(x, y, z + 1.3, x + 0.7, y + 0.04, z + 3.2);
  });
  s.solid(P.x0 + 0.5, 0, 23.5, P.x0 + 1.4, 0.95, 25.5);
  for (let i = 0; i < 6; i++) prop(s, 'keelgarden.crate', P.x0 + 0.85, 0.34 + Math.floor(i / 3) * 0.6, 26.1 + (i % 3) * 0.62, PI / 2, { w: 0.6, d: 0.4, h: 0.3 });
  s.spot('work', P.x0 + 1.9, 0, 24.5, -PI / 2, { tags: ['wash'] });
  s.spot('work', -6, 0, 6.5, 2.0, { tags: ['sweep'] });
  // two cold rooms in the front wall, where the packed crates wait for the night freight
  for (const cx of [-19.5, -9.5]) {
    s.furniture(() => {
      g.mat('paint', '#d6a640'); g.box(cx - 1.55, 0, P.z0 + 0.15, cx + 1.55, 3.0, P.z0 + 0.32, { faces: 'ZxXY' });
      g.mat('panel', '#e8ecea', { rough: -0.1 }); g.box(cx - 1.35, 0.05, P.z0 + 0.32, cx + 1.35, 2.75, P.z0 + 0.42, { bevel: 0.02 });
      g.mat('brushed', '#9c968a'); g.box(cx - 0.06, 0.05, P.z0 + 0.42, cx + 0.06, 2.75, P.z0 + 0.45); for (const dx of [-0.35, 0.35]) g.box(cx + dx - 0.02, 0.9, P.z0 + 0.45, cx + dx + 0.02, 1.4, P.z0 + 0.52);
      g.mat('plain', '#c8d4d8', { rough: -0.3 }); for (let x = cx - 1.3; x < cx + 1.3; x += 0.13) g.box(x, 0.06, P.z0 + 0.5, x + 0.11, 2.7, P.z0 + 0.52, { faces: 'zZ' });
      g.mat('diffuser', '#7fe08a', { emissive: 2 }); g.box(cx + 1.0, 2.82, P.z0 + 0.32, cx + 1.2, 2.9, P.z0 + 0.35);
    });
    sign(s, { kind: 'plate', text: 'COLD ROOM · 4°', sub: 'leaves wait here for the night freight' }, cx, 3.35, P.z0 + 0.33, { face: 'Z', w: 1.2, h: 0.32 });
  }
  // the send map: the blocks this Garden sends to, high on the back wall where the whole floor can see it
  const MAP = { kind: 'board', title: 'Ring Four · tonight\'s sends', palette: ['#22302c', '#f1e6c9', '#ff7ab8'], lines: [] };
  for (let i = 0; i < 8; i++) MAP.lines.push(S[i * 2].name + '  ·  ' + S[i * 2 + 1].name + '|' + (i < 5 ? 'sent' : i < 7 ? 'packing' : 'open'));
  sign(s, MAP, -12, 7.4, P.z1 - 0.17, { face: 'z', w: 9, h: 3.4, glow: 0.35 });
  lamp(s, 'strip', -16.5, 9.4, P.z1 - 0.6, { to: [-7.5, 9.4, P.z1 - 0.6], K: 3400, power: 0.9, clip });
  // light: big cool panels hung on rods, and the hall's white bounce
  for (const lz of [4.5, 13.6, 22.7]) for (const lx of [-20, -12, -4]) {
    s.deco(() => { g.mat('cast', '#7a7a72'); for (const dx of [-1.2, 1.2]) g.tube([[lx + dx, P.h - 0.6, lz], [lx + dx, 6.6, lz]], 0.012, { segs: 4 }); });
    lamp(s, 'panel', lx, 6.6, lz, { w: 3.0, d: 1.0, K: 5200, power: 1.5, range: 12, glow: 2.2, clip });
  }
  s.ambient({ box: clip, sky: '#eef4ff', ground: '#c4cac8', power: 0.42, soft: 1.2, spec: 0.5, lamp: false });
  s.loop('murmur', -12, 1.5, 13.6, { vol: 0.32, radius: 26, param: 0.35 });
  s.loop('platform', -16, 1, 13.6, { vol: 0.12, radius: 14 });
  // walkways: from the lobby to the benches, the Lock, the Walk, the wash, the board
  s.path([[LOBBY.x1 + 4, 14], [-19.4, 15.6], [-14, 15.4], [-4, 15.4], [-4.3, 20], [-4.3, 25], [-2.5, 25]], { width: 2 });
  s.path([[-19.4, 15.6], [-19.4, 11.8], [-14, 11.8], [-4, 11.8]], { width: 1.6 });
  s.path([[LOBBY.x1 + 4, 14], [-20, 6], [P.x0 + 3.6, 3.4]], { width: 1.6 });
  s.path([[-20, 6], [-12, 1.5], [-4, -2]], { width: 2 });
  s.spot('work', -9.5, 0, P.z0 + 1.3, PI, { tags: ['porter'] });
  s.zoneBox({ id: 'keel-garden-pack', place: 'keel-garden', box: [P.x0, -0.5, P.z0, P.x1, P.h, P.z1], name: 'The Packing Hall', sub: 'The Garden · crates for the halls of Ring Four', ambience: 'station', reverb: 'hall', headroom: P.h, env: { exposure: 1.0, autoKey: 0.2, bloom: 0.045, warmth: -0.08, contrast: 1.04, saturation: 0.96 } });
  s.zoneBox({ id: 'keel-garden-lock', place: 'keel-garden', box: [LOCK.x0, -0.5, LOCK.z0, 0, 2.7, LOCK.z1], name: 'The Lock', sub: 'The Garden · crews only past the curtain', ambience: 'quiet', reverb: 'room', headroom: 2.6 });
}

// A pallet of lidded crates, three columns of three, each column tagged for a block. (x, z): the pallet's centre; yaw:
// the way the tags face (0: +z, PI: -z).
function crateStack(s, R, x, z, yaw, k0, r) {
  const g = s.g, cs = Math.cos(yaw), sn = Math.sin(yaw);
  const at = (lx, lz) => [x + cs * lx + sn * lz, z - sn * lx + cs * lz];
  s.furniture(() => { g.at(x, 0, z, yaw); g.mat('wood', '#8a6d4b', { rough: 0.15 }); for (const lz of [-0.4, 0, 0.4]) g.box(-1.0, 0, lz - 0.05, 1.0, 0.1, lz + 0.05); g.box(-1.0, 0.1, -0.45, 1.0, 0.14, 0.45, { faces: 'yYxXzZ' }); g.pop(); });
  const ties = ['#7a2a26', '#2f5d5a', '#33407a', '#5b4060'];
  const n = 2 + (k0 % 2);
  for (let c = 0; c < 3; c++) for (let h = 0; h < n; h++) {
    const p = at((c - 1) * 0.64, 0);
    prop(s, 'keelgarden.crate', p[0], 0.14 + h * 0.34, p[1], yaw + r.f(-0.03, 0.03), { w: 0.6, d: 0.8, h: 0.3, lid: true, tie: ties[(k0 + c) % ties.length], cloth: CLOTHS[(k0 + c + h) % CLOTHS.length] });
  }
  if (R) s.deco(() => { g.at(x, 0, z, yaw); for (let c = 0; c < 3; c++) crateLabel(g, R, k0 + c, (c - 1) * 0.64, 0.14 + (n - 1) * 0.34 + 0.15, 0.405, 0.46, 0.12); g.pop(); });
  s.solid(Math.min(at(-1, -0.45)[0], at(1, 0.45)[0]), 0, Math.min(at(-1, -0.45)[1], at(1, 0.45)[1]), Math.max(at(-1, -0.45)[0], at(1, 0.45)[0]), 0.14 + n * 0.34, Math.max(at(-1, -0.45)[1], at(1, 0.45)[1]));
}

// ---------------------------------------------------------------------------------------------------------------
// the Tomato House: three rows of vines under red lamps, the case of perfect ones, the seconds, the brush bench
// ---------------------------------------------------------------------------------------------------------------
function roomShell(s, B, o) {
  floor(s, B.x0, B.z0, B.x1, WZ, 0, o.floor[0], o.floor[1], o.floorOpts);
  ceiling(s, B.x0, B.z0, B.x1, WZ, B.h, o.ceil[0], o.ceil[1]);
  const w = { mat: o.wall[0], tint: o.wall[1], dado: o.dado, skirt: o.skirt, t: 0.3 };
  wall(s, B.x0, B.z0, B.x0, WZ, 0, B.h, w); wall(s, B.x1, B.z0, B.x1, WZ, 0, B.h, w); wall(s, B.x0, B.z0, B.x1, B.z0, 0, B.h, w);
}
function tomatoHouse(game, s, f, r) {
  const B = TOMATO, g = s.g, clip = [B.x0 - 0.1, -0.3, B.z0 - 0.1, B.x1 + 0.1, B.h + 0.1, WZ + 0.6];
  const door = B.x0 + 11.5, dw = 2.2;
  roomShell(s, B, { floor: ['tile', '#9a5a40'], floorOpts: { matOpts: { rough: -0.2 } }, ceil: ['panel', '#3a2a34'], wall: ['tile', '#e2d8c8'], dado: { h: 1.0, mat: 'tile', tint: '#2f6f73' }, skirt: '#4a3428' });
  sign(s, { kind: 'fascia', text: 'The Tomato House', sub: 'grower: Ilse Banda · seconds free to the halls', palette: ['#7a2a26', '#f3e6c8', '#d6a640'] }, door + dw / 2, 3.35, GAL.z0 + 0.17, { face: 'Z', w: 3.6, h: 0.62, glow: 0.6 });
  // three rows of vines, each 20 m, under their red lamp bars
  const rows = [-9.2, -12.4, -15.6];
  for (const z of rows) {
    for (const x of [24, 34]) prop(s, 'keelgarden.vine', x, 0, z, 0, { len: 10, ripe: z < -14 ? 0.4 : 0.65 });
    s.structure(() => {
      g.mat('cast', '#3d3238'); g.box(19, 3.82, z - 0.5, 39, 3.86, z + 0.5, { faces: 'yY' }); for (const x of [19.3, 29, 38.7]) g.box(x - 0.02, 3.86, z - 0.02, x + 0.02, B.h, z + 0.02);
      g.mat('diffuser', '#ff3c7a', { emissive: 3.4 }); for (const dz of [-0.42, 0.42]) g.box(19, 3.76, z + dz - 0.05, 39, 3.82, z + dz + 0.05, { faces: 'yzZ' });
    });
    s.light({ at: [19.5, 3.4, z], to: [38.5, 3.4, z], type: 'tube', color: [1.0, 0.22, 0.4], power: 9, range: 6, radius: 0.3, clip });
  }
  // the case: twelve perfect ones, each on a cushion, under its own small lamp, with a name card
  const cx0 = 18.8, cx1 = 24.6, cz = -5.9;
  s.furniture(() => {
    g.mat('wood', '#4a3020', { rough: -0.1 }); g.box(cx0, 0, cz - 0.45, cx1, 0.92, cz + 0.45, { bevel: 0.015 });
    g.mat('wood', '#6b4a2f'); for (let x = cx0 + 0.2; x < cx1 - 0.2; x += 0.95) g.box(x, 0.15, cz + 0.45, x + 0.75, 0.8, cz + 0.47, { bevel: 0.01 });
    g.mat('felt', '#5a2a30'); g.box(cx0 + 0.05, 0.92, cz - 0.4, cx1 - 0.05, 0.94, cz + 0.4, { faces: 'Y' });
    g.mat('cast', C.brass, { rough: -0.2 }); for (const x of [cx0 + 0.02, cx1 - 0.02]) for (const z of [cz - 0.43, cz + 0.43]) g.box(x - 0.015, 0.92, z - 0.015, x + 0.015, 1.22, z + 0.015);
    g.box(cx0, 1.22, cz - 0.45, cx1, 1.24, cz + 0.45, { faces: 'yYzZxX' });
    // the lamp rail over the case, with a tiny lamp over each tomato
    g.mat('cast', '#2c2a28'); g.box(cx0 + 0.1, 1.86, cz - 0.04, cx1 - 0.1, 1.9, cz + 0.04); for (const x of [cx0 + 0.3, cx1 - 0.3]) g.box(x - 0.015, 1.24, cz - 0.015, x + 0.015, 1.86, cz + 0.015);
  });
  s.glass(cx0, 1.22, cz - 0.45, cx1, 1.22, cz + 0.45, { tint: '#f0f4f2', opacity: 0.08 });
  s.glass(cx0, 0.92, cz + 0.45, cx1, 1.22, cz + 0.45, { tint: '#f0f4f2', opacity: 0.08 });
  s.solid(cx0, 0, cz - 0.45, cx1, 1.24, cz + 0.45);
  s.detail(() => {
    for (let i = 0; i < 12; i++) {
      const x = cx0 + 0.35 + (i % 6) * 0.92, z = cz + (i < 6 ? -0.17 : 0.18);
      g.mat('felt', '#efe4c8'); g.ball(x, 0.95, z, 0.09, 0.025, 0.09, { segs: 10, rings: 4 });
      g.mat('glaze', i === 7 ? '#c8401c' : '#d03a20', { rough: -0.4 }); g.ball(x, 1.01, z, 0.052, 0.044, 0.052, { segs: 12, rings: 8 });
      g.mat('leafB', '#5a8a3a'); g.card(x, 1.05, z, 0.07, 0.03, i, { tilt: 0.6 });
      g.mat('paper', '#f3ead6'); g.box(x - 0.04, 0.94, z + 0.08, x + 0.04, 0.975, z + 0.085, { faces: 'Z' });
      g.mat('diffuser', '#fff0d8', { emissive: 4 }); g.box(x - 0.025, 1.84, z - 0.025, x + 0.025, 1.86, z + 0.025, { faces: 'y' });
    }
  });
  for (const x of [cx0 + 1.5, cx1 - 1.5]) s.light({ at: [x, 1.8, cz], type: 'spot', dir: [0, -1, 0], cone: [40, 20], color: [1.0, 0.88, 0.72], power: 3, range: 2.5, radius: 0.05, clip });
  // the seconds: a trestle table of split and lopsided ones, a chalk sign, a lamp
  const sx = 33.2, sz = -5.9;
  prop(s, 'table', sx, 0, sz, 0, { w: 2.6, d: 0.85, wood: '#7a5a3a', legs: 'trestle' });
  for (const dx of [-0.75, 0.05, 0.85]) prop(s, 'keelgarden.crate', sx + dx, 0.74, sz, 0, { w: 0.62, d: 0.45, h: 0.16, wood: '#9a7a50' });
  s.detail(() => {
    for (let i = 0; i < 36; i++) {
      const x = sx - 1.0 + (i % 12) * 0.17 + (i % 3) * 0.02, z = sz - 0.14 + Math.floor(i / 12) * 0.14, rr = 0.032 + ((i * 7) % 5) * 0.006;
      g.mat('glaze', ['#c8321e', '#d84a24', '#b8401a', '#d06030', '#a8a040'][i % 5], { rough: -0.3 }); g.ball(x, 0.83 + rr * 0.6, z, rr * (1 + (i % 4) * 0.12), rr * 0.85, rr, { segs: 7, rings: 5 });
    }
  });
  sign(s, { kind: 'chalk', title: 'Seconds', lines: ['Split, lopsided,', 'too small, too many lobes.', 'They taste the same.', 'Not for sale.', 'Up to the halls for sauce.'] }, sx, 2.2, WZ - 0.01, { face: 'z', w: 1.2, h: 0.9 });
  lamp(s, 'globe', sx, 1.95, sz, { K: 2800, power: 0.7, drop: 1.9, clip });
  // the strawberry rack and the brush bench along the back wall
  const bz = B.z0 + 0.5;
  s.furniture(() => {
    g.mat('wood', '#5b4636');
    for (let k = 0; k < 3; k++) { const y = 0.5 + k * 0.62; g.box(B.x0 + 0.8, y, bz - 0.3, B.x0 + 6.8, y + 0.05, bz + 0.3); }
    for (const x of [B.x0 + 0.85, B.x0 + 3.8, B.x0 + 6.75]) g.box(x - 0.03, 0, bz - 0.3, x + 0.03, 2.2, bz + 0.3);
  });
  s.detail(() => {
    for (let k = 0; k < 3; k++) {
      const y = 0.55 + k * 0.62;
      g.mat('panel', '#3a4440'); g.box(B.x0 + 0.9, y, bz - 0.22, B.x0 + 6.7, y + 0.1, bz + 0.22, { faces: 'yYzZ' });
      g.mat('leafA', '#6aa846', { sway: 0.15 }); g.quad([B.x0 + 0.95, y + 0.1, bz + 0.1], [B.x0 + 6.65, y + 0.1, bz + 0.1], [B.x0 + 6.65, y + 0.36, bz + 0.1], [B.x0 + 0.95, y + 0.36, bz + 0.1], { uv: [k * 0.3, 0.05, 5.7 / 0.24 + k * 0.3, 0.8] });
      for (let i = 0; i < 26; i++) {
        const x = B.x0 + 1.05 + i * 0.22, ripe = (i * 3 + k) % 4;
        if (ripe === 0) { g.mat('paper', '#f8f4ea', { emissive: 0.2 }); g.ball(x, y + 0.3, bz + 0.16, 0.02, 0.02, 0.008, { segs: 6, rings: 3 }); }
        else { g.mat('glaze', ripe === 1 ? '#e8e0b0' : '#d82a3a', { rough: -0.4 }); g.ball(x, y + 0.1 - 0.01, bz + 0.2, 0.017, 0.022, 0.017, { segs: 6, rings: 4 }); }
      }
      g.mat('diffuser', '#ff4a8a', { emissive: 3 }); g.box(B.x0 + 0.95, y + 0.55, bz - 0.05, B.x0 + 6.65, y + 0.58, bz + 0.05, { faces: 'yZ' });
    }
  });
  sign(s, { kind: 'board', title: 'First strawberries', lines: ['Most of the drum\'s|from Tansy by glide', 'First picking of a new bed|to one hall, by the list', 'In the hall|oldest and youngest first', 'Then cut for everyone'], palette: ['#7a2a26', '#f3e6c8', '#d6a640'] }, B.x0 + 3.8, 2.95, B.z0 + 0.17, { face: 'Z', w: 1.6, h: 0.9 });
  s.interact({ x: B.x0 + 3.8, y: 1.4, z: B.z0 + 1.3, radius: 1.5, prompt: 'Read the strawberry board', onUse: async (gm) => {
    await say(gm, 'First strawberries', [
      'Chervil\'s own strawberry racks are small: this one, and a few like it. Most of the drum\'s strawberries come from Tansy by glide.',
      'The first picking of every new bed goes to one hall, by a list that goes round the blocks this Garden sends to. It comes round to a block about once in nine years.',
      'In the hall the first two go to the oldest and the youngest at the table. Then the cook cuts the rest so that everyone has a piece, even if it is a small piece.',
    ]);
  } });
  // the brush bench: soft brushes with coloured threads, a humming wand in its cradle, jars of labels
  const px = B.x0 + 9.4;
  prop(s, 'table', px, 0, bz + 0.1, 0, { w: 2.2, d: 0.7, wood: '#6b4a2f' });
  s.detail(() => {
    g.mat('glaze', '#2f6f73'); g.lathe(px - 0.7, bz + 0.1, [[0, 0.74], [0.06, 0.74], [0.065, 0.88], [0.055, 0.9], [0, 0.9]], { segs: 10 });
    for (let i = 0; i < 6; i++) { const a = i * 1.05; g.mat('wood', '#c9a878'); g.tube([[px - 0.7 + Math.cos(a) * 0.02, 0.8, bz + 0.1 + Math.sin(a) * 0.02], [px - 0.7 + Math.cos(a) * 0.07, 1.0, bz + 0.1 + Math.sin(a) * 0.07]], 0.006, { segs: 4 }); g.mat('knit', ['#d6a640', '#b5532e', '#2f6f73', '#7fe08a', '#5b4060', '#e8e2d2'][i]); g.ball(px - 0.7 + Math.cos(a) * 0.075, 1.02, bz + 0.1 + Math.sin(a) * 0.075, 0.012, 0.022, 0.012, { segs: 5, rings: 3 }); }
    g.mat('cast', '#3a3430'); g.box(px + 0.1, 0.74, bz - 0.05, px + 0.5, 0.78, bz + 0.25, { bevel: 0.01 }); g.mat('paint', '#d6a640'); g.push(); g.move(px + 0.3, 0.8, bz + 0.1); g.rotZ(PI / 2); g.cyl(0, -0.15, 0, 0.018, 0.3, { segs: 8 }); g.pop();
    g.mat('paper', '#efe6d0'); g.box(px + 0.6, 0.74, bz - 0.1, px + 0.95, 0.76, bz + 0.15, { bevel: 0.004 });
  });
  lamp(s, 'strip', px - 0.9, 1.9, bz + 0.25, { to: [px + 0.9, 1.9, bz + 0.25], K: 4200, power: 0.7, clip });
  s.interact({ x: px, y: 1.0, z: bz + 0.9, radius: 1.4, prompt: 'Try the brush bench', onUse: async (gm) => {
    await say(gm, 'The brush bench', [
      'A jar of soft brushes, each with a coloured thread round the handle so its owner can find it, and a small humming wand in a cradle.',
      'There are no bees in Chervil, and no insect of any kind, so every strawberry flower in the Garden is brushed by hand, flower to flower, and every tomato truss is shaken with the wand, because a tomato flower wants shaking rather than brushing.',
      'A good pollinator does about four hundred flowers an hour and hums while doing it.',
    ]);
    toast(gm, 'You brush one strawberry flower. Yellow dust on the brush. Somebody will eat that in about a month.');
  } });
  // the case's interact: look, and buy one
  s.interact({ x: (cx0 + cx1) / 2, y: 1.1, z: cz + 1.0, radius: 1.6, prompt: 'Look at the tomatoes in the case', onUse: async (gm) => {
    await say(gm, 'The case', [
      'Twelve tomatoes on twelve cushions, each under its own small lamp, each with a card. The cards have names on them: Ada, Pim, Old Ned, Little Ruth. The grower names them. The shops take the names off.',
      'A tomato is about a hundred and twenty grams and half a kay, and nearly all of that is light. In Chervil it is the nearest thing to jewellery that grows.',
    ]);
    if (!gm.ui || !gm.ui.choose) return;
    let pick = null; gm.busy++;
    try { pick = await gm.ui.choose('The grower', 'One for half a kay, wrapped in a cloth.', [{ label: 'Buy one (0.5)', value: 'buy' }, { label: 'Not today', value: 'no' }]); } finally { gm.busy--; }
    if (pick !== 'buy') return;
    if (gm.wallet && gm.wallet.spend && gm.wallet.spend(0.5, 'A tomato')) {
      if (gm.inv && gm.inv.give) gm.inv.give('tomato');
      sfx(gm, 'coin', f, (cx0 + cx1) / 2, 1, cz);
      await say(gm, 'The grower', ['That is Pim. Cut it into as many pieces as there are people, and eat yours slowly.']);
    } else await say(gm, 'The grower', ['Short of a kay. Have a second instead: there is a bowl by the door, and nobody counts.']);
  } });
  s.interact({ x: sx, y: 1.0, z: sz + 0.9, radius: 1.5, prompt: 'Look at the seconds', onUse: async (gm) => {
    await say(gm, 'Seconds', [
      'SECONDS. Split, lopsided, too small, too many lobes. They taste the same.',
      'Seconds are not sold. They go up to the halls free in the morning crates, for sauce, and a hall that sends for a tomato a head on a naming day gets a crate of these as well.',
    ]);
    toast(gm, 'You take one from the bowl by the door. It has a crack down one side and is still warm from the lamps.');
  } });
  // people: the grower at the case, pickers in the rows, a pollinator at the bench, customers at the case
  s.spot('counter', (cx0 + cx1) / 2, 0, cz - 0.95, 0, { tags: ['stall', 'grower'] });
  for (let i = 0; i < 2; i++) s.spot('customer', cx0 + 1.6 + i * 2.4, 0, cz + 0.95, PI, { tags: ['tomato'] });
  s.spot('browse', sx + 0.4, 0, sz + 0.8, PI, { tags: ['seconds'] });
  for (const z of rows) for (const x of [21, 31 + r.f(-2, 2)]) s.spot('work', x, 0, z + (z === rows[1] ? 0.85 : -0.85), z === rows[1] ? PI : 0, { tags: ['crew', 'pick'] });
  s.spot('work', px, 0, bz + 0.75, PI, { tags: ['crew', 'brush'] });
  s.spot('work', B.x0 + 3.4, 0, bz + 0.85, PI, { tags: ['crew', 'brush'] });
  s.path([[door + dw / 2, -2], [door + dw / 2, -5], [door + dw / 2, -7.6], [20, -7.6]], { width: 1.4 });
  s.path([[door + dw / 2, -7.6], [39.5, -7.6], [39.5, -17.4], [20, -17.4]], { width: 1.1 });
  lamp(s, 'globe', door + dw / 2, 3.2, -5.4, { K: 2900, power: 0.5, drop: 1.0, clip });
  s.ambient({ box: clip, sky: '#ff6a8c', ground: '#7a3030', power: 0.36, soft: 1.2, spec: 0.4, lamp: false });
  s.loop('hum-lamp', 29, 3.6, -12.4, { vol: 0.12, radius: 10 });
  s.zoneBox({ id: 'keel-garden-tomato', place: 'keel-garden', box: [B.x0, -0.5, B.z0, B.x1, B.h, WZ], name: 'The Tomato House', sub: 'The Garden · grower: Ilse Banda', ambience: 'shop', reverb: 'room', headroom: B.h, env: { exposure: 1.0, autoKey: 0.17, bloom: 0.07, warmth: 0.06, contrast: 1.08, saturation: 1.1 } });
}

// ---------------------------------------------------------------------------------------------------------------
// the Tea Rows: bushes clipped flat at the plucking table, a felt ceiling, the tasting bench and its kettle
// ---------------------------------------------------------------------------------------------------------------
function teaRows(game, s, f, r) {
  const B = TEA, g = s.g, clip = [B.x0 - 0.1, -0.3, B.z0 - 0.1, B.x1 + 0.1, B.h + 0.1, WZ + 0.6];
  const door = B.x0 + 5, dw = 1.8;
  roomShell(s, B, { floor: ['planks', '#7a5a3a'], ceil: ['felt', '#3a3440'], wall: ['plaster', '#d8c8a8'], dado: { h: 1.0, mat: 'wood', tint: '#5b4636' }, skirt: '#3a2a20' });
  sign(s, { kind: 'fascia', text: 'The Tea Rows', sub: 'two leaves and a bud · the tasting bench', palette: ['#2f5d5a', '#f1e6c9', '#c9962e'] }, door + dw / 2, 3.2, GAL.z0 + 0.17, { face: 'Z', w: 3.2, h: 0.58, glow: 0.6 });
  const rows = [-10.2, -13.2, -16.2];
  for (const z of rows) {
    prop(s, 'keelgarden.tea', 74.5, 0, z, 0, { len: 16 });
    s.structure(() => {
      g.mat('cast', '#3a3430'); g.box(66.4, 2.5, z - 0.08, 82.6, 2.54, z + 0.08); for (const x of [67, 74.5, 82]) g.box(x - 0.015, 2.54, z - 0.015, x + 0.015, B.h, z + 0.015);
      g.mat('diffuser', '#ffb0d8', { emissive: 3 }); g.box(66.4, 2.44, z - 0.06, 82.6, 2.5, z + 0.06, { faces: 'yzZ' });
    });
    s.light({ at: [66.6, 2.3, z], to: [82.4, 2.3, z], type: 'tube', color: [1.0, 0.62, 0.82], power: 6, range: 4.5, radius: 0.15, clip });
  }
  // the tasting bench along the front, stools on the door side, and the kettle station on the anti wall
  const bz = -6.6, bx0 = 64, bx1 = 73;
  s.furniture(() => {
    g.mat('wood', '#6b4a2f', { rough: -0.1 }); g.box(bx0, 0.9, bz - 0.35, bx1, 0.95, bz + 0.35, { bevel: 0.012 });
    g.mat('wood', '#4a3424'); g.box(bx0 + 0.05, 0, bz - 0.3, bx1 - 0.05, 0.9, bz - 0.2); for (const x of [bx0 + 0.1, (bx0 + bx1) / 2, bx1 - 0.1]) g.box(x - 0.05, 0, bz - 0.3, x + 0.05, 0.9, bz + 0.3);
  });
  s.solid(bx0, 0, bz - 0.35, bx1, 0.95, bz + 0.35);
  const LIDS = ['#2f6f73', '#b5532e', '#c9962e', '#e9e1cf', '#5b4060'];
  for (let i = 0; i < 8; i++) {
    const x = bx0 + 0.6 + i * 1.1;
    prop(s, 'stool', x, 0, bz + 0.85, 0, { wood: '#7a5a3a', h: 0.66 }, { spot: { tags: ['eat', 'notes', 'tea'] } });
    prop(s, 'cup', x - 0.1, 0.95, bz + 0.12, 0, { glaze: '#e9e1cf', lid: LIDS[i % LIDS.length] });
    if (i % 2 === 0) prop(s, 'bowl', x + 0.25, 0.95, bz - 0.05, 0, { glaze: '#d9cfb8', open: true, food: '#4a5a2a', r: 0.06 });
  }
  s.detail(() => {
    for (const x of [bx0 + 1.6, bx0 + 4.9, bx0 + 7.6]) { g.mat('glaze', '#2f6f73', { rough: -0.3 }); g.lathe(x, bz - 0.15, [[0, 0.95], [0.07, 0.95], [0.1, 1.02], [0.09, 1.1], [0.05, 1.13], [0, 1.13]], { segs: 12 }); g.tube([[x + 0.08, 1.04, bz - 0.15], [x + 0.17, 1.12, bz - 0.15]], 0.012, { segs: 4 }); }
    g.mat('paper', '#efe6d0'); g.box(bx1 - 0.9, 0.95, bz - 0.25, bx1 - 0.5, 0.97, bz + 0.05, { bevel: 0.004 });
  });
  for (const x of [bx0 + 2.4, bx0 + 6.6]) lamp(s, 'globe', x, 2.1, bz, { K: 2700, power: 0.7, drop: 1.7, clip });
  const kx = B.x0 + 0.5, kz = -7.4;
  s.furniture(() => {
    g.mat('cast', C.loop, { rough: -0.05 }); g.tube([[kx, 0, kz - 0.3], [kx, 1.3, kz - 0.3], [kx + 0.3, 1.3, kz - 0.3]], 0.05, { segs: 8 });
    g.mat('cast', C.brass, { rough: -0.2 }); g.tube([[kx + 0.3, 1.3, kz - 0.3], [kx + 0.38, 1.24, kz - 0.3], [kx + 0.38, 1.16, kz - 0.3]], 0.02, { segs: 6 });
    g.mat('wood', '#5b4636'); g.box(kx, 0, kz - 0.6, kx + 0.7, 0.9, kz + 0.6, { bevel: 0.012 });
    g.mat('cast', '#2c2a28'); g.cyl(kx + 0.38, 0.9, kz + 0.2, 0.13, 0.03, { segs: 14 });
    g.mat('cast', '#b9b4a8', { rough: -0.25 }); g.lathe(kx + 0.38, kz + 0.2, [[0, 0.93], [0.1, 0.93], [0.11, 1.1], [0.08, 1.16], [0, 1.17]], { segs: 12 }); g.tube([[kx + 0.48, 1.0, kz + 0.2], [kx + 0.58, 1.1, kz + 0.2]], 0.012, { segs: 4 });
    g.mat('glaze', '#e9e1cf'); g.lathe(kx + 0.35, kz - 0.25, [[0, 0.9], [0.08, 0.9], [0.1, 1.0], [0.07, 1.06], [0, 1.07]], { segs: 12 });
  });
  s.solid(kx, 0, kz - 0.6, kx + 0.7, 0.9, kz + 0.6);
  sign(s, { kind: 'label', text: 'LOOP · 65°' }, kx + 0.05, 1.6, kz - 0.3, { face: 'X', w: 0.36, h: 0.12 });
  s.interact({ x: (bx0 + bx1) / 2, y: 1.0, z: bz + 1.0, radius: 2.4, prompt: 'Sit at the tasting bench', onUse: async (gm) => {
    if (gm.player && gm.player.sit) gm.player.sit({ x: bx0 + 3.9, y: 0.66, z: bz + 0.85, yaw: 0 });
    await say(gm, 'The tasting bench', [
      'The taster pours from a pot that never left the loop: sixty-five degrees, which is about right for a green leaf and wrong for nearly everything else.',
      'Two leaves and a bud, plucked by hand. A cup of Garden tea is the dearest thing most people in Chervil drink in an ordinary week, and a taster\'s cup is free.',
      'It tastes of cut grass and something sweeter under it. The lid goes back on between sips: heliox would have it cold in a minute.',
    ]);
    if (gm.player && gm.player.stand) gm.player.stand();
  } });
  s.interact({ x: kx + 1.0, y: 1.2, z: kz, radius: 1.3, prompt: 'Look at the kettle', onUse: async (gm) => {
    await say(gm, 'The kettle on the loop', [
      'The water comes out of the red riser at sixty-five degrees, from the vats\' waste heat. Taking a litre the rest of the way to the boil costs about four hundredths of a kay, so the kettle only finishes what the loop started.',
      'The tasters keep two pots: one straight from the loop for the green, one boiled for the black. They argue about which is the real test, and have for some years.',
    ]);
  } });
  s.interact({ x: 70.5, y: 0.9, z: rows[0] + 0.9, radius: 1.5, prompt: 'Look at the bushes', onUse: async (gm) => {
    await say(gm, 'The Tea Rows', [
      'Real tea bushes, kept clipped flat at waist height so the new growth comes up where hands can reach it. Each one is older than most of the people who pick it.',
      'They are plucked by hand, two leaves and a bud at a time, every few days, under lamps a little warmer and whiter than the Greens\' because the pluckers stand under them all shift.',
    ]);
  } });
  s.spot('counter', (bx0 + bx1) / 2, 0, bz - 0.85, 0, { tags: ['stall', 'tea'] });
  s.spot('work', kx + 1.0, 0, kz + 0.5, -PI / 2, { tags: ['cook', 'tea'] });
  for (const z of rows) for (const x of [68 + r.f(0, 3), 77 + r.f(0, 3)]) s.spot('work', x, 0, z + 0.75, PI, { tags: ['crew', 'pick'] });
  s.path([[door + dw / 2, -2], [door + dw / 2, -5.4], [74.5, -5.4]], { width: 1.4 });
  s.path([[door + dw / 2, -5.4], [door + dw / 2, -8.7], [83, -8.7]], { width: 1.1 });
  s.ambient({ box: clip, sky: '#ffb8d0', ground: '#7a5040', power: 0.3, soft: 1.2, spec: 0.4, lamp: false });
  s.zoneBox({ id: 'keel-garden-tea', place: 'keel-garden', box: [B.x0, -0.5, B.z0, B.x1, B.h, WZ], name: 'The Tea Rows', sub: 'The Garden · two leaves and a bud', ambience: 'quiet', reverb: 'felt', headroom: B.h, env: { exposure: 1.0, autoKey: 0.16, bloom: 0.06, warmth: 0.05, contrast: 1.06, saturation: 1.05 } });
}

// ---------------------------------------------------------------------------------------------------------------
// the Cool Rooms: cool, wet and nearly dark; racks of pressed logs with oyster mushrooms on them, one hand lamp
// ---------------------------------------------------------------------------------------------------------------
function coolRooms(game, s, f, r) {
  const B = COOL, g = s.g, clip = [B.x0 - 0.1, -0.3, B.z0 - 0.1, B.x1 + 0.1, B.h + 0.1, WZ + 0.6];
  const door = B.x0 + 3, dw = 1.4;
  roomShell(s, B, { floor: ['concrete', '#3e3c38'], floorOpts: { matOpts: { rough: -0.45 } }, ceil: ['concrete', '#2a2a28'], wall: ['block', '#5a5a52'], skirt: false });
  sign(s, { kind: 'plate', text: 'THE COOL ROOMS', sub: 'keep the curtain closed' }, door + dw / 2, 2.6, GAL.z0 + 0.17, { face: 'Z', w: 1.2, h: 0.36 });
  // a strip curtain in the door
  s.detail(() => { g.mat('plain', '#9aa4a8', { rough: -0.3 }); for (let x = door + 0.02; x < door + dw - 0.02; x += 0.13) g.box(x, 0.04, WZ - 0.02, x + 0.11, 2.2, WZ + 0.02, { faces: 'zZ' }); });
  const rows = [-7.6, -11.0, -14.4];
  for (const z of rows) for (let i = 0; i < 4; i++) prop(s, 'keelgarden.logs', B.x0 + 5.2 + i * 2.9, 0, z, 0, { n: 4, w: 2.4 });
  // drips and puddles: a darker wet patch under each row, a gutter along the back
  s.structure(() => { g.mat('concrete', '#2c2a26', { rough: -0.6 }); for (const z of rows) g.box(B.x0 + 3, 0, z - 0.6, B.x1 - 1, 0.003, z + 0.7, { faces: 'Y' }); g.mat('cast', '#2c3133'); g.box(B.x0 + 0.2, 0, B.z0 + 0.15, B.x1 - 0.2, 0.004, B.z0 + 0.35, { faces: 'Y' }); });
  // the hand lamp, on a hook on the post at the middle of the room
  const hx = B.x0 + 9.9, hz = -9.3;
  s.furniture(() => {
    g.mat('cast', '#3a3430'); g.box(hx - 0.05, 0, hz - 0.05, hx + 0.05, B.h, hz + 0.05); g.tube([[hx, 2.05, hz], [hx + 0.2, 2.05, hz], [hx + 0.2, 1.98, hz]], 0.008, { segs: 4 });
    g.mat('cast', '#8a6d3b'); g.cyl(hx + 0.2, 1.66, hz, 0.06, 0.04, { segs: 10 }); g.cyl(hx + 0.2, 1.88, hz, 0.05, 0.04, { segs: 10 }); g.tube([[hx + 0.15, 1.92, hz], [hx + 0.2, 1.99, hz], [hx + 0.25, 1.92, hz]], 0.006, { segs: 4 });
    g.mat('diffuser', '#ffc070', { emissive: 4 }); g.cyl(hx + 0.2, 1.7, hz, 0.045, 0.18, { segs: 10 });
  });
  s.light({ at: [hx + 0.2, 1.75, hz], color: [1.0, 0.68, 0.36], power: 3.2, range: 7, radius: 0.05, shadow: true, clip });
  s.light({ at: [door + dw / 2, 2.4, WZ - 0.4], color: [0.4, 0.8, 0.7], power: 0.25, range: 2.5, radius: 0.04, clip });
  s.glowCard(hx + 0.2, 1.75, hz + 0.05, { face: 'Z', color: '#ffb060', size: 0.7, strength: 0.25, follow: 'always' });
  s.interact({ x: hx + 0.6, y: 1.5, z: hz + 0.4, radius: 1.3, prompt: 'Look at the hand lamp', onUse: async (gm) => {
    await say(gm, 'The hand lamp', [
      'The only lamp in the Cool Rooms, on a hook, for whoever is picking. Mushrooms want no light at all. What they want is cool, wet air, and for you to stop opening the curtain.',
      'A picker takes it down, carries it along a row, and hangs it back up here when they go. If it is not on its hook, somebody is in the rows: speak before you walk.',
    ]);
  } });
  s.interact({ x: B.x0 + 5.9, y: 1.0, z: rows[0] + 0.95, radius: 1.4, prompt: 'Read a log\'s tag', onUse: async (gm) => {
    await say(gm, 'A paper tag on a log', [
      'These are not wood. Each log is pressed from what the Garden and the Vats leave over: rack stalks, spent mycelium from the steak lines, and the coffee grounds from Ring Four\'s ring counters.',
      'Oyster caps come in about three weeks: two flushes a log, sometimes three, and then the log goes to the oxidisers with everything else, and comes back as water, gas and salt.',
      'The halls get them in the morning crates, and the cooks fight over the big ones.',
    ]);
  } });
  s.spot('work', hx + 1.2, 0, hz - 0.8, -PI / 2, { tags: ['crew', 'pick'] });
  s.spot('work', B.x0 + 13.4, 0, rows[2] + 0.85, PI, { tags: ['notes'] });
  s.path([[door + dw / 2, -2], [door + dw / 2, -5.4], [B.x0 + 16, -5.4]], { width: 1.1 });
  s.loop('water-lap', B.x0 + 10, 0.5, -11, { vol: 0.08, radius: 9 });
  s.ambient({ box: clip, sky: '#5a6a66', ground: '#262a28', power: 0.14, soft: 1.0, spec: 0.7, lamp: false });
  s.zoneBox({ id: 'keel-garden-cool', place: 'keel-garden', box: [B.x0, -0.5, B.z0, B.x1, B.h, WZ], name: 'The Cool Rooms', sub: 'The Garden · mushrooms, in the dark', ambience: 'quiet', reverb: 'tile', headroom: B.h, env: { exposure: 1.0, autoKey: 0.11, bloom: 0.06, warmth: 0.04, contrast: 1.1, saturation: 0.9 } });
}

// ---------------------------------------------------------------------------------------------------------------
// the Green Tanks: algae in tall glass columns, lit from inside
// ---------------------------------------------------------------------------------------------------------------
function greenTanks(game, s, f, r) {
  const B = TANKS, g = s.g, clip = [B.x0 - 0.1, -0.3, B.z0 - 0.1, B.x1 + 0.1, B.h + 0.1, WZ + 0.6];
  const door = B.x0 + 4, dw = 2.4;
  roomShell(s, B, { floor: ['tile', '#9aa8a4'], floorOpts: { matOpts: { rough: -0.4 } }, ceil: ['panel', '#1e2a2a'], wall: ['tile', '#7f9890'], dado: { h: 1.2, mat: 'tile', tint: '#2f5d5a' }, skirt: false });
  sign(s, { kind: 'fascia', text: 'The Green Tanks', sub: 'algae · lit from inside', palette: ['#1e3a36', '#d8f4ea', '#3fd0b0'] }, door + dw / 2, 3.6, GAL.z0 + 0.17, { face: 'Z', w: 3.2, h: 0.58, glow: 0.8 });
  const xs = [141, 144.6, 148.2, 151.8, 155.4], zs = [-8.2, -11.8, -15.4], cols = ['#2fb890', '#34b078', '#40c498', '#2aa8a0'];
  for (let j = 0; j < zs.length; j++) for (let i = 0; i < xs.length; i++) prop(s, 'keelgarden.tank', xs[i], 0, zs[j], (i + j) * 0.7, { h: 4.6, col: cols[(i + j * 2) % cols.length] });
  // the manifold over each row and the drops to the tanks
  s.structure(() => {
    for (const z of zs) {
      g.mat('cast', C.water); g.tube([[B.x0 + 6, 5.6, z], [B.x1 - 1, 5.6, z]], 0.07, { segs: 8, caps: false });
      g.mat('brushed', '#b9b4a8'); g.tube([[B.x0 + 6, 5.85, z + 0.3], [B.x1 - 1, 5.85, z + 0.3]], 0.05, { segs: 6, caps: false });
      g.mat('cast', '#2c3133'); for (const x of xs) g.box(x - 0.02, 5.6, z - 0.02, x + 0.02, B.h, z + 0.02);
    }
  });
  for (const [x, z] of [[142.8, -10], [150, -10], [142.8, -13.6], [150, -13.6], [157.4, -11.8]]) s.light({ at: [x, 2.4, z], color: [0.28, 0.95, 0.78], power: 5, range: 6, radius: 0.3, clip });
  // the sample desk: jars of green on a rack, a notebook, a lamp
  const dx = B.x0 + 1.2, dz = B.z0 + 2.4;
  prop(s, 'table', dx + 0.4, 0, dz, PI / 2, { w: 2.0, d: 0.8, wood: '#5b4636' });
  s.detail(() => { for (let i = 0; i < 10; i++) { g.mat('diffuser', ['#3fd0b0', '#58c890', '#2f9a80'][i % 3], { emissive: 1.2 }); g.cyl(dx + 0.25 + (i % 2) * 0.22, 0.74, dz - 0.8 + Math.floor(i / 2) * 0.32, 0.045, 0.16, { segs: 8 }); } g.mat('paper', '#efe6d0'); g.box(dx + 0.5, 0.74, dz + 0.2, dx + 0.8, 0.76, dz + 0.6, { bevel: 0.004 }); });
  lamp(s, 'globe', dx + 0.5, 1.8, dz, { K: 3600, power: 0.5, drop: 4.2, clip });
  sign(s, { kind: 'board', title: 'Green Tanks', lines: ['Fifteen columns|of algae', 'Lit from inside,|bubbled with the Greens\' air', 'A quarter drawn off|every day', 'Out: greens, oils,|the blue-green of sweets'], palette: ['#1e3a36', '#d8f4ea', '#3fd0b0'] }, B.x0 + 0.17, 1.8, dz, { face: 'X', w: 1.4, h: 0.9 });
  s.interact({ x: dx + 1.2, y: 1.2, z: dz, radius: 1.6, prompt: 'Read the tank board', onUse: async (gm) => {
    await say(gm, 'The Green Tanks', [
      'Fifteen glass columns of algae, each lit from inside by strings of lamps, and bubbled from below with air drawn off the Greens, carbon dioxide and all.',
      'A quarter of every tank is drawn off each day and made up with water and salts. What comes out goes to the Vats\' kitchens as green paste, as oil, and as the blue-green that colours the halls\' sweets.',
      'It is the only room in the Garden where nothing has a leaf.',
    ]);
  } });
  s.spot('work', dx + 1.2, 0, dz, -PI / 2, { tags: ['write', 'notes'] });
  s.spot('work', 146.4, 0, -10.0, PI, { tags: ['crew', 'notes'] });
  s.spot('work', 153.6, 0, -13.6, 0, { tags: ['crew'] });
  s.path([[door + dw / 2, -2], [door + dw / 2, -6.2], [158, -6.2]], { width: 1.4 });
  s.path([[door + dw / 2, -6.2], [dx + 1.2, -6.2], [dx + 1.2, dz]], { width: 1.1 });
  s.loop('fountain', 148, 1.5, -11.8, { vol: 0.1, radius: 12 });
  s.ambient({ box: clip, sky: '#3fd0b0', ground: '#1a3a34', power: 0.14, soft: 1.2, spec: 0.6, lamp: false });
  s.zoneBox({ id: 'keel-garden-tanks', place: 'keel-garden', box: [B.x0, -0.5, B.z0, B.x1, B.h, WZ], name: 'The Green Tanks', sub: 'The Garden · algae, lit from inside', ambience: 'quiet', reverb: 'tile', headroom: B.h, env: { exposure: 1.0, autoKey: 0.12, bloom: 0.1, warmth: -0.08, contrast: 1.08, saturation: 1.08 } });
}
