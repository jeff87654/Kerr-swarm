// Story machinery: the journal (threads, things found, people met, customs seen, cards), what the player carries,
// conversations written as small scripts, and saving. The words live in src/content/; this file only runs them.
import { ITEMS } from '../content/items.js';
import { CAST } from '../content/cast.js';
import { DISCOVERIES } from '../content/discoveries.js';
import { CUSTOMS } from '../content/customs.js';

// A conversation node (src/content/dialogue/*.js exports arrays of these, keyed by cast id):
//   { id, when: { day, days: [..], flag, notFlag, has (item), hours: [from, to], place (zone place id) } | (game) => bool,
//     priority (higher wins), once: true, script: [ steps ] }
// Steps:
//   { s: 'marit' | 'you' | 'Name', t: 'A line.' }           a line (s defaults to the node's owner; t may be (game) => 'A line.')
//   { choice: [{ t: 'What you say.', go: 'label', set: 'flag', need: 'flag' | (game) => bool, cost: 1.77 }] }
//   { label: 'name' }   { go: 'label' }   { end: true }
//   { set: 'flag' | ['a', 'b'] }   { clear: 'flag' }   { give: 'item' }   { take: 'item' }
//   { pay: 1.77, what: 'Ramen', else: 'label' }             spend from the wallet; jump to else when short
//   { earn: 6, what: 'An hour at the pass' }
//   { thread: 'id', step: 1 } (mark a step done)   { thread: 'id', start: true }   { thread: 'id', done: true }
//   { found: 'discovery id' }   { meet: 'cast id' }   { custom: 'term' }
//   { time: { add: 1.5 } | { to: 13 } }                      move the clock (hours)
//   { call: (game) => any }                                   run something (may be async)
//   { toast: 'text' }   { banner: ['Title', 'sub'] }
export function setupStory(game) {
  const save = game.save;
  const st = Object.assign({ flags: {}, items: {}, found: {}, met: {}, customs: {}, threads: {}, cards: [], said: {} }, save.get('story', null));
  game.flags = st.flags;
  const persist = () => { save.set('story', st); };
  const speaker = (id) => { const c = CAST[id]; if (!c) return { name: id === 'you' ? 'You' : id, colour: '#d9c7a6' }; return { name: c.short || c.name, colour: (c.look && c.look.top) || '#d9c7a6', id }; };

  // ---- what you carry
  game.inv = {
    has: (id) => !!st.items[id], count: (id) => st.items[id] || 0,
    give(id, n = 1, quiet) { st.items[id] = (st.items[id] || 0) + n; persist(); const it = ITEMS[id]; if (!quiet && game.ui && it) game.ui.toast(it.name, { kind: 'gain' }); game.events.emit('inv', id); },
    take(id, n = 1) { if (!st.items[id]) return false; st.items[id] = Math.max(0, st.items[id] - n); if (!st.items[id]) delete st.items[id]; persist(); game.events.emit('inv', id); return true; },
    list: () => Object.keys(st.items).map((id) => Object.assign({ id, n: st.items[id] }, ITEMS[id])),
  };

  // ---- the journal
  const THREADS = {};          // id -> { id, title, text, steps: [text...] } registered by the story content
  const J = game.journal = {
    defineThread(t) { THREADS[t.id] = t; },
    start(id) { if (!THREADS[id] || st.threads[id]) return; st.threads[id] = { steps: {}, done: false, t: Date.now() }; persist(); if (game.ui) { game.ui.toast(THREADS[id].title, { kind: 'thread' }); game.ui.hud.thread(J.current()); } if (game.audio) game.audio.ui('thread'); },
    step(id, i) { if (!THREADS[id]) return; if (!st.threads[id]) J.start(id); if (st.threads[id].steps[i]) return; st.threads[id].steps[i] = true; st.threads[id].t = Date.now(); persist(); if (game.ui) game.ui.hud.thread(J.current()); },
    // bring a thread to the front: its next step is the line under the compass
    focus(id) { if (!st.threads[id] || st.threads[id].done) return; st.threads[id].t = Date.now() + 1; persist(); if (game.ui) game.ui.hud.thread(J.current()); },
    done(id) { if (!THREADS[id]) return; if (!st.threads[id]) J.start(id); if (st.threads[id].done) return; st.threads[id].done = true; persist(); if (game.ui) { game.ui.toast(THREADS[id].title + ': done', { kind: 'thread' }); game.ui.hud.thread(J.current()); } },
    isDone: (id) => !!(st.threads[id] && st.threads[id].done), started: (id) => !!st.threads[id],
    // the line shown under the compass: the next undone step of the open thread you last started or moved along.
    // A thread whose next step can only wait (THREADS[id].later lists those steps) gives way to any other.
    current() {
      let best = null, parked = null;
      for (const id in st.threads) {
        const s = st.threads[id]; if (s.done || !THREADS[id]) continue;
        const t = THREADS[id], i = t.steps.findIndex((x, k) => !s.steps[k]);
        if (t.later && t.later.indexOf(i) >= 0) { if (!parked || s.t > st.threads[parked].t) parked = id; }
        else if (!best || s.t > st.threads[best].t) best = id;
      }
      best = best || parked;
      if (!best) return null; const t = THREADS[best]; const i = t.steps.findIndex((x, k) => !st.threads[best].steps[k]);
      return i >= 0 ? t.steps[i] : t.title;
    },
    find(id) { if (st.found[id] || !DISCOVERIES[id]) return false; st.found[id] = true; persist(); const d = DISCOVERIES[id]; if (game.ui) game.ui.card({ kicker: 'Found', title: d.title, text: d.text, dur: 9 }); if (game.audio) game.audio.ui('found'); game.events.emit('found', id); return true; },
    meet(id) { if (st.met[id] || !CAST[id]) return; st.met[id] = true; persist(); },
    custom(term) { if (!st.customs[term]) { st.customs[term] = true; persist(); } },
    addCard(c) { st.cards.push(c); if (st.cards.length > 24) st.cards.shift(); persist(); },
    // what the journal screens read
    threads: () => Object.keys(st.threads).filter((id) => THREADS[id]).sort((a, b) => st.threads[b].t - st.threads[a].t).map((id) => ({ id, title: THREADS[id].title, text: THREADS[id].text, done: st.threads[id].done, steps: THREADS[id].steps.map((text, k) => ({ text, done: !!st.threads[id].steps[k] })) })),
    found: () => Object.keys(DISCOVERIES).map((id) => ({ id, title: DISCOVERIES[id].title, text: DISCOVERIES[id].text, where: DISCOVERIES[id].where, hint: DISCOVERIES[id].hint, found: !!st.found[id] })),
    people: () => Object.keys(CAST).filter((id) => st.met[id]).map((id) => ({ id, name: CAST[id].name, role: CAST[id].role, line: CAST[id].line, met: true, colour: (CAST[id].look && CAST[id].look.top) || '#d9c7a6' })),
    customs: () => CUSTOMS.map((c) => ({ term: c.term, text: c.text, seen: !!st.customs[c.term] })),
    cards: () => st.cards.slice(),
    counts: () => ({ found: Object.keys(st.found).length, of: Object.keys(DISCOVERIES).length }),
  };

  // ---- conversations
  const NODES = {};            // cast id -> [nodes]
  const HOOKS = {};            // name -> function, for { call: 'name' }
  const ok = (w) => {
    if (!w) return true; if (typeof w === 'function') return !!w(game);
    const c = game.clock;
    if (w.day !== undefined && c.day !== w.day) return false;
    if (w.days && w.days.indexOf(c.day) < 0) return false;
    if (w.flag && !st.flags[w.flag]) return false;
    if (w.flags && w.flags.some((f) => !st.flags[f])) return false;
    if (w.notFlag && st.flags[w.notFlag]) return false;
    if (w.has && !st.items[w.has]) return false;
    if (w.hours && !(c.hours >= w.hours[0] && c.hours < w.hours[1])) return false;
    if (w.place && !(game.zone && (game.zone.place === w.place || game.zone.id === w.place))) return false;
    return true;
  };
  const run = async (owner, node) => {
    const sc = node.script; const labels = {}; sc.forEach((x, i) => { if (x.label) labels[x.label] = i; });
    game.busy++; if (game.audio) game.audio.duck(0.5, 0.4);
    try {
      let i = 0, guard = 0;
      while (i < sc.length && guard++ < 500) {
        const x = sc[i]; i++;
        if (x.t !== undefined) {
          const who = speaker(x.s || owner); const c = CAST[x.s || owner];
          const line = typeof x.t === 'function' ? String(x.t(game)) : x.t;
          if (game.ui) await game.ui.say(who, [line], { onChar: (ch) => { if (game.audio && c && c.voice) game.audio.voice(c.voice, ch); else if (game.audio && (x.s === 'you')) game.audio.voice({ pitch: 1.1, speed: 1, timbre: 'bright' }, ch); } });
        } else if (x.choice) {
          const opts = x.choice.filter((o) => !o.need || (typeof o.need === 'function' ? o.need(game) : st.flags[o.need]));
          let pick = null;
          if (game.ui) pick = await game.ui.choose(speaker(owner), x.prompt || '', opts.map((o, k) => ({ label: o.t, value: k, cost: o.cost, disabled: o.cost && !game.wallet.can(o.cost) })));
          const o = pick === null || pick === undefined ? opts[opts.length - 1] : opts[pick];
          if (o) { if (o.set) [].concat(o.set).forEach((f) => { st.flags[f] = true; }); if (o.go && labels[o.go] !== undefined) i = labels[o.go]; else if (o.end) break; }
        } else if (x.go) { if (labels[x.go] !== undefined) i = labels[x.go]; }
        else if (x.end) break;
        else if (x.set) [].concat(x.set).forEach((f) => { st.flags[f] = true; });
        else if (x.clear) [].concat(x.clear).forEach((f) => { delete st.flags[f]; });
        else if (x.give) game.inv.give(x.give);
        else if (x.take) game.inv.take(x.take);
        else if (x.pay !== undefined) { if (!game.wallet.spend(x.pay, x.what)) { if (x.else && labels[x.else] !== undefined) i = labels[x.else]; } }
        else if (x.earn !== undefined) game.wallet.earn(x.earn, x.what);
        else if (x.thread) { if (x.start) J.start(x.thread); if (x.step !== undefined) J.step(x.thread, x.step); if (x.done) J.done(x.thread); }
        else if (x.found) J.find(x.found);
        else if (x.meet) J.meet(x.meet);
        else if (x.custom) J.custom(x.custom);
        else if (x.time) { if (x.time.to !== undefined) game.clock.skipTo(x.time.to); else if (x.time.add) { game.clock.minutes += x.time.add * 60; while (game.clock.minutes >= 1440) { game.clock.minutes -= 1440; game.clock.day++; } game.events.emit('clock:jump'); } }
        else if (x.call) { const fn = typeof x.call === 'function' ? x.call : HOOKS[x.call]; if (fn) { const r = fn(game, x); if (r && r.then) await r; if (typeof r === 'string' && labels[r] !== undefined) i = labels[r]; } }
        else if (x.toast && game.ui) game.ui.toast(x.toast, { kind: 'info' });
        else if (x.banner && game.ui) game.ui.banner(x.banner[0], x.banner[1]);
      }
    } catch (e) { console.error('[story] ' + (e && e.stack ? e.stack : e)); }
    game.busy--; if (game.audio) game.audio.duck(0, 0.6);
    if (node.once) st.said[node.id] = true;
    persist(); game.events.emit('talked', { who: owner, node: node.id });
  };
  // A keeper's own counter talk (a shop's menu, written by the shop) and the story's talk are one conversation: what
  // the story has new for you first, and after that the shop. A place registers nothing: any fixed "Talk to <Name>"
  // it made is found here by the name, and from then on it is reached through the person, never by itself.
  let shops = null;
  const ALIAS = { 'the nurse': 'nkem', 'the choir leader': 'connie' };
  const linkShops = () => {
    shops = {}; const byName = {}; for (const k in CAST) byName[CAST[k].short || CAST[k].name] = k;
    for (const it of game.world.interacts) {
      if (it.pos || typeof it.prompt !== 'string') continue;
      const m = /^Talk to (the nurse|the choir leader|[A-Z][A-Za-z]+)$/.exec(it.prompt); const cid = m && (ALIAS[m[1]] || byName[m[1]]); if (!cid || !CAST[cid]) continue;
      (shops[cid] = shops[cid] || []).push(it); it.enabled = () => false;
    }
  };
  const shopFor = (id) => {
    if (!shops) linkShops();
    const list = shops[id]; if (!list) return null;
    const p = game.people && game.people.byId ? game.people.byId(id) : null;
    for (const it of list) {
      if (it.scope && !(it.scope.active && it.scope.visible)) continue;
      if (p && p.present && p.frame === it.frame && Math.hypot(p.x - it.x, p.z - it.z) < 12 && Math.abs(p.y - it.y) < 4) return it;
    }
    return null;
  };
  game.events.on('update', () => { if (!shops && game.ready) linkShops(); });

  game.story = {
    state: st, speaker, persist,
    add(table) { for (const id in table) NODES[id] = (NODES[id] || []).concat(table[id]); },
    hook(name, fn) { HOOKS[name] = fn; },
    // talk to a cast member: the best node whose conditions hold; otherwise their one-line description
    async talk(id) {
      J.meet(id);
      const list = (NODES[id] || []).filter((n) => !(n.once && st.said[n.id]) && ok(n.when)).sort((a, b) => (b.priority || 0) - (a.priority || 0));
      // at their own counter a keeper says what the story has new, if anything, and then serves you
      // (the plain line for the day is only for when you meet them somewhere else)
      const shop = shopFor(id), top = list[0];
      if (shop) {
        if (top && (top.once || top.priority > 0)) await run(id, top);
        try { const r = shop.onUse(game, shop); if (r && r.then) await r; } catch (e) { console.error('[story] shop talk ' + id + ': ' + (e && e.stack ? e.stack : e)); }
        persist(); game.events.emit('talked', { who: id, node: 'shop' }); return;
      }
      if (list.length) return run(id, list[0]);
      const c = CAST[id]; if (c && game.ui) { game.busy++; try { await game.ui.say(speaker(id), [c.idle || c.line]); } finally { game.busy--; } }
    },
    run: (owner, node) => run(owner, node),
    // run a list of steps that belongs to nobody (a scene)
    scene: (script, owner = 'you') => run(owner, { id: 'scene', script }),
  };

  // ---- saving where you are
  game.saveGame = () => {
    const p = game.player; if (!p.frame || !game.started) return;      // never from the title screen: it stands in the court at dusk
    if (p.mode === 'fly' || (game.cab && game.cab.riding)) return;       // nor from the air or a cab: there is nowhere to come back to
    const where = { frame: p.frame.id, x: p.pos.x, y: p.pos.y, z: p.pos.z, yaw: p.yaw, day: game.clock.day, minutes: game.clock.minutes };
    // a place that is built when you go there has to be built again before you can come back to it
    const region = game.regions ? game.regions.ofFrame(p.frame.id) : null; if (region) where.region = region;
    save.set('where', where);
    persist();
  };
  // Resolves to true if the player was put back where they were (the caller starts them at the station otherwise).
  game.loadGame = async () => {
    const w = save.get('where', null); if (!w) return false;
    try {
      if (w.region && game.regions) await game.regions.load(w.region);
      let f = game.world.frames.get(w.frame);
      if (!f && game.city && /^layer\d+$/.test(w.frame)) f = game.city.frame(parseInt(w.frame.slice(5), 10));
      if (!f) return false;
      if (game.city && game.city.ensureAt) await game.city.ensureAt(f, w.x, w.z);
      game.player.place(f, w.x, w.y + 0.05, w.z, w.yaw); game.clock.day = w.day; game.clock.minutes = w.minutes; return true;
    } catch (e) { console.error('[save] could not go back to where you were: ' + (e && e.stack ? e.stack : e)); return false; }
  };
  game.hasSave = () => !!save.get('where', null);
  game.newGame = () => { for (const k of ['flags', 'items', 'found', 'met', 'customs', 'threads', 'said']) for (const q in st[k]) delete st[k][q]; st.cards.length = 0; persist(); save.remove('where'); save.remove('wallet'); game.wallet.kwh = 21.6; };
  let acc = 0; game.events.on('update', (dt) => { acc += dt; if (acc > 30 && !game.busy) { acc = 0; game.saveGame(); } });
  game.events.on('zone', () => { if (!game.busy && game.ready) game.saveGame(); });
  // a new day brings a new dividend
  game.events.on('clock:day', () => { game.wallet.earn(21.6, 'The day’s dividend'); });
}
