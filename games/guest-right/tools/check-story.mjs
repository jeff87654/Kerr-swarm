// check-story.mjs: checks the story's dialogue, scenes and threads.
// Run from games/guest-right:  node tools/check-story.mjs
// Errors (exit 1): unknown cast ids, items, threads, steps, discoveries, customs or hooks; jumps to missing labels;
// once nodes without a unique id; dashes, exclamation marks and banned phrases.
// Warnings: long lines, American spellings, words that may break the setting, people with nothing repeatable to say.
import { readFileSync } from 'node:fs';
import { CAST } from '../src/content/cast.js';
import { ITEMS } from '../src/content/items.js';
import { DISCOVERIES } from '../src/content/discoveries.js';
import { CUSTOMS } from '../src/content/customs.js';
import { PLACES } from '../src/content/places.js';
import { THREADS } from '../src/content/threads.js';
import { TALK_MARIT } from '../src/content/dialogue/marit.js';
import { TALK_JORY } from '../src/content/dialogue/jory.js';
import { TALK_OONA } from '../src/content/dialogue/oona.js';
import { TALK_HALL } from '../src/content/dialogue/hall.js';
import { TALK_STATION } from '../src/content/dialogue/station.js';
import { TALK_SHOPS } from '../src/content/dialogue/shops.js';
import { TALK_BLOCK } from '../src/content/dialogue/block.js';
import { TALK_HOLLOW } from '../src/content/dialogue/hollow.js';
import { SCENES, OVERHEARD } from '../src/content/dialogue/scenes.js';

const TABLES = { marit: TALK_MARIT, jory: TALK_JORY, oona: TALK_OONA, hall: TALK_HALL, station: TALK_STATION, shops: TALK_SHOPS, block: TALK_BLOCK, hollow: TALK_HOLLOW };
const errors = [], warnings = [];
const E = (w, m) => errors.push(w + ': ' + m), W = (w, m) => warnings.push(w + ': ' + m);

// hooks named in src/places/story.js
const storySrc = readFileSync(new URL('../src/places/story.js', import.meta.url), 'utf8');
const HOOKS = new Set([...storySrc.matchAll(/H\['([a-z-]+)'\]\s*=/g)].map((m) => m[1]));
const THREAD = Object.fromEntries(THREADS.map((t) => [t.id, t]));
const CUSTOM_TERMS = new Set(CUSTOMS.map((c) => c.term));
const STEP_KEYS = ['t', 's', 'choice', 'prompt', 'label', 'go', 'end', 'set', 'clear', 'give', 'take', 'pay', 'what', 'else', 'earn', 'thread', 'step', 'start', 'done', 'found', 'meet', 'custom', 'time', 'call', 'toast', 'banner', 'name'];
const WHEN_KEYS = ['day', 'days', 'flag', 'flags', 'notFlag', 'has', 'hours', 'place'];
const ZONE_EXTRA = new Set(['story']);

// ---------------------------------------------------------------- voice
const BANNED = ['testament to', 'tapestry', 'bustling', 'nestled', 'whispers of', 'symphony of', 'vibrant', 'hum of life',
  'in a world where', 'delve', 'realm', 'beacon', 'labyrinthine', 'a dance of', 'not just', 'not only'];
const AMERICAN = [/\bcolor/i, /\bgray\b/i, /\bneighbor/i, /\bfavorite/i, /\bcenter\b/i, /\btheater\b/i, /\bmeter\b/i, /\bliter\b/i, /\bhonor/i, /\bflavor/i, /\barmor/i, /\bcozy\b/i, /\bmom\b/i, /\bcookie/i, /\bpajama/i, /\bjewelry\b/i, /\btraveler/i, /\bcanceled\b/i];
const RISKY = [/\bsky\b/i, /\bweather\b/i, /\bseasons?\b/i, /\bwinter\b/i, /\bsummer\b/i, /\brain\b/i, /\bclouds?\b/i, /\bwind\b/i,
  /\bstorm/i, /\bcandles?\b/i, /\bfire\b/i, /\bflames?\b/i, /\bsmoke\b/i, /\bbirds?\b/i, /\bbees?\b/i, /\binsects?\b/i, /\bdogs?\b/i,
  /\bcats?\b/i, /\bhorses?\b/i, /\bfish\b/i, /\bpets?\b/i, /\bmoney\b/i, /\bcoins?\b/i, /\bdollars?\b/i, /\bgod\b/i, /\bprayers?\b/i,
  /\bchurch\b/i, /\bearth\b/i, /\bscreens?\b/i, /\bsunrise\b/i, /\bsunset\b/i, /\bstars?\b/i];
