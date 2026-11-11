// The kit for the block's own rooms (lots_rooms.js): a lot's local frame, the shell every room shares (floor, ceiling,
// walls, a front that reads from the street, ceiling works and trims), and a few small helpers for lines and seats.
//
// Local coordinates: p runs along the front from its low end (always the low end of the front's frame axis, so frame
// a = o.a0 + p), q runs inward from the front line. A local angle `a` faces (sin a, cos a) in (p, q): a = 0 faces the
// back wall, a = PI faces the street, a = PI / 2 faces +p. The footprint is mirrored on some sides, so everything is
// placed by position and facing, never by handedness.
import { lamp, wall } from '../world/kit.js';
import { room, shopfront } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { door } from '../world/doors.js';
import { orient, frontSide, say } from '../city/lots.js';
import { LOT_H } from '../city/plan.js';
import { frontWall, pilaster, FIN } from './street_parts.js';
import { Rng, shadeHex, mixHex } from '../core/util.js';

export const KIT_T = 0.2;         // depth of the front wall (street_parts' ordinary fronts)

export function local(s, lot, tick) {
  const o = orient(lot), g = s.g, P = o.P;
  const dirOf = (dp, dq) => { const a = P(0, 0), b = P(dp, dq); return [b[0] - a[0], b[1] - a[1]]; };
  const yaw = (a) => { const d = dirOf(Math.sin(a), Math.cos(a)); return Math.atan2(d[0], d[1]); };
  const face = (dp, dq) => { const d = dirOf(dp, dq); return Math.abs(d[0]) > Math.abs(d[1]) ? (d[0] > 0 ? 'X' : 'x') : (d[1] > 0 ? 'Z' : 'z'); };
  const pt = (p, y, q) => { const a = P(p, q); return [a[0], y, a[1]]; };
  const L = {
    o, s, g, lot, W: o.W, D: o.D, P, pt, yaw, face, dirOf, tick: tick || null,
    // the player looks the other way round from a prop: player yaw = PI - prop yaw
    pyaw: (a) => Math.PI - yaw(a),
    box(p0, y0, q0, p1, y1, q1, opts) { const b = o.box(p0, q0, p1, q1); g.box(b[0], y0, b[1], b[2], y1, b[3], opts); },
    solid(p0, y0, q0, p1, y1, q1, opts) { const b = o.box(p0, q0, p1, q1); return s.solid(b[0], y0, b[1], b[2], y1, b[3], opts); },
    // a drawn box that also collides
    block(p0, y0, q0, p1, y1, q1, mat, tint, opts = {}) {
      const b = o.box(p0, q0, p1, q1); g.mat(mat, tint, opts.mo); g.box(b[0], y0, b[1], b[2], y1, b[3], { bevel: opts.bevel, aoBottom: 0.7 });
      s.flush({ tier: opts.tier || 's', cast: opts.cast !== false }); if (!opts.noCollide) s.solid(b[0], y0, b[1], b[2], y1, b[3], { surf: opts.surf });
    },
    prop(name, p, y, q, a, params, opt) { const c = P(p, q); return prop(s, name, c[0], y, c[1], yaw(a || 0), params, opt); },
    spot(type, p, y, q, a, opt) { const c = P(p, q); return s.spot(type, c[0], y, c[1], yaw(a || 0), opt); },
    sign(spec, p, y, q, dir, opt) { const c = P(p, q); return sign(s, spec, c[0], y, c[1], Object.assign({ face: face(dir[0], dir[1]) }, opt)); },
    interact(o2) { const c = P(o2.p, o2.q); const oo = Object.assign({}, o2, { x: c[0], z: c[1] }); delete oo.p; delete oo.q; return s.interact(oo); },
    // a seat the player can take: (p, q) the floor under the seat, a the way it faces
    seat(p, q, y, a, label, opts = {}) {
      const c = P(p, q), yw = yaw(a);
      return s.interact({ x: c[0], y: y + 0.5, z: c[1], radius: opts.radius || 1.0, wide: true, priority: opts.priority,
        prompt: (gm) => (gm.player.seat ? 'Stand up' : label),
        onUse(gm) { const pl = gm.player; if (pl.seat) { pl.stand(); return; } pl.sit({ x: c[0], y, z: c[1], yaw: Math.PI - yw, eye: opts.eye || 1.12 }); pl.yaw = Math.PI - yw; pl.pitch = opts.pitch || 0; if (opts.onSit) opts.onSit(gm); } });
    },
    path(points, opt) { return s.path(points.map((pq) => P(pq[0], pq[1])), opt); },
    lamp(kind, p, y, q, opts = {}) {
      const a = P(p, q), oo = Object.assign({}, opts);
      if (opts.face) oo.face = face(opts.face[0], opts.face[1]);
      if (opts.to) oo.to = pt(opts.to[0], opts.to[1], opts.to[2]);
      if (opts.dir) { const d = dirOf(opts.dir[0], opts.dir[2]); oo.dir = [d[0], opts.dir[1], d[1]]; }
      lamp(s, kind, a[0], y, a[1], oo);
    },
    tube(points, r, opt) { g.tube(points.map((v) => pt(v[0], v[1], v[2])), r, opt); },
    cyl(p, y, q, r, h, opt) { const c = P(p, q); g.cyl(c[0], y, c[1], r, h, opt); },
    lathe(p, q, prof, opt) { const c = P(p, q); g.lathe(c[0], c[1], prof, opt); },
    sheet(a, b, c, d, opt) { g.sheet(pt(a[0], a[1], a[2]), pt(b[0], b[1], b[2]), pt(c[0], c[1], c[2]), pt(d[0], d[1], d[2]), opt); },
    glass(p0, y0, q0, p1, y1, q1, opt) { const a = P(p0, q0), b = P(p1, q1); return s.glass(a[0], y0, a[1], b[0], y1, b[1], opt); },
    // draw at a local point facing a local angle: inside, +z of the drawing faces a (as a prop does)
    at(p, y, q, a) { const c = P(p, q); g.at(c[0], y, c[1], yaw(a || 0)); },
    pop() { g.pop(); },
    loop(name, p, y, q, opt) { const c = P(p, q); return s.loop(name, c[0], y, c[1], opt); },
    sfx(game, name, p, y, q) { if (!game.audio || !game.sfxAt) return; const c = P(p, q); game.sfxAt(name, s.frame, c[0], y, c[1]); },
    // is the player inside the local rectangle?
    inside(game, p0, q0, p1, q1) {
      const pl = game.player; if (!pl || pl.frame !== s.frame) return false; const b = o.box(p0, q0, p1, q1), v = pl.pos;
      return v.x >= b[0] && v.x <= b[2] && v.z >= b[1] && v.z <= b[3] && v.y > -1 && v.y < 3.5;
    },
    furniture(fn) { fn(g); s.flush({ tier: 's', cast: true }); },
    detail(fn) { fn(g); s.flush({ tier: 'd', cast: true }); },
    deco(fn) { fn(g); s.flush({ tier: 'd', cast: false }); },
    structure(fn) { fn(g); s.flush({ tier: 's', cast: false }); },
  };
  return L;
}

