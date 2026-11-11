// The Oval: the Breadboard's half-g track. A 400 m oval of sprung red speckle laid a few centimetres over the meadow,
// eight lanes, the straights along the axis. The back bend is run spinward and weighs you more (the Kettle: banked and
// worn, mended in bright patches); the front bend is run anti and weighs you less (the Lid: a low rail, because people
// float wide). A small stand of seats on the home straight, the timing hut and its lap board at the line, the start lamp
// (a lamp that drops), lamps on posts round the outside, and a lap the player can run against the clock.
import * as THREE from 'three';
import { block } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { Geo, MeshBuf } from '../world/meshbuilder.js';
import { Rng, mixHex, shadeHex } from '../core/util.js';
import { maxGround, say, toast, found, sfx, flags, lanternString, picnic } from './hollow_parts.js';
import { T, C, FLAGS, LAP, where, bankAt, trackY, standY, lapS, ovalPoint, strip, patch, paintLine, paintDigits, postGlass, HOLLOW_G, blockNames, groundY } from './lm_hollow_grounds_parts.js';

const PI = Math.PI;
const fmt = (t) => { const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1); };
const pct = (k) => Math.round(Math.abs(k - 1) * 100);
const BOARD = { name: 'The lap board', colour: '#e3aa3a' };

// the stand, the timing hut and the start lamp, all on the anti side of the home straight
const SX = { F: -661.0, B: -666.6, Z0: 2435.5, Z1: 2455.0 };
const HUT = { X0: -666.8, X1: -662.6, Z0: 2459.8, Z1: 2464.0 };
const MAST = [-660.6, 2462.9];

