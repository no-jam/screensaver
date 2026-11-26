"""Finishes the 31 pictures from mural.mjs: scales the renders in out/raw/ down to their size
into out/tiles/ as 1.png .. 31.png and 1.jpg .. 31.jpg, then puts them back together as out/wall.jpg (the
whole wall, no gaps) and out/mockup.png (a gallery, with gaps, the last three centred).

    python3 mural/sheet.py [width of one picture in the previews, default 480]   (needs Pillow)
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFilter

Image.MAX_IMAGE_PIXELS = None
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
meta = json.load(open(os.path.join(out, 'scene.json')))
cells, size = meta['cells'], tuple(meta['size'])
os.makedirs(os.path.join(out, 'tiles'), exist_ok=True)
for n in range(len(cells)):
    raw = os.path.join(out, 'raw', f'{n + 1:02d}.png')
    if os.path.exists(raw):
        im = Image.open(raw).convert('RGB')
        if im.size != size:
            im = im.resize(size, Image.LANCZOS)
        im.save(os.path.join(out, 'tiles', f'{n + 1}.png'))
        im.save(os.path.join(out, 'tiles', f'{n + 1}.jpg'), quality=95, subsampling=0)
w = int(sys.argv[1]) if len(sys.argv) > 1 else 480
h = round(w * 9 / 16)
tiles = [Image.open(os.path.join(out, 'tiles', f'{n + 1}.png')).convert('RGB').resize((w, h), Image.LANCZOS) for n in range(len(cells))]

# The wall without gaps.
wall = Image.new('RGB', (7 * w, 5 * h), (245, 245, 241))
for (c, r), im in zip(cells, tiles):
    wall.paste(im, (c * w, r * h))
wall.save(os.path.join(out, 'wall.jpg'), quality=90)

# A gallery: gaps, soft shadows, on the paper colour.
gap, pad = round(w * 0.06), round(w * 0.35)
W, H = 7 * w + 6 * gap + 2 * pad, 5 * h + 4 * gap + 2 * pad
sheet = Image.new('RGB', (W, H), (245, 245, 241))
shade = Image.new('L', (W, H), 0)
d = ImageDraw.Draw(shade)
for c, r in cells:
    x, y = pad + c * (w + gap), pad + r * (h + gap)
    d.rectangle((x, y + round(w * 0.012), x + w, y + h + round(w * 0.012)), fill=70)
shade = shade.filter(ImageFilter.GaussianBlur(round(w * 0.025)))
sheet.paste(Image.new('RGB', (W, H), (35, 48, 64)), (0, 0), shade)
for (c, r), im in zip(cells, tiles):
    sheet.paste(im, (pad + c * (w + gap), pad + r * (h + gap)))
sheet.save(os.path.join(out, 'mockup.png'))
print(f'{out}/wall.jpg {wall.size}, {out}/mockup.png {sheet.size}')
