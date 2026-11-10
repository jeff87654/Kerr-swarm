/* ---------- The drawing kit every game shares: colour, type, people, lamps, threads ----------
   The look is a two-ink print: each Hour's game is drawn in that Hour's two colours (pal.a, pal.b)
   plus INK and PAPER, flat fills, round caps, no outlines for their own sake. */
"use strict";

const INK = "#14181b";      // felt-dark, a little blue-green
const PAPER = "#f3eee2";    // undyed cloth
const FONT_SIGN = '"Big Shoulders Display", "Arial Narrow", "Roboto Condensed", sans-serif';
const FONT_BODY = '"Newsreader", "Iowan Old Style", "Palatino Linotype", Georgia, serif';
const FONT_MONO = '"IBM Plex Mono", ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace';

/* ---- colour ---- */
function hexRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbHex(r, g, b) {
  const c = (v) => { const s = Math.round(clamp(v, 0, 255)).toString(16); return s.length < 2 ? "0" + s : s; };
  return "#" + c(r) + c(g) + c(b);
}
const _mixCache = new Map();
// mix(c1, c2, t): t = 0 gives c1, t = 1 gives c2
function mix(c1, c2, t) {
  const key = c1 + c2 + t;
  let v = _mixCache.get(key);
  if (v) return v;
  const a = hexRgb(c1), b = hexRgb(c2);
  v = rgbHex(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));
  if (_mixCache.size < 4000) _mixCache.set(key, v);
  return v;
}
// shade(c, k): k < 0 darkens toward INK, k > 0 lightens toward PAPER (k in -1..1)
function shade(c, k) { return k < 0 ? mix(c, INK, -k) : mix(c, PAPER, k); }
function alpha(c, a) { const v = hexRgb(c); return "rgba(" + v[0] + "," + v[1] + "," + v[2] + "," + a + ")"; }
function lum(c) {
  const v = hexRgb(c).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
// the readable ink for text on a colour
function onCol(c) { return lum(c) > 0.3 ? INK : PAPER; }

// The Hour's palette: a and b are its two colours; aD/aL/bD/bL darker and lighter turns of each.
function makePal(hour) {
  const a = hour.a, b = hour.b;
  return {
    a, b, ink: INK, paper: PAPER,
    aD: shade(a, -0.35), aDD: shade(a, -0.62), aL: shade(a, 0.4), aLL: shade(a, 0.72),
    bD: shade(b, -0.3), bL: shade(b, 0.4),
    onA: onCol(a), onB: onCol(b),
    // the lighter and the darker of the two, whichever they are
    light: lum(a) > lum(b) ? a : b, dark: lum(a) > lum(b) ? b : a,
  };
}

/* ---- paths ---- */
function rrect(g, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();
}
function fillRR(g, x, y, w, h, r, col) { rrect(g, x, y, w, h, r); g.fillStyle = col; g.fill(); }
function disc(g, x, y, r, col) { g.beginPath(); g.arc(x, y, Math.max(0, r), 0, TAU); g.fillStyle = col; g.fill(); }
function ring(g, x, y, r, w, col) { g.beginPath(); g.arc(x, y, Math.max(0, r), 0, TAU); g.lineWidth = w; g.strokeStyle = col; g.stroke(); }
function seg(g, x0, y0, x1, y1, w, col) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineWidth = w; g.strokeStyle = col; g.lineCap = "round"; g.stroke(); }
function poly(g, pts, col) { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fillStyle = col; g.fill(); }
// an annular wedge: angles in radians clockwise from the top
function wedgePath(g, cx, cy, r0, r1, a0, a1) {
  g.beginPath();
  g.arc(cx, cy, r1, a0 - Math.PI / 2, a1 - Math.PI / 2);
  g.arc(cx, cy, r0, a1 - Math.PI / 2, a0 - Math.PI / 2, true);
  g.closePath();
}

