// Station Ring 5, the smaller places: the departures board, the rooms off the concourse's back side (left luggage,
// the Ledger, the tin shelf and its broth hatch, the scale), and the tube level under the well, where the rim trains run.
import { floor, ceiling, wall, lamp, roomGlow, warm, stairs } from '../world/kit.js';
import { railing } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { signK, movable } from './station_parts.js';
import { flaps, painted, drawPlate, CAPS, SERIF } from './ledger_parts.js';
import { Rng, hashStr, smoothstep } from '../core/util.js';
import { PI, say, toast, sfx, found, hour, runX, lineX, makeVault, ringLedger, seatOnBench, seatAt } from './lm_ring_parts.js';

export const R5 = { XE: 216, XM: 48, ZN: -22, ZS: 22, ZE: 15, SPRING: 9, CROWN: 18 };
R5.V = makeVault(R5.ZN, R5.ZS, R5.SPRING, R5.CROWN);
R5.loops = [{ cx: -60, sg: -1 }, { cx: 60, sg: -1 }, { cx: -60, sg: 1 }];
R5.standing = [{ cx: 84, sg: 1 }];
R5.pits = R5.loops.concat(R5.standing);
export const PAL5 = { indigo: '#2b3566', indigoDark: '#1c2346', stone: '#d8c6a2', vault: '#e2d3b3', terra: '#b5532e', ochre: '#d29a34', brass: '#b08a45', yellow: '#e0ad32', conc: '#8a8378', cream: '#efe3c8' };
const ZS = R5.ZS;
const ME = { name: 'You', colour: '#8fd694' };
void ME;

// ---------------------------------------------------------------------------------------------------------------
// the departures board: one painted picture, hung from the vault over the long bay, redrawn every minute
// ---------------------------------------------------------------------------------------------------------------
const ROWS = [
  { to: 'SORREL', by: 'ONE GLIDE · 140 S', via: 'every car · the catch at Sorrel\'s rim', from: '7 · 8', p: 2, o: 0 },
  { to: 'RUE', by: 'TWO GLIDES', via: 'through car · stay in your seat at Sorrel', from: 'LONG BAY', p: 15, o: 4 },
  { to: 'LOVAGE', by: 'TWO GLIDES', via: 'through car · stay in your seat at Sorrel', from: 'LONG BAY', p: 12, o: 7 },
  { to: 'TANSY', by: 'TWO GLIDES', via: 'through car · stay in your seat at Sorrel', from: 'LONG BAY', p: 20, o: 11 },
  { to: 'YARROW', by: 'ALONG THE ROW', via: 'through car · via Sorrel', from: 'LONG BAY', p: 30, o: 17 },
  { to: 'BORAGE', by: 'ALONG THE ROW', via: 'through car · via Sorrel', from: 'LONG BAY', p: 45, o: 26 },
  { div: 'BY CYCLER · CAPSULES FROM THE TUBE LEVEL, DOWN THE STAIRS BY THE WELL' },
  { to: 'GRAIN ROW', by: 'SLOW LINE · 2 KM/S', via: 'Spelt · Cooper Row beyond', from: 'TUBE', p: 20, o: 3 },
  { to: 'GULL ROW', by: 'SLOW LINE · 2 KM/S', via: 'Kittiwake · Hedge Row beyond', from: 'TUBE', p: 20, o: 13 },
  { to: 'WEATHER ROW', by: 'SLOW LINE · 2 KM/S', via: 'Gloaming · Squall', from: 'TUBE', p: 30, o: 8 },
  { to: 'KELP ROW', by: 'EXPRESS · 20 KM/S', via: 'Dulse · the far side of Merrow', from: 'TUBE', p: 60, o: 41 },
  { to: 'ANYWHERE FURTHER', by: 'ASK AT THE DESK', via: 'capsules every few minutes, every way', from: 'TUBE', p: 5, o: 1 },
];
function boardDraw(mins) {
  return (ctx, w, h) => {
    ctx.fillStyle = '#0c0e10'; ctx.fillRect(0, 0, w, h);
    const r = new Rng(55);
    for (let i = 0; i < 260; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.01 + 0.02 * r.next()).toFixed(3) + ')'; ctx.fillRect(r.f(0, w), r.f(0, h), r.f(2, 14), 1); }
    const hh = h * 0.15;
    ctx.fillStyle = '#1c2346'; ctx.fillRect(0, 0, w, hh);
    ctx.fillStyle = '#b08a45'; ctx.fillRect(0, hh - 2, w, 2);
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd88a'; ctx.textAlign = 'left'; ctx.font = 'italic 600 ' + Math.round(hh * 0.7) + 'px ' + SERIF; ctx.fillText('Departures', w * 0.015, hh * 0.52);
    ctx.fillStyle = '#e8dcc0'; ctx.textAlign = 'center'; ctx.font = '600 ' + Math.round(hh * 0.36) + 'px ' + CAPS; ctx.fillText('STATION RING 5  ·  THE TUBES  ·  HERB ROW AND BEYOND', w * 0.5, hh * 0.52);
    const m = Math.floor(mins), hm = String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    const tcw = hh * 0.42; flaps(ctx, hm, w * 0.985 - tcw * 5, hh * 0.16, tcw, hh * 0.68, '#ffc35a', 9);
    // column heads
    const top = hh + h * 0.012, X = { to: 0.012, by: 0.27, via: 0.455, from: 0.82, n: 0.905 };
    ctx.fillStyle = '#9a917c'; ctx.textAlign = 'left'; ctx.font = '600 ' + Math.round(h * 0.035) + 'px ' + CAPS;
    ctx.fillText('TO', w * X.to, top + h * 0.022); ctx.fillText('BY', w * X.by, top + h * 0.022); ctx.fillText('CHANGE', w * X.via, top + h * 0.022); ctx.fillText('FROM', w * X.from, top + h * 0.022); ctx.fillText('NEXT, MIN', w * X.n, top + h * 0.022);
    const y0 = top + h * 0.05, lh = (h - y0 - h * 0.012) / ROWS.length;
    ROWS.forEach((rw, i) => {
      const y = y0 + i * lh;
      if (rw.div) { ctx.fillStyle = '#2b3566'; ctx.fillRect(w * 0.008, y + lh * 0.12, w * 0.984, lh * 0.76); ctx.fillStyle = '#e8dcc0'; ctx.textAlign = 'center'; ctx.font = '600 ' + Math.round(lh * 0.5) + 'px ' + CAPS; ctx.fillText(rw.div, w / 2, y + lh * 0.52); return; }
      const ch = lh * 0.8, cw = Math.min(ch * 0.62, w * 0.24 / Math.max(6, rw.to.length));
      flaps(ctx, rw.to, w * X.to, y + lh * 0.1, cw, ch, '#ffc35a', hashStr(rw.to));
      ctx.textAlign = 'left'; ctx.fillStyle = '#f1e6cc'; ctx.font = '600 ' + Math.round(lh * 0.5) + 'px ' + CAPS; ctx.fillText(rw.by, w * X.by, y + lh * 0.54);
      ctx.fillStyle = '#c9bea4'; ctx.font = 'italic 600 ' + Math.round(lh * 0.56) + 'px ' + SERIF; ctx.fillText(rw.via, w * X.via, y + lh * 0.52);
      ctx.fillStyle = '#f1e6cc'; ctx.font = '600 ' + Math.round(lh * 0.5) + 'px ' + CAPS; ctx.fillText(rw.from, w * X.from, y + lh * 0.54);
      const n = rw.p - ((m + rw.o) % rw.p), t = String(n).padStart(2, ' ');
      flaps(ctx, t, w * X.n + w * 0.03, y + lh * 0.1, ch * 0.62, ch, n <= 2 ? '#9ff0a8' : '#ffc35a', 77 + i);
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(w * 0.008, y + lh - 1, w * 0.984, 1);
    });
  };
}
export function buildBoard(s, game, f) {
  const g = s.g, atlas = game.atlas, P = PAL5, z = -14.35, x0 = -13, x1 = 13, y0 = 7.0, y1 = 13.5, V = R5.V;
  // the frame and its hangers
  s.structure(() => {
    g.mat('panel', P.indigoDark); g.box(x0 - 0.35, y0 - 0.35, z - 0.42, x1 + 0.35, y1 + 0.35, z - 0.02, { bevel: 0.05 });
    g.mat('cast', P.brass, { rough: -0.2 }); g.box(x0 - 0.4, y1 + 0.28, z - 0.46, x1 + 0.4, y1 + 0.4, z + 0.02); g.box(x0 - 0.4, y0 - 0.4, z - 0.46, x1 + 0.4, y0 - 0.28, z + 0.02);
    for (const x of [x0 - 0.38, x1 + 0.38]) g.box(x - 0.05, y0 - 0.4, z - 0.46, x + 0.05, y1 + 0.4, z + 0.02);
    g.mat('panel', P.terra); g.box(x0 - 0.3, y0 - 0.95, z - 0.36, x1 + 0.3, y0 - 0.4, z - 0.06, { bevel: 0.03 });
    g.mat('cast', '#2a2d2e'); for (const x of [-11, -4, 4, 11]) g.tube([[x, y1 + 0.4, z - 0.22], [x, V.y(z - 0.22) - 0.1, z - 0.22]], 0.04, { segs: 6 });
  });
  signK(s, { kind: 'plate', text: 'THE BOARD IS A MINUTE FAST', sub: 'like every clock on the ring' }, 9.6, y0 - 0.67, z + 0.02, { face: 'Z', w: 2.6, h: 0.4, k: 3 });
  signK(s, { kind: 'plate', text: 'THROUGH CARS BELOW', sub: 'Rue · Lovage · Tansy · along the Row' }, -9.6, y0 - 0.67, z + 0.02, { face: 'Z', w: 2.6, h: 0.4, k: 3 });
  if (!atlas) return;
  let last = Math.floor(game.clock ? game.clock.minutes + 1 : 600);
  const r = atlas.add(1664, 416, boardDraw(last), 'ring5.board');
  g.atlas(r.page, { emissive: 1.7, lamp: false });
  g.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], { uv: [r.u0, r.v1, r.u1, r.v0] });
  s.flush({ tier: 's' });
  s.glowCard(0, (y0 + y1) / 2, z + 0.05, { face: 'Z', color: '#ffb347', size: 20, strength: 0.06, follow: 'always' });
  s.light({ at: [0, y0 - 1.6, z + 2.4], color: '#ffb767', power: 9, range: 16, type: 'spot', dir: [0, -0.6, 0.8], cone: [70, 40], clip: [-30, -0.5, -22, 30, 14, 10], radius: 1.2 });
  s.every(() => {
    const m = Math.floor(game.clock ? game.clock.minutes + 1 : 600);
    if (m !== last) { last = m; atlas.redraw(r, boardDraw(m)); }
  });
  s.interact({ x: 0, y: 1.6, z: -9.5, radius: 8, wide: true, prompt: 'Read the departures board', onUse: async (gm) => {
    await say(gm, 'Departures', [
      'SORREL, one glide: a car every couple of minutes from here, every few seconds from Rings Two, Four, Six and Eight. Let go at the quay at 174.4 metres a second, 140 seconds across, caught at Sorrel\'s rim.',
      'RUE, LOVAGE, TANSY: two glides, in through cars made up below the board. Yarrow and Borage further along the Row. Door to door to the next drum is about eight and a half minutes, most of it cab.',
      'Below the line, the cyclers: capsules from the tube level for the other Rows. The slow line runs at 2 kilometres a second, the express at 20. Spelt is on Grain Row. The board does not say how far. People who ask are told: days.',
    ]);
  } });
}

