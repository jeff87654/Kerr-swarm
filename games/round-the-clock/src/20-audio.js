/* ---------- Sound: a small synthesiser, bright the way heliox makes everything bright ----------
   Nothing plays until the player has touched the page, and the Sound button turns it all off.
   Games call Snd.tap(), Snd.good() and so on; every call is safe when sound is off. */
"use strict";

const Snd = {
  ctx: null, on: true, out: null, wet: null, muted: 0,
  wake() {
    if (!Snd.on) return;
    if (!Snd.ctx) {
      try { Snd.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { Snd.on = false; return; }
      const c = Snd.ctx;
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -16; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.2;
      Snd.out = c.createGain(); Snd.out.gain.value = 0.7;
      // rooms ring in heliox: a short, bright slap behind every sound
      const dl = c.createDelay(0.5); dl.delayTime.value = 0.085;
      const fb = c.createGain(); fb.gain.value = 0.22;
      const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3800;
      Snd.wet = c.createGain(); Snd.wet.gain.value = 0.2;
      Snd.out.connect(comp);
      Snd.out.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(Snd.wet); Snd.wet.connect(comp);
      comp.connect(c.destination);
    }
    if (Snd.ctx.state === "suspended") Snd.ctx.resume().catch(() => {});
  },
  set(on) {
    Snd.on = !!on;
    storageSet("rtc-sound", on ? "1" : "0");
    if (on) Snd.wake(); else if (Snd.ctx && Snd.ctx.state === "running") Snd.ctx.suspend().catch(() => {});
  },
  ok() { return Snd.on && Snd.ctx && Snd.ctx.state === "running" && Snd.muted === 0; },
  // one voice: {f, f1 (glide to), type, dur, vol, at, attack, lp (lowpass Hz)}
  tone(o) {
    if (!Snd.ok()) return;
    const c = Snd.ctx, t0 = c.currentTime + (o.at || 0), dur = o.dur || 0.12;
    const osc = c.createOscillator(); osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t0 + dur);
    const gn = c.createGain(); const vol = o.vol === undefined ? 0.15 : o.vol;
    gn.gain.setValueAtTime(0.0001, t0);
    gn.gain.exponentialRampToValueAtTime(vol, t0 + (o.attack || 0.006));
    gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = osc;
    if (o.lp) { const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = o.lp; osc.connect(f); node = f; }
    node.connect(gn); gn.connect(Snd.out);
    osc.start(t0); osc.stop(t0 + dur + 0.03);
  },
  // filtered noise: {dur, vol, f, f1 (sweep to), q, type, at, attack}
  noise(o) {
    if (!Snd.ok()) return;
    const c = Snd.ctx, t0 = c.currentTime + (o.at || 0), dur = o.dur || 0.2;
    if (!Snd._nb) {
      const len = c.sampleRate * 1.5, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      Snd._nb = b;
    }
    const src = c.createBufferSource(); src.buffer = Snd._nb; src.loop = true;
    const f = c.createBiquadFilter(); f.type = o.type || "bandpass"; f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.f || 1000, t0);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(Math.max(30, o.f1), t0 + dur);
    const gn = c.createGain(); const vol = o.vol === undefined ? 0.12 : o.vol;
    gn.gain.setValueAtTime(0.0001, t0);
    gn.gain.exponentialRampToValueAtTime(vol, t0 + (o.attack || 0.008));
    gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(gn); gn.connect(Snd.out);
    src.start(t0, Math.random()); src.stop(t0 + dur + 0.03);
  },
  // semitones from A4
  hz(n) { return 440 * Math.pow(2, n / 12); },

  /* ---- the sounds games use ---- */
  tap() { Snd.tone({ f: 720, f1: 520, dur: 0.05, vol: 0.12 }); },
  tick() { Snd.tone({ f: 1500, dur: 0.02, vol: 0.05, type: "square", lp: 3000 }); },
  step() { Snd.noise({ f: 320, q: 1.2, dur: 0.05, vol: 0.1 }); },
  pop() { Snd.tone({ f: 620, f1: 1240, dur: 0.06, vol: 0.13 }); },
  good() { Snd.tone({ f: 660, dur: 0.11, vol: 0.13 }); Snd.tone({ f: 990, dur: 0.16, vol: 0.12, at: 0.07 }); },
  great() { [0, 4, 7, 12].forEach((n, i) => Snd.tone({ f: Snd.hz(n + 3), dur: 0.2, vol: 0.12, at: i * 0.065, type: "triangle" })); },
  bad() { Snd.tone({ f: 196, f1: 139, dur: 0.22, vol: 0.14, type: "sawtooth", lp: 900 }); },
  miss() { Snd.tone({ f: 330, f1: 247, dur: 0.14, vol: 0.1, type: "triangle" }); },
  whoosh(k) { Snd.noise({ f: 500, f1: 2400, q: 0.8, dur: 0.28 * (k || 1), vol: 0.1, attack: 0.08 }); },
  splash(k) { k = k || 1; Snd.noise({ type: "lowpass", f: 3200, f1: 500, dur: 0.5 * k, vol: 0.16 * k, attack: 0.004 }); Snd.noise({ f: 5200, q: 0.6, dur: 0.25, vol: 0.05 * k, at: 0.03 }); },
  thud(k) { k = k || 1; Snd.tone({ f: 120, f1: 52, dur: 0.16, vol: 0.2 * k }); Snd.noise({ type: "lowpass", f: 260, dur: 0.07, vol: 0.12 * k }); },
  clack() { Snd.noise({ f: 1900, q: 3, dur: 0.035, vol: 0.14 }); Snd.tone({ f: 980, dur: 0.03, vol: 0.05, type: "square", lp: 2500 }); },
  sizzle(k) { Snd.noise({ type: "highpass", f: 5200, dur: 0.35 * (k || 1), vol: 0.035, attack: 0.03 }); },
  pour() { Snd.noise({ f: 900, f1: 1500, q: 2.5, dur: 0.3, vol: 0.06, attack: 0.05 }); },
  bell(n) { const f = Snd.hz(n === undefined ? 7 : n); [1, 2.76, 5.4].forEach((m, i) => Snd.tone({ f: f * m, dur: 1.1 / (i + 1), vol: 0.1 / (i + 1) })); },
  chime(i) { const sc = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]; Snd.tone({ f: Snd.hz(sc[clamp(i | 0, 0, sc.length - 1)] + 3), dur: 0.22, vol: 0.12, type: "triangle" }); },
  clap(n) { for (let i = 0; i < (n || 1); i++) Snd.noise({ f: 1400 + Math.random() * 500, q: 1.4, dur: 0.035, vol: 0.09, at: i * 0.045 + Math.random() * 0.02 }); },
  cheer(k) { k = k || 1; Snd.noise({ f: 900, f1: 1300, q: 0.5, dur: 0.9 * k, vol: 0.07 * k, attack: 0.15 }); Snd.clap(Math.round(6 * k)); },
  // a thread is tied: one note for each knot
  knots(n) { for (let i = 0; i < n; i++) Snd.tone({ f: Snd.hz([3, 7, 10][i]), dur: 0.28, vol: 0.13, at: 0.1 + i * 0.16, type: "triangle" }); if (n === 3) Snd.tone({ f: Snd.hz(15), dur: 0.5, vol: 0.12, at: 0.62, type: "triangle" }); },
  // each Hour has a five-note call, made from its number
  call(hour) {
    const sc = [0, 2, 4, 7, 9]; const r = makeRng(hour * 977 + 5);
    const type = ["triangle", "sine", "triangle", "square", "sawtooth"][hour % 5];
    let d = r.int(0, 4);
    for (let i = 0; i < 5; i++) {
      d = clamp(d + r.int(-2, 2), 0, 9);
      const n = sc[d % 5] + 12 * Math.floor(d / 5) - 9 + (hour % 3);
      Snd.tone({ f: Snd.hz(n), dur: i === 4 ? 0.4 : 0.15, vol: type === "sine" || type === "triangle" ? 0.12 : 0.05, at: i * 0.13, type, lp: 2600 });
    }
  },
  // the band's last chord, and the same chord back off the far bank of the Hollow, nearly ten seconds on
  chord(echo) {
    const notes = [-19, -12, -7, -3, 0, 5];
    const play = (at, vol, lp, dur) => notes.forEach((n, i) => Snd.tone({ f: Snd.hz(n + 2), dur, vol: vol * (i < 2 ? 1.2 : 1), at: at + i * 0.012, type: "sawtooth", lp, attack: 0.03 }));
    play(0, 0.075, 2200, 1.3);
    if (echo !== false) play(9.7, 0.02, 800, 2.2);
  },
};

// A silent stand-in with the same calls, for the demo that plays on each Hour's card.
const SndOff = (() => {
  const o = {};
  for (const k of Object.keys(Snd)) if (typeof Snd[k] === "function") o[k] = () => {};
  o.hz = Snd.hz;
  return o;
})();