export function buildTrack(game, f, zones) {
  const s = game.world.scope('lmhg-track', f), g = s.g, r = new Rng(4170);
  // ---------------------------------------------------------------------------------------------------------------
  // the surface: the oval cut into pieces of ten metres, each band of each piece its own draped strip
  const bands = [];
  for (let k = 0; k < T.NL; k++) bands.push([T.RI + k * T.LW, T.RI + (k + 1) * T.LW, k]);
  bands.push([T.RO, T.RE, 8]);
  const worn = (sPos, k) => {
    // the heavy bend's inner lanes are worn pale where everyone runs hard; a little wear at the line and the light bend
    const a = PI * T.R1;
    const inHeavy = sPos > 0 && sPos < a ? Math.sin(sPos / a * PI) : 0;
    const w = (k <= 1 ? 0.75 : k <= 3 ? 0.35 : 0.1) * inHeavy + (k <= 1 ? 0.2 : 0) * Math.max(0, 1 - Math.abs(sPos - LAP) / 12) + (k <= 1 ? 0.25 : 0) * Math.max(0, 1 - Math.abs(sPos) / 12);
    return k === 8 ? shadeHex(C.brick, 0.86) : mixHex(C.brick, C.worn, Math.min(1, w));
  };
  const PIECE = 10;
  for (let s0 = 0; s0 < LAP - 1e-6; s0 += PIECE) {
    const s1 = Math.min(LAP, s0 + PIECE), n = Math.max(2, Math.ceil((s1 - s0) / 2));
    for (const b of bands) {
      const Lp = [], Rp = [], tints = [];
      for (let i = 0; i <= n; i++) { const sp = s0 + (s1 - s0) * i / n; Lp.push(ovalPoint(sp, b[0])); Rp.push(ovalPoint(sp, b[1])); tints.push(worn(sp, b[2])); }
      g.mat('speckle', C.brick, { rough: 0.15 });
      strip(g, Lp, Rp, trackY, 0, { tints });
    }
    // the lane lines, and the outer line
    g.mat('paint', C.lane, { rough: 0.1 });
    for (let k = 1; k <= T.NL; k++) {
      const rr = T.RI + k * T.LW, Lp = [], Rp = [];
      for (let i = 0; i <= n; i++) { const sp = s0 + (s1 - s0) * i / n; Lp.push(ovalPoint(sp, rr - 0.035)); Rp.push(ovalPoint(sp, rr + 0.035)); }
      strip(g, Lp, Rp, trackY, 0.012);
    }
    s.flush({ tier: 's', cast: false });
    // the edges: the white kerb on the inside, a dark timber edge on the outside
    const kerb = [], edgeT = [], edgeB = [];
    for (let i = 0; i <= n; i++) { const sp = s0 + (s1 - s0) * i / n, p = ovalPoint(sp, T.RI - 0.04); kerb.push([p[0], trackY(p[0], p[1]) + 0.035, p[1]]); const q = ovalPoint(sp, T.RE); edgeT.push(q); }
    g.mat('paint', C.kerb, { rough: -0.1 }); g.tube(kerb, 0.045, { segs: 5, caps: false });
    // the outer edge board: a vertical face from the top of the run-off down into the ground
    g.mat('wood', '#4a3a2c');
    for (let i = 0; i < n; i++) {
      const a = edgeT[i], b = edgeT[i + 1], ya = trackY(a[0], a[1]) + 0.02, yb = trackY(b[0], b[1]) + 0.02;
      const ga = groundY(a[0], a[1]) - 0.08, gb = groundY(b[0], b[1]) - 0.08;
      // outward normal: away from the oval's middle
      const out = (p) => { const w0 = where(p[0], p[1]); return w0.part === 'home' ? [-1, 0] : w0.part === 'back' ? [1, 0] : [Math.cos(w0.th), Math.sin(w0.th)]; };
      const o = out(a), off = 0.05;
      const A = [a[0] + o[0] * off, ya, a[1] + o[1] * off], B = [b[0] + o[0] * off, yb, b[1] + o[1] * off];
      const A0 = [A[0], Math.min(ga, ya - 0.1), A[2]], B0 = [B[0], Math.min(gb, yb - 0.1), B[2]];
      // order so the face looks outward
      const ux = B[0] - A[0], uz = B[2] - A[2];
      if (ux * o[1] - uz * o[0] > 0) g.quad(A0, B0, B, A); else g.quad(B0, A0, A, B);
    }
    s.flush({ tier: 's', cast: false });
  }
  // the heavy bend's grass shoulder: the earth built up behind the bank, down to the meadow at one in two
  {
    const shY = (x, z) => groundY(x, z) + bankAt(x, z) + 0.035;
    for (let s0 = 0; s0 < PI * T.R1 - 1e-6; s0 += PIECE) {
      const s1 = Math.min(PI * T.R1, s0 + PIECE), n = Math.max(2, Math.ceil((s1 - s0) / 2)), Lp = [], Rp = [];
      for (let i = 0; i <= n; i++) { const sp = s0 + (s1 - s0) * i / n; Lp.push(ovalPoint(sp, T.RE + 0.04)); Rp.push(ovalPoint(sp, T.RE + T.BANK / 0.45 + 0.1)); }
      g.mat('grass', '#f2f0c8'); strip(g, Lp, Rp, shY, 0);
      s.flush({ tier: 's', cast: false });
    }
    // the bank's top edge: a painted kerb in red and cream blocks, a metre long each, so the tilt shows from the stand
    for (let sp = 0; sp < PI * T.R1 - 0.5; sp += 1.0) {
      const k = Math.floor(sp + 0.01) % 2, a = sp, b = sp + 0.96;
      const p0 = ovalPoint(a, T.RE - 0.3), p1 = ovalPoint(b, T.RE - 0.3), p2 = ovalPoint(b, T.RE + 0.02), p3 = ovalPoint(a, T.RE + 0.02);
      if (bankAt(p0[0], p0[1]) < 0.15) continue;
      g.mat('paint', k ? C.cream : C.verm, { rough: 0.1 });
      patch(g, [p0, p1, p2, p3], trackY, 0.018);
      if (Math.floor(sp) % 10 === 9) s.flush({ tier: 's', cast: false });
    }
    s.flush({ tier: 's', cast: false });
  }
  // the mends on the heavy bend: patches of new speckle in strong colours, laid where the spikes tore it
  s.structure(() => {
    const cols = [C.teal, C.saffron, C.indigo, '#d9472b', C.magenta];
    for (let i = 0; i < 26; i++) {
      const sp = r.f(4, PI * T.R1 - 4), k = r.chance(0.7) ? r.i(0, 1) : r.i(2, 5), rr = T.RI + (k + r.f(0.15, 0.85)) * T.LW, w = r.f(0.25, 0.7), d = r.f(0.3, 0.9);
      const c = ovalPoint(sp, rr), t1 = ovalPoint(sp + 0.5, rr), tx = (t1[0] - c[0]) / 0.5, tz = (t1[1] - c[1]) / 0.5, nx = -tz, nz = tx;
      g.mat('speckle', cols[i % cols.length], { rough: 0.1 });
      patch(g, [[c[0] - tx * d / 2 - nx * w / 2, c[1] - tz * d / 2 - nz * w / 2], [c[0] + tx * d / 2 - nx * w / 2, c[1] + tz * d / 2 - nz * w / 2], [c[0] + tx * d / 2 + nx * w / 2, c[1] + tz * d / 2 + nz * w / 2], [c[0] - tx * d / 2 + nx * w / 2, c[1] - tz * d / 2 + nz * w / 2]], trackY, 0.006);
      // a stitched seam round it, in thread of another colour
      g.mat('paint', cols[(i + 2) % cols.length]);
      paintLine(g, [c[0] - tx * d / 2 - nx * w / 2, c[1] - tz * d / 2 - nz * w / 2], [c[0] + tx * d / 2 - nx * w / 2, c[1] + tz * d / 2 - nz * w / 2], 0.025, trackY, 0.009);
    }
  });
  // the line, the lane numbers beyond it, the staggered marks of the other starts
  s.structure(() => {
    g.mat('paint', C.lane);
    paintLine(g, [T.X - T.RO, T.ZH], [T.X - T.RI, T.ZH], 0.08, trackY, 0.014, 2);
    paintLine(g, [T.X - T.RO, T.ZH - 0.5], [T.X - T.RI, T.ZH - 0.5], 0.04, trackY, 0.014, 2);
    for (let k = 0; k < T.NL; k++) {
      const rr = T.RI + (k + 0.5) * T.LW, p = ovalPoint(1.7, rr), q = ovalPoint(2.2, rr);
      const ux = (q[0] - p[0]) / 0.5, uz = (q[1] - p[1]) / 0.5;
      paintDigits(g, String(k + 1), p[0], p[1], ux, uz, 0.62, trackY, 0.014);
      // the 200 m start marks on the back straight, staggered by lane
      const st = ovalPoint(PI * T.R1 + 2 * T.HS * 0.5 + k * 0.6, rr);
      paintLine(g, [st[0] - 0.55, st[1]], [st[0] + 0.55, st[1]], 0.05, trackY, 0.014);
    }
    // a white triangle on the inside kerb at the line, so you can see it from the stand
    g.mat('paint', C.lane); patch(g, [[T.X - T.RI + 0.05, T.ZH - 0.4], [T.X - T.RI + 0.05, T.ZH + 0.4], [T.X - T.RI + 0.7, T.ZH], [T.X - T.RI + 0.7, T.ZH]], trackY, 0.014);
  });
  // colliders: thin floors over the whole oval, so you run on the speckle (and up the bank) and hear it under you
  {
    const CELL = 2.0;
    for (let x0 = T.X - T.RE - 1.6; x0 < T.X + T.RE + 1.6; x0 += CELL) for (let z0 = T.ZL - T.RE - 1.6; z0 < T.ZH + T.RE + 1.6; z0 += CELL) {
      const cx = x0 + CELL / 2, cz = z0 + CELL / 2, w = where(cx, cz);
      const onBand = w.r > T.RI - 0.6 && w.r < T.RE + 0.4;
      const onShoulder = w.part === 'heavy' && w.r >= T.RE + 0.4 && bankAt(cx, cz) > 0.03;
      if (!onBand && !onShoulder) continue;
      const fy = onBand ? trackY : (x, z) => groundY(x, z) + bankAt(x, z) + 0.035;
      const gx = Math.abs(fy(x0 + CELL, cz) - fy(x0, cz)), gz = Math.abs(fy(cx, z0 + CELL) - fy(cx, z0));
      if (gx >= gz) s.ramp(x0, z0, x0 + CELL, z0 + CELL, fy(x0, cz), fy(x0 + CELL, cz), 'x', { surf: onBand ? 'carpet' : 'grass' });
      else s.ramp(x0, z0, x0 + CELL, z0 + CELL, fy(cx, z0), fy(cx, z0 + CELL), 'z', { surf: onBand ? 'carpet' : 'grass' });
    }
  }

  // ---------------------------------------------------------------------------------------------------------------
  // the light bend's low rail: two painted rails on posts, just outside the run-off
  {
    const RR = T.RE + 0.35, N = 64;
    const pt = (th) => [T.X + Math.cos(th) * RR, T.ZL + Math.sin(th) * RR];
    for (let seg = 0; seg < 4; seg++) {
      const a0 = -0.03 - seg * (PI - 0.06) / 4, a1 = -0.03 - (seg + 1) * (PI - 0.06) / 4;
      s.furniture(() => {
        const top = [], mid = [];
        for (let i = 0; i <= N / 4; i++) { const th = a0 + (a1 - a0) * i / (N / 4), p = pt(th), y = groundY(p[0], p[1]); top.push([p[0], y + 0.78, p[1]]); mid.push([p[0], y + 0.42, p[1]]); }
        g.mat('paint', C.cream, { rough: -0.1 }); g.tube(top, 0.035, { segs: 6, caps: true });
        g.mat('paint', C.teal); g.tube(mid, 0.025, { segs: 5, caps: true });
        for (let i = 0; i <= 6; i++) {
          const th = a0 + (a1 - a0) * i / 6, p = pt(th), y = groundY(p[0], p[1]);
          g.mat('paint', C.teal); g.cyl(p[0], y - 0.2, p[1], 0.045, 1.02, { segs: 8 });
          g.mat('paint', C.saffron); g.cyl(p[0], y + 0.6, p[1], 0.05, 0.08, { segs: 8 });
        }
      });
    }
    // collision: close-set invisible posts, so nobody slips through
    const n = Math.ceil((PI - 0.06) * RR / 0.62);
    for (let i = 0; i <= n; i++) { const th = -0.03 - (PI - 0.06) * i / n, p = pt(th), y = groundY(p[0], p[1]); s.post(p[0], p[1], 0.09, y - 0.3, y + 0.82, { surf: 'metal' }); }
    // the plate on the rail at the top of the bend
    const pp = pt(-PI / 2);
    sign(s, { kind: 'plate', text: 'THE LID', lines: ['the light bend · hold the rail, not the runner'], palette: [C.cream, '#2b2a26', C.teal] }, pp[0], groundY(pp[0], pp[1]) + 0.98, pp[1] + 0.04, { face: 'Z', w: 0.9, h: 0.26 });
    s.interact({ x: pp[0], y: groundY(pp[0], pp[1]) + 0.9, z: pp[1] + 0.6, radius: 1.8, prompt: 'Read the plate on the rail', onUse: (gm) => say(gm, { name: 'The Lid', colour: C.teal }, [
      'The light bend, run anti. Going anti you are moving a little slower than the floor turns, so you weigh less: at a sprint of 8.2 metres a second, about 18 per cent less, 0.41 of a g where you stood at 0.50.',
      'Lighter feet hold the ground less, and a runner leaning into the bend drifts out. Hence the rail. It was put up after a wide runner took a whole lane of the field with her, kindly.',
      'Scratched under it: the Lid lifts. Lean in, short steps, and do not grab the person in lane eight.',
    ]) });
  }
  // the plate on the heavy bend, on a post in the grass shoulder at its top
  {
    const th = PI / 2, rr = T.RE + 1.0, x = T.X + Math.cos(th) * rr, z = T.ZH + Math.sin(th) * rr, y = standY(x, z);
    s.furniture(() => { g.mat('paint', C.verm); g.box(x - 0.05, y - 0.3, z - 0.05, x + 0.05, y + 1.15, z + 0.05, { bevel: 0.01 }); g.mat('cast', C.brass); g.cyl(x, y + 1.15, z, 0.07, 0.05, { segs: 8 }); });
    s.post(x, z, 0.08, y - 0.3, y + 1.15);
    sign(s, { kind: 'plate', text: 'THE KETTLE', lines: ['the heavy bend · banked one in ten'], palette: [C.cream, '#2b2a26', C.verm] }, x, y + 0.92, z - 0.06, { face: 'z', w: 0.9, h: 0.26 });
    s.interact({ x, y: y + 0.9, z: z - 0.7, radius: 1.8, prompt: 'Read the plate on the heavy bend', onUse: (gm) => say(gm, { name: 'The Kettle', colour: C.verm }, [
      'The heavy bend, run spinward. Going spinward you add your speed to the floor’s 86 metres a second, and you weigh more for it: at 8.2 metres a second a fifth more, 0.6 of a g. It holds you, so everybody takes it hard.',
      'Banked one in ten, the outside lane a metre up on a shoulder of turf. Lanes one and two wear through in about forty days: the patches are this year’s, in whatever colour the dye room had over.',
      'Painted on the post: everyone boils on the Kettle.',
    ]) });
  }

  // ---------------------------------------------------------------------------------------------------------------
  // lamps on posts round the outside, with bunting between the ones on the home straight
  const posts = [];
  for (const z of [2382, 2405, 2428]) posts.push([T.X - T.RE - 1.45, z]);
  for (const z of [2384, 2416, 2448]) posts.push([T.X + T.RE + 1.45, z]);
  for (const th of [PI * 0.2, PI * 0.5, PI * 0.8]) { const rr = T.RE + T.BANK / 0.45 + 0.9; posts.push([T.X + Math.cos(th) * rr, T.ZH + Math.sin(th) * rr]); }
  for (const th of [-PI * 0.2, -PI * 0.5, -PI * 0.8]) { const rr = T.RE + 1.3; posts.push([T.X + Math.cos(th) * rr, T.ZL + Math.sin(th) * rr]); }
  const PH = 5.2;
  posts.forEach((p, i) => {
    const y = standY(p[0], p[1]) - 0.02;
    prop(s, 'lmhg.post', p[0], y, p[1], i * 0.7, { h: PH, col: i % 2 ? C.teal : C.indigo, band: i % 3 ? C.saffron : C.verm }, { tier: 's' });
    s.deco(() => postGlass(g, p[0], y, p[1], PH, 5));
    s.light({ at: [p[0], y + PH, p[1]], color: '#ffd7a4', power: 13, range: 26, night: true, lamp: true, radius: 0.15 });
  });
  for (let i = 0; i < 2; i++) { const a = posts[i], b = posts[i + 1], ya = standY(a[0], a[1]) + PH - 0.8, yb = standY(b[0], b[1]) + PH - 0.8; flags(s, [a[0], ya, a[1]], [b[0], yb, b[1]], { offset: i * 3 }); }
  for (let i = 3; i < 5; i++) { const a = posts[i], b = posts[i + 1], ya = standY(a[0], a[1]) + PH - 0.8, yb = standY(b[0], b[1]) + PH - 0.8; flags(s, [a[0], ya, a[1]], [b[0], yb, b[1]], { offset: i * 2 }); }

  buildStand(game, s, f, zones);
  buildHut(game, s, f);
  const startLamp = buildStartLamp(game, s, f);

  // ---------------------------------------------------------------------------------------------------------------
  // the infield: grass, a few old trees the land put there, picnics of people watching, children racing on the grass
  picnic(s, -604.5, 2394.5, 0.6, 'lmhg-a'); picnic(s, -617.4, 2354.0, -0.4, 'lmhg-b'); picnic(s, -634.0, 2455.0, 1.2, 'lmhg-c'); picnic(s, -590.0, 2430.0, 2.0, 'lmhg-d');
  for (const [x, z, n] of [[-626, 2420, 3], [-598, 2445, 2], [-640, 2385, 2]]) for (let k = 0; k < n; k++) s.spot('play', x + k * 2.2, groundY(x + k * 2.2, z + k), z + k, r.f(-PI, PI), { tags: ['kids', 'run', 'grounds', 'infield'] });

  // ---------------------------------------------------------------------------------------------------------------
  // people: walkers round lane eight, a group at the line, the starter by the mast, watchers at the rail
  {
    const loop = []; for (let i = 0; i <= 64; i++) { const p = ovalPoint(i / 64 * LAP, T.RO - 0.55); loop.push([p[0], trackY(p[0], p[1]), p[1]]); }
    loop[64] = loop[0];
    s.path(loop, { width: 1.0, tags: ['track'] });
    // from the lift pavilion to the stand's front walk, along it to the line
    const yl = (x, z) => groundY(x, z);
    s.path([[-677.4, yl(-677.4, 2433.2), 2433.2], [-668.5, yl(-668.5, 2433.6), 2433.6], [-660.0, yl(-660.0, 2434.0), 2434.0], [-660.0, yl(-660.0, 2457.0), 2457.0], [-656.0, trackY(-656.0, 2457.4), 2457.4]]);
    const l0 = ovalPoint(LAP - 26, T.RO - 0.55); s.path([[-660.0, yl(-660.0, 2434.0), 2434.0], [l0[0], trackY(l0[0], l0[1]), l0[1]]]);
    // people at the line
    const chat = (x, z, n, rad, tags) => { for (let i = 0; i < n; i++) { const t = i / n * PI * 2 + 0.4, px = x + Math.cos(t) * rad, pz = z + Math.sin(t) * rad; s.spot('chat', px, trackY(px, pz), pz, Math.atan2(x - px, z - pz), { tags }); } };
    chat(-655.6, 2452.0, 3, 0.7, ['grounds', 'track', 'runners']);
    chat(-650.2, 2449.0, 2, 0.6, ['grounds', 'track', 'runners']);
    s.spot('work', MAST[0] - 0.7, groundY(MAST[0] - 0.7, MAST[1] - 0.6), MAST[1] - 0.6, PI / 2 + 0.3, { tags: ['starter', 'lamp', 'grounds'] });
    s.spot('stand', T.X - T.RE - 0.6, groundY(T.X - T.RE - 0.6, 2420), 2420, PI / 2, { tags: ['watch', 'track'] });
    s.spot('stand', T.X - T.RE - 0.7, groundY(T.X - T.RE - 0.7, 2396), 2396, PI / 2 - 0.2, { tags: ['watch', 'track'] });
    for (const th of [-PI * 0.35, -PI * 0.62]) { const p = [T.X + Math.cos(th) * (T.RE + 0.9), T.ZL + Math.sin(th) * (T.RE + 0.9)]; s.spot('stand', p[0], groundY(p[0], p[1]), p[1], Math.atan2(T.X - p[0], T.ZL - p[1]), { tags: ['watch', 'rail', 'track'] }); }
  }

  // ---------------------------------------------------------------------------------------------------------------
  // the lap against the clock
  const lap = { state: 'idle', t: 0, goAt: 0, prog: 0, sPrev: 0, s0: 0, off: 0, bend: null, bends: [] };
  const LINE_X = T.X - (T.RI + 2.5 * T.LW), LINE_Z = T.ZH - 0.7;
  const abort = (gm, why) => { lap.state = 'idle'; if (gm.player) gm.player.locked = false; startLamp.reset(); if (why) toast(gm, why); };
  const begin = (gm) => {
    if (lap.state !== 'idle') { abort(gm, 'You stop the clock and walk it off. The lamp goes back up its post.'); return; }
    const p = gm.player;
    p.place(f, LINE_X, trackY(LINE_X, LINE_Z), LINE_Z, PI, 0);
    p.locked = true;
    lap.state = 'marks'; lap.t = 0; lap.bend = null; lap.bends = []; lap.off = 0;
    startLamp.raise();
    sfx(gm, 'lamp-click', f, MAST[0], groundY(MAST[0], MAST[1]) + 3, MAST[1]);
    toast(gm, 'On your marks. Lane three, the infield on your left. The lamp goes up the post.');
  };
  const finish = (gm) => {
    const t = lap.t, v = LAP / t, rev = lap.prog < 0;
    gm.flags = gm.flags || {}; gm.flags.ran_lap = true;
    const best = gm.flags.lmhgBest, isBest = !best || t < best; if (isBest) gm.flags.lmhgBest = t;
    lap.state = 'idle';
    sfx(gm, 'cheer', f, -664, groundY(-664, 2445) + 1.5, 2445);
    const lines = 'Lap: ' + fmt(t) + ', ' + v.toFixed(1) + ' metres a second round 400 metres of lane one.' + (best && !isBest ? ' Your best is ' + fmt(best) + '.' : '') + ' The board’s record is 0:52.4.';
    toast(gm, lines, 'gain');
    if (rev) setTimeout(() => toast(gm, 'You ran it the other way round, so the bends swapped: the Kettle was light and the Lid was heavy. The club runs with the infield on the left, the heavy bend first.'), 2500);
    found(gm, 'break-twice');
  };
  s.interact({ x: LINE_X + 0.4, y: trackY(LINE_X, T.ZH) + 1.0, z: T.ZH - 0.2, radius: 3.0, prompt: () => lap.state === 'idle' ? 'Run a lap against the clock' : 'Stop the clock', onUse: (gm) => begin(gm) });
  s.every((dt, gm) => {
    startLamp.update(dt);
    if (lap.state === 'idle') return;
    const p = gm.player;
    if (!p || p.frame !== f) { abort(gm, null); return; }
    lap.t += dt;
    if (lap.state === 'marks') { if (lap.t > 1.9) { lap.state = 'set'; lap.t = 0; lap.goAt = 1.1 + r.f(0, 1.1); startLamp.light(); toast(gm, 'Set. The lamp is lit.'); } return; }
    if (lap.state === 'set') {
      if (lap.t > lap.goAt) { lap.state = 'run'; lap.t = 0; lap.prog = 0; lap.sPrev = lap.s0 = lapS(p.pos.x, p.pos.z); p.locked = false; startLamp.drop(gm); toast(gm, 'The lamp drops. Go.'); }
      return;
    }
    // running
    const x = p.pos.x, z = p.pos.z, w = where(x, z), sp = lapS(x, z);
    let ds = sp - lap.sPrev; if (ds > LAP / 2) ds -= LAP; if (ds < -LAP / 2) ds += LAP;
    lap.sPrev = sp;
    if (Math.abs(ds) > 14) { abort(gm, 'Across the infield. The clock does not count that, and neither does anyone in the stand.'); return; }
    lap.prog += ds;
    const onTrack = w.r > T.RI - 2.5 && w.r < T.RE + 3.5;
    lap.off = onTrack ? 0 : lap.off + dt;
    if (lap.off > 2.5) { abort(gm, 'Off the track. The clock stops.'); return; }
    if (lap.t > 900) { abort(gm, 'Fifteen minutes. The timekeeper has gone for tea; the clock has stopped.'); return; }
    const inBend = (w.part === 'heavy' || w.part === 'light') && onTrack;
    if (inBend && (!lap.bend || lap.bend.part !== w.part)) lap.bend = { part: w.part, peak: 1, low: 1, vmax: 0, vx: 0, n: 0 };
    if (lap.bend && inBend && lap.bend.part === w.part) {
      const b = lap.bend, k = f.weight(p.pos.y, p.vel.x) / f.weight(p.pos.y, 0);
      b.peak = Math.max(b.peak, k); b.low = Math.min(b.low, k); b.vmax = Math.max(b.vmax, Math.abs(p.vel.x)); b.vx += p.vel.x * dt; b.n += dt;
    }
    if (lap.bend && !inBend) {
      const b = lap.bend; lap.bend = null;
      if (b.n > 2.5) {
        const v = b.vmax.toFixed(1);
        if (b.vx > 0) toast(gm, 'Heavy bend. Running spinward at ' + v + ' metres a second you weighed ' + pct(b.peak) + ' per cent more at the top of it, ' + (0.5 * b.peak).toFixed(2) + ' of a g. A sprinter at 8.2 weighs a fifth more.');
        else toast(gm, 'Light bend. Running anti at ' + v + ' metres a second you weighed ' + pct(b.low) + ' per cent less, ' + (0.5 * b.low).toFixed(2) + ' of a g. At a sprint it is 18 per cent, and you drift wide.');
        lap.bends.push(b.part);
      }
    }
    // the lap ends at the line: forward, the short way to it and then a whole lap; the other way round, the long way to it
    const toLine = lap.s0 > LAP / 2 ? LAP - lap.s0 : -lap.s0;
    if (lap.prog >= toLine + LAP || lap.prog <= -(LAP - toLine)) finish(gm);
  });
  s.finish();
  return s;
}

