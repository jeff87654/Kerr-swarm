const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
global.window = { localStorage: null, matchMedia: () => ({ matches: false }) };
global.CONTENT = JSON.parse(fs.readFileSync(path.join(root, "dist", "content.json"), "utf8"));
let code = "";
for (const f of ["00-util.js", "10-world.js", "15-canon.js", "20-drum.js"]) code += fs.readFileSync(path.join(root, "src", f), "utf8") + "\n";
code += "\nmodule.exports = { initWorld, getDrum };";
const m = new module.constructor(); m.paths = module.paths; m._compile(code, "gen.js");
const G = m.exports; G.initWorld();
const c = { gin: {}, goods: {}, kinds: {}, slots: 0, guestAccess: {} };
let bad = [];
for (let i = 0; i < 3000; i++) {
  const x = 1000 + ((i * 7919) % 500000), y = 1000 + ((i * 104729) % 500000);
  const d = G.getDrum(x, y);
  c.gin[d.rules.gin.slice(0, 40)] = (c.gin[d.rules.gin.slice(0, 40)] || 0) + 1;
  c.kinds[d.sub] = (c.kinds[d.sub] || 0) + 1;
  c.guestAccess[d.rules.guests.access] = (c.guestAccess[d.rules.guests.access] || 0) + 1;
  const all = [d.rules.goods, d.rules.births, d.rules.gin, d.rules.guests.t, d.rules.dayNote, d.history || "", d.reputation || "", ...(d.customs || []), d.hollowText, d.broth, ...d.eat.map((e) => e.name + e.blurb + e.tip + e.where)].join(" ");
  const m2 = all.match(/\{[a-z0-9]+\}/g);
  if (m2) { c.slots++; if (bad.length < 6) bad.push(d.name + ": " + m2.join(",")); }
}
const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 6);
console.log("kinds", c.kinds);
console.log("guest access", c.guestAccess);
console.log("gin top", top(c.gin));
console.log("drums with unfilled slots", c.slots, bad);
