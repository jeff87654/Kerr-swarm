// The back axle: where all of Chervil's heat leaves. About 160 GW goes out here as a river of two-phase ammonia, through a
// rotary joint into the part of the raft that does not turn. It is the loudest place in the drum.
//
// Frame 'axle-back': 60 m from the axis, inside the back cap, about a fiftieth of a g. Flat x is an angle round the axis
// (x / 60 radians), flat y is height toward it (the axis is at y = 60). So the heat hall is a real cylinder: its floor at
// y = 0 runs all the way round and meets itself overhead, and anything round the axis (the joint, the bearing, the still
// collar, the slow ring) is a box that spans every x. The mains are modelled in true space and bent back (trueToFlat).
//
// In the order of a visit, along +z:
//   the lift lobby (z 0..9) · the ear room, defenders on hooks (9..15) · the heat hall (15..64), crossed by a glazed
//   gallery with the gauge wall and the watch desk · a short passage through the back wall · the slow ring (64..70): an
//   annulus you step onto, which lets go of the drum's turn so that you can leave it. Its far wall is the still side,
//   and from in here you can see it turning (or rather, you can see that you are).
import { floor, ceiling, wall, lamp, block, roomGlow, warm } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign, signRect } from '../world/signs.js';
import { door } from '../world/doors.js';
import { DRUM } from '../core/drum.js';
import { Rng, smoothstep, clamp } from '../core/util.js';
import { PI, say, toast, sfx, seat, handLine, movingMesh, polar, polarFlat, inTrue, innerBox } from './lm_axle_back_parts.js';

const RHO = 60;
const C = 2 * PI * RHO;                 // flat x once round
const XR = C / 2 + 0.01;                // a box from -XR to XR goes all the way round
const V = RHO * DRUM.OMEGA;             // flat x a second: how fast the still side seems to turn at the floor's radius
const WATCH = { name: 'Odile, on watch', colour: '#d6a640' };
const RINGKEEP = { name: 'Bram, ring crew', colour: '#3fe0d0' };
const ENV_HALL = { exposure: 1.0, autoKey: 0.17, autoMin: 0.4, autoMax: 2.4, bloom: 0.06, contrast: 1.12, saturation: 1.12, warmth: 0.32, vignette: 0.3 };
const ENV_RING = { exposure: 1.0, autoKey: 0.17, autoMin: 0.4, autoMax: 2.4, bloom: 0.05, contrast: 1.1, saturation: 1.08, warmth: 0.2, vignette: 0.3 };

export const place = {
  id: 'lm-axle-back', name: 'The back axle', order: 10,
  region: 'axle-back',
  stops: [{ id: 'axle-back', name: 'The back axle', sub: 'the heat hall · the slow ring · the Window', group: 'The axles', spawn: 'axle-back', deck: 376, zd: 3750 }],
  async build(game) {
    const W = game.world;
    const f = W.frame('axle-back', RHO, 0, 3760);
    const s = W.scope('lm-axle-back', f);
    const relend = () => { if (game.atlas && game.atlas.begin) game.atlas.begin('region:axle-back'); };
    const tick = async () => { await new Promise(requestAnimationFrame); relend(); };
    const st = { ears: false, loops: [], ride: null };

    buildLobby(game, s, f);
    buildEarRoom(game, s, f, st);
    await tick();
    buildHall(game, s, f, st);
    await tick();
    buildGallery(game, s, f, st);
    await tick();
    buildRing(game, s, f, st);
    await tick();

    // the journal's flag: the first time the player stands in the heat hall
    const offHeard = game.events.on('zone', (e) => {
      const z = e && e.zone; if (!z || (z.id !== 'axle-hall' && z.id !== 'axle-gallery') || game.flags.heard_axle) return;
      game.flags.heard_axle = true;
      if (game.story && game.story.persist) game.story.persist();
      game.events.emit('axle:heard');
    });
    s.onDispose(offHeard);

    // ear defenders: the hall's loops drop to a pressure in the chest while you wear them
    let lastEars = null;
    s.every(() => {
      if (st.ears === lastEars) return; lastEars = st.ears;
      for (const q of st.loops) { try { q.h.set({ vol: q.vol * (st.ears ? 0.28 : 1) }); } catch (e) { /* gone */ } }
    });

    s.finish();
    game.spawns['axle-back'] = { frame: f, x: 0, y: 0, z: 2.2, yaw: PI };
    game.spawns['axle-hall'] = { frame: f, x: 0.6, y: 0, z: 24, yaw: PI };
    game.spawns['axle-ring'] = { frame: f, x: 0, y: 0, z: 66.4, yaw: 0 };
  },
};

// A loop of the hall's, remembered so the defenders can turn it down.
function hallLoop(s, st, name, x, y, z, vol, radius) { const h = s.loop(name, x, y, z, { vol, radius }); st.loops.push({ h, vol }); return h; }

