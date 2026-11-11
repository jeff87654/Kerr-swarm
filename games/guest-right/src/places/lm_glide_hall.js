// The Glide: the boarding hall at Station Ring 2's quay level. A short low hall at a full g where single cars wait in
// vacuum berths behind the north wall and you board through round docking hatches. Palette from the ring above: deep
// teal steel, cream panels, brass, safety yellow; the hatch lamps green and amber; the accent a warm oxide red.
//
// Frame 'glide-quay': x spinward, z toward the back cap, y up. The hall is x[-15, 15] z[-5, 5]; the berth wall at z = -5
// with five hatches; the lift lobby is an alcove at the anti end, x[-21, -15].
import { floor, ceiling, wall, lamp, roomGlow, block } from '../world/kit.js';
import { planter } from '../world/kit2.js';
import { prop, bunting } from '../world/props.js';
import { sign } from '../world/signs.js';
import { PAL } from './station_parts.js';

export const HALL = { X0: -15, X1: 15, Z0: -5, Z1: 5, H: 4.0, LX0: -21, HATCH_Y: 1.15, HATCHES: [-10, -5, 0, 5, 10] };
const PI = Math.PI;

export async function say(game, who, lines) { if (!game.ui) return; game.busy++; try { await game.ui.say(who, lines); } finally { game.busy--; } }
export function toast(game, text, dur) { if (game.ui) game.ui.toast(text, { kind: 'info', dur: dur || 6 }); }
export function find(game, id) { if (game.journal && game.journal.find) game.journal.find(id); }
export function sfx(game, name, f, x, y, z) { if (game.audio && game.sfxAt) game.sfxAt(name, f, x, y, z); }
const pick = (game, key, list) => { const k = (game.flags[key] = ((game.flags[key] || 0) + 1)); return list[(k - 1) % list.length]; };

const PORTER = { name: 'Abebi, the berth hand', colour: '#d6a640' };

