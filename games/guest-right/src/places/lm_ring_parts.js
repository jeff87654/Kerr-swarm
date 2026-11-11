// Parts for two more of Chervil's nine station rings (lm_ring_five.js, lm_ring_nine.js): small helpers, a vault of any
// width, the glide bays and their cars, a hanging two-faced clock, a lift lobby with cab berths, a compact Ledger,
// seats, the people's magnets, and a few props of their own. The platform's props (platform.*, station.*) and the car
// itself come from Station Ring 2's parts files.
import { floor, ceiling, wall, lamp, roomGlow } from '../world/kit.js';
import { railing } from '../world/kit2.js';
import { prop, defineProp } from '../world/props.js';
import { PAL, movable, rotX, signK, drawCar, carSolids, CAR } from './station_parts.js';
import { ledgerParts, painted, drawFigure, drawNames, drawTitle, drawPlate, num } from './ledger_parts.js';
import { LEDGER } from '../content/ledger.js';
import { Rng, hashStr, shadeHex, smoothstep } from '../core/util.js';

void ledgerParts;
export const PI = Math.PI;

// ---------------------------------------------------------------------------------------------------------------
// small helpers, safe when the UI or the audio is missing
// ---------------------------------------------------------------------------------------------------------------
export async function say(game, who, lines) { if (!game.ui) return; game.busy++; try { await game.ui.say(who, lines); } finally { game.busy--; } }
export function toast(game, text, kind) { if (game.ui) game.ui.toast(text, { kind: kind || 'info', dur: 6 }); }
export function sfx(game, name, f, x, y, z) { if (game.audio && game.sfxAt) game.sfxAt(name, f, x, y, z); }
export function found(game, id) { if (game.journal && game.journal.find) game.journal.find(id); }
export function hour(game) { return game.clock ? game.clock.hours : 12; }
export function day(game) { return game.clock ? game.clock.day : 1; }
// Wait a frame between big parts of a build, then take the region's sign pages back (another build may have had them).
export function ticker(game, region) {
  return async () => {
    await new Promise((res) => { let done = false; const go = () => { if (!done) { done = true; res(); } }; requestAnimationFrame(go); setTimeout(go, 50); });
    if (game.atlas && game.atlas.begin) game.atlas.begin('region:' + region);
  };
}
// Run fn(a, b, i) over [a0, a1] in pieces no longer than `step` (long things are cut so the drum can bend them).
export function runX(a0, a1, step, fn) { const n = Math.max(1, Math.ceil((a1 - a0) / step - 1e-6)); for (let i = 0; i < n; i++) fn(a0 + (a1 - a0) * i / n, a0 + (a1 - a0) * (i + 1) / n, i); }
export function lineX(a0, a1, y, z, step = 3) { const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / step)), out = []; for (let i = 0; i <= n; i++) out.push([a0 + (a1 - a0) * i / n, y, z]); return out; }
// The minute a hand should show, a minute fast like every station clock in Chervil.
export function clockMin(game) { return game.clock ? game.clock.minutes + 1 : 600; }

// ---------------------------------------------------------------------------------------------------------------
// a segmental barrel vault over z[zN, zS], springing at `spring`, `crown` at the middle
// ---------------------------------------------------------------------------------------------------------------
export function makeVault(zN, zS, spring, crown) {
  const zc = (zN + zS) / 2, half = (zS - zN) / 2, rise = crown - spring, R = (half * half + rise * rise) / (2 * rise), yc = crown - R;
  const V = {
    zN, zS, spring, crown,
    y(z) { const d = z - zc; return yc + Math.sqrt(Math.max(0, R * R - d * d)); },
    slope(z) { const d = z - zc; return -d / Math.sqrt(Math.max(1e-6, R * R - d * d)); },
    zs(n) { const o = []; for (let i = 0; i <= n; i++) o.push(zN + (zS - zN) * i / n); return o; },
    // a box that follows the curve along z at x in [x0, x1], from `below` under the surface to `above` over it
    band(g, x0, x1, z0, z1, below, above, n) {
      const segs = n || Math.max(2, Math.ceil((z1 - z0) / 2));
      for (let i = 0; i < segs; i++) {
        const za = z0 + (z1 - z0) * i / segs, zb = z0 + (z1 - z0) * (i + 1) / segs, zm = (za + zb) / 2;
        const a = Math.atan(V.slope(zm)), L = Math.hypot(zb - za, V.y(zb) - V.y(za)) * 1.02;
        g.push(); g.move(0, V.y(zm), zm); g.rotX(-a); g.box(x0, -below, -L / 2, x1, above, L / 2); g.pop();
      }
    },
  };
  return V;
}
// The vault's skin between x0 and x1 (drawn in 4 m strips), with purlins along it at the given z.
export function vaultSkin(s, V, x0, x1, o) {
  const g = s.g, zs = V.zs(o.nz || 16), purl = o.purlins || [];
  runX(x0, x1, 8, (a, b) => s.structure(() => {
    g.mat(o.mat || 'panel', o.skin);
    runX(a, b, 4, (xa, xb) => { for (let i = 0; i < zs.length - 1; i++) { const za = zs[i], zb = zs[i + 1], ya = V.y(za), yb = V.y(zb); g.quad([xa, ya, za], [xb, ya, za], [xb, yb, zb], [xa, yb, zb]); } });
    g.mat('panel', o.purlin);
    for (const zp of purl) { const y = V.y(zp); g.box(a, y - 0.4, zp - 0.13, b, y + 0.05, zp + 0.13, { faces: 'xXyzZ' }); }
  }));
}
// A rib across the vault at x, coming down to the floor at both walls unless told where to stop (y0N, y0S).
export function vaultRib(s, V, xr, o) {
  const g = s.g, big = !!o.big, w = big ? 0.5 : 0.1, fl = big ? 0.7 : 0.3, dep = big ? 1.3 : 0.75, pd = big ? 1.0 : 0.5;
  s.structure(() => {
    g.mat('panel', o.main); V.band(g, xr - w, xr + w, V.zN + 0.2, V.zS - 0.2, dep, 0.03, 18);
    g.mat('panel', o.dark); V.band(g, xr - fl, xr + fl, V.zN + 0.25, V.zS - 0.25, dep, -(dep - 0.09), 18);
    if (big && o.brass) { g.mat('cast', o.brass); V.band(g, xr - fl - 0.02, xr + fl + 0.02, V.zN + 0.3, V.zS - 0.3, dep + 0.01, -(dep - 0.03), 18); }
    for (const side of [0, 1]) {
      const zw = side ? V.zS - 0.3 : V.zN + 0.3, dz = side ? -pd : pd, y0 = side ? (o.y0S || 0) : (o.y0N || 0);
      const za = Math.min(zw, zw + dz), zb = Math.max(zw, zw + dz);
      g.mat('panel', o.main); g.box(xr - fl, y0, za, xr + fl, V.spring + 0.25, zb, { bevel: 0.025 });
      if (o.brass) { g.mat('cast', o.brass, { rough: -0.15 }); g.box(xr - fl - 0.04, V.spring - 0.45, Math.min(zw, zw + dz * 1.08), xr + fl + 0.04, V.spring - 0.3, Math.max(zw, zw + dz * 1.08), { bevel: 0.015 }); }
      if (y0 === 0) {
        g.mat('cast', o.dark); g.box(xr - fl - 0.07, 0, Math.min(zw, zw + dz * 1.12), xr + fl + 0.07, 0.5, Math.max(zw, zw + dz * 1.12), { bevel: 0.025 });
        s.solid(xr - fl - 0.07, 0, Math.min(zw, zw + dz * 1.12), xr + fl + 0.07, V.spring, Math.max(zw, zw + dz * 1.12));
      }
    }
  });
}