/* ---- type ---- */
function setSpacing(g, em) { if ("letterSpacing" in g) g.letterSpacing = em ? em + "px" : "0px"; }
// sign(): the condensed sign face, for names, numbers and anything painted on a board
function sign(g, text, x, y, size, col, align, weight) {
  g.font = (weight || 700) + " " + size + "px " + FONT_SIGN;
  g.textAlign = align || "center"; g.fillStyle = col || PAPER;
  setSpacing(g, size * 0.04);
  g.fillText(text, x, y);
  setSpacing(g, 0);
}
// label(): the reading face, for the few words a game needs on the stage itself
function label(g, text, x, y, size, col, align, italic) {
  g.font = (italic ? "italic " : "") + "500 " + size + "px " + FONT_BODY;
  g.textAlign = align || "center"; g.fillStyle = col || PAPER;
  g.fillText(text, x, y);
}
function mono(g, text, x, y, size, col, align) {
  g.font = "500 " + size + "px " + FONT_MONO;
  g.textAlign = align || "center"; g.fillStyle = col || PAPER;
  g.fillText(text, x, y);
}
// text along an arc centred on (cx, cy), radius r, centred at angle a (clockwise from the top). Reads left to right; flips in the lower half.
function arcText(g, text, cx, cy, r, a, size, col, weight) {
  g.save();
  g.font = (weight || 700) + " " + size + "px " + FONT_SIGN;
  g.fillStyle = col; g.textAlign = "center"; g.textBaseline = "middle";
  const an = ((a % TAU) + TAU) % TAU;
  const flip = an > Math.PI / 2 && an < 3 * Math.PI / 2;
  const sp = size * 0.06;
  const widths = []; let total = 0;
  for (const ch of text) { const w = g.measureText(ch).width + sp; widths.push(w); total += w; }
  let off = -total / 2;
  let i = 0;
  for (const ch of text) {
    const mid = off + widths[i] / 2;
    const th = flip ? a - mid / r : a + mid / r;
    g.save();
    g.translate(cx + r * Math.sin(th), cy - r * Math.cos(th));
    g.rotate(flip ? th + Math.PI : th);
    g.fillText(ch, 0, 0);
    g.restore();
    off += widths[i]; i++;
  }
  g.restore();
}
// wrap(): draw text wrapped to maxW; returns the y after the last line
function wrapText(g, text, x, y, maxW, lineH) {
  const words = String(text).split(/\s+/); let line = "";
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y); y += lineH; line = w; } else line = t;
  }
  if (line) { g.fillText(line, x, y); y += lineH; }
  return y;
}

/* ---- light ---- */
function glow(g, x, y, r, col, a) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, alpha(col, a === undefined ? 0.6 : a));
  gr.addColorStop(1, alpha(col, 0));
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
}
// a hand lamp or a hung lamp: a bright core and a soft halo
function lamp(g, x, y, r, col, halo) {
  glow(g, x, y, r * (halo || 5), col, 0.35);
  disc(g, x, y, r, col);
  disc(g, x, y, r * 0.45, "#fffdf2");
}
// felt(): the dark ground behind everything, with a faint nap so it is not a flat fill
function felt(g, col) {
  g.fillStyle = col || INK; g.fillRect(0, 0, SW, SH);
}
function vignette(g, col, a) {
  const gr = g.createRadialGradient(SW / 2, SH / 2, SW * 0.35, SW / 2, SH / 2, SW * 0.78);
  gr.addColorStop(0, alpha(col || INK, 0)); gr.addColorStop(1, alpha(col || INK, a === undefined ? 0.5 : a));
  g.fillStyle = gr; g.fillRect(0, 0, SW, SH);
}

/* ---- people ----
   person(g, x, y, h, o): a figure standing with its feet at (x, y), h stage units tall.
   o.view  "front" (default) or "side"; o.face 1 (right) or -1, for side views
   o.pose  "stand", "walk", "run", "cheer", "sit", "reach", "carry", "wave", "hands" (hands on hips) ; o.t is the pose's clock in seconds
   o.shirt, o.legs, o.skin, o.hair  colours (hair null for none)
   o.lean  radians, tips the whole figure about its feet; o.child true for a child's proportions; o.old true for a stoop and white hair
   o.arms / o.legsA  override limb angles: [[a1, a2], [b1, b2]], radians from straight down
   Returns where the hands and head ended up, so a game can put things in them: {hx0, hy0, hx1, hy1, headX, headY, headR}. */
const SKINS = ["#f1d2b0", "#e2b88d", "#c99467", "#a9744b", "#7e5337", "#5b3b27"];
const HAIRS = ["#1e1b19", "#3a2a20", "#6a4a30", "#93806a", "#b6561f", "#2b2b33"];
const WHITE_HAIR = "#dcd6ca";

