// Regions: places that are built when you get there and taken down when you have gone.
//
// A place module that exports `region: 'some-id'` is not built when the game starts. All the places that share a
// region id are built together the first time a cab is called to one of the region's stops (or, for a region with
// `near`, when the player walks close), and disposed when the player has left and something newer needs the room.
//
//   export const place = {
//     id: 'vats', name: 'The Long Vats', order: 10, region: 'keel-vats',
//     stops: [{ id: 'vats', name: 'The Long Vats', sub: 'the Keel · deck 9 · Ring Five', spawn: 'vats' }],   // cab stops (optional)
//     near: { frame: 'hollow', x: 900, z: 1650, r: 420 },                                                     // or: load on foot (optional)
//     build(game) { ... game.spawns.vats = { frame, x, y, z, yaw }; ... },
//   };
//
// What a region made is found by looking at the world before and after: its scopes, its frames, its spawns, the
// listeners it added with game.events.on() while building, and any loops it started in its own frames.
export function createRegions(game) {
  const W = game.world;
  const regs = new Map();
  const tick = () => new Promise((res) => { let done = false; const go = () => { if (!done) { done = true; res(); } }; requestAnimationFrame(go); setTimeout(go, 60); });
  const loops = [];                       // { frameId, h } for every positional loop started anywhere
  if (game.loopAt) {
    const raw = game.loopAt;
    game.loopAt = (name, frame, x, y, z, o) => { const h = raw(name, frame, x, y, z, o); if (frame && h && h.stop) loops.push({ frameId: frame.id, h }); return h; };
  }
  const get = (id) => { let r = regs.get(id); if (!r) regs.set(id, r = { id, places: [], loaded: false, loading: null, scopes: [], frames: [], spawns: [], unsubs: [], near: null, used: 0 }); return r; };

  async function load(id) {
    const r = regs.get(id); if (!r) return false;
    r.used = game.time;
    if (r.loaded) return true;
    if (r.loading) return r.loading;
    r.loading = (async () => {
      const t0 = performance.now();
      const scopes0 = new Set(W.scopes.keys()), frames0 = new Set(W.frames.keys()), spawns0 = new Set(Object.keys(game.spawns));
      const on = game.events.on;
      game.events.on = function (name, fn) { const u = on.call(game.events, name, fn); r.unsubs.push(u); return u; };
      const n0 = loops.length;
      // its scopes manage themselves: the people are told about each when the region is ready, and nobody else is disturbed
      const scope0 = W.scope;
      W.scope = function (sid, frame, opts) { return scope0.call(W, sid, frame, Object.assign({ managed: true }, opts)); };
      if (game.atlas && game.atlas.begin) game.atlas.begin('region:' + id);
      try {
        for (const pl of r.places.slice().sort((a, b) => (a.order || 0) - (b.order || 0))) {
          try { game.places[pl.id] = pl; await pl.build(game); }
          catch (e) { console.error('[place ' + pl.id + '] failed to build: ' + (e && e.stack ? e.stack : e)); }
          if (game.atlas && game.atlas.begin) game.atlas.begin('region:' + id);      // a build that awaited may have lost the group
          await tick();
        }
      } finally {
        W.scope = scope0;
        game.events.on = on;
        if (game.atlas && game.atlas.end) game.atlas.end();
      }
      r.loops = loops.slice(n0).map((q) => q.h);
      r.scopes = [...W.scopes.keys()].filter((k) => !scopes0.has(k));
      r.frames = [...W.frames.keys()].filter((k) => !frames0.has(k));
      r.spawns = Object.keys(game.spawns).filter((k) => !spawns0.has(k));
      r.loaded = true; r.loading = null; r.used = game.time;
      for (const k of r.scopes) { const sc = W.scopes.get(k); if (!sc) continue; if (game.people && game.people.addScope) game.people.addScope(sc); else sc.live = true; }
      console.log('[region ' + id + '] built in ' + (performance.now() - t0).toFixed(0) + ' ms: ' + r.scopes.length + ' scopes, ' + r.frames.length + ' frames');
      game.events.emit('region:load', id);
      return true;
    })();
    return r.loading;
  }

  function unload(id) {
    const r = regs.get(id); if (!r || !r.loaded) return;
    for (const u of r.unsubs) { try { u(); } catch (e) { /* ignore */ } }
    r.unsubs.length = 0;
    for (const k of r.scopes) { const sc = W.scopes.get(k); if (!sc) continue; if (game.people && game.people.removeScope) game.people.removeScope(sc); sc.dispose(); }
    for (let i = loops.length - 1; i >= 0; i--) if (r.frames.indexOf(loops[i].frameId) >= 0 || (r.loops && r.loops.indexOf(loops[i].h) >= 0)) { try { loops[i].h.stop(0.2); } catch (e) { /* gone */ } loops.splice(i, 1); }
    r.loops = [];
    for (const f of r.frames) W.removeFrame(f);
    for (const k of r.spawns) delete game.spawns[k];
    if (game.atlas && game.atlas.release) game.atlas.release('region:' + id);
    r.scopes = []; r.frames = []; r.spawns = []; r.loaded = false;
    game.events.emit('region:unload', id);
    console.log('[region ' + id + '] unloaded');
  }

  const has = (r, frame) => !!frame && (r.frames.indexOf(frame.id) >= 0 || (r.near && r.near.frame === frame.id && nearDist(r) < r.near.r * 1.7));
  const nearDist = (r) => { const p = game.player; return p.frame && p.frame.id === r.near.frame ? Math.hypot(p.pos.x - r.near.x, p.pos.z - r.near.z) : 1e9; };
  // keep the region the player is in and the one most lately used; let the rest go
  function trim(keep = 1) {
    const p = game.player;
    const loaded = [...regs.values()].filter((r) => r.loaded && !r.near);
    loaded.sort((a, b) => b.used - a.used);
    let kept = 0;
    for (const r of loaded) { if (has(r, p.frame)) { r.used = game.time; kept++; continue; } if (kept < keep) { kept++; continue; } unload(r.id); }
  }

  // regions you walk into
  let acc = 0;
  game.events.on('update', (dt) => {
    acc += dt; if (acc < 0.7) return; acc = 0;
    if (!game.player.frame || game.busy) return;
    for (const r of regs.values()) {
      if (!r.near) continue;
      const d = nearDist(r);
      if (!r.loaded && !r.loading && d < r.near.r) load(r.id);
      else if (r.loaded && d > r.near.r * 1.7) { r.far = (r.far || 0) + 0.7; if (r.far > 12) { r.far = 0; unload(r.id); } }
      else r.far = 0;
    }
  });

  return {
    // called at start-up for every place module that names a region
    register(pl) {
      const r = get(pl.region); r.places.push(pl);
      if (pl.near) r.near = pl.near;
      for (const st of pl.stops || []) game.cab.addStop(Object.assign({ region: pl.region }, st));
    },
    load, unload, trim,
    get(id) { return regs.get(id) || null; },
    loaded(id) { const r = regs.get(id); return !!(r && r.loaded); },
    list() { return [...regs.values()]; },
    // the region that owns a frame id (for saving where you are), or null
    ofFrame(frameId) { for (const r of regs.values()) if (r.loaded && r.frames.indexOf(frameId) >= 0) return r.id; return null; },
  };
}
