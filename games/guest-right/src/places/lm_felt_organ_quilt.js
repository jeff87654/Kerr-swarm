// The Quilt: the Bellows' concert hall, three decks tall, beside the court on its spinward side; the long foyer to its
// stalls door; the Kettle Room behind its stage. Frame 'felt-organ' (see lm_felt_organ.js).
//
// A hall in heliox rings every note into the next, so the Quilt is hung three layers deep: a skin of felt squares on
// every wall (each square given by a block of Ring Four, its name stitched in a corner), curtains a hand off the
// wall above head height, and long baffles hanging across the ceiling. Thirteen raked rows of thirty-one seats rise
// anti from the stage to a cross aisle on deck 151; the stage is set for a rehearsal.
import { floor, ceiling, lamp, block, stairs } from '../world/kit.js';
import { room } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { PI, QU, QRISE, CORR, KET, SDOOR, C, FELTS, say, toast, find, hour, day, tick, runX, wallRun, pickBy } from './lm_felt_organ_props.js';
import { shadeHex } from '../core/util.js';

const CLIP = [QU.x0 - 0.1, -0.3, QU.z0 - 0.1, QU.x1 + 0.1, QU.h + 0.1, QU.z1 + 0.1];
const SEATZ = (() => { const out = []; let z = -23.26; for (const n of [9, 13, 9]) { for (let i = 0; i < n; i++) out.push(z + 0.26 + i * 0.52); z += n * 0.52 + 1.2; } return out; })();
const rowX = (k) => QU.front - QU.pitch * k;            // the front edge of row k (row 0 at the front, on the floor)
const rowY = (k) => k * QRISE;
const STAGE_POS = [47, 2.4, -14];

export async function buildQuilt(game, s, f, r) {
  shell(s);
  await tick(game);
  felt(s, r);
  await tick(game);
  seats(game, s);
  await tick(game);
  stage(game, s, r);
  light(s);
  await tick(game);
  corridor(game, s, r);
  kettleRoom(game, s, f, r);
  await tick(game);
  zonesAndMusic(game, s, f);
}

// ---------------------------------------------------------------------------------------------------------------
function shell(s) {
  floor(s, QU.x0, QU.z0, QU.x1, QU.z1, 0, 'carpet', '#5a2a26');
  ceiling(s, QU.x0, QU.z0, QU.x1, QU.z1, QU.h, 'felt', '#2a1e28');
  const wo = { tint: '#3a2428', t: 0.2, skirt: false };
  wallRun(s, 'z', 19.55, QU.z0, QU.z1, 0, QU.h, wo, [[SDOOR.z0, SDOOR.w, 4, 2.3]]);
  wallRun(s, 'x', QU.z0 - 0.1, QU.x0, QU.x1, 0, QU.h, wo);
  wallRun(s, 'z', 53.15, QU.z0, QU.z1, 0, QU.h, Object.assign({}, wo, { tintB: '#d9cbb0', tintA: '#3a2428' }), [[-2.7, 1.4, 0, 2.2]]);
  // the north wall: the long foyer's side below, the hall's above
  wallRun(s, 'x', 0, 15.1, CORR.x1, 0, CORR.h, { tintA: '#e3d2b0', tintB: '#3a2428', t: 0.2, dado: { h: 1.1, mat: 'panel', tint: '#7a2f2a' } }, [[39.2, 1.6, 0, 2.4], [56.0, 1.2, 0, 2.2]]);
  wallRun(s, 'x', 0, QU.x0, QU.x1, CORR.h, QU.h - CORR.h, wo);
  // the rake: thirteen rows and the cross aisle at the top, carpeted, each riser with a brass nosing and a step light
  for (let k = 1; k <= 13; k++) {
    const xf = k === 13 ? rowX(12) - QU.pitch : rowX(k), xb = k === 13 ? QU.x0 : rowX(k) - QU.pitch, y = k === 13 ? 4 : rowY(k);
    block(s, xb, 0, QU.z0, xf, y, QU.z1, 'carpet', '#6a2c28', { faces: 'XY' });
    s.deco((gg) => {
      gg.mat('cast', C.brass, { rough: -0.2 }); gg.box(xf - 0.03, y - 0.02, QU.z0, xf + 0.005, y + 0.004, QU.z1, { faces: 'XY' });
      gg.mat('diffuser', '#ffcf8a', { emissive: 1.6, lamp: true });
      for (const z of [-18.0, -10.0, -25.4, -2.6]) gg.box(xf + 0.004, y - 0.12, z - 0.08, xf + 0.008, y - 0.08, z + 0.08, { faces: 'X' });
    });
  }
}