// ---------------------------------------------------------------------------------------------------------------
// the rooms off the back of the concourse
// ---------------------------------------------------------------------------------------------------------------
export function buildRooms(s, game, f, CLIP) {
  luggage(s, game);
  ledgerAlcove(s, game);
  tinShelf(s, game, f);
  scale(s, game);
  void CLIP;
}

// left luggage: x[-46, -30] z[22, 36], open to the concourse at x[-44, -32]
function luggage(s, game) {
  const g = s.g, X0 = -46, X1 = -30, Z0 = ZS, Z1 = 36, H = 3.8, P = PAL5, LC = [X0 - 0.1, -0.3, Z0 - 0.5, X1 + 0.1, H + 0.1, Z1 + 0.1];
  floor(s, X0, Z0, X1, Z1, 0, 'planks', '#8a6a48');
  ceiling(s, X0, Z0, X1, Z1, H, 'paint', '#e2d4b6');
  const WL = { t: 0.24, mat: 'plaster', tint: '#dccbaa', dado: { h: 1.1, mat: 'planks', tint: '#6b4a2f' }, skirt: '#2a221c' };
  wall(s, X0 + 0.12, Z0, X0 + 0.12, Z1, 0, H, WL); wall(s, X1 - 0.12, Z0, X1 - 0.12, Z1, 0, H, WL); wall(s, X0, Z1 - 0.12, X1, Z1 - 0.12, 0, H, WL);
  // the counter, across the room, with a lifting flap at the anti end
  s.furniture(() => {
    g.mat('wood', '#5b3e28'); g.box(-44.2, 0, 25.0, X1 - 0.3, 1.02, 25.7, { bevel: 0.02 });
    g.mat('wood', '#7a5233'); g.box(-44.3, 1.02, 24.92, X1 - 0.25, 1.08, 25.78, { bevel: 0.015 });
    g.mat('panel', P.terra); for (let x = -43.6; x < X1 - 0.6; x += 1.2) g.box(x, 0.18, 24.98, x + 1.0, 0.86, 25.0, { faces: 'z' });
    g.mat('cast', P.brass); g.box(-44.3, 1.08, 24.9, X1 - 0.25, 1.1, 24.96);
  });
  s.solid(-44.2, 0, 25.0, X1 - 0.3, 1.08, 25.7);
  prop(s, 'station.bell', -38, 1.08, 25.3, 0, {}); prop(s, 'station.openBook', -36.2, 1.08, 25.35, 0.2, {});
  prop(s, 'station.deskLamp', -34.6, 1.08, 25.5, -0.4, {});
  // the racks: three rows of shelving full of bags, cases and parcels, all tagged
  const r = new Rng(hashStr('luggage5'));
  const CAS = ['#6b3a2a', '#2f5d6b', '#8a5a24', '#3b4a7a', '#5b6b3a', '#7a2a3a', '#a8865a', '#4a4038'];
  for (const zr of [28.2, 31.2, 34.4]) {
    for (let x = -45.4; x < X1 - 1.2; x += 2.6) {
      prop(s, 'shelving', x + 1.25, 0, zr, 0, { w: 2.5, h: 2.6, d: 0.6, shelves: 4, wood: '#6b4a2f', back: zr > 34 });
      for (let k = 0; k < 4; k++) {
        const y = 0.06 + k * 0.62; let xx = x + 0.18;
        while (xx < x + 2.3) {
          const kind = r.next(), w = kind < 0.5 ? r.f(0.45, 0.7) : r.f(0.3, 0.5);
          if (xx + w > x + 2.4) break;
          if (r.chance(0.12)) { xx += w; continue; }
          if (kind < 0.5) prop(s, 'lmring.case', xx + w / 2, y, zr, r.f(-0.06, 0.06), { c: r.pick(CAS), w: Math.round(w * 20) / 20, h: Math.round(r.f(0.3, 0.46) * 20) / 20, d: 0.3 });
          else prop(s, 'platform.bag', xx + w / 2, y, zr, PI / 2 + r.f(-0.2, 0.2), { c: r.pick(CAS) }, { scale: 0.75 });
          xx += w + 0.06;
        }
      }
    }
  }
  sign(s, { kind: 'fascia', text: 'LEFT LUGGAGE', sub: 'free · nine days · then up to Lost Property', palette: ['#1c2346', '#efe3c8', '#d29a34'] }, -38, 4.15, ZS - 0.32, { face: 'z', w: 6.0, h: 0.62, glow: 0.9 });
  sign(s, { kind: 'chalk', title: 'Left luggage', lines: ['Free, nine days', 'Tag it: name, drum, day back', 'Day ten: up to Lost Property', 'A year there, then the menders', 'No hot food. It was tried.'] }, -45.85, 1.75, 23.6, { face: 'X', w: 1.1, h: 1.3 });
  for (const x of [-42, -38, -34]) lamp(s, 'panel', x, H, 26.5, { w: 1.4, d: 0.5, clip: LC, K: 3000, power: 0.9 });
  lamp(s, 'globe', -38, 2.5, 30, { clip: LC, K: 2700, power: 0.8, drop: 1.3 });
  roomGlow(s, X0, 0, Z0, X1, H, Z1, { sky: '#ffdcae', ground: '#a08060', power: 0.2 });
  s.spot('counter', -36.5, 0, 26.4, PI, { tags: ['porter'] }); s.spot('work', -41.0, 0, 29.6, 0, { tags: ['porter', 'stall'] });
  s.spot('customer', -37.5, 0, 24.3, 0, { tags: ['wait'] }); s.spot('queue', -38.3, 0, 23.2, 0, { tags: ['wait'] });
  s.path([[-38, ZS - 1.5], [-38, 23.6]], { width: 1.6 });
  s.zoneBox({ id: 'ring-five-luggage', box: [X0, -0.5, Z0, X1, H, Z1], name: 'Left luggage', sub: 'Station Ring 5', ambience: 'shop', reverb: 'room', headroom: H });
  const LINES = [
    ['Free. Tag it with your name, your drum and the day you\'ll be back, and it sits on the shelf nine days.', 'On the tenth it goes up to Lost Property on a line deck, where it is kept a year and then given to the menders. Most of what comes back down is better than it went up.'],
    ['People leave bags here for a day out to Sorrel. Wanderers leave them for longer. The case on the top shelf has been collected and left again eleven times by the same woman.', 'Nothing hot. Somebody tried a pot of stew once. We still talk about it.'],
  ];
  s.interact({ x: -37.5, y: 1.2, z: 24.4, radius: 1.8, kind: 'talk', prompt: 'Ask about left luggage', onUse: async (gm) => {
    const F = gm.flags || {}; const i = F.ring5Luggage ? 1 : 0; if (gm.flags) gm.flags.ring5Luggage = true;
    await say(gm, { name: 'The luggage clerk', colour: '#d29a34' }, LINES[i]);
  } });
  s.interact({ x: -41, y: 1.4, z: 27.4, radius: 1.8, prompt: 'Read the tags on the shelves', onUse: (gm) => say(gm, 'Tags', ['"Imre Saltash, Chervil, back Thursday. It is mostly socks."', '"For the Pennyfold table. Do not shake."', '"Lovage. Day nine. If I am late it is because I stayed."', 'A brown case with a tag nine names long, each in a different hand, each crossed out but the last.']) });
}

