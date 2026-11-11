// check-content.mjs: sanity checks for src/content/*.js.
// Run from games/guest-right:  node tools/check-content.mjs
// Errors (exit 1): unresolved ids, dashes, exclamation marks, banned phrases,
// worlds or messages on the Quiet, malformed entries. Warnings: long sign text,
// words that may break the setting's rules (check by eye), American spellings.

import { CAST } from '../src/content/cast.js';
import { PLACES } from '../src/content/places.js';
import { MENUS } from '../src/content/menus.js';
import { ITEMS } from '../src/content/items.js';
import { SIGNS } from '../src/content/signs.js';
import { LEDGER } from '../src/content/ledger.js';
import { DISCOVERIES } from '../src/content/discoveries.js';
import { CHATTER } from '../src/content/chatter.js';
import { TIPS } from '../src/content/tips.js';
import { CUSTOMS } from '../src/content/customs.js';

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const placeIds = new Set(Object.keys(PLACES));
const castIds = new Set(Object.keys(CAST));
const AREAS = ['station', 'candlewick', 'hollow', 'terraces', 'spindle', 'city'];
const DAYS = ['day1', 'day2', 'day3'];
const TIMES = ['morning', 'midday', 'evening', 'night'];
const OTHER_TAGS = ['kids', 'elders', 'any'];
const HEX = /^#[0-9a-f]{6}$/i;

const BANNED = ['testament to', 'tapestry', 'bustling', 'nestled', 'whispers of', 'symphony of',
  'vibrant', 'hum of life', 'in a world where', 'delve', 'realm', 'beacon', 'labyrinthine', 'a dance of',
  'not just', 'not only'];
// Words that often mean a setting rule is broken. Warnings only: some uses are fine
// ("full sun" is the docs' phrase; "no wind here" says what is absent).
const RISKY = [/\bsun\b(?!line)/i, /\bsky\b/i, /\bweather\b/i, /\bseasons?\b/i, /\bwinter\b/i, /\bsummer\b/i,
  /\brain\b/i, /\bclouds?\b/i, /\bwind\b/i, /\bstorm/i, /\bcandles?\b/i, /\bfire\b/i, /\bflames?\b/i, /\bsmoke\b/i,
  /\bbirds?\b/i, /\bbees?\b/i, /\binsects?\b/i, /\bdogs?\b/i, /\bcats?\b/i, /\bhorses?\b/i, /\bfish\b/i, /\bpets?\b/i,
  /\bmoney\b/i, /\bcoins?\b/i, /\bdollars?\b/i, /\bgod\b/i, /\bprayers?\b/i, /\bchurch\b/i, /\bearth\b/i];
const AMERICAN = [/\bcolor/i, /\bgray\b/i, /\bneighbor/i, /\bfavorite/i, /\bcenter\b/i, /\btheater\b/i,
  /\bflavor/i, /\bhonor/i, /\bmeters?\b/i, /\bliters?\b/i, /\bcozy\b/i, /\bpajama/i];

// Walk every string in a value, calling fn(path, string).
function walk(value, path, fn) {
  if (typeof value === 'string') fn(path, value);
  else if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`, fn));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`, fn);
  }
}

// Keys whose strings are not player-facing text (ids, colours, tags).
const NON_TEXT_KEYS = /\.(id|place|keeper|home|work|from|icon|kind|tag|tags|colour|palette|skin|hair|hairStyle|top|lining|bottom|apron|accent|build|timbre|dir)(\[\d+\])?$/;

