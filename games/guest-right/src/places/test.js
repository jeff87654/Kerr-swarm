// A test street: a stretch of arcade used to check the renderer, the kit and the player. Not part of the game.
import { floor, ceiling, wall, lamp, roomGlow, block, stairs } from '../world/kit.js';
import { deckRadius } from '../core/drum.js';
import { prop, bunting } from '../world/props.js';
import { sign } from '../world/signs.js';
import { door, doorFrame } from '../world/doors.js';
import { room, shopfront, railing, planter, column } from '../world/kit2.js';

export const place = {
  id: 'test', name: 'Test street', order: 0, testOnly: true,
  build(game) {
    const W = game.world;
    const f = W.frame('candlewick', deckRadius(16), 0, 625);
    const s = W.scope('test', f);
    const g = s.g;
    const X0 = -40, X1 = 40, Z0 = -3.5, Z1 = 3.5, H = 3.0;
    floor(s, X0, Z0, X1, Z1, 0, 'terrazzo', '#cdbfa8');
    ceiling(s, X0, Z0, X1, Z1, H, 'paint', '#efe6d6');
    wall(s, X0, Z0, X1, Z0, 0, H, { tint: '#e7d9bf', dado: { h: 1.0, mat: 'tile', tint: '#2f6f73' }, openings: [{ at: 14, w: 3, h: 2.4 }, { at: 30, w: 1.1, h: 2.1 }] });
    wall(s, X0, Z1, X1, Z1, 0, H, { tint: '#e7d9bf', dado: { h: 1.0, mat: 'pattern', tint: '#c9552e' }, openings: [{ at: 40, w: 4, h: 2.5 }] });
    wall(s, X0, Z0, X0, Z1, 0, H, { tint: '#d9c7a6' });
    wall(s, X1, Z0, X1, Z1, 0, H, { tint: '#d9c7a6' });
    roomGlow(s, X0, 0, Z0, X1, H, Z1, { sky: '#ffe2b8', ground: '#b89c7a', power: 0.3 });
    for (let x = X0 + 4; x < X1; x += 6) lamp(s, 'panel', x, H, 0, { w: 1.4, d: 0.5, clip: [X0, -0.2, Z0 - 0.2, X1, H + 0.2, Z1 + 0.2], K: 3000 });
    // a side room through the first opening
    floor(s, -26.5, -9, -22.5, Z0, 0, 'planks', '#b08355');
    ceiling(s, -26.5, -9, -22.5, Z0, H, 'paint', '#efe6d6');
    wall(s, -26.5, -9, -22.5, -9, 0, H, { tint: '#bcd0c4' }); wall(s, -26.5, -9, -26.5, Z0, 0, H, { tint: '#bcd0c4' }); wall(s, -22.5, -9, -22.5, Z0, 0, H, { tint: '#bcd0c4' });
    roomGlow(s, -26.5, 0, -9, -22.5, H, Z0, { power: 0.25 });
    lamp(s, 'globe', -24.5, 2.3, -6.5, { clip: [-26.6, -0.2, -9.1, -22.4, H + 0.2, Z0 + 0.3], K: 2700 });
    // furniture
    s.furniture(() => {
      g.mat('wood', '#7a5233'); g.box(-6, 0.4, 2.6, -3.6, 0.46, 3.1, { bevel: 0.012 });
      for (const x of [-5.8, -3.8]) { g.box(x - 0.04, 0, 2.66, x + 0.04, 0.4, 2.74, { bevel: 0.006 }); g.box(x - 0.04, 0, 2.96, x + 0.04, 0.4, 3.04, { bevel: 0.006 }); }
      g.mat('glaze', '#3d6f8a'); g.lathe(2, 2.6, [[0.0, 0], [0.26, 0], [0.34, 0.2], [0.36, 0.45], [0.3, 0.6], [0.33, 0.66], [0.3, 0.66], [0.27, 0.6]], { segs: 20 });
      g.mat('soil', '#ffffff'); g.cyl(2, 0.56, 2.6, 0.27, 0.02, { segs: 16 });
      g.mat('cast', '#b08a45'); g.lathe(8, -2.8, [[0.16, 0], [0.13, 0.06], [0.1, 0.2], [0.1, 2.7], [0.14, 2.9], [0.18, 3.0]], { segs: 14 });
      g.mat('brushed', '#c9c4bb'); g.box(12, 0, -3.2, 13.6, 0.9, -2.7, { bevel: 0.02 });
      g.mat('felt', '#8a2f3c'); g.box(-12, 0.02, -1, -9, 0.035, 1);
      g.mat('weave', '#d9b25c'); g.sheet([15, 2.6, 3.3], [18, 2.6, 3.3], [18, 0.9, 3.3], [15, 0.9, 3.3], { nu: 12, nv: 6, ripple: 0.06, rippleN: 7 });
    });
    s.solid(-6, 0, 2.6, -3.6, 0.46, 3.1); s.post(2, 2.6, 0.36, 0, 0.66); s.post(8, -2.8, 0.16, 0, 3); s.solid(12, 0, -3.2, 13.6, 0.9, -2.7);
    s.detail(() => {
      for (let i = 0; i < 7; i++) { const a = i * 0.9; g.mat('leafA', '#ffffff', { sway: 0.6 }); g.card(2 + Math.cos(a) * 0.08, 0.6, 2.6 + Math.sin(a) * 0.08, 0.7, 0.8, a, { tilt: 0.25 }); }
      g.mat('glaze', '#e8e2d4'); g.lathe(-4.8, 2.85, [[0, 0.46], [0.05, 0.46], [0.09, 0.5], [0.09, 0.53], [0.085, 0.53], [0.08, 0.5]], { segs: 14 });
    });
    block(s, 20, 0, -3.4, 22, 0.45, -2.6, 'stone', '#bfb4a2', { bevel: 0.02 });
    stairs(s, 26, 0, 1.6, 'X', 1.2, 2.4, 1.4, {});
    block(s, 28.4, 0, 0.9, 31, 1.2, 2.3, 'stone', '#bfb4a2');
    for (let i = 0; i < 5; i++) lamp(s, 'lantern', -18 + i * 1.5, 2.25, -1.5 + (i % 2) * 3, { tint: ['#e8743b', '#f2c14e', '#3fa7a3', '#d95d7a', '#7aa85a'][i], clip: [X0, -0.2, Z0 - 0.2, X1, H + 0.2, Z1 + 0.2], drop: 0.5, power: 0.6 });
    lamp(s, 'sconce', -32, 1.9, Z0 + 0.08, { face: 'Z', clip: [X0, -0.2, Z0 - 0.2, X1, H + 0.2, Z1 + 0.2] });
    // props, signs, glass, a door
    prop(s, 'table', -16, 0, 2.2, 0, { round: true, w: 0.9 });
    prop(s, 'chair', -16.7, 0, 2.2, Math.PI / 2, {}); prop(s, 'chair', -15.3, 0, 2.2, -Math.PI / 2, { back: 'slat' }); prop(s, 'stool', -16, 0, 1.4, 0, {});
    prop(s, 'bowl', -16.15, 0.74, 2.15, 0, {}); prop(s, 'cup', -15.85, 0.74, 2.3, 0, {}); prop(s, 'plate', -16, 0.74, 2.0, 0, {});
    prop(s, 'plant', -19, 0, 2.9, 0, { kind: 'fern', size: 1.1, pot: '#3d6f8a' }); prop(s, 'plant', -20, 0, 2.9, 0, { kind: 'flower', size: 0.8 }); prop(s, 'plant', -21, 0, 2.9, 0, { kind: 'fine', size: 1.3, pot: '#d9c7a6' });
    prop(s, 'counter', -8, 0, -2.9, 0, { w: 2.4 }); prop(s, 'crock', -8.6, 0.92, -2.9, 0, {}); prop(s, 'crate', -5.6, 0, -3, 0.2, {});
    prop(s, 'shelving', -3.4, 0, -3.25, 0, { w: 1.4 }); prop(s, 'bench', 5, 0, 3.0, Math.PI, { back: true }); prop(s, 'rug', -16, 0, 2.2, 0, { w: 2.4, d: 1.8 });
    sign(s, { kind: 'chalk', title: 'Thursday', lines: ['Ramen 1.77', 'Whatever the aunts made 0.50', 'Jook, on the table', 'Gin after six 0.18'] }, -1.2, 1.5, Z1 - 0.09, { face: 'z' });
    sign(s, { kind: 'poster', title: 'The Long Flight', lines: ['Booking night', 'From the back gate at ten', 'Bring a hand lamp'], motif: 'flight' }, -30, 1.6, Z0 + 0.09, { face: 'Z' });
    sign(s, { kind: 'street', text: 'Ladle Row', sub: 'Deck 16 \u00b7 Ring Two' }, -36, 2.4, Z0 + 0.09, { face: 'Z' });
    sign(s, { kind: 'hanging', text: 'Seam and Story', emblem: 'thread' }, -24.5, 2.45, -3.0, { face: 'X', double: true });
    bunting(s, [-38, 2.7, -3.2], [-30, 2.7, 3.2]);
    // a shop through the wide opening
    const clip = room(s, { x0: -1, z0: Z1, x1: 5, z1: 10, y: 0, h: H, floor: ['planks', '#b08355'], wall: { tint: '#cfdccf' }, open: { n: [{ at: 1, w: 4, h: H }] } });
    shopfront(s, { side: 'n', a0: 0, a1: 4, c: Z1, y: 0, h: H, fascia: { text: 'The Heel', sub: 'bread \u00b7 crocks \u00b7 starters', emblem: 'loaf' }, awning: true, door: { at: 2.6, w: 1.1 } });
    lamp(s, 'globe', 1, 2.3, 6.5, { clip, K: 2700 }); lamp(s, 'globe', 3.4, 2.3, 8, { clip, K: 2700 });
    prop(s, 'counter', 2, 0, 8.4, Math.PI, { w: 2.6, body: '#7a3b2e' }); prop(s, 'shelving', -0.6, 0, 6, Math.PI / 2, { w: 2.2 }); prop(s, 'crock', 1.4, 0.92, 8.4, 0, { glaze: '#d9c7a6' }); prop(s, 'bowl', 2.4, 0.92, 8.4, 0, {});
    planter(s, -3, 0, 3.1, { w: 2, plants: 'herbs' }); column(s, 7, 0, 2.9, H, {});
    railing(s, [[28.4, 0.9], [31, 0.9]], 1.2, {});
    doorFrame(s, -9.45, 0, Z0, 1.1, 2.1, 'x');
    door(s, { x: -10, y: 0, z: Z0, w: 1.1, h: 2.1, along: 'x', tint: '#2f5d50', label: 'the store room' });
    s.zoneBox({ id: 'test', box: [X0, -1, Z0 - 6, X1, H, Z1], name: 'Ladle Row', sub: 'Candlewick', ambience: 'arcade', reverb: 'ring' });
    s.path([[X0 + 2, 0], [X1 - 2, 0]]);
    game.cab.addStop({ id: 'test', name: 'The test street', sub: 'Candlewick, deck 16', frame: f, x: -14, y: 0, z: 0.5, yaw: Math.PI / 2 });
    s.interact({ x: 8, y: 1.2, z: -2.6, radius: 1.6, prompt: 'Call a cab', onUse: (g2) => g2.cab.open('test') });
    s.finish();
    game.spawns.test = { frame: f, x: -14, y: 0, z: 0.5, yaw: Math.PI / 2 };
    game.env({ exposure: 1.0, autoKey: 0.16 });
  },
};
