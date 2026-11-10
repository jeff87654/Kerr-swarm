// Cross-check the journal's threads: every step of every thread must be marked done somewhere in the code or the
// dialogue, and every thread must be closed somewhere (otherwise it can never be finished).
//
//   node tools/check-threads.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
const { THREADS } = await import('../src/content/threads.js');
let all = '';
const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (p.endsWith('.js') && !p.endsWith('threads.js')) all += '\n' + fs.readFileSync(p, 'utf8'); } };
walk(root);
const esc = (s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
let bad = 0;
for (const t of THREADS) {
  const id = esc(t.id);
  const stepRx = (i) => new RegExp("(?:\\bstep\\(\\s*\\w+\\s*,\\s*'" + id + "'\\s*,\\s*" + i + "\\s*\\)|journal\\.step\\(\\s*'" + id + "'\\s*,\\s*" + i + "\\s*\\)|thread:\\s*'" + id + "'\\s*,\\s*step:\\s*" + i + "\\b)");
  const doneRx = new RegExp("(?:\\bdone\\(\\s*\\w+\\s*,\\s*'" + id + "'\\s*\\)|journal\\.done\\(\\s*'" + id + "'\\s*\\)|thread:\\s*'" + id + "'[^}]*done:\\s*true)");
  const startRx = new RegExp("(?:\\bstart\\(\\s*\\w+\\s*,\\s*'" + id + "'\\s*\\)|journal\\.start\\(\\s*'" + id + "'\\s*\\)|thread:\\s*'" + id + "'[^}]*start:\\s*true)");
  const missing = t.steps.map((_, i) => i).filter((i) => !stepRx(i).test(all));
  // a loop over the steps (the chapters do this) also counts
  const looped = new RegExp("step\\(\\s*\\w+\\s*,\\s*'" + id + "'\\s*,\\s*k\\s*\\)").test(all);
  const problems = [];
  if (missing.length && !looped) problems.push('steps never marked: ' + missing.map((i) => i + ' "' + t.steps[i].slice(0, 50) + '"').join('; '));
  if (!doneRx.test(all)) problems.push('never closed');
  if (!startRx.test(all) && !new RegExp("(?:step|done)\\(\\s*\\w+\\s*,\\s*'" + id + "'").test(all)) problems.push('never started');
  if (problems.length) { bad++; console.log(t.id + ': ' + problems.join(' | ')); }
}
console.log(THREADS.length + ' threads' + (bad ? ', ' + bad + ' with problems' : '. No errors.'));
process.exit(bad ? 1 : 0);
