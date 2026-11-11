// The Spouts: the slide hall of lm_chimney.js, off the Rack's ground floor. A tower climbs four decks (y 0 to 16) and
// three tube slides wind down from its top: Sink runs spinward, Float runs anti, True runs along the axis. Children say
// the rule before they can read: axis flies true, spin sinks, anti floats. Going spinward you weigh more and the trough
// holds you harder; coming down, the spin pushes you anti, which is back up Sink and on down Float. So Sink comes out
// slow, Float fast, and True is the fair one. You can ride any of them; the board keeps your time.
import { floor, ceiling, wall, lamp, block, stairs } from '../world/kit.js';
import { railing } from '../world/kit2.js';
import { prop, bunting } from '../world/props.js';
import { sign, signRect } from '../world/signs.js';
import { Rng, shadeHex, clamp } from '../core/util.js';
import { HALL, PAL, SUB, toast, sfx, say, read, seat, frameWait, movable, softPit, sweepTrough, drawRider } from './lm_chimney_parts.js';
import { SLIDES, TOWER, START_Y, G0, slidePath, rider, fairTime, SLIDE_K, SLIDE_MU, f2 } from './lm_chimney_phys.js';

const PI = Math.PI;
const CX = TOWER.cx, CZ = TOWER.cz, TOP = TOWER.top;
const A = 1.8, CORE = 1.2, SW = 1.2, NF = 11, RISE = TOP / NF;      // the square stair round the tower's core
const PLAT = { x0: -6, x1: 6, z0: -21, z1: -12 };
const IDS = ['sink', 'true', 'float'];
const WAY = { sink: 'spinward', float: 'anti', true: 'along the axis' };

export async function buildSpouts(game, s) {
  const st = { riding: false, best: {}, last: {}, board: null };
  for (const id of IDS) { const b = game.flags && game.flags['chimney.best_' + id]; if (b) st.best[id] = b; }
  hall(game, s); await frameWait(game);
  tower(game, s); await frameWait(game);
  for (const id of IDS) { slide(game, s, id); await frameWait(game); }
  pits(game, s); await frameWait(game);
  st.board = timingBoard(game, s, st);
  riders(game, s);
  gates(game, s, st);
  life(game, s);
  s.zoneBox({ id: 'chimney-spouts', place: 'chimney', box: [HALL.x0, -0.5, HALL.z0, HALL.x1, HALL.h, HALL.z1], name: 'The Spouts', sub: 'three slides · ' + SUB, ambience: 'school', reverb: 'hall', headroom: 16 });
  s.zoneBox({ id: 'chimney-spouts-top', place: 'chimney', box: [PLAT.x0, TOP - 0.3, PLAT.z0, PLAT.x1, HALL.h, PLAT.z1], name: 'The Spouts', sub: 'the top of the tower · deck 44 · Ring Six', ambience: 'school', reverb: 'hall', headroom: 3.4 });
  s.loop('kids', 0, 1.5, -34, { vol: 0.5, radius: 40 });
  s.loop('kids', 0, TOP + 1, -16, { vol: 0.25, radius: 12 });
}

