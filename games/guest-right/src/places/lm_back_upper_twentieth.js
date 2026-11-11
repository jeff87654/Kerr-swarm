// The Twentieth: tier twenty-seven of the back wall, 1,350 m above the Hollow's floor and 150 m below the axis, a
// twentieth of a g: the highest garden in the drum. Plants grow long and thin here, water hangs on the leaves in big
// drops, and a standing jump goes about fourteen metres. The whole tier is a netted volume nineteen metres high, with
// hanging beds on the wall at four heights that can only be reached by jumping, and the top bed on the highest.
import { lamp } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { Rng, mixHex } from '../core/util.js';
import { PI, ENV, SKY, runX, lineX, toast, find, say, readSpec, seat, skyGlow, bentFloor, bentBox, riser, broadRail, netX, netZ, netRoof, endPier, cabLobby, wallLift, stoodTrigger } from './lm_back_upper_parts.js';

export const twentiethParts = true;

// the hanging beds: [x0, x1, top y, depth from the wall, name]
const LEDGES = [[-7.0, 0.0, 4.6, 3.0, 'BED ONE'], [2.0, 9.0, 9.0, 3.0, 'BED TWO'], [11.0, 17.0, 12.8, 3.0, 'BED THREE'], [17.6, 22.6, 16.4, 3.4, 'THE TOP BED']];

const JUMPBOARD = { kind: 'notice', title: 'The jump', lines: ['A twentieth of a g. A standing', 'jump goes about fourteen metres', 'and you are fifteen seconds in', 'the air. Come down like a scarf.', 'The spin pushes you spinward', 'going up and anti coming down.', 'One at a time on the green.', 'Look up before you jump and', 'down before you land.', 'Mind the beds. Mind the beans.'] };
const STEMS = { kind: 'notice', title: 'Why the stems are thin', lines: ['A stem up here holds up a', 'twentieth of what it would at', 'the rim, and the light from the', 'line is about 25 watts a square', 'metre, a thirteenth of the', "floor's at noon. So the plants", 'spend nothing on thickness and', 'everything on reaching.'] };

