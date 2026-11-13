// Rue, Herb Row: Station Ring One at the morning rush, under the Count.
//
// A station ring is four decks deep and runs right round the drum, 18.8 km (docs/drum-transport.md, Station rings):
// glide trains on the rim deck, cab berths on the three decks above. Here the four decks stand open to one another as
// one hall. On the front side the trains hang in vacuum berths behind a wall of glass, their only windows facing aft,
// which is the platform's side, and people board through docking hatches (docs/element-cycles.md, Skins;
// docs/ashgrove.md, Day three). On the back side are the Quaysides' fronts and, over them, three galleries of cab
// doors. Down the middle of the platform, every 26 m, hangs the Count: people against shares, the same board with the
// same numbers as far up the curve as the ceiling lets the eye follow (docs/people.md, Counted drums). The flight
// begins at head height under one board, rises until the boards recede up the curve, comes down past the Blight
// Kitchen's counter and its queue (docs/eating-out.md, Rue), crosses to the berths as a train pulls out, follows it
// into its bore through the jacket, passes along its windows and leaves by the lock's outer door.
//
// The Count's numbers (docs/people.md, Life in one: "~217 M people on 200 M shares ... ~8.5% over, 450,000 licences
// against ~1.66 M deaths a year: par in ~14 years"):
//   people 217,004,318 on 200,000,000 shares, so 17,004,318 over, which is 8.5%
//   1.66 M deaths a year is one every 19 s; 450,000 licensed births a year is one every 70 s
//   the fall is 1.21 M a year, and 17.0 M / 1.21 M = 14.05 years to par
// So in the minute of the flight the last digit goes down three times in the hall and up once, at those rates.
//
// Not canon (the docs give the ring, its trains, its berths, its locks and the board; how they lie is this page's own):
//   - the hall: four decks open to one another, 32 m of platform, the galleries one above another, escalators between
//     them, a lit ceiling. The docs say only that a ring is a station four decks deep; and raft-habitat.md keeps
//     ceilings higher than a room to the Hollow and the atria, so a hall like this is a third kind of its own making
//   - berths in pairs with a pier between each pair, where a bore comes up and another goes down, so that trains run
//     through spinward; trains hanging from a rail in the roof; glass between platform and berth. The docs give vacuum
//     berths, docking hatches, about fifty trains at a ring's platforms and about sixty locks, and no drawing of them.
//     This stretch is busier than a ring's average
//   - the train's size and look are kit/outside.js's (the same train as in the glide): the riders at its panes are new
//   - the galleries show one face of each deck's cab berths; the docs' island platforms have a second face behind
//   - the board's layout, its clock, the words "Year nine" and the line of small print under the numbers; a death and a
//     birth marked by the last tiles turning. The docs give what it shows: people against shares
//   - the hour (twenty to eight), and that Rue's rush has so few children in it (people.md: its schools stand half empty)
//   - the Blight Kitchen as an open counter on the platform's arcade, its slate's wording (the dishes and prices are the
//     docs'), the pies on stands, the par book's slate (people.md: "People bet on the date")
//   - the Ring Counter as a booth against the first pier, and its slate's wording (eating-out.md gives the broth, the
//     rice ball and that it is drunk on the platform); the notice of the fitting is three-nights' canon's, shortened
//   - the trades of the other fronts, the wording of the plates ("Station Ring One", "Deck 2 Cabs"), "Lock 7" and the
//     other lock numbers
//   - the lock: the bore widening into a chamber once it is clear of the hall above, an outer door of two leaves at
//     its foot, and a camera that passes the train inside it. The docs leave the locks undrawn (drum-transport.md,
//     Open questions)
import {
  Scene, Group, Mesh, ShaderMaterial, BufferGeometry, Float32BufferAttribute, CanvasTexture, SRGBColorSpace, LinearMipmapLinearFilter,
  LinearFilter, ClampToEdgeWrapping, Vector3, Vector4, Matrix4,
} from 'three';
import { makePath } from '../core/path.js';
import { makeFrame, deckRadius, DRUM, DEG } from '../kit/drum.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG, lampRig, litMaterial, glowPoints } from '../kit/mats.js';
import { Geo, instances, shade, mixc, fitBounds } from '../kit/geo.js';
import { crowd, figureGeo, SKIN, CLOTH } from '../kit/folk.js';
import { makeDeck, finish, frontage, Run, PALETTES } from '../kit/deck.js';
import { makeRng, smoothstep } from '../core/rng.js';

// ---------------------------------------------------------------- the hall's measures (flat: x spinward, y up, z aft)
const P = 312, PIER = 104;            // round the ring: a pier, then a hall of two berths; and so on
const KS = [-2, -1, 0, 1, 2];         // the stretches modelled: x from -624 to 936
const X0 = KS[0] * P, X1 = (KS[KS.length - 1] + 1) * P;
const MOD = 13;                       // a structural bay
const H = 16;                         // four decks
const ZG = -18.2;                     // the glass between platform and berths
const ZP = -14.4;                     // a pier's face
const ZT = -32.6;                     // the berths' far wall
const ZE = 14;                        // the galleries' edge
const ZF = 20;                        // the fronts under the first gallery
const ZW = 26;                        // the walls of cab doors
const ZB = -4;                        // the row of boards
const TY = 6.2, TZ = -24.6;           // the middle of a train, and of a bore
const BORE = 9.5;
const BX = 0 * P + P;                 // the mouth of the way out: the spinward end of hall 0
const CAR = 19, GAP = 1.25, PITCH = CAR + GAP;        // a train is five cars: 100 m
const berthX = (k, b) => k * P + (b ? 260 : 156);    // the middle of berth A (the front one, b = 1) or B of hall k

// ---------------------------------------------------------------- the way out
// From the end of hall 0 a bore goes down through the jacket: level at its mouth, 14 degrees after 60 m.
const SLOPE = 0.245, EASE = 60;
function makeTrack(len) {
  const n = Math.ceil(len / 0.5) + 2, xs = new Float32Array(n), ys = new Float32Array(n), ps = new Float32Array(n);
  let x = BX, y = TY;
  for (let i = 0; i < n; i++) { const ph = -SLOPE * smoothstep(0, EASE, i * 0.5); xs[i] = x; ys[i] = y; ps[i] = ph; x += Math.cos(ph) * 0.5; y += Math.sin(ph) * 0.5; }
  // the middle of the bore s metres past its mouth (before the mouth, the middle of the hall): [x, y, pitch]
  const at = (s) => { if (s <= 0) return [BX + s, TY, 0]; const f = Math.min(s / 0.5, n - 1.001), i = Math.floor(f), u = f - i; return [xs[i] + (xs[i + 1] - xs[i]) * u, ys[i] + (ys[i + 1] - ys[i]) * u, ps[i] + (ps[i + 1] - ps[i]) * u]; };
  // a point beside it: `up` metres toward the bore's roof, `side` metres aft
  at.off = (s, up = 0, side = 0) => { const c = at(s); return [c[0] - Math.sin(c[2]) * up, c[1] + Math.cos(c[2]) * up, TZ + side]; };
  return at;
}

// The train the flight leaves with: metres run since it let go of its hatches, from its speed at a few moments.
const HERO_V = [[31.8, 0], [41.8, 14], [50.8, 14], [58.3, 1.5], [90, 1.3]];
function heroRun(t) {
  let d = 0;
  for (let i = 0; i < HERO_V.length - 1; i++) {
    const [t0, v0] = HERO_V[i], [t1, v1] = HERO_V[i + 1];
    if (t <= t0) break;
    const u = Math.min(t, t1) - t0, v = v0 + (v1 - v0) * (u / (t1 - t0));
    d += (v0 + v) / 2 * u;
  }
  return d;
}
// The other trains: hall k, berth b, the second it comes to rest (it was there all along if none) and the second it leaves.
const TRAINS = [
  { k: -2, b: 0 }, { k: -2, b: 1, dep: 44 },
  { k: -1, b: 1, dep: 2 }, { k: -1, b: 0, dep: 24 },
  { k: 0, b: 0, arr: 20.5 },
  { k: 1, b: 1, dep: 9 }, { k: 1, b: 0, dep: 34 },
  { k: 2, b: 1, dep: 27 }, { k: 2, b: 0, arr: 15 },
];
// where such a train's middle is at t: it brakes into its berth at 0.8 m/s2 and pulls out at 1 m/s2
function trainX(tr, t) {
  const x = berthX(tr.k, tr.b);
  if (tr.arr !== undefined && t < tr.arr) { const d = tr.arr - t; return x - 0.4 * d * d; }
  if (tr.dep !== undefined && t > tr.dep) { const d = t - tr.dep; return x + 0.5 * d * d; }
  return x;
}

