// Building blocks for places: floors, ceilings, walls with openings, stairs, lamps. Everything takes a Scope `s` and
// flat coordinates in that scope's frame (x spinward, y up, z back). Colours are sRGB hex.
import { hexLin, kelvin, clamp, rgb8, toHex } from '../core/util.js';

// ---------- floors and ceilings ----------
// A walkable floor: the top face at height y, plus what the feet need. o: { surf, slab (thickness drawn below, default 0), level, noCollide }
export function floor(s, x0, z0, x1, z1, y, mat, tint, o) {
  const g = s.g; g.mat(mat, tint, o && o.matOpts);
  const NX = Math.max(1, Math.ceil((x1 - x0) / 16)), NZ = Math.max(1, Math.ceil((z1 - z0) / 16));
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
    const a0 = x0 + (x1 - x0) * i / NX, a1 = x0 + (x1 - x0) * (i + 1) / NX, b0 = z0 + (z1 - z0) * j / NZ, b1 = z0 + (z1 - z0) * (j + 1) / NZ;
    g.box(a0, y - 0.02, b0, a1, y, b1, { faces: 'Y' });
    s.flush({ tier: 's', level: o && o.level });
  }
  if (!o || !o.noCollide) s.solid(x0, y - 0.5, z0, x1, y, z1, { surf: (o && o.surf) || SURF[mat] || 'stone' });
}
const SURF = { planks: 'wood', wood: 'wood', terrazzo: 'tile', tile: 'tile', mosaic: 'tile', pattern: 'tile', hex: 'tile', stone: 'stone', concrete: 'stone', deckplate: 'metal', panel: 'metal', brushed: 'metal', felt: 'felt', carpet: 'carpet', weave: 'carpet', rush: 'carpet', grass: 'grass', gravel: 'gravel', sand: 'sand', soil: 'gravel', speckle: 'tile' };
export function surfOf(mat) { return SURF[mat] || 'stone'; }

export function ceiling(s, x0, z0, x1, z1, y, mat, tint, o) {
  const g = s.g; g.mat(mat, tint, o && o.matOpts);
  const NX = Math.max(1, Math.ceil((x1 - x0) / 16)), NZ = Math.max(1, Math.ceil((z1 - z0) / 16));
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
    const a0 = x0 + (x1 - x0) * i / NX, a1 = x0 + (x1 - x0) * (i + 1) / NX, b0 = z0 + (z1 - z0) * j / NZ, b1 = z0 + (z1 - z0) * (j + 1) / NZ;
    g.box(a0, y, b0, a1, y + 0.02, b1, { faces: 'y' });
    s.flush({ tier: 's', level: o && o.level });
  }
  if (!o || !o.noCollide) s.solid(x0, y, z0, x1, y + 0.6, z1, { surf: 'stone' });
}

