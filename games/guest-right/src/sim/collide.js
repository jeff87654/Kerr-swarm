// Collision in a frame's flat space. Everything solid is an axis-aligned box, an upright cylinder or a ramp (stairs).
// A grid hash over x,z keeps queries cheap. The player is an upright capsule treated as a cylinder with a step-up.
const CELL = 4;

export class Colliders {
  constructor() { this.items = []; this.free = []; this.grid = new Map(); this.heightFn = null; }
  _key(ix, iz) { return ix * 73856093 ^ iz * 19349663; }
  _cells(c, fn) {
    const x0 = Math.floor(c.x0 / CELL), x1 = Math.floor(c.x1 / CELL), z0 = Math.floor(c.z0 / CELL), z1 = Math.floor(c.z1 / CELL);
    for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) fn(this._key(ix, iz));
  }
  _add(c) {
    const i = this.free.length ? this.free.pop() : this.items.length; this.items[i] = c; c._i = i;
    this._cells(c, (k) => { let a = this.grid.get(k); if (!a) this.grid.set(k, a = []); a.push(i); });
    return c;
  }
  // box: walkable on top, solid on the sides. o.surf: footstep surface; o.thin: no step-up onto it; o.ghost: floor only (no side collision)
  box(x0, y0, z0, x1, y1, z1, o) {
    return this._add({ t: 0, x0: Math.min(x0, x1), y0: Math.min(y0, y1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), y1: Math.max(y0, y1), z1: Math.max(z0, z1), surf: (o && o.surf) || 'stone', ghost: !!(o && o.ghost), owner: o && o.owner });
  }
  // upright cylinder (a column, a tree, a person-sized obstacle)
  cyl(x, z, r, y0, y1, o) { return this._add({ t: 1, cx: x, cz: z, r, x0: x - r, x1: x + r, z0: z - r, z1: z + r, y0, y1, surf: (o && o.surf) || 'stone', owner: o && o.owner }); }
  // ramp / stairs: a footprint whose top rises linearly along axis ('x' or 'z') from ya (at the low coordinate) to yb (at the high one)
  ramp(x0, z0, x1, z1, ya, yb, axis, o) {
    return this._add({ t: 2, x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), ya, yb, axis, y0: Math.min(ya, yb) - 0.5, y1: Math.max(ya, yb), surf: (o && o.surf) || 'stone', owner: o && o.owner });
  }
  remove(c) {
    if (!c || this.items[c._i] !== c) return;
    this._cells(c, (k) => { const a = this.grid.get(k); if (a) { const j = a.indexOf(c._i); if (j >= 0) a.splice(j, 1); if (!a.length) this.grid.delete(k); } });
    this.items[c._i] = null; this.free.push(c._i);
  }
  removeOwner(owner) { for (const c of this.items) if (c && c.owner === owner) this.remove(c); }

  _query(x0, z0, x1, z1, out) {
    out.length = 0; const seen = this._seen || (this._seen = new Set()); seen.clear();
    const a0 = Math.floor(x0 / CELL), a1 = Math.floor(x1 / CELL), b0 = Math.floor(z0 / CELL), b1 = Math.floor(z1 / CELL);
    for (let ix = a0; ix <= a1; ix++) for (let iz = b0; iz <= b1; iz++) {
      const a = this.grid.get(this._key(ix, iz)); if (!a) continue;
      for (let j = 0; j < a.length; j++) { const i = a[j]; if (!seen.has(i)) { seen.add(i); const c = this.items[i]; if (c && c.x1 >= x0 && c.x0 <= x1 && c.z1 >= z0 && c.z0 <= z1) out.push(c); } }
    }
    return out;
  }
  _top(c, x, z) {
    if (c.t === 2) { const t = c.axis === 'x' ? (x - c.x0) / (c.x1 - c.x0) : (z - c.z0) / (c.z1 - c.z0); return c.ya + (c.yb - c.ya) * Math.max(0, Math.min(1, t)); }
    return c.y1;
  }
  // The highest floor at (x,z) that is no higher than maxY. Returns { y, surf } or null. r widens the footprint a little.
  ground(x, z, maxY, r = 0.12, out) {
    const list = this._query(x - r, z - r, x + r, z + r, this._tmp || (this._tmp = []));
    let best = -1e9, surf = null;
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (c.t === 1) { const dx = x - c.cx, dz = z - c.cz; if (dx * dx + dz * dz > (c.r + r) * (c.r + r)) continue; }
      const y = this._top(c, x, z);
      if (y <= maxY && y > best) { best = y; surf = c.surf; }
    }
    if (this.heightFn) { const h = this.heightFn(x, z); if (h !== null && h > best) { best = h; surf = this.surfFn ? this.surfFn(x, z) : 'grass'; } }      // open land has no underside: it always holds you up
    if (best < -1e8) return null;
    if (out) { out.y = best; out.surf = surf; return out; }
    return { y: best, surf };
  }
  // The lowest ceiling above y at (x,z): underside of any box whose bottom is above y. Returns its y or +inf.
  ceiling(x, z, y, r = 0.2) {
    const list = this._query(x - r, z - r, x + r, z + r, this._tmp2 || (this._tmp2 = []));
    let best = Infinity;
    for (let i = 0; i < list.length; i++) { const c = list[i]; if (c.t === 0 && !c.ghost && c.y0 >= y && c.y0 < best) best = c.y0; }
    return best;
  }

  // Move a cylinder (radius r, feet at p.y, height h) by (dx, dz) with sliding and step-up. p: {x,y,z}. Returns true if it hit something.
  move(p, dx, dz, r, h, stepUp) {
    let hit = false;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / (r * 0.9)));
    const sx = dx / steps, sz = dz / steps;
    for (let s = 0; s < steps; s++) {
      p.x += sx; p.z += sz;
      if (this._resolve(p, r, h, stepUp)) hit = true;
    }
    return hit;
  }
  _resolve(p, r, h, stepUp) {
    let hit = false;
    for (let iter = 0; iter < 3; iter++) {
      const list = this._query(p.x - r, p.z - r, p.x + r, p.z + r, this._tmp3 || (this._tmp3 = []));
      let moved = false;
      for (let i = 0; i < list.length; i++) {
        const c = list[i]; if (c.ghost) continue;
        const top = this._top(c, p.x, p.z);
        if (c.t === 2) {            // ramps are floors; only their high end can block from below
          continue;
        }
        if (top <= p.y + stepUp + 1e-3) continue;          // low enough to step onto
        if (c.y0 >= p.y + h - 0.05) continue;              // above the head
        if (c.t === 1) {
          const ddx = p.x - c.cx, ddz = p.z - c.cz; const d = Math.hypot(ddx, ddz), min = c.r + r;
          if (d < min) { const k = d > 1e-5 ? (min - d) / d : 0; p.x += ddx * k; p.z += ddz * k; if (d <= 1e-5) p.x += min; moved = hit = true; }
          continue;
        }
        // closest point on the box footprint to the cylinder centre
        const qx = Math.max(c.x0, Math.min(p.x, c.x1)), qz = Math.max(c.z0, Math.min(p.z, c.z1));
        let ddx = p.x - qx, ddz = p.z - qz; const d2 = ddx * ddx + ddz * ddz;
        if (d2 >= r * r) continue;
        if (d2 > 1e-10) { const d = Math.sqrt(d2), k = (r - d) / d; p.x += ddx * k; p.z += ddz * k; }
        else {              // centre is inside the footprint: push out along the shallowest side
          const l = p.x - c.x0, rr = c.x1 - p.x, b = p.z - c.z0, f = c.z1 - p.z; const m = Math.min(l, rr, b, f);
          if (m === l) p.x = c.x0 - r; else if (m === rr) p.x = c.x1 + r; else if (m === b) p.z = c.z0 - r; else p.z = c.z1 + r;
        }
        moved = hit = true;
      }
      if (!moved) break;
    }
    return hit;
  }
  // A ball (or any small thing) against the world: returns the first hit along a short step, or null. Used for thrown balls.
  sphereHit(x, y, z, r) {
    const list = this._query(x - r, z - r, x + r, z + r, this._tmp4 || (this._tmp4 = []));
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (c.t === 2) { const top = this._top(c, x, z); if (y - r < top && y > top - 0.6) return { nx: 0, ny: 1, nz: 0, c, pen: top - (y - r) }; continue; }
      if (y + r < c.y0 || y - r > c.y1) continue;
      if (c.t === 1) { const dx = x - c.cx, dz = z - c.cz, d = Math.hypot(dx, dz); if (d < c.r + r) { return { nx: dx / (d || 1), ny: 0, nz: dz / (d || 1), c, pen: c.r + r - d }; } continue; }
      const qx = Math.max(c.x0, Math.min(x, c.x1)), qy = Math.max(c.y0, Math.min(y, c.y1)), qz = Math.max(c.z0, Math.min(z, c.z1));
      const dx = x - qx, dy = y - qy, dz = z - qz, d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < r * r) {
        if (d2 > 1e-10) { const d = Math.sqrt(d2); return { nx: dx / d, ny: dy / d, nz: dz / d, c, pen: r - d }; }
        return { nx: 0, ny: 1, nz: 0, c, pen: r };
      }
    }
    if (this.heightFn) { const hh = this.heightFn(x, z); if (hh !== null && y - r < hh) return { nx: 0, ny: 1, nz: 0, c: null, pen: hh - (y - r) }; }
    return null;
  }
  // Is the straight line between two points clear of boxes? (coarse: sampled). For interaction and NPC sight lines.
  clear(x0, y0, z0, x1, y1, z1) {
    const d = Math.hypot(x1 - x0, y1 - y0, z1 - z0), n = Math.max(2, Math.ceil(d / 0.25));
    for (let i = 1; i < n; i++) { const t = i / n; if (this.sphereHit(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t, 0.03)) return false; }
    return true;
  }
}
