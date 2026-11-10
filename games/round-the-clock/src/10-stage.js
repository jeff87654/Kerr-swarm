/* ---------- The stage: one square canvas, a fixed-step loop and one input object ----------
   Every game draws in stage units: a 1000 x 1000 square, (0, 0) top left. The loop steps the
   current scene at 120 steps a second (so a game plays the same on any screen) and draws once a frame.
   Scenes are {update(dt, inp), draw(g)}. */
"use strict";

const STEP = 1 / 120;
const SW = 1000, SH = 1000;

const Stage = {
  cv: null, g: null,
  scene: null,
  time: 0,            // seconds of simulated time since the page opened
  speed: 1,           // test hook: simulated seconds per real second
  capture: false,     // while true, Space and the arrows belong to the game, not the page
  frames: 0,
  _acc: 0, _last: 0, _px: 0,
};

// What a game reads. Pointer position is in stage units and persists between touches.
const INP = {
  x: 500, y: 500,
  down: false, pressed: false, released: false,          // pointer OR Space/Enter
  ptrDown: false, ptrPressed: false, ptrReleased: false, // pointer only
  act: false, actPressed: false, actReleased: false,     // Space/Enter only
  left: false, right: false, up: false, dn: false,       // arrows or WASD, held
  leftPressed: false, rightPressed: false, upPressed: false, dnPressed: false,
  ax: 0, ay: 0,                                          // -1..1 from the held arrows (ay > 0 is down the screen)
  num: 0,                                                // 1..12 when a number key was pressed this step (1-9, 0, -, = give 1..12)
  moved: false,                                          // the pointer moved since the last step
};

const RAW = { x: 500, y: 500, ptr: false, pPress: 0, pRelease: 0, keys: Object.create(null), kPress: Object.create(null), kRelease: Object.create(null), moved: false };

function freshInput() {
  return { x: 500, y: 500, down: false, pressed: false, released: false, ptrDown: false, ptrPressed: false, ptrReleased: false,
    act: false, actPressed: false, actReleased: false, left: false, right: false, up: false, dn: false,
    leftPressed: false, rightPressed: false, upPressed: false, dnPressed: false, ax: 0, ay: 0, num: 0, moved: false };
}

