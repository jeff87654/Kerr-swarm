// story.js: the story of the three days, registered with the game's story machinery (src/game/story.js).
// It defines the journal's threads, adds every dialogue table, names the hooks the scripts call, signs you in
// at the guest desk, nudges you toward each day's moments, completes thread steps from where you are and when,
// and exposes the set pieces as game.story.scenes for the engine to stage.
//
// game.story.scenes (each async, each safe to call twice; the second call does nothing):
//   dawn(game, phase?)        phases 'start' | 'violet' | 'rose' | 'gold' | 'end' (subtitles; 'end' is a short modal
//                             scene: the clap, "too slow in the middle"). With no phase it plays them all, timed.
//   ledgerReading(game)       08:30 day 3, the Ledger hall. Modal. Tea for Rue is a choice.
//   vote(game)                10:00 day 3, the booking and the question. Modal. Marit, Jory, Gideon speak.
//   feast(game)               13:00 day 3, the hall. Modal. Carrying, the three wanderers, the apple star.
//   voteResult(game)          17:00 day 3. Modal. Hall fund by four; Jory admits sun.
//   longFlight(game, phase?)  phases 'up' | 'drift' | 'choir' | 'maritJory' | 'end' (subtitles). Call 'maritJory'
//                             when the player drifts near Marit and Jory. With no phase it plays them all, and plays
//                             maritJory only if Marit is within 30 m (or the people sim is absent).
//   oonaAtTwo(game)           02:00 day 4, the elders' terrace. Modal.
//   fourthMorning(game)       day 4, from 06:00, with Marit. Modal: go or stay, then the card home.
//   blockCourt(game)          19:00 day 2, Wick Court. Modal.
// Unless game.story.auto is set false, each one also starts by itself when the player is in the right place at the
// right time and nothing else is running. game.story.sleep(game) and game.story.gin(game) are for the flat's bed and
// the hall's pass.
import { THREADS } from '../content/threads.js';
import { CAST } from '../content/cast.js';
import { TALK_MARIT } from '../content/dialogue/marit.js';
import { TALK_JORY } from '../content/dialogue/jory.js';
import { TALK_OONA } from '../content/dialogue/oona.js';
import { TALK_HALL } from '../content/dialogue/hall.js';
import { TALK_STATION } from '../content/dialogue/station.js';
import { TALK_SHOPS } from '../content/dialogue/shops.js';
import { TALK_BLOCK } from '../content/dialogue/block.js';
import { TALK_HOLLOW } from '../content/dialogue/hollow.js';
import { SCENES, OVERHEARD } from '../content/dialogue/scenes.js';

// ---------------------------------------------------------------------------------------------------------------- small helpers
const wait = (s) => new Promise((res) => setTimeout(res, Math.max(0, s) * 1000));
const F = (g) => g.flags || (g.flags = {});
const err = (e) => console.error('[story] ' + (e && e.stack ? e.stack : e));
function toast(g, text, kind) { if (g.ui && g.ui.toast) { try { g.ui.toast(text, { kind: kind || 'info' }); } catch (e) { err(e); } } }
function banner(g, a, b) { if (g.ui && g.ui.banner) { try { g.ui.banner(a, b); } catch (e) { err(e); } } }
function sfx(g, name, o) { if (g.audio && g.audio.play) { try { g.audio.play(name, o || { vol: 0.6 }); } catch (e) { err(e); } } }
async function fade(g, toBlack, s) { if (g.ui && g.ui.fade) { try { await g.ui.fade(toBlack, s); } catch (e) { err(e); } } }
const J = (g) => g.journal || null;
function start(g, id) { const j = J(g); if (j) j.start(id); }
function step(g, id, i) { const j = J(g); if (j) j.step(id, i); }
function done(g, id) { const j = J(g); if (j) j.done(id); }
function found(g, id) { const j = J(g); if (j) j.find(id); }
const started = (g, id) => { const j = J(g); return !!(j && j.started && j.started(id)); };
const isDone = (g, id) => { const j = J(g); return !!(j && j.isDone && j.isDone(id)); };
const hasFound = (g, id) => !!(g.story && g.story.state && g.story.state.found && g.story.state.found[id]);
const zp = (g) => (g.zone ? (g.zone.place || g.zone.id || null) : null);
const inPlace = (g, list) => { const p = zp(g); return !!p && list.indexOf(p) >= 0; };
const frameId = (g) => (g.player && g.player.frame ? g.player.frame.id : null);
const day = (g) => (g.clock ? g.clock.day : 1);
const hr = (g) => (g.clock ? g.clock.hours : 12);
function spk(id) { const c = CAST[id]; if (c) return { name: c.short || c.name, colour: (c.look && c.look.top) || '#d9c7a6', id }; return { name: id === 'you' ? 'You' : id, colour: '#d9c7a6' }; }
function addHours(g, h) {
  const c = g.clock; if (!c) return;
  c.minutes += h * 60;
  while (c.minutes >= 1440) { c.minutes -= 1440; c.day++; if (g.events) g.events.emit('clock:day', c.day); }
  if (g.events) g.events.emit('clock:jump');
}
async function passTime(g, h, text) { await fade(g, true, 0.6); addHours(g, h); if (text) toast(g, text); await fade(g, false, 0.8); }
// a few overheard lines as subtitles, spaced out; never blocks input
async function overheard(g, lines, gap) {
  for (const L of lines || []) {
    if (g.ui && g.ui.subtitle) { try { g.ui.subtitle(spk(L[0]), L[1], 4.5); } catch (e) { err(e); } }
    await wait(gap || 3.2);
  }
}
// the player's distance to a cast member in the same frame, or Infinity
function distTo(g, id) {
  try {
    if (!g.people || !g.people.byId || !g.player || !g.player.pos) return Infinity;
    const p = g.people.byId(id); if (!p || !p.present || p.frame !== g.player.frame) return Infinity;
    return Math.hypot(p.x - g.player.pos.x, p.z - g.player.pos.z);
  } catch (e) { return Infinity; }
}

