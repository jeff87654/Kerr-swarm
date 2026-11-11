// Words for the market, the workshops and the light studios: what the cards say, what the keepers say, what the
// boards say. Varied by the lot's seed (pickBy) and by band, so two blocks do not say the same thing.
import { Rng } from '../core/util.js';
import { someone, kays } from './lots_market_kit.js';

export const marketWords = true;

// ---------------------------------------------------------------------------------------------------------------
// the market
// ---------------------------------------------------------------------------------------------------------------
export const MARKET_NAMES = [['SECOND MARKET', 'every thing with its card'], ['THE CARD MARKET', 'second-hand · made here · by weight'], ['THE WEIGH HALL', 'sold by what it weighs and what it was'], ['SECONDS AND MAKINGS', 'every card has a blank line']];
// second-hand goes by weight and by age; made-in-the-block goes by weight and an hour's share
export const PER_KG = 2.5, PER_YEARS = 40;
export function priceOf(t) { return t.made ? Math.max(0.2, t.kg * 0.6 + t.share) : t.kg * PER_KG + t.years / PER_YEARS; }

// kind: label (on the prompt), what it has ([name, kg0, kg1, years0, years1] or made: [name, kg0, kg1, share0, share1]), the keeper's notes
export const KINDS = {
  cups: { label: 'cups and lids', things: [['A lidded cup', 0.25, 0.4, 20, 260], ['A hall bowl with its lid, numbered', 0.5, 0.8, 40, 300], ['Six saucers, none matching', 0.9, 1.2, 10, 200], ['A teapot with a cane handle', 0.7, 1.0, 30, 180], ['A lid with no cup', 0.08, 0.12, 30, 220]],
    notes: ['Every cup here has a lid, and every lid has been dropped at least once.', 'People come for one cup and go home with a lid that fits something else.', 'Hall bowls are numbered on the foot. Some of these numbers belong to halls that sit a different table now.', 'Light things are cheap here. It is the old ones that cost.'] },
  crocks: { label: 'crocks', things: [['A starter crock with a chipped lid', 1.2, 2.0, 60, 320], ['A pickling crock', 2.2, 3.4, 40, 260], ['A lid looking for its crock', 0.3, 0.5, 20, 200], ['A butter dish, lidded', 0.4, 0.6, 30, 150]],
    notes: ['A crock is a kilogram of clay. New, that is twenty-five kays before anybody has glazed it.', 'Knotnight empties this stall. Homecoming fills it again.', 'Bring the lid. Half of what I sell is a lid finding its crock.', 'The heavy ones are the bargain: weight is cheap here, age is not.'] },
  chairs: { label: 'chairs', things: [['A ladle-back chair', 4.2, 5.5, 60, 340], ["A child's stool", 1.4, 2.0, 20, 120], ['Three chair legs, turned', 0.9, 1.3, 10, 90], ['A rush seat, rewoven', 0.6, 0.9, 5, 40]],
    notes: ['A new chair is a hundred and twenty-five kays. Nobody here has bought one in living memory.', 'Chairs are dearer the older they get. Sit on that one gently, it is the dearest thing on the stall.', 'Newly-weds come and buy legs. They are remaking a grandmother\'s chair, and the grandmother had six of them.', 'Every chair on the wall has been sat on by four families at least. Their names are on the card.'] },
  cloth: { label: 'cloth and coats', things: [['A coat with a red lining', 1.1, 1.6, 30, 140], ['A tablecloth for a long table, four metres', 1.0, 1.4, 50, 220], ['A naming shawl', 0.3, 0.5, 40, 200], ['A bolt end of hall-blue cloth', 0.6, 1.0, 1, 20], ['Trousers with a hand\'s width in every seam', 0.6, 0.8, 10, 60]],
    notes: ['Read the seams. A coat tells you who had it by its mends.', 'Colour weighs nothing. A coat you do not like is a tenth of a kay from one you do, at the dyer\'s.', 'Children\'s things have a hand\'s width folded into every seam. Let it out and they wear it another year.', 'The linings are where the fashion is. The outsides are mostly grey.'] },
  lamps: { label: 'lamps', things: [['A hand lamp, recharged', 0.4, 0.6, 30, 180], ['A lamp head without its arm', 0.8, 1.2, 40, 200], ['A reading lamp with a green shade', 1.2, 1.6, 50, 160], ['A string of lantern shades', 0.2, 0.4, 5, 60]],
    notes: ['Every hand lamp here has been on the Long Flight. Most of them several times.', 'The lamp is cheap. The light is what costs you, and I do not sell that.', 'I test them all on the wall at the back. A week each, the same as the lampwrights.', 'Old lamp heads go to the light studios. The painters like a reflector that has been dented in the right place.'] },
  books: { label: 'books and papers', things: [['A book of hall recipes, written in', 0.4, 0.7, 60, 300], ['A long letter, bound, read once', 0.1, 0.2, 30, 120], ['A spinball rule book for children', 0.2, 0.3, 20, 90], ['A deck chart of the Low decks', 0.1, 0.2, 40, 150]],
    notes: ['Paper is light. These are cheap until you read who has had them.', 'The margins are the point. Four hundred years of pencil in some of them.', 'Long letters come here when the people they were written to have gone. They are meant to be read once more, by somebody.', 'The recipe books are written in by every cook who had one. Nobody agrees about the salt.'] },
  toys: { label: 'toys', things: [['A spinball, much repaired', 0.3, 0.4, 20, 140], ['A kite, patched twice', 0.2, 0.3, 10, 80], ['A box of wooden blocks', 1.0, 1.5, 60, 250], ['A doll with a mended face', 0.3, 0.5, 40, 200]],
    notes: ['The toy library has first pick. I get what it has two of.', 'A spinball thrown spinward sinks, thrown anti it floats. The children here can tell you which this one does best.', 'The blocks are older than the block. Nobody can say which deck they were cut on.', 'Children bring toys back here when they have grown, and choose who has them next.'] },
  tools: { label: 'tools', things: [['A tenon saw, sharpened', 0.5, 0.7, 60, 240], ['A mallet', 0.6, 0.9, 30, 200], ['A set of chisels, one short', 0.8, 1.1, 50, 260], ['A darning mushroom', 0.1, 0.15, 30, 160]],
    notes: ['The workshops lend tools for nothing. These are for people who want one at home.', 'Every handle has been replaced at least once. The steel is older than the drum\'s Count.', 'A chisel set is never whole. The card says which one went where.', 'Heavy tools are cheap by weight. You are paying for the years.'] },
  shoes: { label: 'shoes', things: [["Children's shoes, resoled", 0.4, 0.6, 5, 40], ['Dancing shoes for half a g', 0.5, 0.7, 20, 90], ['Boots for the line decks', 1.4, 1.8, 30, 70], ['Slippers from the baths', 0.3, 0.4, 5, 30]],
    notes: ['Feet grow faster than shoes wear out. That is the whole of my trade.', 'The dancing shoes are weighted for the High decks. Down here they feel like boots.', 'Bring the old pair and take a pair one size up. The card goes with them.', 'Resoled is resoled. The uppers are older than you, and better.'] },
  jars: { label: 'jars from the block\'s kitchens', made: true, things: [['A jar of radish pickle', 0.5, 0.7, 0.3, 0.6], ['Herb salt in a twist of paper', 0.05, 0.1, 0.2, 0.3], ['A crock of fermented greens', 0.9, 1.2, 0.4, 0.8], ['Lemon peel in syrup', 0.4, 0.5, 0.5, 0.9]],
    notes: ['Made upstairs in the hall kitchen on the loop, out of what the Garden sent down too ugly to sell.', 'The jar goes back when it is empty. That is most of the price.', 'Everything here was made within the block, and the card says by whom.', 'Under a lid, all of it. The lids are older than the recipes.'] },
  plants: { label: 'cuttings and plants', made: true, things: [['A cutting of mint in a pot', 0.4, 0.6, 0.2, 0.4], ['A pot of chives', 0.4, 0.6, 0.2, 0.4], ['A fern, divided from the court\'s', 0.8, 1.2, 0.3, 0.6], ['A tomato seedling, no promises', 0.3, 0.5, 0.4, 0.7]],
    notes: ['Every one of these grew under somebody\'s herb lamp in this block.', 'A plant is only as good as its lamp. I will tell you how many hours each one wants.', 'Bring herbs, not gin. Half of these will go as host gifts before tonight.', 'The tomato seedlings are a kindness. Very few of them become tomatoes.'] },
};
// which kinds a band's market has more of
export const KIND_WEIGHTS = {
  low: [['cups', 3], ['crocks', 2], ['chairs', 2], ['cloth', 3], ['lamps', 1], ['books', 2], ['toys', 4], ['tools', 1], ['shoes', 3], ['jars', 2], ['plants', 2]],
  middle: [['cups', 2], ['crocks', 2], ['chairs', 3], ['cloth', 3], ['lamps', 3], ['books', 3], ['toys', 1], ['tools', 3], ['shoes', 1], ['jars', 2], ['plants', 2]],
};
export const STALL_COLS = [['#8a2f3c', '#f1e2c2'], ['#2f6f73', '#e9dcc0'], ['#33407a', '#e8c26a'], ['#6b7a3a', '#f3e6c8'], ['#a8412b', '#f1e2c2'], ['#5b3a6e', '#e8c26a'], ['#c9962e', '#3a2a20'], ['#1d4a3a', '#e9c46a']];

