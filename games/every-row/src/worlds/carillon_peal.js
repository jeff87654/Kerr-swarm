// Carillon, Bell Row: a naming in the Belfry at Peal Court. Carillon is a hall drum and a drum of choirs: every block
// has one, and "a round is sung at every naming, against itself" (games/three-nights/src/15-canon.js, Carillon;
// docs/open-drums.md, Culture and The calendar: "A child's table stands up for them"; wander-year.md, Day 140). Its
// neighbourhoods are Peal Court, Belfry and Rounds, which are words from bell-ringing, so here is a ring of bells.
//
// The Belfry is a square well 14 m across cut up through eight decks, 229 to 236, with a gallery round it on every
// deck. y = 0 is the floor of deck 229 (radius 2,088 m, 0.70 g); the axles of the bells are at y = 24.6 (radius
// 2,063 m), where a thing weighs 0.688 of what it would in old air and the deck goes round at V = 118 m/s. Twelve
// bronze bells, 0.6 m across the mouth (the treble) to 1.5 m (the tenor), hang in one frame; twelve ropes come down
// through a guide ring to twelve ringers on the floor. This is full-circle ringing as English towers do it: each bell
// swings from mouth up right over to mouth up, a little under a full turn each way, and speaks once a swing.
//
// The sums, which are what the place is for:
//   - A bell is a pendulum, so every swing takes 1 / sqrt(0.688) = 1.205 times as long here: about a fifth longer.
//     A row of twelve takes 3.12 s (a beat of 0.26 s between bells); the same swings in old air take 2.59 s. A peal
//     of 5,040 changes is 4 h 33 min here and would be 3 h 46 min there, as the board by the arch says.
//   - Each swing drawn here is the exact pendulum that fits between two of that bell's blows (Jacobi's cd), so a bell
//     that must leave a longer gap rises nearer the balance: the tenor (pendulum length 1.02 m) turns 8 degrees short
//     of mouth up at backstroke and 6 short at handstroke, the treble under one degree short, where it hangs waiting.
//   - A bell hung to swing spinward and anti would weigh more one way than the other. The tenor's weight moves at
//     5.2 m/s through the bottom of its swing, so 2u / V = 8.9% of its weight comes and goes (5.6% for the treble):
//     heavy at every handstroke and light at every backstroke, or the other way about. That push goes straight
//     through the axle, so the swing itself keeps time; what limps is the tread on the gudgeons and the frame, and
//     the clapper, which is thrown by the bell and comes across 7 ms sooner one way than the other (3 ms for the
//     treble; from stepping bell and clapper through a swing as two pendulums). Ringers call that odd-struck.
//   - So every bell is hung to swing fore and aft, where "axis flies true" (ashgrove.md): all twelve wheels stand in
//     planes along the axis. Swung that way a bell only leans on its end collars, up to 7% of its weight, spinward
//     as it rises and anti as it falls, which changes nothing in the swing.
//   - A rope is not hung any way: it goes up and down. Rising at up to 5.7 m/s it is pushed spinward by 2 x 0.0572 x
//     5.7 = 0.65 m/s2, a tenth of its weight, and falling it is pushed back. The 17 m of rope under the guide ring
//     is a slack string, so each push bows it spinward by a few centimetres (f L2 / 8T) and leaves it swaying.
//   - The clapper leaves the lip it lay on before the bottom of the swing and strikes the other 56 degrees short of
//     mouth up, 0.33 s after the bottom for the treble and 0.52 s for the tenor (the same stepped pendulums).
//
// The flight: along Choir Street at eye height to an arch with the ropes going up and down beyond it; out between
// the tenor's rope and the treble's into the ring of ringers, the parents with the baby and its table inside it;
// up the middle of the well among the ropes past five galleries of the block's choir, each with small lamps and
// sheets; through the guide ring and up through the frame as the bells swing over; out above them under the lamps
// to look down as the ringers set their bells, treble first; and down into the mouth of the tenor as it stands.
//
// Not canon (the docs give Carillon its choirs, its rounds at namings and these names, and nothing of bells):
//   - bells at all, and that Peal Court keeps a ring of twelve; the Belfry, its size and its eight decks; the frame,
//     the guide ring, the louvred deck beside the bells; full-circle ringing here, and that bells are hung fore and aft
//   - how the naming is staged: the family and four aunts inside the rope circle, the gift from the dead's family as
//     a small hand bell, the choir by galleries with the children's on deck 232, the round in four parts that go
//     round the well, rounds and four called changes, and the bells set four to a row
//   - Choir Street's shops (Sallies, Quiet, Sheets, Pepper Broth) and every board, slate and plate; the drum's motto
//     ("Sing it back.", which is canon) hung on a cloth over the first gallery
import { Scene, Mesh, ShaderMaterial, Float32BufferAttribute, Vector3, Vector4, Matrix4, DoubleSide } from 'three';
import { makePath } from '../core/path.js';
import { DRUM, makeFrame, deckRadius, DEG } from '../kit/drum.js';
import { makeDeck, finish, street, rose, Run, PALETTES } from '../kit/deck.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG, glowPoints } from '../kit/mats.js';
import { Geo, shade, fitBounds } from '../kit/geo.js';
import { makeRng, smoothstep, clamp } from '../core/rng.js';

// ---------------------------------------------------------------- the shape of the place
const TAU = Math.PI * 2;
const DECK0 = 229;                 // the deck whose floor is y = 0
const W = 7;                       // half the well
const GD = 2.6;                    // a gallery, from its rail to its doors
const BAY = 2.8, NBAY = 5;         // five arches to a side
const LEVELS = 8, RISE = 4, TOP = LEVELS * RISE;
const LOUVRED = 6;                 // the deck beside the bells (235) is shut with sound louvres
const YA = 24.6;                   // the axles
const YGIRD = 22.9;                // the underside of the frame's girders
const YSPIDER = 19.4;              // the guide ring the ropes come through
const RC = 3.0;                    // the rope circle
const NB = 12;
const GRAV = DRUM.OMEGA * DRUM.OMEGA * (deckRadius(DECK0) - YA);      // 6.75 m/s2 at the axles

// ---------------------------------------------------------------- the ring
// Bell i (0 the treble, 11 the tenor): its mouth D, the length L of the pendulum it is, its wheel's radius, and how
// long after the bottom of a swing its clapper strikes (sig) and before it that it leaves the other lip (lv).
const BEAT = 0.26;                 // seconds from one bell to the next in a row
const TH = 42.28;                  // when row 0 (a handstroke) begins, in seconds of the flight
const DSET = 0.09;                 // how far past mouth up a bell rests on its stay, radians
const PSIM = 0.492;                // how far the clapper swings from the bell's own axis to its lip
const PULL = 1.1, YLOW = 0.55;     // a handstroke pull, metres; a sally's middle at its lowest
const YCATCH = YLOW + PULL;        // where a sally is caught: the height it is modelled at
const SALLY = 0.9;                 // its length
const SWAY_W = TAU / 1.5;          // a fall of rope swings from side to side about once in a second and a half
const BELLS = [];
for (let i = 0; i < NB; i++) {
  const D = 0.6 * Math.pow(2.5, i / 11), L = 0.68 * D, k = Math.sqrt(D / 0.6), rw = 0.42 + 0.47 * D;
  BELLS.push({ i, D, L, rw, w0: Math.sqrt(GRAV / L), sig: 0.329 * k, lv: 0.181 * k, amp: new Map(), thg: -Math.PI + PULL / rw });
}
// Rows: even rows are handstrokes, odd rows backstrokes, and there is a beat's gap before every handstroke.
const rowStart = (n) => TH + Math.floor(n / 2) * 25 * BEAT + (n & 1 ? 12 * BEAT : 0);
// The place bell i strikes in, in row n. Rounds, then four called changes, each at a handstroke: 2 to 3, 4 to 5,
// 3 to 2, 5 to 4 (the slate by the treble says so), and rounds again for the last two whole pulls.
function placeOf(i, n) {
  if (n >= -8 && n < -4) { if (i === 1) return 2; if (i === 2) return 1; }
  if (n >= -6 && n < -2) { if (i === 3) return 4; if (i === 4) return 3; }
  return i;
}
// The row a bell speaks in for the last time before it is set: four bells to a row, the treble's four first.
const lastRow = (i) => 1 + (i >> 2);
const bottom = (i, n) => rowStart(n) + placeOf(i, n) * BEAT - BELLS[i].sig;      // when it passes mouth down on the way to that blow
const agm = (a, b) => { for (let j = 0; j < 12; j++) { const t = (a + b) / 2; b = Math.sqrt(a * b); a = t; } return a; };
// cos(A / 2) for the swing that takes `I` seconds from one bottom to the next: the half period is pi / (w0 agm(1, k'))
function kpFor(B, I) {
  const key = Math.round(I * 1e4);
  let kp = B.amp.get(key);
  if (kp === undefined) {
    const M = Math.PI / (B.w0 * I);
    let lo = 1e-9, hi = 1;
    for (let j = 0; j < 60; j++) { const m = (lo + hi) / 2; if (agm(1, m) < M) lo = m; else hi = m; }
    kp = (lo + hi) / 2; B.amp.set(key, kp);
  }
  return kp;
}
// Jacobi's cd = cn / dn for modulus k (k' is handed in: k is within a hair of 1 for a bell rung up to the balance)
const _ea = new Float64Array(12), _ec = new Float64Array(12);
function cdn(u, k, kp) {
  let n = 0, b = kp;
  _ea[0] = 1; _ec[0] = k;
  while (Math.abs(_ec[n]) > 1e-11 && n < 10) { const an = (_ea[n] + b) / 2, cn = (_ea[n] - b) / 2; b = Math.sqrt(_ea[n] * b); n++; _ea[n] = an; _ec[n] = cn; }
  if (!n) return Math.cos(u);
  let phi = (1 << n) * _ea[n] * u, prev = phi;
  for (let j = n; j > 0; j--) { prev = phi; phi = (phi + Math.asin(_ec[j] / _ea[j] * Math.sin(phi))) / 2; }
  return Math.cos(prev - phi);
}
/**
 * Where bell i is at second s of the flight: o.th its angle (0 mouth down, -pi mouth up at handstroke, +pi at
 * backstroke; turning toward +z is positive), o.psi its clapper's angle from the bell's own axis, o.hit how long
 * ago it last spoke. Everything else that moves (wheel, rope, sally, tail, stay) is drawn from th.
 */
