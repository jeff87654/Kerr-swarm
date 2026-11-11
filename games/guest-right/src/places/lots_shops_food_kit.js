// Shared parts for the generated food shops (shop.baker, greens, larder, herbs, noodles, tea) and the laundry.
// A lot arrives mirrored and turned from block to block. frameOf(lot) gives a turned (never mirrored) local frame whose
// origin is the middle of the front line: x runs along the front (-W/2 .. W/2), z (called q here) runs inward from the
// front line (0 .. D). Draw in it with F.draw(s, 'furniture', (g) => ...), place props with F.prop(...), and every
// asymmetric thing stays the right way round in every block.
// Props here are named shops-food.* and drawn cheaply: a shop has 25,000 triangles for everything.
import { room, shopfront } from '../world/kit2.js';
import { lamp } from '../world/kit.js';
import { prop, defineProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { orient, say, note } from '../city/lots.js';
import { LOT_H } from '../city/plan.js';
import { Rng, shadeHex, mixHex, hashStr } from '../core/util.js';
import { GIVEN } from '../content/city.js';
import { foodParts } from './food_parts.js';

export const shopsFoodKit = foodParts;
export const CRUMB = '#ecd9ad';
export const LINEN = '#efe7d6';
export const BRASS = '#b08a45';

// ---------------------------------------------------------------------------------------------------------------
// The local frame
// ---------------------------------------------------------------------------------------------------------------
export function frameOf(lot) {
  const o = orient(lot), th = o.yawIn, cs = Math.cos(th), sn = Math.sin(th), W = o.W, D = o.D;
  const c = o.P(W / 2, 0), Cx = c[0], Cz = c[1];
  const L = (lx, q) => [Cx + cs * lx + sn * q, Cz - sn * lx + cs * q];
  const F = {
    o, W, D, hw: W / 2, iw: W / 2 - 0.16, bq: D - 0.16, th, L, H: LOT_H, Cx, Cz,
    // a local yaw: 0 faces inward (toward the back wall), PI faces the street, PI/2 faces +x
    yaw: (ly) => th + (ly || 0),
    face(ly) { const a = th + ly, dx = Math.sin(a), dz = Math.cos(a); return Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'X' : 'x') : (dz > 0 ? 'Z' : 'z'); },
    box(lx0, q0, lx1, q1) { const a = L(lx0, q0), b = L(lx1, q1); return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])]; },
    clip(lx0, y0, q0, lx1, y1, q1) { const b = F.box(lx0, q0, lx1, q1); return [b[0], y0, b[1], b[2], y1, b[3]]; },
    solid(s, lx0, y0, q0, lx1, y1, q1) { const b = F.box(lx0, q0, lx1, q1); s.solid(b[0], y0, b[1], b[2], y1, b[3]); },
    draw(s, kind, fn) { s[kind]((g) => { g.at(Cx, 0, Cz, th); try { fn(g); } finally { g.pop(); } }); },
    prop(s, name, lx, y, q, ly, p, opt) { const w = L(lx, q); return prop(s, name, w[0], y, w[1], th + (ly || 0), p || {}, opt); },
    spot(s, type, lx, y, q, ly, opt) { const w = L(lx, q); return s.spot(type, w[0], y, w[1], th + (ly || 0), opt); },
    lamp(s, kind, lx, y, q, opt) { const w = L(lx, q); return lamp(s, kind, w[0], y, w[1], opt); },
    light(s, lx, y, q, opt) { const w = L(lx, q); const o2 = Object.assign({}, opt, { at: [w[0], y, w[1]] }); if (opt.to) { const t = L(opt.to[0], opt.to[2]); o2.to = [t[0], opt.to[1], t[1]]; } return s.light(o2); },
    signMs: 0,
    sign(s, spec, lx, y, q, ly, opt) { const w = L(lx, q), t = performance.now(); const R = sign(s, spec, w[0], y, w[1], Object.assign({ face: F.face(ly) }, opt)); F.signMs += performance.now() - t; return R; },
    path(s, pts, opt) { s.path(pts.map((p) => L(p[0], p[1])), opt); },
    interact(s, lx, y, q, o2) { const w = L(lx, q); return s.interact(Object.assign({ x: w[0], y, z: w[1] }, o2)); },
    // where the player stands and looks, from a local position and a local yaw the player should face
    // (the player's yaw runs the other way round from a prop's: a player at yaw a looks the way a prop at PI - a faces)
    sit(game, lx, y, q, ly) { const w = L(lx, q); if (game.player && game.player.sit) { game.player.sit({ x: w[0], y, z: w[1], yaw: th + ly }); game.player.yaw = Math.PI - (th + ly); } },
  };
  return F;
}