// ride(game) boards the car; f is the frame.
export function buildHall(game, s, f, ride) {
  const g = s.g, H = HALL.H, X0 = HALL.X0, X1 = HALL.X1, Z0 = HALL.Z0, Z1 = HALL.Z1, LX = HALL.LX0;
  const clip = [LX - 0.2, -0.3, Z0 - 1.2, X1 + 0.2, H + 0.2, Z1 + 0.2];

  // ================= the shell =================
  floor(s, X0, Z0, X1, -3.0, 0, 'deckplate', '#6c6a64');
  floor(s, X0, -3.0, X1, Z1, 0, 'terrazzo', '#b9ab90');
  floor(s, LX, -3.5, X0, 3.5, 0, 'terrazzo', '#ad9f86');
  ceiling(s, LX, -3.5, X0, 3.5, 3.2, 'panel', PAL.vault);
  // the yellow line, the tactile strip and brass joints in the terrazzo
  s.deco(() => {
    g.mat('paint', PAL.yellow); g.box(X0, 0, -3.06, X1, 0.006, -2.94, { faces: 'Y' });
    g.mat('deckplate', '#c99f35'); g.box(X0, 0, -2.86, X1, 0.008, -2.4, { faces: 'Y' });
    g.mat('cast', PAL.brass, { rough: -0.2 }); for (let x = X0 + 3; x < X1; x += 3) g.box(x - 0.015, 0, -2.4, x + 0.015, 0.004, Z1, { faces: 'Y' });
    g.box(X0, 0, 1.47, X1, 0.004, 1.53, { faces: 'Y' });
    g.mat('terrazzo', '#8a3a2c'); g.box(X0, 0, -1.2, X1, 0.003, 1.2, { faces: 'Y' });
  });
  // walls: the berth wall is thick (the berths are in vacuum on the other side); the back wall panelled
  const WALL = { t: 0.3, mat: 'panel', tint: PAL.cream, dado: { h: 1.25, mat: 'panel', tint: PAL.teal }, skirt: '#25292a' };
  wall(s, X0, Z1, X1, Z1, 0, H, WALL);
  wall(s, X1, Z0, X1, Z1, 0, H, WALL);
  wall(s, LX, -3.5, LX, 3.5, 0, 3.2, WALL);
  wall(s, LX, -3.5, X0, -3.5, 0, 3.2, WALL); wall(s, LX, 3.5, X0, 3.5, 0, 3.2, WALL);
  for (const [a, b] of [[Z0, -3.5], [3.5, Z1]]) wall(s, X0, a, X0, b, 0, H, WALL);
  wall(s, X0, -3.5, X0, 3.5, 3.2, H - 3.2, Object.assign({}, WALL, { dado: null, skirt: false }));
  // the berth wall, with a round hole at each hatch (drawn as panels round square openings; the rings fill them)
  const WX = HALL.HATCHES;
  for (let i = 0; i <= WX.length; i++) {
    const a = i === 0 ? X0 : WX[i - 1] + 0.95, b = i === WX.length ? X1 : WX[i] - 0.95;
    wall(s, a, Z0, b, Z0, 0, H, WALL);
  }
  for (const x of WX) {
    wall(s, x - 0.95, Z0, x + 0.95, Z0, 0, 0.32, Object.assign({}, WALL, { dado: { h: 0.32, mat: 'panel', tint: PAL.teal } }));
    wall(s, x - 0.95, Z0, x + 0.95, Z0, 2.0, H - 2.0, WALL);
    s.structure(() => {
      // a teal surround plate round the hatch, with a square hole the ring covers
      const yc = HALL.HATCH_Y, h = 0.62, zf = Z0 + 0.15;
      g.mat('panel', PAL.teal);
      g.box(x - 0.95, yc + h, zf - 0.02, x + 0.95, 2.0, zf + 0.02, { faces: 'Zy' }); g.box(x - 0.95, 0.32, zf - 0.02, x + 0.95, yc - h, zf + 0.02, { faces: 'ZY' });
      g.box(x - 0.95, yc - h, zf - 0.02, x - h, yc + h, zf + 0.02, { faces: 'ZX' }); g.box(x + h, yc - h, zf - 0.02, x + 0.95, yc + h, zf + 0.02, { faces: 'Zx' });
    });
  }
  // the ceiling: cream panels between deep teal beams, a brass cornice
  ceiling(s, X0, Z0, X1, Z1, H, 'panel', PAL.vault);
  for (let x = X0 + 1.5; x < X1; x += 3) s.structure(() => {
    g.mat('panel', PAL.tealDark); g.box(x - 0.14, H - 0.42, Z0 + 0.95, x + 0.14, H, Z1 - 0.15, { faces: 'xXyzZ' });
    g.mat('cast', PAL.brass, { rough: -0.15 }); g.box(x - 0.15, H - 0.45, Z0 + 0.95, x + 0.15, H - 0.42, Z1 - 0.15, { faces: 'y' });
  });
  s.structure(() => { g.mat('panel', PAL.tealDark); g.box(X0, H - 0.3, Z1 - 0.45, X1, H, Z1 - 0.15, { faces: 'yz' }); g.mat('cast', PAL.brass); g.box(X0, H - 0.33, Z1 - 0.47, X1, H - 0.3, Z1 - 0.15, { faces: 'yz' }); });
  // vacuum mains along the top of the berth wall, with their stencils
  const PIPES = [{ y: 3.62, r: 0.18, c: '#5b6a70', label: { kind: 'label', text: 'BERTH VACUUM', sub: 'do not open' } }, { y: 3.26, r: 0.1, c: '#a8432e', label: { kind: 'label', text: '65 °C LOOP', sub: 'to the ring counter' } }];
  for (let x = X0; x < X1; x += 10) s.structure(() => {
    for (const p of PIPES) {
      const zp = Z0 + 0.32 + p.r; g.mat('cast', p.c, { rough: 0.05 }); g.tube([[x, p.y, zp], [x + 5, p.y, zp], [x + 10, p.y, zp]], p.r, { segs: 12, caps: false });
      g.mat('cast', '#3a3f41'); for (let k = 0; k < 3; k++) { const xx = x + 1.5 + k * 3.5; g.box(xx - 0.04, p.y - p.r - 0.05, Z0 + 0.15, xx + 0.04, p.y + p.r, zp); }
    }
  });
  for (const x of [-12.5, 2.5]) for (const p of PIPES) sign(s, p.label, x, p.y, Z0 + 0.34 + 2 * p.r + 0.01, { face: 'Z', w: 0.9, h: 0.26 });

  // ================= the hatches =================
  WX.forEach((x, i) => hatch(game, s, f, x, i, ride));

  // the departures strip over the middle hatches
  sign(s, { kind: 'board', title: 'GLIDE DEPARTURES · BERTHS 1 TO 5', lines: ['SORREL · berth 3 · boarding now', 'SORREL · berth 5 · 4 min · berth 1 · 7 min', 'RUE · two glides · change at Sorrel'], palette: ['#101614', '#f3e6c8', '#7be08a'] }, 0, 2.76, Z0 + 0.17, { face: 'Z', w: 3.4, h: 0.62, glow: 1.4 });
  s.interact({ x: 0, y: 2.6, z: Z0 + 1.5, radius: 3.2, prompt: 'Read the departures', onUse: async (gm) => {
    await say(gm, 'Glide departures', ['Sorrel from berth 3, boarding now. Sorrel again from berth 5 in four minutes, and from berth 1 in seven. These berths send single cars; the long trains go from the platform upstairs, one every two seconds at the peak.', 'Rue: two glides. Change at Sorrel\'s Ring Two; you are there in about five minutes.', 'Every car takes 140 seconds. No car costs anything.']);
    find(gm, 'rue-two-glides');
  } });

  // ================= the south side: benches, notices, the berth hand =================
  const benchAt = (x, z, yaw, w) => { prop(s, 'bench', x, 0, z, yaw, { w, back: true, wood: '#7a5233', metal: PAL.tealDark }); };
  const BX = [-11.5, -6.5, 6.5, 11.5];
  for (const x of BX) {
    benchAt(x, Z1 - 0.7, PI, 2.6);
    for (const dx of [-0.8, 0, 0.8]) s.spot('sit', x + dx, 0.45, Z1 - 0.72, PI, { tags: ['glide', 'wait'] });
    s.interact({ x, y: 0.8, z: Z1 - 1.0, radius: 1.2, prompt: (gm) => (gm.player.seat && gm.player.seat.glide ? 'Stand up' : 'Sit on the bench'), onUse: (gm) => {
      const p = gm.player; if (p.seat) { p.stand(); return; }
      p.sit({ x: x + 0.4, y: 0, z: Z1 - 0.62, yaw: 0, eye: 1.12, glide: true }); p.yaw = 0; p.pitch = 0.05;
    } });
  }
  // planters between, under the notices: herbs and ferns, Chervil's habit of putting a plant under every lamp
  for (const x of [-9, 9]) planter(s, x, 0, Z1 - 0.5, { w: 1.6, d: 0.6, h: 0.5, mat: 'panel', tint: PAL.teal, plants: x < 0 ? 'herbs' : 'fern', seed: x });
  planter(s, -1.9, 0, Z1 - 0.5, { w: 1.0, d: 0.6, h: 0.5, mat: 'panel', tint: PAL.teal, plants: 'broad', seed: 3 });
  prop(s, 'platform.fountain', 1.9, 0, Z1 - 0.55, PI, {});
  prop(s, 'platform.bin', 3.2, 0, Z1 - 0.45, 0, { c: PAL.teal });

  // the notice of what the ride is
  const n1 = { kind: 'notice', title: 'THE GLIDE', lines: ['A car is let go from the quay', 'at 174.4 metres a second', 'and falls in a straight line,', 'weighing nothing, for 140 s,', 'across 24.5 km of dark.', 'The next drum\'s rim catches', 'it at its own speed.', 'It costs nearly nothing.', 'It is free.'] };
  sign(s, n1, -9, 1.75, Z1 - 0.16, { face: 'z', w: 0.62, h: 0.86 });
  s.interact({ x: -9, y: 1.6, z: Z1 - 1.1, radius: 1.3, prompt: 'Read the notice', onUse: async (gm) => {
    await say(gm, 'The notice', ['The Glide. At the quay, a band of track round the drum\'s waist outside the jacket and the moat, a cradle carries the car round at 174.4 metres a second and lets it go at the lane\'s touch point.', 'For 140 seconds the car falls in a straight line across 24.5 kilometres of dark, and nothing in it weighs anything. Then the next drum\'s rim comes round to meet it at exactly its own speed.', 'Nearly all the energy comes back at the catch, so it costs nearly nothing, and it is free. Sorrel is eight and a half minutes door to door. Most of that is the cab.']);
    find(gm, 'glide');
  } });
  // why the windows face aft
  const n2 = { kind: 'notice', title: 'WHY THE PORT FACES AFT', lines: ['Between the drums the dark', 'is full of hard X-rays from', 'the Lantern\'s side. Enough', 'to kill in minutes.', 'So the cars are armoured all', 'round, and the one port', 'looks the one safe way: aft,', 'through 1.3 m of clear water.'], palette: ['#1d3b39', '#f3e6c8', '#d8a657'] };
  sign(s, n2, 9, 1.75, Z1 - 0.16, { face: 'z', w: 0.62, h: 0.86 });
  s.interact({ x: 9, y: 1.6, z: Z1 - 1.1, radius: 1.3, prompt: 'Read why the port faces aft', onUse: async (gm) => {
    await say(gm, 'The notice', ['Out between the drums the dark is flooded with hard X-rays, from the Lantern\'s side and scattered back off the radiators. An unshielded person would have a fatal dose in minutes.', 'So the cars are squat and armoured all round, and their one port looks the one safe way, aft, through about 1.3 metres of clear water. You ride facing backwards and watch where you have been.']);
    find(gm, 'windows-aft');
  } });
  // the catch, on a card by the porter's desk
  const n3 = { kind: 'notice', title: 'THE CATCH', lines: ['At the far drum a cradle waits', 'at the touch point. It takes', 'the car on a soft arm that', 'gives the energy back, and', 'your weight comes back over', 'a second or two.', 'Keep the harness on', 'until the board says.'], palette: ['#2a1a14', '#f3e6c8', '#c9552e'] };
  sign(s, n3, 13.2, 1.75, Z1 - 0.16, { face: 'z', w: 0.62, h: 0.86 });
  s.interact({ x: 13.2, y: 1.6, z: Z1 - 1.1, radius: 1.3, prompt: 'Read the card about the catch', onUse: async (gm) => {
    await say(gm, 'The card', ['At the far drum a cradle is parked at the touch point as the car arrives. Relative speed there is nothing, but the rim curves away at a full g, so the cradle takes the car on a compliant arm and brings your weight back over a second or two.', 'The arm is regenerative: it gives back most of what the release cost. Somebody has written underneath, in pencil: the catch is a young people\'s ride. Somebody else has written: then I am young.']);
    find(gm, 'catch');
  } });

  // a model of a car in a glass case: cut open to show the water in its walls
  carModel(s, -4.2, Z1 - 0.75);
  s.interact({ x: -4.2, y: 1.1, z: Z1 - 1.4, radius: 1.3, prompt: 'Look at the model car', onUse: async (gm) => {
    await say(gm, 'The model', ['A glide car at a tenth of its size, cut open down one side. Its walls are mostly tanks: about thirteen tonnes of sealed water for every seat, more on the side that faces the Lantern than on the side with the port.', 'That is why the cars are squat. Six seats, a room you can just stand up in, and all that water round it. A plate on the case says the model was made in Chervil out of a broken one, and is lent to the hall.']);
  } });

  // the day's count, chalked by the berth hand
  const chalk = { kind: 'chalk', title: 'Out and back', lines: ['On a working day about', '45 in every 100 of us', 'glide out and come home.', 'Chervil: some 87 million.', 'This berth today: 1,312', 'Lost: 3 gloves, 1 flute'] };
  sign(s, chalk, 11.7, 1.6, Z1 - 0.18, { face: 'z', w: 0.62, h: 0.9 });
  s.interact({ x: 11.7, y: 1.5, z: Z1 - 1.0, radius: 1.2, prompt: 'Read the chalk board', onUse: async (gm) => {
    await say(gm, 'The chalk board', ['On a working day about forty-five in every hundred people in a drum glide out and come home again: in Chervil, some eighty-seven million. Most go from the platform upstairs, on the thousand-seat trains.', 'These berths send the single cars: late ones, small parties, people who asked. This berth today: one thousand three hundred and twelve. Lost: three gloves and one flute, which is a long thing to lose.']);
  } });

  // the berth hand's post by hatch 3: a high desk, a ledger, a lidded flask, a crate of loan straps
  block(s, 2.0, 0, -2.2, 3.0, 1.05, -1.6, 'wood', '#5a3a28', { bevel: 0.02 });
  s.detail(() => {
    g.mat('wood', '#7a5233'); g.box(1.95, 1.05, -2.25, 3.05, 1.1, -1.55, { bevel: 0.01 });
    g.mat('paper', '#efe6d2'); g.box(2.2, 1.1, -2.05, 2.7, 1.125, -1.75); g.mat('weave', '#5a2a22'); g.box(2.18, 1.095, -2.07, 2.72, 1.1, -1.73);
    g.mat('cast', PAL.brass); g.lathe(2.85, -1.9, [[0, 1.1], [0.05, 1.1], [0.055, 1.3], [0.04, 1.33], [0.042, 1.36], [0, 1.37]], { segs: 10 });
  });
  prop(s, 'stool', 2.5, 0, -1.2, 0, { h: 0.7 });
  prop(s, 'platform.lockers', 13.4, 0, -4.6, 0, { c: '#5b7a6e' });
  prop(s, 'platform.toolbox', 12.2, 0, -4.55, 0.2, { c: '#a8432e' });
  s.spot('work', 2.5, 0, -1.25, PI, { tags: ['porter', 'glide'] });
  s.interact({ x: 2.5, y: 1.2, z: -1.0, radius: 1.5, kind: 'talk', prompt: 'Talk to the berth hand', onUse: async (gm) => {
    if (gm.flags.rode_glide) {
      await say(gm, PORTER, pick(gm, 'glide.porter.after', [
        ['Back already. That is the thing about Sorrel: you can go for ramen and be home for the dishes.', 'Did you watch the flask float off its strap. Everyone watches the flask.'],
        ['You stayed on. Good. Sorrel will keep. Sorrel is very good at keeping.'],
        ['The catch got you. It gets me some days, and I have done it for thirty-one years.'],
        ['Next time take the long trains from upstairs, and look at the faces. A thousand people all looking backwards at once.'],
      ]));
      return;
    }
    await say(gm, PORTER, pick(gm, 'glide.porter', [
      ['Where did you sleep, and have you eaten. Good, in that order. Berth 3 is boarding: Sorrel and back, if you just want to see it. Nobody minds a guest riding round.', 'Harness on before the countdown. The board over the port tells you everything.'],
      ['Thirteen tonnes of water round every seat. You could stand in the dark out there for a minute and a half and never know it was killing you. In here you just get the view.'],
      ['Sit at the front, in the middle. The port is a tunnel, and from the middle you see the whole of it.', 'And leave your cup on the platform. The cars take no soup.'],
      ['People ask why the port faces backwards. It faces the only way it can. You look at where you have been, which most people say is the right way round anyway.'],
    ]));
  } });

  // ================= the lift lobby: an alcove at the anti end, two cab berths =================
  lobby(game, s, f);

  // ================= light =================
  roomGlow(s, X0, 0, Z0, X1, H, Z1, { sky: '#ffe2bc', ground: '#a8916c', power: 0.22 });
  for (const x of [-10.5, -4.5, 1.5, 7.5, 13.5]) lamp(s, 'globe', x, 3.15, 0.6, { K: 2900, power: 1.3, drop: 0.7, clip, r: 0.2 });
  for (const x of WX) lamp(s, 'spot', x, H - 0.45, -3.6, { K: 3400, power: 0.7, clip, cone: [45, 25] });
  for (const x of [-11.5, -6.5, 6.5, 11.5]) lamp(s, 'sconce', x, 2.3, Z1 - 0.18, { face: 'z', K: 2700, power: 0.7, clip });

  // ================= festival bunting, half up =================
  const BUNT = ['#c9552e', '#e7b547', '#2f6f73', '#e9e2d0', '#8a2f3c', '#6b8f4e', '#3b4a7a'];
  for (let x = X0 + 1.5; x < 4.5; x += 3) bunting(s, [x, H - 0.45, Z1 - 0.3], [x + 3, H - 0.45, Z1 - 0.3], { colors: BUNT, sag: 0.25 });
  prop(s, 'platform.flagcrate', 5.3, 0, Z1 - 1.6, 0.3, {});

  // ================= people, paths, sound, zone =================
  s.path([[LX + 2.5, 0], [X0 + 0.5, 0], [-10, 0], [-5, 0], [0, 0], [5, 0], [10, 0], [X1 - 1, 0]]);
  for (const x of WX) s.path([[x, 0], [x, -2.5]]);
  for (const x of BX) s.path([[x, 0], [x, Z1 - 1.5]]);
  for (let i = 0; i < 4; i++) s.spot('queue', -0.3 + (i % 2) * 0.5, 0, -2.4 + i * 0.75, PI, { tags: ['glide', 'board'] });
  for (const p of [[-5.4, -2.5, PI], [5.4, -2.2, PI + 0.3], [-8.3, 1.4, 0.4], [7.6, 0.6, -0.6]]) s.spot('stand', p[0], 0, p[1], p[2], { tags: ['glide', 'wait'] });
  for (const c of [[-2.8, 2.6, 2.2], [-3.6, 2.0, -0.9], [-2.2, 1.7, PI + 0.4]]) s.spot('chat', c[0], 0, c[1], c[2], { tags: ['glide'] });
  s.spot('browse', -4.2, 0, Z1 - 1.5, 0, { tags: ['glide', 'read'] });
  s.spot('browse', 9, 0, Z1 - 1.3, 0, { tags: ['glide', 'read'] });
  s.loop('platform', 0, 3, Z0 + 0.5, { vol: 0.3, radius: 26 });
  s.loop('air', -12, 3.5, Z0 + 0.6, { vol: 0.25, radius: 14 });
  s.loop('murmur', 0, 1.5, 1.5, { vol: 0.25, radius: 18, param: 0.3 });
}