// ---------------------------------------------------------------------------------------------------------------
// the felt: squares on every wall, curtains a hand off them, baffles across the ceiling
// ---------------------------------------------------------------------------------------------------------------
function felt(s, r) {
  const sq = 1.4, gap = 0.05;
  const colourAt = (i, j, w) => shadeHex(FELTS[(i * 7 + j * 3 + w * 5 + ((i * j) % 4)) % FELTS.length], 0.82 + ((i * 13 + j * 7) % 5) * 0.06);
  // long walls: south (face +z) and north (face -z)
  for (const [zf, dir, w] of [[QU.z0 + 0.01, 1, 0], [QU.z1 - 0.11, -1, 1]]) {
    runX(QU.x0 + 0.05, QU.x1 - 0.05, 8.4, (a, b, bi) => s.deco((gg) => {
      const n = Math.round((b - a) / sq);
      for (let i = 0; i < n; i++) for (let j = 0; j < 8; j++) {
        const x0 = a + i * (b - a) / n + gap, x1 = a + (i + 1) * (b - a) / n - gap, y0 = j * sq + gap, y1 = Math.min(QU.h - 0.1, (j + 1) * sq - gap);
        if (y1 <= y0) continue;
        const ii = bi * 6 + i;
        gg.mat('felt', colourAt(ii, j, w)); gg.box(x0, y0, Math.min(zf, zf + dir * 0.05), x1, y1, Math.max(zf, zf + dir * 0.05), { faces: dir > 0 ? 'ZxXyY' : 'zxXyY', bevel: 0.012 });
        if ((ii * 5 + j * 3) % 7 === 0) { gg.mat('felt', '#efe4c8'); gg.box(x1 - 0.26, y0 + 0.06, Math.min(zf, zf + dir * 0.056), x1 - 0.06, y0 + 0.16, Math.max(zf, zf + dir * 0.056), { faces: dir > 0 ? 'Z' : 'z' }); }
      }
    }));
  }
  // the anti end wall (face +x), above the cross aisle and the rows
  s.deco((gg) => {
    for (let i = 0; i < 20; i++) for (let j = 3; j < 8; j++) {
      const z0 = QU.z0 + i * sq + gap, z1 = QU.z0 + (i + 1) * sq - gap, y0 = j * sq + gap, y1 = Math.min(QU.h - 0.1, (j + 1) * sq - gap);
      if (z1 > QU.z1 || (j * sq < 6.6 && z1 > SDOOR.z0 - 0.2 && z0 < SDOOR.z0 + SDOOR.w + 0.2)) continue;
      gg.mat('felt', colourAt(i, j, 2)); gg.box(QU.x0 + 0.06, y0, z0, QU.x0 + 0.11, y1, z1, { faces: 'XzZyY', bevel: 0.012 });
    }
  });
  // behind the stage: a shell of deep madder felt in tall pleated panels
  runX(QU.z0 + 0.2, QU.z1 - 0.2, 7, (a, b) => s.deco((gg) => {
    gg.mat('felt', '#7a2420');
    gg.sheet([QU.x1 - 0.25, QU.h - 0.2, a], [QU.x1 - 0.25, QU.h - 0.2, b], [QU.x1 - 0.25, 1.0, b], [QU.x1 - 0.25, 1.0, a], { nu: 14, nv: 2, ripple: 0.07, rippleN: 10 });
  }));
  // the second layer: curtains a hand off the long walls, above head height
  for (const [zw, dz] of [[QU.z0 + 0.4, 1], [QU.z1 - 0.5, -1]]) {
    for (let x = QU.x0 + 2; x < QU.x1 - 2.5; x += 2.9) {
      const col = pickBy([C.indigo, C.plum, '#6a2420', '#2f4f4a'], Math.round(x * 3 + dz));
      s.deco((gg) => { gg.mat('felt', col); gg.sheet([x, QU.h - 0.4, zw], [x + 2.5, QU.h - 0.4, zw], [x + 2.5, 5.2, zw], [x, 5.2, zw], { nu: 10, nv: 2, ripple: 0.09 * dz, rippleN: 7 }); });
    }
    s.deco((gg) => { gg.mat('cast', C.brass, { rough: -0.2 }); runX(QU.x0 + 1.5, QU.x1 - 1.5, 8, (a, b) => gg.tube([[a, QU.h - 0.38, zw], [b, QU.h - 0.38, zw]], 0.025, { segs: 6, caps: false })); });
  }
  // the third layer: baffles hanging across the room, saffron and teal, sagging a little between their wires
  let k = 0;
  for (let x = 23; x < QU.x1 - 3; x += 4.4) {
    const col = k % 2 ? C.saffron : C.tealL; k++;
    runX(QU.z0 + 1.2, QU.z1 - 1.2, 6.5, (a, b) => s.deco((gg) => { gg.mat('felt', col); gg.sheet([x, QU.h - 0.15, a], [x, QU.h - 0.15, b], [x, QU.h - 1.5, b], [x, QU.h - 1.5, a], { nu: 6, nv: 1, sag: 0.18, sagEdge: 'all' }); }));
  }
  void r;
}