// ---------------------------------------------------------------------------------------------------------------
// The shell: floor, ceiling, walls with a dado, the glazed front with the shop's fascia, pilasters, beams, felt, a pipe
// o: { floor, ceil, wall, wallMat, dado, skirt, frame, plinth, awning: [..], sign: [..], emblem, door, doorLx, beam, felt: [..],
//      pipe, rail, glow: { sky, ground, power }, awningOn }
// Returns { clip, spill, doorLx, beds: [[lx0, lx1], ...] (window spans either side of the door) }
// ---------------------------------------------------------------------------------------------------------------
export function shell(s, F, lot, o) {
  const H = F.H, iw = F.iw, D = F.D;
  const backSide = { n: 's', s: 'n', w: 'e', e: 'w' }[lot.front], backKey = 'wall' + backSide.toUpperCase();
  room(s, { x0: lot.x0, z0: lot.z0, x1: lot.x1, z1: lot.z1, y: 0, h: H, floor: o.floor, ceil: o.ceil || ['paint', '#efe6d6'],
    wall: { tint: o.wall, mat: o.wallMat, dado: o.dado, skirt: o.skirt }, [backKey]: o.backWall || {}, open: { [lot.front]: false }, glow: o.glow || { sky: '#ffe2b8', ground: '#b88c64', power: 0.35 } });
  // a painted frieze under the ceiling on the three walls
  if (o.frieze) F.draw(s, 'deco', (g) => { g.mat('paint', o.frieze); g.box(-iw, H - 0.2, 0.3, -iw + 0.006, H - 0.02, D - 0.16, { faces: 'X' }); g.box(iw - 0.006, H - 0.2, 0.3, iw, H - 0.02, D - 0.16, { faces: 'x' }); g.box(-iw, H - 0.2, D - 0.166, iw, H - 0.02, D - 0.16, { faces: 'z' }); });
  const dw = 1.1, a0 = F.o.a0 + 0.25, a1 = F.o.a1 - 0.25, dc = F.L(o.doorLx, 0), ac = F.o.alongX ? dc[0] : dc[1];
  const at = Math.max(0.35, Math.min(a1 - a0 - dw - 0.35, ac - dw / 2 - a0));
  const dCen = a0 + at + dw / 2, back = F.o.alongX ? F.L(0, 0)[0] : F.L(0, 0)[1], dirA = F.o.alongX ? (F.L(1, 0)[0] - back) : (F.L(1, 0)[1] - back);
  const doorLx = (dCen - (F.o.alongX ? F.Cx : F.Cz)) * Math.sign(dirA);
  shopfront(s, { side: lot.front, a0, a1, c: F.o.c, y: 0, h: H, fascia: { text: lot.name, sub: lot.sub, palette: o.sign, emblem: o.emblem },
    palette: { frame: o.frame, plinth: o.plinth, awning: o.awning }, door: { kind: 'slide', at, w: dw, tint: o.door || o.frame },
    awning: lot.onCourt ? false : (o.awningOn ? { depth: 1.0 } : false), plinth: o.plinthH, glow: 0.7, lights: false });
  // pilasters at both ends of the front, with a base and a capital
  F.draw(s, 'structure', (g) => {
    for (const sg of [-1, 1]) {
      const x0 = sg < 0 ? -F.hw : F.hw - 0.25, x1 = sg < 0 ? -F.hw + 0.25 : F.hw;
      g.mat('paint', o.frame, { rough: -0.05 }); g.box(x0, 0, -0.12, x1, H, 0.12, { faces: 'xXzZ' });
      g.mat('paint', shadeHex(o.frame, 0.7)); g.box(x0 - 0.01, 0, -0.15, x1 + 0.01, 0.3, 0.13, { faces: 'xXzZY' });
      g.mat('paint', shadeHex(o.frame, 1.25)); g.box(x0 - 0.015, H - 0.62, -0.15, x1 + 0.015, H - 0.55, 0.13, { faces: 'xXzZyY' });
    }
  });
  F.solid(s, -F.hw, 0, -0.12, -F.hw + 0.25, H, 0.12); F.solid(s, F.hw - 0.25, 0, -0.12, F.hw, H, 0.12);
  // beams across, a wall plate each side, the loop pipe along one side, felt baffles in the shop's colours
  F.draw(s, 'structure', (g) => {
    g.mat('wood', o.beam || '#6a4a30', { rough: -0.05 });
    const n = Math.max(2, Math.round((D - 1.2) / 1.9));
    for (let i = 0; i <= n; i++) { const q = 0.6 + i * (D - 1.2) / n; g.box(-iw, H - 0.16, q - 0.07, iw, H, q + 0.07, { faces: 'xXyzZ' }); }
    g.box(-iw, H - 0.1, 0.2, -iw + 0.1, H, D - 0.16, { faces: 'Xyz' }); g.box(iw - 0.1, H - 0.1, 0.2, iw, H, D - 0.16, { faces: 'xyz' });
  });
  const ps = o.pipeSide || 1, px = ps * (iw - 0.22);
  F.draw(s, 'deco', (g) => {
    g.mat('cast', o.pipe || '#c47a45', { rough: -0.2 }); g.tube([[px, H - 0.3, 0.3], [px, H - 0.3, D - 0.3], [px, 0.3, D - 0.3]], 0.026, { segs: 6, caps: false });
    g.mat('felt', '#3a5f9f'); g.tube([[px + ps * 0.1, H - 0.3, 0.3], [px + ps * 0.1, H - 0.3, D - 0.25]], 0.042, { segs: 6, caps: false });
    g.mat('cast', '#c8a45a'); for (let q = 1.0; q < D - 0.5; q += 1.6) g.tube([[px + ps * 0.1, H - 0.3, q - 0.025], [px + ps * 0.1, H - 0.3, q + 0.025]], 0.05, { segs: 6 });
    // picture rail round the sides and back
    g.mat('wood', o.rail || shadeHex(o.beam || '#6a4a30', 0.85));
    g.box(-iw, 2.3, 0.3, -iw + 0.03, 2.35, D - 0.16, { faces: 'XyYz' }); g.box(iw - 0.03, 2.3, 0.3, iw, 2.35, D - 0.16, { faces: 'xyYz' });
    g.box(-iw, 2.3, D - 0.19, iw, 2.35, D - 0.16, { faces: 'zyY' });
    const felt = o.felt || ['#c9552e', '#d9a548'];
    const nb = Math.max(2, Math.round((D - 3) / 2.2));
    for (let i = 0; i < nb; i++) {
      const q = 1.5 + i * (D - 3.6) / Math.max(1, nb - 1);
      for (const half of [0, 1]) {
        const xa = half ? 0.15 : -iw + 0.35, xb = half ? iw - 0.35 : -0.15;
        g.mat('felt', felt[(i + half) % felt.length]); g.sheet([xa, H - 0.17, q], [xb, H - 0.17, q], [xb, H - 0.36, q], [xa, H - 0.36, q], { nu: 5, nv: 1, ripple: 0.008, rippleN: 4 });
      }
    }
  });
  const beds = [], dl0 = doorLx - dw / 2 - 0.12, dl1 = doorLx + dw / 2 + 0.12;
  if (dl0 - (-iw + 0.1) > 0.8) beds.push([-iw + 0.1, dl0]);
  if (iw - 0.1 - dl1 > 0.8) beds.push([dl1, iw - 0.1]);
  return { clip: F.clip(-F.hw - 0.05, -0.2, -0.05, F.hw + 0.05, H + 0.1, D + 0.05), spill: F.clip(-F.hw - 0.05, -0.2, -2.4, F.hw + 0.05, H + 0.1, D + 0.05), doorLx, beds };
}

// A plate rail along a side wall (side -1 or 1) from q0 to q1 at height y: a moulded shelf with glazed plates standing on it
// and a jug or two. o: { wood, glazes: [..], seed }
export function plateRail(s, F, side, q0, q1, y, o) {
  const x = side * F.iw, rng = new Rng(o.seed || 1), G = o.glazes || ['#e9e2d0', '#3d6f8a', '#a3563a', '#d9c7a6', '#6b7a3a', '#c9552e'];
  F.draw(s, 'deco', (g) => {
    g.mat('wood', o.wood || '#6a4a30'); g.box(Math.min(x, x - side * 0.14), y - 0.03, q0, Math.max(x, x - side * 0.14), y, q1, { faces: 'yYxXzZ' });
    g.box(Math.min(x, x - side * 0.02), y - 0.1, q0, Math.max(x, x - side * 0.02), y - 0.03, q1, { faces: side > 0 ? 'x' : 'X' });
    let q = q0 + 0.14;
    while (q < q1 - 0.12) {
      if (rng.chance(0.18)) { crockL(g, x - side * 0.08, y, q, 0.055, 0.17, rng.pick(G), 'none'); q += 0.15; continue; }
      const r = rng.f(0.09, 0.13); g.push(); g.move(x - side * 0.05, y + r, q); g.rotZ(Math.PI / 2 + side * 0.2); g.mat('glaze', rng.pick(G), { rough: -0.3 }); g.cyl(0, -0.008, 0, r, 0.016, { segs: 10 }); g.pop();
      q += r * 2 + 0.03;
    }
  });
}