// the Ledger: an alcove x[-25, -11] z[22, 31], the board on its back wall, benches before it
function ledgerAlcove(s, game) {
  const g = s.g, X0 = -25, X1 = -11, Z0 = ZS, Z1 = 31, H = 6.4, LC = [X0 - 0.1, -0.3, Z0 - 2, X1 + 0.1, H + 0.1, Z1 + 0.1];
  floor(s, X0, Z0, X1, Z1, 0, 'terrazzo', '#c8b38f');
  ceiling(s, X0, Z0, X1, Z1, H, 'paint', '#d9c8a6');
  const WL = { t: 0.24, mat: 'panel', tint: '#e0cfac', dado: { h: 1.2, mat: 'panel', tint: '#5a2f24' }, skirt: '#2a221c' };
  wall(s, X0 + 0.12, Z0, X0 + 0.12, Z1, 0, H, WL); wall(s, X1 - 0.12, Z0, X1 - 0.12, Z1, 0, H, WL); wall(s, X0, Z1 - 0.12, X1, Z1 - 0.12, 0, H, WL);
  s.structure(() => { g.mat('wood', '#4a3424'); for (const x of [-21.5, -18, -14.5]) g.box(x - 0.12, H - 0.4, Z0, x + 0.12, H, Z1 - 0.24, { faces: 'yxX', bevel: 0.01 }); });
  ringLedger(s, game, { x: -18, y: 3.25, z: Z1 - 0.24, face: 'z', w: 9, key: 'ring5', ring: 'STATION RING 5 · DECK 1', brass: PAL5.brass,
    tail: 'The Ledger at Ring Two is read aloud on Booking Day. This one is read by people waiting for a capsule, which takes longer.' });
  for (const x of [-21, -15]) { prop(s, 'bench', x, 0, 25.6, PI, { w: 2.6, back: false, wood: '#6b4a2f', metal: PAL5.indigoDark }); seatOnBench(s, x, 25.6, PI, 2.6, 'b5l' + x, 'Sit and read the Ledger'); }
  for (const x of [-21.5, -14.5]) s.light({ at: [x, H - 0.4, 26.5], color: warm(3000), power: 9, range: 9, type: 'spot', dir: [0, -0.45, 1], cone: [55, 30], clip: LC, radius: 0.2 });
  lamp(s, 'globe', -18, 3.4, 24.2, { clip: LC, K: 2700, power: 0.7, drop: H - 3.4 });
  roomGlow(s, X0, 0, Z0, X1, H, Z1, { sky: '#ffe0b8', ground: '#a08060', power: 0.18 });
  sign(s, { kind: 'fascia', text: 'THE LEDGER', sub: 'Chervil · as at every station ring', palette: ['#5a2f24', '#f2e6c8', '#d29a34'] }, -18, 4.95, ZS - 0.32, { face: 'z', w: 5.2, h: 0.6, glow: 0.8 });
  for (const p of [[-22, 27.6, PI], [-20.8, 28.0, PI + 0.2], [-15.2, 27.8, PI - 0.2], [-13.8, 27.3, PI + 0.3]]) s.spot('stand', p[0], 0, p[1], p[2] + PI, { tags: ['board', 'read'] });
  s.path([[-17.5, ZS - 1.5], [-17.5, 27]], { width: 2.0 });
  s.zoneBox({ id: 'ring-five-ledger', box: [X0, -0.5, Z0, X1, H, Z1], name: 'The Ledger', sub: 'Station Ring 5', ambience: 'station', reverb: 'hall', headroom: H });
}

