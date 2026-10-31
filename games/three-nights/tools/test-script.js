// Scripted run for headless screenshots. ?run=<steps> where steps are comma-separated:
// begin, glide-r, glide-u, hollow, window, night, cards, raft, wait
(function () {
  const q = new URLSearchParams(location.search);
  const steps = (q.get("run") || "").split(",").filter(Boolean);
  if (!steps.length) return;
  const errs = [];
  window.addEventListener("error", (e) => errs.push(e.message + " @" + e.lineno));
  const click = (sel) => { const el = document.querySelector(sel); if (el) el.click(); else errs.push("missing " + sel); };
  let i = 0;
  const next = () => {
    if (i >= steps.length) {
      const pre = document.createElement("pre");
      pre.style.cssText = "position:fixed;left:0;bottom:0;z-index:999;background:#300;color:#fdd;font:11px monospace;margin:0;max-width:100%;white-space:pre-wrap";
      pre.textContent = errs.length ? errs.join(" | ") : "";
      if (errs.length) document.body.appendChild(pre);
      return;
    }
    const s = steps[i++];
    try {
      if (s === "begin") click("#btn-begin");
      else if (s === "glide-r") click('[data-act="glide"][data-dx="1"]');
      else if (s === "glide-u") click('[data-act="glide"][data-dy="1"]');
      else if (s === "skip") click('[data-act="skip-glide"]');
      else if (s === "hollow") click('[data-act="do-hollow"]');
      else if (s === "window") click('[data-act="do-window"]');
      else if (s === "spindle") click('[data-act="do-spindle"]');
      else if (s === "sleep") click('[data-act="do-sleep"]');
      else if (s === "cards") click('[data-act="open-cards"]');
      else if (s === "raft") click('[data-act="open-raft"]');
      else if (s === "pick-kelp") click('[data-act="raft-pick"][data-row="Kelp"]');
      else if (s === "talk") click('[data-act="talk"]');
      else if (s === "card") click('[data-act="do-card"]');
      else if (s === "cycle-slow") click('[data-act="cycle-go"][data-v="2"]');
      else if (s === "arrive") click('[data-act="jr-arrive"]');
      else if (s === "ledger") { click('[data-act="open-menu"]'); setTimeout(() => click('[data-act="open-ledger"]'), 200); }
      else if (s === "suggest") click('[data-act="c-suggest"]');
      else if (s === "send") click('[data-act="c-send"]');
      else if (s === "hall") click('[data-act="hall"]');
      else if (s === "reload-continue") { saveGame(); location.href = location.pathname + "?run=continue"; }
      else if (s === "continue") click("#btn-continue");
      else if (s === "night") { state.t += 15 * 60; renderAll(); }
      else if (s === "mobile") { document.body.style.maxWidth = "420px"; }
      else if (s === "overflow") {
        const W = document.documentElement.clientWidth;
        const bad = Array.from(document.querySelectorAll("body *")).filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > W + 1 && !el.closest(".stage"); });
        const leaf = bad.filter((el) => !bad.some((o) => o !== el && el.contains(o)));
        errs.push("OVERFLOW W=" + W + " n=" + bad.length + ": " + leaf.slice(0, 8).map((el) => el.tagName + "." + (el.className && el.className.baseVal === undefined ? el.className : "") + "[" + Math.round(el.getBoundingClientRect().width) + "px right=" + Math.round(el.getBoundingClientRect().right) + "]").join(", "));
      }
      else if (s === "diag") { errs.push("DIAG " + JSON.stringify({ hv: hollowView && hollowView.ok, prog: !!(hollowView && hollowView.prog), lost: hollowView && hollowView.gl && hollowView.gl.isContextLost(), glerr: hollowView && hollowView.gl && hollowView.gl.getError(), cw: $("#cv-hollow").width, ch: $("#cv-hollow").height, busy, glide: !!glideAnim, stageMode, x: state && state.x, y: state && state.y, here: state && here().name, log: state && state.log.length, view: state && state.view })); }
    } catch (e) { errs.push(s + ": " + e.message); }
    setTimeout(next, s.startsWith("glide") ? 7000 : s === "cycle-slow" ? 16000 : s === "arrive" ? 7000 : 900);
  };
  setTimeout(next, 900);
})();
