#!/usr/bin/env python3
"""Inline fonts and scripts into one page; also write rec.html for recording."""
import base64, pathlib
root = pathlib.Path(__file__).parent
def b64(p): return base64.b64encode((root / 'fonts' / p).read_bytes()).decode()
faces = [
    ('Pagella', 'normal', 400, 'texgyrepagella-regular.woff2'),
    ('Pagella', 'italic', 400, 'texgyrepagella-italic.woff2'),
    ('Pagella', 'normal', 700, 'texgyrepagella-bold.woff2'),
    ('LMMath', 'normal', 400, 'lmmath.woff2'),
    ('LMMono', 'normal', 400, 'lmmono.woff2'),
]
css = '\n'.join(
    f'@font-face{{font-family:"{f}";font-style:{s};font-weight:{w};font-display:block;'
    f'src:url(data:font/woff2;base64,{b64(p)}) format("woff2")}}' for f, s, w, p in faces)
page = (root / 'player.part.html').read_text()
page = page.replace('/*FONTFACES*/', css)
page = page.replace('/*ENGINE*/', (root / 'engine.js').read_text())
page = page.replace('/*SCENES*/', (root / 'scenes.js').read_text())
(root / 'dist').mkdir(exist_ok=True)
(root / 'dist' / 'lecture-1-in-motion.html').write_text(page)
(root / 'rec.html').write_text('<!doctype html><html><head><meta charset="utf-8"></head><body>' + page + '</body></html>')
print('built', len(page) // 1024, 'KB')
