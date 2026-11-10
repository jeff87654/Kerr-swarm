// The people of Chervil: built after every other place, so it can see all their spots and walkways.
import { createPeople } from '../sim/people.js';

export const place = {
  id: 'people', name: 'People', order: 900, always: true,
  build(game) {
    if (game.people && game.people.clear) game.people.clear();
    const people = createPeople(game);
    game.people = people;
    if (!game._peopleHooked) {
      game._peopleHooked = true;
      game.events.on('update', (dt) => { try { if (game.people) game.people.update(dt); } catch (e) { console.error('[people] ' + (e && e.stack ? e.stack : e)); } });
    }
    const q = game.params || {};
    if (q.people !== undefined && q.people !== true) people.setDensity(parseFloat(q.people));
  },
};
