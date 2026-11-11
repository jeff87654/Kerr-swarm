// The Tenth: tier twenty-four of the back wall, 1,200 m above the Hollow's floor and 300 m below the axis, a tenth of
// a g. A practice floor for people learning to move before they go up to fly: a padded hall open to the Hollow behind
// a net, under a timber roof; hand lines down the lanes and loops hanging from the beams; the stopping line; a warden in
// a high chair; a wall of felt slippers where the shoes are left; the cab lobby and the wall lift up and down.
import { lamp, roomGlow } from '../world/kit.js';
import { planter } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { Rng, shadeHex } from '../core/util.js';
import { PI, ENV, SKY, runX, toast, say, readSpec, seat, skyGlow, bentFloor, riser, broadRail, netX, netZ, endPier, cabLobby, wallLift, stoodTrigger, find } from './lm_back_upper_parts.js';

export const tenthParts = true;

const RULES = { kind: 'notice', title: 'The practice floor', lines: ['1. Shoes in the wall, slippers on.', '2. Stop before you go: three', '   times on the line, running.', '3. Run along the axis first. It', '   flies true. Spinward sinks,', '   anti floats.', '4. A jump goes seven metres and', '   takes seven and a half seconds.', '   Look where you will land.', '5. Up to the Twentieth when the', '   warden has seen you stop.', '6. Up to the flying hall when you', '   can stop looking at the Hollow.'] };

