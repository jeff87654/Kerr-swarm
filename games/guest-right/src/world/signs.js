// Signs: text and pictures drawn into the atlas, and the boards that carry them.
// sign(s, spec, x, y, z, o) places one. spec is an entry of content/signs.js or an inline object:
//   { kind, text | title, sub, lines: [...], palette: ['#bg', '#fg', '#accent'], emblem }
// kind: 'fascia' | 'hanging' | 'chalk' | 'poster' | 'notice' | 'street' | 'plate' | 'label' | 'board' | 'banner' | 'letters'
import { rgb8, mixHex, shadeHex, hashStr, Rng } from '../core/util.js';

const SERIF = "'Cormorant Garamond', Georgia, serif", CAPS = "'Barlow Condensed', 'Arial Narrow', sans-serif", SANS = "'Barlow', Arial, sans-serif", HAND = "'Caveat', 'Segoe Script', cursive";

export async function loadSignFonts() {
  if (!document.fonts || !document.fonts.load) return;
  const want = ['italic 600 48px ' + SERIF, '600 48px ' + SERIF, '400 48px ' + SERIF, 'italic 400 48px ' + SERIF, '600 48px ' + CAPS, '500 48px ' + CAPS, '400 24px ' + SANS, '600 24px ' + SANS, '600 48px ' + HAND, '500 48px ' + HAND];
  try { await Promise.race([Promise.all(want.map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 2500))]); } catch (e) { /* fall back to system fonts */ }
}

function fit(ctx, text, font, size, maxW, min = 8) {
  let s = size; ctx.font = font.replace('$', s);
  while (s > min && ctx.measureText(text).width > maxW) { s -= 1; ctx.font = font.replace('$', s); }
  return s;
}
function spaced(ctx, text, x, y, tracking) {       // centred text with letter-spacing (in px)
  const chars = Array.from(text); let w = 0; for (const c of chars) w += ctx.measureText(c).width + tracking; w -= tracking;
  let cx = x - w / 2; const al = ctx.textAlign; ctx.textAlign = 'left';
  for (const c of chars) { ctx.fillText(c, cx, y); cx += ctx.measureText(c).width + tracking; }
  ctx.textAlign = al; return w;
}
function spacedWidth(ctx, text, tracking) { let w = 0; for (const c of Array.from(text)) w += ctx.measureText(c).width + tracking; return w - tracking; }
function grain(ctx, w, h, seed, amt = 0.06, n = 900) {
  const r = new Rng(seed);
  for (let i = 0; i < n; i++) { ctx.fillStyle = r.chance(0.5) ? 'rgba(255,255,255,' + (amt * r.next()).toFixed(3) + ')' : 'rgba(0,0,0,' + (amt * r.next()).toFixed(3) + ')'; ctx.fillRect(r.f(0, w), r.f(0, h), r.f(1, 14), r.f(0.5, 2)); }
}

