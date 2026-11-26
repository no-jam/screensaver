"""Packs the frames from render.mjs into one macOS dynamic wallpaper, Nojam.heic.

macOS reads the schedule from XMP on the first image: apple_desktop:h24 is a base64 binary
property list, {"ti": [{"i": image, "t": time of day 0..1}, ...], "ap": {"l": light, "d": dark}}.
"ap" names the pictures System Settings shows for "Light (Static)" and "Dark (Static)".

    python3 heic.py [frames dir] [output]
Needs: pip install pillow pillow-heif
"""
import base64, glob, os, plistlib, sys
from PIL import Image
import pillow_heif

here = os.path.dirname(os.path.abspath(__file__))
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, 'frames')
out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(here, 'Nojam.heic')
files = sorted(glob.glob(os.path.join(src, '*.png')))
if not files:
    sys.exit(f'no frames in {src}: run node render.mjs first')
n = len(files)

schedule = {
    'ti': [{'i': i, 't': i / n} for i in range(n)],
    'ap': {'l': n // 2, 'd': 0},  # noon for light, midnight for dark
}
h24 = base64.b64encode(plistlib.dumps(schedule, fmt=plistlib.FMT_BINARY)).decode()
xmp = f'''<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="XMP Core 6.0.0">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about="" xmlns:apple_desktop="http://ns.apple.com/namespace/1.0/">
   <apple_desktop:h24>{h24}</apple_desktop:h24>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>'''.encode()

images = [Image.open(f).convert('RGB') for f in files]
heif = pillow_heif.from_pillow(images[0])
heif[0].info['xmp'] = xmp
for im in images[1:]:
    heif.add_from_pillow(im)
heif.save(out, quality=92)
print(f'{out}: {n} pictures, {os.path.getsize(out) / 1e6:.1f} MB')