// ---------------------------------------------------------------------------------------------------------------
// the glide bays: a platform edge at z = zE, the bay beyond it (sg = -1: toward lower z, sg = +1: higher z)
// ---------------------------------------------------------------------------------------------------------------
// o: { cx, zE, sg, n, dest, kind: 'shut' | 'car' | 'loop', pal: { main, dark, brass, yellow }, clip, body, number, hang (sign spec) }
export function bay(s, game, f, o) {
  const g = s.g, cx = o.cx, zE = o.zE, sg = o.sg, P = o.pal, Z = (d) => zE + sg * d;
  const zr = (a, b) => [Math.min(Z(a), Z(b)), Math.max(Z(a), Z(b))];
  // the floor of the bay zone either side of the pit is the platform's, laid by the caller; here the pit or the hatch
  const [p0, p1] = zr(0.5, 6.9);
  if (o.kind === 'shut') {
    s.furniture(() => {
      g.mat('deckplate', '#4c4a46'); g.box(cx - 5, 0, p0, cx + 5, 0.022, p1, { faces: 'YxXzZ' });
      let k = 0; for (let x = cx - 5; x < cx + 4.95; x += 0.5, k++) { g.mat('paint', k % 2 ? '#1c1c1c' : P.yellow); for (const zz of [p0, p1 - 0.32]) g.box(x, 0.022, zz, Math.min(cx + 5, x + 0.5), 0.026, zz + 0.32, { faces: 'Y' }); }
      g.mat('speckle', '#1b1b1b'); g.box(cx - 0.03, 0.022, p0, cx + 0.03, 0.027, p1, { faces: 'Y' });
      g.mat('cast', '#3a3d3e'); for (const z of [p0 + 1.6, p1 - 1.6]) for (const x of [cx - 3.8, cx + 3.8]) g.cyl(x, 0.022, z, 0.16, 0.006, { segs: 10 });
    });
  } else {
    const depth = o.kind === 'loop' ? 7.4 : 2.2;
    s.structure(() => {
      g.mat('concrete', '#4a4946'); g.box(cx - 5.15, -depth, p0, cx - 5, 0, p1, { faces: 'X' }); g.box(cx + 5, -depth, p0, cx + 5.15, 0, p1, { faces: 'x' });
      g.box(cx - 5, -depth, p0 - 0.15, cx + 5, 0, p0, { faces: 'Z' }); g.box(cx - 5, -depth, p1, cx + 5, 0, p1 + 0.15, { faces: 'z' });
      g.mat('concrete', '#232322'); g.box(cx - 5, -depth - 0.1, p0, cx + 5, -depth, p1, { faces: 'Y' });
      g.mat('paint', P.yellow); g.box(cx - 5.2, -0.05, Z(0.5) - 0.07, cx + 5.2, 0.006, Z(0.5) + 0.07, { faces: 'Y' });
      g.mat('diffuser', '#ff4a3a', { emissive: 3 }); for (const sx of [-1, 1]) for (const yy of [-1.2, -3.4]) if (yy > -depth) g.ball(cx + sx * 4.97, yy, Z(3.6), 0.05, 0.05, 0.05, { segs: 6, rings: 4 });
    });
    s.solid(cx - 5, -depth, p0, cx + 5, -depth + 0.01, p1);
  }
  // the barrier: posts, a yellow rail, glass, a gate in the middle
  s.furniture(() => {
    g.mat('cast', P.main);
    for (const px of [cx - 5.6, cx - 3.3, cx + 3.3, cx + 5.6]) g.box(px - 0.05, 0, zE - 0.06, px + 0.05, 1.28, zE + 0.06, { bevel: 0.012 });
    for (const px of [cx - 0.95, cx + 0.95]) { g.box(px - 0.09, 0, zE - 0.09, px + 0.09, 1.5, zE + 0.09, { bevel: 0.02 }); }
    g.mat('cast', P.brass); for (const px of [cx - 0.95, cx + 0.95]) g.cyl(px, 1.5, zE, 0.08, 0.04, { segs: 10 });
    for (const [a, b] of [[cx - 5.6, cx - 0.95], [cx + 0.95, cx + 5.6]]) { g.mat('paint', P.yellow); g.box(a, 1.2, zE - 0.055, b, 1.28, zE + 0.055, { bevel: 0.012 }); g.mat('cast', P.dark); g.box(a, 0.05, zE - 0.04, b, 0.12, zE + 0.04); }
    if (o.kind !== 'loop') {
      g.mat('cast', P.main);
      for (const [a, b] of [[cx - 0.86, cx - 0.02], [cx + 0.02, cx + 0.86]]) { g.box(a, 0.05, zE - 0.04, b, 0.13, zE + 0.03); g.box(a, 1.07, zE - 0.04, b, 1.15, zE + 0.03); g.mat('paint', P.yellow); g.box(a, 1.15, zE - 0.05, b, 1.2, zE + 0.04); g.mat('cast', P.main); }
      g.mat('cast', P.dark); for (let x = cx - 0.78; x < cx + 0.8; x += 0.12) g.tube([[x, 0.13, zE], [x, 1.07, zE]], 0.012, { segs: 5, caps: false });
    }
    g.mat('diffuser', o.kind === 'car' ? '#86e08e' : '#ffb347', { emissive: o.kind === 'car' ? 4 : 1.2 });
    for (const px of [cx - 0.95, cx + 0.95]) g.ball(px, 1.6, zE, 0.07, 0.07, 0.07, { segs: 8, rings: 6 });
  });
  for (const [a, b] of [[cx - 5.55, cx - 3.35], [cx - 3.25, cx - 1.04], [cx + 1.04, cx + 3.25], [cx + 3.35, cx + 5.55]]) s.glass(a, 0.12, zE, b, 1.2, zE, { tint: '#d5e6e2', opacity: 0.1 });
  s.solid(cx - 5.66, 0, zE - 0.12, cx - 0.86, 2.8, zE + 0.12); s.solid(cx + 0.86, 0, zE - 0.12, cx + 5.66, 2.8, zE + 0.12);
  const gateCol = o.kind === 'car' ? null : s.solid(cx - 0.86, 0, zE - 0.12, cx + 0.86, 2.8, zE + 0.12);
  // side rails back to the wall
  const [w0, w1] = zr(0.1, o.wall || 7.0);
  for (const sx of [-1, 1]) { const x = cx + sx * 5.6; railing(s, [[x, sg < 0 ? w1 : w0], [x, sg < 0 ? w0 + 0.3 : w1 - 0.3]], 0, { h: 1.2, tint: P.main, rail: P.yellow, railMat: 'paint', posts: 1.7 }); s.solid(x - 0.07, 0, w0, x + 0.07, 2.8, w1); }
  // the portal
  s.structure(() => {
    g.mat('panel', P.main); for (const sx of [-1, 1]) g.box(cx + sx * 5.9 - 0.2, 0, zE - 0.3, cx + sx * 5.9 + 0.2, 4.0, zE + 0.3, { bevel: 0.025 });
    g.mat('cast', P.dark); for (const sx of [-1, 1]) g.box(cx + sx * 5.9 - 0.27, 0, zE - 0.37, cx + sx * 5.9 + 0.27, 0.42, zE + 0.37, { bevel: 0.02 });
    g.mat('panel', P.main); g.box(cx - 6.15, 4.0, zE - 0.36, cx + 6.15, 4.78, zE + 0.36, { bevel: 0.035 });
    g.mat('cast', P.brass, { rough: -0.15 }); g.box(cx - 6.18, 4.0, Z(-0.4) - 0.03, cx + 6.18, 4.07, Z(-0.4) + 0.03); g.box(cx - 6.18, 4.71, Z(-0.4) - 0.03, cx + 6.18, 4.78, Z(-0.4) + 0.03);
    g.mat('cast', '#2a2d2e'); for (const sx of [-1, 1]) g.cyl(cx + sx * 4.9, 4.78, zE, 0.13, 0.1, { segs: 12 });
    g.mat('diffuser', '#9a5e1c', { rough: -0.2 }); for (const sx of [-1, 1]) g.ball(cx + sx * 4.9, 4.88, zE, 0.1, 0.1, 0.1, { segs: 10, rings: 5, bottom: 0 });
  });
  for (const sx of [-1, 1]) s.solid(cx + sx * 5.9 - 0.27, 0, zE - 0.37, cx + sx * 5.9 + 0.27, 4, zE + 0.37);
  const face = sg < 0 ? 'Z' : 'z';
  signK(s, { kind: 'street', text: 'PLATFORM ' + o.n, sub: o.dest || 'glide' }, cx, 4.39, Z(-0.4), { face, w: 1.9, h: 0.5, glow: 0.7, k: 4 });
  if (o.lamp !== false) lamp(s, 'panel', cx, 4.0, zE, { w: 3.4, d: 0.32, clip: o.clip, K: 4000, power: o.kind === 'shut' ? 0.8 : 1.2, lampFlag: o.lampFlag });
  if (o.hang) { s.deco(() => { g.mat('cast', '#2a2d2e'); for (const dx of [-0.25, 0.25]) g.tube([[cx + 3.1 + dx, 4.0, zE], [cx + 3.1 + dx, 3.88, zE]], 0.008, { segs: 3 }); }); signK(s, o.hang, cx + 3.1, 3.55, zE, { face, double: true, w: 0.66, h: 0.66, k: 1.6 }); }
  // a standing car, its windows of water toward the platform
  if (o.kind === 'car') {
    const za = Z(0.65), yaw = sg < 0 ? 0 : PI;
    s.furniture(() => { g.at(cx, 0, za, yaw); drawCar(g, { interior: false, fakeWindows: true, game, number: o.number || 'CAR 6120', seed: o.n, body: o.body || PAL.oxide }); g.pop(); });
    for (const q of carSolids(cx, 0, za)) { if (sg < 0) s.solid(q[0], q[1], q[2], q[3], q[4], q[5]); else s.solid(q[0], q[1], 2 * za - q[5], q[3], q[4], 2 * za - q[2]); }
    s.solid(cx - 0.62, 0, Math.min(za, za + sg * 1.0), cx + 0.62, 2.4, Math.max(za, za + sg * 1.0));
  }
  return { gateCol, zA: Z(0.65), p0, p1 };
}