// ===============================================================================================================
// The lift lobby: two berths, a bench, the board that says where you are.
// ===============================================================================================================
function buildLobby(game, s, f) {
  const g = s.g, X0 = -5, X1 = 5, Z0 = 0, Z1 = 9, H = 3.2;
  const clip = [X0 - 0.1, -0.3, Z0 - 0.1, X1 + 0.1, H + 0.1, Z1 + 0.1];
  floor(s, X0, Z0, X1, Z1, 0, 'terrazzo', '#b9ab92');
  g.mat('terrazzo', '#7a2f3c'); g.box(-1.4, 0, 0.6, 1.4, 0.006, Z1, { faces: 'Y' }); s.flush({ tier: 'd', cast: false });
  ceiling(s, X0, Z0, X1, Z1, H, 'panel', '#d9cfbc');
  const wallO = { tint: '#e2d4b8', mat: 'plaster', dado: { h: 1.15, mat: 'panel', tint: '#2f5d5a' }, skirt: '#2a2420' };
  wall(s, X0, Z0 + 0.08, X1, Z0 + 0.08, 0, H, wallO);
  wall(s, X0 + 0.08, Z0, X0 + 0.08, Z1, 0, H, wallO);
  wall(s, X1 - 0.08, Z0, X1 - 0.08, Z1, 0, H, wallO);
  wall(s, X0, Z1 - 0.08, X1, Z1 - 0.08, 0, H, Object.assign({}, wallO, { openings: [{ at: 3.9, w: 2.2, h: 2.4 }] }));
  roomGlow(s, X0, 0, Z0, X1, H, Z1, { sky: '#ffdcae', ground: '#a8794f', power: 0.3 });
  lamp(s, 'panel', 0, H, 2.6, { w: 1.6, d: 0.5, K: 3200, power: 0.9, clip });
  lamp(s, 'panel', 0, H, 6.6, { w: 1.6, d: 0.5, K: 3200, power: 0.9, clip });
  // two berths in the front wall: brass doors in stone frames, a lit indicator and a call plate
  for (const bx of [-2.3, 2.3]) {
    const bw = 1.3;
    g.mat('stone', '#9c8f7c'); g.box(bx - bw / 2 - 0.18, 0, 0.16, bx + bw / 2 + 0.18, 2.6, 0.3, { faces: 'xXZY' });
    g.mat('cast', '#b08a45', { rough: -0.1 }); g.box(bx - bw / 2, 0.02, 0.3, bx - 0.01, 2.36, 0.34); g.box(bx + 0.01, 0.02, 0.3, bx + bw / 2, 2.36, 0.34);
    g.mat('cast', '#8a6d3b'); for (const yy of [0.5, 1.2, 1.9]) g.box(bx - bw / 2 + 0.06, yy, 0.34, bx + bw / 2 - 0.06, yy + 0.03, 0.355);
    g.mat('diffuser', '#ffd9a0', { emissive: 3, lamp: true }); g.box(bx - 0.2, 2.44, 0.3, bx + 0.2, 2.52, 0.32);
    g.mat('cast', '#3a3430'); g.box(bx + bw / 2 + 0.25, 1.05, 0.16, bx + bw / 2 + 0.4, 1.3, 0.22, { bevel: 0.01 });
    g.mat('diffuser', '#3fe0d0', { emissive: 2 }); g.box(bx + bw / 2 + 0.3, 1.13, 0.22, bx + bw / 2 + 0.35, 1.18, 0.23);
    s.flush({ tier: 's' });
  }
  s.interact({ x: 0, y: 1.2, z: 0.9, radius: 2.0, prompt: 'Call a cab', onUse: (gm) => { if (gm.cab) gm.cab.open('axle-back'); } });
  sign(s, { kind: 'street', text: 'CABS · THE BACK AXLE', sub: 'deck 376 · the axis' }, 0, 2.78, 0.17, { face: 'Z', w: 2.6, h: 0.3, glow: 1.2 });
  // a bench each side, a planter of fern under a lamp, the hand rail all round (a fiftieth of a g: hold on)
  prop(s, 'bench', X0 + 0.5, 0, 4.6, PI / 2, { w: 2.4, back: true, wood: '#7a5233' });
  prop(s, 'bench', X1 - 0.5, 0, 4.6, -PI / 2, { w: 2.4, back: true, wood: '#7a5233' });
  prop(s, 'plant', X1 - 0.6, 0, 7.9, 0, { kind: 'fern', size: 1.0, pot: '#2f6f73' });
  prop(s, 'plant', X0 + 0.6, 0, 7.9, 0, { kind: 'broad', size: 0.9, pot: '#a3563a' });
  handLine(s, [[X0 + 0.16, 0.6], [X0 + 0.16, 8.6]], 1.0, { side: -1 }); handLine(s, [[X1 - 0.16, 0.6], [X1 - 0.16, 8.6]], 1.0);
  // the board: where you are and what is past the doors
  const board = { kind: 'notice', title: 'THE BACK AXLE', lines: ['All of Chervil\'s heat goes out here:', 'about 160 GW, as two-phase ammonia,', 'some 220 cubic metres a second.', 'Ear defenders past the second door.', 'The heat hall · the slow ring', 'the still side · the Window', 'A fiftieth of a g. Hold a line.'] };
  sign(s, board, X0 + 0.17, 1.75, 2.2, { face: 'X', w: 1.3, h: 1.25 });
  s.interact({ x: X0 + 0.8, y: 1.6, z: 2.2, radius: 1.3, prompt: 'Read the board', onUse: async (gm) => {
    await say(gm, 'The board', ['Power comes into Chervil at the front axle, about 160 gigawatts, and you would never know it by ear. All of it leaves again here, as heat, and you will know it.', 'The heat goes out as two-phase ammonia, some 220 cubic metres a second, through a rotary joint into the part of the raft that does not turn, and on to the radiators behind it.', 'At the bottom, in a different hand: a fiftieth of a g. Jump and you will be a long time coming down. Hold a line.']);
  } });
  sign(s, { kind: 'plate', text: 'A FIFTIETH OF A G', sub: 'walk slowly · hold a line' }, X1 - 0.17, 1.5, 2.0, { face: 'x', w: 0.5, h: 0.2 });
  sign(s, { kind: 'street', text: 'THE HEAT HALL', sub: 'through the ear room · defenders on hooks' }, 0, 2.72, Z1 - 0.17, { face: 'z', w: 2.4, h: 0.3, glow: 1.1 });
  sign(s, { kind: 'poster', title: 'The Window', lines: ['Every eight-year-old, once', 'with the adult they chose', 'Five rounds a day', 'through the slow ring'], palette: ['#1f2b5c', '#d6a640', '#f2ede2'] }, X1 - 0.17, 1.65, 6.6, { face: 'x', w: 0.62, h: 0.9 });
  sign(s, { kind: 'poster', title: 'Heat out', lines: ['Every lamp and stove', 'in Chervil ends up here', 'and leaves as ammonia', 'for the radiators'], palette: ['#b5653a', '#f0d070', '#2a1c14'] }, X0 + 0.17, 1.65, 6.6, { face: 'X', w: 0.62, h: 0.9 });
  // a rack of lidded drinking bulbs: nothing boils this near the axis, so tea is brewed below and sent up
  block(s, 1.9, 0, 7.95, 3.5, 0.9, 8.75, 'wood', '#5a3a28', { bevel: 0.02 });
  s.detail(() => {
    for (let i = 0; i < 12; i++) { const bx = 2.1 + (i % 6) * 0.24, bz = 8.15 + (i < 6 ? 0 : 0.28); g.mat('glaze', ['#d8e6dc', '#e9e1cf', '#c9763e'][i % 3], { rough: -0.3 }); g.ball(bx, 0.98, bz, 0.08, 0.08, 0.08, { segs: 10, rings: 7 }); g.mat('cast', '#b08a45'); g.cyl(bx, 1.05, bz, 0.025, 0.04, { segs: 8 }); }
  });
  s.interact({ x: 2.7, y: 1.0, z: 7.6, radius: 1.2, prompt: 'Look at the tea bulbs', onUse: async (gm) => {
    await say(gm, 'The bulbs', ['A rack of lidded drinking bulbs, each with a name in grease pencil. Nothing will boil this near the axis, so tea is brewed a long way below and sent up hot in bulbs.', 'You drink through the spout. Somebody has left a note on the rack: not mine, but go on.']);
  } });
  s.spot('stand', -3.4, 0, 2.2, PI * 0.9, { tags: ['wait'] }); s.spot('stand', 3.2, 0, 3.0, PI * 1.1, { tags: ['wait'] });
  s.spot('sit', X0 + 0.55, 0.46, 4.0, PI / 2, { tags: ['wait'] }); s.spot('sit', X1 - 0.55, 0.46, 5.2, -PI / 2, { tags: ['wait'] });
  s.path([[0, 1.3], [0, 4.6], [0, 8.6], [0, 10.0]]); s.path([[0, 1.3], [-2.3, 1.1]]); s.path([[0, 1.3], [2.3, 1.1]]);
  s.zoneBox({ id: 'axle-lobby', place: 'axle-back', box: [X0, -0.5, Z0, X1, H, Z1], name: 'The back axle', sub: 'The lift lobby · the axis', ambience: 'station', reverb: 'room', headroom: H });
  s.loop('air', 0, 2.8, 4.5, { vol: 0.3, radius: 9 });
}

// ===============================================================================================================
// The ear room: defenders on hooks, big and small, and the door into the noise.
// ===============================================================================================================
function buildEarRoom(game, s, f, st) {
  const g = s.g, X0 = -4, X1 = 4, Z0 = 9, Z1 = 15, H = 3.0;
  const clip = [X0 - 0.1, -0.3, Z0 - 0.1, X1 + 0.1, H + 0.1, Z1 + 0.1];
  floor(s, X0, Z0, X1, Z1, 0, 'speckle', '#4a4844');
  ceiling(s, X0, Z0, X1, Z1, H, 'felt', '#c9bea8');
  const wallO = { tint: '#d9a441', mat: 'paint', dado: { h: 1.0, mat: 'felt', tint: '#3a3430' }, skirt: '#1e1c1a' };
  wall(s, X0 + 0.08, Z0, X0 + 0.08, Z1, 0, H, wallO);
  wall(s, X1 - 0.08, Z0, X1 - 0.08, Z1, 0, H, wallO);
  wall(s, X0, Z1 - 0.08, X1, Z1 - 0.08, 0, H, Object.assign({}, wallO, { openings: [{ at: 3.0, w: 2.0, h: 2.3 }] }));
  // the lobby's wall seen from this side
  g.mat('paint', '#d9a441'); g.box(X0, 0, Z0, -1.1, H, Z0 + 0.01, { faces: 'Z' }); g.box(1.1, 0, Z0, X1, H, Z0 + 0.01, { faces: 'Z' }); g.box(-1.1, 2.4, Z0, 1.1, H, Z0 + 0.01, { faces: 'Z' }); s.flush({ tier: 's' });
  roomGlow(s, X0, 0, Z0, X1, H, Z1, { sky: '#ffdcae', ground: '#8a7050', power: 0.3 });
  lamp(s, 'panel', 0, H, 12, { w: 1.2, d: 1.2, K: 3600, power: 1.0, clip });
  // a black-and-yellow band round the room at head height: the noise starts here
  g.mat('paint', '#1e1c1a'); for (const x of [X0 + 0.17, X1 - 0.17]) g.box(x - 0.005, 2.2, Z0 + 0.1, x + 0.005, 2.32, Z1 - 0.1, { faces: x < 0 ? 'X' : 'x' }); s.flush({ tier: 'd', cast: false });
  // the hook boards: two rows on each side, children's sizes low
  const CUPS = ['#c9552e', '#2f6f73', '#d6a640', '#7a2f3c', '#3a4a6a', '#e9e1cf'];
  for (const side of [-1, 1]) {
    const x = side < 0 ? X0 + 0.17 : X1 - 0.17;
    g.mat('wood', '#6b4a2f'); g.box(x - 0.02, 1.0, 9.6, x + 0.02, 1.95, 14.4, { bevel: 0.01 }); s.flush({ tier: 's' });
    let k = 0;
    for (const row of [[1.82, 1], [1.38, 0.8]]) for (let z = 9.9; z < 14.2; z += 0.42) {
      k++; if ((k * 7 + (side > 0 ? 3 : 0)) % 9 === 0) continue;                // a few hooks empty: someone is wearing them
      prop(s, 'lm-axle-back.defenders', x - side * 0.04, row[0], z, side < 0 ? PI / 2 : -PI / 2, { cup: CUPS[(k + (side > 0 ? 2 : 0)) % CUPS.length], band: '#2f3a36' }, { scale: row[1] });
    }
    sign(s, { kind: 'label', text: side < 0 ? 'ADULTS' : 'ADULTS · TOP ROW', sub: side < 0 ? 'children below' : 'eight-year-olds below' }, x - side * 0.03, 2.08, 12.0, { face: side < 0 ? 'X' : 'x', w: 0.6, h: 0.16 });
  }
  sign(s, { kind: 'board', title: 'EAR DEFENDERS', lines: ['From the next door on, the axle', 'is louder than you can stand.', 'Put a pair on. Hang it back.'], palette: ['#1e1c1a', '#f3e6c8', '#d6a640'] }, 0, 2.6, Z1 - 0.18, { face: 'z', w: 1.6, h: 0.62, glow: 0.9 });
  s.interact({ x: X0 + 0.7, y: 1.5, z: 12, radius: 1.5, prompt: () => (st.ears ? 'Hang the ear defenders back' : 'Take a pair of ear defenders'), onUse: (gm) => ears(gm, st) });
  s.interact({ x: X1 - 0.7, y: 1.5, z: 12, radius: 1.5, prompt: () => (st.ears ? 'Hang the ear defenders back' : 'Take a pair of ear defenders'), onUse: (gm) => ears(gm, st) });
  // a returns crate and a bench
  prop(s, 'crate', X1 - 0.6, 0, 9.6, 0.1, { w: 0.6, h: 0.42, d: 0.42 });
  prop(s, 'bench', 0, 0, 9.55, 0, { w: 2.2, wood: '#6b4a2f' });
  // the sound door into the hall: two glazed leaves that slide
  door(s, { x: -1.0, y: 0, z: Z1 - 0.02, w: 1.0, h: 2.25, along: 'x', dir: 1, kind: 'slide', style: 'glazed', auto: true, tint: '#2f5d5a' });
  door(s, { x: 1.0, y: 0, z: Z1 - 0.02, w: 1.0, h: 2.25, along: 'x', dir: -1, kind: 'slide', style: 'glazed', auto: true, tint: '#2f5d5a' });
  for (const p of [[-2.0, 11.4], [2.2, 12.6]]) s.spot('play', p[0], 0, p[1], 0, { tags: ['hop', 'kids'] });
  s.spot('stand', -3.2, 0, 13.4, -PI / 2, { tags: ['browse'] }); s.spot('stand', 3.2, 0, 10.8, PI / 2, { tags: ['browse'] });
  s.path([[0, 10.0], [0, 12.0], [0, 14.4], [0, 16.0]]); s.path([[0, 12.0], [-3.0, 12.0]]); s.path([[0, 12.0], [3.0, 12.0]]);
  s.zoneBox({ id: 'axle-ears', place: 'axle-back', box: [X0, -0.5, Z0, X1, H, Z1], name: 'The ear room', sub: 'The back axle · defenders on hooks', ambience: 'station', reverb: 'room', headroom: H });
}

