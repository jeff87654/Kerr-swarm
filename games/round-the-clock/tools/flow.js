/* Click through the whole game the way a player would, with a real pointer and keyboard, and report any page error.

   node tools/flow.js                 # desktop
   node tools/flow.js --phone         # a 390 x 844 phone, with touch
   node tools/flow.js --out out/flow  # where the pictures go (default out/flow)

   It picks an Hour, opens every Hour's card, starts each game and mashes at it for a few seconds
   (moves, clicks, drags, Space and the arrows) to shake out anything a bot's tidy input never reaches,
   then runs the Round. It does not check that the games are winnable: tools/sim.js does that. */
"use strict";
const fs = require("fs");
const path = require("path");
let chromium;
try { chromium = require("playwright-core").chromium; } catch (e) { console.error("playwright-core not found: npm i playwright-core"); process.exit(2); }
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) : d; };
const CHROME = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find((p) => p && fs.existsSync(p));
const HOURS = ["hare", "heron", "owl", "bee", "fox", "otter", "stag", "swift", "badger", "moth", "wolf", "lark"];

(async () => {
  const phone = !!opt("phone", false);
  const out = path.resolve(String(opt("out", "out/flow")));
  fs.mkdirSync(out, { recursive: true });
  const index = path.resolve(String(opt("dist", path.resolve(__dirname, "..", "dist"))), "index.html");
  const url = "file:///" + index.replace(/\\/g, "/") + "?fresh=1&mute=1";
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--mute-audio"] });
  const ctx = await browser.newContext(phone ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 860 } });
  const page = await ctx.newPage();
  const errors = [], log = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
  page.on("pageerror", (e) => errors.push("page: " + e.message));
  const shot = (name) => page.screenshot({ path: path.join(out, (phone ? "phone-" : "") + name + ".png"), fullPage: false });
  const view = () => page.evaluate(() => window.__rtc.Game.view);
  const pageErrs = () => page.evaluate(() => window.__rtc.errors.slice());
  const act = async (a, extra) => { await page.click('[data-act="' + a + '"]' + (extra || "")); await page.waitForTimeout(150); };
  const expect = async (want, what) => { const v = await view(); if (v !== want) errors.push(what + ": expected view " + want + ", got " + v); log.push(what + " -> " + v); };

  await page.goto(url);
  await page.waitForTimeout(700);
  await expect("title", "open"); await shot("1-title");
  await act("pick", '[data-n="7"]'); await expect("pick", "pick Stag"); await shot("2-pick");
  await act("join"); await expect("clock", "join"); await shot("3-clock");
  await act("hour"); await expect("card", "start"); await page.waitForTimeout(1500); await shot("4-card");

  let box = await page.locator("#stage").boundingBox();
  const at = (fx, fy) => [box.x + box.width * fx, box.y + box.height * fy];
  const mash = async (secs) => {
    box = await page.locator("#stage").boundingBox();      // the page may have scrolled to bring the stage into view
    const t0 = Date.now(); let i = 0;
    while (Date.now() - t0 < secs * 1000) {
      const [x, y] = at(0.15 + 0.7 * ((i * 37) % 100) / 100, 0.15 + 0.7 * ((i * 61) % 100) / 100);
      if (phone) { await page.touchscreen.tap(x, y); }
      else {
        await page.mouse.move(x, y, { steps: 3 });
        if (i % 3 === 0) { await page.mouse.down(); const [x2, y2] = at(0.2 + 0.6 * ((i * 53) % 100) / 100, 0.2 + 0.6 * ((i * 29) % 100) / 100); await page.mouse.move(x2, y2, { steps: 4 }); await page.mouse.up(); }
        else await page.mouse.click(x, y);
        const key = ["Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Digit3"][i % 6];
        await page.keyboard.down(key); await page.waitForTimeout(40); await page.keyboard.up(key);
      }
      await page.waitForTimeout(60); i++;
    }
  };

  for (const h of HOURS) {
    await page.evaluate((id) => { location.hash = "#" + id; }, h);
    await page.waitForTimeout(400);
    await expect("card", "card " + h);
    await act("play");
    await page.waitForTimeout(2400);                 // the count
    await expect("play", "play " + h);
    await mash(3.2);
    await shot("5-" + h);
    const v = await view();
    if (v === "play") { if (phone) await act("quit"); else await page.keyboard.press("Escape"); await page.waitForTimeout(200); }
    const e = await pageErrs(); if (e.length) { errors.push(h + ": " + e.join(" | ")); await page.evaluate(() => { window.__rtc.errors.length = 0; }); }
  }

  // one game to its end by the house, to see a result card with a real thread
  await page.goto(url.replace("fresh=1", "fresh=1&club=7&ev=otter&bot=1&keep=1&speed=6"));
  for (let i = 0; i < 300 && (await view()) !== "result"; i++) await page.waitForTimeout(100);
  await expect("result", "otter by the house"); await shot("6-result");
  await act("clock"); await expect("clock", "back to the clock"); await shot("7-clock-one-thread");

  // the Round, held down in bursts
  await act("round"); await expect("round", "the Round card"); await page.waitForTimeout(800); await shot("8-round-card");
  await page.click('[data-act="run"][data-mode="heavy"]'); await page.waitForTimeout(2400);
  await expect("play", "the Heavy Round");
  await page.evaluate(() => { window.__rtc.Stage.speed = 5; });
  box = await page.locator("#stage").boundingBox();
  const [mx, my] = at(0.5, 0.5);
  for (let i = 0; i < 400 && (await view()) === "play"; i++) {
    if (phone) { await page.touchscreen.tap(mx, my); await page.waitForTimeout(120); }
    else { await page.mouse.move(mx, my); await page.mouse.down(); await page.waitForTimeout(160); await page.mouse.up(); await page.waitForTimeout(90); }
    if (i === 12) await shot("9-round-running");
  }
  await page.evaluate(() => { window.__rtc.Stage.speed = 1; });
  await expect("roundresult", "the Round's result"); await shot("10-round-result");
  const e2 = await pageErrs(); if (e2.length) errors.push("round: " + e2.join(" | "));
  await browser.close();
  console.log(log.join("\n"));
  console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no errors");
  process.exit(errors.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