let lines = 0, words = 0, long = 0;
function voice(where, s, count) {
  if (typeof s !== 'string') { E(where, 'text is not a string'); return; }
  if (count) { lines++; words += s.split(/\s+/).filter(Boolean).length; }
  if (/[—–]/.test(s)) E(where, 'dash in ' + JSON.stringify(s.slice(0, 80)));
  if (s.indexOf('!') >= 0) E(where, 'exclamation mark in ' + JSON.stringify(s.slice(0, 80)));
  const low = s.toLowerCase();
  for (const b of BANNED) if (low.indexOf(b) >= 0) E(where, 'banned phrase "' + b + '" in ' + JSON.stringify(s.slice(0, 80)));
  for (const r of AMERICAN) if (r.test(s)) W(where, 'American spelling? ' + JSON.stringify(s.slice(0, 80)));
  for (const r of RISKY) if (r.test(s)) W(where, 'check the setting: ' + r.source + ' in ' + JSON.stringify(s.slice(0, 90)));
  if (count && s.length > 140) { long++; W(where, 'long line (' + s.length + '): ' + JSON.stringify(s.slice(0, 60) + '...')); }
}

// ---------------------------------------------------------------- scripts
const ids = new Map();
function checkScript(where, script, owner) {
  if (!Array.isArray(script)) { E(where, 'script is not a list'); return; }
  const labels = new Set(script.filter((x) => x && x.label).map((x) => x.label));
  const jumpTo = (w, l) => { if (!labels.has(l)) E(w, 'no label "' + l + '" for a jump'); };
  script.forEach((x, i) => {
    const w = where + ' #' + i;
    if (!x || typeof x !== 'object') { E(w, 'step is not an object'); return; }
    for (const k of Object.keys(x)) if (STEP_KEYS.indexOf(k) < 0) E(w, 'unknown step key "' + k + '"');
    if (x.t !== undefined) {
      if (typeof x.t === 'function') { for (const d of [1, 2, 3, 4]) { let v = ''; try { v = String(x.t({ clock: { day: d, hours: 12 }, flags: {}, inv: { has: () => false } })); } catch (e) { E(w, 'a line made by a function threw: ' + e.message); } voice(w, v, true); } }
      else voice(w, x.t, true);
      const s = x.s || owner;
      if (s && s !== 'you' && !CAST[s] && /^[a-z][a-z-]*$/.test(s)) E(w, 'speaker "' + s + '" is not in CAST');
    }
    if (x.choice) {
      if (!Array.isArray(x.choice) || !x.choice.length) E(w, 'empty choice');
      if (x.choice.length > 4) W(w, 'more than four choices');
      for (const o of x.choice) {
        voice(w + ' choice', o.t, false);
        if (o.go) jumpTo(w + ' choice', o.go);
        if (o.need && typeof o.need !== 'string' && typeof o.need !== 'function') E(w, 'choice need is neither a flag nor a function');
        if (o.cost !== undefined && typeof o.cost !== 'number') E(w, 'choice cost is not a number');
      }
    }
    if (x.prompt) voice(w + ' prompt', x.prompt, false);
    if (x.go) jumpTo(w, x.go);
    if (x.else) jumpTo(w, x.else);
    if (x.give && !ITEMS[x.give]) E(w, 'no item "' + x.give + '"');
    if (x.take && !ITEMS[x.take]) E(w, 'no item "' + x.take + '"');
    if (x.pay !== undefined && typeof x.pay !== 'number') E(w, 'pay is not a number');
    if (x.thread) {
      const t = THREAD[x.thread];
      if (!t) E(w, 'no thread "' + x.thread + '"');
      else if (x.step !== undefined && !(Number.isInteger(x.step) && x.step >= 0 && x.step < t.steps.length)) E(w, 'thread "' + x.thread + '" has no step ' + x.step);
      if (x.step === undefined && !x.start && !x.done) E(w, 'thread step does nothing');
      if (x.done !== undefined && x.done !== true) E(w, 'thread done must be true');
    }
    if (x.found && !DISCOVERIES[x.found]) E(w, 'no discovery "' + x.found + '"');
    if (x.meet && !CAST[x.meet]) E(w, 'no cast "' + x.meet + '" to meet');
    if (x.custom && !CUSTOM_TERMS.has(x.custom)) E(w, 'no custom "' + x.custom + '"');
    if (x.call && typeof x.call === 'string' && !HOOKS.has(x.call)) E(w, 'no hook "' + x.call + '" in src/places/story.js');
    if (x.call && typeof x.call !== 'string' && typeof x.call !== 'function') E(w, 'call is neither a hook name nor a function');
    if (x.toast) voice(w + ' toast', x.toast, false);
    if (x.banner) { if (!Array.isArray(x.banner)) E(w, 'banner is not [title, sub]'); else x.banner.forEach((b) => voice(w + ' banner', b, false)); }
    if (x.set) [].concat(x.set).forEach((f) => { if (typeof f !== 'string') E(w, 'set is not a flag name'); });
  });
}
function checkWhen(where, wn) {
  if (!wn || typeof wn === 'function') return;
  for (const k of Object.keys(wn)) if (WHEN_KEYS.indexOf(k) < 0) E(where, 'unknown when key "' + k + '"');
  if (wn.has && !ITEMS[wn.has]) E(where, 'when.has: no item "' + wn.has + '"');
  if (wn.place && !PLACES[wn.place] && !ZONE_EXTRA.has(wn.place)) W(where, 'when.place "' + wn.place + '" is not in places.js');
  if (wn.hours && !(Array.isArray(wn.hours) && wn.hours.length === 2 && wn.hours[0] < wn.hours[1])) E(where, 'when.hours must be [from, to]');
}

