// Thematic material and the small amount of theory the composers need:
// tunes as [midi, beats] (null = rest), chord symbols, voice-led voicings, and
// variation operators. Pure data and functions: no Web Audio here.

// ---------------------------------------------------------------- tunes

// The main theme. D Dorian, 4/4, eight bars. It recurs in title, arrival, dawn,
// long-flight and card-home, and the busker, the choir and the band play it too.
export const THEME = [
  [74, 1.5], [76, 0.5], [77, 1], [81, 1],          // D  E  F  A     rising, open
  [79, 2], [77, 1], [76, 1],                       // G     F  E     settles
  [74, 1], [72, 1], [69, 1], [72, 1],              // D  C  A  C     dips
  [76, 3], [null, 1],                              // E              half close
  [81, 1.5], [79, 0.5], [77, 1], [79, 1],          // A  G  F  G     answers higher
  [81, 1], [83, 1], [81, 2],                       // A  B  A        the Dorian B: the tune's signature
  [79, 1], [77, 0.5], [76, 0.5], [74, 1], [72, 1], // G  F  E  D  C  runs home
  [74, 4],                                         // D
];
export const THEME_CHORDS = ['Dm', 'C', 'Dm', 'Am', 'F', 'G', 'C', 'Dm'];
// the theme in D major (dawn's gold): F -> F sharp, C -> C sharp
export const THEME_MAJOR_CHORDS = ['D', 'Em', 'A', 'A', 'D', 'G', 'A', 'D'];
// long-flight's coloured reharmonisation, one chord per theme bar
export const THEME_REHARM = ['Dm9', 'Cmaj7/E', 'Dm/F', 'Am(add9)', 'Fmaj7#11', 'G6/B', 'Cadd9', 'D'];

// The B tune, in the relative major's light.
export const BTUNE = [
  [77, 1], [79, 1], [81, 2],
  [84, 1], [81, 1], [79, 2],
  [77, 1], [74, 1], [76, 1], [77, 1],
  [79, 3], [null, 1],
  [81, 1], [84, 1], [86, 1.5], [84, 0.5],
  [81, 1], [79, 1], [77, 2],
  [76, 1], [77, 1], [79, 1], [76, 1],
  [74, 4],
];
export const BTUNE_CHORDS = ['F', 'C', 'Dm', 'C', 'Dm', 'F', 'C', 'Dm'];

// 'Ladle Row', the court's own tune. G major.
export const LADLE = [
  [67, 0.5], [71, 0.5], [74, 1], [74, 0.5], [76, 0.5], [74, 1],
  [72, 0.5], [71, 0.5], [69, 1], [67, 1], [69, 1],
  [71, 1], [74, 1], [79, 1], [78, 0.5], [76, 0.5],
  [74, 3], [null, 1],
  [76, 0.5], [78, 0.5], [79, 1], [76, 1], [74, 1],
  [72, 1], [74, 0.5], [72, 0.5], [71, 1], [69, 1],
  [67, 0.5], [69, 0.5], [71, 1], [74, 1], [69, 1],
  [67, 4],
];
export const LADLE_CHORDS = ['G', 'C', 'G', 'D', 'C', 'Am', 'D', 'G'];
// its second strain: the same steps lifted, ending on the dominant then home
export const LADLE_B = [
  [79, 1], [78, 0.5], [76, 0.5], [74, 1], [71, 1],
  [72, 0.5], [74, 0.5], [76, 1], [72, 1], [69, 1],
  [71, 0.5], [72, 0.5], [74, 1], [79, 1], [74, 1],
  [76, 2], [78, 1], [null, 1],
  [79, 1.5], [76, 0.5], [74, 1], [71, 1],
  [72, 1], [76, 1], [74, 1], [72, 1],
  [71, 0.5], [72, 0.5], [74, 1], [69, 1], [66, 1],
  [67, 4],
];
export const LADLE_B_CHORDS = ['G', 'C', 'G', 'D', 'Em', 'C', 'D', 'G'];

// The reel, 6/8 with the dotted quarter as the beat (two beats a bar). Each bar
// hangs on its downbeat, the way dancers hang at a third of a g, then runs.
const E = 1 / 3;
export const REEL = [
  [74, 1], [76, E], [77, E], [81, E],
  [79, 1], [77, E], [76, E], [74, E],
  [72, 1], [74, E], [76, E], [72, E],
  [69, 1], [72, E], [74, E], [76, E],
  [81, 1], [79, E], [81, E], [83, E],
  [81, 2 * E], [79, E], [77, E], [76, E], [77, E],
  [79, 1], [77, E], [76, E], [72, E],
  [74, 2],
];
export const REEL_CHORDS = ['Dm', 'C', 'C', 'Am', 'F', 'Dm', 'C', 'Dm'];
export const REEL_B = [
  [81, 1], [83, E], [84, E], [86, E],
  [84, 1], [83, E], [81, E], [79, E],
  [77, 1], [79, E], [81, E], [77, E],
  [76, 1], [74, E], [76, E], [77, E],
  [79, 1], [81, E], [79, E], [77, E],
  [76, 2 * E], [74, E], [72, E], [74, E], [76, E],
  [77, 1], [76, E], [74, E], [72, E],
  [74, 2],
];
export const REEL_B_CHORDS = ['Am', 'C', 'F', 'C', 'G', 'Am', 'F', 'Dm'];