// ---------------------------------------------------------------------------------------------------------------
// The shell
// ---------------------------------------------------------------------------------------------------------------
// shell(L, info, o): the room's box and its front. Returns the light clip.
// o: { H, floor: [mat, tint], ceil: [mat, tint], wall: { mat, tint, dado: { h, mat, tint }, skirt }, glow: { sky, ground, power },
//      front: { style: 'house' | 'glazed', fin (a FIN entry), door: { p (its middle), w }, windows: [{ p (left edge), w, h, sill }],
//               sign: { emblem, palette, w }, awning, frame, plinth, doorTint, mat (a plain threshold mat colour) } }
export async function shell(L, info, o) {
  const s = L.s, lot = L.lot, oo = L.o, H = o.H || 3.2, g = s.g;
  const clip = room(s, { x0: lot.x0, z0: lot.z0, x1: lot.x1, z1: lot.z1, y: 0, h: H, floor: o.floor, ceil: o.ceil, wall: o.wall, open: { [lot.front]: false }, glow: o.glow || { sky: '#ffe2b8', ground: '#b88c64', power: 0.4 } });
  if (L.tick) await L.tick();
  const fr = o.front || {}, W = L.W, dw = (fr.door && fr.door.w) || 1.2, dp = fr.door ? fr.door.p : W / 2;
  const signFace = L.face(0, -1);
  const sp = fr.sign || {};
  if (fr.style === 'glazed') {
    shopfront(s, { side: lot.front, a0: oo.a0 + 0.25, a1: oo.a1 - 0.25, c: oo.c, y: 0, h: LOT_H, fascia: { kind: 'fascia', text: lot.name, sub: lot.sub, emblem: sp.emblem, palette: sp.palette }, fasciaW: sp.w || 2.4,
      palette: { frame: fr.frame, plinth: fr.plinth, awning: fr.awning || ['#c9552e', '#f1e6cf'] }, door: { kind: fr.doorKind || 'slide', at: dp - dw / 2 - 0.25, w: dw, tint: fr.doorTint, style: 'glazed' },
      awning: fr.awning ? { depth: 0.9 } : false, plinth: fr.plinthH === undefined ? 0.5 : fr.plinthH, glow: 0.6, lights: !!fr.lights });
    g.mat('paint', fr.frame || '#2d3b36');
    for (const p of [0, W - 0.25]) { const b = oo.box(p, -0.1, p + 0.25, 0.12); g.box(b[0], 0, b[1], b[2], LOT_H, b[3], { bevel: 0.01 }); s.solid(b[0], 0, b[1], b[2], LOT_H, b[3]); }
    s.flush({ tier: 's' });
  } else {
    const fin = fr.fin || FIN[(info.style * 2 + 1) % FIN.length], sd = frontSide(lot);
    const ops = [{ at: dp - dw / 2, w: dw, h: 2.62 }];
    for (const wn of fr.windows || []) ops.push({ at: wn.p, w: wn.w, h: wn.h || 1.45, sill: wn.sill || 0.9 });
    frontWall(s, sd, oo.a0, oo.a1, LOT_H, ops, fin);
    if (L.tick) await L.tick();
    // the inside face of the front, in the room's own finish (the street face is the frontWall's)
    const wi = o.wall || {};
    const a = L.P(0.16, KIT_T + 0.03), b = L.P(W - 0.16, KIT_T + 0.03);
    wall(s, a[0], a[1], b[0], b[1], 0, H, { t: 0.06, mat: wi.mat, tint: wi.tint, dado: wi.dado, skirt: wi.skirt, noCollide: true, openings: ops.map((op) => ({ at: op.at - 0.16, w: op.w, h: op.h, sill: op.sill })) });
    // the door: a glazed leaf that opens as you come, a fanlight over it lit from the room
    const hp = L.P(dp - dw / 2 + 0.04, KIT_T * 0.5);
    door(s, { x: hp[0], y: 0, z: hp[1], w: dw - 0.08, h: 2.12, along: oo.alongX ? 'x' : 'z', dir: 1, swing: lot.front === 'n' || lot.front === 'w' ? -1 : 1, kind: 'hinge', style: 'glazed', tint: fr.doorTint || fin.door, auto: true });
    L.structure(() => {
      g.mat('wood', fin.trim);
      L.box(dp - dw / 2, 2.14, 0.02, dp + dw / 2, 2.2, KIT_T - 0.02);
      L.box(dp - 0.02, 2.2, KIT_T * 0.5 - 0.02, dp + 0.02, 2.62, KIT_T * 0.5 + 0.02);
      // window sills inside and out, a mullion and a transom bar in each window
      for (const wn of fr.windows || []) {
        const sill = wn.sill || 0.9, h = wn.h || 1.45;
        L.box(wn.p - 0.05, sill - 0.05, -0.08, wn.p + wn.w + 0.05, sill, KIT_T + 0.12, { bevel: 0.008 });
        L.box(wn.p + wn.w / 2 - 0.025, sill, KIT_T * 0.5 - 0.025, wn.p + wn.w / 2 + 0.025, sill + h, KIT_T * 0.5 + 0.025);
        L.box(wn.p, sill + h * 0.72 - 0.02, KIT_T * 0.5 - 0.025, wn.p + wn.w, sill + h * 0.72 + 0.02, KIT_T * 0.5 + 0.025);
      }
    });
    L.glass(dp - dw / 2, 2.2, KIT_T * 0.5, dp + dw / 2, 2.62, KIT_T * 0.5, { opacity: 0.18, tint: '#fff1d6' });
    for (const wn of fr.windows || []) { const sill = wn.sill || 0.9, h = wn.h || 1.45; L.glass(wn.p, sill, KIT_T * 0.5, wn.p + wn.w, sill + h, KIT_T * 0.5, { opacity: 0.13 }); }
    pilaster(s, sd, oo.a0 + 0.15, LOT_H + 0.37); pilaster(s, sd, oo.a1 - 0.15, LOT_H + 0.37);
    const fq = L.P(W / 2, -0.03);
    if (L.tick) await L.tick();
    sign(s, { kind: 'fascia', text: lot.name, sub: lot.sub, emblem: sp.emblem, palette: sp.palette }, fq[0], 2.97, fq[1], { face: signFace, w: Math.min(sp.w || 2.6, W - 1.2), h: 0.4, glow: 0.6, board: false });
  }
  // the threshold: a step and a mat outside the door
  L.structure(() => {
    g.mat('stone', '#b9ae9a'); L.box(dp - dw / 2 - 0.15, 0, -0.42, dp + dw / 2 + 0.15, 0.03, 0, { bevel: 0.01 });
    g.mat('rush', fr.mat || '#9a7a4a'); L.box(dp - 0.45, 0.03, -0.38, dp + 0.45, 0.042, -0.05);
  });
  return clip;
}

