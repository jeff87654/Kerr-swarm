/* ---------- Heron: The Tide ----------
   Every morning about forty-five million Sorrelers glide out to work through the rim, some three million
   tonnes of them, and the drum would slow by about a thousandth. So Heron pumps the same weight of water
   in from the moat to the tide tanks at mid-drum (decks 186 and 187, all the way round), train by train.
   The water takes P = 2 s to climb its pipe, so it has to be sent before the train lets go, not after.
   Drawn end-on: twelve wedges, each with a platform at the rim, a pipe, a stretch of tank and a boarding
   dial whose notch says "send now". A released train keeps the rim's speed and flies straight; in the
   turning frame that is a curl backward: r = R sqrt(1 + (wt)^2), angle offset atan(wt) - wt. */
"use strict";
(function () {
  const CX = 500, CY = 500;
  // radii in stage units: the rim (the hull's inner face) at 436, so deck 186 sits at 436 x 2260 / 3000 = 328
  const RNAME = 482, RQ = 461, RJ1 = 452, RJ0 = 436, RPLAT = 428, RT = 328, TW = 26, RD = 266, DR = 36, RF = 218;
  const RT_OUT = RT + TW / 2, RT_IN = RT - TW / 2;
  const P = 2.0;                      // seconds for a slug to climb from the rim to the tanks
  const DAY = 60;                     // 07:00 to 10:00
  const NTR = 26;                     // trains in the morning
  const SLOW = 0.110 / NTR;           // a whole morning unbalanced: a thousandth of 110 s
  const CAP = NTR / 12;               // slugs a wedge's stretch of tank holds when the tide is in
  const TRAIN_K = 6;                  // the departing curl, sped up so it can be seen
  const BG = "#0d1316";
  const WATER = "#7fb6d9", WATER_L = "#d9eef9", WARM = "#ffcf8a", HOT = "#ef8f5e", LAMPC = "#ffd9a0";
  const HERON = "#4f86ad";
  const FLOOR_COL = ["", "#b9a26a", "#6f9a4d", "#6f9a4d", "#6f9a4d", "#4f97aa", "#4f97aa", "#4f97aa", "#9dbb6f", "#9dbb6f", "#9dbb6f", "#b9a26a", "#b9a26a"];

  const pt = (r, a) => [CX + r * Math.sin(a), CY - r * Math.cos(a)];
  const hA = (n) => (n - 0.5) * TAU / 12;
  // an arc of a dial: f0..f1 are fractions of a turn clockwise from the top
  function arcF(g, x, y, r, f0, f1, w, col, butt) {
    if (f1 <= f0) return;
    g.beginPath(); g.arc(x, y, r, f0 * TAU - Math.PI / 2, f1 * TAU - Math.PI / 2);
    g.lineWidth = w; g.strokeStyle = col; g.lineCap = butt ? "butt" : "round"; g.stroke(); g.lineCap = "round";
  }
  function hourAt(x, y) {
    const dx = x - CX, dy = y - CY, r = Math.hypot(dx, dy);
    if (r < 150 || r > 530) return 0;
    let a = Math.atan2(dx, -dy); if (a < 0) a += TAU;
    return Math.floor(a / (TAU / 12)) + 1;
  }

  /* ---- the morning's trains: a few at first, the eight o'clock rush, then easing ---- */
  const dens = (t) => 0.4 + 0.9 * Math.exp(-Math.pow((t - 25) / 10, 2));
  function makeSchedule(rng) {
    const T0 = 6.2, T1 = 55.5, K = 600, cdf = [0];
    for (let i = 1; i <= K; i++) cdf.push(cdf[i - 1] + dens(T0 + (T1 - T0) * (i - 0.5) / K));
    const tot = cdf[K];
    const inv = (u) => { const w = u * tot; let i = 1; while (i < K && cdf[i] < w) i++; const f = (w - cdf[i - 1]) / (cdf[i] - cdf[i - 1]); return T0 + (T1 - T0) * (i - 1 + f) / K; };
    const ds = [];
    for (let i = 0; i < NTR; i++) ds.push(inv(clamp((i + 0.5 + rng.range(-0.35, 0.35)) / NTR, 0, 1)));
    ds.sort((a, b) => a - b);
    ds[0] = T0;
    for (let i = 1; i < NTR; i++) if (ds[i] < ds[i - 1] + 0.9) ds[i] = ds[i - 1] + 0.9;
    const last = new Array(13).fill(-99), recent = [], trains = [];
    for (let i = 0; i < NTR; i++) {
      const D = ds[i], peak = (dens(D) - 0.4) / 0.9;
      const B = i === 0 ? 5 : clamp(5.0 - 1.4 * peak + rng.range(-0.25, 0.25), 3.5, 5.0);
      const s0 = D - B;
      let ok = [];
      for (let n = 1; n <= 12; n++) if (s0 > last[n] + 0.8 && recent.indexOf(n) < 0) ok.push(n);
      if (!ok.length) for (let n = 1; n <= 12; n++) if (s0 > last[n] + 0.8) ok.push(n);
      if (!ok.length) { let m = 1; for (let n = 2; n <= 12; n++) if (last[n] < last[m]) m = n; ok = [m]; }
      const h = i === 0 ? 2 : rng.pick(ok);       // the first train of the day goes from Heron's own platform
      last[h] = D; recent.push(h); if (recent.length > 4) recent.shift();
      trains.push({ i, h, B, D, s0, on: false, gone: false, slug: null, res: null, pts: 0 });
    }
    return trains;
  }

  function create(ctx) {
    return {
      t: 0, trains: makeSchedule(ctx.rng), slugs: [], gone: [], lvl: new Array(13).fill(0),
      points: 0, pen: 0, settled: 0, trims: 0, streak: 0, best: 0, turn: 110, wob: 0,
      flash: new Array(13).fill(null), press: new Array(13).fill(0), hover: 0,
      parts: new Parts(260), notes: new Notes(), said: 0, phase: "play", endT: 0, botGap: 0,
      score: 0, done: false,
    };
  }

  const dialAt = (n) => pt(RD, hA(n));
  // the train boarding at Hour n now, if any
  function boarding(s, n) { for (const tr of s.trains) if (tr.h === n && tr.on && !tr.gone) return tr; return null; }

  function send(s, h, ctx) {
    const t = s.t, [x, y] = dialAt(h);
    s.press[h] = 1;
    let tr = null;
    for (const c of s.trains) if (c.h === h && c.on && !c.gone && !c.slug) { tr = c; break; }
    const sl = { h, t0: t, arr: t + P, tr, in: false };
    s.slugs.push(sl);
    ctx.sfx.pour();
    if (tr) { tr.slug = sl; return; }
    // a train that has just gone without its water: it is already counted, this is only late
    for (const c of s.trains) if (c.h === h && c.gone && !c.slug && t - c.D < 1.2) { sl.late = true; s.notes.add("late", x, y - 46, { size: 36, col: HOT }); return; }
    // water with no train to balance it: the drum runs fast
    s.pen += 0.3; s.turn -= 0.3 * SLOW; s.streak = 0;
    sl.fast = true;
    s.notes.add("running fast", x, y - 46, { size: 34, col: HOT });
    ctx.sfx.bad();
  }

  function settle(s, tr, ctx) {
    let pts = 0, word = "missed";
    if (tr.slug) {
      const e = tr.slug.arr - tr.D, a = Math.abs(e);
      pts = a <= 0.25 ? 1 : a <= 0.6 ? 0.6 : a <= 1.2 ? 0.3 : 0;
      word = pts === 1 ? "trim" : (pts > 0 ? "" : "too ") + (e < 0 ? "early" : "late");
      tr.err = e;
    }
    tr.res = word; tr.pts = pts;
    s.points += pts; s.settled++;
    s.turn += (1 - pts) * SLOW;
    const [x, y] = dialAt(tr.h);
    if (pts === 1) {
      s.trims++; s.streak++; s.best = Math.max(s.best, s.streak);
      ctx.sfx.chime(Math.min(10, s.streak - 1));
      if (s.streak === 5 || s.streak === 10 || s.streak === 15 || s.streak === 20) { ctx.sfx.great(); s.notes.add(numWord(s.streak) + " in trim", CX, CY - 64, { size: 40, col: WATER_L, life: 1.6, rise: 30 }); }
    } else {
      s.streak = 0;
      if (pts > 0) ctx.sfx.good(); else ctx.sfx.miss();
      if (!ctx.reduced) s.wob = Math.max(s.wob, 0.35 + 0.65 * (1 - pts));
    }
    s.flash[tr.h] = { t: 0, pts };
    s.notes.add(word, x, y - 46, { size: pts === 1 ? 46 : 38, col: pts === 1 ? WATER_L : pts > 0 ? PAPER : HOT });
  }

  function update(s, dt, inp, ctx) {
    s.t += dt;
    const t = s.t;
    s.parts.update(dt); s.notes.update(dt);
    for (let n = 1; n <= 12; n++) {
      if (s.flash[n]) { s.flash[n].t += dt; if (s.flash[n].t > 1.2) s.flash[n] = null; }
      s.press[n] = Math.max(0, s.press[n] - dt * 4);
    }
    for (let i = s.gone.length - 1; i >= 0; i--) if (t - s.gone[i].t0 > 5) s.gone.splice(i, 1);
    s.wob = Math.max(0, s.wob - dt * 2.2);
    // the water finds its own level round the ring
    const L = s.lvl, nl = L.slice();
    for (let n = 1; n <= 12; n++) { const a = L[n === 1 ? 12 : n - 1], b = L[n === 12 ? 1 : n + 1]; nl[n] = L[n] + 0.07 * dt * (a + b - 2 * L[n]); }
    s.lvl = nl;

    // captions
    if (s.said === 0 && t > 0.3) { s.said = 1; ctx.say("Send the water when the ring reaches the notch.", 5); }
    if (s.said === 1 && t >= 19.6) { s.said = 2; ctx.say("Eight o'clock. Everyone leaves at once.", 3.5); }

    // the player
    if (inp.moved) s.hover = hourAt(inp.x, inp.y);
    if (s.phase === "play" && t < DAY) {
      let h = inp.num || 0;
      if (!h && inp.ptrPressed) h = hourAt(inp.x, inp.y);
      if (h) send(s, h, ctx);
    }

    // trains board, let go, and are weighed against their water
    for (const tr of s.trains) {
      if (!tr.on && t >= tr.s0) { tr.on = true; ctx.sfx.tick(); }
      if (tr.on && !tr.gone && t >= tr.D) {
        tr.gone = true;
        s.gone.push({ h: tr.h, t0: tr.D });
        ctx.sfx.whoosh(0.7);
        if (!tr.slug || tr.slug.arr <= t) settle(s, tr, ctx);
      }
      if (tr.gone && !tr.res && tr.slug && t >= tr.slug.arr) settle(s, tr, ctx);
    }
    // the slugs climb, and land in the tanks
    for (let i = s.slugs.length - 1; i >= 0; i--) {
      const sl = s.slugs[i];
      if (!sl.in && t >= sl.arr) {
        sl.in = true; s.lvl[sl.h] += 1;
        const [x, y] = pt(RT_OUT - 4, hA(sl.h));
        for (let k = 0; k < 9; k++) s.parts.add({ x, y, vx: ctx.rng.range(-70, 70), vy: ctx.rng.range(-70, 70), life: 0.5, r: 3.2, col: WATER_L, drag: 4, a: 0.9 });
        ctx.sfx.splash(0.35);
      }
      if (sl.in && t - sl.arr > 0.8) s.slugs.splice(i, 1);
    }

    // the end of the morning
    const allIn = s.trains.every((tr) => tr.res) && s.slugs.every((sl) => sl.in);
    if (s.phase === "play" && t >= DAY && allIn) { s.phase = "end"; s.endT = 0; ctx.say("Ten. The tide is in.", 3); ctx.sfx.bell(7); }
    if (s.phase === "end") { s.endT += dt; if (s.endT > 1.5) s.done = true; }

    const net = Math.max(0, s.points - s.pen);
    s.score = Math.round(100 * net / NTR);
    const mins = 420 + 180 * clamp(t / DAY, 0, 1);
    ctx.hud.set(fmtClock(mins) + "\n" + s.turn.toFixed(3) + " s a turn",
      s.settled ? "trim " + Math.round(100 * net / s.settled) + "%" : NTR + " trains");
  }

  /* ---- drawing ---- */
  function drawOutside(s, g, t) {
    // the Hours' names round the outside, like a bezel
    for (let n = 1; n <= 12; n++) {
      const b = boarding(s, n);
      arcText(g, HOURS[n].name.toUpperCase(), CX, CY, RNAME, hA(n), 25, b ? PAPER : shade(HOURS[n].a, 0.38), 800);
    }
    // which way the drum turns, between Lark and Hare
    arcText(g, "SPINWARD", CX, CY, RNAME, -0.018, 22, "#8a938e", 700);
    const aa = 0.12, [ax, ay] = pt(RNAME, aa);
    g.save(); g.translate(ax, ay); g.rotate(aa); poly(g, [0, -7, 15, 0, 0, 7], "#8a938e"); g.restore();
    // trains that have let go: they fly straight, so from the turning drum they curl away backward
    for (const gt of s.gone) {
      const am = hA(gt.h);
      for (let c = 0; c < 3; c++) {
        const dtt = Math.max(0, t - gt.t0 - c * 0.09), wt = DRUM.W * TRAIN_K * dtt;
        const r = RQ * Math.sqrt(1 + wt * wt), a = am + Math.atan(wt) - wt - c * 0.004;
        const [x, y] = pt(r, a);
        if (x < -20 || x > SW + 20 || y < -20 || y > SH + 20) continue;
        glow(g, x, y, 16, LAMPC, 0.35); disc(g, x, y, c === 0 ? 4.6 : 3.6, c === 0 ? "#fff1d6" : LAMPC);
      }
    }
  }

  function drawJacket(g, s, t) {
    g.beginPath(); g.arc(CX, CY, (RJ0 + RJ1) / 2, 0, TAU); g.lineWidth = RJ1 - RJ0; g.strokeStyle = "#31454f"; g.stroke();
    for (let i = 0; i < 60; i++) {
      const a = i * TAU / 60 + TAU / 120, [x0, y0] = pt(RJ0 - 1, a), [x1, y1] = pt(RJ1 + 1, a);
      seg(g, x0, y0, x1, y1, 2.4, BG);
      const [qx, qy] = pt(RQ, a);
      disc(g, qx, qy, 2.2, alpha("#f0b56a", 0.7));
    }
  }

  function drawWedges(s, g, t, sun) {
    for (let n = 1; n <= 12; n++) {
      const H = HOURS[n], gap = 0.011, a0 = (n - 1) * TAU / 12 + gap, a1 = n * TAU / 12 - gap, am = hA(n);
      const tr = boarding(s, n), fl = s.flash[n];
      let base = mix(H.a, BG, 0.52);
      if (tr) base = mix(H.a, BG, 0.3);
      wedgePath(g, CX, CY, RF + 11, RJ0, a0, a1); g.fillStyle = base; g.fill();
      g.save(); wedgePath(g, CX, CY, RF + 11, RJ0, a0, a1); g.clip();
      // the line decks, in the Hour's second colour
      g.lineWidth = 1.4; g.strokeStyle = alpha(H.b, 0.16);
      for (const d of [38, 88, 138, 238, 288, 338]) { g.beginPath(); g.arc(CX, CY, RJ0 * deckR(d) / 3000, 0, TAU); g.stroke(); }
      // the Keel, darker at the rim
      g.beginPath(); g.arc(CX, CY, RJ0 - 9, 0, TAU); g.lineWidth = 18; g.strokeStyle = mix(H.a, BG, 0.74); g.stroke();
      // a flash when the train is weighed against its water, and a blink when tapped
      if (fl) { g.fillStyle = alpha(fl.pts >= 1 ? WATER_L : fl.pts > 0 ? PAPER : HOT, 0.32 * (1 - fl.t / 1.2)); g.fillRect(0, 0, SW, SH); }
      if (s.press[n] > 0) { g.fillStyle = alpha(PAPER, 0.18 * s.press[n]); g.fillRect(0, 0, SW, SH); }
      if (s.hover === n && s.phase === "play") { g.fillStyle = alpha(PAPER, 0.05); g.fillRect(0, 0, SW, SH); }
      g.restore();
      // the Hollow's floor: orchards, lake, lawns and grounds
      wedgePath(g, CX, CY, RF - 1, RF + 10, a0, a1); g.fillStyle = mix("#1b2a2e", FLOOR_COL[n], 0.35 + 0.65 * sun); g.fill();
      // the platform at the rim: warm while a train boards, people walking to the Minute
      g.beginPath(); g.arc(CX, CY, RPLAT, a0 + 0.03 - Math.PI / 2, a1 - 0.03 - Math.PI / 2); g.lineWidth = 6;
      g.strokeStyle = tr ? WARM : alpha(PAPER, 0.14); g.stroke();
      if (tr) {
        const k = clamp((t - tr.s0) / tr.B, 0, 1);
        for (let i = 0; i < 8; i++) {
          const ph = (t * 0.55 + i / 8 + n * 0.13) % 1, side = i % 2 ? 1 : -1;
          const a = am + side * (1 - ph) * 0.2, [x, y] = pt(RPLAT - 9, a);
          g.globalAlpha = smooth(0, 0.2, ph) * (1 - smooth(0.85, 1, ph)) * (1 - k * 0.6);
          disc(g, x, y, 2.6, PAPER);
        }
        g.globalAlpha = 1;
        // the train at the quay, three warm lights, brightening as it fills
        for (let c = -1; c <= 1; c++) {
          const [x, y] = pt(RQ, am + c * 0.021);
          glow(g, x, y, 15, LAMPC, 0.2 + 0.3 * k);
          disc(g, x, y, 4.4, mix("#b4875a", "#fff1d6", k));
        }
      }
    }
  }

  function drawTanks(s, g, t, endK) {
    // the channel
    g.beginPath(); g.arc(CX, CY, RT, 0, TAU); g.lineWidth = TW; g.strokeStyle = mix(HERON, BG, 0.78); g.stroke();
    // about 120 tanks round the ring, each filled from the outside in (out is down)
    const L = s.lvl, M = 120;
    for (let k = 0; k < M; k++) {
      const ac = (k + 0.5) * TAU / M;
      const u = ac / (TAU / 12) - 0.5, i0 = Math.floor(u), f = u - i0;
      const n0 = ((i0 + 11) % 12) + 1, n1 = (n0 % 12) + 1;
      const lv = lerp(L[n0], L[n1], f);
      const fill = clamp(lv / CAP, 0, 1);
      if (fill <= 0.002) continue;
      const wave = 0.6 * Math.sin(t * 2.4 + k * 0.7);
      const depth = Math.max(1.5, TW * fill + (fill < 1 ? wave : 0));
      wedgePath(g, CX, CY, RT_OUT - depth, RT_OUT, ac - TAU / M / 2 + 0.003, ac + TAU / M / 2 - 0.003);
      g.fillStyle = mix(HERON, WATER_L, 0.15 + 0.25 * fill + 0.4 * endK); g.fill();
    }
    // the tank walls between the 120
    g.lineWidth = 1.2; g.strokeStyle = alpha(BG, 0.6);
    for (let k = 0; k < M; k++) { const a = k * TAU / M, [x0, y0] = pt(RT_IN, a), [x1, y1] = pt(RT_OUT, a); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
    ring(g, CX, CY, RT_OUT + 1, 2, alpha(HERON, 0.7));
    ring(g, CX, CY, RT_IN - 1, 2, alpha(HERON, 0.45));
  }

  function drawPipes(s, g, t) {
    for (let n = 1; n <= 12; n++) {
      const am = hA(n), [x0, y0] = pt(RJ0 + 4, am), [x1, y1] = pt(RT_OUT + 2, am);
      seg(g, x0, y0, x1, y1, 13, "#091114");
      seg(g, x0, y0, x1, y1, 5, mix(HERON, BG, 0.45));
    }
    for (const sl of s.slugs) {
      const am = hA(sl.h), p = clamp((s.t - sl.t0) / P, 0, 1);
      const r = lerp(RJ0 + 4, RT_OUT + 2, p);
      const [x0, y0] = pt(RJ0 + 4, am), [xh, yh] = pt(r, am), [xt, yt] = pt(Math.min(RJ0 + 4, r + 16), am);
      const fade = sl.in ? 1 - clamp((s.t - sl.arr) / 0.8, 0, 1) : 1;
      g.globalAlpha = fade;
      seg(g, x0, y0, xh, yh, 5, alpha(WATER, 0.75));
      if (!sl.in) { glow(g, xh, yh, 22, WATER_L, 0.45); seg(g, xt, yt, xh, yh, 10, sl.fast ? "#f3d2bd" : WATER_L); }
      g.globalAlpha = 1;
    }
  }

  function drawHollow(s, g, t, sun, mins, endK) {
    const sky0 = mix("#0b1220", "#f6ecc9", sun), sky1 = mix("#131c2b", "#cfdcc6", sun);
    const gr = g.createRadialGradient(CX, CY, 0, CX, CY, RF);
    gr.addColorStop(0, sky0); gr.addColorStop(1, sky1);
    g.beginPath(); g.arc(CX, CY, RF - 1, 0, TAU); g.fillStyle = gr; g.fill();
    // the far end wall in terraces, climbing to the axis
    for (let i = 1; i <= 12; i++) ring(g, CX, CY, RF * (1 - i / 13.5), 1.4, alpha(sun > 0.5 ? "#5d6b55" : "#8fa0b8", 0.14 + 0.08 * (i % 2)));
    if (sun < 0.6) {
      const r0 = makeRng(51);
      g.globalAlpha = clamp((0.6 - sun) * 2.5, 0, 1);
      for (let i = 0; i < 70; i++) { const r = RF * (0.12 + 0.85 * Math.sqrt(r0())), a = r0() * TAU, [x, y] = pt(r, a); disc(g, x, y, 1.4 + r0(), LAMPC); }
      g.globalAlpha = 1;
    }
    // the sunline, end-on: a point at the axis, coming up for the day
    glow(g, CX, CY, 50 + 120 * sun, "#fff3c4", 0.3 + 0.5 * sun);
    disc(g, CX, CY, 3 + 5 * sun, "#fffdf0");
    // the gauges: the time, and how long the drum takes to turn
    fillRR(g, CX - 122, CY + 40, 244, 112, 18, alpha(INK, 0.82));
    mono(g, fmtClock(mins), CX, CY + 98, 54, PAPER);
    const dev = s.turn - 110;
    const tc = dev > 0.03 ? HOT : dev > 0.008 ? WARM : dev < -0.004 ? WATER : alpha(PAPER, 0.8);
    mono(g, s.turn.toFixed(3) + " s a turn", CX, CY + 134, 23, tc);
    if (endK > 0) {
      g.globalAlpha = endK;
      sign(g, "THE TIDE IS IN", CX, CY - 92, 46, INK, "center", 800);
      g.globalAlpha = 1;
    }
  }

  function drawDials(s, g, t) {
    for (let n = 1; n <= 12; n++) {
      const [x, y] = dialAt(n);
      // the train being weighed now: boarding, or gone and waiting on late water
      let tr = boarding(s, n);
      if (!tr) for (const c of s.trains) if (c.h === n && c.gone && !c.res) { tr = c; break; }
      const fl = s.flash[n];
      disc(g, x, y, DR + 16, alpha(BG, tr ? 0.86 : 0.42));
      ring(g, x, y, DR, 9, alpha(PAPER, tr ? 0.16 : 0.08));
      if (tr) {
        const k = clamp((t - tr.s0) / tr.B, 0, 1), fn = (tr.B - P) / tr.B;
        const sent = !!tr.slug, pastTrim = !sent && t > tr.D - P + 0.25;
        // the water's two seconds: from the notch to the top
        arcF(g, x, y, DR + 11, fn, 1, 5, alpha(WATER, 0.95));
        // boarding
        const fc = pastTrim ? mix(WARM, HOT, smooth(0, 0.6, t - (tr.D - P + 0.25))) : WARM;
        arcF(g, x, y, DR, 0, k, 9, fc);
        // the notch: send now
        const na = fn * TAU, c = Math.cos(na), sn = Math.sin(na);
        const pulse = sent ? 0 : 1 - smooth(0, 0.6, Math.abs(t - (tr.D - P)));
        seg(g, x + sn * (DR - 9), y - c * (DR - 9), x + sn * (DR + 17 + pulse * 5), y - c * (DR + 17 + pulse * 5), 5 + pulse * 2, PAPER);
        // the water sent: where it set out, and where it will arrive, against the ring
        if (sent) {
          const f0 = (tr.slug.t0 - tr.s0) / tr.B, f1 = (tr.slug.arr - tr.s0) / tr.B, fnow = clamp((t - tr.s0) / tr.B, f0, f1);
          arcF(g, x, y, DR - 13, f0, Math.min(1, f1), 6, alpha(WATER, 0.3));
          arcF(g, x, y, DR - 13, f0, Math.min(1, fnow), 6, WATER_L);
          if (f1 > 1) arcF(g, x, y, DR - 13, 0, Math.min(1, f1 - 1), 6, alpha(HOT, t > tr.D ? 0.9 : 0.5));
        }
        sign(g, String(n), x, y + 12, 34, PAPER, "center", 800);
      } else {
        sign(g, String(n), x, y + 12, 34, alpha(PAPER, 0.3), "center", 800);
      }
      if (fl) {
        const e = fl.t / 1.2, col = fl.pts >= 1 ? WATER_L : fl.pts > 0 ? PAPER : HOT;
        g.globalAlpha = 1 - e;
        ring(g, x, y, DR + 14 + 34 * easeOut(e), 7 * (1 - e) + 1, col);
        g.globalAlpha = 1;
      }
    }
  }

  function draw(s, g, ctx) {
    const t = s.t, mins = 420 + 180 * clamp(t / DAY, 0, 1), sun = sunLevel(mins);
    const endK = s.phase === "end" ? smooth(0, 0.6, s.endT) : 0;
    felt(g, BG);
    g.save();
    if (s.wob > 0.01 && !ctx.reduced) {
      const k = s.wob;
      g.translate(CX, CY); g.rotate(k * 0.011 * Math.sin(t * 31)); g.translate(-CX + k * 5 * Math.sin(t * 47), -CY + k * 3 * Math.cos(t * 41));
    }
    drawOutside(s, g, t);
    drawJacket(g, s, t);
    drawWedges(s, g, t, sun);
    drawTanks(s, g, t, endK);
    drawPipes(s, g, t);
    drawHollow(s, g, t, sun, mins, endK);
    drawDials(s, g, t);
    s.parts.draw(g);
    for (const n of s.notes.a) {
      const k = n.t / n.life, y = n.y - n.rise * easeOut(k);
      g.globalAlpha = 1 - k * k;
      sign(g, n.text, n.x + 2, y + 3, n.size, alpha(INK, 0.75), "center", 800);
      sign(g, n.text, n.x, y, n.size, n.col, "center", 800);
    }
    g.globalAlpha = 1;
    g.restore();
  }

  // The house plays: tap each boarding Hour as its ring reaches the notch.
  function bot(s, b, ctx) {
    const sk = ctx.skill;
    if (s.botGap > 0) s.botGap--;
    let due = null, next = null;
    for (const tr of s.trains) {
      if (!tr.on || tr.gone || tr.slug || tr.botSkip) continue;
      if (tr.botAt === undefined) {
        tr.botAt = Math.max(tr.s0 + 0.1, tr.D - P + (1 - sk) * 0.9 * ctx.rng.gauss() * 0.75);
        // a newcomer loses track of one now and then in the rush
        let busy = 0; for (const c of s.trains) if (c.on && !c.gone && c !== tr) busy++;
        tr.botSkip = busy > 0 && ctx.rng() < (1 - sk) * 0.3;
        if (tr.botSkip) continue;
      }
      if (s.t >= tr.botAt && !due) due = tr;
      if (!next || tr.botAt < next.botAt) next = tr;
    }
    const aim = due || next;
    if (aim) { const [x, y] = dialAt(aim.h); b.x = x; b.y = y; }
    else { b.x = 500; b.y = 560; }
    if (due && s.botGap <= 0) { b.tap = true; s.botGap = 3; }
  }

  registerEvent({
    id: "heron", hour: 2, name: "The Tide",
    place: "The tide tanks, decks 186 and 187, all the way round · 0.75 g",
    intro: "Every morning forty-five million Sorrelers glide out to work through the rim, and with them gone the drum would slow. So Heron pumps the same weight of water in from the moat to the tanks at mid-drum, a slug for every train. The water takes two seconds to climb, so it has to go before the train does.",
    how: "Tap an Hour when its boarding ring reaches the notch. The water climbs for two seconds and lands as the train lets go.",
    keys: "number keys for the Hours: 1 to 9, then 0, minus and equals for Ten, Eleven and Twelve",
    marks: [55, 75, 90], unit: "trim", fmt: (v) => Math.round(v) + "%",
    result: (s) => "Trim for " + s.score + "% of the tide",
    create, update, draw, bot,
  });
})();