// the tin shelf: food for the car, under lids, and the ring counter's hatch: x[11, 25] z[22, 29]
function tinShelf(s, game, f) {
  const g = s.g, X0 = 11, X1 = 25, Z0 = ZS, Z1 = 29, H = 3.8, P = PAL5, LC = [X0 - 0.1, -0.3, Z0 - 1.6, X1 + 0.1, H + 0.1, Z1 + 0.1];
  floor(s, X0, Z0, X1, Z1, 0, 'tile', '#d8c9a8');
  ceiling(s, X0, Z0, X1, Z1, H, 'paint', '#ecdcbc');
  const WL = { t: 0.24, mat: 'tile', tint: '#efe3c8', dado: { h: 1.3, mat: 'tile', tint: P.terra }, skirt: '#2a221c' };
  wall(s, X0 + 0.12, Z0, X0 + 0.12, Z1, 0, H, WL); wall(s, X1 - 0.12, Z0, X1 - 0.12, Z1, 0, H, WL); wall(s, X0, Z1 - 0.12, X1, Z1 - 0.12, 0, H, WL);
  // the counter just inside the opening, facing the concourse; behind it shelves of lidded tins and the broth urns
  s.furniture(() => {
    g.mat('panel', P.indigo); g.box(12.2, 0, 23.0, 23.8, 0.96, 23.8, { bevel: 0.02 });
    g.mat('stone', '#d9cdb4', { rough: -0.2 }); g.box(12.1, 0.96, 22.9, 23.9, 1.02, 23.9, { bevel: 0.015 });
    g.mat('cast', P.brass); g.box(12.1, 0.2, 22.88, 23.9, 0.25, 22.92); g.box(12.1, 0.7, 22.88, 23.9, 0.75, 22.92);
    g.mat('wood', '#5b3e28'); g.box(X0 + 0.3, 0, Z1 - 0.9, X1 - 0.3, 0.92, Z1 - 0.25, { bevel: 0.02 });
    g.mat('stone', '#cfc2a4'); g.box(X0 + 0.28, 0.92, Z1 - 0.92, X1 - 0.28, 0.97, Z1 - 0.22);
  });
  s.solid(12.1, 0, 22.9, 23.9, 1.02, 23.9); s.solid(X0 + 0.3, 0, Z1 - 0.92, X1 - 0.3, 0.97, Z1 - 0.22);
  const r = new Rng(hashStr('tins5'));
  for (let x = 12.4; x < 23.8; x += 0.52) prop(s, 'lmring.tins', x, 1.02, 23.35 + r.f(-0.08, 0.08), r.f(-1, 1), { c: r.pick(['#c9552e', '#2f6f73', '#e7b547', '#8a2f3c']), n: 1 + r.i(0, 2) });
  for (let k = 0; k < 3; k++) prop(s, 'shelving', 14.5 + k * 3.5, 0.97, Z1 - 0.45, PI, { w: 3.2, h: 1.9, d: 0.32, shelves: 4, wood: '#6b4a2f', back: true });
  for (let k = 0; k < 3; k++) for (let sh = 0; sh < 4; sh++) for (let i = 0; i < 9; i++) if (r.chance(0.82)) prop(s, 'lmring.tins', 13.1 + k * 3.5 + i * 0.34, 1.0 + sh * 0.47, Z1 - 0.47, 0, { c: r.pick(['#c9552e', '#2f6f73', '#e7b547', '#8a2f3c']), n: 1 + r.i(0, 2) });
  prop(s, 'station.urnTrolley', 22.6, 0, Z1 - 1.6, PI, {}); prop(s, 'lmring.pot', 23.6, 0.97, Z1 - 0.55, 0, { r: 0.24, h: 0.36 });
  prop(s, 'station.cupRack', 21.6, 0.97, Z1 - 0.5, PI, {});
  sign(s, { kind: 'fascia', text: 'THE TIN SHELF', sub: 'food for the car, under lids · broth and a rice ball, free', palette: ['#b5532e', '#f6ead0', '#1c2346'] }, 18, 4.15, ZS - 0.32, { face: 'z', w: 6.4, h: 0.62, glow: 0.9 });
  sign(s, { kind: 'chalk', title: 'For the car', lines: ['Dumplings in a string bag  0.60', 'Cold noodles, black vinegar  0.96', 'Cheese and a heel of bread  0.45', 'Coffee or tea, lidded flask  0.15', 'Broth, rice ball, sprig: free'] }, 12.3, 2.25, Z1 - 0.13, { face: 'z', w: 1.4, h: 1.2 });
  sign(s, { kind: 'notice', title: 'Nothing hot in a car', lines: ['For 140 seconds the soup', 'weighs nothing, and neither', 'do you. Drink it here.'] }, X1 - 0.13, 1.7, 25.4, { face: 'x' });
  for (const x of [14.5, 18, 21.5]) lamp(s, 'globe', x, 2.3, 23.4, { clip: LC, K: 2800, power: 1.0, drop: H - 2.3, r: 0.18 });
  lamp(s, 'panel', 18, H, 27, { w: 2.4, d: 0.5, clip: LC, K: 3200, power: 0.8 });
  roomGlow(s, X0, 0, Z0, X1, H, Z1, { sky: '#ffdcae', ground: '#b09474', power: 0.22 });
  // two standing tables on the concourse in front of it
  for (const x of [13.5, 22.5]) prop(s, 'table', x, 0, 18.6, 0, { w: 0.8, round: true, h: 1.05, legs: 'pedestal', wood: '#5b3e28', top: '#d9cdb4' });
  for (const x of [13.5, 22.5]) { prop(s, 'cup', x - 0.15, 1.05, 18.55, 0, { glaze: '#c9552e' }); prop(s, 'bowl', x + 0.18, 1.05, 18.7, 0, { glaze: '#2f6f73' }); }
  for (const x of [13.5, 22.5]) for (const a of [0.4, 2.4, 4.4]) s.spot('stand', x + Math.sin(a) * 0.65, 0, 18.6 + Math.cos(a) * 0.65, a + PI, { tags: ['eat', 'wait'] });
  s.spot('counter', 16.5, 0, 24.4, PI, { tags: ['stall', 'serve'] }); s.spot('work', 22.4, 0, 24.6, PI, { tags: ['serve', 'cook'] }); s.spot('work', 19.6, 0, 27.6, 0, { tags: ['stall'] });
  for (const q of [[16.5, 22.3], [17.2, 21.5], [17.9, 20.8], [21.4, 22.3], [21.6, 21.4]]) s.spot('queue', q[0], 0, q[1], PI, { tags: ['wait', 'queue'] });
  s.path([[18, ZS - 1.5], [18, 22.4]], { width: 2.0 });
  s.zoneBox({ id: 'ring-five-tins', box: [X0, -0.5, Z0, X1, H, Z1], name: 'The tin shelf', sub: 'Station Ring 5 · food for the car', ambience: 'shop', reverb: 'tile', headroom: H });
  s.loop('kitchen', 18, 1.2, Z1 - 1, { vol: 0.25, radius: 12 });
  const MENU = [
    { id: 'dumplings', name: 'Dumplings in a string bag', desc: 'Six, steamed, in a lidded tin you bring back next time. For the platform at the far end.', price: 0.6 },
    { id: 'noodles', name: 'Cold noodles in black vinegar', desc: 'Packed under a lid for the capsule. Better cold than spilt.', price: 0.96 },
    { id: 'cheese', name: 'Aged cheese and a heel of bread', desc: 'A slice from the Vats\' dairy and yesterday\'s loaf, wrapped.', price: 0.45 },
    { id: 'flask', name: 'Coffee or tea in a lidded flask', desc: 'Cell-culture coffee or long-pour tea. The flask comes back on the next car, mostly.', price: 0.15 },
  ];
  s.interact({ x: 16.5, y: 1.2, z: 22.6, radius: 1.8, kind: 'talk', prompt: 'Buy food for the car', onUse: async (gm) => {
    if (!gm.ui || !gm.ui.menu) return;
    gm.busy++;
    let id = null; try { id = await gm.ui.menu({ kicker: 'Station Ring 5', title: 'The tin shelf', note: 'Under a lid, for the car or the capsule. Nothing hot goes aboard.', items: MENU, wallet: gm.wallet ? gm.wallet.kwh : 0 }); } finally { gm.busy--; }
    const it = MENU.find((q) => q.id === id); if (!it) return;
    if (gm.wallet && gm.wallet.spend(it.price, it.name)) { sfx(gm, 'lid-up', f, 16.5, 1.1, 23.4); toast(gm, it.id === 'flask' ? 'The flask is warm and the lid screws down tight.' : 'Wrapped, lidded and handed over with both hands.'); }
  } });
  const SPRIGS = ['mint', 'coriander', 'dill', 'shiso', 'chervil, for once', 'lovage', 'tarragon'];
  s.interact({ x: 22.4, y: 1.2, z: 22.6, radius: 1.5, kind: 'talk', prompt: 'Ask for a cup of broth', onUse: async (gm) => {
    const d = gm.clock ? gm.clock.day : 1, sprig = SPRIGS[(d * 3 + 1) % SPRIGS.length];
    sfx(gm, 'pour', f, 22.4, 1.1, 23.4);
    if (gm.ui) gm.ui.toast('A cup of Mill broth, a sticky rice ball and a sprig of ' + sprig + '. Free, as at every ring on the Row.', { kind: 'gain' });
    found(gm, 'counter-sprig');
  } });
}

