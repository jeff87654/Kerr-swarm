// The composers. Each cue is a small state machine that writes the next section
// of music as plain events: { t (s from section start), i (instrument), m (midi or
// array), d (s), v (0..1), x (extra) }. Pure JS: no Web Audio, so it can be tested.
//
// makeComposer(id, rnd, params) -> { bpm, next() -> Sec }

import { THEME, THEME_CHORDS, THEME_MAJOR_CHORDS, THEME_REHARM, BTUNE, BTUNE_CHORDS, LADLE, LADLE_CHORDS, LADLE_B, LADLE_B_CHORDS, REEL, REEL_CHORDS, REEL_B, REEL_B_CHORDS, FLIGHT, FLIGHT_BREATH, DAWN_VIOLET, DAWN_ROSE, DAWN_GOLD, SCALES, voicing, bassOf, tonesIn, beatsOf, transpose, augment, remap, TO_MAJOR, fragment, sequence, vary, choose, rpick, satb, dia } from './themes.js';

export class Sec {
  constructor(bpm, bpb) { this.bpm = bpm; this.spb = 60 / bpm; this.bpb = bpb || 4; this.ev = []; this.beats = 0; this.end = false; this.tail = 0; this.tag = ''; }
  add(i, b, m, db, v, x) { this.ev.push({ t: b * this.spb, i, m, d: db * this.spb, v, x: x || null }); }
  // a melodic line; returns the beat after it. art: articulation (fraction of each note held)
  line(i, b0, notes, v, x, art) {
    const total = Math.max(0.001, beatsOf(notes)), a = art || 0.96;
    let b = b0;
    for (const [m, d] of notes) {
      if (m !== null) {
        const arch = 0.9 + 0.14 * Math.sin(Math.PI * (b - b0) / total);
        this.add(i, b, m, Math.max(0.12, d * a), v * arch * (d >= 1 ? 1 : 0.92), x);
      }
      b += d;
    }
    return b;
  }
  // a choir part: notes run legato unless a rest follows
  sing(part, b0, notes, v, x) {
    let b = b0;
    for (let k = 0; k < notes.length; k++) {
      const [m, d] = notes[k];
      if (m !== null) {
        const nx = notes[k + 1];
        const tie = !!(nx && nx[0] !== null);
        this.add('choir', b, m, d, v, Object.assign({ p: part, tie }, x || {}));
      }
      b += d;
    }
    return b;
  }
}

const DOR = SCALES.dorian, GMAJ = SCALES.gmajor;

// ---------------------------------------------------------------- accompaniment helpers

function padRun(s, st, chords, each, v, lo, hi, n, x, b0) {
  let b = b0 || 0;
  for (const c of chords) {
    st.pad = voicing(c, st.pad, lo, hi, n || 4);
    s.add('pad', b, st.pad, each + 0.4, v, x);
    b += each;
  }
}

function bells(s, rnd, chords, each, count, v, lo, hi) {
  for (let k = 0; k < count; k++) {
    const bar = Math.floor(rnd() * chords.length);
    const beat = bar * each + Math.floor(rnd() * each * 2) / 2;
    const tones = tonesIn(chords[bar], lo || 81, hi || 96);
    if (tones.length) s.add('bell', beat, rpick(rnd, tones), 0, v * (0.7 + 0.3 * rnd()));
  }
}

// arpeggio from a 4-note voicing: pattern of indices (-1 rest), one every `step` beats
function arp(s, st, chords, each, pattern, step, v, lo, hi, x, b0) {
  let b = b0 || 0;
  for (const c of chords) {
    st.arp = voicing(c, st.arp, lo, hi, 4);
    for (let k = 0; k * step < each - 1e-6; k++) {
      const idx = pattern[k % pattern.length];
      if (idx >= 0) s.add('pluck', b + k * step, st.arp[idx], 0, v * (k === 0 ? 1 : 0.82), x);
    }
    b += each;
  }
}

// bass plucks: root on 0, another chord tone on the other listed beats
function bassRun(s, st, chords, each, beats, v, x, b0) {
  let b = b0 || 0;
  for (const c of chords) {
    st.bass = bassOf(c, st.bass, 38, 50);
    const up = tonesIn(c, st.bass + 5, st.bass + 9);
    const alt = up.length ? up[up.length - 1] : st.bass + 12;
    for (let k = 0; k < beats.length; k++) s.add('pluck', b + beats[k], k === 0 ? st.bass : alt, 0, v * (k === 0 ? 1 : 0.8), x);
    b += each;
  }
}

// a slow descant on chord tones, nearest the last note
function descant(s, st, rnd, chords, each, lo, hi, v, from) {
  let last = st.desc || Math.round((lo + hi) / 2);
  for (let i = from || 0; i < chords.length; i++) {
    const tones = tonesIn(chords[i], lo, hi);
    if (!tones.length) continue;
    tones.sort((a, b) => Math.abs(a - last) - Math.abs(b - last) + (rnd() - 0.5) * 3);
    const m = tones[0];
    const start = i * each + (rnd() < 0.5 ? 0 : 1);
    const len = each - (start - i * each) - (rnd() < 0.3 ? 1 : 0.2);
    s.add('flute', start, m, len, v * (0.85 + 0.2 * rnd()), { breath: 1.2 });
    last = m;
  }
  st.desc = last;
}