// long-flight's strange progression: chromatic mediants, added ninths, a raised eleventh
export const FLIGHT = ['Dadd9', 'Bbadd9', 'Fadd9', 'C/E', 'Gm(add9)/D', 'Ebmaj7#11', 'Bb/F', 'Asus4'];
export const FLIGHT_BREATH = ['Dsus2', 'Bbmaj7', 'Gm(add9)', 'Asus4'];

// dawn's three colours
export const DAWN_VIOLET = ['Dm', 'Bb/D', 'Gm/D', 'Eb/D'];
export const DAWN_ROSE = ['F', 'C', 'Dm', 'Bb'];
export const DAWN_GOLD = ['Dadd9', 'E/D', 'Bm', 'Gmaj7'];

// ---------------------------------------------------------------- scales

export const SCALES = {
  dorian: [2, 4, 5, 7, 9, 11, 0],      // D Dorian (white notes)
  gmajor: [7, 9, 11, 0, 2, 4, 6],
  dmajor: [2, 4, 6, 7, 9, 11, 1],
  lydian: [2, 4, 6, 8, 9, 11, 1],      // D Lydian
  aeolian: [2, 4, 5, 7, 9, 10, 0],
};

// Move a pitch by diatonic steps within a scale (snapping onto the scale first).
export function dia(m, steps, sc) {
  const inScale = (x) => sc.indexOf(((x % 12) + 12) % 12) >= 0;
  let cur = m;
  if (!inScale(cur)) cur = inScale(cur - 1) ? cur - 1 : cur + 1;
  const dir = steps > 0 ? 1 : -1;
  for (let k = 0; k < Math.abs(steps); k++) {
    do { cur += dir; } while (!inScale(cur));
  }
  return cur;
}

// ---------------------------------------------------------------- chords

const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const QUAL = {
  '': [0, 4, 7], m: [0, 3, 7], sus2: [0, 2, 7], sus4: [0, 5, 7], add9: [0, 4, 7, 14], madd9: [0, 3, 7, 14],
  m9: [0, 3, 7, 10, 14], maj7: [0, 4, 7, 11], 'maj7#11': [0, 4, 7, 11, 18], 6: [0, 4, 7, 9], m7: [0, 3, 7, 10],
  7: [0, 4, 7, 10], 5: [0, 7], m6: [0, 3, 7, 9],
};
function pcOf(s) {
  let v = PC[s[0]];
  if (s[1] === '#') v += 1; else if (s[1] === 'b') v -= 1;
  return (v + 12) % 12;
}
const chordCache = new Map();
export function chord(sym) {
  let c = chordCache.get(sym);
  if (c) return c;
  let s = sym, bass = null;
  const k = s.indexOf('/');
  if (k > 0) { bass = s.slice(k + 1); s = s.slice(0, k); }
  const acc = s[1] === '#' || s[1] === 'b' ? 2 : 1;
  const root = pcOf(s);
  const q = s.slice(acc).replace('(', '').replace(')', '');
  const iv = QUAL[q] || QUAL[''];
  c = { sym, root, iv, pcs: iv.map((x) => (root + x) % 12), bass: bass ? pcOf(bass) : root };
  chordCache.set(sym, c);
  return c;
}

// Lowest midi >= lo with pitch class pc.
export function atOrAbove(pc, lo) { return lo + ((pc - lo) % 12 + 12) % 12; }

// Bass note for a chord, nearest the previous bass inside [lo, hi].
export function bassOf(sym, prev, lo, hi) {
  const c = chord(sym);
  let m = atOrAbove(c.bass, lo === undefined ? 38 : lo);
  const h = hi === undefined ? 50 : hi;
  if (prev !== undefined && prev !== null && m + 12 <= h && Math.abs(m + 12 - prev) < Math.abs(m - prev)) m += 12;
  return m;
}