// ---------------------------------------------------------------------------------------------------------------
// four hundred and three seats
// ---------------------------------------------------------------------------------------------------------------
function seats(game, s) {
  for (let k = 0; k < QU.rows; k++) {
    const cx = rowX(k) - 0.45, y = rowY(k);
    for (let i = 0; i < SEATZ.length; i++) {
      const z = SEATZ[i], c = FELTS[(k * 7 + i * 3 + (i > 8 ? 1 : 0)) % 8];
      prop(s, 'feltorgan.seat', cx, y, z, PI / 2, { c }, { tier: 'd' });
      if (k >= 1 && k <= 9 && (i + k) % 3 === 0) s.spot('sit', cx + 0.02, y + 0.48, z, PI / 2, { tags: ['listen'] });
    }
    // the end seats of each block carry an iron standard on their open side
    s.detail((gg) => { gg.mat('cast', C.iron); for (const z of [SEATZ[8] + 0.26, SEATZ[21] + 0.26, SEATZ[30] + 0.26]) gg.box(cx - 0.26, y, z - 0.0, cx + 0.18, y + 0.64, z + 0.025, { faces: 'zZY' }); });
    s.solid(cx - 0.3, y, SEATZ[0] - 0.26, cx + 0.24, y + 0.5, SEATZ[8] + 0.26);
    s.solid(cx - 0.3, y, SEATZ[9] - 0.26, cx + 0.24, y + 0.5, SEATZ[21] + 0.26);
    s.solid(cx - 0.3, y, SEATZ[22] - 0.26, cx + 0.24, y + 0.5, SEATZ[30] + 0.26);
  }
  // a coat over a seat back, a programme left on a seat, a felt cushion for a child
  s.detail((gg) => {
    for (const [k, i, c] of [[3, 4, '#3f4a5a'], [5, 15, '#7a3a2a'], [8, 26, '#4a5a3a'], [2, 19, '#2f3f6a']]) {
      const cx = rowX(k) - 0.45 - 0.28, y = rowY(k), z = SEATZ[i];
      gg.mat('weave', c); gg.box(cx - 0.05, y + 0.6, z - 0.24, cx + 0.04, y + 1.02, z + 0.24, { bevel: 0.03 });
    }
    gg.mat('paper', '#efe6d0'); for (const [k, i] of [[1, 12], [6, 3], [9, 24]]) { const cx = rowX(k) - 0.4, y = rowY(k), z = SEATZ[i]; gg.box(cx - 0.1, y + 0.49, z - 0.07, cx + 0.1, y + 0.5, z + 0.07, { faces: 'Y' }); }
    gg.mat('felt', C.saffron); { const cx = rowX(4) - 0.42, y = rowY(4), z = SEATZ[13]; gg.box(cx - 0.17, y + 0.48, z - 0.2, cx + 0.17, y + 0.6, z + 0.2, { bevel: 0.04 }); }
  });
  // take a seat: on the centre aisle, a few rows up
  for (const [k, i] of [[4, 9], [7, 21], [10, 9]]) {
    const cx = rowX(k) - 0.45, y = rowY(k), z = SEATZ[i];
    s.interact({ x: cx + 0.3, y: y + 1.1, z: i === 9 ? z - 0.8 : z + 0.8, radius: 1.2, prompt: 'Take a seat', onUse: async (gm) => {
      if (gm.player && gm.player.sit) { gm.player.sit({ x: cx, y, z, yaw: PI / 2 }); gm.player.yaw = PI / 2; gm.player.pitch = -0.05; }
      const h = hour(gm);
      if (h >= 9.5 && h < 21.5) toast(gm, pickBy([
        'On the stage they stop, go back nine bars, and start again. The felt takes every note as soon as it is sung, so you hear each one clean.',
        'The conductor taps her stand twice. In a bare room you would hear it come back off the walls. Here it stops where it is.',
        'A flute a metre and a fifth long plays the old A. Nobody in the hall thinks it strange. Nobody here has heard a short one.',
      ], Math.floor(h * 3)));
      else toast(gm, 'The hall is dark but for the step lights. The felt drinks even your breathing.');
    } });
  }
  // the walkways: the long foyer door to the front aisle, up the aisles to the cross aisle and the stair hall's door
  for (const z of [-18.0, -10.0]) {
    const pts = [[40.2, 0, -1.6], [40.2, 0, z]];
    for (let k = 0; k <= 12; k++) pts.push([rowX(k) - 0.6, rowY(k), z]);
    pts.push([21.8, 4, z]);
    s.path(pts, { width: 1.0 });
  }
  s.path([[40.0, 0, 1.0], [40.0, 0, -1.6], [45, 0, -1.6], [48.2, 0, -1.6], [49.0, 0, -0.9], [49.0, 1, -3.6], [49.0, 1, -6]], { width: 1.1 });
  s.path([[40.2, 0, -10.0], [40.2, 0, -18.0], [40.2, 0, -24.0]], { width: 1.2 });
  s.path([[21.8, 4, -18.0], [21.8, 4, -10.0], [21.8, 4, -2.4], [19.0, 4, -2.4]], { width: 1.2 });
}

