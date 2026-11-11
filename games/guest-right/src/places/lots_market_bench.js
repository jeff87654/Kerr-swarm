// Workshops by the hour: one long room of benches that anybody in the block may hire, with a tool wall (every tool on
// its painted outline, lent against your name), the keeper's desk with the hours board, racks of work waiting to be
// collected, a glue and finishing bench, and at the back a bay of machines behind a rail (a lathe, a press, a bandsaw,
// a drill and the kiln for crocks) under a raised roof with a hoist. Built from the lot's own coordinates.
import { railing } from '../world/kit2.js';
import { craftParts } from './craft_parts.js';
import { ledgerParts } from './ledger_parts.js';
import { benchProps } from './lots_market_bench_props.js';
import { drawChair, CLOTH } from './lots_market_goods.js';
import { local, walkways, pickBy, kays, tell, toast, menu, meter, bigFront, windowsIn, someone } from './lots_market_kit.js';
import { BENCH_NAMES, KEEPERS, HOUR_PRICE, BENCH_GREET, WORK_DONE, TOOL_LINES, RACK_LINES, MACHINE_LINES, hoursLine } from './lots_market_words.js';
import { FIN } from './street_parts.js';
import { Rng, shadeHex, mixHex } from '../core/util.js';

const LO = 3.4, HB = 6.2, TAGS = ['carve', 'mend', 'sew', 'tune', 'dye'];
void craftParts; void ledgerParts; void benchProps;

