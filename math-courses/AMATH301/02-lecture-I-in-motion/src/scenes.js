'use strict';
/* =====================================================================
   Lecture I in Motion : scenes and timeline
   ===================================================================== */
const DUR = 94;
let S = 1;                 // pixel scale of the output canvas (1 = 1920x1080)
let READOUT = '';
const LX = 150, TAG_Y = 300;

/* ---------- the functions of Lecture I ---------- */
const FN = {
  para: (x, y) => x * x + y * y,
  dome: (x, y) => { const q = 4 - x * x - y * y; return q < -1e-9 ? NaN : Math.sqrt(Math.max(0, q)); },
  saddle: (x, y) => x * x - y * y,
  hill: (x, y) => 3.4 - .3 * x * x - .45 * y * y + .3 * x,
  hx: (x, y) => -.6 * x + .3,
  hy: (x, y) => -.9 * y,
  pin: (x, y) => { const r2 = x * x + y * y; return r2 < 1e-14 ? 0 : x * y / r2; }
};
const ZS = .62;                                  // world height per unit of f for the hill
const PNT = [-.9, .9];                           // the point P used in 1.5 to 1.7
const fP = FN.hill(...PNT), fxP = FN.hx(...PNT), fyP = FN.hy(...PNT);
const polarRim = (u, v) => { const r = 2 * Math.sin(u * Math.PI / 2), th = TAU * v; return [r * Math.cos(th), r * Math.sin(th)]; };
const rectP = (a, b) => (u, v) => [a + (b - a) * u, a + (b - a) * v];

/* ---------- global tracks ---------- */
function track(keys, T) {
  if (T <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i], [t1, b] = keys[i + 1];
    if (T <= t1) return lerp(a, b, E.inOut(seg(T, t0, t1)));
  }
  return keys[keys.length - 1][1];
}
const GRID_A = [[0, 0], [2.2, 0], [3.8, 1], [72.4, 1], [73.2, 0]];
const FLOOR_Z = [[0, 0], [36.6, 0], [38.2, -2.6], [42.2, -2.6], [43.6, 0]];
const AXES_A = [[0, 0], [8, 0], [8.01, .85], [42, .85], [42.8, 0], [51.6, 0], [52.8, .7], [72.4, .7], [73.2, 0], [79.6, 0], [80.6, .8], [86, .8], [86.8, 0]];

const CAMKEYS = [
  [0, { yaw: 0, pitch: 0, tz: 1.0, cy: H * .62 }],
  [2.3, { yaw: 0, pitch: 0, tz: 1.0, cy: H * .62 }],
  [4.6, { yaw: -35, pitch: 25, tz: .9, cy: H * .58, cx: W * .655 }],
  [8.0, { yaw: -48, pitch: 27, tz: .9, cy: H * .58, cx: W * .655 }],
  [9.8, { yaw: -58, pitch: 38, tz: .3, cy: H * .57, F: 2150 }],
  [17.0, { yaw: -72, pitch: 36, tz: .3, cy: H * .57, F: 2150 }],
  [19.2, { yaw: -82, pitch: 27, tz: .6, cy: H * .6 }],
  [27.0, { yaw: -104, pitch: 26, tz: .7, cy: H * .6 }],
  [28.6, { yaw: -110, pitch: 24, tz: .9, cy: H * .6 }],
  [33.6, { yaw: -128, pitch: 24, tz: .9, cy: H * .6 }],
  [35.4, { yaw: -90, pitch: 90, tz: 0, cy: H * .5, F: 2050 }],
  [36.6, { yaw: -90, pitch: 90, tz: 0, cy: H * .5, F: 2050 }],
  [38.2, { yaw: -132, pitch: 23, tz: -.4, cy: H * .56, F: 2000 }],
  [42.0, { yaw: -152, pitch: 25, tz: -.4, cy: H * .56, F: 2000 }],
  [43.6, { yaw: -180, pitch: 90, tz: 0, cy: H * .5, F: 2350 }],
  [51.2, { yaw: -180, pitch: 90, tz: 0, cy: H * .5, F: 2350 }],
  [53.0, { yaw: -218, pitch: 26, tz: .9, cy: H * .6 }],
  [63.0, { yaw: -236, pitch: 27, tz: .9, cy: H * .6 }],
  [64.8, { yaw: -270, pitch: 90, tz: 0, cy: H * .5, F: 2250 }],
  [72.2, { yaw: -270, pitch: 90, tz: 0, cy: H * .5, F: 2250 }],
  [74.0, { yaw: -305, pitch: 24, tz: 1.0, cy: H * .6 }],
  [79.4, { yaw: -322, pitch: 24, tz: 1.0, cy: H * .6 }],
  [80.6, { yaw: -322, pitch: 29, tz: .05, cy: H * .56 }],
  [86.0, { yaw: -372, pitch: 31, tz: .05, cy: H * .56 }],
  [94.0, { yaw: -400, pitch: 31, tz: .05, cy: H * .56 }]
];

/* ---------- caption helpers ---------- */
function capTag(ctx, t, str, t0, t1) {
  const a = fio(t, t0, t1, .4);
  if (a > 0) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = COL.coral; ctx.fillRect(LX, TAG_Y - 38, 46 * E.out(seg(t, t0, t0 + .6)), 3); ctx.restore(); }
  kText(ctx, str, LX, TAG_Y, t, { font: `400 22px ${MONO}`, color: COL.coral, t0, tOut: t1, track: 5, stag: .014, rise: 14 });
}
function capTitle(ctx, t, str, t0, t1, y = 382, size = 56) {
  str.split('\n').forEach((ln, i) => kText(ctx, ln, LX, y + i * size * 1.13, t, { font: `400 ${size}px ${SERIF}`, t0: t0 + i * .1, tOut: t1, stag: .02, dur: .75, rise: 34 }));
}
function label3(ctx, cam, p, str, { dx = 14, dy = -12, size = 28, color = COL.ink, alpha = 1, italic = true, align = 'left', font = null } = {}) {
  if (alpha <= 0) return;
  const s = cam.project(...p);
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = color; ctx.textAlign = align;
  ctx.font = font || `${italic ? 'italic ' : ''}400 ${size}px ${SERIF}`;
  ctx.fillText(str, s[0] + dx, s[1] + dy); ctx.restore();
}
function tex3(ctx, cam, p, src, sz, o = {}) {
  const s = cam.project(...p);
  tex(ctx, src, s[0] + (o.dx ?? 16), s[1] + (o.dy ?? -14), sz, o);
}
const fmt = (v, d = 2) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(d);

/* =====================================================================
   SCENE 0 : intro, a curve sweeps into a surface
   ===================================================================== */
const S_INTRO = {
  start: 0, dur: 8, tail: 0, label: 'LECTURE I',
  draw(ctx, t, cam) {
    floorGrid(ctx, cam, { alpha: seg(t, 2.2, 3.6), reveal: E.out(seg(t, 2.2, 3.9)) });
    axes3(ctx, cam, { which: 'xz', alpha: seg(t, .2, 1), grow: E.out(seg(t, .2, 1.5)) });
    axes3(ctx, cam, { which: 'y', alpha: seg(t, 2.6, 3.6), grow: E.out(seg(t, 2.6, 3.9)) });
    const rev = E.inOut(seg(t, 3.7, 6.1));
    if (rev > 0) {
      surface(ctx, cam, {
        param: (u, v) => { const r = -2 + 4 * u, th = Math.PI * rev * v; return [r * Math.cos(th), r * Math.sin(th)]; },
        nu: 36, nv: Math.max(2, Math.round(30 * rev)), z: (x, y) => .6 * (x * x + y * y), clo: 0, chi: 2.4, edge: .16
      });
    }
    const pc = E.inOut(seg(t, .5, 2.0));
    if (pc > 0) {
      const th = Math.PI * rev, pts = [], N = 90;
      for (let i = 0; i <= N * pc; i++) { const r = -2 + 4 * i / N; pts.push([r * Math.cos(th), r * Math.sin(th), .6 * r * r]); }
      poly3(ctx, cam, pts); glowStroke(ctx, COL.coral, 4.5, 20, 1 - .55 * seg(t, 6.2, 7.5));
      if (pc < 1) { const p = pts[pts.length - 1]; const s = cam.project(...p); dot(ctx, s[0], s[1], 7, '#fff', 1, 20); }
    }
    if (rev > 0 && rev < 1) {
      const th = Math.PI * rev; const p = [2 * Math.cos(th), 2 * Math.sin(th), 2.4]; const s = cam.project(...p);
      dot(ctx, s[0], s[1], 7, '#fff', 1, 22);
    }
    /* captions */
    texIn(ctx, 'f(x) = x^2', LX, 470, 70, t, .9, 3.0);
    para(ctx, 'One input, one output. The graph is a curve.', LX, 560, t, 1.3, 3.0);
    texIn(ctx, 'f(x, y) = x^2 + y^2', LX, 470, 70, t, 3.3, 5.0);
    para(ctx, 'Two inputs. Spin the curve and it sweeps out a surface.', LX, 560, t, 3.7, 5.0);
    kText(ctx, 'AMATH301  ·  LECTURE I', LX, 392, t, { font: `400 24px ${MONO}`, color: COL.coral, t0: 5.3, tOut: 7.3, track: 6, stag: .015, rise: 12 });
    kText(ctx, 'Functions of', LX, 500, t, { font: `400 92px ${SERIF}`, t0: 5.45, tOut: 7.35, stag: .03, dur: .9, rise: 50 });
    kText(ctx, 'Several Variables', LX, 604, t, { font: `400 92px ${SERIF}`, t0: 5.65, tOut: 7.4, stag: .03, dur: .9, rise: 50 });
    para(ctx, 'A moving summary of the first lecture.', LX, 680, t, 6.1, 7.4, { size: 32 });
  }
};

