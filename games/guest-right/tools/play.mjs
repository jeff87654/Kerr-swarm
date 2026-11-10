// Scripted playthroughs in headless Chrome on the real GPU: the game is driven from the title screen with real key
// presses, people are talked to, things are used, and a picture is taken at every step.
// The dev server must be running (python tools/serve.py).
//
//   node tools/play.mjs opening            the title, a new game, the guest desk, the cab, the flat, the hall
//   node tools/play.mjs day2 day3 ending   several scenarios, one browser each
//   node tools/play.mjs list               the scenarios
//
// --size 1280x720   --q "extra=query"   --page dist/index.html   --out out/play   --port 5190
// Pictures land in out/play/<scenario>/NN-name.png. Console errors are printed at the end and make the exit code 1.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const flagsWithValue = new Set(['--size', '--q', '--page', '--out', '--port']);
const names = args.filter((a, i) => !a.startsWith('--') && !flagsWithValue.has(args[i - 1]));
const [W, H] = get('--size', '1280x720').split('x').map(Number);
const port = get('--port', '5190');
const pageName = get('--page', '');
const outRoot = get('--out', 'out/play');
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => fs.existsSync(p));
if (!chrome) { console.log('No Chrome or Edge found.'); process.exit(1); }
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));

// ------------------------------------------------------------------ helpers that run inside the page
const PAGE_HELPERS = () => {
  const g = window.game;
  const T = window.__t = {
    st() {
      const p = g.player;
      return {
        day: g.clock.day, hour: +g.clock.hours.toFixed(2), frame: p.frame ? p.frame.id : null, place: g.zone ? g.zone.place : null, zone: g.zone ? g.zone.name : null,
        pos: [+p.pos.x.toFixed(1), +p.pos.y.toFixed(1), +p.pos.z.toFixed(1)], busy: g.busy, modal: !!(g.ui && g.ui.modal), paused: !!g.paused, mode: p.mode, seat: !!p.seat,
        thread: g.journal ? g.journal.current() : null, kwh: +g.wallet.kwh.toFixed(2),
      };
    },
    // what the conversation panel shows now
    talk() {
      const vis = (el) => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).opacity !== '0';
      const panel = document.querySelector('.gr-talk'); if (!vis(panel)) return null;
      const rows = [...document.querySelectorAll('.gr-choices .gr-choice')].filter(vis).map((r) => ({ label: (r.querySelector('.gr-choice-l') || r).textContent.trim(), off: r.classList.contains('is-off') }));
      const sp = panel.querySelector('.gr-talk-name, .gr-talk-speaker, .gr-speaker'); const tx = panel.querySelector('.gr-talk-text, .gr-talk-line');
      return { speaker: sp ? sp.textContent.trim() : '', text: tx ? tx.textContent.trim() : panel.textContent.trim().slice(0, 300), choices: rows };
    },
    promptOf(it) { try { return typeof it.prompt === 'function' ? String(it.prompt(g) || '') : String(it.prompt || ''); } catch (e) { return ''; } },
    posOf(it) { if (it.pos) { const q = it.pos(g); return q ? [q[0], q[1], q[2]] : null; } return [it.x, it.y, it.z]; },
    list(re, frameId) {
      const rx = new RegExp(re, 'i'); const out = [];
      for (const it of g.world.interacts) { const pr = T.promptOf(it); if (!rx.test(pr)) continue; if (frameId && it.frame.id !== frameId) continue; const q = T.posOf(it); out.push({ frame: it.frame.id, pos: q ? q.map((v) => +v.toFixed(1)) : null, prompt: pr, kind: it.kind }); }
      return out;
    },
    // stand in front of a point, on the floor, facing it
    stand(frame, x, y, z, dist) {
      const col = g.world.colliders(frame); let best = null;
      const cur = g.player.frame === frame ? g.player.pos : null;
      for (let k = 0; k < 16; k++) {
        const a = k * Math.PI / 8, px = x + Math.sin(a) * dist, pz = z + Math.cos(a) * dist;
        const gy = col ? col.ground(px, pz, y + 0.6) : y; if (gy === null || gy === undefined || gy === -Infinity) continue;
        const fy = typeof gy === 'number' ? gy : gy.y; if (!(Math.abs(fy - y) < 2.2)) continue;
        if (col && (col.sphereHit(px, fy + 1.0, pz, 0.28) || col.sphereHit(px, fy + 0.5, pz, 0.25))) continue;
        // prefer the side we are already on, and the same floor
        let score = Math.abs(fy - (y - 1.2)) * 0.5; if (cur) score += Math.hypot(cur.x - px, cur.z - pz) * 0.05;
        if (!best || score < best.score) best = { px, pz, fy, score };
      }
      if (!best) best = { px: x, pz: z + dist, fy: y - 1.2 };
      const yaw = Math.atan2(x - best.px, -(z - best.pz));
      g.player.stand && g.player.stand();
      g.player.place(frame, best.px, best.fy + 0.02, best.pz, yaw, Math.atan2(y - (best.fy + 1.6), dist) * 0.8);
      g.pipeline.resetHistory();
      return [best.px, best.fy, best.pz];
    },
    find(re, frameId, nth) {
      const rx = new RegExp(re, 'i'); const p = g.player; let best = null, bd = 1e18, n = 0;
      for (const it of g.world.interacts) {
        if (!rx.test(T.promptOf(it))) continue; if (frameId && it.frame.id !== frameId) continue;
        const q = T.posOf(it); if (!q) continue;
        if (nth !== undefined && nth !== null) { if (n++ === nth) return it; continue; }
        const d = (it.frame === p.frame ? 0 : 1e9) + Math.hypot(q[0] - p.pos.x, q[1] - p.pos.y, q[2] - p.pos.z);
        if (d < bd) { bd = d; best = it; }
      }
      return best;
    },
    // walk up to a thing (found by its prompt) and look at it; returns its prompt, or null
    face(re, frameId, nth, dist) {
      const it = T.find(re, frameId, nth); if (!it) return null;
      const q = T.posOf(it); T.stand(it.frame, q[0], q[1], q[2], dist || Math.min(1.3, (it.radius || 1.6) * 0.7));
      T.target = it; return T.promptOf(it);
    },
    // use the thing we are facing, as the E key would (falls back to calling it if the look test misses)
    useTarget() {
      const it = T.target; if (!it) return 'nothing';
      if (it.enabled && !it.enabled(g)) return 'disabled';
      try { const r = it.onUse(g, it); if (r && r.catch) r.catch((e) => console.error('[interact] ' + (e && e.stack ? e.stack : e))); } catch (e) { console.error('[interact] ' + (e && e.stack ? e.stack : e)); return 'threw'; }
      return 'ok';
    },
    // go and stand in front of a named person
    person(id) {
      const hnd = g.people && g.people.byId(id); if (!hnd) return null;
      const it = g.world.interacts.find((q) => q.kind === 'talk' && T.promptOf(q) && q.onUse && q.__id === id) || null;
      const all = g.people.all; const p = all.find((q) => q.castId === id); if (!p) return null;
      if (p.state === 'away') return 'away';
      T.stand(p.frame, p.x, p.y + 1.3, p.z, 1.5);
      T.target = p.interact; return { frame: p.frame.id, pos: [+p.x.toFixed(1), +p.y.toFixed(1), +p.z.toFixed(1)], state: p.state, pose: p.pose, place: p.spot ? p.spot.place : null };
    },
    toasts() { return [...document.querySelectorAll('.gr-toast, .gr-banner, .gr-card')].map((e) => e.textContent.trim()).filter(Boolean).slice(-6); },
  };
  return true;
};