// The counter across the shop at depth qc, with a gap of `gap` at the gs end (-1 or 1) for the keeper to come through.
// o: { qc, gs, gap, h, d, look: counter prop params }. Returns where everything is.
export function counterAcross(s, F, o) {
  const iw = F.iw, gap = o.gap || 0.9, gs = o.gs, CT = o.h || 0.92, cd = o.d || 0.64, qc = o.qc;
  const c0 = gs < 0 ? -iw + gap : -iw, c1 = gs < 0 ? iw : iw - gap, cm = (c0 + c1) / 2, cw = c1 - c0;
  F.prop(s, 'shops-food.counter', cm, 0, qc, Math.PI, Object.assign({ w: +cw.toFixed(2), d: cd, h: CT }, o.look));
  return { qc, c0, c1, cm, cw, CT, cd, gs, gx: gs * (iw - gap / 2), wallEnd: gs < 0 ? c1 : c0, gapEnd: gs < 0 ? c0 : c1 };
}
// Walkways for a shop with a counter: in at the door, up to the counter, round through the gap to the keeper and on to work.
export function shopPaths(s, F, C, doorLx, servLx, keepLx, workPts, aisleLx) {
  const ax = aisleLx === undefined ? doorLx : aisleLx;
  F.path(s, [[doorLx, -0.7], [doorLx, 1.2], [ax, 2.0], [ax, C.qc - 1.3], [servLx, C.qc - 0.85]], { width: 1.1 });
  F.path(s, [[servLx, C.qc - 0.85], [C.gx, C.qc - 0.85], [C.gx, C.qc + 0.75], [keepLx, C.qc + 0.72]].concat(workPts || []), { width: 0.8 });
}
// Queue spots back from the counter toward the door.
export function queueSpots(s, F, C, x0, x1, tags, n) {
  for (let k = 1; k <= (n || 3); k++) { const q = C.qc - 0.85 - k * 0.72; if (q < 1.3) break; const t = k / ((n || 3) + 1); F.spot(s, 'queue', x0 + (x1 - x0) * t, 0, q, 0, { tags }); }
}

// A low window bed behind the glass, painted, with a cloth on top and a valance toward the street. Returns its top y.
export function windowBed(s, F, l0, l1, o) {
  const y = o.y || 0.5;
  F.draw(s, 'furniture', (g) => {
    g.mat('paint', o.body, { rough: -0.05 }); g.box(l0, 0, 0.2, l1, y, 0.78, { faces: 'xXzZY' });
    g.mat('weave', o.cloth || LINEN); g.box(l0 + 0.01, y, 0.21, l1 - 0.01, y + 0.006, 0.77, { faces: 'Y' });
    g.mat('weave', o.valance || o.body); g.sheet([l0 + 0.01, y + 0.004, 0.19], [l1 - 0.01, y + 0.004, 0.19], [l1 - 0.01, y - 0.13, 0.18], [l0 + 0.01, y - 0.13, 0.18], { nu: 6, nv: 1, ripple: 0.006, rippleN: 7 });
  });
  F.solid(s, l0, 0, 0.2, l1, y, 0.78);
  return y + 0.006;
}

// ---------------------------------------------------------------------------------------------------------------
// Low-cost food and things, drawn into a Geo at a point
// ---------------------------------------------------------------------------------------------------------------
export function loafL(g, x, y, z, kind, crust, yaw) {
  if (kind === 'batard') {
    g.push(); g.move(x, y, z); if (yaw) g.rotY(yaw);
    g.mat('plaster', crust, { rough: 0.1 }); g.ball(0, 0.0195, 0, 0.15, 0.065, 0.072, { segs: 8, rings: 4, bottom: -0.3 });
    g.mat('plain', CRUMB, { rough: 0.25 }); g.box(-0.05, 0.078, -0.006, 0.05, 0.083, 0.006, { faces: 'Y' });
    g.pop();
  } else if (kind === 'tin') {
    g.mat('plaster', shadeHex(crust, 1.12), { rough: 0.1 }); g.box(x - 0.1, y, z - 0.058, x + 0.1, y + 0.072, z + 0.058, { faces: 'xXzZ' });
    g.mat('plaster', crust, { rough: 0.05 }); g.ball(x, y + 0.07, z, 0.108, 0.048, 0.064, { segs: 8, rings: 2, bottom: 0 });
  } else if (kind === 'roll' || kind === 'bun') {
    g.mat(kind === 'bun' ? 'plain' : 'plaster', crust, { rough: kind === 'bun' ? -0.25 : 0.1 }); g.ball(x, y + 0.012, z, 0.042, 0.036, 0.042, { segs: 6, rings: 3, bottom: -0.3 });
  } else {
    g.mat('plaster', crust, { rough: 0.1 }); g.ball(x, y + 0.0225, z, 0.1, 0.075, 0.1, { segs: 8, rings: 4, bottom: -0.3 });
    g.mat('plain', '#f3ecd8', { rough: 0.3 }); g.ball(x, y + 0.093, z, 0.05, 0.006, 0.05, { segs: 6, rings: 1, bottom: 0 });
  }
}
// a cane basket with a linen liner and a row or two of bread in it, optionally under a cloth. fill: 'boule' | 'batard' | 'roll' | 'bun' | 'tin'
export function basketL(g, x, y, z, w, d, fill, o) {
  o = o || {}; const h = o.h || 0.11, top = y + h - 0.025;
  g.mat('cane', o.cane || '#b48a52'); g.box(x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2, { faces: 'xXzZ' });
  g.mat('weave', o.liner || LINEN); g.box(x - w / 2 + 0.012, top - 0.005, z - d / 2 + 0.012, x + w / 2 - 0.012, top, z + d / 2 - 0.012, { faces: 'Y' });
  const st = fill === 'boule' ? [0.21, 0.21] : fill === 'batard' ? [0.3, 0.15] : fill === 'tin' ? [0.22, 0.13] : [0.09, 0.09];
  const nx = Math.max(1, Math.floor((w - 0.03) / st[0])), nz = Math.max(1, Math.floor((d - 0.03) / st[1]));
  const cr = o.crust || ['#b8763a', '#a8662e', '#c08446'];
  if (!o.cover) for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) loafL(g, x - w / 2 + (i + 0.5) * w / nx, top, z - d / 2 + (j + 0.5) * d / nz, fill, cr[(i + j) % cr.length], fill === 'batard' ? Math.PI / 2 : 0);
  if (o.cover) { g.mat('weave', o.cover, { rough: 0.1 }); g.ball(x, top + 0.02, z, w * 0.5, fill === 'boule' || fill === 'batard' ? 0.085 : 0.05, d * 0.5, { segs: 10, rings: 3, bottom: 0 }); }
}
export function crockL(g, x, y, z, r, h, glaze, lid, cloth) {
  g.mat('glaze', glaze, { rough: -0.15 });
  const sg = r > 0.1 ? 8 : 7;
  g.lathe(x, z, [[r * 0.82, y], [r * 1.0, y + h * 0.2], [r * 0.98, y + h * 0.7], [r * 0.78, y + h * 0.9]], { segs: sg, capTop: lid === 'none', capBottom: false });
  if (lid === 'cloth') { g.mat('weave', cloth || LINEN); g.ball(x, y + h * 0.88, z, r * 0.86, h * 0.1, r * 0.86, { segs: sg, rings: 1, bottom: 0 }); }
  else if (lid === 'wood') { g.mat('wood', '#7a5636'); g.cyl(x, y + h * 0.88, z, r * 0.84, 0.022, { segs: sg, capBottom: false }); }
  else if (lid !== 'none') { g.mat('glaze', shadeHex(glaze, 1.2), { rough: -0.15 }); g.lathe(x, z, [[r * 0.8, y + h * 0.88], [r * 0.25, y + h * 1.0], [r * 0.18, y + h * 1.06], [0, y + h * 1.06]], { segs: sg, capBottom: false }); }
}
export function jarL(g, x, y, z, r, h, fill, lid) {
  g.mat('plain', fill, { rough: -0.38 }); g.cyl(x, y, z, r, h * 0.8, { segs: 6, capBottom: false, capTop: false });
  g.mat('plain', mixHex(fill, '#dfe8e4', 0.7), { rough: -0.45 }); g.cyl(x, y + h * 0.8, z, r, h * 0.12, { segs: 6, r1: r * 0.85, capBottom: false, capTop: lid === 'none' });
  if (lid !== 'none') { g.mat(lid === 'metal' ? 'cast' : 'weave', lid === 'metal' ? BRASS : (lid || '#d9c79a')); g.cyl(x, y + h * 0.9, z, r * 0.9, 0.02, { segs: 6, capBottom: false }); }
}
// a pot of herbs or greens: terracotta (or a glaze), soil, a few cut-out cards
export function potL(g, x, y, z, r, o) {
  const ph = r * 1.1;
  g.mat('glaze', o.pot || '#b8613d', { rough: 0.25 }); g.lathe(x, z, [[r * 0.7, y], [r * 0.95, y + ph * 0.85], [r * 1.05, y + ph * 0.86], [r * 1.05, y + ph]], { segs: 8, capTop: false });
  g.mat('soil', '#ffffff'); g.cyl(x, y + ph * 0.86, z, r * 0.93, 0.004, { segs: 8, capBottom: false });
  const n = o.n || 3, size = o.size || r * 3.0, rng = o.rng;
  g.mat(o.layer || 'leafB', o.leaf || '#ffffff', { sway: 0.3 });
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI + (rng ? rng.f(-0.3, 0.3) : 0), hh = size * (rng ? rng.f(0.8, 1.05) : 1); g.card(x, y + ph * 0.85, z, hh * (o.layer === 'fern' ? 0.55 : 0.85), hh, a, { tilt: rng ? rng.f(-0.2, 0.2) : 0 }); }
  if (o.flower) { g.mat('blossom', o.flower, { sway: 0.3 }); g.card(x, y + ph + size * 0.4, z, size * 0.4, size * 0.4, rng ? rng.f(0, 3) : 0.7, { tilt: 0.2 }); }
}
export function lidBowlL(g, x, y, z, r, glaze, lid) {
  g.mat('glaze', glaze, { rough: -0.3 }); g.lathe(x, z, [[r * 0.45, y], [r * 0.85, y + r * 0.35], [r, y + r * 0.7]], { segs: 10, capTop: false });
  g.mat('glaze', lid, { rough: -0.3 }); g.lathe(x, z, [[r * 1.02, y + r * 0.68], [r * 0.7, y + r * 0.95], [r * 0.2, y + r * 1.05], [r * 0.2, y + r * 1.18], [0, y + r * 1.18]], { segs: 10, capBottom: false });
}
export function cupL(g, x, y, z, glaze, lid) {
  g.mat('glaze', glaze, { rough: -0.3 }); g.lathe(x, z, [[0.026, y], [0.036, y + 0.08], [0.034, y + 0.085]], { segs: 8 });
  g.mat('glaze', lid, { rough: -0.3 }); g.lathe(x, z, [[0.038, y + 0.083], [0.02, y + 0.098], [0, y + 0.1]], { segs: 8, capBottom: false });
}

