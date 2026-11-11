// Parts for the block bath houses (lots_baths_bath.js): palettes, a pool cut into the floor, the vault over the pool
// hall, the tiled mural on its end wall (one of three, by seed), and the words.
import { quadN } from './baths_parts.js';
import { shadeHex, mixHex, Rng } from '../core/util.js';

// Palettes: wall tile, dado, deep trim, two accents, water, pool tile, vault plaster.
export const BATH_PALS = [
  { name: 'sea', cream: '#efe4cc', tile: '#e9dcbf', dado: '#6fa898', dadoD: '#3f7f73', deep: '#1d4a47', acc: '#d4553a', acc2: '#d9a441', water: '#3f8f9a', pool: '#7fbcb4', vault: '#ecd9b4', wood: '#4a3220', floor: '#ebdfc8', hex: '#a9cbbf' },
  { name: 'indigo', cream: '#efe6d2', tile: '#e6dcc6', dado: '#4f5f9a', dadoD: '#33407a', deep: '#1f2850', acc: '#d9a441', acc2: '#c9552e', water: '#3a7f9e', pool: '#8ab8cc', vault: '#e9dcc0', wood: '#3a2a20', floor: '#e4dccb', hex: '#b9c3d8' },
  { name: 'green', cream: '#f0e3c6', tile: '#eadbb8', dado: '#6b8f4e', dadoD: '#4a6b36', deep: '#24381f', acc: '#b8562e', acc2: '#e0b04a', water: '#3f8a86', pool: '#86c2ac', vault: '#eedcb2', wood: '#4f3522', floor: '#e8dcc0', hex: '#bccfa6' },
  { name: 'plum', cream: '#f1e2cc', tile: '#ecdcc4', dado: '#8a4a6e', dadoD: '#5b3a6e', deep: '#2e1f3a', acc: '#2f8a86', acc2: '#e3b456', water: '#3c8796', pool: '#94c4c4', vault: '#efdcc0', wood: '#4a3024', floor: '#ece0cc', hex: '#d0bfd0' },
];
export const BRASS = '#b8913f';

