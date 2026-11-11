// The big special lots: a block's bath house (every band), an inn of guest-right beds (the Low decks) and the tea dance
// (the High decks). Each builds itself from the lot's own coordinates (lots_baths_kit.js), so it fits any footprint from
// about 36 to 58 m of front by 32 to 36 m deep, mirrored or turned any way.
import { registerLot } from '../city/lots.js';
import { buildBaths } from './lots_baths_bath.js';
import { buildInn } from './lots_baths_inn.js';
import { buildDance } from './lots_baths_dance.js';

registerLot('special.baths', buildBaths);
registerLot('special.inn', buildInn);
registerLot('special.dancehall', buildDance);

// a place record so the file is loaded; it builds nothing itself
export const place = { id: 'lots-baths', name: 'Lots: baths, inn, tea dance', order: 2, always: true, build() {} };