function limb(g, x, y, l1, a1, l2, a2, w, col) {
  const kx = x + l1 * Math.sin(a1), ky = y + l1 * Math.cos(a1);
  const ex = kx + l2 * Math.sin(a1 + a2), ey = ky + l2 * Math.cos(a1 + a2);
  g.beginPath(); g.moveTo(x, y); g.lineTo(kx, ky); g.lineTo(ex, ey);
  g.lineWidth = w; g.strokeStyle = col; g.lineCap = "round"; g.lineJoin = "round"; g.stroke();
  return [ex, ey];
}

function personPose(pose, t, view) {
  const s = Math.sin, c = Math.cos;
  let arms, legs, lean = 0, bob = 0;
  const ph = (t || 0) * TAU;
  if (view === "side") {
    switch (pose) {
      case "run": {
        const w = s(ph * 1.6);
        legs = [[0.95 * w, -0.25 - 0.9 * Math.max(0, -c(ph * 1.6 - 0.6))], [-0.95 * w, -0.25 - 0.9 * Math.max(0, c(ph * 1.6 - 0.6))]];
        arms = [[-0.9 * w, 1.4], [0.9 * w, 1.4]];
        lean = 0.2; bob = Math.abs(c(ph * 1.6)) * 0.03; break;
      }
      case "walk": {
        const w = s(ph);
        legs = [[0.42 * w, -0.1 - 0.3 * Math.max(0, -c(ph))], [-0.42 * w, -0.1 - 0.3 * Math.max(0, c(ph))]];
        arms = [[-0.35 * w, 0.2], [0.35 * w, 0.2]]; bob = Math.abs(c(ph)) * 0.012; break;
      }
      case "sit": legs = [[1.45, -1.45], [1.3, -1.35]]; arms = [[0.35, 0.9], [0.2, 0.8]]; break;
      case "reach": legs = [[0.12, 0], [-0.1, 0]]; arms = [[2.3 + 0.08 * s(ph), 0.2], [0.2, 0.3]]; break;
      case "carry": legs = [[0.2, -0.1], [-0.2, 0]]; arms = [[1.0, 0.9], [0.9, 0.9]]; lean = -0.08; break;
      case "cheer": legs = [[0.1, 0], [-0.1, 0]]; arms = [[2.7 + 0.25 * s(ph * 2), 0.2], [2.4 + 0.25 * s(ph * 2 + 1), 0.3]]; bob = Math.abs(s(ph * 2)) * 0.03; break;
      case "wave": legs = [[0.08, 0], [-0.08, 0]]; arms = [[2.6 + 0.35 * s(ph * 2), 0.3], [0.1, 0.2]]; break;
      default: legs = [[0.06, 0], [-0.06, 0]]; arms = [[0.1, 0.15], [-0.05, 0.1]];
    }
  } else {
    switch (pose) {
      case "cheer": legs = [[-0.12, 0], [0.12, 0]]; arms = [[-2.5 + 0.3 * s(ph * 2), -0.25], [2.5 + 0.3 * s(ph * 2 + 0.8), 0.25]]; bob = Math.abs(s(ph * 2)) * 0.035; break;
      case "wave": legs = [[-0.1, 0], [0.1, 0]]; arms = [[-0.25, -0.1], [2.5 + 0.4 * s(ph * 2.4), 0.35]]; break;
      case "hands": legs = [[-0.14, 0], [0.14, 0]]; arms = [[-0.75, 1.9], [0.75, -1.9]]; break;
      case "reach": legs = [[-0.1, 0], [0.1, 0]]; arms = [[-2.9, 0], [2.9, 0]]; break;
      case "carry": legs = [[-0.14, 0], [0.14, 0]]; arms = [[-0.3, 1.5], [0.3, -1.5]]; break;
      case "sit": legs = [[-0.25, 0.2], [0.25, -0.2]]; arms = [[-0.3, 0.5], [0.3, -0.5]]; break;
      case "walk": { const w = s(ph); legs = [[-0.1 + 0.08 * w, 0], [0.1 + 0.08 * w, 0]]; arms = [[-0.2, -0.1], [0.2, 0.1]]; bob = Math.abs(c(ph)) * 0.012; break; }
      default: legs = [[-0.1, 0], [0.1, 0]]; arms = [[-0.22, -0.08], [0.22, 0.08]];
    }
  }
  return { arms, legs, lean, bob };
}

