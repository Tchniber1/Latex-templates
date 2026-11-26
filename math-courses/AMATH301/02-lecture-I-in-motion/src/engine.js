'use strict';
/* =====================================================================
   Lecture I in Motion : engine
   A deterministic renderer: frame(T) draws the whole picture for time T.
   ===================================================================== */
const W = 1920, H = 1080, FPS = 30, D2R = Math.PI / 180, TAU = Math.PI * 2;

const COL = {
  night: '#14112A', ink: '#F5EEF6', plum: '#5B2A5E', plumMid: '#8E4C91',
  lav: '#CBB2DA', coral: '#EE6A55', coralHi: '#FF8D74', peach: '#FFC7A8',
  cyan: '#46BDE6', cyanHi: '#8FDcF5'
};
const SERIF = '"Pagella", "LMMath", Georgia, serif';
const MONO = '"LMMono", "LMMath", ui-monospace, monospace';

/* ---------- small math helpers ---------- */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  outExpo: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
  outBack: t => { const c1 = 1.6, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  smooth: t => t * t * (3 - 2 * t)
};
/* fade in over [a,a+d], out over [b,b+d] */
const fio = (t, a, b, d = .5) => Math.min(E.out(seg(t, a, a + d)), 1 - E.inOut(seg(t, b, b + d)));

