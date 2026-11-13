// The worlds, in the order of the journey. Each world file carries its own card (see ARCHITECTURE.md, "A world file").
//
// The order is Marit Vell's wander year (docs/wander-year.md): out from Herb Row to the far side of the raft and home
// again, so the light delay on the cards climbs to 36.9 seconds and falls back to none. Herb Row comes first and at
// more length, because its drums are a free glide apart and are the ones the docs know best. Within that, Hollows,
// rooms and the outside take turns, and no two neighbours share an hour or a colour. Some ways out were made to meet
// the next way in: Ashgrove's cab doors open where the lake's flight comes up through the ground; the cabs that wake
// in the Sleepers go to fetch the morning's crowd at Rue's station; the train leaving that station goes through its
// lock into the glide's tunnel; and the Long Flight ends the night that Chervil's dawn begins.
import { chervilDawn } from './chervil_dawn.js';
import { sorrelAshgrove } from './sorrel_ashgrove.js';
import { sorrelLake } from './sorrel_lake.js';
import { sorrelSleepers } from './sorrel_sleepers.js';
import { rueCount } from './rue_count.js';
import { theGlide } from './the_glide.js';
import { lovageNoon } from './lovage_noon.js';
import { tansyHens } from './tansy_hens.js';
import { yarrowKites } from './yarrow_kites.js';
import { sorrelOrgan } from './sorrel_organ.js';
import { borageFountains } from './borage_fountains.js';
import { slowLineOut, slowLineHome } from './slow_line.js';
import { sloeWood } from './sloe_wood.js';
import { kittiwakeCrosswise } from './kittiwake_crosswise.js';
import { gloamingDusk } from './gloaming_dusk.js';
import { squallSwell } from './squall_swell.js';
import { carillonChoirs } from './carillon_choirs.js';
import { dulseNoodle } from './dulse_noodle.js';
import { madderGardens } from './madder_gardens.js';
import { ochreChart } from './ochre_chart.js';
import { ochreBackcrew } from './ochre_backcrew.js';
import { speltLoaf } from './spelt_loaf.js';
import { chervilHome } from './chervil_home.js';
import { chervilHall } from './chervil_hall.js';
import { chervilFlight } from './chervil_flight.js';

export const WORLDS = [
  // Herb Row: home, and the neighbours a free glide away
  chervilDawn,            // the dawn painted for the day she left
  sorrelAshgrove,
  sorrelLake,             // lamp-dawn
  sorrelSleepers,         // half past four
  rueCount,               // the morning rush
  theGlide,               // Sorrel to Lovage
  lovageNoon,
  tansyHens,
  yarrowKites,
  sorrelOrgan,            // an evening recital
  borageFountains,        // night
  // the slow line out, then Hedge Row, Gull Row, Weather Row, Bell Row
  slowLineOut,
  sloeWood,
  kittiwakeCrosswise,
  gloamingDusk,
  squallSwell,
  carillonChoirs,
  // Kelp Row, the far side; then Pigment Row and Grain Row on the way back
  dulseNoodle,
  madderGardens,
  ochreChart,
  ochreBackcrew,
  speltLoaf,
  // the slow line home, and Herb Row again: the platform, her table, and Booking night
  slowLineHome,
  chervilHome,
  chervilHall,
  chervilFlight,
];
