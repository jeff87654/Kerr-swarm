// Loops and ambience beds. Beds are layered loops plus scattered events at random
// distances and pans, with slow drifts, so they never audibly repeat.
// No wind and no birds anywhere: there is no weather and there are no animals.

import { clamp, pick } from './dsp.js';
import { Inst, murmur, kids, kitchen, sizzle, steam, waterLap, fountain, shower, cabHum, platform, air, wind, choirLoop, tide, humLamp, rumble, walker, scatter, farEcho, farMusic, kiteBuf, breathBuf, creakBuf, dripBuf, wallaJobs } from './loops.js';

export const LOOPS = {
  murmur: { bus: 'amb', gain: 1, send: 0.8, create: murmur },
  kids: { bus: 'amb', gain: 1, send: 0.8, create: kids },
  kitchen: { bus: 'sfx', gain: 1, send: 0.8, create: kitchen },
  sizzle: { bus: 'sfx', gain: 1, send: 0.6, create: sizzle },
  steam: { bus: 'sfx', gain: 1, send: 0.6, create: steam },
  'water-lap': { bus: 'amb', gain: 1, send: 0.7, create: waterLap },
  fountain: { bus: 'amb', gain: 1, send: 0.8, create: fountain },
  shower: { bus: 'sfx', gain: 1, send: 0.9, create: shower },
  'cab-hum': { bus: 'sfx', gain: 1, send: 0.3, create: cabHum },
  platform: { bus: 'amb', gain: 1, send: 0.8, create: platform },
  air: { bus: 'amb', gain: 1, send: 0.3, create: air },
  wind: { bus: 'sfx', gain: 1, send: 0.1, create: wind },
  choir: { bus: 'music', gain: 0.6, send: 1, create: choirLoop },
  tide: { bus: 'amb', gain: 1, send: 0.6, create: tide },
  'hum-lamp': { bus: 'amb', gain: 1, send: 0.2, create: humLamp },
};

export const BED_IDS = ['none', 'station', 'arcade', 'court', 'hall', 'feast', 'shop', 'flat', 'baths', 'school',
  'hollow-day', 'hollow-dusk', 'hollow-night', 'terrace', 'spindle', 'cab', 'glide', 'quiet'];

// crowd param for a number of people (inverse of n = 2 * 200^param)
function P(n) { return clamp(Math.log(n / 2) / Math.log(200), 0, 1); }

// a loop as a bed layer, into its own gain (and a lowpass for muffled or far layers)
function layer(I, fn, level, param, lp) {
  const g = I.gain(level, lp ? I.filter('lowpass', lp, 0.5, I.out) : I.out);
  I.sub(fn(I.eng, g, { param: param === undefined ? 0.5 : param, pitch: 1 }));
  return g;
}

const CROCK = ['cup', 'plate', 'cutlery', 'cup', 'cutlery'];
function crockery(I, rate, d0, d1, k) { I.every(rate, (t) => scatter(I, pick(I.eng.rnd, CROCK), t, d0, d1, k)); }
function walkers(I, rate, surface, d0, d1, k) { I.every(rate, (t) => walker(I, surface, t, d0 + (d1 - d0) * I.eng.rnd(), k)); }

// something loud far off in the Hollow, then its echo from the far bank 9.7 s later
function hollowEcho(I, rate) {
  const eng = I.eng;
  I.every(rate, (t) => {
    const name = pick(eng.rnd, ['cheer', 'laugh', 'applause', 'ball-bounce', 'cheer']);
    farEcho(I, name, t, name === 'ball-bounce' ? 0.5 : 0.3, 0.9 + eng.rnd() * 0.15);
  }, 2 + eng.rnd() * 6);
}

