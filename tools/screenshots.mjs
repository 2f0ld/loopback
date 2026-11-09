// Store screenshots: serves www/ locally and captures staged scenes (?shot=...) with headless Edge/Chrome.
// Usage: npm run screenshots        → store/screenshots/<store>/<n>-<scene>.png
// Viewports stay above the headless minimum window width (~500px) and use 2x scale to hit store sizes.
import { createServer } from 'node:http';
import { readFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { join, extname, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = resolve('www');
const OUT = resolve('store/screenshots');
const PORT = 8799;
const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
];
const TARGETS = {
  'google-play': { w: 540, h: 960 },     // ×2 = 1080 × 1920
  'app-store-6.9': { w: 660, h: 1434 },  // ×2 = 1320 × 2868
};
const SCENES = ['play', 'draft', 'over', 'menu', 'lab'];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

const browser = BROWSERS.find((p) => existsSync(p));
if (!browser) { console.error('No Edge/Chrome found.'); process.exit(1); }

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = join(ROOT, path === '/' ? 'index.html' : path);
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end();
  }
}).listen(PORT);

const run = (args) => new Promise((ok, fail) => execFile(browser, args, { timeout: 90000 }, (e) => (e ? fail(e) : ok())));

for (const [store, { w, h }] of Object.entries(TARGETS)) {
  await mkdir(join(OUT, store), { recursive: true });
  for (const [i, scene] of SCENES.entries()) {
    const profile = join(tmpdir(), `loopback-shot-${Date.now()}`);
    const out = join(OUT, store, `${i + 1}-${scene}.png`);
    await run([
      '--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', '--no-first-run',
      `--user-data-dir=${profile}`, `--window-size=${w},${h}`, '--force-device-scale-factor=2',
      '--virtual-time-budget=2500', `--screenshot=${out}`, `http://localhost:${PORT}/?shot=${scene}`,
    ]);
    // Edge can return before the PNG is flushed; wait for it before the next capture.
    for (let t = 0; t < 60 && !existsSync(out); t++) await new Promise((r) => setTimeout(r, 500));
    await rm(profile, { recursive: true, force: true }).catch(() => {});
    console.log((existsSync(out) ? 'wrote ' : 'FAILED ') + out);
  }
}
server.close();
