// Not a world of the journey: three short trials of kit/deck.js, to see that the same builders make different places.
// A bright arcade (lit higher, new things in the windows), a dim hushed street, and a hall with one table 120 m long.
// dev.html?file=zz_deck_try&only=try-bright (or try-dim, try-table).
import { Scene } from 'three';
import { makePath } from '../core/path.js';
import { makeFrame, deckRadius } from '../kit/drum.js';
import { makeDeck, finish, street, atrium, hall, PALETTES } from '../kit/deck.js';

const card = (id, title) => ({ id, title, drum: 'Nowhere', row: 'a trial', kind: 'a trial of the deck kit', light: 0, line: 'A trial of the deck kit.', tone: '#e9dcc0', source: 'kit/deck.js' });

export const tryBright = {
  ...card('try-bright', 'A bright arcade'),
  *build(ctx) {
    const frame = makeFrame(0.4, 1800, deckRadius(40));
    const path = makePath([{ t: 0, p: [-70, 1.6, 2.2] }, { t: 14, p: [-20, 1.7, 2.0], look: [40, 2, 0] }, { t: 30, p: [14, 6, 0], look: [60, 10, 0] }, { t: 40, p: [40, 9, 0] }], { frame, entryRadius: 1.1, exitRadius: 3 });
    const deck = makeDeck(ctx, { frame, near: path.points(0.5), seed: 'bright', palette: PALETTES.bright, light: { level: 1.5 } });
    yield* street(deck, { axis: 'x', from: -160, to: 0, at: 0, width: 10, lamps: { every: 5, rows: 2, kind: 'globe', power: 1.1 }, cloth: 0.8, trolley: { every: 60 }, folk: { stand: 9, stroll: 7, walk: 9 }, fill: { mix: { shop: 4, stall: 1 }, awnings: 0.6, blades: 0.8, lit: 1 } });
    yield* atrium(deck, { x0: 6, x1: 76, z0: -22, z1: 22, y: 0, storeys: 4, step: 2.5, mouths: [{ side: 'anti', storey: 0, at: 0, width: 10 }], light: { power: 1.6, terraces: 0.5 }, floor: { bands: 9 }, folk: { rail: 6, stroll: 4, floor: 2 } });
    yield* finish(deck);
    const scene = new Scene(); scene.add(deck.group);
    return { scene, path, deck, near: 0.12, far: 600, look: { exposure: 1.25, bloom: 0.25 } };
  },
};

export const tryDim = {
  ...card('try-dim', 'A dim street'),
  *build(ctx) {
    const frame = makeFrame(2.1, 900, deckRadius(210));
    const path = makePath([{ t: 0, p: [1.4, 1.6, 40] }, { t: 20, p: [1.2, 1.6, 110] }, { t: 40, p: [1.0, 1.7, 190] }], { frame, entryRadius: 1.1, exitRadius: 1.2 });
    const deck = makeDeck(ctx, { frame, near: path.points(0.5), seed: 'dim', palette: PALETTES.dim, light: { level: 0.5, ambPower: 1.1 } });
    yield* street(deck, { axis: 'z', from: 0, to: 420, at: 0, width: 6, lamps: { every: 9, kind: 'globe', power: 0.9 }, folk: { stand: 1.5, stroll: 1, walk: 2 }, fill: { mix: { home: 4, wall: 1, shop: 0.4 }, bay: [4, 6], lit: 0.5, numbers: 7 } });
    yield* finish(deck);
    const scene = new Scene(); scene.add(deck.group);
    return { scene, path, deck, near: 0.12, far: 600, look: { exposure: 1.5, bloom: 0.3, saturation: 0.95 } };
  },
};

// a street the whole length of the drum, 3.75 km dead straight: its lamps run to a vanishing point
export const tryLong = {
  ...card('try-long', 'The whole length'),
  *build(ctx) {
    const frame = makeFrame(3.0, 0, deckRadius(150));
    const path = makePath([{ t: 0, p: [1.6, 1.6, 1500] }, { t: 20, p: [1.5, 1.7, 1590] }, { t: 40, p: [1.4, 1.6, 1700] }], { frame, entryRadius: 1.1, exitRadius: 1.2 });
    const deck = makeDeck(ctx, { frame, near: path.points(0.5), seed: 'long', palette: PALETTES.warm, light: { level: 0.9 } });
    yield* street(deck, { axis: 'z', from: 0, to: 3750, at: 0, width: 7, lamps: { every: 6 }, cloth: 0.4, folk: { stand: 5, stroll: 3, walk: 3 }, fill: { mix: { home: 3, shop: 1.5, wall: 0.3, stall: 0.3 }, numbers: 1 } });
    yield* finish(deck);
    const scene = new Scene(); scene.add(deck.group);
    return { scene, path, deck, near: 0.12, far: 4000, look: { exposure: 1.3, bloom: 0.25 } };
  },
};

export const tryTable = {
  ...card('try-table', 'One table'),
  *build(ctx) {
    const frame = makeFrame(1.0, 2600, deckRadius(120));
    const path = makePath([{ t: 0, p: [2.6, 1.7, 6] }, { t: 20, p: [2.4, 2.0, 60], look: [0, 0.9, 110] }, { t: 40, p: [2.2, 1.7, 118] }], { frame, entryRadius: 1.1, exitRadius: 1.2 });
    const deck = makeDeck(ctx, { frame, near: path.points(0.5), seed: 'table', palette: PALETTES.warm, light: { level: 1.1 } });
    yield* hall(deck, { x0: -6, x1: 6, z0: 0, z1: 126, y: 0, height: 3, tables: { axis: 'z', rows: 1, from: 3, to: 123, taken: 0.75 }, lamps: { spacing: [6, 4], kind: 'globe', power: 1.0 } });
    yield* finish(deck);
    const scene = new Scene(); scene.add(deck.group);
    return { scene, path, deck, near: 0.12, far: 400, look: { exposure: 1.3, bloom: 0.25 } };
  },
};
