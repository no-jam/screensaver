// 31 pictures that, laid out as a month (7 columns, 5 rows, the last row 3), spell SUCCESS.
// Each picture is a square tile in the screensaver's style with its own small composition; the
// letters are built from planes and bars that run across the tiles, so the word only shows when
// they are together, and only just.
//
//   node mural/mural.mjs [tile px] [seed]      (Playwright with Chromium)
//
// Writes four quarters and mural/out/scene.json; then python3 mural/tiles.py stitches them into
// mural/out/wall.png and cuts mural/out/tiles/01.png .. 31.png. The rendering is web/index.html with window.NOJAM_SCENE set.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const [tilePx = 1080, seed = 'success'] = process.argv.slice(2);
const COLS = 7, ROWS = 5, COUNT = 31, H = 1000, W = H * COLS / ROWS, U = H / ROWS; // U: one tile

// Small, seeded random numbers (the same as lib/art.mjs on the website).
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
// u, v: centre in tiles from the top left (v down); w, h in tiles; z, d in world units.
const box = (col, u, v, w, h, z, d, deg = 0, tx = 0, ty = 0) =>
  shapes.push({ t: 'box', col, x: (u - COLS / 2) * U, y: (ROWS / 2 - v) * U, w: w * U, h: h * U, z: z + d / 2, d, deg, tx, ty });
const disc = (col, u, v, r, z, d) =>
  shapes.push({ t: 'disc', col, x: (u - COLS / 2) * U, y: (ROWS / 2 - v) * U, w: 2 * r * U, h: 2 * r * U, z: z + d / 2, d, deg: 0 });

// ---------------------------------------------------------------- the letters
// Blocky letters, one per column, from v 0.45 to 3.55. Each stroke is a plane of its own: a
// little tilted, at its own height, some split in two with a gap, so the word is there but
// does not shout.
const r = rng(`${seed}:letters`);
const between = (a, b) => a + r() * (b - a);
const pick = (l) => l[Math.floor(r() * l.length)];
const T = 0.13; // stroke thickness, in tiles
const Y0 = 0.45, Y1 = 3.55, YM = (Y0 + Y1) / 2;