function ears(game, st) {
  st.ears = !st.ears;
  if (st.ears) toast(game, 'Ear defenders on. The world goes thick and close, and you can hear your own pulse.');
  else toast(game, 'You hang them back on their hook. Somebody has written a name in the band in pencil, and crossed it out, and written another.');
  if (game.audio) game.audio.ui(st.ears ? 'close' : 'open');
}

// ===============================================================================================================
// The heat hall: a cylinder round the axis, 120 m across. Its floor runs right round and meets itself overhead; eight
// great mains come in at the front, run along it and turn in to the rotary joint on the axis; a still collar beyond the
// bearing turns against everything else, once every 110 seconds.
// ===============================================================================================================
const HZ0 = 15, HZ1 = 64;                     // the hall along z
const NM = 8;                                  // the mains
function buildHall(game, s, f, st) {
  const g = s.g, r = new Rng(3760);
  // A light's clip is kept as angles from the camera, so it must not reach the point straight across the axis from
  // wherever you stand (the gallery is near x = 0): it stops a few metres short of it. Ambients can go all the way round.
  const clip = [-180, -1, HZ0, 185, RHO + 1, HZ1], all = [-XR, -1, HZ0, XR, RHO + 1, HZ1];
  // ---- the shell: the floor all round (except under the gallery), the front and back walls as discs
  const GX = 3.25;
  const ringBox = (y0, y1, z0, z1, faces, skip) => {      // a box all the way round, skipping |x| < skip
    if (skip) { g.box(skip, y0, z0, C - skip, y1, z1, { faces }); }
    else g.box(-XR, y0, z0, XR, y1, z1, { faces });
  };
  s.structure(() => { g.mat('deckplate', '#6a645a'); ringBox(-0.02, 0, HZ0, HZ1, 'Y', GX); });
  // the long ribs of the floor: stringers every eight metres, and a painted walkway line
  s.structure(() => { g.mat('panel', '#4a4640'); for (let x = 8; x < C - 7; x += 8) g.box(x - 0.18, 0, HZ0, x + 0.18, 0.32, HZ1, { faces: 'xXY' }); });
  s.structure(() => { g.mat('paint', '#c9a24a'); for (let x = 24; x < C - 23; x += 47.1) g.box(x - 0.6, 0.004, HZ0, x - 0.5, 0.01, HZ1, { faces: 'Y' }); });
  // front wall (z = 15) and back wall (z = 64) as discs; holes where the gallery and the ring passage go through
  s.structure(() => {
    g.mat('panel', '#5d5a52');
    g.box(GX, 0, HZ0 - 0.2, C - GX, RHO - 0.05, HZ0, { faces: 'Z' }); g.box(-GX, 3.6, HZ0 - 0.2, GX, RHO - 0.05, HZ0, { faces: 'Z' });
    g.mat('panel', '#4f4c46');
    g.box(1.45, 0, HZ1, C - 1.45, RHO - 21, HZ1 + 0.2, { faces: 'z' }); g.box(-1.45, 2.7, HZ1, 1.45, RHO - 21, HZ1 + 0.2, { faces: 'z' });
  });
  // concentric painted rings on the back disc, so its size reads
  s.deco(() => { for (const rr of [28, 36, 46, 55]) { g.mat('paint', rr % 2 ? '#c9a24a' : '#2f5d5a'); g.box(-XR, RHO - rr - 0.3, HZ1 - 0.01, XR, RHO - rr + 0.3, HZ1 - 0.005, { faces: 'z' }); } });
  // hoops: the hall's ribs, every six metres, raised to pass over the gallery
  for (let z = 18; z < HZ1 - 1; z += 6) {
    s.structure(() => {
      g.mat('panel', '#6a3a30'); g.box(4.2, 0, z - 0.25, C - 4.2, 0.95, z + 0.25, { faces: 'xXYzZ' });
      g.mat('panel', '#6a3a30'); g.box(-4.2, 3.7, z - 0.25, 4.2, 4.4, z + 0.25, { faces: 'yYzZ' });
      for (const sx of [-1, 1]) g.box(sx * 4.2 - 0.25, 0, z - 0.25, sx * 4.2 + 0.25, 4.4, z + 0.25, { faces: 'xXzZY' });
    });
    // small lamps strung round each hoop: points of warm light all the way round and overhead
    s.deco(() => { g.mat('diffuser', '#ffcf8a', { emissive: 5 }); for (let x = 9.8; x < C - 9; x += 15.7) g.box(x - 0.15, 0.95, z - 0.12, x + 0.15, 1.07, z + 0.12, { faces: 'Yxz' }); });
  }
  // ---- pump sets and valve stations scattered round the floor (near the floor the bend is slight: drawn flat)
  const PUMP = ['#2f6f73', '#3a4a6a', '#2f5d5a'];
  for (let k = 0; k < 34; k++) {
    const x = 10 + k * (C - 20) / 34 + r.f(-2, 2), z = HZ0 + 3 + r.f(0, HZ1 - HZ0 - 9);
    if (Math.abs(wrapC(x)) < 11) continue;
    s.furniture(() => {
      g.mat('concrete', '#6a665e'); g.box(x - 1.3, 0, z - 0.9, x + 1.3, 0.28, z + 0.9, { bevel: 0.03 });
      g.mat('panel', PUMP[k % 3]); g.cyl(x - 0.4, 0.28, z, 0.55, 1.15, { segs: 14 }); g.box(x + 0.2, 0.28, z - 0.4, x + 1.1, 1.0, z + 0.4, { bevel: 0.04 });
      g.mat('paint', '#c9a24a'); g.cyl(x - 0.4, 1.43, z, 0.35, 0.18, { segs: 12 });
      g.mat('brushed', '#9a948a'); g.tube([[x - 0.4, 1.6, z], [x - 0.4, 2.6, z], [x - 0.4, 2.9, z + 0.4], [x - 0.4, 2.9, z + 1.6]], 0.16, { segs: 8 });
      g.mat('paint', '#b8452e'); const wz = z + 1.0, ring = []; for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 2; ring.push([x - 0.4 + Math.cos(a) * 0.32, 2.9 + Math.sin(a) * 0.32, wz]); } g.tube(ring, 0.03, { segs: 5, closed: true });
    });
  }
  // ---- the rotary joint: a drum twelve metres round the axis, and the bearing race at its back end
  s.structure(() => {
    g.mat('brushed', '#b8b2a4'); g.box(-XR, RHO - 12, 46, XR, RHO, 57, { faces: 'yz' });
    g.mat('panel', '#8a5a3a'); g.box(-XR, RHO - 19, 57, XR, RHO - 12, 61, { faces: 'yz' });
  });
  s.deco(() => {
    for (let k = 0; k < 6; k++) { const z = 47 + k * 1.8; g.mat('paint', k % 2 ? '#6b4a7a' : '#d6a640'); g.box(-XR, RHO - 12.12, z, XR, RHO - 12.0, z + 0.5, { faces: 'yzZ' }); }
    g.mat('cast', '#3a3430'); for (let x = -XR; x < XR; x += 4) g.box(x, RHO - 19.2, 57.6, x + 0.6, RHO - 19.0, 58.2, { faces: 'yzZ' });
    g.mat('cast', '#c9a24a'); g.box(-XR, RHO - 19.1, 60.7, XR, RHO - 18.9, 61.0, { faces: 'y' });
  });
  // ---- the still collar: beyond the bearing, the part that does not turn. From in here it turns, once every 110 s.
  const collar = movingMesh(s, (cg) => {
    cg.mat('panel', '#3a3a3c'); cg.box(-XR, RHO - 22, 0, XR, RHO - 9, 2.8, { faces: 'yz' });
    for (let i = 0; i < 48; i++) { const x0 = -XR + C * i / 48, x1 = x0 + C / 96; cg.mat('paint', '#d6a640'); cg.box(x0, RHO - 22.05, 0.4, x1, RHO - 21.95, 2.4, { faces: 'y' }); cg.box(x0, RHO - 22, -0.05, x1, RHO - 15, 0.0, { faces: 'z' }); }
    for (let i = 0; i < 6; i++) { const x = -XR + C * (i + 0.5) / 6; cg.mat('paint', '#e9e1cf'); cg.box(x - 3, RHO - 21.6, -0.06, x + 3, RHO - 18, -0.01, { faces: 'z' }); }
  }, { origin: [0, 0, 61], center: [0, RHO - 15, 1.4], radius: 200, far: 600 });
  // ---- the mains: eight, lagged and banded, coming in at the front wall, along the hall, and in to the joint
  const RM = 42, RB = 8, RJ = 12.4, ZB = 44, RADM = 1.3;
  for (let i = 0; i < NM; i++) {
    const th = (i + 0.5) * 2 * PI / NM;
    const path = [];
    for (const z of [HZ0 - 0.2, 24, 34, ZB]) path.push(polar(th, RM, z, RHO));
    for (let k = 1; k <= 12; k++) { const a = (PI / 2) * k / 12; path.push(polar(th, RM - RB + RB * Math.cos(a), ZB + RB * Math.sin(a), RHO)); }
    for (let k = 1; k <= 8; k++) { const rr = RM - RB - (RM - RB - RJ) * k / 8; path.push(polar(th, rr, ZB + RB, RHO)); }
    inTrue(s, RHO, () => { g.mat('brushed', i % 2 ? '#cfc8b8' : '#c4bdab', { rough: 0.08 }); g.tube(path, RADM, { segs: 18, caps: false }); });
    inTrue(s, RHO, () => {
      // bands: violet for ammonia, ochre for the main's number, every three metres; flanges at the bend
      for (let z = HZ0 + 1.5; z < ZB - 0.5; z += 3) { g.mat('paint', ((z / 3) | 0) % 2 ? '#6b4a7a' : '#d6a640'); g.tube([polar(th, RM, z, RHO), polar(th, RM, z + 0.35, RHO)], RADM + 0.05, { segs: 18 }); }
      g.mat('cast', '#3a3a3c');
      g.tube([polar(th, RM, ZB - 0.2, RHO), polar(th, RM, ZB + 0.15, RHO)], RADM + 0.22, { segs: 18 });
      g.tube([polar(th, RM - RB + 0.15, ZB + RB, RHO), polar(th, RM - RB - 0.2, ZB + RB, RHO)], RADM + 0.22, { segs: 18 });
      g.tube([polar(th, RJ + 1.4, ZB + RB, RHO), polar(th, RJ - 0.2, ZB + RB, RHO)], RADM + 0.35, { segs: 18 });
      // two legs down to the floor at each support
      for (const z of [22, 32, 41]) for (const dth of [-0.035, 0.035]) g.tube([polar(th + dth, RHO, z, RHO), polar(th, RM + RADM * 0.6, z, RHO)], 0.28, { segs: 8 });
      for (const z of [22, 32, 41]) g.tube([polar(th, RM - RADM - 0.15, z - 0.4, RHO), polar(th, RM - RADM - 0.15, z + 0.4, RHO)], 0.18, { segs: 8 });
    }, { tier: 's', cast: false });
  }
  // the returns: eight smaller pipes, liquid coming back, straight along the hall between the mains
  for (let i = 0; i < NM; i++) {
    const th = i * 2 * PI / NM, rr = 52.5;
    inTrue(s, RHO, () => {
      g.mat('brushed', '#8fa8a4', { rough: 0.05 }); g.tube([polar(th, rr, HZ0 - 0.2, RHO), polar(th, rr, HZ1 + 0.2, RHO)], 0.55, { segs: 12, caps: false });
      g.mat('paint', '#2f6f73'); for (let z = HZ0 + 3; z < HZ1; z += 5) g.tube([polar(th, rr, z, RHO), polar(th, rr, z + 0.3, RHO)], 0.6, { segs: 12 });
      g.mat('cast', '#3a3430'); for (const z of [25, 40, 55]) g.tube([polar(th, RHO, z, RHO), polar(th, rr + 0.5, z, RHO)], 0.16, { segs: 6 });
    });
  }
  // ---- light: warm floods on the floor all round, pointing in; the hall's own bounce
  s.ambient({ box: all, sky: '#ffcf9a', ground: '#8a6a48', power: 0.22, spec: 0.4, allRound: true });
  const fl = [];
  for (let k = 0; k < 12; k++) for (const z of [24, 48]) {
    const th = (k + (z > 30 ? 0.5 : 0)) * 2 * PI / 12; if (Math.abs(Math.sin(th / 2)) < 0.12 || Math.abs(Math.cos(th / 2)) < 0.1) continue;     // none by the gallery or straight across from it
    fl.push([th, z]);
    s.light({ at: polarFlat(th > PI ? th - 2 * PI : th, 57.5, z, RHO), color: warm(2300), power: 55, range: 72, clip, radius: 0.4 });
  }
  inTrue(s, RHO, () => {
    for (const q of fl) { g.mat('cast', '#2a2826'); g.tube([polar(q[0], RHO, q[1], RHO), polar(q[0], 58.2, q[1], RHO)], 0.4, { segs: 10 }); g.mat('diffuser', '#ffd59a', { emissive: 8 }); g.tube([polar(q[0], 58.2, q[1], RHO), polar(q[0], 57.9, q[1], RHO)], 0.42, { segs: 10 }); }
  }, { tier: 's', cast: false });
  // a lamp on the joint, lighting the bearing from in front
  s.light({ at: [0, RHO - 14, 44], color: warm(2600), power: 40, range: 30, clip });
  // ---- the noise: the river in its pipes, the air handlers, the bearing
  hallLoop(s, st, 'tide', 0, 14, 22, 1.0, 46); hallLoop(s, st, 'tide', 0, 14, 44, 1.0, 46);
  hallLoop(s, st, 'air', 0, 4, 34, 0.75, 40); hallLoop(s, st, 'platform', 0, 30, 56, 0.9, 60); hallLoop(s, st, 'hum-lamp', 0, 2.8, 30, 0.5, 20);
  // ---- the still collar turns: once every 110 s, against the drum
  s.every((dt) => { let o = collar.origin[0] - V * dt; if (o < -C) o += C; collar.origin[0] = o; });
  s.zoneBox({ id: 'axle-hall', place: 'axle-back', box: [-XR, -0.5, HZ0, XR, RHO, HZ1], name: 'The heat hall', sub: 'The back axle · the ammonia mains', ambience: 'station', reverb: 'hall', headroom: 60, env: ENV_HALL }).allRound = true;
}