// ---------------------------------------------------------------------------------------------------------------
// the stage, set for a rehearsal: chairs in two arcs, stands, the choir's risers, drums, a table of cups under lids
// ---------------------------------------------------------------------------------------------------------------
function stage(game, s, r) {
  const g = s.g, Y = QU.stageH, X0 = QU.stage, X1 = QU.x1 - 0.3;
  block(s, X0, 0, QU.sz0, X1, Y, QU.sz1, 'planks', '#9a6a40', { bevel: 0.01 });
  s.deco((gg) => {
    gg.mat('felt', '#7a2420'); runX(QU.sz0, QU.sz1, 8, (a, b) => gg.sheet([X0 - 0.02, Y, a], [X0 - 0.02, Y, b], [X0 - 0.02, 0.02, b], [X0 - 0.02, 0.02, a], { nu: 10, nv: 1, ripple: 0.025, rippleN: 14 }));
    gg.mat('cast', C.brass); runX(QU.sz0, QU.sz1, 8, (a, b) => gg.box(X0 - 0.03, Y - 0.03, a, X0 + 0.02, Y, b, { faces: 'XY' }));
    gg.mat('rush', '#8a6a3a'); gg.box(42.8, Y, -16, 46.4, Y + 0.01, -12, { faces: 'Y' });
  });
  stairs(s, 49.0, 0, -0.6, 'z', Y, 2.4, 1.6, { mat: 'planks', tint: '#8a5a34' });
  stairs(s, 39.9, 0, -24.0, 'X', Y, 1.6, 1.4, { mat: 'planks', tint: '#8a5a34' });
  // the choir's risers at the back, three steps
  for (let i = 0; i < 3; i++) block(s, 49.4 + i * 0.95, Y, -21, X1, Y + 0.3 * (i + 1), -7, 'planks', shadeHex('#9a6a40', 0.92 - i * 0.05), { bevel: 0.008 });
  // chairs in two arcs facing the conductor's place, each with a stand; instruments left on some
  const cx = 42.4, cz = -14, chairs = [];
  for (const [rad, n] of [[3.0, 7], [4.8, 9]]) for (let i = 0; i < n; i++) {
    const a = -1.0 + 2.0 * i / (n - 1), x = cx + Math.cos(a) * rad, z = cz + Math.sin(a) * rad, yaw = Math.atan2(-Math.cos(a), -Math.sin(a));   // face the conductor
    chairs.push([x, z, yaw]);
    prop(s, 'chair', x, Y, z, yaw, { wood: r.pick(['#6b4a2f', '#5a3a24', '#7a5233']), seat: r.pick(['#d9c08a', '#b9552e', '#2f6f73']), back: r.chance(0.5) ? 'slat' : 'hoop' }, { noSpots: true });
    if (r.chance(0.8)) prop(s, 'feltorgan.stand', x + Math.sin(yaw) * 0.62, Y, z + Math.cos(yaw) * 0.62, yaw + PI, {});
  }
  for (const k of [1, 4, 9, 13]) { const [x, z, yaw] = chairs[k]; prop(s, 'feltorgan.flute', x - Math.cos(yaw) * 0.6, Y + 0.465, z + Math.sin(yaw) * 0.6, yaw, { L: 1.2 }); }
  // hand drums on the stage's south side, a stool
  for (const [x, z, rr] of [[47.0, -20.5, 0.28], [47.8, -21.2, 0.22], [46.3, -21.4, 0.32]]) s.furniture((gg) => { gg.mat('wood', '#7a4a2a'); gg.lathe(x, z, [[rr * 0.7, Y], [rr * 0.85, Y + 0.25], [rr, Y + 0.55], [rr * 1.02, Y + 0.6]], { segs: 14 }); gg.mat('weave', '#e6d6b0'); gg.lathe(x, z, [[rr * 1.02, Y + 0.6], [0, Y + 0.61]], { segs: 14, capBottom: false }); });
  prop(s, 'stool', 46.9, Y, -19.8, 0, { wood: '#6b4a2f' });
  // a side table with cups under lids, a coat over a chair, the conductor's stand
  prop(s, 'table', 51.6, Y, -4.6, 0, { w: 1.2, d: 0.6, wood: '#5a3a24' });
  for (let i = 0; i < 5; i++) prop(s, 'cup', 51.15 + i * 0.22, Y + 0.74, -4.6 + (i % 2) * 0.12, 0, { glaze: r.pick(['#d9cfb8', '#a3563a', '#2f6f73', '#e7b547']) });
  prop(s, 'feltorgan.stand', 42.1, Y, -14, PI / 2, { tint: '#5a3a24' });
  // performers: in the evening a full rehearsal; by day a few on their own, practising
  for (let i = 0; i < chairs.length; i++) {
    const [x, z, yaw] = chairs[i];
    const tag = i % 5 === 2 ? 'drum' : 'flute';
    s.spot('perform', x, Y + 0.46, z, yaw, { tags: [tag] });
    if (i % 4 === 1) s.spot('sit', x, Y + 0.46, z, yaw, { tags: [tag === 'drum' ? 'flute' : tag] });
  }
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) {
    const x = 49.85 + i * 0.95, z = -19 + j * 3.6 + i * 0.6, y = Y + 0.3 * (i + 1);
    s.spot('perform', x, y, z, -PI / 2, { tags: ['sing'] });
  }
  s.spot('sit', 51.6, Y + 0.3 * 3 + 0.0, -9.0, -PI / 2, { tags: ['sing'] });
  s.spot('work', 42.7, Y, -14, PI / 2, { tags: ['notes'] });
  // the programme table at the top of the hall
  prop(s, 'table', 21.0, 4, -14, PI / 2, { w: 1.4, d: 0.6, wood: '#5a3a24' }, { level: 1 });
  s.detail((gg) => { gg.mat('paper', '#efe6d0'); for (let i = 0; i < 4; i++) gg.box(20.85, 4.74 + i * 0.012, -14.6 + i * 0.3, 21.15, 4.752 + i * 0.012, -14.35 + i * 0.3, { faces: 'Y' }); gg.mat('paper', '#d9a64a'); gg.box(20.82, 4.74, -13.6, 21.18, 4.76, -13.35, { faces: 'Y' }); }, 1);
  s.spot('work', 20.3, 4, -14.9, PI / 2, { tags: ['serve'] });
  s.interact({ x: 21.4, y: 5.1, z: -14, radius: 1.3, prompt: 'Take a programme', onUse: async (gm) => {
    const d = day(gm);
    await say(gm, 'The programme', [
      d === 3 ? 'BOOKING DAY. No concert tonight: the halls have the feast and the Spindle has the flight. The Quilt is open for anyone who wants to sit somewhere quiet.' : d === 2 ? 'THE QUIET. No performance, no recording, no messages. The Quilt is open all day for sitting in and for talking quietly.' : 'TONIGHT AT HALF PAST SEVEN: THE RING FOUR CHOIRS, and a new piece for eight flutes and the Bellows, called Rain on a Roof.',
      'A note on the piece, for those who were not sure: Rain was water that fell on old Earth from clouds high overhead, in drops, without anyone pouring it. It fell on roofs, which were lids on houses to keep it off. It made a sound on them like this piece. People liked to sleep to it.',
      'The flutes are cut for this hall, at twenty-two degrees. Please do not clap between the parts: in this room you will hear the silence, and it is part of it.',
    ]);
  } });
}