const GROOVES = {
  light: [[0, 'dum', 0.6], [1, 'tek', 0.32], [1.5, 'ka', 0.16], [2, 'dum', 0.45], [2.5, 'ka', 0.14], [3, 'tek', 0.38], [3.75, 'ka', 0.14]],
  court: [[0, 'dum', 0.8], [0.5, 'ka', 0.22], [1, 'tek', 0.6], [1.75, 'ka', 0.2], [2, 'dum', 0.6], [2.5, 'dum', 0.38], [3, 'tek', 0.62], [3.5, 'ka', 0.24], [3.75, 'ka', 0.14]],
  feast: [[0, 'boom', 0.55], [0, 'dum', 0.7], [0.5, 'ka', 0.25], [1, 'tek', 0.62], [1.5, 'ka', 0.2], [1.75, 'ka', 0.18], [2, 'dum', 0.6], [2.5, 'tek', 0.3], [3, 'tek', 0.64], [3.25, 'ka', 0.16], [3.5, 'dum', 0.4], [3.75, 'ka', 0.2]],
  reel: [[0, 'boom', 0.9], [1, 'tek', 0.55], [1 + 2 / 3, 'ka', 0.2]],
  pulse: [[0, 'boom', 0.5], [0.55, 'boom', 0.24], [2, 'boom', 0.42], [2.55, 'boom', 0.2]],
};

function groove(s, rnd, nbars, style, v, b0, fill) {
  const pat = GROOVES[style];
  const bpb = style === 'reel' ? 2 : 4;
  for (let bar = 0; bar < nbars; bar++) {
    const base = (b0 || 0) + bar * bpb;
    for (const [b, k, vel] of pat) if (rnd() > 0.06 || b === 0) s.add('drum', base + b, 0, 0, vel * v * (0.9 + 0.2 * rnd()), k);
    // ghosts that come and go
    if (style === 'reel') { for (const g of [1 / 3, 2 / 3, 4 / 3]) if (rnd() < 0.45) s.add('drum', base + g, 0, 0, 0.12 * v, 'ka'); }
    else if (style !== 'pulse' && rnd() < 0.35) s.add('drum', base + rpick(rnd, [0.25, 1.25, 2.25, 3.25]), 0, 0, 0.13 * v, 'ka');
    if (fill && bar === nbars - 1 && style !== 'pulse' && style !== 'reel') {
      for (const b of [3, 3.25, 3.5, 3.75]) s.add('drum', base + b, 0, 0, (0.25 + 0.15 * rnd()) * v, rnd() < 0.5 ? 'tek' : 'ka');
    }
  }
}

function strums(s, st, chords, each, pattern, v, lo, hi, mute, b0) {
  let b = b0 || 0;
  for (const c of chords) {
    st.str = voicing(c, st.str, lo, hi, 4);
    for (const [beat, vel, up] of pattern) if (beat < each) s.add('strum', b + beat, st.str, 0, v * vel, { up: !!up, mute });
    b += each;
  }
}

function melodyRange(notes) { let lo = 999, hi = 0; for (const [m] of notes) if (m !== null) { if (m < lo) lo = m; if (m > hi) hi = m; } return [lo, hi]; }
function shiftIfFits(notes, k, lo, hi) { const [a, b] = melodyRange(notes); return a + k >= lo && b + k <= hi ? transpose(notes, k) : notes; }

// a harmony part a third (or sixth) below a melody, inside the scale
function consort(notes, sc, steps) { return notes.map(([m, d]) => [m === null ? null : dia(m, steps, sc), d]); }

// ---------------------------------------------------------------- title