// A voice-led voicing of n notes in [lo, hi], nearest the previous voicing.
// Searches combinations of chord tones; below midi 52 adjacent notes stay a fourth
// apart (no muddy low thirds), the third and colour tones are kept, spreads stay modest.
export function voicing(sym, prev, lo, hi, n) {
  const c = chord(sym);
  const tones = [];
  for (let m = lo; m <= hi; m++) if (c.pcs.indexOf(m % 12) >= 0) tones.push(m);
  const third = c.iv.indexOf(3) >= 0 ? (c.root + 3) % 12 : c.iv.indexOf(4) >= 0 ? (c.root + 4) % 12 : -1;
  const colour = c.iv.filter((x) => x !== 0 && x !== 3 && x !== 4 && x !== 7).map((x) => (c.root + x) % 12);
  const fifth = (c.root + 7) % 12;
  const pick = new Array(n);
  let best = null, bestCost = Infinity;
  const centre = (lo + hi) / 2;
  const seen = new Int8Array(12);
  const isColour = new Int8Array(12);
  for (const pc of colour) isColour[pc] = 1;
  const nCol = colour.length;
  function score() {
    let cost = 0;
    seen.fill(0);
    for (let i = 0; i < n; i++) seen[pick[i] % 12]++;
    if (!seen[c.root] && !seen[c.bass]) cost += 6;
    if (third >= 0 && !seen[third]) cost += 8;
    if (n >= 4) for (let k = 0; k < nCol; k++) if (!seen[colour[k]]) cost += 5;
    for (let k = 0; k < 12; k++) if (seen[k] > 1) cost += (k === c.root || k === fifth) ? 0.5 * (seen[k] - 1) : 4 * (seen[k] - 1);
    if (cost >= bestCost) return cost;
    for (let i = 1; i < n; i++) {
      const iv = pick[i] - pick[i - 1];
      if (pick[i - 1] < 52 && iv < 5) cost += 12;
      if (iv === 1) cost += 2;
      if (iv > 12) cost += (iv - 12) * 1.2;
    }
    const spread = pick[n - 1] - pick[0];
    if (spread > 24) cost += (spread - 24);
    if (prev && prev.length === n) { for (let i = 0; i < n; i++) cost += Math.abs(pick[i] - prev[i]) * 0.6; }
    else { let mean = 0; for (let i = 0; i < n; i++) mean += pick[i]; cost += Math.abs(mean / n - centre) * 0.5; }
    return cost;
  }
  function rec(start, k) {
    if (k === n) { const s = score(); if (s < bestCost) { bestCost = s; best = pick.slice(); } return; }
    for (let i = start; i <= tones.length - (n - k); i++) { pick[k] = tones[i]; rec(i + 1, k + 1); }
  }
  if (tones.length >= n) rec(0, 0);
  if (!best) best = tones.length ? tones.slice(0, n) : [lo];
  return best;
}

// Chord tones in [lo, hi], ascending.
export function tonesIn(sym, lo, hi) {
  const c = chord(sym), out = [];
  for (let m = lo; m <= hi; m++) if (c.pcs.indexOf(m % 12) >= 0) out.push(m);
  return out;
}

// ---------------------------------------------------------------- tune operations

export function beatsOf(notes) { let b = 0; for (const n of notes) b += n[1]; return b; }

export function transpose(notes, k) { return notes.map(([m, d]) => [m === null ? null : m + k, d]); }

export function augment(notes, f) { return notes.map(([m, d]) => [m, d * f]); }

// Map pitch classes (e.g. { 5: 6, 0: 1 } turns D Dorian into D major).
export function remap(notes, map) {
  return notes.map(([m, d]) => {
    if (m === null) return [m, d];
    const pc = m % 12;
    return [map[pc] === undefined ? m : m + (map[pc] - pc), d];
  });
}
export const TO_MAJOR = { 5: 6, 0: 1 };

// Slice by beats [from, to).
export function fragment(notes, from, to) {
  const out = [];
  let b = 0;
  for (const [m, d] of notes) {
    const s = Math.max(b, from), e = Math.min(b + d, to);
    if (e > s + 1e-6) out.push([b < from ? null : m, e - s]);
    b += d;
  }
  return out;
}

// Split a tune into bars of `bpb` beats.
export function bars(notes, bpb) {
  const out = [];
  const total = beatsOf(notes);
  for (let b = 0; b < total - 1e-6; b += bpb) out.push(fragment(notes, b, b + bpb));
  return out;
}

export function octave(notes, k, lo, hi) {
  const out = transpose(notes, 12 * k);
  for (const [m] of out) if (m !== null && (m < lo || m > hi)) return notes;
  return out;
}

// Diatonic sequence: move a fragment by steps within the scale.
export function sequence(notes, steps, sc) { return notes.map(([m, d]) => [m === null ? null : dia(m, steps, sc), d]); }