function ring(i, s, o) {
  const B = BELLS[i], N = lastRow(i);
  let n = Math.floor((s + B.sig - TH) / (12.5 * BEAT)) - 2;
  if (n > N + 1) n = N + 1;
  while (n <= N && bottom(i, n) <= s) n++;
  const e = n & 1 ? 1 : -1;                              // the side it turns on before its blow in row n
  const b1 = bottom(i, Math.min(n, N));
  const flight = (bt) => { const q = (s - bt + B.lv) / (B.sig + B.lv); return q <= 0 ? -1 : q >= 1 ? 1 : -1 + 2 * Math.pow(q, 2.2); };
  if (n > N) {
    // its last blow is struck: up to the balance with just enough to go over, and down onto the stay
    const t = s - b1, ta = 2.77 / B.w0;
    let a;
    if (t < ta) a = 4 * Math.atan(Math.exp(B.w0 * t)) - Math.PI;
    else a = Math.PI - 0.25 + (0.25 + DSET) * (1 - Math.pow(1 - Math.min(1, (t - ta) * B.w0 / 3), 2.2));
    o.th = e * a; o.psi = e * PSIM * flight(b1); o.hit = s - b1 - B.sig; o.set = clamp((t - ta) * B.w0 / 3, 0, 1);
    return o;
  }
  const b0 = bottom(i, n - 1), kp = kpFor(B, b1 - b0), k = Math.sqrt(1 - kp * kp);
  o.th = e * 2 * Math.asin(Math.min(1, k * cdn(B.w0 * (s - (b0 + b1) / 2), k, kp)));
  // through the last bottom the bell turned toward e and threw its clapper that way; through the next it turns back
  o.psi = s < b1 - B.lv ? e * PSIM * flight(b0) : -e * PSIM * flight(b1);
  o.hit = s - b0 - B.sig; o.set = 0;
  return o;
}
// a sally's middle, metres above the floor, for a bell at angle th
const sallyY = (B, th) => YLOW + B.rw * Math.abs(th - B.thg);

// ---------------------------------------------------------------- the frame: where each bell hangs
// Twelve pits round an opening in the middle, every one of them lying along the axis. Going clockwise seen from
// above, as rope circles do: the tenor and the treble side by side over the arch (the -z row: 11, 12, 1, 2), then 3
// and 4 down the spinward side, 5 to 8 along the far row, 9 and 10 down the anti side. A pit is the bell's width and
// its wheel's; the wheel stands on whichever side of the bell brings its rope nearest its place in the rope circle.
const pitW = (B) => B.D + 0.55, pitH = (B) => Math.max(B.rw, 0.92 * B.D) + 0.15;
const ZG = 2.75;                               // the two girders that part the rows from the columns
const XCOL = 1.5;                              // the columns' inner edges: the opening in the middle is 3 m by 5.5
function layFrame() {
  const b = BELLS;
  const row = (ids, z) => { let w = 0; for (const i of ids) w += pitW(b[i]); let x = -w / 2; for (const i of ids) { b[i].cx = x + pitW(b[i]) / 2; b[i].cz = z; b[i].row = 1; x += pitW(b[i]); } };
  row([10, 11, 0, 1], -(ZG + 0.15 + pitH(b[11])));
  row([7, 6, 5, 4], ZG + 0.15 + pitH(b[7]));
  for (const [i, sx, sz] of [[2, 1, -1], [3, 1, 1], [8, -1, 1], [9, -1, -1]]) { b[i].cx = sx * (XCOL + pitW(b[i]) / 2); b[i].cz = sz * pitH(b[i]); b[i].row = 0; }
  for (const B of b) {
    const a = (285 + 30 * B.i) * DEG;
    B.rx = RC * Math.cos(a); B.rz = RC * Math.sin(a); B.ca = Math.cos(a); B.sa = Math.sin(a);
    let best = 1e9;
    for (const sw of [-1, 1]) for (const st of [-1, 1]) {
      const d = Math.hypot(B.cx + sw * (B.D / 2 + 0.12) - B.rx, B.cz + st * B.rw - B.rz);
      if (d < best) { best = d; B.sw = sw; B.st = st; }
    }
    B.xw = B.cx + B.sw * (B.D / 2 + 0.12); B.zt = B.cz + B.st * B.rw;
    // the tail of its rope: long enough to be held at arm's stretch when the bell stands at backstroke
    B.tail = sallyY(B, Math.PI + DSET) - SALLY / 2 - 2.15;
  }
}
layFrame();
const ZOUT0 = BELLS[11].cz - pitH(BELLS[11]) - 0.15, ZOUT1 = BELLS[7].cz + pitH(BELLS[7]) + 0.15;      // the outer girders

// ---------------------------------------------------------------- what moves, in one mesh
// Bells with their headstocks, wheels and stays, their clappers, the ropes, the sallies and the tails in the
// ringers' hands are one mesh with one shader. Each vertex says what it belongs to (aRing: kind, bell, a, b) and
// the shader turns it about that bell's axle, or about the clapper's pin and then the axle, or runs it up and down
// with the rope. The turning is done in the flat model before it is bent, so the lamps light a bell as it stands.
//   kind 1  turns with the bell         a: how much it shines when the bell speaks     b: how polished it is
//   kind 2  the clapper                 (the same)
//   kind 3  rope and sally              a: its share of the rope's travel (1 at the sally, 0 at the guide ring)   b: its share of the bow
//   kind 4  the tail                    a: how far along it, 0 at the sally to 1 in the hand
const RING_VERT = /* glsl */`
attribute vec4 aCol; attribute float aEmit; attribute vec4 aRing;
${BEND_PARS}
uniform vec4 uSw[${NB}];      // the bell's angle, its clapper's, the rope's height above where it is modelled, its bow
uniform vec4 uAx[${NB}];      // the axle's z, the clapper pin's y, how lately it spoke (1 falling to 0), -
uniform vec4 uRp[${NB}];      // the rope's x and z, and where the ringer's hand is from it
uniform vec4 uTl[${NB}];      // the tail's length, the hand's height at rest, -, the sally's foot as modelled
uniform float uYA;
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying float vEmit; varying float vGloss;
vec2 kTurn(vec2 d, float a) { float c = cos(a), s = sin(a); return vec2(d.x * c + d.y * s, -d.x * s + d.y * c); }
void main() {
  vec3 p = position, n = normal;
  int kind = int(aRing.x + 0.5), i = int(aRing.y + 0.5);
  float glow = aEmit, gloss = 0.0;
  if (kind == 1 || kind == 2) {
    vec4 S = uSw[i], A = uAx[i];
    if (kind == 2) { vec2 pin = vec2(A.y, A.x); p.yz = pin + kTurn(p.yz - pin, S.y); n.yz = kTurn(n.yz, S.y); }
    vec2 ax = vec2(uYA, A.x);
    p.yz = ax + kTurn(p.yz - ax, S.x); n.yz = kTurn(n.yz, S.x);
    glow += A.z * aRing.z; gloss = aRing.w;
  } else if (kind == 3) {
    p.y += uSw[i].z * aRing.z; p.x += uSw[i].w * aRing.w;
  } else if (kind == 4) {
    vec4 T = uTl[i], Rp = uRp[i];
    float foot = T.w + uSw[i].z;                         // the sally's foot now
    float hand = max(foot - T.x, T.y);                   // the hand goes up with the rope's end at backstroke
    float low = max(0.5 * (foot + hand - T.x), 0.03);    // the bottom of the loop of slack, or the floor
    float d1 = foot - low, d2 = hand - low, s = aRing.z * T.x;
    float y = s < d1 ? foot - s : (s > T.x - d2 ? hand - (T.x - s) : low);
    float k = smoothstep(d1 - 0.18, T.x - d2 + 0.18, s);
    p = vec3(p.x + Rp.z * k + uSw[i].w * 0.7 * (1.0 - k), y, p.z + Rp.w * k);
  }
  vF = p; vFN = normalize(n); vCol = aCol.rgb; vEmit = glow; vGloss = gloss;
  kBend(p, n);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const ringFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform vec3 uSheen;
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying float vEmit; varying float vGloss;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN), FN = normalize(vFN);
  if (!gl_FrontFacing) { N = -N; FN = -FN; }
  vec3 c = vCol * (kLight(vW, N, vF, FN) + vEmit);
  if (vGloss > 0.0) {
    // bronze holds the lamps: a streak where it mirrors the light overhead, and a little along its edges
    vec3 V = normalize(cameraPosition - vW), up = kUp(vW);
    float streak = pow(max(dot(reflect(-V, N), up), 0.0), 26.0), edge = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    c += vGloss * uSheen * (streak + 0.12 * edge) * (0.25 + vCol * 2.0);
  }
  gl_FragColor = vec4(kAir(c, vW), 1.0);
}`;

function makeRinging(deck) {
  const g = new Geo(), tags = [];
  const R = {
    g,
    /** everything fn draws belongs to bell i as `kind`, with the two numbers a and b */
    part(kind, i, a, b, fn) { const v0 = g.pos.length / 3; fn(g); const v1 = g.pos.length / 3; for (let v = v0; v < v1; v++) tags.push(kind, i, a, b); return R; },
    /** the same, but a(x, y, z) and b(x, y, z) are worked out for each vertex */
    each(kind, i, a, b, fn) { const v0 = g.pos.length / 3; fn(g); const v1 = g.pos.length / 3, P = g.pos; for (let v = v0; v < v1; v++) tags.push(kind, i, a(P[v * 3], P[v * 3 + 1], P[v * 3 + 2]), b(P[v * 3], P[v * 3 + 1], P[v * 3 + 2])); return R; },
    sw: [], ax: [], rp: [], tl: [],
    mesh() {
      const geo = g.build();
      geo.setAttribute('aRing', new Float32BufferAttribute(tags, 4));
      const mat = new ShaderMaterial({
        uniforms: {
          ...deck.rig.uniforms, uClip: G.uClip, uBend: { value: new Vector3(deck.frame.a0, deck.frame.z0, deck.frame.floorR) },
          uSw: { value: R.sw }, uAx: { value: R.ax }, uRp: { value: R.rp }, uTl: { value: R.tl }, uYA: { value: YA }, uSheen: { value: new Vector3(0.75, 0.5, 0.26) },
        },
        vertexShader: RING_VERT, fragmentShader: ringFrag(deck.rig), side: DoubleSide,
      });
      const m = new Mesh(geo, mat);
      fitBounds(m, deck.frame);
      geo.boundingSphere.radius += 4;
      return m;
    },
  };
  for (const B of BELLS) {
    R.sw.push(new Vector4(0, 0, 0, 0)); R.ax.push(new Vector4(B.cz, YA - 0.17 * B.D, 0, 0));
    R.rp.push(new Vector4(B.rx, B.rz, 0.3 * B.ca, 0.3 * B.sa)); R.tl.push(new Vector4(B.tail, 1.42, 0, YCATCH - SALLY / 2));
  }
  return R;
}

