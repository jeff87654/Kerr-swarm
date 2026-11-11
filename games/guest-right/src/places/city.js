// The rest of Chervil: every block of the drum that nobody built by hand (src/city). This place builds nothing itself;
// it creates game.city before the streets of Candlewick are made (they ask whether their arches lead somewhere real)
// and starts the streamer that keeps the blocks round the player built.
import { createCity } from '../city/city.js';
import { createStreamer } from '../city/streamer.js';
import { pickBlock } from '../city/picker.js';
import { createPavilions } from '../city/pavilions.js';
import { cellKey, parseKey, wrapI, J_MIN, J_MAX, cellAt } from '../core/layout.js';
import { planCell } from '../city/plan.js';

const cellAtOf = (L, x, z) => cellAt(L, x, z);

export const place = {
  id: 'city', name: 'The blocks of Chervil', order: 1, always: true,
  build(game) {
    if (game.params && game.params.nocity) return;
    const city = game.city = createCity(game);
    const st = city.streamer = createStreamer(game, city);
    city.ensure = (cell, fast) => st.ensure(cell, fast);
    city.loaded = () => st.loaded();
    // the block under a point of a layer's frame, built before anybody is put there (a saved game)
    city.ensureAt = async (frame, x, z) => { const L = city.layerOf(frame); if (L < 0) return; const c = cellAtOf(L, x, z); if (!city.info(c).built) await st.ensure(c, true); };

    // where a cab (or the stair) sets you down in a block: its lift lobby
    city.arrive = async (cell) => {
      const info = city.info(cell);
      if (info.built) { const s0 = game.cab && game.cab.stops.find((q) => q.frame && q.frame.id === city.frame(cell.L).id); return s0 ? { frame: s0.frame, x: s0.x, y: s0.y, z: s0.z, yaw: s0.yaw || 0 } : null; }
      const c = await st.ensure(cell, true);
      if (!c) return null;
      const lobby = c.plan.lots.find((l) => l.kind === 'lobby');
      const a = lobby && lobby.arrive ? lobby.arrive : { x: c.plan.cx + 3, y: 0, z: c.plan.cz + 3, yaw: 0 };
      return { frame: city.frame(cell.L), x: a.x, y: a.y || 0, z: a.z, yaw: a.yaw || 0 };
    };
    // a cab stop for any block
    city.stop = (cell) => { const info = city.info(cell); return { id: 'cell:' + info.key, name: info.name, sub: info.sub, banner: info.name, cell: { L: info.L, i: info.i, j: info.j } }; };
    // the stair in a lift core: one layer up or down, to the block straight above or below
    city.stairs = async (cell, dir) => {
      if (game.busy || (game.cab && game.cab.riding)) return;
      const ui = game.ui, p = game.player, info = city.info(cell);
      game.busy++;
      try {
        if (game.audio) game.sfx('door-open', { vol: 0.5 });
        if (ui) await ui.fade(true, 0.4);
        const t0 = performance.now();
        const a = await city.arrive(cell);
        const wait = 1400 - (performance.now() - t0); if (wait > 0) await new Promise((r) => setTimeout(r, wait));     // the climb takes a moment either way
        if (a) { p.place(a.frame, a.x, a.y, a.z, a.yaw || 0, 0); if (ui) ui.toast((dir > 0 ? 'Up the stair to ' : 'Down the stair to ') + info.name + ': ' + info.address + ', ' + info.g.toFixed(2) + ' g.', { kind: 'info', dur: 6 }); }
        else if (ui) ui.toast('The stair door is locked from the other side.', { kind: 'info' });
        if (ui) await ui.fade(false, 0.5);
        if (a) { game.events.emit('city:stairs', { to: info, dir }); if (game.saveGame) game.saveGame(); }
      } finally { game.busy--; }
    };
    // The Hollow's lift pavilions, and the last stair: from a block of the top decks up to the pavilion over it.
    const pav = city.pavilions = createPavilions(game, city);
    city.hollowStop = (cell) => { const a = pav.over(cell); if (!a) return null; const info = city.info(cell); return { id: 'pav:' + a.ix + ':' + a.iz, name: 'The Hollow', sub: 'the lift pavilion over ' + info.name, banner: 'The Hollow', frame: a.frame, x: a.x, y: a.y, z: a.z, yaw: a.yaw }; };
    city.toHollow = async (cell) => {
      if (game.busy || (game.cab && game.cab.riding)) return;
      const ui = game.ui, a = pav.over(cell);
      if (!a || !a.frame) { if (ui) ui.toast('The last stair here comes up under the lake. It is kept locked, and a brass plate says why.', { kind: 'info', dur: 7 }); return; }
      game.busy++;
      try {
        if (game.audio) game.sfx('door-open', { vol: 0.5 });
        if (ui) await ui.fade(true, 0.4);
        await new Promise((r) => setTimeout(r, 1300));
        game.player.place(a.frame, a.x, a.y, a.z, a.yaw, 0);
        if (ui) { await ui.fade(false, 0.7); ui.banner('The Hollow', 'up the last stair from ' + city.info(cell).name); }
        game.events.emit('city:stairs', { to: null, dir: 1, hollow: true, from: city.info(cell) });
        if (game.saveGame) game.saveGame();
      } finally { game.busy--; }
    };
    // calling a cab from a block's lobby
    city.callCab = (cell) => { if (game.cab) game.cab.open('cell:' + cellKey(cell.L, cell.i, cell.j)); };
    city.pick = (from) => pickBlock(game, city, from);

    // For testing: go(cell, lot) builds a block and stands the player in it. lot: 'court' | 'hall' | 'lobby' | 'shop.baker' |
    // 'room.clinic' | 'special.school' | a lot's kind. If the block has no such lot, the nearest block round the drum that has one is used.
    // From the address bar: ?cell=0:5:3&lot=special.school
    const keyOf = (l) => (l.kind === 'special' ? 'special.' + l.special : l.kind === 'shop' ? 'shop.' + l.trade : l.kind === 'room' ? 'room.' + l.use : l.kind);
    city.go = async (cell, lot) => {
      let c0 = { L: cell.L, i: wrapI(cell.L, cell.i), j: Math.max(J_MIN, Math.min(J_MAX, cell.j)) }, hit = null;
      if (lot && lot !== 'court') {
        for (let k = 0; k < 400 && !hit; k++) {
          const c = { L: c0.L, i: wrapI(c0.L, c0.i + (k % 2 ? -1 : 1) * Math.ceil(k / 2)), j: c0.j };
          if (city.info(c).built) continue;
          const l = planCell(c.L, c.i, c.j).lots.find((q) => keyOf(q) === lot || q.kind === lot);
          if (l) { c0 = c; hit = l.id; }
        }
        if (!hit) { console.warn('[city] no block near ' + cellKey(cell.L, cell.i, cell.j) + ' has a lot ' + lot); return null; }
      }
      const c = await st.ensure(c0, true); if (!c) return null;
      const plan = c.plan, p = game.player, f = city.frame(c0.L);
      let x = plan.cx + 4, z = plan.cz + 4, yaw = 0;
      const l = hit ? plan.lots.find((q) => q.id === hit) : null;
      if (l) {
        // stand outside its front, a few metres back, looking at it (player yaw 0 looks toward -z)
        const mx = (l.x0 + l.x1) / 2, mz = (l.z0 + l.z1) / 2, d = lot === 'hall' || l.kind === 'special' ? 5 : 3.2;
        if (l.front === 'n') { x = mx; z = l.z0 - d; yaw = Math.PI; } else if (l.front === 's') { x = mx; z = l.z1 + d; yaw = 0; }
        else if (l.front === 'w') { x = l.x0 - d; z = mz; yaw = Math.PI / 2; } else { x = l.x1 + d; z = mz; yaw = -Math.PI / 2; }
        if (l.kind === 'hall' && l.courtSpan) { const m = (l.courtSpan[0] + l.courtSpan[1]) / 2; if (l.front === 'n' || l.front === 's') x = m; else z = m; }
      }
      p.place(f, x, 0, z, yaw, 0);
      console.log('[city] at ' + city.info(c0).name + ' (' + c.key + ')' + (l ? ', lot ' + l.id + ' ' + keyOf(l) + ' [' + [l.x0, l.z0, l.x1, l.z1].map((v) => v.toFixed(1)).join(', ') + '] front ' + l.front : ''));
      return { cell: c0, lot: l, plan };
    };
    if (game.params && game.params.cell) game.events.on('ready', () => { city.go(parseKey(game.params.cell), game.params.lot === true ? null : game.params.lot || null).catch((e) => console.error('[city] ' + (e && e.stack ? e.stack : e))); });

    // a new game starts with nowhere visited
    game.events.on('game:new', () => { city.reset(); });
    // walking into a block: its name comes up the first time, and the journal is told
    let last = null, acc = 0;
    game.events.on('cab:arrive', () => { const cur = city.cellOfPlayer(); if (!cur) return; last = cellKey(cur.L, cur.i, cur.j); const first = city.visit(cur); game.events.emit('city:enter', { info: city.info(cur), first }); });
    game.events.on('update', (dt) => {
      acc += dt; if (acc < 0.4) return; acc = 0;
      if (!game.started || (game.cab && game.cab.riding)) return;
      const cur = city.cellOfPlayer(); if (!cur) { last = null; return; }
      const key = cellKey(cur.L, cur.i, cur.j); if (key === last) return;
      const info = city.info(cur), prev = last; last = key;
      if (!info.built && !st.get(cur)) { last = prev; return; }           // not there yet
      const first = city.visit(cur);
      game.events.emit('city:enter', { info, first });
      if (game.ui && !info.built && first) game.ui.banner(info.name, info.sub);
    });
  },
};