function title(rnd) {
  const bpm = 72, st = {};
  let n = 0, last = 'intro';
  return { bpm, next() {
    const s = new Sec(bpm, 4);
    n++;
    if (n === 1) {
      s.tag = 'intro';
      s.add('drone', 0, 38, 3, 0.9);
      const ch = ['Dm', 'Csus2', 'Dm(add9)', 'Am'];
      padRun(s, st, ch, 4, 0.45, 50, 72, 4, { att: 2.5, rel: 2.5 });
      bells(s, rnd, ch, 4, 3, 0.32);
      s.beats = 16;
      return s;
    }
    const kind = n === 2 ? 'flute' : choose(rnd, { flute: 3, pluck: 3, btune: 2, breath: last === 'breath' ? 0 : 2 }, last);
    last = kind; s.tag = kind;
    s.add('drone', 0, 38, 3, kind === 'breath' ? 1 : 0.7);
    if (kind === 'flute') {
      padRun(s, st, THEME_CHORDS, 4, 0.4, 50, 72, 4);
      let mel = vary(THEME, rnd, { orn: 0.12 + 0.2 * rnd(), regroup: 0.15, pass: 0.15 });
      s.line('flute', 0, mel, 0.7);
      if (rnd() < 0.3) s.line('flute', 16, consort(fragment(mel, 16, 32), DOR, -2), 0.34);
      arp(s, st, THEME_CHORDS, 4, rnd() < 0.5 ? [0, 2, 3, 1] : [0, -1, 2, 3], 1, 0.3, 50, 69);
      bells(s, rnd, THEME_CHORDS, 4, 2, 0.26);
      s.beats = 32;
    } else if (kind === 'pluck') {
      padRun(s, st, THEME_CHORDS, 4, 0.3, 50, 72, 4);
      const mel = vary(rnd() < 0.5 ? transpose(THEME, -12) : THEME, rnd, { orn: 0.1, pass: 0.25, regroup: 0.2 });
      s.line('pluck', 0, mel, 0.62);
      bassRun(s, st, THEME_CHORDS, 4, [0], 0.42);
      descant(s, st, rnd, THEME_CHORDS, 4, 79, 88, 0.48, 1);
      s.beats = 32;
    } else if (kind === 'btune') {
      padRun(s, st, BTUNE_CHORDS, 4, 0.36, 50, 72, 4);
      s.line('flute', 0, vary(BTUNE, rnd, { orn: 0.2, regroup: 0.2 }), 0.66);
      arp(s, st, BTUNE_CHORDS, 4, [0, 1, 2, 3, 2, 1, 2, 1], 0.5, 0.26, 50, 69);
      bells(s, rnd, BTUNE_CHORDS, 4, 2, 0.24);
      s.beats = 32;
    } else {
      const ch = rnd() < 0.5 ? ['Dm(add9)', 'G/D', 'Fmaj7', 'Csus2'] : ['Am(add9)', 'Fmaj7', 'G6', 'Dm(add9)'];
      padRun(s, st, ch, 4, 0.48, 50, 74, 4, { att: 2, rel: 2.5 });
      bells(s, rnd, ch, 4, 4 + Math.floor(rnd() * 3), 0.3);
      if (rnd() < 0.5) s.line('flute', 4, fragment(THEME, 0, 4), 0.42);
      s.beats = 16;
    }
    return s;
  } };
}

// ---------------------------------------------------------------- arrival

function ostinato(s, st, chords, each, v, b0) {
  let b = b0 || 0;
  for (const c of chords) {
    const r = bassOf(c, st.ob, 50, 61);
    st.ob = r;
    const ts = tonesIn(c, r + 1, r + 19);
    const five = ts.find((x) => x - r >= 6 && x - r <= 8) || ts[0];
    const oct = r + 12;
    const top = ts.find((x) => x > oct) || oct + 7;
    const pat = [r, five, oct, five, top, five, oct, five];
    for (let k = 0; k < each * 2; k++) s.add('pluck', b + k * 0.5, pat[k % 8], 0, v * (k % 2 ? 0.68 : 1) * (k % 4 === 0 ? 1.1 : 1), { mute: 0.32 });
    b += each;
  }
}

function arrival(rnd) {
  const bpm = 92, st = {};
  let n = 0, last = 'ost';
  return { bpm, next() {
    const s = new Sec(bpm, 4);
    n++;
    const kind = n === 1 ? 'ost' : n === 2 ? 'theme' : choose(rnd, { theme: 3, btune: 2, choir: 2.5, inter: last === 'ost' ? 0 : 1.5 }, last);
    last = kind; s.tag = kind;
    if (kind === 'ost' || kind === 'inter') {
      const ch = kind === 'ost' ? ['Dm', 'C', 'Dm', 'Am'] : rpick(rnd, [['F', 'C', 'G', 'Am'], ['F', 'G', 'Am', 'Am'], ['Dm', 'F', 'G', 'C']]);
      ostinato(s, st, ch, 4, 0.36);
      if (kind === 'inter' || n > 1) groove(s, rnd, 4, 'light', 0.8, 0, true);
      padRun(s, st, ch, 4, 0.28, 52, 72, 4, { att: 1.5 });
      bells(s, rnd, ch, 4, kind === 'inter' ? 4 : 2, 0.26);
      s.beats = 16;
      return s;
    }
    const chords = kind === 'btune' ? BTUNE_CHORDS : THEME_CHORDS;
    ostinato(s, st, chords, 4, kind === 'choir' ? 0.26 : 0.32);
    groove(s, rnd, 8, 'light', 0.85, 0, true);
    if (kind === 'theme') {
      padRun(s, st, chords, 4, 0.26, 52, 72, 4);
      s.line('flute', 0, vary(THEME, rnd, { orn: 0.2, regroup: 0.25, pass: 0.2 }), 0.72);
      if (rnd() < 0.5) bells(s, rnd, chords, 4, 3, 0.24);
    } else if (kind === 'btune') {
      padRun(s, st, chords, 4, 0.26, 52, 72, 4);
      const mel = vary(BTUNE, rnd, { orn: 0.2, regroup: 0.2 });
      s.line('flute', 0, mel, 0.7);
      s.line('pluck', 0, transpose(mel, -12), 0.3, { mute: 0.4 });
    } else {
      // the theme sung, bright 'ah', with a flute counterline above it
      s.add('vowel', 0, 0, 1.5, 1, 'ah');
      s.sing(0, 0, THEME, 0.75, { glide: 0.08 });
      let b = 0;
      for (const c of chords) {
        st.ch = voicing(c, st.ch, 55, 71, 2);
        s.add('choir', b, st.ch[1], 4, 0.55, { p: 1, tie: b < 28, glide: 0.2 });
        s.add('choir', b, st.ch[0], 4, 0.55, { p: 2, tie: b < 28, glide: 0.2 });
        b += 4;
      }
      descant(s, st, rnd, chords, 4, 81, 91, 0.45, 0);
    }
    s.beats = 32;
    return s;
  } };
}

