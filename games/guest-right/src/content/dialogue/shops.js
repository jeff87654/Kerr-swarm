// dialogue/shops.js: what Candlewick's shopkeepers and trades say when you talk to them as people.
// Their counters in src/places/ have their own lines (menus, cards, the first hello); these are fresh.
// Node format: src/game/story.js. Days: 1 Thursday, 2 the Quiet, 3 Booking Day, 4 the fourth morning.

// yes and no read a flag or a test, so the conditions need no punctuation a voice checker would trip on.
const yes = (v) => Boolean(v);
const no = (v) => (v ? false : true);

const WIM_MEND = [
  { choice: [
    { t: 'Have it mended so it shows.', go: 'mend', cost: 3.25 },
    { t: 'Not today.', go: 'later' },
  ] },
  { label: 'later' },
  { t: "It'll wait. It has waited four legs." },
  { end: true },
  { label: 'mend' },
  { pay: 3.25, what: 'A shown patch', else: 'short' },
  { t: 'Half an hour, ten grams of offcut, and a thread that does not match, on purpose.' },
  { toast: 'Wim stitches over the hole in your cuff in green thread. It shows on purpose.' },
  { set: 'shownPatch' }, { give: 'shown-patch' }, { thread: 'mend', step: 1 }, { thread: 'mend', done: true }, { found: 'shown-mend' },
  { t: 'There. Now your coat has a chapter from here. Somebody in Spelt will ask, and you will have to tell them.' },
  { end: true },
  { label: 'short' },
  { t: "You're short. Come back after the dividend. The tear isn't going anywhere, and neither am I." },
];

const AMADOU_BUY = [
  { choice: [
    { t: "A host's sprig, please.", go: 'buy', cost: 0.03 },
    { t: 'Just looking.', end: true },
  ] },
  { end: true },
  { label: 'buy' },
  { pay: 0.03, what: "A host's sprig", else: 'short' },
  { give: 'host-sprig' },
  { t: 'Chervil, tied in green. Give it at the door, not after dinner. After dinner it looks like an apology.' },
  { end: true },
  { label: 'short' },
  { t: 'Short by three hundredths. Take it anyway. Pay me in news.' },
  { give: 'host-sprig' },
];

const DOROTA_SOAK = [
  { choice: [
    { t: 'A long soak.', go: 'soak' },
    { t: 'Another time.', end: true },
  ] },
  { end: true },
  { label: 'soak' },
  { t: "As long as you like. I'll knock on the rail if you go pink." },
  { call: 'bath' },
];

const isCoat = (hex) => (g) => g.flags.coat === hex && no(g.flags.priya_coat_seen);

