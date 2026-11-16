// Parametric low-poly people, made to be drawn by the thousand.
// Pure functions, no dependencies. (kit/folk.js turns these into geometry; kit/mats.js takes the shader half.)
//
// Space: metres, y up, the figure faces +z, +x is the figure's left, origin on the ground between the feet.
// A mesh is flat triangles: every vertex carries a part (what colours it), a baked shade (ambient occlusion),
// and a rig: [chain, wUpper, wLower] where chain is 0 body, 1/2 left/right leg, 3/4 left/right arm, 5 head.
// For the body wUpper is how far the vertex follows the chest's twist; for the head how far it follows a look.
// What a person's look picks from. Skin is the old six; hair runs dark to fair, then auburn, grey and white.
export const FOLK_SKIN = ['#f1c9a5', '#d9a87c', '#b07b52', '#8a5a3a', '#5e3b26', '#e8b894'];
export const FOLK_HAIR = ['#241a15', '#35261c', '#4a3323', '#684a30', '#8a6b3f', '#b39253', '#7a3c24', '#8f8f8b', '#d6d2c8'];
export const FOLK_LEGS = ['#3a3f48', '#4b505b', '#5c5549', '#2f3b45', '#6a6f7a', '#7b6c58', '#414c3d', '#8c8577'];