// ===============================================================================================================
// The gallery across the hall: glazed sides and roof, the gauge wall, the watch desk in its bay.
// ===============================================================================================================
function buildGallery(game, s, f, st) {
  const g = s.g, X0 = -3, X1 = 3, Z0 = HZ0, Z1 = 58, H = 3.2, PAR = 0.9;
  const clip = [X0 - 0.2, -0.3, Z0, 8.2, H + 0.2, Z1];
  const GZ0 = 30, GZ1 = 40;                                // the gauge wall (anti side) and the watch bay (spinward side)
  floor(s, X0, Z0, X1, Z1, 0, 'deckplate', '#7a746a');
  g.mat('felt', '#7a2f3c'); g.box(-0.8, 0, Z0 + 0.3, 0.8, 0.012, Z1 - 0.3, { faces: 'YxXzZ' }); s.flush({ tier: 's' });
  // the parapets and the glazing between posts, both sides; the roof glazed between ribs
  const posts = []; for (let z = Z0; z <= Z1 + 0.01; z += 2.15) posts.push(Math.min(z, Z1));
  s.structure(() => {
    g.mat('panel', '#2f5d5a');
    for (const x of [X0, X1]) {
      const segs = x < 0 ? [[Z0, GZ0], [GZ1, Z1]] : [[Z0, GZ0], [GZ1, Z1]];
      for (const sg of segs) g.box(x - 0.08, 0, sg[0], x + 0.08, PAR, sg[1], { bevel: 0.01 });
    }
    g.mat('cast', '#2a2826');
    for (const z of posts) for (const x of [X0, X1]) { if (z > GZ0 + 0.1 && z < GZ1 - 0.1) continue; g.box(x - 0.07, PAR, z - 0.06, x + 0.07, H, z + 0.06); }
    for (const z of posts) g.box(X0, H - 0.06, z - 0.06, X1, H + 0.12, z + 0.06);
    for (const x of [X0, X1]) g.box(x - 0.09, H - 0.1, Z0, x + 0.09, H + 0.12, Z1);
    g.box(-0.08, H, Z0, 0.08, H + 0.14, Z1);
  });
  // no glass: the sides and roof are open, strung with steel safety cables (a jump here is a long way up and a long time
  // coming down), so the hall is seen as it is
  s.deco(() => {
    g.mat('cast', '#8a7a62', { rough: -0.1 });
    for (const x of [X0, X1]) for (const y of [1.35, 1.8, 2.25, 2.7]) { g.tube([[x, y, Z0], [x, y, GZ0]], 0.008, { segs: 4, caps: false }); g.tube([[x, y, GZ1], [x, y, Z1]], 0.008, { segs: 4, caps: false }); }
    for (let x = X0 + 0.75; x < X1; x += 0.75) g.tube([[x, H + 0.02, Z0], [x, H + 0.02, Z1]], 0.008, { segs: 4, caps: false });
  });
  // collision: the parapets and glass, the roof (a long way to come down from, at a fiftieth of a g)
  s.solid(X0 - 0.1, 0, Z0, X0 + 0.1, H, GZ0); s.solid(X0 - 0.1, 0, GZ1, X0 + 0.1, H, Z1);
  s.solid(X1 - 0.1, 0, Z0, X1 + 0.1, H, GZ0); s.solid(X1 - 0.1, 0, GZ1, X1 + 0.1, H, Z1);
  s.solid(X0, H, Z0, 8.2, H + 0.6, Z1);
  // the end wall with the door to the ring passage
  wall(s, X0, Z1 + 0.08, X1, Z1 + 0.08, 0, H, { tint: '#d9a441', mat: 'paint', dado: { h: 1.0, mat: 'panel', tint: '#2f5d5a' }, skirt: '#1e1c1a', openings: [{ at: 1.9, w: 2.2, h: 2.4 }] });
  sign(s, { kind: 'street', text: 'THE SLOW RING', sub: 'the still side · the Window · the car' }, 0, 2.75, Z1 - 0.01, { face: 'z', w: 2.2, h: 0.28, glow: 1.0 });
  // the front end: the ear room's door frame seen from here
  g.mat('paint', '#d9a441'); g.box(X0, 0, Z0, -1.0, H, Z0 + 0.02, { faces: 'Z' }); g.box(1.0, 0, Z0, X1, H, Z0 + 0.02, { faces: 'Z' }); g.box(-1.0, 2.3, Z0, 1.0, H, Z0 + 0.02, { faces: 'Z' }); s.flush({ tier: 's' });
  // lamps down the spine: warm pendants, low enough to light the felt and leave the hall to its floods
  for (let z = Z0 + 4; z < Z1 - 1; z += 7) lamp(s, 'globe', 0, 2.55, z, { K: 2700, power: 0.8, drop: 0.55, clip, range: 6 });
  roomGlow(s, X0, 0, Z0, X1, H, Z1, { sky: '#ffdcae', ground: '#7a5a48', power: 0.2 });
  handLine(s, [[X0 + 0.12, Z0 + 0.5], [X0 + 0.12, GZ0 - 0.3]], 1.0, { side: 1 }); handLine(s, [[X0 + 0.12, GZ1 + 0.3], [X0 + 0.12, Z1 - 0.5]], 1.0, { side: 1 });
  handLine(s, [[X1 - 0.12, Z0 + 0.5], [X1 - 0.12, GZ0 - 0.3]], 1.0, { side: -1 }); handLine(s, [[X1 - 0.12, GZ1 + 0.3], [X1 - 0.12, Z1 - 0.5]], 1.0, { side: -1 });

  // ---- the gauge wall: a solid stretch of the anti side, a painted board of dials
  wall(s, X0 - 0.08, GZ0, X0 - 0.08, GZ1, 0, H, { tint: '#2a3230', mat: 'panel', skirt: '#1e1c1a' });
  const GW = 8.6, GH = 1.7;
  const R = game.atlas.add(1376, 272, (ctx, w, h) => paintGauges(ctx, w, h, game), 'axle.gauges');
  s.deco(() => {
    g.atlas(R.page, { emissive: 0.9 });
    const zc = (GZ0 + GZ1) / 2, x = X0 + 0.03;
    g.quad([x, 0.95, zc + GW / 2], [x, 0.95, zc - GW / 2], [x, 0.95 + GH, zc - GW / 2], [x, 0.95 + GH, zc + GW / 2], { uv: [R.u0, R.v1, R.u1, R.v0] });
  });
  s.detail(() => {
    const zc = (GZ0 + GZ1) / 2, x = X0 + 0.02;
    g.mat('cast', '#9a7a42', { rough: -0.12 });
    g.box(x, 0.9, zc - GW / 2 - 0.06, x + 0.05, 0.95, zc + GW / 2 + 0.06); g.box(x, 0.95 + GH, zc - GW / 2 - 0.06, x + 0.05, 1.0 + GH, zc + GW / 2 + 0.06);
    // brass bezels round the eight dials
    for (let i = 0; i < 8; i++) { const zz = zc - GW / 2 + GW * (i + 0.5) / 8, yy = 0.95 + GH * 0.55, rr = GH * 0.31, ring = []; for (let k = 0; k < 20; k++) { const a = k / 20 * PI * 2; ring.push([x + 0.03, yy + Math.sin(a) * rr, zz + Math.cos(a) * rr]); } g.tube(ring, 0.022, { segs: 6, closed: true }); }
  });
  lamp(s, 'strip', X0 + 0.4, H - 0.05, GZ0 + 0.6, { to: [X0 + 0.4, H - 0.05, GZ1 - 0.6], K: 3400, power: 0.8, clip: [X0 - 0.1, -0.2, GZ0, 0, H, GZ1] });
  s.interact({ x: X0 + 0.7, y: 1.6, z: 35, radius: 2.4, prompt: 'Read the gauges', onUse: async (gm) => {
    const sun = gm.clock ? gm.clock.sun() : 1;
    await say(gm, 'The gauge wall', ['Eight dials in brass rings. Heat out: about 160 gigawatts, the whole drum\'s worth, a little over four-fifths of a kilowatt for every person in it.', 'Two loops feed it. The rooms\' loop comes back at about 283 kelvin, 0.45 kW a head; the food plant\'s at about 330, 0.35 kW a head. The ammonia: some 220 cubic metres a second.', 'The sunline\'s own dial: ' + (sun > 0.05 ? 'about ' + (2.4 * sun).toFixed(1) + ' gigawatts coming down the spar from the line, of the 2.4 it sends at full sun.' : 'near zero. The line is dark, and its spar sends no heat down.') + ' The bearing: 0.55 turns a minute, one every 110 seconds. Radiators: about 390 square kilometres, out behind the raft.']);
  } });
  // ---- the watch bay: a glazed bump on the spinward side, a desk facing the hall, the watch book
  const BX = 8.0;
  floor(s, X1, GZ0, BX, GZ1, 0, 'deckplate', '#7a746a');
  g.mat('felt', '#2f5d5a'); g.box(X1 + 0.3, 0, GZ0 + 0.3, BX - 0.3, 0.01, GZ1 - 0.3, { faces: 'Y' }); s.flush({ tier: 'd', cast: false });
  s.structure(() => {
    g.mat('panel', '#2f5d5a'); g.box(BX - 0.08, 0, GZ0, BX + 0.08, PAR, GZ1, { bevel: 0.01 }); g.box(X1, 0, GZ0 - 0.08, BX, PAR, GZ0 + 0.08, { bevel: 0.01 }); g.box(X1, 0, GZ1 - 0.08, BX, PAR, GZ1 + 0.08, { bevel: 0.01 });
    g.mat('cast', '#2a2826');
    for (let z = GZ0; z <= GZ1 + 0.01; z += 2.5) g.box(BX - 0.07, PAR, z - 0.06, BX + 0.07, H, z + 0.06);
    for (let x = X1 + 1.25; x < BX; x += 1.25) { g.box(x - 0.06, PAR, GZ0 - 0.07, x + 0.06, H, GZ0 + 0.07); g.box(x - 0.06, PAR, GZ1 - 0.07, x + 0.06, H, GZ1 + 0.07); }
    g.box(X1, H - 0.08, GZ0 - 0.08, BX, H + 0.12, GZ0 + 0.08); g.box(X1, H - 0.08, GZ1 - 0.08, BX, H + 0.12, GZ1 + 0.08); g.box(BX - 0.09, H - 0.08, GZ0, BX + 0.09, H + 0.12, GZ1);
  });
  s.deco(() => {
    g.mat('cast', '#8a7a62', { rough: -0.1 });
    for (const y of [1.35, 1.8, 2.25, 2.7]) { g.tube([[BX, y, GZ0], [BX, y, GZ1]], 0.008, { segs: 4, caps: false }); g.tube([[X1, y, GZ0], [BX, y, GZ0]], 0.008, { segs: 4, caps: false }); g.tube([[X1, y, GZ1], [BX, y, GZ1]], 0.008, { segs: 4, caps: false }); }
    for (let z = GZ0 + 0.75; z < GZ1; z += 0.75) g.tube([[X1, H + 0.02, z], [BX, H + 0.02, z]], 0.008, { segs: 4, caps: false });
  });
  s.solid(BX - 0.1, 0, GZ0, BX + 0.1, H, GZ1); s.solid(X1, 0, GZ0 - 0.1, BX, H, GZ0 + 0.1); s.solid(X1, 0, GZ1 - 0.1, BX, H, GZ1 + 0.1);
  // the desk: a long sloped console facing out, a chair, the watch book, a lidded cup
  block(s, BX - 1.3, 0, 32.2, BX - 0.5, 0.78, 37.8, 'wood', '#5a3a28', { bevel: 0.02 });
  s.detail(() => {
    g.mat('panel', '#1e2624'); g.box(BX - 1.25, 0.78, 32.3, BX - 0.55, 0.84, 37.7, { bevel: 0.01 });
    g.mat('diffuser', '#ffb060', { emissive: 2.5 }); for (let z = 32.6; z < 37.6; z += 0.35) g.box(BX - 0.8, 0.84, z, BX - 0.74, 0.86, z + 0.06);
    g.mat('diffuser', '#3fe0d0', { emissive: 2 }); for (let z = 32.8; z < 37.6; z += 0.7) g.box(BX - 0.98, 0.84, z, BX - 0.92, 0.86, z + 0.06);
    g.mat('paper', '#efe6d2'); g.box(BX - 1.2, 0.84, 34.4, BX - 0.85, 0.87, 34.9); g.mat('weave', '#2f5d5a'); g.box(BX - 1.21, 0.835, 34.38, BX - 0.84, 0.842, 34.92);
  });
  prop(s, 'cup', BX - 1.0, 0.84, 36.4, 0, { glaze: '#c9763e' });
  prop(s, 'chair', BX - 2.0, 0, 34.7, PI / 2, { wood: '#5a4030' });
  s.spot('work', BX - 1.9, 0, 34.7, PI / 2, { tags: ['watch', 'write'] });
  s.spot('work', X0 + 0.9, 0, 33.0, -PI / 2, { tags: ['read', 'watch'] });
  s.interact({ x: BX - 1.6, y: 1.0, z: 34.7, radius: 1.6, kind: 'talk', prompt: 'Talk to the watch', onUse: async (gm) => {
    const k = (gm.flags['axle.watch'] = (gm.flags['axle.watch'] || 0) + 1);
    const L = [['You found the ear defenders. Good. Most people come in without, stand in the door with their mouth open, and go back for them.', 'This is the loudest room in Chervil, and the job is to sit in it and notice when it changes. A pump going, a main running warm. Usually nothing.'],
      ['The watch book: a line every hour, in four hands. Lamp-night: changed a pump on main six. Nobody noticed, which is the job.'],
      ['Everything the drum does ends up in here as heat. Every lamp, every kitchen, every hot bath. On Booking Day the feast shows on the dial: half past one, all the hall stoves at once.'],
      ['Past the slow ring, nothing turns. The Window crews come through here five rounds a day with their eight-year-olds. The children all hold their ears like this, even with the defenders on.']];
    await say(gm, WATCH, L[(k - 1) % L.length]);
  } });
  s.interact({ x: X1 - 0.6, y: 1.6, z: Z1 - 2.5, radius: 1.8, prompt: 'Look at the bearing', onUse: async (gm) => {
    await say(gm, 'The bearing', ['Ahead and up, fifty metres overhead where the floor meets itself, the eight mains turn in to the joint: a drum twelve metres round the axis, banded violet and gold.', 'Behind it is the bearing, and behind that the still collar, striped in yellow. Watch it. It is turning, once every 110 seconds. It is not turning. You are, and so is everything else in here, and the collar is the first thing you have seen in Chervil that is not.']);
  } });
  // visitors at the glass, a child's party being walked through
  for (const z of [19, 24.5, 45, 51]) { s.spot('stand', X0 + 0.45, 0, z, -PI / 2, { tags: ['watch'] }); s.spot('stand', X1 - 0.45, 0, z + 1.6, PI / 2, { tags: ['watch'] }); }
  for (const z of [26, 27.2, 47.5]) s.spot('play', 0.6, 0, z, 0, { tags: ['hop', 'kids'] });
  s.path([[0, 16.0], [0, 24], [0, 35], [0, 46], [0, 57.4], [0, 59.5]]);
  s.path([[0, 35], [5.5, 35], [6.1, 34.7]]); s.path([[0, 35], [-2.0, 33.0]]);
  s.zoneBox({ id: 'axle-gallery', place: 'axle-back', box: [X0, -0.5, Z0, BX, H + 0.5, Z1], name: 'The heat hall', sub: 'The back axle · the gallery', ambience: 'station', reverb: 'hall', headroom: H, env: ENV_HALL });
}

