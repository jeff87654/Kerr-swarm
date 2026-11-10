/* Play games with their bots without a browser, to check that they end, and to balance the marks.

   node tools/sim.js                        # every game: seeds 1..8 at skill 1, 0.75 and 0.5
   node tools/sim.js moth wolf              # just these
   node tools/sim.js moth --seeds 20 --skills 1,0.5,0.3
   node tools/sim.js --json                 # machine-readable

   It loads the same source files the page does (no drawing, no sound) and steps each game at 120 steps
   a second through the same bot-to-input path the page uses. A game that never sets s.done is reported
   as stuck after 300 s of game time.

   node tools/sim.js round --mode light --threads 2 --club 7     # the Round: its score is 13 minus the place */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.indexOf("--" + k) >= 0;
const only = args.filter((a, i) => !a.startsWith("--") && (i === 0 || !["--seeds", "--skills", "--mode", "--threads", "--club"].includes(args[i - 1])));
// for the Round: --mode heavy|light, --threads 0..3 (that many knots on every thread), --club 1..12
const roundMode = opt("mode", "heavy"), roundKnots = +opt("threads", 0), roundClub = +opt("club", 4);
const nSeeds = +opt("seeds", 8);
const skills = String(opt("skills", "1,0.75,0.5")).split(",").map(Number);

// the twelve Hours, joined the way build.py joins them
const atlas = JSON.parse(fs.readFileSync(path.resolve(ROOT, "..", "..", "atlas", "sorrel", "content", "hours.json"), "utf8"));
const mine = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "hours.json"), "utf8"));
const hours = mine.map((m) => { const a = Object.assign({}, atlas.find((h) => h.n === m.n)); a.club_long = a.club; delete a.hex; return Object.assign(a, m); });

const files = fs.readdirSync(SRC).filter((f) => f.endsWith(".js") && !/^(40|90)-/.test(f)).sort();
const isGame = /^[56]\d-([a-z]+)\.js$/;
const sandbox = { window: { addEventListener() {} }, console, Math, JSON, Object, Array, Number, String, Date, Map, Set, Symbol, Error, isNaN, isFinite, parseInt, parseFloat, performance: { now: () => 0 }, setTimeout() {}, clearTimeout() {}, setInterval() {} };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
let code = "const CONTENT = " + JSON.stringify({ hours }) + ";\n";
const broken = [];
for (const f of files) {
  const text = fs.readFileSync(path.join(SRC, f), "utf8");
  const m = isGame.exec(f);
  if (m) {
    if (only.length && !only.includes(m[1])) continue;
    try { new vm.Script(text, { filename: f }); } catch (e) { broken.push(f + ": " + e.message); continue; }
    code += "try {\n" + text + "\n} catch (e) { __broken.push(" + JSON.stringify(f) + " + ': ' + e.message); }\n";
  } else code += text + "\n";
}
code += `
for (const h of CONTENT.hours) { HOURS[h.n] = h; PALS[h.n] = makePal(h); }
globalThis.__play = function (id, seed, skill) {
  const ev = EVENTS[id];
  const n = ev.hour || 0;
  const threads = {}; for (let i = 1; i <= 12; i++) if (__knots) threads[HOUR_IDS[i]] = { k: __knots };
  const ctx = { seed, rng: makeRng(seed), hour: HOURS[n || __club], pal: PALS[n || __club], sfx: SndOff, hud: HudOff, say() {}, demo: false, skill, best: undefined, reduced: false, time: 0, opt: n ? null : { mode: __mode }, club: __club, threads };
  const s = ev.create(ctx);
  Run.b = freshInput(); Run.prev = { down: false, left: false, right: false, up: false, dn: false }; Run.tapUp = false; Run._bi = null;
  let steps = 0;
  const max = 300 * 120;
  while (!s.done && steps < max) { ev.bot(s, Run.b, ctx); const inp = Run.botInput(); ev.update(s, STEP, inp, ctx); ctx.time += STEP; steps++; }
  let knots = 0; const score = Math.round((s.score || 0) * 100) / 100;
  if (ev.marks) for (let i = 0; i < 3; i++) if (score >= ev.marks[i]) knots = i + 1;
  let text = ""; try { text = ev.result ? ev.result(s, ctx) : String(score); } catch (e) { text = "result() threw: " + e.message; }
  if (id === "round") text = ordinal(s.place) + " in " + fmtMinSec(s.finished * 36) + (s.blownN ? ", legs gone x" + s.blownN : "") + (s.tookOff ? ", took off x" + s.tookOff : "") + ", pushed " + Math.round(100 * s.pushT / s.t) + "%";
  return { score, knots, secs: Math.round(steps / 12) / 10, stuck: !s.done, text };
};
globalThis.__ids = Object.keys(EVENTS);
globalThis.__marks = (id) => EVENTS[id].marks;
`;
sandbox.__broken = broken; sandbox.__mode = roundMode; sandbox.__knots = roundKnots; sandbox.__club = roundClub;
vm.runInContext(code, sandbox, { filename: "round-the-clock.js" });

const out = {};
for (const id of sandbox.__ids) {
  if (only.length && !only.includes(id)) continue;
  if (!sandbox.EVENTS && false) continue;
  out[id] = { marks: sandbox.__marks(id), runs: {} };
  for (const sk of skills) {
    const runs = [];
    for (let seed = 1; seed <= nSeeds; seed++) {
      try { runs.push(sandbox.__play(id, seed, sk)); } catch (e) { runs.push({ error: e.message, score: 0, knots: 0, secs: 0 }); }
    }
    out[id].runs[sk] = runs;
  }
}
if (flag("json")) { console.log(JSON.stringify({ broken, games: out })); process.exit(0); }
for (const b of broken) console.log("BROKEN  " + b);
for (const id of Object.keys(out)) {
  const g = out[id];
  console.log(id.padEnd(8) + "marks " + JSON.stringify(g.marks));
  for (const sk of skills) {
    const r = g.runs[sk];
    const errs = r.filter((x) => x.error), stuck = r.filter((x) => x.stuck);
    const sc = r.map((x) => x.score), kn = r.map((x) => x.knots);
    const avg = (a) => (a.reduce((p, c) => p + c, 0) / a.length).toFixed(1);
    console.log("   skill " + String(sk).padEnd(5) + " knots " + kn.join("") + "  avg " + avg(kn) + "   score " + Math.min(...sc) + ".." + Math.max(...sc) + " avg " + avg(sc) + "   " + avg(r.map((x) => x.secs)) + " s" + (stuck.length ? "   STUCK x" + stuck.length : "") + (errs.length ? "   ERROR: " + errs[0].error : ""));
  }
  if (flag("text")) console.log("   e.g. " + g.runs[skills[0]][0].text);
}
