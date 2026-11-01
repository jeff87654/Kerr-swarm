/* ---------- start ---------- */
(function start() {
  try {
    initUI();
  } catch (e) {
    const el = document.getElementById("card");
    if (el) el.innerHTML = `<div class="card"><p>Something went wrong drawing the drum: ${esc(e && e.message)}</p></div>`;
    if (typeof console !== "undefined") console.error(e);
  }
})();
