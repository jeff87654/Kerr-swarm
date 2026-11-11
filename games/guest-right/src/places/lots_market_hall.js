// A second market: a covered hall of stalls where everything is second-hand or made within the block, and every thing
// has a card saying who had it before. From the street: a painted front with tall windows and a wide doorway. Inside:
// a concourse with the tea stand and the mending corner; then islands of stalls back to back, in aisles running inward,
// under a raised nave with lit clerestory panels, iron trusses, hung cloths and lamps; at the far end the weighing desk
// under a great lit dial. Built from the lot's own coordinates, so it fits any front and any size it is given.
import { column, railing } from '../world/kit2.js';
import { bunting } from '../world/props.js';
import { ledgerParts } from './ledger_parts.js';
import { craftParts } from './craft_parts.js';
import { marketGoods, GL, CLOTH, drawCoat } from './lots_market_goods.js';
import { local, walkways, pickBy, kays, tell, toast, menu, meter, bigFront, windowsIn } from './lots_market_kit.js';
import { MARKET_NAMES, KINDS, KIND_WEIGHTS, STALL_COLS, stallThings, AFTER_BUY, WEIGHER, WEIGH_LINES, WEIGH_SPELT, weighBand, BAND_RULE, TEA, TEA_MENU, MENDER, MEND_LINES, RULES, RULES_LINES } from './lots_market_words.js';
import { FIN } from './street_parts.js';
import { Rng, shadeHex, mixHex } from '../core/util.js';

const ISL = 4.3, WALLZ = 1.1, HI = 7.0, LO = 3.4;
void ledgerParts; void craftParts; void marketGoods;