// ---------------------------------------------------------------------------------------------------------------
// the hall: 88 by 49 metres and four decks tall, its walls painted in the slides' colours, the rule round the walls
// ---------------------------------------------------------------------------------------------------------------
function hall(game, s) {
  const g = s.g, H = HALL.h, r = new Rng(321);
  floor(s, HALL.x0, HALL.z0, HALL.x1, HALL.z1, 0, 'speckle', '#6f7a72');
  // painted lanes from the tower to each pit, in the slide's colour
  s.detail((gg) => {
    for (const id of IDS) {
      const P = slidePath(id).pts; gg.mat('paint', SLIDES[id].col, { rough: 0.1 });
      for (let i = 0; i < P.length - 6; i += 10) { const a = P[i], b = P[i + 5]; const x0 = Math.min(a[0], b[0]) - 0.12, x1 = Math.max(a[0], b[0]) + 0.12, z0 = Math.min(a[2], b[2]) - 0.12, z1 = Math.max(a[2], b[2]) + 0.12; if (Math.abs(a[0]) < 6.4 && a[2] > -21.4) continue; gg.box(x0, 0, z0, x1, 0.004, z1, { faces: 'Y' }); }
    }
  });
  ceiling(s, HALL.x0, HALL.z0, HALL.x1, HALL.z1, H, 'paint', '#e2d6c0');
  s.structure((gg) => {
    gg.mat('paint', PAL.dark); for (let x = HALL.x0 + 8; x < HALL.x1; x += 8) gg.box(x - 0.2, H - 0.9, HALL.z0, x + 0.2, H - 0.01, HALL.z1, { faces: 'xXy' });
    gg.mat('paint', PAL.ochre); gg.box(HALL.x0, H - 0.6, -35.2, HALL.x1, H - 0.01, -34.8, { faces: 'zZy' });
  });
  // walls: the back wall either side of the Rack's galleries (with a door into the counter), the ends and the front
  const wt = (c) => ({ tint: '#e6d8bf', dado: { h: 1.4, mat: 'tile', tint: c }, skirt: '#3a2d22' });
  wall(s, HALL.x0, HALL.z1 + 0.08, -10, HALL.z1 + 0.08, 0, H, Object.assign(wt(PAL.teal), { openings: [{ at: 27.8, w: 1.6, h: 2.4 }] }));
  wall(s, 7.36, HALL.z1 + 0.08, HALL.x1, HALL.z1 + 0.08, 0, H, wt(PAL.teal));
  wall(s, HALL.x0 - 0.08, HALL.z0, HALL.x0 - 0.08, HALL.z1, 0, H, wt(SLIDES.float.col));
  wall(s, HALL.x1 + 0.08, HALL.z0, HALL.x1 + 0.08, HALL.z1, 0, H, wt(SLIDES.sink.col));
  wall(s, HALL.x0, HALL.z0 - 0.08, HALL.x1, HALL.z0 - 0.08, 0, H, wt(SLIDES.true.col));
  // the wall above the gallery windows between the Rack and the hall is the galleries' own; under the ceiling here, a band
  // big stripes in the three colours, rising toward each slide's end
  s.structure((gg) => {
    const band = (c, x0, x1, z, y0) => { gg.mat('paint', c); gg.box(x0, y0, z - 0.01, x1, y0 + 0.9, z, { faces: 'z' }); };
    band(SLIDES.true.col, HALL.x0 + 0.2, HALL.x1 - 0.2, HALL.z0 + 0.01, 2.2); band(SLIDES.sink.col, HALL.x0 + 0.2, HALL.x1 - 0.2, HALL.z0 + 0.01, 3.3); band(SLIDES.float.col, HALL.x0 + 0.2, HALL.x1 - 0.2, HALL.z0 + 0.01, 4.4);
    gg.mat('paint', SLIDES.sink.col); gg.box(HALL.x1 - 0.01, 2.2, HALL.z0, HALL.x1, 5.3, HALL.z1, { faces: 'x' });
    gg.mat('paint', SLIDES.float.col); gg.box(HALL.x0, 2.2, HALL.z0, HALL.x0 + 0.01, 5.3, HALL.z1, { faces: 'X' });
  });
  // the rule, in big letters on a dark band across the front wall; each slide's name on its own end
  s.structure((gg) => { gg.mat('paint', PAL.dark); gg.box(-24, 9.9, HALL.z0 + 0.005, 24, 13.1, HALL.z0 + 0.02, { faces: 'Z' }); gg.mat('paint', SLIDES.true.col); gg.box(-24, 9.7, HALL.z0 + 0.005, 24, 9.9, HALL.z0 + 0.025, { faces: 'Z' }); gg.box(-24, 13.1, HALL.z0 + 0.005, 24, 13.3, HALL.z0 + 0.025, { faces: 'Z' }); });
  sign(s, { kind: 'letters', text: 'Axis flies true · spin sinks · anti floats', font: 'caps', palette: ['#f6ecd6'] }, 0, 11.5, HALL.z0 + 0.03, { face: 'Z', w: 44, h: 2.6 });
  sign(s, { kind: 'letters', text: 'Sink', font: 'caps', palette: ['#f6ecd6'] }, HALL.x1 - 0.02, 8.6, -18.5, { face: 'x', w: 7, h: 2.4 });
  sign(s, { kind: 'letters', text: 'Float', font: 'caps', palette: ['#f6ecd6'] }, HALL.x0 + 0.02, 8.6, -18.5, { face: 'X', w: 7, h: 2.4 });
  s.structure((gg) => {
    gg.mat('paint', SLIDES.sink.col); gg.box(HALL.x1 - 0.015, 6.8, -23, HALL.x1 - 0.005, 10.4, -14, { faces: 'x' });
    gg.mat('paint', SLIDES.float.col); gg.box(HALL.x0 + 0.005, 6.8, -23, HALL.x0 + 0.015, 10.4, -14, { faces: 'X' });
  });
  // felt baffles under the ceiling, because a bare hall rings: rows of hanging panels in every colour the drum has
  const felt = [SLIDES.sink.col, PAL.ochre, PAL.teal, PAL.cream, PAL.plum, SLIDES.true.col, SLIDES.float.col, PAL.green, PAL.indigo];
  for (let z = HALL.z0 + 4; z < HALL.z1 - 1; z += 5.5) {
    s.deco((gg) => {
      gg.mat('cast', '#3d4a45'); gg.tube([[HALL.x0 + 1, H - 1.1, z], [HALL.x1 - 1, H - 1.1, z]], 0.02, { segs: 4, caps: false });
      for (let x = HALL.x0 + 2; x < HALL.x1 - 1.5; x += 2.2) {
        if (x > -7.5 && x < 7.5 && z > -23 && z < -10) continue;
        if (nearSlide(x, z, H - 2.5 - 1.4)) continue;
        const c = felt[Math.abs(Math.round(x / 2.2 + z / 5.5 * 3)) % felt.length];
        gg.mat('felt', c); gg.box(x - 0.9, H - 2.5, z - 0.03, x + 0.9, H - 1.15, z + 0.03, { bevel: 0.015 });
      }
    });
  }
  // bunting across the hall, slide colours and cream
  for (const z of [-30, -42]) bunting(s, [HALL.x0 + 0.4, 10.5, z], [HALL.x1 - 0.4, 10.5, z], { colors: [SLIDES.sink.col, PAL.cream, SLIDES.true.col, PAL.cream, SLIDES.float.col, PAL.cream], sag: 2.2, drop: 0.35, n: 120 });
  // great painted slides on the end walls: broad bands sweeping down in the slide's colour
  s.structure((gg) => {
    for (const sx of [-1, 1]) {
      const x = sx > 0 ? HALL.x1 - 0.012 : HALL.x0 + 0.012, c = sx > 0 ? SLIDES.sink.col : SLIDES.float.col;
      for (let b = 0; b < 3; b++) {
        gg.mat('paint', shadeHex(c, 1 + b * 0.12));
        const z0 = -56 + b * 1.6, zA = -26 + b * 1.6, yA = 16 - b * 1.6, yB = 5.6 - b * 1.6;
        const P = [[z0, yB - 1.1], [zA, yA - 1.1], [zA, yA], [z0, yB]];
        const q = P.map((p) => [x, p[1], p[0]]);
        if (sx > 0) gg.quad(q[0], q[1], q[2], q[3]); else gg.quad(q[0], q[3], q[2], q[1]);
      }
    }
  });
  // stands for parents at the far end: three tiers of benches each side of True's pit
  for (const sx of [-1, 1]) {
    const xa = sx > 0 ? 9 : -29, xb = sx > 0 ? 29 : -9;
    for (let t = 0; t < 3; t++) {
      const z0 = HALL.z0 + 0.3 + (2 - t) * 1.0, ytop = 0.42 * (t + 1);
      block(s, xa, 0, z0, xb, ytop, z0 + 1.0, 'wood', t % 2 ? '#8a6240' : '#7a5233', { tier: 's' });
      s.structure((gg) => { gg.mat('paint', [SLIDES.float.col, SLIDES.true.col, SLIDES.sink.col][t]); gg.box(xa, ytop - 0.08, z0 + 0.985, xb, ytop, z0 + 1.005, { faces: 'Z' }); });
      for (let x = xa + 1.2; x < xb - 0.6; x += 2.6) { prop(s, 'bench', x, ytop, z0 + 0.45, 0, { w: 2.2, back: t === 2, wood: shadeHex(PAL.wood, 1.0 + (t % 2) * 0.12) }); }
    }
  }
  seat(s, 14, 0.84, HALL.z0 + 1.75, 0, 'Sit in the stand', { pitch: 0.1 });
  // a tea cart by the stands: cups under lids, an urn on the loop
  s.furniture((gg) => {
    const x = 32.5, z = HALL.z0 + 3;
    gg.mat('paint', PAL.teal); gg.box(x - 0.8, 0.3, z - 0.45, x + 0.8, 0.95, z + 0.45, { bevel: 0.02 });
    gg.mat('wood', '#8a6240'); gg.box(x - 0.85, 0.95, z - 0.5, x + 0.85, 0.99, z + 0.5, { bevel: 0.01 });
    gg.mat('cast', '#3d4a45'); for (const sx of [-0.6, 0.6]) for (const sz of [-0.32, 0.32]) gg.cyl(x + sx, 0, z + sz, 0.14, 0.08, { segs: 10 });
    gg.mat('cast', '#b08a45', { rough: -0.1 }); gg.lathe(x - 0.4, z, [[0.16, 0.99], [0.18, 1.1], [0.18, 1.42], [0.12, 1.5], [0.04, 1.55], [0, 1.56]], { segs: 14 });
    gg.mat('weave', SLIDES.sink.col); for (let i = 0; i < 5; i++) gg.quad([x - 0.9 + i * 0.36, 2.2, z - 0.6], [x - 0.54 + i * 0.36, 2.2, z - 0.6], [x - 0.54 + i * 0.36, 2.0, z - 0.9], [x - 0.9 + i * 0.36, 2.0, z - 0.9], { double: true });
    gg.mat('cast', '#3d4a45'); for (const sx of [-0.8, 0.8]) gg.tube([[x + sx, 0.99, z - 0.45], [x + sx, 2.2, z - 0.6]], 0.02, { segs: 5 });
  });
  for (let i = 0; i < 6; i++) prop(s, 'cup', 32.3 + (i % 3) * 0.16, 0.99, HALL.z0 + 2.8 + Math.floor(i / 3) * 0.16, 0, { glaze: [PAL.cream, SLIDES.float.col, SLIDES.true.col][i % 3] }, { noCollide: true });
  s.solid(31.7, 0, HALL.z0 + 2.55, 33.3, 0.99, HALL.z0 + 3.45);
  s.spot('counter', 32.5, 0, HALL.z0 + 3.8, PI, { tags: ['tea'] });
  s.interact({ x: 32.5, y: 1.1, z: HALL.z0 + 4.0, radius: 1.5, prompt: 'Have a cup of tea from the cart', onUse: async (gm) => {
    if (gm.wallet && !gm.wallet.spend(0.15, 'Tea at the Spouts')) { toast(gm, 'Tea is 0.15 kWh, and you are short of it.'); return; }
    sfx(gm, 'pour', s.frame, 32.5, 1.1, HALL.z0 + 3);
    await say(gm, { name: 'The tea cart', colour: '#e9c43d' }, ['Under a lid, or it is cold before you are back in your seat. Heliox takes the heat out of a cup in no time.', 'Parents drink it, children spill it, the slides get the credit for both.']);
  } });
  // warm lamps along the long walls, at the height of the benches
  for (const x of [-36, -18, 18, 36]) lamp(s, 'sconce', x, 3.2, HALL.z1 - 0.12, { face: 'z', K: 2800, power: 1.4, clip: [HALL.x0, -0.5, HALL.z0, HALL.x1, H, HALL.z1] });
  for (const x of [-24, -12, 12, 24]) lamp(s, 'sconce', x, 3.2, HALL.z0 + 0.12, { face: 'Z', K: 2800, power: 1.4, clip: [HALL.x0, -0.5, HALL.z0, HALL.x1, H, HALL.z1] });
  // benches for parents along the walls, a drinking tap, mats rolled up, a lost-property crate
  for (const x of [-34, -24, 22, 32]) { prop(s, 'bench', x, 0, HALL.z1 - 0.5, PI, { w: 2.4, back: true, wood: PAL.wood }); }
  for (const z of [-48, -38]) { prop(s, 'bench', HALL.x1 - 0.5, 0, z, -PI / 2, { w: 2.4, back: true, wood: PAL.wood }); prop(s, 'bench', HALL.x0 + 0.5, 0, z, PI / 2, { w: 2.4, back: true, wood: PAL.wood }); }
  seat(s, 22, 0, HALL.z1 - 0.5, PI, 'Sit and watch the slides', { pitch: 0.18 });
  prop(s, 'crate', 9.5, 0, HALL.z1 - 0.5, 0.1, { w: 0.8, h: 0.5, d: 0.5, wood: '#b08d5e' });
  s.detail((gg) => {
    for (let i = 0; i < 6; i++) { gg.mat('speckle', r.pick(['#2f5f9a', '#c8452e', '#4f8a52', '#d9a23a'])); gg.at(-40.5 + i * 0.62, 0.32, HALL.z0 + 0.6, 0); gg.rotX(PI / 2); gg.cyl(0, -0.75, 0, 0.3, 1.5, { segs: 12 }); gg.pop(); }
    gg.mat('weave', '#e9c43d'); gg.box(9.2, 0.5, HALL.z1 - 0.7, 9.8, 0.62, HALL.z1 - 0.3, { bevel: 0.03 }); gg.mat('leather', '#2f5f9a'); gg.box(9.5, 0.5, HALL.z1 - 0.65, 9.9, 0.6, HALL.z1 - 0.35, { bevel: 0.03 });
  });
  s.solid(-40.9, 0, HALL.z0, -37, 0.62, HALL.z0 + 0.92);
  // light: big soft downlights from the ceiling, a warm wash, and the shaft's light through the gallery windows
  const CLIP = [HALL.x0 - 0.1, -0.5, HALL.z0 - 0.1, HALL.x1 + 0.1, H + 0.1, HALL.z1 + 0.1];
  for (const x of [-30, -10, 10, 30]) for (const z of [-22, -46]) s.light({ at: [x, H - 1.0, z], type: 'spot', dir: [0, -1, 0], cone: [70, 40], color: '#fff0dc', power: 240, range: 26, shadow: true, radius: 1.4, clip: CLIP, lamp: true });
  s.ambient({ box: [HALL.x0, 0, HALL.z0, HALL.x1, H, HALL.z1], sky: '#fff0de', ground: '#c9b48e', power: 1.7, skylit: true, lamp: true, soft: 2.2 });
  s.deco((gg) => {
    for (const x of [-30, -10, 10, 30]) for (const z of [-22, -46]) { gg.mat('paint', '#2c3a40'); gg.cyl(x, H - 0.9, z, 0.9, 0.9, { segs: 16, r1: 0.45 }); gg.mat('diffuser', '#fff3dc', { emissive: 4, lamp: true }); gg.cyl(x, H - 0.92, z, 0.82, 0.02, { segs: 16 }); }
  });
}

