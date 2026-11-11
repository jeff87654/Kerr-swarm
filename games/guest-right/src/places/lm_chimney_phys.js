// The Spice Rack and the Spouts (lm_chimney.js): the numbers. Pure arithmetic, no drawing, so the signs, the chalk bag
// and the slide rides all read the same physics.
//   Frame `chimney`: deck 40 at y = 0, x spinward, z toward the back cap, y up (toward the axis). Deck 40 + k is y = 4k.
//   A falling thing drifts anti by dropDrift(h, r) (src/core/drum.js, the docs' formula).
//   A rider on a slide feels the drum's own free motion (freeAccel): going spinward adds weight, going anti takes it
//   away, and coming down pushes you anti. So the spinward slide presses you in and holds you back, the anti one lifts
//   you and pushes you on, and the one along the axis is the fair one.
import { deckRadius, gAt, dropDrift, DRUM } from '../core/drum.js';

export const D0 = 40;                            // the floor's deck
export const R0 = deckRadius(D0);                // 2,844 m
export const G0 = gAt(R0);                       // 0.948 g
export const V0 = DRUM.OMEGA * R0;               // the floor's own speed round the axis, m/s
export const MAT_TOP = 0.3;                      // the mat's top face
export const SHAFT_TOP = 32;                     // the lamp ceiling

// how far anti a thing dropped from height y (frame metres) lands on the mat, and how long it falls
export function driftFrom(y) { const h = Math.max(0, y - MAT_TOP); return dropDrift(h, R0 - (y + MAT_TOP) / 2); }
export function fallTime(y) { const h = Math.max(0, y - MAT_TOP); return Math.sqrt(2 * h / (9.81 * gAt(R0 - (y + MAT_TOP) / 2))); }
export function gOfDeck(d) { return gAt(deckRadius(d)); }
export function cm(m) { return Math.round(m * 100); }
export function f2(m) { return (Math.round(m * 100) / 100).toFixed(2); }

// ---------------------------------------------------------------------------------------------------------------
// The three slides. Each is a Catmull-Rom curve through plan points [x, z] from its mouth on the tower's platform to its
// run-out over a pit, sampled every 0.2 m; the height falls with distance, steeper at the top and gentle at the end.
// ---------------------------------------------------------------------------------------------------------------
export const TOWER = { cx: 0, cz: -16, top: 16 };
export const SLIDES = {
  sink: { id: 'sink', name: 'Sink', way: 'spinward', col: '#d4452c', lip: '#f3e6c8', inner: '#e8603f', dir: 1,
    plan: [[5.4, -16.5], [9, -16.5], [14, -18.4], [19.5, -16], [25, -13.8], [30.5, -15.6], [35, -18], [38.5, -18.5], [41, -18.5]],
    pit: [36, -22.4, 43, -14.6] },
  float: { id: 'float', name: 'Float', way: 'anti', col: '#2f97b4', lip: '#f3e6c8', inner: '#46b2cc', dir: -1,
    plan: [[-5.4, -16.5], [-9, -16.5], [-14, -18.4], [-19.5, -16], [-25, -13.8], [-30.5, -15.6], [-35, -18], [-38.5, -18.5], [-41, -18.5]],
    pit: [-43, -22.4, -36, -14.6] },
  true: { id: 'true', name: 'True', way: 'along the axis', col: '#e2ae2e', lip: '#2c3a40', inner: '#f0c24a', dir: 0,
    plan: [[0, -20.4], [0, -23], [2.4, -27.8], [3.6, -33], [1, -38.2], [-2.8, -42.4], [-3.6, -47], [-1, -51.6], [0, -54.6]],
    pit: [-4, -58.4, 4, -50.4] },
};
export const START_Y = TOWER.top + 0.32, END_Y = 0.95;