// ---------------------------------------------------------------------------------------------------------------
function light(s) {
  const lc = [C.saffron, '#e07a3a', '#e8b84a', '#c4553a', C.saffron, '#e07a3a'];
  let i = 0;
  for (const x of [26, 32.5, 39]) for (const z of [-19.5, -8.5]) { lamp(s, 'lantern', x, 8.6, z, { tint: lc[i++], r: 0.42, hh: 0.66, drop: QU.h - 8.9, power: 2.4, range: 11, K: 2600, clip: CLIP }); }
  for (const z of [-20, -14, -8]) {
    s.light({ at: [44.2, QU.h - 0.4, z], type: 'spot', dir: [0.42, -1, 0], cone: [38, 22], color: [1, 0.86, 0.68], power: 26, range: 14, shadow: true, clip: CLIP });
    s.deco((gg) => { gg.mat('cast', '#1a1a1a'); gg.cyl(44.2, QU.h - 0.55, z, 0.14, 0.4, { segs: 10 }); gg.mat('diffuser', '#ffe2b0', { emissive: 3 }); gg.cyl(44.2, QU.h - 0.56, z, 0.11, 0.01, { segs: 10 }); });
  }
  for (const x of [27, 35]) for (const [z, fc] of [[QU.z0 + 0.12, 'Z'], [QU.z1 - 0.18, 'z']]) lamp(s, 'sconce', x, 5.4, z, { face: fc, K: 2600, power: 0.8, range: 6, clip: CLIP });
  s.ambient({ box: CLIP, sky: '#e8a878', ground: '#7a3a2a', power: 0.14, soft: 1.2, spec: 0.3, lamp: true });
}