export async function buildWorkshops(s, lot, plan, game, tick) {
  const L = local(s, lot), g = s.g, W = L.W, D = L.D, info = plan.info, seed = lot.seed >>> 0, r = new Rng(seed);
  const T = meter(s, game, 'workshops ' + lot.id + ' ' + W.toFixed(1) + 'x' + D.toFixed(1) + ' front ' + lot.front + ' ' + info.band, tick);
  try {
    const c = W / 2, FZ = 5.0, BZ = D - 8.6, RQ = BZ + 0.3;
    // the tool wall is on one side, the finishing bench on the other: mirror p for the plan's sides
    const flip = seed % 2 === 1, mp = (p) => (flip ? W - p : p), ma = (a) => (flip ? -a : a);
    const nm = pickBy(seed, 1, BENCH_NAMES);
    const fin = FIN[(info.style * 2 + 3 + (seed % 4)) % FIN.length];
    const wall = mixHex('#e2d6bc', fin.trim, 0.25), dado = ['#2f4a3a', '#33407a', '#6b4a2f', '#7d3526'][seed % 4], green = '#2f4a3a';
    const clipLo = L.clip(0, -0.3, 0, W, LO + 0.05, BZ + 0.1), clipBay = L.clip(0, -0.3, BZ - 0.1, W, HB + 0.1, D);
    const keeper = { name: pickBy(seed, 3, KEEPERS), colour: '#e8c26a' };

    // ---------------------------------------------------------------------------------------------------------------
    // the shell
    // ---------------------------------------------------------------------------------------------------------------
    L.floor(0, 0, W, BZ, 0, 'planks', '#9a7048');
    L.floor(0, BZ, W, D, 0, 'deckplate', '#8a8a82');
    L.ceiling(0, 0, W, BZ, LO, 'wood', '#7a6650');
    L.ceiling(0, BZ, W, D, HB, 'panel', '#8f877a');
    const wo = { tint: wall, mat: 'plaster', dado: { h: 1.2, mat: 'paint', tint: dado }, skirt: '#2a2622' };
    L.wallQ(0.08, 0.3, BZ, 0, LO, wo); L.wallQ(W - 0.08, 0.3, BZ, 0, LO, wo);
    await T();
    L.wallQ(0.08, BZ, D, 0, HB, Object.assign({}, wo, { dado: { h: 1.2, mat: 'tile', tint: '#d8c9a0' } })); L.wallQ(W - 0.08, BZ, D, 0, HB, Object.assign({}, wo, { dado: { h: 1.2, mat: 'tile', tint: '#d8c9a0' } }));
    L.wallP(D - 0.08, 0, W, 0, HB, Object.assign({}, wo, { dado: { h: 1.2, mat: 'tile', tint: '#d8c9a0' } }));
    L.wallP(BZ, 0, W, LO, HB - LO, { tint: wall, mat: 'plaster', skirt: false });
    await T();
    const door = [c - 1.3, 2.6, 2.62];
    const wins = windowsIn(1.0, c - 2.6, 1.9, 1.0).concat(windowsIn(c + 2.6, W - 1.0, 1.9, 1.0));
    await bigFront(L, lot, { door, wins, sill: 0.6, top: 2.5, fin, inner: { tint: wall, dado: { h: 1.2, mat: 'paint', tint: dado } }, fascia: { kind: 'fascia', text: nm[0], sub: nm[1], palette: ['#2a2622', '#f1e6cf', '#e8c242'] }, fasciaW: 3.4, frame: '#2a2622' }, T);
    T.lap('shell');

    // ceiling services over the long room: two ducts, cable trays, a hose reel or two; the bay's lit panels and hoist
    s.structure(() => {
      g.mat('brushed', '#a8a49a'); for (const pp of [W * 0.25, W * 0.75]) L.tube([[pp, 3.12, 0.6], [pp, 3.12, BZ - 0.2]], 0.16, { segs: 10 });
      g.mat('cast', '#3a3530'); for (let q = 2; q < BZ; q += 3) for (const pp of [W * 0.25, W * 0.75]) L.box(pp - 0.2, 3.28, q - 0.02, pp + 0.2, LO, q + 0.02, { faces: 'qQy' });
      g.mat('wood', '#4a3a2c'); L.box(c - 0.15, 3.25, 0.6, c + 0.15, 3.28, BZ - 0.2, { faces: 'yYpP' });
      // beams across the room over every row of benches: the shades hang from them
      g.mat('paint', '#4a3a2c'); for (let q = FZ + 1.8; q <= BZ - 1.2; q += 3.0) L.box(0.16, LO - 0.22, q - 0.1, W - 0.16, LO, q + 0.1, { faces: 'yqQ' });
      // the gable over the rail: a painted band and the bay's number
      g.mat('paint', '#e8c242'); L.box(0.2, LO, BZ + 0.09, W - 0.2, LO + 0.25, BZ + 0.1, { faces: 'Q' });
      g.mat('paint', '#2a2622'); for (let p = 0.4; p < W - 0.4; p += 0.5) L.box(p, LO + 0.03, BZ + 0.1, p + 0.22, LO + 0.22, BZ + 0.105, { faces: 'Q' });
      // lit panels high on the back wall of the bay
      for (let p = 2; p < W - 2; p += 4.2) { g.mat('paint', '#3a3530'); L.box(p - 0.95, 3.95, D - 0.2, p + 0.95, 5.65, D - 0.16, { faces: 'q' }); g.mat('diffuser', '#fff0d0', { emissive: 1.5, lamp: true }); L.box(p - 0.85, 4.05, D - 0.22, p + 0.85, 5.55, D - 0.2, { faces: 'q' }); g.mat('paint', '#3a3530'); L.box(p - 0.02, 4.05, D - 0.24, p + 0.02, 5.55, D - 0.22, { faces: 'q' }); L.box(p - 0.85, 4.78, D - 0.24, p + 0.85, 4.82, D - 0.22, { faces: 'q' }); }
      // the hoist: a beam across the bay on brackets, a trolley, a chain and a hook
      g.mat('paint', '#e8c242'); L.box(0.2, 5.6, D - 4.0, W - 0.2, 5.85, D - 3.8, { faces: 'yYqQ' });
      g.mat('paint', '#2a2622'); for (const pp of [0.25, W - 0.25]) L.box(pp - 0.12, 4.9, D - 4.05, pp + 0.12, 5.6, D - 3.75, { faces: 'pPqQ' });
      const hp = mp(Math.min(W - 3, c + 3.5));
      g.mat('cast', '#3c4148'); L.box(hp - 0.25, 5.4, D - 4.1, hp + 0.25, 5.6, D - 3.7, { faces: 'pPqQy' });
      g.mat('cast', '#7a7670'); L.tube([[hp, 5.4, D - 3.9], [hp, 2.5, D - 3.9]], 0.012, { segs: 4 });
      g.mat('paint', '#c8402e'); L.box(hp - 0.08, 2.3, D - 3.98, hp + 0.08, 2.5, D - 3.82, { faces: 'pPqQy' });
      // the dust duct along the back wall, dropping to the bandsaw and the lathe
      g.mat('brushed', '#b4b8b6'); L.tube([[0.4, 3.6, D - 0.45], [W - 0.4, 3.6, D - 0.45]], 0.15, { segs: 10 });
    });
    await T();

    // ---------------------------------------------------------------------------------------------------------------
    // the benches
    // ---------------------------------------------------------------------------------------------------------------
    const rows = []; for (let q = FZ + 1.9; q <= BZ - 1.3; q += 3.0) rows.push(q);
    const halves = [[mp(2.3), c - 1.3], [c + 1.3, mp(W - 1.6)]].map((h) => [Math.min(h[0], h[1]), Math.max(h[0], h[1])]);
    let nb = 0;
    const woods = ['#8a6a44', '#9a7448', '#7a5a3a', '#a07850'];
    for (let j = 0; j < rows.length; j++) {
      const q = rows[j];
      for (const h of halves) {
        const len = h[1] - h[0], n = Math.max(1, Math.floor((len + 1.0) / 3.0)), step = len / n;
        for (let i = 0; i < n; i++) {
          const p = h[0] + step * (i + 0.5), t = TAGS[(nb + seed) % TAGS.length], used = (nb * 7 + seed) % 5 !== 0;
          L.prop('lots-market.bench', p, 0, q, Math.PI, { w: 2.0, wood: woods[(nb + j) % woods.length] });
          if (used) { L.prop('lots-market.project', p, 0.86, q, Math.PI, { t, v: (nb + seed) % 3 }, { noCollide: true }); L.spot('work', p - 0.3, 0, q - 0.85, 0, { tags: [t, 'workshop', 'bench'] }); }
          L.prop('lots-market.shade', p, 2.25, q - 0.1, 0, { c: ['#2f5a44', '#2f5a44', '#26306b', '#7d3526'][seed % 4] }, { noCollide: true });
          if (nb % 3 === 1) { L.prop('stool', p + 0.55, 0, q - 0.75, 0, { wood: '#7a5a3a' }, { noSpots: true }); L.spot('sit', p + 0.55, 0.46, q - 0.75, 0, { tags: ['workshop', t] }); }
          nb++;
        }
      }
      await T();
    }
    T.lap('benches');

    // ---------------------------------------------------------------------------------------------------------------
    // the tool wall: boards of tools on their painted outlines, two high, the book of names at its end
    // ---------------------------------------------------------------------------------------------------------------
    {
      const q0 = FZ + 0.4, q1 = BZ - 0.6, n = Math.max(1, Math.floor((q1 - q0) / 1.95)), step = (q1 - q0) / n;
      for (let i = 0; i < n; i++) {
        const q = q0 + step * (i + 0.5);
        for (const y of [0.95, 1.95]) L.prop('craft.toolboard', mp(0.19), y, q, ma(Math.PI / 2), { w: 1.8, h: 0.85, board: i % 2 ? '#2f4a3a' : '#33407a' }, { noCollide: true });
        if (i % 2 === 0) L.spot('browse', mp(1.0), 0, q, ma(-Math.PI / 2), { tags: ['workshop', 'tools'] });
      }
      L.solid(Math.min(mp(0.16), mp(0.3)), 0, q0, Math.max(mp(0.16), mp(0.3)), 2.9, q1);
      // names chalked in the empty outlines: little white scrawls
      s.deco(() => { g.mat('paint', '#f1ead8'); for (let i = 0; i < n * 3; i++) { const q = q0 + 0.3 + ((i * 1.37 + seed % 7) % (q1 - q0 - 0.6)), y = (i % 2 ? 1.2 : 2.2) + (i % 3) * 0.12; L.box(Math.min(mp(0.205), mp(0.21)), y, q, Math.max(mp(0.205), mp(0.21)), y + 0.02, q + 0.16); } });
      // the book of names on a lectern
      const lp = mp(1.0), lq = FZ - 0.5;
      s.furniture(() => {
        g.mat('wood', '#5a3a26'); L.box(lp - 0.04, 0, lq - 0.04, lp + 0.04, 1.0, lq + 0.04, { faces: 'pPqQ' }); L.box(lp - 0.25, 0, lq - 0.2, lp + 0.25, 0.04, lq + 0.2);
        L.at(lp, 1.0, lq, ma(Math.PI / 2), (q) => { q.rotX(-0.35); q.mat('wood', '#5a3a26'); q.box(-0.25, 0, -0.18, 0.25, 0.03, 0.18); q.mat('paper', '#efe4c8'); q.box(-0.22, 0.03, -0.15, 0.22, 0.05, 0.15); q.mat('plain', '#3a3430'); for (let i = 0; i < 8; i++) q.box(-0.18, 0.051, -0.12 + i * 0.03, 0.18 - (i % 3) * 0.05, 0.052, -0.115 + i * 0.03); });
      });
      L.solid(lp - 0.25, 0, lq - 0.2, lp + 0.25, 1.1, lq + 0.2);
      L.spot('counter', mp(0.55), 0, lq + 0.5, ma(Math.PI / 2), { tags: ['workshop', 'tools', 'keeper'] });
      L.interact({ p: mp(1.3), q: (q0 + q1) / 2, y: 1.4, radius: 1.8, prompt: 'Borrow a tool against your name', onUse: async (gm) => {
        await tell(gm, keeper, pickBy(seed + (gm.clock ? gm.clock.day : 1), 5, TOOL_LINES));
        gm.flags = gm.flags || {}; if (!gm.flags['workshops:tool:' + lot.id]) { gm.flags['workshops:tool:' + lot.id] = true; toast(gm, 'A tool, lent against your name. It goes back before the lamps go down.'); }
      } });
      L.interact({ p: lp + (flip ? -0.6 : 0.6), q: lq, y: 1.1, radius: 1.0, prompt: 'Read the book of names', onUse: (gm) => { const rr = new Rng(seed + 77); tell(gm, 'The book of names', [someone(rr) + ': a spokeshave. ' + someone(rr) + ': four clamps, two back. ' + someone(rr) + ': the small saw, "for the cradle".', 'Each line is crossed through when the tool comes home. Very few lines are not.']); } });
    }
    await T();
    T.lap('tools');

    // ---------------------------------------------------------------------------------------------------------------
    // the front: the keeper's desk and the hours board, racks of work waiting, the glue and finishing bench
    // ---------------------------------------------------------------------------------------------------------------
    const dp = mp(Math.min(W - 6.5, c + 3.6)), dq = 2.6, da = ma(-Math.PI / 2);
    L.prop('counter', dp, 0, dq, da, { w: 2.4, d: 0.65, h: 0.95, body: dado, top: '#b98a5a' }, { noSpots: true });
    L.prop('station.deskLamp', dp, 0.95, dq - 0.7, da, { shade: '#2f6f73' }, { noCollide: true });
    s.detail(() => {
      g.mat('paper', '#efe4c8'); L.box(dp - 0.2, 0.95, dq - 0.1, dp + 0.2, 0.98, dq + 0.35);
      g.mat('wood', '#c9a06a'); for (let i = 0; i < 12; i++) L.box(dp - 0.15 + (i % 4) * 0.08, 0.95, dq + 0.55 + Math.floor(i / 4) * 0.08, dp - 0.1 + (i % 4) * 0.08, 0.96, dq + 0.6 + Math.floor(i / 4) * 0.08);
      g.mat('slate', '#2a3034'); L.box(dp - 0.12, 0.95, dq - 0.55, dp + 0.12, 0.96, dq - 0.3);
    });
    L.spot('counter', mp(Math.min(W - 6.5, c + 3.6) + 0.75), 0, dq, da, { tags: ['workshop', 'keeper'] });
    for (let i = 0; i < 3; i++) L.spot('queue', mp(Math.min(W - 6.5, c + 3.6) - 0.85 - i * 0.6), 0, dq + 0.2 - i * 0.1, ma(Math.PI / 2), { tags: ['workshop'] });
    await T();
    // the partition behind the desk, with the hours board on it
    const hp = mp(Math.min(W - 5.2, c + 5.0));
    s.furniture(() => {
      g.mat('wood', '#5a3a26'); L.box(hp - 0.06, 0, 0.8, hp + 0.06, 2.4, 4.4, { faces: 'pPqQY' });
      g.mat('paint', green); L.box(hp - 0.07, 0.9, 0.9, hp + 0.07, 2.3, 4.3, { faces: 'pP' });
    });
    L.solid(hp - 0.06, 0, 0.8, hp + 0.06, 2.4, 4.4);
    s.deco(() => {
      const f2 = hp + (flip ? -0.075 : 0.075), rn = new Rng(seed + 41);
      for (let i = 0; i < 9; i++) { const q = 1.1 + (i % 3) * 1.05 + rn.f(-0.1, 0.1), y = 1.2 + Math.floor(i / 3) * 0.38 + rn.f(-0.05, 0.05); g.mat('paper', rn.pick(['#efe4c8', '#f3ead6', '#e8c26a', '#d4878a'])); L.box(Math.min(f2, f2 + (flip ? -0.004 : 0.004)), y, q, Math.max(f2, f2 + (flip ? -0.004 : 0.004)), y + rn.f(0.22, 0.3), q + rn.f(0.18, 0.24)); }
      g.mat('wood', '#c9a06a'); L.box(Math.min(f2, f2 + (flip ? -0.03 : 0.03)), 2.15, 1.0, Math.max(f2, f2 + (flip ? -0.03 : 0.03)), 2.2, 4.2);
    });
    const hoursRng = new Rng(seed + 5), names = [someone(hoursRng), someone(hoursRng), someone(hoursRng), someone(hoursRng)];
    await T();
    L.sign({ kind: 'board', title: 'Benches by the hour', lines: ['benches 1 to ' + nb + '|' + kays(HOUR_PRICE.day) + ' an hour', 'after nine|' + kays(HOUR_PRICE.night), 'the machines|' + kays(HOUR_PRICE.machine) + ', signed', 'bench 4|' + names[0], 'the lathe|' + names[1], 'the kiln tonight|' + names[2]], palette: ['#22362b', '#f3e6c8', '#e8c242'] }, hp + (flip ? 0.075 : -0.075), 1.65, 2.6, [flip ? 1 : -1, 0], { w: 1.1, h: 0.75 });
    await T();
    s.deco(() => { g.mat('paint', '#f1ead8'); for (let i = 0; i < 6; i++) { const q = 1.2 + (i % 3) * 0.9, y = 0.95 + Math.floor(i / 3) * 0.2; L.box(Math.min(hp + (flip ? 0.075 : -0.075), hp + (flip ? 0.08 : -0.08)), y, q, Math.max(hp + (flip ? 0.075 : -0.075), hp + (flip ? 0.08 : -0.08)), y + 0.025, q + 0.5 - (i % 2) * 0.15); } });
    L.interact({ p: hp + (flip ? 1.0 : -1.0), q: 3.6, y: 1.5, radius: 1.2, prompt: 'Read the hours board', onUse: (gm) => tell(gm, nm[0].charAt(0) + nm[0].slice(1).toLowerCase(), [hoursLine((seed + (gm.clock ? gm.clock.day : 0)) % 4, seed, nb, info), hoursLine((seed + 1 + (gm.clock ? gm.clock.day : 0)) % 4, seed + 9, nb, info)]) });
    L.interact({ p: dp + (flip ? 0.9 : -0.9), q: dq, y: 1.1, radius: 1.4, prompt: 'Hire a bench for an hour', onUse: async (gm) => {
      const h = gm.clock ? gm.clock.hours : 12, night = h >= 21 || h < 6, price = night ? HOUR_PRICE.night : HOUR_PRICE.day;
      await tell(gm, keeper, pickBy(seed + Math.floor(h), 7, BENCH_GREET).concat(['At ' + info.g.toFixed(2) + ' of a g a plank is lighter to carry up the stair than at the rim, and exactly as dear to buy. Mind the offcut box.']));
      const id = await menu(gm, { kicker: nm[0].charAt(0) + nm[0].slice(1).toLowerCase(), title: 'Benches by the hour', note: night ? 'The night price: the light is cheapest now.' : 'Half price after nine.', items: [
        { id: 'bench', name: 'A bench for an hour', desc: 'A bench, its light and the tools on the wall, lent against your name.', price, disabled: gm.wallet && price > gm.wallet.kwh + 1e-6 },
        { id: 'lathe', name: 'A bench and the lathe for an hour', desc: 'Signed for, with somebody who knows it beside you.', price: HOUR_PRICE.machine, disabled: gm.wallet && HOUR_PRICE.machine > gm.wallet.kwh + 1e-6 }] });
      if (!id) return;
      const cost = id === 'lathe' ? HOUR_PRICE.machine : price;
      if (gm.wallet && !gm.wallet.spend(cost, id === 'lathe' ? 'The lathe for an hour' : 'A bench for an hour')) { toast(gm, 'Not enough in your wallet today.'); return; }
      gm.flags = gm.flags || {}; const k = gm.flags.workshop_hours = (gm.flags.workshop_hours || 0) + 1;
      if (gm.ui && gm.ui.fade) await gm.ui.fade(true, 0.4);
      if (gm.clock && gm.clock.skipTo) gm.clock.skipTo((h + 1) % 24);
      if (gm.ui && gm.ui.fade) await gm.ui.fade(false, 0.4);
      toast(gm, WORK_DONE[(seed + k) % WORK_DONE.length], 'gain');
    } });
    await T();
    // a bench for waiting by the door
    L.prop('bench', mp(Math.min(W - 6.5, c + 3.6) - 0.4), 0, 0.75, 0, { w: 1.6, back: true, wood: '#6b4a2f' }, { noSpots: true });
    for (const dpp of [-0.4, 0.4]) L.spot('sit', mp(Math.min(W - 6.5, c + 3.6) - 0.4 + dpp), 0.46, 0.85, 0, { tags: ['workshop', 'wait'] });
    // racks of work waiting to be collected, inside the front windows on the other side of the door
    {
      const p0 = mp(1.2), p1 = c - (flip ? -2.2 : 2.2), a0 = Math.min(p0, p1), a1 = Math.max(p0, p1), n = Math.max(1, Math.floor((a1 - a0) / 2.3)), step = (a1 - a0) / n;
      for (let i = 0; i < n; i++) { L.prop('lots-market.waiting', a0 + step * (i + 0.5), 0, 0.62, 0, { w: 2.0, v: (seed + i) % 3 }); if (i % 2 === 0) L.spot('browse', a0 + step * (i + 0.5), 0, 1.5, Math.PI, { tags: ['workshop'] }); }
      L.interact({ p: (a0 + a1) / 2, q: 1.6, y: 1.3, radius: Math.min(3, (a1 - a0) / 2), prompt: 'Look at the work waiting to be collected', onUse: (gm) => tell(gm, 'The racks', pickBy(seed + (gm.clock ? gm.clock.day : 1), 9, RACK_LINES).map((l) => l.replace('{d}', String(info.d0 + (seed % Math.max(1, info.d1 - info.d0)))))) });
    }
    await T();
    // the glue and finishing bench against the far wall, a drying rack of chairs beside it
    {
      const gp = mp(W - 0.6), ga = ma(-Math.PI / 2), gq = 2.4;
      L.prop('lots-market.bench', gp, 0, gq, ga, { w: 2.6, wood: '#6b4a2f' });
      for (let i = 0; i < 4; i++) L.prop('craft.gluepot', gp + (flip ? 0.1 : -0.1), 0.86, gq - 0.9 + i * 0.5, 0, { glaze: ['#6b4a2f', '#2f6f73', '#8a2f3c', '#3a2a20'][i] }, { noCollide: true });
      s.detail(() => {
        // clamps on a rail over the bench, a chair glued and clamped on it, rags
        g.mat('wood', '#5a3a26'); L.box(Math.min(gp, gp + (flip ? 0.4 : -0.4)) + 0.0, 2.0, gq - 1.3, Math.max(gp, gp + (flip ? 0.4 : -0.4)), 2.05, gq + 1.3);
        g.mat('cast', '#c9552e'); for (let i = 0; i < 9; i++) { const q = gq - 1.1 + i * 0.27; L.box(Math.min(gp, gp + (flip ? 0.35 : -0.35)), 1.5, q - 0.012, Math.max(gp, gp + (flip ? 0.35 : -0.35)), 1.53, q + 0.012); L.box(gp + (flip ? 0.3 : -0.3) - 0.012, 1.5, q - 0.012, gp + (flip ? 0.3 : -0.3) + 0.012, 2.0, q + 0.012); }
        { const cpt = L.pt(gp + (flip ? 0.05 : -0.05), 0.86, gq + 0.6); drawChair(g, cpt[0], 0.86, cpt[2], L.yaw(ga), '#8a6240', 'wood', false); }
        g.mat('weave', '#e9e1cf'); L.box(gp + (flip ? 0.1 : -0.1) - 0.15, 0.86, gq - 0.2, gp + (flip ? 0.1 : -0.1) + 0.15, 0.89, gq + 0.1);
      });
      L.spot('work', gp + (flip ? 0.85 : -0.85), 0, gq, ma(Math.PI / 2), { tags: ['mend', 'workshop', 'glue'] });
      // the drying rack: a frame with chairs hung on it
      const rp = mp(W - 0.7), rq = 4.4;
      s.furniture(() => {
        g.mat('wood', '#5a3a26'); for (const dq2 of [-0.9, 0.9]) L.box(rp - 0.05, 0, rq + dq2 - 0.05, rp + 0.05, 2.4, rq + dq2 + 0.05, { faces: 'pPqQY' });
        L.box(rp - 0.04, 2.3, rq - 0.95, rp + 0.04, 2.38, rq + 0.95, { faces: 'yYpP' });
      });
      s.detail(() => { for (const dq2 of [-0.45, 0.45]) { const pt = L.pt(rp, 2.75, rq + dq2); drawChair(g, pt[0], 2.75, pt[2], L.yaw(ga), dq2 < 0 ? '#9a6a3a' : '#2f6f73', 'wood', true); } });
      L.solid(rp - 0.25, 0, rq - 1.0, rp + 0.25, 2.4, rq + 1.0);
    }
    await T();
    T.lap('front');

    // ---------------------------------------------------------------------------------------------------------------
    // the machine bay behind its rail
    // ---------------------------------------------------------------------------------------------------------------
    {
      const r0 = [L.P(0.3, RQ), L.P(c - 0.9, RQ)], r1 = [L.P(c + 0.9, RQ), L.P(W - 0.3, RQ)];
      railing(s, r0, 0, { h: 1.05, tint: '#2a2622', rail: '#e8c242', railMat: 'paint' }); railing(s, r1, 0, { h: 1.05, tint: '#2a2622', rail: '#e8c242', railMat: 'paint' });
      s.structure(() => { g.mat('paint', '#e8c242'); L.box(0.2, 0.0, RQ + 0.25, W - 0.2, 0.006, RQ + 0.4, { faces: 'Y' }); g.mat('paint', '#2a2622'); for (let p = 0.3; p < W - 0.3; p += 0.4) L.box(p, 0.006, RQ + 0.25, p + 0.18, 0.008, RQ + 0.4, { faces: 'Y' }); });
      const mq = D - 3.3, slots = [], ns = Math.max(4, Math.min(6, Math.floor((W - 6) / 4.5)));
      for (let i = 0; i < ns; i++) slots.push(2.6 + (W - 7.4) * i / (ns - 1));
      const kinds = ['lathe', 'bandsaw', 'press', 'drill', 'lathe2', 'bench'];
      for (let i = 0; i < slots.length; i++) {
        const p = mp(slots[i]), k = kinds[i % kinds.length];
        if (k === 'lathe' || k === 'lathe2') L.prop('craft.lathe', p, 0, mq, Math.PI, { len: 1.8, piece: k === 'lathe' ? '#b07a42' : '#c9a06a' }, { spot: { tags: ['carve', 'machine', 'workshop'] } });
        else if (k === 'bench') { L.prop('lots-market.bench', p, 0, mq, Math.PI, { w: 2.2, wood: '#5a3a26' }); L.prop('lots-market.project', p, 0.86, mq, Math.PI, { t: 'mend', v: 2 }, { noCollide: true }); }
        else L.prop('lots-market.' + k, p, 0, mq, Math.PI, {}, { spot: { tags: [k === 'press' ? 'mend' : k === 'drill' ? 'tune' : 'carve', 'machine', 'workshop'] } });
        // a yellow box painted on the floor round each machine
        s.structure(() => { g.mat('paint', '#e8c242'); for (const e of [[-1.3, -1.0, 1.3, -0.94], [-1.3, 0.94, 1.3, 1.0], [-1.3, -1.0, -1.24, 1.0], [1.24, -1.0, 1.3, 1.0]]) L.box(p + e[0], 0.0, mq + e[1], p + e[2], 0.007, mq + e[3], { faces: 'Y' }); });
      }
    await T();
      // the kiln in its corner on a tiled hearth
      const kp = mp(W - 1.5), kq = D - 1.4;
      s.structure(() => { g.mat('tile', '#a8412b'); L.box(kp - 1.0, 0, kq - 1.0, kp + 1.0, 0.03, kq + 1.0, { faces: 'YpPqQ' }); });
      L.prop('lots-market.kiln', kp, 0.03, kq, Math.PI, {});
      s.detail(() => { for (let i = 0; i < 6; i++) { const pp = kp + (flip ? 1 : -1) * (1.3 + (i % 3) * 0.3), qq = kq - 0.5 + Math.floor(i / 3) * 0.45; g.mat('glaze', ['#e9e1cf', '#a3563a', '#d9c7a6', '#2f6f73'][i % 4]); L.lathe(pp, qq, [[0.09, 0], [0.12, 0.12], [0.1, 0.24]], { segs: 8 }); } });
      // timber on cantilever arms along the back wall, offcut bins, sawdust sacks
      s.detail(() => {
        for (let p = 1.0; p < W - 3.5; p += 2.4) {
          if (Math.abs(p - mp(W - 1.5)) < 2.2) continue;
          g.mat('cast', '#2a2622'); L.box(p - 0.05, 0, D - 0.3, p + 0.05, 2.6, D - 0.2, { faces: 'pPqQ' });
          for (const y of [0.6, 1.2, 1.8, 2.4]) L.box(p - 0.04, y, D - 0.9, p + 0.04, y + 0.05, D - 0.2, { faces: 'pPyYq' });
        }
        const rw = new Rng(seed + 21);
        for (let p0 = 0.8; p0 < W - 5; p0 += 7.2) for (const y of [0.65, 1.25, 1.85]) for (let k = 0; k < 4; k++) { if (rw.chance(0.25)) continue; const q0 = D - 0.85 + k * 0.15, p1 = Math.min(W - 3.6, p0 + rw.f(4.5, 7)); if (Math.abs((p0 + p1) / 2 - mp(W - 1.5)) < 3 && p1 > W - 5) continue; g.mat('wood', rw.pick(['#c9a06a', '#a07850', '#8a6240', '#d9b98a'])); L.box(p0, y, q0, p1, y + rw.f(0.04, 0.09), q0 + 0.12, { faces: 'pPyYqQ' }); }
      });
      for (let i = 0; i < 3; i++) { const bp = mp(1.0 + i * 0.7); L.prop('station.sack', bp, 0, RQ + 1.2, i, { c: ['#c9b48a', '#b8a47a', '#a8946a'][i] }); }
      L.prop('crate', mp(3.4), 0, RQ + 1.1, 0.2, { w: 0.8, h: 0.6, d: 0.6, wood: '#a8794f' });
      L.loop('air', c, 2.5, D - 2, { vol: 0.2, radius: 12 });
      L.interact({ p: c, q: RQ - 0.4, y: 1.2, radius: 1.6, prompt: 'Read the notice on the rail', onUse: (gm) => tell(gm, 'The machines', pickBy(seed + (gm.clock ? gm.clock.day : 1), 11, MACHINE_LINES)) });
      L.spot('stand', c + 0.6, 0, RQ - 0.6, 0, { tags: ['workshop', 'watch'] });
    }
    await T();
    T.lap('bay');

    // ---------------------------------------------------------------------------------------------------------------
    // light, walkways, the zone
    // ---------------------------------------------------------------------------------------------------------------
    for (const q of rows) L.light({ at: [0.8, 2.15, q - 0.1], to: [W - 0.8, 2.15, q - 0.1], type: 'tube', color: '#ffe6c4', power: 5.5, range: 4.2, radius: 0.1, shadow: true, lamp: true, clip: clipLo });
    L.lamp('globe', c - 2.5, LO - 0.02, 2.4, { r: 0.18, drop: 0.6, K: 3000, power: 1.2, range: 7, clip: clipLo });
    L.lamp('globe', mp(W - 1.6), LO - 0.02, 3.2, { r: 0.16, drop: 0.7, K: 3000, power: 1.0, range: 5.5, clip: clipLo });
    for (const p of [W * 0.2, W * 0.5, W * 0.8]) L.lamp('globe', p, 4.2, D - 3.0, { r: 0.3, drop: HB - 4.2, K: 4000, power: 3.0, range: 11, clip: clipBay });
    L.glowBox(0, 0, 0, W, LO, BZ, { sky: '#fff0d8', ground: '#a8794f', power: 0.36 });
    L.glowBox(0, 0, BZ, W, HB, D, { sky: '#f4f0e8', ground: '#8a8a82', power: 0.3 });
    const lines = [], q0 = rows[0] - 1.5, qn = rows[rows.length - 1] + 1.2;
    lines.push([[c, -0.7], [c, 1.3], [c, q0], [c, qn], [c, RQ - 0.6]]);
    lines.push([[mp(1.2), q0], [mp(W - 1.4), q0]]);
    lines.push([[mp(1.2), qn], [mp(W - 1.4), qn]]);
    lines.push([[mp(1.2), q0], [mp(1.2), qn]]);
    for (let j = 0; j < rows.length - 1; j++) lines.push([[halves[0][0], rows[j] + 1.4], [halves[1][1], rows[j] + 1.4]]);
    lines.push([[c, 1.3], [mp(Math.min(W - 6.5, c + 3.6) - 1.5), dq]]);
    lines.push([[c, RQ - 0.6], [c, RQ + 1.2], [c, D - 2.0]]);
    walkways(L, lines, 1.2);
    L.loop('murmur', c, 1.4, D / 2, { vol: 0.2, radius: 20, param: 0.2 });
    const zb = L.B(0, 0, W, D);
    s.zoneBox({ id: lot.id, place: 'city-special', box: [zb[0], -0.5, zb[1], zb[2], HB, zb[3]], name: nm[0].charAt(0) + nm[0].slice(1).toLowerCase(), sub: info.name + ' · ' + nm[1], ambience: 'shop', reverb: 'room', cell: info.key, headroom: 3.2 });
    T.lap('light');
    void CLOTH; void shadeHex;
  } finally { T.done(); }
}
