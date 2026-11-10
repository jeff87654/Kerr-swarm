/* ---------- Moth: Crosswise ----------
   The Spindle by night: the sunline is down, the nets are drawn back, and the axis is open for 3.75 km.
   Within 75 m of it you weigh under 3% of a g, and people fly it in wing-sleeves with a hand lamp.
   Flying along the axis is easy. Flying across it is a lesson: the drum turns under you, so in the
   drum's own frame every sideways push curls antispinward, 6.5 degrees a second, whatever you do.
   On Moth's night the clubs hang twelve lamp hoops round the spar, each toward its own Hour, and the
   course threads them rival to rival, straight across: Hare to Stag, then a step anti to Otter and
   across again to Lark. The steps go anti because that is the way the curl carries you.
   In the cross-section (x, y metres from the axis; spinward is clockwise as drawn):
       ax = W^2 x + 2 W vy,   ay = W^2 y - 2 W vx        (axisStep in 05-drum.js) */
"use strict";
(function () {
  const ORDER = [1, 7, 6, 12, 11, 5, 4, 10, 9, 3, 2, 8];   // across to the rival, a step anti, across again
  const VZ = 6.5;            // m/s along the axis: the easy way
  const A_MAX = 2.2;         // m/s2: the hardest a flyer can push sideways
  const DRAG = 0.3;          // 1/s: the air
  const F = 520;             // focal length, stage units
  const CAM_BACK = 6.5;      // the eye rides this far behind the flyer, and a little above
  const VPX = 500, VPY = 455;
  const Z_WALL = 2300;       // the back wall, metres from the start
  const LEAD = 32, GAP_ACROSS = 34, GAP_STEP = 20;

  function create(ctx) {
    const hoops = [];
    let z = LEAD;
    for (let i = 0; i < ORDER.length; i++) {
      const h = ORDER[i], a = hourAngle(h);
      const R = i === 0 ? 5 : i % 2 === 1 ? 6.5 : 7.6;        // the step hoops hang a little further out, where the curl leaves you
      if (i > 0) z += (i % 2 === 1) ? GAP_ACROSS : GAP_STEP;
      hoops.push({ h, x: R * Math.sin(a), y: -R * Math.cos(a), z, r: i < 2 ? 3.0 : 2.5, state: 0, t: 0 });
    }
    // lamps on the Hollow's floor, 1.5 km out on every side: each Hour keeps its own kind of night
    const r = makeRng(4107), lamps = [];
    const dens = [0, 1.0, 0.8, 1.5, 0.55, 1.1, 0.45, 0.6, 1.0, 0.18, 1.7, 1.25, 0.5];
    for (let n = 1; n <= 12; n++) {
      const count = Math.round(42 * dens[n]);
      for (let i = 0; i < count; i++) {
        const tint = r() < 0.45 ? mix("#ffe2ad", lum(HOURS[n].a) > lum(HOURS[n].b) ? HOURS[n].a : HOURS[n].b, 0.55) : "#ffe2ad";
        lamps.push({ th: (n - 1 + r()) * TAU / 12, z: 950 + r() * (Z_WALL - 1000), R: 1500, s: 1.2 + r() * 1.5, col: tint });
      }
    }
    for (let i = 0; i < 26; i++) lamps.push({ th: (9 + r()) * TAU / 12, z: 1000 + r() * 1100, R: 1385 + r() * 70, s: 2 + r() * 1.2, col: "#e9a6cf", kite: r() * TAU });   // Moth's kite lamps over its lawns
    for (let i = 0; i < 120; i++) lamps.push({ th: i / 120 * TAU, z: Z_WALL - 420, R: 1500, s: 1.3, col: "#ffd9a0" });                                            // the Lamp Walk, right round the back Dim End
    const wardens = [];
    for (let i = 0; i < 16; i++) wardens.push({ th: r() * TAU, z: 70 + i * 34 + r() * 20 });
    const others = [];
    for (let i = 0; i < 9; i++) others.push({ th: r() * TAU, R: 17 + r() * 22, z: 60 + i * 55 + r() * 30, v: 2 + r() * 2 });
    const first = hoops[0];
    return {
      t: 0, hoops, next: 0, threaded: 0, brushed: 0, score: 0, done: false, endT: -1,
      f: { x: first.x * 0.25, y: first.y * 0.25 + 1.2, vx: 0, vy: 0, z: 0 },
      cam: { x: first.x * 0.25, y: first.y * 0.25 + 0.2 },
      thrust: { x: 0, y: 0 }, roll: 0, flap: 0, kb: false,
      lamps, wardens, others, trail: [], trailT: 0, notes: new Notes(), parts: new Parts(160), said: 0, crossed: false, bn: 0,
    };
  }

  function update(s, dt, inp, ctx) {
    s.t += dt;
    const f = s.f;
    s.notes.update(dt); s.parts.update(dt);

    // --- the push: toward where the player points, as hard as they point ---
    const fk = F / CAM_BACK, px = VPX + (f.x - s.cam.x) * fk, py = VPY + (f.y - s.cam.y) * fk;
    let tx = 0, ty = 0;
    if (inp.ax || inp.ay) { const m = Math.hypot(inp.ax, inp.ay); tx = inp.ax / m * A_MAX; ty = inp.ay / m * A_MAX; }
    else if (inp.ptrDown) {
      const dx = inp.x - px, dy = inp.y - py, m = Math.hypot(dx, dy);
      if (m > 18) { const k = A_MAX * Math.min(1, m / 270) / m; tx = dx * k; ty = dy * k; }
    }
    if (s.endT >= 0) { tx = 0; ty = 0; }
    s.thrust.x = lerp(s.thrust.x, tx, 1 - Math.exp(-dt * 14)); s.thrust.y = lerp(s.thrust.y, ty, 1 - Math.exp(-dt * 14));
    const push = Math.hypot(s.thrust.x, s.thrust.y) / A_MAX;
    s.flap += dt * (2 + 9 * push);
    s.roll = lerp(s.roll, clamp(s.thrust.x / A_MAX * 0.55 + f.vx * 0.04, -0.7, 0.7), 1 - Math.exp(-dt * 6));

    // --- the drum's part: thrown outward a little, and every sideways move bent ---
    axisStep(f, dt, s.thrust.x - DRAG * f.vx, s.thrust.y - DRAG * f.vy);
    f.z += VZ * dt;
    const rr = Math.hypot(f.x, f.y);
    if (rr < 0.75 && rr > 0) {                                  // the spar: you can't fly through it
      const nx = f.x / rr, ny = f.y / rr, vn = f.vx * nx + f.vy * ny;
      if (vn < 0) { f.vx -= 1.6 * vn * nx; f.vy -= 1.6 * vn * ny; ctx.sfx.thud(0.5); s.notes.add("the spar", px, py - 90, { good: false, size: 36 }); }
      f.x = nx * 0.75; f.y = ny * 0.75;
    }
    if (rr > 26) { const k = (rr - 26) * 0.5; f.vx -= f.x / rr * k * dt * 6; f.vy -= f.y / rr * k * dt * 6; }   // a warden's red lamp turns you back

    s.cam.x = lerp(s.cam.x, f.x, 1 - Math.exp(-dt * 9));
    s.cam.y = lerp(s.cam.y, f.y - 1.0, 1 - Math.exp(-dt * 9));
    s.trailT -= dt;
    if (s.trailT <= 0) { s.trailT = 0.07; s.trail.push({ x: f.x, y: f.y, z: f.z }); if (s.trail.length > 46) s.trail.shift(); }
    for (const o of s.others) o.z -= o.v * dt;
    if (push > 0.3 && ctx.rng() < dt * 6) ctx.sfx.noise({ f: 700, q: 0.7, dur: 0.16, vol: 0.022 * push, attack: 0.05 });

    // --- hoops ---
    for (const h of s.hoops) if (h.state) h.t += dt;
    const h = s.hoops[s.next];
    if (h && f.z >= h.z) {
      const d = Math.hypot(f.x - h.x, f.y - h.y), name = HOURS[h.h].name;
      if (d <= h.r) {
        h.state = 1; s.threaded++; s.score += 1; ctx.sfx.chime(s.threaded - 1); ctx.sfx.whoosh(0.7);
        s.notes.add(name, px, py - 110, { size: 54 });
        const P = PALS[h.h];
        for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; s.parts.add({ x: px + Math.cos(a) * 60, y: py + Math.sin(a) * 60, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, life: 0.6, r: 6, col: i % 2 ? P.a : P.b, drag: 2 }); }
      } else if (d <= h.r * 1.55) {
        h.state = 2; s.brushed++; s.score += 0.5; ctx.sfx.clack(); ctx.sfx.whoosh(0.5);
        s.notes.add("brushed", px, py - 110, { size: 40, good: false });
      } else {
        h.state = 3; ctx.sfx.miss();
        s.notes.add("wide of " + name, px, py - 110, { size: 36, good: false });
      }
      s.next++;
      if (s.next === 1) ctx.say("Now across the spar, to Stag. The drum turns under you: your path curls anti.", 4.5);
      else if (s.next === 3) ctx.say("Don't fight the curl. Let it carry you to the next lamp.", 3.6);
      else if (s.next === 7) ctx.say("Crosswise is the hard way. Most of Sorrel flies lengthwise, and says so.", 3.6);
      if (s.next >= s.hoops.length) { s.endT = 0; ctx.say(s.threaded >= 11 ? "Every lamp. Dusties all round." : "The back gate. Dusties all round.", 3); if (s.threaded >= 8) ctx.sfx.great(); }
    }
    if (s.said === 0 && s.t > 0.4) { s.said = 1; ctx.say("Hold and point: you push toward where you point. Thread the lit hoop.", 4); }
    if (s.endT >= 0) { s.endT += dt; if (s.endT > 1.7) s.done = true; }
    const cur = s.hoops[Math.min(s.next, s.hoops.length - 1)];
    ctx.hud.set("hoop " + Math.min(s.next + 1, 12) + " of 12\n" + HOURS[cur.h].name, "threaded " + s.threaded);
  }

  /* ---- drawing ---- */
  function drawFlyer(g, x, y, k, roll, flap, pal, push) {
    g.save(); g.translate(x, y); g.rotate(roll); g.scale(k, k);
    const beat = Math.sin(flap * TAU) * (0.1 + 0.22 * push);
    for (const sd of [-1, 1]) {          // wing-sleeves: fabric fins from wrist to hip
      g.beginPath(); g.moveTo(sd * 0.16, -0.2); g.lineTo(sd * 0.92, -0.34 + beat); g.lineTo(sd * 0.5, 0.16 + beat * 0.5); g.lineTo(sd * 0.13, 0.44); g.closePath();
      g.fillStyle = pal.a; g.fill();
      g.beginPath(); g.moveTo(sd * 0.16, -0.2); g.lineTo(sd * 0.92, -0.34 + beat); g.lineTo(sd * 0.72, -0.2 + beat * 0.85); g.lineTo(sd * 0.16, -0.06); g.closePath();
      g.fillStyle = pal.aL; g.fill();
      disc(g, sd * 0.92, -0.34 + beat, 0.055, SKINS[3]);
    }
    g.lineCap = "round";
    for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 0.08, 0.38); g.lineTo(sd * 0.11, 0.84); g.lineWidth = 0.13; g.strokeStyle = pal.bD; g.stroke(); disc(g, sd * 0.11, 0.88, 0.075, INK); }
    fillRR(g, -0.19, -0.3, 0.38, 0.76, 0.16, pal.b);
    disc(g, 0, -0.42, 0.135, HAIRS[1]);
    g.restore();
    // the hand lamp: every flyer carries one
    const lx = x + Math.cos(roll) * 0.92 * k - Math.sin(roll) * (-0.34 + beat) * k, ly = y + Math.sin(roll) * 0.92 * k + Math.cos(roll) * (-0.34 + beat) * k;
    lamp(g, lx, ly, 5.5, "#ffe9b8", 8);
  }

  function draw(s, g, ctx) {
    const pal = ctx.pal, f = s.f, cx = s.cam.x, cy = s.cam.y, cz = f.z - CAM_BACK;
    g.fillStyle = "#06090f"; g.fillRect(0, 0, SW, SH);

    // the back wall: thirty tiers of terrace lamps, and the Hollow's floor coming to meet it
    const dzw = Z_WALL - cz, kw = F / dzw, wx = VPX - cx * kw, wy = VPY - cy * kw;
    const gr = g.createRadialGradient(wx, wy, 0, wx, wy, 1500 * kw);
    gr.addColorStop(0, "#131a2a"); gr.addColorStop(1, "#0a0e18");
    disc(g, wx, wy, 1500 * kw, gr);
    g.save(); g.lineCap = "round";
    for (let j = 0; j < 15; j++) {
      const rj = (1500 - j * 92) * kw; if (rj < 8) break;
      g.beginPath(); g.arc(wx, wy, rj, 0, TAU);
      g.setLineDash([0.1, 7 + (j % 3) * 2.5]); g.lineDashOffset = j * 3.1;
      g.lineWidth = 2.6 - j * 0.07; g.strokeStyle = alpha(j % 4 === 0 ? "#fff1cf" : "#ffd9a0", 0.62 - j * 0.02); g.stroke();
    }
    g.restore();
    glow(g, wx, wy, 34, "#ffdca0", 0.5); ring(g, wx, wy, 75 * kw, 1, alpha(PAPER, 0.25));

    // the floor's lamps, Hour by Hour
    for (const L of s.lamps) {
      const dz = L.z - cz; if (dz < 880) continue;
      const k = F / dz, R = L.R * k; if (R > 760) continue;
      const th = L.kite !== undefined ? L.th + Math.sin(s.t * 0.4 + L.kite) * 0.004 : L.th;
      const x = VPX + R * Math.sin(th) - cx * k, y = VPY - R * Math.cos(th) - cy * k;
      g.globalAlpha = clamp((dz - 880) / 160, 0, 1) * (L.kite !== undefined ? 0.75 + 0.25 * Math.sin(s.t * 2 + L.kite) : 0.9);
      disc(g, x, y, L.s, L.col);
    }
    g.globalAlpha = 1;
    // Hour names round the rim of the wall, so you can tell whose lamps are whose
    for (let n = 1; n <= 12; n++) arcText(g, HOURS[n].name.toUpperCase(), wx, wy, 1500 * kw + 22, hourAngle(n), 17, alpha(lum(HOURS[n].a) > 0.12 ? shade(HOURS[n].a, 0.25) : shade(HOURS[n].b, 0), 0.8), 700);

    // wardens with red lamps keep the edge, seventy-five metres out
    for (const w of s.wardens) {
      const dz = w.z - cz; if (dz < 12) continue;
      const k = F / dz, x = VPX + (75 * Math.sin(w.th) - cx) * k, y = VPY + (-75 * Math.cos(w.th) - cy) * k;
      if (x < -30 || x > SW + 30 || y < -30 || y > SH + 30) continue;
      glow(g, x, y, 5 + 60 / Math.sqrt(dz), "#ff5a4a", 0.55); disc(g, x, y, 1.2 + 26 / dz, "#ff8a78");
    }
    // other flyers, coming the other way down their own side
    for (const o of s.others) {
      const dz = o.z - cz; if (dz < 4) continue;
      const k = F / dz, x = VPX + (o.R * Math.sin(o.th) - cx) * k, y = VPY + (-o.R * Math.cos(o.th) - cy) * k;
      if (x < -40 || x > SW + 40 || y < -40 || y > SH + 40) continue;
      glow(g, x, y, 4 + 50 / Math.sqrt(dz), "#ffe9b8", 0.45); disc(g, x, y, 1 + 16 / dz, "#fff6dc");
    }

    // the spar: the sunline's cable, dark, down the middle of the air, with a marker lamp every eleven metres
    const sp = (d) => { const k = F / d; return [VPX - cx * k, VPY - cy * k, k]; };
    g.beginPath();
    const ds = [1.6, 2.4, 4, 7, 12, 22, 45, 120, 600, dzw];
    for (let i = 0; i < ds.length; i++) { const p = sp(ds[i]); const w = Math.max(0.9, 0.42 * p[2]); if (i === 0) g.moveTo(p[0] - w, p[1]); else g.lineTo(p[0] - w, p[1]); }
    for (let i = ds.length - 1; i >= 0; i--) { const p = sp(ds[i]); const w = Math.max(0.9, 0.42 * p[2]); g.lineTo(p[0] + w, p[1]); }
    g.closePath(); g.fillStyle = "#1c2230"; g.fill();
    const m0 = Math.ceil((cz + 2) / 11) * 11;
    for (let zz = m0; zz < cz + 330; zz += 11) { const p = sp(zz - cz); disc(g, p[0], p[1] - 0.3 * p[2], clamp(0.07 * p[2], 0.8, 9), "#ffd9a0"); }

    // the hoops, far ones first
    for (let i = s.hoops.length - 1; i >= 0; i--) {
      const h = s.hoops[i], dz = h.z - cz; if (dz < 0.7 || dz > 420) continue;
      const k = F / dz, x = VPX + (h.x - cx) * k, y = VPY + (h.y - cy) * k, R = h.r * k, P = PALS[h.h];
      const active = i === s.next, passed = h.state > 0;
      let al = passed ? clamp(1 - h.t * 1.4, 0, 1) * 0.8 : active ? 1 : clamp(1.15 - (i - s.next) * 0.22, 0.25, 0.8);
      if (al <= 0.01) continue;
      g.globalAlpha = al;
      const a0 = sp(dz);                                         // its lines back to the spar
      seg(g, a0[0], a0[1], x, y - R, Math.max(0.6, 0.02 * k), alpha(PAPER, 0.3)); seg(g, a0[0], a0[1], x - R * 0.87, y + R * 0.5, Math.max(0.6, 0.02 * k), alpha(PAPER, 0.3)); seg(g, a0[0], a0[1], x + R * 0.87, y + R * 0.5, Math.max(0.6, 0.02 * k), alpha(PAPER, 0.3));
      if (active) glow(g, x, y, R * 1.5, P.light, 0.16 + 0.07 * Math.sin(s.t * 5));
      ring(g, x, y, R, Math.max(1.6, 0.13 * k), h.state === 3 ? "#39404d" : P.a);
      const n = 14, lr = clamp(0.12 * k, 1.4, 16);
      for (let j = 0; j < n; j++) {
        const a = j / n * TAU + (active ? s.t * 0.5 : 0), lx = x + R * Math.cos(a), ly = y + R * Math.sin(a), c = j % 2 ? P.a : P.b;
        if (active || dz < 60) glow(g, lx, ly, lr * 3.2, lum(c) < 0.08 ? P.light : c, 0.35);
        disc(g, lx, ly, lr, h.state === 3 ? "#59606c" : lum(c) < 0.05 ? shade(c, 0.35) : c);
      }
      if (active && dz < 95) sign(g, HOURS[h.h].name.toUpperCase(), x, y - R - clamp(0.5 * k, 8, 26), clamp(0.9 * k, 20, 46), shade(P.light, 0.3), "center", 800);
      g.globalAlpha = 1;
    }

    // where you've been: the curl is the lesson
    g.lineCap = "round";
    for (let i = 1; i < s.trail.length; i++) {
      const a = s.trail[i - 1], b = s.trail[i], da = a.z - cz, db = b.z - cz; if (da < 0.8 || db < 0.8) continue;
      const ka = F / da, kb = F / db;
      seg(g, VPX + (a.x - cx) * ka, VPY + (a.y - cy) * ka, VPX + (b.x - cx) * kb, VPY + (b.y - cy) * kb, 2 + 3 * i / s.trail.length, alpha("#ffe9b8", 0.05 + 0.3 * i / s.trail.length));
    }

    // you
    const fk = F / CAM_BACK, px = VPX + (f.x - cx) * fk, py = VPY + (f.y - cy) * fk;
    const push = Math.hypot(s.thrust.x, s.thrust.y) / A_MAX;
    if (push > 0.06) {
      const ex = px + s.thrust.x / A_MAX * 270, ey = py + s.thrust.y / A_MAX * 270;
      g.setLineDash([3, 11]); seg(g, px, py, ex, ey, 3, alpha(PAPER, 0.28)); g.setLineDash([]);
      ring(g, ex, ey, 11, 2.5, alpha(PAPER, 0.4));
    }
    drawFlyer(g, px, py, fk, s.roll, s.flap, pal, push);
    s.parts.draw(g); s.notes.draw(g);

    // which way the drum turns, and the tally
    spinMark(g, 150, 958, alpha(PAPER, 0.5), 1, 22);
    g.save(); g.translate(60, 950); g.beginPath(); g.arc(0, 0, 17, -2.2, 1.0); g.lineWidth = 3; g.strokeStyle = alpha(PAPER, 0.5); g.stroke(); g.rotate(1.0); poly(g, [17, -7, 24, 4, 10, 4], alpha(PAPER, 0.5)); g.restore();
    for (let i = 0; i < s.hoops.length; i++) {
      const h = s.hoops[i], P = PALS[h.h], x = 346 + i * 28, y = 46;
      if (h.state === 1) { disc(g, x, y, 10, P.a); ring(g, x, y, 5, 3, P.b); }
      else if (h.state === 2) { ring(g, x, y, 8.5, 3, P.a); }
      else ring(g, x, y, 8.5, 2, alpha(PAPER, i === s.next ? 0.75 : 0.22));
    }
    if (s.endT >= 0) { g.globalAlpha = smooth(0.1, 0.6, s.endT); sign(g, s.threaded + " OF 12", 500, 300, 130, PAPER, "center", 800); g.globalAlpha = 1; }
  }

  // The house flies it. A good flyer plans to be at the hoop on time and pushes against the turn as well
  // as toward the lamp; a newcomer just points at the lamp and wonders why the path bends.
  function bot(s, b, ctx) {
    const f = s.f, h = s.hoops[s.next], W = DRUM.W, sk = ctx.skill;
    const fk = F / CAM_BACK, px = VPX + (f.x - s.cam.x) * fk, py = VPY + (f.y - s.cam.y) * fk;
    let ax = 0, ay = 0;
    if (h) {
      const T = Math.max(0.35, (h.z - f.z) / VZ);
      const dx = h.x - f.x, dy = h.y - f.y, dm = Math.hypot(dx, dy) || 1;
      // the newcomer: push at the lamp
      const nk = A_MAX * Math.min(1, dm / 2.5) / dm, nx = dx * nk, ny = dy * nk;
      // the flyer: the steady push that arrives on time, with the drum's push and the air's taken out
      let gx = 2 * (dx - f.vx * T) / (T * T) + DRAG * f.vx - 2 * W * f.vy - W * W * f.x;
      let gy = 2 * (dy - f.vy * T) / (T * T) + DRAG * f.vy + 2 * W * f.vx - W * W * f.y;
      // and round the spar, not through it
      const ax0 = 2 * (dx - f.vx * T) / (T * T), ay0 = 2 * (dy - f.vy * T) / (T * T);
      let best = 1e9, bx = 0, by = 0;
      for (let i = 1; i <= 10; i++) { const t = T * i / 10, qx = f.x + f.vx * t + 0.5 * ax0 * t * t, qy = f.y + f.vy * t + 0.5 * ay0 * t * t, d = Math.hypot(qx, qy); if (d < best) { best = d; bx = qx; by = qy; } }
      if (best < 1.9 && T > 0.8) {
        let ox = -dy / dm, oy = dx / dm;                       // sideways to the way we're going
        if (bx * ox + by * oy < 0 || (best < 0.2 && f.vx * ox + f.vy * oy < 0)) { ox = -ox; oy = -oy; }
        const k = (1.9 - best) * 3.2; gx += ox * k; gy += oy * k;
      }
      const w = smooth(0.4, 0.95, sk);
      ax = lerp(nx, gx, w); ay = lerp(ny, gy, w);
      if (sk < 0.99) { s.bn += (ctx.rng() - 0.5) * 0.25; s.bn *= 0.97; const e = (1 - sk) * 1.6; ax += Math.sin(s.t * 1.7 + s.bn * 9) * e; ay += Math.cos(s.t * 1.3 + s.bn * 7) * e; }
    }
    const m = Math.hypot(ax, ay), k = m > A_MAX ? A_MAX / m : 1;
    b.x = px + ax * k / A_MAX * 270; b.y = py + ay * k / A_MAX * 270; b.down = m > 0.05;
  }

  registerEvent({
    id: "moth", hour: 10, name: "Crosswise",
    place: "The Spindle by night, the middle of the axis · under 0.03 g",
    intro: "At lamp-night the nets come back and the whole axis opens: 3.75 km of flying in the dark, a hand lamp each. On Moth's night the clubs hang twelve hoops round the spar, each toward its own Hour, and the course runs rival to rival, straight across. Flying along the axis is easy. Across it, the drum turns under you and every path curls anti.",
    how: "Hold and point: you push toward where you point. Thread each lit hoop. Your path will curl anti: use it.",
    keys: "arrows to push",
    marks: [5, 8, 11], unit: "hoops", fmt: (v) => String(v),
    result: (s) => s.threaded + " of 12 threaded" + (s.brushed ? ", " + s.brushed + " brushed" : ""),
    create, update, draw, bot,
  });
})();