// ---------------------------------------------------------------------------------------------------------------
// the long foyer: from the main foyer to the stalls door and the Kettle Room, its walls hung with the year's posters
// ---------------------------------------------------------------------------------------------------------------
function corridor(game, s, r) {
  const X0 = CORR.x0, X1 = CORR.x1, Z0 = CORR.z0, Z1 = CORR.z1, H = CORR.h, g = s.g;
  const clip = [X0, -0.2, Z0, X1 + 0.1, H + 0.1, Z1 + 0.1];
  floor(s, X0, Z0, X1, Z1, 0, 'terrazzo', '#c2ae8e');
  ceiling(s, X0, Z0, X1, Z1, H, 'paint', '#efe2c8');
  wallRun(s, 'x', Z1 + 0.08, X0, X1, 0, H, { tint: '#e3d2b0', t: 0.16, dado: { h: 1.1, mat: 'panel', tint: '#7a2f2a' } });
  wallRun(s, 'z', X1 + 0.08, Z0, Z1, 0, H, { tint: '#e3d2b0', t: 0.16, dado: { h: 1.1, mat: 'panel', tint: '#7a2f2a' } });
  s.deco((gg) => { gg.mat('terrazzo', '#7a2f2a'); runX(X0 + 1, X1 - 1, 8, (a, b) => gg.box(a, 0, 3.4, b, 0.004, 4.6, { faces: 'Y' })); });
  // posters for the year's concerts on the north wall, benches under them, plants by the lamps
  const posters = [
    { kind: 'poster', title: 'THE RING FOUR CHOIRS', sub: 'Thursday · half past seven', palette: ['#7a2f2a', '#f1e6c9', '#e8b84a'], emblem: 'drum' },
    { kind: 'poster', title: 'RAIN ON A ROOF', sub: 'eight flutes and the Bellows', palette: ['#2f3f6a', '#f1e6c9', '#8fc0d0'], emblem: 'drop' },
    { kind: 'poster', title: 'THE KNOTNIGHT SINGS', sub: 'every block that will come', palette: ['#2a2c2c', '#f1e6c9', '#d99a2b'], emblem: 'lamp' },
    { kind: 'poster', title: 'BEGINNERS MEASURED', sub: 'the Cutting Room · Tuesdays', palette: ['#2f5d5a', '#f1e6c9', '#e8b84a'], emblem: 'flute' },
  ];
  posters.forEach((p, i) => sign(s, p, 21 + i * 9.5, 1.85, Z1 - 0.01, { face: 'z', w: 0.9, h: 1.25 }));
  for (const x of [25.5, 35, 44.5]) prop(s, 'bench', x, 0, Z1 - 0.45, PI, { w: 2.2, wood: '#7a5233', back: true });
  for (const x of [17.5, 30.3, 49.5]) prop(s, 'plant', x, 0, Z1 - 0.45, 0, { kind: r.pick(['broad', 'fern', 'fine']), size: 1.1, pot: r.pick(['#a3563a', '#2f6f73', '#c9962e']) });
  sign(s, { kind: 'hanging', text: 'THE QUILT', sub: 'stalls', palette: ['#7a2f2a', '#f1e6c9', '#e8b84a'], emblem: 'drum' }, 40.0, 2.7, 0.6, { face: 'Z', double: true, w: 0.7, h: 0.5 });
  sign(s, { kind: 'plate', text: 'KETTLE ROOM', sub: 'players and their guests', palette: ['#2f5d5a', '#f1e6c9'] }, 57.8, 1.6, 0.12, { face: 'Z', w: 0.7, h: 0.22 });
  for (const x of [20, 31, 42, 53]) lamp(s, 'globe', x, H - 0.55, 4, { K: 2800, power: 0.9, drop: 0.5, r: 0.2, clip });
  s.ambient({ box: clip, sky: '#ffdcae', ground: '#c9a57c', power: 0.18, lamp: true });
  s.path([[13.5, 0, 4.0], [20, 0, 4.0], [30, 0, 4.0], [40.0, 0, 4.0], [40.0, 0, 1.0], [40.0, 0, 4.0], [50, 0, 4.0], [56.6, 0, 4.0], [56.6, 0, 1.0], [56.6, 0, -1.2]], { width: 1.6 });
  s.spot('chat', 33.2, 0, 2.6, 0.5, {}); s.spot('chat', 34.0, 0, 3.4, -2.5, {});
  s.spot('stand', 23.6, 0, Z1 - 0.9, PI, { tags: ['board'] });
  s.zoneBox({ id: 'fo-corridor', place: 'felt-organ', box: [X0, -0.5, Z0, X1, H, Z1], name: 'The long foyer', sub: 'The Bellows · deck 150', ambience: 'quiet', reverb: 'room' });
  void game; void g;
}

