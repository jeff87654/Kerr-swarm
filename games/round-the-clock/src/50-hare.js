/* ---------- Hare: The Long Stair ----------
   Hare trains the drum's midwives and races stairs: every block has a stair race, every naming ends in a
   run. On Hare's day the Hour races its longest stair, a core stair from the roof of the Keel (deck 16,
   0.98 g) to the floor of the Hollow (deck 376, 0.50 g): 360 decks, 1,440 m of climb.
   The race is time-lapsed: 64 bounds, about 5.6 decks a bound. A bound at weight fraction gf hangs
   T = 0.40 / sqrt(gf) seconds, 0.40 s at the bottom and 0.57 s at the top, so the rhythm has to slow
   as you rise. Tap as each foot lands. */
"use strict";
(function () {
  const N = 64;                              // bounds from deck 16 to deck 376
  const D0 = 16, D1 = 376;
  const TR = 35, RS = 22, PER = 4;           // a tread: run and rise in stage units; treads per bound
  const RX = TR * PER, RY = RS * PER;        // one bound across and up
  const JT = N * PER;                        // the last tread: the Hollow floor
  const FLIGHT = 4;                          // bounds between landings
  const AX = 470, AY = 650;                  // where the runner's feet sit on the stage
  const H = 150;                             // the runner's height
  const BAND = 118;                          // depth of the stair's side face
  const WIN = 0.21;                          // the clean window, as a fraction of the bound's hang
  const GRACE = 0.1, STUMBLE = 0.45, WAITMAX = 0.9, SET = 0.7, END = 1.9;
  const LIGHT = "#fff3d6";

  const deckAt = (k) => D0 + (D1 - D0) * k / N;
  const gfAt = (k) => gFrac(deckR(deckAt(clamp(k, 0, N))));
  const hang = (k) => 0.40 / Math.sqrt(gfAt(k));
  const hopH = (k) => 30 / Math.pow(gfAt(k), 1.6);       // the arc grows as the weight drops
  const PX = (k) => k * RX, PY = (k) => -k * RY;
  const treadY = (j) => -clamp(j, -9999, JT) * RS;
  const lineY = (x) => -clamp(x / TR, -9999, JT) * RS;  // the stair's slope, smoothed
  const bandOf = (d) => (d <= 113 ? 0 : d <= 301 ? 1 : d < 376 ? 2 : 3);

  // Rivals run fixed schedules: their hang at each bound times a factor that depends on how high they are.
  const RIVALS = [
    { n: 7, tag: "STAG", f: (u) => 0.95 + 0.36 * u * u },     // a Stag heavy: strong low, fades high
    { n: 1, tag: "HARE", f: (u) => 1.08 - 0.10 * u, house: true }, // the house champion: light at the top
    { n: 11, tag: "WOLF", f: () => 1.12 },                    // a Wolf crew runner: steady
  ];

  function fmtRace(t) { const m = Math.floor(t), sec = Math.floor((t - m) * 60); return m + ":" + pad2(sec); }

  function create(ctx) {
    const riv = RIVALS.map((R, i) => {
      const cum = [0];
      for (let k = 0; k < N; k++) cum.push(cum[k] + hang(k) * R.f(k / N));
      return { n: R.n, tag: R.tag, house: !!R.house, cum, lane: i };
    });
    return {
      t: 0, phase: "start", startT: 0, endT: 0,
      k: 0, st: "air", tb: 0, T: hang(0), W: WIN * hang(0), tapped: null,
      waitT: 0, stT: 0, sq: 0, lift: 0, shake: 0,
      clean: 0, streak: 0, bestStreak: 0, soon: 0, late: 0, judged: 0, score: 0, done: false,
      raceT: 0, finishT: 0, place: 1,
      camX: PX(0), camY: PY(0),
      dust: new Parts(220), fx: new Parts(160), notes: new Notes(),
      said: 0, riv, botK: -1, botAt: 0, botTapped: false,
    };
  }

  // where the runner's feet are, in world units, with and without the hop
  function feet(s) {
    if (s.phase === "start") return [PX(0), PY(0), PX(0), PY(0)];
    if (s.phase === "out") return [PX(N), PY(N), PX(N), PY(N)];
    const k = s.k;
    if (s.st === "air") {
      const p = clamp(s.tb / s.T, 0, 1);
      const bx = lerp(PX(k), PX(k + 1), p), by = lerp(PY(k), PY(k + 1), p);
      return [bx, by - hopH(k) * 4 * p * (1 - p), bx, by];
    }
    return [PX(k + 1), PY(k + 1), PX(k + 1), PY(k + 1)];
  }
  const progressOf = (s) => (s.phase === "start" ? 0 : s.phase === "out" ? N : s.k + (s.st === "air" ? clamp(s.tb / s.T, 0, 1) : 1));

  function rivalQ(r, t) {
    const c = r.cum;
    if (t >= c[N]) return N;
    let k = 0;
    while (k < N - 1 && c[k + 1] <= t) k++;
    return k + clamp((t - c[k]) / (c[k + 1] - c[k]), 0, 1);
  }

  function headPt(s) {
    const f = feet(s);
    return [f[0] + AX - s.camX, f[1] + AY - s.camY - H - 30];
  }

  function puff(s, x, y, n, k, dark) {
    const gf = gfAt(s.k + 1);
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1;
      s.dust.add({ x: x + side * (6 + (i * 7) % 16), y: y - 4, vx: side * (30 + ((i * 37) % 50)) * k, vy: -(26 + ((i * 53) % 40)) * k,
        g: 140 * gf, drag: 2.2, life: 0.45 + 0.35 / gf, r: 7 + (i % 3) * 2, col: dark ? shade(PAPER, -0.35) : PAPER, a: dark ? 0.55 : 0.42, grow: 1.2 });
    }
  }

  // the foot touches the step at the end of bound s.k
  function touchdown(s, ctx) {
    s.sq = 1;
    puff(s, PX(s.k + 1), PY(s.k + 1), 4, 1, false);
    const kf = s.k + 1;
    if (kf % FLIGHT === 0 && kf < N) {                   // passing a landing: the deck makes a noise for you
      const b = bandOf(deckAt(kf));
      if (b === 0) ctx.sfx.cheer(0.45); else if (b === 1) ctx.sfx.clap(3); else ctx.sfx.clap(2);
    }
    if (s.k === N - 1) s.finishT = s.raceT - Math.max(0, s.tb - s.T);
  }

  function judgeClean(s, ctx) {
    s.clean++; s.streak++; s.judged++; s.score = s.clean;
    s.bestStreak = Math.max(s.bestStreak, s.streak);
    ctx.sfx.step(); ctx.sfx.chime((s.streak - 1) % 11);
    const hp = headPt(s);
    if (s.streak % 10 === 0) { s.notes.add(s.streak + " clean", hp[0], hp[1] - 20, { good: true, size: 52, life: 1.0, col: s.pal.b }); ctx.sfx.great(); }
    else s.notes.add(s.streak >= 3 ? String(s.streak) : "clean", hp[0], hp[1], { good: true, size: 44, life: 0.6, rise: 54 });
  }

  function launch(s, ctx, carry) {
    s.k++;
    s.st = "air"; s.tb = carry || 0; s.T = hang(s.k); s.W = WIN * s.T; s.tapped = null; s.lift = 1;
    const d = deckAt(s.k);
    if (s.said === 1 && d >= 114) { s.said = 2; ctx.say("The Middle decks, " + fmtG(gfAt(s.k)) + ". Lighter now: let each stride hang.", 3.2); }
    if (s.said === 2 && d >= 302) { s.said = 3; ctx.say("The High decks, six-tenths of a g. Slower still. Don't hurry it.", 3.2); }
  }

  // bound s.k is over: the next one, or out into the Hollow
  function next(s, ctx, carry) {
    if (s.k >= N - 1) {
      s.phase = "out"; s.endT = 0;
      if (!s.finishT) s.finishT = s.raceT;
      s.place = 1 + s.riv.filter((r) => r.cum[N] < s.finishT).length;
      ctx.sfx.cheer(1.2); ctx.sfx.bell(12);
      ctx.say("Half a g. Out into the Hollow.", 2.6);
      return;
    }
    launch(s, ctx, carry);
  }

  function update(s, dt, inp, ctx) {
    s.t += dt; s.pal = ctx.pal;
    s.dust.update(dt); s.fx.update(dt); s.notes.update(dt);
    s.sq = Math.max(0, s.sq - dt / 0.17); s.lift = Math.max(0, s.lift - dt / 0.12); s.shake = Math.max(0, s.shake - dt * 4);

    const f = feet(s), ease = 1 - Math.exp(-dt * 7);
    s.camX += (f[2] - s.camX) * ease; s.camY += (f[3] - s.camY) * ease;
    const prog = progressOf(s), d = Math.round(deckAt(prog));
    ctx.hud.set("Deck " + d + "\n" + fmtG(gfAt(prog)), s.clean + " clean");

    if (s.phase === "start") {
      if (s.said === 0) { s.said = 1; ctx.say("Deck 16, the roof of the Keel, 0.98 g. Tap as each foot lands.", 3.4); }
      s.startT += dt;
      if (s.startT >= SET) {
        s.phase = "run"; s.st = "air"; s.tb = 0; s.T = hang(0); s.W = WIN * s.T; s.lift = 1;
        ctx.sfx.bell(7); ctx.sfx.whoosh(0.6);
        s.notes.add("go", AX + 20, AY - H - 60, { good: true, size: 64, life: 0.8 });
        puff(s, PX(0), PY(0), 6, 1.3, false);
      }
      return;
    }

    if (s.phase === "out") {
      s.endT += dt;
      if (s.endT > 0.3 && s.endT - dt <= 0.3) {
        for (let i = 0; i < 30; i++) {
          const x = ctx.rng.range(40, 960);
          s.fx.add({ x, y: ctx.rng.range(150, 230), vx: ctx.rng.range(-30, 30), vy: ctx.rng.range(-60, 20), g: 70, drag: 0.8, life: ctx.rng.range(1.6, 2.6), r: ctx.rng.range(4, 8), col: i % 2 ? ctx.pal.a : ctx.pal.b, a: 0.95 });
        }
      }
      if (s.endT >= END) s.done = true;
      return;
    }

    // --- the race ---
    s.raceT += dt; s.tb += dt;
    const tap = inp.pressed, T = s.T, W = s.W;
    if (s.st === "air") {
      if (tap && s.tb > GRACE && !s.tapped) {
        if (s.tb < T - W) {
          s.tapped = "soon"; s.soon++;
          const hp = headPt(s);
          s.notes.add("too soon", hp[0], hp[1], { good: false, size: 42, life: 0.9, col: "#f2a283" });
          ctx.sfx.miss();
        } else s.tapped = "clean";          // the foot is nearly down: it springs the moment it lands
      }
      if (s.tb >= T) {
        touchdown(s, ctx);
        if (s.tapped === "clean") { judgeClean(s, ctx); next(s, ctx, s.tb - T); }
        else if (s.tapped === "soon") {
          s.st = "stumble"; s.stT = 0; s.streak = 0; s.judged++; s.shake = ctx.reduced ? 0 : 1;
          ctx.sfx.thud(0.7); puff(s, PX(s.k + 1), PY(s.k + 1), 8, 1.4, true);
        } else s.st = "down";
      }
    } else if (s.st === "down") {
      if (tap) { judgeClean(s, ctx); next(s, ctx, 0); }
      else if (s.tb >= T + W) {
        s.late++; s.streak = 0; s.judged++;
        const hp = headPt(s);
        s.notes.add("late", hp[0], hp[1], { good: false, size: 42, life: 0.9, col: shade(s.pal.a, 0.25) });
        ctx.sfx.thud(0.35);
        if (s.k >= N - 1) next(s, ctx, 0); else { s.st = "wait"; s.waitT = 0; }
      }
    } else if (s.st === "wait") {
      s.waitT += dt;
      if (tap || s.waitT >= WAITMAX) next(s, ctx, 0);
    } else if (s.st === "stumble") {
      s.stT += dt;
      if (s.stT >= STUMBLE) next(s, ctx, 0);
    }
  }

  /* ---------- drawing ---------- */

  // a bounding stride: p runs 0..1 through the bound; lead says which leg reaches for the step
  function boundPose(p, lead) {
    const a = smooth(0, 0.42, p), b = smooth(0.42, 1, p), c = smooth(0, 0.3, p), e = smooth(0.3, 1, p);
    const L = [lerp(lerp(-0.25, 1.1, a), 0.32, b), lerp(lerp(-0.5, -1.7, a), -0.12, b)];
    const Tr = [lerp(lerp(0.25, -0.75, c), -0.35, e), lerp(lerp(-0.2, -0.35, c), -1.5, e)];
    const fwd = [lerp(-0.5, 1.0, smooth(0, 0.5, p)), lerp(0.8, 1.5, p)];
    const back = [lerp(0.6, -0.8, smooth(0, 0.5, p)), lerp(1.2, 0.7, p)];
    return lead ? { legs: [Tr, L], arms: [fwd, back] } : { legs: [L, Tr], arms: [back, fwd] };
  }

  function drawWall(g, pal, ox, oy, prog) {
    const wall = mix(shade(pal.a, -0.7), shade(pal.a, -0.42), smooth(0, 1, prog));
    g.fillStyle = wall; g.fillRect(-20, -20, SW + 40, SH + 40);
    // pilasters, so the climb shows even between landings
    const pc = shade(wall, -0.18), step = 290;
    const i0 = Math.floor((-ox - 60) / step), i1 = Math.ceil((-ox + SW + 60) / step);
    for (let i = i0; i <= i1; i++) { g.fillStyle = pc; g.fillRect(i * step + ox, -20, 34, SH + 40); }
    // the Hollow's light, coming down the stair from the top
    const tx = PX(N) + ox + 160, ty = PY(N) + oy - 140;
    const near = smooth(0.55, 1, prog);
    if (near > 0) glow(g, tx, ty, 520 + 500 * near, LIGHT, 0.55 * near);
  }

  function drawFloor(g, s, pal, kf, ox, oy) {
    const fx = PX(kf) + ox, fy = PY(kf) + oy, d = Math.round(deckAt(kf)), band = bandOf(deckAt(kf));
    const r = makeRng(kf * 131 + 17), t = s.t;
    // the floor slab of this deck, running back from where the stair meets it
    g.fillStyle = shade(pal.a, -0.5); g.fillRect(-20, fy, fx + 1000, 30);
    g.fillStyle = shade(pal.a, -0.2); g.fillRect(-20, fy, fx + 1000, 6);
    if (band === 3) { drawTop(g, s, pal, fx, fy); return; }
    // the deck's number, painted big on the shaft wall
    sign(g, "DECK", fx + 40, fy - 300, 34, alpha(pal.b, 0.26), "center", 700);
    sign(g, String(d), fx + 40, fy - 188, 128, alpha(pal.b, 0.2), "center", 800);
    mono(g, fmtG(gFrac(deckR(d))), fx + 40, fy - 146, 30, alpha(pal.b, 0.32));
    const dx = fx - 250;
    // a lit doorway onto the deck
    glow(g, dx, fy - 90, 190, LIGHT, 0.22);
    fillRR(g, dx - 58, fy - 196, 116, 196, 12, mix(LIGHT, pal.b, 0.3));
    fillRR(g, dx - 58, fy - 26, 116, 26, 0, alpha(pal.a, 0.18));
    lamp(g, fx - 110, fy - 236, 9, "#ffe6b0", 6);
    const cols = [pal.a, pal.b, pal.aL, PAPER, shade(pal.a, -0.25), "#c9d3d6"];
    if (band === 0) {
      // Low decks: families out on the landing, the children yelling
      for (let i = 0; i < 9; i++) {
        const bx = fx - 430 + i * 46, by = fy - 236 + 10 * Math.sin(i * 0.7);
        poly(g, [bx, by, bx + 34, by + 4, bx + 15, by + 38], i % 2 ? pal.a : pal.b);
      }
      seg(g, fx - 440, fy - 236, fx - 20, fy - 236, 2, alpha(pal.b, 0.5));
      if (kf === 0) {
        fillRR(g, fx - 330, fy - 300, 160, 50, 6, alpha(INK, 0.75)); sign(g, "START", fx - 250, fy - 263, 32, pal.b, "center", 800);
      }
      const xs = [fx - 400, fx - 340, fx - 290, fx - 200, fx - 150, fx - 95];
      for (let i = 0; i < xs.length; i++) {
        const p = someone(kf * 7 + i, cols), child = i % 2 === 1 || i === 4;
        const cheer = child || r() < 0.4;
        person(g, xs[i], fy + 2, child ? 82 * p.hk : 116 * p.hk, { shirt: p.shirt, skin: p.skin, hair: p.hair, child, pose: cheer ? "cheer" : "wave", t: t * (child ? 1.3 : 0.9) + p.ph });
      }
    } else if (band === 1) {
      // Middle decks: workers stepping out of the shops to watch
      const words = ["MENDING", "LIDS", "LAMPS", "CHAIRS", "BATHS", "THREAD", "SOUP", "CABS"];
      for (let i = 0; i < 6; i++) fillRR(g, dx - 78 + i * 26, fy - 232, 26, 30, 0, i % 2 ? pal.a : pal.b);  // the awning
      fillRR(g, dx - 84, fy - 300, 168, 50, 6, alpha(INK, 0.75));
      sign(g, words[(kf / FLIGHT) % words.length], dx, fy - 263, 30, pal.b, "center", 800);
      const xs = [fx - 410, fx - 330, fx - 160, fx - 92];
      const poses = ["hands", "stand", "wave", "hands"];
      for (let i = 0; i < xs.length; i++) {
        const p = someone(kf * 7 + i, cols);
        person(g, xs[i], fy + 2, 116 * p.hk, { shirt: p.shirt, skin: p.skin, hair: p.hair, pose: poses[(i + kf) % 4], t: t * 0.8 + p.ph });
      }
    } else {
      // High decks: the elders, who went up at about a hundred, clapping slowly
      fillRR(g, fx - 440, fy - 46, 150, 12, 4, shade(pal.a, -0.1));
      seg(g, fx - 425, fy - 40, fx - 425, fy, 6, shade(pal.a, -0.3)); seg(g, fx - 305, fy - 40, fx - 305, fy, 6, shade(pal.a, -0.3));
      const sitter = someone(kf * 7 + 9, cols);
      person(g, fx - 365, fy + 2, 108, { shirt: sitter.shirt, skin: sitter.skin, old: true, pose: "sit", t: t });
      const xs = [fx - 250, fx - 170, fx - 95];
      for (let i = 0; i < xs.length; i++) {
        const p = someone(kf * 7 + i, cols), h = 108 * p.hk, x = xs[i], cy = fy + 2 - 0.6 * h;
        const gap = 3 + 13 * (0.5 + 0.5 * Math.cos(t * TAU * 0.8 + p.ph * 6));
        person(g, x, fy + 2, h, { shirt: p.shirt, skin: p.skin, old: true, pose: "stand", handTo: [x - gap, cy], handTo2: [x + gap, cy] });
      }
    }
  }

  // the top: the stair comes out through a pavilion onto the floor of the Hollow
  function drawTop(g, s, pal, fx, fy) {
    glow(g, fx + 200, fy - 140, 420, LIGHT, 0.6);
    fillRR(g, fx + 40, fy - 290, 330, 290, 30, LIGHT);
    g.fillStyle = shade(pal.a, -0.15); g.fillRect(fx + 10, fy - 330, 30, 330); g.fillRect(fx + 370, fy - 330, 30, 330);
    fillRR(g, fx, fy - 366, 410, 46, 8, pal.a);
    sign(g, "THE HOLLOW", fx + 205, fy - 331, 34, pal.b, "center", 800);
    // the finish pennants, strung across the top of the stair
    for (let i = 0; i < 10; i++) pennant(g, fx - 260 + i * 56, fy - 312 + 6 * Math.sin(i * 0.9), 40, 46, pal.a, pal.b, 3 * Math.sin(s.t * 2 + i));
    seg(g, fx - 290, fy - 312, fx + 300, fy - 312, 3, alpha(pal.b, 0.7));
  }

  function drawStair(g, pal, ox, oy) {
    const x0 = -ox - 80, x1 = -ox + SW + 80;
    const j0 = Math.floor(x0 / TR) - 1, j1 = Math.ceil(x1 / TR) + 1;
    const xL = (j) => j * TR - TR / 2 + ox;
    g.beginPath();
    g.moveTo(xL(j0), treadY(j0) + oy);
    for (let j = j0; j <= j1; j++) { const y = treadY(j) + oy; g.lineTo(xL(j), y); g.lineTo(xL(j) + TR, y); }
    const xe = xL(j1) + TR, xs = xL(j0);
    g.lineTo(xe, lineY(xe - ox) + oy + BAND);
    g.lineTo(xs, lineY(xs - ox) + oy + BAND);
    g.closePath(); g.fillStyle = pal.a; g.fill();
    // the Harriers' line painted along the stringer
    seg(g, xs, lineY(xs - ox) + oy + 62, xe, lineY(xe - ox) + oy + 62, 9, alpha(pal.b, 0.3));
    seg(g, xs, lineY(xs - ox) + oy + BAND, xe, lineY(xe - ox) + oy + BAND, 8, alpha(INK, 0.35));
    const riser = shade(pal.a, -0.28), nose = pal.b;
    for (let j = j0; j <= j1; j++) {
      const x = xL(j), y = treadY(j) + oy;
      if (j <= JT) { g.fillStyle = riser; g.fillRect(x, y, 4, RS); }
      g.fillStyle = nose; g.fillRect(x, y, TR, 7);
    }
  }

  function drawRail(g, pal, ox, oy) {
    const x0 = -ox - 100, x1 = -ox + SW + 100, hgt = 104;
    const col = alpha(pal.b, 0.38);
    const p0 = Math.floor(x0 / (TR * 4)), p1 = Math.ceil(x1 / (TR * 4));
    for (let i = p0; i <= p1; i++) { const x = i * TR * 4 + ox, y = treadY(i * 4) + oy; seg(g, x, y, x, y - hgt, 5, col); }
    g.beginPath();
    for (let x = x0; x <= x1; x += 40) { const y = lineY(x) + oy - hgt; if (x === x0) g.moveTo(x + ox, y); else g.lineTo(x + ox, y); }
    g.lineWidth = 9; g.strokeStyle = col; g.stroke();
  }

  function drawRunnerAt(g, x, y, h, o) {
    const sq = o.sq || 0, lift = o.lift || 0;
    g.save(); g.translate(x, y);
    g.scale(1 + 0.12 * sq - 0.03 * lift, 1 - 0.16 * sq + 0.06 * lift);
    person(g, 0, 0, h, o);
    g.restore();
  }

  function runnerOpts(s, pal, ox, oy) {
    const base = { view: "side", face: 1, shirt: pal.b, legs: pal.aD, sash: pal.a, skin: SKINS[3], hair: HAIRS[1], sq: s.sq, lift: s.lift };
    if (s.phase === "start") return Object.assign(base, { legsA: [[0.7, -1.3], [-0.6, -0.4]], arms: [[-0.6, 1.0], [0.7, 1.2]], lean: 0.42 });
    if (s.st === "air") {
      const P = boundPose(clamp(s.tb / s.T, 0, 1), s.k % 2);
      return Object.assign(base, { legsA: P.legs, arms: P.arms, lean: 0.16 });
    }
    if (s.st === "stumble") {
      const k = s.k + 1, nx = PX(k) + TR * 1.4 + ox, ny = treadY(k * PER + 1) + oy;
      const fx = PX(k) + ox, fy = PY(k) + oy;
      const sink = Math.sin(clamp(s.stT / STUMBLE, 0, 1) * Math.PI);
      return Object.assign(base, { legsA: [[0.75, -1.5], [-0.3, -1.0]], arms: [[1.6, 0.2], [-0.4, 0.8]], lean: 0.35 + 0.35 * sink, handTo: [nx - fx, ny - fy] });
    }
    if (s.st === "wait") {
      const br = Math.sin(s.t * 5) * 0.05;
      return Object.assign(base, { legsA: [[0.12, -0.15], [-0.12, -0.2]], arms: [[0.15 + br, 0.35], [-0.1, 0.35]], lean: 0.04 });
    }
    // down: just landed, knees taking it
    return Object.assign(base, { legsA: [[0.4, -0.7], [-0.45, -0.9]], arms: [[-0.4, 1.1], [0.6, 1.2]], lean: 0.24 });
  }

  function drawRing(g, s, pal, ox, oy) {
    if (s.phase !== "run") return;
    const k = s.k, tx = PX(k + 1) + ox, ty = PY(k + 1) + oy - 3;
    const ell = (r, w, col, fill) => {
      g.beginPath(); g.ellipse(tx, ty, r, r * 0.34, 0, 0, TAU);
      if (fill) { g.fillStyle = fill; g.fill(); }
      if (w) { g.lineWidth = w; g.strokeStyle = col; g.stroke(); }
    };
    if (s.st === "air") {
      // the path still to fly, dotted: it grows as you get lighter
      const p0 = clamp(s.tb / s.T, 0, 1), hh = hopH(k);
      for (let i = 1; i <= 7; i++) {
        const p = p0 + (1 - p0) * i / 8;
        const x = lerp(PX(k), PX(k + 1), p) + ox, y = lerp(PY(k), PY(k + 1), p) - hh * 4 * p * (1 - p) + oy - 6;
        disc(g, x, y, 3.5, alpha(pal.b, 0.28));
      }
      const rem = clamp((s.T - s.tb) / s.T, 0, 1), inWin = s.tb >= s.T - s.W;
      if (s.tapped === "clean") { glow(g, tx, ty, 90, LIGHT, 0.6); ell(38, 6, pal.b, alpha(pal.b, 0.7)); return; }
      if (s.tapped === "soon") { ell(38, 5, alpha(INK, 0.6), alpha(INK, 0.25)); return; }
      if (inWin) glow(g, tx, ty, 100, LIGHT, 0.55);
      ell(38, inWin ? 7 : 4, inWin ? LIGHT : alpha(pal.b, 0.5), inWin ? alpha(pal.b, 0.45) : null);
      ell(38 + 170 * rem, 3 + 4 * (1 - rem), alpha(pal.b, 0.25 + 0.65 * (1 - rem)));
    } else if (s.st === "down") {
      glow(g, tx, ty, 110, LIGHT, 0.6);
      ell(38, 7, LIGHT, alpha(pal.b, 0.5));
    } else if (s.st === "wait") {
      const pu = 0.5 + 0.5 * Math.sin(s.waitT * 12);
      ell(44 + 10 * pu, 4, alpha(pal.b, 0.35 + 0.3 * pu));
    }
  }

  function drawRivals(g, s, pal, ox, oy) {
    const me = progressOf(s);
    for (let i = s.riv.length - 1; i >= 0; i--) {
      const r = s.riv[i], q = s.phase === "start" ? 0 : rivalQ(r, s.raceT);
      if (Math.abs(q - me) > 4.5 || q >= N) continue;
      const k = Math.min(N - 1, Math.floor(q)), p = q - k;
      const x = lerp(PX(k), PX(k + 1), p) + ox - 12 * (i + 1), y = lerp(PY(k), PY(k + 1), p) - hopH(k) * 4 * p * (1 - p) + oy - 11 * (i + 1);
      const Hh = HOURS[r.n], dim = 0.38;
      const shirt = shade(r.house ? Hh.a : Hh.a, -dim), sash = shade(r.house ? Hh.b : Hh.b, -dim);
      const P = s.phase === "start" ? { legs: [[0.7, -1.3], [-0.6, -0.4]], arms: [[-0.6, 1.0], [0.7, 1.2]] } : boundPose(p, (k + i) % 2);
      person(g, x, y, H * (0.95 - 0.03 * i), { view: "side", face: 1, shirt, sash, legs: shade(Hh.b, -0.6), skin: shade(SKINS[(i * 2 + 1) % 6], -dim), hair: HAIRS[(i + 2) % 6],
        legsA: P.legs, arms: P.arms, lean: s.phase === "start" ? 0.42 : 0.16 });
    }
  }

  function drawStrip(g, s, pal) {
    const X = 52, Y0 = 826, Y1 = 214;
    const yOf = (d) => lerp(Y0, Y1, clamp((d - D0) / (D1 - D0), 0, 1));
    fillRR(g, 10, 150, 150, 742, 18, alpha(INK, 0.5));
    const bands = [[16, 113, pal.aD, "LOW"], [114, 301, pal.a, "MIDDLE"], [302, 375, pal.aL, "HIGH"]];
    for (const [a, b, col, nm] of bands) {
      g.lineCap = "butt"; seg(g, X, yOf(a), X, yOf(b + 1), 16, col); g.lineCap = "round";
      g.save(); g.translate(26, (yOf(a) + yOf(b + 1)) / 2); g.rotate(-Math.PI / 2);
      sign(g, nm, 0, 8, 22, alpha(PAPER, 0.55), "center", 700); g.restore();
    }
    disc(g, X, yOf(376), 11, LIGHT);
    mono(g, "0.50 g", 85, 186, 22, alpha(PAPER, 0.7));
    mono(g, "0.98 g", 85, 874, 22, alpha(PAPER, 0.7));
    // who is where
    const me = progressOf(s);
    const m = s.riv.map((r) => {
      const q = s.phase === "start" ? 0 : rivalQ(r, s.raceT), Hh = HOURS[r.n];
      return { y: yOf(deckAt(q)), q, tag: r.tag, a: Hh.a, b: Hh.b, lab: shade(lum(Hh.a) > lum(Hh.b) ? Hh.a : Hh.b, 0.3), you: false };
    });
    m.push({ y: yOf(deckAt(me)), q: me, tag: "YOU", a: pal.b, b: pal.a, lab: PAPER, you: true });
    m.sort((u, v) => u.y - v.y);
    let ly = -1e9;
    for (const u of m) { u.ly = Math.max(u.y, ly + 27); ly = u.ly; }
    const over = m[m.length - 1].ly - (Y0 + 14);
    if (over > 0) for (const u of m) u.ly -= over;
    for (const u of m) {
      if (!u.you) { disc(g, X, u.y, 9, u.a); ring(g, X, u.y, 9, 3, u.b); }
      seg(g, X + 14, u.y, X + 26, u.ly - 8, 2, alpha(u.lab, 0.6));
      sign(g, u.tag, X + 30, u.ly, u.you ? 26 : 22, u.you ? PAPER : u.lab, "left", u.you ? 800 : 700);
    }
    const you = m.find((u) => u.you);
    disc(g, X, you.y, 13, pal.b); ring(g, X, you.y, 13, 4, pal.a);
  }

  function drawClock(g, s) {
    const t = s.phase === "out" ? s.finishT : s.raceT;
    fillRR(g, 410, 22, 180, 68, 10, alpha(INK, 0.82));
    sign(g, fmtRace(t), 500, 74, 50, PAPER, "center", 800);
  }

  function drawHollow(g, s, ctx) {
    const pal = ctx.pal, O = HOURS[7], e = s.endT;
    hollowBack(g, { pal, sun: 1, far: O.a, farDots: O.b, horizon: 650, seed: 5 });
    g.fillStyle = shade(pal.b, -0.12); g.fillRect(-20, 800, SW + 40, 240);
    g.fillStyle = shade(pal.b, -0.2); g.fillRect(-20, 800, SW + 40, 8);
    // the stair-head pavilion you came out of
    fillRR(g, 20, 520, 290, 290, 10, pal.a);
    g.beginPath(); g.moveTo(0, 530); g.lineTo(165, 450); g.lineTo(330, 530); g.closePath(); g.fillStyle = pal.aD; g.fill();
    fillRR(g, 105, 600, 120, 210, 14, shade(pal.a, -0.55));
    fillRR(g, 40, 540, 250, 40, 6, pal.b);
    sign(g, "THE LONG STAIR", 165, 571, 28, pal.aD, "center", 800);
    // the finish, and the pennants over it
    g.fillStyle = pal.a; g.fillRect(330, 812, 640, 12);
    seg(g, 315, 300, 980, 300, 3, pal.aD);
    for (let i = 0; i < 12; i++) pennant(g, 345 + i * 54, 300, 40, 50, i % 2 ? pal.a : pal.aD, pal.b, 4 * Math.sin(s.t * 2.2 + i));
    const cols = [pal.a, pal.b, PAPER, pal.aL, shade(pal.a, -0.3), "#c9d3d6"];
    const spots = [[350, 0.9, 1], [405, 0.62, 1], [650, 1, 0], [712, 0.6, 1], [770, 0.98, 0], [835, 1.04, 0], [880, 0.64, 1], [940, 0.96, 0]];
    for (let i = 0; i < spots.length; i++) {
      const [x, hk, child] = spots[i], p = someone(i * 37 + 3, cols);
      person(g, x, 820, 150 * hk, { shirt: cols[(i * 5 + 1) % cols.length], skin: p.skin, hair: p.hair, child: !!child, pose: "cheer", t: s.t * (0.9 + 0.1 * (i % 3)) + i * 0.37 });
    }
    const hop = Math.abs(Math.sin(e * 5.5)) * 26;
    person(g, 520, 830 - hop, 250, { view: "front", pose: "cheer", t: s.t, shirt: pal.b, legs: pal.aD, sash: pal.a, skin: SKINS[3], hair: HAIRS[1] });
    const k = smooth(0.35, 0.8, e);
    g.globalAlpha = k;
    const places = ["FIRST", "SECOND", "THIRD", "FOURTH"];
    sign(g, "UP IN " + fmtRace(s.finishT), 640, 420, 76, alpha(INK, 0.86), "center", 800);
    sign(g, places[s.place - 1] + " UP  ·  " + s.clean + " CLEAN", 640, 474, 36, alpha(INK, 0.7), "center", 700);
    g.globalAlpha = 1;
    s.fx.draw(g);
  }

  function draw(s, g, ctx) {
    const pal = ctx.pal;
    if (s.phase === "out" && s.endT > 0.3) {
      drawHollow(g, s, ctx);
      const w = 1 - smooth(0.3, 0.75, s.endT);
      if (w > 0) { g.fillStyle = alpha(LIGHT, w); g.fillRect(0, 0, SW, SH); }
      drawClock(g, s);
      return;
    }
    const shk = s.shake > 0 ? Math.sin(s.t * 70) * 7 * s.shake : 0;
    const ox = AX - s.camX + shk, oy = AY - s.camY;
    const prog = progressOf(s) / N;
    drawWall(g, pal, ox, oy, prog);
    const kc = Math.round(progressOf(s));
    for (let kf = Math.floor((kc - 6) / FLIGHT) * FLIGHT; kf <= kc + 10; kf += FLIGHT) {
      if (kf < 0 || kf > N) continue;
      const fy = PY(kf) + oy;
      if (fy < -60 || fy > SH + 380) continue;
      drawFloor(g, s, pal, kf, ox, oy);
    }
    drawRail(g, pal, ox, oy);
    drawStair(g, pal, ox, oy);
    // the start line
    if (prog < 0.1) { g.fillStyle = alpha(pal.b, 0.85); g.fillRect(PX(0) - TR / 2 + ox, PY(0) + oy, TR, BAND - 10); }
    g.save(); g.translate(ox, oy); s.dust.draw(g); g.restore();
    drawRivals(g, s, pal, ox, oy);
    drawRing(g, s, pal, ox, oy);
    // the runner's shadow on the step below, then the runner
    const f = feet(s), x = f[0] + ox, y = f[1] + oy;
    const under = treadY(Math.round(f[0] / TR)) + oy, ht = Math.max(0, under - y);
    g.beginPath(); g.ellipse(x, under + 2, 30 * (1 - Math.min(0.6, ht / 300)), 7, 0, 0, TAU); g.fillStyle = alpha(INK, 0.32 * (1 - Math.min(0.7, ht / 260))); g.fill();
    drawRunnerAt(g, x, y, H, runnerOpts(s, pal, ox, oy));
    s.notes.draw(g);
    drawStrip(g, s, pal);
    drawClock(g, s);
    if (s.phase === "out") { g.fillStyle = alpha(LIGHT, smooth(0, 0.3, s.endT)); g.fillRect(0, 0, SW, SH); }
  }

  // The house plays: a tap as each foot lands, with a newcomer's wobble and a newcomer's hurry up high.
  function bot(s, b, ctx) {
    if (s.phase !== "run") return;
    const sk = ctx.skill;
    if (s.botK !== s.k) {
      s.botK = s.k; s.botTapped = false;
      let e = ctx.rng.gauss() * (1 - sk) * 0.13;
      e -= (1 - sk) * 0.6 * (s.T - 0.40);                         // running the top like the bottom
      if (ctx.rng.chance((1 - sk) * 0.08)) e = -ctx.rng.range(0.35, 0.6) * s.T;   // a nervous early tap
      s.botAt = s.T + e;
    }
    if (!s.botTapped && s.st !== "stumble" && s.tb + 1 / 120 >= s.botAt) { b.tap = true; s.botTapped = true; }
    b.x = 500; b.y = 600;
  }

  registerEvent({
    id: "hare", hour: 1, name: "The Long Stair",
    place: "A core stair in Hare, from the roof of the Keel to the floor of the Hollow · deck 16 to deck 376 · 0.98 to 0.50 g",
    intro: "Every Hare block has a stair race, and on Hare's day the Hour runs its longest: 360 decks and 1,440 metres of climb, shown sped up, about six decks a bound. You weigh half as much at the top as at the bottom, so every bound hangs a little longer than the last. Hurry it and you stumble.",
    how: "Tap as each foot lands, when the ring closes on its step. Higher up, the bounds hang longer: wait for them.",
    keys: "Space or Enter to tap",
    marks: [38, 52, 60], unit: "clean", fmt: (v) => String(v),
    result: (s) => "Up in " + fmtRace(s.finishT) + ", " + s.clean + " clean",
    create, update, draw, bot,
  });
})();