function person(g, x, y, h, o) {
  o = o || {};
  const view = o.view || "front", face = o.face === -1 ? -1 : 1;
  const P = personPose(o.pose || "stand", o.t || 0, view);
  const arms = (o.arms || P.arms).slice(), legs = o.legsA || P.legs;
  const skin = o.skin || SKINS[2];
  const shirt = o.shirt || PAPER;
  const trousers = o.legs || shade(shirt, -0.45);
  const hair = o.old ? WHITE_HAIR : o.hair;
  const child = !!o.child;
  const headR = (child ? 0.135 : 0.105) * h;
  const sit = (o.pose === "sit");
  const legLen = (child ? 0.36 : 0.43) * h;
  const hipY = -(sit ? legLen * 0.52 : legLen) - (P.bob || 0) * h;
  const torso = (child ? 0.3 : 0.31) * h;
  const shY = hipY - torso;
  const lean = (o.lean || 0) + P.lean * (view === "side" ? 1 : 0) + (o.old && view === "side" ? 0.12 : 0);
  g.save();
  g.translate(x, y);
  if (view === "side" && face === -1) g.scale(-1, 1);
  if (lean) g.rotate(lean);
  const legW = 0.085 * h, armW = 0.066 * h;
  const t1 = legLen * 0.5, t2 = legLen * 0.5;
  const hipDX = view === "side" ? 0.02 * h : 0.06 * h;
  const shDX = view === "side" ? 0.02 * h : 0.115 * h;
  const backCol = shade(trousers, -0.25), backArm = shade(shirt, -0.22);
  const u1 = 0.165 * h, u2 = 0.16 * h;
  // o.handTo / o.handTo2: stage points for the near (or left) and far (or right) hand to reach for
  const fxs = view === "side" ? face : 1, cl = Math.cos(lean), sl = Math.sin(lean);
  const reachFor = (pt, sx, sy, bend) => {
    const dx0 = (pt[0] - x) * fxs, dy0 = pt[1] - y;
    const lx = dx0 * cl + dy0 * sl, ly = -dx0 * sl + dy0 * cl;       // into the figure's own frame
    const ex = lx - sx, ey = ly - sy, d = clamp(Math.hypot(ex, ey), Math.abs(u1 - u2) + 0.001, u1 + u2 - 0.001);
    const base = Math.atan2(ex, ey);
    const al = Math.acos(clamp((u1 * u1 + d * d - u2 * u2) / (2 * u1 * d), -1, 1));
    const be = Math.acos(clamp((u1 * u1 + u2 * u2 - d * d) / (2 * u1 * u2), -1, 1));
    return [base - bend * al, bend * (Math.PI - be)];
  };
  if (o.handTo) arms[0] = reachFor(o.handTo, view === "side" ? shDX : -shDX, shY + 0.03 * h, view === "side" ? 1 : -1);
  if (o.handTo2) arms[1] = reachFor(o.handTo2, view === "side" ? -shDX : shDX, shY + 0.03 * h, 1);
  // back limbs first (side view: the far arm and leg, darker)
  let hands = [];
  if (view === "side") {
    limb(g, -hipDX, hipY, t1, legs[1][0], t2, legs[1][1], legW, backCol);
    hands[1] = limb(g, -shDX, shY + 0.03 * h, u1, arms[1][0], u2, arms[1][1], armW, backArm);
    disc(g, hands[1][0], hands[1][1], armW * 0.62, shade(skin, -0.15));
  }
  // legs
  if (view === "side") limb(g, hipDX, hipY, t1, legs[0][0], t2, legs[0][1], legW, trousers);
  else { limb(g, -hipDX, hipY, t1, legs[0][0], t2, legs[0][1], legW, trousers); limb(g, hipDX, hipY, t1, legs[1][0], t2, legs[1][1], legW, trousers); }
  // torso: a soft bean, wider at the shoulders
  const sw = (view === "side" ? 0.16 : 0.27) * h, hw = (view === "side" ? 0.14 : 0.2) * h;
  g.beginPath();
  g.moveTo(-sw / 2, shY + 0.05 * h);
  g.quadraticCurveTo(-sw / 2, shY, -sw / 2 + 0.05 * h, shY);
  g.lineTo(sw / 2 - 0.05 * h, shY);
  g.quadraticCurveTo(sw / 2, shY, sw / 2, shY + 0.05 * h);
  g.lineTo(hw / 2, hipY + 0.03 * h);
  g.quadraticCurveTo(hw / 2, hipY + 0.07 * h, 0, hipY + 0.07 * h);
  g.quadraticCurveTo(-hw / 2, hipY + 0.07 * h, -hw / 2, hipY + 0.03 * h);
  g.closePath();
  g.fillStyle = shirt; g.fill();
  if (o.sash) { // a club sash across the chest
    g.save(); g.clip();
    g.beginPath(); g.moveTo(-sw / 2, shY); g.lineTo(-sw / 2 + 0.08 * h, shY); g.lineTo(hw / 2, hipY + 0.07 * h); g.lineTo(hw / 2 - 0.09 * h, hipY + 0.07 * h); g.closePath();
    g.fillStyle = o.sash; g.fill(); g.restore();
  }
  // head
  const headY = shY - headR * 0.92;
  disc(g, 0, headY, headR, skin);
  if (hair) {
    g.beginPath();
    if (view === "side") g.arc(-headR * 0.1, headY - headR * 0.1, headR * 1.03, Math.PI * 0.82, Math.PI * 1.7);
    else g.arc(0, headY - headR * 0.1, headR * 1.02, Math.PI * 1.02, Math.PI * 1.98);
    g.closePath(); g.fillStyle = hair; g.fill();
  }
  // near arms
  if (view === "side") {
    hands[0] = limb(g, shDX, shY + 0.03 * h, u1, arms[0][0], u2, arms[0][1], armW, shirt);
    disc(g, hands[0][0], hands[0][1], armW * 0.62, skin);
  } else {
    hands[0] = limb(g, -shDX, shY + 0.035 * h, u1, arms[0][0], u2, arms[0][1], armW, shirt);
    hands[1] = limb(g, shDX, shY + 0.035 * h, u1, arms[1][0], u2, arms[1][1], armW, shirt);
    disc(g, hands[0][0], hands[0][1], armW * 0.62, skin);
    disc(g, hands[1][0], hands[1][1], armW * 0.62, skin);
  }
  g.restore();
  // hand positions back in stage space (lean and facing applied)
  const cs = Math.cos(lean), sn = Math.sin(lean), fx = view === "side" ? face : 1;
  const map = (p) => { const px = p[0] * cs - p[1] * sn, py = p[0] * sn + p[1] * cs; return [x + fx * px, y + py]; };
  const h0 = map(hands[0]), h1 = map(hands[1]), hd = map([0, headY]);
  return { hx0: h0[0], hy0: h0[1], hx1: h1[0], hy1: h1[1], headX: hd[0], headY: hd[1], headR };
}

