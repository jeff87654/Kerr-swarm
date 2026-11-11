// Props and words for the inn of guest-right beds (lots_baths_inn.js).
import { defineProp } from '../world/props.js';
import { shadeHex, mixHex, Rng, hashStr } from '../core/util.js';

export const innParts = true;

// A narrow guest bed, head toward -z. p: { frame, sheet, cover, quilt: [colours], mend }
defineProp('lots-baths.inn-bed', (g, p) => {
  const w = 0.92, l = 2.0, hw = w / 2, hl = l / 2, fr = p.frame || '#6b4a2f';
  g.mat('wood', fr, { rough: -0.05 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (hw - 0.04) - 0.03, 0, sz * (hl - 0.04) - 0.03, sx * (hw - 0.04) + 0.03, 0.3, sz * (hl - 0.04) + 0.03, { bevel: 0.006 });
  g.box(-hw, 0.18, -hl, -hw + 0.04, 0.3, hl, { bevel: 0.006 }); g.box(hw - 0.04, 0.18, -hl, hw, 0.3, hl, { bevel: 0.006 });
  g.box(-hw - 0.03, 0, -hl - 0.05, hw + 0.03, 0.96, -hl + 0.005, { bevel: 0.012 });
  g.mat('wood', shadeHex(fr, 1.2)); g.box(-hw + 0.08, 0.5, -hl + 0.005, hw - 0.08, 0.86, -hl + 0.02, { bevel: 0.008 });
  g.mat('wood', fr); g.box(-hw - 0.03, 0, hl - 0.01, hw + 0.03, 0.55, hl + 0.04, { bevel: 0.01 });
  g.mat('weave', p.sheet || '#ece4d2'); g.box(-hw + 0.03, 0.3, -hl + 0.03, hw - 0.03, 0.48, hl - 0.04, { bevel: 0.04 });
  g.mat('weave', '#f3eee3'); g.box(-hw + 0.09, 0.47, -hl + 0.06, hw - 0.09, 0.6, -hl + 0.42, { bevel: 0.05 });
  const cv = p.cover || '#8a2f3c';
  g.mat('knit', cv); g.box(-hw + 0.005, 0.48, -hl + 0.55, hw - 0.005, 0.51, hl - 0.03, { bevel: 0.012 });
  g.box(-hw - 0.012, 0.24, -hl + 0.55, -hw + 0.005, 0.5, hl - 0.03); g.box(hw - 0.005, 0.24, -hl + 0.55, hw + 0.012, 0.5, hl - 0.03);
  g.mat('weave', p.sheet || '#ece4d2'); g.box(-hw, 0.485, -hl + 0.5, hw, 0.525, -hl + 0.63, { bevel: 0.015 });
  if (p.quilt) {
    const q = p.quilt, z0 = hl - 0.55, z1 = hl - 0.1;
    for (let i = 0; i < 3; i++) { g.mat('weave', q[i % q.length]); g.box(-hw + 0.07, 0.51 + i * 0.03, z0, hw - 0.07, 0.54 + i * 0.03, z1, { bevel: 0.012 }); }
    g.mat('weave', p.mend || '#e9c46a'); g.box(-0.05, 0.6, z0 + 0.1, 0.05, 0.604, z0 + 0.12, { faces: 'Y' }); g.box(-0.01, 0.6, z0 + 0.05, 0.01, 0.604, z0 + 0.17, { faces: 'Y' });
  }
  return { solid: [[-hw - 0.03, 0, -hl - 0.05, hw + 0.03, 0.55, hl + 0.04]], spots: [{ type: 'bed', x: 0, y: 0.5, z: 0.12, yaw: 0 }], tier: 's' };
});

// The key board: a wooden board on the wall (wall at z = 0) with rows of brass hooks; a key on a coloured wooden tab
// hangs on the hooks of the rooms still free. p: { cols, rows, seed, wood }
defineProp('lots-baths.inn-keys', (g, p) => {
  const cols = p.cols || 6, rows = p.rows || 4, cw = 0.2, rh = 0.22, W = cols * cw + 0.16, H = rows * rh + 0.2, r = new Rng(hashStr('keys' + (p.seed || 0)));
  const wood = p.wood || '#5a3d28';
  g.mat('wood', wood); g.box(-W / 2, 0, 0, W / 2, H, 0.03, { bevel: 0.008 });
  g.mat('wood', shadeHex(wood, 0.7)); g.box(-W / 2 - 0.03, H - 0.02, 0, W / 2 + 0.03, H + 0.05, 0.05, { bevel: 0.01 }); g.box(-W / 2 - 0.02, -0.04, 0, W / 2 + 0.02, 0.02, 0.045, { bevel: 0.008 });
  const tabs = ['#c9552e', '#2f6f73', '#d6a640', '#33407a', '#8a2f3c', '#6b7a3a'];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = -W / 2 + 0.08 + cw * (i + 0.5), y = H - 0.14 - j * rh;
    g.mat('cast', '#b8913f', { rough: -0.2 }); g.tube([[x, y, 0.03], [x, y, 0.07], [x, y + 0.02, 0.08]], 0.005, { segs: 4 });
    g.mat('paint', '#efe4cc'); g.box(x - 0.03, y + 0.035, 0.03, x + 0.03, y + 0.065, 0.034, { faces: 'Z' });
    if (r.chance(0.55)) {
      g.mat('cast', '#c4a05a', { rough: -0.25 }); g.tube([[x, y, 0.072], [x, y - 0.07, 0.074]], 0.006, { segs: 4 }); g.box(x - 0.008, y - 0.1, 0.068, x + 0.012, y - 0.075, 0.078);
      g.mat('wood', tabs[(i + j * 2) % tabs.length]); g.box(x - 0.025, y - 0.2, 0.066, x + 0.025, y - 0.1, 0.082, { bevel: 0.008 });
    }
  }
  return { cast: false, tier: 'd' };
});

