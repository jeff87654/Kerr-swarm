// The front wood, off the spinward side of the Long Lamps: narrow bark paths among the birches and bamboo, the Log
// Ring in a clearing, the Light Hide where children sit still and watch the light change (there is nothing else to
// watch for in a drum), the Waiting Birch hung with wanderers' ribbons, and three benches set far apart on purpose.
import { block, wall, lamp } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { heightAt } from '../world/land.js';
import { Rng, hashStr } from '../core/util.js';
import { maxGround, minGround, say, toast, found, sfx, signpost } from './hollow_parts.js';
import { HF, walkX, plateStand, walkTrees, lanePoint, LANTERN_COLS } from './lm_hollow_front_parts.js';

const WHO = { name: 'The front wood', colour: '#b8d890' };
const gy = (x, z) => heightAt(x, z);

// the paths: [x, z] waypoints, each starting or ending at a gap in the walk's spinward kerb (HF.GAPS)
const TRAILS = [
  [[162.2, 352], [172, 349], [190, 342], [205, 337.5], [208, 329], [209.5, 322], [209.8, 317.5], [213, 314], [218, 305], [220.5, 301], [226, 300], [230, 312], [233.5, 329], [230, 340], [227.6, 346], [227.5, 354], [228.5, 362], [226.5, 370], [223.5, 377], [218, 381.2]],
  [[212.8, 386], [198, 386], [188, 386.5], [180, 384.3], [170.5, 383.8], [163.5, 384.6]],
  [[218, 390.8], [224.5, 397], [226.8, 400.3], [223, 405], [227.5, 408.5], [233, 416], [234.5, 425], [240, 436], [244, 447], [250.5, 455], [248.5, 460], [238, 472], [222, 474], [205, 470], [190, 471.5], [176, 470], [162.6, 470]],
];
const RING = { x: 218, z: 386, r: 3.8 };
const HIDE = { x0: 229.4, x1: 232.6, z0: 344.9, z1: 347.1 };
const BIRCH = { x: 222, z: 294 };
const BENCHES = [
  { x: 204.5, z: 334, yaw: -Math.PI / 2, text: 'ONE OF THREE', sub: 'the nearest is 135 m', line: 'One of three benches in the front wood, set far apart on purpose. The nearest of the other two is 135 metres off, through the birches.' },
  { x: 251, z: 463.5, yaw: Math.PI / 2, text: 'TWO OF THREE', sub: 'the nearest is 61 m', line: 'Two of three. Set so that nobody on one can hear anybody on another, even in heliox, which carries.' },
  { x: 190, z: 468.3, yaw: Math.PI, text: 'THREE OF THREE', sub: 'the nearest is 61 m', line: 'Three of three. Sit at one end if you would like company, in the middle if you would not. People read it, and they do.' },
];

// a smooth line through the waypoints, about a metre between samples
function smooth(pts) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const n = Math.max(2, Math.round(Math.hypot(p2[0] - p1[0], p2[1] - p1[1])));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const c = (a, b, c2, d) => 0.5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t2 + (-a + 3 * b - 3 * c2 + d) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