/* =====================================================================
   SCENE 1.1 : domain
   ===================================================================== */
const DOTS = [];
for (let i = 0; i <= 22; i++) for (let j = 0; j <= 22; j++) {
  const x = -2.75 + .25 * i, y = -2.75 + .25 * j, r = Math.hypot(x, y);
  DOTS.push({ x, y, r, inside: r <= 2 + 1e-9 });
}
const DOT_FINAL = [236, 226, 246];
function dotPx(cam, x, y, z, base) { const s = cam.project(x, y, z); return [s[0], s[1], base * cam.dist / s[2]]; }

const S_DOMAIN = {
  start: 8, dur: 9, tail: 0, label: '§1.1  DOMAIN',
  draw(ctx, t, cam) {
    if (t < 1.6) {
      const k = 1 - E.inOut(seg(t, 0, 1.25));
      withLayer(ctx, 1 - seg(t, .85, 1.55), c => surface(c, cam, { param: polarRim, nu: 20, nv: 44, z: (x, y) => .6 * k * (x * x + y * y), clo: 0, chi: 2.4, edge: .16 }));
    }
    const sr = 3.05 * E.inOut(seg(t, 1.9, 4.1));
    /* disc fill and boundary */
    const fa = seg(t, 3.8, 4.6);
    if (fa > 0) { poly3(ctx, cam, circle3(cam, 0, 0, 0, 2)); ctx.fillStyle = rgba(COL.plumMid, .2 * fa); ctx.fill(); }
    const pb = E.inOut(seg(t, 3.2, 4.4));
    if (pb > 0) { poly3(ctx, cam, circle3(cam, 0, 0, 0, 2, -Math.PI / 2, -Math.PI / 2 + TAU * pb)); glowStroke(ctx, COL.lav, 3, 14); }
    /* dots */
    for (const d of DOTS) {
      const ap = E.outBack(seg(t, .6 + d.r * .12, 1.05 + d.r * .12));
      if (ap <= 0) continue;
      const q = clamp((sr - d.r) / .35);
      let z = 0, a = 1, col, size = 4.6 * ap;
      if (d.inside) {
        const c0 = [190, 176, 214];
        col = c0.map((v, k) => Math.round(v + (DOT_FINAL[k] - v) * q));
        size *= 1 + .7 * Math.sin(Math.PI * q);
      } else {
        const q2 = clamp((sr - d.r) / 1.1);
        col = q > 0 ? [238, 106, 85] : [190, 176, 214];
        z = -1.5 * E.in(q2); a = 1 - q2;
        size *= 1 + .5 * Math.sin(Math.PI * q);
      }
      if (a <= 0) continue;
      const [px, py, rr] = dotPx(cam, d.x, d.y, z, size);
      dot(ctx, px, py, rr, `rgb(${col.join(',')})`, a);
    }
    /* scanning ring */
    const ra = seg(t, 1.9, 2.2) * (1 - seg(t, 3.85, 4.15));
    if (ra > 0 && sr > .02) { poly3(ctx, cam, circle3(cam, 0, 0, 0, sr)); glowStroke(ctx, COL.cyan, 3, 22, ra); }

    capTag(ctx, t, '§1.1   THE DOMAIN', .5, 8.2);
    capTitle(ctx, t, 'Where the formula\nmakes sense', .7, 8.2);
    texIn(ctx, 'f(x, y) = \\sqrt{4 - x^2 - y^2}', LX, 575, 52, t, 1.3, 8.2);
    texIn(ctx, '4 - x^2 - y^2 \\ge 0 \\iff x^2 + y^2 \\le 4', LX, 665, 38, t, 2.8, 8.2);
    para(ctx, 'A closed disc of radius 2. Outside it the square root is undefined, so those points are thrown away.', LX, 760, t, 4.6, 8.2);
    if (t < this.dur) READOUT = t < 4.3 ? `scan radius   r = ${sr.toFixed(2)}` : 'Dom f  =  { (x, y) : x² + y² ≤ 4 }';
  }
};

/* =====================================================================
   SCENE 1.2 : the graph, every point lifted to its height
   ===================================================================== */
const P0 = [1.25, .75];
const S_GRAPH = {
  start: 17, dur: 10, tail: 0, label: '§1.2  THE GRAPH',
  draw(ctx, t, cam) {
    const zf = (x, y) => .9 * FN.dome(x, y);
    const fo = 1 - seg(t, 0, .9);
    if (fo > 0) {
      poly3(ctx, cam, circle3(cam, 0, 0, 0, 2)); ctx.fillStyle = rgba(COL.plumMid, .2 * fo); ctx.fill();
      poly3(ctx, cam, circle3(cam, 0, 0, 0, 2)); glowStroke(ctx, COL.lav, 3, 14, fo);
    }
    const sa = E.inOut(seg(t, 7.2, 8.6));
    if (sa > 0) withLayer(ctx, sa, c => surface(c, cam, { param: polarRim, nu: 22, nv: 52, z: zf, clo: 0, chi: 1.8, edge: .16 }));
    const da = 1 - seg(t, 7.6, 8.7);
    const stA = .3 * (1 - seg(t, 7.0, 8.0));
    for (const d of DOTS) {
      if (!d.inside) continue;
      const isP = Math.abs(d.x - P0[0]) < 1e-6 && Math.abs(d.y - P0[1]) < 1e-6;
      const p = isP ? E.out(seg(t, 2.2, 3.2)) : E.outBack(seg(t, 4.6 + d.r * .55, 5.6 + d.r * .55));
      const z = p * zf(d.x, d.y);
      if (da <= 0) break;
      if (p > 0 && !isP && stA > 0) {
        poly3(ctx, cam, [[d.x, d.y, 0], [d.x, d.y, z]]); ctx.strokeStyle = rgba(COL.lav, stA * da); ctx.lineWidth = 1.2; ctx.stroke();
      }
      if (isP) continue;
      const [px, py, rr] = dotPx(cam, d.x, d.y, z, 4.6);
      const col = cmap(clamp(z / 1.8) * .85 + .15);
      const c = p > 0 ? `rgb(${col.map(Math.round).join(',')})` : `rgb(${DOT_FINAL.join(',')})`;
      dot(ctx, px, py, rr, c, da);
    }
    /* the highlighted point */
    const zP = zf(...P0), pr = E.out(seg(t, 2.2, 3.2)), pa = 1 - seg(t, 8.0, 8.8);
    if (pa > 0) {
      const ring = seg(t, 1.6, 2.5);
      if (ring > 0 && ring < 1) { poly3(ctx, cam, circle3(cam, P0[0], P0[1], 0, .08 + .32 * ring)); glowStroke(ctx, COL.coral, 2.5, 12, 1 - ring); }
      const base = cam.project(P0[0], P0[1], 0);
      dot(ctx, base[0], base[1], 6, COL.coral, pa * seg(t, 1.6, 1.9), 14);
      if (pr > 0) {
        poly3(ctx, cam, [[P0[0], P0[1], 0], [P0[0], P0[1], zP * pr]]); glowStroke(ctx, COL.coral, 3.5, 16, pa);
        const top = cam.project(P0[0], P0[1], zP * pr); dot(ctx, top[0], top[1], 8, '#fff', pa, 22);
      }
      label3(ctx, cam, [P0[0], P0[1], 0], '(x, y)', { dx: 16, dy: 34, alpha: pa * seg(t, 1.8, 2.3), size: 30 });
      tex3(ctx, cam, [P0[0], P0[1], zP], 'f(x, y) = 1.37', 32, { dx: 20, dy: -18, alpha: pa * seg(t, 3.1, 3.5) });
    }
    capTag(ctx, t, '§1.2   THE GRAPH', .4, 9.3);
    capTitle(ctx, t, 'Lift every point\nto its height', .6, 9.3);
    texIn(ctx, 'f : \\R^2 \\to \\R, \\quad (x, y) \\mapsto f(x, y)', LX, 575, 44, t, 1.2, 9.3);
    para(ctx, 'Take one point (x, y) of the domain and raise it to the height f(x, y). Then do it for every point at once.', LX, 670, t, 2.0, 7.0);
    texIn(ctx, '\\text{graph}(f) = \\{ (x, y, f(x, y)) \\}', LX, 670, 40, t, 7.4, 9.3);
    para(ctx, 'The lifted points knit together into a surface: the graph of f.', LX, 760, t, 7.9, 9.3);
    if (t < this.dur) READOUT = t > 1.6 && t < 7.4 ? 'x = 1.25    y = 0.75    f(x, y) = √(4 − x² − y²) = 1.37' : 'f(x, y) = √(4 − x² − y²)';
  }
};

