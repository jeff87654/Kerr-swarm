// The thirteen craft trades of the generated city: for each, its colours, its fittings and goods, its work, and what its keeper says.
// lots_shops_craft.js builds the room and calls these with a context C (see there): every position is in the lot's own (u, q)
// coordinates, u along the front from the door side and q inward from the front line, so nothing here knows which way a lot faces.
import { drawTag, drawShears } from './craft_parts.js';
import { drawCrock, drawHandLamp, CLOTH, GLAZES } from './lots_shops_craft_props.js';
import { hsl } from '../core/util.js';

export const craftTrades = true;

// ---------------------------------------------------------------------------------------------------------------
// shared fillers
// ---------------------------------------------------------------------------------------------------------------
// A goods unit of the trade on a wall run, with somebody browsing in front of every other one.
function goodsUnit(C, run, a, i, t) {
  const p = C.pt(run, a, 0.21), y = C.ryaw(run);
  C.propAt('shops-craft.goods', p[0], 0, p[1], y, { t, v: (C.seed + i) % 3, w: 1.3 });
}
// Three coats for the forms in a mender's or second-hand window, each with its mends.
const COATS = [
  { coat: '#26306b', lining: '#d6a640', trim: '#8a2f3c', tag: '#c8402e', long: true, mends: [{ kind: 'patch', c: '#c8402e', a: -0.5, y: 1.38, w: 0.08, h: 0.07 }, { kind: 'darn', c: '#6c9a4c', a: 0.62, y: 1.12, w: 0.06, h: 0.07 }, { kind: 'gold', a: 0.15, y: 1.2, h: 0.2 }] },
  { coat: '#b5653a', lining: '#2f6f8f', trim: '#2a2622', tag: '#2f6f8f', mends: [{ kind: 'patch', c: '#2f6f8f', a: 0.9, y: 1.05, w: 0.07, h: 0.07 }, { kind: 'patch', c: '#2f6f8f', a: -0.9, y: 1.05, w: 0.07, h: 0.07 }, { kind: 'darn', c: '#e9e1cf', a: 0.2, y: 0.98, w: 0.05, h: 0.05 }] },
  { coat: '#2f4a3a', lining: '#c8402e', trim: '#1d2a22', tag: '#e0b040', mends: [{ kind: 'gold', a: -0.25, y: 1.25, h: 0.42 }, { kind: 'gold', a: 0.35, y: 1.38, h: 0.12 }, { kind: 'patch', c: '#e0b040', a: 0.7, y: 1.18, w: 0.06, h: 0.05, stitch: '#c8402e' }] },
  { coat: '#8a2f3c', lining: '#e9e1cf', trim: '#2a2622', tag: '#d6a640', head: true, mends: [{ kind: 'darn', c: '#d6a640', a: -0.3, y: 1.3, w: 0.07, h: 0.06 }, { kind: 'patch', c: '#26306b', a: 0.5, y: 1.0, w: 0.09, h: 0.08 }] },
];
function coatForm(C, u, q, k, yaw, extra) { const c = COATS[k % COATS.length]; C.prop('craft.form', u, C.SY, q, yaw, Object.assign({ coat: c.coat, lining: c.lining, trim: c.trim, mends: c.mends, tag: c.tag, long: !!c.long, head: !!c.head }, extra || {})); }
// stage items spaced along its length: returns the u of each
function along(a, n, pad) { const out = []; const L = a.u1 - a.u0 - 2 * pad; for (let i = 0; i < n; i++) out.push(a.u0 + pad + (n === 1 ? L / 2 : L * i / (n - 1))); return out; }
const mid = (a) => (a.q0 + a.q1) / 2;