// A deterministic stranger: the same i always gives the same look. cols is a list of shirt colours.
function someone(i, cols) {
  const r = makeRng(Math.imul((i | 0) + 0x51ed, 0x9e3779b1) ^ 0x85ebca6b);     // mixed well, so neighbours in a row don't match
  r();
  return { skin: r.pick(SKINS), hair: r.pick(HAIRS), shirt: cols ? cols[Math.floor(r() * cols.length)] : PAPER, hk: 0.9 + r() * 0.2, ph: r() };
}

// crowd(): a row of n onlookers between x0 and x1 with their feet at y, about h tall.
// o.cols shirt colours; o.t clock; o.cheer 0..1 (how many have their arms up); o.seed
function crowd(g, x0, x1, y, n, h, o) {
  o = o || {};
  const seed = o.seed || 0;
  for (let i = 0; i < n; i++) {
    const p = someone(seed + i, o.cols);
    const x = n === 1 ? (x0 + x1) / 2 : lerp(x0, x1, i / (n - 1)) + (p.ph - 0.5) * (x1 - x0) / n * 0.5;
    const up = (o.cheer || 0) > p.ph;
    person(g, x, y + (p.ph - 0.5) * h * 0.06, h * p.hk, { shirt: p.shirt, skin: p.skin, hair: p.hair, pose: up ? "cheer" : "stand", t: (o.t || 0) * (0.8 + p.ph * 0.5) + p.ph, child: o.child, old: o.old });
  }
}

