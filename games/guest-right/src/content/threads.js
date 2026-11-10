// threads.js: the journal's threads, the small things a guest follows over three days in Chervil.
// Steps are completed by the dialogue scripts and by src/places/story.js (zones, hours, flags).
// Step text is what shows under the compass, so it says plainly where to go.

export const THREADS = [
  // ---------------------------------------------------------------- day one
  {
    id: 'three-nights', title: 'Three nights',
    text: 'Guest-right gives any traveller three nights in a Margin flat and a seat at any hall. Sign in, find the flat, and sleep in it.',
    steps: [
      'Sign the guest book at the guest desk, beside the platform',
      'Take a cab up from the station lift lobby to Candlewick',
      'Find flat 4 on the deck 19 terrace, over Wick Court',
      'Sleep a night in Chervil',
    ],
    later: [3],
  },
  {
    id: 'mother', title: 'A spoon of the mother',
    text: "Pell sent a spoon of this year's mother for Marit Vell, who cooks the Ring 2 hall on Thursdays. \"If any of your wanderers come through Chervil, send them to my table. We'll know the same baker.\"",
    steps: [
      'Find Marit Vell at the long table on Ladle Row. She is at the pass from eleven',
      "Give her Pell's crock",
      'Eat the Thursday ramen at her table, at one',
    ],
  },
  {
    id: 'ledger', title: 'What the Ledger says',
    text: 'The Ledger at Station Ring 2 shows the whole drum in a few lines: shares, people, the Margin, places, births and deaths, guests tonight. And the names, two by two.',
    steps: [
      'Read the Ledger in the Ledger hall at Station Ring 2',
      "Find the name beside Marit Vell's",
      'Ask the Keeper what the Margin is',
      'Find out who the notebooks at the back are for',
    ],
  },
  {
    id: 'sprig', title: "Tomorrow's sprig",
    text: "The ring counter lays a sprig on every cup of broth. On the Quiet the hall cuts small, so tomorrow's sprig comes from the herb shop, and somebody has to carry it down.",
    steps: [
      'Carry the tray of chives from the herb shop down to Station Ring 2',
      'Hand it in at the ring counter',
    ],
  },
  {
    id: 'mend', title: 'Shown',
    text: 'Your cuff tore somewhere around leg seven. In Chervil a mend is meant to be seen.',
    steps: [
      'Take your cuff to Wim at the Shown Seam on Thread Street',
      'Have it mended so it shows',
    ],
  },
  {
    id: 'colour', title: 'A colour for Booking Day',
    text: 'Half the block re-dyes a coat for the festival, for about a tenth of a kay. Yours has been grey for eleven legs.',
    steps: ['Choose a festival colour at Fast Colour on Thread Street'],
  },
  {
    id: 'flute', title: 'One metre twenty',
    text: 'A heliox flute has to be about 1.2 metres long to play the old notes. Matti measures a beginner before he lets them choose.',
    steps: ['Stand at the measuring board in the Long Pipe on Thread Street'],
  },
  {
    id: 'spinball', title: 'Bring it back scuffed',
    text: 'The toy library lends everything and mends it between borrowers. A spinball that comes back clean has not been used.',
    steps: [
      'Borrow a spinball from the toy library on Ladle Row',
      "Throw it in the school's long hall",
      'Bring it back to Ros, scuffed',
    ],
  },
  {
    id: 'whose-dawn', title: 'Whose dawn',
    text: "Booking Day's dawn is Oona's, a year in the making. It begins with the brown-violet of the River, which she saw once, at eight, and has been painting ever since.",
    steps: [
      'Find Oona at the lamp-painting studio on Wick Court',
      "Fetch the jar with Marit's writing on it from Oona's flat, deck 17",
      'Turn the mortar while she grinds it',
    ],
  },
  {
    id: 'letter-room', title: 'Measured twice',
    text: "Jory keeps the letter room on Wick Court, where letters from across the Shade are read aloud once and then they have been read.",
    steps: [
      'Meet Jory in the letter room',
      'Hear a long letter read aloud',
      'Find out what Jory has measured',
    ],
  },

  // ---------------------------------------------------------------- day two, the Quiet
  {
    id: 'feast-ready', title: 'Grown before it is eaten',
    text: "The feast was grown and brewed over six weeks, so the drum's water would not warm by tens of degrees in a day. What is left for the Quiet is the carrying.",
    steps: [
      'Ask Marit what the feast still needs',
      "Collect the hall's apples from Dagny at the lake pavilion in the Hollow",
      'Bring the crate down to the hall kitchen',
      'Lay four hundred places with Clem',
    ],
  },
  {
    id: 'middle', title: 'In the middle',
    text: 'Oona runs her dawn on the model Hollow all through the Quiet. Something in the middle is wrong, and she would like to know what you think.',
    steps: [
      'Watch Oona run her dawn on the model',
      'Tell her what you think of the middle',
      'Ask Suvi why that was the wrong answer',
    ],
  },
  {
    id: 'leave', title: 'Out loud, in minutes',
    text: "The block court sits in Wick Court at seven on the Quiet. Nell and Arturo Okonjo have asked the block's leave for a third child.",
    steps: [
      'Be in Wick Court at seven on the Quiet',
      'Hear the court give its answer',
    ],
  },
  {
    id: 'going-home', title: 'Thirty-seven seconds',
    text: 'Ama is from Dulse, on the far side of Merrow, thirty-seven light-seconds from here. You are one leg from home.',
    steps: [
      'Find Ama, the wanderer from Dulse',
      'Talk with her about going home',
    ],
  },

  // ---------------------------------------------------------------- day three, Booking Day
  {
    id: 'booking-day', title: 'Booking Day',
    text: "The beam is booked, the Ledger is read, one question is voted on, and the Quiet's savings become a feast in every hall. That night the Spindle opens end to end.",
    steps: [
      'Be on the back terraces of the Hollow for the dawn at six',
      'Hear the Ledger read at Station Ring 2, at half past eight',
      'Hear the question put, at ten',
      'Help carry at the feast in the hall, at one',
      'Hear the vote come in, at five',
      'Fly the Long Flight, from ten at night',
    ],
  },
  {
    id: 'card-home', title: 'A card from every row',
    text: 'One card home from every row, sent by light and postmarked with the delay. Spelt is 23.7 seconds away.',
    steps: ['Write your card home to Pell'],
  },
];
