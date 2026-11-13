// The worlds, in the order of the journey. Each entry is the card for a world and the function that builds it.
//   id       short name, used in links (?w=id)
//   title    the picture on the card
//   drum, row, kind   where it is and what kind of drum
//   light    seconds for light to reach Chervil, Station Ring 2, from there (the card's postmark)
//   line     a sentence or two in the hand of whoever sent the card
//   tone     a colour for the card's edge and for the mist in an opening before the next world shows
//   source   which doc the place comes from
import { sorrelLake } from './sorrel_lake.js';
import { chervilFlight } from './chervil_flight.js';

export const WORLDS = [
  {
    ...sorrelLake,
    title: 'Lamp-dawn on the lake', drum: 'Sorrel', row: 'Herb Row', kind: 'a steady drum', light: 0.0,
    line: 'The old have the lake until nine. You come up through the ground among apple trees, and then you look up and keep looking.',
    tone: '#e8c99a', source: 'ashgrove.md, sorrel.md',
  },
  {
    ...chervilFlight,
    title: 'The Long Flight', drum: 'Chervil', row: 'Herb Row', kind: 'an open hall drum', light: 0.0,
    line: 'Booking night. The sunline stays dark and everyone goes up with their block. Almost four kilometres of small lights, like a slow river.',
    tone: '#ffcf8a', source: 'open-drums.md',
  },
];