// The book on its stand: a turned post, a sloping top, the book open, a pencil on a string. Front (the reader) toward +z.
defineProp('lots-baths.inn-lectern', (g, p) => {
  const wood = p.wood || '#5a3d28';
  g.mat('wood', wood, { rough: -0.05 });
  g.box(-0.24, 0, -0.2, 0.24, 0.05, 0.2, { bevel: 0.012 });
  g.lathe(0, 0, [[0.05, 0.05], [0.04, 0.1], [0.035, 0.95], [0.05, 1.0]], { segs: 10 });
  g.push(); g.move(0, 1.04, 0); g.rotX(0.38);
  g.mat('wood', wood); g.box(-0.3, -0.03, -0.22, 0.3, 0.0, 0.22, { bevel: 0.01 });
  g.box(-0.3, 0.0, 0.2, 0.3, 0.03, 0.22, { bevel: 0.004 });
  g.mat('weave', p.cover || '#8a2f3c'); g.box(-0.27, 0.0, -0.18, 0.27, 0.012, 0.18, { bevel: 0.004 });
  g.mat('paper', '#f3ead6'); g.box(-0.255, 0.012, -0.165, -0.01, 0.03, 0.165, { bevel: 0.006 }); g.box(0.01, 0.012, -0.165, 0.255, 0.03, 0.165, { bevel: 0.006 });
  g.mat('paint', '#3a3028'); for (let i = 0; i < 9; i++) { g.box(0.03, 0.031, -0.14 + i * 0.03, 0.2 - (i % 3) * 0.03, 0.032, -0.135 + i * 0.03, { faces: 'Y' }); g.box(-0.23, 0.031, -0.14 + i * 0.03, -0.05 - (i % 4) * 0.025, 0.032, -0.135 + i * 0.03, { faces: 'Y' }); }
  g.mat('wood', '#d9a441'); g.tube([[0.28, 0.035, -0.05], [0.28, 0.035, 0.1]], 0.006, { segs: 5 });
  g.pop();
  g.mat('weave', '#d8cdb8'); g.tube([[0.3, 1.0, 0.02], [0.33, 0.8, 0.06], [0.31, 0.95, 0.12]], 0.002, { segs: 3 });
  return { solid: [[-0.3, 0, -0.24, 0.3, 1.15, 0.24]], tier: 's' };
});