// ---- small emblems, drawn in a unit box centred on (0,0), size 1 ----
const EMBLEMS = {
  ladle(c) { c.beginPath(); c.arc(0.12, 0.22, 0.2, 0, Math.PI); c.closePath(); c.fill(); c.lineWidth = 0.07; c.lineCap = 'round'; c.beginPath(); c.moveTo(-0.02, 0.2); c.lineTo(-0.3, -0.36); c.stroke(); },
  loaf(c) { c.beginPath(); c.ellipse(0, 0.06, 0.38, 0.24, 0, 0, 7); c.fill(); c.save(); c.globalCompositeOperation = 'destination-out'; c.lineWidth = 0.045; for (const x of [-0.18, 0, 0.18]) { c.beginPath(); c.moveTo(x - 0.06, 0.16); c.lineTo(x + 0.06, -0.08); c.stroke(); } c.restore(); },
  leaf(c) { c.beginPath(); c.moveTo(0, 0.4); c.quadraticCurveTo(0.42, 0.05, 0, -0.4); c.quadraticCurveTo(-0.42, 0.05, 0, 0.4); c.fill(); },
  apple(c) { c.beginPath(); c.arc(0, 0.04, 0.32, 0, 7); c.fill(); c.save(); c.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; c.beginPath(); c.ellipse(Math.cos(a) * 0.11, 0.04 + Math.sin(a) * 0.11, 0.075, 0.032, a, 0, 7); c.fill(); } c.restore(); },
  flute(c) { c.save(); c.rotate(-0.5); c.fillRect(-0.44, -0.035, 0.88, 0.07); c.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(-0.2 + i * 0.12, 0, 0.018, 0, 7); c.fill(); } c.restore(); },
  book(c) { c.beginPath(); c.moveTo(0, -0.22); c.quadraticCurveTo(0.2, -0.32, 0.4, -0.24); c.lineTo(0.4, 0.24); c.quadraticCurveTo(0.2, 0.16, 0, 0.26); c.quadraticCurveTo(-0.2, 0.16, -0.4, 0.24); c.lineTo(-0.4, -0.24); c.quadraticCurveTo(-0.2, -0.32, 0, -0.22); c.fill(); },
  thread(c) { c.fillRect(-0.2, -0.34, 0.4, 0.07); c.fillRect(-0.2, 0.27, 0.4, 0.07); c.fillRect(-0.13, -0.28, 0.26, 0.56); c.save(); c.globalCompositeOperation = 'destination-out'; c.lineWidth = 0.025; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-0.13, -0.2 + i * 0.1); c.lineTo(0.13, -0.14 + i * 0.1); c.stroke(); } c.restore(); },
  lamp(c) { c.beginPath(); c.arc(0, -0.04, 0.26, 0, 7); c.fill(); c.fillRect(-0.1, 0.22, 0.2, 0.06); c.lineWidth = 0.035; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(Math.cos(a) * 0.33, -0.04 + Math.sin(a) * 0.33); c.lineTo(Math.cos(a) * 0.42, -0.04 + Math.sin(a) * 0.42); c.stroke(); } },
  cup(c) { c.beginPath(); c.moveTo(-0.26, -0.12); c.lineTo(0.26, -0.12); c.quadraticCurveTo(0.24, 0.3, 0, 0.3); c.quadraticCurveTo(-0.24, 0.3, -0.26, -0.12); c.fill(); c.beginPath(); c.ellipse(0, -0.2, 0.3, 0.07, 0, Math.PI, 0); c.fill(); c.beginPath(); c.arc(0, -0.29, 0.05, 0, 7); c.fill(); },
  chair(c) { c.fillRect(-0.22, -0.4, 0.07, 0.8); c.fillRect(-0.22, 0, 0.46, 0.07); c.fillRect(0.17, 0, 0.07, 0.4); c.fillRect(-0.22, -0.4, 0.3, 0.06); },
  wing(c) { c.beginPath(); c.moveTo(-0.42, -0.1); c.quadraticCurveTo(0, -0.42, 0.42, -0.12); c.quadraticCurveTo(0.2, 0.0, 0.3, 0.3); c.quadraticCurveTo(0, 0.05, -0.42, -0.1); c.fill(); },
  drop(c) { c.beginPath(); c.moveTo(0, -0.4); c.quadraticCurveTo(0.34, 0.1, 0, 0.36); c.quadraticCurveTo(-0.34, 0.1, 0, -0.4); c.fill(); },
  star(c) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.17 : 0.42; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); },
  drum(c) { c.lineWidth = 0.05; c.beginPath(); c.arc(0, 0, 0.38, 0, 7); c.stroke(); c.beginPath(); c.arc(0, 0, 0.2, 0, 7); c.stroke(); c.beginPath(); c.arc(0, 0, 0.035, 0, 7); c.fill(); },
  cross(c) { c.fillRect(-0.09, -0.34, 0.18, 0.68); c.fillRect(-0.34, -0.09, 0.68, 0.18); },
  ball(c) { c.beginPath(); c.arc(0, 0, 0.3, 0, 7); c.fill(); c.save(); c.globalCompositeOperation = 'destination-out'; c.lineWidth = 0.035; c.beginPath(); c.arc(-0.3, 0, 0.3, -1, 1); c.stroke(); c.beginPath(); c.arc(0.3, 0, 0.3, 2.14, 4.14); c.stroke(); c.restore(); },
};
export function drawEmblem(ctx, name, cx, cy, size, color) {
  const f = EMBLEMS[name]; if (!f) return;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(size, size); ctx.fillStyle = color; ctx.strokeStyle = color; f(ctx); ctx.restore();
}
export const EMBLEM_NAMES = Object.keys(EMBLEMS);