// Ornaments: grace notes, mordents and turns on longer notes.
export function ornament(notes, sc, rnd, p) {
  const out = [];
  for (let i = 0; i < notes.length; i++) {
    const [m, d] = notes[i];
    if (m === null || d < 1 || rnd() > p) { out.push([m, d]); continue; }
    const r = rnd();
    const up = dia(m, 1, sc), dn = dia(m, -1, sc);
    if (r < 0.4) { out.push([up, 0.25]); out.push([m, d - 0.25]); }                         // grace from above
    else if (r < 0.7) { out.push([m, 0.25]); out.push([dn, 0.25]); out.push([m, d - 0.5]); } // lower mordent
    else if (d >= 2) { out.push([m, 0.25]); out.push([up, 0.25]); out.push([m, 0.25]); out.push([dn, 0.25]); out.push([m, d - 1]); } // turn
    else { out.push([m, d * 0.5]); out.push([up, d * 0.25]); out.push([m, d * 0.25]); }
  }
  return out;
}

// Passing tones: fill a leap of a third with the step between.
export function passing(notes, sc, rnd, p) {
  const out = [];
  for (let i = 0; i < notes.length; i++) {
    const [m, d] = notes[i];
    const nx = notes[i + 1];
    if (m !== null && nx && nx[0] !== null && d >= 1 && rnd() < p) {
      const gap = nx[0] - m;
      if (Math.abs(gap) >= 3 && Math.abs(gap) <= 4) {
        const mid = dia(m, gap > 0 ? 1 : -1, sc);
        out.push([m, d / 2]); out.push([mid, d / 2]);
        continue;
      }
    }
    out.push([m, d]);
  }
  return out;
}

// Rhythmic regrouping: dotted pairs even out, even pairs gain a dot.
export function regroup(notes, rnd, p) {
  const out = notes.map((n) => n.slice());
  for (let i = 0; i + 1 < out.length; i++) {
    const a = out[i], b = out[i + 1];
    if (a[0] === null || b[0] === null || rnd() > p) continue;
    if (a[1] === 1.5 && b[1] === 0.5) { a[1] = 1; b[1] = 1; i++; }
    else if (a[1] === 1 && b[1] === 1) { a[1] = 1.5; b[1] = 0.5; i++; }
  }
  return out;
}

// A varied statement. o: { orn, pass, regroup, sc }
export function vary(notes, rnd, o) {
  const sc = o.sc || SCALES.dorian;
  let n = notes;
  if (o.regroup) n = regroup(n, rnd, o.regroup);
  if (o.pass) n = passing(n, sc, rnd, o.pass);
  if (o.orn) n = ornament(n, sc, rnd, o.orn);
  return n;
}

// Weighted choice avoiding `last`.
export function choose(rnd, weights, last) {
  let total = 0;
  for (const k in weights) if (k !== last) total += weights[k];
  let r = rnd() * total;
  for (const k in weights) {
    if (k === last) continue;
    r -= weights[k];
    if (r <= 0) return k;
  }
  for (const k in weights) if (k !== last) return k;
  return last;
}

export function rpick(rnd, arr) { return arr[Math.floor(rnd() * arr.length) % arr.length]; }

// Four-part chorale under a melody: one chord a bar (or `per` beats), voices
// moving to the nearest chord tone, each below the voice above it.
export function satb(melody, chords, bpb, per) {
  const step = per || bpb / 2;
  const total = beatsOf(melody);
  const parts = [[], [], []];      // alto, tenor, bass
  const ranges = [[57, 74], [50, 67], [41, 57]];
  let prev = [65, 57, 45];
  const melAt = (b) => { let x = 0; for (const [m, d] of melody) { if (b < x + d - 1e-6) return m; x += d; } return null; };
  for (let b = 0; b < total - 1e-6; b += step) {
    const sym = chords[Math.min(chords.length - 1, Math.floor(b / bpb))];
    const c = chord(sym);
    let upper = melAt(b);
    if (upper === null) upper = melAt(b + step / 2) || 76;
    const now = [];
    for (let v = 0; v < 3; v++) {
      const [lo, hi] = ranges[v];
      const cap = Math.min(hi, (v === 0 ? upper : now[v - 1]) - (v === 2 ? 3 : 1));
      let best = null, bd = Infinity;
      for (let m = lo; m <= cap; m++) {
        const pc = m % 12;
        if (v === 2 ? pc !== c.bass : c.pcs.indexOf(pc) < 0) continue;
        let cost = Math.abs(m - prev[v]);
        if (v === 0 && pc === upper % 12) cost += 3;            // avoid doubling the melody
        if (v === 1 && now[0] !== undefined && pc === now[0] % 12) cost += 2;
        if (cost < bd) { bd = cost; best = m; }
      }
      if (best === null) best = Math.max(lo, cap - 2);
      now.push(best);
    }
    for (let v = 0; v < 3; v++) {
      const p = parts[v];
      const last = p[p.length - 1];
      if (last && last[0] === now[v]) last[1] += step; else p.push([now[v], step]);
    }
    prev = now;
  }
  return parts;
}
