// Cross-check the story flags: a flag that is read somewhere but never set anywhere marks content that can never
// happen (usually two files spelling one flag two ways). Prints those, and the flags set but never read (harmless).
//
//   node tools/check-flags.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
const files = [];
const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (p.endsWith('.js')) files.push([path.relative(root, p).split(path.sep).join('/'), fs.readFileSync(p, 'utf8')]); } };
walk(root);

const written = new Map(), read = new Map();
const note = (m, k, file) => { if (!/^[A-Za-z_][\w:-]*$/.test(k)) return; if (!m.has(k)) m.set(k, new Set()); m.get(k).add(file); };
// the names a flags object goes by in this code
const OBJ = String.raw`(?:\bflags|\bFl|\bF\(\s*\w+\s*\)|\bflags\(\s*\w+\s*\)|\bst\.flags)`;
for (const [file, s] of files) {
  if (file.startsWith('ui/') || file.startsWith('audio/') || file.startsWith('render/')) continue;
  // writes: x.flag = ..., x['flag'] = ..., delete is not a write
  for (const m of s.matchAll(new RegExp(OBJ + String.raw`\.([A-Za-z_]\w*)\s*(?:=(?!=)|\+=|-=|\+\+|\|\|=)`, 'g'))) note(written, m[1], file);
  for (const m of s.matchAll(new RegExp(OBJ + String.raw`\[\s*'([^']+)'\s*\]\s*(?:=(?!=)|\+=)`, 'g'))) note(written, m[1], file);
  // Object.assign(flags, { a: .., b: .. })
  for (const m of s.matchAll(new RegExp(String.raw`Object\.assign\(\s*` + OBJ + String.raw`\s*,\s*\{([^}]*)\}`, 'g'))) for (const k of m[1].matchAll(/(?:^|,)\s*'?([A-Za-z_][\w:-]*)'?\s*:/g)) note(written, k[1], file);
  // dialogue steps: { set: 'a' } / { set: ['a', 'b'] }
  for (const m of s.matchAll(/\bset:\s*'([^']+)'/g)) note(written, m[1], file);
  for (const m of s.matchAll(/\bset:\s*\[([^\]]*)\]/g)) for (const k of m[1].matchAll(/'([^']+)'/g)) note(written, k[1], file);
  // reads: everything else that names a flag
  for (const m of s.matchAll(new RegExp(OBJ + String.raw`\.([A-Za-z_]\w*)\b(?!\s*(?:=(?!=)|\+=|-=|\+\+|\|\|=))`, 'g'))) note(read, m[1], file);
  for (const m of s.matchAll(new RegExp(OBJ + String.raw`\[\s*'([^']+)'\s*\](?!\s*(?:=(?!=)|\+=))`, 'g'))) note(read, m[1], file);
  for (const m of s.matchAll(/\b(?:flag|notFlag|need|clear):\s*'([^']+)'/g)) note(read, m[1], file);
  for (const m of s.matchAll(/\bflags:\s*\[([^\]]*)\]/g)) for (const k of m[1].matchAll(/'([^']+)'/g)) note(read, k[1], file);
}
// not flags: array methods on a list of flags, and keys built at run time ('item:' + id, 'nudge:' + id, 'dawn:' + phase)
const skip = new Set(['length', 'hasOwnProperty', 'ended', 'some', 'every', 'indexOf']);
const built = /^(item|nudge|dawn|flight|loan):/;
const dead = [...read.keys()].filter((k) => !written.has(k) && !skip.has(k) && !built.test(k)).sort();
const unused = [...written.keys()].filter((k) => !read.has(k) && !skip.has(k)).sort();
console.log(written.size + ' flags set, ' + read.size + ' read');
if (dead.length) { console.log('READ BUT NEVER SET (content behind these can never happen):'); for (const k of dead) console.log('  ' + k + '   ' + [...read.get(k)].join(', ')); }
console.log('set but never read (harmless): ' + (unused.join(', ') || 'none'));
if (!dead.length) console.log('No errors.');
process.exit(dead.length ? 1 : 0);
