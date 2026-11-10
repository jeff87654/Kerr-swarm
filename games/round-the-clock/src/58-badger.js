/* ---------- Badger: The Take-Apart ----------
   Things in Sorrel are mended until they can't be, and then they come down to the Take-Apart in
   Badger's Keel (decks 5 to 8, a full g), to be taken apart by kind: metal, glass, cellulose.
   The first question about any worn thing is whether it is finished, and the answer is nearly
   always "not yet": anything with life left in it goes up the chute to the Last Table, where
   menders claim what's leaving. You are on the drop-off counter for 45 seconds. */
"use strict";
(function () {
  const TIME = 45, PATIENCE = 3, PENALTY = 1;
  const CX = 500, CY = 605, BIG = 220;            // the thing on the counter: centre and drawn size
  const BELT_X = 205, BELT_Y = 712, NEXT_SZ = 104; // the next thing waiting on the belt
  const DIRS = ["up", "left", "dn", "right"];

  // the things' own colours, kept small
  const STEEL = "#8b979e", STEEL_D = "#55616a", STEEL_L = "#c3ccd1";
  const IRON = "#3b4044", IRON_L = "#5d656b";
  const GLS = "#8fcdbd", GLS_D = "#3f8a7a", GLS_L = "#dcf3ec";
  const WOOD = "#b07f4f", WOOD_D = "#74502f";
  const CLOTH = "#55718a", CLOTH_D = "#3b5368";
  const FELT = "#a55444", FELT_L = "#c97a68";
  const CARD = "#c9a76f", CARD_D = "#93743f";
  const BREAD = "#c98a45", BREAD_D = "#8f5a28", BREAD_L = "#efd29a";
  const LEATHER = "#7d4f33", LEATHER_D = "#563622";
  const RAGC = "#9a9384", SOCKC = "#b5764e";
  const TOY = "#c4503c", CORD = "#a33f2e", COPPER = "#c27a3a";
  const CHALK = "#ecebe3", STITCH = "#2a2d30";
  const BRICK = "#e0896b";
  const ACCENT = { up: CHALK, left: STEEL, dn: GLS, right: CARD };
  const WORD = { up: "NOT YET", left: "METAL", dn: "GLASS", right: "FIBRE" };
  const MAT_SAY = { left: "Metal, that.", dn: "Glass, that.", right: "Fibre, that." };

  /* ---- the pictograms: each drawn in a 200 x 200 box centred on (0, 0), resting on y = 96 ---- */
  function patch(g, x, y, w, h, rot, col) {
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    fillRR(g, -w / 2, -h / 2, w, h, 3, col || CHALK);
    rrect(g, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 2);
    g.setLineDash([4, 4]); g.lineWidth = 2.5; g.strokeStyle = STITCH; g.stroke(); g.setLineDash([]);
    g.restore();
  }
  function binding(g, x0, y0, x1, y1, n, col) {
    for (let i = 0; i < n; i++) { const k = (i + 0.5) / n; const x = lerp(x0, x1, k), y = lerp(y0, y1, k); seg(g, x - 9, y - 4, x + 9, y + 4, 4, col || CORD); }
  }
  // split a drawing in two along a jagged line and pull the halves apart: the look of a thing in pieces
  function halves(g, zig, offA, offB, fn) {
    for (let side = 0; side < 2; side++) {
      const o = side ? offB : offA, ex = side ? 120 : -120;
      g.save(); g.translate(o[0], o[1]); g.rotate(o[2]);
      g.beginPath(); g.moveTo(ex, -120); g.lineTo(zig[0], -120);
      for (let i = 0; i < zig.length; i += 2) g.lineTo(zig[i], zig[i + 1]);
      g.lineTo(zig[zig.length - 2], 120); g.lineTo(ex, 120); g.closePath(); g.clip();
      fn(g, side);
      g.restore();
    }
  }
  function shard(g, x, y, r, rot, col) {
    g.save(); g.translate(x, y); g.rotate(rot);
    poly(g, [-r, r * 0.4, r * 0.2, -r, r, r * 0.6], col); g.restore();
  }

  const P = {
    /* -- not yet: whole, perhaps mended -- */
    chair(g) {
      seg(g, -34, 14, -31, 90, 10, WOOD_D); seg(g, 34, 14, 31, 90, 10, WOOD_D);
      seg(g, -50, -90, -50, 12, 14, WOOD); seg(g, 50, -90, 50, 12, 14, WOOD);
      fillRR(g, -58, -94, 116, 22, 8, WOOD); fillRR(g, -50, -52, 100, 13, 5, WOOD_D);
      fillRR(g, -68, 2, 136, 22, 7, WOOD); fillRR(g, -68, 18, 136, 7, 3, WOOD_D);
      seg(g, -57, 26, -61, 94, 14, WOOD); seg(g, 57, 26, 61, 94, 14, WOOD);
      fillRR(g, 49, 42, 22, 40, 4, CHALK); binding(g, 60, 46, 60, 78, 3, STITCH);
    },
    coat(g) {
      seg(g, -42, -66, -80, 46, 30, CLOTH); seg(g, 42, -66, 80, 46, 30, CLOTH);
      disc(g, -80, 52, 15, CLOTH_D); disc(g, 80, 52, 15, CLOTH_D);
      poly(g, [-46, -84, 46, -84, 58, 96, -58, 96], CLOTH);
      poly(g, [-32, -88, -4, -30, -12, -88], CLOTH_D); poly(g, [32, -88, 4, -30, 12, -88], CLOTH_D);
      seg(g, 0, -30, 0, 94, 3, CLOTH_D);
      for (const y of [-8, 26, 60]) disc(g, 10, y, 5.5, CHALK);
      fillRR(g, -48, 40, 30, 6, 2, CLOTH_D);
      patch(g, -64, 14, 28, 28, 0.42);
      // a tear, sewn up
      seg(g, 30, -6, 42, 30, 3, CLOTH_D);
      for (let i = 0; i < 4; i++) { const y = -2 + i * 9, x = 31 + i * 3.2; seg(g, x - 6, y - 2, x + 6, y + 2, 2.5, CHALK); }
    },
    lid(g) {
      g.beginPath(); g.ellipse(0, 54, 96, 15, 0, 0, TAU); g.fillStyle = STEEL_D; g.fill();
      g.beginPath(); g.moveTo(-90, 52); g.bezierCurveTo(-86, -30, 86, -30, 90, 52); g.closePath(); g.fillStyle = STEEL; g.fill();
      seg(g, -58, 22, -34, -2, 9, STEEL_L);
      g.beginPath(); g.ellipse(36, 16, 22, 14, 0.3, 0, TAU); g.fillStyle = STEEL_D; g.fill();
      g.beginPath(); g.ellipse(32, 12, 15, 8, 0.3, 0, TAU); g.fillStyle = STEEL; g.fill();
      fillRR(g, -7, -26, 14, 12, 2, STEEL_D); fillRR(g, -20, -40, 40, 17, 7, WOOD);
    },
    shoes(g) {
      const shoe = (dx, dy, col, colD, mend) => {
        g.save(); g.translate(dx, dy);
        g.beginPath(); g.moveTo(-70, 40); g.lineTo(-70, -10); g.quadraticCurveTo(-68, -24, -50, -24); g.lineTo(-30, -24);
        g.quadraticCurveTo(-22, -2, 10, 2); g.quadraticCurveTo(62, 8, 66, 34); g.lineTo(66, 40); g.closePath(); g.fillStyle = col; g.fill();
        fillRR(g, -74, 36, 146, 12, 5, colD);
        for (let i = 0; i < 3; i++) seg(g, -26 + i * 9, -14 + i * 5, -14 + i * 9, -18 + i * 5, 3, CHALK);
        if (mend) patch(g, 40, 22, 30, 20, -0.15);
        g.restore();
      };
      shoe(20, -28, LEATHER_D, INK, false);
      shoe(-14, 30, LEATHER, LEATHER_D, true);
    },
    flute(g) {
      g.save(); g.rotate(-0.55);
      fillRR(g, -106, -14, 212, 28, 14, "#d9c290");
      fillRR(g, -106, -14, 34, 28, 12, WOOD_D);
      fillRR(g, 86, -16, 22, 32, 8, WOOD_D);
      for (let i = 0; i < 6; i++) disc(g, -16 + i * 18, -1, 5, INK);
      binding(g, -54, 0, -36, 0, 3, CORD);
      g.restore();
    },
    kettle(g) {
      g.beginPath(); g.arc(0, -24, 52, Math.PI * 1.04, Math.PI * 1.96); g.lineWidth = 13; g.strokeStyle = STEEL_D; g.stroke();
      for (let i = 0; i < 4; i++) { const a = Math.PI * (1.36 + i * 0.09); const x = 52 * Math.cos(a), y = -24 + 52 * Math.sin(a); seg(g, x - 4, y - 7, x + 4, y + 7, 4, CORD); }
      poly(g, [48, 30, 98, -28, 108, -18, 64, 62], STEEL_D);
      fillRR(g, -72, -26, 144, 118, 46, STEEL);
      fillRR(g, -66, 82, 132, 12, 4, STEEL_D);
      g.beginPath(); g.ellipse(0, -24, 44, 10, 0, 0, TAU); g.fillStyle = STEEL_D; g.fill();
      disc(g, 0, -36, 10, STITCH);
      seg(g, -46, 4, -46, 52, 10, STEEL_L);
    },
    robot(g) {
      fillRR(g, -82, -42, 164, 98, 44, "#d4a53c");
      fillRR(g, -82, 18, 164, 14, 4, "#9c7524");
      fillRR(g, -32, -20, 64, 18, 9, INK); disc(g, 16, -11, 5, "#8fe0b4");
      fillRR(g, -72, 54, 144, 10, 4, "#6d6f6b");
      disc(g, -48, 74, 20, INK); disc(g, -48, 74, 7, STEEL_L);
      g.save(); g.translate(58, 84); g.rotate(0.55);
      g.beginPath(); g.ellipse(0, 0, 12, 20, 0, 0, TAU); g.fillStyle = INK; g.fill(); disc(g, 0, 0, 5, STEEL_L);
      g.restore();
      seg(g, 80, 64, 90, 56, 3, STITCH); seg(g, 84, 76, 96, 74, 3, STITCH);
    },
    toycab(g) {
      g.beginPath(); g.moveTo(-86, 8); g.quadraticCurveTo(-104, 30, -94, 62); g.lineWidth = 3; g.strokeStyle = STITCH; g.stroke();
      fillRR(g, -62, -66, 124, 40, 16, TOY);
      fillRR(g, -88, -36, 176, 78, 24, TOY);
      fillRR(g, -50, -56, 44, 26, 6, CHALK); fillRR(g, 6, -56, 44, 26, 6, CHALK);
      fillRR(g, -88, 4, 176, 9, 2, shade(TOY, -0.3));
      disc(g, -50, 48, 21, INK); disc(g, -50, 48, 7, CHALK);
      // a cotton reel for the lost wheel
      fillRR(g, 34, 26, 34, 44, 6, WOOD); fillRR(g, 34, 38, 34, 20, 2, CORD);
    },
    crusts(g) {
      g.beginPath(); g.ellipse(0, 76, 94, 20, 0, 0, TAU); g.fillStyle = WOOD_D; g.fill();
      const crust = (x, y, r, w) => {
        g.save(); g.translate(x, y); g.rotate(r);
        fillRR(g, -w / 2, -13, w, 26, 13, BREAD_D); fillRR(g, -w / 2 + 5, -4, w - 10, 13, 6, BREAD_L);
        g.restore();
      };
      crust(-34, 52, 0.18, 90); crust(36, 54, -0.22, 84); crust(-4, 30, 0.06, 96); crust(14, 6, -0.32, 74); crust(-26, 0, 0.4, 66);
      for (const p of [[-70, 70], [62, 74], [74, 64], [-58, 80]]) disc(g, p[0], p[1], 3.5, BREAD);
    },
    satchel(g) {
      g.beginPath(); g.arc(0, -20, 62, Math.PI, 0); g.lineWidth = 12; g.strokeStyle = LEATHER_D; g.stroke();
      fillRR(g, -82, -22, 164, 116, 14, LEATHER);
      fillRR(g, -82, -26, 164, 62, 14, LEATHER_D);
      fillRR(g, -11, 24, 22, 20, 3, STEEL_L); fillRR(g, -5, 30, 10, 8, 2, LEATHER_D);
      patch(g, 38, 66, 58, 40, -0.1, CHALK);
      patch(g, 46, 70, 28, 22, 0.15, CLOTH);
    },

    /* -- metal: snapped, bent, cracked, burnt out -- */
    spring(g) {
      const coil = (x0, x1, n) => {
        g.beginPath();
        for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n), y = i % 2 ? -32 : 32; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
        g.lineWidth = 11; g.strokeStyle = STEEL_D; g.lineJoin = "round"; g.stroke();
        g.lineWidth = 4; g.strokeStyle = STEEL_L; g.stroke();
      };
      g.save(); g.translate(-12, -10); g.rotate(-0.2); coil(-88, -12, 6); g.restore();
      g.save(); g.translate(18, 26); g.rotate(0.45); coil(8, 80, 5); g.restore();
      seg(g, -2, -50, 4, -66, 4, CHALK); seg(g, 12, -44, 24, -56, 4, CHALK); seg(g, -14, -42, -20, -58, 4, CHALK);
      shard(g, 2, 74, 7, 0.6, STEEL_D); shard(g, -30, 84, 6, 2.1, STEEL_D);
    },
    pipe(g) {
      g.beginPath(); g.moveTo(-94, -54); g.lineTo(-10, 40); g.lineTo(90, -40);
      g.lineJoin = "miter"; g.lineCap = "butt";
      g.lineWidth = 38; g.strokeStyle = STEEL_D; g.stroke();
      g.lineWidth = 24; g.strokeStyle = STEEL; g.stroke();
      g.lineJoin = "round"; g.lineCap = "round";
      seg(g, -80, -56, -30, 0, 5, STEEL_L);
      poly(g, [-30, 30, -10, 64, 10, 32, -2, 44, -12, 26, -20, 40], INK);
      g.beginPath(); g.ellipse(-94, -54, 20, 11, -0.85, 0, TAU); g.fillStyle = STITCH; g.fill();
      g.beginPath(); g.ellipse(90, -40, 20, 11, 0.68, 0, TAU); g.fillStyle = STITCH; g.fill();
    },
    pan(g) {
      g.save(); g.translate(68, 70); g.rotate(-0.35); fillRR(g, -38, -8, 76, 16, 8, WOOD_D); fillRR(g, -46, -5, 14, 10, 3, IRON_L); g.restore();
      halves(g, [-6, -75, 8, -40, -10, -12, 8, 18, -6, 46, 6, 80], [-16, 0, -0.14], [16, -6, 0.18], (gg) => {
        disc(gg, -10, -6, 66, IRON); disc(gg, -10, -6, 52, "#2a2f33");
        seg(gg, -50, -30, -36, -46, 6, IRON_L);
      });
      shard(g, 2, 84, 7, 0.4, IRON);
    },
    motor(g) {
      fillRR(g, -60, 44, 100, 14, 3, IRON);
      fillRR(g, -74, -52, 122, 100, 16, STEEL_D);
      for (let i = 0; i < 5; i++) seg(g, -56 + i * 22, -44, -56 + i * 22, 40, 4, STEEL);
      g.beginPath(); g.ellipse(48, -2, 18, 50, 0, 0, TAU); g.fillStyle = STEEL; g.fill();
      disc(g, -26, -12, 30, "#1c1f21"); disc(g, -2, 16, 22, "#1c1f21"); disc(g, -46, 18, 16, "#1c1f21"); disc(g, 10, -28, 13, "#1c1f21");
      fillRR(g, 62, -8, 22, 16, 3, STEEL_L);
      poly(g, [84, -8, 90, -3, 84, 2, 90, 8, 84, 8], STEEL_L);
      g.save(); g.translate(92, 52); g.rotate(0.9); fillRR(g, -14, -7, 28, 14, 3, STEEL_L); g.restore();
      seg(g, -74, 20, -92, 44, 6, COPPER); seg(g, -92, 44, -100, 40, 3, COPPER); seg(g, -92, 44, -98, 54, 3, COPPER); seg(g, -92, 44, -90, 58, 3, COPPER);
      seg(g, -74, 0, -96, 2, 6, CORD); seg(g, -96, 2, -104, -6, 3, CORD); seg(g, -96, 2, -105, 8, 3, CORD);
    },
    gear(g) {
      const gearAt = (gg, side) => {
        disc(gg, 0, 0, 56, STEEL_D);
        for (let i = 0; i < 12; i++) {
          if (i === 3 || i === 4 || i === 9) continue;    // teeth gone
          gg.save(); gg.rotate(i * TAU / 12); fillRR(gg, -11, -76, 22, 26, 4, STEEL_D); gg.restore();
        }
        disc(gg, 0, 0, 40, STEEL); disc(gg, 0, 0, 17, STITCH);
      };
      halves(g, [-4, -90, 6, -50, -8, -20, 4, 10, -6, 40, 8, 90], [-18, 6, -0.25], [20, -4, 0.3], gearAt);
    },

    /* -- glass: broken, cracked, shattered -- */
    bottle(g) {
      g.save(); g.translate(-30, 0);
      g.beginPath(); g.moveTo(-36, 94); g.lineTo(-36, -8); g.quadraticCurveTo(-36, -30, -20, -38); g.lineTo(-14, -52); g.lineTo(-6, -36);
      g.lineTo(2, -58); g.lineTo(8, -38); g.lineTo(16, -50); g.lineTo(20, -36); g.quadraticCurveTo(36, -28, 36, -8); g.lineTo(36, 94); g.closePath();
      g.fillStyle = GLS_D; g.fill();
      g.beginPath(); g.moveTo(-28, 88); g.lineTo(-28, -6); g.quadraticCurveTo(-28, -24, -14, -30); g.lineTo(-10, -40); g.lineTo(-4, -28);
      g.lineTo(2, -44); g.lineTo(8, -30); g.lineTo(14, -38); g.lineTo(16, -28); g.quadraticCurveTo(28, -22, 28, -6); g.lineTo(28, 88); g.closePath();
      g.fillStyle = GLS; g.fill();
      seg(g, -16, -4, -16, 70, 7, GLS_L);
      g.restore();
      g.save(); g.translate(58, 64); g.rotate(1.25);
      fillRR(g, -13, -44, 26, 64, 8, GLS_D); fillRR(g, -8, -40, 16, 56, 6, GLS); fillRR(g, -16, -50, 32, 12, 4, GLS_D);
      poly(g, [-13, 18, -6, 30, 0, 20, 6, 32, 13, 18], GLS_D);
      g.restore();
      shard(g, 52, -14, 12, 0.3, GLS_D); shard(g, 80, 18, 9, 1.9, GLS); shard(g, 26, 86, 8, 2.8, GLS_D);
    },
    lampglass(g) {
      fillRR(g, -28, -92, 56, 22, 6, STEEL_D);
      g.beginPath(); g.arc(0, -6, 74, 0, TAU);
      const hole = [18, -60, 40, -40, 30, -20, 58, -12, 66, 8, 70, -40, 50, -70];
      g.moveTo(hole[0], hole[1]); for (let i = 2; i < hole.length; i += 2) g.lineTo(hole[i], hole[i + 1]); g.closePath();
      g.fillStyle = GLS; g.fill("evenodd");
      g.beginPath(); g.moveTo(hole[0], hole[1]); for (let i = 2; i < 10; i += 2) g.lineTo(hole[i], hole[i + 1]);
      g.lineWidth = 4; g.strokeStyle = GLS_D; g.stroke();
      seg(g, 30, -20, -6, 4, 3, GLS_D); seg(g, -6, 4, -18, -10, 3, GLS_D); seg(g, -6, 4, -10, 40, 3, GLS_D); seg(g, -10, 40, -34, 52, 3, GLS_D); seg(g, 58, -12, 40, 30, 3, GLS_D);
      seg(g, -48, -30, -30, -50, 8, GLS_L);
      shard(g, 70, 74, 12, 0.8, GLS); shard(g, 44, 88, 8, 2.4, GLS_D); shard(g, 88, 50, 7, 1.2, GLS_D);
    },
    jar(g) {
      poly(g, [-86, 92, -84, -14, -60, -26, -48, 14, -60, 40, -54, 92], GLS);
      seg(g, -74, -6, -72, 60, 6, GLS_L);
      poly(g, [-40, 96, 44, 96, 40, 46, 20, 56, 4, 30, -14, 54, -36, 40], GLS);
      poly(g, [52, 92, 54, -10, 74, -30, 90, 10, 80, 40, 86, 92], GLS_D);
      fillRR(g, -18, 66, 36, 18, 3, CHALK);
      g.save(); g.translate(-8, -62); g.rotate(-0.42); fillRR(g, -48, -12, 96, 26, 7, TOY); fillRR(g, -48, 8, 96, 6, 2, shade(TOY, -0.3)); g.restore();
      shard(g, 20, 0, 10, 0.9, GLS_D); shard(g, -24, -10, 8, 2.3, GLS); shard(g, 44, 18, 7, 1.5, GLS);
    },
    tumbler(g) {
      g.save(); g.translate(-18, 4); g.rotate(-0.22);
      poly(g, [-62, -70, 2, -70, -6, -36, 6, -8, -10, 22, 2, 52, -6, 90, -50, 90], GLS_D);
      poly(g, [-54, -62, -6, -62, -14, -36, -2, -8, -18, 22, -6, 52, -14, 82, -44, 82], GLS);
      seg(g, -42, -50, -36, 66, 6, GLS_L);
      g.restore();
      g.save(); g.translate(28, 14); g.rotate(0.3);
      poly(g, [8, -70, 62, -70, 50, 90, 4, 90, 12, 52, 0, 22, 16, -8, 4, -36], GLS_D);
      poly(g, [14, -62, 54, -62, 44, 82, 12, 82, 20, 52, 8, 22, 24, -8, 12, -36], GLS);
      g.restore();
      shard(g, 0, 92, 9, 0.5, GLS_D); shard(g, -84, 80, 8, 2.0, GLS); shard(g, 88, 84, 10, 1.1, GLS_D);
    },

    /* -- fibre: worn through, torn, frayed, pulped -- */
    sock(g) {
      g.beginPath();
      g.moveTo(-44, -94); g.lineTo(14, -94); g.lineTo(14, 8); g.quadraticCurveTo(16, 24, 42, 26); g.lineTo(66, 26);
      g.quadraticCurveTo(98, 30, 96, 58); g.quadraticCurveTo(94, 86, 64, 86); g.lineTo(-8, 86); g.quadraticCurveTo(-44, 86, -44, 50); g.closePath();
      g.moveTo(-2, 52); g.ellipse(-20, 52, 18, 22, 0.2, 0, TAU);
      g.moveTo(84, 56); g.ellipse(68, 56, 16, 18, 0, 0, TAU);
      g.moveTo(-6, -30); g.ellipse(-14, -30, 8, 13, 0, 0, TAU);
      g.moveTo(40, 60); g.ellipse(32, 60, 8, 7, 0, 0, TAU);
      g.fillStyle = SOCKC; g.fill("evenodd");
      fillRR(g, -44, -94, 58, 20, 3, shade(SOCKC, -0.3));
      g.beginPath(); g.moveTo(-26, 74); g.quadraticCurveTo(-34, 90, -24, 100); g.moveTo(-14, 74); g.quadraticCurveTo(-8, 88, -16, 98);
      g.moveTo(66, 74); g.quadraticCurveTo(60, 88, 72, 98);
      g.lineWidth = 3; g.strokeStyle = SOCKC; g.stroke();
    },
    felt(g) {
      const zig = [2, -90, 12, -60, -8, -34, 14, -6, -6, 22, 10, 50, -4, 74, 6, 92];
      halves(g, zig, [-16, 2, -0.12], [18, 8, 0.14], (gg) => {
        fillRR(gg, -84, -84, 168, 168, 6, FELT);
        fillRR(gg, -84, -84, 168, 12, 4, shade(FELT, -0.25));
      });
      for (let i = 0; i < 7; i++) { const y = -76 + i * 25; disc(g, -10 + (i % 2) * 6, y, 5, FELT_L); disc(g, 24 + (i % 2) * 5, y + 10, 5, FELT_L); }
    },
    rag(g) {
      g.beginPath();
      g.moveTo(-84, -88); g.lineTo(84, -84); g.lineTo(80, -24); g.lineTo(-82, -28); g.closePath();
      g.moveTo(-24, -58); g.ellipse(-34, -58, 10, 12, 0, 0, TAU);
      g.moveTo(42, -52); g.ellipse(34, -52, 8, 9, 0, 0, TAU);
      g.fillStyle = RAGC; g.fill("evenodd");
      const L = [84, 52, 120, 70, 104, 46, 92];
      for (let i = 0; i < 7; i++) {
        const x = -78 + i * 23.5;
        g.save(); g.translate(x + 9, -30); g.rotate((i % 2 ? -1 : 1) * 0.06 * (i % 3));
        fillRR(g, -9, 0, 18, L[i], 7, i % 2 ? shade(RAGC, -0.15) : RAGC);
        seg(g, 0, L[i] - 2, (i % 2 ? 5 : -5), L[i] + 10, 2.5, RAGC);
        g.restore();
      }
    },
    card(g) {
      poly(g, [-86, 92, -80, -6, -54, -30, -24, -4, 8, -42, 44, -16, 80, -32, 88, 92], CARD);
      poly(g, [-80, -6, -98, -48, -64, -30], CARD_D);
      poly(g, [80, -32, 98, -70, 70, -54], CARD_D);
      g.globalAlpha = 0.55; disc(g, -20, 40, 30, CARD_D); disc(g, 14, 60, 24, CARD_D); disc(g, 30, 30, 18, CARD_D); g.globalAlpha = 1;
      seg(g, -40, -10, -30, 90, 3, CARD_D); seg(g, 40, -14, 48, 90, 3, CARD_D);
      for (const p of [[-96, 92, 7], [96, 90, 6], [70, 98, 5], [-64, 98, 5]]) disc(g, p[0], p[1], p[2], CARD);
    },

    /* -- the bins' own marks -- */
    nut(g) { const pts = []; for (let i = 0; i < 6; i++) { const a = i * TAU / 6; pts.push(70 * Math.cos(a), 70 * Math.sin(a)); } poly(g, pts, STEEL); disc(g, 0, 0, 30, STITCH); seg(g, -40, -40, -14, -54, 8, STEEL_L); },
    flask(g) { fillRR(g, -46, -30, 92, 124, 26, GLS); fillRR(g, -18, -84, 36, 64, 6, GLS); fillRR(g, -24, -94, 48, 16, 5, GLS_D); seg(g, -26, -6, -26, 70, 9, GLS_L); },
    skein(g) { disc(g, 0, 0, 74, CARD); g.lineWidth = 6; g.strokeStyle = CARD_D; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(0, 0, 74 - i * 2, 22 + i * 16, 0.6 + i * 0.5, 0, TAU); g.stroke(); } },
    needle(g) {
      g.beginPath(); g.moveTo(-60, 80); g.bezierCurveTo(-110, 10, 10, -10, 30, -40); g.lineWidth = 7; g.strokeStyle = CORD; g.stroke();
      seg(g, -40, 70, 64, -74, 10, STITCH); g.beginPath(); g.ellipse(56, -63, 4, 9, 0.6, 0, TAU); g.fillStyle = CHALK; g.fill();
    },
  };

  const ITEMS = [
    { id: "chair", place: "up", say: "A chair. Last Table." },
    { id: "coat", place: "up", say: "That coat has years in it." },
    { id: "lid", place: "up", say: "Lids on. It still fits." },
    { id: "shoes", place: "up", say: "Resole them." },
    { id: "flute", place: "up", say: "Somebody will play that." },
    { id: "kettle", place: "up", say: "That kettle still boils." },
    { id: "robot", place: "up", say: "One loose wheel." },
    { id: "toycab", place: "up", say: "A child wants that." },
    { id: "crusts", place: "up", say: "Crusts go in a pan." },
    { id: "satchel", place: "up", say: "A patch on a patch. Up." },
    { id: "spring", place: "left", fin: "Snapped. Metal." },
    { id: "pipe", place: "left", fin: "Bent flat. Metal." },
    { id: "pan", place: "left", fin: "In two. Metal." },
    { id: "motor", place: "left", fin: "Burnt out. Metal." },
    { id: "gear", place: "left", fin: "No teeth. Metal." },
    { id: "bottle", place: "dn", fin: "Broken. Glass." },
    { id: "lampglass", place: "dn", fin: "Shattered. Glass." },
    { id: "jar", place: "dn", fin: "In bits. Glass." },
    { id: "tumbler", place: "dn", fin: "In two. Glass." },
    { id: "sock", place: "right", fin: "Worn through. Fibre." },
    { id: "felt", place: "right", fin: "Torn in two. Fibre." },
    { id: "rag", place: "right", fin: "Past saving. Fibre." },
    { id: "card", place: "right", fin: "Pulp. Fibre." },
  ];
  const BY_ID = {}; for (const it of ITEMS) BY_ID[it.id] = it;
  const OF_PLACE = { up: [], left: [], dn: [], right: [] }; for (const it of ITEMS) OF_PLACE[it.place].push(it.id);

  function pic(g, id, x, y, size, rot) {
    g.save(); g.translate(x, y); if (rot) g.rotate(rot); g.scale(size / 200, size / 200);
    g.lineCap = "round"; g.lineJoin = "round";
    P[id](g);
    g.restore();
  }

  /* ---- state ---- */
  function create(ctx) {
    const s = {
      t: 0, left: TIME, score: 0, wrong: 0, missed: 0, streak: 0, bestStreak: 0, done: false,
      phase: "play", endT: 0, uid: 0, lastId: "", cur: null, next: null, nextT: 1,
      fly: [], pile: [], parts: new Parts(260), notes: new Notes(), remark: null,
      pulse: { up: 0, left: 0, dn: 0, right: 0 }, flash: null, shake: 0, clockHit: 0,
      esme: { look: 0, take: 0, nod: 0 }, gest: null, beltPh: 0, saidMiss: false, saidUp: false,
    };
    s.next = makeItem(s, ctx);
    advance(s, ctx);
    s.cur.inT = 1;                    // the first thing is already waiting
    ctx.say("Is it finished. If not: up.", 4);
    return s;
  }

  function makeItem(s, ctx) {
    const r = ctx.rng();
    const place = r < 0.35 ? "up" : r < 0.35 + 0.65 / 3 ? "left" : r < 0.35 + 1.3 / 3 ? "dn" : "right";
    let id = ctx.rng.pick(OF_PLACE[place]);
    if (id === s.lastId) id = OF_PLACE[place][(OF_PLACE[place].indexOf(id) + 1) % OF_PLACE[place].length];
    s.lastId = id;
    return { id };
  }

  function advance(s, ctx) {
    s.cur = { id: s.next.id, uid: ++s.uid, age: 0, inT: 0, wob: 0 };
    s.next = makeItem(s, ctx);
    s.nextT = 0;
  }

  const slideDur = (s) => Math.max(0.08, 0.17 - s.streak * 0.005);

  function binPoint(dir) {
    if (dir === "left") return [70, 470];
    if (dir === "right") return [930, 470];
    if (dir === "dn") return [500, 905];
    return [500, 330];
  }

  function pileSlot(k) {
    const rows = [7, 6, 5, 4, 3];
    let r = 0, i = k;
    while (r < rows.length && i >= rows[r]) { i -= rows[r]; r++; }
    const h = (n) => { const v = Math.sin(n * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
    if (r >= rows.length) return { x: 360 + h(1) * 280, y: 100 + h(2) * 90, rot: (h(3) - 0.5) * 0.9 };
    const n = rows[r];
    return { x: 500 + (i - (n - 1) / 2) * 54 + (h(1) - 0.5) * 10, y: 200 - r * 30, rot: (h(2) - 0.5) * 0.6 };
  }

  function curPos(s) {
    const c = s.cur, k = clamp(c.inT / slideDur(s), 0, 1);
    const x = lerp(BELT_X, CX, easeOut(k));
    const sz = lerp(NEXT_SZ, BIG, easeBack(k));
    const bob = k < 1 ? -Math.sin(k * Math.PI) * 26 : 0;
    return { x: x + (c.wob ? Math.sin(c.wob * 40) * 10 * c.wob : 0), y: BELT_Y - sz * 0.48 + bob + (k >= 1 ? 0 : 0), sz };
  }

  function sort(s, ctx, dir) {
    const c = s.cur, it = BY_ID[c.id], pos = curPos(s);
    const right = dir === it.place;
    const f = { id: c.id, x0: pos.x, y0: pos.y, s0: pos.sz, t: 0, dir, rot: 0, spin: (dir === "left" ? -1 : 1) * (5 + ctx.rng() * 3), right };
    if (right) {
      s.score++; s.streak++; s.bestStreak = Math.max(s.bestStreak, s.streak);
      ctx.sfx.chime(Math.min(10, s.streak - 1));
      const words = { 5: "Tidy", 10: "Thrifty", 15: "A proper Stripe", 20: "Seven bins' worth", 25: "Mend the mend" };
      if (words[s.streak]) { s.notes.add(words[s.streak], CX, 470, { good: true, size: 46, life: 1.2 }); ctx.sfx.great(); }
      else if (s.streak > 25 && s.streak % 5 === 0) { s.notes.add(s.streak + " running", CX, 470, { good: true, size: 46 }); ctx.sfx.great(); }
    } else {
      s.wrong++; s.streak = 0;
      s.left = Math.max(0, s.left - PENALTY); s.clockHit = 1;
      ctx.sfx.bad();
      const text = it.place === "up" ? it.say : dir === "up" ? it.fin : MAT_SAY[it.place];
      s.remark = { text: text.toUpperCase(), t: 0 };
      s.flash = { dir: it.place, t: 0 };
      if (!ctx.reduced) s.shake = 0.22;
      if (it.place === "up") { s.esme.look = 1.8; s.notes.add("Hm", 880, 700, { size: 38, col: CHALK }); }
      if (it.place === "up" && !s.saidUp) { s.saidUp = true; ctx.say("Anything with life left in it goes up, to the Last Table.", 3.4); }
    }
    if (dir === "up") {
      f.dur = 0.42;
      if (right) { const k = s.pile.length; const sl = pileSlot(k); s.pile.push({ id: c.id, x: sl.x, y: sl.y, rot: sl.rot, landed: false, t: 0 }); f.pileIdx = k; f.x1 = sl.x; f.y1 = sl.y; f.s1 = 60; f.rot1 = sl.rot; }
      else { f.x1 = 500; f.y1 = 300; f.s1 = 40; f.rot1 = 0; }
      f.cx = CX; f.cy = 60;
    } else {
      const bp = binPoint(dir);
      f.dur = 0.24; f.x1 = bp[0]; f.y1 = bp[1]; f.s1 = 70; f.cx = (f.x0 + f.x1) / 2; f.cy = dir === "dn" ? f.y0 + 60 : f.y0 - 120;
    }
    s.fly.push(f);
    ctx.sfx.whoosh(0.4);
    advance(s, ctx);
  }

  function clerkTakes(s, ctx) {
    const pos = curPos(s);
    s.missed++; s.streak = 0;
    s.fly.push({ id: s.cur.id, x0: pos.x, y0: pos.y, s0: pos.sz, t: 0, dur: 0.45, dir: "desk", x1: 800, y1: 846, s1: 64, cx: 700, cy: 560, rot: 0, spin: 3, right: false });
    s.esme.take = 0.6;
    s.notes.add("Esme takes it", CX, 470, { size: 40, col: CHALK });
    ctx.sfx.miss();
    if (!s.saidMiss) { s.saidMiss = true; ctx.say("Three seconds a thing, or the clerk takes it herself.", 3); }
    advance(s, ctx);
  }

  function arrive(s, f, ctx) {
    if (f.dir === "desk") { ctx.sfx.thud(0.4); return; }
    if (f.dir === "up") {
      if (f.pileIdx !== undefined) { const p = s.pile[f.pileIdx]; p.landed = true; p.t = 0; }
      ctx.sfx.pop();
      for (let i = 0; i < 8; i++) s.parts.add({ x: f.x1 + ctx.rng.range(-20, 20), y: f.y1 + 20, vx: ctx.rng.range(-80, 80), vy: -ctx.rng.range(20, 90), g: 300, life: 0.5, r: 4, col: CHALK, a: 0.7 });
      return;
    }
    s.pulse[f.dir] = 1;
    const col = f.dir === "left" ? STEEL_L : f.dir === "dn" ? GLS_L : CARD;
    for (let i = 0; i < 12; i++) {
      const a = ctx.rng() * TAU, v = ctx.rng.range(60, 220);
      s.parts.add({ x: f.x1, y: f.y1, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: f.dir === "right" ? 60 : 500, drag: f.dir === "right" ? 3 : 1, life: f.dir === "right" ? 0.8 : 0.45, r: f.dir === "dn" ? 4 : f.dir === "right" ? 6 : 3.5, col, a: 0.9 });
    }
    if (f.dir === "left") ctx.sfx.clack();
    else if (f.dir === "dn") { ctx.sfx.tone({ f: 2600, f1: 2200, dur: 0.08, vol: 0.06, type: "triangle" }); ctx.sfx.tone({ f: 3400, dur: 0.07, vol: 0.05, type: "triangle", at: 0.04 }); ctx.sfx.noise({ f: 6000, q: 2, dur: 0.12, vol: 0.04, at: 0.02 }); }
    else ctx.sfx.thud(0.35);
  }

  function readDir(s, inp) {
    if (inp.leftPressed) return "left";
    if (inp.rightPressed) return "right";
    if (inp.upPressed) return "up";
    if (inp.dnPressed) return "dn";
    if (inp.ptrPressed) s.gest = { x0: inp.x, y0: inp.y, used: false };
    let dir = null;
    if (s.gest && !s.gest.used && inp.ptrDown) {
      const dx = inp.x - s.gest.x0, dy = inp.y - s.gest.y0;
      if (Math.hypot(dx, dy) >= 60) { s.gest.used = true; dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "dn"); }
    }
    if (inp.ptrReleased && s.gest) {
      if (!s.gest.used) {
        // a tap: the bin on that side of the counter
        const dx = inp.x - CX, dy = inp.y - (CY - 10);
        if (Math.hypot(dx, dy) > 125) dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "dn");
        else if (s.cur) s.cur.wob = 0.3;
      }
      s.gest = null;
    }
    return dir;
  }

  function update(s, dt, inp, ctx) {
    s.t += dt;
    s.parts.update(dt); s.notes.update(dt);
    for (const d of DIRS) s.pulse[d] = Math.max(0, s.pulse[d] - dt * 3.5);
    s.shake = Math.max(0, s.shake - dt); s.clockHit = Math.max(0, s.clockHit - dt * 2);
    s.esme.look = Math.max(0, s.esme.look - dt); s.esme.take = Math.max(0, s.esme.take - dt);
    if (s.remark) { s.remark.t += dt; if (s.remark.t > 1.5) s.remark = null; }
    if (s.flash) { s.flash.t += dt; if (s.flash.t > 0.9) s.flash = null; }
    for (const p of s.pile) p.t += dt;
    for (let i = s.fly.length - 1; i >= 0; i--) {
      const f = s.fly[i]; f.t += dt; f.rot += f.spin * dt * (f.dir === "up" ? 0.3 : 1);
      if (f.t >= f.dur) { s.fly.splice(i, 1); arrive(s, f, ctx); }
    }
    s.beltPh += dt * (1.2 + Math.min(s.streak, 20) * 0.12) * (s.phase === "end" ? 0 : 1);
    s.nextT = Math.min(1, s.nextT + dt / 0.3);
    ctx.hud.set(fmtMinSec(Math.ceil(s.left)), "sorted " + s.score);

    if (s.phase === "end") {
      s.endT += dt; s.esme.nod = s.endT;
      if (s.endT > 1.7) s.done = true;
      return;
    }
    s.left -= dt;
    if (s.left <= 0) {
      s.left = 0; s.phase = "end"; s.endT = 0; s.gest = null;
      ctx.sfx.bell(7); ctx.sfx.cheer(0.5);
      return;
    }
    const c = s.cur;
    c.age += dt; c.inT += dt; c.wob = Math.max(0, c.wob - dt);
    const dir = readDir(s, inp);
    if (dir) sort(s, ctx, dir);
    else if (c.age > PATIENCE) clerkTakes(s, ctx);
  }

  /* ---- drawing ---- */
  function drawHatch(g, s, pal, dir) {
    const p = s.pulse[dir], fl = s.flash && s.flash.dir === dir ? 1 - s.flash.t / 0.9 : 0;
    const frame = mix(pal.b, "#ffffff", p * 0.5);
    if (dir === "left" || dir === "right") {
      const x = dir === "left" ? -30 : 825;
      g.save(); g.translate((dir === "left" ? 1 : -1) * p * 6, 0);
      fillRR(g, x, 352, 205, 296, 22, frame);
      const mx = dir === "left" ? -30 : 847;
      fillRR(g, mx, 374, 183, 186, 16, shade(pal.a, -0.62));
      fillRR(g, mx, 548, 183, 12, 3, ACCENT[dir]);
      pic(g, dir === "left" ? "nut" : "skein", dir === "left" ? 66 : 934, 462, 104);
      sign(g, WORD[dir], dir === "left" ? 78 : 922, 618, 54, INK, "center", 800);
      if (fl > 0) { rrect(g, x + 4, 356, 197, 288, 20); g.lineWidth = 8; g.strokeStyle = alpha(BRICK, fl); g.stroke(); }
      g.restore();
    } else if (dir === "dn") {
      g.save(); g.translate(0, p * 6);
      fillRR(g, 328, 852, 344, 190, 22, frame);
      fillRR(g, 348, 868, 304, 52, 12, shade(pal.a, -0.62));
      fillRR(g, 348, 912, 304, 8, 3, ACCENT.dn);
      pic(g, "flask", 410, 968, 76);
      sign(g, WORD.dn, 548, 988, 54, INK, "center", 800);
      if (fl > 0) { rrect(g, 332, 856, 336, 182, 20); g.lineWidth = 8; g.strokeStyle = alpha(BRICK, fl); g.stroke(); }
      g.restore();
    }
  }

  function drawEsme(g, s, pal) {
    const X = 905, Y = 905, H = 255;
    const e = s.esme, cur = s.cur;
    const urgent = s.phase === "play" && cur && cur.age > PATIENCE - 0.8;
    const up = e.look > 0 || e.take > 0 || urgent || s.phase === "end";
    let lean = up ? -0.04 : 0.2;
    if (s.phase === "end") lean = -0.04 + 0.1 * Math.max(0, Math.sin(Math.min(e.nod, 1.2) * TAU * 1.6));
    const stampPh = (s.t * 0.75) % 1;
    const lift = up ? 0 : Math.max(0, Math.sin(stampPh * TAU)) * 34;
    const hand = e.take > 0 ? [770, 770] : up ? [812, 842] : [818, 842 - lift];
    const coat = pal.b;
    const r = person(g, X, Y, H, { view: "side", face: -1, pose: "sit", old: true, shirt: coat, legs: shade(pal.a, -0.2), skin: SKINS[1], lean, handTo: hand, handTo2: [792, 846] });
    // the mended elbow: a patch where the near arm bends
    const L = lean + 0.12, legLen = 0.43 * H, hipY = -legLen * 0.52, shY = hipY - 0.31 * H;
    const sx = 0.02 * H, sy = shY + 0.03 * H, u1 = 0.165 * H, u2 = 0.16 * H, cl = Math.cos(L), sl = Math.sin(L);
    const dx0 = (hand[0] - X) * -1, dy0 = hand[1] - Y;
    const lx = dx0 * cl + dy0 * sl, ly = -dx0 * sl + dy0 * cl;
    const ex = lx - sx, ey = ly - sy, d = clamp(Math.hypot(ex, ey), Math.abs(u1 - u2) + 0.001, u1 + u2 - 0.001);
    const a1 = Math.atan2(ex, ey) - Math.acos(clamp((u1 * u1 + d * d - u2 * u2) / (2 * u1 * d), -1, 1));
    const elx = sx + u1 * Math.sin(a1), ely = sy + u1 * Math.cos(a1);
    const ePx = X - (elx * cl - ely * sl), ePy = Y + (elx * sl + ely * cl);
    g.save(); g.translate(ePx, ePy); g.rotate(-a1); fillRR(g, -9, -9, 18, 18, 3, shade(pal.a, 0.25));
    rrect(g, -6, -6, 12, 12, 2); g.setLineDash([3, 3]); g.lineWidth = 1.6; g.strokeStyle = CHALK; g.stroke(); g.setLineDash([]); g.restore();
    s.esme.hand = hand;
    // her spectacles
    disc(g, r.headX - r.headR * 0.78, r.headY + r.headR * 0.05, r.headR * 0.28, up ? "#fff6dc" : alpha(CHALK, 0.6));
    ring(g, r.headX - r.headR * 0.78, r.headY + r.headR * 0.05, r.headR * 0.3, 2, STITCH);
  }

  function drawStamp(g, s) {
    const h = s.esme.hand; if (!h || s.esme.take > 0) return;
    fillRR(g, h[0] - 9, h[1] - 26, 18, 22, 4, WOOD_D); fillRR(g, h[0] - 13, h[1] - 6, 26, 8, 2, INK);
  }
  function drawDesk(g, s, pal) {
    // her desk in the corner: papers, a pad of ink, a hand lamp
    fillRR(g, 752, 866, 270, 150, 6, shade(pal.a, -0.42));
    fillRR(g, 735, 850, 300, 20, 5, WOOD_D);
    for (let i = 0; i < 4; i++) fillRR(g, 752 + i * 2, 844 - i * 5, 64, 6, 2, i % 2 ? CHALK : shade(CHALK, -0.1));
    fillRR(g, 842, 842, 30, 8, 3, INK);
    seg(g, 972, 850, 972, 818, 5, STEEL_D); lamp(g, 972, 812, 9, "#ffe3a8", 4);
  }

  function drawRoom(g, s, pal, ctx) {
    // the deck above: the Last Table, where menders claim what's leaving
    g.fillStyle = mix(pal.a, pal.b, 0.16); g.fillRect(-20, -20, SW + 40, 320);
    for (let i = 0; i < 9; i++) seg(g, 60 + i * 110, 0, 60 + i * 110, 292, 3, alpha(INK, 0.12));
    const glowK = s.phase === "end" ? 0.25 + 0.3 * smooth(0, 0.6, s.endT) : 0.22;
    seg(g, 500, -10, 500, 46, 3, INK); lamp(g, 500, 52, 12, "#ffe3a8", 10 * (1 + glowK));
    glow(g, 500, 180, 330, "#ffe8b8", glowK);
    // two menders, cheering at the end, pleased with each new arrival
    const lastLand = s.pile.length ? Math.min(...s.pile.filter((p) => p.landed).map((p) => p.t).concat([9])) : 9;
    const happy = s.phase === "end" || lastLand < 0.6;
    person(g, 196, 292, 170, { shirt: shade(pal.a, 0.35), legs: INK, skin: SKINS[4], hair: HAIRS[0], pose: happy ? "cheer" : "stand", t: s.t });
    person(g, 806, 292, 160, { shirt: CLOTH, legs: shade(pal.a, -0.3), skin: SKINS[0], hair: HAIRS[4], pose: s.phase === "end" ? "cheer" : "hands", t: s.t + 0.4 });
    // the table and its pile
    fillRR(g, 290, 228, 420, 18, 4, WOOD_D);
    seg(g, 310, 244, 316, 292, 10, WOOD_D); seg(g, 690, 244, 684, 292, 10, WOOD_D);
    fillRR(g, 300, 244, 400, 22, 3, shade(WOOD_D, -0.25));
    sign(g, "THE LAST TABLE", 500, 262, 22, alpha(CHALK, 0.85), "center", 700);
    for (const p of s.pile) {
      if (!p.landed) continue;
      let b = p.t < 0.3 ? Math.sin(p.t / 0.3 * Math.PI) * 10 : 0;
      if (s.phase === "end") { const q = s.endT - 0.15 - s.pile.indexOf(p) * Math.min(0.05, 0.9 / s.pile.length); if (q > 0 && q < 0.3) b = Math.sin(q / 0.3 * Math.PI) * 16; }
      pic(g, p.id, p.x, p.y - b, 60, p.rot);
    }
    // the floor between: the up chute's mouth, painted NOT YET
    const pu = s.pulse.up, fl = s.flash && s.flash.dir === "up" ? 1 - s.flash.t / 0.9 : 0;
    g.fillStyle = mix(pal.b, "#ffffff", pu * 0.5); g.fillRect(-20, 292, SW + 40, 60);
    pic(g, "needle", 334, 322, 54);
    sign(g, WORD.up, 500, 341, 54, INK, "center", 800);
    poly(g, [640, 336, 664, 304, 688, 336], INK); poly(g, [700, 336, 724, 304, 748, 336], alpha(INK, 0.45));
    if (fl > 0) { g.fillStyle = alpha(BRICK, fl * 0.5); g.fillRect(-20, 292, SW + 40, 60); }

    // the Take-Apart: a long charcoal room
    g.fillStyle = pal.a; g.fillRect(-20, 352, SW + 40, 700);
    for (let i = 0; i < 9; i++) seg(g, 60 + i * 110, 352, 60 + i * 110, 960, 3, alpha(INK, 0.16));
    g.fillStyle = shade(pal.a, -0.25); g.fillRect(-20, 760, SW + 40, 300);
    g.fillStyle = shade(pal.a, -0.45); g.fillRect(-20, 960, SW + 40, 80);
    // the chute up
    poly(g, [445, 352, 555, 352, 600, 468, 400, 468], shade(pal.a, -0.5));
    seg(g, 400, 468, 600, 468, 6, alpha(CHALK, 0.6));
    for (let i = 0; i < 3; i++) poly(g, [480, 440 - i * 32, 500, 420 - i * 32, 520, 440 - i * 32], alpha(CHALK, 0.10 + 0.08 * ((s.t * 2 - i * 0.3) % 1 < 0.5 ? 1 : 0)));

    // the clock board and the deck board
    const ch = s.clockHit;
    fillRR(g, 196, 380, 176, 96, 10, ch > 0 ? mix(INK, BRICK, ch * 0.6) : alpha(INK, 0.86));
    sign(g, fmtMinSec(Math.ceil(s.left)), 284, 436, 56, PAPER, "center", 800);
    mono(g, s.score + " SORTED", 284, 464, 22, alpha(PAPER, 0.75));
    fillRR(g, 628, 380, 176, 96, 10, alpha(INK, 0.86));
    sign(g, "DECK 6", 716, 432, 46, PAPER, "center", 800);
    mono(g, fmtG(gFrac(deckR(6))) + " · KEEL", 716, 464, 22, alpha(PAPER, 0.75));
  }

  function drawBelt(g, s, pal) {
    // a slot in the wall, the belt, and a crate of things still to come
    fillRR(g, -30, 646, 70, 66, 8, shade(pal.a, -0.62));
    fillRR(g, -20, BELT_Y, 395, 22, 6, shade(pal.a, -0.6));
    for (let x = 6; x < 375; x += 38) {
      disc(g, x, BELT_Y + 11, 9, shade(pal.a, -0.2));
      const a = s.beltPh * 4;
      seg(g, x - 6 * Math.cos(a), BELT_Y + 11 - 6 * Math.sin(a), x + 6 * Math.cos(a), BELT_Y + 11 + 6 * Math.sin(a), 3, shade(pal.a, -0.6));
    }
    for (let x = 60; x < 360; x += 50) { const o = (s.beltPh * 60) % 50; seg(g, x - o + 25, BELT_Y + 2, x - o + 25, BELT_Y + 6, 3, alpha(CHALK, 0.2)); }
    seg(g, 70, BELT_Y + 22, 70, 960, 12, shade(pal.a, -0.5)); seg(g, 320, BELT_Y + 22, 320, 960, 12, shade(pal.a, -0.5));
    // the crate
    fillRR(g, 60, 856, 230, 104, 6, WOOD_D);
    for (let i = 0; i < 3; i++) seg(g, 70, 880 + i * 30, 280, 880 + i * 30, 4, shade(WOOD_D, -0.3));
    for (const q of [["kettle", 110, 834, -0.2], ["rag", 170, 836, 0.15], ["chair", 236, 822, 0.1]]) pic(g, q[0], q[1], q[2], 70, q[3]);
    fillRR(g, 60, 856, 230, 30, 4, WOOD);
  }

  function drawCounter(g, s, pal) {
    const st = Math.min(s.streak, 20);
    glow(g, CX, CY, 300, "#fff0cc", 0.16 + st * 0.01);
    disc(g, CX, CY - 4, 152, mix(pal.b, "#f6e7c4", 0.5));
    disc(g, CX, CY - 4, 152 - 10, mix(pal.b, "#fbf1da", 0.35 + st * 0.0125));
    fillRR(g, 360, 706, 280, 20, 6, pal.b);
    fillRR(g, 372, 726, 256, 118, 8, shade(pal.a, -0.35));
    // the streak, in chalk tallies on the counter's face
    for (let i = 0; i < st; i++) {
      const grp = Math.floor(i / 5), j = i % 5, gx = 392 + grp * 46;
      if (j < 4) seg(g, gx + j * 9, 748, gx + j * 9, 790, 4, alpha(CHALK, 0.85));
      else seg(g, gx - 5, 784, gx + 33, 754, 4, alpha(CHALK, 0.85));
    }
    if (s.streak > 20) mono(g, "+" + (s.streak - 20), 612, 778, 24, CHALK, "right");
    // how long she'll wait
    if (s.phase === "play" && s.cur) {
      const k = clamp(1 - s.cur.age / PATIENCE, 0, 1);
      fillRR(g, 392, 812, 216, 12, 6, alpha(INK, 0.6));
      if (k > 0) fillRR(g, 392, 812, 216 * k, 12, 6, k < 0.3 ? BRICK : alpha(CHALK, 0.8));
    }
  }

  function flyPos(f) {
    const k = clamp(f.t / f.dur, 0, 1), e = f.dir === "up" ? easeInOut(k) : easeIn(k) * 0.6 + k * 0.4;
    const u = 1 - e;
    return { x: u * u * f.x0 + 2 * u * e * f.cx + e * e * f.x1, y: u * u * f.y0 + 2 * u * e * f.cy + e * e * f.y1, sz: lerp(f.s0, f.s1, e), rot: f.dir === "up" && f.rot1 !== undefined ? lerp(0, f.rot1, e) : f.rot, k };
  }

  function draw(s, g, ctx) {
    const pal = ctx.pal;
    g.save();
    if (s.shake > 0 && !ctx.reduced) g.translate(Math.sin(s.t * 90) * 9 * s.shake / 0.22, 0);
    drawRoom(g, s, pal, ctx);
    drawBelt(g, s, pal);
    drawHatch(g, s, pal, "left"); drawHatch(g, s, pal, "right");
    glow(g, 968, 812, 130, "#ffe3a8", 0.25);
    drawEsme(g, s, pal);
    drawDesk(g, s, pal);
    drawStamp(g, s);
    drawHatch(g, s, pal, "dn");
    drawCounter(g, s, pal);

    // the next thing, riding in on the belt
    if (s.next && s.phase === "play") {
      const k = easeOut(s.nextT);
      pic(g, s.next.id, lerp(-60, BELT_X, k), BELT_Y - NEXT_SZ * 0.48, NEXT_SZ);
    }
    // the thing on the counter
    if (s.cur && s.phase === "play") { const p = curPos(s); pic(g, s.cur.id, p.x, p.y, p.sz); }
    // things on their way out
    for (const f of s.fly) {
      const p = flyPos(f);
      if (f.dir !== "up" && f.dir !== "desk") g.globalAlpha = 1 - smooth(0.75, 1, p.k);
      pic(g, f.id, p.x, p.y, p.sz, p.rot);
      g.globalAlpha = 1;
    }
    s.parts.draw(g);
    s.notes.draw(g);

    // Esme's word on a wrong one
    if (s.remark) {
      const k = s.remark.t, a = 1 - smooth(1.1, 1.5, k), pop = easeBack(clamp(k / 0.18, 0, 1));
      g.globalAlpha = a;
      g.font = "800 40px " + FONT_SIGN;
      const w = g.measureText(s.remark.text).width + 50;
      g.save(); g.translate(CX, 452); g.scale(pop, pop);
      fillRR(g, -w / 2, -34, w, 60, 30, alpha(INK, 0.9));
      sign(g, s.remark.text, 0, 10, 40, BRICK, "center", 800);
      g.restore();
      g.globalAlpha = 1;
    }
    if (s.phase === "end") {
      const k = smooth(0, 0.4, s.endT);
      g.globalAlpha = k;
      fillRR(g, 300, 520, 400, 150, 18, alpha(INK, 0.9));
      sign(g, s.score + " SORTED", 500, 610, 84, PAPER, "center", 800);
      mono(g, s.pile.length + " SAVED FOR THE LAST TABLE", 500, 648, 22, alpha(PAPER, 0.8));
      g.globalAlpha = 1;
    }
    g.restore();
  }

  // The house plays: it knows where everything goes, and takes a moment to look.
  function bot(s, b, ctx) {
    const c = s.cur, sk = ctx.skill;
    if (!c || s.phase !== "play") return;
    if (c.botAt === undefined) {
      c.botAt = 0.3 + (1 - sk) * 2.2 * ctx.rng.range(0.7, 1.4);
      c.botDir = BY_ID[c.id].place;
      if (ctx.rng.chance((1 - sk) * 0.3)) { const o = DIRS.filter((d) => d !== c.botDir); c.botDir = ctx.rng.pick(o); }
    }
    if (c.age >= c.botAt) b[c.botDir] = true;
  }

  registerEvent({
    id: "badger", hour: 9, name: "The Take-Apart",
    place: "The Take-Apart's drop-off counter, in Badger's Keel · decks 5 to 8 · 0.99 g",
    intro: "Things in Sorrel are mended until they can't be, and then they come here to be taken apart by kind: metal, glass, cellulose. But the first question about any worn thing is whether it is finished, and in Badger the answer is nearly always not yet. Chairs go up to the Last Table, and so do the crusts.",
    how: "Swipe each thing to its bin, or tap the bin. Anything with life left in it goes up. Wrong costs a second.",
    keys: "arrows: up for not yet, left metal, down glass, right fibre",
    marks: [20, 30, 40], unit: "sorted", fmt: (v) => String(v),
    result: (s) => s.score + " sorted, " + (s.wrong + s.missed) + " wrong",
    create, update, draw, bot,
  });
})();
