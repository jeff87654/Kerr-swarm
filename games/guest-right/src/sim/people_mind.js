// People: what they decide to do. The world gives spots (places to be), walkways (nav graphs), zones and the clock;
// this turns them into a population per frame with believable days: meals fill the hall, mornings the shops,
// evenings the court, the small hours empty the streets. People walk the paths to the spots they choose (keeping to
// the right, giving way to each other and to the player), stay a while, and move on. Named people keep their posts.
import { CAST } from '../content/cast.js';
import { PLACES } from '../content/places.js';
import { Rng, clamp, lerp, wrapPi, damp, hashStr } from '../core/util.js';

// Crowd magnets: at these times a share of everyone who can reach the place goes there. Extend freely.
export const MAGNETS = [
  { day: 1, from: 12.6, to: 14.4, place: 'hall', k: 0.45 },
  { day: 2, from: 18.8, to: 21.2, place: 'court', k: 0.45 },
  { day: 3, from: 5.4, to: 7.7, place: 'dawn-terrace', k: 0.7 },
  { day: 3, from: 8.0, to: 10.6, place: 'ledger', k: 0.75 },
  { day: 3, from: 12.6, to: 15.2, place: 'hall', k: 0.75 },
  { day: 3, from: 12.6, to: 15.2, place: 'green', k: 0.6 },
  { day: 3, from: 16.6, to: 17.7, place: 'court', k: 0.5 },
  { day: 3, from: 21.6, to: 24.0, place: 'spindle', k: 0.7 },
];
// Where named people are on particular days (on top of their work and home). from/to in hours.
export const CAST_DAYS = {
  // the Thursday: ramen at Marit's table at one, the letter at eight. The Quiet: the feast's making ready, the model dawn,
  // the Quiet reading, the block court at seven. Booking Day: the dawn, the Ledger, the question, the feast, the vote, the flight.
  marit: [
    { day: 1, from: 10, to: 15.5, place: 'hall' }, { day: 1, from: 17, to: 21.5, place: 'hall' },
    { day: 2, from: 9, to: 16, place: 'kitchen' }, { day: 2, from: 18.6, to: 20.2, place: 'court' }, { day: 2, from: 20.2, to: 23, place: 'hall' },
    { day: 3, from: 5.3, to: 7.7, place: 'dawn-terrace' }, { day: 3, from: 7.9, to: 10.5, place: 'ledger' }, { day: 3, from: 10.5, to: 16.6, place: 'hall' },
    { day: 3, from: 16.8, to: 18.4, place: 'court' }, { day: 3, from: 18.4, to: 21.3, place: 'hall' }, { day: 3, from: 21.5, to: 24, place: 'spindle' },
    { day: 4, from: 0, to: 1.4, place: 'spindle' }, { day: 4, from: 1.5, to: 3.2, place: 'elders-terrace' }, { day: 4, from: 6, to: 15, place: 'hall' },
  ],
  jory: [
    { day: 1, from: 19.4, to: 22.1, place: 'books' }, { day: 2, from: 13.6, to: 17.2, place: 'books' }, { day: 2, from: 18.6, to: 20.2, place: 'court' },
    { day: 3, from: 5.3, to: 7.7, place: 'dawn-terrace' }, { day: 3, from: 7.9, to: 10.5, place: 'ledger' }, { day: 3, from: 12.7, to: 16, place: 'hall' },
    { day: 3, from: 16.8, to: 18.4, place: 'court' }, { day: 3, from: 19.6, to: 21.4, place: 'books' }, { day: 3, from: 21.5, to: 24, place: 'spindle' }, { day: 4, from: 0, to: 1.4, place: 'spindle' },
  ],
  oona: [
    { day: 2, from: 9, to: 18, place: 'studio' }, { day: 3, from: 5.3, to: 8, place: 'dawn-terrace' }, { day: 3, from: 12.8, to: 15.5, place: 'hall' },
    { day: 3, from: 23.3, to: 24, place: 'elders-terrace' }, { day: 4, from: 0, to: 4.5, place: 'elders-terrace' },
  ],
  suvi: [{ day: 3, from: 5.3, to: 7.7, place: 'dawn-terrace' }],
  gideon: [{ day: 1, from: 12.4, to: 14.6, place: 'hall' }, { day: 2, from: 18.6, to: 20.2, place: 'court' }, { day: 3, from: 7.9, to: 10.5, place: 'ledger' }, { day: 3, from: 12.6, to: 16, place: 'hall' }],
  pilar: [{ day: 1, from: 12.4, to: 14.6, place: 'hall' }, { day: 3, from: 12.6, to: 16, place: 'hall' }],
  teodor: [{ day: 3, from: 12.6, to: 16, place: 'hall' }],
  clem: [{ day: 3, from: 11, to: 16, place: 'hall' }],
  ama: [{ day: 3, from: 12.6, to: 16, place: 'hall' }],
  yoav: [{ day: 3, from: 7.9, to: 10.3, place: 'ledger' }, { day: 3, from: 12.6, to: 16, place: 'hall' }],
  agathe: [{ day: 3, from: 7.5, to: 11, place: 'ledger' }],
  hollis: [{ day: 3, from: 7.8, to: 11, place: 'ledger' }], yusra: [{ day: 3, from: 7.8, to: 11, place: 'ledger' }],
  halima: [{ day: 2, from: 18.5, to: 21.5, place: 'court' }, { day: 3, from: 21.5, to: 24, place: 'spindle' }],
  matti: [{ day: 2, from: 18.6, to: 20.2, place: 'court' }], mags: [{ day: 2, from: 18.6, to: 20.2, place: 'court' }],
  arturo: [{ day: 2, from: 18.6, to: 20.4, place: 'court' }], nell: [{ day: 2, from: 18.6, to: 20.4, place: 'court' }],
  idris: [{ day: 2, from: 18.6, to: 20.2, place: 'court' }], mina: [{ day: 2, from: 18.6, to: 20.2, place: 'court' }],
  augusta: [{ day: 3, from: 5.3, to: 7.7, place: 'dawn-terrace' }, { day: 4, from: 1.3, to: 3.2, place: 'elders-terrace' }],
  salo: [{ day: 3, from: 5.3, to: 7.7, place: 'dawn-terrace' }, { day: 4, from: 1.3, to: 3.2, place: 'elders-terrace' }],
  ivo: [{ day: 3, from: 5.3, to: 7.7, place: 'dawn-terrace' }],
  esi: [{ day: 3, from: 5.4, to: 7.6, place: 'dawn-terrace' }], pip: [{ day: 3, from: 5.4, to: 7.6, place: 'dawn-terrace' }, { day: 3, from: 21.5, to: 24, place: 'spindle' }],
  kwame: [{ day: 3, from: 21.5, to: 24, place: 'spindle' }],
  marisol: [{ day: 3, from: 4.6, to: 9, place: 'dawn-terrace' }],
  bertil: [{ day: 3, from: 20.5, to: 24, place: 'sleeve-hire' }, { day: 4, from: 0, to: 2, place: 'sleeve-hire' }],
  rufus: [{ day: 3, from: 12, to: 18, place: 'bandstand' }], kofi: [{ day: 3, from: 12, to: 18, place: 'bandstand' }],
  connie: [{ day: 1, from: 19, to: 22, place: 'court' }, { day: 2, from: 19, to: 22, place: 'court' }, { day: 3, from: 21.5, to: 24, place: 'spindle' }],
  ayo: [{ day: 3, from: 21.5, to: 24, place: 'spindle' }],
};

