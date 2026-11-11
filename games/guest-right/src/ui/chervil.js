// Chervil as a whole, as the UI sees it: the blocks the player has walked into (game.city.visited), the halls they have
// eaten at (game.flags['hall:<key>']), the landmarks a cab can reach (game.cab.stops) and the ones they have reached.
// Everything here works when game.city is absent (?nocity, older saves): the blocks are then simply empty.

const RINGS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const STORE = 'ui-landmarks';

export const BAND_WORDS = { low: 'the Low decks', middle: 'the Middle decks', high: 'the High decks' };

export function ringWord(n) { return RINGS[n - 1] || String(n); }
export function ringOfJ(j) { return Math.max(1, Math.min(9, Math.floor(j / 2) + 1)); }
export function deckRadius(n) { return 3000 - 4 * (n - 1); }
export function parseCell(key) { const p = String(key).split(':').map(Number); return { L: p[0], i: p[1], j: p[2] }; }
export function cellKeyOf(c) { return c.L + ':' + c.i + ':' + c.j; }
export function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }

// the signed index round the drum (0 at Candlewick's meridian), as layout.js counts it
export function signedOf(N, i) { const k = ((i % N) + N) % N; return k > N / 2 ? k - N : k; }

// a frame of the city's own (Candlewick's or a layer's): its berths are blocks, not landmarks
export function cityFrame(f) { return !!(f && (f.city || f.id === 'candlewick' || /^layer\d+$/.test(String(f.id || '')))); }

export function ateAt(flags, key) { return !!(flags && flags['hall:' + key]); }

// The block's facts, or null. Never throws.
export function infoOf(city, cell) {
  if (!city || !cell) return null;
  try { return city.info(cell) || null; } catch (err) { return null; }
}

export function youCell(city) {
  if (!city) return null;
  try { const c = city.cellOfPlayer(); return c && city.LAYERS[c.L] ? c : null; } catch (err) { return null; }
}

// Counts for the journal and the map: blocks, layers, bands, rings and halls, from the visited keys.
export function summary(G) {
  const city = G.city();
  const flags = G.flags() || {};
  let keys = [];
  if (city) { try { keys = Array.from(city.visited || []); } catch (err) { keys = []; } }
  const layers = new Set(), bands = new Set(), rings = new Set();
  let halls = 0;
  const good = [];
  for (const k of keys) {
    const c = parseCell(k);
    const ly = city.LAYERS[c.L];
    if (!ly || !isFinite(c.i) || !isFinite(c.j)) continue;
    good.push(k);
    layers.add(c.L); bands.add(ly.band); rings.add(ringOfJ(c.j));
    if (flags['hall:' + k]) halls++;
  }
  const eaten = Math.max(halls, Number(flags.halls_eaten) || 0);
  return { city, keys: good, layers, bands, rings, halls: eaten, count: city ? Number(city.count) || 0 : 0, nLayers: city ? city.LAYERS.length : 0 };
}

// The landmarks a cab can reach, one per region (or per hand-built frame), with a position in the drum.
// -> [{ id, name, sub, group, rho, z, stops: [stop ids] }]
export function landmarks(G) {
  const out = new Map();
  for (const s of G.stops()) {
    if (!s || s.cell) continue;
    let id = null, rho = null, z = null;
    try {
      if (s.region) id = 'r:' + s.region;
      else if (s.frame && !cityFrame(s.frame)) id = 'f:' + s.frame.id;
      if (!id) continue;
      if (s.frame && typeof s.frame.rho === 'function') { rho = s.frame.rho(s.y || 0); z = s.frame.zd(s.z || 0); }
      else if (isFinite(s.deck)) { rho = deckRadius(Number(s.deck)); z = isFinite(s.zd) ? Number(s.zd) : null; }
    } catch (err) { continue; }
    let m = out.get(id);
    if (!m) { m = { id, name: s.name || '', sub: s.sub || '', group: s.group || '', rho, z, stops: [] }; out.set(id, m); }
    m.stops.push(s.id);
    if (m.rho == null && rho != null) { m.rho = rho; m.z = z; }
  }
  return Array.from(out.values());
}

// Remembers the landmarks the player has reached (by cab or on foot), newest last, in game.save.
export function createReached(ctx) {
  const { G } = ctx;
  let list = [];
  const raw = G.store(STORE, null);
  if (Array.isArray(raw)) list = raw.filter((x) => x && typeof x.id === 'string');
  const save = () => G.storeSet(STORE, list.slice(-200));
  function note(id, name, sub, group) {
    if (!id || list.some((x) => x.id === id)) return;
    const gm = G.raw();
    list.push({ id, name: name || '', sub: sub || '', group: group || '', day: gm && gm.clock ? gm.clock.day : null, t: Date.now() });
    save();
  }
  function byStop(pred) { return G.stops().find((s) => s && !s.cell && pred(s)) || null; }
  function check() {
    const gm = G.raw();
    if (!gm || !gm.started || gm.busy || (gm.cab && gm.cab.riding)) return;
    const fid = G.frameId();
    if (!fid) return;
    const rid = G.placeRegion(G.zonePlace()) || G.regionOfFrame(fid);
    if (rid) {
      const s = byStop((q) => q.region === rid);
      const reg = G.regions().find((r) => r && r.id === rid);
      const nm = s ? s.name : reg && reg.places && reg.places[0] ? reg.places[0].name : rid;
      note('r:' + rid, nm, s ? s.sub : '', s ? s.group : '');
      return;
    }
    const s = byStop((q) => !q.region && q.frame && !cityFrame(q.frame) && q.frame.id === fid);
    if (s) note('f:' + fid, s.name, s.sub, s.group);
  }
  let acc = 0;
  ctx.tick((dt) => { acc += dt; if (acc >= 1) { acc = 0; check(); } });
  G.on('cab:arrive', () => { acc = 0.6; });
  G.on('game:new', () => { list = []; save(); });
  return { list: () => list.slice(), has: (id) => list.some((x) => x.id === id) };
}

// '4 blocks spinward, 2 toward the back, 12 decks up' from one cell to another (either may be on any layer).
export function relWords(city, from, to) {
  if (!city || !from || !to) return '';
  const A = city.LAYERS[from.L], B = city.LAYERS[to.L];
  if (!A || !B) return '';
  let d = signedOf(B.N, to.i) / B.N - signedOf(A.N, from.i) / A.N;
  d -= Math.round(d);
  const n = Math.round(d * B.N);
  const parts = [];
  const decks = B.d0 - A.d0;
  if (decks) parts.push(Math.abs(decks) + (Math.abs(decks) === 1 ? ' deck ' : ' decks ') + (decks > 0 ? 'up' : 'down'));
  if (n) parts.push(Math.abs(n) + (Math.abs(n) === 1 ? ' block ' : ' blocks ') + (n > 0 ? 'spinward' : 'anti'));
  const dj = to.j - from.j;
  if (dj) parts.push(Math.abs(dj) + (Math.abs(dj) === 1 ? ' block ' : ' blocks ') + 'toward the ' + (dj > 0 ? 'back' : 'front'));
  return parts.join(', ');
}