export function buildTwentieth(game) {
  const W = game.world;
  const f = W.frame('twentieth', 150, 0, 3750); f.hollowView = true;
  const s = W.scope('bu-twentieth', f), g = s.g;
  const X0 = -24, X1 = 24, ZR = -18, RY = 19, H = 12.6, STEP = 3;
  const clip = [X0 - 0.5, -2, ZR - 1.5, X1 + 0.5, RY + 1, 0.8];
  const r = new Rng(150);
  const ZN = ZR - 0.2;

  // ---- floor: pale paving, the rail, the piers, the riser and the planted wall above it
  bentFloor(s, X0, ZR, X1, 0, 0, 'stone', '#c9bea6', STEP);
  broadRail(s, { x0: X0 + 0.8, x1: X1 - 0.8, zr: ZR, stone: '#c2b49a', bronze: '#4f5a48', oak: '#8a6240', barrier: RY + 1, step: STEP, trail: 2.4 });
  endPier(s, X0, X0 + 0.8, ZR, H, { inner: 1, tint: '#d8ccb0', solidH: RY + 1 }); endPier(s, X1 - 0.8, X1, ZR, H, { inner: -1, tint: '#d8ccb0', solidH: RY + 1 });
  riser(s, { x0: X0 + 0.8, x1: X1 - 0.8, h: H, tint: '#dccdb0', stone: '#b4a68c', trim: '#3d5a3a', gaps: [[-23.4, -8.6]], doors: [], seed: 27, lit: 0.5, step: STEP, trail: 2.6, solidH: RY + 1 });
  // above the cornice, the wall goes on up to the net: a trellis of thin laths, vines hanging in long strands
  runX(X0 + 0.8, X1 - 0.8, STEP, (a, b) => { g.mat('plaster', '#cfc0a2'); g.box(a, H + 0.05, 0, b, RY + 0.6, 0.6, { faces: 'z' }); });
  s.flush({ tier: 's' });
  s.solid(X0, 0, 0, X1, RY + 1, 0.6);
  runX(X0 + 1, X1 - 1, STEP, (a, b) => { g.mat('wood', '#7a6a4a'); for (let y = H + 1.2; y < RY; y += 1.4) g.box(a, y, -0.12, b, y + 0.04, -0.06, { faces: 'zyY' }); });
  for (let x = X0 + 1.2; x < X1 - 1; x += 1.1) { g.mat('wood', '#7a6a4a'); g.box(x - 0.02, H + 0.4, -0.12, x + 0.02, RY, -0.06, { faces: 'zxX' }); }
  s.flush({ tier: 's', cast: false });
  for (let x = X0 + 1.4; x < X1 - 1; x += 0.7) {
    const y0 = r.f(H + 2, RY - 0.4), len = r.f(2.5, 7);
    g.mat('leafB', r.chance(0.3) ? '#d8eab8' : '#ffffff', { sway: 0.7 }); g.card(x + r.f(-0.2, 0.2), y0 - len, -0.2, 0.35, len, 0, { tilt: -0.02 });
  }
  s.flush({ tier: 's', cast: false });

  // ---- the netted volume: masts at the front, spars back to the wall, the net overhead, the net at the front and ends
  const MX = []; for (let x = X0 + 0.8; x <= X1 - 0.79; x += (X1 - X0 - 1.6) / 6) MX.push(x);
  for (const x of MX) {
    g.mat('cast', '#4f5a48'); g.lathe(x, ZN, [[0.12, 0.62], [0.09, 0.75], [0.07, RY - 0.3], [0.1, RY + 0.1], [0.05, RY + 0.4], [0, RY + 0.45]], { segs: 8 });
    g.mat('cast', '#4f5a48'); g.tube([[x, RY + 0.05, ZN], [x, RY + 0.05, -0.1]], 0.05, { segs: 6 });
    g.tube([[x, RY - 4.5, ZN], [x, RY - 0.05, ZN + 4.5]], 0.025, { segs: 5 });
    s.post(x, ZN, 0.1, 0, RY);
  }
  s.flush({ tier: 's', cast: false });
  netX(s, { x0: X0 + 0.8, x1: X1 - 0.8, z: ZN + 0.02, y0: 1.12, y1: RY, cell: 0.55, tint: '#e6dcc0', step: STEP });
  netRoof(s, { x0: X0, x1: X1, z0: ZN, z1: -0.1, y: RY, cell: 0.7, tint: '#ddd2b6', rib: 6 });
  for (const x of [X0 + 0.82, X1 - 0.82]) { netZ(s, { x, z0: ZR - 0.9, z1: -2.6, y0: 2.86, y1: RY, cell: 0.55, tint: '#e6dcc0' }); netZ(s, { x, z0: -2.6, z1: 0, y0: H + 0.7, y1: RY, cell: 0.55, tint: '#e6dcc0' }); }
  s.solid(X0 - 1, RY, ZR - 2, X1 + 1, RY + 1.5, 1);

  // ---- the lift house: the cab lobby with a stone tower over it right up to the net, so nobody stands on its roof
  cabLobby(game, s, { x0: -22.8, x1: -16.8, d: 3.6, clip, id: 'back-twentieth', trim: '#3d5a3a', sign: { kind: 'street', text: 'CABS · TIER TWENTY-SEVEN', sub: 'the Twentieth' } });
  { const tx0 = -23.05, tx1 = -16.55, tz0 = -3.85, ty0 = 3.52;
    runX(ty0, RY + 0.4, 4.2, (a, b) => { g.mat('stone', '#c2b49a'); g.box(tx0, a, tz0, tx1, b, 0, { faces: 'xXz' }); });
    g.mat('stone', '#a89a80'); for (let y = ty0 + 3.2; y < RY; y += 3.2) g.box(tx0 - 0.06, y, tz0 - 0.06, tx1 + 0.06, y + 0.18, 0, { faces: 'xXzY' });
    s.flush({ tier: 's', cast: false });
    s.solid(tx0, ty0, tz0, tx1, RY + 1, 0);
    for (const y of [7.4, 13.8]) { g.mat('weave', '#e2b86a', { emissive: 1.4, night: true }); g.lathe((tx0 + tx1) / 2, tz0 - 0.01, [[0.55, y], [0, y]], { segs: 18, capTop: false, capBottom: false }); }
    s.deco(() => { for (const y of [7.4, 13.8]) { g.push(); g.move((tx0 + tx1) / 2, y, tz0 - 0.02); g.rotX(PI / 2); g.mat('stone', '#8a7c64'); g.lathe(0, 0, [[0.62, -0.06], [0.62, 0.04], [0.55, 0.04]], { segs: 18, capTop: false, capBottom: false }); g.pop(); } });
    for (let y = ty0 + 0.4; y < RY - 1; y += 0.8) { g.mat('leafB', '#ffffff', { sway: 0.5 }); g.card(tx1 + 0.05, y, r.f(tz0 + 0.3, -0.4), 0.5, 1.2, PI / 2, { tilt: -0.05 }); }
    s.flush({ tier: 's', cast: false });
  }
  wallLift(game, s, { x: -13.6, clip, label: 'WALL LIFT · DOWN', sub: 'the Tenth · tier twenty-four', prompt: 'Take the wall lift down to the Tenth',
    to: { frame: 'tenth', x: 11.8, y: 0, z: -1.8, yaw: 0.3 }, banner: ['The Tenth', 'tier twenty-four · a tenth of a g'], secs: 'A hundred and fifty metres down the wall in about eight seconds.' });
  wallLift(game, s, { x: -10.0, clip, door: '#c08a45', label: 'WALL LIFT · UP', sub: "the flying hall's gate · the hub", prompt: "Take the wall lift up to the flying hall's gate",
    to: { frame: 'hub', x: 3.2, y: 0, z: -6.2, yaw: 0.25 }, banner: ['The back flying hall', 'the Spindle · the back gate'], secs: 'Seventy-eight metres up in four seconds, and the last of your weight goes with them.' });

  // ---- the hanging beds on the wall: stone shelves on corbels, planted along their lips
  LEDGES.forEach((L, li) => {
    const [x0, x1, y, D, name] = L;
    bentBox(s, x0, y - 0.32, -D, x1, y, 0, 'stone', '#c2b49a', STEP, { faces: 'xXzyY', bevel: 0.02, solid: true });
    s.structure(() => { g.mat('stone', '#a89a80'); g.box(x0 - 0.04, y - 0.4, -D - 0.04, x1 + 0.04, y - 0.3, 0, { faces: 'xXzy' }); });
    for (let x = x0 + 0.6; x < x1; x += 2.2) { g.mat('stone', '#a89a80'); g.at(x, 0, 0); g.extrude([[-D + 0.3, y - 0.4], [-0.01, y - 0.4], [-0.01, y - 2.2], [-0.5, y - 1.9], [-D * 0.6, y - 1.0]], -0.18, 0.18, 'x'); g.pop(); }
    s.flush({ tier: 's', cast: true });
    // a soil bed along the lip with the long thin plants, some trailing over the edge
    s.structure(() => { g.mat('stone', '#b4a68c'); g.box(x0 + 0.1, y, -D + 0.05, x1 - 0.1, y + 0.32, -D + 0.6, { faces: 'xXzZY' }); g.mat('soil', '#ffffff'); g.box(x0 + 0.15, y + 0.3, -D + 0.1, x1 - 0.15, y + 0.33, -D + 0.55, { faces: 'Y' }); });
    s.solid(x0 + 0.1, y, -D + 0.05, x1 - 0.1, y + 0.32, -D + 0.6);
    stalks(s, r, x0 + 0.3, -D + 0.15, x1 - 0.3, -D + 0.5, Math.round((x1 - x0) * 2.2), 1.2, li === 3 ? 2.2 : 3.4, { hang: true, y0: y + 0.31 });
    sign(s, { kind: 'plate', text: name, sub: 'reached by jumping only' }, (x0 + x1) / 2, y - 0.17, -D - 0.045, { face: 'z', w: 0.7, h: 0.2 });
    lamp(s, 'bulb', (x0 + x1) / 2, y - 0.6, -D + 0.4, { K: 2600, power: 0.55, range: 5, clip, night: true });
  });
  // the top bed: a tomato vine trained on a frame, the jump book in a brass box on a stand, a stool, a view
  { const [x0, x1, y] = LEDGES[3], cx = (x0 + x1) / 2;
    s.detail(() => {
      g.mat('wood', '#6b4a2f'); for (const x of [x0 + 0.6, x1 - 0.6]) g.tube([[x, y, -0.5], [x, y + 2.3, -0.5]], 0.03, { segs: 6 });
      for (let k = 0; k < 5; k++) g.tube(lineX(x0 + 0.6, x1 - 0.6, y + 0.5 + k * 0.45, -0.5, 1), 0.008, { segs: 3, caps: false });
      const R = new Rng(4711);
      for (let i = 0; i < 46; i++) { g.mat(R.chance(0.6) ? 'leafA' : 'leafB', '#ffffff', { sway: 0.4 }); g.card(R.f(x0 + 0.6, x1 - 0.6), y + R.f(0.2, 2.2), -0.5 + R.f(-0.12, 0.12), 0.35, 0.4, R.f(0, 3), { tilt: R.f(-0.4, 0.4) }); }
      for (let i = 0; i < 9; i++) { g.mat('plain', i % 3 ? '#c8321e' : '#e2552a', { rough: -0.35 }); g.ball(R.f(x0 + 0.8, x1 - 0.8), y + R.f(0.6, 2.0), -0.42 + R.f(-0.05, 0.08), 0.045, 0.042, 0.045, { segs: 10, rings: 7 }); }
      g.mat('soil', '#ffffff'); g.box(x0 + 0.3, y, -0.9, x1 - 0.3, y + 0.05, -0.15, { faces: 'Y' });
    });
    // the book's stand and box
    s.furniture(() => {
      g.mat('wood', '#5a3e26'); g.box(cx - 0.05, y, -2.0, cx + 0.05, y + 1.0, -1.9);
      g.box(cx - 0.3, y, -2.15, cx + 0.3, y + 0.04, -1.75);
      g.mat('cast', '#b08a45', { rough: -0.1 }); g.box(cx - 0.26, y + 1.0, -2.12, cx + 0.26, y + 1.12, -1.78, { bevel: 0.012 });
      g.mat('paper', '#efe6d2'); g.box(cx - 0.22, y + 1.12, -2.08, cx + 0.22, y + 1.14, -1.82);
      g.mat('leather', '#3a5a3a'); g.box(cx - 0.24, y + 1.115, -2.1, cx - 0.21, y + 1.145, -1.8);
    });
    s.solid(cx - 0.3, y, -2.15, cx + 0.3, y + 1.12, -1.75);
    prop(s, 'stool', x0 + 1.0, y, -2.2, 0, { h: 0.45, wood: '#5a3e26' });
    s.interact({ x: cx, y: y + 1.1, z: -2.4, radius: 1.2, prompt: 'Read the jump book', onUse: async (gm) => {
      await say(gm, 'The jump book', ['A book in a brass box, its pages soft with handling. On the first page: Kept on the top bed for whoever gets here. Write your name, your drum, and which bed you jumped from.', 'Wren, nine, Chervil, from bed three, on the fourth try. Tomasz, eighty-one, from the green, which he says is impossible, and it is. A guest from Sorrel: from bed two, it is the same up here as at home and I still shouted.', 'Two thousand and eleven names since the book was new. The pencil is on a string. You write yours.']);
      if (!gm.flags['bu.jumpbook']) { gm.flags['bu.jumpbook'] = true; toast(gm, 'Your name is in the jump book on the top bed: from bed three, with a guest\'s mark.', 'found'); }
    } });
    s.interact({ x: (x0 + x1) / 2 + 1.2, y: y + 1.2, z: -1.0, radius: 1.3, prompt: (gm) => (gm.flags['bu.tomato'] ? 'Look at the tomato vine' : 'Pick a tomato'), onUse: async (gm) => {
      if (gm.flags['bu.tomato']) { toast(gm, 'Eight tomatoes left on the vine, and a tag on the frame: one each for climbers. Put the cloth back.'); return; }
      gm.flags['bu.tomato'] = true;
      await say(gm, 'The tomato vine', ['A vine trained up a frame, long and thin like everything up here, with nine small red tomatoes on it. A tag on the frame, in a careful hand: One each for climbers, and only climbers. Grown up here so that nobody could buy them.', 'Half a kay of tomato, the price of jewellery down on the decks, and nobody can sell this one.']);
      if (gm.inv) gm.inv.give('tomato');
    } });
    s.trigger({ box: [x0, y - 0.2, -3.4, x1, y + 2.5, 0], onEnter(gm) { if (!gm.flags.top_ledge) { gm.flags.top_ledge = true; if (gm.story && gm.story.persist) gm.story.persist(); gm.events.emit('tier:top'); } if (gm.flags['bu.topbed']) return; gm.flags['bu.topbed'] = true; toast(gm, 'The top bed: sixteen metres above the green, and nobody up here who did not jump.', 'found'); } });
    lamp(s, 'lantern', cx - 1.2, y + 2.3, -1.6, { tint: '#e8743b', drop: 0.4, power: 0.6, clip, night: true, lampFlag: false });
  }

  // ---- the beds on the floor: along the rail, either side of the green, at the ends; full of long thin stems
  const BEDS = [[-22.6, -16.9, -12.2, -15.4], [-11.6, -16.9, -1.6, -15.4], [1.6, -16.9, 11.6, -15.4], [12.2, -16.9, 22.6, -15.4], [-21.4, -13.0, -9.6, -7.4], [9.6, -13.0, 21.4, -7.4]];
  for (const b of BEDS) {
    const [x0, z0, x1, z1] = b;
    s.structure(() => { g.mat('stone', '#b4a68c'); g.box(x0, 0, z0, x1, 0.42, z0 + 0.18, { faces: 'zZY', bevel: 0.01 }); g.box(x0, 0, z1 - 0.18, x1, 0.42, z1, { faces: 'zZY', bevel: 0.01 }); g.box(x0, 0, z0, x0 + 0.18, 0.42, z1, { faces: 'xXY' }); g.box(x1 - 0.18, 0, z0, x1, 0.42, z1, { faces: 'xXY' }); g.mat('soil', '#ffffff'); g.box(x0 + 0.18, 0, z0 + 0.18, x1 - 0.18, 0.36, z1 - 0.18, { faces: 'Y' }); });
    s.solid(x0, 0, z0, x1, 0.42, z1, { surf: 'gravel' });
    stalks(s, r, x0 + 0.3, z0 + 0.3, x1 - 0.3, z1 - 0.3, Math.round((x1 - x0) * (z1 - z0) * 2.4), 1.6, z0 < -15 ? 4.5 : 6.0, { y0: 0.36 });
  }
  // runner greens climbing strings from the front beds to the net, eighteen metres
  s.detail(() => {
    for (let x = X0 + 1.6; x < X1 - 1.4; x += 1.25) {
      if (x > -12.2 && x < -11.6 || x > -1.6 && x < 1.6 || x > 11.6 && x < 12.2) continue;
      const z = -16.15, top = RY - 0.05, reach = r.f(9, RY - 1.5);
      g.mat('weave', '#cfc4a8'); g.tube([[x, 0.36, z], [x, top, z]], 0.004, { segs: 3, caps: false });
      for (let y = 0.6; y < reach; y += r.f(0.45, 0.8)) { g.mat(r.chance(0.8) ? 'leafB' : 'leafA', mixHex('#ffffff', '#d8f0a8', r.f(0, 0.6)), { sway: 0.6 }); g.card(x + r.f(-0.08, 0.08), y, z + r.f(-0.08, 0.08), r.f(0.25, 0.4), r.f(0.3, 0.55), r.f(0, 6.28), { tilt: r.f(-0.3, 0.3) }); }
    }
  });

  // ---- the jump green: soft turf in a ring of mosaic, a brass stud, the board
  const GX = 0, GZ = -10.4;
  bentFloor(s, -7.6, -14.2, 7.6, -6.4, 0.06, 'grass', '#ffffff', STEP, { surf: 'grass', faces: 'YzZxX', slab: 0.06 });
  s.structure(() => {
    for (const rg of [[3.4, '#3d5a3a'], [3.15, '#e8dcc0'], [0.6, '#d6a640'], [0.45, '#3d5a3a']]) { g.mat('mosaic', rg[1]); g.lathe(GX, GZ, [[rg[0], 0.066], [0, 0.067]], { segs: 40, capTop: false, capBottom: false }); }
    g.mat('cast', '#c8a45a', { rough: -0.15 }); g.cyl(GX, 0.066, GZ, 0.08, 0.012, { segs: 14 });
  });
  g.mat('wood', '#5a3e26'); g.box(-7.2, 0, -14.75, -7.1, 1.7, -14.65); g.box(-6.25, 0, -14.75, -6.15, 1.7, -14.65); s.flush({ tier: 's', cast: true }); s.solid(-7.25, 0, -14.8, -6.1, 1.7, -14.6);
  sign(s, JUMPBOARD, -6.68, 1.15, -14.6, { face: 'Z', w: 0.95, h: 1.05 });
  s.interact({ x: -6.7, y: 1.2, z: -13.9, radius: 1.3, prompt: 'Read the jump board', onUse: async (gm) => { await readSpec(gm, JUMPBOARD, 'Underneath, a child has drawn a person going up a very long way, and coming down in a bed.'); } });
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2 + 0.3; s.spot('play', GX + Math.cos(a) * 3.8, 0.06, GZ + Math.sin(a) * 3.0, Math.atan2(-Math.cos(a), -Math.sin(a)), { tags: ['kids', 'jump'] }); }
  for (const p of [[-9.0, -5.0], [9.0, -5.0]]) prop(s, 'bu.bench', p[0], 0, p[1], PI, { w: 3.0, wood: '#8a6240' });
  seat(s, 9.0, 0, -5.1, PI, 'Sit and watch the jumpers');

  // ---- the stems and the drops: a plate, a gardener, a leaf to look at
  sign(s, STEMS, 9.4, 1.0, -10.2, { face: 'x', w: 0.6, h: 0.85 });
  g.mat('stone', '#a89a80'); g.box(9.42, 0.42, -10.6, 9.6, 1.5, -9.8, { bevel: 0.01 }); s.flush({ tier: 's' });
  s.interact({ x: 8.7, y: 1.1, z: -10.2, radius: 1.2, prompt: 'Read the plate on the bed', onUse: (gm) => readSpec(gm, STEMS) });
  s.interact({ x: -9.2, y: 1.0, z: -10.0, radius: 1.5, prompt: 'Look at a drop on a leaf', onUse: async (gm) => {
    await say(gm, 'A drop on a leaf', ['On a pale leaf at the end of a stem as thin as a bootlace, a drop of water as wide as your thumbnail, round and shaking, holding a tiny upside-down Hollow in it.', 'At a twentieth of a g a drop can grow about four and a half times as wide before its own weight pulls it off. Touch the stem and the drop rolls, slowly, and hangs from the tip, and does not fall.']);
  } });
  s.spot('work', -15.6, 0, -6.8, PI * 0.9, { tags: ['garden'] }); s.spot('work', 15.2, 0, -6.8, PI * 1.1, { tags: ['garden'] }); s.spot('work', 5.0, 0, -14.8, 0, { tags: ['garden'] });
  s.interact({ x: -15.6, y: 1.2, z: -6.0, radius: 1.6, prompt: 'Ask about the garden', onUse: async (gm) => {
    await say(gm, 'The gardener', ['Everything up here grows like it is looking for something. The light is weak, a thirteenth of the floor at noon from the line itself, and the rest is the glow off the whole Hollow. The stems need no strength, so they make none.', 'The runner greens go from the bed to the net in sixty days. We pick them from the green, by jumping, with a basket. People come up from the decks to watch us do it.', 'Water it in the morning with a fine rose and it sits on the leaves in drops the size of grapes until noon. Do not shake anything.']);
  } });
  s.detail(() => {
    g.mat('cast', '#3d6a5a'); g.lathe(-14.8, -6.9, [[0, 0], [0.13, 0], [0.15, 0.04], [0.15, 0.3], [0.12, 0.33], [0, 0.33]], { segs: 12 });
    g.tube([[-14.66, 0.24, -6.9], [-14.3, 0.42, -6.9], [-14.05, 0.48, -6.9]], 0.014, { segs: 5 }); g.cyl(-14.05, 0.46, -6.9, 0.05, 0.03, { segs: 8 });
    g.mat('weave', '#b8955a'); g.lathe(-16.4, -6.9, [[0.22, 0], [0.26, 0.3], [0.27, 0.32]], { segs: 12, capTop: false });
  });

  // ---- the tier plate
  sign(s, { kind: 'plate', text: 'TIER TWENTY-SEVEN · THE TWENTIETH', sub: '1,350 m up · 150 m to the axis · a twentieth of a g' }, 0, 0.82, ZR + 0.005, { face: 'Z', w: 0.66, h: 0.2 });
  s.interact({ x: 0, y: 1.0, z: ZR + 0.5, radius: 1.3, prompt: 'Read the tier plate', onUse: async (gm) => {
    await say(gm, 'Tier twenty-seven', ['Tier twenty-seven, the Twentieth, the top garden: 1,350 metres above the floor, 150 below the axis. A twentieth of a g. Seventy kilos at the rim weigh three and a half here.', 'Above this there are only the flying halls. Look out through the net: the sunline is level with your eye a long way off, and the whole Hollow is round you like the inside of a cup.']);
    find(gm, 'terraces-lighter');
  } });
  for (const lx of [-16, 16]) s.interact({ x: lx, y: 1.2, z: ZR + 0.4, radius: 1.4, prompt: 'Look out through the net', onUse: async (gm) => {
    const sun = gm.clock ? gm.clock.sun() : 1;
    await say(gm, 'The net', sun < 0.05
      ? ['Through the mesh, the Hollow\'s lamps in every direction, below, beside and over you. Up here you are nearly in the middle of the world, and it shows.']
      : ['Through the mesh: the floor 1,350 metres down, the far bank 1,650 metres up, and both of them nearly the same distance, so the world looks like the inside of a barrel with you near the middle of it.', 'The sunline starts 450 metres out and 150 metres above you, and runs off into the Hollow, getting thinner, toward the front wall almost four kilometres away.']);
    find(gm, 'far-bank');
  } });

  // ---- lanterns hanging from the net on long cords, low lamps along the paths
  for (const p of [[-14, 7.2, -11], [-3, 6.0, -16.4], [6, 8.0, -9], [15, 6.6, -12], [-19, 5.4, -6.4], [19.5, 5.8, -5]]) {
    g.mat('weave', '#cfc4a8'); g.tube([[p[0], RY, p[2]], [p[0], p[1] + 0.3, p[2]]], 0.006, { segs: 3, caps: false }); s.flush({ tier: 'd', cast: false });
    lamp(s, 'lantern', p[0], p[1], p[2], { tint: ['#f2b56b', '#e8743b', '#f0d070'][Math.abs(Math.round(p[0])) % 3], drop: 0.2, r: 0.26, hh: 0.4, power: 1.0, range: 9, clip, night: true });
  }
  for (const x of [-20, -12, -4, 4, 12, 20]) { prop(s, 'bu.bollard', x, 0, -4.6, 0, {}); s.light({ at: [x, 0.66, -4.45], K: 2400, color: [1.0, 0.62, 0.32], power: 0.8, range: 4.2, night: true, clip, radius: 0.08 }); }

  // ---- people, walkways, zone, sound, spawn
  for (let x = -20; x <= 21; x += 2.6) if (Math.abs(x + 12) > 1.5 && Math.abs(x) > 1.5 && Math.abs(x - 12) > 1.5) s.spot('stand', x + r.f(-0.3, 0.3), 0, ZR + 0.6, PI, { tags: ['watch', 'rail'] });;
  for (const c of [[3.6, -4.2], [-5.6, -4.0], [15.0, -3.6]]) for (let k = 0; k < 3; k++) { const a = k * 2.09; s.spot('chat', c[0] + Math.sin(a) * 0.65, 0, c[1] + Math.cos(a) * 0.65, a + PI, { tags: ['watch', 'garden'] }); }
  s.path([[-19.8, -4.8], [-13.6, -2.2], [-8, -4.2], [0, -4.2], [8, -4.2], [16, -4.2], [22, -4.2]]);
  s.path([[-22, -14.6], [-12, -14.6], [0, -15.0], [12, -14.6], [22, -14.6]]);
  s.path([[-8, -4.2], [-8.4, -10], [-12, -14.6]]); s.path([[8, -4.2], [8.4, -10], [12, -14.6]]);
  s.path([[-19.8, -4.8], [-22.6, -10], [-22, -14.6]]); s.path([[22, -4.2], [22.6, -10], [22, -14.6]]);
  skyGlow(game, s, [X0 - 1, -2, ZR - 2, X1 + 1, RY + 1, 0.8], 0.85);
  s.zoneBox(Object.assign({ id: 'back-twentieth', place: 'back-twentieth', box: [X0, -2, ZR - 1.5, X1, RY + 1, 0.6], name: 'The Twentieth', sub: 'The back wall · tier twenty-seven · the top garden', ambience: 'terrace', headroom: RY, env: ENV }, SKY));
  s.loop('air', 0, 10, -9, { vol: 0.12, radius: 30 });
  s.loop('kids', 0, 1.2, -10.4, { vol: 0.12, radius: 14 });
  stoodTrigger(s, [X0, -1, ZR, X1, RY, 0], 'twentieth');
  s.finish();
  game.spawns['back-twentieth'] = { frame: f, x: -19.8, y: 0, z: -5.0, yaw: 0.45 };
}

