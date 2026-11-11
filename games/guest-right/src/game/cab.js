// Cabs: the drum's lifts. One party to a cab, door to door. You pick a stop at a berth, sit in a small leaning room
// for a few seconds while the deck counter runs and your weight changes, and step out somewhere else.
import { room } from '../world/kit2.js';
import { lamp } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign, signRect } from '../world/signs.js';
import { deckOf, deckRadius, gAt, DRUM } from '../core/drum.js';
import { lerp, smoother, clamp } from '../core/util.js';
import { parseKey } from '../core/layout.js';

export function createCab(game) {
  const stops = [];
  let built = null, riding = false;
  const cab = {
    stops,
    // addStop({ id, name, sub, frame, x, y, z, yaw, when: (game) => bool })   (x, y, z): where you step out
    // A stop in a region that is built on demand has { region, spawn, deck } in place of the frame and position;
    // a block of the city has { cell: { L, i, j } } (see src/city/city.js).
    addStop(s) { const i = stops.findIndex((q) => q.id === s.id); if (i >= 0) stops[i] = s; else stops.push(s); return s; },
    get riding() { return riding; },
    // open the berth's list of stops; fromId is the stop you are at
    async open(fromId) {
      if (riding || game.busy) return;
      const here = stops.find((s) => s.id === fromId) || { id: fromId };
      const list = stops.filter((s) => s.id !== fromId && (!s.when || s.when(game)));
      const city = game.city && game.city.pick ? game.city : null;
      if (!list.length && !city) { if (game.ui) game.ui.toast('No cabs are running from here yet.', { kind: 'info' }); return; }
      let to = list[0] || null;
      if (game.ui) { game.busy++; try { to = await chooseStop(list, city, fromId); } finally { game.busy--; } }
      if (!to) return;
      return cab.ride(here, to);
    },
    async ride(from, to) {
      if (riding || !to) return; riding = true; game.busy++;
      const W = game.world, p = game.player, ui = game.ui;
      try {
        if (!built) { const g0 = game.atlas ? game.atlas.group : null; if (game.atlas) game.atlas.group = null; try { built = buildCabin(game); } finally { if (game.atlas) game.atlas.group = g0; } }
        const f = built.frame;
        cab._back = { frame: p.frame, x: p.pos.x, y: p.pos.y, z: p.pos.z, yaw: p.yaw };
        // where the ride ends: known at once for a built place; a region or a city block is built while you ride
        const lazy = !to.frame;
        const landing = lazy ? (to.cell && game.city ? game.city.arrive(to.cell) : game.regions.load(to.region).then(() => { const sp = game.spawns[to.spawn]; return sp ? { frame: sp.frame, x: sp.x, y: sp.y, z: sp.z, yaw: sp.yaw || 0 } : null; })) : Promise.resolve(to);
        const rhoA = p.frame.rho(p.pos.y), zA = p.frame.zd(p.pos.z);
        const meta = lazy ? (to.cell && game.city ? game.city.where(to.cell) : { rho: deckRadius(to.deck || 1), z: to.zd !== undefined ? to.zd : zA }) : { rho: to.frame.rho(to.y), z: to.frame.zd(to.z) };
        const rhoB = meta.rho;
        const dist = Math.abs(rhoB - rhoA) + Math.abs(meta.z - zA) * 0.3;
        const T = clamp(5 + dist / 190, 6, 13);
        if (game.audio) game.sfx('berth-door');
        if (ui) await ui.fade(true, 0.45);
        p.place(f, 0, 0, 0.55, 0, 0); p.sit({ x: 0, y: 0.0, z: 0.62, yaw: 0, eye: 1.12 }); p.locked = true; p.yaw = 0; p.pitch = 0.08;
        if (game.audio) { game.audio.ambience('cab', { fade: 0.6 }); game.audio.reverb('room'); game.sfx('cab-go'); }
        if (ui) { ui.hud.thread(null); await ui.fade(false, 0.5); }
        let t = 0; let lastDeck = -1;
        await new Promise((res) => {
          const off = game.events.on('update', (dt) => {
            t += dt; const k = smoother(clamp(t / T, 0, 1)); const rho = lerp(rhoA, rhoB, k);
            p.gOverride = gAt(rho);                       // your weight follows the deck you are passing
            p.roll = Math.sin(clamp(t / T, 0, 1) * Math.PI) * 0.035 * Math.sign(rhoA - rhoB);
            const deck = deckOf(rho);
            if (deck !== lastDeck) { lastDeck = deck; built.show(rho <= DRUM.HOLLOW_R + 3 ? 'THE HOLLOW' : 'DECK ' + deck, gAt(rho).toFixed(2) + ' g', to.name); }
            if (t >= T) { off(); res(); }
          });
        });
        p.gOverride = gAt(rhoB);
        let dest = null;
        try { dest = await landing; } catch (e) { console.error('[cab] ' + (e && e.stack ? e.stack : e)); }
        p.roll = 0; p.gOverride = null;
        if (game.audio) { game.sfx('cab-stop'); game.sfx('chime', { delay: 0.25 }); }
        if (ui) await ui.fade(true, 0.45);
        if (!dest) { const b = cab._back; p.stand(); p.locked = false; if (b) p.place(b.frame, b.x, b.y, b.z, b.yaw || 0, 0); if (ui) { await ui.fade(false, 0.6); ui.toast('The cab comes back to where it started. That stop is closed today.', { kind: 'info' }); } riding = false; game.busy--; return; }
        p.stand(); p.locked = false; p.place(dest.frame, dest.x, dest.y, dest.z, dest.yaw || 0, 0);
        if (ui) { await ui.fade(false, 0.6); ui.banner(to.banner || to.name, to.sub || ''); ui.hud.thread(game.journal ? game.journal.current() : null); }
        game.events.emit('cab:arrive', { from: from && from.id, to: to.id, region: to.region || null, cell: to.cell || null });
        if (game.regions) game.regions.trim();
        if (game.saveGame) game.saveGame();
      } catch (e) { console.error('[cab] ' + (e && e.stack ? e.stack : e)); game.player.locked = false; game.player.gOverride = null; game.player.stand(); if (game.ui) game.ui.fade(false, 0.3); }
      riding = false; game.busy--;
    },
  };
  // the stops built with the first game have no group of their own
  const GROUP_OF = { 'lobby-a': 'Candlewick', 'lobby-b': 'Candlewick', station: 'The stations', 'lake-pavilion': 'The Hollow', 'dawn-terrace': 'The end walls', 'third-terrace': 'The end walls', 'flying-hall': 'The axles' };
  const GROUP_ORDER = ['Candlewick', 'The stations', 'The Keel', 'The line decks', 'The Low decks', 'The Middle decks', 'The High decks', 'The Hollow', 'The end walls', 'The axles'];
  // The list at a berth: single stops, groups of stops (a quarter with several berths: stops that carry `group`), and any
  // block of the city by address.
  async function chooseStop(list, city, fromId) {
    const ui = game.ui, who = { name: 'Cab', colour: '#3fe0d0' };
    for (;;) {
      const groups = new Map(), top = [];
      for (const s of list) { const gr = s.group || GROUP_OF[s.id]; if (gr) { let g = groups.get(gr); if (!g) { groups.set(gr, g = []); top.push({ group: gr, items: g }); } g.push(s); } else top.push({ stop: s }); }
      // nearest things first: Candlewick, then down the drum from the rim to the axis
      const rank = (t) => { const k = GROUP_ORDER.indexOf(t.group || ''); return k < 0 ? GROUP_ORDER.length : k; };
      top.sort((a, b) => rank(a) - rank(b));
      const opts = top.map((t) => (t.stop ? { label: t.stop.name, sub: t.stop.sub, value: t.stop.id } : t.items.length === 1 ? { label: t.items[0].name, sub: t.items[0].sub, value: t.items[0].id } : { label: t.group, sub: t.items.length + ' stops', value: 'g:' + t.group }));
      if (city) opts.push({ label: 'Another block of Chervil', sub: 'any of ' + city.count.toLocaleString('en-GB') + ', by address', value: '__city' });
      const pick = await ui.choose(who, 'Where to', opts);
      if (!pick) return null;
      if (pick === '__city') { const m = /^cell:(.+)$/.exec(fromId || ''); const cell = await city.pick(m ? parseKey(m[1]) : null); if (cell) return cell.stop ? cell.stop : city.stop(cell); continue; }
      if (pick.slice(0, 2) === 'g:') {
        const items = groups.get(pick.slice(2));
        const p2 = await ui.choose(who, pick.slice(2), items.map((s) => ({ label: s.name, sub: s.sub, value: s.id })).concat([{ label: 'Back', sub: '', value: '__back' }]));
        if (!p2) return null; if (p2 === '__back') continue;
        return list.find((s) => s.id === p2) || null;
      }
      return list.find((s) => s.id === pick) || null;
    }
  }
  return cab;
}

