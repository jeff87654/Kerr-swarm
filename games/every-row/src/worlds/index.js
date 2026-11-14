// The worlds, in the order of the journey. Each world file carries its own card (see ARCHITECTURE.md, "A world file").
//
// The order is Marit Vell's wander year (docs/wander-year.md): out from Herb Row to the far side of the raft and home
// again, so the light delay on the cards climbs to 36.9 seconds and falls back to none. Herb Row comes first and at
// more length, because its drums are a free glide apart and are the ones the docs know best. Every drum is seen twice
// at least: its Hollow, and a place indoors where its people work, live or play. Hollows, rooms and the outside take
// turns, and no two neighbours share an hour or a colour.
//
// Some ways out were made to meet the next way in. Ashgrove's cab doors open where the lake's flight comes up through
// the ground; the cabs that wake in the Sleepers go to fetch the morning's crowd at Rue's station; the train leaving
// that station goes through its lock into the glide's tunnel; the bright door at the top of Lovage's stair opens on
// its noon; Borage's fair is at the station ring, where the slow line is boarded; the swing school's lift goes up to
// the flying hall; the far end of Gloaming's model drum opens on the real dusk; the stair out of Swell Street comes up
// through the lake into its swell; the mouth of Carillon's tenor bell opens on the choirs; the sled's shift ends in the
// crews' baths; Pell's oven opens on a baker's dawn; and the Long Flight ends the night that Chervil's dawn begins.
import { chervilDawn } from './chervil_dawn.js';
import { sorrelAshgrove } from './sorrel_ashgrove.js';
import { sorrelLake } from './sorrel_lake.js';
import { sorrelSleepers } from './sorrel_sleepers.js';
import { rueCount } from './rue_count.js';
import { theGlide } from './the_glide.js';
import { lovageRise } from './lovage_rise.js';
import { lovageNoon } from './lovage_noon.js';
import { tansyHens } from './tansy_hens.js';
import { sorrelOrgan } from './sorrel_organ.js';
import { yarrowKites } from './yarrow_kites.js';
import { yarrowFirsts } from './yarrow_firsts.js';
import { borageFountains } from './borage_fountains.js';
import { borageFair } from './borage_fair.js';
import { slowLineOut, slowLineHome } from './slow_line.js';
import { sloeHush } from './sloe_hush.js';
import { sloeWood } from './sloe_wood.js';
import { kittiwakeFinYard } from './kittiwake_fin_yard.js';
import { kittiwakeCrosswise } from './kittiwake_crosswise.js';
import { gloamingRehearsal } from './gloaming_rehearsal.js';
import { gloamingDusk } from './gloaming_dusk.js';
import { squallUnder } from './squall_under.js';
import { squallSwell } from './squall_swell.js';
import { carillonPeal } from './carillon_peal.js';
import { carillonChoirs } from './carillon_choirs.js';
import { carillonWindow } from './carillon_window.js';
import { dulseNoodle } from './dulse_noodle.js';
import { dulseKelp } from './dulse_kelp.js';
import { madderGardens } from './madder_gardens.js';
import { madderCradle } from './madder_cradle.js';
import { ochreChart } from './ochre_chart.js';
import { ochreDerby } from './ochre_derby.js';
import { ochreBackcrew } from './ochre_backcrew.js';
import { ochreBaths } from './ochre_baths.js';
import { speltBakehouse } from './spelt_bakehouse.js';
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
  lovageRise,             // up the stair where money lives
  lovageNoon,
  tansyHens,
  sorrelOrgan,            // an evening recital
  yarrowKites,
  yarrowFirsts,           // the school court
  borageFountains,        // night
  borageFair,             // the fair by the station ring
  // the slow line out, then Hedge Row, Gull Row, Weather Row, Bell Row
  slowLineOut,
  sloeHush,               // breakfast, without a word
  sloeWood,
  kittiwakeFinYard,       // the swing school, then the real thing
  kittiwakeCrosswise,
  gloamingRehearsal,      // the afternoon run in the model
  gloamingDusk,
  squallUnder,            // under the lake in swell hour
  squallSwell,
  carillonPeal,           // a naming
  carillonChoirs,
  carillonWindow,         // the same week: Selkie from the Window
  // Kelp Row, the far side; then Pigment Row and Grain Row on the way back
  dulseNoodle,
  dulseKelp,              // where the broth starts
  madderGardens,
  madderCradle,
  ochreChart,
  ochreDerby,             // Madder's third board
  ochreBackcrew,
  ochreBaths,             // after the shift
  speltBakehouse,         // half past four
  speltLoaf,
  // the slow line home, and Herb Row again: the platform, her table, and Booking night
  slowLineHome,
  chervilHome,
  chervilHall,
  chervilFlight,
];