// the scale, on the concourse by the back wall at x = 34: step on it, and a board of what you weigh in six drums
function scale(s, game) {
  const g = s.g, x = 35, z = 19.8, P = PAL5;
  s.furniture(() => {
    g.mat('cast', P.indigoDark); g.box(x - 0.75, 0, z - 0.6, x + 0.75, 0.09, z + 0.6, { bevel: 0.03 });
    g.mat('rush', '#6b5a3a'); g.box(x - 0.66, 0.09, z - 0.52, x + 0.66, 0.1, z + 0.4, { faces: 'Y' });
    g.mat('cast', P.brass, { rough: -0.2 }); g.box(x - 0.76, 0.07, z - 0.61, x + 0.76, 0.1, z - 0.56);
    g.mat('cast', P.indigo); g.lathe(x, z + 0.5, [[0.14, 0.09], [0.1, 0.2], [0.08, 1.5], [0.12, 1.56]], { segs: 12 });
    g.mat('cast', P.brass, { rough: -0.25 }); g.push(); g.move(x, 1.85, z + 0.5); g.rotX(PI / 2); g.cyl(0, -0.08, 0, 0.36, 0.1, { segs: 28 }); g.pop();
    g.mat('paint', '#f4ead2', { emissive: 0.35 }); g.push(); g.move(x, 1.85, z + 0.395); g.rotX(PI / 2); g.cyl(0, 0, 0, 0.31, 0.004, { segs: 28 }); g.pop();
    g.mat('paint', '#1b1d1e'); for (let k = 0; k < 20; k++) { const a = -2.4 + k / 19 * 4.8; g.push(); g.move(x + Math.sin(a) * 0.26, 1.85 + Math.cos(a) * 0.26, z + 0.39); g.rotZ(-a); g.box(-0.004, -0.025, 0, 0.004, 0.025, 0.003); g.pop(); }
    g.mat('paint', '#a8302a'); g.push(); g.move(x, 1.85, z + 0.385); g.rotZ(-0.35); g.box(-0.007, -0.04, 0, 0.007, 0.24, 0.004); g.pop();
  });
  s.solid(x - 0.15, 0, z + 0.36, x + 0.15, 1.9, z + 0.64);
  painted(s, 'ring5.weights', 2.2, 1.6, 150, drawPlate('WHAT YOU WEIGH IN SIX DRUMS', ['Chervil, at the rim  ·  a full g', 'Sorrel, at the rim  ·  a full g', 'Lovage, at the rim  ·  a full g', 'Tansy, at the rim  ·  a full g', 'Rue, at the rim  ·  a full g', 'Spelt, at the rim  ·  a full g', 'Every drum is spun to the same weight at its rim.', 'What changes is how high you live.'], { titleK: 0.12, a: '#2b3566', b: '#3a4680', c: '#232c55', ink: '#f2e6c8' }), x, 2.6, ZS - 0.31, { face: 'z', glow: 0.25 });
  lamp(s, 'spot', x, 4.6, ZS - 1.5, { dir: [0, -0.7, 0.7], cone: [50, 24], clip: [x - 4, -0.5, 14, x + 4, 5, ZS + 0.1], K: 3000, power: 0.7 });
  sign(s, { kind: 'plate', text: 'THE SCALE', sub: 'free · step on' }, x - 1.5, 1.5, ZS - 0.31, { face: 'z' });
  s.spot('stand', x + 1.4, 0, z - 0.8, PI + 0.6, { tags: ['wait'] }); s.spot('queue', x - 1.3, 0, z - 1.0, PI - 0.5, { tags: ['wait', 'queue'] });
  s.interact({ x, y: 0.6, z, radius: 1.4, prompt: 'Step on the scale', onUse: async (gm) => {
    const bag = gm.flags && gm.flags.platformBag;
    await say(gm, 'The scale', [
      'The needle swings, steadies, and settles on 64 kilograms' + (bag ? ', and nine more for the bag.' : '.'),
      'You weighed the same at Sorrel\'s rim, and at Spelt\'s. Up in Candlewick it would read two parts in a hundred less; on the High decks, nearer half; in the Hollow, exactly half.',
      'People who live high up step on it anyway, coming in. They say it is good to know what you would weigh if you lived down here.',
    ]);
    found(gm, 'full-weight');
  } });
  s.interact({ x, y: 2.6, z: ZS - 1.0, radius: 1.6, prompt: 'Read: What you weigh in six drums', onUse: (gm) => say(gm, 'What you weigh in six drums', ['Chervil, Sorrel, Lovage, Tansy, Rue, Spelt: a full g, at every rim.', 'Every drum is spun to the same weight at its rim. What changes is how high you live. Somebody paints the same joke on every scale on the Row, and nobody minds.']) });
}

