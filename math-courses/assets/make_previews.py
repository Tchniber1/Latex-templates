#!/usr/bin/env python3
"""Animated GIF previews of the PDFs (two-page spreads that crossfade) and a
short GIF clip of the Lecture I animation. Needs pdftoppm (poppler) and ffmpeg.

    python3 make_previews.py
"""
import pathlib, subprocess, tempfile
from PIL import Image, ImageDraw, ImageFilter

HERE = pathlib.Path(__file__).parent
A = HERE.parent / 'AMATH301'

DOCS = {
    'preview-companion': (A / '01-companion-booklet/AMATH301_Multivariate_Calculus_Companion.pdf', [1, 7, 9, 10, 21, 36]),
    'preview-revision-guide': (A / '03-revision-guide/AMATH301_Revision_Guide.pdf', [1, 6, 13, 22, 38, 75]),
    'preview-mock-explained': (A / '04-mock-exam-explained/AMATH301_Mock_Exam_Explained.pdf', [1, 6, 8, 12, 21, 37]),
    'preview-midterm-sheet': (A / '05-midterm-sheet/AMATH301_Midterm_Sheet.pdf', [1, 2, 3, 5, 8, 14]),
    'preview-recipes': (A / '06-midterm-recipes/AMATH301_Midterm_Recipes.pdf', [1, 2, 3, 4]),
}

CW, CH = 640, 430          # canvas
PH = 384                   # page height on the canvas
BG_TOP, BG_BOT = (242, 251, 253), (214, 241, 247)
FADE_FRAMES, FADE_MS, HOLD_MS = 4, 70, 2000


def background():
    bg = Image.new('RGB', (CW, CH))
    d = ImageDraw.Draw(bg)
    for y in range(CH):
        t = y / (CH - 1)
        d.line([(0, y), (CW, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(BG_TOP, BG_BOT)))
    return bg


def render_page(pdf, n, tmp):
    out = pathlib.Path(tmp) / f'p{n}'
    subprocess.run(['pdftoppm', '-f', str(n), '-l', str(n), '-r', '110', '-png', '-singlefile', str(pdf), str(out)], check=True)
    im = Image.open(str(out) + '.png').convert('RGB')
    w = round(im.width * PH / im.height)
    return im.resize((w, PH), Image.LANCZOS)


def spread(pages, bg):
    canvas = bg.copy()
    gap = 14
    total = sum(p.width for p in pages) + gap * (len(pages) - 1)
    x = (CW - total) // 2
    y = (CH - PH) // 2
    for p in pages:
        sh = Image.new('L', (p.width + 40, p.height + 40), 0)
        ImageDraw.Draw(sh).rectangle([20, 24, 20 + p.width, 24 + p.height], fill=90)
        sh = sh.filter(ImageFilter.GaussianBlur(9))
        canvas.paste((20, 95, 110), (x - 20, y - 20), sh)
        canvas.paste(p, (x, y))
        x += p.width + gap
    return canvas


def make_gif(name, pdf, pages):
    bg = background()
    with tempfile.TemporaryDirectory() as tmp:
        imgs = [render_page(pdf, n, tmp) for n in pages]
    spreads = [spread(imgs[i:i + 2], bg) for i in range(0, len(imgs), 2)]
    frames, durations = [], []
    for i, s in enumerate(spreads):
        nxt = spreads[(i + 1) % len(spreads)]
        frames.append(s); durations.append(HOLD_MS)
        for k in range(1, FADE_FRAMES + 1):
            frames.append(Image.blend(s, nxt, k / (FADE_FRAMES + 1))); durations.append(FADE_MS)
    pal = [f.quantize(colors=96, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE) for f in frames]
    out = HERE / f'{name}.gif'
    pal[0].save(out, save_all=True, append_images=pal[1:], duration=durations, loop=0, optimize=True, disposal=1)
    print(f'{out.name}: {out.stat().st_size // 1024} KB, {len(frames)} frames')


def make_motion_clip():
    mp4 = A / '02-lecture-I-in-motion/AMATH301_Lecture1_in_Motion_light.mp4'
    out = HERE / 'preview-lecture-I-in-motion.gif'
    vf = ('fps=10,scale=560:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];'
          '[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '33', '-t', '9', '-i', str(mp4), '-vf', vf, str(out)], check=True)
    print(f'{out.name}: {out.stat().st_size // 1024} KB')


if __name__ == '__main__':
    for name, (pdf, pages) in DOCS.items():
        make_gif(name, pdf, pages)
    make_motion_clip()