// ---------------------------------------------------------------------------------------------------------------
// Props (shops-food.*). Front toward +z, feet on y = 0.
// ---------------------------------------------------------------------------------------------------------------

// A shop counter: kick, panelled body, a trim band, a bevelled top. p: { w, d, h, body, top, trim, panel ('paint' | 'tile' | 'wood'), panelTint }
defineProp('shops-food.counter', (g, p) => {
  const w = p.w || 2, d = p.d || 0.64, h = p.h || 0.92, body = p.body || '#5a2e22';
  g.mat('paint', shadeHex(body, 0.55)); g.box(-w / 2 + 0.03, 0, -d / 2 + 0.06, w / 2 - 0.03, 0.09, d / 2 - 0.05, { faces: 'xXzZ' });
  g.mat('paint', body, { rough: -0.08 }); g.box(-w / 2, 0.09, -d / 2 + 0.02, w / 2, h - 0.05, d / 2 - 0.02, { faces: 'xXzZ', aoBottom: 0.6 });
  const n = Math.max(1, Math.round(w / 0.62));
  g.mat(p.panel || 'paint', p.panelTint || shadeHex(body, 1.2), { rough: -0.1 });
  for (let i = 0; i < n; i++) { const x0 = -w / 2 + 0.06 + i * (w - 0.12) / n + 0.035, x1 = -w / 2 + 0.06 + (i + 1) * (w - 0.12) / n - 0.035; g.box(x0, 0.17, d / 2 - 0.02, x1, h - 0.17, d / 2 - 0.006, { faces: 'xXyYZ' }); }
  g.mat('paint', p.trim || '#d9a548'); g.box(-w / 2, h - 0.13, d / 2 - 0.021, w / 2, h - 0.08, d / 2 - 0.004, { faces: 'yYZ' });
  g.mat(p.topMat || 'wood', p.top || '#9a6a3c', { rough: -0.12 }); g.box(-w / 2 - 0.03, h - 0.05, -d / 2 - 0.01, w / 2 + 0.03, h, d / 2 + 0.04, { bevel: 0.012 });
  // the keeper's side: one open shelf of paper and cloths
  g.mat('wood', shadeHex(body, 0.8)); g.box(-w / 2 + 0.05, 0.42, -d / 2 - 0.0, w / 2 - 0.05, 0.45, -d / 2 + 0.2, { faces: 'yYz' });
  g.mat('paper', '#c9a87a'); for (let x = -w / 2 + 0.25; x < w / 2 - 0.25; x += 0.55) g.box(x - 0.1, 0.45, -d / 2 + 0.03, x + 0.1, 0.5, -d / 2 + 0.18, { faces: 'yYxXz' });
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], tier: 's' };
});