// One hatch: a round door in a thick ring, a lamp over it, its number, a port into the berth. Hatch 3 stands open.
function hatch(game, s, f, x, i, ride) {
  const g = s.g, yc = HALL.HATCH_Y, z = HALL.Z0, open = i === 2;
  // the ring: teal, a brass lip, yellow hazard ring on the wall
  s.furniture(() => {
    g.mat('cast', PAL.tealDark);
    g.push(); g.move(x, yc, z + 0.15); g.rotX(PI / 2); g.lathe(0, 0, [[0.62, -0.25], [0.88, -0.25], [0.92, -0.2], [0.92, 0.05], [0.87, 0.12], [0.62, 0.12]], { segs: 32, capTop: false, capBottom: false }); g.pop();
    g.mat('cast', PAL.brass, { rough: -0.2 });
    const ring = []; for (let k = 0; k < 32; k++) { const a = k / 32 * PI * 2; ring.push([x + Math.cos(a) * 0.7, yc + Math.sin(a) * 0.7, z + 0.29]); } g.tube(ring, 0.022, { segs: 5, closed: true });
    g.mat('paint', PAL.yellow); const r2 = []; for (let k = 0; k < 36; k++) { const a = k / 36 * PI * 2; r2.push([x + Math.cos(a) * 0.9, yc + Math.sin(a) * 0.9, z + 0.155]); } g.tube(r2, 0.03, { segs: 4, closed: true });
    // dogs round the ring
    g.mat('cast', '#3a3f41'); for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2 + 0.2; g.push(); g.move(x + Math.cos(a) * 0.74, yc + Math.sin(a) * 0.74, z + 0.3); g.rotZ(a); g.box(-0.05, -0.03, -0.02, 0.07, 0.03, 0.04, { bevel: 0.008 }); g.pop(); }
  });
  // the tunnel through the wall, and the door
  if (!open) {
    s.furniture(() => {
      g.mat('cast', '#4b5250', { rough: 0.1 });
      g.push(); g.move(x, yc, z + 0.05); g.rotX(PI / 2); g.cyl(0, -0.05, 0, 0.64, 0.12, { segs: 32 }); g.pop();
      g.mat('cast', PAL.brass, { rough: -0.2 });
      const w = []; for (let k = 0; k < 20; k++) { const a = k / 20 * PI * 2; w.push([x + Math.cos(a) * 0.22, yc + Math.sin(a) * 0.22, z + 0.22]); } g.tube(w, 0.02, { segs: 5, closed: true });
      for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2; g.tube([[x, yc, z + 0.22], [x + Math.cos(a) * 0.22, yc + Math.sin(a) * 0.22, z + 0.22]], 0.014, { segs: 4 }); }
      g.cyl(x, yc - 0.01, z + 0.17, 0.05, 0.05, { segs: 8 });
    });
  } else {
    // open: the door swung back against the wall on its hinge, the docking tube lit warm beyond
    s.furniture(() => {
      g.mat('cast', '#4b5250', { rough: 0.1 });
      g.push(); g.move(x + 0.86, yc, z + 0.86); g.rotZ(PI / 2); g.cyl(0, -0.06, 0, 0.64, 0.12, { segs: 32 }); g.pop();
      g.mat('cast', '#3a3f41'); g.box(x + 0.8, yc - 0.12, z + 0.2, x + 0.92, yc + 0.12, z + 0.86, { bevel: 0.02 });
      // the tube: padded, cream, ribbed, running to the car's own hatch
      g.mat('weave', '#d5c4a0');
      g.push(); g.move(x, yc, z - 0.9); g.rotX(PI / 2); g.lathe(0, 0, [[0.62, 1.0], [0.62, -0.95]], { segs: 24, capTop: false, capBottom: false }); g.pop();
      g.mat('weave', '#b9a47e'); for (let k = 0; k < 5; k++) { const zz = z - 0.2 - k * 0.38, rr = []; for (let j = 0; j < 24; j++) { const a = j / 24 * PI * 2; rr.push([x + Math.cos(a) * 0.6, yc + Math.sin(a) * 0.6, zz]); } g.tube(rr, 0.025, { segs: 4, closed: true }); }
      g.mat('speckle', '#3c514e'); g.box(x - 0.42, yc - 0.6, z - 1.9, x + 0.42, yc - 0.56, z + 0.15, { faces: 'Y' });
      // at the far end, the car's oxide-red hatch frame and a glimpse of a seat
      g.mat('panel', PAL.oxide); g.push(); g.move(x, yc, z - 1.9); g.rotX(PI / 2); g.lathe(0, 0, [[0.5, -0.05], [0.66, -0.05], [0.66, 0.05], [0.5, 0.05]], { segs: 24 }); g.pop();
      g.mat('weave', '#3c342a'); g.box(x - 0.55, yc - 0.6, z - 2.6, x + 0.55, yc + 0.6, z - 2.5, { faces: 'Z' });
      g.mat('leather', '#2f6f73'); g.box(x - 0.22, yc - 0.6, z - 2.45, x + 0.22, yc - 0.1, z - 2.15, { bevel: 0.04 });
    });
    s.light({ at: [x, yc + 0.35, z - 1.4], color: [1.0, 0.8, 0.55], power: 1.6, range: 3.5, clip: [x - 0.7, yc - 0.7, z - 2.7, x + 0.7, yc + 0.7, z + 0.6] });
    s.solid(x - 0.9, 0, z - 3, x + 0.9, 3, z - 0.15);
    s.interact({ x, y: 1.2, z: z + 0.7, radius: 1.6, prompt: (gm) => (gm.flags.rode_glide ? 'Board the car for Sorrel again' : 'Board the car for Sorrel'), onUse: (gm) => ride(gm) });
    sign(s, { kind: 'plate', text: 'SORREL', sub: 'boarding · 140 s · free' }, x + 1.35, 1.55, z + 0.16, { face: 'Z', w: 0.62, h: 0.24, glow: 0.6 });
  }
  // the berth lamp over the hatch: green boarding, amber standing, dark empty
  const lampC = open ? '#7be08a' : i === 1 ? '#3a3f3a' : '#ffb347';
  s.furniture(() => {
    g.mat('cast', '#2a2d2e'); g.push(); g.move(x, yc + 1.0, z + 0.16); g.rotX(PI / 2); g.cyl(0, 0, 0, 0.12, 0.06, { segs: 14 }); g.pop();
    g.mat('diffuser', lampC, { emissive: i === 1 ? 0.2 : open ? 5 : 3 }); g.ball(x, yc + 1.0, z + 0.24, 0.09, 0.09, 0.07, { segs: 12, rings: 6, bottom: 0 });
  });
  if (i !== 1) s.light({ at: [x, yc + 1.0, z + 0.4], color: open ? [0.45, 1.0, 0.5] : [1.0, 0.62, 0.22], power: open ? 0.9 : 0.5, range: 2.4, clip: [x - 1.6, -0.2, z, x + 1.6, 3, z + 2] });
  sign(s, { kind: 'letters', text: String(i + 1), palette: ['#ead9b4'] }, x - 1.25, yc + 0.95, z + 0.16, { face: 'Z', w: 0.4, h: 0.48 });
  // a small port into the vacuum berth beside the hatch: the car in there, in red light
  if (i !== 2) {
    const px = x + 1.3, py = 1.55;
    s.furniture(() => {
      g.mat('cast', PAL.brass, { rough: -0.2 }); const rr = []; for (let k = 0; k < 18; k++) { const a = k / 18 * PI * 2; rr.push([px + Math.cos(a) * 0.17, py + Math.sin(a) * 0.17, z + 0.17]); } g.tube(rr, 0.025, { segs: 5, closed: true });
      g.mat('plain', '#090808'); g.push(); g.move(px, py, z + 0.12); g.rotX(PI / 2); g.cyl(0, 0, 0, 0.16, 0.01, { segs: 18 }); g.pop();
      if (i !== 1) { g.mat('panel', PAL.oxide, { emissive: 0.25 }); g.box(px - 0.12, py - 0.13, z + 0.131, px + 0.02, py + 0.1, z + 0.133, { faces: 'Z' }); g.mat('paint', '#e8dcbf', { emissive: 0.2 }); g.box(px - 0.12, py + 0.02, z + 0.1335, px + 0.02, py + 0.05, z + 0.135, { faces: 'Z' }); }
    });
    if (i === 0 || i === 3) s.interact({ x: px, y: py, z: z + 0.8, radius: 1.0, prompt: 'Look through the berth port', onUse: async (gm) => {
      await say(gm, 'The berth port', ['A thumb of thick glass into the berth. In the red light a car\'s flank fills it: oxide-red plate, rivets, a cream band and the edge of a stencil. There is no air round it. The berth is pumped down before the hatch is opened, so nothing comes out with the car but the car.', 'On the sill somebody has left a folded paper boat, which in a drum with no sea is a joke about the water in the walls.']);
    } });
  }
  sign(s, { kind: 'plate', text: 'BERTH ' + (i + 1), sub: open ? 'boarding' : i === 1 ? 'car out' : 'car standing' }, x + 1.3, 0.95, z + 0.16, { face: 'Z', w: 0.36, h: 0.15 });
}