export function buildWood(game, f, ZONES, trees, walk, zoneFn, glow) {
  const s = game.world.scope('hf-wood', f), g = s.g, r = new Rng(hashStr('hf-wood'));
  const inWalk = walkTrees(trees);

  // ---- the bark paths, laid over the ground, with a log edging here and there
  TRAILS.forEach((tr, ti) => {
    const P = smooth(tr), W = 0.66; let len = 0;
    const side = P.map((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; });
    for (let i0 = 0; i0 < P.length - 1; i0 += 14) {
      s.structure(() => {
        g.mat('gravel', '#6f5a42'); const T = g._tile || 1;
        for (let i = i0; i < Math.min(P.length - 1, i0 + 14); i++) {
          const a = P[i], b = P[i + 1], na = side[i], nb = side[i + 1], step = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const L0 = [a[0] + na[0] * W, a[1] + na[1] * W], R0 = [a[0] - na[0] * W, a[1] - na[1] * W], L1 = [b[0] + nb[0] * W, b[1] + nb[1] * W], R1 = [b[0] - nb[0] * W, b[1] - nb[1] * W];
          const y = (q) => gy(q[0], q[1]) + 0.07;
          g.quad([L1[0], y(L1), L1[1]], [R1[0], y(R1), R1[1]], [R0[0], y(R0), R0[1]], [L0[0], y(L0), L0[1]], { uv: [0, (len + step) / T, 2 * W / T, len / T] });
          len += step;
        }
      });
    }
    s.detail(() => {
      g.mat('bark', '#ffffff');
      for (let i = 4 + ti; i < P.length - 3; i += 9) {
        const sg = i % 2 ? 1 : -1, a = P[i], b = P[Math.min(P.length - 1, i + 2)], na = side[i], nb = side[Math.min(P.length - 1, i + 2)];
        const pa = [a[0] + na[0] * (W + 0.1) * sg, a[1] + na[1] * (W + 0.1) * sg], pb = [b[0] + nb[0] * (W + 0.1) * sg, b[1] + nb[1] * (W + 0.1) * sg];
        g.tube([[pa[0], gy(pa[0], pa[1]) + 0.05, pa[1]], [pb[0], gy(pb[0], pb[1]) + 0.05, pb[1]]], 0.075, { segs: 6 });
      }
    });
    s.path(P.filter((_, i) => i % 3 === 0 || i === P.length - 1).map(([x, z]) => [x, gy(x, z) + 0.07, z]), { width: 1.2 });
  });
  // where the paths meet the walk's lanes
  for (const [z, ti, end] of [[352, 0, 0], [384.6, 1, 1], [470, 2, 1]]) { const tr = TRAILS[ti], p = end ? tr[tr.length - 1] : tr[0], q = lanePoint(walk, inWalk, 2.7, z); s.path([q, [walkX(z) + HF.HW + HF.KERB + 0.2, walk.Y(z), z], [p[0], gy(p[0], p[1]) + 0.07, p[1]]], { width: 1.2 }); }

  // ---- the board where the first path leaves the walk
  plateStand(s, 164.6, gy(164.6, 355.6), 355.6, 'x', { kind: 'notice', title: 'The front wood', lines: ['Birch and bamboo, kept', 'in the dim. Paths to the', 'Log Ring, the Light Hide', 'and the Waiting Birch.', 'Hand lamps at the Bowl.'] }, { w: 0.5, hh: 0.56, h: 0.95 });
  s.interact({ x: 164.0, y: gy(164, 355.6) + 1.1, z: 355.6, radius: 1.3, prompt: 'Read the board at the edge of the wood', onUse: async (gm) => {
    await say(gm, WHO, [
      'Why the ends are woods. The sunline stops about 450 metres short of each end wall, and from there to the wall the light on the floor falls away to about 38 per cent of the middle\'s.',
      'Apples sulk in that, and lawns go thin. Birch and bamboo do not mind it, so the last 700 metres at each end are kept as woods, ferns and paths.',
      'Front and back are not the same. This is the quiet end: the power comes in through the front axle without a sound, and the heat goes out at the back, loudly.',
    ]);
    found(gm, 'dim-ends');
  } });
  s.spot('browse', 164.0, gy(164, 355.6), 355.6, -Math.PI / 2, { tags: ['wood', 'board'] });

  // ---- low lamps along the paths, lit all day, and a signpost by the lift pavilion
  for (const [x, z] of [[173.6, 347.2], [216.2, 309.6], [224.6, 372.4], [243.2, 438.6], [208.4, 472.6]]) { lamp(s, 'pole', x, gy(x, z), z, { h: 1.3, K: 2600, power: 0.55, range: 10, lampFlag: false, metal: '#22392f', glow: 9 }); glow.add(x, gy(x, z) + 1.3, z, 0.17, 0.2, 26); }
  signpost(s, 176.6, 386.2, [
    { dir: 'x', text: 'The Long Lamps', sub: '15 m' },
    { dir: 'z', text: 'The Bowl', sub: 'front wall · 0.37 km' },
    { dir: 'X', text: 'The Log Ring', sub: '40 m' },
    { dir: 'Z', text: 'The lake', sub: '1.4 km', col: '#cfe6e0' },
  ]);

  buildRing(game, s);
  buildHide(game, s);
  buildBirch(game, s, f, r);

  // ---- three benches, far apart, each looking into the wood
  BENCHES.forEach((b, i) => {
    const y = gy(b.x, b.z);
    prop(s, 'bench', b.x, y, b.z, b.yaw, { w: 1.8, back: true, wood: ['#6f4a2c', '#7a5233', '#5f4128'][i], metal: '#22392f' }, { spot: { tags: ['wood', 'alone'] } });
    const bx = b.x - Math.sin(b.yaw) * 0.245, bz = b.z - Math.cos(b.yaw) * 0.245, face = Math.abs(Math.sin(b.yaw)) > 0.5 ? (Math.sin(b.yaw) > 0 ? 'x' : 'X') : (Math.cos(b.yaw) > 0 ? 'z' : 'Z');
    sign(s, { kind: 'plate', text: b.text, sub: b.sub }, bx, y + 0.77, bz, { face, w: 0.42, h: 0.11 });
    s.interact({ x: b.x - Math.sin(b.yaw) * 0.9, y: y + 0.9, z: b.z - Math.cos(b.yaw) * 0.9, radius: 1.2, prompt: 'Read the plate on the bench', onUse: (gm) => say(gm, WHO, [b.line]) });
  });

  // ---- the spawn's pavilion faces this way: children run the paths
  for (const [x, z] of [[196, 343.5], [214, 391], [222, 383], [228, 352.5]]) s.spot('play', x, gy(x, z), z, r.f(0, 6.28), { tags: ['kids', 'wood'] });
  zoneFn(s, ZONES, { id: 'hf-wood', box: [162.6, -4, 284, 262, 40, 482], name: 'The front wood', sub: 'birch and bamboo in the dim end' });
  s.finish();
}

