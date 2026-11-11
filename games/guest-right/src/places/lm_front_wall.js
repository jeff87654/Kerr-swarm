// The front end wall: the quieter wall, at the power end of the drum. Two tiers, each in its own frame because a frame is
// flat metres at one radius. In every frame z = 0 is the wall, the terrace sticks out toward the Hollow at POSITIVE z,
// yaw 3.1416 faces the Hollow, and the engine paints the rest of the wall and draws the Hollow round it.
//   1. The Warming Shelf (tier one, rho 1450, 0.48 g): the dusk terrace, the Dusk Steps, the shelf flats, the Last Pot,
//      the telescope, the dusk book, the guests' bench.                                          lm_front_wall_shelf.js
//   2. The front Third (tier ten, rho 1000, a third of a g): the wedding terrace, the Two Lids, the long table, the band's
//      corner, the petals.                                                                       lm_front_wall_third.js
// A wall lift joins them. Shared parts and props: lm_front_wall_parts.js.
import { buildShelf } from './lm_front_wall_shelf.js';
import { buildThird } from './lm_front_wall_third.js';

const frameWait = () => new Promise((res) => { let done = false; const go = () => { if (!done) { done = true; res(); } }; requestAnimationFrame(go); setTimeout(go, 50); });

export const place = {
  id: 'lm-front-wall', name: 'The front wall', order: 10,
  region: 'front-wall',
  near: { frame: 'hollow', x: 0, z: 0, r: 320 },
  stops: [
    { id: 'front-shelf', name: 'The Warming Shelf', sub: 'the front wall · tier one · the dusk terrace', group: 'The end walls', spawn: 'front-shelf', deck: 376, zd: 0 },
    { id: 'front-third', name: 'The front Third', sub: 'the front wall · tier ten · the wedding terrace', group: 'The end walls', spawn: 'front-third', deck: 376, zd: 0 },
  ],
  async build(game) {
    const ms = [];
    const step = (fn) => { const t = performance.now(); fn(game); ms.push(Math.round(performance.now() - t)); };
    step(buildShelf);
    await frameWait();
    step(buildThird);
    console.log('[lm-front-wall] built: the Warming Shelf ' + ms[0] + ' ms, the front Third ' + ms[1] + ' ms');
  },
};
