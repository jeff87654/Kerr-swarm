// story_drum.js: the journal for the whole drum. Starts and moves along the threads that reach past Candlewick (the
// halls of other blocks, the three bands, the nine Rings, the works, the top of the wall, the River, the loop rides)
// and gives the things found by going about the drum. The words are in src/content/threads.js and discoveries.js.
//
// It listens to:
//   city:enter  { info, first }               walked or rode into a block (src/places/city.js)
//   hall:eat    { cell, name, block, dish, n } ate at a block's hall for the first time (src/city/lots.js)
//   cab:arrive  { from, to, region, cell }    a cab ride ended (src/game/cab.js)
//   city:stairs { to, dir }                   climbed (1) or went down (-1) a lift core's stair
//   tier:stood  { tier }                      stood on the Quarter, the Tenth or the Twentieth (its flag is 'stood_' + tier)
//   tier:top                                  reached the top ledge of the Twentieth's garden (game.flags.top_ledge)
//   axle:heard                                stood in the heat hall at the back axle (game.flags.heard_axle)
//   window:seen                               sat at the Window (game.flags.saw_river)
//   ride:done   { ride }                      rode the loop heavy or light (game.flags.rode_heavy, .rode_light)
//   slide:done, mile:done, glide:done         rode a slide at the Spouts, ran the Measure, rode the Glide (flags rode_slide,
//                                             ran_heavy_mile, ran_light_mile, rode_glide; also ran_lap and dived_island, which
//                                             the Breadboard and Lid Island set)
// The landmark builders set those flags; one that is never set (a landmark not built yet) leaves its step waiting.
// It also reads game.flags.halls_eaten and .slept, the hall:<cell> flags, game.city.visited,
// the player's frame and zone, and game.regions (which landmarks exist, and which one the player is in).
//
// Nothing here starts before the player has slept a night in Chervil or has left Candlewick, the threads are started
// one at a time, and every step of them is marked "later" in threads.js, so they never take the compass line from the
// three days' own threads. Everything is kept in game.flags and saved with the story.
import { THREADS } from '../content/threads.js';
import { LAYERS, parseKey, ringOfCell } from '../core/layout.js';

const err = (e) => console.error('[story-drum] ' + (e && e.stack ? e.stack : e));
const F = (g) => g.flags || (g.flags = {});
const J = (g) => g.journal || null;
function start(g, id) { const j = J(g); if (j) j.start(id); }
function step(g, id, i) { const j = J(g); if (j) j.step(id, i); }
function done(g, id) { const j = J(g); if (j) j.done(id); }
function found(g, id) { const j = J(g); if (j) j.find(id); }
const started = (g, id) => { const j = J(g); return !!(j && j.started && j.started(id)); };
const isDone = (g, id) => { const j = J(g); return !!(j && j.isDone && j.isDone(id)); };
const persist = (g) => { if (g.story && g.story.persist) { try { g.story.persist(); } catch (e) { err(e); } } };
const frameId = (g) => (g.player && g.player.frame ? g.player.frame.id : null);
const zonePlace = (g) => (g.zone ? (g.zone.place || null) : null);

// the threads this file owns, in the order they are offered
const DRUM = ['other-tables', 'three-weights', 'nine-rings', 'the-works', 'top-of-wall', 'the-river', 'heavy-light', 'day-out'];
// the things built for fun, in the order of the steps of 'day-out', and the flag each sets when it has been done
const FUN = ['chimney', 'mile-hall', 'hollow-grounds', 'hollow-island', 'glide'];
// the works a visitor can see; the first is the one the thread asks for by name
const WORKS = ['keel-vats', 'keel-garden', 'keel-heat', 'keel-library', 'line-works'];
// what each landmark tells you when you arrive, and what it tells you after a while there
const ARRIVE = {
  'keel-vats': 'vat-warmth', 'keel-garden': 'rack-metre', 'keel-heat': 'loop-tap', 'keel-library': 'blight-menu',
  'ring-five': 'ring-riders', 'ring-nine': 'nine-stations', 'line-works': 'line-decks', 'line-rides': 'two-limits',
  chimney: 'falls-anti', 'felt-organ': 'long-pipes', 'lot-hall': 'drawn-by-lot', 'up-decks': 'elders-up',
  'hollow-island': 'lake-clear', 'hollow-grounds': 'break-twice', 'hollow-front': 'dim-ends',
  'front-wall': 'quiet-wall', 'axle-back': 'heat-river', 'axle-front': 'power-in',
  'mile-hall': 'two-miles', glide: 'glide',
};
const LINGER = { 'keel-vats': 'vat-lines', 'line-works': 'nothing-burns' };
const LINGER_S = 45;
// the frames of the back wall's high tiers (src/places/lm_back_upper.js): being in one gives its discovery
const TIERS = ['quarter', 'tenth', 'twentieth'];
const GAP_S = 40;             // seconds between one thread being offered and the next