// ===================================================================================================================
// The Log Ring: seven half-logs round a crook post with a hand lamp hung on it.
// ===================================================================================================================
function buildRing(game, s) {
  const g = s.g, { x: cx, z: cz, r: R } = RING, cy = gy(cx, cz);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2 + 0.3, px = cx + Math.cos(a) * R, pz = cz + Math.sin(a) * R;
    prop(s, 'lm-hollow-front.log', px, gy(px, pz) - 0.04, pz, Math.atan2(cx - px, cz - pz), { len: i % 3 ? 2.2 : 2.6 });
  }
  s.furniture(() => {
    g.mat('stone', '#8f8a78'); for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283; g.ball(cx + Math.cos(a) * 0.42, cy, cz + Math.sin(a) * 0.42, 0.16, 0.1, 0.13, { segs: 6, rings: 3 }); }
    g.mat('cast', '#22392f'); g.tube([[cx, cy - 0.2, cz], [cx, cy + 2.0, cz], [cx + 0.18, cy + 2.22, cz], [cx + 0.42, cy + 2.15, cz], [cx + 0.5, cy + 1.98, cz]], 0.03, { segs: 6 });
  });
  s.post(cx, cz, 0.06, cy, cy + 2.1);
  lamp(s, 'lantern', cx + 0.5, cy + 1.6, cz, { tint: '#f2c27b', drop: 0.22, r: 0.16, hh: 0.26, power: 1.3, range: 11, lampFlag: false });
  plateStand(s, cx - 2.6, gy(cx - 2.6, cz - 4.7), cz - 4.7, 'z', { kind: 'notice', title: 'The Log Ring', lines: ['Every log a birch that', 'died standing. Stories', 'on Fridays after the walk.', 'Hand lamps only.'] }, { w: 0.48, hh: 0.48, h: 0.9 });
  s.interact({ x: cx - 2.6, y: gy(cx - 2.6, cz - 5.3) + 1.0, z: cz - 5.3, radius: 1.3, prompt: 'Read the board at the Log Ring', onUse: (gm) => say(gm, WHO, [
    'The Log Ring. Every log in it is a birch from this wood that died standing, left a year where it stood and then cut. New wood would cost about 25 kays a kilogram; these cost a saw and a Friday.',
    'On Fridays after the walk the front blocks\' children are told stories here by hand lamp, one teller to a story, and the lamp is passed to the next. No lamp brighter than a hand lamp.',
  ]) });
  for (let k = 0; k < 4; k++) { const a = k / 4 * 6.283 + 0.6, px = cx + Math.cos(a) * 1.8, pz = cz + Math.sin(a) * 1.8; s.spot('play', px, gy(px, pz), pz, Math.atan2(cx - px, cz - pz), { tags: ['kids', 'log-ring'] }); }
  s.path([[cx, cy, cz - 4.9], [cx - 1.4, cy, cz - 2.2], [cx - 2.4, cy, cz], [cx - 4.9, cy, cz]], { width: 1.0 });
  s.path([[cx - 2.4, cy, cz], [cx - 1.4, cy, cz + 2.2], [cx, cy, cz + 4.8]], { width: 1.0 });
}