/* ---- club things ---- */
// a pennant in the club's two colours, hung from (x, y)
function pennant(g, x, y, w, h, c1, c2, sway) {
  const s = sway || 0;
  g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x + w / 2, y); g.lineTo(x + s, y + h); g.closePath(); g.fillStyle = c1; g.fill();
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + w / 2, y); g.lineTo(x + s, y + h); g.closePath(); g.fillStyle = c2; g.fill();
}
// a twisted two-colour thread from (x0, y0) to (x1, y1)
function thread(g, x0, y0, x1, y1, c1, c2, w) {
  const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.round(len / (w * 1.1)));
  const ux = (x1 - x0) / len, uy = (y1 - y0) / len, nx = -uy, ny = ux;
  seg(g, x0, y0, x1, y1, w, c1);
  g.lineCap = "butt";
  for (let i = 0; i < n; i += 2) {
    const a = i / n * len, b = Math.min(len, (i + 1) / n * len);
    g.beginPath();
    g.moveTo(x0 + ux * a - nx * w / 2 + ux * w * 0.5, y0 + uy * a - ny * w / 2 + uy * w * 0.5);
    g.lineTo(x0 + ux * b - nx * w / 2 + ux * w * 0.5, y0 + uy * b - ny * w / 2 + uy * w * 0.5);
    g.lineTo(x0 + ux * b + nx * w / 2 - ux * w * 0.2, y0 + uy * b + ny * w / 2 - uy * w * 0.2);
    g.lineTo(x0 + ux * a + nx * w / 2 - ux * w * 0.2, y0 + uy * a + ny * w / 2 - uy * w * 0.2);
    g.closePath(); g.fillStyle = c2; g.fill();
  }
  g.lineCap = "round";
}
// a knot on a thread: a bead in c1 with a turn of c2 round it
function knot(g, x, y, r, c1, c2) { disc(g, x, y, r, c1); ring(g, x, y, r * 0.52, r * 0.3, c2); }

/* ---- small things that fly about: steam, splashes, crumbs, petals ----
   const ps = new Parts(); ps.add({x, y, vx, vy, life, r, col, g (pull, stage units/s2), drag, fade}); ps.update(dt); ps.draw(g) */
