// Styles, part one: tokens, base, HUD, dialogue, venue menus. Injected by ui.js as one <style>.

export const CSS_BASE = `
#gr-ui {
  --panel: rgba(20, 16, 12, .84);
  --panel-solid: #14100c;
  --panel-2: rgba(30, 24, 18, .9);
  --line: rgba(255, 217, 160, .18);
  --line-2: rgba(255, 217, 160, .32);
  --line-3: rgba(255, 217, 160, .08);
  --text: #F3EDE2;
  --dim: #A99F90;
  --faint: #7d7468;
  --lamp: #FFD9A0;
  --gold: #FFE3A8;
  --ember: #FF7A2F;
  --teal: #3FE0D0;
  --leaf: #8FD694;
  --warn: #FF5468;
  --ink: #2a2620;
  --paper: #efe6d3;
  --serif: 'Cormorant Garamond', 'Iowan Old Style', Georgia, serif;
  --cond: 'Barlow Condensed', 'Arial Narrow', sans-serif;
  --sans: 'Barlow', 'Segoe UI', system-ui, sans-serif;
  --hand: 'Caveat', 'Segoe Print', cursive;
  --halo: 0 0 1px rgba(0,0,0,.85), 0 1px 2px rgba(0,0,0,.7), 0 0 12px rgba(0,0,0,.5);
  --halo-big: 0 1px 2px rgba(0,0,0,.6), 0 2px 18px rgba(0,0,0,.55), 0 0 42px rgba(0,0,0,.35);
  --ease: cubic-bezier(.22,.7,.2,1);
  --sub: 1;
  --edge: max(26px, env(safe-area-inset-left));
  --edge-r: max(26px, env(safe-area-inset-right));
  --edge-b: max(22px, env(safe-area-inset-bottom));
  position: fixed; inset: 0; z-index: 50; pointer-events: none; overflow: hidden;
  color: var(--text); font: 400 16px/1.45 var(--sans);
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
  user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent;
  font-variant-numeric: lining-nums;
}
#gr-ui.gr-sub-large { --sub: 1.17; }
#gr-ui *, #gr-ui *::before, #gr-ui *::after { box-sizing: border-box; }
:where(#gr-ui) :where(button) { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit; letter-spacing: inherit; text-transform: inherit; }
:where(#gr-ui) :focus { outline: none; }
.gr-ico { width: 1em; height: 1em; display: block; flex: none; }
.gr-icowrap { display: inline-flex; width: 1em; height: 1em; flex: none; }
.gr-icowrap > .gr-ico { width: 100%; height: 100%; }
.gr-ember { color: var(--ember); }
#gr-ui .gr-gone { display: none !important; }
.gr-layer { position: absolute; inset: 0; pointer-events: none; }
.gr-l-world { z-index: 1; } .gr-l-hud { z-index: 2; } .gr-l-touch { z-index: 3; } .gr-l-letter { z-index: 4; }
.gr-l-note { z-index: 5; } .gr-l-fade { z-index: 6; } .gr-l-banner { z-index: 7; } .gr-l-talk { z-index: 8; }
.gr-l-photo { z-index: 9; } .gr-l-screen { z-index: 10; } .gr-l-load { z-index: 12; }

.gr-panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 3px;
  box-shadow: 0 1px 0 rgba(255,236,200,.05) inset, 0 24px 60px rgba(0,0,0,.38), 0 2px 8px rgba(0,0,0,.25);
}
@supports ((backdrop-filter: blur(4px)) or (-webkit-backdrop-filter: blur(4px))) {
  .gr-panel { backdrop-filter: blur(12px) saturate(1.08); -webkit-backdrop-filter: blur(12px) saturate(1.08); }
}
.gr-kicker {
  font: 600 12px/1.2 var(--cond); letter-spacing: .18em; text-transform: uppercase; color: var(--dim);
}
.gr-serif { font-family: var(--serif); font-style: italic; color: var(--gold); }
.gr-key {
  display: inline-flex; align-items: center; justify-content: center; flex: none;
  min-width: 22px; height: 22px; padding: 0 6px 1px;
  border: 1px solid rgba(255,217,160,.5); border-bottom-width: 2px; border-radius: 4px;
  font: 600 12px/1 var(--cond); letter-spacing: .08em; text-transform: uppercase;
  color: var(--gold); background: rgba(20,16,12,.72); text-shadow: none;
}
.gr-key.is-small { min-width: 18px; height: 18px; font-size: 11px; padding: 0 4px 1px; }
.gr-rule { height: 1px; background: var(--line); border: 0; margin: 0; }
.gr-orn { display: flex; align-items: center; justify-content: center; gap: 10px; color: var(--lamp); opacity: .7; }
.gr-orn::before, .gr-orn::after { content: ''; height: 1px; width: 42px; background: currentColor; opacity: .55; }
.gr-orn i { width: 5px; height: 5px; transform: rotate(45deg); border: 1px solid currentColor; display: block; }

/* buttons in panels */
.gr-btn {
  display: inline-flex; align-items: center; gap: 10px; height: 38px; padding: 0 16px;
  border: 1px solid var(--line-2); border-radius: 2px;
  font: 600 13px/1 var(--cond); letter-spacing: .16em; text-transform: uppercase; color: var(--text);
  transition: background .18s, border-color .18s, color .18s; pointer-events: auto;
}
.gr-btn .gr-ico { font-size: 16px; }
.gr-btn:hover, .gr-btn:focus-visible, .gr-btn.is-focus { background: rgba(255,217,160,.1); border-color: var(--lamp); color: var(--gold); }
.gr-btn.is-primary { background: rgba(255,217,160,.14); border-color: rgba(255,217,160,.6); color: var(--gold); }
.gr-btn.is-primary:hover, .gr-btn.is-primary:focus-visible { background: rgba(255,217,160,.22); }
.gr-btn.is-quiet { border-color: transparent; color: var(--dim); }
.gr-btn.is-quiet:hover, .gr-btn.is-quiet:focus-visible { color: var(--gold); border-color: var(--line); background: rgba(255,217,160,.05); }
.gr-btn[disabled] { opacity: .35; pointer-events: none; }
.gr-x {
  width: 38px; height: 38px; display: grid; place-items: center; border-radius: 50%;
  color: var(--dim); font-size: 20px; transition: color .18s, background .18s; pointer-events: auto;
}
.gr-x:hover, .gr-x:focus-visible { color: var(--gold); background: rgba(255,217,160,.08); }

/* ---------- HUD ---------- */
.gr-hud { transition: opacity .45s var(--ease); }
.gr-hud.is-hidden, #gr-ui.gr-has-screen .gr-hud, #gr-ui.gr-photo-on .gr-hud { opacity: 0; }
#gr-ui.gr-talking .gr-hud { opacity: .55; }
#gr-ui.gr-talking .gr-hud .gr-place, #gr-ui.gr-talking .gr-hud .gr-status, #gr-ui.gr-talking .gr-hud .gr-thread { opacity: 0; transition: opacity .3s; }
#gr-ui.gr-talking .gr-hud .gr-ret, #gr-ui.gr-talking .gr-hud .gr-prompt { opacity: 0; }
.gr-pool { position: absolute; pointer-events: none; z-index: -1; background: radial-gradient(closest-side, rgba(8,6,4,.4), rgba(8,6,4,.2) 55%, rgba(8,6,4,0)); }

.gr-place { position: absolute; left: var(--edge); bottom: var(--edge-b); max-width: min(52vw, 520px); text-shadow: var(--halo); transition: opacity .5s var(--ease), transform .5s var(--ease); }
.gr-place.is-swap { opacity: 0; transform: translateY(6px); }
.gr-place .gr-pool { inset: -40px -70px -30px -60px; }
.gr-place-rule { width: 26px; height: 1px; background: var(--lamp); margin-bottom: 11px; box-shadow: 0 0 4px rgba(0,0,0,.6); }
.gr-place-title { font: 600 15px/1.15 var(--cond); letter-spacing: .2em; text-transform: uppercase; color: var(--lamp); }
.gr-place-sub { font: 400 13.5px/1.35 var(--sans); color: rgba(243,237,226,.86); margin-top: 5px; letter-spacing: .01em; }

.gr-status { position: absolute; right: var(--edge-r); bottom: var(--edge-b); display: flex; flex-direction: column; align-items: flex-end; gap: 7px; text-shadow: var(--halo); }
.gr-status .gr-pool { inset: -40px -50px -30px -70px; }
.gr-status-top { display: flex; align-items: center; gap: 7px; font: 600 13px/1 var(--cond); letter-spacing: .08em; color: rgba(243,237,226,.85); }
.gr-status-top .gr-ico { font-size: 14px; color: var(--lamp); filter: drop-shadow(0 0 2px rgba(0,0,0,.8)); }
.gr-status-row { display: flex; align-items: center; gap: 16px; }
.gr-clock { display: flex; align-items: baseline; gap: 8px; }
.gr-clock-t { font: 500 22px/1 var(--cond); letter-spacing: .04em; color: var(--text); font-variant-numeric: tabular-nums; }
.gr-clock-d { font: 600 11.5px/1 var(--cond); letter-spacing: .18em; text-transform: uppercase; color: rgba(243,237,226,.78); }
.gr-vrule { width: 1px; height: 26px; background: rgba(255,217,160,.35); box-shadow: 0 0 3px rgba(0,0,0,.6); }
.gr-wallet { position: relative; display: flex; align-items: baseline; gap: 5px; color: var(--ember); }
.gr-wallet-n { font: 600 27px/1 var(--cond); letter-spacing: .02em; font-variant-numeric: tabular-nums; }
.gr-wallet-u { font: 600 12px/1 var(--cond); letter-spacing: .14em; }
.gr-wallet.is-pulse .gr-wallet-n { animation: gr-pulse .7s var(--ease); }
@keyframes gr-pulse { 0% { opacity: .55 } 40% { opacity: 1 } 100% { opacity: 1 } }
.gr-delta { position: absolute; right: 0; bottom: 100%; margin-bottom: 4px; font: 600 15px/1 var(--cond); letter-spacing: .04em; white-space: nowrap; color: var(--ember); animation: gr-delta 1.8s var(--ease) forwards; }
.gr-delta.is-gain { color: var(--leaf); }
@keyframes gr-delta { 0% { opacity: 0; transform: translateY(8px) } 15% { opacity: 1; transform: translateY(0) } 70% { opacity: 1 } 100% { opacity: 0; transform: translateY(-14px) } }

.gr-compass { position: absolute; top: max(16px, env(safe-area-inset-top)); left: 50%; transform: translateX(-50%); width: min(540px, 70vw); height: 46px; transition: opacity .4s; }
.gr-compass .gr-pool { inset: -34px -90px -74px -90px; }
.gr-compass.is-off { opacity: 0; }
.gr-cstrip { position: absolute; inset: 0; overflow: hidden; filter: drop-shadow(0 0 1.5px rgba(0,0,0,.9)) drop-shadow(0 1px 5px rgba(0,0,0,.45));
  -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 16%, #000 84%, transparent 100%); mask-image: linear-gradient(90deg, transparent 0, #000 16%, #000 84%, transparent 100%); }
.gr-cline { position: absolute; left: 0; right: 0; top: 12px; height: 1px; background: rgba(243,237,226,.38); }
.gr-tick { position: absolute; top: 12px; left: 0; width: 1px; height: 5px; background: rgba(243,237,226,.6); will-change: transform; }
.gr-tick.is-mid { height: 8px; background: rgba(243,237,226,.75); }
.gr-card-pt { position: absolute; top: 24px; left: 0; font: 600 11.5px/1 var(--cond); letter-spacing: .2em; text-transform: uppercase; color: rgba(243,237,226,.92); white-space: nowrap; will-change: transform; padding-left: .2em; }
.gr-card-pt.is-spin { color: var(--lamp); }
.gr-cmark { position: absolute; top: 12px; left: 0; width: 0; height: 0; will-change: transform, opacity; }
.gr-cmark i { position: absolute; left: -5px; top: -5px; width: 10px; height: 10px; display: block; }
.gr-cmark.is-thread i { background: var(--lamp); transform: rotate(45deg) scale(.82); box-shadow: 0 0 0 2px rgba(20,16,12,.55); }
.gr-cmark.is-place i { border: 1.5px solid var(--text); border-radius: 50%; transform: scale(.8); background: rgba(20,16,12,.4); }
.gr-cmark.is-person i { border-radius: 50%; background: var(--text); transform: scale(.6); box-shadow: 0 0 0 2px rgba(20,16,12,.5); }
.gr-cmark.is-edge i { opacity: .55; }
.gr-caret { position: absolute; left: 50%; top: 2px; width: 0; height: 0; margin-left: -4px; border: 4px solid transparent; border-top: 5px solid var(--lamp); border-bottom: 0; filter: drop-shadow(0 0 2px rgba(0,0,0,.8)); }
.gr-clabel { position: absolute; left: 50%; top: 42px; transform: translateX(-50%); white-space: nowrap; font: 600 11px/1 var(--cond); letter-spacing: .16em; text-transform: uppercase; color: var(--text); text-shadow: var(--halo); opacity: 0; transition: opacity .25s; }
.gr-clabel.is-on { opacity: 1; }
.gr-clabel b { color: var(--lamp); font-weight: 600; margin-left: 8px; text-transform: none; letter-spacing: .08em; }

.gr-thread { position: absolute; top: calc(max(16px, env(safe-area-inset-top)) + 62px); left: 50%; transform: translateX(-50%); max-width: min(560px, 86vw); display: flex; align-items: center; gap: 9px; text-shadow: var(--halo); transition: opacity .5s var(--ease), transform .5s var(--ease); }
.gr-thread.is-off { opacity: 0; transform: translate(-50%, -4px); }
.gr-thread .gr-ico { font-size: 13px; color: var(--lamp); filter: drop-shadow(0 0 2px rgba(0,0,0,.9)); }
.gr-thread-t { font: 400 14.5px/1.3 var(--sans); color: rgba(243,237,226,.92); }
.gr-thread.is-new .gr-thread-t { animation: gr-glow 2.4s var(--ease); }
@keyframes gr-glow { 0%, 30% { color: var(--gold) } 100% { color: rgba(243,237,226,.92) } }

.gr-ret { position: absolute; left: 50%; top: 50%; width: 0; height: 0; transition: opacity .2s; }
.gr-ret > * { position: absolute; transition: opacity .18s, transform .22s var(--ease); }
.gr-ret-dot { left: -1.5px; top: -1.5px; width: 3px; height: 3px; border-radius: 50%; background: rgba(255,250,240,.95); box-shadow: 0 0 0 1px rgba(0,0,0,.45), 0 0 6px rgba(0,0,0,.4); }
.gr-ret-ring { left: -9px; top: -9px; width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid var(--lamp); box-shadow: 0 0 0 1px rgba(0,0,0,.25), 0 0 8px rgba(0,0,0,.35), inset 0 0 0 1px rgba(0,0,0,.2); opacity: 0; transform: scale(.5); }
.gr-ret-talk { left: -11px; top: -12px; width: 22px; height: 22px; color: var(--lamp); opacity: 0; transform: scale(.6); filter: drop-shadow(0 0 1px rgba(0,0,0,.9)) drop-shadow(0 0 4px rgba(0,0,0,.5)); }
.gr-ret-talk .gr-ico { width: 22px; height: 22px; }
.gr-ret-aim { left: -10px; top: -10px; width: 20px; height: 20px; opacity: 0; }
.gr-ret-aim::before, .gr-ret-aim::after { content: ''; position: absolute; background: rgba(255,250,240,.9); box-shadow: 0 0 2px rgba(0,0,0,.8); }
.gr-ret-aim::before { left: 9.5px; top: 0; width: 1px; height: 20px; -webkit-mask: linear-gradient(#000 0 35%, transparent 35% 65%, #000 65%); mask: linear-gradient(#000 0 35%, transparent 35% 65%, #000 65%); }
.gr-ret-aim::after { top: 9.5px; left: 0; height: 1px; width: 20px; -webkit-mask: linear-gradient(90deg, #000 0 35%, transparent 35% 65%, #000 65%); mask: linear-gradient(90deg, #000 0 35%, transparent 35% 65%, #000 65%); }
.gr-ret.m-use .gr-ret-ring { opacity: 1; transform: scale(1); }
.gr-ret.m-use .gr-ret-dot { opacity: .9; }
.gr-ret.m-talk .gr-ret-talk { opacity: 1; transform: scale(1); }
.gr-ret.m-talk .gr-ret-dot { opacity: 0; }
.gr-ret.m-aim .gr-ret-aim { opacity: 1; }
.gr-ret.m-aim .gr-ret-dot { opacity: .8; }
.gr-ret.m-none { opacity: 0; }
.gr-prompt { position: absolute; left: 50%; top: calc(50% + 24px); transform: translate(-50%, 4px); display: flex; align-items: center; gap: 10px; white-space: nowrap; opacity: 0; transition: opacity .2s, transform .25s var(--ease); text-shadow: var(--halo); max-width: 90vw;
  padding: 4px 13px 4px 4px; border-radius: 3px; background: rgba(14,11,8,.5); box-shadow: 0 0 18px rgba(8,6,4,.25); }
.gr-prompt.is-on { opacity: 1; transform: translate(-50%, 0); }
.gr-prompt-t { font: 500 15.5px/1.2 var(--sans); color: var(--text); overflow: hidden; text-overflow: ellipsis; }

/* notes: toasts, card, subtitles, bubbles, ride */
.gr-toasts { position: absolute; right: var(--edge-r); bottom: calc(var(--edge-b) + 92px); width: min(340px, calc(100vw - 52px)); display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
#gr-ui.gr-has-screen .gr-toasts { opacity: 0; }
#gr-ui.gr-photo-on .gr-l-note, #gr-ui.gr-photo-on .gr-l-world { opacity: 0; transition: opacity .3s; }
.gr-toast { display: flex; align-items: center; gap: 11px; max-width: 100%; padding: 9px 15px 9px 12px; border-left: 2px solid var(--kc, var(--teal)); opacity: 0; transform: translateX(14px); transition: opacity .3s var(--ease), transform .35s var(--ease); }
.gr-toast.is-on { opacity: 1; transform: none; }
.gr-toast.is-out { opacity: 0; transform: translateY(-6px); }
.gr-toast .gr-ico { font-size: 17px; color: var(--kc, var(--teal)); }
.gr-toast-t { font: 400 14.5px/1.35 var(--sans); color: var(--text); }
.gr-toast.k-gain, .gr-toast.k-spend { --kc: var(--ember); }
.gr-toast.k-thread { --kc: var(--lamp); }
.gr-toast.k-found { --kc: var(--leaf); }

.gr-dcard { position: absolute; top: calc(max(16px, env(safe-area-inset-top)) + 100px); left: 50%; width: min(460px, calc(100vw - 32px)); padding: 20px 28px 22px; text-align: center; transform: translate(-50%, -10px); opacity: 0; transition: opacity .45s var(--ease), transform .55s var(--ease); }
.gr-dcard.is-on { opacity: 1; transform: translate(-50%, 0); }
.gr-dcard::before { content: ''; position: absolute; inset: 5px; border: 1px solid var(--line-3); pointer-events: none; border-radius: 2px; }
.gr-dcard-k { display: flex; justify-content: center; align-items: center; gap: 8px; color: var(--leaf); }
.gr-dcard-k .gr-ico { font-size: 15px; }
.gr-dcard-k .gr-kicker { color: var(--leaf); }
.gr-dcard-t { font: italic 600 29px/1.1 var(--serif); color: var(--gold); margin: 10px 0 10px; }
.gr-dcard .gr-orn { margin-bottom: 11px; }
.gr-dcard-x { font: 400 15px/1.5 var(--sans); color: rgba(243,237,226,.9); text-wrap: pretty; }

.gr-banner { position: absolute; left: 0; right: 0; top: 25%; padding: 0 20px; text-align: center; text-shadow: var(--halo-big); opacity: 0; transition: opacity .9s var(--ease); }
.gr-banner.is-on { opacity: 1; }
.gr-banner-t { font: italic 600 clamp(46px, 7.4vw, 92px)/1 var(--serif); color: var(--gold); letter-spacing: .005em; transform: translateY(8px); transition: transform 1.6s var(--ease); }
.gr-banner.is-on .gr-banner-t { transform: none; }
.gr-banner::before { content: ''; position: absolute; left: 50%; top: 50%; width: min(980px, 110vw); height: 300px; transform: translate(-50%, -50%); background: radial-gradient(closest-side, rgba(8,6,4,.42), rgba(8,6,4,.2) 55%, rgba(8,6,4,0)); z-index: -1; pointer-events: none; }
.gr-banner-s { display: flex; align-items: center; justify-content: center; gap: 18px; margin-top: 14px; font: italic 500 clamp(19px, 2vw, 24px)/1.2 var(--serif); letter-spacing: .01em; color: var(--text); }
.gr-banner-s::before, .gr-banner-s::after { content: ''; flex: none; width: 46px; height: 1px; background: var(--lamp); opacity: .8; box-shadow: 0 0 4px rgba(0,0,0,.6); }

.gr-subs { position: absolute; left: 50%; bottom: calc(var(--edge-b) + 104px); transform: translateX(-50%); width: min(760px, calc(100vw - 32px)); display: flex; flex-direction: column; align-items: center; gap: 6px; }
#gr-ui.gr-talking .gr-subs { opacity: 0; }
.gr-sub { max-width: 100%; padding: 6px 14px 7px; border-radius: 3px; background: rgba(14,11,8,.62); font: 400 calc(16px * var(--sub))/1.4 var(--sans); color: var(--text); text-align: center; opacity: 0; transform: translateY(6px); transition: opacity .3s, transform .3s var(--ease); }
.gr-sub.is-on { opacity: 1; transform: none; }
.gr-sub b { font: 600 calc(12px * var(--sub))/1 var(--cond); letter-spacing: .14em; text-transform: uppercase; color: var(--lamp); margin-right: 9px; }

.gr-bubble { position: absolute; left: 0; top: 0; max-width: 230px; padding: 7px 12px 8px; font: 400 14px/1.35 var(--sans); color: var(--text); background: rgba(20,16,12,.8); border: 1px solid var(--line); border-radius: 3px; transform-origin: 50% 100%; transition: opacity .25s; will-change: transform; white-space: normal; text-wrap: balance; text-align: center; }
.gr-bubble::after { content: ''; position: absolute; left: 50%; bottom: -6px; width: 10px; height: 10px; margin-left: -5px; background: rgba(20,16,12,.92); border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); transform: rotate(45deg) scaleY(.7); }

.gr-ride { position: absolute; left: 50%; top: 21%; transform: translate(-50%, 6px); text-align: center; text-shadow: var(--halo-big); opacity: 0; transition: opacity .4s var(--ease), transform .5s var(--ease); white-space: nowrap; }
.gr-ride.is-on { opacity: 1; transform: translate(-50%, 0); }
.gr-ride-k { font: 600 12.5px/1 var(--cond); letter-spacing: .26em; text-transform: uppercase; color: var(--lamp); }
.gr-ride-b { font: 500 clamp(40px, 6vw, 68px)/1.05 var(--cond); letter-spacing: .06em; color: var(--text); margin: 8px 0 6px; font-variant-numeric: tabular-nums; }
.gr-ride-s { font: italic 400 20px/1.3 var(--serif); color: rgba(243,237,226,.9); }

.gr-fade { position: absolute; inset: 0; background: #050403; opacity: 0; transition-property: opacity; transition-timing-function: ease-in-out; }
.gr-lb { position: absolute; left: 0; right: 0; height: 11vh; background: #050403; transition: transform .8s var(--ease); }
.gr-lb.is-top { top: 0; transform: translateY(-101%); }
.gr-lb.is-bot { bottom: 0; transform: translateY(101%); }
.gr-l-letter.is-on .gr-lb { transform: none; }

/* ---------- Dialogue ---------- */
.gr-talk { position: absolute; left: 50%; bottom: var(--edge-b); width: min(980px, calc(100vw - 32px)); display: flex; align-items: stretch; transform: translate(-50%, 14px); opacity: 0; transition: opacity .24s var(--ease), transform .3s var(--ease); pointer-events: none; }
.gr-talk.is-on { opacity: 1; transform: translate(-50%, 0); pointer-events: auto; }
.gr-talk::before { content: ''; position: absolute; left: 28px; top: -1px; width: 44px; height: 1px; background: var(--lamp); opacity: .8; }
.gr-talk-main { position: relative; flex: 1 1 auto; min-width: 0; padding: 22px 30px 28px; min-height: calc(150px * var(--sub)); cursor: pointer; }
.gr-talk-name { display: flex; align-items: center; gap: 11px; min-height: 28px; margin-bottom: 9px; }
.gr-swatch { width: 11px; height: 11px; flex: none; border-radius: 50%; background: var(--lamp); box-shadow: 0 0 0 1px rgba(0,0,0,.5), 0 0 0 3.5px rgba(255,217,160,.16); }
.gr-talk-n { font: italic 600 calc(26px * var(--sub))/1 var(--serif); color: var(--gold); letter-spacing: .005em; }
.gr-talk-text { font: 400 calc(19px * var(--sub))/1.55 var(--sans); color: var(--text); max-width: 64ch; min-height: 3.1em; text-wrap: pretty; }
.gr-talk-text .gr-hid { visibility: hidden; }
.gr-adv { position: absolute; right: 22px; bottom: 16px; display: flex; align-items: center; gap: 8px; color: var(--lamp); opacity: 0; transition: opacity .25s; }
.gr-adv .gr-ico { font-size: 18px; animation: gr-bob 1.6s ease-in-out infinite; }
.gr-adv.is-on { opacity: .9; }
@keyframes gr-bob { 0%, 100% { transform: translateY(-1px) } 50% { transform: translateY(2px) } }
.gr-choices { flex: 0 0 auto; width: 380px; max-width: 46%; border-left: 1px solid var(--line); padding: 16px 0; display: none; flex-direction: column; justify-content: center; gap: 2px; }
.gr-talk.has-choices .gr-choices { display: flex; }
.gr-choices.is-wait .gr-choice { opacity: 0; transform: translateX(8px); pointer-events: none; }
.gr-choice { position: relative; display: grid; grid-template-columns: 26px 1fr auto; column-gap: 10px; align-items: baseline; width: 100%; padding: 10px 22px 11px 18px; transition: background .16s, opacity .3s var(--ease), transform .35s var(--ease); }
.gr-choice::before { content: ''; position: absolute; left: 0; top: 8px; bottom: 8px; width: 2px; background: var(--lamp); transform: scaleY(0); transition: transform .2s var(--ease); }
.gr-choice-n { font: 600 13px/1 var(--cond); color: var(--dim); letter-spacing: .06em; transform: translateY(-1px); }
.gr-choice-l { font: 500 calc(16.5px * var(--sub))/1.35 var(--sans); color: var(--text); }
.gr-choice-s { grid-column: 2 / 4; font: 400 calc(13.5px * var(--sub))/1.35 var(--sans); color: var(--dim); margin-top: 2px; }
.gr-choice-c { font: 600 14px/1 var(--cond); color: var(--ember); letter-spacing: .04em; white-space: nowrap; }
.gr-choice-c small { font-size: 10.5px; letter-spacing: .12em; margin-left: 3px; }
.gr-choice.is-focus { background: rgba(255,217,160,.08); }
.gr-choice.is-focus::before { transform: scaleY(1); }
.gr-choice.is-focus .gr-choice-l { color: var(--gold); }
.gr-choice.is-focus .gr-choice-n { color: var(--lamp); }
.gr-choice.is-off { opacity: .4; cursor: default; }
.gr-choice.is-deny { animation: gr-deny .32s; }
@keyframes gr-deny { 25% { transform: translateX(-4px) } 75% { transform: translateX(4px) } }

/* ---------- Venue menu and hour picker ---------- */
.gr-screen { position: absolute; inset: 0; pointer-events: auto; opacity: 0; transition: opacity .26s var(--ease); display: flex; align-items: center; justify-content: center; padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom)); }
.gr-screen.is-on { opacity: 1; }
.gr-screen.is-scrim { background: radial-gradient(ellipse at 50% 45%, rgba(12,9,6,.42), rgba(8,6,4,.78)); }
@supports ((backdrop-filter: blur(2px)) or (-webkit-backdrop-filter: blur(2px))) {
  .gr-screen.is-scrim { backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); }
}
.gr-rise { transform: translateY(10px); transition: transform .34s var(--ease); }
.gr-screen.is-on .gr-rise { transform: none; }

.gr-menu { position: relative; width: min(540px, 100%); max-height: min(95vh, 820px); display: flex; flex-direction: column; padding-top: 24px; }
.gr-menu::before { content: ''; position: absolute; inset: 6px; border: 1px solid var(--line-3); pointer-events: none; border-radius: 2px; }
.gr-menu-head { text-align: center; padding: 0 40px 10px; }
.gr-menu-title { font: italic 600 clamp(30px, 5vw, 38px)/1.05 var(--serif); color: var(--gold); margin: 8px 0 10px; }
.gr-menu-note { font: italic 400 18px/1.35 var(--serif); color: var(--dim); margin-top: 8px; }
.gr-menu-items { overflow-y: auto; padding: 6px 22px 14px; scrollbar-width: thin; scrollbar-color: rgba(255,217,160,.25) transparent;
  -webkit-mask-image: linear-gradient(#000 calc(100% - 22px), transparent); mask-image: linear-gradient(#000 calc(100% - 22px), transparent); }
.gr-item { position: relative; display: grid; grid-template-columns: 1fr auto; column-gap: 18px; align-items: baseline; width: 100%; padding: 11px 16px 12px; border-top: 1px solid var(--line-3); transition: background .16s; }
.gr-item:first-child { border-top: 0; }
.gr-item::before { content: ''; position: absolute; left: 0; top: 10px; bottom: 10px; width: 2px; background: var(--lamp); transform: scaleY(0); transition: transform .2s var(--ease); }
.gr-item-n { font: 500 17px/1.3 var(--sans); color: var(--text); display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
.gr-tag { font: 600 10.5px/1 var(--cond); letter-spacing: .14em; text-transform: uppercase; color: var(--lamp); border: 1px solid rgba(255,217,160,.4); border-radius: 2px; padding: 3px 5px 2px; }
.gr-item-d { grid-column: 1 / 2; font: 400 14px/1.4 var(--sans); color: var(--dim); margin-top: 3px; }
.gr-item-p { grid-row: 1; grid-column: 2; font: 600 19px/1 var(--cond); color: var(--ember); letter-spacing: .02em; white-space: nowrap; font-variant-numeric: tabular-nums; }
.gr-item-p small { font-size: 11px; letter-spacing: .14em; margin-left: 4px; }
.gr-item-p.is-free { font: italic 400 16px/1 var(--serif); color: var(--lamp); letter-spacing: 0; }
.gr-item-why { grid-column: 1 / 3; font: 600 10.5px/1 var(--cond); letter-spacing: .14em; text-transform: uppercase; color: var(--faint); margin-top: 7px; }
.gr-item.is-focus { background: rgba(255,217,160,.07); }
.gr-item.is-focus::before { transform: scaleY(1); }
.gr-item.is-focus .gr-item-n { color: var(--gold); }
.gr-item.is-off { cursor: default; }
.gr-item.is-off .gr-item-n, .gr-item.is-off .gr-item-d, .gr-item.is-off .gr-item-p { opacity: .4; }
.gr-item.is-deny { animation: gr-deny .32s; }
.gr-menu-foot { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 28px 16px; border-top: 1px solid var(--line); }
.gr-menu-wallet { display: flex; align-items: baseline; gap: 10px; }
.gr-menu-wallet .gr-wallet-n { font-size: 21px; }
.gr-menu-foot-t { font: italic 400 15.5px/1.3 var(--serif); color: var(--dim); text-align: right; flex: 1; }
.gr-hint { display: flex; align-items: center; gap: 7px; font: 600 11px/1 var(--cond); letter-spacing: .14em; text-transform: uppercase; color: var(--faint); white-space: nowrap; }

.gr-hour { width: min(500px, 100%); padding: 28px 32px 24px; text-align: center; }
.gr-hour-big { font: 500 64px/1 var(--cond); letter-spacing: .04em; color: var(--text); margin: 16px 0 4px; font-variant-numeric: tabular-nums; }
.gr-hour-sub { font: italic 400 18px/1.3 var(--serif); color: var(--dim); min-height: 24px; }
.gr-hour-dial { position: relative; margin: 22px 6px 6px; height: 44px; touch-action: none; cursor: pointer; }
.gr-hour-dial:focus-visible .gr-hour-knob { box-shadow: 0 0 0 4px rgba(255,217,160,.25); }
.gr-hour-track { position: absolute; left: 0; right: 0; top: 14px; height: 1px; background: var(--line-2); }
.gr-hour-fill { position: absolute; left: 0; top: 13px; height: 3px; background: var(--lamp); border-radius: 2px; }
.gr-hour-tk { position: absolute; top: 18px; width: 1px; height: 6px; background: rgba(243,237,226,.35); }
.gr-hour-tl { position: absolute; top: 28px; transform: translateX(-50%); font: 600 11px/1 var(--cond); letter-spacing: .08em; color: var(--dim); }
.gr-hour-knob { position: absolute; top: 7px; width: 15px; height: 15px; margin-left: -7.5px; border-radius: 50%; background: var(--lamp); border: 2px solid #14100c; transition: box-shadow .2s; }
.gr-hour-acts { display: flex; justify-content: center; gap: 12px; margin-top: 22px; }

@media (max-width: 720px) {
  .gr-talk { flex-direction: column; bottom: max(10px, env(safe-area-inset-bottom)); width: calc(100vw - 20px); }
  .gr-talk-main { padding: 18px 20px 26px; min-height: calc(132px * var(--sub)); }
  .gr-talk-n { font-size: calc(23px * var(--sub)); }
  .gr-talk-text { font-size: calc(17px * var(--sub)); }
  .gr-choices { width: auto; max-width: none; border-left: 0; border-top: 1px solid var(--line); padding: 8px 0 10px; }
  .gr-choice { padding: 11px 18px 12px 16px; }
  .gr-place { max-width: 56vw; }
  .gr-place-title { font-size: 13px; letter-spacing: .16em; }
  .gr-place-sub { font-size: 12px; }
  .gr-wallet-n { font-size: 23px; }
  .gr-clock-t { font-size: 19px; }
  .gr-status-row { gap: 11px; }
  .gr-compass { width: 76vw; }
  .gr-thread-t { font-size: 13.5px; }
  .gr-dcard { padding: 16px 20px 18px; top: calc(max(16px, env(safe-area-inset-top)) + 122px); }
  .gr-dcard-t { font-size: 25px; }
  .gr-menu-head { padding: 0 26px 14px; }
  .gr-menu-items { padding: 4px 10px 10px; }
  .gr-menu-foot { padding: 12px 20px 16px; flex-wrap: wrap; row-gap: 8px; }
  .gr-menu-foot-t { flex-basis: 100%; order: -1; text-align: center; }
  .gr-menu-foot .gr-btn { margin-left: auto; }
  .gr-item-d, .gr-item-why { grid-column: 1 / 3; }
  .gr-item { padding: 13px 12px 14px; }
  .gr-hour-big { font-size: 52px; }
  .gr-hour { padding: 24px 20px 20px; }
}
@media (max-height: 520px) {
  .gr-menu { padding-top: 14px; }
  .gr-menu-title { font-size: 28px; margin: 4px 0 2px; }
  .gr-menu .gr-orn { display: none; }
  .gr-menu-note { margin-top: 2px; font-size: 16px; }
  .gr-menu-foot { padding: 8px 24px 10px; }
  .gr-item { padding: 8px 14px 9px; }
  .gr-talk-main { min-height: 120px; padding: 16px 24px 22px; }
  .gr-dcard { top: 70px; }
  .gr-hour { padding: 16px 24px; }
  .gr-hour-big { font-size: 44px; margin: 6px 0 2px; }
  .gr-hour-dial { margin-top: 12px; }
}
@media (max-width: 420px), (max-height: 700px) {
  .gr-toast:nth-last-child(n+3) { display: none; }
}
@media (max-width: 420px) {
  .gr-clock-d { display: none; }
  .gr-toasts { bottom: calc(var(--edge-b) + 96px); }
}
`;