// A model glide car at a tenth, cut open, on a plinth under a glass case.
function carModel(s, x, z) {
  const g = s.g;
  block(s, x - 0.6, 0, z - 0.4, x + 0.6, 0.85, z + 0.4, 'wood', '#5a3a28', { bevel: 0.02 });
  s.detail(() => {
    const y = 0.88, hx = 0.45, d = 0.6, top = 0.3;
    g.mat('panel', PAL.oxide); g.box(x - hx, y, z - d / 2, x + hx, y + top, z - d / 2 + 0.08); g.box(x - hx, y, z - d / 2, x - hx + 0.08, y + top, z + d / 2); g.box(x + hx - 0.08, y, z - d / 2, x + hx, y + top, z + d / 2);
    g.mat('panel', '#7a3a22'); g.box(x - hx - 0.01, y + top, z - d / 2 - 0.01, x + hx + 0.01, y + top + 0.03, z + d / 2 + 0.01);
    // the water, showing in the cut faces
    g.mat('glaze', '#2f8f9a', { emissive: 0.25, rough: -0.3 }); g.box(x - hx + 0.01, y + 0.01, z + d / 2 - 0.08, x + hx - 0.01, y + top - 0.01, z + d / 2 - 0.005, { faces: 'Z' });
    g.box(x - hx + 0.012, y + 0.01, z - d / 2 + 0.081, x + hx - 0.012, y + top - 0.01, z - d / 2 + 0.085, { faces: 'Z' });
    g.mat('weave', '#d5c4a0'); g.box(x - hx + 0.09, y, z - d / 2 + 0.09, x + hx - 0.09, y + 0.005, z + d / 2 - 0.09, { faces: 'Y' });
    const C = ['#2f6f73', '#8a2f3c', '#c08a2e']; for (let i = 0; i < 3; i++) { g.mat('leather', C[i]); g.box(x - 0.2 + i * 0.2 - 0.05, y, z - 0.02, x - 0.2 + i * 0.2 + 0.05, y + 0.12, z + 0.06, { bevel: 0.01 }); }
    g.mat('cast', '#b08a45'); g.box(x - 0.6, 0.85, z + 0.38, x + 0.6, 0.86, z + 0.4);
  });
  s.glass(x - 0.58, 0.86, z + 0.38, x + 0.58, 1.35, z + 0.38, { tint: '#d5e6e2', opacity: 0.1 });
  s.glass(x - 0.58, 0.86, z - 0.38, x - 0.58, 1.35, z + 0.38, { tint: '#d5e6e2', opacity: 0.1 });
  s.glass(x + 0.58, 0.86, z - 0.38, x + 0.58, 1.35, z + 0.38, { tint: '#d5e6e2', opacity: 0.1 });
  s.deco(() => { g.mat('cast', '#b08a45'); g.box(x - 0.6, 1.35, z - 0.4, x + 0.6, 1.38, z + 0.4); });
  sign(s, { kind: 'plate', text: 'A GLIDE CAR AT A TENTH', sub: '13 t of water a seat' }, x, 0.6, z + 0.405, { face: 'Z', w: 0.5, h: 0.2 });
}