// ---------------------------------------------------------------- the Count
const SHARES = 200000000, PEOPLE = 217004318;
const DEATHS = [3.6, 22.6, 41.6, 60.6], BIRTHS = [13.0];        // seconds into the flight: one every 19 s, one every 70 s (the last is in the bore, unseen)
const CLOCK0 = 7 * 3600 + 41 * 60 + 27;                          // twenty to eight
const BW = 7.6, BH = 3.8, BY = 5.6;                              // a board, and the height of its middle
const TILE = { x1: 984, w: 50, pitch: 54, h: 92, rows: [164, 266, 368] };
const group3 = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// One face of the board, painted on a canvas 1024 x 512. Tiles as on a flap board: eleven to a row, as on the old
// Count that Madder took down. What changes while the flight lasts (the clock, and the last tile of the two numbers
// that move) is painted again on a second, small canvas, so that the big one is lettered once.
const FONT_SERIF = "400 64px 'Cormorant Garamond', Georgia, serif", FONT_NUM = (px) => `500 ${px}px 'Barlow', 'Segoe UI', Arial, sans-serif`;
const FONT_COND = (px) => `500 ${px}px 'Barlow Condensed', 'Arial Narrow', Arial, sans-serif`;
const LIVE = { clock: [784, 42, 200, 52], tiles: [[934, TILE.rows[0] - 46, 50, 92], [934, TILE.rows[2] - 46, 50, 92]] };      // x, y, w, h on the big canvas
function paintTile(cx, x, y, ch, ink) {
  cx.fillStyle = ch === undefined ? '#1b1a17' : '#2a2824'; cx.fillRect(x, y - TILE.h / 2, TILE.w, TILE.h);
  if (ch !== undefined) { cx.fillStyle = ink; cx.font = FONT_NUM(74); cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(ch, x + TILE.w / 2, y + (ch === ',' ? -8 : 4)); }
  cx.fillStyle = '#12110f'; cx.fillRect(x, y - 1, TILE.w, 2);
}
function paintClock(cx, x1, y, secs) {
  const two = (v) => String(v).padStart(2, '0'), clock = two(Math.floor(secs / 3600) % 24) + ':' + two(Math.floor(secs / 60) % 60) + ':' + two(Math.floor(secs) % 60);
  cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = '#fbf6ec'; cx.font = FONT_NUM(44);
  for (let i = 0; i < clock.length; i++) cx.fillText(clock[i], x1 - (clock.length - i) * 25 + 12, y);
}
// (a generator: the first lettering in each face of type is slow, so it is done a part at a time)
function* paintCount(cx, people, secs) {
  const W = 1024, HH = 512, track = (px) => { if ('letterSpacing' in cx) cx.letterSpacing = px + 'px'; };
  cx.fillStyle = '#12110f'; cx.fillRect(0, 0, W, HH);
  cx.strokeStyle = '#6e665a'; cx.lineWidth = 4; cx.strokeRect(12, 12, W - 24, HH - 24);
  cx.textBaseline = 'middle';
  // the head: its name, whose it is, the hour
  cx.textAlign = 'left'; cx.fillStyle = '#fbf6ec'; cx.font = FONT_SERIF; track(8);
  cx.fillText('THE COUNT', 44, 66);
  const wHead = cx.measureText('THE COUNT').width;
  yield 'rue: the Count: head';
  cx.fillStyle = '#d9cdb5'; cx.font = FONT_COND(32); track(4);
  cx.fillText('RUE, YEAR NINE', Math.max(470, 44 + wHead + 36), 70);
  track(0);
  yield 'rue: the Count: whose';
  paintClock(cx, 984, 68, secs);
  cx.fillStyle = '#6e665a'; cx.fillRect(44, 108, W - 88, 3);
  yield 'rue: the Count: clock';
  // three rows of tiles
  const rows = [['PEOPLE', group3(people), '#fbf6ec'], ['SHARES', group3(SHARES), '#fbf6ec'], ['OVER', group3(people - SHARES), '#ffc46a']];
  for (let r = 0; r < 3; r++) {
    const [label, text, ink] = rows[r], y = TILE.rows[r];
    cx.textAlign = 'left'; cx.textBaseline = 'middle'; cx.fillStyle = '#d9cdb5'; cx.font = FONT_COND(52); track(5);
    cx.fillText(label, 44, y + 2);
    if (r === 2) { cx.fillStyle = '#ffc46a'; track(2); cx.fillText('8.5%', 190, y + 2); }
    track(0);
    for (let i = 0; i < 11; i++) paintTile(cx, TILE.x1 - TILE.w - (10 - i) * TILE.pitch, y, text[i - (11 - text.length)], ink);
    yield 'rue: the Count: tiles';
  }
  // the small print
  cx.fillStyle = '#d9cdb5'; cx.font = FONT_COND(34); track(4); cx.textBaseline = 'middle';
  cx.textAlign = 'left'; cx.fillText('LICENCES THIS YEAR 450,000', 44, 462);
  cx.textAlign = 'right'; cx.fillText('PAR IN ABOUT 14 YEARS', 984, 462);
  track(0);
}
// the small canvas, 256 x 256: the clock along its top, the two tiles under it
function paintLive(cx, people, secs) {
  cx.fillStyle = '#12110f'; cx.fillRect(0, 0, 256, 256);
  paintClock(cx, 200, 26, secs);
  paintTile(cx, 0, 60 + 46, String(people % 10), '#fbf6ec');
  paintTile(cx, 64, 60 + 46, String((people - SHARES) % 10), '#ffc46a');
}

const COUNT_VERT = /* glsl */`
${BEND_PARS}
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec2 vUv;
void main() {
  vec3 p = position, n = normal;
  vF = p; vFN = n; vUv = uv;
  kBend(p, n);
  vW = p; vN = n;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const countFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform sampler2D tMap, tLive; uniform float uGlow, uFlash; uniform vec4 uSrc[3], uDst[3];
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec2 vUv;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 c = texture2D(tMap, vUv).rgb;
  float k = uGlow;
  for (int i = 0; i < 3; i++) {
    vec2 q = (vUv - uSrc[i].xy) / uSrc[i].zw;
    vec3 l = texture2D(tLive, uDst[i].xy + clamp(q, 0.0, 1.0) * uDst[i].zw).rgb;
    if (q.x >= 0.0 && q.x <= 1.0 && q.y >= 0.0 && q.y <= 1.0) { c = l; if (i > 0) k *= 1.0 + uFlash; }
  }
  gl_FragColor = vec4(kAir(c * (kLight(vW, normalize(vN), vF, normalize(vFN)) * 0.3 + k), vW), 1.0);
}`;

// Every board in the hall is one mesh with one picture, so they cannot differ. set(t, pre) turns the tiles: t is the
// flight's seconds, pre the seconds the world was watched through the last opening before the flight began.
function* countBoards(deck, xs) {
  const canvas = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
  const texOf = (cv) => {
    const t = new CanvasTexture(cv);
    t.colorSpace = SRGBColorSpace; t.flipY = false; t.wrapS = t.wrapT = ClampToEdgeWrapping;
    t.minFilter = LinearMipmapLinearFilter; t.magFilter = LinearFilter; t.generateMipmaps = true; t.anisotropy = 8;
    return t;
  };
  // (canvases kept in memory, as the kit's own lettering is: one made on the graphics card can hold the page up when it is first drawn on)
  const cv = canvas(1024, 512), cx = cv.getContext('2d', { willReadFrequently: true }), cvL = canvas(256, 256), cxL = cvL.getContext('2d', { willReadFrequently: true }), tex = texOf(cv), live = texOf(cvL);
  yield 'rue: the Count: canvases';
  yield* paintCount(cx, PEOPLE, CLOCK0);
  yield 'rue: the Count: small print';
  // the page's own type may not have arrived when the board is first lettered: letter it again when it has
  let gone = false, shownP = -1, shownS = -1;
  tex.addEventListener('dispose', () => { gone = true; });
  const again = () => { if (gone) return; for (const part of paintCount(cx, PEOPLE, CLOCK0)) { /* all at once: by now it is quick */ } tex.needsUpdate = true; shownS = -1; };
  // (asked through fonts.ready, which waits on the loads the deck has already begun: asking the page about each face
  // here can make it lay itself out again, and that is a stall)
  const probe = () => { cx.font = FONT_SERIF; const w = cx.measureText('THE COUNT').width; cx.font = FONT_NUM(74); return w + cx.measureText('0123456789').width; };
  const w0 = probe();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!gone && probe() !== w0) again(); }, () => { /* the stand-in type stays */ });
  const pos = [], nrm = [], uv = [], m = 0.14, y0 = BY - BH / 2 - m, y1 = BY + BH / 2 + m, za = ZB - BW / 2 - m, zb = ZB + BW / 2 + m, mu = m / BW, mv = m / BH;
  for (const x of xs) for (const sd of [-1, 1]) {
    // the face that looks anti (sd = -1) is read by someone walking spinward, whose right hand is aft. It runs out to
    // the casing's edge, and the picture's own dark border is drawn on beyond its last pixel
    const xf = x + sd * 0.17, l = sd < 0 ? za : zb, r = sd < 0 ? zb : za;
    const q = [[xf, y0, l, -mu, 1 + mv], [xf, y0, r, 1 + mu, 1 + mv], [xf, y1, r, 1 + mu, -mv], [xf, y1, l, -mu, -mv]];
    for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(q[i][0], q[i][1], q[i][2]); nrm.push(sd, 0, 0); uv.push(q[i][3], q[i][4]); }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  const src = (r) => new Vector4(r[0] / 1024, r[1] / 512, r[2] / 1024, r[3] / 512), dst = (x, y, w, h) => new Vector4(x / 256, y / 256, w / 256, h / 256);
  const mat = new ShaderMaterial({
    uniforms: {
      ...deck.rig.uniforms, uClip: G.uClip, uBend: { value: new Vector3(deck.frame.a0, deck.frame.z0, deck.frame.floorR) }, tMap: { value: tex }, tLive: { value: live },
      uGlow: { value: 1.3 }, uFlash: { value: 0 },
      uSrc: { value: [src(LIVE.clock), src(LIVE.tiles[0]), src(LIVE.tiles[1])] }, uDst: { value: [dst(0, 0, 200, 52), dst(0, 60, 50, 92), dst(64, 60, 50, 92)] },
    },
    vertexShader: COUNT_VERT, fragmentShader: countFrag(deck.rig),
  });
  const mesh = fitBounds(new Mesh(g, mat), deck.frame);
  mesh.renderOrder = 1;
  const set = (t, pre) => {
    let people = PEOPLE, last = -99;
    for (const d of DEATHS) if (t >= d) { people--; last = Math.max(last, d); }
    for (const b of BIRTHS) if (t >= b) { people++; last = Math.max(last, b); }
    const secs = Math.floor(CLOCK0 + t + pre);
    if (people !== shownP || secs !== shownS) { paintLive(cxL, people, secs); live.needsUpdate = true; shownP = people; shownS = secs; }
    // a tile that has just turned is bright for a moment, on every board at once
    mat.uniforms.uFlash.value = 2.4 * Math.max(0, 1 - (t - last) / 0.9);
  };
  set(0, 0);
  return { mesh, set };
}

// ---------------------------------------------------------------- walls that look one way
const wallS = (g, x0, x1, y0, y1, z, col, e = 0) => g.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col, e);      // faces aft (+z)
const wallN = (g, x0, x1, y0, y1, z, col, e = 0) => g.quad([x1, y0, z], [x0, y0, z], [x0, y1, z], [x1, y1, z], col, e);      // faces the front (-z)
const wallE = (g, x, z0, z1, y0, y1, col, e = 0) => g.quad([x, y0, z1], [x, y0, z0], [x, y1, z0], [x, y1, z1], col, e);      // faces spinward (+x)
const wallW = (g, x, z0, z1, y0, y1, col, e = 0) => g.quad([x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], col, e);      // faces anti (-x)

