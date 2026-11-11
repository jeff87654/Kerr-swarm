// The block's theatre (special.theatre, the Middle decks) and its reading rooms (special.reading, the Middle and High
// decks): two of the extra-large special lots, about 36 to 58 m of front by 32 to 36 m deep, front on any side.
// Each builds itself in the lot's own coordinates (lots_theatre_kit.js). The theatre is lots_theatre_house.js, the
// reading rooms lots_theatre_reading.js; their words are in lots_theatre_words.js.
import { registerLot } from '../city/lots.js';
import { measured } from './lots_theatre_kit.js';
import { buildTheatre } from './lots_theatre_house.js';
import { buildReading } from './lots_theatre_reading.js';

registerLot('special.theatre', measured('theatre', buildTheatre));
registerLot('special.reading', measured('reading', buildReading));

// a place record so the file is loaded; it builds nothing itself
export const place = { id: 'lots-theatre', name: 'Lots: theatre and reading rooms', order: 2, always: true, build() {} };
