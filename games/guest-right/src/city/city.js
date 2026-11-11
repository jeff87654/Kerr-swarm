// The city: every block of the drum that nobody built by hand. game.city answers "what is at this address" for any
// of the ~65,800 cells (see src/core/layout.js), builds a block when somebody goes there, and keeps the blocks round
// the player loaded as they walk (src/city/streamer.js).
//
//   game.city.info(cell)       -> what is known about a block without building it: name, decks, weight, ring, streets, hall, dish
//   game.city.arrive(cell)     -> Promise of { frame, x, y, z, yaw }: builds the block and gives its lift lobby (the cab uses this)
//   game.city.where(cell)      -> { rho, z } of the block (for a cab ride's length and deck counter)
//   game.city.cellOfPlayer()   -> the cell the player is standing in, or null outside the city's layers
//   game.city.visited          -> Set of cell keys the player has set foot in
import { DRUM, deckRadius } from '../core/drum.js';
import { LAYERS, HOME, BLOCK_Z, FRAME_Z0, J_MIN, J_MAX, cellKey, cellSeed, cellCentre, cellAt, ringOfCell, wrapI, signedI, layerFrameId, layerOfFrameId, cellAbove, cellCount } from '../core/layout.js';
import { Rng } from '../core/util.js';
import { BLOCK_FIRST, BLOCK_LAST, BLOCK_WHOLE, AVENUE_LAST, STREET_LAST, STREET_FIRST, FAMILY, GIVEN, HALL_DISHES, BLOCK_PRIDE } from '../content/city.js';

// Blocks that have names already: Candlewick and the neighbours its signs point to.
const NAMED = {};
const nameCell = (L, i, j, name, extra) => { NAMED[cellKey(L, i, j)] = Object.assign({ name }, extra); };
nameCell(0, 0, 3, 'Candlewick', { avenue: 'Ladle Row', street: 'Thread Street', hall: "Marit Vell's Hall", cook: 'Marit Vell', dish: ['Thursday ramen', 'Hand-pulled noodles under a lid, the broth held on the loop since Tuesday.'], built: true, arches: { spin: 105, anti: -105, back: 104 } });
nameCell(0, 1, 3, 'Ropewalk', { avenue: 'Ladle Row' }); nameCell(0, -1, 3, 'Pennyfold', { avenue: 'Ladle Row' }); nameCell(0, 0, 2, 'Lindenhall'); nameCell(0, 0, 4, 'Saffron Yard', { street: 'Thread Street' });
nameCell(1, 0, 3, 'Hassock'); nameCell(1, 1, 3, 'Copperdown'); nameCell(0, 2, 3, 'Marrowfield'); nameCell(0, -2, 3, 'Tessera');

const RINGS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const BAND_NAMES = { low: 'the Low decks', middle: 'the Middle decks', high: 'the High decks' };
const cache = new Map();

// Everything about a block that follows from its address alone.
export function cellInfo(L, i, j) {
  i = wrapI(L, i);
  const key = cellKey(L, i, j); let c = cache.get(key); if (c) return c;
  const ly = LAYERS[L], seed = cellSeed(L, i, j), r = new Rng(seed), nm = NAMED[key] || {};
  const pick = (a) => a[r.i(0, a.length - 1)];
  // the first half of a name steps through its list with the address, so no block shares a name with any of its eight neighbours
  const step = (n) => { let k = i * 7 + j * 13 + L * 11; for (const d of [6, 7, 13, 20]) if (d % n === 0) k = i * 3 + j * 5 + L * 11; return ((k % n) + n) % n; };
  const whole = r.chance(0.3), last = pick(BLOCK_LAST);
  const gen = whole ? BLOCK_WHOLE[step(BLOCK_WHOLE.length)] : BLOCK_FIRST[step(BLOCK_FIRST.length)] + last;
  const av = pick(STREET_FIRST) + ' ' + pick(AVENUE_LAST), stn = pick(STREET_FIRST) + ' ' + pick(STREET_LAST);
  const cook = pick(GIVEN) + ' ' + pick(FAMILY), dish = pick(HALL_DISHES), pride = pick(BLOCK_PRIDE);
  const ctr = cellCentre(L, i, j);
  c = {
    key, L, i, j, si: signedI(L, i), seed, built: !!nm.built, arches: nm.arches || null,
    name: nm.name || gen, avenue: nm.avenue || av, street: nm.street || (stn === av ? 'Axis ' + pick(STREET_LAST) : stn),
    cook: nm.cook || cook, hall: nm.hall || (nm.cook || cook) + "'s Hall", dish: nm.dish || dish, pride,
    d0: ly.d0, d1: ly.d1, decks: ly.n, rho0: ly.rho0, g: ly.g, band: ly.band, bandName: BAND_NAMES[ly.band], ring: ringOfCell(j), ringName: RINGS[ringOfCell(j) - 1],
    x: ctr.x, z: ctr.z, pitch: ly.pitch, style: r.i(0, 5), people: 2400 + r.i(0, 1200),
  };
  c.address = 'decks ' + c.d0 + ' to ' + c.d1 + ' · Ring ' + c.ringName;
  c.sub = c.address + ' · ' + c.g.toFixed(2) + ' g';
  cache.set(key, c);
  return c;
}

export function createCity(game) {
  const W = game.world;
  const st = game.save.get('city', null) || { visited: [] };
  const visited = new Set(st.visited || []);
  const persist = () => { game.save.set('city', { visited: [...visited].slice(-4000) }); };
  const frameOf = (L) => { const ly = LAYERS[L]; const f = W.frame(layerFrameId(L), ly.rho0, 0, FRAME_Z0); f.city = true; f.layer = L; return f; };
  const city = {
    LAYERS, HOME, count: cellCount(), visited,
    info: (cell) => cellInfo(cell.L, cell.i, cell.j),
    frame: frameOf,
    layerOf: (frame) => (frame ? layerOfFrameId(frame.id) : -1),
    where(cell) { return { rho: LAYERS[cell.L].rho0, z: FRAME_Z0 + (cell.j - HOME.j) * BLOCK_Z }; },
    cellOfPlayer() { const p = game.player, L = city.layerOf(p.frame); if (L < 0) return null; return cellAt(L, p.pos.x, p.pos.z); },
    above: (cell, dL) => cellAbove(cell.L, cell.i, cell.j, dL),
    neighbour(cell, di, dj) { const j = cell.j + dj; if (j < J_MIN || j > J_MAX) return null; return { L: cell.L, i: wrapI(cell.L, cell.i + di), j }; },
    visit(cell) { const k = cellKey(cell.L, cell.i, cell.j); if (visited.has(k)) return false; visited.add(k); persist(); game.events.emit('city:first', city.info(cell)); return true; },
    // filled in by the generator and the streamer (src/city/streamer.js)
    arrive: async () => null, ensure: async () => false, loaded: () => [],
    reset() { visited.clear(); persist(); },
  };
  void DRUM; void deckRadius;
  return city;
}