// The cabin: a small felt-lined room with two benches, a lamp and a deck counter over the door. It has its own frame,
// whose radius the ride changes, so the weight you feel is the weight at that deck.
function buildCabin(game) {
  const W = game.world;
  const f = W.frame('cab', 2940, 2.2, 1900);
  const s = W.scope('cab', f);
  const clip = room(s, { x0: -1.25, z0: -1.1, x1: 1.25, z1: 1.1, y: 0, h: 2.35, floor: ['carpet', '#5a2f3a'], ceil: ['felt', '#d8ccb4'], wall: { mat: 'felt', tint: '#8a7a5c', dado: { h: 0.95, mat: 'wood', tint: '#5b4636' }, skirt: false }, glow: { sky: '#ffdcae', ground: '#a8794f', power: 0.5 } });
  lamp(s, 'panel', 0, 2.35, 0, { w: 0.9, d: 0.4, K: 2800, power: 0.5, clip, range: 4, lampFlag: false });
  prop(s, 'bench', 0, 0, 0.82, Math.PI, { w: 2.1, back: true, wood: '#7a5233' }, { noSpots: true, tier: 's' });
  prop(s, 'bench', 0, 0, -0.82, 0, { w: 2.1, back: true, wood: '#7a5233' }, { noSpots: true, tier: 's' });
  s.structure((g) => {
    g.mat('brushed', '#b9b2a4'); g.box(-0.55, 0, -1.02, 0.55, 2.05, -1.0, { bevel: 0.004 });       // the door, shut
    g.mat('cast', '#c8a45a'); for (const x of [-1.15, 1.15]) g.tube([[x, 1.0, -0.9], [x, 1.0, 0.9]], 0.014, { segs: 6 });   // grab rails
    g.mat('cast', '#3d4a45'); g.box(-0.02, 0, -1.03, 0.02, 2.05, -1.0);
  });
  // the deck counter: a small lit board whose text is redrawn as the cab moves
  const spec = { kind: 'board', title: '', lines: [''], palette: ['#101614', '#f3e6c8', '#3fe0d0'] };
  const R = signRect(game.atlas, { kind: 'board', title: 'DECK 16', lines: ['0.98 g|to Candlewick'], palette: spec.palette, w: 0.9, h: 0.3 }, 0.9, 0.3);
  s.deco((g) => {
    g.atlas(R.rect.page, { emissive: 1.6 });
    const r = R.rect; g.quad([-0.45, 2.1, -1.085 + 0.1], [0.45, 2.1, -1.085 + 0.1], [0.45, 2.3, -1.085 + 0.1], [-0.45, 2.3, -1.085 + 0.1], { uv: [r.u0, r.v1, r.u1, r.v0] });
  });
  s.zoneBox({ id: 'cab', box: [-1.3, -0.5, -1.2, 1.3, 2.5, 1.2], name: 'Cab', sub: 'between decks', ambience: 'cab', reverb: 'room', headroom: 2.3 });
  s.finish();
  const show = (big, g, to) => {
    game.atlas.redraw(R.rect, (ctx, w, h) => {
      ctx.fillStyle = '#101614'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f3e6c8'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.font = "600 " + Math.round(h * 0.5) + "px 'Barlow Condensed', sans-serif"; ctx.fillText(big, w * 0.06, h * 0.36);
      ctx.fillStyle = '#3fe0d0'; ctx.font = "500 " + Math.round(h * 0.24) + "px 'Barlow Condensed', sans-serif"; ctx.fillText(g, w * 0.06, h * 0.78);
      ctx.fillStyle = '#a99f90'; ctx.textAlign = 'right'; ctx.fillText(('to ' + to).toUpperCase(), w * 0.94, h * 0.78);
    });
  };
  return { frame: f, scope: s, show };
}