// The day's moments: a quiet toast or banner, once each, while the window is open and you are free.
const NUDGES = [
  { id: 'd1-arrive', day: 1, at: 9.5, to: 11.5, text: 'Guests sign the book at the guest desk, in the Ledger hall across the platform.', when: (g) => !F(g).signed_in },
  { id: 'd1-pass', day: 1, at: 10.9, to: 12.5, text: 'Marit Vell is at the pass from eleven. Ramen at one, at the long table on Ladle Row.', when: (g) => !F(g).gave_mother },
  { id: 'd1-ramen', day: 1, at: 12.75, to: 14, banner: ['The long table', 'Thursday ramen, at one'], when: (g) => !F(g).ate_ramen },
  { id: 'd1-gin', day: 1, at: 18, to: 19.5, text: 'Gin in the halls after six. Somebody is always cooking.' },
  { id: 'd1-choir', day: 1, at: 19.25, to: 20.25, text: 'The Candlewick choir sings in Wick Court at half past seven.' },
  { id: 'd1-letter', day: 1, at: 19.7, to: 21, text: 'Jory reads a long letter at eight, in the letter room on Wick Court.', when: (g) => !F(g).heard_letter },
  { id: 'd1-baths', day: 1, at: 21.5, to: 23, text: 'The baths are open late, at the anti end of Ladle Row. The steam is where the drum keeps its gossip.' },
  { id: 'd2-quiet', day: 2, at: 0, to: 11, banner: ['The Quiet', 'No worlds, no messages. Sit, and talk.'] },
  { id: 'd2-feast', day: 2, at: 9, to: 13, text: 'Marit is making ready for the feast. The hall could use a hand.', when: (g) => !F(g).feast_asked },
  { id: 'd2-studio', day: 2, at: 10, to: 15, text: 'Oona is rehearsing her dawn on the model, in the studio on Wick Court.', when: (g) => !F(g).saw_rehearsal },
  { id: 'd2-school', day: 2, at: 15.4, to: 17, text: 'School is out. There is spinball in the long hall.', when: (g) => !F(g).played_spinball },
  { id: 'd2-court', day: 2, at: 18.6, to: 19.25, banner: ['The block court', 'Wick Court, at seven'], when: (g) => !F(g).saw_court },
  { id: 'd2-late', day: 2, at: 21.5, to: 23.5, text: 'The hall talks late on the Quiet. Hand lamps are being charged for tomorrow.' },
  { id: 'd3-queue', day: 3, at: 4.5, to: 5.9, banner: ['Booking Day', "The Dawn Stand's queue is on the back terraces of the Hollow"], when: (g) => !F(g).saw_dawn },
  { id: 'd3-dawn', day: 3, at: 5.75, to: 6.2, text: "The dawn starts at six. It is Oona's.", when: (g) => !F(g).saw_dawn },
  { id: 'd3-ledger', day: 3, at: 7.9, to: 8.6, text: 'The Ledger is read at Station Ring 2 at half past eight.', when: (g) => !F(g).heard_ledger },
  { id: 'd3-question', day: 3, at: 9.8, to: 10.1, text: 'The booking arrives at ten, and the question with it.', when: (g) => !F(g).heard_question },
  { id: 'd3-feast', day: 3, at: 12.4, to: 13.3, banner: ['The feast', 'At one, at the long table'], when: (g) => !F(g).at_feast },
  { id: 'd3-vote', day: 3, at: 16.7, to: 17.1, text: 'The vote comes in at five.', when: (g) => !F(g).heard_vote },
  { id: 'd3-flight', day: 3, at: 21.25, to: 22.5, banner: ['The Long Flight', 'Sleeves at the back gate. Your shoes are the deposit.'], when: (g) => !F(g).flew },
  { id: 'd4-oona', day: 4, at: 1.5, to: 3.5, text: "Oona is on the elders' terrace with a glass of gin.", when: (g) => !F(g).saw_oona_two },
  { id: 'd4-morning', day: 4, at: 6.5, to: 14, text: 'Marit is at the hall.', when: (g) => !F(g).fourth_done },
];