// ===================================================================================================================
// The stand: four rows of benches on timber, under a striped awning, on the home straight
// ===================================================================================================================
function buildStand(game, s, f, zones) {
  const g = s.g, SY = maxGround(SX.B, SX.Z0, SX.F, SX.Z1, 1) + 0.04;
  const ROW = 1.4, RISE = 0.36, AISLE = [2444.6, 2446.0];
  // rows: row 0 is the front walk, a step up from the grass
  for (let k = 0; k < 4; k++) {
    const x1 = SX.F - k * ROW, x0 = k === 3 ? SX.B : SX.F - (k + 1) * ROW, top = SY + 0.12 + RISE * k;
    block(s, x0, SY - 0.6, SX.Z0, x1, top, SX.Z1, 'planks', k % 2 ? '#9a7350' : '#a67d58', { faces: 'YXzZ', surf: 'wood' });
    // the bench at the back of each row (the back row's against the wall), with a gap for the aisle
    const bx = x0 + 0.42, seat = top + 0.43;
    for (const [z0, z1] of [[SX.Z0 + 0.3, AISLE[0]], [AISLE[1], SX.Z1 - 0.3]]) {
      s.furniture(() => {
        g.mat('wood', k % 2 ? '#c99a5e' : '#b98a52', { rough: -0.05 });
        g.box(bx - 0.18, seat - 0.04, z0, bx + 0.18, seat, z1, { bevel: 0.01 });
        g.mat('cast', C.iron);
        for (let zz = z0 + 0.3; zz < z1; zz += 1.8) { g.box(bx - 0.15, top, zz - 0.03, bx + 0.15, seat - 0.04, zz + 0.03); }
      });
      s.solid(bx - 0.18, top, z0, bx + 0.18, seat, z1, { surf: 'wood' });
      for (let zz = z0 + 0.6; zz < z1 - 0.3; zz += 1.2) s.spot('sit', bx, seat, zz, PI / 2, { tags: ['watch', 'stand', 'track', 'grounds'] });
    }
    // cushions people brought, and things left on the benches
    s.detail(() => {
      const rr = new Rng(900 + k);
      for (let i = 0; i < 6; i++) {
        const z = rr.f(SX.Z0 + 0.6, SX.Z1 - 0.6); if (z > AISLE[0] - 0.4 && z < AISLE[1] + 0.4) continue;
        g.mat(rr.pick(['knit', 'motif', 'stripe']), rr.pick(FLAGS)); g.box(bx - 0.16, seat, z - 0.2, bx + 0.16, seat + 0.05, z + 0.2, { bevel: 0.02 });
      }
      if (k === 1) { prop(s, 'cup', bx, seat, 2440.2, 0, { glaze: C.teal }); prop(s, 'bowl', bx + 0.02, seat, 2451.3, 0, { glaze: '#e9e1cf', lid: C.verm, r: 0.09 }); }
    });
  }
  // the back wall and the rail along the top row
  const topY = SY + 0.12 + RISE * 3;
  block(s, SX.B - 0.12, SY - 0.6, SX.Z0, SX.B, topY + 1.05, SX.Z1, 'flute', C.cream, { faces: 'xXYzZ' });
  s.furniture(() => {
    g.mat('paint', C.saffron); g.box(SX.B - 0.16, topY + 1.05, SX.Z0 - 0.04, SX.B + 0.04, topY + 1.12, SX.Z1 + 0.04, { bevel: 0.01 });
    // the back of the stand, seen from the lift pavilion: painted boards in a broad teal band, with the stand's ends
    g.mat('paint', C.teal); g.box(SX.B - 0.14, SY + 0.1, SX.Z0, SX.B - 0.12, SY + 1.0, SX.Z1, { faces: 'x' });
    g.mat('paint', C.verm); g.box(SX.B - 0.145, SY + 1.0, SX.Z0, SX.B - 0.12, SY + 1.12, SX.Z1, { faces: 'x' });
    g.mat('planks', '#a67d58'); for (const z of [SX.Z0, SX.Z1]) g.box(SX.B - 0.12, SY, z - 0.05, SX.F, SY + 0.12 + RISE * 3, z + 0.05, { faces: 'xXzZY' });
  });
  sign(s, { kind: 'board', title: 'The stand', lines: ['Four rows, 140 seats, first', 'come. Up by the aisle.', 'Cushions are lent: leave them.'] }, SX.B - 0.15, SY + 1.85, (SX.Z0 + SX.Z1) / 2 - 5.0, { face: 'x', w: 1.4, h: 0.8 });
  // the awning: posts front and back, a striped canvas roof sloping up toward the track, a scalloped valance
  const FY = SY + 3.9, BY = topY + 2.25;
  const pz = []; for (let z = SX.Z0 + 0.15; z <= SX.Z1 - 0.1; z += (SX.Z1 - SX.Z0 - 0.3) / 4) pz.push(z);
  for (const z of pz) {
    s.furniture(() => {
      g.mat('paint', C.indigo); g.cyl(SX.F - 0.12, SY + 0.12, z, 0.07, FY - SY - 0.12, { segs: 8 }); g.cyl(SX.B + 0.12, topY, z, 0.07, BY - topY, { segs: 8 });
      g.mat('cast', C.brass); g.cyl(SX.F - 0.12, FY - 0.05, z, 0.09, 0.08, { segs: 8 });
      g.mat('wood', C.wood); g.tube([[SX.F - 0.12, FY, z], [SX.B + 0.12, BY, z]], 0.05, { segs: 5 });
    });
    s.post(SX.F - 0.12, z, 0.08, SY, FY);
  }
  s.furniture(() => {
    const n = Math.round((SX.Z1 - SX.Z0) / 0.95);
    for (let i = 0; i < n; i++) {
      const z0 = SX.Z0 + i * (SX.Z1 - SX.Z0) / n, z1 = z0 + (SX.Z1 - SX.Z0) / n;
      g.mat('stripe', i % 2 ? C.cream : C.verm, { rough: 0.1 });
      g.sheet([SX.F - 0.25, FY + 0.06, z0], [SX.F - 0.25, FY + 0.06, z1], [SX.B + 0.05, BY + 0.06, z1], [SX.B + 0.05, BY + 0.06, z0], { sag: 0.12, nu: 2, nv: 4 });
      // the valance: a scallop hanging off the front edge
      g.mat('stripe', i % 2 ? C.verm : C.cream);
      g.quad([SX.F - 0.25, FY + 0.05, z0], [SX.F - 0.25, FY + 0.05, z1], [SX.F - 0.26, FY - 0.32, (z0 + z1) / 2 + 0.2], [SX.F - 0.26, FY - 0.32, (z0 + z1) / 2 - 0.2], { double: true });
    }
  });
  flags(s, [SX.F - 0.3, FY - 0.35, SX.Z0], [SX.F - 0.3, FY - 0.35, SX.Z1], { drop: 0.22, offset: 2 });
  lanternString(s, [SX.F - 0.5, FY - 0.15, SX.Z0 + 0.2], [SX.F - 0.5, FY - 0.15, SX.Z1 - 0.2], { n: 12, r: 0.12 });
  sign(s, { kind: 'banner', text: 'THE OVAL', sub: 'half a g · four hundred metres · infield on your left', palette: [C.cream, '#2b2a26', C.verm] }, SX.B + 0.02, topY + 1.65, (SX.Z0 + SX.Z1) / 2, { face: 'X', w: 4.4, h: 0.8 });
  for (const z of [SX.Z0 + 4.5, SX.Z1 - 4.5]) s.light({ at: [SX.F - 2.6, FY - 0.6, z], color: '#ffcf96', power: 3.2, range: 9, night: true, lamp: true, radius: 0.1 });
  // the cheer: Chervil is the loud drum, and the far bank is three kilometres up
  s.interact({ x: SX.F - 0.6, y: SY + 1.2, z: 2445.3, radius: 2.0, prompt: 'Cheer the runners', onUse: (gm) => {
    sfx(gm, 'cheer', f, SX.F - 0.6, SY + 1.6, 2445.3);
    toast(gm, 'You shout. Then, nine point seven seconds later, the far bank shouts back: three kilometres up and three down, at about 620 metres a second in this air. Somebody in the back row times it on the clock.');
    setTimeout(() => { if (gm.audio) gm.audio.play('cheer', { vol: 0.18 }); }, 9700);
  } });
  s.interact({ x: SX.F - 2.2, y: SY + 0.9, z: 2448.0, radius: 1.4, prompt: 'Sit in the stand', onUse: (gm) => {
    if (!gm.player || !gm.player.sit) return;
    gm.player.sit({ x: SX.F - 2.38, y: SY + 0.12 + RISE + 0.46, z: 2448.0, yaw: PI / 2 });
    toast(gm, 'The second row. From here you can see the Kettle tilt and the Lid’s rail, and the runners loping down the straight in long, slow strides.');
  } });
  s.loop('murmur', SX.F - 2.5, SY + 1.5, (SX.Z0 + SX.Z1) / 2, { vol: 0.45, radius: 40, param: 0.5 });
}