// ---------------------------------------------------------------- court-evening (the band)

const TUNES = [
  { a: LADLE, ac: LADLE_CHORDS, b: LADLE_B, bc: LADLE_B_CHORDS, sc: GMAJ },
  { a: THEME, ac: THEME_CHORDS, b: BTUNE, bc: BTUNE_CHORDS, sc: DOR, dance: true },
  { a: augment(REEL, 2), ac: REEL_CHORDS, b: augment(REEL_B, 2), bc: REEL_B_CHORDS, sc: DOR },
];
const COMP = [[1, 0.42], [3, 0.42], [3.5, 0.24, true]];

function court(rnd) {
  const st = {};
  let bpm = 108, tune = 0, step = 0, lastTune = -1;
  const plan = ['A', 'A2', 'B', 'B2', 'A3'];
  let gap = false;
  return { get bpm() { return bpm; }, next() {
    if (gap) {
      gap = false;
      const s = new Sec(bpm, 4);
      s.tag = 'gap';
      const secs = 3 + rnd() * 3.5;
      s.beats = secs / s.spb;
      // tuning up between tunes: a few soft open strings
      const k = 2 + Math.floor(rnd() * 3);
      for (let i = 0; i < k; i++) s.add('pluck', rnd() * (s.beats - 1.2), rpick(rnd, [50, 57, 62, 55, 45]), 0, 0.18 + 0.08 * rnd(), { mute: 1.2 });
      // the odd count-in on the drum's rim
      if (rnd() < 0.5 && s.beats > 5) for (let c = 0; c < 4; c++) s.add('drum', s.beats - 4 + c, 0, 0, c ? 0.24 : 0.32, 'frame');
      return s;
    }
    if (step === 0) {
      let t = Math.floor(rnd() * TUNES.length);
      if (t === lastTune) t = (t + 1) % TUNES.length;
      tune = t; lastTune = t;
      bpm = 104 + Math.floor(rnd() * 8);
    }
    const T = TUNES[tune];
    const part = plan[step];
    const s = new Sec(bpm, 4);
    s.tag = 'tune' + tune + part;
    const isB = part[0] === 'B';
    const chords = isB ? T.bc : T.ac;
    let mel = isB ? T.b : T.a;
    const o = T.dance ? { orn: 0.3, regroup: 0.45, pass: 0.4, sc: T.sc } : { orn: part.length > 1 ? 0.3 : 0.12, regroup: 0.15, pass: 0.2, sc: T.sc };
    mel = vary(mel, rnd, o);
    if (part === 'A2' && rnd() < 0.4) mel = shiftIfFits(mel, 12, 62, 93);
    s.line('flute', 0, mel, 0.72, null, 0.9);
    if ((part === 'B2' || part === 'A3') && rnd() < 0.6) s.line('flute', 0, consort(mel, T.sc, -2), 0.36, null, 0.9);
    bassRun(s, st, chords, 4, [0, 2], 0.5, { mute: 0.6 });
    strums(s, st, chords, 4, COMP, 0.9, 55, 69, 0.22);
    groove(s, rnd, 8, 'court', 0.9, 0, part === 'A3' || rnd() < 0.3);
    s.beats = 32;
    step++;
    if (step >= plan.length || (step === 4 && rnd() < 0.4)) { step = 0; gap = true; }
    return s;
  } };
}

// ---------------------------------------------------------------- busker (one flute, thinking aloud)