const has = (s, t) => s.tags && s.tags.indexOf(t) >= 0;
export function catOf(s) {
  switch (s.type) {
    case 'sit': return has(s, 'eat') ? 'meal' : has(s, 'read') ? 'read' : 'sit';
    case 'stand': return has(s, 'board') || has(s, 'read') ? 'read' : 'stand';
    case 'chat': return 'chat';
    case 'customer': case 'browse': case 'queue': return 'shop';
    case 'counter': case 'work': return 'work';
    case 'play': return 'play';
    case 'perform': return 'perform';
    case 'bath': return 'bath';
    case 'bed': return 'bed';
    default: return 'stand';
  }
}
export const WORK_TAGS = ['cook', 'plate', 'wash', 'pull-noodles', 'mend', 'sew', 'dye', 'carve', 'tune', 'sweep', 'write', 'stall', 'porter', 'crew', 'notes', 'serve'];
const PLAY_TAGS = ['run', 'hop', 'catch', 'floor', 'spin'];
const PERFORM_TAGS = ['flute', 'sing', 'drum'];

// ---------------------------------------------------------------------------------------------------------------
// Indexing the world: per frame, its spots (with floor, seat and table heights, zone, nearest walkway node,
// neighbours), its walkways (with portals: the ends where people come and go) and its places.
// ---------------------------------------------------------------------------------------------------------------
// A scope that manages itself (a city block) is left out until it says it is ready.
const waiting = (sc) => !!(sc && sc.managed && !sc.live);
const newFrameInfo = (f) => ({ id: f.id, frame: f, spots: [], byCat: {}, people: [], places: new Map(), crowd: new Map(), nodes: [], portals: [], pathLen: 0, managed: 0 });
export function indexWorld(game) {
  const W = game.world, frames = new Map();
  const fiFor = (f) => { let fi = frames.get(f.id); if (!fi) frames.set(f.id, fi = newFrameInfo(f)); return fi; };
  const live = new Set();
  for (const s of W.spots) if (s.frame && s.type && isFinite(s.x) && isFinite(s.y) && isFinite(s.z) && !waiting(s.scope)) { const fi = fiFor(s.frame); fi.spots.push(s); if (s.scope && s.scope.managed && !live.has(s.scope)) { live.add(s.scope); fi.managed++; } }
  for (const [id, nav] of W.navs) if (nav.nodes.length && W.frames.get(id)) fiFor(W.frames.get(id));
  for (const zn of W.zones) if (zn.frame && !waiting(zn.scope)) { const fi = frames.get(zn.frame.id); if (!fi) continue; for (const key of [zn.place, zn.id]) { if (!key) continue; let a = fi.places.get(key); if (!a) fi.places.set(key, a = []); if (a.indexOf(zn) < 0) a.push(zn); } }
  for (const fi of frames.values()) finishFrame(game, fi);
  return frames;
}
function areaOf(place, frameId) { const P = place && PLACES[place]; return P ? P.area : frameId; }
// The walkways of a frame: every node's zone, the total length, and the ends where people come and go.
// fresh: only nodes that have not been looked at yet get their zone worked out.
function navInfo(game, fi, fresh) {
  const W = game.world, f = fi.frame, nav = W.nav(f);
  fi.nav = nav; fi.nodes = nav.nodes; fi.col = W.colliders(f);
  let len = 0;
  for (const n of nav.nodes) {
    for (const l of n.links) len += l.d * 0.5;
    if (fresh && n._zone !== undefined && !(n._zone && n._zone.scope && !n._zone.scope.active)) continue;
    const zn = W.zoneAt(f, n.x, n.y + 0.6, n.z); n._zone = zn; n._place = zn ? (zn.place || zn.id) : null;
  }
  fi.pathLen = len;
  // portals: walkway ends, preferably on streets and avenues
  const ends = nav.nodes.filter((n) => n.links.length === 1);
  const streety = ends.filter((n) => { const P = n._place && PLACES[n._place]; return !P || P.kind === 'avenue' || P.kind === 'street' || P.kind === 'platform' || P.kind === 'atrium' || P.kind === 'lobby'; });
  fi.portals = streety.length ? streety : ends.length ? ends : nav.nodes.slice();
  fi.astar = null;
}
function finishFrame(game, fi) {
  navInfo(game, fi, false);
  spotInfo(game, fi, fi.spots);
  spotNeighbours(fi.spots);
}