// ---------------------------------------------------------------- a glide train
// One car, its middle at x: a tank of sealed water round a cabin, 19 m long, 12 tall and 11.7 through, hung from the
// rail in the roof (kit/outside.js draws the same car for the glide). Its only windows are two long panes in the aft
// face, which is the face the platform sees. fine: the panes are openings on a lit cabin with riders at them, behind
// the 1.3 m of clear water that is their glass; otherwise they are lit panes.
function drawCar(g, x, fine, rng, tail, head, link) {
  const hull = '#9aa0a7', aft = '#878d95', dark = '#3a3e45', a = x - CAR / 2, b = x + CAR / 2;
  const y0 = TY - 6, y1 = TY + 6, z0 = TZ - 6.5, z1 = TZ + 5.2, pa = a + 3.4, pb = b - 3.4, panes = [[TY - 4.4, TY - 1], [TY + 1, TY + 4.4]];
  g.box(a + 0.6, y0, z0, b - 0.6, y1, z1, hull, { skip: 'ns' });
  wallN(g, a + 0.6, b - 0.6, y0, y1, z0, dark);                                   // the face toward the Lantern: six metres of water behind it
  g.box(a, TY - 5.4, TZ - 5.9, a + 0.6, TY + 5.4, TZ + 4.6, dark, { skip: 'e' }).box(b - 0.6, TY - 5.4, TZ - 5.9, b, TY + 5.4, TZ + 4.6, dark, { skip: 'w' });
  for (const rx of [a + 2.9, b - 2.9]) g.box(rx - 0.3, y0 - 0.15, z0 - 0.15, rx + 0.3, y1 + 0.15, z1 + 0.12, dark);
  if (!fine) {
    wallS(g, a + 0.6, b - 0.6, y0, y1, z1, aft);
    for (const [ya, yb] of panes) g.box(pa, ya, z1, pb, yb, z1 + 0.1, '#ffd9a0', { emit: 1.5, skip: 'n' });
  } else {
    wallS(g, a + 0.6, b - 0.6, y0, panes[0][0], z1, aft); wallS(g, a + 0.6, b - 0.6, panes[0][1], panes[1][0], z1, aft); wallS(g, a + 0.6, b - 0.6, panes[1][1], y1, z1, aft);
    for (const [ya, yb] of panes) {
      wallS(g, a + 0.6, pa, ya, yb, z1, aft); wallS(g, pb, b - 0.6, ya, yb, z1, aft);
      const zc = z1 - 3.3, water = '#8fc4bb';
      wallS(g, pa, pb, ya, yb, zc, '#e6c193', 0.62);
      g.floor(pa, zc, pb, z1, ya, water, { emit: 0.3 }).floor(pa, zc, pb, z1, yb, '#fff1d8', { down: true, emit: 1.3 });
      wallE(g, pa, zc, z1, ya, yb, water, 0.3); wallW(g, pb, zc, z1, ya, yb, water, 0.3);
      // two rows of seats facing the pane, the back row raised, and whoever is riding
      for (let r = 0; r < 2; r++) {
        const sy = ya + 0.5 + r * 0.85, zr = z1 - 1.5 - r * 0.9;
        g.box(pa + 0.15, ya, zr - 0.3, pb - 0.15, sy, zr + 0.28, '#4a4038', { skip: 'bn', emit: 0.35 });
        for (let sx = pa + 0.55; sx < pb - 0.4; sx += 0.62) {
          if (rng() > 0.84) continue;
          const cl = CLOTH[Math.floor(rng() * CLOTH.length)], sk = SKIN[Math.floor(rng() * SKIN.length)], lean = (rng() - 0.5) * 0.08;
          g.box(sx - 0.21, sy, zr - 0.12, sx + 0.21, sy + 0.58, zr + 0.14, cl, { skip: 'bn', emit: 0.8 });
          g.box(sx - 0.11 + lean, sy + 0.62, zr - 0.08, sx + 0.11 + lean, sy + 0.86, zr + 0.13, sk, { skip: 'bn', emit: 0.8 });
        }
      }
    }
  }
  for (let k = 0; k <= 2; k++) { const mx = pa + k * (pb - pa) / 2; g.box(mx - 0.12, TY - 4.6, z1, mx + 0.12, TY + 4.6, z1 + 0.3, dark, { skip: 'n' }); }
  g.box(pa - 0.2, TY - 0.5, z1, pb + 0.2, TY + 0.5, z1 + 0.3, dark, { skip: 'n' });
  // a door at each end of the car, where the docking hatches come to it
  for (const dx of [a + 2, b - 2]) { g.box(dx - 1.0, y0 + 0.05, z1, dx + 1.0, y0 + 2.5, z1 + 0.14, dark, { skip: 'n' }); wallS(g, dx - 0.8, dx + 0.8, y0 + 0.15, y0 + 2.35, z1 + 0.21, '#ffe9c8', 1.1); }
  // the hangers, and their trucks on the rail
  for (const hx of [x - 6, x + 6]) g.box(hx - 0.35, y1, TZ - 0.5, hx + 0.35, y1 + 2.3, TZ + 0.5, dark, { skip: 'tb' }).box(hx - 1.2, y1 + 2.0, TZ - 0.9, hx + 1.2, y1 + 2.95, TZ + 0.9, '#565b63');
  if (link) g.box(b, TY - 2.6, TZ - 2.2, b + GAP, TY + 2.6, TZ + 2.2, dark, { skip: 'we' });
  for (const dy of [-3.9, 3.9]) {
    if (head) g.box(b, TY + dy - 0.7, TZ - 0.7, b + 0.3, TY + dy + 0.7, TZ + 0.7, '#fff2d8', { emit: 7, skip: 'w' });
    if (tail) g.box(a - 0.3, TY + dy - 0.6, TZ - 0.6, a, TY + dy + 0.6, TZ + 0.6, '#ff5030', { emit: 6, skip: 'e' });
  }
  // a plate across each end, with a bar of light: white ahead, amber behind
  if (head) g.box(b, TY - 1.5, TZ - 4.4, b + 0.12, TY + 1.5, TZ + 3.4, '#4d525a', { skip: 'w' }).box(b + 0.12, TY - 0.14, TZ - 3.8, b + 0.2, TY + 0.14, TZ + 2.8, '#fff2d8', { emit: 2.6, skip: 'w' });
  if (tail) g.box(a - 0.12, TY - 1.5, TZ - 4.4, a, TY + 1.5, TZ + 3.4, '#4d525a', { skip: 'e' }).box(a - 0.2, TY - 0.14, TZ - 3.8, a - 0.12, TY + 0.14, TZ + 2.8, '#ffb866', { emit: 2.4, skip: 'e' });
}
// a whole train, modelled with its middle at x = 0: it is stood in its berth by turning it round the drum's axis
function trainGeo(fine, seed) {
  const g = new Geo(), rng = makeRng(seed);
  for (let c = 0; c < 5; c++) drawCar(g, (c - 2) * PITCH, fine, rng, c === 0, c === 4, c < 4);
  return g;
}
// where the docking hatches of a berth stand, for a train whose middle is at x
const hatchesOf = (x) => { const a = []; for (let c = 0; c < 5; c++) for (const s of [-7.5, 7.5]) a.push(x + (c - 2) * PITCH + s); return a; };

// ---------------------------------------------------------------- one stretch of the hall
// What repeats every 312 m is modelled once, for x from 0 to 312, and drawn five times: each copy is turned round the
// drum's axis to its own place. Floors, lettering, lamps' glows, people and trains are made in place.
const ESC_U = 27, RUN = 4 / Math.tan(30 * DEG), EZ0 = 10.5, EZ1 = 13.65;        // the escalators: where they begin, a flight's run, their two edges
const landing = (L) => [ESC_U + (3 - L) * (RUN + 3), ESC_U + 3 + (3 - L) * (RUN + 3)];      // where deck L + 1's gallery opens onto them
const DOORP = MOD / 3;                                                           // a cab berth's share of kerb
const CREAM = '#d9cdb5', PALE = '#ece4d2', GREY = '#8d8474', DARK = '#24221f', STEEL = '#74777a', IRON = '#3d4045';
// long things are cut into lengths of 6.5 m here, since a long face left to the Geo to cut costs many times the triangles
const lengths = (x0, x1, fn) => { for (let a = x0; a < x1 - 0.01; a += MOD / 2) fn(a, Math.min(x1, a + MOD / 2)); };
const beam = (g, x0, x1, y0, z0, y1, z1, col, opts = {}) => lengths(x0, x1, (a, b) => g.box(a, y0, z0, b, y1, z1, col, { ...opts, skip: (opts.skip || '') + (a > x0 ? 'w' : '') + (b < x1 ? 'e' : '') }));

