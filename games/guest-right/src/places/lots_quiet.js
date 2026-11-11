// The quiet special lots of a generated block: the gardens and still places a block is known for. In a drum there is
// no outdoors: every wood and garden is a room under lamps. Each kind builds itself from the lot's own coordinates
// (lots_quiet_kit.js), so it fits any footprint in its range, mirrored or turned any way.
//   special.dimwood   a dim wood, lit like a cloudy evening (every band)
//   special.square    a bright square, lit like an overcast noon (every band)
//   special.stillroom a still room: three layers of felt, nothing said (Middle and High decks)
//   special.garden    a lamp garden for the old of the block, partly two decks tall (High decks, extra large)
//   special.lamprow   fourteen tiny gardens in one strip of light (High decks)
// With `quietlog` in the address, each one prints its triangles, lights and working time to the console.
import { registerLot } from '../city/lots.js';
import { buildDimWood } from './lots_quiet_wood.js';
import { buildSquare } from './lots_quiet_square.js';
import { buildStillRoom } from './lots_quiet_still.js';
import { buildLampRow } from './lots_quiet_row.js';
import { buildGarden } from './lots_quiet_garden.js';

function measured(key, fn) {
  return async (s, lot, plan, game, tick) => {
    const on = typeof location !== 'undefined' && location.search.indexOf('quietlog') >= 0;
    if (!on) return fn(s, lot, plan, game, tick);
    let tris = 0, ms = 0, t = performance.now(), worst = 0; const sl = [];
    const f0 = s.flush, l0 = s.lights.length;
    s.flush = function (o) { tris += this.g.buf.ni / 3; return f0.call(this, o); };
    const tk = async () => { const d = performance.now() - t; ms += d; worst = Math.max(worst, d); sl.push(d.toFixed(0)); await tick(); t = performance.now(); };
    try { await fn(s, lot, plan, game, tk); }
    finally {
      const d = performance.now() - t; ms += d; worst = Math.max(worst, d); s.flush = f0;
      console.log('[quiet] ' + key + ' ' + lot.id + ' ' + (lot.x1 - lot.x0).toFixed(1) + 'x' + (lot.z1 - lot.z0).toFixed(1) + ' front ' + lot.front + ': ' + Math.round(tris) + ' tris, ' + (s.lights.length - l0) + ' lights, ' + ms.toFixed(1) + ' ms (worst slice ' + worst.toFixed(1) + ' ms) slices ' + sl.join(','));
    }
  };
}

registerLot('special.dimwood', measured('dimwood', buildDimWood));
registerLot('special.square', measured('square', buildSquare));
registerLot('special.stillroom', measured('stillroom', buildStillRoom));
registerLot('special.lamprow', measured('lamprow', buildLampRow));
registerLot('special.garden', measured('garden', buildGarden));

// a place record so the file is loaded; it builds nothing itself
export const place = { id: 'lots-quiet', name: 'Lots: quiet places', order: 2, always: true, build() {} };