// A bay whose car comes and goes on a loop: the hatch opens, the car rises, stands with its doors open, sinks.
// o as bay(), plus sched(game) -> 'cars' | 'freight' | 'none' (what runs at this hour), standT (seconds).
export function carLoop(s, game, f, o, info) {
  const cx = o.cx, sg = o.sg, za = info.zA, DOWN = -5.6, yaw = sg < 0 ? 0 : PI, P = o.pal;
  const body = movable(s, (gg) => { gg.at(0, 0, 0, yaw); drawCar(gg, { interior: false, fakeWindows: true, game, number: o.number || 'CAR 3318', seed: o.n, body: o.body || '#a9572e' }); gg.pop(); }, [cx, DOWN, za], { center: [0, 0.8, sg * 3], radius: 6.2, caster: true });
  const hatchM = (side) => movable(s, (gg) => {
    const x0 = side < 0 ? -5 : 0, x1 = side < 0 ? 0 : 5;
    gg.mat('deckplate', '#4c4a46'); gg.box(x0, -0.14, info.p0, x1, 0.012, info.p1, { faces: 'YxXzZ' });
    let k = 0; for (let x = x0; x < x1 - 0.05; x += 0.5, k++) { gg.mat('paint', k % 2 ? '#1c1c1c' : P.yellow); for (const z of [info.p0, info.p1 - 0.32]) gg.box(x, 0.012, z, Math.min(x1, x + 0.5), 0.016, z + 0.32, { faces: 'Y' }); }
  }, [cx, 0, 0], { center: [side * 2.5, 0, (info.p0 + info.p1) / 2], radius: 4.4 });
  const hL = hatchM(-1), hR = hatchM(1);
  const gate = (side) => movable(s, (gg) => {
    const a = side < 0 ? -0.86 : 0.02, c = side < 0 ? -0.02 : 0.86, zE = o.zE;
    gg.mat('cast', P.main); gg.box(a, 0.05, zE - 0.04, c, 0.13, zE + 0.03, { bevel: 0.01 }); gg.box(a, 1.07, zE - 0.04, c, 1.15, zE + 0.03, { bevel: 0.01 });
    gg.mat('cast', P.dark); for (let x = a + 0.08; x < c - 0.04; x += 0.12) gg.tube([[x, 0.13, zE], [x, 1.07, zE]], 0.012, { segs: 5, caps: false });
    gg.mat('paint', P.yellow); gg.box(a, 1.15, zE - 0.05, c, 1.2, zE + 0.04, { bevel: 0.012 });
  }, [cx, 0, 0], { center: [0, 0.6, o.zE], radius: 1.2 });
  const gL = gate(-1), gR = gate(1);
  const beacons = [-1, 1].map((sx) => movable(s, (gg) => { gg.mat('diffuser', '#ffb040', { emissive: 9 }); gg.ball(0, 0.1, 0, 0.106, 0.106, 0.106, { segs: 10, rings: 5, bottom: 0 }); }, [cx + sx * 4.9, 4.78, o.zE], { radius: 0.4 }));
  const amber = s.light({ at: [cx, 4.95, o.zE - sg * 0.3], color: '#ff9a30', power: 5, range: 11, clip: o.clip, radius: 0.15 }); amber.scale = 0;
  const rng = new Rng(hashStr('ringloop' + o.n + o.cx));
  const DUR = { open: 2.6, rise: 5.5, lock: 0.9, doors: 1.5, stand: o.standT || 20, close: 1.8, sink: 5.5, shut: 2.6 };
  const NEXT = { down: 'open', open: 'rise', rise: 'lock', lock: 'doors', doors: 'stand', stand: 'close', close: 'sink', sink: 'shut', shut: 'down' };
  const st = { state: 'down', t: 0, dur: 4 + rng.f(0, 10), what: 'cars', time: 0 };
  let carCols = [];
  const solidsOn = (on) => {
    if (on && !carCols.length) carCols = carSolids(cx, 0, za).map((q) => (sg < 0 ? s.solid(q[0], q[1], q[2], q[3], q[4], q[5]) : s.solid(q[0], q[1], 2 * za - q[5], q[3], q[4], 2 * za - q[2])));
    else if (!on) { for (const c of carCols) s.col.remove(c); carCols = []; }
  };
  const playerAboard = () => { const Pl = game.player; if (!Pl || Pl.frame !== f) return false; const p = Pl.pos; return Math.abs(p.x - cx) < 2.95 && (sg < 0 ? p.z < o.zE + 0.55 && p.z > za - 4.2 : p.z > o.zE - 0.55 && p.z < za + 4.2) && p.y < 3; };
  const enter = (name) => {
    st.state = name; st.t = 0;
    if (name === 'down') st.what = o.sched ? o.sched(game) : 'cars';
    st.dur = name === 'down' ? (st.what === 'none' ? 6 : 10 + rng.f(0, 16)) : name === 'stand' ? (st.what === 'freight' ? 6 : DUR.stand + rng.f(-4, 6)) : DUR[name];
    if (name === 'open' && st.what === 'none') { st.state = 'down'; st.dur = 8; return; }
    if (name === 'open' || name === 'shut') sfx(game, 'hatch', f, cx, 0, (info.p0 + info.p1) / 2);
    if (name === 'rise') sfx(game, 'chime', f, cx, 3.5, o.zE);
    if (name === 'lock') sfx(game, 'clunk', f, cx, 0.5, za);
    if (name === 'doors' && st.what === 'cars') { sfx(game, 'door-slide', f, cx, 1, za); solidsOn(true); if (o.gateCol) { s.col.remove(o.gateCol); o.gateCol = null; } }
    if (name === 'sink') { sfx(game, 'clunk', f, cx, 0.5, za); solidsOn(false); if (!o.gateCol) o.gateCol = s.solid(cx - 0.86, 0, o.zE - 0.12, cx + 0.86, 2.8, o.zE + 0.12); if (o.onLeave) o.onLeave(game); }
  };
  s.every((dt) => {
    st.t += dt; st.time += dt;
    if (st.t >= st.dur) {
      if ((st.state === 'stand' || st.state === 'close') && st.what === 'cars' && playerAboard()) { if (st.state === 'close') { enter('doors'); st.t = DUR.doors * 0.5; } else st.t = st.dur - 1.5; }
      else enter(NEXT[st.state]);
    }
    const k = Math.min(1, st.t / st.dur), S = st.state;
    let hatch = 0, y = DOWN, doors = 0, flash = false;
    if (S === 'open') { hatch = k; flash = true; } else if (S === 'shut') { hatch = 1 - k; flash = true; } else if (S !== 'down') hatch = 1;
    if (S === 'rise') { y = DOWN * (1 - smoothstep(0, 1, k)); flash = true; }
    else if (S === 'lock' || S === 'doors' || S === 'stand' || S === 'close') y = 0;
    else if (S === 'sink') { y = DOWN * smoothstep(0, 1, k); flash = true; }
    if (st.what === 'cars') { if (S === 'doors') doors = smoothstep(0, 1, k); else if (S === 'stand') doors = 1; else if (S === 'close') { doors = 1 - smoothstep(0, 1, k); flash = true; } }
    body.userData.origin[1] = y; body.userData.hidden = S === 'down';
    const hd = -0.06 * Math.min(1, hatch / 0.12), hs = 5.3 * Math.max(0, (hatch - 0.12) / 0.88);
    hL.userData.origin[0] = cx - hs; hL.userData.origin[1] = hd; hR.userData.origin[0] = cx + hs; hR.userData.origin[1] = hd;
    gL.userData.origin[0] = cx - 0.84 * doors; gR.userData.origin[0] = cx + 0.84 * doors;
    const on = flash && Math.floor(st.time * 2.6) % 2 === 0;
    for (const bm of beacons) bm.userData.hidden = !on;
    amber.scale = on ? 1 : 0;
  });
  return st;
}

