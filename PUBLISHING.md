# Publishing Loopback

## What is already done ✅
- Native Android (`android/`) and iOS (`ios/`) projects generated with Capacitor 8
- App ID `com.dariopatt.loopback`, version 1.0.0 (build 1)
- Android targets SDK 36 (meets the current Google Play requirement), portrait-locked
- iOS: iPhone-only, portrait-only, status bar hidden, encryption declared exempt (no export-compliance prompt)
- App icons (incl. Android adaptive icons) and splash screens for every size, generated from `assets/`
- Saves stored in native Preferences on device (not wiped by iOS like web storage can be)
- Android back button handled (pause → menu → exit), app pauses when backgrounded
- Native haptics and native share sheet
- In-app privacy policy (`www/privacy.html`), no data collection, no ads, fully offline
- Store texts, rating answers, data-safety answers: [store/STORE_LISTING.md](store/STORE_LISTING.md)
- Store screenshots for Google Play and iPhone 6.9": `store/screenshots/` (`npm run screenshots`)
- GitHub Pages workflow that hosts the web version and the privacy-policy URL

## Before anything: two decisions
1. **App ID.** `com.dariopatt.loopback` can never change after your first upload. To change it, edit
   `appId` in `capacitor.config.json`, `applicationId` + `namespace` in `android/app/build.gradle`
   (and move `MainActivity.java` to the matching package folder), and `PRODUCT_BUNDLE_IDENTIFIER` in
   Xcode. Easiest: delete `android/` and `ios/`, change `capacitor.config.json`, then run
   `npx cap add android`, `npx cap add ios` and `npm run assets` and re-apply the tweaks listed in
   *Native tweaks* below.
2. **Contact email.** Replace `CONTACT_EMAIL` in `www/privacy.html` with the address you want shown
   publicly.

## Step 1: Host the privacy policy (free, about 10 minutes)
1. Push this repo to GitHub (it can be private only on paid plans for Pages; a public repo is fine:
   it contains no secrets).
2. GitHub → repo → *Settings → Pages → Source: GitHub Actions*.
3. Push to `main`. The *Deploy web version* workflow publishes `www/`.
4. Your URLs: `https://<user>.github.io/<repo>/privacy.html` (privacy) and `https://<user>.github.io/<repo>/`
   (playable web version, nice as a "website" link in the store listings).

## Step 2: Google Play
**Accounts and tools**
- Google Play Console developer account ($25 one-time, ID verification takes a few days).
- Android Studio (includes the Android SDK; Java 21 is already installed on this PC).

**Build a signed release**
1. `npm run android`: syncs the web code and opens Android Studio.
2. *Build → Generate Signed App Bundle / APK → Android App Bundle*.
3. Create a new upload keystore. **Back it up and keep the passwords safe**: losing it means you can't
   publish updates without going through Google's key-reset process.
4. Release build → `android/app/release/app-release.aab`.

**Play Console**
1. Create app → name from STORE_LISTING.md, *Game*, *Free*.
2. Fill in *App content*: privacy policy URL, ads (no), content rating, target audience (13+),
   data safety (no data collected). All answers are in STORE_LISTING.md.
3. Store listing: texts, icon `www/icon-512.png`, feature graphic (1024×500, still to make), screenshots
   from `store/screenshots/google-play/`.
4. **Testing → Internal testing**: upload the `.aab` and install it on your own phone first.
5. **Closed testing**: new personal developer accounts must run a closed test with at least 12 testers
   opted in for 14 consecutive days before production access is unlocked (check the current rule in
   Play Console; Google changes it occasionally). Start this as early as possible.
6. Apply for production access → roll out.

## Step 3: App Store (iOS)
**Accounts and tools**
- Apple Developer Program ($99/year).
- A Mac with Xcode, **or** a cloud build service. On Windows the simplest path is
  [Codemagic](https://codemagic.io) (it has a Capacitor/Ionic workflow and signs with your Apple account)
  or a rented cloud Mac (e.g. MacinCloud).

**Build (on a Mac)**
1. `npm install`, then `npm run ios`: syncs and opens Xcode. The project uses Swift Package Manager,
   so no CocoaPods are needed.
2. *App target → Signing & Capabilities*: pick your team. Xcode creates the bundle ID `com.dariopatt.loopback`.
3. Test on a real iPhone (plug it in, press ▶).
4. *Product → Archive → Distribute App → App Store Connect*.

**App Store Connect**
1. *My Apps → +* → new app with the same bundle ID and the name from STORE_LISTING.md.
2. App Privacy → *Data Not Collected*. Age rating → 4+. Pricing → Free.
3. Upload screenshots from `store/screenshots/app-store-6.9/`, texts, keywords, privacy URL.
4. Add the build that Xcode uploaded, then send to **TestFlight** first, then *Submit for Review*
   (usually 1–2 days).

## Shipping updates
1. Change code in `www/`.
2. Bump versions: `versionCode` + `versionName` in `android/app/build.gradle`, and *Version* + *Build*
   in Xcode (or `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION`). Also `VERSION` in `www/game.js` and
   `CACHE` in `www/sw.js`.
3. `npx cap sync`, then build and upload as above.

## Native tweaks (re-apply if you ever regenerate `android/` or `ios/`)
- `android/app/src/main/AndroidManifest.xml`: `android:screenOrientation="portrait"` on `MainActivity`.
- `ios/App/App/Info.plist`: only `UIInterfaceOrientationPortrait`, remove the `~ipad` orientations,
  add `ITSAppUsesNonExemptEncryption = NO`, `UIRequiresFullScreen = YES`, `UIStatusBarHidden = YES`.
- Xcode project: `TARGETED_DEVICE_FAMILY = 1` (iPhone only).

## Known gaps (worth doing before or soon after launch)
- **Feature graphic** for Google Play (1024×500): use the Midjourney banner prompt.
- **Real-device test** of haptics, back button, share sheet and save persistence on both platforms.
- **Human playtests** for balance (all balancing so far was done with a bot).
