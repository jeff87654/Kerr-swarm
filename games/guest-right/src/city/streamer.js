// Building blocks of the city as the player comes to them, and taking them down behind.
//
// One block (a CELL of the grid in src/core/layout.js) is one Scope: its streets, its court and every lot in its plan.
// A block is built in slices of a few milliseconds a frame so walking never stops for it; a cab ride waits for its
// block and gives it bigger slices. What is loaded at any moment: the block the player is in, the blocks its open
// streets lead into (when the player could see down them), and nothing else.
import { planCell, LOT_H } from './plan.js';
import { buildStreets } from './streets.js';
import { buildCourt } from './court.js';
import { lotBuilder, orient } from './lots.js';
import { LAYERS, BLOCK_Z, cellKey, cellAt, wrapI, signedI, J_MIN, J_MAX } from '../core/layout.js';

const LOAD_D = 150, DROP_D = 235;          // a neighbour is wanted when its border is nearer than LOAD_D, and let go beyond DROP_D
const SLICE = 5, SLICE_FAST = 26;          // milliseconds of building per frame: while walking, while riding a cab
const MAX_CELLS = 6;
const nextFrame = () => new Promise((res) => { let done = false; const go = () => { if (!done) { done = true; res(); } }; requestAnimationFrame(go); setTimeout(go, 80); });
class Cancelled extends Error {}

