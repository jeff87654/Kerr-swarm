// The words of a block's hall: the cook at the pass, the neighbour at the table, and what there is to read.
// Every set has four or more versions, picked by the lot's seed, so two blocks' cooks never say the same thing.
// {dish} {line} {cook} {hall} {block} {name} {g} {drum} fill in from the block.

// The question every Chervil cook asks first, in that order.
export const ASK = [
  'Where have you slept? And have you eaten?',
  'Where did you sleep last night? Have you eaten today?',
  'Sleep first: where was it? Then food: have you had any?',
  'Which flat did the draw give you? And when did you last eat?',
  'Where are you sleeping, and how long since you ate?',
];
// The dish, said at the pass.
export const DISH = [
  'Then sit. Today it is {dish}. {line}',
  'Then you are in time. It is {dish} today. {line}',
  'Good. {dish} today. {line}',
  'That is settled, then. Today is {dish}. {line}',
  'Then you want {dish}. {line}',
];
// What the cook adds about the day's dish (by the dish's name, two each).
export const DISH_MORE = {
  'Thursday ramen': ['The broth went on Tuesday. Eat the noodles before they drink it.', 'Pulled this morning by two aunts and a boy who wants to learn. You can tell which are his.'],
  'red stew': ['There is more tomato in the smell than in the pot. Nobody has complained in nine years.', 'Two tomatoes went into it, at half a kay each. The block voted on them.'],
  'jook': ['Mill rice, all night on the loop. The pickles are this week’s; the vinegar is older than me.', 'Jook is free at the Mill table too. Ours has the aunts’ pickles, which is the difference.'],
  'flat noodles and black garlic': ['The garlic is from a crock started at Knotnight. It has been black since about the Flight.', 'Cut wide so they hold the heat. In this air a thin noodle is cold before it reaches you.'],
  'dumplings in ginger broth': ['Fold one before you go, if you like. Everybody who sits down first folds.', 'Forty to a tray, and the trays are counted. Lids on until they reach you.'],
  'mycelium steak and mustard greens': ['Seared on the one hot plate. Everything else held on the loop, which costs nothing.', 'Searing is the dear part. One side only, and nobody asks for well done twice.'],
  'the long pie': ['Cut where you sit. Do not slide your piece along: it goes where the drum wants.', 'One pie the length of a stretch of table. The crust is Mill fat and patience.'],
  'night stew': ['It is what the day left, held warm for the lamp-night crews. You are early for it.', 'The night crews eat it at two. It is better at two. Do not tell them.'],
  'sesame flatbread and sour cream': ['The cream is from the Dairy lines on Ring Five. The bread is ours, off the plate.', 'Tear it. A knife on flatbread is a Lovage habit.'],
  'egg custard over rice': ['Vat egg, set on the loop at sixty-five. Nothing in it has ever boiled.', 'It sets in the time it takes to lay the table. That is the whole recipe.'],
  'cold noodles in vinegar': ['Lids off, once a week. The aunts allow it because the deck runs warm.', 'Eat them fast. Cold food is the one dish the air cannot spoil.'],
  'barley-style broth with greens': ['Mill starch cut like grain. Real grain is for weddings, and this is a Tuesday.', 'Greens from the court’s terraces, cut this morning. Have some Nine with it.'],
};
// For a dish not listed above: remarks by what is in it (the first pattern that matches the dish's name).
export const DISH_KEYED = [
  [/noodle|ramen/, ['Pulled this morning. In this air a thin noodle is cold before it reaches you, so ours are thick.', 'Eat the noodles first. They drink the broth if you let them.']],
  [/pie|bake/, ['Cut where you sit. Do not slide your piece along the table: it goes where the drum wants.', 'The crust is Mill fat and patience. The patience is the dear part.']],
  [/custard|omelette|egg/, ['Vat egg, set on the loop at sixty-five. Nothing in it has ever boiled.', 'It sets in the time it takes to lay the table. That is the whole recipe.']],
  [/cheese/, ['The cheese is the Dairy’s, aged in our own crocks. Ask the aunts how long and they will tell you, at length.', 'Browned for the last three minutes, when the power is cheapest. I watch the clock for it.']],
  [/rice|porridge|jook/, ['The rice is the Mill’s and free. Everything on top of it, somebody here grew or made.', 'Rice from the Mill, a pickle from the aunts. Have some Nine with it.']],
  [/mycelium|skewer/, ['Seared on the one hot plate. Everything else held on the loop, which costs nothing.', 'Searing is the dear part. One side, then straight under a lid.']],
  [/pancake|flatbread|bread/, ['Tear it. A knife on bread is a Lovage habit.', 'Off the plate and under a lid in one movement. Bread goes stale in this air faster than you would think.']],
  [/curry|red oil|soup|broth|miso|stew/, ['The pot went on at six. The Nine is on the table if it wants more salt.', 'Held on the loop all morning, so it has cost the block nothing but time.']],
  [/strawberr|tomato|cucumber|salad/, ['The fruit is counted. The block court voted on it, which took less time than the counting.', 'Lamp-grown, which is why there is not much of it. Take your share and no more.']],
];
export const DISH_MORE_ANY = ['It has been on since six. Lift the lid when it reaches you.', 'Held on the loop all morning, so it has cost the block nothing but time.', 'Lids on until it reaches you. That is the only rule I keep.', 'If it is not hot, tell me, and I will tell the loop.'];
// The rule, plainly.
export const RULE = [
  'A guest has a seat at any hall. That is the whole of the rule.',
  'Guest-right: three nights in a Margin flat and a seat at any table. You owe me nothing.',
  'Nobody pays for a guest. The block counts you in with the lids.',
  'Eat. If you want to give something back, carry the lids in after.',
  'The Margin feeds you, which means all of us do, a little. Nobody minds.',
];
// Where the cook puts you.
export const SEAT = [
  'Sit there, by {name}. {name} keeps the end nearest the pass and will tell you what you are eating.',
  'There is a place by {name}. You will be seated next to someone. That is the point.',
  'Next to {name}, there. Elbows in, it is a long table.',
  'By {name}, nearest the pass, where I can see whether you finish it.',
  'Go and sit by {name}. {name} has been waiting all week for somebody new.',
];
export const AGAIN = [
  'Back again. Same place, if it is free.',
  'You again. Good. The lid is already on.',
  'Twice in one block. The aunts will want your name.',
  'Back. Sit down before the queue sees you.',
];
// Neighbours: names for the people the cook seats you beside (they have no bodies; the hall is full of strangers).
export const NEIGHBOURS = ['Ilse', 'Tomas', 'Abeni', 'Rafe', 'Noor', 'Sunniva', 'Kofi', 'Mireille', 'Hal', 'Yusra', 'Piet', 'Odile', 'Bram', 'Lenka', 'Tavi', 'Ines', 'Oskar', 'Wen', 'Dagny', 'Esi'];
// What the neighbour says, once you have sat down and lifted the lid. By band; {dish}, {g}.
export const NEIGHBOUR = {
  low: [
    'Spelt, is it. My youngest wants to know if your drum has halls. I said bakeries. That was not the right answer.',
    'Lift it, then, before the air gets at it. In heliox it is cold in four minutes and the cook watches.',
    'You are on the children’s side of the table. They will ask you about the glide. Say it was frightening; they like that.',
    'Do not let them give you the end bowl, the end bowl is for the cook. Here, swap.',
    'The cook asks everyone where they slept. Mine was a bench in the court, once. Nobody minded that either.',
  ],
  middle: [
    'You will be seated next to someone, they say. I am the someone today. Pass me the jug.',
    'Lift it, then. In this air it is cold in four minutes, and the cook watches the lids.',
    'A wanderer. Mine came home last year with a crock of something from Dulse that nobody will eat.',
    'Eleven legs. You will be tired of being asked. I will ask about the food instead. Tell me it is better than ours.',
    'Have some Nine with that. You look like somebody who has been on a glide this week.',
  ],
  high: [
    'Mind the lid, it is cast. At {g} of a g a light one rides up off the bowl when someone laughs.',
    'You lope like a Low-decker. Sit slowly: the bench is further down than it feels up here.',
    'I cooked in a hall for forty years. I only come to see the young one get the salt wrong.',
    'Pour toward the axis and it bends spinward. Pour the other way and you will be wiping the table. There, like that.',
    'A wanderer. I did mine eighty years ago. The glide is the same. The lids were worse.',
  ],
};
export const LID_TOAST = ['The lid comes up. Steam, then the smell, then the cold air at it straight away.', 'You lift the lid. The steam goes straight up and thins out, the way it does in this air.', 'Lid up. {Dish}, and the heat coming off it in a hurry.', 'You lift the lid and somebody along the table nods, as if you have passed something.'];