// One scope at a time (city blocks, which come and go while people are about).
// indexScope: add a scope's spots, zones and walkways to its frame's index. Returns { fi, spots, nodes }.
export function indexScope(game, frames, scope) {
  const W = game.world, f = scope.frame; let fi = frames.get(f.id);
  if (!fi) { fi = newFrameInfo(f); frames.set(f.id, fi); }
  // a region that was taken down and built again has a new frame under the old name
  if (fi.frame !== f) { fi.frame = f; for (const p of fi.people) p.frame = f; fi.spots = []; fi.byCat = {}; fi.places = new Map(); fi.crowd = new Map(); fi.managed = 0; }
  fi.managed++;
  for (const zn of W.zones) if (zn.scope === scope) for (const key of [zn.place, zn.id]) { if (!key) continue; let a = fi.places.get(key); if (!a) fi.places.set(key, a = []); if (a.indexOf(zn) < 0) a.push(zn); fi.crowd.delete(key); }
  navInfo(game, fi, true);
  const added = [];
  for (const s of W.spots) if (s.scope === scope && s.type && isFinite(s.x) && isFinite(s.y) && isFinite(s.z)) added.push(s);
  const nodes = fi.nav.nodes.filter((n) => n.owner === scope);
  return { fi, spots: [], todo: added, nodes };
}
// ...its spots are then read in a few at a time: indexSpots(game, job, n) returns true when the last has been done.
export function indexSpots(game, job, n) {
  const part = job.todo.splice(0, n), fi = job.fi;
  for (const s of part) fi.spots.push(s);
  spotInfo(game, fi, part, job.nodes);
  for (const s of part) job.spots.push(s);
  if (job.todo.length) return false;
  spotNeighbours(job.spots);
  return true;
}
// unindexScope: forget a scope's spots and zones (call before the scope is disposed, then refreshFrame once it has gone).
export function unindexScope(game, frames, scope) {
  const fi = frames.get(scope.frame.id); if (!fi) return null;
  fi.managed = Math.max(0, fi.managed - 1);
  fi.spots = fi.spots.filter((s) => s.scope !== scope);
  for (const k in fi.byCat) fi.byCat[k] = fi.byCat[k].filter((s) => s.scope !== scope);
  for (const [key, a] of [...fi.places]) { const b = a.filter((zn) => zn.scope !== scope); if (b.length !== a.length) { fi.crowd.delete(key); if (b.length) fi.places.set(key, b); else fi.places.delete(key); } }
  for (const s of fi.spots) {
    const pp = s.pp, lk = pp.link;
    if (lk && (lk.a.owner === scope || lk.b.owner === scope)) { pp.link = null; pp.relink = true; }
    if (pp.zone && pp.zone.scope === scope) { pp.zone = null; pp.place = null; pp.zoneId = null; }
  }
  return fi;
}
// refreshFrame: after scopes have gone, read the frame's walkways again and re-seat what leaned on them.
export function refreshFrame(game, fi) {
  navInfo(game, fi, true);
  for (const s of fi.spots) if (s.pp.relink) { s.pp.relink = false; const lk = nearestLink(fi, s.x, s.pp.floor, s.z, 14); if (lk) { s.pp.link = lk; s.pp.nodeD = lk.d; } else s.pp.nodeD = 1e9; }
}

