#!/usr/bin/env python3
"""Build the animated README banners (light and dark) for math-courses.

Text is converted to SVG paths so the banner looks the same on every machine
(an <img> SVG on GitHub cannot load web fonts). Animations are CSS + SMIL,
which GitHub plays inside README images.

    python3 make_banner.py          # writes banner-light.svg, banner-dark.svg
"""
import math, pathlib, subprocess
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

HERE = pathlib.Path(__file__).parent
FONTS = HERE.parent / 'AMATH301' / '03-revision-guide' / 'src' / 'fonts'


def kpse(name):
    return subprocess.run(['kpsewhich', name], capture_output=True, text=True).stdout.strip()


class Face:
    def __init__(self, path):
        self.f = TTFont(path)
        self.gs = self.f.getGlyphSet()
        self.cmap = self.f.getBestCmap()
        self.upm = self.f['head'].unitsPerEm
        self.hmtx = self.f['hmtx']

    def path(self, text, x, y, size, tracking=0.0):
        """SVG path data for `text` with baseline at (x, y); returns (d, width)."""
        s = size / self.upm
        pen = SVGPathPen(self.gs)
        cx = 0.0
        for ch in text:
            g = self.cmap.get(ord(ch))
            if g is None:
                g = self.cmap[ord('?')]
            tp = TransformPen(pen, (s, 0, 0, -s, x + cx, y))
            self.gs[g].draw(tp)
            cx += self.hmtx[g][0] * s + tracking * size
        return pen.getCommands(), cx - tracking * size


serif = Face(kpse('texgyrepagella-regular.otf'))
serif_it = Face(kpse('texgyrepagella-italic.otf'))
sans_b = Face(str(FONTS / 'Montserrat-Bold.ttf'))
sans_sb = Face(str(FONTS / 'Montserrat-SemiBold.ttf'))
sans = Face(str(FONTS / 'Montserrat-Medium.ttf'))

THEMES = {
    'light': dict(bg1='#F2FBFD', bg2='#DDF4F9', ink='#145F6E', ink2='#1F7F92', soft='#5E8F99',
                  aqua='#64CADE', sky='#6DD2E7', ice='#95E1F1', coral='#F19381', coralD='#C95A46',
                  blush='#FFB1A1', grid='#BFE7F0', card='#FFFFFF'),
    'dark': dict(bg1='#0E1E24', bg2='#122A33', ink='#E9F8FB', ink2='#95E1F1', soft='#8FB8C2',
                 aqua='#64CADE', sky='#6DD2E7', ice='#2E6B78', coral='#F19381', coralD='#FFB1A1',
                 blush='#F19381', grid='#1D3A44', card='#14303A'),
}

W, H = 1200, 340


def ellipse_path(cx, cy, rx, ry, rot=0, n=120):
    pts = []
    c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    for i in range(n + 1):
        t = 2 * math.pi * i / n
        x, y = rx * math.cos(t), ry * math.sin(t)
        pts.append((cx + c * x - s * y, cy + s * x + c * y))
    return 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in pts) + ' Z', 2 * math.pi * math.sqrt((rx * rx + ry * ry) / 2)


DEFAULT = dict(
    eyebrow='UM6P  /  SASE  /  APPLIED MATHEMATICS',
    title='Math Courses',
    subtitle='Booklets, revision guides and animations, all in LaTeX',
    phrases=['AMATH301  Multivariate Calculus', 'Revision guide  ·  76 pages', 'Mock exam, explained',
             'Midterm sheet  ·  8 proof sentences', 'AMATH302  Optimization kit'],
)
REPO = dict(
    eyebrow='TAHA CHNIBER  /  UM6P  /  SASE',
    title='LaTeX Templates',
    subtitle='A washi-paper theme, and my math course notes',
    phrases=['Sakura Notes  ·  washi-paper theme', 'ASE203  Mathematical Methods', 'AMATH301  Multivariate Calculus',
             'AMATH302  Optimization kit', '233 pages  ·  every answer checked'],
)


