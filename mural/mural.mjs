// 31 pictures that together spell SUCCESS: 16:9 tiles laid out in seven columns, four full rows
// and three tiles centred underneath (7 + 7 + 7 + 7 + 3). Each picture is in the screensaver's
// style with its own small composition; the letters are built from planes and bars that run
// across the tiles, so the word only shows when they are together, and only just.
//
//   node mural/mural.mjs [width px] [seed] [ss] (Playwright with Chromium; default 3840 = 4K)
//   python3 mural/sheet.py                      (scales to size, the whole wall, a mock-up)
//
// ss renders each picture ss times larger (default 2), and sheet.py scales it down: smoother
// edges and shadows.
//
// Writes the renders to mural/out/raw/ (sheet.py makes mural/out/tiles/1.jpg .. 31.jpg, reading order) and mural/out/scene.json. Each tile is
// rendered on its own with the camera of the whole wall (web/index.html with window.NOJAM_SCENE),
// so shapes and shadows run on across tile edges, at any size.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const [tileW = 3840, seed = 'success', ss = 2] = process.argv.slice(2);
const tileH = Math.round((tileW * 9) / 16);

// The wall: 7 columns, 5 rows of 16:9 cells. Rows 0-3 are full; row 4 has cells 2, 3 and 4.
const COLS = 7, ROWS = 5, H = 1000, UH = H / ROWS, UW = (UH * 16) / 9, W = UW * COLS;
const CELLS = [];
for (let r = 0; r < 4; r++) for (let c = 0; c < COLS; c++) CELLS.push([c, r]);
for (const c of [2, 3, 4]) CELLS.push([c, 4]);