// A glass case for a counter top: brass corners and rails, a felt lining, glass all round, an optional glass shelf, its goods.
// p: { w, d, h, frame, lining, fill: 'bake' | 'greens' | 'cheese' | 'cups' | 'none', seed }
defineProp('shops-food.case', (g, p) => {
  const w = p.w || 1.6, d = p.d || 0.5, h = p.h || 0.42, fr = p.frame || BRASS, t = 0.012, rng = new Rng(hashStr('case' + (p.fill || '') + (p.seed || 0)));
  g.mat('felt', p.lining || '#efe2c4'); g.box(-w / 2 + 0.01, 0, -d / 2 + 0.01, w / 2 - 0.01, 0.006, d / 2 - 0.01, { faces: 'Y' });
  g.mat('cast', fr, { rough: -0.12 });
  for (const cx of [-w / 2, w / 2]) for (const cz of [-d / 2, d / 2]) g.box(cx - t, 0, cz - t, cx + t, h + t, cz + t, { faces: 'xXzZY' });
  for (const cz of [-d / 2, d / 2]) { g.box(-w / 2, h - t, cz - t, w / 2, h + t, cz + t, { faces: 'yYzZ' }); g.box(-w / 2, 0, cz - t, w / 2, 0.025, cz + t, { faces: 'YzZ' }); }
  for (const cx of [-w / 2, w / 2]) g.box(cx - t, h - t, -d / 2, cx + t, h + t, d / 2, { faces: 'yYxX' });
  const f = p.fill || 'none', sh = h * 0.55;
  if (f !== 'none') { g.mat('cast', fr); g.box(-w / 2 + 0.01, sh - 0.006, d / 2 - 0.014, w / 2 - 0.01, sh + 0.002, d / 2 - 0.004, { faces: 'Zy' }); }
  const items = (y, fn) => { const n = Math.max(2, Math.floor((w - 0.1) / 0.17)); for (let i = 0; i < n; i++) fn(-w / 2 + 0.05 + (i + 0.5) * (w - 0.1) / n, y, i); };
  if (f === 'bake') {
    items(0.006, (x, y, i) => { for (const z of [-0.1, 0.08]) { if (i % 3 === 2) { g.mat('plain', '#c47a32', { rough: -0.2 }); g.ball(x, y + 0.02, z, 0.055, 0.024, 0.035, { segs: 7, rings: 3, bottom: -0.2 }); } else loafL(g, x, y, z, 'bun', i % 3 ? '#b86a2c' : '#c08446'); } });
    items(sh + 0.002, (x, y, i) => { if (i % 2) { g.mat('plaster', '#f0d27a', { rough: 0.2 }); g.cyl(x, y, 0, 0.06, 0.05, { segs: 8 }); } else { g.mat('plain', '#e2b765', { rough: -0.1 }); for (const dz of [-0.05, 0.05]) g.ball(x, y + 0.018, dz, 0.022, 0.019, 0.022, { segs: 6, rings: 3 }); } });
  } else if (f === 'greens') {
    items(0.006, (x, y, i) => { if (i % 3 === 0) { g.mat('felt', '#7c2430'); g.box(x - 0.05, y, -0.05, x + 0.05, y + 0.012, 0.05); g.mat('plain', '#c8281c', { rough: -0.4 }); g.ball(x, y + 0.04, 0, 0.034, 0.028, 0.034, { segs: 10, rings: 6 }); g.mat('plain', '#4d7a2a'); g.cyl(x, y + 0.066, 0, 0.004, 0.012, { segs: 4 }); } else { g.mat('plain', i % 2 ? '#5e9a3a' : '#7fb04a'); g.ball(x, y + 0.03, 0, 0.065, 0.04, 0.06, { segs: 8, rings: 3, bottom: -0.2 }); } });
    items(sh + 0.002, (x, y, i) => { g.mat('plain', i % 2 ? '#2f5a24' : '#c41e2a', { rough: -0.3 }); if (i % 2) g.ball(x, y + 0.022, 0, 0.07, 0.02, 0.022, { segs: 8, rings: 3 }); else for (const dz of [-0.04, 0, 0.04]) g.ball(x + rng.f(-0.02, 0.02), y + 0.012, dz, 0.013, 0.014, 0.013, { segs: 5, rings: 3 }); });
  } else if (f === 'cheese') {
    items(0.006, (x, y, i) => { g.mat('plaster', i % 2 ? '#c99a4a' : '#e0c27a', { rough: 0.2 }); if (i % 2) g.cyl(x, y, 0, 0.07, 0.06, { segs: 10 }); else { g.push(); g.move(x, y, 0); g.rotY(rng.f(-0.5, 0.5)); g.prism([[0, -0.06], [0.07, 0], [0, 0.06]], 0, 0.05); g.pop(); } });
    items(sh + 0.002, (x, y, i) => jarL(g, x, y, 0, 0.035, 0.1, ['#a8402a', '#e8d27a', '#6a1e3a', '#8a9a4a'][i % 4], i % 2 ? 'metal' : '#d9c79a'));
  } else if (f === 'cups') {
    items(0.006, (x, y, i) => { for (const z of [-0.08, 0.08]) cupL(g, x, y, z, ['#e9e2d0', '#3d6f8a', '#a3563a', '#d9c7a6'][(i + (z > 0 ? 1 : 0)) % 4], ['#c9552e', '#2f6f73', '#d6a640'][i % 3]); });
  }
  const P = (x0, y0, z0, x1, y1, z1) => [x0, y0, z0, x1, y1, z1, { opacity: 0.11 }];
  const glass = [P(-w / 2, 0.025, d / 2, w / 2, h - 0.012, d / 2), P(-w / 2, 0.025, -d / 2, w / 2, h - 0.012, -d / 2), P(-w / 2, 0.025, -d / 2, -w / 2, h - 0.012, d / 2), P(w / 2, 0.025, -d / 2, w / 2, h - 0.012, d / 2), P(-w / 2, h, -d / 2, w / 2, h, d / 2)];
  if (f !== 'none') glass.push(P(-w / 2 + 0.01, sh, -d / 2 + 0.01, w / 2 - 0.01, sh, d / 2 - 0.01));
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], glass, cast: false };
});

// An enamel pendant shade on a cord from y = 0 down L. p: { L, col, inner }
defineProp('shops-food.shade', (g, p) => {
  const L = p.L || 1.0, y = -L, c = p.col || '#c9452e';
  g.mat('brushed', '#3a3430'); g.tube([[0, 0, 0], [0, y + 0.02, 0]], 0.005, { segs: 4, caps: false }); g.cyl(0, -0.03, 0, 0.045, 0.03, { segs: 8 });
  g.mat('cast', BRASS, { rough: -0.15 }); g.cyl(0, y - 0.035, 0, 0.026, 0.055, { segs: 8 });
  g.mat('paint', c, { rough: -0.3 }); g.lathe(0, 0, [[0.23, y - 0.17], [0.16, y - 0.1], [0.07, y - 0.045], [0.03, y]], { segs: 14, capTop: false, capBottom: false });
  g.mat('plain', p.inner || '#fbefd6', { emissive: 0.55, lamp: true }); g.lathe(0, 0, [[0.03, y - 0.026], [0.07, y - 0.05], [0.158, y - 0.105], [0.222, y - 0.166]], { segs: 14, capTop: false, capBottom: false });
  g.mat('plain', '#fff0c8', { emissive: 4, lamp: true }); g.ball(0, y - 0.085, 0, 0.032, 0.038, 0.032, { segs: 8, rings: 4 });
  return { cast: false };
});