// A surface turned about the upright line through (x, z) from a profile of [radius, height], shaded round. With
// inside it is the bore of the same shape, seen from within. colour and shine may be given for each step.
function turned(g, x, y, z, prof, n, color, o = {}) {
  const m = prof.length, s = o.inside ? -1 : 1, nr = [], nh = [];
  for (let k = 0; k < m; k++) {
    const a = prof[Math.max(0, k - 1)], b = prof[Math.min(m - 1, k + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    nr.push(s * (b[1] - a[1]) / l); nh.push(-s * (b[0] - a[0]) / l);
  }
  for (let j = 0; j < n; j++) {
    const a0 = (j / n) * TAU, a1 = ((j + 1) / n) * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    for (let k = 0; k < m - 1; k++) {
      const [r0, h0] = prof[k], [r1, h1] = prof[k + 1], col = typeof color === 'function' ? color(k, j) : color, e = typeof o.emit === 'function' ? o.emit(k) : o.emit || 0;
      const A = [x + c0 * r0, y + h0, z + s0 * r0], B = [x + c0 * r1, y + h1, z + s0 * r1], C = [x + c1 * r1, y + h1, z + s1 * r1], D = [x + c1 * r0, y + h0, z + s1 * r0];
      const nA = [c0 * nr[k], nh[k], s0 * nr[k]], nB = [c0 * nr[k + 1], nh[k + 1], s0 * nr[k + 1]], nC = [c1 * nr[k + 1], nh[k + 1], s1 * nr[k + 1]], nD = [c1 * nr[k], nh[k], s1 * nr[k]];
      if (s > 0) { if (r1 > 1e-6) g.tri(A, B, C, col, e, nA, nB, nC); if (r0 > 1e-6) g.tri(A, C, D, col, e, nA, nC, nD); }
      else { if (r1 > 1e-6) g.tri(A, C, B, col, e, nA, nC, nB); if (r0 > 1e-6) g.tri(A, D, C, col, e, nA, nD, nC); }
    }
  }
}
// a square timber from one point to another in an upright plane along the axis (x fixed): tx wide, d deep
function beamYZ(g, x, a, b, tx, d, color, emit = 0) {
  const dy = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dy, dz) || 1, ny = -dz / l * d / 2, nz = dy / l * d / 2, x0 = x - tx / 2, x1 = x + tx / 2;
  const P = (q, sx, sn) => [sx, q[0] + sn * ny, q[1] + sn * nz];
  g.quad(P(a, x0, 1), P(a, x1, 1), P(b, x1, 1), P(b, x0, 1), color, emit); g.quad(P(a, x1, -1), P(a, x0, -1), P(b, x0, -1), P(b, x1, -1), color, emit);
  g.quad(P(a, x0, 1), P(b, x0, 1), P(b, x0, -1), P(a, x0, -1), color, emit); g.quad(P(a, x1, -1), P(b, x1, -1), P(b, x1, 1), P(a, x1, 1), color, emit);
}

// ---------------------------------------------------------------- bells
// Bell bronze (the drum's dawn palette, 15-canon.js): the bells are the brightest warm thing in the place
const BRONZE = '#b17a3a', BRONZE_HI = '#d39c55', BRONZE_LO = '#7c5126', BORE = '#5e3e1e', IRON = '#3a342f', OAK = '#4a3626', OAK2 = '#5e4630', ASH = '#927548', HEMP = '#d6c39a';
const SALLY_COLS = ['#c8382c', '#f4ecd8', '#2f52a8'];
// an English bell's outside and its bore, as [radius, height above the lip] in mouths
const BELL_OUT = [[0.5, 0], [0.497, 0.022], [0.478, 0.06], [0.44, 0.105], [0.392, 0.17], [0.386, 0.182], [0.34, 0.29], [0.3, 0.44], [0.277, 0.58], [0.262, 0.68], [0.258, 0.692], [0.24, 0.742], [0.185, 0.782], [0.07, 0.8], [0, 0.8]];
const BELL_IN = [[0.487, 0], [0.452, 0.03], [0.405, 0.085], [0.362, 0.165], [0.31, 0.29], [0.272, 0.44], [0.252, 0.58], [0.236, 0.67], [0.2, 0.728], [0.12, 0.76], [0, 0.768]];
const LIPDROP = 0.92;                          // the lip hangs this many mouths below the axle

// One bell where it hangs, mouth down: the bell and its bore, the headstock it is bolted to, its wheel on one side
// and its stay on the other (all of which turn together), and the clapper on its pin.
function* drawBell(R, B) {
  const { D, cx, cz, i } = B, yl = YA - LIPDROP * D, sides = D > 1.1 ? 40 : D > 0.8 ? 32 : 26, sc = (p) => p.map(([r, h]) => [r * D, h * D]);
  // the bell: moulding wires in a darker bronze, the sound bow and the shoulder a little brighter where hands and years have rubbed
  const outCol = (k) => (k === 4 || k === 9 ? BRONZE_LO : k <= 2 ? BRONZE_HI : k >= 11 ? shade(BRONZE, 1.08) : BRONZE);
  R.part(1, i, 1, 1, (g) => {
    turned(g, cx, yl, cz, sc(BELL_OUT), sides, outCol, { emit: 0.1 });
  });
  yield 'peal: bell';
  R.part(1, i, 1, 1, (g) => {
    turned(g, cx, yl, cz, sc(BELL_IN), sides, (k) => (k === 1 ? shade(BRONZE_HI, 0.95) : BORE), { inside: true, emit: (k) => (k === 1 ? 0.12 : 0.03) });
    for (let j = 0; j < sides; j++) {                       // the lip
      const a0 = (j / sides) * TAU, a1 = ((j + 1) / sides) * TAU, ro = 0.5 * D, ri = 0.487 * D;
      g.quad([cx + Math.cos(a0) * ri, yl, cz + Math.sin(a0) * ri], [cx + Math.cos(a0) * ro, yl, cz + Math.sin(a0) * ro], [cx + Math.cos(a1) * ro, yl, cz + Math.sin(a1) * ro], [cx + Math.cos(a1) * ri, yl, cz + Math.sin(a1) * ri], BRONZE_HI, 0.1);
    }
  });
  yield 'peal: bell';
  // the headstock across the pit, strapped to the bell's crown with iron; gudgeons at its ends
  const hw = pitW(B) / 2 + 0.04, hy0 = YA - 0.11 * D, hy1 = YA + 0.13 * D, hz = 0.13 * D;
  R.part(1, i, 0, 0, (g) => {
    g.box(cx - hw, hy0, cz - hz, cx + hw, hy1, cz + hz, OAK2, { top: shade(OAK2, 1.15) });
    for (const sx of [-1, 1]) {
      g.box(cx + sx * 0.2 * D - 0.02 * D, YA - 0.19 * D, cz - hz - 0.012, cx + sx * 0.2 * D + 0.02 * D, hy1 + 0.012, cz + hz + 0.012, IRON);
      g.cyl(cx + sx * 0.2 * D, hy1 + 0.012, cz, 0.03 * D, 0.03 * D, 0.03 * D, 6, IRON, { smooth: false });
    }
    // the stay: up from the headstock when the bell is down, down onto its slider when the bell is set
    const xs = cx - B.sw * (D / 2 + 0.17);
    g.box(xs - 0.035, hy1 - 0.02, cz - 0.035, xs + 0.035, YA + 1.02, cz + 0.035, ASH, { skip: 'b' });
  });
  // the wheel: a rim with the rope's groove in it, spokes, and the two long timbers either side of the headstock
  R.part(1, i, 0, 0, (g) => {
    const x = B.xw, r = B.rw, n = 40, t = 0.05, rin = r - 0.075;
    for (let j = 0; j < n; j++) {
      const a0 = (j / n) * TAU, a1 = ((j + 1) / n) * TAU, y0 = Math.cos(a0), z0 = Math.sin(a0), y1 = Math.cos(a1), z1 = Math.sin(a1);
      const Q = (rr, yy, zz, xx) => [xx, YA + yy * rr, cz + zz * rr];
      g.quad(Q(r, y0, z0, x - t), Q(r, y0, z0, x + t), Q(r, y1, z1, x + t), Q(r, y1, z1, x - t), j % 8 === 3 ? shade(HEMP, 0.8) : HEMP);                 // the sole, where the rope lies
      g.quad(Q(rin, y0, z0, x + t), Q(rin, y0, z0, x - t), Q(rin, y1, z1, x - t), Q(rin, y1, z1, x + t), OAK2);
      for (const sx of [-1, 1]) g.quad(Q(rin, y0, z0, x + sx * t), Q(r + 0.03, y0, z0, x + sx * t), Q(r + 0.03, y1, z1, x + sx * t), Q(rin, y1, z1, x + sx * t), j % 8 === 5 ? shade(ASH, 0.86) : ASH);
    }
    for (let k = 0; k < 8; k++) {
      const a = (k + 0.5) / 8 * TAU + 0.2, c = Math.cos(a), s = Math.sin(a);
      beamYZ(g, x, [YA + c * 0.12, cz + s * 0.12], [YA + c * rin, cz + s * rin], 0.05, k % 4 === 0 ? 0.09 : 0.06, k === 2 ? shade(ASH, 1.12) : ASH);        // one spoke was replaced
    }
    for (const sz of [-1, 1]) beamYZ(g, x, [YA - Math.sqrt(rin * rin - hz * hz * 2.6), cz + sz * hz * 1.6], [YA + Math.sqrt(rin * rin - hz * hz * 2.6), cz + sz * hz * 1.6], 0.06, 0.08, OAK2);
  });
  yield 'peal: wheel';
  // the clapper, hanging: a shaft from the pin under the crown, the ball that strikes the sound bow, the flight below it
  const yp = YA - 0.17 * D, lb = 0.76 * D;
  R.part(2, i, 0.4, 0.35, (g) => {
    g.cyl(cx, yp - lb + 0.04 * D, cz, 0.02 * D, 0.013 * D, lb - 0.04 * D, 6, IRON, { cap: false });
    g.at(cx, yp - lb, cz, 0, [1, -1, 1]).blob(0, 0, 0, 0.055 * D, 1, '#5a5048', { shadeBottom: 0.75 }).pop();
    g.cyl(cx, yp - lb - 0.115 * D, cz, 0.016 * D, 0.026 * D, 0.07 * D, 6, IRON, { base: true, cap: false });
    g.cyl(cx, yp - 0.01 * D, cz, 0.03 * D, 0.03 * D, 0.03 * D, 6, IRON, { smooth: false });
  });
}

// One rope: down from the wheel's side to a pulley on the frame, across to its place in the guide ring, and from
// there straight down the well. The long fall stretches and shortens as the sally goes (which is all a rope sliding
// through a ring looks like), and bows spinward as it rises. The sally is striped wool; below it the tail goes to
// the ringer's hand.
const YPUL = YGIRD + 0.62;
function drawRope(R, B) {
  const { i, rx, rz } = B, rr = 0.013, top = YCATCH + SALLY / 2, span = YSPIDER - top;
  R.part(0, i, 0, 0, (g) => {
    g.tube([[B.xw, YA, B.zt], [B.xw, YPUL + 0.06, B.zt]], rr, 4, HEMP);
    g.tube([[B.xw, YPUL - 0.06, B.zt], [rx, YSPIDER + 0.05, rz]], rr, 4, HEMP);
    // the pulley and its block
    g.box(B.xw - 0.07, YPUL - 0.12, B.zt - 0.1, B.xw + 0.07, YPUL + 0.12, B.zt + 0.1, OAK2);
  });
  const pts = [];
  for (let k = 0; k <= 12; k++) pts.push([rx, YSPIDER - (k / 12) * span, rz]);
  const frac = (x, y) => clamp((YSPIDER - y) / span, 0, 1);
  R.each(3, i, frac, (x, y) => { const f = frac(x, y); return Math.sin(Math.PI * f) + 0.7 * f; }, (g) => g.tube(pts, rr, 4, HEMP));
  R.part(3, i, 1, 0.7, (g) => {
    const y0 = YCATCH - SALLY / 2, nb = 9, h = SALLY / nb, rs = 0.046;
    for (let k = 0; k < nb; k++) {
      const ra = k === 0 ? rr * 1.6 : rs, rb = k === nb - 1 ? rr * 1.6 : rs;
      g.cyl(rx, y0 + k * h, rz, ra, rb, h, 8, SALLY_COLS[k % 3], { cap: false, emit: 0.3, phase: k * 0.5 });
    }
  });
  const tp = [];
  for (let k = 0; k <= 14; k++) tp.push([rx, YCATCH - SALLY / 2 - (k / 14) * B.tail, rz]);
  const y1 = YCATCH - SALLY / 2;
  R.each(4, i, (x, y) => clamp((y1 - y) / B.tail, 0, 1), () => 0, (g) => g.tube(tp, rr, 4, HEMP));
}

// The frame, which does not move: girders across the well, a sill and a pair of raking timbers either side of
// every pit with the bearing on top, the sliders the stays come down on, and the guide ring hung under it all.
function* drawFrame(deck) {
  const P = deck.pen(new Run(0, 0, 0, 0), 0, 'frame'), g = P.g, yg = YGIRD, ys = YGIRD + 0.4, GIRD = '#5a4332';
  for (const z of [ZOUT0, -ZG, ZG, ZOUT1]) {
    g.box(-W - 0.3, yg, z - 0.17, W + 0.3, ys, z + 0.17, GIRD, { top: shade(GIRD, 1.3) });
    for (const x of [-W + 0.5, W - 0.5]) g.box(x - 0.3, yg - 0.5, z - 0.22, x + 0.3, yg, z + 0.22, shade(GIRD, 0.9));        // corbels at the walls
  }
  // the columns' long timbers, between the two inner girders
  const colX = [XCOL, XCOL + Math.max(pitW(BELLS[2]), pitW(BELLS[3])), -XCOL, -XCOL - Math.max(pitW(BELLS[8]), pitW(BELLS[9]))];
  for (const x of colX) g.box(x - 0.09, yg + 0.05, -ZG, x + 0.09, ys + 0.14, ZG, OAK, { top: shade(OAK, 1.3) });
  yield 'peal: girders';
  // a frame side: a sill between two girders (rows), and two rakers up to the bearing
  const seen = new Set();
  for (const B of BELLS) {
    const z0 = B.row ? (B.cz < 0 ? ZOUT0 : ZG) : -ZG, z1 = B.row ? (B.cz < 0 ? -ZG : ZOUT1) : ZG, sp = pitH(B) - 0.22;
    for (const sx of [-1, 1]) {
      const x = B.cx + sx * pitW(B) / 2, key = Math.round(x * 100) + '_' + Math.round(B.cz * 100);
      if (B.row && !seen.has('s' + Math.round(x * 100) + (B.cz < 0))) { seen.add('s' + Math.round(x * 100) + (B.cz < 0)); g.box(x - 0.09, yg + 0.05, z0, x + 0.09, ys + 0.14, z1, OAK, { top: shade(OAK, 1.3) }); }
      if (seen.has(key)) continue;
      seen.add(key);
      for (const sz of [-1, 1]) beamYZ(g, x, [ys + 0.12, B.cz + sz * sp], [YA - 0.14, B.cz + sz * 0.1], 0.16, 0.15, sz > 0 ? OAK : shade(OAK, 1.12));
      g.box(x - 0.11, YA - 0.2, B.cz - 0.2, x + 0.11, YA - 0.03, B.cz + 0.2, OAK2);                                          // the bearing's block
      g.box(x - 0.07, YA - 0.03, B.cz - 0.09, x + 0.07, YA + 0.05, B.cz + 0.09, IRON);
    }
    // the slider under the stay
    const xs = B.cx - B.sw * (B.D / 2 + 0.17);
    g.box(xs - 0.12, YA - 1.12, B.cz - 0.32, xs + 0.12, YA - 1.06, B.cz + 0.32, ASH);
    beamYZ(g, xs, [ys + 0.1, B.cz], [YA - 1.1, B.cz], 0.1, 0.1, OAK);
  }
  yield 'peal: frame';
  // the guide ring: a hoop on four rods from the girders, a boss for every rope
  const ring = [];
  for (let k = 0; k <= 48; k++) { const a = (k / 48) * TAU; ring.push([RC * Math.cos(a), YSPIDER, RC * Math.sin(a)]); }
  g.tube(ring, 0.035, 5, IRON);
  const xr = Math.sqrt(RC * RC - ZG * ZG);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.cyl(sx * xr, YSPIDER, sz * ZG, 0.018, 0.018, yg - YSPIDER, 4, IRON, { cap: false });
  for (const B of BELLS) {
    g.cyl(B.rx, YSPIDER - 0.07, B.rz, 0.07, 0.07, 0.14, 8, BRONZE_LO, { smooth: false });
    const a = (300 + 30 * B.i) * DEG, x = RC * Math.cos(a), z = RC * Math.sin(a);
    g.cyl(x, YSPIDER + 0.03, z, 0.05, 0.08, 0.09, 6, '#ffe2b4', { emit: 3.2, smooth: false });
    deck.glow([{ p: [x, YSPIDER + 0.1, z], color: LAMP, power: 1.5, size: 0.4 }]);
  }
  P.done();
  yield 'peal: guide ring';
}

// ---------------------------------------------------------------- the well
// Umber stone and old timber. Each side is drawn in a run of its own: u along the side, v outward from the well's
// edge, and what is drawn at v = 0 faces the well. A side takes the corner at its far end, so the four make a ring.
const STONE = ['#8a6e52', '#80654a', '#927659', '#86694c'], PIER = '#9c7f60', BAND = '#a58869', GFLOOR = '#6a5645', GCEIL = '#5c4838';
const PLASTER = ['#b59c7a', '#a98f6e', '#bda583', '#b0966f'], DOORS = ['#5a3a26', '#6b4a2a', '#4a3a30', '#7a5a34', '#3f3a34', '#6a4030'];
const LAMP = '#ffcf8a', WINDOWS = ['#ffc47a', '#ffd596', '#f6b868', '#ffdcae'];
const sideRun = (s, y) => (s === 0 ? new Run(0, y, W, 0) : s === 1 ? new Run(W, y, 0, 1) : s === 2 ? new Run(0, y, -W, 2) : new Run(-W, y, 0, 3));
const wallV = (g, u0, u1, y0, y1, v, col, e = 0) => g.quad([u1, y0, v], [u0, y0, v], [u0, y1, v], [u1, y1, v], col, e);      // faces the well
const wallB = (g, u0, u1, y0, y1, v, col, e = 0) => g.quad([u0, y0, v], [u1, y0, v], [u1, y1, v], [u0, y1, v], col, e);      // faces away from it
const wallU = (g, u, v0, v1, y0, y1, col, e = 0) => g.quad([u, y0, v0], [u, y0, v1], [u, y1, v1], [u, y1, v0], col, e);      // faces back along the side
// the head of an arch between ua and ub, from its springing to its crown, filled up to `top`, v0 to v1 thick
function archHead(g, ua, ub, spring, crown, top, v0, v1, col, n = 6) {
  const pt = (m) => { const t = m / n; return [ua + (ub - ua) * t, spring + (crown - spring) * Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2))]; };
  for (let m = 0; m < n; m++) {
    const [x0, y0] = pt(m), [x1, y1] = pt(m + 1);
    g.quad([x1, y1, v0], [x0, y0, v0], [x0, top, v0], [x1, top, v0], shade(col, 0.96 + 0.04 * (m % 2)));
    g.quad([x0, y0, v1], [x1, y1, v1], [x1, top, v1], [x0, top, v1], shade(col, 0.9));
    g.quad([x0, y0, v0], [x1, y1, v0], [x1, y1, v1], [x0, y0, v1], shade(col, 0.82));
  }
}
const bayOf = (j) => { const ua = -W + j * BAY + 0.22; return [ua, ua + BAY - 0.44, ua + BAY / 2 - 0.22]; };      // an arch's two jambs and its middle

