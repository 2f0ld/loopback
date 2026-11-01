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
www/                  the whole game (plain HTML/CSS/JS, no build step)
  index.html, style.css, game.js
  manifest.webmanifest, sw.js   PWA (installable + offline)
  icon.svg, icon-*.png
tools/make_icons.py   regenerates the PNG icons (needs Pillow)
capacitor.config.json native iOS/Android wrapper config
```

## Play locally
```bash
python -m http.server 8765 --directory www
```
Open http://localhost:8765. To test on your phone, use your PC's LAN IP on the same Wi-Fi.

## Ship it

### 1. Web / PWA (fastest, iOS + Android)
Upload `www/` to any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages). On the phone:
Safari → Share → *Add to Home Screen*, or Chrome → *Install app*. Runs fullscreen and offline.

### 2. Native apps (App Store / Google Play) via Capacitor
```bash
npm install
npx cap add android
npx cap add ios
npm run android
npm run ios
```
- `npm run android` opens Android Studio (needs Android Studio + JDK 17+).
- `npm run ios` opens Xcode (needs a Mac with Xcode + CocoaPods).
- Lock orientation to portrait: Xcode → target → *Deployment Info*, and in
  `android/app/src/main/AndroidManifest.xml` add `android:screenOrientation="portrait"` to the activity.
- App icons: use `www/icon-1024.png` with `npx @capacitor/assets generate`.
- Native haptics are wired via `@capacitor/haptics` automatically.

After changing anything in `www/`, run `npx cap sync` before rebuilding the native apps. Bump `CACHE` in
`www/sw.js` when deploying a new web version so installed PWAs update.
