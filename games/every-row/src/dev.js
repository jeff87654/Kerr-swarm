// For building one world: dev.html?file=<name> loads src/worlds/<name>.js alone and flies it round and round (its own
// opening leads back into itself, which also tests that its entry and exit are sound). Not part of the release.
import { boot } from './boot.js';

const qs = new URLSearchParams(location.search);
const files = (qs.get('file') || '').split(',').filter(Boolean);
const worlds = [];
for (const f of files) {
  try {
    const mod = await import('./worlds/' + f + '.js');
    const defs = Object.values(mod).filter((v) => v && typeof v.build === 'function' && v.id);
    if (!defs.length) console.error('[every-row] ' + f + '.js exports no world (an object with id and build)');
    worlds.push(...defs);
  } catch (e) { console.error('[every-row] could not load ' + f + '.js: ' + (e && e.stack ? e.stack : e)); }
}
if (worlds.length) boot(worlds); else document.body.insertAdjacentHTML('beforeend', '<p style="position:fixed;left:1rem;top:1rem;color:#fff;font:16px sans-serif">dev.html?file=&lt;a file in src/worlds, without .js&gt;</p>');
