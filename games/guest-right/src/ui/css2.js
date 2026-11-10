// Styles, part two: screens, settings controls, journal, map, photo mode, card home, touch, loading.

export const CSS_SCREENS = `
.gr-talk-main.is-narr .gr-talk-text { font: italic 400 calc(23px * var(--sub))/1.45 var(--serif); color: var(--lamp); }
.gr-talk-main.is-narr { display: flex; flex-direction: column; justify-content: center; }

/* ---------- title and pause ---------- */
.gr-screen.is-title, .gr-screen.is-pause { display: block; padding: 0; }
.gr-ts, .gr-pz { position: absolute; inset: 0; }
.gr-ts { background:
  radial-gradient(ellipse 120% 90% at 70% 45%, rgba(8,6,4,0) 30%, rgba(8,6,4,.5) 75%, rgba(8,6,4,.85) 100%),
  linear-gradient(90deg, rgba(8,6,4,.8) 0%, rgba(8,6,4,.5) 34%, rgba(8,6,4,.12) 56%, rgba(8,6,4,0) 70%); }
.gr-pz { background: linear-gradient(90deg, rgba(8,6,4,.6) 0%, rgba(8,6,4,.25) 50%, rgba(8,6,4,.1) 100%); }
.gr-ts-in { position: absolute; left: max(9vw, 28px); top: 50%; transform: translateY(-50%); max-width: calc(100vw - 56px); text-shadow: var(--halo-big); }
.gr-ts-k { font: 600 13px/1.2 var(--cond); letter-spacing: .3em; text-transform: uppercase; color: var(--lamp); margin-bottom: 14px; padding-left: .2em; }
.gr-ts-t { margin: 0; font: italic 600 clamp(62px, 10vw, 140px)/.92 var(--serif); color: var(--gold); letter-spacing: -.005em; margin-left: -.04em; }
.gr-ts-t.is-small { font-size: clamp(44px, 5vw, 64px); }
.gr-ts-s { font: italic 400 clamp(22px, 2.3vw, 30px)/1.25 var(--serif); color: var(--text); margin-top: 12px; }
.gr-ts-rule { width: 64px; height: 1px; background: var(--lamp); opacity: .7; margin: 34px 0 22px; box-shadow: 0 0 6px rgba(0,0,0,.5); }
.gr-list { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
.gr-li { position: relative; display: flex; align-items: baseline; gap: 14px; padding: 9px 0 9px 0; font: 600 18px/1 var(--cond); letter-spacing: .22em; text-transform: uppercase; color: rgba(243,237,226,.8); transition: color .2s, transform .28s var(--ease); text-shadow: var(--halo); pointer-events: auto; }
.gr-li::before { content: ''; position: absolute; left: -30px; top: 50%; width: 18px; height: 1px; background: var(--lamp); transform: scaleX(0); transform-origin: right; transition: transform .28s var(--ease); }
.gr-li.is-focus { color: var(--gold); transform: translateX(10px); }
.gr-li.is-focus::before { transform: scaleX(1); }
.gr-li-s { font: italic 400 17px/1 var(--serif); letter-spacing: 0; text-transform: none; color: rgba(243,237,226,.7); }
.gr-ts-foot { position: absolute; left: max(9vw, 28px); bottom: max(28px, env(safe-area-inset-bottom)); display: flex; align-items: center; gap: 9px; font: 600 11.5px/1 var(--cond); letter-spacing: .2em; text-transform: uppercase; color: rgba(243,237,226,.62); text-shadow: var(--halo); }
.gr-ts-foot .gr-ico { font-size: 15px; }
.gr-pause-w { display: flex; align-items: baseline; gap: 10px; margin-top: 34px; }
.gr-pause-w .gr-wallet-n { font-size: 20px; }
.gr-pause-side { position: absolute; right: max(7vw, 28px); bottom: max(9vh, 28px); width: min(340px, 30vw); padding-left: 18px; border-left: 1px solid var(--line-2); text-shadow: var(--halo); }
.gr-pause-st { font: italic 600 24px/1.15 var(--serif); color: var(--gold); margin: 8px 0 6px; }
.gr-pause-sx { font: 400 14.5px/1.5 var(--sans); color: rgba(243,237,226,.86); }

/* ---------- sheets ---------- */
.gr-sheet { position: relative; width: min(760px, 100%); max-height: min(88vh, 860px); display: flex; flex-direction: column; }
.gr-sheet.is-wide { width: min(980px, 100%); }
.gr-sheet-head, .gr-book-head { display: flex; align-items: center; gap: 18px; padding: 22px 18px 18px 32px; border-bottom: 1px solid var(--line); }
.gr-sheet-ht, .gr-book-ht { flex: 1; min-width: 0; }
.gr-sheet-title { font: italic 600 28px/1.1 var(--serif); color: var(--gold); margin-top: 6px; }
.gr-sheet-hx { display: flex; align-items: center; gap: 6px; flex: none; }
.gr-esc { opacity: .7; }
.gr-sheet-body { overflow-y: auto; padding: 10px 32px 28px; scrollbar-width: thin; scrollbar-color: rgba(255,217,160,.25) transparent; }
.gr-sec { display: flex; align-items: center; gap: 14px; margin: 22px 0 6px; }
.gr-sec::after { content: ''; flex: 1; height: 1px; background: var(--line-3); }
.gr-sec .gr-kicker { color: var(--lamp); }
.gr-srow { display: grid; grid-template-columns: minmax(0, 1fr) minmax(200px, 300px); align-items: center; gap: 24px; padding: 11px 0; border-bottom: 1px solid var(--line-3); }
.gr-srow:last-child { border-bottom: 0; }
.gr-srow-n { font: 500 16px/1.3 var(--sans); color: var(--text); }
.gr-srow-h { font: 400 13px/1.35 var(--sans); color: var(--dim); margin-top: 2px; }
.gr-srow-c { display: flex; justify-content: flex-end; }
.gr-srow:focus-within .gr-srow-n { color: var(--gold); }
.gr-empty { font: italic 400 18px/1.4 var(--serif); color: var(--dim); padding: 22px 4px; }
.gr-empty.is-page { padding: 40px 10px; text-align: center; max-width: 420px; margin: 0 auto; }

/* slider, segmented, toggle */
.gr-sl-wrap { display: flex; align-items: center; gap: 14px; width: 100%; }
.gr-sl { position: relative; flex: 1; height: 28px; cursor: pointer; touch-action: none; border-radius: 3px; }
.gr-sl-track { position: absolute; left: 0; right: 0; top: 13.5px; height: 1px; background: var(--line-2); }
.gr-sl-fill { position: absolute; left: 0; top: 12.5px; height: 3px; background: var(--lamp); border-radius: 2px; opacity: .85; }
.gr-sl-knob { position: absolute; top: 7px; width: 14px; height: 14px; margin-left: -7px; border-radius: 50%; background: var(--lamp); border: 2px solid #14100c; box-shadow: 0 0 0 1px rgba(255,217,160,.4); transition: box-shadow .18s, transform .18s; }
.gr-sl:hover .gr-sl-knob, .gr-sl:focus-visible .gr-sl-knob, .gr-sl.is-drag .gr-sl-knob, .gr-sl:focus .gr-sl-knob { box-shadow: 0 0 0 5px rgba(255,217,160,.18); }
.gr-sl:focus .gr-sl-fill { opacity: 1; }
.gr-sl-val { flex: none; min-width: 52px; text-align: right; font: 600 14px/1 var(--cond); letter-spacing: .06em; color: var(--text); font-variant-numeric: tabular-nums; }
.gr-seg { display: inline-flex; border: 1px solid var(--line-2); border-radius: 2px; padding: 2px; gap: 2px; }
.gr-seg-b { padding: 7px 12px 6px; font: 600 12.5px/1 var(--cond); letter-spacing: .12em; text-transform: uppercase; color: var(--dim); border-radius: 1px; transition: color .16s, background .16s; white-space: nowrap; }
.gr-seg-b:hover { color: var(--text); }
.gr-seg-b.is-on { background: rgba(255,217,160,.16); color: var(--gold); }
.gr-seg:focus-visible, .gr-seg:focus { border-color: var(--lamp); box-shadow: 0 0 0 3px rgba(255,217,160,.12); }
.gr-tog-wrap { display: flex; align-items: center; gap: 12px; }
.gr-tog-t { font: 600 12px/1 var(--cond); letter-spacing: .14em; text-transform: uppercase; color: var(--dim); min-width: 24px; text-align: right; }
.gr-tog { position: relative; width: 42px; height: 22px; border-radius: 11px; border: 1px solid var(--line-2); transition: background .2s, border-color .2s; }
.gr-tog-k { position: absolute; left: 3px; top: 3px; width: 14px; height: 14px; border-radius: 50%; background: var(--dim); transition: transform .24s var(--ease), background .2s; }
.gr-tog.is-on { background: rgba(255,217,160,.18); border-color: rgba(255,217,160,.6); }
.gr-tog.is-on .gr-tog-k { transform: translateX(20px); background: var(--lamp); }
.gr-tog:focus-visible, .gr-tog:focus { box-shadow: 0 0 0 3px rgba(255,217,160,.16); border-color: var(--lamp); }

/* help, chapters, confirm */
.gr-help { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); gap: 40px; }
.gr-help-grid { display: flex; flex-direction: column; }
.gr-help-k { display: grid; grid-template-columns: 150px 1fr; align-items: center; gap: 14px; padding: 8px 0; border-bottom: 1px solid var(--line-3); }
.gr-help-keys { display: flex; gap: 4px; flex-wrap: wrap; }
.gr-help-t { font: 400 15px/1.3 var(--sans); color: var(--text); }
.gr-help-n { padding: 10px 0 12px; border-bottom: 1px solid var(--line-3); }
.gr-help-nt { font: italic 600 20px/1.2 var(--serif); color: var(--gold); }
.gr-help-nx { font: 400 14.5px/1.5 var(--sans); color: rgba(243,237,226,.88); margin-top: 3px; }
.gr-chap { display: grid; grid-template-columns: 54px 1fr auto; align-items: center; gap: 12px; width: 100%; padding: 14px 10px 14px 4px; border-bottom: 1px solid var(--line-3); transition: background .16s; }
.gr-chap:hover, .gr-chap:focus { background: rgba(255,217,160,.06); }
.gr-chap-n { font: italic 600 26px/1 var(--serif); color: var(--lamp); text-align: center; }
.gr-chap-b { display: flex; flex-direction: column; gap: 4px; }
.gr-chap-t { font: italic 600 22px/1.15 var(--serif); color: var(--gold); }
.gr-chap-s { font: 400 14px/1.35 var(--sans); color: var(--dim); }
.gr-chap-go { color: var(--dim); font-size: 18px; }
.gr-chap:focus .gr-chap-go { color: var(--lamp); }
.gr-chap.is-off { opacity: .4; }
.gr-confirm { width: min(460px, 100%); padding: 28px 30px 24px; text-align: center; }

/* credits */
.gr-screen.is-credits { background: #0b0806; display: block; padding: 0; }
.gr-credits { position: absolute; inset: 0; cursor: pointer; }
.gr-roll-win { position: absolute; inset: 0; overflow: hidden; -webkit-mask-image: linear-gradient(transparent, #000 18%, #000 82%, transparent); mask-image: linear-gradient(transparent, #000 18%, #000 82%, transparent); }
.gr-roll { position: absolute; left: 0; right: 0; top: 0; text-align: center; padding: 0 24px; will-change: transform; }
.gr-roll-title { font: italic 600 clamp(48px, 7vw, 80px)/1 var(--serif); color: var(--gold); margin-bottom: 10px; }
.gr-roll-h { font: 600 12.5px/1 var(--cond); letter-spacing: .28em; text-transform: uppercase; color: var(--lamp); margin: 34px 0 12px; }
.gr-roll-l { font: italic 400 21px/1.5 var(--serif); color: var(--text); }
.gr-roll-pair { display: flex; justify-content: center; gap: 18px; font: 400 16px/1.8 var(--sans); }
.gr-roll-r { flex: 1; text-align: right; color: var(--dim); }
.gr-roll-nm { flex: 1; text-align: left; color: var(--text); }
.gr-roll-gap { height: 14px; }
.gr-roll-end { padding: 60px 0 20px; }
.gr-roll-skip { position: absolute; right: 28px; bottom: max(24px, env(safe-area-inset-bottom)); display: flex; align-items: center; gap: 8px; font: 600 11.5px/1 var(--cond); letter-spacing: .16em; text-transform: uppercase; color: var(--faint); }

/* loading */
.gr-load { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(ellipse 70% 55% at 50% 46%, #2a1c12 0%, #120c08 60%, #0a0705 100%); opacity: 0; transition: opacity .6s var(--ease); pointer-events: none; }
.gr-load.is-on { opacity: 1; }
.gr-load-c { display: flex; flex-direction: column; align-items: center; transform: translateY(-4vh); }
.gr-load-t { font: italic 600 40px/1 var(--serif); color: var(--gold); }
.gr-load-bar { width: min(240px, 60vw); height: 1px; margin: 26px 0 14px; background: rgba(255,217,160,.16); overflow: hidden; }
.gr-load-fill { width: 100%; height: 100%; background: var(--lamp); transform-origin: left; transform: scaleX(0); transition: transform .35s var(--ease); box-shadow: 0 0 8px rgba(255,217,160,.6); }
.gr-load-l { font: 600 11.5px/1 var(--cond); letter-spacing: .24em; text-transform: uppercase; color: var(--dim); min-height: 12px; }
.gr-load-tip { position: absolute; left: 50%; bottom: max(11vh, 40px); transform: translate(-50%, 4px); width: min(560px, calc(100vw - 48px)); text-align: center; font: italic 400 20px/1.45 var(--serif); color: rgba(243,237,226,.78); opacity: 0; transition: opacity .38s, transform .5s var(--ease); text-wrap: balance; }
.gr-load-tip.is-on { opacity: 1; transform: translate(-50%, 0); }

/* ---------- journal ---------- */
.gr-book { position: relative; width: min(1140px, 100%); height: min(760px, calc(100vh - 32px)); display: flex; flex-direction: column; }
.gr-tabs { display: flex; gap: 2px; flex-wrap: nowrap; }
.gr-tab { position: relative; display: flex; align-items: baseline; gap: 7px; padding: 10px 12px 11px; font: 600 13px/1 var(--cond); letter-spacing: .16em; text-transform: uppercase; color: var(--dim); transition: color .16s; white-space: nowrap; }
.gr-tab::after { content: ''; position: absolute; left: 12px; right: 12px; bottom: 0; height: 1px; background: var(--lamp); transform: scaleX(0); transition: transform .25s var(--ease); }
.gr-tab:hover { color: var(--text); }
.gr-tab.is-on { color: var(--gold); }
.gr-tab.is-on::after { transform: scaleX(1); }
.gr-tab-n { font-size: 10.5px; color: var(--faint); letter-spacing: .06em; }
.gr-tab-c { font-size: 11.5px; color: var(--faint); letter-spacing: .06em; }
.gr-tab.is-on .gr-tab-c { color: var(--lamp); }
.gr-book-body { position: relative; flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(260px, 36%) 1px minmax(0, 1fr); }
.gr-gutter { background: linear-gradient(transparent, var(--line-2) 12%, var(--line-2) 88%, transparent); box-shadow: 0 0 24px 8px rgba(0,0,0,.18); }
.gr-jlist { overflow-y: auto; padding: 14px 14px 20px; scrollbar-width: thin; scrollbar-color: rgba(255,217,160,.2) transparent; }
.gr-jrow { display: flex; align-items: flex-start; gap: 12px; width: 100%; padding: 11px 12px 12px; border-radius: 2px; transition: background .15s; position: relative; }
.gr-jrow::before { content: ''; position: absolute; left: 0; top: 9px; bottom: 9px; width: 2px; background: var(--lamp); transform: scaleY(0); transition: transform .2s var(--ease); }
.gr-jrow:hover { background: rgba(255,217,160,.05); }
.gr-jrow.is-sel { background: rgba(255,217,160,.08); }
.gr-jrow.is-sel::before { transform: scaleY(1); }
.gr-jrow-i { font-size: 16px; color: var(--lamp); margin-top: 2px; }
.gr-jrow.is-done .gr-jrow-i, .gr-jrow.is-found .gr-jrow-i { color: var(--leaf); }
.gr-jrow.is-unfound .gr-jrow-i { color: var(--faint); }
.gr-jrow-b { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.gr-jrow-t { font: 500 15.5px/1.3 var(--sans); color: var(--text); }
.gr-jrow.is-sel .gr-jrow-t { color: var(--gold); }
.gr-jrow.is-done .gr-jrow-t { color: var(--dim); }
.gr-jrow.is-unfound .gr-jrow-t, .gr-jrow.is-unmet .gr-jrow-t { font: italic 400 17px/1.25 var(--serif); color: var(--dim); }
.gr-jrow-s { font: 400 13px/1.35 var(--sans); color: var(--dim); }
.gr-jrow.is-unfound .gr-jrow-s { color: var(--faint); font-style: italic; }
.gr-jsw { width: 12px; height: 12px; border-radius: 50%; flex: none; margin-top: 4px; box-shadow: 0 0 0 1px rgba(0,0,0,.4), 0 0 0 3px rgba(255,217,160,.12); }
.gr-jrow.is-unmet .gr-jsw { box-shadow: inset 0 0 0 1px var(--faint); }
.gr-jpage-w { position: relative; min-width: 0; overflow: hidden; display: flex; flex-direction: column; }
.gr-jpage { flex: 1; overflow-y: auto; padding: 38px 56px 40px; scrollbar-width: thin; scrollbar-color: rgba(255,217,160,.2) transparent; }
.gr-jback { display: none; }
.gr-kicker.is-leaf { color: var(--leaf); }
.gr-kicker.is-lamp { color: var(--lamp); }
.gr-jp-t { font: italic 600 clamp(30px, 3.4vw, 40px)/1.1 var(--serif); color: var(--gold); margin: 10px 0 16px; text-wrap: balance; }
.gr-jp-t.is-dim { color: var(--dim); }
.gr-jp-x { font: 400 16.5px/1.65 var(--sans); color: rgba(243,237,226,.92); max-width: 58ch; text-wrap: pretty; }
.gr-jp-x.is-drop::first-letter { float: left; font: italic 600 58px/.8 var(--serif); color: var(--lamp); padding: 6px 10px 0 0; }
.gr-jp-where { display: inline-flex; align-items: center; gap: 7px; margin: -4px 0 18px; font: 600 12px/1 var(--cond); letter-spacing: .14em; text-transform: uppercase; color: var(--teal); }
.gr-jp-where .gr-ico { font-size: 14px; }
.gr-jp-hint { font: italic 400 21px/1.45 var(--serif); color: var(--dim); max-width: 44ch; }
.gr-steps { margin-top: 26px; display: flex; flex-direction: column; border-top: 1px solid var(--line-3); }
.gr-step { display: flex; align-items: flex-start; gap: 12px; padding: 11px 0; border-bottom: 1px solid var(--line-3); font: 400 15.5px/1.4 var(--sans); color: var(--text); }
.gr-step .gr-icowrap { font-size: 17px; color: var(--lamp); margin-top: 1px; }
.gr-step.is-done { color: var(--dim); }
.gr-step.is-done .gr-icowrap { color: var(--leaf); }
.gr-jp-person { display: flex; align-items: center; gap: 20px; margin-bottom: 18px; }
.gr-jp-person .gr-jp-t { margin: 0 0 6px; }
.gr-jp-av { --c: #6b5a48; width: 68px; height: 68px; border-radius: 50%; flex: none; display: grid; place-items: center; font: italic 600 34px/1 var(--serif); color: #fff6e6; background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--c) 70%, white), var(--c) 70%); box-shadow: 0 0 0 1px rgba(0,0,0,.4), 0 0 0 5px rgba(255,217,160,.1); text-shadow: 0 1px 3px rgba(0,0,0,.5); }
.gr-jp-av.is-unmet { background: transparent; color: var(--faint); box-shadow: inset 0 0 0 1px var(--faint); }
.gr-jcards { display: none; }
.gr-book-body.is-cards { display: block; }
.gr-book-body.is-cards > .gr-jlist, .gr-book-body.is-cards > .gr-gutter, .gr-book-body.is-cards > .gr-jpage-w { display: none; }
.gr-book-body.is-cards .gr-jcards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 30px 26px; padding: 32px 36px 40px; overflow-y: auto; height: 100%; align-content: start; }
.gr-pcard { display: flex; flex-direction: column; padding: 9px 9px 12px; background: var(--paper); border-radius: 1px; transform: rotate(var(--r, 0deg)); box-shadow: 0 10px 26px rgba(0,0,0,.42), 0 1px 3px rgba(0,0,0,.3); transition: transform .3s var(--ease), box-shadow .3s; }
.gr-pcard:hover, .gr-pcard:focus { transform: rotate(0deg) translateY(-4px); box-shadow: 0 16px 36px rgba(0,0,0,.5), 0 0 0 2px var(--lamp); }
.gr-pcard-img { display: block; aspect-ratio: 3 / 2; overflow: hidden; background: #2a2018; }
.gr-pcard-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.gr-pcard-c { font: 500 19px/1.1 var(--hand); color: #3a3a5c; margin-top: 9px; text-align: left; padding: 0 3px; min-height: 21px; }
.gr-jview { position: absolute; inset: 0; z-index: 3; display: grid; place-items: center; padding: 30px; background: rgba(10,8,6,.86); cursor: zoom-out; }
.gr-jview-c { width: min(760px, 100%); padding: 14px 14px 18px; background: var(--paper); box-shadow: 0 24px 60px rgba(0,0,0,.6); }
.gr-jview-c .gr-pcard-c { font-size: 25px; }

/* ---------- map ---------- */
.gr-book.is-map { width: min(1180px, 100%); }
.gr-map-seg { flex: none; }
.gr-map-body { position: relative; flex: 1; min-height: 0; }
.gr-planwrap, .gr-drumwrap { position: absolute; inset: 0; }
.gr-map-body.is-drum .gr-planwrap, .gr-map-body:not(.is-drum) .gr-drumwrap { display: none; }
.gr-planhost { position: absolute; inset: 0; cursor: grab; touch-action: none; overflow: hidden; background: radial-gradient(ellipse at 50% 50%, rgba(255,217,160,.035), transparent 70%); }
.gr-planhost.is-drag { cursor: grabbing; }
.gr-plan { width: 100%; height: 100%; display: block; }
.gr-plan path { fill: none; stroke-linecap: round; stroke-linejoin: round; }
.gr-plan .k-wall { stroke: rgba(243,237,226,.85); stroke-width: 1.6px; }
.gr-plan .k-edge, .gr-plan .k-street { stroke: rgba(169,159,144,.55); stroke-width: 1px; }
.gr-plan .k-rail { stroke: rgba(169,159,144,.55); stroke-width: 1px; stroke-dasharray: 4 4; }
.gr-plan .k-furniture { stroke: rgba(169,159,144,.45); stroke-width: 1px; }
.gr-plan .k-water { stroke: #7aa6bd; stroke-width: 1.4px; stroke-opacity: .7; }
.gr-plan .k-green { stroke: rgba(143,214,148,.45); stroke-width: 1.2px; }
.gr-plan .k-door { stroke: var(--lamp); stroke-width: 2px; }
.gr-plan .p-lab { font-family: var(--cond); font-weight: 600; letter-spacing: .14em; text-transform: uppercase; fill: rgba(243,237,226,.78); text-anchor: middle; dominant-baseline: middle; paint-order: stroke; stroke: rgba(20,16,12,.9); stroke-width: .25em; }
.gr-plan .p-lab.is-big { fill: var(--lamp); }
.gr-plan .p-mark .p-glyph { fill: rgba(20,16,12,.7); stroke: var(--text); stroke-width: 1.5px; }
.gr-plan .p-mark.is-thread .p-glyph { fill: var(--lamp); stroke: #14100c; }
.gr-plan .p-mark.is-person .p-glyph { fill: var(--text); stroke: #14100c; }
.gr-plan .p-mlab { font: 600 11px var(--cond); letter-spacing: .14em; text-transform: uppercase; fill: var(--text); paint-order: stroke; stroke: rgba(20,16,12,.9); stroke-width: 3px; }
.gr-plan .p-mark.is-thread .p-mlab { fill: var(--lamp); }
.gr-plan .p-arrow { fill: var(--lamp); stroke: #14100c; stroke-width: 1.5px; stroke-linejoin: round; }
.gr-plan .p-you .you-r { fill: rgba(20,16,12,.55); stroke: var(--lamp); stroke-width: 1px; }
.you-p { fill: none; stroke: var(--lamp); stroke-width: 1.2px; animation: gr-you 2.4s ease-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes gr-you { 0% { opacity: .9; transform: scale(.6) } 100% { opacity: 0; transform: scale(1.7) } }
.you-r { fill: none; stroke: var(--lamp); stroke-width: 1.2px; }
.you-d { fill: var(--lamp); }
.gr-mtools { position: absolute; right: 18px; top: 18px; display: flex; flex-direction: column; gap: 6px; }
.gr-mtool { width: 38px; height: 38px; display: grid; place-items: center; font-size: 18px; color: var(--text); background: rgba(20,16,12,.7); border: 1px solid var(--line-2); border-radius: 2px; transition: color .16s, border-color .16s; }
.gr-mtool:hover, .gr-mtool:focus-visible { color: var(--gold); border-color: var(--lamp); }
.gr-scale { position: absolute; left: 24px; bottom: 22px; display: flex; align-items: center; gap: 10px; pointer-events: none; }
.gr-scale-b { height: 6px; border: 1px solid rgba(243,237,226,.7); border-top: 0; }
.gr-scale-t { font: 600 11.5px/1 var(--cond); letter-spacing: .12em; color: var(--text); }
.gr-legend { position: absolute; right: 22px; bottom: 20px; display: flex; gap: 18px; pointer-events: none; }
.gr-lg { display: flex; align-items: center; gap: 7px; font: 600 11px/1 var(--cond); letter-spacing: .14em; text-transform: uppercase; color: var(--dim); }
.gr-lg .gr-icowrap { font-size: 14px; color: var(--lamp); }
.gr-lg i { width: 9px; height: 9px; display: block; }
.gr-lg.is-thread i { background: var(--lamp); transform: rotate(45deg) scale(.85); }
.gr-lg.is-place i { border: 1.5px solid var(--text); border-radius: 50%; }
.gr-drumwrap { display: grid; grid-template-columns: minmax(0, 1fr) 300px; }
.gr-drumhost { position: relative; min-width: 0; min-height: 0; padding: 18px 10px 18px 20px; }
.gr-drum { width: 100%; height: 100%; display: block; }
.gr-drum rect, .gr-drum path, .gr-drum line, .gr-drum circle { vector-effect: non-scaling-stroke; }
.gr-drum .b-keel { fill: rgba(255,217,160,.26); }
.gr-drum .b-low { fill: rgba(255,217,160,.14); }
.gr-drum .b-mid { fill: rgba(255,217,160,.085); }
.gr-drum .b-high { fill: rgba(255,217,160,.045); }
.gr-drum .b-edge { stroke: rgba(255,217,160,.3); stroke-width: 1px; }
.gr-drum .b-out { fill: none; stroke: rgba(243,237,226,.7); stroke-width: 1.4px; }
.gr-drum .b-terr { fill: rgba(255,217,160,.1); stroke: rgba(255,217,160,.45); stroke-width: 1px; }
.gr-drum .b-spin { fill: rgba(255,217,160,.04); stroke: rgba(255,217,160,.2); stroke-dasharray: 3 3; stroke-width: 1px; }
.gr-drum .b-fly { fill: none; stroke: rgba(243,237,226,.5); stroke-width: 1px; }
.gr-drum .b-sun { stroke: var(--gold); stroke-width: 2px; }
.gr-drum .b-sun-g { stroke: rgba(255,217,160,.25); stroke-width: 9px; }
.gr-drum .b-lake { stroke: #7aa6bd; stroke-width: 2px; stroke-opacity: .7; }
.gr-drum .b-ring { fill: var(--text); fill-opacity: .7; }
.gr-drum .b-lead { stroke: rgba(169,159,144,.6); stroke-width: 1px; }
.gr-drum .b-lead.is-you { stroke: var(--lamp); stroke-dasharray: 2 3; }
.gr-drum text { font-family: var(--cond); font-weight: 600; text-transform: uppercase; }
.gr-drum .t-band { font-size: 15px; letter-spacing: .16em; fill: var(--text); text-anchor: end; }
.gr-drum .t-bsub { font-family: var(--sans); font-weight: 400; text-transform: none; font-size: 12.5px; fill: var(--dim); text-anchor: end; }
.gr-drum .t-ring { font-size: 13px; letter-spacing: .06em; fill: var(--dim); text-anchor: middle; }
.gr-drum .t-cap, .gr-endv .t-cap { font-size: 12px; letter-spacing: .2em; fill: var(--dim); text-anchor: middle; }
.gr-drum .t-cap.is-unit { text-transform: none; letter-spacing: .08em; }
.gr-drum .t-end { font-size: 13px; letter-spacing: .2em; fill: var(--lamp); }
.gr-drum .t-end.is-r { text-anchor: end; }
.gr-drum .t-terr { font-size: 11px; letter-spacing: .18em; fill: rgba(255,217,160,.8); }
.gr-drum .t-terr.is-r { text-anchor: end; }
.gr-drum .t-far { font-family: var(--serif); font-style: italic; font-weight: 400; text-transform: none; font-size: 17px; fill: var(--dim); text-anchor: middle; }
.gr-drum .t-you { font-size: 15px; letter-spacing: .2em; fill: var(--lamp); }
.gr-drumside { border-left: 1px solid var(--line-3); padding: 28px 28px 24px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
.gr-mfacts-t { font: italic 600 32px/1.1 var(--serif); color: var(--gold); margin: 8px 0 8px; }
.gr-mfacts-l { font: 400 14.5px/1.55 var(--sans); color: rgba(243,237,226,.9); }
.gr-endhost { width: 100%; max-width: 240px; align-self: center; }
.gr-endv { width: 100%; display: block; overflow: visible; }
.gr-endv circle, .gr-endv path, .gr-endv line { vector-effect: non-scaling-stroke; }
.gr-endv text { font-family: var(--cond); font-weight: 600; text-transform: uppercase; }
.gr-endv .e-rim { fill: rgba(255,217,160,.08); stroke: rgba(243,237,226,.7); stroke-width: 1.4px; }
.gr-endv .e-band { fill: none; stroke: rgba(255,217,160,.25); stroke-width: 1px; }
.gr-endv .e-hollow { fill: #14100c; stroke: rgba(255,217,160,.45); stroke-width: 1px; }
.gr-endv .e-sun { fill: var(--gold); }
.gr-endv .e-spin, .gr-endv .e-spin-h { fill: none; stroke: var(--dim); stroke-width: 1.2px; }
.gr-endv .e-ray { stroke: var(--lamp); stroke-dasharray: 2 3; stroke-width: 1px; }
.gr-mnote { font: italic 400 17px/1.4 var(--serif); color: var(--dim); margin-top: auto; }

/* ---------- photo mode ---------- */
.gr-photo { position: absolute; inset: 0; opacity: 0; visibility: hidden; transition: opacity .3s, visibility 0s .3s; }
.gr-photo.is-on { opacity: 1; visibility: visible; transition: opacity .3s; }
.gr-pf { position: absolute; inset: max(22px, 3vh) max(22px, 2.4vw); pointer-events: none; }
.gr-pf i { position: absolute; display: block; filter: drop-shadow(0 0 1.5px rgba(0,0,0,.7)); }
.gr-pf-c { width: 26px; height: 26px; border: 0 solid rgba(255,250,240,.85); }
.gr-pf-c.is-tl { left: 0; top: 0; border-left-width: 1.5px; border-top-width: 1.5px; }
.gr-pf-c.is-tr { right: 0; top: 0; border-right-width: 1.5px; border-top-width: 1.5px; }
.gr-pf-c.is-bl { left: 0; bottom: 0; border-left-width: 1.5px; border-bottom-width: 1.5px; }
.gr-pf-c.is-br { right: 0; bottom: 0; border-right-width: 1.5px; border-bottom-width: 1.5px; }
.gr-pf-t { background: rgba(255,250,240,.6); }
.gr-pf-t.is-t1, .gr-pf-t.is-t2, .gr-pf-t.is-b1, .gr-pf-t.is-b2 { width: 1px; height: 10px; }
.gr-pf-t.is-l1, .gr-pf-t.is-l2, .gr-pf-t.is-r1, .gr-pf-t.is-r2 { height: 1px; width: 10px; }
.gr-pf-t.is-t1, .gr-pf-t.is-b1 { left: 33.333%; } .gr-pf-t.is-t2, .gr-pf-t.is-b2 { left: 66.667%; }
.gr-pf-t.is-t1, .gr-pf-t.is-t2 { top: 0; } .gr-pf-t.is-b1, .gr-pf-t.is-b2 { bottom: 0; }
.gr-pf-t.is-l1, .gr-pf-t.is-r1 { top: 33.333%; } .gr-pf-t.is-l2, .gr-pf-t.is-r2 { top: 66.667%; }
.gr-pf-t.is-l1, .gr-pf-t.is-l2 { left: 0; } .gr-pf-t.is-r1, .gr-pf-t.is-r2 { right: 0; }
.gr-pf-x { width: 9px; height: 9px; margin: -4.5px 0 0 -4.5px; opacity: .55; }
.gr-pf-x::before, .gr-pf-x::after { content: ''; position: absolute; background: rgba(255,250,240,.9); }
.gr-pf-x::before { left: 4px; top: 0; width: 1px; height: 9px; }
.gr-pf-x::after { top: 4px; left: 0; height: 1px; width: 9px; }
.gr-pf-x.is-1 { left: 33.333%; top: 33.333%; } .gr-pf-x.is-2 { left: 66.667%; top: 33.333%; }
.gr-pf-x.is-3 { left: 33.333%; top: 66.667%; } .gr-pf-x.is-4 { left: 66.667%; top: 66.667%; }
.gr-ptop { position: absolute; left: calc(max(22px, 2.4vw) + 36px); right: calc(max(22px, 2.4vw) + 36px); top: calc(max(22px, 3vh) + 4px); display: flex; align-items: center; justify-content: space-between; gap: 16px; text-shadow: var(--halo); transition: opacity .3s; }
.gr-ptop-l { display: flex; align-items: center; gap: 10px; color: var(--lamp); white-space: nowrap; min-width: 0; }
.gr-ptop-r { white-space: nowrap; }
@media (max-width: 430px) { .gr-ptop-l .gr-kicker { display: none; } }
.gr-ptop-l .gr-icowrap { font-size: 18px; filter: drop-shadow(0 0 2px rgba(0,0,0,.8)); }
.gr-ptop-l .gr-kicker { color: var(--text); }
.gr-pcount { font: italic 400 16px/1 var(--serif); color: var(--lamp); }
.gr-ptop-r { display: flex; align-items: center; gap: 4px; pointer-events: auto; }
.gr-ptop-r .gr-btn { height: 32px; padding: 0 10px; color: var(--text); text-shadow: var(--halo); }
.gr-ptop-r .gr-hint { color: rgba(243,237,226,.8); margin-right: 8px; }
.gr-pctl { position: absolute; left: 50%; bottom: calc(max(22px, 3vh) + 22px); transform: translateX(-50%); display: flex; align-items: flex-end; gap: 26px; padding: 14px 18px 14px 24px; pointer-events: auto; transition: opacity .3s, transform .35s var(--ease); width: min(760px, calc(100vw - 48px)); }
.gr-pslot { flex: 1; min-width: 0; }
.gr-pslot-h { display: flex; align-items: center; gap: 7px; color: var(--lamp); margin-bottom: 3px; }
.gr-pslot-h .gr-icowrap { font-size: 14px; }
.gr-pslot .gr-sl-val { min-width: 46px; font-size: 13px; }
.gr-pctl-s { flex: none; padding-left: 6px; border-left: 1px solid var(--line); padding-left: 20px; }
.gr-shutter { width: 58px; height: 58px; border-radius: 50%; border: 1.5px solid var(--lamp); display: grid; place-items: center; transition: transform .15s, box-shadow .2s; }
.gr-shutter-i { width: 44px; height: 44px; border-radius: 50%; background: var(--text); transition: transform .15s, background .15s; }
.gr-shutter:hover .gr-shutter-i, .gr-shutter:focus .gr-shutter-i { background: var(--gold); }
.gr-shutter:focus { box-shadow: 0 0 0 4px rgba(255,217,160,.2); }
.gr-shutter.is-press .gr-shutter-i { transform: scale(.82); }
.gr-photo.is-bare .gr-pctl, .gr-photo.is-bare .gr-ptop { opacity: 0; pointer-events: none; }
.gr-photo.is-bare .gr-pctl { transform: translate(-50%, 12px); }
.gr-phint { position: absolute; left: 50%; bottom: calc(max(22px, 3vh) + 10px); transform: translateX(-50%); display: flex; align-items: center; gap: 8px; font: 600 11px/1 var(--cond); letter-spacing: .16em; text-transform: uppercase; color: rgba(243,237,226,.75); text-shadow: var(--halo); opacity: 0; transition: opacity .3s; }
.gr-photo.is-bare .gr-phint { opacity: 1; }
.gr-pflash { position: absolute; inset: 0; background: #fffaf0; opacity: 0; pointer-events: none; }
.gr-pflash.is-on { animation: gr-flash .45s ease-out; }
@keyframes gr-flash { 0% { opacity: .85 } 100% { opacity: 0 } }
.gr-pthumbs { position: absolute; inset: 0; pointer-events: none; }
.gr-pthumb { position: absolute; left: 50%; top: 50%; width: min(56vw, 640px); padding: 8px 8px 22px; background: var(--paper); box-shadow: 0 20px 50px rgba(0,0,0,.5); transform: translate(-50%, -50%) rotate(0deg); transition: left .75s var(--ease), top .75s var(--ease), width .75s var(--ease), transform .75s var(--ease), opacity .45s; }
.gr-pthumb img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; background: #2a2018; }
.gr-pthumb.is-docked { left: calc(max(22px, 2.4vw) + 26px); top: calc(100% - max(22px, 3vh) - 26px); width: 168px; padding: 5px 5px 14px; transform: translate(0, -100%) rotate(-3deg); }
.gr-pthumb.is-out { opacity: 0; }

/* ---------- card home ---------- */
.gr-screen.is-card { background: radial-gradient(ellipse at 50% 40%, rgba(16,12,8,.72), rgba(6,5,3,.94)); overflow-y: auto; align-items: flex-start; }
.gr-ch { width: min(820px, 100%); margin: auto; display: flex; flex-direction: column; align-items: center; padding: 8px 0 12px; }
.gr-ch-head { text-align: center; margin-bottom: 22px; text-shadow: var(--halo); }
.gr-ch-head .gr-kicker { color: var(--lamp); }
.gr-ch-title { font: italic 600 clamp(36px, 5vw, 52px)/1 var(--serif); color: var(--gold); margin: 8px 0 8px; }
.gr-ch-sub { font: italic 400 18px/1.35 var(--serif); color: var(--dim); }
.gr-pc { width: min(760px, 100%, calc((100vh - 350px) * 1.5)); min-width: 280px; aspect-ratio: 3 / 2; perspective: 1800px; cursor: pointer; }
.gr-pc-in { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; transition: transform .8s cubic-bezier(.4,.1,.2,1); }
.gr-pc-in.is-back { transform: rotateY(180deg); }
.gr-pc-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 3px; box-shadow: 0 30px 70px rgba(0,0,0,.55), 0 2px 6px rgba(0,0,0,.35); overflow: hidden; }
.gr-pc-front { background: var(--paper); padding: 12px; }
.gr-pc-img { position: absolute; inset: 12px; overflow: hidden; background: #2a2018; }
.gr-pc-img img, .gr-pc-img svg { width: 100%; height: 100%; object-fit: cover; display: block; }
.gr-pc-cap { position: absolute; right: 26px; bottom: 18px; font: 600 24px/1 var(--hand); color: #fff8ea; text-shadow: 0 1px 3px rgba(0,0,0,.6), 0 0 12px rgba(0,0,0,.4); }
.gr-pc-back { transform: rotateY(180deg); cursor: default; display: grid; grid-template-columns: minmax(0, 1.25fr) 1px minmax(0, 1fr); gap: 0 22px; padding: 26px 26px 22px 28px; color: var(--ink);
  background:
    radial-gradient(ellipse at 20% 15%, rgba(255,255,255,.35), transparent 60%),
    radial-gradient(ellipse at 85% 90%, rgba(150,120,80,.14), transparent 55%),
    repeating-linear-gradient(17deg, rgba(120,90,50,.025) 0 2px, transparent 2px 5px),
    var(--paper); }
.gr-pc-l { position: relative; display: flex; flex-direction: column; min-height: 0; }
.gr-pc-write { flex: 1; width: 100%; min-height: 0; resize: none; border: 0; outline: none; padding: 0 2px; margin: 0; background: transparent;
  font: 500 clamp(19px, 2.6vw, 25px)/1.5 var(--hand); color: #26305a; caret-color: #26305a; user-select: text; -webkit-user-select: text;
  background-image: linear-gradient(transparent calc(1.5em - 1px), rgba(60,70,110,.22) calc(1.5em - 1px), rgba(60,70,110,.22) 1.5em, transparent 1.5em);
  background-size: 100% 1.5em; background-attachment: local; scrollbar-width: none; }
.gr-pc-write::placeholder { color: rgba(38,48,90,.38); }
.gr-pc-count { position: absolute; right: 0; bottom: -14px; font: 600 10.5px/1 var(--cond); letter-spacing: .14em; color: rgba(42,38,32,.45); }
.gr-pc-count.is-full { color: #a2462e; }
.gr-pc-div { background: rgba(42,38,32,.25); }
.gr-pc-r { position: relative; display: flex; flex-direction: column; min-width: 0; }
.gr-pc-top { position: relative; height: 46%; min-height: 96px; }
.gr-pc-label { font: 600 11px/1 var(--cond); letter-spacing: .3em; text-transform: uppercase; color: rgba(42,38,32,.6); }
.gr-pc-stamp { position: absolute; right: 0; top: 0; width: 64px; filter: drop-shadow(0 1px 1px rgba(0,0,0,.18)); }
.gr-stamp { display: block; width: 100%; }
.gr-pc-pm { position: absolute; right: 44px; top: 30px; width: 178px; color: rgba(38,48,90,.6); transform: rotate(-10deg); mix-blend-mode: multiply; pointer-events: none; }
.gr-postmark { display: block; width: 100%; overflow: visible; }
.gr-pc-addr { margin-top: auto; padding-bottom: 6px; }
.gr-pc-al { font: 600 clamp(20px, 2.6vw, 26px)/1.5 var(--hand); color: #26305a; border-bottom: 1px solid rgba(42,38,32,.3); padding: 0 4px; min-height: 1.5em; }
.gr-ch-step { width: 100%; margin-top: 22px; transition: opacity .3s, max-height .4s var(--ease); max-height: 140px; overflow: hidden; }
.gr-ch-step.is-hidden { opacity: 0; max-height: 0; margin-top: 0; pointer-events: none; }
.gr-ch-thumbs { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; padding: 4px; }
.gr-ch-t { width: 92px; aspect-ratio: 3 / 2; padding: 3px; background: var(--paper); opacity: .6; transition: opacity .2s, transform .25s var(--ease), box-shadow .2s; box-shadow: 0 6px 14px rgba(0,0,0,.4); }
.gr-ch-t img { width: 100%; height: 100%; object-fit: cover; display: block; }
.gr-ch-t:hover { opacity: .9; }
.gr-ch-t.is-on { opacity: 1; transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,.5), 0 0 0 2px var(--lamp); }
.gr-ch-t:focus { box-shadow: 0 10px 20px rgba(0,0,0,.5), 0 0 0 2px var(--gold); }
.gr-ch-none { font: italic 400 17px/1.4 var(--serif); color: var(--dim); text-align: center; }
.gr-ch-foot { margin-top: 22px; }
.gr-ch-acts { display: flex; align-items: center; justify-content: center; gap: 14px; }
.gr-ch-sendhint { gap: 4px; }

/* ---------- touch ---------- */
.gr-touch { position: absolute; inset: 0; display: none; }
.gr-touch.is-on { display: block; }
#gr-ui.gr-modal .gr-touch, #gr-ui.gr-has-screen .gr-touch { visibility: hidden; }
#gr-ui.gr-photo-on .gr-touch .gr-touch-btn { visibility: hidden; }
.gr-tz { position: absolute; top: 0; bottom: 0; pointer-events: auto; touch-action: none; }
.gr-tz.is-left { left: 0; width: 50%; }
.gr-tz.is-right { right: 0; width: 50%; }
.gr-stick { position: absolute; left: 0; top: 0; width: 104px; height: 104px; border-radius: 50%; border: 1.5px solid rgba(255,217,160,.45); background: radial-gradient(circle, rgba(20,16,12,.25), rgba(20,16,12,.45)); opacity: 0; transition: opacity .2s; pointer-events: none; }
.gr-stick.is-on { opacity: 1; }
.gr-stick-k { position: absolute; left: 34px; top: 34px; width: 36px; height: 36px; border-radius: 50%; background: rgba(255,217,160,.82); box-shadow: 0 2px 10px rgba(0,0,0,.4); }
.gr-touch-btn { position: absolute; display: grid; place-items: center; border-radius: 50%; color: var(--text); background: rgba(20,16,12,.55); border: 1.5px solid rgba(255,217,160,.4); pointer-events: auto; touch-action: none; transition: transform .1s, background .15s, border-color .15s; }
.gr-touch-btn .gr-ico { width: 46%; height: 46%; }
.gr-tb-l { position: absolute; top: 100%; margin-top: 5px; left: 50%; transform: translateX(-50%); font: 600 10.5px/1 var(--cond); letter-spacing: .16em; text-transform: uppercase; color: rgba(243,237,226,.92); text-shadow: 0 0 2px rgba(0,0,0,.9), 0 1px 6px rgba(0,0,0,.7), 0 0 14px rgba(0,0,0,.5); white-space: nowrap; }
.gr-touch-btn.is-down { transform: scale(.92); background: rgba(255,217,160,.3); border-color: var(--lamp); }
.gr-touch-btn.is-latched { background: rgba(255,217,160,.24); border-color: var(--lamp); color: var(--gold); }
.gr-touch-btn.is-hint { border-color: var(--lamp); color: var(--gold); box-shadow: 0 0 0 5px rgba(255,217,160,.14); }
.gr-touch-btn.is-use { width: 74px; height: 74px; right: calc(env(safe-area-inset-right) + 26px); bottom: calc(env(safe-area-inset-bottom) + 118px); }
.gr-touch-btn.is-jump { width: 60px; height: 60px; right: calc(env(safe-area-inset-right) + 118px); bottom: calc(env(safe-area-inset-bottom) + 52px); }
.gr-touch-btn.is-run { width: 52px; height: 52px; right: calc(env(safe-area-inset-right) + 128px); bottom: calc(env(safe-area-inset-bottom) + 150px); }
.gr-touch-btn.is-journal { width: 48px; height: 48px; right: calc(env(safe-area-inset-right) + 38px); bottom: calc(env(safe-area-inset-bottom) + 228px); }
.gr-touch-btn.is-top { width: 42px; height: 42px; top: calc(env(safe-area-inset-top) + 14px); }
.gr-touch-btn.is-top .gr-tb-l { display: none; }
.gr-touch-btn.is-pause { right: calc(env(safe-area-inset-right) + 14px); }
.gr-touch-btn.is-map { right: calc(env(safe-area-inset-right) + 64px); }
#gr-ui.gr-touch-on .gr-status { top: max(16px, env(safe-area-inset-top)); bottom: auto; left: var(--edge); right: auto; align-items: flex-start; flex-direction: column-reverse; }
#gr-ui.gr-touch-on .gr-compass { width: min(540px, calc(100vw - 400px)); }
#gr-ui.gr-touch-on .gr-toasts { bottom: auto; top: calc(max(16px, env(safe-area-inset-top)) + 110px); }
#gr-ui.gr-touch-on .gr-prompt { top: calc(50% + 30px); padding-left: 13px; }
#gr-ui.gr-touch-on .gr-prompt .gr-key { display: none; }

@media (max-width: 860px) {
  #gr-ui.gr-touch-on .gr-compass { top: calc(max(16px, env(safe-area-inset-top)) + 58px); width: 78vw; }
  #gr-ui.gr-touch-on .gr-thread { top: calc(max(16px, env(safe-area-inset-top)) + 118px); }
  #gr-ui.gr-touch-on .gr-toasts { top: calc(max(16px, env(safe-area-inset-top)) + 156px); }
  #gr-ui.gr-touch-on .gr-dcard { top: calc(max(16px, env(safe-area-inset-top)) + 172px); }
}

/* ---------- narrow screens ---------- */
@media (max-width: 860px) {
  .gr-book-head { flex-wrap: wrap; padding: 16px 12px 0 20px; gap: 6px 12px; }
  .gr-book-head .gr-book-ht { order: 1; }
  .gr-book-head .gr-sheet-hx { order: 2; }
  .gr-tabs, .gr-map-seg { order: 3; flex-basis: 100%; overflow-x: auto; scrollbar-width: none; margin: 4px 0 0 -10px; }
  .gr-tab { padding: 10px 9px 11px; letter-spacing: .1em; gap: 5px; font-size: 12.5px; }
  .gr-tab::after { left: 9px; right: 9px; }
  .gr-map-seg { margin: 6px 0 12px; }
  .gr-drumwrap { grid-template-columns: 1fr; grid-template-rows: minmax(0, 1fr) auto; }
  .gr-drumside { border-left: 0; border-top: 1px solid var(--line-3); flex-direction: row; flex-wrap: wrap; align-items: center; padding: 14px 20px; gap: 6px 18px; }
  .gr-drumside .gr-mfacts { flex: 1 1 200px; }
  .gr-endhost { width: 110px; flex: none; }
  .gr-mnote { display: none; }
  .gr-mfacts-t { font-size: 26px; margin: 4px 0; }
  .gr-mfacts-l { font-size: 13px; line-height: 1.45; }
  .gr-pause-side { display: none; }
}
@media (max-width: 720px) {
  .gr-screen { padding: max(10px, env(safe-area-inset-top)) 10px max(10px, env(safe-area-inset-bottom)); }
  .gr-sheet-head { padding: 18px 10px 14px 20px; }
  .gr-sheet-title { font-size: 24px; }
  .gr-sheet-body { padding: 4px 20px 24px; }
  .gr-srow { grid-template-columns: 1fr; gap: 10px; padding: 13px 0; }
  .gr-srow-c { justify-content: flex-start; }
  .gr-srow.is-toggle { grid-template-columns: 1fr auto; }
  .gr-help { grid-template-columns: 1fr; gap: 0; }
  .gr-help-k { grid-template-columns: 120px 1fr; }
  .gr-book { height: calc(100vh - 20px); height: calc(100dvh - 20px); }
  .gr-book-body { grid-template-columns: 1fr; }
  .gr-gutter { display: none; }
  .gr-jpage-w { display: none; }
  .gr-book-body.is-detail .gr-jlist { display: none; }
  .gr-book-body.is-detail .gr-jpage-w { display: flex; }
  .gr-jback { display: inline-flex; align-items: center; gap: 6px; align-self: flex-start; margin: 14px 0 0 14px; padding: 6px 10px 6px 4px; font: 600 12px/1 var(--cond); letter-spacing: .16em; text-transform: uppercase; color: var(--dim); }
  .gr-jback .gr-icowrap { font-size: 16px; }
  .gr-jpage { padding: 16px 24px 30px; }
  .gr-jlist { padding: 8px 6px 16px; }
  .gr-book-body.is-cards .gr-jcards { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 14px; padding: 18px 16px 24px; }
  .gr-pcard-c { font-size: 16px; }
  .gr-drumhost { padding: 10px 6px 6px; }
  .gr-drum .t-band { font-size: 24px; }
  .gr-drum .t-bsub, .gr-drum .t-far, .gr-drum .t-terr { display: none; }
  .gr-drum .t-ring { font-size: 20px; }
  .gr-drum .t-cap, .gr-drum .t-end, .gr-drum .t-you { font-size: 20px; }
  .gr-legend { display: none; }
  .gr-mtools { right: 12px; top: 12px; }
  .gr-ts-in { left: 28px; top: auto; bottom: 16vh; transform: none; }
  .gr-ts-t { font-size: clamp(58px, 17vw, 84px); }
  .gr-ts-rule { margin: 26px 0 14px; }
  .gr-ts { background: linear-gradient(0deg, rgba(8,6,4,.85) 0%, rgba(8,6,4,.5) 45%, rgba(8,6,4,.15) 75%, rgba(8,6,4,.4) 100%); }
  .gr-pz { background: linear-gradient(0deg, rgba(8,6,4,.85) 0%, rgba(8,6,4,.55) 60%, rgba(8,6,4,.35) 100%); }
  .gr-ts-in.is-pause { bottom: 12vh; }
  .gr-ts-foot { left: 28px; bottom: max(20px, env(safe-area-inset-bottom)); }
  .gr-li { padding: 10px 0; font-size: 17px; }
  .gr-pctl { flex-wrap: wrap; gap: 8px 16px; padding: 12px 16px; bottom: calc(max(22px, 3vh) + 14px); }
  .gr-pslot { flex: 1 1 100%; display: grid; grid-template-columns: 130px 1fr; align-items: center; gap: 8px; }
  .gr-pslot-h { margin: 0; }
  .gr-pctl-s { flex: 1 1 100%; border-left: 0; border-top: 1px solid var(--line); padding: 10px 0 0; display: flex; justify-content: center; }
  .gr-ptop .gr-hint { display: none; }
  .gr-ptop { left: calc(max(22px, 2.4vw) + 14px); right: calc(max(22px, 2.4vw) + 6px); }
  .gr-pthumb.is-docked { width: 120px; top: calc(100% - max(22px, 3vh) - 300px); }
  .gr-pc { width: 100%; aspect-ratio: 3 / 2; min-width: 0; }
  .gr-pc.is-flipped { aspect-ratio: auto; height: min(137vw, calc(100vh - 236px)); height: min(137vw, calc(100dvh - 236px)); min-height: 340px; }
  .gr-pc-back { grid-template-columns: 1fr; grid-template-rows: auto 1px minmax(0, 1fr); gap: 14px 0; padding: 18px 18px 22px; }
  .gr-pc-l { order: 3; }
  .gr-pc-div { order: 2; }
  .gr-pc-r { order: 1; flex-direction: row; align-items: flex-end; gap: 10px; }
  .gr-pc-top { height: 112px; min-height: 0; flex: none; width: 128px; order: 2; }
  .gr-pc-label { display: none; }
  .gr-pc-pm { width: 104px; right: 46px; top: 22px; }
  .gr-pc-stamp { width: 54px; }
  .gr-pc-addr { flex: 1; order: 1; margin: 0; }
  .gr-pc-al { font-size: 21px; }
  .gr-pc-write { font-size: 21px; }
  .gr-pc-front { padding: 9px; }
  .gr-pc-img { inset: 9px; }
  .gr-ch-head { margin-bottom: 14px; }
  .gr-ch-sub { font-size: 16px; }
  .gr-ch-t { width: 74px; }
  .gr-ch-sendhint { display: none; }
}
@media (max-width: 430px) {
  .gr-tab { padding: 10px 6px 11px; letter-spacing: .05em; gap: 4px; font-size: 12px; }
  .gr-tab::after { left: 6px; right: 6px; }
  .gr-tab-c { font-size: 10.5px; letter-spacing: 0; }
}
@media (max-height: 520px) and (min-width: 600px) {
  .gr-book-head { flex-wrap: nowrap; padding: 10px 12px 8px 22px; }
  .gr-tabs, .gr-map-seg { order: 0; flex-basis: auto; margin: 0; }
  .gr-book-head .gr-book-ht { order: -1; }
  .gr-book-head .gr-sheet-hx { order: 4; }
  .gr-book-head .gr-sheet-title { font-size: 22px; }
  .gr-book-head .gr-kicker { display: none; }
  .gr-drumwrap { grid-template-columns: minmax(0, 1fr) 230px; grid-template-rows: none; }
  .gr-drumside { border-top: 0; border-left: 1px solid var(--line-3); flex-direction: column; flex-wrap: nowrap; align-items: stretch; padding: 14px 16px; gap: 8px; }
  .gr-drumside .gr-mfacts { flex: none; }
  .gr-endhost { width: 120px; align-self: center; }
  .gr-mfacts-t { font-size: 22px; }
  .gr-mfacts-l { font-size: 12.5px; }
  .gr-jpage { padding: 18px 28px 24px; }
  .gr-jp-t { font-size: 28px; margin: 6px 0 10px; }
  .gr-sheet-head { padding: 12px 14px 10px 24px; }
}
@media (max-height: 520px) {
  .gr-ts-foot { left: auto; right: 28px; bottom: 18px; }
  .gr-ts-in { top: 50%; bottom: auto; transform: translateY(-50%); }
  .gr-ts-t { font-size: 56px; }
  .gr-ts-rule { margin: 16px 0 8px; }
  .gr-li { padding: 6px 0; }
  .gr-pc { width: min(760px, 100%, calc((100vh - 200px) * 1.5)); }
}
@media (prefers-reduced-motion: reduce) {
  #gr-ui *, #gr-ui *::before, #gr-ui *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
`;
