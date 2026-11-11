// The Breadboard's pavilion: a long timber house painted saffron, between the pitches and the track, with a veranda
// facing the pitches. On the veranda the tea urn on a long table, benches along the rail, the rack of loan shoes and the
// rack of balls on loan; over the roof the scoreboard, painted with today's fixtures between real blocks of Chervil.
import { block, stairs, lamp } from '../world/kit.js';
import { railing } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { heightAt } from '../world/land.js';
import { Rng } from '../core/util.js';
import { maxGround, minGround, say, toast, sfx, flags, lanternString } from './hollow_parts.js';
import { V, C, FLAGS, pz0, P, blockNames } from './lm_hollow_grounds_parts.js';

const PI = Math.PI;
const KEEPER = { name: 'Hanne at the racks', colour: C.saffron };
const custom = (gm, term) => { if (gm.journal && gm.journal.custom) gm.journal.custom(term); };

export function buildPavilion(game, f, zones) {
  const s = game.world.scope('lmhg-pavilion', f), g = s.g, r = new Rng(6060);
  const Y = maxGround(V.XV - 0.4, V.Z0 - 0.4, V.XB + 0.4, V.Z1 + 0.4, 1) + 0.42;      // the veranda floor
  const ZM = (V.Z0 + V.Z1) / 2, XR = (V.XF + V.XB) / 2, RIDGE = Y + 5.0, EF = Y + 2.8, EB = Y + 3.25;
  const roofAt = (x) => x < XR ? RIDGE + (RIDGE - EF) * (x - XR) / (XR - (V.XV - 0.45)) : RIDGE - (RIDGE - EB) * (x - XR) / ((V.XB + 0.5) - XR);
  const yG = minGround(V.XV - 0.4, V.Z0 - 0.4, V.XB + 0.4, V.Z1 + 0.4, 1) - 0.3;
  // ---- the plinth, the veranda floor and its edge
  block(s, V.XV - 0.15, yG, V.Z0 - 0.15, V.XB + 0.15, Y - 0.12, V.Z1 + 0.15, 'stone', '#b9ab92', { bevel: 0.02 });
  block(s, V.XV, Y - 0.12, V.Z0, V.XF, Y, V.Z1, 'planks', '#a9805a', { surf: 'wood' });
  s.structure(() => { g.mat('wood', C.dark); g.box(V.XV - 0.06, Y - 0.16, V.Z0 - 0.06, V.XV + 0.06, Y - 0.02, V.Z1 + 0.06, { bevel: 0.01 }); });
  // ---- the house: one extruded section (front wall, roof line, back wall), then its doors, windows and trim
  s.furniture(() => {
    g.mat('planks', C.walls, { rough: 0.05 });
    g.extrude([[V.XF, Y - 0.12], [V.XB, Y - 0.12], [V.XB, roofAt(V.XB) - 0.04], [XR, RIDGE - 0.04], [V.XF, roofAt(V.XF) - 0.04]], V.Z0 + 0.15, V.Z1 - 0.15, 'z');
    // a teal skirting and a band at door-head height
    g.mat('paint', C.teal); g.box(V.XF - 0.03, Y, V.Z0 + 0.15, V.XF, Y + 0.35, V.Z1 - 0.15, { faces: 'x' }); g.box(V.XB, Y - 0.12, V.Z0 + 0.15, V.XB + 0.03, Y + 0.35, V.Z1 - 0.15, { faces: 'X' });
    g.box(V.XF - 0.035, Y + 2.3, V.Z0 + 0.15, V.XF, Y + 2.4, V.Z1 - 0.15, { faces: 'xyY' });
  });
  // the roof: painted panels, a front slope that runs down over the veranda, a back slope, a ridge capping
  s.furniture(() => {
    const zA = V.Z0 - 0.45, zB = V.Z1 + 0.45, xf = V.XV - 0.45, xb = V.XB + 0.5;
    g.mat('panel', C.roof, { rough: 0.05 });
    g.quad([xf, EF, zB], [xf, EF, zA], [XR, RIDGE, zA], [XR, RIDGE, zB], { double: true });
    g.quad([XR, RIDGE, zB], [XR, RIDGE, zA], [xb, EB, zA], [xb, EB, zB], { double: true });
    g.mat('cast', C.brass); g.tube([[XR, RIDGE + 0.05, zA], [XR, RIDGE + 0.05, zB]], 0.06, { segs: 6 });
    // fascia boards along the eaves, scalloped with a painted edge
    g.mat('paint', C.verm); g.box(xf - 0.05, EF - 0.22, zA, xf + 0.02, EF + 0.02, zB); g.box(xb - 0.02, EB - 0.22, zA, xb + 0.05, EB + 0.02, zB);
    g.mat('paint', C.cream); for (let z = zA + 0.3; z < zB; z += 0.6) g.box(xf - 0.06, EF - 0.3, z - 0.12, xf - 0.04, EF - 0.22, z + 0.12);
    // the gable ends, painted, with a round vent
    g.mat('paint', C.cream);
    for (const z of [V.Z0 + 0.14, V.Z1 - 0.14]) g.quad([V.XF, roofAt(V.XF), z], [V.XB, roofAt(V.XB), z], [XR, RIDGE - 0.05, z], [XR, RIDGE - 0.05, z], { double: true });
  });
  // the veranda's posts with their brackets, the front's doors and windows
  const postsZ = []; for (let z = V.Z0 + 0.25; z <= V.Z1 - 0.2; z += (V.Z1 - V.Z0 - 0.5) / 7) postsZ.push(z);
  s.furniture(() => {
    for (const z of postsZ) {
      const x = V.XV + 0.15, top = roofAt(x) - 0.05;
      g.mat('paint', C.teal); g.box(x - 0.07, Y, z - 0.07, x + 0.07, top, z + 0.07, { bevel: 0.015 });
      g.mat('paint', C.saffron); g.box(x - 0.08, Y, z - 0.08, x + 0.08, Y + 0.25, z + 0.08, { bevel: 0.01 });
      g.mat('wood', C.cream); g.tube([[x, top - 0.6, z], [x + 0.55, top + 0.12, z]], 0.035, { segs: 5 });
    }
    g.mat('wood', C.cream); g.box(V.XV + 0.05, roofAt(V.XV) - 0.22, V.Z0, V.XV + 0.25, roofAt(V.XV) - 0.05, V.Z1);
  });
  for (const z of postsZ) s.post(V.XV + 0.15, z, 0.1, Y, Y + 2.8);
  const doors = [V.Z0 + 4.5, V.Z1 - 9.0], windows = [V.Z0 + 1.4, V.Z0 + 7.6, V.Z0 + 10.6, ZM + 1.6];
  s.furniture(() => {
    for (const z of doors) {
      g.mat('paint', C.verm, { rough: -0.1 }); g.box(V.XF - 0.06, Y, z - 0.5, V.XF, Y + 2.15, z + 0.5, { bevel: 0.01 });
      g.mat('paint', C.cream); g.box(V.XF - 0.09, Y + 2.15, z - 0.62, V.XF, Y + 2.27, z + 0.62); for (const dz of [-0.56, 0.56]) g.box(V.XF - 0.09, Y, z + dz - 0.06, V.XF, Y + 2.15, z + dz + 0.06);
      g.mat('cast', C.brass); g.ball(V.XF - 0.09, Y + 1.05, z + 0.36, 0.03, 0.03, 0.03, { segs: 8, rings: 5 });
    }
    for (const z of windows) {
      g.mat('paint', C.cream); g.box(V.XF - 0.07, Y + 0.95, z - 0.62, V.XF, Y + 2.2, z + 0.62, { bevel: 0.01 });
      g.mat('paint', C.teal); g.box(V.XF - 0.1, Y + 0.88, z - 0.68, V.XF, Y + 0.95, z + 0.68);
    }
  });
  s.deco(() => {
    for (const z of windows) {
      g.mat('diffuser', '#ffd9a0', { emissive: 1.6, night: true }); g.box(V.XF - 0.075, Y + 1.0, z - 0.55, V.XF - 0.07, Y + 2.15, z + 0.55, { faces: 'x' });
      g.mat('paint', C.cream); g.box(V.XF - 0.09, Y + 1.0, z - 0.02, V.XF - 0.07, Y + 2.15, z + 0.02); g.box(V.XF - 0.09, Y + 1.56, z - 0.55, V.XF - 0.07, Y + 1.6, z + 0.55);
    }
  });
  s.solid(V.XF, Y - 0.2, V.Z0, V.XB, roofAt(V.XB), V.Z1, { surf: 'wood' });
  sign(s, { kind: 'fascia', text: 'THE BREADBOARD', sub: 'pavilion · tea · shoes and balls on loan', palette: [C.roof, C.cream, C.saffron] }, V.XF - 0.1, Y + 2.62, ZM, { face: 'x', w: 5.2, h: 0.46 });
  sign(s, { kind: 'plate', text: 'CHANGING', lines: ['leave the floor as you found it'], palette: [C.cream, '#2b2a26', C.verm] }, V.XF - 0.1, Y + 1.55, doors[0] - 0.95, { face: 'x', w: 0.5, h: 0.2 });
  sign(s, { kind: 'plate', text: 'STORE', lines: ['boards, nets, line paint'], palette: [C.cream, '#2b2a26', C.verm] }, V.XF - 0.1, Y + 1.55, doors[1] + 0.95, { face: 'x', w: 0.5, h: 0.2 });

  // ---- steps up to the veranda: in the middle of the front, and at the back end toward the lift pavilion
  const SZ = 2391, SW = 2.6, gf = heightAt(V.XV - 1.6, SZ);
  stairs(s, V.XV - 1.6, gf, SZ, 'X', Y - gf, 1.6, SW, { mat: 'planks', tint: '#a07752', nosing: '#6b4a2f' });
  const gb = heightAt(V.XV + 2.0, V.Z1 + 1.6);
  stairs(s, V.XV + 2.0, gb, V.Z1 + 1.6, 'z', Y - gb, 1.6, 2.4, { mat: 'planks', tint: '#a07752', nosing: '#6b4a2f' });
  // the rail along the veranda's edge, with the gap for the steps; and the front end
  railing(s, [[V.XV + 0.05, V.Z0 + 0.1], [V.XV + 0.05, SZ - SW / 2 - 0.05]], Y, { h: 0.95, tint: C.teal, rail: C.cream, posts: 1.6 });
  railing(s, [[V.XV + 0.05, SZ + SW / 2 + 0.05], [V.XV + 0.05, V.Z1 - 0.1]], Y, { h: 0.95, tint: C.teal, rail: C.cream, posts: 1.6 });
  railing(s, [[V.XV + 0.05, V.Z0 + 0.05], [V.XF - 0.05, V.Z0 + 0.05]], Y, { h: 0.95, tint: C.teal, rail: C.cream, posts: 1.4 });
  railing(s, [[V.XV + 0.05, V.Z1 - 0.05], [V.XV + 0.75, V.Z1 - 0.05]], Y, { h: 0.95, tint: C.teal, rail: C.cream, posts: 1.4 });
  railing(s, [[V.XV + 3.25, V.Z1 - 0.05], [V.XF - 0.05, V.Z1 - 0.05]], Y, { h: 0.95, tint: C.teal, rail: C.cream, posts: 1.4 });

  // ---- the tea: a long table at the front end, the urn, lidded cups, a tray; benches each side
  const TX = V.XV + 2.0, TZ = V.Z0 + 3.6;
  prop(s, 'hollow.longtable', TX, Y, TZ, PI / 2, { len: 5.4, top: '#b8875a', cover: C.cream, hem: C.verm }, { tier: 's' });
  prop(s, 'hollow.longbench', TX - 0.78, Y, TZ, PI / 2, { len: 5.0, wood: '#a87a50' }, { tier: 's' });
  prop(s, 'hollow.longbench', TX + 0.78, Y, TZ, -PI / 2, { len: 5.0, wood: '#9a6e48' }, { tier: 's' });
  prop(s, 'hollow.urn', TX, Y + 0.75, TZ - 1.9, 0, { col: '#9a6a3a' });
  s.detail(() => {
    for (let i = 0; i < 9; i++) { const z = TZ - 1.3 + i * 0.32, x = TX + (i % 2 ? 0.22 : -0.22); prop(s, 'hollow.cup', x, Y + 0.758, z, 0, { c: r.pick(['#e9e1cf', '#3d6f8a', '#c9552e', '#e7b547', '#2f6f73']) }); }
    prop(s, 'bowl', TX, Y + 0.758, TZ + 1.4, 0, { glaze: '#e9e1cf', lid: C.verm, r: 0.12 });
    prop(s, 'bowl', TX + 0.1, Y + 0.758, TZ + 2.0, 0, { glaze: C.teal, lid: C.saffron, r: 0.1 });
    g.mat('wood', '#6b4a2f'); g.box(TX - 0.25, Y + 0.758, TZ - 1.5, TX + 0.25, Y + 0.775, TZ - 0.6, { bevel: 0.005 });
  });
  s.spot('work', TX - 0.2, Y, TZ - 2.6, PI, { tags: ['tea', 'pour', 'keeper', 'grounds'] });
  s.interact({ x: TX, y: Y + 1.1, z: TZ - 1.9, radius: 1.6, prompt: 'Take a cup of tea from the urn', onUse: (gm) => {
    sfx(gm, 'pour', f, TX, Y + 1.0, TZ - 1.9);
    return say(gm, { name: 'The urn', colour: '#9a6a3a' }, [
      'The club’s urn, kept warm off the loop: a cup for anybody who has run, thrown or watched. Leave it on the tray. A lid on it, or it goes cold in a few minutes: this air pulls heat four times faster than the old kind.',
      'Out here the air is 4.4 kilopascals thinner than at the rim, so water boils at about 98.8 degrees instead of 100. Nobody can taste the difference, and everybody says they can.',
      'Chalked on the urn: Thursday, the Mill’s broth. The Quiet, tea. Booking Day, tea and whatever comes back from the feast.',
    ]);
  } });

  // ---- benches along the rail, facing the pitches
  for (const z of [V.Z0 + 7.4, V.Z0 + 9.6, SZ + SW / 2 + 1.3, SZ + SW / 2 + 3.4]) prop(s, 'bench', V.XV + 0.55, Y, z, -PI / 2, { w: 1.8, back: true, wood: '#a8794f', metal: C.teal }, { spot: { tags: ['watch', 'veranda', 'grounds'] } });
  s.interact({ x: V.XV + 0.9, y: Y + 0.7, z: V.Z0 + 9.6, radius: 1.3, prompt: 'Sit on the veranda', onUse: (gm) => {
    if (!gm.player || !gm.player.sit) return;
    gm.player.sit({ x: V.XV + 0.55, y: Y + 0.46, z: V.Z0 + 9.6, yaw: -PI / 2 });
    toast(gm, 'The pavilion’s veranda. Four pitches of children shouting, a ball in the air somewhere at every moment, and over it all the far bank hanging three kilometres up with somebody’s washing on it.');
  } });

  // ---- the racks at the back end of the veranda: loan shoes on slanted shelves, balls in a crate, a slate
  const RZ0 = V.Z1 - 7.2, RX = V.XF - 0.36;
  s.furniture(() => {
    // the shoe rack: three slanted shelves on a painted frame
    g.mat('paint', C.indigo); for (const dz of [0, 2.6]) g.box(RX - 0.2, Y, RZ0 + dz - 0.04, RX + 0.25, Y + 1.7, RZ0 + dz + 0.04, { bevel: 0.01 });
    g.mat('wood', '#b98a52'); for (let i = 0; i < 4; i++) { const y = Y + 0.2 + i * 0.42; g.push(); g.move(RX, y, RZ0 + 1.3); g.rotZ(0.25); g.box(-0.2, -0.015, -1.3, 0.2, 0.015, 1.3, { bevel: 0.005 }); g.pop(); }
    // the ball crate: a slatted bin with a lid propped open
    const bz = RZ0 + 4.0;
    g.mat('wood', '#9a6e48'); for (let i = 0; i < 4; i++) { g.box(RX - 0.35, Y + i * 0.17, bz - 0.55, RX + 0.25, Y + i * 0.17 + 0.12, bz - 0.52); g.box(RX - 0.35, Y + i * 0.17, bz + 0.52, RX + 0.25, Y + i * 0.17 + 0.12, bz + 0.55); g.box(RX - 0.38, Y + i * 0.17, bz - 0.55, RX - 0.35, Y + i * 0.17 + 0.12, bz + 0.55); }
    g.mat('paint', C.verm); g.push(); g.move(RX + 0.25, Y + 0.68, bz); g.rotZ(1.1); g.box(-0.02, 0, -0.56, 0.02, 0.62, 0.56, { bevel: 0.01 }); g.pop();
  });
  s.solid(RX - 0.22, Y, RZ0 - 0.06, RX + 0.27, Y + 1.7, RZ0 + 2.66, { surf: 'wood' });
  s.solid(RX - 0.4, Y, RZ0 + 3.43, RX + 0.27, Y + 0.68, RZ0 + 4.57, { surf: 'wood' });
  s.detail(() => {
    const sc = [C.teal, C.verm, C.saffron, C.indigo, C.leaf, C.magenta, '#3a3330', C.cream];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 7; j++) {
      if (r.chance(0.18)) continue;
      const y = Y + 0.24 + i * 0.42, z = RZ0 + 0.25 + j * 0.36, a = sc[(i * 3 + j) % sc.length], b = sc[(i + j * 2 + 3) % sc.length];
      prop(s, 'lmhg.shoe', RX - 0.02, y + (0.02 - 0.0), z - 0.06, -PI / 2, { a, b }); prop(s, 'lmhg.shoe', RX - 0.02, y + 0.02, z + 0.07, -PI / 2, { a, b });
    }
    for (let i = 0; i < 9; i++) prop(s, 'lmhg.ball', RX - 0.05 + r.f(-0.18, 0.12), Y + 0.3 + (i % 3) * 0.12, RZ0 + 4.0 + r.f(-0.35, 0.35), r.f(0, 6), { a: r.pick([C.verm, C.indigo, C.leaf, C.saffron, C.teal]), b: C.cream });
  });
  sign(s, { kind: 'chalk', title: 'On loan', lines: ['Shoes: leave yours', 'on the shelf. Balls:', 'bring them back HERE.', 'Mends on Thursdays.'] }, V.XF - 0.06, Y + 1.5, RZ0 + 5.6, { face: 'x', w: 0.8, h: 0.8 });
  s.spot('counter', RX - 0.8, Y, RZ0 + 3.0, -PI / 2, { tags: ['keeper', 'loan', 'grounds'] });
  s.interact({ x: RX - 0.4, y: Y + 1.0, z: RZ0 + 1.3, radius: 1.6, prompt: (gm) => gm.flags && gm.flags.lmhgShoes ? 'Give back the loan shoes' : 'Borrow running shoes from the rack', onUse: (gm) => {
    gm.flags = gm.flags || {};
    if (gm.flags.lmhgShoes) { gm.flags.lmhgShoes = false; toast(gm, 'You put the loan pair back on the shelf and take your own. Somebody has already chalked a tick by them.'); return; }
    gm.flags.lmhgShoes = true;
    return say(gm, KEEPER, [
      'Take any pair that fits and leave yours on the shelf: that is the deposit. Every pair has been mended. The teal thread is mine, the red is my brother’s, and the soles are the drum’s.',
      'A new pair is twenty kays: about 0.8 of a kilo of new mass at twenty-five a kilo. These are older than you. A sole lasts about twice as long out here, because you press on it half as hard. The Kettle takes some of that back.',
      'Bring them back before the lamps go down. If you run the Oval in them, tell the timekeeper your block. Spelt will do.',
    ]);
  } });
  s.interact({ x: RX - 0.45, y: Y + 0.8, z: RZ0 + 4.0, radius: 1.4, prompt: (gm) => gm.flags && gm.flags.hasBall ? 'You have a ball already' : 'Borrow a spinball', onUse: (gm) => {
    gm.flags = gm.flags || {};
    if (gm.flags.hasBall) { toast(gm, 'You have one. Go to the mark on pitch four and throw it spinward, then anti.'); return; }
    gm.flags.hasBall = true;
    sfx(gm, 'ball-catch', f, RX, Y + 0.8, RZ0 + 4.0);
    toast(gm, 'A spinball, on loan from the Breadboard. F throws it.', 'gain');
    custom(gm, 'Spinball');
    return say(gm, KEEPER, [
      'There are forty-one in the crate this morning and fifty-three on the slate, so eleven are out on the pitches and one is somewhere in the orchard.',
      'Drop one from your hand out here and it lands about four centimetres anti of your foot: it falls for 0.8 of a second and the floor moves on under it. Throw it and the floor’s turn bends it twice as hard as on the decks.',
      'Try it at the mark on pitch four. Then bring it back here, not to me.',
    ]);
  } });

  // ---- the scoreboard over the roof: one painted picture, facing the pitches
  const names = blockNames(game);
  const day = game.clock ? game.clock.day : 1;
  const sr = new Rng(7000 + day);
  const fixtures = [];
  for (let k = 0; k < 3; k++) { const a = names[(k * 2 + day) % names.length], b = names[(k * 2 + 1 + day * 3) % names.length]; fixtures.push([a, sr.i(3, 21), sr.i(0, 18), b === a ? names[(k + 5) % names.length] : b]); }
  const Bp = game.atlas ? game.atlas.add(1024, 512, (ctx, w, h) => paintScoreboard(ctx, w, h, fixtures, day), 'lmhg.score:' + day + ':' + names.join('|')) : null;
  const BW = 5.6, BH = 2.8, BX = V.XF + 0.6, BY0 = roofAt(V.XF + 0.6) + 0.55;
  s.structure(() => {
    g.mat('wood', C.dark); g.box(BX, BY0 - 0.12, ZM - BW / 2 - 0.12, BX + 0.12, BY0 + BH + 0.12, ZM + BW / 2 + 0.12, { bevel: 0.01 });
    g.mat('paint', C.saffron); g.box(BX - 0.03, BY0 + BH + 0.12, ZM - BW / 2 - 0.2, BX + 0.16, BY0 + BH + 0.24, ZM + BW / 2 + 0.2, { bevel: 0.01 });
    g.mat('paint', C.teal); for (const dz of [-BW / 2 + 0.5, BW / 2 - 0.5]) g.box(BX + 0.12, roofAt(BX + 0.2) - 0.2, ZM + dz - 0.07, BX + 0.24, BY0 + 0.3, ZM + dz + 0.07);
    if (Bp) { g.atlas(Bp.page, { emissive: 0.75, lamp: true }); g.quad([BX - 0.004, BY0, ZM - BW / 2], [BX - 0.004, BY0, ZM + BW / 2], [BX - 0.004, BY0 + BH, ZM + BW / 2], [BX - 0.004, BY0 + BH, ZM - BW / 2], { uv: [Bp.u0, Bp.v1, Bp.u1, Bp.v0] }); }
  });
  flags(s, [BX - 0.1, BY0 + BH + 0.2, ZM - BW / 2 - 0.2], [V.XV - 0.4, EF + 0.1, V.Z0 - 0.4], { drop: 0.3, offset: 1 });
  flags(s, [BX - 0.1, BY0 + BH + 0.2, ZM + BW / 2 + 0.2], [V.XV - 0.4, EF + 0.1, V.Z1 + 0.4], { drop: 0.3, offset: 4 });
  s.light({ at: [BX - 1.6, BY0 + BH + 0.5, ZM], color: '#ffe0b8', power: 3.0, range: 7, night: true, lamp: true, radius: 0.1 });
  s.interact({ x: V.XV - 2.2, y: heightAt(V.XV - 2.2, SZ) + 1.6, z: SZ, radius: 2.2, prompt: 'Read the scoreboard', onUse: (gm) => say(gm, { name: 'The scoreboard', colour: C.saffron }, [
    'Field spinball, today. Pitch one: ' + fixtures[0][0] + ' ' + fixtures[0][1] + ', ' + fixtures[0][3] + ' ' + fixtures[0][2] + '. Pitch two: ' + fixtures[1][0] + ' ' + fixtures[1][1] + ', ' + fixtures[1][3] + ' ' + fixtures[1][2] + '. Pitch three: ' + fixtures[2][0] + ' against ' + fixtures[2][3] + ', not started: one side is still on its way up in the cabs.',
    'Pitch four is the practice pitch, open to anyone. First to twenty-one. A low hoop three, the high hoop five, and the spin end’s high hoop is worth the same as the anti end’s, which everyone agrees is unfair and nobody will change.',
    day === 3 ? 'Under it, a card: no fixtures after twelve on Booking Day. The feast. Bring the balls in.' : 'Under it, a card: Booking Day, no fixtures after twelve. The feast.',
  ]) });

  // ---- lamps on the veranda, lanterns and bunting under the eave
  for (const z of [V.Z0 + 3.6, ZM, V.Z1 - 4.0]) lamp(s, 'globe', V.XV + 1.8, roofAt(V.XV + 1.8) - 0.1, z, { K: 2700, power: 0.9, drop: 0.7, night: true, clip: [V.XV - 3, Y - 1, V.Z0 - 1, V.XF + 0.2, Y + 4, V.Z1 + 1] });
  lanternString(s, [V.XV + 0.1, EF - 0.35, V.Z0 + 0.3], [V.XV + 0.1, EF - 0.35, V.Z1 - 0.3], { n: 16, r: 0.13, offset: 2 });
  flags(s, [V.XV - 0.4, EF - 0.12, V.Z0 - 0.3], [V.XV - 0.4, EF - 0.12, V.Z1 + 0.3], { drop: 0.24 });
  // ---- the back: a sconce at the back door, spare boards stacked on end, crates of line paint
  s.furniture(() => {
    g.mat('paint', C.verm); g.box(V.XB, Y - 0.12, ZM - 0.5, V.XB + 0.06, Y + 2.1, ZM + 0.5, { bevel: 0.01 });
    g.mat('wood', '#7a5a3a'); for (let i = 0; i < 5; i++) g.box(V.XB + 0.1 + i * 0.07, heightAt(V.XB + 0.3, V.Z0 + 3), V.Z0 + 2.0, V.XB + 0.15 + i * 0.07, heightAt(V.XB + 0.3, V.Z0 + 3) + 1.4, V.Z0 + 5.6);
  });
  prop(s, 'crate', V.XB + 0.5, heightAt(V.XB + 0.5, V.Z1 - 3), V.Z1 - 3, 0.2, {});
  prop(s, 'crate', V.XB + 0.5, heightAt(V.XB + 0.5, V.Z1 - 3.7), V.Z1 - 3.7, -0.1, {});
  lamp(s, 'sconce', V.XB + 0.06, Y + 2.35, ZM, { face: 'X', K: 2800, power: 0.6, night: true });
  s.solid(V.XB + 0.08, heightAt(V.XB + 0.3, V.Z0 + 3), V.Z0 + 2.0, V.XB + 0.5, heightAt(V.XB + 0.3, V.Z0 + 3) + 1.4, V.Z0 + 5.6);

  // ---- people: on the veranda, at the tea, on the steps; paths from the steps to the pitches and the lift pavilion
  const chat = (x, z, n, rad, y, tags) => { for (let i = 0; i < n; i++) { const t = i / n * PI * 2 + 0.6, px = x + Math.cos(t) * rad, pz = z + Math.sin(t) * rad; s.spot('chat', px, y, pz, Math.atan2(x - px, z - pz), { tags }); } };
  chat(V.XV + 1.6, ZM + 3.2, 3, 0.65, Y, ['veranda', 'grounds']);
  chat(V.XV - 2.6, SZ - 3.0, 2, 0.6, heightAt(V.XV - 2.6, SZ - 3), ['grounds', 'watch']);
  s.path([[V.XV - 1.6, gf, SZ], [V.XV - 0.1, Y, SZ], [V.XF - 0.8, Y, SZ], [V.XF - 0.8, Y, V.Z1 - 1.2], [V.XV + 2.0, Y, V.Z1 - 0.4], [V.XV + 2.0, gb, V.Z1 + 1.7], [V.XV + 2.0, heightAt(V.XV + 2.0, V.Z1 + 6), V.Z1 + 6], [-677.4, heightAt(-677.4, 2427.2), 2427.2]], { tags: ['pavilion'] });
  s.path([[V.XF - 0.8, Y, SZ], [V.XF - 0.8, Y, V.Z0 + 1.0], [TX, Y, V.Z0 + 0.6]]);
  const bx1 = P.CX + P.L / 2 + P.BOARD + 0.9;
  s.path([[V.XV - 1.6, gf, SZ], [bx1, heightAt(bx1, SZ), SZ]]);
  s.path([[bx1, heightAt(bx1, pz0(2) + P.W + P.BOARD + 0.8), pz0(2) + P.W + P.BOARD + 0.8], [bx1, heightAt(bx1, pz0(3) - P.BOARD - 0.8), pz0(3) - P.BOARD - 0.8]]);
  s.finish();
  return s;
}

