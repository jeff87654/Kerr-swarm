// Lot modules for the food shops of the generated city: shop.baker, shop.greens, shop.larder, shop.herbs, shop.noodles,
// shop.tea. Each one is built from the lot's own footprint (any front, any size the plan gives), name, seed and block.
// The builders live in lots_shops_food_*.js; the shared frame, shell and props in lots_shops_food_kit.js.
import { registerLot } from '../city/lots.js';
import { buildBaker } from './lots_shops_food_bread.js';
import { buildGreens, buildHerbs } from './lots_shops_food_green.js';
import { buildLarder } from './lots_shops_food_keep.js';
import { buildNoodles, buildTea } from './lots_shops_food_bowl.js';

registerLot('shop.baker', buildBaker);
registerLot('shop.greens', buildGreens);
registerLot('shop.larder', buildLarder);
registerLot('shop.herbs', buildHerbs);
registerLot('shop.noodles', buildNoodles);
registerLot('shop.tea', buildTea);

export const place = { id: 'lots-shops-food', name: 'Lots: food shops', order: 2, always: true, build() {} };
