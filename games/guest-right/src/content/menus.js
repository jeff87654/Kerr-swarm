// menus.js: what each venue sells or gives. Prices in kWh ("kays").
// Dish prices are cuisine.md / eating-out.md / daily-life.md. Work is priced at
// Chervil's ~6 kWh an hour; new mass at ~25 kWh a kilogram.
// price 0 means free to whoever asks; `worth` (optional) is what the thing costs
// to make, for things that are free from the commons or on the day.
// days: 1 Thursday, 2 the Quiet, 3 Booking Day. hours: [from, to] on the 24-hour clock.
// place: the place id where the menu is offered.

export const MENUS = {
  hall: {
    title: "Marit Vell's Hall", place: 'hall', guestFree: true,
    note: "Lift the lid when it reaches you. On guest-right the table is free.",
    notes: {
      1: "Thursday: ramen at one. You'll be seated next to someone. That's the point.",
      2: "The Quiet: plain food, long talk. The worlds are off, and that is what pays for tomorrow.",
      3: "Booking Day: the Quiet's savings, on the table at one. Free to everyone seated.",
    },
    items: [
      // Every day: the free Mill table.
      { id: 'jook', name: 'Lamp-dawn jook', desc: "Mill jasmine rice in a sweet glycine stock, with chili crisp and sour-starch puffs. From the free table.", price: 0, worth: 0.96, hours: [6.5, 10], tag: 'mill' },
      { id: 'glass-noodles', name: 'Cold glass noodles', desc: "Glass noodles and starch-jelly cubes in chili oil and black vinegar. From the free table.", price: 0, worth: 1.05, hours: [11.5, 15], tag: 'mill' },
      { id: 'the-nine', name: 'A bowl of the Nine', desc: "The nine bitter amino acids as a salted paste, on every table. Have some Nine if you look peaky.", price: 0, worth: 0.17, tag: 'mill' },
      { id: 'mill-lager', name: 'Mill lager', desc: "Pale and cold, on tap at the kitchen end. From the free table.", price: 0, worth: 0.38, hours: [11.5, 23], tag: 'mill' },
      // Thursday.
      { id: 'ramen', name: 'Thursday ramen', desc: "Hand-pulled noodles in a gelatin-rich broth with koji tare, protein-flour chashu glossed with cultivated pork fat, and a jammy egg.", price: 1.77, days: [1], hours: [11.5, 21], tag: 'hot' },
      { id: 'aunts', name: 'Whatever the aunts made', desc: "Each volunteer brings one family dish. Today: Mina's cold sesame tofu, Pilar's folded dumplings and Gideon's black vinegar eggs.", price: 0.5, days: [1], hours: [11.5, 21] },
      // The Quiet.
      { id: 'quiet-jook', name: 'Jook for the Quiet', desc: "The same rice porridge as any morning, served slowly, with a second pot for people who stay.", price: 0, worth: 0.96, days: [2], hours: [6.5, 12], tag: 'mill' },
      { id: 'red-stew', name: 'Red stew and a swallow', desc: "Palm-style stew with fried jelly cubes that drink it up, and a stretchy starch swallow to tear and share.", price: 0, worth: 1.5, days: [2], hours: [11.5, 21], tag: 'mill' },
      { id: 'black-garlic-toast', name: 'Black garlic toast', desc: "Garlic aged five weeks on the 65 degree loop until soft and sweet, on toasted sourdough.", price: 0.55, days: [2], hours: [11.5, 21] },
      { id: 'kuih', name: 'Kuih lapis', desc: "Layered steamed cake, a spice to a layer, cut thin so it lasts a whole conversation.", price: 0, worth: 0.25, days: [2], tag: 'mill' },
      { id: 'amazake', name: 'Warm amazake', desc: "A sweet rice drink brewed overnight at 60 degrees, in a lidded cup.", price: 0.2, days: [2] },
      // Booking Day: the feast, free to everyone at the table.
      { id: 'steak', name: 'Cultivated steak with herb butter', desc: "Two hundred grams, seared on the kitchen's one hotplate and rested under a lid, with butter beaten through with the herb pot's cuttings.", price: 0, worth: 2.91, days: [3], hours: [13, 17], tag: 'feast' },
      { id: 'salad', name: 'A salad, cut generously for once', desc: "Leaves, cucumber and cherry tomatoes in portions nobody counted. Two side salads' worth each.", price: 0, worth: 1.18, days: [3], hours: [13, 17], tag: 'feast' },
      { id: 'aged-cheese', name: 'Aged cheese', desc: "Three slices from the Ring 2 cellars, put down before the last Booking Day.", price: 0, worth: 0.99, days: [3], hours: [13, 17], tag: 'feast' },
      { id: 'sourdough', name: 'The Lovage sourdough', desc: "Open crumb and a crackling crust. Everyone pretends Chervil makes it.", price: 0, worth: 0.28, days: [3], hours: [13, 17], tag: 'feast' },
      { id: 'half-apple', name: 'Half an orchard apple', desc: "One apple for every two people, cut crosswise at the table so everyone sees the star.", price: 0, worth: 2.2, days: [3], hours: [13, 17], tag: 'feast' },
      { id: 'wine', name: 'A glass of wine', desc: "From the cellars, made in the weeks before on kays lent against the Quiet.", price: 0, worth: 0.3, days: [3], hours: [13, 24], tag: 'feast' },
      // Every evening.
      { id: 'gin', name: 'Chervil gin', desc: "Fortified with thiamine, taxed lightly, and sold only in the halls after six, where someone is always cooking.", price: 0.18, hours: [18, 24], tag: 'gin' },
    ],
  },

  counter: {
    title: 'The ring counter', place: 'counter',
    note: "Free, as on every ring on the Row. Drink it here: glide cars don't take hot soup.",
    items: [
      { id: 'broth', name: 'A cup of Mill broth', desc: "Sweet-savoury and hot, with today's sprig laid on top.", price: 0, worth: 0.2 },
      { id: 'rice-ball', name: 'A sticky rice ball', desc: "Waxy Mill rice pressed round a smear of the Nine, still warm.", price: 0, worth: 0.1 },
      { id: 'sprig-1', name: "Today's sprig: coriander", desc: "The hall cut its coriander this morning. Most people on the Row grow theirs in a pot by the window.", price: 0, days: [1] },
      { id: 'sprig-2', name: "Today's sprig: chives", desc: "Chives, cut small, because on the Quiet the hall cuts only what it needs.", price: 0, days: [2] },
      { id: 'sprig-3', name: "Today's sprig: chervil", desc: "The herb the drum is named for, cut on Booking Day morning for every ring counter at once.", price: 0, days: [3] },
    ],
  },

  bakery: {
    title: 'Second Rise', place: 'bakery',
    note: "Baked from four. Lids on the warm things.",
    items: [
      { id: 'lovage-loaf', name: 'The Lovage loaf', desc: "The country loaf from the Crock in Lovage, in by the first glide. We sell it. We don't pretend.", price: 1.1 },
      { id: 'sugar-bun', name: 'Sugar bun', desc: "Soft, sticky and cheaper than a tomato.", price: 0.4 },
      { id: 'croissant', name: 'Croissant', desc: "Laminated with cultured butter. The flakes land a little anti.", price: 0.55 },
      { id: 'cheese-puffs', name: 'Sour-starch cheese puffs', desc: "Fermented starch that puffs in the oven, hollow and chewy. A bag of six.", price: 0.3 },
      { id: 'steamed-cake', name: 'Honeycomb steamed cake', desc: "Yeast-raised, full of holes, under a linen lid while it is warm.", price: 0.3 },
      { id: 'cheese-pull', name: 'Cheese-pull bread', desc: "Stretches a hand's length before it gives.", price: 0.9 },
      { id: 'margin-bun', name: 'The Margin bun', desc: "Stamped with this year's Margin figure. The figure changes every year, so the stamp does too.", price: 0.4, days: [2, 3] },
      { id: 'heels', name: "Yesterday's heels", desc: "Loaf ends for the soup or the larder, free to anyone who asks.", price: 0 },
    ],
  },

  greengrocer: {
    title: 'The Glass Case', place: 'greengrocer',
    note: "Look as long as you like. Point; don't tap the glass.",
    items: [
      { id: 'tomato', name: 'A tomato', desc: "About 120 grams of red, alone on its own cloth in the case.", price: 0.5 },
      { id: 'cherry-tomato', name: 'A cherry tomato', desc: "Warm from the lamp. Eat it whole.", price: 0.1 },
      { id: 'apple', name: 'An orchard apple', desc: "From the Hollow's rows. A gift, and never for one.", price: 4.4 },
      { id: 'herbs', name: 'Herbs from the pot', desc: "Five grams of basil, shiso, coriander or chives, cut while you wait.", price: 0.03 },
      { id: 'salad-leaves', name: "A side salad's worth of leaves", desc: "About 150 grams, wrapped in a damp cloth. Cut it into careful portions.", price: 0.59 },
      { id: 'cucumber', name: 'A cucumber', desc: "Cold and firm. Cut it thick and salt it.", price: 0.45 },
      { id: 'radish', name: 'A radish', desc: "For eating with butter, slowly.", price: 0.3 },
      { id: 'strawberries', name: 'Tansy strawberries', desc: "A small punnet, picked in Tansy this morning and through the Gate on the first glide.", price: 0.9 },
      { id: 'pea-shoots', name: 'A handful of pea shoots', desc: "About forty grams, sweet and green.", price: 0.16 },
    ],
  },

  teacart: {
    title: 'The tea cart', place: 'teacart',
    note: "Ask for a long pour. Bring the cup back to any cart in the block.",
    items: [
      { id: 'tea', name: 'Jasmine tea, poured long', desc: "Poured from a height into a lidded cup. Watch the stream land a little anti.", price: 0.15 },
      { id: 'coffee', name: 'Coffee', desc: "Cell-culture coffee, black or with Vat milk.", price: 0.15 },
      { id: 'milk-tea', name: 'Milk tea', desc: "Black tea with Vat milk and Mill sugar.", price: 0.2 },
      { id: 'amazake', name: 'Warm amazake', desc: "Brewed overnight at 60 degrees, sweet and thick.", price: 0.2 },
      { id: 'puff', name: 'A sour-starch puff', desc: "One, warm, for the walk.", price: 0.05 },
      { id: 'cup', name: 'A lidded cup to go', desc: "Lent, not sold. Return it to any cart in Candlewick.", price: 0, tag: 'loan' },
    ],
  },

  'dawn-stand': {
    title: 'The Dawn Stand', place: 'dawn-terrace',
    note: "Ask whose dawn it is. The painter is often in the queue.",
    items: [
      { id: 'coffee', name: 'Cell-culture coffee', desc: "Hot, black, in a lidded cup to hold while the terraces fill.", price: 0.15, hours: [5, 11] },
      { id: 'cake', name: 'Honeycomb steamed cake', desc: "Yeast-raised and still warm, torn from a tray the size of a door.", price: 0.3, hours: [5, 11] },
      { id: 'milk-tea', name: 'Milk tea', desc: "For people who came for the dawn and not the coffee.", price: 0.2, hours: [5, 11] },
    ],
  },

  larder: {
    title: 'The Keeping Room', place: 'larder',
    note: "Everything here keeps. So do the crocks: they come back.",
    items: [
      { id: 'cheese-slice', name: 'A slice of aged cheese', desc: "Thirty grams of a cheese aged two years in the Ring 2 cellars.", price: 0.33 },
      { id: 'keeping-board', name: 'The keeping board', desc: "Three aged cheeses, cured mycelium ham cut thin as paper, miso-glazed curd and hard rusks.", price: 1.1 },
      { id: 'miso', name: 'White miso, a small jar', desc: "A hundred grams, koji-sweet, in a jar you bring back.", price: 0.55 },
      { id: 'black-garlic', name: 'Black garlic, one head', desc: "Aged five weeks on the 65 degree loop until it is soft and sweet as fruit.", price: 0.2 },
      { id: 'larder-sour', name: "Last year's larder sour", desc: "Lactic and pale, from the block's Knotnight crocks.", price: 0.15 },
      { id: 'berries', name: 'Preserved berries, a small jar', desc: "Berry purée put down at Knotnight. Put down for a long dark that never comes.", price: 0.6 },
      { id: 'rusks', name: 'Hard rusks, a bag', desc: "They keep for a year and taste of it.", price: 0.25 },
      { id: 'nine-tin', name: 'A tin of the Nine', desc: "A day's worth for the back of the shelf, in case.", price: 0.17 },
      { id: 'crock', name: 'A crock, on loan', desc: "Glazed, lidded and older than the shop. It goes back.", price: 0, tag: 'loan' },
    ],
  },

  herbs: {
    title: 'Bring Herbs, Not Gin', place: 'herbs',
    note: "A sprig is three hundredths of a kay. It says more than a bottle.",
    items: [
      { id: 'host-sprig', name: "A host's sprig, tied", desc: "The classic thank-you, tied with green thread and ready to give.", price: 0.03 },
      { id: 'chervil', name: 'Chervil', desc: "The drum's own herb: soft, faintly of aniseed.", price: 0.03 },
      { id: 'lovage', name: 'Lovage', desc: "Strong and celery-ish. Lovage the drum is louder.", price: 0.03 },
      { id: 'sorrel', name: 'Sorrel', desc: "Sharp and lemony, a leaf at a time.", price: 0.03 },
      { id: 'coriander', name: 'Coriander', desc: "Cut this morning. People either ask what it is or ask for more.", price: 0.03 },
      { id: 'shiso', name: 'Shiso', desc: "Purple-green and minty, for wrapping rice.", price: 0.03 },
      { id: 'borage', name: 'Borage', desc: "Cucumber-tasting, with a blue flower if you are lucky.", price: 0.03 },
      { id: 'rue', name: 'Rue', desc: "Very bitter. Bought mostly as a joke, and never eaten twice.", price: 0.03 },
      { id: 'row-sprigs', name: 'The Row in sprigs', desc: "One each of chervil, sorrel, lovage, borage, yarrow and rue, tied in a bundle.", price: 0.18 },
      { id: 'cutting', name: 'A rooted basil cutting', desc: "For the herb shelf in your flat. The pot is lent.", price: 0.06 },
    ],
  },

  dyer: {
    title: 'Fast Colour', place: 'dyer',
    note: "Colour weighs nothing. Any coat, any colour on the wall, by morning.",
    items: [
      { id: 'redye-bruise', name: 'Re-dye a coat: Bruise', desc: "The brown-violet of the River's dusty edges, the colour Oona has painted since she was eight.", price: 0.1, colour: '#5b4060', tag: 'festival' },
      { id: 'redye-rose', name: 'Re-dye a coat: Dawn Rose', desc: "The rose her dawn warms through before the gold.", price: 0.1, colour: '#d4878a', tag: 'festival' },
      { id: 'redye-gold', name: 'Re-dye a coat: Far-Bank Gold', desc: "For the twenty minutes when the far bank is lit and your side is still dark.", price: 0.1, colour: '#d6a640', tag: 'festival' },
      { id: 'redye-indigo', name: 'Re-dye a coat: Flight Indigo', desc: "The Spindle at night with a hand lamp in it.", price: 0.1, colour: '#26306b', tag: 'festival' },
      { id: 'redye-green', name: 'Re-dye a coat: Chervil Green', desc: "The herb the drum is named for. Half the block wears it on Booking Day.", price: 0.1, colour: '#6c9a4c', tag: 'festival' },
      { id: 'redye-copper', name: 'Re-dye a coat: Lid Copper', desc: "The colour of a hall's oldest lids, warm and a little dented.", price: 0.1, colour: '#b5653a', tag: 'festival' },
      { id: 'collar-cuffs', name: 'Collar and cuffs only', desc: "Dye just the collar and cuffs in a contrast. Where fashion lives.", price: 0.05 },
      { id: 'new-lining', name: 'A new lining', desc: "About 200 grams of spun cellulose, 5 kays of new mass, and two hours of cutting and sewing.", price: 17 },
      { id: 'let-out', name: 'Let out a seam', desc: "Every child's seam here has a hand's width folded in. An hour's work.", price: 6 },
      { id: 'weight-hem', name: 'Weight a hem', desc: "For anyone going up to the lighter decks. Half an hour.", price: 3 },
    ],
  },

  mender: {
    title: 'The Shown Seam', place: 'mender',
    note: "Priced in time: an hour is about six kays. The mend will show. That is the point.",
    items: [
      { id: 'patch', name: 'A shown patch', desc: "Ten grams of offcut and half an hour, stitched in a contrasting thread so it shows.", price: 3.25 },
      { id: 'darn', name: 'A darn', desc: "A heel or a cuff, darned in a colour of your choosing. A quarter of an hour.", price: 1.55 },
      { id: 'gold-seam', name: 'A mend picked out in gold', desc: "An hour of slow stitching along an old tear, so the mend is the best part of the coat.", price: 6.05 },
      { id: 'resole', name: 'Resole a pair of shoes', desc: "About 0.2 kilograms of new sole, 5 kays of mass, and an hour of work. New shoes are 20.", price: 11 },
      { id: 'lamp-mend', name: 'Mend a hand lamp', desc: "A quarter of an hour and a switch from the offcut drawer.", price: 1.5 },
      { id: 'sleeve-fin', name: 'Re-stitch a wing-sleeve fin', desc: "Half an hour. You will want it before the Long Flight.", price: 3 },
    ],
  },

  flutes: {
    title: 'The Long Pipe', place: 'flutes',
    note: "Heliox puts every pipe about ten semitones sharp for its length, so ours are long.",
    items: [
      { id: 'lesson', name: 'A lesson, one hour', desc: "An hour with Matti, in the shop's own air.", price: 6 },
      { id: 'tuning', name: 'Tuning', desc: "A quarter of an hour on the tuning bench, for any flute.", price: 1.5 },
      { id: 'remade-flute', name: 'A remade flute', desc: "A flute older than you, with new pads and two hours of work.", price: 12.25 },
      { id: 'beginner-flute', name: "A new beginner's flute", desc: "About 0.4 kilograms of new mass at 25 kays a kilogram, and eight hours of making. Most people start on a remade one.", price: 58 },
      { id: 'listen', name: 'Sit in on a lesson', desc: "The bench at the back. Don't tap your foot; the floor carries it.", price: 0 },
    ],
  },

  chairs: {
    title: 'Second Sitting', place: 'chairs',
    note: "The best chair in a room is the oldest one.",
    items: [
      { id: 'reglue', name: 'Re-glue a loose joint', desc: "An hour, clamped and left overnight.", price: 6 },
      { id: 'new-feet', name: 'New feet', desc: "Turned from offcuts on the lathe in half an hour.", price: 3 },
      { id: 'recover', name: 'Re-cover a seat', desc: "About 0.3 kilograms of cloth in any colour Priya has, and two hours.", price: 19.5 },
      { id: 'remake', name: 'Remake an old chair', desc: "About a kilogram of new webbing and filling and ten hours of work. Still less than a new one.", price: 85 },
      { id: 'new-chair', name: 'A new chair', desc: "Five kilograms of new mass at 25 kays a kilogram. Gustav will try to talk you out of it.", price: 125 },
    ],
  },

  toys: {
    title: 'The toy library', place: 'toys',
    note: "Every loan is free. Every toy is mended between borrowers.",
    items: [
      { id: 'spinball', name: 'A spinball', desc: "Soft, scuffed and true. Axis flies true, spin sinks, anti floats.", price: 0, tag: 'loan' },
      { id: 'kite', name: 'A kite and line', desc: "Mended four times. The patches fly too.", price: 0, tag: 'loan' },
      { id: 'wooden-cab', name: 'A wooden cab', desc: "Tip it and the little cabin stays level. Lent to three generations of one family.", price: 0, tag: 'loan' },
      { id: 'model-drum', name: 'A spinning model drum', desc: "Spin it and drop a bead inside. It lands anti.", price: 0, tag: 'loan' },
      { id: 'long-whistle', name: 'A long whistle', desc: "Pitched for heliox, so it is twice the length you expect.", price: 0, tag: 'loan' },
      { id: 'doll', name: 'A doll in a relined coat', desc: "Her coat has been three colours. Ask her which she liked.", price: 0, tag: 'loan' },
      { id: 'mending', name: 'Bring a toy to be mended', desc: "Ros mends between borrowers, and yours too if she has a minute.", price: 0 },
    ],
  },

  books: {
    title: 'The letter room', place: 'books',
    note: "Copies are free. Paper is not. Letters are read once.",
    items: [
      { id: 'reading', name: 'An evening reading', desc: "A long letter from across the Shade, read aloud once to whoever is in the chairs. Eight o'clock.", price: 0, hours: [20, 22] },
      { id: 'quiet-reading', name: 'The Quiet reading', desc: "No new letters today. Jory reads an old one, very slowly.", price: 0, days: [2], hours: [14, 17] },
      { id: 'copy', name: 'A copy of any book', desc: "Anything ever written in the Shade, copied to you when the worlds are on.", price: 0, days: [1, 3] },
      { id: 'printed-letter', name: 'A letter on paper', desc: "About ten grams of paper, for a letter you want to hold.", price: 0.25 },
      { id: 'card', name: 'A blank card home', desc: "One card from every row, sent by light, postmarked with the delay.", price: 0.05 },
    ],
  },

  baths: {
    title: 'The Candlewick baths', place: 'baths',
    note: "Free. The heat is the food plant's waste; only the pumps cost anything.",
    items: [
      { id: 'bath', name: 'A long hot bath', desc: "As long as you like. It costs the commons about five hundredths of a kay.", price: 0, worth: 0.05 },
      { id: 'robe', name: 'A robe', desc: "Warm from the rail. Heliox chills wet skin fast.", price: 0, tag: 'loan' },
      { id: 'cup-broth', name: 'A lidded cup of broth', desc: "Mill broth from the urn by the door.", price: 0, worth: 0.2 },
      { id: 'cool-pool', name: 'The cool pool', desc: "For the brave, between hot ones.", price: 0 },
    ],
  },

  'sleeve-hire': {
    title: 'Wing-sleeve hire', place: 'sleeve-hire',
    note: "By the turn. Your shoes are the deposit.",
    items: [
      { id: 'turn', name: 'Wing-sleeves, one turn', desc: "An hour in the back flying hall. Your shoes stay on the peg till you are back.", price: 0.05 },
      { id: 'child-turn', name: "Children's sleeves, one turn", desc: "Shorter fins, brighter colours, same hour.", price: 0.05 },
      { id: 'crosswise', name: 'A crosswise lesson', desc: "Half an hour with a warden, learning to aim wide.", price: 3 },
      { id: 'hand-lamp', name: 'A hand lamp for the night', desc: "A watt or two, with a clip for your collar.", price: 0.01 },
      { id: 'flight-night', name: 'Sleeves for the Long Flight', desc: "Free tonight, by block, in shifts till lamp-dawn.", price: 0, days: [3], hours: [21, 24] },
    ],
  },

  'robe-house': {
    title: 'The robe house', place: 'robe-house',
    note: "Every swimmer gets a robe and a cup. Every swimmer.",
    items: [
      { id: 'robe', name: 'A warm robe', desc: "Off the warm rail, smelling faintly of the loop.", price: 0, tag: 'loan' },
      { id: 'broth', name: 'A lidded cup of broth', desc: "Mill broth, too hot to drink for the first minute.", price: 0, worth: 0.2 },
      { id: 'amazake', name: 'Warm amazake', desc: "Sweet and thick, for after a long swim.", price: 0.2 },
      { id: 'dry-cloth', name: 'A drying cloth', desc: "Lent. Leave it in the basket by the door.", price: 0, tag: 'loan' },
    ],
  },
};