// ---------------------------------------------------------------- the tables
const perPerson = {};
for (const file in TABLES) {
  const table = TABLES[file];
  for (const id in table) {
    const where0 = file + '.js ' + id;
    if (!CAST[id]) E(where0, 'not a cast id');
    const nodes = table[id];
    if (!Array.isArray(nodes)) { E(where0, 'nodes are not a list'); continue; }
    perPerson[id] = (perPerson[id] || []).concat(nodes);
    nodes.forEach((n, k) => {
      const where = where0 + ' [' + (n.id || k) + ']';
      if (n.once && !n.id) E(where, 'a once node needs an id');
      if (n.id) { if (ids.has(n.id)) E(where, 'duplicate node id (also in ' + ids.get(n.id) + ')'); ids.set(n.id, where0); }
      if (n.priority !== undefined && typeof n.priority !== 'number') E(where, 'priority is not a number');
      checkWhen(where, n.when);
      checkScript(where, n.script, id);
    });
  }
}
for (const k in SCENES) checkScript('scenes.js ' + k, SCENES[k], k === 'signIn' ? 'sefa' : k === 'blockCourt' ? 'halima' : k === 'ledgerReading' ? 'agathe' : 'you');
for (const set in OVERHEARD) for (const ph in OVERHEARD[set]) OVERHEARD[set][ph].forEach((L, i) => {
  const w = 'scenes.js OVERHEARD.' + set + '.' + ph + ' #' + i;
  if (!Array.isArray(L) || L.length !== 2) { E(w, 'not [speaker, line]'); return; }
  if (/^[a-z][a-z-]*$/.test(L[0]) && !CAST[L[0]] && L[0] !== 'you') E(w, 'speaker "' + L[0] + '" is not in CAST');
  voice(w, L[1], true);
});
for (const t of THREADS) {
  const w = 'threads.js ' + t.id;
  if (!t.id || !t.title || !t.text || !Array.isArray(t.steps) || !t.steps.length) E(w, 'thread needs id, title, text and steps');
  voice(w, t.title, false); voice(w, t.text, false); (t.steps || []).forEach((s) => voice(w + ' step', s, false));
}
if (new Set(THREADS.map((t) => t.id)).size !== THREADS.length) E('threads.js', 'duplicate thread ids');

// ---------------------------------------------------------------- does everyone always have something to say?
const mock = (d, h) => ({ clock: { day: d, hours: h }, flags: {}, inv: { has: () => false, count: () => 0 }, zone: null, journal: null, story: null, wallet: { kwh: 21.6, can: () => true } });
function ok(n, g) {
  const w = n.when; if (!w) return true;
  if (typeof w === 'function') { try { return !!w(g); } catch (e) { return false; } }
  const c = g.clock;
  if (w.day !== undefined && c.day !== w.day) return false;
  if (w.days && w.days.indexOf(c.day) < 0) return false;
  if (w.flag || w.flags || w.has || w.place) return false;
  if (w.hours && !(c.hours >= w.hours[0] && c.hours < w.hours[1])) return false;
  return true;
}
const silent = {};
for (const id in CAST) {
  if (CAST[id].offstage) continue;
  const nodes = perPerson[id] || [];
  if (!nodes.length) { W('cast ' + id, 'has no conversation nodes'); continue; }
  for (let d = 1; d <= 4; d++) for (const h of [7, 10, 13, 16, 19, 22]) {
    if (!nodes.some((n) => !n.once && ok(n, mock(d, h)))) (silent[id] = silent[id] || []).push('day ' + d + ' ' + h + ':00');
  }
}
for (const id in silent) W('cast ' + id, 'nothing repeatable to say at ' + silent[id].slice(0, 6).join(', ') + (silent[id].length > 6 ? ' and ' + (silent[id].length - 6) + ' more' : '') + ' (falls back to the cast line)');

// ---------------------------------------------------------------- report
const counts = Object.keys(perPerson).sort().map((id) => id + ' ' + perPerson[id].length);
const total = Object.values(perPerson).reduce((a, n) => a + n.length, 0);
console.log('Nodes per person: ' + counts.join(', '));
console.log('People with nodes: ' + Object.keys(perPerson).length + ' of ' + Object.keys(CAST).filter((k) => !CAST[k].offstage).length);
console.log('Nodes: ' + total + '   scenes: ' + Object.keys(SCENES).length + '   threads: ' + THREADS.length + ' (' + THREADS.map((t) => t.id + ' ' + t.steps.length).join(', ') + ')');
console.log('Lines: ' + lines + '   words: ' + words + '   lines over 140 characters: ' + long);
console.log('Hooks in story.js: ' + [...HOOKS].join(', '));
if (process.argv.indexOf('--quiet') < 0) for (const w of warnings) console.log('warn  ' + w);
for (const e of errors) console.log('ERROR ' + e);
console.log(errors.length + ' errors, ' + warnings.length + ' warnings');
process.exit(errors.length ? 1 : 0);