// is any slide higher than y within a metre and a half of (x, z)?
function nearSlide(x, z, y) {
  for (const id of IDS) { const P = slidePath(id).pts; for (let i = 0; i < P.length; i += 3) { const p = P[i]; if (p[1] > y && Math.abs(p[0] - x) < 1.6 && Math.abs(p[2] - z) < 1.6) return true; } }
  return false;
}

// ---------------------------------------------------------------------------------------------------------------
// the tower: a square stair of eleven flights round a painted core, and the platform at the top with the three mouths
// ---------------------------------------------------------------------------------------------------------------
function corner(i) { const c = [[-A, -A], [A, -A], [A, A], [-A, A]][i % 4]; return [CX + c[0], CZ + c[1]]; }
function tower(game, s) {
  const g = s.g, rail = '#2c3a40';
  // the core, banded in the three colours
  const cols = [SLIDES.sink.col, SLIDES.true.col, SLIDES.float.col, PAL.cream];
  for (let i = 0; i < 8; i++) block(s, CX - CORE, i * 2, CZ - CORE, CX + CORE, i * 2 + 2, CZ + CORE, 'paint', cols[i % 4], { tier: 's', noCollide: true });
  s.solid(CX - CORE, 0, CZ - CORE, CX + CORE, TOP, CZ + CORE);
  // the flights and their landings
  for (let i = 0; i < NF; i++) {
    const y = i * RISE, a = corner(i), b = corner(i + 1), side = i % 4;
    const mat = { mat: 'wood', tint: '#a57a52', nosing: '#e9c43d' };
    if (side === 0) stairs(s, CX - CORE, y, CZ - A, 'X', RISE, 2 * CORE, SW, mat);
    else if (side === 1) stairs(s, CX + A, y, CZ - CORE, 'Z', RISE, 2 * CORE, SW, mat);
    else if (side === 2) stairs(s, CX + CORE, y, CZ + A, 'x', RISE, 2 * CORE, SW, mat);
    else stairs(s, CX - A, y, CZ + CORE, 'z', RISE, 2 * CORE, SW, mat);
    if (i > 0) block(s, a[0] - SW / 2, y - 0.22, a[1] - SW / 2, a[0] + SW / 2, y, a[1] + SW / 2, 'wood', '#8a6240', { tier: 's' });
    // the outer rail of the flight: posts, a sloping handrail and a mesh panel; a tall collider on the edge
    const out = side === 0 ? [0, -1] : side === 1 ? [1, 0] : side === 2 ? [0, 1] : [-1, 0];
    const ex = (p) => [p[0] + out[0] * (SW / 2 - 0.04), p[1] + out[1] * (SW / 2 - 0.04)];
    const pa = ex([a[0] + (b[0] - a[0]) * (SW / 2) / (2 * A), a[1] + (b[1] - a[1]) * (SW / 2) / (2 * A)]), pb = ex([b[0] - (b[0] - a[0]) * (SW / 2) / (2 * A), b[1] - (b[1] - a[1]) * (SW / 2) / (2 * A)]);
    s.furniture((gg) => {
      gg.mat('cast', rail);
      for (let k = 0; k <= 3; k++) { const t = k / 3, x = pa[0] + (pb[0] - pa[0]) * t, z = pa[1] + (pb[1] - pa[1]) * t, yy = y + RISE * t; gg.tube([[x, yy, z], [x, yy + 1.0, z]], 0.02, { segs: 5 }); }
      gg.mat('wood', '#7a5233'); gg.tube([[pa[0], y + 1.0, pa[1]], [pb[0], y + RISE + 1.0, pb[1]]], 0.028, { segs: 7 });
      gg.mat('grille', '#3d4a45'); gg.quad([pa[0], y + 0.08, pa[1]], [pb[0], y + RISE + 0.08, pb[1]], [pb[0], y + RISE + 0.92, pb[1]], [pa[0], y + 0.92, pa[1]], { double: true });
    });
    s.solid(Math.min(pa[0], pb[0]) - 0.04, y, Math.min(pa[1], pb[1]) - 0.04, Math.max(pa[0], pb[0]) + 0.04, y + RISE + 1.0, Math.max(pa[1], pb[1]) + 0.04);
    // the two outer edges of the landing at the top of this flight
    if (i < NF - 1) {
      const yb = y + RISE, o2 = (i + 1) % 4;
      const edges = o2 === 0 ? [[[b[0] - SW / 2, b[1] - SW / 2], [b[0] + SW / 2, b[1] - SW / 2]], [[b[0] - SW / 2, b[1] - SW / 2], [b[0] - SW / 2, b[1] + SW / 2]]]
        : o2 === 1 ? [[[b[0] - SW / 2, b[1] - SW / 2], [b[0] + SW / 2, b[1] - SW / 2]], [[b[0] + SW / 2, b[1] - SW / 2], [b[0] + SW / 2, b[1] + SW / 2]]]
        : o2 === 2 ? [[[b[0] + SW / 2, b[1] - SW / 2], [b[0] + SW / 2, b[1] + SW / 2]], [[b[0] - SW / 2, b[1] + SW / 2], [b[0] + SW / 2, b[1] + SW / 2]]]
        : [[[b[0] - SW / 2, b[1] + SW / 2], [b[0] + SW / 2, b[1] + SW / 2]], [[b[0] - SW / 2, b[1] - SW / 2], [b[0] - SW / 2, b[1] + SW / 2]]];
      for (const e of edges) railing(s, e, yb, { h: 1.0, tint: rail, rail: '#7a5233', posts: 0.6 });
    }
  }
  // the space under the first landings is closed in, so nobody walks under the stair at the foot
  s.solid(CX + CORE, 0, CZ - A - SW / 2, CX + A + SW / 2, 1.2, CZ + A + SW / 2);
  s.solid(CX - A - SW / 2, 0, CZ + CORE, CX + CORE, 1.2, CZ + A + SW / 2);
  s.solid(CX - A - SW / 2, 0, CZ - CORE, CX - CORE, 1.2, CZ + CORE);
  s.structure((gg) => { gg.mat('paint', PAL.dark); gg.box(CX + CORE, 0, CZ - A - SW / 2 + 0.02, CX + A + SW / 2 - 0.02, 1.2, CZ + A + SW / 2 - 0.02, { faces: 'XzZ' }); gg.box(CX - A - SW / 2 + 0.02, 0, CZ + CORE, CX + CORE, 1.2, CZ + A + SW / 2 - 0.02, { faces: 'xZ' }); gg.box(CX - A - SW / 2 + 0.02, 0, CZ - CORE, CX - CORE, 1.2, CZ + CORE, { faces: 'x' }); });
  // the platform, with a hole for the last two flights
  const y = TOP;
  const pieces = [[-6, -21, 6, -17.2], [-6, -17.2, 1.2, -14.8], [2.4, -17.2, 6, -12], [-6, -14.8, -1.2, -12], [-1.2, -13.6, 2.4, -12]];
  for (const p of pieces) {
    floor(s, CX + p[0], p[1], CX + p[2], p[3], y, 'planks', '#b08a5e', { level: 4 });
    s.structure((gg) => { gg.mat('paint', PAL.dark); gg.box(CX + p[0], y - 0.35, p[1], CX + p[2], y - 0.02, p[3], { faces: 'yxXzZ' }); }, 4);
  }
  const R = { h: 1.1, tint: rail, rail: '#7a5233', level: 4 };
  railing(s, [[CX + 1.2, -17.2], [CX + 1.2, -14.8]], y, R); railing(s, [[CX + 1.2, -17.2], [CX + 2.4, -17.2]], y, R);
  railing(s, [[CX + 2.4, -17.2], [CX + 2.4, -13.6]], y, R); railing(s, [[CX - 1.2, -13.6], [CX + 2.4, -13.6]], y, R);
  railing(s, [[CX - 1.2, -14.8], [CX + 1.2, -14.8]], y, R);
  railing(s, [[PLAT.x1, PLAT.z0], [PLAT.x1, -17.2]], y, R); railing(s, [[PLAT.x1, -15.8], [PLAT.x1, PLAT.z1]], y, R);
  railing(s, [[PLAT.x0, PLAT.z0], [PLAT.x0, -17.2]], y, R); railing(s, [[PLAT.x0, -15.8], [PLAT.x0, PLAT.z1]], y, R);
  railing(s, [[PLAT.x0, PLAT.z0], [-0.7, PLAT.z0]], y, R); railing(s, [[0.7, PLAT.z0], [PLAT.x1, PLAT.z0]], y, R);
  railing(s, [[PLAT.x0, PLAT.z1], [PLAT.x1, PLAT.z1]], y, R);
  // columns under the platform's corners
  for (const p of [[-5.7, -20.7], [5.7, -20.7], [-5.7, -12.3], [5.7, -12.3]]) { block(s, p[0] - 0.18, 0, p[1] - 0.18, p[0] + 0.18, y - 0.35, p[1] + 0.18, 'paint', PAL.dark, { tier: 's' }); }
  // a canopy over the platform on four posts, striped in the three colours, two lamps under it
  s.furniture((gg) => {
    gg.mat('cast', rail); for (const p of [[-5.8, -20.8], [5.8, -20.8], [-5.8, -12.2], [5.8, -12.2]]) gg.tube([[p[0], y, p[1]], [p[0], y + 3.0, p[1]]], 0.05, { segs: 8 });
    const sc = [SLIDES.sink.col, PAL.cream, SLIDES.true.col, PAL.cream, SLIDES.float.col, PAL.cream];
    for (let i = 0; i < 12; i++) { const x0 = -6 + i, x1 = x0 + 1; gg.mat('weave', sc[i % 6]); gg.quad([x0, y + 3.0, -21], [x1, y + 3.0, -21], [x1, y + 3.25, -16.5], [x0, y + 3.25, -16.5], { double: true }); gg.quad([x0, y + 3.25, -16.5], [x1, y + 3.25, -16.5], [x1, y + 3.0, -12], [x0, y + 3.0, -12], { double: true }); }
  }, 4);
  const clip = [PLAT.x0 - 0.5, y - 0.5, PLAT.z0 - 0.5, PLAT.x1 + 0.5, y + 3.3, PLAT.z1 + 0.5];
  lamp(s, 'globe', -2.5, y + 2.6, -18.5, { K: 3000, power: 1.2, clip, drop: 0.5, level: 4 }); lamp(s, 'globe', 3.2, y + 2.6, -15, { K: 3000, power: 1.2, clip, drop: 0.5, level: 4 });
  // the way up, signed at the foot
  sign(s, { kind: 'street', text: 'Up to the Spouts', sub: 'eleven flights · sixteen metres', palette: ['#2c3a40', '#f1ead8'] }, CX - CORE - 0.01, 2.2, CZ - A, { face: 'x', w: 1.6, h: 0.4 });
  sign(s, { kind: 'street', text: 'Up to the Spouts', sub: 'stair on the far side', palette: ['#2c3a40', '#f1ead8'] }, CX, 2.2, CZ + CORE + 0.01, { face: 'Z', w: 1.6, h: 0.4 });
}

