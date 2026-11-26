"""Packs the frames from render.mjs into macOS dynamic wallpapers.

    python3 heic.py                       # all four, from frames/, frames-light/, frames-dark/
    python3 heic.py time  FRAMES OUT      # one picture per time of day, as in Nojam.heic
    python3 heic.py appearance LIGHT DARK OUT   # follows the Light/Dark setting

macOS reads the schedule from XMP on the first picture:
- apple_desktop:h24 (time of day): a base64 binary property list
  {"ti": [{"i": picture, "t": time of day 0..1}, ...], "ap": {"l": picture, "d": picture}},
  where "ap" names the still Light and Dark pictures System Settings also offers.
- apple_desktop:apr (appearance): {"l": light picture, "d": dark picture}.

Needs: pip install pillow pillow-heif
"""
import base64, glob, os, plistlib, sys
from PIL import Image
import pillow_heif

here = os.path.dirname(os.path.abspath(__file__))
XMP = '''<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="XMP Core 6.0.0">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about="" xmlns:apple_desktop="http://ns.apple.com/namespace/1.0/">
   <apple_desktop:{key}>{value}</apple_desktop:{key}>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>'''


def pack(files, out, key, schedule):
    value = base64.b64encode(plistlib.dumps(schedule, fmt=plistlib.FMT_BINARY)).decode()
    images = [Image.open(f).convert('RGB') for f in files]
    heif = pillow_heif.from_pillow(images[0])
    heif[0].info['xmp'] = XMP.format(key=key, value=value).encode()
    for im in images[1:]:
        heif.add_from_pillow(im)
    heif.save(out, quality=92)
    print(f'{out}: {len(files)} pictures, {os.path.getsize(out) / 1e6:.1f} MB')


def frames(folder):
    files = sorted(glob.glob(os.path.join(folder, '*.png')))
    if not files:
        sys.exit(f'no frames in {folder}: run node render.mjs first')
    return files


def by_time(folder, out, light=None, dark=0):
    files = frames(folder)
    n = len(files)
    pack(files, out, 'h24', {
        'ti': [{'i': i, 't': i / n} for i in range(n)],
        'ap': {'l': n // 2 if light is None else light, 'd': dark},  # noon and midnight
    })


def by_appearance(light_png, dark_png, out):
    pack([light_png, dark_png], out, 'apr', {'l': 0, 'd': 1})


if __name__ == '__main__':
    args = sys.argv[1:]
    if args[:1] == ['time']:
        by_time(args[1], args[2])
    elif args[:1] == ['appearance']:
        by_appearance(args[1], args[2], args[3])
    else:
        f = lambda *p: os.path.join(here, *p)
        by_time(f('frames'), f('Nojam.heic'))
        by_time(f('frames-light'), f('Nojam-Light.heic'))
        by_time(f('frames-dark'), f('Nojam-Dark.heic'))
        by_appearance(f('frames-light', '12.png'), f('frames-dark', '00.png'), f('Nojam-Auto.heic'))
