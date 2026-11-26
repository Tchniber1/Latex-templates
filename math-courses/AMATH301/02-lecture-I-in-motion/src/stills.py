#!/usr/bin/env python3
"""Render chosen times to PNG stills: python3 stills.py OUTDIR t1 t2 ..."""
import asyncio, base64, sys, pathlib
from playwright.async_api import async_playwright

async def main(out, times):
    out = pathlib.Path(out); out.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1920, 'height': 1080})
        errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file://' + str(pathlib.Path(__file__).parent / 'rec.html') + '?record')
        await pg.wait_for_function('window.__ready === true', timeout=20000)
        for t in times:
            d = await pg.evaluate(f"(()=>{{__render({t}); return document.getElementById('cv').toDataURL('image/jpeg', .9);}})()")
            (out / f't{float(t):06.2f}.jpg').write_bytes(base64.b64decode(d.split(',')[1]))
        await b.close()
        for e in errs[:20]: print('ERR', e)

asyncio.run(main(sys.argv[1], [float(x) for x in sys.argv[2:]]))
