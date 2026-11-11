// Lots: the second market, the workshops by the hour and the light studios. Three of the big places a generated block
// can have; each is built from the lot's own coordinates (see lots_market_kit.js), so it fits any front and any size.
//   special.market     (extra-large, Low and Middle decks): lots_market_hall.js
//   special.workshops  (extra-large, Middle decks): lots_market_bench.js
//   special.studio     (large, Middle decks): lots_market_light.js
import { registerLot } from '../city/lots.js';
import { buildMarket } from './lots_market_hall.js';
import { buildWorkshops } from './lots_market_bench.js';
import { buildStudio } from './lots_market_light.js';

registerLot('special.market', buildMarket);
registerLot('special.workshops', buildWorkshops);
registerLot('special.studio', buildStudio);

// a place record so the file is loaded; it builds nothing itself
export const place = { id: 'lots-market', name: 'Lots: market, workshops, light studios', order: 2, always: true, build() {} };
