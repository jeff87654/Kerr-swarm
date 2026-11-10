// Parts for the Candlewick school and its long hall: the school's own furniture (desks, low tables, cushions, coats on
// pegs, satchels, spinballs, the ball rack, goal rings, a raft on a stand), and the painters for the things children
// and teachers make: paintings, the name wall, the slate, the scoreboard, the saying and the floor words.
import * as THREE from 'three';
import { defineProp } from '../world/props.js';
import { Geo, MeshBuf } from '../world/meshbuilder.js';
import { Rng, mixHex, shadeHex, hashStr } from '../core/util.js';
import { CAST } from '../content/cast.js';

export const schoolParts = true;

export const PAL = {
  plaster: '#f1e4c8', cream: '#f6ecd6', teal: '#2f7f86', tealDark: '#1f5a60', red: '#e2553a', saffron: '#e9b23c',
  indigo: '#2f3f7a', leaf: '#7cab4e', plum: '#8a4a6a', wood: '#c08a52', woodDark: '#6b4a2f', maple: '#d8b07c', sky: '#9fd0d4',
};
export const BRIGHT = [PAL.red, PAL.saffron, PAL.teal, PAL.indigo, PAL.leaf, PAL.plum, '#d9534f', '#5fb3b3', '#f08a4b'];
// the four houses (new: the game's): Wick red, Ladle saffron, Thread teal, Lamp indigo
export const HOUSES = [['WICK', PAL.red], ['LADLE', PAL.saffron], ['THREAD', PAL.teal], ['LAMP', PAL.indigo]];

export const SERIF = "'Cormorant Garamond', Georgia, serif";
export const CAPS = "'Barlow Condensed', 'Arial Narrow', sans-serif";
export const SANS = "'Barlow', Arial, sans-serif";
export const HAND = "'Caveat', 'Segoe Script', cursive";

// ---------------------------------------------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------------------------------------------
export function speaker(id) {
  const c = CAST[id]; if (!c) return id;
  return { name: c.short || c.name, colour: (c.look && (c.look.lining || c.look.top)) || '#FFE3A8' };
}
export async function talk(game, who, lines) {
  if (!game.ui) return;
  game.busy++;
  try { await game.ui.say(CAST[who] ? speaker(who) : who, lines); } finally { game.busy--; }
}
export function found(game, id) { if (game.journal && game.journal.find) game.journal.find(id); }
export function custom(game, term) { if (game.journal && game.journal.custom) game.journal.custom(term); }

// A mesh of its own that can be hidden after the world is built (mesh.userData.hidden = true).
export function dynMesh(s, origin, draw, o = {}) {
  const W = s.world, g = new Geo(new MeshBuf(512, 1024));
  g.push(); g.move(-origin[0], -origin[1], -origin[2]); draw(g); g.pop();
  if (!g.buf.ni) return null;
  const mesh = new THREE.Mesh(g.buf.toGeometry(), W.mats.opaque);
  W.addRenderable(mesh, { frame: s.frame, origin: origin.slice(), center: [0, 0, 0], radius: o.radius || 2, far: o.far || 60, caster: false, scope: s });
  s.meshes.push(mesh);
  mesh.userData.hidden = !!o.hidden;
  return mesh;
}

// A rect of the sign atlas painted by draw(ctx, w, h) and set on an upright quad facing `face`, centred on (x, y, z).
export function painted(s, key, wM, hM, ppm, draw, x, y, z, o = {}) {
  const atlas = s.world.game && s.world.game.atlas; if (!atlas) return null;
  const r = atlas.add(Math.round(wM * ppm), Math.round(hM * ppm), draw, key);
  const g = s.g, f = o.face || 'Z';
  const nx = f === 'X' ? 1 : f === 'x' ? -1 : 0, nz = f === 'Z' ? 1 : f === 'z' ? -1 : 0;
  const rx = nz, rz = -nx; const off = o.off === undefined ? 0.003 : o.off;
  const cx = x + nx * off, cz = z + nz * off, w = wM, h = hM;
  const tl = o.tilt || 0, c = Math.cos(tl), sn = Math.sin(tl);
  const P = (u, v) => [cx + rx * (u * c - v * sn), y + (u * sn + v * c), cz + rz * (u * c - v * sn)];
  g.atlas(r.page, { emissive: o.glow || 0, lamp: !!o.glow, rough: o.rough });
  if (o.cutout) g._mat[2] |= 16;
  g.quad(P(-w / 2, -h / 2), P(w / 2, -h / 2), P(w / 2, h / 2), P(-w / 2, h / 2), { uv: [r.u0, r.v1, r.u1, r.v0] });
  s.flush({ tier: o.tier || 's', level: o.level, cast: false });
  return r;
}
// The same, laid flat on the floor at height y. The picture's top points toward +z when rot = 0 (read from the -z side
// looking +z... its right hand side toward -x); rot turns it about y.
export function floorPaint(s, key, wM, dM, ppm, draw, cx, y, cz, o = {}) {
  const atlas = s.world.game && s.world.game.atlas; if (!atlas) return null;
  const r = atlas.add(Math.round(wM * ppm), Math.round(dM * ppm), draw, key);
  const g = s.g, a = o.rot || 0, c = Math.cos(a), sn = Math.sin(a);
  // local: u (image right) = -x, v (image up) = +z, then turned by a
  const P = (u, v) => { const lx = -u, lz = v; return [cx + lx * c + lz * sn, y, cz - lx * sn + lz * c]; };
  g.atlas(r.page, { rough: o.rough === undefined ? 0.55 : o.rough });
  g._mat[2] |= 16;
  g.quad(P(-wM / 2, -dM / 2), P(wM / 2, -dM / 2), P(wM / 2, dM / 2), P(-wM / 2, dM / 2), { uv: [r.u0, r.v1, r.u1, r.v0] });
  s.flush({ tier: 's', cast: false });
  return r;
}

