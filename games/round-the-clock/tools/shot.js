/* Drive the built page in headless Chrome: play a game with its bot, take pictures, report the result.

   node tools/shot.js --q "ev=lark&bot=1&seed=3" --at "2,6,end" --out out/lark
   node tools/shot.js --q "view=card&h=6" --at "3" --out out/card --page --phone

   --q      query string for dist/index.html (ev, bot, seed, skill, speed, view, h, club, threads, clock ...)
   --at     comma list of moments to photograph: seconds of game time, or "end" (when the game has a result)
   --out    folder for the pictures (made if missing); files are <name>-<moment>.png
   --name   file prefix (default: the ev or view in the query)
   --page   photograph the whole page instead of just the stage
   --phone  a 390 x 844 phone instead of a 1280 x 860 desktop
   --js     JavaScript to run in the page before the first picture
   --wait   seconds of real time to wait before the first picture (default 0.6)
   --timeout seconds before giving up on "end" (default 120)
   --dist   folder holding index.html (default: dist; see build.py --dist)

   Needs playwright-core (npm i playwright-core, or set NODE_PATH to a folder that has it) and Chrome or Edge.
   Prints one line of JSON: {result, results, errors, shots}. */
"use strict";
const fs = require("fs");
const path = require("path");
let chromium;
try { chromium = require("playwright-core").chromium; } catch (e) { console.error("playwright-core not found: npm i playwright-core, or set NODE_PATH"); process.exit(2); }

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) : d; };
const CHROME = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find((p) => p && fs.existsSync(p));

(async () => {
  const q = String(opt("q", ""));
  const at = String(opt("at", "end")).split(",").map((s) => s.trim()).filter(Boolean);
  const out = path.resolve(String(opt("out", "out")));
  const name = String(opt("name", (/(?:ev|view)=([a-z]+)/.exec(q) || [0, "shot"])[1]));
  const phone = !!opt("phone", false), whole = !!opt("page", false);
  const timeout = +opt("timeout", 120) * 1000;
  fs.mkdirSync(out, { recursive: true });
  const index = path.resolve(String(opt("dist", path.resolve(__dirname, "..", "dist"))), "index.html");
  const url = "file:///" + index.replace(/\\/g, "/") + (q ? "?" + q : "");
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--mute-audio", "--autoplay-policy=no-user-gesture-required"] });
  const ctx = await browser.newContext(phone ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
  page.on("pageerror", (e) => errors.push("page: " + e.message));
  await page.goto(url);
  await page.waitForTimeout(+opt("wait", 0.6) * 1000);
  const js = opt("js", "");
  if (js && js !== true) await page.evaluate(js);
  const shots = [];
  const snap = async (label) => {
    const file = path.join(out, name + "-" + label + ".png");
    if (whole) await page.screenshot({ path: file, fullPage: true });
    else await page.locator("#stage").screenshot({ path: file });
    shots.push(file);
  };
  for (const m of at) {
    if (m === "end") {
      const t0 = Date.now();
      while (Date.now() - t0 < timeout) {
        const done = await page.evaluate(() => !!(window.__rtc && (window.__rtc.result || window.__rtc.errors.length)));
        if (done) break;
        await page.waitForTimeout(100);
      }
      await page.waitForTimeout(250);
      await snap("end");
    } else {
      const target = parseFloat(m), t0 = Date.now();
      // the game holds itself at exactly this moment (Stage.until), so the picture is of that moment at any speed
      if (!isNaN(target)) await page.evaluate((t) => { if (window.__rtc) window.__rtc.Stage.until = t; }, target);
      while (!isNaN(target) && Date.now() - t0 < timeout) {     // anything that isn't a number just means "now"
        const t = await page.evaluate(() => (window.__rtc && window.__rtc.Run && window.__rtc.Run.ctx ? window.__rtc.Run.ctx.time : -1));
        const over = await page.evaluate(() => !!(window.__rtc && (window.__rtc.result || window.__rtc.errors.length)));
        if (t >= target || over || t < 0) break;
        await page.waitForTimeout(30);
      }
      await page.waitForTimeout(isNaN(target) ? 300 : 80);
      await snap(m.replace(/[^0-9a-z.]/gi, "_"));
      await page.evaluate(() => { if (window.__rtc) window.__rtc.Stage.until = undefined; });
    }
  }
  const state = await page.evaluate(() => ({ result: window.__rtc && window.__rtc.result, results: window.__rtc ? window.__rtc.results.length : 0, errors: window.__rtc ? window.__rtc.errors : ["no __rtc"], view: window.__rtc ? window.__rtc.Game.view : "" }));
  await browser.close();
  state.errors = state.errors.concat(errors);
  state.shots = shots;
  console.log(JSON.stringify(state));
  process.exit(state.errors.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