def banner(theme, text=DEFAULT):
    T = THEMES[theme]
    parts = []
    add = parts.append

    # ---- contour map on the right: a hill f = -(x^2/a^2 + y^2/b^2), rotated
    cx, cy = 925, 170
    contours = []
    for i, k in enumerate([0.22, 0.38, 0.54, 0.70, 0.86, 1.02]):
        d, L = ellipse_path(cx, cy, 230 * k, 120 * k, rot=-18)
        col = [T['coral'], T['blush'], T['sky'], T['aqua'], T['ice'], T['grid']][i]
        contours.append((d, L, col, i))

    # steepest-descent path: from the top of the hill outwards, perpendicular to contours
    dot_path = 'M925,170 C960,190 1010,205 1060,228 S1150,262 1185,276'

    # ---- text
    t_eyebrow, _ = sans_sb.path(text['eyebrow'], 64, 78, 13, tracking=0.22)
    t_title, wt = serif.path(text['title'], 60, 156, 76)
    t_sub, _ = serif_it.path(text['subtitle'], 64, 200, 24)
    phrases = text['phrases']
    typed = []
    for p in phrases:
        d, w = sans.path(p, 92, 262, 21, tracking=0.02)
        typed.append((d, w))

    n = len(phrases)
    per = 3.2           # seconds per phrase
    total = per * n

    css = f"""
    .contour {{ fill: none; stroke-width: 2.2; stroke-linecap: round; }}
    .draw {{ animation: draw 2.2s cubic-bezier(.65,.05,.36,1) forwards, breathe 6s ease-in-out 2.4s infinite; }}
    @keyframes draw {{ to {{ stroke-dashoffset: 0; }} }}
    @keyframes breathe {{ 0%,100% {{ opacity: 1; }} 50% {{ opacity: .55; }} }}
    .rise {{ opacity: 0; transform: translateY(10px); animation: rise .9s ease-out forwards; }}
    @keyframes rise {{ to {{ opacity: 1; transform: translateY(0); }} }}
    .cursor {{ animation: blink 1s steps(1) infinite; }}
    @keyframes blink {{ 50% {{ opacity: 0; }} }}
    .grid {{ stroke: {T['grid']}; stroke-width: 1; }}
    """
    add(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" '
        f'aria-label="{text["title"]}: {text["subtitle"]}">')
    add(f'<style>{css}</style>')
    add('<defs>')
    add(f'<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{T["bg1"]}"/>'
        f'<stop offset="1" stop-color="{T["bg2"]}"/></linearGradient>')
    add(f'<radialGradient id="glow" cx="925" cy="170" r="260" gradientUnits="userSpaceOnUse">'
        f'<stop offset="0" stop-color="{T["coral"]}" stop-opacity=".22"/>'
        f'<stop offset="1" stop-color="{T["coral"]}" stop-opacity="0"/></radialGradient>')
    add(f'<clipPath id="frame"><rect x="0" y="0" width="{W}" height="{H}" rx="22"/></clipPath>')
    # typing clips: one animated rect per phrase (the cursor follows the same timing)
    cursors = []
    for i, (d, w) in enumerate(typed):
        t0 = i * per
        # keyTimes over the whole cycle: hidden, type in, hold, erase, hidden
        a = t0 / total
        b = (t0 + 1.1) / total
        c = (t0 + per - 0.7) / total
        e = (t0 + per - 0.15) / total
        kt, vals = [0], ['0']
        for k, v in ((a, '0'), (b, f'{w + 4:.1f}'), (c, f'{w + 4:.1f}'), (e, '0')):
            if k > kt[-1] + 1e-6:
                kt.append(k); vals.append(v)
            else:
                vals[-1] = v
        if kt[-1] < 1:
            kt.append(1); vals.append('0')
        cx_vals = ';'.join(f'{92 + float(v):.1f}' for v in vals)
        vis_kt = sorted(set([0, a, e, 1]))
        vis_vals = ['1' if a <= k < e else '0' for k in vis_kt]
        cursors.append(f'<rect x="92" y="243" width="3" height="22" rx="1" fill="{T["coral"]}" opacity="0">'
                       f'<animate attributeName="x" dur="{total}s" repeatCount="indefinite" calcMode="linear" '
                       f'keyTimes="{";".join(f"{k:.4f}" for k in kt)}" values="{cx_vals}"/>'
                       f'<animate attributeName="opacity" dur="{total}s" repeatCount="indefinite" calcMode="discrete" '
                       f'keyTimes="{";".join(f"{k:.4f}" for k in vis_kt)}" values="{";".join(vis_vals)}"/></rect>')
        add(f'<clipPath id="ty{i}"><rect x="90" y="236" height="36" width="0">'
            f'<animate attributeName="width" dur="{total}s" repeatCount="indefinite" calcMode="linear" '
            f'keyTimes="{";".join(f"{k:.4f}" for k in kt)}" values="{";".join(vals)}"/></rect></clipPath>')
    add('</defs>')

    add(f'<g clip-path="url(#frame)">')
    add(f'<rect width="{W}" height="{H}" fill="url(#bg)"/>')
    # faint grid
    for gx in range(620, W, 40):
        add(f'<line class="grid" x1="{gx}" y1="0" x2="{gx}" y2="{H}" opacity=".55"/>')
    for gy in range(10, H, 40):
        add(f'<line class="grid" x1="620" y1="{gy}" x2="{W}" y2="{gy}" opacity=".55"/>')
    add(f'<rect x="600" y="0" width="80" height="{H}" fill="url(#bg)" opacity=".85"/>')
    add(f'<circle cx="925" cy="170" r="260" fill="url(#glow)"/>')

    # contours, drawn in one after the other (outermost first)
    for d, L, col, i in reversed(contours):
        delay = (5 - i) * 0.18
        add(f'<path class="contour draw" d="{d}" stroke="{col}" stroke-dasharray="{L * 1.15:.0f}" '
            f'stroke-dashoffset="{L * 1.15:.0f}" style="animation-delay:{delay:.2f}s, {2.4 + delay:.2f}s"/>')

    # gradient arrow at a point, and the steepest-descent walker
    add(f'<path d="{dot_path}" fill="none" stroke="{T["coralD"]}" stroke-width="1.6" stroke-dasharray="5 7" opacity=".7"/>')
    add(f'<circle r="7" fill="{T["coral"]}" stroke="{T["card"]}" stroke-width="2.5">'
        f'<animateMotion dur="5s" repeatCount="indefinite" path="{dot_path}" keyPoints="0;1" keyTimes="0;1" '
        f'calcMode="spline" keySplines=".45 0 .55 1"/></circle>')
    add(f'<circle cx="925" cy="170" r="5" fill="{T["ink"]}"/>')
    lbl, _ = serif_it.path('f(x, y) = c', 1040, 72, 20)
    add(f'<path d="{lbl}" fill="{T["soft"]}" class="rise" style="animation-delay:1.6s"/>')
    lbl2, _ = serif_it.path('\u2212\u2207f', 1110, 300, 18)
    add(f'<path d="{lbl2}" fill="{T["coralD"]}" class="rise" style="animation-delay:2s"/>')

    # text block
    add(f'<rect x="60" y="62" width="44" height="4" rx="2" fill="{T["coral"]}" class="rise"/>')
    add(f'<path d="{t_eyebrow}" fill="{T["coralD"]}" class="rise" style="animation-delay:.15s"/>')
    add(f'<path d="{t_title}" fill="{T["ink"]}" class="rise" style="animation-delay:.3s"/>')
    add(f'<path d="{t_sub}" fill="{T["soft"]}" class="rise" style="animation-delay:.5s"/>')
    # typing line with prompt chevron and cursor
    add(f'<g class="rise" style="animation-delay:.8s">')
    add(f'<rect x="60" y="232" width="520" height="44" rx="10" fill="{T["card"]}" stroke="{T["ice"]}" stroke-width="1.2"/>')
    chev, _ = sans_b.path('>', 70, 262, 21)
    add(f'<path d="{chev}" fill="{T["coral"]}"/>')
    for i, (d, w) in enumerate(typed):
        add(f'<path d="{d}" fill="{T["ink2"]}" clip-path="url(#ty{i})"/>')
    add('<g class="cursor">' + ''.join(cursors) + '</g>')
    add('</g>')
    add('</g>')
    add(f'<rect x=".75" y=".75" width="{W - 1.5}" height="{H - 1.5}" rx="22" fill="none" stroke="{T["ice"]}" stroke-width="1.5"/>')
    add('</svg>')
    return '\n'.join(parts)


if __name__ == '__main__':
    for th in THEMES:
        (HERE / f'banner-{th}.svg').write_text(banner(th))
        (HERE / f'repo-banner-{th}.svg').write_text(banner(th, REPO))
        print('wrote', f'banner-{th}.svg', f'repo-banner-{th}.svg')