// ---------------------------------------------------------------------------------------------------------------
// a two-faced clock hung from above, its faces looking along x. Its hands are moving meshes.
// ---------------------------------------------------------------------------------------------------------------
// o: { r (face radius), hangTo (y of the hanger top), case, face, ink, brass, plate: { text, sub } }
export function hangingClock(s, game, x, y, z, o) {
  const g = s.g, R = o.r || 1.0, cs = o.case || PAL.tealDark, ink = o.ink || '#1d1f20', br = o.brass || PAL.brass;
  s.furniture(() => {
    g.mat('cast', cs); g.push(); g.move(x, y, z); g.rotZ(PI / 2); g.lathe(0, 0, [[R * 0.99, -0.22], [R * 1.1, -0.18], [R * 1.15, 0], [R * 1.1, 0.18], [R * 0.99, 0.22]], { segs: 32, capBottom: false, capTop: false }); g.pop();
    g.mat('diffuser', o.face || '#f6ecd4', { emissive: o.glow === undefined ? 1.4 : o.glow, lamp: o.lampFace !== false }); g.push(); g.move(x, y, z); g.rotZ(PI / 2); g.lathe(0, 0, [[0, -0.215], [R, -0.215]], { segs: 32, capBottom: false, capTop: false }); g.lathe(0, 0, [[R, 0.215], [0, 0.215]], { segs: 32, capBottom: false, capTop: false }); g.pop();
    g.mat('cast', br, { rough: -0.25 });
    for (const sx of [-1, 1]) { const ring = []; for (let k = 0; k < 32; k++) { const a = k / 32 * PI * 2; ring.push([x + sx * 0.225, y + Math.cos(a) * R * 1.03, z + Math.sin(a) * R * 1.03]); } g.tube(ring, 0.035, { segs: 6, closed: true }); }
    g.mat('paint', ink);
    for (const sx of [-1, 1]) for (let k = 0; k < 60; k++) {
      const a = k / 60 * PI * 2, big = k % 5 === 0, r0 = big ? R * 0.78 : R * 0.88, r1 = R * 0.94, w = big ? 0.04 : 0.011;
      const yy = y + Math.cos(a) * (r0 + r1) / 2, zz = z - sx * Math.sin(a) * (r0 + r1) / 2;
      g.push(); g.move(x + sx * 0.22, yy, zz); g.rotX(-sx * a); g.box(-0.004, -(r1 - r0) / 2, -w, 0.004, (r1 - r0) / 2, w); g.pop();
    }
    const top = o.hangTo || (y + R + 2);
    g.mat('cast', '#2a2d2e'); for (const dz of [-R * 0.6, R * 0.6]) g.tube([[x, y + R * 1.05, z + dz], [x, top, z + dz]], 0.028, { segs: 6 });
    g.mat('cast', br); g.ball(x, y + R * 1.17, z, 0.11, 0.13, 0.11, { segs: 10, rings: 6 }); g.ball(x, y - R * 1.17, z, 0.09, 0.11, 0.09, { segs: 10, rings: 6 });
  });
  if (o.plate) for (const sx of [-1, 1]) signK(s, { kind: 'plate', text: o.plate.text, sub: o.plate.sub }, x + sx * 0.226, y - R * 0.42, z, { face: sx > 0 ? 'X' : 'x', w: R * 0.5, h: R * 0.2, board: false, k: 2 });
  const hands = [];
  for (const sx of [-1, 1]) for (const kind of ['h', 'm']) {
    const L = kind === 'm' ? R * 0.82 : R * 0.54, wd = kind === 'm' ? 0.032 : 0.05, xo = sx * (kind === 'm' ? 0.27 : 0.25);
    const mesh = movable(s, (gg) => { gg.mat('cast', '#151617', { rough: -0.1 }); gg.box(xo - 0.01, -0.18, -wd, xo + 0.01, L, wd); gg.box(xo - 0.012, L - 0.11, -wd * 1.6, xo + 0.012, L - 0.02, wd * 1.6); gg.mat('cast', br); gg.push(); gg.move(xo, 0, 0); gg.rotZ(PI / 2); gg.cyl(0, -0.02, 0, 0.055, 0.04, { segs: 10 }); gg.pop(); }, [x, y, z], { radius: R * 1.3 });
    hands.push({ mesh, sx, kind });
  }
  s.every(() => {
    const m = clockMin(game), am = (m % 60) / 60 * PI * 2, ah = ((m / 60) % 12) / 12 * PI * 2;
    for (const h of hands) rotX(h.mesh, (h.kind === 'm' ? am : ah) * (h.sx > 0 ? -1 : 1));
  });
}