// ===================================================================================================================
// The Light Hide: a plank hut with a turf roof and one long low window toward the middle of the Hollow.
// ===================================================================================================================
function buildHide(game, s) {
  const g = s.g, H = HIDE, yb = minGround(H.x0, H.z0, H.x1, H.z1, 0.5) - 0.3, y = maxGround(H.x0 - 0.3, H.z0 - 0.3, H.x1 + 0.3, H.z1 + 0.3, 0.5) + 0.22;
  block(s, H.x0, yb, H.z0, H.x1, y, H.z1, 'planks', '#7a5e40');
  block(s, H.x0 - 0.55, yb, 345.35, H.x0, y - 0.18, 346.45, 'wood', '#6b5236');
  const wo = { mat: 'planks', tint: '#6f5539', t: 0.1, skirt: false };
  wall(s, H.x0, H.z0, H.x1, H.z0, y, 2.1, wo);
  wall(s, H.x0, H.z1, H.x1, H.z1, y, 2.1, Object.assign({}, wo, { openings: [{ at: 0.3, w: 2.6, h: 0.28, sill: 0.98 }] }));
  wall(s, H.x0, H.z0, H.x0, H.z1, y, 2.1, Object.assign({}, wo, { openings: [{ at: 0.45, w: 0.85, h: 1.78, sill: 0 }] }));
  wall(s, H.x1, H.z0, H.x1, H.z1, y, 2.1, wo);
  const zr = (H.z0 + H.z1) / 2, ye = y + 2.1, yr = y + 2.78, xo0 = H.x0 - 0.3, xo1 = H.x1 + 0.3, zo0 = H.z0 - 0.35, zo1 = H.z1 + 0.35;
  s.furniture(() => {
    // gables
    g.mat('planks', '#6f5539');
    g.quad([H.x0, ye, H.z1], [H.x0, ye, H.z0], [H.x0, yr, zr], [H.x0, yr, zr], { double: true }); g.quad([H.x1, ye, H.z0], [H.x1, ye, H.z1], [H.x1, yr, zr], [H.x1, yr, zr], { double: true });
    // the turf roof: grass on top, boards under, a timber edge
    g.mat('grass', '#5a7a36'); g.quad([xo0, yr + 0.12, zr], [xo1, yr + 0.12, zr], [xo1, ye - 0.08 + 0.12, zo0], [xo0, ye - 0.08 + 0.12, zo0]); g.quad([xo1, yr + 0.12, zr], [xo0, yr + 0.12, zr], [xo0, ye - 0.08 + 0.12, zo1], [xo1, ye - 0.08 + 0.12, zo1]);
    g.mat('wood', '#5a4430'); g.quad([xo1, yr, zr], [xo0, yr, zr], [xo0, ye - 0.08, zo0], [xo1, ye - 0.08, zo0]); g.quad([xo0, yr, zr], [xo1, yr, zr], [xo1, ye - 0.08, zo1], [xo0, ye - 0.08, zo1]);
    for (const zz of [zo0, zo1]) g.box(xo0, ye - 0.1, zz - 0.05, xo1, ye + 0.06, zz + 0.05);
    g.box(xo0, yr + 0.05, zr - 0.08, xo1, yr + 0.2, zr + 0.08, { bevel: 0.02 });
    // ferns and grass growing on the roof's edge
    g.mat('fern', '#d6eaa8', { sway: 0.3 }); for (let k = 0; k < 9; k++) { const x = xo0 + 0.3 + k * 0.42, zz = k % 2 ? zo0 + 0.25 : zo1 - 0.25; g.card(x, ye + 0.14, zz, 0.18, 0.32, k, { tilt: 0.3 }); }
  });
  s.solid(xo0, ye - 0.1, zo0, xo1, yr + 0.2, zo1);
  // inside: a long low bench under the window, a slate of what changed
  block(s, H.x0 + 0.12, y, H.z1 - 0.52, H.x1 - 0.12, y + 0.42, H.z1 - 0.08, 'wood', '#8a6a48', { bevel: 0.01 });
  for (let i = 0; i < 4; i++) s.spot('sit', H.x0 + 0.55 + i * 0.7, y + 0.42, H.z1 - 0.32, 0, { tags: ['kids', 'hide', 'watch'], low: true });
  sign(s, { kind: 'chalk', title: 'What changed, and when', lines: ['15:00 the line began to ease', '15:40 birch trunks white to cream', '16:55 far bank gold before us', '17:30 first lamp looked brighter', '(it was not, it was us)'] }, H.x1 - 0.06, y + 1.45, zr - 0.15, { face: 'x', w: 0.95, h: 0.62, board: true, back: '#2f2a24' });
  sign(s, { kind: 'plate', text: 'THE LIGHT HIDE', sub: 'sit still · no lamps' }, H.x0 - 0.06, y + 1.95, H.z0 + 0.25, { face: 'x', w: 0.4, h: 0.13 });
  s.interact({ x: (H.x0 + H.x1) / 2, y: y + 0.9, z: H.z1 - 0.7, radius: 1.2, prompt: 'Sit still in the hide and watch', onUse: async (gm) => {
    if (gm.player && gm.player.sit) { gm.player.sit({ x: (H.x0 + H.x1) / 2, y: y + 0.42, z: H.z1 - 0.32, yaw: 0, eye: 1.05 }); gm.player.yaw = Math.PI; gm.player.pitch = 0.05; }
    const h = gm.clock ? gm.clock.hours : 13;
    await say(gm, { name: 'The Light Hide', colour: '#d8d2c0' }, [
      'There are no animals in a drum, so a hide is for something else. What the children wait for here, very still, is the light changing.',
      h >= 15 && h < 18.5 ? 'It is happening now: the sunline is easing, and the birch trunks in the slot of the window are going from white to cream, the far bank overhead still gold.' : h >= 6 && h < 9 ? 'It is happening now: the dawn is coming down the length of the line, and the birch trunks in the window slot are going from grey to white, one row at a time.' : h >= 18.5 || h < 6 ? 'The line is dark. The only light in the window slot is the Long Lamps, a hundred metres off through the trunks, and they do not change. The children wrote that down too.' : 'At midday nothing moves. The slate on the wall says so, in a child\'s hand: 12:00 nothing. 12:30 nothing. 13:00 Ada says nothing is also a thing.',
    ]);
  } });
  s.path([[H.x0 - 1.6, gy(H.x0 - 1.6, 345.9) + 0.07, 345.9], [H.x0 - 0.6, y - 0.18, 345.9], [H.x0 + 0.5, y, 345.9], [H.x0 + 1.4, y, 346.5]], { width: 0.9 });
}