function* drawWell(deck, rng) {
  let t0 = performance.now();
  for (let k = 0; k < LEVELS; k++) for (let s = 0; s < 4; s++) {
    const run = sideRun(s, k * RISE), P = deck.pen(run, 0, 'well' + k), g = P.g, stone = STONE[(k + s) % 4], front0 = k === 0 && s === 2;      // a mesh to a deck: no one of them is long in the making
    // the slab's edge toward the well, with a line of bronze let into it and the deck's number on a plate
    if (k > 0) {
      g.box(-W - 0.07, -1, -0.07, W + 0.07, 0.14, 0.1, BAND, { top: shade(BAND, 1.1) });
      g.box(-W, -0.6, -0.085, W, -0.54, -0.07, BRONZE_LO, { skip: 's', emit: 0.1 });
      if (k === 1 && s === 0) {
        // the drum's motto on a cloth hung over the edge of the first gallery, facing the way in
        P.c.quad([2.5, -1.12, -0.1], [-2.5, -1.12, -0.1], [-2.5, 0.2, -0.1], [2.5, 0.2, -0.1], '#e4d6b6');
        for (const y of [-1.12, 0.12]) P.c.quad([2.5, y, -0.105], [-2.5, y, -0.105], [-2.5, y + 0.08, -0.105], [2.5, y + 0.08, -0.105], BRONZE_LO);
        deck.sign('Sing it back.', { run, at: run.pt(0, -0.46, -0.112), w: 4.4, h: 0.92, style: 'card', font: 'italic', ground: '#e4d6b6', ink: '#4a3020' });
      } else deck.sign('Peal Court ' + (DECK0 + k), { run, at: run.pt(0, -0.27, -0.078), h: 0.36, style: 'plate', font: 'cond', ground: '#33261b', ink: '#e0ac6c', track: 0.14 });
    }
    // piers with their imposts, and the heads of the five arches
    for (let j = 0; j <= NBAY; j++) {
      const u = -W + j * BAY, grand = front0 && (j === 2 || j === 3);
      g.box(u - 0.22, 0, 0, u + 0.22, 3, 0.5, j % 2 ? PIER : shade(PIER, 0.95), { skip: 'tb' });
      g.box(u - 0.27, grand ? 1.54 : 2.3, -0.04, u + 0.27, grand ? 1.66 : 2.42, 0.54, shade(PIER, 1.14));
      if (k === 0) g.box(u - 0.27, 0, -0.04, u + 0.27, 0.22, 0.54, shade(PIER, 0.85), { skip: 'b' });
      if (j < NBAY && !grand) {
        // a small lamp on a bronze bracket, toward the well
        g.box(u - 0.035, 1.9, -0.11, u + 0.035, 1.96, 0, BRONZE_LO, { skip: 's' });
        g.box(u - 0.055, 1.96, -0.15, u + 0.055, 2.12, -0.04, '#ffe0b0', { emit: 2.6 });
        deck.glow([{ p: run.pt(u, 2.04, -0.17), color: LAMP, power: 0.75, size: 0.38 }]);
      }
    }
    for (let j = 0; j < NBAY; j++) {
      const [ua, ub] = bayOf(j);
      if (front0 && j === 2) archHead(g, ua, ub, 1.66, 2.84, 3, 0, 0.5, PIER, 12); else archHead(g, ua, ub, 2.42, 2.84, 3, 0, 0.5, stone);
    }
    if (k === LEVELS - 1) g.box(-W - 0.07, 3, -0.07, W + 0.07, 4, 0.1, BAND);
    if (k === LOUVRED) {
      // the deck beside the bells: sound louvres, with the lamps of the streets behind showing between the boards
      for (let j = 0; j < NBAY; j++) {
        const [ua, ub] = bayOf(j);
        wallV(g, ua, ub, 0.14, 2.84, 0.47, '#7a4a24', 0.14);
        for (let i = 0; i < 8; i++) { const y = 0.2 + i * 0.335; g.quad([ub, y, 0.06], [ua, y, 0.06], [ua, y + 0.21, 0.4], [ub, y + 0.21, 0.4], i % 3 ? OAK : shade(OAK, 1.2)); g.quad([ua, y - 0.035, 0.06], [ub, y - 0.035, 0.06], [ub, y + 0.175, 0.4], [ua, y + 0.175, 0.4], shade(OAK, 0.8)); }
      }
      P.done();
      continue;
    }
    // the walk: floor, ceiling, the wall behind with its doors and lit windows (the flats of a court have windows)
    if (k === 0) P.f.tint(0.5).floor(-W, 0, W + GD, GD, 0, '#7a6452', { emit: 0.7 }).tint(0); else g.floor(-W, 0.1, W + GD, GD, 0, GFLOOR);
    g.floor(-W, 0, W + GD, GD, 3, GCEIL, { down: true, emit: 0.22 });
    const plaster = PLASTER[(k * 3 + s) % 4];
    if (front0) { wallV(g, -W, -3, 0, 3, GD, plaster); wallV(g, 3, W + GD, 0, 3, GD, plaster); } else wallV(g, -W, W + GD, 0, 3, GD, plaster);
    wallU(g, W + GD, 0, GD, 0, 3, shade(plaster, 0.92));
    g.box(-W, 0, GD - 0.03, W + GD, 0.9, GD, shade(stone, 0.8), { skip: 'bs' });
    for (let j = 0; j < NBAY; j++) {
      const uc = bayOf(j)[2] + rng.f(-0.3, 0.3);
      if (front0 && Math.abs(uc) < 4.2) continue;
      if (rng() < 0.52) {
        const dc = rng.pick(DOORS);
        g.box(uc - 0.55, 0, GD - 0.07, uc + 0.55, 2.16, GD, shade(OAK, 1.1), { skip: 'bs' });
        g.box(uc - 0.45, 0.02, GD - 0.1, uc + 0.45, 2.06, GD - 0.06, dc, { skip: 'bs' });
        g.box(uc - 0.33, 1.2, GD - 0.115, uc + 0.33, 1.9, GD - 0.1, shade(dc, 1.2), { skip: 's' });
        g.box(uc + 0.72, 1.78, GD - 0.13, uc + 0.82, 1.92, GD - 0.03, '#ffe6bc', { emit: 3 });
        deck.glow([{ p: run.pt(uc + 0.77, 1.85, GD - 0.16), color: LAMP, power: 1.0, size: 0.42 }]);
      } else {
        const on = rng() < 0.75, wc = on ? rng.pick(WINDOWS) : '#4a3a30';
        g.box(uc - 0.72, 0.94, GD - 0.06, uc + 0.72, 2.2, GD, shade(OAK, 1.1), { skip: 'bs' });
        wallV(g, uc - 0.64, uc + 0.64, 1.02, 2.12, GD - 0.065, wc, on ? rng.f(0.7, 1.3) : 0.1);
        g.box(uc - 0.025, 1.02, GD - 0.08, uc + 0.025, 2.12, GD - 0.066, OAK, { skip: 'tbs' });
      }
    }
    // the rail: bronze on turned posts
    if (k > 0) for (let j = 0; j < NBAY; j++) {
      const [ua, ub] = bayOf(j);
      g.box(ua, 1.0, 0.1, ub, 1.07, 0.22, BRONZE_LO, { top: BRONZE, emit: 0.05 });
      g.box(ua, 0.2, 0.13, ub, 0.26, 0.19, OAK2);
      for (let b = 0; b < 9; b++) { const u = ua + (b + 0.5) * (ub - ua) / 9; g.box(u - 0.022, 0.26, 0.138, u + 0.022, 1.0, 0.182, OAK2, { skip: 'tb' }); }
    }
    P.done();
    if (performance.now() - t0 > 4) { yield 'peal: galleries'; t0 = performance.now(); }
  }
  yield 'peal: galleries';
  // the floor of the well: big slabs, a ring of bronze under the ropes, a round of paler stone in the middle
  const P = deck.pen(new Run(0, 0, 0, 0), 0, 'well'), g = P.g;
  P.f.tint(0.5).floor(-W, -W, W, W, 0, '#75604e', { emit: 0.85 }).tint(0);
  const disc = (r0, r1, y, col, e = 0, n = 48) => { for (let j = 0; j < n; j++) { const a0 = (j / n) * TAU, a1 = ((j + 1) / n) * TAU; g.quad([Math.cos(a0) * r0, y, Math.sin(a0) * r0], [Math.cos(a1) * r0, y, Math.sin(a1) * r0], [Math.cos(a1) * r1, y, Math.sin(a1) * r1], [Math.cos(a0) * r1, y, Math.sin(a0) * r1], col, e); } };
  disc(RC - 0.05, RC + 0.05, 0.012, BRONZE, 0.25);
  disc(0.02, 1.7, 0.008, '#9a8468'); disc(1.7, 1.78, 0.012, BRONZE_LO, 0.15);
  // a direction rose in the middle, as lobbies have: the wheels overhead all stand along its line from front to back
  rose(deck, { at: [0, 0], y: 0.004, r: 1.05, colors: ['#6e5a48', BRONZE_LO], ground: '#7d6a54', ink: '#f0dcb4' });
  disc(RC + 1.3, RC + 1.38, 0.01, shade('#75604e', 0.7));
  // the ceiling over it all, coffered in dark timber, and sixteen lamps hung from it
  g.floor(-W, -W, W, W, TOP, '#2c2119', { down: true, emit: 0.12 });
  for (let i = 0; i <= 4; i++) { const c = -W + i * 3.5; g.box(c - 0.14, TOP - 0.36, -W, c + 0.14, TOP, W, OAK, { skip: 't' }); g.box(-W, TOP - 0.3, c - 0.12, W, TOP, c + 0.12, shade(OAK, 0.9), { skip: 't' }); }
  for (const x of [-5.4, -1.8, 1.8, 5.4]) for (const z of [-5.4, -1.8, 1.8, 5.4]) {
    g.cyl(x, TOP - 0.78, z, 0.012, 0.012, 0.78, 4, IRON, { cap: false });
    g.cyl(x, TOP - 0.86, z, 0.2, 0.06, 0.1, 8, BRONZE_LO, { smooth: false });
    g.at(x, TOP - 1.0, z, 0, [1, -1, 1]).blob(0, 0, 0, [0.17, 0.15, 0.17], 1, '#ffe1b0', { emit: 3.4, shadeBottom: 1 }).pop();
    deck.glow([{ p: [x, TOP - 1.0, z], color: LAMP, power: 3.0, size: 0.85 }]);
  }
  P.done();
  yield 'peal: floor and ceiling';
}