// ---------------------------------------------------------------------------------------------------------------
// the Kettle Room: the players' room behind the stage
// ---------------------------------------------------------------------------------------------------------------
function kettleRoom(game, s, f, r) {
  const K = KET, g = s.g;
  const clip = room(s, { x0: K.x0 - 0.2, z0: K.z0, x1: K.x1, z1: K.z1, y: 0, h: K.h, floor: ['planks', '#9a6a40'], ceil: ['paint', '#e9dcc0'], wall: { tint: '#c9d0b0', dado: { h: 1.0, mat: 'panel', tint: '#2f5d5a' } }, open: { w: false, s: false } });
  // a long table, chairs that do not match, cups under lids, an urn on the loop
  prop(s, 'table', 57.2, 0, -7.5, PI / 2, { w: 3.2, d: 0.9, wood: '#6b4a2f' });
  const cols = ['#d9c08a', '#b9552e', '#2f6f73', '#e7b547'];
  for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) prop(s, 'chair', 57.2 + sd * 0.75, 0, -8.7 + i * 0.8, sd > 0 ? -PI / 2 : PI / 2, { wood: r.pick(['#6b4a2f', '#5a3a24', '#7a5233']), seat: cols[(i + (sd > 0 ? 1 : 0)) % 4], back: (i + sd) % 2 ? 'slat' : 'hoop' });
  for (let i = 0; i < 6; i++) prop(s, 'cup', 56.95 + (i % 2) * 0.5, 0.74, -8.9 + i * 0.5, 0, { glaze: r.pick(['#d9cfb8', '#a3563a', '#2f6f73']) });
  for (let i = 0; i < 2; i++) prop(s, 'bowl', 57.2, 0.74, -6.6 - i * 1.2, 0, { glaze: '#e9e1cf', lid: '#2f6f73' });
  prop(s, 'counter', 60.55, 0, -4, -PI / 2, { w: 2.4, d: 0.6, body: '#2f5d5a' }, { noSpots: true });
  s.furniture((gg) => {
    gg.mat('cast', '#b8b4ac', { rough: -0.3 }); gg.lathe(60.5, -4.4, [[0.18, 0.92], [0.2, 0.95], [0.2, 1.4], [0.14, 1.48], [0.05, 1.52]], { segs: 16 });
    gg.mat('cast', '#a8432e'); gg.tube([[60.98, 1.6, -4.4], [60.98, 0.95, -4.4]], 0.02, { segs: 6 }); gg.tube([[60.98, 1.6, -3.6], [60.98, 0.95, -3.6]], 0.02, { segs: 6 });
    gg.mat('cast', '#2f6f73'); gg.tube([[60.98, 1.25, -4.4], [60.6, 1.25, -4.4]], 0.015, { segs: 5 });
  });
  // instrument cases on a shelf, coats on pegs, a mirror lit from both sides, a rota on the wall
  prop(s, 'shelving', 58.6, 0, K.z0 + 0.3, 0, { w: 2.2, h: 1.9, d: 0.4, wood: '#5a3a24' });
  s.detail((gg) => {
    for (let i = 0; i < 4; i++) { gg.mat('weave', r.pick(['#3a2a20', '#2a3a3a', '#4a2a2a'])); gg.box(57.6 + (i % 2) * 0.3, 0.1 + i * 0.45, K.z0 + 0.14, 59.6 - (i % 2) * 0.2, 0.3 + i * 0.45, K.z0 + 0.46, { bevel: 0.03 }); }
    gg.mat('wood', '#5b4636'); gg.box(53.55, 1.86, -8.5, 53.6, 1.96, -3.5);
    for (let i = 0; i < 8; i++) { const z = -8.2 + i * 0.6; gg.mat('weave', r.pick(['#3f4a5a', '#7a3a2a', '#4a5a3a', '#6a5a4a', '#2f3f6a'])); gg.box(53.6, 0.95, z - 0.2, 53.7, 1.8, z + 0.2, { bevel: 0.03 }); gg.mat('knit', r.pick([C.saffron, '#b5532e', '#2f6f73'])); gg.box(53.7, 1.2, z - 0.08, 53.705, 1.3, z + 0.02, { faces: 'X' }); }
    gg.mat('brushed', '#cfd8d8', { rough: -0.45 }); gg.box(K.x1 - 0.08, 1.0, -9.6, K.x1 - 0.06, 2.0, -8.2, { faces: 'x' });
    gg.mat('diffuser', '#ffe2b0', { emissive: 3, lamp: true }); for (const z of [-9.75, -8.05]) gg.box(K.x1 - 0.1, 1.1, z - 0.04, K.x1 - 0.06, 1.9, z + 0.04, { faces: 'x' });
  });
  sign(s, { kind: 'notice', title: 'The Quilt · this week', lines: ['Thu 16:00 flutes (cut Tuesday)', 'Thu 19:30 the Ring Four choirs', 'Fri: the Quiet. No calls.', 'Sat: Booking Day. Feast at your', 'own hall. Flight at ten.', 'Kettle: last one out unplugs it.'] }, K.x1 - 0.08, 1.6, -6.6, { face: 'x', w: 0.7, h: 0.8 });
  // a rug under the table, a sofa of two benches and felt cushions, a low table, a plant, a lantern over the table
  prop(s, 'rug', 57.2, 0, -7.5, PI / 2, { w: 4.2, d: 2.6, a: '#7a2f2a', b: '#d9a64a' });
  prop(s, 'bench', 54.15, 0, -5.6, PI / 2, { w: 2.0, wood: '#5a3a24', back: true });
  s.detail((gg) => { for (let i = 0; i < 3; i++) { gg.mat('felt', [C.saffron, C.tealL, C.madder][i]); gg.box(54.0, 0.46, -6.4 + i * 0.62, 54.4, 0.58, -5.9 + i * 0.62, { bevel: 0.04 }); } gg.mat('felt', C.plum); gg.box(53.9, 0.6, -6.3, 54.05, 0.95, -5.0, { bevel: 0.05 }); });
  prop(s, 'table', 55.2, 0, -5.6, 0, { w: 0.6, d: 0.5, h: 0.45, round: true, wood: '#6b4a2f' });
  prop(s, 'cup', 55.1, 0.45, -5.55, 0, { glaze: '#e7b547' });
  prop(s, 'plant', 54.0, 0, K.z0 + 0.5, 0, { kind: 'broad', size: 1.3, pot: '#a3563a' });
  lamp(s, 'lantern', 57.2, 2.3, -7.5, { tint: C.saffron, r: 0.32, hh: 0.5, drop: 0.5, power: 1.0, range: 6, K: 2700, clip });
  lamp(s, 'panel', 57.2, K.h, -4.2, { w: 2.0, d: 0.5, K: 3000, power: 0.6, clip });
  s.loop('steam', 60.5, 1.4, -4.4, { vol: 0.06, radius: 3 });
  s.spot('chat', 55.4, 0, -2.4, 0.6, {}); s.spot('chat', 56.1, 0, -1.7, -2.6, {}); s.spot('chat', 54.7, 0, -1.6, 2.2, {});
  s.spot('work', 59.9, 0, -4.4, PI / 2, { tags: ['serve'] });
  s.path([[49.6, 0, -1.9], [53.15, 0, -1.9], [55.2, 0, -2.6], [57.2, 0, -5.4], [56.6, 0, -1.2]], { width: 1.1 });
  s.interact({ x: 60.2, y: 1.3, z: -4.0, radius: 1.3, prompt: 'Take a cup from the urn', onUse: async (gm) => {
    await say(gm, 'The Kettle Room', [
      'The urn runs off the food plant\'s loop, like every kitchen in the drum: sixty-five degrees, and it never boils. The tea is a little cooler than you would make it, and nobody here has ever had it any other way.',
      'A drummer pushes a lidded cup along the table to you without stopping her story. You are in the players\' room, so you are somebody\'s guest, and guests are not asked whose.',
    ]);
    if (gm.audio) gm.sfxAt('pour', gm.world.frames.get('felt-organ'), 60.4, 1.1, -4.2);
  } });
  s.interact({ x: K.x1 - 0.8, y: 1.5, z: -6.6, radius: 1.3, prompt: 'Read the rota', onUse: async (gm) => {
    await say(gm, 'The rota', [
      'THE QUILT · THIS WEEK. Thursday at four, the flutes, cut on Tuesday. Thursday at half past seven, the Ring Four choirs. Friday is the Quiet: no calls, no rehearsal, sit in the hall if you like. Saturday is Booking Day: feast at your own hall, the flight at ten.',
      'Under it, a longer list in many hands: which block\'s choir sings on which evening, for the whole year, so that every one of Ring Four\'s blocks gets the Quilt once. Somebody has swapped two of them in pencil and drawn a heart.',
    ]);
  } });
  s.zoneBox({ id: 'fo-kettle', place: 'felt-organ', box: [K.x0, -0.5, K.z0, K.x1, K.h, K.z1], name: 'The Kettle Room', sub: 'The Bellows · behind the Quilt', ambience: 'flat', reverb: 'room' });
  void f; void g; void clip;
}