// A row of three pegs on the wall (wall at z = 0), a coat on the first, a bag on the last. p: { coat, bag, wood }
defineProp('lots-baths.inn-hook', (g, p) => {
  const wood = p.wood || '#5a3d28';
  g.mat('wood', wood); g.box(-0.32, 1.6, 0, 0.32, 1.7, 0.025, { bevel: 0.008 });
  for (const x of [-0.22, 0, 0.22]) g.tube([[x, 1.64, 0.025], [x, 1.66, 0.1], [x, 1.69, 0.12]], 0.012, { segs: 5 });
  if (p.coat) {
    g.mat('weave', p.coat); g.sheet([-0.42, 1.66, 0.06], [-0.02, 1.66, 0.06], [0.0, 0.62, 0.14], [-0.44, 0.62, 0.14], { nu: 4, nv: 5, ripple: 0.02, rippleN: 4 });
    g.mat('weave', p.lining || '#e9c46a'); g.box(-0.3, 1.58, 0.05, -0.14, 1.68, 0.09, { bevel: 0.02 });
    g.mat('weave', p.mend || '#d4553a'); g.box(-0.36, 0.95, 0.105, -0.26, 1.02, 0.112, { faces: 'Z' });
  }
  if (p.bag) {
    g.mat('weave', p.bag); g.box(0.12, 1.12, 0.06, 0.34, 1.42, 0.18, { bevel: 0.05 });
    g.tube([[0.15, 1.42, 0.12], [0.22, 1.66, 0.12], [0.31, 1.42, 0.12]], 0.008, { segs: 4 });
  }
  return { cast: false, tier: 'd' };
});

// A settle with cushions, for the parlour. p: { w, wood, cloth, back }
defineProp('lots-baths.inn-sofa', (g, p) => {
  const w = p.w || 1.7, wood = p.wood || '#5a3d28', cl = p.cloth || '#8a2f3c';
  g.mat('wood', wood);
  g.box(-w / 2, 0, -0.34, w / 2, 0.28, 0.34, { bevel: 0.015, aoBottom: 0.6 });
  for (const sx of [-1, 1]) g.box(sx * w / 2 - 0.06, 0, -0.36, sx * w / 2 + 0.06, 0.66, 0.36, { bevel: 0.02 });
  g.box(-w / 2, 0.28, -0.36, w / 2, 0.92, -0.26, { bevel: 0.015 });
  const n = Math.max(2, Math.round(w / 0.62));
  for (let i = 0; i < n; i++) {
    const x0 = -w / 2 + 0.02 + i * (w - 0.04) / n, x1 = x0 + (w - 0.04) / n - 0.02, c = i % 2 ? shadeHex(cl, 1.15) : cl;
    g.mat(p.mat || 'weave', c); g.box(x0, 0.28, -0.26, x1, 0.44, 0.32, { bevel: 0.05 });
    g.mat('weave', mixHex(c, '#e9c46a', 0.4)); g.box(x0 + 0.03, 0.42, -0.27, x1 - 0.03, 0.82, -0.12, { bevel: 0.06 });
  }
  const spots = []; for (let i = 0; i < n; i++) spots.push({ type: 'sit', x: -w / 2 + (i + 0.5) * w / n, y: 0.44, z: 0.06, yaw: 0 });
  return { solid: [[-w / 2 - 0.06, 0, -0.36, w / 2 + 0.06, 0.44, 0.36]], spots, tier: 's' };
});