// A pool sunk in the floor, in frame coordinates: P = { x0, z0, x1, z1, water, bottom, tile }; o: { line, coping, water, ledges: [[x0,z0,x1,z1,top]] }
export function pool(s, P, o = {}) {
  const g = s.g;
  s.structure(() => {
    g.mat('tile', P.tile);
    g.box(P.x0, P.bottom, P.z0 - 0.06, P.x1, 0, P.z0, { faces: 'Z' });
    g.box(P.x0, P.bottom, P.z1, P.x1, 0, P.z1 + 0.06, { faces: 'z' });
    g.box(P.x0 - 0.06, P.bottom, P.z0, P.x0, 0, P.z1, { faces: 'X' });
    g.box(P.x1, P.bottom, P.z0, P.x1 + 0.06, 0, P.z1, { faces: 'x' });
    g.mat('tile', shadeHex(P.tile, 0.55)); g.box(P.x0, P.bottom - 0.02, P.z0, P.x1, P.bottom, P.z1, { faces: 'Y' });
    g.mat('tile', o.line || '#d4553a');
    const y0 = P.water + 0.04, y1 = P.water + 0.1;
    g.box(P.x0, y0, P.z0, P.x1, y1, P.z0 + 0.008, { faces: 'Z' }); g.box(P.x0, y0, P.z1 - 0.008, P.x1, y1, P.z1, { faces: 'z' });
    g.box(P.x0, y0, P.z0, P.x0 + 0.008, y1, P.z1, { faces: 'X' }); g.box(P.x1 - 0.008, y0, P.z0, P.x1, y1, P.z1, { faces: 'x' });
    g.mat('terrazzo', o.coping || '#efe2c6');
    const c = 0.32, l = 0.05;
    g.box(P.x0 - c, -0.05, P.z0 - c, P.x1 + c, 0.016, P.z0 + l, { bevel: 0.022 });
    g.box(P.x0 - c, -0.05, P.z1 - l, P.x1 + c, 0.016, P.z1 + c, { bevel: 0.022 });
    g.box(P.x0 - c, -0.05, P.z0 + l, P.x0 + l, 0.016, P.z1 - l, { bevel: 0.022 });
    g.box(P.x1 - l, -0.05, P.z0 + l, P.x1 + c, 0.016, P.z1 - l, { bevel: 0.022 });
    for (const L of o.ledges || []) { g.mat('tile', shadeHex(P.tile, 0.85)); g.box(L[0], P.bottom, L[1], L[2], L[4], L[3], { faces: 'YxXzZ' }); }
  });
  s.furniture(() => {
    g.mat('glaze', o.water || '#3f8f9a', { rough: -0.4 });
    const n = Math.max(1, Math.ceil((P.x1 - P.x0) / 4)), m = Math.max(1, Math.ceil((P.z1 - P.z0) / 4));
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
      const xa = P.x0 + (P.x1 - P.x0) * i / n, xb = P.x0 + (P.x1 - P.x0) * (i + 1) / n, za = P.z0 + (P.z1 - P.z0) * j / m, zb = P.z0 + (P.z1 - P.z0) * (j + 1) / m;
      g.quad([xa, P.water, zb], [xb, P.water, zb], [xb, P.water, za], [xa, P.water, za]);
    }
  });
  s.solid(P.x0, P.bottom - 0.5, P.z0, P.x1, P.bottom, P.z1, { surf: 'water' });
  s.solid(P.x0 - 0.1, P.bottom - 0.5, P.z0 - 0.1, P.x1 + 0.1, -0.5, P.z0);
  s.solid(P.x0 - 0.1, P.bottom - 0.5, P.z1, P.x1 + 0.1, -0.5, P.z1 + 0.1);
  s.solid(P.x0 - 0.1, P.bottom - 0.5, P.z0, P.x0, -0.5, P.z1);
  s.solid(P.x1, P.bottom - 0.5, P.z0, P.x1 + 0.1, -0.5, P.z1);
  for (const L of o.ledges || []) s.solid(L[0], P.bottom, L[1], L[2], L[4], L[3], { surf: 'water' });
}

// The arc of the vault over the nave: springs at spr, crown at crown, between local p = a0 and a1.
export function arcOf(a0, a1, spr, crown) {
  const c = (a0 + a1) / 2, half = (a1 - a0) / 2, rise = crown - spr, R = (half * half + rise * rise) / (2 * rise), cy = crown - R;
  return { c, R, cy, y: (p) => cy + Math.sqrt(Math.max(0, R * R - (p - c) * (p - c))) };
}