// ---------------------------------------------------------------------------------------------------------------
// one slide: the trough, a closed stretch of tube in the middle, its legs, the mouth's gate on the platform
// ---------------------------------------------------------------------------------------------------------------
function slide(game, s, id) {
  const S = SLIDES[id], P = slidePath(id).pts, n = P.length;
  const c0 = Math.round(n * 0.38), c1 = Math.round(n * 0.56);
  sweepTrough(s, P, { r: 0.55, t: 0.05, arc: 1.95, closed: [[c0, c1]], col: S.col, inner: S.inner, lip: S.lip, segs: 16, step: 2 });
  // legs every three and a half metres, out of the platform and the pit
  const pit = S.pit;
  s.furniture((gg) => {
    gg.mat('cast', '#3d4a45');
    for (let i = 10; i < n - 4; i += 17) {
      const p = P[i]; if (p[0] > PLAT.x0 - 0.5 && p[0] < PLAT.x1 + 0.5 && p[2] > PLAT.z0 - 0.5 && p[2] < PLAT.z1 + 0.5) continue;
      if (p[0] > pit[0] - 0.4 && p[0] < pit[2] + 0.4 && p[2] > pit[1] - 0.4 && p[2] < pit[3] + 0.4) continue;
      const top = p[1] - 0.08;
      gg.cyl(p[0], 0, p[2], 0.1, top, { segs: 10 }); gg.cyl(p[0], 0, p[2], 0.2, 0.06, { segs: 10 });
      gg.mat('paint', S.col); gg.box(p[0] - 0.32, top - 0.1, p[2] - 0.32, p[0] + 0.32, top, p[2] + 0.32, { bevel: 0.02 }); gg.mat('cast', '#3d4a45');
    }
  });
  for (let i = 10; i < n - 4; i += 17) {
    const p = P[i]; if (p[0] > PLAT.x0 - 0.5 && p[0] < PLAT.x1 + 0.5 && p[2] > PLAT.z0 - 0.5 && p[2] < PLAT.z1 + 0.5) continue;
    if (p[0] > pit[0] - 0.4 && p[0] < pit[2] + 0.4 && p[2] > pit[1] - 0.4 && p[2] < pit[3] + 0.4) continue;
    s.post(p[0], p[2], 0.12, 0, p[1] - 0.1);
  }
  // a little glow at each end of the closed stretch: rings of light in the slide's colour
  s.deco((gg) => {
    gg.mat('diffuser', S.inner, { emissive: 2.2, lamp: true });
    for (const i of [c0, c1]) { const p = P[i], q = P[Math.min(n - 1, i + 2)]; const tx = q[0] - p[0], tz = q[2] - p[2], tl = Math.hypot(tx, tz) || 1; const sx = -tz / tl, sz = tx / tl; const loop = []; for (let m = 0; m < 18; m++) { const a = m / 18 * PI * 2; loop.push([p[0] + sx * Math.sin(a) * 0.62, p[1] + 0.55 - Math.cos(a) * 0.62, p[2] + sz * Math.sin(a) * 0.62]); } gg.tube(loop, 0.035, { segs: 4, closed: true }); }
  });
}