// ---------------------------------------------------------------------------------------------------------------
// palettes and names
// ---------------------------------------------------------------------------------------------------------------
export const INN_PAL = [
  { wall: '#ead9bd', dado: '#8a2f3c', trim: '#3a2a20', accent: '#d6a640', floor: '#a8794f', felt: ['#8a2f3c', '#d6a640', '#2f6f73', '#33407a'], sign: ['#3a2a20', '#f3e6c8', '#d6a640'] },
  { wall: '#e7dcc4', dado: '#2f6f73', trim: '#1d3b38', accent: '#c9552e', floor: '#9a6a42', felt: ['#2f6f73', '#c9552e', '#e0b04a', '#5b3a6e'], sign: ['#1d3b38', '#f1ead6', '#e8a24a'] },
  { wall: '#f0e0c8', dado: '#5b3a6e', trim: '#2e2238', accent: '#e8c26a', floor: '#b98a5a', felt: ['#5b3a6e', '#e8c26a', '#a8412b', '#2f6f73'], sign: ['#2e2238', '#f2e3cf', '#e8c26a'] },
  { wall: '#e9dcc0', dado: '#6b7a3a', trim: '#33401f', accent: '#c9552e', floor: '#a8794f', felt: ['#6b7a3a', '#c9552e', '#d6a640', '#33407a'], sign: ['#33401f', '#f3e9cf', '#d6a640'] },
  { wall: '#efdcc6', dado: '#33407a', trim: '#1f2648', accent: '#d4553a', floor: '#9a6a42', felt: ['#33407a', '#d4553a', '#d9a441', '#6fa898'], sign: ['#1f2648', '#f1ead6', '#e0b04a'] },
];
export const INN_NAMES = ['THE OPEN LID', 'THE LONG SPOON', 'THE WARM SHELF', 'THE SECOND POT', 'THE KETTLE', 'THREE NIGHTS', 'THE LADLE REST', 'THE BREAD BOARD', 'THE SPARE BOWL', 'THE TEA TOWEL', 'THE STOCKPOT', 'PEG AND PILLOW'];
export const KEEPERS = ['Ilse', 'Tomasz', 'Amara', 'Kofi', 'Wen', 'Ruth', 'Bashir', 'Noor', 'Teodor', 'Yusra', 'Hamid', 'Lise', 'Odile', 'Sami'];

