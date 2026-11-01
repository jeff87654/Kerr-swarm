/* ---------- the drawing: a half-section of the drum, pan and zoom ---------- */

const EXT = { z0: -300, z1: DRUM.L + 310, r0: -70, r1: 3420 };

const MAP = {
  s: 0.2, tx: 0, ty: 0, minS: 0.05, maxS: 9,
  theta: hourCenter(4), clock: 720,
  W: 0, H: 0, dpr: 1,
  sel: null, selPlace: null, routeSpots: null, hoverPin: null,
  kinds: null,          // Set of kinds to show, or null for all
  pins: [],             // screen positions this frame
  colors: {}, rgb: {},
  onPick: null, onHover: null, dirty: true, anim: null,
};

/* ---- colours from the page's tokens ---- */
const COLOR_KEYS = ["bg", "bg-2", "bg-3", "card", "ink", "ink-2", "ink-3", "accent", "lattice", "quay", "bruise", "pin", "pin-edge", "sel",
  "m-keel", "m-low", "m-mid", "m-high", "m-line", "m-jacket", "m-moat", "m-midraft", "m-layer", "m-air-noon", "m-air-dawn", "m-air-night",
  "m-lake", "m-orch", "m-lawn", "m-grounds", "m-dim", "m-wall", "m-grid", "m-label"];