// ---------- walls ----------
// A straight wall from (ax, az) to (bx, bz), which must share x or z. y0 = foot, h = height, t = thickness (default 0.16).
// o: { mat, tint (both faces) | tintA / tintB (the two faces: A is the face toward +z for an x-run, toward +x for a z-run),
//      matA / matB, openings: [{ at, w, h, sill }] (at = distance along the wall to the opening's near edge), skirt: '#hex' | false,
//      cap (draw the top), level, noCollide, dado: { h, mat, tint } (a different finish up to height h) }
export function wall(s, ax, az, bx, bz, y0, h, o = {}) {
  const g = s.g, t = o.t || 0.16, alongX = Math.abs(bx - ax) > Math.abs(bz - az);
  const len = alongX ? Math.abs(bx - ax) : Math.abs(bz - az); if (len < 1e-4) return;
  const dir = alongX ? Math.sign(bx - ax) : Math.sign(bz - az);
  const mat = o.mat || 'plaster', tint = o.tint || '#e9dfcc';
  const ops = (o.openings || []).slice().sort((p, q) => p.at - q.at);
  // pieces along the wall: [u0, u1, yBottom, yTop]
  const pieces = []; let u = 0;
  for (const op of ops) {
    const sill = op.sill || 0;
    if (op.at > u + 1e-4) pieces.push([u, op.at, 0, h]);
    if (sill > 0) pieces.push([op.at, op.at + op.w, 0, sill]);
    if (sill + op.h < h - 1e-4) pieces.push([op.at, op.at + op.w, sill + op.h, h]);
    u = op.at + op.w;
  }
  if (u < len - 1e-4) pieces.push([u, len, 0, h]);
  const P = (uu, off) => alongX ? [ax + dir * uu, az + off] : [ax + off, az + dir * uu];
  for (const pc of pieces) {
    const p0 = P(pc[0], -t / 2), p1 = P(pc[1], t / 2);
    const x0 = Math.min(p0[0], p1[0]), x1 = Math.max(p0[0], p1[0]), z0 = Math.min(p0[1], p1[1]), z1 = Math.max(p0[1], p1[1]);
    const ya = y0 + pc[2], yb = y0 + pc[3];
    // the two long faces can differ; ends and tops/bottoms use face A's finish
    const fA = alongX ? 'Z' : 'X', fB = alongX ? 'z' : 'x', ends = alongX ? 'xX' : 'zZ';
    const dado = o.dado && pc[2] < o.dado.h ? Math.min(o.dado.h, pc[3]) : 0;
    const face = (faces, m, c) => {
      if (dado > 0) {
        g.mat(o.dado.mat || m, o.dado.tint || c); g.box(x0, ya, z0, x1, y0 + dado, z1, { faces, aoBottom: 0.72, aoTop: 1 });
        if (yb > y0 + dado) { g.mat(m, c); g.box(x0, y0 + dado, z0, x1, yb, z1, { faces }); }
      } else { g.mat(m, c); g.box(x0, ya, z0, x1, yb, z1, { faces, aoBottom: pc[2] === 0 ? 0.72 : 1, aoTop: 1 }); }
    };
    face(fA, o.matA || mat, o.tintA || tint);
    face(fB, o.matB || mat, o.tintB || tint);
    g.mat(o.matA || mat, o.tintA || tint); g.box(x0, ya, z0, x1, yb, z1, { faces: ends + (pc[2] > 0 ? 'y' : '') + (pc[3] < h || o.cap ? 'Y' : '') });
    s.flush({ tier: 's', level: o.level });
    if (!o.noCollide) s.solid(x0, ya, z0, x1, yb, z1, { surf: 'stone' });
  }
  // skirting boards on full-height pieces
  if (o.skirt !== false) {
    const sk = o.skirt || '#5b4636';
    g.mat('wood', sk, { rough: -0.05 });
    for (const pc of pieces) {
      if (pc[2] > 0) continue;
      for (const side of [-1, 1]) {
        const p0 = P(pc[0], side * (t / 2)), p1 = P(pc[1], side * (t / 2 + 0.018));
        g.box(Math.min(p0[0], p1[0]), y0, Math.min(p0[1], p1[1]), Math.max(p0[0], p1[0]), y0 + 0.11, Math.max(p0[1], p1[1]), { faces: alongX ? (side > 0 ? 'ZY' : 'zY') + 'xX' : (side > 0 ? 'XY' : 'xY') + 'zZ' });
      }
    }
    s.flush({ tier: 'd', level: o.level });
  }
}

// A plain solid block that is drawn and collides: plinths, counters, steps.
export function block(s, x0, y0, z0, x1, y1, z1, mat, tint, o) {
  s.g.mat(mat, tint, o && o.matOpts); s.g.box(x0, y0, z0, x1, y1, z1, { bevel: o && o.bevel, aoBottom: o && o.aoBottom !== undefined ? o.aoBottom : 0.7, faces: o && o.faces });
  s.flush({ tier: (o && o.tier) || 's', cast: !o || o.cast !== false, level: o && o.level });
  if (!o || !o.noCollide) s.solid(x0, y0, z0, x1, y1, z1, { surf: (o && o.surf) || surfOf(mat) });
}

// Stairs rising from (x, y, z) along +x/-x/+z/-z ('X' | 'x' | 'Z' | 'z'), `rise` metres over `run` metres, `width` across.
export function stairs(s, x, y, z, dir, rise, run, width, o = {}) {
  const g = s.g, n = Math.max(2, Math.round(rise / 0.17)), sr = rise / n, st = run / n;
  const mat = o.mat || 'stone', tint = o.tint || '#b9b0a2';
  const ax = dir === 'X' || dir === 'x', sg = dir === 'X' || dir === 'Z' ? 1 : -1;
  for (let i = 0; i < n; i++) {
    const u0 = i * st, u1 = (i + 1) * st, yt = y + (i + 1) * sr;
    g.mat(mat, tint);
    if (ax) g.box(x + sg * u0, y, z - width / 2, x + sg * u1, yt, z + width / 2, { faces: (sg > 0 ? 'x' : 'X') + 'YzZ', aoBottom: 0.8 });
    else g.box(x - width / 2, y, z + sg * u0, x + width / 2, yt, z + sg * u1, { faces: (sg > 0 ? 'z' : 'Z') + 'YxX', aoBottom: 0.8 });
    // a darker nosing strip
    g.mat(mat, o.nosing || '#6e6558');
    if (ax) g.box(x + sg * u0 - sg * 0.01, yt - 0.03, z - width / 2, x + sg * u0 + sg * 0.04, yt + 0.002, z + width / 2, { faces: 'Y' + (sg > 0 ? 'x' : 'X') });
    else g.box(x - width / 2, yt - 0.03, z + sg * u0 - sg * 0.01, x + width / 2, yt + 0.002, z + sg * u0 + sg * 0.04, { faces: 'Y' + (sg > 0 ? 'z' : 'Z') });
  }
  s.flush({ tier: 's', cast: true, level: o.level });
  if (ax) s.ramp(Math.min(x, x + sg * run), z - width / 2, Math.max(x, x + sg * run), z + width / 2, sg > 0 ? y : y + rise, sg > 0 ? y + rise : y, 'x', { surf: surfOf(mat) });
  else s.ramp(x - width / 2, Math.min(z, z + sg * run), x + width / 2, Math.max(z, z + sg * run), sg > 0 ? y : y + rise, sg > 0 ? y + rise : y, 'z', { surf: surfOf(mat) });
}