/* =====================================================================
   SCENE 1.3 : level curves, then the saddle
   ===================================================================== */
const RINGCOL = [COL.lav, '#E7A6C9', COL.coral, COL.peach];
const S_LEVEL = {
  start: 27, dur: 15, tail: 0, label: '§1.3  LEVEL CURVES',
  draw(ctx, t, cam, T) {
    const m1 = E.inOut(seg(t, .2, 1.6)), m2 = E.inOut(seg(t, 9.8, 11.4));
    const zf = (x, y) => lerp(lerp(.9 * FN.dome(x, y), .6 * FN.para(x, y), m1), .6 * FN.saddle(x, y), m2);
    const sa = 1 - .8 * seg(t, 6.6, 7.6) + .8 * seg(t, 9.0, 10.0);
    const clo = lerp(0, -2.4, m2), chi = lerp(lerp(1.8, 2.4, m1), 2.4, m2);
    const fz = track(FLOOR_Z, T);
    withLayer(ctx, sa, c => surface(c, cam, { param: polarRim, nu: 22, nv: 56, z: zf, clo, chi, edge: .16 }));

    /* rising plane */
    const zPl = 2.75 * seg(t, 1.9, 6.3), pa = seg(t, 1.9, 2.3) * (1 - seg(t, 6.0, 6.5));
    if (pa > 0) {
      poly3(ctx, cam, [[-2.3, -2.3, zPl], [2.3, -2.3, zPl], [2.3, 2.3, zPl], [-2.3, 2.3, zPl]], true);
      ctx.fillStyle = rgba(COL.cyan, .1 * pa); ctx.fill(); ctx.strokeStyle = rgba(COL.cyan, .55 * pa); ctx.lineWidth = 1.5; ctx.stroke();
      if (zPl > .01 && zPl <= 2.4) { poly3(ctx, cam, circle3(cam, 0, 0, zPl, Math.sqrt(zPl / .6))); glowStroke(ctx, COL.cyanHi, 3.5, 22, pa); }
      label3(ctx, cam, [2.3, -2.3, zPl], `z = c`, { dx: 12, dy: 6, size: 28, color: COL.cyanHi, alpha: pa });
    }
    /* stamped rings */
    const ringA = 1 - seg(t, 9.3, 9.9);
    if (ringA > 0) for (let i = 1; i <= 4; i++) {
      const ci = .6 * i, ti = 1.9 + 4.4 * ci / 2.75;
      if (t < ti) continue;
      const d = E.in(seg(t, ti + .15, ti + .9)), z = ci * (1 - d), r = Math.sqrt(i);
      poly3(ctx, cam, circle3(cam, 0, 0, z, r)); glowStroke(ctx, RINGCOL[i - 1], d < 1 ? 3.5 : 2.6, d < 1 ? 20 : 8, ringA);
      if (d >= 1) {
        let best = null;
        for (let k = 0; k < 64; k++) { const a = TAU * k / 64; const s = cam.project(r * Math.cos(a), r * Math.sin(a), 0); if (!best || s[1] < best[1]) best = [s[0], s[1], a]; }
        const la = ringA * seg(t, ti + .9, ti + 1.2) * (1 - .6 * seg(t, 6.6, 7.2));
        ctx.save(); ctx.globalAlpha = la; ctx.font = `italic 400 26px ${SERIF}`; ctx.fillStyle = RINGCOL[i - 1]; ctx.textAlign = 'center';
        ctx.fillText(`c = ${i}`, best[0], best[1] - 12); ctx.restore();
      }
    }
    /* gap annotations in the top view */
    const ga = seg(t, 8.0, 8.5) * (1 - seg(t, 9.2, 9.6));
    if (ga > 0) {
      let best = null;
      for (let k = 0; k < 90; k++) { const a = TAU * k / 90; const s = cam.project(2 * Math.cos(a), 2 * Math.sin(a), 0); if (!best || s[0] > best[0]) best = [s[0], s[1], a]; }
      const a = best[2], R = [0, 1, Math.SQRT2, Math.sqrt(3), 2];
      ctx.save(); ctx.globalAlpha = ga;
      for (let i = 1; i <= 4; i++) {
        const s0 = cam.project(R[i - 1] * Math.cos(a), R[i - 1] * Math.sin(a), 0), s1 = cam.project(R[i] * Math.cos(a), R[i] * Math.sin(a), 0);
        ctx.strokeStyle = COL.coral; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(s0[0], s0[1] + 22); ctx.lineTo(s1[0], s1[1] + 22); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s1[0], s1[1] + 14); ctx.lineTo(s1[0], s1[1] + 30); ctx.stroke();
        if (i === 1) { ctx.beginPath(); ctx.moveTo(s0[0], s0[1] + 14); ctx.lineTo(s0[0], s0[1] + 30); ctx.stroke(); }
        ctx.font = `400 19px ${MONO}`; ctx.fillStyle = COL.peach; ctx.textAlign = 'center';
        ctx.fillText((R[i] - R[i - 1]).toFixed(2), (s0[0] + s1[0]) / 2, s0[1] + 54);
      }
      ctx.restore();
    }
    /* contours of the morphing function on the floor */
    const ca = seg(t, 9.4, 10.2) * (1 - seg(t, 15, 15.6));
    if (ca > 0) {
      const fm = (x, y) => lerp(FN.para(x, y), FN.saddle(x, y), m2);
      for (const c of [-3, -2, -1, 0, 1, 2, 3]) {
        const segs = contourSegs(fm, -2, 2, -2, 2, 60, c, (x, y) => x * x + y * y <= 4.02);
        strokeSegs(ctx, cam, segs, () => fz);
        ctx.save();
        if (c === 0) ctx.setLineDash([10, 8]);
        ctx.globalAlpha = ca; ctx.lineCap = 'round';
        ctx.strokeStyle = c === 0 ? COL.cyanHi : c > 0 ? mixHex(COL.lav, COL.peach, (c - 1) / 2) : mixHex(COL.coral, '#FF9E8A', (-c - 1) / 2);
        ctx.lineWidth = 2.4; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 8; ctx.stroke();
        ctx.restore();
      }
      if (fz < -.5) {
        poly3(ctx, cam, circle3(cam, 0, 0, fz, 2)); ctx.strokeStyle = rgba(COL.lav, .25 * ca); ctx.lineWidth = 1.2; ctx.stroke();
      }
    }
    capTag(ctx, t, '§1.3   LEVEL CURVES', .4, 14.2);
    capTitle(ctx, t, 'Slice at height c', .6, 9.2);
    texIn(ctx, 'f(x, y) = x^2 + y^2', LX, 500, 48, t, 1.0, 9.2);
    texIn(ctx, '\\{ (x, y) : f(x, y) = c \\}', LX, 585, 48, t, 1.6, 9.2);
    para(ctx, 'A horizontal plane at height c cuts the surface along a level curve. Drop each curve to the floor and keep it.', LX, 680, t, 2.4, 6.6);
    para(ctx, 'Equal steps in height, shrinking gaps between the circles: the bowl gets steeper as you move out.', LX, 680, t, 7.0, 9.2);
    capTitle(ctx, t, 'The saddle', 9.7, 14.2);
    texIn(ctx, 'x^2 - y^2 = c', LX, 500, 52, t, 10.3, 14.2);
    para(ctx, 'For c ≠ 0 the level curves are hyperbolas. At c = 0 they become the two lines y = x and y = −x.', LX, 590, t, 11.0, 14.2);
    if (t < this.dur) {
      if (t < 6.4) READOUT = t > 1.9 ? `slicing at   c = ${(Math.min(zPl, 2.4) / .6).toFixed(2)}` : 'f(x, y) = x² + y²';
      else if (t < 9.6) READOUT = 'radii   1,  √2,  √3,  2';
      else READOUT = 'x² − y² = c,    c = −3, …, 3';
    }
  }
};