function parseColor(s) {
  s = (s || "").trim();
  let m;
  if ((m = /^#([0-9a-f]{3})$/i.exec(s))) return [...m[1]].map(c => parseInt(c + c, 16)).concat(1);
  if ((m = /^#([0-9a-f]{6})$/i.exec(s))) return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)).concat(1);
  if ((m = /^rgba?\(([^)]+)\)$/i.exec(s))) {
    const p = m[1].split(",").map(x => parseFloat(x));
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  }
  return [128, 128, 128, 1];
}
const rgbaStr = (c, a) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a == null ? c[3] : a})`;
const mixC = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];

function readColors() {
  const cs = getComputedStyle(document.documentElement);
  for (const k of COLOR_KEYS) {
    MAP.colors[k] = cs.getPropertyValue("--" + k).trim() || "#888";
    MAP.rgb[k] = parseColor(MAP.colors[k]);
  }
  MAP.dirty = true;
}

/* ---- transforms ---- */
const sx = z => MAP.tx + MAP.s * z;
const sy = r => MAP.ty + MAP.s * r;
const wz = x => (x - MAP.tx) / MAP.s;
const wr = y => (y - MAP.ty) / MAP.s;

function fitView(pad = 0.97) {
  const narrow = MAP.W < 600;
  const top = narrow ? 48 : 0, bottom = narrow ? 58 : 0;   // room for the corner plate and the phone's peek strip
  const H = MAP.H - top - bottom;
  const s = Math.min(MAP.W / (EXT.z1 - EXT.z0), H / (EXT.r1 - EXT.r0)) * pad;
  MAP.minS = s * 0.9;
  return { s, tx: (MAP.W - s * (EXT.z1 + EXT.z0)) / 2, ty: top + (H - s * (EXT.r1 + EXT.r0)) / 2 };
}

function setView(v) {
  MAP.s = clamp(v.s, MAP.minS, MAP.maxS);
  MAP.tx = v.tx; MAP.ty = v.ty;
  clampView();
  MAP.dirty = true;
}

function clampView() {
  // keep some of the drum on screen
  const m = 60;
  const left = sx(EXT.z0), right = sx(EXT.z1), top = sy(EXT.r0), bottom = sy(EXT.r1);
  if (right < m) MAP.tx += m - right;
  if (left > MAP.W - m) MAP.tx -= left - (MAP.W - m);
  if (bottom < m) MAP.ty += m - bottom;
  if (top > MAP.H - m) MAP.ty -= top - (MAP.H - m);
}

function zoomAt(x, y, factor) {
  const z = wz(x), r = wr(y);
  const s = clamp(MAP.s * factor, MAP.minS, MAP.maxS);
  MAP.tx = x - s * z; MAP.ty = y - s * r; MAP.s = s;
  clampView();
  MAP.dirty = true;
}

function viewFor(z, r, s) {
  s = clamp(s, MAP.minS, MAP.maxS);
  return { s, tx: MAP.W / 2 - s * z, ty: MAP.H / 2 - s * r };
}

function flyTo(v, ms = 650) {
  if (reduceMotion() || ms <= 0) { setView(v); return; }
  const from = { s: MAP.s, tx: MAP.tx, ty: MAP.ty };
  const t0 = performance.now();
  // interpolate in world space so the motion looks like a camera move
  const cz0 = wz(MAP.W / 2), cr0 = wr(MAP.H / 2);
  const cz1 = (MAP.W / 2 - v.tx) / v.s, cr1 = (MAP.H / 2 - v.ty) / v.s;
  MAP.anim = now => {
    const t = clamp((now - t0) / ms, 0, 1);
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const s = Math.exp(lerp(Math.log(from.s), Math.log(v.s), e));
    const cz = lerp(cz0, cz1, e), cr = lerp(cr0, cr1, e);
    MAP.s = s; MAP.tx = MAP.W / 2 - s * cz; MAP.ty = MAP.H / 2 - s * cr;
    MAP.dirty = true;
    if (t >= 1) { MAP.anim = null; setView(v); }
  };
}

/* ---- drawing ---- */
let CTX = null, CANVAS = null;

function rectW(z0, r0, z1, r1) {   // a world rectangle in screen space, at least a hairline
  const x0 = sx(z0), x1 = sx(z1), y0 = sy(r0), y1 = sy(r1);
  return [Math.min(x0, x1), Math.min(y0, y1), Math.max(Math.abs(x1 - x0), 0.6), Math.max(Math.abs(y1 - y0), 0.6)];
}
function fillW(z0, r0, z1, r1, color) { CTX.fillStyle = color; CTX.fillRect(...rectW(z0, r0, z1, r1)); }

function skyColors() {
  const sun = sunLevel(MAP.clock);
  const N = MAP.rgb["m-air-night"], Dn = MAP.rgb["m-air-dawn"], Nn = MAP.rgb["m-air-noon"];
  let floor, top;
  if (sun <= 0) { floor = N; top = mixC(N, [0, 0, 0, 1], 0.25); }
  else if (sun < 1) {
    const c = sun < 0.5 ? mixC(N, Dn, sun * 2) : mixC(Dn, Nn, (sun - 0.5) * 2);
    floor = c; top = mixC(c, [255, 252, 238, 1], 0.35 * sun);
  } else { floor = Nn; top = mixC(Nn, [255, 253, 244, 1], 0.55); }
  return { floor, top, sun };
}

function font(px, w = 500, fam = "mono") {
  const f = fam === "mono" ? '"DM Mono", ui-monospace, Menlo, Consolas, monospace' : '"Archivo", "Arial Narrow", Arial, sans-serif';
  return `${w} ${px}px ${f}`;
}

function label(text, x, y, opts = {}) {
  CTX.font = font(opts.px || 11, opts.w || 500, opts.fam || "mono");
  CTX.textAlign = opts.align || "left";
  CTX.textBaseline = opts.base || "alphabetic";
  if (opts.halo !== false) {
    CTX.lineWidth = 3; CTX.strokeStyle = rgbaStr(opts.haloC || MAP.rgb.bg, 0.8); CTX.lineJoin = "round";
    CTX.strokeText(text, x, y);
  }
  CTX.fillStyle = opts.color || MAP.colors["m-label"];
  CTX.fillText(text, x, y);
}

function draw() {
  const c = CTX, C = MAP.colors, s = MAP.s;
  c.setTransform(MAP.dpr, 0, 0, MAP.dpr, 0, 0);
  c.fillStyle = C.bg;
  c.fillRect(0, 0, MAP.W, MAP.H);
  const L = DRUM.L;
  const hour = hourOfTheta(MAP.theta), opp = oppositeHour(hour);

  /* beyond: the mid-raft under the rim, the layers at front and back */
  fillW(-58, 3070, L + 58, EXT.r1 + 400, C["m-midraft"]);
  fillW(-280, EXT.r0 - 400, -58, EXT.r1 + 400, C["m-layer"]);
  fillW(L + 58, EXT.r0 - 400, L + 150, EXT.r1 + 400, C["m-layer"]);
  // rectenna ticks and radiator fins
  c.strokeStyle = rgbaStr(MAP.rgb.bg, 0.35); c.lineWidth = 1;
  const step = Math.max(60, 14 / s);
  for (let r = Math.ceil(EXT.r0 / step) * step; r < EXT.r1; r += step) {
    c.beginPath(); c.moveTo(sx(-270), sy(r)); c.lineTo(sx(-70), sy(r)); c.stroke();
    c.beginPath(); c.moveTo(sx(L + 70), sy(r + step / 2)); c.lineTo(sx(L + 140), sy(r + step / 2)); c.stroke();
  }
  // the Windows: a dozen galleries on the aft face of the radiator layer
  for (let i = 0; i < 12; i++) {
    const r0 = 520 + i * 78;
    fillW(L + 160, r0, L + 232, r0 + 50, C["m-midraft"]);
    if (s * 50 > 3) { c.fillStyle = rgbaStr(MAP.rgb.bruise, 0.8); c.fillRect(...rectW(L + 222, r0 + 8, L + 230, r0 + 42)); }
  }
  // quay lights in the mid-raft: the ring of lights every drum wears
  const lightsY = sy(3110);
  for (let i = 1; i <= 9; i++) {
    const zc = ringCenter(i);
    c.fillStyle = rgbaStr(MAP.rgb.quay, 0.18);
    c.fillRect(...rectW(zc - 60, 3070, zc + 60, 3240));
  }

  /* the jacket, moat and quay */
  fillW(-50, -10, 0, DRUM.R + DRUM.JACKET, C["m-jacket"]);
  fillW(L, -10, L + 50, DRUM.R + DRUM.JACKET, C["m-jacket"]);
  fillW(-50, DRUM.R, L + 50, DRUM.R + DRUM.JACKET, C["m-jacket"]);
  c.fillStyle = C["m-moat"];
  c.fillRect(...rectW(-50, DRUM.R + DRUM.JACKET, L + 50, DRUM.R + DRUM.JACKET + Math.max(1.5 / s, 1)));
  c.fillRect(...rectW(-50 - Math.max(1.5 / s, 1), -10, -50, DRUM.R + DRUM.JACKET + 1));
  for (let i = 1; i <= 9; i++) {
    const zc = ringCenter(i);
    fillW(zc - 38, DRUM.QUAY, zc + 38, DRUM.QUAY + 16, C.quay);
    if (s > 0.4) {
      c.fillStyle = "#fff4d6";
      for (let k = -30; k <= 30; k += 12) { const [x, y] = [sx(zc + k), sy(DRUM.QUAY + 8)]; c.fillRect(x - 0.8, y - 0.8, 1.6, 1.6); }
    }
  }

  /* the decks: bands of weight */
  const bands = [
    [DRUM.R, deckR(15) - 4, C["m-keel"]],
    [deckR(16), deckR(113) - 4, C["m-low"]],
    [deckR(114), deckR(301) - 4, C["m-mid"]],
    [deckR(302), DRUM.FLOOR, C["m-high"]],
  ];
  for (const [rOut, rIn, col] of bands) fillW(0, rIn, L, rOut, col);
  // line decks
  for (const f of LINE_FIRST) {
    const r = deckR(f);
    c.fillStyle = C["m-line"];
    c.fillRect(...rectW(0, r - 8, L, r));
    if (s * 8 < 1.4) c.fillRect(sx(0), sy(r - 4) - 0.7, sx(L) - sx(0), 1.4);
  }
  // station rings: four decks deep at the bottom of the Keel
  for (let i = 1; i <= 9; i++) {
    const zc = ringCenter(i);
    fillW(zc - 45, deckR(4) - 4, zc + 45, DRUM.R, C.quay);
  }

  /* the Hollow */
  const sky = skyColors();
  const yTop = sy(0), yFloor = sy(DRUM.FLOOR);
  const g = c.createLinearGradient(0, yTop, 0, yFloor);
  g.addColorStop(0, rgbaStr(sky.top)); g.addColorStop(1, rgbaStr(sky.floor));
  c.fillStyle = g;
  c.fillRect(...rectW(0, 0, L, DRUM.FLOOR));
  // the floor's ends dim toward the walls by day
  if (sky.sun > 0) {
    for (const [za, zb] of [[0, 760], [L, L - 760]]) {
      const xa = sx(za), xb = sx(zb);
      const gg = c.createLinearGradient(xa, 0, xb, 0);
      gg.addColorStop(0, rgbaStr(MAP.rgb["m-air-night"], 0.32 * sky.sun)); gg.addColorStop(1, rgbaStr(MAP.rgb["m-air-night"], 0));
      c.fillStyle = gg;
      c.fillRect(Math.min(xa, xb), yTop, Math.abs(xb - xa), yFloor - yTop);
    }
  }
  // the Spindle and its flying halls
  c.fillStyle = rgbaStr(MAP.rgb.lattice, spindleOpen(MAP.clock) ? 0.14 : 0.06);
  c.fillRect(...rectW(0, 0, L, DRUM.SPINDLE));
  for (const [za, zb] of [[0, DRUM.HALL_LEN], [L - DRUM.HALL_LEN, L]]) {
    const [x, y, w, h] = rectW(za, 0, zb, DRUM.SPINDLE);
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.strokeStyle = rgbaStr(MAP.rgb.lattice, 0.55); c.lineWidth = 1;
    const gap = Math.max(5, 22 * s);
    for (let d = -h; d < w + h; d += gap) { c.beginPath(); c.moveTo(x + d, y); c.lineTo(x + d + h, y + h); c.stroke(); c.beginPath(); c.moveTo(x + d + h, y); c.lineTo(x + d, y + h); c.stroke(); }
    c.restore();
    c.strokeStyle = rgbaStr(MAP.rgb.lattice, 0.8); c.strokeRect(x, y, w, h);
  }
  // the spar and the sunline
  c.strokeStyle = C["m-layer"]; c.lineWidth = 1;
  c.beginPath(); c.moveTo(sx(0), sy(0)); c.lineTo(sx(L), sy(0)); c.stroke();
  if (sky.sun > 0) {
    const a = 0.35 + 0.65 * sky.sun;
    c.shadowColor = rgbaStr(MAP.rgb.accent, a); c.shadowBlur = 16 * sky.sun + 4;
    c.strokeStyle = rgbaStr([255, 246, 214, 1], a); c.lineWidth = 3;
    c.beginPath(); c.moveTo(sx(DRUM.LINE_ON), sy(0)); c.lineTo(sx(DRUM.LINE_OFF), sy(0)); c.stroke();
    c.shadowBlur = 0;
  } else {
    c.strokeStyle = rgbaStr(MAP.rgb.accent, 0.35); c.lineWidth = 2;
    c.beginPath(); c.moveTo(sx(DRUM.LINE_ON), sy(0)); c.lineTo(sx(DRUM.LINE_OFF), sy(0)); c.stroke();
  }
  // the floor, by the cut Hour's plan
  const floorCol = { lake: C["m-lake"], orchards: C["m-orch"], lawns: C["m-lawn"], grounds: C["m-grounds"], dim: C["m-dim"], gardens: C["m-orch"] };
  // the floor's stretches for this Hour: the Dim Ends run ~700 m in from each wall
  const cuts = [0, DIM_END];
  for (let i = 1; i < 9; i++) { const zc = i * DRUM.RING_W; if (zc > DIM_END && zc < DRUM.L - DIM_END) cuts.push(zc); }
  cuts.push(DRUM.L - DIM_END, DRUM.L);
  const segs = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const area = floorAreaAt(hour, (cuts[i] + cuts[i + 1]) / 2);
    if (segs.length && segs[segs.length - 1].area === area) segs[segs.length - 1].z1 = cuts[i + 1];
    else segs.push({ area, z0: cuts[i], z1: cuts[i + 1] });
  }
  for (const sg of segs) {
    const { area, z0, z1 } = sg;
    const thick = Math.max(area === "lake" ? 26 : 14, (area === "lake" ? 5 : 3.5) / s);
    fillW(z0, DRUM.FLOOR - thick, z1, DRUM.FLOOR, floorCol[area]);
    if ((area === "orchards" || area === "gardens" || area === "dim") && s > 0.35) {
      c.fillStyle = floorCol[area];
      const sp = area === "orchards" ? 28 : area === "dim" ? 18 : 55;
      for (let z = z0 + sp / 2; z < z1; z += sp) {
        const h = (area === "dim" ? 16 : 10) + (hash32(z | 0, hour) % 7);
        const x = sx(z), y = sy(DRUM.FLOOR - 12 - h * 0.5);
        c.beginPath(); c.arc(x, y, Math.max(1.2, h * 0.55 * s), 0, TAU); c.fill();
      }
    }
  }
  // name the floor's stretches for this Hour
  if (s > 0.16 && s < 3) {
    const darkSky = sky.sun < 0.45;
    for (const sg of segs) {
      let zc = (sg.z0 + sg.z1) / 2;
      if (sg.area === "dim") zc = sg.z0 === 0 ? (DRUM.TERR_DEPTH + DIM_END) / 2 : DRUM.L - (DRUM.TERR_DEPTH + DIM_END) / 2;
      if ((sg.z1 - sg.z0) * s < 40) continue;
      label(AREA_NAMES[sg.area].replace(/^a /, "").replace(/^the /, ""), sx(zc), sy(DRUM.FLOOR - 40) - 4, { px: 10, align: "center", base: "bottom", color: darkSky ? "#e9e3d6" : MAP.colors["ink-2"], haloC: sky.floor });
    }
  }
  // pavilions: about one core in four comes up through the floor
  if (s > 0.5) {
    c.fillStyle = C["m-wall"];
    for (let z = 120; z < L - 100; z += 203) fillW(z - 8, DRUM.FLOOR - 22, z + 8, DRUM.FLOOR - 10, C["m-wall"]);
  }
  // the terraced end walls: they darken with the lamps, and their flats' windows light up
  const wallC = mixC(MAP.rgb["m-wall"], sky.floor, 0.3 + 0.35 * (1 - sky.sun));
  for (const front of [true, false]) {
    c.fillStyle = rgbaStr(wallC, 1);
    c.beginPath();
    const zf = d => (front ? d : L - d);
    c.moveTo(sx(zf(0)), sy(DRUM.FLOOR));
    c.lineTo(sx(zf(DRUM.TERR_DEPTH)), sy(DRUM.FLOOR));
    const tiers = 30;
    for (let t = tiers; t >= 1; t--) {
      const r = DRUM.TERR_TOP + (DRUM.FLOOR - DRUM.TERR_TOP) * (t / tiers);
      const rNext = DRUM.TERR_TOP + (DRUM.FLOOR - DRUM.TERR_TOP) * ((t - 1) / tiers);
      const d = DRUM.TERR_DEPTH * (t / tiers);
      const dNext = DRUM.TERR_DEPTH * ((t - 1) / tiers);
      c.lineTo(sx(zf(d)), sy(rNext));
      c.lineTo(sx(zf(dNext)), sy(rNext));
      void r;
    }
    c.lineTo(sx(zf(0)), sy(DRUM.TERR_TOP));
    c.closePath(); c.fill();
    if (sky.sun < 0.5) {   // terrace flats: the only windows in Sorrel, on the risers
      c.fillStyle = rgbaStr([255, 214, 140, 1], 0.85 * (1 - sky.sun * 2));
      const dot = clamp(s * 6, 1, 3);
      for (let t = 1; t <= 30; t++) {
        const rr = DRUM.TERR_TOP + (DRUM.FLOOR - DRUM.TERR_TOP) * (t / 30);
        const d = DRUM.TERR_DEPTH * (t / 30);
        for (let k = 0; k < 3; k++) {
          if (hash32(t, k, front ? 1 : 2, hour) % 3 === 0) continue;
          const y = sy(rr - 8 - k * 12);
          c.fillRect(sx(zf(d)) - (front ? dot + 0.5 : -0.5), y, dot, dot);
        }
      }
    }
  }
  // the axle halls
  fillW(-46, 0, 26, 42, C["m-layer"]);
  fillW(L - 26, 0, L + 46, 42, C["m-layer"]);

  /* grids that appear as you zoom in */
  const view = { z0: wz(0), z1: wz(MAP.W), r0: wr(0), r1: wr(MAP.H) };
  c.strokeStyle = C["m-grid"]; c.lineWidth = 1;
  // ring boundaries
  c.setLineDash([4, 4]);
  for (let i = 1; i < 9; i++) { const x = sx(i * DRUM.RING_W); c.beginPath(); c.moveTo(x, sy(0)); c.lineTo(x, sy(DRUM.R)); c.stroke(); }
  c.setLineDash([]);
  if (s >= 1.6) {   // lift cores, every ~100 m along the axis
    c.strokeStyle = rgbaStr(MAP.rgb.ink, 0.07);
    for (let i = 0; i < 37; i++) {
      const z = (i + 0.5) * L / 37;
      if (z < view.z0 - 10 || z > view.z1 + 10) continue;
      c.beginPath(); c.moveTo(sx(z), sy(DRUM.FLOOR)); c.lineTo(sx(z), sy(DRUM.R)); c.stroke();
    }
  }
  if (s >= 2.2) {   // every deck
    c.strokeStyle = rgbaStr(MAP.rgb.ink, 0.08);
    const nA = clamp(deckAtR(Math.min(view.r1, DRUM.R)), 1, 376), nB = clamp(deckAtR(Math.max(view.r0, DRUM.FLOOR)), 1, 376);
    for (let n = Math.min(nA, nB); n <= Math.max(nA, nB); n++) {
      const y = sy(deckR(n)); c.beginPath(); c.moveTo(sx(0), y); c.lineTo(sx(L), y); c.stroke();
    }
  }
  if (s >= 0.75) drawBlocks(view);
  if (s >= 1.2) drawDeckNumbers(view);
  if (s >= 0.9) for (let i = 1; i <= 9; i++) {   // the station rings, named
    const x = sx(ringCenter(i)), y = sy(deckR(4) - 6);
    if (x < -80 || x > MAP.W + 80) continue;
    label(`Station Ring ${WORDS[i]}`, x, y, { px: 10.5, w: 600, align: "center", base: "bottom", color: MAP.colors.ink });
  }

  /* labels */
  drawLabels(hour, opp, sky);

  /* a walk in progress: its stops, numbered, joined by a faint line */
  if (MAP.walk && MAP.walk.length) {
    c.save();
    c.strokeStyle = rgbaStr(MAP.rgb.bruise, 0.55); c.lineWidth = 1.5; c.setLineDash([2, 4]);
    c.beginPath();
    MAP.walk.forEach((p, i) => { const x = sx(p.spot.z), y = sy(p.spot.r); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
    c.stroke(); c.setLineDash([]);
    MAP.walk.forEach((p, i) => {
      const x = sx(p.spot.z), y = sy(p.spot.r);
      const on = i === MAP.walkAt;
      c.fillStyle = on ? MAP.colors.bruise : MAP.colors.card; c.strokeStyle = MAP.colors.bruise; c.lineWidth = 1.5;
      c.beginPath(); c.arc(x + 9, y - 9, 7.5, 0, TAU); c.fill(); c.stroke();
      c.font = font(9.5, 600); c.textAlign = "center"; c.textBaseline = "middle";
      c.fillStyle = on ? MAP.colors.card : MAP.colors.bruise;
      c.fillText(String(i + 1), x + 9, y - 8.5);
    });
    c.restore();
  }

  /* a route home */
  if (MAP.routeSpots) drawRoute(MAP.routeSpots);

  /* pins */
  drawPins(hour);

  /* the open spot */
  if (MAP.sel && !MAP.selPlace) {
    const x = sx(MAP.sel.z), y = sy(MAP.sel.r);
    c.strokeStyle = C.sel; c.lineWidth = 2;
    c.beginPath(); c.arc(x, y, 9, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo(x - 14, y); c.lineTo(x - 5, y); c.moveTo(x + 5, y); c.lineTo(x + 14, y); c.moveTo(x, y - 14); c.lineTo(x, y - 5); c.moveTo(x, y + 5); c.lineTo(x, y + 14); c.stroke();
    if (MAP.sel.block && s >= 0.3) {
      const b = MAP.sel.block;
      c.strokeStyle = rgbaStr(MAP.rgb.sel, 0.9); c.lineWidth = 1.5;
      c.strokeRect(...rectW(b.z0, b.rIn, b.z1, b.rOut));
    }
  }
}

function drawBlocks(view) {
  const c = CTX, s = MAP.s;
  const all = STRATA.concat(KEEL_STRATA, LINE_STRATA);
  const showNames = s >= 1.0;
  for (const st of all) {
    if (st.rIn > view.r1 || st.rOut < view.r0) continue;
    const yA = sy(st.rIn), yB = sy(st.rOut), h = yB - yA;
    c.strokeStyle = rgbaStr(MAP.rgb.ink, 0.16); c.lineWidth = 1;
    c.beginPath(); c.moveTo(sx(0), yA); c.lineTo(sx(DRUM.L), yA); c.moveTo(sx(0), yB); c.lineTo(sx(DRUM.L), yB); c.stroke();
    const k = Math.floor(MAP.theta / TAU * st.N) % st.N;
    for (let a = 0; a < 18; a++) {
      const z0 = a * DRUM.BLOCK_Z, z1 = z0 + DRUM.BLOCK_Z;
      if (z1 < view.z0 || z0 > view.z1) continue;
      const xa = sx(z0), xb = sx(z1);
      c.beginPath(); c.moveTo(xa, yA); c.lineTo(xa, yB); c.stroke();
      if (!showNames || h < 11) continue;
      const b = makeBlock(st, a, k);
      let nm;
      if (st.kind === "res") nm = theName(nbName(b), true);
      else if (st.kind === "keel") { const pool = (D.keel || []).filter(u => !u.decks || (b.to >= u.decks[0] && b.from <= u.decks[1])); nm = pool.length ? pick(rng(b.seed), pool).name : "Keel"; }
      else nm = "line deck " + st.from;
      const claimed = CLAIMS.has(b.key);
      if (claimed && s >= 1.6) continue;   // its landmark pin carries the name
      const px = clamp(Math.min(h * 0.42, 13), 8, 13);
      c.font = font(px, claimed ? 600 : 400, st.kind === "res" ? "disp" : "mono");
      const w = xb - xa - 8;
      if (w < 30) continue;
      let t = nm;
      while (t.length > 3 && c.measureText(t).width > w) t = t.slice(0, -2);
      if (t !== nm) t = t.replace(/\s+\S?$/, "") + "…";
      c.textAlign = "center"; c.textBaseline = "middle";
      c.fillStyle = claimed ? MAP.colors.ink : rgbaStr(MAP.rgb["m-label"], st.kind === "res" ? 0.78 : 0.6);
      c.fillText(t, (xa + xb) / 2, (yA + yB) / 2);
    }
  }
}

function drawDeckNumbers(view) {
  const c = CTX, s = MAP.s;
  const every = s >= 4 ? 1 : s >= 2 ? 5 : 25;
  const x = Math.max(sx(0) + 4, 4);
  for (let n = 1; n <= 375; n++) {
    if (n % every && !(every > 1 && LINE_FIRST.includes(n))) continue;
    const r = deckR(n) - 2;
    if (r < view.r0 || r > view.r1) continue;
    const y = sy(r);
    if (y < 52 && x < 260) continue;   // keep clear of the corner plate
    label(String(n), x, y, { px: 10, base: "middle", color: MAP.colors["ink-2"] });
  }
}

function drawLabels(hour, opp, sky) {
  const s = MAP.s, L = DRUM.L, C = MAP.colors;
  const big = clamp(s * 60, 10, 15);
  // bands, at the front edge of the decks
  const xb = Math.max(sx(0) + 6, 6);
  const bandLabels = [["THE KEEL", (DRUM.R + deckR(15)) / 2], ["LOW DECKS", (deckR(16) + deckR(113)) / 2], ["MIDDLE DECKS", (deckR(114) + deckR(301)) / 2], ["HIGH DECKS", (deckR(302) + DRUM.FLOOR) / 2]];
  if (s < 0.75) for (const [t, r] of bandLabels) {
    if (t === "THE KEEL" && s < 0.25) continue;
    label(t, xb + (s < 0.2 ? 0 : 0), sy(r), { px: big * 0.85, w: 700, fam: "disp", base: "middle" });
  }
  // the Hollow, the Spindle, the sunline: light text on a dark sky
  const hx = sx(L / 2);
  const darkSky = (sky.floor[0] + sky.floor[1] + sky.floor[2]) / 3 < 110;
  const skyInk = darkSky ? "#efe9dc" : C["ink-2"], skyHalo = darkSky ? sky.floor : sky.floor;
  if (s < 2.5) {
    label("THE HOLLOW", hx, sy(DRUM.FLOOR * 0.62), { px: big * 1.25, w: 800, fam: "disp", align: "center", base: "middle", color: skyInk, haloC: skyHalo });
    label(`floor of ${HOUR_NAMES[hour]} below · the far bank, ${HOUR_NAMES[opp]}, 3 km overhead`, hx, sy(DRUM.FLOOR * 0.62) + big * 1.3, { px: Math.max(9.5, big * 0.72), align: "center", base: "middle", color: skyInk, haloC: skyHalo });
  }
  label(spindleOpen(MAP.clock) ? "the Spindle · open, lamp-night" : "the sunline · " + Math.round(sunLevel(MAP.clock) * 100) + "%", hx, sy(0) + 14, { px: 10.5, align: "center", base: "middle", color: skyInk, haloC: sky.top });
  // the two ends, written up the layers as on a drawing
  if (s < 2.5 && s > 0.08) {
    const vlabel = (t, z, r) => {
      CTX.save(); CTX.translate(sx(z), sy(r)); CTX.rotate(-Math.PI / 2);
      label(t, 0, 0, { px: 10.5, align: "center", base: "middle", w: 500, color: "#f1ede4", halo: false });
      CTX.restore();
    };
    vlabel("RECTENNAS · FRONT · POWER IN", -165, 1500);
    vlabel("RADIATORS · BACK · HEAT OUT", L + 104, 2350);
    label("the Windows", sx(L + 196), sy(455), { px: 10, align: "center", base: "middle", color: C["ink-2"] });
  }
  // rings, under the rim in the mid-raft
  const yr = sy(3150);
  if (yr < MAP.H + 20) for (let i = 1; i <= 9; i++) {
    label(s > 0.45 ? "Ring " + WORDS[i] : String(i), sx(ringCenter(i)), yr, { px: 11, align: "center", base: "middle", color: "#f3e6cc", halo: false });
  }
  if (s > 0.16) label("the mid-raft · X-ray flood · Lovage, Tansy, Chervil and Rue a glide away", sx(L / 2), sy(3330), { px: 10, align: "center", base: "middle", color: "#bdb6a6", halo: false });
  // which Hour the drawing cuts, on a small plate in the corner
  const t1 = `Cut through ${HOUR_NAMES[hour]} (${WORDS[hour]})`, t2 = `overhead: ${HOUR_NAMES[opp]} · lamp clock ${fmtClock(MAP.clock)}`;
  CTX.font = font(12, 500); const w1 = CTX.measureText(t1).width;
  CTX.font = font(10.5, 400); const w2 = CTX.measureText(t2).width;
  CTX.fillStyle = rgbaStr(MAP.rgb.card, 0.92); CTX.strokeStyle = C["bg-3"]; CTX.lineWidth = 1;
  CTX.fillRect(6, 6, Math.max(w1, w2) + 16, 38); CTX.strokeRect(6.5, 6.5, Math.max(w1, w2) + 15, 37);
  label(t1, 14, 19, { px: 12, w: 500, base: "middle", color: C.ink, halo: false });
  label(t2, 14, 34, { px: 10.5, w: 400, base: "middle", color: C["ink-2"], halo: false });
}

function drawRoute(pts) {
  const c = CTX;
  c.save();
  c.strokeStyle = MAP.colors.lattice; c.lineWidth = 2.2; c.setLineDash([7, 5]);
  c.beginPath();
  pts.forEach((p, i) => { const x = sx(p.z), y = sy(p.r); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
  c.stroke(); c.setLineDash([]);
  const h = pts[0];
  c.fillStyle = MAP.colors.lattice;
  c.beginPath(); c.arc(sx(h.z), sy(h.r), 4.5, 0, TAU); c.fill();
  label("home", sx(h.z) + 8, sy(h.r) - 8, { px: 10.5, color: MAP.colors.lattice });
  c.restore();
}

function drawPins(hour) {
  const c = CTX, s = MAP.s, C = MAP.colors;
  MAP.pins = [];
  const big = s > 0.9;
  const showLabels = s >= 1.6;
  const list = PLACES.filter(p => !MAP.kinds || MAP.kinds.has(p.kind));
  // draw other Hours' pins first, then this Hour's on top
  const ordered = list.slice().sort((a, b) => (a.spot.hour === hour) - (b.spot.hour === hour));
  for (const p of ordered) {
    const x = sx(p.spot.z), y = sy(p.spot.r);
    if (x < -20 || y < -20 || x > MAP.W + 20 || y > MAP.H + 20) continue;
    const here = !p.hour || p.spot.hour === hour || p.zone === "beyond" || p.zone === "axle";
    const sel = MAP.selPlace === p.id, hov = MAP.hoverPin === p.id;
    const rad = (here ? (big ? 6 : 4.6) : (big ? 4.4 : 3.2)) + (hov ? 1.5 : 0);
    c.globalAlpha = here ? 1 : 0.62;
    c.fillStyle = here ? C.pin : C.card;
    c.strokeStyle = here ? C["pin-edge"] : C.pin;
    c.lineWidth = here ? 1.4 : 1.6;
    c.beginPath(); c.arc(x, y, rad, 0, TAU); c.fill(); c.stroke();
    c.globalAlpha = 1;
    if (sel) {
      c.strokeStyle = C.sel; c.lineWidth = 2;
      c.beginPath(); c.arc(x, y, rad + 5, 0, TAU); c.stroke();
    }
    MAP.pins.push({ p, x, y, rad });
    if ((showLabels && here) || sel || hov) label(p.name, x + rad + 5, y, { px: 11.5, w: 600, fam: "disp", base: "middle", color: C.ink });
  }
}

function frame(now) {
  if (MAP.anim) MAP.anim(now);
  if (MAP.dirty && CTX) { MAP.dirty = false; draw(); }
  requestAnimationFrame(frame);
}

function resizeMap() {
  const box = CANVAS.parentElement.getBoundingClientRect();
  const first = !MAP.W;
  const oldC = MAP.W ? { z: wz(MAP.W / 2), r: wr(MAP.H / 2) } : null;
  MAP.W = box.width; MAP.H = box.height;
  MAP.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  CANVAS.width = Math.round(MAP.W * MAP.dpr); CANVAS.height = Math.round(MAP.H * MAP.dpr);
  const f = fitView();
  if (first || !oldC) setView(f);
  else setView({ s: Math.max(MAP.s, MAP.minS), tx: MAP.W / 2 - MAP.s * oldC.z, ty: MAP.H / 2 - MAP.s * oldC.r });
  MAP.dirty = true;
}

/* ---- pointer handling: drag, wheel, pinch, tap ---- */
function pinAt(x, y, touch) {
  let best = null, bd = touch ? 22 : 13;
  for (const q of MAP.pins) {
    const d = Math.hypot(q.x - x, q.y - y) - q.rad;
    if (d < bd) { bd = d; best = q.p; }
  }
  return best;
}

function initMap(canvas) {
  CANVAS = canvas; CTX = canvas.getContext("2d");
  readColors();
  resizeMap();
  new ResizeObserver(() => resizeMap()).observe(canvas.parentElement);
  try { window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", readColors); } catch (e) { /* old browsers */ }
  new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { MAP.dirty = true; });

  const pts = new Map();
  let drag = null, pinch = null, moved = false;
  const pos = e => { const b = canvas.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };

  canvas.addEventListener("pointerdown", e => {
    canvas.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, pos(e));
    moved = false;
    if (pts.size === 1) { const p = pos(e); drag = { x: p.x, y: p.y, tx: MAP.tx, ty: MAP.ty, touch: e.pointerType !== "mouse" }; }
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: MAP.s, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, z: wz((a.x + b.x) / 2), r: wr((a.y + b.y) / 2) };
      drag = null;
    }
    MAP.anim = null;
  });
  canvas.addEventListener("pointermove", e => {
    const p = pos(e);
    if (pts.has(e.pointerId)) pts.set(e.pointerId, p);
    if (pinch && pts.size >= 2) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const s = clamp(pinch.s * d / Math.max(pinch.d, 1), MAP.minS, MAP.maxS);
      MAP.s = s; MAP.tx = mid.x - s * pinch.z; MAP.ty = mid.y - s * pinch.r;
      clampView(); MAP.dirty = true; moved = true;
      return;
    }
    if (drag) {
      const dx = p.x - drag.x, dy = p.y - drag.y;
      if (!moved && Math.hypot(dx, dy) > (drag.touch ? 8 : 4)) { moved = true; canvas.classList.add("grab"); }
      if (moved) { MAP.tx = drag.tx + dx; MAP.ty = drag.ty + dy; clampView(); MAP.dirty = true; }
      return;
    }
    if (e.pointerType === "mouse" && MAP.onHover) MAP.onHover(p.x, p.y, pinAt(p.x, p.y, false));
  });
  const end = e => {
    const p = pos(e);
    const wasDrag = drag, wasMoved = moved;
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = null;
    if (pts.size === 0) {
      canvas.classList.remove("grab");
      if (wasDrag && !wasMoved && e.type === "pointerup" && MAP.onPick) {
        const pin = pinAt(p.x, p.y, wasDrag.touch);
        MAP.onPick(pin, wz(p.x), wr(p.y));
      }
      drag = null;
    }
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("pointerleave", () => { if (MAP.onHover) MAP.onHover(null); });
  canvas.addEventListener("wheel", e => {
    e.preventDefault();
    const p = pos(e);
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    MAP.anim = null;
    zoomAt(p.x, p.y, Math.exp(-dy * 0.0016));
  }, { passive: false });
  canvas.addEventListener("dblclick", e => { const p = pos(e); flyTo(viewFor(wz(p.x), wr(p.y), MAP.s * 2.2), 350); });
  canvas.tabIndex = 0;
  canvas.addEventListener("keydown", e => {
    const step = 60;
    const k = e.key;
    if (k === "ArrowLeft") MAP.tx += step; else if (k === "ArrowRight") MAP.tx -= step;
    else if (k === "ArrowUp") MAP.ty += step; else if (k === "ArrowDown") MAP.ty -= step;
    else if (k === "+" || k === "=") zoomAt(MAP.W / 2, MAP.H / 2, 1.5);
    else if (k === "-" || k === "_") zoomAt(MAP.W / 2, MAP.H / 2, 1 / 1.5);
    else if (k === "Enter" || k === " ") { if (MAP.onPick) MAP.onPick(pinAt(MAP.W / 2, MAP.H / 2, true), wz(MAP.W / 2), wr(MAP.H / 2)); }
    else return;
    e.preventDefault(); clampView(); MAP.dirty = true;
  });

  requestAnimationFrame(frame);
}