// ------------------------------------------------------------------ the driver
async function run(name, scenario) {
  const outDir = path.join(outRoot, name); fs.mkdirSync(outDir, { recursive: true });
  for (const f of fs.readdirSync(outDir)) if (f.endsWith('.png')) fs.unlinkSync(path.join(outDir, f));
  const browser = await puppeteer.launch({
    executablePath: chrome, headless: 'new',
    args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--force_high_performance_gpu', '--enable-unsafe-swiftshader', `--window-size=${W},${H}`, '--autoplay-policy=no-user-gesture-required', '--disable-frame-rate-limit', '--disable-gpu-vsync'],
    defaultViewport: { width: W, height: H },
  });
  const errors = []; let n = 0; const log = (s) => console.log(`[${name}] ${s}`);
  try {
    const page = await browser.newPage();
    page.on('console', (m) => { const t = m.text(); if (/favicon|status of 404|\[boot\]|\[place |\[people\] \d/.test(t)) return; if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${t}`); });
    page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
    const T = {
      page, log,
      ev: (fn, ...a) => page.evaluate(fn, ...a),
      wait: sleep,
      st: () => page.evaluate(() => window.__t.st()),
      async load(q, title) {
        const url = `http://127.0.0.1:${port}/${pageName}?${title ? '' : 'auto&'}${q || ''}${get('--q', '') ? '&' + get('--q', '') : ''}`;
        let ok = false;
        for (let k = 0; k < 3 && !ok; k++) {
          try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }); } catch (e) { continue; }
          ok = await page.waitForFunction(() => window.game && window.game.ready, { timeout: 90000 }).then(() => true).catch(() => false);
        }
        if (!ok) throw new Error('the game did not start');
        await page.evaluate(PAGE_HELPERS);
        await sleep(1.5);
      },
      async shot(label, settle = 0.8) {
        await sleep(settle);
        const file = path.join(outDir, String(++n).padStart(2, '0') + '-' + label + '.png');
        await page.screenshot({ path: file });
        const s = await T.st();
        log(`${path.basename(file)}  day ${s.day} ${String(Math.floor(s.hour)).padStart(2, '0')}:${String(Math.round((s.hour % 1) * 60)).padStart(2, '0')}  ${s.frame}/${s.place || '-'}  (${s.pos})  ${s.kwh} kWh  thread: ${s.thread || '-'}${s.busy ? '  busy' : ''}${s.modal ? '  modal' : ''}`);
      },
      key: async (k, hold = 60) => { await page.keyboard.down(k); await sleep(hold / 1000); await page.keyboard.up(k); await sleep(0.08); },
      until: (fn, timeout = 20, ...a) => page.waitForFunction(fn, { timeout: timeout * 1000 }, ...a).then(() => true).catch(() => false),
      clickText: (re) => page.evaluate((src) => { const rx = new RegExp(src, 'i'); const b = [...document.querySelectorAll('button, [role=button], .gr-menu-item, .gr-title-item')].find((e) => e.getClientRects().length && rx.test(e.textContent)); if (b) { b.click(); return b.textContent.trim(); } return null; }, re),
      go: (spawn, day, hour) => page.evaluate((sp, d, h) => { const g = window.game; g.go(sp, d, h); return window.__t.st(); }, spawn, day || 0, hour || 0),
      at: (frame, x, y, z, yaw = 0, pitch = 0) => page.evaluate((f, x, y, z, yaw, pitch) => { const g = window.game; g.player.place(g.world.frames.get(f), x, y, z, yaw, pitch); g.pipeline.resetHistory(); }, frame, x, y, z, yaw, pitch),
      clock: (day, hour) => page.evaluate((d, h) => { window.game.clock.set(d, h); }, day, hour),
      look: (yaw, pitch = 0) => page.evaluate((y, p) => { window.game.player.yaw = y; window.game.player.pitch = p; }, yaw, pitch),
      // read through a conversation: E for lines, the given answers (numbers from 1, or text to match) for choices, the first
      // open choice otherwise. Stops when the panel has gone and nothing has the player.
      async talkThrough(answers = [], max = 500, stopWhen = null) {
        const seen = []; let last = '', idle = 0, stuck = 0;
        for (let k = 0; k < max; k++) {
          if (stopWhen && await page.evaluate(stopWhen)) break;
          const s = await page.evaluate(() => ({ t: window.__t.talk(), busy: window.game.busy, modal: !!(window.game.ui && window.game.ui.modal) }));
          if (!s.modal) {                                  // nothing is asking for a key: done once nothing has the player either
            if (!s.busy) { idle++; if (idle >= 2) break; } else { stuck++; if (stuck > 240) { log('  (gave up waiting: busy with no panel for a minute)'); break; } }
            await sleep(0.25); continue;
          }
          idle = 0; stuck = 0;
          if (!s.t) {
            // a screen that is not a conversation: a menu (buy the first thing once, then leave), a "sit until" dial (confirm), anything else (Esc)
            await sleep(0.5);
            const scr = await page.evaluate(() => { const vis = (el) => el && el.getClientRects().length > 0; if (window.__t.talk()) return null; return { items: [...document.querySelectorAll('.gr-item')].filter(vis).map((i) => i.textContent.replace(/\s+/g, ' ').trim().slice(0, 70)), prim: [...document.querySelectorAll('.gr-btn.is-primary')].filter(vis).map((b) => b.textContent.trim()) }; });
            if (!scr) continue;
            if (scr.items.length && !T._bought) { T._bought = true; seen.push('   [menu] ' + scr.items.slice(0, 8).join('  ·  ')); await T.key('e'); await sleep(0.6); }
            else if (scr.items.length) { await T.key('Escape'); await sleep(0.5); T._bought = false; }
            else if (scr.prim.length) {
              // a screen with a main button (sit until an hour, turn the card over, send it home): write in any empty box, then press the button
              seen.push('   [screen] ' + scr.prim.join(' / '));
              await page.evaluate(() => {
                const vis = (el) => el && el.getClientRects().length > 0;
                const ta = [...document.querySelectorAll('textarea')].find(vis);
                if (ta && !ta.value) { ta.value = 'Dear Pell, the mother took. Chervil is loud and I have eaten at one table with four hundred people. Home in one leg.'; ta.dispatchEvent(new Event('input', { bubbles: true })); }
                const b = [...document.querySelectorAll('.gr-btn.is-primary')].find(vis); if (b) b.click();
              });
              await sleep(1.0);
            }
            else { stuck++; if (stuck > 3) { await T.key('Escape'); await sleep(0.5); } if (stuck > 12) { log('  (a screen is open that will not close)'); break; } }
            continue;
          }
          if (s.t.choices.length) {
            let pick = -1; const want = answers.length ? answers.shift() : null;
            if (typeof want === 'number') pick = want - 1;
            else if (typeof want === 'string') pick = s.t.choices.findIndex((c) => new RegExp(want, 'i').test(c.label));
            if (pick < 0 || !s.t.choices[pick] || s.t.choices[pick].off) pick = s.t.choices.findIndex((c) => !c.off);
            seen.push('   ? ' + s.t.choices.map((c, i) => (i === pick ? '[' + c.label + ']' : c.label) + (c.off ? ' (off)' : '')).join('  ·  '));
            await T.key(String(pick + 1)); await sleep(0.3);
          } else {
            const line = s.t.speaker + ': ' + s.t.text;
            if (line !== last) { seen.push('   ' + line); last = line; }
            await T.key('e'); await sleep(0.1);
          }
        }
        return seen;
      },
      // walk up to a thing and use it; then read through whatever it says
      async use(re, o = {}) {
        const pr = await page.evaluate((re, f, nth, d) => window.__t.face(re, f || null, nth === undefined ? null : nth, d || 0), re, o.frame, o.nth, o.dist);
        if (!pr) { log(`  NOT FOUND: a thing to use matching /${re}/`); errors.push(`[play] nothing to use matching /${re}/`); return null; }
        if (o.shot) await T.shot(o.shot);
        const r = await page.evaluate(() => window.__t.useTarget());
        log(`  use "${pr}" → ${r}`);
        if (o.talk !== false) { await sleep(0.4); const lines = await T.talkThrough(o.answers || []); if (o.print !== false) lines.slice(0, o.lines || 60).forEach((l) => console.log(l)); }
        return pr;
      },
      async talkTo(id, o = {}) {
        const r = await page.evaluate((id) => window.__t.person(id), id);
        if (!r || r === 'away') { log(`  NOT HERE: ${id} (${r})`); errors.push(`[play] ${id} is ${r === 'away' ? 'away' : 'missing'}`); return null; }
        log(`  ${id} is at ${r.frame} (${r.pos}) ${r.state}/${r.pose}${r.place ? ' in ' + r.place : ''}`);
        if (o.shot) await T.shot(o.shot);
        await page.evaluate(() => window.__t.useTarget());
        await sleep(0.4);
        const lines = await T.talkThrough(o.answers || []);
        if (o.print !== false) lines.slice(0, o.lines || 80).forEach((l) => console.log(l));
        return lines;
      },
      toasts: () => page.evaluate(() => window.__t.toasts()),
    };
    await scenario(T);
  } catch (e) { errors.push('[play] ' + (e && e.stack ? e.stack : e)); }
  finally { await browser.close(); }
  const uniq = [...new Set(errors)];
  if (uniq.length) { console.log(`[${name}] ${uniq.length} problem(s):`); console.log(uniq.slice(0, 40).join('\n')); } else log('no errors');
  return uniq.length;
}

