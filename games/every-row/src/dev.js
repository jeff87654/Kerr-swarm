// For building one world: dev.html?file=<name> loads src/worlds/<name>.js alone and flies it round and round (its own
// opening leads back into itself, which also tests that its entry and exit are sound). Not part of the release.
// Several files, comma separated, are flown in that order: file=borage_fountains,borage_fair tries one crossing.
// A file that makes two worlds gives both; file=slow_line:slowLineOut takes the one export named.
import { boot } from './boot.js';

const qs = new URLSearchParams(location.search);
const files = (qs.get('file') || '').split(',').filter(Boolean);
const worlds = [];
for (const spec of files) {
  const [f, only] = spec.split(':');
  try {
    const mod = await import('./worlds/' + f + '.js');
    const defs = Object.entries(mod).filter(([k, v]) => v && typeof v.build === 'function' && v.id && (!only || k === only)).map(([, v]) => v);
    if (!defs.length) console.error('[every-row] ' + f + '.js exports no world (an object with id and build)');
    worlds.push(...defs);
  } catch (e) { console.error('[every-row] could not load ' + f + '.js: ' + (e && e.stack ? e.stack : e)); }
}
if (worlds.length) boot(worlds); else document.body.insertAdjacentHTML('beforeend', '<p style="position:fixed;left:1rem;top:1rem;color:#fff;font:16px sans-serif">dev.html?file=&lt;a file in src/worlds, without .js&gt;</p>');
