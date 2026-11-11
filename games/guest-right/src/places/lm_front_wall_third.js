// The front Third: tier ten of the front wall, five hundred metres above the floor and a thousand below the axis, a third
// of a g. Chervil marries here, at dusk, because the last of the light is the couple's. The Two Lids, a round floor under a
// light frame hung with cloth, where the couple stand and swap their halls' lids; the long table laid for the wedding
// supper, two facing rows of chairs, everything under lids, the two halls' dishes in the middle; the band's corner; the
// petal bag (cloth petals: at a third of a g a thrown handful takes a long while to come down); the riser's flats; the
// cab lobby and the wall lift down to the Warming Shelf.
import { lamp, block, stairs } from '../world/kit.js';
import { planter } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { Rng } from '../core/util.js';
import { PI, ENV, SKY, runX, lineX, toast, find, sfx, say, readSpec, seat, hours, sunOf, skyGlow, bentFloor, riser, broadRail, netX, endPier, cabLobby, wallLift, lanternString, petals, tide, duskShare } from './lm_front_wall_parts.js';

export const thirdParts = true;

const KNOCK = [
  ['A note on the door: Gone down for the wedding. We are the ones at the end of the table with the cushions.'],
  ['A voice: If it is about the chairs, take the chairs. Bring them back after.'],
  ['Nobody answers. A pair of dancing shoes, resoled twice, stand on the step to air.'],
];