// Open wall shelving: uprights, shelves with a painted lip, a back board, a cornice. Goods are drawn by the caller or by `fill`.
// p: { w, h, d, n, wood, lip, back, fill: 'crocks' | 'jars' | 'loaves' | 'tins' | 'folded' | 'cups' | 'bowls' | 'none', seed, glazes: [..] }
defineProp('shops-food.shelf', (g, p) => {
  const w = p.w || 2, h = p.h || 2.1, d = p.d || 0.32, n = p.n || 4, wood = p.wood || '#6f5137', rng = new Rng(hashStr('sh' + (p.fill || '') + (p.seed || 0) + w));
  g.mat('wood', wood, { rough: -0.05 });
  const bays = Math.max(1, Math.round(w / 0.95)), bw = w / bays;
  for (let i = 0; i <= bays; i++) { const x = -w / 2 + i * bw; g.box(Math.max(-w / 2, x - 0.025), 0, -d / 2, Math.min(w / 2, x + 0.025), h, d / 2, { faces: 'xXzZ' }); }
  const ys = []; for (let i = 0; i < n; i++) ys.push(0.12 + i * (h - 0.32) / (n - 1));
  for (const y of ys) g.box(-w / 2, y - 0.025, -d / 2, w / 2, y, d / 2, { faces: 'yYZ' });
  g.mat('wood', p.cornice || shadeHex(wood, 1.1)); g.box(-w / 2 - 0.03, h - 0.06, -d / 2, w / 2 + 0.03, h, d / 2 + 0.04, { faces: 'xXyYZ' });
  if (p.lip) { g.mat('paint', p.lip); for (const y of ys.slice(1)) g.box(-w / 2, y - 0.055, d / 2, w / 2, y - 0.02, d / 2 + 0.012, { faces: 'yYZ' }); }
  if (p.back !== false) { g.mat('wood', shadeHex(wood, 0.62)); g.box(-w / 2, 0, -d / 2, w / 2, h, -d / 2 + 0.012, { faces: 'Z' }); }
  const f = p.fill || 'none', G = p.glazes || ['#7a5236', '#4a5a6a', '#a8563a', '#2f5a4a', '#c9a04a', '#6a3a4a', '#e6dcc4'];
  if (f !== 'none') ys.forEach((y, si) => {
    if (si === 0 && f !== 'crocks' && f !== 'folded') return;
    let x = -w / 2 + 0.06;
    while (x < w / 2 - 0.1) {
      if (f === 'cellar') { if (si < 2) { const r = rng.f(0.11, 0.15); x += r; if (x > w / 2 - 0.05) break; crockL(g, x, y, 0, r, Math.min(0.42, (h - 0.32) / (n - 1) - 0.06), rng.pick(G), 'cloth', rng.pick([LINEN, '#e6d2b0', '#c9b48a'])); x += r + 0.08; } else { const r = rng.f(0.12, 0.16); x += r; if (x > w / 2 - 0.05) break; g.mat('plaster', rng.pick(['#c99a4a', '#b8823a', '#d8b06a', '#a87a3a']), { rough: 0.2 }); g.cyl(x, y, 0, r, rng.f(0.08, 0.12), { segs: 10, capBottom: false }); x += r + 0.05; } }
      else if (f === 'crocks') { const r = rng.f(0.065, 0.1) * (si === 0 ? 1.4 : 1), hh = Math.min(rng.f(0.14, 0.24) * (si === 0 ? 1.4 : 1), (h - 0.32) / (n - 1) - 0.06); x += r; if (x > w / 2 - 0.05) break; crockL(g, x, y, rng.f(-0.03, 0.03), r, hh, rng.pick(G), rng.pick(['cloth', 'glaze', 'wood', 'cloth']), rng.pick([LINEN, '#e6d2b0', '#d9a0a0', '#c9d8c0'])); x += r + rng.f(0.04, 0.12); }
      else if (f === 'jars') { const r = rng.f(0.045, 0.06); x += r; jarL(g, x, y, rng.f(-0.06, 0.06), r, rng.f(0.11, 0.17), rng.pick(['#a8402a', '#e8d27a', '#6a1e3a', '#8a9a4a', '#d9a53a', '#3a2a20', '#c96a3a']), rng.chance(0.5) ? 'metal' : rng.pick(['#d9c79a', '#c9d8c0', '#e6d2b0'])); x += r + rng.f(0.04, 0.09); }
      else if (f === 'loaves') { const k = si === 1 ? 'boule' : si === 2 ? 'batard' : 'tin'; const st = k === 'boule' ? 0.21 : k === 'batard' ? 0.17 : 0.22; x += st / 2; for (const z of k === 'batard' ? [0] : [-0.07, 0.07]) loafL(g, x, y, z, k, rng.pick(['#b8763a', '#a8662e', '#c08446', '#9a5a28']), k === 'batard' ? Math.PI / 2 : 0); x += st / 2 + 0.01; }
      else if (f === 'tins') { const r = rng.f(0.05, 0.075), hh = rng.f(0.1, 0.2); x += r; g.mat('paint', rng.pick(['#2f6f73', '#c9452e', '#d6a640', '#33407a', '#6b7a3a']), { rough: -0.1 }); g.cyl(x, y, 0, r, hh, { segs: 8 }); g.mat('cast', '#b9b0a0'); g.cyl(x, y + hh, 0, r * 1.02, 0.015, { segs: 8 }); x += r + 0.03; }
      else if (f === 'folded') { const cw = 0.32; x += cw / 2; if (x > w / 2 - 0.1) break; let yy = y; const m = rng.i(2, 5); for (let k = 0; k < m; k++) { const t = rng.f(0.035, 0.06); g.mat(rng.chance(0.3) ? 'stripe' : 'weave', rng.pick(['#c9552e', '#2f6f73', '#e7b547', '#7a2a5a', '#3a5f9f', '#d4878a', '#6c9a4c', '#e8e2d0', '#f1e6cf'])); g.box(x - 0.15 + rng.f(-0.01, 0.01), yy, -0.12, x + 0.15 + rng.f(-0.01, 0.01), yy + t, 0.12, { faces: 'xXzZY' }); yy += t; } g.mat('weave', '#d8cdb0'); g.box(x - 0.004, y, 0.121, x + 0.004, yy + 0.003, 0.125, { faces: 'Z' }); g.mat('paper', '#f3ead6'); g.box(x - 0.03, y + 0.01, 0.125, x + 0.03, y + 0.05, 0.128, { faces: 'Z' }); x += cw / 2 + 0.04; }
      else if (f === 'cups') { x += 0.045; cupL(g, x, y, rng.f(-0.06, 0.06), rng.pick(['#e9e2d0', '#3d6f8a', '#a3563a', '#d9c7a6', '#6b7a3a']), rng.pick(['#c9552e', '#2f6f73', '#d6a640', '#e9e2d0'])); x += 0.05; }
      else if (f === 'bowls') { x += 0.09; lidBowlL(g, x, y, 0, 0.08, rng.pick(['#e9e2d0', '#d9c7a6', '#a3563a', '#3d6f8a']), rng.pick(['#c9552e', '#2f6f73', '#d6a640', '#33407a'])); x += 0.1; }
      else break;
    }
  });
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], tier: 's' };
});