function* shellGeo(pal) {
  const g = new Geo(), gl = new Geo(), HA = PIER, HB = P;
  // ---- the berth wall: glass from floor to roof, a heavy rail over the hatches, mullions above it
  beam(g, HA, HB, 2.9, ZG - 0.2, 3.3, ZG + 0.2, STEEL);
  beam(g, HA, HB, 8.0, ZG - 0.1, 8.22, ZG + 0.12, STEEL, { skip: 'n' }); beam(g, HA, HB, 12.4, ZG - 0.1, 12.62, ZG + 0.12, STEEL, { skip: 'n' });
  beam(g, HA, HB, 15.0, ZG - 0.3, H, ZG + 0.3, PALE, { skip: 't' });
  for (let u = HA; u <= HB + 0.01; u += MOD / 2) g.box(u - 0.1, 3.3, ZG - 0.14, u + 0.1, 15.0, ZG + 0.16, '#a3a6a8', { skip: 'tb' });
  lengths(HA, HB, (a, b) => wallS(gl, a, b, 3.3, 15.0, ZG, pal.glass));
  yield 'rue: berth wall';
  let at = HA;
  for (const hx of [...hatchesOf(156), ...hatchesOf(260)]) {
    if (hx > 208 && at < 208) yield 'rue: hatches';
    if (hx - 1.25 > at) wallS(gl, at, hx - 1.25, 0, 2.9, ZG, pal.glass);
    at = hx + 1.25;
    // a docking hatch: a portal, a lit bar over it, and a short collar out to the car's door
    g.box(hx - 1.25, 0, ZG - 0.3, hx - 0.95, 2.9, ZG + 0.3, IRON, { skip: 'b' }).box(hx + 0.95, 0, ZG - 0.3, hx + 1.25, 2.9, ZG + 0.3, IRON, { skip: 'b' }).box(hx - 0.95, 2.4, ZG - 0.3, hx + 0.95, 2.9, ZG + 0.3, IRON);
    wallS(g, hx - 0.7, hx + 0.7, 2.52, 2.78, ZG + 0.37, '#fff3dc', 3.2);
    const zc = ZG - 1.02;
    g.floor(hx - 0.95, zc, hx + 0.95, ZG - 0.3, 0.02, '#5a5c5e').floor(hx - 0.95, zc, hx + 0.95, ZG - 0.3, 2.4, '#fff1d8', { down: true, emit: 1.6 });
    wallE(g, hx - 0.95, zc, ZG - 0.3, 0, 2.4, '#9a9c9c', 0.4); wallW(g, hx + 0.95, zc, ZG - 0.3, 0, 2.4, '#9a9c9c', 0.4);
    g.box(hx - 1.05, -0.1, zc, hx + 1.05, 2.5, ZG - 0.3, IRON, { skip: 'ns' });
  }
  if (at < HB) wallS(gl, at, HB, 0, 2.9, ZG, pal.glass);
  yield 'rue: berth wall';
  // ---- the berths: a long hall kept at vacuum, where the trains hang from the rail in its roof
  lengths(HA, HB, (a, b) => {
    g.floor(a, ZT, b, ZG, -0.5, '#34383e'); wallN(g, a, b, -0.5, 0, ZG, IRON); wallS(g, a, b, -0.5, 15.3, ZT, '#565c66');
    g.floor(a, ZT, b, ZG, 15.3, '#33373d', { down: true });
  });
  for (let u = HA + MOD / 2; u < HB; u += MOD) g.box(u - 0.3, -0.5, ZT, u + 0.3, 15.3, ZT + 0.45, '#454a53', { skip: 'tbn' });
  for (const y of [4.2, 10.6]) beam(g, HA, HB, y, ZT, y + 0.22, ZT + 0.5, '#dfe9ff', { emit: 2.2, skip: 'n' });
  beam(g, HA, HB, TY + 8.3, TZ - 0.35, TY + 8.8, TZ + 0.35, '#5b6068', { skip: 't' });
  for (const [u0, u1] of [[HA, HA + 0.8], [HB - 0.8, HB]]) g.box(u0, -0.5, ZT, u1, 15.3, ZT + 0.7, IRON, { skip: 'tb' }).box(u0, -0.5, ZG - 0.5, u1, 15.3, ZG - 0.02, IRON, { skip: 'tb' });
  yield 'rue: berths';
  // ---- the pier: solid, with a bore inside it. Its face stands forward of the glass; a band of lamps along its head
  lengths(0, PIER, (a, b) => { wallS(g, a, b, 0, H, ZP, CREAM); g.box(a, 0, ZP, b, 1.15, ZP + 0.05, GREY, { skip: 'bnwe' }).box(a, 14.9, ZP, b, 15.3, ZP + 0.2, PALE, { skip: 'nwe' }); });
  for (let u = MOD / 2; u < PIER; u += MOD) {
    g.box(u - 0.45, 1.15, ZP, u + 0.45, 14.9, ZP + 0.22, PALE, { skip: 'tbn' });
    if (u + MOD < PIER + 1) wallS(g, u + 1.2, u + MOD - 1.2, 12.3, 13.9, ZP + 0.12, '#fff3dc', 1.5);
  }
  wallW(g, 0, ZG, ZP, 0, H, CREAM); wallE(g, PIER, ZG, ZP, 0, H, CREAM);
  // a long bench against it
  beam(g, 15, PIER - 15, 0.42, ZP + 0.06, 0.5, ZP + 0.6, '#6f5a44', { skip: 'n' });
  for (let u = 15.2; u < PIER - 15; u += 3.25) g.box(u - 0.05, 0, ZP + 0.1, u + 0.05, 0.42, ZP + 0.56, IRON, { skip: 'tb' });
  // ---- the ceiling: the underside of deck five, a field of lamps between beams
  for (let i = 0; i < 48; i++) {
    const u = i * MOD / 2, zs = u < PIER ? ZP : ZG, w = (ZE - zs) / 5;
    g.floor(u, zs, u + MOD / 2, ZE, H, '#57524a', { down: true });
    for (let j = 0; j < 5; j++) g.floor(u + 0.45, zs + j * w + 0.45, u + MOD / 2 - 0.45, zs + (j + 1) * w - 0.45, H - 0.05, '#fbf6ec', { down: true, emit: 2.5 });
    if (i % 2 === 0) g.box(u - 0.22, H - 0.75, zs, u + 0.22, H, ZE, '#6e665a', { skip: 't' });
  }
  yield 'rue: ceiling';
  // ---- a board every 26 m: its casing and the rods it hangs on (the faces are one mesh for the whole hall)
  for (let u = 0; u < P; u += 2 * MOD) {
    g.box(u - 0.17, BY - BH / 2 - 0.14, ZB - BW / 2 - 0.14, u + 0.17, BY + BH / 2 + 0.14, ZB + BW / 2 + 0.14, DARK, { skip: 'we' });
    for (const z of [ZB - 2.7, ZB + 2.7]) g.box(u - 0.05, BY + BH / 2 + 0.14, z - 0.05, u + 0.05, H - 0.7, z + 0.05, IRON, { skip: 'tb' });
  }
  // ---- the galleries: decks two, three and four, each with its wall of cab doors
  for (let L = 1; L <= 4; L++) {
    const y = L * 4, ys = y - 1;
    lengths(0, P, (a, b) => g.floor(a, ZE, b, ZW, ys, '#b8ae9a', { down: true, emit: 0.22 }));          // the ceiling of the deck below
    for (let u = MOD / 4; u < P; u += MOD / 2) for (const z of [17, 23]) g.floor(u - 0.55, z - 0.2, u + 0.55, z + 0.2, ys - 0.09, '#fff3dc', { down: true, emit: 4 });
    if (L === 4) { beam(g, 0, P, ys, ZE - 0.35, H, ZE, PALE, { skip: 'ts' }); break; }
    beam(g, 0, P, ys, ZE - 0.35, y + 0.12, ZE, PALE, { skip: 's' });                                    // the slab's edge
    // the rail: glass under a steel bar, open where the escalators land
    const gap = landing(L);
    for (const [u0, u1] of [[0, gap[0]], [gap[1], P]]) {
      lengths(u0, u1, (a, b) => wallS(gl, a, b, y + 0.12, y + 1.05, ZE - 0.18, pal.glass));
      beam(g, u0, u1, y + 1.05, ZE - 0.24, y + 1.1, ZE - 0.12, STEEL);
    }
    for (let u = 0; u < P; u += MOD / 4) if (u < gap[0] - 0.1 || u > gap[1] + 0.1) g.box(u - 0.03, y + 0.12, ZE - 0.21, u + 0.03, y + 1.05, ZE - 0.15, STEEL, { skip: 'tb' });
    // the wall of cab doors: one to every 4.3 m of kerb, an amber lamp over a cab that waits, green over one that stands open
    for (let i = 0; i < 72; i++) {
      const a = i * DOORP, u = a + DOORP / 2, b = a + DOORP, open = (i * 7 + L * 3) % 5 === 0;
      wallN(g, a, u - 0.87, y, y + 3, ZW, CREAM); wallN(g, u + 0.87, b, y, y + 3, ZW, CREAM); wallN(g, u - 0.87, u + 0.87, y + 2.32, y + 3, ZW, CREAM);
      wallN(g, a, u - 0.87, y, y + 0.16, ZW - 0.05, GREY); wallN(g, u + 0.87, b, y, y + 0.16, ZW - 0.05, GREY);
      wallN(g, u - 0.87, u + 0.87, y, y + 2.32, ZW, IRON);
      if (open) { wallN(g, u - 0.75, u + 0.75, y + 0.5, y + 2.2, ZW - 0.06, '#ffdcae', 1.7); wallN(g, u - 0.75, u + 0.75, y + 0.02, y + 0.5, ZW - 0.06, '#7a5c40', 0.5); }
      else wallN(g, u - 0.75, u + 0.75, y + 0.02, y + 2.2, ZW - 0.06, i % 3 ? '#5f6b78' : '#6f6a5e');
      wallN(g, u - 0.17, u + 0.17, y + 2.44, y + 2.54, ZW - 0.07, open ? '#b9f0c0' : '#ffcf8a', 3.2);
    }
    yield 'rue: gallery';
  }
  // columns under the galleries' edge, floor to roof
  for (let u = MOD / 2; u < P; u += MOD) g.box(u - 0.3, 0, ZE + 0.1, u + 0.3, 15, ZE + 0.7, CREAM, { skip: 'tb' });
  // ---- the escalators: three flights from deck four to the platform, hung along the galleries' edge
  const zm = (EZ0 + EZ1) / 2, N = 20, dx = RUN / N, dy = 4 / N;
  for (let f = 0; f < 3; f++) {
    const ua = ESC_U + 3 + f * (RUN + 3), ub = ua + RUN, ya = 12 - f * 4, yb = ya - 4;
    g.box(ua - 3, ya - 0.3, EZ0, ua, ya, ZE - 0.35, PALE);
    wallS(gl, ua - 3, ua, ya, ya + 1.0, EZ0 + 0.04, pal.glass); wallW(gl, ua - 2.96, EZ0, ZE - 0.35, ya, ya + 1.0, pal.glass);
    // the steps, and the truss under them
    for (let i = 0; i < N; i++) { const x = ua + i * dx, y = ya - (i + 1) * dy; g.floor(x, EZ0 + 0.1, x + dx, EZ1 - 0.1, y, i % 2 ? '#c4c5c3' : '#b3b5b4'); wallE(g, x, EZ0 + 0.1, EZ1 - 0.1, y, y + dy, '#6b6e70'); }
    g.quad([ua, ya - 0.75, EZ0], [ub, yb - 0.75, EZ0], [ub, yb - 0.75, EZ1], [ua, ya - 0.75, EZ1], GREY);
    g.quad([ub, yb - 0.75, EZ0], [ua, ya - 0.75, EZ0], [ua, ya + 0.3, EZ0], [ub, yb + 0.3, EZ0], PALE);
    g.quad([ua, ya - 0.75, EZ1], [ub, yb - 0.75, EZ1], [ub, yb + 0.3, EZ1], [ua, ya + 0.3, EZ1], PALE);
    for (const z of [EZ0 + 0.04, zm, EZ1 - 0.04]) {
      gl.quad([ua, ya + 0.3, z], [ub, yb + 0.3, z], [ub, yb + 0.95, z], [ua, ya + 0.95, z], pal.glass);
      g.tube([[ua - 0.3, ya + 1.0, z], [ua, ya + 0.99, z], [ub, yb + 0.99, z], [ub + 0.3, yb + 1.0, z]], 0.05, 4, '#2f2f30');
    }
  }
  return { g, gl };
}

// ---------------------------------------------------------------- what is made in place
const AT = new Run(0, 0, 0, 0);       // a run that is simply the deck's own x and z
const inPier = (x) => (((x % P) + P) % P) < PIER - 0.01;

// The floors: polished stone in long bands, so that the lanes people keep can be seen from above; and the galleries'.
function* layFloors(deck) {
  const lane = '#cfc8b6', mid = '#c0b8a4', edge = '#b4ad9c', line = '#8d8474';
  for (let x = X0; x < X1 - 0.01; x += 8) {
    const x1 = x + 8, pier = inPier(x + 4), zs = pier ? ZP : ZG, f = deck.pen(AT, x + 4, 'hall').f;
    f.tint(1).floor(x, zs, x1, pier ? -13.7 : -16.75, 0, edge, { emit: 0.75 });
    if (!pier) f.tint(0).floor(x, -16.75, x1, -16.55, 0, '#d2ae4c', { emit: 0.3 }).tint(1).floor(x, -16.55, x1, -13.7, 0, edge, { emit: 0.75 });
    f.tint(0).floor(x, -13.7, x1, -13.55, 0, line, { emit: 0.4 });
    f.tint(0.5).floor(x, -13.55, x1, -7.75, 0, lane, { emit: 0.9 });
    f.tint(0).floor(x, -7.75, x1, -7.6, 0, line, { emit: 0.4 });
    f.tint(1).floor(x, -7.6, x1, 3.65, 0, mid, { emit: 0.85 });
    f.tint(0).floor(x, 3.65, x1, 3.8, 0, line, { emit: 0.4 });
    f.tint(0.5).floor(x, 3.8, x1, 9.75, 0, lane, { emit: 0.9 });
    f.tint(0).floor(x, 9.75, x1, 9.9, 0, line, { emit: 0.4 });
    f.tint(1).floor(x, 9.9, x1, ZF + 0.3, 0, edge, { emit: 0.7 });
    for (let L = 1; L <= 3; L++) f.tint(1).floor(x, ZE, x1, ZW, L * 4, mid, { emit: 0.6 });
    f.tint(0);
    if (deck.clk.due()) { yield 'rue: floors'; deck.clk.go(); }
  }
}