// ------------------------------------------------------------------ scenarios
async function holdKey(T, k, secs) { await T.page.keyboard.down(k); await sleep(secs); await T.page.keyboard.up(k); }
const SCENARIOS = {
  // every thing that can be used, by place (for writing scenarios)
  async prompts(T) {
    await T.load('at=court&t=13');
    const out = await T.ev(() => {
      const g = window.game, by = {};
      for (const it of g.world.interacts) {
        const q = window.__t.posOf(it); const pr = window.__t.promptOf(it); if (!q) continue;
        const z = g.world.zoneAt(it.frame, q[0], q[1], q[2]);
        const key = it.frame.id + '/' + (z ? (z.place || z.id || z.name) : '-');
        (by[key] = by[key] || []).push(pr + (it.kind === 'talk' ? '' : ''));
      }
      return by;
    });
    for (const k of Object.keys(out).sort()) console.log(k + ': ' + [...new Set(out[k])].join(' | '));
    console.log('STOPS: ' + JSON.stringify(await T.ev(() => window.game.cab.stops.map((s) => s.id + '=' + s.name))));
    console.log('CAST: ' + JSON.stringify(await T.ev(() => window.game.people.all.filter((p) => p.castId).map((p) => p.castId + '@' + p.frame.id + (p.state === 'away' ? '(away)' : '')))));
  },
  // a scratch scenario for looking into one thing
  async debug(T) {
    await T.load('at=guestdesk&t=9.8');
    await T.ev(() => { const g = window.game; window.__log = []; const L = (s) => window.__log.push(g.time.toFixed(2) + ' ' + s);
      g.events.on('ui:modal', (on) => L('ui:modal ' + on)); g.events.on('talked', (e) => L('talked ' + JSON.stringify(e)));
      const p = g.people.all.find((q) => q.castId === 'sefa'); const f = p.interact.onUse; p.interact.onUse = function () { L('onUse sefa  input.use=' + g.input.use() + ' edge=' + [...g.input.edge].join(',') + ' enabled=' + g.input.enabled + ' busy=' + g.busy); return f.apply(this, arguments); };
      window.addEventListener('keydown', (e) => L('keydown(bubble) ' + e.code + ' repeat=' + e.repeat)); window.addEventListener('keydown', (e) => L('keydown(capture) ' + e.code + ' modal=' + g.ui.modal), true); });
    const r = await T.ev(() => window.__t.person('sefa')); T.log(JSON.stringify(r));
    await T.ev(() => window.__t.useTarget());
    for (let k = 0; k < 14; k++) { await T.wait(0.5); await T.key('e'); }
    console.log((await T.ev(() => window.__log)).join('\n'));
  },
  // The title, a new game, the guest desk, the cab, your flat, the hall and Marit.
  async opening(T) {
    await T.load('', true);
    await T.shot('title', 2.5);
    T.log('  title → ' + await T.clickText('^\s*(new|begin|start|arrive)'));
    await T.until(() => window.game.started && !window.game.busy, 20);
    await T.shot('arrival', 3.5);
    await T.ev(() => { window.game.player.yaw += 1.2; }); await T.shot('arrival-right');
    await T.ev(() => { window.game.player.yaw -= 2.4; }); await T.shot('arrival-left');
    await T.use('Pick up your bag', { shot: 'bag' });
    await T.go('ledger'); await T.shot('ledger-hall');
    await T.use('Read the figures', { shot: 'ledger-figures' });
    await T.go('guestdesk'); await T.shot('guest-desk');
    await T.use('Sign the guest book', { shot: 'guest-book' });
    await T.shot('signed-in');
    T.log('  toasts: ' + JSON.stringify(await T.toasts()));
    await T.go('station-lobby'); await T.shot('station-lobby');
    await T.use('Press the call button', { frame: 'station' });
    await T.use('Take a cab from berth 2', { frame: 'station', answers: ['Candlewick|Wick'], shot: 'berth' });
    await T.until(() => window.game.player.frame && window.game.player.frame.id === 'cab', 10); await T.shot('in-the-cab', 2.5);
    await T.until(() => window.game.player.frame && window.game.player.frame.id === 'candlewick' && !window.game.busy, 60);
    await T.shot('candlewick-lobby', 1.5);
    await T.go('court'); await T.shot('court-morning', 1.5);
    await T.go('flat-guest'); await T.shot('flat', 1.5);
    await T.use('pack', { frame: 'candlewick', shot: 'pack' });
    await T.use('Look out of the window', { shot: 'window' });
    await T.clock(1, 11.6);
    await T.go('hall'); await T.shot('hall', 2);
    await T.talkTo('marit', { shot: 'marit' });
    await T.shot('after-marit');
    await T.clock(1, 13.02); await T.wait(2);
    await T.talkTo('marit', { shot: 'marit-ramen' });
    await T.shot('ramen', 1.5);
    T.log('  journal: ' + JSON.stringify(await T.ev(() => window.game.journal.threads().map((t) => t.title + (t.done ? ' (done)' : ' ' + t.steps.filter((s) => s.done).length + '/' + t.steps.length)))));
  },

  // Thursday afternoon and evening: Oona, Thread Street, the toy library, gin, the choir, the letter room, the baths, bed.
  async evening(T) {
    await T.load('');
    await T.ev(() => { const g = window.game; g.newGame(); g.events.emit('game:new'); g.events.emit('ui:chapter', 'table'); });
    await T.wait(1);
    await T.talkTo('marit', { print: false }); await T.clock(1, 13.02); await T.wait(1.5); await T.talkTo('marit', { print: false });
    await T.go('studio', 1, 13.8); await T.shot('studio', 2);
    await T.talkTo('oona', { shot: 'oona' });
    await T.go('flat-oona'); await T.shot('oona-flat', 2.5);
    T.log('  toasts: ' + JSON.stringify(await T.toasts()));
    await T.go('studio'); await T.talkTo('oona');
    await T.use('Run the dawn on the model', { shot: 'model' }); await T.shot('model-running', 9); await T.shot('model-gold', 8);
    await T.wait(12); await T.talkThrough();
    await T.go('thread-street', 1, 15); await T.shot('thread-street', 2);
    await T.go('mender-in'); await T.talkTo('wim', { shot: 'wim' });
    await T.go('dyer-in'); await T.shot('dyer'); await T.talkTo('priya'); await T.use('Read the festival colours');
    await T.talkTo('priya', { answers: ['Re-dye'] }); await T.shot('dyed', 0.5);
    await T.go('flutes-in'); await T.use('Stand at the measuring board', { shot: 'flutes' }); await T.talkTo('matti');
    await T.go('toys-inside'); await T.shot('toys'); await T.talkTo('ros');
    await T.go('spinball-hall', 1, 16); await T.shot('spinball-hall', 2);
    for (let k = 0; k < 4; k++) { await T.key('f'); await T.wait(1.2); if (k === 1) await T.shot('ball-thrown', 0.2); await T.ev(() => { window.game.player.yaw += Math.PI / 2; }); }
    await T.wait(22); T.log('  toasts: ' + JSON.stringify(await T.toasts()));
    await T.go('toys-inside'); await T.talkTo('ros');
    await T.go('hall', 1, 18.2); await T.shot('hall-evening', 2);
    await T.use('Order at the pass', { shot: 'pass', answers: [1] });
    await T.use('Sit at the long table', { shot: 'sit-table' }); await T.shot('seated', 1.5); await T.key(' ');
    await T.go('court', 1, 19.55); await T.shot('court-choir', 3);
    await T.go('books', 1, 19.95); await T.shot('letter-room', 2);
    await T.talkTo('jory', { shot: 'jory' });
    await T.clock(1, 20.03); await T.wait(1); await T.use("reading|tonight's letter"); await T.shot('letter', 1);
    await T.talkTo('jory');
    await T.go('baths', 1, 21.6); await T.shot('baths-door', 2); await T.go('baths-pool'); await T.shot('baths-pool', 2);
    await T.use('Get into the hot pool', { shot: 'hot-pool' }); await T.shot('in-the-pool', 1.5);
    await T.go('court', 1, 22.4); await T.shot('court-late', 2.5);
    await T.go('flat-guest', 1, 23.2); await T.shot('flat-night', 2);
    await T.use('^Sleep', { answers: ['Sleep'] }); await T.wait(6); await T.shot('morning', 2);
    T.log('  journal: ' + JSON.stringify(await T.ev(() => window.game.journal.threads().map((t) => t.title + (t.done ? ' (done)' : ' ' + t.steps.filter((s) => s.done).length + '/' + t.steps.length)))));
    T.log('  found ' + JSON.stringify(await T.ev(() => window.game.journal.counts())));
  },

  // The Quiet: the feast's errands, the Hollow, the model dawn, spinball, the block court.
  async quiet(T) {
    await T.load('');
    await T.ev(() => { const g = window.game; g.newGame(); g.events.emit('game:new'); g.events.emit('ui:chapter', 'quiet'); });
    await T.shot('quiet-court', 3);
    await T.go('hall', 2, 9.3); await T.shot('hall-quiet', 2);
    await T.talkTo('marit', { shot: 'marit' });
    await T.go('lobby-a'); await T.shot('lobby', 1.5);
    await T.use('Call a cab', { frame: 'candlewick', answers: ['Hollow'] });
    await T.until(() => window.game.player.frame && window.game.player.frame.id === 'hollow' && !window.game.busy, 90);
    await T.shot('hollow-arrive', 2);
    await T.ev(() => { window.game.player.pitch = 1.1; }); await T.shot('far-bank', 1.2); await T.ev(() => { window.game.player.pitch = 0; });
    await T.go('orchard'); await T.shot('orchard', 2);
    await T.talkTo('dagny', { shot: 'dagny' });
    await T.use('Carry a crate of apples');
    await T.go('lake'); await T.shot('lake', 2);
    await T.use('Dive', { shot: 'jetty' }); await T.shot('dived', 2.5);
    await T.go('kitchen', 2, 11.5); await T.shot('kitchen', 2.5);
    T.log('  toasts: ' + JSON.stringify(await T.toasts()));
    await T.talkTo('rhos'); await T.talkTo('clem');
    await T.go('hall'); await T.talkTo('marit');
    await T.go('studio', 2, 13); await T.talkTo('oona'); await T.talkTo('suvi');
    await T.go('school', 2, 15.5); await T.shot('school', 2); await T.go('school-inside'); await T.shot('school-inside', 2);
    await T.go('spinball-hall'); await T.shot('spinball', 2); await T.use('Take a ball');
    await T.talkTo('ama'); await T.shot('ama', 0.5);
    await T.go('court', 2, 18.97); await T.shot('court-before', 2);
    await T.wait(4); const lines = await T.talkThrough(); lines.slice(0, 60).forEach((l) => console.log(l));
    await T.shot('court-after', 1);
    await T.go('flat-guest', 2, 22.5); await T.use('^Sleep', { answers: ['Sleep'] }); await T.wait(6); await T.shot('woken-at-five', 2);
    T.log('  journal: ' + JSON.stringify(await T.ev(() => window.game.journal.threads().map((t) => t.title + (t.done ? ' (done)' : ' ' + t.steps.filter((s) => s.done).length + '/' + t.steps.length)))));
  },

  // Booking Day: the dawn, the Ledger, the question, the feast, the vote.
  async booking(T) {
    await T.load('');
    await T.ev(() => { const g = window.game; g.newGame(); g.events.emit('game:new'); g.events.emit('ui:chapter', 'dawn'); });
    await T.shot('terrace-before', 3);
    await T.use('Buy a coffee|Dawn Stand', { frame: 'terrace1', shot: 'dawn-stand' });
    await T.clock(3, 5.98); await T.wait(4); await T.shot('dawn-start', 1);
    await T.clock(3, 6.25); await T.shot('dawn-violet', 5);
    await T.clock(3, 6.6); await T.shot('dawn-rose', 5);
    await T.clock(3, 6.95); await T.shot('dawn-gold', 5);
    await T.ev(() => { window.game.player.pitch = 0.9; }); await T.shot('dawn-gold-up', 1); await T.ev(() => { window.game.player.pitch = 0; });
    await T.clock(3, 7.2); await T.wait(8); (await T.talkThrough()).forEach((l) => console.log(l));
    await T.shot('dawn-done', 1);
    await T.go('ledger', 3, 8.46); await T.shot('ledger-before', 2); await T.wait(4);
    (await T.talkThrough(['tea', 1, 1])).slice(0, 70).forEach((l) => console.log(l)); await T.shot('ledger-read', 1);
    await T.clock(3, 10.02); await T.wait(4); (await T.talkThrough()).slice(0, 60).forEach((l) => console.log(l)); await T.shot('question', 1);
    await T.go('hall', 3, 12.95); await T.shot('feast-before', 2.5); await T.wait(4);
    (await T.talkThrough()).slice(0, 80).forEach((l) => console.log(l)); await T.shot('feast', 1.5);
    await T.ev(() => { window.game.player.yaw += 1.6; }); await T.shot('feast-along', 1);
    await T.go('court', 3, 17.02); await T.shot('court-vote', 2.5); await T.wait(4);
    (await T.talkThrough()).slice(0, 60).forEach((l) => console.log(l)); await T.shot('vote', 1);
    await T.go('court', 3, 19.5); await T.shot('court-festival', 3);
    await T.go('third-terrace', 3, 20.2); await T.shot('the-third', 3);
    T.log('  journal: ' + JSON.stringify(await T.ev(() => window.game.journal.threads().map((t) => t.title + (t.done ? ' (done)' : ' ' + t.steps.filter((s) => s.done).length + '/' + t.steps.length)))));
  },

  // Booking night and the fourth morning: the Long Flight, Oona at two, Marit, the card home, the credits.
  async ending(T) {
    await T.load('');
    await T.ev(() => { const g = window.game; g.newGame(); g.events.emit('game:new'); g.events.emit('ui:chapter', 'flight'); });
    await T.shot('gate', 3);
    await T.use('Look at the hire list', { shot: 'sleeve-hire' }); await T.talkTo('bertil');
    await T.clock(3, 22.02);
    await T.use('Take off', { frame: 'hub', shot: 'take-off', talk: false });
    await T.until(() => window.game.player.mode === 'fly' && !window.game.busy, 20);
    await T.shot('flight-start', 3);
    await holdKey(T, 'w', 9); await T.shot('flight-along', 0.5);
    await T.ev(() => { window.game.player.pitch = -0.5; }); await holdKey(T, 'w', 6); await T.shot('flight-down', 0.5);
    await T.wait(20); await T.shot('flight-later', 0.5);
    await T.until(() => window.game.flags.heard_marit_ask, 90); await T.shot('flight-marit-jory', 1.5);
    T.log('  heard Marit ask: ' + JSON.stringify(await T.ev(() => !!window.game.flags.heard_marit_ask)));
    T.log('  toasts: ' + JSON.stringify(await T.toasts()));
    await T.key('e'); await T.until(() => window.game.player.mode !== 'fly' && !window.game.busy, 20); await T.shot('landed', 2);
    await T.go('elders-terrace', 4, 2.0); await T.shot('elders-terrace', 3); await T.wait(3);
    (await T.talkThrough()).slice(0, 60).forEach((l) => console.log(l)); await T.shot('oona-at-two', 1);
    await T.go('flat-guest', 4, 2.6); await T.use('^Sleep', { answers: ['Sleep'] }); await T.wait(6); await T.shot('fourth-morning', 2);
    await T.go('hall'); await T.shot('hall-fourth', 2);
    const r = await T.ev(() => window.__t.person('marit')); T.log('  marit: ' + JSON.stringify(r));
    await T.ev(() => window.__t.useTarget()); await T.wait(0.5);
    (await T.talkThrough(['card'])).slice(0, 60).forEach((l) => console.log(l));
    await T.shot('card-home', 1.5);
    T.log('  after the talk: ' + JSON.stringify(await T.ev(() => ({ modal: window.game.ui.modal, busy: window.game.busy, flags: ['fourth_done', 'staying', 'going', 'wrote_card', 'ended'].filter((k) => window.game.flags[k]), card: (window.game.flags.cardText || '').slice(0, 40), music: window.game.music && window.game.music.now() }))));
    await T.shot('ending-black', 6);
    await T.shot('ending-lines', 6);
    await T.shot('credits', 9);
    await T.shot('credits-later', 8);
    await T.key('Escape'); await T.until(() => !window.game.busy && !window.game.ui.modal, 30);
    await T.shot('afterwards', 4);
    T.log('  at the end: ' + JSON.stringify(await T.ev(() => ({ modal: window.game.ui.modal, busy: window.game.busy, music: window.game.music && window.game.music.now(), journal: window.game.journal.threads().map((t) => t.title + (t.done ? ' (done)' : ' ' + t.steps.filter((s) => s.done).length + '/' + t.steps.length)) }))));
  },

  // The screens: journal, map, photo, pause, settings, how to play; then saving and continuing after a reload.
  async screens(T) {
    await T.load('', true);
    T.log('  title → ' + await T.clickText('^\\s*(new|begin|start|arrive)'));
    await T.until(() => window.game.started && !window.game.busy, 20); await T.wait(3);
    await T.go('guestdesk'); await T.use('Sign the guest book', { print: false });
    await T.go('ledger'); await T.use('Read the figures', { print: false }); await T.use('Read the householders', { print: false });
    await T.go('court', 1, 14); await T.wait(2);
    await T.key('j'); await T.shot('journal', 1.2);
    for (const tab of ['Found', 'People', 'Customs', 'Cards', 'Carrying|Bag|Pack']) { const c = await T.clickText('^\\s*(' + tab + ')'); if (c) await T.shot('journal-' + c.toLowerCase().replace(/[^a-z]+/g, '-').slice(0, 14), 0.8); }
    await T.key('Escape'); await T.wait(0.6);
    await T.key('m'); await T.shot('map', 1.5); await T.key('Escape'); await T.wait(0.6);
    await T.key('p'); await T.shot('photo-mode', 1.2);
    T.log('  photo → ' + await T.clickText('take|shutter|keep|card'));
    await T.wait(0.8); await T.key('Escape'); await T.wait(0.6);
    await T.key('Escape'); await T.shot('pause', 1);
    T.log('  pause → ' + await T.clickText('^\\s*settings'));
    await T.shot('settings', 1);
    await T.key('Escape'); await T.wait(0.4);
    T.log('  pause → ' + await T.clickText('how to play|controls|help'));
    await T.shot('how-to-play', 1); await T.key('Escape'); await T.wait(0.4);
    T.log('  open screens: ' + JSON.stringify(await T.ev(() => ({ modal: window.game.ui.modal, paused: window.game.paused }))));
    T.log('  pause → ' + await T.clickText('^\\s*(resume|back to|return|carry on|continue)'));
    await T.wait(0.8);
    const before = await T.st(); T.log('  before reload: ' + JSON.stringify(before));
    await T.ev(() => window.game.saveGame());
    // reload: the title should offer Continue, and Continue should put us back
    await T.page.reload({ waitUntil: 'domcontentloaded' });
    await T.page.waitForFunction(() => window.game && window.game.ready, { timeout: 90000 });
    await T.page.evaluate(PAGE_HELPERS); await T.wait(2);
    await T.shot('title-with-continue', 1);
    T.log('  title → ' + await T.clickText('^\\s*continue'));
    await T.until(() => window.game.started && !window.game.busy, 20); await T.wait(2.5);
    const after = await T.st(); T.log('  after continue: ' + JSON.stringify(after));
    await T.shot('continued', 1);
    if (after.frame !== before.frame || Math.hypot(after.pos[0] - before.pos[0], after.pos[2] - before.pos[2]) > 1.5 || after.day !== before.day) throw new Error('continue did not restore the place: ' + JSON.stringify(before.pos) + ' → ' + JSON.stringify(after.pos));
    if (Math.abs(after.hour - before.hour) > 0.5) throw new Error('continue did not restore the hour: ' + before.hour + ' → ' + after.hour);
    if (after.thread !== before.thread) throw new Error('continue did not restore the thread: ' + before.thread + ' → ' + after.thread);
  },

  // A phone held sideways: the touch controls, the title and a conversation at a small size.
  async phone(T) {
    await T.page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    await T.load('q=low', true);
    await T.shot('title', 2);
    T.log('  title → ' + await T.clickText('^\\s*(new|begin|start|arrive)'));
    await T.until(() => window.game.started && !window.game.busy, 20);
    await T.shot('arrival', 3.5);
    await T.go('guestdesk'); await T.ev(() => { window.__t.face('Sign the guest book'); window.__t.useTarget(); });
    await T.shot('talk', 2.5);
    (await T.talkThrough()).slice(0, 4).forEach((l) => console.log(l));
    await T.go('court', 1, 20); await T.shot('court', 2.5);
    await T.page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    await T.shot('portrait', 2.5);
    T.log('  overflow: ' + JSON.stringify(await T.ev(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, sh: document.documentElement.scrollHeight, ch: document.documentElement.clientHeight }))));
  },

  // A picture from every named spawn, at one in the afternoon and at ten at night (tools/sheet.py makes contact sheets).
  async tour(T) {
    await T.load('at=court&t=13&fixedres=1');
    const spawns = await T.ev(() => Object.keys(window.game.spawns).filter((k) => k !== 'test' && k !== 'start'));
    T.log('  ' + spawns.length + ' spawns');
    const perf = [];
    for (const hour of [13, 22]) {
      for (const sp of spawns) {
        await T.ev((sp, h) => { const g = window.game; g.go(sp, 1, h); if (g.ui) { try { g.ui.hud.show(false); } catch (e) { /* ignore */ } } }, sp, hour);
        await T.wait(1.6);
        const file = path.join(outRoot, 'tour', (hour === 13 ? 'day-' : 'night-') + sp + '.png');
        await T.page.screenshot({ path: file });
        const st = await T.ev(() => { const g = window.game, s = g.pipeline.stats, pf = g.perf || {}; return { calls: s.calls, tris: s.tris, lights: s.lights, cpu: +((pf.update || 0) + (pf.prerender || 0) + (pf.render || 0)).toFixed(1), zone: g.zone ? g.zone.name : '-' }; });
        perf.push(`${hour === 13 ? 'day  ' : 'night'} ${sp.padEnd(18)} calls=${String(st.calls).padStart(4)} tris=${String(st.tris).padStart(8)} lights=${String(st.lights).padStart(3)} cpu=${st.cpu}ms  ${st.zone}`);
      }
    }
    perf.forEach((l) => console.log(l));
  },

  // The last conversation and what follows it: the card home, the lines over black, the credits, and the morning after.
  async credits(T) {
    await T.load('');
    await T.ev(() => { const g = window.game; g.newGame(); g.events.emit('game:new'); g.events.emit('ui:chapter', 'flight'); g.flags.flew = true; g.flags.saw_oona_two = true; g.clock.set(4, 6.7); g.go('hall'); });
    await T.wait(4); await T.shot('hall-fourth', 1);
    const r = await T.ev(() => window.__t.person('marit')); T.log('  marit: ' + JSON.stringify(r));
    await T.ev(() => window.__t.useTarget()); await T.wait(0.5);
    (await T.talkThrough(['stay'], 500, () => !!window.game.flags.ended)).slice(0, 40).forEach((l) => console.log(l));
    T.log('  ending begun: ' + JSON.stringify(await T.ev(() => ({ busy: window.game.busy, music: window.game.music && window.game.music.now(), flags: ['fourth_done', 'staying', 'going', 'wrote_card', 'ended'].filter((k) => window.game.flags[k]) }))));
    await T.shot('fade', 1.2);
    await T.shot('line-1', 3.0);
    await T.shot('line-2', 5.2);
    await T.shot('line-3', 6.2);
    await T.until(() => window.game.ui.modal, 30);
    await T.shot('credits-1', 6);
    await T.shot('credits-2', 7);
    T.log('  during credits: ' + JSON.stringify(await T.ev(() => ({ busy: window.game.busy, modal: window.game.ui.modal, music: window.game.music && window.game.music.now() }))));
    await T.until(() => !window.game.busy && !window.game.ui.modal, 90);
    await T.shot('afterwards', 3);
    T.log('  at the end: ' + JSON.stringify(await T.ev(() => ({ modal: window.game.ui.modal, busy: window.game.busy, music: window.game.music && window.game.music.now() }))));
    await T.talkTo('marit');
  },

  // Every keeper at their counter on the Thursday afternoon: what they say, and what they sell.
  async shops(T) {
    await T.load('');
    await T.ev(() => { const g = window.game; g.newGame(); g.events.emit('game:new'); g.events.emit('ui:chapter', 'table'); g.clock.set(1, 14.5); });
    await T.wait(3);
    const keepers = [['bakery', 'idris'], ['greengrocer', 'fausta'], ['larder', 'zhenya'], ['herbs', 'amadou'], ['mender-in', 'wim'], ['dyer-in', 'priya'], ['flutes-in', 'matti'], ['chairs-in', 'gustav'], ['toys-inside', 'ros'], ['books', 'jory'], ['baths', 'dorota'], ['teacart', 'ben'], ['counter', 'tomas'], ['clinic', 'nkem']];
    for (const [sp, id] of keepers) {
      await T.go(sp); await T.wait(1.5);
      const prompts = await T.ev((id) => { const g = window.game; const p = g.people.all.find((q) => q.castId === id); if (!p) return 'missing'; const near = g.world.interacts.filter((it) => it.frame === p.frame && /^Talk to/.test(window.__t.promptOf(it)) && (!it.enabled || it.enabled(g)) && (() => { const q = window.__t.posOf(it); return q && Math.hypot(q[0] - p.x, q[2] - p.z) < 6; })()); return near.map((it) => window.__t.promptOf(it)); }, id);
      T.log('  ' + id + ': talk prompts near them = ' + JSON.stringify(prompts));
      T._bought = false;
      const lines = await T.talkTo(id, { print: false, shot: id });
      if (lines) lines.slice(0, 14).forEach((l) => console.log(l));
    }
    T.log('  wallet now ' + (await T.st()).kwh + ' kWh; carrying ' + JSON.stringify(await T.ev(() => window.game.inv.list().map((i) => i.id + '×' + i.n))));
  },
};

if (!names.length || names[0] === 'list') { console.log('scenarios: ' + Object.keys(SCENARIOS).join(', ')); process.exit(0); }
let bad = 0;
for (const nm of names) { if (!SCENARIOS[nm]) { console.log('no scenario called ' + nm); bad++; continue; } bad += await run(nm, SCENARIOS[nm]); }
process.exit(bad ? 1 : 0);