export async function buildMarket(s, lot, plan, game, tick) {
  const L = local(s, lot), g = s.g, W = L.W, D = L.D, info = plan.info, seed = lot.seed >>> 0, r = new Rng(seed);
  const T = meter(s, game, 'market ' + lot.id + ' ' + W.toFixed(1) + 'x' + D.toFixed(1) + ' front ' + lot.front + ' ' + info.band, tick);
  try {
    // ---------------------------------------------------------------------------------------------------------------
    // the plan
    // ---------------------------------------------------------------------------------------------------------------
    const c = W / 2, half = W / 2;
    const k = Math.max(1, Math.min(3, Math.floor((half - 2 - WALLZ) / (ISL + 2.7))));
    const A = Math.min(3.4, (half - 2 - WALLZ - k * ISL) / k);
    const CA = W - 2 * (WALLZ + k * (ISL + A));
    const RW = Math.min(W - 4, CA + 2 * (ISL + A));            // the raised nave: the middle, the inner islands, the first aisles
    const R0 = c - RW / 2, R1 = c + RW / 2;
    const FQ = 5.0, BQ = D - 6.2, QR = 3.2;                     // the stall floor runs from FQ to BQ; the nave is raised from QR
    const twoSeg = BQ - FQ > 15, qm = (FQ + BQ) / 2;
    const segs = twoSeg ? [[FQ + 0.3, qm - 1.4], [qm + 1.4, BQ - 0.3]] : [[FQ + 0.3, BQ - 0.3]];
    const isl = [], aisles = [];
    for (const sg of [-1, 1]) for (let i = 0; i < k; i++) { isl.push({ pc: c + sg * (CA / 2 + i * (ISL + A) + ISL / 2), sg, i }); aisles.push({ p: c + sg * (CA / 2 + i * (ISL + A) + ISL + A / 2), sg, i }); }
    const nm = pickBy(seed, 1, MARKET_NAMES);
    const fin = FIN[(info.style * 3 + 1 + (seed % 3)) % FIN.length];
    const wall = mixHex(fin.trim, '#efe2c6', 0.6), dado = info.style % 2 ? '#2f6f73' : '#8a2f3c', iron = ['#2f4a44', '#7d3526', '#26306b'][seed % 3];
    const clip = L.clip(0, -0.3, 0, W, HI + 0.1, D);
    const lin = L.clip(0, -0.3, 0, W, LO + 0.05, D);

    // ---------------------------------------------------------------------------------------------------------------
    // the shell: floors, ceilings, walls, the front
    // ---------------------------------------------------------------------------------------------------------------
    T.lap('floor');
    L.floor(0, 0, W, D, 0, 'terrazzo', mixHex('#cdbf9f', fin.trim, 0.12));
    s.structure(() => {
      // the nave's floor in a darker tile, aisle lines in paint, a mosaic mat at the door
      g.mat('tile', '#a8946e'); L.box(c - CA / 2 + 0.1, 0.0, FQ - 0.4, c + CA / 2 - 0.1, 0.004, BQ + 0.4, { faces: 'Y' });
      g.mat('paint', dado); for (const a of aisles) { L.box(a.p - A / 2 + 0.15, 0.0, FQ, a.p - A / 2 + 0.22, 0.005, BQ, { faces: 'Y' }); L.box(a.p + A / 2 - 0.22, 0.0, FQ, a.p + A / 2 - 0.15, 0.005, BQ, { faces: 'Y' }); }
      g.mat('mosaic', dado); L.box(c - 1.6, 0.0, 0.4, c + 1.6, 0.006, 2.2, { faces: 'Y' });
      g.mat('mosaic', '#e8d9b8'); L.box(c - 1.4, 0.0, 0.55, c + 1.4, 0.009, 2.05, { faces: 'Y' });
    });
    L.ceiling(0, 0, W, QR, LO, 'panel', '#cfc4ac');
    L.ceiling(0, QR, R0, D, LO, 'panel', '#cfc4ac'); L.ceiling(R1, QR, W, D, LO, 'panel', '#cfc4ac');
    L.ceiling(R0, QR, R1, D, HI, 'wood', '#6b4a32');
    const wallOpts = { tint: wall, mat: 'plaster', dado: { h: 1.05, mat: 'tile', tint: dado }, skirt: '#3a2a20' };
    L.wallQ(0.08, 0.3, D, 0, LO, wallOpts); L.wallQ(W - 0.08, 0.3, D, 0, LO, wallOpts);
    await T();
    L.wallP(D - 0.08, 0, W, 0, LO, wallOpts);
    // the nave's high walls: the clerestory sides, the back above the desk, the gable over the concourse
    L.wallQ(R0, QR, D, LO, HI - LO, { tint: wall, mat: 'plaster', skirt: false }); L.wallQ(R1, QR, D, LO, HI - LO, { tint: wall, mat: 'plaster', skirt: false });
    L.wallP(D - 0.08, R0, R1, LO, HI - LO, { tint: wall, mat: 'plaster', skirt: false }); L.wallP(QR, R0, R1, LO, HI - LO, { tint: wall, mat: 'plaster', skirt: false });
    await T();
    T.lap('walls');
    // the front
    const door = [c - 1.6, 3.2, 2.62];
    const wins = windowsIn(1.0, c - 3.0, 1.7, 1.1).concat(windowsIn(c + 3.0, W - 1.0, 1.7, 1.1));
    await bigFront(L, lot, { door, wins, sill: 0.55, top: 2.5, fin, inner: { tint: wall, dado: { h: 1.05, mat: 'tile', tint: dado } }, fascia: { kind: 'fascia', text: nm[0], sub: nm[1], palette: [shadeHex(dado, 0.6), '#f6ead0', '#e8c26a'] }, fasciaW: 3.6, frame: shadeHex(fin.door, 0.9) }, T);
    await T();
    T.lap('shell');

    // ---------------------------------------------------------------------------------------------------------------
    // the nave: clerestory panels, trusses, edge beams on iron columns, hung cloths, the great dial
    // ---------------------------------------------------------------------------------------------------------------
    s.structure(() => {
      // lit panels in the clerestory: arched, warm, in painted surrounds
      for (const side of [-1, 1]) {
        const pw = side < 0 ? R0 + 0.09 : R1 - 0.09, inw = side < 0 ? 1 : -1;
        for (let q = QR + 1.4; q < D - 1.2; q += 3.0) {
          g.mat('paint', shadeHex(dado, 0.75)); L.box(pw - (inw < 0 ? 0.04 : 0), 4.0, q - 0.75, pw + (inw > 0 ? 0.04 : 0), 6.25, q + 0.75);
          g.mat('diffuser', '#ffe2b0', { emissive: 1.6, lamp: true });
          const pf = pw + inw * 0.045;
          for (let j = 0; j < 6; j++) { const t0 = j / 6 * Math.PI, t1 = (j + 1) / 6 * Math.PI, ym = 5.65 + Math.sin((t0 + t1) / 2) * 0.45; const qa = q - Math.cos(t0) * 0.6, qb = q - Math.cos(t1) * 0.6; L.box(Math.min(pf, pf + inw * 0.01), 4.1, Math.min(qa, qb), Math.max(pf, pf + inw * 0.01), ym, Math.max(qa, qb)); }
          g.mat('paint', '#3a2a20'); L.box(Math.min(pf, pf + inw * 0.02), 5.0, q - 0.6, Math.max(pf, pf + inw * 0.02), 5.04, q + 0.6); L.box(Math.min(pf, pf + inw * 0.02), 4.1, q - 0.02, Math.max(pf, pf + inw * 0.02), 6.05, q + 0.02);
        }
        // a painted band at the foot of the clerestory and a cornice under the high ceiling
        g.mat('tile', dado); L.box(pw - 0.05, LO, QR, pw + 0.05, LO + 0.35, D - 0.1);
        g.mat('wood', '#4a3020'); L.box(pw - 0.12, HI - 0.25, QR, pw + 0.12, HI, D - 0.1, { bevel: 0.01 });
      }
    });
    await T();
    // trusses across the nave: a bottom chord, a top chord, a king post and struts
    const TR = []; for (let q = QR + 2.4; q < D - 1.0; q += 3.6) TR.push(q);
    s.structure(() => {
      g.mat('cast', iron, { rough: -0.1 });
      for (const q of TR) {
        L.box(R0, 6.12, q - 0.07, R1, 6.26, q + 0.07, { bevel: 0.01 });
        L.box(R0, HI - 0.14, q - 0.06, R1, HI, q + 0.06);
        L.box(c - 0.05, 6.26, q - 0.05, c + 0.05, HI - 0.14, q + 0.05);
        const n = Math.max(2, Math.round(RW / 3));
        for (let j = 0; j < n; j++) { const pa = R0 + RW * j / n, pb = R0 + RW * (j + 1) / n; L.tube(j % 2 ? [[pa, 6.26, q], [pb, HI - 0.14, q]] : [[pa, HI - 0.14, q], [pb, 6.26, q]], 0.03, { segs: 5 }); }
      }
      // edge beams at the low ceiling's height, where the nave meets the aisles, and their iron columns
      for (const pe of [R0, R1]) L.box(pe - 0.12, LO - 0.32, QR, pe + 0.12, LO, D - 0.1, { bevel: 0.01 });
    });
    const colQ = [QR + 0.15, BQ + 0.35]; if (twoSeg) colQ.splice(1, 0, qm);
    for (const pe of [R0, R1]) for (const q of colQ) { const pt = L.P(pe, q); column(s, pt[0], 0, pt[1], LO - 0.32, { r: 0.11, mat: 'cast', tint: iron }); }
    await T();
    await T();
    // hung cloths: long banners down from the trusses, a swag between them, bunting across the gable
    s.deco(() => {
      for (let t = 0; t < TR.length; t++) {
        const q = TR[t], n = Math.max(2, Math.round(RW / 4.2));
        for (let j = 0; j < n; j++) {
          const p = R0 + RW * (j + 0.5) / n + ((t + j) % 2 ? 0.4 : -0.4), col = CLOTH[(seed + t * 3 + j * 5) % CLOTH.length], len = 1.4 + ((t * 7 + j * 3 + seed) % 5) * 0.22;
          g.mat((t + j) % 3 ? 'weave' : 'motif', col, { sway: 0.4 });
          L.sheet([p - 0.4, 6.1, q + 0.09], [p + 0.4, 6.1, q + 0.09], [p + 0.4, 6.1 - len, q + 0.1], [p - 0.4, 6.1 - len, q + 0.1], { nu: 2, nv: 3, ripple: 0.02, rippleN: 2 });
          g.mat('paint', mixHex(col, '#f1e2c2', 0.6)); L.box(p - 0.4, 6.1 - len - 0.03, q + 0.06, p + 0.4, 6.1 - len, q + 0.13);
        }
        if (t < TR.length - 1) for (const u of [0.2, 0.5, 0.8]) { const pp = R0 + RW * u; g.mat('stripe', CLOTH[(seed + t * 2 + Math.round(u * 10)) % CLOTH.length]); L.sheet([pp - 0.35, 6.1, q + 0.15], [pp - 0.35, 6.1, TR[t + 1] - 0.15], [pp + 0.35, 6.1, TR[t + 1] - 0.15], [pp + 0.35, 6.1, q + 0.15], { nu: 2, nv: 4, sag: 0.6 }); }
      }
    });
    { const a = L.pt(R0 + 0.3, 5.3, QR + 0.15), b = L.pt(R1 - 0.3, 5.3, QR + 0.15); bunting(s, a, b, { colors: CLOTH.slice(0, 6) }); }
    await T();
    // the great dial on the back wall over the weighing desk: lit from behind, brass ticks, one hand
    s.structure(() => {
      const qd = D - 0.17, yd = Math.min(4.9, HI - 1.15), rd = 0.95;
      g.mat('cast', '#b08a45', { rough: -0.2 }); L.at(c, yd, qd, Math.PI, (q) => { q.rotX(Math.PI / 2); q.lathe(0, 0, [[rd + 0.12, -0.06], [rd + 0.12, 0.04], [rd, 0.06]], { segs: 32, capTop: false, capBottom: false }); });
      g.mat('diffuser', '#fff1d0', { emissive: 2.4, lamp: true }); L.at(c, yd, qd - 0.04, Math.PI, (q) => { q.rotX(Math.PI / 2); q.cyl(0, 0, 0, rd, 0.01, { segs: 32 }); });
      g.mat('paint', '#2a2622');
      for (let i = 0; i < 40; i++) { const a = -Math.PI * 0.75 + i / 39 * Math.PI * 1.5, long = i % 5 === 0, r0 = rd * (long ? 0.74 : 0.84), r1 = rd * 0.92; L.tube([[c + Math.sin(a) * r0, yd + Math.cos(a) * r0, qd - 0.06], [c + Math.sin(a) * r1, yd + Math.cos(a) * r1, qd - 0.06]], long ? 0.012 : 0.006, { segs: 3 }); }
      g.mat('cast', '#8a2f3c'); const ha = -0.35 + (seed % 7) * 0.12; L.tube([[c - Math.sin(ha) * 0.12, yd - Math.cos(ha) * 0.12, qd - 0.08], [c + Math.sin(ha) * rd * 0.8, yd + Math.cos(ha) * rd * 0.8, qd - 0.08]], 0.016, { segs: 4 });
      g.mat('cast', '#b08a45'); L.at(c, yd, qd - 0.09, Math.PI, (q) => { q.rotX(Math.PI / 2); q.cyl(0, 0, 0, 0.06, 0.03, { segs: 12 }); });
    });
    await T();
    T.lap('nave');

    // ---------------------------------------------------------------------------------------------------------------
    // the stalls
    // ---------------------------------------------------------------------------------------------------------------
    const kw = KIND_WEIGHTS[info.band === 'low' ? 'low' : 'middle'], bag = [];
    // seven kinds to a market, chosen by the band's weights; then a bag of them in proportion
    const pool = kw.slice(), chosen = [];
    while (chosen.length < 7 && pool.length) { let t = 0; for (const e of pool) t += e[1]; let x = r.next() * t, i = 0; for (; i < pool.length - 1; i++) { x -= pool[i][1]; if (x <= 0) break; } chosen.push(pool[i]); pool.splice(i, 1); }
    for (const e of chosen) for (let i = 0; i < e[1]; i++) bag.push(e[0]);
    for (let i = bag.length - 1; i > 0; i--) { const j = r.i(0, i); const t = bag[i]; bag[i] = bag[j]; bag[j] = t; }
    let nStall = 0;
    // one stall width for the whole market (fewer kinds of prop to make), from the shortest run
    const swMin = Math.min(...segs.map((sg) => (sg[1] - sg[0]) / Math.max(1, Math.round((sg[1] - sg[0]) / 3.8))));
    const SW = swMin >= 4.15 ? 4.0 : swMin >= 3.75 ? 3.6 : swMin >= 3.35 ? 3.2 : 2.8;
    const stallAt = (pO, q, w, f, kind, n) => {
      const a = f > 0 ? Math.PI / 2 : -Math.PI / 2, ci = (seed + n * 5) % STALL_COLS.length, col = STALL_COLS[ci];
      T.time('stallprop', () => L.prop('lots-market.stall', pO, 0, q, a, { w, ci }));
      T.time('goods', () => L.prop('lots-market.goods', pO, 0, q, a, { k: kind, w, v: seed % 2 }));
      L.spot('counter', pO - f * 0.85, 0, q, a, { tags: ['stall', 'market', kind] });
      if (n % 3 === 1) L.spot('work', pO - f * 1.05, 0, q + w * 0.3, a + Math.PI, { tags: ['stall', 'market'] });
      L.spot('customer', pO + f * 0.98, 0, q - w * 0.22, a + Math.PI, { tags: ['market', 'shop'] });
      if (n % 2 === 0) L.spot('customer', pO + f * 0.98, 0, q + w * 0.25, a + Math.PI, { tags: ['market', 'shop'] });
      if (n % 4 === 3) L.spot('browse', pO + f * 1.25, 0, q, a + Math.PI + 0.3, { tags: ['market'] });
      const things = T.time('things', () => stallThings(kind, seed + n * 977, info)), K = KINDS[kind], keeper = { name: pickBy(seed + n, 7, ['Keeper', 'The keeper', 'Stallholder']), colour: col[0] === '#c9962e' ? '#e8c26a' : mixHex(col[0], '#ffffff', 0.45) };
      L.interact({ p: pO + f * 0.9, q, y: 1.1, radius: 1.25, prompt: 'Read the cards on the ' + K.label, onUse: async (gm) => {
        const items = things.map((t, i) => ({ id: 't' + i, name: t.name, desc: t.card[0], price: t.price, disabled: !!(gm.flags && gm.flags['market:' + lot.id + ':' + n + ':' + i]) || (gm.wallet && t.price > gm.wallet.kwh + 1e-6) }));
        const id = await menu(gm, { kicker: K.label.charAt(0).toUpperCase() + K.label.slice(1), title: 'On the stall', note: pickBy(seed + n, 11, K.notes), items });
        if (!id) return;
        const i = +id.slice(1), t = things[i];
        if (gm.wallet && !gm.wallet.spend(t.price, t.name)) { toast(gm, 'Not enough in your wallet today.'); return; }
        gm.flags = gm.flags || {}; gm.flags['market:' + lot.id + ':' + n + ':' + i] = true; gm.flags.market_bought = (gm.flags.market_bought || 0) + 1;
        if (gm.audio) gm.audio.ui('coin');
        await tell(gm, keeper, t.card.slice(1).concat([pickBy(seed + n + i, 13, AFTER_BUY)]));
        toast(gm, t.name + ', with its card. ' + kays(t.price) + ' kays.', 'gain');
      } });
    };
    for (let ii = 0; ii < isl.length; ii++) {
      const is = isl[ii];
      for (const sg of [-1, 1]) {
        const f = sg, pO = is.pc + f * 1.73;
        for (const sgm of segs) {
          const len = sgm[1] - sgm[0], n = Math.max(1, Math.round(len / 3.8)), sw = len / n, w = SW;
          for (let j = 0; j < n; j++) { stallAt(pO, sgm[0] + sw * (j + 0.5), w, f, bag[nStall % bag.length], nStall); nStall++; if (nStall % 2 === 0) await T(); }
        }
        // the island's spine: the backs of the two rows meet over a painted board, a card rail along the top
        s.furniture(() => { g.mat('paint', shadeHex(dado, 0.7)); for (const sgm of segs) L.box(is.pc - 0.03, 0, sgm[0], is.pc + 0.03, 2.75, sgm[1]); });
        await T();
      }
      // the island's ends: a lamp post with a plant on it, a card board
      s.furniture(() => {
        for (const sgm of segs) for (const qe of [sgm[0] - 0.15, sgm[1] + 0.15]) {
          g.mat('wood', '#5a3a26'); L.box(is.pc - 0.6, 0, qe - 0.1, is.pc + 0.6, 0.85, qe + 0.1, { bevel: 0.01 });
          g.mat('paper', '#f3ead6'); for (let j = 0; j < 5; j++) L.box(is.pc - 0.5 + j * 0.21, 0.5, qe + (qe < (FQ + BQ) / 2 ? -0.105 : 0.1), is.pc - 0.36 + j * 0.21, 0.72, qe + (qe < (FQ + BQ) / 2 ? -0.1 : 0.105));
        }
      });
      await T();
    }
    T.lap('stalls');
    // the side walls: racks of chairs and coats, crates under them
    for (const sd of [0, 1]) {
      const pr = sd ? W - 0.16 - 0.06 : 0.16 + 0.06, a = sd ? -Math.PI / 2 : Math.PI / 2;
      const len = BQ - FQ, n = Math.max(1, Math.round(len / 3.2)), sw = len / n;
      for (let j = 0; j < n; j++) {
        const q = FQ + sw * (j + 0.5);
        L.prop('lots-market.wallrack', pr, 0, q, a, { w: Math.round((sw - 0.2) * 10) / 10, v: (j + sd) % 3 });
        if (j % 2 === 0) L.spot('browse', sd ? W - 1.15 : 1.15, 0, q, a + Math.PI, { tags: ['market'] });
      }
      await T();
    }
    // a long nave gets trestle tables of things made in the block, and benches
    if (CA >= 7) {
      const t0 = FQ + 1.2, t1 = BQ - 1.6, cut = twoSeg ? [[t0, qm - 1.6], [qm + 1.6, t1]] : [[t0, t1]];
      for (const cc of cut) {
        const len = cc[1] - cc[0], n = Math.max(1, Math.round(len / 2.6));
        for (let j = 0; j < n; j++) {
          const q = cc[0] + len * (j + 0.5) / n;
          L.prop('table', c, 0, q, Math.PI / 2, { w: Math.min(2.2, len / n - 0.3), d: 0.85, h: 0.74, wood: '#7a5233', legs: 'trestle' });
          s.detail(() => {
            for (let i = 0; i < 5; i++) {
              const pp = c + (i % 2 ? 0.2 : -0.2), qq = q - 0.8 + i * 0.4, kk = (j + i + seed) % 3;
              if (kk === 0) { g.mat('glaze', GL[(i + j) % GL.length]); L.lathe(pp, qq, [[0, 0.74], [0.05, 0.74], [0.065, 0.85], [0.07, 0.86]], { segs: 8 }); g.mat('leafA', '#ffffff', { sway: 0.4 }); const pt = L.pt(pp, 0.85, qq); g.card(pt[0], 0.85, pt[2], 0.22, 0.26, i); g.card(pt[0], 0.85, pt[2], 0.22, 0.26, i + 1.6); }
              else if (kk === 1) { g.mat('glaze', '#dfe8e0', { rough: -0.4 }); L.lathe(pp, qq, [[0, 0.74], [0.045, 0.74], [0.05, 0.86], [0.035, 0.88]], { segs: 8 }); g.mat('paper', ['#e9dcc0', '#d4878a', '#2f6f73'][i % 3]); L.lathe(pp, qq, [[0.04, 0.875], [0.044, 0.89], [0, 0.9]], { segs: 8 }); }
              else { g.mat('weave', CLOTH[(i * 3 + j) % CLOTH.length]); L.box(pp - 0.16, 0.74, qq - 0.14, pp + 0.16, 0.74 + 0.04 * (1 + i % 3), qq + 0.14, { bevel: 0.01 }); }
              g.mat('paper', '#f3ead6'); L.box(pp + 0.12, 0.74, qq + 0.05, pp + 0.17, 0.743, qq + 0.09);
            }
          });
          for (const sd of [-1, 1]) L.spot('browse', c + sd * 0.95, 0, q + (j % 2 ? 0.4 : -0.4), sd > 0 ? -Math.PI / 2 : Math.PI / 2, { tags: ['market'] });
        }
      }
      if (twoSeg) for (const sd of [-1, 1]) { L.prop('bench', c + sd * 1.4, 0, qm, sd > 0 ? -Math.PI / 2 : Math.PI / 2, { w: 1.8, back: true, wood: '#6b4a2f' }, { noSpots: true }); for (const dq of [-0.45, 0.45]) L.spot('sit', c + sd * 1.25, 0.46, qm + dq, sd > 0 ? -Math.PI / 2 : Math.PI / 2, { tags: ['market', 'rest'] }); }
      await T();
    }
    T.lap('racks');

    // ---------------------------------------------------------------------------------------------------------------
    // the concourse: the tea stand on one side, the mending corner on the other, the rules by the door
    // ---------------------------------------------------------------------------------------------------------------
    const teaLow = seed % 2 === 0, tp = teaLow ? 1.35 : W - 1.35, tf = teaLow ? 1 : -1, tq = 2.7, ta = tf > 0 ? Math.PI / 2 : -Math.PI / 2;
    L.prop('counter', tp, 0, tq, ta, { w: 2.6, d: 0.62, h: 0.92, body: dado, top: '#b98a5a' }, { noSpots: true });
    L.prop('lots-market.urn', tp, 0.92, tq - 0.7, ta, {});
    L.prop('lots-market.cupshelf', tp - tf * 1.03, 0, tq, ta, { w: 1.3 });
    s.detail(() => {
      // a striped awning over the tea counter on two poles, and a slate with the prices
      const col = CLOTH[(seed + 2) % CLOTH.length];
      g.mat('cast', '#2a2622'); for (const dq of [-1.4, 1.4]) L.tube([[tp + tf * 0.4, 0, tq + dq], [tp + tf * 0.4, 2.55, tq + dq]], 0.025, { segs: 6 });
      g.mat('stripe', col); L.sheet([tp - tf * 0.9, 2.75, tq - 1.5], [tp - tf * 0.9, 2.75, tq + 1.5], [tp + tf * 0.55, 2.45, tq + 1.5], [tp + tf * 0.55, 2.45, tq - 1.5], { nu: 3, nv: 2, sag: 0.04 });
      g.mat('paint', col); L.box(Math.min(tp + tf * 0.5, tp + tf * 0.6), 2.25, tq - 1.5, Math.max(tp + tf * 0.5, tp + tf * 0.6), 2.47, tq + 1.5);
      g.mat('slate', '#2a3034'); L.box(Math.min(tp - tf * 1.18, tp - tf * 1.16), 1.8, tq - 0.45, Math.max(tp - tf * 1.18, tp - tf * 1.16), 2.35, tq + 0.45);
      g.mat('paint', '#f1ead8'); for (let i = 0; i < 4; i++) L.box(Math.min(tp - tf * 1.155, tp - tf * 1.15), 2.22 - i * 0.12, tq - 0.35, Math.max(tp - tf * 1.155, tp - tf * 1.15), 2.24 - i * 0.12, tq + 0.1 + (i % 2) * 0.15);
    });
    s.detail(() => {
      for (let i = 0; i < 6; i++) { const qq = tq + 0.1 + (i % 3) * 0.14, pp = tp + tf * (0.12 - Math.floor(i / 3) * 0.14); g.mat('glaze', GL[(i * 5 + seed) % GL.length]); L.lathe(pp, qq, [[0.035, 0.92], [0.045, 1.0]], { segs: 8, capBottom: false, capTop: false }); g.mat('glaze', GL[(i * 3 + 1) % GL.length]); L.lathe(pp, qq, [[0.047, 1.0], [0.02, 1.02], [0, 1.03]], { segs: 8 }); }
      g.mat('cane', '#c9a46a'); L.lathe(tp, tq + 0.85, [[0.15, 0.92], [0.16, 1.02]], { segs: 12, capBottom: false }); L.lathe(tp, tq + 0.85, [[0.165, 1.02], [0.12, 1.08], [0, 1.1]], { segs: 12 });
      g.mat('cast', '#b08a45'); L.lathe(tp + tf * 0.2, tq + 1.15, [[0.04, 0.92], [0.04, 0.94], [0.03, 0.97], [0.005, 1.0], [0, 1.02]], { segs: 10 });
    });
    L.spot('counter', tp - tf * 0.65, 0, tq, ta, { tags: ['market', 'tea', 'cook'] });
    for (let i = 0; i < 5; i++) L.spot('queue', tp + tf * (1.2 + i * 0.65), 0, tq - 0.2 + (i % 2) * 0.12, -ta, { tags: ['market', 'tea'] });
    // two leaners for standing with a cup
    for (const lq of [1.4, 4.1]) {
      const lp = tp + tf * 4.2;
      s.furniture(() => { g.mat('cast', '#2a2622'); L.lathe(lp, lq, [[0.22, 0], [0.18, 0.03], [0.035, 0.06], [0.03, 1.02]], { segs: 10 }); g.mat('wood', '#7a5233'); L.lathe(lp, lq, [[0.3, 1.02], [0.3, 1.06], [0, 1.06]], { segs: 14 }); });
      L.solid(lp - 0.3, 0, lq - 0.3, lp + 0.3, 1.06, lq + 0.3);
      L.prop('cup', lp + 0.1, 1.06, lq + 0.05, 0, { glaze: GL[seed % GL.length], lid: GL[(seed + 3) % GL.length] }, { noCollide: true });
      for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + 0.3; L.spot('chat', lp + Math.sin(a) * 0.6, 0, lq + Math.cos(a) * 0.6, a + Math.PI, { tags: ['market', 'tea'] }); }
    }
    const teaWho = { name: pickBy(seed, 21, ['Tea', 'The tea stand', 'The urn']), colour: '#e8c26a' };
    L.interact({ p: tp + tf * 1.1, q: tq, y: 1.1, radius: 1.5, prompt: 'Queue for tea', onUse: async (gm) => {
      await tell(gm, teaWho, pickBy(seed + (gm.clock ? Math.floor(gm.clock.hours) : 0), 23, TEA));
      const id = await menu(gm, { kicker: 'The tea stand', title: 'Under a lid', note: 'Cups go back on the rack.', items: TEA_MENU.map((m) => Object.assign({}, m, { disabled: gm.wallet && m.price > gm.wallet.kwh + 1e-6 })) });
      const it = TEA_MENU.find((m) => m.id === id); if (!it) return;
      if (gm.wallet && !gm.wallet.spend(it.price, it.name)) return;
      if (gm.audio) gm.audio.ui('coin');
      toast(gm, it.name + ', under a lid. ' + kays(it.price) + ' kays.', 'spend');
    } });
    await T();
    // the mending corner: a table with the sewing machine, a coat on a form, a rail of mended things, a low lamp
    const mp = teaLow ? W - 2.6 : 2.6, mf = teaLow ? -1 : 1, mq = 2.6;
    L.prop('craft.treadle', mp, 0, mq, Math.PI, { cloth: CLOTH[(seed + 3) % CLOTH.length], thread: '#e8c26a' }, { noSpots: true });
    L.prop('chair', mp, 0, mq - 0.62, 0, { wood: '#5a3a26', back: 'slat' }, { noSpots: true });
    L.prop('table', mp + mf * 1.15, 0, mq + 0.1, Math.PI / 2, { w: 1.1, d: 0.6, h: 0.74, wood: '#6f4e33' });
    L.prop('craft.form', mp - mf * 1.25, 0, mq + 0.3, mf > 0 ? Math.PI / 2 : -Math.PI / 2, { coat: CLOTH[(seed + 5) % CLOTH.length], trim: '#e9e1cf', mends: [{ kind: 'patch', c: '#e8c26a', a: 0.4, y: 1.2, w: 0.08, h: 0.07 }, { kind: 'gold', a: -0.5, y: 1.32, h: 0.12 }, { kind: 'darn', c: '#c8402e', a: 0.1, y: 1.05 }] }, { noSpots: true });
    L.prop('stool', mp + mf * 1.15, 0, mq - 0.75, 0, { wood: '#7a5a3a' }, { noSpots: true });
    s.detail(() => {
      // a rail of mended coats against the front wall
      const r0 = mp - mf * 0.4, r1 = mp + mf * 1.9;
      g.mat('cast', '#2a2622'); for (const pp of [r0, r1]) L.tube([[pp, 0, 0.62], [pp, 1.75, 0.62]], 0.02, { segs: 6 }); L.tube([[r0, 1.75, 0.62], [r1, 1.75, 0.62]], 0.018, { segs: 6 });
      for (let i = 0; i < 5; i++) {
        const pp = r0 + (r1 - r0) * (i + 0.5) / 5, col = CLOTH[(seed + i * 4) % CLOTH.length];
        L.at(pp, 1.72, 0.62, 0, (q) => drawCoat(q, 0, 0, 0, col, i % 2 ? '#e8c26a' : '#c8402e'));
        g.mat('paper', '#f3ead6'); L.box(pp + 0.12, 1.35, 0.7, pp + 0.17, 1.41, 0.705);
      }
      // a work lamp on the table, cloth and a tin of thread
      const tp2 = mp + mf * 1.15;
      g.mat('weave', CLOTH[(seed + 1) % CLOTH.length]); L.box(tp2 - 0.25, 0.74, mq - 0.1, tp2 + 0.2, 0.79, mq + 0.4, { bevel: 0.015 });
      g.mat('cast', '#7a6a4a'); L.cyl(tp2 + 0.15, 0.74, mq - 0.25, 0.06, 0.05, { segs: 10 });
      g.mat('knit', '#e8c26a'); L.cyl(tp2 - 0.1, 0.74, mq - 0.3, 0.02, 0.05, { segs: 7 }); g.mat('knit', '#2f6f8f'); L.cyl(tp2 - 0.02, 0.74, mq - 0.36, 0.02, 0.05, { segs: 7 });
    });
    L.spot('work', mp, 0, mq - 0.6, 0, { tags: ['mend', 'sew', 'market'] });
    L.spot('work', mp + mf * 1.15, 0, mq - 0.75, 0, { tags: ['mend', 'market'] });
    L.spot('customer', mp + mf * 1.0, 0, mq - 0.2, mf > 0 ? -Math.PI / 2 : Math.PI / 2, { tags: ['market'] });
    const mender = { name: pickBy(seed, 25, MENDER), colour: '#d4878a' };
    L.interact({ p: mp, q: mq - 0.7, y: 1.0, radius: 1.6, prompt: 'Look at the mending', onUse: (gm) => tell(gm, mender, pickBy(seed + (gm.clock ? gm.clock.day : 1), 27, MEND_LINES)) });
    // the rules beside the door
    await T();
    L.sign({ kind: 'board', title: RULES.title, lines: RULES.lines, palette: [shadeHex(dado, 0.55), '#f3e6c8', '#e8c26a'] }, c + 2.3, 1.62, 0.35, [0, 1], { w: 1.05, h: 0.74 });
    L.interact({ p: c + 2.3, q: 1.0, y: 1.5, radius: 1.3, prompt: 'Read the market rules', onUse: (gm) => tell(gm, nm[0].charAt(0) + nm[0].slice(1).toLowerCase(), pickBy(seed, 29, RULES_LINES).concat([BAND_RULE[info.band === 'low' ? 'low' : 'middle']])) });
    await T();
    // a planter each side of the door, inside
    for (const sd of [-1, 1]) L.prop('plant', c + sd * 2.0, 0, 0.7, 0, { kind: sd < 0 ? 'broad' : 'fern', size: 1.3, pot: dado });
    await T();
    T.lap('concourse');

    // ---------------------------------------------------------------------------------------------------------------
    // the back: the weighing desk under the dial, the card desk, the store door and its carts
    // ---------------------------------------------------------------------------------------------------------------
    const dq = D - 2.5, dw = Math.min(5, Math.max(3.2, CA + 1.2));
    L.prop('counter', c, 0, dq, Math.PI, { w: dw, d: 0.7, h: 0.95, body: '#3a2a20', top: '#b98a5a' }, { noSpots: true });
    L.prop('lots-market.balance', c - dw * 0.22, 0.95, dq, Math.PI, {});
    L.prop('station.scales', c + dw / 2 + 0.7, 0, dq + 0.1, Math.PI, {});
    L.prop('shelving', c, 0, D - 0.36, Math.PI, { w: Math.min(dw + 1, 5.5), h: 2.2, d: 0.4, shelves: 4, wood: '#6b4a2f', back: true }, { noSpots: true });
    s.detail(() => {
      // things waiting to be carded on the shelves behind, a ledger and a pot of red ink on the counter
      const sw = Math.min(dw + 1, 5.5), n = Math.round(sw / 0.6);
      for (let j = 0; j < 4; j++) for (let i = 0; i < n; i++) {
        const pp = c - sw / 2 + 0.25 + i * (sw - 0.5) / Math.max(1, n - 1), yy = 0.08 + j * 0.53, kk = (i * 3 + j + seed) % 4;
        if (kk === 0) { g.mat('glaze', GL[(i + j) % GL.length]); L.lathe(pp, D - 0.4, [[0, yy], [0.07, yy], [0.09, yy + 0.12], [0.07, yy + 0.2]], { segs: 8 }); }
        else if (kk === 1) { g.mat('weave', CLOTH[(i + j * 2) % CLOTH.length]); L.box(pp - 0.15, yy, D - 0.52, pp + 0.15, yy + 0.12, D - 0.25, { bevel: 0.015 }); }
        else if (kk === 2) { g.mat('wood', ['#a8794f', '#8a6240'][i % 2]); L.box(pp - 0.16, yy, D - 0.5, pp + 0.16, yy + 0.2, D - 0.26, { bevel: 0.008 }); }
        g.mat('paper', '#f3ead6'); L.box(pp - 0.03, yy + 0.02, D - 0.565, pp + 0.03, yy + 0.08, D - 0.56);
      }
      g.mat('paper', '#efe4c8'); L.box(c + 0.3, 0.95, dq - 0.2, c + 0.8, 0.98, dq + 0.15, { bevel: 0.004 });
      g.mat('glaze', '#8a2f3c'); L.cyl(c + 1.0, 0.95, dq, 0.035, 0.05, { segs: 8 });
      for (let i = 0; i < 9; i++) { g.mat('paper', '#f3ead6'); L.box(c - 0.1 + i * 0.05, 0.95, dq - 0.25 + (i % 3) * 0.04, c - 0.05 + i * 0.05, 0.952, dq - 0.21 + (i % 3) * 0.04); }
    });
    for (let i = 0; i < 3; i++) L.prop('crate', c + dw / 2 - 0.4 - i * 0.7, 0, dq - 0.9, 0.1 * i, { w: 0.55, h: 0.35 + (i % 2) * 0.1, d: 0.42, wood: ['#a8794f', '#8a6240', '#b98a5a'][i] }, { noCollide: i > 0 });
    s.detail(() => { g.mat('cast', '#b08a45'); L.lathe(c - dw / 2 + 0.3, dq - 0.1, [[0.05, 0.95], [0.05, 0.97], [0.035, 1.02], [0.008, 1.06], [0, 1.08]], { segs: 10 }); });
    L.spot('counter', c, 0, dq + 0.75, Math.PI, { tags: ['market', 'weigh'] });
    L.spot('work', c + dw * 0.3, 0, dq + 0.8, 0, { tags: ['market', 'card', 'write'] });
    for (let i = 0; i < 3; i++) L.spot('queue', c - 0.4 + (i % 2) * 0.3, 0, dq - 1.2 - i * 0.7, 0, { tags: ['market', 'weigh'] });
    const weigher = { name: pickBy(seed, 31, WEIGHER), colour: '#e8c26a' };
    L.interact({ p: c, q: dq - 0.9, y: 1.1, radius: 1.7, prompt: 'Ask the weigher', onUse: async (gm) => {
      const lines = pickBy(seed + (gm.clock ? gm.clock.day : 1), 33, WEIGH_LINES).concat([weighBand(info)]);
      if (gm.inv && gm.inv.has && gm.inv.has('spelt-mother') && !(gm.flags && gm.flags['market:weighed-mother'])) { gm.flags = gm.flags || {}; gm.flags['market:weighed-mother'] = true; for (const l of WEIGH_SPELT) lines.push(l); }
      await tell(gm, weigher, lines);
    } });
    // the store door on one side of the desk, carts and crates in front of it; the card desk on the other
    const sp = teaLow ? Math.max(R0 - 2.2, 2.2) : Math.min(R1 + 2.2, W - 2.2), cp = teaLow ? Math.min(R1 + 2.0, W - 2.4) : Math.max(R0 - 2.0, 2.4);
    s.structure(() => {
      g.mat('paint', '#4a3426'); L.box(sp - 1.1, 0, D - 0.18, sp + 1.1, 2.4, D - 0.15);
      g.mat('paint', fin.door); L.box(sp - 1.0, 0, D - 0.2, sp - 0.02, 2.3, D - 0.17, { bevel: 0.01 }); L.box(sp + 0.02, 0, D - 0.2, sp + 1.0, 2.3, D - 0.17, { bevel: 0.01 });
      g.mat('cast', '#b08a45'); L.box(sp - 0.1, 1.0, D - 0.23, sp - 0.06, 1.25, D - 0.2); L.box(sp + 0.06, 1.0, D - 0.23, sp + 0.1, 1.25, D - 0.2);
    });
    L.prop('station.handcart', sp - 0.6, 0, D - 2.2, 0.25, { wood: '#8a6a44', metal: iron });
    L.prop('station.sack', sp + 0.8, 0, D - 1.0, 0.4, { c: '#a8946a' });
    L.prop('crate', sp + 1.0, 0, D - 1.8, 0.2, { w: 0.6, h: 0.45, d: 0.5, wood: '#a8794f' });
    L.prop('crate', sp + 1.05, 0.45, D - 1.8, -0.1, { w: 0.5, h: 0.35, d: 0.42, wood: '#8a6240' }, { noCollide: true });
    L.spot('work', sp, 0, D - 1.4, Math.PI, { tags: ['market', 'carry'] });
    L.prop('table', cp, 0, D - 1.6, 0, { w: 1.4, d: 0.7, h: 0.74, wood: '#6f4e33' });
    L.prop('craft.drawers', cp, 0, D - 0.4, Math.PI, { w: 1.4, h: 1.2, cols: 5, rows: 4 }, { noSpots: true });
    L.prop('chair', cp, 0, D - 2.3, 0, { wood: '#5a3a26', back: 'hoop' }, { noSpots: true });
    L.prop('station.deskLamp', cp - 0.5, 0.74, D - 1.45, Math.PI, { shade: '#2f6f73' }, { noCollide: true });
    s.detail(() => { for (let i = 0; i < 14; i++) { g.mat('paper', '#f3ead6'); L.box(cp - 0.4 + (i % 7) * 0.1, 0.74, D - 1.75 + Math.floor(i / 7) * 0.08, cp - 0.34 + (i % 7) * 0.1, 0.743, D - 1.7 + Math.floor(i / 7) * 0.08); } });
    L.spot('sit', cp, 0.46, D - 2.3, 0, { tags: ['market', 'card', 'write'] });
    await T();
    T.lap('desk');

    // ---------------------------------------------------------------------------------------------------------------
    // light: a bar over every aisle, pendants down the nave, the concourse, the tea, the mending, the desk
    // ---------------------------------------------------------------------------------------------------------------
    for (const a of aisles) {
      const under = a.p > R0 && a.p < R1, y = under ? 3.3 : LO - 0.02;
      if (under) s.deco(() => { g.mat('cast', '#2a2622'); for (const q of TR) if (q > FQ && q < BQ) L.tube([[a.p, 3.3, q], [a.p, 6.12, q]], 0.008, { segs: 4 }); });
      L.lamp('strip', a.p, y, FQ + 0.3, { to: [a.p, y, BQ - 0.3], K: 3200, power: 1.6, range: 6.5, clip: lin });
    }
    const nN = Math.max(2, Math.round((D - QR - 4) / 8));
    for (let j = 0; j < nN; j++) { const q = QR + 3 + (D - QR - 7) * j / Math.max(1, nN - 1); L.lamp('globe', c, 4.3, q, { r: 0.34, drop: HI - 4.3, K: 3000, power: 3.2, range: 13, clip }); }
    s.deco(() => {
      // cloth lanterns in the nave, unlit but glowing, hung among the banners
      for (let j = 0; j < TR.length - 1; j++) for (const sd of [-1, 1]) {
        const p = c + sd * RW * 0.3, q = (TR[j] + TR[j + 1]) / 2, y = 4.6 + ((j + (sd > 0 ? 1 : 0)) % 2) * 0.35, t = ['#e8743b', '#f2c14e', '#d95d7a', '#3fa7a3', '#e9e2d0'][(j * 2 + (sd > 0 ? 1 : 0) + seed) % 5];
        g.mat('cast', '#2a2622'); L.tube([[p, y + 0.33, q], [p, HI - 0.05, q]], 0.008, { segs: 3 }); L.cyl(p, y + 0.3, q, 0.09, 0.04, { segs: 8 }); L.cyl(p, y - 0.34, q, 0.09, 0.04, { segs: 8 });
        g.mat('paper', t, { emissive: 1.8, lamp: true }); L.lathe(p, q, [[0.09, y - 0.3], [0.2, y - 0.18], [0.23, y], [0.2, y + 0.18], [0.09, y + 0.3]], { segs: 10, capTop: false, capBottom: false });
      }
    });
    for (const sd of [-1, 1]) L.lamp('globe', c + sd * Math.min(W / 4, 8), LO - 0.02, 2.0, { r: 0.2, drop: 0.55, K: 2800, power: 1.4, range: 8, clip: lin });
    L.lamp('lantern', tp + tf * 0.2, 2.05, tq, { tint: '#f2c14e', drop: 0.5, power: 1.2, range: 5.5, clip: lin });
    L.lamp('globe', mp, LO - 0.02, mq, { r: 0.16, drop: 1.25, K: 2700, power: 1.0, range: 4.5, clip: lin });
    L.lamp('spot', c - 0.4, HI - 0.02, dq + 0.2, { K: 3400, power: 2.2, range: 9, cone: [32, 14], clip });
    L.glowBox(0, 0, 0, W, LO, D, { sky: '#ffe2b8', ground: '#b89a74', power: 0.42 });
    L.glowBox(R0, LO, QR, R1, HI, D, { sky: '#ffe8c8', ground: '#a08060', power: 0.3 });
    T.lap('light');

    // ---------------------------------------------------------------------------------------------------------------
    // walkways, sound and the zone
    // ---------------------------------------------------------------------------------------------------------------
    const qc = FQ - 0.9, qb = BQ + 0.9, lines = [];
    const ends = [c].concat(aisles.map((a) => a.p)).sort((m, n) => m - n);
    lines.push([[c, -0.7], [c, 1.2], [c, qc]]);
    lines.push([[ends[0], qc], [ends[ends.length - 1], qc]]);
    lines.push([[ends[0], qb], [ends[ends.length - 1], qb]]);
    for (const p of ends) lines.push([[p, qc], [p, qb]]);
    if (twoSeg) lines.push([[ends[0], qm], [ends[ends.length - 1], qm]]);
    lines.push([[c, qb], [c, dq - 1.2]]);
    lines.push([[ends[0], qc], [tp + tf * 3.2, tq]]);
    walkways(L, lines, 1.3);
    L.loop('murmur', c, 1.4, (FQ + BQ) / 2, { vol: 0.42, radius: 30, param: 0.45 });
    L.loop('steam', tp, 1.2, tq - 0.7, { vol: 0.12, radius: 5 });
    const zb = L.B(0, 0, W, D);
    s.zoneBox({ id: lot.id, place: 'city-special', box: [zb[0], -0.5, zb[1], zb[2], HI, zb[3]], name: nm[0].charAt(0) + nm[0].slice(1).toLowerCase(), sub: info.name + ' · ' + nm[1], ambience: 'arcade', reverb: 'room', cell: info.key, headroom: 3.2 });
    void railing;
  } finally { T.done(); }
}
