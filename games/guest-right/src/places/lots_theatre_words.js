// Words for the theatre and the reading rooms: plays, cards, columns that came in by light, books with pencil in them.
// Everything a player reads here follows the voice rules: British spelling, no dashes, no exclamation marks.

// Tonight's play: a title, two lines for the playbill and the house, and the painted cloth it wants (see the theatre's cloth()).
export const PLAYS = [
  { t: 'The Wet Field', a: 'A farmer and her son wait three acts for water to fall on their field from the open top of the old world.', b: 'The programme explains what rain was: water that fell on everyone at once, free, and nobody booked it.', cloth: 'rain' },
  { t: 'Snow on the Road', a: 'Two walkers stuck between towns for a night, with one lamp and one coat between them.', b: 'The programme explains snow: rain cold enough to keep its shape, which lay on the ground for days and nobody swept it.', cloth: 'snow' },
  { t: 'The Count Board', a: 'Three sisters in a holdings drum, the year the radiator failed and the births were stopped too long.', b: 'It is Chervil’s own story. The board in the last act is a copy of the one in the Ledger hall, made in this block’s workshops.', cloth: 'count' },
  { t: 'The Long Dark', a: 'A family keeps one lamp lit through the layer era’s long dark, and makes the larder by it.', b: 'Knotnight grew out of plays like this one. This version runs an hour and ten, with no interval.', cloth: 'dark' },
  { t: 'Two Kays of Light', a: 'A comedy. A man saves his light for a bright garden and forgets to keep any friends to sit in it.', b: 'Every child in the block knows the last line. They are asked not to say it along with the cast.', cloth: 'garden' },
  { t: 'The Passing', a: 'Two choirs trade one song across seventeen minutes of light while another raft goes by.', b: 'The second act is the answer, sung by the same choir in different coats.', cloth: 'river' },
  { t: 'What the Sea Did', a: 'A house by a sea in the old world, and a family who moved their chairs every time the water came up the shore.', b: 'The programme explains a tide: a whole sea that came in and went out twice a day, and nobody had asked it to.', cloth: 'sea' },
  { t: 'Letters Eight Years Out', a: 'A correspondence across the Shade, played by two actors who are never on the stage at the same time.', b: 'Sixteen years pass between the first letter and its answer. The interval is ten minutes.', cloth: 'letters' },
];

export const REHEARSAL = [
  'They are running the second act. The director stops them with a raised hand, never a word, and they go back four lines.',
  'Even the argument in the third scene is played at a murmur. In heliox a raised voice cuts, and every hard room in a drum rings.',
  'A flute gives the cue. It is a metre and a fifth long and sounds like a small one.',
  'The drummer keeps time with a felt beater on a frame drum, so softly you feel it in the seat more than you hear it.',
  'Someone in the third row is mouthing every line. The cast have stopped minding.',
  'For the last scene the lamp on the table is the only light on the stage. Up in the gallery the lamp-keeper takes the rest down over a slow count of forty.',
];
export const DAYTIME = [
  'The stage is set for tonight: a table, a lamp, two chairs and the painted cloth. Nobody is on it.',
  'A cleaner works along the rows with a soft brush. Nothing in a felt house is ever beaten.',
  'Rehearsal is at half past seven. Until then the house is anybody’s to sit in, and people do: it is the quietest room in the block.',
  'The felt on the walls is three layers deep. Your own breathing sounds close, as if the room had moved nearer.',
];

export const CLOAK = [
  'The cloak counter gives you a felt tag with a number sewn on it. Your coat goes on the peg with the same number.',
  'Coats are part of the room: a full rail soaks up sound like another curtain. On a full night, the keeper says, the play sounds better.',
  'A box of lost things: a glove, a hand lamp, a child’s spinball, a programme from forty years ago.',
  'Lozenges in a jar, free. A card in front of it says: "For the second act."',
  'The pegs are numbered to three hundred. Number one hundred and twelve has been mended with a brass screw and is nobody’s favourite.',
];

// On the prop table in the wings, each with its card.
export const PROPS = [
  'A cup. Its card: "Act one. Hold it out, look up, look surprised. It is meant to be filling with rain."',
  'An umbrella. Its card: "A roof you carry. Opens with a push. Do not open it backstage: the old world thought that was unlucky, and so do we now."',
  'A wooden apple. Its card: "Do not eat. It opens on a hinge to show the star. Act three."',
  'A letter. Its card: "Real paper. Do not tear. We have three left."',
  'A hand lamp. Its card: "Charged. Off between scenes. Light is not free, even on a stage."',
  'A coat with a mend in yellow thread. Its card: "Grandmother’s coat, act two. The mend is part of the part."',
  'A tin bucket. Its card: "Rain catcher. Empty. Tap it with a pencil for the drip."',
  'A spade with no edge to it. Its card: "For digging. The old world grew its food in the floor."',
];