// ---------------------------------------------------------------------------------------------------------------
// the tube level: under the well, x[-72, 72] z[-7.5, 10.5], platform at y = -8; the rim trains and the capsule berths
// ---------------------------------------------------------------------------------------------------------------
export function buildTube(s, game, f) {
  const g = s.g, P = PAL5, Y = -8, YT = -9.2, X = 72, ZA = -7.5, ZB = 10.5, ZP = -1.5, C = 'ring5-tube';
  const LC = [-X - 0.2, YT - 0.2, ZA - 0.2, X + 0.2, 0.2, ZB + 0.2];
  // the well's rail and kerb, and the rails round the stair openings
  s.furniture(() => {
    g.mat('stone', '#bfae8c'); for (const [a, b, c, d] of [[-12.3, -4.3, 12.3, -4], [-12.3, 4, 12.3, 4.3], [-12.3, -4, -12, 4], [12, -4, 12.3, 4]]) g.box(a, 0, b, c, 0.18, d, { bevel: 0.02 });
    g.mat('concrete', '#8a8378'); g.box(-12, -0.45, -4, 12, 0, -3.99, { faces: 'Z' }); g.box(-12, -0.45, 3.99, 12, 0, 4, { faces: 'z' }); g.box(-12, -0.45, -4, -11.99, 0, 4, { faces: 'X' }); g.box(11.99, -0.45, -4, 12, 0, 4, { faces: 'x' });
    for (const sx of [-1, 1]) { const a = sx * 14, b = sx * 27.6; g.box(Math.min(a, b), -0.45, 0.5, Math.max(a, b), 0, 0.51, { faces: 'Z' }); g.box(Math.min(a, b), -0.45, 3.49, Math.max(a, b), 0, 3.5, { faces: 'z' }); }
  });
  const RAIL = { h: 1.1, tint: P.indigo, rail: P.brass, railMat: 'cast', posts: 1.5 };
  railing(s, [[-12.15, -4.15], [12.15, -4.15], [12.15, 4.15], [-12.15, 4.15], [-12.15, -4.15]], 0.18, RAIL);
  s.solid(-12.3, 0, -4.3, 12.3, 1.3, -4); s.solid(-12.3, 0, 4, 12.3, 1.3, 4.3); s.solid(-12.3, 0, -4, -12, 1.3, 4); s.solid(12, 0, -4, 12.3, 1.3, 4);
  for (const sx of [-1, 1]) {
    railing(s, [[sx * 27.4, 0.42], [sx * 14.05, 0.42], [sx * 14.05, 3.58], [sx * 27.4, 3.58]], 0, RAIL);
    s.solid(Math.min(sx * 14, sx * 27.6), 0, 0.3, Math.max(sx * 14, sx * 27.6), 1.3, 0.52); s.solid(Math.min(sx * 14, sx * 27.6), 0, 3.48, Math.max(sx * 14, sx * 27.6), 1.3, 3.7);
    s.solid(Math.min(sx * 13.9, sx * 14.1), 0, 0.5, Math.max(sx * 13.9, sx * 14.1), 1.3, 3.5);
    stairs(s, sx * 14, Y, 2, sx > 0 ? 'X' : 'x', 8, 13.6, 2.96, { mat: 'terrazzo', tint: '#c4ae88', nosing: P.brass });
    // the stair's tiled stringers and a brass handrail on each side
    s.structure(() => {
      const xb = sx * 14, xt = sx * 27.6, prof = sx > 0 ? [[xb, Y], [xt, Y], [xt, 0.12], [xb, Y + 0.95]] : [[xt, Y], [xb, Y], [xb, Y + 0.95], [xt, 0.12]];
      for (const [z0, z1] of [[0.4, 0.52], [3.48, 3.6]]) { g.mat('tile', P.terra); g.extrude(prof, z0, z1, 'z'); }
      g.mat('cast', P.brass, { rough: -0.2 }); for (const z of [0.62, 3.38]) g.tube([[xb, Y + 0.95, z], [xt, 0.95, z]], 0.03, { segs: 6 });
    });
    signK(s, { kind: 'street', text: 'THE TUBE LEVEL', sub: 'rim trains · cycler capsules' }, sx * 27.4, 2.4, 2, { face: sx > 0 ? 'X' : 'x', w: 2.2, h: 0.56, glow: 0.7, k: 3 });
    s.deco(() => { g.mat('cast', '#2a2d2e'); g.tube([[sx * 27.7, 1.3, 2], [sx * 27.7, 2.1, 2]], 0.04, { segs: 6 }); });
  }
  // the tube hall: floors, the trench, walls, the ceiling under the concourse
  floor(s, -X, ZP, X, ZB, Y, 'terrazzo', '#b9a582');
  floor(s, -X, ZA, X, ZP, YT, 'concrete', '#3c3b38');
  const ceil = (x0, z0, x1, z1) => ceiling(s, x0, z0, x1, z1, -0.45, 'panel', '#cfc3a8');
  ceil(-X, ZA, X, -4); ceil(-X, -4, -27.6, ZB); ceil(27.6, -4, X, ZB); ceil(-27.6, -4, -12, 0.5); ceil(12, -4, 27.6, 0.5); ceil(-27.6, 3.5, -12, ZB); ceil(12, 3.5, 27.6, ZB); ceil(-12, 4, 12, ZB); ceil(-14, 0.5, -12, 3.5); ceil(12, 0.5, 14, 3.5);
  const WT = { t: 0.3, mat: 'tile', tint: '#efe3c8', dado: { h: 1.6, mat: 'tile', tint: P.terra }, skirt: '#2a221c' };
  runX(-X, X, 16, (a, b) => wall(s, a, ZB - 0.15, b, ZB - 0.15, Y, 7.55, WT));
  runX(-X, X, 16, (a, b) => wall(s, a, ZA + 0.15, b, ZA + 0.15, YT, 8.75, { t: 0.3, mat: 'tile', tint: '#d6c9ad', dado: { h: 2.6, mat: 'concrete', tint: '#4a4946' } }));
  for (const sx of [-1, 1]) {
    const x = sx * (X - 0.15);
    wall(s, x, ZA, x, ZB, YT, 8.75, { t: 0.3, mat: 'tile', tint: '#e6d9bc', dado: { h: 2.8, mat: 'tile', tint: P.terra }, openings: [{ at: 0.5, w: 5.2, h: 4.0 }] });
    s.structure(() => {
      g.mat('plain', '#050505'); g.box(Math.min(x, x + sx * 0.2), YT, ZA + 0.5, Math.max(x, x + sx * 0.2), YT + 4.0, ZA + 5.7, { faces: sx > 0 ? 'x' : 'X' });
      g.mat('panel', P.indigo); g.box(Math.min(x, x - sx * 0.25), YT + 4.0, ZA + 0.3, Math.max(x, x - sx * 0.25), YT + 4.6, ZA + 5.9, { bevel: 0.03 });
      g.mat('paint', P.yellow); for (let k = 0; k < 10; k++) g.box(Math.min(x, x - sx * 0.27), YT + 4.1, ZA + 0.5 + k * 0.52, Math.max(x, x - sx * 0.27), YT + 4.5, ZA + 0.76 + k * 0.52, { faces: sx > 0 ? 'x' : 'X' });
    });
  }
  // the trench: rails on sleepers, the platform edge, a tactile strip
  runX(-X - 60, X + 60, 12, (a, b) => s.structure(() => {
    g.mat('wood', '#3a2a1e'); for (let x = a; x < b; x += 0.8) g.box(x, YT, -5.4, x + 0.24, YT + 0.12, -2.8);
    g.mat('cast', '#8c8f90', { rough: -0.3 }); for (const z of [-4.8, -3.4]) g.box(a, YT + 0.12, z - 0.04, b, YT + 0.27, z + 0.04);
  }));
  runX(-X, X, 16, (a, b) => s.deco(() => {
    g.mat('stone', '#d8ccb0'); g.box(a, Y - 0.06, ZP - 0.02, b, Y + 0.004, ZP + 0.4, { faces: 'Yz' });
    g.mat('paint', P.yellow); g.box(a, Y, ZP + 0.45, b, Y + 0.006, ZP + 0.57, { faces: 'Y' });
    g.mat('deckplate', '#c99f35'); g.box(a, Y, ZP + 0.7, b, Y + 0.009, ZP + 1.1, { faces: 'Y' });
    g.mat('concrete', '#2a2928'); g.box(a, YT, ZP - 0.02, b, Y - 0.06, ZP, { faces: 'z' });
  }));
  s.solid(-X, Y, ZP - 0.25, X, Y + 3.0, ZP - 0.05);
  // a low glass screen along the edge, brass-framed, with a gap marked where each car's door stops
  runX(-40, 40, 4, (a, b) => s.glass(a + 0.08, Y + 0.1, ZP - 0.12, b - 0.08, Y + 1.25, ZP - 0.12, { tint: '#d5e6e2', opacity: 0.08 }));
  s.furniture(() => { g.mat('cast', P.brass, { rough: -0.2 }); g.box(-40, Y + 1.22, ZP - 0.16, 40, Y + 1.28, ZP - 0.08); for (let x = -40; x <= 40.01; x += 4) g.box(x - 0.04, Y, ZP - 0.16, x + 0.04, Y + 1.28, ZP - 0.08); });
  // benches and the board along the back wall, the capsule berths at the spinward end
  for (const x of [-60, -48, -36, 36]) { prop(s, 'bench', x, Y, ZB - 0.9, PI, { w: 2.4, back: true, wood: '#7a5233', metal: P.indigoDark }); seatOnBench(s, x, ZB - 0.9, PI, 2.4, 'b5t' + x); }
  painted(s, 'ring5.rimtrain', 4.2, 2.1, 120, rimMap(), -20, Y + 2.1, ZB - 0.32, { face: 'z', glow: 0.2 });
  s.interact({ x: -20, y: Y + 1.6, z: ZB - 1.2, radius: 2.4, prompt: 'Read the rim-train map', onUse: (gm) => say(gm, 'The rim train', [
    'A ring of track right round the rim, under the platforms: 18.8 kilometres, six faces of platform, a stop at every one.',
    'Small cars, every couple of minutes. Nobody walks round a station ring. The glide trains above are a hundred metres long and seat a thousand; at the peak one leaves every two seconds or so.',
    'Rings stand 417 metres apart along the drum. To change rings you take a cab, not a train.']) });
  capsules(s, game, f, Y, ZB);
  // light: panels along the platform, a strip over the edge, the glow down the well
  for (let x = -60; x <= 60; x += 15) lamp(s, 'panel', x, -0.45, 5, { w: 3.0, d: 0.5, clip: LC, K: 3300, power: 1.4 });
  for (let x = -64; x <= 64; x += 16) if (Math.abs(x) > 20) lamp(s, 'strip', x - 6, -0.6, -3.2, { to: [x + 6, -0.6, -3.2], clip: LC, K: 3800, power: 0.9 });
  s.light({ at: [0, -2.2, 0], color: warm(3400), power: 14, range: 12, clip: LC, radius: 3 });
  roomGlow(s, -X, YT, ZA, X, -0.45, ZB, { sky: '#f2dcb8', ground: '#8a7a64', power: 0.16 });
  // the train
  train(s, game, f, Y, LC);
  // people on the tube level
  s.path([[-60, 6], [-40, 6], [-27, 5.5], [-14, 2], [0, 4.6], [14, 2], [27, 5.5], [40, 6], [60, 6]], { y: Y, width: 2.2 });
  for (const x of [-30, -10, 10, 30]) s.path([[x, 5.2], [x, 0.4]], { y: Y, width: 1.6, tags: ['queue'] });
  for (let i = 0; i < 18; i++) { const x = -34 + i * 4 + (i % 3) * 0.4; s.spot(i % 4 === 0 ? 'queue' : 'stand', x, Y, 0.3 + (i % 2) * 0.7, PI, { tags: ['wait'] }); }
  for (const q of [[-50, 4, 0.4], [-44, 6, -2.4], [20, 7, 2.6], [50, 5, -0.4]]) s.spot('stand', q[0], Y, q[1], q[2], { tags: ['wait'] });
  s.spot('work', 8, Y, 7.5, 2.0, { tags: ['sweep'] });
  s.zoneBox({ id: C, box: [-X, YT - 0.2, ZA, X, -0.4, ZB], name: 'The tube level', sub: 'Station Ring 5 · rim trains and cycler capsules', ambience: 'station', reverb: 'tile', headroom: 7.4 });
  s.loop('air', 0, -2, 8, { vol: 0.3, radius: 30 });
}