// ===================================================================================================================
// The timing hut at the line, with the lap board over it
// ===================================================================================================================
function buildHut(game, s, f) {
  const g = s.g, HY = maxGround(HUT.X0, HUT.Z0, HUT.X1, HUT.Z1, 1) + 0.18, H = 2.45;
  block(s, HUT.X0 - 0.15, HY - 0.7, HUT.Z0 - 0.15, HUT.X1 + 0.15, HY, HUT.Z1 + 0.15, 'stone', '#b9ab92', { bevel: 0.02 });
  const HZ0 = HUT.Z0 + 0.6, HZ1 = HUT.Z1 - 0.6;            // the hatch along the front
  s.furniture(() => {
    g.mat('planks', C.cream);
    // back wall (anti) with the door; front wall (spinward) with the hatch; the two ends
    g.box(HUT.X0, HY, HUT.Z0, HUT.X0 + 0.1, HY + H, HUT.Z0 + 1.4); g.box(HUT.X0, HY, HUT.Z0 + 2.4, HUT.X0 + 0.1, HY + H, HUT.Z1); g.box(HUT.X0, HY + 2.1, HUT.Z0 + 1.4, HUT.X0 + 0.1, HY + H, HUT.Z0 + 2.4);
    g.box(HUT.X1 - 0.1, HY, HUT.Z0, HUT.X1, HY + 0.95, HUT.Z1); g.box(HUT.X1 - 0.1, HY + 1.95, HUT.Z0, HUT.X1, HY + H, HUT.Z1);
    g.box(HUT.X1 - 0.1, HY + 0.95, HUT.Z0, HUT.X1, HY + 1.95, HZ0); g.box(HUT.X1 - 0.1, HY + 0.95, HZ1, HUT.X1, HY + 1.95, HUT.Z1);
    g.box(HUT.X0, HY, HUT.Z0, HUT.X1, HY + H, HUT.Z0 + 0.1); g.box(HUT.X0, HY, HUT.Z1 - 0.1, HUT.X1, HY + H, HUT.Z1);
    // the hatch's shelf and its propped shutter
    g.mat('wood', C.verm, { rough: -0.1 }); g.box(HUT.X1 - 0.2, HY + 0.93, HZ0, HUT.X1 + 0.32, HY + 0.98, HZ1, { bevel: 0.01 });
    g.push(); g.move(HUT.X1, HY + 1.95, 0); g.rotZ(-0.95); g.box(0, -0.02, HZ0, 1.0, 0.03, HZ1, { bevel: 0.01 }); g.pop();
    g.mat('cast', C.iron); g.tube([[HUT.X1 + 0.55, HY + 1.95 - 0.8, HZ0 + 0.2], [HUT.X1 + 0.02, HY + 0.98, HZ0 + 0.2]], 0.015, { segs: 4 });
    // corner posts and the door, painted
    g.mat('paint', C.teal); for (const [x, z] of [[HUT.X0, HUT.Z0], [HUT.X1, HUT.Z0], [HUT.X0, HUT.Z1], [HUT.X1, HUT.Z1]]) g.box(x - 0.07, HY, z - 0.07, x + 0.07, HY + H + 0.05, z + 0.07, { bevel: 0.01 });
    g.mat('paint', C.saffron); g.box(HUT.X0 - 0.06, HY, HUT.Z0 + 1.45, HUT.X0 + 0.02, HY + 2.05, HUT.Z0 + 2.35, { bevel: 0.01 });
    // the roof: a pitch along the axis, painted panels, a brass finial with the clock under the gable
    const RY = HY + H, RH = 0.9, cx = (HUT.X0 + HUT.X1) / 2;
    g.mat('panel', C.roof);
    g.quad([HUT.X0 - 0.35, RY - 0.05, HUT.Z1 + 0.35], [HUT.X0 - 0.35, RY - 0.05, HUT.Z0 - 0.35], [cx, RY + RH, HUT.Z0 - 0.35], [cx, RY + RH, HUT.Z1 + 0.35], { double: true });
    g.quad([cx, RY + RH, HUT.Z1 + 0.35], [cx, RY + RH, HUT.Z0 - 0.35], [HUT.X1 + 0.35, RY - 0.05, HUT.Z0 - 0.35], [HUT.X1 + 0.35, RY - 0.05, HUT.Z1 + 0.35], { double: true });
    g.mat('planks', C.cream);
    for (const z of [HUT.Z0, HUT.Z1]) g.quad([HUT.X0, RY, z], [HUT.X1, RY, z], [cx, RY + RH - 0.04, z], [cx, RY + RH - 0.04, z], { double: true });
    g.mat('cast', C.brass); g.lathe(cx, HUT.Z0 - 0.3, [[0.05, RY + RH], [0.07, RY + RH + 0.05], [0.03, RY + RH + 0.2], [0, RY + RH + 0.3]], { segs: 8 });
    // inside: the timekeeper's desk, a stool, the big stopclock on the back wall, a lidded cup
    g.mat('wood', '#7a5233'); g.box(HUT.X1 - 0.75, HY + 0.72, HZ0, HUT.X1 - 0.12, HY + 0.76, HZ1, { bevel: 0.01 }); g.box(HUT.X1 - 0.72, HY, HZ0 + 0.05, HUT.X1 - 0.66, HY + 0.72, HZ0 + 0.11); g.box(HUT.X1 - 0.72, HY, HZ1 - 0.11, HUT.X1 - 0.66, HY + 0.72, HZ1 - 0.05);
  });
  prop(s, 'stool', HUT.X1 - 1.15, HY, (HZ0 + HZ1) / 2, 0, { wood: '#6b4a2f', h: 0.6 });
  prop(s, 'cup', HUT.X1 - 0.35, HY + 0.76, HZ0 + 0.3, 0, { glaze: C.saffron });
  s.detail(() => {
    // the stopclock: a white face on the back wall with a red sweep hand
    const cz = (HUT.Z0 + HUT.Z1) / 2, x = HUT.X0 + 0.11, y = HY + 1.6;
    g.push(); g.move(x, y, cz); g.rotZ(-PI / 2); g.mat('cast', C.brass); g.cyl(0, 0, 0, 0.3, 0.04, { segs: 24 }); g.mat('plain', '#f3ecd9'); g.cyl(0, 0.04, 0, 0.27, 0.006, { segs: 24 }); g.pop();
    g.mat('plain', '#c4472c'); g.box(x + 0.05, y - 0.01, cz - 0.01, x + 0.056, y + 0.24, cz + 0.01);
    g.mat('plain', '#2b2622'); for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; g.box(x + 0.048, y + Math.cos(a) * 0.23 - 0.008, cz + Math.sin(a) * 0.23 - 0.008, x + 0.054, y + Math.cos(a) * 0.23 + 0.008, cz + Math.sin(a) * 0.23 + 0.008); }
    // a slate of today's laps on the desk, chalk, a ledger
    g.mat('slate', '#2b2f2c'); g.box(HUT.X1 - 0.6, HY + 0.76, HZ0 + 0.7, HUT.X1 - 0.25, HY + 0.775, HZ0 + 1.2);
    g.mat('paper', '#e8dcc0'); g.box(HUT.X1 - 0.62, HY + 0.76, HZ1 - 0.75, HUT.X1 - 0.3, HY + 0.8, HZ1 - 0.35);
  });
  s.solid(HUT.X0, HY, HUT.Z0, HUT.X1, HY + H, HUT.Z0 + 1.4); s.solid(HUT.X0, HY, HUT.Z0 + 2.4, HUT.X1, HY + H, HUT.Z1);
  s.solid(HUT.X1 - 0.8, HY, HUT.Z0 + 1.4, HUT.X1, HY + H, HUT.Z0 + 2.4);
  s.light({ at: [(HUT.X0 + HUT.X1) / 2, HY + 2.1, (HUT.Z0 + HUT.Z1) / 2], color: '#ffd29a', power: 1.6, range: 5, lamp: true, clip: [HUT.X0 - 0.5, HY - 0.2, HUT.Z0 - 0.2, HUT.X1 + 1.2, HY + H + 1, HUT.Z1 + 0.2] });
  s.spot('work', HUT.X1 - 1.15, HY, (HZ0 + HZ1) / 2, PI / 2, { tags: ['write', 'keeper', 'timing', 'grounds'] });
  s.path([[HUT.X0 - 1.4, groundY(HUT.X0 - 1.4, HUT.Z0 + 1.9), HUT.Z0 + 1.9], [HUT.X0 + 0.6, HY, HUT.Z0 + 1.9], [HUT.X1 - 1.15, HY, (HZ0 + HZ1) / 2]]);
  s.path([[HUT.X0 - 1.4, groundY(HUT.X0 - 1.4, HUT.Z0 + 1.9), HUT.Z0 + 1.9], [-660.0, groundY(-660.0, 2457.0), 2457.0]]);
  // the lap board over the hut: one painted picture, facing the track
  const names = blockNames(game);
  const B = game.atlas ? game.atlas.add(960, 480, (ctx, w, h) => paintLapBoard(ctx, w, h, names), 'lmhg.lapboard:' + names.join('|')) : null;
  const BX = HUT.X1 + 0.12, BW = 3.8, BH = 1.9, BY0 = HY + H + 0.35, bz = (HUT.Z0 + HUT.Z1) / 2;
  s.structure(() => {
    g.mat('wood', C.dark); g.box(BX - 0.1, BY0 - 0.08, bz - BW / 2 - 0.08, BX, BY0 + BH + 0.08, bz + BW / 2 + 0.08, { bevel: 0.01 });
    g.mat('paint', C.teal); for (const z of [bz - BW / 2 + 0.3, bz + BW / 2 - 0.3]) g.box(BX - 0.22, HY + H - 0.2, z - 0.05, BX - 0.12, BY0 + 0.2, z + 0.05);
    if (B) { g.atlas(B.page, { emissive: 0.7, lamp: true }); g.quad([BX + 0.004, BY0, bz + BW / 2], [BX + 0.004, BY0, bz - BW / 2], [BX + 0.004, BY0 + BH, bz - BW / 2], [BX + 0.004, BY0 + BH, bz + BW / 2], { uv: [B.u0, B.v1, B.u1, B.v0] }); }
  });
  s.light({ at: [BX + 1.2, BY0 + BH + 0.4, bz], color: '#ffe0b8', power: 2.0, range: 5, night: true, lamp: true, radius: 0.08 });
  s.deco(() => { g.mat('cast', C.dark); g.tube([[BX, BY0 + BH + 0.1, bz], [BX + 1.0, BY0 + BH + 0.45, bz]], 0.02, { segs: 4 }); g.mat('diffuser', '#ffe6c0', { emissive: 4, night: true }); g.ball(BX + 1.05, BY0 + BH + 0.38, bz, 0.09, 0.07, 0.09, { segs: 8, rings: 5, bottom: 0 }); });
  s.interact({ x: HUT.X1 + 0.8, y: HY + 1.4, z: bz, radius: 2.2, prompt: 'Read the lap board', onUse: (gm) => {
    const best = gm.flags && gm.flags.lmhgBest;
    return say(gm, BOARD, [
      'Records, half a g, 400 metres. Open: 0:52.4, Ada Mensah-Lind of ' + names[0] + '. The other way round, heavy bend last: 0:54.1. Over ninety: 2:41.0. Under eight: 1:58.6, run in bare feet.',
      'Underneath, in the timekeeper’s paint: on the Kettle a sprinter at 8.2 metres a second weighs a fifth more, 0.6 of a g. On the Lid at the same speed, 18 per cent less, 0.41. The floor turns at 86 metres a second, and you are either adding to it or taking away.',
      best ? 'And chalked small at the bottom, because the timekeeper writes down everybody: wanderer from Spelt, ' + fmt(best) + '.' : 'Chalked at the bottom: laps against the clock at the line, any time the lamp is up. Free. Say your block.',
    ]);
  } });
}