/* =====================================================================
   SCENE 1.4 : open sets
   ===================================================================== */
function pPath(t) {
  const s = seg(t, 1.6, 5.0);
  const rho = 2 - 1.85 * Math.exp(-4 * s) - .03 * s - .0 * (1 - s);
  const phi = .65 + .55 * s + .12 * Math.sin(3 * s * Math.PI);
  return [rho, phi];
}
const S_OPEN = {
  start: 42, dur: 9, tail: .01, label: '§1.4  OPEN SETS',
  draw(ctx, t, cam, T) {
    const fz = track(FLOOR_Z, T);
    const so = 1 - seg(t, 0, .9);
    if (so > 0) {
      withLayer(ctx, so, c => {
        surface(c, cam, { param: polarRim, nu: 22, nv: 56, z: (x, y) => .6 * FN.saddle(x, y), clo: -2.4, chi: 2.4, edge: .16 });
        for (const cc of [-3, -2, -1, 0, 1, 2, 3]) {
          strokeSegs(c, cam, contourSegs(FN.saddle, -2, 2, -2, 2, 60, cc, (x, y) => x * x + y * y <= 4.02), () => fz);
          c.strokeStyle = cc === 0 ? COL.cyanHi : cc > 0 ? COL.lav : COL.coral; c.lineWidth = 2.4; c.stroke();
        }
      });
    }
    const da = seg(t, .7, 1.4), closed = seg(t, 5.0, 5.6);
    if (da > 0) {
      poly3(ctx, cam, circle3(cam, 0, 0, 0, 2, 0, TAU, 160)); ctx.fillStyle = rgba(COL.plumMid, .24 * da); ctx.fill();
      ctx.save(); ctx.setLineDash([16, 12]); ctx.lineDashOffset = -t * 30; ctx.globalAlpha = da * (1 - closed);
      poly3(ctx, cam, circle3(cam, 0, 0, 0, 2, 0, TAU, 160)); ctx.strokeStyle = COL.lav; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      if (closed > 0) { poly3(ctx, cam, circle3(cam, 0, 0, 0, 2, 0, TAU * closed, 160)); glowStroke(ctx, COL.lav, 4, 16, da); }
      label3(ctx, cam, [-.35, -.6, 0], 'U', { size: 54, color: rgba(COL.lav, .85), alpha: da, dx: 0, dy: 0 });
    }
    const pa = seg(t, 1.4, 1.8) * (1 - seg(t, 8.4, 8.9));
    if (pa > 0) {
      let [rho, phi] = pPath(t);
      const pe = pPath(5.0);
      const mv = E.inOut(seg(t, 5.1, 5.9));
      rho = lerp(rho, 2, mv); phi = lerp(phi, pe[1], mv);
      const px = rho * Math.cos(phi), py = rho * Math.sin(phi);
      const a = t < 5.1 ? .8 * (2 - rho) : lerp(.8 * (2 - pe[0]), .42 + .03 * Math.sin(6 * t), E.out(seg(t, 5.1, 6.0)));
      /* outside part of the ball (only on the boundary) */
      const oa = seg(t, 5.9, 6.2);
      if (oa > 0) {
        ctx.save();
        poly3(ctx, cam, circle3(cam, px, py, 0, a, 0, TAU, 64)); ctx.clip();
        ctx.beginPath(); ctx.rect(0, 0, W, H);
        const ring = circle3(cam, 0, 0, 0, 2, 0, TAU, 160).reverse();
        ring.forEach((p, i) => { const s = cam.project(...p); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); });
        ctx.clip('evenodd');
        const flash = .5 + .5 * Math.sin(Math.max(0, t - 6) * 7);
        ctx.fillStyle = rgba(COL.coral, (.25 + .3 * flash) * oa * pa); ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = rgba(COL.coralHi, .8 * oa * pa); ctx.lineWidth = 2;
        for (let k = -60; k < 60; k++) { ctx.beginPath(); ctx.moveTo(k * 14, 0); ctx.lineTo(k * 14 + H, H); ctx.stroke(); }
        ctx.restore();
        const s = cam.project(px * 1.17, py * 1.17, 0);
        ctx.save(); ctx.globalAlpha = oa * pa; ctx.font = `italic 400 28px ${SERIF}`; ctx.fillStyle = COL.coralHi;
        ctx.fillText('outside U', s[0] + 18, s[1] + 8); ctx.restore();
      }
      poly3(ctx, cam, circle3(cam, px, py, 0, a, 0, TAU, 64)); ctx.fillStyle = rgba(COL.coral, .2 * pa); ctx.fill();
      glowStroke(ctx, COL.coral, 2.5, 10, pa);
      const b = .8 + t * .4, e = cam.project(px + a * Math.cos(b), py + a * Math.sin(b), 0), c0 = cam.project(px, py, 0);
      if (t < 5.4) {
        ctx.save(); ctx.globalAlpha = pa * (1 - seg(t, 4.6, 5.2)); ctx.strokeStyle = COL.peach; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(c0[0], c0[1]); ctx.lineTo(e[0], e[1]); ctx.stroke();
        ctx.font = `italic 400 26px ${SERIF}`; ctx.fillStyle = COL.peach; ctx.fillText('a', (c0[0] + e[0]) / 2 + 8, (c0[1] + e[1]) / 2 - 8); ctx.restore();
      }
      dot(ctx, c0[0], c0[1], 7, '#fff', pa, 18);
      ctx.save(); ctx.globalAlpha = pa; ctx.font = `italic 400 30px ${SERIF}`; ctx.fillStyle = COL.ink; ctx.fillText('P', c0[0] - 30, c0[1] - 14); ctx.restore();
      if (t < this.dur) READOUT = t < 5.1 ? `‖P‖ = ${rho.toFixed(3)}     a = ${a.toFixed(3)}` : '‖P‖ = 2.000     every ball leaves U';
    }
    capTag(ctx, t, '§1.4   OPEN SETS', .5, 8.3);
    capTitle(ctx, t, 'Room around\nevery point', .7, 8.3);
    texIn(ctx, '\\|X - P\\| < a \\;\\Rightarrow\\; X \\in U', LX, 590, 46, t, 1.3, 4.9);
    para(ctx, 'U is the open disc x² + y² < 4. Push P toward the edge: its ball shrinks, but it never disappears.', LX, 680, t, 2.2, 4.9);
    texIn(ctx, 'x^2 + y^2 \\le 4', LX, 590, 50, t, 5.3, 8.3);
    para(ctx, 'Add the boundary circle and it fails. At a point on the edge, every ball pokes outside: the closed disc is not open.', LX, 680, t, 5.9, 8.3);
  }
};

/* =====================================================================
   SCENE 1.5 : partial derivatives
   ===================================================================== */