export const TALK_SHOPS = {
  // ------------------------------------------------------------------ Fausta, the Glass Case
  fausta: [
    { id: 'fausta-first', once: true, priority: 30, script: [
      { t: 'Point, please. Children tap. I wipe that glass twice a day and it still has a nose on it by noon.' },
      { t: 'A tomato is half a kay. More than a quarter of a bowl of Thursday ramen, and you eat it in four bites.' },
      { t: 'So it sits on a cushion under its own lamp, and people come in to look at it the way they would look at a ring.' },
      { found: 'tomato-jewel' }, { custom: 'The Garden' },
    ] },
    { id: 'fausta-salad', once: true, priority: 10, script: [
      { t: "Ask me what a salad's worth and I'll tell you. An occasion." },
      { t: 'All year it is cut into careful portions. At the feast every plate gets two side salads, cut generously for once.' },
      { t: 'People say generously for a week afterwards, the way you would say a name.' },
      { found: 'salad-treat' },
    ] },
    { id: 'fausta-apple', once: true, priority: 9, script: [
      { t: "The apple is four point four. A fifth of a day's wallet, for one piece of fruit." },
      { t: 'Nobody buys one for themselves. When an apple leaves here in rose tissue, somebody is about to be surprised at a door.' },
    ] },
    { id: 'fausta-quiet', once: true, priority: 20, when: { day: 2 }, script: [
      { t: 'Two hundred apples for the hall tomorrow, one for every two seats. Not one of them from my case.' },
      { t: "They come straight down from the Hollow rows in Dagny's crates, and I am not even allowed to look at them. I looked." },
    ] },
    { id: 'fausta-booking', once: true, priority: 20, when: { day: 3 }, script: [
      { t: 'I close at twelve today. Nobody buys a tomato on the day the drum gives them half an apple.' },
      { t: 'Watch Teodor cut. When the star comes to you, hold it up. Everyone does. Even me.' },
    ] },
    { id: 'fausta-d1', when: { day: 1 }, script: [{ t: 'Look as long as you like. Looking is free.' }] },
    { id: 'fausta-d2', when: { day: 2 }, script: [{ t: 'Good day for my trade. People stand at the glass and tell each other what things cost.' }] },
    { id: 'fausta-d3', when: { day: 3 }, script: [{ t: 'Feast at one. The tomatoes will keep.' }] },
    { id: 'fausta-d4', when: (g) => g.clock.day >= 4, script: [{ t: 'Back to ordinary prices, which are the same prices.' }] },
  ],

  // ------------------------------------------------------------------ Idris, Second Rise
  idris: [
    { id: 'idris-first', once: true, priority: 30, script: [
      { t: "I've been up since four, so everything after nine is the afternoon to me." },
      { t: 'Buns, puffs, steamed cakes. And the Lovage loaf, which I sell and do not bake.' },
      { t: 'It comes in on the first glide from the Crock in Lovage. Four centuries of starter, registered and filed.' },
      { t: "I'm not competing with that. I make buns." },
      { found: 'lovage-loaf' },
    ] },
    { id: 'idris-bread', once: true, priority: 10, script: [
      { t: 'A sugar bun is 0.40. A tomato next door is 0.50. People think that is upside down.' },
      { t: 'It isn\'t. Bread is Mill starch and a pinch of gluten from the Vats. A tomato needs a lamp, and the lamp is the dear part.' },
      { t: 'So bread is what you fill up on, and the tomato is what you remember.' },
      { found: 'cheap-bread' },
    ] },
    { id: 'idris-margin', once: true, priority: 15, when: { day: 2 }, script: [
      { t: 'The Margin bun. Stamped five million, nine hundred and forty thousand.' },
      { t: 'This morning the board was eighty over that. By tomorrow it will be right. It always comes out right on the day.' },
    ] },
    { id: 'idris-nell', once: true, priority: 20, when: { day: 2 }, script: [
      { t: "Nell bakes with me. She's been here since four, same as me, folding cheese puffs like she means it." },
      { t: 'About tonight I will say one thing, and it is that I hope. That is all I am saying. Have a bun.' },
    ] },
    { id: 'idris-booking', once: true, priority: 20, when: { day: 3 }, script: [
      { t: "Every hall in Chervil serves the Lovage sourdough today and says it's theirs. I say nothing." },
      { t: "I'm a baker, not a witness. And the Margin bun is right to the share this morning." },
    ] },
    { id: 'idris-d1', when: { day: 1 }, script: [{ t: "Lid on the steamed cake, or it's a cold cake by the door." }] },
    { id: 'idris-d2', when: { day: 2 }, script: [{ t: "Quiet morning. The ovens don't know." }] },
    { id: 'idris-d3', when: { day: 3 }, script: [{ t: "Feast at one. Don't fill up on buns. Fill up a little." }] },
    { id: 'idris-d4', when: (g) => g.clock.day >= 4, script: [{ t: 'The heels are free. Take one for the road. Everybody does.' }] },
  ],

  // ------------------------------------------------------------------ Wim, the Shown Seam
  wim: [
    { id: 'wim-first', once: true, priority: 30, when: { notFlag: 'shownPatch' }, script: [
      { t: 'Hold still. That cuff. You tore it on something hard, about four legs back, and you have folded it under ever since.' },
      { s: 'you', t: 'Leg seven. A capsule hatch.' },
      { t: 'A hatch edge does that. Clean tear, no fray, and you folded it so nobody would see.' },
      { t: 'In Chervil we do the other thing. We mend it so it shows.' },
      { thread: 'mend', start: true }, { thread: 'mend', step: 0 }, { custom: 'Visible mending' },
    ].concat(WIM_MEND) },
    { id: 'wim-first-mended', once: true, priority: 30, when: (g) => yes(g.flags.shownPatch) && no(g.journal.isDone('mend')), script: [
      { t: "That's my green on your cuff. I'd know it on the far side of Merrow." },
      { t: 'Leg seven, was it. Now it has a leg eleven on top. That is how a coat keeps count.' },
      { thread: 'mend', step: 0 }, { thread: 'mend', step: 1 }, { thread: 'mend', done: true }, { found: 'shown-mend' },
    ] },
    { id: 'wim-mend-later', priority: 15, when: (g) => no(g.flags.shownPatch) && g.journal.started('mend'), script: [
      { t: 'Back for the cuff.' },
    ].concat(WIM_MEND) },
    { id: 'wim-coat', once: true, priority: 10, script: [
      { t: 'Let me read your coat. That hem was taken up by hand. Small slanted stitches, somebody patient.' },
      { s: 'you', t: "Pell's. The baker." },
      { t: 'Then Pell has neat hands for a big man. There is flour in the seam. You can tell your coat was in a bakery.' },
    ] },
    { id: 'wim-quiet', once: true, priority: 20, when: { day: 2 }, script: [
      { t: 'On the Quiet people bring old coats in just to have them read. No mending. Only the story.' },
      { t: 'This morning I had one with seven owners. A wedding lining, a let-out seam, two Long Flight fins.' },
      { t: 'And a cuff darned in rust by somebody who could not darn. The family has argued for forty years about who it was.' },
      { t: 'I could tell them. I did not. They were enjoying the argument.' },
    ] },
    { id: 'wim-booking', once: true, priority: 20, when: { day: 3 }, script: [
      { t: 'By nine tonight somebody comes in with a fin hanging off a wing-sleeve. Every Booking Day.' },
      { t: 'I stitch it on the step while their block goes up without them. They always make the second shift.' },
    ] },
    { id: 'wim-d1', when: { day: 1 }, script: [{ t: 'Thread Street is for mending. Walk it slowly.' }] },
    { id: 'wim-d2', when: { day: 2 }, script: [{ t: 'Sit. The Quiet is for stories.' }] },
    { id: 'wim-d3', when: { day: 3 }, script: [{ t: 'Fins and lamps today. Everything else waits.' }] },
    { id: 'wim-d4', when: (g) => g.clock.day >= 4, script: [{ t: 'Safe road. Come back with something torn.' }] },
  ],

  // ------------------------------------------------------------------ Priya, Fast Colour
  priya: [
    { id: 'priya-first', once: true, priority: 30, script: [
      { t: "Don't mind my hands. Bruise to the wrist on the left, Dawn Rose to the knuckle on the right." },
      { t: 'Four hundred coats this week. The festival six are on the board.' },
      { t: 'Bruise, Dawn Rose, Far-Bank Gold, Flight Indigo, Chervil Green and Lid Copper.' },
      { t: 'A tenth of a kay and a night on the hook, and you would look as if you had been invited.' },
      { thread: 'colour', start: true },
    ] },
    { id: 'priya-lumi', once: true, priority: 10, script: [
      { t: "That little coat on the rail is Lumi's. She's six, and she is my test vat." },
      { t: 'Every week she goes to school a different colour. Last week the Flight Indigo came out nearer Bruise.' },
      { t: 'She would not take it off. The other children ask her what colour she will be next. She says it is a secret. It is a secret from me too.' },
    ] },
    { id: 'priya-coat-bruise', once: true, priority: 25, when: isCoat('#5b4060'), script: [
      { t: 'Bruise. Oona will see you on the terraces and pretend she has not noticed. She will have noticed.' },
      { set: 'priya_coat_seen' },
    ] },
    { id: 'priya-coat-green', once: true, priority: 25, when: isCoat('#6c9a4c'), script: [
      { t: 'Chervil Green. Half the block is in it. You will be taken for a neighbour all day, which is the idea.' },
      { set: 'priya_coat_seen' },
    ] },
    { id: 'priya-coat', once: true, priority: 24, when: (g) => yes(g.flags.coat) && no(g.flags.priya_coat_seen), script: [
      { t: 'That took well. Spelt grey underneath, and nobody would ever know.' },
      { t: 'Colour weighs nothing. It only changes who talks to you.' },
      { set: 'priya_coat_seen' },
    ] },
    { id: 'priya-quiet', once: true, priority: 20, when: { day: 2 }, script: [
      { t: 'On the Quiet I do not dye. The vats sit warm on the loop, and so do I.' },
      { t: 'People still come and stand at the swatch wall and argue. I have seen a couple nearly part over Lid Copper.' },
    ] },
    { id: 'priya-booking', once: true, priority: 20, when: { day: 3 }, script: [
      { t: 'Look at the court. I did most of that. I can tell who came in last on Thursday night, because their green is greener.' },
      { t: 'By the Long Flight it will all be under a hand lamp in the Spindle, and nobody will see any of it.' },
    ] },
    { id: 'priya-d1', when: { day: 1 }, script: [{ t: 'Pick a colour. It costs a tenth of a kay to be wrong.' }] },
    { id: 'priya-d2', when: { day: 2 }, script: [{ t: 'Sit. The vats are keeping themselves warm.' }] },
    { id: 'priya-d3', when: { day: 3 }, script: [{ t: "Wear it to the feast. That's what it's for." }] },
    { id: 'priya-d4', when: (g) => g.clock.day >= 4, script: [{ t: 'Nobody dyes back. That is the point of colour.' }] },
  ],

  // ------------------------------------------------------------------ Matti, the Long Pipe
  matti: [
    { id: 'matti-first', once: true, priority: 30, script: [
      { t: 'Arms out. Wider. I measure a beginner before they choose, or they choose by colour.' },
      { t: 'Everyone picks the pretty one. Then they cannot reach the bottom hole, and they blame the flute.' },
      { t: 'Go and stand at the board by the door. It will tell you what you can reach, and then we will talk.' },
      { thread: 'flute', start: true },
    ] },
    { id: 'matti-breath', once: true, priority: 10, script: [
      { t: 'Beginners overblow. The air is light and quick, and the note jumps up before you have asked it to.' },
      { t: "Blow as if you were cooling soup you're not allowed to lift the lid on." },
    ] },
    { id: 'matti-quiet', once: true, priority: 20, when: { day: 2 }, script: [
      { t: 'Item four at the court tonight is me. Flute practice after ten.' },
      { t: 'My neighbour upstairs says the Long Pipe sings through her floor. She is right. Heliox carries, and a long flute carries further.' },
      { t: 'Mags from Sorrel has offered to hang felt in here. I said yes before she could think about it.' },
      { t: 'If the court asks, I will say the felt is coming. If it asks when, I will say Mags.' },
    ] },
    { id: 'matti-booking', once: true, priority: 20, when: { day: 3 }, script: [
      { t: "Four of my flutes are on the bandstand today with Rufus's band." },
      { t: 'They will come back with fingerprints all over them, which is how you know they were played.' },
    ] },
    { id: 'matti-d1', when: { day: 1 }, script: [{ t: 'The board by the door. Arms out.' }] },
    { id: 'matti-d2', when: { day: 2 }, script: [{ t: 'The Quiet is good for long notes.' }] },
    { id: 'matti-d3', when: { day: 3 }, script: [{ t: 'Listen for the long flutes on the green. They are mine.' }] },
    { id: 'matti-d4', when: (g) => g.clock.day >= 4, script: [{ t: 'Come back when you have a year. A flute takes a year.' }] },
  ],

  // ------------------------------------------------------------------ Gustav, Second Sitting
  gustav: [
    { id: 'gustav-first', once: true, priority: 30, script: [
      { t: 'Try the bow-back. Ninety-six years and three families, and it costs a hundred and eight kays.' },
      { t: 'The young one by the window is thirty-three years old and twenty-four kays, and nobody wants it.' },
      { t: 'People pay for the years. A chair gets better the more people have sat in it. So does a bench. So does a hall.' },
      { found: 'oldest-chair' }, { custom: 'New mass' },
    ] },
    { id: 'gustav-sofa', once: true, priority: 10, script: [
      { t: 'Every couple about to marry comes in wanting a new sofa. Forty kilograms. A thousand kays.' },
      { t: 'Then I show them the remake. Four kilograms of new is a hundred kays, and forty hours of me is two hundred and forty.' },
      { t: "About three hundred and forty, and it's their grandparents' sofa. I've never lost one to the new. A few have slept on it." },
      { found: 'sofa-sums' },
    ] },
    { id: 'gustav-quiet', once: true, priority: 20, when: { day: 2 }, script: [
      { t: 'On the Quiet I read the undersides. Everyone who has a chair remade writes their name under it, in pencil.' },
      { t: 'The armchair under the sheet has eleven. The oldest is nearly gone. I can make out an R and the word sorry.' },
    ] },
    { id: 'gustav-booking', once: true, priority: 20, when: { day: 3 }, script: [
      { t: 'Four hundred people sit down in the hall at one. I sit at the end and listen for the joint that creaks.' },
      { t: "There is always one. I find it on the fourth morning, and it's always somebody's grandmother's." },
    ] },
    { id: 'gustav-d1', when: { day: 1 }, script: [{ t: 'Sit in something over fifty. You will feel the difference.' }] },
    { id: 'gustav-d2', when: { day: 2 }, script: [{ t: "Chairs don't talk on the Quiet. They creak." }] },
    { id: 'gustav-d3', when: { day: 3 }, script: [{ t: 'Feast at one. Mind the bench. It is older than you.' }] },
    { id: 'gustav-d4', when: (g) => g.clock.day >= 4, script: [{ t: 'Safe road, Spelt. Whatever you sit on at home, ask how old it is.' }] },
  ],

  // ------------------------------------------------------------------ Ros, the toy library
  ros: [
    { id: 'ros-ball-scuffed', once: true, priority: 41, when: (g) => g.inv.has('spinball') && yes(g.flags.ball_scuffed), script: [
      { t: "Look at that. Scuffed on the anti side, and a stripe on it from a line Kwame painted this week." },
      { t: "That's a ball that has been somewhere. Give it here." },
      { take: 'spinball' }, { clear: 'hasBall' }, { thread: 'spinball', step: 2 }, { thread: 'spinball', done: true },
      { t: 'A wipe on the bench and it goes out again tomorrow. Some child will get your scuff and never know.' },
    ] },
    { id: 'ros-ball-clean', priority: 40, when: (g) => g.inv.has('spinball') && no(g.flags.ball_scuffed), script: [
      { t: 'That ball has been in your bag the whole time. It is still round on every side.' },
      { t: 'Take it to the long hall at the school and throw it anti. It sails. Throw it hard. Then bring it back.' },
    ] },
    { id: 'ros-first', once: true, priority: 30, when: (g) => no(g.flags.hasBall) && no(g.journal.isDone('spinball')), script: [
      { t: 'A grown-up in the toy library. Good. You can reach the top shelf.' },
      { t: 'Everything in here is lent and mended in between. Children learn early that things come back. Grown-ups forget.' },
      { t: "There's a spinball up there that hasn't been out since Tuesday. A ball on a shelf is a waste of a ball." },
      { t: 'Put your name in the book for it, and take it to the long hall.' },
      { thread: 'spinball', start: true },
    ] },
    { id: 'ros-quiet', once: true, priority: 20, when: { day: 2 }, script: [
      { t: 'Busiest day of my year. No worlds, so every child in Candlewick remembers that toys exist.' },
      { t: 'The kites went by nine. The model drums by ten. The rag doll with one shoe has been out four times since breakfast.' },
    ] },
    { id: 'ros-booking', once: true, priority: 20, when: { day: 3 }, script: [
      { t: 'Kites for the green, whistles for the bandstand. I will have them all back by the fourth morning, mostly.' },
      { t: "Every Booking Day one whistle doesn't come back. I don't chase it. It's somewhere being played." },
    ] },
    { id: 'ros-d1', when: { day: 1 }, script: [{ t: 'Mind the cab on the bench. It is having its gimbal seen to.' }] },
    { id: 'ros-d2', when: { day: 2 }, script: [{ t: 'Everything is out. Come back and look at the empty shelves. It is a good sight.' }] },
    { id: 'ros-d3', when: { day: 3 }, script: [{ t: 'Go to the green. Bring back whatever you borrow.' }] },
    { id: 'ros-d4', when: (g) => g.clock.day >= 4, script: [{ t: 'Anything of mine in your bag, the bench is open.' }] },
  ],

  // ------------------------------------------------------------------ Ben, the tea cart
  ben: [
    { id: 'ben-first', once: true, priority: 30, script: [
      { t: "You'll want the long pour. Everyone does. Here's the trick of it." },
      { t: 'I pour from about a metre, and the tea lands about two centimetres anti of where I aim.' },
      { t: 'So I aim two centimetres spinward of the cup, and it lands in the middle.' },
      { t: 'Took me a month to stop missing. The cart still has a stain on its anti side to prove it.' },
      { found: 'tea-anti' }, { custom: 'Spinward and anti' },
    ] },
    { id: 'ben-up', once: true, priority: 10, script: [
      { t: "In Sorrel's Spindle there's a tea room where they float out and pour toward the axis. Then it bends spinward." },
      { t: "I have never tried it. I'd wear it." },
    ] },
    { id: 'ben-quiet', once: true, priority: 20, when: { day: 2 }, script: [
      { t: 'Best day for the cart. No worlds, so people stand here talking till their tea goes cold, and then buy another.' },
      { t: "Since eight I've heard one proposal, two reconciliations and an argument about the middle of Oona's dawn." },
    ] },
    { id: 'ben-booking', once: true, priority: 20, when: { day: 3 }, script: [
      { t: "Open from five, for the ones who can't get up the wall for the dawn." },
      { t: 'They stand here and look at the court ceiling. Oona tried her colours on it all week, so it is the next best thing.' },
    ] },
    { id: 'ben-d1', when: { day: 1 }, script: [{ t: 'Bring the cup back to any cart. They all know my cups.' }] },
    { id: 'ben-d2', when: { day: 2 }, script: [{ t: "Lid on. Quiet or not, heliox doesn't wait." }] },
    { id: 'ben-d3', when: { day: 3 }, script: [{ t: 'Feast at one. Tea after.' }] },
    { id: 'ben-d4', when: (g) => g.clock.day >= 4, script: [{ t: "Fourth morning. You'll want it strong." }] },
  ],

  // ------------------------------------------------------------------ Zhenya, the Keeping Room
  zhenya: [
    { id: 'zhenya-first', once: true, priority: 30, script: [
      { t: 'Everything in here keeps. That is the whole shop.' },
      { t: 'If the beam were cut, the drum could keep the air going about fifty-five days on its reserve. The air is the drum\'s job.' },
      { t: 'The food is the family\'s. Hard bread, aged cheese, preserves, miso, and a tin of the Nine at the back.' },
      { t: 'People show you their larders the way they would show you a new grandchild.' },
      { found: 'larder-pride' },
    ] },
    { id: 'zhenya-knot', once: true, priority: 10, script: [
      { t: 'The sign over the door is for Knotnight. One evening a year the lamps go down and the block makes its larder together.' },
      { t: "As if a long dark were coming. Rafts used to sit in each other's shadow for weeks. None has for a hundred million years." },
      { t: 'We do it anyway. It is the best evening of the year, after the one coming.' },
      { found: 'knotnight' }, { custom: 'Knotnight' },
    ] },
    { id: 'zhenya-crock', once: true, priority: 15, when: (g) => no(g.inv.has('lent-crock')), script: [
      { t: 'Take a crock. You will want one for something before you are home. A spoon from the hall, if somebody offers.' },
      { give: 'lent-crock' },
      { t: 'It comes back. Even from Spelt. Send it with the next wanderer coming this way. They always come.' },
    ] },
    { id: 'zhenya-quiet', once: true, priority: 20, when: { day: 2 }, script: [
      { t: 'On the Quiet people come in and tell me what their grandmothers kept.' },
      { t: 'I do not sell much. I hear a great deal about pickled radish.' },
    ] },
    { id: 'zhenya-booking', once: true, priority: 20, when: { day: 3 }, script: [
      { t: 'The cheese at the feast went down before last Booking Day. I turned some of those wheels myself.' },
      { t: "Don't tell me if it's good. I'll see it on the faces from the far end." },
    ] },
    { id: 'zhenya-d1', when: { day: 1 }, script: [{ t: 'Everything keeps. Even me.' }] },
    { id: 'zhenya-d2', when: { day: 2 }, script: [{ t: 'Sit by the crocks. They are good listeners.' }] },
    { id: 'zhenya-d3', when: { day: 3 }, script: [{ t: 'Cheese at one. Take a slice for whoever is next to you.' }] },
    { id: 'zhenya-d4', when: (g) => g.clock.day >= 4, script: [{ t: 'The crocks come back. So do wanderers.' }] },
  ],

  // ------------------------------------------------------------------ Amadou, the herb shop
  amadou: [
    { id: 'amadou-sprig', once: true, priority: 50, when: (g) => g.clock.day === 1 && g.clock.hours >= 11 && g.clock.hours < 20 && no(g.flags.carrying_tray) && no(g.journal.isDone('sprig')), script: [
      { t: 'You. Good hands and nowhere to be. Tomorrow is the Quiet, and on the Quiet the hall cuts small.' },
      { t: "So tomorrow's sprig for the ring counter comes from me. Chives, a tray of them, and Tomas needs it tonight." },
      { t: 'Station Ring 2, the hatch on the inbound platform. Keep the cloth damp. The cab leans, so you do not have to.' },
      { thread: 'sprig', start: true }, { set: 'carrying_tray' },
      { toast: 'A shallow tray of chive cuttings under a damp cloth.' },
    ] },
    { id: 'amadou-tray', priority: 45, when: { flag: 'carrying_tray' }, script: [
      { t: 'Ring counter, Station Ring 2. Tomas. Before the lamps fade, and keep the cloth damp.' },
    ] },
    { id: 'amadou-first', once: true, priority: 30, script: [
      { t: 'Read the sign. Bring herbs, not gin.' },
      { t: 'A sprig is three hundredths of a kay. A whole bottle of gin is 2.8, less than one apple, and it says nothing at all.' },
      { t: 'A sprig says I noticed your shelf. That is worth more than a bottle.' },
      { found: 'bring-herbs' },
    ].concat(AMADOU_BUY) },
    { id: 'amadou-row', once: true, priority: 10, script: [
      { t: 'The Row in sprigs. Sorrel, sharp. Lovage, celery and swagger. Borage, cucumber. Yarrow. And rue, which nobody eats twice.' },
      { t: 'And chervil, ours. Soft, and a little of aniseed.' },
      { t: 'No tansy. Tansy the drum is lovely. Tansy the herb is not for eating.' },
      { t: 'Hollis from Rue buys a sprig of rue every Booking Day and eats it in front of me. He says it is for character.' },
      { found: 'herb-row' },
    ] },
    { id: 'amadou-quiet', once: true, priority: 20, when: { day: 2 }, script: [
      { t: "On the Quiet everyone brings a sprig to whoever's table they sit at. My best day, after tomorrow." },
    ].concat(AMADOU_BUY) },
    { id: 'amadou-booking', once: true, priority: 20, when: { day: 3 }, script: [
      { t: "Booking Day. People buy a sprig for the cook. Marit will have forty on the pass by one." },
    ].concat(AMADOU_BUY) },
    { id: 'amadou-d1', when: { day: 1 }, script: [{ t: 'Bring herbs. Always.' }].concat(AMADOU_BUY) },
    { id: 'amadou-d2', when: { day: 2 }, script: [{ t: 'A sprig for your table?' }].concat(AMADOU_BUY) },
    { id: 'amadou-d3', when: { day: 3 }, script: [{ t: 'Forty sprigs on the pass. Make it forty-one.' }].concat(AMADOU_BUY) },
    { id: 'amadou-d4', when: (g) => g.clock.day >= 4, script: [{ t: 'Safe road. Take the sign with you, in your head.' }].concat(AMADOU_BUY) },
  ],

  // ------------------------------------------------------------------ Nkem, the clinic
  nkem: [
    { id: 'nkem-first', once: true, priority: 30, script: [
      { t: 'Sit a minute. The chair by the door is for talking. Nobody has to be ill to use it.' },
      { t: 'Eleven legs. Half your nights weightless on the slow line. Your shins ache on the stairs.' },
      { s: 'you', t: 'A bit.' },
      { t: 'Two days at 0.98 and they will forgive you. Have some Nine at the hall. You look peaky.' },
    ] },
    { id: 'nkem-stay', once: true, priority: 10, script: [
      { t: "Fifteen years in this clinic. I've taken the blood pressure of most of Candlewick's elders every month of it." },
      { t: 'Gideon tells me a different naming story each time, so I know he is well.' },
      { t: 'Chervil spends about forty in every hundred kays of its wallets on each other\'s time. Most drums spend twenty-five.' },
      { t: 'On the same beam, that buys cooks, and teachers, and music every night. And nurses who stay.' },
      { found: 'nurses-stay' },
    ] },
    { id: 'nkem-quiet', once: true, priority: 20, when: { day: 2 }, script: [
      { t: 'The Quiet is my quietest clinic and my busiest chair.' },
      { t: 'No worlds, so people come and sit by the door and tell me what they would usually tell nobody.' },
    ] },
    { id: 'nkem-booking', once: true, priority: 20, when: { day: 3 }, script: [
      { t: 'After the Long Flight I see stiff necks from people who spent four hours looking down the axis.' },
      { t: 'And one or two who forgot to aim wide. Nothing a robe and a lidded cup will not fix.' },
    ] },
    { id: 'nkem-d1', when: { day: 1 }, script: [{ t: 'The chair is there. Use it.' }] },
    { id: 'nkem-d2', when: { day: 2 }, script: [{ t: "Sit. Talk. That's the treatment today." }] },
    { id: 'nkem-d3', when: { day: 3 }, script: [{ t: 'Eat at one, fly at ten, sleep after. In that order.' }] },
    { id: 'nkem-d4', when: (g) => g.clock.day >= 4, script: [{ t: 'Stairs, not cabs, for a day. Your bones will thank you.' }] },
  ],

  // ------------------------------------------------------------------ Dorota, the baths
  dorota: [
    { id: 'dorota-first', once: true, priority: 30, script: [
      { t: 'Robe is on the rail, warm. Take it before you get out, not after. Heliox has wet skin cold in a minute.' },
      { t: "The water comes off the food plant's loop, so the heat is free. Pumps and cleaning are about five hundredths of a kay a bath." },
      { t: 'The commons pays that. Cheapest luxury in the drum.' },
      { t: "The steam is where the drum's gossip lives. I hear all of it and repeat almost none." },
      { found: 'free-bath' },
    ].concat(DOROTA_SOAK) },
    { id: 'dorota-gossip', once: true, priority: 20, when: { day: 1, hours: [17, 23.5] }, script: [
      { t: 'Evening steam is the best for news. I only listen.' },
      { t: "Jory has been seen on the front terrace with a measuring tape. Twice. Marit hasn't noticed, which for Marit is a great deal." },
      { t: 'The Okonjos have asked the court for leave for a third. Everybody in the warm pool is hoping, quietly.' },
      { t: "And whether Oona's dawn is too slow in the middle. Half the pool says yes." },
      { t: "The other half says she'll fix it next year, which is what she says too." },
      { s: 'you', t: 'What do you think?' },
      { t: 'I think I will be on the terraces at six with everyone else.' },
    ].concat(DOROTA_SOAK) },
    { id: 'dorota-thread', once: true, priority: 20, when: (g) => g.clock.day === 2 && no(g.inv.has('black-thread')), script: [
      { t: 'Look at the wrists in the steam today. A black thread on every left one. Do not message me, I will not see it.' },
      { t: 'Nobody can message anybody on the Quiet anyway. They wear it all the same. It is a nice thing to wear.' },
      { t: 'Here. One for you. Left wrist.' },
      { give: 'black-thread' }, { found: 'black-thread' }, { custom: 'Going dark' },
    ] },
    { id: 'dorota-booking', once: true, priority: 20, when: { day: 3 }, script: [
      { t: 'After the feast the whole block comes down full of steak and lies in the warm pool like loaves.' },
      { t: 'After the Long Flight they come back cold from the Spindle. I keep the robes on the rail all night.' },
    ].concat(DOROTA_SOAK) },
    { id: 'dorota-d1', when: { day: 1 }, script: [{ t: 'Warm in here. Stay a while.' }].concat(DOROTA_SOAK) },
    { id: 'dorota-d2', when: { day: 2 }, script: [{ t: 'The Quiet fills the baths. They are free and full of people.' }].concat(DOROTA_SOAK) },
    { id: 'dorota-d3', when: { day: 3 }, script: [{ t: 'Soak before the Flight. The Spindle is cold work.' }].concat(DOROTA_SOAK) },
    { id: 'dorota-d4', when: (g) => g.clock.day >= 4, script: [{ t: 'One more before the road.' }].concat(DOROTA_SOAK) },
  ],

  // ------------------------------------------------------------------ Lucan, the school
  lucan: [
    { id: 'lucan-out', once: true, priority: 25, when: { day: 2, hours: [15.5, 17] }, script: [
      { t: 'Half past three. Listen to that. Two hundred and twenty children leaving a building with no worlds in their pockets.' },
      { t: 'We spent the Quiet telling long stories. Esi told the River again. Every time, the River gets longer and the Window smaller.' },
      { t: 'Rafe told a spinball match as a story. It took two hours, and his side won.' },
    ] },
    { id: 'lucan-first', once: true, priority: 30, script: [
      { t: 'Lucan. I teach the middle class and referee spinball, badly. Wrong about every call, right about the physics.' },
      { t: 'Axis flies true, spin sinks, anti floats. Along the axis a ball goes straight.' },
      { t: 'Throw it spinward hard and it gains about a sixth of its weight and dives. Anti, it loses as much and sails.' },
      { t: "So every throw breaks by its heading, and the game is angles. The children understand it better than I do. They won't explain." },
      { found: 'spinball' }, { custom: 'Spinball' },
    ] },
    { id: 'lucan-bones', once: true, priority: 10, script: [
      { t: "You'll have noticed the school is low down. Deck 16, 0.98 of a g." },
      { t: 'Families live on the Low decks because children grow their bones best near full weight. Or so every parent believes.' },
      { t: 'I am not going to be the one to argue. They are raised heavy, and they go up when they are old and light on their feet.' },
      { found: 'low-deck-bones' },
    ] },
    { id: 'lucan-quiet', once: true, priority: 20, when: { day: 2, hours: [0, 15.5] }, script: [
      { t: 'No worlds in class today. No files, no lookups. Just me, a wall and thirty faces.' },
      { t: 'It is either the best day of the year or the longest. We find out at half past three.' },
    ] },
    { id: 'lucan-booking', once: true, priority: 20, when: { day: 3 }, script: [
      { t: "No school on Booking Day. I'll be on the green with a whistle, refereeing the children's match, wrong about every call." },
    ] },
    { id: 'lucan-d1', when: { day: 1 }, script: [{ t: 'Throw anti if you want it to sail. Not at me.' }] },
    { id: 'lucan-d2', when: { day: 2 }, script: [{ t: 'Quiet in the halls. Loud in the long hall.' }] },
    { id: 'lucan-d3', when: { day: 3 }, script: [{ t: 'No school. Go and eat.' }] },
    { id: 'lucan-d4', when: (g) => g.clock.day >= 4, script: [{ t: 'They will ask me tomorrow how far Spelt is by light. Twenty-three point seven seconds. I looked it up.' }] },
  ],
};