// A low barrel with iron hoops and a slate lid. p: { r, h, wood }
defineProp('shops-food.barrel', (g, p) => {
  const r = p.r || 0.26, h = p.h || 0.62;
  g.mat('wood', p.wood || '#7a5636', { rough: -0.05 }); g.lathe(0, 0, [[r * 0.86, 0], [r, h * 0.5], [r * 0.86, h]], { segs: 12, capBottom: false });
  g.mat('cast', '#3a3632'); for (const t of [0.12, 0.88]) g.lathe(0, 0, [[r * (t < 0.5 ? 0.89 : 0.89) + 0.006, h * t - 0.02], [r * 0.9 + 0.006, h * t + 0.02]], { segs: 12, capTop: false, capBottom: false });
  g.mat('slate', '#2e3230'); g.cyl(0, h, 0, r * 0.9, 0.02, { segs: 12 });
  return { posts: [[0, 0, r, 0, h]], tier: 's' };
});

// A tall wheeled rack of trays: proving baskets under linen, rolls, noodle nests. p: { w, d, h, n, fill: 'proof' | 'rolls' | 'nests' }
defineProp('shops-food.rack', (g, p) => {
  const w = p.w || 0.66, d = p.d || 0.46, h = p.h || 1.75, n = p.n || 7, rng = new Rng(hashStr('rk' + (p.fill || '') + n));
  g.mat('brushed', '#a9a39a', { rough: 0.05 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * w / 2 - 0.012, 0.08, sz * d / 2 - 0.012, sx * w / 2 + 0.012, h, sz * d / 2 + 0.012, { faces: 'xXzZ' });
  g.box(-w / 2 - 0.012, h - 0.02, -d / 2 - 0.012, w / 2 + 0.012, h, d / 2 + 0.012);
  g.mat('cast', '#2e2a26'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * w / 2 - 0.02, 0, sz * d / 2 - 0.02, sx * w / 2 + 0.02, 0.08, sz * d / 2 + 0.02);
  for (let i = 0; i < n; i++) {
    const y = 0.2 + i * (h - 0.32) / (n - 1);
    g.mat('brushed', '#8f897f'); g.box(-w / 2 + 0.01, y, -d / 2 + 0.01, w / 2 - 0.01, y + 0.012, d / 2 - 0.01, { faces: 'yYxXzZ' });
    if (p.fill === 'proof') { for (const x of [-0.17, 0.0, 0.17]) for (const z of [-0.11, 0.11]) { g.mat('cane', '#c49a62'); g.cyl(x, y + 0.012, z, 0.075, 0.05, { segs: 8, r1: 0.085, capTop: false }); g.mat('weave', rng.chance(0.6) ? LINEN : '#e6d2b0'); g.ball(x, y + 0.062, z, 0.087, 0.022, 0.087, { segs: 8, rings: 2, bottom: 0 }); } }
    else if (p.fill === 'nests') { g.mat('plaster', '#efe0b8', { rough: 0.2 }); for (const x of [-0.2, -0.07, 0.07, 0.2]) for (const z of [-0.12, 0.0, 0.12]) g.ball(x + rng.f(-0.01, 0.01), y + 0.03, z, 0.055, 0.022, 0.05, { segs: 7, rings: 2, bottom: -0.4 }); }
    else for (const x of [-0.24, -0.12, 0, 0.12, 0.24]) for (const z of [-0.14, 0, 0.14]) loafL(g, x, y + 0.012, z, 'roll', rng.pick(['#b86a2c', '#c08446', '#a8662e']));
  }
  return { solid: [[-w / 2 - 0.02, 0, -d / 2 - 0.02, w / 2 + 0.02, h, d / 2 + 0.02]], tier: 's' };
});

// A work bench: a thick pale top on a dark frame, a shelf beneath with stacked baskets or cloths. p: { w, d, h, top, frame, flour: bool, dough: bool }
defineProp('shops-food.bench', (g, p) => {
  const w = p.w || 1.8, d = p.d || 0.75, h = p.h || 0.9, fr = p.frame || '#6a4428';
  g.mat('wood', fr, { rough: -0.05 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (w / 2 - 0.07) - 0.035, 0, sz * (d / 2 - 0.07) - 0.035, sx * (w / 2 - 0.07) + 0.035, h - 0.07, sz * (d / 2 - 0.07) + 0.035, { faces: 'xXzZ' });
  g.box(-w / 2 + 0.08, 0.16, -d / 2 + 0.08, w / 2 - 0.08, 0.19, d / 2 - 0.08, { faces: 'yYzZ' });
  g.mat('wood', p.top || '#dcc092', { rough: 0.05 }); g.box(-w / 2, h - 0.07, -d / 2, w / 2, h, d / 2, { bevel: 0.012 });
  if (p.flour !== false) { g.mat('plaster', '#ecdcbc', { rough: 0.35 }); g.ball(-w * 0.15, h, 0.02, w * 0.25, 0.002, d * 0.32, { segs: 10, rings: 1, bottom: 0 }); g.ball(w * 0.22, h, -0.05, w * 0.15, 0.002, d * 0.25, { segs: 8, rings: 1, bottom: 0 }); }
  if (p.dough !== false) { g.mat('plaster', '#efe2c4', { rough: 0.15 }); g.ball(-w * 0.18, h + 0.002, 0.02, 0.2, 0.07, 0.16, { segs: 10, rings: 3, bottom: 0 }); for (let i = 0; i < 4; i++) g.ball(w * 0.08 + i * 0.12, h + 0.002, -0.1, 0.045, 0.04, 0.045, { segs: 6, rings: 2, bottom: 0 }); }
  g.mat('weave', LINEN); for (let i = 0; i < 4; i++) g.box(w / 2 - 0.55, 0.19 + i * 0.022, -0.15, w / 2 - 0.15, 0.209 + i * 0.022, 0.15, { faces: 'xXzZY' });
  g.mat('cane', '#c49a62'); for (let i = 0; i < 3; i++) g.cyl(-w / 2 + 0.35, 0.19 + i * 0.06, 0, 0.11, 0.055, { segs: 8, capTop: false });
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], tier: 's' };
});