function busker(rnd) {
  let lastStart = -1;
  return { bpm: 76, next() {
    const bpm = 68 + Math.floor(rnd() * 17);
    const s = new Sec(bpm, 4);
    const r = rnd();
    let mel;
    if (r < 0.1) {
      // a long held note, swelling
      const m = rpick(rnd, [81, 74, 76, 69]);
      const len = (3 + rnd() * 2.5) / s.spb;
      s.add('flute', 0, m, len, 0.6, { vib: 1.4, att: 0.25 });
      s.tag = 'held';
      s.beats = len + (1 + rnd() * 2) / s.spb;
      return s;
    } else if (r < 0.25) {
      const st = Math.floor(rnd() * 4) * 8;
      mel = fragment(BTUNE, st, st + 8);
      s.tag = 'b' + st;
    } else if (r < 0.37) {
      mel = THEME; s.tag = 'full';
    } else {
      let st = Math.floor(rnd() * 4) * 2;
      if (st === lastStart) st = (st + 2) % 8;
      lastStart = st;
      const len = rnd() < 0.6 ? 2 : 4;
      mel = fragment(THEME, st * 4, Math.min(32, (st + len) * 4));
      s.tag = 't' + st + ':' + len;
      if (len === 2 && rnd() < 0.3) mel = sequence(mel, rnd() < 0.5 ? 1 : -1, DOR);
    }
    while (mel.length && mel[0][0] === null) mel = mel.slice(1);
    while (mel.length && mel[mel.length - 1][0] === null) mel = mel.slice(0, -1);
    mel = vary(mel, rnd, { orn: 0.35, pass: 0.3, regroup: 0.3 });
    if (rnd() < 0.25) mel = shiftIfFits(mel, 12, 62, 93);
    else if (rnd() < 0.15) mel = shiftIfFits(mel, -12, 62, 93);
    // rubato: each note breathes a little; the last one is held
    const v = 0.55 + 0.25 * rnd();
    let b = 0;
    for (let k = 0; k < mel.length; k++) {
      const [m, d0] = mel[k];
      const d = d0 * (1 + (rnd() - 0.5) * 0.1) * (k === mel.length - 1 ? 1.7 : 1);
      if (m !== null) s.add('flute', b, m, d * 0.95, v * (0.9 + 0.15 * Math.sin(Math.PI * k / mel.length)), { breath: 1.15 });
      b += d;
    }
    s.beats = b + (0.8 + rnd() * 2.2) / s.spb;
    return s;
  } };
}

// ---------------------------------------------------------------- choir (a block choir rehearsing)

function chorale(mel, chords) {
  const [a, t, b] = satb(mel, chords, 4);
  return [mel, a, t, b];
}
const CHORALES = [chorale(THEME, THEME_CHORDS), chorale(BTUNE, BTUNE_CHORDS)];

function choirRehearsal(rnd) {
  const bpm = 66;
  let plan = [];
  let song = 0, vowel = 'ah';
  function refill() {
    song = plan.length === 0 && song === 0 ? 0 : 1 - song;
    const p = ['tune', [0, 4]];
    if (rnd() < 0.7) p.push([0, 4]);
    p.push([4, 8]);
    if (rnd() < 0.6) { const k = rnd() < 0.5 ? [6, 8] : [4, 6]; p.push(k, k); }
    p.push([0, 8]);
    if (rnd() < 0.4) p.push([0, 8]);
    plan = p;
  }
  return { bpm, next() {
    if (!plan.length) refill();
    const item = plan.shift();
    const s = new Sec(bpm, 4);
    if (item === 'tune') {
      // a held tuning chord on 'oo', then quiet
      s.tag = 'tune';
      s.add('vowel', 0, 0, 0.5, 1, 'oo');
      const ch = song === 0 ? [50, 57, 65, 74] : [53, 60, 69, 77];
      const len = 4 + rnd() * 2;
      for (let p = 0; p < 4; p++) s.add('choir', p * 0.3, ch[3 - p], len / s.spb, 0.5, { p, att: 0.8, rel: 1.2 });
      s.beats = (len + 2.5 + rnd() * 2) / s.spb;
      return s;
    }
    const [from, to] = item;
    const s2 = new Sec(63 + Math.floor(rnd() * 7), 4);
    s.spb = s2.spb; s.bpm = s2.bpm;
    s.tag = 'bars' + from + '-' + to + ':' + song;
    // now and then a sectional: one or two parts alone
    const sect = to - from <= 4 && rnd() < 0.3 ? rpick(rnd, [[0, 1], [2, 3], [1], [0]]) : null;
    const v2 = rnd() < 0.3 ? 'oo' : 'ah';
    if (v2 !== vowel) { vowel = v2; s.add('vowel', 0, 0, 0.5, 1, vowel); }
    const parts = CHORALES[song];
    const vel = [0.7, 0.55, 0.55, 0.6];
    for (let p = 0; p < 4; p++) {
      if (sect && sect.indexOf(p) < 0) continue;
      s.sing(p, 0, fragment(parts[p], from * 4, to * 4), vel[p] * (0.9 + 0.2 * rnd()) * (sect ? 1.15 : 1), { att: 0.25, rel: 0.6, glide: 0.07 });
    }
    let beats = (to - from) * 4;
    // the director stops them, taps the stand twice, and they go again
    const rest = (2.5 + rnd() * 3.5) / s.spb;
    if (rnd() < 0.55) { s.add('drum', beats + rest - 2.2, 0, 0, 0.22, 'ka'); s.add('drum', beats + rest - 1.4, 0, 0, 0.22, 'ka'); }
    s.beats = beats + rest;
    return s;
  } };
}

// ---------------------------------------------------------------- dawn