// ---------------------------------------------------------------------------------------------------------------
// the run-out pits, full of soft blocks, each lit by a lantern in its slide's colour
// ---------------------------------------------------------------------------------------------------------------
function pits(game, s) {
  for (const id of IDS) {
    const S = SLIDES[id], b = S.pit;
    softPit(s, b, { seed: id.length * 31, kerb: '#2c3a40', stripe: S.col });
    const cx = (b[0] + b[2]) / 2, cz = (b[1] + b[3]) / 2;
    lamp(s, 'lantern', cx, 4.2, cz, { tint: S.inner, power: 1.6, range: 9, drop: HALL.h - 4.4, r: 0.35, hh: 0.5, clip: [b[0] - 4, -0.5, b[1] - 4, b[2] + 4, 6, b[3] + 4] });
    for (let i = 0; i < 4; i++) s.spot('play', cx + (i - 1.5) * 1.0, 0.42, cz + (i % 2 ? 0.8 : -0.8), i * 1.3, { tags: ['kids', i % 2 ? 'hop' : 'run'] });
  }
}

// ---------------------------------------------------------------------------------------------------------------
// the timing board: three lanes, the fair time, the record and who holds it, and the last run; redrawn after each ride
// ---------------------------------------------------------------------------------------------------------------
export const RECORDS = {
  sink: { who: 'Tobiah Marsh, aged 11', k: 0.45, mu: 0.94 },
  true: { who: 'Wen Okoro, aged 12', k: 0.42, mu: 0.93 },
  float: { who: 'Tilde Haldane, aged 9', k: 0.4, mu: 0.92 },
};
function timingBoard(game, s, st) {
  if (!game.atlas) return null;
  const W = 7.6, Hb = 3.4, x0 = 9.4, x1 = x0 + W, y0 = 4.6, y1 = y0 + Hb, z = HALL.z1 - 0.12;
  const R = signRect(game.atlas, { kind: 'board', title: 'The Spouts · timing board · deck 40', lines: ['chimney spouts board'], palette: ['#101614', '#f3e6c8', '#3fe0d0'] }, W, Hb);
  const r = R.rect;
  s.structure((gg) => {
    gg.mat('wood', '#2a1d14'); gg.box(x0 - 0.12, y0 - 0.12, z, x1 + 0.12, y1 + 0.12, z + 0.1, { bevel: 0.02 });
    gg.atlas(r.page, { emissive: 1.6, lamp: true }); gg.quad([x1, y0, z - 0.004], [x0, y0, z - 0.004], [x0, y1, z - 0.004], [x1, y1, z - 0.004], { uv: [r.u0, r.v1, r.u1, r.v0] });
  });
  const fair = {}, rec = {};
  for (const id of IDS) { fair[id] = fairTime(id).T; rec[id] = fairTime(id, { k: SLIDE_K * RECORDS[id].k, mu: SLIDE_MU * RECORDS[id].mu }).T; }
  const draw = () => {
    game.atlas.redraw(r, (ctx, w, h) => {
      ctx.fillStyle = '#101614'; ctx.fillRect(0, 0, w, h);
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#f3e6c8'; ctx.textAlign = 'left'; ctx.font = "italic 600 " + Math.round(h * 0.11) + "px 'Cormorant Garamond', serif"; ctx.fillText('The Spouts', w * 0.04, h * 0.1);
      ctx.fillStyle = '#a99f90'; ctx.font = "500 " + Math.round(h * 0.055) + "px 'Barlow Condensed', sans-serif"; ctx.textAlign = 'right'; ctx.fillText('SIXTEEN METRES DOWN · FAIR RUN, RECORD, LAST RUN', w * 0.96, h * 0.1);
      ctx.fillStyle = '#3fe0d0'; ctx.fillRect(w * 0.04, h * 0.18, w * 0.92, 2);
      const cols = [0.04, 0.3, 0.52, 0.76];
      ctx.fillStyle = '#a99f90'; ctx.textAlign = 'left'; ctx.font = "500 " + Math.round(h * 0.05) + "px 'Barlow Condensed', sans-serif";
      ['SLIDE', 'FAIR RUN', 'RECORD', 'LAST RUN'].forEach((t, i) => ctx.fillText(t, w * cols[i], h * 0.25));
      IDS.forEach((id, i) => {
        const yy = h * (0.42 + i * 0.2), S = SLIDES[id];
        ctx.fillStyle = S.col; ctx.fillRect(w * 0.04, yy - h * 0.07, w * 0.012, h * 0.14);
        ctx.fillStyle = '#f3e6c8'; ctx.textAlign = 'left'; ctx.font = "600 " + Math.round(h * 0.1) + "px 'Barlow Condensed', sans-serif"; ctx.fillText(S.name.toUpperCase(), w * 0.065, yy - h * 0.015);
        ctx.fillStyle = '#a99f90'; ctx.font = "500 " + Math.round(h * 0.045) + "px 'Barlow Condensed', sans-serif"; ctx.fillText(WAY[id].toUpperCase(), w * 0.067, yy + h * 0.06);
        ctx.fillStyle = '#f3e6c8'; ctx.font = "600 " + Math.round(h * 0.1) + "px 'Barlow Condensed', sans-serif"; ctx.fillText(f2(fair[id]) + ' s', w * cols[1], yy);
        ctx.fillStyle = '#e9c43d'; ctx.fillText(f2(rec[id]) + ' s', w * cols[2], yy - h * 0.015);
        ctx.fillStyle = '#a99f90'; ctx.font = "500 " + Math.round(h * 0.042) + "px 'Barlow Condensed', sans-serif"; ctx.fillText(RECORDS[id].who.toUpperCase(), w * cols[2], yy + h * 0.06);
        const last = st.last[id];
        ctx.fillStyle = last ? '#3fe0d0' : '#4a5450'; ctx.font = "600 " + Math.round(h * 0.1) + "px 'Barlow Condensed', sans-serif"; ctx.fillText(last ? f2(last) + ' s' : '--', w * cols[3], yy - (last ? h * 0.015 : 0));
        if (last) { ctx.fillStyle = '#a99f90'; ctx.font = "500 " + Math.round(h * 0.042) + "px 'Barlow Condensed', sans-serif"; ctx.fillText('THE WANDERER FROM SPELT', w * cols[3], yy + h * 0.06); }
      });
    });
  };
  draw();
  s.interact({ x: (x0 + x1) / 2, y: 1.5, z: HALL.z1 - 2.2, radius: 3.0, prompt: 'Read the timing board', onUse: (gm) => read(gm, 'The timing board', [
    'Three slides, sixteen metres down, about forty-one metres of glaze each. A fair run, sitting up, no push: Sink ' + f2(fair.sink) + ' s, True ' + f2(fair.true) + ' s, Float ' + f2(fair.float) + ' s.',
    'The records are tucked runs, chin down and arms in: Sink ' + f2(rec.sink) + ' s, held by ' + RECORDS.sink.who + '; True ' + f2(rec.true) + ' s, ' + RECORDS.true.who + '; Float ' + f2(rec.float) + ' s, ' + RECORDS.float.who + '.',
    'Under the board, in chalk: SINK IS SLOW, FLOAT IS FAST, TRUE IS FAIR. ASK ANY CHILD WHY.',
  ]) });
  return { draw, fair, rec };
}

