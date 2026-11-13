// Sound, all of it made here as it plays: a held chord for each world, the drum's own air, water, a crowd, a choir in
// heliox, and now and then a struck note. Off until asked for. A world describes its sound with a few numbers:
//
//   sound: { root: 50, scale: 'dorian', pad: 0.5, air: 0.3, hum: 0.2, water: 0, crowd: 0, choir: 0, bells: 0.3, bright: 0.5 }
//
//   root    MIDI note of the chord's root (48 = C3)          scale   'dorian' | 'lydian' | 'aeolian' | 'major' | 'pent' | 'whole'
//   pad     the held chord, 0..1                            bright  how open its filter is, 0..1
//   air     fans and far rooms: soft noise                  hum     the low note of pumps
//   water   lapping and running                             crowd   many voices a long way off
//   choir   sung notes, high and thin as in heliox          bells   struck notes: 0 = none, 1 = one every couple of seconds
import { hashStr, makeRng } from './rng.js';

const SCALES = { dorian: [0, 2, 3, 5, 7, 9, 10], lydian: [0, 2, 4, 6, 7, 9, 11], aeolian: [0, 2, 3, 5, 7, 8, 10], major: [0, 2, 4, 5, 7, 9, 11], pent: [0, 2, 4, 7, 9], whole: [0, 2, 4, 6, 8, 10], mixo: [0, 2, 4, 5, 7, 9, 10] };
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class Sound {
  constructor() { this.ctx = null; this.on = false; this.cur = null; this.pending = null; this.timer = 0; this.rng = makeRng(7); }

  enable(on) {
    this.on = on;
    if (on && !this.ctx) this.boot();
    if (!this.ctx) return;
    if (on) { this.ctx.resume(); this.master.gain.setTargetAtTime(0.8, this.ctx.currentTime, 0.6); if (this.pending) { const p = this.pending; this.pending = null; this.setWorld(p.spec, p.def, 1.5); } }
    else this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25);
  }
  duck(d) { if (this.ctx && this.on) this.master.gain.setTargetAtTime(d ? 0 : 0.8, this.ctx.currentTime, 0.3); }

  boot() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.gain.value = 0;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.02; comp.release.value = 0.4;
    this.master.connect(comp); comp.connect(c.destination);
    // a hall to sing in: three seconds of fading noise
    const len = Math.floor(c.sampleRate * 3.2), ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    this.verb = c.createConvolver(); this.verb.buffer = ir;
    const vg = c.createGain(); vg.gain.value = 0.55; this.verb.connect(vg); vg.connect(this.master);
    // noise to carve air, water and crowds from
    const nlen = c.sampleRate * 4, nb = c.createBuffer(1, nlen, c.sampleRate), nd = nb.getChannelData(0);
    let last = 0; for (let i = 0; i < nlen; i++) { const w = Math.random() * 2 - 1; last = (last + 0.04 * w) / 1.04; nd[i] = w * 0.55 + last * 6; }
    this.noise = nb;
    this.tick();
  }

  // a new world: fade the old voices out and the new in
  setWorld(spec, def, fade = 3) {
    if (!this.ctx || !this.on) { this.pending = { spec, def }; return; }
    const c = this.ctx, now = c.currentTime;
    const seed = hashStr(def ? def.id : 'x');
    const s = { root: 45 + (seed % 10), scale: ['dorian', 'lydian', 'pent', 'mixo'][seed % 4], pad: 0.5, air: 0.25, hum: 0.15, water: 0, crowd: 0, choir: 0, bells: 0.25, bright: 0.5, ...(spec || {}) };
    if (this.cur) { const old = this.cur; old.out.gain.setTargetAtTime(0, now, fade / 3); setTimeout(() => { try { old.stop(); } catch (e) { /* already gone */ } }, fade * 1000 + 1500); }
    const out = c.createGain(); out.gain.value = 0; out.gain.setTargetAtTime(1, now, fade / 3);
    out.connect(this.master);
    const wet = c.createGain(); wet.gain.value = 0.5; out.connect(wet); wet.connect(this.verb);
    const nodes = [];
    const sc = SCALES[s.scale] || SCALES.dorian;
    const osc = (type, f, gain, dest, det = 0) => { const o = c.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det; const g = c.createGain(); g.gain.value = gain; o.connect(g); g.connect(dest); o.start(); nodes.push(o); return { o, g }; };
    const lfo = (rate, depth, param) => { const o = c.createOscillator(); o.frequency.value = rate; const g = c.createGain(); g.gain.value = depth; o.connect(g); g.connect(param); o.start(); nodes.push(o); };
    const noise = (type, f, q, gain, dest) => { const n = c.createBufferSource(); n.buffer = this.noise; n.loop = true; n.playbackRate.value = 0.9 + Math.random() * 0.2; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = c.createGain(); g.gain.value = gain; n.connect(fl); fl.connect(g); g.connect(dest); n.start(0, Math.random() * 3); nodes.push(n); return { fl, g }; };
    // the held chord: root, fifth, the octave and one colour note, each a pair of slightly mistuned voices
    if (s.pad > 0) {
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 350 + 1800 * s.bright; lp.Q.value = 0.6; lp.connect(out);
      lfo(0.05 + Math.random() * 0.04, 150 + 500 * s.bright, lp.frequency);
      const tones = [0, 7, 12, 12 + sc[2 % sc.length], 19, 24 + sc[4 % sc.length]];
      tones.forEach((t, i) => { const f = hz(s.root + t), g = s.pad * 0.07 / (1 + i * 0.35); const a = osc(i % 2 ? 'triangle' : 'sawtooth', f, g * (i % 2 ? 1 : 0.35), lp, -6 - i); osc('sine', f, g, lp, 5 + i); lfo(0.07 + i * 0.023, g * 0.5, a.g.gain); });
    }
    if (s.hum > 0) { osc('sine', hz(s.root - 12), s.hum * 0.09, out); osc('sine', hz(s.root - 12) * 1.5, s.hum * 0.02, out); }
    if (s.air > 0) { const a = noise('bandpass', 420, 0.5, s.air * 0.11, out); lfo(0.09, s.air * 0.04, a.g.gain); noise('lowpass', 160, 0.3, s.air * 0.16, out); }
    if (s.water > 0) { const w = noise('bandpass', 1500, 0.9, s.water * 0.07, out); lfo(0.23, s.water * 0.05, w.g.gain); lfo(0.11, 500, w.fl.frequency); const w2 = noise('highpass', 3600, 0.4, s.water * 0.022, out); lfo(0.37, s.water * 0.02, w2.g.gain); }
    if (s.crowd > 0) { const k = noise('bandpass', 680, 0.8, s.crowd * 0.12, out); lfo(0.13, s.crowd * 0.05, k.g.gain); lfo(0.07, 180, k.fl.frequency); noise('bandpass', 1500, 1.4, s.crowd * 0.035, out); }
    // a choir in heliox: the pitch is a singer's own, but the throat rings half as high again, so the vowels come out bright
    if (s.choir > 0) {
      const notes = [12, 12 + sc[2 % sc.length], 19, 24, 24 + sc[1]];
      notes.forEach((t, i) => {
        const f = hz(s.root + t), sum = c.createGain(); sum.gain.value = 0;
        const v = c.createOscillator(); v.type = 'sawtooth'; v.frequency.value = f; v.detune.value = (i - 2) * 4; v.start(); nodes.push(v);
        lfo(4.6 + i * 0.3, f * 0.006, v.frequency);
        for (const [ff, q, g] of [[1150, 7, 1], [1900, 9, 0.5], [4100, 8, 0.2]]) { const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = ff; b.Q.value = q; const bg = c.createGain(); bg.gain.value = g; v.connect(b); b.connect(bg); bg.connect(sum); }
        sum.connect(wet); const dry = c.createGain(); dry.gain.value = 0.4; sum.connect(dry); dry.connect(out);
        // each voice swells and rests on its own
        const swell = () => { if (!cur.alive) return; const t = c.currentTime, d = 5 + Math.random() * 6; sum.gain.cancelScheduledValues(t); sum.gain.setTargetAtTime(s.choir * 0.05 * (0.5 + Math.random()), t, d * 0.25); sum.gain.setTargetAtTime(0.0001, t + d * 0.6, d * 0.2); cur.timers.push(setTimeout(swell, (d + 1 + Math.random() * 5) * 1000)); };
        setTimeout(swell, 600 + i * 900);
      });
    }
    const cur = this.cur = { spec: s, out, wet, sc, alive: true, timers: [], nextBell: now + 2 + Math.random() * 3,
      stop: () => { cur.alive = false; for (const t of cur.timers) clearTimeout(t); for (const n of nodes) { try { n.stop(); } catch (e) { /* not started */ } } out.disconnect(); wet.disconnect(); } };
  }

  // struck notes, scheduled a little ahead
  tick() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.tick(), 400);
    const c = this.ctx, cur = this.cur;
    if (!c || !cur || !this.on || !cur.spec.bells) return;
    while (cur.nextBell < c.currentTime + 0.8) {
      const s = cur.spec, t = Math.max(cur.nextBell, c.currentTime + 0.02);
      const deg = cur.sc[Math.floor(this.rng() * cur.sc.length)], oct = 12 * (1 + Math.floor(this.rng() * 3));
      const f = hz(s.root + deg + oct), o = c.createOscillator(), m = c.createOscillator(), mg = c.createGain(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = f; m.frequency.value = f * 2.76; mg.gain.setValueAtTime(f * 1.2, t); mg.gain.exponentialRampToValueAtTime(1, t + 0.5);
      m.connect(mg); mg.connect(o.frequency);
      const peak = 0.05 * (0.4 + 0.6 * this.rng()) * Math.min(1, 0.4 + s.bells);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5 + this.rng() * 2.5);
      o.connect(g); g.connect(cur.wet); g.connect(cur.out);
      o.start(t); m.start(t); o.stop(t + 7); m.stop(t + 7);
      cur.nextBell = t + (1.2 + this.rng() * 5.5) / Math.max(0.08, s.bells);
    }
  }
}