// ---------------------------------------------------------------- the people
// Nobody here wears a strong colour: the sallies are to be the only one.
const MUTED = ['#e6d8ba', '#d6c29c', '#b88c52', '#8a6a48', '#6e4f34', '#a8926e', '#c9b08a', '#7d6248', '#94886f', '#5c4a3a', '#cfb68c', '#9a7a54', '#b9a384', '#74604a'];
const ROBES = ['#eadfc6', '#e2d4b6', '#6e4f34', '#7a5a3c', '#efe6d0', '#63482f'];
const facing = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
const KIDS = 3;                    // the gallery the children's choir stands on (deck 232)

// The ringers at their ropes, a mat under each (the treble's ringer is a child on a box, and two more stand on
// boards); the slate with the calls; and inside the rope circle the parents with the baby, its table of four aunts
// standing up for it, and two of the dead's family with the gift.
function standFloor(deck, rng, dens) {
  const P = deck.pen(new Run(0, 0, 0, 0), 0, 'well'), g = P.g, spots = [];
  for (const B of BELLS) {
    const x = B.rx + 0.56 * B.ca, z = B.rz + 0.56 * B.sa, yaw = facing(x, z, 0, 0), box = B.i === 0 ? 0.44 : B.i === 2 || B.i === 5 ? 0.16 : 0;
    g.at(x, 0, z, yaw);
    g.box(-0.42, 0, -0.34, 0.42, 0.02, 0.5, B.i % 2 ? '#6a3f2e' : '#5c4636', { skip: 'b' });
    if (box) g.box(-0.3, 0.02, -0.24, 0.3, box, 0.24, B.i === 0 ? '#8a6a44' : OAK2, { skip: 'b' });
    g.pop();
    spots.push({ p: [x, box, z], yaw, child: B.i === 0, color: MUTED[(B.i * 5 + 2) % MUTED.length] });
  }
  // the slate, on an easel beside the treble where the whole ring can read it
  {
    const a = 302 * DEG, x = 4.25 * Math.cos(a), z = 4.25 * Math.sin(a), nx = -Math.cos(a), nz = -Math.sin(a);
    g.at(x, 0, z, Math.atan2(-nx, -nz));
    g.box(-0.36, 0.72, -0.02, 0.36, 1.78, 0.02, '#2c3330');
    g.box(-0.4, 0.68, -0.035, 0.4, 0.74, 0.03, OAK2);
    for (const sx of [-1, 1]) { g.tube([[sx * 0.34, 0, -0.16], [sx * 0.3, 1.8, 0.02]], 0.02, 4, ASH); }
    g.tube([[0, 0, 0.5], [0, 1.7, 0.03]], 0.02, 4, ASH);
    g.pop();
    deck.sign(['Rounds', '2 to 3', '4 to 5', '3 to 2', '5 to 4', 'Stand'], { at: [x + nx * 0.026, 1.26, z + nz * 0.026], n: [nx, nz], w: 0.64, h: 0.98, style: 'chalk', head: false });
  }
  // the family: the baby in a cream shawl at its mother's shoulder
  spots.push({ p: [-0.3, 0, 0.55], yaw: Math.PI, color: '#b88c52' }, { p: [0.34, 0, 0.62], yaw: Math.PI + 0.25, color: '#7d6248' });
  g.at(-0.3, 1.2, 0.33, 0, [1, -1, 1]).blob(0, 0, 0, [0.15, 0.11, 0.1], 1, '#f3ead6', { emit: 0.25, shadeBottom: 1 }).blob(0.1, -0.07, -0.01, 0.062, 0, '#e8b894', { shadeBottom: 1 }).pop();
  for (const [a, col] of [[-78, '#e6d8ba'], [-28, '#8a6a48'], [24, '#c9b08a'], [74, '#6e4f34']]) {
    const x = Math.sin(a * DEG) * 1.12, z = 0.75 + Math.cos(a * DEG) * 1.0;
    spots.push({ p: [x, 0, z], yaw: facing(x, z, 0, 0.45), color: col });
  }
  // the gift is "usually a remade heirloom" (open-drums.md): here a hand bell, held out
  spots.push({ p: [-1.18, 0, -0.5], yaw: facing(-1.18, -0.5, -0.2, 0.5), color: '#d6c29c' }, { p: [-1.62, 0, -0.08], yaw: facing(-1.62, -0.08, -0.2, 0.5), color: '#5c4a3a' });
  turned(g, -0.98, 1.06, -0.3, BELL_OUT.map(([r, h]) => [r * 0.17, h * 0.17]), 10, BRONZE_HI, { emit: 0.35 });
  g.cyl(-0.98, 1.06 + 0.136, -0.3, 0.012, 0.016, 0.1, 5, OAK2);
  // people come to watch: round the foot of the well outside the ring (leaving the way in from the arch), and in the walk behind the piers
  for (let i = 0, n = Math.round(150 * dens); i < n; i++) {
    const inAisle = i % 3 === 0, x = rng.f(-1, 1) * (inAisle ? W + GD - 0.5 : W - 0.5), z = rng.f(-1, 1) * (inAisle ? W + GD - 0.5 : W - 0.5), r = Math.hypot(x, z), m = Math.max(Math.abs(x), Math.abs(z));
    if (inAisle ? (m < W + 0.75 || (z < -W && Math.abs(x) < 3.4)) : (r < RC + 1.55 || m > W - 0.4 || (z < -3 && Math.abs(x) < 1.7))) continue;
    if (!deck.clear(x, 1.6, z, 1.5)) continue;
    spots.push({ p: [x, 0, z], yaw: facing(x, z, 0, 0) + rng.f(-0.25, 0.25), child: rng() < 0.14, color: rng.pick(MUTED) });
  }
  P.done();
  deck.people(spots);
  // four lamps on posts at the corners of the floor: low and gold
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    deck.put('lampPost', { p: [sx * 5.9, 0, sz * 5.9], scale: 1.25 });
    deck.glow([{ p: [sx * 5.9, 2.92, sz * 5.9], color: LAMP, power: 2.6, size: 0.8 }]);
  }
}