// The lift lobby alcove: two cab berths in the anti wall, a call post, a bench.
function lobby(game, s, f) {
  const g = s.g, LX = HALL.LX0, clip = [LX - 0.2, -0.3, -3.6, HALL.X0 + 0.5, 3.3, 3.6];
  for (const z0 of [-2.5, 0.9]) {
    const zc = z0 + 0.8;
    s.furniture(() => {
      g.mat('cast', PAL.brass, { rough: -0.1 }); g.box(LX + 0.15, 0.02, z0, LX + 0.2, 2.28, zc - 0.01); g.box(LX + 0.15, 0.02, zc + 0.01, LX + 0.2, 2.28, z0 + 1.6);
      g.mat('cast', '#8a6d3b'); for (const y of [0.5, 1.2, 1.9]) g.box(LX + 0.2, y, z0 + 0.06, LX + 0.215, y + 0.03, z0 + 1.54);
      g.mat('panel', PAL.teal); g.box(LX + 0.15, 2.3, z0 - 0.15, LX + 0.32, 2.62, z0 + 1.75, { bevel: 0.02 });
      g.mat('diffuser', '#ffd9a0', { emissive: 3, lamp: true }); g.box(LX + 0.32, 2.4, zc - 0.25, LX + 0.34, 2.5, zc + 0.25);
    });
  }
  prop(s, 'platform.callpost', LX + 1.0, 0, -0.1, PI / 2, {});
  s.interact({ x: LX + 1.0, y: 1.2, z: -0.1, radius: 1.8, prompt: 'Call a cab', onUse: (gm) => { sfx(gm, 'berth-door', f, LX + 0.3, 1.2, 0); if (gm.cab) gm.cab.open('glide-quay'); } });
  sign(s, { kind: 'fascia', text: 'CAB BERTHS', sub: 'up into the drum · Candlewick · the Hollow', palette: [PAL.tealDark, '#f3e6c8', '#d8a657'] }, LX + 0.18, 2.88, 0, { face: 'X', w: 3.2, h: 0.4, glow: 1.2 });
  prop(s, 'bench', LX + 3.0, 0, 3.0, PI, { w: 2.0, back: true, wood: '#7a5233', metal: PAL.tealDark });
  for (const dx of [-0.5, 0.5]) s.spot('sit', LX + 3.0 + dx, 0.45, 3.0, PI, { tags: ['wait'] });
  s.spot('stand', LX + 2.0, 0, -1.6, PI / 2, { tags: ['wait'] }); s.spot('stand', LX + 2.4, 0, 1.4, PI / 2 + 0.3, { tags: ['wait'] });
  lamp(s, 'panel', LX + 3.0, 3.2, 0, { w: 1.6, d: 0.5, K: 3300, power: 0.8, clip });
  roomGlow(s, LX, 0, -3.5, HALL.X0, 3.2, 3.5, { sky: '#ffe2bc', ground: '#a8916c', power: 0.2 });
  s.zoneBox({ id: 'glide-lobby', box: [LX, -0.5, -3.5, HALL.X0, 3.2, 3.5], name: 'The Glide', sub: 'the cab berths · Station Ring 2 · deck 1', ambience: 'station', reverb: 'room' });
}