// Ceiling works in local coordinates: beams across the room (along p) every `every` metres of depth, a lagged pipe
// along one side wall, a duct along the back. o: { beam, beamMat, every, duct, pipe, side ('lo' | 'hi'), q0 }
export function ceilingWorks(L, H, o = {}) {
  const g = L.g, W = L.W, D = L.D, every = o.every || 2.3, q0 = o.q0 === undefined ? KIT_T + 0.1 : o.q0;
  const n = Math.max(1, Math.round((D - q0) / every));
  L.structure(() => {
    g.mat(o.beamMat || 'wood', o.beam || '#4a3324', { rough: -0.05 });
    for (let i = 1; i < n; i++) { const q = q0 + (D - q0) * i / n; L.box(0.16, H - (o.beamD || 0.2), q - 0.09, W - 0.16, H, q + 0.09, { bevel: 0.012 }); }
  });
  L.deco(() => {
    if (o.duct !== false) {
      const q = D - 0.5, y = H - 0.3;
      g.mat('brushed', o.duct || '#a9a49a'); L.tube([[0.2, y, q], [W - 0.2, y, q]], 0.13, { segs: 10, caps: false });
      g.mat('brushed', shadeHex(o.duct || '#a9a49a', 0.82)); for (let p = 0.9; p < W - 0.3; p += 1.8) L.tube([[p - 0.03, y, q], [p + 0.03, y, q]], 0.145, { segs: 10 });
    }
    if (o.pipe !== false) {
      const p = o.side === 'hi' ? W - 0.5 : 0.5, y = H - 0.12;
      g.mat('cast', o.pipe || '#b07a45', { rough: -0.15 }); L.tube([[p, y, q0 + 0.1], [p, y, D - 0.2]], 0.03, { segs: 8, caps: false });
      g.mat('felt', '#cfc4ae'); L.tube([[p + (o.side === 'hi' ? -0.13 : 0.13), y, q0 + 0.1], [p + (o.side === 'hi' ? -0.13 : 0.13), y, D - 0.2]], 0.045, { segs: 8, caps: false });
    }
  });
}