// The block's choir, on every gallery but the louvred one: a rank at the rail and some behind, each with a sheet
// and a small lamp clipped to it. Deck 232 is the children's, stood on a bench so that they can see over the rail.
// The round is sung against itself in four parts, and a part is a side of a gallery: part (deck + side) mod 4, so
// the parts go round the well and up it. lamps[p] takes that part's lights.
function* standChoir(deck, rng, lamps, dens) {
  deck.proto('songsheet', (g) => {
    g.tint(1);
    g.quad([-0.13, -0.17, 0], [0.13, -0.17, 0], [0.13, 0.17, 0.07], [-0.13, 0.17, 0.07], '#ffffff', 0.22); g.quad([0.13, -0.17, 0], [-0.13, -0.17, 0], [-0.13, 0.17, 0.07], [0.13, 0.17, 0.07], '#ffffff', 0.3);
    g.tint(0).box(-0.025, 0.17, 0.05, 0.025, 0.215, 0.1, '#ffe6bc', { emit: 5 });
  });
  const spots = [];
  let t0 = performance.now();
  for (let k = 1; k < LEVELS; k++) {
    if (k === LOUVRED) continue;
    for (let s = 0; s < 4; s++) {
      const run = sideRun(s, k * RISE), d = run.dir(0, -1), yaw = Math.atan2(d[0], d[1]), part = (k + s) % 4, kids = k === KIDS;
      for (let j = 0; j < NBAY; j++) {
        const [ua, ub] = bayOf(j);
        if (kids) { const P = deck.pen(run, 0, 'well' + k); P.g.box(ua + 0.08, 0, 0.42, ub - 0.08, 0.36, 0.86, j % 2 ? OAK2 : shade(OAK2, 1.15), { skip: 'b' }); P.done(); }
        for (let rank = 0; rank < 2; rank++) for (let i = 0; i < 4; i++) {
          if (rng() > (rank ? 0.36 : 0.93) * Math.min(1, dens + 0.15)) continue;
          const u = ua + (i + 0.5 + (rank ? 0.5 : 0)) * (ub - ua) / 4 + rng.f(-0.08, 0.08), v = rank ? 1.42 + rng.f(-0.1, 0.1) : 0.62 + rng.f(-0.05, 0.05);
          if (u > ub - 0.15) continue;
          const onBench = kids && !rank, child = onBench || rng() < 0.1, p = run.pt(u, onBench ? 0.36 : 0, v), h = (child ? 0.7 : 1.1 + rng.f(-0.03, 0.03)) + (onBench ? 0.36 : 0), yw = yaw + rng.f(-0.2, 0.2);
          if (!deck.clear(p[0], p[1] + 1.6, p[2], 1.9)) continue;
          spots.push({ p, yaw: yw, child, color: shade(rng.pick(ROBES), rng.f(0.9, 1.06)) });
          if (rng() < 0.1) continue;
          const sp = run.pt(u, 0.1 + h, v - 0.27);
          deck.put('songsheet', { p: sp, yaw: yw, color: shade('#e2d3b0', rng.f(0.7, 0.95)) });
          lamps[part].push({ p: [sp[0] + d[0] * 0.07, sp[1] + 0.2, sp[2] + d[1] * 0.07], color: rng.pick(['#ffc878', '#ffd596', '#ffbe66', '#ffe0ae']), power: rng.f(0.9, 1.5), size: rng.f(0.14, 0.2), twinkle: 0.12, phase: rng() });
        }
        // a small child let sit at the rail with its legs through, and here and there a cloth put over the rail
        if (!kids && rng() < 0.3) { const p = run.pt(rng.f(ua + 0.3, ub - 0.3), 0, 0.4); if (deck.clear(p[0], p[1] + 1, p[2], 1.9)) spots.push({ p, sit: true, yaw: yaw + rng.f(-0.3, 0.3), color: rng.pick(MUTED) }); }
        if (rng() < 0.16) deck.put('sheet', { p: run.pt((ua + ub) / 2 + rng.f(-0.3, 0.3), 1.08, 0.16), yaw: run.yaw, scale: [rng.f(0.9, 1.3), rng.f(0.6, 0.95), 1], color: rng.pick(['#d9c8a4', '#8a5c2c', '#6e4f34', '#c9a36a', '#e6d8ba']) });
      }
      if (performance.now() - t0 > 4) { yield 'peal: choir'; t0 = performance.now(); }
    }
  }
  deck.people(spots);
  // latecomers finding their places, along the walks behind the singers
  for (let k = 1; k < LEVELS; k++) for (let s = 0; s < 4; s++) {
    if (k === LOUVRED || (k + s) % 2) continue;
    const run = sideRun(s, k * RISE), fwd = (k + s) % 4 === 0, a = run.pt(-W - 1.6, 0, 2.05), b = run.pt(W + 1.6, 0, 2.05);
    deck.walkersAlong({ from: fwd ? a : b, to: fwd ? b : a, n: 2, spread: 0.22, speed: 0.9, rng });
  }
  yield 'peal: choir';
}