// ---------- lamps ----------
// Warm white by colour temperature, as a linear rgb triple.
export function warm(K = 2900) { return kelvin(K); }

// lamp(s, kind, x, y, z, o): draws the fitting and adds its light(s).
//   kind: 'panel' (flat ceiling panel, o.w x o.d) · 'strip' (a line of light from (x,y,z) to o.to) · 'globe' (pendant ball on a cord from o.drop above)
//         · 'sconce' (wall light; o.face: 'x' | 'X' | 'z' | 'Z' the way it shines) · 'lantern' (hanging cloth lantern, o.tint) · 'spot' (recessed downlight)
//         · 'pole' (a street lamp standing on the floor, o.h) · 'bulb' (bare light, no fitting)
//   o: { K (kelvin) | color, power (default 1 = one ordinary lamp), range, clip: [x0,y0,z0,x1,y1,z1] (the room), level, lampFlag (default true: dims in the lamp-night), night, fill (default true) }
export function lamp(s, kind, x, y, z, o = {}) {
  const g = s.g, col = o.color ? (typeof o.color === 'string' ? hexLin(o.color) : o.color) : warm(o.K || 2900);
  const P = o.power === undefined ? 1 : o.power, lampFlag = o.lampFlag !== false;
  const hex = toHex(Math.pow(col[0], 1 / 2.2) * 255, Math.pow(col[1], 1 / 2.2) * 255, Math.pow(col[2], 1 / 2.2) * 255);
  const em = { emissive: (o.glow || 5) * Math.sqrt(P), lamp: lampFlag, night: !!o.night };
  const common = { color: col, clip: o.clip, lamp: lampFlag, night: !!o.night, soft: o.soft };
  let range = o.range;
  if (kind === 'panel') {
    const w = o.w || 1.2, d = o.d || 0.6;
    g.mat('brushed', '#8d8478'); g.box(x - w / 2 - 0.03, y - 0.035, z - d / 2 - 0.03, x + w / 2 + 0.03, y, z + d / 2 + 0.03, { faces: 'xXzZy' });
    g.mat('diffuser', hex, em); g.box(x - w / 2, y - 0.04, z - d / 2, x + w / 2, y - 0.03, z + d / 2, { faces: 'y' });
    s.flush({ tier: 's', level: o.level });
    range = range || 9;
    if (w > 1.6 || d > 1.6) {
      const along = w >= d; const hl = (Math.max(w, d) - Math.min(w, d)) / 2;
      s.light(Object.assign({ at: along ? [x - hl, y - 0.12, z] : [x, y - 0.12, z - hl], to: along ? [x + hl, y - 0.12, z] : [x, y - 0.12, z + hl], type: 'tube', power: 9 * P, range, shadow: true, radius: Math.min(w, d) * 0.5 }, common));
    } else s.light(Object.assign({ at: [x, y - 0.12, z], power: 9 * P, range, shadow: true, radius: 0.3 }, common));
  } else if (kind === 'strip') {
    const to = o.to; g.mat('diffuser', hex, em);
    g.box(Math.min(x, to[0]) - 0.025, y - 0.03, Math.min(z, to[2]) - 0.025, Math.max(x, to[0]) + 0.025, y, Math.max(z, to[2]) + 0.025, { faces: 'yxXzZ' });
    s.flush({ tier: 's', level: o.level });
    s.light(Object.assign({ at: [x, y - 0.08, z], to: [to[0], to[1] - 0.08, to[2]], type: 'tube', power: 5 * P, range: range || 7, shadow: true, radius: 0.12 }, common));
  } else if (kind === 'globe') {
    const r = o.r || 0.16, drop = o.drop || 0.6;
    g.mat('brushed', '#5a5046'); g.tube([[x, y + drop, z], [x, y + r, z]], 0.006, { segs: 4, caps: false });
    g.cyl(x, y + r - 0.01, z, r * 0.3, 0.05, { segs: 8 });
    g.mat('diffuser', hex, em); g.ball(x, y, z, r, r, r, { segs: 14, rings: 9 });
    s.flush({ tier: 'd', level: o.level });
    s.light(Object.assign({ at: [x, y, z], power: 5 * P, range: range || 7, shadow: true, radius: r }, common));
  } else if (kind === 'sconce') {
    const f = o.face || 'Z'; const nx = f === 'X' ? 1 : f === 'x' ? -1 : 0, nz = f === 'Z' ? 1 : f === 'z' ? -1 : 0;
    g.mat('cast', '#8a6d3b'); g.cube(x + nx * 0.02, y, z + nz * 0.02, nx ? 0.04 : 0.12, 0.2, nz ? 0.04 : 0.12, { bevel: 0.008 });
    g.mat('diffuser', hex, em); g.ball(x + nx * 0.1, y + 0.02, z + nz * 0.1, 0.075, 0.1, 0.075, { segs: 10, rings: 7 });
    s.flush({ tier: 'd', level: o.level });
    s.light(Object.assign({ at: [x + nx * 0.14, y + 0.02, z + nz * 0.14], power: 2.6 * P, range: range || 5, radius: 0.09 }, common));
  } else if (kind === 'lantern') {
    const r = o.r || 0.2, hh = o.hh || 0.3, drop = o.drop || 0.5; const t = o.tint || '#f2b56b';
    g.mat('brushed', '#4a4038'); g.tube([[x, y + hh / 2 + drop, z], [x, y + hh / 2, z]], 0.005, { segs: 4, caps: false });
    g.mat('paper', t, { emissive: (o.glow || 2.2) * Math.sqrt(P), lamp: lampFlag, night: !!o.night });
    g.lathe(x, z, [[r * 0.35, y - hh / 2], [r * 0.85, y - hh * 0.3], [r, y], [r * 0.85, y + hh * 0.3], [r * 0.35, y + hh / 2]], { segs: 12 });
    g.mat('wood', '#3b2a1e'); g.cyl(x, y + hh / 2, z, r * 0.36, 0.03, { segs: 10 }); g.cyl(x, y - hh / 2 - 0.03, z, r * 0.36, 0.03, { segs: 10 });
    s.flush({ tier: 'd', level: o.level });
    const lc = hexLin(t);
    s.light(Object.assign({}, common, { at: [x, y, z], color: [lc[0] * 0.7 + col[0] * 0.3, lc[1] * 0.7 + col[1] * 0.3, lc[2] * 0.7 + col[2] * 0.3], power: 3.4 * P, range: range || 6, radius: r }));
  } else if (kind === 'spot') {
    g.mat('brushed', '#7a7268'); g.cyl(x, y - 0.03, z, 0.07, 0.03, { segs: 10 });
    g.mat('diffuser', hex, em); g.cyl(x, y - 0.034, z, 0.05, 0.004, { segs: 10 });
    s.flush({ tier: 'd', level: o.level });
    s.light(Object.assign({ at: [x, y - 0.06, z], type: 'spot', dir: o.dir || [0, -1, 0], cone: o.cone || [50, 22], power: 12 * P, range: range || 7, shadow: true }, common));
  } else if (kind === 'pole') {
    const h = o.h || 3.2;
    g.mat('cast', o.metal || '#2f3a36'); g.lathe(x, z, [[0.09, y], [0.07, y + 0.12], [0.035, y + 0.3], [0.028, y + h - 0.25], [0.05, y + h - 0.2]], { segs: 8 });
    g.mat('diffuser', hex, em); g.ball(x, y + h, z, 0.17, 0.2, 0.17, { segs: 12, rings: 8 });
    g.mat('cast', o.metal || '#2f3a36'); g.cyl(x, y + h + 0.17, z, 0.1, 0.03, { segs: 8, r1: 0.02 });
    s.flush({ tier: 's', cast: true, level: o.level });
    s.post(x, z, 0.09, y, y + h);
    s.light(Object.assign({ at: [x, y + h, z], power: 7 * P, range: range || 11, shadow: true, radius: 0.17 }, common));
  } else {
    s.light(Object.assign({ at: [x, y, z], power: 5 * P, range: range || 7, radius: 0.1 }, common));
  }
}

// The soft light a room gets from its own surfaces: call once per room.
// o: { box: [x0,y0,z0,x1,y1,z1], sky: '#hex' (what the ceiling and lamps give), ground: '#hex' (what bounces off the floor), power, lamp }
export function roomGlow(s, x0, y0, z0, x1, y1, z1, o = {}) {
  return s.ambient({ box: [x0, y0, z0, x1, y1, z1], sky: o.sky || '#ffdcae', ground: o.ground || '#c9a57c', power: o.power === undefined ? 0.26 : o.power, lamp: o.lamp !== false, soft: o.soft || 0.2, spec: o.spec === undefined ? 0.5 : o.spec, groundK: o.groundK });
}