function dawn(rnd, params) {
  const bpm = 56, st = {};
  let phase = '', idx = 0, sub = 0, stated = false, sinceTheme = 0, vowel = 'oo', gold = 0;
  const prog = () => Math.max(0, Math.min(1, +params.progress || 0));
  function statement(s, major) {
    const mel = major ? vary(remap(THEME, TO_MAJOR), rnd, { orn: 0.18, pass: 0.15, regroup: 0.1, sc: SCALES.dmajor }) : THEME;
    const chords = major ? THEME_MAJOR_CHORDS : THEME_CHORDS.slice(0, 7).concat(['D']);
    s.tag = major ? 'theme-major' : 'theme';
    s.add('drone', 0, 38, 4, 1);
    padRun(s, st, chords, 4, 0.42, 52, 76, 4, { att: 1.8, rel: 2.2 });
    s.line('flute', 0, mel, 0.72, { breath: 1.1 });
    let b = 0;
    for (let i = 0; i < 8; i++) {
      st.ch = voicing(chords[i], st.ch, 57, 74, 3);
      for (let p = 0; p < 3; p++) s.add('choir', b, st.ch[p], 4, 0.5, { p, tie: i < 7, glide: 0.5, att: 1.2, rel: 2.5 });
      b += 4;
    }
    if (!major) s.add('vowel', 16, 0, 6, 1, 'ah');
    arp(s, st, chords, 4, major ? [0, 1, 2, 3, 2, 1, 2, 3] : [0, 2, 1, 3], major ? 0.5 : 1, 0.3, 50, 72);
    s.add('bell', 0, 86, 0, 0.3); s.add('bell', 16, 81, 0, 0.26); s.add('bell', 28, 86, 0, 0.32);
    if (major) bells(s, rnd, chords, 4, 3, 0.22, 78, 93);
    s.beats = 32;
    sinceTheme = 0;
    return s;
  }
  return { bpm, next() {
    const p = prog();
    const s = new Sec(bpm, 4);
    if (!stated && p >= 0.66) { stated = true; return statement(s, false); }
    if (stated && p >= 0.8 && gold >= 8 && sinceTheme >= 24 && rnd() < 0.25) return statement(s, true);
    const ph = p < 0.33 ? 'violet' : p < 0.66 ? 'rose' : 'gold';
    if (ph !== phase) { phase = ph; idx = 0; sub = 0; }
    const list = ph === 'violet' ? DAWN_VIOLET : ph === 'rose' ? DAWN_ROSE : DAWN_GOLD;
    const c = list[idx % list.length];
    s.tag = ph + ':' + c;
    if (ph === 'gold') gold++;
    sinceTheme++;
    if (sub === 0) {
      s.add('drone', 0, 38, 4, 1);
      const lo = 45 + Math.round(10 * p), hi = 67 + Math.round(12 * p);
      st.pad = voicing(c, st.pad, lo, hi, 4);
      s.add('pad', 0, st.pad, 8.5, 0.5, { att: 3, rel: 3 });
      if (p >= 0.45) {
        st.ch = voicing(c, st.ch, 60, 79, 3);
        for (let q = 0; q < 3; q++) s.add('choir', 0, st.ch[q], 8, 0.45, { p: q, tie: true, glide: 0.8, att: 2.5 });
        const want = p >= 0.8 ? 'ah' : 'oo';
        if (want !== vowel) { vowel = want; s.add('vowel', 0, 0, 8, 1, want); }
      }
    }
    if (p >= 0.33) {
      const fast = p >= 0.8;
      const vc = voicing(c, st.arp, 57, 76, 4);
      st.arp = vc;
      const pat = fast ? [0, 1, 2, 3, 2, 3, 1, 2] : [0, 2, 1, 3];
      const step = fast ? 0.5 : 1;
      for (let k = 0; k * step < 4; k++) s.add('pluck', k * step, vc[pat[k % pat.length]], 0, 0.3 * (k === 0 ? 1 : 0.8), { dark: p < 0.5 });
    }
    if (p >= 0.28) bells(s, rnd, [c], 4, 1 + (rnd() < p ? 1 : 0), 0.28, 76, 93);
    if (ph === 'rose' && p >= 0.45 && sub === 0 && rnd() < 0.5) s.line('flute', 0, fragment(THEME, 0, 4), 0.5);
    if (ph === 'gold' && stated && sub === 0 && rnd() < 0.45) {
      const k = Math.floor(rnd() * 4) * 8;
      const frag = remap(fragment(THEME, k, k + 8), TO_MAJOR).filter((n) => n[0] !== null);
      s.line('flute', 0, fragment(frag, 0, 8), 0.55);
    }
    // the darkest part: a low frame drum like a slow heart, now and then
    if (ph === 'violet' && sub === 0 && rnd() < 0.5) s.add('drum', 0, 0, 0, 0.28, 'boom');
    sub++;
    if (sub >= 2) { sub = 0; idx++; }
    s.beats = 4;
    return s;
  } };
}

// ---------------------------------------------------------------- feast

const FEAST_TUNES = [
  { a: LADLE, ac: LADLE_CHORDS, b: LADLE_B, bc: LADLE_B_CHORDS, up: true },
  { a: transpose(BTUNE, 2), ac: ['G', 'D', 'Em', 'D', 'Em', 'G', 'D', 'Em'], up: false },
  { a: transpose(THEME, -5), ac: ['Am', 'G', 'Am', 'Em', 'C', 'D', 'G', 'Am'], up: true },
];
const FEAST_STRUM = [[0, 0.5], [0.5, 0.24, true], [1, 0.4], [1.5, 0.24, true], [2, 0.45], [2.5, 0.24, true], [3, 0.4], [3.5, 0.3, true]];