const hillZ = (x, y) => ZS * FN.hill(x, y);
function hillSurface(ctx, cam, grow = 1, edge = .16) {
  surface(ctx, cam, {
    param: rectP(-2, 2), nu: 32, nv: 32, clo: -.1, chi: 2.2, edge,
    z: grow >= 1 ? hillZ : (x, y) => { const r = Math.hypot(x, y); return hillZ(x, y) * E.outBack(seg(grow * 2.6, .18 * r, .18 * r + 1)); }
  });
}
function tangentSeg(ctx, cam, p, dir, L, color, alpha) {
  const n = Math.hypot(...dir), d = dir.map(v => v / n * L);
  poly3(ctx, cam, [[p[0] - d[0], p[1] - d[1], p[2] - d[2]], [p[0] + d[0], p[1] + d[1], p[2] + d[2]]]);
  glowStroke(ctx, color, 3.5, 16, alpha);
}
const S_PART = {
  start: 51, dur: 12, tail: .7, label: '§1.5  PARTIAL DERIVATIVES',
  draw(ctx, t, cam) {
    const live = t < this.dur, fade = 1 - seg(t, this.dur, this.dur + .6);
    if (live) hillSurface(ctx, cam, seg(t, .2, 2.0));
    const P3 = [PNT[0], PNT[1], hillZ(...PNT)];
    /* cyan plane: y fixed */
    const yp = lerp(-2.5, PNT[1], E.inOut(seg(t, 1.6, 2.8)));
    const pa1 = seg(t, 1.6, 1.9) * (1 - .85 * seg(t, 5.4, 6.0)) * fade;
    if (pa1 > 0) {
      poly3(ctx, cam, [[-2.2, yp, -.2], [2.2, yp, -.2], [2.2, yp, 2.6], [-2.2, yp, 2.6]], true);
      ctx.fillStyle = rgba(COL.cyan, .09 * pa1); ctx.fill(); ctx.strokeStyle = rgba(COL.cyan, .5 * pa1); ctx.lineWidth = 1.4; ctx.stroke();
    }
    const ca1 = seg(t, 1.7, 2.0) * (1 - .45 * seg(t, 5.4, 6.0)) * fade;
    if (ca1 > 0) {
      const pts = []; for (let i = 0; i <= 80; i++) { const x = -2 + 4 * i / 80; pts.push([x, yp, hillZ(x, yp)]); }
      poly3(ctx, cam, pts); glowStroke(ctx, COL.cyanHi, 3.5, 16, ca1);
    }
    const xm = lerp(-1.9, PNT[0], E.inOut(seg(t, 3.0, 4.4)));
    const ta1 = seg(t, 3.0, 3.3) * fade;
    if (ta1 > 0) {
      const p = [xm, PNT[1], hillZ(xm, PNT[1])];
      tangentSeg(ctx, cam, p, [1, 0, ZS * FN.hx(xm, PNT[1])], .95, COL.cyanHi, ta1);
      const s = cam.project(...p); dot(ctx, s[0], s[1], 7, '#fff', ta1, 16);
      tex3(ctx, cam, [p[0] + .95, p[1], p[2] + ZS * FN.hx(xm, PNT[1]) * .95], `\\frac{\\partial f}{\\partial x} = ${fmt(FN.hx(xm, PNT[1]))}`, 30, { color: COL.cyanHi, alpha: ta1 * (1 - .6 * seg(t, 5.4, 6)), dx: 14, dy: -6, caret: false });
    }
    /* coral plane: x fixed */
    const xp = lerp(2.5, PNT[0], E.inOut(seg(t, 5.8, 7.0)));
    const pa2 = seg(t, 5.8, 6.1) * (1 - .85 * seg(t, 9.2, 9.8)) * fade;
    if (pa2 > 0) {
      poly3(ctx, cam, [[xp, -2.2, -.2], [xp, 2.2, -.2], [xp, 2.2, 2.6], [xp, -2.2, 2.6]], true);
      ctx.fillStyle = rgba(COL.coral, .09 * pa2); ctx.fill(); ctx.strokeStyle = rgba(COL.coral, .55 * pa2); ctx.lineWidth = 1.4; ctx.stroke();
    }
    const ca2 = seg(t, 5.9, 6.2) * (1 - .45 * seg(t, 9.2, 9.8)) * fade;
    if (ca2 > 0) {
      const pts = []; for (let i = 0; i <= 80; i++) { const y = -2 + 4 * i / 80; pts.push([xp, y, hillZ(xp, y)]); }
      poly3(ctx, cam, pts); glowStroke(ctx, COL.coralHi, 3.5, 16, ca2);
    }
    const ym = lerp(-1.8, PNT[1], E.inOut(seg(t, 7.2, 8.6)));
    const ta2 = seg(t, 7.2, 7.5) * fade;
    if (ta2 > 0) {
      const p = [PNT[0], ym, hillZ(PNT[0], ym)];
      tangentSeg(ctx, cam, p, [0, 1, ZS * FN.hy(PNT[0], ym)], .95, COL.coralHi, ta2);
      const s = cam.project(...p); dot(ctx, s[0], s[1], 7, '#fff', ta2, 16);
      tex3(ctx, cam, [p[0], p[1] - .95, p[2] - ZS * FN.hy(PNT[0], ym) * .95], `\\frac{\\partial f}{\\partial y} = ${fmt(FN.hy(PNT[0], ym))}`, 30, { color: COL.coralHi, alpha: ta2, dx: -200, dy: 40, caret: false });
    }
    /* tangent plane spanned by the two slopes */
    const tp = seg(t, 9.0, 9.8) * fade;
    if (tp > 0) {
      const t1 = [1, 0, ZS * fxP], t2 = [0, 1, ZS * fyP], k = .95;
      const c = (a, b) => [P3[0] + a * t1[0] + b * t2[0], P3[1] + a * t1[1] + b * t2[1], P3[2] + a * t1[2] + b * t2[2]];
      poly3(ctx, cam, [c(-k, -k), c(k, -k), c(k, k), c(-k, k)], true);
      ctx.fillStyle = rgba(COL.lav, .26 * tp); ctx.fill(); ctx.strokeStyle = rgba(COL.ink, .7 * tp); ctx.lineWidth = 1.5; ctx.stroke();
      const s = cam.project(...P3); dot(ctx, s[0], s[1], 8, '#fff', tp, 20);
    }
    capTag(ctx, t, '§1.5   PARTIAL DERIVATIVES', .5, 11.2);
    capTitle(ctx, t, 'Freeze one variable', .7, 11.2);
    texIn(ctx, '\\frac{\\partial f}{\\partial x}(x, y) = \\lim_{h \\to 0} \\frac{f(x + h, y) - f(x, y)}{h}', LX, 530, 38, t, 2.4, 5.6, { color: COL.ink });
    para(ctx, 'Hold y fixed and the surface becomes a curve. Its slope is the partial derivative in x.', LX, 650, t, 3.0, 5.6);
    texIn(ctx, '\\frac{\\partial f}{\\partial y}(x, y) = \\lim_{h \\to 0} \\frac{f(x, y + h) - f(x, y)}{h}', LX, 530, 38, t, 6.4, 8.9);
    para(ctx, 'Hold x fixed instead. The slope of this new curve is the partial derivative in y.', LX, 650, t, 7.0, 8.9);
    texIn(ctx, '\\left( \\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y} \\right) = (0.84, -0.81)', LX, 530, 40, t, 9.4, 11.2);
    para(ctx, 'Two slopes at the same point P. Together they span a plane.', LX, 650, t, 9.8, 11.2);
    if (live) {
      if (t < 3.0) READOUT = 'f(x, y) = 3.4 − 0.3x² − 0.45y² + 0.3x';
      else if (t < 7.2) READOUT = `∂f/∂x (${fmt(xm)}, 0.90) = ${fmt(FN.hx(xm, PNT[1]))}`;
      else if (t < 9.2) READOUT = `∂f/∂y (−0.90, ${fmt(ym)}) = ${fmt(FN.hy(PNT[0], ym))}`;
      else READOUT = 'P = (−0.90, 0.90)     f(P) = 2.52';
    }
  }
};

/* =====================================================================
   SCENE 1.6 : the gradient
   ===================================================================== */
