/* ---------- Stag: Going Up ----------
   Going-up day on deck 150 (r = 2,404 m, 0.80 g). An elder is leaving for the High decks, and Stag stacks a
   lifetime of her furniture on one trolley for the freight cab. The hoist's grab stops dead over the trolley
   and lets go: each piece falls 1.4 m and, because the floor turns under it while it falls, comes down
   (2h)^1.5 / (3 sqrt r) = 3.2 cm antispinward of where it was let go (spinStep does the falling).
   A tall stack remembers every careless inch: offsets add up, the stack sways with its height and with the
   inches it has collected, and if the weight above any piece hangs past that piece's edge, it all comes down. */
"use strict";
(function () {
  const DECK = 150, RD = deckR(DECK), GL = gDeck(DECK), GF = gFrac(RD);
  const DROP = 1.4;                                   // m, from the bottom of the hanging piece to the top of the stack
  const DRIFT = dropDrift(DROP, RD);                  // about 3.2 cm anti
  const T_FALL = Math.sqrt(2 * DROP / GL);
  const GRAB = 0.25;                                  // rail to the top of the hanging piece
  const TT = 0.22, TW = 1.2;                          // the trolley: deck height and width
  const SWING = 0.85, OFF_X = -3.9, BRING = 0.75;     // the carriage's swing, where it fetches from, how long it takes
  const CAB_X0 = 2.0, CAB_X1 = 4.75, CAB_H = 7.4, CEIL = 9.2, ROLL = 2.9, GALLERY = 4.0;
  const BASE_Y = 930;                                 // where the floor sits on the stage before the view scrolls
  const ELDER_X = -2.4, M1_X = -1.74, M2_X = 1.56, GRIP_X = 1.32, GRIP_Y = 0.95, CHAIN_X = -1.42, CAM_X = -0.12;
  const LOSE = 3, TRUE_D = 0.025, CLOSE_D = 0.07;
  const BOT_LATE = 0.13;                               // s of timing scatter at skill 0

  // A life, bottom to top. w and h in metres, m in kilograms, age in years.
  const PIECES = [
    { k: "table", w: 0.9, h: 0.52, m: 18, age: 188 },
    { k: "crate", w: 0.7, h: 0.4, m: 16, age: 64 },
    { k: "arm", w: 0.8, h: 0.6, m: 24, age: 212 },
    { k: "ladder", w: 0.5, h: 0.68, m: 7, age: 151 },
    { k: "rug", w: 1.0, h: 0.26, m: 11, age: 130 },
    { k: "spindle", w: 0.48, h: 0.66, m: 6, age: 97 },
    { k: "stool", w: 0.4, h: 0.48, m: 4, age: 75 },
    { k: "kitchen", w: 0.48, h: 0.64, m: 6, age: 160 },
    { k: "child", w: 0.36, h: 0.44, m: 3, age: 103 },
    { k: "oldest", w: 0.52, h: 0.7, m: 7, age: 296 },
    { k: "folding", w: 0.46, h: 0.6, m: 4, age: 41 },
    { k: "lamp", w: 0.32, h: 0.6, m: 3, age: 58 },
  ];
  const N = PIECES.length;
  const periodOf = (i) => 2.7 - 0.11 * i;             // the carriage gets a little quicker with each piece
  const carX = (t, T) => -SWING * Math.cos(TAU * t / T);

  function create(ctx) {
    const s = {
      t: 0, score: 0, done: false, phase: "bring", phT: 0, idx: 0,
      stack: [], lost: [], bodies: [], lostN: 0, streak: 0, trues: 0,
      car: { x: OFF_X, t: 0, T: periodOf(0), open: 0, w: PIECES[0].w }, awayFrom: 0,
      drop: null, rail: 0, railT: 0, railV: 0,
      sway: { a: 0, ph: 0, w: 1 },
      cam: { sc: 190, x: CAM_X, y: 0, f: BASE_Y },
      parts: new Parts(260), notes: new Notes(),
      endT: 0, endWhy: "", said: 0, scratch: { t: 9, side: 0 }, gasp: 9, glad: 9, cheer: 0,
      roll: 0, door: 0, deck: DECK, lit: 0, elderX: ELDER_X, lastTick: DECK,
    };
    s.railT = s.rail = railFor(s, 0);
    return s;
  }

  const topY = (s) => { let y = TT; for (const p of s.stack) y += p.P.h; return y; };
  const railFor = (s, i) => topY(s) + DROP + PIECES[Math.min(i, N - 1)].h + GRAB;
  const theta = (s) => s.sway.a * Math.sin(s.sway.ph);
  // every inch each piece sits off the one below it
  function careless(s) { let c = 0, px = 0; for (const p of s.stack) { c += Math.abs(p.x - px); px = p.x; } return c; }

  // from the top down: the highest piece (or the trolley, k = -1) whose load hangs past its edge
  function findTopple(st) {
    for (let k = st.length - 2; k >= -1; k--) {
      let m = 0, mx = 0;
      for (let j = k + 1; j < st.length; j++) { m += st[j].P.m; mx += st[j].P.m * st[j].x; }
      const c = mx / m, sx = k < 0 ? 0 : st[k].x, sw = k < 0 ? TW : st[k].P.w;
      if (Math.abs(c - sx) > sw / 2) return { k, dir: Math.sign(c - sx) || 1 };
    }
    return null;
  }

  const view = (s) => {
    const sc = s.cam.sc, cx = s.cam.x, cy = s.cam.y, f = s.cam.f;
    return { sc, f, X: (x) => 500 + (x - cx) * sc, Y: (y) => f - (y - cy) * sc };
  };

  function dust(s, x, y, w, n, k) {
    const v = view(s);
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1;
      const u = ((i * 37) % 10) / 10;
      s.parts.add({ x: v.X(x + side * w / 2 * (0.75 + 0.3 * u)), y: v.Y(y) - 1 - u * 4, vx: side * (60 + ((i * 53) % 90)) * k, vy: -(4 + ((i * 29) % 26)) * k, g: 40, drag: 4.5, life: 0.5 + 0.3 * u, r: 2 + (i % 3), col: i % 3 ? shade(PAPER, -0.12) : PAPER, a: 0.55 });
    }
  }

  function release(s, ctx) {
    const P = PIECES[s.idx];
    s.drop = { x: s.car.x, y: s.rail - GRAB - P.h, vx: 0, vy: 0, P };
    s.idx++; s.phase = "fall"; s.phT = 0;
    ctx.sfx.clack();
  }

  function lose(s, ctx, n) { s.lostN += n; s.streak = 0; s.gasp = 0; ctx.sfx.bad(); }

  function land(s, ctx) {
    const d = s.drop, P = d.P, n = s.stack.length, v = view(s);
    const y = topY(s), th = theta(s);
    const bx = n ? s.stack[n - 1].x + th * (y - TT) : 0, bw = n ? s.stack[n - 1].P.w : TW;
    const off = d.x - bx, dir = Math.sign(off) || 1;
    const over = Math.min(P.w, bw, (P.w + bw) / 2 - Math.abs(off));
    s.drop = null; s.phase = "away"; s.phT = 0; s.awayFrom = s.car.x;
    const nx = v.X(d.x), ny = v.Y(y + P.h) - 26;
    if (over < 0.45 * Math.min(P.w, bw)) {
      // too little under it: it goes over the side
      s.bodies.push({ P, x: d.x + dir * 0.04, y: y + P.h / 2, vx: dir * 0.8, vy: 0.2, rot: 0, vr: dir * 2.6 });
      lose(s, ctx, 1);
      ctx.sfx.thud(0.5);
      s.notes.add("lost", nx, ny, { good: false, size: 46 });
    } else {
      s.stack.push({ P, x: d.x - th * (y - TT), y, sq: 0, wob: 0, wt: 9 });
      const piece = s.stack[s.stack.length - 1];
      ctx.sfx.thud(0.35 + P.m / 26);
      dust(s, d.x, y, Math.min(P.w, bw), 8 + Math.round(P.m / 3), 0.6 + P.m / 30);
      const a = Math.abs(off);
      if (a < TRUE_D) { s.streak++; s.trues++; ctx.sfx.chime(Math.min(10, s.streak + 1)); s.notes.add("true", nx, ny, { good: true, size: 50 }); if (s.streak >= 3) s.glad = 0; }
      else if (a < CLOSE_D) { s.streak = 0; ctx.sfx.good(); s.notes.add("close", nx, ny, { good: true, size: 44 }); }
      else {
        s.streak = 0;
        s.notes.add("off", nx, ny, { good: false, size: 44 });
        piece.wob = dir * clamp((a - CLOSE_D * 0.6) / (bw / 2), 0.15, 1) * 0.16; piece.wt = 0;
        ctx.sfx.tone({ f: 170, f1: 120, type: "triangle", dur: 0.4, vol: 0.06 });
      }
      // does the weight above anything now hang past its edge?
      let tp, guard = 0;
      while ((tp = findTopple(s.stack)) && guard++ < N) {
        const base = s.stack[tp.k + 1].y, gone = s.stack.splice(tp.k + 1);
        for (const q of gone) {
          const up = q.y - base;
          s.bodies.push({ P: q.P, x: q.x + th * (q.y + q.P.h / 2 - TT), y: q.y + q.P.h / 2, vx: tp.dir * (0.35 + 0.3 * up), vy: 0.1, rot: th, vr: tp.dir * (1.1 + 0.35 * up + 0.4 * ctx.rng()) });
        }
        lose(s, ctx, gone.length);
        s.notes.add(gone.length > 1 ? "over she goes" : "lost", nx, ny - 50, { good: false, size: 46, life: 1.5 });
      }
    }
    s.score = s.stack.length;
    if (s.lostN >= LOSE) { s.phase = "wait"; s.endWhy = "lost"; }
    else if (s.idx >= N) { s.phase = "wait"; s.endWhy = "full"; }
    else s.railT = railFor(s, s.idx);
  }

  function updateBodies(s, dt, ctx) {
    for (let i = s.bodies.length - 1; i >= 0; i--) {
      const b = s.bodies[i];
      spinStep(b, dt, GL); b.rot += b.vr * dt;
      const P = b.P, he = (Math.abs(Math.cos(b.rot)) * P.h + Math.abs(Math.sin(b.rot)) * P.w) / 2;
      if (b.y - he > 0 || b.vy > 0) continue;
      const r = Math.round(b.rot / (Math.PI / 2)) * (Math.PI / 2);
      const hw = (Math.abs(Math.cos(r)) * P.w + Math.abs(Math.sin(r)) * P.h) / 2, hv = (Math.abs(Math.cos(r)) * P.h + Math.abs(Math.sin(r)) * P.w) / 2;
      // set down on the landing beside the trolley: the nearest clear spot on its side, or on top of the heap
      const side = b.x < 0 ? -1 : 1, lo = side < 0 ? -2.9 + hw : 0.66 + hw, hi = side < 0 ? -0.66 - hw : 1.9 - hw;
      const clear = (x) => s.lost.every((l) => Math.abs(l.xT - x) >= l.hw + hw - 0.03);
      let x = clamp(b.x, lo, hi), found = clear(x);
      for (let d = 0.05; !found && d < 3; d += 0.05) {
        for (const c of [x + d * side, x - d * side]) if (c >= lo && c <= hi && clear(c)) { x = c; found = true; break; }
      }
      let base = 0;
      if (!found) for (const l of s.lost) if (Math.abs(l.xT - x) < l.hw + hw - 0.05) base = Math.max(base, l.y + l.hv);
      s.lost.push({ P, x: b.x, xT: x, y: base + hv, hw, hv, rot: b.rot, rotT: r, t: 0 });
      s.bodies.splice(i, 1);
      ctx.sfx.thud(0.3 + P.m / 30);
      dust(s, x, base, hw * 2, 10, 0.8);
      s.scratch = { t: 0, side: x < 0 ? -1 : 1 };
    }
    for (const l of s.lost) { l.t += dt; l.rot = lerp(l.rot, l.rotT, 1 - Math.exp(-dt * 14)); l.x = lerp(l.x, l.xT, 1 - Math.exp(-dt * 8)); }
  }

  function updateCam(s, dt) {
    let sc, cx, cy, f;
    if (s.phase === "end") {
      f = BASE_Y; sc = Math.min((f - 80) / (CEIL + 0.1), 960 / 7.6); cx = 1.1; cy = 0;
    } else {
      // as the stack grows the floor slides to the bottom edge and the rail to the top, then the view zooms out
      const top = Math.max(s.rail + 0.3, 2.6), t = clamp((top - 4.5) / 3.5, 0, 1);
      f = lerp(BASE_Y, 985, t);
      const room = f - lerp(130, 40, t);
      sc = clamp(room / top, 100, 190); cx = CAM_X; cy = Math.max(0, top - room / sc);
    }
    const k = 1 - Math.exp(-dt * (s.phase === "end" ? 2.2 : 3.2));
    s.cam.sc += (sc - s.cam.sc) * k; s.cam.x += (cx - s.cam.x) * k; s.cam.y += (cy - s.cam.y) * k; s.cam.f += (f - s.cam.f) * k;
  }

  function update(s, dt, inp, ctx) {
    s.t += dt; s.phT += dt;
    s.parts.update(dt); s.notes.update(dt);
    s.scratch.t += dt; s.gasp += dt; s.glad += dt;
    s.cheer = Math.max(0, s.cheer - dt * 0.5);
    if (s.glad < 0.05) s.cheer = 1;

    // the sway: taller and more careless stacks sway further
    const H = topY(s) - TT;
    const D = 0.004 * H + 0.16 * careless(s) * H / 6;
    s.sway.a = approach(s.sway.a, H > 0.05 ? D / H : 0, dt * 0.012);
    s.sway.w = TAU / (2.2 + 0.5 * H);
    s.sway.ph += s.sway.w * dt;
    for (const p of s.stack) { p.sq += dt; p.wt += dt; }
    updateBodies(s, dt, ctx);

    const prev = s.rail;
    s.rail += (s.railT - s.rail) * (1 - Math.exp(-dt * 6));
    s.railV = (s.rail - prev) / dt;
    updateCam(s, dt);

    ctx.hud.set("deck " + DECK + "\n" + fmtG(GF), "stacked " + s.stack.length + (s.lostN ? "\nlost " + s.lostN + (s.lostN < LOSE ? " of " + LOSE : "") : ""));

    if (s.phase === "end") return updateEnd(s, dt, ctx);
    if (s.said === 0) { s.said = 1; ctx.say("Let go when it's over the stack. It lands a little anti.", 4.5); }
    if (s.said === 1 && s.idx === 6 && s.phase === "bring") { s.said = 2; ctx.say("Higher now. It remembers every inch.", 3.5); }

    if (s.phase === "bring") {
      const k = clamp(s.phT / BRING, 0, 1);
      s.car.x = lerp(OFF_X, -SWING, easeOut(k)); s.car.open = Math.max(0, s.car.open - dt * 8); s.car.w = PIECES[s.idx].w;
      if (s.phT < dt * 1.5) ctx.sfx.whoosh(0.7);
      if (k >= 1) { s.phase = "hang"; s.phT = 0; s.car.t = 0; s.car.T = periodOf(s.idx); s.rail = s.railT; }
    } else if (s.phase === "hang") {
      s.car.t += dt;
      s.car.x = carX(s.car.t, s.car.T);
      if ((inp.pressed && s.car.t > 0.04) || s.car.t > 9) release(s, ctx);
    } else if (s.phase === "fall") {
      spinStep(s.drop, dt, GL);
      s.car.open = Math.min(1, s.car.open + dt * 7);
      if (s.drop.y <= topY(s)) land(s, ctx);
    } else if (s.phase === "away") {
      s.car.open = 1;
      if (s.phT > 0.3) {
        const k = clamp((s.phT - 0.3) / 0.45, 0, 1);
        s.car.x = lerp(s.awayFrom, OFF_X, easeIn(k));
        if (k >= 1) { s.phase = "bring"; s.phT = 0; }
      }
    } else if (s.phase === "wait") {
      s.car.open = 1;
      if (s.phT > 0.3) s.car.x = lerp(s.awayFrom, OFF_X, easeIn(clamp((s.phT - 0.3) / 0.45, 0, 1)));
      if (s.phT > 0.9 && s.bodies.length === 0) { s.phase = "end"; s.endT = 0; s.score = s.stack.length; }
    }
  }

  function updateEnd(s, dt, ctx) {
    s.endT += dt;
    const e = s.endT;
    if (e <= dt * 1.5) {
      const lamp = s.stack.length && s.stack[s.stack.length - 1].P.k === "lamp";
      ctx.say(s.endWhy === "lost" ? cap(numWord(s.lostN)) + " on the landing. The rest goes up." : "Going up.", 3);
      if (lamp) { ctx.sfx.great(); s.cheer = 1; }
    }
    const top = s.stack.length && s.stack[s.stack.length - 1].P.k === "lamp";
    if (top) s.lit = clamp((e - 0.2) / 0.4, 0, 1);
    s.roll = ROLL * easeInOut(clamp((e - 0.6) / 1.5, 0, 1));
    if (e > 0.6 && e - dt <= 0.6) ctx.sfx.whoosh(1.2);
    s.elderX = lerp(ELDER_X, CAB_X0 + 0.24, easeInOut(clamp((e - 0.4) / 2.6, 0, 1)));
    const dk = clamp((e - 3.0) / 0.5, 0, 1);
    if (dk >= 1 && s.door < 1) { ctx.sfx.thud(0.7); ctx.sfx.clack(); }
    s.door = easeInOut(dk);
    const ik = clamp((e - 3.6) / 1.5, 0, 1);
    s.deck = Math.round(lerp(DECK, 302, easeInOut(ik)));
    if (s.deck - s.lastTick >= 12) { s.lastTick = s.deck; ctx.sfx.tick(); }
    if (ik >= 1 && !s.belled) { s.belled = true; ctx.sfx.bell(9); if (s.score >= 8) { ctx.sfx.cheer(0.6); s.cheer = 1; } }
    if (e > 5.7) s.done = true;
  }

  /* ---- drawing ---- */
  function colours(pal) {
    return {
      wood: pal.b, woodD: pal.bD, woodL: pal.bL, ash: mix(pal.b, PAPER, 0.5), dark: mix(pal.bD, INK, 0.35),
      rush: mix(pal.b, pal.a, 0.45), shade: mix(PAPER, pal.b, 0.18),
    };
  }
  const legX = (x0, y0, x1, y1, y) => lerp(x0, x1, (y - y0) / (y1 - y0));

  // Each piece is drawn in metres with its bottom centre at the origin and up as -y.
  const DRAW = {
    table(g, w, h, C) {
      const li = 0.06, lw = 0.05;
      fillRR(g, -w / 2 + li + 0.08, -h + 0.1, lw * 0.8, h - 0.1, 0.01, C.dark);
      fillRR(g, w / 2 - li - 0.08 - lw * 0.8, -h + 0.1, lw * 0.8, h - 0.1, 0.01, C.dark);
      fillRR(g, -w / 2 + li, -0.16, w - 2 * li, 0.026, 0.012, C.woodD);
      const lx = -w / 2 + li, rx = w / 2 - li - lw;
      fillRR(g, lx, -h + 0.08, lw, h - 0.08, 0.016, C.wood);
      disc(g, lx + lw / 2, -h * 0.55, lw * 0.72, C.wood); disc(g, lx + lw / 2, -h * 0.33, lw * 0.6, C.wood);
      // the right leg was re-turned, long ago, in a paler wood
      fillRR(g, rx, -h + 0.08, lw, h - 0.08, 0.016, C.ash);
      disc(g, rx + lw / 2, -h * 0.55, lw * 0.72, C.ash); disc(g, rx + lw / 2, -h * 0.33, lw * 0.6, C.ash); disc(g, rx + lw / 2, -h * 0.42, lw * 0.55, C.ash);
      fillRR(g, -w / 2 + 0.03, -h + 0.04, w - 0.06, 0.095, 0.012, C.woodD);
      fillRR(g, -0.13, -h + 0.06, 0.26, 0.058, 0.01, C.wood);
      disc(g, 0, -h + 0.089, 0.014, C.dark);
      fillRR(g, -w / 2, -h, w, 0.052, 0.018, C.wood);
      fillRR(g, -w / 2 + 0.02, -h + 0.007, w - 0.04, 0.01, 0.005, alpha(PAPER, 0.22));
      fillRR(g, -w / 2 + 0.1, -h + 0.016, 0.1, 0.028, 0.006, C.ash);          // a let-in patch in the top
    },
    crate(g, w, h, C, pal) {
      const hb = h * 0.72, lids = [pal.a, PAPER, pal.bL, pal.aL, shade(PAPER, -0.3)];
      for (let i = 0; i < 5; i++) {
        const cx = -w / 2 + 0.1 + i * (w - 0.2) / 4, ry = (h - hb) * (i % 2 ? 0.78 : 1.0) + 0.02;
        g.beginPath(); g.ellipse(cx, -hb + 0.02, 0.085, ry, 0, Math.PI, TAU); g.fillStyle = lids[i]; g.fill();
        disc(g, cx, -hb + 0.02 - ry, 0.016, C.dark);
      }
      fillRR(g, -w / 2, -hb, w, hb, 0.016, C.dark);
      for (let i = 0; i < 3; i++) fillRR(g, -w / 2 + 0.013, -hb + 0.012 + i * hb / 3, w - 0.026, hb / 3 - 0.022, 0.008, i === 1 ? C.woodD : C.wood);
      fillRR(g, -0.085, -hb + 0.045, 0.17, 0.034, 0.017, alpha(INK, 0.55));
      fillRR(g, w / 2 - 0.15, -hb * 0.3 - 0.02, 0.1, 0.04, 0.006, alpha(PAPER, 0.5));   // a chalked label, rubbed
    },
    arm(g, w, h, C, pal) {
      fillRR(g, -w / 2 + 0.07, -0.1, 0.045, 0.1, 0.012, C.dark);
      fillRR(g, w / 2 - 0.115, -0.1, 0.045, 0.1, 0.012, C.dark);
      fillRR(g, -w / 2 + 0.09, -h, w - 0.18, h - 0.16, 0.1, pal.aD);
      for (let i = -1; i <= 1; i++) disc(g, i * 0.13, -h + 0.13, 0.015, pal.aDD);
      fillRR(g, -w / 2 + 0.05, -0.32, w - 0.1, 0.23, 0.04, pal.a);
      fillRR(g, -w / 2 + 0.1, -0.35, w - 0.2, 0.09, 0.045, pal.aL);
      fillRR(g, -w / 2, -0.43, 0.135, 0.34, 0.06, pal.a);
      fillRR(g, w / 2 - 0.135, -0.43, 0.135, 0.34, 0.06, pal.a);
      fillRR(g, -w / 2 - 0.006, -0.45, 0.147, 0.075, 0.037, pal.aL);
      fillRR(g, w / 2 - 0.141, -0.45, 0.147, 0.075, 0.037, pal.aL);
      // a patch on the seat front, sewn on in bronze
      fillRR(g, 0.03, -0.26, 0.12, 0.1, 0.012, pal.b);
      g.setLineDash([0.014, 0.01]); g.lineWidth = 0.006; g.strokeStyle = alpha(INK, 0.55);
      rrect(g, 0.039, -0.251, 0.102, 0.082, 0.008); g.stroke(); g.setLineDash([]);
    },
    ladder(g, w, h, C) {
      const sh = h * 0.47, pw = 0.036;
      fillRR(g, -w / 2 + 0.02, -h, pw, h, pw / 2, C.wood);
      fillRR(g, w / 2 - 0.02 - pw, -h, pw, h, pw / 2, C.wood);
      disc(g, -w / 2 + 0.02 + pw / 2, -h, 0.024, C.wood); disc(g, w / 2 - 0.02 - pw / 2, -h, 0.024, C.wood);
      const top = -h + 0.07, bot = -sh - 0.1;
      for (let i = 0; i < 3; i++) {
        const y = lerp(top, bot, i / 2);
        g.beginPath(); g.moveTo(-w / 2 + 0.035, y); g.quadraticCurveTo(0, y + 0.03, w / 2 - 0.035, y);
        g.lineWidth = 0.042; g.strokeStyle = i === 1 ? C.ash : C.woodD; g.lineCap = "round"; g.stroke();
      }
      fillRR(g, -w / 2, -sh - 0.035, w, 0.058, 0.018, C.rush);
      g.lineWidth = 0.007; g.strokeStyle = alpha(INK, 0.3);
      for (let i = 0; i < 7; i++) { const x = -w / 2 + 0.03 + i * (w - 0.06) / 6; g.beginPath(); g.moveTo(x, -sh - 0.03); g.lineTo(x + 0.02, -sh + 0.018); g.stroke(); }
      fillRR(g, -w / 2 + 0.008, -sh, pw, sh, pw / 2, C.wood);
      fillRR(g, w / 2 - 0.008 - pw, -sh, pw, sh, pw / 2, C.wood);
      fillRR(g, -w / 2 + 0.02, -0.14, w - 0.04, 0.024, 0.012, C.woodD);
      fillRR(g, -w / 2 + 0.02, -0.25, w - 0.04, 0.02, 0.01, C.woodD);
    },
    spindle(g, w, h, C) {
      const sh = h * 0.46, pw = 0.034;
      fillRR(g, -w / 2 + 0.03, -h + 0.03, pw, h - sh, pw / 2, C.wood);
      fillRR(g, w / 2 - 0.03 - pw, -h + 0.03, pw, h - sh, pw / 2, C.wood);
      for (let i = 0; i < 5; i++) { const x = lerp(-w / 2 + 0.09, w / 2 - 0.09, i / 4); seg(g, x, -sh - 0.03, x, -h + 0.04, 0.016, C.woodD); }
      fillRR(g, -w / 2, -h, w, 0.068, 0.034, C.wood);
      const x0 = -w / 2 + 0.06, x1 = -w / 2 + 0.02;
      seg(g, x0, -sh, x1, -0.018, 0.036, C.wood); seg(g, -x0, -sh, -x1, -0.018, 0.036, C.wood);
      seg(g, -w / 2 + 0.05, -0.15, w / 2 - 0.05, -0.15, 0.02, C.woodD);
      fillRR(g, -w / 2 - 0.012, -sh - 0.048, w + 0.024, 0.054, 0.016, C.woodD);
      fillRR(g, -w / 2 - 0.005, -sh - 0.048, w + 0.01, 0.014, 0.007, C.wood);
    },
    stool(g, w, h, C, pal) {
      const y0 = -h + 0.05, y1 = -0.018, xa = w / 2 - 0.07, xb = w / 2 - 0.02;
      seg(g, 0, y0, 0, y1, 0.03, C.dark);
      seg(g, -xa, y0, -xb, y1, 0.036, C.wood); seg(g, xa, y0, xb, y1, 0.036, C.wood);
      seg(g, -w / 2 + 0.05, -0.15, w / 2 - 0.05, -0.15, 0.018, C.woodD);
      // a split leg, bound up in moss cord
      for (let i = 0; i < 3; i++) { const y = -0.24 - i * 0.025; const x = legX(xa, y0, xb, y1, y); seg(g, x - 0.024, y, x + 0.024, y - 0.008, 0.016, pal.a); }
      fillRR(g, -w / 2, -h, w, 0.062, 0.03, C.wood);
      fillRR(g, -w / 2 + 0.03, -h + 0.008, w - 0.06, 0.012, 0.006, alpha(PAPER, 0.25));
    },
    kitchen(g, w, h, C, pal) {
      const sh = h * 0.47, pw = 0.036, paint = pal.a, paintD = pal.aD;
      fillRR(g, -w / 2 + 0.03, -h + 0.02, pw, h - 0.02, pw / 2, paint);
      fillRR(g, w / 2 - 0.03 - pw, -h + 0.02, pw, h - 0.02, pw / 2, paint);
      fillRR(g, -0.08, -h + 0.06, 0.16, h - sh - 0.1, 0.05, paintD);
      fillRR(g, -w / 2 + 0.005, -h, w - 0.01, 0.07, 0.03, paint);
      fillRR(g, -w / 2 - 0.012, -sh - 0.048, w + 0.024, 0.054, 0.016, paintD);
      fillRR(g, -w / 2 - 0.005, -sh - 0.048, w + 0.01, 0.014, 0.007, paint);
      fillRR(g, -w / 2 + 0.012, -sh, pw, sh, pw / 2, paint);
      fillRR(g, w / 2 - 0.012 - pw, -sh, pw, sh, pw / 2, paint);
      fillRR(g, -w / 2 + 0.03, -0.13, w - 0.06, 0.022, 0.011, paintD);
      // where the paint has worn through to the wood
      disc(g, -w / 2 + 0.05, -h + 0.035, 0.014, C.wood); disc(g, w / 2 - 0.06, -sh - 0.022, 0.016, C.wood);
      disc(g, -w / 2 + 0.03, -0.2, 0.011, C.wood); disc(g, 0.05, -h + 0.03, 0.011, C.wood); disc(g, w / 2 - 0.03, -0.06, 0.01, C.wood);
    },
    child(g, w, h, C, pal) {
      const sh = h * 0.5, pw = 0.03;
      fillRR(g, -w / 2 + 0.025, -h + 0.03, pw, h - 0.03, pw / 2, PAPER);
      fillRR(g, w / 2 - 0.025 - pw, -h + 0.03, pw, h - 0.03, pw / 2, PAPER);
      fillRR(g, -w / 2, -h, w, h - sh - 0.03, 0.06, pal.aL);
      disc(g, 0, -h + 0.075, 0.03, alpha(INK, 0.6));                      // the hole for carrying it by
      fillRR(g, -w / 2 - 0.008, -sh - 0.042, w + 0.016, 0.048, 0.016, pal.a);
      fillRR(g, -w / 2 + 0.01, -sh, pw, sh, pw / 2, PAPER);
      fillRR(g, w / 2 - 0.01 - pw, -sh, pw, sh, pw / 2, PAPER);
      fillRR(g, -w / 2 + 0.025, -0.1, w - 0.05, 0.02, 0.01, pal.a);
      disc(g, -0.06, -h + 0.13, 0.012, pal.b); disc(g, 0.06, -h + 0.13, 0.012, pal.b); disc(g, 0, -h + 0.15, 0.012, pal.b);
    },
    oldest(g, w, h, C, pal) {
      const sh = h * 0.46, pw = 0.038, wd = C.dark;
      fillRR(g, -w / 2 + 0.025, -h + 0.05, pw, h - 0.05, pw / 2, wd);
      fillRR(g, w / 2 - 0.025 - pw, -h + 0.05, pw, h - 0.05, pw / 2, wd);
      poly(g, [-0.045, -h + 0.1, 0.045, -h + 0.1, 0.09, -sh - 0.16, 0.045, -sh - 0.04, -0.045, -sh - 0.04, -0.09, -sh - 0.16], C.woodD);
      g.beginPath(); g.moveTo(-w / 2, -h + 0.08); g.quadraticCurveTo(-w / 4, -h + 0.03, 0, -h); g.quadraticCurveTo(w / 4, -h + 0.03, w / 2, -h + 0.08);
      g.lineTo(w / 2, -h + 0.12); g.lineTo(-w / 2, -h + 0.12); g.closePath(); g.fillStyle = wd; g.fill();
      disc(g, -w / 2 + 0.01, -h + 0.1, 0.026, wd); disc(g, w / 2 - 0.01, -h + 0.1, 0.026, wd);
      fillRR(g, -w / 2 - 0.012, -sh - 0.06, w + 0.024, 0.07, 0.022, pal.aD);
      g.beginPath(); g.ellipse(0, -sh - 0.035, w * 0.24, 0.02, 0, 0, TAU); g.fillStyle = pal.a; g.fill();   // worn shiny where she sat
      fillRR(g, -w / 2 + 0.012, -sh + 0.01, pw, sh - 0.01, pw / 2, wd);
      fillRR(g, w / 2 - 0.012 - pw, -sh + 0.01, pw, sh - 0.01, pw / 2, wd);
      fillRR(g, -w / 2 + 0.005, -0.15, pw + 0.014, 0.03, 0.008, C.woodL);            // a mended leg, pinned and bound
      fillRR(g, -w / 2 + 0.03, -0.12, w - 0.06, 0.022, 0.011, wd);
    },
    folding(g, w, h, C) {
      const sh = h * 0.48, pw = 0.03, col = C.ash, colD = mix(C.ash, INK, 0.3);
      seg(g, -w / 2 + 0.05, -0.02, w / 2 - 0.06, -sh + 0.05, 0.018, colD);
      seg(g, w / 2 - 0.05, -0.02, -w / 2 + 0.06, -sh + 0.05, 0.018, colD);
      fillRR(g, -w / 2 + 0.02, -h + 0.02, pw, h - 0.02, pw / 2, col);
      fillRR(g, w / 2 - 0.02 - pw, -h + 0.02, pw, h - 0.02, pw / 2, col);
      fillRR(g, -w / 2 + 0.01, -h, w - 0.02, 0.055, 0.016, col);
      fillRR(g, -w / 2 + 0.01, -h + 0.09, w - 0.02, 0.04, 0.014, col);
      fillRR(g, -w / 2 - 0.006, -sh - 0.042, w + 0.012, 0.046, 0.012, col);
      seg(g, -w / 2 + 0.01, -sh - 0.019, w / 2 - 0.01, -sh - 0.019, 0.004, colD);
      disc(g, -w / 2 + 0.035, -sh + 0.02, 0.012, INK); disc(g, w / 2 - 0.035, -sh + 0.02, 0.012, INK);
    },
    rug(g, w, h, C, pal) {
      for (let i = 0; i < 5; i++) seg(g, -w / 2 + 0.03, -h * (0.18 + 0.16 * i), -w / 2 - 0.04, -h * (0.18 + 0.16 * i) + 0.012, 0.009, PAPER);
      g.save(); rrect(g, -w / 2, -h, w, h, h / 2); g.fillStyle = pal.a; g.fill(); g.clip();
      for (let i = 0; i < 9; i++) { g.fillStyle = i % 3 === 0 ? PAPER : i % 3 === 1 ? pal.b : pal.aD; g.fillRect(-w / 2 + 0.07 + i * 0.09, -h, 0.032, h); }
      g.fillStyle = alpha(INK, 0.2); g.fillRect(-w / 2, -h * 0.4, w, h * 0.4);
      g.restore();
      g.beginPath(); g.ellipse(w / 2 - h * 0.24, -h / 2, h * 0.24, h / 2, 0, 0, TAU); g.fillStyle = pal.aD; g.fill();
      for (const r of [0.75, 0.5, 0.25]) { g.beginPath(); g.ellipse(w / 2 - h * 0.24, -h / 2, h * 0.24 * r, h / 2 * r, 0, 0, TAU); g.lineWidth = 0.008; g.strokeStyle = alpha(PAPER, 0.45); g.stroke(); }
      for (const x of [-w / 4, w / 8]) fillRR(g, x - 0.013, -h - 0.006, 0.026, h + 0.012, 0.01, C.dark);
    },
    lamp(g, w, h, C, pal, lit) {
      fillRR(g, -0.1, -0.04, 0.2, 0.04, 0.018, C.dark);
      seg(g, 0, -0.04, 0, -h + 0.22, 0.026, pal.b);
      disc(g, 0, -h * 0.45, 0.024, pal.bD);
      if (lit) { glow(g, 0, -h + 0.2, 0.9, "#ffe3a8", 0.5 * lit); disc(g, 0, -h + 0.21, 0.04, mix(PAPER, "#fff4c8", lit)); }
      poly(g, [-w / 2, -h + 0.22, w / 2, -h + 0.22, w * 0.3, -h, -w * 0.3, -h], lit ? mix(C.shade, "#fff1c4", lit * 0.8) : C.shade);
      poly(g, [-w / 2 + 0.006, -h + 0.22, w / 2 - 0.006, -h + 0.22, w / 2 - 0.018, -h + 0.18, -w / 2 + 0.018, -h + 0.18], pal.a);
      seg(g, -0.03, -h + 0.03, 0.0, -h + 0.16, 0.006, alpha(INK, 0.35));                // the shade's mended seam
    },
  };

  // a piece, with its bottom centre at stage (x, y), sc pixels a metre
  function drawPiece(g, P, x, y, sc, rot, C, pal, o) {
    o = o || {};
    g.save(); g.translate(x, y); if (rot) g.rotate(rot);
    if (o.sy) g.scale(1 / Math.sqrt(o.sy), o.sy);
    g.scale(sc, sc);
    if (o.centre) g.translate(0, P.h / 2);
    DRAW[P.k](g, P.w, P.h, C, pal, o.lit || 0);
    if (o.tag) {                                         // a small paper tag on a string
      const tx = P.k === "rug" ? P.w / 2 - 0.12 : P.w / 2 - 0.05, ty = P.k === "rug" ? -P.h + 0.02 : -P.h + 0.06;
      seg(g, tx, ty, tx + 0.04, ty + 0.06, 0.006, alpha(PAPER, 0.7));
      g.save(); g.translate(tx + 0.04, ty + 0.06); g.rotate(0.25); fillRR(g, -0.012, 0, 0.075, 0.045, 0.008, PAPER); disc(g, 0, 0.022, 0.006, alpha(INK, 0.5)); g.restore();
    }
    g.restore();
  }

  // a big Stag mover: person(), drawn broad
  function mover(g, x, y, h, o, k) {
    const q = Object.assign({}, o);
    const loc = (p) => (p ? [(p[0] - x) / k, p[1] - y] : null);
    q.handTo = loc(o.handTo); q.handTo2 = loc(o.handTo2);
    g.save(); g.translate(x, y); g.scale(k, 1); person(g, 0, 0, h, q); g.restore();
  }

  function drawRoom(g, s, v, pal, C) {
    const { sc, X, Y } = v;
    const wall = mix(pal.aDD, pal.aD, 0.55);
    g.fillStyle = wall; g.fillRect(0, 0, SW, SH);
    // panel seams and the dado
    for (let i = -8; i <= 10; i++) { const x = X(i * 1.2 - 0.3); if (x > -10 && x < SW + 10) seg(g, x, Y(CEIL), x, Y(0), 3, alpha(INK, 0.14)); }
    g.fillStyle = pal.aDD; g.fillRect(0, Y(1.0), SW, Y(0) - Y(1.0));
    g.fillStyle = shade(pal.aD, -0.1); g.fillRect(0, Y(1.04), SW, 0.04 * sc);
    // the deck painted on the wall, the way every Stag freight hall does it
    sign(g, "150", X(-1.75), Y(2.1), 0.9 * sc, alpha(PAPER, 0.11), "center", 800);
    sign(g, "DECK", X(-1.75), Y(3.05), 0.28 * sc, alpha(PAPER, 0.13), "center", 700);
    sign(g, "151", X(-1.9), Y(6.2), 1.05 * sc, alpha(PAPER, 0.1), "center", 800);
    // the ceiling
    g.fillStyle = pal.aDD; g.fillRect(0, Y(CEIL + 2), SW, Y(CEIL) - Y(CEIL + 2));
    for (const lx of [-2.6, -0.3, 1.2]) { seg(g, X(lx), Y(CEIL), X(lx), Y(CEIL - 0.25), 3, INK); lamp(g, X(lx), Y(CEIL - 0.28), 0.07 * sc, "#ffe3a8", 5); }
    // the gallery of deck 151, and the neighbours out to watch
    const g0 = X(-4.5), g1 = X(CAB_X0 - 0.2);
    const shirts = [PAPER, pal.aLL, pal.bL, "#c9d3d6", "#e6b99a"];
    const show = smooth(-20, 40, Y(GALLERY + 1.85));             // they come out once there's room to see them
    if (show > 0) {
      g.globalAlpha = show;
      crowd(g, X(-3.0), X(-0.6), Y(GALLERY + 0.18) + (1 - show) * 0.4 * sc, 6, 1.6 * sc, { cols: shirts, t: s.t, cheer: s.cheer * 0.8, seed: 70 });
      g.globalAlpha = 1;
    }
    g.fillStyle = shade(pal.aDD, -0.15); g.fillRect(g0, Y(GALLERY + 0.95), g1 - g0, 0.77 * sc);
    for (let x = -4.4; x < CAB_X0 - 0.3; x += 0.3) seg(g, X(x), Y(GALLERY + 0.92), X(x), Y(GALLERY + 0.2), 0.03 * sc, alpha(pal.b, 0.35));
    g.fillStyle = pal.b; g.fillRect(g0, Y(GALLERY + 1.0), g1 - g0, 0.06 * sc);
    g.fillStyle = pal.aDD; g.fillRect(g0, Y(GALLERY + 0.18), g1 - g0, 0.2 * sc);
    g.fillStyle = shade(pal.aDD, 0.12); g.fillRect(g0, Y(GALLERY + 0.18), g1 - g0, 0.03 * sc);
    for (const lx of [-3.1, -1.6, -0.1, 1.2]) lamp(g, X(lx), Y(GALLERY - 0.08), 0.05 * sc, "#ffe3a8", 5);
    // the freight cab: a two-deck box with its doors open
    const cx0 = X(CAB_X0), cx1 = X(CAB_X1);
    g.fillStyle = mix(INK, pal.aDD, 0.45); g.fillRect(cx0, Y(CAB_H), cx1 - cx0, Y(0) - Y(CAB_H));
    for (let i = 1; i < 6; i++) seg(g, cx0, Y(i * 1.25), cx1, Y(i * 1.25), 2, alpha(pal.b, 0.18));
    lamp(g, X((CAB_X0 + CAB_X1) / 2), Y(CAB_H - 0.2), 0.06 * sc, "#ffe3a8", 6);
    // the floor
    const fy = Y(0);
    g.fillStyle = pal.bD; g.fillRect(0, fy, SW, SH - fy + 20);
    g.fillStyle = pal.b; g.fillRect(0, fy, SW, 0.035 * sc);
    for (let i = -6; i < 12; i++) { const x = X(i * 0.9); seg(g, x, fy + 0.05 * sc, x - 0.3 * sc, SH + 20, 2, alpha(INK, 0.12)); }
  }

  function drawCabFront(g, s, v, pal) {
    const { sc, X, Y } = v;
    const cx0 = X(CAB_X0), cx1 = X(CAB_X1), wHalf = (cx1 - cx0) / 2;
    // the doors meet in the middle
    if (s.door > 0) {
      const k = s.door, lw = wHalf * k;
      for (const side of [0, 1]) {
        const x = side ? cx1 - lw : cx0;
        g.fillStyle = pal.aD; g.fillRect(x, Y(CAB_H), lw, Y(0) - Y(CAB_H) + 0.04 * sc);
        for (let i = 1; i < 14; i++) seg(g, x + 4, Y(i * 0.53), x + lw - 4, Y(i * 0.53), 0.04 * sc, alpha(pal.aDD, 0.8));
        g.fillStyle = pal.b; g.fillRect(side ? x : x + lw - 0.05 * sc, Y(CAB_H), 0.05 * sc, Y(0) - Y(CAB_H));
        // a little window in each door: the cab's light, until the cab goes up and leaves the shaft dark
        const wx = side ? x + 0.25 * sc : x + lw - 0.65 * sc;
        if (lw > 0.75 * sc) {
          const wy = Y(1.85), ww = 0.4 * sc, wh = 0.55 * sc, up = s.deck > DECK ? clamp((s.deck - DECK) / 14, 0, 1) : 0;
          fillRR(g, wx, wy, ww, wh, 0.05 * sc, INK);
          g.save(); rrect(g, wx, wy, ww, wh, 0.05 * sc); g.clip();
          g.fillStyle = "#ffe3a8"; g.globalAlpha = 0.85; g.fillRect(wx, wy - up * wh * 1.05, ww, wh); g.globalAlpha = 1;
          g.restore();
        }
      }
    }
    // the frame, the sill and the indicator
    g.fillStyle = pal.b; g.fillRect(cx0 - 0.14 * sc, Y(CAB_H + 0.22), 0.14 * sc, Y(0) - Y(CAB_H + 0.22));
    g.fillRect(cx1, Y(CAB_H + 0.22), 0.14 * sc, Y(0) - Y(CAB_H + 0.22));
    g.fillRect(cx0 - 0.14 * sc, Y(CAB_H + 0.22), cx1 - cx0 + 0.28 * sc, 0.22 * sc);
    g.fillStyle = pal.bL; g.fillRect(cx0 - 0.14 * sc, Y(CAB_H + 0.22), cx1 - cx0 + 0.28 * sc, 0.04 * sc);
    for (let i = 0; i < 9; i++) { const x = cx0 + (i + 0.5) * (cx1 - cx0) / 9; poly(g, [x - 0.08 * sc, Y(0) + 0.04 * sc, x + 0.04 * sc, Y(0) + 0.04 * sc, x + 0.12 * sc, Y(0) + 0.13 * sc, x, Y(0) + 0.13 * sc], alpha(pal.b, 0.7)); }
    const ix = X((CAB_X0 + CAB_X1) / 2), iy = Y(CAB_H + 0.78);
    board(g, ix, iy, 1.7 * sc, 0.8 * sc, String(s.deck));
    const going = s.deck > DECK && s.deck < 302;
    poly(g, [ix - 0.66 * sc, iy - 0.1 * sc, ix - 0.53 * sc, iy + 0.12 * sc, ix - 0.79 * sc, iy + 0.12 * sc], going || s.deck === 302 ? "#ffe3a8" : alpha(PAPER, 0.25));
  }

  function drawRail(g, s, v, pal) {
    const { sc, X, Y } = v;
    const yb = Y(s.rail), x1 = X(CAB_X0 - 0.15);
    for (const cx of [-3.0, -0.2, 1.55]) {
      g.setLineDash([0.05 * sc, 0.035 * sc]); seg(g, X(cx), yb - 0.14 * sc, X(cx), Y(CEIL), 0.035 * sc, alpha(INK, 0.75)); g.setLineDash([]);
    }
    g.fillStyle = pal.bD; g.fillRect(-10, yb - 0.14 * sc, x1 + 10, 0.14 * sc);
    g.fillStyle = pal.b; g.fillRect(-10, yb - 0.14 * sc, x1 + 10, 0.035 * sc); g.fillRect(-10, yb - 0.035 * sc, x1 + 10, 0.035 * sc);
    fillRR(g, x1 - 0.06 * sc, yb - 0.2 * sc, 0.1 * sc, 0.26 * sc, 3, pal.bD);
    // the hand chain the near mover hauls the rail up by
    const cy = Y(0.92);
    g.setLineDash([0.04 * sc, 0.028 * sc]); g.lineDashOffset = -s.rail * sc * 0.6;
    seg(g, X(CHAIN_X - 0.03), yb, X(CHAIN_X - 0.03), cy, 0.026 * sc, alpha(INK, 0.8));
    g.lineDashOffset = s.rail * sc * 0.6;
    seg(g, X(CHAIN_X + 0.03), yb, X(CHAIN_X + 0.03), cy, 0.026 * sc, alpha(INK, 0.8));
    g.setLineDash([]); g.lineDashOffset = 0;
    g.beginPath(); g.arc(X(CHAIN_X), cy, 0.03 * sc, 0, Math.PI); g.lineWidth = 0.026 * sc; g.strokeStyle = alpha(INK, 0.8); g.stroke();
  }

  function drawCarriage(g, s, v, pal, C, P) {
    const { sc, X, Y } = v;
    const x = X(s.car.x), yr = Y(s.rail), w = (s.car.w + 0.1) * sc;
    fillRR(g, x - 0.16 * sc, yr - 0.02 * sc, 0.32 * sc, 0.12 * sc, 0.03 * sc, pal.b);
    disc(g, x - 0.09 * sc, yr - 0.02 * sc, 0.035 * sc, INK); disc(g, x + 0.09 * sc, yr - 0.02 * sc, 0.035 * sc, INK);
    const yg = Y(s.rail - GRAB + 0.07);
    seg(g, x, yr + 0.1 * sc, x, yg, 0.025 * sc, INK);
    fillRR(g, x - w / 2, yg, w, 0.05 * sc, 0.02 * sc, pal.bD);
    // the jaws: they open when it lets go
    const a = s.car.open * 0.55;
    for (const d of [-1, 1]) {
      const px = x + d * w / 2, py = yg + 0.025 * sc;
      const ex = px + d * Math.sin(a) * 0.14 * sc, ey = py + Math.cos(a) * 0.14 * sc;
      seg(g, px, py, ex, ey, 0.03 * sc, INK);
      seg(g, ex, ey, ex - d * Math.cos(a) * 0.05 * sc, ey + Math.sin(a) * 0.03 * sc, 0.025 * sc, INK);
    }
  }

  function drawTag(g, x, y, text) {
    seg(g, x, y, x + 26, y + 34, 2.5, alpha(PAPER, 0.85));
    g.save(); g.translate(x + 26, y + 34); g.rotate(0.12);
    fillRR(g, -10, 0, 104, 40, 6, PAPER);
    disc(g, 2, 20, 4, alpha(INK, 0.5));
    sign(g, text, 52, 30, 27, INK, "center", 800);
    g.restore();
  }

  function draw(s, g, ctx) {
    const pal = ctx.pal, C = colours(pal), v = view(s), { sc, X, Y } = v;
    drawRoom(g, s, v, pal, C);
    drawRail(g, s, v, pal);

    // what came down, on the landing
    for (const l of s.lost) drawPiece(g, l.P, X(l.x), Y(l.y), sc, l.rot, C, pal, { centre: true, tag: true });

    const th = theta(s), roll = s.roll;
    const e = s.phase === "end" ? s.endT : -1;

    // the elder: hands on her hips, watching every piece
    const eh = 1.52 * sc, ex = X(s.elderX), fy = Y(0);
    if (e > 0.4 && s.elderX < CAB_X0 + 0.23) {
      person(g, ex, fy, eh, { view: "side", face: 1, pose: "walk", t: (s.elderX - ELDER_X) * 0.9, old: true, shirt: C.ash, legs: pal.aD, skin: SKINS[2], sash: pal.a });
    } else if (e < 0) {
      const o = { view: "front", pose: "hands", old: true, shirt: C.ash, legs: pal.aD, skin: SKINS[2], sash: pal.a };
      if (s.gasp < 1.3) { o.handTo = [ex - 0.02 * eh, fy - 0.8 * eh]; }
      else if (s.glad < 1.4) { o.pose = "wave"; o.t = s.glad; }
      person(g, ex, fy, eh, o);
    } else person(g, ex, fy, eh, { view: "side", face: -1, pose: "stand", old: true, shirt: C.ash, legs: pal.aD, skin: SKINS[2], sash: pal.a });

    // the near mover, on the hand chain
    const mh = 1.92 * sc, m1x = X(M1_X), pull = s.railV > 0.05 ? Math.sin(s.t * 10) : 0;
    const scr1 = s.scratch.t < 1.8 && s.scratch.side < 0;
    const m1 = { view: "side", face: 1, pose: "stand", shirt: pal.a, legs: shade(pal.a, -0.62), skin: SKINS[4], hair: HAIRS[0], sash: pal.b };
    if (e > 3.2) { m1.pose = "wave"; m1.t = e; }
    else {
      m1.handTo = scr1 ? [m1x + 0.05 * mh, fy - 0.95 * mh] : [X(CHAIN_X - 0.03), Y(1.3 + 0.12 * pull)];
      m1.handTo2 = [X(CHAIN_X + 0.03), Y(1.08 - 0.12 * pull)];
    }
    mover(g, m1x, fy, mh, m1, 1.2);

    // the trolley, its tow bar, and the stack
    const tx = X(roll), ty = Y(TT);
    const gx = X(GRIP_X + roll), gy = Y(GRIP_Y);
    seg(g, X(TW / 2 - 0.03 + roll), Y(0.14), gx, gy, 0.045 * sc, C.dark);
    seg(g, gx, gy - 0.07 * sc, gx, gy + 0.07 * sc, 0.05 * sc, INK);
    fillRR(g, tx - TW / 2 * sc, ty, TW * sc, 0.11 * sc, 0.02 * sc, C.dark);
    g.fillStyle = pal.b; g.fillRect(tx - TW / 2 * sc, ty, TW * sc, 0.03 * sc);
    g.fillStyle = alpha(pal.a, 0.9); g.fillRect(tx - 0.28 * sc, ty + 0.05 * sc, 0.56 * sc, 0.03 * sc);
    for (const wx of [-0.4, 0.4]) { const r = roll * 6; disc(g, tx + wx * sc, Y(0.075), 0.075 * sc, INK); seg(g, tx + wx * sc, Y(0.075), tx + wx * sc + Math.cos(r) * 0.05 * sc, Y(0.075) + Math.sin(r) * 0.05 * sc, 0.02 * sc, pal.b); }
    for (let i = 0; i < s.stack.length; i++) {
      const p = s.stack[i], P = p.P;
      const sq = 1 - 0.14 * Math.exp(-p.sq * 9) * Math.cos(p.sq * 22) * (p.sq < 0.6 ? 1 : 0);
      const wob = p.wob * Math.exp(-p.wt * 3.2) * Math.sin(p.wt * 15);
      const lit = P.k === "lamp" ? s.lit : 0;
      drawPiece(g, P, X(p.x + roll + th * (p.y - TT)), Y(p.y), sc, th + wob, C, pal, { sy: sq, tag: true, lit });
    }

    // the far mover, on the tow bar
    const scr2 = s.scratch.t < 1.8 && s.scratch.side > 0;
    const m2 = { view: "side", face: -1, pose: "stand", shirt: pal.a, legs: shade(pal.a, -0.62), skin: SKINS[1], hair: HAIRS[4], sash: pal.b };
    let m2x = X(M2_X);
    if (e > 0.6) { m2x = gx + 0.24 * sc; m2.face = 1; m2.pose = roll < ROLL - 0.01 ? "walk" : "stand"; m2.t = roll * 0.9; m2.handTo = [gx, gy]; m2.handTo2 = [gx, gy + 6]; }
    else { m2.handTo = scr2 ? [m2x - 0.05 * mh, fy - 0.95 * mh] : [gx, gy - 4]; m2.handTo2 = [gx, gy + 6]; }
    mover(g, m2x, fy, mh, m2, 1.2);

    // the carriage, the piece it holds, and where that piece will really land
    if (s.phase !== "end") {
      const hanging = s.phase === "bring" || s.phase === "hang";
      const P = hanging ? PIECES[s.idx] : null;
      if (hanging) {
        const bx = X(s.car.x), by = Y(s.rail - GRAB - P.h), ts = Y(topY(s));
        g.setLineDash([6, 8]); seg(g, bx, by + 4, bx, ts - 4, 2, alpha(PAPER, 0.3)); g.setLineDash([]);
        const lx = X(s.car.x - DRIFT);
        seg(g, lx, ts - 26, lx, ts - 4, 4, pal.bL);
        poly(g, [lx - 9, ts - 30, lx + 9, ts - 30, lx, ts - 18], pal.bL);
        drawPiece(g, P, bx, by, sc, 0, C, pal);
        drawTag(g, bx + (P.w / 2 - 0.04) * sc, Y(s.rail - GRAB - 0.05), P.age + " YRS");
      }
      if (s.drop) drawPiece(g, s.drop.P, X(s.drop.x), Y(s.drop.y), sc, 0, C, pal);
      drawCarriage(g, s, v, pal, C, P);
    }
    for (const b of s.bodies) drawPiece(g, b.P, X(b.x), Y(b.y), sc, b.rot, C, pal, { centre: true, tag: true });

    drawCabFront(g, s, v, pal);
    s.parts.draw(g);
    s.notes.draw(g);
    fillRR(g, 756, 950, 210, 40, 20, alpha(INK, 0.5));
    spinMark(g, 846, 970, alpha(PAPER, 0.75), 1, 24);
    if (e > 3.6) {
      const k = smooth(3.6, 4.2, e), bx = X(-0.55), by = Y(3.05) - (1 - k) * 20;
      g.globalAlpha = k;
      fillRR(g, bx - 215, by - 92, 430, 150, 14, alpha(INK, 0.8));
      sign(g, "GOING UP", bx, by + 4, 96, PAPER, "center", 800);
      mono(g, "deck 150 to deck " + s.deck, bx, by + 42, 26, alpha(PAPER, 0.75));
      g.globalAlpha = 1;
    }
  }

  // The house plays: let go when the carriage, less the drift, is over the top of the stack as it will be when the piece arrives.
  function bot(s, b, ctx) {
    b.x = 500; b.y = 500;
    if (s.phase !== "hang") { if (s.phase !== "fall") s.bp = null; return; }
    const sk = clamp(ctx.skill, 0, 1);
    // a newcomer aims a little off, forgets the drift, and taps a little early or late (worse the faster it goes)
    const gauss = () => (ctx.rng() + ctx.rng() + ctx.rng() - 1.5) * 2;
    if (!s.bp) s.bp = { err: (1 - sk) * 0.16 * ctx.rng.range(-0.5, 0.5), late: (1 - sk) * BOT_LATE * gauss(), wait: ctx.rng.range(0.1, 0.45) + (1 - sk) * ctx.rng.range(0, 1.2), comp: sk };
    if (s.car.t < s.bp.wait) return;
    const n = s.stack.length, y = topY(s);
    const thL = s.sway.a * Math.sin(s.sway.ph + s.sway.w * (T_FALL + 2 / 120));
    const top = n ? s.stack[n - 1].x + thL * (y - TT) : 0;
    const need = top + s.bp.comp * DRIFT + s.bp.err;
    const f = (k) => carX(s.car.t + k / 120 - s.bp.late, s.car.T) - need;
    const fm = f(0), f0 = f(1), fp = f(2);
    if ((fm * f0 <= 0 && Math.abs(f0) <= Math.abs(fm)) || (f0 * fp <= 0 && Math.abs(f0) < Math.abs(fp))) b.tap = true;
  }

  registerEvent({
    id: "stag", hour: 7, name: "Going Up",
    place: "A freight hall at a Stag lift core, deck 150 · 0.80 g",
    intro: "An elder is going up to the High decks today, and Stag is stacking a lifetime of her furniture on one trolley for the freight cab. The grab stops dead and lets go, and on deck 150 a dropped thing lands three centimetres anti. A tall stack remembers every careless inch.",
    how: "Tap to let each piece go when it's over the stack. The little tick under it shows where it will really land.",
    keys: "Space to let go",
    marks: [6, 9, 11], unit: "pieces", fmt: (v) => String(v),
    result: (s) => s.score + " of " + N + " rode up",
    create, update, draw, bot,
  });
})();