function fit(ctx, text, font, size, maxW, min = 5) {
  let sz = size; ctx.font = font.replace('$', sz);
  while (sz > min && ctx.measureText(text).width > maxW) { sz -= 1; ctx.font = font.replace('$', sz); }
  return sz;
}
function grain(ctx, w, h, seed, amt, n) {
  const r = new Rng(seed);
  for (let i = 0; i < n; i++) { ctx.fillStyle = r.chance(0.5) ? 'rgba(255,255,255,' + (amt * r.next()).toFixed(3) + ')' : 'rgba(0,0,0,' + (amt * r.next()).toFixed(3) + ')'; ctx.fillRect(r.f(0, w), r.f(0, h), r.f(1, 10), r.f(0.5, 2)); }
}
// a wobbly crayon stroke through points
function crayon(ctx, pts, col, wd, r) {
  ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let k = 0; k < 2; k++) {
    ctx.globalAlpha = k ? 0.55 : 0.9; ctx.beginPath();
    pts.forEach((p, i) => { const x = p[0] + r.f(-1, 1) * wd * 0.4, y = p[1] + r.f(-1, 1) * wd * 0.4; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function blob(ctx, x, y, rx, ry, col, r) {
  ctx.fillStyle = col; ctx.globalAlpha = 0.88; ctx.beginPath();
  for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI * 2, k = 1 + r.f(-0.12, 0.12); ctx.lineTo(x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k); }
  ctx.fill(); ctx.globalAlpha = 1;
}
function person(ctx, x, y, s, col, skin, r) {
  blob(ctx, x, y - s * 0.95, s * 0.2, s * 0.22, skin, r);
  crayon(ctx, [[x, y - s * 0.72], [x, y - s * 0.25]], col, s * 0.22, r);
  crayon(ctx, [[x - s * 0.3, y - s * 0.55], [x, y - s * 0.62], [x + s * 0.3, y - s * 0.55]], col, s * 0.08, r);
  crayon(ctx, [[x - s * 0.12, y], [x, y - s * 0.3], [x + s * 0.12, y]], '#3a3a44', s * 0.08, r);
}

// ---------------------------------------------------------------------------------------------------------------
// Children's paintings. Nobody here has seen an animal, a sky or a star: they paint the Hollow, the far bank, the
// sunline, cabs, their aunts, and what they think the River looks like.
// ---------------------------------------------------------------------------------------------------------------
export const PAINTINGS = [
  { kind: 'hollow', by: 'Pip 7', paper: '#fbf3e0' },
  { kind: 'aunts', by: 'Lumi 6', paper: '#fdeee4', names: ['MUM', 'DAD', 'AUNT BO', 'AUNT KEMI', 'AUNT ROS'] },
  { kind: 'river', by: 'Esi 10', paper: '#1d1730', label: 'THE RIVER. I SAW IT.' },
  { kind: 'cab', by: 'Jon 6', paper: '#eef4f2' },
  { kind: 'sunline', by: 'Nico 5', paper: '#f7f1dc' },
  { kind: 'farbank', by: 'Tomas 7', paper: '#eaf2f6' },
  { kind: 'river2', by: 'Mira 7', paper: '#f3ead8', label: 'what the River is like' },
  { kind: 'table', by: 'Noor 6', paper: '#fbf0dc' },
  { kind: 'aunts2', by: 'Kit 5', paper: '#f1f6e6', names: ['ME', 'AUNT', 'AUNT', 'AUNT'] },
  { kind: 'glide', by: 'Bea 7', paper: '#eef0fa' },
  { kind: 'apple', by: 'Sol 6', paper: '#fdf3e4' },
  { kind: 'hollow2', by: 'Yuki 7', paper: '#f4f0e2' },
  { kind: 'flight', by: 'Ines 7', paper: '#232849' },
  { kind: 'cab2', by: 'Dev 5', paper: '#fff6e8' },
];
export function drawPainting(p, seed) {
  return (ctx, w, h) => {
    const r = new Rng(seed || hashStr(p.kind + p.by));
    ctx.fillStyle = p.paper || '#fbf3e0'; ctx.fillRect(0, 0, w, h);
    const u = Math.min(w, h) / 100;
    const k = p.kind;
    if (k === 'hollow' || k === 'hollow2') {
      // the floor curving up both sides, the lake, trees, the sunline across, the far bank upside down at the top
      ctx.fillStyle = '#7cb55a'; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.moveTo(0, h * 0.45); ctx.quadraticCurveTo(w / 2, h * 1.15, w, h * 0.45); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, h * 0.3); ctx.quadraticCurveTo(w / 2, -h * 0.25, w, h * 0.3); ctx.lineTo(w, 0); ctx.lineTo(0, 0); ctx.fill(); ctx.globalAlpha = 1;
      blob(ctx, w * 0.62, h * 0.86, w * 0.14, h * 0.06, '#3f8fc8', r);
      blob(ctx, w * 0.4, h * 0.12, w * 0.1, h * 0.04, '#3f8fc8', r);
      crayon(ctx, [[w * 0.04, h * 0.38], [w * 0.96, h * 0.38]], '#f4c430', 4 * u, r);
      for (let i = 0; i < 5; i++) { const x = w * (0.15 + i * 0.16); crayon(ctx, [[x, h * 0.9], [x, h * 0.78]], '#6b4a2f', 2 * u, r); blob(ctx, x, h * 0.74, 5 * u, 5 * u, '#3f7a3a', r); }
      for (let i = 0; i < 6; i++) { const x = w * (0.1 + i * 0.16); crayon(ctx, [[x, h * 0.06], [x, h * 0.16]], '#6b4a2f', 1.6 * u, r); blob(ctx, x, h * 0.19, 4 * u, 4 * u, '#3f7a3a', r); }
      if (k === 'hollow2') person(ctx, w * 0.3, h * 0.88, 16 * u, '#e2553a', '#8a5a3c', r);
    } else if (k === 'aunts' || k === 'aunts2') {
      const n = p.names.length;
      for (let i = 0; i < n; i++) {
        const x = w * (0.12 + 0.76 * i / (n - 1)), s = (i === 0 && k === 'aunts2' ? 22 : 34) * u;
        person(ctx, x, h * 0.78, s, BRIGHT[(i * 3 + 1) % BRIGHT.length], ['#c48a62', '#8a5a3c', '#e0b08a', '#5a3a28'][i % 4], r);
        if (i < n - 1) crayon(ctx, [[x + s * 0.3, h * 0.78 - s * 0.55], [w * (0.12 + 0.76 * (i + 1) / (n - 1)) - s * 0.3, h * 0.78 - s * 0.55]], '#c48a62', 1.4 * u, r);
        ctx.fillStyle = '#2a2622'; fit(ctx, p.names[i], '600 $px ' + HAND, 9 * u, w * 0.2); ctx.textAlign = 'center'; ctx.fillText(p.names[i], x, h * 0.93);
      }
      crayon(ctx, [[w * 0.1, h * 0.14], [w * 0.9, h * 0.14]], '#f4c430', 3 * u, r);
    } else if (k === 'river' || k === 'river2') {
      // a band of stars right across, brown-violet and pale gold, dark holes where the rafts are
      if (k === 'river2') { ctx.fillStyle = '#2a2236'; ctx.globalAlpha = 0.85; ctx.fillRect(w * 0.04, h * 0.12, w * 0.92, h * 0.7); ctx.globalAlpha = 1; }
      ctx.save(); ctx.translate(w / 2, h * 0.47); ctx.rotate(-0.22);
      const gr = ctx.createLinearGradient(0, -h * 0.2, 0, h * 0.2); gr.addColorStop(0, 'rgba(110,70,110,0)'); gr.addColorStop(0.5, 'rgba(150,100,120,0.85)'); gr.addColorStop(1, 'rgba(110,70,110,0)');
      ctx.fillStyle = gr; ctx.fillRect(-w * 0.7, -h * 0.2, w * 1.4, h * 0.4);
      for (let i = 0; i < 160; i++) { const x = r.f(-w * 0.6, w * 0.6), y = r.f(-1, 1) * r.f(0, 1) * h * 0.2; ctx.fillStyle = r.chance(0.15) ? '#f2a05a' : r.chance(0.5) ? '#f4e6b0' : '#fff4d6'; ctx.beginPath(); ctx.arc(x, y, r.f(0.5, 1.8) * u, 0, 7); ctx.fill(); }
      for (let i = 0; i < 4; i++) { ctx.fillStyle = k === 'river' ? '#1d1730' : '#2a2236'; blob(ctx, r.f(-w * 0.4, w * 0.4), r.f(-h * 0.08, h * 0.08), r.f(4, 9) * u, r.f(3, 6) * u, k === 'river' ? '#120e1c' : '#1a1522', r); }
      ctx.restore();
      if (p.label) { ctx.fillStyle = k === 'river' ? '#f4e6b0' : '#2a2622'; fit(ctx, p.label, '600 $px ' + HAND, 10 * u, w * 0.86); ctx.textAlign = 'center'; ctx.fillText(p.label, w / 2, h * 0.92); }
    } else if (k === 'cab' || k === 'cab2') {
      ctx.fillStyle = '#9aa6a8'; ctx.fillRect(w * 0.3, 0, w * 0.4, h);
      ctx.fillStyle = k === 'cab' ? '#e2553a' : '#2f7f86'; ctx.globalAlpha = 0.92; ctx.beginPath(); ctx.roundRect(w * 0.33, h * 0.32, w * 0.34, h * 0.4, 8 * u); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = '#cfe8ee'; ctx.fillRect(w * 0.37, h * 0.38, w * 0.26, h * 0.16);
      for (let i = 0; i < (k === 'cab' ? 3 : 2); i++) blob(ctx, w * (0.42 + i * 0.08), h * 0.47, 3 * u, 3.4 * u, '#8a5a3c', r);
      crayon(ctx, [[w * 0.5, 0], [w * 0.5, h * 0.32]], '#3a3a44', 1.5 * u, r);
      ctx.fillStyle = '#2a2622'; fit(ctx, k === 'cab' ? 'GOING TO SEE GRAN' : 'CAB', '600 $px ' + HAND, 9 * u, w * 0.9); ctx.textAlign = 'center'; ctx.fillText(k === 'cab' ? 'GOING TO SEE GRAN' : 'CAB', w / 2, h * 0.88);
    } else if (k === 'sunline') {
      crayon(ctx, [[0, h * 0.45], [w, h * 0.45]], '#f4c430', 9 * u, r);
      for (let i = 0; i < 12; i++) { const x = w * (i + 0.5) / 12; crayon(ctx, [[x, h * 0.36], [x + r.f(-4, 4) * u, h * 0.2]], '#f08a4b', 2 * u, r); crayon(ctx, [[x, h * 0.54], [x + r.f(-4, 4) * u, h * 0.7]], '#f08a4b', 2 * u, r); }
      ctx.fillStyle = '#7cb55a'; ctx.fillRect(0, h * 0.86, w, h * 0.14); ctx.fillRect(0, 0, w, h * 0.06);
    } else if (k === 'farbank') {
      ctx.fillStyle = '#7cb55a'; ctx.fillRect(0, h * 0.82, w, h * 0.18); ctx.fillRect(0, 0, w, h * 0.2);
      for (let i = 0; i < 4; i++) { const x = w * (0.14 + i * 0.24); ctx.fillStyle = BRIGHT[i + 2]; ctx.fillRect(x - 7 * u, h * 0.2, 14 * u, 12 * u); ctx.beginPath(); ctx.moveTo(x - 9 * u, h * 0.2 + 12 * u); ctx.lineTo(x + 9 * u, h * 0.2 + 12 * u); ctx.lineTo(x, h * 0.2 + 20 * u); ctx.fill(); }
      person(ctx, w * 0.5, h * 0.82, 26 * u, '#2f3f7a', '#e0b08a', r);
      crayon(ctx, [[w * 0.56, h * 0.6], [w * 0.62, h * 0.48]], '#e0b08a', 2 * u, r);
      ctx.fillStyle = '#2a2622'; fit(ctx, 'THEY ARE UPSIDE DOWN', '600 $px ' + HAND, 8 * u, w * 0.8); ctx.textAlign = 'center'; ctx.fillText('THEY ARE UPSIDE DOWN', w / 2, h * 0.5);
    } else if (k === 'table') {
      crayon(ctx, [[w * 0.04, h * 0.42], [w * 0.5, h * 0.62], [w * 0.96, h * 0.42]], '#8a5a3c', 5 * u, r);
      for (let i = 0; i < 9; i++) { const t = i / 8, x = w * (0.08 + 0.84 * t), y = h * (0.42 + 0.8 * t * (1 - t)); blob(ctx, x, y - 8 * u, 3.5 * u, 3.8 * u, ['#c48a62', '#8a5a3c', '#e0b08a', '#5a3a28'][i % 4], r); crayon(ctx, [[x, y - 4 * u], [x, y + 6 * u]], BRIGHT[i % BRIGHT.length], 4 * u, r); }
      ctx.fillStyle = '#2a2622'; fit(ctx, 'RAMEN DAY', '600 $px ' + HAND, 10 * u, w * 0.8); ctx.textAlign = 'center'; ctx.fillText('RAMEN DAY', w / 2, h * 0.18);
    } else if (k === 'glide') {
      blob(ctx, w * 0.5, h * 0.5, w * 0.2, h * 0.12, '#e9b23c', r);
      ctx.fillStyle = '#26323a'; ctx.fillRect(w * 0.38, h * 0.46, w * 0.24, h * 0.06);
      for (let i = 0; i < 5; i++) crayon(ctx, [[w * (0.2 - i * 0.03), h * (0.38 + i * 0.06)], [w * (0.06 - i * 0.02), h * (0.38 + i * 0.06)]], '#9aa6a8', 1.5 * u, r);
      ctx.fillStyle = '#2a2622'; fit(ctx, 'FALLING TO TANSY', '600 $px ' + HAND, 9 * u, w * 0.85); ctx.textAlign = 'center'; ctx.fillText('FALLING TO TANSY', w / 2, h * 0.86);
    } else if (k === 'apple') {
      blob(ctx, w * 0.5, h * 0.48, w * 0.24, h * 0.3, '#f3e7c0', r);
      ctx.strokeStyle = '#d9534f'; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.48, w * 0.25, h * 0.31, 0, 0, 7); ctx.stroke();
      ctx.fillStyle = '#6b4a2f'; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; ctx.beginPath(); ctx.ellipse(w * 0.5 + Math.cos(a) * 9 * u, h * 0.48 + Math.sin(a) * 9 * u, 4 * u, 2 * u, a, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#2a2622'; fit(ctx, 'THE STAR INSIDE', '600 $px ' + HAND, 9 * u, w * 0.85); ctx.textAlign = 'center'; ctx.fillText('THE STAR INSIDE', w / 2, h * 0.92);
    } else if (k === 'flight') {
      crayon(ctx, [[0, h * 0.5], [w, h * 0.5]], '#3a4070', 3 * u, r);
      for (let i = 0; i < 26; i++) { const x = r.f(0.05, 0.95) * w, y = h * 0.5 + r.f(-0.3, 0.3) * h; ctx.fillStyle = '#f4c46b'; ctx.beginPath(); ctx.arc(x, y, r.f(1.2, 2.6) * u, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#f4e6b0'; fit(ctx, 'THE LONG FLIGHT', '600 $px ' + HAND, 9 * u, w * 0.85); ctx.textAlign = 'center'; ctx.fillText('THE LONG FLIGHT', w / 2, h * 0.92);
    }
    // the painter's name, in the corner, in pencil
    ctx.fillStyle = (p.paper === '#1d1730' || p.paper === '#232849') ? '#d8d0c0' : '#4a4038'; fit(ctx, p.by, '500 $px ' + HAND, 8 * u, w * 0.4); ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.fillText(p.by, w * 0.95, h * 0.97);
    grain(ctx, w, h, seed || 3, 0.04, 60);
  };
}

// ---------------------------------------------------------------------------------------------------------------
// The name wall: every child at the school, each over the name of the person whose share they carry.
// ---------------------------------------------------------------------------------------------------------------
const GIVEN = ['Pip', 'Esi', 'Rafe', 'Lumi', 'Tavi', 'Mira', 'Jon', 'Ada', 'Noor', 'Kit', 'Bea', 'Sol', 'Yuki', 'Ines', 'Dev', 'Tomas', 'Oskar', 'Amara', 'Lio', 'Hana', 'Ravi', 'Femi', 'Ilse', 'Tova', 'Wynn', 'Jessa', 'Kofi', 'Mei', 'Arlo', 'Zara',
  'Brin', 'Lena', 'Omar', 'Suki', 'Nils', 'Abeni', 'Cato', 'Priya', 'Ezra', 'Maren', 'Idris', 'Lotte', 'Yara', 'Fen', 'Ottoline', 'Rumi', 'Ansel', 'Dalia', 'Hugo', 'Saoirse', 'Kenji', 'Aiko', 'Matteo', 'Nia', 'Elio', 'Tamsin', 'Bo', 'Inez', 'Rook', 'Sefa'];
const FAMILY = ['Halloran', 'Oyelaran', 'Castellane', 'Brennan', 'Okafor', 'Lindqvist', 'Asante', 'Ruiz', 'Duarte', 'Marr', 'Tegan', 'Vasquez', 'Achebe', 'Moreau', 'Novak', 'Sato', 'Bergström', 'Mensah', 'Kowal', 'Ferro',
  'Quist', 'Iyer', 'Haddad', 'Nakamura', 'Okonjo', 'Fane', 'Brandvold', 'Pellier', 'Abara', 'Soto', 'Lund', 'Varga', 'Adeyemi', 'Rossi', 'Kaur', 'Holm', 'Diallo', 'Rahman', 'Silva', 'Tanaka'];
export function schoolNames(n, seed) {
  const r = new Rng(seed || 77); const out = [];
  const fixed = [['Pip Halloran', 'Philippa Rowe'], ['Esi Halloran', 'Esi Marr'], ['Rafe Oyelaran', 'Rafael Dunne'], ['Lumi Castellane', 'Lumi Sato'], ['Tavi Brennan', 'Octavia Brennan']];
  for (const f of fixed) out.push(f);
  while (out.length < n) {
    const gn = r.pick(GIVEN), fn = r.pick(FAMILY);
    // most are named for the dead whose share they carry, so the first names often match
    const dead = (r.chance(0.6) ? gn : r.pick(GIVEN)) + ' ' + r.pick(FAMILY);
    out.push([gn + ' ' + fn, dead]);
  }
  return out;
}
export function drawNameWall(names, cols, rows) {
  return (ctx, w, h) => {
    ctx.fillStyle = '#2f5d5a'; ctx.fillRect(0, 0, w, h);
    const r = new Rng(9); const cw = w / cols, ch = h / rows;
    const tiles = ['#f6ecd6', '#f3e2c0', '#efe6d2', '#f8eedb', '#ecdcc0'];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = j * cols + i; if (k >= names.length) break;
      const x = i * cw, y = j * ch;
      ctx.fillStyle = r.pick(tiles); ctx.fillRect(x + 1.5, y + 1.5, cw - 3, ch - 3);
      ctx.fillStyle = BRIGHT[(i + j * 3) % BRIGHT.length]; ctx.globalAlpha = 0.85; ctx.fillRect(x + 1.5, y + 1.5, cw - 3, 2.5); ctx.globalAlpha = 1;
      const nm = names[k];
      ctx.fillStyle = '#2a2622'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      fit(ctx, nm[0], '600 $px ' + SERIF, ch * 0.42, cw * 0.9); ctx.fillText(nm[0], x + cw / 2, y + ch * 0.42);
      ctx.fillStyle = '#6a5a4a'; fit(ctx, 'for ' + nm[1], 'italic 500 $px ' + SERIF, ch * 0.26, cw * 0.88); ctx.fillText('for ' + nm[1], x + cw / 2, y + ch * 0.76);
    }
  };
}

// ---------------------------------------------------------------------------------------------------------------
// The slate: today's lesson, the bottom half of yesterday's still showing where the cloth missed.
// ---------------------------------------------------------------------------------------------------------------
export const SLATE = {
  title: 'Why a dropped cup lands anti',
  lines: [
    'The cup keeps the speed it had on the table.',
    'The floor is further out, so it goes round faster.',
    'The floor gets there first. The cup lands anti.',
    'From 1 m on deck 16:  drift = (2h)^1.5 ÷ (3√r)',
    '= 2.83 ÷ (3 × 54.2) = 0.017 m.  About 2 cm.',
  ],
  ghost: ['Spin sinks: 2 × 0.0572 × 13 = 1.5', 'a sixth of your weight', 'Anti floats: the same, taken off'],
};
export function drawSlate() {
  return (ctx, w, h) => {
    ctx.fillStyle = '#1f2624'; ctx.fillRect(0, 0, w, h);
    const r = new Rng(41);
    for (let i = 0; i < 70; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.01 + 0.028 * r.next()).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(r.f(0, w), r.f(0, h), r.f(20, 140), r.f(6, 26), r.f(-0.3, 0.3), 0, 7); ctx.fill(); }
    // the cloth's sweeps across the right-hand side, with yesterday's sum still faint under them
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(240,235,220,0.16)';
    SLATE.ghost.forEach((ln, i) => { fit(ctx, ln, '500 $px ' + HAND, h * 0.085, w * 0.36); ctx.fillText(ln, w * 0.6, h * (0.62 + i * 0.11)); });
    for (let i = 0; i < 9; i++) { ctx.fillStyle = 'rgba(200,205,200,' + (0.05 + 0.05 * r.next()).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(w * r.f(0.6, 0.95), h * r.f(0.5, 0.95), w * r.f(0.08, 0.18), h * r.f(0.04, 0.09), r.f(-0.4, 0.4), 0, 7); ctx.fill(); }
    // today's lesson, in good chalk
    ctx.fillStyle = '#f4ecd2'; fit(ctx, SLATE.title, '600 $px ' + HAND, h * 0.12, w * 0.6); ctx.fillText(SLATE.title, w * 0.04, h * 0.11);
    ctx.fillRect(w * 0.04, h * 0.19, w * 0.5, 2.5);
    const cols = ['#f1ede2', '#f1ede2', '#f6d27a', '#a9d8c8', '#a9d8c8'];
    SLATE.lines.forEach((ln, i) => { ctx.fillStyle = cols[i]; fit(ctx, ln, '500 $px ' + HAND, h * 0.08, w * 0.56); ctx.fillText(ln, w * 0.04 + r.f(-2, 2), h * (0.29 + i * 0.105)); });
    // the drawing: a drum's rim, a table, the cup's straight path and the floor going round under it
    ctx.strokeStyle = '#f4ecd2'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(w * 0.78, h * 1.25, h * 1.0, Math.PI * 1.25, Math.PI * 1.75); ctx.stroke();
    ctx.beginPath(); ctx.arc(w * 0.78, h * 1.25, h * 0.84, Math.PI * 1.3, Math.PI * 1.7); ctx.setLineDash([6, 6]); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = '#f6d27a'; ctx.beginPath(); ctx.moveTo(w * 0.8, h * 0.42); ctx.lineTo(w * 0.8, h * 0.26); ctx.stroke();
    ctx.fillStyle = '#f6d27a'; ctx.beginPath(); ctx.arc(w * 0.8, h * 0.42, 5, 0, 7); ctx.fill();
    ctx.strokeStyle = '#f2a48f'; ctx.beginPath(); ctx.moveTo(w * 0.8, h * 0.26); ctx.lineTo(w * 0.75, h * 0.25); ctx.stroke();
    ctx.fillStyle = '#f2a48f'; fit(ctx, 'anti', '600 $px ' + HAND, h * 0.07, w * 0.1); ctx.fillText('anti', w * 0.66, h * 0.2);
    ctx.fillStyle = '#f4ecd2'; fit(ctx, 'Thursday', '500 $px ' + HAND, h * 0.07, w * 0.2); ctx.textAlign = 'right'; ctx.fillText('Thursday', w * 0.96, h * 0.08);
    // the chalk ledge's dust
    for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(240,235,220,' + (0.05 + 0.1 * r.next()).toFixed(3) + ')'; ctx.fillRect(r.f(0, w), h - r.f(2, 10), r.f(2, 8), r.f(1, 3)); }
  };
}

// The scoreboard: four houses in their colours, on flip tiles, and the match on.
export function drawScore(sc) {
  return (ctx, w, h) => {
    ctx.fillStyle = '#1b1d1c'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c8a45a'; ctx.lineWidth = 3; ctx.strokeRect(5, 5, w - 10, h - 10);
    ctx.fillStyle = '#f3e6c8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    fit(ctx, 'THE LONG HALL', '600 $px ' + CAPS, h * 0.11, w * 0.6); ctx.fillText('THE LONG HALL', w / 2, h * 0.12);
    const rowH = h * 0.18;
    HOUSES.forEach((hs, i) => {
      const y = h * 0.28 + i * rowH;
      ctx.fillStyle = hs[1]; ctx.fillRect(w * 0.06, y, w * 0.5, rowH - 6);
      ctx.fillStyle = i === 1 ? '#2a2018' : '#f6ecd6'; ctx.textAlign = 'left'; fit(ctx, hs[0], '600 $px ' + CAPS, rowH * 0.62, w * 0.42); ctx.fillText(hs[0], w * 0.09, y + rowH * 0.47);
      for (let d = 0; d < 2; d++) {
        const x = w * (0.64 + d * 0.14); ctx.fillStyle = '#2c2f2e'; ctx.fillRect(x, y, w * 0.12, rowH - 6); ctx.fillStyle = '#121413'; ctx.fillRect(x, y + (rowH - 6) / 2 - 1, w * 0.12, 2);
        const n = String(sc[i]).padStart(2, '0')[d]; ctx.fillStyle = '#f6ecd6'; ctx.textAlign = 'center'; fit(ctx, n, '600 $px ' + CAPS, rowH * 0.7, w * 0.1); ctx.fillText(n, x + w * 0.06, y + rowH * 0.47);
      }
    });
    ctx.fillStyle = '#a99f90'; fit(ctx, 'FIRST TO TWELVE · RINGS SCORE THREE', '500 $px ' + CAPS, h * 0.07, w * 0.86); ctx.textAlign = 'center'; ctx.fillText('FIRST TO TWELVE · RINGS SCORE THREE', w / 2, h * 0.95);
  };
}

// Big painted letters on a transparent ground (the saying along the wall), each word its own colour.
export function drawWords(words, cols, font) {
  return (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    const text = words.join('   ');
    const sz = fit(ctx, text, font || ('600 $px ' + CAPS), h * 0.8, w * 0.97);
    ctx.font = (font || ('600 $px ' + CAPS)).replace('$', sz);
    const sp = sz * 0.06;
    let total = 0; for (const wd of words) for (const c of wd) total += ctx.measureText(c).width + sp; total += ctx.measureText('   ').width * (words.length - 1);
    let x = (w - total) / 2;
    words.forEach((wd, i) => {
      ctx.fillStyle = cols[i % cols.length];
      for (const c of wd) { ctx.fillText(c, x, h * 0.54); x += ctx.measureText(c).width + sp; }
      x += ctx.measureText('   ').width;
    });
    // worn paint: small flecks taken out
    const r = new Rng(hashStr(text)); ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 260; i++) { ctx.globalAlpha = r.f(0.2, 0.7); ctx.fillRect(r.f(0, w), r.f(0, h), r.f(1, 5), r.f(1, 3)); }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  };
}