const HIKE = (() => {
  const pts = []; let x = -1.85, y = 1.75;
  for (let i = 0; i < 600; i++) {
    pts.push([x, y]);
    const gx = FN.hx(x, y), gy = FN.hy(x, y), n = Math.hypot(gx, gy);
    if (n < .012) break;
    const st = Math.min(.022, n * .05);
    x += st * gx / n; y += st * gy / n;
  }
  return pts;
})();
const PEAK = [.5, 0];
const S_GRAD = {
  start: 63, dur: 9, tail: .01, label: '§1.6  THE GRADIENT',
  draw(ctx, t, cam) {
    hillSurface(ctx, cam, 1, .1);
    const la = seg(t, .8, 1.6);
    if (la > 0) {
      for (const c of [.5, 1, 1.5, 2, 2.5, 3, 3.3]) {
        strokeSegs(ctx, cam, contourSegs(FN.hill, -2, 2, -2, 2, 52, c), () => ZS * c + .01);
        ctx.strokeStyle = rgba(COL.ink, .55 * la); ctx.lineWidth = 1.5; ctx.stroke();
      }
    }
    const fieldA = 1 - .45 * seg(t, 4.0, 4.6);
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) {
      const x = -1.6 + .4 * i, y = -1.6 + .4 * j, r = Math.hypot(x, y);
      const g = E.out(seg(t, 1.8 + .45 * r / 2.3, 2.6 + .45 * r / 2.3));
      if (g <= 0) continue;
      const gx = FN.hx(x, y), gy = FN.hy(x, y), k = .3 * g;
      if (Math.hypot(gx, gy) < .05) continue;
      const x1 = x + k * gx, y1 = y + k * gy;
      arrow3(ctx, cam, [x, y, hillZ(x, y) + .02], [x1, y1, hillZ(x1, y1) + .02], COL.ink, 2.4, 12, .92 * fieldA);
    }
    const hp = E.inOut(seg(t, 4.0, 7.4));
    if (hp > 0) {
      const n = Math.max(1, Math.floor(hp * (HIKE.length - 1)));
      poly3(ctx, cam, HIKE.slice(0, n + 1).map(([x, y]) => [x, y, hillZ(x, y) + .03]));
      glowStroke(ctx, COL.coral, 4.5, 20);
      const [hx, hy] = HIKE[n], s = cam.project(hx, hy, hillZ(hx, hy) + .03);
      dot(ctx, s[0], s[1], 9, '#fff', 1, 26);
      if (t < this.dur) { const gx = FN.hx(hx, hy), gy = FN.hy(hx, hy); READOUT = `∇f = (${fmt(gx)}, ${fmt(gy)})     ‖∇f‖ = ${Math.hypot(gx, gy).toFixed(2)}`; }
      const pk = seg(t, 7.3, 8.2);
      if (pk > 0) {
        const ps = cam.project(PEAK[0], PEAK[1], hillZ(...PEAK));
        ctx.save(); ctx.globalAlpha = (1 - pk) * .9; ctx.strokeStyle = COL.peach; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(ps[0], ps[1], 10 + 70 * pk, 0, TAU); ctx.stroke(); ctx.restore();
        tex(ctx, '\\nabla f = 0', ps[0] + 24, ps[1] - 26, 34, { color: COL.peach, alpha: seg(t, 7.4, 7.8) * (1 - seg(t, 8.5, 9)), caret: false });
      }
    } else if (t < this.dur) READOUT = '∇f = (−0.6x + 0.3,  −0.9y)';
    capTag(ctx, t, '§1.6   THE GRADIENT', .5, 8.4);
    capTitle(ctx, t, 'The arrow of\nsteepest climb', .7, 8.4);
    texIn(ctx, '\\nabla f = \\left( \\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y} \\right)', LX, 595, 50, t, 1.3, 8.4);
    para(ctx, 'At every point it crosses the level curve at a right angle and points uphill.', LX, 705, t, 2.2, 4.0);
    para(ctx, 'Follow the arrows and you climb by the steepest route, until the gradient vanishes at the top.', LX, 705, t, 4.3, 8.4);
  }
};

/* =====================================================================
   SCENE 1.7 : differentiability, the zoom test
   ===================================================================== */
function zoomGrid(ctx, cam, cx, cy, w, z, alpha, labels = true) {
  if (alpha <= 0) return;
  const e = Math.log10(w / 4), fl = Math.floor(e), fr = e - fl;
  const levels = [[Math.pow(10, fl), 1 - fr], [Math.pow(10, fl + 1), 1]];
  ctx.save(); ctx.lineWidth = 1;
  for (const [s, aw] of levels) {
    const k0 = Math.ceil((cx - w) / s), k1 = Math.floor((cx + w) / s);
    for (let k = k0; k <= k1 && k - k0 < 400; k++) {
      const X = (k * s - cx) * 2 / w;
      ctx.strokeStyle = rgba('#B9B4E0', .2 * aw * alpha);
      poly3(ctx, cam, [[X, -2, z], [X, 2, z]]); ctx.stroke();
    }
    const j0 = Math.ceil((cy - w) / s), j1 = Math.floor((cy + w) / s);
    for (let k = j0; k <= j1 && k - j0 < 400; k++) {
      const Y = (k * s - cy) * 2 / w;
      ctx.strokeStyle = rgba('#B9B4E0', .2 * aw * alpha);
      poly3(ctx, cam, [[-2, Y, z], [2, Y, z]]); ctx.stroke();
    }
    if (labels && aw === 1) {
      const dec = Math.max(0, -Math.floor(Math.log10(s) + 1e-9));
      ctx.font = `400 17px ${MONO}`; ctx.fillStyle = rgba(COL.lav, .75 * alpha); ctx.textAlign = 'center';
      for (let k = k0; k <= k1; k++) {
        const X = (k * s - cx) * 2 / w, sc = cam.project(X, -2.25, z);
        ctx.fillText((k * s).toFixed(dec).replace('-', '−'), sc[0], sc[1] + 6);
      }
    }
  }
  ctx.restore();
}
function glitch(ctx, t, amt) {
  if (amt <= 0) return;
  const f = Math.floor(t * 30), cv = ctx.canvas;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let k = 0; k < 12; k++) {
    const y = Math.floor(hash(k * 13.1 + f) * cv.height), h = Math.floor((8 + hash(k * 7.7 + f * .3) * 70) * S);
    const dx = (hash(k * 3.3 + f * 1.7) - .5) * 220 * amt * S;
    ctx.drawImage(cv, 0, y, cv.width, h, dx, y, cv.width, h);
  }
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rgba(COL.coral, .14 * amt); ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.restore();
}
const S_DIFF = {
  start: 72, dur: 14, tail: .9, label: '§1.7  DIFFERENTIABILITY',
  draw(ctx, t, cam) {
    const live = t < this.dur;
    /* ---- part A: a differentiable surface melts into its tangent plane ---- */
    if (t < 7.35) {
      const cm = E.inOut(seg(t, 1.8, 2.8));
      const cx = PNT[0] * cm, cy = PNT[1] * cm;
      const w = 2 * Math.pow(.025 / 2, E.inOut(seg(t, 2.8, 6.6)));
      const fc = FN.hill(cx, cy);
      const toX = (X) => cx + X * w / 2, toY = (Y) => cy + Y * w / 2;
      const Zd = (X, Y) => ZS * fc + ZS * (FN.hill(toX(X), toY(Y)) - fc) * (2 / w);
      zoomGrid(ctx, cam, cx, cy, w, 0, seg(t, .3, 1.0));
      surface(ctx, cam, { param: rectP(-2, 2), nu: 30, nv: 30, z: Zd, clo: -.1, chi: 2.2, edge: .16 });
      const Pd = [(PNT[0] - cx) * 2 / w, (PNT[1] - cy) * 2 / w];
      const Zp = (X, Y) => ZS * fc + (2 / w) * ZS * (fP + fxP * (toX(X) - PNT[0]) + fyP * (toY(Y) - PNT[1]) - fc);
      const tpa = seg(t, .6, 1.4);
      if (tpa > 0) {
        const k = 1.15, q = [[-k, -k], [k, -k], [k, k], [-k, k]].map(([a, b]) => [Pd[0] + a, Pd[1] + b, Zp(Pd[0] + a, Pd[1] + b)]);
        poly3(ctx, cam, q, true); ctx.fillStyle = rgba(COL.cyan, .2 * tpa); ctx.fill();
        ctx.strokeStyle = rgba(COL.cyanHi, .85 * tpa); ctx.lineWidth = 2; ctx.stroke();
        const s = cam.project(Pd[0], Pd[1], Zd(Pd[0], Pd[1])); dot(ctx, s[0], s[1], 8, COL.coral, tpa, 22);
        label3(ctx, cam, [Pd[0], Pd[1], Zd(Pd[0], Pd[1])], 'P', { dx: -34, dy: -12, size: 32, alpha: tpa });
      }
      if (live) {
        let err = 0;
        for (let k = 0; k < 24; k++) { const a = TAU * k / 24, h = w * Math.cos(a), kk = w * Math.sin(a); err = Math.max(err, Math.abs(FN.hill(PNT[0] + h, PNT[1] + kk) - fP - fxP * h - fyP * kk) / w); }
        READOUT = t < 2.8 ? 'tangent plane at P:   z = f(P) + ∇f(P) · H' : `zoom ×${(2 / w).toFixed(1)}     |g(H)| ≤ ${err.toFixed(3)}`;
      }
    }
    /* ---- part B: f = xy / (x² + y²) never flattens ---- */
    if (t >= 7.3) {
      const pa = seg(t, 7.3, 8.0) * (1 - seg(t, this.dur, this.dur + .8));
      const w2 = 2 * Math.pow(1e-3, E.inOut(seg(t, 10.6, 13.4)));
      zoomGrid(ctx, cam, 0, 0, w2, -.95, pa, false);
      withLayer(ctx, pa, c => surface(c, cam, {
        param: (u, v) => { const r = .012 + 1.988 * u, th = TAU * v; return [r * Math.cos(th), r * Math.sin(th)]; },
        nu: 24, nv: 80, z: (x, y) => 1.4 * FN.pin(x, y), clo: -.75, chi: .75, edge: .14
      }));
      const xa = E.inOut(seg(t, 8.7, 9.6)) * pa, ya = E.inOut(seg(t, 9.0, 9.9)) * pa;
      if (xa > 0) { poly3(ctx, cam, [[-2.05 * xa, 0, 0], [2.05 * xa, 0, 0]]); glowStroke(ctx, COL.cyanHi, 4, 18, pa); }
      if (ya > 0) { poly3(ctx, cam, [[0, -2.05 * ya, 0], [0, 2.05 * ya, 0]]); glowStroke(ctx, COL.coralHi, 4, 18, pa); }
      label3(ctx, cam, [2.1, 0, 0], 'f = 0', { size: 28, color: COL.cyanHi, alpha: seg(t, 9.4, 9.8) * pa });
      label3(ctx, cam, [0, 2.1, 0], 'f = 0', { size: 28, color: COL.coralHi, alpha: seg(t, 9.7, 10.1) * pa });
      const sp = seg(t, 11.2, 11.8) * pa;
      if (sp > 0) {
        poly3(ctx, cam, [[0, 0, -.7], [0, 0, .7]]); glowStroke(ctx, COL.peach, 4, 24, sp * (.75 + .25 * Math.sin(t * 8)));
        label3(ctx, cam, [0, 0, .72], 'every value from −½ to ½', { dx: 16, dy: -10, size: 26, color: COL.peach, alpha: sp });
      }
      if (live && t > 7.6) READOUT = t < 10.6 ? 'f(r cos θ, r sin θ) = ½ sin 2θ' : `zoom ×${Math.round(2 / w2)}     max |f − 0| = 0.500`;
    }
    glitch(ctx, t, Math.sin(Math.PI * seg(t, 6.95, 7.75)));
    capTag(ctx, t, '§1.7   DIFFERENTIABILITY', .5, 13.2);
    capTitle(ctx, t, 'Zoom in until\nit turns flat', .7, 6.8);
    texIn(ctx, 'f(X + H) - f(X) = \\nabla f(X) \\cdot H + \\|H\\|\\, g(H)', LX, 590, 38, t, 1.3, 6.8);
    para(ctx, 'Differentiable means the leftover g(H) goes to 0. Zoom in on P and the surface melts into its tangent plane.', LX, 690, t, 2.4, 6.8);
    capTitle(ctx, t, 'When zooming fails', 7.8, 13.2);
    texIn(ctx, 'f(x, y) = \\frac{xy}{x^2 + y^2}, \\quad f(0, 0) = 0', LX, 520, 40, t, 8.3, 13.2);
    para(ctx, 'On both axes f = 0, so both partial derivatives at O exist and equal 0.', LX, 630, t, 8.9, 10.6);
    para(ctx, 'Zoom in and the picture never changes. Every value between −½ and ½ crowds into O, so f is not even continuous there. Not differentiable.', LX, 630, t, 10.8, 13.2);
  }
};