// ---------------------------------------------------------------------------------------------------------------
// children going down: one at a time on each slide, every quarter of a minute or so
// ---------------------------------------------------------------------------------------------------------------
function riders(game, s) {
  const f = s.frame, r = new Rng(808);
  const looks = [{ top: '#e9c43d', sack: '#8a2f3c', skin: '#a8714e' }, { top: '#2f9fa8', sack: '#34417a', skin: '#d3a17a', hair: '#7a4a2a' }, { top: '#c8452e', sack: '#2f7d7a', skin: '#6e432b' }];
  IDS.forEach((id, i) => {
    const S = SLIDES[id], P = slidePath(id).pts, a = P[0], b = P[6];
    const yaw = Math.atan2(b[2] - a[2], b[0] - a[0]);
    const mesh = movable(s, (g) => { g.push(); g.rotY(-yaw); drawRider(g, looks[i]); g.pop(); }, [a[0], -20, a[2]], { radius: 0.8, far: 90 });
    mesh.userData.hidden = true;
    const st = { run: null, wait: 3 + i * 4 + r.f(0, 4) };
    s.every((dt, gm) => {
      if (st.run) {
        const q = st.run.step(Math.min(dt, 0.05)), o = mesh.userData.origin;
        o[0] = q.x; o[1] = q.y + 0.04; o[2] = q.z;
        if (q.done) {
          st.run = null; mesh.userData.hidden = true; st.wait = r.f(9, 20);
          if (gm.player && gm.player.frame === f && Math.hypot(gm.player.pos.x - q.x, gm.player.pos.z - q.z) < 20 && r.chance(0.5)) sfx(gm, 'laugh', f, q.x, 0.8, q.z, { vol: 0.5 });
        }
        return;
      }
      st.wait -= dt;
      if (st.wait <= 0) {
        st.run = rider(id, { k: SLIDE_K * r.f(0.5, 1.0), mu: SLIDE_MU * r.f(0.95, 1.02) }); mesh.userData.hidden = false;
        if (gm.player && gm.player.frame === f && Math.hypot(gm.player.pos.x - a[0], gm.player.pos.z - a[2]) < 24) sfx(gm, 'whoosh', f, a[0], a[1], a[2], { vol: 0.35 });
      }
    });
    void S;
  });
}

