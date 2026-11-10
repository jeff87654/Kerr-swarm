// dialogue/station.js: what the people of Station Ring 2 say when you walk up and talk to them.
// The desk, counter, Ledger and Gate interactions in src/places/ have their own lines; these are fresh.
// Node format: src/game/story.js. Days: 1 Thursday, 2 the Quiet, 3 Booking Day, 4 the fourth morning.

// yes and no read a flag or a test, so the conditions need no punctuation a voice checker would trip on.
const yes = (v) => Boolean(v);
const no = (v) => (v ? false : true);

const AGATHE_ASK = [
  { choice: [
    { t: 'What is the Margin, exactly?', go: 'margin', need: (g) => no(g.flags.asked_margin) },
    { t: "Is Marit Vell's name on it?", go: 'marit', need: (g) => no(g.flags.asked_marit) },
    { t: "I'll let you get on.", end: true },
  ] },
  { end: true },
  { label: 'margin' },
  { t: 'Unused shares. About six million of them. The board gives the number to the last one, and it moves by about eighty a day.' },
  { t: 'About three hundred and forty years ago this drum counted, after a radiator fault. The stop ran three or four years too long.' },
  { t: 'When the Count came down we were three in a hundred under par, and the assembly voted to keep the gap.' },
  { t: "It's a granary, not a field. It is not for children. It's for guests, and refuge, and couples waiting for a place." },
  { t: 'And for people like me. Mine is a Margin flat, lent for life. Yours is lent for three nights. Same brass tags.' },
  { thread: 'ledger', step: 2 }, { found: 'margin' }, { set: 'asked_margin' }, { custom: 'The Margin' },
  { end: true },
  { label: 'marit' },
  { t: 'Householders, the second column. Marit Vell, after Aurel Vell. Two years back.' },
  { t: 'Aurel was her great-grandfather. A place passes whole to one heir, so his home is hers now.' },
  { t: 'I read them both out, two Booking Days ago. His name still comes round beside hers, if you wait for it.' },
  { thread: 'ledger', step: 1 }, { found: 'householders' }, { set: 'asked_marit' },
  { end: true },
];

