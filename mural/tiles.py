"""Stitches the four quarters from mural.mjs into out/wall.png and cuts the 31 tiles.

    python3 mural/tiles.py           (needs Pillow)
"""
import os
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
q = {k: Image.open(os.path.join(out, f'{k}.png')).convert('RGB') for k in ('q00', 'q10', 'q01', 'q11')}
w, h = q['q00'].size
wall = Image.new('RGB', (2 * w, 2 * h))
for k, im in q.items():
    wall.paste(im, (int(k[1]) * w, int(k[2]) * h))
wall.save(os.path.join(out, 'wall.png'))
for k in q:
    os.remove(os.path.join(out, f'{k}.png'))

tile = wall.size[0] // 7
os.makedirs(os.path.join(out, 'tiles'), exist_ok=True)
for n in range(31):
    c, r = n % 7, n // 7
    wall.crop((c * tile, r * tile, (c + 1) * tile, (r + 1) * tile)).save(os.path.join(out, 'tiles', f'{n + 1:02d}.png'), optimize=True)
print(f'{out}/wall.png {wall.size[0]} x {wall.size[1]}; 31 tiles of {tile} x {tile}')
