// places.js: every place the game builds. Ids are fixed (other parts look them up).
// area: 'station' | 'candlewick' | 'hollow' | 'terraces' | 'spindle' | 'city' | 'keel' | 'lines' | 'walls' | 'axles'.
// keeper is a cast id where the place has one.
// PLACES.neighbours (non-enumerable, so Object.keys(PLACES) lists places only)
// holds the blocks round Candlewick, for signs that point out of it.

export const PLACES = {
  // Station Ring 2: the Keel, decks 1 to 4, a full g.
  platform: {
    name: 'the glide platform', sign: 'STATION RING 2', area: 'station', kind: 'platform',
    sub: 'Station Ring 2 · deck 1 · the rim',
    blurb: "The rim deck at a full g, where glide cars come in through the jacket from Sorrel and go out again every few seconds.",
  },
  ledger: {
    name: 'the Ledger hall', sign: 'THE LEDGER', area: 'station', kind: 'hall',
    sub: 'Station Ring 2 · deck 2',
    blurb: "Where the Ledger posts shares, people, the Margin and the names, with the old Count board hanging beside it so nobody forgets why.",
    keeper: 'agathe',
  },
  counter: {
    name: 'the ring counter', sign: 'RING COUNTER', area: 'station', kind: 'counter',
    sub: 'Station Ring 2 · deck 1 · the inbound platform',
    blurb: "A hatch that gives every arrival a free cup of Mill broth and a sticky rice ball, with a sprig of whatever the hall cut today.",
    keeper: 'tomas',
  },
  guestdesk: {
    name: 'the guest desk', sign: 'GUEST DESK', area: 'station', kind: 'desk',
    sub: 'Station Ring 2 · deck 2 · by the Ledger hall',
    blurb: "Where guest-right is signed: three nights in a Margin flat, a seat at any hall's table, and a key from the draw.",
    keeper: 'sefa',
  },
  quayside: {
    name: 'the Quaysides lane', sign: 'QUAYSIDES', area: 'station', kind: 'market',
    sub: 'Station Ring 2 · deck 3',
    blurb: "A market lane of crates and stalls, where produce comes in sealed from along the Row and goes up into the drum by cab.",
  },
  gate: {
    name: 'the Gate', sign: 'THE GATE', area: 'station', kind: 'quarantine',
    sub: 'Station Ring 2 · deck 1 · off the inbound platform',
    blurb: "Chervil's quarantine for anything alive, seen through glass. Here a stray phage is stopped before it can become a famine.",
    keeper: 'noor',
  },
  'station-lobby': {
    name: 'the Ring 2 lift lobby', sign: 'CAB BERTHS', area: 'station', kind: 'lobby',
    sub: 'Station Ring 2 · deck 4',
    blurb: "Cab berths off the lift core, where one party at a time is carried up into the drum in a small room that leans.",
    keeper: 'arturo',
  },

  // Candlewick: a block of about 3,000 on decks 16 to 21, Ring Two, 0.98 g.
  court: {
    name: 'Wick Court', sign: 'WICK COURT', area: 'candlewick', kind: 'atrium',
    sub: 'Candlewick · decks 16 to 21 · Ring Two',
    blurb: "Candlewick's atrium, six decks tall and lit like an overcast day, where the block court sits and there is music most evenings.",
    keeper: 'halima',
  },
  'ladle-row': {
    name: 'Ladle Row', sign: 'LADLE ROW', area: 'candlewick', kind: 'avenue',
    sub: 'Candlewick · deck 16 · runs spinward',
    blurb: "Candlewick's avenue, running spinward past the hall. Walk it far enough and you can see the floor curve up ahead of you.",
  },
  'thread-street': {
    name: 'Thread Street', sign: 'THREAD STREET', area: 'candlewick', kind: 'street',
    sub: 'Candlewick · deck 16 · runs along the axis',
    blurb: "The street along the axis where the menders and makers are, and where your weight stays the same whichever way you walk.",
  },
  hall: {
    name: "Marit Vell's Hall", sign: 'THE LONG TABLE', area: 'candlewick', kind: 'hall',
    sub: 'Candlewick · deck 16 · Ladle Row',
    blurb: "One room 124 metres long with one table down it, four hundred seats and an open kitchen in the middle. You'll be seated next to someone.",
    keeper: 'marit',
  },
  kitchen: {
    name: 'the hall kitchen', sign: 'KITCHEN · LIDS ON', area: 'candlewick', kind: 'kitchen',
    sub: "Marit Vell's Hall · the middle of the table",
    blurb: "The open kitchen at the hall's middle: pots held on the 65 degree loop, one hotplate for searing, and a wall of numbered lids.",
    keeper: 'rhos',
  },
  greengrocer: {
    name: 'the Glass Case', sign: 'THE GLASS CASE', area: 'candlewick', kind: 'shop',
    sub: 'Candlewick · deck 16 · Ladle Row',
    blurb: "A greengrocer's that is the nearest thing Candlewick has to a jeweller's: tomatoes at half a kay each, under glass.",
    keeper: 'fausta',
  },
  bakery: {
    name: 'Second Rise', sign: 'SECOND RISE', area: 'candlewick', kind: 'shop',
    sub: 'Candlewick · deck 16 · Ladle Row',
    blurb: "The block's bakery: buns, puffs and steamed cakes from four in the morning, and the Lovage loaf, honestly labelled.",
    keeper: 'idris',
  },
  mender: {
    name: 'the Shown Seam', sign: 'THE SHOWN SEAM', area: 'candlewick', kind: 'workshop',
    sub: 'Candlewick · deck 16 · Thread Street',
    blurb: "A mender's where every mend is meant to be seen, and a coat's seams tell its owners' story.",
    keeper: 'wim',
  },
  dyer: {
    name: 'Fast Colour', sign: 'FAST COLOUR', area: 'candlewick', kind: 'workshop',
    sub: 'Candlewick · deck 16 · Thread Street',
    blurb: "The dyer and tailor's, where colour weighs nothing and a coat can be re-dyed for the festival for a tenth of a kay.",
    keeper: 'priya',
  },
  flutes: {
    name: 'the Long Pipe', sign: 'THE LONG PIPE', area: 'candlewick', kind: 'workshop',
    sub: 'Candlewick · deck 17 · Thread Street',
    blurb: "A flute maker's hung with heliox flutes about 1.2 metres long, each one tuned in the shop's own air.",
    keeper: 'matti',
  },
  studio: {
    name: "Oona's studio", sign: 'LAMP-PAINTING', area: 'candlewick', kind: 'studio',
    sub: 'Candlewick · deck 18 · on the terraces',
    blurb: "A lamp-painter's studio with a model Hollow on the table and a sunline no longer than your arm, for rehearsing dawns.",
    keeper: 'oona',
  },
  books: {
    name: 'the letter room', sign: 'LONG LETTERS', area: 'candlewick', kind: 'reading room',
    sub: 'Candlewick · deck 16 · Thread Street',
    blurb: "Jory's book room, hung with felt, where long letters from across the Shade are read aloud once to whoever is in the chairs.",
    keeper: 'jory',
  },
  chairs: {
    name: 'Second Sitting', sign: 'SECOND SITTING', area: 'candlewick', kind: 'workshop',
    sub: 'Candlewick · deck 17 · Thread Street',
    blurb: "A chair remaker's full of old chairs being made older and better, because a new one costs fifty dinners.",
    keeper: 'gustav',
  },
  toys: {
    name: 'the toy library', sign: 'TOYS ON LOAN', area: 'candlewick', kind: 'library',
    sub: 'Candlewick · deck 17 · Ladle Row',
    blurb: "Shelves of toys lent free and mended between borrowers, because new mass is dear and children are not.",
    keeper: 'ros',
  },
  teacart: {
    name: 'the tea cart', sign: 'TEA · COFFEE · LIDS', area: 'candlewick', kind: 'cart',
    sub: 'Candlewick · deck 16 · Ladle Row at Thread Street',
    blurb: "A cart on the corner that pours tea from a height, so you can watch the stream land a little anti.",
    keeper: 'ben',
  },
  larder: {
    name: 'the Keeping Room', sign: 'THE KEEPING ROOM', area: 'candlewick', kind: 'shop',
    sub: 'Candlewick · deck 16 · Thread Street',
    blurb: "A larder shop of crocks, ferments and aged cheese. Knotnight all year, and the crocks come back.",
    keeper: 'zhenya',
  },
  herbs: {
    name: 'the herb shop', sign: 'BRING HERBS, NOT GIN', area: 'candlewick', kind: 'shop',
    sub: 'Candlewick · deck 16 · Ladle Row',
    blurb: "Herb pots from every drum on the Row, sold a sprig at a time, which is how a guest says thank you.",
    keeper: 'amadou',
  },
  clinic: {
    name: 'the Candlewick clinic', sign: 'CLINIC', area: 'candlewick', kind: 'clinic',
    sub: 'Candlewick · deck 17 · Ladle Row',
    blurb: "The block's clinic, free from the commons, with nurses who stay and a chair by the door for anyone who only wants to talk.",
    keeper: 'nkem',
  },
  baths: {
    name: 'the Candlewick baths', sign: 'BATHS', area: 'candlewick', kind: 'baths',
    sub: 'Candlewick · deck 16 · Ladle Row, anti end',
    blurb: "The warmest rooms in the block, heated free by the food plant's 65 degree loop. The steam is where the drum's gossip lives.",
    keeper: 'dorota',
  },
  school: {
    name: 'the Candlewick school', sign: 'CANDLEWICK SCHOOL', area: 'candlewick', kind: 'school',
    sub: 'Candlewick · deck 16 · Ladle Row',
    blurb: "The block's school, near full weight on the Low decks, where children learn to read and to throw anti.",
    keeper: 'lucan',
  },
  'spinball-hall': {
    name: 'the long hall', sign: 'SPINBALL', area: 'candlewick', kind: 'sports hall',
    sub: 'Candlewick school · decks 17 and 18',
    blurb: "The school's long hall, two decks tall, where every throw breaks according to its heading.",
    keeper: 'kwame',
  },
  'lobby-a': {
    name: 'the court lift lobby', sign: 'LIFT · STAIRS', area: 'candlewick', kind: 'lobby',
    sub: 'Candlewick · core A · decks 16 to 21',
    blurb: "A lift core's lobbies stacked up one side of Wick Court, with cab berths, a stair and the deck numbers painted large.",
  },
  'lobby-b': {
    name: 'the Thread Street lift lobby', sign: 'LIFT · STAIRS', area: 'candlewick', kind: 'lobby',
    sub: 'Candlewick · core B · decks 16 to 21',
    blurb: "The block's second core, at the far end of Thread Street, and the quickest way up to the Hollow.",
  },
  'flat-guest': {
    name: 'your flat', sign: '19 · 4', area: 'candlewick', kind: 'flat',
    sub: 'Candlewick · deck 19 · terrace flat 4',
    blurb: "A Margin flat lent to you for three nights: two rooms, a lamp, a herb shelf, and a window on Wick Court.",
  },
  'flat-marit': {
    name: "Marit's flat", sign: '18 · 9', area: 'candlewick', kind: 'flat',
    sub: 'Candlewick · deck 18 · off the front terrace',
    blurb: "Her great-grandfather's place: his table, his chairs, and one long wall Jory has already measured for shelves.",
    keeper: 'marit',
  },
  'flat-oona': {
    name: "Oona's flat", sign: '17 · 4', area: 'candlewick', kind: 'flat',
    sub: 'Candlewick · deck 17 · on the terraces',
    blurb: "A terrace flat full of lamp tests and jars of pigment, one of them labelled bruise in Marit's writing.",
    keeper: 'oona',
  },
  'flat-elders': {
    name: "the Quists' place", sign: '20 · 24', area: 'candlewick', kind: 'flat',
    sub: 'Candlewick · deck 20 · on the terraces',
    blurb: "An old couple's place with two rooms let to a young couple waiting for theirs, and a kettle that is always warm.",
    keeper: 'edda',
  },
  'flat-family': {
    name: "the Hallorans' flat", sign: '19 · 5', area: 'candlewick', kind: 'flat',
    sub: 'Candlewick · deck 19 · terrace flat 5',
    blurb: "The flat next to yours: two parents, two children, an aunt most evenings, and shoes on every surface.",
    keeper: 'ines',
  },
  terraces: {
    name: 'the court terraces', sign: '', area: 'candlewick', kind: 'terraces',
    sub: 'Candlewick · decks 17 to 21 · round Wick Court',
    blurb: "Planted terraces ringing Wick Court on every deck, with the only flats in the block that have windows opening onto them.",
  },

  // The Hollow: the floor at half a g.
  'lake-pavilion': {
    name: 'the lake pavilion', sign: 'CANDLEWICK CORE', area: 'hollow', kind: 'pavilion',
    sub: 'The Hollow · Ring Two · among the apples',
    blurb: "A glass lift pavilion among apple trees, where Candlewick's core comes up through the floor and everyone stops to look up.",
  },
  lakeshore: {
    name: 'the lake shore', sign: '', area: 'hollow', kind: 'shore',
    sub: 'The Hollow · Ring Three',
    blurb: "The Hollow's lake, two metres deep, curving up at both ends until the far shore stands on its side.",
  },
  jetty: {
    name: 'the jetty', sign: '', area: 'hollow', kind: 'jetty',
    sub: 'The Hollow · Ring Three · the lake',
    blurb: "A plank jetty where a dive at half a g takes half again as long to fall, so you have time to think about it.",
  },
  'robe-house': {
    name: 'the robe house', sign: 'ROBES · BROTH', area: 'hollow', kind: 'house',
    sub: 'The Hollow · Ring Three · the lake shore',
    blurb: "A long low house that hands every swimmer a warm robe and a lidded cup of broth.",
    keeper: 'ezra',
  },
  orchard: {
    name: 'the orchard rows', sign: '', area: 'hollow', kind: 'orchard',
    sub: 'The Hollow · Rings Two to Four',
    blurb: "Rows of apple trees lit free by the sunline and pollinated by hand. The feast's apples came from here, and every one was counted.",
    keeper: 'dagny',
  },
  lawns: {
    name: 'the lawns', sign: '', area: 'hollow', kind: 'lawn',
    sub: 'The Hollow · Rings Four to Six',
    blurb: "Long lawns at half a g, where people lie on cloths and look up at the people lying on cloths overhead.",
  },
  kitefield: {
    name: 'the kite field', sign: '', area: 'hollow', kind: 'lawn',
    sub: 'The Hollow · Ring Five',
    blurb: "A long lawn where kites are flown by walking, and aimed hopefully at the far bank.",
  },
  green: {
    name: 'the festival green', sign: 'BOOKING DAY', area: 'hollow', kind: 'green',
    sub: 'The Hollow · Ring Six',
    blurb: "A green set out for Booking Day with long tables, a bandstand, and lamps on poles for the evening.",
  },
  bandstand: {
    name: 'the bandstand', sign: '', area: 'hollow', kind: 'bandstand',
    sub: 'The Hollow · Ring Six · the festival green',
    blurb: "An open bandstand where the band waits for its last chord to come back off the far bank.",
    keeper: 'rufus',
  },
  'back-foot': {
    name: 'the foot of the back wall', sign: '', area: 'hollow', kind: 'wall foot',
    sub: 'The Hollow · Ring Nine · the back wall',
    blurb: "Where the floor meets the back end wall in the dimmer light of the Dim End, and thirty tiers of terraces begin to climb toward the axis.",
  },
  'dawn-terrace': {
    name: 'the back terraces', sign: 'THE DAWN STAND', area: 'terraces', kind: 'terrace',
    sub: 'Back wall · the lowest tiers',
    blurb: "The back wall's lowest tiers, facing down the length of the Hollow: the best seats for a painted dawn, and the Dawn Stand's cart.",
    keeper: 'marisol',
  },
  'elders-terrace': {
    name: "the elders' terrace", sign: "ELDERS' TERRACE", area: 'terraces', kind: 'terrace',
    sub: 'Back wall · the fourth tier',
    blurb: "A terrace of benches, rugs and a long rail, kept by custom for the drum's elders, who watch the dawns and the Long Flight from here.",
  },
  'third-terrace': {
    name: 'the Third', sign: 'THE THIRD', area: 'terraces', kind: 'terrace',
    sub: 'Back wall · a third of a g',
    blurb: "The back wall's terrace at a third of a g, where reels are danced and every leap comes down a hand's width spinward.",
  },
  'spindle-lift': {
    name: 'the Spindle lift', sign: 'SPINDLE LIFT', area: 'terraces', kind: 'lift',
    sub: 'Back wall · from the foot to the axis',
    blurb: "A lift that climbs the back wall to the axis, 1.5 kilometres in a little over two minutes, while down goes sideways and then away.",
  },
  'flying-hall': {
    name: 'the back flying hall', sign: 'BACK FLYING HALL', area: 'spindle', kind: 'flying hall',
    sub: 'The Spindle · the back end',
    blurb: "A netted sock of air 300 metres long round the axis, in the soft half-light past the sunline's end, where people learn to fly lengthwise.",
    keeper: 'ayo',
  },
  'sleeve-hire': {
    name: 'the wing-sleeve hire', sign: 'WING-SLEEVES', area: 'spindle', kind: 'hire',
    sub: 'The Spindle · the back gate',
    blurb: "A gate where wing-sleeves are hired by the turn and your shoes are kept as the deposit.",
    keeper: 'bertil',
  },
  spindle: {
    name: 'the open Spindle', sign: '', area: 'spindle', kind: 'axis',
    sub: 'The axis · end to end',
    blurb: "The whole axis, 3.75 kilometres of it, opened in the dark on the night of the Long Flight, with the unlit sunline a cable down the middle.",
  },

  // The rest of Chervil: the kinds of place every block has (the blocks themselves are named in src/city/city.js).
  'city-avenue': {
    name: 'an avenue', sign: '', area: 'city', kind: 'avenue',
    sub: 'Chervil · runs spinward',
    blurb: "A block's avenue. Every one runs spinward, so every one curves up ahead of you and behind you.",
  },
  'city-street': {
    name: 'a street', sign: '', area: 'city', kind: 'street',
    sub: 'Chervil · runs along the axis',
    blurb: "A block's street, running along the axis, where the floor stays level as far as you can see.",
  },
  'city-court': {
    name: 'a block court', sign: '', area: 'city', kind: 'atrium',
    sub: 'Chervil',
    blurb: "The atrium where a block's avenue and street cross, open through its decks under a ceiling the block lights for itself.",
  },
  'city-hall': {
    name: 'a hall', sign: '', area: 'city', kind: 'hall',
    sub: 'Chervil · the long table',
    blurb: "A block's hall: one long table, one cook whose name is on the door, and a seat for any guest who has slept somewhere.",
  },
  'city-shop': {
    name: 'a shop', sign: '', area: 'city', kind: 'shop',
    sub: 'Chervil',
    blurb: "One of a block's shops, kept by somebody who lives within a hundred metres of it.",
  },
  'city-room': {
    name: 'a block room', sign: '', area: 'city', kind: 'room',
    sub: 'Chervil',
    blurb: "One of the rooms a block keeps for itself: a clinic, a choir room, an office, a laundry.",
  },
  'city-lobby': {
    name: 'a lift core', sign: 'CABS', area: 'city', kind: 'lobby',
    sub: 'Chervil · cabs and stairs',
    blurb: "A lift core's lobby. There is one every hundred metres, and a cab from any of them will take you to any other.",
  },
  'city-special': {
    name: 'a block place', sign: '', area: 'city', kind: 'room',
    sub: 'Chervil',
    blurb: "The large room a block is known for: a school, a bath house, a dim wood, a bright square.",
  },

  // The landmarks: places built by hand, once each, somewhere in the drum. The ids are the regions' ids
  // (src/game/regions.js), so a landmark's zones can use them as their place and its talk is found by them.
  // The Keel: decks 1 to 15, a full g. Nobody lives there; everyone eats from it.
  'keel-vats': {
    name: 'the Flour Hall', sign: 'FLOUR HALL', area: 'keel', kind: 'works',
    sub: 'the Keel · deck 9 · Ring Five',
    blurb: "Thermophilic vats running at sixty to seventy degrees, growing the drum's protein flour, dairy, egg and mycelium steak and warming its bath water as they do, with the Pass, the Trimmings, Curd Row and the Kettle off the main floor.",
  },
  'keel-garden': {
    name: "the Garden", sign: 'GARDEN RACKS', area: 'keel', kind: 'works',
    sub: 'the Keel · deck 6 · Ring Four',
    blurb: "One hall of the Garden: six double rows of racks 320 metres long and five decks tall, behind glass and under pink lamps, with a tomato house, tea rows and mushroom rooms off the walk. The drum keeps about a square metre of rack for every person in it, which is why a tomato is half a kay.",
  },
  'keel-heat': {
    name: "the Loop Hall", sign: 'THE LOOP', area: 'keel', kind: 'works',
    sub: 'the Keel · deck 3 · Ring Seven',
    blurb: "Where the vats' waste heat is handed to the 65 degree loop that warms every bath and kitchen tap in Chervil for nothing, between two ranks of plate exchangers the size of houses. The Gin Kitchen and the Salt Pans run off the same heat.",
  },
  'keel-library': {
    name: 'the strain library', sign: 'STRAIN LIBRARY', area: 'keel', kind: 'library',
    sub: 'the Keel · deck 11 · Ring Three',
    blurb: "Every vat culture and registered household starter in the drum, kept frozen in a vial and written down as a genome, so a line lost to a blight can be grown again.",
  },
  // Two more of the nine station rings.
  'ring-five': {
    name: 'Station Ring 5', sign: 'STATION RING 5', area: 'station', kind: 'platform',
    sub: 'the Keel · deck 1 · Ring Five',
    blurb: "The ring at the waist of the drum, four decks deep and nineteen kilometres round, where the tube level takes travellers on to the cyclers and anywhere further.",
  },
  'ring-nine': {
    name: 'Station Ring 9', sign: 'STATION RING 9', area: 'station', kind: 'platform',
    sub: 'the Keel · deck 1 · Ring Nine',
    blurb: "The last ring, nearest the back cap and the heat end: the late station, with a Ledger of its own, a ring counter like every other, and a noodle counter that never shuts.",
  },
  glide: {
    name: 'the Glide', sign: 'THE GLIDE', area: 'station', kind: 'platform',
    sub: 'the rim · the quay · Ring Two',
    blurb: "A boarding hall on the quay, where armoured cars are let go at 174 metres a second to coast for 140 seconds to Sorrel, and the one window in each looks aft between the drums.",
  },
  // The line decks: fifteen of them, two decks deep, one in the middle of each band of twenty-five. Nobody lives on them.
  'line-works': {
    name: "the line works", sign: 'DEPOT', area: 'lines', kind: 'works',
    sub: 'line deck 38 · Ring Two · 0.95 g',
    blurb: "Cab berths, workshops and the freight sorting floor between the tubes of a line deck, where the cabs are mended and the night's parcels are packed by lobby.",
  },
  'line-rides': {
    name: "the Press and the Soufflé", sign: 'LOOP 63', area: 'lines', kind: 'ride',
    sub: 'line deck 63 · Ring Six · 0.92 g',
    blurb: "Two rides on a line deck's loop: the Press goes spinward at 1.2 g and the Soufflé goes anti at 0.3. Loop signs post two limits because the two ways weigh differently, and some people ride for the feeling alone.",
  },
  // In the decks of the city.
  chimney: {
    name: "the Spice Rack and the Spouts", sign: 'CLIMBING HALL', area: 'city', kind: 'sport',
    sub: 'the Low decks · deck 40 · Ring Six',
    blurb: "A climbing shaft cut up through eight decks, where every fall lands a little anti and the mat is laid to match; and beside it the Spouts, three slides that run at different speeds because they head three different ways.",
  },
  'felt-organ': {
    name: "the Bellows", sign: 'ORGAN HALL', area: 'city', kind: 'hall',
    sub: 'the Middle decks · deck 150 · Ring Four',
    blurb: "A stone court five decks tall round an organ whose bottom pipe is 17.4 metres long, because in heliox the old notes need pipes nearly twice the length. Beside it are the Quilt, a concert hall hung three layers deep in felt, and the Sound Larder, where every block's choir is kept.",
  },
  'lot-hall': {
    name: 'the lot hall', sign: 'THE LOT HALL', area: 'city', kind: 'civic',
    sub: 'the Middle decks · deck 200 · Ring Five',
    blurb: "Where the assembly sits: about a thousand residents drawn by lot each year to set the commons, in chairs that belonged to the years before them.",
  },
  'mile-hall': {
    name: 'the Measure', sign: 'THE MEASURE', area: 'city', kind: 'sport',
    sub: 'the Low decks · deck 52 · Ring Seven',
    blurb: "A mile of sprung lanes laid spinward along one deck, with a clock at each end and a record for each way, and beside it the Tin, where spinball is practised against three walls.",
  },
  'up-decks': {
    name: "the Simmer", sign: '', area: 'city', kind: 'arcade',
    sub: 'the High decks · deck 340 · Ring Three · 0.55 g',
    blurb: "The slow-water pool on deck 340, at a little over half a g, where a swell takes thirteen seconds to cross fifty metres. Round it are the elders' tea room, the Up Table where flats on the High decks are given out, and a lane of doors with garden light under them.",
  },
  // The far Hollow.
  'hollow-island': {
    name: "Lid Island and the Cold Rows", sign: '', area: 'hollow', kind: 'island',
    sub: 'the Hollow · the lake',
    blurb: "A small island in the lake, reached by a rope ferry, with a long bench for anyone a hundred or over and a high board over the deepest water. On the shore are the Cold Rows, where apple trees are given six weeks at four degrees under quilted tents.",
  },
  'lid-island': {
    name: 'Lid Island', sign: '', area: 'hollow', kind: 'island',
    sub: 'the Hollow · the lake · by the rope ferry',
    blurb: "The island in Chervil's lake: twelve old apple trees, the Settle, a tea hut called the Kettle, a ring of lanterns open on the lake side, and a high board over the deepest water.",
  },
  'cold-rows': {
    name: 'the Cold Rows', sign: '', area: 'hollow', kind: 'orchard',
    sub: 'the Hollow · the lake shore · winter tents',
    blurb: "Four quilted tents on the lake shore where two rows of apple trees at a time are kept at four degrees for six weeks, and beside them the rows just out of winter, in blossom and being brushed by hand.",
  },
  'hollow-grounds': {
    name: "the Breadboard", sign: '', area: 'hollow', kind: 'grounds',
    sub: 'the Hollow · Ring Six',
    blurb: "The Hollow's playing grounds: a 400 metre track with a heavy bend and a light one, and four pitches for field spinball, where a throw breaks about twice as hard as on the decks.",
  },
  'hollow-front': {
    name: 'the front wood', sign: '', area: 'hollow', kind: 'wood',
    sub: 'the Hollow · Ring One · the Dim End',
    blurb: "Birch woods in the dim end of the Hollow by the front wall, where the sunline's light falls to little more than a third of mid-floor. Through them runs the Long Lamps, the one walk in the Hollow kept lit all through the lamp-night.",
  },
  // The end walls and the axles.
  'front-wall': {
    name: "the front wall", sign: '', area: 'walls', kind: 'terraces',
    sub: 'the front end wall · tier one to the Third, tier ten',
    blurb: "The quieter wall, at the power end of the drum. Chervil watches its dusks from tier one, the Warming Shelf, and marries on tier ten, the front Third, at a third of a g.",
  },
  'back-upper': {
    name: 'the high tiers', sign: '', area: 'walls', kind: 'terraces',
    sub: 'the back end wall · tiers fifteen to twenty-seven',
    blurb: "The upper tiers of the back wall: the Quarter, the Tenth and the Twentieth, tiers fifteen, twenty-four and twenty-seven, 750, 300 and 150 metres from the axis, where a step becomes a small jump.",
  },
  'back-quarter': {
    name: 'the Quarter', sign: '', area: 'walls', kind: 'terraces',
    sub: 'the back end wall · tier fifteen · a quarter of a g',
    blurb: "Tier fifteen of the back wall, 750 metres from the axis: the Tea Steps, a slow fountain, and tea poured from a metre up so that you can watch it land a little anti.",
  },
  'back-tenth': {
    name: 'the Tenth', sign: '', area: 'walls', kind: 'terraces',
    sub: 'the back end wall · tier twenty-four · a tenth of a g',
    blurb: "Tier twenty-four, 300 metres from the axis: the practice floor, where a standing jump goes nearly seven metres and nobody goes higher up the wall until they can stop on the line three times running.",
  },
  'back-twentieth': {
    name: 'the Twentieth', sign: '', area: 'walls', kind: 'terraces',
    sub: 'the back end wall · tier twenty-seven · a twentieth of a g',
    blurb: "Tier twenty-seven, 150 metres from the axis: the top garden, with beds hung one above another to sixteen metres, where a child can jump the height of a house.",
  },
  'axle-back': {
    name: "the back axle", sign: 'BACK AXLE', area: 'axles', kind: 'works',
    sub: 'the axis · the back cap · 0.02 g',
    blurb: "The loudest room in the drum, where all its heat leaves as two-phase ammonia in pipes as wide as rooms. Beyond it, the still side and the Window.",
  },
  'axle-ring': {
    name: 'the slow ring', sign: '', area: 'axles', kind: 'works',
    sub: 'the back axle · once round in 377 metres',
    blurb: "The ring round the back axle where the drum's turning is handed over: cars leave from here for the still side, which does not turn at all.",
  },
  'still-dock': {
    name: 'the still side', sign: '', area: 'axles', kind: 'works',
    sub: 'behind the back cap · twelve car ports',
    blurb: "The dock on the side of the joint that does not turn, where the back crews keep their lockers and the cars from the slow ring come in.",
  },
  'window-lobby': {
    name: "the Window's lobby", sign: '', area: 'axles', kind: 'room',
    sub: 'the still side · slippers and robes',
    blurb: "Where visitors to the Window leave their shoes for grip slippers and read the rules: five rounds a day, children of eight with one adult each, and guests in whatever seats are spare.",
  },
  'window-passage': {
    name: 'the red passage', sign: '', area: 'axles', kind: 'room',
    sub: 'the still side · red light',
    blurb: "A passage in red light behind a curtain, where eyes are given twenty minutes to wake up to the dark before the shutter is raised.",
  },
  'window-gallery': {
    name: 'the Window', sign: '', area: 'axles', kind: 'room',
    sub: 'the still side · behind the radiators',
    blurb: "A gallery behind the radiators, glazed with about a metre and a half of water, where Chervil's children see the stars once, at about eight. What fills the glass is what the back crews call the River.",
  },
  'axle-front': {
    name: "the front axle", sign: 'FRONT AXLE', area: 'axles', kind: 'works',
    sub: 'the axis · the front cap · 0.02 g',
    blurb: "Where all the drum's power comes in through one rotary joint at the front cap, about 160 gigawatts, and you would never know it by ear. The Lap goes once round the axis in 377 metres, at a fiftieth of a g.",
  },
};

Object.defineProperty(PLACES, 'neighbours', {
  enumerable: false,
  value: [
    { name: 'Ropewalk', dir: 'spinward', note: 'decks 16 to 21' },
    { name: 'Pennyfold', dir: 'anti', note: 'decks 16 to 21' },
    { name: 'Lindenhall', dir: 'front', note: 'decks 16 to 21' },
    { name: 'Saffron Yard', dir: 'back', note: 'decks 16 to 22' },
    { name: 'Hassock', dir: 'up', note: 'decks 22 to 27' },
    { name: 'Copperdown', dir: 'up', note: 'decks 22 to 28, spinward' },
    { name: 'Marrowfield', dir: 'spinward', note: 'decks 16 to 21, past Ropewalk' },
    { name: 'Tessera', dir: 'anti', note: 'decks 16 to 20, past Pennyfold' },
  ],
});