// A word painted on the floor inside an arrow. dir: 1 = the arrow points to the picture's right.
export function drawFloorArrow(word, col, worn, left) {
  return (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.save(); if (left) { ctx.translate(w, 0); ctx.scale(-1, 1); }
    ctx.fillStyle = col; ctx.beginPath();
    ctx.moveTo(w * 0.02, h * 0.28); ctx.lineTo(w * 0.78, h * 0.28); ctx.lineTo(w * 0.78, h * 0.04); ctx.lineTo(w * 0.98, h * 0.5); ctx.lineTo(w * 0.78, h * 0.96); ctx.lineTo(w * 0.78, h * 0.72); ctx.lineTo(w * 0.02, h * 0.72); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.globalCompositeOperation = 'destination-out'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const s = fit(ctx, word, '600 $px ' + CAPS, h * 0.38, w * 0.6); ctx.font = '600 ' + s + 'px ' + CAPS; ctx.fillText(word, left ? w * 0.58 : w * 0.42, h * 0.52);
    const r = new Rng(hashStr(word)); for (let i = 0; i < (worn ? 420 : 90); i++) { ctx.globalAlpha = r.f(0.3, 0.9); ctx.fillRect(r.f(0, w), r.f(0, h), r.f(1, worn ? 9 : 4), r.f(1, 3)); }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Furniture and things. Fronts toward +z, feet on y = 0.
// ---------------------------------------------------------------------------------------------------------------

// A child's desk: a worn wooden top with a lift lid, a painted steel frame and a book shelf. p: { top, frame, h }
defineProp('school.desk', (g, p) => {
  const w = 0.64, d = 0.46, h = p.h || 0.66, fr = p.frame || PAL.teal;
  g.mat('wood', p.top || '#b8875a', { rough: -0.06 }); g.box(-w / 2, h - 0.03, -d / 2, w / 2, h, d / 2, { bevel: 0.01 });
  g.mat('wood', shadeHex(p.top || '#b8875a', 0.8)); g.box(-w / 2 + 0.02, h - 0.034, -d / 2 + 0.06, w / 2 - 0.02, h - 0.03, -d / 2 + 0.068, { faces: 'Y' });
  g.mat('plain', '#4a3a2c'); g.cyl(w / 2 - 0.08, h, -d / 2 + 0.05, 0.016, 0.002, { segs: 8 });          // the ink well, long dry
  g.mat('paint', fr, { rough: -0.1 });
  for (const sx of [-1, 1]) {
    g.tube([[sx * (w / 2 - 0.04), 0, d / 2 - 0.05], [sx * (w / 2 - 0.04), h - 0.03, d / 2 - 0.05]], 0.012, { segs: 6 });
    g.tube([[sx * (w / 2 - 0.04), 0, -d / 2 + 0.05], [sx * (w / 2 - 0.04), h - 0.03, -d / 2 + 0.05]], 0.012, { segs: 6 });
    g.tube([[sx * (w / 2 - 0.04), 0.012, -d / 2 + 0.04], [sx * (w / 2 - 0.04), 0.012, d / 2 - 0.04]], 0.012, { segs: 6 });
  }
  g.mat('wood', shadeHex(p.top || '#b8875a', 0.9)); g.box(-w / 2 + 0.05, h - 0.17, -d / 2 + 0.04, w / 2 - 0.05, h - 0.155, d / 2 - 0.1, { bevel: 0.004 });
  g.mat('paper', p.book || '#7a2f2a'); g.box(-0.18, h - 0.155, -0.12, 0.05, h - 0.12, 0.08, { bevel: 0.003 });
  return { solid: [[-w / 2, 0.25, -d / 2, w / 2, h, d / 2]], tier: 's' };
});

// A child's chair: a bent plywood seat and back on a tube frame. p: { c, frame, h }
defineProp('school.chair', (g, p) => {
  const h = p.h || 0.42, c = p.c || PAL.red, fr = p.frame || '#3a3a3a', k = h / 0.42;
  g.mat('paint', fr, { rough: -0.1 });
  for (const sx of [-1, 1]) {
    g.tube([[sx * 0.17, 0, 0.17], [sx * 0.17, h - 0.02, 0.16], [sx * 0.17, h - 0.02, -0.16], [sx * 0.17, 0, -0.17]], 0.011, { segs: 6 });
    g.tube([[sx * 0.17, h - 0.02, -0.16], [sx * 0.16, h + 0.36 * k, -0.2]], 0.011, { segs: 6 });
  }
  g.mat('wood', c, { rough: -0.12 });
  g.box(-0.19, h - 0.02, -0.18, 0.19, h + 0.006, 0.18, { bevel: 0.01 });
  g.push(); g.move(0, h + 0.26 * k, -0.205); g.rotX(-0.12); g.box(-0.18, -0.08, -0.01, 0.18, 0.08, 0.01, { bevel: 0.008 }); g.pop();
  return { posts: [[0, 0, 0.2, 0, h]], spots: [{ type: 'sit', x: 0, y: h + 0.006, z: 0.02, yaw: 0, low: h < 0.38 }] };
});

// A low table for the small ones. p: { w, d, h, top, legs }
defineProp('school.lowtable', (g, p) => {
  const w = p.w || 1.3, d = p.d || 0.7, h = p.h || 0.5;
  g.mat('wood', p.top || PAL.saffron, { rough: -0.1 }); g.box(-w / 2, h - 0.03, -d / 2, w / 2, h, d / 2, { bevel: 0.014 });
  g.mat('wood', '#e8d9b8'); g.box(-w / 2 - 0.004, h - 0.03, -d / 2 - 0.004, w / 2 + 0.004, h - 0.022, d / 2 + 0.004, { faces: 'xXzZ' });
  g.mat('wood', p.legs || '#a8794f');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.cyl(sx * (w / 2 - 0.08), 0, sz * (d / 2 - 0.08), 0.028, h - 0.03, { segs: 8, r1: 0.022 });
  return { solid: [[-w / 2, 0.15, -d / 2, w / 2, h, d / 2]], tier: 's' };
});

// A floor cushion: plump, round, with a button. p: { a, b }
defineProp('school.cushion', (g, p) => {
  g.mat('weave', p.a || PAL.red); g.ball(0, 0.07, 0, 0.27, 0.075, 0.27, { segs: 14, rings: 7 });
  g.mat('weave', p.b || PAL.cream); g.lathe(0, 0, [[0.272, 0.068], [0.272, 0.078]], { segs: 14, capBottom: false, capTop: false });
  g.mat('weave', p.b || PAL.cream); g.cyl(0, 0.142, 0, 0.025, 0.008, { segs: 8 });
  if (p.patch) { g.mat('weave', p.patch); g.ball(0.12, 0.12, 0.06, 0.06, 0.02, 0.05, { segs: 6, rings: 3 }); }
  return { cast: false, spots: [{ type: 'sit', x: 0, y: 0.13, z: 0, yaw: 0, low: true, floor: true }] };
});

// A beanbag. p: { c }
defineProp('school.beanbag', (g, p) => {
  g.mat('weave', p.c || PAL.teal); g.ball(0, 0.2, 0, 0.4, 0.22, 0.38, { segs: 14, rings: 8 });
  g.ball(0, 0.36, -0.2, 0.32, 0.2, 0.18, { segs: 12, rings: 6 });
  g.mat('weave', p.patch || PAL.saffron); g.ball(0.26, 0.28, 0.16, 0.08, 0.06, 0.03, { segs: 6, rings: 3 });
  return { posts: [[0, 0, 0.38, 0, 0.35]], spots: [{ type: 'sit', x: 0, y: 0.3, z: 0.05, yaw: 0, low: true }] };
});

// A coat hung on a peg at the origin, hanging down. p: { a, lining, len, hood, patch }
defineProp('school.coat', (g, p) => {
  const L = p.len || 0.62, a = p.a || PAL.indigo;
  g.mat('weave', a);
  g.sheet([-0.07, -0.02, 0.05], [0.07, -0.02, 0.05], [0.17, -L, 0.08], [-0.17, -L, 0.08], { nu: 5, nv: 4, ripple: 0.015, rippleN: 4 });
  g.sheet([0.07, -0.02, 0.012], [-0.07, -0.02, 0.012], [-0.16, -L + 0.02, 0.02], [0.16, -L + 0.02, 0.02], { nu: 3, nv: 3 });
  for (const sx of [-1, 1]) g.tube([[sx * 0.07, -0.05, 0.04], [sx * 0.15, -0.2, 0.06], [sx * 0.17, -L * 0.62, 0.07]], 0.03, { segs: 5 });
  g.mat('weave', p.lining || PAL.saffron); g.box(-0.17, -L - 0.004, 0.02, 0.17, -L + 0.03, 0.082, { faces: 'yzZ' });
  if (p.hood) { g.mat('weave', a); g.ball(0, -0.06, 0.06, 0.09, 0.08, 0.05, { segs: 8, rings: 5 }); g.mat('weave', p.lining || PAL.saffron); g.ball(0, -0.07, 0.085, 0.06, 0.05, 0.02, { segs: 8, rings: 4 }); }
  if (p.patch) { g.mat('weave', p.patch); g.box(0.03, -L * 0.6, 0.074, 0.11, -L * 0.45, 0.086, { faces: 'Z' }); g.mat('plain', '#f6ecd6'); for (let i = 0; i < 4; i++) g.box(0.026 + i * 0.026, -L * 0.6 - 0.004, 0.0865, 0.032 + i * 0.026, -L * 0.6 + 0.006, 0.088, { faces: 'Z' }); }
  return { cast: false };
});

// A satchel hung by its strap from a peg at the origin. p: { a, flap }
defineProp('school.satchel', (g, p) => {
  g.mat('leather', p.a || '#8a5634');
  g.tube([[-0.11, -0.2, 0.04], [0, 0, 0.03], [0.11, -0.2, 0.04]], 0.008, { segs: 4 });
  g.box(-0.14, -0.42, 0.02, 0.14, -0.2, 0.1, { bevel: 0.02 });
  g.mat('leather', p.flap || shadeHex(p.a || '#8a5634', 0.8)); g.box(-0.145, -0.31, 0.098, 0.145, -0.195, 0.108, { bevel: 0.006 });
  g.mat('cast', '#c8a45a'); g.box(-0.015, -0.32, 0.106, 0.015, -0.29, 0.112);
  if (p.badge) { g.mat('paint', p.badge); g.cyl(0.08, -0.36, 0.1, 0.02, 0.004, { segs: 8 }); }
  return { cast: false };
});

// A spinball: soft, scuffed, banded, with a mend. p: { a, b, c, r }
defineProp('school.ball', (g, p) => {
  const r = p.r || 0.09;
  g.mat('leather', p.a || PAL.red, { rough: 0.1 }); g.ball(0, r, 0, r, r, r, { segs: 12, rings: 9 });
  g.mat('leather', p.b || PAL.cream); const ring = [], ring2 = [];
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; ring.push([Math.cos(a) * r * 1.01, r, Math.sin(a) * r * 1.01]); ring2.push([0, r + Math.cos(a) * r * 1.01, Math.sin(a) * r * 1.01]); }
  g.tube(ring, r * 0.07, { segs: 4, closed: true }); g.tube(ring2, r * 0.07, { segs: 4, closed: true });
  g.mat('felt', p.c || PAL.saffron); g.ball(r * 0.62, r * 1.45, r * 0.42, r * 0.28, r * 0.28, r * 0.14, { segs: 6, rings: 3 });
  return { cast: false };
});

// The ball rack: an A-frame of rails, two tiers of balls in mixed colours, a chalked tally on its end board.
defineProp('school.rack', (g) => {
  const w = 1.5, d = 0.55;
  g.mat('wood', '#9a7048', { rough: -0.05 });
  for (const sx of [-1, 1]) { g.box(sx * w / 2 - 0.03, 0, -d / 2, sx * w / 2 + 0.03, 1.12, -d / 2 + 0.06, { bevel: 0.006 }); g.box(sx * w / 2 - 0.03, 0, d / 2 - 0.06, sx * w / 2 + 0.03, 1.12, d / 2, { bevel: 0.006 }); g.box(sx * w / 2 - 0.03, 1.08, -d / 2, sx * w / 2 + 0.03, 1.14, d / 2, { bevel: 0.006 }); }
  for (const y of [0.18, 0.62]) for (const sz of [-1, 1]) g.box(-w / 2, y, sz * 0.13 - 0.02, w / 2, y + 0.04, sz * 0.13 + 0.02, { bevel: 0.006 });
  g.mat('paint', PAL.teal); g.box(w / 2 + 0.03, 0.75, -d / 2 + 0.02, w / 2 + 0.035, 1.05, d / 2 - 0.02, { faces: 'X' });
  const cols = [[PAL.red, PAL.cream], [PAL.saffron, PAL.indigo], [PAL.teal, PAL.cream], [PAL.indigo, PAL.saffron], [PAL.leaf, PAL.cream], ['#f08a4b', '#2a2622']];
  let k = 0;
  for (const y of [0.2, 0.64]) for (let i = 0; i < 7; i++) {
    if (y > 0.5 && i === 2) continue;           // one missing: somebody has it
    const x = -w / 2 + 0.12 + i * 0.205, c = cols[k++ % cols.length], r = 0.088;
    g.mat('leather', c[0], { rough: 0.1 }); g.ball(x, y + 0.04 + r * 0.82, 0, r, r, r, { segs: 12, rings: 8 });
    g.mat('leather', c[1]); const ring = []; for (let j = 0; j < 12; j++) { const a = j / 12 * Math.PI * 2; ring.push([x + Math.cos(a) * r * 1.01, y + 0.04 + r * 0.82, Math.sin(a) * r * 1.01]); } g.tube(ring, r * 0.07, { segs: 4, closed: true });
  }
  return { solid: [[-w / 2 - 0.04, 0, -d / 2, w / 2 + 0.04, 1.14, d / 2]], tier: 's' };
});

// A goal ring on its backboard, fixed to a wall, the hoop standing out toward +z. p: { c }
export const RING_OUT = 0.34;
defineProp('school.ring', (g, p) => {
  const c = p.c || PAL.red, R = p.r || 0.26, out = RING_OUT;
  if (p.bare) { g.mat('paint', c); g.box(-0.12, -0.12, 0, 0.12, 0.12, 0.05, { bevel: 0.01 }); }
  else {
    g.mat('paint', '#f6ecd6'); g.box(-0.5, -0.45, 0, 0.5, 0.45, 0.04, { bevel: 0.012 });
    g.mat('paint', c); g.box(-0.46, -0.41, 0.04, 0.46, 0.41, 0.046, { faces: 'Z' });
    g.mat('paint', '#f6ecd6'); g.box(-0.3, -0.3, 0.046, 0.3, 0.3, 0.05, { faces: 'Z' });
    g.mat('paint', c); g.box(-0.26, -0.26, 0.05, 0.26, 0.26, 0.052, { faces: 'Z' });
  }
  g.mat('cast', p.bare ? c : '#c8a45a', { rough: -0.2 });
  const hoop = []; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; hoop.push([Math.cos(a) * R, Math.sin(a) * R, out]); }
  g.tube(hoop, 0.014, { segs: 6, closed: true });
  for (const a of [0.6, Math.PI - 0.6, Math.PI + 0.9, -0.9]) g.tube([[Math.cos(a) * R, Math.sin(a) * R, out], [Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.8, 0.05]], 0.01, { segs: 5 });
  // the net: a cone of cords from the hoop to a gathered tail, bagging back toward the wall
  g.mat('weave', '#f1ead8');
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.tube([[Math.cos(a) * R, Math.sin(a) * R, out], [Math.cos(a) * R * 0.65, Math.sin(a) * R * 0.65 - 0.12, out * 0.62], [Math.cos(a) * R * 0.3, Math.sin(a) * R * 0.3 - 0.26, out * 0.4]], 0.0035, { segs: 3, caps: false }); }
  for (const t of [0.35, 0.7]) { const ring = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, k = 1 - 0.5 * t; ring.push([Math.cos(a) * R * k, Math.sin(a) * R * k - 0.15 * t, out * (1 - 0.45 * t)]); } g.tube(ring, 0.003, { segs: 3, closed: true }); }
  return { cast: false, tier: 's' };
});