function rng(name) {
  let h = 0x811c9dc5;
  for (const ch of String(name)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  let a = h;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const shapes = [];
// u, v: centre in cells from the top left of the wall (v down). w, h, z, d: world units (the
// wall is 1000 high, a cell 200 high and 356 wide).
const X = (u) => (u - COLS / 2) * UW, Y = (v) => (ROWS / 2 - v) * UH;
const box = (col, u, v, w, h, z, d, deg = 0, tx = 0, ty = 0) => shapes.push({ t: 'box', col, x: X(u), y: Y(v), w, h, z: z + d / 2, d, deg, tx, ty });
const disc = (col, u, v, r, z, d) => shapes.push({ t: 'disc', col, x: X(u), y: Y(v), w: 2 * r, h: 2 * r, z: z + d / 2, d, deg: 0 });

// ---------------------------------------------------------------- the letters
// Blocky letters, one per column, over rows 0-3: planes a little tilted, each at its own height,
// some split in two with a gap, so the word is there but does not shout.
const r = rng(`${seed}:letters`);
const between = (a, b) => a + r() * (b - a);
const pick = (l) => l[Math.floor(r() * l.length)];
const T = 27; // stroke thickness, world units
const TU = T / UW, TV = T / UH; // the same in cells, across and down
const Y0 = 0.45, Y1 = 3.55, YM = (Y0 + Y1) / 2;

// A stroke from (x0, y0) to (x1, y1), in cells.
function stroke(x0, y0, x1, y1) {
  const col = pick(['ink', 'blue', 'ink', 'blue', 'sky']);
  const z = between(30, 95), d = between(9, 15);
  const jitter = () => between(-3, 3);
  const wide = (x1 - x0) * UW, tall = (y1 - y0) * UH;
  if (Math.max(wide, tall) > 140 && r() < 0.6) {
    const f = between(0.3, 0.7), gap = between(0.04, 0.08);
    if (tall > wide) {
      const ym = y0 + (y1 - y0) * f, s = between(-0.025, 0.025);
      box(col, (x0 + x1) / 2, (y0 + ym - gap) / 2, wide, (ym - gap - y0) * UH, z, d, jitter());
      box(pick(['ink', 'blue', 'sky']), (x0 + x1) / 2 + s, (ym + gap + y1) / 2, wide, (y1 - ym - gap) * UH, z + between(-20, 30), d, jitter());
    } else {
      const xm = x0 + (x1 - x0) * f, g = gap * 0.6;
      box(col, (x0 + xm - g) / 2, (y0 + y1) / 2, (xm - g - x0) * UW, tall, z, d, jitter());
      box(pick(['ink', 'blue', 'sky']), (xm + g + x1) / 2, (y0 + y1) / 2 + between(-0.04, 0.04), (x1 - xm - g) * UW, tall, z + between(-20, 30), d, jitter());
    }
    return;
  }
  box(col, (x0 + x1) / 2, (y0 + y1) / 2, wide, tall, z, d, jitter());
}

const LETTERS = {
  S: (a, b) => {
    stroke(a, Y0, b, Y0 + TV); stroke(a, Y0 + TV, a + TU, YM); stroke(a, YM - TV / 2, b, YM + TV / 2);
    stroke(b - TU, YM, b, Y1 - TV); stroke(a, Y1 - TV, b, Y1);
  },
  U: (a, b) => { stroke(a, Y0, a + TU, Y1 - TV); stroke(b - TU, Y0, b, Y1 - TV); stroke(a, Y1 - TV, b, Y1); },
  C: (a, b) => { stroke(a, Y0, b, Y0 + TV); stroke(a, Y0 + TV, a + TU, Y1 - TV); stroke(a, Y1 - TV, b, Y1); },
  E: (a, b) => {
    stroke(a, Y0, a + TU, Y1); stroke(a + TU, Y0, b, Y0 + TV);
    stroke(a + TU, YM - TV / 2, a + (b - a) * 0.8, YM + TV / 2); stroke(a + TU, Y1 - TV, b, Y1);
  },
};
[...'SUCCESS'].forEach((ch, i) => LETTERS[ch](i + 0.2, i + 0.8));

// Small letters across the three bottom pictures, made the same way: "sw im", a third of the
// height, the dot of the i an ochre disc.
{
  const t = 14, tu = t / UW, tv = t / UH; // thinner strokes
  const y0 = 4.36, y1 = 4.72, ym = (y0 + y1) / 2;
  const small = {
    s: (a, b) => {
      stroke(a, y0, b, y0 + tv); stroke(a, y0 + tv, a + tu, ym); stroke(a, ym - tv / 2, b, ym + tv / 2);
      stroke(b - tu, ym, b, y1 - tv); stroke(a, y1 - tv, b, y1);
    },
    w: (a, b) => {
      const m = (a + b) / 2;
      stroke(a, y0, a + tu, y1 - tv); stroke(m - tu / 2, y0 + (y1 - y0) * 0.3, m + tu / 2, y1 - tv);
      stroke(b - tu, y0, b, y1 - tv); stroke(a, y1 - tv, b, y1);
    },
    i: (a, b) => {
      const m = (a + b) / 2;
      stroke(m - tu / 2, y0, m + tu / 2, y1);
      disc('ochre', m, y0 - 0.1, 9, between(60, 110), 8);
    },
    m: (a, b) => {
      const m = (a + b) / 2;
      stroke(a, y0, b, y0 + tv); stroke(a, y0 + tv, a + tu, y1);
      stroke(m - tu / 2, y0 + tv, m + tu / 2, y1); stroke(b - tu, y0 + tv, b, y1);
    },
  };
  // Picture 29 is cell 2, 30 is 3, 31 is 4: "sw" left of the middle, "im" right of it.
  small.s(2.55, 2.85); small.w(3.0, 3.42); small.i(3.75, 3.85); small.m(4.0, 4.45);
}

// ---------------------------------------------------------------- green
// The long bar through the bottom of the letters, and thinner green lines across the wall.
box('green', COLS / 2, 3.85, W * 1.1, 17, 190, 14, 6.5);
box('green', COLS / 2 + 0.3, 1.25, W * 1.05, 5, 250, 5, -4.5);
box('green', 1.6, 2.6, UW * 3.4, 6, 235, 5, 11);
box('green', 5.4, 0.15, UW * 3.0, 4, 270, 4, -9);
box('green', 3.5, 4.9, UW * 3.2, 7, 220, 5, 3);

// ---------------------------------------------------------------- each picture's own composition
const SUNS = new Set([1, 3, 6, 9, 12, 14, 17, 20, 23, 25, 28, 30, 31]); // pictures with a sun
CELLS.forEach(([c, row], i) => {
  const n = i + 1;
  const t = rng(`${seed}:tile:${n}`);
  const b = (lo, hi) => lo + t() * (hi - lo);
  const p = (l) => l[Math.floor(t() * l.length)];
  const tilt = (t() < 0.5 ? -1 : 1) * b(5, 16);
  const at = (lo = 0.08, hi = 0.92) => [c + b(lo, hi), row + b(lo, hi)];
  if (t() < 0.65) { const [u, v] = at(0.3, 0.7); box('backdrop', u, v, UW * b(0.4, 0.8), UH * b(0.45, 0.9), 0.5, 2, tilt * b(0.2, 0.6)); }
  if (t() < 0.85) { const [u, v] = at(0.15, 0.85); const k = UH * b(0.1, 0.22); box(p(['ochre', 'sky', 'ochre', 'paper', 'inkSoft']), u, v, k * b(1, 1.6), k, b(105, 165), 9, tilt * b(0.5, 1.5), b(-4, 4), b(-4, 4)); }
  // Yellow: two to four small ochre pieces in every picture.
  for (let k = 0, m = 2 + Math.floor(t() * 3); k < m; k++) {
    const [u, v] = at(); const a = UH * b(0.025, 0.06);
    if (t() < 0.5) box('ochre', u, v, a, a, b(190, 290), 7, b(-40, 40));
    else box('ochre', u, v, a * b(2, 3.5), a * 0.55, b(200, 300), 6, tilt);
  }
  { const [u, v] = at(); const a = UH * b(0.025, 0.05); box(p(['blue', 'ink', 'sky']), u, v, a, a, b(200, 280), 7, b(-40, 40)); }
  // Loose bars like the letter strokes, lighter, so the letters sink into the picture.
  for (let k = 0, m = 1 + Math.floor(t() * 2); k < m; k++) {
    const [u, v] = at(0.15, 0.85); const len = UH * b(0.15, 0.4), up = t() < 0.5, k2 = T * b(0.45, 0.7);
    box(p(['sky', 'inkSoft', 'sky']), u, v, up ? k2 : len, up ? len : k2, b(20, 70), b(6, 10), b(-8, 8));
  }
  { const [u, v] = at(0.3, 0.7); box('inkSoft', u, v, UW * b(0.35, 0.8), 2.5, b(120, 220), 3, tilt); }
  if (t() < 0.35) { const [u, v] = at(0.2, 0.8); box('inkSoft', u, v, 2.2, UH * b(0.25, 0.55), b(110, 200), 3, tilt * 0.3); }
  if (t() < 0.45) { const [u, v] = at(0.15, 0.85); box('green', u, v, UH * b(0.25, 0.5), b(4, 7), b(150, 260), 5, tilt + b(-6, 6)); }
  if (SUNS.has(n)) { const [u, v] = at(0.25, 0.75); disc('ochre', u, v, UH * b(0.08, 0.15), b(60, 150), 12); }
  if (t() < 0.6) { const [u, v] = at(); disc(p(['ochre', 'blue', 'ink', 'ochre']), u, v, UH * b(0.015, 0.03), b(230, 300), 6); }
});

// ---------------------------------------------------------------- render each picture
const out = join(here, 'out');
mkdirSync(join(out, 'raw'), { recursive: true });
const scene = { la: 2.3, le: 1.2, aspect: W / H, shapes };
writeFileSync(join(out, 'scene.json'), JSON.stringify({ ...scene, cells: CELLS, size: [+tileW, tileH] }));

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const tab = await browser.newPage({ viewport: { width: tileW / 2, height: tileH / 2 }, deviceScaleFactor: 2 * ss });
tab.on('pageerror', (e) => { console.error(e); process.exit(1); });
const page = pathToFileURL(join(here, '../web/index.html')).href;
for (const [i, [c, row]] of CELLS.entries()) {
  // This cell as a part of the whole view (x right, y up, -1..1), and the ground under it for
  // the shadow map, with room for shadows cast from outside.
  const region = [-1 + (2 * c) / COLS, 1 - (2 * (row + 1)) / ROWS, -1 + (2 * (c + 1)) / COLS, 1 - (2 * row) / ROWS];
  const shadow = { x: X(c + 0.5), y: Y(row + 0.5), r: Math.hypot(UW, UH) / 2 + 220 };
  await tab.addInitScript((s) => { window.NOJAM_SCENE = s; }, { ...scene, region, shadow });
  await tab.goto(page);
  await tab.waitForFunction(() => window.__ready, null, { timeout: 900000 });
  await tab.locator('canvas').screenshot({ path: join(out, 'raw', `${String(i + 1).padStart(2, '0')}.png`) });
}
await browser.close();
console.log(`${CELLS.length} pictures rendered at ${tileW * ss} x ${tileH * ss}, ${shapes.length} shapes; now python3 mural/sheet.py`);