export const GALLERY = [
  'The lamps on the rail are older than anyone in the block. Each has a card tied to its yoke: its name, its colour, its cue.',
  'Tonight’s lighting is pencilled on a long sheet: forty cues, and a note at cue twelve that says "slower than you think".',
  'A stage lamp draws about half a kay an hour. The lamp fund pays for performances; rehearsals are lit with three lamps, not twelve.',
  'Light is the dearest thing in a drum, so a theatre spends it in one place: on the stage, and nowhere else.',
];

export const PAINT = [
  'A cloth on the frame, half painted. The colours are dyes: colour weighs nothing, so a cloth is painted over for every play.',
  'The painter works from a picture in an old book, squared up in pencil. Under the new paint you can see the last play’s cloth.',
  'Pots of dye on a trolley, every lid labelled. The brushes are as wide as a hand and hung up to dry by their handles.',
  'A note pinned to the frame: "Rain is three greys and one blue. Nobody here has seen it, so nobody can say you are wrong."',
];

export const GREEN = [
  'The green room is green, which is thought to be a joke from the old world. A kettle on the loop, eight cups, a sofa with a mended arm.',
  'A list on the wall of everyone who has played here, in pencil, going back two hundred and forty years. The early names have been gone over in ink.',
  'A mirror ringed with small lamps. Only two of them work, on purpose: light is dear, and the actors know their faces.',
];

// What came in by light: a source, its age, and the column.
export const COLUMNS = [
  { f: 'Sorrel, one glide away', age: 'under a ten-thousandth of a second', t: 'The Lark Clinic caught eleven babies yesterday. Its door is being rehung, and will stick until Thursday.', k: 0 },
  { f: 'Rue, two glides away', age: 'a six-thousandth of a second', t: 'Rue posts its Count: a little nearer par. Its councillors will be at the Ledger on Booking Day, taking notes, as always.', k: 0 },
  { f: 'Tansy', age: 'under a thousandth of a second', t: 'Tansy’s strawberries are in. Three crates are coming over by glide for the feast, all spoken for.', k: 0 },
  { f: 'Lovage', age: 'under a thousandth of a second', t: 'Lovage auctions next year’s dawn hours. The top bid is printed in full, and somebody here has underlined it twice.', k: 0 },
  { f: 'Kittiwake, Gull Row', age: 'about a second', t: 'The flying hall teaches crosswise again after its refit. Guests welcome: bring wing-sleeves or borrow theirs.', k: 1 },
  { f: 'a drum a million kilometres down the row', age: 'three and a third seconds', t: 'A youth orchestra asks for a heliox flute part for a piece written for air. They will retune it ten semitones and send it back.', k: 1 },
  { f: 'Gloaming, Weather Row', age: 'two seconds', t: 'Gloaming’s painted dusk this week is booked out. The painter thanks the terrace and returns the rents, as Gloaming does.', k: 1 },
  { f: 'a cycler, six days out on the slow line', age: 'three seconds', t: 'Wanderers on the slow line send their cards home. Two are this block’s. Their aunts have been told.', k: 1 },
  { f: 'the far edge of Merrow', age: 'forty seconds', t: 'Merrow’s yards report the year’s new drums at the raft’s edge: about four hundred, each named by its first assembly.', k: 2 },
  { f: 'Merrow’s beam office', age: 'thirty seconds', t: 'The beam is flat again, as it nearly always is. The office thanks everyone who asked.', k: 2 },
  { f: 'Selkie, the raft that passed', age: 'twenty-two minutes', t: 'Selkie’s choirs send back the song Herb Row gave them at the Passing, with a new verse. They got the words a little wrong, and kept them.', k: 3 },
  { f: 'a raft four hours away', age: 'four hours and ten minutes', t: 'A recipe for a cheese that needs eleven weeks in a cool cellar. The block’s larder shop has pinned a copy over its counter.', k: 3 },
  { f: 'a raft across the Shade', age: 'seven years and two months', t: 'An answer to a question about vat cheese asked in this block before most of its children were born. The answer is yes, with salt.', k: 4 },
  { f: 'the far side of the Shade', age: 'eight years', t: 'A long letter to the block’s choir from a choir that heard them once, on a relay, nine years ago. It will be read aloud on Thursday.', k: 4 },
  { f: 'the frontier, by the Lantern’s relays', age: 'four hundred and six years', t: 'An outpost’s report of its stars, written before Chervil’s Count. Somebody has pinned a note to it: "still true, probably".', k: 5 },
  { f: 'the frontier, by the Lantern’s relays', age: 'six hundred and thirty years', t: 'A design for a pump, sent the long way. The pump shop’s keeper says it is a good pump, and that they have had a better one for five hundred years.', k: 5 },
];
// the dial colour for each kind of distance: Herb Row, the row, Merrow, passing rafts, the Shade, the frontier
export const DIAL_TINTS = ['#e9dfc4', '#cfe0c4', '#c8dfe0', '#e6d29a', '#e7b9a0', '#cdb8d8'];
export const QUIET_COLUMNS = [
  'Nothing new is pinned up today. It is the Quiet: no worlds and no messages, and whatever comes in by light waits in the vault until tomorrow.',
  'Yesterday’s columns are still on the desks, their dials stopped. People read them again anyway, standing in the same places.',
];
export const COLUMN_HABITS = [
  'Each column has a small dial in its corner for how old it is: a green face for Herb Row, blue for Merrow, amber for a passing raft, rust for the Shade, violet for the frontier.',
  'People read standing, and leave a pencil tick on a column they agree with. The oldest columns have the most ticks.',
  'The columns are taken down at lamp-night and filed in the back room. Nothing that came this far is thrown away.',
  'A keeper pins up the new columns at seven, at noon and at five. There is usually a small crowd at noon.',
];