// The ends of the bores, seen from the berths: a dark tube going back into each pier, with a hoop or two of light.
// `shut` piers have a lock's door across the opening instead.
function boreStub(deck, x, dir, shut) {
  const c = deck.bucket(x + dir * 12, TZ, 'bore').c;
  if (shut) { (dir > 0 ? wallW : wallE)(c, x + dir * 0.9, ZT, ZG, -0.5, 15.3, '#2f3338'); for (const y of [3, 6.2, 9.4, 12.6]) c.box(x + dir * 0.9 - 0.12, y - 0.2, ZT + 0.8, x + dir * 0.9 + 0.12, y + 0.2, ZG - 0.6, '#454a52'); return; }
  const pts = []; for (let i = 0; i <= 5; i++) pts.push([x + dir * i * 6, TY, TZ]);
  c.tube(pts, BORE, 20, '#383d45');
  for (const d of [1, 13, 25]) { c.tube([[x + dir * d, TY, TZ], [x + dir * (d + 1), TY, TZ]], BORE - 0.25, 20, '#565c66'); if (d > 1) c.tube([[x + dir * (d + 1), TY, TZ], [x + dir * (d + 1.3), TY, TZ]], BORE - 0.2, 20, '#ffcf98', { emit: 1.1 }); }
  c.box(Math.min(x, x + dir * 30), TY + 8.3, TZ - 0.35, Math.max(x, x + dir * 30), TY + 8.8, TZ + 0.35, '#5b6068');
  const xe = x + dir * 30;
  for (let i = 0; i < 20; i++) { const a0 = i / 20 * 6.2832, a1 = (i + 1) / 20 * 6.2832; c.tri([xe, TY, TZ], [xe, TY + Math.sin(a0) * BORE, TZ + Math.cos(a0) * BORE], [xe, TY + Math.sin(a1) * BORE, TZ + Math.cos(a1) * BORE], '#17191c'); }
}

// Lamps' glows, the plates on the piers and the galleries, and the light itself.
function lightAndLetter(deck) {
  const glows = [];
  // the hall is lit from its ceiling; the berths by work lamps, cooler and far dimmer, so that a train's panes shine
  deck.zone({ min: [X0 - 80, -1, ZG + 0.4], max: [X1 + 80, H + 1, ZE], soft: 1.6, color: '#f6f1e6', power: 0.95, side: 0.42, under: 0.5 });
  deck.zone({ min: [X0 - 80, -5, ZT - 2], max: [X1 + 80, H, ZG - 0.4], soft: 1.2, color: '#d6e0f0', power: 1.15, side: 0.9, under: 0.6 });
  deck.lattice({ origin: [X0 + MOD / 4, 2.94, 17], spacing: [MOD / 2, 6], count: [Math.round((X1 - X0) / (MOD / 2)), 2], storeys: 4, rise: 4, power: 0.8, reach: 3.6 });
  deck.sky({ x0: X0, z0: ZG, x1: X1, z1: ZE, y: H, floor: -0.2, color: '#fbf6ec', power: 0.5 });
  for (const k of KS) {
    const x0 = k * P;
    // amber lamps round each opening into a pier
    for (const xo of [x0 + PIER + 0.9, x0 + P - 0.9]) for (let i = 0; i < 9; i++) for (const z of [ZT + 0.9, ZG - 0.7]) glows.push({ p: [xo, 0.6 + i * 1.75, z], color: '#ffb866', power: 2.2, size: 0.5 });
    // the lit bar over every hatch
    for (const b of [0, 1]) for (const hx of hatchesOf(berthX(k, b))) glows.push({ p: [hx, 2.65, ZG + 0.4], color: '#fff0d6', power: 1.6, size: 0.9 });
    // what a pier says: the ring, and the numbers of its two locks
    const lock = 7 + 2 * k;
    deck.sign(['Station Ring One', 'Rue'], { at: [x0 + 52, 6.4, ZP + 0.06], n: [0, 1], w: 16, h: 3.4, style: 'plate', font: 'cond', font2: 'serif', head: true, ground: '#e9e2cf', ink: '#24221f' });
    deck.sign('Lock ' + (lock - 1), { at: [x0 + 13, 4.2, ZP + 0.06], n: [0, 1], w: 6.4, h: 1.5, style: 'plate', font: 'cond', ground: '#24221f', ink: '#fbf6ec' });
    deck.sign('Lock ' + lock, { at: [x0 + 91, 4.2, ZP + 0.06], n: [0, 1], w: 6.4, h: 1.5, style: 'plate', font: 'cond', ground: '#24221f', ink: '#fbf6ec' });
    // and the galleries' edges: which deck, and what is there
    for (let L = 1; L <= 3; L++) for (const u of [78, 182, 286]) deck.sign('Deck ' + (L + 1) + '   Cabs', { at: [x0 + u, L * 4 - 0.44, ZE - 0.41], n: [0, -1], w: 4.6, h: 0.62, style: 'plate', font: 'cond', ground: '#24221f', ink: '#fbf6ec' });
  }
  deck.glow(glows);
}

// ---------------------------------------------------------------- the Quaysides' fronts, and the Blight Kitchen
// The Kitchen: an open counter under the first gallery (eating-out.md: young cooks, a blight menu cooked longer than
// anyone on the Row, people from across the rows). Drawn in its row's own co-ordinates: u along, v into the building.
function blightKitchen(deck, Pn, b, run, HH, folk, rng) {
  const g = Pn.g, u0 = b.u0 + 0.24, u1 = b.u1 - 0.24, green = '#2f3b34', k = deck.glowK, dep = 4.6, tile = '#cdb994', em = 0.22 * k;
  const c0 = u0 + 0.5, c1 = u1 - 9.2;                       // the counter; beyond it, the wall with the slates
  // the room: lit tile, a back counter of griddles under a shelf of jars
  g.floor(b.u0, 0.16, b.u1, dep, 0.015, '#8f8674');
  wallN(g, b.u0, b.u1, 0, HH - 0.2, dep, tile, em);
  wallE(g, b.u0 + 0.12, 0.26, dep, 0, HH - 0.2, tile, em * 0.7); wallW(g, b.u1 - 0.12, 0.26, dep, 0, HH - 0.2, tile, em * 0.7);
  g.floor(b.u0, 0.26, b.u1, dep, HH - 0.2, shade(tile, 0.85), { down: true, emit: em * 0.5 });
  g.box(c0, 0, dep - 0.95, c1, 0.9, dep - 0.08, '#7c7f80', { skip: 'b', top: '#4a4b4c' });
  g.box(c0, 1.75, dep - 0.36, c1, 1.79, dep - 0.04, '#5c4430', { skip: 's' });
  for (let x = c0 + 0.3; x < c1 - 0.3; x += 0.3 + 0.25 * rng()) g.box(x, 1.79, dep - 0.3, x + 0.2, 1.95 + 0.16 * rng(), dep - 0.08, mixc('#c9914e', '#7f9b63', rng()), { skip: 'bs', emit: 0.3 });
  for (let x = c0 + 0.9; x < c1 - 1.6; x += 2.3) {
    g.box(x, 0.9, dep - 0.86, x + 1.5, 0.96, dep - 0.2, '#2a2a2b', { skip: 'b' });
    for (let i = 0; i < 4; i++) g.box(x + 0.14 + i * 0.34, 0.96, dep - 0.72 + (i % 2) * 0.2, x + 0.4 + i * 0.34, 0.99, dep - 0.5 + (i % 2) * 0.2, i % 3 ? '#d9a55a' : '#b97f3a', { skip: 'b' });
    for (let i = 0; i < 5; i++) deck.glow([{ p: run.pt(x + 0.2 + 1.1 * rng(), 1.1 + 0.5 * rng(), dep - 0.5), color: '#fff0de', power: 0.1 + 0.1 * rng(), size: 0.9 + rng(), move: [0.04 * (rng() - 0.5), 0.16 + 0.1 * rng(), -0.03 * rng()], loop: 5 + 4 * rng(), phase: rng() }]);
  }
  // the counter people eat at, with the pies set out along it on stands
  g.box(c0, 0, -0.55, c1, 0.95, 0.12, '#8f8474', { skip: 'b', top: '#ddd0b6' });
  g.box(c0, 0.1, -0.58, c1, 0.2, -0.55, '#b08d4a', { skip: 'bs' });
  for (let x = c0 + 1.0; x < c1 - 0.5; x += 1.55) {
    g.cyl(x, 0.95, -0.2, 0.06, 0.12, 0.13, 6, '#e9e4d8', { smooth: false }).cyl(x, 1.08, -0.2, 0.2, 0.2, 0.015, 10, '#e9e4d8');
    g.cyl(x, 1.095, -0.2, 0.165, 0.15, 0.05, 10, '#c98f45', { top: '#e3b96c', emit: 0.25 });
  }
  // its name over the opening, lamps under the gallery, flags
  g.box(u0, 2.32, -0.06, u1, 2.94, 0.26, green, { skip: 't' });
  for (const cu of [c0 + 5.5, (c0 + c1) / 2 + 3, c1 - 4]) deck.sign('The Blight Kitchen', { run, at: run.pt(cu, 2.63, -0.07), h: 0.54, style: 'board', font: 'italic', ground: green, ink: '#ead9b0' });
  for (let x = c0 + 1.2; x < c1; x += 3.1) { deck.put('pendant', { p: run.pt(x, 3.0, -0.6), yaw: 0 }); deck.glow([{ p: run.pt(x, 2.36, -0.6), color: '#ffc27a', power: 2.4 * k, size: 0.8 }]); }
  for (let x = u0 + 2; x < u1 - 1; x += 3.4) deck.put('bunting', { p: run.pt(x, 2.9, -2.6 - 1.6 * ((Math.round(x) % 2))), yaw: 0, color: ['#b5553f', '#e0a52e', '#3f6f73', '#6f8a5a', '#d9cfba'][Math.floor(rng() * 5)] });
  deck.lattice({ origin: [run.pt(c0 + 1.2, 0, 0)[0], 2.3, ZF - 0.5], spacing: [3.1, 3.2], count: [Math.ceil((c1 - c0) / 3.1), 2], color: '#ffc98a', power: 0.85, reach: 3.0 });
  // the wall beyond the counter: the menu on a slate, and the book on the day of par
  wallN(g, c1 + 0.2, u1, 0, 2.32, 0, '#d2c6ae');
  g.box(c1, 0, -0.08, c1 + 0.2, 2.32, 0.26, green, { skip: 'tb' });
  g.box(c1 + 0.2, 0, -0.03, u1, 1.0, 0, GREY, { skip: 'bs' });
  g.box(c1 + 0.75, 0.7, -0.05, c1 + 5.25, 2.25, 0, '#3f3128', { skip: 's' });
  deck.sign(['Blight menu', 'Blight-cheese toastie   0.45', 'Crackling "steak"   0.35', 'Mock apple pie   0.30'], { run, at: run.pt(c1 + 3.0, 1.475, -0.058), w: 4.3, h: 1.4, style: 'chalk' });
  g.box(c1 + 5.85, 1.0, -0.05, c1 + 8.45, 2.1, 0, '#3f3128', { skip: 's' });
  deck.sign(['The par book', 'Favourite: year 23, day 150', 'We keep this menu at par.'], { run, at: run.pt(c1 + 7.15, 1.55, -0.058), w: 2.44, h: 0.96, style: 'chalk' });
  // the cooks, young; whoever is eating; the queue, out along the arcade and back the way the flight comes
  for (let x = c0 + 1.4, i = 0; x < c1 - 0.8; x += 3.6 + rng(), i++) folk.stand.push({ p: run.pt(x, 0, i % 2 ? dep - 1.7 : 0.75), yaw: i % 2 ? 0 : Math.PI, scale: 0.94 });
  for (let x = c0 + 0.9; x < c1 - 0.4; x += 1.14) {
    deck.put('stool', { p: run.pt(x, 0, -1.08), yaw: rng() * 6.28, color: ['#b5553f', '#3f6f73', '#b98a3a', '#51627a', '#6f8a5a'][Math.floor(rng() * 5)], scale: 1.08 });
    if (rng() < 0.72) { folk.sit.push({ p: run.pt(x, 0.5, -1.08), yaw: 0 }); deck.put('bowl', { p: run.pt(x + 0.05, 0.95, -0.36), yaw: 0, color: '#e6dfd0' }); }
  }
  const q = [];
  for (let v = -1.5; v > -4.3; v -= 0.66) q.push(run.pt(c0 - 0.75 + 0.1 * (rng() - 0.5), 0, v));
  for (let x = c0 - 1.3; x > c0 - 25; x -= 0.6 + 0.12 * rng()) q.push(run.pt(x, 0, -4.45 + 0.16 * (rng() - 0.5)));
  q.forEach((p, i) => folk.stand.push({ p, yaw: i < 5 ? 0 : Math.PI / 2 + 0.3 * (rng() - 0.5) }));
  folk.child.push({ p: [q[14][0], 0, q[14][2] + 0.45], yaw: Math.PI / 2 });
}