function feast(rnd) {
  const bpm = 112, st = {};
  let tune = -1, rep = 0, n = 0;
  return { bpm, next() {
    const s = new Sec(bpm, 4);
    n++;
    if (rep === 0 && n > 2 && rnd() < 0.18) {
      // breakdown: drums, bass and a few strums
      s.tag = 'break';
      const ch = ['G', 'C', 'G', 'D'];
      groove(s, rnd, 4, 'feast', 1, 0, true);
      bassRun(s, st, ch, 4, [0, 1.5, 2, 3.5], 0.5, { mute: 0.3 });
      strums(s, st, ch, 4, [[1, 0.3], [3, 0.3]], 1, 55, 69, 0.15);
      s.beats = 16;
      return s;
    }
    if (rep === 0) { let t = Math.floor(rnd() * FEAST_TUNES.length); if (t === tune) t = (t + 1) % FEAST_TUNES.length; tune = t; }
    const T = FEAST_TUNES[tune];
    const useB = T.b && rep === 2;
    const chords = useB ? T.bc : T.ac;
    let mel = vary(useB ? T.b : T.a, rnd, { orn: rep ? 0.3 : 0.15, pass: 0.25, regroup: 0.25, sc: GMAJ });
    if (rep === 1 && T.up) mel = shiftIfFits(mel, 12, 62, 93);
    s.tag = 'feast' + tune + ':' + rep;
    s.line('flute', 0, mel, 0.72, null, 0.92);
    if (rep >= 1 && rnd() < 0.55) s.line('flute', 0, consort(mel, GMAJ, -2), 0.34, null, 0.92);
    strums(s, st, chords, 4, FEAST_STRUM, 0.85, 55, 71, 0.16);
    bassRun(s, st, chords, 4, [0, 2, 3.5], 0.52, { mute: 0.45 });
    padRun(s, st, chords, 4, 0.22, 52, 72, 4, { att: 0.8 });
    groove(s, rnd, 8, 'feast', 1, 0, rep === 2 || rnd() < 0.3);
    s.add('bell', 0, rpick(rnd, tonesIn(chords[0], 79, 91)), 0, 0.3);
    s.add('bell', 16, rpick(rnd, tonesIn(chords[4], 79, 91)), 0, 0.26);
    s.beats = 32;
    rep = (rep + 1) % (T.b ? 3 : 2);
    return s;
  } };
}

// ---------------------------------------------------------------- reel (6/8, two dotted-quarter beats a bar)

function reel(rnd) {
  const st = {};
  let bpm = 84, k = 0, cycle = 0;
  const order = ['A', 'A2', 'B', 'B2'];
  let inter = false;
  return { get bpm() { return bpm; }, next() {
    if (inter) {
      inter = false;
      const s = new Sec(bpm, 2);
      s.tag = 'inter';
      groove(s, rnd, 4, 'reel', 0.9);
      for (let b = 0; b < 4; b++) s.add('pluck', b * 2, rpick(rnd, [38, 45]), 0, 0.45);
      s.beats = 8;
      return s;
    }
    const part = order[k];
    const s = new Sec(bpm, 2);
    s.tag = 'reel' + part;
    const isB = part[0] === 'B';
    const chords = isB ? REEL_B_CHORDS : REEL_CHORDS;
    let mel = isB ? REEL_B : REEL;
    if (part.length > 1 || cycle > 0) mel = vary(mel, rnd, { orn: 0.3, pass: 0.15 });
    s.line('flute', 0, mel, 0.74, null, 0.9);
    if (part === 'B2' && rnd() < 0.6) s.line('flute', 0, transpose(mel, -12), 0.34, null, 0.9);
    groove(s, rnd, 8, 'reel', 1);
    let b = 0;
    for (const c of chords) {
      st.bass = bassOf(c, st.bass, 38, 50);
      s.add('pluck', b, st.bass, 0, 0.55);
      st.str = voicing(c, st.str, 55, 69, 4);
      s.add('strum', b + 1, st.str, 0, 0.4, { mute: 0.3 });
      if (rnd() < 0.5) s.add('strum', b + 1 + 2 / 3, st.str, 0, 0.24, { up: true, mute: 0.2 });
      b += 2;
    }
    s.beats = 16;
    k++;
    if (k >= order.length) { k = 0; cycle++; bpm = 82 + Math.floor(rnd() * 5); if (rnd() < 0.3) inter = true; }
    return s;
  } };
}

// ---------------------------------------------------------------- long-flight

const FLIGHT_SUBS = { 1: ['Bbadd9', 'Bbmaj7'], 3: ['C/E', 'Am(add9)/E'], 5: ['Ebmaj7#11', 'Eb6'] };