// A picture rail and a painted band round the three inner walls and the inside of the front.
export function trims(L, H, o = {}) {
  const g = L.g, W = L.W, D = L.D, t = 0.165, y = o.rail || 2.3, qf = KIT_T + 0.06;
  L.deco(() => {
    g.mat('wood', o.railTint || '#4a3324', { rough: -0.05 });
    L.box(t, y - 0.03, D - t - 0.03, W - t, y + 0.03, D - t);
    L.box(t, y - 0.03, qf, t + 0.03, y + 0.03, D - t); L.box(W - t - 0.03, y - 0.03, qf, W - t, y + 0.03, D - t);
    if (o.band) {
      g.mat('paint', o.band); const b0 = H - (o.bandH || 0.3), b1 = H - 0.02;
      L.box(t, b0, D - t - 0.006, W - t, b1, D - t); L.box(t, b0, qf, t + 0.006, b1, D - t); L.box(W - t - 0.006, b0, qf, W - t, b1, D - t);
      L.box(t, b0, qf, W - t, b1, qf + 0.006);
    }
  });
}

// A partition across the room at depth q (from wall to wall), with openings measured from p = 0.16.
export function partition(L, q, H, o = {}) {
  const a = L.P(0.16, q), b = L.P(L.W - 0.16, q);
  wall(L.s, a[0], a[1], b[0], b[1], 0, H, { t: 0.12, mat: o.mat, tint: o.tint, dado: o.dado, skirt: o.skirt, openings: o.openings || [] });
}
// A partition along the room at p (from q0 to q1), with openings measured from q0.
export function partitionQ(L, p, q0, q1, H, o = {}) {
  const a = L.P(p, q0), b = L.P(p, q1);
  wall(L.s, a[0], a[1], b[0], b[1], 0, H, { t: 0.12, mat: o.mat, tint: o.tint, dado: o.dado, skirt: o.skirt, openings: o.openings || [] });
}

