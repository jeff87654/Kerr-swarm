/* ---------- Otter: The Jetty ----------
   Bench Island sits in the middle of Otter's lake on the Hollow floor (r = 1,500 m, half a g). Its plank jetty
   ends in two boards, one and three metres up; this is the three-metre one, and the elders on the bench judge.
   At half a g a fall takes root-two times as long as at the rim, so a dive has time in it: room for somersaults
   that would be impossible at 1 g, and room to get the entry right.
   The diver flies in the floor's own frame (spinStep): pushed spinward while rising, anti while falling.
   The float on the water marks where the same dive would have gone in with no spin under it. */
"use strict";
(function () {
  const G = 0.5 * DRUM.G0;                 // the Hollow floor, m/s2
  const DT = 1 / 120;
  const BOARD_Y = 3.0;                     // top of the board above the water, m
  const TIP_FEET = -0.22;                  // where the diver stands, just short of the tip
  const P_B = 1.2;                         // s, one bounce on the end of the board
  const FLEX = 0.2;                        // m, how far the tip dips at the bottom
  const HOP = G * (P_B / 2) * (P_B / 2) / 8;
  const WIN = 0.26;                        // s either side of the bottom that still gives some spring
  const V_LO = 2.6, V_HI = 4.2, V_OUT = 0.8;
  const W_TUCK = 1.9, W_OPEN = 0.45;       // turns a second
  const TAU_IN = 0.14, TAU_OUT = 0.06;     // how fast the body folds and opens
  const ENTRY_Y = 0.93;                    // the middle of a straight body when its hands reach the water
  const DIVES = 3;
  // the body in metres, in person()'s proportions at 1.75 m
  const B = { th: 0.376, sh: 0.376, to: 0.54, hr: 0.18, ua: 0.29, fa: 0.28, lw: 0.15, aw: 0.115 };
  // the place, metres: x spinward from the board's tip, y up from the water
  const DECK = 0.45, JETTY0 = -7.3, JETTY1 = -1.0, LADDER = -1.15, TOWER = -4.9, FULC = -3.0, BACK = -4.7;
  const RAIL0 = -3.95, RAIL1 = -2.05, ROBES = [-3.65, -3.05, -2.45];
  const ELDERS = [-9.9, -8.75, -7.6], LAWN_Y = 0.6, SEAT_Y = 0.95;
  const GUARD_X = 4.0;
  const WIDE = { x: -3.6, y: 2.5, s: 60 }, BOUNCE = { x: -0.7, y: 2.6, s: 135 };
  // after a dive: when each thing happens (s)
  const A_SWIM0 = 0.55, A_SWIM1 = 1.15, A_CLIMB1 = 1.4, A_WALK1 = 1.62, A_ROBE1 = 1.85, A_NEXT = 3.1;
  const C_UP = 0.85, C_LINE = 1.35, C_SUM = 1.85;

  const fmt1 = (v) => (Math.round(v * 10 + 1e-6) / 10).toFixed(1);

  /* ---- the diver's body: joint angles, limb() style (radians from straight down, + is forward) ---- */
  const STRAIGHT = { ta: Math.PI, hd: 0, th: 0, kn: 0, ar: Math.PI, el: 0, thF: 0, knF: 0, arF: Math.PI, elF: 0 };
  const TUCK = { ta: Math.PI - 0.5, hd: -0.45, th: 2.3, kn: -2.2, ar: 0.55, el: -0.45, thF: 2.2, knF: -2.15, arF: 0.45, elF: -0.4 };
  function mixPose(A, Z, t) { const o = {}; for (const k in A) o[k] = A[k] + (Z[k] - A[k]) * t; return o; }
  function bouncePose(u) {
    const c = Math.max(0, Math.cos(TAU * u));                 // crouched while the board is down
    const arm = 0.5 + 0.5 * Math.cos(TAU * (u - 0.5));        // arms up at the top of the hop
    const ar = lerp(-0.45, Math.PI - 0.05, arm);
    return { ta: Math.PI - 0.32 * c, hd: 0.1 * c, th: 0.75 * c, kn: -1.45 * c, ar, el: 0.25 * (1 - arm), thF: 0.7 * c, knF: -1.4 * c, arF: ar - 0.12, elF: 0.25 * (1 - arm) };
  }
  function walkPose(ph) {
    const w = Math.sin(ph), c = Math.cos(ph);
    return { ta: Math.PI - 0.04, hd: 0, th: 0.42 * w, kn: -0.5 * Math.max(0, -c), ar: -0.35 * w, el: 0.3, thF: -0.42 * w, knF: -0.5 * Math.max(0, c), arF: 0.35 * w, elF: 0.3 };
  }
  function climbPose(ph) {
    const w = Math.sin(ph);
    return { ta: Math.PI - 0.12, hd: -0.1, th: 0.9 + 0.35 * w, kn: -1.4 - 0.3 * w, ar: Math.PI - 0.45 + 0.2 * w, el: -0.5, thF: 0.9 - 0.35 * w, knF: -1.4 + 0.3 * w, arF: Math.PI - 0.45 - 0.2 * w, elF: -0.5 };
  }
  const REACH = { ta: Math.PI - 0.05, hd: 0.1, th: 0.05, kn: 0, ar: 2.55, el: 0.2, thF: -0.05, knF: 0, arF: 0.3, elF: 0.2 };

  function joints(P) {
    const sn = Math.sin, cs = Math.cos;
    const S = [B.to * sn(P.ta), B.to * cs(P.ta)];
    const ha = P.ta + P.hd;
    const Hd = [S[0] + B.hr * 1.02 * sn(ha), S[1] + B.hr * 1.02 * cs(ha)];
    const K = [B.th * sn(P.th), B.th * cs(P.th)];
    const F = [K[0] + B.sh * sn(P.th + P.kn), K[1] + B.sh * cs(P.th + P.kn)];
    const KF = [B.th * sn(P.thF), B.th * cs(P.thF)];
    const FF = [KF[0] + B.sh * sn(P.thF + P.knF), KF[1] + B.sh * cs(P.thF + P.knF)];
    const E = [S[0] + B.ua * sn(P.ar), S[1] + B.ua * cs(P.ar)];
    const Hn = [E[0] + B.fa * sn(P.ar + P.el), E[1] + B.fa * cs(P.ar + P.el)];
    const EF = [S[0] + B.ua * sn(P.arF), S[1] + B.ua * cs(P.arF)];
    const HnF = [EF[0] + B.fa * sn(P.arF + P.elF), EF[1] + B.fa * cs(P.arF + P.elF)];
    // the middle of the body, roughly where its mass is: what it turns about in the air
    const pts = [[S[0] / 2, S[1] / 2, 3], [Hd[0], Hd[1], 0.8], [K[0] / 2 + KF[0] / 2, K[1] / 2 + KF[1] / 2, 1.4],
      [(K[0] + F[0] + KF[0] + FF[0]) / 4, (K[1] + F[1] + KF[1] + FF[1]) / 4, 0.8], [(E[0] + EF[0]) / 2, (E[1] + EF[1]) / 2, 0.6]];
    let cx = 0, cy = 0, w = 0;
    for (const p of pts) { cx += p[0] * p[2]; cy += p[1] * p[2]; w += p[2]; }
    return { S, Hd, ha, K, F, KF, FF, E, Hn, EF, HnF, C: [cx / w, cy / w], ground: Math.max(F[1], FF[1]) };
  }

  function path3(g, a, b, c, w, col) {
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]);
    g.lineWidth = w; g.strokeStyle = col; g.lineCap = "round"; g.lineJoin = "round"; g.stroke();
  }
  // the body in its own metres: hip at the origin, y down
  function bodyLocal(g, J, c) {
    const H = [0, 0];
    path3(g, H, J.KF, J.FF, B.lw, c.skinD);
    path3(g, J.S, J.EF, J.HnF, B.aw, c.skinD);
    path3(g, H, J.K, J.F, B.lw, c.skin);
    // the costume: torso and the top of the thighs
    seg(g, 0, 0, J.K[0] * 0.38, J.K[1] * 0.38, 0.2, c.suit);
    seg(g, 0, 0, J.KF[0] * 0.3, J.KF[1] * 0.3, 0.19, c.suitD);
    const tx = J.S[0] * 0.08, ty = J.S[1] * 0.08;
    seg(g, tx, ty, J.S[0] * 0.92, J.S[1] * 0.92, 0.27, c.suit);
    // head and cap
    disc(g, J.Hd[0], J.Hd[1], B.hr, c.skin);
    const up = Math.atan2(Math.cos(J.ha), Math.sin(J.ha));
    g.beginPath(); g.arc(J.Hd[0], J.Hd[1], B.hr * 1.05, up - 1.85, up + 1.25); g.closePath(); g.fillStyle = c.cap; g.fill();
    path3(g, J.S, J.E, J.Hn, B.aw, c.skin);
    disc(g, J.Hn[0], J.Hn[1], B.aw * 0.62, c.skin);
  }
  // anchor "C": (sx, sy) is the body's middle and it turns by rot; "G": (sx, sy) is where its feet stand
  function drawBody(g, P, sx, sy, sc, rot, face, cols, anchor) {
    const J = joints(P);
    const ax = anchor === "G" ? 0 : J.C[0], ay = anchor === "G" ? J.ground : J.C[1];
    g.save(); g.translate(sx, sy); if (rot) g.rotate(rot); g.scale(sc * face, sc); g.translate(-ax, -ay);
    bodyLocal(g, J, cols);
    g.restore();
  }

  /* ---- flight ---- */
  function flyStep(d, hold, dt) {
    d.k += ((hold ? 1 : 0) - d.k) * (1 - Math.exp(-dt / (hold ? TAU_IN : TAU_OUT)));
    d.rot += lerp(W_OPEN, W_TUCK, d.k) * dt;
    spinStep(d, dt, G);
  }
  const entryY = (k) => ENTRY_Y - 0.5 * k;
  const inWater = (p) => p.vy < 0 && p.y <= entryY(p.k);
  // where and how the diver goes in, if they hold (or don't) from now on
  function predict(d, hold) {
    const p = { x: d.x, y: d.y, vx: d.vx, vy: d.vy, rot: d.rot, k: d.k };
    for (let i = 0; i < 1500; i++) { flyStep(p, hold, DT); if (inWater(p)) break; }
    return p;
  }
  // the same take-off with no spin under it
  function noSpinX(d) {
    const t = (d.vy + Math.sqrt(d.vy * d.vy + 2 * G * (d.y - ENTRY_Y))) / G;
    return d.x + d.vx * t;
  }

  /* ---- the board ---- */
  const contact = (u) => u < 0.25 || u > 0.75;
  function tipDip(s) {
    if (s.phase === "bounce") {
      const u = (s.bt / P_B) % 1;
      return contact(u) ? FLEX * Math.cos(TAU * u) : -0.15 * FLEX * Math.sin(Math.PI * (u - 0.25) / 0.5);
    }
    const t = s.board.t;
    return s.board.a * Math.exp(-3 * t) * Math.cos(TAU * 2.3 * t);
  }
  const dipAt = (x, tip) => (x <= FULC ? -0.06 * tip * (x - BACK) / (FULC - BACK) : tip * Math.pow((x - FULC) / (0 - FULC), 2));
  function feetY(s) {
    const u = (s.bt / P_B) % 1;
    return contact(u) ? BOARD_Y - dipAt(TIP_FEET, tipDip(s)) : BOARD_Y + HOP * Math.sin(Math.PI * (u - 0.25) / 0.5);
  }

  function create(ctx) {
    return {
      t: 0, phase: "walk", pt: 0, dive: 0, score: 0, total: 0, best: 0, done: false,
      d: { x: 0, y: 0, vx: 0, vy: 0, rot: 0, k: 0 }, P0: null, lb: 0, held: false,
      bt: 0, lastU: 0, cur: null, dives: [], ghost: null, floatX: null,
      board: { a: 0, t: 9 }, cam: { x: WIDE.x, y: WIDE.y, s: WIDE.s },
      drops: [], rings: [], notes: new Notes(), wearing: false, said: -1,
    };
  }

  function takeoff(s, ctx) {
    const u = (s.bt / P_B) % 1;
    const ub = u > 0.5 ? u - 1 : u, dtb = ub * P_B;
    const q = clamp(1 - Math.abs(dtb) / WIN, 0, 1);
    const P = bouncePose(u), J = joints(P), fy = feetY(s);
    s.d = { x: TIP_FEET + J.C[0], y: fy + (J.ground - J.C[1]), vx: V_OUT, vy: lerp(V_LO, V_HI, q), rot: 0, k: 0 };
    s.P0 = P; s.lb = 1;
    s.board = { a: tipDip(s) + 0.06 + 0.1 * q, t: 0 };
    s.cur = { q, vy: s.d.vy, x1: null, early: dtb < 0 };
    s.floatX = noSpinX(s.d);
    s.phase = "air"; s.pt = 0; s.ghost = null;
    const sx = scrX(s, TIP_FEET), sy = scrY(s, BOARD_Y) - 40;
    const word = q > 0.85 ? "big spring" : q > 0.55 ? "good spring" : dtb < 0 ? "early" : "late";
    s.notes.add(word, sx, sy, { size: 40, col: q > 0.55 ? ctx.pal.aDD : alpha(INK, 0.7), life: 1.0 });
    ctx.sfx.thud(0.35 + 0.5 * q); ctx.sfx.whoosh(0.6 + 0.6 * q);
  }

  function entry(s, ctx) {
    const d = s.d, c = s.cur, rng = ctx.rng;
    const off = d.rot - (Math.floor(d.rot) + 0.5);            // turns past head-down: + over, - short
    const errA = Math.abs(off) * 360;
    const err = errA + d.k * 70;                                 // going in tucked is a cannonball
    const soms = Math.max(0, Math.floor(d.rot));
    const E = 10 * Math.pow(Math.max(0, 1 - err / 55), 1.3);
    const cards = [0, 1, 2].map(() => clamp(Math.round((E + rng.range(-0.45, 0.45)) * 2) / 2, 0, 10));
    const mark = cards.slice().sort((a, b) => a - b)[1];
    const D = 1 + 0.35 * soms;
    Object.assign(c, { off, errA, err, soms, E, cards, mark, D, x: d.x, tucked: d.k > 0.5 });
    c.score = Math.round(mark * D * 10 + 1e-6) / 10;
    c.drift = (c.x1 === null ? d.x : c.x1) - s.floatX;
    s.dives.push(c);
    // the splash: a rip leaves almost nothing
    const kS = clamp((errA - 5) / 45, 0, 1) * 0.9 + d.k * 0.7 + (errA > 60 ? 0.3 : 0);
    c.kS = kS;
    const n = Math.round(5 + 75 * kS);
    for (let i = 0; i < n; i++) {
      const side = rng.sign();
      s.drops.push({ kind: "drop", x: d.x + side * rng.range(0.02, 0.2) * (0.4 + kS), y: 0.02, vx: side * rng.range(0.1, 1) * (0.3 + 2 * kS), vy: rng.range(0.9, 3.4) * (0.35 + 0.9 * kS), r: rng.range(0.02, 0.055) * (0.6 + kS), age: 0, life: 3 });
    }
    if (kS < 0.15) for (let i = 0; i < 6; i++) s.drops.push({ kind: "drop", x: d.x + rng.range(-0.04, 0.04), y: 0.02, vx: rng.range(-0.12, 0.12), vy: rng.range(1.2, 2.4), r: 0.022, age: 0, life: 3 });
    s.drops.push({ kind: "foam", x: d.x, y: 0, r: 0.25 + 0.9 * kS, age: 0, life: 1.6 + kS });
    s.rings.push({ x: d.x, t: 0, k: 0.35 + kS });
    ctx.sfx.splash(0.22 + 1.0 * kS);
    const word = c.tucked ? "cannonball" : errA < 5 ? "rip" : errA < 14 ? "clean" : errA > 70 ? (Math.abs(off) > 0.38 ? "feet first" : "flat") : errA < 32 ? (off < 0 ? "a bit short" : "a bit over") : (off < 0 ? "short" : "over");
    const sx = scrX(s, d.x), sy = scrY(s, 0);
    s.notes.add(word, sx, sy - 150, { size: errA < 5 ? 66 : 52, col: errA < 14 ? ctx.pal.aDD : INK, life: 1.5 });
    const cm = Math.round(Math.abs(c.drift) * 100);
    s.notes.add(cm < 1 ? "true" : cm + " cm " + (c.drift < 0 ? "anti" : "spinward"), sx, sy - 96, { size: 34, col: alpha(INK, 0.75), life: 1.6, rise: 30 });
    s.phase = "after"; s.pt = 0; s.ghost = null;
  }

  // the camera keeps the diver and the water in the picture
  function camAim(s) {
    switch (s.phase) {
      case "walk": return s.dive === 0 && s.pt < 0.5 ? WIDE : BOUNCE;
      case "bounce": return BOUNCE;
      case "air": {
        const top = s.d.y + 1.3, bot = -1.15, sc = clamp(800 / (top - bot), 90, 140);
        return { x: clamp(s.d.x * 0.55 + 0.1, -0.7, 2.5), y: (top + bot) / 2 + 25 / sc, s: sc };
      }
      case "after": return s.pt < 0.75 ? { x: s.cur.x - 0.4, y: 1.7, s: 125 } : WIDE;
      default: return WIDE;
    }
  }
  const scrX = (s, x) => 500 + (x - s.cam.x) * s.cam.s;
  const scrY = (s, y) => 500 - (y - s.cam.y) * s.cam.s;
  const crossed = (t, dt, at) => t >= at && t - dt < at;

  function update(s, dt, inp, ctx) {
    s.t += dt; s.pt += dt;
    s.notes.update(dt);
    s.board.t += dt;
    for (let i = s.rings.length - 1; i >= 0; i--) { s.rings[i].t += dt; if (s.rings[i].t > 2.6) s.rings.splice(i, 1); }
    for (let i = s.drops.length - 1; i >= 0; i--) {
      const p = s.drops[i]; p.age += dt;
      if (p.kind === "drop") { p.vy -= G * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.y < 0 && p.vy < 0) p.age = p.life; }
      else if (p.kind === "bub") { p.y += p.vy * dt; p.x += 0.05 * Math.sin(p.age * 9 + p.r * 99) * dt; if (p.y > -0.03) p.age = p.life; }
      if (p.age >= p.life) s.drops.splice(i, 1);
    }
    const a = camAim(s), kc = 1 - Math.exp(-dt * (s.phase === "air" ? 5 : 2.4));
    s.cam.x += (a.x - s.cam.x) * kc; s.cam.y += (a.y - s.cam.y) * kc;
    s.cam.s = Math.exp(lerp(Math.log(s.cam.s), Math.log(a.s), kc));
    ctx.hud.set("dive " + Math.min(DIVES, s.dive + 1) + " of " + DIVES + "\n" + fmtG(0.5), "total " + fmt1(s.total));

    if (s.phase === "walk") {
      if (s.pt >= (s.dive === 0 ? 1.6 : 1.1)) { s.phase = "bounce"; s.pt = 0; s.bt = 0.25 * P_B; s.lastU = 0.25; }
    } else if (s.phase === "bounce") {
      if (s.said !== s.dive) {
        s.said = s.dive;
        if (s.dive === 0) ctx.say("Tap as the board bottoms out. Hold to tuck, let go to open.", 5);
        else if (s.dive === 1) ctx.say("Half a g: the fall takes half again as long. Use it.", 4);
        else ctx.say("The faint figure by the water is how you'll go in. A quick tap tucks a little more.", 4.5);
      }
      s.bt += dt;
      const u = (s.bt / P_B) % 1;
      if (s.lastU <= 0.75 && u > 0.75) ctx.sfx.step();
      s.lastU = u;
      if (inp.pressed || s.bt > 14) takeoff(s, ctx);
    } else if (s.phase === "air") {
      const d = s.d;
      s.held = inp.down;
      if (inp.pressed) ctx.sfx.whoosh(0.35);
      if (inp.released) ctx.sfx.pop();
      flyStep(d, s.held, dt);
      s.lb *= Math.exp(-dt / 0.09);
      if (s.cur.x1 === null && d.vy < 0 && d.y <= ENTRY_Y) s.cur.x1 = d.x;
      if (inWater(d)) entry(s, ctx);
      else s.ghost = d.k < 0.45 ? predict(d, false) : null;
    } else if (s.phase === "after" || s.phase === "end") {
      const d = s.d, c = s.cur, pt = s.pt;
      if (s.phase === "after") {
        if (pt < A_SWIM0) {
          d.vy *= Math.exp(-dt * 3.2); d.vx *= Math.exp(-dt * 3); d.x += d.vx * dt; d.y += d.vy * dt;
          d.rot += 0.08 * dt; d.k = approach(d.k, 0, dt * 3);
          if (ctx.rng() < dt * 30) s.drops.push({ kind: "bub", x: d.x + ctx.rng.range(-0.3, 0.3), y: Math.min(-0.2, d.y), vy: ctx.rng.range(0.6, 1.3), r: ctx.rng.range(0.02, 0.05), age: 0, life: 2 });
        }
        for (let i = 0; i < 3; i++) if (crossed(pt, dt, C_UP + 0.15 * i)) ctx.sfx.clack();
        if (crossed(pt, dt, C_LINE)) ctx.sfx.tap();
        if (crossed(pt, dt, C_SUM)) {
          s.total = Math.round((s.total + c.score) * 10 + 1e-6) / 10; s.score = s.total;
          s.best = Math.max(s.best, c.score);
          if (c.mark >= 9) ctx.sfx.great(); else if (c.mark >= 5) ctx.sfx.chime(Math.round(c.mark)); else if (c.mark >= 2) ctx.sfx.good(); else ctx.sfx.bad();
          if (c.mark >= 8) ctx.sfx.clap(4);
        }
        if (crossed(pt, dt, A_ROBE1)) { s.wearing = true; ctx.sfx.step(); }
        if (s.dive === DIVES - 1) { if (pt >= 2.5) { s.phase = "end"; s.pt = 0; ctx.sfx.cheer(clamp(s.total / 45, 0.3, 1.2)); } }
        else if (pt >= A_NEXT) { s.dive++; s.phase = "walk"; s.pt = 0; s.wearing = false; s.floatX = null; }
      } else {
        s.endT = pt;
        if (pt >= 1.7) s.done = true;
      }
    }
  }

  /* ---- drawing ---- */
  const surf = (x, t) => 0.045 * Math.sin(x * 1.15 - t * 0.9) + 0.025 * Math.sin(x * 2.3 + t * 0.6 + 1.3);

  function drawBack(g, s, pal, V) {
    const wl = V.Y(0), hz = wl - 60;
    const lark = PALS[12] || pal;
    const farWater = shade(pal.a, 0.3), shore = mix(shade(pal.a, 0.5), "#a9c29a", 0.35);
    hollowBack(g, { pal, sun: 1, far: mix(lark.a, "#8fae6a", 0.35), farDots: lark.bL || PAPER, near: farWater, near2: shore, horizon: hz, seed: 6 });
    // Lark overhead, upside down: the running track and the bandstand
    g.save();
    g.beginPath(); g.ellipse(470, 48, 150, 17, 0, 0, TAU); g.lineWidth = 3; g.strokeStyle = alpha(PAPER, 0.55); g.stroke();
    g.beginPath(); g.ellipse(470, 48, 128, 10, 0, 0, TAU); g.lineWidth = 2; g.strokeStyle = alpha(PAPER, 0.35); g.stroke();
    const bx = 712, by = 26;
    fillRR(g, bx - 26, by - 4, 52, 6, 2, lark.b || INK);
    for (let i = 0; i < 4; i++) seg(g, bx - 20 + i * 13.3, by, bx - 20 + i * 13.3, by + 15, 2.5, lark.b || INK);
    g.beginPath(); g.moveTo(bx - 30, by + 15); g.quadraticCurveTo(bx, by + 40, bx + 30, by + 15); g.closePath(); g.fillStyle = lark.b || INK; g.fill();
    g.restore();
    // light on the far water as it curls up at both sides
    for (let i = 0; i < 4; i++) {
      const o = 14 + i * 22;
      g.beginPath(); g.moveTo(-20, hz - 100 + o * 1.6); g.quadraticCurveTo(200, hz + 40 + o * 0.6, 500, hz + 60 + o * 0.4);
      g.quadraticCurveTo(800, hz + 40 + o * 0.6, SW + 20, hz - 100 + o * 1.6);
      g.lineWidth = 3 - i * 0.5; g.strokeStyle = alpha(PAPER, 0.32 - i * 0.06); g.stroke();
    }
    // a row of small trees on the far shore where it stands up
    // (along the top of the shore band, standing out from it, so they lean in as the land climbs)
    const r = makeRng(606), tree = shade(shore, -0.3);
    for (let i = 0; i < 44; i++) {
      const side = i % 2 ? 1 : -1, t = 0.04 + (i >> 1) / 22 * 0.62 + r() * 0.02;
      const p0 = [-20, hz - 220], p1 = [170, hz - 40], p2 = [500, hz];
      const bx = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0];
      const by = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1];
      const tx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]), ty = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
      const L = Math.hypot(tx, ty), nx = ty / L, ny = -tx / L, rr = 3.5 + r() * 3.5;
      const x = side < 0 ? bx : SW - bx;
      disc(g, x + nx * side * rr * 0.8, by + ny * rr * 0.8, rr, tree);
    }
  }

  function drawWater(g, s, pal, V) {
    const t = s.t, S = V.S;
    const water = mix(pal.a, "#1d5d80", 0.38);
    const xs = [];
    for (let i = 0; i <= 50; i++) { const sx = -10 + i * (SW + 20) / 50; xs.push([sx, V.Y(surf(s.cam.x + (sx - 500) / S, t))]); }
    g.beginPath(); g.moveTo(-10, SH + 10); for (const p of xs) g.lineTo(p[0], p[1]); g.lineTo(SW + 10, SH + 10); g.closePath();
    g.fillStyle = water; g.fill();
    g.fillStyle = alpha(INK, 0.1); g.fillRect(0, V.Y(-0.9), SW, SH);
    g.fillStyle = alpha(INK, 0.1); g.fillRect(0, V.Y(-2.1), SW, SH);
    g.beginPath(); for (let i = 0; i < xs.length; i++) { if (i) g.lineTo(xs[i][0], xs[i][1]); else g.moveTo(xs[i][0], xs[i][1]); }
    g.lineWidth = 3; g.strokeStyle = alpha(PAPER, 0.55); g.stroke();
    // slow, tall ripples: light lying on the water
    const r = makeRng(61);
    for (let i = 0; i < 40; i++) {
      const wx = -14 + r() * 22, wy = -0.12 - r() * r() * 3, L = 0.3 + r() * 0.8, ph = r() * TAU;
      const x = wx + 0.25 * Math.sin(t * 0.45 + ph), sy = V.Y(wy) + 3 * Math.sin(t * 0.9 + ph);
      seg(g, V.X(x), sy, V.X(x + L), sy, 3, alpha(PAPER, 0.16 + 0.1 * Math.sin(t * 0.7 + ph)));
    }
  }

  function drawIsland(g, s, pal, V) {
    const S = V.S;
    const lawn = mix(pal.a, "#6c9a4a", 0.55);
    g.fillStyle = alpha(INK, 0.18); g.fillRect(V.X(-40), V.Y(0.02), V.X(-6.35) - V.X(-40), 0.32 * S);   // its reflection
    g.beginPath(); g.moveTo(V.X(-40), V.Y(-0.25)); g.lineTo(V.X(-40), V.Y(LAWN_Y)); g.lineTo(V.X(-7.4), V.Y(LAWN_Y));
    g.quadraticCurveTo(V.X(-6.7), V.Y(LAWN_Y), V.X(-6.35), V.Y(-0.05)); g.lineTo(V.X(-6.35), V.Y(-0.25)); g.closePath();
    g.fillStyle = lawn; g.fill();
    g.fillStyle = shade(lawn, 0.25); g.fillRect(V.X(-40), V.Y(LAWN_Y), V.X(-7.45) - V.X(-40), 0.06 * S);
    g.fillStyle = shade(PAPER, -0.25); g.fillRect(V.X(-40), V.Y(0.08), V.X(-6.5) - V.X(-40), 0.1 * S);     // stone edge
    // the bench, painted white, older than anyone on it
    const bc = pal.b, bd = shade(pal.b, -0.3);
    for (const x of [-10.3, -8.75, -7.2]) seg(g, V.X(x), V.Y(LAWN_Y), V.X(x), V.Y(SEAT_Y), 0.07 * S, bd);
    for (const x of [-10.25, -7.25]) seg(g, V.X(x), V.Y(SEAT_Y), V.X(x - 0.06), V.Y(SEAT_Y + 0.62), 0.06 * S, bd);
    fillRR(g, V.X(-10.45), V.Y(SEAT_Y + 0.62), V.X(-7.05) - V.X(-10.45), 0.1 * S, 3, bd);
    fillRR(g, V.X(-10.45), V.Y(SEAT_Y + 0.38), V.X(-7.05) - V.X(-10.45), 0.09 * S, 3, bd);
  }

  function drawElders(g, s, pal, V) {
    const S = V.S, h = 1.6 * S, c = s.cur;
    const shirts = [pal.b, pal.aLL, "#d9d2c4"];
    const showCards = c && c.cards && ((s.phase === "after" && s.pt >= C_UP) || (s.phase === "end" && s.pt < 0.5));
    const cheer = s.phase === "end" && s.pt > 0.4 && s.total >= 30;
    for (let i = 0; i < 3; i++) {
      const p = someone(660 + i * 3, shirts), x = V.X(ELDERS[i]), y = V.Y(LAWN_Y);
      let up = 0;
      if (showCards) up = s.phase === "end" ? 1 - smooth(0, 0.5, s.pt) : easeBack(clamp((s.pt - C_UP - 0.15 * i) / 0.28, 0, 1));
      const headY = y - (cheer ? 0.77 : 0.63) * h;
      const cw = 82, ch = 64, cx = x + (i - 1) * 6, cy = lerp(y - 0.35 * h, headY - 0.1 * h - ch / 2 - 30 - (i === 1 ? 14 : 0), up);
      const o = { pose: cheer ? "cheer" : "sit", old: true, shirt: p.shirt, skin: p.skin, legs: shade(pal.a, -0.45), t: s.t + i * 0.3 };
      if (up > 0.02) { o.handTo = [cx - cw * 0.32, cy + ch * 0.45]; o.handTo2 = [cx + cw * 0.32, cy + ch * 0.45]; }
      // seen from the front, a sitter's thighs come at you: show only the shins, from the seat to the lawn
      g.save(); g.beginPath(); g.rect(x - h, -10, 2 * h, y + 10); g.clip();
      person(g, x, y, h, o);
      g.restore();
      if (up > 0.02) {
        g.save(); g.globalAlpha = clamp(up * 3, 0, 1);
        fillRR(g, cx - cw / 2, cy - ch / 2, cw, ch, 7, PAPER);
        fillRR(g, cx - cw / 2, cy - ch / 2, cw, 9, 4, pal.a);
        const v = c.cards[i];
        sign(g, v % 1 ? v.toFixed(1) : String(v), cx, cy + 22, 46, INK, "center", 800);
        g.restore();
      }
    }
  }

  function drawJetty(g, s, pal, V) {
    const S = V.S, plank = shade(PAPER, -0.2), dark = pal.aDD, steel = pal.aD;
    // posts into the lake
    for (let x = JETTY0 + 0.4; x <= JETTY1; x += 1.45) seg(g, V.X(x), V.Y(DECK), V.X(x), V.Y(-0.5), 0.12 * S, shade(plank, -0.45));
    fillRR(g, V.X(JETTY0), V.Y(DECK), V.X(JETTY1) - V.X(JETTY0), 0.14 * S, 2, plank);
    seg(g, V.X(JETTY0), V.Y(DECK) + 0.14 * S, V.X(JETTY1), V.Y(DECK) + 0.14 * S, 0.04 * S, shade(plank, -0.4));
    // the swimmers' ladder at the end
    for (const dx of [-0.12, 0.12]) seg(g, V.X(LADDER + dx), V.Y(DECK + 0.55), V.X(LADDER + dx), V.Y(-0.6), 0.04 * S, steel);
    for (let y = -0.4; y < DECK; y += 0.28) seg(g, V.X(LADDER - 0.12), V.Y(y), V.X(LADDER + 0.12), V.Y(y), 0.035 * S, steel);
    // the robe rail
    for (const x of [RAIL0, RAIL1]) seg(g, V.X(x), V.Y(DECK), V.X(x), V.Y(DECK + 1.05), 0.05 * S, steel);
    seg(g, V.X(RAIL0), V.Y(DECK + 1.0), V.X(RAIL1), V.Y(DECK + 1.0), 0.05 * S, steel);
    for (let i = 0; i < ROBES.length; i++) {
      if (i === 2 && s.wearing) continue;
      const x = V.X(ROBES[i]), y = V.Y(DECK + 1.0) + 0.03 * S, k = S;
      poly(g, [x - 0.04 * k, y, x + 0.04 * k, y, x + 0.15 * k, y + 0.07 * k, x + 0.19 * k, y + 0.66 * k, x - 0.19 * k, y + 0.66 * k, x - 0.15 * k, y + 0.07 * k], pal.b);
      seg(g, x - 0.17 * k, y + 0.3 * k, x + 0.17 * k, y + 0.3 * k, 0.04 * k, pal.a);
      seg(g, x - 0.18 * k, y + 0.6 * k, x + 0.18 * k, y + 0.6 * k, 0.045 * k, pal.a);
    }
    // the one-metre board, further off
    const one = shade(PAPER, -0.12);
    poly(g, [V.X(-3.75), V.Y(DECK), V.X(-3.2), V.Y(DECK), V.X(-3.35), V.Y(0.98), V.X(-3.6), V.Y(0.98)], shade(steel, 0.2));
    fillRR(g, V.X(-4.6), V.Y(1.06), V.X(-1.25) - V.X(-4.6), 0.08 * S, 3, one);
    // the tower and its ladder
    for (const x of [TOWER - 0.35, TOWER + 0.35]) seg(g, V.X(x), V.Y(DECK), V.X(x), V.Y(BOARD_Y), 0.09 * S, dark);
    for (let y = DECK + 0.3; y < BOARD_Y - 0.1; y += 0.3) seg(g, V.X(TOWER - 0.62), V.Y(y), V.X(TOWER - 0.35), V.Y(y), 0.04 * S, steel);
    seg(g, V.X(TOWER - 0.62), V.Y(DECK), V.X(TOWER - 0.62), V.Y(BOARD_Y + 0.9), 0.045 * S, steel);
    seg(g, V.X(TOWER - 0.35), V.Y(DECK + 0.6), V.X(TOWER + 0.35), V.Y(BOARD_Y - 0.6), 0.045 * S, dark);
    seg(g, V.X(TOWER + 0.35), V.Y(DECK + 0.6), V.X(TOWER - 0.35), V.Y(BOARD_Y - 0.6), 0.045 * S, dark);
    fillRR(g, V.X(TOWER - 0.5), V.Y(BOARD_Y), V.X(BACK + 0.3) - V.X(TOWER - 0.5), 0.12 * S, 2, dark);
    seg(g, V.X(TOWER - 0.4), V.Y(BOARD_Y), V.X(TOWER - 0.4), V.Y(BOARD_Y + 0.95), 0.045 * S, steel);
    seg(g, V.X(TOWER - 0.4), V.Y(BOARD_Y + 0.95), V.X(TOWER + 0.45), V.Y(BOARD_Y + 0.95), 0.045 * S, steel);
    seg(g, V.X(TOWER + 0.45), V.Y(BOARD_Y + 0.95), V.X(TOWER + 0.6), V.Y(BOARD_Y + 0.15), 0.045 * S, steel);
    pennant(g, V.X(TOWER - 0.4) + 0.32 * S * 0.5, V.Y(BOARD_Y + 0.95), 0.32 * S, 0.5 * S, pal.a, pal.b, 0.06 * S * Math.sin(s.t * 1.3));
    fillRR(g, V.X(TOWER - 0.32), V.Y(2.05), 0.64 * S, 0.42 * S, 0.06 * S, pal.b);
    sign(g, "3 M", V.X(TOWER), V.Y(1.72), Math.max(22, 0.3 * S), pal.aDD, "center", 800);
    // the fulcrum
    const fy = BOARD_Y - 0.2;
    seg(g, V.X(FULC - 0.4), V.Y(DECK), V.X(FULC), V.Y(fy), 0.07 * S, steel);
    seg(g, V.X(FULC + 0.4), V.Y(DECK), V.X(FULC), V.Y(fy), 0.07 * S, steel);
    seg(g, V.X(FULC - 0.22), V.Y(DECK + 1.1), V.X(FULC + 0.22), V.Y(DECK + 1.1), 0.05 * S, steel);
    disc(g, V.X(FULC), V.Y(fy), 0.09 * S, dark);
    // the three-metre board, bending
    const tip = tipDip(s);
    const boardLine = (x0, x1, dy) => { g.beginPath(); for (let i = 0; i <= 24; i++) { const x = lerp(x0, x1, i / 24); const y = BOARD_Y + dy - dipAt(x, tip); if (i) g.lineTo(V.X(x), V.Y(y)); else g.moveTo(V.X(x), V.Y(y)); } };
    boardLine(BACK, -0.06, -0.08); g.lineWidth = 0.16 * S; g.strokeStyle = pal.aD; g.lineCap = "round"; g.stroke();
    boardLine(BACK + 0.05, -0.08, -0.035); g.lineWidth = 0.06 * S; g.strokeStyle = PAPER; g.stroke();
  }

  function drawGuard(g, s, pal, V) {
    const S = V.S, y0 = surf(GUARD_X, s.t), tilt = 0.08 * Math.cos(GUARD_X * 1.15 - s.t * 0.9);
    const bx = V.X(GUARD_X), by = V.Y(y0);
    g.save(); g.translate(bx, by); g.rotate(-tilt * 0.4);
    fillRR(g, -0.95 * S, -0.06 * S, 1.9 * S, 0.12 * S, 0.06 * S, pal.b);
    fillRR(g, -0.8 * S, -0.02 * S, 1.6 * S, 0.03 * S, 0.02 * S, pal.a);
    g.restore();
    const good = s.cur && s.cur.mark >= 8 && s.phase === "after" && s.pt > C_SUM && s.pt < C_SUM + 1.1;
    const top = [V.X(GUARD_X - 0.3), V.Y(y0 + 1.75)], bot = [V.X(GUARD_X - 0.75), V.Y(y0 - 0.25)];
    if (!good) seg(g, top[0], top[1], bot[0], bot[1], 0.05 * S, shade(pal.a, -0.5));
    person(g, bx, by - 0.05 * S, 1.68 * S, {
      view: "side", face: -1, pose: good ? "wave" : "stand", t: s.t, shirt: PAPER, legs: pal.a, skin: SKINS[4], hair: HAIRS[1], lean: tilt * 0.3,
      handTo: good ? null : [lerp(top[0], bot[0], 0.18), lerp(top[1], bot[1], 0.18)], handTo2: good ? null : [lerp(top[0], bot[0], 0.42), lerp(top[1], bot[1], 0.42)],
    });
  }

  function cols(pal) {
    const skin = SKINS[2];
    return { skin, skinD: shade(skin, -0.2), suit: pal.a, suitD: pal.aD, cap: pal.b };
  }

  function drawDiver(g, s, pal, V) {
    const S = V.S, C = cols(pal), d = s.d, c = s.cur;
    if (s.phase === "walk") {
      const T = s.dive === 0 ? 1.6 : 1.1, k = clamp(s.pt / T, 0, 1);
      const x0 = s.dive === 0 ? -4.4 : -3.3, x = lerp(x0, TIP_FEET, 1 - (1 - k) * (1 - k));
      const ph = (x - x0) * 4.2;
      drawBody(g, k < 1 ? walkPose(ph) : STRAIGHT, V.X(x), V.Y(BOARD_Y - dipAt(x, tipDip(s))), S, 0, 1, C, "G");
      return;
    }
    if (s.phase === "bounce") {
      const u = (s.bt / P_B) % 1;
      drawBody(g, bouncePose(u), V.X(TIP_FEET), V.Y(feetY(s)), S, 0, 1, C, "G");
      return;
    }
    const pt = s.pt;
    const inAir = s.phase === "air" || (s.phase === "after" && pt < A_SWIM0);
    if (inAir) {
      let P = mixPose(STRAIGHT, TUCK, d.k);
      if (s.lb > 0.01 && s.P0) P = mixPose(P, s.P0, s.lb);
      const sx = V.X(d.x), sy = V.Y(d.y), rot = d.rot * TAU;
      // the turn, drawn as a trail behind the head when tucked and spinning
      if (s.phase === "air" && d.k > 0.4) {
        const a = (d.k - 0.4) * 0.8, r = 0.62 * S;
        g.beginPath(); g.arc(sx, sy, r, rot - Math.PI / 2 - 1.5, rot - Math.PI / 2 - 0.25); g.lineWidth = 0.07 * S; g.strokeStyle = alpha(pal.a, a); g.stroke();
        g.beginPath(); g.arc(sx, sy, r * 0.82, rot + Math.PI / 2 - 1.2, rot + Math.PI / 2 - 0.3); g.lineWidth = 0.05 * S; g.strokeStyle = alpha(pal.a, a * 0.7); g.stroke();
      }
      const wl = V.Y(0);
      g.save(); g.beginPath(); g.rect(-10, -10, SW + 20, wl + 10); g.clip();
      drawBody(g, P, sx, sy, S, rot, 1, C, "C");
      g.restore();
      if (sy + 1.2 * S > wl) {
        g.save(); g.beginPath(); g.rect(-10, wl, SW + 20, SH); g.clip(); g.globalAlpha = 0.35 * (1 - smooth(0.2, A_SWIM0, s.phase === "after" ? pt : 0));
        drawBody(g, P, sx, sy, S, rot, 1, C, "C");
        g.restore();
      }
      return;
    }
    if (pt < A_SWIM1 && s.phase === "after") {             // swimming for the ladder
      const k = smooth(A_SWIM0, A_SWIM1, pt), x = lerp(c.x, LADDER + 0.3, k), y = surf(x, s.t);
      const hx = V.X(x), hy = V.Y(y) - 0.08 * S;
      const a = pt * 9;
      seg(g, hx - 0.1 * S, hy + 0.08 * S, hx - 0.1 * S - Math.cos(a) * 0.45 * S, hy + 0.08 * S - Math.max(0, Math.sin(a)) * 0.35 * S, B.aw * S, C.skin);
      disc(g, hx, hy, B.hr * S, C.skin);
      g.beginPath(); g.arc(hx, hy, B.hr * 1.05 * S, Math.PI * 0.95, Math.PI * 2.05); g.closePath(); g.fillStyle = C.cap; g.fill();
      ring(g, hx, V.Y(y), 0.3 * S, 2, alpha(PAPER, 0.5));
      return;
    }
    if (pt < A_CLIMB1 && s.phase === "after") {
      const k = smooth(A_SWIM1, A_CLIMB1, pt);
      drawBody(g, climbPose(pt * 14), V.X(LADDER + 0.18), V.Y(lerp(-0.9, DECK, k)), S, 0, -1, C, "G");
      return;
    }
    if (pt < A_WALK1 && s.phase === "after") {
      const k = smooth(A_CLIMB1, A_WALK1, pt), x = lerp(LADDER, ROBES[2] + 0.35, k);
      drawBody(g, walkPose((x - LADDER) * 4.2), V.X(x), V.Y(DECK), S, 0, -1, C, "G");
      return;
    }
    if (!s.wearing) { drawBody(g, REACH, V.X(ROBES[2] + 0.35), V.Y(DECK), S, 0, -1, C, "G"); return; }
    // in a robe, back along the jetty to the tower
    const T1 = s.phase === "end" ? A_ROBE1 + 1.1 : A_NEXT - 0.15;
    const tt = s.phase === "end" ? 2.5 + pt : pt;
    const k = clamp((tt - A_ROBE1) / (T1 - A_ROBE1), 0, 1), x = lerp(ROBES[2] + 0.35, TOWER + 0.6, k);
    person(g, V.X(x), V.Y(DECK), 1.75 * S, { view: "side", face: -1, pose: k < 1 ? "walk" : "stand", t: (x - ROBES[2]) * 0.7, shirt: pal.b, legs: shade(pal.b, -0.08), sash: pal.a, skin: C.skin, hair: C.cap });
  }

  function drawGhost(g, s, pal, V) {
    const gh = s.ghost; if (!gh || s.phase !== "air") return;
    const off = gh.rot - (Math.floor(gh.rot) + 0.5), good = Math.abs(off) * 360 < 10;
    const col = good ? pal.a : pal.aD;
    const C = { skin: col, skinD: col, suit: col, suitD: col, cap: col };
    const near = smooth(1.0, 2.2, s.d.y - gh.y);                // gone once the diver is nearly there
    if (near <= 0) return;
    g.save(); g.globalAlpha = (good ? 0.55 : 0.28) * near;
    drawBody(g, STRAIGHT, V.X(gh.x), V.Y(gh.y), V.S, gh.rot * TAU, 1, C, "C");
    g.restore();
  }

  function drawSplash(g, s, V) {
    const S = V.S;
    for (const r of s.rings) {
      const k = r.t / 2.6, rx = (0.2 + r.t * 1.0) * S * (0.6 + 0.5 * r.k);
      g.beginPath(); g.ellipse(V.X(r.x), V.Y(0), rx, rx * 0.15, 0, 0, TAU); g.lineWidth = 3; g.strokeStyle = alpha(PAPER, 0.55 * (1 - k)); g.stroke();
    }
    for (const p of s.drops) {
      const k = p.age / p.life;
      if (p.kind === "foam") { g.beginPath(); g.ellipse(V.X(p.x), V.Y(0), p.r * S * (1 + k), p.r * S * 0.22 * (1 + k), 0, 0, TAU); g.fillStyle = alpha(PAPER, 0.75 * (1 - k)); g.fill(); }
      else if (p.kind === "bub") ring(g, V.X(p.x), V.Y(p.y), p.r * S, 2, alpha(PAPER, 0.5 * (1 - k)));
      else disc(g, V.X(p.x), V.Y(p.y), p.r * S, alpha(PAPER, 0.92));
    }
  }

  function draw(s, g, ctx) {
    const pal = ctx.pal, cam = s.cam;
    const V = { X: (x) => 500 + (x - cam.x) * cam.s, Y: (y) => 500 - (y - cam.y) * cam.s, S: cam.s };
    drawBack(g, s, pal, V);
    drawWater(g, s, pal, V);
    drawIsland(g, s, pal, V);
    drawJetty(g, s, pal, V);
    drawElders(g, s, pal, V);
    drawGuard(g, s, pal, V);
    // the plumb line from the tip, and the float where a dive with no spin under it would go in
    const showMarks = s.phase === "bounce" || s.phase === "air" || (s.phase === "after" && s.pt < 1.2) || s.phase === "walk";
    if (showMarks) {
      g.save(); g.setLineDash([0.08 * V.S, 0.1 * V.S]);
      seg(g, V.X(0), V.Y(BOARD_Y - 0.15 - dipAt(0, tipDip(s))), V.X(0), V.Y(0), 2.5, alpha(INK, 0.3));
      g.restore();
    }
    if (s.floatX !== null) {
      const fx = V.X(s.floatX), fy = V.Y(surf(s.floatX, s.t));
      seg(g, fx, fy, fx, fy - 0.3 * V.S, 2.5, alpha(INK, 0.6));
      poly(g, [fx, fy - 0.3 * V.S, fx + 0.14 * V.S, fy - 0.25 * V.S, fx, fy - 0.2 * V.S], pal.b);
      g.beginPath(); g.ellipse(fx, fy, 0.11 * V.S, 0.07 * V.S, 0, 0, TAU); g.fillStyle = PAPER; g.fill();
      g.beginPath(); g.ellipse(fx, fy + 0.01 * V.S, 0.11 * V.S, 0.035 * V.S, 0, 0, Math.PI); g.fillStyle = pal.a; g.fill();
    }
    drawGhost(g, s, pal, V);
    drawDiver(g, s, pal, V);
    drawSplash(g, s, V);
    s.notes.draw(g);
    spinMark(g, 800, 905, alpha(PAPER, 0.7));

    // the bench's verdict, building
    const c = s.cur;
    if (s.phase === "after" && s.pt >= C_LINE && c) {
      const a = smooth(C_LINE, C_LINE + 0.2, s.pt) * (1 - smooth(A_NEXT - 0.35, A_NEXT - 0.05, s.pt));
      g.save(); g.globalAlpha = a;
      const what = c.soms === 0 ? "A PLAIN DIVE" : c.soms === 1 ? "1 SOMERSAULT" : c.soms + " SOMERSAULTS";
      sign(g, what, 500, 200, 46, INK, "center", 800);
      sign(g, c.D.toFixed(2) + "  ×  " + (c.mark % 1 ? c.mark.toFixed(1) : String(c.mark)), 500, 262, 54, alpha(INK, 0.8), "center", 700);
      if (s.pt >= C_SUM) {
        const k = easeBack(clamp((s.pt - C_SUM) / 0.3, 0, 1));
        sign(g, fmt1(c.score), 500, 365, 96 * (0.6 + 0.4 * k), pal.aDD, "center", 800);
      }
      g.restore();
    }
    if (s.phase === "end") {
      const a = smooth(0, 0.4, s.pt);
      g.save(); g.globalAlpha = a;
      sign(g, fmt1(s.total), 500, 330, 170, pal.aDD, "center", 800);
      sign(g, "FROM THREE DIVES", 500, 390, 42, INK, "center", 700);
      g.restore();
    }
  }

  // The house dives: spring at the bottom, ride the tuck, open when a look ahead says it will go in straight.
  function bot(s, b, ctx) {
    const sk = clamp(ctx.skill, 0, 1);
    b.x = 500; b.y = 500;
    if (s.phase === "bounce") {
      if (s.botDive !== s.dive) { s.botDive = s.dive; s.botAt = 2 * P_B + (1 - sk) * 0.2 * ctx.rng.range(-1, 1); s.botPlan = null; }
      b.down = s.bt >= s.botAt;
    } else if (s.phase === "air") {
      const d = s.d;
      if (!s.botPlan) {
        const full = predict(d, true).rot;
        let target = Math.floor(full - 0.5 - 0.3) + 0.5;
        if (ctx.rng.chance((1 - sk) * 0.5)) target -= 1;            // a newcomer plays it safe
        s.botPlan = { target: Math.max(0.5, target), err: (1 - sk) * ctx.rng.range(-0.3, 0.3), open: false };
      }
      const pl = s.botPlan;
      if (!pl.open && predict(d, false).rot >= pl.target + pl.err - 0.006) pl.open = true;
      b.down = !pl.open;
    } else b.down = false;
  }

  registerEvent({
    id: "otter", hour: 6, name: "The Jetty",
    place: "Bench Island, in Otter's lake on the Hollow floor · deck 376 · 0.50 g",
    intro: "In the middle of Otter's lake the elders sit on their bench in order of age and judge the three-metre board. At half a g a dive takes half again as long to fall, so there is time for somersaults nobody could turn at the rim, and time to get the entry right. The spin under the lake bends the fall too, by about a hand's width.",
    how: "Tap as the board bottoms out. Hold to tuck and turn, let go to open out, and go in head first and straight.",
    keys: "Space: tap to spring, hold to tuck",
    marks: [16, 30, 42], unit: "points", fmt: (v) => (Number.isInteger(v) ? String(v) : fmt1(v)),
    result: (s) => fmt1(s.total) + " from three dives, best " + fmt1(s.best),
    create, update, draw, bot,
  });
})();
