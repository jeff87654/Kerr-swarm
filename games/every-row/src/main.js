// The page: start the flight, show each world's card, and wire the few controls.
//
// Links:  ?w=<id> start at a world   ?only=<id> fly one world over and over   ?tier=0..3 fix the picture quality
// For the tools:  ?ui=0 no interface, begin at once   ?t=<seconds> start partway   ?freeze hold still   ?steady no camera breath
import { Engine, TIERS } from './core/engine.js';
import { WORLDS } from './worlds/index.js';
import { mountUI } from './ui/ui.js';
import { Sound } from './core/audio.js';

const qs = new URLSearchParams(location.search);
const canvas = document.getElementById('view');
const bare = qs.get('ui') === '0';
let ui = null;
const sound = new Sound();

const engine = new Engine(canvas, WORLDS, {
  tier: qs.has('tier') ? parseInt(qs.get('tier'), 10) : 'auto',
  only: qs.get('only') || null,
  debug: qs.has('debug'),
  onWorld: (def, inst, crossed) => {
    app.world = def.id; app.crossings += crossed ? 1 : 0;
    if (ui) ui.showCard(def);
    sound.setWorld(def.sound || (inst.sound) || null, def, crossed ? 3.5 : 1.5);
  },
});

// what the test tools and the console hold on to
const app = window.app = { engine, WORLDS, TIERS, sound, world: null, crossings: 0, ready: false };

if (qs.get('w')) engine.enqueue([qs.get('w')]);
if (qs.has('t')) engine.startT = parseFloat(qs.get('t'));
if (qs.has('steady')) engine.steady = true;
if (qs.has('pace')) engine.pace = parseFloat(qs.get('pace'));

if (bare) {
  if (qs.has('freeze')) engine.freeze = true;
} else {
  // until Begin the first drum waits behind the title, dimmed and holding still
  engine.freeze = true; engine.fadeTarget = 0.5;
  ui = mountUI(document.getElementById('ui'), engine, WORLDS, {
    fixedTier: qs.has('tier'),
    onBegin: () => { engine.freeze = qs.has('freeze'); if (ui.wantsSound()) { /* sound stays off until asked for in this visit */ } },
    sound: (on) => sound.enable(on),
  });
  setInterval(() => ui.setWaiting(engine.stats.waiting && !!engine.cur), 400);
}

window.addEventListener('resize', () => engine.resize());
document.addEventListener('visibilitychange', () => { if (document.hidden) sound.duck(true); else sound.duck(false); });
engine.start();

const wait = setInterval(() => { if (engine.cur) { app.ready = true; clearInterval(wait); } }, 50);