// Something to read at the chalkboard (the board itself says less).
export const CHALK_MORE = ['Under it, smaller: guests eat free, and lids come back to the pass.', 'Under it, in a different chalk: the Nine is on the table, help yourself.', 'Underneath somebody has drawn a lid with steam coming off it, and a child has added a face.', 'At the bottom: gin after six, in the halls only, and only with something under a lid.'];

// The guests' shelf: what travellers bring a host.
export const GUESTS = [
  ['Jars with cloth caps and paper tags: black garlic from Rue, a twist of dried peel from Lovage, a spoon of starter from Spelt in somebody else’s hand.', 'Along the front, sprigs in jars of water, one from every guest this week. Bring herbs, not gin.'],
  ['A shelf of crocks with the drums they came from inked on the tags: Tansy, Sorrel, Squall, Dulse, one from Kittiwake in a script you cannot read.', 'The rule is painted along the shelf’s edge: bring herbs, not gin. Somebody has added: or a recipe.'],
  ['Sprigs in water, crocks with cloth caps, a paper twist of seeds labelled not for eating, for planting.', 'The cook takes what is brought and puts it on the shelf where the guest can see it used.'],
  ['Every tag says what it is and who left it. One just says: from a wanderer, for the soup. It is nearly empty.', 'Herbs go into the day’s pot; crocks stay until the next guest opens one. Nothing here is thrown away.'],
];
// The cook's corner: a stool, a cup, a card from their wander year.
export const DRUMS = ['Sorrel', 'Lovage', 'Rue', 'Tansy', 'Kittiwake', 'Squall', 'Gloaming', 'Dulse', 'Carillon', 'Sloe', 'Madder', 'Spelt'];
export const CORNER = [
  ['A high stool, a lidded cup gone cold, an apron on a peg with {cook} sewn into the neck in blue thread.', 'A card is pinned over the stool: the hall at {drum}, from {first}’s wander year, postmarked with the delay like all of them.'],
  ['The cook’s corner: a stool worn pale where the boots go, a notebook of the lid count, a cup with a chip mended in gold glaze.', 'Over it, a card from {drum}, years old. On the back, in {first}’s hand: Their soup is better. Find out why.'],
  ['A stool, a shelf, a cup, and a list of who is volunteering tomorrow, most of them over seventy.', 'A card from {drum} is pinned beside the list: a long table there, and a note that says they serve the oldest first.'],
  ['The stool has a cushion sewn by somebody who sat on it before {first}. The cup has a lid. The apron has three mends.', 'A card from the wander year: the ring counter at {drum}, and on the back, Bring this back: the sprig on the rice ball.'],
];

