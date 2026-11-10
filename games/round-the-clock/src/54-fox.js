/* ---------- Fox: A Both ----------
   The Second Market, deck 178 (r = 2,292 m, 0.76 g). New mass costs about 25 kWh a kilogram, so almost
   everything in Sorrel is second-hand, and the old things change hands here. Nobody buys. You trade what
   you hold for what a stallholder wants, in a chain, and a good chain is "a both": a swap that both sides
   go home thinking they won. Three markets on one 75 s clock; every bubble is visible, so the way through
   is read backward from the thing you came for. */
"use strict";
(function () {
  const CLOCK = 75;
  const GOLD = "#e7b44a";          // the goal's bunting and ring: kept small
  const LAMPLIGHT = "#ffd98a";
  const MARKETS = [
    { n: 5, len: 3, goal: "kettle", title: "A KETTLE", word: "ONE", rows: [3, 2] },
    { n: 7, len: 4, goal: "flute", title: "A HELIOX FLUTE", word: "TWO", rows: [4, 3] },
    { n: 9, len: 5, goal: "chair", title: "THE OLDEST CHAIR", word: "THREE", rows: [5, 4] },
  ];
  const ROW_Y = [138, 468], CELL_H = 330;
  const HOME = { x: 500, y: 994 }, CARD_DX = 124, CARD_DY = -126, CARD_R = 66;
  const WANT = { x: 168, y: 876, r: 58 };
  const T_OUT = 0.28, T_SWAP = 0.36, T_BACK = 0.28, T_INTRO = 1.6, T_CLEAR = 1.9;

  // each thing's history card, chalked in the market's own hand
  const CARDS = {
    lid: "A lid, four dents, three owners. Its pot went missing years ago.",
    pot: "A pot without its lid. Sabine says it will sit here till Knotnight.",
    kettle: "A kettle, 61 years old. The spout has been soldered back on twice.",
    chair: "A chair, 212 years, five names on its tag. The oldest in the market.",
    stool: "A stool, three legs, one of them newer than the other two.",
    flute: "A heliox flute, 1.2 metres. Sound runs fast in heliox, so the tube runs long.",
    lamp: "A hand lamp, rewired four times. Still a warm white.",
    coat: "A coat, relined three times. Heliox is cold on bare skin.",
    shoes: "Running shoes, resoled five times. Russet laces: a Reds pair.",
    tin: "A tin of the Nine, half full. Every table in Sorrel wants one.",
    crock: "A starter crock. The same sourdough for ninety years, fed every lamp-dawn.",
    cot: "A cot, six babies, all of them grown. The bars are worn smooth.",
    book: "A paper book, 140 years old. Notes in the margins in three hands.",
    sleeves: "Wing-sleeves, wrist to hip. At the Spindle you weigh almost nothing.",
    toy: "A wooden top, painted over by four children in turn.",
  };
  const ALL = Object.keys(CARDS);

  /* ---- the puzzle ---- */
  // A chain from what you hold to the goal, plus decoys: stalls that also want something in the chain
  // (two stalls wanting your lid), stalls that want a decoy's thing (a dead end two deep), and stalls
  // that want something nobody here has. Every table holds a different thing, so read backward from
  // the goal and the chain is the only way through.
  function genMarket(rng, m, start) {
    const M = MARKETS[m];
    const reserved = ["kettle", "flute", "chair", "pot", start];
    const pool = rng.shuffle(ALL.filter((k) => reserved.indexOf(k) < 0).concat(m > 0 ? ["pot"] : []));
    const chain = [start];
    for (let j = 1; j < M.len; j++) chain.push(pool.pop());
    chain.push(M.goal);
    const stalls = [];
    for (let j = 1; j <= M.len; j++) stalls.push({ want: chain[j - 1], orig: chain[j], goal: j === M.len });
    const decoys = [];
    for (let k = 0; k < M.n - M.len; k++) {
      const orig = m === 0 && k === 0 ? "pot" : pool.pop();      // the first market's trap: a pot that wants your lid
      let want;
      if (k === 0) want = start;
      else {
        const r = rng(), tails = decoys.filter((d) => d.orig !== "pot");
        if (r < 0.45) want = chain[rng.int(1, M.len - 1)];
        else if (r < 0.8 && tails.length) want = rng.pick(tails).orig;
        else want = pool.pop() || chain[1];
      }
      const d = { want, orig, goal: false };
      decoys.push(d); stalls.push(d);
    }
    // lay them out in two rows, shuffled
    const order = rng.shuffle(stalls.map((_, i) => i));
    let q = 0;
    M.rows.forEach((c, row) => {
      const w = Math.min(240, 960 / c), x0 = 500 - (w * c) / 2 + w / 2;
      for (let i = 0; i < c; i++) {
        const st = stalls[order[q++]];
        Object.assign(st, { x: x0 + i * w, w, row, y0: ROW_Y[row], item: st.orig, done: false, seed: rng.int(0, 99999), flip: rng.sign(),
          stripe: rng.int(0, 2), shake: 0, happy: -1, no: 0 });
      }
    });
    stalls.sort((a, b) => a.row - b.row || a.x - b.x);
    return stalls;
  }

  // What you would be holding after this trail of swaps.
  const heldOf = (s, stack) => (stack.length ? s.stalls[stack[stack.length - 1]].orig : s.start);
  // The first tap of a shortest way from here to the goal, and how many swaps it takes.
  // A trail can always be walked back: the stall that gave you what you hold will take it back.
  function plan(s) {
    const goal = MARKETS[s.m].goal;
    const q = [{ st: s.stack.slice(), first: -1, d: 0 }], seen = new Set([s.stack.join(",")]);
    while (q.length) {
      const c = q.shift(), held = heldOf(s, c.st);
      if (held === goal) return c;
      const moves = [];
      if (c.st.length) moves.push([c.st[c.st.length - 1], c.st.slice(0, -1)]);
      s.stalls.forEach((st, i) => { if (st.want === held && c.st.indexOf(i) < 0) moves.push([i, c.st.concat(i)]); });
      for (const [i, nst] of moves) {
        const key = nst.join(",");
        if (seen.has(key)) continue;
        seen.add(key); q.push({ st: nst, first: c.first < 0 ? i : c.first, d: c.d + 1 });
      }
    }
    return { first: -1, d: 99 };
  }

  function create(ctx) {
    const s = {
      t: 0, m: 0, phase: "intro", phaseT: 0, clock: CLOCK, endT: 0, win: false,
      start: "lid", held: "lid", stack: [], stalls: null, swaps: 0, mSwaps: 0, par: [], parTotal: 0, streak: 0,
      cleared: 0, bonus: 0, score: 0, done: false,
      anim: null, sel: 0, kb: false, hover: -1, cardPulse: 0, heldShake: 0, saidBack: false, saidNo: false, said0: false,
      parts: new Parts(260), notes: new Notes(),
    };
    newMarket(s, ctx);
    return s;
  }

  function newMarket(s, ctx) {
    s.start = s.held; s.stack = []; s.mSwaps = 0; s.streak = 0;
    s.stalls = genMarket(ctx.rng, s.m, s.start);
    const p = plan(s);
    s.par[s.m] = p.d; s.parTotal += p.d;
    s.phase = "intro"; s.phaseT = 0; s.sel = 0; s.anim = null;
  }

  /* ---- playing ---- */
  function hitStall(s, x, y) {
    for (let i = 0; i < s.stalls.length; i++) {
      const st = s.stalls[i];
      if (x >= st.x - st.w / 2 && x < st.x + st.w / 2 && y >= st.y0 - 6 && y < st.y0 + CELL_H) return i;
    }
    return -1;
  }

  function offer(s, i, ctx) {
    const st = s.stalls[i], top = s.stack.length ? s.stack[s.stack.length - 1] : -1;
    ctx.sfx.tap();
    if (st.done && i === top) { s.anim = { i, back: true, stage: "out", t: 0 }; ctx.sfx.step(); return; }
    if (st.done) { st.shake = 0.35; s.notes.add("settled", st.x, st.y0 + 110, { good: false, size: 34 }); ctx.sfx.tick(); return; }
    if (st.want === s.held) { s.anim = { i, back: false, stage: "out", t: 0 }; ctx.sfx.step(); return; }
    // not what they want: a shake of the head, and nothing else lost but the time
    st.shake = 0.5; st.no = 0.6; s.heldShake = 0.4; ctx.sfx.bad();
    s.notes.add("no thanks", st.x, st.y0 + 128, { good: false, size: 34 });
    if (!s.saidNo) { s.saidNo = true; ctx.say("They only swap for the thing in their bubble.", 2.8); }
  }

  // the moment of the swap itself, when you reach the table
  function commit(s, ctx) {
    const a = s.anim, st = s.stalls[a.i];
    s.swaps++; s.mSwaps++;
    if (a.back) {
      a.give = st.orig; a.take = st.want;
      s.held = st.want; st.item = st.orig; st.done = false; st.happy = -1; s.stack.pop();
      s.streak = 0;
      s.notes.add("swapped back", st.x, st.y0 + 110, { size: 34 });
      ctx.sfx.whoosh(0.5); ctx.sfx.pop();
      return;
    }
    a.give = s.held; a.take = st.orig;
    st.item = s.held; s.held = st.orig; st.done = true; st.happy = 0; s.stack.push(a.i);
    s.streak++;
    s.notes.add("a both", st.x, st.y0 + 104, { size: 46, col: GOLD });
    for (let k = 0; k < 10; k++) s.parts.add({ x: st.x + ctx.rng.range(-50, 50), y: st.y0 + 200, vx: ctx.rng.range(-120, 120), vy: -ctx.rng.range(120, 300), g: 700, life: 0.8, r: ctx.rng.range(3, 6), col: ctx.rng.pick([PAPER, GOLD, ctx.pal.aL]) });
    if (s.held === MARKETS[s.m].goal) {
      s.cleared++;
      ctx.sfx.great(); ctx.sfx.cheer(0.7);
      for (const o of s.stalls) if (!o.done) o.happy = 0;
      for (let k = 0; k < 70; k++) s.parts.add({ x: ctx.rng.range(60, 940), y: ctx.rng.range(-40, 80), vx: ctx.rng.range(-60, 60), vy: ctx.rng.range(60, 220), g: 260, drag: 0.6, life: ctx.rng.range(1.4, 2.4), r: ctx.rng.range(4, 8), col: ctx.rng.pick([PAPER, GOLD, ctx.pal.a, ctx.pal.aL]) });
      if (s.cleared >= 3) {
        if (s.swaps <= s.parTotal + 1) s.bonus = 10;
        s.phase = "end"; s.endT = 0; s.win = true;
        ctx.say(CARDS.chair + " Sit down. Never buy the first chair you sit in.", 3.4);
      } else {
        s.phase = "cleared"; s.phaseT = 0;
        ctx.say(CARDS[s.held], 3);
      }
      s.score = s.cleared * 30 + s.bonus;
      return;
    }
    ctx.sfx.chime(Math.min(10, s.streak + 1));
    const anyone = s.stalls.some((o) => !o.done && o.want === s.held);
    if (!anyone && !s.saidBack) { s.saidBack = true; ctx.say("Nobody here wants that. Tap the stall you just traded with to swap back.", 3.6); }
    else ctx.say(CARDS[s.held], 2.6);
  }

  function stepAnim(s, dt, ctx) {
    const a = s.anim; if (!a) return;
    a.t += dt;
    if (a.stage === "out" && a.t >= T_OUT) { a.stage = "swap"; a.t = 0; commit(s, ctx); }
    else if (a.stage === "swap" && a.t >= T_SWAP) { a.stage = "home"; a.t = 0; }
    else if (a.stage === "home" && a.t >= T_BACK) s.anim = null;
  }
  const busy = (s) => s.anim && s.anim.stage !== "home";

  function update(s, dt, inp, ctx) {
    s.t += dt; s.phaseT += dt;
    s.parts.update(dt); s.notes.update(dt);
    s.cardPulse = Math.max(0, s.cardPulse - dt); s.heldShake = Math.max(0, s.heldShake - dt);
    for (const st of s.stalls) { st.shake = Math.max(0, st.shake - dt); st.no = Math.max(0, st.no - dt); if (st.happy >= 0) st.happy += dt; }
    stepAnim(s, dt, ctx);
    s.score = s.cleared * 30 + s.bonus;
    ctx.hud.set("market " + (s.m + 1) + " of 3\n" + fmtMinSec(Math.ceil(s.clock)), "swaps " + s.swaps);

    if (s.phase === "end") { s.endT += dt; if (s.endT > (s.win ? 2.6 : 1.7)) s.done = true; return; }
    if (s.phase === "intro") {
      if (s.phaseT >= T_INTRO) {
        s.phase = "play"; s.phaseT = 0;
        if (!s.said0) { s.said0 = true; ctx.say("Trade what you hold for what you want. Read the bubbles backward.", 4.5); }
      }
      return;
    }
    if (s.phase === "cleared") {
      if (s.phaseT >= T_CLEAR) { s.m++; newMarket(s, ctx); ctx.sfx.whoosh(1.1); }
      return;
    }

    // --- play ---
    s.clock -= dt;
    if (s.clock <= 0) {
      s.clock = 0; s.phase = "end"; s.endT = 0; s.win = false;
      if (s.anim && s.anim.stage === "out") s.anim = null;
      ctx.sfx.bell(2); ctx.say("The market closes. You go home holding " + articled(s.held) + ".", 3);
      return;
    }
    const n = s.stalls.length;
    if (inp.moved) s.hover = hitStall(s, inp.x, inp.y);
    // the keyboard: a highlight to move, Space to offer
    if (inp.leftPressed || inp.rightPressed || inp.upPressed || inp.dnPressed) {
      if (!s.kb) s.kb = true;
      else if (inp.leftPressed) s.sel = (s.sel + n - 1) % n;
      else if (inp.rightPressed) s.sel = (s.sel + 1) % n;
      else {
        const cur = s.stalls[s.sel], row = inp.upPressed ? 0 : 1;
        if (cur.row !== row) {
          let best = s.sel, bd = 1e9;
          s.stalls.forEach((o, i) => { if (o.row === row && Math.abs(o.x - cur.x) < bd) { bd = Math.abs(o.x - cur.x); best = i; } });
          s.sel = best;
        }
      }
      ctx.sfx.tick();
    }
    if (busy(s)) return;
    if (inp.actPressed) { s.kb = true; offer(s, s.sel, ctx); return; }
    if (inp.ptrPressed) {
      s.kb = false;
      const i = hitStall(s, inp.x, inp.y);
      if (i >= 0) { s.sel = i; offer(s, i, ctx); return; }
      // tap what you hold (or what you came for) to read its card
      if (dist(inp.x, inp.y, HOME.x + CARD_DX, HOME.y + CARD_DY) < 100 || (inp.y > 790 && Math.abs(inp.x - HOME.x) < 70)) {
        s.cardPulse = 0.35; ctx.sfx.pop(); ctx.say(CARDS[s.held], 2.8);
      } else if (dist(inp.x, inp.y, WANT.x, WANT.y) < 95) {
        ctx.sfx.pop(); ctx.say("You came for " + MARKETS[s.m].title.toLowerCase() + ". It wears the bunting.", 2.6);
      }
    }
  }

  const articled = (k) => ({ lid: "a lid", pot: "a pot", kettle: "a kettle", chair: "a chair", stool: "a stool", flute: "a flute", lamp: "a lamp", coat: "a coat",
    shoes: "a pair of shoes", tin: "a tin of the Nine", crock: "a starter crock", cot: "a cot", book: "a book", sleeves: "wing-sleeves", toy: "a top" }[k] || k);

  /* ---- the things: one flat pictogram each, ink with a russet turn, drawn in a 100-unit box ---- */
  function drawThing(g, id, x, y, size, pal) {
    const I = INK, A = pal.a, P = PAPER;
    g.save(); g.translate(x, y); const k = size / 100; g.scale(k, k);
    g.lineCap = "round"; g.lineJoin = "round";
    switch (id) {
      case "lid": {
        g.beginPath(); g.ellipse(0, 18, 40, 36, 0, Math.PI, TAU); g.closePath(); g.fillStyle = I; g.fill();
        fillRR(g, -48, 14, 96, 13, 6, I);
        fillRR(g, -10, -30, 20, 15, 5, A);
        g.beginPath(); g.arc(0, 18, 27, Math.PI * 1.13, Math.PI * 1.4); g.lineWidth = 5; g.strokeStyle = alpha(P, 0.5); g.stroke();
        break;
      }
      case "pot": {
        seg(g, -46, 0, -36, 0, 9, I); seg(g, 36, 0, 46, 0, 9, I);
        fillRR(g, -36, -16, 72, 56, 14, I);
        fillRR(g, -42, -24, 84, 11, 5, A);
        seg(g, -22, -2, -22, 24, 5, alpha(P, 0.4));
        break;
      }
      case "kettle": {
        g.beginPath(); g.arc(0, -10, 27, Math.PI * 1.06, Math.PI * 1.94); g.lineWidth = 8; g.strokeStyle = I; g.stroke();
        poly(g, [-24, 16, -54, -18, -45, -24, -16, 2], I);
        g.beginPath(); g.moveTo(-36, 40); g.quadraticCurveTo(-40, -12, 0, -12); g.quadraticCurveTo(40, -12, 36, 40); g.closePath(); g.fillStyle = I; g.fill();
        disc(g, 0, -15, 8, A);
        fillRR(g, -36, 30, 72, 10, 4, A);
        seg(g, -18, 4, -22, 22, 5, alpha(P, 0.4));
        break;
      }
      case "chair": {
        seg(g, -26, -46, -22, 42, 10, I);                  // back post, down into the back leg
        seg(g, -22, -30, -22, -8, 5, I);
        fillRR(g, -30, -6, 66, 12, 4, I);                  // seat
        seg(g, 30, 4, 30, 42, 9, I);                       // front leg
        seg(g, -22, 26, 30, 26, 5, I);                     // stretcher
        fillRR(g, -20, -15, 54, 10, 4, A);                 // the cushion
        disc(g, -26, -48, 8, A);                           // a worn finial
        break;
      }
      case "stool": {
        seg(g, -22, -8, -36, 42, 9, I); seg(g, 22, -8, 36, 42, 9, I); seg(g, 0, -6, 0, 40, 8, shade(I, 0.25));
        seg(g, -30, 20, 30, 20, 5, I);
        g.beginPath(); g.ellipse(0, -12, 40, 11, 0, 0, TAU); g.fillStyle = I; g.fill();
        g.beginPath(); g.ellipse(0, -15, 32, 6, 0, 0, TAU); g.fillStyle = A; g.fill();
        break;
      }
      case "flute": {
        const px = (u) => -46 + 92 * u, py = (u) => 38 - 76 * u;
        seg(g, px(0), py(0), px(1), py(1), 12, I);
        seg(g, px(0.74), py(0.74), px(0.84), py(0.84), 15, A);
        disc(g, px(1), py(1), 7, A);
        for (let j = 0; j < 6; j++) { const u = 0.14 + j * 0.09; disc(g, px(u), py(u), 3.2, P); }
        disc(g, px(0.92), py(0.92), 3.6, P);
        break;
      }
      case "lamp": {
        g.beginPath(); g.arc(0, -32, 15, Math.PI, TAU); g.lineWidth = 6; g.strokeStyle = I; g.stroke();
        fillRR(g, -18, -24, 36, 44, 9, LAMPLIGHT);
        disc(g, 0, -2, 9, "#fffdf2");
        seg(g, -18, -22, -18, 18, 5, I); seg(g, 18, -22, 18, 18, 5, I);
        fillRR(g, -24, -36, 48, 13, 5, I);
        fillRR(g, -28, 18, 56, 16, 6, I);
        fillRR(g, -28, 18, 56, 5, 2, A);
        break;
      }
      case "coat": {
        poly(g, [-14, -42, 14, -42, 40, -30, 48, 24, 34, 26, 30, -6, 30, 42, -30, 42, -30, -6, -34, 26, -48, 24, -40, -30], I);
        poly(g, [-15, -42, 0, -14, 15, -42], A);
        seg(g, 0, -14, 0, 42, 2.5, alpha(P, 0.35));
        disc(g, 5, -2, 3.6, P); disc(g, 5, 13, 3.6, P); disc(g, 5, 28, 3.6, P);
        break;
      }
      case "shoes": {
        const shoe = (x0, y0, col) => {
          g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0, y0 - 28); g.quadraticCurveTo(x0 + 10, y0 - 33, x0 + 21, y0 - 28);
          g.quadraticCurveTo(x0 + 29, y0 - 14, x0 + 46, y0 - 13); g.quadraticCurveTo(x0 + 62, y0 - 11, x0 + 62, y0); g.closePath();
          g.fillStyle = col; g.fill();
          fillRR(g, x0 - 2, y0 - 5, 66, 9, 4, A);
          seg(g, x0 + 22, y0 - 22, x0 + 30, y0 - 18, 3, P); seg(g, x0 + 26, y0 - 26, x0 + 34, y0 - 21, 3, P);
        };
        shoe(-42, 12, shade(I, 0.28)); shoe(-22, 38, I);
        break;
      }
      case "tin": {
        fillRR(g, -30, -30, 60, 72, 7, I);
        fillRR(g, -34, -40, 68, 14, 5, I);
        seg(g, -28, -24, 28, -24, 2.5, alpha(P, 0.35));
        fillRR(g, -30, -12, 60, 36, 2, A);
        sign(g, "9", 0, 20, 38, P, "center", 800);
        break;
      }
      case "crock": {
        g.beginPath(); g.moveTo(-22, -22); g.quadraticCurveTo(-48, 8, -30, 42); g.lineTo(30, 42); g.quadraticCurveTo(48, 8, 22, -22); g.closePath(); g.fillStyle = I; g.fill();
        poly(g, [-30, -26, -40, -4, -20, -16], A); poly(g, [30, -26, 40, -4, 20, -16], A);
        g.beginPath(); g.ellipse(0, -26, 31, 11, 0, 0, TAU); g.fillStyle = A; g.fill();
        seg(g, -25, -17, 25, -17, 4, P);
        disc(g, -10, 10, 5, alpha(P, 0.5)); disc(g, 9, 22, 4, alpha(P, 0.5)); disc(g, 12, 2, 3, alpha(P, 0.5)); disc(g, -4, 28, 2.5, alpha(P, 0.5));
        break;
      }
      case "cot": {
        fillRR(g, -40, 2, 80, 18, 5, A);
        seg(g, -46, -18, 46, -18, 7, I); seg(g, -46, 24, 46, 24, 7, I);
        for (let bx = -33; bx <= 33; bx += 13.2) seg(g, bx, -18, bx, 24, 4, I);
        seg(g, -47, -32, -47, 42, 9, I); seg(g, 47, -32, 47, 42, 9, I);
        disc(g, -47, -35, 7, A); disc(g, 47, -35, 7, A);
        break;
      }
      case "book": {
        poly(g, [-50, -20, 0, -12, 50, -20, 50, 36, 0, 44, -50, 36], A);
        poly(g, [-46, -28, -3, -19, -3, 35, -46, 28], I);
        poly(g, [46, -28, 3, -19, 3, 35, 46, 28], I);
        for (let j = 0; j < 4; j++) {
          seg(g, -38, -14 + j * 11, -11, -9 + j * 11, 3, alpha(P, 0.45));
          seg(g, 38, -14 + j * 11, 11, -9 + j * 11, 3, alpha(P, 0.45));
        }
        break;
      }
      case "sleeves": {
        poly(g, [-46, -30, 44, -8, 36, 36, 20, 16, 6, 32, -8, 10, -22, 20, -34, -4], I);
        seg(g, -20, -23, -22, 20, 3, alpha(P, 0.35)); seg(g, 2, -17, 6, 32, 3, alpha(P, 0.35)); seg(g, 24, -12, 20, 16, 3, alpha(P, 0.35));
        seg(g, -46, -30, 44, -8, 10, A);
        ring(g, -48, -31, 8, 4, A);
        break;
      }
      case "toy": {
        seg(g, 0, -18, 0, -42, 8, I); disc(g, 0, -45, 7, A);
        g.beginPath(); g.moveTo(-42, -4); g.quadraticCurveTo(0, -32, 42, -4); g.lineTo(4, 38); g.lineTo(-4, 38); g.closePath();
        g.fillStyle = I; g.fill();
        g.save(); g.clip(); g.fillStyle = A; g.fillRect(-46, -4, 92, 11); g.fillStyle = alpha(P, 0.8); g.fillRect(-46, 14, 92, 4); g.restore();
        break;
      }
    }
    g.restore();
  }

  /* ---- drawing ---- */
  function drawHall(g, pal) {
    g.fillStyle = shade(pal.a, -0.66); g.fillRect(0, 0, SW, SH);
    g.fillStyle = shade(pal.a, -0.8); g.fillRect(0, 0, SW, 126);
    // the arcade's arches along the back wall, and its lamps
    for (let i = 0; i < 7; i++) {
      const ax = 70 + i * 143;
      g.beginPath(); g.moveTo(ax - 58, 126); g.lineTo(ax - 58, 70); g.arc(ax, 70, 58, Math.PI, TAU); g.lineTo(ax + 58, 126); g.closePath();
      g.fillStyle = shade(pal.a, -0.72); g.fill();
    }
    for (const lx of [214, 357, 643, 786]) { seg(g, lx, 0, lx, 26, 3, shade(pal.a, -0.5)); lamp(g, lx, 34, 9, LAMPLIGHT, 6); }
    sign(g, "SECOND MARKET", 500, 74, 36, alpha(PAPER, 0.85), "center", 800);
    mono(g, "DECK 178 · 0.76 g", 500, 106, 22, alpha(PAPER, 0.55));
    // the aisles
    for (const ry of ROW_Y) { g.fillStyle = shade(pal.a, -0.58); g.fillRect(0, ry + 304, SW, 26); }
    g.fillStyle = shade(pal.a, -0.5); g.fillRect(0, 798, SW, SH - 798);
    for (let i = 0; i < 9; i++) seg(g, 0, 830 + i * 22 + i * i * 0.6, SW, 830 + i * 22 + i * i * 0.6, 2, alpha(INK, 0.16));
  }

  function awningPath(g, x, y, w) {
    const n = Math.max(4, Math.round(w / 34)), sw = w / n;
    g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x + w / 2, y); g.lineTo(x + w / 2, y + 24);
    for (let i = n - 1; i >= 0; i--) g.quadraticCurveTo(x - w / 2 + (i + 0.5) * sw, y + 44, x - w / 2 + i * sw, y + 24);
    g.closePath();
    return { n, sw };
  }

  function stallScale(s, i) {
    if (s.phase === "intro") return easeBack(clamp((s.phaseT - 0.1 - i * 0.06) / 0.38, 0, 1));
    if (s.phase === "cleared") return 1 - easeIn(clamp((s.phaseT - (T_CLEAR - 0.4)) / 0.34, 0, 1));
    return 1;
  }

  function drawStall(g, s, i, ctx) {
    const pal = ctx.pal, st = s.stalls[i], x = st.x, y = st.y0;
    const sc = stallScale(s, i);
    if (sc <= 0.01) return;
    g.save();
    if (sc !== 1) { g.translate(x, y + 200); g.scale(sc, sc); g.translate(-x, -(y + 200)); }
    const w = Math.min(st.w - 18, 206), flip = st.flip;
    const hx = x - 44 * flip, ix = x + 32 * flip, iy = y + 210;
    const sx = st.shake > 0 ? Math.sin(st.shake * 70) * 8 * (st.shake / 0.5) : 0;
    const cA = st.stripe === 1 ? pal.b : pal.a, cB = st.stripe === 1 ? pal.a : pal.b;
    // poles and the back cloth
    seg(g, x - w / 2 + 6, y + 130, x - w / 2 + 6, y + 312, 7, shade(pal.a, -0.45));
    seg(g, x + w / 2 - 6, y + 130, x + w / 2 - 6, y + 312, 7, shade(pal.a, -0.45));
    fillRR(g, x - w / 2 + 12, y + 150, w - 24, 120, 4, shade(pal.a, -0.32));
    // the stallholder: pleased after a swap, then turned away, done for the day
    const P = someone(st.seed, [PAPER, pal.aLL, "#e5d3bd", "#d9c7a8", "#efe0cf"]);
    const cheering = st.happy >= 0 && st.happy < (st.done ? 0.95 : 1.8);
    const away = st.done && !cheering;
    const o = { shirt: P.shirt, skin: P.skin, hair: P.hair, t: s.t * 0.7 + P.ph };
    if (away) Object.assign(o, { view: "side", face: flip, pose: "stand" });
    else Object.assign(o, { pose: cheering ? "cheer" : st.no > 0 ? "hands" : "stand" });
    person(g, hx + sx, y + 318, 150 * P.hk, o);
    // the table: a white cloth, a skirt in the stall's colours
    fillRR(g, x - w / 2 + 2, y + 254, w - 4, 16, 5, PAPER);
    g.save(); rrect(g, x - w / 2 + 8, y + 266, w - 16, 52, 4); g.clip();
    g.fillStyle = cB; g.fillRect(x - w / 2, y + 266, w, 60);
    for (let k = 0; k < 6; k++) { g.fillStyle = cA; g.fillRect(x - w / 2 + 8 + k * (w - 16) / 5.5, y + 266, (w - 16) / 11, 60); }
    g.restore();
    // its history card, chalked and pinned to the skirt
    fillRR(g, x - 20 * flip - 15, y + 276, 30, 22, 3, PAPER);
    seg(g, x - 20 * flip - 9, y + 284, x - 20 * flip + 9, y + 284, 2, alpha(INK, 0.5)); seg(g, x - 20 * flip - 9, y + 290, x - 20 * flip + 5, y + 290, 2, alpha(INK, 0.5));
    // the goal: a gold ring under what you came for
    if (st.goal && !st.done) {
      glow(g, ix, iy, 92, GOLD, 0.45 + 0.12 * Math.sin(s.t * 4));
      g.beginPath(); g.ellipse(ix, y + 256, 58, 9, 0, 0, TAU); g.fillStyle = alpha(GOLD, 0.8); g.fill();
    }
    // what is on the table (unless it is in the air)
    const a = s.anim, flying = a && a.i === i && a.stage === "swap";
    if (!flying) drawThing(g, st.item, ix, iy, 100, pal);
    // the awning
    const ap = awningPath(g, x, y + 128, w);
    g.save(); g.clip();
    for (let k = 0; k < ap.n; k++) { g.fillStyle = k % 2 ? cB : cA; g.fillRect(x - w / 2 + k * ap.sw, y + 120, ap.sw + 0.5, 60); }
    g.restore();
    fillRR(g, x - w / 2 - 4, y + 122, w + 8, 10, 4, shade(pal.a, -0.45));
    if (st.goal && !st.done) {                                        // bunting: never in doubt
      const nb = 6;
      seg(g, x - w / 2, y + 124, x + w / 2, y + 124, 2, GOLD);
      for (let k = 0; k < nb; k++) pennant(g, x - w / 2 + (k + 0.5) * w / nb, y + 126, w / nb * 0.8, 30, GOLD, k % 2 ? GOLD : shade(GOLD, 0.35), Math.sin(s.t * 3 + k) * 2);
    }
    // the bubble: what they want, drawn big
    const top = s.stack.length ? s.stack[s.stack.length - 1] : -1;
    const bw = Math.min(150, st.w - 36), bh = 112, bx = x + sx * 0.6, by = y + 62 + (st.no > 0 ? Math.sin(st.no * 40) * 3 : 0);
    if (!st.done) {
      const match = s.phase === "play" && st.want === s.held;
      poly(g, [bx - 22 * flip, by + bh / 2 - 4, bx - 2 * flip, by + bh / 2 - 4, hx + 4 * flip, y + 128], PAPER);
      if (match) { rrect(g, bx - bw / 2 - 5, by - bh / 2 - 5, bw + 10, bh + 10, 30); g.fillStyle = pal.aL; g.fill(); }
      fillRR(g, bx - bw / 2, by - bh / 2, bw, bh, 26, PAPER);
      drawThing(g, st.want, bx, by + 2, 90, pal);
      if (st.no > 0) {                                                // a cross: not that
        g.globalAlpha = Math.min(1, st.no * 3);
        seg(g, bx - 32, by - 32, bx + 32, by + 32, 10, alpha(pal.aD, 0.85)); seg(g, bx + 32, by - 32, bx - 32, by + 32, 10, alpha(pal.aD, 0.85));
        g.globalAlpha = 1;
      }
    }
    // done: the stall dims; the last one you traded with will swap back
    if (st.done) {
      g.globalAlpha = cheering ? clamp(st.happy / 0.95, 0, 1) : 1;
      fillRR(g, x - st.w / 2 + 4, y - 4, st.w - 8, CELL_H - 6, 14, alpha(INK, 0.5));
      g.globalAlpha = 1;
      if (i === top && s.phase === "play") {
        const gw = bw * 0.82, gh = bh * 0.82;
        fillRR(g, bx - gw / 2, by - gh / 2, gw, gh, 22, alpha(PAPER, 0.62));
        g.globalAlpha = 0.75; drawThing(g, s.held, bx, by + 2, 70, pal); g.globalAlpha = 1;
        const rx = bx + gw / 2 - 6, ry = by - gh / 2 + 6;
        disc(g, rx, ry, 21, pal.a);
        g.beginPath(); g.arc(rx, ry, 10, Math.PI * 0.15, Math.PI * 1.55); g.lineWidth = 4.5; g.strokeStyle = PAPER; g.lineCap = "round"; g.stroke();
        poly(g, [rx + 10 * Math.cos(Math.PI * 0.15) + 6, ry + 2, rx + 10 * Math.cos(Math.PI * 0.15) - 6, ry + 2, rx + 10 * Math.cos(Math.PI * 0.15), ry + 10], PAPER);
      } else sign(g, "A BOTH", x, y + 76, 30, alpha(GOLD, 0.8), "center", 800);
    }
    // the highlight: the stall under the pointer or the keys
    const hl = s.phase === "play" && (s.kb ? s.sel === i : s.hover === i && !ctx.demo);
    if (hl) { rrect(g, x - st.w / 2 + 4, y - 4, st.w - 8, CELL_H - 6, 14); g.lineWidth = s.kb ? 6 : 4; g.strokeStyle = alpha(PAPER, s.kb ? 0.85 : 0.45); g.stroke(); }
    g.restore();
  }

  // where you stand in front of a stall: further back is smaller
  function standAt(st) { return { x: st.x - 14 * st.flip, y: st.y0 + CELL_H + 6, k: st.row ? 0.84 : 0.7 }; }
  function playerPos(s) {
    const a = s.anim;
    if (!a) return { x: HOME.x, y: HOME.y, k: 1, walk: 0 };
    const p = standAt(s.stalls[a.i]);
    if (a.stage === "swap") return Object.assign(p, { walk: 0 });
    const e = easeInOut(a.t / (a.stage === "out" ? T_OUT : T_BACK));
    const f = a.stage === "out" ? e : 1 - e;
    return { x: lerp(HOME.x, p.x, f), y: lerp(HOME.y, p.y, f), k: lerp(1, p.k, f), walk: 1 };
  }

  function drawCard(g, item, cx, cy, r, ring1, pal, size) {
    disc(g, cx, cy, r, PAPER);
    ring(g, cx, cy, r - 3, 6, ring1);
    if (item) drawThing(g, item, cx, cy + 2, size || r * 1.56, pal);
  }

  function drawPlayer(g, s, ctx) {
    const pal = ctx.pal;
    if (s.phase === "end" && s.win) {
      // the oldest chair in the market, and someone sitting in it
      const k = easeOut(clamp(s.endT / 0.4, 0, 1));
      const cx = 470, fy = 990, seat = fy - 50, W = shade(pal.a, 0.12);
      glow(g, cx, fy - 90, 260, LAMPLIGHT, 0.32 * k);
      g.beginPath(); g.ellipse(cx, fy - 4, 150, 22, 0, 0, TAU); g.fillStyle = alpha(LAMPLIGHT, 0.18 * k); g.fill();
      seg(g, cx - 44, fy, cx - 54, fy - 168, 13, W);                       // the back, tall and a little raked
      seg(g, cx - 50, fy - 150, cx - 47, seat - 4, 6, W); seg(g, cx - 54, fy - 168, cx - 34, fy - 168, 10, W);
      disc(g, cx - 54, fy - 174, 10, pal.aDD);
      seg(g, cx + 44, seat, cx + 44, fy, 11, W);
      fillRR(g, cx - 52, seat - 4, 106, 14, 5, W);
      fillRR(g, cx - 40, seat - 14, 86, 12, 5, pal.aDD);
      const up = (ph) => 2.6 + 0.25 * Math.sin(s.t * 9 + ph);
      person(g, cx - 18, fy, 220, { view: "side", face: 1, pose: "sit", shirt: PAPER, legs: INK, sash: pal.a, skin: SKINS[2], hair: HAIRS[1],
        arms: [[lerp(0.4, up(0), k), 0.2], [lerp(0.3, up(1), k), 0.3]] });
      seg(g, cx - 40, fy - 12, cx + 44, fy - 12, 6, shade(pal.a, 0.12));
      return;
    }
    const p = playerPos(s), a = s.anim, k = p.k;
    const sh = s.heldShake > 0 ? Math.sin(s.heldShake * 60) * 6 : 0;
    const cx = p.x + CARD_DX * k + sh, cy = p.y + CARD_DY * k - (s.cardPulse > 0 ? Math.sin(s.cardPulse / 0.35 * Math.PI) * 10 : 0);
    const cheer = (s.phase === "cleared" && s.phaseT > 0.3) || (a && a.stage === "swap" && !a.back && a.t > 0.2);
    const shows = !(a && a.stage === "swap");
    const lost = s.phase === "end" && !s.win;
    person(g, p.x, p.y, 196 * k, {
      shirt: PAPER, legs: INK, sash: pal.a, skin: SKINS[2], hair: HAIRS[1],
      pose: p.walk ? "walk" : cheer ? "cheer" : lost ? "hands" : "stand", t: s.t * 2.6,
      handTo2: shows && !cheer && !lost ? [cx - 46 * k, cy + 36 * k] : null,
    });
    if (shows) drawCard(g, s.held, cx, cy, CARD_R * k, pal.a, pal, 104 * k);
  }

  function drawFlying(g, s, ctx) {
    const a = s.anim; if (!a || a.stage !== "swap" || !a.give) return;
    const st = s.stalls[a.i], p = standAt(st);
    const e = easeInOut(clamp(a.t / T_SWAP, 0, 1)), lift = Math.sin(e * Math.PI) * 70;
    const cx = p.x + CARD_DX * p.k, cy = p.y + CARD_DY * p.k, tx = st.x + 32 * st.flip, ty = st.y0 + 210;
    drawThing(g, a.give, lerp(cx, tx, e), lerp(cy, ty, e) - lift, lerp(104 * p.k, 100, e), ctx.pal);
    drawThing(g, a.take, lerp(tx, cx, e), lerp(ty, cy, e) - lift, lerp(100, 104 * p.k, e), ctx.pal);
  }

  function draw(s, g, ctx) {
    const pal = ctx.pal, M = MARKETS[s.m];
    drawHall(g, pal);
    for (let i = 0; i < s.stalls.length; i++) drawStall(g, s, i, ctx);

    // what you came for, bottom left, in the goal's gold
    if (!(s.phase === "end" && s.win)) {
      sign(g, "CAME FOR", WANT.x, WANT.y - WANT.r - 14, 26, alpha(PAPER, 0.75), "center", 700);
      drawCard(g, M.goal, WANT.x, WANT.y, WANT.r, GOLD, pal, 86);
    }
    drawPlayer(g, s, ctx);
    drawFlying(g, s, ctx);
    s.parts.draw(g);
    s.notes.draw(g);

    // a new market: its number, and what you came for
    if (s.phase === "intro") {
      const al = smooth(0, 0.2, s.phaseT) * (1 - smooth(1.25, T_INTRO, s.phaseT));
      g.globalAlpha = al;
      fillRR(g, 250, 290, 500, 380, 26, alpha(INK, 0.9));
      sign(g, "MARKET " + M.word, 500, 362, 58, PAPER, "center", 800);
      drawCard(g, M.goal, 500, 468, 74, GOLD, pal, 112);
      sign(g, M.title, 500, 600, 44, GOLD, "center", 800);
      mono(g, "YOU HOLD " + articled(s.held).toUpperCase(), 500, 642, 22, alpha(PAPER, 0.6));
      g.globalAlpha = 1;
    }
    if (s.phase === "cleared") {
      const k = easeBack(clamp(s.phaseT / 0.45, 0, 1)), al = 1 - smooth(T_CLEAR - 0.45, T_CLEAR - 0.1, s.phaseT);
      g.globalAlpha = al;
      fillRR(g, 0, 0, SW, 798, 0, alpha(INK, 0.4));
      fillRR(g, 500 - 280 * k, 340, 560 * k, 190, 26, alpha(INK, 0.86));
      sign(g, "A BOTH", 500, 470 + 40 * k - 40, 150 * k, GOLD, "center", 800);
      g.globalAlpha = 1;
    }
    if (s.phase === "end") {
      const al = smooth(0, 0.5, s.endT);
      g.globalAlpha = al;
      if (s.win) {
        fillRR(g, 0, 0, SW, 798, 0, alpha(INK, 0.45));
        fillRR(g, 200, 330, 600, 230, 26, alpha(INK, 0.86));
        sign(g, "ALL THREE", 500, 470, 140, GOLD, "center", 800);
        mono(g, s.swaps + " SWAPS · PAR " + s.parTotal, 500, 524, 30, PAPER);
      } else {
        fillRR(g, 0, 0, SW, 798, 0, alpha(INK, 0.45));
        sign(g, "CLOSING", 500, 470, 140, PAPER, "center", 800);
      }
      g.globalAlpha = 1;
    }
  }

  /* ---- the house plays: read backward, tap the next stall ---- */
  function bot(s, b, ctx) {
    const B = s.bot || (s.bot = { t: 0, m: -1, erred: 0 });
    if (s.phase !== "play") return;
    const sk = ctx.skill;
    if (B.m !== s.m) { B.m = s.m; B.t = 0.5 + (1 - sk) * (16 + 6 * s.m) * ctx.rng.range(0.8, 1.2); }   // a newcomer stands and reads first
    if (busy(s)) return;
    B.t -= STEP;
    if (B.t > 0) return;
    const p = plan(s);
    let pick = p.first;
    const decoys = [], wrong = [];
    s.stalls.forEach((st, i) => {
      if (i === p.first) return;
      if (!st.done && st.want === s.held) decoys.push(i);
      else if (!st.done) wrong.push(i);
    });
    if (B.erred <= 0 && decoys.length && ctx.rng() < (1 - sk) * 1.1) { pick = ctx.rng.pick(decoys); B.erred = 2; }
    else if (wrong.length && ctx.rng() < (1 - sk) * 0.8) pick = ctx.rng.pick(wrong);
    B.erred--;
    if (pick < 0) return;
    const st = s.stalls[pick];
    b.x = st.x; b.y = st.y0 + 200; b.tap = true;
    B.t = 1.2 + (1 - sk) * 2.5 * ctx.rng.range(0.7, 1.3);
  }

  registerEvent({
    id: "fox", hour: 5, name: "A Both",
    place: "The Second Market, Ring Four, deck 178 · 0.76 g",
    intro: "New mass costs 25 kays a kilogram, so almost everything in Sorrel is second-hand, and the Second Market is where old things change hands, each with its history chalked on a card. Nobody here buys. You trade what you hold for what someone wants, and a good chain is a both: everyone goes home thinking they won.",
    how: "Tap a stall to offer what you hold; each stallholder swaps only for the thing in their bubble. Start from the stall with the bunting and read the bubbles backward to yourself.",
    keys: "arrows to pick a stall, Space to offer",
    marks: [30, 60, 90], unit: "points", fmt: (v) => String(v),
    result: (s) => ["No markets", "One market", "Two markets", "All three markets"][s.cleared] + ", " + s.swaps + (s.swaps === 1 ? " swap" : " swaps"),
    create, update, draw, bot,
  });
})();