// the rim-train map, painted: the ring as a circle, its six faces, the rings along the drum
function rimMap() {
  return (ctx, w, h) => {
    ctx.fillStyle = '#efe3c8'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#1c2346'; ctx.lineWidth = w * 0.012; ctx.strokeRect(0, 0, w, h);
    ctx.fillStyle = '#1c2346'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '600 ' + Math.round(h * 0.09) + 'px ' + CAPS; ctx.fillText('THE RIM TRAIN · STATION RING 5', w / 2, h * 0.09);
    const cx = w * 0.3, cy = h * 0.56, R = h * 0.32;
    ctx.strokeStyle = '#b5532e'; ctx.lineWidth = h * 0.03; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2 - PI / 2; ctx.fillStyle = i === 0 ? '#d29a34' : '#1c2346'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, h * (i === 0 ? 0.035 : 0.024), 0, 7); ctx.fill(); }
    ctx.font = '600 ' + Math.round(h * 0.05) + 'px ' + CAPS; ctx.fillStyle = '#1c2346';
    ctx.fillText('YOU ARE HERE', cx, cy - R - h * 0.06); ctx.fillText('18.8 KM ROUND', cx, cy); ctx.fillText('SIX FACES', cx, cy + h * 0.06);
    ctx.textAlign = 'left'; ctx.font = 'italic 600 ' + Math.round(h * 0.06) + 'px ' + SERIF;
    const L = ['A train every couple of minutes,', 'stopping at every face.', 'Glide trains above: a thousand', 'seats, a hundred metres long.', 'Rings 417 m apart along the drum:', 'for another ring, take a cab.'];
    L.forEach((t, i) => ctx.fillText(t, w * 0.56, h * (0.3 + i * 0.1)));
  };
}

// the cycler capsule berths: round hatches in the back wall at the spinward end, and the desk
function capsules(s, game, f, Y, ZB) {
  const g = s.g, P = PAL5, zw = ZB - 0.3;
  s.structure(() => {
    for (let i = 0; i < 5; i++) {
      const x = 44 + i * 4.2;
      g.mat('panel', P.indigo); g.push(); g.move(x, Y + 1.5, zw); g.rotX(PI / 2); g.cyl(0, -0.02, 0, 1.15, 0.12, { segs: 28 }); g.pop();
      g.mat('cast', P.brass, { rough: -0.2 }); g.push(); g.move(x, Y + 1.5, zw - 0.1); g.rotX(PI / 2); g.lathe(0, 0, [[1.05, 0], [0.95, 0.0]], { segs: 28 }); g.cyl(0, 0, 0, 0.92, 0.06, { segs: 28 }); g.pop();
      g.mat('brushed', '#a3a7a3'); g.push(); g.move(x, Y + 1.5, zw - 0.16); g.rotX(PI / 2); g.cyl(0, 0, 0, 0.86, 0.04, { segs: 28 }); g.pop();
      g.mat('cast', '#2a2d2e'); for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; g.ball(x + Math.cos(a) * 0.98, Y + 1.5 + Math.sin(a) * 0.98, zw - 0.17, 0.035, 0.035, 0.02, { segs: 6, rings: 4 }); }
      g.mat('diffuser', i === 1 ? '#86e08e' : '#ffb347', { emissive: 4 }); g.ball(x, Y + 2.85, zw - 0.1, 0.07, 0.07, 0.07, { segs: 8, rings: 5 });
      g.mat('cast', P.brass); g.box(x + 0.5, Y + 1.4, zw - 0.24, x + 0.62, Y + 1.6, zw - 0.18);
    }
  });
  for (let i = 0; i < 5; i++) signK(s, { kind: 'plate', text: 'CAPSULE ' + (i + 1), sub: i === 1 ? 'boarding' : i === 3 ? 'express' : 'slow line' }, 44 + i * 4.2, Y + 3.25, zw - 0.02, { face: 'z', w: 0.9, h: 0.3, k: 2.5 });
  // the desk
  s.furniture(() => {
    g.mat('wood', '#5b3e28'); g.box(36.2, Y, 6.6, 40.2, Y + 1.04, 7.3, { bevel: 0.02 });
    g.mat('panel', P.terra); g.box(36.3, Y + 0.15, 6.58, 40.1, Y + 0.9, 6.6, { faces: 'z' });
    g.mat('stone', '#d9cdb4'); g.box(36.1, Y + 1.04, 6.5, 40.3, Y + 1.09, 7.4);
  });
  s.solid(36.1, Y, 6.5, 40.3, Y + 1.09, 7.4);
  prop(s, 'station.deskLamp', 39.4, Y + 1.09, 7.0, -0.5, {}); prop(s, 'station.ledgers', 37.0, Y + 1.09, 7.1, 0, {});
  sign(s, { kind: 'fascia', text: 'CYCLER CAPSULES', sub: 'for the other Rows · slow line · express', palette: ['#1c2346', '#efe3c8', '#d29a34'] }, 52.4, Y + 4.2, zw - 0.02, { face: 'z', w: 5.6, h: 0.6, glow: 0.8 });
  lamp(s, 'globe', 38.2, Y + 2.4, 6.9, { clip: [34, Y - 0.2, 0, 66, -0.4, ZB], K: 2800, power: 0.8, drop: 5.2 });
  lamp(s, 'spot', 52.4, -0.45, ZB - 2.6, { dir: [0, -0.55, 0.85], cone: [60, 30], clip: [34, Y - 0.2, 0, 66, -0.4, ZB + 0.1], K: 3200, power: 1.1 });
  s.spot('counter', 38.2, Y, 7.9, PI, { tags: ['write'] }); s.spot('customer', 38.2, Y, 5.8, 0, { tags: ['wait'] }); s.spot('queue', 38.5, Y, 5.0, 0, { tags: ['wait'] });
  s.interact({ x: 38.2, y: Y + 1.2, z: 6.0, radius: 1.8, kind: 'talk', prompt: 'Ask at the capsule desk', onUse: (gm) => say(gm, { name: 'The capsule clerk', colour: '#2b3566' }, [
    'One traveller a capsule, about two hundred kilograms in all, you and the capsule and your bag. Only that much gets sped up, so the cycler costs about half what a tube car would.',
    'The slow line runs at two kilometres a second: a million kilometres in about six days, for about one kay. The express runs at twenty: sixteen hours, about a hundred and eleven. Ten days of a wallet, or five.',
    'Spelt? Grain Row. The slow line, if you have the days. Most wanderers do, by the end.']) });
}