const BEDS = {
  station(I) {
    layer(I, platform, 0.9);
    layer(I, air, 0.8);
    layer(I, murmur, 0.75, P(60));
    walkers(I, 0.7, 'stone', 4, 25);
    I.every(1 / 20, (t) => scatter(I, 'clunk', t, 30, 80, 0.9, 0.8));
    I.every(1 / 45, (t) => scatter(I, 'chime', t, 25, 60, 0.6));
    I.every(1 / 30, (t) => scatter(I, 'door-slide', t, 15, 40, 0.6));
  },
  arcade(I) {
    layer(I, air, 0.6);
    layer(I, murmur, 0.7, P(40));
    walkers(I, 1.0, 'tile', 3, 22);
    crockery(I, 0.3, 6, 30, 0.7);
    layer(I, kids, 0.35, 0);
    farMusic(I, 'busker', 0.16, 2200, 1);
  },
  court(I) {
    layer(I, air, 0.5);
    layer(I, murmur, 0.85, P(120));
    layer(I, kids, 0.45, 0.5);
    crockery(I, 0.4, 5, 30, 0.7);
    layer(I, fountain, 0.3, 0.5, 3200);
    walkers(I, 0.5, 'stone', 4, 20);
    farMusic(I, 'court-evening', 0.12, 1600, 0.5);
  },
  hall(I) {
    layer(I, murmur, 0.8, P(400));
    crockery(I, 2, 3, 30, 0.65);
    I.every(0.3, (t) => scatter(I, pick(I.eng.rnd, ['lid-up', 'lid-down']), t, 3, 25, 0.7));
    layer(I, kitchen, 0.45, 0.5, 2600);
    walkers(I, 0.3, 'wood', 3, 18, 0.8);
  },
  feast(I) {
    layer(I, murmur, 0.95, P(400));
    I.every(0.3, (t) => scatter(I, 'laugh', t, 5, 25, 0.6));
    I.every(1 / 40, (t) => scatter(I, 'cheer', t, 10, 40, 0.8));
    I.every(1 / 120, (t) => scatter(I, 'applause', t, 10, 40, 0.7));
    crockery(I, 2.5, 3, 30, 0.6);
    I.every(0.4, (t) => scatter(I, pick(I.eng.rnd, ['lid-up', 'lid-down']), t, 3, 25, 0.7));
    farMusic(I, 'court-evening', 0.12, 1800, 1);
  },
  shop(I) {
    layer(I, air, 0.45);
    layer(I, murmur, 0.9, P(3));
    layer(I, murmur, 0.4, P(40), 600);
    I.every(0.1, (t) => scatter(I, 'cup', t, 2, 8, 0.6));
    I.every(0.05, (t) => scatter(I, 'paper', t, 2, 6, 0.8));
    I.every(1 / 45, (t) => scatter(I, 'door', t, 4, 10, 0.5));
  },
  flat(I) {
    layer(I, air, 0.5);
    layer(I, murmur, 0.3, P(60), 400);
    layer(I, humLamp, 0.6);
    I.every(1 / 40, (t) => scatter(I, 'door', t, 8, 20, 0.5, 0.9));
    I.every(1 / 30, (t) => walker(I, 'wood', t, 6, 0.5));
  },
  baths(I) {
    layer(I, waterLap, 0.8);
    I.every(0.8, (t) => I.shot(dripBuf(I.eng), t, { gain: 0.06 + 0.06 * I.eng.rnd(), pan: (I.eng.rnd() - 0.5) * 1.8 }));
    layer(I, steam, 0.3);
    layer(I, murmur, 0.8, P(20));
    layer(I, shower, 0.16, 0.5, 2500);
    I.every(1 / 20, (t) => scatter(I, 'splash', t, 8, 25, 0.6));
  },
  school(I) {
    layer(I, kids, 0.95, 1);
    layer(I, kids, 0.6, 0.7, 4000);
    I.every(0.6, (t) => scatter(I, 'ball-bounce', t, 4, 25, 0.8));
    I.every(0.15, (t) => scatter(I, 'ball-catch', t, 4, 25, 0.6));
    walkers(I, 0.6, 'wood', 3, 18);
    layer(I, murmur, 0.35, P(20));
  },
  'hollow-day'(I) {
    layer(I, air, 0.22, 0.5, 500);
    layer(I, murmur, 0.3, P(150), 1300);
    I.every(1 / 10, (t) => I.shot(kiteBuf(I.eng), t, { gain: 0.03 + 0.03 * I.eng.rnd(), pan: (I.eng.rnd() - 0.5) * 1.6 }));
    I.every(1 / 25, (t) => scatter(I, 'kite-snap', t, 15, 50, 0.6));
    layer(I, waterLap, 0.3);
    I.every(1 / 8, (t) => scatter(I, 'ball-bounce', t, 40, 120, 1, 0.8));
    hollowEcho(I, 1 / 30);
  },
  'hollow-dusk'(I) {
    layer(I, air, 0.2, 0.5, 450);
    layer(I, murmur, 0.32, P(80), 1100);
    I.every(1 / 25, (t) => I.shot(kiteBuf(I.eng), t, { gain: 0.025, pan: (I.eng.rnd() - 0.5) * 1.6 }));
    layer(I, waterLap, 0.4);
    layer(I, humLamp, 0.3);
    farMusic(I, 'court-evening', 0.07, 1200, 1);
    hollowEcho(I, 1 / 50);
  },
  'hollow-night'(I) {
    layer(I, humLamp, 0.25);
    layer(I, waterLap, 0.22);
    layer(I, air, 0.1, 0.5, 400);
    farMusic(I, 'choir', 0.05, 900, 1);
  },
  terrace(I) {
    layer(I, air, 0.4);
    layer(I, murmur, 0.33, P(5));
    I.every(0.15, (t) => scatter(I, 'cup', t, 3, 12, 0.6));
    layer(I, murmur, 0.25, P(200), 700);
    layer(I, waterLap, 0.15, 0.5, 800);
  },
  spindle(I) {
    const rnd = I.eng.rnd;
    const b = I.every(1 / 4.4, (t) => {
      I.shot(breathBuf(I.eng, false), t, { gain: 0.07, pan: 0.05 });
      I.shot(breathBuf(I.eng, true), t + 1.4 + rnd() * 0.3, { gain: 0.08, pan: -0.05 });
    }, 0.3);
    b.reg = 0.25;
    I.every(0.4, (t) => scatter(I, 'sleeve-flap', t, 1, 4, 0.5));
    layer(I, wind, 0.6, 0.25);
  },
  cab(I) {
    layer(I, cabHum, 1);
    layer(I, air, 0.3);
    I.every(1 / 7, (t) => I.shot(creakBuf(I.eng), t, { gain: 0.035, pan: (I.eng.rnd() - 0.5) * 1.2 }));
  },
  glide(I) {
    layer(I, rumble, 0.35);
    layer(I, air, 0.6);
    I.every(1 / 5, (t) => I.shot(creakBuf(I.eng), t, { gain: 0.04, pan: (I.eng.rnd() - 0.5) * 1.6, rate: 0.7 + I.eng.rnd() * 0.3 }));
    layer(I, murmur, 0.5, P(6));
  },
  quiet(I) {
    layer(I, air, 0.35);
    layer(I, murmur, 0.55, P(200));
    layer(I, kids, 0.4, 0.7);
    crockery(I, 0.5, 4, 30, 0.75);
    walkers(I, 0.6, 'stone', 4, 20);
    layer(I, fountain, 0.22, 0.5, 3200);
  },
};

export function createBed(eng, id, out) {
  const I = new Inst(eng, out);
  const f = BEDS[id];
  if (f) f(I);
  return I;
}

// jobs the engine can run in idle time to render the crowd buffers before they are needed
// Each loop is also built once into a gain that goes nowhere and stopped at once,
// which renders the long loop buffers it fetches when it starts.
export function bedWarmJobs(eng) {
  const jobs = wallaJobs(eng);
  for (const name in LOOPS) {
    if (name === 'choir') continue;
    jobs.push(() => {
      const g = eng.ctx.createGain();
      const inst = LOOPS[name].create(eng, g, { param: 0.5, pitch: 1 });
      if (inst && inst.stop) inst.stop(eng.ctx.currentTime);
    });
  }
  jobs.push(() => rumble(eng, eng.ctx.createGain()).stop(eng.ctx.currentTime));
  return jobs;
}
