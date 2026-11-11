// Choosing a block for a cab: by where you have been, by what is straight above or below, or by address
// (band, then decks, then ring, then a block of that ring). Built from the talk panel's numbered lists.
import { LAYERS, BANDS, J_MIN, J_MAX, cellKey, parseKey, ringOfCell, wrapI, cellTheta } from '../core/layout.js';

const CAB = { name: 'Cab', colour: '#3fe0d0' };
const RINGS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];

// pickBlock(game, city, from): from is the cell the player is in (or null). Resolves to a cell { L, i, j } or null.
export async function pickBlock(game, city, from) {
  const ui = game.ui; if (!ui) return null;
  const ask = (title, opts) => ui.choose(CAB, title, opts.concat([{ label: 'Back', sub: '', value: '__back' }]));
  const here = from || city.cellOfPlayer() || city.HOME;
  for (;;) {
    const top = [];
    const up = city.above(here, 1), dn = city.above(here, -1);
    if (up) { const q = city.info(up); top.push({ label: 'Straight up: ' + q.name, sub: q.sub, value: 'c' + q.key }); }
    if (dn) { const q = city.info(dn); top.push({ label: 'Straight down: ' + q.name, sub: q.sub, value: 'c' + q.key }); }
    top.push({ label: 'By address', sub: 'band, decks, ring, block', value: 'addr' });
    if (city.visited.size > 1) top.push({ label: 'Somewhere you have been', sub: city.visited.size + ' blocks so far', value: 'been' });
    top.push({ label: 'Anywhere', sub: 'let the cab choose a block of the ' + city.count.toLocaleString('en-GB'), value: 'any' });
    const a = await ask('Which block', top);
    if (!a || a === '__back') return null;
    if (a[0] === 'c') return parseKey(a.slice(1));
    if (a === 'any') { const L = (Math.random() * LAYERS.length) | 0; return { L, i: (Math.random() * LAYERS[L].N) | 0, j: J_MIN + ((Math.random() * (J_MAX - J_MIN + 1)) | 0) }; }
    if (a === 'been') {
      const keys = [...city.visited].slice(-9).reverse();
      const b = await ask('Somewhere you have been', keys.map((k) => { const q = city.info(parseKey(k)); return { label: q.name, sub: q.sub, value: k }; }));
      if (b && b !== '__back') return parseKey(b);
      continue;
    }
    // by address
    const band = await ask('Which band', BANDS.filter((b) => b.id !== 'keel').map((b) => ({ label: b.name.charAt(0).toUpperCase() + b.name.slice(1), sub: 'decks ' + b.d0 + ' to ' + b.d1, value: b.id })));
    if (!band || band === '__back') continue;
    const layers = LAYERS.filter((l) => l.band === band);
    // nine at a time, so the list stays on the number keys
    let L = null;
    for (let at = 0; L === null;) {
      const page = layers.slice(at, at + 8).map((l) => ({ label: 'Decks ' + l.d0 + ' to ' + l.d1, sub: l.g.toFixed(2) + ' g · ' + l.N + ' blocks round', value: 'L' + l.L }));
      if (at + 8 < layers.length) page.push({ label: 'Higher', sub: 'decks ' + layers[at + 8].d0 + ' and up', value: 'more' });
      const c = await ask('Which decks', page);
      if (!c || c === '__back') { if (at > 0) { at = Math.max(0, at - 8); continue; } break; }
      if (c === 'more') { at += 8; continue; }
      L = parseInt(c.slice(1), 10);
    }
    if (L === null) continue;
    const ring = await ask('Which ring', RINGS.map((n, k) => ({ label: 'Ring ' + n, sub: k === 0 ? 'the front' : k === 8 ? 'the back' : '', value: 'R' + (k + 1) })));
    if (!ring || ring === '__back') continue;
    const rn = parseInt(ring.slice(1), 10);
    const js = []; for (let j = J_MIN; j <= J_MAX; j++) if (ringOfCell(j) === rn) js.push(j);
    // eight blocks of that ring: the one under (or over) where you stand, and others spaced round the drum
    const N = LAYERS[L].N, i0 = wrapI(L, Math.round(cellTheta(here.L, here.i) * LAYERS[L].rho0 / LAYERS[L].pitch));
    const opts = [];
    for (let k = 0; k < 8; k++) {
      const cell = { L, i: wrapI(L, i0 + Math.round(k * N / 8)), j: js[k % js.length] }, q = city.info(cell);
      const turn = k === 0 ? 'in line with here' : k === 4 ? 'the far side of the drum' : k < 4 ? (k * 45) + '° spinward' : ((8 - k) * 45) + '° anti';
      opts.push({ label: q.name, sub: turn + ' · ' + q.hall, value: cellKey(cell.L, cell.i, cell.j) });
    }
    const pick = await ask('Which block', opts);
    if (pick && pick !== '__back') return parseKey(pick);
  }
}