export function makeFolkKit() {
  const PART = { fixed: 0, skin: 1, hair: 2, top: 3, legs: 4, shoes: 5, eye: 6 };
  const TAU = Math.PI * 2;

  // ---- the skeleton, for a figure of scale 1 (1.745 m tall). Everything scales by a body's k.
  const J = {
    hip: [0.088, 0.900, 0.000], knee: [0.092, 0.490, 0.002], ankle: [0.092, 0.085, -0.006],
    shoulder: [0.190, 1.392, -0.005], elbow: [0.234, 1.115, -0.005], wrist: [0.271, 0.878, 0.010],
    neck: [0, 1.490, -0.010], head: [0, 1.560, -0.004], chest: [0, 1.200, 0], waist: [0, 1.040, 0], pelvis: [0, 0.930, 0],
  };
  // the gait: one step is pi of phase; these are the numbers the vertex shader uses too
  const GAIT = { thigh: 0.42, kneeBase: 0.06, kneeSwing: 0.95, kneeLead: -0.30, kneePow: 1.5, arm: 0.40, armRest: 0.02, elbowRest: 0.14, elbowWalk: 0.12, elbowSwing: 0.32, twist: 0.085, drop: 0.80, stepPerMetre: 4.8 };

  // ---- bodies
  const BODIES = {
    // k: overall scale. sh: shoulder joint x. Torso rings: [y, halfWidth, halfDepth, zCentre].
    a: {
      k: 1.0, sh: 0.190, armR: 1.0, legR: 1.04, neckR: 0.052, headS: 1.09, hipX: 0.088,
      torso: [[0.790, 0.085, 0.074, 0.000], [0.860, 0.150, 0.100, -0.004], [0.930, 0.158, 0.106, -0.006], [1.000, 0.150, 0.098, -0.002],
        [1.080, 0.134, 0.090, 0.000], [1.200, 0.152, 0.102, 0.004], [1.310, 0.174, 0.110, 0.006], [1.395, 0.176, 0.100, 0.000], [1.450, 0.150, 0.082, -0.006], [1.488, 0.072, 0.062, -0.008]],
    },
    b: {
      k: 0.945, sh: 0.166, armR: 0.86, legR: 1.0, neckR: 0.044, headS: 1.10, hipX: 0.090,
      torso: [[0.790, 0.088, 0.076, 0.000], [0.860, 0.158, 0.104, -0.006], [0.930, 0.170, 0.110, -0.010], [1.000, 0.154, 0.098, -0.004],
        [1.080, 0.118, 0.084, 0.000], [1.200, 0.134, 0.098, 0.006], [1.310, 0.152, 0.112, 0.014], [1.395, 0.154, 0.096, 0.000], [1.450, 0.130, 0.078, -0.006], [1.488, 0.062, 0.056, -0.008]],
    },
    c: {
      k: 0.66, sh: 0.176, armR: 1.08, legR: 1.12, neckR: 0.054, headS: 1.36, hipX: 0.086,
      torso: [[0.790, 0.090, 0.080, 0.000], [0.860, 0.152, 0.106, -0.004], [0.930, 0.158, 0.112, -0.004], [1.000, 0.154, 0.108, 0.002],
        [1.080, 0.146, 0.104, 0.006], [1.200, 0.150, 0.106, 0.006], [1.310, 0.160, 0.106, 0.004], [1.395, 0.162, 0.096, 0.000], [1.450, 0.138, 0.080, -0.006], [1.488, 0.070, 0.062, -0.008]],
    },
  };
  // which torso rings each level of detail keeps (indices into torso[])
  const TORSO_LOD = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [0, 1, 2, 4, 6, 7, 8, 9], [1, 4, 7, 9]];
  const SEG = { torso: [8, 6, 4], leg: [7, 5, 4], arm: [6, 4, 3], head: [8, 6, 4], neck: [6, 4, 0], shoe: [6, 4, 0], hand: [4, 0, 0] };

  // ---- small vector helpers
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = (a) => Math.hypot(a[0], a[1], a[2]);
  const nrm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const se = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), 2 / e);
  // rotate v about a unit axis by an angle
  function rot(v, axis, ang) {
    const c = Math.cos(ang), s = Math.sin(ang), d = dot(axis, v), cr = cross(axis, v);
    return [v[0] * c + cr[0] * s + axis[0] * d * (1 - c), v[1] * c + cr[1] * s + axis[1] * d * (1 - c), v[2] * c + cr[2] * s + axis[2] * d * (1 - c)];
  }

  // ---- the builder: a soup of triangles with per-vertex shade and rig
  class Soup {
    constructor() { this.t = []; }
    // vertices are { p, ao, rig: [chain, wu, wl], hem }
    tri(a, b, c, part, out) {
      // wind it so that it faces away from `out` (a point inside the part)
      const n = cross(sub(b.p, a.p), sub(c.p, a.p));
      const ctr = [(a.p[0] + b.p[0] + c.p[0]) / 3, (a.p[1] + b.p[1] + c.p[1]) / 3, (a.p[2] + b.p[2] + c.p[2]) / 3];
      if (len(n) < 1e-12) return;
      if (dot(n, sub(ctr, out)) < 0) this.t.push({ v: [a, c, b], part }); else this.t.push({ v: [a, b, c], part });
    }
    /**
     * Loft a tube through rings. A ring: { c: centre, u, v: the plane's axes (default x and z), rx, rz, e: squareness
     * (2 = ellipse), ao: number or (theta) => number, rig, part: of the span above this ring, hem }.
     * opts: n (sides), capStart / capEnd: bulge in metres (undefined = open), partCap
     */
    loft(rings, opts) {
      const n = opts.n, R = [];
      for (const r of rings) {
        const u = r.u || [1, 0, 0], v = r.v || [0, 0, 1], e = r.e || 2, row = [];
        for (let j = 0; j < n; j++) {
          const th = (n % 2 ? j : j + 0.5) / n * TAU, sx = se(Math.sin(th), e), sz = se(Math.cos(th), e);
          const p = add(add(r.c, mul(u, r.rx * sx)), mul(v, r.rz * sz));
          const ao = typeof r.ao === 'function' ? r.ao(th, sx, sz) : (r.ao === undefined ? 1 : r.ao);
          const part = typeof r.part === 'function' ? r.part(th, sx, sz) : r.part;
          row.push({ p, ao, rig: r.rig || [0, 0, 0], hem: r.hem || 0, part });
        }
        R.push(row);
      }
      for (let i = 0; i < rings.length - 1; i++) {
        const mid = mul(add(rings[i].c, rings[i + 1].c), 0.5);
        for (let j = 0; j < n; j++) {
          const a = R[i][j], b = R[i][(j + 1) % n], c = R[i + 1][(j + 1) % n], d = R[i + 1][j];
          const part = a.part === undefined ? rings[i].part : a.part;
          // the shorter diagonal makes the flatter pair of facets
          if (len(sub(a.p, c.p)) <= len(sub(b.p, d.p))) { this.tri(a, b, c, part, mid); this.tri(a, c, d, part, mid); }
          else { this.tri(a, b, d, part, mid); this.tri(b, c, d, part, mid); }
        }
      }
      const cap = (ri, bulge, inward) => {
        const r = rings[ri], row = R[ri], other = rings[ri === 0 ? 1 : rings.length - 2];
        const axis = nrm(sub(r.c, other.c));
        const tip = { p: add(r.c, mul(axis, bulge)), ao: typeof r.ao === 'function' ? r.ao(0, 0, 0) : (r.ao === undefined ? 1 : r.ao), rig: r.rig || [0, 0, 0], hem: r.hem || 0 };
        const part = opts.partCap !== undefined ? opts.partCap : (ri === 0 ? rings[0].part : rings[rings.length - 2].part);
        for (let j = 0; j < n; j++) this.tri(row[j], row[(j + 1) % n], tip, typeof part === 'function' ? part(0, 0, 0) : part, inward);
      };
      if (opts.capStart !== undefined) cap(0, opts.capStart, rings[1].c);
      if (opts.capEnd !== undefined) cap(rings.length - 1, opts.capEnd, rings[rings.length - 2].c);
      return this;
    }
    // a copy of some triangles mirrored left to right; chain 1 <-> 2, 3 <-> 4
    mirror(from) {
      const sw = [0, 2, 1, 4, 3, 5, 6], end = this.t.length;
      for (let i = from; i < end; i++) {
        const t = this.t[i], m = (q) => ({ p: [-q.p[0], q.p[1], q.p[2]], ao: q.ao, rig: [sw[q.rig[0]], q.rig[1], q.rig[2]], hem: q.hem });
        this.t.push({ v: [m(t.v[0]), m(t.v[2]), m(t.v[1])], part: t.part });
      }
      return this;
    }
  }

  // ---- parts
  function torso(S, body, lod, o) {
    const T = body.torso, keep = TORSO_LOD[lod], n = SEG.torso[lod], rings = [];
    // how far each ring follows the chest when it twists against the hips
    const tw = (y) => Math.max(0, Math.min(1, (y - 0.98) / 0.34));
    const hemY = o.hem || 0;            // a tunic or skirt hangs below the belt to this height
    for (const i of keep) {
      const [y, w, d, zc] = T[i];
      const isTop = y >= 0.999, shirt = y >= 0.93 && lod < 2;
      const side = (th, sx) => 1 - 0.16 * Math.pow(Math.abs(sx), 3) * (y > 1.15 && y < 1.42 ? 1 : 0.3);   // under the arms
      const lift = isTop || (shirt && y >= 0.93) ? 0.010 : 0;
      rings.push({ c: [0, y, zc], rx: w + (isTop ? 0.004 : 0), rz: d + (isTop ? 0.004 : 0), e: i >= 8 ? 2.2 : 2.6, ao: (th, sx) => side(th, sx) * (y < 0.82 ? 0.72 : y > 1.47 ? 0.85 : 1), rig: [0, tw(y), 0], part: y >= 0.999 || (lod >= 1 && y >= 0.85) ? PART.top : PART.legs, _y: y, _lift: lift });
    }
    if (lod === 0 && !hemY) {
      // a shirt's hem stands a little proud of the hips
      const k = rings.findIndex((r) => r.part === PART.top), r = rings[k];
      rings.splice(k, 0, { ...r, c: [0, r._y - 0.045, r.c[2] - 0.002], rx: r.rx + 0.012, rz: r.rz + 0.012, part: PART.top, ao: (th, sx) => 0.93 }, );
      rings.splice(k, 0, { ...rings[k - 1], c: [0, r._y - 0.046, r.c[2] - 0.002], rx: r.rx - 0.002, rz: r.rz - 0.002, part: PART.top, ao: () => 0.6 });
    }
    if (hemY) {
      // a tunic / skirt: the cloth from the waist flares down to a hem; it goes with the thighs when the figure sits
      const k = rings.findIndex((r) => r._y >= 1.07), r = rings[k], hw = o.hemW || 0.2, hd = o.hemD || 0.15;
      const down = [];
      const steps = lod === 0 ? 3 : lod === 1 ? 2 : 1;
      for (let st = steps; st >= 1; st--) { const f = st / steps, y = r._y + (hemY - r._y) * f, g = Math.pow(f, 0.5); down.push({ c: [0, y, -0.004], rx: r.rx + 0.006 + (hw - r.rx) * g, rz: r.rz + 0.006 + (hd - r.rz) * g, e: 2.6, ao: () => 1 - 0.1 * f, rig: [6, Math.min(1, f * 1.25), 0], part: o.hemPart === undefined ? PART.top : o.hemPart, hem: Math.min(1, f * 1.6), _y: y }); }
      // the underside of the hem, dark
      const h = down[0];
      const under = { ...h, c: [0, h._y + 0.012, -0.004], rx: h.rx * 0.55, rz: h.rz * 0.55, ao: () => 0.42 };
      S.loft(lod === 2 ? [...down, ...rings.slice(k)] : [under, ...down, ...rings.slice(k)], { n, capEnd: 0.004, capStart: lod === 2 ? 0 : undefined });
      // what is under the cloth is drawn a little smaller, so that it never shows through
      if (lod < 2) S.loft(rings.slice(0, k + 1).map((q) => ({ ...q, rx: q.rx * 0.9, rz: q.rz * 0.9, part: o.bare ? PART.skin : PART.legs })), { n, capStart: -0.006 });
      return;
    }
    S.loft(rings, { n, capStart: -0.006, capEnd: 0.004 });
  }

  function leg(S, body, lod, o) {
    const n = SEG.leg[lod], q = body.legR, hx = body.hipX, from = S.t.length, L = 1;
    const inner = (th, sx) => 1 - 0.22 * Math.max(0, -sx);          // the side that faces the other leg
    const part = o.bare ? PART.skin : PART.legs;
    const R = [
      { y: 0.935, rx: 0.074, rz: 0.084, cx: hx + 0.002, cz: -0.004, rig: [L, 0.15, 0], lod: 0 },
      { y: 0.815, rx: 0.080, rz: 0.090, cx: hx + 0.002, cz: -0.004, rig: [L, 1, 0], lod: 2 },
      { y: 0.650, rx: 0.069, rz: 0.078, cx: hx + 0.004, cz: 0.000, rig: [L, 1, 0], lod: 0 },
      { y: 0.500, rx: 0.051, rz: 0.056, cx: hx + 0.004, cz: 0.006, rig: [L, 1, 0.5], lod: 2 },
      { y: 0.375, rx: 0.052, rz: 0.062, cx: hx + 0.004, cz: -0.012, rig: [L, 1, 1], lod: 0 },
      { y: 0.200, rx: 0.039, rz: 0.044, cx: hx + 0.004, cz: -0.010, rig: [L, 1, 1], lod: 1 },
      { y: 0.095, rx: 0.036, rz: 0.040, cx: hx + 0.004, cz: -0.006, rig: [L, 1, 1], lod: 2 },
    ];
    if (lod === 2) { R[6].y = 0.0; R[6].cz = 0.02; R[6].rz = 0.07; R[1].y = o.hem ? o.hem + 0.08 : 0.88; R[1].rig = [L, o.hem ? 1 : 0.8, 0]; }
    const under = (r) => !(o.hem && r.y > o.hem + 0.1);
    const slim = (y) => (o.hem && y > o.hem ? 0.78 : 1);
    const rings = R.filter((r) => r.lod >= lod && under(r)).map((r) => ({ c: [r.cx - (o.hem && r.y > o.hem ? 0.010 : 0), r.y, r.cz], rx: r.rx * q * slim(r.y), rz: r.rz * q * slim(r.y), e: 2.1, ao: (th, sx) => inner(th, sx) * (r.y > 0.9 ? 0.75 : 1), rig: r.rig, part: lod === 2 && r.y < 0.3 ? PART.shoes : part }));
    if (lod === 0 && !o.bare) {
      // the cuff of a trouser leg, a little wider than the ankle, and dark inside
      const last = rings[rings.length - 1];
      rings[rings.length - 1] = { ...last, rx: last.rx + 0.010, rz: last.rz + 0.010 };
      rings.push({ ...last, c: [last.c[0], last.c[1] + 0.004, last.c[2]], rx: last.rx * 0.8, rz: last.rz * 0.8, ao: () => 0.45 });
    }
    S.loft(rings, { n, capStart: 0.0, capEnd: lod === 2 ? 0.0 : undefined });
    if (lod < 2) {
      // a shoe: lofted from heel to toe
      const m = SEG.shoe[lod], x = hx + 0.004, w = 0.046 * q, rig = [L, 1, 1];
      const sh = (z, hw, h, ao) => ({ c: [x, h / 2, z], u: [1, 0, 0], v: [0, 1, 0], rx: hw, rz: h / 2, e: 3.2, ao: (th, sx, sz) => ao * (sz < -0.5 ? 0.6 : 1), rig, part: PART.shoes });
      const shoe = lod === 0 ? [sh(-0.074, w * 0.78, 0.085, 0.9), sh(-0.02, w, 0.118, 1), sh(0.075, w * 1.04, 0.080, 1), sh(0.150, w * 0.9, 0.052, 1)] : [sh(-0.07, w * 0.85, 0.10, 0.95), sh(0.03, w * 1.02, 0.10, 1), sh(0.15, w * 0.9, 0.052, 1)];
      S.loft(shoe, { n: m, capStart: 0.012, capEnd: 0.022 });
    }
    S.mirror(from);
  }

  function arm(S, body, lod, o) {
    const n = SEG.arm[lod], q = body.armR, from = S.t.length, A = 3;
    const s0 = [body.sh, J.shoulder[1], J.shoulder[2]];
    const out = 9 * Math.PI / 180, fwd = 7 * Math.PI / 180;
    const dU = nrm([Math.sin(out), -Math.cos(out), 0]);                           // the upper arm hangs a little out
    const dL = nrm([Math.sin(out) * 0.85, -Math.cos(out), Math.sin(fwd)]);        // the forearm a little forward
    const elbow = add(s0, mul(dU, 0.280));
    const at = (t) => t <= 0.28 ? add(s0, mul(dU, t)) : add(elbow, mul(dL, t - 0.28));
    const frame = (t) => { const d = t <= 0.28 ? dU : dL; const u = nrm(cross([0, 0, 1], d)); const v = nrm(cross(d, u)); return { u: mul(u, -1), v }; };
    const inner = (th, sx) => 1 - 0.2 * Math.max(0, -sx);            // the side against the body
    const sleeve = o.sleeve === undefined ? 0.5 : o.sleeve;            // where the sleeve ends, as arm length from the shoulder
    const R = [
      { t: -0.020, rx: 0.040, rz: 0.048, rig: [A, 0.3, 0], lod: 1 },
      { t: 0.045, rx: 0.049, rz: 0.056, rig: [A, 1, 0], lod: 2 },
      { t: 0.150, rx: 0.045, rz: 0.050, rig: [A, 1, 0], lod: 0 },
      { t: 0.278, rx: 0.036, rz: 0.039, rig: [A, 1, 0.5], lod: 1 },
      { t: 0.360, rx: 0.037, rz: 0.038, rig: [A, 1, 1], lod: 0 },
      { t: 0.505, rx: 0.027, rz: 0.026, rig: [A, 1, 1], lod: 1 },
    ];
    const rings = [];
    for (const r of R) {
      if (r.lod < lod) continue;
      const f = frame(r.t), isCloth = r.t < sleeve - 0.01;
      rings.push({ c: at(r.t), u: f.u, v: f.v, rx: r.rx * q + (isCloth ? 0.004 : 0), rz: r.rz * q + (isCloth ? 0.004 : 0), ao: inner, rig: r.rig, part: isCloth ? PART.top : PART.skin, _t: r.t });
    }
    if (lod === 2) {
      // one tapering stick, ending where the hand would
      const f = frame(0.6);
      rings.push({ c: at(0.66), u: f.u, v: f.v, rx: 0.024, rz: 0.03, ao: inner, rig: [A, 1, 1], part: PART.skin });
      rings[0].part = sleeve > 0.3 ? PART.top : PART.skin;
      S.loft(rings, { n, capStart: 0.008, capEnd: 0.01 });
      S.mirror(from);
      return;
    }
    if (lod === 0 && sleeve > 0.1) {
      // the cuff: the sleeve ends in a small step down to the skin
      const k = rings.findIndex((r) => r.part === PART.skin);
      if (k > 0) {
        const r = rings[k], prev = rings[k - 1], t = sleeve, f = frame(t);
        const lerp = (a, b) => a + (b - a) * ((t - prev._t) / (r._t - prev._t));
        const rx = lerp(prev.rx - 0.004, r.rx), rz = lerp(prev.rz - 0.004, r.rz);
        rings.splice(k, 0, { c: at(t), u: f.u, v: f.v, rx: rx + 0.008, rz: rz + 0.008, ao: inner, rig: t > 0.28 ? [A, 1, 1] : [A, 1, 0], part: PART.top, _t: t },
          { c: at(t - 0.003), u: f.u, v: f.v, rx: rx, rz: rz, ao: () => 0.6, rig: t > 0.28 ? [A, 1, 1] : [A, 1, 0], part: PART.skin, _t: t });
      }
    } else if (lod === 1) {
      for (const r of rings) r.part = r._t < sleeve - 0.08 ? PART.top : PART.skin;
    }
    // the hand: a mitten, thin across the palm
    const hf = frame(0.6), rigH = [A, 1, 1];
    if (lod === 0) {
      rings.push({ c: at(0.535), u: hf.u, v: hf.v, rx: 0.020, rz: 0.031, e: 2.6, ao: inner, rig: rigH, part: PART.skin });
      rings.push({ c: add(at(0.605), [0, 0, 0.006]), u: hf.u, v: hf.v, rx: 0.024, rz: 0.042, e: 2.8, ao: inner, rig: rigH, part: PART.skin });
      rings.push({ c: add(at(0.672), [-0.006, 0, 0.012]), u: hf.u, v: hf.v, rx: 0.017, rz: 0.030, e: 2.6, ao: inner, rig: rigH, part: PART.skin });
      S.loft(rings, { n, capStart: 0.008, capEnd: 0.016 });
    } else {
      rings.push({ c: add(at(0.61), [0, 0, 0.006]), u: hf.u, v: hf.v, rx: 0.019, rz: 0.040, e: 2.6, ao: inner, rig: rigH, part: PART.skin });
      S.loft(rings, { n, capStart: 0.008, capEnd: 0.06 });
    }
    S.mirror(from);
  }

  // The head: each ring runs from a point on the face (F) round to a point on the back of the head (B), given as
  // [y, z], with a half-width. The ring from the top of the forehead to the nape is the hairline.
  const HEAD = [
    { F: [1.528, 0.080], B: [1.548, 0.034], rx: 0.027 },     // chin
    { F: [1.566, 0.098], B: [1.561, -0.022], rx: 0.053 },    // mouth, the angle of the jaw
    { F: [1.611, 0.103], B: [1.562, -0.060], rx: 0.067 },    // under the nose, under the ears
    { F: [1.656, 0.101], B: [1.574, -0.086], rx: 0.0745 },   // brow
    { F: [1.702, 0.093], B: [1.592, -0.098], rx: 0.077 },    // the hairline: forehead to nape
    { F: [1.748, 0.056], B: [1.680, -0.104], rx: 0.071 },
    { F: [1.752, -0.008], B: [1.737, -0.062], rx: 0.041 },   // crown
  ];
  const HAIRLINE = 4;
  const HEAD_LOD = [[0, 1, 2, 3, 4, 5, 6], [0, 2, 4, 5, 6], [1, 4, 6]];
  const HE = 2.25;

  function head(S, body, lod, o) {
    const n = SEG.head[lod], hs = body.headS, piv = [0, J.neck[1] + 0.025, J.neck[2]];
    const W = (p) => add(piv, mul(sub(p, piv), hs));            // bigger for a child, about the top of the neck
    const rigH = [5, 1, 0];
    const style = o.hair || 'short';
    const grow = lod === 0 ? (style === 'crop' ? 0.003 : 0.009) : 0;
    const geom = (i, f) => {
      const a = HEAD[i], b = HEAD[Math.min(i + 1, HEAD.length - 1)], L = (p, q) => p + (q - p) * (f || 0);
      const F = [L(a.F[0], b.F[0]), L(a.F[1], b.F[1])], B = [L(a.B[0], b.B[0]), L(a.B[1], b.B[1])];
      const d = [F[0] - B[0], F[1] - B[1]], l = Math.hypot(d[0], d[1]);
      return { c: [0, (F[0] + B[0]) / 2, (F[1] + B[1]) / 2], v: [0, d[0] / l, d[1] / l], rz: l / 2, rx: L(a.rx, b.rx) };
    };
    const ring = (i, extra, part, ao) => { const g = geom(i, 0); return { c: W(g.c), u: [1, 0, 0], v: g.v, rx: (g.rx + extra) * hs, rz: (g.rz + extra) * hs, e: HE, ao, rig: rigH, part }; };
    // a point on the head: between ring i and the next (f), x across, lifted off the surface
    const surf = (i, f, x, lift, ao) => {
      const g = geom(i, f), t = g.rz * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x) / g.rx, HE)), 1 / HE);
      return { p: W(add(add(g.c, mul(g.v, t + (lift || 0))), [x, 0, 0])), ao: ao === undefined ? 1 : ao, rig: rigH, hem: 0 };
    };
    const keep = HEAD_LOD[lod];
    const faceAo = (i) => (th, sx, sz) => (i === 0 ? 0.86 : i === 1 ? 0.93 : 1) * (sz < -0.2 && i <= 3 ? 0.84 : 1);
    const skin = keep.filter((i) => i <= HAIRLINE).map((i) => ring(i, 0, PART.skin, faceAo(i)));
    const hair = keep.filter((i) => i >= HAIRLINE).map((i) => ring(i, grow * (i === 6 ? 0.7 : 1), PART.hair, (th, sx, sz) => (i === HAIRLINE ? 0.84 : 1) * (sz < 0 ? 0.93 : 1)));
    if (lod === 0) {
      S.loft(skin, { n, capStart: 0.010 * hs, partCap: PART.skin });
      const lip = ring(HAIRLINE, -0.004, PART.hair, () => 0.5);
      { const ax = cross(lip.u, lip.v), dn = ax[1] > 0 ? -1 : 1; lip.c = add(lip.c, mul(ax, dn * 0.004)); }
      S.loft([lip, ...hair], { n, capEnd: 0.012 * hs });
    } else {
      skin[skin.length - 1].part = PART.hair;                  // the span above the hairline is hair
      S.loft([...skin, ...hair.slice(1)], { n, capStart: 0.010 * hs, capEnd: 0.012 * hs });
    }
    if (lod === 0) {
      const inside = W([0, 1.63, 0.01]);
      // the nose: a small wedge
      const top = surf(2, 0.62, 0, -0.002), tip = surf(1, 0.90, 0, 0.017, 1.04), l = surf(1, 0.72, 0.0145, -0.001, 0.92), r = surf(1, 0.72, -0.0145, -0.001, 0.92);
      S.tri(top, l, tip, PART.skin, inside); S.tri(top, tip, r, PART.skin, inside);
      const ul = { ...l, ao: 0.7 }, ur = { ...r, ao: 0.7 }, ut = { ...tip, ao: 0.7 };
      S.tri(ul, ur, ut, PART.skin, add(inside, [0, 0.2, 0]));
      // the eyes: two small dark facets set just proud of the face
      if (o.eyes !== false) for (const sd of [1, -1]) {
        const x0 = 0.0245 * sd, x1 = 0.0405 * sd, lift = 0.0045;
        const a = surf(2, 0.56, x0, lift), b = surf(2, 0.56, x1, lift), c = surf(2, 0.82, x1, lift), d = surf(2, 0.82, x0, lift);
        S.tri(a, b, c, PART.eye, inside); S.tri(a, c, d, PART.eye, inside);
      }
      // the ears
      for (const sd of [1, -1]) {
        const side = (f, back, out, ao) => { const g = geom(2, f); return { p: W(add(add(g.c, mul(g.v, -back)), [g.rx * out * sd, 0, 0])), ao: ao || 1, rig: rigH, hem: 0 }; };
        const a = side(0.92, 0.006, 0.97), b = side(0.22, 0.002, 0.95), c = side(0.58, 0.026, 1.12, 0.92);
        S.tri(a, b, c, PART.skin, inside); S.tri(a, c, b, PART.skin, add(inside, [sd * 0.5, 0, -0.3]));
      }
    }
    // ---- hair styles: more hair than the cap
    const hw = HEAD[HAIRLINE].rx;
    const hRing = (y, z, rx, rz, ao, w, e) => ({ c: W([0, y, z]), rx: rx * hs, rz: rz * hs, e: e || 2.2, ao, rig: [5, w, 0], part: PART.hair });
    if (lod < 2 && style === 'long') {
      // hair down the back to the shoulder blades
      const m = lod === 0 ? 6 : 4;
      S.loft([hRing(1.672, -0.050, hw + 0.007, 0.054, 0.95, 1), hRing(1.570, -0.060, hw + 0.012, 0.048, 0.86, 0.8), hRing(1.470, -0.074, hw + 0.006, 0.038, 0.8, 0.45), hRing(1.395, -0.086, hw - 0.022, 0.024, 0.74, 0.3)], { n: m, capEnd: 0.012 });
    } else if (lod < 2 && style === 'bob') {
      // hair to the jaw, round the sides and back
      const m = lod === 0 ? 8 : 5;
      S.loft([hRing(1.672, -0.020, hw + 0.010, 0.084, 0.95, 1, 2.4), hRing(1.606, -0.024, hw + 0.016, 0.088, 0.88, 1, 2.4), hRing(1.556, -0.026, hw + 0.012, 0.082, 0.74, 1, 2.4)], { n: m, capEnd: -0.02 });
    } else if (lod < 2 && style === 'bun') {
      const c = W([0, 1.712, -0.128]), m = lod === 0 ? 6 : 4, r = 0.040 * hs, ax = nrm([0, 0.35, -1]);
      const u = [1, 0, 0], v = nrm(cross(ax, u));
      S.loft([{ c: add(c, mul(ax, -r * 0.7)), u, v, rx: r * 0.72, rz: r * 0.72, ao: 0.8, rig: rigH, part: PART.hair }, { c, u, v, rx: r, rz: r, ao: 0.95, rig: rigH, part: PART.hair }, { c: add(c, mul(ax, r * 0.62)), u, v, rx: r * 0.74, rz: r * 0.74, ao: 1, rig: rigH, part: PART.hair }], { n: m, capEnd: r * 0.4 });
    } else if (lod < 2 && style === 'tails') {
      // two bunches, for a child
      const m = lod === 0 ? 5 : 4;
      for (const sd of [1, -1]) {
        const c0 = W([sd * (hw + 0.002), 1.668, -0.030]), c1 = add(c0, [sd * 0.034 * hs, -0.046 * hs, -0.016 * hs]), c2 = add(c1, [sd * 0.008 * hs, -0.066 * hs, -0.006 * hs]);
        const d = nrm(sub(c2, c0)), u = nrm(cross([0, 0, 1], d)), v = nrm(cross(d, u));
        S.loft([{ c: c0, u, v, rx: 0.016 * hs, rz: 0.018 * hs, ao: 0.85, rig: rigH, part: PART.hair }, { c: c1, u, v, rx: 0.030 * hs, rz: 0.032 * hs, ao: 0.95, rig: rigH, part: PART.hair }, { c: c2, u, v, rx: 0.018 * hs, rz: 0.02 * hs, ao: 0.9, rig: rigH, part: PART.hair }], { n: m, capStart: 0.004, capEnd: 0.02 * hs });
      }
    }
    // the neck
    if (lod < 2) {
      const r = body.neckR, m = SEG.neck[lod];
      S.loft([{ c: [0, 1.462, -0.014], rx: r * 1.10, rz: r * 1.06, ao: 0.9, rig: [0, 1, 0], part: PART.skin }, { c: [0, 1.520, -0.010], rx: r, rz: r * 1.02, ao: (th, sx, sz) => sz > 0 ? 0.68 : 0.8, rig: [5, 0.5, 0], part: PART.skin }, { c: W([0, 1.580, -0.006]), rx: r * 0.96, rz: r, ao: 0.7, rig: rigH, part: PART.skin }], { n: m });
    }
  }

  /**
   * Build one figure, standing at rest.
   * spec: { body: 'a' | 'b' | 'c', lod: 0 | 1 | 2, hair: 'short' | 'crop' | 'long' | 'bob' | 'bun' | 'tails',
   *         sleeve: metres of sleeve from the shoulder (0.5 long, 0.16 short), hem: height a tunic or skirt hangs to,
   *         hemW, hemD: half width and depth of that hem, bare: legs in skin (under a skirt), eyes }
   * returns { tris: [{ v: [{ p, ao, rig, hem } x3], part }], k, spec }
   */
  function far(S, body, o) {
    const T = body.torso, sh = T[7][1] + 0.045, legs = o.bare ? PART.skin : PART.legs;
    const R = (y, w, d, part, ao) => ({ c: [0, y, 0], rx: w, rz: d, e: 2.6, ao: ao || 1, rig: [0, 0, 0], part });
    if (o.sit) {
      const w = o.sit === 'ground' ? 0.30 : 0.16, d = o.sit === 'ground' ? 0.16 : 0.21, lap = (y) => ({ c: [0, y, d * 0.8], rx: w, rz: d, e: 3, ao: 0.9, rig: [0, 0, 0], part: o.hem ? PART.top : legs });
      S.loft([lap(0.80), lap(0.93)], { n: 4, capEnd: 0.0 });
    } else S.loft([R(0, 0.115, 0.075, legs, 0.85), R(0.86, T[1][1] * 0.98, T[1][2], legs)], { n: 4 });
    const hem = o.hem && !o.sit ? [R(o.hem, o.hemW || 0.2, o.hemD || 0.15, PART.top, 0.9)] : [];
    S.loft([...hem, R(0.84, T[1][1] + 0.012, T[1][2] + 0.01, PART.top, 0.95), R(1.395, sh, T[7][2], PART.top), R(1.478, 0.075, 0.062, PART.top)], { n: 4, capEnd: 0.004 });
    head(S, body, 2, o);
  }

  function build(spec) {
    const body = BODIES[spec.body || 'a'], lod = spec.lod || 0, S = new Soup();
    if (lod >= 3) far(S, body, spec);
    else {
      torso(S, body, lod, spec);
      leg(S, body, lod, spec);
      arm(S, body, lod, spec);
      head(S, body, lod, spec);
    }
    // scale the canonical figure to the body's size
    const k = body.k;
    for (const t of S.t) for (const q of t.v) if (!q._s) { q.p = mul(q.p, k); q._s = 1; }
    for (const t of S.t) for (const q of t.v) delete q._s;
    if (lod >= 3 && spec.sit) for (const t of S.t) for (const q of t.v) q.p = [q.p[0], q.p[1] - 0.80 * k, q.p[2]];
    return { tris: S.t, k, spec, lod };
  }

  // ---- posing
  const piv = (j, k, side) => [j[0] * k * side, j[1] * k, j[2] * k];
  /**
   * The gait and the idle, exactly as the vertex shader does it. G: gait phase (pi per step), mv: 0 standing .. 1 walking,
   * it: idle clock (seconds, with the figure's own offset), look: head yaw.
   */
  function gaitPose(G, mv, it, look) {
    const s = Math.sin(G), g = GAIT;
    const knee = (ph) => mv * (g.kneeBase + g.kneeSwing * Math.pow(Math.max(0, Math.cos(ph + g.kneeLead)), g.kneePow));
    return {
      thigh: [g.thigh * mv * s, -g.thigh * mv * s], knee: [knee(G), knee(G + Math.PI)],
      arm: [-g.arm * mv * s + g.armRest + 0.03 * (1 - mv) * Math.sin(it + 1), g.arm * mv * s + g.armRest + 0.03 * (1 - mv) * Math.sin(it - 1)],
      elbow: [g.elbowRest + mv * (g.elbowWalk + g.elbowSwing * Math.max(0, -s)), g.elbowRest + mv * (g.elbowWalk + g.elbowSwing * Math.max(0, s))],
      twist: g.twist * mv * s + 0.02 * (1 - mv) * Math.sin(it * 0.7), look: look || 0,
      drop: g.drop * (1 - Math.cos(g.thigh * mv * s)), flare: g.thigh * mv * Math.abs(s),
    };
  }
  const X = [1, 0, 0], Y = [0, 1, 0];
  const about = (p, pivot, axis, ang) => add(pivot, rot(sub(p, pivot), axis, ang));
  /** Where a rest vertex goes in a gait pose (see gaitPose). */
  function poseVertex(q, k, P) {
    let p = q.p; const [ch, wu, wl] = q.rig;
    if (ch === 1 || ch === 2) {
      const i = ch - 1, sd = i ? -1 : 1;
      p = about(p, piv(J.knee, k, sd), X, P.knee[i] * wl);
      p = about(p, piv(J.hip, k, sd), X, -P.thigh[i] * wu);
    } else if (ch === 3 || ch === 4) {
      const i = ch - 3, sd = i ? -1 : 1;
      p = about(p, piv(J.elbow, k, sd), X, -P.elbow[i] * wl);
      p = about(p, piv(J.shoulder, k, sd), X, -P.arm[i] * wu);
      p = rot(p, Y, P.twist);
    } else if (ch === 5) p = rot(p, Y, P.twist * 0.3 + P.look * wu);
    else if (ch === 6) p = about(p, [0, J.hip[1] * k, 0], X, -P.flare * wu * Math.max(-1, Math.min(1, p[2] / (0.05 * k))));
    else p = rot(p, Y, P.twist * wu);
    return [p[0], p[1] - k * P.drop, p[2]];
  }
  /** A posed copy of a mesh (for previews and tests; a page animates in the vertex shader instead). */
  function posed(mesh, P) {
    return { ...mesh, tris: mesh.tris.map((t) => ({ part: t.part, v: t.v.map((q) => ({ ...q, p: poseVertex(q, mesh.k, P) })) })) };
  }

  // Sitting is baked into the mesh: free rotations at hip, knee, shoulder and elbow, then the limbs are frozen
  // (chain 0) so the shader leaves them alone; the head still looks about.
  const SIT = {
    // on a chair or bench: the origin is the seat. Each joint: [axis, angle, axis, angle ...] applied in order.
    chair: { hip: [[1, 0, 0], -1.50, [0, 1, 0], 0.07], knee: [[1, 0, 0], 1.46], shoulder: [[1, 0, 0], -0.22], elbow: [[1, 0, 0], -0.88], seat: 0.800, back: 0.04, hem: -1.45 },
    // on the ground, legs crossed: the thigh turns out, lifts forward, and swings wide; the shin folds in under it
    ground: { hip: [[0, 1, 0], 1.25, [1, 0, 0], -1.47, [0, 1, 0], 0.80], knee: [[1, 0, 0], 2.20], shoulder: [[1, 0, 0], -0.34], elbow: [[1, 0, 0], -0.95], seat: 0, back: 0.07, hem: -1.3 },
  };
  function sitting(mesh, kind) {
    if (mesh.lod >= 3) return mesh;                 // the far figure is built sitting (spec.sit)
    const P = SIT[kind], k = mesh.k;
    const chainRot = (p, pivot, spec, w, sd) => {
      // spec: [axis, angle, axis, angle, ...] applied in order; left-right angles flip for the right side
      for (let i = 0; i < spec.length; i += 2) {
        const ax = spec[i], side = ax[0] === 1 ? 1 : sd;
        p = about(p, pivot, ax, spec[i + 1] * w * side);
      }
      return p;
    };
    const tris = mesh.tris.map((t) => ({
      part: t.part, v: t.v.map((q) => {
        let p = q.p; const [ch, wu, wl] = q.rig; let rig = q.rig;
        if (ch === 1 || ch === 2) {
          const sd = ch === 1 ? 1 : -1;
          p = chainRot(p, piv(J.knee, k, sd), P.knee, wl, sd);
          p = chainRot(p, piv(J.hip, k, sd), P.hip, wu, sd);
          rig = [0, 0, 0];
        } else if (ch === 3 || ch === 4) {
          const sd = ch === 3 ? 1 : -1;
          p = chainRot(p, piv(J.elbow, k, sd), P.elbow, wl, sd);
          p = chainRot(p, piv(J.shoulder, k, sd), P.shoulder, wu, sd);
          rig = [0, 1, 0];
        } else if (q.hem) {
          // a skirt's hem goes forward with the thighs, and cannot hang through what it sits on
          p = about(p, [0, J.hip[1] * k, 0], X, P.hem * q.hem);
          p[1] = Math.max(p[1], (J.hip[1] - 0.092) * k);
          rig = [0, 0, 0];
        }
        // a slight lean back, about the hips, then down onto the seat
        p = about(p, [0, J.hip[1] * k, 0], X, -P.back * Math.max(0, Math.min(1, (q.p[1] / k - 0.9) / 0.3)));
        return { ...q, p: [p[0], p[1] - P.seat * k, p[2]], rig };
      }),
    }));
    if (!P.seat) {
      // on the ground: whatever is lowest rests on it
      let low = 1e9; for (const t of tris) for (const q of t.v) low = Math.min(low, q.p[1]);
      for (const t of tris) for (const q of t.v) q.p = [q.p[0], q.p[1] - low, q.p[2]];
    }
    return { ...mesh, tris, sit: kind };
  }

  // ---- packing for a renderer
  /**
   * Flat arrays for drawing: pos (3), nor (3, one per facet), part (3: part, baked shade, level of detail),
   * rig (4: half the figure's scale, chain, wUpper, wLower). The scale comes first because a mesh that has no rig
   * reads as 0 there, which is how the shader tells a figure from a tree.
   */
  function pack(mesh, lodTag) {
    const n = mesh.tris.length * 3, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), part = new Float32Array(n * 3), rig = new Float32Array(n * 4);
    const tag = lodTag === undefined ? (mesh.lod || 0) : lodTag;
    let i = 0;
    for (const t of mesh.tris) {
      const N = nrm(cross(sub(t.v[1].p, t.v[0].p), sub(t.v[2].p, t.v[0].p)));
      for (const q of t.v) {
        pos[i * 3] = q.p[0]; pos[i * 3 + 1] = q.p[1]; pos[i * 3 + 2] = q.p[2];
        nor[i * 3] = N[0]; nor[i * 3 + 1] = N[1]; nor[i * 3 + 2] = N[2];
        part[i * 3] = t.part; part[i * 3 + 1] = q.ao; part[i * 3 + 2] = tag;
        rig[i * 4] = mesh.k / 2; rig[i * 4 + 1] = q.rig[0]; rig[i * 4 + 2] = q.rig[1]; rig[i * 4 + 3] = q.rig[2];
        i++;
      }
    }
    return { pos, nor, part, rig, count: n, tris: mesh.tris.length, k: mesh.k };
  }

  // ---- the vertex shader's half: the same gait as gaitPose(), and the palettes a person's look picks from
  const lin = (hex) => { const v = parseInt(hex.slice(1), 16), f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return [f(v >> 16 & 255), f(v >> 8 & 255), f(v & 255)]; };
  const pal = (name, list) => `const vec3 ${name}[${list.length}] = vec3[${list.length}](${list.map((h) => { const c = lin(h); return `vec3(${c[0].toFixed(4)}, ${c[1].toFixed(4)}, ${c[2].toFixed(4)})`; }).join(', ')});`;
  const f = (v) => v.toFixed(4);
  const g = GAIT;
  /** GLSL for a vertex shader: kFolk() poses a figure's vertex, kFolkColour() picks its colour. lodNear: metres at which each level hands over. */
  const glsl = (lodNear) => `
${pal('kFolkSkin', FOLK_SKIN)}
${pal('kFolkHair', FOLK_HAIR)}
${pal('kFolkLegs', FOLK_LEGS)}
void kFolkX(inout vec3 p, inout vec3 n, vec2 piv, float a) { float c = cos(a), s = sin(a); vec2 q = p.yz - piv; p.yz = piv + vec2(q.x * c - q.y * s, q.x * s + q.y * c); n.yz = vec2(n.y * c - n.z * s, n.y * s + n.z * c); }
void kFolkY(inout vec3 p, inout vec3 n, float a) { float c = cos(a), s = sin(a); p.xz = vec2(p.x * c + p.z * s, -p.x * s + p.z * c); n.xz = vec2(n.x * c + n.z * s, -n.x * s + n.z * c); }
// rig: half the scale, chain, upper weight, lower weight. G: gait phase (pi a step). mv: 0 standing, 1 walking. it: the figure's own idle clock.
void kFolk(inout vec3 p, inout vec3 n, vec4 rig, float G, float mv, float it) {
  float k = rig.x * 2.0, wu = rig.z, wl = rig.w, s = sin(G);
  int ch = int(rig.y + 0.5);
  float twist = ${f(g.twist)} * mv * s + 0.02 * (1.0 - mv) * sin(it * 0.7);
  if (ch == 1 || ch == 2) {
    float sd = ch == 1 ? 1.0 : -1.0;
    float kn = mv * (${f(g.kneeBase)} + ${f(g.kneeSwing)} * pow(max(0.0, cos(G + (ch == 2 ? 3.14159265 : 0.0) + (${f(g.kneeLead)}))), ${f(g.kneePow)}));
    kFolkX(p, n, vec2(${f(J.knee[1])}, ${f(J.knee[2])}) * k, kn * wl);
    kFolkX(p, n, vec2(${f(J.hip[1])}, ${f(J.hip[2])}) * k, -${f(g.thigh)} * mv * s * sd * wu);
  } else if (ch == 3 || ch == 4) {
    float sd = ch == 3 ? 1.0 : -1.0;
    float sw = -${f(g.arm)} * mv * s * sd + ${f(g.armRest)} + 0.03 * (1.0 - mv) * sin(it + sd);
    float el = ${f(g.elbowRest)} + mv * (${f(g.elbowWalk)} + ${f(g.elbowSwing)} * max(0.0, -s * sd));
    kFolkX(p, n, vec2(${f(J.elbow[1])}, ${f(J.elbow[2])}) * k, -el * wl);
    kFolkX(p, n, vec2(${f(J.shoulder[1])}, ${f(J.shoulder[2])}) * k, -sw * wu);
    kFolkY(p, n, twist);
  } else if (ch == 5) {
    // the head looks about, less when walking
    float look = 0.55 * sin(it * 0.31) * sin(it * 0.13 + 1.0) * (1.0 - 0.7 * mv);
    kFolkY(p, n, twist * 0.3 + look * wu);
  } else if (ch == 6) {
    // a hem swings out front and back with the stride
    kFolkX(p, n, vec2(${f(J.hip[1])}, 0.0) * k, -${f(g.thigh)} * mv * abs(s) * wu * clamp(p.z / (0.05 * k), -1.0, 1.0));
  } else kFolkY(p, n, twist * wu);
  p.y -= k * ${f(g.drop)} * (1.0 - cos(${f(g.thigh)} * mv * s));
}
// part: which part, baked shade, level. look: skin, hair, legs out of the palettes (w = 0 when a look is given).
vec3 kFolkColour(vec3 base, vec3 part, vec4 look, inout float tint) {
  if (look.w > 0.5) return base;
  int pt = int(part.x + 0.5);
  if (pt == ${PART.skin}) return kFolkSkin[int(look.x + 0.5)] * part.y;
  if (pt == ${PART.hair}) return kFolkHair[int(look.y + 0.5)] * part.y;
  if (pt == ${PART.legs}) { tint = 0.0; return kFolkLegs[int(look.z + 0.5)] * part.y; }
  return base;
}
// is a figure of this level drawn at d metres? (level 4: always; 5: from the middle distance outward)
bool kFolkShown(float lod, float d) {
  if (lod > 4.5) return d >= ${f(lodNear[1])};
  if (lod > 3.5) return true;
  if (lod < 0.5) return d < ${f(lodNear[0])};
  if (lod < 1.5) return d >= ${f(lodNear[0])} && d < ${f(lodNear[1])};
  if (lod < 2.5) return d >= ${f(lodNear[1])} && d < ${f(lodNear[2])};
  return d >= ${f(lodNear[2])};
}`;

  // ---- the people a crowd is cast from
  const CAST = {
    a1: { body: 'a', hair: 'short', sleeve: 0.5 },
    a2: { body: 'a', hair: 'crop', sleeve: 0.17 },
    a3: { body: 'a', hair: 'short', sleeve: 0.5, hem: 0.70, hemW: 0.190, hemD: 0.150 },
    b1: { body: 'b', hair: 'long', sleeve: 0.5 },
    b2: { body: 'b', hair: 'bun', sleeve: 0.17 },
    b3: { body: 'b', hair: 'bob', sleeve: 0.30, hem: 0.60, hemW: 0.215, hemD: 0.190, bare: true },
    c1: { body: 'c', hair: 'short', sleeve: 0.17 },
    c2: { body: 'c', hair: 'tails', sleeve: 0.30, hem: 0.66, hemW: 0.20, hemD: 0.165, bare: true },
  };

  return { PART, J, GAIT, BODIES, CAST, SIT, build, pack, posed, sitting, gaitPose, poseVertex, glsl, lin };
}
