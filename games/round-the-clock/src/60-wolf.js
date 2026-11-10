/* ---------- Wolf: Spinball ----------
   Spinball is Sorrel's game: "axis flies true, spin sinks, anti floats." The Spinball Fields are on the
   Hollow's floor in Wolf, at half a g, where the floor itself moves at only 86 m/s, so a throw breaks about
   twice as hard as anyone remembers. Twelve throws, two sixes, at four hoops: 12 m and 20 m each way.
   Seen looking along the axis: spinward is to the right. In the floor's frame (spinStep):
       ay = -g - 2 W vx   (spinward heavier, anti lighter)     ax = +2 W vy
   The dotted line while aiming is the old pictures: a plain parabola at half a g with no spin. */
"use strict";
(function () {
  const SC = 22, CX = 500, FLOOR = 800;              // 22 stage units a metre; the line of play
  const G = 0.5 * DRUM.G0;                           // the Hollow floor: half a g
  const REL_Y = 1.8;                                 // the ball leaves the hand here, m
  const VMAX = 22, VMIN = 2.5, DRAG_FULL = 380;      // m/s; a drag of DRAG_FULL units is a full throw
  const HOOP_Y = 3, HOOP_HALF = 0.45, BALL_R = 0.11, RIM_W = 2 * BALL_R;
  const DEF_X = 11, DEF_REACH = 2.6, DEF_IDLE = 15.6, DEF_H = 2.1;
  const JUMP_V = 3.0, JUMP_T = JUMP_V / G, JUMP_H = JUMP_V * JUMP_V / (2 * G);   // the same leap goes twice as high at half a g
  const HOOPS = [
    { x: 12, side: 1, far: false }, { x: 20, side: 1, far: true },
    { x: -12, side: -1, far: false }, { x: -20, side: -1, far: true },
  ];
  const TOTAL = 12;
  const wx = (m) => CX + m * SC, wy = (m) => FLOOR - m * SC;
  const crossed = (a, b, X) => a !== b && (a - X) * (b - X) <= 0;

  // Twelve throws, alternating sides; each hoop lit three times; each side opens on its near hoop.
  function makeOrder(rng) {
    const first = rng.sign();
    const list = (side) => { const n = side > 0 ? 0 : 2, f = n + 1; return [n].concat(rng.shuffle([n, n, f, f, f])); };
    const A = list(first), B = list(-first), out = [];
    for (let i = 0; i < 6; i++) out.push(A[i], B[i]);
    return out;
  }

  // Fly a throw from the hand toward hoop x hx: where it crosses the hoop and the defender, and when.
  // spin false is the old pictures: a plain parabola at this place's weight.
  function simFly(vx, vy, hx, spin) {
    const p = { x: 0, y: REL_Y, vx, vy }, dir = Math.sign(hx);
    let defY = null, tDef = null, t = 0;
    for (let i = 0; i < 2400; i++) {
      const px = p.x, py = p.y;
      if (spin) spinStep(p, STEP, G); else { p.vy -= G * STEP; p.x += p.vx * STEP; p.y += p.vy * STEP; }
      t += STEP;
      const X = dir * DEF_X;
      if (defY === null && p.vx * dir > 0 && crossed(px, p.x, X)) { defY = py + (p.y - py) * (X - px) / (p.x - px); tDef = t; }
      if (p.vx * dir > 0 && crossed(px, p.x, hx)) return { y: py + (p.y - py) * (hx - px) / (p.x - px), defY, tDef, t };
      if (p.y <= BALL_R) return { y: null, defY, tDef, t };
    }
    return { y: null, defY, tDef, t };
  }

  function create(ctx) {
    const s = {
      t: 0, pt: 0, phase: "set", n: 0, done: false, score: 0,
      goals: 0, rims: 0, goalsS: 0, goalsA: 0, streak: 0,
      order: makeOrder(ctx.rng), log: [],
      ball: null, trail: [], traces: [], trace: null, ghost: null,
      aim: { on: false, sx: 0, sy: 0, x: 0, y: 0 },
      kb: { on: false, ang: 0.62, sp: 11 },
      defs: [{ side: 1, x: DEF_IDLE, jy: 0, jv: 0 }, { side: -1, x: DEF_IDLE, jy: 0, jv: 0 }],
      jumpAt: -1, swingT: 9, cheer: 0, sway: 0, flash: null,
      saidS: false, saidA: false, saidStart: false,
      parts: new Parts(240), notes: new Notes(), bp: null,
    };
    if (HOOPS[s.order[0]].side < 0) s.kb.ang = Math.PI - s.kb.ang;
    return s;
  }

  const hoopOf = (s) => HOOPS[s.order[Math.min(s.n, TOTAL - 1)]];

  // The throw a drag describes: back from where the finger went down, the ball goes the other way.
  function dragThrow(a) {
    const dx = a.sx - a.x, dy = a.y - a.sy;           // world up is stage up
    const len = Math.hypot(dx, dy);
    const sp = Math.min(VMAX, len / DRAG_FULL * VMAX);
    let ang = Math.atan2(dy, dx);
    if (ang < 0) ang = dx >= 0 ? 0 : Math.PI;         // never into the ground
    return { vx: sp * Math.cos(ang), vy: sp * Math.sin(ang), sp, ang };
  }
  function kbThrow(kb) { return { vx: kb.sp * Math.cos(kb.ang), vy: kb.sp * Math.sin(kb.ang), sp: kb.sp, ang: kb.ang }; }
  function currentAim(s) {
    if (s.aim.on) return dragThrow(s.aim);
    if (s.kb.on && (s.phase === "set" || s.phase === "aim")) return kbThrow(s.kb);
    return null;
  }

  function throwBall(s, v, ctx) {
    const h = hoopOf(s);
    const dir = v.vx > 0.01 ? 1 : v.vx < -0.01 ? -1 : h.side;
    s.ball = { x: 0, y: REL_Y, vx: v.vx, vy: v.vy, t: 0, state: "air", res: null, resT: 0, landed: false, dir, spinA: 0 };
    s.trace = { dir, pts: [[0, REL_Y]] }; s.traces.push(s.trace);
    s.trail = []; s.phase = "fly"; s.pt = 0; s.swingT = 0; s.lastV = v;
    s.jumpAt = -1;
    if (h.far && dir === h.side) {
      const r = simFly(v.vx, v.vy, h.x, true);
      if (r.tDef !== null && r.defY < DEF_REACH + JUMP_H + 1.2) s.jumpAt = Math.max(0.12, r.tDef - JUMP_T);
    }
    ctx.sfx.whoosh(0.5 + v.sp / 22);
    ctx.sfx.tone({ f: 260 + v.sp * 12, f1: 140, dur: 0.08, vol: 0.07 });
  }

  function resolve(s, word, ctx, at) {
    const b = s.ball, h = hoopOf(s);
    b.res = word; b.resT = 0;
    const good = word === "goal" || word === "rim";
    s.log.push({ res: word, side: h.side, far: h.far });
    if (word === "goal") {
      s.goals++; if (b.dir > 0) s.goalsS++; else s.goalsA++;
      s.streak++; s.cheer = 1; s.flash = { hoop: h, t: 0 };
      ctx.sfx.chime(Math.min(10, 2 + s.streak));
      ctx.sfx.cheer(0.5 + 0.09 * s.goals);
      for (let i = 0; i < 22; i++) {
        s.parts.add({ x: wx(h.x), y: wy(HOOP_Y), vx: ctx.rng.range(-110, 110) + h.side * 70, vy: -ctx.rng.range(40, 230), g: 380, life: ctx.rng.range(0.6, 1.1), r: ctx.rng.range(2.5, 4.5), col: i % 2 ? PAPER : s.palAL });
      }
    } else if (word === "rim") {
      s.rims++; s.streak = 0; s.cheer = Math.max(s.cheer, 0.35);
      ctx.sfx.clack(); ctx.sfx.good();
    } else {
      s.streak = 0;
      if (word === "blocked") ctx.sfx.thud(0.6);
      ctx.sfx.miss();
    }
    s.score = s.goals + 0.4 * s.rims;
    const nx = at ? at[0] : wx(h.x), ny = at ? at[1] : wy(HOOP_Y) - 44;
    s.notes.add(word, clamp(nx, 80, 920), ny, { good, size: word === "goal" ? 54 : 42, life: 1.3, col: word === "goal" ? PAPER : good ? s.palAL : shade(PAPER, -0.25) });
    // the lesson, once each way
    if (b.dir > 0 && !s.saidS) { s.saidS = true; ctx.say("Spin sinks.", 2.6); }
    else if (b.dir < 0 && !s.saidA) { s.saidA = true; ctx.say("Anti floats.", 2.6); }
  }

  function nextThrow(s, ctx) {
    const b = s.ball;
    if (b) s.ghost = { x: b.x, y: b.y, t: 0 };
    s.ball = null; s.trail = []; s.trace = null; s.n++; s.pt = 0; s.kb.on = false;
    if (s.n >= TOTAL) {
      s.phase = "end"; s.cheer = 1;
      // the Pack howls: six voices climbing together, and the crowd behind them
      const base = [-21, -17, -14, -9, -5, -2];
      for (let i = 0; i < 6; i++) ctx.sfx.tone({ f: 440 * Math.pow(2, base[i] / 12), f1: 440 * Math.pow(2, (base[i] + 5) / 12), type: "sawtooth", dur: 1.5, vol: 0.035, attack: 0.3, lp: 1500, at: i * 0.03 });
      ctx.sfx.cheer(0.9 + 0.06 * s.goals);
      return;
    }
    if (s.n === 6) { s.phase = "half"; ctx.say("Six more.", 2.4); ctx.sfx.bell(0); }
    else s.phase = "set";
    const h = hoopOf(s);
    if (Math.sign(Math.cos(s.kb.ang)) !== h.side) s.kb.ang = Math.PI - s.kb.ang;
  }

  function update(s, dt, inp, ctx) {
    s.t += dt; s.pt += dt;
    s.palAL = ctx.pal.aL;
    s.parts.update(dt); s.notes.update(dt);
    s.cheer = Math.max(0, s.cheer - dt * 0.55);
    s.swingT += dt;
    if (s.flash) { s.flash.t += dt; if (s.flash.t > 0.8) s.flash = null; }
    if (s.ghost) { s.ghost.t += dt; if (s.ghost.t > 0.6) s.ghost = null; }
    const h = hoopOf(s);
    const inAir = s.ball && s.ball.state === "air" && !s.ball.landed;
    s.sway = approach(s.sway, inAir ? 1 : (s.phase === "half" || s.phase === "end") ? 0.8 : 0.15, dt * 2);
    if (!s.saidStart) { s.saidStart = true; ctx.say("Drag back and let go. The dotted line is where the old pictures say it goes.", 6); }

    // the defenders: one each side, out in front of the far hoop when it is lit, jumping as the ball comes
    for (const d of s.defs) {
      const active = s.phase !== "end" && h.far && h.side === d.side;
      d.x = approach(d.x, active ? DEF_X : DEF_IDLE, 12 * dt);
      if (active && s.phase === "fly" && s.jumpAt >= 0 && s.ball && s.ball.t >= s.jumpAt && d.jy === 0 && d.jv === 0) { d.jv = JUMP_V; s.jumpAt = -1; ctx.sfx.step(); }
      if (d.jv !== 0 || d.jy > 0) { d.jv -= G * dt; d.jy += d.jv * dt; if (d.jy <= 0) { d.jy = 0; d.jv = 0; } }
    }

    ctx.hud.set("throw " + Math.min(TOTAL, s.n + 1) + " of " + TOTAL + "\n" + fmtG(G / DRUM.G0), "goals " + s.goals + (s.rims ? "\nrims " + s.rims : ""));

    if (s.phase === "end") { if (s.pt > 1.6) s.done = true; return; }
    if (s.phase === "half") { if (s.pt > 1.5) { s.phase = "set"; s.pt = 0; } return; }

    // --- aiming: drag from anywhere, or the arrows ---
    const canAim = s.phase === "set" || s.phase === "aim";
    // a finger already down when the ball comes back starts the drag where it is
    if (canAim && (inp.ptrPressed || (inp.ptrDown && !s.aim.on && !s.aim.held))) { s.aim.on = true; s.aim.held = true; s.aim.sx = inp.x; s.aim.sy = inp.y; s.kb.on = false; ctx.sfx.tick(); }
    if (!inp.ptrDown) s.aim.held = false;
    if (s.aim.on) {
      s.aim.x = inp.x; s.aim.y = inp.y;
      if (inp.ptrReleased || !inp.ptrDown) {
        s.aim.on = false;
        const v = dragThrow(s.aim);
        if (v.sp >= VMIN) throwBall(s, v, ctx);
      }
    }
    if (canAim && (inp.left || inp.right || inp.up || inp.dn)) {
      s.kb.on = true; s.aim.on = false;
      if (inp.left) s.kb.ang = Math.min(Math.PI, s.kb.ang + 0.8 * dt);
      if (inp.right) s.kb.ang = Math.max(0, s.kb.ang - 0.8 * dt);
      if (inp.up) s.kb.sp = Math.min(VMAX, s.kb.sp + 5 * dt);
      if (inp.dn) s.kb.sp = Math.max(VMIN, s.kb.sp - 5 * dt);
    }
    if (canAim && inp.actPressed) { s.kb.on = true; throwBall(s, kbThrow(s.kb), ctx); }

    if (s.phase === "set") { if (s.pt > 0.4) { s.phase = "aim"; s.pt = 0; } return; }
    if (s.phase !== "fly") return;

    // --- the ball: spinStep and nothing else, then a bounce and a roll ---
    const b = s.ball;
    b.t += dt;
    if (b.state === "air") {
      const px = b.x, py = b.y;
      spinStep(b, dt, G);
      b.spinA += dt * (b.vx * 1.2);
      if (!b.res && b.vx * h.side > 0) {
        if (h.far && crossed(px, b.x, h.side * DEF_X)) {
          const y = py + (b.y - py) * (h.side * DEF_X - px) / (b.x - px);
          const d = s.defs[h.side > 0 ? 0 : 1];
          if (y < DEF_REACH + d.jy + BALL_R) {
            b.x = px; b.vx = -0.3 * b.vx; b.vy = Math.max(0.6, Math.abs(b.vy) * 0.3);
            resolve(s, "blocked", ctx, [wx(h.side * DEF_X), wy(DEF_REACH + d.jy) - 50]);
          }
        }
        if (!b.res && crossed(px, b.x, h.x)) {
          const y = py + (b.y - py) * (h.x - px) / (b.x - px), dy = y - HOOP_Y;
          if (Math.abs(dy) <= HOOP_HALF) resolve(s, "goal", ctx);
          else if (Math.abs(dy) <= HOOP_HALF + RIM_W) {
            resolve(s, "rim", ctx);
            b.x = px; b.vx = -0.25 * b.vx;
            b.vy = dy > 0 ? Math.abs(b.vy) * 0.3 + 1.4 : -Math.abs(b.vy) * 0.3 - 0.4;
            s.flash = { hoop: h, t: 0.4 };
          } else resolve(s, dy < 0 ? "short" : "long", ctx);
        }
      }
      if (s.trace && !b.landed) {
        const L = s.trace.pts[s.trace.pts.length - 1];
        if (Math.hypot(b.x - L[0], b.y - L[1]) >= 0.42) s.trace.pts.push([b.x, b.y]);
      }
      if (b.y <= BALL_R) {
        b.y = BALL_R;
        const hard = Math.min(1, Math.abs(b.vy) / 8);
        if (!b.landed) {
          b.landed = true;
          if (!b.res) {
            const wrong = b.dir !== h.side;
            resolve(s, wrong ? "wrong way" : "short", ctx, [wx(b.x), FLOOR - 80]);
          }
        }
        if (hard > 0.12) {
          ctx.sfx.thud(0.25 + 0.5 * hard);
          for (let i = 0; i < 6; i++) s.parts.add({ x: wx(b.x), y: FLOOR + 2, vx: ctx.rng.range(-60, 60) + b.vx * 6, vy: -ctx.rng.range(10, 50), g: 160, life: 0.5, r: 3, col: shade(PAPER, -0.35), a: 0.6, grow: 1 });
        }
        b.vy = -b.vy * 0.45; b.vx *= 0.75;
        if (b.vy < 0.9) { b.state = "roll"; b.vy = 0; }
      }
    } else {
      b.vx = approach(b.vx, 0, 1.4 * dt); b.x += b.vx * dt; b.spinA += dt * b.vx / BALL_R * 0.2;
    }
    s.trail.push([b.x, b.y]); if (s.trail.length > 12) s.trail.shift();
    if (!b.res && b.t > 14) resolve(s, "long", ctx);
    if (b.res) {
      b.resT += dt;
      const settled = b.state === "roll" || Math.abs(b.x) > 24;
      if ((b.resT > 0.85 && settled) || b.resT > 1.6) nextThrow(s, ctx);
    }
  }

  /* ---- drawing ---- */
  function antiMark(g, x, y, col, size) {
    const s = size || 26;
    sign(g, "ANTI", x, y + s * 0.35, s, col, "center", 700);
    const ax = x - s * 1.55;
    poly(g, [ax, y - s * 0.34, ax - s * 0.85, y, ax, y + s * 0.34], col);
  }

  // the Pack, in sixes: each six sways together while the ball is up, and they throw their arms up for a goal
  function pack(g, y, h, groups, x0, x1, s, seed, cols, cheer) {
    const gw = (x1 - x0) / groups;
    for (let gi = 0; gi < groups; gi++) {
      const lean = s.sway * 0.13 * Math.sin(s.t * 2.3 + gi * 0.8);
      for (let j = 0; j < 6; j++) {
        const i = gi * 6 + j, p = someone(seed + i, cols);
        const x = x0 + gi * gw + gw * 0.17 + j * (gw * 0.66 / 5) + (p.ph - 0.5) * 3;
        const up = cheer > p.ph;
        person(g, x, y + (p.ph - 0.5) * 3, h * p.hk, { shirt: p.shirt, skin: p.skin, hair: p.hair, pose: up ? "cheer" : "stand", t: s.t * (0.8 + p.ph * 0.5) + p.ph, lean });
      }
    }
  }

  function drawBack(g, s, pal) {
    const HZ = 575;
    hollowBack(g, { pal, sun: 0.15, far: "#1d3d58", farDots: "#9cc2d6", near: shade(pal.b, -0.35), near2: shade(pal.b, -0.12), horizon: HZ, seed: 11 });
    // after dusk: the air of the Hollow going dark blue above the lamps
    const veil = g.createLinearGradient(0, 0, 0, HZ);
    veil.addColorStop(0, "rgba(6,12,30,0.62)"); veil.addColorStop(0.7, "rgba(12,22,44,0.6)"); veil.addColorStop(1, "rgba(16,26,46,0.3)");
    g.fillStyle = veil; g.fillRect(0, 0, SW, HZ + 20);
    // the end wall, 1.9 km off along the axis: its terraces ring the Spindle, lit for the evening
    const ex = 500, ey = 330, R0 = 250, r = makeRng(1111);
    for (const f of [0.9, 0.67, 0.5, 0.25, 0.1]) {
      const n = Math.round(70 * f) + 8;
      for (let i = 0; i < n; i++) {
        const th = (i + r() * 0.6) / n * TAU;
        const x = ex + Math.cos(th) * R0 * f, y = ey + Math.sin(th) * R0 * f;
        if (y > HZ - 50) continue;
        disc(g, x, y, 1.2 + r() * 1.1, r() < 0.5 ? "rgba(255,226,170,0.5)" : "rgba(190,210,230,0.32)");
      }
    }
    glow(g, ex, ey, 26, "#fff3d6", 0.3); disc(g, ex, ey, 2.2, "#fff3d6");
    // lamps on the land curling up both sides: paths, porches, the other grounds
    for (let k = 0; k < 6; k++) {
      for (const side of [-1, 1]) {
        for (let i = 0; i < 20; i++) {
          const t = r();
          if (r() < 0.3) continue;
          const a = HZ - 205 + k * 34, c = HZ - 30 + k * 24, e = HZ + 4 + k * 8;
          const y = (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * e;
          const x0 = 2 * (1 - t) * t * 190 + t * t * 500 - (1 - t) * (1 - t) * 20;
          disc(g, side > 0 ? x0 : SW - x0, y, 1.1 + r() * 1.2, r() < 0.7 ? "rgba(255,222,160,0.65)" : "rgba(255,255,255,0.4)");
        }
      }
    }
    // field lamps on masts at both ends: six lamps to a head
    for (const mx of [62, 938]) {
      seg(g, mx, 700, mx, 230, 7, mix(INK, pal.b, 0.35));
      fillRR(g, mx - 46, 200, 92, 46, 6, mix(INK, pal.b, 0.3));
      glow(g, mx, 224, 240, "#fff1cf", 0.16);
      for (let i = 0; i < 6; i++) lamp(g, mx - 31 + (i % 3) * 31, 213 + Math.floor(i / 3) * 21, 7, "#fff2d0", 3);
    }
    // the stand behind the pitch, and the Pack on it in sixes
    const STAND = 585, WALL = 704, PITCH = 776;
    g.fillStyle = mix(INK, pal.b, 0.3); g.fillRect(-10, STAND, SW + 20, WALL - STAND);
    const cols = [pal.a, pal.a, pal.aD, pal.b, pal.bL, pal.a];
    const cheerUp = s.phase === "end" ? 1 : s.cheer * (0.4 + 0.6 * Math.min(1, s.goals / 8));
    const rows = [[624, 23, 400, 0.5], [662, 26, 300, 0.38], [700, 29, 100, 0.26]];
    for (const [fy, hh, seed, dim] of rows) {
      g.fillStyle = mix(INK, pal.b, 0.36); g.fillRect(-10, fy - 2, SW + 20, 5);
      pack(g, fy, hh, 7, -20 + (seed % 200) * 0.2, SW + 20, s, seed, cols, cheerUp);
      g.fillStyle = alpha(INK, dim); g.fillRect(-10, STAND, SW + 20, fy + 3 - STAND);
    }
    // the stand's front wall, with the Pack's rail along the top
    g.fillStyle = mix(INK, pal.b, 0.2); g.fillRect(-10, WALL, SW + 20, PITCH - WALL);
    g.fillStyle = pal.aD; g.fillRect(-10, WALL - 4, SW + 20, 9);
    for (const x of [130, 370, 630, 870]) sign(g, x < 500 ? "WOLF CREWS" : "THE PACK", x, 750, 30, alpha(pal.bL, 0.2), "center", 800);
    // the pitch: mown stripes in perspective, lit by the lamps
    for (let i = -1; i < 12; i++) {
      const xa = i * 90, xb = (i + 1) * 90;
      const sp = (x) => 500 + (x - 500) * 1.4;
      poly(g, [xa, PITCH, xb, PITCH, sp(xb), SH, sp(xa), SH], i % 2 ? "#2b4136" : "#2f493b");
    }
    glow(g, 150, 880, 400, "#fff1cf", 0.12); glow(g, 850, 880, 400, "#fff1cf", 0.12);
    const line = alpha(PAPER, 0.4);
    seg(g, -10, PITCH + 8, SW + 10, PITCH + 8, 3, line);
    seg(g, -10, 982, SW + 10, 982, 4, line);
    seg(g, 500, PITCH + 8, 500, 982, 3, line);
    g.beginPath(); g.ellipse(500, FLOOR + 22, 175, 40, 0, 0, TAU); g.lineWidth = 3; g.strokeStyle = line; g.stroke();
    g.beginPath(); g.ellipse(500, FLOOR + 2, 16, 5, 0, 0, TAU); g.fillStyle = alpha(PAPER, 0.75); g.fill();       // the centre spot
    // which way is which
    spinMark(g, 760, 945, alpha(PAPER, 0.62), 1, 28);
    antiMark(g, 240, 945, alpha(PAPER, 0.62), 28);
  }

  function drawHoop(g, s, h, pal, lit) {
    const x = wx(h.x), y = wy(HOOP_Y), ry = HOOP_HALF * SC + 2;
    const postCol = mix(INK, pal.b, 0.75);
    seg(g, x, FLOOR, x, y + ry + 2, 5, postCol);
    fillRR(g, x - 9, FLOOR - 4, 18, 6, 2, postCol);
    const fl = s.flash && s.flash.hoop === h ? 1 - s.flash.t / 0.8 : 0;
    if (lit) glow(g, x, y, 70 + 40 * fl, pal.a, 0.45 + 0.4 * fl);
    g.beginPath(); g.ellipse(x, y, 6.5, ry, 0, 0, TAU);
    g.lineWidth = lit ? 5 : 4;
    g.strokeStyle = fl > 0 ? mix(pal.aL, PAPER, fl) : lit ? pal.aL : alpha(shade(pal.b, 0.25), 0.8);
    g.stroke();
    mono(g, Math.abs(h.x) + " m", x, FLOOR + 30, 22, alpha(PAPER, lit ? 0.8 : 0.45));
    if (lit && (s.phase === "set" || s.phase === "aim")) {
      const by = y - ry - 22 - 5 * Math.sin(s.t * 5);
      poly(g, [x - 11, by - 16, x + 11, by - 16, x, by], pal.aL);
    }
  }

  function drawTrace(g, tr, col, a, r) {
    g.fillStyle = alpha(col, a);
    for (const p of tr.pts) { g.beginPath(); g.arc(wx(p[0]), wy(p[1]), r, 0, TAU); g.fill(); }
  }

  function drawBall(g, x, y, r, spinA, col) {
    disc(g, x, y, r, PAPER);
    g.save(); g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip();
    const k = Math.sin(spinA);
    g.beginPath(); g.ellipse(x + k * r * 0.5, y, r * Math.abs(Math.cos(spinA)) * 0.45 + 1.2, r * 1.05, 0, 0, TAU);
    g.lineWidth = r * 0.36; g.strokeStyle = col; g.stroke();
    g.restore();
  }

  function draw(s, g, ctx) {
    const pal = ctx.pal, h = hoopOf(s);
    drawBack(g, s, pal);

    // every throw so far: spinward in crimson, anti in slate. By the end the picture is the lesson.
    for (const tr of s.traces) {
      const cur = tr === s.trace;
      drawTrace(g, tr, tr.dir > 0 ? pal.aL : shade(pal.b, 0.62), cur ? 0.95 : 0.6, cur ? 4 : 3.3);
    }

    for (const hp of HOOPS) drawHoop(g, s, hp, pal, hp === h && s.phase !== "end" && s.phase !== "half");

    // the defenders, one each side
    for (const d of s.defs) {
      const active = h.far && h.side === d.side && s.phase !== "end";
      const x = wx(d.side * d.x), y = FLOOR - d.jy * SC;
      if (d.jy > 0) { g.beginPath(); g.ellipse(x, FLOOR + 2, 12, 3, 0, 0, TAU); g.fillStyle = alpha(INK, 0.3); g.fill(); }
      const up = active && Math.abs(d.x - DEF_X) < 0.6;
      person(g, x, y, DEF_H * SC, {
        view: "side", face: -d.side, shirt: pal.bL, legs: shade(pal.b, -0.5), sash: PAPER, skin: SKINS[d.side > 0 ? 4 : 1], hair: HAIRS[d.side > 0 ? 0 : 4],
        pose: Math.abs(d.x - (active ? DEF_X : DEF_IDLE)) > 0.05 ? "run" : "stand", t: s.t * 1.4,
        arms: up ? [[Math.PI - 0.12 + 0.05 * Math.sin(s.t * 3), 0.05], [Math.PI + 0.1, -0.05]] : null,
      });
    }

    // the thrower, in a Wolf sash, arm following the aim
    const aim = currentAim(s);
    const face = aim ? (Math.cos(aim.ang) >= 0 ? 1 : -1) : s.ball && s.swingT < 0.6 ? s.ball.dir : h.side;
    const TH = 1.85 * SC, shX = CX + face * 0.02 * TH, shY = FLOOR - 0.71 * TH;
    let hand = null;
    if (aim) {
      const k = 0.55 + 0.45 * aim.sp / VMAX;
      hand = [shX - Math.cos(aim.ang) * 0.3 * TH * k, shY + Math.sin(aim.ang) * 0.3 * TH * k + 2];
    } else if (s.swingT < 0.45 && s.lastV) {
      const k = easeOut(s.swingT / 0.2);
      hand = [shX + Math.cos(s.lastV.ang) * 0.31 * TH * k, shY - Math.sin(s.lastV.ang) * 0.31 * TH * k + (1 - k) * 6];
    } else if (s.phase === "set" || s.phase === "aim") hand = [CX + face * 0.13 * TH, FLOOR - 0.6 * TH];
    const me = person(g, CX, FLOOR, TH, {
      view: "side", face, shirt: PAPER, legs: pal.b, sash: pal.a, skin: SKINS[2], hair: HAIRS[1],
      pose: s.phase === "end" ? "cheer" : "stand", t: s.t, handTo: hand, lean: aim ? -face * 0.06 * aim.sp / VMAX : 0,
    });
    if (s.phase === "set" || s.phase === "aim") drawBall(g, me.hx0, me.hy0 - 2, 6, 0.4, pal.a);

    // the old pictures: where the throw would go with no spin
    if (aim && aim.sp >= VMIN * 0.6) {
      const p = { x: 0, y: REL_Y, vx: aim.vx, vy: aim.vy };
      let acc = 0, lx = 0, ly = REL_Y;
      g.fillStyle = alpha(PAPER, 0.85);
      for (let i = 0; i < 1600; i++) {
        p.vy -= G * STEP; p.x += p.vx * STEP; p.y += p.vy * STEP;
        acc += Math.hypot(p.x - lx, p.y - ly); lx = p.x; ly = p.y;
        if (acc >= 0.62) { acc = 0; g.beginPath(); g.arc(wx(p.x), wy(p.y), 3.4, 0, TAU); g.fill(); }
        if (p.y <= BALL_R || Math.abs(p.x) > 24) break;
      }
    }

    // the ball and its short trail
    if (s.ghost) { g.globalAlpha = 1 - s.ghost.t / 0.6; drawBall(g, wx(s.ghost.x), wy(s.ghost.y) - 1, 7.5, 0, pal.a); g.globalAlpha = 1; }
    const b = s.ball;
    if (b) {
      const r = lerp(6, 8, smooth(0, 0.25, b.t));
      const hy = Math.max(0, b.y);
      g.beginPath(); g.ellipse(wx(b.x), FLOOR + 3, Math.max(3, 9 - hy * 0.3), 2.6, 0, 0, TAU); g.fillStyle = alpha(INK, clamp(0.4 - hy * 0.02, 0.08, 0.4)); g.fill();
      for (let i = 0; i < s.trail.length - 1; i++) {
        const k = i / s.trail.length;
        disc(g, wx(s.trail[i][0]), wy(s.trail[i][1]), r * (0.35 + 0.55 * k), alpha(b.dir > 0 ? pal.aL : shade(pal.b, 0.5), 0.12 + 0.3 * k));
      }
      const by = wy(b.y);
      if (by < 18) {                      // up out of sight: show where, and how high
        poly(g, [wx(b.x) - 12, 34, wx(b.x) + 12, 34, wx(b.x), 16], PAPER);
        mono(g, Math.round(b.y) + " m", wx(b.x), 62, 22, alpha(PAPER, 0.8));
      } else drawBall(g, wx(b.x), by, r, b.spinA, pal.a);
    }

    s.parts.draw(g);
    s.notes.draw(g);

    // two sixes: one pip a throw
    for (let i = 0; i < TOTAL; i++) {
      const x = 500 + (i - 5.5) * 34 + (i < 6 ? -16 : 16), y = 152;
      const L = s.log[i], hp = HOOPS[s.order[i]], col = hp.side > 0 ? pal.aL : shade(pal.b, 0.45);
      if (L) {
        if (L.res === "goal") disc(g, x, y, 12, col);
        else if (L.res === "rim") { ring(g, x, y, 10, 3.5, col); disc(g, x, y, 4, col); }
        else disc(g, x, y, 4, alpha(PAPER, 0.4));
      } else if (i === s.n && s.phase !== "end") ring(g, x, y, 11 + Math.sin(s.t * 6) * 1.4, 3.5, col);
      else ring(g, x, y, 8, 2.5, alpha(col, 0.45));
    }

    // the sling: where the drag began, and how hard
    if (s.aim.on && aim) {
      seg(g, s.aim.sx, s.aim.sy, s.aim.x, s.aim.y, 3, alpha(PAPER, 0.3));
      ring(g, s.aim.sx, s.aim.sy, 16, 3, alpha(PAPER, 0.55));
      disc(g, s.aim.x, s.aim.y, 9, alpha(PAPER, 0.5));
      mono(g, Math.round(aim.sp) + " m/s", s.aim.sx, s.aim.sy - 32, 36, alpha(PAPER, 0.9));
    } else if (aim) mono(g, Math.round(aim.sp) + " m/s", CX, FLOOR - 130, 36, alpha(PAPER, 0.9));

    if (s.phase === "half") {
      g.globalAlpha = smooth(0, 0.3, s.pt) * (1 - smooth(1.2, 1.5, s.pt));
      board(g, 500, 430, 340, 110, "HALF TIME", s.goals + (s.goals === 1 ? " goal" : " goals") + " from six");
      g.globalAlpha = 1;
    }
    if (s.phase === "end") {
      g.globalAlpha = smooth(0, 0.5, s.pt);
      sign(g, "HOWL", 500, 470, 170, alpha(pal.aL, 0.92), "center", 800);
      g.globalAlpha = 1;
    }
  }

  /* ---- the house plays: search for a throw that goes through the hoop and clears the defender ---- */
  function plan(h, spin, style) {
    let best = null;
    const tryAt = (v, ang) => simFly(v * Math.cos(ang) * h.side, v * Math.sin(ang), h.x, spin);
    for (let a = 4; a <= 72; a += 2) {
      const ang = a * Math.PI / 180;
      const top = tryAt(VMAX, ang);
      if (top.y === null || top.y < HOOP_Y) continue;
      let lo = 2, hi = VMAX;
      for (let k = 0; k < 26; k++) {
        const m = (lo + hi) / 2, r = tryAt(m, ang);
        if (r.y === null || r.y < HOOP_Y) lo = m; else hi = m;
      }
      const v = (lo + hi) / 2, r = tryAt(v, ang);
      if (r.y === null) continue;
      if (h.far && (r.defY === null || r.defY < DEF_REACH + JUMP_H + BALL_R + 0.3)) continue;
      const rv = tryAt(v + 0.25, ang), ra = tryAt(v, ang + 0.02);
      const sv = rv.y === null ? 9 : Math.abs(rv.y - r.y) / 0.25;
      const sa = ra.y === null ? 9 : Math.abs(ra.y - r.y) / 0.02 * Math.PI / 180;
      // the house throws like a spinballer: arcs at the near hoops, lobs at the far ones
      const cost = Math.hypot(sv, sa * 2.2) + (v > VMAX - 0.6 ? 1 : 0) + style * Math.abs(a - (!h.far ? 34 : h.side > 0 ? 36 : 46));
      if (!best || cost < best.cost) best = { v, ang, cost };
    }
    return best;
  }

  function bot(s, b, ctx) {
    const sk = ctx.skill;
    if (s.phase !== "set" && s.phase !== "aim") { b.x = 500; b.y = 500; return; }
    if (!s.bp || s.bp.n !== s.n) {
      const h = hoopOf(s);
      const naive = ctx.rng() < (1 - sk) * 0.6;      // a newcomer aims along the dotted line
      const style = 0.02 + 0.1 * sk * sk;
      const p = plan(h, !naive, style) || plan(h, false, style) || { v: 11, ang: 0.7 };
      const v = clamp(p.v + ctx.rng.range(-1, 1) * (1 - sk) * 2.2, VMIN + 0.5, VMAX);
      const ang = clamp(p.ang + ctx.rng.range(-1, 1) * (1 - sk) * 8 * Math.PI / 180, 0.02, 1.5);
      const len = v / VMAX * DRAG_FULL;
      const sx = 500 + h.side * 160, sy = 380;
      s.bp = { n: s.n, t: 0, sx, sy, ex: sx - Math.cos(ang) * h.side * len, ey: sy + Math.sin(ang) * len, wait: 0.3 + (1 - sk) * 0.6 + ctx.rng() * 0.2 };
    }
    const bp = s.bp;
    bp.t += STEP;
    const t = bp.t - bp.wait;
    if (t < 0) { b.x = bp.sx; b.y = bp.sy; return; }
    const k = easeInOut(t / 0.6);
    b.x = lerp(bp.sx, bp.ex, k); b.y = lerp(bp.sy, bp.ey, k);
    b.down = t < 0.6 + 0.2;
  }

  registerEvent({
    id: "wolf", hour: 11, name: "Spinball",
    place: "The Spinball Fields, on the Hollow floor in Wolf · deck 376, 0.50 g",
    intro: "Spinball is Sorrel's game, and every child learns its rule before they can read: axis flies true, spin sinks, anti floats. Out here at half a g the floor moves at only 86 m/s, so a hard throw spinward gains a third of its weight and dives, and one thrown anti loses more than a quarter and sails. The first ten minutes of any game are adults throwing like children.",
    how: "Drag back from anywhere and let go to throw at the lit hoop. The dotted line is where the old pictures say it goes.",
    keys: "left and right to aim, up and down for power, Space to throw",
    marks: [4, 7, 10], unit: "points", fmt: (v) => String(Math.round(v * 10) / 10),
    result: (s) => s.goals + (s.goals === 1 ? " goal" : " goals") + " from 12, " + s.goalsS + " spinward and " + s.goalsA + " anti",
    create, update, draw, bot,
  });
})();