const FIRST = ['made on this deck before the Count', 'made in the Keel workshops', 'made for a naming', 'brought from Sorrel by a guest who stayed', 'made for a hall that sat four hundred', 'made by a wanderer in Spelt and carried home', 'made in a Margin flat by a family who came here as refuge', 'made on a bench in the workshops round the corner'];
const THEN = ['then given at a wedding', 'then lent round three families on one stair', 'then carried on eleven Long Flights', 'then a year in lost property', 'then taken apart and remade by newly-weds', 'then forty years on a high shelf', 'then out every Knotnight since', 'then left to the block with a list of who should have it next'];
const MEND = ['mended twice, and the mends shown', 'with one new part, turned from an offcut', 'repainted once, not quite the same colour', 'never mended, which the card calls a wonder', 'taken apart and put back by somebody careful', 'mended in the year of the refuge, by a child, badly, and kept that way'];
const LAST = ['Take care of it.', 'It was my aunt\'s. It is yours now.', 'Too good to sit on a shelf.', 'We have two now. Somebody have this one.', 'Moved up to the High decks. Everything is lighter there except this.', 'A wedding present. We were given four.', 'Grew out of it.', 'Mended it myself. You can tell.'];
const HOW = ['in the hall kitchen, on the loop', 'under a herb lamp on the stair', 'in a flat on the terraces', 'in the workshops, after hours', 'by the hall\'s volunteers, nine of them over seventy', 'at the long table on a slow afternoon'];