export function createStreamer(game, city) {
  const W = game.world;
  const cells = new Map();                 // key -> { key, L, i, j, plan, scope, state: 'queued' | 'building' | 'ready', ready: Promise, fast, dead, used }
  let building = null;
  const failed = new Map();                // key -> when a build of it last failed
  const stats = { built: 0, dropped: 0, lastMs: 0, lastSlices: 0 };

  // ------------------------------------------------------------------------------------------------ building one block
  async function build(c) {
    const plan = c.plan = planCell(c.L, c.i, c.j), info = plan.info, frame = city.frame(c.L), atlas = game.atlas, gid = 'cell:' + c.key;
    const s = c.scope = W.scope(gid, frame, { origin: [plan.cx, plan.cz], managed: true });
    s.visible = false; s.cell = c.key;
    const nav = W.nav(frame);
    let t0 = performance.now(), slices = 1, work = 0, worst = 0; const tStart = t0;
    const prof = game.params && game.params.citylog ? {} : null; let pt = t0, part = 'streets';
    const mark = (k) => { if (!prof) return; const n = performance.now(); prof[part] = (prof[part] || 0) + (n - pt); pt = n; if (k) part = k; };
    // A slice is a few milliseconds of a frame: fewer when the frames are already long. A step that ran over is paid
    // back by sitting out the next frames, so the average stays at the budget.
    const budget = () => (c.fast ? SLICE_FAST : game.dtReal > 0.021 ? 2.5 : game.dtReal > 0.0135 ? 4 : SLICE);
    let debt = 0, prevGroup = null;
    // this block's signs go to its own group; a slice puts back whatever group was being drawn before it (a landmark may
    // be building in the same frames)
    const enter = () => { if (atlas) { prevGroup = atlas.group === gid ? null : atlas.group; atlas.begin(gid); } };
    const leave = () => { if (atlas) atlas.group = prevGroup; };
    const tick = async () => {
      const el = performance.now() - t0, bud = budget();
      if (el < bud) return;
      work += el; if (el > worst) worst = el; mark();
      leave();
      debt += el - bud;
      await nextFrame();
      while (debt > 0 && !c.fast && !c.dead) { debt -= budget(); await nextFrame(); }
      debt = 0;
      if (c.dead) throw new Cancelled();
      enter();
      t0 = performance.now(); pt = t0; slices++;
    };
    enter();
    try {
      await buildStreets(s, plan, game, tick); mark('court');
      await buildCourt(s, plan, game, tick);
      for (const n of nav.nodes) if (n.owner === s) n._tag = 'row';
      for (const lot of plan.lots) {
        const fn = lotBuilder(lot); mark(lot.kind);
        const px0 = prof && atlas ? ((atlas.groups.get(gid) || {}).px || 0) : 0, lt0 = prof ? performance.now() : 0, lk = lot.kind === 'special' ? 'special.' + lot.special : lot.kind === 'shop' ? 'shop.' + lot.trade : lot.kind === 'room' ? 'room.' + lot.use : lot.kind;
        try { if (!fn) throw new Error('no builder for a ' + lot.kind); await fn(s, lot, plan, game, tick); }
        catch (e) { if (e instanceof Cancelled) throw e; console.error('[city] lot ' + lot.id + ' (' + lot.kind + (lot.special ? '.' + lot.special : lot.trade ? '.' + lot.trade : '') + ') failed: ' + (e && e.stack ? e.stack : e)); blankFront(s, lot); }
        // the lot's walkways: whatever ends outside its footprint is a door, and joins the nearest street or court walkway
        const fresh = []; for (const n of nav.nodes) if (n.owner === s && n._tag === undefined) { n._tag = lot.id; fresh.push(n); }
        for (const n of fresh) {
          if (n.x > lot.x0 + 0.25 && n.x < lot.x1 - 0.25 && n.z > lot.z0 + 0.25 && n.z < lot.z1 - 0.25) continue;
          let best = null, bd = 9;
          for (const m of nav.nodes) { if (m.owner !== s || m._tag !== 'row' || Math.abs(m.y - n.y) > 0.6) continue; const d = Math.hypot(m.x - n.x, m.z - n.z); if (d < bd) { bd = d; best = m; } }
          if (best) nav.link(n, best, 1.3);
        }
        if (prof) { const e = prof.lots || (prof.lots = {}); const q = e[lk] || (e[lk] = { n: 0, ms: 0, px: 0 }); q.n++; q.ms += performance.now() - lt0; q.px += atlas ? ((atlas.groups.get(gid) || {}).px || 0) - px0 : 0; }
        await tick();
      }
      // turn what was drawn into meshes, a few batches a frame
      mark('finish');
      while (s.finish(c.fast ? 60 : 14)) await tick();
    } catch (e) {
      leave();
      resetGeo(s);
      if (!(e instanceof Cancelled)) console.error('[city] block ' + c.key + ' failed to build: ' + (e && e.stack ? e.stack : e));
      s.dispose(); if (atlas) atlas.release(gid);
      throw e;
    }
    leave();
    stats.lastMs = performance.now() - tStart; stats.lastSlices = slices; stats.built++;
    // join its walkways to the neighbours that are there, show it, and people it
    mark('join');
    for (const d of DIRS) joinBorder(c, d);
    // show it a few meshes a frame, the nearest first: each one is sent to the graphics card the first time it is drawn
    if (!c.fast) {
      const p = game.player, ms = s.meshes.slice();
      const dist = (m) => { const o = m.userData.origin; return Math.abs(o[0] - p.pos.x) + Math.abs(o[2] - p.pos.z); };
      ms.sort((a, b) => dist(a) - dist(b));
      for (const m of ms) m.userData.hidden = true;
      s.visible = true;
      for (let k = 0; k < ms.length; k += 8) { for (let q = k; q < Math.min(ms.length, k + 8); q++) { ms[q].userData.hidden = false; ms[q].userData.warm = 1; } await nextFrame(); if (c.fast) break; }
      for (const m of ms) m.userData.hidden = false;
      t0 = performance.now(); pt = t0;
    }
    // A block built in a hurry (somebody is waiting at its door, or on the way in a cab) is shown all at once. Its meshes
    // still go to the graphics card a few a frame from here on, each drawn once wherever it is, so that the first look
    // down its avenue does not stall on all of them together.
    if (c.fast) {
      const ms = s.meshes.slice(); let wi = 0;
      const offW = game.events.on('update', () => { if (c.dead || !s.active) { offW(); return; } for (let n = 0; n < 8 && wi < ms.length; n++) { const m = ms[wi++]; if (m && m.userData) m.userData.warm = 1; } if (wi >= ms.length) offW(); });
    }
    s.visible = true; mark('people');
    if (game.people && game.people.addScope) game.people.addScope(s); else s.live = true;
    c.state = 'ready'; c.used = game.time;
    game.events.emit('city:load', info);
    if (prof) { mark(); const el = performance.now() - t0; if (el > worst) worst = el; console.log('[city] ' + info.name + ' (' + c.key + ') built in ' + stats.lastMs.toFixed(0) + ' ms over ' + slices + ' frames (work ' + work.toFixed(0) + ' ms, worst slice ' + worst.toFixed(0) + ' ms): ' + s.meshes.length + ' meshes, ' + plan.lots.length + ' lots; ' + Object.keys(prof).filter((k) => k !== 'lots').map((k) => k + ' ' + prof[k].toFixed(0)).join(', ') + '; by lot (n, ms each, sign kilopixels each): ' + Object.keys(prof.lots || {}).map((k) => { const q = prof.lots[k]; return k + ' ' + q.n + ' ' + (q.ms / q.n).toFixed(0) + ' ' + Math.round(q.px / q.n / 1000); }).join(', ') + '; atlas ' + JSON.stringify(atlas ? atlas.usage().groups : {})); }
    return c;
  }
  // a lot that could not be built still closes its front
  function blankFront(s, lot) {
    resetGeo(s);
    const o = orient(lot), b = o.box(0, 0, o.W, 0.2), g = s.g;
    g.mat('plaster', '#cbbfa6'); g.box(b[0], 0, b[1], b[2], LOT_H, b[3]); s.flush({ tier: 's' }); s.solid(b[0], 0, b[1], b[2], LOT_H, b[3]);
  }
  function resetGeo(s) { const g = s.g; g.buf.clear(); g.stack.length = 0; g.M.identity(); g.ident = true; }

  // ------------------------------------------------------------------------------------------------ borders
  const DIRS = [{ k: 'spin', di: 1, dj: 0 }, { k: 'anti', di: -1, dj: 0 }, { k: 'back', di: 0, dj: 1 }, { k: 'front', di: 0, dj: -1 }];
  // Link the walkways that stop short on either side of a border, row by row.
  function joinBorder(c, d) {
    const plan = c.plan, ex = plan.exits[d.k]; if (!ex || !ex.open) return 0;
    const nb = cells.get(cellKey(c.L, c.i + d.di, c.j + d.dj));
    if (!ex.built && !(nb && nb.state === 'ready')) return 0;
    if (d.di && Math.abs(signedI(c.L, c.i + d.di) - signedI(c.L, c.i)) !== 1) return 0;       // the far side of the drum: the frame's x jumps there
    const alongX = d.di !== 0, b = alongX ? (d.di > 0 ? plan.avenue.x1 : plan.avenue.x0) : (d.dj > 0 ? plan.street.z1 : plan.street.z0);
    const c0 = alongX ? plan.avenue.z : plan.street.x, hw = alongX ? plan.avenue.hw : plan.street.hw;
    const nav = W.nav(city.frame(c.L)), lo = new Map(), hi = new Map();
    for (const n of nav.nodes) {
      if (Math.abs(n.y) > 0.6) continue;
      const a = alongX ? n.x : n.z, v = (alongX ? n.z : n.x) - c0;
      if (Math.abs(v) > hw - 0.2 || Math.abs(a - b) > 4.6) continue;
      const row = Math.round(v * 2), M = a < b ? lo : hi, q = M.get(row);
      if (!q || Math.abs(a - b) < Math.abs((alongX ? q.x : q.z) - b)) M.set(row, n);
    }
    let k = 0;
    for (const [row, n] of lo) { const m = hi.get(row) || hi.get(row + 1) || hi.get(row - 1); if (m && n.owner !== m.owner) { nav.link(n, m, 1.6); k++; } }
    return k;
  }

  // ------------------------------------------------------------------------------------------------ the queue
  function want(cell, fast, dist) {
    const key = cellKey(cell.L, cell.i, cell.j);
    let c = cells.get(key);
    if (fast && building) building.fast = true;
    if (c) { if (fast) c.fast = true; c.dead = false; c.used = game.time; if (dist !== undefined) c.dist = dist; return c; }
    if (city.info(cell).built) return null;                       // Candlewick: built by hand, always there
    if (!fast && failed.has(key) && game.time - failed.get(key) < 30) return null;       // it broke a moment ago: leave it a while
    c = { key, L: cell.L, i: wrapI(cell.L, cell.i), j: cell.j, plan: null, scope: null, state: 'queued', fast: !!fast, dead: false, used: game.time, dist: dist === undefined ? 0 : dist, ready: null, done: null, fail: null };
    c.ready = new Promise((res, rej) => { c.done = res; c.fail = rej; }); c.ready.catch(() => {});
    cells.set(key, c);
    pump();
    return c;
  }
  function pump() {
    if (building) return;
    let next = null;
    for (const c of cells.values()) if (c.state === 'queued' && (!next || (c.fast && !next.fast) || (c.fast === next.fast && c.dist < next.dist))) next = c;
    if (!next) return;
    building = next; next.state = 'building';
    build(next).then((c) => { building = null; c.done(c); pump(); }, (e) => { building = null; cells.delete(next.key); if (!(e instanceof Cancelled)) failed.set(next.key, game.time); next.fail(e); pump(); });
  }
  function drop(c) {
    if (c.state === 'ready') {
      const log = game.params && game.params.citylog, t0 = log ? performance.now() : 0;
      if (game.people && game.people.removeScope) game.people.removeScope(c.scope);
      const t1 = log ? performance.now() : 0;
      c.scope.dispose(); const t2 = log ? performance.now() : 0;
      if (game.atlas) game.atlas.release('cell:' + c.key);
      cells.delete(c.key); stats.dropped++;
      game.events.emit('city:unload', c.plan.info);
      if (log) console.log('[city] let go of ' + c.plan.info.name + ' in ' + (performance.now() - t0).toFixed(0) + ' ms (people ' + (t1 - t0).toFixed(0) + ', scope ' + (t2 - t1).toFixed(0) + ', the rest ' + (performance.now() - t2).toFixed(0) + ')');
    } else if (c.state === 'queued') { cells.delete(c.key); c.fail(new Cancelled()); }
    else c.dead = true;                                              // building: its next slice stops it
  }

  // ------------------------------------------------------------------------------------------------ what should be loaded now
  // The blocks the player could see or walk into from where they stand.
  function wanted(out) {
    out.length = 0;
    const p = game.player, L = city.layerOf(p.frame); if (L < 0) return out;
    const ly = LAYERS[L], cur = cellAt(L, p.pos.x, p.pos.z), info = city.info(cur);
    const dx = p.pos.x - info.x, dz = p.pos.z - info.z, HU = ly.pitch / 2, HW = BLOCK_Z / 2;
    out.push({ cell: cur, d: 0 });
    // down the avenue you see the next block from the court or from the avenue itself; down the street likewise
    const onAvenue = Math.abs(dz) < 30, onStreet = Math.abs(dx) < 38;
    const add = (di, dj, dist, inView) => {
      const j = cur.j + dj; if (j < J_MIN || j > J_MAX) return;
      if (dist < 45 || (inView && dist < LOAD_D)) out.push({ cell: { L, i: wrapI(L, cur.i + di), j }, d: dist });
    };
    add(1, 0, HU - dx, onAvenue); add(-1, 0, HU + dx, onAvenue); add(0, 1, HW - dz, onStreet); add(0, -1, HW + dz, onStreet);
    return out;
  }
  const isReady = (cell) => { if (city.info(cell).built) return true; const c = cells.get(cellKey(cell.L, cell.i, cell.j)); return !!c && c.state === 'ready'; };
  // The player may never be where nothing is built: an open street end whose next block is still being made is a wall
  // for the moment, and somebody who arrives in a block that is not there yet (a saved game) is held up until it is.
  function guard(p, L) {
    const cur = cellAt(L, p.pos.x, p.pos.z), info = city.info(cur);
    if (!isReady(cur)) { want(cur, true); if (p.pos.y < 0) { p.pos.y = 0; p.vel.y = 0; } p.vel.x = 0; p.vel.z = 0; return; }
    let ax0, ax1, sz0, sz1, cz = info.z, cx = info.x, ex = null;
    if (info.built) { const a = info.arches; if (!a) return; ax0 = a.anti; ax1 = a.spin; sz0 = -1e9; sz1 = a.back; }
    else { const c = cells.get(cellKey(cur.L, cur.i, cur.j)), pl = c.plan; ax0 = pl.avenue.x0; ax1 = pl.avenue.x1; sz0 = pl.street.z0; sz1 = pl.street.z1; ex = pl.exits; }
    const open = (k) => !ex || (ex[k] && ex[k].open);
    const nb = (di, dj) => { const j = cur.j + dj; return j < J_MIN || j > J_MAX ? null : { L, i: wrapI(L, cur.i + di), j }; };
    const m = 0.5;
    if (Math.abs(p.pos.z - cz) < 5.5) {
      if (p.pos.x > ax1 - m && open('spin')) { const n = nb(1, 0); if (n && !isReady(n)) { want(n, true); p.pos.x = ax1 - m; if (p.vel.x > 0) p.vel.x = 0; } }
      if (p.pos.x < ax0 + m && open('anti')) { const n = nb(-1, 0); if (n && !isReady(n)) { want(n, true); p.pos.x = ax0 + m; if (p.vel.x < 0) p.vel.x = 0; } }
    }
    if (Math.abs(p.pos.x - cx) < 4.5) {
      if (p.pos.z > sz1 - m && open('back')) { const n = nb(0, 1); if (n && !isReady(n)) { want(n, true); p.pos.z = sz1 - m; if (p.vel.z > 0) p.vel.z = 0; } }
      if (p.pos.z < sz0 + m && open('front')) { const n = nb(0, -1); if (n && !isReady(n)) { want(n, true); p.pos.z = sz0 + m; if (p.vel.z < 0) p.vel.z = 0; } }
    }
  }
  const _want = [];
  let tAcc = 0, away = 0, held = null;
  function update(dt) {
    const p = game.player; if (!p.frame) return;
    // the far side of the drum: a layer's flat x wraps there
    const L = city.layerOf(p.frame);
    if (L >= 0) { const ly = LAYERS[L], span = ly.N * ly.pitch, hi = (Math.floor(ly.N / 2) + 0.5) * ly.pitch; if (p.pos.x > hi) p.pos.x -= span; else if (p.pos.x <= hi - span) p.pos.x += span; }
    if (L >= 0 && p.pos.y < 3.5 && p.mode !== 'fly' && !(game.cab && game.cab.riding)) guard(p, L);
    tAcc += dt; if (tAcc < 0.2) return; tAcc = 0;
    if (!game.started || (game.cab && game.cab.riding)) return;      // nothing streams behind the title screen; the cab decides what is built during a ride
    wanted(_want);
    const keep = new Set();
    for (const w of _want) { const c = want(w.cell, false, w.d); if (c) keep.add(c.key); }
    if (L < 0) away += 0.2; else away = 0;
    // let go of what is far: beyond the drop distance in the player's layer, or everything once they have been elsewhere a while
    const list = [...cells.values()];
    let let1 = false;                                                // one finished block is let go at a time: it costs a frame
    const letGo = (c) => { if (c.state === 'ready') { if (let1) return; let1 = true; } drop(c); };
    for (const c of list) {
      if (keep.has(c.key)) { c.used = game.time; continue; }
      if (c.hold > game.time) continue;                              // somebody asked for it by name and is on their way
      const idle = game.time - c.used;
      if (c.L !== L) { if ((L >= 0 || away > 12) && idle > 2.5) letGo(c); continue; }
      // how far outside the block the player stands
      const info = city.info(c), ly = LAYERS[L]; let ddx = Math.abs(p.pos.x - info.x); ddx = Math.min(ddx, ly.N * ly.pitch - ddx);
      const out = Math.max(ddx - ly.pitch / 2, Math.abs(p.pos.z - info.z) - BLOCK_Z / 2);
      if ((out > DROP_D - 45 && idle > 2.5) || (out > 70 && idle > 25)) letGo(c);
    }
    // never more than the machine can carry: the least lately wanted goes first
    if (cells.size > MAX_CELLS) { const extra = [...cells.values()].filter((c) => !keep.has(c.key) && !(c.hold > game.time)).sort((a, b) => a.used - b.used); for (let i = 0; i < extra.length && cells.size > MAX_CELLS; i++) drop(extra[i]); }
  }
  game.events.on('update', (dt) => { try { update(dt); } catch (e) { console.error('[city] ' + (e && e.stack ? e.stack : e)); } });

  return {
    cells, stats,
    // ensure(cell, fast) -> Promise of the built block (or null for one built by hand)
    // A block asked for like this is held for forty seconds whatever the player's whereabouts say: whoever asked (a cab,
    // the stair in a lift core, a saved game) is about to stand in it, and it may take a slow machine a while to build.
    // Only the latest one asked for is held, so somebody running up twenty flights of stairs does not keep twenty blocks.
    ensure(cell, fast) { const c = want(cell, fast); if (c) { if (held && held !== c) held.hold = 0; held = c; c.hold = game.time + 40; } return c ? c.ready : Promise.resolve(null); },
    get(cell) { return cells.get(cellKey(cell.L, cell.i, cell.j)) || null; },
    loaded() { return [...cells.values()].filter((c) => c.state === 'ready').map((c) => c.key); },
    dropAll() { for (const c of [...cells.values()]) drop(c); },
  };
}
