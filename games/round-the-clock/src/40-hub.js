/* ---------- The clock: Sorrel seen end-on, the way no Sorreler ever sees it ----------
   Twelve Hours go round, 30 degrees each, counted spinward (clockwise here) from the bronze plate
   at one, One, Hare. From the outside in: the quay lights, the hydrogen jacket with the sixty Minutes
   cut through it, the Keel, the decks, the Round Arcade on deck 201, the Hollow's floor, and the far
   end wall climbing in terraces to the axis, where the sunline is a point. */
"use strict";

const HUB = { RQ: 461, RJ1: 447, RJ0: 429, RK: 421, RA: 421 * 2200 / 3000, RF: 210.5 };
const LINE_DECKS = [13, 38, 63, 88, 113, 138, 163, 188, 213, 238, 263, 288, 313, 338, 363];
const FLOOR_USE = { lake: [5, 6, 7], orchard: [2, 3, 4], lawn: [8, 9, 10], grounds: [11, 12, 1] };

const Hub = {
  mode: "title", sel: 0, hover: 0, t: 0, pop: new Array(13).fill(0), trains: [], nextTrain: 0.5,

  hourAt(x, y) {
    const dx = x - 500, dy = y - 500, r = Math.hypot(dx, dy);
    if (r < HUB.RF - 4) return -1;
    if (r > HUB.RQ + 26) return 0;
    let a = Math.atan2(dx, -dy); if (a < 0) a += TAU;
    return Math.floor(a / (TAU / 12)) + 1;
  },

  update(dt, inp) {
    this.t += dt;
    if (inp.moved || inp.ptrPressed) this.hover = this.hourAt(inp.x, inp.y);
    if (inp.ptrPressed) {
      const h = this.hover;
      if (h > 0) { if (this.mode === "title") ACTIONS.pick(h); else ACTIONS.hour(h); }
      else if (h === -1 && this.mode === "clock") ACTIONS.round();
    }
    const sweep = this.mode === "title" && !this.sel ? (Math.floor(this.t / 1.1) % 12) + 1 : 0;
    for (let n = 1; n <= 12; n++) {
      const want = n === this.sel ? 16 : n === this.hover ? 8 : n === sweep && this.hover <= 0 ? 5 : 0;
      this.pop[n] = lerp(this.pop[n], want, 1 - Math.exp(-dt * 12));
    }
    // glide trains let go of the quay and fall away on a straight line, which from a turning drum is a curl
    this.nextTrain -= dt;
    if (this.nextTrain <= 0 && !REDUCED_MOTION) { this.nextTrain = 0.5 + Math.random() * 1.4; this.trains.push({ a: Math.floor(Math.random() * 60) * TAU / 60 + TAU / 120, t: 0 }); }
    for (let i = this.trains.length - 1; i >= 0; i--) { const tr = this.trains[i]; tr.t += dt; if (tr.t > 26) this.trains.splice(i, 1); }
  },

  draw(g) {
    const cx = 500, cy = 500, H = HUB, t = this.t;
    felt(g, "#0f1315");
    const mins = sorrelMinutes(), sun = sunLevel(mins);
    const club = Game.st.club;

    // glide trains
    for (const tr of this.trains) {
      const wt = DRUM.W * tr.t * 2.2, r = H.RQ * Math.sqrt(1 + wt * wt), a = tr.a + Math.atan(wt) - wt;
      const x = cx + r * Math.sin(a), y = cy - r * Math.cos(a);
      if (x < -10 || x > 1010 || y < -10 || y > 1010) continue;
      g.globalAlpha = clamp(tr.t * 2, 0, 1) * 0.9; disc(g, x, y, 3.2, "#ffd9a0"); g.globalAlpha = 1;
    }

    // the jacket, with the sixty Minutes cut through it, and the quay lights
    g.beginPath(); g.arc(cx, cy, (H.RJ0 + H.RJ1) / 2, 0, TAU); g.lineWidth = H.RJ1 - H.RJ0; g.strokeStyle = "#31454f"; g.stroke();
    for (let i = 0; i < 60; i++) {
      const a = i * TAU / 60 + TAU / 120, sx = Math.sin(a), sy = -Math.cos(a);
      seg(g, cx + sx * (H.RJ0 - 1), cy + sy * (H.RJ0 - 1), cx + sx * (H.RJ1 + 1), cy + sy * (H.RJ1 + 1), 2.2, "#0f1315");
      disc(g, cx + sx * H.RQ, cy + sy * H.RQ, 2.3, "#f0b56a");
    }

    for (let n = 1; n <= 12; n++) {
      const Hh = HOURS[n], P = PALS[n];
      const gap = 0.012, a0 = (n - 1) * TAU / 12 + gap, a1 = n * TAU / 12 - gap, am = hourAngle(n);
      const pop = this.pop[n], ox = cx + pop * Math.sin(am), oy = cy - pop * Math.cos(am);
      const dim = this.sel && this.sel !== n ? 0.55 : 1;
      g.globalAlpha = dim;
      // the decks, the Keel darker at the rim
      wedgePath(g, ox, oy, H.RF + 15, H.RK, a0, a1); g.fillStyle = Hh.a; g.fill();
      g.save(); wedgePath(g, ox, oy, H.RF + 15, H.RK, a0, a1); g.clip();
      g.beginPath(); g.arc(ox, oy, H.RK - 4.2, 0, TAU); g.lineWidth = 8.4; g.strokeStyle = P.aD; g.stroke();
      g.lineWidth = 1.3; g.strokeStyle = alpha(P.aD, 0.55);
      for (const d of LINE_DECKS) { g.beginPath(); g.arc(ox, oy, H.RK * deckR(d) / 3000, 0, TAU); g.stroke(); }
      // the Round Arcade, in each Hour's second colour
      g.beginPath(); g.arc(ox, oy, H.RA, 0, TAU); g.lineWidth = 7; g.strokeStyle = Hh.b; g.stroke();
      g.restore();
      // the Hollow's floor: lake, orchards, lawns and grounds
      let use = "#b9a26a";
      if (FLOOR_USE.lake.indexOf(n) >= 0) use = "#4f97aa"; else if (FLOOR_USE.orchard.indexOf(n) >= 0) use = "#6f9a4d"; else if (FLOOR_USE.lawn.indexOf(n) >= 0) use = "#9dbb6f";
      wedgePath(g, ox, oy, H.RF, H.RF + 12, a0, a1); g.fillStyle = mix("#1b2a2e", use, 0.35 + 0.65 * sun); g.fill();
      // name and thread
      arcText(g, Hh.name.toUpperCase(), ox, oy, 366, am, 33, P.onA, 800);
      const k = knotsOf(HOUR_IDS[n]);
      for (let i = 0; i < 3; i++) {
        const ka = am + (i - 1) * 0.085, kx = ox + 262 * Math.sin(ka), ky = oy - 262 * Math.cos(ka);
        if (i < k) knot(g, kx, ky, 8.5, Hh.b, lum(Hh.b) > 0.5 ? P.aD : P.aL);
        else ring(g, kx, ky, 6, 2, alpha(P.onA, 0.28));
      }
      if (n === club) { // home: the club's pennant flown outside the hull
        const px = ox + (H.RQ + 9) * Math.sin(am), py = oy - (H.RQ + 9) * Math.cos(am);
        g.save(); g.translate(px, py); g.rotate(am);
        pennant(g, 0, -4, 26, -30, Hh.a, Hh.b, 0);
        g.restore();
      }
      g.globalAlpha = 1;
    }

    // the Hollow: the far end wall in thirty tiers, lighter toward the axis, and the sunline end-on
    const sky0 = mix("#0b1220", "#f4e9c4", sun), sky1 = mix("#131c2b", "#c9d9c2", sun);
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, H.RF);
    gr.addColorStop(0, sky0); gr.addColorStop(1, sky1);
    g.beginPath(); g.arc(cx, cy, H.RF - 1, 0, TAU); g.fillStyle = gr; g.fill();
    for (let i = 1; i <= 14; i++) {
      const r = H.RF * (1 - i / 15.5);
      ring(g, cx, cy, r, 1.4, alpha(sun > 0.4 ? "#5d6b55" : "#8fa0b8", 0.16 + 0.1 * (i % 2)));
    }
    if (sun < 0.5) { // terrace lamps and flyers at the axis
      const r0 = makeRng(77);
      g.globalAlpha = 1 - sun * 2;
      for (let i = 0; i < 90; i++) {
        const r = H.RF * (0.12 + 0.85 * Math.sqrt(r0())), a = r0() * TAU;
        disc(g, cx + r * Math.sin(a), cy - r * Math.cos(a), 1.3 + r0() * 0.9, "#ffd9a0");
      }
      for (let i = 0; i < 5; i++) { const a = t * 0.25 * (i % 2 ? 1 : -1) + i * 1.3, r = 4 + i * 1.6; disc(g, cx + r * Math.sin(a), cy - r * Math.cos(a), 1.2, "#fff6dc"); }
      g.globalAlpha = 1;
    }
    if (sun > 0) { glow(g, cx, cy, 30 + 120 * sun, "#fff3c4", 0.25 + 0.6 * sun); disc(g, cx, cy, 3 + 5 * sun, "#fffdf0"); }
    ring(g, cx, cy, 421 * 75 / 3000, 1, alpha(PAPER, 0.25));

    // what the middle says
    const inkOn = sun > 0.45 ? INK : PAPER;
    if (this.mode === "clock" && EVENTS.round) {
      const hot = this.hover === -1;
      fillRR(g, cx - 104, cy + 44, 208, 66, 12, alpha(INK, hot ? 0.92 : 0.78));
      sign(g, "THE ROUND", cx, cy + 86, 34, PAPER, "center", 800);
      mono(g, "13.8 km, deck 201", cx, cy + 103, 12.5, alpha(PAPER, 0.7));
    } else {
      mono(g, fmtClock(mins), cx, cy + 66, 24, alpha(inkOn, 0.85));
      mono(g, lampWord(mins), cx, cy + 86, 13, alpha(inkOn, 0.65));
    }
    arcText(g, "SPINWARD", cx, cy, 484, 0.52, 15, "#7d8580", 700);
    // a small arrow after the word
    const aa = 0.52 + 0.105, ax = cx + 484 * Math.sin(aa), ay = cy - 484 * Math.cos(aa);
    g.save(); g.translate(ax, ay); g.rotate(aa); poly(g, [0, -5, 11, 0, 0, 5], "#7d8580"); g.restore();
  },
};
