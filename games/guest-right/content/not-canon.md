# Guest-Right: what the game invented

This file lists the small things *Guest-Right* made up while building Chervil: names, customs, sayings, prices, procedures and hours that are not in `docs/`. The big-ticket inventions (the block Candlewick, the staging of the three days, the 53 new people, the plan of the Hollow) are in the "Canon status" section of `../README.md`; this file covers the detail beneath them.

Read it this way: anything listed here is invention, and anything the game shows that is not listed here should trace to `docs/`. Claims that were checked against the docs and found canon are left out, except where the game moved a canon thing somewhere new (usually from Sorrel to Chervil), which is noted. "Not found in docs" means a search of `docs/` turned up nothing, not that the docs rule it out. Paths in backticks are under `src/`.

## Places and their names

- **The guest desk** at Station Ring 2, deck 2: a guest book with its pen on a chain, a board of today's draw, a wall of brass flat keys on coloured cord (a row per block and deck, bare hooks for flats out on loan), a pinboard of wanderers' notes, a hot-water urn. The docs have guest-right but no desk. `places/station_ledger.js`
- **Station Ring 2 as laid out:** the ring counter on the inbound platform, the Gate off it, the guest desk and Ledger hall on deck 2, the Quaysides lane on deck 3, the cab berths on deck 4, platforms numbered (1 and 2, 13 to 24). `content/places.js`, `places/station_platform.js`
- **The Quaysides lane** and its stock: crates of Tansy strawberries, Lovage loaves from the Crock, Lovage cherry tomatoes from the Glasshouse, Ring 2 Cellars cheese, 200 Hollow feast apples, Madder pigment, forty pairs of remade Kittiwake sleeves, six bolts of Sorrel felt; stalls for produce by the crate and offcuts by weight. The sources are canon; the lane is not. `content/signs.js`, `places/station_market.js`
- **Candlewick's shops by name:** the Glass Case (greengrocer), Second Rise (bakery), the Shown Seam (mender), Fast Colour (dyer and tailor), the Long Pipe (flutes), Second Sitting (chairs), the Keeping Room (larder shop), Bring Herbs, Not Gin (herbs), the letter room (Jory's book room), the toy library, the tea cart, the Candlewick clinic, baths and school. `content/places.js`
- **The hall's signs:** THE LONG TABLE and ONE LONG TABLE on the fascia and posters; THE RING 2 HALL on the hanging sign ("the Ring 2 hall" itself is canon, `docs/wander-year.md`). `content/signs.js`, `places/hall.js`
- **Core A and core B**, Candlewick's lift cores: A for the station, B for the Hollow. `content/places.js`
- **Rooms off the court** not in the brief: the block office (with the speaker's stool), the choir room, the fernery ("kept dim by vote, every time it is asked"), the laundry (open all night). `places/block_office.js`, `places/fernery.js`, `places/laundry.js`
- **Flat numbers:** yours 19 · 4 on the deck 19 terrace; the Hallorans 19 · 5; Marit 18 · 9; Oona 17 · 4; the Quists 17 · 11; the night nurse at 17 · 2; a laces-maker at 16 · 92. `content/places.js`, `places/clinic.js`, `places/ladle_row.js`
- **The neighbouring blocks:** Ropewalk (spinward), Pennyfold (anti), Lindenhall (front), Saffron Yard (back), Hassock and Copperdown (up), Marrowfield and Tessera (further out). `content/places.js`
- **The Hollow as laid out:** the lake pavilion (CANDLEWICK CORE), the lake shore and jetty in Ring Three, the robe house, orchard rows in Rings Two to Four (row 14 a russet, also "bramble red" and "late gold" apples), lawns in Rings Four to Six, the kite field in Ring Five, the festival green and bandstand in Ring Six, the foot of the back wall in Ring Nine. `content/places.js`, `places/hollow_places.js`
- **The back wall as built:** the Dawn Stand's tiers, the elders' terrace on the fourth tier, the Third on tier ten with a sprung floor, a band shell and a slow fountain whose jets climb eight metres and land three spinward, the Spindle lift, the back flying hall (a netted sock about 300 m long) and the sleeve hire at its gate. `content/places.js`, `places/back_wall.js`
- **Named works of light-painting:** Oona's "The Long Dusk" (twelve years ago), Ivo Rautio's "Green Hour" (the dawn of the refuge year), Hesper Moll's "Tidewater" (the Thursday's dawn). `places/studio.js`, `content/signs.js`
- **Moved from Sorrel.** Several Chervil places copy named Sorrel places in `docs/sorrel.md`, `docs/ashgrove.md` and `docs/eating-out.md`, with Chervil's name on them: the robe house, the kite field, the bandstand that waits for its echo, the jetty, the toy library that mends between borrowers, the sleeve hire that keeps your shoes, the Keeping Room's board, larder sour and "Knotnight all year" (Sorrel's The Larder), the sugar bun cheaper than a tomato under a linen lid (the Lidded Oven), "the Dim End", and the Window visit at eight with one chosen adult after twenty minutes in red light. That Chervil has these is the game's choice.

## People

- **Canon:** Marit Vell, Jory, Oona and Pell (`docs/open-drums.md`, `docs/wander-year.md`). Also canon and mentioned: Abelone of Dulse, and the drums Dulse, Madder, Ochre, Spelt, Kittiwake, Sloe and Selkie.
- **Invented about the canon four** (`content/cast.js`, `content/dialogue/*.js`, `places/flats.js`):
  - *Marit:* cooking Thursdays and the feast, with Rhoswen, a volunteer, running the kitchen on the other days (the docs say only that she starts at the hall on Thursdays); her great-grandfather's name, Aurel Vell, his oversized table and his armchair; her flat number, 18 · 9.
  - *Jory:* his age (28); his work, keeping the letter room on Wick Court (he lives on Thread Street); Marit's long wall measured at 4.60 m, a 30 cm shelf, a plan of poetry 2.4 m and letters 1.1 m, and "about a tonne of paper".
  - *Oona:* her flat and studio in Candlewick; her apprentice Suvi; her teacher Ivo, who took her on at fifteen; her earlier work "The Long Dusk"; "fixing the middle for nine years"; the jar labelled "BRUISE, OCHRE, YOU WERE RIGHT".
  - *Pell:* his age as 72 (the docs make him 71 at Marit's visit, so it fits); sending a spoon of the year's mother to Marit by the player (in the docs Marit sends him a spoon of hers).
- **The other 53** are all new to this game (`content/cast.js`), with their ages, work and everything they say:
  - *Station Ring 2:* Sefa Lindgren (guest desk), Tomas Ilunga (ring counter), Agathe Nwosu (Keeper of the Ledger for thirty years, placeless and childless; "keepers of the Ledger" as a post of standing is canon), Noor Batista (the Gate), Arturo Okonjo (cab berths).
  - *Visitors:* Hollis Brandt and Yusra Kell (canon only as "two of Rue's councillors"), Mags Ferreira (felt-hanger from Sorrel; Sorrelers selling hours in Chervil is canon), Kofi Amsel (horn player from Sorrel).
  - *The hall:* Rhoswen Achterberg (a volunteer who runs the kitchen on the other days) and six of the canon eleven volunteers: Mina Sato, Gideon Farrow, Pilar Nakamura, Teodor Bakker (who cuts the apples), Femi Rasmussen, Clem Oduya.
  - *Trades:* Fausta Reyes, Idris Tamm, Wim Adebayo, Priya Castellane, Matti Erdem, Gustav Lomu, Ros Tagaloa, Ben Mwangi, Zhenya Kurt, Amadou Sorensen.
  - *Care and teaching:* Nkem Halloway (nurse), Dorota Fane (baths), Lucan Ferro (teacher), Suvi Danso (Oona's apprentice).
  - *The block:* Halima Brandvold (speaker of the block court), Nell Okonjo, Edda and Barnaby Quist, Ines and Kwame Halloran with Pip (7) and Esi (10), and the children Tavi Brennan, Rafe Oyelaran and Lumi Castellane.
  - *Wanderers:* Ama Lindoe from Dulse, who learned noodles in Abelone's kitchen; Yoav Teller from Madder, "the first of his year to go wandering".
  - *The Hollow:* Marisol Tran (Dawn Stand), Bertil Osei (sleeve hire), Ayo Lindqvist (warden), Connie Mbaye (choir), Rufus Adeyemi (band), Dagny Vos (brush crew), Ezra Kowalczyk (robe house).
  - *The elders' terrace:* Augusta Nwachukwu (104), Salo Mendel (97), Ivo Rautio (92).
- **Named but not cast:**
  - Hesper Moll, a young lamp-painter; Ama Tamm, who registered Second Rise's mother 106 years ago (kept since by "the Tamm table").
  - Ada and Nico, Nell's children; Dov and Hanne Sallis, who stopped asking for a third and became aunts at three tables. `content/dialogue/scenes.js`
  - The couples on the flat-lottery board (Sela and Joon, Mirela and Ade, Hanne and Kit, Ola and Benedek), and the lobby-notice neighbours Imre, Mirela and Sami. `places/block_office.js`, `places/lobbies.js`
  - The hundred-odd names on the Ledger's two columns, including three gift adoptions from outside the family (Petra Lindau, Samuel Oyo, Kalinda Moss). `content/ledger.js`
  - The households on the Keeping Room's crock tags (Okafor, the Satos, Marsh, Holm and Paz, Adeyemi, "the Aunts", Flat 19C) and the school's Mill-table aunts Bo and Kemi. `places/larder.js`, `places/school.js`

## Customs and sayings

- **Take a spoon, leave a spoon** at Second Rise: a shelf of small starter crocks tagged by drum (Sorrel, Tansy, Rue, Borage, Hassock, a cycler galley, one from Lovage "not the Crock's"). The phrase is canon for the Wanderers' Galley (`docs/eating-out.md`) and the habit for Pell's crock room (`docs/wander-year.md`); a shop in Chervil doing it is new. `places/bakery.js`
- **The Margin bun**, stamped with the year's Margin figure, a new stamp cut every Booking Day. `content/menus.js`, `places/bakery.js`
- **Crocks lent, crocks back:** the Keeping Room lends glazed crocks, tags them by household, posts a "Crocks out" list, and keeps a card marked "Guests". `places/larder.js`
- **"A good larder holds fifty-five days. A proud one holds sixty."** The docs give 55 days as the drum's air reserve and say families keep the food as a matter of pride; tying a family larder to the same figure is new. `places/larder.js`
- **Hand lamps** lent from the Keeping Room for Knotnight and the cold store; one kept by the door of every flat in Chervil. `places/larder.js`, `content/items.js`
- **The Row shelf** at the herb shop: one pot for each of the seven Herb Row drums, its lamp left on all night; tansy kept "to look at" and not sold, chervil labelled "our own". `places/herbs.js`
- **Herb manners:** the host's sprig tied in green thread at no extra cost; "give it at the door, not after dinner"; a sprig of chervil in every buttonhole on Booking Day. `content/dialogue/shops.js`, `content/chatter.js`
- **Apples leave the Glass Case in rose tissue,** because one bought is about to be given. `content/dialogue/shops.js`
- **Festival colours** at Fast Colour: Bruise, Dawn Rose, Far-Bank Gold, Flight Indigo, Chervil Green, Lid Copper; half the block in green on Booking Day; a dye swap on Thread Street. `content/menus.js`, `places/thread_street.js`
- **Coats read on the Quiet:** people bring old coats to the mender only to have their seams read. **Names under chairs:** everyone who has a chair remade writes their name under it in pencil. `content/dialogue/shops.js`
- **The long pour** at the tea cart (the physics is canon, `docs/eating-out.md`); lidded cups lent and returnable to any cart in the block. `content/menus.js`
- **A lid for the guest:** Marit gives a dented, numbered hall lid to a guest who has carried. Hall lids are numbered (no. 211 is lost) and counted back onto pegs. `content/items.js`, `places/hall_kitchen.js`
- **At the fifth gin** somebody slides a bowl of jook along the table. In the docs this is Sorrel's gin cellar, the Thiamine. `content/dialogue/marit.js`
- **The guest desk's habits:** Sefa draws a picture beside each drum's name (a loaf for Spelt, a noodle for Dulse, a pencil for Rue); wanderers pin a note and a thread from their clothes to a board. `content/dialogue/station.js`, `places/station_ledger.js`
- **Homecoming lamps:** families hang a tagged lamp on the platform for their wanderer and light them all at lamp-dawn. Homecoming with hand lamps is canon; the rack is not. `places/station_platform.js`
- **The Keeper's bell,** rung once before the Booking Day reading; the Keeper reads for an hour and the board scrolls the rest. `places/station_ledger.js`, `content/dialogue/station.js`
- **Somebody always takes Rue's councillors tea** (canon), and Rue writes down who it was each year (new). `content/dialogue/station.js`
- **The speaker's stool**, carried out to Wick Court on sitting nights, with eleven earlier speakers' names scratched under it. **The court's form:** each matter read as "Item", answered aloud, closed with "Done"; "Who has waited longest?" asked before every leave; the sitting over in eleven or twelve minutes. `places/block_office.js`, `content/dialogue/scenes.js`
- **Rooms let for hours:** lift-lobby notices offer rooms for carrying shopping on Tuesdays or an hour a day reading aloud; flats lent free to a neighbouring block for the festival. `places/lobbies.js`
- **Augusta's words:** an elder who gives every Booking Day dawn one word ("Damp", "Polite", "Enough", and for Oona's, "Kept"). **Salo's book** of flight times. `content/dialogue/hollow.js`
- **Toys come back scuffed:** "a spinball that comes back clean has not been used"; one whistle never comes back on Booking Day. `content/threads.js`, `content/dialogue/shops.js`
- **Things with histories:** second-hand goods on the Quaysides carry a card of owners; the mender writes each mend's year inside the coat; an heir moves the old door plate inside when theirs goes up; odd socks at the laundry are "take one, leave one"; blankets lent there for the Long Flight. `places/station_market.js`, `places/mender.js`, `places/flats.js`, `places/laundry.js`
- **Street rules:** no sewing machines on Thread Street after ten; flute practice after ten taken to the court. `places/thread_street.js`, `content/signs.js`
- **Music by the week:** the choir in Wick Court at half past seven, "choir in the steam" at the baths on Fridays, "long pipes in the court" on Thursdays, a round before the feast at 12:45. `places/choir_room.js`, `places/baths.js`, `places/flutes.js`
- **Sayings** not found in docs: "Where have you slept? Have you eaten?" on the platform banner and the guest desk plate (from the brief, not the docs); "Sorrel asks your deck, Ring and Hour. Lovage asks if you have booked. We ask about your stomach." (the Sorrel half is canon); "Lids on. Always. Then always again."; "Throw anti to sail. Throw spin to dive. Throw along to score."; "Spinward's for losing."; "Point, don't tap"; "What is said in the steam stays in the steam. Mostly."; "The best chair in a room is the oldest one" (the idea is canon, the motto is not); "Feet first if unsure."

## Numbers

Prices not on any canon menu or price list. Most use the canon rates (about 25 kWh a kilogram of new mass, about 6 kWh an hour in Chervil), and those sums check unless stated.

- **Second Rise:** plait 2.20, country boule 0.70, batard 0.60, tin loaf 0.50, sugar bun 0.40, six cheese puffs 0.30, the Margin bun 0.40. (Lovage loaf 1.10, croissant 0.55, cheese-pull bread 0.90 and honeycomb cake 0.30 are canon.) `places/bakery.js`, `content/menus.js`
- **The Glass Case:** a tomato weighs "about 120 grams"; pea shoots 0.16. (Its other prices are canon.) `content/menus.js`
- **The Keeping Room:** miso 0.55 a 100 g jar, black garlic 0.20 a head, preserved berries 0.60, rusks 0.25 a bag, a tin of the Nine 0.17 (the canon price of a bowl); a new crock "most of two days' wallet in clay". `content/menus.js`, `places/larder.js`
- **The Knotnight list:** 64 crocks of miso, 120 of larder sour, 410 jars of berries, 1,200 bags of rusks, 300 cheeses turned, 171 of 184 crocks back. `places/larder.js`
- **Herbs and tea:** the Row in sprigs, six tied, 0.18; a rooted basil cutting 0.06; milk tea 0.20; one sour-starch puff 0.05. `content/menus.js`
- **Fast Colour:** collar and cuffs 0.05; let out a seam 6; weight a hem 3; a new lining 17. `content/menus.js`
- **The Shown Seam:** shown patch 3.25, darn 1.55, gold-picked mend 6.05, resole 11, hand-lamp mend 1.5, sleeve fin 3. `content/menus.js`
- **The Long Pipe:** lesson 6, tuning 1.5, remade flute 12.25, new beginner's flute 58. `content/menus.js`
- **Second Sitting:** re-glue 6, new feet 3, re-cover 19.5, remake 85; remade chairs on the board by age and families, at 90 to 124 (a ladderback of 140 years at 124, a bow-back of 96 years at 108); a sofa remade for about 340. A new chair at 125 and a new sofa at 1,000 are canon. `content/menus.js`, `places/chairs.js`
- **The letter room:** a letter on paper 0.25; a blank card home 0.05 (not found in docs); paper books lent for a month. `content/menus.js`, `places/books.js`
- **Wing-sleeve hire:** a turn (an hour) 0.05; a crosswise lesson 3; a hand lamp for the night 0.01; sleeves free on the Long Flight; shoe pegs 1 to 400. `content/menus.js`, `content/signs.js`
- **The laundry:** a load 0.24 at lamp-noon, 0.20 mornings and evenings, 0.15 after eleven, 0.12 from one till lamp-dawn. That power is dearest at lamp-noon is canon (`docs/economy.md`); the figures are not. `places/laundry.js`
- **Rent:** the Quists charge 0.05 a square metre a day, 0.90 for an 18 m² room, called "half a steady drum's". The docs give about 0.1 for a steady drum and say an open drum's rents run low, without a figure. `places/flats.js`, `content/discoveries.js`
- **The feast as plated:** a 200 g steak, two side salads, three slices of cheese, a slice of the Lovage loaf (worth 0.28), half an apple and a glass of wine (worth 0.30), about 7.9 kWh against the docs' 9.6 a head. 400 steaks and 200 apples; Teodor cuts at every stretch of table. `content/menus.js`, `content/signs.js`
- **The station:** glide cars every few seconds, first car 05:00, last car 01:00, freight only between (Sorrel's Ring Nine has "the last train at one"; the rest is new); about two hundred wanderers a day through the guest desk, most of them on their eighth or ninth leg; one crate in fifty to the Gate. `content/signs.js`, `content/dialogue/station.js`, `content/chatter.js`
- **The Ledger between days** is derived from the canon Booking Day figures (about 4,455 births, 4,430 deaths and 55 refuge arrivals a day); Candlewick's line (3,040 people, 26 born, 25 died, room for one third) is derived from canon rates. `content/ledger.js`
- **The Hollow and the Flight:** an apple crate of fifty is "ten days of somebody's wallet" (220 kWh); the harvest weighed (russet 61 kg, bramble red 48, late gold 30); a strong flyer does the axis in twenty minutes, a block in about forty (Candlewick, 41); Salo's watch is 40 g of brass, a kay of new metal. `content/dialogue/hollow.js`, `places/hollow_places.js`
- **Oona's dawn:** rose to gold in 41 minutes. The colours and the twenty minutes of gold are canon; the 41 is not. `places/studio.js`
- **Spans:** Agathe thirty years as Keeper; Nkem fifteen years at the clinic; Nell eleven years at Second Rise and three years asking; Salo flew until ninety; Augusta's first dawn at seven, and none missed since; Second Rise's mother registered 106 years ago.

## Institutions and how things work

- **Signing in:** the guest book, the two questions, a chit and a key from a daily draw of Margin flats posted by block and flat number. The docs have a draw for the best flats on couples' loans; a daily draw for guests is the game's extension. `places/station_ledger.js`
- **Staying past three nights:** "A hall may keep a guest who cooks, teaches or mends"; "Marit keeps anyone who cooks"; a lobby notice offers a room for a guest who cooks two nights a week. The docs have Dulse letting visiting cooks stay as long as they cook; making it Chervil's practice is new. `content/signs.js`, `places/lobbies.js`
- **The block court as staged:** it sits at 19:00 on the Quiet with Halima as speaker; the matters are flute practice after ten (felt to be hung), heat at the spinward end of deck 20 (a pump is coming), a room swap between 18 · 3 and 21 · 6, a Hollow turn swapped with Hassock (the ninth for the eleventh, with the lake), and the Okonjos' leave for a third, granted aloud. The court, its four kinds of business and leave for thirds are canon; the procedure and the matters are not. `content/dialogue/scenes.js`
- **The block office boards:** the flat lottery (named couples, "lent five years, then the next", next draw after Booking Day); the Hollow draw by date (lawns on the 4th, lake on the 9th and 11th, orchard on the 15th with the brush crews, kite field on the 22nd "children first"); the block's year (born, died, thirds by leave, room). `places/block_office.js`
- **The Hollow's week:** on ordinary days, turns by lottery and by deck band (mornings for decks 16 to 60, afternoons for 61 to 120), changing on the hour, with picnic cloths lent; on the Quiet and Booking Day open to all. Canon has Hollow hours "by lottery and in festivals" without a timetable. `places/hollow_places.js`
- **The hall kitchen:** one hotplate, thirty seconds a side; a wall of numbered lids; a card of feast numbers; steaks from "vat line 4, started six weeks ago"; the Quiet as a day the kitchen cooks small. `places/hall_kitchen.js`, `content/dialogue/marit.js`
- **Whatever the aunts made** is canon at about 0.5; the dishes (Mina's cold sesame tofu, Pilar's dumplings folded Selkie's way, Gideon's black vinegar eggs) are new. `content/menus.js`
- **The ring counter's sprig rota:** coriander on the Thursday, chives on the Quiet (carried down from the herb shop because the hall cuts small), chervil for every ring counter at once on Booking Day. `content/menus.js`, `content/threads.js`
- **The letter room:** one letter read aloud each evening at eight; on the Quiet an old one at two. The docs say only that "some drums hold readings when an old letter lands". `content/menus.js`
- **The clinic:** a chair by the door for anyone who wants to talk; "bone days", when children are measured yearly in their birthday week; elders monthly; a night bell answered from 17 · 2. Births seen and registered "proofread or not" is canon. `places/clinic.js`
- **The school:** spinball at break, a Mill table at twelve served by aunts on a weekly rota, lamp-painting with Oona, home at three, no school on the Quiet, a posted Window round naming the next eight-year-olds, fixtures against neighbouring blocks, lines repainted weekly. Light panels at twenty minutes are canon. `places/school.js`, `content/signs.js`
- **The baths:** wash first, soak second; robes on a warm rail; a very hot pool and a cool plunge; broth from an urn. `content/signs.js`, `places/baths.js`
- **The Dawn Stand:** Marisol walks the tiers at half past four to choose the morning's spot; a chalkboard names each dawn and painter; open five to eleven. The stand, its prices and "the queue starts at five" are canon. `content/dialogue/hollow.js`, `content/menus.js`
- **The elders' terrace:** benches, rugs and a rail on the fourth tier, "by custom, ask to sit", full of lidded glasses of gin on the Long Flight. Oona there with her gin is canon. `content/places.js`, `content/discoveries.js`
- **The Long Flight by shifts:** Candlewick and Ropewalk at 22:00, Pennyfold and Hassock at 23:30, Lindenhall and Tessera at 01:00, "anyone still awake" at 02:30; sleeves and lamps from nine. Shifts, and wardens with red lamps, are canon in outline (`docs/open-drums.md`, `docs/sorrel.md`); the rota is new. `content/signs.js`
- **The Gate:** a sequencer reads a declared starter while you wait; a child once brought a pocket of soil from Tansy. `content/dialogue/station.js`

## The three days as staged

- **Thursday:** arrive by glide a little before ten; the ring counter; sign in and draw; a cab up to Candlewick; Marit at the pass from eleven, ramen at one; Hesper Moll's dawn that morning; the band on the green at six; the choir at half past seven; the reading at eight; Rue's councillors already reading the Ledger each morning.
- **The Quiet:** worlds off from midnight; a plain dawn, "warm, then white"; the feast's apples carried from the lake pavilion and four hundred places laid; Oona running her dawn on the model every hour; old songs at the bandstand; an old letter at two; the block court at seven; Kofi crossing from Sorrel, which "doesn't keep the Quiet".
- **Booking Day:** the canon hours (06:00 dawn, 08:30 Ledger, 10:00 booking and question, 13:00 feast, 17:00 vote, 22:00 Long Flight, 02:00 Oona on the elders' terrace) are kept. Added: the Glass Case shut at noon; the choir's round at 12:45; reels on the Third and the band from 15:00; the last chord at 20:00; the flight shifts; Candlewick back down after 41 minutes.
- **The fourth morning:** a card home to Pell, or stay "as long as you cook". The game's Booking Day falls on a Saturday (`places/school.js`).

## Where the game strains against canon

The text was checked against `docs/` when the game was finished, and about sixty slips were corrected (a dated "spring", leather, a moon, compass directions, a glide car of six seats, two hall cooks, the wrong count of drums in the mother, and others). What is left is listed here: places where the game still differs from the docs, on purpose or because the fix would have cost more than it was worth.

Against the docs:

- **The three guests at the feast.** `docs/open-drums.md` has three wanderers "from the far side of Merrow", one of them "from a drum Marit slept in last year". The game's three are from Dulse, Madder and Spelt (`content/dialogue/scenes.js`), all drums Marit stayed in, and only Dulse is on the far side. The game made you, from Spelt, one of the three, and tied the other two to her year as well.
- **Pell's spoon goes the other way.** In `docs/wander-year.md` Marit sends Pell a spoon of her own mother. In the game Pell also sends a spoon of the year's mother back to her, by you.
- **Two hundred guests a day** at Ring 2's desk (`content/dialogue/station.js`, `places/station_ledger.js`). About 410,000 guests on three-night stays is some 137,000 arrivals a day across the drum, so one desk of many.
- **A leather look.** No text calls anything leather any more, but several shops draw book and case covers with a render material named `leather` (a grained surface). Read it as waxed cloth.
- **Moved from Sorrel.** The robe house, the kite field, the bandstand that waits for its echo, the jetty and the toy library are Sorrel places in `docs/sorrel.md`, `docs/ashgrove.md` and `docs/eating-out.md`. Chervil has its own here, on the reasoning that every drum's Hollow has them.
- **Chervil's hours.** The docs give Sorrel's day (dawn at six, lamps from half past six to eleven). The game gives Chervil the same.

Inside the game:

- **Re-dyeing at 0.1** includes none of Priya's time, though every other Thread Street price does. The 0.1 is canon (`docs/open-drums.md`); the clash is the game's.
- **The day runs fast.** A day takes forty-eight minutes unless the player changes it, so the three hours of Oona's dawn pass in about six. The docs' hours are kept; the clock is the game's.

## Things worth promoting

1. **Take a spoon, leave a spoon on a bakery shelf.** Carries the canon Galley custom into the drums and makes every bakery a stop on the wander year.
2. **The Margin bun.** Puts the Ledger's figure in people's hands once a year, for the price of a stamp.
3. **Crocks lent, crocks back,** tagged by household. The larder made public, and a direct consequence of the price of new mass.
4. **The Row shelf:** one pot per drum on the Row under a lamp left on all night. A plain way to show what a row is.
5. **"A hall may keep a guest who cooks, teaches or mends."** A rule for staying past three nights that suits a hall drum and matches Dulse.
6. **The block court's form** ("Item", aloud, "Done", and "Who has waited longest?" before every leave). Gives the canon court a shape without adding powers.
7. **The Long Flight by block shifts** on a posted rota, which the Spindle's canon 660,000 already implies.
8. **Festival colours named for the year's dawn.** Ties canon re-dyeing to canon light-painting.
9. **Rooms let for hours** (carrying, reading aloud). Shows the time economy at the scale of a lift-lobby notice.
10. **Homecoming lamps** hung on the platform and lit at lamp-dawn. A concrete form for the canon Homecoming.