function checkText(path, s) {
  if (NON_TEXT_KEYS.test(path) || /\.palette\[/.test(path) || /\.tags\[/.test(path)) return;
  if (/[—–]/.test(s)) err(path, `em or en dash: "${s}"`);
  if (s.includes('!')) err(path, `exclamation mark: "${s}"`);
  const low = s.toLowerCase();
  for (const b of BANNED) if (low.includes(b)) err(path, `banned phrase "${b}": "${s}"`);
  for (const r of RISKY) if (r.test(s)) warn(path, `check the setting (${r.source}): "${s}"`);
  for (const r of AMERICAN) if (r.test(s)) warn(path, `American spelling? (${r.source}): "${s}"`);
}

const files = { CAST, PLACES, MENUS, ITEMS, SIGNS, LEDGER, DISCOVERIES, CHATTER, TIPS, CUSTOMS };
for (const [name, data] of Object.entries(files)) walk(data, name, checkText);
walk(PLACES.neighbours, 'PLACES.neighbours', checkText);

// Cast.
for (const [id, p] of Object.entries(CAST)) {
  const at = `CAST.${id}`;
  for (const f of ['name', 'short', 'role', 'line']) if (typeof p[f] !== 'string' || !p[f]) err(at, `missing ${f}`);
  if (typeof p.age !== 'number' || p.age < 6 || p.age > 104) err(at, `age out of range: ${p.age}`);
  for (const f of ['home', 'work']) {
    if (!(f in p)) err(at, `missing ${f}`);
    else if (p[f] !== null && !placeIds.has(p[f])) err(at, `${f} "${p[f]}" is not a place id`);
  }
  if ((p.home === null || p.work === null) && !p.from && p.work !== null && p.home === null) warn(at, 'home is null with no from');
  if (!p.look) err(at, 'missing look');
  else {
    for (const f of ['skin', 'hair', 'top', 'lining', 'bottom', 'apron']) {
      if (p.look[f] !== undefined && !HEX.test(p.look[f])) err(at, `look.${f} not a hex colour`);
    }
    if (!['slight', 'medium', 'broad', 'child', 'elder'].includes(p.look.build)) err(at, `bad build ${p.look.build}`);
    if (!['short', 'tied', 'long', 'bun', 'cropped', 'bald', 'cap', 'scarf'].includes(p.look.hairStyle)) err(at, `bad hairStyle ${p.look.hairStyle}`);
    if (p.look.accent && !['kerchief', 'apron', 'satchel', 'shawl', 'spectacles', 'cane', 'hat'].includes(p.look.accent)) err(at, `bad accent ${p.look.accent}`);
  }
  if (!p.voice || typeof p.voice.pitch !== 'number') err(at, 'missing voice');
}

// Places.
for (const [id, p] of Object.entries(PLACES)) {
  const at = `PLACES.${id}`;
  for (const f of ['name', 'area', 'kind', 'sub', 'blurb']) if (typeof p[f] !== 'string' || !p[f]) err(at, `missing ${f}`);
  if (typeof p.sign !== 'string') err(at, 'sign must be a string (may be empty)');
  if (!AREAS.includes(p.area)) err(at, `bad area ${p.area}`);
  if (p.keeper && !castIds.has(p.keeper)) err(at, `keeper "${p.keeper}" is not a cast id`);
}
if (!Array.isArray(PLACES.neighbours) || PLACES.neighbours.length < 6) err('PLACES.neighbours', 'expected 6 to 8 neighbours');

// Menus.
for (const [id, m] of Object.entries(MENUS)) {
  const at = `MENUS.${id}`;
  if (!m.title) err(at, 'missing title');
  if (!placeIds.has(m.place)) err(at, `place "${m.place}" is not a place id`);
  const seen = new Set();
  for (const it of m.items || []) {
    const iat = `${at}.${it.id}`;
    if (!it.id || seen.has(it.id)) err(iat, 'missing or duplicate item id');
    seen.add(it.id);
    if (!it.name || !it.desc) err(iat, 'missing name or desc');
    if (typeof it.price !== 'number' || it.price < 0) err(iat, 'price must be a number >= 0');
    if (it.days && !it.days.every((d) => [1, 2, 3].includes(d))) err(iat, 'days must be 1, 2 or 3');
    if (it.hours && (it.hours.length !== 2 || it.hours[0] >= it.hours[1])) err(iat, 'bad hours');
    if (it.colour && !HEX.test(it.colour)) err(iat, 'colour not hex');
  }
}

// Items.
for (const [id, it] of Object.entries(ITEMS)) {
  if (!it.name || !it.desc || !it.icon) err(`ITEMS.${id}`, 'missing name, desc or icon');
  if (it.from && !castIds.has(it.from)) err(`ITEMS.${id}`, `from "${it.from}" is not a cast id`);
}

// Signs.
const SIGN_KINDS = ['fascia', 'hanging', 'chalk', 'poster', 'notice', 'street', 'plate', 'label', 'board', 'banner'];
for (const [id, s] of Object.entries(SIGNS)) {
  const at = `SIGNS.${id}`;
  if (!SIGN_KINDS.includes(s.kind)) err(at, `bad kind ${s.kind}`);
  const usesLines = ['chalk', 'poster', 'notice', 'board'].includes(s.kind);
  if (usesLines && (!s.title || !Array.isArray(s.lines))) err(at, 'needs title and lines');
  if (!usesLines && !s.text) err(at, 'needs text');
  const head = s.title || s.text || '';
  if (head.length > 24) warn(at, `title over 24 characters (${head.length})`);
  for (const l of [...(s.lines || []), ...(s.sub ? [s.sub] : [])]) if (l.length > 38) warn(at, `line over 38 characters (${l.length}): "${l}"`);
  if (s.kind === 'poster' && (!Array.isArray(s.palette) || s.palette.length < 2 || !s.palette.every((c) => HEX.test(c)))) err(at, 'poster needs a palette of 2 or 3 hex colours');
  if (s.days && !s.days.every((d) => [1, 2, 3].includes(d))) err(at, 'days must be 1, 2 or 3');
}

// Ledger.
const t = LEDGER.totals.bookingDay;
const canon = { shares: 200000000, people: 194060000, margin: 5940000, places: 90000000, heldByDrum: 2673000, born: 1626000, died: 1617000, guests: 410000 };
for (const [k, v] of Object.entries(canon)) if (t[k] !== v) err('LEDGER.totals.bookingDay', `${k} is ${t[k]}, canon ${v}`);
for (const day of ['thursday', 'dayBefore', 'bookingDay']) {
  const d = LEDGER.totals[day];
  if (d.shares - d.people !== d.margin) err(`LEDGER.totals.${day}`, 'margin is not shares minus people');
}
const allNames = [...LEDGER.names.flatMap((n) => [n.born, n.for]), ...LEDGER.householders.flatMap((h) => [h.holder, h.after])];
const nameSeen = new Set();
for (const n of allNames) { if (nameSeen.has(n)) err('LEDGER', `name used twice: ${n}`); nameSeen.add(n); }
if (!LEDGER.householders.some((h) => h.holder === 'Marit Vell')) err('LEDGER.householders', 'Marit Vell missing');

// Discoveries.
for (const [id, d] of Object.entries(DISCOVERIES)) {
  const at = `DISCOVERIES.${id}`;
  for (const f of ['title', 'text', 'where', 'hint', 'place']) if (!d[f]) err(at, `missing ${f}`);
  if (!placeIds.has(d.place)) err(at, `place "${d.place}" is not a place id`);
  else if (PLACES[d.place].name !== d.where) warn(at, `where "${d.where}" differs from the place name "${PLACES[d.place].name}"`);
  if (d.title && d.title[0] !== d.title[0].toUpperCase()) warn(at, 'title should start with a capital');
}

// Chatter.
const TAGS = new Set([...placeIds, ...AREAS, ...DAYS, ...TIMES, ...OTHER_TAGS]);
let chatterLines = 0;
CHATTER.forEach((e, i) => {
  const at = `CHATTER[${i}]`;
  if (!Array.isArray(e.tags) || !e.tags.length) err(at, 'needs tags');
  for (const tag of e.tags || []) if (!TAGS.has(tag)) err(at, `unknown tag "${tag}"`);
  const days = (e.tags || []).filter((x) => DAYS.includes(x));
  const quiet = days.length === 0 || days.includes('day2');
  for (const l of e.lines || []) {
    chatterLines++;
    if (Array.isArray(l) && l.length !== 2) err(at, 'an exchange must have two lines');
    const text = Array.isArray(l) ? l.join(' ') : l;
    if (quiet && /\b(messages?|messaged|worlds?)\b/i.test(text)) err(at, `can be heard on the Quiet but mentions a message or a world: "${text}"`);
    const longest = Array.isArray(l) ? Math.max(...l.map((x) => x.length)) : l.length;
    if (longest > 100) warn(at, `long line (${longest}): "${text}"`);
  }
});

// Customs and tips.
CUSTOMS.forEach((c, i) => {
  if (!c.term || !c.text) err(`CUSTOMS[${i}]`, 'needs term and text');
  const sentences = (c.text.match(/[.]( |$)/g) || []).length;
  if (sentences > 2) warn(`CUSTOMS[${i}] ${c.term}`, `${sentences} sentences (two at most)`);
});
TIPS.forEach((tip, i) => { if (typeof tip !== 'string' || !tip) err(`TIPS[${i}]`, 'empty tip'); });

// Report.
const count = (o) => (Array.isArray(o) ? o.length : Object.keys(o).length);
const menuItems = Object.values(MENUS).reduce((n, m) => n + m.items.length, 0);
console.log('Counts');
console.log(`  cast         ${count(CAST)}`);
console.log(`  places       ${count(PLACES)} (+ ${PLACES.neighbours.length} neighbours)`);
console.log(`  menus        ${count(MENUS)} venues, ${menuItems} items`);
console.log(`  items        ${count(ITEMS)}`);
console.log(`  signs        ${count(SIGNS)} (${Object.values(SIGNS).filter((s) => s.kind === 'poster').length} posters)`);
console.log(`  ledger       ${LEDGER.names.length} names, ${LEDGER.householders.length} householders`);
console.log(`  discoveries  ${count(DISCOVERIES)}`);
console.log(`  chatter      ${CHATTER.length} entries, ${chatterLines} lines and exchanges`);
console.log(`  tips         ${count(TIPS)}`);
console.log(`  customs      ${count(CUSTOMS)}`);
if (warnings.length) {
  console.log(`\nWarnings (${warnings.length})`);
  for (const w of warnings) console.log('  ' + w);
}
if (errors.length) {
  console.log(`\nErrors (${errors.length})`);
  for (const e of errors) console.log('  ' + e);
  process.exit(1);
}
console.log('\nNo errors.');
