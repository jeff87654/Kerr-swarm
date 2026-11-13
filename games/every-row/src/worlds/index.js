// The worlds, in the order of the journey. Each world file carries its own card (see ARCHITECTURE.md, "A world file").
import { sorrelLake } from './sorrel_lake.js';
import { chervilDawn } from './chervil_dawn.js';
import { chervilFlight } from './chervil_flight.js';
import { gloamingDusk } from './gloaming_dusk.js';

export const WORLDS = [
  sorrelLake,
  chervilDawn,
  gloamingDusk,
  chervilFlight,
];
