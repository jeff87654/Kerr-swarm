// items.js: things the player carries or is given over three days in Chervil.
// icon is a short key the UI draws from; from says who hands it over (cast id),
// where there is one.

export const ITEMS = {
  'spelt-mother': {
    name: "A spoon of Spelt's mother",
    desc: "A spoon of this year's raft-loaf mother in a small sealed crock, registered at Spelt's Gate. Pell sent it for Marit: \"We'll know the same baker.\"",
    icon: 'crock', from: 'pell',
  },
  'guest-chit': {
    name: 'Guest chit',
    desc: "Signed at the guest desk: three nights on guest-right, a Margin flat and a seat at any hall. Sefa wrote your drum as Spelt and drew a small loaf beside it.",
    icon: 'chit', from: 'sefa',
  },
  'flat-key': {
    name: 'Flat key',
    desc: "A worn brass tag stamped Candlewick 19 · 4, on a loop of green cord. Hundreds of guests have worn the corners round.",
    icon: 'key', from: 'sefa',
  },
  'herb-sprig': {
    name: 'A sprig from the counter',
    desc: "Coriander from the hall's cuttings, laid on your broth at the ring counter. Too good to eat straight away.",
    icon: 'sprig', from: 'tomas',
  },
  'rice-ball': {
    name: 'Sticky rice ball',
    desc: "Waxy Mill rice pressed round a smear of the Nine, from the ring counter. Still warm.",
    icon: 'riceball', from: 'tomas',
  },
  'hand-lamp': {
    name: 'Hand lamp',
    desc: "A watt or two of warm light with a clip for your collar, lent with the flat. Every flat in Chervil keeps one by the door.",
    icon: 'lamp',
  },
  'wing-sleeves': {
    name: 'Wing-sleeves',
    desc: "Fabric fins from wrist to hip, hired by the turn. Flying along the axis is easy. Across it, aim wide.",
    icon: 'sleeves', from: 'bertil',
  },
  'peg-token': {
    name: 'Peg token',
    desc: "A brass token with a peg number on it. Your shoes are hanging on that peg at the sleeve hire.",
    icon: 'token', from: 'bertil',
  },
  'black-thread': {
    name: 'A black thread',
    desc: "Tied round the left wrist, it means don't message me, I won't see it. On the Quiet the whole drum is dark, and many tie one on anyway.",
    icon: 'thread',
  },
  apple: {
    name: 'Half an orchard apple',
    desc: "Cut crosswise, so the seeds make a five-pointed star. An apple is never for one.",
    icon: 'apple',
  },
  'whole-apple': {
    name: 'An orchard apple',
    desc: "From the Glass Case, 4.4 kays: a fifth of a day's wallet. Meant to be given, and cut crosswise when it is.",
    icon: 'apple', from: 'fausta',
  },
  tomato: {
    name: 'A tomato',
    desc: "About 120 grams of red, half a kay, wrapped in a cloth. Eat it slowly, or cut it into as many pieces as there are people.",
    icon: 'tomato', from: 'fausta',
  },
  'lidded-cup': {
    name: 'Lidded cup',
    desc: "Heliox pulls the heat out of a drink about four times faster than air, so the lid stays on. Return it to any cart in the block.",
    icon: 'cup', from: 'ben',
  },
  brush: {
    name: 'Orchard brush',
    desc: "A soft brush on a short handle, for pollinating apple blossom by hand from a step-ladder. Dagny lent it.",
    icon: 'brush', from: 'dagny',
  },
  spinball: {
    name: 'Spinball',
    desc: "A soft scuffed ball from the toy library. Axis flies true, spin sinks, anti floats.",
    icon: 'ball', from: 'ros',
  },
  card: {
    name: 'A blank card home',
    desc: "One card home from every row, sent by light and postmarked with the delay. The front is blank until you choose a picture.",
    icon: 'card', from: 'jory',
  },
  heel: {
    name: 'A heel of the raft loaf',
    desc: "Pell gives every wanderer a heel for the road. It tastes of everywhere. Yours is nearly gone.",
    icon: 'bread', from: 'pell',
  },
  lid: {
    name: 'A dented lid',
    desc: "A hall lid with a number punched in the rim, older than anyone at the table. Marit says you have earned a lid.",
    icon: 'lid', from: 'marit',
  },
  'lamp-card': {
    name: "One of Oona's test cards",
    desc: "Twelve swatches of lamp colour from brown-violet through rose to gold, with the middle three crossed out in pencil.",
    icon: 'card', from: 'oona',
  },
  'bruise-twist': {
    name: 'A twist of bruise',
    desc: "A pinch of brown-violet pigment in folded paper, ground by Oona to match the River's dusty edges.",
    icon: 'twist', from: 'oona',
  },
  'felt-square': {
    name: 'A square of felt',
    desc: "An offcut from the felt Mags hung in the hall. In heliox a bare room rings; felt stops it.",
    icon: 'cloth', from: 'mags',
  },
  'shown-patch': {
    name: 'A shown patch',
    desc: "Wim stitched over the hole in your cuff in Chervil green thread. It shows on purpose, and now your coat has a chapter from here.",
    icon: 'patch', from: 'wim',
  },
  'lent-crock': {
    name: 'A lent crock',
    desc: "A glazed crock with a lid from the Keeping Room, older than the shop. It goes back.",
    icon: 'crock', from: 'zhenya',
  },
  'host-sprig': {
    name: "A host's sprig",
    desc: "A sprig of chervil tied with green thread, three hundredths of a kay. Bring herbs, not gin.",
    icon: 'sprig', from: 'amadou',
  },
  'gin-glass': {
    name: 'A glass of gin',
    desc: "Chervil gin from the hall, bought after six for 0.18 kays and carried with a lid on. Too cheap to be a gift, unless it was asked for.",
    icon: 'glass',
  },
  'steamed-cake': {
    name: 'Honeycomb steamed cake',
    desc: "From the Dawn Stand, yeast-raised and full of holes, warm through its paper.",
    icon: 'cake', from: 'marisol',
  },
  'ledger-slip': {
    name: 'A Ledger slip',
    desc: "The morning's figures, printed small for guests: 194,060,000 people, a Margin of 5,940,000, about 410,000 guests. One of them is you.",
    icon: 'slip', from: 'agathe',
  },
  'toy-cab': {
    name: 'A wooden cab',
    desc: "From the toy library. Tip it and the little cabin swings level, the way a real one leans against the drum.",
    icon: 'cab', from: 'ros',
  },
  'kite': {
    name: 'A patched kite',
    desc: "Lent by Tavi for one go. Walk backwards and aim it at the far bank.",
    icon: 'kite', from: 'tavi',
  },
  'notebook-page': {
    name: 'A page from a Rue notebook',
    desc: "Yusra tore it out for you: \"Margin. Ask what it cost the year they made it. Ask who said no.\"",
    icon: 'slip', from: 'yusra',
  },
};
