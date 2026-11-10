// Keyboard, mouse (pointer lock, with a drag fallback where lock is refused), gamepad and the UI's touch stick.
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set(); this.edge = new Set();
    this.lookX = 0; this.lookY = 0; this.wheel = 0;
    this.locked = false; this.dragging = false; this.lockRefused = false;
    this.enabled = true;                 // false while a UI screen has the keyboard
    this.virtual = { moveX: 0, moveY: 0, lookDX: 0, lookDY: 0, jump: false, use: false, run: false };
    this.mouseDown = false; this.clicked = false; this.clicked2 = false;
    this.onFirstGesture = null;
    const kd = (e) => {
      if (this._gesture()) { /* first gesture */ }
      if (e.code === 'Tab') e.preventDefault();
      if (!this.enabled) return;
      if (!e.repeat) this.edge.add(e.code);
      this.keys.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) >= 0) e.preventDefault();
    };
    const ku = (e) => { this.keys.delete(e.code); };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    window.addEventListener('blur', () => { this.keys.clear(); this.mouseDown = false; });
    canvas.addEventListener('mousedown', (e) => {
      this._gesture();
      if (!this.enabled) return;
      if (e.button === 0) { this.mouseDown = true; if (this.locked || this.lockRefused) this.clicked = true; }
      if (e.button === 2) this.clicked2 = true;
      if (!this.locked && !this.lockRefused && this.wantLock) this.lock(true);
      if (!this.locked) this.dragging = true;
    });
    window.addEventListener('mouseup', () => { this.mouseDown = false; this.dragging = false; });
    window.addEventListener('mousemove', (e) => {
      if (!this.enabled) return;
      if (this.locked || this.dragging) { this.lookX += e.movementX || 0; this.lookY += e.movementY || 0; }
    });
    canvas.addEventListener('wheel', (e) => { if (this.enabled) this.wheel += Math.sign(e.deltaY); }, { passive: true });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
      if (this.locked) this._lockFails = 0; else this._unlockedAt = performance.now();
      if (this.onLockChange) this.onLockChange(this.locked);
    });
    document.addEventListener('pointerlockerror', () => { this.locked = false; this._lockFailed(); });
    this.wantLock = false; this._lockFails = 0; this._unlockedAt = -1e9; this._attempt = null;
  }
  _gesture() { if (this.onFirstGesture) { const f = this.onFirstGesture; this.onFirstGesture = null; try { f(); } catch (e) { /* ignore */ } return true; } return false; }
  // Ask for the pointer. A browser may refuse for a moment (no fresh click, or too soon after Esc): only a click on
  // the picture that is refused twice, with no such excuse, means this page cannot have it, and dragging takes over.
  lock(fromClick) {
    this.wantLock = true;
    if (this.lockRefused || this.locked) return;
    this._attempt = { click: !!fromClick && performance.now() - this._unlockedAt > 1600, failed: false };
    try { const p = this.canvas.requestPointerLock(); if (p && p.catch) p.catch(() => this._lockFailed()); } catch (e) { this._lockFailed(); }
  }
  _lockFailed() {
    const a = this._attempt; if (!a || a.failed) return; a.failed = true;
    if (a.click) { this._lockFails++; if (this._lockFails >= 2) this.lockRefused = true; }
  }
  unlock() { this.wantLock = false; if (document.pointerLockElement === this.canvas) document.exitPointerLock(); }
  down(code) { return this.enabled && this.keys.has(code); }
  pressed(code) { return this.enabled && this.edge.has(code); }
  // movement axes: x = strafe right, y = forward
  moveAxes(out) {
    let x = 0, y = 0;
    if (this.enabled) {
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y += 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
      x += this.virtual.moveX; y += this.virtual.moveY;
      const gp = this._pad(); if (gp) { const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0; if (Math.abs(ax) > 0.15) x += ax; if (Math.abs(ay) > 0.15) y -= ay; }
    }
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    out.x = x; out.y = y; return out;
  }
  run() { const gp = this._pad(); return this.enabled && (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.virtual.run || (gp && gp.buttons[10] && gp.buttons[10].pressed)); }
  jump() { const gp = this._pad(); return this.enabled && (this.edge.has('Space') || this.virtual.jump || (gp && gp.buttons[0] && gp.buttons[0].pressed && !this._padA)); }
  use() { const gp = this._pad(); return this.enabled && (this.edge.has('KeyE') || this.edge.has('Enter') || this.virtual.use || (gp && gp.buttons[2] && gp.buttons[2].pressed && !this._padX)); }
  // look delta in "mouse counts" since last frame
  look(out, dt) {
    let x = this.lookX + this.virtual.lookDX, y = this.lookY + this.virtual.lookDY;
    const gp = this._pad(); if (gp && this.enabled) { const ax = gp.axes[2] || 0, ay = gp.axes[3] || 0; if (Math.abs(ax) > 0.12) x += ax * 900 * dt; if (Math.abs(ay) > 0.12) y += ay * 700 * dt; }
    out.x = x; out.y = y; return out;
  }
  _pad() { try { const p = navigator.getGamepads ? navigator.getGamepads() : null; if (!p) return null; for (const g of p) if (g && g.connected) return g; } catch (e) { /* no pads */ } return null; }
  endFrame() {
    const gp = this._pad(); this._padA = !!(gp && gp.buttons[0] && gp.buttons[0].pressed); this._padX = !!(gp && gp.buttons[2] && gp.buttons[2].pressed);
    this.edge.clear(); this.lookX = 0; this.lookY = 0; this.wheel = 0; this.clicked = false; this.clicked2 = false;
    this.virtual.lookDX = 0; this.virtual.lookDY = 0; this.virtual.jump = false; this.virtual.use = false;
  }
}