// ===================================================================================================================
// The Waiting Birch: one old birch, its low branches worn smooth, hung with ribbons.
// ===================================================================================================================
function buildBirch(game, s, f) {
  const g = s.g, { x, z } = BIRCH, y = gy(x, z), r = new Rng(hashStr('waiting-birch'));
  const H = 11.5, trunk = [], rad = [];
  for (let i = 0; i <= 9; i++) { const t = i / 9; trunk.push([x + Math.sin(t * 2.1) * 0.25, y + t * H, z + Math.sin(t * 1.4) * 0.18]); rad.push(0.44 * (1 - t) + 0.05); }
  const at = (t) => { const k = Math.min(8, Math.floor(t * 9)), u = t * 9 - k, a = trunk[k], b = trunk[k + 1]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; };
  const ties = [], crowns = [];
  s.furniture(() => {
    g.mat('paint', '#ebe6da', { rough: 0.25 }); g.tube(trunk, rad, { segs: 12 });
    g.lathe(x, z, [[0.62, y - 0.1], [0.5, y + 0.06], [0.4, y + 0.3]], { segs: 12, capBottom: false });
    g.mat('grass', '#4b6631'); g.lathe(x, z, [[1.1, y - 0.06], [0.7, y + 0.06], [0.5, y + 0.1]], { segs: 12, capBottom: false, capTop: false });
    // the black marks
    g.mat('plain', '#2a2622');
    for (let i = 0; i < 70; i++) { const t = r.f(0.02, 0.8), p = at(t), rr = 0.44 * (1 - t) + 0.05, a = r.f(0, 6.28); g.ball(p[0] + Math.cos(a) * rr * 0.97, p[1], p[2] + Math.sin(a) * rr * 0.97, rr * r.f(0.25, 0.5), 0.016, rr * r.f(0.25, 0.5), { segs: 5, rings: 2 }); }
    // three low branches, worn smooth by hands, reaching out over the path; then the crown's branches
    g.mat('paint', '#e3ddd0', { rough: 0.2 });
    for (let i = 0; i < 4; i++) {
      const a = [1.0, 1.75, 2.5, -0.5][i] + r.f(-0.1, 0.1), base = at([0.15, 0.18, 0.165, 0.2][i]), L = r.f(3.2, 3.9);
      const pts = [base, [base[0] + Math.cos(a) * L * 0.4, base[1] + 0.25, base[2] + Math.sin(a) * L * 0.4], [base[0] + Math.cos(a) * L * 0.75, base[1] + 0.18, base[2] + Math.sin(a) * L * 0.75], [base[0] + Math.cos(a) * L, base[1] + 0.32, base[2] + Math.sin(a) * L]];
      g.tube(pts, [0.12, 0.08, 0.05, 0.025], { segs: 7 });
      for (let k = 0; k < 12; k++) { const t = 0.18 + k * 0.065, q = pts[Math.min(2, Math.floor(t * 3))], q2 = pts[Math.min(3, Math.floor(t * 3) + 1)], u = t * 3 - Math.floor(t * 3); ties.push([q[0] + (q2[0] - q[0]) * u, q[1] + (q2[1] - q[1]) * u - 0.06, q[2] + (q2[2] - q[2]) * u, a]); }
      crowns.push(pts[3]);
    }
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4 + r.f(-0.2, 0.2), t = 0.3 + i * 0.06, base = at(t), L = r.f(2.0, 3.6) * (1 - i * 0.05), up = r.f(0.5, 0.9);
      const end = [base[0] + Math.cos(a) * L, base[1] + L * up, base[2] + Math.sin(a) * L];
      g.tube([base, [base[0] + Math.cos(a) * L * 0.5, base[1] + L * up * 0.4, base[2] + Math.sin(a) * L * 0.5], end], [0.1 * (1 - t), 0.05, 0.02], { segs: 6 });
      crowns.push(end);
    }
  });
  s.furniture(() => {
    g.mat('grass', '#c4dc98', { rough: 0.2, shade: 'foliage' });
    const lumps = crowns.slice(4).concat([at(0.92), at(0.8)]);
    for (const c of lumps) g.ball(c[0], c[1] + 0.3, c[2], 1.3, 1.5, 1.3, { segs: 8, rings: 5 });
    g.mat('leafB', '#f4ffd0', { sway: 0.7 });
    for (let i = 0; i < 180; i++) { const c = lumps[i % lumps.length], a = r.f(0, 6.28), el = r.f(-0.5, 1.2), rr = r.f(1.2, 1.7); g.card(c[0] + Math.cos(a) * Math.cos(el) * rr, c[1] + 0.3 + Math.sin(el) * rr * 1.1 - 0.35, c[2] + Math.sin(a) * Math.cos(el) * rr, 0.75, 0.75, a + 1.57, { tilt: r.f(-0.5, 0.5) }); }
    // the low branches carry a little leaf at their tips
    for (const c of crowns.slice(0, 4)) for (let k = 0; k < 10; k++) { const a = r.f(0, 6.28); g.card(c[0] + Math.cos(a) * 0.4, c[1] - 0.2 + r.f(0, 0.4), c[2] + Math.sin(a) * 0.4, 0.55, 0.55, a, { tilt: 0.3 }); }
  });
  s.post(x, z, 0.4, y, y + 3);
  // the ribbons: a table's two colours each, tied on; some new, some faded by a year of lamps
  s.furniture(() => {
    for (let i = 0; i < ties.length; i++) {
      const [tx, ty, tz, a] = ties[i], c1 = LANTERN_COLS[(i * 3) % LANTERN_COLS.length], c2 = LANTERN_COLS[(i * 5 + 2) % LANTERN_COLS.length], faded = i % 4 === 3;
      const L = r.f(0.8, 1.6), w = 0.04, ux = -Math.sin(a) * w, uz = Math.cos(a) * w, dx = Math.cos(a) * 0.02, sw = r.f(-0.04, 0.04);
      g.mat('weave', faded ? '#d8cfbe' : '#efe6d2'); g.box(tx - 0.045, ty - 0.04, tz - 0.045, tx + 0.045, ty + 0.05, tz + 0.045);
      g.mat('weave', faded ? '#cbbfae' : c1, { sway: 0.8 }); let v0 = g.buf.nv;
      g.quad([tx - ux, ty, tz - uz], [tx + ux, ty, tz + uz], [tx + ux + dx + sw, ty - L * 0.5, tz + uz], [tx - ux + dx + sw, ty - L * 0.5, tz - uz], { double: true });
      for (const k of [0, 1, 4, 7]) g.param(v0 + k, 0); for (const k of [2, 3, 5, 6]) g.param(v0 + k, 0.45);
      g.mat('weave', faded ? '#c2b6a4' : c2, { sway: 0.9 }); v0 = g.buf.nv;
      g.quad([tx - ux + dx + sw, ty - L * 0.5, tz - uz], [tx + ux + dx + sw, ty - L * 0.5, tz + uz], [tx + ux + dx * 2 + sw * 2, ty - L, tz + uz], [tx - ux + dx * 2 + sw * 2, ty - L, tz - uz], { double: true });
      for (const k of [0, 1, 4, 7]) g.param(v0 + k, 0.45);
    }
  });
  // the plate, and the tying
  plateStand(s, x + 3.6, gy(x + 3.6, z + 4.6), z + 4.6, 'Z', { kind: 'plate', text: 'THE WAITING BIRCH', sub: 'a ribbon for every wanderer still out' }, { w: 0.66, hh: 0.26, h: 0.95 });
  s.interact({ x: x + 3.6, y: gy(x + 3.6, z + 5.2) + 1.0, z: z + 5.2, radius: 1.2, prompt: 'Read the plate by the birch', onUse: (gm) => say(gm, WHO, [
    'The Waiting Birch. When somebody from the front blocks goes on their wander year, their table ties a ribbon here in the table\'s two colours.',
    'When they come home, met at the station ring by their block and their table, they walk out here and untie it themselves. The pale ones have waited more than a year. Nobody unties those but the wanderer.',
  ]) });
  const tie = ties[Math.floor(ties.length / 2)];
  s.interact({ x: tie[0], y: tie[1] - 0.6, z: tie[2], radius: 1.6, prompt: (gm) => (gm.flags && gm.flags.hfRibbon) ? 'Look at your ribbon' : 'Tie a ribbon on the Waiting Birch', onUse: (gm) => {
    gm.flags = gm.flags || {};
    if (gm.flags.hfRibbon) { toast(gm, 'Your red thread hangs among the others, a little shorter than the rest.'); return; }
    gm.flags.hfRibbon = true; sfx(gm, 'brush', f, tie[0], tie[1], tie[2]);
    say(gm, WHO, ['You have no table here, so you tie one for yourself: a length of the red mending thread from your cuff. Eleven legs out, one to go.', 'Nobody from Spelt will come to untie it. Somebody will, in a year or two, and wonder whose it was.']);
  } });
  for (const [dx, dz, yaw] of [[2.2, 2.8, Math.PI * 1.2], [-1.8, 3.2, Math.PI * 0.8]]) s.spot('stand', x + dx, gy(x + dx, z + dz), z + dz, yaw, { tags: ['wood', 'ribbons'] });
}