// ---------------------------------------------------------------------------------------------------------------
// the trades
// ---------------------------------------------------------------------------------------------------------------
export const TRADE = {
  // ---------------------------------------------------------------------------------------------------- mender
  mender: {
    tag: 'mend', emblem: 'thread', menu: 'Mending', ambience: 'shop', reverb: 'room',
    pal: { wall: '#e6d6b8', dado: { h: 1.0, mat: 'flute', tint: '#2f5a55' }, floor: ['planks', '#9a6e48'], ceil: '#eadcc2', frame: '#23413d', plinth: '#1b302d', awning: ['#2f5a55', '#e9dcc4'], sign: ['#23413d', '#f3e6c8', '#e0b040'], felt: '#8a2f3c', beam: '#4a3526', pipes: ['#c8402e', '#2f5a55'], rug: ['#8a2f3c', '#d6a640'] },
    stage(C, a, k) {
      const us = along(a, Math.max(1, Math.min(2, Math.floor((a.u1 - a.u0) / 1.3))), 0.55);
      us.forEach((u, i) => coatForm(C, u, mid(a) + 0.05, C.seed + i + k, C.out + C.r.f(-0.3, 0.3)));
      C.prop('craft.basket', a.u1 - 0.3, C.SY, a.q0 + 0.35, C.r.f(0, 3), { cols: ['#26306b', '#d6a640', '#c8402e', '#6c9a4c'] });
      C.bunting(a, 2.62, ['#c8402e', '#e0b040', '#26306b', '#6c9a4c', '#e9e1cf', '#5b4060']);
    },
    unit(C, run, a, i) {
      if (i === 1) { const p = C.pt(run, a, 0.21), y = C.ryaw(run); C.propAt('shops-craft.drawers', p[0], 0, p[1], y, { w: 1.3, h: 0.86, d: 0.42, cols: 4, rows: 3, wood: '#5a3d28' }); const q = C.pt(run, a, 0.04); C.propAt('shops-craft.spools', q[0], 0.97, q[1], y, { w: 1.3, h: 1.15, cols: 13, rows: 7, board: '#3a2a1e', shelf: '#6b4a2f' }); }
      else goodsUnit(C, run, a, i, 'mender');
    },
    work(C, w) { const p = C.pt(w, w.a, 0.26); C.propAt('craft.treadle', p[0], 0, p[1], C.ryaw(w), { thread: '#e0b040', cloth: '#26306b' }, { spot: { tags: ['mend', 'sew'] } }); const st = C.pt(w, w.a + 0.1, 0.85); C.propAt('stool', st[0], 0, st[1], 0, { wood: '#5a3d28' }, { noSpots: true }); if (w.len > 2.6) { const b = C.pt(w, w.a + (w.len / 2 - 0.5) * (C.r.chance(0.5) ? 1 : -1), 0.3); C.propAt('crate', b[0], 0, b[1], 0.4, { w: 0.5, h: 0.32, d: 0.4, wood: '#a8794f' }); } },
    floor(C, f) { C.prop('shops-craft.worktable', f.u, 0, f.q, C.yaw(0, 1), { t: 'mender', w: Math.min(1.8, f.w), d: 0.8, top: '#b08a5a' }); C.spot('work', f.u, f.q + 0.75, C.yaw(0, -1), ['mend']); C.spot('browse', f.u + 0.5, f.q - 0.75, C.yaw(0, 1), ['shop']); },
    back(C, run) { const n = Math.floor((run.a1 - run.a0) / 1.6); const len = Math.min(run.a1 - run.a0 - 0.2, 3.2); const p = C.pt(run, (run.a0 + run.a1) / 2, 0.28); C.propAt('shops-craft.coatrail', p[0], 1.9, p[1], C.ryaw(run), { w: len, v: C.seed % 3, kind: 'coat' }); void n; },
    top(C, t) { C.propAt('shops-craft.buttons', t.x0, 0.92, t.z0, t.yaw + 0.1, {}); C.drawAt(t.x1, 0.92, t.z1, t.yaw, (g) => { g.mat('weave', '#c8402e'); g.ball(0, 0.03, 0, 0.05, 0.035, 0.05, { segs: 10, rings: 6 }); g.mat('paper', '#efe4c8'); g.box(-0.35, 0, -0.12, -0.08, 0.012, 0.14, { bevel: 0.003 }); }); },
    board: { title: 'Mending', lines: ['A shown patch · 3.25', 'A darn · 1.55', 'Gold seam · 6.05', 'Priced in time'] },
    label: { text: 'Offcuts, by colour', lines: ['sold by the gram'] },
    notice: { title: 'Whose coat', lines: ['Every mend', 'here is', 'somebody.'] },
    services: [
      { id: 'patch', name: 'A shown patch', desc: 'Ten grams of offcut and half an hour, stitched in a thread that does not match, so it shows.', price: 3.25, reply: ['Give me the cuff. Something bright, I think. You are in Chervil now.'], toast: 'A patch in a colour that does not match, stitched round in gold. It shows on purpose.' },
      { id: 'darn', name: 'A darn', desc: 'A heel or an elbow, darned in a colour of your choosing. A quarter of an hour.', price: 1.55, reply: ['Sit there. A quarter of an hour, and the hall bell will not have gone.'], toast: 'A darn in green across your elbow, close as weaving.' },
      { id: 'gold', name: 'An old tear picked out in gold', desc: 'An hour of slow stitching, so the mend is the best part of the coat.', price: 6.05, reply: ['An hour. Go and eat; come back when the bell goes.'], toast: 'The tear is sewn in gold. It is the best part of the coat now.' },
    ],
    greet: ['Where did they put you? And have you eaten? Good. Show me what is torn.', 'Come in. Everything on the forms is somebody\'s, and nothing on them is for sale.', 'Mind the basket. Those are waiting to be called for, some of them since the Count.', 'Sit if you like. Mending goes faster with somebody to talk to.'],
    about: [
      ['Look at the seams, not the cloth. Straight little stitches are a machine. Small slanted ones are somebody\'s grandmother.', 'New cloth is twenty-five kays a kilogram. My hour is six. So we mend, and we let it show.'],
      ['A patch in a colour that does not match is somebody who wanted you to know.', 'Every mend gets its year written inside, in pencil, by whoever made it.'],
      ['People bring me their coats before Booking Day. They want the mends seen at the feast.', 'The ones in gold are tears that were bad enough to be proud of.'],
      ['I keep two columns of greys for people who want a mend to whisper.', 'Almost nobody asks for them.'],
    ],
    band: { low: 'Children\'s elbows mostly, down here. A hand\'s width folded into every seam, and I let it out a finger at a time.', middle: 'Work coats, mostly. The cab crews bring theirs in at the end of a shift and fall asleep in that chair.', high: 'Up here the coats are older than the people in them, and the people are old. I mend slowly, and nobody hurries me.' },
    card: { prompt: 'Read the card on a coat', title: 'On the coat', texts: [
      ['Indigo, cut on this street for a lamp fitter, seventy-one years ago.', 'The red patch at the shoulder is her son\'s, from a fall in the Third. The green darns are her granddaughter\'s, who wears it now.'],
      ['Copper, spun cellulose. Made for a boy of nine, let out three times, let down twice, then cut down for his sister\'s child.', 'The blue squares are where two sets of elbows went.'],
      ['Torn on a cab-berth door forty years ago, from the collar to the pocket.', 'Sewn back with gold thread over an hour. A card pinned inside says: a coat should look as if it has been somewhere.'],
      ['Red, with a cream lining that has been replaced four times. Each lining has a name in it.', 'In for the fifth before the feast. The owner wants a name left blank for whoever has it next.'],
    ] },
  },

  // ---------------------------------------------------------------------------------------------------- tailor
  tailor: {
    tag: 'sew', emblem: 'thread', menu: 'Alterations', ambience: 'shop', reverb: 'room',
    pal: { wall: '#ece0c8', dado: { h: 1.05, mat: 'paint', tint: '#26306b' }, floor: ['planks', '#8a6240'], ceil: '#efe4cc', frame: '#1d2440', plinth: '#26306b', awning: ['#26306b', '#e9dcc4'], sign: ['#1d2440', '#f3e6c8', '#c8402e'], felt: '#26306b', beam: '#3a2a1e', pipes: ['#c8402e', '#26306b'], rug: ['#26306b', '#c8402e'] },
    stage(C, a, k) {
      const us = along(a, Math.max(1, Math.min(2, Math.floor((a.u1 - a.u0) / 1.4))), 0.5);
      coatForm(C, us[0], mid(a) + 0.05, C.seed + k + 3, C.out + 0.2, { head: true, long: true });
      if (us.length > 1) C.prop('craft.mirror', us[1], C.SY, mid(a), C.out - 0.5, { wood: '#3a2a1e' });
      C.prop('craft.bolt', (a.u0 + a.u1) / 2, C.SY, a.q0 + 0.3, C.yaw(1, 0) + 0.2, { c: CLOTH[(C.seed + k) % CLOTH.length], len: 0.7, mat: 'stripe' });
    },
    unit(C, run, a, i) { goodsUnit(C, run, a, i, 'tailor'); },
    work(C, w) { const p = C.pt(w, w.a, 0.26); C.propAt('craft.treadle', p[0], 0, p[1], C.ryaw(w), { thread: '#c8402e', cloth: '#d6a640' }, { spot: { tags: ['sew'] } }); if (w.len > 2.4) { const m = C.pt(w, w.a + (w.len / 2 - 0.45) * (C.seed % 2 ? 1 : -1), 0.3); C.propAt('craft.basket', m[0], 0, m[1], C.ryaw(w), { cols: ['#26306b', '#e9e1cf', '#c8402e', '#d6a640'] }); } },
    floor(C, f) { C.prop('shops-craft.worktable', f.u, 0, f.q, C.yaw(0, 1), { t: 'tailor', w: Math.min(1.9, f.w), d: 0.85, top: '#a07850' }); C.spot('work', f.u - 0.3, f.q + 0.75, C.yaw(0, -1), ['sew']); C.spot('browse', f.u + 0.4, f.q - 0.8, C.yaw(0, 1), ['shop']); },
    back(C, run) { const p = C.pt(run, (run.a0 + run.a1) / 2, 0.28); C.propAt('shops-craft.coatrail', p[0], 1.9, p[1], C.ryaw(run), { w: Math.min(run.a1 - run.a0 - 0.2, 3.2), v: C.seed % 3, kind: 'lined' }); },
    top(C, t) { C.propAt('shops-craft.hemtray', t.x0, 0.92, t.z0, t.yaw, { v: C.seed % 2 }); C.drawAt(t.x1, 0.92, t.z1, t.yaw, (g) => { g.mat('weave', '#e0b040'); const tp = []; for (let i = 0; i <= 28; i++) { const an = i / 28 * Math.PI * 6; tp.push([Math.cos(an) * (0.02 + i * 0.0012), 0.004, Math.sin(an) * (0.02 + i * 0.0012)]); } g.tube(tp, 0.004, { segs: 3 }); g.push(); g.move(0.2, 0.002, 0.05); g.rotY(0.8); drawShears(g); g.pop(); }); },
    board: { title: 'Alterations', lines: ['Let out a seam · 6.00', 'Weight a hem · 3.00', 'A name in a lining · 1.50', 'New lining · 17.00'] },
    label: { text: 'Cloth by the bolt', lines: ['cellulose · linen · hemp'] },
    notice: { title: 'Going up', lines: ['Hems weighted', 'for the', 'lighter decks.'] },
    services: [
      { id: 'let-out', name: 'Let out a seam', desc: 'Every seam cut here has a hand\'s width folded in for later. An hour\'s work.', price: 6, reply: ['There is a hand\'s width in every seam I cut. Yours has a finger\'s width. We will find it.'], toast: 'A seam let out. The old stitch line shows, a little darker, like a tide mark.' },
      { id: 'hem', name: 'Weight a hem', desc: 'Brass weights sewn into the hem, so a coat hangs on the lighter decks the way it hangs here. Half an hour.', price: 3, reply: ['Where are you going after us? Up? Then you want weights, or your coat will swim.'], toast: 'Six small brass weights in the hem. The coat hangs as if the deck were heavier.' },
      { id: 'name', name: 'A name in a lining', desc: 'Your name stitched in the lining under the last owner\'s. A quarter of an hour.', price: 1.5, reply: ['Under the others, in the same thread. It is the only place anybody writes a name in this drum and means it to stay.'], toast: 'Your name is stitched in the lining, under two others.' },
    ],
    greet: ['Stand still a moment. I measure everybody who comes in; it saves time later.', 'Come in. If it is too small, it can be let out. If it is too big, it can wait for you.', 'Hello. Mind the pins on the floor; they land a little anti and I never find them.', 'You look like somebody whose coat has been a long way.'],
    about: [
      ['Fashion here lives in linings, collars, cuffs and alterations. Nobody makes a new coat if an old one can be argued with.', 'I spend more time letting out than cutting.'],
      ['Every lining has the names of the people who wore the coat. The newest goes at the bottom.', 'A coat with six names is worth more than a new one, and costs less.'],
      ['A hem is weighted for the deck it will be worn on. At half a g a coat floats round your knees.', 'People going up to the elders\' decks come in first. People coming down come in to have the weights taken out.'],
      ['The cutting is quick. The thinking is slow.', 'Cloth is twenty-five kays a kilogram, so I think for a long time before I cut.'],
    ],
    band: { low: 'Down here it is children, all day. I cut everything a size up and fold the rest into the seams.', middle: 'Half my work is people moving decks. Weights in, weights out.', high: 'Up here at half a g, I sew weights into every hem I touch. Otherwise the elders\' coats drift about them like water.' },
    card: { prompt: 'Look at the hem weights', title: 'Hem weights', texts: [
      ['Brass discs by the gram in one tray, steel in the next. A card on the tray: Low decks none. Middle decks four. High decks eight.', 'The Third: ask.'],
      ['A tray of hem weights, sorted by gram. Somebody has written on its edge in pencil: these go up and come back down, every one of them.'],
      ['Brass weights, eight grams each. A note: for the elders\' decks, two in each front corner and one at every seam.', 'Kept for the next coat when a coat is cut down.'],
      ['Weights from coats nobody wears any more, sorted and kept. The oldest are stamped with a deck number from before the Count.'],
    ] },
  },

  // ---------------------------------------------------------------------------------------------------- dyer
  dyer: {
    tag: 'dye', emblem: 'drop', menu: 'Re-dyeing', ambience: 'shop', reverb: 'tile', loop: 'steam',
    pal: { wall: '#e8e4d8', wallMat: 'tile', dado: { h: 1.2, mat: 'tile', tint: '#2f6f8f' }, floor: ['terrazzo', '#c9c0ae'], ceil: '#e9e4d6', frame: '#26306b', plinth: '#2f6f8f', awning: ['#2f6f8f', '#d6a640', '#c8402e', '#e9dcc4'], sign: ['#26306b', '#f3e6c8', '#d6a640'], felt: '#2f6f8f', beam: '#5a5650', pipes: ['#2f6f8f', '#c8402e'], rug: ['#2f6f8f', '#d6a640'] },
    stage(C, a, k) { const w = Math.min(2.4, a.u1 - a.u0 - 0.3); C.prop('shops-craft.draperail', (a.u0 + a.u1) / 2, C.SY, mid(a) + 0.1, C.out, { v: (C.seed + k) % 3, w: Math.round(w * 5) / 5 }); },
    unit(C, run, a, i) { goodsUnit(C, run, a, i, 'dyer'); },
    work(C, w) {
      const n = w.len > 2.3 ? 2 : 1;
      for (let i = 0; i < n; i++) { const p = C.pt(w, w.a + (n === 1 ? 0 : (i - 0.5) * 1.15), 0.55); const dye = hsl(((C.seed % 7) / 7 + i * 0.4) % 1, 0.6, 0.35); C.propAt('craft.vat', p[0], 0, p[1], C.ryaw(w), { dye, open: i === 0, r: 0.4 }); }
      const sp = C.pt(w, w.a, 1.25); C.spotW('work', sp[0], sp[1], C.ryaw(w) + Math.PI, ['dye']);
      C.sound = C.pt(w, w.a, 0.5);
    },
    floor(C, f) { C.prop('table', f.u, 0, f.q, C.yaw(0, 1), { w: Math.min(1.6, f.w), d: 0.8, h: 0.9, wood: '#5a4a3a', top: '#c9c0ae' }); C.drawAt(...C.V3(f.u, 0.9, f.q), C.yaw(0, 1), (g) => { for (let i = 0; i < 12; i++) { g.mat('weave', hsl(i / 12, 0.6, 0.5)); g.box(-0.6 + (i % 6) * 0.2, 0, -0.25 + Math.floor(i / 6) * 0.25, -0.45 + (i % 6) * 0.2, 0.004 + (i % 3) * 0.002, -0.05 + Math.floor(i / 6) * 0.25); } g.mat('paper', '#efe4c8'); g.box(-0.2, 0, 0.12, 0.3, 0.03, 0.34, { bevel: 0.004 }); }); C.spot('browse', f.u, f.q - 0.85, C.yaw(0, 1), ['shop']); C.spot('browse', f.u + 0.6, f.q + 0.85, C.yaw(0, -1), ['shop']); },
    back(C, run) { const n = Math.max(1, Math.floor((run.a1 - run.a0) / 1.35)); for (let i = 0; i < n; i++) { const a = (run.a0 + run.a1) / 2 + (i - (n - 1) / 2) * 1.36; const p = C.pt(run, a, 0.21); if (i % 2) C.propAt('shops-craft.goods', p[0], 0, p[1], C.ryaw(run), { t: 'dyer', v: (C.seed + 1) % 3, w: 1.3 }); else C.propAt('shops-craft.drawers', p[0], 0, p[1], C.ryaw(run), { w: 1.3, h: 1.0, d: 0.42, cols: 5, rows: 5, wood: '#4a4038' }); } },
    ceil(C, L) { const n = Math.max(1, Math.floor((L.aisleQ1 - L.aisleQ0) / 1.6)); for (let i = 0; i < n; i++) { const q = L.aisleQ0 + (i + 0.5) * (L.aisleQ1 - L.aisleQ0) / n; C.prop('shops-craft.dryrack', L.aisleU, 3.2, q, C.yaw(0, 1), { v: (C.seed + i) % 3, w: 2.4 }); } },
    top(C, t) { C.propAt('shops-craft.crock', t.x0, 0.92, t.z0, 0, { g: '#e6e1d5', l: '#c8402e', h: 0.18, r: 0.07 }); C.propAt('shops-craft.crock', t.x0 + 0.01, 0.92, t.z0 + 0.02, 0, { g: '#e6e1d5', l: '#26306b', h: 0.14, r: 0.06 }); C.drawAt(t.x1, 0.92, t.z1, t.yaw, (g) => { for (let i = 0; i < 6; i++) { g.mat('knit', hsl(i / 6, 0.6, 0.5)); g.cyl(-0.15 + i * 0.06, 0, 0, 0.022, 0.05, { segs: 7 }); } }); },
    board: { title: 'Re-dyeing', lines: ['A coat · 0.10', 'Collar and cuffs · 0.05', 'Colour weighs nothing', 'Vats on the loop'] },
    label: { text: 'Colours we keep', lines: ['ask for one we do not'] },
    notice: { title: 'Festival', lines: ['Re-dye early.', 'The vats', 'fill up.'] },
    services: [
      { id: 'redye', name: 'Re-dye a coat', desc: 'Colour weighs nothing: a tenth of a kay for the vat\'s power and the rinse. The colour of your choosing.', price: 0.1, colours: true, reply: ['An hour in the vat, an hour on the rack. It will be dry before the lamps go down.'], toast: 'Your coat goes into the vat grey and comes out a colour people will remember.' },
      { id: 'collar', name: 'Collar and cuffs only', desc: 'Just the collar and cuffs in a contrast. Where fashion lives.', price: 0.05, reply: ['The collar and cuffs. Half the drum does this before Booking Day and says it was always that colour.'], toast: 'Collar and cuffs in a bright contrast.' },
    ],
    colours: [['Bruise', '#5b4060'], ['Dawn rose', '#d4878a'], ['Far-bank gold', '#d6a640'], ['Flight indigo', '#26306b'], ['Chervil green', '#6c9a4c'], ['Lid copper', '#b5653a']],
    greet: ['Mind the floor; it is always a little wet. Colour weighs nothing, but the water does.', 'Come in out of the street. The vats are on the loop, so it is warm in here.', 'Hello. Do not lean on the green vat; it has opinions about sleeves.', 'Have you come to change colour? Most people have, this week.'],
    about: [
      ['Dye costs almost nothing. A gram of colour, a vat held warm on the food plant\'s loop, and an hour.', 'So Chervil changes colour more often than it changes coats.'],
      ['The vats sit on the sixty-five degree loop, the same one that warms the baths. I only pay for the stirring.', 'A tenth of a kay a coat. Less than a cup of coffee.'],
      ['The week before Booking Day everybody wants green, or gold, or the colour of the dawn.', 'The rack over your head is somebody\'s whole table, drying for the feast.'],
      ['Every colour has a name here, and most of the names are a painter\'s dawn.', 'Bruise is the brown-violet of the River, the colour the lamp-painters keep trying to put into a dawn.'],
    ],
    band: { low: 'Down here it is school colours and children who want to be a colour nobody has been before.', middle: 'Work coats come in grey and go out blue. Nobody asks why; it is just better.', high: 'Up here at half a g the drips fall slowly, and you can catch them with a cloth before they land.' },
    card: { prompt: 'Look through the colour book', title: 'The colour book', texts: [
      ['Six hundred swatches on cards, each with the date it was first mixed and who asked for it.', 'The newest is three days old: a green, for a naming.'],
      ['A swatch book, fat and stained. Halfway through, a page of browns and violets, each one labelled with a year and the word: nearly.'],
      ['The festival colours, one card each: Bruise, Dawn Rose, Far-Bank Gold, Flight Indigo, Chervil Green, Lid Copper.', 'Pencilled under Bruise: everyone asks for it, nobody can say what it is.'],
      ['Colours by deck: the Low decks like them bright, the High decks like them deep.', 'Somebody has added: the middle decks like whatever the neighbours had.'],
    ] },
  },

  // ---------------------------------------------------------------------------------------------------- chairs
  chairs: {
    ownRug: true, tag: 'carve', emblem: 'chair', menu: 'Chair work', ambience: 'shop', reverb: 'room',
    pal: { wall: '#d6ae6e', dado: { h: 1.15, mat: 'planks', tint: '#2f4a3a' }, floor: ['planks', '#7d5a3a'], ceil: '#e3d2b2', frame: '#2f4a3a', plinth: '#22362b', awning: ['#c58a3a', '#2f4a3a'], sign: ['#2f4a3a', '#f3e6c8', '#c58a3a'], felt: '#a0452e', beam: '#3a2a1e', pipes: ['#2f4a3a', '#a0452e'], rug: ['#a0452e', '#c58a3a'] },
    stage(C, a, k) {
      const n = Math.max(1, Math.min(2, Math.floor((a.u1 - a.u0) / 1.0))), us = along(a, n, 0.5);
      const ST = [{ style: 'spindle', state: 'done', wood: '#6b4428' }, { style: 'ladder', state: 'done', wood: '#4a2e1c', seat: 'rush' }, { style: 'arm', state: 'done', wood: '#3a2418', cloth: C.band === 'high' ? '#8a2f3c' : '#c58a3a', stud: '#2a2622' }, { style: 'slat', state: 'done', wood: '#8a6a44', seat: 'cloth', cloth: '#2f4a3a' }];
      us.forEach((u, i) => { C.prop('craft.chair', u, C.SY, mid(a), C.out + C.r.f(-0.4, 0.4), C.band === 'high' && i === 0 ? ST[2] : ST[(C.seed + i + k) % ST.length], { noSpots: true }); C.drawAt(...C.V3(u + 0.22, C.SY + 0.75, mid(a) - 0.1), C.out, (g) => drawTag(g, 0, 0, 0, { eye: '#c58a3a' })); });
    },
    unit(C, run, a, i) {
      const y = C.ryaw(run);
      if (i % 2 === 0) { const p = C.pt(run, a, 0.02); C.propAt('shops-craft.chairpeg', p[0], 2.3, p[1], y, { w: 1.3, n: 1, v: (C.seed + i) % 3 }); if (i % 4 !== 0) { const cr = C.pt(run, a, 0.32); C.propAt('crate', cr[0], 0, cr[1], y, { w: 0.6, h: 0.4, d: 0.45, wood: '#8a6240' }); return; } const c = C.pt(run, a, 0.36); C.propAt('craft.chair', c[0], 0, c[1], y + C.r.f(-0.15, 0.15), { style: ['ladder', 'slat', 'spindle'][(C.seed + i) % 3], state: 'done', wood: '#5a3a22', seat: 'cloth', cloth: CLOTH[(C.seed + i) % CLOTH.length] }); }
      else goodsUnit(C, run, a, i, 'chairs');
    },
    work(C, w) {
      const p = C.pt(w, w.a, 0.4); C.propAt('craft.bench', p[0], 0, p[1], C.ryaw(w), { w: Math.min(2.0, w.len - 0.3), d: 0.7, wood: '#8a6a44' }, { spot: { tags: ['carve'] } });
      const tb = C.pt(w, w.a, 0.0); C.propAt('craft.toolboard', tb[0], 1.15, tb[1], C.ryaw(w), { w: Math.min(1.8, w.len - 0.4), h: 0.9, board: '#2f4a3a' });
      const gp = C.pt(w, w.a - 0.5, 0.45); C.propAt('craft.gluepot', gp[0], 0.86, gp[1], 0, { glaze: '#6b4a2f' });
      const ch = C.pt(w, w.a + 0.4, 0.4); C.propAt('craft.chair', ch[0], 0.86, ch[1], C.ryaw(w) + 2.6, { style: 'spindle', state: 'bare', wood: '#8a5a34' }, { noSpots: true, noCollide: true });
    },
    floor(C, f) {
      C.prop('rug', f.u, 0, f.q, C.yaw(1, 0), { w: 2.0, d: 1.4, a: '#a0452e', b: '#c58a3a' });
      C.prop('craft.chair', f.u - 0.45, 0, f.q, C.yaw(0, -1) + 0.3, { style: 'arm', state: 'done', wood: '#3a2418', cloth: '#2f4a3a' });
      C.prop('craft.chair', f.u + 0.55, 0, f.q + 0.2, C.yaw(0, -1) - 0.4, { style: 'arm', state: 'webbed', wood: '#5a3a22' }, { noSpots: true });
      C.sitPrompt = { u: f.u - 0.45, q: f.q, yaw: C.yaw(0, -1) + 0.3, y: 0.46 };
    },
    back(C, run) { const n = Math.max(1, Math.floor((run.a1 - run.a0) / 1.4)); for (let i = 0; i < n; i++) { const a = (run.a0 + run.a1) / 2 + (i - (n - 1) / 2) * 1.4; const p = C.pt(run, a, 0.21); C.propAt('shops-craft.goods', p[0], 0, p[1], C.ryaw(run), { t: 'chairs', v: (C.seed + i) % 3, w: 1.3 }); } },
    top(C, t) { C.propAt('craft.gluepot', t.x0, 0.92, t.z0, 0, { glaze: '#a0452e' }); C.drawAt(t.x1, 0.92, t.z1, t.yaw, (g) => { g.mat('wood', '#c9a06a'); for (let i = 0; i < 5; i++) g.tube([[-0.2, 0.012 + (i % 2) * 0.02, -0.05 + i * 0.025], [0.2, 0.012 + (i % 2) * 0.02, -0.05 + i * 0.025]], 0.011, { segs: 5 }); g.mat('paper', '#efe4c8'); g.box(0.25, 0, -0.1, 0.45, 0.006, 0.1); }); },
    board: { title: 'Chair work', lines: ['Re-glue a joint · 6.00', 'New feet · 3.00', 'Re-cover a seat · 19.50', 'A new chair · 125'] },
    label: { text: 'Older and better', lines: ['every chair has its year'] },
    notice: { title: 'Dearer', lines: ['by the year.', 'The oldest', 'chair wins.'] },
    services: [
      { id: 'reglue', name: 'Re-glue a loose joint', desc: 'An hour, clamped and left overnight.', price: 6, reply: ['Leave it with me tonight. Glue does its work in the lamp-night, like everything else.'], toast: 'A joint knocked apart, cleaned, glued and clamped for the night.' },
      { id: 'feet', name: 'New feet', desc: 'Turned from offcuts on the lathe in half an hour.', price: 3, reply: ['Offcuts. Nobody will know they are new except the chair.'], toast: 'Four new feet, turned from offcuts, dark-stained to match.' },
      { id: 'recover', name: 'Re-cover a seat', desc: 'About 0.3 kilograms of cloth in any colour on the shelf, and two hours.', price: 19.5, reply: ['Two hours, and the cloth. Pick a colour you will not be tired of in thirty years.'], toast: 'A seat re-covered in a bright cloth, tacked down with brass.' },
    ],
    greet: ['Sit anywhere. If it creaks, tell me which one.', 'Come in. Every chair in here is older than you, and most of them are older than me.', 'Hello. The one by the window is not for sale; it is for sitting in while you decide.', 'Mind the glue pot. It is warm, and it is always out.'],
    about: [
      ['A new chair is five kilograms of new mass at twenty-five kays a kilogram. A hundred and twenty-five, before anybody has sat in it.', 'An old one, remade, is cheaper, and better, because somebody already chose it once.'],
      ['Chairs are dearer the older they get. A chair that has held three generations of one family has proved something.', 'The price tags here go up every Booking Day.'],
      ['Newly-weds come in with a grandparent\'s chair in pieces in a bag.', 'They go out with it whole, and with a story about whose knees wore the rail down.'],
      ['I turn the new feet from offcuts. The old feet go in a box.', 'People come and buy the old feet. I have stopped asking what for.'],
    ],
    band: { low: 'Down here it is high chairs and small chairs, and every one of them has been chewed.', middle: 'Mostly kitchen chairs. A hall chair takes a beating at four hundred seats a night.', high: 'Up here at half a g an old person stands up too fast and the chair goes over. So I put arms on everything, and a little weight in the back feet.' },
    card: { prompt: 'Read the tag on a chair', title: 'The tag', texts: [
      ['Ladder-back, ash, rush seat. Made before the Count. Five owners, all on one stair.', 'Seat re-rushed eleven times. Price goes up at Booking Day.'],
      ['Spindle chair, painted green three times, now stripped back. One spindle is new; nobody can find it.', 'A note in pencil: this is the one your great-aunt fell asleep in.'],
      ['Armchair. Webbing and springs remade this year; the frame is two hundred years old.', 'The cloth is from a hall table runner, given by the hall.'],
      ['Slat-back kitchen chair from a hall that seated four hundred. Its number is burned under the seat: 212.', 'The hall still asks after it.'],
    ] },
  },

  // ---------------------------------------------------------------------------------------------------- lamps
  lamps: {
    tag: 'mend', emblem: 'lamp', menu: 'Lamps', ambience: 'shop', reverb: 'room', loop: 'hum-lamp', dark: true,
    pal: { wall: '#4a3f44', dado: { h: 1.0, mat: 'flute', tint: '#2a2428' }, floor: ['planks', '#5a3d28'], ceil: '#3a3438', frame: '#1d1a1c', plinth: '#2a2428', awning: ['#d6a640', '#2a2428'], sign: ['#1d1a1c', '#ffe3a8', '#ffb347'], felt: '#5b3a6e', beam: '#2a2226', pipes: ['#b08a45', '#5b3a6e'], rug: ['#5b3a6e', '#d6a640'] },
    stage(C, a, k) {
      const n = Math.max(1, Math.min(2, Math.floor((a.u1 - a.u0) / 1.5))), us = along(a, n, 0.75);
      us.forEach((u, i) => {
        C.prop('shops-craft.steps', u, C.SY, mid(a), C.out, { w: 1.1, c: '#5b3a6e' });
        for (let s = 0; s < 3; s++) for (let j = 0; j < 4; j++) { if ((s + j) % 3 === 2) continue; const pt = C.V3(u - 0.39 + j * 0.26, C.SY + 0.185 + s * 0.18, mid(a) + 0.25 - s * 0.11); C.propAt('shops-craft.handlamp', pt[0], pt[1], pt[2], C.r.f(0, 3), { c: ['#2f6f73', '#8a2f3c', '#d6a640', '#33407a', '#3a3530'][(s + j + i) % 5], on: (s + j + k) % 2 === 0, glow: ['#ffae5c', '#ffd9a0', '#fff4e6'][s] }); }
      });
      C.prop('books.standard', a.u1 - 0.3, C.SY, a.q0 + 0.35, 0, { shade: '#d9a24e', h: 1.5 });
      const np = Math.max(3, Math.floor((a.u1 - a.u0) / 0.45));
      for (let i = 0; i < np; i++) C.prop('shops-craft.pendant', a.u0 + 0.25 + i * (a.u1 - a.u0 - 0.5) / (np - 1), 3.2, a.q0 + 0.3 + (i % 2) * 0.45, 0, { c: ['#2f6f73', '#d6a640', '#8a2f3c', '#e9e1cf', '#33407a'][(i + k + C.seed) % 5], kind: (i + k) % 3, drop: [1.05, 1.4, 1.2, 1.55][i % 4], glow: ['#ffb870', '#ffd9a0', '#fff0dc'][(i + k) % 3], e: 3.2 });
    },
    unit(C, run, a, i) { goodsUnit(C, run, a, i, 'lamps'); },
    work(C, w) {
      const tw = Math.min(2.2, w.len - 0.3), p = C.pt(w, w.a, 0.0); C.propAt('shops-craft.testwall', p[0], 0.95, p[1], C.ryaw(w), { w: Math.round(tw * 5) / 5, v: C.seed % 3 });
      const b = C.pt(w, w.a, 0.62); C.propAt('shops-craft.worktable', b[0], 0, b[1], C.ryaw(w) + Math.PI, { t: 'lamps', w: Math.min(1.6, tw), d: 0.6, top: '#6b4a2f' });
      const sp = C.pt(w, w.a, 1.25); C.spotW('work', sp[0], sp[1], C.ryaw(w) + Math.PI, ['mend']);
      C.glowAt = C.pt(w, w.a, 0.5);
    },
    floor(C, f) { C.prop('shops-craft.worktable', f.u, 0, f.q, C.yaw(0, 1), { t: 'lamps', w: Math.min(1.5, f.w), d: 0.75, top: '#4a3424' }); C.spot('browse', f.u, f.q - 0.8, C.yaw(0, 1), ['shop']); C.spot('browse', f.u + 0.5, f.q + 0.8, C.yaw(0, -1), ['shop']); },
    back(C, run) { const n = Math.max(1, Math.floor((run.a1 - run.a0) / 1.35)); for (let i = 0; i < n; i++) { const a = (run.a0 + run.a1) / 2 + (i - (n - 1) / 2) * 1.36; const p = C.pt(run, a, 0.21); C.propAt('shops-craft.drawers', p[0], 0, p[1], C.ryaw(run), { w: 1.3, h: 0.95, d: 0.42, cols: 6, rows: 5, wood: '#3a2a1e' }); { const q = C.pt(run, a, 0.2); C.propAt('studio.lamphead', q[0], 0.98, q[1], C.ryaw(run) + i, { metal: ['#7a6a58', '#b08a45', '#3a3530'][i % 3] }); } } },
    ceil(C, L) { const n = Math.max(2, Math.floor((L.aisleQ1 - L.aisleQ0) / 1.1)); for (let i = 0; i < n; i++) { const q = L.aisleQ0 + (i + 0.5) * (L.aisleQ1 - L.aisleQ0) / n; C.prop('shops-craft.pendant', L.aisleU + (i % 2 ? 0.35 : -0.35), 3.2, q, 0, { c: ['#2f6f73', '#d6a640', '#8a2f3c', '#e9e1cf'][(i + C.seed) % 4], kind: i % 3, drop: 0.55 + (i % 2) * 0.2, glow: ['#ffc884', '#ffe6c0', '#fff4e6'][i % 3] }); } },
    top(C, t) { C.propAt('shops-craft.handlamp', t.x0, 0.92, t.z0, 0.3, { c: '#8a2f3c', on: true, glow: '#ffc884' }); C.drawAt(t.x1, 0.92, t.z1, t.yaw, (g) => { g.mat('paper', '#efe4c8'); g.box(-0.2, 0, -0.1, 0.1, 0.012, 0.12, { bevel: 0.003 }); g.mat('cast', '#b08a45'); for (let i = 0; i < 5; i++) g.cyl(0.18 + (i % 2) * 0.04, 0, -0.05 + i * 0.03, 0.012, 0.025, { segs: 6 }); }); },
    board: { title: 'Lamps', lines: ['Mend a hand lamp · 1.50', 'Rewire a room lamp · 3.00', 'Lent for the Flight · free', 'Every one run a week'] },
    label: { text: 'Hand lamps', lines: ['a watt or two each'] },
    notice: { title: 'The test wall', lines: ['Seven days', 'on the wall', 'or it stays.'] },
    services: [
      { id: 'mend', name: 'Mend a hand lamp', desc: 'A quarter of an hour and a switch from the offcut drawer.', price: 1.5, reply: ['A quarter of an hour, then it goes on the wall for a week like everything else. You can have it back after.'], toast: 'A hand lamp with a new switch, a tag on it, and seven days on the test wall to come.' },
      { id: 'loan', name: 'A hand lamp, lent for the night', desc: 'A watt or two, with a clip for your collar. Bring it back by lamp-dawn.', price: 0, loan: true, reply: ['For the Flight, or just for the walk home. Clip it on your collar so your hands are free.'], toast: 'A small hand lamp, lent, clipped to your collar.' },
      { id: 'rewire', name: 'Rewire a room lamp', desc: 'Half an hour, new flex from the drawer.', price: 3, reply: ['Half an hour. The old flex goes back to the Take-Apart.'], toast: 'A room lamp with new flex, tested warm and then white.' },
    ],
    greet: ['Come in, and give your eyes a moment. I keep it dim so the lamps can show off.', 'Hello. Everything on that wall has been on for days. Nothing leaves here until it has done its week.', 'Mind the flex. There is always a flex.', 'You will want a hand lamp for the Flight. Everybody does, and everybody forgets until the night.'],
    about: [
      ['Every lamp I sell or mend runs a week on the test wall first. Seven days, chalked under it.', 'If it flickers on the sixth day, it starts again.'],
      ['A good lamp is warm at lamp-dawn and white by noon, like the houses. The test wall runs the whole day every day.', 'Warm then white, and back again at dusk.'],
      ['Light is a luxury here. Speed, light and new mass: that is what people pay for.', 'So I make small lamps that last, and nobody minds paying for one once.'],
      ['Hand lamps are a watt or two. The whole Spindle on the night of the Flight is lit by them.', 'Hundreds of thousands, and every one somebody\'s.'],
    ],
    band: { low: 'Down here it is night lamps for children who will not sleep in the dark, which is all of them.', middle: 'Desk lamps for the late shift, and lamps that dim themselves after eleven.', high: 'Up here the elders want them warm and low. White light is for people who still have to read small print.' },
    card: { prompt: 'Read the chalk on the test wall', title: 'The test wall', texts: [
      ['Each socket has a name chalked over it and days chalked under it. Most have six or seven strokes.', 'One is dark, with a red tag: day five, flickered. Starting again.'],
      ['The lamps run warm at one end of the wall and white at the other, so the whole day is laid out in a row.', 'At the white end somebody has chalked: noon.'],
      ['Under one socket, in a child\'s writing: my lamp. Seven strokes and a star.'],
      ['The board is ruled in weeks. The top row is lamps for the Long Flight, every one of them on its seventh day.'],
    ] },
  },

  // ---------------------------------------------------------------------------------------------------- flutes
  flutes: {
    tag: 'tune', emblem: 'flute', menu: 'Flutes', ambience: 'shop', reverb: 'felt',
    pal: { wall: '#e4d4b4', dado: { h: 1.0, mat: 'wood', tint: '#4a3424' }, floor: ['planks', '#8a6a44'], ceil: '#e8dcc4', frame: '#3a2a20', plinth: '#2a1e18', awning: ['#b08a45', '#3a2a20'], sign: ['#3a2a20', '#f3e6c8', '#b08a45'], felt: '#5b3a6e', beam: '#4a3424', pipes: ['#b08a45', '#5b3a6e'], rug: ['#5b3a6e', '#b08a45'], hang: ['#5b3a6e', '#8a2f3c', '#2f6f73'] },
    stage(C, a, k) {
      const n = Math.max(2, Math.min(4, Math.floor((a.u1 - a.u0) / 0.45))), us = along(a, n, 0.4);
      us.forEach((u, i) => C.prop('shops-craft.flutestand', u, C.SY, mid(a) + (i % 2 ? 0.15 : -0.1), C.out + 0.4, { len: [1.2, 1.05, 1.3, 1.15][(i + k) % 4], wood: ['#6b3f22', '#4a2a18', '#8a5a34'][(i + C.seed) % 3] }));
      C.prop('shops-craft.stand', a.u1 - 0.35, C.SY, mid(a), C.out + 0.3, {});
      if (a.u1 - a.u0 > 1.6) C.prop('shops-craft.fluterack', (a.u0 + a.u1) / 2, C.SY, a.q1 - 0.08, C.out, { w: Math.min(1.6, a.u1 - a.u0 - 0.6), v: (C.seed + k) % 3 });
    },
    unit(C, run, a, i) { const p = C.pt(run, a, 0.21), y = C.ryaw(run); C.propAt('shops-craft.drawers', p[0], 0, p[1], y, { w: 1.3, h: 0.55, d: 0.42, cols: 5, rows: 2, wood: '#4a3222' }); const q = C.pt(run, a, 0.04); C.propAt('shops-craft.fluterack', q[0], 0.6, q[1], y, { w: 1.2, v: (C.seed + i) % 3 }); },
    work(C, w) {
      const p = C.pt(w, w.a - (w.len > 2.6 ? 0.5 : 0), 0.4); C.propAt('craft.lathe', p[0], 0, p[1], C.ryaw(w) + Math.PI, { len: Math.min(1.5, w.len - 0.6), piece: '#b07a42' }, { spot: { tags: ['carve'] } });
      const sp = C.pt(w, w.a, 1.1); C.spotW('work', sp[0], sp[1], C.ryaw(w) + Math.PI, ['tune']);
      if (w.len > 2.6) { const st = C.pt(w, w.a + w.len / 2 - 0.4, 0.5); C.propAt('shops-craft.stand', st[0], 0, st[1], C.ryaw(w), {}); }
    },
    floor(C, f) { C.prop('bench', f.u, 0, f.q, C.yaw(0, -1), { w: Math.min(1.6, f.w), back: true, wood: '#5a3d28' }); C.prop('shops-craft.stand', f.u, 0, f.q - 1.0, C.yaw(0, 1), {}); C.sitPrompt = { u: f.u, q: f.q, yaw: C.yaw(0, -1), y: 0.46 }; },
    back(C, run) { const n = Math.max(1, Math.floor((run.a1 - run.a0) / 1.35)); for (let i = 0; i < n; i++) { const a = (run.a0 + run.a1) / 2 + (i - (n - 1) / 2) * 1.36; const p = C.pt(run, a, 0.21); C.propAt('shops-craft.goods', p[0], 0, p[1], C.ryaw(run), { t: 'flutes', v: (C.seed + i) % 3, w: 1.3 }); } },
    walls(C) { C.feltHangings(); },
    top(C, t) { C.drawAt(t.x0, 0.92, t.z0, t.yaw, (g) => { g.push(); g.move(-0.1, 0.02, 0); g.rotZ(Math.PI / 2); g.rotX(0.1); g.mat('wood', '#6b3f22'); g.cyl(0, -0.3, 0, 0.017, 0.6, { segs: 8 }); g.pop(); g.mat('felt', '#e9e1cf'); for (let i = 0; i < 8; i++) g.cyl(0.25 + (i % 4) * 0.035, 0, -0.05 + Math.floor(i / 4) * 0.04, 0.014, 0.004, { segs: 8 }); }); C.drawAt(t.x1, 0.92, t.z1, t.yaw, (g) => { g.mat('cast', '#c9c4bb', { rough: -0.3 }); g.lathe(0, 0, [[0.03, 0], [0.035, 0.01], [0.012, 0.06], [0.006, 0.12]], { segs: 8 }); g.mat('paper', '#efe4c8'); g.box(0.08, 0, -0.1, 0.3, 0.006, 0.08); }); },
    board: { title: 'Flutes', lines: ['Tuning · 1.50', 'A lesson, one hour · 6.00', 'A remade flute · 12.25', 'Sitting in · free'] },
    label: { text: 'Tuned in this air', lines: ['one metre twenty, more or less'] },
    notice: { title: 'Please', lines: ['Try one.', 'Do not tap', 'your foot.'] },
    services: [
      { id: 'tune', name: 'Tuning', desc: 'A quarter of an hour on the tuning bench, for any flute.', price: 1.5, reply: ['A quarter of an hour. I tune them in this room\'s air, and this room\'s air is the drum\'s air, so it will hold anywhere you go in Chervil.'], toast: 'A quarter of an hour, a hundred small notes, and the flute is true again.' },
      { id: 'lesson', name: 'A lesson, one hour', desc: 'An hour in the shop\'s own air.', price: 6, reply: ['Sit. Hold it level. No, longer than that. It is always longer than you think.'], toast: 'An hour of long notes. Your arms ache from holding a metre and twenty of flute level.' },
      { id: 'sit', name: 'Sit in on a lesson', desc: 'The bench by the window. Nobody minds a listener.', price: 0, reply: ['The bench. Do not tap your foot; the floor carries it straight into the flute.'], toast: 'You sit and listen to somebody else\'s lesson for a while.' },
    ],
    greet: ['Come in. Close the door gently; the felt only does so much.', 'Hello. Pick one up if you like. Mind the end; it is further away than you think.', 'You will want to tap your foot. Please do not; the floor carries it.', 'Every flute in here is tuned in this air, which is the drum\'s air, so it is right anywhere in Chervil.'],
    about: [
      ['Heliox puts every pipe about ten semitones sharp for its length. So a flute is a metre and twenty long.', 'Children learn on short ones that squeak. Everybody does.'],
      ['Sound runs nearly twice as fast in this air. A bare room rings like a bell, so this one is hung with felt.', 'You cannot tune a flute in a room that answers back.'],
      ['A new flute is about four hundred grams of new mass and eight hours. Most people start on a remade one.', 'The remade ones play better. They have been practised on.'],
      ['The long ones are for the choirs on the Long Flight.', 'You can hear a flute a long way down the Spindle at night.'],
    ],
    band: { low: 'Down here I sell short flutes to children and long patience to their parents.', middle: 'The block choirs buy here. Every Booking Day somebody needs a low one.', high: 'Up here the elders hold them on their knees to play. At half a g a metre and twenty of flute weighs almost nothing, but the arms still get tired.' },
    card: { prompt: 'Read the tag on a flute', title: 'The tag', texts: [
      ['One metre twenty-two. Pads new this year, body three hundred years old.', 'Played on eleven Long Flights. Tuned here.'],
      ['One metre five, a child\'s first long flute. Its last owner has written in pencil on the case: it gets easier at about the hundredth time.'],
      ['One metre thirty-one, the low one the block choir borrows every year and every year promises to buy.'],
      ['A short practice flute, seventy centimetres, for a child of six. A note: squeaks. All of them squeak. This is normal.'],
    ] },
    tryIt: { prompt: 'Try a flute', sfx: 'flute-note', lines: [['You hold the flute out level, a metre and twenty of it, and blow.', 'A clear note comes out, higher than you expected, and the felt swallows the echo.'], ['The flute is longer than your arm can comfortably manage. You find the note on the third try.', 'In this air, it sounds like a short flute anywhere else.'], ['You play two notes. The keeper looks up, nods once, and goes back to the lathe.'], ['A low note, warm and clean. In a bare room it would ring for seconds. Here it simply stops.']] },
  },

  // ---------------------------------------------------------------------------------------------------- felt
  felt: {
    tag: 'sew', emblem: 'drum', menu: 'Felt', ambience: 'shop', reverb: 'felt',
    pal: { wall: '#b7832f', wallMat: 'felt', dado: { h: 1.1, mat: 'felt', tint: '#8a2f3c' }, floor: ['felt', '#5a4a3e'], ceil: '#d8c8a8', frame: '#4a2a2a', plinth: '#3a2020', awning: ['#8a2f3c', '#d6a640'], sign: ['#4a2a2a', '#f3e6c8', '#d6a640'], felt: '#8a2f3c', beam: '#4a3424', pipes: ['#d6a640', '#8a2f3c'], rug: ['#2f6f73', '#d6a640'] },
    stage(C, a, k) {
      const n = Math.max(1, Math.min(3, Math.floor((a.u1 - a.u0) / 1.0))), us = along(a, n, 0.55);
      const cols = ['#8a2f3c', '#d6a640', '#2f6f73', '#5b3a6e', '#6b7a3a', '#c9552e'];
      us.forEach((u, i) => C.prop('shops-craft.baffle', u, 3.2, mid(a), C.out, { c: cols[(i + k + C.seed) % 6], c2: cols[(i + k + C.seed + 2) % 6], w: 0.85, h: 0.9, up: 0.55 }));
      for (let i = 0; i < 3; i++) C.prop('shops-craft.roll', a.u0 + 0.3 + i * 0.32, C.SY, a.q0 + 0.35 + (i % 2) * 0.25, 0, { c: cols[(i + k * 2 + C.seed) % 6], h: 1.1 + i * 0.12, r: 0.13 });
    },
    unit(C, run, a, i) { const p = C.pt(run, a, 0.25); C.propAt('shops-craft.feltcubby', p[0], 0, p[1], C.ryaw(run), { v: (C.seed + i) % 3, w: 1.3 }); },
    work(C, w) { const p = C.pt(w, w.a, 0.5); C.propAt('shops-craft.worktable', p[0], 0, p[1], C.ryaw(w) + Math.PI, { t: 'felt', w: Math.min(2.0, w.len - 0.3), d: 0.85, top: '#a07850' }); const sp = C.pt(w, w.a, 1.25); C.spotW('work', sp[0], sp[1], C.ryaw(w) + Math.PI, ['sew']); },
    floor(C, f) { C.prop('shops-craft.claptest', f.u, 0, f.q, C.yaw(0, -1), {}); C.spot('browse', f.u, f.q - 1.0, C.yaw(0, 1), ['shop']); C.clapAt = { u: f.u, q: f.q - 0.9 }; },
    back(C, run) { const n = Math.max(1, Math.floor((run.a1 - run.a0) / 1.35)); for (let i = 0; i < n; i++) { const a = (run.a0 + run.a1) / 2 + (i - (n - 1) / 2) * 1.36; const p = C.pt(run, a, 0.21); C.propAt('shops-craft.goods', p[0], 0, p[1], C.ryaw(run), { t: 'felt', v: (C.seed + i) % 3, w: 1.3 }); } },
    ceil(C, L) { const cols = ['#8a2f3c', '#d6a640', '#2f6f73', '#5b3a6e', '#c9552e']; const n = Math.max(2, Math.floor((L.aisleQ1 - L.aisleQ0) / 1.2)); for (let i = 0; i < n; i++) { const q = L.aisleQ0 + (i + 0.5) * (L.aisleQ1 - L.aisleQ0) / n; C.prop('shops-craft.baffle', L.aisleU, 3.2, q, C.yaw(0, 1), { c: cols[(i + C.seed) % 5], c2: '#e9e1cf', w: 1.4, h: 0.4, up: 0.22 }); } },
    top(C, t) { C.drawAt(t.x0, 0.92, t.z0, t.yaw, (g) => { for (let i = 0; i < 4; i++) { g.mat('felt', ['#8a2f3c', '#d6a640', '#2f6f73', '#5b3a6e'][i]); g.box(-0.15, i * 0.012, -0.12, 0.15, i * 0.012 + 0.011, 0.12); } }); C.drawAt(t.x1, 0.92, t.z1, t.yaw, (g) => { g.mat('cast', '#9a9488'); g.box(-0.25, 0, -0.02, 0.25, 0.008, 0.02); g.push(); g.move(0.1, 0.004, 0.08); g.rotY(-0.5); drawShears(g); g.pop(); }); },
    board: { title: 'Felt', lines: ['Wash and rehang · 3.00', 'A baffle for a flat · 9.00', 'Offcuts by the gram', 'Three layers for a hall'] },
    label: { text: 'By the roll', lines: ['three layers deep for a hall'] },
    notice: { title: 'Clap', lines: ['in front of', 'each board.', 'Go on.'] },
    services: [
      { id: 'rehang', name: 'Wash and rehang a baffle', desc: 'Half an hour, and the street rings while it is down.', price: 3, reply: ['Half an hour. While it is down the room will ring; warn the neighbours.'], toast: 'A baffle washed and rehung. Somebody\'s room goes quiet again.' },
      { id: 'baffle', name: 'A baffle for a flat', desc: 'About 0.15 kilograms of new felt and an hour of cutting and hanging.', price: 9, reply: ['A metre by sixty, over the place where the room rings worst. You can always tell where that is: it is where the table is.'], toast: 'A felt baffle, cut, edged and ready to hang.' },
    ],
    greet: ['Come in. Hear that? That is nothing. That is what we sell.', 'Hello. Speak normally; you do not have to whisper in here. It just sounds as if you are.', 'Mind the rolls. They lean.', 'Clap in front of the bare board, then in front of the felt one. Everybody does.'],
    about: [
      ['Sound runs nearly twice as fast in this air, and a bare room rings like a bell.', 'Good rooms hang felt. A hall hangs it three layers deep.'],
      ['Every street in Chervil has felt over it somewhere. When it comes down for washing the whole street rings for a week.', 'People complain to me as if I took it down.'],
      ['Felt is cellulose and a little binder, pressed hot on the loop.', 'It weighs more than you would think, so we cut it carefully and hang it where it does the most.'],
      ['Most of my work is in halls. Four hundred people at one table is loud, and Chervil likes it loud, but not that loud.'],
    ],
    band: { low: 'Down here it is schools and nurseries. Children are the loudest thing in the drum, and we are not allowed to hang felt on them.', middle: 'Mostly halls and work rooms. A kitchen with a long table needs more felt than anybody believes.', high: 'Up here the elders want quiet rooms, and so do I. At half a g a baffle hangs straighter, too.' },
    clap: [['You clap in front of the bare board. The sound comes back off it, bright and thin, and hangs for a moment.', 'You clap in front of the felt. It simply stops, as if somebody had caught it.'], ['The bare board answers your clap twice. The felt does not answer at all.', 'The keeper smiles without looking up: everybody does that.'], ['Clap, ring. Clap, nothing.', 'It is the whole trade, in two boards.'], ['In front of the felt your clap sounds like a word said into a pillow. In front of the paint it sounds like a dropped tray.']],
  },

  // ---------------------------------------------------------------------------------------------------- books
  books: {
    ownRug: true, tag: 'write', emblem: 'book', menu: 'The book room', ambience: 'shop', reverb: 'felt',
    pal: { wall: '#e2d2b4', dado: { h: 1.0, mat: 'wood', tint: '#4a3222' }, floor: ['planks', '#6e4c34'], ceil: '#e2d4bc', frame: '#2a3a2a', plinth: '#1d2a1e', awning: ['#1d6a48', '#e9dcc4'], sign: ['#2a3a2a', '#f3e6c8', '#d8b860'], felt: '#1f4f55', beam: '#3b2618', pipes: ['#b08a45', '#1f4f55'], rug: ['#8c3b26', '#b7832f'] },
    stage(C, a, k) {
      const w = a.u1 - a.u0, u = (a.u0 + a.u1) / 2;
      C.prop('books.lectern', u, C.SY, mid(a) + 0.05, C.inn, {}, { noSpots: true });
      C.drawAt(...C.V3(u, C.SY + 1.08, mid(a) + 0.05), C.inn, (g) => { g.rotX(0.32); g.mat('paper', '#f3ead2'); g.box(-0.24, 0.02, -0.17, -0.005, 0.03, 0.17); g.box(0.005, 0.02, -0.17, 0.24, 0.03, 0.17); g.mat('plain', '#5a4a3a'); for (let i = 0; i < 9; i++) { g.box(-0.22, 0.031, -0.14 + i * 0.03, -0.03, 0.032, -0.135 + i * 0.03); g.box(0.03, 0.031, -0.14 + i * 0.03, 0.22, 0.032, -0.135 + i * 0.03); } });
      if (w > 2.0) C.prop('books.standard', a.u0 + 0.35, C.SY, mid(a), 0, { shade: '#b7832f' });
      C.drawAt(...C.V3(a.u1 - 0.5, C.SY, mid(a)), C.out, (g) => { for (let i = 0; i < 6; i++) { g.mat('paper', ['#7a2f2a', '#2f4f6f', '#3d5a3a', '#8a6a2f', '#5b4060', '#a0522d'][(i + k) % 6]); g.box(-0.13 + (i % 2) * 0.01, i * 0.04, -0.09, 0.13, i * 0.04 + 0.038, 0.09 + (i % 3) * 0.01, { bevel: 0.004 }); } });
    },
    unit(C, run, a, i) { goodsUnit(C, run, a, i, 'books'); },
    work(C, w) { const p = C.pt(w, w.a, 0.45); C.propAt('shops-craft.worktable', p[0], 0, p[1], C.ryaw(w) + Math.PI, { t: 'books', w: Math.min(1.6, w.len - 0.4), d: 0.75, top: '#5a3d28' }); const gl = C.pt(w, w.a - 0.45, 0.25); C.propAt('books.greenlamp', gl[0], 0.9, gl[1], C.ryaw(w), {}); const pr = C.pt(w, w.a + 0.5, 0.3); C.propAt('books.press', pr[0], 0.9, pr[1], C.ryaw(w), {}); const st = C.pt(w, w.a, 1.05); C.propAt('shops-craft.seat', st[0], 0, st[1], C.ryaw(w), { wood: '#4a3020' }, { noSpots: true }); C.spotW('work', st[0], st[1], C.ryaw(w), ['write'], 0.46); },
    floor(C, f) {
      const yA = C.yaw(1, 0), yB = C.yaw(-1, 0);
      C.prop('rug', f.u, 0, f.q, C.yaw(0, 1), { w: 2.2, d: 1.5, a: '#8c3b26', b: '#b7832f' });
      C.prop('books.armchair', f.u - 0.75, 0, f.q, yA + 0.25, { fabric: '#7a2f2a', mend: '#e0b04a', patch: '#3fa7a3', mendAt: 'arm' });
      C.prop('books.armchair', f.u + 0.75, 0, f.q + 0.1, yB - 0.25, { fabric: '#1f4f55', wing: true, mend: '#d95d7a', patch: '#e0b04a', mendAt: 'seat' });
      C.prop('books.standard', f.u, 0, f.q - 0.55, 0, { shade: '#d9a24e' });
      C.sitPrompt = { u: f.u - 0.75, q: f.q, yaw: yA + 0.25, y: 0.47 };
    },
    back(C, run) { const len = Math.min(run.a1 - run.a0 - 0.3, 2.6), a = (run.a0 + run.a1) / 2; const p = C.pt(run, a, 0.21); C.propAt('shops-craft.drawers', p[0], 0, p[1], C.ryaw(run), { w: len, h: 0.86, d: 0.42, cols: Math.round(len / 0.32), rows: 3, wood: '#4a3222' }); const q = C.pt(run, a, 0.15); C.propAt('shops-craft.pigeonholes', q[0], 0.9, q[1], C.ryaw(run), { w: Math.round(len * 5) / 5, h: 1.2 }); },
    top(C, t) { C.propAt('cup', t.x0, 0.92, t.z0, 0, { glaze: '#d9cfb8', lid: '#1f4f55' }); C.drawAt(t.x1, 0.92, t.z1, t.yaw, (g) => { g.mat('paper', '#f3ead2'); for (let i = 0; i < 6; i++) g.box(-0.15 + i * 0.004, i * 0.003, -0.11, 0.06 + i * 0.004, i * 0.003 + 0.003, 0.11); g.mat('paper', '#2f4f6f'); g.box(0.12, 0, -0.1, 0.32, 0.03, 0.12, { bevel: 0.004 }); }); },
    board: { title: 'This week', lines: ['Letters read aloud at eight', 'Paper books lent', 'A letter on paper · 0.25', 'A card home · 0.05'] },
    label: { text: 'Lent, not sold', lines: ['pencil in the margins, please'] },
    notice: { title: 'Tonight', lines: ['A long letter,', 'read once,', 'at eight.'] },
    services: [
      { id: 'borrow', name: 'Borrow a paper book', desc: 'Lent, for as long as you are in Chervil. Pencil in the margins is welcome.', price: 0, loan: true, reply: ['Write in it. Everybody does. The next reader will want to know what you thought.'], toast: 'A paper book, lent, its margins already full of other people\'s pencil.' },
      { id: 'letter', name: 'A letter on paper', desc: 'About ten grams of paper, for a letter you want to hold.', price: 0.25, reply: ['Ten grams. Write slowly; friends across the Shade are years away by light, so people write long.'], toast: 'Ten grams of good paper, folded, for a long letter.' },
      { id: 'card', name: 'A blank card home', desc: 'One card from every row, sent by light, postmarked with the delay.', price: 0.05, reply: ['One from every row, they say. Do not write it yet. Write it on your last morning.'], toast: 'A blank card, to write home on your last morning.' },
    ],
    greet: ['Come in quietly. Not because of the books; because of the chairs. Somebody is usually asleep in one.', 'Hello. Everything here is lent. Nothing is sold except paper.', 'If you are here for the reading, it is at eight. If you are here for the chairs, sit anywhere.', 'Take one down. Read the margins first; they are often better.'],
    about: [
      ['Copies are free. Anything ever written in the Shade comes to you when the worlds are on.', 'Paper is not free. So a paper book is lent, and read, and written in, and lent again.'],
      ['Friends across the Shade are years away by light, so people write long letters, to be read once.', 'We read them aloud here, once, to whoever is in the chairs.'],
      ['Pencil in the margins is not damage here. It is the point.', 'Some books have more margin than book by now.'],
      ['A letter that took eleven years to arrive deserves a room and a voice.', 'The person it was written to usually sits in the front chair and pretends not to cry.'],
    ],
    band: { low: 'Down here it is picture books, read to pieces and mended with tape in bright colours.', middle: 'People come in after the late shift and read the margins of the same book for a year.', high: 'Up here the elders bring their own old letters to be read aloud again. We read them as if they had just arrived.' },
    card: { prompt: 'Take a book down', title: 'In the margin', texts: [
      ['A book of long letters. In the margin, in three pencils: I cried here. So did I. Me too, on the Flight.'],
      ['A book on the old Count. Underlined twice: three per cent. In the margin, in a child\'s hand: that is us.'],
      ['A book of recipes with lids drawn in pencil over every dish.', 'Somebody has written: this drum is like this about everything.'],
      ['A thin book of poems, mended with bright tape. On the last page: lent to everybody on the third stair, in order. Pass it on.'],
    ] },
  },

  // ---------------------------------------------------------------------------------------------------- toys
  toys: {
    ownRug: true, tag: 'mend', emblem: 'ball', menu: 'The toy library', ambience: 'shop', reverb: 'room',
    pal: { wall: '#f0dcbc', dado: { h: 1.0, mat: 'paint', tint: '#2f8a85' }, floor: ['planks', '#d2ab7a'], ceil: '#f2e6d0', frame: '#2f8a85', plinth: '#226660', awning: ['#e8705a', '#e9b23c', '#2f8a85', '#f4ead2'], sign: ['#2f8a85', '#f4ead2', '#e9b23c'], felt: '#e8705a', beam: '#a07850', pipes: ['#e9b23c', '#2f8a85'], rug: ['#e9b23c', '#2f8a85'] },
    stage(C, a, k) {
      const n = Math.max(1, Math.min(2, Math.floor((a.u1 - a.u0) / 1.4))), us = along(a, n, 0.7);
      us.forEach((u, i) => {
        C.prop('shops-craft.steps', u, C.SY, mid(a), C.out, { w: 1.2, c: ['#e8705a', '#2f8a85'][i % 2] });
        const items = [['toys.cab', { body: '#e8705a' }], ['toys.top', { a: '#3b4f8f', b: '#e9b23c' }], ['toys.blocks', { seed: 3 + k, n: 4 }], ['toys.ball', { a: '#e9b23c', b: '#f4ead2' }], ['toys.drum', { a: '#3b4f8f' }], ['toys.glide', { a: '#e9b23c' }], ['toys.top', { a: '#7cab4e', b: '#f4ead2' }], ['toys.cab', { body: '#3b4f8f' }], ['toys.blocks', { seed: 9, n: 3 }]];
        for (let s = 0; s < 3; s++) for (let j = 0; j < 3; j++) { if ((s + j) % 3 === 1) continue; const it = items[(s * 3 + j + C.seed + i) % items.length]; const pt = C.V3(u - 0.35 + j * 0.35, C.SY + 0.185 + s * 0.18, mid(a) + 0.24 - s * 0.11); C.propAt(it[0], pt[0], pt[1], pt[2], C.out + C.r.f(-0.5, 0.5), it[1]); }
        C.prop('toys.kite', u, 3.2, mid(a) - 0.1, C.out, { a: ['#e8705a', '#3b4f8f'][i % 2], b: '#e9b23c', patch: '#2f8a85', up: 0.5, tail: 0.6 });
      });
    },
    unit(C, run, a, i) { goodsUnit(C, run, a, i, 'toys'); },
    work(C, w) { const p = C.pt(w, w.a, 0.45); C.propAt('shops-craft.worktable', p[0], 0, p[1], C.ryaw(w) + Math.PI, { t: 'toys', w: Math.min(1.6, w.len - 0.4), d: 0.7, top: '#c9a06a' }); const st = C.pt(w, w.a, 1.05); C.propAt('stool', st[0], 0, st[1], 0, { wood: '#a07850', h: 0.62 }, { noSpots: true }); C.spotW('work', st[0], st[1], C.ryaw(w), ['mend']); const gp = C.pt(w, w.a + 0.55, 0.3); C.propAt('craft.gluepot', gp[0], 0.9, gp[1], 0, { glaze: '#2f8a85' }); },
    floor(C, f) {
      C.prop('rug', f.u, 0, f.q, C.yaw(0, 1), { w: 2.4, d: 1.8, a: '#e9b23c', b: '#2f8a85' });
      C.prop('toys.table', f.u, 0, f.q, 0, { round: true, top: '#e9b23c' });
      for (let i = 0; i < 3; i++) { const an = i / 3 * Math.PI * 2 + 0.4, pp = C.V3(f.u + Math.cos(an) * 0.62, 0, f.q + Math.sin(an) * 0.62); const yaw = Math.atan2(pp[0] - C.P(f.u, f.q)[0], pp[2] - C.P(f.u, f.q)[1]) + Math.PI; C.propAt('toys.chair', pp[0], 0, pp[2], yaw, { col: ['#e8705a', '#2f8a85', '#3b4f8f'][i] }); }
      const t = C.V3(f.u, 0.5, f.q); C.propAt('toys.top', t[0] + 0.1, 0.5, t[2], 0, { a: '#e8705a', b: '#f4ead2' }); C.propAt('toys.blocks', t[0] - 0.12, 0.5, t[2] + 0.08, 0.3, { seed: 7, n: 3 });
      C.spot('play', f.u + 1.0, f.q + 0.4, C.yaw(-1, 0), ['spin', 'kids']); C.spot('play', f.u - 1.1, f.q - 0.3, C.yaw(1, 0), ['floor', 'kids']);
    },
    back(C, run) { const n = Math.max(1, Math.floor((run.a1 - run.a0) / 1.35)); for (let i = 0; i < n; i++) { const a = (run.a0 + run.a1) / 2 + (i - (n - 1) / 2) * 1.36; const p = C.pt(run, a, 0.21); C.propAt('shops-craft.goods', p[0], 0, p[1], C.ryaw(run), { t: 'toys', v: (C.seed + i + 1) % 3, w: 1.3 }); } },
    ceil(C, L) { const n = Math.max(1, Math.floor((L.aisleQ1 - L.aisleQ0) / 2)); for (let i = 0; i < n; i++) { const q = L.aisleQ0 + (i + 0.5) * (L.aisleQ1 - L.aisleQ0) / n; C.prop('toys.kite', L.aisleU + (i % 2 ? 0.6 : -0.6), 3.2, q, C.yaw(1, 0) + 0.4, { a: ['#e8705a', '#3b4f8f', '#7cab4e'][(i + C.seed) % 3], b: '#e9b23c', patch: '#f4ead2', up: 0.35, tail: 0.5 }); } },
    top(C, t) { C.propAt('toys.cab', t.x0, 0.92, t.z0, t.yaw + 0.4, { body: '#3b4f8f' }); C.drawAt(t.x1, 0.92, t.z1, t.yaw, (g) => { g.mat('paper', '#f4ead2'); g.box(-0.2, 0, -0.12, 0.1, 0.015, 0.12, { bevel: 0.003 }); g.mat('plain', '#3a3430'); for (let i = 0; i < 6; i++) g.box(-0.18, 0.016, -0.1 + i * 0.035, 0.05, 0.017, -0.095 + i * 0.035); }); },
    board: { title: 'Lent today', lines: ['Spinballs · free', 'Tops and cabs · free', 'Kites · free', 'Mended between borrowers'] },
    label: { text: 'Back scuffed', lines: ['bring it back, we will mend it'] },
    notice: { title: 'Borrow', lines: ['Everything', 'here is', 'lent.'] },
    services: [
      { id: 'ball', name: 'Borrow a spinball', desc: 'Soft, scuffed and true. Axis flies true, spin sinks, anti floats.', price: 0, loan: true, reply: ['Axis flies true, spin sinks, anti floats. Bring it back scuffed; that is how we know it was used.'], toast: 'A spinball, lent. It has been mended four times and is better for it.' },
      { id: 'top', name: 'Borrow a top', desc: 'A painted top. Spin it on a level floor and watch where it wanders.', price: 0, loan: true, reply: ['Spin it on the hall floor. It will drift a little anti, like everything.'], toast: 'A painted top, lent, its paint worn to the wood at the rim.' },
      { id: 'mend', name: 'Bring a toy to be mended', desc: 'Between borrowers, and yours too if there is a minute.', price: 0, reply: ['Leave it in the basket. It will go to the back of the queue and come out of it mended.'], toast: 'The keeper puts it in the basket with a tag and your name.' },
    ],
    greet: ['Hello. Everything here is lent, and everything here comes back mended.', 'Come in. Shoes off on the rug, please; the children make the rule, not me.', 'Mind the blocks. There is always one on the floor, and it is always the corner one.', 'Borrowing for yourself, or for a child? Either is allowed.'],
    about: [
      ['Every toy is mended between borrowers. Nothing new comes in unless something wears right out.', 'Most of these have been lent to three generations of one family.'],
      ['Toys are cheap to lend and dear to make. New mass is twenty-five kays a kilogram.', 'A wooden cab weighs a hundred grams and has been borrowed four hundred times.'],
      ['The children learn spinball before they can read. Axis flies true, spin sinks, anti floats.', 'We lend more spinballs than anything, and get them back softer.'],
      ['The wooden cabs are hung on pins, so the cabin stays level when you tip them, like the real ones.', 'Every child here has ridden in a cab and wants to know why their tea did not spill.'],
    ],
    band: { low: 'Down here we have more children than toys. Everything goes out in the morning and comes back at bath time.', middle: 'Parents borrow for the weekend and bring things back a week late with a note.', high: 'Up here grandparents borrow for visiting grandchildren, and keep the tops for themselves. At half a g a top spins a very long time.' },
    tryIt: { prompt: 'Spin a top on the table', sfx: 'brush', lines: [['The top spins, wanders a little anti, and settles.', 'Children say anti the way you would say left.'], ['You spin the top. It drifts, slowly, the way everything drifts in a drum, and falls over by a chair leg.'], ['The top hums round the table and stops against the blocks.', 'Somebody has carved a tiny cab in its rim.'], ['A good spin. It runs for a long time, then leans, then lies down with a click.']] },
  },

  // ---------------------------------------------------------------------------------------------------- second-hand
  second: {
    tag: 'write', emblem: 'star', menu: 'Second-hand', ambience: 'shop', reverb: 'room',
    pal: { wall: '#e7d9bf', dado: { h: 1.0, mat: 'paint', tint: '#5b3a6e' }, floor: ['tile', '#bfa890'], ceil: '#ece0cc', frame: '#3d2a4d', plinth: '#2e1f3a', awning: ['#5b3a6e', '#e8c26a'], sign: ['#3d2a4d', '#f2e3cf', '#e8c26a'], felt: '#5b3a6e', beam: '#4a3424', pipes: ['#e8c26a', '#5b3a6e'], rug: ['#5b3a6e', '#e8c26a'] },
    stage(C, a, k) {
      const us = along(a, Math.max(2, Math.min(3, Math.floor((a.u1 - a.u0) / 0.95))), 0.45);
      coatForm(C, us[0], mid(a), C.seed + k + 1, C.out + 0.3);
      C.prop('craft.chair', us[1], C.SY, mid(a), C.out - 0.3, { style: ['ladder', 'spindle', 'slat'][(C.seed + k) % 3], state: 'done', wood: '#4a2e1c', seat: 'rush' }, { noSpots: true });
      if (us.length > 2) { C.prop('shops-craft.crock', us[2] - 0.12, C.SY, mid(a) - 0.1, 0, { g: GLAZES[(C.seed + 3) % 12], h: 0.32, r: 0.13 }); C.prop('shops-craft.handlamp', us[2] + 0.2, C.SY, mid(a) + 0.15, 0.4, { c: '#33407a', on: true, glow: '#ffd9a0', k: 1.4 }); }
      for (const u of us) C.drawAt(...C.V3(u + 0.25, C.SY + 0.7, mid(a) - 0.2), C.out, (g) => { g.scale(2.2); drawTag(g, 0, 0, 0, { eye: '#e8c26a', paper: '#f3ead2' }); });
    },
    unit(C, run, a, i) { goodsUnit(C, run, a, i, 'second'); },
    work(C, w) { const p = C.pt(w, w.a - (w.len > 2.5 ? 0.35 : 0), 0.45); C.propAt('shops-craft.worktable', p[0], 0, p[1], C.ryaw(w) + Math.PI, { t: 'second', w: Math.min(1.5, w.len - 0.8), d: 0.75, top: '#7a5233' }); const st = C.pt(w, w.a - (w.len > 2.5 ? 0.35 : 0), 1.05); C.propAt('shops-craft.seat', st[0], 0, st[1], C.ryaw(w), { wood: '#4a3020', seat: '#5b3a6e' }, { noSpots: true }); C.spotW('work', st[0], st[1], C.ryaw(w), ['write'], 0.46); if (w.len > 2.5) { const d = C.pt(w, w.a + w.len / 2 - 0.4, 0.21); C.propAt('shops-craft.drawers', d[0], 0, d[1], C.ryaw(w), { w: 0.7, h: 1.1, d: 0.42, cols: 2, rows: 6, wood: '#5a3d28' }); } },
    floor(C, f) { C.prop('table', f.u, 0, f.q, C.yaw(0, 1), { w: Math.min(1.6, f.w), d: 0.85, wood: '#5a3a22', legs: 'four' }); C.drawAt(...C.V3(f.u, 0.74, f.q), C.yaw(0, 1), (g) => { drawCrock(g, -0.5, 0, -0.1, 0.24, 0.09, '#2f6f73', null); drawCrock(g, -0.25, 0, 0.15, 0.16, 0.07, '#a3563a', '#e9e1cf'); drawHandLamp(g, 0.05, 0, -0.05, '#8a2f3c', false); g.mat('paper', '#2f4f6f'); g.box(0.25, 0, -0.2, 0.45, 0.04, 0.05, { bevel: 0.004 }); g.mat('glaze', '#e9e1cf'); g.lathe(0.5, 0.2, [[0, 0], [0.06, 0], [0.1, 0.012], [0.098, 0.016], [0, 0.008]], { segs: 12 }); drawTag(g, -0.45, 0.2, 0.0, { eye: '#e8c26a' }); drawTag(g, 0.1, 0.18, 0.05, { eye: '#c8402e' }); }); C.prop('books.armchair', f.u + Math.min(1.6, f.w) / 2 + 0.5, 0, f.q + 0.2, C.yaw(-1, 0) - 0.3, { fabric: '#5b3a6e', mend: '#e8c26a', patch: '#2f6f73', mendAt: 'back' }); C.spot('browse', f.u - 0.3, f.q - 0.85, C.yaw(0, 1), ['shop']); C.sitPrompt = { u: f.u + Math.min(1.6, f.w) / 2 + 0.5, q: f.q + 0.2, yaw: C.yaw(-1, 0) - 0.3, y: 0.47 }; },
    back(C, run) { const n = Math.max(1, Math.floor((run.a1 - run.a0) / 1.35)); for (let i = 0; i < n; i++) { const a = (run.a0 + run.a1) / 2 + (i - (n - 1) / 2) * 1.36; const p = C.pt(run, a, 0.21); C.propAt('shops-craft.goods', p[0], 0, p[1], C.ryaw(run), { t: 'second', v: (C.seed + i + 2) % 3, w: 1.3 }); } },
    top(C, t) { C.propAt('cup', t.x0, 0.92, t.z0, 0, { glaze: '#e9e1cf', lid: '#5b3a6e' }); C.drawAt(t.x1, 0.92, t.z1, t.yaw, (g) => { g.mat('wood', '#5a3d28'); g.box(-0.15, 0, -0.1, 0.15, 0.1, 0.1, { bevel: 0.006 }); g.mat('paper', '#f3ead2'); for (let i = 0; i < 12; i++) g.box(-0.13 + i * 0.022, 0.06, -0.08, -0.125 + i * 0.022, 0.15, 0.08); }); },
    board: { title: 'Had before', lines: ['Every thing has its card', 'Read it before you buy', 'Older is dearer', 'Bring your old one in'] },
    label: { text: 'Its history on a card', lines: ['ask before you add to it'] },
    notice: { title: 'Third owner', lines: ['wanted for', 'almost', 'everything.'] },
    services: [
      { id: 'cup', name: 'A lidded cup, third owner', desc: 'Its card says: a hall cup, then a wedding cup, then a cup for one person\'s tea for forty years.', price: 0.6, reply: ['Add your name to the card when you get home. That is the price, really; the kays are for the card.'], toast: 'A lidded cup with its card, three names long, and a line for yours.' },
      { id: 'lamp', name: 'A hand lamp, second owner', desc: 'Run its week on a test wall last month. The card has the days.', price: 2.5, reply: ['Its last owner flew the Long Flight with it eleven times. You will be the twelfth.'], toast: 'A hand lamp with a long card and a new switch.' },
      { id: 'coat', name: 'A coat with six names', desc: 'Six names in the lining, mends in four colours. Fits most people, once it has been let out.', price: 8, reply: ['It has been let out four times and taken in twice. It will find you.'], toast: 'A coat with six names in the lining. You are the seventh.' },
    ],
    greet: ['Hello. Read the cards before you look at the price. The price comes from the card.', 'Come in. Everything here has been somebody\'s, and most things have been several people\'s.', 'Mind the chair by the door; it is the oldest thing in the shop, and it knows it.', 'If you want to sell something, bring its story. I do not take things without one.'],
    about: [
      ['Every thing in here comes with its history on a card. Who had it, what they used it for, what broke and who mended it.', 'A thing without a card is just a thing.'],
      ['Older is dearer. A chair with five owners has proved something a new chair has not.', 'The cards are how you know.'],
      ['New mass is twenty-five kays a kilogram, so nothing here is thrown away.', 'Things go round the block three or four times before they reach me, and then they go round again.'],
      ['People come in to read the cards and buy nothing.', 'I let them. It is the best part of the shop.'],
    ],
    band: { low: 'Down here it is outgrown things: shoes, coats, a cot that has had nine babies in it.', middle: 'People moving flats bring in what will not fit, and buy what will.', high: 'Up here it is whole households, when the time comes. The families bring the things and I write the cards with them. It takes a long time, and it should.' },
    card: { prompt: 'Read a card', title: 'Its card', gen: true },
  },

  // ---------------------------------------------------------------------------------------------------- wing-sleeves
  sleeves: {
    tag: 'sew', emblem: 'wing', menu: 'Wing-sleeves', ambience: 'shop', reverb: 'room',
    pal: { wall: '#dfe6dc', dado: { h: 1.0, mat: 'paint', tint: '#33407a' }, floor: ['planks', '#a8794f'], ceil: '#e6ece4', frame: '#26306b', plinth: '#1d2440', awning: ['#33407a', '#d6a640'], sign: ['#26306b', '#f1ead6', '#d6a640'], felt: '#33407a', beam: '#4a4a52', pipes: ['#d6a640', '#33407a'], rug: ['#33407a', '#d6a640'] },
    stage(C, a, k) { const n = Math.max(1, Math.min(2, Math.floor((a.u1 - a.u0) / 1.7))), us = along(a, n, 0.85); us.forEach((u, i) => C.prop('shops-craft.wingform', u, C.SY, mid(a) + 0.1, C.out + (i ? -0.25 : 0.2), { c: ['#26306b', '#2f6f8f', '#c8402e', '#e9e1cf'][(C.seed + i + k) % 4], c2: ['#d6a640', '#e9e1cf', '#26306b'][(i + k) % 3] })); },
    unit(C, run, a, i) {
      const y = C.ryaw(run), cols = ['#26306b', '#2f6f8f', '#c8402e', '#e9e1cf', '#3a3a44', '#d6a640'];
      if (i % 3 === 2) { goodsUnit(C, run, a, i, 'sleeves'); return; }
      const rail = C.pt(run, a, 0.3); C.drawAt(rail[0], 2.0, rail[1], y, (g) => { g.mat('cast', '#2a2622'); g.tube([[-0.62, 0, 0], [0.62, 0, 0]], 0.013, { segs: 6 }); for (const sx of [-1, 1]) g.box(sx * 0.62 - 0.015, -0.02, -0.3, sx * 0.62 + 0.015, 0.02, 0.0); });
      for (let j = 0; j < 3; j++) { const p = C.pt(run, a - 0.4 + j * 0.4, 0.3); C.propAt('shops-craft.sleevehang', p[0], 2.0, p[1], y + C.r.f(-0.2, 0.2), { c: cols[(i * 3 + j + C.seed) % 6], c2: cols[(i * 3 + j + C.seed + 2) % 6] }); }
      const sp = C.pt(run, a, 0.02); C.propAt('shops-craft.shoepegs', sp[0], 0.18, sp[1], y, { w: 1.3, v: (C.seed + i) % 3 });
    },
    work(C, w) { const p = C.pt(w, w.a, 0.5); C.propAt('shops-craft.worktable', p[0], 0, p[1], C.ryaw(w) + Math.PI, { t: 'sleeves', w: Math.min(2.0, w.len - 0.3), d: 0.85, top: '#a07850' }); const sp = C.pt(w, w.a, 1.25); C.spotW('work', sp[0], sp[1], C.ryaw(w) + Math.PI, ['sew']); },
    floor(C, f) { C.prop('bench', f.u, 0, f.q, C.yaw(0, -1), { w: Math.min(1.8, f.w), back: false, wood: '#6b4a2f' }); C.drawAt(...C.V3(f.u - 0.5, 0.46, f.q), C.yaw(0, -1), (g) => { g.mat('weave', '#3a3a44'); g.box(-0.04, 0, -0.06, 0.04, 0.09, 0.08, { bevel: 0.03 }); g.box(0.06, 0, -0.06, 0.14, 0.09, 0.08, { bevel: 0.03 }); }); C.sitPrompt = { u: f.u + 0.3, q: f.q, yaw: C.yaw(0, -1), y: 0.46 }; },
    back(C, run) { const len = Math.min(run.a1 - run.a0 - 0.3, 2.6); const p = C.pt(run, (run.a0 + run.a1) / 2, 0.02); C.propAt('shops-craft.shoepegs', p[0], 0.35, p[1], C.ryaw(run), { w: Math.round(len * 5) / 5, v: C.seed % 3 }); const q = C.pt(run, (run.a0 + run.a1) / 2, 0.02); C.propAt('shops-craft.shoepegs', q[0], 1.05, q[1], C.ryaw(run), { w: Math.round(len * 5) / 5, v: (C.seed + 1) % 3 }); },
    top(C, t) { C.drawAt(t.x0, 0.92, t.z0, t.yaw, (g) => { g.mat('paper', '#efe4c8'); g.box(-0.15, 0, -0.1, 0.15, 0.012, 0.1, { bevel: 0.003 }); g.mat('plain', '#3a3430'); for (let i = 0; i < 7; i++) g.box(-0.13, 0.013, -0.08 + i * 0.025, 0.1, 0.014, -0.076 + i * 0.025); }); C.propAt('shops-craft.handlamp', t.x1, 0.92, t.z1, 0, { c: '#33407a', on: false }); },
    board: { title: 'By the turn', lines: ['Wing-sleeves · 0.05', 'Children\'s · 0.05', 'Re-stitch a fin · 3.00', 'Your shoes are the deposit'] },
    label: { text: 'Wrist to hip', lines: ['every fin remade here'] },
    notice: { title: 'The Flight', lines: ['Sleeves by', 'block, in', 'shifts.'] },
    services: [
      { id: 'turn', name: 'Wing-sleeves, one turn', desc: 'An hour in a flying hall at the Spindle\'s end. Your shoes stay on the peg till you are back.', price: 0.05, reply: ['Shoes on the peg, please. Fins from the wrist to the hip; lengthwise is easy, crosswise they will teach you up there.'], toast: 'You hire a pair of wing-sleeves for a turn. Your shoes go on a peg with a number.' },
      { id: 'fin', name: 'Re-stitch a wing-sleeve fin', desc: 'Half an hour. You will want it before the Long Flight.', price: 3, reply: ['Half an hour. Every year the night before the Flight I do forty of these.'], toast: 'A fin re-stitched along its ribs in bright thread.' },
    ],
    greet: ['Hello. Shoes off if you are hiring; they are the deposit. Nobody walks home without them.', 'Come in. Mind the fins; they catch on everything except air.', 'Lengthwise or crosswise? Lengthwise is easy. Crosswise is a lesson.', 'Have you flown before? No? Then the Spindle will make you laugh, the first time.'],
    about: [
      ['Fins from the wrist to the hip. You hold your arms out and the air does the rest.', 'Within seventy-five metres of the axis you weigh almost nothing, so a pair of sleeves is all you need.'],
      ['While the sunline is lit it runs down the middle of the Spindle, so people fly only in the netted halls at its ends.', 'On the night of the Long Flight the line stays dark and the whole Spindle opens.'],
      ['Hired by the turn, which is an hour. Five hundredths of a kay; the shoes are worth more.', 'Nobody has ever left their shoes. Somebody once tried, and was walked home by the whole hall.'],
      ['I remake the fins every year before the Flight. Hundreds of thousands fly the axis with hand lamps that night.', 'Every pair in here has done it more times than I have.'],
    ],
    band: { low: 'Down here it is children\'s sleeves, short fins, bright colours. They grow out of them in a year.', middle: 'Most people fly once a year, on the Flight, and hire the night before. I do not sleep that night.', high: 'Up here at half a g you are already halfway there. The elders fly more than anybody, and slower, and better.' },
    card: { prompt: 'Read the tag on a pair of sleeves', title: 'The tag', texts: [
      ['Pair 41. Fins remade four times, ribs once. Flown on nineteen Long Flights.', 'The left fin pulls a little anti. Everybody who hires it says so, and comes back for it.'],
      ['Children\'s pair 6. Short fins, red. A note pinned to the tag: she did a full turn of the hall and did not stop laughing.'],
      ['Pair 112, deep blue. Remade from a pair older than the shop. The stitching on the ribs is gold.'],
      ['Pair 77. Crosswise only after a lesson, the tag says, in two different hands.'],
    ] },
    tryIt: { prompt: 'Try a sleeve on', sfx: 'sleeve-flap', lines: [['You hold your arms out. The fin runs from your wrist to your hip, light as paper.', 'Down here it does nothing. Near the axis it would carry you.'], ['The sleeve is longer than your arm and fastens at the hip. You flap once, without meaning to, and the keeper laughs.'], ['The fin catches on the rail, on the door, on the keeper. Everything except air.'], ['You stand with your arms out like a child on the Flight. It feels ridiculous, and you do not want to take it off.']] },
  },

  // ---------------------------------------------------------------------------------------------------- kites
  kites: {
    tag: 'sew', emblem: 'star', menu: 'Kites', ambience: 'shop', reverb: 'room',
    pal: { wall: '#f3e6c8', dado: { h: 1.0, mat: 'paint', tint: '#c9552e' }, floor: ['planks', '#b98a5a'], ceil: '#f2e8d4', frame: '#7a2d22', plinth: '#5a2018', awning: ['#c9552e', '#f3e6c8', '#2f6f73'], sign: ['#7a2d22', '#f3e6c8', '#e3b456'], felt: '#2f6f73', beam: '#8a6240', pipes: ['#2f6f73', '#c9552e'], rug: ['#2f6f73', '#e3b456'] },
    stage(C, a, k) {
      const n = Math.max(1, Math.min(3, Math.floor((a.u1 - a.u0) / 0.9))), us = along(a, n, 0.45);
      us.forEach((u, i) => C.prop('toys.kite', u, 3.2, mid(a) + (i % 2 ? 0.15 : -0.1), C.out + C.r.f(-0.3, 0.3), { a: CLOTH[(C.seed + i + k) % 12], b: CLOTH[(C.seed + i + k + 2) % 12], patch: CLOTH[(C.seed + i + k + 5) % 12], up: 0.4 + (i % 2) * 0.35, tail: 0.7 }));
      for (let i = 0; i < 3; i++) C.prop('shops-craft.reel', a.u0 + 0.3 + i * 0.25, C.SY, mid(a) + 0.25, C.out, { c: ['#e9e1cf', '#d6a640', '#c8402e'][i] });
    },
    unit(C, run, a, i) {
      if (i % 2 === 1) { goodsUnit(C, run, a, i, 'kites'); return; }
      const y = C.ryaw(run);
      for (let j = 0; j < 3; j++) { const p = C.pt(run, a - 0.4 + j * 0.4, 0.0); C.propAt('shops-craft.wallkite', p[0], 1.6 + (j % 2) * 0.4, p[1], y, { a: CLOTH[(i + j + C.seed) % 12], b: CLOTH[(i + j + C.seed + 3) % 12], patch: CLOTH[(i + j + C.seed + 6) % 12], s: 0.75 + (j % 2) * 0.15 }); }
      const b = C.pt(run, a, 0.2); C.propAt('table', b[0], 0, b[1], y, { w: 1.2, d: 0.38, h: 0.7, wood: '#6b4a2f' });
      for (let j = 0; j < 3; j++) { const p = C.pt(run, a - 0.35 + j * 0.35, 0.22); C.propAt('shops-craft.reel', p[0], 0.7, p[1], y, { c: ['#e9e1cf', '#d6a640', '#c8402e', '#2f6f73'][(j + i) % 4] }); }
    },
    work(C, w) { const p = C.pt(w, w.a, 0.5); C.propAt('shops-craft.worktable', p[0], 0, p[1], C.ryaw(w) + Math.PI, { t: 'kites', w: Math.min(2.0, w.len - 0.3), d: 0.85, top: '#c9a06a' }); const sp = C.pt(w, w.a, 1.25); C.spotW('work', sp[0], sp[1], C.ryaw(w) + Math.PI, ['sew']); const kt = C.pt(w, w.a + 0.6, 0.0); C.propAt('shops-craft.wallkite', kt[0], 1.9, kt[1], C.ryaw(w), { a: '#e9e1cf', b: '#e9e1cf', patch: '#c8402e', s: 1.1 }); },
    floor(C, f) { C.prop('crate', f.u, 0, f.q, C.yaw(0, 1), { w: 0.7, h: 0.5, d: 0.5, wood: '#a8794f' }); C.drawAt(...C.V3(f.u, 0.5, f.q), C.yaw(0, 1), (g) => { for (let i = 0; i < 14; i++) { const c = CLOTH[i % 12]; g.mat('weave', c, { sway: 0.5 }); const x = -0.28 + (i % 7) * 0.09, z = -0.15 + Math.floor(i / 7) * 0.3; g.quad([x, 0, z], [x + 0.03, 0, z], [x + 0.03 + Math.sin(i) * 0.1, -0.45 - (i % 3) * 0.1, z + 0.22], [x + Math.sin(i) * 0.1, -0.45 - (i % 3) * 0.1, z + 0.22], { double: true }); } }); C.prop('shops-craft.reel', f.u + 0.7, 0, f.q, 0.3, { c: '#d6a640' }); C.spot('browse', f.u, f.q - 0.75, C.yaw(0, 1), ['shop']); },
    back(C, run) { const n = Math.max(1, Math.floor((run.a1 - run.a0) / 1.35)); for (let i = 0; i < n; i++) { const a = (run.a0 + run.a1) / 2 + (i - (n - 1) / 2) * 1.36; const p = C.pt(run, a, 0.21); C.propAt('shops-craft.goods', p[0], 0, p[1], C.ryaw(run), { t: 'kites', v: (C.seed + i) % 3, w: 1.3 }); } },
    ceil(C, L) { const n = Math.max(2, Math.floor((L.aisleQ1 - L.aisleQ0) / 1.3)); for (let i = 0; i < n; i++) { const q = L.aisleQ0 + (i + 0.5) * (L.aisleQ1 - L.aisleQ0) / n; C.prop('toys.kite', L.aisleU + (i % 2 ? 0.7 : -0.5), 3.2, q, C.yaw(1, 0) + (i % 2 ? 0.6 : -0.4), { a: CLOTH[(i + C.seed) % 12], b: CLOTH[(i + C.seed + 4) % 12], patch: CLOTH[(i + C.seed + 7) % 12], up: 0.2, tail: 0.45 }); } },
    top(C, t) { C.propAt('shops-craft.reel', t.x0, 0.92, t.z0, t.yaw, { c: '#c8402e' }); C.drawAt(t.x1, 0.92, t.z1, t.yaw, (g) => { for (let i = 0; i < 5; i++) { g.mat('weave', CLOTH[i * 2]); g.box(-0.12 + i * 0.05, 0, -0.06, -0.08 + i * 0.05, 0.004, 0.06); } }); },
    board: { title: 'Kites', lines: ['Lent · free', 'A patch · 1.50', 'A new tail · 0.60', 'Line by the reel · 0.40'] },
    label: { text: 'Patches fly too', lines: ['every kite has been mended'] },
    notice: { title: 'No wind', lines: ['Walk.', 'The kite', 'will follow.'] },
    services: [
      { id: 'borrow', name: 'Borrow a kite', desc: 'Lent for a turn on the Hollow\'s kite field. Mended four times; the patches fly too.', price: 0, loan: true, reply: ['There is no wind in a drum. You walk, and it follows you. Walk anti and it climbs a little; walk spinward and it sulks.'], toast: 'A kite, lent, with three patches and a tail of bows.' },
      { id: 'patch', name: 'A patch', desc: 'Ten minutes and a square of offcut in a colour that does not match.', price: 1.5, reply: ['A patch in another colour. Patches fly too.'], toast: 'A bright square patched over the tear, stitched round in gold.' },
      { id: 'tail', name: 'A new tail', desc: 'Bows of offcut on a cord, two metres long.', price: 0.6, reply: ['A long tail keeps it steady when you turn. Children want them longer than they are.'], toast: 'A new tail of bright bows, two metres long.' },
    ],
    greet: ['Hello. Mind your head; the kites are lower than they look.', 'Come in. Every kite here flies, and every one of them has a patch to prove it.', 'You have flown a kite outside a drum, with wind. Then forget everything. Here you walk.', 'Borrow one for the kite field. Bring it back with a story and I will patch it free.'],
    about: [
      ['There is no wind inside a drum. A kite is flown by walking, on the Hollow\'s kite field, and it follows you like a younger brother.', 'Walk faster and it climbs.'],
      ['Spinward a kite flies a little heavier, anti a little lighter. Children learn which way to walk before they learn why.'],
      ['Every kite is patched, and the patches fly too. A kite with no patches has not been flown.'],
      ['Line is cellulose, spun fine. A reel is four hundred metres and lasts a family.', 'People bring their grandparents\' reels in to be rewound.'],
    ],
    band: { low: 'Down here the Hollow is a long lift up, so the children save their kites for the weekend and talk about them all week.', middle: 'People take a kite up on a Hollow turn. You can tell who got the turn by the tails on the stair.', high: 'Up here we are nearly in the Hollow. At half a g a kite hangs in the air a long time after you stop walking.' },
    card: { prompt: 'Read the patch book', title: 'The patch book', texts: [
      ['A ledger of every kite lent, and every patch it came back needing.', 'One kite has twenty-two patches and is still out every Saturday.'],
      ['A page headed: things kites have caught on. Orchard trees, mostly. A bandstand. The far bank, once, according to a child.'],
      ['The red kite on the left: lent three hundred and nine times. Patched in every colour the dyer has.'],
      ['A note in the back: if it does not fly, walk faster. If it still does not fly, walk anti.'],
    ] },
  },

  // ---------------------------------------------------------------------------------------------------- crocks
  crocks: {
    tag: 'mend', emblem: 'cup', menu: 'Crocks', ambience: 'shop', reverb: 'room',
    pal: { wall: '#e5d3b0', dado: { h: 1.1, mat: 'tile', tint: '#a8412b' }, floor: ['tile', '#bfa890'], ceil: '#eadcc2', frame: '#3a2a20', plinth: '#a8412b', awning: ['#a8412b', '#e5d3b0'], sign: ['#3a2a20', '#f3e6c8', '#2f6f73'], felt: '#2f6f73', beam: '#5a3d28', pipes: ['#2f6f73', '#a8412b'], rug: ['#2f6f73', '#d6a640'] },
    stage(C, a, k) {
      const n = Math.max(1, Math.min(2, Math.floor((a.u1 - a.u0) / 1.4))), us = along(a, n, 0.7);
      us.forEach((u, i) => { C.prop('shops-craft.steps', u, C.SY, mid(a), C.out, { w: 1.2, c: ['#2f6f73', '#a8412b'][i % 2] }); for (let s = 0; s < 3; s++) for (let j = 0; j < 3; j++) { const pt = C.V3(u - 0.36 + j * 0.36, C.SY + 0.185 + s * 0.18, mid(a) + 0.24 - s * 0.11); const h = 0.18 + ((s + j + k) % 3) * 0.05; C.propAt('shops-craft.crock', pt[0], pt[1], pt[2], C.r.f(0, 3), { g: GLAZES[(s * 3 + j + C.seed + i) % 12], h, r: h * 0.42, l: (s + j) % 4 === 1 ? GLAZES[(s + j + 5) % 12] : null }); } });
    },
    unit(C, run, a, i) {
      if (i % 2 === 1) { const y = C.ryaw(run); const p = C.pt(run, a, 0.21); C.propAt('shops-craft.drawers', p[0], 0, p[1], y, { w: 1.3, h: 0.86, d: 0.42, cols: 3, rows: 3, wood: '#5a3d28' }); const q = C.pt(run, a, 0.02); C.propAt('shops-craft.lidwall', q[0], 1.05, q[1], y, { w: 1.3, h: 1.0, v: (C.seed + i) % 3 }); }
      else goodsUnit(C, run, a, i, 'crocks');
    },
    work(C, w) { const k = C.pt(w, w.a + (w.len > 2.6 ? w.len / 2 - 0.55 : 0.6), 0.5); C.propAt('shops-craft.kiln', k[0], 0, k[1], C.ryaw(w), {}); const p = C.pt(w, w.a - (w.len > 2.6 ? 0.45 : 0.3), 0.45); C.propAt('shops-craft.worktable', p[0], 0, p[1], C.ryaw(w) + Math.PI, { t: 'crocks', w: Math.min(1.4, w.len - 1.1), d: 0.7, top: '#9a8a74' }); const sp = C.pt(w, w.a - (w.len > 2.6 ? 0.45 : 0.3), 1.1); C.spotW('work', sp[0], sp[1], C.ryaw(w) + Math.PI, ['mend']); },
    floor(C, f) { C.prop('table', f.u, 0, f.q, C.yaw(0, 1), { w: Math.min(1.5, f.w), d: 0.8, wood: '#5a3d28', legs: 'trestle' }); C.drawAt(...C.V3(f.u, 0.74, f.q), C.yaw(0, 1), (g) => { for (let i = 0; i < 4; i++) drawCrock(g, -0.55 + i * 0.32, 0, -0.18, 0.2, 0.08, GLAZES[(i * 3 + 1) % 12], null); for (let i = 0; i < 7; i++) { g.mat('glaze', GLAZES[(i * 5) % 12], { rough: -0.15 }); g.lathe(-0.6 + i * 0.19, 0.18, [[0.08, 0], [0.078, 0.01], [0.05, 0.03], [0.015, 0.04], [0, 0.05]], { segs: 10 }); } }); C.spot('browse', f.u, f.q - 0.8, C.yaw(0, 1), ['shop']); C.lidAt = { u: f.u, q: f.q - 0.6 }; },
    back(C, run) { const n = Math.max(1, Math.floor((run.a1 - run.a0) / 1.35)); for (let i = 0; i < n; i++) { const a = (run.a0 + run.a1) / 2 + (i - (n - 1) / 2) * 1.36; const p = C.pt(run, a, 0.21); C.propAt('shops-craft.goods', p[0], 0, p[1], C.ryaw(run), { t: 'crocks', v: (C.seed + i + 1) % 3, w: 1.3 }); } },
    top(C, t) { C.propAt('shops-craft.crock', t.x0, 0.92, t.z0, 0, { g: '#2f6f73', h: 0.2, r: 0.08, l: '#d6a640' }); C.drawAt(t.x1, 0.92, t.z1, t.yaw, (g) => { g.mat('paper', '#efe4c8'); g.box(-0.18, 0, -0.12, 0.12, 0.012, 0.12, { bevel: 0.003 }); g.mat('wood', '#c9a06a'); g.tube([[0.15, 0.01, -0.05], [0.35, 0.01, 0.05]], 0.006, { segs: 4 }); g.mat('weave', '#a8412b'); g.ball(0.35, 0.012, 0.05, 0.015, 0.01, 0.015, { segs: 6, rings: 4 }); }); },
    board: { title: 'Crocks', lines: ['Lent · free', 'A lid matched · free', 'Reglaze · 4.50', 'A new crock · 22.00'] },
    label: { text: 'Lids looking for crocks', lines: ['take one if it fits'] },
    notice: { title: 'Clay is dear', lines: ['Borrow.', 'Bring it', 'back full.'] },
    services: [
      { id: 'borrow', name: 'Borrow a crock', desc: 'Glazed, lidded and older than the shop. It goes back, ideally full.', price: 0, loan: true, reply: ['Bring it back full, if you can. That is the custom, not the rule.'], toast: 'A lidded crock, lent, with a card of everybody who has had it.' },
      { id: 'reglaze', name: 'Reglaze a crock', desc: 'Fifty grams of new glaze and three quarters of an hour, fired overnight in the kiln.', price: 4.5, reply: ['Overnight in the kiln, on the night price. It will come out a colour close to the old one, and not quite.'], toast: 'A crock left for reglazing, with a tag and your name.' },
    ],
    greet: ['Hello. Mind the lids on the table; none of them belongs to anything yet.', 'Come in. Everything here is lent. Clay is dear, and a crock lasts longer than a family.', 'If you have brought a lid, we will find its crock. If you have brought a crock, we will find its lid.', 'The kiln is on. It is always on at night; the kays are cheapest then.'],
    about: [
      ['A new crock is nearly a kilogram of new mass. Twenty kays before it is glazed.', 'So crocks are lent, round and round the block, and come back full of last year\'s larder.'],
      ['Lids get separated from their crocks more than anything in the drum.', 'I keep a wall of lost lids, and on a good day two of them find each other.'],
      ['I reglaze at night, in the electric kiln, on the night price.', 'The colours never quite match. People like that; you can see where a crock has been mended.'],
      ['At Knotnight the whole block makes its larder together, and every crock in here goes out at once.', 'They come back after Homecoming, sticky, and mostly with their own lids.'],
    ],
    band: { low: 'Down here families borrow the big crocks for Knotnight and bring them back sticky.', middle: 'Hall kitchens borrow by the dozen, and return by the eleven.', high: 'Up here at half a g a dropped lid falls slowly enough to catch. My breakages are the lowest on the layer.' },
    card: { prompt: 'Try a lid on a crock', title: 'Lids', lid: true, texts: [
      ['You try a teal lid on a cream crock. It rocks. You try a brown one. It sits down with a soft click, as if it had been waiting.', 'The keeper writes it in the book without looking up.'],
      ['Three lids, none of them right. The fourth fits so well you cannot see the join.'],
      ['The lid fits, but the glaze is another colour entirely. The keeper says that counts, and it does.'],
      ['Nothing fits. The keeper says that is most days, and that the lids are patient.'],
    ] },
  },
};