// The gauge board: eight dials with their numbers, and a mimic strip of the loop.
function paintGauges(ctx, w, h, game) {
  ctx.fillStyle = '#1b2220'; ctx.fillRect(0, 0, w, h);
  const D = [['HEAT OUT', 'GW', 160, 200, '160'], ['AMMONIA', 'm³ a second', 220, 300, '220'], ['ROOMS LOOP', 'kelvin', 283, 400, '283'], ['PLANT LOOP', 'kelvin', 330, 400, '330'],
    ['SUNLINE SPAR', 'GW at full sun', 2.4, 3, '2.4'], ['BEARING', 'turns a minute', 0.55, 1, '0.55'], ['A HEAD', 'kW of heat', 0.8, 1, '0.8'], ['RADIATORS', 'km² behind us', 390, 500, '390']];
  const n = D.length, cw = w / n;
  for (let i = 0; i < n; i++) {
    const cx = cw * (i + 0.5), cy = h * 0.45, rr = h * 0.31;
    ctx.fillStyle = '#efe6d2'; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, PI * 2); ctx.fill();
    ctx.strokeStyle = '#2a2826'; ctx.lineWidth = 2;
    for (let k = 0; k <= 10; k++) { const a = PI * 0.75 + (PI * 1.5) * k / 10; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * rr * 0.78, cy + Math.sin(a) * rr * 0.78); ctx.lineTo(cx + Math.cos(a) * rr * 0.92, cy + Math.sin(a) * rr * 0.92); ctx.stroke(); }
    ctx.strokeStyle = '#c9552e'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, rr * 0.86, PI * 0.75 + PI * 1.5 * 0.85, PI * 2.25); ctx.stroke();
    const a = PI * 0.75 + PI * 1.5 * clamp(D[i][2] / D[i][3], 0, 1);
    ctx.strokeStyle = '#1e1c1a'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * rr * 0.8, cy + Math.sin(a) * rr * 0.8); ctx.stroke();
    ctx.fillStyle = '#1e1c1a'; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, PI * 2); ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2a2826'; ctx.font = "600 " + Math.round(h * 0.09) + "px 'Barlow Condensed', sans-serif"; ctx.fillText(D[i][4], cx, cy + rr * 0.45);
    ctx.fillStyle = '#f3e6c8'; ctx.font = "600 " + Math.round(h * 0.085) + "px 'Barlow Condensed', sans-serif"; ctx.fillText(D[i][0], cx, h * 0.86);
    ctx.fillStyle = '#d6a640'; ctx.font = "500 " + Math.round(h * 0.065) + "px 'Barlow Condensed', sans-serif"; ctx.fillText(D[i][1], cx, h * 0.95);
  }
}