// ---------------------------------------------------------------------------------------------------------------
// a lift lobby: a room open on one side to the platform, cab berths on the far wall, a bench, a call post
// ---------------------------------------------------------------------------------------------------------------
// o: { x0, x1, z0, z1, open: 'n' | 's' (the side toward the platform), H, stop, name, sub, place, pal: { wall, dado, floor, ceil, wood, accent, brass }, board: spec }
export function liftLobby(s, game, f, o) {
  const g = s.g, X0 = o.x0, X1 = o.x1, Z0 = o.z0, Z1 = o.z1, H = o.H || 4.6, P = o.pal, cx = (X0 + X1) / 2;
  const back = o.open === 'n' ? Z1 : Z0, front = o.open === 'n' ? Z0 : Z1, sg = o.open === 'n' ? -1 : 1;       // sg: toward the platform
  const LC = [X0 - 0.05, -0.3, Math.min(Z0, Z1) - 0.6, X1 + 0.05, H + 0.1, Math.max(Z0, Z1) + 0.05];
  floor(s, X0, Z0, X1, Z1, 0, 'terrazzo', P.floor);
  ceiling(s, X0, Z0, X1, Z1, H, 'paint', P.ceil);
  const WL = { t: 0.24, mat: 'plaster', tint: P.wall, dado: { h: 1.3, mat: 'tile', tint: P.dado }, skirt: '#2a221c' };
  wall(s, X0 + 0.12, Z0, X0 + 0.12, Z1, 0, H, WL);
  wall(s, X1 - 0.12, Z0, X1 - 0.12, Z1, 0, H, WL);
  wall(s, X0, back + sg * 0.12, X1, back + sg * 0.12, 0, H, WL);
  // the mouth: two pilasters and a deep lintel, open between them
  const mw = Math.min(X1 - X0 - 2.4, 7.2);
  s.structure(() => {
    g.mat('stone', P.stone || '#c8b48e');
    for (const sx of [-1, 1]) g.box(sx < 0 ? X0 : cx + mw / 2, 0, Math.min(front, front - sg * 0.5), sx < 0 ? cx - mw / 2 : X1, H, Math.max(front, front - sg * 0.5), { bevel: 0.02 });
    g.mat('panel', P.accent);
    for (const sx of [-1, 1]) g.box(sx < 0 ? X0 : cx + mw / 2, 0, Math.min(front, front - sg * 0.52), sx < 0 ? cx - mw / 2 : X1, 0.6, Math.max(front, front - sg * 0.52), { bevel: 0.02 });
    g.box(cx - mw / 2, 3.2, Math.min(front, front - sg * 0.5), cx + mw / 2, H, Math.max(front, front - sg * 0.5), { bevel: 0.03 });
    g.mat('cast', P.brass, { rough: -0.15 }); g.box(cx - mw / 2 - 0.05, 3.15, Math.min(front, front - sg * 0.56), cx + mw / 2 + 0.05, 3.22, Math.max(front, front - sg * 0.56));
    g.box(cx - mw / 2, 0, front - 0.25, cx + mw / 2, 0.006, front + 0.25, { faces: 'Y' });
  });
  for (const sx of [-1, 1]) s.solid(sx < 0 ? X0 : cx + mw / 2, 0, Math.min(front, front - sg * 0.5), sx < 0 ? cx - mw / 2 : X1, H, Math.max(front, front - sg * 0.5));
  // coffers and a ring lamp over the middle
  s.structure(() => {
    g.mat('wood', P.wood); for (let z = Math.min(Z0, Z1) + 3; z < Math.max(Z0, Z1) - 1; z += 3.2) g.box(X0 + 0.3, H - 0.36, z - 0.11, X1 - 0.3, H, z + 0.11, { faces: 'yzZ', bevel: 0.01 });
    g.box(cx - 0.11, H - 0.36, Math.min(Z0, Z1) + 0.6, cx + 0.11, H, Math.max(Z0, Z1) - 0.4, { faces: 'yxX', bevel: 0.01 });
  });
  const lz = (Z0 + Z1) / 2;
  s.deco(() => {
    const ring = []; for (let k = 0; k < 24; k++) { const a = k / 24 * PI * 2; ring.push([cx + Math.cos(a) * 0.9, H - 0.95, lz + Math.sin(a) * 0.9]); }
    g.mat('cast', P.brass, { rough: -0.25 }); g.tube(ring, 0.03, { segs: 8, closed: true });
    for (let k = 0; k < 3; k++) { const a = k * PI * 2 / 3 + 0.3; g.tube([[cx + Math.cos(a) * 0.9, H - 0.95, lz + Math.sin(a) * 0.9], [cx, H, lz]], 0.007, { segs: 3 }); }
    g.mat('diffuser', '#ffe7bf', { emissive: 4.5, lamp: o.lampFlag !== false }); for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; g.ball(cx + Math.cos(a) * 0.9, H - 1.1, lz + Math.sin(a) * 0.9, 0.1, 0.12, 0.1, { segs: 10, rings: 6 }); }
  });
  s.light({ at: [cx, H - 1.3, lz], color: [1, 0.78, 0.5], power: 12, range: 11, clip: LC, shadow: true, lamp: o.lampFlag !== false, radius: 0.8 });
  roomGlow(s, X0, 0, Math.min(Z0, Z1), X1, H, Math.max(Z0, Z1), { sky: '#ffdcae', ground: '#b09474', power: 0.26 });
  // the berths on the back wall
  const n = Math.max(2, Math.min(4, Math.floor((X1 - X0 - 1.2) / 2.3))), pitch = 2.27, zw = back + sg * 0.24, fz = -sg;   // fz: the berths face the platform
  const bx = []; for (let i = 0; i < n; i++) bx.push(cx + (i - (n - 1) / 2) * pitch);
  bx.forEach((c, i) => {
    s.furniture(() => {
      const zf = zw + sg * 0.14, za = Math.min(zw, zf), zb = Math.max(zw, zf);
      g.mat('panel', P.accent); g.box(c - 0.92, 0, za, c - 0.72, 2.55, zb, { bevel: 0.015 }); g.box(c + 0.72, 0, za, c + 0.92, 2.55, zb, { bevel: 0.015 }); g.box(c - 0.92, 2.32, za, c + 0.92, 2.6, zb, { bevel: 0.02 });
      g.mat('cast', P.brass, { rough: -0.2 }); g.box(c - 0.95, 2.6, za, c + 0.95, 2.66, zb);
      const zd = zw + sg * 0.06; g.mat('brushed', '#a3a7a3'); g.box(c - 0.71, 0.01, Math.min(zw, zd), c - 0.01, 2.31, Math.max(zw, zd)); g.box(c + 0.01, 0.01, Math.min(zw, zd), c + 0.71, 2.31, Math.max(zw, zd));
      g.mat('speckle', '#141414'); g.box(c - 0.012, 0.01, Math.min(zw, zd + sg * 0.005), c + 0.012, 2.31, Math.max(zw, zd + sg * 0.005));
      g.mat('diffuser', i % 2 ? '#ffb347' : '#86e08e', { emissive: 5, lamp: false }); g.ball(c, 2.78, zw + sg * 0.1, 0.085, 0.085, 0.085, { segs: 10, rings: 6, bottom: -0.2 });
      g.mat('paint', P.yellow || PAL.yellow); g.box(c - 0.7, 0, Math.min(zw + sg * 0.94, zw + sg * 1.0), c + 0.7, 0.005, Math.max(zw + sg * 0.94, zw + sg * 1.0), { faces: 'Y' });
    });
    signK(s, { kind: 'plate', text: 'BERTH ' + (i + 1), sub: i % 2 ? 'cab on its way' : 'cab waiting' }, c, 3.05, zw + sg * 0.01, { face: sg > 0 ? 'Z' : 'z', w: 0.7, h: 0.28, k: 2.5 });
    s.solid(c - 0.95, 0, Math.min(zw, zw + sg * 0.2), c + 0.95, 2.66, Math.max(zw, zw + sg * 0.2));
    s.interact({ x: c, y: 1.2, z: zw + sg * 0.5, radius: 1.6, prompt: 'Call a cab', onUse: (gm) => { if (gm.cab && gm.cab.open) gm.cab.open(o.stop); else toast(gm, 'The cabs are not running yet.'); } });
    s.spot('stand', c + 0.2, 0, zw + sg * 1.3, fz > 0 ? 0 : PI, { tags: ['wait', 'cab'] });
  });
  for (let i = 0; i < n - 1; i++) lamp(s, 'sconce', (bx[i] + bx[i + 1]) / 2, 2.5, zw + sg * 0.02, { face: sg > 0 ? 'Z' : 'z', clip: LC, K: 2700, power: 1.0, lampFlag: o.lampFlag });
  // a bench on each side wall, a plant, the board of the ring
  const by = sg > 0 ? PI : 0;
  void by;
  const benchZ = (Z0 + Z1) / 2 + sg * 0.4;
  prop(s, 'bench', X0 + 0.6, 0, benchZ, PI / 2, { w: 2.2, back: true, wood: P.bench || '#7a5233', metal: P.accent });
  prop(s, 'bench', X1 - 0.6, 0, benchZ, -PI / 2, { w: 2.2, back: true, wood: P.bench || '#6b4a2f', metal: P.accent });
  seatOnBench(s, X0 + 0.6, benchZ, PI / 2, 2.2, o.stop + 'lb0'); seatOnBench(s, X1 - 0.6, benchZ, -PI / 2, 2.2, o.stop + 'lb1');
  prop(s, 'plant', X0 + 0.55, 0, back + sg * 0.7, 0, { kind: 'broad', size: 1.7, pot: P.pot || '#2f6f73' });
  prop(s, 'plant', X1 - 0.55, 0, back + sg * 0.7, 0, { kind: 'fern', size: 1.3, pot: '#c08a2e' });
  if (o.board) signK(s, o.board, X1 - 0.13, 2.05, (Z0 + Z1) / 2 - sg * 1.6, { face: 'x', w: 1.7, h: 1.15, k: 2.2 });
  if (o.boardLines) s.interact({ x: X1 - 0.4, y: 2.0, z: (Z0 + Z1) / 2 - sg * 1.6, radius: 1.8, prompt: 'Read the berth board', onUse: (gm) => say(gm, o.boardTitle || 'Cab berths', o.boardLines) });
  // people: waiting by the berths, a walkway out to the platform
  s.path([[cx, front + sg * 1.2], [cx, front - sg * 0.6], [cx, (Z0 + Z1) / 2]], { width: 2.0 });
  for (const c of bx) s.path([[cx, (Z0 + Z1) / 2], [c, zw + sg * 1.2]], { width: 1.1 });
  s.spot('chat', cx - 1.6, 0, (Z0 + Z1) / 2 - sg * 1.2, 0.9, { tags: ['wait'] }); s.spot('chat', cx - 0.9, 0, (Z0 + Z1) / 2 - sg * 1.9, -2.2, { tags: ['wait'] });
  s.zoneBox({ id: o.stop + '-lobby', place: o.place, box: [X0, -0.5, Math.min(Z0, Z1), X1, H, Math.max(Z0, Z1)], name: o.name, sub: o.sub, ambience: 'station', reverb: 'hall', headroom: H });
  s.loop('air', cx, H - 0.4, back + sg * 0.5, { vol: 0.25, radius: 10 });
  return { x: cx, z: back + sg * 3.2, yaw: sg < 0 ? 0 : PI };
}

