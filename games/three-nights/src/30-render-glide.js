/* ---------- The Glide: the view from a glide car's aft window ---------- */
"use strict";

// Units: km. The lane runs along +X at Y = 0; this row's drums stand on the +Y side
// with their rims touching the lane. Z runs from the rectenna layer (0) to the radiator layer (3.75).
const GL_PITCH = 24.5, GL_RAD = 3.05, GL_DEPTH = 3.75;
const GL_LEVELS = 9;

class GlideView {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.lane = 5;
    this.t = 0;
    this.seed = 1;
    this.trains = [];
    this.setSeed(1);
  }

  setSeed(seed) {
    this.seed = seed;
    const r = makeRng(seed);
    this.lane = r.int(7, 8);
    this.trains = [];
    for (let i = 0; i < 26; i++) {
      const alongX = r.chance(0.7);
      this.trains.push({
        alongX,
        row: r.int(-5, 6),
        col: r.int(-1, 12),
        level: r.int(1, GL_LEVELS),
        dir: r.chance(0.5) ? 1 : -1,
        phase: r(),
        len: r.range(0.07, 0.11),
      });
    }
  }

  levelZ(k) { return GL_DEPTH * (k - 0.5) / GL_LEVELS; }

  // Camera at position t (0..1) along the hop.
  cam(t, time) {
    const z = this.levelZ(this.lane);
    const pos = [t * GL_PITCH, -0.02, z];
    const drift = prefersReducedMotion ? 0 : Math.sin(time * 0.13) * 0.015;
    const yaw = -0.07 + drift;  // look a little toward the row of drums (+Y)
    const pitch = -0.05 + drift * 0.5;
    const f = [Math.cos(pitch) * Math.cos(yaw), -Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch)];
    const up0 = [0, 0, 1];
    const r = norm3(cross3(f, up0));
    const u = norm3(cross3(r, f));
    return { pos, f, r, u };
  }

  render(t, time, opts) {
    opts = opts || {};
    const c = this.canvas, ctx = this.ctx;
    const W = c.width, H = c.height;
    const cam = this.cam(t, time);
    const hfov = 92 * Math.PI / 180;
    const fpx = (W / 2) / Math.tan(hfov / 2);
    const P = cam.pos;
    const proj = (x, y, z) => {
      const vx = x - P[0], vy = y - P[1], vz = z - P[2];
      const zc = vx * cam.f[0] + vy * cam.f[1] + vz * cam.f[2];
      if (zc < 0.02) return null;
      const xc = vx * cam.r[0] + vy * cam.r[1] + vz * cam.r[2];
      const yc = vx * cam.u[0] + vy * cam.u[1] + vz * cam.u[2];
      return [W / 2 + fpx * xc / zc, H / 2 - fpx * yc / zc, zc];
    };

    // background: the dark hall
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#07080b");
    bg.addColorStop(0.55, "#0a0c11");
    bg.addColorStop(1, "#06070a");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    if (opts.mirror) ctx.setTransform(-1, 0, 0, 1, W, 0);

    const scale = H / 700;

    // ceiling (radiator layer) and floor (rectenna layer) grids
    ctx.globalCompositeOperation = "lighter";
    const gridLine = (x1, y1, z1, x2, y2, z2, color, w) => {
      // clip in steps so near-plane crossings don't break the line
      const N = 24;
      ctx.beginPath();
      let pen = false;
      for (let i = 0; i <= N; i++) {
        const s = i / N;
        const p = proj(lerp(x1, x2, s), lerp(y1, y2, s), lerp(z1, z2, s));
        if (!p) { pen = false; continue; }
        if (!pen) { ctx.moveTo(p[0], p[1]); pen = true; } else ctx.lineTo(p[0], p[1]);
      }
      ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();
    };
    const step = GL_PITCH / 4;
    for (let k = -16; k <= 16; k++) {
      const y = k * step;
      gridLine(-10, y, GL_DEPTH, 320, y, GL_DEPTH, "rgba(120,110,95,0.07)", 1 * scale);
      gridLine(-10, y, 0, 320, y, 0, "rgba(70,90,110,0.05)", 1 * scale);
    }
    for (let k = -1; k <= 48; k++) {
      const x = k * step;
      gridLine(x, -150, GL_DEPTH, x, 150, GL_DEPTH, "rgba(120,110,95,0.045)", 1 * scale);
    }

    // drums, far to near
    const drums = [];
    for (let row = -11; row <= 11; row++) {
      for (let col = -1; col <= 22; col++) {
        const cx = col * GL_PITCH, cy = GL_RAD + row * GL_PITCH;
        const dx = cx - P[0], dy = cy - P[1];
        const dist = Math.hypot(dx, dy);
        if (dist < GL_RAD + 0.01) continue;
        drums.push({ cx, cy, dist, row, col });
      }
    }
    drums.sort((a, b) => b.dist - a.dist);

    ctx.globalCompositeOperation = "lighter";
    for (const dr of drums) {
      if (dr.dist > 210) continue;
      const alpha = Math.atan2(P[1] - dr.cy, P[0] - dr.cx);
      const beta = Math.asin(Math.min(1, GL_RAD / dr.dist));
      const half = Math.PI / 2 - beta + 0.25;
      const fade = Math.min(1, 22 / Math.max(dr.dist, 1));
      for (const k of [this.lane, 3, 8]) {
        for (const zz of [2 * GL_DEPTH - this.levelZ(k), -this.levelZ(k)]) {
          ctx.beginPath();
          let started = false;
          for (let i = 0; i <= 20; i++) {
            const a = alpha - half + (2 * half * i) / 20;
            const p = proj(dr.cx + Math.cos(a) * GL_RAD, dr.cy + Math.sin(a) * GL_RAD, zz);
            if (!p) { started = false; continue; }
            if (!started) { ctx.moveTo(p[0], p[1]); started = true; } else ctx.lineTo(p[0], p[1]);
          }
          ctx.lineWidth = Math.max(1, 5 * scale * fade);
          ctx.strokeStyle = "rgba(255,170,90," + ((zz > GL_DEPTH ? 0.085 : 0.045) * (0.4 + fade)).toFixed(3) + ")";
          ctx.stroke();
        }
      }
    }

    for (const dr of drums) {
      const { cx, cy, dist } = dr;
      // halo on the ceiling and floor around each drum, from its top and bottom rings
      if (false) {
        ctx.globalCompositeOperation = "lighter";
        for (const [zz, col, a0] of [[GL_DEPTH, "255,170,90", 0.03], [0, "140,170,200", 0.015]]) {
          for (let ri = 2; ri >= 1; ri--) {
            const rad = GL_RAD + ri * 1.4;
            ctx.beginPath();
            let started = false;
            for (let i = 0; i <= 48; i++) {
              const a = (i / 48) * Math.PI * 2;
              const p = proj(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, zz);
              if (!p) { started = false; continue; }
              if (!started) { ctx.moveTo(p[0], p[1]); started = true; } else ctx.lineTo(p[0], p[1]);
            }
            ctx.fillStyle = "rgba(" + col + "," + (a0 / ri * Math.min(1, 40 / dist)).toFixed(4) + ")";
            ctx.fill();
          }
        }
      }

      // the near arc: the half of the drum facing the camera
      const alpha = Math.atan2(P[1] - cy, P[0] - cx);
      const beta = Math.asin(Math.min(1, GL_RAD / dist));
      const half = Math.PI / 2 - beta;
      const n = dist > 120 ? 14 : dist > 50 ? 22 : dist > 14 ? 48 : 80;
      const arc = (z) => {
        const pts = [];
        for (let i = 0; i <= n; i++) {
          const a = alpha - half + (2 * half * i) / n;
          const p = proj(cx + Math.cos(a) * GL_RAD, cy + Math.sin(a) * GL_RAD, z);
          if (p) pts.push(p);
        }
        return pts;
      };
      const top = arc(GL_DEPTH), bot = arc(0);
      if (top.length < 2 || bot.length < 2) continue;
      // body
      ctx.globalCompositeOperation = "source-over";
      ctx.beginPath();
      ctx.moveTo(top[0][0], top[0][1]);
      for (const p of top) ctx.lineTo(p[0], p[1]);
      for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
      ctx.closePath();
      const shade = Math.max(0, Math.min(1, 1 - dist / 260));
      ctx.fillStyle = "rgb(" + Math.round(9 + 8 * shade) + "," + Math.round(10 + 8 * shade) + "," + Math.round(13 + 10 * shade) + ")";
      ctx.fill();
      // rim highlight from the rings
      ctx.globalCompositeOperation = "lighter";
      // quay rings
      const fade = Math.min(1, 26 / Math.max(dist, 1));
      for (let k = 1; k <= GL_LEVELS; k++) {
        const ring = arc(this.levelZ(k));
        if (ring.length < 2) continue;
        const waist = k === this.lane;
        const bright = (waist ? 1.0 : 0.5) * (0.35 + 0.65 * fade);
        ctx.beginPath();
        ctx.moveTo(ring[0][0], ring[0][1]);
        for (const p of ring) ctx.lineTo(p[0], p[1]);
        // glow
        ctx.lineWidth = Math.max(1, 7 * scale * fade);
        ctx.strokeStyle = "rgba(255,160,70," + (0.10 * bright).toFixed(3) + ")";
        ctx.setLineDash([]);
        ctx.stroke();
        // lamps
        if (dist < 32) {
          // separate lamps, each with a small halo
          const step2 = Math.max(1, Math.floor(ring.length / (dist < 14 ? 40 : 24)));
          for (let li = 0; li < ring.length; li += step2) {
            const p = ring[li];
            const rr = Math.max(1.2, 3.2 * scale * fade);
            ctx.fillStyle = "rgba(255,170,90," + (0.18 * bright).toFixed(3) + ")";
            ctx.beginPath(); ctx.arc(p[0], p[1], rr * 2.6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "rgba(255,214,150," + Math.min(1, 0.95 * bright).toFixed(3) + ")";
            ctx.beginPath(); ctx.arc(p[0], p[1], rr * 0.7, 0, Math.PI * 2); ctx.fill();
          }
        } else {
          ctx.lineWidth = Math.max(1.1, 2.2 * scale * Math.sqrt(fade));
          ctx.strokeStyle = "rgba(255,196,120," + Math.min(1, 0.85 * bright).toFixed(3) + ")";
          ctx.stroke();
        }
      }
    }

    // other trains crossing the hall
    ctx.globalCompositeOperation = "lighter";
    for (const tr of this.trains) {
      const speed = 1 / 140; // one hop per 140 s
      const s = ((tr.phase + tr.dir * time * speed * 0.6) % 1 + 1) % 1;
      let x1, y1, x2, y2;
      const z = this.levelZ(tr.level);
      if (tr.alongX) {
        const y = tr.row * GL_PITCH + (tr.dir > 0 ? 0 : 2 * GL_RAD);
        const x = (tr.col + s) * GL_PITCH;
        x1 = x; x2 = x + tr.len * tr.dir; y1 = y2 = y;
      } else {
        const x = tr.col * GL_PITCH + (tr.dir > 0 ? -GL_RAD : GL_RAD);
        const y = (tr.row + s) * GL_PITCH;
        y1 = y; y2 = y + tr.len * tr.dir; x1 = x2 = x;
      }
      const a = proj(x1, y1, z), b = proj(x2, y2, z);
      if (!a || !b) continue;
      const dd = Math.hypot(x1 - P[0], y1 - P[1]);
      const fade = Math.min(1, 30 / Math.max(dd, 1));
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
      ctx.strokeStyle = "rgba(210,230,255," + (0.5 * fade).toFixed(3) + ")";
      ctx.lineWidth = Math.max(1, 2.5 * scale * fade);
      ctx.stroke();
    }

    // the window: a metre of clear water, and the car's frame
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    const tint = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.75);
    tint.addColorStop(0, "rgba(20,60,70,0.0)");
    tint.addColorStop(1, "rgba(4,16,20,0.55)");
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, W, H);
    if (opts.frame !== false) {
      const m = Math.round(Math.min(W, H) * 0.035);
      ctx.strokeStyle = "rgba(0,0,0,0.85)";
      ctx.lineWidth = m * 2;
      roundRect(ctx, 0, 0, W, H, m * 2.2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(160,200,210,0.08)";
      ctx.lineWidth = 1.5;
      roundRect(ctx, m, m, W - 2 * m, H - 2 * m, m * 1.4);
      ctx.stroke();
    }
    // the catch: a soft flash and the weight coming back
    if (opts.catchFlash) {
      ctx.fillStyle = "rgba(255,190,120," + (0.25 * opts.catchFlash).toFixed(3) + ")";
      ctx.fillRect(0, 0, W, H);
    }
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