// ===============================================================================================================
// The slow ring. A short passage through the back wall, then an annulus right round the axis, six metres deep: the
// despun chamber. Its floor is the ring you step onto. The wall behind you is the drum; the wall in front is the still
// side, with twelve car ports. Sit, hold the line, and the ring lets go of the turn.
// ===============================================================================================================
const RZ0 = 64.2, RZ1 = 70, RH = 3.6;
function buildRing(game, s, f, st) {
  const g = s.g;
  // ---- the passage through the back wall
  { const X0 = -1.3, X1 = 1.3, Z0 = 58.2, Z1 = RZ0, H = 2.6;
    floor(s, X0, Z0, X1, Z1, 0, 'deckplate', '#6a645a');
    g.mat('panel', '#3a4a48'); innerBox(g, X0, 0, Z0, X1, H, Z1, 'xXY'); s.flush({ tier: 's' });
    g.mat('panel', '#4f4c46'); g.box(X0 - 0.2, 0, Z0, X0, H + 0.4, Z1, { faces: 'x' }); g.box(X1, 0, Z0, X1 + 0.2, H + 0.4, Z1, { faces: 'X' }); g.box(X0 - 0.2, H, Z0, X1 + 0.2, H + 0.4, Z1, { faces: 'Y' }); s.flush({ tier: 's' });
    s.solid(X0 - 0.2, 0, Z0, X0, H, Z1); s.solid(X1, 0, Z0, X1 + 0.2, H, Z1); s.solid(X0, H, Z0, X1, H + 0.4, Z1);
    lamp(s, 'strip', 0, H - 0.02, Z0 + 0.6, { to: [0, H - 0.02, Z1 - 0.6], K: 3400, power: 0.7, clip: [X0, -0.2, Z0, X1, H, Z1 + 0.5] });
    handLine(s, [[X0 + 0.04, Z0 + 0.3], [X0 + 0.04, Z1 - 0.2]], 1.0, { side: 1 }); handLine(s, [[X1 - 0.04, Z0 + 0.3], [X1 - 0.04, Z1 - 0.2]], 1.0, { side: -1 });
    s.zoneBox({ id: 'axle-passage', place: 'axle-ring', box: [X0, -0.5, Z0, X1, H, Z1], name: 'The back wall', sub: 'The back axle · to the slow ring', ambience: 'station', reverb: 'room', headroom: H });
  }
  // ---- the ring: floor and ceiling right round. These are the ring itself, and never move.
  const LX = 9.5;                                                   // the landing: |x| < LX; past it, ring crew only
  s.structure(() => { g.mat('deckplate', '#7a746a'); g.box(-XR, -0.02, RZ0, XR, 0, RZ1, { faces: 'Y' }); });
  s.structure(() => { g.mat('felt', '#d8ccb4'); g.box(-XR, RH, RZ0, XR, RH + 0.02, RZ1, { faces: 'y' }); });
  s.solid(-LX - 2, -0.5, RZ0, LX + 2, 0, RZ1); s.solid(-LX - 2, RH, RZ0, LX + 2, RH + 0.5, RZ1);
  s.deco(() => {
    // a brass seam where the ring meets the drum, and painted bands on the ring's floor
    g.mat('cast', '#c9a24a', { rough: -0.1 }); g.box(-XR, 0, RZ0, XR, 0.012, RZ0 + 0.08, { faces: 'Yz' });
    g.mat('paint', '#2f6f73'); g.box(-XR, 0.004, RZ0 + 1.2, XR, 0.008, RZ0 + 1.35, { faces: 'Y' }); g.box(-XR, 0.004, RZ1 - 1.35, XR, 0.008, RZ1 - 1.2, { faces: 'Y' });
    g.mat('paint', '#c9552e'); for (let x = -XR; x < XR - 1; x += 6) g.box(x, 0.006, RZ0 + 2.7, x + 2, 0.01, RZ0 + 3.1, { faces: 'Y' });
    // lamp strips round the ceiling, the whole way
    g.mat('diffuser', '#ffe0b0', { emissive: 4 }); g.box(-XR, RH - 0.03, RZ0 + 0.9, XR, RH, RZ0 + 1.05, { faces: 'y' }); g.box(-XR, RH - 0.03, RZ1 - 1.05, XR, RH, RZ1 - 0.9, { faces: 'y' });
    // overhead hand lines, all the way round, and hanging loops
    g.mat('cast', '#b08a45', { rough: -0.1 }); for (const z of [RZ0 + 2.2, RZ1 - 2.2]) g.box(-XR, RH - 0.5, z - 0.02, XR, RH - 0.46, z + 0.02, { faces: 'yYzZ' });
  });
  s.detail(() => { g.mat('weave', '#c9552e'); for (let x = -LX + 0.5; x < LX; x += 0.8) for (const z of [RZ0 + 2.2, RZ1 - 2.2]) g.tube([[x, RH - 0.48, z], [x, RH - 0.9, z], [x + 0.1, RH - 1.0, z], [x + 0.2, RH - 0.9, z], [x + 0.2, RH - 0.48, z]], 0.012, { segs: 4 }); });
  for (const x of [-6, -2, 2, 6]) s.light({ at: [x, RH - 0.25, (RZ0 + RZ1) / 2], color: warm(3000), power: 2.4, range: 7, clip: [-LX - 3, -0.3, RZ0, LX + 3, RH, RZ1] });
  s.ambient({ box: [-XR, -0.5, RZ0, XR, RH, RZ1], sky: '#ffdcae', ground: '#8a7a68', power: 0.28, spec: 0.4, allRound: true });
  // gates at both ends of the landing: ring crew only
  for (const sx of [-1, 1]) {
    const x = sx * LX;
    s.furniture(() => {
      g.mat('cast', '#3a3430'); for (let z = RZ0 + 0.3; z < RZ1; z += 1.1) g.tube([[x, 0, z], [x, 1.1, z]], 0.025, { segs: 6 });
      g.mat('paint', '#d6a640'); g.tube([[x, 1.1, RZ0 + 0.1], [x, 1.1, RZ1 - 0.1]], 0.035, { segs: 8 }); g.tube([[x, 0.55, RZ0 + 0.1], [x, 0.55, RZ1 - 0.1]], 0.02, { segs: 6 });
    });
    s.solid(x - 0.06, 0, RZ0, x + 0.06, RH, RZ1);
    sign(s, { kind: 'plate', text: 'RING CREW ONLY', sub: 'the ring is 377 metres round' }, x - sx * 0.05, 1.3, (RZ0 + RZ1) / 2, { face: sx > 0 ? 'x' : 'X', w: 0.56, h: 0.2 });
  }
  // the bench on the ring, facing the still side, with a line to hold
  const BZ = 66.2;
  prop(s, 'bench', -1.4, 0, BZ, 0, { w: 2.2, back: true, wood: '#7a5233' }, { noSpots: true });
  prop(s, 'bench', 1.4, 0, BZ, 0, { w: 2.2, back: true, wood: '#7a5233' }, { noSpots: true });
  handLine(s, [[-2.6, BZ + 0.35], [2.6, BZ + 0.35]], 0.62, { side: 1 });
  for (const x of [-2.1, -0.7, 0.7, 2.1]) s.spot('sit', x, 0.46, BZ, 0, { tags: ['wait'] });
  // the plate on the ring
  sign(s, { kind: 'board', title: 'THE SLOW RING', lines: ['It lets go of the drum\'s turn.', 'A little under two minutes.', 'Sit, hold the line, mind your cup.'], palette: ['#1e1c1a', '#f3e6c8', '#3fe0d0'] }, 4.2, 1.7, RZ0 + 0.3, { face: 'Z', w: 1.3, h: 0.55, glow: 0.8 });
  s.interact({ x: 4.2, y: 1.5, z: RZ0 + 0.9, radius: 1.3, prompt: 'Read the plate', onUse: async (gm) => {
    await say(gm, 'The slow ring', ['The ring is 377 metres round, six deep, and turns with the drum until you ask it not to. Then, over a little under two minutes, it lets go of the turn, or rather the world round it does.', 'The wall in front of you is the still side. It looks as if it is turning. It is not. Twelve car ports in it, one for each gallery\'s car; when the ring is still, one of them stops in front of the bench.']);
  } });
  // the ring crew's post
  s.spot('counter', -3.4, 0, RZ0 + 1.0, PI * 0.15, { tags: ['ring', 'keeper'] });
  s.interact({ x: -3.4, y: 1.2, z: RZ0 + 1.6, radius: 1.4, kind: 'talk', prompt: 'Talk to the ring crew', onUse: async (gm) => {
    const k = (gm.flags['axle.ringcrew'] = (gm.flags['axle.ringcrew'] || 0) + 1);
    const L = [['For the Window, then. Sit on the bench, hold the line, and do not let go when your stomach tells you to. You are going from a fiftieth of a g to nothing at all.', 'The car will be at the port when the ring stops. It always is. That is most of what I do: make sure it always is.'],
      ['The children love it. The adults go quiet. The old ones who were chosen again close their eyes for the first minute and then open them.'],
      ['Three hundred and seventy-seven metres round. I have walked it twice, for a bet, with a lamp. Nothing to see but more ring.']];
    await say(gm, RINGKEEP, L[(k - 1) % L.length]);
  } });

  // ---- the two walls that move: the drum's (behind you) and the still side's (in front)
  const NPORT = 12, PW = C / NPORT;
  const nearW = movingMesh(s, (mg) => {
    mg.mat('panel', '#d9a441'); mg.box(1.45, 0, -0.01, C - 1.45, RH, 0, { faces: 'Z' }); mg.box(-1.45, 2.7, -0.01, 1.45, RH, 0, { faces: 'Z' });
    mg.mat('panel', '#2f5d5a'); mg.box(1.45, 0, 0, C - 1.45, 1.0, 0.01, { faces: 'Z' });
    mg.mat('paint', '#1e1c1a'); for (let x = 6; x < C - 5; x += 12) mg.box(x, 1.0, 0.0, x + 0.4, RH, 0.012, { faces: 'Z' });
    mg.mat('cast', '#3a3430'); mg.box(-1.5, 0, 0, -1.4, 2.75, 0.06); mg.box(1.4, 0, 0, 1.5, 2.75, 0.06); mg.box(-1.5, 2.7, 0, 1.5, 2.8, 0.06);
  }, { origin: [0, 0, RZ0], center: [0, RH / 2, 0], radius: 200, far: 600 });
  const ports = [];
  for (let i = 0; i < NPORT; i++) ports.push(signRect(game.atlas, { kind: 'plate', text: 'PORT ' + ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE'][i], sub: 'to gallery ' + (i + 1) }, 0.7, 0.26));
  const farW = movingMesh(s, (mg) => {
    // the still side: dark grey, broad yellow stripes so you can see it move, and the twelve car ports
    for (let i = 0; i < NPORT; i++) {
      const xc = PW * i;                                                            // port i centred at x = PW * i
      mg.mat('panel', '#4a4c50');
      mg.box(xc + 1.6, 0, 0, xc + PW - 1.6, RH, 0.01, { faces: 'z' });
      mg.box(xc - 1.6, 2.6, 0, xc + 1.6, RH, 0.01, { faces: 'z' });
      mg.mat('paint', '#d6a640'); for (let x = xc + 3; x < xc + PW - 3; x += 4) mg.box(x, 0.9, -0.005, x + 1.6, 1.25, 0.0, { faces: 'z' });
      // the port: a heavy hatch frame, the hatch shut, chevrons
      mg.mat('cast', '#2a2c2e'); mg.box(xc - 1.6, 0, -0.18, xc - 1.2, 2.6, 0.0); mg.box(xc + 1.2, 0, -0.18, xc + 1.6, 2.6, 0.0); mg.box(xc - 1.6, 2.3, -0.18, xc + 1.6, 2.6, 0.0);
      mg.mat('panel', '#5d6461'); mg.box(xc - 1.2, 0, 0.0, xc + 1.2, 2.3, 0.02, { faces: 'z' });
      mg.mat('paint', '#1e1c1a'); for (let k = 0; k < 6; k++) mg.box(xc - 1.58, 0.2 + k * 0.38, -0.185, xc - 1.22, 0.38 + k * 0.38, -0.18, { faces: 'z' });
      mg.mat('paint', '#d6a640'); for (let k = 0; k < 6; k++) mg.box(xc + 1.22, 0.2 + k * 0.38, -0.185, xc + 1.58, 0.38 + k * 0.38, -0.18, { faces: 'z' });
      mg.mat('cast', '#b08a45'); mg.box(xc - 0.1, 1.0, -0.04, xc + 0.1, 1.3, 0.0);
      const R = ports[i].rect; mg.atlas(R.page, { emissive: 0.6 });
      mg.quad([xc + 0.35, 2.32, -0.19], [xc - 0.35, 2.32, -0.19], [xc - 0.35, 2.58, -0.19], [xc + 0.35, 2.58, -0.19], { uv: [R.u0, R.v1, R.u1, R.v0] });
    }
  }, { origin: [0, 0, RZ1], center: [0, RH / 2, 0], radius: 200, far: 600 });
  s.solid(-LX - 2, 0, RZ1, LX + 2, RH, RZ1 + 0.3); s.solid(-LX - 2, 2.7, RZ0 - 0.2, LX + 2, RH, RZ0);
  s.solid(-LX - 2, 0, RZ0 - 0.2, -1.45, RH, RZ0); s.solid(1.45, 0, RZ0 - 0.2, LX + 2, RH, RZ0);

  // ---- the ride
  const ride = st.ride = { phase: 'idle', t: 0, T: 0 };
  s.every((dt, gm) => {
    if (ride.phase === 'idle') { farW.origin[0] = wrapC(farW.origin[0] - V * dt); nearW.origin[0] = 0; return; }
    ride.t += dt;
    if (ride.phase === 'down') {
      const k = smoothstep(0, 1, ride.t / ride.T);
      farW.origin[0] = wrapC(farW.origin[0] - V * (1 - k) * dt);
      nearW.origin[0] = wrapC(nearW.origin[0] + V * k * dt);
      gm.player.gOverride = Math.max(0.001, 0.02 * (1 - k));
      if (ride.t >= ride.T) { ride.phase = 'wheel'; ride.t = 0; farW.origin[0] = Math.round(farW.origin[0] / PW) * PW; }
    } else if (ride.phase === 'wheel') nearW.origin[0] = wrapC(nearW.origin[0] + V * dt);
  });
  place.letGo = (gm) => letGo(gm || game, f, ride, farW, PW); place.rideState = ride;                       // a hook for tests and play-throughs
  s.interact({ x: 0, y: 0.9, z: BZ - 0.3, radius: 1.8, prompt: (gm) => (ride.phase === 'idle' ? 'Sit, hold the line, and let the ring go' : 'Hold on'), onUse: (gm) => letGo(gm, f, ride, farW, PW) });
  s.path([[0, 59.0], [0, 63.0], [0, 65.2], [0, 68.6]]); s.path([[0, 65.2], [-3.4, 65.2]]); s.path([[0, 65.2], [5.0, 65.2]]);
  s.zoneBox({ id: 'axle-ring', place: 'axle-ring', box: [-XR, -0.5, RZ0, XR, RH, RZ1], name: 'The slow ring', sub: 'The back axle · the despun chamber', ambience: 'station', reverb: 'room', headroom: RH, env: ENV_RING }).allRound = true;
  s.loop('cab-hum', 0, 1.5, 67, { vol: 0.5, radius: 14 }); s.loop('air', 0, 3, 67, { vol: 0.3, radius: 10 });
}
function wrapC(x) { x = x % C; if (x > C / 2) x -= C; if (x < -C / 2) x += C; return x; }

// Letting go of the turn: the far wall slows and stops with a port in front of you, the drum's wall behind you starts to
// wheel, and then the car.
async function letGo(game, f, ride, farW, PW) {
  if (ride.phase !== 'idle' || game.busy) return;
  const p = game.player;
  game.busy++;
  try {
    p.sit({ x: 0, y: 0.0, z: 66.2 + 0.05, yaw: PI, eye: 1.12 }); p.yaw = PI; p.pitch = 0.04; p.locked = true;
    // how long, so that a port comes to rest in front of the bench: it travels V * T / 2 as it slows
    const o0 = farW.origin[0], d = ((o0 % PW) + PW) % PW;
    let dist = d; while (dist < V * 12 / 2) dist += PW;
    ride.T = 2 * dist / V; ride.t = 0; ride.phase = 'down';
    toast(game, 'You take hold of the line. A bell, somewhere under the floor, and the ring lets go of the turn.');
    sfx(game, 'bell', f, 0, 1, 66);
    await wait(ride.T * 0.45 * 1000);
    toast(game, 'The far wall is slowing. It was never turning. You were.');
    await wait(ride.T * 0.55 * 1000);
    toast(game, 'The still side has stopped. Behind you, the whole hall begins to wheel round you, once, in a little under two minutes.', 'info');
    await wait(6500);
    if (game.ui) await game.ui.fade(true, 1.0);
    const sp = game.spawns['still-dock'];
    p.locked = false; p.stand(); p.gOverride = null;
    ride.phase = 'idle'; ride.t = 0;
    if (sp) p.place(sp.frame, sp.x, sp.y, sp.z, sp.yaw || 0, 0);
    if (game.ui) { await game.ui.fade(false, 1.2); game.ui.banner('The still side', 'nothing here turns'); toast(game, 'A short armoured car along a shielded track, out through the radiator layer. Here nothing weighs anything; the slippers and the felt give you back a little.'); }
  } finally { game.busy--; if (p.locked) p.locked = false; }
}
function wait(ms) { return new Promise((res) => setTimeout(res, ms)); }