// ---------------------------------------------------------------------------------------------------------------
// sitting on a bench: the seat follows where you stand along it
// ---------------------------------------------------------------------------------------------------------------
export function seatOnBench(s, x, z, yaw, w, key, prompt) {
  const fx = Math.sin(yaw), fz = Math.cos(yaw), ax = Math.cos(yaw), az = -Math.sin(yaw);
  s.interact({ x: x + fx * 0.25, y: 0.55, z: z + fz * 0.25, radius: 1.3, wide: true, prompt: (gm) => (gm.player.seat && gm.player.seat.ringKey === key ? 'Get up' : (prompt || 'Sit on the bench')), onUse: (gm) => {
    const Pl = gm.player; if (!Pl || !Pl.sit) return;
    if (Pl.seat && Pl.seat.ringKey === key) { Pl.stand(); return; }
    const p = Pl.pos; let u = (p.x - x) * ax + (p.z - z) * az; u = Math.max(-w / 2 + 0.35, Math.min(w / 2 - 0.35, u));
    Pl.sit({ x: x + ax * u + fx * 0.04, y: 0, z: z + az * u + fz * 0.04, yaw, eye: 1.12, ringKey: key }); Pl.yaw = PI - yaw; Pl.pitch = -0.05;
  } });
}
// A stool or chair: (x, y, z) the floor, seatH the seat height.
export function seatAt(s, x, y, z, yaw, prompt, seatH, then) {
  const seat = { x, y, z, yaw, eye: 1.12 + (seatH - 0.46) };
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  s.interact({
    pos: (game) => (game.player.seat === seat ? [x + fx * 0.6, y + 1.1, z + fz * 0.6] : [x, y + seatH + 0.1, z]),
    x, y: y + seatH + 0.1, z, radius: 1.0,
    prompt: (game) => (game.player.seat === seat ? 'Stand up' : prompt),
    onUse(game) { if (game.player.seat === seat) game.player.stand(); else { game.player.sit(seat); game.player.yaw = PI - yaw; game.player.pitch = -0.12; if (then) then(game); } },
  });
  return seat;
}