// ---- painters: each returns { w, h (pixels), aspect, draw(ctx, w, h), cutout?, px per metre } for a spec ----
function paintFascia(sp, pxW, pxH) {
  const pal = sp.palette || ['#2d3b36', '#f3e6c8', '#d8a657'];
  return (ctx, w, h) => {
    ctx.fillStyle = pal[0]; ctx.fillRect(0, 0, w, h);
    grain(ctx, w, h, hashStr(sp.text || 'x'), 0.05, 500);
    ctx.strokeStyle = pal[2] || pal[1]; ctx.lineWidth = Math.max(2, h * 0.018); ctx.strokeRect(h * 0.07, h * 0.07, w - h * 0.14, h - h * 0.14);
    const txt = sp.text || sp.title || ''; const hasSub = !!sp.sub;
    ctx.fillStyle = pal[1]; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let ex = 0;
    if (sp.emblem) { ex = h * 0.62; }
    const maxW = w - h * 0.5 - ex * 2;
    if (sp.font === 'caps') {
      const s = fit(ctx, txt.toUpperCase(), '600 $px ' + CAPS, h * (hasSub ? 0.46 : 0.58), maxW * 0.86);
      const tw = spaced(ctx, txt.toUpperCase(), w / 2, h * (hasSub ? 0.42 : 0.53), s * 0.14);
      if (sp.emblem) { drawEmblem(ctx, sp.emblem, w / 2 - tw / 2 - ex * 0.75, h * 0.5, h * 0.6, pal[2] || pal[1]); drawEmblem(ctx, sp.emblem, w / 2 + tw / 2 + ex * 0.75, h * 0.5, h * 0.6, pal[2] || pal[1]); }
    } else {
      const s = fit(ctx, txt, (sp.font === 'hand' ? '600 $px ' + HAND : 'italic 600 $px ' + SERIF), h * (hasSub ? 0.56 : 0.72), maxW);
      ctx.fillText(txt, w / 2, h * (hasSub ? 0.4 : 0.52));
      const tw = ctx.measureText(txt).width;
      if (sp.emblem) { drawEmblem(ctx, sp.emblem, w / 2 - tw / 2 - ex * 0.75, h * 0.5, h * 0.6, pal[2] || pal[1]); drawEmblem(ctx, sp.emblem, w / 2 + tw / 2 + ex * 0.75, h * 0.5, h * 0.6, pal[2] || pal[1]); }
      void s;
    }
    if (hasSub) { ctx.fillStyle = pal[2] || pal[1]; const s2 = fit(ctx, sp.sub.toUpperCase(), '500 $px ' + CAPS, h * 0.17, w * 0.8); spaced(ctx, sp.sub.toUpperCase(), w / 2, h * 0.77, s2 * 0.18); }
  };
}
function paintHanging(sp) {
  const pal = sp.palette || ['#f0e2c0', '#2d3b36', '#b5532e'];
  return (ctx, w, h) => {
    ctx.fillStyle = pal[0]; ctx.beginPath(); ctx.roundRect(0, 0, w, h, w * 0.12); ctx.fill();
    grain(ctx, w, h, hashStr((sp.text || '') + 'h'), 0.05, 300);
    ctx.strokeStyle = pal[1]; ctx.lineWidth = w * 0.022; ctx.beginPath(); ctx.roundRect(w * 0.06, w * 0.06, w - w * 0.12, h - w * 0.12, w * 0.08); ctx.stroke();
    const txt = sp.text || sp.title || '';
    if (sp.emblem) drawEmblem(ctx, sp.emblem, w / 2, h * (txt ? 0.4 : 0.5), Math.min(w, h) * (txt ? 0.52 : 0.72), pal[2] || pal[1]);
    if (txt) {
      ctx.fillStyle = pal[1]; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const words = txt.split(' '); const lines = words.length > 2 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [txt];
      const base = sp.emblem ? 0.76 : 0.5; const lh = h * 0.15;
      lines.forEach((ln, i) => { fit(ctx, ln, 'italic 600 $px ' + SERIF, h * 0.17, w * 0.8); ctx.fillText(ln, w / 2, h * base + (i - (lines.length - 1) / 2) * lh); });
    }
  };
}
function paintChalk(sp) {
  return (ctx, w, h) => {
    ctx.fillStyle = '#20262a'; ctx.fillRect(0, 0, w, h);
    const r = new Rng(hashStr((sp.title || '') + 'c'));
    for (let i = 0; i < 60; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.012 + 0.03 * r.next()).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(r.f(0, w), r.f(0, h), r.f(20, 120), r.f(6, 30), r.f(0, 3), 0, 7); ctx.fill(); }
    ctx.strokeStyle = '#6b4a2f'; ctx.lineWidth = w * 0.045; ctx.strokeRect(0, 0, w, h);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let y = h * 0.14;
    if (sp.title) { ctx.fillStyle = sp.chalk || '#f4e9c9'; fit(ctx, sp.title, '600 $px ' + HAND, h * 0.13, w * 0.8); ctx.fillText(sp.title, w / 2, y); y += h * 0.07; ctx.fillRect(w * 0.2, y, w * 0.6, 2); y += h * 0.07; }
    const lines = sp.lines || []; const lh = Math.min(h * 0.1, (h * 0.9 - y) / Math.max(1, lines.length));
    const cols = ['#f1ede2', '#f6d27a', '#a9d8c8', '#f2a48f'];
    lines.forEach((ln, i) => { ctx.fillStyle = cols[i % 3 === 0 ? 0 : (i % cols.length)]; fit(ctx, ln, '500 $px ' + HAND, lh * 0.9, w * 0.84); ctx.fillText(ln, w / 2 + r.f(-3, 3), y + lh * (i + 0.5)); });
  };
}
function motif(ctx, kind, w, h, pal, r) {
  ctx.save();
  if (kind === 'flight') {           // the Spindle by night: a line of drifting lamps
    ctx.strokeStyle = pal[1]; ctx.globalAlpha = 0.35; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(w * 0.1, h * 0.62); ctx.lineTo(w * 0.9, h * 0.3); ctx.stroke(); ctx.globalAlpha = 1;
    for (let i = 0; i < 46; i++) { const t = r.next(); const x = w * (0.1 + 0.8 * t) + r.f(-10, 10), y = h * (0.62 - 0.32 * t) + r.f(-16, 16); ctx.fillStyle = pal[2] || pal[1]; ctx.globalAlpha = r.f(0.4, 1); ctx.beginPath(); ctx.arc(x, y, r.f(1.2, 3.6), 0, 7); ctx.fill(); }
  } else if (kind === 'dawn') {      // bands of colour rising
    const cols = [pal[2] || pal[1], mixHex(pal[2] || pal[1], pal[1], 0.5), pal[1]];
    for (let i = 0; i < 3; i++) { ctx.fillStyle = cols[i]; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(w / 2, h * 0.62, w * (0.42 - i * 0.11), Math.PI, 0); ctx.fill(); }
  } else if (kind === 'quiet') {     // a black thread, knotted
    ctx.strokeStyle = pal[1]; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w * 0.15, h * 0.45); ctx.bezierCurveTo(w * 0.4, h * 0.3, w * 0.45, h * 0.62, w * 0.55, h * 0.46); ctx.bezierCurveTo(w * 0.62, h * 0.34, w * 0.42, h * 0.36, w * 0.52, h * 0.5); ctx.bezierCurveTo(w * 0.6, h * 0.6, w * 0.7, h * 0.4, w * 0.85, h * 0.47); ctx.stroke();
  } else if (kind === 'feast') { drawEmblem(ctx, 'apple', w / 2, h * 0.46, w * 0.5, pal[2] || pal[1]); }
  else if (kind === 'table') {       // one long table, curving up at both ends
    ctx.strokeStyle = pal[2] || pal[1]; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(w * 0.06, h * 0.4); ctx.quadraticCurveTo(w / 2, h * 0.58, w * 0.94, h * 0.4); ctx.stroke();
    for (let i = 0; i < 15; i++) { const t = i / 14; const x = w * (0.08 + 0.84 * t), y = h * (0.4 + 0.36 * t * (1 - t)); ctx.fillStyle = pal[1]; ctx.beginPath(); ctx.arc(x, y - 9, 3.2, 0, 7); ctx.fill(); }
  } else if (EMBLEMS[kind]) drawEmblem(ctx, kind, w / 2, h * 0.46, w * 0.5, pal[2] || pal[1]);
  ctx.restore();
}
function paintPoster(sp) {
  const pal = sp.palette || ['#1b1f3a', '#f2c879', '#e8743b'];
  return (ctx, w, h) => {
    ctx.fillStyle = pal[0]; ctx.fillRect(0, 0, w, h);
    const r = new Rng(hashStr((sp.title || '') + 'p'));
    grain(ctx, w, h, r.i(1, 1e6), 0.05, 400);
    motif(ctx, sp.motif || 'drum', w, h, pal, r);
    ctx.fillStyle = pal[1]; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const title = sp.title || ''; const words = title.split(' ');
    const tl = words.length > 2 && title.length > 12 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [title];
    tl.forEach((ln, i) => { fit(ctx, ln, 'italic 600 $px ' + SERIF, h * 0.115, w * 0.86); ctx.fillText(ln, w / 2, h * (0.105 + i * 0.105)); });
    const lines = sp.lines || []; const y0 = h * 0.72, lh = Math.min(h * 0.055, h * 0.24 / Math.max(1, lines.length));
    lines.forEach((ln, i) => { const s = fit(ctx, ln.toUpperCase(), '500 $px ' + CAPS, lh * 0.8, w * 0.84); spaced(ctx, ln.toUpperCase(), w / 2, y0 + lh * (i + 0.5), s * 0.1); });
    ctx.strokeStyle = pal[1]; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.5; ctx.strokeRect(w * 0.045, w * 0.045, w - w * 0.09, h - w * 0.09); ctx.globalAlpha = 1;
  };
}
function paintNotice(sp) {
  return (ctx, w, h) => {
    ctx.fillStyle = sp.paper || '#efe6d2'; ctx.fillRect(0, 0, w, h); grain(ctx, w, h, hashStr((sp.title || '') + 'n'), 0.04, 200);
    ctx.fillStyle = '#2a2622'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    let y = h * 0.07;
    if (sp.title) { const s = fit(ctx, sp.title.toUpperCase(), '600 $px ' + CAPS, h * 0.085, w * 0.84); ctx.fillText(sp.title.toUpperCase(), w * 0.08, y); y += s * 1.25; ctx.fillRect(w * 0.08, y, w * 0.84, 1.5); y += h * 0.03; }
    const lines = sp.lines || []; const lh = Math.min(h * 0.075, (h * 0.93 - y) / Math.max(1, lines.length));
    lines.forEach((ln, i) => { fit(ctx, ln, (sp.hand ? '500 $px ' + HAND : '400 $px ' + SANS), lh * (sp.hand ? 0.95 : 0.74), w * 0.84); ctx.fillText(ln, w * 0.08, y + lh * i); });
    ctx.fillStyle = '#b5532e'; ctx.beginPath(); ctx.arc(w / 2, h * 0.03, Math.max(3, w * 0.022), 0, 7); ctx.fill();
  };
}
function paintStreet(sp) {
  const pal = sp.palette || ['#22302c', '#f1ead8'];
  return (ctx, w, h) => {
    ctx.fillStyle = pal[0]; ctx.beginPath(); ctx.roundRect(0, 0, w, h, h * 0.16); ctx.fill();
    ctx.strokeStyle = pal[1]; ctx.lineWidth = Math.max(1.5, h * 0.035); ctx.beginPath(); ctx.roundRect(h * 0.08, h * 0.08, w - h * 0.16, h - h * 0.16, h * 0.1); ctx.stroke();
    ctx.fillStyle = pal[1]; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const t = (sp.text || sp.title || '').toUpperCase();
    const s = fit(ctx, t, '600 $px ' + CAPS, h * (sp.sub ? 0.44 : 0.56), w * 0.72); spaced(ctx, t, w / 2, h * (sp.sub ? 0.4 : 0.52), s * 0.16);
    if (sp.sub) { const s2 = fit(ctx, sp.sub.toUpperCase(), '500 $px ' + CAPS, h * 0.2, w * 0.8); spaced(ctx, sp.sub.toUpperCase(), w / 2, h * 0.75, s2 * 0.2); }
  };
}
function paintPlate(sp) {
  return (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#c9a45c'); g.addColorStop(0.5, '#e2c486'); g.addColorStop(1, '#b08a45');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); grain(ctx, w, h, hashStr((sp.text || '') + 'b'), 0.06, 250);
    ctx.fillStyle = '#3a2c14'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const t = sp.text || sp.title || ''; const lines = [t].concat(sp.lines || []); const lh = h * 0.8 / lines.length;
    lines.forEach((ln, i) => { fit(ctx, ln, (i === 0 ? '600 $px ' + SERIF : '500 $px ' + CAPS), lh * (i === 0 ? 0.8 : 0.6), w * 0.86); ctx.fillText(i === 0 ? ln : ln.toUpperCase(), w / 2, h * 0.1 + lh * (i + 0.5)); });
    for (const p of [[0.05, 0.12], [0.95, 0.12], [0.05, 0.88], [0.95, 0.88]]) { ctx.fillStyle = '#7a5f2c'; ctx.beginPath(); ctx.arc(w * p[0], h * p[1], Math.max(2, h * 0.035), 0, 7); ctx.fill(); }
  };
}
function paintLabel(sp) {
  return (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = sp.ink || '#2b2a26'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = [sp.text || sp.title || ''].concat(sp.lines || []); const lh = h / lines.length;
    lines.forEach((ln, i) => { const s = fit(ctx, ln.toUpperCase(), '600 $px ' + CAPS, lh * 0.74, w * 0.92); spaced(ctx, ln.toUpperCase(), w / 2, lh * (i + 0.5), s * 0.12); });
  };
}
function paintBoard(sp) {
  const pal = sp.palette || ['#16201d', '#f3e6c8', '#3fe0d0'];
  return (ctx, w, h) => {
    ctx.fillStyle = pal[0]; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = pal[1]; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    let y = h * 0.1;
    if (sp.title) { fit(ctx, sp.title, 'italic 600 $px ' + SERIF, h * 0.13, w * 0.88); ctx.fillText(sp.title, w * 0.06, y); y += h * 0.1; ctx.fillStyle = pal[2]; ctx.fillRect(w * 0.06, y, w * 0.88, 2); y += h * 0.05; }
    const lines = sp.lines || []; const lh = Math.min(h * 0.1, (h * 0.95 - y) / Math.max(1, lines.length));
    lines.forEach((ln, i) => {
      const parts = String(ln).split('|'); ctx.fillStyle = i % 2 ? pal[1] : mixHex(pal[1], pal[0], 0.12);
      const s = fit(ctx, parts[0].toUpperCase(), '500 $px ' + CAPS, lh * 0.66, w * (parts.length > 1 ? 0.6 : 0.88)); ctx.textAlign = 'left'; ctx.fillText(parts[0].toUpperCase(), w * 0.06, y + lh * (i + 0.5));
      if (parts[1]) { ctx.textAlign = 'right'; ctx.fillStyle = pal[2]; ctx.font = '600 ' + s + 'px ' + CAPS; ctx.fillText(parts[1].toUpperCase(), w * 0.94, y + lh * (i + 0.5)); }
    });
  };
}
function paintBanner(sp) {
  const pal = sp.palette || ['#c9552e', '#f6ead0'];
  return (ctx, w, h) => {
    ctx.fillStyle = pal[0]; ctx.fillRect(0, 0, w, h); grain(ctx, w, h, hashStr((sp.text || '') + 'bn'), 0.07, 500);
    ctx.fillStyle = pal[1]; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const t = sp.text || sp.title || '';
    if (w > h) { fit(ctx, t, 'italic 600 $px ' + SERIF, h * 0.6, w * 0.88); ctx.fillText(t, w / 2, h * 0.52); }
    else { const words = t.split(' '); const lh = h * 0.8 / Math.max(1, words.length); words.forEach((wd, i) => { fit(ctx, wd, 'italic 600 $px ' + SERIF, lh * 0.8, w * 0.84); ctx.fillText(wd, w / 2, h * 0.1 + lh * (i + 0.5)); }); }
  };
}
function paintLetters(sp) {
  return (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = (sp.palette && sp.palette[0]) || '#f1e6c9'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const t = sp.text || sp.title || '';
    if (sp.font === 'caps') { const s = fit(ctx, t.toUpperCase(), '600 $px ' + CAPS, h * 0.8, w * 0.9); spaced(ctx, t.toUpperCase(), w / 2, h * 0.54, s * 0.12); }
    else { fit(ctx, t, 'italic 600 $px ' + SERIF, h * 0.86, w * 0.96); ctx.fillText(t, w / 2, h * 0.5); }
  };
}
// default physical size (metres) and pixel density for each kind
const KIND = {
  fascia: { w: 3.0, h: 0.5, ppm: 190, paint: paintFascia },
  hanging: { w: 0.6, h: 0.6, ppm: 330, paint: paintHanging },
  chalk: { w: 0.62, h: 0.9, ppm: 330, paint: paintChalk },
  poster: { w: 0.6, h: 0.86, ppm: 350, paint: paintPoster },
  notice: { w: 0.3, h: 0.42, ppm: 480, paint: paintNotice },
  street: { w: 0.9, h: 0.2, ppm: 360, paint: paintStreet },
  plate: { w: 0.32, h: 0.14, ppm: 560, paint: paintPlate },
  label: { w: 0.5, h: 0.16, ppm: 300, paint: paintLabel, cutout: true },
  board: { w: 1.6, h: 1.1, ppm: 230, paint: paintBoard },
  banner: { w: 0.7, h: 2.2, ppm: 170, paint: paintBanner },
  letters: { w: 2.4, h: 0.4, ppm: 230, paint: paintLetters, cutout: true },
};