export function buildThird(game) {
  const W = game.world;
  const f = W.frame('fwall10', 1000, 0, 0); f.hollowView = true;
  const s = W.scope('fw-third', f), g = s.g;
  const X0 = -34, X1 = 34, ZR = 17, H = 12.6;
  const clip = [X0 - 0.5, -2, -0.8, X1 + 0.5, H + 1, ZR + 1.6];
  const r = new Rng(1000);
  const OAK = '#8a6240';

  // ---- the shelf, the rail and its high net, the piers
  bentFloor(s, X0, 0, X1, ZR, 0, 'stone', '#cbbca2', 8);
  runX(X0 + 0.8, X1 - 0.8, 8, (a, b) => { g.mat('stone', '#a6967c'); g.box(a, 0, ZR - 0.5, b, 0.006, ZR, { faces: 'Y' }); g.box(a, 0, 0.9, b, 0.006, 1.2, { faces: 'Y' }); });
  s.flush({ tier: 's', cast: false });
  broadRail(s, { x0: X0 + 0.8, x1: X1 - 0.8, zr: ZR, stone: '#bdae94', bronze: '#5a4a33', oak: OAK, barrier: 6.5 });
  endPier(s, X0, X0 + 0.8, ZR, H, { inner: 1, tint: '#dcc4b0' }); endPier(s, X1 - 0.8, X1, ZR, H, { inner: -1, tint: '#dcc4b0' });
  const ZN = ZR + 0.2;
  for (let x = X0 + 1.2; x <= X1 - 1.1; x += 5.8) { g.mat('cast', '#5a4a33'); g.lathe(x, ZN, [[0.07, 0.62], [0.05, 0.75], [0.04, 5.3], [0.06, 5.36], [0.03, 5.5], [0, 5.55]], { segs: 8 }); }
  s.flush({ tier: 's' });
  netX(s, { x0: X0 + 0.8, x1: X1 - 0.8, z: ZN, y0: 1.12, y1: 5.2, cell: 0.44, tint: '#e6dcc0' });

  // ---- the riser and its flats
  const fac = riser(s, { x0: X0 + 0.8, x1: X1 - 0.8, h: H, tint: '#dcc6b2', stone: '#b4a48a', trim: '#7a2a5a', gaps: [[-33.2, -25.8], [-24.4, -20.8]], doors: [-14.5, -3, 13.5], seed: 10, lit: 0.5 });
  fac.doors.forEach((d, i) => {
    sign(s, { kind: 'plate', text: 'Tier ten · ' + (i * 4 + 3), sub: i === 1 ? 'chairs lent' : 'please knock' }, d.x + 0.95, 1.5, 0.17, { face: 'Z' });
    lamp(s, 'sconce', d.x - 0.95, 2.45, 0.17, { face: 'Z', K: 2500, power: 0.55, night: true, clip });
    prop(s, 'plant', d.x + 1.05, 0, 0.55, 0, { kind: i % 2 ? 'fern' : 'flower', size: 0.9, pot: ['#a3563a', '#2f6f73', '#c9a24a'][i % 3] });
    s.interact({ x: d.x, y: 1.2, z: 0.6, radius: 1.2, prompt: 'Knock', onUse: async (gm) => { sfx(gm, 'knock', f, d.x, 1.2, 0.2); await say(gm, 'The door', KNOCK[i % KNOCK.length]); } });
  });
  for (const x of [-18.6, 7.4, 19.2]) planter(s, x, 0, 0.55, { w: 1.6, d: 0.5, h: 0.5, plants: 'flower', tint: '#a89a84' });

  // ---- the tier plate and the rail
  sign(s, { kind: 'plate', text: 'TIER TEN · THE THIRD', sub: 'five hundred metres up · a third of a g' }, 6, 0.82, ZR - 0.005, { face: 'z', w: 0.5, h: 0.2 });
  s.interact({ x: 6, y: 1.0, z: ZR - 0.5, radius: 1.3, prompt: 'Read the tier plate', onUse: async (gm) => {
    await say(gm, 'Tier ten', ['Tier ten, the Third: five hundred metres above the floor, a thousand below the axis, and a third of your weight. Seventy kilos at the rim is twenty-three here.', 'A leap goes three times as high as at the rim and lands a little spinward. The net is there because a child on the parapet could jump it.']);
    find(gm, 'terraces-lighter');
  } });
  for (const lx of [-24, 18]) s.interact({ x: lx, y: 1.2, z: ZR - 0.35, radius: 1.4, prompt: 'Lean on the rail', onUse: async (gm) => { await say(gm, 'The rail', railLines(gm)); } });

  // =============================================================================================================
  // The Two Lids: the round floor, its frame and cloth, the couple's place
  // =============================================================================================================
  const RCX = -10.5, RCZ = 9.2, RR = 6.0, DY = 0.15, NP = 48;
  { const poly = []; for (let i = 0; i < NP; i++) { const a = i / NP * PI * 2; poly.push([RCX + Math.cos(a) * RR, RCZ + Math.sin(a) * RR]); }
    g.mat('wood', '#5a3a22'); g.prism(poly, 0, DY - 0.004); s.flush({ tier: 's', cast: false });
    // the top: sixteen wedges of boards in two shades, a dark border
    for (let k = 0; k < 16; k++) {
      const w = []; const a0 = k / 16 * PI * 2, a1 = (k + 1) / 16 * PI * 2;
      for (let i = 0; i <= 3; i++) { const a = a0 + (a1 - a0) * i / 3; w.push([RCX + Math.cos(a) * (RR - 0.35), RCZ + Math.sin(a) * (RR - 0.35)]); }
      w.unshift([RCX, RCZ]);
      g.mat('planks', k % 2 ? '#c08a4e' : '#b07a42'); g.prism(w, DY - 0.004, DY, { capBottom: false });
    }
    g.mat('wood', '#6a3e22'); { const ring = []; for (let i = 0; i < NP; i++) { const a = i / NP * PI * 2; ring.push([RCX + Math.cos(a) * RR, RCZ + Math.sin(a) * RR]); } g.prism(ring, DY - 0.003, DY - 0.001, { capBottom: false }); }
    s.flush({ tier: 's', cast: false });
  }
  s.structure(() => {
    g.mat('cast', '#c8a45a', { rough: -0.15 });
    const ring = (rr, y) => { const p = []; for (let i = 0; i < NP; i++) { const a = i / NP * PI * 2; p.push([RCX + Math.cos(a) * rr, y, RCZ + Math.sin(a) * rr]); } return p; };
    g.tube(ring(RR, DY - 0.01), 0.03, { segs: 5, closed: true }); g.tube(ring(RR - 0.35, DY + 0.002), 0.012, { segs: 4, closed: true });
    // the medallion: a teal disc and two brass rings lying over each other, the two lids
    g.mat('mosaic', '#2f6f73'); g.lathe(RCX, RCZ, [[1.25, DY + 0.003], [0, DY + 0.0035]], { segs: 32, capTop: false, capBottom: false });
    g.mat('mosaic', '#e8b45a'); g.lathe(RCX, RCZ, [[1.32, DY + 0.0025], [1.25, DY + 0.003]], { segs: 32, capTop: false, capBottom: false });
    g.mat('cast', '#d6a640', { rough: -0.2 });
    for (const dx of [-0.32, 0.32]) { const p = []; for (let i = 0; i < 28; i++) { const a = i / 28 * PI * 2; p.push([RCX + dx + Math.cos(a) * 0.5, DY + 0.008, RCZ + Math.sin(a) * 0.5]); } g.tube(p, 0.018, { segs: 4, closed: true }); }
    // the two footplates where the couple stand
    for (const dx of [-0.95, 0.95]) { g.mat('cast', '#b08a45', { rough: -0.25 }); g.lathe(RCX + dx, RCZ + 0.15, [[0.2, DY], [0.19, DY + 0.006], [0, DY + 0.007]], { segs: 20 }); }
  });
  // its collider: slices of the circle (a step of fifteen centimetres)
  for (let k = 0; k < 10; k++) { const z0 = RCZ - RR + 2 * RR * k / 10, z1 = z0 + 2 * RR / 10, zm = Math.abs((z0 + z1) / 2 - RCZ), hw = Math.sqrt(Math.max(0, RR * RR - zm * zm)); s.solid(RCX - hw, 0, z0, RCX + hw, DY, z1, { surf: 'wood' }); }
  // the frame: ten slender posts, a ring beam, a crown, cloth from the beam up to the crown, swags between the posts
  const PR = 5.6, YT = DY + 4.4, YC = YT + 1.1, NPOST = 10;
  const PA = (k) => k / NPOST * PI * 2 + PI / NPOST;
  const PP = (k, rr, y) => [RCX + Math.cos(PA(k)) * rr, y, RCZ + Math.sin(PA(k)) * rr];
  for (let k = 0; k < NPOST; k++) {
    const p = PP(k, PR, 0);
    g.mat('cast', '#3a3430'); g.lathe(p[0], p[2], [[0.12, DY], [0.11, DY + 0.06], [0.05, DY + 0.12], [0.045, YT - 0.1], [0.07, YT]], { segs: 10 });
    g.mat('cast', '#d6a640'); g.ball(p[0], YT + 0.08, p[2], 0.06, 0.06, 0.06, { segs: 8, rings: 5 });
    s.post(p[0], p[2], 0.08, 0, YT);
  }
  s.flush({ tier: 's' });
  { const ring = []; for (let i = 0; i < 40; i++) { const a = i / 40 * PI * 2; ring.push([RCX + Math.cos(a) * PR, YT, RCZ + Math.sin(a) * PR]); }
    g.mat('cast', '#3a3430'); g.tube(ring, 0.035, { segs: 5, closed: true });
    const crown = []; for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; crown.push([RCX + Math.cos(a) * 0.55, YC, RCZ + Math.sin(a) * 0.55]); } g.tube(crown, 0.03, { segs: 5, closed: true });
    s.flush({ tier: 's' }); }
  const CLOTH = ['#e8b45a', '#d95d7a', '#efe2c4', '#2f8f8a', '#c9552e', '#efe2c4', '#7a2a5a', '#e8b45a', '#efe2c4', '#d98a7a'];
  for (let k = 0; k < NPOST; k++) {
    const k1 = (k + 1) % NPOST;
    g.mat('weave', CLOTH[k], { rough: 0.05 });
    g.sheet(PP(k, PR, YT), PP(k1, PR, YT), PP(k1, 0.55, YC), PP(k, 0.55, YC), { nu: 5, nv: 4, sag: 0.32, sagEdge: 'all' });
    g.mat('weave', CLOTH[(k + 3) % NPOST]);
    g.sheet(PP(k, PR + 0.02, YT), PP(k1, PR + 0.02, YT), PP(k1, PR + 0.02, YT - 0.45), PP(k, PR + 0.02, YT - 0.45), { nu: 6, nv: 2, sag: 0.4 });
    s.flush({ tier: 's', cast: false });
  }
  // little cloth lanterns at the post tops, and the light: a lantern under the crown and four lamps on the beam
  s.deco(() => { for (let k = 0; k < NPOST; k++) { const p = PP(k, PR - 0.12, YT - 0.25); g.mat('paper', ['#f2b56b', '#e8743b', '#f0d070', '#d95d7a'][k % 4], { emissive: 2.4, lamp: true }); g.lathe(p[0], p[2], [[0.04, p[1] - 0.12], [0.1, p[1] - 0.06], [0.11, p[1]], [0.09, p[1] + 0.06], [0.04, p[1] + 0.1]], { segs: 8 }); } });
  lamp(s, 'lantern', RCX, YC - 0.1, RCZ, { tint: '#f2b56b', drop: 0.9, power: 1.2, clip, lampFlag: true });
  for (const k of [1, 3, 6, 8]) { const p = PP(k, PR - 0.2, YT - 0.15); s.light({ at: p, type: 'spot', dir: [RCX - p[0], -3.2, RCZ - p[2]], cone: [58, 30], K: 2700, color: [1, 0.74, 0.5], power: 4.5, range: 10, lamp: true, clip }); }
  // the couple's stand: a turned post with a board, two lids on it, and the apple with a knife
  { const SX = RCX, SZ = RCZ + 0.15;
    g.mat('wood', '#6b4a2f'); g.lathe(SX, SZ, [[0.2, DY], [0.18, DY + 0.05], [0.06, DY + 0.1], [0.05, DY + 0.8], [0.09, DY + 0.86], [0.09, DY + 0.88]], { segs: 14 });
    g.box(SX - 0.36, DY + 0.88, SZ - 0.2, SX + 0.36, DY + 0.92, SZ + 0.2, { bevel: 0.01 });
    s.flush({ tier: 's', cast: true }); s.post(SX, SZ, 0.2, 0, DY + 0.92);
    s.detail(() => {
      const top = DY + 0.92;
      g.mat('glaze', '#2f6f73', { rough: -0.25 }); g.lathe(SX - 0.2, SZ - 0.03, [[0.13, top], [0.12, top + 0.04], [0.06, top + 0.08], [0.02, top + 0.09], [0.025, top + 0.12], [0, top + 0.125]], { segs: 18 });
      g.mat('glaze', '#d6a640', { rough: -0.25 }); g.lathe(SX + 0.2, SZ - 0.03, [[0.13, top], [0.12, top + 0.04], [0.06, top + 0.08], [0.02, top + 0.09], [0.025, top + 0.12], [0, top + 0.125]], { segs: 18 });
      g.mat('glaze', '#efe6d2'); g.lathe(SX, SZ + 0.1, [[0, top], [0.08, top], [0.09, top + 0.012], [0, top + 0.008]], { segs: 16 });
      g.mat('plain', '#b8302a', { rough: -0.3 }); g.ball(SX, top + 0.045, SZ + 0.1, 0.04, 0.036, 0.04, { segs: 12, rings: 8 });
      g.mat('bark', '#6b5a48'); g.tube([[SX, top + 0.078, SZ + 0.1], [SX + 0.004, top + 0.095, SZ + 0.1]], 0.003, { segs: 3 });
      g.mat('brushed', '#c9c4bb'); g.box(SX + 0.06, top, SZ + 0.13, SX + 0.15, top + 0.004, SZ + 0.142); g.mat('wood', '#4a3020'); g.box(SX + 0.15, top, SZ + 0.127, SX + 0.22, top + 0.012, SZ + 0.145);
    });
  }
  for (const dx of [-0.95, 0.95]) s.spot('stand', RCX + dx, DY, RCZ + 0.15, dx < 0 ? PI / 2 : -PI / 2, { tags: ['wedding', 'couple', 'evening'] });
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2, px = RCX + Math.cos(a) * 3.4, pz = RCZ + Math.sin(a) * 3.4; s.spot('stand', px, DY, pz, Math.atan2(RCX - px, RCZ - pz), { tags: ['dance', 'wedding', 'evening'] }); }
  s.interact({ x: RCX, y: 1.1, z: RCZ - 0.7, radius: 1.4, prompt: 'Stand where the couple stand', onUse: async (gm) => {
    await say(gm, 'The Two Lids', ['Two brass footplates in the middle of the floor, rubbed bright, and a turned stand between them with two lids on it and one apple.', 'This is where a Chervil couple stand at dusk. Each of their halls sends a dish under its own lid. The couple swap the lids, each putting their own hall\'s lid on the other\'s dish, and from then on they eat at each other\'s table.', 'Then the apple is cut crosswise between them and both halves held up for the star, because an apple is never for one. Then the block clerk hands over the key of a Margin flat, lent for five years.']);
    find(gm, 'apple-star');
  } });
  // chairs in an arc on the anti side, for the ones who would rather sit and watch
  { const AC = ['#7a2f3c', '#2f5d5a', '#5b4060', '#8a5a2a', '#3a4a6a', '#6b3a3a', '#4a5a3a'];
    for (let i = 0; i < 7; i++) {
      const a = PI * (0.76 + 0.48 * i / 6), px = RCX + Math.cos(a) * 7.2, pz = RCZ + Math.sin(a) * 7.2, yaw = Math.atan2(RCX - px, RCZ - pz);
      prop(s, 'fw.armchair', px, 0, pz, yaw, { cloth: AC[i], throw: i % 2 ? '#e2c48a' : undefined });
      if (i === 3) seat(s, px, 0, pz, yaw, 'Sit and watch the floor', { eye: 1.05, radius: 0.9 });
    }
  }

  // ---- the wedding board on an easel, and the petal bag
  const BX = -2.6, BZ = 3.2;
  g.mat('wood', '#6b4a2f'); g.tube([[BX - 0.3, 0, BZ - 0.05], [BX - 0.3, 1.75, BZ + 0.12]], 0.02, { segs: 5 }); g.tube([[BX + 0.3, 0, BZ - 0.05], [BX + 0.3, 1.75, BZ + 0.12]], 0.02, { segs: 5 }); g.tube([[BX, 0, BZ - 0.6], [BX, 1.7, BZ + 0.1]], 0.016, { segs: 5 }); s.flush({ tier: 'd' });
  const board = { kind: 'notice', title: 'Tonight on the Two Lids', lines: ['Noor Abara, of Ropewalk,', 'and Kit Lund, of Saffron Yard.', 'At the dusk, then supper.', 'Ropewalk\'s hall sends', 'mushroom dumplings.', 'Saffron Yard\'s hall sends', 'a saffron soufflé.', 'Aunts at the near end.', 'Petals in the bag. Throw high.'] };
  sign(s, board, BX, 1.2, BZ + 0.16, { face: 'Z', w: 0.62, h: 0.9 });
  s.solid(BX - 0.4, 0, BZ - 0.6, BX + 0.4, 1.7, BZ + 0.2);
  s.interact({ x: BX, y: 1.2, z: BZ + 0.85, radius: 1.1, prompt: 'Read the wedding board', onUse: (gm) => readSpec(gm, board, 'Pinned under it, a card in a child\'s hand: we are allowed to throw first.') });
  const PBX = -3.0, PBZ = 7.4;
  prop(s, 'fw.petalbag', PBX, 0, PBZ, 0, { cloth: '#e2c48a' });
  sign(s, { kind: 'label', text: 'PETALS', sub: 'cloth offcuts · throw high · we sweep them up' }, PBX, 0.62, PBZ + 0.3, { face: 'Z', w: 0.36, h: 0.12 });
  let pet = null; try { pet = petals(s, { x: RCX, z: RCZ, n: 120, g: 3.27, floorAt: (x, z) => (Math.hypot(x - RCX, z - RCZ) < RR ? DY : 0) }); } catch (e) { console.error('[lm-front-wall] petals: ' + e); pet = null; }
  let thrownAt = 0, watching = false;
  s.every((dt, gm) => { if (!watching || !pet || pet.flying) return; watching = false; const secs = Math.round((performance.now() - thrownAt) / 1000); toast(gm || game, 'The last petal is down after ' + secs + ' seconds. They are swept up after, and kept in the bag for the next wedding.'); });
  s.interact({ x: PBX, y: 1.0, z: PBZ, radius: 1.4, prompt: 'Throw a handful of petals', onUse: (gm) => {
    if (!pet) { toast(gm, 'You throw a handful of cloth petals high over the floor. At a third of a g they hang there a long time before they settle.'); return; }
    if (pet.flying) { toast(gm, 'The last handful is still coming down.'); return; }
    const P = gm.player, px = P.pos.x, pz = P.pos.z, yaw = Math.atan2(RCX - px, -(RCZ - pz));
    pet.throw(px + Math.sin(yaw) * 0.5, (P.pos.y || 0) + 1.6, pz - Math.cos(yaw) * 0.5, yaw);
    sfx(gm, 'paper', f, px, 1.5, pz);
    thrownAt = performance.now(); watching = true;
    if (!gm.flags['fw.petals']) { gm.flags['fw.petals'] = true; toast(gm, 'Cloth petals, cut from the dyers\' offcuts. No cut flowers are wasted on a wedding: colour weighs nothing, and the petals are used again.'); }
  } });

  // =============================================================================================================
  // The long table, laid for the wedding supper: two facing rows, everything under lids
  // =============================================================================================================
  const TA = 0.8, TB = 24.2, TZ = 9.4;
  for (let i = 0; i < 9; i++) prop(s, 'table', TA + 1.3 + i * 2.6, 0, TZ, 0, { w: 2.58, d: 0.95, h: 0.74, wood: '#5a3a22', legs: 'trestle' });
  runX(TA, TB, 3, (a, b) => {
    g.mat('weave', '#efe6d2'); g.box(a, 0.741, TZ - 0.5, b, 0.746, TZ + 0.5, { faces: 'Y' }); g.box(a, 0.52, TZ - 0.505, b, 0.746, TZ - 0.5, { faces: 'z' }); g.box(a, 0.52, TZ + 0.5, b, 0.746, TZ + 0.505, { faces: 'Z' });
    g.mat('motif', '#7a2a5a'); g.box(a, 0.746, TZ - 0.17, b, 0.749, TZ + 0.17, { faces: 'Y' });
    g.mat('weave', '#e8b45a'); g.box(a, 0.53, TZ - 0.508, b, 0.56, TZ - 0.503, { faces: 'z' }); g.box(a, 0.53, TZ + 0.503, b, 0.56, TZ + 0.508, { faces: 'Z' });
  });
  g.mat('weave', '#efe6d2'); g.box(TA - 0.005, 0.52, TZ - 0.5, TA, 0.746, TZ + 0.5, { faces: 'x' }); g.box(TB, 0.52, TZ - 0.5, TB + 0.005, 0.746, TZ + 0.5, { faces: 'X' });
  s.flush({ tier: 's', cast: false });
  const WOODS = ['#6b4a2f', '#4a3020', '#8a6240', '#5a3a22'], GL = ['#e9e1cf', '#2f6f73', '#c9763e', '#d98a7a', '#e9e1cf', '#5b4060'];
  let n = 0;
  for (let x = TA + 0.5; x < TB - 0.3; x += 0.68, n++) {
    for (const side of [-1, 1]) {
      const cz = TZ + side * 0.78, yaw = side < 0 ? 0 : PI;
      prop(s, 'chair', x + r.f(-0.04, 0.04), 0, cz + r.f(-0.03, 0.03), yaw + r.f(-0.08, 0.08), { wood: WOODS[(n + (side > 0 ? 1 : 0)) % 4], back: (n + side) % 2 ? 'slat' : 'hoop', seat: ['#d9c08a', '#c9a46a', '#b8584a'][n % 3] }, { spot: { tags: ['eat', 'wedding', 'evening'] } });
      const pz = TZ + side * 0.3, gl = GL[(n * 2 + (side > 0 ? 1 : 0)) % GL.length];
      prop(s, 'plate', x, 0.749, pz, 0, { glaze: '#ece5d6' });
      prop(s, 'bowl', x, 0.763, pz, 0, { glaze: gl, lid: gl === '#e9e1cf' ? '#d6a640' : '#e9e1cf', r: 0.07 });
      prop(s, 'cup', x + 0.2, 0.749, TZ + side * 0.22, 0, { glaze: GL[(n + 2) % GL.length] });
    }
  }
  // place cards, and a line of shared dishes and jugs down the middle
  s.detail(() => { for (let x = TA + 0.5; x < TB - 0.3; x += 0.68) for (const side of [-1, 1]) { g.mat('paper', '#f4ecd8'); const z = TZ + side * 0.42; g.box(x - 0.045, 0.749, z - 0.002, x + 0.045, 0.785, z + 0.002); } });
  for (let x = TA + 1.0; x < TB - 0.5; x += 1.55) {
    if (Math.abs(x - 12.2) < 1.6) continue;
    const k = Math.round(x * 3) % 4;
    if (k === 0) prop(s, 'crock', x, 0.749, TZ, 0, { glaze: '#2f6f73', h: 0.24, r: 0.08 });
    else if (k === 1) prop(s, 'bowl', x, 0.749, TZ, 0, { glaze: '#c9763e', lid: '#e9e1cf', r: 0.12 });
    else if (k === 2) s.detail(() => { g.mat('wood', '#7a5233'); g.box(x - 0.22, 0.749, TZ - 0.13, x + 0.22, 0.77, TZ + 0.13, { bevel: 0.006 }); g.mat('weave', '#efe6d2'); g.sheet([x - 0.24, 0.85, TZ - 0.15], [x + 0.24, 0.85, TZ - 0.15], [x + 0.24, 0.8, TZ + 0.15], [x - 0.24, 0.8, TZ + 0.15], { nu: 4, nv: 3, sag: 0.03 }); g.mat('plain', '#c98f4e'); g.ball(x, 0.79, TZ, 0.18, 0.05, 0.1, { segs: 10, rings: 5, bottom: 0 }); });
    else prop(s, 'bowl', x, 0.749, TZ, 0, { glaze: '#e9e1cf', lid: '#7a2a5a', r: 0.1 });
  }
  // the two halls' dishes, side by side in the middle, each with its card
  prop(s, 'fw.tureen', 11.4, 0.749, TZ, 0, { glaze: '#2f6f73', lid: '#e9e1cf', r: 0.2 });
  prop(s, 'fw.tureen', 13.0, 0.749, TZ, 0, { glaze: '#d6a640', lid: '#7a2a5a', r: 0.19 });
  sign(s, { kind: 'label', text: 'ROPEWALK', sub: 'mushroom dumplings' }, 11.4, 0.83, TZ - 0.36, { face: 'z', w: 0.26, h: 0.08 });
  sign(s, { kind: 'label', text: 'SAFFRON YARD', sub: 'saffron soufflé' }, 13.0, 0.83, TZ - 0.36, { face: 'z', w: 0.26, h: 0.08 });
  // small lamps on the table
  for (const x of [3.2, 8.0, 16.4, 21.2]) {
    s.detail(() => { g.mat('cast', '#3a3430'); g.cyl(x, 0.749, TZ, 0.05, 0.02, { segs: 8 }); g.tube([[x, 0.77, TZ], [x, 1.0, TZ]], 0.008, { segs: 4 }); g.mat('weave', '#f0c880', { emissive: 1.8, lamp: true }); g.lathe(x, TZ, [[0.11, 0.95], [0.07, 1.1]], { segs: 10, capTop: false, capBottom: false }); });
    s.light({ at: [x, 1.0, TZ], K: 2400, color: [1, 0.66, 0.38], power: 0.9, range: 3.6, lamp: true, clip, radius: 0.06 });
  }
  s.interact({ x: 12.2, y: 1.0, z: TZ - 1.45, radius: 1.4, prompt: 'Look at the two hall dishes', onUse: async (gm) => {
    await say(gm, 'The two dishes', ['Two big lidded dishes in the middle of the table, each on its own board with its hall\'s card.', 'Ropewalk\'s hall has sent mushroom dumplings, sixty of them, steamed on the loop and carried up the wall in a hot box. Saffron Yard\'s has sent a saffron soufflé, which rises half again as tall at a third of a g and never quite comes back down.', 'Nobody lifts a lid till the couple have swapped them.']);
  } });
  s.interact({ x: 2.6, y: 1.0, z: TZ - 1.45, radius: 1.3, prompt: 'Read the place cards', onUse: async (gm) => {
    await say(gm, 'The place cards', ['Cards in two hands. On the wall side, Ropewalk: Noor\'s parents, then her four aunts, then her table\'s neighbours by age.', 'On the Hollow side, Saffron Yard, the same way round. The two rows face each other across the cloth, so that by the end of the supper everyone has met the people they will see at every naming from now on.', 'At the far end, a card in a third hand: Guests. Sit wherever there is a plate.']);
  } });
  seat(s, TB - 0.5, 0, TZ + 0.78, PI, "Sit at the guests' end", { radius: 0.9, onSit: (gm) => toast(gm, 'Somebody passes you a lidded bowl without asking where you are from. That comes later, after where you have slept.') });

  // ---- lantern strings over the table, from the riser to the net masts
  const LS = [];
  for (const x of [2.4, 8.2, 14.0, 19.8]) {
    const pts = lanternString(s, [x, 7.0, 0.45], [x + 0.6, 5.2, ZN - 0.15], ['#f2b56b', '#e8743b', '#f0d070', '#d95d7a', '#7aa8c8'], 11, 0.9);
    LS.push(pts[3], pts[7]);
    g.mat('cast', '#3a3430'); g.tube([[x, 7.0, 0.02], [x, 7.0, 0.48]], 0.025, { segs: 5 }); s.flush({ tier: 'd' });
  }
  for (const L of LS) s.light({ at: L, K: 2500, color: [1, 0.7, 0.45], power: 1.3, range: 6.5, lamp: true, clip, radius: 0.1 });

  // =============================================================================================================
  // The band's corner: a low stage against the riser, a hanging behind it
  // =============================================================================================================
  const BS0 = 26.4, BS1 = 32.6, BZ0 = 1.2, BZ1 = 5.2, BH = 0.35;
  block(s, BS0, 0, BZ0, BS1, BH - 0.01, BZ1, 'wood', '#5a3a22', { faces: 'xXzZ' });
  runX(BS0, BS1, 3, (a, b) => { g.mat('planks', '#b07a42'); g.box(a, BH - 0.012, BZ0, b, BH, BZ1, { faces: 'Y' }); }); s.flush({ tier: 's', cast: false });
  stairs(s, 29.5, 0, BZ1 + 0.6, 'z', BH, 0.6, 1.6, { mat: 'wood', tint: '#8a5a32', nosing: '#5a3a22' });
  g.mat('weave', '#7a2a5a'); g.sheet([BS0 + 0.2, 4.4, 0.08], [BS1 - 0.2, 4.4, 0.08], [BS1 - 0.2, 1.3, 0.1], [BS0 + 0.2, 1.3, 0.1], { nu: 10, nv: 3, ripple: 0.05, rippleN: 9 });
  g.mat('weave', '#e8b45a'); g.sheet([BS0 + 0.2, 4.45, 0.12], [BS1 - 0.2, 4.45, 0.12], [BS1 - 0.2, 4.0, 0.13], [BS0 + 0.2, 4.0, 0.13], { nu: 10, nv: 1, sag: 0.08 });
  g.mat('cast', '#3a3430'); g.tube(lineX(BS0 + 0.1, BS1 - 0.1, 4.47, 0.12, 2), 0.02, { segs: 5 }); s.flush({ tier: 's', cast: false });
  const BAND = [[27.6, 3.4, -0.8, 'flute'], [29.2, 2.4, -0.45, 'drum'], [31.0, 3.3, -0.3, 'flute']];
  for (const b of BAND) { prop(s, 'chair', b[0], BH, b[1], b[2], { wood: '#4a3020', back: 'slat' }, { noSpots: true }); s.spot('perform', b[0], BH, b[1] + 0.02, b[2], { tags: [b[3], 'band', 'wedding', 'evening'] }); }
  s.spot('perform', 29.9, BH, 4.4, -0.5, { tags: ['sing', 'band', 'wedding', 'evening'] });
  prop(s, 'fw.drums', 29.7, BH, 1.75, -0.4, {});
  s.detail(() => {
    // the long flute on its stand, music stands with their parts
    g.mat('cast', '#3a3430'); g.lathe(26.95, 2.1, [[0.14, BH], [0.12, BH + 0.03], [0.02, BH + 0.06], [0.015, BH + 0.5]], { segs: 8 });
    g.mat('wood', '#c9a46a'); g.tube([[26.95, BH + 0.45, 2.1], [27.05, BH + 1.65, 2.18]], 0.022, { segs: 6 }); g.mat('cast', '#c8a45a'); for (const t of [0.3, 0.5, 0.7]) g.tube([[26.95 + 0.1 * t, BH + 0.45 + 1.2 * t, 2.1 + 0.08 * t], [26.95 + 0.1 * t, BH + 0.47 + 1.2 * t, 2.1 + 0.08 * t]], 0.025, { segs: 6 });
    for (const p of [[28.0, 4.2], [30.9, 4.15]]) { g.mat('cast', '#2e2a26'); g.tube([[p[0], BH, p[1]], [p[0], BH + 0.95, p[1]]], 0.01, { segs: 4 }); g.box(p[0] - 0.22, BH + 0.9, p[1] - 0.01, p[0] + 0.22, BH + 1.2, p[1] + 0.02); g.mat('paper', '#efe6d2'); g.box(p[0] - 0.2, BH + 0.93, p[1] + 0.02, p[0] + 0.2, BH + 1.18, p[1] + 0.03, { faces: 'Z' }); }
  });
  for (const x of [27.6, 31.2]) s.light({ at: [x, 4.3, 0.7], type: 'spot', dir: [0, -1, 0.9], cone: [60, 30], K: 2700, color: [1, 0.72, 0.46], power: 5, range: 8, lamp: true, clip });
  s.interact({ x: 29.5, y: 1.2, z: BZ1 + 1.0, radius: 1.6, prompt: 'Ask the band what they play', onUse: async (gm) => {
    await say(gm, 'The flute player', ['The flute is one point two metres long, so I play it sitting down. In this air a pipe that long sounds where a short one would at home.', 'For a wedding we play the slow reel. At a third of a g they hang at the top of every leap, so the beat is slower than you would think, and by the end of the night the dancing has walked a long way round the floor.']);
  } });

  // ---- benches at the rail, bollards, the lobby, the lift
  for (const x of [-28.6, -19.6, 27.6]) prop(s, 'fw.bench', x, 0, ZR - 1.5, 0, { w: 2.8, wood: OAK });
  seat(s, -19.6, 0, ZR - 1.45, 0, 'Sit at the rail');
  for (let x = -30; x <= 30; x += 7.5) { prop(s, 'fw.bollard', x, 0, ZR - 0.4, 0, {}); s.light({ at: [x, 0.66, ZR - 0.55], K: 2400, color: [1.0, 0.62, 0.32], power: 0.9, range: 4.2, night: true, clip, radius: 0.08 }); }
  cabLobby(game, s, { x0: -32.6, x1: -26.4, d: 3.6, clip, id: 'front-third', trim: '#7a2a5a', sign: { kind: 'street', text: 'CABS · TIER TEN', sub: 'the front Third' } });
  wallLift(game, s, { x: -22.6, clip, label: 'WALL LIFT · DOWN', sub: 'the Warming Shelf · tier one', prompt: 'Take the wall lift down to the Warming Shelf',
    to: { frame: 'fwall1', x: 31.0, y: 0, z: 2.2, yaw: PI }, banner: ['The Warming Shelf', 'tier one · 0.48 g'], secs: 'Four hundred and fifty metres down the wall in about twenty seconds. You get heavier all the way.' });

  // ---- people and walkways
  for (let x = -30; x <= 30; x += 2.4) if (Math.abs(x - 6) > 1) s.spot('stand', x + r.f(-0.3, 0.3), 0, ZR - 0.6, 0, { tags: ['rail', 'watch', 'evening'] });
  for (const c of [[-1.6, 13.2], [25.6, 9.4], [-20.4, 6.4], [6.0, 3.6], [-4.6, 15.2]]) for (let k = 0; k < 3; k++) { const a = k * 2.09; s.spot('chat', c[0] + Math.sin(a) * 0.65, 0, c[1] + Math.cos(a) * 0.65, a + PI, { tags: ['wedding', 'evening'] }); }
  s.path([[-30, 4.8], [-24, 3.0], [-12, 2.6], [-2, 2.8], [10, 2.8], [24, 3.0], [25.4, 6.6], [32.6, 6.8]]);
  s.path([[-32, 15.8], [-20, 16.0], [-4, 15.9], [10, 16.0], [25.4, 16.0], [32.6, 15.8]]);
  s.path([[-30, 4.8], [-32, 10], [-32, 15.8]]); s.path([[32.6, 6.8], [32.8, 11], [32.6, 15.8]]);
  s.path([[-2, 2.8], [-1.6, 6.0], [-1.4, 9.4], [-1.6, 12.6], [-4, 15.9]]); s.path([[25.4, 6.6], [25.4, 11.5], [25.4, 16.0]]);
  s.path([[-1.4, 7.4], [6, 7.6], [12.2, 7.6], [18, 7.6], [25.4, 7.6]]); s.path([[-1.6, 11.6], [6, 11.5], [12.2, 11.5], [18, 11.5], [25.4, 11.6]]);
  s.path([[-24, 3.0], [-19.8, 9.2], [-20, 16.0]]);

  // ---- light, zones, sound, spawn
  skyGlow(game, s, [X0 - 1, -2, -1, X1 + 1, H + 2, ZR + 2], 1.0);
  s.zoneBox(Object.assign({ id: 'front-third', place: 'front-wall', box: [X0, -2, -1, X1, H + 2, ZR + 1.5], name: 'The front Third', sub: 'The front wall · tier ten · the Third', ambience: 'terrace', headroom: 30, env: ENV }, SKY));
  s.zoneBox(Object.assign({}, SKY, { id: 'two-lids', box: [RCX - RR, -0.5, RCZ - RR, RCX + RR, 6, RCZ + RR], name: 'The Two Lids', sub: 'The front Third · the wedding floor', ambience: 'terrace', headroom: 30, env: ENV }));
  s.loop('murmur', 10, 1.2, TZ, { vol: 0.26, radius: 20, param: 0.35 });
  tide(game, s, f, 'front-wall', duskShare);
  s.finish();
  game.spawns['front-third'] = { frame: f, x: -29.5, y: 0, z: 5.4, yaw: 2.36 };
}

function railLines(gm) {
  const h = hours(gm), sun = sunOf(gm);
  if (h >= 15 && h < 18.6 && sun > 0.02) return ['The light goes out of the line from the far end first. The back wall goes into its lamps, then the lake, and the last of it comes down the Hollow toward you and stops on this wall.', 'That is why Chervil marries here, at the front, at dusk: the last of the light is the couple\'s.'];
  if (sun < 0.05) return ['The Hollow below is a bowl of small lamps, rising up the sides and closing over your head. The far bank is two and a half kilometres away overhead, and the floor half a kilometre down.', 'Somebody behind you is still eating.'];
  return ['Five hundred metres down, the front wood is a green fur. The lake is a long bright shape further out, and the land curves up on both sides until it is over your head, two and a half kilometres up.', 'The sunline\'s end is 450 metres out and a thousand above you. From the Third you look up at it, not along it.'];
}