export const TALK_STATION = {
  // ------------------------------------------------------------------ Sefa, the guest desk
  sefa: [
    { id: 'sefa-book', priority: 70, when: { notFlag: 'signed_in' }, script: [
      { t: 'The book first, wanderer. Then we can talk like people.' },
      { t: "The pen is on a chain. Wanderers walk off with everything that isn't." },
    ] },
    { id: 'sefa-first', once: true, priority: 30, when: { flag: 'signed_in' }, script: [
      { t: 'Spelt. I drew you a loaf. I draw something beside every drum, so I can find people again.' },
      { t: 'Dulse gets a noodle. Tansy gets a strawberry. Rue gets a pencil, and they think that is very funny.' },
      { t: 'Two hundred a day through this desk, and I ask every one of them the same two questions.' },
      { choice: [
        { t: 'Who pays for all this?', go: 'pay' },
        { t: 'How many legs do most of them have done?', go: 'legs' },
        { t: "Thank you. I'll go and eat.", end: true },
      ] },
      { end: true },
      { label: 'pay' },
      { t: "Somewhere in Spelt tonight there's a girl from Chervil asleep in a flat like yours." },
      { t: 'Every drum in the compact sends as many as it keeps. You two are even, and neither of you will ever know.' },
      { found: 'guest-compact' }, { custom: 'Guest-right' },
      { end: true },
      { label: 'legs' },
      { t: "Most come through on their eighth or ninth. You're on eleven. I can tell by the boots." },
      { t: 'Twelve slow legs cost about thirteen kays in fares. A new pair of shoes is twenty. The year is nearly all time.' },
      { found: 'wander-cost' },
    ] },
    { id: 'sefa-questions', once: true, priority: 10, when: { flag: 'signed_in' }, script: [
      { t: 'Where have you slept, and have you eaten. In that order, always.' },
      { t: 'The first tells me how tired you are. The second tells me what to do about it.' },
      { t: 'Sorrel asks your deck, Ring and Hour. Lovage asks if you have booked. We ask about your stomach.' },
    ] },
    { id: 'sefa-quiet', once: true, priority: 20, when: { day: 2, flag: 'signed_in' }, script: [
      { t: "The Quiet. No messages, so nobody tells me who's coming. They just arrive, and I put the kettle on." },
      { t: 'Wanderers who glide in today look as if they have walked into a room where everyone stopped talking.' },
      { t: "We haven't stopped. We're only talking to each other." },
    ] },
    { id: 'sefa-booking', once: true, priority: 20, when: { day: 3, flag: 'signed_in' }, script: [
      { t: 'Guests tonight, about four hundred and ten thousand. Agathe reads it out, and somebody at the back cheers.' },
      { t: "You're one of them. I'm told it's a good year to be one." },
    ] },
    { id: 'sefa-fourth', once: true, priority: 20, when: (g) => g.clock.day >= 4 && yes(g.flags.signed_in), script: [
      { t: "Your third night's done. The key goes back on its hook when you're ready, and not before." },
      { t: "If you stay on, it's the hall's say, not mine. Marit keeps anyone who cooks." },
    ] },
    { id: 'sefa-d1', when: { day: 1 }, script: [{ t: 'Ramen at one on Ladle Row. Go hungry.' }] },
    { id: 'sefa-d2', when: { day: 2 }, script: [{ t: "Kettle's on. It's the Quiet, so it's always on." }] },
    { id: 'sefa-d3', when: { day: 3 }, script: [{ t: 'Busy morning. Come back after the vote and I will find you a chair.' }] },
    { id: 'sefa-d4', when: (g) => g.clock.day >= 4, script: [{ t: 'Safe glide, Spelt. Or stay. Either is allowed.' }] },
  ],

  // ------------------------------------------------------------------ Tomas, the ring counter
  tomas: [
    { id: 'tomas-tray', once: true, priority: 60, when: { flag: 'carrying_tray' }, script: [
      { t: 'Chives. You carried the chives down. Amadou said he would find somebody with good hands.' },
      { t: "Put it here, on the cool end of the sill. Cloth on. They've a night to sit and a morning to be cut." },
      { clear: 'carrying_tray' }, { set: 'tray_done' }, { thread: 'sprig', step: 1 }, { thread: 'sprig', done: true },
      { t: 'Tomorrow every cup on this ring gets a bit of what you carried. Have one tonight, on me.' },
      { t: 'Everything here is free, so that was a joke. Take it anyway.' },
      { give: 'herb-sprig' },
    ] },
    { id: 'tomas-first', once: true, priority: 30, script: [
      { t: "Off a car or going for one? Either way you're standing at the best counter on the Row." },
      { t: "I've drunk Sorrel's. Peppery, and good, and I'll deny I said so. Lovage's is sweet, like everything in Lovage." },
      { t: 'A cup of broth is a fifth of a kay to make. A sprig is three hundredths. That is the whole difference.' },
      { t: "And it's the best three hundredths on the Row. I'll argue it with anyone who has a train to miss." },
      { found: 'counter-sprig' }, { custom: 'The ring counter' },
    ] },
    { id: 'tomas-soup', once: true, priority: 10, script: [
      { t: 'Once a man from Lovage took his cup aboard a glide car. Hot, full, lid off.' },
      { t: "A hundred and forty seconds of falling. Sorrel's car cleaners still talk about him." },
      { t: "So we say drink it here. It's the only rule I've got, and I say it a thousand times a day." },
      { found: 'no-soup' },
    ] },
    { id: 'tomas-quiet-yours', once: true, priority: 20, when: (g) => g.clock.day === 2 && yes(g.flags.tray_done), script: [
      { t: 'Chives on every cup today. Your chives.' },
      { t: "I've told about four hundred people that a wanderer from Spelt carried them down. Two of them were impressed." },
      { t: "Nobody's reading anything on the platform on the Quiet, so they read my chalkboard. I've defended the sprig all morning." },
    ] },
    { id: 'tomas-quiet', once: true, priority: 20, when: (g) => g.clock.day === 2 && no(g.flags.tray_done), script: [
      { t: 'Chives on every cup today. On the Quiet the hall cuts small, so Amadou sends them down from the herb shop.' },
      { t: 'Somebody carries the tray. Somebody always does. I never find out who until they ask for a cup.' },
    ] },
    { id: 'tomas-booking', once: true, priority: 20, when: { day: 3 }, script: [
      { t: "Chervil today. The drum's own herb, cut this morning for every ring counter in the drum at once." },
      { t: 'Every Booking Day somebody from Sorrel tells me chervil tastes of nothing. Then they have a second cup to make sure.' },
    ] },
    { id: 'tomas-d1', when: { day: 1 }, script: [{ t: 'Lid stays on the cup. Heliox wants your broth cold before you do.' }] },
    { id: 'tomas-d2', when: { day: 2 }, script: [{ t: 'Chives. Cut small. Still a sprig.' }] },
    { id: 'tomas-d3', when: { day: 3 }, script: [{ t: "Chervil, and the feast at one. Don't fill up on broth." }] },
    { id: 'tomas-d4', when: (g) => g.clock.day >= 4, script: [{ t: "Back to whatever the hall cut. It's a surprise to me too." }] },
  ],

  // ------------------------------------------------------------------ Agathe, Keeper of the Ledger
  agathe: [
    { id: 'agathe-reading', priority: 90, when: { day: 3, hours: [8.5, 9.5] }, script: [
      { t: 'Later, wanderer. I am in the Ms, and the Ms are long this year.' },
    ] },
    { id: 'agathe-before', once: true, priority: 40, when: { day: 3, hours: [7, 8.5] }, script: [
      { t: 'Thirty years, and I still do not eat before the reading. The names come without a card, and my hands want something to hold.' },
      { t: 'Nobody could read them all. I read for an hour, and the board scrolls the rest.' },
      { t: 'I am not nervous. I have simply checked the bell three times.' },
    ] },
    { id: 'agathe-after', once: true, priority: 40, when: (g) => g.clock.day === 3 && g.clock.hours >= 9.5 && no(g.inv.has('ledger-slip')), script: [
      { t: 'There. Done for another year. My voice went up half a tone in the middle, and in this air nobody noticed.' },
      { t: 'The Margin line read twenty-nine thousand down, and twenty thousand of that is refuge. They cheered. They always cheer the refuge.' },
      { t: "Here. The morning's figures, printed small for guests. You are one of the four hundred and ten thousand." },
      { give: 'ledger-slip' }, { found: 'refuge' },
      { t: 'Now I am going to sit down and eat something, and nobody is to ask me a name until tomorrow.' },
    ] },
    { id: 'agathe-first', once: true, priority: 30, script: [
      { t: 'You have read the board. I can tell by the neck. Everybody tilts the same way at the names.' },
      { t: 'Agathe. I keep it. Ask me something the board cannot answer.' },
    ].concat(AGATHE_ASK) },
    { id: 'agathe-quiet', once: true, priority: 20, when: { day: 2 }, script: [
      { t: 'On the Quiet the board stays lit and I sit with it. It is not a world. It is a wall with numbers on.' },
      { t: "I walk through tomorrow's names in my head, from the As. By the time the lamps fade I have usually reached the Fs." },
    ] },
    { id: 'agathe-ask', priority: 5, when: (g) => no(g.flags.asked_margin) || no(g.flags.asked_marit), script: [
      { t: 'Another question. Good. The board is patient, and so am I.' },
    ].concat(AGATHE_ASK) },
    { id: 'agathe-d1', when: { day: 1 }, script: [{ t: 'Sit a while. Most people read the people line twice.' }] },
    { id: 'agathe-d2', when: { day: 2 }, script: [{ t: 'Quiet day. The board does not mind.' }] },
    { id: 'agathe-d3', when: { day: 3 }, script: [{ t: 'Booking Day. I have rung the bell once already, to be sure it still works.' }] },
    { id: 'agathe-d4', when: (g) => g.clock.day >= 4, script: [{ t: "A new year on the board. The born line went back to nothing at midnight, and it's already in the thousands." }] },
  ],

  // ------------------------------------------------------------------ Noor, the Gate
  noor: [
    { id: 'noor-first', once: true, priority: 30, script: [
      { t: 'Spelt. I read your crock when you came off the car. One finger, twelve minutes. You looked very patient.' },
      { t: "Clean. Pell's mother, this year's. Two hundred and thirteen drums in one spoon." },
      { t: 'The sequencer wanted a second look. Not because anything was wrong. There was just a great deal of it.' },
      { t: "Every one of those spoons is on file. If Marit's crock ever dies, the library grows it back. She'd sulk for a week anyway." },
      { found: 'starter-file' },
    ] },
    { id: 'noor-phage', once: true, priority: 10, script: [
      { t: 'Our protein comes out of vats, one line to a vat. Cheap and good, and every cell in a line the same.' },
      { t: 'A virus that likes one line can take the whole line. In a drum fed by vats, a phage is a famine.' },
      { t: "So anything alive comes past this glass. Crates, cuttings, starters, and once a child's pocket of soil from Tansy." },
      { t: 'A starter can carry a sleeping prophage. Harmless in your kitchen. Not harmless in a vat.' },
      { found: 'phage' }, { custom: 'The Gate' },
    ] },
    { id: 'noor-quiet', once: true, priority: 20, when: { day: 2 }, script: [
      { t: "The sequencer doesn't keep the Quiet. It isn't a world. It's a door." },
      { t: 'The crates still come. Tansy picks its strawberries whether we are talking or not.' },
    ] },
    { id: 'noor-booking', once: true, priority: 20, when: { day: 3 }, script: [
      { t: 'Quietest morning of my year. Nothing alive wants to arrive on Booking Day except people.' },
      { t: "And people I don't sequence. I've asked." },
    ] },
    { id: 'noor-d1', when: { day: 1 }, script: [{ t: 'One finger. Then you can go.' }] },
    { id: 'noor-d2', when: { day: 2 }, script: [{ t: "Still here. The glass doesn't go dark either." }] },
    { id: 'noor-d3', when: { day: 3 }, script: [{ t: "Go up and eat. I'll be up for the apple." }] },
    { id: 'noor-d4', when: (g) => g.clock.day >= 4, script: [{ t: "Safe glide. Anything alive you carry out, Spelt's Gate will read too." }] },
  ],

  // ------------------------------------------------------------------ Hollis, from Rue
  hollis: [
    { id: 'hollis-tea', once: true, priority: 25, when: (g) => g.clock.day === 3 && g.clock.hours >= 9.5 && yes(g.flags.tea_for_rue), script: [
      { t: 'Spelt. You brought the tea. Yusra wrote it down. Thank you.' },
      { t: 'Every year somebody brings it, and every year it is somebody different.' },
      { t: 'This year it was a guest from a maker drum. Yusra says that is the most Chervil thing she has seen all week.' },
    ] },
    { id: 'hollis-notea', once: true, priority: 25, when: (g) => g.clock.day === 3 && g.clock.hours >= 9.5 && no(g.flags.tea_for_rue), script: [
      { t: 'Somebody brought us tea again. Every year, and never the same person. We have never once had to fetch it.' },
      { t: 'We write it down. I am not sure Rue knows which column to put it in.' },
    ] },
    { id: 'hollis-first', once: true, priority: 30, script: [
      { t: 'Hollis, from Rue. My colleague asks the hard questions. I hold the tea.' },
      { t: 'We came over for Booking Day, a few days early, and we read the Ledger every morning we are here.' },
      { t: 'At home the board on the platform says Count. People against shares, births licensed. You read it like a bill.' },
      { t: 'Rue is about fourteen years from par. When we get there, some of us would like to stop a little under it.' },
      { found: 'rue-notebooks' }, { thread: 'ledger', step: 3 }, { custom: 'The Count' },
    ] },
    { id: 'hollis-third', once: true, priority: 10, script: [
      { t: 'Look at the third-child line. One family in nine at the Count. One in seven now.' },
      { t: 'Some of that is room. The rest is blocks saying yes when they have no room. About nine thousand a year.' },
      { t: 'I say it kindly. I would like Rue to know what a Margin costs to keep. Making one is the part we would be good at.' },
      { found: 'third-line' },
    ] },
    { id: 'hollis-quiet', once: true, priority: 20, when: { day: 2 }, script: [
      { t: 'No worlds today, so Yusra has taken my pencil and I have nothing to do but talk to you.' },
      { t: 'It is a good custom. Rue might manage it. We would need a feast to save for first.' },
    ] },
    { id: 'hollis-back', once: true, priority: 20, when: { day: 3, hours: [6, 9.5] }, script: [
      { t: 'We stand at the back. It is the polite place, and you can see every face in the hall from there.' },
      { t: 'That is what we really write down. Not the numbers. The faces when the Margin line comes up.' },
    ] },
    { id: 'hollis-d1', when: { day: 1 }, script: [{ t: 'Read it slowly. It reads better slowly.' }] },
    { id: 'hollis-d2', when: { day: 2 }, script: [{ t: 'Talk is free on the Quiet. Sit down.' }] },
    { id: 'hollis-d3', when: { day: 3 }, script: [{ t: 'Sun or hall fund. I am glad it is not my vote.' }] },
    { id: 'hollis-d4', when: (g) => g.clock.day >= 4, script: [{ t: 'Home on the morning glide. Two hops, and a change at Sorrel.' }] },
  ],

  // ------------------------------------------------------------------ Yusra, from Rue
  yusra: [
    { id: 'yusra-first', once: true, priority: 30, script: [
      { t: "Yusra Kell, from Rue. I'm asking everyone the same thing, so I will ask you." },
      { t: 'What did the Margin cost, the year they made it?' },
      { choice: [
        { t: 'A few years with no births.', go: 'years' },
        { t: "Nothing. It's cheap to keep.", go: 'cheap' },
        { t: "I'm from Spelt. I don't know.", go: 'dunno' },
      ] },
      { label: 'years' },
      { t: 'Yes. Three or four years with no babies on the board. About six million people who were never born.' },
      { t: 'Everyone here says it was worth it. Nobody here was alive to be asked.' },
      { go: 'page' },
      { label: 'cheap' },
      { t: 'To keep, yes. Births follow deaths and it costs nothing a year. That is what Chervil says, and it is true.' },
      { t: 'I asked what it cost to make.' },
      { go: 'page' },
      { label: 'dunno' },
      { t: 'That is the most honest answer I have had this week. A cook told me it cost a dinner.' },
      { label: 'page' },
      { t: 'Here. I have written it out so often I can spare a page.' },
      { give: 'notebook-page' }, { found: 'rue-notebooks' }, { thread: 'ledger', step: 3 },
      { t: 'Ask somebody old. And ask who said no. Somebody always does.' },
    ] },
    { id: 'yusra-envy', once: true, priority: 10, script: [
      { t: 'Rue counted after a blight took two vat lines. We cooked blight food so long we got good at it.' },
      { t: 'The Blight Kitchen at our Ring 1 says it will keep the menu when we reach par. I believe them.' },
      { t: "I'm envious of your Margin, wanderer. Not yours, I know. I'd say it to Agathe too. I have said it to Agathe." },
    ] },
    { id: 'yusra-quiet', once: true, priority: 20, when: { day: 2 }, script: [
      { t: 'The Quiet suits a councillor. Nobody can message me to ask how it is going.' },
      { t: 'I have Hollis\'s pencil and my own. Between them I have written down eleven conversations and one argument.' },
    ] },
    { id: 'yusra-cheer', once: true, priority: 20, when: { day: 3, hours: [9.5, 17] }, script: [
      { t: 'They cheered a line that went down. Twenty thousand refuge, and they cheered.' },
      { t: 'In Rue a room would have gone quiet. I would like to know what it takes to make people cheer that.' },
    ] },
    { id: 'yusra-vote', once: true, priority: 20, when: { day: 3, hours: [17, 24] }, script: [
      { t: 'Hall fund, by four points. I had it at six. I shall be cross about those two points all the way to Sorrel.' },
    ] },
    { id: 'yusra-d1', when: { day: 1 }, script: [{ t: 'Still asking. Still writing.' }] },
    { id: 'yusra-d2', when: { day: 2 }, script: [{ t: 'Sit. It is the Quiet. People sit.' }] },
    { id: 'yusra-d3', when: { day: 3 }, script: [{ t: 'Ask me afterwards. I will have more to say and fewer pages.' }] },
    { id: 'yusra-d4', when: (g) => g.clock.day >= 4, script: [{ t: 'I will send you the notes on paper, from Rue. It will cost me a quarter of a kay, and I will mean it.' }] },
  ],

  // ------------------------------------------------------------------ Mags, felt-hanger from Sorrel
  mags: [
    { id: 'mags-first', once: true, priority: 30, script: [
      { t: 'Mind the ladder. Mags, from Sorrel. I hang felt.' },
      { t: 'Clap once in here and listen. That ring off the far end is the room, a hundred and twenty-four metres of it.' },
      { t: 'Heliox carries everything, and a bare hall gives it back twice. By the feast it will be as dead as a cupboard.' },
      { t: 'I glide over most mornings. An hour here pays twice what it pays at home, and the glide costs nothing.' },
      { custom: 'The price of an hour' },
    ] },
    { id: 'mags-manners', once: true, priority: 10, script: [
      { t: "Chervil manners. You'll have had them by now. Where have you slept, have you eaten." },
      { t: 'At home we would ask your deck, Ring and Hour, and know where to put you. Here they put you next to a stranger.' },
      { t: 'In Sorrel, Chervil manners means being kind to a Rue councillor very loudly. They mean well. Mostly they do it well.' },
      { t: "Chervil hires its own first, so I'm the overflow. The overflow pays twice, so I don't complain." },
      { t: "I like them. Don't tell them. They're pleased enough with themselves." },
    ] },
    { id: 'mags-felt', once: true, priority: 20, when: { days: [2, 3] }, script: [
      { t: 'Here. An offcut. Every room I have ever done has a square of it in some wanderer\'s bag.' },
      { give: 'felt-square' },
      { t: 'Put it under a cup on a hard table and you will hear the difference.' },
      { t: 'The Felt Hall at home is hung three layers deep. This one gets one layer, and it will do.' },
    ] },
    { id: 'mags-quiet', once: true, priority: 15, when: { day: 2 }, script: [
      { t: 'Matti at the Long Pipe is up before the court tonight, for playing after ten. I have told him I will hang felt in his shop.' },
      { t: 'For a flute lesson, not kays. I have always wanted to play something longer than my arm.' },
    ] },
    { id: 'mags-booking', once: true, priority: 15, when: { day: 3 }, script: [
      { t: 'Felt is up. Four hundred people at one, and every one of them will hear the person next to them. That is the job.' },
      { t: 'Then Candlewick has asked me to fly with them tonight. I said I would think about it, and said yes before I had.' },
    ] },
    { id: 'mags-d1', when: { day: 1 }, script: [{ t: 'Halfway down the room. Ask me again tomorrow.' }] },
    { id: 'mags-d2', when: { day: 2 }, script: [{ t: 'The Quiet is good for felt. You can hear what is still ringing.' }] },
    { id: 'mags-d3', when: { day: 3 }, script: [{ t: "Eat. I'll be at the end where the felt is newest." }] },
    { id: 'mags-d4', when: (g) => g.clock.day >= 4, script: [{ t: 'Back to Sorrel on the morning glide. Monday it is a school with a stair that rings.' }] },
  ],
};
