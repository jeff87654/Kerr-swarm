// Print generated drum dossiers as text, for reading. node tools/sample_drums.js [x,y ...]
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
global.window = { localStorage: null, matchMedia: () => ({ matches: false }) };
global.CONTENT = JSON.parse(fs.readFileSync(path.join(root, "dist", "content.json"), "utf8"));
let code = "";
for (const f of ["00-util.js", "10-world.js", "15-canon.js", "20-drum.js"]) code += fs.readFileSync(path.join(root, "src", f), "utf8") + "\n";
code += "\nmodule.exports = { initWorld, getDrum, boardFor, noticesFor, peopleFor, tonightFor, CANON_ROW_ANCHORS };";
const m = new module.constructor();
m.paths = module.paths;
m._compile(code, "gen.js");
const G = m.exports;
G.initWorld();
const pts = process.argv.slice(2).map((s) => s.split(",").map(Number));
if (!pts.length) { const [hx, hy] = G.CANON_ROW_ANCHORS.Herb; for (let i = 0; i < 4; i++) pts.push([hx + 2 + i * 7, hy - 1]); pts.push([200000, 300000], [400000, 100000]); }
for (const [x, y] of pts) {
  const d = G.getDrum(x, y);
  console.log("\n==== " + d.name + " · " + d.row + " · " + d.kindLabel + " (" + x + "," + y + ")");
  console.log("row: " + d.rowAbout);
  console.log("famous: " + d.famous.map((f) => f.t + ": " + f.d + (f.buy ? " [buy " + f.buy.item + " " + f.buy.kwh + "]" : "")).join(" | "));
  console.log("rules: " + [d.rules.goods, d.rules.births, d.rules.gin, d.rules.guests && d.rules.guests.t + " (" + d.rules.guests.access + ")", "lamps " + d.rules.lamps].join(" / "));
  console.log("customs: " + d.customs.join(" | "));
  console.log("history: " + d.history);
  console.log("reputation: " + d.reputation + "   motto: " + d.motto + "   broth: " + d.broth);
  console.log("hollow: " + d.hollowText + " [" + d.hollowTags.join(",") + "] dawn: " + d.palette.name + (d.palette.by ? " by " + d.palette.by : ""));
  console.log("eat: " + d.eat.map((e) => e.name + " (" + (e.stars || 0) + "*, " + e.price + ") " + e.blurb).join(" | "));
  const ns = G.noticesFor(d, 3);
  console.log("notices:\n  - " + ns.map((n) => n.t).join("\n  - "));
  const ps = G.peopleFor(d, 3, 12 * 60, "platform");
  console.log("people:\n  - " + ps.map((p) => p.name + ", " + p.age + ", " + p.role + ", is " + p.doing + ". \"" + p.lines[0] + "\"").join("\n  - "));
  console.log("tonight: " + G.tonightFor(d, 3).map((e) => e.t + ": " + e.d).join(" | "));
}
