/* ---------- The Round ----------
   Once a year the Round Arcade, the street that runs right round deck 201, is cleared, and the twelve
   Hours race it: 13.8 km at 0.73 g, start and finish in Hare under the Records Board. It is run twice.
   The Heavy Round goes spinward in the morning: the deck moves at 126 m/s, so a runner at 6 m/s weighs
   (1 + 6/126)^2 = a tenth more. The Light Round goes antispinward after lunch: a tenth less, and the
   runner "lands long and spends the race fighting to keep each stride low".
   The lap is shown 36 times faster than life. What the player has is their legs, and the threads on
   their wrist: where an Hour has tied its thread on you, its crowd carries you. */
"use strict";
(function () {
  const LAP = 13800, STRETCH = LAP / 12, FAST = 36;
  const DECK_V = deckSpeed(deckR(DRUM.ARCADE_DECK));
  const V_EASE = 4.9, V_BLOWN = 4.25;
  const MODES = {
    heavy: { name: "The Heavy Round", dir: 1, vPush: 6.12, drain: 0.15, way: "spinward", when: "in the morning", record: 2381, holder: 7, years: 31 },
    light: { name: "The Light Round", dir: -1, vPush: 6.42, drain: 0.16, way: "antispinward", when: "after lunch", record: 2262, holder: 1, years: 6 },
  };
  const RECOVER = 0.075, V_FLOAT = 6.0;
  const FLOOR_Y = 800;

  // How each club runs it: [heavy pace, light pace] in m/s, then how the pace moves through the lap (thirteen stretches).
  // Stag wins the Heavy and Hare the Light, as they will tell you. Heron has never won a Round and never failed to finish one.
  const flat = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  const CLUBS = [null,
    { v: [5.50, 6.02], shape: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.01, 1.01, 1.02, 1.03] },              // Hare: light on its feet
    { v: [5.08, 5.20], shape: flat },                                                                               // Heron: brings chairs
    { v: [5.38, 5.56], shape: [0.95, 0.96, 0.97, 0.98, 0.99, 1.0, 1.0, 1.01, 1.02, 1.03, 1.04, 1.05, 1.05] },      // Owl: asked for a midnight start
    { v: [5.36, 5.56], shape: flat },                                                                               // Bee: to the rota
    { v: [5.50, 5.70], shape: [0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 1.0, 1.0, 1.02, 1.04, 1.06] },      // Fox: sits in, then sells you the finish
    { v: [5.40, 5.64], shape: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.03, 1.07] },               // Otter: straight to the baths
    { v: [5.73, 5.58], shape: [0.99, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.01, 1.01] },              // Stag: heavy is honest
    { v: [5.42, 5.62], shape: [1.09, 1.07, 1.04, 1.01, 0.99, 0.98, 0.98, 0.97, 0.97, 0.97, 0.97, 0.97, 0.97] },    // Swift: leaves early
    { v: [5.26, 5.40], shape: flat },                                                                               // Badger: the oldest kit in the Round
    { v: [5.30, 5.80], shape: [1.0, 1.0, 1.01, 1.01, 1.0, 1.0, 1.0, 1.0, 0.99, 0.99, 1.0, 1.0, 1.01] },            // Moth: dances at a twentieth of a g
    { v: [5.58, 5.66], shape: [0.99, 1.0, 1.0, 1.01, 1.01, 1.01, 1.01, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0] },            // Wolf: sung the whole way round
    { v: [5.44, 5.68], shape: [1.04, 1.03, 1.02, 1.01, 1.0, 1.0, 0.99, 0.99, 0.99, 0.98, 0.98, 0.98, 0.98] },      // Lark: warmed up at lamp-dawn
  ];
  const CROWD_WORD = ["watches", "claps", "cheers", "roars"];

  const idxAt = (p) => clamp(Math.floor((p + STRETCH / 2) / STRETCH), 0, 12);
  const hourAtIdx = (idx, dir) => (dir > 0 ? (idx % 12) + 1 : ((12 - idx) % 12) + 1);
  const raceClock = (secs) => fmtMinSec(secs);

  // how well a stretch knows you: its thread's knots, one more at home, one fewer where your rival lives
  function knotsIn(ctx, hour) {
    const th = ctx.threads[HOUR_IDS[hour]], k = th ? th.k || 0 : 0;
    if (hour === ctx.club) return Math.min(3, k + 1);
    if (hour === oppositeHour(ctx.club)) return Math.max(0, k - 1);
    return k;
  }

  function create(ctx) {
    const mode = (ctx.opt && ctx.opt.mode) || "heavy", M = MODES[mode], mi = mode === "heavy" ? 0 : 1;
    const rivals = [];
    for (let n = 1; n <= 12; n++) {
      if (n === ctx.club) continue;
      rivals.push({ n, p: 0, v: CLUBS[n].v[mi], base: CLUBS[n].v[mi] * (1 + ctx.rng.range(-0.004, 0.004)), done: 0, ph: ctx.rng() });
    }
    return {
      t: 0, mode, M, p: 0, v: V_EASE, legs: 1, float: 0, blown: 0, air: 0, airH: 0, done: false, finished: 0, endT: 0,
      rivals, idx: -1, hour: 1, knots: 0, bannerT: 9, push: false, stride: 0, place: 12, score: 0,
      parts: new Parts(120), notes: new Notes(), tookOff: 0, blownN: 0, pushT: 0, said: 0,
    };
  }

  function placeNow(s) { let pl = 1; for (const r of s.rivals) if ((r.done && (!s.finished || r.done < s.finished)) || (!r.done && !s.finished && r.p > s.p)) pl++; return pl; }

  function update(s, dt, inp, ctx) {
    s.t += dt;
    const M = s.M;
    s.parts.update(dt); s.notes.update(dt); s.bannerT += dt;

    // the others
    for (const r of s.rivals) {
      if (r.done) continue;
      const ix = idxAt(r.p);
      r.v = r.base * CLUBS[r.n].shape[ix];
      r.p += r.v * FAST * dt;
      if (r.p >= LAP) r.done = s.t - (r.p - LAP) / (r.v * FAST);
    }
    if (s.finished) {
      s.endT += dt; s.v = lerp(s.v, 2.2, 1 - Math.exp(-dt * 2)); s.stride += dt * 2.2;
      if (s.endT > 1.9) s.done = true;
      return;
    }

    // which stretch, and how well it knows you
    const ix = idxAt(s.p);
    if (ix !== s.idx) {
      s.idx = ix; s.hour = hourAtIdx(ix, M.dir); s.knots = knotsIn(ctx, s.hour); s.bannerT = 0;
      if (ix > 0) { if (s.knots >= 2) ctx.sfx.cheer(0.4 + 0.25 * s.knots); else if (s.knots === 1) ctx.sfx.clap(5); }
      if (ix === 12) ctx.say("Hare again. The last half kilometre: empty your legs.", 3.2);
    }
    const k = s.knots;

    // legs
    let push = inp.down && s.blown <= 0 && s.air <= 0;
    s.push = push;
    const w = Math.pow(1 + M.dir * s.v / DECK_V, 2);
    if (s.air > 0) {                                              // took off: a long stride that lands long
      s.air -= dt; s.airH = Math.sin(clamp(1 - s.air / 1.25, 0, 1) * Math.PI);
      if (s.air <= 0) { s.v = 4.5; s.float = 0; s.airH = 0; ctx.sfx.thud(0.6); s.notes.add("landed long", 430, FLOOR_Y - 330, { good: false, size: 40 }); }
    } else if (s.blown > 0) {
      s.blown -= dt; s.v = lerp(s.v, V_BLOWN, 1 - Math.exp(-dt / 0.6));
      if (s.blown <= 0) s.legs = Math.max(s.legs, 0.2);
      s.legs = Math.min(1, s.legs + dt * RECOVER * 0.6);
    } else if (push) {
      s.pushT += dt;
      s.v += (M.vPush + 0.1 * k - s.v) * (1 - Math.exp(-dt / 0.9));
      s.legs -= dt * M.drain * Math.pow(w, 1.5) * Math.pow(s.v / 6, 3) * (1 - 0.14 * k);
      if (s.mode === "light" && s.v > V_FLOAT) s.float += dt * 0.55 * (s.v - V_FLOAT) / 0.6 * (1 - 0.06 * k);
      if (s.legs <= 0) { s.legs = 0; s.blown = 2.6; s.blownN++; ctx.sfx.bad(); s.notes.add("legs gone", 430, FLOOR_Y - 330, { good: false, size: 44 }); }
    } else {
      s.v += (V_EASE - s.v) * (1 - Math.exp(-dt / 1.3));
      s.legs = Math.min(1, s.legs + dt * RECOVER * (1 + 0.12 * k));
    }
    if (s.mode === "light" && s.air <= 0) {
      if (!push || s.v <= V_FLOAT) s.float = Math.max(0, s.float - dt * 0.55);
      if (s.float >= 1) { s.air = 1.25; s.tookOff++; ctx.sfx.whoosh(1.3); s.notes.add("took off", 430, FLOOR_Y - 330, { good: false, size: 44 }); }
    }
    s.p += s.v * FAST * dt;
    const cad = (s.mode === "light" ? 2.5 : 3.1) * (0.75 + s.v / 20);
    const before = Math.floor(s.stride * 2);
    s.stride += dt * cad;
    if (Math.floor(s.stride * 2) !== before && s.air <= 0) { ctx.sfx.step(); if (push && ctx.rng() < 0.6) s.parts.add({ x: 410, y: FLOOR_Y - 4, vx: -M.dir * 90, vy: -30, life: 0.35, r: 5, col: PAPER, a: 0.25, grow: 1.5 }); }

    if (s.said === 0 && s.t > 0.5) { s.said = 1; ctx.say(s.mode === "heavy" ? "Hold to push, let go to ease. Push where the crowd knows you." : "Hold to push, let go to ease. Push too long and you float.", 3.6); }
    s.place = placeNow(s);
    s.score = 13 - s.place;
    if (s.p >= LAP) {
      s.finished = s.t - (s.p - LAP) / (s.v * FAST); s.p = LAP; s.endT = 0;
      for (const r of s.rivals) if (!r.done) r.done = s.t + (LAP - r.p) / (r.base * FAST);       // the rest come home at their own pace
      s.place = placeNow(s); s.score = 13 - s.place;
      ctx.sfx.cheer(1.2); if (s.place <= 3) ctx.sfx.great();
    }
    ctx.hud.set((s.M.dir > 0 ? "spinward" : "antispinward") + "  " + (s.p / 1000).toFixed(1) + " km\n" + raceClock(s.t * FAST) + "   " + fmtG(0.733 * w), ordinal(s.place) + " of 12");
  }

  /* ---- drawing ---- */
  // the Arcade's back wall for one Hour: shopfronts, the club room door, the bunting, the crowd
  function drawStretch(g, hour, x0, x1, t, knots, dir, isHome) {
    const P = PALS[hour], H = HOURS[hour];
    g.save(); g.beginPath(); g.rect(x0, 0, x1 - x0 + 1, SH); g.clip();
    g.fillStyle = P.aD; g.fillRect(x0, 0, x1 - x0 + 1, FLOOR_Y);
    g.fillStyle = shade(P.a, -0.55); g.fillRect(x0, FLOOR_Y - 330, x1 - x0 + 1, 330);
    const W = x1 - x0;
    // shopfronts
    const n = Math.max(3, Math.round(W / 420));
    for (let i = 0; i < n; i++) {
      const sx = x0 + (i + 0.5) * W / n, door = i === Math.floor(n / 2);
      if (door) {                                                   // the club room, in its colours
        fillRR(g, sx - 150, FLOOR_Y - 400, 300, 400, 8, P.a);
        fillRR(g, sx - 62, FLOOR_Y - 250, 124, 250, 6, P.b);
        fillRR(g, sx - 138, FLOOR_Y - 388, 276, 96, 6, shade(P.a, -0.25));
        sign(g, H.name.toUpperCase(), sx, FLOOR_Y - 318, 76, onCol(shade(P.a, -0.25)), "center", 800);
        lamp(g, sx - 110, FLOOR_Y - 200, 9, "#ffe3a8", 7); lamp(g, sx + 110, FLOOR_Y - 200, 9, "#ffe3a8", 7);
      } else {
        fillRR(g, sx - 120, FLOOR_Y - 300, 240, 300, 6, shade(P.a, -0.35));
        fillRR(g, sx - 96, FLOOR_Y - 262, 192, 150, 5, mix("#ffd9a0", P.aD, 0.5));
        fillRR(g, sx - 128, FLOOR_Y - 316, 256, 30, 5, i % 2 ? P.b : P.a);
      }
    }
    // bunting across the top, the club's colours freshly dyed
    for (let i = 0; i * 46 < W + 46; i++) {
      const bx = x0 + i * 46 + 10, sag = 18 * Math.sin(i * 0.9) + 12;
      pennant(g, bx, 118 + sag, 34, 42, i % 2 ? P.a : P.b, i % 2 ? P.aL : P.bD, Math.sin(t * 2 + i) * 4);
    }
    seg(g, x0, 126, x1, 126, 2.5, alpha(PAPER, 0.35));
    g.restore();
  }

  function draw(s, g, ctx) {
    const M = s.M, dir = M.dir, club = ctx.club, CP = PALS[club];
    const PXM = 2.9;                                       // background stage units per race metre
    const X0 = dir > 0 ? 400 : 600;                         // where you run on the stage
    // the Arcade: stretches slide past, each in its Hour's colours
    const sx = (p) => X0 + dir * (p - s.p) * PXM;
    for (let ix = Math.max(0, s.idx - 1); ix <= Math.min(12, s.idx + 1); ix++) {
      const a = ix === 0 ? -400 : ix * STRETCH - STRETCH / 2, b = ix === 12 ? LAP + 400 : ix * STRETCH + STRETCH / 2;
      const xa = sx(a), xb = sx(b), h = hourAtIdx(ix, dir);
      const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb);
      if (x1 < -5 || x0 > SW + 5) continue;
      drawStretch(g, h, Math.max(-5, x0), Math.min(SW + 5, x1), s.t, knotsIn(ctx, h), dir, h === club);
      // its crowd, ten deep: the ones who know you have their arms up
      const kk = knotsIn(ctx, h), P = PALS[h];
      const cols = [P.a, P.b, P.aL, PAPER, P.bD];
      for (let row = 1; row >= 0; row--) {
        const y = FLOOR_Y - 26 - row * 40, hh = 150 - row * 12, step = 56;
        for (let cxp = Math.ceil(Math.max(-40, x0) / step) * step; cxp < Math.min(SW + 40, x1); cxp += step) {
          const wx = Math.round((dir > 0 ? cxp - xa : xa - cxp) / step), q = someone(h * 1000 + row * 97 + wx, cols);
          const up = q.ph < kk / 3.3;
          g.globalAlpha = row ? 0.75 : 1;
          person(g, cxp + (row ? step / 2 : 0), y, hh * q.hk, { shirt: q.shirt, skin: q.skin, hair: q.hair, pose: up ? "cheer" : "stand", t: s.t * 1.3 + q.ph });
        }
      }
      g.globalAlpha = 1;
    }
    // start and finish: the Records Board, in Hare
    for (const lp of [0, LAP]) {
      const x = sx(lp);
      if (x > -260 && x < SW + 260) {
        board(g, x, 318, 400, 132, "RECORDS", "axis · spin · anti");
        seg(g, x, FLOOR_Y - 2, x, FLOOR_Y + 150, 10, PAPER);
        for (let i = 0; i < 7; i++) fillRR(g, x - 5 + (i % 2 ? 5 : -5) - 5, FLOOR_Y + i * 22, 10, 22, 0, i % 2 ? INK : PAPER);
      }
    }
    // the track
    g.fillStyle = "#2a3035"; g.fillRect(0, FLOOR_Y, SW, SH - FLOOR_Y);
    g.fillStyle = "#3a4248"; g.fillRect(0, FLOOR_Y, SW, 8);
    for (let m = Math.floor((s.p - 250) / 50) * 50; m < s.p + 300; m += 50) { const x = sx(m); fillRR(g, x - 14, FLOOR_Y + 70, 28, 6, 3, alpha(PAPER, 0.25)); }
    spinMark(g, dir > 0 ? 880 : 120, FLOOR_Y + 60, alpha(PAPER, 0.45), 1, 20);

    // runners, the far ones squeezed toward the edges so you can always see who is near
    const runners = s.rivals.map((r) => ({ n: r.n, d: r.p - s.p, ph: r.ph, v: r.v, done: r.done && r.p >= LAP })).filter((r) => Math.abs(r.d) < 700 && !(r.done && s.finished));
    runners.sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
    const H = 235;
    for (const r of runners) {
      const P = PALS[r.n], x = X0 + dir * 470 * r.d / (Math.abs(r.d) + 170), far = clamp(1.15 - Math.abs(r.d) / 700, 0.4, 1);
      g.globalAlpha = far;
      person(g, x, FLOOR_Y + 14 + (r.n % 3) * 9, H * (0.9 + (r.n % 4) * 0.03), { view: "side", face: dir, pose: "run", t: s.t * (2.6 + r.v * 0.05) + r.ph, shirt: P.a, legs: shade(P.a, -0.5), sash: P.b, skin: SKINS[(r.n * 5) % 6], hair: HAIRS[(r.n * 3) % 6] });
      g.globalAlpha = 1;
    }
    // you
    const lift = s.air > 0 ? s.airH * 150 : (s.mode === "light" ? Math.abs(Math.sin(s.stride * Math.PI)) * (10 + 26 * s.float) : 0);
    if (lift > 4) { g.beginPath(); g.ellipse(X0, FLOOR_Y + 24, 46 - lift * 0.12, 8, 0, 0, TAU); g.fillStyle = alpha(INK, 0.35); g.fill(); }
    const pose = s.finished ? "cheer" : "run";
    person(g, X0, FLOOR_Y + 22 - lift, H * 1.04, {
      view: s.finished ? "front" : "side", face: dir, pose, t: s.finished ? s.t : s.stride * 0.62, shirt: CP.a, legs: shade(CP.a, -0.5), sash: CP.b, skin: SKINS[2], hair: HAIRS[1],
      lean: s.air > 0 ? -0.25 * s.airH : s.blown > 0 ? 0.12 : 0,
      arms: s.air > 0 ? [[2.4 + Math.sin(s.t * 14), 0.3], [-1.6 + Math.cos(s.t * 13), 0.4]] : undefined,
    });
    // the threads on your wrist are why they know you: a small marker over your head
    poly(g, [X0 - 12, FLOOR_Y - 262 - lift, X0 + 12, FLOOR_Y - 262 - lift, X0, FLOOR_Y - 244 - lift], PAPER);
    s.parts.draw(g); s.notes.draw(g);

    // which Hour you're in, and how well it knows you
    const hp = PALS[s.hour];
    if (!s.finished) {
      fillRR(g, 24, 150, 330, 92, 10, alpha(INK, 0.84));
      fillRR(g, 24, 150, 12, 92, 4, hp.a);
      sign(g, HOURS[s.hour].name.toUpperCase(), 52, 197, 48, PAPER, "left", 800);
      for (let i = 0; i < 3; i++) { if (i < s.knots) knot(g, 222 + i * 30, 181, 11, hp.light, hp.dark); else ring(g, 222 + i * 30, 181, 9, 2.5, alpha(PAPER, 0.3)); }
      mono(g, HOURS[s.hour].name + " " + CROWD_WORD[s.knots], 52, 228, 19, alpha(PAPER, 0.8), "left");
    }

    // the clock, with everyone on it
    const cx = 868, cy = 196, R = 84;
    disc(g, cx, cy, R + 22, alpha(INK, 0.84));
    for (let n = 1; n <= 12; n++) { wedgePath(g, cx, cy, R - 9, R + 9, (n - 1) * TAU / 12 + 0.02, n * TAU / 12 - 0.02); g.fillStyle = HOURS[n].a; g.fill(); }
    const ang = (p) => hourAngle(1) + dir * (p / LAP) * TAU;
    for (const r of s.rivals) { const a = ang(Math.min(r.p, LAP)); disc(g, cx + (R - 26) * Math.sin(a), cy - (R - 26) * Math.cos(a), 5, HOURS[r.n].a); }
    const ya = ang(s.p); disc(g, cx + (R - 26) * Math.sin(ya), cy - (R - 26) * Math.cos(ya), 9, PAPER); disc(g, cx + (R - 26) * Math.sin(ya), cy - (R - 26) * Math.cos(ya), 5.5, CP.a);
    sign(g, ordinal(s.place).toUpperCase(), cx, cy + 15, 44, PAPER, "center", 800);

    // your legs (and, in the Light Round, how close you are to leaving the ground)
    const bx = 250, bw = 500, by = FLOOR_Y + 112;
    fillRR(g, bx - 8, by - 34, bw + 16, s.mode === "light" ? 104 : 62, 12, alpha(INK, 0.86));
    sign(g, "LEGS", bx, by - 8, 22, alpha(PAPER, 0.8), "left", 700);
    fillRR(g, bx + 70, by - 24, bw - 70, 20, 10, "#3a4248");
    fillRR(g, bx + 70, by - 24, Math.max(8, (bw - 70) * s.legs), 20, 10, s.blown > 0 ? "#b0503f" : s.legs < 0.22 ? "#d08a3c" : PAPER);
    if (s.mode === "light") {
      sign(g, "FLOAT", bx, by + 34, 22, alpha(PAPER, 0.8), "left", 700);
      fillRR(g, bx + 70, by + 18, bw - 70, 20, 10, "#3a4248");
      fillRR(g, bx + 70, by + 18, Math.max(8, (bw - 70) * clamp(s.float, 0, 1)), 20, 10, s.float > 0.7 ? "#d08a3c" : "#9fc6d6");
    }
    if (s.push) { ring(g, bx + bw + 40, by - (s.mode === "light" ? -8 : 14), 16, 5, PAPER); }
    if (s.finished) { g.globalAlpha = smooth(0.1, 0.5, s.endT); board(g, 500, 520, 520, 180, ordinal(s.place).toUpperCase() + " HOME", raceClock(s.finished * FAST) + " for the 13.8 km"); g.globalAlpha = 1; }
  }

  // The house runs it: push where the crowd knows you and the legs allow, ease before they go, and in the Light Round keep the stride low.
  function bot(s, b, ctx) {
    const sk = ctx.skill, k = s.knots, last = s.idx >= 12, left = (LAP - s.p) / (s.v * FAST);
    if (s._b === undefined) { s._b = false; s._n = 0; }
    s._n += (ctx.rng() - 0.5) * 0.06; s._n *= 0.98;
    const sloppy = (1 - sk);
    // empty the tank by the line; otherwise push down to a floor that is lower where pushing is cheap
    const floor = last || left < 6 ? 0.03 : 0.5 - 0.12 * k + s._n * sloppy * 4 - sloppy * 0.45;
    const top = last ? 0.05 : Math.min(0.98, floor + 0.3 + sloppy * 0.3);
    if (s._b && s.legs < floor) s._b = false; else if (!s._b && s.legs > top) s._b = true;
    let push = s._b;
    if (sk < 0.2) push = true;                                   // the beginner's race: flat out until the legs go
    if (s.mode === "light" && sk >= 0.2) {
      const lim = 0.72 + sloppy * 0.5;
      if (s.float > lim) s._f = true; else if (s.float < 0.3) s._f = false;
      if (s._f) push = false;
    }
    b.x = 500; b.y = 500; b.down = push;
  }

  /* ---- the cards ---- */
  function bestLine(mode) { const r = Game.st.round[mode]; return r ? "Best: " + ordinal(r.place) + ", " + raceClock(r.time) : ""; }

  function showCard() {
    stopRun(); Game.view = "round"; Game.hour = 0; setDye(Game.st.club); setHash("round");
    const C = HOURS[Game.st.club], tc = threadCount(), kc = knotCount();
    let h = eyebrow(0, "Deck 201 · the Round Arcade · 13.8 km · 0.73 g");
    h += "<h2>The Round</h2>";
    h += "<p>Once a year the Arcade is cleared and the twelve Hours race right round the drum, start and finish in Hare under the Records Board. It is run twice on the same day: spinward, where every stride is a tenth heavier, and antispinward, where every stride is a tenth lighter and the trick is to stay on the ground.</p>";
    h += "<p>" + (tc === 0 ? "You have no threads yet, so only " + esc(C.name) + " will know you. You can run now, or go round the clock first." : "You wear " + numWord(tc) + (tc === 1 ? " thread" : " threads") + ", " + kc + (kc === 1 ? " knot" : " knots") + ". Where an Hour has tied its thread on you, its crowd carries you: pushing costs your legs less there, and more knots count for more.") + "</p>";
    for (const mode of ["heavy", "light"]) {
      const M = MODES[mode], w = Math.pow(1 + M.dir * 6 / DECK_V, 2), best = bestLine(mode);
      h += '<div class="gamebox"><h3>' + esc(M.name) + '</h3><p class="where">' + cap(M.way) + ", " + M.when + " · " + fmtG(0.733 * w) + " at full stride</p>";
      h += '<p class="how"><b>How:</b> ' + (mode === "heavy" ? "Hold to push, let go to ease. The bar is your legs: don't empty it. Push where the crowd knows you, and leave something for Hare." : "Hold to push, let go to ease. Push too long and you float off the floor and land long: keep the stride low.") + '<span class="keys">Keys: hold Space</span></p>';
      h += '<div class="row"><button class="btn primary big" type="button" data-act="run" data-mode="' + mode + '">Run it</button>' + (best ? '<span class="marks">' + esc(best) + "</span>" : "") + "</div></div>";
    }
    h += '<div class="note"><h4>The Records Board</h4><p>Stag has held the Heavy Round record, ' + raceClock(MODES.heavy.record) + ", for thirty-one years, and mentions it. Hare holds the Light, " + raceClock(MODES.light.record) + ", and mentions that. The Light record is the faster; the Heavy is the one runners boast about.</p></div>";
    h += '<div class="row"><button class="btn" type="button" data-act="clock">Back to the clock</button></div>';
    setPanel(h); drawTop();
    Run.demo(0, { mode: "heavy" });
  }

  function showPlaying(ctx) {
    Game.view = "play";
    const mode = ctx.opt.mode, M = MODES[mode];
    let h = eyebrow(0, "Deck 201 · the Round Arcade");
    h += "<h3>" + esc(M.name) + '</h3><p class="where">13.8 km ' + M.way + ", start and finish in Hare</p>";
    h += '<p class="how">' + (mode === "heavy" ? "Hold to push, let go to ease. Don't empty your legs. Push where the crowd knows you." : "Hold to push, let go to ease. Push too long and you float: keep the stride low.") + '<span class="keys">Keys: hold Space</span></p>';
    h += '<div class="row"><button class="btn" type="button" data-act="round">Leave the race</button></div>';
    setPanel(h);
  }

  function finish(s, ctx) {
    const mode = s.mode, M = s.M, club = ctx.club, C = HOURS[club];
    const time = s.finished * FAST;
    const rows = s.rivals.map((r) => ({ n: r.n, time: r.done * FAST })).concat([{ n: club, time, me: true }]).sort((a, b) => a.time - b.time);
    const place = rows.findIndex((r) => r.me) + 1;
    const res = { id: "round-" + mode, score: 13 - place, knots: 0, text: ordinal(place) + " of twelve", place, time };
    window.__rtc.result = res; window.__rtc.results.push(res);
    const old = Game.st.round[mode];
    const record = time < M.record;
    if (!Run.bot || QUERY.keep) {
      if (!old || place < old.place || (place === old.place && time < old.time)) Game.st.round[mode] = { place, time: Math.round(time) };
      saveState();
    }
    Game.view = "roundresult";
    let h = eyebrow(0, M.name + " · " + raceClock(time));
    h += '<p class="score">' + (place === 1 ? "First home" : ordinal(place) + " of twelve") + "</p>";
    let line;
    if (place === 1) line = "First under the Records Board. " + C.name + " will re-dye everything it owns.";
    else if (place <= 3) line = "On the board's top three, which " + C.name + " will read out for a year.";
    else if (place <= 8) line = "Home in the pack. " + C.name + " has finished there before, and will say so.";
    else if (place < 12) line = "Home with the stragglers, to a long clap.";
    else line = "Last home, to the crowd that saw you off, and Sorrel clapped you louder than the winner.";
    if (record) line += " And " + raceClock(time) + " is a new mark on the board: " + HOURS[M.holder].name + " will want a recount.";
    h += '<p class="host">' + esc(line) + "</p>";
    const bits = [];
    if (s.blownN) bits.push("legs gone " + (s.blownN === 1 ? "once" : s.blownN + " times"));
    if (s.tookOff) bits.push("took off " + (s.tookOff === 1 ? "once" : s.tookOff + " times"));
    h += '<p class="marks">' + esc(raceClock(time) + " for the 13.8 km" + (place > 1 ? ", " + raceClock(time - rows[0].time) + " behind " + HOURS[rows[0].n].name : "") + (bits.length ? "; " + bits.join(", ") : "") + ".") + "</p>";
    h += '<ol class="hours long">';
    rows.forEach((r, i) => { const H = HOURS[r.n]; h += '<li><div class="chip' + (r.me ? " mine hot" : "") + '" style="--ca:' + H.a + ";--cb:" + H.b + ';cursor:default"><span class="sw"></span><span class="nm">' + (i + 1) + ". " + esc(H.name) + (r.me ? " (you)" : "") + '</span><span class="me">' + raceClock(r.time) + "</span></div></li>"; });
    h += "</ol>";
    h += '<div class="note"><h4>At the club room: ' + esc(C.dish.name) + "</h4><p>" + esc(C.dish.text) + " Visitors from " + esc(HOURS[oppositeHour(club)].name) + " are fed too, but last, and told so.</p></div>";
    const other = mode === "heavy" ? "light" : "heavy";
    const both = Game.st.round.heavy && Game.st.round.light;
    h += '<div class="row"><button class="btn primary big" type="button" data-act="run" data-mode="' + other + '">' + (Game.st.round[other] ? "Run " : "Now ") + esc(MODES[other].name.toLowerCase()) + '</button><button class="btn" type="button" data-act="run" data-mode="' + mode + '">Again</button><button class="btn" type="button" data-act="clock">The clock</button></div>';
    if (both) {
      const sum = "Round the Clock: I ran for " + C.name + ", " + C.nick + ". " + threadCount() + " threads, " + knotCount() + " knots. Heavy Round: " + ordinal(Game.st.round.heavy.place) + ", " + raceClock(Game.st.round.heavy.time) + ". Light Round: " + ordinal(Game.st.round.light.place) + ", " + raceClock(Game.st.round.light.time) + ".";
      h += '<div class="gamebox"><h3>The day ends at the bandstand</h3><p>At seven the band in Lark plays the Round out. Its last chord goes up three kilometres to the far bank of the Hollow and comes back nearly ten seconds later, and nobody claps until it has.</p><div class="row"><button class="btn" type="button" data-act="chord">Hear the last chord</button><span class="marks" id="chordNote"></span></div>';
      h += '<p class="where" id="sumText">' + esc(sum) + '</p><div class="row"><button class="btn" type="button" data-act="copysum">Copy that</button></div></div>';
    }
    setPanel(h); drawTop();
    if (place <= 3) Snd.great(); else Snd.good();
  }

  ACTIONS.run = function (n, btn) { Run.play(0, { mode: btn.getAttribute("data-mode") || "heavy" }); };
  ACTIONS.chord = function () {
    Snd.wake(); Snd.chord();
    const el = $("#chordNote"); if (!el) return;
    el.textContent = "There. Now wait for the far bank.";
    setTimeout(() => { if ($("#chordNote") === el) el.textContent = "And there it is. Now they clap."; Snd.clap(14); }, 10300);
  };
  ACTIONS.copysum = function (n, btn) {
    const el = $("#sumText"); if (!el) return;
    const done = () => { btn.textContent = "Copied"; };
    const pick = () => { try { const r = document.createRange(); r.selectNodeContents(el); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); btn.textContent = "Selected: copy it"; } catch (e) { /* nothing more to try */ } };
    try { navigator.clipboard.writeText(el.textContent).then(done, pick); } catch (e) { pick(); }
  };

  registerEvent({
    id: "round", hour: 0, name: "The Round",
    place: "The Round Arcade, deck 201 · 13.8 km · 0.73 g",
    how: "Hold to push, let go to ease.", keys: "hold Space",
    marks: [5, 10, 12],
    create, update, draw, bot, finish, showCard, showPlaying,
    start(mode) { Run.play(0, { mode: mode === "light" ? "light" : "heavy" }); },
    modes: MODES,
  });
})();