// Every station ring on Herb Row keeps a hatch for crews and commuters: a cup of Mill broth and a sticky rice ball,
// free, drunk on the platform because glide cars do not take hot soup (eating-out.md, The Ring Counters). Rue's
// stands against the first pier.
function ringCounter(deck, folk, rng) {
  const x0 = 55, x1 = 65, z0 = ZP + 0.02, z1 = ZP + 1.0, g = deck.bucket(60, ZP, 'hall').g, green = '#3d4a44';
  g.box(x0, 0, z0, x0 + 0.2, 2.75, z1, CREAM, { skip: 'bn' }).box(x1 - 0.2, 0, z0, x1, 2.75, z1, CREAM, { skip: 'bn' });
  g.box(x0, 2.75, z0, x1, 2.95, z1 + 0.25, GREY, { skip: 'n' });
  g.box(x0 + 0.2, 2.2, z1 - 0.12, x1 - 0.2, 2.75, z1, green, { skip: 'tn' });
  g.box(x0 + 0.2, 0, z1 - 0.4, x1 - 0.2, 0.98, z1 + 0.1, '#8f8474', { skip: 'b', top: '#ddd0b6' });
  wallS(g, x0 + 0.2, x1 - 0.2, 0.98, 2.2, z0 + 0.1, '#e3c79a', 0.5);
  g.floor(x0 + 0.2, z0, x1 - 0.2, z1, 2.2, '#fff1d8', { down: true, emit: 1.6 });
  for (let x = x0 + 1.3; x < x1 - 1; x += 2.5) {
    deck.put('pan', { p: [x, 0.98, z1 - 0.15], yaw: 0, scale: 0.85, color: '#c9c8c2' });
    for (let i = 0; i < 4; i++) deck.glow([{ p: [x + rng.f(-0.2, 0.2), 1.5 + 0.4 * rng(), z1 - 0.15], color: '#fff0de', power: rng.f(0.1, 0.2), size: rng.f(0.8, 1.5), move: [rng.f(-0.03, 0.03), rng.f(0.15, 0.25), 0.02], loop: rng.f(5, 8), phase: rng() }]);
  }
  for (let x = x0 + 0.6; x < x1 - 0.5; x += 0.4) if (rng() < 0.7) deck.put('bowl', { p: [x, 0.98, z1 - 0.02], yaw: 0, scale: 0.8, color: '#e6dfd0' });
  deck.sign('Ring Counter', { at: [60, 2.475, z1 + 0.012], n: [0, 1], w: 4.4, h: 0.42, style: 'board', font: 'cond', ground: green, ink: '#fbf6ec' });
  deck.sign(['Broth and a rice ball', 'Drink it on the platform.'], { at: [x1 + 1.5, 1.7, ZP + 0.08], n: [0, 1], w: 2.2, h: 0.86, style: 'chalk' });
  deck.glow([{ p: [58, 2.1, z1 + 0.1], color: '#ffd9a8', power: 1.6, size: 0.9 }, { p: [62, 2.1, z1 + 0.1], color: '#ffd9a8', power: 1.6, size: 0.9 }]);
  // people at the counter, a file along the pier, and a few who have their cup and are drinking it
  for (let x = x0 + 0.9; x < x1 - 0.6; x += 0.95) if (rng() < 0.8) folk.stand.push({ p: [x + rng.f(-0.1, 0.1), 0, z1 + 0.62], yaw: Math.PI });
  for (let x = x0 - 0.5; x > x0 - 8; x -= 0.62) folk.stand.push({ p: [x, 0, z1 + 0.5 + rng.f(-0.06, 0.06)], yaw: Math.PI / 2 });
  for (let i = 0; i < 9; i++) folk.stand.push({ p: [rng.f(x1 + 3, x1 + 16), 0, ZP + rng.f(0.9, 1.5)], yaw: rng.f(-0.6, 0.6) });
}

function* quayFronts(deck, folk, rng) {
  const run = new Run(0, 0, ZF, 0);
  return yield* frontage(deck, run, {
    from: X0 + 1, to: X1 - 1, height: 3, part: 'quay',
    fill: { mix: { shop: 2, stall: 1.2, wall: 0.45 }, bay: [4.8, 6.4], lit: 0.9, awnings: 0.25, blades: 0.45 },
    fronts: [
      { from: 141.5, to: 147.5, kind: 'shop', name: 'Bread', goods: 'bread', awning: false, lit: 1, props: false },
      { from: 147.5, to: 154, kind: 'wall', bench: false, wall: CREAM, notice: ['The fitting', 'Fourteen-year-olds and families', 'to the Deck 40 clinic', 'in the birthday week.', 'Cake after.'] },
      { from: 154, to: 190, kind: 'custom', id: 'kitchen', wall: CREAM, draw: (Pn, b, r, HH) => blightKitchen(deck, Pn, b, r, HH, folk, rng) },
      { from: 190, to: 196, kind: 'shop', name: 'Tea', goods: 'tea', awning: false, lit: 1, props: false },
    ],
  });
}