// The things on one stall: three of its kind, each with a weight, an age or a maker, a price and a card.
export function stallThings(kind, seed, info) {
  const K = KINDS[kind], r = new Rng(seed), out = [];
  const pool = K.things.slice(); for (let i = pool.length - 1; i > 0; i--) { const j = r.i(0, i); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
  for (const t of pool.slice(0, 3)) {
    const kg = Math.round(r.f(t[1], t[2]) * 100) / 100;
    const th = K.made ? { name: t[0], kg, made: true, share: Math.round(r.f(t[3], t[4]) * 100) / 100 } : { name: t[0], kg, years: Math.round(r.f(t[3], t[4])) };
    th.price = Math.round(priceOf(th) * 100) / 100;
    const who = someone(r), deck = r.i(info.d0, info.d1);
    if (K.made) th.card = [th.name + '. ' + kg.toFixed(2) + ' kg. Made in ' + info.name + ', deck ' + deck + ', by ' + who + ', ' + r.pick(HOW) + '.', 'The weight of it, and a share of the hour it took: ' + kays(th.price) + ' kays. The jar or the pot comes back here when you are done with it.'];
    else th.card = [th.name + ', ' + kg.toFixed(2) + ' kg, about ' + th.years + ' years old: ' + r.pick(FIRST) + ', ' + r.pick(THEN) + ', ' + r.pick(MEND) + '.', r.i(3, 9) + ' names on the card. The last is ' + who + ', deck ' + deck + ': "' + r.pick(LAST) + '"', 'Two and a half kays a kilogram and a kay for every forty years: ' + kays(th.price) + '. There is a blank line at the bottom, for you.'];
    out.push(th);
  }
  return out;
}
export const AFTER_BUY = ['The keeper writes your name on the blank line, and "a guest, from Spelt" after it.', 'The keeper reads the card aloud to you once, then hands it over with the thing, tied on with a thread.', 'Your name goes on the last line. The keeper adds the date and the deck, and draws a new blank line under it.', 'The card is tied on with a bit of red thread. "Whoever has it next will want to know," the keeper says.'];

export const WEIGHER = ['Ilse', 'Bartholomew', 'Nkiru', 'Joaquim', 'Sunniva', 'Ade', 'Marguerite', 'Kenji'];
export const WEIGH_LINES = [
  ['A balance, not a spring. A spring reads your weight, and your weight changes with the deck. A balance reads mass, and mass is what is dear.', 'New mass is twenty-five kays a kilogram. Second-hand goes at two and a half, and a kay for every forty years on the card.'],
  ['Everything that comes in is weighed and carded before it goes on a stall. Weight first, then who had it.', 'People argue about the age. Nobody argues with the brass.'],
  ['The weights were cast in the Keel before the Count. They have been checked against the Ledger hall\'s every Booking Day since.', 'They have never been out by more than a grain.'],
  ['If you are bringing something in, it goes on the left pan. If you are taking something out, it goes on the left pan. The right pan is the drum\'s.', 'I write the weight on the card in red. The rest is in whatever the last owner had to hand.'],
];
export function weighBand(info) {
  const pc = Math.round((1 - info.g) * 100);
  return info.band === 'low' ? 'Down here at ' + info.g.toFixed(2) + ' of a g a spring would read ' + pc + ' parts in a hundred light. The brass reads the same here as at the rim.'
    : 'Up here at ' + info.g.toFixed(2) + ' of a g a spring would sell everything ' + pc + ' parts in a hundred light. That is why the weigher keeps brass.';
}
export const BAND_RULE = { low: 'Down here toys and shoes go fastest: children grow out of everything, and the cards on them are mostly in crayon.', middle: 'On the Middle decks tools and chairs go fastest: everybody is making something, or mending what they made.' };
export const WEIGH_SPELT = ['A spoon of starter in a crock. Forty grams of starter and a great deal of crock.', 'Gifts are not weighed here. Put it away before somebody cards it.'];
export const TEA_NAMES = ['the tea stand', 'the urn', 'tea at the door', 'the kettle stall'];
export const TEA = [
  ['A long pour, so it cools on the way down. Lid on. Next.'],
  ['Tea or the coffee. Both under a lid. Your cup goes back on the rack when you are done.'],
  ['The urn is on the loop from lamp-up to lamp-down. It only costs anything when I boil it for the coffee.'],
  ['Stand at the leaners if you are staying. The benches are for the menders\' customers.'],
];
export const TEA_MENU = [{ id: 'tea', name: 'Long-pour tea', desc: 'Poured from a height, so it is cool enough to drink. Under a lid.', price: 0.15 }, { id: 'coffee', name: 'Coffee', desc: 'Cell-culture coffee, boiled to order. Under a lid.', price: 0.15 }, { id: 'bun', name: 'A steamed bun', desc: 'Sweet, from the Mill\'s flour, under a cloth.', price: 0.3 }];
export const MENDER = ['Odile', 'Rasmus', 'Pemba', 'Yolanda', 'Tobiah', 'Chiara'];
export const MEND_LINES = [
  ['Anything bought here can come back to this table. The mend is free the first time, and it shows.', 'We do not hide a mend. You should be able to see where a thing has been looked after.'],
  ['Thread in the colour of the owner\'s hall, if they ask. Gold if they do not.', 'That coat has had nine owners and every one of them is in the seams.'],
  ['A mend is an hour, and an hour is six kays in Chervil. The market pays for the first one. After that it is you or a bowl of something.'],
  ['People bring the card back with the coat, so I can add the mend to it. "Mended at the market, left cuff." It makes the card longer, and the coat dearer.'],
];
export const RULES = { title: 'The market', lines: ['every thing has a card|read it', 'second-hand|2.50 a kg', 'and for every forty years|1.00', 'made in the block|weight and a share', 'mends shown|first mend free', 'bring the jar back|and the lid'] };
export const RULES_LINES = [
  ['Every thing on every stall has a card: what it weighs, how old it is, who had it and what they said. Your name goes on the last line.', 'Second-hand goes by weight at two and a half kays a kilogram, and a kay for every forty years. Things made in the block go by weight and a share of the hour it took.'],
  ['The market\'s rules, painted and repainted: everything is weighed at the desk at the back, everything is carded, and nothing leaves without its card.', 'Older is dearer. Heavier is dearer. Lighter and newer is nearly free.'],
  ['Stalls are lent by the block court for a season at a time. Anybody in the block may bring a thing in; the weigher cards it and a keeper takes it.', 'Mends are shown. The first mend of anything bought here is free.'],
  ['Things that nobody takes in a year go to the workshops, to be taken apart and made into something somebody wants.', 'That is the rule people quote. Most things go in a week.'],
];

// ---------------------------------------------------------------------------------------------------------------
// the workshops
// ---------------------------------------------------------------------------------------------------------------
export const BENCH_NAMES = [['WORKSHOPS', 'benches by the hour'], ['THE LONG BENCH', 'tools lent against your name'], ['BENCHES', 'by the hour · tools on the wall'], ['THE MAKING ROOM', 'a bench, a light, an hour']];
export const KEEPERS = ['Halvard', 'Oluwaseun', 'Brigida', 'Tamsin', 'Emeka', 'Liesl', 'Paavo', 'Ines'];
export const HOUR_PRICE = { day: 0.6, night: 0.3, machine: 1.4 };
export const BENCH_GREET = [
  ['A bench is 0.60 kays an hour, and 0.30 after nine, when the light is cheap. Tools are lent against your name.', 'Pick any bench with nobody\'s name chalked on it.'],
  ['You want a bench. Everybody does on a Thursday. Write your name on the board and I will chalk you a number.', 'The machines are behind the rail, and only with somebody who has signed for them.'],
  ['Guests hire at the block\'s price. We are not a drum that charges strangers more.', '0.60 kays for the hour, the light and the bench. The tools are free and they come back clean.'],
  ['We open at seven and close at eleven, when the lamps go down. The night hour is half price and the kiln is always on then.', 'Pick a bench. Mind the glue.'],
];
export const WORK_DONE = [
  'You spend the hour planing a new lid for a crock whose lid went to the High decks with somebody\'s grandmother. It fits on the third try.',
  'You spend the hour regluing the rungs of a chair from the market. The keeper lends you four clamps and does not watch.',
  'You spend the hour cutting a dovetail in an offcut, badly, then less badly. The person at the next bench says it would hold a pan.',
  'You spend the hour mending the strap of your own bag, in red thread, where everyone can see it.',
  'You spend the hour helping the person at the next bench hold a long board still. They write your name on the underside.',
  'You spend the hour sanding a spoon from the offcut box. It is still a little rough at the neck, which is how you will know it.',
];
export const TOOL_LINES = [
  ['Every tool on the wall hangs on its own painted outline. When one is out, the outline has a name chalked in it.', 'You chalk "Spelt" in the outline of a spokeshave and take it down. Nobody minds.'],
  ['The outlines are repainted every Booking Day. The tools have stayed the same for longer than anyone has been counting.', 'A chisel is out under the name of somebody who borrowed it before you were born. The keeper says it is coming back.'],
  ['The rule is on the wall in old paint: a tool comes back clean, sharp, and before the lamps go down.', 'You take a mallet down, write your name in its outline, and feel trusted.'],
  ['Tools are lent against a name and nothing else. The wall has been short a saw for eleven years, and the outline still has the same name in it.'],
];
export const RACK_LINES = [
  ['Work waiting to be collected: a chair with new rungs, three crocks with lids at last, a coat with a long blue mend.', 'Each one has a tag: whose it is, who did it, and how many hours.'],
  ['A kite with a new spar, tagged for a child on deck {d}. A table leg, turned, tagged "the other three are at home".'],
  ['Things on the rack are kept a month. After that they go to the market with a card that says who made them and who never came.'],
  ['A cradle, sanded, with six names burnt into the underside and space for more.', 'The tag says it was finished on the night price, which the keeper says is when all the cradles get finished.'],
];
export const MACHINE_LINES = [
  ['Behind the rail: a lathe, a press, a bandsaw and the kiln. Signed for, and never alone.', 'The kiln fires crocks overnight, when the kays are cheapest. It is warm to stand near and nobody is allowed to lean on it.'],
  ['The press bends sheet for hinges and brackets. The bandsaw is the loudest thing in the block, and in heliox it sounds higher than you expect.'],
  ['A notice on the rail: "The machines are the block\'s. Their hours are on the board. Their dust is yours: sweep it."'],
  ['The lathe has turned chair legs for the whole block for two hundred years. Its motor is new. Its bed has a hollow worn in it where people lean.'],
];
export const HOURS_LINES = [
  'The hours board: benches one to {n}, names chalked against each hour. Seven to nine, mostly empty. Nine to eleven, the elders. After school, the children\'s bench and the long queue for the lathe.',
  'Tonight\'s night hour has the kiln booked by {a} and the lathe by {b}. Bench four has "the chair" written across three days.',
  'In a corner of the board, in chalk: "{a}, the cradle, every Thursday until it is done." It has been there long enough to fade.',
  'Two prices on the board: 0.60 kays an hour by lamp, 0.30 after nine. Machines 1.40, with a signature.',
];

// ---------------------------------------------------------------------------------------------------------------
// the light studios
// ---------------------------------------------------------------------------------------------------------------
export const STUDIO_NAMES = [['LIGHT STUDIOS', 'pooled light, taken in turns'], ['THE LAMP ROOMS', 'booths by the rota'], ['POOLED LIGHT', 'painters · lamps · the rota'], ['THE DARK ROOM', 'light studios · knock and wait']];
export const ROTA_LINES = [
  ['The rota: every painter in the block has pooled a share of their light into this room, and takes the booths in turn. Two hours a booth, round the clock.', 'Tonight\'s lamp-night is booked solid. Somebody is rehearsing a dusk.'],
  ['Forty names on the rota. The light budget at the top: what the booths can burn today, in kays, and what is left.', 'A note: "If you finish early, leave the lamps warm for the next one."'],
  ['The rota is in three colours of chalk: studies, rehearsals, and "the dawn", which gets everybody\'s spare hours in the last month before a painter\'s morning.'],
  ['A painter\'s name has a star of chalk beside it: their dawn is on the Hollow this season. Everyone else\'s hours move round it.'],
];
export const CRIT_LINES = [
  ['The critique wall: prints of studies, each pinned with a strip of paper for comments. "Too fast in the rose." "The violet is right." "Again."', 'Nobody signs a comment. Everybody knows the handwriting.'],
  ['A study in brown-violet, then rose, then gold, printed in strips. Someone has written under the violet: "Nearly. Ask anyone who has seen the River."'],
  ['Studies of single colours on a white wall, each with the lamps, the gels and the minutes written underneath. A good one is a recipe.'],
  ['The wall has a rule at the top: say what you saw, not what you would do. Under it, in a different hand: say both.'],
];
export const GEL_LINES = [
  ['Gels in long drawers, sorted by colour and then by how many times they have been burnt. Shades on pegs. Spare lamp heads in a crate.', 'A gel weighs nothing. Colour is the cheap part of light.'],
  ['The gels are lent like the workshop\'s tools: a name on a slip in the drawer. The good violets are always out.'],
  ['A drawer labelled "River" has a dozen shades of brown-violet in it, each from a painter who saw the Window at eight and has been trying since.'],
  ['Shades of every colour, from the lampwrights\' seconds: a little wrong for a street, right for a study.'],
];
export const STUDY_ON = [
  'You turn the dial. Three lamps come up on the white wall: a violet pool, a rose one beside it, a narrow gold edge where they meet.',
  'The lamps warm through. The wall goes from white to a soft brown-violet, then a band of rose climbs up it from the floor.',
  'Somebody\'s study comes up exactly as they left it: the gels marked, the arms set, a pencil line on the floor where the stool goes.',
  'The booth fills with colour. For a moment the white wall looks very far away.',
];
export const STUDY_OFF = ['You turn the lamps back down, slowly, the way the rota asks.', 'The booth goes dark again. The white wall keeps a little of the gold for a second.', 'Lamps down. You leave them warm for the next one.'];
export function hoursLine(i, seed, n, info) {
  const r = new Rng(seed + 31);
  return HOURS_LINES[i].replace('{n}', String(n)).replace('{a}', someone(r)).replace('{b}', someone(r)).replace('{d}', String(info.d0 + r.i(0, info.d1 - info.d0)));
}