// Long thin stems in a bed: pale, barely thicker than string, a few leaves near the top, big drops of water on the
// leaves. (x0, z0)-(x1, z1) the bed, n stems from hmin to hmax tall. o: { y0 (soil level), hang (some trail down) }
function stalks(s, r, x0, z0, x1, z1, n, hmin, hmax, o = {}) {
  const g = s.g, y0 = o.y0 || 0;
  s.detail(() => {
    for (let i = 0; i < n; i++) {
      const x = r.f(x0, x1), z = r.f(z0, z1), h = r.f(hmin, hmax), lean = r.f(-0.25, 0.25), lz = r.f(-0.2, 0.2);
      const down = o.hang && r.chance(0.35);
      const pts = [];
      for (let k = 0; k <= 5; k++) { const t = k / 5; pts.push(down ? [x + lean * t * 0.5, y0 + 0.2 - (h * 0.8) * t * t, z - 0.1 - 0.5 * Math.sin(t * PI * 0.5)] : [x + lean * t * t, y0 + h * t, z + lz * t * t]); }
      g.mat('plain', mixHex('#9ab86a', '#d8e0a0', r.f(0, 1)), { rough: 0.1 }); g.tube(pts, [0.012, 0.01, 0.008, 0.007, 0.006, 0.005], { segs: 3, caps: false });
      const tip = pts[5];
      // small pale leaves all the way up, far apart (the stem grew fast for the light), a flower head on some
      for (let k = 1; k <= 5; k++) {
        const p = pts[k], q = pts[k - 1];
        for (let m = 0; m < 2; m++) { const t = (m + 0.5) / 2; g.mat(r.chance(0.5) ? 'leafA' : 'leafB', mixHex('#ffffff', '#e8f4c0', r.f(0.2, 1)), { sway: 0.7 }); g.card(q[0] + (p[0] - q[0]) * t, q[1] + (p[1] - q[1]) * t - 0.1, q[2] + (p[2] - q[2]) * t, r.f(0.16, 0.28), r.f(0.2, 0.34), r.f(0, 6.28), { tilt: r.f(-0.6, 0.6) }); }
      }
      if (r.chance(0.3)) { g.mat('blossom', ['#ffffff', '#ffe0f0', '#fff0c0'][r.i(0, 2)], { sway: 0.8 }); g.card(tip[0], tip[1] - 0.12, tip[2], 0.32, 0.3, r.f(0, 6.28), { tilt: r.f(-0.3, 0.3) }); g.card(tip[0], tip[1] - 0.12, tip[2], 0.32, 0.3, r.f(0, 6.28), { tilt: r.f(-0.3, 0.3) }); }
      if (r.chance(0.45)) { const dr = r.f(0.016, 0.03); g.mat('plain', '#e6f4f6', { rough: -0.5, emissive: 0.12 }); g.ball(tip[0] + r.f(-0.05, 0.05), tip[1] - r.f(0.05, 0.2), tip[2] + r.f(-0.05, 0.05), dr, dr * 1.15, dr, { segs: 7, rings: 5 }); }
    }
  });
}