// Blocks: a stack of painted wooden blocks. p: { seed, n }
defineProp('school.blocks', (g, p) => {
  const r = new Rng(p.seed || 1); let y = 0; const n = p.n || 4; const s = p.s || 0.07;
  for (let i = 0; i < n; i++) {
    g.push(); g.move(r.f(-0.01, 0.01), y, r.f(-0.01, 0.01)); g.rotY(r.f(-0.4, 0.4));
    if (r.chance(0.3)) { g.mat('paint', r.pick(BRIGHT)); g.box(-s, 0, -s / 2, s, s, s / 2, { bevel: 0.005 }); }
    else { g.mat('paint', r.pick(BRIGHT)); g.box(-s / 2, 0, -s / 2, s / 2, s, s / 2, { bevel: 0.005 }); }
    g.pop(); y += s;
  }
  if (p.arch) { g.mat('paint', PAL.saffron); g.box(-0.14, y, -0.035, 0.14, y + 0.05, 0.035, { bevel: 0.005 }); }
  return { cast: false };
});

// A model of the raft: a flat platform of drums standing side by side, axes up toward the Lantern, on a turned stand.
// One drum is painted red and flagged: Chervil.
defineProp('school.raft', (g) => {
  g.mat('wood', '#6b4a2f', { rough: -0.05 }); g.lathe(0, 0, [[0.2, 0], [0.19, 0.03], [0.06, 0.06], [0.04, 0.4], [0.05, 0.84], [0.1, 0.88]], { segs: 16 });
  g.mat('cast', '#3a3a40'); g.cyl(0, 0.88, 0, 0.42, 0.03, { segs: 28 });                 // the radiator side, dark, underneath
  g.mat('paint', '#d9cfb8'); g.cyl(0, 0.91, 0, 0.415, 0.006, { segs: 28 });
  const r = new Rng(5);
  for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) {
    const x = i * 0.058 + (j % 2 ? 0.029 : 0), z = j * 0.05; if (Math.hypot(x, z) > 0.38) continue;
    const ch = i === 2 && j === -1;
    g.mat('paint', ch ? PAL.red : mixHex('#e8e0cc', '#b8b0a0', r.next()), { rough: -0.1 }); g.cyl(x, 0.916, z, 0.023, 0.05, { segs: 8 });
    g.mat('cast', '#7aa0b0', { rough: -0.3 }); g.cyl(x, 0.966, z, 0.022, 0.003, { segs: 8 });  // the rectenna on top
    if (ch) { g.mat('cast', '#c8a45a'); g.tube([[x, 0.97, z], [x, 1.1, z]], 0.002, { segs: 4 }); g.mat('paint', PAL.red); g.quad([x, 1.1, z], [x + 0.05, 1.08, z], [x + 0.05, 1.08, z], [x, 1.055, z], { double: true }); }
  }
  // the Lantern, a brass bead on a long wire above, so you can see which way the drums face
  g.mat('cast', '#c8a45a'); g.tube([[0.4, 0.9, 0], [0.4, 1.36, 0], [0, 1.4, 0]], 0.003, { segs: 4 }); g.ball(0, 1.4, 0, 0.03, 0.03, 0.03, { segs: 10, rings: 7 });
  return { posts: [[0, 0, 0.2, 0, 1.0]], tier: 's' };
});