function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgba(h, a) { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; }
function mixHex(h1, h2, t) { const a = hexRgb(h1), b = hexRgb(h2); return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`; }

const CMAP = [[66, 28, 78], [112, 50, 120], [176, 74, 116], [232, 102, 86], [255, 162, 124], [255, 214, 192]];
function cmap(t) {
  t = clamp(t) * (CMAP.length - 1);
  const i = Math.min(CMAP.length - 2, Math.floor(t)), f = t - i;
  return [0, 1, 2].map(k => CMAP[i][k] + (CMAP[i + 1][k] - CMAP[i][k]) * f);
}

/* deterministic pseudo random */
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

/* ---------- camera ---------- */
const CAM_DEFAULT = { yaw: 0, pitch: 0, dist: 12, F: 2300, tx: 0, ty: 0, tz: .8, cx: W * .62, cy: H * .56 };
function makeCam(o) {
  const c = { ...CAM_DEFAULT, ...o };
  const cyw = Math.cos(c.yaw * D2R), syw = Math.sin(c.yaw * D2R);
  const cp = Math.cos(c.pitch * D2R), sp = Math.sin(c.pitch * D2R);
  c.project = (x, y, z) => {
    x -= c.tx; y -= c.ty; z -= c.tz;
    const x1 = x * cyw - y * syw, y1 = x * syw + y * cyw;
    const vy = y1 * sp + z * cp, vz = y1 * cp - z * sp + c.dist;
    const s = c.F / vz;
    return [c.cx + x1 * s, c.cy - vy * s, vz];
  };
  return c;
}
/* camera keyframe track: [[T, {fields}], ...] */
function camTrack(keys, T) {
  if (T <= keys[0][0]) return makeCam(keys[0][1]);
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i], [t1, b] = keys[i + 1];
    if (T <= t1) {
      const e = E.inOut(seg(T, t0, t1));
      const o = {};
      for (const k of Object.keys(CAM_DEFAULT)) {
        const va = a[k] ?? CAM_DEFAULT[k], vb = b[k] ?? CAM_DEFAULT[k];
        o[k] = lerp(va, vb, e);
      }
      return makeCam(o);
    }
  }
  return makeCam(keys[keys.length - 1][1]);
}

/* ---------- 3D drawing ---------- */
const LIGHT = (() => { const v = [-.45, -.55, .7]; const n = Math.hypot(...v); return v.map(x => x / n); })();

/* surface: param(u,v)->[x,y]; z(x,y)->world z (NaN to skip) */
function surface(ctx, cam, o) {
  const nu = o.nu || 30, nv = o.nv || 30;
  const zf = o.z, param = o.param;
  const clo = o.clo ?? 0, chi = o.chi ?? 2.4;
  const edge = o.edge ?? .2;
  const P = new Array((nu + 1) * (nv + 1));
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    const [x, y] = param(i / nu, j / nv);
    const z = zf(x, y);
    const s = cam.project(x, y, isFinite(z) ? z : 0);
    P[i * (nv + 1) + j] = [x, y, z, s[0], s[1], s[2]];
  }
  const Q = [];
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = P[i * (nv + 1) + j], b = P[(i + 1) * (nv + 1) + j], c = P[(i + 1) * (nv + 1) + j + 1], d = P[i * (nv + 1) + j + 1];
    if (!isFinite(a[2]) || !isFinite(b[2]) || !isFinite(c[2]) || !isFinite(d[2])) continue;
    const ux = c[0] - a[0], uy = c[1] - a[1], uz = c[2] - a[2];
    const vx = d[0] - b[0], vy = d[1] - b[1], vz = d[2] - b[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const nn = Math.hypot(nx, ny, nz) || 1; nx /= nn; ny /= nn; nz /= nn;
    const lam = Math.abs(nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
    const zm = (a[2] + b[2] + c[2] + d[2]) / 4;
    const tcol = o.colorT ? o.colorT((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, zm) : (zm - clo) / (chi - clo);
    const base = cmap(tcol);
    const sh = .55 + .45 * lam;
    const col = base.map(v => Math.round(Math.min(255, v * sh + 14 * lam)));
    Q.push([(a[5] + b[5] + c[5] + d[5]) / 4, a, b, c, d, col]);
  }
  Q.sort((p, q) => q[0] - p[0]);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1;
  const er = o.edgeColor || [255, 232, 244];
  for (const [, a, b, c, d, col] of Q) {
    ctx.beginPath();
    ctx.moveTo(a[3], a[4]); ctx.lineTo(b[3], b[4]); ctx.lineTo(c[3], c[4]); ctx.lineTo(d[3], d[4]); ctx.closePath();
    const cs = `rgb(${col[0]},${col[1]},${col[2]})`;
    ctx.fillStyle = cs; ctx.fill();
    ctx.strokeStyle = edge > 0 ? `rgba(${er[0]},${er[1]},${er[2]},${edge})` : cs;
    ctx.stroke();
  }
}

function poly3(ctx, cam, pts, close = false) {
  ctx.beginPath();
  pts.forEach((p, i) => { const s = cam.project(p[0], p[1], p[2]); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); });
  if (close) ctx.closePath();
}
function glowStroke(ctx, color, width, glow = 18, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.shadowColor = color; ctx.shadowBlur = glow;
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();
}
function circle3(cam, cx, cy, z, r, a0 = 0, a1 = TAU, n = 96) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const t = a0 + (a1 - a0) * i / n; pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t), z]); }
  return pts;
}
function arrow2(ctx, x0, y0, x1, y1, color, width = 3, head = 14, alpha = 1) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
  if (L < 1) return;
  const ux = dx / L, uy = dy / L, hl = Math.min(head, L * .55);
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - ux * hl * .8, y1 - uy * hl * .8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * hl - uy * hl * .45, y1 - uy * hl + ux * hl * .45);
  ctx.lineTo(x1 - ux * hl + uy * hl * .45, y1 - uy * hl - ux * hl * .45);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}
function arrow3(ctx, cam, p0, p1, color, width, head, alpha) {
  const a = cam.project(...p0), b = cam.project(...p1);
  arrow2(ctx, a[0], a[1], b[0], b[1], color, width, head, alpha);
}
function dot(ctx, x, y, r, color, alpha = 1, glow = 0) {
  ctx.save(); ctx.globalAlpha *= alpha;
  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.restore();
}

/* floor grid with draw-on reveal */
function floorGrid(ctx, cam, { R = 2.4, step = .4, z = 0, alpha = 1, reveal = 1, color = '#B9B4E0' } = {}) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.lineWidth = 1;
  const n = Math.round(R / step);
  for (let k = -n; k <= n; k++) {
    const v = k * step, major = k % 5 === 0;
    ctx.strokeStyle = rgba(color, (major ? .22 : .11) * alpha);
    const e = R * reveal;
    poly3(ctx, cam, [[-e, v, z], [e, v, z]]); ctx.stroke();
    poly3(ctx, cam, [[v, -e, z], [v, e, z]]); ctx.stroke();
  }
  ctx.restore();
}
function axes3(ctx, cam, { L = 2.7, Lz = 2.9, z = 0, alpha = 1, labels = true, which = 'xyz', grow = 1 } = {}) {
  if (alpha <= 0) return;
  const c = rgba('#D9D2F0', .75 * alpha);
  const ax = { x: [[-L * grow, 0, z], [L * grow, 0, z]], y: [[0, -L * grow, z], [0, L * grow, z]], z: [[0, 0, z], [0, 0, z + Lz * grow]] };
  for (const k of which) {
    const [p0, p1] = ax[k];
    arrow3(ctx, cam, p0, p1, c, 1.6, 11, 1);
    if (labels && grow > .6) {
      const s = cam.project(p1[0] * 1.06, p1[1] * 1.06, k === 'z' ? p1[2] + .12 : p1[2]);
      ctx.save(); ctx.globalAlpha = alpha * seg(grow, .6, 1);
      ctx.font = `italic 30px ${SERIF}`; ctx.fillStyle = '#E6DEF3'; ctx.textAlign = 'center';
      ctx.fillText(k, s[0], s[1] + 10); ctx.restore();
    }
  }
}

/* ---------- marching squares ---------- */
function contourSegs(f, x0, x1, y0, y1, n, c, mask) {
  const dx = (x1 - x0) / n, dy = (y1 - y0) / n;
  const V = new Float64Array((n + 1) * (n + 1));
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) V[i * (n + 1) + j] = f(x0 + i * dx, y0 + j * dy) - c;
  const out = [];
  const ip = (xa, ya, va, xb, yb, vb) => { const t = va / (va - vb); return [xa + (xb - xa) * t, ya + (yb - ya) * t]; };
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const xa = x0 + i * dx, ya = y0 + j * dy, xb = xa + dx, yb = ya + dy;
    if (mask && !mask((xa + xb) / 2, (ya + yb) / 2)) continue;
    const v0 = V[i * (n + 1) + j], v1 = V[(i + 1) * (n + 1) + j], v2 = V[(i + 1) * (n + 1) + j + 1], v3 = V[i * (n + 1) + j + 1];
    if (!isFinite(v0 + v1 + v2 + v3)) continue;
    const idx = (v0 > 0 ? 1 : 0) | (v1 > 0 ? 2 : 0) | (v2 > 0 ? 4 : 0) | (v3 > 0 ? 8 : 0);
    if (idx === 0 || idx === 15) continue;
    const eB = () => ip(xa, ya, v0, xb, ya, v1), eR = () => ip(xb, ya, v1, xb, yb, v2),
      eT = () => ip(xa, yb, v3, xb, yb, v2), eL = () => ip(xa, ya, v0, xa, yb, v3);
    switch (idx) {
      case 1: case 14: out.push([eL(), eB()]); break;
      case 2: case 13: out.push([eB(), eR()]); break;
      case 3: case 12: out.push([eL(), eR()]); break;
      case 4: case 11: out.push([eR(), eT()]); break;
      case 6: case 9: out.push([eB(), eT()]); break;
      case 7: case 8: out.push([eL(), eT()]); break;
      case 5: case 10: {
        const vc = (v0 + v1 + v2 + v3) / 4;
        if ((idx === 5) === (vc > 0)) { out.push([eL(), eT()]); out.push([eB(), eR()]); }
        else { out.push([eL(), eB()]); out.push([eR(), eT()]); }
        break;
      }
    }
  }
  return out;
}
function strokeSegs(ctx, cam, segs, zf) {
  ctx.beginPath();
  for (const [p, q] of segs) {
    const a = cam.project(p[0], p[1], zf(p[0], p[1])), b = cam.project(q[0], q[1], zf(q[0], q[1]));
    ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
  }
}

/* ---------- mini TeX typesetter ---------- */
const SYM = {
  '\\nabla': '∇', '\\partial': '∂', '\\cdot': '·', '\\in': '∈', '\\R': 'ℝ', '\\le': '≤', '\\ge': '≥', '\\ne': '≠', '\\neq': '≠',
  '\\to': '→', '\\mapsto': '↦', '\\infty': '∞', '\\approx': '≈', '\\times': '×', '\\setminus': '∖', '\\Rightarrow': '⇒',
  '\\iff': '⇔', '\\|': '‖', '\\perp': '⊥', '\\notin': '∉', '\\nto': '↛', '\\pm': '±'
};
const RELS = new Set('=≤≥≠≈→↦∈⇒⇔<>∉⊥↛:'.split(''));
const BINS = new Set('+−·×±'.split(''));
function parseTeX(s) {
  let i = 0;
  const skip = () => { while (s[i] === ' ') i++; };
  const readCmd = () => { let j = i + 1; if (/[A-Za-z]/.test(s[j])) { while (j < s.length && /[A-Za-z]/.test(s[j])) j++; } else j++; const c = s.slice(i, j); i = j; return c; };
  const raw = () => { skip(); if (s[i] !== '{') return s[i++]; i++; let d = 1; const st = i; while (i < s.length) { if (s[i] === '{') d++; else if (s[i] === '}') { d--; if (!d) break; } i++; } const r = s.slice(st, i); i++; return r; };
  const arg = () => { skip(); if (s[i] === '{') { i++; return { k: 'grp', items: list('}') }; } return item(); };
  function item() {
    const ch = s[i];
    if (ch === '{') { i++; return { k: 'grp', items: list('}') }; }
    if (ch === '\\') {
      const c = readCmd();
      switch (c) {
        case '\\frac': { const a = arg(), b = arg(); return { k: 'frac', a, b }; }
        case '\\sqrt': return { k: 'sqrt', a: arg() };
        case '\\text': return { k: 'text', t: raw() };
        case '\\c': { const col = raw(); return { k: 'col', col, a: arg() }; }
        case '\\lim': return { k: 'op', t: 'lim' };
        case '\\left': { const open = s[i++]; const items = list('\\right'); const close = s[i++]; return { k: 'delim', open, close, a: { k: 'grp', items } }; }
        case '\\,': return { k: 'sp', w: .17 };
        case '\\;': return { k: 'sp', w: .3 };
        case '\\quad': return { k: 'sp', w: 1 };
        case '\\qquad': return { k: 'sp', w: 2 };
        case '\\!': return { k: 'sp', w: -.1 };
        case '\\{': return { k: 'ch', c: '{' };
        case '\\}': return { k: 'ch', c: '}' };
        default: return { k: 'ch', c: SYM[c] || c.slice(1) };
      }
    }
    i++;
    return { k: 'ch', c: ch === '-' ? '−' : ch };
  }
  function list(end) {
    const out = [];
    while (i < s.length) {
      if (end && s.startsWith(end, i)) { i += end.length; return out; }
      if (s[i] === ' ') { i++; continue; }
      if (s[i] === '^' || s[i] === '_') {
        const which = s[i] === '^' ? 'sup' : 'sub'; i++;
        const a = arg();
        let prev = out.pop() || { k: 'grp', items: [] };
        if (prev.k !== 'scr') prev = { k: 'scr', base: prev };
        prev[which] = a; out.push(prev); continue;
      }
      out.push(item());
    }
    return out;
  }
  return { k: 'grp', items: list(null) };
}

const MC = document.createElement('canvas').getContext('2d');
function fontOf(st, italic) { return `${italic ? 'italic ' : ''}${st.bf ? 700 : 400} ${st.sz.toFixed(2)}px ${SERIF}`; }
function measure(font, txt) { MC.font = font; MC.letterSpacing = '0px'; return MC.measureText(txt).width; }
function resolveCol(c) { return COL[c] || c; }

function lay(n, st, role = 'ord') {
  const sz = st.sz;
  switch (n.k) {
    case 'grp': {
      const bs = []; let prev = null;
      for (const it of n.items) {
        let r = 'ord';
        if (it.k === 'ch') {
          if (RELS.has(it.c)) r = 'rel';
          else if (BINS.has(it.c)) r = (prev && !(prev.k === 'ch' && (RELS.has(prev.c) || BINS.has(prev.c) || '(,['.includes(prev.c)))) ? 'bin' : 'ord';
          else if (it.c === ',') r = 'punct';
        }
        bs.push(lay(it, st, r)); prev = it;
      }
      let w = 0, a = 0, d = 0;
      for (const b of bs) { w += b.w; a = Math.max(a, b.a); d = Math.max(d, b.d); }
      return { w, a, d, draw(ctx, x, y) { let cx = x; for (const b of bs) { b.draw(ctx, cx, y); cx += b.w; } } };
    }
    case 'ch': {
      const c = n.c, letter = /[A-Za-z]/.test(c);
      const it = letter && !st.rm;
      const font = fontOf(st, it);
      const m = measure(font, c);
      const pl = role === 'rel' ? .3 * sz : role === 'bin' ? .22 * sz : 0;
      const pr = role === 'rel' ? .3 * sz : role === 'bin' ? .22 * sz : role === 'punct' ? .18 * sz : 0;
      const ic = it ? .035 * sz : 0;
      return { w: pl + m + pr + ic, a: .72 * sz, d: .22 * sz, draw(ctx, x, y) { ctx.font = font; ctx.fillText(c, x + pl, y); } };
    }
    case 'text': {
      const font = fontOf({ ...st }, false); const m = measure(font, n.t);
      return { w: m, a: .72 * sz, d: .22 * sz, draw(ctx, x, y) { ctx.font = font; ctx.fillText(n.t, x, y); } };
    }
    case 'op': {
      const font = fontOf(st, false); const m = measure(font, n.t);
      return { w: m + .1 * sz, a: .72 * sz, d: .22 * sz, op: true, draw(ctx, x, y) { ctx.font = font; ctx.fillText(n.t, x, y); } };
    }
    case 'sp': return { w: n.w * sz, a: 0, d: 0, draw() { } };
    case 'col': {
      const b = lay(n.a, st, role);
      return { ...b, draw(ctx, x, y) { ctx.save(); ctx.fillStyle = ctx.strokeStyle = resolveCol(n.col); b.draw(ctx, x, y); ctx.restore(); } };
    }
    case 'scr': {
      const b = lay(n.base, st, role), ss = { ...st, sz: sz * .66 };
      const sup = n.sup ? lay(n.sup, ss) : null, sub = n.sub ? lay(n.sub, ss) : null;
      if (b.op) {
        const w = Math.max(b.w, sub ? sub.w : 0);
        const sy = b.d + (sub ? sub.a : 0) + .02 * sz;
        return {
          w: w + .12 * sz, a: b.a, d: b.d + (sub ? sub.a + sub.d : 0),
          draw(ctx, x, y) { b.draw(ctx, x + (w - b.w) / 2, y); if (sub) sub.draw(ctx, x + (w - sub.w) / 2, y + sy); }
        };
      }
      const up = Math.max(.42 * sz, b.a - .32 * sz), dn = Math.max(.2 * sz, b.d + .08 * sz - .1 * sz);
      const w = b.w + Math.max(sup ? sup.w : 0, sub ? sub.w : 0) + .04 * sz;
      return {
        w, a: Math.max(b.a, sup ? up + sup.a : 0), d: Math.max(b.d, sub ? dn + sub.d : 0),
        draw(ctx, x, y) { b.draw(ctx, x, y); if (sup) sup.draw(ctx, x + b.w + .02 * sz, y - up); if (sub) sub.draw(ctx, x + b.w + .02 * sz, y + dn); }
      };
    }
    case 'frac': {
      const ss = { ...st, sz: sz * .8 };
      const nu = lay(n.a, ss), de = lay(n.b, ss);
      const axis = .27 * sz, gap = .14 * sz, th = Math.max(1.6, .045 * sz);
      const w = Math.max(nu.w, de.w) + .26 * sz;
      const nb = axis + gap + nu.d, db = axis - gap - de.a;
      return {
        w, a: nb + nu.a, d: -db + de.d,
        draw(ctx, x, y) {
          nu.draw(ctx, x + (w - nu.w) / 2, y - nb); de.draw(ctx, x + (w - de.w) / 2, y - db);
          ctx.fillRect(x + .07 * sz, y - axis - th / 2, w - .14 * sz, th);
        }
      };
    }
    case 'sqrt': {
      const b = lay(n.a, st);
      const w = b.w + .66 * sz;
      return {
        w, a: b.a + .16 * sz, d: b.d + .04 * sz,
        draw(ctx, x, y) {
          const top = y - b.a - .1 * sz;
          ctx.save(); ctx.lineWidth = Math.max(1.6, .05 * sz); ctx.lineJoin = 'miter'; ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x + .06 * sz, y - .3 * sz); ctx.lineTo(x + .17 * sz, y - .37 * sz);
          ctx.lineTo(x + .33 * sz, y + b.d); ctx.lineTo(x + .55 * sz, top); ctx.lineTo(x + w - .02 * sz, top);
          ctx.stroke(); ctx.restore();
          b.draw(ctx, x + .58 * sz, y);
        }
      };
    }
    case 'delim': {
      const b = lay(n.a, st);
      const top = b.a + .06 * sz, bot = b.d + .06 * sz, h = top + bot;
      const pw = .3 * sz + h * .04;
      const w = pw * 2 + b.w + .12 * sz;
      return {
        w, a: top, d: bot,
        draw(ctx, x, y) {
          ctx.save(); ctx.lineWidth = Math.max(1.6, .05 * sz); ctx.lineCap = 'round';
          const yt = y - top, yb = y + bot, ym = (yt + yb) / 2;
          const paren = (x0, dir) => { ctx.beginPath(); ctx.moveTo(x0 + dir * pw * .55, yt); ctx.quadraticCurveTo(x0 - dir * pw * .35, ym, x0 + dir * pw * .55, yb); ctx.stroke(); };
          paren(x + pw * .4, 1); paren(x + w - pw * .4, -1);
          ctx.restore();
          b.draw(ctx, x + pw + .06 * sz, y);
        }
      };
    }
  }
  return { w: 0, a: 0, d: 0, draw() { } };
}
const TEXCACHE = new Map();
function texBox(src, sz) {
  const key = sz + '|' + src;
  if (!TEXCACHE.has(key)) TEXCACHE.set(key, lay(parseTeX(src), { sz, rm: false, bf: false }));
  return TEXCACHE.get(key);
}
/* draw formula with write-on reveal */
function tex(ctx, src, x, y, sz, { alpha = 1, color = COL.ink, reveal = 1, align = 'left', caret = true } = {}) {
  if (alpha <= 0 || reveal <= 0) return null;
  const b = texBox(src, sz);
  const x0 = align === 'center' ? x - b.w / 2 : align === 'right' ? x - b.w : x;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = ctx.strokeStyle = color;
  ctx.textBaseline = 'alphabetic';
  if (reveal < 1) {
    const rx = x0 - 20 + (b.w + 40) * E.inOut(reveal);
    ctx.save(); ctx.beginPath(); ctx.rect(x0 - 30, y - b.a - 30, rx - (x0 - 30), b.a + b.d + 60); ctx.clip();
    b.draw(ctx, x0, y); ctx.restore();
    if (caret) {
      ctx.fillStyle = COL.coral; ctx.shadowColor = COL.coral; ctx.shadowBlur = 16;
      ctx.fillRect(rx, y - b.a - 8, 3, b.a + b.d + 16);
    }
  } else b.draw(ctx, x0, y);
  ctx.restore();
  return b;
}
function texIn(ctx, src, x, y, sz, t, t0, t1, opts = {}) {
  if (t < t0 || t > t1 + .6) return;
  const rev = seg(t, t0, t0 + (opts.dur ?? .9));
  const out = E.inOut(seg(t, t1, t1 + .5));
  tex(ctx, src, x, y - out * 14, sz, { ...opts, reveal: rev, alpha: (opts.alpha ?? 1) * (1 - out) });
}

/* ---------- kinetic text ---------- */
const PREFIX = new Map();
function prefixW(font, track, str) {
  const key = font + '|' + track + '|' + str;
  if (!PREFIX.has(key)) {
    MC.font = font; MC.letterSpacing = track + 'px';
    const arr = []; for (let i = 0; i <= str.length; i++) arr.push(MC.measureText(str.slice(0, i)).width);
    PREFIX.set(key, arr);
  }
  return PREFIX.get(key);
}
function kText(ctx, str, x, y, t, o) {
  const { font, color = COL.ink, t0 = 0, dur = .7, stag = .022, tOut = null, outDur = .45, track = 0, align = 'left', rise = 28, alpha = 1 } = o;
  if (t < t0) return;
  if (tOut !== null && t > tOut + outDur + str.length * stag * .4 + .1) return;
  const pw = prefixW(font, track, str), total = pw[str.length];
  const x0 = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  ctx.save();
  ctx.font = font; ctx.letterSpacing = '0px'; ctx.fillStyle = color; ctx.textBaseline = 'alphabetic';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]; if (ch === ' ') continue;
    const p = E.out(seg(t, t0 + i * stag, t0 + i * stag + dur));
    const q = tOut === null ? 0 : E.inOut(seg(t, tOut + i * stag * .4, tOut + i * stag * .4 + outDur));
    const a = p * (1 - q) * alpha; if (a <= 0) continue;
    ctx.globalAlpha = a;
    ctx.fillText(ch, x0 + pw[i], y + (1 - p) * rise - q * rise * .6);
  }
  ctx.restore();
}
/* word-wrapped paragraph made of kinetic lines */
const WRAPC = new Map();
function wrapLines(font, str, maxW) {
  const key = font + '|' + maxW + '|' + str;
  if (WRAPC.has(key)) return WRAPC.get(key);
  MC.font = font; MC.letterSpacing = '0px';
  const words = str.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (MC.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  WRAPC.set(key, lines); return lines;
}
function para(ctx, str, x, y, t, t0, t1, { size = 33, color = 'rgba(245,238,246,0.78)', maxW = 610, lh = 1.42, italic = true } = {}) {
  const font = `${italic ? 'italic ' : ''}400 ${size}px ${SERIF}`;
  wrapLines(font, str, maxW).forEach((ln, i) => kText(ctx, ln, x, y + i * size * lh, t, { font, color, t0: t0 + i * .12, tOut: t1, stag: .012, dur: .6, rise: 18 }));
}

/* ---------- layers (alpha compositing of whole groups) ---------- */
let LAYER = null, LCTX = null;
function withLayer(ctx, alpha, fn) {
  if (alpha <= .001) return;
  if (alpha >= .999) { fn(ctx); return; }
  LCTX.setTransform(1, 0, 0, 1, 0, 0);
  LCTX.clearRect(0, 0, W, H);
  fn(LCTX);
  ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(LAYER, 0, 0); ctx.restore();
}