// Books in the quiet room: a title and what you find in pencil in its margin.
export const BOOKS = [
  { t: 'A Plain Guide to Cooking in Heliox', m: 'In the margin of the page on lids, in pencil: "Tried without. Never again." The date beside it is three hundred and twelve years old. Under it, in another hand, ninety years ago: "Same."' },
  { t: 'The Founders’ Letters, Volume Three', m: 'Somebody has corrected a date in the margin. Four later readers have each signed underneath to agree.' },
  { t: 'Ninety Ways with the Nine', m: 'Recipe forty is crossed out in faint pencil. Beside it: "Not a way." The note is two centuries old.' },
  { t: 'On Mending: Seams and Their Owners', m: 'A scrap of blue thread pressed between two pages, and a note: "This is the blue from my grandmother’s coat. Leave it here." Nobody has moved it.' },
  { t: 'Songs for Heliox Choirs', m: 'The low parts are pencilled down an octave all the way through, in at least six hands.' },
  { t: 'What Rain Was', m: 'A child’s question in the margin, in big letters: "did it hurt". Below, in an adult’s hand: "No. It was cold and you got wet."' },
  { t: 'A Short History of the Count', m: 'The margin beside the chapter on the Margin vote is full of small pencil ticks. Somebody has counted them and written the total at the bottom: 1,206.' },
  { t: 'The Ring Era in Pictures', m: 'A pencil drawing in the margin of an old ring habitat, turning, with an arrow and one word: "home".' },
  { t: 'Weights for Hems, by Deck', m: 'A table of hem weights for every band, with the High decks’ row corrected in pencil by somebody who clearly lived there.' },
];
export const LEND = [
  'The keeper writes "a guest from Spelt" in the loans book, and the date. A guest’s loan is three nights.',
  'The keeper writes your name in the loans book as "the wanderer" and the date. "Bring it back before your glide."',
  'Lent against your name: "a guest, Spelt", in the loans book, in a hand that has written ten thousand names.',
];

export const LETTERS = [
  'The writer at the letter desk takes a long letter down in a clear hand, as fast as you can say it. Most people say it slowly.',
  'A letter across the Shade goes out on the next relay and is read in eight years. "Write it as if they will read it once," the writer says. "They will."',
  'The block pays the writer for any letter that will wait more than a year for its answer. Anything nearer, you write yourself.',
  'In the pigeonholes behind the desk: letters that came in by light and were printed for people who like paper. Some have waited weeks to be collected.',
  'A card on the desk: "No letter is too long. Several have been too short."',
];

export const LAMPS = [
  'You sit under the lamp. It is warm and yellow, and nobody in this room says anything at all.',
  'A pool of lamplight, an armchair with a mended arm, and somebody across the room turning a page as quietly as a page can be turned.',
  'The rule of the back rooms is silence. People nod to each other here and save the rest for the hall.',
  'A small brass plate on the lamp’s foot: "Given by the Hale table, for reading, not for sleeping." Several people are asleep.',
];
