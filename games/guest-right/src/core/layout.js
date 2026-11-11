// The whole drum's plan: its bands, its line decks, the layers of the indoor city and the grid of blocks in each.
//
// The docs give the bands (the Keel 1 to 15, Low 16 to 113, Middle 114 to 301, High 302 to 375), fifteen line decks two
// decks deep (13 to 14, 38 to 39 ... 363 to 364) where nobody lives, a lift core every ~100 m, and blocks of ~3,000 people
// about 210 m on a side. The grid below is the one the Sorrel Atlas uses (docs/sorrel.md, Method), fitted to this game:
// the residential decks between line decks are cut into 58 layers of five or six decks; each layer is cut into blocks
// ~210 m round the drum and 208 m (a ninth of the drum's length, halved) along it. Candlewick is one of them.
//
// A CELL is one block: (L, i, j). L = layer (0 = decks 16 to 21, where Candlewick is), i = index round the drum
// (0 at Candlewick, counting spinward, wrapping at N), j = index along the axis (the block's avenue lies at drum
// z = j * BLOCK_Z; j runs 1 to 17; Candlewick is j = 3, the middle of Ring Two).
// Every layer has a frame with theta0 = 0 and z0 = 625 (Candlewick's), so in a layer's flat coordinates the cell (i, j)
// is centred at x = i * pitch (i taken signed, so -N/2 < i <= N/2), z = (j - 3) * BLOCK_Z.
import { DRUM, deckRadius, gAt } from './drum.js';
import { hash2i } from './util.js';

export const LINE_DECKS = []; for (let n = 13; n <= 363; n += 25) LINE_DECKS.push(n);     // each with the deck above it
export const BANDS = [
  { id: 'keel', name: 'the Keel', d0: 1, d1: 15 },
  { id: 'low', name: 'the Low decks', d0: 16, d1: 113 },
  { id: 'middle', name: 'the Middle decks', d0: 114, d1: 301 },
  { id: 'high', name: 'the High decks', d0: 302, d1: 375 },
];
export function bandOf(deck) { for (const b of BANDS) if (deck >= b.d0 && deck <= b.d1) return b; return deck > 375 ? { id: 'hollow', name: 'the Hollow', d0: 376, d1: 376 } : BANDS[0]; }
export function isLineDeck(deck) { for (const n of LINE_DECKS) if (deck === n || deck === n + 1) return true; return false; }

export const BLOCK_Z = DRUM.L / 18;            // 208.33 m along the axis
export const BLOCK_X = 210;                    // about this far round, fitted to a whole number per layer
export const J_MIN = 1, J_MAX = 17;
export const HOME = { L: 0, i: 0, j: 3 };      // Candlewick
export const FRAME_Z0 = 625;                   // every layer frame's z origin (the middle of Ring Two)

// ---- the layers: runs of residential decks between line decks, in groups of five or six
export const LAYERS = [];
{
  const runs = []; let d = 16;
  for (const n of LINE_DECKS) { if (n < 16) continue; if (n - 1 >= d) runs.push([d, n - 1]); d = n + 2; }
  if (d <= 375) runs.push([d, 375]);
  for (const r of runs) {
    const len = r[1] - r[0] + 1, groups = Math.max(1, Math.round(len / 6)); let at = r[0];
    for (let k = 0; k < groups; k++) {
      const n = Math.floor(len / groups) + (k < len % groups ? 1 : 0);
      const d0 = at, d1 = at + n - 1, rho0 = deckRadius(d0), N = Math.round(2 * Math.PI * rho0 / BLOCK_X);
      LAYERS.push({ L: LAYERS.length, d0, d1, n, rho0, g: gAt(rho0), band: bandOf(d0).id, N, pitch: 2 * Math.PI * rho0 / N });
      at += n;
    }
  }
}
export function layerOfDeck(deck) { for (const l of LAYERS) if (deck >= l.d0 && deck <= l.d1) return l; return null; }
// the nearest layer to a deck that is not in one (a line deck, the Keel, the Hollow)
export function nearestLayer(deck) { let best = LAYERS[0], bd = 1e9; for (const l of LAYERS) { const dd = deck < l.d0 ? l.d0 - deck : deck > l.d1 ? deck - l.d1 : 0; if (dd < bd) { bd = dd; best = l; } } return best; }
export function layerFrameId(L) { return L === 0 ? 'candlewick' : 'layer' + L; }
export function layerOfFrameId(id) { if (id === 'candlewick') return 0; const m = /^layer(\d+)$/.exec(id || ''); return m ? parseInt(m[1], 10) : -1; }

// ---- cells
export function wrapI(L, i) { const N = LAYERS[L].N; return ((i % N) + N) % N; }
export function signedI(L, i) { const N = LAYERS[L].N; const k = wrapI(L, i); return k > N / 2 ? k - N : k; }
export function cellCentre(L, i, j) { return { x: signedI(L, i) * LAYERS[L].pitch, z: (j - HOME.j) * BLOCK_Z }; }
// the cell containing a point of a layer's frame (x may be any number of metres round)
export function cellAt(L, x, z) {
  const ly = LAYERS[L];
  return { L, i: wrapI(L, Math.round(x / ly.pitch)), j: Math.max(J_MIN, Math.min(J_MAX, Math.round(z / BLOCK_Z) + HOME.j)) };
}
export function cellKey(L, i, j) { return L + ':' + wrapI(L, i) + ':' + j; }
export function parseKey(key) { const p = String(key).split(':').map(Number); return { L: p[0], i: p[1], j: p[2] }; }
export function cellSeed(L, i, j) { return ((Math.floor(hash2i(L * 7919 + 17, wrapI(L, i) * 104729 + j * 1009) * 4294967296) ^ 0x5bd1e995) >>> 0) || 1; }
// Ring One is at the front. A block belongs to the ring its avenue lies in (those on a boundary, to the ring behind).
export function ringOfCell(j) { return Math.max(1, Math.min(9, Math.floor(j / 2) + 1)); }
export function cellDrumZ(j) { return j * BLOCK_Z; }
export function cellTheta(L, i) { return signedI(L, i) * LAYERS[L].pitch / LAYERS[L].rho0; }
// the cell on another layer that lies straight above or below a cell (same angle round, same place along)
export function cellAbove(L, i, j, dL) {
  const L2 = L + dL; if (L2 < 0 || L2 >= LAYERS.length) return null;
  const th = cellTheta(L, i); return { L: L2, i: wrapI(L2, Math.round(th * LAYERS[L2].rho0 / LAYERS[L2].pitch)), j };
}
export function cellCount() { let n = 0; for (const l of LAYERS) n += l.N * (J_MAX - J_MIN + 1); return n; }