// ---------------------------------------------------------------------------------------------------------------
// the Quilt's zone and its rehearsal: the choir cue, from the stage, while you are in the hall
// ---------------------------------------------------------------------------------------------------------------
function zonesAndMusic(game, s, f) {
  s.zoneBox({ id: 'fo-quilt', place: 'felt-organ', box: [QU.x0, -0.5, QU.z0, QU.x1, QU.h, QU.z1], name: 'The Quilt', sub: 'The Bellows · the concert hall · four hundred and three seats', ambience: 'quiet', reverb: 'felt', headroom: QU.h, env: { exposure: 1.0, autoKey: 0.14, bloom: 0.07, warmth: 0.16, contrast: 1.08, saturation: 1.12 } });
  sign(s, { kind: 'notice', title: 'Why the felt', lines: ['Heliox carries sound fast and', 'bare walls ring every note into', 'the next. So: three layers.', 'Squares on the wall, curtains', 'a hand off it, baffles above.', 'Each square was given by a block.'] }, 37.4, 1.55, -0.12, { face: 'z', w: 0.62, h: 0.7 });
  s.interact({ x: 37.4, y: 1.4, z: -0.9, radius: 1.3, prompt: 'Read the card by the door', onUse: async (gm) => {
    await say(gm, 'Why the felt', [
      'Sound runs about 1.8 times as fast in heliox, and a bare room in the drum rings: every note comes back off the walls in time to land on the next. A hall for listening has to drink it.',
      'So the Quilt is hung three layers deep. A skin of felt squares on every wall; curtains a hand off the wall above head height, so the sound goes through one, back off the wall and through the other; and baffles hanging across the ceiling.',
      'Every square was given by a block of Ring Four, cut from whatever it had: old coats, a hall\'s table felts, a child\'s blanket. The block\'s name is stitched in a corner. When a square wears through, the block sends another.',
    ]);
    find(gm, 'long-pipes');
  } });
  // the rehearsal: in the hall between half past nine and half past nine, the choir cue from the stage
  const stagePos = () => game.toListener ? game.toListener(f, STAGE_POS[0], STAGE_POS[1], STAGE_POS[2]) : [0, 0, -10];
  let mine = false;
  const off = game.events.on('zone', (e) => {
    const z = e && e.zone, a = game.audio; if (!a || !a.music) return;
    const inHall = !!z && z.id === 'fo-quilt';
    const h = hour(game);
    if (inHall && !mine && h >= 9.5 && h < 21.5 && day(game) !== 2) { mine = true; a.music('choir', { pos: stagePos, radius: 9, vol: 0.85, fade: 2 }); }
    else if (!inHall && mine) { mine = false; a.music(null, { fade: 2 }); }
  });
  s.onDispose(() => { if (typeof off === 'function') off(); if (mine && game.audio && game.audio.music) { mine = false; game.audio.music(null, { fade: 1 }); } });
  void toast;
}