export const place = {
  id: 'story-drum', name: 'The drum', order: 950, always: true,
  build(game) {
    const g = game;
    if (!g.events) { console.warn('[story-drum] no events; skipped'); return; }
    // the threads are defined by src/places/story.js too; defining them again here is harmless and means this file
    // does not depend on the order the two are built in
    if (g.journal && g.journal.defineThread) for (const t of THREADS) if (DRUM.indexOf(t.id) >= 0) g.journal.defineThread(t);

    const exists = (id) => { try { const r = g.regions && g.regions.get ? g.regions.get(id) : null; return !!(r && r.places && r.places.length); } catch (e) { return false; } };
    const seen = (id) => !!F(g)['seen:' + id];
    const tier = (name) => !!F(g)['tier:' + name];
    // the landmark builders' flags (the tier ones are written as 'stood_' + tier, so they are read the same way)
    const stood = (name) => !!F(g)['stood_' + name];
    const free = () => !g.busy && !(g.ui && g.ui.modal);
    const wants = new Set();                         // threads with something done that have not been offered yet
    let gap = 6;                                     // seconds until the next thread may be offered

    // ---------------------------------------------------------------- the gate: a night slept, or Candlewick left
    function isOpen() {
      const Fl = F(g);
      if (Fl.drum_open) return true;
      if (Fl.drum_left || Fl.slept || isDone(g, 'three-nights') || (g.clock && g.clock.day >= 2)) { Fl.drum_open = true; persist(g); return true; }
      return false;
    }
    // can this thread be finished in the drum as built?
    function available(id) {
      if (id === 'other-tables' || id === 'three-weights' || id === 'nine-rings') return !!g.city;
      if (id === 'the-works') return WORKS.some(exists);
      if (id === 'top-of-wall') return exists('back-upper');
      if (id === 'the-river') return exists('axle-back');
      if (id === 'heavy-light') return exists('line-rides');
      if (id === 'day-out') return FUN.some(exists);
      return false;
    }

    // ---------------------------------------------------------------- what the player has done, from the saved state
    const infoCache = new Map();
    function cellFacts(key) {
      let c = infoCache.get(key); if (c) return c;
      const p = parseKey(key), ly = LAYERS[p.L];
      if (!ly) return null;
      let built = false;
      try { built = !!(g.city && g.city.info && g.city.info(p).built); } catch (e) { built = false; }
      c = { band: ly.band, ring: ringOfCell(p.j), built };
      infoCache.set(key, c); return c;
    }
    function facts() {
      const Fl = F(g), bands = { low: false, middle: false, high: false }, halls = { low: false, middle: false, high: false }, rings = new Set();
      let blocks = 0;
      const visited = g.city && g.city.visited ? g.city.visited : null;
      if (visited) for (const k of visited) {
        const c = cellFacts(k); if (!c) continue;
        rings.add(c.ring);
        if (!c.built) { bands[c.band] = true; blocks++; }
      }
      for (const k in Fl) {
        if (k.slice(0, 5) !== 'hall:' || !Fl[k]) continue;
        const c = cellFacts(k.slice(5)); if (c) halls[c.band] = true;
      }
      const n = Fl.halls_eaten || 0;
      return { bands, halls, rings, blocks, n };
    }

    // ---------------------------------------------------------------- moving the threads along
    // A thread that has not been offered yet is not moved: anything already done for it moves it to the front of the
    // queue, and it catches up the moment it is offered.
    const ready = (id, any) => { if (started(g, id)) return !isDone(g, id); if (any) wants.add(id); return false; };
    function sync() {
      if (!J(g) || !isOpen()) return;
      const Fl = F(g), s = facts();

      // A seat at every table
      if (ready('other-tables', s.n > 0)) {
        if (s.n >= 1) step(g, 'other-tables', 0);
        if (s.n >= 5) step(g, 'other-tables', 1);
        if (s.halls.low) step(g, 'other-tables', 2);
        if (s.halls.middle) step(g, 'other-tables', 3);
        if (s.halls.high) step(g, 'other-tables', 4);
        if (s.n >= 5 && s.halls.low && s.halls.middle && s.halls.high) done(g, 'other-tables');
      }
      // Three weights
      if (ready('three-weights', s.bands.low || s.bands.middle || s.bands.high)) {
        if (s.bands.low) step(g, 'three-weights', 0);
        if (s.bands.middle) step(g, 'three-weights', 1);
        if (s.bands.high) step(g, 'three-weights', 2);
        if (s.bands.low && s.bands.middle && s.bands.high) done(g, 'three-weights');
      }
      // Front to back
      if (ready('nine-rings', s.rings.size > 1)) {
        for (let k = 0; k < 9; k++) if (s.rings.has(k + 1)) step(g, 'nine-rings', k);
        if (s.rings.size >= 9) done(g, 'nine-rings');
      }
      // What feeds the drum: the Flour Hall by name, then any two of the others that are built. A works that does not
      // exist yet cannot hold the thread open.
      {
        const others = WORKS.slice(1).filter(seen).length, can = WORKS.slice(1).filter(exists).length;
        if (ready('the-works', seen('keel-vats') || others > 0)) {
          if (seen('keel-vats')) step(g, 'the-works', 0);
          if (others >= 1) step(g, 'the-works', 1);
          if (others >= 2) step(g, 'the-works', 2);
          if ((seen('keel-vats') || !exists('keel-vats')) && others >= Math.min(2, can)) done(g, 'the-works');
        }
      }
      // The top of the wall
      const top = !!Fl.top_ledge;
      if (ready('top-of-wall', stood('quarter') || stood('tenth') || stood('twentieth') || top)) {
        if (stood('quarter')) step(g, 'top-of-wall', 0);
        if (stood('tenth')) step(g, 'top-of-wall', 1);
        if (stood('twentieth')) step(g, 'top-of-wall', 2);
        if (top) step(g, 'top-of-wall', 3);
        if (stood('quarter') && stood('tenth') && stood('twentieth') && top) done(g, 'top-of-wall');
      }
      // The River
      const heard = !!Fl.heard_axle, river = !!Fl.saw_river;
      if (ready('the-river', seen('axle-back') || heard || river)) {
        if (seen('axle-back') || heard || river) step(g, 'the-river', 0);
        if (heard) step(g, 'the-river', 1);
        if (river) { step(g, 'the-river', 2); done(g, 'the-river'); }
      }
      if (river) found(g, 'the-river');
      // Heavier and lighter
      const heavy = !!Fl.rode_heavy, light = !!Fl.rode_light;
      if (ready('heavy-light', seen('line-rides') || heavy || light)) {
        if (seen('line-rides') || heavy || light) step(g, 'heavy-light', 0);
        if (heavy) step(g, 'heavy-light', 1);
        if (light) step(g, 'heavy-light', 2);
        if (heavy && light) done(g, 'heavy-light');
      }
      if (heavy && light) found(g, 'for-the-feeling');
      // A day out: a step for each thing built for fun. One that is not built cannot hold the thread open.
      {
        const did = [!!Fl.rode_slide, !!(Fl.ran_heavy_mile || Fl.ran_light_mile), !!Fl.ran_lap, !!Fl.dived_island, !!Fl.rode_glide];
        if (ready('day-out', did.some(Boolean))) {
          for (let k = 0; k < did.length; k++) if (did[k]) step(g, 'day-out', k);
          if (did.every((d, k) => d || !exists(FUN[k]))) done(g, 'day-out');
        }
      }
      if (Fl.ran_heavy_mile && Fl.ran_light_mile) found(g, 'both-miles');
    }

    // offer the next thread: one that already has something done first, then the rest in order
    function offer() {
      if (!J(g) || !isOpen() || !free()) return;
      let id = null;
      for (const w of wants) { if (!started(g, w) && available(w)) { id = w; break; } }
      if (!id) id = DRUM.find((t) => !started(g, t) && available(t)) || null;
      if (!id) return;
      wants.delete(id);
      start(g, id);
      gap = GAP_S;
      sync();
    }

    // ---------------------------------------------------------------- landmarks: arriving, staying, the tiers, the Window
    function arrive(id) {
      if (!id || seen(id)) return;
      const Fl = F(g); Fl['seen:' + id] = true; Fl.drum_left = true;
      if (ARRIVE[id]) found(g, ARRIVE[id]);
      persist(g); sync();
    }
    function onTier(name) {
      if (tier(name)) return;
      const Fl = F(g); Fl['tier:' + name] = true; Fl.drum_left = true;
      if (name === 'quarter') found(g, 'quarter-light');
      else if (name === 'tenth') found(g, 'tenth-light');
      else if (name === 'twentieth') found(g, 'hollow-glow');
      persist(g); sync();
    }

    // ---------------------------------------------------------------- the city
    function onEnter(e) {
      const info = e && e.info; if (!info || info.built) return;
      const Fl = F(g);
      if (!Fl.drum_left) { Fl.drum_left = true; persist(g); }
      if (info.band === 'low') found(g, 'low-decks');
      else if (info.band === 'middle') found(g, 'middle-decks');
      else if (info.band === 'high') found(g, 'high-decks');
      if (info.j === 1) found(g, 'front-cap');
      else if (info.j === 17) found(g, 'back-cap');
      else if (info.ring >= 6) found(g, 'far-ring');
      const ly = LAYERS[info.L];
      if (ly && ly.N && Math.abs(info.si || 0) >= ly.N * 0.4) found(g, 'far-side');
      const s = facts();
      if (s.blocks >= 10) found(g, 'block-a-day');
      if (s.rings.size >= 9) found(g, 'every-ring');
      sync();
    }

    const on = (name, fn) => g.events.on(name, (e) => { try { fn(e); } catch (er) { err(er); } });
    on('city:enter', onEnter);
    on('hall:eat', (e) => {
      const n = (e && e.n) || F(g).halls_eaten || 0;
      if (n >= 1) found(g, 'any-hall');
      if (n >= 5) found(g, 'fifth-hall');
      sync();
    });
    on('cab:arrive', (e) => {
      if (!e) return;
      if (e.cell) found(g, 'cab-address');
      if (e.region) arrive(e.region);
    });
    on('city:stairs', (e) => { if (e && e.dir > 0) found(g, 'stair-climb'); });
    on('tier:stood', (e) => { if (e && TIERS.indexOf(e.tier) >= 0) onTier(e.tier); sync(); });
    on('tier:top', () => sync());
    on('axle:heard', () => { arrive('axle-back'); found(g, 'heat-river'); sync(); });
    on('window:seen', () => { arrive('axle-back'); sync(); });
    on('ride:done', () => { arrive('line-rides'); sync(); });
    on('slide:done', () => { arrive('chimney'); sync(); });
    on('mile:done', () => { arrive('mile-hall'); sync(); });
    on('glide:done', () => { arrive('glide'); sync(); });
    on('found', () => sync());

    // ---------------------------------------------------------------- the tick: where you are
    let acc = 0, slow = 0;
    const linger = {};
    function tick(dt) {
      if (!g.started || !g.player) return;
      const fid = frameId(g), zp = zonePlace(g);
      // which landmark you are in: by its frames, by a zone that names it, or near one found on foot
      let region = null;
      try { if (g.regions && g.regions.ofFrame && fid) region = g.regions.ofFrame(fid); } catch (e) { region = null; }
      if (!region && zp && ARRIVE[zp]) region = zp;
      if (!region && g.regions && g.regions.list && g.player.pos) {
        for (const r of g.regions.list()) {
          if (!r.near || !r.loaded || r.near.frame !== fid) continue;
          if (Math.hypot(g.player.pos.x - r.near.x, g.player.pos.z - r.near.z) < r.near.r * 0.5) { region = r.id; break; }
        }
      }
      if (region) arrive(region);
      if (fid && TIERS.indexOf(fid) >= 0) onTier(fid);
      if (region && LINGER[region]) { linger[region] = (linger[region] || 0) + dt; if (linger[region] > LINGER_S) found(g, LINGER[region]); }
      // the threads
      slow += dt;
      if (slow >= 2) { slow = 0; sync(); }
      if (isOpen()) { gap -= dt; if (gap <= 0) { gap = 3; offer(); } }
    }
    g.events.on('update', (dt) => {
      acc += dt || 0; if (acc < 0.5) return;
      const elapsed = acc; acc = 0;
      try { tick(elapsed); } catch (e) { err(e); }
    });
    // a new game clears the flags; the counters here start again with it
    g.events.on('game:new', () => { wants.clear(); gap = 6; for (const k in linger) delete linger[k]; });
  },
};
