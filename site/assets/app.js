// Kerr swarm world bible: menu, glossary tooltips, search, glossary filter, TOC highlight.
(function () {
  "use strict";
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  // ---- mobile contents drawer
  var menuBtn = $("#menu-btn"), nav = $("#sidenav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("open") && !nav.contains(e.target) && e.target !== menuBtn) {
        nav.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // ---- glossary tooltips
  var tip = $("#tip"), tipFor = null;
  function showTip(a) {
    if (!tip || !a.dataset.tip) return;
    tip.innerHTML = "";
    var h = document.createElement("strong");
    h.textContent = a.dataset.term || a.textContent;
    tip.appendChild(h);
    tip.appendChild(document.createTextNode(a.dataset.tip));
    tip.hidden = false;
    var r = a.getBoundingClientRect();
    var w = tip.offsetWidth, hgt = tip.offsetHeight;
    var x = Math.min(Math.max(8, r.left + window.scrollX), window.scrollX + document.documentElement.clientWidth - w - 8);
    var y = r.bottom + window.scrollY + 8;
    if (r.bottom + hgt + 16 > window.innerHeight) y = r.top + window.scrollY - hgt - 8;
    tip.style.left = x + "px";
    tip.style.top = y + "px";
    tipFor = a;
  }
  function hideTip() { if (tip) tip.hidden = true; tipFor = null; }
  document.addEventListener("mouseover", function (e) {
    var a = e.target.closest && e.target.closest("a.term");
    if (a) showTip(a); else if (tipFor) hideTip();
  });
  document.addEventListener("focusin", function (e) {
    if (e.target.matches && e.target.matches("a.term")) showTip(e.target); else hideTip();
  });
  window.addEventListener("scroll", function () { if (tipFor) hideTip(); }, { passive: true });

  // ---- search
  var panel = $("#search"), input = $("#search-input"), list = $("#search-results");
  var index = null, loading = null, sel = 0, results = [];
  function load() {
    if (index) return Promise.resolve(index);
    if (!loading) {
      loading = fetch("search.json").then(function (r) { return r.json(); }).then(function (d) {
        index = d.map(function (e) { return { e: e, lt: e.x.toLowerCase(), lh: (e.h + " " + e.t).toLowerCase() }; });
        return index;
      });
    }
    return loading;
  }
  function escHtml(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function snippet(text, lower, words) {
    var at = -1;
    for (var i = 0; i < words.length && at < 0; i++) at = lower.indexOf(words[i]);
    var start = Math.max(0, at - 60), end = Math.min(text.length, start + 200);
    var s = (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
    var out = escHtml(s);
    words.forEach(function (w) {
      if (w.length < 2) return;
      var re = new RegExp("(" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
      out = out.replace(re, "<mark>$1</mark>");
    });
    return out;
  }
  function run(q) {
    var words = q.toLowerCase().split(/\s+/).filter(Boolean);
    results = [];
    if (!words.length) { list.innerHTML = '<li class="empty">Try “glow sail”, “moat”, “birth right” or “39,000”.</li>'; return; }
    index.forEach(function (r) {
      var score = 0;
      for (var i = 0; i < words.length; i++) {
        var w = words[i], inH = r.lh.indexOf(w) >= 0, n = 0, p = -1;
        while ((p = r.lt.indexOf(w, p + 1)) >= 0 && n < 20) n++;
        if (!inH && !n) return;
        score += (inH ? 12 : 0) + Math.min(n, 10);
      }
      if (r.e.t === "Glossary" && r.lh.indexOf(words.join(" ")) === 0) score += 30;
      results.push({ r: r, s: score });
    });
    results.sort(function (a, b) { return b.s - a.s; });
    results = results.slice(0, 30);
    sel = 0;
    if (!results.length) { list.innerHTML = '<li class="empty">Nothing matches every word. Try fewer words.</li>'; return; }
    list.innerHTML = results.map(function (x, i) {
      var e = x.r.e;
      return '<li><a href="' + e.u + '"' + (i === 0 ? ' class="is-sel"' : "") + '><span class="r-where">' + escHtml(e.t) +
        '</span><span class="r-head">' + escHtml(e.h || e.t) + '</span><span class="r-snip">' + snippet(e.x, x.r.lt, words) + "</span></a></li>";
    }).join("");
  }
  function openSearch() {
    if (!panel) return;
    panel.hidden = false;
    input.value = "";
    list.innerHTML = '<li class="empty">Loading…</li>';
    input.focus();
    load().then(function () { run(input.value); }).catch(function () {
      list.innerHTML = '<li class="empty">Search needs the site to be served over the web, not opened as a file.</li>';
    });
  }
  function closeSearch() { if (panel) panel.hidden = true; }
  var sb = $("#search-btn");
  if (sb) sb.addEventListener("click", openSearch);
  if (panel) {
    panel.addEventListener("click", function (e) { if (e.target === panel) closeSearch(); });
    input.addEventListener("input", function () { if (index) run(input.value); });
    input.addEventListener("keydown", function (e) {
      var links = $$("a", list);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!links.length) return;
        links[sel] && links[sel].classList.remove("is-sel");
        sel = (sel + (e.key === "ArrowDown" ? 1 : links.length - 1)) % links.length;
        links[sel].classList.add("is-sel");
        links[sel].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter" && links[sel]) {
        e.preventDefault();
        closeSearch();
        window.location.href = links[sel].getAttribute("href");
      }
    });
    list.addEventListener("click", function (e) { if (e.target.closest("a")) closeSearch(); });
  }
  document.addEventListener("keydown", function (e) {
    var typing = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || "");
    if (e.key === "Escape") { closeSearch(); hideTip(); if (nav) nav.classList.remove("open"); }
    else if (!typing && (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"))) { e.preventDefault(); openSearch(); }
  });

  // ---- glossary filter
  var gf = $("#gfilter");
  if (gf) {
    gf.addEventListener("input", function () {
      var q = gf.value.trim().toLowerCase();
      $$(".entry").forEach(function (el) {
        el.hidden = q && el.dataset.name.indexOf(q) < 0 && el.textContent.toLowerCase().indexOf(q) < 0;
      });
      $$(".gcat").forEach(function (c) { c.hidden = !$$(".entry", c).some(function (el) { return !el.hidden; }); });
    });
  }

  // ---- highlight the current section in the on-this-page rail
  var tocLinks = $$(".toc a");
  if (tocLinks.length && "IntersectionObserver" in window) {
    var byId = {};
    tocLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var heads = $$(".prose h2[id], .prose h3[id]").filter(function (h) { return byId[h.id]; });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          tocLinks.forEach(function (a) { a.classList.remove("is-active"); });
          byId[en.target.id].classList.add("is-active");
        }
      });
    }, { rootMargin: "0px 0px -75% 0px" });
    heads.forEach(function (h) { obs.observe(h); });
  }
})();
