/* ---------- Sound: the drum's hum, synthesised (off until asked for) ---------- */
"use strict";

let AUD = null;

function audioStart() {
  if (AUD) return AUD;
  let ctx;
  try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
  // brown noise: fans, water, two hundred million people breathing
  const len = ctx.sampleRate * 6;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; data[i] = last * 3.2; }
  }
  const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 220; lp.Q.value = 0.3;
  const ng = ctx.createGain(); ng.gain.value = 0;
  noise.connect(lp); lp.connect(ng);
  // pumps: two low tones, slightly apart, so they beat slowly
  const o1 = ctx.createOscillator(); o1.type = "sine"; o1.frequency.value = 49;
  const o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.value = 49.7;
  const o3 = ctx.createOscillator(); o3.type = "triangle"; o3.frequency.value = 98.4;
  const hg = ctx.createGain(); hg.gain.value = 0;
  const h3 = ctx.createGain(); h3.gain.value = 0.25;
  o1.connect(hg); o2.connect(hg); o3.connect(h3); h3.connect(hg);
  // a slow swell, like breathing
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
  const lfoG = ctx.createGain(); lfoG.gain.value = 0.02;
  lfo.connect(lfoG); lfoG.connect(ng.gain);
  const master = ctx.createGain(); master.gain.value = 0.9;
  ng.connect(master); hg.connect(master); master.connect(ctx.destination);
  noise.start(); o1.start(); o2.start(); o3.start(); lfo.start();
  AUD = { ctx, ng, hg, lp, master, on: true, scene: null };
  return AUD;
}

const AUDIO_SCENES = {
  platform: { noise: 0.16, cut: 260, hum: 0.010 },
  hollow: { noise: 0.07, cut: 1100, hum: 0.003 },
  glide: { noise: 0.02, cut: 110, hum: 0.0 },
  window: { noise: 0.025, cut: 90, hum: 0.006 },
  cycler: { noise: 0.05, cut: 160, hum: 0.004 },
  title: { noise: 0.03, cut: 140, hum: 0.002 },
};

function audioScene(name) {
  if (!AUD || !AUD.on) return;
  if (AUD.scene === name) return;
  AUD.scene = name;
  const s = AUDIO_SCENES[name] || AUDIO_SCENES.platform;
  const t = AUD.ctx.currentTime;
  AUD.ng.gain.cancelScheduledValues(t); AUD.ng.gain.setTargetAtTime(s.noise, t, 0.8);
  AUD.hg.gain.cancelScheduledValues(t); AUD.hg.gain.setTargetAtTime(s.hum, t, 0.8);
  AUD.lp.frequency.cancelScheduledValues(t); AUD.lp.frequency.setTargetAtTime(s.cut, t, 0.8);
}

function audioToggle() {
  if (!AUD) {
    const a = audioStart();
    if (!a) { toast("This browser can't play sound here."); return false; }
    a.ctx.resume && a.ctx.resume();
    audioScene(currentAudioScene());
    return true;
  }
  AUD.on = !AUD.on;
  const t = AUD.ctx.currentTime;
  AUD.master.gain.setTargetAtTime(AUD.on ? 0.9 : 0, t, 0.3);
  if (AUD.on) { AUD.scene = null; audioScene(currentAudioScene()); }
  return AUD.on;
}

function currentAudioScene() {
  if (!state || !$("#title").hidden) return "title";
  if (stageMode === "glide") return "glide";
  if (state.view === "window") return "window";
  if (state.view === "hollow") return "hollow";
  if (state.transit) return "cycler";
  return "platform";
}