// ---------------------------------------------------------------------------------------------------------------
// what people say and what the cards read (four or more of each, chosen by the lot's seed)
// ---------------------------------------------------------------------------------------------------------------
export const GREET = [
  ['Where have you slept, and have you eaten. In that order. Then the book.'],
  ['A guest. Good. Sign the book, take a key off the board, and the long table is yours whenever you want it.'],
  ['Three nights on guest-right, and nobody here will ask you for a kay. Sit down before you sign anything.'],
  ['You have the look of somebody eleven legs into a wander year. The kettle is on the loop. Sign when you are warm.'],
  ['Come in. Shoes by the bench if they are wet from the baths, keys on the board, names in the book.'],
];
export const GUEST_RIGHT = [
  ['Any traveller from a drum that grants the same gets three nights in a Margin bed and a seat at any hall.', 'The beds are the drum\'s. Chervil runs three per cent under par on purpose and keeps rooms empty for people like you.'],
  ['Three nights, a bed, a hook and a lamp. Eat at any hall in Chervil and nobody will look at your wallet.', 'The fourth night you stay as long as you cook. Most guests find they like cooking.'],
  ['About four hundred thousand guests in the drum on a Booking Day. Some years eleven of them sleep here.', 'Guest-right goes both ways. When you are home, somebody from here will sleep in your drum\'s spare bed.'],
  ['It is not charity. The assembly kept the gap after the Count and called it the Margin. You are what the gap is for.', 'Three nights. Then you cook, or you go on with a full stomach. Both are fine.'],
  ['The rule is short. Three nights, a seat at any hall, and you leave the bed as you found it.', 'The children will ask which drum you are from. Tell them the row as well. They keep a board.'],
];
export const KEY_LINES = [
  ['Any key with a tab on it is a free room. Take the one nearest the washroom if you sleep late.'],
  ['Number by the stair is quiet. Number by the hot shelf is warm. Choose.'],
  ['The keys are older than me. The tabs get repainted every Knotnight, whichever colour is left over.'],
  ['Take any free key. If you lose it, the menders will make another and charge you a story.'],
];
export const RULES = [
  ['Three nights on guest-right', 'Sign the book, take a key', 'Lids on at the long table', 'Quiet on the gallery after eleven', 'The fourth night, you cook'],
  ['Guests from any drum that grants the same', 'Beds aired at ten', 'Showers on the loop: be quick', 'Leave something on the shelf if you like', 'Take nothing but a cup'],
  ['Three nights, no kays', 'Children may ask where you are from', 'Keys back on the board', 'Lamps fade at eleven', 'Eat at any hall: they know'],
  ['Sign in. Nobody signs out', 'Hooks are for coats, the shelf is for gifts', 'Cups back to the hot shelf', 'Mend what you tear', 'Stay longer and you cook'],
];
export const SHELF = [
  'A spoon of starter in a stoppered jar, with a card: "From Spelt. Feed it on Thursdays and it will outlive you."',
  'A glove with its thumb remade in orange thread: "Found the other one in Rue. Keep this until I come back for it."',
  'A card home, written and never sent: "Postmark it with the delay, whoever finds it. I lost my nerve at the quay."',
  'A wooden spinball worn smooth: "For any child here who throws anti."',
  'A twist of dried herbs: "Bring herbs, not gin. I brought both. The gin did not last."',
  'Half a tin of Tansy tea: "Strong. Use half as much as you think."',
  'Two hand lamps, the switches mended with wire: "For the Long Flight. Bring them back after, or do not."',
  'A pencil map of Herb Row with every drum ticked but one: "Next year."',
  'A cup cosy knitted in four colours: "Lids are for the food. This is for your hands."',
  'A ribbon off a naming gift: "My niece in Lovage has my great-aunt\'s share now. I am the aunt who sleeps in inns."',
];
export const SIGNINGS = [
  'Ottar, Tansy. Brought eggs. They lasted a morning.',
  'Two from Rue, here for the Ledger. Took notes on the Margin.',
  'Mira, Lovage. You all pretend our bread is yours. It is fine.',
  'A family of five from Sorrel. The children chalked the stair at home and wanted to here.',
  'Ines, Kittiwake. Taught the children crosswise turns in the corridor.',
  'Sef, Spelt, wander year. Cooked the fourth night. Burnt the rice.',
];
export const CUPS = [
  'A lidded cup of tea from the urn. The water came up the loop at sixty-five and has been waiting for somebody.',
  'Mill broth in a lidded cup, free. A child hands you a spoon without being asked.',
  'Mint from the herb shop, steeped in loop water. Free, like the bed.',
  'Tea from the urn, in a cup with a gold mend along its rim. The lid does not quite match.',
];
export const TABLE = [
  ['Somebody slides a lidded bowl along to you.', '"Guest. Eat. You can say thank you after."'],
  ['A man from Sorrel opposite is explaining spinball to two children who already know it.', 'They let him finish.'],
  ['Four people at the end are arguing about the Margin, cheerfully, as they did last year.', 'Someone passes you the salt before you ask.'],
  ['A woman lifts her lid, sees it is the Nine, and puts it back.', '"Have some Nine," says her neighbour, and she does.'],
];
export const WAKE = [
  'You wake to the shower running down the corridor and a child asking the keeper where Spelt is.',
  'The lamp was on its slow setting. You slept in a room that has held a thousand guests and remembers none of them.',
  'Somebody has left a lidded cup on the stool by the bed. It is still warm.',
  'The felt on the walls drinks every sound. You wake with the print of the quilt\'s mends on one arm.',
];
export const BOARD = [
  ['A painted board of the rows, a brass pin in every drum a guest has slept here from.', 'Herb Row is thick with pins. Grain Row has three, and one of them is Spelt.'],
  ['The rows of the swarm, painted dark, the drums in gold. Threads run from the pins to Chervil in the middle.', 'Somebody has pinned a drum on a row nobody here has heard of, and written a question mark beside it.'],
  ['A board of drums and rows, with pins. The children keep it. Guests are asked to put their own pin in.', 'Spelt already has a pin. It is bent, as if pushed in by a small and certain thumb.'],
  ['Every drum on the board has a name chalked under it in a child\'s hand.', 'The spelling varies. Spelt is spelt correctly, which seems like luck.'],
];
export const PARLOUR = [
  ['A family from two blocks down is meeting a cousin off the glide here. Nobody has sat down yet.'],
  ['The writing table has a stack of plain cards for cards home, and a pencil chained to it.'],
  ['A child is teaching a guest from Lovage the rule: axis flies true, spin sinks, anti floats.'],
  ['Three aunts and a baby, waiting for the baby\'s guest from Rue. The baby is asleep and does not mind.'],
];