// ---------------------------------------------------------------- the rush
// someone too far off to be more than a few dots: a coat and a head
function farFigure() {
  const g = new Geo();
  g.tint(0.85).box(-0.17, 0, -0.11, 0.17, 1.42, 0.11, '#e9e9e9', { skip: 'b' });
  g.tint(0).box(-0.1, 1.45, -0.1, 0.1, 1.68, 0.1, '#b98a62', { skip: 'b' });
  return g.build();
}
// someone walking in a lane: legs, a coat, a head, in thirty triangles
function plainFigure(skin) {
  const g = new Geo();
  g.tint(0.35).box(-0.14, 0, -0.1, 0.14, 0.86, 0.1, '#6a6f7a', { skip: 'tb' });
  g.tint(1).box(-0.2, 0.84, -0.13, 0.2, 1.44, 0.13, '#ffffff');
  g.tint(0).box(-0.105, 1.47, -0.105, 0.105, 1.7, 0.105, skin, { skip: 'b' });
  return g.build();
}
// Lanes of walkers the whole length of the hall, spinward on the berths' side and anti on the Quaysides'; files at
// every hatch; people standing under the boards; the galleries and the escalators. Rue's rush is orderly, and there
// are next to no children in it.
function* rush(deck, ctx, folk, rng) {
  const dens = ctx.density, stand = folk.stand;
  const N0 = -236, N1 = 566, lanes = [[], [], [], [], [], [], []], speed = 1.42;
  for (const [z, dir] of [[-11.9, 1], [-10.2, 1], [-8.5, 1], [4.85, -1], [6.75, -1], [8.65, -1]]) {
    for (const [a, b, gap, set] of [[N0, N1, 1.25, 0], [X0 + 6, N0, 1.7, 3], [N1, X1 - 6, 1.7, 3]]) for (let i = 0, n = Math.round((b - a) / gap * dens); i < n; i++) {
      const v = speed * rng.f(0.84, 1.16);
      lanes[set ? 3 : (z === 4.85 ? 4 : 0) + i % 3].push({ p: [dir > 0 ? a : b, 0, z + rng.f(-0.42, 0.42)], yaw: dir * Math.PI / 2, drift: [dir * v, 0, 0, (b - a) / v], phase: rng(), color: CLOTH[Math.floor(rng() * CLOTH.length)], scale: rng.f(0.93, 1.07) });
    }
  }
  const flow = (x, y, z0, z1, n) => {
    for (let i = 0; i < n; i++) { const v = rng.f(0.75, 0.98), len = Math.abs(z1 - z0); lanes[i % 3].push({ p: [x + (i % 2 ? 0.36 : -0.36) + rng.f(-0.08, 0.08), y, z0], yaw: z1 > z0 ? 0 : Math.PI, drift: [0, 0, (z1 > z0 ? 1 : -1) * v, len / v], phase: rng(), color: CLOTH[Math.floor(rng() * CLOTH.length)], scale: rng.f(0.93, 1.07) }); }
  };
  for (const k of [-1, 0]) hatchesOf(berthX(k, 0)).forEach((hx, i) => { if (k < 0 || i % 2 === 0) flow(hx, 0, ZG + 4.6, ZG - 1.0, Math.round(8 * dens)); else flow(hx, 0, ZG - 1.0, ZG + 4.6, Math.round(8 * dens)); });
  for (const k of [-1, 0, 1]) for (let L = 1; L <= 3; L++) for (let i = 0; i < 72; i++) if ((i * 7 + L * 3) % 5 === 0) flow(k * P + (i + 0.5) * DOORP, L * 4, ZW - 0.2, ZW - 3.4, 2);
  yield 'rue: lanes';
  for (let i = 0; i < lanes.length; i++) {
    for (const m of instances(i < 3 ? plainFigure(SKIN[i * 2]) : i === 3 ? farFigure() : figureGeo(SKIN[(i - 4) * 2 + 1], 'stand'), deck.drift, lanes[i], { frame: deck.frame, cell: 100000, drift: true })) deck.group.add(m);
    yield 'rue: lanes';
  }
  // under the boards: most of them looking up at the nearest one
  for (let i = 0, n = Math.round(800 * dens); i < n; i++) {
    const x = rng.f(-340, 660), z = rng.f(-6.9, 2.9);
    if (!deck.clear(x, 1.5, z, x < -50 ? 3.7 : 2.3)) continue;
    const bx = Math.round(x / 26) * 26 + (rng() < 0.5 ? 0 : 26 * rng.sign());
    stand.push({ p: [x, 0, z], yaw: Math.atan2(bx - x, ZB - z) + rng.f(-0.3, 0.3), walk: rng() < 0.2 ? rng.f(0.5, 1.1) : 0 });
  }
  yield 'rue: under the boards';
  // a file at every hatch
  for (const k of KS) for (const b of [0, 1]) for (const hx of hatchesOf(berthX(k, b))) {
    if ((k === -1 || k === 0) && b === 0) continue;             // these are the files that move
    const near = k === -1 || k === 0, n = Math.round((near ? rng.i(5, 9) : rng.i(2, 5)) * Math.min(1, dens + 0.2));
    for (let j = 0; j < n; j++) stand.push({ p: [hx + rng.f(-0.12, 0.12) + (j % 2 ? 0.34 : -0.34), 0, ZG + 1.2 + Math.floor(j / 2) * 0.72 + rng.f(-0.08, 0.08)], yaw: Math.PI + rng.f(-0.15, 0.15) });
  }
  yield 'rue: files';
  yield 'rue: under the boards';
  // the Quaysides' side of the platform and the arcade under the first gallery
  for (let i = 0, n = Math.round(330 * dens); i < n; i++) {
    const x = rng.f(-330, 640), z = rng.f(10.6, 19), u = ((x % P) + P) % P;
    if ((u > ESC_U - 1 && u < ESC_U + 3 * (RUN + 3) + 2 && z < EZ1 + 0.8) || (z > 13.6 && z < 15.2) || (x > 126 && x < 194 && z > 13.5) || !deck.clear(x, 1.5, z, 3.4)) continue;
    stand.push({ p: [x, 0, z], yaw: rng() * 6.28, walk: rng() < 0.45 ? rng.f(0.5, 1.3) : 0 });
  }
  // the galleries: people at the rails looking down, people walking, and the escalators
  for (let L = 1; L <= 3; L++) {
    const y = L * 4, gap = landing(L);
    for (let x = -280; x < 600; x += rng.f(2.2, 7) / Math.max(0.4, dens)) {
      const u = ((x % P) + P) % P;
      if ((u > gap[0] - 0.8 && u < gap[1] + 0.8) || !deck.clear(x, y + 1.5, ZE + 0.5, 2.2)) continue;
      stand.push({ p: [x, y, ZE + 0.52], yaw: Math.PI + rng.f(-0.35, 0.35) });
    }
    for (const [z, dir] of [[19.2, 1], [22.6, -1]]) deck.walkersAlong({ from: [dir > 0 ? X0 + 12 : X1 - 12, y, z], to: [dir > 0 ? X1 - 12 : X0 + 12, y, z], n: Math.round(120 * dens), speed: 1.4, spread: 0.6, child: 0, rng });
    yield 'rue: galleries';
  }
  const sp = 0.62, vy = sp * Math.tan(30 * DEG), loop = RUN / sp;
  for (const k of KS) for (let f = 0; f < 3; f++) {
    const ua = k * P + ESC_U + 3 + f * (RUN + 3), ya = 12 - f * 4;
    for (let i = 0, n = Math.max(2, Math.round(6 * dens)); i < n; i++) for (const dn of [1, 0]) {
      const item = { yaw: dn ? Math.PI / 2 : -Math.PI / 2, phase: (i + 0.8 * rng()) / n, pose: 'stand', skin: SKIN[Math.floor(rng() * SKIN.length)], color: CLOTH[Math.floor(rng() * CLOTH.length)], scale: rng.f(0.93, 1.06) };
      if (dn) deck.riders.push({ ...item, p: [ua, ya, EZ0 + 0.85], drift: [sp, -vy, 0, loop] });
      else deck.riders.push({ ...item, p: [ua + RUN, ya - 4, EZ1 - 0.85], drift: [-sp, vy, 0, loop] });
    }
  }
  yield 'rue: galleries';
  // everyone who stands still or strolls, in as few meshes as there are skins
  for (const sp of stand) sp.skin = SKIN[Math.floor(rng() * SKIN.length)];
  for (const sk of SKIN) {
    for (const m of crowd(stand.filter((sp) => sp.skin === sk), deck.walk, { frame: deck.frame, cell: 100000, bob: 0.03, speed: 0.7, seed: 'rue-rush' + sk })) deck.group.add(m);
    yield 'rue: people';
  }
  for (const m of crowd(folk.sit.map((s) => ({ ...s, sit: true, skin: SKIN[1 + (Math.floor(s.p[0]) & 1) * 2] })), deck.walk, { frame: deck.frame, cell: 100000, seed: 'rue-sit' })) deck.group.add(m);
  for (const m of crowd(folk.child.map((s) => ({ ...s, child: true, skin: SKIN[2] })), deck.walk, { frame: deck.frame, cell: 100000, seed: 'rue-child' })) deck.group.add(m);
  return stand.length;
}

// ---------------------------------------------------------------- the bore the flight leaves by, and its lock
// A tube 19 m across going down through the jacket, ribbed every 10 m, every other rib a hoop of light, the rail in
// its roof (the glide begins in such a bore). Once it is clear of the pier and under the next hall it spreads sideways
// to 28 m: the lock's chamber, where a train waits for the outer door. That door stands where the flight ends: two
// leaves that part sideways. Returns what update() needs to open it.
const boreWide = (s) => BORE + 4.5 * smoothstep(85, 110, s);        // half its width, s metres down
function* buildBore(deck, track, path, into) {
  const rig = lampRig({ ambUp: '#5a6170', ambDown: '#343944', zones: [{ min: [-3000, -90, -60], max: [3000, 20, 30], soft: 2, color: '#c9d4e6', power: 0.62, side: 0.55, under: 0.3 }] });
  const bent = litMaterial(rig, { bend: deck.frame, side: 'double' }), plain = litMaterial(rig, { side: 'double' });
  const ex = path.exit, sEnd = Math.ceil((path.exit.flat.x - BX) / Math.cos(SLOPE)) + 26, g = new Geo(), rail = [], N = 28;
  // a ring of the bore's wall at s, `inset` metres inside it
  const ring = (s, inset = 0) => { const a = boreWide(s) - inset, r = []; for (let i = 0; i <= N; i++) { const q = i / N * 6.2832; r.push(track.off(s, Math.sin(q) * (BORE - inset), Math.cos(q) * a)); } return r; };
  const band = (s0, s1, inset, col, e = 0) => { const p = ring(s0, inset), q = ring(s1, inset); for (let i = 0; i < N; i++) g.quad(p[i], q[i], q[i + 1], p[i + 1], typeof col === 'function' ? col(i) : col, e); };
  // (the rail stops short of the door, where the train does: beyond the door is the quay's business)
  for (let s0 = 0; s0 < sEnd; s0 += 5) { band(s0, s0 + 5, 0, (i) => (i % 2 ? '#434851' : '#3d424a')); if (s0 <= sEnd - 60) rail.push(track.off(s0, 8.55)); if (s0 % 80 === 75) yield 'rue: the bore'; }
  g.tube(rail, 0.42, 4, '#5b6068');
  { const e = rail[rail.length - 1], e2 = track.off(sEnd - 60 + 1.2, 8.55); g.tube([e, e2], 0.8, 6, '#d2ae4c', { emit: 0.4 }); }
  yield 'rue: the bore';
  for (let s0 = 10; s0 <= sEnd; s0 += 10) {
    band(s0 - 0.5, s0 + 0.5, 0.25, '#5d636d');
    if ((s0 / 10) % 2 === 0) band(s0 + 0.5, s0 + 0.9, 0.2, '#ffcf98', 1.7);
    if (s0 % 100 === 0) yield 'rue: the bore';
  }
  band(0.05, 1.2, 0.3, '#7c8088');
  yield 'rue: the bore';
  into.add(g.mesh(bent, deck.frame));
  yield 'rue: the bore';
  // the door: modelled unbent at the origin, looking back up the bore (+z), then stood at the flight's last opening
  const R0 = ex.radius, ringG = new Geo(), lamps = [], seg = 36;
  for (let i = 0; i < seg; i++) {
    const a0 = i / seg * 6.2832, a1 = (i + 1) / seg * 6.2832, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    ringG.quad([c0 * R0, s0 * R0, 0.2], [c1 * R0, s1 * R0, 0.2], [c1 * 16, s1 * 16, 0.2], [c0 * 16, s0 * 16, 0.2], i % 2 ? '#4b5059' : '#474c55');
    ringG.quad([c0 * R0, s0 * R0, -0.6], [c1 * R0, s1 * R0, -0.6], [c1 * R0, s1 * R0, 0.2], [c0 * R0, s0 * R0, 0.2], '#6a7079');
    if (i % 3 === 0) lamps.push({ p: [c0 * (R0 + 0.45), s0 * (R0 + 0.45), 0.3], color: '#ffb866', power: 3.2, size: 0.8 });
  }
  const frameMesh = ringG.mesh(plain);
  const leaves = [];
  for (const sd of [-1, 1]) {
    const lg = new Geo(), n = 14;
    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 + i / n * Math.PI, a1 = -Math.PI / 2 + (i + 1) / n * Math.PI;
      const p0 = [sd * Math.cos(a0) * (R0 + 0.3), Math.sin(a0) * (R0 + 0.3), 0.12], p1 = [sd * Math.cos(a1) * (R0 + 0.3), Math.sin(a1) * (R0 + 0.3), 0.12];
      lg.tri([0, 0, 0.12], p0, p1, i % 2 ? '#59606a' : '#525862');
    }
    for (const y of [-5.4, -2.7, 0, 2.7, 5.4]) { const w = Math.sqrt(R0 * R0 - y * y) - 0.5; lg.box(sd > 0 ? 0.25 : -w, y - 0.16, 0.12, sd > 0 ? w : -0.25, y + 0.16, 0.19, '#6f7680'); }
    lg.box(sd > 0 ? 0 : -0.22, -R0, 0.12, sd > 0 ? 0.22 : 0, R0, 0.19, '#d2ae4c', { emit: 0.5 });
    const m = lg.mesh(plain);
    leaves.push([m, sd]);
  }
  const glow = glowPoints(lamps, { maxPx: 160, soft: 1.8 }), green = glowPoints(lamps.map((l) => ({ ...l, color: '#9ff0b0' })), { maxPx: 160, soft: 1.8, power: 0 });
  const right = new Vector3(1, 0, 0).applyQuaternion(ex.quat);
  for (const m of [frameMesh, glow, green, leaves[0][0], leaves[1][0]]) { m.position.copy(ex.pos); m.quaternion.copy(ex.quat); m.frustumCulled = false; into.add(m); }
  return {
    bent, sEnd,
    // k = 0 shut, 1 open: the leaves draw back into the rock, and the lamps round the door go from amber to green
    open(k) {
      for (const [m, sd] of leaves) m.position.copy(ex.pos).addScaledVector(right, sd * k * (R0 + 0.6));
      glow.material.uniforms.uPower.value = 1 - k; green.material.uniforms.uPower.value = k;
    },
  };
}