// What stands at the foot of the well on the street's side: timber screens in the arches either side of the way in,
// with the peal board and the day's notice on them, and benches along the walk
function dressFoot(deck, rng) {
  const run = sideRun(2, 0), P = deck.pen(run, 0, 'well'), g = P.g;
  for (const j of [1, 3]) {
    const [ua, ub] = bayOf(j);
    g.box(ua, 0, 0.16, ub, 2.44, 0.3, OAK2, { skip: 'b' });
    for (let i = 0; i < 4; i++) { const u = ua + (i + 0.5) * (ub - ua) / 4; g.box(u - 0.03, 0.1, 0.13, u + 0.03, 2.44, 0.33, OAK, { skip: 'tb' }); }
    g.box(ua, 0.95, 0.12, ub, 1.05, 0.34, OAK);
    const left = j === 3, bu = left ? ua + 0.86 : ub - 0.86;      // the end nearer the way in, where the street sees it
    g.box(bu - 0.72, 1.12, 0.3, bu + 0.72, 2.3, 0.335, left ? '#d9cbac' : '#2a1f17', { skip: 'n' });
    if (left) deck.sign(['A naming today', 'Rounds, then four changes.', 'The round is Sing It Back.', 'Bring your lamp and your sheet.'], { at: run.pt(bu, 1.71, 0.34), n: [0, -1], w: 1.36, h: 1.1, style: 'paper' });
    else deck.sign(['Peal Court Ringers', 'Twelve bells, hung fore and aft.', '5,040 changes', 'in 4 hours 33 minutes.', 'In old air, 3 hours 46.'], { at: run.pt(bu, 1.71, 0.34), n: [0, -1], w: 1.36, h: 1.1, style: 'board', font: 'serif', ground: '#2a1f17', ink: '#e0ac6c' });
    deck.glow([{ p: run.pt(bu, 2.42, 0.5), color: LAMP, power: 1.3, size: 0.4 }]);
    g.box(bu - 0.3, 2.36, 0.34, bu + 0.3, 2.42, 0.46, '#ffe6bc', { emit: 2.4 });
  }
  // a keystone of bronze over the way in, both faces
  g.box(-0.16, 2.74, -0.05, 0.16, 3.0, 0.55, BRONZE, { emit: 0.25 });
  P.done();
  for (const [s, u] of [[0, -4.2], [0, 2.8], [1, 0], [3, -1.4], [3, 4.2]]) {
    const r = sideRun(s, 0), d = r.dir(0, -1), p = r.pt(u, 0, GD - 0.36);
    if (!deck.clear(p[0], 1.2, p[2], 1.6)) continue;
    deck.put('bench', { p, yaw: Math.atan2(-d[0], -d[1]), color: rng.pick(PEAL.doors) });
    if (rng() < 0.8) deck.people([{ p: [p[0] + d[0] * 0.05, 0.45, p[2] + d[1] * 0.05], sit: true, yaw: Math.atan2(d[0], d[1]), color: rng.pick(MUTED) }]);
  }
}

// ---------------------------------------------------------------- the world
// Carillon's paint: its dawn palette, "Bell bronze" (#1e1712, #6b4a2a, #e0ac6c, #fff4e2), on stone and old timber
const PEAL = {
  ...PALETTES.dim,
  walls: ['#a88c6a', '#9c8060', '#b09474', '#94785a', '#a3876a', '#b59a7a'],
  dado: ['#6b4a2a', '#5c4230', '#74563a', '#644a34'],
  trim: ['#33261b', '#3d2c1f', '#2a2019', '#4a3626'],
  doors: ['#6b4a2a', '#5a3a26', '#7a5a34', '#4a3a30', '#8a6a3c', '#3f3a34', '#6a4030', '#54452f'],
  awnings: [['#8a5c2c', '#e6d6b4'], ['#6b4a2a', '#d9c6a0'], ['#a8743a', '#efe2c4'], ['#5c4a3a', '#cdb890'], ['#7a5a34', '#e0d0aa']],
  signs: [['#2a1f17', '#e0ac6c'], ['#3d2c1f', '#f0dcb4'], ['#e6d6b4', '#3a2a1c'], ['#33261b', '#e9c877'], ['#4a3626', '#efe2c4'], ['#1e1712', '#e0ac6c']],
  floor: '#6e5c4c', strip: '#574839', court: '#75604e', ceiling: '#6a5644', rib: '#a08466',
  rooms: ['#c9a36a', '#b9925a', '#d0b080', '#a8885c', '#c4a878', '#b79a68', '#d6b47a'],
  metal: '#5a5248', brass: '#b08d4a', glass: '#b9c8c0',
  tub: ['#8a5c3c', '#9a8a70', '#6e5a48', '#94694a'],
  lamp: LAMP, window: WINDOWS, shop: '#ffd29a', goods: 0.25,
};

// The flight, and the opening at its end: a disc across the tenor's mouth as the tenor stands, square to the way
// the bell looks (a centimetre proud of the lip, so that the clapper lying against it is all underneath). The last two keys lie on that line; the end is moved along it until the opening sits there.
function makeFlight(frame) {
  const T = BELLS[NB - 1], sd = Math.sin(DSET), cd = Math.cos(DSET);
  const M = [T.cx, YA + LIPDROP * T.D * cd, T.cz + LIPDROP * T.D * sd], A = [0, cd, sd];
  const at = (d) => [M[0] + A[0] * d, M[1] + A[1] * d, M[2] + A[2] * d];
  const UP = [0, 1, 0], DOWN = [0, 0.75, -0.66], DIVE = [0, 0.2, -1];
  let end = 0.62, path = null;
  for (let pass = 0; pass < 8; pass++) {
    path = makePath([
      { t: 0, p: [0.35, 1.6, -27.5], up: UP },
      { t: 4.6, p: [0.3, 1.62, -19.4], look: [0, 2.0, -6], up: UP },
      { t: 8.8, p: [0.12, 1.66, -11.0], look: [0, 2.3, 0], up: UP },
      { t: 11.8, p: [0.02, 1.9, -6.4], look: [0, 2.2, 0.5], up: UP },             // through the arch
      { t: 14.8, p: [0, 2.75, -3.35], look: [0, 1.5, 0.9], up: UP },              // over the ringers' shoulders, between the tenor's rope and the treble's: the family
      { t: 17.6, p: [0.15, 3.6, -2.0], look: [0, 4.0, 3.0], up: UP },             // the far ropes, their sallies going up past the eye
      { t: 20.4, p: [0.4, 5.0, -1.4], look: [0, 7.5, 3.2], up: [0, 1, -0.2] },
      { t: 23.2, p: [0.65, 7.0, -1.0], look: [0.1, 19, 1.8], up: [0, 1, -0.5] },  // and up the height they go into
      { t: 26.5, p: [0.85, 10.0, -0.5], look: [-1.5, 14.5, 6.6], up: [0, 1, -0.2] },
      { t: 30, p: [0.9, 13.2, 0.2], look: [-5.8, 15.2, 5.2], up: UP },
      { t: 33.5, p: [0.5, 16.8, 0.7], look: [-7, 17.8, 0.5], up: UP },
      { t: 37.5, p: [0.3, 20.6, 0.5], look: [-3.5, 24.4, -1.0], up: UP },         // through the guide ring, up at the wheels of the ninth and tenth
      { t: 41.5, p: [0.5, 24.0, 0.6], look: [-0.8, 25.0, -4.0], up: UP },         // in the frame: the tenor and the eleventh swing over
      { t: 45, p: [0.5, 27.2, 1.6], look: [-0.3, 25.6, -3.6], up: UP },
      { t: 49, p: [0.3, 29.7, 5.9], look: [0, 25.2, -0.5], up: DOWN },            // out above them under the lamps, back to the top gallery's rail
      { t: 54, p: [0.15, 30.0, 6.9], look: [-0.1, 25.3, -1.0], up: DOWN },        // the mouths, as they are set
      { t: 57.2, p: [0, 30.0, 1.8], look: at(0), up: DOWN },
      { t: 60.6, p: at(2.6), look: at(0), up: DIVE },
      { t: 61.7, p: at(1.2), look: at(-1), up: DIVE },                               // on the line the bell looks along, so the last of the flight is straight
      { t: 63.7, p: at(-end), look: at(-3.2), up: DIVE },
    ], { frame, entryRadius: 1.3, exitRadius: 0.7 });
    const f = path.exit.flat;
    end += (f.x - M[0]) * A[0] + (f.y - M[1]) * A[1] + (f.z - M[2]) * A[2] - 0.012;
  }
  return path;
}