// An armchair, a bit sagged. p: { c, wood }
defineProp('school.armchair', (g, p) => {
  const c = p.c || PAL.plum;
  g.mat('wood', p.wood || '#6b4a2f'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.cyl(sx * 0.32, 0, sz * 0.3, 0.025, 0.14, { segs: 6, r1: 0.02 });
  g.mat('weave', c); g.box(-0.36, 0.14, -0.34, 0.36, 0.4, 0.36, { bevel: 0.05 });
  g.box(-0.36, 0.4, -0.38, 0.36, 0.86, -0.2, { bevel: 0.06 });
  for (const sx of [-1, 1]) g.box(sx * 0.36 - 0.1, 0.4, -0.3, sx * 0.36 + 0.02, 0.62, 0.36, { bevel: 0.05 });
  g.mat('weave', p.cushion || shadeHex(c, 1.2)); g.box(-0.27, 0.4, -0.2, 0.27, 0.48, 0.32, { bevel: 0.04 });
  g.mat('weave', PAL.saffron); g.box(0.1, 0.62, -0.2, 0.22, 0.72, -0.17, { faces: 'Z' });
  return { solid: [[-0.38, 0, -0.38, 0.38, 0.5, 0.38]], spots: [{ type: 'sit', x: 0, y: 0.47, z: 0.05, yaw: 0 }], tier: 's' };
});

// A kettle on a hotplate (the tap gives 65 degree water, the plate finishes it). No flame anywhere.
defineProp('school.kettle', (g) => {
  g.mat('brushed', '#9a9488'); g.box(-0.16, 0, -0.14, 0.16, 0.05, 0.14, { bevel: 0.01 });
  g.mat('plain', '#2a2622'); g.cyl(0, 0.05, 0, 0.11, 0.004, { segs: 16 });
  g.mat('cast', '#3f7f86', { rough: -0.15 }); g.lathe(0, 0, [[0.095, 0.054], [0.11, 0.08], [0.11, 0.17], [0.085, 0.21], [0.03, 0.225], [0.02, 0.24], [0, 0.245]], { segs: 16 });
  g.tube([[0.1, 0.1, 0], [0.17, 0.16, 0], [0.19, 0.2, 0]], 0.012, { segs: 6 });
  g.mat('plain', '#2a2622'); g.tube([[-0.07, 0.2, 0], [-0.03, 0.29, 0], [0.04, 0.29, 0], [0.07, 0.2, 0]], 0.01, { segs: 5 });
  g.mat('diffuser', '#ff6a3a', { emissive: 2 }); g.box(0.12, 0.02, 0.141, 0.14, 0.03, 0.142, { faces: 'Z' });
  return { cast: false };
});

// An easel with a painting in progress. p: { c }
defineProp('school.easel', (g, p) => {
  g.mat('wood', '#b8875a'); g.tube([[-0.3, 0, 0.15], [0, 1.25, 0]], 0.016, { segs: 5 }); g.tube([[0.3, 0, 0.15], [0, 1.25, 0]], 0.016, { segs: 5 }); g.tube([[0, 0, -0.35], [0, 1.2, -0.02]], 0.016, { segs: 5 });
  g.box(-0.32, 0.5, 0.08, 0.32, 0.53, 0.16, { bevel: 0.004 });
  g.mat('paper', '#fbf3e0'); g.box(-0.28, 0.53, 0.1, 0.28, 0.98, 0.11);
  g.mat('paper', '#7cb55a'); g.box(-0.28, 0.53, 0.111, 0.28, 0.66, 0.113, { faces: 'Z' }); g.box(-0.28, 0.9, 0.111, 0.28, 0.98, 0.113, { faces: 'Z' });
  g.mat('paper', '#f4c430'); g.box(-0.26, 0.77, 0.112, 0.26, 0.79, 0.114, { faces: 'Z' });
  g.mat('paper', p.c || '#3f8fc8'); g.box(0.02, 0.58, 0.113, 0.16, 0.62, 0.115, { faces: 'Z' });
  for (let i = 0; i < 4; i++) { g.mat('glaze', BRIGHT[i]); g.cyl(-0.24 + i * 0.07, 0.53, 0.13, 0.022, 0.04, { segs: 8 }); }
  return { posts: [[0, 0, 0.25, 0, 1.2]] };
});

// A shelf's worth of paper books along x, spines toward +z (face 'Z') or -z. (x0, x1), y = the board's top, z = the back.
export function bookRun(g, x0, x1, y, z, face, seed, hmax) {
  const r = new Rng(seed || 3), out = face === 'Z' ? 1 : -1, hm = hmax || 0.26;
  const cols = ['#7a2f2a', '#2f4f6f', '#3d5a3a', '#8a6a2f', '#5b4060', '#a0522d', '#2b3a4a', '#6e2f3f', '#c9a96a', '#40504a', '#d9534f', '#e9b23c', '#2f7f86'];
  let x = x0 + 0.01;
  while (x < x1 - 0.03) {
    if (r.chance(0.05)) { x += r.f(0.04, 0.1); continue; }
    const t = r.f(0.016, 0.05), h = hm * r.f(0.6, 1), d = r.f(0.15, 0.22);
    if (x + t > x1) break;
    g.mat(r.chance(0.2) ? 'leather' : 'paper', mixHex(r.pick(cols), '#e8dcc4', r.f(0, 0.25)), { rough: r.f(-0.1, 0.15) });
    if (r.chance(0.06) && x + h < x1) { g.push(); g.move(x, y, z); g.rotZ(-0.35); g.box(0, 0, out > 0 ? 0 : -d, t, h, out > 0 ? d : 0, { bevel: 0.003 }); g.pop(); x += h * 0.4 + t; continue; }
    g.box(x, y, out > 0 ? z : z - d, x + t, y + h, out > 0 ? z + d : z, { bevel: 0.003 });
    x += t + 0.002;
  }
}
// The same along z, spines toward +x ('X') or -x.
export function bookRunZ(g, z0, z1, y, x, face, seed, hmax) {
  const r = new Rng(seed || 3), out = face === 'X' ? 1 : -1, hm = hmax || 0.26;
  const cols = ['#7a2f2a', '#2f4f6f', '#3d5a3a', '#8a6a2f', '#5b4060', '#a0522d', '#2b3a4a', '#6e2f3f', '#c9a96a', '#40504a', '#d9534f', '#e9b23c', '#2f7f86'];
  let z = z0 + 0.01;
  while (z < z1 - 0.03) {
    if (r.chance(0.05)) { z += r.f(0.04, 0.1); continue; }
    const t = r.f(0.016, 0.05), h = hm * r.f(0.6, 1), d = r.f(0.15, 0.22);
    if (z + t > z1) break;
    g.mat(r.chance(0.2) ? 'leather' : 'paper', mixHex(r.pick(cols), '#e8dcc4', r.f(0, 0.25)), { rough: r.f(-0.1, 0.15) });
    g.box(out > 0 ? x : x - d, y, z, out > 0 ? x + d : x, y + h, z + t, { bevel: 0.003 });
    z += t + 0.002;
  }
}