function paintLapBoard(ctx, w, h, names) {
  ctx.fillStyle = '#1f3a3b'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#e3aa3a'; ctx.lineWidth = 6; ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.fillStyle = '#efe6d2'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = "600 46px 'Barlow Condensed', sans-serif"; ctx.fillText('THE OVAL  ·  HALF-G LAP', w / 2, 52);
  ctx.fillStyle = '#e3aa3a'; ctx.font = "500 22px 'Barlow Condensed', sans-serif"; ctx.fillText('400 METRES OF LANE ONE  ·  INFIELD ON YOUR LEFT  ·  HEAVY BEND FIRST', w / 2, 92);
  const rows = [['OPEN', 'Ada Mensah-Lind', names[0], '0:52.4'], ['HEAVY LAST', 'Teodor Kaye', names[1], '0:54.1'], ['OVER NINETY', 'Rosa Ilunga', names[2], '2:41.0'], ['UNDER EIGHT', 'Pim Achterberg', names[3], '1:58.6'], ['RELAY, 4 x 400', names[4], 'block team', '3:39.8']];
  ctx.textBaseline = 'alphabetic';
  rows.forEach((rw, i) => {
    const y = 150 + i * 52;
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; if (i % 2 === 0) ctx.fillRect(28, y - 34, w - 56, 46);
    ctx.textAlign = 'left'; ctx.fillStyle = '#e3aa3a'; ctx.font = "600 24px 'Barlow Condensed', sans-serif"; ctx.fillText(rw[0], 40, y);
    ctx.fillStyle = '#efe6d2'; ctx.font = "500 28px 'Barlow', sans-serif"; ctx.fillText(rw[1], 230, y);
    ctx.fillStyle = '#b9cfc8'; ctx.font = "italic 400 24px 'Cormorant Garamond', serif"; ctx.fillText(rw[2], 560, y);
    ctx.textAlign = 'right'; ctx.fillStyle = '#ffffff'; ctx.font = "600 34px 'Barlow Condensed', sans-serif"; ctx.fillText(rw[3], w - 40, y);
  });
  ctx.textAlign = 'center'; ctx.fillStyle = '#efe6d2'; ctx.font = "500 21px 'Barlow Condensed', sans-serif";
  ctx.fillText('THE KETTLE: A FIFTH HEAVIER AT 8.2 M/S   ·   THE LID: 18 PER CENT LIGHTER   ·   THE LAMP FALLS 1.2 M IN 0.70 S', w / 2, h - 34);
}