/* =====================================================================
   SCENE : outro, the whole lecture on one row
   ===================================================================== */
const CARDS = [
  ['1.1', 'Domain'], ['1.2', 'Graph'], ['1.3', 'Level curves'], ['1.4', 'Open sets'],
  ['1.5', 'Partials'], ['1.6', 'Gradient'], ['1.7', 'Differentiable']
];
function glyph(ctx, i, cx, cy, p, t) {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const L = COL.lav, C = COL.coral;
  switch (i) {
    case 0: {
      for (let a = -3; a <= 3; a++) for (let b = -2; b <= 2; b++) {
        const x = cx + a * 18, y = cy + b * 18, inside = a * a + b * b * 2.2 <= 8.5;
        dot(ctx, x, y, 3, inside ? L : C, p * (inside ? 1 : .8));
      }
      ctx.strokeStyle = rgba(L, .8 * p); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, 56, 40, 0, 0, TAU * p); ctx.stroke(); break;
    }
    case 1: {
      ctx.strokeStyle = rgba(L, .5 * p); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 60, cy + 40); ctx.lineTo(cx + 60, cy + 40); ctx.stroke();
      ctx.strokeStyle = C; ctx.lineWidth = 3; ctx.beginPath();
      for (let k = 0; k <= 40 * p; k++) { const x = -60 + 3 * k, y = 40 - 70 * Math.exp(-x * x / 1400); k ? ctx.lineTo(cx + x, cy + y) : ctx.moveTo(cx + x, cy + y); } ctx.stroke();
      const lift = .5 + .5 * Math.sin(t * 2.4); const yy = 40 - 70 * Math.exp(-400 / 1400) * lift;
      ctx.strokeStyle = rgba(COL.ink, .6 * p); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx + 20, cy + 40); ctx.lineTo(cx + 20, cy + yy); ctx.stroke();
      dot(ctx, cx + 20, cy + yy, 4.5, '#fff', p); break;
    }
    case 2: {
      [18, 30, 39, 46].forEach((r, k) => { ctx.strokeStyle = rgba([L, '#E7A6C9', C, COL.peach][k], p); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(cx, cy, r * (.9 + .1 * Math.sin(t * 2 + k)), 0, TAU * p); ctx.stroke(); });
      break;
    }
    case 3: {
      ctx.setLineDash([7, 6]); ctx.lineDashOffset = -t * 20; ctx.strokeStyle = rgba(L, p); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 48, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      const a = .9 + .3 * Math.sin(t), px = cx + 30 * Math.cos(a), py = cy + 30 * Math.sin(a);
      ctx.fillStyle = rgba(C, .25 * p); ctx.strokeStyle = rgba(C, p); ctx.beginPath(); ctx.arc(px, py, 14, 0, TAU); ctx.fill(); ctx.stroke();
      dot(ctx, px, py, 4, '#fff', p); break;
    }
    case 4: {
      ctx.strokeStyle = rgba(L, p); ctx.lineWidth = 2.5; ctx.beginPath();
      for (let k = 0; k <= 40; k++) { const x = -60 + 3 * k, y = 30 - .012 * (x + 70) * (x + 70); k ? ctx.lineTo(cx + x, cy + y) : ctx.moveTo(cx + x, cy + y); } ctx.stroke();
      const x0 = -10 + 25 * Math.sin(t * 1.3), y0 = 30 - .012 * (x0 + 70) ** 2, sl = -.024 * (x0 + 70);
      ctx.strokeStyle = rgba(COL.cyanHi, p); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx + x0 - 34, cy + y0 - 34 * sl); ctx.lineTo(cx + x0 + 34, cy + y0 + 34 * sl); ctx.stroke();
      dot(ctx, cx + x0, cy + y0, 4.5, '#fff', p); break;
    }
    case 5: {
      [16, 30, 44].forEach(r => { ctx.strokeStyle = rgba(L, .55 * p); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.3, r * .9, 0, 0, TAU); ctx.stroke(); });
      const a = t * .8, x = cx + 46 * Math.cos(a) * .95, y = cy + 32 * Math.sin(a) * .95;
      arrow2(ctx, x, y, x + (cx - x) * .45, y + (cy - y) * .45, C, 3, 11, p); break;
    }
    case 6: {
      const k = .5 + .5 * Math.sin(t * 1.5), s = 1 + 2.5 * k;
      ctx.strokeStyle = rgba(COL.cyanHi, p); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx - 60, cy + 25); ctx.lineTo(cx + 60, cy - 25); ctx.stroke();
      ctx.strokeStyle = rgba(C, p); ctx.lineWidth = 3; ctx.beginPath();
      for (let j = 0; j <= 40; j++) { const x = -60 + 3 * j, y = -x * 25 / 60 - .012 * x * x / s; j ? ctx.lineTo(cx + x, cy + y) : ctx.moveTo(cx + x, cy + y); } ctx.stroke();
      dot(ctx, cx, cy, 4.5, '#fff', p); break;
    }
  }
  ctx.restore();
}
const S_OUTRO = {
  start: 86, dur: 8, tail: 0, label: 'SUMMARY',
  draw(ctx, t) {
    const cw = 212, gap = 18, x0 = (W - (7 * cw + 6 * gap)) / 2, top = 286, ch = 248;
    const up = E.inOut(seg(t, 4.2, 5.0));
    for (let i = 0; i < 7; i++) {
      const ap = E.out(seg(t, .5 + i * .16, 1.25 + i * .16));
      if (ap <= 0) continue;
      const x = x0 + i * (cw + gap), y = top + (1 - ap) * 46 - up * 60;
      ctx.save(); ctx.globalAlpha = ap * (1 - .25 * up);
      ctx.fillStyle = 'rgba(30,24,56,0.55)'; ctx.fillRect(x, y, cw, ch);
      ctx.strokeStyle = rgba(COL.lav, .75); ctx.lineWidth = 2;
      const L = 20; ctx.beginPath();
      ctx.moveTo(x, y + L); ctx.lineTo(x, y); ctx.lineTo(x + L, y);
      ctx.moveTo(x + cw - L, y); ctx.lineTo(x + cw, y); ctx.lineTo(x + cw, y + L);
      ctx.moveTo(x, y + ch - L); ctx.lineTo(x, y + ch); ctx.lineTo(x + L, y + ch);
      ctx.moveTo(x + cw - L, y + ch); ctx.lineTo(x + cw, y + ch); ctx.lineTo(x + cw, y + ch - L); ctx.stroke();
      ctx.font = `400 19px ${MONO}`; ctx.fillStyle = COL.coral; ctx.fillText(CARDS[i][0], x + 18, y + 36);
      ctx.font = `400 29px ${SERIF}`; ctx.fillStyle = COL.ink; ctx.fillText(CARDS[i][1], x + 18, y + ch - 24);
      glyph(ctx, i, x + cw / 2, y + 118, E.inOut(seg(t, .8 + i * .16, 1.8 + i * .16)), t);
      ctx.restore();
    }
    kText(ctx, 'Near a point, a smooth function looks like a plane.', W / 2, 690, t, { font: `italic 400 54px ${SERIF}`, t0: 4.5, align: 'center', stag: .02, dur: .8, rise: 30 });
    kText(ctx, 'AMATH301   ·   LECTURE I   ·   TAHA CHNIBER', W / 2, 780, t, { font: `400 20px ${MONO}`, color: 'rgba(245,238,246,0.6)', t0: 5.4, align: 'center', track: 6, stag: .01, rise: 10 });
    kText(ctx, 'NEXT   →   THE CHAIN RULE', W / 2, 826, t, { font: `400 20px ${MONO}`, color: COL.coral, t0: 6.0, align: 'center', track: 6, stag: .012, rise: 10 });
    if (t < this.dur) READOUT = 'seven ideas, one picture';
  }
};