// ---------------------------------------------------------------------------------------------------------------
// the Ledger: it stands at every station ring in Chervil. A compact one: the title, six figures, two columns of names.
// ---------------------------------------------------------------------------------------------------------------
export function totals(game) { const d = day(game); return d >= 3 ? LEDGER.totals.bookingDay : d === 2 ? LEDGER.totals.dayBefore : LEDGER.totals.thursday; }
// (x, y, z): the middle of the board's face; it faces `face` ('z': toward lower z). w: its width. key: unique per ring.
export function ringLedger(s, game, o) {
  const g = s.g, T = totals(game), face = o.face || 'z', w = o.w || 9, x = o.x, y = o.y, z = o.z, alongX = face === 'z' || face === 'Z';
  const sgn = face === 'Z' || face === 'X' ? 1 : -1, off = 0.12 * sgn;
  // the case: dark wood and brass round the whole board
  s.structure(() => {
    const t = 0.22, hh = 4.9;
    g.mat('wood', '#2c2118');
    if (alongX) g.box(x - w / 2 - 0.25, y - hh / 2 - 0.3, Math.min(z, z - sgn * t), x + w / 2 + 0.25, y + hh / 2 + 0.3, Math.max(z, z - sgn * t), { bevel: 0.03 });
    else g.box(Math.min(x, x - sgn * t), y - hh / 2 - 0.3, z - w / 2 - 0.25, Math.max(x, x - sgn * t), y + hh / 2 + 0.3, z + w / 2 + 0.25, { bevel: 0.03 });
    g.mat('cast', o.brass || PAL.brass, { rough: -0.2 });
    for (const yy of [y - hh / 2 - 0.3, y + hh / 2 + 0.22]) { if (alongX) g.box(x - w / 2 - 0.3, yy, Math.min(z, z + sgn * 0.06), x + w / 2 + 0.3, yy + 0.08, Math.max(z, z + sgn * 0.06)); else g.box(Math.min(x, x + sgn * 0.06), yy, z - w / 2 - 0.3, Math.max(x, x + sgn * 0.06), yy + 0.08, z + w / 2 + 0.3); }
  });
  const P = (u, v) => (alongX ? [x + u * (face === 'z' ? -1 : 1), y + v, z + off * 0.1] : [x + off * 0.1, y + v, z + u * (face === 'X' ? -1 : 1)]);
  const at = (u, v) => { const p = P(u, v); return [p[0], p[1], p[2]]; };
  const k = o.key || 'ring';
  { const p = at(0, 2.1); painted(s, k + '.ledger.title', w, 0.62, 72, drawTitle('CHERVIL · HERB ROW', 'The Ledger', o.ring || 'STATION RING'), p[0], p[1], p[2], { face, glow: 0.35 }); }
  const cells = [['SHARES', num(T.shares), 'the drum is built for'], ['PEOPLE', num(T.people), 'alive in Chervil today'], ['THE MARGIN', num(T.margin), 'kept under par, on purpose', { hot: true }],
    ['PLACES', num(T.places), num(T.heldByDrum) + ' held by the drum'], ['BORN · DIED', num(T.born) + ' · ' + num(T.died), 'this booking year'], ['GUESTS TONIGHT', num(T.guests), 'on guest-right']];
  const cw = w / 3 - 0.08, chh = 1.15;
  cells.forEach((c, i) => { const col = i % 3, row = Math.floor(i / 3); const p = at((col - 1) * (w / 3), 1.15 - row * (chh + 0.08)); painted(s, k + '.ledger.fig.' + i, cw, chh, 84, drawFigure(c[0], c[1], c[2], c[3] || {}), p[0], p[1], p[2], { face, glow: 0.45 }); });
  const names = LEDGER.names, holders = LEDGER.householders || [], r = new Rng(hashStr(k));
  const pick = (a, n) => { const o2 = []; const st = r.i(0, Math.max(0, a.length - n)); for (let i = 0; i < n && i < a.length; i++) o2.push(a[(st + i) % a.length]); return o2; };
  const bornRows = pick(names, 10).map((nm) => ({ a: nm.born, b: 'for ' + nm.for }));
  const holdRows = pick(holders, 10).map((h) => ({ a: h.holder || '', b: 'after ' + (h.after || '') }));
  { const p = at(-w / 4, -1.45); painted(s, k + '.ledger.born', w / 2 - 0.1, 1.9, 80, drawNames('BORN · FOR', 'each newborn beside the share they carry', bornRows, { rows: 10 }), p[0], p[1], p[2], { face, glow: 0.4 }); }
  { const p = at(w / 4, -1.45); painted(s, k + '.ledger.hold', w / 2 - 0.1, 1.9, 80, drawNames('HOLDS · AFTER', 'each new householder beside the dead whose place they took', holdRows, { rows: 10 }), p[0], p[1], p[2], { face, glow: 0.4 }); }
  s.interact({ x: P(0, 0)[0] + (alongX ? 0 : sgn * 2.2), y: 1.6, z: P(0, 0)[2] + (alongX ? sgn * 2.2 : 0), radius: 3.4, wide: true, prompt: 'Read the Ledger', onUse: async (gm) => {
    const t = totals(gm);
    await say(gm, 'The Ledger', [
      'Shares ' + num(t.shares) + '. People ' + num(t.people) + '. The Margin ' + num(t.margin) + ', the room Chervil keeps empty on purpose.',
      'Places ' + num(t.places) + ', of them ' + num(t.heldByDrum) + ' held by the drum. Born this booking year ' + num(t.born) + ', died ' + num(t.died) + '. Guests tonight, ' + num(t.guests) + '.',
      o.tail || 'The same figures stand at every one of the nine station rings, to the person. Each newborn is listed beside the dead whose share they carry.',
    ]);
    found(gm, 'two-names');
  } });
}

// ---------------------------------------------------------------------------------------------------------------
// the people: a magnet draws the people of this frame to the spots of one place for an hour or so. Removed with the scope.
// ---------------------------------------------------------------------------------------------------------------
export function magnets(game, s, list) {
  const M = game.people && game.people.magnets; if (!M || !list.length) return;
  for (const m of list) M.push(m);
  s.onDispose(() => { for (const m of list) { const i = M.indexOf(m); if (i >= 0) M.splice(i, 1); } });
}