function paintScoreboard(ctx, w, h, fx, day) {
  ctx.fillStyle = '#20343a'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#e3aa3a'; ctx.fillRect(0, 0, w, 86);
  ctx.fillStyle = '#20343a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = "600 52px 'Barlow Condensed', sans-serif"; ctx.fillText('THE BREADBOARD  ·  FIELD SPINBALL', w / 2, 46);
  const row = (y, label, a, sa, sb, b) => {
    ctx.textAlign = 'left'; ctx.fillStyle = '#e3aa3a'; ctx.font = "600 26px 'Barlow Condensed', sans-serif"; ctx.fillText(label, 34, y);
    ctx.fillStyle = '#efe6d2'; ctx.font = "500 36px 'Barlow', sans-serif"; ctx.textAlign = 'right'; ctx.fillText(a, w / 2 - 92, y);
    ctx.textAlign = 'left'; ctx.fillText(b, w / 2 + 92, y);
    // flip tiles for the score
    for (const [x, v] of [[w / 2 - 74, sa], [w / 2 + 14, sb]]) { ctx.fillStyle = '#0f1c1f'; ctx.fillRect(x, y - 30, 60, 60); ctx.fillStyle = '#ffffff'; ctx.font = "600 44px 'Barlow Condensed', sans-serif"; ctx.textAlign = 'center'; ctx.fillText(String(v), x + 30, y + 2); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x, y - 1, 60, 2); }
  };
  row(150, 'PITCH 1', fx[0][0], fx[0][1], fx[0][2], fx[0][3]);
  row(232, 'PITCH 2', fx[1][0], fx[1][1], fx[1][2], fx[1][3]);
  row(314, 'PITCH 3', fx[2][0], '-', '-', fx[2][3]);
  ctx.textAlign = 'left'; ctx.fillStyle = '#e3aa3a'; ctx.font = "600 26px 'Barlow Condensed', sans-serif"; ctx.fillText('PITCH 4', 34, 396);
  ctx.fillStyle = '#efe6d2'; ctx.font = "italic 400 34px 'Cormorant Garamond', serif"; ctx.textAlign = 'center'; ctx.fillText('practice: the mark, three hoops, anyone', w / 2 + 40, 396);
  ctx.fillStyle = '#b9cfc8'; ctx.font = "500 24px 'Barlow Condensed', sans-serif";
  ctx.fillText('SEVEN A SIDE  ·  LOW HOOP 3  ·  HIGH HOOP 5  ·  FIRST TO 21  ·  ' + (day === 3 ? 'NO FIXTURES AFTER 12: THE FEAST' : 'BOOKING DAY: NO FIXTURES AFTER 12'), w / 2, h - 36);
}