// The history of a second-hand thing, made up from its parts so no two shops read alike.
const HIST = {
  thing: ['A lidded cup', 'A ladle-back chair', 'A hand lamp', 'A coat with a red lining', 'A crock with a chipped lid', 'A child\'s spinball', 'A hall lid, numbered', 'A flute, short', 'A stool with one new leg', 'A felt baffle', 'A kite, much patched', 'A bowl from a hall'],
  first: ['made on this street', 'made in the Keel workshops', 'brought from Sorrel by a guest who stayed', 'made for a naming', 'made before the Count', 'made for a hall that seated four hundred'],
  then: ['then given at a wedding', 'then lent to three families on one stair', 'then carried on eleven Long Flights', 'then left at the Lost Property office for a year', 'then taken apart and remade by newly-weds', 'then kept on a high shelf for forty years'],
  mend: ['mended twice in gold thread', 'reglazed once, not quite the same colour', 'given a new handle in the year of the refuge', 'patched in Chervil green', 'its feet turned new from offcuts', 'never mended, which the card says is a wonder'],
  years: [38, 61, 94, 117, 140, 203, 260, 311],
};
export function historyCard(r) {
  const t = r.pick(HIST.thing), y = r.pick(HIST.years), n = r.i(2, 6), m = r.pick(HIST.mend);
  return [t + ', ' + y + ' years old, ' + r.pick(HIST.first) + ', ' + r.pick(HIST.then) + '.', n + ' owners before this shop. ' + m.charAt(0).toUpperCase() + m.slice(1) + '.', 'Older is dearer. The last line on the card is blank, for whoever has it next.'];
}