export const place = {
  id: 'story', name: 'Story', order: 950, always: true,
  build(game) {
    const g = game;
    if (!g.story || !g.journal) { console.warn('[story] no story machinery; skipped'); return; }
    const S = g.story;

    // ---------------------------------------------------------------- threads and conversations
    for (const t of THREADS) g.journal.defineThread(t);
    for (const table of [TALK_MARIT, TALK_JORY, TALK_OONA, TALK_HALL, TALK_STATION, TALK_SHOPS, TALK_BLOCK, TALK_HOLLOW]) S.add(table);
    S.scripts = SCENES;

    // ---------------------------------------------------------------- scenes
    const running = {};
    const once = (name, fn) => async (gm, ...rest) => {
      const G = gm || g;
      if (running[name]) return;
      running[name] = true;
      try { await fn(G, ...rest); } catch (e) { err(e); } finally { running[name] = false; }
    };
    const scene = async (G, key, owner) => { if (SCENES[key]) await S.scene(SCENES[key], owner || 'you'); };

    const DAWN_PLACES = ['dawn-terrace', 'back-foot', 'elders-terrace', 'third-terrace'];
    const dawnPhase = async (G, phase) => {
      if (phase === 'end') { if (!F(G).saw_dawn) await scene(G, 'dawnEnd'); return; }
      const said = F(G)['dawn:' + phase]; if (said) return; F(G)['dawn:' + phase] = true;
      await overheard(G, OVERHEARD.dawn[phase], 3.4);
    };
    const FLIGHT_PHASES = ['up', 'drift', 'choir'];
    const flightPhase = async (G, phase) => {
      if (phase === 'end') {
        if (F(G).flight_done) return;
        toast(G, 'As far as the end wall, almost four kilometres off, small lights drift along the axis like a slow river.');
        F(G).flew = true; F(G).flight_done = true; found(G, 'dark-cable'); found(G, 'flyers-at-once');
        start(G, 'booking-day'); step(G, 'booking-day', 5); done(G, 'booking-day');
        return;
      }
      if (F(G)['flight:' + phase]) return; F(G)['flight:' + phase] = true;
      if (phase === 'maritJory') {
        await overheard(G, OVERHEARD.flight.maritJory, 3.6);
        await wait(1.2);
        toast(G, 'Marit laughs so hard she drifts. A red lamp turns her gently back toward the middle.');
        F(G).heard_marit_ask = true;
        return;
      }
      if (phase === 'choir') { try { if (G.audio && G.audio.play) G.audio.play('flute-note', { vol: 0.15 }); } catch (e) { err(e); } }
      await overheard(G, OVERHEARD.flight[phase], 3.6);
    };

    const scenes = S.scenes = {
      dawn: once('dawn', async (G, phase) => {
        if (phase) { await dawnPhase(G, phase); return; }
        // the words keep pace with the light: violet at the edges first, rose in the middle, gold on the far bank last
        const prog = () => (G.dawnProgress ? G.dawnProgress() : 1);
        const here = () => inPlace(G, DAWN_PLACES) && day(G) === 3 && hr(G) < 7.6;
        const marks = [['start', 0.0], ['violet', 0.17], ['rose', 0.46], ['gold', 0.74]];
        for (const m of marks) {
          while (prog() < m[1] && here()) await wait(0.5);
          if (!here()) return;                       // you left: it goes on without you, and picks up if you come back
          if (prog() > m[1] + 0.2 && m[0] !== 'gold') { F(G)['dawn:' + m[0]] = true; continue; }     // you came late: the earlier talk is over
          await dawnPhase(G, m[0]);
        }
        while (prog() < 0.985 && here()) await wait(0.5);
        if (!here()) return;
        while (G.busy || (G.ui && G.ui.modal)) await wait(0.5);
        if (inPlace(G, DAWN_PLACES)) await dawnPhase(G, 'end');
      }),
      ledgerReading: once('ledgerReading', async (G) => { if (F(G).heard_ledger) return; await scene(G, 'ledgerReading', 'agathe'); F(G).heard_ledger = true; }),
      vote: once('vote', async (G) => { if (F(G).heard_question) return; await scene(G, 'question', 'marit'); F(G).heard_question = true; }),
      feast: once('feast', async (G) => { if (F(G).at_feast) return; await scene(G, 'feast', 'marit'); F(G).at_feast = true; }),
      voteResult: once('voteResult', async (G) => { if (F(G).heard_vote) return; await scene(G, 'voteResult', 'marit'); F(G).heard_vote = true; }),
      longFlight: once('longFlight', async (G, phase) => {
        if (phase) { await flightPhase(G, phase); return; }
        const up = () => !G.fly || G.fly.active;
        start(G, 'booking-day'); step(G, 'booking-day', 5);
        for (const p of FLIGHT_PHASES) { if (!up()) return; await flightPhase(G, p); await wait(6); }
        if (!up()) return;
        // two lamps close together, a little way ahead: nobody can see who, but you know the voices
        toast(G, 'Two hand lamps ahead of you, close together, drifting along the axis.');
        await wait(3.5);
        if (!up()) return;
        await flightPhase(G, 'maritJory'); await wait(4);
        await flightPhase(G, 'end');
      }),
      oonaAtTwo: once('oonaAtTwo', async (G) => { if (F(G).saw_oona_two) return; await scene(G, 'oonaAtTwo', 'oona'); F(G).saw_oona_two = true; }),
      fourthMorning: once('fourthMorning', async (G) => {
        if (F(G).fourth_done) return;
        start(G, 'card-home');
        await scene(G, 'fourthMorning', 'marit');
        F(G).fourth_done = true;
        if (G.events) G.events.emit('story:ending', { staying: !!F(G).staying, card: F(G).cardText || '' });
      }),
      blockCourt: once('blockCourt', async (G) => { if (F(G).saw_court) return; start(G, 'leave'); step(G, 'leave', 0); await scene(G, 'blockCourt', 'halima'); F(G).saw_court = true; }),
    };

    // ---------------------------------------------------------------- the guest desk
    S.signIn = async (gm) => {
      const G = gm || g;
      if (F(G).signed_in) return;
      if (!G.inv.has('spelt-mother') && !F(G).gave_mother) G.inv.give('spelt-mother', 1, true);
      if (!G.inv.has('heel')) G.inv.give('heel', 1, true);
      try { await S.scene(SCENES.signIn, 'sefa'); } catch (e) { err(e); }
      const Fl = F(G);
      Object.assign(Fl, { signed_in: true, signedIn: true, hasKey: true, hasChit: true, signedInAt: G.time || 0 });
      if (!G.inv.has('guest-chit')) G.inv.give('guest-chit', 1, true);
      if (!G.inv.has('flat-key')) G.inv.give('flat-key', 1, true);
      start(G, 'three-nights'); step(G, 'three-nights', 0);
      if (G.events) G.events.emit('signedIn', {});
    };

    // ---------------------------------------------------------------- hooks the scripts call by name
    const H = {};
    H['draw'] = (G) => { sfx(G, 'paper', { vol: 0.5 }); toast(G, "The draw: Candlewick 19 · 4, a terrace over Wick Court."); };
    H['sfx'] = (G, x) => { if (x && x.name) sfx(G, x.name, { vol: 0.6 }); };
    H['seat-at-table'] = async (G) => {
      const p = G.player;
      await fade(G, true, 0.35);
      if (zp(G) === 'hall' && frameId(G) === 'candlewick' && p && p.sit) {
        try { p.sit({ x: 4.4, y: 0.46, z: -21.75, yaw: Math.PI, eye: 1.15 }); p.yaw = Math.PI; p.pitch = -0.18; } catch (e) { err(e); }
      }
      if (G.audio && G.audio.play) sfx(G, 'lid-up', { vol: 0.4 });
      await fade(G, false, 0.6);
    };
    H['card-home'] = async (G) => {
      let r = null;
      if (G.ui && G.ui.cardHome) {
        const photos = J(G) && J(G).cards ? J(G).cards().map((c) => c.src) : [];
        try { r = await G.ui.cardHome({ photos, to: 'Pell, at Spelt', place: 'Chervil', day: day(G) }); } catch (e) { err(e); }
      }
      const Fl = F(G);
      Fl.cardText = r && typeof r.text === 'string' ? r.text.slice(0, 300) : (Fl.cardText || '');
      if (r && typeof r.front === 'number') Fl.cardFront = r.front;
      Fl.wrote_card = true;
      start(G, 'card-home'); step(G, 'card-home', 0); done(G, 'card-home');
      if (G.ui && r) toast(G, 'Your card goes by light. It will be in Spelt in 23.7 seconds.');
    };
    S.sleep = async (gm) => {
      const G = gm || g;
      if (!G.clock) return;
      await fade(G, true, 1.2);
      // the night before Booking Day you are woken at five for the Dawn Stand's queue
      const target = G.clock.day === 2 && G.clock.hours >= 12 ? 5 : 6.5;
      try { G.clock.skipTo(target); } catch (e) { err(e); }
      const names = ['', 'Thursday', 'The Quiet', 'Booking Day', 'The fourth morning'];
      const subs = ['', '', 'No worlds, no messages.', target === 5 ? 'Somebody knocks at five, with a hand lamp. The queue is on the back terraces.' : 'Dawn at six on the back terraces.', 'Your three nights are done.'];
      await wait(0.6);
      banner(G, names[Math.min(G.clock.day, 4)] || 'Another day', subs[Math.min(G.clock.day, 4)] || '');
      await fade(G, false, 1.6);
    };
    S.onSleep = S.sleep;   // the guest bed in src/places/flats.js calls this
    H['sleep'] = (G) => S.sleep(G);
    // the bed in your flat
    S.onSleep = async (gm) => {
      const G = gm || g; const c = G.clock; if (!c) return;
      const missing = c.day === 3 && c.hours >= 12 && !F(G).flew;
      if (G.ui && G.ui.choose) {
        let v = null;
        try { v = await G.ui.choose('Your bed', missing ? 'The Spindle opens at ten tonight. If you sleep now you sleep through the Long Flight.' : (c.hours >= 20 || c.hours < 5 ? 'Sleep until the lamps come up.' : 'It is the middle of the day. Sleep through to tomorrow.'),
          [{ label: missing ? 'Sleep anyway' : 'Sleep', value: 'y' }, { label: 'Not yet', value: null }]); } catch (e) { err(e); }
        if (v !== 'y') return;
      }
      G.busy = (G.busy || 0) + 1;
      try {
        if (G.player && G.player.seat && G.player.stand) G.player.stand();
        await S.sleep(G);
        F(G).slept = c.day;
        if (G.saveGame) G.saveGame();
      } catch (e) { err(e); } finally { G.busy--; }
    };
    // a chapter chosen from the title: the earlier days are taken as lived
    S.onChapter = (id) => {
      if (id === 'arrival') return;
      const Fl = F(g), d = day(g);
      Object.assign(Fl, { signed_in: true, signedIn: true, hasKey: true, hasChit: true, has_flat: true, got_mother: true, 'nudge:d1-arrive': true });
      for (const it of ['guest-chit', 'flat-key', 'heel']) if (g.inv && !g.inv.has(it)) g.inv.give(it, 1, true);
      start(g, 'three-nights'); step(g, 'three-nights', 0); step(g, 'three-nights', 1); step(g, 'three-nights', 2);
      if (id === 'table' || id === 'hollow') {
        if (g.inv && !g.inv.has('spelt-mother')) g.inv.give('spelt-mother', 1, true);
        start(g, 'mother');
      } else {
        Fl.gave_mother = true; Fl.ate_ramen = true;
        start(g, 'mother'); step(g, 'mother', 0); step(g, 'mother', 1); step(g, 'mother', 2); done(g, 'mother');
      }
      // the rest of the drum: the journal's threads for it are offered from the first minute (src/places/story_drum.js)
      if (id === 'drum') Fl.drum_left = true;
      if (d >= 2) { step(g, 'three-nights', 3); done(g, 'three-nights'); }
      if (d >= 3) {
        start(g, 'booking-day');
        const upTo = { dawn: 0, ledger: 1, feast: 3, flight: 5 }[id] || 0;
        for (let k = 0; k < upTo; k++) step(g, 'booking-day', k);
        if (upTo > 0) Fl.saw_dawn = true;
        if (upTo > 1) Fl.heard_ledger = true;
        if (upTo > 2) Fl.heard_question = true;
        if (upTo > 3) { Fl.at_feast = true; Fl.heard_vote = true; }
        for (const n of NUDGES) if (n.day < d || (n.day === d && n.to <= hr(g))) Fl['nudge:' + n.id] = true;
      }
      if (g.ui && g.ui.hud && g.journal) g.ui.hud.thread(g.journal.current());
    };
    // a new game: the first thing to do is under the compass from the first step off the glide
    g.events.on('game:new', () => { try { start(g, 'three-nights'); } catch (e) { err(e); } });
    H['grind-bruise'] = async (G) => {
      if (G.ui && G.ui.letterbox) { try { G.ui.letterbox(true); } catch (e) { err(e); } }
      for (let i = 0; i < 5; i++) { sfx(G, 'brush', { vol: 0.35 }); await wait(0.55); }
      toast(G, 'Round, not up and down. The grit goes to dust, and then past dust.');
      await wait(1.2);
      addHours(G, 0.75);
      if (G.ui && G.ui.letterbox) { try { G.ui.letterbox(false); } catch (e) { err(e); } }
    };
    H['carry-apples'] = (G) => {
      const Fl = F(G); Fl.carrying_apples = true;
      start(G, 'feast-ready'); step(G, 'feast-ready', 1);
      toast(G, 'A crate of fifty orchard apples, stalks up. About 220 kWh, carried in both hands.', 'gain');
    };
    H['apples-in'] = (G) => {
      const Fl = F(G); if (!Fl.carrying_apples) return;
      delete Fl.carrying_apples; Fl.apples_done = true;
      step(G, 'feast-ready', 2);
      toast(G, 'Fifty apples into the cold box, stalks up. Rhoswen counts them twice.');
    };
    H['lay-places'] = async (G) => {
      await fade(G, true, 0.6);
      sfx(G, 'cutlery', { vol: 0.5 });
      addHours(G, 1);
      const Fl = F(G); Fl.laid_places = true;
      step(G, 'feast-ready', 3); done(G, 'feast-ready');
      toast(G, 'Four hundred places laid: a lid, a cup, a knife and a cloth each, down the whole curve of the table.');
      await fade(G, false, 0.8);
    };
    H['carry-dishes'] = (G) => passTime(G, 0.35, 'Forty plates to the far stretches, both hands. The floor ahead looks uphill the whole way and never is.');
    H['bath'] = async (G) => {
      await passTime(G, 0.75, "Forty-five minutes in water the food plant warmed for nothing. About five hundredths of a kay.");
      F(G).bathed = true; found(G, 'free-bath');
    };
    H['spinball-game'] = async (G) => {
      await fade(G, true, 0.6);
      sfx(G, 'ball-throw', { vol: 0.5 }); sfx(G, 'cheer', { vol: 0.4 });
      addHours(G, 0.5);
      const Fl = F(G); Fl.played_spinball = true;
      if (G.inv && G.inv.has('spinball')) { Fl.ball_scuffed = true; start(G, 'spinball'); step(G, 'spinball', 0); step(G, 'spinball', 1); }
      found(G, 'spinball');
      toast(G, 'Half an hour of spinball in the long hall. You throw spinward once, and it dives into the floor, and everyone cheers.');
      await fade(G, false, 0.8);
    };
    S.gin = (gm) => { const Fl = F(gm || g); Fl.gins = (Fl.gins || 0) + 1; return Fl.gins >= 5 && !Fl.jook_slid ? 'jook' : null; };
    H['gin'] = (G) => S.gin(G);
    H['fourth-morning'] = (G) => scenes.fourthMorning(G);
    H['oona-at-two'] = (G) => scenes.oonaAtTwo(G);
    for (const k in H) S.hook(k, H[k]);
    S.fn = H;

    // ---------------------------------------------------------------- events: discoveries and shop flags that step threads
    g.events.on('found', (id) => {
      try {
        const Fl = F(g);
        if (id === 'margin' || id === 'held-places' || id === 'count-board') { start(g, 'ledger'); step(g, 'ledger', 0); }
        if (id === 'householders') { start(g, 'ledger'); step(g, 'ledger', 0); }
        if (id === 'rue-notebooks') { start(g, 'ledger'); step(g, 'ledger', 3); }
        if (id === 'long-flute') { start(g, 'flute'); step(g, 'flute', 0); done(g, 'flute'); }
        if (id === 'long-letter') { Fl.heard_letter = true; start(g, 'letter-room'); step(g, 'letter-room', 1); if (Fl.knows_measure) done(g, 'letter-room'); }
        if (id === 'painted-dawn' && day(g) === 2) { Fl.saw_rehearsal = true; start(g, 'middle'); step(g, 'middle', 0); }
      } catch (e) { err(e); }
    });
    // two things you find by going up: the lift whose floor swings, and why the sunline stops short of the wall
    g.events.on('cab:arrive', (e) => { try { if (e && e.to === 'flying-hall') found(g, 'down-goes-sideways'); } catch (er) { err(er); } });
    g.events.on('fly:start', (e) => { try { if (e && !e.long) found(g, 'short-sunline'); } catch (er) { err(er); } });
    g.events.on('fly:stop', (e) => {
      try {
        const long = e && e.long, Fl = F(g);
        if (!long || Fl.flight_done || !(day(g) === 3 || day(g) === 4)) return;
        Fl.flew = true; Fl.flight_done = true; found(g, 'dark-cable'); found(g, 'flyers-at-once');
        start(g, 'booking-day'); step(g, 'booking-day', 5); done(g, 'booking-day');
      } catch (er) { err(er); }
    });
    g.events.on('coat', () => { try { start(g, 'colour'); step(g, 'colour', 0); done(g, 'colour'); } catch (e) { err(e); } });
    g.events.on('talked', () => { try { checkLedger(); } catch (e) { err(e); } });
    function checkLedger() {
      const j = J(g); if (!j || !started(g, 'ledger') || isDone(g, 'ledger')) return;
      const t = j.threads().find((x) => x.id === 'ledger');
      if (t && t.steps.every((s) => s.done)) done(g, 'ledger');
    }

    // ---------------------------------------------------------------- the tick: where you are, and when
    let acc = 0, inBallHall = 0;
    const auto = () => S.auto !== false;
    const free = () => !g.busy && !(g.ui && g.ui.modal);
    function tick(dt) {
      if (!g.clock || !g.journal || !g.started) return;
      const Fl = F(g), d = day(g), h = hr(g), place = zp(g), fr = frameId(g);

      // nudges
      if (free()) {
        for (const n of NUDGES) {
          const key = 'nudge:' + n.id;
          if (Fl[key] || n.day !== d || h < n.at || h >= n.to) continue;
          if (n.when && !n.when(g)) continue;
          Fl[key] = true;
          if (n.banner) banner(g, n.banner[0], n.banner[1]); else toast(g, n.text, 'thread');
          break;
        }
      }

      // you arrive carrying Pell's crock and the heel of his loaf (a new game starts with neither in the bag)
      if (d === 1 && !Fl.got_mother && g.inv) {
        Fl.got_mother = true;
        if (!Fl.gave_mother && !g.inv.has('spelt-mother')) g.inv.give('spelt-mother', 1, true);
        if (!g.inv.has('heel')) g.inv.give('heel', 1, true);
      }
      // three nights
      if (Fl.signed_in) {
        if (fr === 'candlewick') step(g, 'three-nights', 1);
        if (place === 'flat-guest') { step(g, 'three-nights', 2); Fl.has_flat = true; }
        if (d >= 2 && started(g, 'three-nights')) { step(g, 'three-nights', 1); step(g, 'three-nights', 2); step(g, 'three-nights', 3); done(g, 'three-nights'); }
      }
      // the mother: the thread starts when you have the crock and have signed in
      if (Fl.signed_in && !started(g, 'mother') && g.inv && g.inv.has('spelt-mother')) { start(g, 'mother'); if (g.journal.focus && !Fl.has_flat) g.journal.focus('three-nights'); }
      if (place === 'hall' && started(g, 'mother') && d === 1) step(g, 'mother', 0);
      if (place === 'back-foot' && g.clock.sun && g.clock.sun() > 0.5) found(g, 'short-sunline');
      // tomorrow's sprig
      if (Fl.carrying_tray && fr === 'station') step(g, 'sprig', 0);
      // the jar of bruise in Oona's flat
      if (Fl.fetching_bruise && !Fl.has_bruise_jar && place === 'flat-oona') {
        Fl.has_bruise_jar = true; delete Fl.fetching_bruise;
        step(g, 'whose-dawn', 1);
        toast(g, "Marit's jar, on the shelf by the window: BRUISE, OCHRE, in her capitals.", 'gain');
      }
      // the mender's patch, made at the counter
      if (Fl.shownPatch && !isDone(g, 'mend')) {
        start(g, 'mend'); step(g, 'mend', 0); step(g, 'mend', 1); done(g, 'mend');
        if (g.inv && !g.inv.has('shown-patch')) g.inv.give('shown-patch', 1, true);
      }
      if (Fl.coat && !isDone(g, 'colour')) { start(g, 'colour'); step(g, 'colour', 0); done(g, 'colour'); }
      // the spinball: borrowed, then thrown in the long hall
      if (Fl.hasBall && g.inv && g.inv.has('spinball')) {
        if (!started(g, 'spinball')) start(g, 'spinball');
        step(g, 'spinball', 0);
        if (place === 'spinball-hall' && !Fl.ball_scuffed) {
          inBallHall += dt;
          if (inBallHall > 20) { Fl.ball_scuffed = true; step(g, 'spinball', 1); toast(g, 'You throw it anti down the long hall. It sails, and comes back scuffed.'); found(g, 'spinball'); }
        } else inBallHall = 0;
      }
      // the apples into the kitchen
      if (Fl.carrying_apples && place === 'kitchen') H['apples-in'](g);
      // Booking Day and the card home
      if (d === 3 && !started(g, 'booking-day')) start(g, 'booking-day');
      checkLedger();

      // the set pieces that start by themselves
      if (!auto() || !free()) return;
      if (d === 2 && h >= 18.95 && h < 20.5 && !Fl.saw_court && inPlace(g, ['court', 'terraces'])) { scenes.blockCourt(g); return; }
      if (d === 3) {
        if (h >= 5.95 && h < 7.5 && !Fl.saw_dawn && inPlace(g, DAWN_PLACES)) { scenes.dawn(g); return; }
        if (h >= 8.45 && h < 10.5 && !Fl.heard_ledger && place === 'ledger') { scenes.ledgerReading(g); return; }
        if (h >= 10 && h < 13 && !Fl.heard_question) {
          if (inPlace(g, ['ledger', 'hall', 'kitchen', 'court', 'green', 'counter', 'platform', 'guestdesk'])) { scenes.vote(g); return; }
          if (h >= 10.3) { Fl.heard_question = true; step(g, 'booking-day', 2); toast(g, 'The booking is in, flat. The question: an extra hour of full sun in the Hollow, or a larger hall fund.', 'thread'); }
        }
        if (h >= 12.9 && h < 16 && !Fl.at_feast && inPlace(g, ['hall', 'kitchen'])) { scenes.feast(g); return; }
        if (h >= 17 && h < 21.5 && !Fl.heard_vote) {
          if (inPlace(g, ['hall', 'kitchen', 'court', 'green', 'terraces', 'bandstand'])) { scenes.voteResult(g); return; }
          if (h >= 17.3) { Fl.heard_vote = true; step(g, 'booking-day', 4); toast(g, 'The vote is in: the hall fund, by four points.', 'thread'); }
        }
      }
      if (((d === 3 && h >= 21.9) || (d === 4 && h < 2)) && !Fl.heard_marit_ask && place === 'spindle' && (!g.fly || g.fly.active)) { scenes.longFlight(g); return; }
      if (d === 4 && h >= 1.5 && h < 5 && !Fl.saw_oona_two && place === 'elders-terrace') { scenes.oonaAtTwo(g); return; }
    }
    g.events.on('update', (dt) => {
      acc += dt || 0; if (acc < 0.5) return;
      const elapsed = acc; acc = 0;
      try { tick(elapsed); } catch (e) { err(e); }
    });
  },
};
