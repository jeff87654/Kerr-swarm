// city.js: the word lists the city generator draws on to name and furnish the blocks nobody built by hand.
// None of the generated blocks is canon. Names are worn from every language and repeat across the drum, as place names do.
// src/city/city.js reads these; add to any list freely (keep the shapes).

// Block names: FIRST + LAST, or one of WHOLE. In the idiom of Candlewick, Ropewalk, Pennyfold, Lindenhall, Saffron Yard.
export const BLOCK_FIRST = [
  'Amber', 'Anise', 'Ash', 'Barley', 'Bell', 'Birch', 'Bobbin', 'Brass', 'Bread', 'Button', 'Candle', 'Carder', 'Chalk', 'Cinder', 'Clove', 'Cobble',
  'Copper', 'Cotton', 'Cress', 'Crock', 'Damson', 'Dill', 'Elder', 'Ember', 'Fallow', 'Fennel', 'Flax', 'Fuller', 'Garnet', 'Ginger', 'Glass', 'Hazel',
  'Hemp', 'Honey', 'Indigo', 'Juniper', 'Kettle', 'Lantern', 'Larch', 'Linden', 'Linen', 'Loom', 'Madder', 'Mallow', 'Marrow', 'Mill', 'Mint', 'Needle',
  'Nettle', 'Oat', 'Ochre', 'Osier', 'Pear', 'Penny', 'Pepper', 'Plum', 'Poppy', 'Quince', 'Reed', 'Rope', 'Rush', 'Russet', 'Saffron', 'Salt',
  'Sedge', 'Sesame', 'Shuttle', 'Slate', 'Sorrel', 'Spindle', 'Spoon', 'Tallow', 'Tansy', 'Teasel', 'Thimble', 'Thistle', 'Tin', 'Umber', 'Vetch', 'Walnut',
  'Wicker', 'Willow', 'Woad', 'Yarrow',
];
export const BLOCK_LAST = [
  'wick', 'walk', 'fold', 'hall', 'yard', 'down', 'field', 'gate', 'stead', 'court', 'mere', 'wood', 'ford', 'bridge', 'side', 'end',
  'holm', 'croft', 'garth', 'well', 'row', 'cross', 'bank', 'combe', 'ley', 'stow', 'hythe', 'ings', 'march', 'rise',
];
export const BLOCK_WHOLE = [
  'Hassock', 'Tessera', 'Larchmere', 'Netherby', 'the Saltings', 'Quoin', 'Selvedge', 'Tenter', 'Heddle', 'Trivet', 'Skein', 'Bodkin', 'Gusset', 'Treadle',
  'Ladlewell', 'Cruet', 'Trencher', 'Posset', 'Firkin', 'Kiln Yard', 'Long Acre', 'Halfweight', 'Underlamp', 'Evenfall', 'Lampside', 'Overbrook',
  'Stillwater', 'Farbank', 'Dimwood', 'Spinward Green', 'Anti Green', 'Axis Gate', 'Felt End', 'Lid Lane End', 'Sprig Common', 'the Tables',
];
// Avenues run spinward; streets run along the axis.
export const AVENUE_LAST = ['Row', 'Walk', 'Arcade', 'Way', 'Parade', 'Reach'];
export const STREET_LAST = ['Street', 'Lane', 'Passage', 'Gate', 'Cut', 'Entry'];
export const STREET_FIRST = [
  'Ladle', 'Thread', 'Lid', 'Crock', 'Felt', 'Flute', 'Sprig', 'Kettle', 'Bobbin', 'Lamp', 'Loaf', 'Spoon', 'Hem', 'Cuff', 'Pear', 'Apple',
  'Broth', 'Noodle', 'Vinegar', 'Ginger', 'Sesame', 'Mustard', 'Chive', 'Parsley', 'Basil', 'Thyme', 'Collar', 'Button', 'Needle', 'Shuttle', 'Treadle', 'Bell',
  'Choir', 'Reel', 'Kite', 'Sleeve', 'Lantern', 'Ledger', 'Margin', 'Table', 'Bench', 'Stair', 'Tide', 'Loop', 'Dawn', 'Dusk', 'Quiet', 'Long',
];
// Family names for door plates and letter flaps.
export const FAMILY = [
  'Abara', 'Achterberg', 'Adeyemi', 'Amari', 'Asante', 'Bakshi', 'Benedek', 'Brandt', 'Castellane', 'Danso', 'Duarte', 'Erdem', 'Fane', 'Farrow', 'Ferro', 'Haddad',
  'Halloran', 'Holt', 'Ilunga', 'Ishikawa', 'Kaur', 'Kell', 'Kowal', 'Kurt', 'Lindgren', 'Lindqvist', 'Lomu', 'Lund', 'Mbaye', 'Mendel', 'Mensah', 'Moreau',
  'Mwangi', 'Nakamura', 'Nakashima', 'Novak', 'Nwosu', 'Oduya', 'Okafor', 'Okonjo', 'Okoro', 'Osei', 'Oyelaran', 'Petrova', 'Quiroga', 'Quist', 'Rasmussen', 'Rautio',
  'Reyes', 'Ruiz', 'Sato', 'Silva', 'Sorensen', 'Tagaloa', 'Tamm', 'Teller', 'Tran', 'Varga', 'Vos', 'Achebe', 'Bergstrom', 'Chaudhry', 'Dimitrov', 'Eze',
  'Fonseca', 'Goh', 'Hakimi', 'Ivanova', 'Jalali', 'Kimura', 'Larsen', 'Mahlaba', 'Nyberg', 'Otieno', 'Pavlou', 'Qureshi', 'Rahimi', 'Suzuki', 'Tavares', 'Ueda',
  'Vargas', 'Wolde', 'Yilmaz', 'Zielinski',
];
// Trades for the small shops. kind picks the stock the default shop draws; subs are lines for the fascia.
export const TRADES = [
  { id: 'baker', kind: 'food', names: ['Second Proof', 'The Warm Shelf', 'Heel and Crumb', 'Under Linen', 'The Night Loaf'], sub: 'bread under lids · buns · heels free' },
  { id: 'greens', kind: 'food', names: ['The Lit Case', 'One Tomato', 'Leaf by Leaf', 'The Glass Counter'], sub: 'lamp-grown · by the gram' },
  { id: 'larder', kind: 'food', names: ['The Long Dark', 'Crock and Rind', 'Keeps', 'The Back Shelf'], sub: 'ferments · cheese · things that keep' },
  { id: 'herbs', kind: 'food', names: ['A Sprig Each', 'The Lamp Shelf', 'Green Thread', 'Pot and Cutting'], sub: 'sprigs tied for a host' },
  { id: 'noodles', kind: 'food', names: ['Pulled Today', 'The Long Strand', 'Forty Turns', 'Broth First'], sub: 'pulled this morning · under a lid' },
  { id: 'tea', kind: 'food', names: ['The Long Pour', 'Two Leaves', 'Lidded Cups', 'Steep'], sub: 'tea · cell-culture coffee · lids' },
  { id: 'mender', kind: 'craft', names: ['Shown', 'The Bright Stitch', 'Seam and Story', 'Gold Thread'], sub: 'mending that shows' },
  { id: 'tailor', kind: 'craft', names: ['Let Out', 'Collar and Cuff', 'The Folded Seam', 'Hem Weights'], sub: 'linings · letting out · hems weighted' },
  { id: 'dyer', kind: 'craft', names: ['Colour Weighs Nothing', 'The Warm Vat', 'Six Colours', 'Fast and Bright'], sub: 're-dyeing · a tenth of a kay' },
  { id: 'chairs', kind: 'craft', names: ['Sat In', 'Older and Better', 'The Glue Pot', 'Four Legs Again'], sub: 'chairs remade · dearer by the year' },
  { id: 'lamps', kind: 'craft', names: ['A Week on the Wall', 'Warm then White', 'The Test Wall', 'Hand Lamps'], sub: 'lamps · hand lamps · every one run a week' },
  { id: 'flutes', kind: 'craft', names: ['One Metre Twenty', 'The Long Note', 'Tuned Here', 'Measured First'], sub: 'heliox flutes · tuned in this air' },
  { id: 'felt', kind: 'craft', names: ['Hung Quiet', 'Three Layers', 'The Baffle', 'Soft Walls'], sub: 'felt hung · rooms that do not ring' },
  { id: 'books', kind: 'craft', names: ['Read Once', 'The Paper Room', 'Pencil in the Margin', 'Long Letters'], sub: 'paper books lent · letters read aloud' },
  { id: 'toys', kind: 'craft', names: ['Back Scuffed', 'Lent and Mended', 'The Top Shelf', 'Nine Hundred Toys'], sub: 'toys on loan · mended between borrowers' },
  { id: 'second', kind: 'craft', names: ['Its History on a Card', 'The Turnover', 'Had Before', 'Third Owner'], sub: 'second-hand · every thing with its card' },
  { id: 'sleeves', kind: 'craft', names: ['Wrist to Hip', 'Fins Remade', 'The Sleeve Room', 'Lengthwise'], sub: 'wing-sleeves remade · hired by the turn' },
  { id: 'kites', kind: 'craft', names: ['Flown by Walking', 'Tail and Line', 'Patches Fly Too'], sub: 'kites · line · patches' },
  { id: 'crocks', kind: 'craft', names: ['Reglazed', 'Lid and Crock', 'The Kiln Shelf', 'Clay Is Dear'], sub: 'crocks lent · lids matched' },
  { id: 'laundry', kind: 'service', names: ['The Night Price', 'Round Doors', 'Folded by Morning'], sub: 'washed at the night price' },
];
// What a block's hall cooks, by the day of the week the block cooks it. One a block.
export const HALL_DISHES = [
  ['Thursday ramen', 'Hand-pulled noodles under a lid, the broth held on the loop since Tuesday.'],
  ['red stew', 'Vat protein and tomato paste, held four hours below a simmer. Tastes of more tomato than is in it.'],
  ['jook', 'Rice porridge from the Mill, with black vinegar and whatever the aunts pickled.'],
  ['flat noodles and black garlic', 'Cut wide, tossed hot, lidded before they reach the table.'],
  ['dumplings in ginger broth', 'Forty to a tray, folded by whoever sat down first.'],
  ['mycelium steak and mustard greens', 'Seared for exactly as long as the power is worth.'],
  ['the long pie', 'One pie the length of a stretch of table, cut where you sit.'],
  ['night stew', 'What the day left, held warm for the people who work the lamp-night.'],
  ['sesame flatbread and sour cream', 'Bread off the plate, cream from the Dairy lines, lids on both.'],
  ['egg custard over rice', 'Vat egg set on the 65 degree loop. Nothing in it has ever boiled.'],
  ['cold noodles in vinegar', 'For decks that run warm. Eaten fast, lids off, which the aunts permit once a week.'],
  ['barley-style broth with greens', 'Mill starch cut like grain, a ladle of greens, and the Nine on the side.'],
];
// Something each block is quietly proud of: one line on its lobby board.
export const BLOCK_PRIDE = [
  'Its choir has sung the Long Flight home eleven years running.',
  'Nobody here has eaten alone since the Count, or will admit to it.',
  'Its court has never sat longer than nine minutes.',
  'It keeps the oldest bench on the avenue, and argues about which bench that is.',
  'Its hall has four hundred and six lids for four hundred seats, in case.',
  'It gave three of its Hollow turns away last year, and mentions it.',
  'Every door on the street has a pot by it. The block court ruled on pots in the year of the refuge.',
  'Its children hold the long hall record for an anti throw.',
  'It lends its ladder to four other blocks and has never once had it back on time.',
  'It re-dyes for the festival a week early, so the vats are free for everyone else.',
  'Its felt came down for washing longer ago than anyone admits, and the street rang for a month.',
  'It has asked the assembly for a brighter court every year since the Margin. The answer is always a kind no.',
  'Its stair has a runner worn to the weave in the middle of every tread.',
  'It keeps a table for wanderers by the pass, and is hurt when nobody sits there.',
  'It was the last block on the layer to take its Count board down, and the first to laugh about it.',
  'It names its lift cabs. The cabs are not consulted.',
];
// Short notices for a block's boards. {block} and {avenue} are filled in.
export const NOTICES = [
  ['Lent', 'The long ladder, to {block} next door.', 'Back before the Flight, please.'],
  ['Wanted', 'Someone who can reglaze a crock.', 'We have the crock, and soup.'],
  ['Found', 'One hall lid, numbered and dented.', 'Ask at the pass.'],
  ['Felt rehang', 'The {avenue} baffles come down for washing.', 'Expect a loud week.'],
  ['Choir', 'Tuesdays and Thursdays, in the court.', 'Bring a cup. Nobody is too flat.'],
  ['Room to let', 'One room, by the hour or the week.', 'Mostly for hours rather than kays.'],
  ['Spinball', 'Long hall, half past three.', 'Anti throwers wanted. Everybody is one.'],
  ['The block court', 'Sits in the court, once a week.', 'Out loud, and in minutes.'],
  ['Swap', 'Our Hollow turn on the ninth for yours.', 'With the lake, if you can.'],
  ['Mending', 'Left at the counter, called for never.', 'One coat, grey. It has stories.'],
  ['Lamp-night', 'The sweeper comes at one.', 'Leave the mats in.'],
  ['Guests', 'A seat at the hall is yours by right.', 'Have you eaten.'],
];
// Given names for the people the generator needs a name for (a hall's cook, a shop's keeper).
export const GIVEN = [
  'Ada', 'Alma', 'Anselm', 'Aroha', 'Bao', 'Bettina', 'Caspar', 'Chidi', 'Dagmar', 'Davit', 'Eamon', 'Efua', 'Elke', 'Farid', 'Freya', 'Gao',
  'Greta', 'Hamza', 'Hedda', 'Ilse', 'Imre', 'Ines', 'Jarrah', 'Jun', 'Kalinda', 'Kenji', 'Lars', 'Leilani', 'Liesl', 'Mahina', 'Malak', 'Mirek',
  'Nadia', 'Nils', 'Noor', 'Odile', 'Oren', 'Oskar', 'Paavo', 'Petra', 'Quilla', 'Rahim', 'Rangi', 'Renata', 'Saoirse', 'Seren', 'Sigrun', 'Soraya',
  'Tamsin', 'Tariq', 'Thandi', 'Toma', 'Ugo', 'Ulla', 'Valko', 'Vesna', 'Wairimu', 'Xochi', 'Yara', 'Yeva', 'Yusuf', 'Zofia', 'Zubair', 'Marta',
];
