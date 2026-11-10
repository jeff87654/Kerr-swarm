/* ---------- Owl: The Lid Wall ----------
   A cooked canteen on deck 155 (0.79 g) where Owl's night shifts eat supper. Heliox takes the heat out
   of food fast, so every bowl goes out under a lid, and every regular has their own lid on the back
   wall: dented, mended, painted. The cook sends a bowl to the pass with an order card; find that
   regular's lid before the bowl goes cold. Every mended thing is somebody's, and you can tell them
   apart if you look. The last three orders are regulars back for seconds, and the card only gives
   the name. */
"use strict";
(function () {
  const COLS = 5, ROWS = 5, CW = 150, CH = 134, GX = 125, GY = 56;
  const LR = 58;                                     // a lid's size on the wall
  const N_ORD = 10, N_FIRST = 7;
  const COOL = 7, WRONG = 1.2, BACK = 8, HOT = 0.5;  // seconds from hot to cold; heat a wrong lid costs; seconds before a lid comes home
  const T_OUT = 0.4, T_FLY = 0.46, T_SERVE = 0.5, T_RET = 0.6;
  const PASS_Y = 884, HATCH_X0 = 24, HATCH_X1 = 244, HATCH_Y = 762;
  const BOWL_X0 = 205, BOWL_X = 352, REG_X = 528, TAKE_X = 462;
  const CARD_X = 772, CARD_Y = 870, CARD_W = 316, CARD_H = 240;
  const LAMP = "#ffdc9a";
  const SOUP = "#c47f3a";

  const NAMES = ["Benno", "Marta", "Tunde", "Aiko", "Ines", "Dov", "Sefa", "Oona", "Ravi", "Kofi", "Lusia", "Mats",
    "Yara", "Pim", "Noor", "Teo", "Hana", "Bram", "Esi", "Joss", "Ilka", "Ade", "Miro", "Suvi", "Ozan", "Cato",
    "Liang", "Zofi", "Ama", "Edda", "Rafi", "Nell", "Kemal", "Tove"];
  const SHAPES = ["round", "oval", "square", "domed"];
  const BODY = { buff: "#cfa465", violet: "#a273bd", steel: "#8f9ca6", copper: "#bb6a3b", cream: "#eee6d2", dark: "#2b2f37" };
  const BODIES = Object.keys(BODY);
  const HANDLES = ["knob", "loop", "bar", "ring"];
  const MARKS = ["none", "dot", "star", "initial", "patch"];
  const DENT_A = [45, 90, 135, 180, 225, 270, 315].map((d) => d * Math.PI / 180);   // clockwise from the top; the hook is at the top

  const cellX = (c) => GX + (c % COLS) * CW + CW / 2;
  const cellTop = (c) => GY + Math.floor(c / COLS) * CH;
  const hookY = (c) => cellTop(c) + 10;
  function halfH(sh, R) { return sh === "oval" ? R * 0.76 : sh === "square" ? R * 0.9 : sh === "domed" ? R * 0.98 : R; }
  const lidY = (L) => hookY(L.cell) + 4 + halfH(L.shape, LR);
  function cellAt(x, y) {
    const cx = Math.floor((x - GX) / CW), cy = Math.floor((y - GY) / CH);
    if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return -1;
    return cy * COLS + cx;
  }

  /* ---- the lids: every one different, and plenty that differ by only one thing ---- */
  function bits(m) { let n = 0; for (let i = 0; i < 7; i++) if (m & (1 << i)) n++; return n; }
  function randLid(r) {
    const n = r.pick([0, 0, 1, 1, 1, 2, 2, 3]), sl = r.shuffle([0, 1, 2, 3, 4, 5, 6]);
    let d = 0; for (let i = 0; i < n; i++) d |= 1 << sl[i];
    return { shape: r.pick(SHAPES), body: r.pick(BODIES), stripe: r.int(0, 2), handle: r.pick(HANDLES), dents: d, mark: r.pick(MARKS), letter: "" };
  }
  function keyOf(L) { return [L.shape, L.body, L.stripe, L.handle, L.dents, L.mark, L.mark === "initial" ? L.letter : ""].join("|"); }
  function diffCount(A, B) {
    let n = 0;
    for (const f of ["shape", "body", "stripe", "handle", "dents", "mark"]) if (A[f] !== B[f]) n++;
    if (A.mark === "initial" && B.mark === "initial" && A.letter !== B.letter) n++;
    return n;
  }
  // the same lid with one thing different: a stripe more, another handle, a dent, a different mark
  function twinOf(L, r, owner) {
    const t = Object.assign({}, L);
    const f = r.pick(["body", "stripe", "stripe", "handle", "handle", "dents", "dents", "mark", "mark", "shape"]);
    if (f === "body") t.body = r.pick(BODIES.filter((v) => v !== L.body));
    else if (f === "stripe") t.stripe = r.pick([0, 1, 2].filter((v) => v !== L.stripe));
    else if (f === "handle") t.handle = r.pick(HANDLES.filter((v) => v !== L.handle));
    else if (f === "dents") {
      const n = bits(L.dents), sl = r.shuffle([0, 1, 2, 3, 4, 5, 6]);
      const remove = n >= 3 || (n > 0 && r.chance(0.4));
      for (const k of sl) {
        if (remove && (L.dents & (1 << k))) { t.dents = L.dents & ~(1 << k); break; }
        if (!remove && !(L.dents & (1 << k))) { t.dents = L.dents | (1 << k); break; }
      }
    } else if (f === "mark") { t.mark = r.pick(MARKS.filter((v) => v !== L.mark)); if (t.mark === "initial") t.letter = owner[0]; }
    else t.shape = r.pick(SHAPES.filter((v) => v !== L.shape));
    return t;
  }

  function buildWall(r) {
    const names = r.shuffle(NAMES).slice(0, COLS * ROWS);
    const lids = [], keys = new Set();
    const tryAdd = (make) => {
      for (let k = 0; k < 60; k++) {
        const own = names[lids.length], L = make(own);
        if (keys.has(keyOf(L))) continue;
        L.owner = own; keys.add(keyOf(L)); lids.push(L); return lids.length - 1;
      }
      return -1;
    };
    // the orders' lids, in as many colours as there are; their near-twins; then the rest of the wall, evening out the colours
    const targets = [], tb = r.shuffle(BODIES).concat([r.pick(BODIES)]);
    for (let i = 0; i < N_FIRST; i++) targets.push(tryAdd((own) => { const L = randLid(r); L.body = tb[i]; L.letter = own[0]; return L; }));
    const twinsEach = r.shuffle([2, 2, 2, 1, 1, 1, 1]);
    for (let i = 0; i < N_FIRST; i++) for (let k = 0; k < twinsEach[i]; k++) tryAdd((own) => twinOf(lids[targets[i]], r, own));
    const used = (b) => lids.filter((L) => L.body === b).length;
    while (lids.length < COLS * ROWS) {
      const least = Math.min(...BODIES.map(used)), few = BODIES.filter((b) => used(b) === least);
      tryAdd((own) => { const L = randLid(r); L.body = r.pick(few); L.letter = own[0]; return L; });
    }
    const cells = r.shuffle(lids.map((_, i) => i));
    lids.forEach((L, i) => { L.cell = cells[i]; L.st = "hook"; L.t = 0; L.wob = 0; L.tag = 0; L.tagText = ""; L.usedAt = -1; L.backAt = 0; L.used = false; });
    return { lids, targets };
  }

  /* ---- the game ---- */
  function create(ctx) {
    const w = buildWall(ctx.rng);
    const s = {
      t: 0, phase: "out", pt: 0, oi: 0, ord: null, lids: w.lids, targets: w.targets, again: [],
      pts: 0, score: 0, found: 0, hot: 0, streak: 0, best: 0, warm: 0, tally: [],
      cur: 12, kb: false, hover: -1, saidWrong: false, endT: 0, done: false,
      parts: new Parts(260), notes: new Notes(), fx: makeRng(ctx.rng.int(1, 1e9)),
      regSeed: ctx.rng.int(0, 9999), leaving: null, coming: 0,
    };
    startOrder(s, ctx);
    return s;
  }

  const lidAt = (s, c) => s.lids.find((L) => L.cell === c);

  function startOrder(s, ctx) {
    const i = s.oi, seconds = i >= N_FIRST;
    let li;
    if (!seconds) li = s.targets[i];
    else {
      // a regular back for seconds: one of the first, from a while ago
      const pool = s.targets.filter((k) => s.again.indexOf(k) < 0);
      const home = pool.filter((k) => s.lids[k].st === "hook");
      const from = (home.length ? home : pool).slice().sort((a, b) => s.lids[a].usedAt - s.lids[b].usedAt);
      li = from[ctx.rng.int(0, Math.min(from.length, 3) - 1)];
      s.again.push(li);
      const L = s.lids[li];
      if (L.st !== "hook") { L.st = "hook"; L.t = 0; }            // they brought it back with them
    }
    s.ord = { li, heat: 1, wrongs: 0, seconds, t: 0, pts: 0, cold: false, plan: null, step: 0 };
    s.phase = "out"; s.pt = 0;
    if (i === 0) ctx.say("Good night. Find the lid on the card. The bowl is cooling.", 4);
    if (i === N_FIRST) ctx.say("Regulars, back for seconds. Whose was whose.", 4);
  }

  function puff(s, n, x, y, spread, up) {
    for (let k = 0; k < n; k++) s.parts.add({ x: x + (s.fx() - 0.5) * spread, y, vx: (s.fx() - 0.5) * 90, vy: -up * (0.5 + s.fx()), life: 0.9 + s.fx() * 0.5, r: 8 + s.fx() * 6, col: PAPER, a: 0.32, grow: 2.2, drag: 1.2 });
  }

  function launch(s, ctx, pts) {
    const o = s.ord, L = s.lids[o.li];
    o.pts = pts;
    L.st = "fly"; L.t = 0; L.fx = cellX(L.cell); L.fy = lidY(L); L.used = true; L.usedAt = s.t; L.tag = 0;
    s.phase = "fly"; s.pt = 0;
    ctx.sfx.whoosh(0.6);
    s.notes.add(L.owner + "'s", L.fx, Math.max(70, L.fy - 20), { good: true, size: 48, life: 1.4, col: LAMP, rise: 30 });
  }

  function land(s, ctx) {
    const o = s.ord, L = s.lids[o.li];
    L.st = "bowl"; L.t = 0;
    s.pts += o.pts; s.score = Math.round(10 * s.pts);
    const hot = !o.cold && o.heat >= HOT;
    if (!o.cold) s.found++;
    if (hot) s.hot++;
    s.tally.push(o.cold ? "cold" : hot ? "hot" : "warm");
    ctx.sfx.clack();
    if (o.cold) { ctx.sfx.miss(); s.streak = 0; s.notes.add("served cold", BOWL_X, 780, { good: false, size: 40 }); }
    else {
      if (o.wrongs === 0) s.streak++; else s.streak = 0;
      s.best = Math.max(s.best, s.streak);
      if (s.streak > 0) ctx.sfx.chime(Math.min(10, s.streak)); else ctx.sfx.good();
      const big = Math.min(s.streak, 6);
      s.notes.add("lids on", BOWL_X, 790, { good: true, size: 44 + big * 5, col: s.streak >= 3 ? LAMP : PAPER, life: 1.2 });
      if (s.streak >= 3) s.notes.add(s.streak + " in a row", BOWL_X, 846, { good: true, size: 34, col: LAMP, life: 1.2, rise: 30 });
    }
    // the last of the steam squeezes out under the rim
    for (let k = 0; k < 12; k++) {
      const sd = k % 2 ? 1 : -1;
      s.parts.add({ x: BOWL_X + sd * 70, y: PASS_Y - 62, vx: sd * (60 + s.fx() * 90), vy: -20 - s.fx() * 40, life: 0.7, r: 7, col: PAPER, a: 0.35 * (o.heat + 0.2), grow: 1.8, drag: 2 });
    }
    s.phase = "serve"; s.pt = 0;
  }

  function tapCell(s, c, ctx) {
    if (s.phase !== "wait" && s.phase !== "out") return;
    const o = s.ord, L = lidAt(s, c);
    if (!L || L.st !== "hook") {
      ctx.sfx.tap();
      s.notes.add("in use", cellX(c), cellTop(c) + 80, { good: false, size: 34, life: 0.8, rise: 24 });
      return;
    }
    if (L === s.lids[o.li]) { launch(s, ctx, 0.4 + 0.6 * Math.max(0, o.heat)); return; }
    // somebody else's
    o.wrongs++; o.heat -= WRONG / COOL;
    L.wob = 0.45; L.tag = 1.8; L.tagText = L.owner.toUpperCase() + "'S";
    s.streak = 0;
    ctx.sfx.bad();
    puff(s, 8, BOWL_X, PASS_Y - 66, 120, 140);
    if (!s.saidWrong && !o.seconds) { s.saidWrong = true; ctx.say("Every lid is somebody's. Look at the dents, the paint, the handle.", 3.5); }
  }

  function toEnd(s, ctx) {
    s.phase = "end"; s.endT = 0;
    let k = 0;
    for (const L of s.lids) if (L.st !== "hook") { L.st = "ret"; L.t = -0.07 * k++; }
    ctx.sfx.great();
  }

  function update(s, dt, inp, ctx) {
    s.t += dt; s.pt += dt;
    s.parts.update(dt); s.notes.update(dt);
    for (const L of s.lids) {
      if (L.wob > 0) L.wob = Math.max(0, L.wob - dt);
      if (L.tag > 0) L.tag = Math.max(0, L.tag - dt);
      if (L.st === "away" && s.t >= L.backAt) { L.st = "ret"; L.t = 0; }
      if (L.st === "ret") {
        L.t += dt;
        if (L.t >= T_RET) { L.st = "hook"; L.t = 0; if (s.phase !== "end") { L.tag = 1.3; L.tagText = L.owner.toUpperCase(); ctx.sfx.tick(); } }
      }
    }
    s.warm = approach(s.warm, s.phase === "end" ? 1 : Math.min(1, s.streak / 6), dt * 0.9);
    if (s.leaving) { s.leaving.t += dt; if (s.leaving.t > 1.8) s.leaving = null; }
    ctx.hud.set("order " + Math.min(N_ORD, s.oi + 1) + " of " + N_ORD, "hot " + s.hot);

    if (s.phase === "end") { s.endT += dt; if (s.endT > 1.6) s.done = true; return; }

    // the keyboard way: a highlight that walks round the wall
    const mv = (dc, dr) => {
      s.kb = true;
      const c = s.cur % COLS, r = Math.floor(s.cur / COLS);
      s.cur = clamp(r + dr, 0, ROWS - 1) * COLS + clamp(c + dc, 0, COLS - 1);
      ctx.sfx.tick();
    };
    if (inp.leftPressed) mv(-1, 0);
    if (inp.rightPressed) mv(1, 0);
    if (inp.upPressed) mv(0, -1);
    if (inp.dnPressed) mv(0, 1);
    if (inp.ptrPressed || (inp.moved && !inp.act)) { s.hover = cellAt(inp.x, inp.y); if (inp.ptrPressed) s.kb = false; }

    let pick = -1;
    if (inp.ptrPressed) pick = cellAt(inp.x, inp.y);
    else if (inp.actPressed) { s.kb = true; pick = s.cur; }
    if (pick >= 0) tapCell(s, pick, ctx);

    const o = s.ord;
    if (s.phase === "out") { if (s.pt >= T_OUT) { s.phase = "wait"; s.pt = 0; } }
    else if (s.phase === "wait") {
      o.t += dt; o.heat -= dt / COOL;
      if (o.heat <= 0) { o.heat = 0; o.cold = true; launch(s, ctx, 0.2); }
    } else if (s.phase === "fly") { if (s.pt >= T_FLY) land(s, ctx); }
    else if (s.phase === "serve") {
      if (s.pt >= T_SERVE) {
        const L = s.lids[o.li];
        L.st = "away"; L.backAt = s.t + BACK;
        s.leaving = { li: o.li, t: 0 };
        s.oi++;
        if (s.oi >= N_ORD) toEnd(s, ctx); else startOrder(s, ctx);
      }
    }
    // steam off the open bowl: thick when hot, a wisp when cooling
    if (s.phase === "out" || s.phase === "wait" || s.phase === "fly") {
      const h = Math.max(0, s.ord.heat), bx = bowlX(s);
      if (s.fx() < dt * (4 + 20 * h)) s.parts.add({ x: bx + (s.fx() - 0.5) * 100, y: PASS_Y - 66, vx: (s.fx() - 0.5) * 16, vy: -36 - 36 * s.fx() - 26 * h, ax: (s.fx() - 0.5) * 30, life: 0.8 + 0.7 * h, r: 6 + 4 * h, col: PAPER, a: 0.08 + 0.2 * h, grow: 2.2, drag: 0.5 });
    }
  }

  function bowlX(s) {
    if (s.phase === "out") return lerp(BOWL_X0, BOWL_X, easeOut(s.pt / T_OUT));
    if (s.phase === "serve") return lerp(BOWL_X, TAKE_X, easeInOut(s.pt / T_SERVE));
    return BOWL_X;
  }

  /* ---- drawing a lid ---- */
  function lidPath(g, sh, R) {
    if (sh === "square") { rrect(g, -0.9 * R, -0.9 * R, 1.8 * R, 1.8 * R, 0.34 * R); return; }
    g.beginPath();
    if (sh === "oval") g.ellipse(0, 0, R * 1.1, R * 0.76, 0, 0, TAU);
    else g.arc(0, 0, sh === "domed" ? R * 0.98 : R, 0, TAU);
  }
  // a point on the rim at angle a (clockwise from the top), k of the way out
  function rimAt(sh, R, a, k) {
    const dx = Math.sin(a), dy = -Math.cos(a);
    let d;
    if (sh === "oval") d = 1 / Math.hypot(dx / (R * 1.1), dy / (R * 0.76));
    else if (sh === "square") d = 0.9 * R / Math.max(Math.abs(dx), Math.abs(dy)) * (Math.abs(Math.abs(dx) - Math.abs(dy)) < 0.3 ? 0.9 : 1);
    else d = sh === "domed" ? R * 0.98 : R;
    return [dx * d * k, dy * d * k];
  }
  const isDarkBody = (b) => b === "dark" || b === "violet" || b === "copper";
  const paintOf = (L) => (isDarkBody(L.body) ? "#f1dca8" : "#5b3577");

  function star(g, x, y, r, col) {
    g.beginPath();
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, rr = i % 2 ? r * 0.44 : r; g.lineTo(x + rr * Math.sin(a), y - rr * Math.cos(a)); }
    g.closePath(); g.fillStyle = col; g.fill();
  }

  // o: {sy: vertical squash (a lid seen lying on a bowl), shadow, rot, a}
  function drawLid(g, x, y, R, L, o) {
    o = o || {};
    const body = BODY[L.body], dark = isDarkBody(L.body), paint = paintOf(L);
    const oval = L.shape === "oval";
    g.save(); g.translate(x, y);
    if (o.rot) g.rotate(o.rot);
    g.scale(1, o.sy || 1);
    if (o.shadow !== false) { g.save(); g.translate(R * 0.07, R * 0.13); lidPath(g, L.shape, R); g.fillStyle = alpha(INK, 0.42); g.fill(); g.restore(); }
    lidPath(g, L.shape, R); g.fillStyle = body; g.fill();
    g.save(); lidPath(g, L.shape, R); g.clip();
    if (L.shape === "domed") {
      // a dome: shadowed low and right, a bright crown up and left
      g.fillStyle = shade(body, dark ? -0.35 : -0.26); g.fillRect(-R * 1.3, -R * 1.3, R * 2.6, R * 2.6);
      disc(g, -R * 0.1, -R * 0.12, R * 0.9, body);
      disc(g, -R * 0.2, -R * 0.24, R * 0.6, shade(body, dark ? 0.16 : 0.14));
      g.beginPath(); g.ellipse(-R * 0.4, -R * 0.44, R * 0.26, R * 0.13, -0.7, 0, TAU); g.fillStyle = alpha("#ffffff", 0.5); g.fill();
    } else {
      // a flat lid: a turned lip and a glint
      g.save(); g.scale(0.9, 0.9); lidPath(g, L.shape, R); g.restore();
      g.lineWidth = R * 0.07; g.strokeStyle = shade(body, dark ? 0.14 : -0.16); g.stroke();
      g.save(); if (oval) g.scale(1.1, 0.76); else if (L.shape === "square") g.scale(0.92, 0.92);
      g.beginPath(); g.arc(0, 0, R * 0.7, Math.PI * 1.12, Math.PI * 1.42); g.restore();
      g.lineWidth = R * 0.07; g.strokeStyle = alpha("#ffffff", 0.42); g.lineCap = "round"; g.stroke();
    }
    // painted rim stripes
    const st = L.stripe === 1 ? [[0.8, 0.17]] : L.stripe === 2 ? [[0.93, 0.11], [0.7, 0.1]] : [];
    for (const sw of st) { g.save(); g.scale(sw[0], sw[0]); lidPath(g, L.shape, R); g.restore(); g.lineWidth = R * sw[1]; g.strokeStyle = paint; g.stroke(); }
    // dents: bites knocked into the rim
    for (let i = 0; i < 7; i++) if (L.dents & (1 << i)) {
      const p = rimAt(L.shape, R, DENT_A[i], 1.0);
      disc(g, p[0], p[1], R * 0.25, dark ? shade(body, 0.4) : shade(body, -0.55));
      const ia = Math.atan2(-p[1], -p[0]);
      g.beginPath(); g.arc(p[0], p[1], R * 0.25, ia - 0.95, ia + 0.95);
      g.lineWidth = R * 0.06; g.strokeStyle = dark ? shade(body, 0.7) : shade(body, 0.45); g.stroke();
    }
    g.restore();
    // the handle
    const hx = oval ? -R * 0.24 : 0, hy = oval ? 0 : -R * 0.12;
    const hc = dark ? "#d8c79a" : shade(body, -0.58), hs = shade(hc, -0.35);
    if (L.handle === "knob") {
      disc(g, hx + R * 0.03, hy + R * 0.06, R * 0.22, hs); disc(g, hx, hy, R * 0.22, hc);
      disc(g, hx - R * 0.07, hy - R * 0.07, R * 0.07, alpha("#ffffff", 0.5));
    } else if (L.handle === "loop") {
      g.beginPath(); g.arc(hx, hy + R * 0.12, R * 0.28, Math.PI, TAU);
      g.lineWidth = R * 0.12; g.strokeStyle = hc; g.lineCap = "round"; g.stroke();
      disc(g, hx - R * 0.28, hy + R * 0.14, R * 0.09, hs); disc(g, hx + R * 0.28, hy + R * 0.14, R * 0.09, hs);
    } else if (L.handle === "bar") {
      const bw = oval ? R * 0.7 : R * 0.86;
      disc(g, hx - bw * 0.4, hy + R * 0.02, R * 0.09, hs); disc(g, hx + bw * 0.4, hy + R * 0.02, R * 0.09, hs);
      fillRR(g, hx - bw / 2, hy - R * 0.1, bw, R * 0.2, R * 0.1, hc);
    } else {
      disc(g, hx, hy - R * 0.2, R * 0.09, hs);
      ring(g, hx, hy + R * 0.04, R * 0.21, R * 0.09, hc);
    }
    // the mark
    const mx = oval ? R * 0.47 : 0, my = oval ? R * 0.04 : R * 0.42, mr = R * 0.22;
    if (L.mark === "dot") disc(g, mx, my, mr * 0.8, paint);
    else if (L.mark === "star") star(g, mx, my, mr * 1.08, paint);
    else if (L.mark === "initial") sign(g, L.letter, mx, my + mr * 0.74, mr * 2.1, paint, "center", 800);
    else if (L.mark === "patch") {
      const pc = L.body === "steel" ? BODY.copper : L.body === "copper" ? BODY.steel : "#9aa6ae";
      g.save(); g.translate(mx, my); g.rotate(-0.12);
      fillRR(g, -mr * 1.05, -mr * 0.8, mr * 2.1, mr * 1.6, mr * 0.18, pc);
      for (const q of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) disc(g, q[0] * mr * 0.72, q[1] * mr * 0.5, mr * 0.15, INK);
      g.restore();
    }
    g.restore();
  }

  // a hook, and when nobody's lid is on it, the clean patch where it hangs
  function drawHook(g, c, L, empty) {
    const x = cellX(c), y = hookY(c);
    if (empty && L) {
      g.save(); g.translate(x, lidY(L));
      lidPath(g, L.shape, LR); g.fillStyle = alpha(PAPER, 0.07); g.fill();
      g.setLineDash([9, 9]); g.lineWidth = 3; g.strokeStyle = alpha(PAPER, 0.22); g.stroke(); g.setLineDash([]);
      g.restore();
    }
    disc(g, x, y - 2, 8, "#8a6a3c");
    seg(g, x, y - 2, x, y + 13, 5, "#d6b071");
    seg(g, x, y + 13, x + 7, y + 6, 5, "#d6b071");
  }

  function drawTag(g, x, y, text, k) {
    g.save(); g.translate(x, y); const sc = easeBack(clamp(k, 0, 1)); g.scale(sc, sc);
    g.font = "800 34px " + FONT_SIGN;
    const w = Math.max(80, (g.measureText ? g.measureText(text).width : text.length * 16) + 26);
    fillRR(g, -w / 2 + 3, -22 + 4, w, 44, 10, alpha(INK, 0.45));
    fillRR(g, -w / 2, -22, w, 44, 10, PAPER);
    sign(g, text, 0, 12, 34, INK, "center", 800);
    g.restore();
  }

  /* ---- the room ---- */
  function wallCol(pal) { return shade(pal.aDD, -0.25); }

  function drawRoom(g, s, pal) {
    const wall = wallCol(pal);
    g.fillStyle = wall; g.fillRect(0, 0, SW, SH);
    // boards, and the lamps' warm wash over them
    for (let x = 0; x < SW; x += 62) { g.fillStyle = alpha(INK, 0.16); g.fillRect(x, 0, 3, 740); }
    for (const lx of [60, 940]) glow(g, lx, 230, 560, LAMP, 0.15 + 0.13 * s.warm);
    glow(g, 500, 380, 520, LAMP, 0.06 + 0.08 * s.warm);
    // the bay: the board the hooks are screwed to
    fillRR(g, GX - 14, GY - 8, CW * COLS + 28, CH * ROWS + 8, 14, alpha(shade(pal.aD, -0.2), 0.55));
    // the beam along the top, with its painted name
    g.fillStyle = shade(wall, -0.35); g.fillRect(0, 0, SW, 44);
    g.fillStyle = shade(pal.b, -0.25); g.fillRect(0, 42, SW, 5);
    sign(g, "THE LID WALL", 500, 34, 30, alpha(pal.b, 0.9), "center", 800);
    // hung lamps in buff shades
    for (const lx of [60, 940]) {
      seg(g, lx, 44, lx, 196, 3, shade(wall, -0.4));
      poly(g, [lx - 34, 214, lx + 34, 214, lx + 18, 192, lx - 18, 192], pal.b);
      lamp(g, lx, 220, 12 + 2 * s.warm, LAMP, 8 + 4 * s.warm);
    }
  }

  function drawWall(g, s, pal, ctx) {
    const active = s.phase === "wait" || s.phase === "out";
    for (let c = 0; c < COLS * ROWS; c++) {
      const L = lidAt(s, c);
      const home = L && L.st === "hook";
      drawHook(g, c, L, !home && !(L && L.st === "ret" && L.t > T_RET * 0.7));
      if (!home) continue;
      const x = cellX(c);
      let y = lidY(L), rot = 0;
      if (L.wob > 0) rot = Math.sin(L.wob * 38) * 0.22 * (L.wob / 0.45);
      const hi = active && ((s.kb && s.cur === c) || (!s.kb && s.hover === c));
      if (hi) { glow(g, x, y, LR * 1.6, LAMP, 0.42); y -= 4; }
      // lids swing from the hook, so rotate about it
      g.save(); g.translate(x, hookY(c)); g.rotate(rot); g.translate(-x, -hookY(c));
      drawLid(g, x, y, LR, L);
      g.restore();
    }
    // the keyboard highlight: a lit frame on the cell
    if (s.kb && active) {
      const c = s.cur, x = GX + (c % COLS) * CW, y = cellTop(c);
      rrect(g, x + 5, y + 2, CW - 10, CH - 4, 16); g.lineWidth = 5; g.strokeStyle = LAMP; g.stroke();
    }
    // names on tags: whose this one is
    for (const L of s.lids) if (L.st === "hook" && L.tag > 0) {
      const k = L.tag;
      g.globalAlpha = smooth(0, 0.3, k);
      drawTag(g, cellX(L.cell), lidY(L) + halfH(L.shape, LR) * 0.15, L.tagText, (1.9 - k) * 4);
      g.globalAlpha = 1;
    }
  }

  function regularLook(s, li) { return someone(s.regSeed + li * 17, null); }
  function regShirt(s, li, pal) { const c = [pal.a, pal.b, "#8f9ca6", PAPER, pal.aL, "#6d6a72", pal.bD]; return c[(s.regSeed + li * 5) % c.length]; }

  function drawBowl(g, x, y, sc, pal, heat, L) {
    g.save(); g.translate(x, y); g.scale(sc, sc);
    fillRR(g, -36, -12, 72, 12, 5, shade(pal.b, -0.35));
    g.beginPath(); g.moveTo(-82, -62); g.quadraticCurveTo(-80, -6, 0, -8); g.quadraticCurveTo(80, -6, 82, -62); g.closePath();
    g.fillStyle = PAPER; g.fill();
    g.save(); g.clip(); g.fillStyle = pal.a; g.fillRect(-90, -50, 180, 11); g.restore();
    g.beginPath(); g.ellipse(0, -62, 82, 13, 0, 0, TAU); g.fillStyle = shade(PAPER, -0.15); g.fill();
    if (!L) {
      g.beginPath(); g.ellipse(0, -61, 74, 9.5, 0, 0, TAU); g.fillStyle = mix("#8a6a4c", SOUP, clamp(heat, 0, 1)); g.fill();
      disc(g, -22, -62, 6, alpha("#f6d48e", 0.7)); disc(g, 18, -60, 4, alpha("#f6d48e", 0.6));
    } else drawLid(g, 0, -64, LR * 1.32, L, { sy: 0.36, shadow: false });
    g.restore();
  }

  function drawPass(g, s, pal) {
    const wall = wallCol(pal);
    // the dado rail and the lower wall
    g.fillStyle = shade(wall, -0.25); g.fillRect(0, 734, SW, PASS_Y - 734);
    g.fillStyle = pal.bD; g.fillRect(0, 734, SW, 10);
    // the tally: ten bowls, how each went out
    for (let i = 0; i < N_ORD; i++) {
      const x = 286 + i * 30, y = 758, t = s.tally[i];
      if (t) disc(g, x, y, 10, t === "hot" ? "#d9894a" : t === "warm" ? pal.b : "#7d8790");
      else ring(g, x, y, 8, 3, alpha(pal.b, i === s.oi && s.phase !== "end" ? 0.85 : 0.35));
    }
    // the hatch, and the cook in it
    fillRR(g, HATCH_X0 - 10, HATCH_Y - 10, HATCH_X1 - HATCH_X0 + 20, PASS_Y - HATCH_Y + 10, 10, pal.bD);
    g.save(); rrect(g, HATCH_X0, HATCH_Y, HATCH_X1 - HATCH_X0, PASS_Y - HATCH_Y + 4, 6); g.clip();
    g.fillStyle = shade(pal.b, -0.66); g.fillRect(HATCH_X0, HATCH_Y, HATCH_X1 - HATCH_X0, 140);
    glow(g, 134, HATCH_Y + 16, 170, LAMP, 0.4 + 0.2 * s.warm);
    for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(52, HATCH_Y + 58 - i * 9, 22, 6, 0, 0, TAU); g.fillStyle = shade(PAPER, -0.1 - i * 0.04); g.fill(); }   // a stack of bowls
    for (let i = 0; i < 3; i++) disc(g, 214 - i * 2, HATCH_Y + 30 + i * 20, 13, mix(BODY.steel, BODY.copper, i / 2));                                       // lids waiting to be washed
    const reach = s.phase === "out" && s.pt < T_OUT;
    const H = 255, fy = PASS_Y + 120;
    const pose = s.phase === "end" ? "wave" : "stand";
    const bx = bowlX(s);
    const hd = person(g, 134, fy, H, {
      view: "front", pose, t: s.t, shirt: pal.a, skin: SKINS[4], hair: HAIRS[0],
      handTo2: reach ? [bx - 70, PASS_Y - 30] : null,
    });
    fillRR(g, 134 - H * 0.085, fy - H * 0.7, H * 0.17, H * 0.5, 8, PAPER);                       // apron
    fillRR(g, hd.headX - hd.headR * 0.95, hd.headY - hd.headR * 1.55, hd.headR * 1.9, hd.headR * 0.85, 7, PAPER);   // cap
    g.restore();
    sign(g, "DASHA", 134, HATCH_Y - 18, 24, alpha(pal.b, 0.7), "center", 700);

    // the regular whose bowl this is, waiting at the pass; the last one walking off with theirs
    const RH = 250, ry = 998;
    if (s.leaving) {
      const lk = regularLook(s, s.leaving.li), x = REG_X + s.leaving.t * 300;
      g.globalAlpha = 1 - smooth(0.9, 1.6, s.leaving.t);
      const hands = person(g, x, ry, RH * lk.hk, { view: "side", face: 1, pose: "carry", t: s.leaving.t * 2, shirt: regShirt(s, s.leaving.li, pal), skin: lk.skin, hair: lk.hair });
      drawBowl(g, (hands.hx0 + hands.hx1) / 2 + 26, (hands.hy0 + hands.hy1) / 2 + 6, 0.45, pal, 0, s.lids[s.leaving.li]);
      g.globalAlpha = 1;
    }
    if (s.ord && s.phase !== "end") {
      const li = s.ord.li, lk = regularLook(s, li);
      const inT = s.phase === "out" ? easeOut(s.pt / T_OUT) : 1;
      const x = lerp(REG_X + 260, REG_X, inT);
      const takes = s.phase === "serve" && s.pt > T_SERVE * 0.45;
      person(g, x, ry, RH * lk.hk, {
        view: "side", face: -1, pose: inT < 1 ? "walk" : "stand", t: s.t * 1.6 + lk.ph, shirt: regShirt(s, li, pal), skin: lk.skin, hair: lk.hair,
        handTo: takes ? [bx + 70, PASS_Y - 40] : null, handTo2: takes ? [bx + 60, PASS_Y - 30] : null,
      });
    }

    // the end: the night shift at the pass, saying good night
    if (s.phase === "end") {
      const k = easeOut(s.endT / 0.5);
      crowd(g, 300, 975, PASS_Y + 150 + (1 - k) * 80, 6, 262, { cols: [pal.a, pal.b, "#8f9ca6", PAPER, pal.aL, pal.bD], t: s.t, cheer: smooth(0.3, 1.0, s.endT) * 0.7, seed: s.regSeed });
    }

    // the counter: the pass, a long buff board
    g.fillStyle = pal.bL; g.fillRect(0, PASS_Y, SW, 12);
    g.fillStyle = pal.b; g.fillRect(0, PASS_Y + 12, SW, SH - PASS_Y);
    for (let i = 0; i < 4; i++) { g.fillStyle = alpha(shade(pal.b, -0.4), 0.18); g.fillRect(0, PASS_Y + 34 + i * 26, SW, 3); }
    if (s.phase === "end") { g.globalAlpha = smooth(0.25, 0.7, s.endT); sign(g, "LIDS ON", 500, 978, 96, pal.aD, "center", 800); g.globalAlpha = 1; }

    // the bowl
    const o = s.ord;
    if (o && s.phase !== "end") {
      const L = s.lids[o.li];
      drawBowl(g, bx, PASS_Y + 2, 1, pal, o.heat, L.st === "bowl" ? L : null);
      // heat: a bar and the soup's temperature
      if (s.phase !== "serve") {
        const h = clamp(o.heat, 0, 1), x0 = BOWL_X - 80, w = 160, y0 = 914;
        fillRR(g, x0 - 5, y0 - 5, w + 10, 26, 13, alpha(INK, 0.75));
        if (h > 0) fillRR(g, x0, y0, Math.max(16, w * h), 16, 8, mix("#8f9ca6", "#e0874a", h));
        mono(g, Math.round(36 + 49 * h) + " °C", BOWL_X, 970, 30, alpha(INK, 0.8));
      }
    }
  }

  function drawCard(g, s, pal) {
    const o = s.ord;
    if (!o || s.phase === "end") return;
    const L = s.lids[o.li];
    let k = 1;
    if (s.phase === "out") k = easeOut(s.pt / T_OUT);
    if (s.phase === "serve") k = 1 - easeIn(s.pt / T_SERVE);
    if (k <= 0.01) return;
    g.save(); g.translate(CARD_X, CARD_Y); g.scale(k, 1); g.rotate(0.02);
    const w = CARD_W, h = CARD_H;
    fillRR(g, -w / 2 + 7, -h / 2 + 9, w, h, 14, alpha(INK, 0.4));
    fillRR(g, -w / 2, -h / 2, w, h, 14, PAPER);
    g.save(); rrect(g, -w / 2, -h / 2, w, h, 14); g.clip(); g.fillStyle = pal.a; g.fillRect(-w / 2, -h / 2, w, 62); g.restore();
    const nm = o.seconds ? L.owner.toUpperCase() + ", AGAIN" : L.owner.toUpperCase();
    sign(g, nm, 0, -h / 2 + 47, o.seconds ? 42 : 46, PAPER, "center", 800);
    disc(g, -w / 2 + 18, -h / 2 + 14, 6, shade(pal.b, -0.2));                // the spike it's on
    if (!o.seconds) drawLid(g, 0, 36, 78, L);
    else {
      g.save(); g.translate(0, 36);
      lidPath(g, L.shape, 78); g.fillStyle = alpha(pal.a, 0.08); g.fill();
      g.setLineDash([14, 11]); g.lineWidth = 5; g.strokeStyle = alpha(pal.aD, 0.5); g.stroke(); g.setLineDash([]);
      g.restore();
      sign(g, "SECONDS", 0, 48, 34, alpha(pal.aD, 0.6), "center", 800);
    }
    g.restore();
  }

  function drawMoving(g, s) {
    for (const L of s.lids) {
      if (L.st === "fly") {
        const k = easeInOut(s.pt / T_FLY), bx = BOWL_X, by = PASS_Y + 2 - 64;
        const x = lerp(L.fx, bx, k), y = lerp(L.fy, by, k) - Math.sin(Math.PI * k) * 90;
        drawLid(g, x, y, LR * lerp(1, 1.32, k), L, { sy: lerp(1, 0.36, easeIn(k)), rot: Math.sin(Math.PI * k) * 0.4 });
      } else if (L.st === "ret" && L.t > 0) {
        const k = easeInOut(L.t / T_RET), tx = cellX(L.cell), ty = lidY(L);
        const x = lerp(1060, tx, k), y = lerp(820, ty, k) - Math.sin(Math.PI * k) * 60;
        drawLid(g, x, y, LR * lerp(0.7, 1, k), L, { rot: (1 - k) * 0.8 });
      }
    }
  }

  function draw(s, g, ctx) {
    const pal = ctx.pal;
    drawRoom(g, s, pal);
    drawWall(g, s, pal, ctx);
    drawPass(g, s, pal);
    s.parts.draw(g);
    drawCard(g, s, pal);
    drawMoving(g, s);
    s.notes.draw(g);
  }

  // The house plays: it knows every lid. A clumsy house reaches for a near-twin first.
  function bot(s, b, ctx) {
    const B = s.botP || (s.botP = { x: 500, y: 560 });
    const o = s.ord;
    let tx = 500, ty = 560;
    if (o && (s.phase === "wait" || s.phase === "out")) {
      const T = s.lids[o.li];
      if (!o.plan) {
        const sk = clamp(ctx.skill, 0, 1), r = ctx.rng;
        const delay = 1.1 + (1 - sk) * 3.5 * r.range(0.75, 1.25);
        let pw = (1 - sk) * (o.seconds ? 1.3 : 0.8), n = 0;
        while (n < 2 && r() < pw) { n++; pw -= 0.6; }
        const onHook = s.lids.map((L, i) => i).filter((i) => i !== o.li && s.lids[i].st === "hook");
        const twins = onHook.filter((i) => diffCount(s.lids[i], T) === 1);
        const plan = [];
        for (let k = 0; k < n; k++) {
          const pool = twins.length > k ? twins : onHook;
          plan.push({ at: delay * (k + 1) / (n + 1), li: pool[r.int(0, pool.length - 1)] });
        }
        plan.push({ at: delay + n * 0.35, li: o.li });
        o.plan = plan; o.step = 0;
      }
      const st = o.plan[Math.min(o.step, o.plan.length - 1)], L = s.lids[st.li];
      tx = cellX(L.cell); ty = lidY(L);
      if (o.step < o.plan.length && o.t >= st.at && Math.hypot(B.x - tx, B.y - ty) < 14) { b.tap = true; o.step++; }
    } else if (s.phase === "fly" || s.phase === "serve") { tx = CARD_X - 40; ty = 600; }
    B.x += (tx - B.x) * 0.09; B.y += (ty - B.y) * 0.09;
    b.x = B.x; b.y = B.y;
  }

  registerEvent({
    id: "owl", hour: 3, name: "The Lid Wall",
    place: "The Lid Wall, a cooked canteen in Owl · deck 155 · 0.79 g",
    intro: "The Lid Wall feeds Owl's night shifts their supper at the same long tables where the day shifts eat lunch. Heliox takes the heat out of a bowl in seconds, so every regular keeps their own lid on the back wall: dented, mended, painted. Find each one's lid before the soup goes cold.",
    how: "Tap the lid that matches the card. A wrong lid costs heat. The last three are regulars back for seconds, so remember whose was whose.",
    keys: "arrows to move along the wall, Space to take a lid",
    marks: [52, 73, 84], unit: "points", fmt: (v) => String(Math.round(v)),
    result: (s) => s.found + " of " + N_ORD + " under their own lids, " + s.hot + " hot",
    create, update, draw, bot,
  });
})();