// ---------------------------------------------------------------------------------------------------------------
// the mouths: a gate with a start light over each, and the ride itself
// ---------------------------------------------------------------------------------------------------------------
function gates(game, s, st) {
  const f = s.frame, y = TOP;
  for (const id of IDS) {
    const S = SLIDES[id], P = slidePath(id).pts, a = P[0], b = P[8];
    const tx = b[0] - a[0], tz = b[2] - a[2], tl = Math.hypot(tx, tz) || 1, ux = tx / tl, uz = tz / tl, sx = -uz, sz = ux;
    const gx = a[0] + ux * 0.4, gz = a[2] + uz * 0.4;
    s.furniture((gg) => {
      gg.mat('paint', S.col);
      for (const sd of [-1, 1]) gg.box(gx + sx * sd * 0.78 - 0.07, y, gz + sz * sd * 0.78 - 0.07, gx + sx * sd * 0.78 + 0.07, y + 2.5, gz + sz * sd * 0.78 + 0.07, { bevel: 0.015 });
      const L = [gx - sx * 0.85, y + 2.42, gz - sz * 0.85], Rr = [gx + sx * 0.85, y + 2.42, gz + sz * 0.85];
      gg.box(Math.min(L[0], Rr[0]) - 0.07, y + 2.38, Math.min(L[2], Rr[2]) - 0.07, Math.max(L[0], Rr[0]) + 0.07, y + 2.62, Math.max(L[2], Rr[2]) + 0.07, { bevel: 0.015 });
      // the start bar riders hold before they let go
      gg.mat('cast', '#b08a45', { rough: -0.1 }); gg.tube([[gx - sx * 0.7, y + 1.05, gz - sz * 0.7], [gx + sx * 0.7, y + 1.05, gz + sz * 0.7]], 0.025, { segs: 8 });
      // the start light: amber housing, a green lens
      gg.mat('cast', '#2c3a40'); gg.box(gx + sx * 0.78 - 0.1, y + 1.9, gz + sz * 0.78 - 0.1, gx + sx * 0.78 + 0.1, y + 2.3, gz + sz * 0.78 + 0.1, { bevel: 0.01 });
      gg.mat('diffuser', '#7dff9a', { emissive: 4, lamp: true }); gg.ball(gx + sx * 0.78 - ux * 0.1, y + 2.18, gz + sz * 0.78 - uz * 0.1, 0.05, 0.05, 0.05, { segs: 8, rings: 5 });
      gg.mat('diffuser', '#ff6a4a', { emissive: 0.6 }); gg.ball(gx + sx * 0.78 - ux * 0.1, y + 2.02, gz + sz * 0.78 - uz * 0.1, 0.05, 0.05, 0.05, { segs: 8, rings: 5 });
    }, 4);
    const face = Math.abs(ux) > Math.abs(uz) ? (ux > 0 ? 'x' : 'X') : (uz > 0 ? 'z' : 'Z');
    sign(s, { kind: 'street', text: S.name, sub: WAY[id], palette: [shadeHex(S.col, 0.7), '#f6ecd6'] }, gx - ux * 0.08, y + 2.5, gz - uz * 0.08, { face, w: 1.5, h: 0.32, level: 4, glow: 0.6 });
    // the mouth is closed to walking: a gate at the bar, which riders go under sitting down
    s.solid(Math.min(gx - sx * 0.8, gx + sx * 0.8) - 0.05, y, Math.min(gz - sz * 0.8, gz + sz * 0.8) - 0.05, Math.max(gx - sx * 0.8, gx + sx * 0.8) + 0.05, y + 1.1, Math.max(gz - sz * 0.8, gz + sz * 0.8) + 0.05);
    s.spot('queue', a[0] - ux * 1.6 + sx * 0.3, y, a[2] - uz * 1.6 + sz * 0.3, Math.atan2(ux, uz), { tags: ['kids'] });
    s.spot('queue', a[0] - ux * 2.3 - sx * 0.2, y, a[2] - uz * 2.3 - sz * 0.2, Math.atan2(ux, uz), { tags: ['kids'] });
    s.interact({ x: a[0] - ux * 0.6, y: y + 1.1, z: a[2] - uz * 0.6, radius: 1.3, prompt: (gm) => (st.riding ? S.name : 'Ride ' + S.name + ', ' + WAY[id]), onUse: (gm) => rideSlide(gm, s, st, id) });
  }
}

