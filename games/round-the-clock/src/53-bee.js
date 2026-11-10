/* ---------- Bee: Brush Rows ----------
   Nothing in Sorrel carries pollen but people. Bee's orchards on the Hollow floor (deck 376, half a g)
   are brushed by hand: an apple blossom sets only with pollen from another variety, so the brush has
   to go from one kind to the other, flower by flower. One long stroke that keeps changing kind does
   more than any number of short ones.
   The espalier is a 6 x 6 grid of open blossoms. Press on one and drag through its neighbours
   (diagonals count), never the same kind twice running; let go and every blossom in the stroke sets.
   Brushed blossoms drop their petals (slowly, at half a g, and a little anti: dropDrift) and the
   rows open new buds. Eight strokes or a 75-minute slot on the rota (75 seconds), whichever is first. */
"use strict";
(function () {
  const N = 6, CELL = 132, GX = 182, GY = 172;          // the grid, in stage units
  const HIT = 0.45 * CELL;                               // a finger this near a blossom's centre is on it
  const BR = 50;                                         // blossom radius
  const STROKES = 8, LIMIT = 75;                         // strokes, seconds (minutes of the rota slot)
  const STAGGER = 0.045, T_FRUIT = 0.95, T_OPEN = 0.42;  // brushing ripple, fruitlet showing, bud opening
  const START_MIN = 9 * 60;                              // the slot starts at 09:00, full sun
  const R_FLOOR = DRUM.HOLLOW_R;
  // Petals fall from a tree about 1.5 m tall; the floor turns under them, so they come down a little anti.
  // dropDrift over the fall height gives the slant: about 3 cm in every metre fallen.
  const ANTI = dropDrift(1.5, R_FLOOR) / 1.5;
  const FALL_V = 130;                                    // stage units a second: slow, at half a g
  const KINDS = [
    { petal: "#fbf7ee", petal2: "#e9dcc6", eye: "#e2cc63", dot: "#a9811a", dust: "#fff3c4" },   // round, white
    { petal: "#f293b5", petal2: "#d66790", eye: "#86203f", dot: "#f2cf5a", dust: "#ffd2e0" },   // pointed star, pink
    { petal: "#c42e48", petal2: "#951b33", eye: "#f7df84", dot: "#3a1018", dust: "#ffb3a6" },   // four hearts, crimson
  ];
  const POLLEN = "#ffe27a";
  const LEAF = ["#2e3a1b", "#3e4c22", "#253015"];
  const MOTH = (typeof PALS !== "undefined" && PALS[10]) ? PALS[10] : null;

  const cxOf = (i) => GX + ((i % N) + 0.5) * CELL;
  const cyOf = (i) => GY + (Math.floor(i / N) + 0.5) * CELL;
  const adj = (a, b) => a !== b && Math.abs((a % N) - (b % N)) <= 1 && Math.abs(Math.floor(a / N) - Math.floor(b / N)) <= 1;

  function neighbours(i) {
    const out = [], c = i % N, r = Math.floor(i / N);
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const cc = c + dc, rr = r + dr;
      if (cc >= 0 && cc < N && rr >= 0 && rr < N) out.push(rr * N + cc);
    }
    return out;
  }
  const NB = [];
  for (let i = 0; i < N * N; i++) NB.push(neighbours(i));

  function create(ctx) {
    const s = {
      t: 0, phase: "play", endT: 0, done: false, score: 0, strokes: 0, longest: 0, kinds: 2,
      cells: [], chain: [], drag: false, lx: 500, ly: 500,
      cur: 14, useKb: false, kbPend: 0, kdx: 0, kdy: 0,
      bx: 560, by: 560, tilt: 0, bvx: 0,
      parts: new Parts(260), petals: [], notes: new Notes(),
      flash: 0, cheer: 0, big: null, endDelay: 0.35, endSaid: false, thirdAt: -1, blockI: -1, said: 0, thirdSaid: false, tickS: -1, endWhy: "",
    };
    for (let i = 0; i < N * N; i++) s.cells.push({ v: ctx.rng.int(0, 1), st: "open", t: 0, pop: 0, shake: 0, rot: ctx.rng.range(-0.4, 0.4), dropped: false, ord: 0 });
    return s;
  }

  const isOpen = (s, i) => s.cells[i].st === "open";
  const canAdd = (s, i) => {
    const ch = s.chain, last = ch[ch.length - 1];
    return adj(last, i) && isOpen(s, i) && ch.indexOf(i) < 0 && s.cells[i].v !== s.cells[last].v;
  };

  /* ---- the stroke ---- */
  function startAt(s, ctx, i) {
    if (!isOpen(s, i)) return false;
    s.chain = [i]; s.blockI = -1;
    s.cells[i].pop = 1;
    ctx.sfx.chime(0);
    dust(s, ctx, i, 6);
    return true;
  }
  function addTo(s, ctx, i) {
    s.chain.push(i); s.blockI = -1;
    const n = s.chain.length;
    s.cells[i].pop = 1;
    ctx.sfx.chime(Math.min(10, n - 1));
    if (n > 11) ctx.sfx.tone({ f: 880 * Math.pow(2, Math.min(n - 11, 14) / 12), dur: 0.12, vol: 0.05, type: "sine", at: 0.05 });
    dust(s, ctx, i, 5 + Math.min(10, n));
  }
  function undo(s, ctx) {
    const i = s.chain.pop();
    s.cells[i].pop = -0.6;
    ctx.sfx.tick();
  }
  function blocked(s, ctx, i) {
    if (s.blockI === i) return;
    s.blockI = i;
    s.cells[i].shake = 1;
    ctx.sfx.tone({ f: 220, f1: 180, dur: 0.12, vol: 0.07, type: "triangle" });
    s.notes.add("same kind", cxOf(i), cyOf(i) - 30, { size: 34, col: alpha(INK, 0.85), life: 0.8, rise: 30 });
  }
  function dust(s, ctx, i, n) {
    const x = cxOf(i), y = cyOf(i), col = KINDS[s.cells[i].v].dust;
    for (let k = 0; k < n; k++) {
      const a = ctx.rng.range(0, TAU), v = ctx.rng.range(30, 120);
      s.parts.add({ x: x + Math.cos(a) * 18, y: y + Math.sin(a) * 18, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, g: 60, drag: 2.5, life: ctx.rng.range(0.5, 0.9), r: ctx.rng.range(2.5, 5), col: k % 2 ? POLLEN : col, a: 0.95 });
    }
  }

  // a finger at (x, y): which blossom is it on, if any
  function cellAt(x, y) {
    const c = Math.floor((x - GX) / CELL), r = Math.floor((y - GY) / CELL);
    if (c < 0 || c >= N || r < 0 || r >= N) return -1;
    const i = r * N + c;
    return Math.hypot(x - cxOf(i), y - cyOf(i)) <= HIT ? i : -1;
  }

  function touch(s, ctx, i) {
    if (i < 0) return;
    const ch = s.chain;
    if (!ch.length) { startAt(s, ctx, i); return; }
    const last = ch[ch.length - 1];
    if (i === last) return;
    if (ch.length >= 2 && i === ch[ch.length - 2]) { undo(s, ctx); return; }
    if (canAdd(s, i)) { addTo(s, ctx, i); return; }
    if (adj(last, i) && isOpen(s, i) && ch.indexOf(i) < 0) { blocked(s, ctx, i); return; }
    // a single blossom and the finger has gone somewhere it can't reach: pick the brush up there instead
    if (ch.length === 1 && !adj(last, i) && isOpen(s, i)) startAt(s, ctx, i);
  }

  // follow the finger from where it was to where it is, in short steps, so a quick swipe misses nothing
  function sweep(s, ctx, x0, y0, x1, y1) {
    const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / 16));
    for (let k = 1; k <= n; k++) touch(s, ctx, cellAt(lerp(x0, x1, k / n), lerp(y0, y1, k / n)));
  }

  function brush(s, ctx) {
    const ch = s.chain, n = ch.length;
    s.chain = []; s.blockI = -1;
    if (n < 2) { if (n === 1) { s.cells[ch[0]].pop = -0.5; ctx.sfx.tick(); } return; }
    ch.forEach((i, k) => { const c = s.cells[i]; c.st = "set"; c.t = -k * STAGGER; c.dropped = false; c.ord = k; });
    s.score += n; s.strokes++;
    s.longest = Math.max(s.longest, n);
    let mx = 0, my = 0;
    for (const i of ch) { mx += cxOf(i); my += cyOf(i); }
    mx /= n; my /= n;
    mx = clamp(mx, GX + 90, GX + N * CELL - 90); my = clamp(my, GY + 70, GY + N * CELL - 40);
    if (n >= 12) s.big = { n, t: 0, word: n >= 24 ? "Every blossom wants a brush" : n >= 18 ? "One for the rota" : "A long stroke" };
    else {
      s.notes.add("+" + n, mx, my + 20, { size: n >= 7 ? 92 : 68, col: INK, life: 1.3, rise: 70 });
      if (n >= 7) s.notes.add("well brushed", mx, my - 56, { size: 42, col: INK, life: 1.3, rise: 60 });
    }
    if (n >= 12) { ctx.sfx.great(); ctx.sfx.cheer(n >= 18 ? 0.9 : 0.5); s.flash = 1; s.cheer = 2.2; }
    else if (n >= 7) { ctx.sfx.great(); s.cheer = 1.2; s.flash = 0.45; }
    else if (n >= 4) ctx.sfx.good();
    else ctx.sfx.pop();
    // a puff of pollen all along the stroke
    for (let k = 0; k < n; k++) dust(s, ctx, ch[k], n >= 12 ? 8 : 4);
    if (s.strokes === 3) s.kinds = 3;
    if (s.strokes >= STROKES) { s.phase = "end"; s.endT = 0; s.endWhy = "strokes"; s.endDelay = s.big ? 1.1 : 0.35; }
  }

  function petalsFrom(s, ctx, i) {
    const x = cxOf(i), y = cyOf(i), K = KINDS[s.cells[i].v];
    for (let k = 0; k < 6; k++) {
      const a = s.cells[i].rot + k * TAU / 5 + ctx.rng.range(-0.3, 0.3);
      s.petals.push({ x: x + Math.cos(a) * BR * 0.5, y: y + Math.sin(a) * BR * 0.5, vx: Math.cos(a) * ctx.rng.range(20, 60), vy: Math.sin(a) * ctx.rng.range(10, 40) - 20,
        rot: a, vr: ctx.rng.range(-3, 3), ph: ctx.rng.range(0, TAU), age: 0, life: ctx.rng.range(2.2, 3.2), col: k % 2 ? K.petal : K.petal2, sz: ctx.rng.range(11, 16), kind: s.cells[i].v });
    }
  }

  /* ---- the step ---- */
  function update(s, dt, inp, ctx) {
    s.parts.update(dt);
    s.notes.update(dt);
    for (let k = s.petals.length - 1; k >= 0; k--) {
      const p = s.petals[k];
      p.age += dt;
      if (p.age > p.life || p.y > SH + 30) { s.petals.splice(k, 1); continue; }
      // they settle to a slow fall, fluttering, and slant a little anti as the floor turns under them
      p.vy = approach(p.vy, FALL_V, 220 * dt);
      p.vx = approach(p.vx, -ANTI * p.vy, 60 * dt);
      p.x += (p.vx + Math.sin(p.age * 4.2 + p.ph) * 34) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
    for (let i = 0; i < s.cells.length; i++) {
      const c = s.cells[i];
      c.pop = approach(c.pop, 0, dt * 3.2);
      c.shake = approach(c.shake, 0, dt * 2.5);
      if (c.st === "set") {
        c.t += dt;
        if (c.t >= 0 && !c.dropped) { c.dropped = true; petalsFrom(s, ctx, i); if (c.ord % 3 === 0) ctx.sfx.tone({ f: 1200 + 40 * (c.ord % 9), dur: 0.05, vol: 0.025, type: "sine" }); }
        if (c.t >= T_FRUIT) {
          c.st = "bud"; c.t = 0; c.v = ctx.rng.int(0, s.kinds - 1); c.rot = ctx.rng.range(-0.4, 0.4);
          if (c.v === 2 && !s.thirdSaid) { s.thirdSaid = true; s.thirdAt = i; ctx.say("A third variety.", 2.6); }
        }
      } else if (c.st === "bud") {
        c.t += dt;
        if (c.t >= T_OPEN) { c.st = "open"; c.t = 0; }
      }
    }
    s.flash = approach(s.flash, 0, dt * 1.6);
    s.cheer = Math.max(0, s.cheer - dt);
    if (s.big) { s.big.t += dt; if (s.big.t > 1.6) s.big = null; }

    // the brush follows the finger (or the keyboard cursor), leaning as it moves
    const tx = s.useKb ? cxOf(s.cur) : inp.x, ty = s.useKb ? cyOf(s.cur) : inp.y;
    const k = s.useKb ? 1 - Math.exp(-dt * 18) : 1;
    const nx = lerp(s.bx, tx, k);
    s.bvx = lerp(s.bvx, (nx - s.bx) / dt, 1 - Math.exp(-dt * 10));
    s.bx = nx; s.by = lerp(s.by, ty, k);
    s.tilt = clamp(-s.bvx * 0.0007, -0.45, 0.45);

    if (s.phase === "end") {
      s.endT += dt;
      if (s.endT > s.endDelay && !s.endSaid) {
        s.endSaid = true;
        ctx.say(s.endWhy === "time" ? "Quarter past ten. The next shift is coming up the ladders." : "Eight strokes. Sunniva ticks your name off the rota.", 3);
        ctx.sfx.bell(s.score >= MARKS[1] ? 12 : 7);
        if (s.score >= MARKS[0]) s.cheer = 3;
      }
      if (s.endT > s.endDelay + 1.5) s.done = true;
      hud(s, ctx);
      return;
    }

    s.t += dt;
    if (s.said === 0 && s.t > 0.3) { s.said = 1; ctx.say("Drag from one kind to the other. Never the same kind twice running.", 4.5); }
    hud(s, ctx);
    const left = LIMIT - s.t;
    if (left <= 10 && left > 0 && Math.ceil(left) !== s.tickS) { s.tickS = Math.ceil(left); ctx.sfx.tick(); }
    if (left <= 0) {
      // the slot is over: a stroke in hand still counts
      if (s.chain.length >= 2) brush(s, ctx); else s.chain = [];
      s.drag = false;
      if (s.phase !== "end") { s.phase = "end"; s.endT = 0; s.endWhy = "time"; s.endDelay = s.big ? 1.1 : 0.35; }
      return;
    }

    // --- the keyboard: arrows move the cursor (two at once for a diagonal), Space starts and brushes ---
    if (inp.leftPressed || inp.rightPressed || inp.upPressed || inp.dnPressed) {
      if (!s.useKb) { s.useKb = true; if (!s.drag) s.chain = []; }
      if (s.kbPend <= 0) { s.kbPend = 0.07; s.kdx = 0; s.kdy = 0; }
    }
    if (s.kbPend > 0) {
      if (inp.leftPressed || inp.left) s.kdx = -1;
      if (inp.rightPressed || inp.right) s.kdx = 1;
      if (inp.upPressed || inp.up) s.kdy = -1;
      if (inp.dnPressed || inp.dn) s.kdy = 1;
      s.kbPend -= dt;
      if (s.kbPend <= 0) kbMove(s, ctx, s.kdx, s.kdy);
    }
    if (inp.actPressed && !s.drag) {
      s.useKb = true;
      if (!s.chain.length) { if (!startAt(s, ctx, s.cur)) blocked(s, ctx, s.cur); }
      else brush(s, ctx);
    }

    // --- the finger ---
    if (inp.ptrPressed) {
      s.useKb = false; s.drag = true; s.chain = []; s.lx = inp.x; s.ly = inp.y;
      touch(s, ctx, cellAt(inp.x, inp.y));
    } else if (inp.ptrDown && s.drag) {
      sweep(s, ctx, s.lx, s.ly, inp.x, inp.y); s.lx = inp.x; s.ly = inp.y;
    }
    if (inp.ptrReleased && s.drag) {
      sweep(s, ctx, s.lx, s.ly, inp.x, inp.y);
      s.drag = false;
      brush(s, ctx);
    }
    if (!s.useKb && inp.moved && !inp.ptrDown) { const i = cellAt(inp.x, inp.y); if (i >= 0) s.cur = i; }
  }

  function kbMove(s, ctx, dx, dy) {
    if (!dx && !dy) return;
    const c = s.cur % N + dx, r = Math.floor(s.cur / N) + dy;
    if (c < 0 || c >= N || r < 0 || r >= N) { ctx.sfx.tick(); return; }
    const i = r * N + c;
    if (s.chain.length) {
      const ch = s.chain;
      if (ch.length >= 2 && i === ch[ch.length - 2]) { undo(s, ctx); s.cur = i; return; }
      if (canAdd(s, i)) { addTo(s, ctx, i); s.cur = i; return; }
      if (isOpen(s, i) && ch.indexOf(i) < 0) blocked(s, ctx, i); else ctx.sfx.tick();
      return;
    }
    s.cur = i; ctx.sfx.tick();
  }

  function hud(s, ctx) {
    const mins = START_MIN + Math.min(LIMIT, s.t);
    ctx.hud.set("stroke " + Math.min(STROKES, s.strokes + 1) + " of " + STROKES + "\n" + fmtClock(mins) + " · 0.50 g", "set " + s.score + (s.longest ? "\nlongest " + s.longest : ""));
  }

  /* ---- drawing ---- */
  function drawBlossom(g, x, y, R, v, rot, open) {
    const K = KINDS[v];
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(open, open);
    if (v === 0) {
      // round and five-petalled, white
      for (let k = 0; k < 5; k++) { const a = k * TAU / 5 - Math.PI / 2; disc(g, Math.cos(a) * R * 0.5 + 2, Math.sin(a) * R * 0.5 + 3, R * 0.5, K.petal2); }
      for (let k = 0; k < 5; k++) { const a = k * TAU / 5 - Math.PI / 2; disc(g, Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5, R * 0.47, K.petal); }
      disc(g, 0, 0, R * 0.27, K.eye);
      for (let k = 0; k < 9; k++) { const a = k * TAU / 9; disc(g, Math.cos(a) * R * 0.2, Math.sin(a) * R * 0.2, R * 0.055, K.dot); }
    } else if (v === 1) {
      // a pointed star, pink
      for (let k = 0; k < 5; k++) {
        g.save(); g.rotate(k * TAU / 5);
        g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(R * 0.5, -R * 0.42, 0, -R * 1.06); g.quadraticCurveTo(-R * 0.5, -R * 0.42, 0, 0); g.fillStyle = K.petal; g.fill();
        g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(R * 0.16, -R * 0.4, 0, -R * 0.78); g.quadraticCurveTo(-R * 0.16, -R * 0.4, 0, 0); g.fillStyle = K.petal2; g.fill();
        g.restore();
      }
      disc(g, 0, 0, R * 0.2, K.eye);
      for (let k = 0; k < 7; k++) { const a = k * TAU / 7; disc(g, Math.cos(a) * R * 0.24, Math.sin(a) * R * 0.24, R * 0.06, K.dot); }
    } else {
      // four broad heart-shaped petals, crimson
      for (let k = 0; k < 4; k++) {
        g.save(); g.rotate(k * TAU / 4 + Math.PI / 4);
        g.beginPath(); g.moveTo(0, 0);
        g.bezierCurveTo(-R * 0.82, -R * 0.3, -R * 0.66, -R * 1.08, 0, -R * 0.8);
        g.bezierCurveTo(R * 0.66, -R * 1.08, R * 0.82, -R * 0.3, 0, 0);
        g.fillStyle = K.petal; g.fill();
        g.beginPath(); g.moveTo(0, 0);
        g.bezierCurveTo(-R * 0.3, -R * 0.2, -R * 0.26, -R * 0.55, 0, -R * 0.5);
        g.bezierCurveTo(R * 0.26, -R * 0.55, R * 0.3, -R * 0.2, 0, 0);
        g.fillStyle = K.petal2; g.fill();
        g.restore();
      }
      disc(g, 0, 0, R * 0.24, K.eye);
      for (let k = 0; k < 6; k++) { const a = k * TAU / 6; disc(g, Math.cos(a) * R * 0.13, Math.sin(a) * R * 0.13, R * 0.05, K.dot); }
    }
    g.restore();
  }

  function drawPetal(g, p) {
    const k = p.age / p.life;
    g.globalAlpha = 1 - smooth(0.7, 1, k);
    g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
    const flip = Math.abs(Math.cos(p.age * 3 + p.ph));
    g.beginPath();
    if (p.kind === 1) { g.moveTo(-p.sz, 0); g.quadraticCurveTo(0, -p.sz * 0.6 * flip - 1, p.sz, 0); g.quadraticCurveTo(0, p.sz * 0.6 * flip + 1, -p.sz, 0); }
    else g.ellipse(0, 0, p.sz * 0.8, Math.max(1.5, p.sz * 0.62 * flip), 0, 0, TAU);
    g.fillStyle = p.col; g.fill();
    g.restore();
    g.globalAlpha = 1;
  }

  function drawLeaves(g, i, x, y) {
    const r = makeRng(1301 + i * 37);
    for (let k = 0; k < 3; k++) {
      const a = r.range(0, TAU), L = r.range(40, 58);
      g.save(); g.translate(x + Math.cos(a) * 22, y + Math.sin(a) * 22); g.rotate(a + Math.PI / 2);
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * 0.42, -L * 0.5, 0, -L); g.quadraticCurveTo(-L * 0.42, -L * 0.5, 0, 0);
      g.fillStyle = LEAF[k % 3]; g.fill();
      g.restore();
    }
  }

  function drawBack(g, s, pal) {
    // the gold field
    g.fillStyle = pal.a; g.fillRect(0, 0, SW, SH);
    // overhead: Moth's lawns on the far bank, full sun
    g.save(); g.beginPath(); g.rect(0, 0, SW, 152); g.clip();
    hollowBack(g, { pal, sun: 1, far: MOTH ? MOTH.a : "#8f7a95", farDots: MOTH ? MOTH.aL : "#c7b8cc", horizon: 330, near: pal.aD, near2: pal.aL, seed: 4 });
    g.restore();
    // the far end of the orchard: a line of round trees
    const r = makeRng(77);
    for (let k = 0; k < 15; k++) { const x = k * 72 + r.range(-12, 12), rr = r.range(26, 40); disc(g, x, 150 - rr * 0.45, rr, shade(pal.a, -0.42)); }
    g.fillStyle = shade(pal.a, -0.22); g.fillRect(0, 148, SW, 12);
    // a few rows of mown gold
    for (let k = 0; k < 7; k++) { g.fillStyle = alpha(shade(pal.a, k % 2 ? 0.12 : -0.08), 0.5); g.fillRect(0, 160 + k * 130, SW, 64); }
  }

  function drawEspalier(g, pal) {
    const x0 = GX - 16, x1 = GX + N * CELL + 14;
    // wires and the trained arms of the trees along them
    for (let r = 0; r < N; r++) {
      const y = GY + (r + 0.5) * CELL;
      seg(g, x0, y - 4, x1, y - 4, 3, pal.b);
      g.beginPath(); g.moveTo(x0, y + 4);
      for (let k = 1; k <= 24; k++) { const x = lerp(x0, x1, k / 24); g.lineTo(x, y + 4 + Math.sin(k * 1.7 + r * 2.1) * 4); }
      g.lineWidth = 12 - r % 2 * 2; g.strokeStyle = "#2b2118"; g.lineCap = "round"; g.stroke();
    }
    // the trunks rising between the rows, and the posts
    for (const c of [1.5, 4.5]) { const x = GX + c * CELL; seg(g, x, GY + 0.5 * CELL, x, SH + 20, 18, "#2b2118"); }
    for (const x of [x0, GX + 3 * CELL, x1]) { fillRR(g, x - 8, GY - 26, 16, SH - GY + 40, 4, pal.b); disc(g, x, GY - 26, 9, pal.b); }
  }

  function drawFruitlet(g, x, y, k) {
    // a small green apple-to-be, with the dried calyx on top
    const r = 15 * easeBack(clamp(k * 3, 0, 1));
    if (r <= 0) return;
    disc(g, x, y + 4, r, "#7aa43a");
    disc(g, x - r * 0.3, y + 4 - r * 0.3, r * 0.35, "#a8cd5c");
    seg(g, x, y + 4 - r, x + 3, y - r - 5, 3, "#4a3a22");
  }

  function drawLadder(g, s, pal) {
    // a step-ladder at the end of the row, and a young brusher on it
    const bx = 92, top = 600;
    seg(g, bx - 8, top, bx - 58, SH + 10, 11, "#6b4b2a");
    seg(g, bx + 8, top, bx + 64, SH + 10, 11, "#5a3e22");
    for (let k = 1; k <= 4; k++) { const y = top + k * 80, w = 8 + k * 13; seg(g, bx - w, y, bx + w, y, 9, "#7a5733"); }
    fillRR(g, bx - 22, top - 10, 44, 14, 5, "#7a5733");
    const cheer = s.cheer > 0;
    const hand = person(g, bx, top + 80, 250, {
      view: "side", face: 1, child: true, shirt: pal.b, legs: shade(pal.b, 0.18), sash: pal.a, skin: SKINS[2], hair: HAIRS[1],
      pose: cheer ? "cheer" : "stand", t: s.t + s.endT,
      handTo: cheer ? null : [bx + 70, top - 40 + Math.sin(s.t * 2) * 6],
    });
    // their own soft brush, held up
    const hx = hand.hx0, hy = hand.hy0;
    seg(g, hx, hy, hx + 26, hy - 44, 6, "#7a5733");
    g.beginPath(); g.ellipse(hx + 31, hy - 54, 8, 13, 0.55, 0, TAU); g.fillStyle = "#f0e2c0"; g.fill();
    disc(g, hx + 34, hy - 60, 5, POLLEN);
  }

  function drawClock(g, s, pal) {
    const x = 500, y = 70, r = 44;
    const mins = START_MIN + Math.min(LIMIT, s.t), left = clamp(1 - s.t / LIMIT, 0, 1);
    disc(g, x, y, r + 10, pal.b);
    g.beginPath(); g.moveTo(x, y); g.arc(x, y, r + 6, -Math.PI / 2, -Math.PI / 2 + TAU * left); g.closePath();
    g.fillStyle = left < 0.14 && Math.sin(s.t * 10) > 0 ? "#f6e3a0" : pal.a; g.fill();
    disc(g, x, y, r - 2, PAPER);
    for (let k = 0; k < 12; k++) { const a = k * TAU / 12; seg(g, x + Math.sin(a) * (r - 9), y - Math.cos(a) * (r - 9), x + Math.sin(a) * (r - 4), y - Math.cos(a) * (r - 4), k % 3 ? 2 : 4, pal.b); }
    const ma = (mins % 60) / 60 * TAU, ha = ((mins / 60) % 12) / 12 * TAU;
    seg(g, x, y, x + Math.sin(ha) * r * 0.5, y - Math.cos(ha) * r * 0.5, 6, pal.b);
    seg(g, x, y, x + Math.sin(ma) * r * 0.78, y - Math.cos(ma) * r * 0.78, 4, pal.b);
    disc(g, x, y, 5, pal.a);
    // the eight strokes of the rota slot
    for (let k = 0; k < STROKES; k++) {
      const px = x - (STROKES - 1) * 13 + k * 26, py = y + r + 28;
      if (k < s.strokes) disc(g, px, py, 8, pal.b); else ring(g, px, py, 6.5, 3, pal.b);
    }
  }

  function drawBrush(g, s) {
    const x = s.bx, y = s.by, a = 0.5 + s.tilt;           // the stick runs down and to the right
    const ex = x + Math.sin(a) * 210, ey = y + Math.cos(a) * 210;
    const fx = x + Math.sin(a) * 40, fy = y + Math.cos(a) * 40;
    seg(g, fx, fy, ex, ey, 11, "#7a5733");
    seg(g, fx, fy, ex, ey, 4, alpha("#a07a4c", 0.8));
    seg(g, fx - Math.sin(a) * 6, fy - Math.cos(a) * 6, fx + Math.sin(a) * 10, fy + Math.cos(a) * 10, 15, "#2b2118");
    // the soft head, dusted with whatever it last touched
    const ch = s.chain, last = ch.length ? KINDS[s.cells[ch[ch.length - 1]].v] : null;
    g.save(); g.translate(x + Math.sin(a) * 18, y + Math.cos(a) * 18); g.rotate(-a);
    g.beginPath(); g.ellipse(0, 0, 17, 27, 0, 0, TAU); g.fillStyle = "#f3e6c6"; g.fill();
    g.beginPath(); g.ellipse(0, -12, 13, 13, 0, 0, TAU); g.fillStyle = last ? POLLEN : "#f8efd6"; g.fill();
    if (last) disc(g, 4, -16, 5, last.dust);
    g.restore();
  }

  function draw(s, g, ctx) {
    const pal = ctx.pal;
    drawBack(g, s, pal);
    drawEspalier(g, pal);
    drawLadder(g, s, pal);
    spinMark(g, 78, 236, alpha(INK, 0.6), 1, 20);

    const ch = s.chain, last = ch.length ? ch[ch.length - 1] : -1;
    const inChain = new Set(ch);
    const pulse = 0.55 + 0.45 * Math.sin(s.t * 6 + s.endT * 6);
    // leaves, then the faint glow of the blossoms the brush can go to next
    for (let i = 0; i < N * N; i++) drawLeaves(g, i, cxOf(i), cyOf(i));
    if (last >= 0 && s.phase === "play") for (const j of NB[last]) if (canAdd(s, j)) glow(g, cxOf(j), cyOf(j), BR * 1.45, "#fff7d6", 0.55 * pulse + 0.25);
    // the pollen line along the stroke, out to the brush
    if (ch.length) {
      g.lineJoin = "round"; g.lineCap = "round";
      g.beginPath(); g.moveTo(cxOf(ch[0]), cyOf(ch[0]));
      for (let k = 1; k < ch.length; k++) g.lineTo(cxOf(ch[k]), cyOf(ch[k]));
      g.lineWidth = 30; g.strokeStyle = alpha(POLLEN, 0.4); g.stroke();
      g.lineWidth = 11; g.strokeStyle = alpha(POLLEN, 0.95); g.stroke();
      if (s.drag || s.useKb) seg(g, cxOf(last), cyOf(last), s.useKb ? cxOf(s.cur) : s.bx, s.useKb ? cyOf(s.cur) : s.by, 8, alpha(POLLEN, 0.5));
      for (let k = 0; k < ch.length; k++) glow(g, cxOf(ch[k]), cyOf(ch[k]), BR * 1.3, "#fff4b0", 0.7);
    }
    // the blossoms
    for (let i = 0; i < N * N; i++) {
      const c = s.cells[i], x = cxOf(i) + Math.sin(s.t * 60) * 7 * c.shake, y = cyOf(i);
      if (c.st === "open") {
        const sc = 1 + 0.16 * Math.sin(Math.max(0, c.pop) * Math.PI) + (c.pop < 0 ? 0.08 * c.pop : 0) + (inChain.has(i) ? 0.06 : 0);
        drawBlossom(g, x, y, BR, c.v, c.rot + (inChain.has(i) ? 0.12 : 0), sc);
        if (inChain.has(i)) for (let k = 0; k < 6; k++) { const a = k * 1.07 + i; disc(g, x + Math.cos(a) * BR * 0.36, y + Math.sin(a) * BR * 0.36, 3.2, POLLEN); }
      } else if (c.st === "set") {
        if (c.t < 0) drawBlossom(g, x, y, BR, c.v, c.rot, 1.06);
        else {
          disc(g, x, y, 9, "#6b5a2a");
          drawFruitlet(g, x, y, c.t / T_FRUIT);
        }
      } else {
        const k = c.t / T_OPEN;
        disc(g, x, y + 3, 9 * (1 - k), "#7aa43a");
        drawBlossom(g, x, y, BR, c.v, c.rot - 0.8 * (1 - k), Math.max(0.05, easeBack(k)));
      }
    }
    // the running count: big, by the last blossom
    if (ch.length >= 1 && s.phase === "play") {
      const x = clamp(cxOf(last) + 56, GX + 40, GX + N * CELL - 30), y = clamp(cyOf(last) - 58, GY + 10, SH - 60);
      const n = ch.length, rr = n >= 10 ? 44 : 38;
      disc(g, x, y, rr + 4 + (n >= 12 ? 3 * pulse : 0), PAPER);
      disc(g, x, y, rr, pal.b);
      sign(g, String(n), x, y + rr * 0.42, rr * 1.25, n >= 2 ? pal.a : PAPER, "center", 800);
    }
    // keyboard cursor
    if (s.useKb && s.phase === "play") { rrect(g, cxOf(s.cur) - CELL / 2 + 6, cyOf(s.cur) - CELL / 2 + 6, CELL - 12, CELL - 12, 18); g.lineWidth = 6; g.strokeStyle = alpha(INK, 0.8); g.stroke(); }

    for (const p of s.petals) drawPetal(g, p);
    s.parts.draw(g);
    if (s.phase === "play" || s.endT < 0.3) drawBrush(g, s);
    drawClock(g, s, pal);

    if (s.flash > 0) { g.fillStyle = alpha("#fff6d0", 0.32 * s.flash); g.fillRect(0, 0, SW, SH); }
    if (s.big) {
      // a long stroke: a black board across the rows, gold figures
      const k = easeBack(clamp(s.big.t / 0.35, 0, 1)), a = 1 - smooth(1.2, 1.7, s.big.t);
      g.globalAlpha = a;
      g.save(); g.translate(GX + N * CELL / 2, GY + N * CELL / 2 - 30); g.scale(k, k);
      fillRR(g, -380, -105, 760, 190, 22, alpha(pal.b, 0.9));
      sign(g, s.big.n + " IN ONE STROKE", 0, 8, 92, pal.a, "center", 800);
      sign(g, s.big.word.toUpperCase(), 0, 62, 38, PAPER, "center", 700);
      g.restore(); g.globalAlpha = 1;
    }
    s.notes.draw(g);

    if (s.phase === "end") {
      const k = smooth(s.endDelay, s.endDelay + 0.5, s.endT);
      g.fillStyle = alpha(pal.b, 0.55 * k); g.fillRect(0, 0, SW, SH);
      g.globalAlpha = k;
      sign(g, s.score + " SET", 500, 520, 170, pal.a, "center", 800);
      sign(g, "LONGEST STROKE " + s.longest, 500, 600, 50, PAPER, "center", 700);
      g.globalAlpha = 1;
    }
  }

  /* ---- the house plays ----
     Skill 1 searches: from every open blossom, depth first, trying the neighbour with the fewest
     onward moves first, under a node budget; it then draws the longest stroke it found.
     Lower skill takes the first short chain it sees, caps its length and stops to think. */
  function planLong(s, maxLen, budget) {
    const open = [];
    for (let i = 0; i < N * N; i++) if (isOpen(s, i)) open.push(i);
    const used = new Uint8Array(N * N);
    let best = [], nodes = 0;
    const path = [];
    const onward = (j) => { let n = 0; for (const q of NB[j]) if (!used[q] && isOpen(s, q) && s.cells[q].v !== s.cells[j].v) n++; return n; };
    function dfs(lim) {
      nodes++;
      if (path.length > best.length) best = path.slice();
      if (path.length >= maxLen || nodes > lim) return;
      const last = path[path.length - 1];
      const nx = [];
      for (const j of NB[last]) if (!used[j] && isOpen(s, j) && s.cells[j].v !== s.cells[last].v) nx.push(j);
      nx.sort((a, b) => onward(a) - onward(b));
      for (const j of nx) {
        used[j] = 1; path.push(j);
        dfs(lim);
        path.pop(); used[j] = 0;
        if (best.length >= maxLen || nodes > lim) return;
      }
    }
    // start where options are fewest: a long path wants to begin at an end
    const starts = open.slice().sort((a, b) => onward(a) - onward(b));
    const per = Math.max(60, Math.floor(budget / Math.max(1, starts.length)));
    for (const st of starts) {
      used[st] = 1; path.push(st);
      const lim = nodes + per;
      dfs(lim);
      path.pop(); used[st] = 0;
      if (best.length >= maxLen) break;
    }
    return best;
  }

  function planShort(s, ctx, cap) {
    const open = [];
    for (let i = 0; i < N * N; i++) if (isOpen(s, i)) open.push(i);
    for (let tries = 0; tries < 12; tries++) {
      const p = [ctx.rng.pick(open)];
      while (p.length < cap) {
        const last = p[p.length - 1];
        const nx = NB[last].filter((j) => isOpen(s, j) && p.indexOf(j) < 0 && s.cells[j].v !== s.cells[last].v);
        if (!nx.length) break;
        p.push(ctx.rng.pick(nx));
      }
      if (p.length >= 2) return p;
    }
    return [];
  }

  function bot(s, b, ctx) {
    const sk = ctx.skill;
    const B = s._bot || (s._bot = { mode: "wait", t: 0, x: 600, y: 900, path: null, k: 0, pause: 0, wait: 0.4 });
    const ease = (tx, ty, rate) => { B.x = lerp(B.x, tx, 1 - Math.exp(-rate / 120)); B.y = lerp(B.y, ty, 1 - Math.exp(-rate / 120)); };
    b.x = B.x; b.y = B.y;
    if (s.phase !== "play") { B.mode = "wait"; return; }
    const dt = 1 / 120;
    if (B.mode === "wait") {
      ease(820, 620, 3);
      let ready = !s.chain.length;
      for (let i = 0; i < N * N && ready; i++) if (!isOpen(s, i)) ready = false;
      if (!ready) { B.t = 0; return; }
      B.t += dt;
      if (B.t < B.wait) return;
      let path;
      if (sk >= 0.8) path = planLong(s, 36, Math.round(4000 + 36000 * sk));
      else if (sk >= 0.6) path = planLong(s, Math.round(8 + 25 * (sk - 0.5)), 600);
      else path = planShort(s, ctx, Math.max(2, Math.round(4 + 10 * sk + ctx.rng.range(-1, 2))));
      if (path.length < 2) { B.t = 0; return; }
      B.path = path; B.k = 0; B.mode = "move"; B.t = 0;
    }
    if (B.mode === "move") {
      const tx = cxOf(B.path[0]), ty = cyOf(B.path[0]);
      ease(tx, ty, 14);
      B.t += dt;
      if (B.t > 0.3) { B.x = tx; B.y = ty; B.mode = "draw"; B.t = 0; B.k = 0; b.x = B.x; b.y = B.y; }
      else { b.x = B.x; b.y = B.y; }
      return;
    }
    if (B.mode === "draw") {
      b.down = true;
      const per = sk >= 0.8 ? 0.12 : 0.17;
      if (B.pause > 0) { B.pause -= dt; b.x = B.x; b.y = B.y; return; }
      B.t += dt / per;
      if (B.t >= 1) {
        B.t -= 1; B.k++;
        if (sk < 0.8 && ctx.rng() < 0.25 * (1 - sk)) B.pause = ctx.rng.range(0.2, 0.6);
      }
      if (B.k >= B.path.length - 1) {
        const e = B.path[B.path.length - 1];
        B.x = cxOf(e); B.y = cyOf(e); b.x = B.x; b.y = B.y;
        B.mode = "lift"; B.t = 0;
        return;
      }
      const a = B.path[B.k], c = B.path[B.k + 1], u = easeInOut(B.t);
      B.x = lerp(cxOf(a), cxOf(c), u); B.y = lerp(cyOf(a), cyOf(c), u);
      b.x = B.x; b.y = B.y;
      return;
    }
    if (B.mode === "lift") {
      B.t += dt;
      if (B.t < 0.06) { b.down = true; return; }
      B.mode = "wait"; B.t = 0; B.wait = sk >= 0.8 ? 0.25 + (1 - sk) * 1.5 : ctx.rng.range(0.5, 1.4);
    }
  }

  const MARKS = [55, 100, 140];
  registerEvent({
    id: "bee", hour: 4, name: "Brush Rows",
    place: "Bee's orchard rows on the Hollow floor · deck 376 · 0.50 g",
    intro: "Nothing in Sorrel carries pollen but people. Apple blossom sets only with pollen from another variety, so Bee's brushers work the espalier rows with soft brushes, one kind to the other, flower by flower. One long stroke does more than ten short ones.",
    how: "Press on a blossom and drag through its neighbours, changing kind at every step. Let go to brush the whole stroke.",
    keys: "arrows to move, Space to start a stroke, arrows to extend it, Space to brush",
    marks: MARKS, unit: "blossoms", fmt: (v) => String(v),
    result: (s) => s.score + " blossoms set, longest stroke " + s.longest,
    create, update, draw, bot,
  });
})();