// What people need to know about a spot: its kind, the floor under it, seat and table heights, its zone and nearest walkway.
// nodes: look for each spot's walkway among these only (a scope's own), not the whole frame's.
function spotInfo(game, fi, list, nodes) {
  const W = game.world, f = fi.frame, col = fi.col, src = nodes ? { nav: { nodes } } : fi;
  {
  for (const s of list) {
    const pp = s.pp = { cat: catOf(s), floor: s.y, seatH: 0, tableH: 0, workH: 0.9, node: null, nodeD: 1e9, nbr: [], place: null, area: null, zone: null, face: s.yaw || 0, tag: null };
    const seat = s.type === 'sit' || s.type === 'bath' || s.type === 'bed';
    if (seat) {
      const gr = col.ground(s.x, s.z, s.y - (s.type === 'bed' ? 0.25 : 0.12), 0.05);
      pp.floor = gr && s.y - gr.y < 1.2 ? gr.y : s.y - (s.type === 'bed' ? 0.5 : s.type === 'bath' ? 0.45 : 0.46);
      pp.seatH = s.y - pp.floor;
    } else {
      const gr = col.ground(s.x, s.z, s.y + 0.3, 0.05); pp.floor = gr && Math.abs(gr.y - s.y) < 0.5 ? gr.y : s.y;
    }
    const fx = Math.sin(s.yaw || 0), fz = Math.cos(s.yaw || 0);
    if (seat && s.type === 'sit') {
      for (const d of [0.42, 0.52, 0.34, 0.62]) { const g = col.ground(s.x + fx * d, s.z + fz * d, s.y + 0.5, 0.04); if (g && g.y > s.y + 0.12 && g.y < s.y + 0.5) { pp.tableH = g.y - pp.floor; break; } }
    } else if (s.type === 'counter' || s.type === 'work' || s.type === 'customer' || s.type === 'stand') {
      for (const d of [0.45, 0.6, 0.35, 0.75]) { const g = col.ground(s.x + fx * d, s.z + fz * d, pp.floor + 1.3, 0.04); if (g && g.y > pp.floor + 0.55 && g.y < pp.floor + 1.25) { pp.workH = g.y - pp.floor; pp.surface = true; break; } }
    }
    const zn = W.zoneAt(f, s.x, pp.floor + 0.6, s.z); pp.zone = zn; pp.place = zn ? (zn.place || zn.id) : null; pp.area = areaOf(zn && zn.place, f.id);
    pp.zoneId = zn ? zn.id : null;
    const lk = nearestLink(src, s.x, pp.floor, s.z, 14); if (lk) { pp.link = lk; pp.nodeD = lk.d; }
    if (s.tags) { for (const t of s.tags) if (WORK_TAGS.indexOf(t) >= 0 || PLAY_TAGS.indexOf(t) >= 0 || PERFORM_TAGS.indexOf(t) >= 0 || t === 'dance' || t === 'rail') { pp.tag = t; break; } }
    (fi.byCat[pp.cat] || (fi.byCat[pp.cat] = [])).push(s);
  }
  }
}
// neighbours (tables, benches, groups) and chat groups facing their middle, among the given spots
function spotNeighbours(spots) {
  const grid = new Map(); const key = (x, z) => Math.floor(x / 3) * 7919 + Math.floor(z / 3);
  for (const s of spots) { const k = key(s.x, s.z); let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(s); }
  for (const s of spots) {
    // spots too close to share
    for (let ix = -1; ix <= 1; ix++) for (let iz = -1; iz <= 1; iz++) { const a = grid.get(key(s.x + ix * 3, s.z + iz * 3)); if (a) for (const o of a) if (o !== s && Math.abs(o.y - s.y) < 1 && Math.abs(o.x - s.x) < 0.52 && Math.abs(o.z - s.z) < 0.52 && o.type !== 'bed') (s.pp.close || (s.pp.close = [])).push(o); }
    if (s.type !== 'sit' && s.type !== 'chat' && s.type !== 'stand' && s.type !== 'bath') continue;
    const r = s.type === 'chat' ? 3.4 : s.type === 'stand' ? 2.2 : 2.0;
    for (let ix = -1; ix <= 1; ix++) for (let iz = -1; iz <= 1; iz++) {
      const a = grid.get(key(s.x + ix * 3, s.z + iz * 3)); if (!a) continue;
      for (const o of a) if (o !== s && Math.abs(o.y - s.y) < 1 && Math.hypot(o.x - s.x, o.z - s.z) < r && (o.type === s.type || (s.type === 'chat' && o.type === 'stand'))) s.pp.nbr.push(o);
    }
  }
  for (const s of spots) if (s.type === 'chat' && s.pp.nbr.length) {
    let cx = s.x, cz = s.z, n = 1; for (const o of s.pp.nbr) if (o.type === 'chat') { cx += o.x; cz += o.z; n++; }
    cx /= n; cz /= n; if (Math.hypot(cx - s.x, cz - s.z) > 0.2) s.pp.face = Math.atan2(cx - s.x, cz - s.z);
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Walkway routes: A* with a binary heap over a frame's nav nodes
// ---------------------------------------------------------------------------------------------------------------
function astarScratch(fi) {
  fi.nodes = fi.nav.nodes;
  const n = fi.nodes.length;
  if (!fi.astar || fi.astar.n !== n) { fi.nodes.forEach((nd, i) => { nd._i = i; }); fi.astar = { n, g: new Float64Array(n), f: new Float64Array(n), came: new Int32Array(n), stamp: new Uint32Array(n), closed: new Uint32Array(n), run: 0, heap: [] }; }
  return fi.astar;
}
export function route(fi, a, b) {
  if (!a || !b) return null; if (a === b) return [a];
  const S = astarScratch(fi), N = fi.nodes; S.run++; const run = S.run, H = S.heap; H.length = 0;
  const h = (n) => Math.hypot(n.x - b.x, n.y - b.y, n.z - b.z);
  const push = (i) => { H.push(i); let k = H.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (S.f[H[p]] <= S.f[H[k]]) break; const t = H[p]; H[p] = H[k]; H[k] = t; k = p; } };
  const pop = () => { const top = H[0], last = H.pop(); if (H.length) { H[0] = last; let k = 0; for (;;) { const l = k * 2 + 1, r = l + 1; let m = k; if (l < H.length && S.f[H[l]] < S.f[H[m]]) m = l; if (r < H.length && S.f[H[r]] < S.f[H[m]]) m = r; if (m === k) break; const t = H[m]; H[m] = H[k]; H[k] = t; k = m; } } return top; };
  const ai = a._i, bi = b._i; if (ai === undefined || bi === undefined || N[ai] !== a || N[bi] !== b) { if (fi._retry) return null; fi.astar = null; fi._retry = true; const r = route(fi, a, b); fi._retry = false; return r; }
  S.stamp[ai] = run; S.g[ai] = 0; S.f[ai] = h(a); S.came[ai] = -1; push(ai);
  let iter = 0;
  while (H.length && iter++ < 20000) {
    const ci = pop(); if (S.closed[ci] === run) continue; S.closed[ci] = run;
    if (ci === bi) { const out = []; let k = ci; while (k >= 0) { out.push(N[k]); k = S.came[k]; } return out.reverse(); }
    const cn = N[ci];
    for (const l of cn.links) {
      const ti = l.to._i; if (ti === undefined || N[ti] !== l.to) continue; if (S.closed[ti] === run) continue;
      const g = S.g[ci] + l.d;
      if (S.stamp[ti] !== run || g < S.g[ti]) { S.stamp[ti] = run; S.g[ti] = g; S.f[ti] = g + h(l.to); S.came[ti] = ci; push(ti); }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------------------------------------------
// The clock
// ---------------------------------------------------------------------------------------------------------------
export function nowMin(game) { return (game.clock.day - 1) * 1440 + game.clock.minutes; }

// Weights for what an anonymous person wants to do now.
export function wantsFor(p, hour, day, fi, magnet) {
  const L = p.body.L, child = L.child, elder = L.elder, W = WANT;
  const night = hour >= 23.2 || hour < 6.4, late = hour >= 22 && !night, early = hour >= 6.4 && hour < 7.2;
  const q = day === 2;
  W.meal = (hour >= 7 && hour < 8.7) ? 1.0 : (hour >= 12.4 && hour < 14.1) ? 3.2 : (hour >= 18.4 && hour < 20.6) ? 2.8 : 0.03;
  if (q && W.meal > 0.5) W.meal *= 1.3;
  W.shop = night ? 0 : hour >= 8 && hour < 19.5 ? (hour < 12.4 ? 1.6 : 0.9) : 0.08;
  W.sit = (elder ? 1.7 : child ? 0.25 : 0.55) * (q ? 1.8 : 1) * (night ? 0.15 : 1);
  W.chat = (hour >= 17 && hour < 23 ? 1.4 : 0.7) * (q ? 2.1 : 1) * (elder ? 1.3 : child ? 0.4 : 1) * (night ? 0.1 : 1);
  W.stand = 0.35 * (night ? 0.2 : 1);
  W.read = (q ? 0.5 : 0.3) * (child ? 0.4 : 1) * (night ? 0.1 : 1);
  W.play = child && hour >= 7.5 && hour < 20.5 ? 3.2 : 0;
  W.work = !child && L.age < 86 && hour >= 7.2 && hour < 19 ? (q ? 0.5 : 1.0) : 0;
  W.perform = !child && L.age < 88 && hour >= 17.5 && hour < 23 ? 2.2 : 0.02;
  W.bath = night ? 0 : hour >= 7 && hour < 22 ? 0.45 : 0.05;
  W.bed = night ? 1.5 : 0;
  W.wander = night ? 0.25 : early ? 1.6 : 0.9;
  W.sweep = night && !child && L.age < 80 ? 0.45 : early ? 0.15 : 0;
  W.away = night ? 7 + (late ? 0 : 3) : late ? 1.8 : early ? 0.35 : 0.22;
  if (L.age < 6 && (hour >= 20 || hour < 7.5)) W.away += 6;
  W.magnet = magnet ? magnet.k * 14 : 0;
  // only what exists here (and has room) counts
  for (const k in W) if (k !== 'wander' && k !== 'away' && k !== 'magnet' && k !== 'sweep') { const a = fi.byCat[k]; if (!a || !a.length || (fi.free && fi.free[k] === 0)) W[k] = 0; }
  return W;
}
const WANT = {};
export function pickKey(rng, W) { let sum = 0; for (const k in W) sum += W[k]; let u = rng.next() * sum; for (const k in W) { u -= W[k]; if (u <= 0) return k; } return 'wander'; }

export function activeMagnet(fi, day, hour, list) {
  for (const m of list) if (m.day === day && hour >= m.from && hour < m.to && fi.places.has(m.place)) return m;
  return null;
}

// ---------------------------------------------------------------------------------------------------------------
// Choosing and taking spots
// ---------------------------------------------------------------------------------------------------------------
export function spotFree(s, p) {
  if (s.taken && s.taken !== p) return false;
  if (s.who && !(p && s.who === p.castId)) return false;
  const c = s.pp && s.pp.close; if (c) for (let i = 0; i < c.length; i++) { const q = c[i].taken; if (q && q !== p) return false; }
  return true;
}
function scoreSpot(p, s, d) { return 1 / (1 + d / 30) * (0.55 + 0.45 * Math.random()); }
// find a spot for person p in category cat (or in place for a magnet), near them
export function findSpot(M, p, cat, place) {
  const fi = p.fi; let list;
  if (place) {
    list = [];
    for (const s of fi.spots) if (s.pp.place === place && s.pp.cat !== 'bed' && s.pp.cat !== 'work' && s.pp.cat !== 'perform' && spotFree(s, p)) list.push(s);
    const crowd = crowdPoints(M, fi, place); for (const s of crowd) if (!s.taken) list.push(s);
  } else list = fi.byCat[cat];
  if (!list || !list.length) return null;
  let best = null, bs = -1;
  const tries = Math.min(list.length, 14);
  for (let i = 0; i < tries; i++) {
    const s = list[(Math.random() * list.length) | 0];
    if (!spotFree(s, p)) continue;
    if (cat === 'play' && !p.body.L.child) continue;
    if (s.pp.blocked) continue;
    const d = Math.hypot(s.x - p.x, s.z - p.z) + Math.abs(s.pp.floor - p.y) * 3;
    let sc = scoreSpot(p, s, d);
    if (cat === 'meal' && !s.pp.tableH) sc *= 0.3;
    if (sc > bs) { bs = sc; best = s; }
  }
  return best;
}
// standing places for crowds in a place that has few spots: a loose grid over its floor, facing what is there to face
export function crowdPoints(M, fi, place) {
  let pts = fi.crowd.get(place); if (pts) return pts;
  pts = []; fi.crowd.set(place, pts);
  const zones = fi.places.get(place); if (!zones) return pts;
  const col = fi.col, rng = new Rng(hashStr(place + fi.id));
  for (const zn of zones) {
    const area = (zn.x1 - zn.x0) * (zn.z1 - zn.z0); const want = clamp(Math.round(area / 3.2), 4, 160);
    // what to face: a performer's or keeper's spot, or the zone's middle
    let fx = (zn.x0 + zn.x1) / 2, fz = (zn.z0 + zn.z1) / 2;
    const foc = fi.spots.find((s) => s.pp.zone === zn && (s.type === 'perform' || (s.tags && s.tags.indexOf('focus') >= 0)));
    if (foc) { fx = foc.x; fz = foc.z; }
    for (let k = 0; k < want * 4 && pts.length < want * 1.0 + 0; k++) {
      const x = rng.f(zn.x0 + 0.6, zn.x1 - 0.6), z = rng.f(zn.z0 + 0.6, zn.z1 - 0.6);
      const gy = col.ground(x, z, zn.y0 + 1.2, 0.3); if (!gy || gy.y < zn.y0 - 0.6) continue;
      const hi = col.ground(x, z, gy.y + 1.8, 0.32); if (hi && hi.y > gy.y + 0.05) continue;       // something stands here
      let ok = true; for (const q of pts) if (Math.abs(q.x - x) < 0.75 && Math.abs(q.z - z) < 0.75) { ok = false; break; }
      if (!ok) continue;
      for (const s of fi.spots) if (Math.abs(s.x - x) < 0.7 && Math.abs(s.z - z) < 0.7) { ok = false; break; }
      if (!ok) continue;
      const yaw = Math.atan2(fx - x, fz - z) + rng.f(-0.35, 0.35);
      const s = { type: 'stand', frame: fi.frame, x, y: gy.y, z, yaw, tags: ['crowd'], taken: null, crowd: true };
      s.pp = { cat: 'stand', floor: gy.y, seatH: 0, tableH: 0, workH: 0.9, link: nearestLink(fi, x, gy.y, z, 16), nodeD: 0, nbr: [], place, area: areaOf(zn.place, fi.id), zone: zn, face: yaw, tag: null };
      if (s.pp.link) s.pp.nodeD = s.pp.link.d;
      pts.push(s);
    }
  }
  // neighbours, so a crowd talks among itself
  for (const s of pts) for (const o of pts) if (o !== s && Math.hypot(o.x - s.x, o.z - s.z) < 1.6) s.pp.nbr.push(o);
  return pts;
}
export function takeSpot(p, s) { if (p.spot && p.spot !== s && p.spot.taken === p) p.spot.taken = null; p.spot = s; if (s) s.taken = p; }
export function releaseSpot(p) { if (p.spot && p.spot.taken === p) p.spot.taken = null; p.spot = null; }

// ---------------------------------------------------------------------------------------------------------------
// The pose a spot asks for
// ---------------------------------------------------------------------------------------------------------------
export function poseForSpot(p, s, hour, day) {
  const pp = s.pp, L = p.body.L, r = p.r1;
  p.tag = pp.tag; p.seatH = pp.seatH; p.tableH = pp.tableH; p.workH = pp.workH;
  if (pp.tag === 'dance' || (pp.place === 'third-terrace' && (s.type === 'stand' || s.type === 'chat'))) return 'dance';
  switch (s.type) {
    case 'sit': {
      if (has(s, 'eat') && pp.tableH && isMeal(hour)) return 'eat';
      if (pp.tag && WORK_TAGS.indexOf(pp.tag) >= 0) return 'work';
      if (pp.tag && PERFORM_TAGS.indexOf(pp.tag) >= 0) return 'perform';
      if (has(s, 'read') || pp.place === 'books') return 'read';
      if (L.child && pp.seatH < 0.05) return 'sitfloor';
      const u = Math.random();
      if (day !== 2 && !L.elder && u < 0.08) return 'device';
      if (pp.tableH && u < 0.35) return 'drink';
      if (u < 0.45 && !L.child) return 'read';
      return 'sittalk';
    }
    case 'chat': return 'talk';
    case 'stand': {
      if (has(s, 'board') || has(s, 'read')) return 'readboard';
      if (pp.tag === 'rail' || has(s, 'rail') || has(s, 'lean')) return 'lean';
      if (pp.tag && WORK_TAGS.indexOf(pp.tag) >= 0) return 'work';
      if (day !== 2 && !L.elder && Math.random() < 0.06) return 'device';
      return pp.nbr.length ? 'talk' : 'stand';
    }
    case 'customer': return 'customer';
    case 'browse': return 'browse';
    case 'queue': return 'queue';
    case 'counter': if (!pp.tag) return 'counter'; p.tag = pp.tag; return WORK_TAGS.indexOf(pp.tag) >= 0 ? 'work' : 'counter';
    case 'work': if (!p.tag) p.tag = pp.surface ? (r < 0.3 ? 'stall' : r < 0.5 ? 'write' : r < 0.7 ? 'plate' : 'crew') : 'crew'; return 'work';
    case 'play': if (!p.tag) p.tag = PLAY_TAGS[Math.floor(p.r2 * PLAY_TAGS.length)]; return 'play';
    case 'perform': if (!p.tag) p.tag = PERFORM_TAGS[(Math.abs(Math.round(s.x * 7 + s.z * 13)) % 3)]; if (p.tag === 'drum' && pp.seatH < 0.2) p.seatH = 0; return 'perform';
    case 'bath': return 'bath';
    case 'bed': return 'bed';
    default: return 'stand';
  }
}
export function isMeal(h) { return (h >= 6.9 && h < 8.9) || (h >= 12.2 && h < 14.4) || (h >= 18.2 && h < 20.9); }
// how long to stay, in game minutes
export function stayFor(p, s, cat, hour) {
  const L = p.body.L, u = Math.random();
  switch (cat) {
    case 'meal': return isMeal(hour) ? 25 + 35 * u : 8 + 15 * u;
    case 'shop': return 4 + 12 * u;
    case 'sit': return (L.elder ? 25 : 10) + 30 * u;
    case 'chat': return 10 + 30 * u;
    case 'stand': return 4 + 14 * u;
    case 'read': return 10 + 25 * u;
    case 'play': return 12 + 30 * u;
    case 'work': return 60 + 120 * u;
    case 'perform': return 40 + 60 * u;
    case 'bath': return 20 + 35 * u;
    case 'bed': { const h = hour < 12 ? hour : hour - 24; return clamp((6.6 - h) * 60, 30, 600) + 20 * u; }
    case 'magnet': return 30 + 40 * u;
    default: return 6 + 10 * u;
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Named people: where they should be now
// ---------------------------------------------------------------------------------------------------------------
const COOKS = { hall: 1, kitchen: 1 };
export function castPlan(id, day, hour) {
  const c = CAST[id]; if (!c || c.offstage) return null;
  const extra = CAST_DAYS[id];
  if (extra) for (const e of extra) if (e.day === day && hour >= e.from && hour < e.to) return { place: e.place, kind: 'event' };
  const L = c.look || {}, child = c.age < 15, elder = c.age >= 85;
  if (hour >= 23.2 || hour < 6.5) return c.home ? { place: c.home, kind: 'night' } : null;
  if (child) {
    if (c.work && hour >= 8.5 && hour < 15 && day !== 2) return { place: c.work, kind: 'work' };
    if (hour < 20) return { place: 'court', kind: 'play', alt: c.home };
    return c.home ? { place: c.home, kind: 'home' } : null;
  }
  const w = c.work;
  if (w) {
    const cook = COOKS[w];
    const on = cook ? ((hour >= 9.5 && hour < 14.8) || (hour >= 17 && hour < 21.2)) : elder ? (hour >= 7 && hour < 21.5) : (hour >= 8 && hour < 18.6);
    if (on) return { place: w, kind: 'work' };
  }
  if (c.home && hour >= 6.5 && hour < 23.2) return { place: c.home, kind: 'home', alt: 'court' };
  return null;
}

// ---------------------------------------------------------------------------------------------------------------
// Walking along a route
// ---------------------------------------------------------------------------------------------------------------
// The nearest point on any walkway link: { a, b, t, x, y, z, d, w }
export function nearestLink(fi, x, y, z, maxD) {
  let best = null, bd = maxD * maxD;
  const N = fi.nav.nodes;
  for (let i = 0; i < N.length; i++) {
    const n = N[i];
    for (let j = 0; j < n.links.length; j++) {
      const l = n.links[j], m = l.to;
      const ax = m.x - n.x, az = m.z - n.z, l2 = ax * ax + az * az;
      // a cheap box test first
      const lo = Math.min(n.x, m.x) - maxD, hi = Math.max(n.x, m.x) + maxD; if (x < lo || x > hi) continue;
      const lz = Math.min(n.z, m.z) - maxD, hz = Math.max(n.z, m.z) + maxD; if (z < lz || z > hz) continue;
      let t = l2 > 1e-9 ? ((x - n.x) * ax + (z - n.z) * az) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const px = n.x + ax * t, pz = n.z + az * t, py = n.y + (m.y - n.y) * t, dy = (py - y) * 3;
      const d = (px - x) * (px - x) + (pz - z) * (pz - z) + dy * dy;
      if (d < bd) { bd = d; best = { a: n, b: m, t, x: px, y: py, z: pz, w: l.width || 1.6 }; }
    }
    if (!n.links.length) { const dy = (n.y - y) * 3, d = (n.x - x) * (n.x - x) + (n.z - z) * (n.z - z) + dy * dy; if (d < bd) { bd = d; best = { a: n, b: n, t: 0, x: n.x, y: n.y, z: n.z, w: 1.6 }; } }
  }
  if (best) best.d = Math.sqrt(bd);
  return best;
}
const D2 = (a, b) => (a.x - b.x) * (a.x - b.x) + (a.z - b.z) * (a.z - b.z);
const wpOf = (q, w, zone) => ({ x: q.x, y: q.y, z: q.z, w, zone, node: q.links ? q : null });
// Build the waypoint list from the person's position to a target point through the walkway graph. tl: the target's
// nearest link (or a node), if known.
export function planRoute(fi, p, tx, ty, tz, tl) {
  const S = nearestLink(fi, p.x, p.y, p.z, 18);
  let T = tl;
  if (T && T.links) T = { a: T, b: T, t: 0, x: T.x, y: T.y, z: T.z, w: 1.6, d: 0 };
  if (!T) T = nearestLink(fi, tx, ty, tz, 14);
  const pts = [];
  const tgt = { x: tx, z: tz };
  if (S && T) {
    const same = (S.a === T.a && S.b === T.b) || (S.a === T.b && S.b === T.a);
    if (S.d > 0.7) pts.push(wpOf(S, S.w, (S.t < 0.5 ? S.a : S.b)._zone));
    if (!same) {
      const sOrder = D2(S.a, tgt) <= D2(S.b, tgt) ? [S.a, S.b] : [S.b, S.a];
      const tOrder = D2(T.a, p) <= D2(T.b, p) ? [T.a, T.b] : [T.b, T.a];
      let r = null;
      for (const sa of sOrder) { for (const tb of tOrder) { r = route(fi, sa, tb); if (r) break; } if (r) break; if (S.a === S.b) break; }
      if (!r) return null;
      for (let i = 0; i < r.length; i++) { const n = r[i]; pts.push(wpOf(n, i > 0 ? linkWidth(r[i - 1], n) : S.w, n._zone)); }
      // drop a first node that lies behind us, and a last one beyond the target
      if (pts.length > 1 && r.length > 1) {
        const k = S.d > 0.7 ? 1 : 0, n0 = r[0], n1 = r[1]; const ax = n1.x - n0.x, az = n1.z - n0.z;
        const t = ((p.x - n0.x) * ax + (p.z - n0.z) * az) / (ax * ax + az * az || 1); if (t > 0.02 && t < 1 && (S.a === n0 || S.b === n0) && (S.a === n1 || S.b === n1)) pts.splice(k, 1);
      }
    }
    const last = pts[pts.length - 1];
    if (T.d > 0.4 || !last || Math.hypot(last.x - T.x, last.z - T.z) > 0.5) {
      // when the last node is past the target's foot on the same link, it is a detour: drop it
      if (last && last.node && !same && (T.a === last.node || T.b === last.node) && pts.length > 1) { const prev = pts[pts.length - 2]; if (prev.node && (T.a === prev.node || T.b === prev.node)) pts.pop(); }
      pts.push(wpOf(T, T.w, (T.t < 0.5 ? T.a : T.b)._zone));
    }
  } else if (Math.hypot(tx - p.x, tz - p.z) > 14) return null;
  pts.push({ x: tx, y: ty, z: tz, w: 0, zone: null, last: true });
  return pts;
}
function linkWidth(a, b) { for (const l of a.links) if (l.to === b) return l.width || 1.6; return 1.6; }