export const carillonPeal = {
  id: 'carillon-peal',
  title: 'A naming in the Belfry', drum: 'Carillon', row: 'Bell Row', kind: 'a hall drum', light: 32.6,
  line: 'Twelve bells eight decks up, and the ropes come all the way down the well to the ringers. Every bell is hung to swing along the axis. They say a bell swung spinward limps. The baby slept through the whole of it.',
  tone: '#e0ac6c', source: 'open-drums.md (Namings; Heliox music); three-nights 15-canon.js (Carillon); habitat-design.md (Life-inside numbers)',
  sound: { root: 50, scale: 'mixo', pad: 0.3, air: 0.1, hum: 0.1, crowd: 0.1, choir: 0.8, bells: 1, bright: 0.55 },
  *build(ctx) {
    const frame = makeFrame(140 * DEG, 1900, deckRadius(DECK0));
    const rng = makeRng('carillon-peal'), dens = ctx.density || 1;
    const path = makeFlight(frame);
    yield 'peal: flight';
    const deck = makeDeck(ctx, {
      frame, near: path.points(0.5), seed: 'carillon-peal', palette: PEAL, detail: 34,
      light: { level: 0.8, ambPower: 0.55, ambUp: '#5e4a38', ambDown: '#3d3026', haze: '#1e1712', hazeDensity: 0.008 }, floor: { shine: 0.9 },
    });
    yield 'peal: deck';

    // ---- Choir Street, deck 229: no higher than a room, and at its end the arch
    const S1 = -(W + GD);
    yield* street(deck, {
      axis: 'z', from: -46, to: S1, at: 0, y: 0, width: 6, cloth: 0.4, ends: ['wall', 'open'], pipes: false,
      lamps: { every: 6, kind: 'globe', power: 0.74 },
      plates: [{ at: -13.4, lines: ['The Belfry', 'Peal Court, decks 229 to 236'], w: 3.0 }, { at: -22.4, lines: ['Choir Street', 'Peal Court, deck 229'], w: 2.6 }],
      folk: { stand: 3, stroll: 0, walk: 0 },
      fronts: {
        anti: [
          { from: -30.5, to: -25, kind: 'shop', name: 'Quiet', sub: ['Felt for doors', 'Plugs for ears'], goods: 'cloth', awning: false, blade: true, lit: 1, font: 'italic' },
          { from: -25, to: -21.4, kind: 'wall', bench: false, notice: ['To let', 'A flat on Choir Street.', 'Not a quiet one.', 'There are none at any price.'] },
          { from: -21.4, to: -15.8, kind: 'stall', name: 'Pepper Broth', goods: 'pots', lit: 1 },
          { from: -15.8, to: S1, kind: 'shop', name: 'Sallies', sub: ['Bell ropes spliced', 'Sallies rewoven'], goods: 'cloth', awning: false, blade: false, lit: 1, font: 'serif', doorSide: 0 },
        ],
        spin: [
          { from: -29, to: -23.2, kind: 'shop', name: 'Sheets', sub: ['Rounds copied', 'by the hundred'], goods: 'paper', awning: false, blade: true, lit: 1 },
          { from: -23.2, to: -19.6, kind: 'stair', sub: 'Up 230, down 228' },
          { from: -19.6, to: -14, kind: 'shop', name: 'Lamps', goods: 'lamps', awning: ['#8a5c2c', '#e6d6b4'], lit: 1 },
          { from: -14, to: S1, kind: 'wall', bench: true },
        ],
      },
      fill: { mix: { shop: 1.2, home: 2.4, wall: 0.4 }, numbers: 11, lit: 0.8 },
    });
    // people still coming up the street, strolling toward the arch
    {
      const spots = [];
      for (let z = -29; z < S1 - 1; z += rng.f(1.6, 3.4)) { const x = rng.sign() * rng.f(1.3, 2.2), rad = rng.f(0.4, 0.8); if (deck.clear(x, 1.5, z, rad + 1.25)) spots.push({ p: [x, 0, z], walk: rad, child: rng() < 0.15 }); }
      deck.people(spots);
    }
    yield 'peal: street';

    // ---- the well, the frame, and what rings
    yield* drawWell(deck, rng);
    dressFoot(deck, rng);
    yield* drawFrame(deck);
    const R = makeRinging(deck);
    for (const B of BELLS) { yield* drawBell(R, B); drawRope(R, B); yield 'peal: rope'; }
    standFloor(deck, rng, dens);
    yield 'peal: ringers';
    const lamps = [[], [], [], []];
    yield* standChoir(deck, rng, lamps, dens);
    // everyone the kit stood for itself wears the same quiet colours
    for (const s of deck.spots) if (!s.color) s.color = rng.pick(MUTED);
    for (const w of deck.walkers) w.color = rng.pick(MUTED);

    // ---- light: lamps over every gallery walk, the sixteen under the ceiling, a pool of gold at the foot
    deck.lattice({ origin: [-(W + 1.3), 2.86, -5.6], spacing: [2 * (W + 1.3), BAY], count: [2, 5], storeys: LEVELS, rise: RISE, color: LAMP, power: 0.55, reach: 3.0 });
    deck.lattice({ origin: [-5.6, 2.86, -(W + 1.3)], spacing: [BAY, 2 * (W + 1.3)], count: [5, 2], storeys: LEVELS, rise: RISE, color: LAMP, power: 0.55, reach: 3.0 });
    deck.lattice({ origin: [-5.4, TOP - 1.0, -5.4], spacing: [3.6, 3.6], count: [4, 4], color: LAMP, power: 0.6, reach: 6.5, drop: 15, above: 1.2 });
    deck.zone({ min: [-W, -0.5, -W], max: [W, 3.6, W], soft: 1.6, color: '#ffc98a', power: 0.7, side: 0.62, under: 0.4 });
    deck.zone({ min: [-W, 0, -W], max: [W, TOP, W], soft: 1.0, color: '#c79a6a', power: 0.09, side: 1, under: 1 });
    // and the small lamps on the guide ring, which light the bells and the frame from underneath
    deck.zone({ min: [-4.6, YSPIDER + 1, ZOUT0 - 0.6], max: [4.6, YA + 2.2, ZOUT1 + 0.6], soft: 1.2, color: '#ffc27a', power: 0.42, side: 0.85, under: 1.8 });
    yield 'peal: light';

    yield* finish(deck);
    const scene = new Scene();
    scene.add(deck.group);
    const ringing = R.mesh();
    scene.add(ringing);
    yield 'peal: ringing';
    const voices = lamps.map((pts) => glowPoints(pts, { bend: frame, minPx: 1.4, maxPx: 70, soft: 1.9 }));
    for (const m of voices) scene.add(m);

    // the opening rides in the tenor's mouth through its last rise, and is not there before
    const T = BELLS[NB - 1], thSet = -(Math.PI + DSET);
    const Bm = frame.stand(T.cx, T.cz, { h: YA }), Binv = Bm.clone().invert(), M0 = new Matrix4(), Rx = new Matrix4();
    let portal = null, before = null, off = 0, begun = false;
    const o = { th: 0, psi: 0, hit: 0, set: 0 }, o2 = { th: 0, psi: 0, hit: 0, set: 0 };
    // each rope's sway: where its middle is from the straight, and how fast that is changing
    const sway = new Float64Array(NB), swayV = new Float64Array(NB);
    let sWas = -1e9;
    const api = {
      scene, path, deck, near: 0.1, far: 240,
      look: { exposure: 1.6, bloom: 0.3, threshold: 0.9, saturation: 1.04, contrast: 1.05, vignette: 0.5 },
      portal: { rim: false, mist: '#e0ac6c', openFor: 6 },
      update(t, dt, cam, engine) {
        // ringing time: the flight's clock, and before the flight (seen through the last world's opening) the
        // seconds still to go, so that the ropes are already going and nothing jumps at the crossing
        const seen = engine && engine.cur && engine.cur.userData !== api;
        let s = t;
        if (seen) { s = before = -Math.max(0, engine.cur.tCross - engine.cur.t); begun = false; }
        else {
          // (the crossing itself comes a moment before that clock reaches nought: what is left is eased away)
          if (!begun) { begun = true; off = before !== null && before - t > -1.5 ? before - t : 0; }
          s = t + off * (1 - smoothstep(0, 3, t));
        }
        // The sideways push on a rope (2 x 0.0572 x its speed, spinward as it rises) bows it by f L2 / 8T: 12 mm for
        // each metre a second when it rises slack, 4 mm when it is being pulled down. The fall of rope is a string 17 m
        // long with a note of its own, about a second and a half, so each push leaves it swaying for a few beats.
        const h = s - sWas, live = h > 0 && h < 0.25;
        sWas = s;
        for (const B of BELLS) {
          const i = B.i, v = (sallyY(B, ring(i, s, o2).th) - sallyY(B, ring(i, s - 0.06, o2).th)) / 0.06, push = v > 0 ? 0.012 * v : 0.004 * v;
          if (!live) { sway[i] = push; swayV[i] = 0; }
          else for (let k = 0, n = Math.ceil(h / 0.02), dt2 = h / n; k < n; k++) { swayV[i] += (SWAY_W * SWAY_W * (push - sway[i]) - 2 * 0.1 * SWAY_W * swayV[i]) * dt2; sway[i] += swayV[i] * dt2; }
          ring(i, s, o);
          R.sw[i].set(o.th, o.psi, sallyY(B, o.th) - YCATCH, sway[i]);
          R.ax[B.i].z = o.hit > 0 ? 0.6 * Math.exp(-o.hit / 0.22) : 0;
        }
        // the round against itself: each part swells a quarter of a whole pull behind the last
        for (let p = 0; p < 4; p++) voices[p].material.uniforms.uPower.value = 1 + 0.42 * Math.sin(TAU * (s / (25 * BEAT) - p / 4));
        if (portal) {
          const th = R.sw[NB - 1].x, rising = s > bottom(NB - 1, lastRow(NB - 1)) && th < -1.3;
          portal.visible = rising;
          if (rising) { portal.matrix.copy(Bm).multiply(Rx.makeRotationX(thSet - th)).multiply(Binv).multiply(M0); portal.matrixWorldNeedsUpdate = true; }
        }
      },
      // the engine hands over the opening it has made (ARCHITECTURE.md, "What build returns")
      onPortal(mesh) { portal = mesh; M0.copy(mesh.matrix); mesh.matrixAutoUpdate = false; },
    };
    api.update(0, 0, null, null);
    return api;
  },
};