export function buildTenth(game) {
  const W = game.world;
  const f = W.frame('tenth', 300, 0, 3750); f.hollowView = true;
  const s = W.scope('bu-tenth', f), g = s.g;
  const X0 = -26, X1 = 26, ZR = -16, RY = 9.6;
  const clip = [X0 - 0.5, -2, ZR - 1.5, X1 + 0.5, RY + 1, 0.8];
  const r = new Rng(300);
  const STEP = 5;

  // ---- floor, rail, piers, riser
  bentFloor(s, X0, ZR, X1, 0, 0, 'planks', '#b08456', STEP, { surf: 'wood' });
  broadRail(s, { x0: X0 + 0.8, x1: X1 - 0.8, zr: ZR, stone: '#bdae94', bronze: '#5a4a33', oak: '#8a6240', barrier: RY + 0.8, step: 3, trail: 1.8 });
  endPier(s, X0, X0 + 0.8, ZR, RY - 0.2, { inner: 1, tint: '#d8c6b2', solidH: RY + 1 }); endPier(s, X1 - 0.8, X1, ZR, RY - 0.2, { inner: -1, tint: '#d8c6b2', solidH: RY + 1 });
  const fac = riser(s, { x0: X0 + 0.8, x1: X1 - 0.8, h: RY - 0.2, tint: '#d9c9ae', stone: '#b4a48a', trim: '#2a4a6a', gaps: [[-25.4, -17], [10, 25.4]], doors: [-8.6], seed: 24, lit: 0.45, step: STEP, trail: 0.8, solidH: RY + 1 });
  // the padded dado: quilted felt panels on the riser, to bump into
  { const PAD = ['#c9552e', '#2f6f73', '#d6a640', '#5b4060', '#3a5a7a'];
    let k = 0;
    runX(-16.6, 9.6, 2.2, (a, b) => {
      if (fac.doors.some((d) => b > d.x - 0.9 && a < d.x + 0.9)) return;
      const c = PAD[k++ % PAD.length];
      g.mat('felt', c); g.box(a + 0.03, 0.15, -0.16, b - 0.03, 2.5, -0.02, { bevel: 0.05 });
      g.mat('felt', shadeHex(c, 0.75)); for (let y = 0.55; y < 2.4; y += 0.48) g.box(a + 0.08, y, -0.17, b - 0.08, y + 0.025, -0.15);
    });
    s.flush({ tier: 's', cast: false });
  }

  // ---- the roof: beams from the wall to a front beam on bronze columns, a felt soffit, the solid ceiling above it
  const ZF = ZR - 0.2;
  runX(X0, X1, STEP, (a, b) => {
    g.mat('felt', '#2e3560'); g.box(a, RY - 0.02, ZF - 0.5, b, RY, 0, { faces: 'y' });
    g.mat('wood', '#5a3e26'); g.box(a, RY - 0.75, ZF - 0.35, b, RY, ZF + 0.25, { faces: 'yzZ' });
    g.mat('cast', '#c8a45a'); g.box(a, RY - 0.78, ZF - 0.37, b, RY - 0.74, ZF + 0.27, { faces: 'yzZ' });
    g.mat('stone', '#b4a48a'); g.box(a, RY, ZF - 0.6, b, RY + 0.5, 0.6, { faces: 'zYy' });
  });
  s.flush({ tier: 's', cast: false });
  for (let x = X0 + 1.4; x <= X1 - 1.2; x += 4.4) {
    g.mat('wood', '#6b4a2f'); g.box(x - 0.12, RY - 0.5, ZF + 0.25, x + 0.12, RY - 0.02, 0, { faces: 'xXy' });
    g.mat('wood', '#4a3020'); g.box(x - 0.13, RY - 0.52, -1.2, x + 0.13, RY - 0.48, -0.9);
  }
  s.flush({ tier: 's', cast: true });
  // the felt between the beams, striped in bands so the eye has something to fix on when it is upside down
  { let k = 0; for (let x = X0 + 1.4; x < X1 - 1.2; x += 4.4) { const c = ['#c9552e', '#d6a640', '#2f6f73'][k++ % 3]; g.mat('felt', c); g.box(x + 0.14, RY - 0.06, ZF + 0.3, x + 4.26, RY - 0.03, -0.2, { faces: 'y' }); } s.flush({ tier: 's', cast: false }); }
  s.solid(X0 - 1, RY, ZF - 2, X1 + 1, RY + 1.2, 1);
  // columns at the front, and the net between them from the parapet to the beam
  for (let x = X0 + 0.8; x <= X1 - 0.79; x += (X1 - X0 - 1.6) / 8) { g.mat('cast', '#5a4a33'); g.lathe(x, ZF, [[0.13, 0.62], [0.1, 0.72], [0.08, 0.9], [0.07, RY - 1.1], [0.1, RY - 0.95], [0.16, RY - 0.78]], { segs: 10 }); s.post(x, ZF, 0.12, 0, RY); }
  s.flush({ tier: 's', cast: true });
  netX(s, { x0: X0 + 0.8, x1: X1 - 0.8, z: ZF + 0.02, y0: 1.12, y1: RY - 0.8, cell: 0.42, tint: '#e6dcc0', step: 3 });
  for (const x of [X0 + 0.82, X1 - 0.82]) netZ(s, { x, z0: ZR - 0.9, z1: -2.6, y0: 2.86, y1: RY - 0.05, cell: 0.42, tint: '#e6dcc0' });
  sign(s, { kind: 'letters', text: 'THE TENTH', palette: ['#d6a640', '#d6a640'] }, 0, RY - 0.38, ZF - 0.37, { face: 'z', w: 3.0, h: 0.42 });
  sign(s, { kind: 'letters', text: 'STOP FIRST', palette: ['#e8e0d0', '#e8e0d0'] }, -5, RY - 0.38, ZF + 0.27, { face: 'Z', w: 2.6, h: 0.36 });

  // ---- the practice floor: mats in lanes, the stopping line across them, hand lines down the lanes
  const MX0 = -16.4, MX1 = 9.2, MZ0 = -14.2, MZ1 = -3.0;
  const MC = ['#2f6f73', '#c9552e', '#d6a640', '#3a5a7a', '#7a3a5a', '#4a7a4a'];
  for (let x = MX0, i = 0; x < MX1 - 0.1; x += 2.0, i++) for (let z = MZ0, j = 0; z < MZ1 - 0.1; z += 2.0, j++) prop(s, 'bu.mat', x + 1, 0, z + 1, 0, { w: 2.0, d: 2.0, color: MC[(i + 2 * j) % MC.length], edge: (i + j) % 2 ? '#e8e0d0' : '#d6a640' });
  // the stopping line, a white stripe across every lane, with marks every half metre past it
  const SX = 2.4;
  s.deco(() => {
    g.mat('paint', '#f2ead8', { emissive: 0.15 }); g.box(SX - 0.1, 0.112, MZ0 + 0.1, SX + 0.1, 0.116, MZ1 - 0.1, { faces: 'Y' });
    g.mat('paint', '#e8dcc0'); for (let k = 1; k <= 8; k++) for (const lz of [-4.6, -8.0, -11.4]) g.box(SX + k * 0.5 - 0.015, 0.112, lz - 0.25, SX + k * 0.5 + 0.015, 0.115, lz + 0.25, { faces: 'Y' });
  });
  sign(s, { kind: 'label', text: 'THE LINE', sub: 'stop on it · three times running' }, SX, 0.85, MZ0 - 0.55, { face: 'z', w: 0.6, h: 0.18 });
  g.mat('cast', '#3a3430'); g.tube([[SX, 0, MZ0 - 0.5], [SX, 0.75, MZ0 - 0.5]], 0.02, { segs: 5 }); s.flush({ tier: 'd' }); s.post(SX, MZ0 - 0.5, 0.05, 0, 0.9);
  // hand lines: posts along the lane edges, a rope at waist height
  const LANES = [-6.3, -9.7, -13.1];
  for (const lz of LANES) {
    const xs = []; for (let x = MX0 + 0.6; x <= MX1 - 0.5; x += 3.6) xs.push(x);
    for (const x of xs) prop(s, 'bu.linepost', x, 0.11, lz, 0, { h: 1.25 });
    g.mat('weave', '#e8c25a'); for (let i = 0; i < xs.length - 1; i++) { const a = xs[i], b = xs[i + 1], pts = []; for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push([a + (b - a) * t, 0.11 + 1.07 - 0.07 * 4 * t * (1 - t), lz]); } g.tube(pts, 0.016, { segs: 5 }); }
    s.flush({ tier: 'd', cast: true });
  }
  // loops hanging from the beams over the lanes, to catch on the way down
  s.detail(() => {
    for (let x = X0 + 1.4; x <= MX1; x += 4.4) for (const lz of [-4.6, -8.0, -11.4]) {
      if (x < MX0) continue;
      const yb = 2.35 + ((x * 7 + lz * 3) % 1 + 1) % 1 * 0.3;
      g.mat('weave', '#cfc4a8'); g.tube([[x, RY - 0.5, lz], [x, yb + 0.22, lz]], 0.012, { segs: 4, caps: false });
      g.mat('weave', '#c9552e'); const ring = []; for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2; ring.push([x + Math.sin(a) * 0.11, yb + Math.cos(a) * 0.11, lz]); } g.tube(ring, 0.018, { segs: 4, closed: true });
    }
  });

  // ---- the warden's high chair at the net, the warden's board, a box of spare slippers
  const WX = -4.0, WZ = ZR + 1.15;
  prop(s, 'bu.wardenchair', WX, 0, WZ, 0, { paint: '#a82a2a' });
  s.spot('stand', WX + 1.6, 0, WZ + 0.2, PI * 0.1, { tags: ['warden', 'teach'] });
  s.interact({ x: WX, y: 1.4, z: WZ + 0.9, radius: 1.6, prompt: 'Talk to the warden', onUse: async (gm) => {
    const first = !gm.flags['bu.warden']; gm.flags['bu.warden'] = true;
    await say(gm, 'The warden', first
      ? ['Slippers first. Then the line. Everyone wants to jump first, and everyone does, and then they find out what landing is like when you weigh seven kilos and are still moving.', 'You weigh a tenth of yourself up here. Your feet have a tenth of their grip. Stopping is the whole lesson. Flying is just stopping with nothing to stand on.']
      : ['I go up to the Twentieth on my day off and jump in the beans. Do not tell the gardeners.', 'Who may go higher: anyone who has stopped on the line three times running while I watched. Anyone at all. I have passed a woman of a hundred and six.']);
  } });
  sign(s, RULES, -11.6, 1.75, -0.12, { face: 'z', w: 0.9, h: 1.25 });
  s.interact({ x: -11.6, y: 1.5, z: -0.8, radius: 1.3, prompt: 'Read the practice rules', onUse: (gm) => readSpec(gm, RULES, 'Pencilled at the bottom: rule six is the hard one.') });

  // ---- the wall of slippers, the changing benches
  prop(s, 'bu.slippers', -23.3, 0, -0.2, PI, { nx: 12, ny: 7, seed: 1 });
  prop(s, 'bu.slippers', -19.3, 0, -0.2, PI, { nx: 12, ny: 7, seed: 2 });
  sign(s, { kind: 'plate', text: 'SHOES IN · SLIPPERS ON', sub: 'take any pair that fits · darned ones grip best' }, -21.3, 2.2, -0.42, { face: 'z', w: 1.2, h: 0.28 });
  for (const x of [-23.2, -19.4]) prop(s, 'bu.bench', x, 0, -2.9, PI, { w: 3.0, wood: '#8a6240', back: false });
  s.interact({ x: -21.3, y: 1.0, z: -1.2, radius: 1.6, prompt: (gm) => (gm.flags['bu.slippers'] ? 'Look at the slipper wall' : 'Change into slippers'), onUse: async (gm) => {
    if (gm.flags['bu.slippers']) { toast(gm, 'Your shoes are in hole forty-one. The slippers are green felt, darned at both heels in orange.'); return; }
    gm.flags['bu.slippers'] = true;
    toast(gm, 'You leave your shoes in hole forty-one and pull on green felt slippers, darned at both heels. On the mats they grip where shoes would skid.');
    find(gm, 'shoes-deposit');
  } });
  for (const p of [[-24.1, -2.9], [-22.3, -2.9], [-20.2, -2.9], [-18.6, -2.9]]) s.spot('sit', p[0], 0.45, p[1] - 0.05, PI, { tags: ['learn', 'chat'] });
  planter(s, -16.6, 0, -1.0, { w: 0.6, d: 1.4, h: 0.8, plants: 'fern', tint: '#a89a84' });

  // ---- learners: in the lanes, at the line, holding on; a teacher at each end
  for (const lz of LANES) {
    for (let k = 0; k < 4; k++) s.spot('stand', MX0 + 2 + k * 6.2 + r.f(-0.6, 0.6), 0.11, lz + 0.45, PI / 2 + r.f(-0.2, 0.2), { tags: ['learn', 'line'] });
    s.spot('stand', SX + 0.4, 0.11, lz + 1.3, -PI / 2, { tags: ['learn', 'stop'] });
  }
  for (let i = 0; i < 8; i++) s.spot('play', MX0 + 1.5 + r.f(0, MX1 - MX0 - 3), 0.11, -3.9 - r.f(0, 0.5), r.f(0, 6.28), { tags: ['kids', 'learn'] });
  s.spot('work', MX0 - 0.8, 0, -8.0, PI / 2, { tags: ['teach', 'warden'] });
  s.spot('work', MX1 + 0.9, 0, -9.6, -PI / 2, { tags: ['teach'] });
  for (const c of [[-21.6, -6.8], [12.6, -11.6]]) for (let k = 0; k < 3; k++) { const a = k * 2.09; s.spot('chat', c[0] + Math.sin(a) * 0.65, 0, c[1] + Math.cos(a) * 0.65, a + PI, { tags: ['learn'] }); }
  s.interact({ x: SX - 1.2, y: 0.9, z: -8.0, radius: 1.6, prompt: 'Try the stopping line', onUse: async (gm) => {
    const n = (gm.flags['bu.stops'] || 0) + 1; gm.flags['bu.stops'] = n;
    const lines = n === 1 ? ['You run along the lane, spinward, toward the line. Running spinward makes you a little heavier, which helps. You plant a foot on the line and go on past it, three marks, four.', 'The warden says, without looking down: knees. Small steps, from further back. Spinward is the easy way. Try it anti.']
      : n === 2 ? ['Anti this time. Running anti you are lighter still, and the floor barely holds you. You stop two marks past the line with both hands on the rope.', 'A girl of about six in the next lane stops dead on it, every time, and looks pleased about it.']
        : ['You start slowing from three metres back, little steps, knees soft, leaning back early. You stop with your toes on the white.', n === 3 ? 'The warden lifts one finger. Then a second. Then, after you do it again, a third.' : 'The warden nods as if it was never in doubt.'];
    await say(gm, 'The line', lines);
    if (n === 3) toast(gm, 'The warden has seen you stop. You may go up.', 'found');
  } });
  s.interact({ x: MX0 + 4.2, y: 1.1, z: -9.2, radius: 1.3, prompt: 'Hold the hand line', onUse: async (gm) => {
    await say(gm, 'The hand line', ['A rope at waist height, worn smooth and pale where the hands go. You walk the lane holding it, and every step lifts you a little off the mat and lets you down slowly.', 'At a tenth of a g a stride is a small leap. The rope is there so that you leave the floor on purpose.']);
  } });

  // ---- the tier plate and the net
  sign(s, { kind: 'plate', text: 'TIER TWENTY-FOUR · THE TENTH', sub: '1,200 m up · 300 m to the axis · a tenth of a g' }, 0, 0.82, ZR + 0.005, { face: 'Z', w: 0.62, h: 0.2 });
  s.interact({ x: 0, y: 1.0, z: ZR + 0.5, radius: 1.3, prompt: 'Read the tier plate', onUse: async (gm) => {
    await say(gm, 'Tier twenty-four', ['Tier twenty-four, the Tenth: 1,200 metres above the floor, 300 below the axis. A tenth of a g. Seventy kilos at the rim weigh seven here.', 'A standing jump goes seven metres and takes seven and a half seconds. The roof is at nine and a half so that nobody finds out what eight is like.']);
    find(gm, 'terraces-lighter');
  } });
  s.interact({ x: 15, y: 1.2, z: ZR + 0.4, radius: 1.4, prompt: 'Look through the net', onUse: async (gm) => {
    const sun = gm.clock ? gm.clock.sun() : 1;
    await say(gm, 'Through the net', sun < 0.05
      ? ['Through the rope mesh, the lamps of the whole Hollow, a long way down and a long way round. The sunline is a dark cable 300 metres over your head, close enough to see its stays.']
      : ['Through the rope mesh: the floor of the Hollow 1,200 metres down, the land curving up both ways and over, and the sunline 300 metres above you, too bright to look at, starting a little way out from the wall.', 'Below you, on the Quarter, the slow fountain is a tuft of white you could cover with a fingernail.']);
  } });

  // ---- the cab lobby and the wall lift
  cabLobby(game, s, { x0: 18.8, x1: 24.8, d: 3.6, clip, id: 'back-tenth', trim: '#2a4a6a', sign: { kind: 'street', text: 'CABS · TIER TWENTY-FOUR', sub: 'the Tenth' } });
  wallLift(game, s, { x: 15.6, clip, label: 'WALL LIFT · DOWN', sub: 'the Quarter · tier fifteen', prompt: 'Take the wall lift down to the Quarter',
    to: { frame: 'quarter', x: 29.8, y: 0, z: -1.8, yaw: 0.3 }, banner: ['The Quarter', 'tier fifteen · a quarter of a g'], secs: 'Four hundred and fifty metres down the wall in about twenty-two seconds. Your knees notice at the bottom.' });
  wallLift(game, s, { x: 11.8, clip, door: '#c08a45', label: 'WALL LIFT · UP', sub: 'the Twentieth · the top garden', prompt: 'Take the wall lift up to the Twentieth',
    to: { frame: 'twentieth', x: -13.6, y: 0, z: -1.8, yaw: 0.2 }, banner: ['The Twentieth', 'tier twenty-seven · a twentieth of a g'], secs: 'A hundred and fifty metres up the wall in about eight seconds.' });

  // ---- light: panels under the beams, a glow for the hall, lanterns at the slipper wall
  for (const x of [-19.6, -11, -2.2, 6.6, 15.4]) for (const z of [-5.0, -11.2]) lamp(s, 'panel', x, RY - 0.06, z, { w: 2.2, d: 0.6, K: 3300, power: 0.85, clip });
  for (const x of [-23.2, -19.4]) lamp(s, 'globe', x, 3.2, -2.0, { K: 2700, power: 0.7, drop: 6.2, clip });
  roomGlow(s, X0, 0, ZR, X1, RY, 0, { sky: '#ffe2bc', ground: '#c99a6a', power: 0.22 });
  skyGlow(game, s, [X0 - 1, -2, ZR - 2, X1 + 1, RY + 1, 0.8], 0.7);

  // ---- walkways, zone, sound, spawn
  s.path([[21.8, -4.6], [15.6, -2.4], [11.8, -2.4], [9.8, -2.2], [0, -2.2], [-10, -2.2], [-16, -2.2], [-21.3, -1.8]]);
  s.path([[21.8, -4.6], [20, -10], [14, -14.6], [0, -15.0], [-14, -14.8], [-21, -12], [-21.6, -6.8], [-21.3, -1.8]]);
  for (const lz of LANES) s.path([[MX0 - 0.6, lz + 1.2], [SX, lz + 1.2], [MX1 + 1.0, lz + 1.2]]);
  s.zoneBox(Object.assign({ id: 'back-tenth', place: 'back-tenth', box: [X0, -2, ZR - 1.5, X1, RY + 1, 0.6], name: 'The Tenth', sub: 'The back wall · tier twenty-four · the practice floor', ambience: 'terrace', headroom: RY - 0.2, env: ENV }, SKY, { reverb: 'felt' }));
  s.loop('kids', -4, 1.2, -8, { vol: 0.2, radius: 20 });
  s.loop('murmur', -20, 1.2, -3, { vol: 0.16, radius: 12, param: 0.2 });
  stoodTrigger(s, [X0, -1, ZR, X1, RY, 0], 'tenth');
  s.finish();
  game.spawns['back-tenth'] = { frame: f, x: 21.8, y: 0, z: -5.0, yaw: -0.5 };
}