// ---------------------------------------------------------------- trains, stood and moved
// Every train but one is a single mesh modelled at x = 0 and turned round the drum's axis to wherever it is. The one
// the flight leaves with is five cars, each stood on the rail by itself, so that it can follow the bore down.
function* standTrains(deck, track, bore, into, rng) {
  const R = deck.frame.floorR, fineG = new Geo(), rngA = makeRng('rue-train-a');
  for (let c = 0; c < 5; c++) { drawCar(fineG, (c - 2) * PITCH, true, rngA, c === 0, c === 4, c < 4); yield 'rue: trains'; }
  const fine = fineG.build(), plain = trainGeo(false, 'rue-train-b').build();
  for (const gq of [fine, plain]) fitBounds({ geometry: gq }, deck.frame);
  yield 'rue: trains';
  const list = TRAINS.map((def) => { const m = new Mesh(def.k === -1 || def.k === 0 ? fine : plain, deck.lit); deck.group.add(m); return { def, mesh: m }; });
  const cars = [], inv = deck.frame.stand(0, TZ, { h: TY }).invert(), B = new Matrix4(), Rz = new Matrix4();
  for (let c = 0; c < 5; c++) {
    const g = new Geo(); drawCar(g, 0, true, rng, c === 0, c === 4, c < 4);
    const m = g.mesh(deck.lit, deck.frame); m.matrixAutoUpdate = false; into.add(m); cars.push(m);
    yield 'rue: trains';
  }
  return (t) => {
    for (const { def, mesh } of list) {
      const x = trainX(def, t);
      mesh.rotation.z = x / R;
      // a train inside a pier is out of sight: it is not drawn until its nose is at the opening, nor once its tail is through
      mesh.visible = x + 50 > def.k * P + PIER - 4 && x - 50 < (def.k + 1) * P + 4;
    }
    const d = heroRun(t);
    for (let c = 0; c < 5; c++) {
      const s = -52 + d + (c - 2) * PITCH, q = track(s), m = cars[c];
      deck.frame.stand(q[0], TZ, { h: q[1] }, B);
      m.matrix.copy(B).multiply(Rz.makeRotationZ(q[2])).multiply(inv);
      m.matrixWorldNeedsUpdate = true;
      m.material = s > 3 ? bore.bent : deck.lit;
    }
  };
}

// ---------------------------------------------------------------- the world
// Rue's paint: the plain ramp, greys and creams (three-nights' canon: "Rue says it will paint dawns when it reaches par").
const RUE = {
  ...PALETTES.warm,
  walls: ['#d9cdb5', '#d2c6ae', '#cfc8b8', '#dcd2bc', '#c9c0ac', '#e0d6c2'], dado: ['#8d8474', '#7f7a6e', '#948a78', '#857f72'],
  trim: ['#3d3a34', '#4a453c', '#35332f', '#514b40'], floor: '#c0b8a4', strip: '#8d8474', court: '#c9c2b0', ceiling: '#b8ae9a', rib: '#e6dcc8',
  glass: '#cfe0e2', lamp: '#fff1dc', goods: 0.75,
};

export const rueCount = {
  id: 'rue-count',
  title: 'Under the Count', drum: 'Rue', row: 'Herb Row', kind: 'a counted drum', light: 0.0,
  line: 'Rue hangs its Count over every platform, the same board as far up the curve as I could see, and while I stood reading it the last figure went down by one. Then I queued for mock apple pie, 0.30, which tastes of an apple I have never eaten.',
  tone: '#d9cdb5', source: 'people.md (Counted drums), drum-transport.md (Station rings), eating-out.md (Rue)',
  sound: { root: 45, scale: 'dorian', pad: 0.4, air: 0.3, hum: 0.45, crowd: 0.85, bells: 0.1, bright: 0.35 },
  *build(ctx) {
    const frame = makeFrame(64 * DEG, DRUM.L / 18, deckRadius(1));       // Station Ring One, on the rim deck
    const rng = makeRng('rue-count'), track = makeTrack(380), R = frame.floorR;
    // under a board; up until the boards recede; along the galleries; down to the Kitchen's queue and counter; across the
    // platform behind a train that is pulling out; into its bore, along its windows, and out by the lock's door
    const path = makePath([
      { t: 0, p: [-64.5, 1.75, 0.4] },
      { t: 4.5, p: [-57.5, 2.2, 0.9], look: [-52, 5.4, -3.4] },
      { t: 8.0, p: [-49, 4.4, 4.2], look: [0, 5.0, -4.5] },
      { t: 12.4, p: [-24, 9.4, 6.0], look: [130, 4.5, -12] },
      { t: 17.6, p: [22, 11.3, 6.5], look: [150, 9, 16] },
      { t: 22.2, p: [72, 9.2, 8.3], look: [150, 3, 18] },
      { t: 26.6, p: [122, 2.9, 11.0], look: [158, 1.7, 17.5] },
      { t: 30.2, p: [150, 2.0, 12.6], look: [170, 1.5, 19.5] },
      { t: 32.6, p: [163, 1.8, 16.3], look: [178, 1.45, 20.4] },
      { t: 35.0, p: [177, 1.8, 16.5], look: [190, 1.6, 20.2] },
      { t: 36.7, p: [184, 2.3, 12.6], look: [214, 3.8, -7] },
      { t: 38.2, p: [194.5, 3.4, 9.2], look: [236, 5.2, -8] },
      { t: 39.7, p: [207, 4.6, 5.0], look: [240, 5.6, -7] },
      { t: 41.3, p: [221, 5.4, -4.0], look: [262, 5.9, -14] },
      { t: 42.6, p: [232, 5.9, -13.0], look: [296, 6.2, -23] },
      { t: 43.8, p: [244, 6.0, ZG], look: [312, 6.2, -23.5] },
      { t: 45.1, p: [268, TY + 0.05, TZ + 4.2], look: [340, 5.4, TZ + 2] },
      { t: 47.0, p: track.off(0, 0.2, 3.5), look: track.off(70, 0.5, 2.5) },
      { t: 49.0, p: track.off(44, 0.6, 4.0), look: track.off(110, 1, 3.5) },
      { t: 51.2, p: track.off(92, 1.2, 5.6), look: track.off(160, 2, 5) },
      { t: 52.4, p: track.off(118, 2.0, 10.4), look: track.off(175, 1.6, 5.6) },
      { t: 55.2, p: track.off(180, 2.3, 11.4), look: track.off(232, 1.3, 5.6) },
      { t: 57.4, p: track.off(229, 2.0, 11.0), look: track.off(280, 0.6, 4) },
      { t: 58.8, p: track.off(258, 1.2, 7.0), look: track.off(300, 0, 1) },
      { t: 59.9, p: track.off(276, 0.5, 2.2), look: track.off(315, 0, 0) },
      { t: 61.0, p: track.off(289.5) },
      { t: 62.6, p: track.off(305.9) },
    ], { frame, entryRadius: 1.4, exitRadius: 8.6 });
    const deck = makeDeck(ctx, { frame, near: path.points(0.5), seed: 'rue-count', palette: RUE, light: { level: 1.1, lamp: '#fff1dc', ambUp: '#5a544a', ambDown: '#403b34' }, floor: { shine: 1, slab: [0.9, 0.9] }, detail: 44 });
    const folk = { stand: [], sit: [], child: [] };
    yield 'rue: path';

    yield* layFloors(deck);
    // the hall, a stretch at a time: one model, turned to each stretch's place
    const sh = yield* shellGeo(deck.pal);
    const solid = sh.g.build(); yield 'rue: shell';
    const glass = sh.gl.build(); yield 'rue: shell';
    fitBounds({ geometry: solid }, frame); fitBounds({ geometry: glass }, frame);
    for (const k of KS) {
      const a = new Mesh(solid, deck.lit), b = new Mesh(glass, deck.glassMat);
      a.rotation.z = b.rotation.z = k * P / R; b.renderOrder = 4;
      deck.group.add(a, b);
      boreStub(deck, k * P + PIER, -1, k === 1);
      if (k !== 0) boreStub(deck, (k + 1) * P, 1, false);
      yield 'rue: stretches';
    }
    lightAndLetter(deck);
    ringCounter(deck, folk, rng);
    yield 'rue: light';
    yield* quayFronts(deck, folk, rng);
    yield 'rue: fronts';
    const xs = []; for (let x = X0 + 26; x < X1; x += 26) xs.push(x);
    const boards = yield* countBoards(deck, xs);
    deck.group.add(boards.mesh);
    yield 'rue: the Count: boards';
    // two of Rue's few children, under the first board with someone grown
    for (const [x, z] of [[-45.4, -2.2], [-44.6, -1.5]]) if (deck.clear(x, 1.2, z, 2.4)) folk.child.push({ p: [x, 0, z], yaw: Math.atan2(-26 - x, ZB - z) });
    const count = yield* rush(deck, ctx, folk, rng);
    const tunnel = new Group(), bore = yield* buildBore(deck, track, path, tunnel);
    yield 'rue: the lock';
    const moveTrains = yield* standTrains(deck, track, bore, tunnel, rng);
    yield* finish(deck);
    const scene = new Scene();
    scene.add(deck.group, tunnel);

    const look = { exposure: 1.22, bloom: 0.2, threshold: 1.0, saturation: 1.0, contrast: 1.04, vignette: 0.5 };
    const T = path.tCross;
    let pre = 0;
    const update = (t, dt) => {
      if (t <= 0) pre += dt || 0;            // seen through the last world's opening: the clock on the boards runs all the same
      boards.set(t, pre);
      moveTrains(t);
      deck.group.visible = t < 47.9;        // once the eye is down the bore the hall is behind it, and need not be drawn
      bore.open(smoothstep(T - 7.0, T - 3.6, t));
      // the bore is dark: the eye opens
      const dark = smoothstep(46.2, 49.0, t);
      look.exposure = 1.22 + 0.55 * dark; look.bloom = 0.2 + 0.12 * dark;
    };
    update(0, 0);
    return { scene, path, deck, count, near: 0.3, far: 1500, look, portal: { rim: false, mist: '#0a0b0e', mistPower: 0.6, openFor: 7.5 }, update };
  },
};