const SCENES = [S_INTRO, S_DOMAIN, S_GRAPH, S_LEVEL, S_OPEN, S_PART, S_GRAD, S_DIFF, S_OUTRO];
const CHAPTERS = SCENES.map(s => ({ t: s.start, label: s.label }));

/* =====================================================================
   background, HUD, grain, frame
   ===================================================================== */
let BG = null; const GRAIN = [];
function buildStatic() {
  BG = document.createElement('canvas'); BG.width = W; BG.height = H;
  const g = BG.getContext('2d');
  const rg = g.createRadialGradient(W * .6, H * .48, 40, W * .55, H * .5, W * .78);
  rg.addColorStop(0, '#271F47'); rg.addColorStop(.5, '#19142F'); rg.addColorStop(1, '#0C0A1A');
  g.fillStyle = rg; g.fillRect(0, 0, W, H);
  g.lineWidth = 1;
  for (let x = 0; x <= W; x += 48) { g.strokeStyle = (x / 48) % 5 === 0 ? 'rgba(190,185,240,0.065)' : 'rgba(190,185,240,0.03)'; g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, H); g.stroke(); }
  for (let y = 12; y <= H; y += 48) { g.strokeStyle = ((y - 12) / 48) % 5 === 0 ? 'rgba(190,185,240,0.065)' : 'rgba(190,185,240,0.03)'; g.beginPath(); g.moveTo(0, y + .5); g.lineTo(W, y + .5); g.stroke(); }
  const vg = g.createRadialGradient(W / 2, H / 2, H * .42, W / 2, H / 2, W * .72);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 4; k++) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const cg = c.getContext('2d'), im = cg.createImageData(256, 256);
    let s = 1234 + k * 999;
    for (let i = 0; i < im.data.length; i += 4) {
      s = (s * 16807) % 2147483647; const v = s % 255; const w = v > 127 ? 255 : 0;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = w; im.data[i + 3] = (s >> 3) % 15;
    }
    cg.putImageData(im, 0, 0); GRAIN.push(c);
  }
  LAYER = document.createElement('canvas');
}
function ensureLayer(cv) {
  if (LAYER.width !== cv.width || LAYER.height !== cv.height) { LAYER.width = cv.width; LAYER.height = cv.height; LCTX = LAYER.getContext('2d'); }
  LCTX.setTransform(S, 0, 0, S, 0, 0);
}

function sceneLabelAt(T) { let lab = SCENES[0].label, st = 0; for (const s of SCENES) if (T >= s.start) { lab = s.label; st = s.start; } return [lab, st]; }
function hud(ctx, T) {
  const m = 54, L = 34, a = E.out(seg(T, .2, 1.3));
  ctx.save();
  ctx.strokeStyle = rgba(COL.lav, .5); ctx.lineWidth = 2;
  const l = L * a;
  ctx.beginPath();
  ctx.moveTo(m, m + l); ctx.lineTo(m, m); ctx.lineTo(m + l, m);
  ctx.moveTo(W - m - l, m); ctx.lineTo(W - m, m); ctx.lineTo(W - m, m + l);
  ctx.moveTo(m, H - m - l); ctx.lineTo(m, H - m); ctx.lineTo(m + l, H - m);
  ctx.moveTo(W - m - l, H - m); ctx.lineTo(W - m, H - m); ctx.lineTo(W - m, H - m - l);
  ctx.stroke();
  ctx.globalAlpha = a;
  ctx.font = `400 19px ${MONO}`; ctx.letterSpacing = '5px';
  ctx.fillStyle = 'rgba(245,238,246,0.5)'; ctx.fillText('AMATH301 / MULTIVARIATE CALCULUS', m + 24, m + 30);
  const [lab, st] = sceneLabelAt(T);
  const la = E.out(seg(T, st, st + .6));
  ctx.textAlign = 'right'; ctx.fillStyle = rgba(COL.coral, .95 * la);
  ctx.fillText(lab, W - m - 24 + (1 - la) * 20, m + 30);
  const mm = Math.floor(T / 60), ss = Math.floor(T % 60), ff = Math.floor((T % 1) * FPS);
  ctx.fillStyle = 'rgba(245,238,246,0.45)';
  ctx.fillText(`${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}:${String(ff).padStart(2, '0')}  /  01:34`, W - m - 24, H - m - 20);
  ctx.textAlign = 'left'; ctx.letterSpacing = '2px'; ctx.font = `400 21px ${MONO}`;
  ctx.fillStyle = 'rgba(245,238,246,0.75)'; ctx.fillText(READOUT, m + 24, H - m - 20);
  ctx.letterSpacing = '0px';
  const x0 = m + L + 18, x1 = W - m - L - 18, yb = H - m;
  ctx.fillStyle = 'rgba(203,178,218,0.18)'; ctx.fillRect(x0, yb - 1, x1 - x0, 2);
  ctx.fillStyle = COL.coral; ctx.fillRect(x0, yb - 1, (x1 - x0) * clamp(T / DUR), 2);
  for (const s of SCENES) { const x = x0 + (x1 - x0) * s.start / DUR; ctx.fillStyle = 'rgba(203,178,218,0.55)'; ctx.fillRect(x - 1, yb - 6, 2, 12); }
  ctx.restore();
}
function grain(ctx, T) {
  const f = Math.floor(T * FPS), tile = GRAIN[f % GRAIN.length];
  const pat = ctx.createPattern(tile, 'repeat');
  ctx.save(); ctx.globalAlpha = .9;
  ctx.translate(-Math.floor(hash(f) * 256), -Math.floor(hash(f + .5) * 256));
  ctx.fillStyle = pat; ctx.fillRect(0, 0, W + 256, H + 256);
  ctx.restore();
}

function frame(ctx, T) {
  ensureLayer(ctx.canvas);
  ctx.setTransform(S, 0, 0, S, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.shadowBlur = 0;
  ctx.drawImage(BG, 0, 0, W, H);
  const cam = camTrack(CAMKEYS, T);
  READOUT = '';
  const fz = track(FLOOR_Z, T);
  floorGrid(ctx, cam, { alpha: track(GRID_A, T) * (T < 8 ? 0 : 1), z: fz });
  axes3(ctx, cam, { alpha: track(AXES_A, T), labels: true });
  const active = SCENES.filter(s => T >= s.start && T < s.start + s.dur + (s.tail ?? 0));
  active.sort((a, b) => b.start - a.start);
  for (const s of active) { ctx.save(); s.draw(ctx, T - s.start, cam, T); ctx.restore(); }
  hud(ctx, T);
  grain(ctx, T);
  const fa = Math.max(1 - seg(T, 0, .8), seg(T, DUR - 1.1, DUR - .05));
  if (fa > 0) { ctx.fillStyle = `rgba(10,8,20,${fa})`; ctx.fillRect(0, 0, W, H); }
}