// A wall cupboard of drawers or a dresser foot: a low painted cupboard with knobbed doors and a top. p: { w, h, d, body, top }
defineProp('shops-food.cupboard', (g, p) => {
  const w = p.w || 1.6, h = p.h || 0.85, d = p.d || 0.5, body = p.body || '#5a2e22';
  g.mat('paint', shadeHex(body, 0.6)); g.box(-w / 2 + 0.03, 0, -d / 2 + 0.03, w / 2 - 0.03, 0.08, d / 2 - 0.05, { faces: 'xXzZ' });
  g.mat('paint', body, { rough: -0.08 }); g.box(-w / 2, 0.08, -d / 2, w / 2, h - 0.04, d / 2 - 0.02, { faces: 'xXzZ', aoBottom: 0.6 });
  const n = Math.max(1, Math.round(w / 0.5)); g.mat('paint', shadeHex(body, 1.2));
  for (let i = 0; i < n; i++) { const x0 = -w / 2 + 0.04 + i * (w - 0.08) / n + 0.02, x1 = -w / 2 + 0.04 + (i + 1) * (w - 0.08) / n - 0.02; g.box(x0, 0.13, d / 2 - 0.02, x1, h - 0.1, d / 2 - 0.006, { faces: 'xXyYZ' }); }
  g.mat('cast', BRASS); for (let i = 0; i < n; i++) { const x = -w / 2 + 0.04 + (i + 0.5) * (w - 0.08) / n; g.box(x - 0.012, h - 0.22, d / 2 - 0.006, x + 0.012, h - 0.19, d / 2 + 0.012); }
  g.mat('wood', p.top || '#9a6a3c', { rough: -0.1 }); g.box(-w / 2 - 0.02, h - 0.04, -d / 2, w / 2 + 0.02, h, d / 2 + 0.02, { faces: 'xXyYZ' });
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], tier: 's' };
});

// A drum washer with a round door, cheaply: a painted body, a control strip, a chrome ring, the load behind dark glass.
// Front toward +z. p: { body, load }
defineProp('shops-food.washer', (g, p) => {
  const body = p.body || '#e8e2d4';
  g.mat('paint', shadeHex(body, 0.55)); g.box(-0.31, 0, -0.3, 0.31, 0.05, 0.3, { faces: 'xXzZ' });
  g.mat('paint', body, { rough: -0.25 }); g.box(-0.33, 0.05, -0.32, 0.33, 0.86, 0.32, { faces: 'xXyYzZ', aoBottom: 0.6 });
  g.mat('paint', shadeHex(body, 0.85)); g.box(-0.31, 0.74, 0.32, 0.31, 0.84, 0.335, { faces: 'xXyYZ' });
  g.mat('diffuser', '#ffcf7a', { emissive: 2.2 }); g.box(-0.24, 0.775, 0.335, -0.2, 0.8, 0.338, { faces: 'Z' });
  g.mat('cast', '#c8a45a', { rough: -0.2 }); g.box(0.17, 0.77, 0.335, 0.23, 0.81, 0.35, { faces: 'xXyYZ' });
  g.push(); g.move(0, 0.4, 0.32); g.rotX(Math.PI / 2);
  g.mat('brushed', '#d6d2c8', { rough: -0.3 }); g.lathe(0, 0, [[0.21, 0], [0.215, 0.03], [0.17, 0.035]], { segs: 12, capBottom: false, capTop: false });
  g.mat('weave', p.load || '#c9552e'); g.cyl(0, -0.004, 0, 0.17, 0.004, { segs: 12, capBottom: false });
  g.mat('diffuser', '#9fb4b8', { rough: -0.45 }); g.cyl(0, 0.024, 0, 0.17, 0.002, { segs: 12, capBottom: false });
  g.pop();
  g.mat('brushed', '#d6d2c8'); g.box(0.2, 0.36, 0.34, 0.24, 0.44, 0.37, { faces: 'xXyYZ' });
  return { solid: [[-0.33, 0, -0.32, 0.33, 0.86, 0.32]], tier: 's', surf: 'metal' };
});

// ---------------------------------------------------------------------------------------------------------------
// People, words and buying
// ---------------------------------------------------------------------------------------------------------------
export function keeperName(r) { return GIVEN[r.i(0, GIVEN.length - 1)]; }
export function bandOf(info) { return info && (info.band === 'high' || info.band === 'low') ? info.band : 'middle'; }
// pick n distinct lines from an array, by a seed
export function pickN(r, arr, n) { const a = arr.slice(); r.shuffle(a); return a.slice(0, n); }
export function hourOf(game) { return game.clock ? game.clock.hours : 12; }
export function isOpen(game, hrs) { const h = hourOf(game); return hrs[0] <= hrs[1] ? (h >= hrs[0] && h < hrs[1]) : (h >= hrs[0] || h < hrs[1]); }
// "nine till seven" written out
const HW = ['midnight', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
export function hourWord(h) { h = ((Math.round(h) % 24) + 24) % 24; return h === 0 ? 'midnight' : h === 12 ? 'twelve' : HW[h > 12 ? h - 12 : h]; }

// The shop's menu. items: [{ id, name, desc, price, bands: [..], when: (h) => bool, give: itemId, line }]. Returns the item bought, or null.
export async function buy(game, F, title, note0, items, who, band, onBought) {
  if (!game.ui) return null;
  game.busy++;
  let it = null;
  try {
    const h = hourOf(game);
    const list = items.filter((q) => !q.bands || q.bands.indexOf(band) >= 0).map((q) => ({ id: q.id, name: q.name, desc: q.desc, price: q.price, tag: q.tag, disabled: (q.when && !q.when(h)) || (game.wallet && q.price > game.wallet.kwh + 1e-6) }));
    const id = await game.ui.menu({ kicker: who.name, title, note: note0, items: list, wallet: game.wallet ? game.wallet.kwh : 0 });
    if (!id) return null;
    it = items.find((q) => q.id === id); if (!it) return null;
    if (game.wallet && it.price > 0 && !game.wallet.spend(it.price, it.name)) { if (game.audio) game.audio.ui('deny'); it = null; return null; }
    if (it.price <= 0) note(game, it.name + (it.tag === 'loan' ? '.' : ', free.'));
    if (it.give && game.inv && game.inv.give && !(game.inv.has && game.inv.has(it.give))) game.inv.give(it.give);
  } finally { game.busy--; }
  if (it && it.line) await say(game, who, [it.line]);
  if (it && onBought) await onBought(it);
  return it;
}

// Count what a lot draws, with ?citylog: triangles, lights and working time (not the time spent waiting for frames).
export function meter(s, game, lot, tick) {
  const on = !!(game && game.params && game.params.citylog);
  if (!on) return { tick, done() {} };
  let tris = 0, work = 0, t0 = performance.now(), last = 0, parts = []; const l0 = s.lights.length;
  const proto = Object.getPrototypeOf(s);
  s.flush = function (o) { tris += this.g.buf.ni / 3; return proto.flush.call(this, o); };
  const t2 = async () => { const el = performance.now() - t0; work += el; parts.push(Math.round(tris - last) + '/' + el.toFixed(1)); last = tris; await tick(); t0 = performance.now(); };
  return { tick: t2, done(F) { const el = performance.now() - t0; work += el; parts.push(Math.round(tris - last) + '/' + el.toFixed(1)); delete s.flush; console.log('[shops-food] ' + lot.id + ' shop.' + lot.trade + ' front ' + lot.front + ' ' + (lot.x1 - lot.x0).toFixed(1) + 'x' + (lot.z1 - lot.z0).toFixed(1) + ': ' + Math.round(tris) + ' triangles (' + parts.join(' ') + '), ' + (s.lights.length - l0) + ' lights, ' + work.toFixed(1) + ' ms' + (F ? ' (signs ' + F.signMs.toFixed(1) + ' ms)' : '')); } };
}
