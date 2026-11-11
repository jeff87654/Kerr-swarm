// Lots: the rooms every block of the city keeps for itself (plan.js ROOMS). Ten keys: the clinic, the choir room, the
// block office and the laundry in every band; the Warm Floor (a day nursery) and the toys on loan on the Low decks;
// the world room and the letter room on the Middle decks; the tea dance's small room and the note room on the High decks.
// Each arrives on the avenue (9 to 11.5 m of front, 9.5 deep) or on the court (15 to 23 m, 13.5 deep), its front on
// any side: the builders lay out in the lot's own (p, q) frame (lots_rooms_kit.js).
import { registerLot } from '../city/lots.js';
import { meter } from './lots_rooms_kit.js';
import { buildClinic } from './lots_rooms_care.js';
import { buildChoir, buildTea } from './lots_rooms_music.js';
import { buildOffice, buildLaundry } from './lots_rooms_civic.js';
import { buildWorlds, buildLetters, buildNotes } from './lots_rooms_words.js';
import { buildNursery, buildToys } from './lots_rooms_kids.js';

// Wrap a builder: with ?citylog or ?roomlog, print its triangles, lights and work time.
function reg(key, fn) {
  registerLot(key, async (s, lot, plan, game, tick) => {
    const log = game.params && (game.params.citylog || game.params.roomlog);
    if (!log) return fn(s, lot, plan, game, tick);
    const m0 = meter(s), t0 = performance.now(); let waited = 0;
    const t = async () => { const a = performance.now(); await tick(); waited += performance.now() - a; };
    await fn(s, lot, plan, game, t);
    const m1 = meter(s);
    console.log('[lots-rooms] ' + key + ' ' + lot.id + ' ' + (lot.onCourt ? 'court' : 'avenue') + ' front ' + lot.front + ' ' + (lot.x1 - lot.x0).toFixed(1) + 'x' + (lot.z1 - lot.z0).toFixed(1) + ': ' + Math.round(m1.tris - m0.tris) + ' tris, ' + (m1.lights - m0.lights) + ' lights, ' + (performance.now() - t0 - waited).toFixed(1) + ' ms');
  });
}

reg('room.clinic', buildClinic);
reg('room.choir', buildChoir);
reg('room.tea', buildTea);
reg('room.office', buildOffice);
reg('room.laundry', buildLaundry);
reg('room.nursery', buildNursery);
reg('room.toys', buildToys);
reg('room.worlds', buildWorlds);
reg('room.letters', buildLetters);
reg('room.notes', buildNotes);

export const place = { id: 'lots-rooms', name: 'Lots: the block rooms', order: 2, always: true, build() {} };