// One thing more in each kind of hall.
export const BEAM = [
  ['Cut into the beam over the pass: the names of every cook who held this hall, the oldest worn almost smooth. {first}’s is the newest and the cleanest.', 'Under it, in pencil, a tally of lids lost. It has not gone up since Knotnight.'],
  ['Names on the beam, a cook to a line, with the years. The longest held the hall for sixty-one of them. The shortest, for one Booking Day.', 'The newest, {cook}, is cut a little crooked. Whoever cut it was laughing.'],
  ['The beam carries the cooks’ names and, beside each, one dish. Three of them chose jook.', 'Somebody has started cutting a space for the next name and stopped, politely.'],
  ['Names on the beam, and under the oldest a line nobody can read any more. The block court once spent nine minutes on what it says.', '{first} has added nothing to the beam but a lid hook, and hung their own lid on it.'],
];
export const SLIDE = {
  low: [['You give the water jug a push spinward along the table. It slows early and sits down a hand short of where you meant.', 'The child opposite slides it back anti, and it runs on past your bowl. Spin sinks, anti floats. Everybody here learned it before reading.'], ['You slide the salt crock along the table. Spinward it drags; anti it sails. Along the axis, they say, it flies true. The table here runs spinward, so nothing flies true at all.', 'The regulars pass things across the table, never along it.']],
  middle: [['You push the jug spinward along the oval. It slows and settles early, heavier than it looked.', 'Somebody opposite sends it back anti and it runs on a hand’s width further than they meant. They have stopped apologising for it.'], ['A jug slid along the long side of the oval never ends up where it was aimed. Spinward it sinks, anti it floats.', 'Round the ends nobody slides anything. The aunts say the curve is for passing, not throwing.']],
  high: [['You slide the jug spinward. Up here it weighs so little that it hardly slows at all, and it stops only where the oval bends.', 'An elder catches it with two fingers. Anti, at this weight, it would have gone off the end.'], ['At this weight a pushed jug keeps going. The table has a lip at both ends for that reason, worn smooth by forty years of catches.', 'Spinward it sinks, anti it floats, and up here it mostly floats.']],
};
export const FELT = [
  ['A cloth tag at the corner of the felt: the household that pressed it, the year, and when it last came down for washing. This one says: the Odegaard table, two layers, washed before last Booking Day.', 'Without the felts, someone explains, a hall this size rings like a bell in heliox. You would hear every spoon from the far end.'],
  ['The tag says which table made the felt and what colour it was dyed the first time. This one has been dyed three times. The tag has been sewn on four.', 'Colour weighs nothing, so the felts get dyed for every festival. The red is for Booking Day.'],
  ['Each felt is signed in thread. The block hangs a new one when a child is named, and the table that stood at the naming makes it.', 'This one is a naming felt, and the child it was hung for is helping with the lids today.'],
  ['The tag is written in a careful hand: pressed felt, washed at the Quiet, rehung the day after, do not touch with gin hands.', 'Bare, a room of this size would ring for two seconds after every laugh. Hung, it is merely loud.'],
];
export const HEAVY = [
  ['Cast, and heavier than the bowl under it. At {g} of a g a stoneware lid rides up when someone laughs, so the High halls cast theirs.', 'Under it, {dish}, still steaming. You put the lid back with both hands, the way the elders do.'],
  ['The lid is cast metal and weighs more than the bowl and the soup together. Here that is about what a light lid weighs on the Low decks.', 'It is numbered on the inside. Somebody has scratched a small star beside the number.'],
  ['Heavy, and warm from the steam. Up here, somebody tells you, the lids were the first thing the block remade when the Count came off.', 'You set it down. It does not rock. That is the point of it.'],
  ['The lid rings faintly when it touches the rim, a low note for such a small thing. Every lid in the hall rings a little differently.', 'The cook knows whose bowl is whose by the note. Nobody believes this until they hear it done.'],
];
export const HUNDRED = [
  ['The hundred board: the names of the block’s people who turned a hundred this year, each with the day and one word they chose.', 'The words this year: bread, again, Hollow, slowly, yes. The last line is blank, for whoever is next.'],
  ['A board of names and dates: everyone in the block who reached a hundred, going back further than the hall.', 'The newest has a sprig tucked into the frame beside it, still green.'],
  ['The names on the hundred board are written by the person themself, if they can, and by their table if not. Most could.', 'Underneath: Breakfast on the Monday after, at the long table. Everyone is invited. Nobody is late.'],
  ['The board lists the hundreds, and under each, who sat beside them at the breakfast. The same names come round again and again.', 'A card pinned to the corner: one hundred and nine. Still coming. Keep the end seat.'],
];
export const KIDS = [
  ['Under the little table, in chalk: a lid with legs, a glide car falling, and AXIS FLIES TRUE in four different hands.', 'Somebody has drawn the cook with a ladle the size of a door.'],
  ['The children’s table is low, and its underside is covered in chalk: names, a spinball score, a map of the block with the hall much bigger than it is.', 'The newest drawing is a wanderer with a pack. It might be you.'],
  ['Chalk under the children’s table: SPIN SINKS ANTI FLOATS, a lot of lids, and a long table with everybody at it, each with a face.', 'One of the faces has been rubbed out and drawn again, smiling this time.'],
  ['The children keep a tally under their table of how many guests each week. This week is a good week.', 'Beside it, in a grown-up hand: ask them where they slept first.'],
];
export const GIN = ['Gin after six, in the halls only, and only with something under a lid. It is after six.', 'It is past six. Somebody is setting out lidded glasses at the end of the pass.'];