// ---------------------------------------------------------------------------------------------------------------
// props
// ---------------------------------------------------------------------------------------------------------------
// A counter stool: a turned steel post, a footring, a round padded seat at 0.74. p: { seat, metal }
defineProp('lmring.stool', (g, p) => {
  g.mat('cast', p.metal || '#2f3a36'); g.lathe(0, 0, [[0.2, 0], [0.19, 0.03], [0.05, 0.06], [0.035, 0.12], [0.03, 0.66], [0.06, 0.7], [0.06, 0.71]], { segs: 12 });
  const ring = []; for (let k = 0; k < 14; k++) { const a = k / 14 * PI * 2; ring.push([Math.cos(a) * 0.16, 0.26, Math.sin(a) * 0.16]); } g.tube(ring, 0.012, { segs: 4, closed: true });
  for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2; g.tube([[Math.cos(a) * 0.16, 0.26, Math.sin(a) * 0.16], [0, 0.32, 0]], 0.01, { segs: 4 }); }
  g.mat('leather', p.seat || '#8a2f3c', { rough: -0.1 }); g.lathe(0, 0, [[0.17, 0.7], [0.185, 0.72], [0.185, 0.76], [0.16, 0.785], [0, 0.79]], { segs: 16 });
  return { posts: [[0, 0, 0.2, 0, 0.79]], tier: 'd' };
});
// A work coat on a peg (the peg at the origin, the coat hanging below it, front toward +z). p: { cloth, mend, lining }
defineProp('lmring.coat', (g, p) => {
  const c = p.cloth || '#3a5a7a';
  g.mat('wood', '#4a3424'); g.cyl(0, 0, 0, 0.02, 0.06, { segs: 6 });
  g.mat('weave', c); g.lathe(0, 0.05, [[0.05, 0.02], [0.16, -0.06], [0.2, -0.3], [0.21, -0.75], [0.23, -1.0], [0.22, -1.05], [0.0, -1.05]], { segs: 10 });
  g.mat('weave', p.lining || '#c9552e'); g.box(-0.04, -0.4, 0.2, 0.04, -0.04, 0.215);
  g.mat('weave', shadeHex(c, 0.75)); for (const sx of [-1, 1]) g.tube([[sx * 0.15, -0.1, 0.05], [sx * 0.2, -0.45, 0.08], [sx * 0.18, -0.72, 0.1]], 0.05, { segs: 6 });
  g.mat('weave', p.mend || '#d6a640'); g.box(0.06, -0.62, 0.205, 0.15, -0.5, 0.222);
  g.mat('paint', '#e0ad32'); g.box(-0.21, -0.85, 0.08, 0.21, -0.8, 0.13);
  return { cast: false };
});
// Ear defenders hanging on a hook (front toward +z). p: { c }
defineProp('lmring.muffs', (g, p) => {
  g.mat('cast', '#3a3d3e'); g.tube([[0, 0, 0], [0, -0.02, 0.04], [0, -0.05, 0.04]], 0.006, { segs: 4 });
  g.mat('cast', '#2a2d2e'); g.tube([[-0.08, -0.17, 0.05], [-0.075, -0.07, 0.05], [0, -0.04, 0.05], [0.075, -0.07, 0.05], [0.08, -0.17, 0.05]], 0.011, { segs: 5 });
  g.mat('paint', p.c || '#d6a640', { rough: -0.2 }); for (const sx of [-1, 1]) { g.push(); g.move(sx * 0.085, -0.2, 0.05); g.rotZ(PI / 2); g.cyl(0, -0.03, 0, 0.055, 0.06, { segs: 12 }); g.pop(); }
  g.mat('speckle', '#1b1b1b'); for (const sx of [-1, 1]) { g.push(); g.move(sx * 0.055, -0.2, 0.05); g.rotZ(PI / 2); g.cyl(0, -0.01, 0, 0.045, 0.02, { segs: 10 }); g.pop(); }
  return { cast: false };
});
// A travelling case with a paper tag and a mended strap. p: { c, w, h, d }
defineProp('lmring.case', (g, p) => {
  const w = p.w || 0.62, h = p.h || 0.42, d = p.d || 0.24, c = p.c || '#6b3a2a';
  g.mat('weave', c); g.box(-w / 2, 0, -d / 2, w / 2, h, d / 2, { bevel: 0.03 });
  g.mat('cast', '#b08a45'); for (const sx of [-1, 1]) g.box(sx * w / 2 - 0.03, 0.02, -d / 2 - 0.005, sx * w / 2 + 0.005, 0.06, d / 2 + 0.005);
  g.mat('leather', '#3a2618'); g.tube([[-0.08, h, 0], [-0.07, h + 0.06, 0], [0.07, h + 0.06, 0], [0.08, h, 0]], 0.012, { segs: 4 });
  g.mat('weave', shadeHex(c, 0.7)); g.box(-w / 2 - 0.004, h * 0.45, -d / 2 - 0.004, w / 2 + 0.004, h * 0.55, d / 2 + 0.004);
  g.mat('paper', '#efe6d2'); g.box(w / 2 - 0.12, h * 0.6, d / 2, w / 2 - 0.02, h * 0.75, d / 2 + 0.006);
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h + 0.06, d / 2]], tier: 'd' };
});
// A sleeping bench: a long padded bench with a raised head, a folded blanket. p: { w, pad, wood }
defineProp('lmring.sleeper', (g, p) => {
  const w = p.w || 2.0;
  g.mat('wood', p.wood || '#5b3e28'); g.box(-w / 2, 0.36, -0.36, w / 2, 0.42, 0.36, { bevel: 0.015 });
  for (const sx of [-1, 1]) g.box(sx * (w / 2 - 0.08) - 0.05, 0, -0.32, sx * (w / 2 - 0.08) + 0.05, 0.36, 0.32, { bevel: 0.01 });
  g.mat('leather', p.pad || '#2f5d50', { rough: -0.1 }); g.box(-w / 2 + 0.04, 0.42, -0.33, w / 2 - 0.04, 0.5, 0.33, { bevel: 0.03 });
  g.box(-w / 2 + 0.04, 0.5, -0.33, -w / 2 + 0.4, 0.58, 0.33, { bevel: 0.04 });
  g.mat('wood', p.wood || '#5b3e28'); g.box(-w / 2 - 0.04, 0.36, -0.36, -w / 2 + 0.03, 0.82, 0.36, { bevel: 0.015 });
  g.mat('knit', '#a8543a'); g.box(w / 2 - 0.55, 0.5, -0.3, w / 2 - 0.12, 0.57, 0.28, { bevel: 0.03 });
  g.mat('knit', '#e7b547'); g.box(w / 2 - 0.55, 0.57, -0.3, w / 2 - 0.12, 0.6, 0.28, { bevel: 0.015 });
  return { solid: [[-w / 2 - 0.04, 0, -0.36, w / 2, 0.5, 0.36]], spots: [{ type: 'bed', x: 0, y: 0.5, z: 0, yaw: -PI / 2, tags: ['sleep', 'wait'] }], tier: 's' };
});
// A big lidded stockpot standing on a hob ring. p: { r, h, metal }
defineProp('lmring.pot', (g, p) => {
  const r = p.r || 0.28, h = p.h || 0.42, m = p.metal || '#9ea3a3';
  g.mat('cast', '#2a2d2e'); g.cyl(0, 0, 0, r + 0.04, 0.04, { segs: 16 });
  g.mat('brushed', m); g.lathe(0, 0, [[r, 0.04], [r + 0.01, 0.06], [r + 0.01, h], [r + 0.025, h + 0.01], [r - 0.01, h + 0.02]], { segs: 18, capBottom: false });
  g.mat('brushed', shadeHex(m, 1.08)); g.lathe(0, 0, [[r + 0.02, h + 0.02], [r * 0.7, h + 0.07], [0.04, h + 0.1], [0.04, h + 0.14], [0.06, h + 0.15], [0, h + 0.155]], { segs: 18 });
  g.mat('cast', '#2a2d2e'); for (const sx of [-1, 1]) g.tube([[sx * r, h - 0.05, 0], [sx * (r + 0.07), h - 0.03, 0], [sx * (r + 0.07), h - 0.12, 0], [sx * r, h - 0.13, 0]], 0.012, { segs: 4 });
  return { posts: [[0, 0, r + 0.05, 0, h + 0.15]], tier: 'd' };
});
// A lidded travelling tin (food for the car), a little stack of them. p: { c, n }
defineProp('lmring.tins', (g, p) => {
  const n = p.n || 3, cols = [p.c || '#c9552e', '#2f6f73', '#e7b547', '#8a2f3c'];
  for (let i = 0; i < n; i++) { g.mat('glaze', cols[i % cols.length], { rough: -0.2 }); g.lathe(0, 0, [[0.09, i * 0.075], [0.095, i * 0.075 + 0.005], [0.095, i * 0.075 + 0.06], [0.09, i * 0.075 + 0.07]], { segs: 14 }); }
  g.mat('cast', '#b08a45'); g.lathe(0, 0, [[0.098, n * 0.075 - 0.005], [0.06, n * 0.075 + 0.02], [0.02, n * 0.075 + 0.03], [0, n * 0.075 + 0.032]], { segs: 14 });
  g.mat('weave', '#d8cdb8'); g.tube([[-0.1, n * 0.075 - 0.01, 0], [0, n * 0.075 + 0.12, 0], [0.1, n * 0.075 - 0.01, 0]], 0.006, { segs: 4 });
  return { cast: false };
});
// A lost glove pinned to a board (front toward +z). p: { c, cuff }
defineProp('lmring.glove', (g, p) => {
  g.mat('knit', p.c || '#3b4a7a'); g.box(-0.05, -0.1, 0, 0.05, 0.04, 0.025, { bevel: 0.012 });
  for (let i = 0; i < 4; i++) g.box(-0.045 + i * 0.026, 0.04, 0.002, -0.027 + i * 0.026, 0.1 - Math.abs(i - 1.5) * 0.012, 0.022, { bevel: 0.006 });
  g.box(0.05, -0.04, 0.003, 0.08, 0.02, 0.02, { bevel: 0.008 });
  g.mat('knit', p.cuff || '#e7b547'); g.box(-0.055, -0.15, 0, 0.055, -0.1, 0.027, { bevel: 0.01 });
  g.mat('cast', '#c9302c'); g.ball(0, 0.0, 0.03, 0.008, 0.008, 0.008, { segs: 5, rings: 3 });
  return { cast: false };
});