function stroke(x0, y0, x1, y1) {
  const col = pick(['ink', 'blue', 'ink', 'blue', 'sky']);
  const z = between(30, 95), d = between(9, 15);
  const jitter = () => between(-3, 3);
  const long = Math.max(x1 - x0, y1 - y0);
  // Long strokes are sometimes broken in two, with a small gap and a small shift.
  if (long > 0.7 && r() < 0.6) {
    const f = between(0.3, 0.7), gap = between(0.04, 0.08);
    if (y1 - y0 > x1 - x0) {
      const ym = y0 + (y1 - y0) * f;
      const s = between(-0.04, 0.04);
      box(col, (x0 + x1) / 2, (y0 + ym - gap) / 2, x1 - x0, ym - gap - y0, z, d, jitter());
      box(pick(['ink', 'blue', 'sky']), (x0 + x1) / 2 + s, (ym + gap + y1) / 2, x1 - x0, y1 - ym - gap, z + between(-20, 30), d, jitter());
    } else {
      const xm = x0 + (x1 - x0) * f;
      box(col, (x0 + xm - gap) / 2, (y0 + y1) / 2, xm - gap - x0, y1 - y0, z, d, jitter());
      box(pick(['ink', 'blue', 'sky']), (xm + gap + x1) / 2, (y0 + y1) / 2 + between(-0.04, 0.04), x1 - xm - gap, y1 - y0, z + between(-20, 30), d, jitter());
    }
    return;
  }
  box(col, (x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0, z, d, jitter());
}

const LETTERS = {
  S: (a, b) => {
    stroke(a, Y0, b, Y0 + T); stroke(a, Y0 + T, a + T, YM); stroke(a, YM - T / 2, b, YM + T / 2);
    stroke(b - T, YM, b, Y1 - T); stroke(a, Y1 - T, b, Y1);
  },
  U: (a, b) => { stroke(a, Y0, a + T, Y1 - T); stroke(b - T, Y0, b, Y1 - T); stroke(a, Y1 - T, b, Y1); },
  C: (a, b) => { stroke(a, Y0, b, Y0 + T); stroke(a, Y0 + T, a + T, Y1 - T); stroke(a, Y1 - T, b, Y1); },
  E: (a, b) => {
    stroke(a, Y0, a + T, Y1); stroke(a + T, Y0, b, Y0 + T);
    stroke(a + T, YM - T / 2, a + (b - a) * 0.8, YM + T / 2); stroke(a + T, Y1 - T, b, Y1);
  },
};
[...'SUCCESS'].forEach((ch, i) => LETTERS[ch](i + 0.17, i + 0.83));

// ---------------------------------------------------------------- one long green bar
box('green', COLS / 2, 3.85, COLS + 0.8, 0.085, 190, 14, 6.5);

// ---------------------------------------------------------------- each tile's own composition
const SUNS = new Set([2, 9, 13, 20, 27, 30]); // tiles with a sun (1-based days)
for (let n = 1; n <= COUNT; n++) {
  const t = rng(`${seed}:tile:${n}`);
  const b = (lo, hi) => lo + t() * (hi - lo);
  const p = (l) => l[Math.floor(t() * l.length)];
  const c = (n - 1) % COLS, rr = Math.floor((n - 1) / COLS); // tile column and row
  const tilt = (t() < 0.5 ? -1 : 1) * b(5, 16);
  if (t() < 0.6) box('backdrop', c + b(0.3, 0.7), rr + b(0.3, 0.7), b(0.45, 0.85), b(0.45, 0.9), 0.5, 2, tilt * b(0.2, 0.6));
  if (t() < 0.8) { const k = b(0.08, 0.2); box(p(['sky', 'ochre', 'paper', 'inkSoft', 'sky']), c + b(0.15, 0.85), rr + b(0.15, 0.85), k, k * b(0.6, 1.3), b(105, 165), 9, tilt * b(0.5, 1.5), b(-4, 4), b(-4, 4)); }
  const a = b(0.025, 0.055);
  box(p(['ochre', 'blue', 'ink', 'ochre']), c + b(0.1, 0.9), rr + b(0.1, 0.9), a, a, b(200, 280), 7, b(-40, 40));
  if (t() < 0.7) box(p(['ochre', 'blue', 'sky']), c + b(0.2, 0.8), rr + b(0.1, 0.9), a * b(2, 3.5), a * 0.6, b(210, 290), 6, tilt);
  box('inkSoft', c + b(0.3, 0.7), rr + b(0.15, 0.85), b(0.35, 0.85), 0.012, b(120, 220), 3, tilt);
  if (t() < 0.35) box('inkSoft', c + b(0.2, 0.8), rr + b(0.2, 0.8), 0.011, b(0.25, 0.55), b(110, 200), 3, tilt * 0.3);
  // Loose bars like the letter strokes, so the letters sink into the picture.
  for (let k = 0, m = 1 + Math.floor(t() * 2); k < m; k++) {
    const len = b(0.15, 0.4), up = t() < 0.5, k2 = T * b(0.45, 0.7);
    box(p(['sky', 'inkSoft', 'sky']), c + b(0.15, 0.85), rr + b(0.15, 0.85), up ? k2 : len, up ? len : k2, b(20, 70), b(6, 10), b(-8, 8));
  }
  if (SUNS.has(n)) disc('ochre', c + b(0.3, 0.7), rr + b(0.25, 0.75), b(0.08, 0.15), b(60, 150), 12);
  if (t() < 0.5) disc(p(['blue', 'ink', 'ochre']), c + b(0.1, 0.9), rr + b(0.1, 0.9), b(0.015, 0.03), b(230, 300), 6);
}

// ---------------------------------------------------------------- render and cut
const out = join(here, 'out');
mkdirSync(join(out, 'tiles'), { recursive: true });
const scene = { la: 2.3, le: 1.2, shapes };
writeFileSync(join(out, 'scene.json'), JSON.stringify(scene));

// Rendered in four quarters with the same camera (a whole 7560 x 5400 picture is more than
// headless Chromium will capture in one piece), then stitched by tiles.py.
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const tab = await browser.newPage({ viewport: { width: (COLS * tilePx) / 4, height: (ROWS * tilePx) / 4 }, deviceScaleFactor: 2 });
tab.on('pageerror', (e) => { console.error(e); process.exit(1); });
const page = pathToFileURL(join(here, '../web/index.html')).href;
for (const [name, region] of [['q00', [-1, 0, 0, 1]], ['q10', [0, 0, 1, 1]], ['q01', [-1, -1, 0, 0]], ['q11', [0, -1, 1, 0]]]) {
  await tab.addInitScript((s) => { window.NOJAM_SCENE = s; }, { ...scene, region });
  await tab.goto(page);
  await tab.waitForFunction(() => window.__ready, null, { timeout: 900000 });
  await tab.locator('canvas').screenshot({ path: join(out, `${name}.png`) });
}
await browser.close();
console.log(`rendered ${shapes.length} shapes in four quarters of ${(COLS * tilePx) / 2} x ${(ROWS * tilePx) / 2}`);