const KEY_ALIASES = { a: "ArrowLeft", A: "ArrowLeft", d: "ArrowRight", D: "ArrowRight", w: "ArrowUp", W: "ArrowUp", s: "ArrowDown", S: "ArrowDown", Enter: " ", Spacebar: " " };
const NUM_KEYS = { "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "0": 10, "-": 11, "=": 12 };

function takeInput() {
  const k = RAW.keys, kp = RAW.kPress, kr = RAW.kRelease;
  INP.x = RAW.x; INP.y = RAW.y; INP.moved = RAW.moved; RAW.moved = false;
  // a press and a release that both landed since the last step: deliver the press now, the release next step
  if (RAW.pPress && RAW.pRelease) {
    INP.ptrPressed = true; INP.ptrReleased = false; INP.ptrDown = true; RAW.pPress = 0;
  } else {
    INP.ptrPressed = RAW.pPress > 0; INP.ptrReleased = RAW.pRelease > 0; INP.ptrDown = RAW.ptr;
    RAW.pPress = 0; RAW.pRelease = 0;
  }
  INP.act = !!k[" "]; INP.actPressed = !!kp[" "]; INP.actReleased = !!kr[" "];
  if (INP.actPressed && INP.actReleased) { INP.act = true; INP.actReleased = false; RAW.kRelease = Object.create(null); RAW.kRelease[" "] = 1; } else RAW.kRelease = Object.create(null);
  INP.left = !!k.ArrowLeft; INP.right = !!k.ArrowRight; INP.up = !!k.ArrowUp; INP.dn = !!k.ArrowDown;
  INP.leftPressed = !!kp.ArrowLeft; INP.rightPressed = !!kp.ArrowRight; INP.upPressed = !!kp.ArrowUp; INP.dnPressed = !!kp.ArrowDown;
  INP.ax = (INP.right ? 1 : 0) - (INP.left ? 1 : 0);
  INP.ay = (INP.dn ? 1 : 0) - (INP.up ? 1 : 0);
  INP.num = 0;
  for (const key in kp) if (NUM_KEYS[key]) INP.num = NUM_KEYS[key];
  RAW.kPress = Object.create(null);
  INP.down = INP.ptrDown || INP.act;
  INP.pressed = INP.ptrPressed || INP.actPressed;
  INP.released = INP.ptrReleased || INP.actReleased;
  return INP;
}

function stagePoint(e) {
  const r = Stage.cv.getBoundingClientRect();
  RAW.x = clamp((e.clientX - r.left) / r.width * SW, 0, SW);
  RAW.y = clamp((e.clientY - r.top) / r.height * SH, 0, SH);
  RAW.moved = true;
}

function stageInit(cv) {
  Stage.cv = cv;
  Stage.g = cv.getContext("2d");
  cv.addEventListener("pointerdown", (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    stagePoint(e); RAW.ptr = true; RAW.pPress++;
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
    if (Stage.capture) e.preventDefault();
    if (typeof Snd !== "undefined") Snd.wake();
  });
  cv.addEventListener("pointermove", (e) => { stagePoint(e); });
  const up = (e) => { if (RAW.ptr) { RAW.ptr = false; RAW.pRelease++; } };
  cv.addEventListener("pointerup", (e) => { stagePoint(e); up(e); });
  cv.addEventListener("pointercancel", up);
  cv.addEventListener("contextmenu", (e) => e.preventDefault());
  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const key = KEY_ALIASES[e.key] || e.key;
    const gameKey = key === " " || key.indexOf("Arrow") === 0 || NUM_KEYS[key];
    if (Stage.capture && gameKey) {
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      if (!e.repeat) { RAW.keys[key] = 1; RAW.kPress[key] = 1; }
    }
  });
  window.addEventListener("keyup", (e) => {
    const key = KEY_ALIASES[e.key] || e.key;
    if (RAW.keys[key]) { delete RAW.keys[key]; RAW.kRelease[key] = 1; if (Stage.capture) e.preventDefault(); }
  });
  window.addEventListener("blur", () => { RAW.keys = Object.create(null); if (RAW.ptr) { RAW.ptr = false; RAW.pRelease++; } });
  const fit = () => {
    const css = cv.getBoundingClientRect().width || 600;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.max(200, Math.round(css * dpr));
    if (px !== Stage._px) { Stage._px = px; cv.width = px; cv.height = px; }
  };
  fit();
  window.addEventListener("resize", fit);
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(fit).observe(cv);
  Stage._last = performance.now();
  requestAnimationFrame(stageFrame);
}

function stageFrame(now) {
  requestAnimationFrame(stageFrame);
  let dt = (now - Stage._last) / 1000; Stage._last = now;
  if (document.hidden) return;
  dt = Math.min(dt, 0.1) * Stage.speed;
  Stage._acc += dt;
  const sc = Stage.scene;
  let n = 0;
  const maxSteps = Math.max(24, Math.ceil(24 * Stage.speed));
  while (Stage._acc >= STEP && n < maxSteps) {
    Stage._acc -= STEP; Stage.time += STEP; n++;
    if (sc && sc.update) sc.update(STEP, takeInput());
    if (Stage.scene !== sc) break; // the scene changed itself
  }
  if (n === maxSteps) Stage._acc = 0;
  stageDraw();
}

function stageDraw() {
  const g = Stage.g, k = Stage._px / SW;
  g.setTransform(k, 0, 0, k, 0, 0);
  g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
  g.lineCap = "round"; g.lineJoin = "round"; g.textBaseline = "alphabetic";
  if (Stage.scene && Stage.scene.draw) {
    g.save();
    try { Stage.scene.draw(g); } finally { g.restore(); }
  }
  Stage.frames++;
}

function setScene(scene) { Stage.scene = scene; }

/* ---------- Small text over the stage (DOM, so it stays crisp at any size) ---------- */
const Hud = {
  _sayT: 0,
  set(left, right) {
    const l = $("#hudL"), r = $("#hudR");
    if (l && l._v !== left) { l._v = left; l.textContent = left || ""; l.hidden = !left; }
    if (r && r._v !== right) { r._v = right; r.textContent = right || ""; r.hidden = !right; }
  },
  // a short caption along the bottom of the stage; it fades by itself
  say(text, secs) {
    const el = $("#hudSay"); if (!el) return;
    if (text) el.textContent = text;
    el.classList.remove("in"); void el.offsetWidth; if (text) el.classList.add("in");
    clearTimeout(Hud._sayT);
    if (text) Hud._sayT = setTimeout(() => { el.classList.remove("in"); }, (secs || 2.2) * 1000 / Math.max(1, Stage.speed));
  },
  clear() { Hud.set("", ""); Hud.say(""); },
};