// ---------------------------------------------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------------------------------------------
// One of a list, chosen by the lot's seed and a key (so different interactions in one room do not move together).
export function pickBy(seed, key, list) { return list[new Rng((seed ^ hashKey(key)) >>> 0).i(0, list.length - 1)]; }
function hashKey(k) { let h = 2166136261; for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
// Fill {name}, {g}, {decks} ... in a line from the block's info.
export function fill(line, info, extra) {
  return line.replace(/\{(\w+)\}/g, (m, k) => {
    if (extra && extra[k] !== undefined) return String(extra[k]);
    switch (k) {
      case 'name': return info.name; case 'g': return info.g.toFixed(2); case 'deck': return String(info.d0); case 'decks': return info.d0 + ' to ' + info.d1;
      case 'hall': return info.hall; case 'dish': return info.dish[0]; case 'ring': return info.ringName; case 'band': return info.bandName; case 'street': return info.street; case 'avenue': return info.avenue;
      case 'people': return String(Math.round(info.people / 100) * 100);
      default: return m;
    }
  });
}
// Say lines chosen by seed: sets is a list of alternatives, each a list of lines.
export function sayPick(game, who, seed, key, sets, info, extra) { const set = pickBy(seed, key, sets); return say(game, who, set.map((l) => fill(l, info, extra))); }
export function hourOf(game) { return game.clock ? game.clock.hours : 12; }
export function gHere(game, info) { return game.player && game.player.gNow ? game.player.gNow : info.g; }
export const NAMES = ['Adaeze', 'Bruna', 'Calum', 'Dagny', 'Efua', 'Farid', 'Gwen', 'Hiro', 'Ilse', 'Jonah', 'Kemal', 'Lior', 'Mags', 'Nadia', 'Oskar', 'Priya', 'Quill', 'Rosa', 'Sunniva', 'Tomas', 'Ulla', 'Vida', 'Wendell', 'Xiu', 'Yusuf', 'Zora', 'Anouk', 'Bram', 'Cosima', 'Dov', 'Esme', 'Fintan', 'Greta', 'Hamza', 'Ines', 'Joaquim', 'Kalinda', 'Luka', 'Mirela', 'Noor', 'Ottilie', 'Pavel', 'Rania', 'Soren', 'Tavi', 'Uma', 'Viggo', 'Wanjiru'];
export function nameBy(seed, key) { return pickBy(seed, key, NAMES); }
export function shade(c, k) { return shadeHex(c, k); }
export function mix(a, b, t) { return mixHex(a, b, t); }

// A looping sound that runs only while the player is near and volFn(hour) says so (a block keeps many rooms loaded, and
// the audio has only so many loops). (p, y, q): where it sounds; o: { radius, param }.
export function nearLoop(L, name, p, y, q, volFn, o = {}) {
  const s = L.s, c = L.P(p, q), R = o.radius || 12, st = { h: null, v: -1, t: 0 };
  s.every((dt, game) => {
    st.t -= dt; if (st.t > 0 || !game || !game.audio || !game.player) return; st.t = 0.5;
    const pl = game.player, near = pl.frame === s.frame && Math.hypot(pl.pos.x - c[0], pl.pos.z - c[1]) < R + 6 && Math.abs(pl.pos.y - y) < 4;
    const v = near ? volFn(hourOf(game)) : 0;
    if (v > 0.001 && !st.h) { st.h = s.loop(name, c[0], y, c[1], { vol: v, radius: R, param: o.param }); st.v = v; }
    else if (v <= 0.001 && st.h) { try { st.h.stop(0.6); } catch (e) { /* gone */ } st.h = null; st.v = -1; }
    else if (st.h && Math.abs(v - st.v) > 0.01) { st.h.set({ vol: v }); st.v = v; }
  });
}

// Debug numbers for a lot, with ?citylog or ?roomlog: triangles, lights and work time.
export function meter(s) {
  let n = 0; for (const ch of s.chunks.values()) for (const k in ch.bufs) n += ch.bufs[k].ni || 0;
  return { tris: n / 3, lights: s.lights.length };
}
