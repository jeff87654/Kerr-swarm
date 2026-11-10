/* ---------- Lark: Lamp-dawn Crepes ----------
   Lark's stair-heads sell crepes from six. On its day the hotplate climbs the wedge: six stops, from a
   Low-deck stair-head to the top of the end wall, two crepes at each. The wrist is the same at every
   stop (2.6 m/s). The drum is not: the lighter it gets, the longer a crepe hangs and the further
   spinward it comes down, and the worse your feet grip when you go after it.
   Toss straight up at v where weight is g: up for 2v/g seconds, down (4/3) W v^3 / g^2 spinward. */
"use strict";
(function () {
  const STOPS = [
    { name: "Deck 40", sub: "a Low-deck stair-head", gf: 0.95, kind: "deck", scale: 215, say: "Deck 40. It comes straight back down. Mostly." },
    { name: "Deck 150", sub: "the Middle decks", gf: 0.80, kind: "deck", scale: 215, say: "Deck 150, four-fifths of a g. A little higher, a little longer." },
    { name: "Deck 260", sub: "two-thirds of a g", gf: 0.65, kind: "deck", scale: 215, say: "Deck 260. Watch which way it drifts." },
    { name: "The Hollow floor", sub: "half a g", gf: 0.50, kind: "floor", scale: 200, say: "The Hollow floor, half a g. Follow it spinward." },
    { name: "The Third", sub: "the end wall, a third of a g", gf: 0.33, kind: "wall", scale: 178, say: "The Third. Start walking when you toss." },
    { name: "The Tenth", sub: "the end wall, a tenth of a g", gf: 0.10, kind: "wall", scale: 130, say: "The Tenth. It lands a good stride spinward, and your feet hardly grip. Go early." },
  ];
  const PER_STOP = 2, TOTAL = STOPS.length * PER_STOP;
  const V_TOSS = 2.6;                 // m/s
  const PAN_H = 1.0, PAN_R = 0.17;    // metres: pan height above the floor, pan radius
  const REACH = 0.44;                 // the pan is held this far in front of the cook
  const T_GOLD = 1.45;                // seconds on the plate to reach golden (doneness 1.0)
  const GOLD_LO = 0.74, GOLD_HI = 1.12, BURNT = 1.5;
  const FLOOR_Y = 838;
  const CREPE_COL = ["#f4e8c6", "#ecc978", "#dba043", "#9a652c", "#3a2a1e"];

  function doneCol(a) {
    const k = clamp(a, 0, 1.6);
    if (k < 0.74) return mix(CREPE_COL[0], CREPE_COL[1], k / 0.74);
    if (k < 1.0) return mix(CREPE_COL[1], CREPE_COL[2], (k - 0.74) / 0.26);
    if (k < 1.3) return mix(CREPE_COL[2], CREPE_COL[3], (k - 1.0) / 0.3);
    return mix(CREPE_COL[3], CREPE_COL[4], clamp((k - 1.3) / 0.25, 0, 1));
  }

  function create(ctx) {
    const s = {
      t: 0, stop: 0, nAt: 0, made: 0, served: 0, golden: 0, score: 0, done: false,
      phase: "cook",                       // "cook" | "travel" | "end"
      travelT: 0, endT: 0,
      cook: { x: -0.55, v: 0, walk: 0 }, tx: -0.55, kb: false,
      cr: null, parts: new Parts(200), notes: new Notes(), sizzleT: 0, said: -1,
      queueSeed: ctx.rng.int(0, 9999), leaving: [],
    };
    newCrepe(s);
    return s;
  }

  function newCrepe(s) {
    s.cr = { state: "pour", t: 0, a: 0, b: 0, x: 0, y: PAN_H, vx: 0, vy: 0, rot: 0, spin: 0, side: 0 };
  }

  const stopOf = (s) => STOPS[Math.min(s.stop, STOPS.length - 1)];
  const panX = (s) => s.cook.x + REACH;

  // where a crepe now in the air will come back down to pan height
  function landingX(s) {
    const c = s.cr, g = gAt(DRUM.R) * stopOf(s).gf;
    const p = { x: c.x, y: c.y, vx: c.vx, vy: c.vy };
    for (let i = 0; i < 3000; i++) { spinStep(p, 1 / 240, g); if (p.vy < 0 && p.y <= PAN_H) break; }
    return p.x;
  }

  function finishCrepe(s, ctx, points, word, good) {
    const st = stopOf(s), sc = st.scale;
    s.made++; s.nAt++;
    if (points > 0) { s.served++; s.score += points; if (points >= 1) s.golden++; }
    s.notes.add(word, 500 + panX(s) * sc, FLOOR_Y - PAN_H * sc - 70, { good });
    if (points >= 1) ctx.sfx.chime(Math.min(10, s.golden)); else if (points > 0) ctx.sfx.good(); else ctx.sfx.bad();
    if (s.made >= TOTAL) { s.phase = "end"; s.endT = 0; s.cr = null; return; }
    if (s.nAt >= PER_STOP) { s.phase = "travel"; s.travelT = 0; s.cr = null; ctx.sfx.whoosh(1.4); return; }
    newCrepe(s);
  }

  function update(s, dt, inp, ctx) {
    s.t += dt;
    const st = stopOf(s), sc = st.scale, g = DRUM.G0 * st.gf;
    s.parts.update(dt);
    s.notes.update(dt);
    for (let i = s.leaving.length - 1; i >= 0; i--) { s.leaving[i].t += dt; if (s.leaving[i].t > 1.4) s.leaving.splice(i, 1); }
    ctx.hud.set(st.name + "\n" + fmtG(st.gf), "served " + s.served + " of " + TOTAL);

    if (s.phase === "end") { s.endT += dt; if (s.endT > 1.5) s.done = true; return; }
    if (s.phase === "travel") {
      s.travelT += dt;
      s.cook.v = 0; s.cook.x = lerp(s.cook.x, -0.55, 1 - Math.exp(-dt * 6)); s.tx = s.cook.x;
      if (s.travelT >= 1.15) { s.stop++; s.nAt = 0; s.phase = "cook"; newCrepe(s); }
      return;
    }
    if (s.said !== s.stop) { s.said = s.stop; ctx.say(st.say, 3.2); }

    // --- the cook: walks toward the pointer (or with the arrows), as fast as their feet can grip ---
    const half = 500 / sc - 0.25;
    if (inp.ax !== 0) { s.kb = true; s.tx = s.cook.x + inp.ax * 4; }
    else if (inp.moved || inp.ptrDown) { s.kb = false; s.tx = (inp.x - 500) / sc - REACH; }
    else if (s.kb) s.tx = s.cook.x + s.cook.v * Math.abs(s.cook.v) / (2 * 0.9 * g);  // let go of the arrows: stop as soon as grip allows
    s.tx = clamp(s.tx, -half, half - REACH);
    const grip = 0.9 * g, vmax = 3.2;
    const dx = s.tx - s.cook.x;
    const want = Math.sign(dx) * Math.min(vmax, Math.sqrt(2 * grip * Math.abs(dx)) * 0.96);
    s.cook.v = approach(s.cook.v, want, grip * dt);
    s.cook.x += s.cook.v * dt;
    s.cook.walk += Math.abs(s.cook.v) * dt;

    // --- the crepe ---
    const c = s.cr; if (!c) return;
    c.t += dt;
    if (c.state === "pour") {
      c.x = panX(s); c.y = PAN_H;
      if (c.t === dt) ctx.sfx.pour();
      if (c.t > 0.38) { c.state = "pan"; c.t = 0; }
    } else if (c.state === "pan") {
      c.x = panX(s); c.y = PAN_H;
      c.a += dt / T_GOLD;
      s.sizzleT -= dt; if (s.sizzleT <= 0) { s.sizzleT = 0.3; ctx.sfx.sizzle(); }
      if (ctx.rng() < dt * 14) s.parts.add({ x: 500 + c.x * sc + ctx.rng.range(-0.12, 0.12) * sc, y: FLOOR_Y - PAN_H * sc - 6, vx: ctx.rng.range(-8, 8), vy: -ctx.rng.range(30, 60), life: 0.7, r: 5, col: PAPER, a: 0.28, grow: 1.5 });
      if (inp.pressed && c.a > 0.3) {
        c.state = "air"; c.t = 0; c.vy = V_TOSS; c.vx = s.cook.v * 0.5 + ctx.rng.sign() * ctx.rng.range(0.1, 0.24);
        c.flight = 2 * V_TOSS / g;
        c.turns = c.flight < 1.2 ? 0.5 : c.flight < 3 ? 1.5 : 2.5;      // it always lands the other side up
        ctx.sfx.whoosh(0.5 + 0.2 * c.flight);
      } else if (c.a >= BURNT) {
        for (let i = 0; i < 14; i++) s.parts.add({ x: 500 + c.x * sc + ctx.rng.range(-20, 20), y: FLOOR_Y - PAN_H * sc, vx: ctx.rng.range(-20, 20), vy: -ctx.rng.range(40, 110), life: 1.1, r: 9, col: "#2b2622", a: 0.6, grow: 1.6 });
        finishCrepe(s, ctx, 0, "burnt", false);
      }
    } else if (c.state === "air") {
      const p = c; spinStep(p, dt, g);
      c.rot = Math.min(1, c.t / c.flight) * c.turns * TAU;
      if (c.vy < 0 && c.y <= PAN_H) {
        if (Math.abs(c.x - panX(s)) <= PAN_R + 0.03) {
          c.state = "panB"; c.t = 0; c.y = PAN_H; c.side = 1; c.rot = 0; ctx.sfx.clack();
        } else { c.state = "fall"; }
      }
    } else if (c.state === "fall") {
      spinStep(c, dt, g);
      c.rot += dt * 5;
      if (c.y <= 0.02) {
        ctx.sfx.thud(0.5);
        for (let i = 0; i < 8; i++) s.parts.add({ x: 500 + c.x * sc, y: FLOOR_Y - 4, vx: ctx.rng.range(-90, 90), vy: -ctx.rng.range(20, 90), g: 500 * st.gf, life: 0.6, r: 4, col: doneCol(c.a) });
        s.splat = { x: c.x, a: c.a, t: 0 };
        finishCrepe(s, ctx, 0, "dropped", false);
      }
    } else if (c.state === "panB") {
      c.x = panX(s); c.y = PAN_H;
      c.b += dt / 0.5;
      if (c.t > 0.5) { c.state = "serve"; c.t = 0; c.fromX = c.x; }
    } else if (c.state === "serve") {
      const k = easeInOut(c.t / 0.36);
      const custX = queueX(s, 0);
      c.x = lerp(c.fromX, custX - 0.2, k); c.y = PAN_H + 0.25 * Math.sin(k * Math.PI);
      if (c.t >= 0.36) {
        const goldenA = c.a >= GOLD_LO && c.a <= GOLD_HI;
        if (s.nAt % PER_STOP === PER_STOP - 1) s.leaving.push({ seed: s.queueSeed + s.made, t: 0, x: custX });
        finishCrepe(s, ctx, goldenA ? 1 : 0.6, goldenA ? "golden" : c.a < GOLD_LO ? "pale" : "dark", goldenA);
      }
    }
    if (s.splat) { s.splat.t += dt; if (s.splat.t > 2.5) s.splat = null; }
  }

  // customers wait a little way spinward of the plate
  function queueX(s, i) { return 500 / stopOf(s).scale - 1.2 + i * 0.52; }

  /* ---- drawing ---- */
  function drawBack(g, st, pal, t, oy) {
    g.save(); g.translate(0, oy);
    if (st.kind === "deck") {
      g.fillStyle = pal.aD; g.fillRect(0, -40, SW, FLOOR_Y + 40);
      g.fillStyle = shade(pal.a, -0.5); g.fillRect(0, FLOOR_Y - 150, SW, 150);              // dado
      g.fillStyle = shade(pal.a, -0.2); g.fillRect(0, FLOOR_Y - 156, SW, 8);
      // the stair-head: a rail and the stair going down behind the cook
      for (let i = 0; i < 7; i++) seg(g, 40 + i * 44, FLOOR_Y - 150 + i * 22, 40 + i * 44, FLOOR_Y, 7, pal.b);
      seg(g, 20, FLOOR_Y - 170, 330, FLOOR_Y - 15, 12, pal.bL);
      // lamps coming up for the day, warm then white
      for (const lx of [250, 750]) { seg(g, lx, 0, lx, 92, 3, shade(pal.a, -0.6)); lamp(g, lx, 100, 13, "#ffe3a8", 9); }
      sign(g, st.name.toUpperCase(), 500, 300, 128, alpha(PAPER, 0.92), "center", 800);
      mono(g, fmtG(st.gf) + "  ·  " + st.sub, 500, 352, 27, alpha(PAPER, 0.75));
    } else {
      // out in the Hollow at lamp-dawn: the far bank overhead (Otter, and its lake), the land curling up at both sides
      const hz = st.kind === "floor" ? 690 : 1400;
      hollowBack(g, { pal, sun: 0.42, far: "#3f7f93", farDots: "#9fd0dc", horizon: hz, seed: st.name.length });
      if (st.kind === "floor") {
        // the bandstand, a long way off
        fillRR(g, 742, 660, 96, 10, 3, pal.b); for (let i = 0; i < 4; i++) seg(g, 752 + i * 25, 660, 752 + i * 25, 632, 4, pal.b);
        g.beginPath(); g.moveTo(736, 634); g.quadraticCurveTo(790, 590, 844, 634); g.closePath(); g.fillStyle = pal.b; g.fill();
      } else {
        // a terrace on the end wall: the Hollow runs away below like the inside of a lit pipe
        for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(500, 560, 620 - i * 92, 330 - i * 50, 0, 0, Math.PI); g.lineWidth = 26 - i * 3; g.strokeStyle = alpha(i % 2 ? pal.a : pal.aL, 0.5 - i * 0.05); g.stroke(); }
        for (let i = 0; i <= 12; i++) seg(g, i * 84 - 4, FLOOR_Y - 96, i * 84 - 4, FLOOR_Y, 6, pal.b);
        seg(g, -10, FLOOR_Y - 98, SW + 10, FLOOR_Y - 98, 10, pal.bL);
        if (st.gf < 0.2) for (let i = 0; i < 5; i++) {                                         // the top gardens: beans on strings
          const bx = 60 + i * 34; seg(g, bx, 150, bx, FLOOR_Y, 2, shade(pal.b, 0.2));
          for (let j = 0; j < 9; j++) { g.beginPath(); g.ellipse(bx + (j % 2 ? 9 : -9), 190 + j * 68 + i * 9, 11, 6, j % 2 ? 0.5 : -0.5, 0, TAU); g.fillStyle = pal.a; g.fill(); }
        }
      }
      sign(g, st.name.toUpperCase(), 500, 250, 96, alpha(INK, 0.82), "center", 800);
      mono(g, fmtG(st.gf) + "  ·  " + st.sub, 500, 296, 25, alpha(INK, 0.7));
    }
    // the floor, and which way is spinward
    g.fillStyle = st.kind === "deck" ? pal.b : shade(PAPER, -0.12); g.fillRect(0, FLOOR_Y, SW, SH - FLOOR_Y + 40);
    g.fillStyle = st.kind === "deck" ? pal.bL : PAPER; g.fillRect(0, FLOOR_Y, SW, 7);
    spinMark(g, 800, FLOOR_Y + 58, st.kind === "deck" ? alpha(PAPER, 0.6) : alpha(INK, 0.55));
    g.restore();
  }

  function drawCrepe(g, x, y, r, c, pour) {
    const rot = c.rot || 0, k = Math.abs(Math.cos(rot));
    const showB = c.side === 1 ? Math.cos(rot) > 0 : Math.cos(rot) < 0;       // which face is toward us (and toward the plate when it lands)
    const top = showB ? doneCol(c.a) : doneCol(c.b);
    const under = showB ? doneCol(c.b) : doneCol(c.a);
    g.save(); g.translate(x, y);
    if (c.state === "air" || c.state === "fall") g.rotate(Math.sin(rot) * 0.25);
    g.beginPath(); g.ellipse(0, 0, r * pour, Math.max(2.2, r * 0.3 * k * pour), 0, 0, TAU); g.fillStyle = under; g.fill();
    g.beginPath(); g.ellipse(0, -2, r * pour * 0.97, Math.max(1.4, r * 0.27 * k * pour), 0, 0, TAU); g.fillStyle = top; g.fill();
    g.restore();
  }

  function draw(s, g, ctx) {
    const pal = ctx.pal, st = stopOf(s), sc = st.scale;
    // the climb between stops: the old stop slides down and away, the next comes from above
    if (s.phase === "travel" && s.stop + 1 < STOPS.length) {
      const k = easeInOut(clamp(s.travelT / 1.1, 0, 1));
      drawBack(g, st, pal, s.t, k * SH);
      drawBack(g, STOPS[s.stop + 1], pal, s.t, k * SH - SH);
    } else drawBack(g, st, pal, s.t, 0);

    const wx = (m) => 500 + m * sc, wy = (m) => FLOOR_Y - m * sc;
    const H = 1.7 * sc;

    // the queue: two crepes each, and off to work
    const shirts = [PAPER, pal.aLL, "#d8c59c", "#c9d3d6", "#e6b99a"];
    for (let i = 2; i >= 0; i--) {
      const idx = Math.floor(s.made / PER_STOP) + i;
      if (idx >= STOPS.length) continue;
      const p = someone(s.queueSeed + idx * 13, shirts);
      const x = wx(queueX(s, i));
      if (x > SW + 60) continue;
      const taking = i === 0 && s.cr && s.cr.state === "serve";
      person(g, x, FLOOR_Y + 2, H * p.hk * 0.96, { view: "side", face: -1, shirt: p.shirt, skin: p.skin, hair: p.hair, pose: "stand", t: s.t + p.ph, handTo: taking ? [wx(s.cr.x), wy(s.cr.y)] : null });
    }
    for (const L of s.leaving) {
      const p = someone(L.seed, shirts);
      g.globalAlpha = 1 - smooth(0.8, 1.4, L.t);
      person(g, wx(L.x) + L.t * 240, FLOOR_Y + 2, H * 0.96, { shirt: p.shirt, skin: p.skin, hair: p.hair, view: "side", face: 1, pose: "walk", t: L.t * 2.2 });
      g.globalAlpha = 1;
    }

    // a dropped one stays where it fell for a moment
    if (s.splat) { g.globalAlpha = 1 - smooth(1.6, 2.5, s.splat.t); g.beginPath(); g.ellipse(wx(s.splat.x), FLOOR_Y + 5, PAN_R * sc * 1.1, 7, 0, 0, TAU); g.fillStyle = doneCol(s.splat.a); g.fill(); g.globalAlpha = 1; }

    // the cook, the pan and what's in it
    const cx = wx(s.cook.x), px = wx(panX(s)), py = wy(PAN_H);
    const moving = Math.abs(s.cook.v) > 0.15;
    const bounce = moving ? Math.abs(Math.sin(s.cook.walk * 5)) * (0.03 / Math.max(0.2, st.gf)) * sc * 0.25 : 0;
    const c = s.cr;
    if (c && (c.state === "air" || c.state === "fall")) {                     // its shadow on the floor
      g.beginPath(); g.ellipse(wx(c.x), FLOOR_Y + 5, PAN_R * sc * 0.9, 6, 0, 0, TAU); g.fillStyle = alpha(INK, 0.22); g.fill();
    }
    person(g, cx, FLOOR_Y + 2 - bounce, H, {
      view: "side", face: 1, pose: moving ? "walk" : "stand", t: s.cook.walk * 0.8, shirt: PAPER, legs: pal.b, sash: pal.a,
      skin: SKINS[3], hair: HAIRS[0], handTo: [px - PAN_R * sc - 0.2 * sc, py + 4 - bounce], handTo2: [px - PAN_R * sc - 0.26 * sc, py + 6 - bounce],
      lean: s.phase === "end" ? 0 : clamp(s.cook.v * 0.03, -0.12, 0.12),
    });
    seg(g, px - PAN_R * sc - 0.24 * sc, py + 4 - bounce, px - PAN_R * sc + 4, py + 2 - bounce, 9, INK);                // handle
    g.beginPath(); g.ellipse(px, py + 5 - bounce, PAN_R * sc + 7, 12, 0, 0, TAU); g.fillStyle = INK; g.fill();              // pan
    g.beginPath(); g.ellipse(px, py + 1 - bounce, PAN_R * sc + 4, 9, 0, 0, TAU); g.fillStyle = "#2a3034"; g.fill();

    if (c) {
      const r = PAN_R * sc * 0.86;
      if (c.state === "pour") drawCrepe(g, px, py - 2 - bounce, r, c, easeOut(c.t / 0.38));
      else if (c.state === "pan" || c.state === "panB") drawCrepe(g, px, py - 2 - bounce, r, c, 1);
      else drawCrepe(g, wx(c.x), wy(c.y) - 2, r, c, 1);
      // how done the first side is: aim for the gold band
      if (c.state === "pan") {
        const gx = px - 70, gy = py - 74 - bounce, gw = 140;
        fillRR(g, gx - 4, gy - 4, gw + 8, 22, 11, alpha(INK, 0.78));
        fillRR(g, gx + gw * GOLD_LO / BURNT, gy, gw * (GOLD_HI - GOLD_LO) / BURNT, 14, 5, CREPE_COL[2]);
        const k = clamp(c.a / BURNT, 0, 1);
        fillRR(g, gx + gw * k - 3, gy - 3, 6, 20, 3, PAPER);
      }
    }
    s.parts.draw(g);
    s.notes.draw(g);
    if (s.phase === "end") { g.globalAlpha = smooth(0, 0.5, s.endT); sign(g, "EARLY", 500, 480, 150, alpha(INK, 0.85), "center", 800); g.globalAlpha = 1; }
  }

  // The house plays: toss in the gold, walk to where it will come down.
  function bot(s, b, ctx) {
    const st = stopOf(s), sc = st.scale, c = s.cr, sk = ctx.skill;
    let target = -0.55;
    if (c && c.state === "pan") {
      if (c.botAt === undefined) c.botAt = 0.9 + (1 - sk) * ctx.rng.range(-0.45, 0.6);
      if (c.a >= c.botAt) b.tap = true;
    }
    if (c && c.state === "air") {
      if (c.botErr === undefined) c.botErr = (1 - sk) * ctx.rng.range(-0.5, 0.5);
      target = landingX(s) - REACH + c.botErr;
    }
    b.x = 500 + (target + REACH) * sc; b.y = 600;
  }

  registerEvent({
    id: "lark", hour: 12, name: "Lamp-dawn Crepes",
    place: "Lark's stair-heads, from deck 40 to the top of the end wall · 0.95 to 0.10 g",
    intro: "Lark sells crepes off stair-head hotplates from six. On its day the plate climbs the wedge, six stops and two crepes at each. Your wrist tosses the same at every stop. The drum doesn't: the lighter it gets, the longer a crepe hangs and the further spinward it comes down.",
    how: "Move to carry the pan. Tap to toss when the first side is in the gold, then be under it when it lands.",
    keys: "arrows to walk, Space to toss",
    marks: [6, 9, 11], unit: "points", fmt: (v) => String(Math.round(v * 10) / 10),
    result: (s) => s.served + " of " + TOTAL + " served, " + s.golden + " golden",
    create, update, draw, bot,
  });
})();