// The vault: a plaster shell along q from q0 to q1 over the nave, wooden ribs at `ribs` (local q), tie beams, a lamp strip at the crown.
export function vault(L, arc, a0, a1, q0, q1, ribs, pal) {
  const g = L.g, N = 20, pts = [];
  for (let i = 0; i <= N; i++) { const p = a0 + (a1 - a0) * i / N; pts.push([p, arc.y(p)]); }
  const nrm = (np, ny) => { const a = L.pt(0, 0, 0), b = L.pt(np, ny, 0); return [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; };
  const nq = Math.max(1, Math.ceil((q1 - q0) / 8));
  for (let k = 0; k < nq; k++) {
    const qa = q0 + (q1 - q0) * k / nq, qb = q0 + (q1 - q0) * (k + 1) / nq;
    g.mat('plaster', pal.vault);
    for (let i = 0; i < N; i++) {
      const a = pts[i], b = pts[i + 1], mp = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      quadN(g, L.pt(a[0], a[1], qa), L.pt(b[0], b[1], qa), L.pt(b[0], b[1], qb), L.pt(a[0], a[1], qb), nrm(arc.c - mp, arc.cy - my));
    }
    L.flush({ tier: 's' });
  }
  for (const qr of ribs) {
    g.mat('wood', pal.wood);
    for (let i = 0; i < N; i++) {
      const a = pts[i], b = pts[i + 1];
      const na = [arc.c - a[0], arc.cy - a[1]], nb = [arc.c - b[0], arc.cy - b[1]], la = Math.hypot(na[0], na[1]), lb = Math.hypot(nb[0], nb[1]);
      const ai = [a[0] + na[0] / la * 0.18, a[1] + na[1] / la * 0.18], bi = [b[0] + nb[0] / lb * 0.18, b[1] + nb[1] / lb * 0.18];
      const mp = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      quadN(g, L.pt(ai[0], ai[1], qr - 0.13), L.pt(bi[0], bi[1], qr - 0.13), L.pt(bi[0], bi[1], qr + 0.13), L.pt(ai[0], ai[1], qr + 0.13), nrm(arc.c - mp, arc.cy - my));
      quadN(g, L.pt(a[0], a[1], qr - 0.13), L.pt(b[0], b[1], qr - 0.13), L.pt(bi[0], bi[1], qr - 0.13), L.pt(ai[0], ai[1], qr - 0.13), nrm(0, 0).map((v, j) => v + (L.pt(0, 0, -1)[j] - L.pt(0, 0, 0)[j])));
      quadN(g, L.pt(a[0], a[1], qr + 0.13), L.pt(b[0], b[1], qr + 0.13), L.pt(bi[0], bi[1], qr + 0.13), L.pt(ai[0], ai[1], qr + 0.13), nrm(0, 0).map((v, j) => v + (L.pt(0, 0, 1)[j] - L.pt(0, 0, 0)[j])));
    }
    // a tie beam and its hanger rod
    const spr = arc.y(a0);
    L.box(a0, spr - 0.1, qr - 0.12, a1, spr + 0.2, qr + 0.12, { bevel: 0.02 });
    g.mat('cast', '#2a2622'); L.tube([[arc.c, spr + 0.2, qr], [arc.c, arc.cy + arc.R - 0.2, qr]], 0.025, { segs: 6 });
    g.mat('cast', BRASS); for (const sx of [-1, 1]) L.box(arc.c + sx * (a1 - a0) * 0.3 - 0.06, spr - 0.12, qr - 0.14, arc.c + sx * (a1 - a0) * 0.3 + 0.06, spr + 0.22, qr + 0.14, { bevel: 0.01 });
    L.flush({ tier: 's' });
  }
}

// The mural on the end wall (facing -q at q = qf): cells of mosaic between p = a0 and a1, from y0 up to top(p).
// kind 0: the drum seen end on, decks in rings round the sunline; 1: slow water, waves under a gold line; 2: a lattice of leaves.
export async function mural(L, a0, a1, y0, qf, top, kind, pal, seed, tk) {
  const g = L.g, cell = 0.16, r = new Rng(seed ^ 0x51ed), W = a1 - a0, nx = Math.round(W / cell), cw = W / nx;
  const yMax = top((a0 + a1) / 2), ny = Math.ceil((yMax - y0) / cell), fc = L.face(0, -1);
  const cx = (a0 + a1) / 2, cy = y0 + (yMax - y0) * 0.5, Rmax = Math.min(W / 2, yMax - y0) * 0.92;
  const ring = ['#2f2a26', '#6b5a48', pal.acc2, '#c9a46a', pal.dado, pal.dadoD, pal.acc, '#8a2f3c', '#7aa04e', '#4f7d3c'];
  const waves = [pal.deep, pal.dadoD, pal.dado, mixHex(pal.dado, '#ffffff', 0.35), pal.water, mixHex(pal.water, '#ffffff', 0.4)];
  let lit = 0;
  for (let i = 0; i < nx; i++) {
    const pa = a0 + i * cw, pb = pa + cw, pm = (pa + pb) / 2, yt = top(pm), colsOf = [];
    for (let j = 0; j < ny; j++) {
      const ya = y0 + j * cell, yb = Math.min(ya + cell, yt), ym = (ya + yb) / 2; if (yb - ya < 0.04) break;
      const edge = Math.min(pm - a0, a1 - pm, ym - y0, yt - ym);
      let col, em = 0;
      if (edge < cell) col = (i + j) % 2 ? pal.acc : pal.cream;
      else if (edge < cell * 2) col = pal.deep;
      else if (kind === 0) {
        const dx = pm - cx, dy = ym - cy, d = Math.hypot(dx, dy) / Rmax;
        if (d < 0.07) { col = '#fff6d8'; em = 1.2; }
        else if (d < 0.13) { col = '#f6dca0'; em = 0.35; }
        else if (d > 1.0) { const a = Math.atan2(dy, dx); col = Math.sin(a * 24) > 0 ? pal.cream : mixHex(pal.cream, pal.acc2, 0.35); }
        else if (d < 0.42) { const a = Math.atan2(dy, dx); col = (Math.sin(a * 14 + d * 30) > 0.3) ? '#7aa04e' : (d < 0.3 ? '#2f7f8a' : '#557d3c'); }
        else { const k = Math.floor((d - 0.42) / 0.058); col = ring[Math.min(ring.length - 1, k)]; if (Math.abs(((d - 0.42) / 0.058) % 1 - 0.5) > 0.42) col = shadeHex(col, 0.7); }
        if (Math.abs(dy) < cell * 0.6 && Math.abs(dx) / Rmax < 0.42 && d >= 0.13) { col = '#fbe6b4'; em = 0.45; }
      } else if (kind === 1) {
        const v = (ym - y0) / (yMax - y0), u = (pm - a0) / W;
        if (Math.abs(v - 0.78) < 0.025) { col = '#fff0c0'; em = 1.0; }
        else if (v > 0.8) col = mixHex('#fbe6b4', pal.acc2, Math.min(1, (v - 0.8) * 4));
        else { const w = Math.sin(u * 26 + Math.sin(v * 9) * 1.4 - v * 6) * 0.5 + 0.5; const band = Math.floor(v * 8 + w * 1.4); col = waves[Math.max(0, Math.min(waves.length - 1, band % waves.length))]; if (w > 0.94) col = '#efe4cc'; }
      } else {
        const u = (pm - cx) / 0.9, v = (ym - y0) / 0.9, fu = u - Math.floor(u) - 0.5, fv = v - Math.floor(v) - 0.5, dd = Math.abs(fu) + Math.abs(fv);
        const odd = (Math.floor(u) + Math.floor(v)) % 2 === 0;
        col = dd < 0.38 ? (odd ? pal.dado : pal.dadoD) : dd < 0.44 ? pal.acc2 : (Math.abs(fu) < 0.03 || Math.abs(fv) < 0.03) ? pal.acc : pal.cream;
        if (dd < 0.08) col = pal.acc;
        if (Math.abs(ym - (y0 + (yMax - y0) * 0.86)) < cell * 0.5) { col = '#fff0c0'; em = 0.9; }
      }
      colsOf.push([ya, yb, col, em]);
    }
    // runs of one colour up the column become one tile strip
    for (let k = 0; k < colsOf.length;) {
      let e = k; while (e + 1 < colsOf.length && colsOf[e + 1][2] === colsOf[k][2] && colsOf[e + 1][3] === colsOf[k][3] && e - k < 5) e++;
      const c = shadeHex(colsOf[k][2], 1 + r.f(-0.06, 0.06)), em = colsOf[k][3];
      g.mat('mosaic', c, em ? { emissive: em, lamp: true } : undefined);
      L.box(pa + 0.004, colsOf[k][0] + 0.004, qf - 0.012, pb - 0.004, colsOf[e][1] - 0.004, qf, { faces: fc });
      if (em > 0.9) lit++;
      k = e + 1;
    }
    if ((i & 7) === 7 || i === nx - 1) L.flush({ tier: 's' });
    if ((i & 31) === 31 && tk) await tk();
  }
  return lit;
}

// ---------------------------------------------------------------------------------------------------------------
// the words (every line a player reads in every block has four or more alternatives)
// ---------------------------------------------------------------------------------------------------------------
export const KEEPERS = ['Ines', 'Tamsin', 'Oyelaran', 'Bettany', 'Marguerite', 'Kofi', 'Rhiannon', 'Sunniva', 'Abebe', 'Lorcan', 'Yusra', 'Teodor'];
export const FASCIA_SUB = ['warm from the loop', 'on the sixty-five', 'wash first · soak second', 'robes · broth · hot water', 'open lamp-dawn to eleven'];
export const PRICE = 0.05;

export const GREET = {
  low: [
    ['Where did you sleep, and have you eaten. Then a bath.', 'Five hundredths of a kay, robe and broth with it. Children are free, and so are you if you are short.'],
    ['A wanderer. You have the look of eleven legs on a glide.', 'Five hundredths for a long one. That is the pumps and the scrubbing. The heat comes free.'],
    ['Mind the small ones in the warm pool, they are learning to float.', 'Five hundredths of a kay. No price for a child, and no price for anyone who cannot spare it.'],
    ['After school it is all children in here until six. Before that it is you and the night crews.', 'Five hundredths, if you can. Robe from the rail, cup from the urn.'],
  ],
  middle: [
    ['Have you eaten. Good. A bath, then.', 'Five hundredths of a kay for as long as you like. The loop heats it whether anyone gets in or not.'],
    ['Robe on the rail, cup from the urn, stool before the pool. That is the whole of it.', 'Five hundredths. We pay the pumps and the scrubbers out of it.'],
    ['Quiet hour is two to four, if you want the hot pool to yourself.', 'Five hundredths of a kay. Lids on your cups in the hall, please.'],
    ['You are from Spelt. Your coat says so.', 'Five hundredths for a long bath. Children free, guests welcome.'],
  ],
  high: [
    ['Take the rail by the steps. The water is slower up here and so are we.', 'Five hundredths of a kay. Most of my bathers are past a hundred and they all pay it, on principle.'],
    ['At half a g you float higher than you expect. Do not be alarmed.', 'Five hundredths. The robes are weighted at the hem, or they ride up.'],
    ['The hot pool is for the Tuesday ladies until three. They will make room. They always say they will not.', 'Five hundredths of a kay. The broth is free and very good for you.'],
    ['Go in slowly. A splash up here takes its time coming down and everyone watches it.', 'Five hundredths. Children free, though we see very few.'],
  ],
};
export const ASK_HEAT = [
  ['The heat is the food plant\'s leftovers, coming up the loop at sixty-five degrees.', 'Heating the water costs nothing. The pumps and the cleaning cost about five hundredths of a kay a bath.'],
  ['Every kitchen tap in the block runs off the same loop. The baths just take more of it.', 'If nobody bathed, the heat would go out through the radiators anyway. So we bathe.'],
  ['Sixty-five at the gauge, about forty-one in the hot pool, thirty-six in the warm, and the plunge is off the cold main.', 'It is the cheapest luxury in the drum. That is not a saying, it is the price list.'],
  ['The food plant cooks, the water warms, and the block soaks. Nobody arranged it. It just fell out that way.', 'The pumps draw a little. That is your five hundredths.'],
];
export const PAID = ['Five hundredths of a kay for a long bath. A robe, a towel and as much broth as you can drink.', 'Paid. Robe from the rail, wash first, then any pool you like until the lamps fade.', 'A bath, robe and broth. The tokens are older than the keeper and say SIXTY-FIVE on one side.', 'You pay, and are handed a towel warm from the pipe and a brass token on a cord.'];
export const NOT_PAID = ['Somebody nods you back toward the desk. Pay first, then wash, then soak.', 'A bather points at the desk without opening their eyes. Pay first.', 'The keeper catches your eye from across the hall and taps the desk.', 'A child tells you, very seriously, that you have to pay at the desk first.'];
export const BROTH = ['A lidded cup of Mill broth from the urn. Free, and hot for as long as the lid stays on.', 'Broth, peppery, under a lid. In heliox an open cup is cold in a minute.', 'A cup of broth with a sprig on the lid. Somebody here cut the herbs this morning.', 'Broth from the urn. The cups are numbered on the base and none of the numbers match.'];
export const WASHED = ['Wash first, soak second. Someone on the next stool hands you the soap without looking.', 'A bucket of hot, a bucket of cold, and a wooden dipper worn smooth by two centuries of hands.', 'The tap runs at sixty-five until you mix it. You learn that once.', 'A boy on the next stool is scrubbing his grandfather\'s back with great seriousness.'];
export const HOT = { low: ['Hot. The children are not allowed in until they are ten, and stand at the edge saying so.', 'Hot water to the chin. Somebody across the pool is asleep and nobody minds.', 'The hot pool. Your shoulders go first, then the rest of you.', 'Forty-one degrees by the brass thermometer on the step. It feels like more.'],
  middle: ['Hot water to the chin. Somebody across the pool is reading a paper book held well clear.', 'The hot pool. Your shoulders go first, then the rest of you.', 'Forty-one degrees by the brass thermometer on the step. It feels like more.', 'Hot. Half the block seems to be in here after the hall.'],
  high: ['The water closes over your shoulders slowly, as if it were thinking about it.', 'At half a g you float high, and the ripples cross the pool at a stroll.', 'Hot. The bathers here are old and very good at doing nothing.', 'A wave from somebody climbing in takes a long time to reach you. When it does it is gentle.'] };
export const WARM = ['The warm pool. Thirty-six degrees, which is about what you are.', 'Warm, shallow and quiet. People lie back with their ears under and listen to the pumps.', 'The warm pool, where the conversations are long and the children learn to float.', 'Warm water to the waist. You could stay here until the lamps fade.'];
export const SHALLOW_LOW = ['The children’s pool, waist deep on you and chin deep on them. You are splashed four times in a minute.', 'Shallow and warm. A girl of six is teaching a boy of five to float, loudly.', 'The children’s pool. Three aunts sit along the ledge with their eyes on everything.', 'Warm and shallow and very loud. Heliox makes every shriek a little higher.'];
export const COLD = { low: ['Cold. Properly cold. Everyone watching pretends not to.', 'Off the cold main. You come out pink and very awake.', 'The plunge. The children dare each other and then do not.', 'Cold enough to make you laugh out loud. People do.'],
  middle: ['Cold. Properly cold. Everyone watching pretends not to.', 'Off the cold main. You come out pink and very awake.', 'Cold enough to make you laugh out loud. People do.', 'In all at once, the sign says. Nobody has ever gone in slowly and enjoyed it.'],
  high: ['Cold. At half a g the water heaves up round you and takes a long time to settle.', 'The plunge. Your splash goes up and hangs and comes down a breath later.', 'Cold enough to make you laugh. An old man on the step applauds slowly.', 'Off the cold main. Up here they say it keeps you young. Nobody is.'] };
export const STEAM = ['The steam is where the block\'s gossip lives. Nobody looks at you and everybody knows you are new.', 'Wet heat and low voices. Someone pours a dipper on the brass box and the room sighs.', 'You cannot see the far wall. Someone on it is telling a long story about a chair.', 'Steam, tiles, and somebody humming four notes over and over.'];
export const REST = ['The felt drinks every sound. You wake warm, with the print of the slats on one cheek.', 'You sleep. When you wake there is a cup of tea beside you, lid on, that nobody claims.', 'The lamps are low and the loungers creak. Time goes somewhere.', 'Somebody has put a towel over your feet while you slept.'];
export const OVERHEARD = {
  low: ['If the court gives the Okafors their third, that is four on our landing under seven.', ['Did you vote sun or hall fund.', 'I voted for whichever one my daughter did not.'], 'My grandson can float now. Forty minutes of shouting and then he could.', ['The school wants a second spinball hall.', 'The school always wants a second spinball hall.'], 'They have changed the broth. I liked the old broth.', 'Three nights she stayed, a guest from Rue, and cooked on the fourth. Dumplings. We have not stopped talking about it.'],
  middle: [['Did you vote sun or hall fund.', 'I voted for whichever one my sister did not.'], 'The mender on our street has had my coat four days. She says it is telling her things.', 'I spend half my kays on other people\'s hours and I would not change it.', ['Is that a wanderer.', 'From Spelt, by the coat. Leave them be, they are soaking.'], 'If the Margin goes down again this year there will be a motion. There is always a motion.', 'They are painting the court ceiling again. Green this time, for the Quiet.'],
  high: ['A hundred and four, and I still come down for the hot pool on Thursdays.', ['Watch the drop off your elbow.', 'I know. It is still falling.'], 'When I was a girl the High decks were all strangers. Now they are all my friends, which is worse.', ['Do you remember the year the loop went cold for a day.', 'I remember everybody bathed at the Keel and nobody complained.'], 'My great-granddaughter is wandering this year. One card from every row. I have four.', 'At this weight my knees are thirty again. The rest of me declines to follow.'],
};
export const RULES = [
  { title: 'House rules', lines: ['Wash first, soak second.', 'Robes from the warm rail.', 'Lids on cups in the hall.', 'Hot pool: be brief.', 'No price for a child.', 'Lamps fade at eleven.'] },
  { title: 'The baths', lines: ['Pay at the desk, then wash.', 'Stools back where you found them.', 'Plunge: all at once.', 'Steam: speak low.', 'What is said in the steam', 'stays there. Mostly.'] },
  { title: 'Please', lines: ['Wash before the pools.', 'Lids on in the hall.', 'Children with an adult', 'in the hot pool.', 'Towels to the basket.', 'Lamps fade at eleven.'] },
  { title: 'Rules of the water', lines: ['Wash first.', 'Soak as long as you like.', 'Cups lidded, voices low.', 'Help the old onto the steps.', 'Robes back on the rail.', 'Nothing in the drains.'] },
];
export const RULES_HIGH = { title: 'At half a g', lines: ['Hold the rail on the steps.', 'Enter slowly: a splash', 'takes its time up here.', 'Weighted robes on the left.', 'Lids on, voices low.', 'Lamps fade at eleven.'] };
export const PLATE = ['The Sixty-Five · food plant waste heat · in at 65 degrees · please do not sit on the valves', 'The loop · in at 65 · out at 40 · ask before you turn anything', 'Sixty-Five main · keep clear of the valves · gauge read at lamp-dawn', 'Waste heat from the Keel · 65 degrees · the pumps are the only thing that costs'];

// With ?citylog: count what a lot draws (triangles, lights, work time). Returns a function that prints and restores.
export function meter(s, label) {
  if (typeof location === 'undefined' || !/citylog/.test(location.search)) return () => {};
  const f0 = s.flush, l0 = s.light, t0 = performance.now(); let tris = 0, lights = 0, work = 0, mark = t0, lt = 0, lw = 0; const laps = [];
  s.flush = function (o) { tris += this.g.buf.ni / 3; return f0.call(this, o); };
  s.light = function (o) { lights++; return l0.call(this, o); };
  const done = () => { s.flush = f0; s.light = l0; console.log('[lots-baths] ' + label + ': ' + Math.round(tris) + ' triangles, ' + lights + ' lights, ' + work.toFixed(1) + ' ms of work (' + (performance.now() - t0).toFixed(0) + ' ms elapsed) · ' + laps.join(' ')); };
  done.pause = () => { work += performance.now() - mark; };
  done.resume = () => { mark = performance.now(); };
  done.lap = (name) => { const w = work + performance.now() - mark; laps.push(name + ' ' + Math.round((tris - lt) / 1000) + 'k/' + (w - lw).toFixed(0) + 'ms'); lt = tris; lw = w; };
  return done;
}