class Parts {
  constructor(max) { this.a = []; this.max = max || 400; }
  add(p) {
    if (this.a.length >= this.max) this.a.shift();
    p.age = 0; p.life = p.life || 1; p.r = p.r || 4; p.vx = p.vx || 0; p.vy = p.vy || 0;
    this.a.push(p); return p;
  }
  burst(n, x, y, f) { for (let i = 0; i < n; i++) this.add(f(i)); }
  update(dt) {
    for (let i = this.a.length - 1; i >= 0; i--) {
      const p = this.a[i];
      p.age += dt;
      if (p.age >= p.life) { this.a.splice(i, 1); continue; }
      if (p.g) p.vy += p.g * dt;
      if (p.ax) p.vx += p.ax * dt;
      if (p.drag) { const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; }
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
  }
  draw(g) {
    for (const p of this.a) {
      const k = p.age / p.life;
      g.globalAlpha = p.fade === false ? 1 : (p.a === undefined ? 1 : p.a) * (1 - k * k);
      disc(g, p.x, p.y, p.r * (p.grow ? 1 + p.grow * k : 1), p.col || PAPER);
    }
    g.globalAlpha = 1;
  }
}

/* ---- words that rise off the action and fade: "golden", "anti", "a both" ----
   const notes = new Notes(); notes.add("golden", x, y, {good: true, size: 40, col}); notes.update(dt); notes.draw(g) */
class Notes {
  constructor() { this.a = []; }
  add(text, x, y, o) { o = o || {}; this.a.push({ text: String(text).toUpperCase(), x, y, t: 0, life: o.life || 1.1, size: o.size || 40, col: o.col || (o.good === false ? shade(PAPER, -0.3) : PAPER), rise: o.rise === undefined ? 46 : o.rise }); }
  update(dt) { for (let i = this.a.length - 1; i >= 0; i--) { this.a[i].t += dt; if (this.a[i].t > this.a[i].life) this.a.splice(i, 1); } }
  draw(g) {
    for (const n of this.a) {
      const k = n.t / n.life;
      g.globalAlpha = 1 - k * k;
      sign(g, n.text, n.x, n.y - n.rise * easeOut(k), n.size, n.col, "center", 800);
    }
    g.globalAlpha = 1;
  }
}

// Which way is spinward: the word and an arrow, centred on (x, y). dir 1 points right, -1 left.
function spinMark(g, x, y, col, dir, size) {
  const s = size || 26, d = dir === -1 ? -1 : 1;
  sign(g, "SPINWARD", x, y + s * 0.35, s, col, "center", 700);
  const ax = x + d * (s * 2.55);
  poly(g, [ax, y - s * 0.34, ax + d * s * 0.85, y, ax, y + s * 0.34], col);
}

// A painted board, like the Records Board on the Round Arcade: dark, with white numerals. Returns nothing; text is centred.
function board(g, x, y, w, h, big, small) {
  fillRR(g, x - w / 2, y - h / 2, w, h, 10, alpha(INK, 0.86));
  if (small) { sign(g, big, x, y + h * 0.08, h * 0.5, PAPER, "center", 800); mono(g, small, x, y + h * 0.36, h * 0.17, alpha(PAPER, 0.75)); }
  else sign(g, big, x, y + h * 0.2, h * 0.58, PAPER, "center", 800);
}

/* ---- the Hollow, seen from its floor looking along the axis ----
   The land curls up on both sides and the far bank hangs three kilometres overhead, upside down and sharp.
   o.pal    the Hour's palette (the near land is drawn in it)
   o.sun    0 (lamp-night) .. 1 (full sun); between, the light is warm
   o.far    colour of the land overhead (the Hour across the Hollow); o.farDots colour of the small things on it
   o.near, o.near2  colours of the land curling up beside you (default pal.a and pal.aL)
   o.horizon  y where the land meets the ground you stand on, at the middle of the stage (default 690)
   o.seed   varies the scatter overhead */
function hollowBack(g, o) {
  const pal = o.pal, sun = o.sun === undefined ? 1 : o.sun, hz = o.horizon === undefined ? 690 : o.horizon;
  const warm = 1 - Math.abs(sun * 2 - 1);                       // most at dawn and dusk
  const top = mix(mix("#0c1422", "#f7f1dc", sun), "#e9c492", warm * 0.75);
  const low = mix(mix("#18222f", "#f4ecd6", sun), "#f3e2c0", warm * 0.6);
  const sky = g.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, top); sky.addColorStop(1, low);
  g.fillStyle = sky; g.fillRect(-20, -40, SW + 40, hz + 60);
  // the far bank
  const far = o.far || shade(pal.a, -0.38);
  const lit = mix(shade(far, -0.55), far, 0.25 + 0.75 * sun);
  g.beginPath(); g.moveTo(-20, -40); g.lineTo(SW + 20, -40); g.lineTo(SW + 20, 70); g.quadraticCurveTo(500, 150, -20, 70); g.closePath();
  g.fillStyle = lit; g.fill();
  const r0 = makeRng((o.seed || 1) * 131 + 7);
  const dots = o.farDots || shade(far, 0.45);
  for (let i = 0; i < 46; i++) {
    const x = r0() * SW, y = 8 + r0() * (58 + 40 * Math.sin(x / SW * Math.PI));
    disc(g, x, y, 1.5 + r0() * 1.7, sun < 0.3 || r0() < 0.35 ? "#ffe6b0" : dots);
  }
  // the land curling up at both sides
  const n1 = o.near2 || pal.aL, n2 = o.near || pal.a, dk = 0.45 + 0.55 * sun;
  g.beginPath(); g.moveTo(-20, hz + 160); g.lineTo(-20, hz - 220); g.quadraticCurveTo(170, hz - 40, 500, hz); g.quadraticCurveTo(830, hz - 40, SW + 20, hz - 220); g.lineTo(SW + 20, hz + 160); g.closePath();
  g.fillStyle = mix(INK, n1, dk); g.fill();
  g.beginPath(); g.moveTo(-20, hz + 160); g.lineTo(-20, hz - 100); g.quadraticCurveTo(200, hz + 40, 500, hz + 60); g.quadraticCurveTo(800, hz + 40, SW + 20, hz - 100); g.lineTo(SW + 20, hz + 160); g.closePath();
  g.fillStyle = mix(INK, n2, dk); g.fill();
}