// Draw a spec into the atlas (cached by content). Returns the atlas rect plus { wM, hM, cutout }.
export function signRect(atlas, spec, wM, hM) {
  const K = KIND[spec.kind] || KIND.notice;
  const w = wM || spec.w || K.w, h = hM || spec.h || K.h;
  const ppm = Math.min(K.ppm * 0.85, 820 / Math.max(w, h), Math.sqrt(260000 / (w * h)));        // no sign takes more than about a quarter of a megapixel
  const key = JSON.stringify([spec.kind, spec.text, spec.title, spec.sub, spec.lines, spec.palette, spec.emblem, spec.motif, spec.font, Math.round(w * 100), Math.round(h * 100)]);
  const r = atlas.add(Math.round(w * ppm), Math.round(h * ppm), K.paint(spec), key);
  return { rect: r, w, h, cutout: !!K.cutout };
}

// Place a sign. (x, y, z) is the centre of its face. o: { face: 'x' | 'X' | 'z' | 'Z' (the way it looks; default 'Z'), w, h (metres; defaults by kind),
//   glow (emissive strength, for lit signs), night (lit only at night), board: false to skip the backing, back: '#hex' (backing colour), tier, level, double (hanging signs: both faces) }
export function sign(s, spec, x, y, z, o = {}) {
  const game = s.world.game; const atlas = game && game.atlas; if (!atlas) return null;
  const R = signRect(atlas, spec, o.w, o.h), w = R.w, h = R.h, r = R.rect, g = s.g;
  const faces = o.double ? [o.face || 'Z', flipFace(o.face || 'Z')] : [o.face || 'Z'];
  const t = o.thick === undefined ? 0.022 : o.thick;
  for (const f of faces) {
    const nx = f === 'X' ? 1 : f === 'x' ? -1 : 0, nz = f === 'Z' ? 1 : f === 'z' ? -1 : 0;
    const rx = nz, rz = -nx;                // "right" along the face as seen from the front
    const off = o.double ? t / 2 + 0.002 : 0.003;
    const cx = x + nx * off, cz = z + nz * off;
    g.atlas(r.page, { emissive: o.glow || 0, night: !!o.night, lamp: o.glow && !o.night && o.lamp !== false, rough: o.rough });
    if (R.cutout) g._mat[2] |= 16;
    const p0 = [cx - rx * w / 2, y - h / 2, cz - rz * w / 2], p1 = [cx + rx * w / 2, y - h / 2, cz + rz * w / 2], p2 = [cx + rx * w / 2, y + h / 2, cz + rz * w / 2], p3 = [cx - rx * w / 2, y + h / 2, cz - rz * w / 2];
    g.quad(p0, p1, p2, p3, { uv: [r.u0, r.v1, r.u1, r.v0] });
  }
  if (o.board !== false && !R.cutout) {
    const f = o.face || 'Z'; const alongX = f === 'Z' || f === 'z'; const sg = f === 'X' || f === 'Z' ? 1 : -1;
    g.mat('wood', o.back || '#3a2d22');
    const m = o.margin === undefined ? 0.012 : o.margin;
    if (o.double) { if (alongX) g.box(x - w / 2 - m, y - h / 2 - m, z - t / 2, x + w / 2 + m, y + h / 2 + m, z + t / 2); else g.box(x - t / 2, y - h / 2 - m, z - w / 2 - m, x + t / 2, y + h / 2 + m, z + w / 2 + m); }
    else if (alongX) g.box(x - w / 2 - m, y - h / 2 - m, z - sg * t, x + w / 2 + m, y + h / 2 + m, z, { faces: 'xXyY' + (sg > 0 ? 'Z' : 'z') });
    else g.box(x - sg * t, y - h / 2 - m, z - w / 2 - m, x, y + h / 2 + m, z + w / 2 + m, { faces: 'zZyY' + (sg > 0 ? 'X' : 'x') });
  }
  s.flush({ tier: o.tier || (Math.max(w, h) > 1.2 ? 's' : 'd'), level: o.level });
  return R;
}
function flipFace(f) { return f === 'X' ? 'x' : f === 'x' ? 'X' : f === 'Z' ? 'z' : 'Z'; }
