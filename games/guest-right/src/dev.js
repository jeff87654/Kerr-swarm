// Development entry: loads each place module on its own, so one broken file does not stop the rest.
// (The release build bundles the same list statically; see tools/build.py.)
import { boot } from './main.js';

async function start() {
  const res = await fetch('src/places.json', { cache: 'no-store' });
  const paths = await res.json();
  const places = [];
  for (const p of paths) {
    try {
      const head = await fetch('src/' + p, { method: 'HEAD', cache: 'no-store' }); if (!head.ok) continue;      // not written yet
      const m = await import('./' + p + '?v=' + Date.now()); if (m.place) places.push(m.place); else console.error('[dev] ' + p + ' exports no place');
    } catch (e) { console.error('[dev] failed to load ' + p + ': ' + (e && e.stack ? e.stack : e)); }
  }
  const opt = async (path, name) => { try { const m = await import(path + '?v=' + Date.now()); return m[name]; } catch (e) { console.warn('[dev] ' + path + ' not loaded: ' + (e && e.message)); return null; } };
  const createUI = await opt('./ui/ui.js', 'createUI');
  const createAudio = await opt('./audio/audio.js', 'createAudio');
  await boot({ places, createUI, createAudio });
}
start();
