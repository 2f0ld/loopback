# Loopback

**Every loop, your past self comes back. It works for you, and it can kill you.**

A one-thumb strategy-arcade game for mobile. Each 6-second loop you must meet a gem quota. When the loop
ends, your movement is replayed forever as an "echo" that **collects gems for you** but **kills you on
touch**. Plan routes through next loop's gems, draft upgrade cards every 3 loops, and spend gems in the
Lab on permanent unlocks. See [DESIGN.md](DESIGN.md) for the full design.

## Tuning
All balance knobs are at the top of `www/game.js` and in the `CARDS` / `PERKS` / `SKINS` tables:
loop length, player speed, gem count and quota curves (`gemCount`, `quotaNow`), card effects and Lab prices.

## Project layout
```
www/                    the whole game (plain HTML/CSS/JS, no build step)
  index.html, style.css, game.js
  privacy.html          privacy policy (in-app + hosted for the stores)
  debug.js              dev bot + store-screenshot scenes (only loads with ?debug / ?shot=)
  vendor/capacitor.js   Capacitor runtime, copied from node_modules on npm install
  manifest.webmanifest, sw.js   PWA (installable + offline)
android/, ios/          native projects (Capacitor 8)
assets/                 icon + splash sources for native builds
store/                  store listing texts + generated screenshots
tools/make_icons.py     regenerates icons/splash sources (needs Pillow)
tools/screenshots.mjs   renders store screenshots with headless Edge/Chrome
```

## Play locally
```bash
python -m http.server 8765 --directory www
```
Open http://localhost:8765. Add `?debug` to expose the test bot (`__bot`, `__loopback`) in the console.

## Common commands
| Command | What it does |
|---|---|
| `npm install` | install Capacitor + plugins, copy the Capacitor runtime into `www/vendor/` |
| `npx cap sync` | copy `www/` into the native projects (run after every web change) |
| `npm run android` / `npm run ios` | sync and open Android Studio / Xcode |
| `npm run assets` | regenerate all native icons and splash screens |
| `npm run screenshots` | regenerate store screenshots into `store/screenshots/` |

## Publishing
See [PUBLISHING.md](PUBLISHING.md) for the full step-by-step guide to Google Play and the App Store,
and [store/STORE_LISTING.md](store/STORE_LISTING.md) for copy-paste store texts.