async function rideSlide(game, s, st, id) {
  if (st.riding || game.busy || (game.cab && game.cab.riding)) return;
  const f = s.frame, p = game.player, ui = game.ui, S = SLIDES[id], path = slidePath(id);
  st.riding = true; game.busy++;
  let wind = null, off = null, result = null;
  const r = new Rng((Date.now() & 0xffff) + id.length);
  try {
    if (ui) await ui.fade(true, 0.35);
    const run = rider(id, { k: SLIDE_K * r.f(0.94, 1.06), mu: SLIDE_MU * r.f(0.985, 1.015) });
    const seatObj = { x: run.x, y: run.y + 0.02, z: run.z, yaw: 0, eye: 1.02 };
    p.place(f, run.x, run.y, run.z, Math.atan2(run.tx, -run.tz), -0.25);
    p.sit(seatObj); p.locked = true; p.eyeY = seatObj.y + seatObj.eye;
    if (ui) { ui.hud.thread(null); ui.ride({ kicker: S.name + ' · ' + WAY[id], big: 'Hold the bar', sub: 'the light is green' }); await ui.fade(false, 0.35); }
    sfx(game, 'lamp-click', f, run.x, run.y + 2, run.z);
    await new Promise((res) => setTimeout(res, 1100));
    if (ui) ui.ride({ kicker: S.name + ' · ' + WAY[id], big: 'Go', sub: 'let go of the bar' });
    sfx(game, 'whoosh', f, run.x, run.y + 1, run.z, { vol: 0.8 });
    if (game.audio) wind = game.audio.loop('wind', { vol: 0.0, param: 0 });
    let gMin = 9, gMax = 0;
    await new Promise((res) => {
      off = game.events.on('update', (dt) => {
        const q = run.step(Math.min(dt, 0.05));
        seatObj.x = q.x; seatObj.y = q.y + 0.02; seatObj.z = q.z; p.pos.x = q.x; p.pos.y = q.y; p.pos.z = q.z; p.eyeY = seatObj.y + seatObj.eye;
        const yaw = Math.atan2(q.tx, -q.tz); p.yaw = yaw; p.pitch = Math.asin(clamp(q.ty, -1, 1)) * 0.45 - 0.04;
        // lean into the turns: the side component of the curve, times the speed squared
        const sl = Math.hypot(q.tx, q.tz) || 1, side = (q.kx * (-q.tz / sl) + q.kz * (q.tx / sl)) * q.v * q.v / 9.81;
        p.roll = clamp(-side * 0.35, -0.32, 0.32);
        p.gOverride = q.g; gMin = Math.min(gMin, q.g); gMax = Math.max(gMax, q.g);
        if (wind) wind.set({ vol: clamp(q.v / 10, 0, 0.6), param: clamp(q.v / 10, 0, 1) });
        if (ui) ui.ride({ kicker: S.name + ' · ' + WAY[id], big: f2(q.t) + ' s', sub: q.v.toFixed(1) + ' m/s · you weigh ' + q.g.toFixed(2) + ' g' });
        if (q.done) { off(); off = null; res(); }
      });
      s.onDispose(() => { if (off) { off(); off = null; res(); } });
    });
    result = { T: run.t, gMin, gMax, vmax: run.vmax };
    sfx(game, 'land', f, run.x, run.y, run.z, { vol: 0.9 });
    sfx(game, 'laugh', f, run.x, run.y + 1, run.z, { vol: 0.4, delay: 0.3 });
    if (ui) { ui.ride({ kicker: S.name + ' · ' + WAY[id], big: f2(run.t) + ' s', sub: 'into the blocks' }); }
    await new Promise((res) => setTimeout(res, 700));
    if (ui) await ui.fade(true, 0.4);
  } catch (e) { console.error('[chimney] ride ' + (e && e.stack ? e.stack : e)); }
  if (wind) wind.stop(0.4);
  p.gOverride = null; p.roll = 0; p.stand(); p.locked = false;
  const b = S.pit, ex = id === 'sink' ? [b[0] - 1.0, (b[1] + b[3]) / 2, -PI / 2] : id === 'float' ? [b[2] + 1.0, (b[1] + b[3]) / 2, PI / 2] : [(b[0] + b[2]) / 2, b[3] + 1.0, 0];
  p.place(f, ex[0], 0, ex[1], ex[2], 0);
  if (ui) { ui.ride(null); await ui.fade(false, 0.5); ui.hud.thread(game.journal ? game.journal.current() : null); }
  st.riding = false; game.busy--;
  if (!result) return;
  // the board, the flags, and what it felt like
  st.last[id] = result.T;
  const prev = game.flags['chimney.best_' + id];
  if (!prev || result.T < prev) game.flags['chimney.best_' + id] = Math.round(result.T * 100) / 100;
  game.flags.rode_slide = true;
  game.flags['chimney.rides'] = (game.flags['chimney.rides'] || 0) + 1;
  if (game.story && game.story.persist) game.story.persist();
  if (st.board) st.board.draw();
  game.events.emit('slide:done', { slide: id, time: result.T });
  const fair = st.board ? st.board.fair : null;
  const lines = {
    sink: 'Sink, ' + f2(result.T) + ' s. Pressed into the glaze all the way down, ' + result.gMax.toFixed(2) + ' g at the bends: going spinward you go round a little faster than the floor and weigh more, and coming down, the spin pushes you anti, which is back up the slide. Children call it the slow one, and they are right.',
    float: 'Float, ' + f2(result.T) + ' s. Light in the seat, ' + result.gMin.toFixed(2) + ' g on the straight: going anti you go round a little slower than the floor, and coming down, the spin pushes you anti, which on Float is onward. The fast one, as every child in the queue told you.',
    true: 'True, ' + f2(result.T) + ' s. Along the axis your weight does not change with your speed, and the spin\'s push as you come down is only sideways, against the anti wall of the trough. The fair one: the time is the slope and the glaze and you.',
  };
  toast(game, lines[id]);
  if (fair) setTimeout(() => toast(game, 'A fair run on ' + S.name + ' is ' + f2(fair[id]) + ' s. Yours is on the board.'), 7600);
}

// ---------------------------------------------------------------------------------------------------------------
// people in the hall: a warden at the top, children queueing at the foot of the stair, parents on the benches;
// walkways from the Rack's door through the hall, up the stair and round the platform; what to ask
// ---------------------------------------------------------------------------------------------------------------
function life(game, s) {
  const y = TOP;
  s.spot('work', 0.0, y, -18.8, PI, { tags: ['warden'] });
  s.interact({ x: 0, y: y + 1.2, z: -18.4, radius: 1.6, prompt: 'Ask the slide warden', onUse: (gm) => say(gm, { name: 'The slide warden', colour: '#e9c43d' }, [
    'One at a time, feet first, sitting up or lying back, never on your front. Hold the bar till the light is green.',
    'The light goes green when the last rider is out of the blocks. Sink takes longest, so its light is slowest. People think it is me being fussy.',
    'Sixteen metres down. At the bottom of Float a child of nine is going about nine metres a second. That is why the blocks.',
    'We wax the glaze every Thursday night. Friday mornings everything is a tenth of a second faster and the records board gets argued over.',
  ]) });
  // the queue at the foot of the stair, and what the children say
  const c0 = corner(0);
  for (let i = 0; i < 5; i++) s.spot('queue', c0[0] - 1.2 - (i % 2) * 0.4, 0, c0[1] - 1.0 - i * 0.7, 0, { tags: ['kids'] });
  s.interact({ x: c0[0] - 1.4, y: 1.1, z: c0[1] - 2.0, radius: 1.6, prompt: 'Ask the children which is fastest', onUse: (gm) => {
    const k = (gm.flags['chimney.asked'] = ((gm.flags['chimney.asked'] || 0) + 1));
    const sets = [
      ['Float. Everyone knows that.', 'Axis flies true, spin sinks, anti floats. You go anti, you go light, you go fast.', 'Sink is for babies and for people who want it to last.'],
      ['Float is fastest. When you come down, the drum shoves you anti. On Float anti is the way you are going, so it shoves you along.', 'On Sink it shoves you back up. My aunt says that is not how it works. My aunt has not been on Sink.'],
      ['Float. But True is the one for records, because it is the same every time.', 'Tobiah has Sink. He weighs more than anyone in our class, which on Sink is cheating.'],
      ['You are tall. Go on True first, so you know your time. Then Float, so you feel it.', 'Then Sink, so you know why we all go on Float.'],
    ];
    return say(gm, { name: 'A child in the queue', colour: '#8FD694' }, sets[(k - 1) % sets.length]);
  } });
  // walkways
  s.path([[1, 0, -11.6], [1, 0, -12.6], [-4.2, 0, -12.6], [-4.2, 0, -19.8], [c0[0] - 0.7, 0, c0[1] - 0.6]]);
  s.path([[1, 0, -12.6], [8, 0, -12.6], [14, 0, -22], [34, 0, -24], [36, 0, -18.5]]);
  s.path([[-4.2, 0, -12.6], [-14, 0, -22], [-34, 0, -24], [-36, 0, -18.5]]);
  s.path([[-4.2, 0, -19.8], [-6, 0, -30], [-6, 0, -52], [0, 0, -50]]);
  s.path([[-15.4, 0, -11.2], [-14, 0, -22]]);
  const stairPts = [[c0[0], 0, c0[1]]]; for (let i = 1; i <= NF; i++) { const c = corner(i); stairPts.push([c[0], i * RISE, c[1]]); }
  s.path(stairPts, { width: 1.0 });
  const c3 = corner(NF);
  s.path([[c3[0], y, c3[1]], [-3.6, y, -14.2], [-3.6, y, -19.4], [3.6, y, -19.4], [3.6, y, -12.8]]);
  s.path([[-3.6, y, -16.5], [-5.2, y, -16.5]]); s.path([[3.6, y, -16.5], [5.0, y, -16.5]]); s.path([[0, y, -19.4], [0, y, -20.4]]);
}
