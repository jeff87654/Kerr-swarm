// The back wall's high tiers, where weight runs out: three terraces on the disc at drum z = 3750, each in its own frame
// because a frame is flat metres at one radius. In every frame z = 0 is the wall, the terrace sticks out toward the
// Hollow at negative z, yaw 0 faces the Hollow, and the engine paints the rest of the wall and draws the Hollow round it.
//   1. The Quarter (tier fifteen, rho 750, a quarter of a g): the slow fountain and the Tea Steps.   lm_back_upper_quarter.js
//   2. The Tenth (tier twenty-four, rho 300, a tenth of a g): the practice floor.                    lm_back_upper_tenth.js
//   3. The Twentieth (tier twenty-seven, rho 150, a twentieth of a g): the highest garden.           lm_back_upper_twentieth.js
// Wall lifts join them in order, from the Third below to the flying hall's gate above.
import { buildQuarter } from './lm_back_upper_quarter.js';
import { buildTenth } from './lm_back_upper_tenth.js';
import { buildTwentieth } from './lm_back_upper_twentieth.js';

const frameWait = () => new Promise((res) => { let done = false; const go = () => { if (!done) { done = true; res(); } }; requestAnimationFrame(go); setTimeout(go, 50); });

export const place = {
  id: 'lm-back-upper', name: 'The back wall, high tiers', order: 10,
  region: 'back-upper',
  stops: [
    { id: 'back-quarter', name: 'The Quarter', sub: 'the back wall · tier fifteen · a quarter of a g', group: 'The end walls', spawn: 'back-quarter', deck: 376, zd: 3750 },
    { id: 'back-tenth', name: 'The Tenth', sub: 'the back wall · tier twenty-four · the practice floor', group: 'The end walls', spawn: 'back-tenth', deck: 376, zd: 3750 },
    { id: 'back-twentieth', name: 'The Twentieth', sub: 'the back wall · tier twenty-seven · the top garden', group: 'The end walls', spawn: 'back-twentieth', deck: 376, zd: 3750 },
  ],
  async build(game) {
    const ms = [];
    const step = (fn) => { const t = performance.now(); fn(game); ms.push(Math.round(performance.now() - t)); };
    step(buildQuarter);
    await frameWait();
    step(buildTenth);
    await frameWait();
    step(buildTwentieth);
    console.log('[lm-back-upper] built: quarter ' + ms[0] + ' ms, tenth ' + ms[1] + ' ms, twentieth ' + ms[2] + ' ms');
  },
};