function flight(rnd) {
  const bpm = 60, st = {};
  let n = 0, last = '', descantTheme = false;
  function pulse(s, bars, v) { groove(s, rnd, bars, 'pulse', v); }
  function chordsLayer(s, chords, each, parts, lo, hi, v, vow) {
    let b = 0;
    const np = parts.length;
    for (let i = 0; i < chords.length; i++) {
      st.v = voicing(chords[i], st.v && st.v.length === np ? st.v : null, lo, hi, np);
      const last2 = i === chords.length - 1;
      for (let q = 0; q < np; q++) s.add('choir', b, st.v[np - 1 - q], each, v * (0.9 + 0.15 * rnd()), { p: parts[q], tie: !last2, glide: 0.6, att: 1.6, rel: 3 });
      b += each;
    }
  }
  return { bpm, next() {
    n++;
    const kind = n === 1 ? 'mediant' : n === 2 ? 'theme' : choose(rnd, { mediant: 3, theme: 3, breath: last === 'breath' ? 0 : 1.6 }, last);
    last = kind;
    const s = new Sec(bpm, 4);
    s.tag = kind;
    s.add('drone', 0, 38, 4, kind === 'breath' ? 0.7 : 1);
    const vow = rnd() < 0.5 ? 'ah' : 'oo';
    s.add('vowel', 0, 0, 6, 1, vow);
    if (kind === 'mediant') {
      const chords = FLIGHT.map((c, i) => (FLIGHT_SUBS[i] && rnd() < 0.35 ? FLIGHT_SUBS[i][1] : c));
      // Asus4 resolves to A in its second bar
      const seq = chords.slice(0, 7).concat(['Asus4', 'A']);
      const each = [8, 8, 8, 8, 8, 8, 8, 4, 4];
      let b = 0;
      for (let i = 0; i < seq.length; i++) {
        st.v = voicing(seq[i], st.v && st.v.length === 5 ? st.v : null, 55, 86, 5);
        for (let q = 0; q < 5; q++) s.add('choir', b, st.v[4 - q], each[i], 0.5 * (0.9 + 0.15 * rnd()), { p: q + 1, tie: i < seq.length - 1, glide: 0.6, att: 1.8, rel: 3 });
        if (i >= 4 && i < 8) {
          const col = tonesIn(seq[i], 84, 93);
          if (col.length) s.add('choir', b + 1, rpick(rnd, col), each[i] - 2, 0.4, { p: 0, att: 2, rel: 2 });
        }
        b += each[i];
      }
      s.add('vowel', 32, 0, 8, 1, vow === 'ah' ? 'oo' : 'ah');
      pulse(s, 16, 1);
      s.beats = 64;
    } else if (kind === 'theme') {
      const mel = augment(THEME, 2);
      s.sing(1, 0, mel, 0.72, { glide: 0.25, att: 1, rel: 2.5 });
      chordsLayer(s, THEME_REHARM, 8, [2, 3, 4, 5], 50, 74, 0.48);
      descantTheme = !descantTheme;
      if (descantTheme) s.sing(0, 32, transpose(fragment(mel, 32, 64), 12), 0.32, { glide: 0.25, att: 1.2, rel: 3 });
      pulse(s, 16, 1);
      s.beats = 64;
    } else {
      chordsLayer(s, FLIGHT_BREATH, 8, [2, 3, 4], 60, 79, 0.45);
      s.add('vowel', 0, 0, 4, 1, 'oo');
      pulse(s, 8, 0.6);
      s.beats = 32;
    }
    return s;
  } };
}

// ---------------------------------------------------------------- card-home (the ending)

function cardHome(rnd) {
  const bpm = 66, st = {};
  let n = 0;
  return { bpm, next() {
    const s = new Sec(bpm, 4);
    n++;
    if (n === 1) {
      // the theme alone on plucked strings, with sparse bass notes
      s.tag = 'pluck';
      s.line('pluck', 0, transpose(THEME, -12), 0.7);
      let b = 0;
      for (const c of THEME_CHORDS) { st.bass = bassOf(c, st.bass, 38, 50); s.add('pluck', b, st.bass, 0, 0.36, { dark: true }); b += 4; }
      s.beats = 32;
    } else if (n === 2) {
      s.tag = 'flute';
      const mel = THEME.slice(0, 13).concat(vary(THEME.slice(13), rnd, { orn: 0.2 }));
      s.line('flute', 0, mel, 0.62);
      arp(s, st, THEME_CHORDS, 4, [0, 1, 2, 1], 1, 0.26, 50, 67, { dark: true });
      s.beats = 32;
    } else {
      s.tag = 'end';
      s.add('strum', 0, [38, 45, 50, 57, 62, 66], 0, 0.42, { spread: 0.07 });
      s.add('bell', 0.05, 86, 0, 0.32);
      s.add('bell', 1.5, 81, 0, 0.16);
      s.beats = 4;
      s.end = true;
      s.tail = 6;
    }
    return s;
  } };
}

// ---------------------------------------------------------------- registry

const MAKERS = {
  title, arrival, 'court-evening': court, busker, choir: choirRehearsal, dawn, feast, reel, 'long-flight': flight, 'card-home': cardHome,
};

export function makeComposer(id, rnd, params) {
  const f = MAKERS[id];
  if (!f) throw new Error('no cue ' + id);
  return f(rnd, params || {});
}

export const COMPOSER_IDS = Object.keys(MAKERS);