// ===================================================================================================================
// The start lamp: a lamp on a carriage at the top of a slotted mast. Set, it lights; at the start it drops 1.2 m down
// the slot into a sprung cup, in 0.70 s at this weight (half a second on the decks), and the runners go when it falls.
// ===================================================================================================================
function buildStartLamp(game, s, f) {
  const g = s.g, [mx, mz] = MAST, y0 = groundY(mx, mz), TOP = 3.25, DROP = 1.2;
  s.furniture(() => {
    g.mat('paint', C.indigo); g.box(mx - 0.07, y0 - 0.3, mz - 0.11, mx + 0.07, y0 + 3.6, mz - 0.05, { bevel: 0.01 }); g.box(mx - 0.07, y0 - 0.3, mz + 0.05, mx + 0.07, y0 + 3.6, mz + 0.11, { bevel: 0.01 });
    g.mat('cast', C.brass); g.box(mx - 0.09, y0 + 3.6, mz - 0.13, mx + 0.09, y0 + 3.68, mz + 0.13, { bevel: 0.01 });
    g.lathe(mx + 0.12, mz, [[0.0, y0 + TOP - DROP - 0.32], [0.13, y0 + TOP - DROP - 0.3], [0.15, y0 + TOP - DROP - 0.2], [0.12, y0 + TOP - DROP - 0.16], [0.0, y0 + TOP - DROP - 0.18]], { segs: 12 });
    g.mat('cast', C.iron); g.box(mx - 0.25, y0 - 0.05, mz - 0.3, mx + 0.25, y0 + 0.08, mz + 0.3, { bevel: 0.02 });
    g.tube([[mx + 0.02, y0 + TOP - DROP - 0.32, mz], [mx + 0.12, y0 + TOP - DROP - 0.34, mz]], 0.02, { segs: 4 });
    // the cord that hauls it back up, over a pulley
    g.mat('weave', '#d8cdb8'); g.tube([[mx - 0.02, y0 + 3.62, mz], [mx - 0.18, y0 + 3.55, mz], [mx - 0.2, y0 + 1.0, mz], [mx - 0.08, y0 + 0.95, mz]], 0.008, { segs: 3, caps: false });
    g.mat('cast', C.brass); g.box(mx - 0.11, y0 + 0.92, mz - 0.02, mx - 0.07, y0 + 1.0, mz + 0.02);
  });
  s.post(mx, mz, 0.16, y0, y0 + 3.6);
  sign(s, { kind: 'plate', text: 'START LAMP', lines: ['go when it drops'], palette: [C.cream, '#2b2a26', C.indigo] }, mx + 0.075, y0 + 1.5, mz, { face: 'X', w: 0.42, h: 0.18 });
  // the carriage and its lamp, as two little meshes that move: one dark, one lit
  const mk = (lit) => {
    const gg = new Geo(new MeshBuf(512, 1024));
    gg.mat('cast', C.dark); gg.box(0.0, -0.1, -0.06, 0.08, 0.1, 0.06, { bevel: 0.01 });
    gg.mat('diffuser', lit ? '#ff9a4a' : '#7a5a40', lit ? { emissive: 7 } : { rough: 0.2 }); gg.ball(0.17, 0, 0, 0.11, 0.11, 0.11, { segs: 12, rings: 8 });
    gg.mat('cast', C.brass); gg.cyl(0.17, 0.1, 0, 0.06, 0.04, { segs: 8 }); gg.cyl(0.17, -0.14, 0, 0.05, 0.04, { segs: 8 });
    const mesh = new THREE.Mesh(gg.buf.toGeometry(), s.world.mats.opaque);
    const origin = [mx + 0.05, -500, mz];
    s.world.addRenderable(mesh, { frame: f, origin, center: [0.15, 0, 0], radius: 0.5, far: 400, caster: false, scope: s });
    s.meshes.push(mesh);
    return origin;
  };
  const dark = mk(false), lit = mk(true);
  const L = s.light({ at: [mx + 0.22, y0 + TOP, mz], color: '#ff9a50', power: 2.2, range: 6, radius: 0.1 }); L.on = false;
  const st = { y: TOP, lit: false, v: 0, falling: false, rest: 0 };
  const place = () => { const yy = y0 + st.y; dark[1] = st.lit ? -500 : yy; lit[1] = st.lit ? yy : -500; L.rho = f.rho(yy); L.on = st.lit; };
  place();
  let gmRef = null;
  s.interact({ x: mx + 0.6, y: y0 + 1.6, z: mz, radius: 1.8, prompt: 'Look at the start lamp', onUse: (gm) => say(gm, { name: 'The start lamp', colour: C.indigo }, [
    'Not a gun: a lamp on a carriage at the top of a slotted post. The starter lights it at “set” and lets it go, and you run when it falls.',
    'It drops 1.2 metres into a sprung brass cup. Here, at half a g, that takes 0.70 of a second: slow enough to watch. On Candlewick’s decks it would fall in half a second.',
    'The cup is set three centimetres anti of the slot’s line, because that is where a falling thing lands in a turning drum: the floor has moved on under it while it fell.',
  ]) });
  return {
    raise() { st.y = TOP; st.lit = false; st.falling = false; st.v = 0; place(); },
    light() { st.lit = true; place(); },
    drop(gm) { gmRef = gm; st.falling = true; st.v = 0; },
    reset() { st.y = TOP; st.lit = false; st.falling = false; st.rest = 0; place(); },
    update(dt) {
      if (st.falling) {
        st.v += HOLLOW_G * dt; st.y -= st.v * dt;
        if (st.y <= TOP - DROP) { st.y = TOP - DROP; st.falling = false; st.rest = 2.5; if (gmRef) sfx(gmRef, 'clunk', f, mx + 0.12, y0 + st.y, mz); }
        place();
      } else if (st.rest > 0) { st.rest -= dt; if (st.rest <= 0) { st.lit = false; st.y = TOP; place(); } }
    },
  };
}
