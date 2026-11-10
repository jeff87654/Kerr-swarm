/* ---------- Swift: The Lean ----------
   Swift's test for anyone who thinks cabs are simple: ride from the Keel to the High decks and back
   with the gimbal switched to hand and a full cup of tea with its lid off. You are the gimbal.
   A cab climbing a lift core is pushed spinward by Coriolis (2 W v), and the cabin must hang square
   to the pull it feels:
       tan(lean) = 2 W v / (g + a)      v radial speed (up +), g = gAt(r), a the cab's upward acceleration
   so braking on the way up (a < 0) takes weight off but not the push, and the lean is steepest there.
   At 20 m/s: 13 degrees at the Keel, 17 at mid-drum, 25 at the Hollow floor (docs/drum-transport.md).
   The ride runs faster than real time: the cruise most of all, the speeding up and braking least. */
"use strict";
(function () {
  const DEG = Math.PI / 180;
  const ACC = 1.5, VMAX = 20, TJ = 1.0;          // m/s2, m/s, seconds (real) to ease into and out of each push
  const D_START = 4, D_TOP = 363, D_END = 77;    // deck 363 is the High line deck
  const LEAN_MAX = 36 * DEG;                     // the gimbal's stops
  const CURVE_A = 0.85;                          // m/s2 sideways at a junction (8 m/s round a 75 m curve)
  const CX = 500, CY = 548;                      // the gimbal's pivot on the stage
  const HW = 235, HH = 180;                      // half the cabin, stage units
  const FLOOR = 150, BOBX = 92, BOB_TOP = -166, BOB_LEN = 228;
  const CUP_AT = [-58, 26];                      // where the rider holds the cup, in the cabin
  const LX = 500, LY = 130, LR = 92;             // the close-up of the tea
  const KS = 10, MS = 0.12;                       // how fast tea goes over the rim (per radian over, per second); how the rim widens as the cup empties
  const TEA = "#b06a26", TEA_L = "#e0a45c", BUN = "#c98d4a";

  function makeRun(d0, d1, gA, gC, gB) {
    const r0 = deckR(d0), r1 = deckR(d1), dir = r1 < r0 ? 1 : -1;     // up, toward the axis, is r falling
    const TA = VMAX / ACC + TJ, dA = VMAX * TA / 2;
    const TC = (Math.abs(r1 - r0) - 2 * dA) / VMAX;
    return { k: "run", d0, d1, r0, r1, dir, TA, TC, gA, gC, gB, g: gA + gC + gB };
  }
  const SEGS = [
    { k: "wait", g: 2.4, deck: D_START },
    makeRun(D_START, D_TOP, 5.0, 6.5, 5.5),
    { k: "wait", g: 1.5, deck: D_TOP },
    { k: "line", g: 8.6, deck: D_TOP },
    { k: "wait", g: 1.1, deck: D_TOP },
    makeRun(D_TOP, D_END, 5.0, 4.5, 5.0),
    { k: "settle", g: 1.2, deck: D_END },
    { k: "end", g: 1.5, deck: D_END },
  ];
  const CURVES = [{ t0: 2.0, sign: 1 }, { t0: 5.3, sign: -1 }];   // seconds into the line run; each lasts 2 s
  const CURVE_TH = Math.atan(CURVE_A / gDeck(D_TOP));

  // speed after tau seconds of a push lasting T: eased in and out over TJ
  function vPush(tau, T) {
    tau = clamp(tau, 0, T);
    if (tau < TJ) return ACC * tau * tau / (2 * TJ);
    if (tau > T - TJ) { const u = T - tau; return VMAX - ACC * u * u / (2 * TJ); }
    return ACC * TJ / 2 + ACC * (tau - TJ);
  }
  function aPush(tau, T) { return tau < TJ ? ACC * tau / TJ : tau > T - TJ ? ACC * (T - tau) / TJ : ACC; }

  // the state of the cab in a run, u seconds of game time in: {tr real seconds, spd, acc (along the run), ph}
  function runAt(seg, u) {
    if (u < seg.gA) { const tr = u * seg.TA / seg.gA; return { tr, spd: vPush(tr, seg.TA), acc: aPush(tr, seg.TA), ph: "go", warp: seg.TA / seg.gA }; }
    if (u < seg.gA + seg.gC) { const tr = seg.TA + (u - seg.gA) * seg.TC / seg.gC; return { tr, spd: VMAX, acc: 0, ph: "cruise", warp: seg.TC / seg.gC }; }
    const tb = clamp((u - seg.gA - seg.gC) * seg.TA / seg.gB, 0, seg.TA);
    return { tr: seg.TA + seg.TC + tb, spd: vPush(seg.TA - tb, seg.TA), acc: -aPush(seg.TA - tb, seg.TA), ph: "brake", warp: seg.TA / seg.gB };
  }

  function teaMargin(f) { return Math.atan(0.105 + (1 - f) * MS); }   // the rim, as the cup empties: 6 degrees when full

  function create(ctx) {
    const s = {
      t: 0, seg: 0, segT: 0, score: 100, done: false,
      r: deckR(D_START), vUp: 0, aUp: 0, lat: 0, warp: 1, need: 0, felt: 1, spdAlong: 0,
      aim: 0, phi: 0, phiV: 0, kb: false,
      bob: 0, bobV: 0, psi: 0, psiV: 0, tea: 1, spillL: 0, spillR: 0, spillCool: 0, spillNote: 0, drop: 0,
      trueT: 0, nextTrue: 2.5, streak: 0, glowT: 0, maxLean: 0, maxNeed: 0,
      runTr: 0, runDist: 0, runSpd: 0, runPh: "", flash: 0,
      said: {}, scroll: 0, tube: 0, endT: 0, maxPhi: 0,
      parts: new Parts(260), lensParts: new Parts(120), notes: new Notes(),
      hist: new Array(128).fill(0), n: 0, bn: { v: 0, to: 0, t: 0 },
    };
    return s;
  }

  function sayOnce(s, ctx, key, text, secs) { if (!s.said[key]) { s.said[key] = true; ctx.say(text, secs); } }

  // where the cab is and what the floor should do, from the timeline
  function ride(s, ctx) {
    const seg = SEGS[s.seg], u = s.segT;
    s.lat = 0; s.aUp = 0; s.vUp = 0; s.warp = 1; s.spdAlong = 0; s.runPh = "";
    if (seg.k === "run") {
      const st = runAt(seg, u);
      // distance along the run: integrate the speed we have (smooth, so the trapezoid rule is plenty)
      const dtr = st.tr - (s.runTr || 0);
      if (dtr > 0) s.runDist = (s.runDist || 0) + 0.5 * (s.runSpd + st.spd) * dtr;
      s.runTr = st.tr; s.runSpd = st.spd;
      s.r = seg.r0 - seg.dir * s.runDist;
      s.vUp = seg.dir * st.spd; s.aUp = seg.dir * st.acc; s.warp = st.warp; s.runPh = st.ph;
    } else {
      s.r = deckR(seg.deck);
      if (seg.k === "line") {
        for (const c of CURVES) {
          const k = (u - c.t0) / 2;
          if (k > 0 && k < 1) s.lat = c.sign * CURVE_A * Math.pow(Math.sin(Math.PI * k), 2);
        }
        let slow = 0;
        for (const c of CURVES) slow = Math.max(slow, smooth(c.t0 - 1, c.t0, u) * (1 - smooth(c.t0 + 2, c.t0 + 3, u)));
        s.spdAlong = lerp(30, 8, slow) * smooth(0, 1, u) * (1 - smooth(seg.g - 1, seg.g, u));
      }
    }
    const g = gAt(s.r);
    const side = 2 * DRUM.W * s.vUp + s.lat;          // m/s2 spinward
    s.need = Math.atan2(side, g + s.aUp);
    s.felt = Math.hypot(side, g + s.aUp) / DRUM.G0;
  }

  function nextSeg(s, ctx) {
    s.seg++; s.segT = 0; s.runTr = 0; s.runDist = 0; s.runSpd = 0;
    const seg = SEGS[s.seg];
    if (!seg) return;
    if (seg.k === "run") {
      ctx.sfx.clack(); ctx.sfx.whoosh(1.6);
      if (seg.dir < 0) ctx.say("Down again: it pushes the other way.", 3.2);
    } else if (seg.k === "wait" && s.seg === 2) {
      ctx.sfx.bell(5); s.flash = 1;
    } else if (seg.k === "line") {
      ctx.sfx.whoosh(1.2);
    } else if (seg.k === "settle") {
      ctx.sfx.bell(7); s.flash = 1;
    } else if (seg.k === "end") {
      ctx.sfx.pour();
    }
  }

  function update(s, dt, inp, ctx) {
    s.t += dt; s.segT += dt;
    s.parts.update(dt); s.lensParts.update(dt); s.notes.update(dt);
    s.glowT = Math.max(0, s.glowT - dt); s.flash = Math.max(0, (s.flash || 0) - dt * 0.8);
    if (s.segT >= SEGS[s.seg].g) nextSeg(s, ctx);
    if (s.seg >= SEGS.length) { s.done = true; return; }
    const seg = SEGS[s.seg];
    ride(s, ctx);
    s.hist[s.n % 128] = s.need; s.n++;
    const ended = seg.k === "settle" || seg.k === "end";

    // captions
    if (s.t > 0.3) sayOnce(s, ctx, "start", "Keep the bob over the mark.", 3.4);
    if (seg.k === "run" && seg.dir > 0 && s.segT > seg.gA + seg.gC - 0.9) {
      if (!s.said.brake) { ctx.sfx.tone({ f: 880, dur: 0.18, vol: 0.08, type: "triangle" }); ctx.sfx.tone({ f: 660, dur: 0.3, vol: 0.08, type: "triangle", at: 0.16 }); }
      sayOnce(s, ctx, "brake", "Braking. This is the steep one.", 3.2);
    }

    // --- you are the gimbal ---
    if (!ended) {
      if (inp.ax !== 0) { s.kb = true; s.aim = clamp(s.aim + inp.ax * 45 * DEG * dt, -LEAN_MAX, LEAN_MAX); }
      else if (inp.moved || inp.ptrDown) { s.kb = false; s.aim = clamp((inp.x - 500) / 430, -1, 1) * LEAN_MAX; }
    } else s.aim = approach(s.aim, 0, dt * 30 * DEG);
    const ws = TAU * 1.7;                               // the servo: quick, but a room has mass
    s.phiV += (ws * ws * (s.aim - s.phi) - 2 * 0.85 * ws * s.phiV) * dt;
    s.phi += s.phiV * dt;

    // the plumb bob hangs along the pull, and swings a little when the pull changes
    const wb = TAU * 1.3;
    s.bobV += (wb * wb * (s.need - s.bob) - 2 * 0.32 * wb * s.bobV) * dt;
    s.bob += s.bobV * dt;

    // the tea: its surface wants to lie square to the pull; it sloshes at about 1.2 Hz
    const e = s.need - s.phi, wt = TAU * 1.2;
    s.psiV += (wt * wt * (e - s.psi) - 2 * 0.07 * wt * s.psiV) * dt;
    s.psi += s.psiV * dt;
    const m = teaMargin(s.tea), over = Math.abs(s.psi) - m;
    s.slop = approach(s.slop || 0, over > 0 && !ended ? Math.sign(s.psi) * Math.min(1, 0.4 + over * 12) : 0, dt * 6);
    if (over > 0 && !ended && s.tea > 0) {
      const side = Math.sign(s.psi);
      const loss = Math.min(s.tea, KS * over * dt);
      s.tea -= loss;
      if (side > 0) s.spillR += loss; else s.spillL += loss;
      if (s.psiV * side > 0) s.psiV *= Math.exp(-7 * dt);   // what goes over the rim takes the slop with it
      s.drop += loss;
      while (s.drop > 0.0012) { s.drop -= 0.0012; addDrops(s, ctx, side); }
      if (s.spillCool <= 0) { ctx.sfx.splash(0.3 + Math.min(0.5, over * 8)); s.spillCool = 0.45; }
      if (s.spillNote <= 0) { s.notes.add("spilt", LX + side * 150, LY + 40, { good: false, size: 36 }); s.spillNote = 1.6; }
    }
    s.spillCool -= dt; s.spillNote -= dt;
    s.score = Math.max(0, s.tea * 100);

    // holding true: a soft rising chime
    const moving = seg.k === "run" || seg.k === "line";
    const off = Math.abs(s.bob - s.phi);
    if (moving && off < 2.5 * DEG && Math.abs(e) < 3 * DEG) {
      s.trueT += dt;
      if (s.trueT >= s.nextTrue) {
        s.nextTrue += 2.5; ctx.sfx.chime(s.streak); s.streak = Math.min(s.streak + 1, 10); s.glowT = 0.7;
        const p = bobTip(s); s.notes.add("true", p[0] + 70, p[1] - 30, { good: true, size: 34 });
      }
    } else if (off > 4 * DEG || Math.abs(e) > 5 * DEG) { s.trueT = 0; s.nextTrue = 2.5; s.streak = 0; }

    if (moving && Math.abs(e) < 6 * DEG) s.maxLean = Math.max(s.maxLean, Math.abs(s.phi));
    s.maxNeed = Math.max(s.maxNeed, Math.abs(s.need));
    if (moving) s.maxPhi = Math.max(s.maxPhi || 0, Math.abs(s.phi));

    // the shaft going by
    s.scroll += s.vUp * 22 * dt;
    s.tube += s.spdAlong * dt;
    const dk = clamp(deckAtR(s.r), 1, 376);

    if (seg.k === "end") { s.endT += dt; }

    // the readouts
    let left;
    if (seg.k === "run") left = "deck " + dk + "  " + (s.vUp > 0 ? "up " : "down ") + Math.abs(s.vUp).toFixed(0) + " m/s";
    else if (seg.k === "line") left = "line deck " + D_TOP + "  " + (Math.abs(s.lat) > 0.05 ? "curve " : "") + s.spdAlong.toFixed(0) + " m/s";
    else left = "deck " + dk + "  stopped";
    ctx.hud.set(left + "\n" + fmtG(s.felt), "lean " + Math.round(Math.abs(s.phi) / DEG) + "°  tea " + Math.round(s.tea * 100) + "%");
  }

  // the cabin's own frame to the stage
  function toStage(s, x, y) {
    const c = Math.cos(-s.phi), n = Math.sin(-s.phi);
    return [CX + x * c - y * n, CY + x * n + y * c];
  }
  function bobTip(s) {
    const p = toStage(s, BOBX, BOB_TOP);
    return [p[0] + BOB_LEN * Math.sin(s.bob), p[1] + BOB_LEN * Math.cos(s.bob)];
  }
  function cupPos(s) {
    const k = smooth(0.1, 0.7, s.endT);
    return [lerp(CUP_AT[0], -112, k), lerp(CUP_AT[1], -42, k)];
  }

  function addDrops(s, ctx, side) {
    const G = 1500, gx = G * Math.sin(s.need), gy = G * Math.cos(s.need);
    const cp = cupPos(s), rim = toStage(s, cp[0] + side * 15, cp[1] - 22);
    const ux = Math.cos(-s.phi) * side, uy = Math.sin(-s.phi) * side;
    const sp = ctx.rng.range(50, 150);
    s.parts.add({ x: rim[0], y: rim[1], vx: ux * sp + ctx.rng.range(-20, 20), vy: uy * sp - ctx.rng.range(10, 70), ax: gx, g: gy, life: ctx.rng.range(0.35, 0.55), r: ctx.rng.range(3.5, 7), col: ctx.rng.chance(0.3) ? TEA_L : TEA, a: 1 });
    // and the same drop, close up
    const lc = Math.cos(-s.phi), ls = Math.sin(-s.phi);
    const lx = side * 56, ly = -40;
    s.lensParts.add({ x: lx * lc - ly * ls, y: lx * ls + ly * lc, vx: (ux * sp * 1.4) + ctx.rng.range(-30, 30), vy: uy * sp * 1.4 - ctx.rng.range(20, 120), ax: gx * 0.9, g: gy * 0.9, life: ctx.rng.range(0.4, 0.7), r: ctx.rng.range(5, 10), col: ctx.rng.chance(0.3) ? TEA_L : TEA, a: 1 });
  }

  /* ---- drawing ---- */
  function wallCol(pal) { return mix(pal.a, "#c98f63", 0.5); }

  function drawShaft(g, s, pal, line) {
    g.fillStyle = shade(pal.a, -0.78); g.fillRect(0, 0, SW, SH);
    if (line) {
      // a line deck's tube: ribs come at you
      for (let i = 0; i < 8; i++) {
        const z = ((i / 8 + s.tube * 0.012) % 1);
        const k = 0.35 + z * z * 1.6;
        g.globalAlpha = 0.15 + 0.5 * z;
        rrect(g, CX - 420 * k, CY - 330 * k, 840 * k, 660 * k, 60 * k);
        g.lineWidth = 6 + 18 * z; g.strokeStyle = shade(pal.a, -0.35); g.stroke();
        g.globalAlpha = 1;
      }
      for (let i = 0; i < 6; i++) {
        const z = ((i / 6 + s.tube * 0.02 + 0.3) % 1), k = 0.35 + z * z * 1.6;
        lamp(g, CX + 380 * k, CY - 300 * k, 3 + 6 * z, "#ffd9a0", 3);
        lamp(g, CX - 380 * k, CY - 300 * k, 3 + 6 * z, "#ffd9a0", 3);
      }
      return;
    }
    // the core's walls, with the decks sliding past: one every 4 m
    const gap = 250, off = ((s.scroll % gap) + gap) % gap;
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? 0 : 815, x1 = side < 0 ? 185 : SW;
      g.fillStyle = shade(pal.a, -0.68); g.fillRect(x0, 0, x1 - x0, SH);
      for (let y = off - gap; y < SH + gap; y += gap) {
        g.fillStyle = shade(pal.a, -0.5); g.fillRect(x0, y, x1 - x0, 46);
        g.fillStyle = alpha(pal.b, 0.18); g.fillRect(x0, y + 46, x1 - x0, 3);
        lamp(g, side < 0 ? 132 : 868, y + 80, 6, "#ffd9a0", 4);
      }
      const rx = side < 0 ? 170 : 830;
      seg(g, rx, -10, rx, SH + 10, 10, shade(pal.b, -0.45));
      // streaks at speed
      const sp = Math.abs(s.vUp) / VMAX;
      if (sp > 0.2) {
        const r = makeRng(7 + side);
        for (let i = 0; i < 7; i++) {
          const x = x0 + 20 + r() * (x1 - x0 - 40), len = 90 + r() * 160;
          const y = (((r() * SH + s.scroll * (1.6 + r())) % (SH + 300)) + SH + 300) % (SH + 300) - 150;
          seg(g, x, y, x, y + len * sp, 2, alpha(pal.b, 0.18 * sp));
        }
      }
    }
  }

  function drawStrip(g, s, pal) {
    const y = (d) => 862 - (d - 1) / 375 * 600, x0 = 24, w = 30;
    const bands = [[1, 15, shade(pal.b, -0.55), "KEEL"], [16, 113, pal.aD, "LOW"], [114, 301, pal.a, "MIDDLE"], [302, 375, pal.aL, "HIGH"]];
    fillRR(g, x0 - 6, y(376) - 8, w + 12, y(1) - y(376) + 16, 10, alpha(INK, 0.6));
    for (const b of bands) {
      g.fillStyle = b[2]; g.fillRect(x0, y(b[1] + 1), w, y(b[0]) - y(b[1] + 1));
      sign(g, b[3], x0 + w + 10, (y(b[0]) + y(b[1] + 1)) / 2 + 8, 22, alpha(PAPER, 0.62), "left", 700);
    }
    disc(g, x0 + w / 2, y(376) - 2, 6, "#ffe9b8");                       // the Hollow, at the top
    // where the brakes come on, on the way up
    const up = SEGS[1], bd = deckAtR(up.r1 + VMAX * up.TA / 2);
    g.fillStyle = alpha("#ffd9a0", 0.35); g.fillRect(x0, y(D_TOP), w, y(bd) - y(D_TOP));
    for (const d of [D_START, D_TOP, D_END]) seg(g, x0 - 4, y(d), x0 + w + 4, y(d), 3, alpha(PAPER, 0.8));
    const dk = clamp(deckAtR(s.r), 1, 376), cy = y(dk);
    fillRR(g, x0 - 9, cy - 9, w + 18, 18, 6, PAPER);
    fillRR(g, x0 - 3, cy - 4, w + 6, 8, 3, pal.a);
  }

  function drawFrame(g, s, pal) {
    fillRR(g, 188, 240, 624, 618, 44, shade(pal.a, -0.58));
    fillRR(g, 204, 256, 592, 586, 34, shade(pal.a, -0.74));
    rrect(g, 188, 240, 624, 618, 44); g.lineWidth = 4; g.strokeStyle = alpha(pal.b, 0.55); g.stroke();
    // the gimbal ring, with a scale under it
    ring(g, CX, CY, 290, 9, alpha(pal.b, 0.4));
    for (let a = -30; a <= 30; a += 10) {
      const t = a * DEG, r0 = a === 0 ? 268 : 276;
      seg(g, CX + r0 * Math.sin(t), CY + r0 * Math.cos(t), CX + 290 * Math.sin(t), CY + 290 * Math.cos(t), 3, alpha(pal.b, 0.5));
    }
  }

  function drawCup(g, x, y, w, h, fill, surf, tilt, o) {
    // a clear glass cup, base at (x, y), w wide and h tall; surf is the tea's surface tilt against the cup (rad)
    o = o || {};
    g.save(); g.translate(x, y); g.rotate(tilt || 0);
    const tw = w / 2, bw = w * 0.4;
    const cupPath = () => { g.beginPath(); g.moveTo(-tw, -h); g.lineTo(tw, -h); g.lineTo(bw, 0); g.quadraticCurveTo(0, h * 0.06, -bw, 0); g.closePath(); };
    cupPath(); g.fillStyle = alpha(PAPER, o.glass === undefined ? 0.16 : o.glass); g.fill();
    // the tea: below a line through the level, tilted by surf
    const level = -h * (0.04 + 0.96 * clamp(fill, 0, 1) * 0.93) - h * 0.0;
    if (fill > 0.001) {
      g.save(); cupPath(); g.clip();
      const t = Math.tan(clamp(surf, -1.2, 1.2));
      g.beginPath(); g.moveTo(-w, level + w * t); g.lineTo(w, level - w * t); g.lineTo(w, h); g.lineTo(-w, h); g.closePath();
      g.fillStyle = TEA; g.fill();
      seg(g, -w, level + w * t, w, level - w * t, Math.max(2, h * 0.06), TEA_L);
      g.restore();
    }
    // rim and walls
    g.lineCap = "round";
    seg(g, -tw, -h, -bw, 0, Math.max(2, w * 0.035), alpha(PAPER, 0.75));
    seg(g, tw, -h, bw, 0, Math.max(2, w * 0.035), alpha(PAPER, 0.75));
    seg(g, -tw - w * 0.02, -h, tw + w * 0.02, -h, Math.max(2, w * 0.03), alpha(PAPER, 0.9));
    seg(g, -bw, 0, bw, 0, Math.max(2, w * 0.05), alpha(PAPER, 0.6));
    if (o.shine) seg(g, -tw * 0.62, -h * 0.82, -bw * 0.8, -h * 0.2, w * 0.05, alpha(PAPER, 0.35));
    if (o.slop) {
      // tea slopping over the rim, running down the outside
      const sd = Math.sign(o.slop), k = Math.abs(o.slop);
      g.beginPath(); g.moveTo(sd * (tw - w * 0.12), -h - h * 0.05);
      g.quadraticCurveTo(sd * (tw + w * 0.1), -h - h * 0.14 * k, sd * (tw + w * 0.07), -h + h * 0.12);
      g.lineTo(sd * (tw + w * 0.02 - (tw - bw) * 0.5 * k), -h + h * 0.6 * k);
      g.lineTo(sd * (tw - w * 0.01), -h + h * 0.05);
      g.closePath(); g.fillStyle = TEA; g.fill();
    }
    g.restore();
  }

  function drawBun(g, x, y, r, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    g.beginPath(); g.ellipse(0, 0, r * 1.3, r * 0.85, 0, 0, TAU); g.fillStyle = BUN; g.fill();
    g.beginPath(); g.ellipse(-r * 0.15, -r * 0.2, r * 0.9, r * 0.45, 0, 0, TAU); g.fillStyle = shade(BUN, 0.25); g.fill();
    seg(g, -r * 0.7, -r * 0.05, r * 0.6, -r * 0.3, 2, shade(BUN, -0.3));
    g.restore();
  }

  function drawCabin(g, s, pal, ctx) {
    const wall = wallCol(pal);
    fillRR(g, -HW, -HH, HW * 2, HH * 2, 34, pal.b);
    fillRR(g, -HW + 11, -HH + 11, HW * 2 - 22, HH * 2 - 22, 26, wall);
    g.save(); rrect(g, -HW + 11, -HH + 11, HW * 2 - 22, HH * 2 - 22, 26); g.clip();
    // felt, quilted in panels
    for (let x = -HW + 60; x < HW; x += 58) seg(g, x, -HH, x, FLOOR - 70, 3, alpha(INK, 0.1));
    g.fillStyle = shade(wall, -0.2); g.fillRect(-HW, FLOOR - 70, HW * 2, 70);
    g.fillStyle = alpha(pal.b, 0.5); g.fillRect(-HW, FLOOR - 74, HW * 2, 4);
    // the lamp: the room is warm
    glow(g, 0, -HH + 30, 330, "#ffd59a", 0.32);
    // the door, and its little panel with the deck going by
    rrect(g, 128, -112, 84, FLOOR + 112, 10); g.lineWidth = 4; g.strokeStyle = alpha(INK, 0.22); g.stroke();
    fillRR(g, 142, -84, 56, 30, 5, alpha(INK, 0.75));
    mono(g, String(clamp(deckAtR(s.r), 1, 376)), 170, -62, 20, "#ffd9a0");
    // the floor, and the mark the bob should hang over
    g.fillStyle = shade(pal.b, -0.35); g.fillRect(-HW, FLOOR, HW * 2, HH - FLOOR);
    g.fillStyle = shade(pal.b, -0.1); g.fillRect(-HW, FLOOR, HW * 2, 5);
    // spilt tea on the floor
    for (const [amt, x0, dir] of [[s.spillR, CUP_AT[0] + 40, 1], [s.spillL, CUP_AT[0] - 30, -1]]) {
      if (amt < 0.002) continue;
      const w = 10 + Math.min(80, Math.sqrt(amt) * 150), cx = x0 + dir * w * 0.5;
      g.beginPath(); g.ellipse(cx, FLOOR + 4, w, 4 + Math.min(4, amt * 20), 0, 0, TAU); g.fillStyle = alpha(TEA, 0.85); g.fill();
      g.beginPath(); g.ellipse(cx - w * 0.2, FLOOR + 2, w * 0.5, 1.6, 0, 0, TAU); g.fillStyle = alpha(TEA_L, 0.7); g.fill();
    }
    const gl = s.glowT > 0 ? s.glowT / 0.7 : 0;
    if (gl > 0) glow(g, BOBX, FLOOR, 70, "#ffffff", 0.4 * gl);
    poly(g, [BOBX - 20, FLOOR + 22, BOBX + 20, FLOOR + 22, BOBX, FLOOR - 4], mix(pal.b, PAPER, 0.6));
    seg(g, BOBX, FLOOR - 4, BOBX, FLOOR - 26, 3, alpha(PAPER, 0.5));
    // the bob's mount
    fillRR(g, BOBX - 14, -HH + 8, 28, 12, 4, pal.bD);
    // the bench
    fillRR(g, -HW + 8, 78, 150, 26, 9, pal.a);
    fillRR(g, -HW + 8, 100, 140, FLOOR - 100, 4, shade(pal.a, -0.35));
    fillRR(g, -HW + 8, -40, 26, 128, 10, pal.aD);
    // the rider: a bun in one hand, the tea in the other
    const cp = cupPos(s), dr = smooth(0.15, 0.7, s.endT);
    const P = person(g, -150, FLOOR, 300, {
      view: "side", face: 1, pose: "sit", shirt: PAPER, legs: shade(pal.a, -0.3), sash: pal.a, skin: SKINS[2], hair: HAIRS[1],
      handTo: [cp[0] - 4, cp[1] + 4], handTo2: [-128 + 6 * Math.sin(s.t * 1.3), -6 - 30 * dr],
    });
    drawBun(g, P.hx1 + 6, P.hy1 - 8, 15, -0.3);
    const tilt = -1.0 * smooth(0.45, 0.9, s.endT);
    drawCup(g, cp[0], cp[1], 34, 32, s.tea * (1 - 0.6 * smooth(0.6, 1.2, s.endT)), s.psi + tilt, tilt, { slop: s.slop });
    g.restore();
    // a silver lip on the shell
    rrect(g, -HW + 2, -HH + 2, HW * 2 - 4, HH * 2 - 4, 32); g.lineWidth = 3; g.strokeStyle = alpha(PAPER, 0.35); g.stroke();
  }

  function drawLens(g, s, pal) {
    disc(g, LX, LY, LR + 10, shade(pal.a, -0.6));
    g.save(); g.beginPath(); g.arc(LX, LY, LR, 0, TAU); g.clip();
    g.translate(LX, LY);
    g.save(); g.rotate(-s.phi);
    g.fillStyle = wallCol(pal); g.fillRect(-LR * 1.6, -LR * 1.6, LR * 3.2, LR * 3.2);
    glow(g, -20, -LR, 200, "#ffd59a", 0.28);
    g.fillStyle = shade(wallCol(pal), -0.2); g.fillRect(-LR * 1.6, 50, LR * 3.2, LR);
    const tilt = -1.0 * smooth(0.45, 0.9, s.endT);
    drawCup(g, 0, 40, 110, 80, s.tea * (1 - 0.6 * smooth(0.6, 1.2, s.endT)), s.psi + tilt * 0.6, tilt * 0.6, { glass: 0.2, shine: true, slop: s.slop });
    g.restore();
    s.lensParts.draw(g);
    g.restore();
    ring(g, LX, LY, LR + 4, 8, pal.b);
    ring(g, LX, LY, LR + 9, 2, alpha(PAPER, 0.4));
  }

  function draw(s, g, ctx) {
    const pal = ctx.pal, cur = SEGS[Math.min(s.seg, SEGS.length - 1)];
    drawShaft(g, s, pal, cur.k === "line");
    drawStrip(g, s, pal);
    drawFrame(g, s, pal);
    // the rods from the ring to the cabin's pins
    for (const sd of [-1, 1]) {
      const p = toStage(s, sd * HW, -20), a = Math.atan2(p[0] - CX, p[1] - CY);
      seg(g, p[0], p[1], CX + 290 * Math.sin(a), CY + 290 * Math.cos(a), 16, shade(pal.b, -0.25));
      disc(g, p[0], p[1], 13, pal.b);
    }
    g.save(); g.translate(CX, CY); g.rotate(-s.phi); drawCabin(g, s, pal, ctx); g.restore();
    // the bob, hanging along the pull, and where it points on the floor
    const top = toStage(s, BOBX, BOB_TOP), tip = bobTip(s);
    const lineLen = (FLOOR + 4 - BOB_TOP) / Math.max(0.3, Math.cos(s.bob - s.phi));
    const foot = [top[0] + lineLen * Math.sin(s.bob), top[1] + lineLen * Math.cos(s.bob)];
    g.save(); g.setLineDash([6, 9]); seg(g, tip[0], tip[1], foot[0], foot[1], 2.5, alpha(PAPER, 0.5)); g.restore();
    seg(g, top[0], top[1], tip[0], tip[1], 3, alpha(INK, 0.7));
    const ba = s.bob;
    g.save(); g.translate(tip[0], tip[1]); g.rotate(-ba);
    poly(g, [-13, -8, 13, -8, 0, 26], pal.b); poly(g, [-13, -8, 0, -8, 0, 26], shade(pal.b, 0.4));
    disc(g, 0, -10, 6, shade(pal.b, -0.3));
    g.restore();
    s.parts.draw(g);
    drawLens(g, s, pal);
    // the deck, painted on the cab
    const dk = clamp(deckAtR(s.r), 1, 376);
    if (s.flash > 0) glow(g, 290, 240, 150, "#ffd9a0", 0.5 * s.flash);
    board(g, 290, 240, 170, 60, "DECK " + dk);
    spinMark(g, 692, 250, alpha(PAPER, 0.7), 1, 24);
    // where your finger has the gimbal: a knob on a rail under the cab
    const kx = 500 + (s.aim / LEAN_MAX) * 430;
    seg(g, 70, 900, 930, 900, 4, alpha(pal.b, 0.3));
    seg(g, 500, 888, 500, 912, 3, alpha(pal.b, 0.5));
    fillRR(g, kx - 22, 886, 44, 28, 10, pal.b);
    seg(g, kx, 891, kx, 909, 3, shade(pal.a, -0.4));
    s.notes.draw(g);
    if (s.endT > 0) {
      const k = smooth(0.2, 0.6, s.endT);
      g.globalAlpha = k;
      fillRR(g, 340, 760, 320, 92, 16, alpha(INK, 0.8));
      sign(g, Math.round(s.tea * 100) + "%", 500, 822, 64, PAPER, "center", 800);
      g.globalAlpha = 1;
    }
  }

  // The house plays: steer for the lean the ride needs, a beat late, with a less steady hand the less skilled.
  function bot(s, b, ctx) {
    const sk = ctx.skill, lag = 0.08 + (1 - sk) * 0.4;
    const k = Math.min(s.n - 1, Math.round(lag * 120));
    const need = s.n > 0 ? s.hist[((s.n - 1 - Math.max(0, k)) % 128 + 128) % 128] : 0;
    const bn = s.bn;
    bn.t -= 1 / 120;
    if (bn.t <= 0) { bn.t = ctx.rng.range(0.25, 0.6); bn.to = ctx.rng.range(-1, 1) * (1 - sk) * 6 * DEG; }
    bn.v += (bn.to - bn.v) * (1 - Math.exp(-14 / 120));
    b.x = 500 + clamp((need + bn.v) / LEAN_MAX, -1, 1) * 430; b.y = 600;
  }

  registerEvent({
    id: "swift", hour: 8, name: "The Lean",
    place: "A lift core in Swift · deck 4 in the Keel to line deck 363, and back to deck 77 · 0.99 to 0.52 g",
    intro: "A cab climbing through a spinning drum is pushed spinward, so its cabin hangs on a gimbal and leans against the push. Nobody notices: the cab is a room. Swift's fitters test newcomers with the gimbal on hand and a cup of tea with its lid off.",
    how: "Slide your finger left and right to lean the cabin. Keep the bob over the mark and the tea in the cup.",
    keys: "left and right arrows to lean",
    marks: [45, 75, 92], unit: "per cent of the tea", fmt: (v) => String(Math.round(v)),
    result: (s) => Math.round(s.tea * 100) + "% of the tea, steepest lean " + Math.round((s.maxLean > 5 * DEG ? s.maxLean : (s.maxPhi || 0)) / DEG) + "°",
    create, update, draw, bot,
  });
})();