// the rim train: five small cars that run in from the anti tunnel, stop, and run on out the spinward one
function train(s, game, f, Y, LC) {
  const NC = 5, CL = 7.4, GAP = 0.5, LEN = NC * CL + (NC - 1) * GAP, zc = -4.1, P = PAL5;
  const body = movable(s, (gg) => {
    for (let i = 0; i < NC; i++) {
      const x0 = -LEN / 2 + i * (CL + GAP), x1 = x0 + CL, y0 = Y - 0.95, y1 = Y + 2.55, z0 = zc - 1.3, z1 = zc + 1.3;
      gg.mat('panel', '#2a2d2e'); gg.box(x0 + 0.3, y0 - 0.25, z0 + 0.2, x1 - 0.3, y0 + 0.05, z1 - 0.2);
      gg.mat('panel', i % 2 ? P.terra : '#a84a2a'); gg.box(x0, y0, z0, x1, y1, z1, { bevel: 0.12 });
      gg.mat('paint', P.cream); gg.box(x0 - 0.005, Y + 0.95, z0 - 0.005, x1 + 0.005, Y + 1.15, z1 + 0.005, { faces: 'xXzZ' });
      gg.mat('paint', P.indigo); gg.box(x0 - 0.005, y0, z0 - 0.005, x1 + 0.005, Y - 0.1, z1 + 0.005, { faces: 'xXzZ' });
      gg.mat('panel', '#3a2a24'); gg.box(x0 + 0.1, y1 - 0.02, z0 + 0.1, x1 - 0.1, y1 + 0.18, z1 - 0.1, { bevel: 0.06 });
      // windows lit warm from inside, two doors on the platform side
      // windows: warm light inside, a mullion, a dark frame; doors with a window each, on the platform side
      for (const [wx0, wx1] of [[x0 + 0.35, x0 + 1.55], [x0 + 2.85, x0 + 4.55], [x0 + 5.85, x0 + 7.05]]) for (const zf of [z1, z0]) {
        const sgn = zf === z1 ? 1 : -1, fc = sgn > 0 ? 'Z' : 'z';
        gg.mat('plain', '#2a2622'); gg.box(wx0 - 0.06, Y + 1.14, Math.min(zf, zf + sgn * 0.02), wx1 + 0.06, Y + 2.16, Math.max(zf, zf + sgn * 0.02), { faces: fc });
        gg.mat('plain', '#e9b878', { emissive: 0.75 }); gg.box(wx0, Y + 1.2, Math.min(zf, zf + sgn * 0.025), wx1, Y + 2.1, Math.max(zf, zf + sgn * 0.025), { faces: fc });
        gg.mat('plain', '#3a2e26'); gg.box((wx0 + wx1) / 2 - 0.03, Y + 1.2, Math.min(zf, zf + sgn * 0.03), (wx0 + wx1) / 2 + 0.03, Y + 2.1, Math.max(zf, zf + sgn * 0.03), { faces: fc });
      }
      for (const dx of [2.2, 5.2]) {
        gg.mat('panel', i % 2 ? '#8f3f22' : '#7a3a20'); gg.box(x0 + dx - 0.6, Y + 0.05, z1, x0 + dx + 0.6, Y + 2.2, z1 + 0.015, { faces: 'Z' });
        gg.mat('plain', '#e9b878', { emissive: 0.6 }); for (const sx of [-1, 1]) gg.box(x0 + dx + sx * 0.3 - 0.18, Y + 1.25, z1 + 0.015, x0 + dx + sx * 0.3 + 0.18, Y + 2.0, z1 + 0.02, { faces: 'Z' });
        gg.mat('cast', P.brass); gg.box(x0 + dx - 0.02, Y + 0.05, z1 + 0.015, x0 + dx + 0.02, Y + 2.2, z1 + 0.025, { faces: 'Z' });
        gg.mat('paint', P.yellow); gg.box(x0 + dx - 0.64, Y + 0.05, z1 + 0.012, x0 + dx - 0.6, Y + 2.24, z1 + 0.02, { faces: 'Z' }); gg.box(x0 + dx + 0.6, Y + 0.05, z1 + 0.012, x0 + dx + 0.64, Y + 2.24, z1 + 0.02, { faces: 'Z' });
      }
      if (i === 0 || i === NC - 1) { const xe = i === 0 ? x0 : x1; gg.mat('diffuser', i === 0 ? '#fff4dc' : '#ff4a3a', { emissive: 5 }); for (const dz of [-0.8, 0.8]) gg.ball(xe + (i === 0 ? -0.02 : 0.02), Y + 0.3, zc + dz, 0.09, 0.09, 0.09, { segs: 8, rings: 5 }); }
    }
  }, [-200, 0, 0], { center: [0, Y + 0.8, zc], radius: LEN / 2 + 2, caster: true });
  const lit = s.light({ at: [-200, Y + 1.6, zc], color: warm(3000), power: 10, range: 10, clip: LC, radius: 2 }); lit.scale = 0;
  const T = { state: 'gap', t: 0, dur: 6 };
  const DUR = { in: 13, stand: 20, out: 13 };
  const xAt = (st, k) => (st === 'in' ? -150 * (1 - smoothstep(0, 1, k)) * (1 - smoothstep(0, 1, k)) : st === 'out' ? 150 * smoothstep(0, 1, k) * smoothstep(0, 1, k) : st === 'stand' ? 0 : -200);
  s.every((dt, gm) => {
    T.t += dt;
    if (T.t >= T.dur) {
      T.t = 0;
      T.state = { gap: 'in', in: 'stand', stand: 'out', out: 'gap' }[T.state];
      const h = hour(gm), night = h >= 1 && h < 5;
      T.dur = T.state === 'gap' ? (night ? 50 : 14) : DUR[T.state];
      if (T.state === 'stand') sfx(gm, 'chime', f, 0, Y + 2, 0);
      if (T.state === 'out') sfx(gm, 'whoosh', f, 20, Y + 1, zc);
      if (T.state === 'in') sfx(gm, 'whoosh', f, -30, Y + 1, zc);
    }
    const k = Math.min(1, T.t / T.dur), x = xAt(T.state, k);
    body.userData.origin[0] = x; body.userData.hidden = T.state === 'gap';
    lit.scale = T.state === 'gap' || Math.abs(x) > 80 ? 0 : 1;
    if (lit.scale) lit.theta = f.theta(x);
  });
  void lineX; void toast;
}
