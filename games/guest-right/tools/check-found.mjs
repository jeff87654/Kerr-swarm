// Cross-check the things to find: every discovery id the code gives must exist in src/content/discoveries.js,
// and every discovery in the table should be given somewhere (otherwise nobody can ever find it).
//
//   node tools/check-found.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
const { DISCOVERIES } = await import('../src/content/discoveries.js');
const ids = new Set(Object.keys(DISCOVERIES));
const used = new Map();
const text = [];
const walk = (d) => {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.js') && !p.endsWith('discoveries.js')) text.push([path.relative(root, p).split(path.sep).join('/'), fs.readFileSync(p, 'utf8')]);
  }
};
walk(root);
// an id is "given" when it appears as a quoted string anywhere outside the table (find(game, 'x'), { found: 'x' }, a helper's argument...)
for (const id of ids) {
  const q1 = "'" + id + "'", q2 = '"' + id + '"';
  for (const [file, s] of text) if (s.includes(q1) || s.includes(q2)) { used.set(id, file); break; }
}
// ids handed to find()/found() that the table does not have
const missing = new Map();
const rx = /(?:\bfind\(\s*\w+\s*,\s*|journal\.find\(\s*|\bfound\(\s*\w+\s*,\s*|\bfound:\s*)'([a-z0-9-]+)'/g;
for (const [file, s] of text) { if (file.startsWith('ui/')) continue; for (const m of s.matchAll(rx)) if (!ids.has(m[1]) && !missing.has(m[1])) missing.set(m[1], file); }

const never = [...ids].filter((k) => !used.has(k));
console.log(ids.size + ' discoveries; ' + used.size + ' given somewhere in the code');
if (missing.size) console.log('GIVEN BUT NOT IN THE TABLE: ' + [...missing].map(([k, f]) => k + ' (' + f + ')').join(', '));
if (never.length) console.log('IN THE TABLE BUT NEVER GIVEN: ' + never.join(', '));
if (!missing.size && !never.length) console.log('No errors.');
process.exit(missing.size || never.length ? 1 : 0);