function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return [0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3));
}
const cache = new Map();
// -> { pts: [[x, y, z], ...], s: [arc length], L }
export function slidePath(id) {
  if (cache.has(id)) return cache.get(id);
  const P = SLIDES[id].plan, n = P.length, plan = [];
  for (let i = 0; i < n - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n - 1, i + 2)];
    const seg = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), m = Math.max(4, Math.ceil(seg / 0.1));
    for (let j = 0; j < m; j++) plan.push(catmull(p0, p1, p2, p3, j / m));
  }
  plan.push(P[n - 1].slice());
  // even spacing in plan
  const acc = [0]; for (let i = 1; i < plan.length; i++) acc.push(acc[i - 1] + Math.hypot(plan[i][0] - plan[i - 1][0], plan[i][1] - plan[i - 1][1]));
  const Lp = acc[acc.length - 1], N = Math.ceil(Lp / 0.2), even = [];
  let k = 0;
  for (let i = 0; i <= N; i++) {
    const d = Lp * i / N; while (k < acc.length - 2 && acc[k + 1] < d) k++;
    const t = (d - acc[k]) / Math.max(1e-6, acc[k + 1] - acc[k]);
    even.push([plan[k][0] + (plan[k + 1][0] - plan[k][0]) * t, plan[k][1] + (plan[k + 1][1] - plan[k][1]) * t, d / Lp]);
  }
  // height: a short level mouth, a steep first third, a long even middle, a gentle run-out
  const ss = (a, b, u) => { const t = Math.max(0, Math.min(1, (u - a) / (b - a))); return t * t * (3 - 2 * t); };
  const w = (u) => 0.3 + 0.7 * ss(0.0, 0.08, u) - 0.62 * ss(0.84, 0.97, u);
  const W = []; let tot = 0; for (let i = 0; i <= N; i++) { W.push(tot); tot += w(i / N); }
  const pts = even.map((e, i) => [e[0], START_Y - (START_Y - END_Y) * (W[i] / W[N]), e[1]]);
  const s = [0]; for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  const out = { pts, s, L: s[s.length - 1] };
  cache.set(id, out);
  return out;
}
// point, unit tangent and curvature vector at arc length d
export function sampleAt(path, d, out) {
  const s = path.s, P = path.pts; d = Math.max(0, Math.min(path.L, d));
  let lo = 0, hi = s.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (s[m] <= d) lo = m; else hi = m; }
  const t = (d - s[lo]) / Math.max(1e-6, s[hi] - s[lo]);
  const a = P[lo], b = P[hi];
  out.x = a[0] + (b[0] - a[0]) * t; out.y = a[1] + (b[1] - a[1]) * t; out.z = a[2] + (b[2] - a[2]) * t;
  const i0 = Math.max(0, lo - 2), i1 = Math.min(P.length - 1, hi + 2);
  let tx = P[i1][0] - P[i0][0], ty = P[i1][1] - P[i0][1], tz = P[i1][2] - P[i0][2]; const l = Math.hypot(tx, ty, tz) || 1;
  out.tx = tx / l; out.ty = ty / l; out.tz = tz / l;
  // curvature from the tangents either side
  const j0 = Math.max(0, lo - 4), j1 = Math.min(P.length - 1, hi + 4), jm0 = Math.min(P.length - 1, j0 + 2), jm1 = Math.max(0, j1 - 2);
  const ta = [P[jm0][0] - P[j0][0], P[jm0][1] - P[j0][1], P[jm0][2] - P[j0][2]], tb = [P[j1][0] - P[jm1][0], P[j1][1] - P[jm1][1], P[j1][2] - P[jm1][2]];
  const la = Math.hypot(...ta) || 1, lb = Math.hypot(...tb) || 1, ds = Math.max(0.2, s[jm1] - s[jm0] + (la + lb) / 2);
  out.kx = (tb[0] / lb - ta[0] / la) / ds; out.ky = (tb[1] / lb - ta[1] / la) / ds; out.kz = (tb[2] / lb - ta[2] / la) / ds;
  return out;
}

// A rider going down. k: drag (a tucked child is lower), mu: friction of a rider in loan overalls on waxed glaze.
// step(dt) moves them on; the state carries what the ride shows: weight felt, speed, the push of the spin along the run.
export const SLIDE_MU = 0.3, SLIDE_K = 0.004;
export function rider(id, o = {}) {
  const path = slidePath(id), mu = o.mu === undefined ? SLIDE_MU : o.mu, k = o.k === undefined ? SLIDE_K : o.k;
  const st = { d: 0, v: o.v0 === undefined ? 2.2 : o.v0, t: 0, done: false, g: G0, push: 0, x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0, kx: 0, ky: 0, kz: 0, vmax: 0, gmin: 9, gmax: 0, lat: 0 };
  sampleAt(path, 0, st);
  st.step = (dt) => {
    let left = dt;
    while (left > 1e-6 && !st.done) {
      const h = Math.min(left, 1 / 240); left -= h;
      sampleAt(path, st.d, st);
      const vx = st.v * st.tx, vy = st.v * st.ty, r = R0 - st.y, w = vx / R0 + DRUM.OMEGA;
      const ax = 2 * R0 * vy * w / r, ay = -r * w * w;              // the drum's free motion (freeAccel), per unit mass
      const along = ax * st.tx + ay * st.ty;
      // what the trough has to push back: the part of the drum's pull across the run, plus the turn's centripetal
      const px = ax - along * st.tx, py = ay - along * st.ty, pz = -along * st.tz;
      const cx = st.v * st.v * st.kx, cy = st.v * st.v * st.ky, cz = st.v * st.v * st.kz;
      const N = Math.hypot(px - cx, py - cy, pz - cz);
      const a = along - mu * N - k * st.v * st.v;
      st.v = Math.max(0.6, st.v + a * h); st.d += st.v * h; st.t += h;
      st.g = N / 9.81; st.push = ax * st.tx; st.lat = Math.hypot(cx, cz) / 9.81;
      if (st.v > st.vmax) st.vmax = st.v; if (st.g < st.gmin) st.gmin = st.g; if (st.g > st.gmax) st.gmax = st.g;
      if (st.d >= path.L) { st.d = path.L; st.done = true; }
    }
    sampleAt(path, st.d, st);
    return st;
  };
  return st;
}
// the time of a fair run (no tuck, no push-off), for the boards
export function fairTime(id, o) { const r = rider(id, o); let n = 0; while (!r.done && n++ < 20000) r.step(1 / 60); return { T: r.t, vmax: r.vmax, gmin: r.gmin, gmax: r.gmax, L: slidePath(id).L }; }
