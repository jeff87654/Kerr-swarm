// Rooms: synthesised impulse responses and a crossfading convolution reverb.
// In heliox sound runs about 1.8 times faster than in air, so a room of a given size
// returns its early reflections sooner and its walls slap back quicker than you expect.

import { impulse } from './dsp.js';

// rt: decay time (s). pre: predelay. er/erSpan: early reflection count and spread.
// low/high: decay multipliers below 300 Hz and above 4 kHz. bright: level of the top band.
// slap: discrete echoes [time, amp]. dark: final low-pass. wet: return level.
export const ROOMS = {
  room: { rt: 0.4, pre: 0.003, er: 12, erSpan: 0.016, high: 0.75, bright: 0.65, attack: 0.006, wet: 0.62 },
  // a bare 200 m arcade: bright, long, with a distinct slap off the far wall and its flutter
  ring: { rt: 2.2, pre: 0.006, er: 10, erSpan: 0.03, high: 0.9, bright: 0.9, attack: 0.03, erAmp: 1.2,
    slap: [[0.068, 0.5], [0.136, 0.26], [0.204, 0.13], [0.272, 0.06]], wet: 0.95 },
  // felt-hung: short and dull
  felt: { rt: 0.25, pre: 0.002, er: 6, erSpan: 0.01, high: 0.3, bright: 0.1, attack: 0.004, dark: 2600, wet: 0.34 },
  // 124 m long dining hall: the end walls answer about 0.4 s later, softly
  hall: { rt: 1.4, pre: 0.008, er: 14, erSpan: 0.04, high: 0.7, bright: 0.6, attack: 0.025,
    slap: [[0.4, 0.07]], wet: 0.8 },
  // baths: wet and bright, dense reflections off tile and water
  tile: { rt: 1.8, pre: 0.004, er: 18, erSpan: 0.028, high: 0.95, bright: 1.0, attack: 0.012, erAmp: 1.8, wet: 1.0 },
  // four decks of machinery: long, darker, with two faint structural resonances
  station: { rt: 3.0, pre: 0.012, er: 12, erSpan: 0.07, low: 1.3, high: 0.45, bright: 0.3, attack: 0.05, dark: 6500,
    modes: [[58, 0.015, 2.5], [117, 0.01, 2.0]], wet: 0.9 },
  // the Hollow: almost dry. The far bank returns a faint, diffuse echo 9.7 s later.
  open: { rt: 0.16, pre: 0.002, er: 3, erSpan: 0.01, high: 0.8, bright: 0.5, attack: 0.003, wet: 0.25, echo: 9.7 },
};

// Fixed reverb for non-positional score.
export const SCORE_ROOM = { rt: 2.6, pre: 0.02, er: 8, erSpan: 0.05, low: 1.05, high: 0.6, bright: 0.55, attack: 0.07, wet: 1 };

// The far-bank echo is smeared by 3 km of travel; this is its diffusion.
const SMEAR = { rt: 0.9, pre: 0.0, er: 0, erSpan: 0.01, low: 1, high: 0.25, bright: 0.1, attack: 0.25, dark: 1800 };

export const ROOM_IDS = ['none', 'room', 'ring', 'felt', 'hall', 'tile', 'station', 'open'];

// eng: { ctx, buffer(key, variants, render) }. input/output: AudioNodes.
export function createReverb(eng, input, output) {
  const ctx = eng.ctx;
  let current = 'none';
  let slot = null;            // { conv, gain }
  const old = [];             // slots fading out: { conv, gain, t }

  // echo path: input -> delay -> band limit -> smear -> echo gain -> output
  const delay = ctx.createDelay(12);
  delay.delayTime.value = ROOMS.open.echo;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; lp.Q.value = 0.5;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 160; hp.Q.value = 0.5;
  const smear = ctx.createConvolver(); smear.normalize = false;
  const echoGain = ctx.createGain(); echoGain.gain.value = 0;
  const echoSend = ctx.createGain(); echoSend.gain.value = 1;
  input.connect(echoSend); echoSend.connect(delay); delay.connect(lp); lp.connect(hp); hp.connect(smear); smear.connect(echoGain); echoGain.connect(output);
  let smearSet = false;

  function ir(id) {
    const spec = id === 'score' ? SCORE_ROOM : id === 'smear' ? SMEAR : ROOMS[id];
    return eng.buffer('ir:' + id, 1, (sr) => impulse(sr, spec, 11 + id.length * 17));
  }

  function set(id, fade) {
    if (!ROOMS[id]) id = 'none';
    if (id === current) return;
    const t = ctx.currentTime;
    const f = fade === undefined ? 1 : Math.max(0.02, fade);
    if (slot) {
      slot.gain.gain.cancelScheduledValues(t);
      slot.gain.gain.setValueAtTime(slot.gain.gain.value, t);
      slot.gain.gain.linearRampToValueAtTime(0, t + f);
      slot.t = t + f + 0.1;
      old.push(slot);
      slot = null;
    }
    current = id;
    if (id !== 'none') {
      const conv = ctx.createConvolver();
      conv.normalize = false;
      conv.buffer = ir(id);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(ROOMS[id].wet, t + f);
      input.connect(conv); conv.connect(gain); gain.connect(output);
      slot = { conv, gain, t: 0 };
    }
    // the far-bank echo only exists in the open
    const want = id === 'open' ? 0.032 : 0;   // about -30 dB
    if (want > 0 && !smearSet) { smear.buffer = ir('smear'); smearSet = true; }
    echoGain.gain.cancelScheduledValues(t);
    echoGain.gain.setValueAtTime(echoGain.gain.value, t);
    echoGain.gain.linearRampToValueAtTime(want, t + f);
  }

  // called from the engine's update: drop slots that have finished fading
  function update(now) {
    for (let i = old.length - 1; i >= 0; i--) {
      if (now > old[i].t) {
        try { input.disconnect(old[i].conv); } catch (e) { /* already gone */ }
        old[i].conv.disconnect(); old[i].gain.disconnect();
        old[i] = old[old.length - 1]; old.pop();
      }
    }
  }

  return { set, update, get id() { return current; }, scoreIR: () => ir('score'), warm: (id) => ir(id) };
}
