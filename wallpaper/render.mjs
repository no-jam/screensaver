// Renders the frames of the Nojam dynamic wallpaper with the screensaver's own renderer
// (../web/index.html, in wallpaper mode), one per 1.5 hours of the day, as PNGs in frames/.
//   node render.mjs [width] [height] [frames] [seed]
// Needs Playwright with Chromium (npm i playwright && npx playwright install chromium).
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const [w = 6016, h = 3384, n = 16, seed = 'nojam'] = process.argv.slice(2);
const page = pathToFileURL(join(here, '../web/index.html')).href;
mkdirSync(join(here, 'frames'), { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const tab = await browser.newPage({ viewport: { width: Math.round(w / 2), height: Math.round(h / 2) }, deviceScaleFactor: 2 });
tab.on('pageerror', (e) => { console.error(e); process.exit(1); });
for (let i = 0; i < +n; i++) {
  const t = i / n;
  await tab.goto(`${page}?seed=${encodeURIComponent(seed)}&wall=${t}`);
  await tab.waitForFunction(() => window.__ready, null, { timeout: 600000 });
  const out = join(here, 'frames', `${String(i).padStart(2, '0')}.png`);
  await tab.locator('canvas').screenshot({ path: out });
  console.log(`${out}  ${String(Math.floor(t * 24)).padStart(2, '0')}:${t * 24 % 1 ? '30' : '00'}`);
}
await browser.close();
